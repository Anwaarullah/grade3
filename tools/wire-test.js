#!/usr/bin/env node
/*
 * Wire test for accounts and sync (development only, not needed on the server).
 *
 *   node tools/wire-test.js
 *
 * Unlike tools/accounts-test.js (a fake client), this runs the real supabase-js from
 * js/vendor/ in headless Chromium, against a small local imitation of Supabase's HTTP API
 * (GoTrue for sign-in, PostgREST for the tables) that follows backend/schema.sql: the same
 * columns, row ownership, and the triggers that count resets (and clear or skip records from
 * before them) and stamp the consent time. It checks what actually goes over the wire. Nothing goes to the internet. Takes about
 * a minute (one check waits for supabase-js's own retry timing). Exit code 1 if anything failed.
 */
const path = require('path');
const fs = require('fs');
const http = require('http');
const crypto = require('crypto');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const ANON = 'anon-key-for-tests';

/* ------------------------------------------------------------------ *
 * Imitation Supabase
 * ------------------------------------------------------------------ */
const TABLES = {
  parents: { cols: ['id', 'consent_version', 'consented_at', 'created_at'], pk: ['id'] },
  children: { cols: ['id', 'parent_id', 'name', 'avatar', 'reset_gen', 'reset_id', 'recent_reset_ids', 'reset_at', 'created_at', 'updated_at'], pk: ['id'] },
  progress: { cols: ['child_id', 'activity_id', 'stars', 'plays', 'first_try', 'answered', 'last_played', 'mistakes', 'reset_gen', 'updated_at'], pk: ['child_id', 'activity_id'] },
};
const db = { parents: [], children: [], progress: [] };
const sb = { users: {}, codes: {}, tokens: {}, log: [], lastOtp: null };

function b64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function newSession(u) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  const payload = { sub: u.id, email: u.email, role: 'authenticated', aud: 'authenticated', exp: exp };
  const at = b64url(Buffer.from('{"alg":"HS256","typ":"JWT"}')) + '.' + b64url(Buffer.from(JSON.stringify(payload))) + '.' + crypto.randomBytes(8).toString('hex');
  const rt = crypto.randomBytes(8).toString('hex');
  sb.tokens[at] = u;
  sb.tokens['rt:' + rt] = u;
  return { access_token: at, token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: rt, user: userJson(u) };
}
function userJson(u) {
  return { id: u.id, aud: 'authenticated', role: 'authenticated', email: u.email, app_metadata: { provider: 'email' }, user_metadata: {}, created_at: new Date().toISOString() };
}
function revokeAll() {
  sb.tokens = {};
}
function send(res, code, body, headers) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', '*');
  Object.keys(headers || {}).forEach((k) => res.setHeader(k, headers[k]));
  if (body === undefined) {
    res.writeHead(code);
    return res.end();
  }
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(code);
  res.end(JSON.stringify(body));
}
function pgError(res, status, code, message) {
  send(res, status, { code: code, message: message, details: null, hint: null });
}
function owns(table, row, u) {
  if (table === 'parents') return row.id === u.id;
  if (table === 'children') return row.parent_id === u.id;
  return db.children.some((c) => c.id === row.child_id && c.parent_id === u.id);
}
function filtersOf(query) {
  return Object.keys(query)
    .filter((k) => ['select', 'columns', 'on_conflict'].indexOf(k) === -1)
    .map((k) => {
      const v = query[k];
      if (v.indexOf('eq.') === 0) return (r) => String(r[k]) === v.slice(3);
      const m = /^in\.\((.*)\)$/.exec(v);
      const vals = m ? m[1].split(',').map((x) => x.replace(/^"|"$/g, '')) : [];
      return (r) => vals.indexOf(String(r[k])) !== -1;
    });
}
/** Triggers keep_latest_reset and clear_progress_before_reset: the database counts resets (an id among the last 20 only once). */
function resetTrigger(old, row, now) {
  const recent = (old && old.recent_reset_ids) || [];
  if (!old) {
    row.reset_gen = row.reset_gen || 0;
    row.reset_at = row.reset_gen > 0 ? now : null;
    row.recent_reset_ids = row.reset_id ? [row.reset_id] : [];
  } else if (row.reset_id && row.reset_id !== old.reset_id && recent.indexOf(row.reset_id) === -1) {
    row.reset_gen = (old.reset_gen || 0) + 1;
    row.reset_at = now;
    row.recent_reset_ids = [row.reset_id].concat(recent).slice(0, 20);
  } else {
    row.reset_gen = old.reset_gen || 0;
    row.reset_id = old.reset_id || null;
    row.reset_at = old.reset_at || null;
    row.recent_reset_ids = recent;
  }
}
/** Trigger keep_richer_progress (the rule of mergeRecord in js/sync.js): a stored record is never lowered. null: skipped. */
function keepRicher(old, r) {
  if ((r.reset_gen || 0) !== (old.reset_gen || 0)) return (r.reset_gen || 0) > (old.reset_gen || 0) ? r : null;
  const t = (x) => (x ? Date.parse(x) : 0);
  const key = (m) => JSON.stringify(Object.keys(m || {}).sort().map((k) => [k, Number(m[k]) || 0]));
  let diff = (r.answered || 0) - (old.answered || 0);
  if (!diff) diff = t(r.last_played) - t(old.last_played);
  if (!diff) diff = (r.first_try || 0) - (old.first_try || 0);
  if (diff < 0 || (!diff && key(r.mistakes) < key(old.mistakes))) Object.assign(r, { answered: old.answered, first_try: old.first_try, mistakes: old.mistakes });
  r.stars = Math.max(r.stars || 0, old.stars || 0);
  r.plays = Math.max(r.plays || 0, old.plays || 0);
  if (t(old.last_played) > t(r.last_played)) r.last_played = old.last_played;
  return r;
}
function clearBeforeReset(old, row) {
  if (old && row.reset_gen > (old.reset_gen || 0)) db.progress = db.progress.filter((p) => p.child_id !== row.id || (p.reset_gen || 0) >= row.reset_gen);
}
function representation(req, query, rows, res, code) {
  if (!/return=representation/.test(req.headers.prefer || '')) return send(res, code === 200 ? 204 : code);
  const cols = (query.select || '*').split(',');
  return send(res, code, rows.map((r) => (cols[0] === '*' ? r : cols.reduce((o, c) => ((o[c] = r[c] === undefined ? null : r[c]), o), {}))));
}
function rest(req, res, table, query, body) {
  const auth = (req.headers.authorization || '').replace(/^Bearer /, '');
  const u = auth === ANON ? null : sb.tokens[auth];
  if (auth !== ANON && !u) return pgError(res, 401, 'PGRST301', 'JWT expired');
  if (table === 'rpc/delete_my_account') {
    if (!u) return pgError(res, 403, '42501', 'You need to be signed in to delete your account.');
    const kids = db.children.filter((c) => c.parent_id === u.id).map((c) => c.id);
    db.progress = db.progress.filter((p) => kids.indexOf(p.child_id) === -1);
    db.children = db.children.filter((c) => c.parent_id !== u.id);
    db.parents = db.parents.filter((p) => p.id !== u.id);
    delete sb.users[u.email];
    Object.keys(sb.tokens).forEach((t) => sb.tokens[t].id === u.id && delete sb.tokens[t]);
    return send(res, 204);
  }
  const t = TABLES[table];
  if (!t) return pgError(res, 404, '42P01', 'relation "public.' + table + '" does not exist');
  // backend/schema.sql revokes everything from anon.
  if (!u) return pgError(res, 401, '42501', 'permission denied for table ' + table);
  const filters = filtersOf(query);
  if (req.method === 'GET') {
    const cols = (query.select || '*').split(',');
    const bad = cols.filter((c) => c !== '*' && t.cols.indexOf(c) === -1)[0];
    if (bad) return pgError(res, 400, '42703', 'column ' + table + '.' + bad + ' does not exist');
    const rows = db[table].filter((r) => owns(table, r, u) && filters.every((f) => f(r)));
    return send(res, 200, rows.map((r) => (cols[0] === '*' ? r : cols.reduce((o, c) => ((o[c] = r[c] === undefined ? null : r[c]), o), {}))));
  }
  if (req.method === 'DELETE') {
    const gone = db[table].filter((r) => owns(table, r, u) && filters.every((f) => f(r)));
    db[table] = db[table].filter((r) => gone.indexOf(r) === -1);
    if (table === 'children') db.progress = db.progress.filter((p) => !gone.some((c) => c.id === p.child_id));
    return send(res, 204);
  }
  if (req.method === 'PATCH') {
    const extra = Object.keys(body).filter((k) => t.cols.indexOf(k) === -1)[0];
    if (extra) return pgError(res, 400, 'PGRST204', "Could not find the '" + extra + "' column of '" + table + "' in the schema cache");
    if (table !== 'children') return pgError(res, 400, 'PGRST000', 'only children are updated');
    const now = new Date().toISOString();
    const hit = db.children.filter((r) => owns(table, r, u) && filters.every((f) => f(r)));
    hit.forEach((old) => {
      const row = Object.assign({}, old, body);
      resetTrigger(old, row, now);
      row.updated_at = now;
      clearBeforeReset(old, row);
      Object.assign(old, row);
    });
    return representation(req, query, hit, res, 200);
  }
  if (req.method !== 'POST') return pgError(res, 405, 'PGRST000', 'method');
  if (!/resolution=merge-duplicates/.test(req.headers.prefer || '')) return pgError(res, 400, 'PGRST000', 'only upserts are expected');
  const rows = Array.isArray(body) ? body : [body];
  const now = new Date().toISOString();
  const done = [];
  for (const r of rows) {
    const extra = Object.keys(r).filter((k) => t.cols.indexOf(k) === -1)[0];
    if (extra) return pgError(res, 400, 'PGRST204', "Could not find the '" + extra + "' column of '" + table + "' in the schema cache");
    const old = db[table].find((x) => t.pk.every((k) => String(x[k]) === String(r[k])));
    if (old && !owns(table, old, u)) return pgError(res, 403, '42501', 'new row violates row-level security policy for table "' + table + '"');
    const row = Object.assign({}, old || {}, r);
    if (!owns(table, row, u)) return pgError(res, 403, '42501', 'new row violates row-level security policy for table "' + table + '"');
    if (table === 'parents') {
      // trigger set_consented_at
      row.consented_at = !old || old.consent_version !== r.consent_version ? now : old.consented_at;
      row.created_at = old ? old.created_at : now;
    }
    if (table === 'children') {
      if (!db.parents.some((p) => p.id === row.parent_id)) return pgError(res, 409, '23503', 'violates foreign key constraint "children_parent_id_fkey"');
      if (!old && db.children.filter((c) => c.parent_id === row.parent_id).length >= 10) return pgError(res, 400, '23514', 'A family can have at most 10 child profiles.');
      resetTrigger(old, row, now);
      row.updated_at = now;
    }
    if (table === 'progress') {
      const child = db.children.find((c) => c.id === row.child_id);
      if (!child) return pgError(res, 409, '23503', 'violates foreign key constraint "progress_child_id_fkey"');
      if ((row.reset_gen || 0) < (child.reset_gen || 0)) continue; // trigger skip_progress_before_reset
      if (old && !keepRicher(old, row)) continue;
      if (row.last_played) row.last_played = new Date(row.last_played).toISOString().replace('Z', '+00:00');
      row.updated_at = now;
    }
    done.push([old, row]);
  }
  done.forEach(([old, row]) => {
    if (table === 'children') clearBeforeReset(old, row);
    if (old) Object.assign(old, row);
    else db[table].push(row);
  });
  return representation(req, query, done.map((x) => x[0] || x[1]), res, 201);
}
function gotrue(req, res, route, query, body) {
  if (route === 'otp') {
    const email = body.email;
    if (!sb.users[email]) sb.users[email] = { id: crypto.randomUUID(), email: email };
    const code = 'code-' + crypto.randomBytes(6).toString('hex');
    sb.codes[code] = { user: sb.users[email], challenge: body.code_challenge };
    sb.lastOtp = code;
    return send(res, 200, {});
  }
  if (route === 'verify') {
    const to = new URL(query.redirect_to);
    to.searchParams.set('code', query.token);
    return send(res, 303, undefined, { Location: to.toString() });
  }
  if (route === 'token' && query.grant_type === 'pkce') {
    const c = sb.codes[body.auth_code];
    delete sb.codes[body.auth_code];
    const ok = c && b64url(crypto.createHash('sha256').update(body.code_verifier || '').digest()) === c.challenge;
    if (!ok) return send(res, 404, { code: 404, error_code: 'flow_state_not_found', msg: 'invalid flow state, no valid flow state found' });
    return send(res, 200, newSession(c.user));
  }
  if (route === 'token' && query.grant_type === 'refresh_token') {
    const u = sb.tokens['rt:' + body.refresh_token];
    if (!u) return send(res, 400, { code: 400, error_code: 'refresh_token_not_found', msg: 'Invalid Refresh Token: Refresh Token Not Found' });
    return send(res, 200, newSession(u));
  }
  const u = sb.tokens[(req.headers.authorization || '').replace(/^Bearer /, '')];
  if (route === 'user') return u ? send(res, 200, userJson(u)) : send(res, 401, { code: 401, msg: 'invalid JWT' });
  if (route === 'logout') return u ? send(res, 204) : send(res, 404, { code: 404, error_code: 'user_not_found', msg: 'User from sub claim in JWT does not exist' });
  return send(res, 404, { msg: 'no route ' + route });
}
function startApi() {
  const srv = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      if (req.method === 'OPTIONS') return send(res, 204);
      const u = new URL(req.url, 'http://x');
      const query = Object.fromEntries(u.searchParams.entries());
      const raw = Buffer.concat(chunks).toString();
      let body = {};
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch (e) {}
      sb.log.push({ method: req.method, path: u.pathname, query: query, body: body });
      if (u.pathname !== '/auth/v1/verify' && req.headers.apikey !== ANON) return send(res, 401, { message: 'No API key found in request' });
      if (u.pathname.indexOf('/rest/v1/') === 0) return rest(req, res, u.pathname.slice(9), query, body);
      if (u.pathname.indexOf('/auth/v1/') === 0) return gotrue(req, res, u.pathname.slice(9), query, body);
      send(res, 404, {});
    });
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv)));
}
function startSite() {
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
  const srv = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path.join(ROOT, p === '/' ? '/index.html' : p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv)));
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */
let failed = 0;
let passed = 0;
function check(name, ok, detail) {
  if (ok) passed++;
  else failed++;
  console.log((ok ? '✓ ' : '✗ ') + name + (ok || !detail ? '' : ' — ' + detail));
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let browser, SITE, API;
const pageErrors = [];
async function device(name) {
  const ctx = await browser.newContext();
  // Pass the grown-ups' gate for this test.
  await ctx.addInitScript(() => {
    try {
      sessionStorage.setItem('g3maths.gate', String(Date.now()));
    } catch (e) {}
  });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const config = `window.MQ = window.MQ || {}; window.MQ.config = { supabaseUrl: ${JSON.stringify(API)}, supabaseAnonKey: ${JSON.stringify(ANON)}, contactEmail: 'help@example.test', siteName: 'Grade 3 Maths', consentVersion: '2026-11' };`;
  await ctx.route(/\/js\/config\.js(\?.*)?$/, (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: config }));
  const dev = { name, ctx, down: false };
  // Test switch: the sign-in and database service cannot be reached (the browser still says online).
  await ctx.route(API + '/**', (r) => (dev.down ? r.abort('internetdisconnected') : r.continue()));
  dev.page = await ctx.newPage();
  dev.page.on('pageerror', (e) => pageErrors.push(name + ': ' + e.message));
  return dev;
}
const idle = (p, ms = 10000) => p.waitForFunction(() => window.MQ && MQ.sync.state.ready && MQ.sync.state.status !== 'syncing', null, { timeout: ms }).catch(() => {});
async function signIn(dev, email, agree) {
  const p = dev.page;
  await p.goto(SITE + '/index.html#parent');
  await idle(p);
  await p.evaluate((e) => MQ.sync.sendEmailLink(e), email);
  await p.goto(API + '/auth/v1/verify?type=magiclink&token=' + sb.lastOtp + '&redirect_to=' + encodeURIComponent(SITE + '/index.html#parent'));
  await p.waitForFunction(() => window.MQ && MQ.sync.state.consentKnown, null, { timeout: 10000 });
  await idle(p);
  if (agree && !(await p.evaluate(() => MQ.sync.state.consented))) {
    await p.evaluate(() => MQ.sync.giveConsent());
    await idle(p);
  }
}
const starsOf = (p, name) => p.evaluate((n) => MQ.store.totalStars(MQ.store.children().filter((c) => c.name === n)[0].id), name);
const posts = (pathname) => sb.log.filter((e) => e.method === 'POST' && e.path === pathname);

/* ------------------------------------------------------------------ *
 * The tests
 * ------------------------------------------------------------------ */
async function main() {
  const api = await startApi();
  const site = await startSite();
  API = 'http://127.0.0.1:' + api.address().port;
  SITE = 'http://127.0.0.1:' + site.address().port;
  browser = await chromium.launch();

  // Placeholder and consent time: a device with an unused "Player 1" and Asha signs in to an empty account.
  const A = await device('A');
  await A.page.goto(SITE + '/index.html#home');
  await A.page.evaluate(() => {
    MQ.store.addChild('Asha', '🐯');
    const r = MQ.store.activity('tally-marks');
    Object.assign(r, { plays: 2, stars: 3, firstTry: 14, answered: 16, lastPlayed: new Date(Date.now() - 60000).toISOString() });
    MQ.store.save();
  });
  sb.log = [];
  await signIn(A, 'p@example.test', true);
  const kidsSent = [].concat(...posts('/rest/v1/children').map((e) => e.body));
  check('consent: only the profiles listed are uploaded (no unused "Player 1")', kidsSent.length === 1 && kidsSent[0].name === 'Asha', JSON.stringify(kidsSent.map((k) => k.name)));
  const consentPost = posts('/rest/v1/parents')[0];
  check('consent: the device does not send the consent time; the database sets it', consentPost && !('consented_at' in consentPost.body) && db.parents[0] && Date.now() - Date.parse(db.parents[0].consented_at) < 60000, JSON.stringify(consentPost && consentPost.body));

  // Reset on A reaches B and stays reset everywhere.
  const B = await device('B');
  await signIn(B, 'p@example.test', true);
  check('device B: gets the stars', (await starsOf(B.page, 'Asha')) === 3);
  await A.page.evaluate(() => MQ.store.reset(MQ.store.children().filter((c) => c.name === 'Asha')[0].id));
  await sleep(1600);
  await idle(A.page);
  await B.page.evaluate(() => MQ.sync.syncNow());
  await idle(B.page);
  await A.page.evaluate(() => MQ.sync.syncNow());
  await idle(A.page);
  const asha = db.children.find((c) => c.name === 'Asha');
  const rows = db.progress.filter((r) => r.child_id === asha.id);
  check(
    'reset: both devices and the cloud end at 0 stars, and the reset time is stored with the child',
    (await starsOf(A.page, 'Asha')) === 0 && (await starsOf(B.page, 'Asha')) === 0 && rows.every((r) => r.stars === 0) && !!asha.reset_at,
    JSON.stringify({ a: await starsOf(A.page, 'Asha'), b: await starsOf(B.page, 'Asha'), cloud: rows.map((r) => r.stars), reset_at: asha.reset_at })
  );

  // Removed on B, then renamed on A before A has fetched: A only updates the child (PATCH), so
  // the child is not added back, and A drops it too.
  await A.page.evaluate(() => MQ.store.addChild('Ben', '🐸'));
  await sleep(1600);
  await idle(A.page);
  await B.page.evaluate(() => MQ.sync.syncNow());
  await idle(B.page);
  const ben = db.children.find((c) => c.name === 'Ben');
  await B.page.evaluate((id) => MQ.store.removeChild(id), ben && ben.id);
  await sleep(1600);
  await idle(B.page);
  sb.log = [];
  // (Sent at once, before A's usual fetch-first: the removal can also land between the two.)
  await A.page.evaluate((id) => {
    MQ.store.updateChild(id, { avatar: '🦁', name: 'Benji' });
    return MQ.sync.pushNow();
  }, ben && ben.id);
  await sleep(1600);
  await idle(A.page);
  await B.page.evaluate(() => MQ.sync.syncNow());
  await idle(B.page);
  const patch = sb.log.filter((e) => e.method === 'PATCH' && e.path === '/rest/v1/children')[0];
  const reAdded = posts('/rest/v1/children').some((e) => [].concat(e.body).some((k) => k.id === (ben && ben.id)));
  const namesOf = (p) => p.evaluate(() => MQ.store.children().map((c) => c.name));
  check(
    'removed on B, renamed on A without fetching: not added back; A sends an update (PATCH id=eq.) and drops the child',
    !!ben && !db.children.some((c) => c.id === ben.id) && !reAdded && !!patch && patch.query.id === 'eq.' + ben.id && /reset_gen/.test(patch.query.select || '') && (await namesOf(A.page)).indexOf('Benji') === -1 && (await namesOf(B.page)).indexOf('Benji') === -1,
    JSON.stringify({ cloud: db.children.map((c) => c.name), patch: patch && patch.query, reAdded, a: await namesOf(A.page), b: await namesOf(B.page) })
  );

  // The refresh token was revoked and the access token has expired: Sign out still works.
  await B.page.evaluate(() => {
    const k = Object.keys(localStorage).filter((x) => /^sb-.*-auth-token$/.test(x))[0];
    const s = JSON.parse(localStorage.getItem(k));
    s.expires_at = Math.floor(Date.now() / 1000) - 60;
    localStorage.setItem(k, JSON.stringify(s));
  });
  revokeAll();
  const out = await B.page.evaluate(() => MQ.sync.signOut().then(() => 'ok', (e) => 'refused: ' + e.message));
  const bAfter = await B.page.evaluate(() => ({ kids: MQ.store.children().map((c) => c.name), account: !!MQ.store.raw().accountId, user: MQ.sync.state.user }));
  check('revoked sign-in: Sign out signs out and clears the device', out === 'ok' && !bAfter.user && !bAfter.account && bAfter.kids.join() === 'Player 1', out + ' ' + JSON.stringify(bAfter));

  // Next morning on a poor connection: the access token has expired and the service cannot be reached.
  const C = await device('C');
  await signIn(C, 'p@example.test', true);
  await C.page.evaluate(() => {
    const k = Object.keys(localStorage).filter((x) => /^sb-.*-auth-token$/.test(x))[0];
    const s = JSON.parse(localStorage.getItem(k));
    s.expires_at = Math.floor(Date.now() / 1000) - 60;
    localStorage.setItem(k, JSON.stringify(s));
  });
  C.down = true;
  const t0 = Date.now();
  await C.page.reload();
  await C.page.waitForFunction(() => window.MQ && MQ.sync.state.ready, null, { timeout: 15000 }).catch(() => {});
  const waited = Date.now() - t0;
  await sleep(300);
  const panel = await C.page.textContent('#acct-panel');
  check('offline with an expired sign-in: stops saying "Connecting…" within seconds, no sign-in card', waited < 9000 && !(await C.page.$('#acct-email')) && /Could not reach your account yet/.test(panel), waited + 'ms ' + panel.slice(0, 160));
  check('offline with an expired sign-in: the children stay on the device', (await C.page.evaluate(() => MQ.store.children().map((c) => c.name))).indexOf('Asha') !== -1);
  C.down = false;
  await C.page.evaluate(() => window.dispatchEvent(new Event('online')));
  const back = await C.page.waitForFunction(() => MQ.sync.state.user && MQ.sync.state.status === 'saved', null, { timeout: 60000 }).then(() => true, () => false);
  check('offline with an expired sign-in: signed in again once the connection is back', back, JSON.stringify(await C.page.evaluate(() => MQ.sync.state)));

  // Signed out while supabase-js was still renewing the expired sign-in without a connection:
  // when the connection comes back, its renewal must not sign the device back in.
  const D = await device('D');
  await signIn(D, 'p@example.test', true);
  await D.page.evaluate(() => {
    const k = Object.keys(localStorage).filter((x) => /^sb-.*-auth-token$/.test(x))[0];
    const s = JSON.parse(localStorage.getItem(k));
    s.expires_at = Math.floor(Date.now() / 1000) - 60;
    localStorage.setItem(k, JSON.stringify(s));
  });
  D.down = true;
  await D.page.reload();
  await D.page.waitForFunction(() => window.MQ && MQ.sync.state.ready && MQ.sync.state.reconnecting, null, { timeout: 15000 }).catch(() => {});
  const outD = await D.page.evaluate(() => MQ.sync.signOut().then(() => 'ok', (e) => 'refused: ' + e.message));
  const mark = sb.log.length;
  await sleep(1500);
  D.down = false;
  const since = () => sb.log.slice(mark);
  const isRefresh = (e) => e.path === '/auth/v1/token' && e.query.grant_type === 'refresh_token';
  for (let i = 0; i < 80 && !since().some(isRefresh); i++) await sleep(500);
  await sleep(3000);
  const dAfter = await D.page.evaluate(() => ({
    user: MQ.sync.state.user,
    kids: MQ.store.children().map((c) => c.name),
    sess: Object.keys(localStorage).some((x) => /^sb-.*-auth-token$/.test(x)),
  }));
  const pulled = since().some((e) => e.method === 'GET' && e.path === '/rest/v1/children');
  check(
    'signed out while the expired sign-in was being renewed offline: stays signed out when the connection returns',
    outD === 'ok' && since().some(isRefresh) && !dAfter.user && !dAfter.sess && dAfter.kids.join() === 'Player 1' && !pulled,
    JSON.stringify({ outD, renewed: since().some(isRefresh), dAfter, pulled })
  );
  check('the renewed sign-in is ended on the server too', since().some((e) => e.path === '/auth/v1/logout'), JSON.stringify(since().map((e) => e.method + ' ' + e.path)));
  await signIn(D, 'p@example.test', true);
  check('signing in again on that device afterwards works', !!(await D.page.evaluate(() => MQ.sync.state.user)) && (await D.page.evaluate(() => MQ.store.children().map((c) => c.name))).indexOf('Asha') !== -1);

  check('no page errors', pageErrors.length === 0, pageErrors.slice(0, 5).join(' | '));
  await browser.close();
  api.close();
  site.close();
}

main()
  .catch((e) => check('test run finished', false, e.stack || String(e)))
  .then(async () => {
    try {
      if (browser) await browser.close();
    } catch (e) {}
    console.log('\n' + passed + ' passed, ' + failed + ' failed');
    process.exit(failed ? 1 : 0);
  });

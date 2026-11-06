#!/usr/bin/env node
/*
 * Accounts, child profiles and sync test (development only, not needed on the server).
 *
 *   node tools/accounts-test.js
 *   node tools/accounts-test.js --headed      # watch it run
 *
 * Serves the site from a tiny local web server and opens it in headless Chromium. Several
 * browser contexts play the part of several devices. js/config.js is replaced by a test
 * config whose createClient returns a FAKE Supabase client; the fake's "cloud" lives in this
 * Node process and enforces per-family ownership the way the row-level security rules in
 * backend/schema.sql do. Nothing goes to the internet. Exit code 1 if anything failed.
 */
const path = require('path');
const fs = require('fs');
const http = require('http');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const headed = process.argv.includes('--headed');
const CONSENT_VERSION = '2026-11';
const CONTACT = 'family-help@example.test';

/* ------------------------------------------------------------------ *
 * Static server
 * ------------------------------------------------------------------ */
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon' };
function startServer() {
  const srv = http.createServer((req, res) => {
    const u = decodeURIComponent(req.url.split('?')[0]);
    const file = path.join(ROOT, u === '/' ? '/index.html' : u);
    if (!file.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end();
    }
    fs.readFile(file, (err, buf) => {
      if (err) {
        res.writeHead(404);
        return res.end('not found');
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(buf);
    });
  });
  return new Promise((resolve) => srv.listen(0, '127.0.0.1', () => resolve(srv)));
}

/* ------------------------------------------------------------------ *
 * Fake cloud (one shared "Supabase project" for every device)
 * ------------------------------------------------------------------ */
const cloud = { users: {}, tokens: {}, codes: {}, outbox: [], parents: {}, children: {}, progress: {}, n: 0, progressUpserts: 0, signOutScopes: [] };
function newId(p) {
  cloud.n++;
  return p + '-' + cloud.n + '-' + Math.random().toString(16).slice(2, 10);
}
function rlsError() {
  return { data: null, error: { code: '42501', message: 'new row violates row-level security policy' } };
}
function ownedChild(uid, cid) {
  const c = cloud.children[cid];
  return c && c.parent_id === uid;
}
function applyFilters(rows, filters) {
  return rows.filter((r) => (filters || []).every(([c, op, v]) => (op === 'eq' ? r[c] === v : v.indexOf(r[c]) !== -1)));
}
function pickCols(rows, cols) {
  if (!cols || cols === '*') return rows.map((r) => Object.assign({}, r));
  const list = cols.split(',').map((s) => s.trim());
  return rows.map((r) => {
    const o = {};
    list.forEach((k) => (o[k] = r[k]));
    return o;
  });
}
/**
 * Like the keep_latest_reset and clear_progress_before_reset triggers: the database counts
 * resets, and a reset id it has seen among the last 20 is not counted again.
 */
function childRow(was, r) {
  const now = new Date().toISOString();
  if (!was) return Object.assign({}, r, { reset_gen: r.reset_gen || 0, reset_id: r.reset_id || null, recent_reset_ids: r.reset_id ? [r.reset_id] : [], reset_at: r.reset_gen > 0 ? now : null });
  const row = Object.assign({}, was, r);
  const recent = was.recent_reset_ids || [];
  if (r.reset_id && r.reset_id !== was.reset_id && recent.indexOf(r.reset_id) === -1) Object.assign(row, { reset_gen: (was.reset_gen || 0) + 1, reset_at: now, recent_reset_ids: [r.reset_id].concat(recent).slice(0, 20) });
  else Object.assign(row, { reset_gen: was.reset_gen || 0, reset_id: was.reset_id || null, reset_at: was.reset_at || null, recent_reset_ids: recent });
  return row;
}
/** Like the keep_richer_progress trigger (the same rule as mergeRecord in js/sync.js): a stored record is never lowered. null: skipped. */
function keepRicher(old, r) {
  if (!old) return r;
  if ((r.reset_gen || 0) !== (old.reset_gen || 0)) return (r.reset_gen || 0) > (old.reset_gen || 0) ? r : null;
  const t = (x) => (x ? Date.parse(x) : 0);
  const key = (m) => JSON.stringify(Object.keys(m || {}).sort().map((k) => [k, Number(m[k]) || 0]));
  let diff = (r.answered || 0) - (old.answered || 0);
  if (!diff) diff = t(r.last_played) - t(old.last_played);
  if (!diff) diff = (r.first_try || 0) - (old.first_try || 0);
  const out = Object.assign({}, r);
  if (diff < 0 || (!diff && key(r.mistakes) < key(old.mistakes))) Object.assign(out, { answered: old.answered, first_try: old.first_try, mistakes: old.mistakes });
  out.stars = Math.max(r.stars || 0, old.stars || 0);
  out.plays = Math.max(r.plays || 0, old.plays || 0);
  out.last_played = t(old.last_played) > t(r.last_played) ? old.last_played : r.last_played || old.last_played || null;
  return out;
}
function clearBeforeReset(c) {
  Object.keys(cloud.progress).forEach((k) => {
    const p = cloud.progress[k];
    if (p.child_id === c.id && (p.reset_gen || 0) < (c.reset_gen || 0)) delete cloud.progress[k];
  });
}
function cloudHandle(req) {
  const ok = (data) => ({ data: data, error: null });
  const a = req.args || {};
  if (req.op === 'otp') {
    // Like Supabase's built-in email service before custom SMTP is set up.
    if (/^blocked/.test(a.email)) return { data: null, error: { name: 'AuthApiError', status: 400, message: 'Email address not authorized' } };
    const code = newId('code');
    cloud.codes[code] = a.email.toLowerCase();
    cloud.outbox.push({ email: a.email.toLowerCase(), code: code, redirect: a.redirect });
    return ok({});
  }
  if (req.op === 'oauth') {
    const code = newId('code');
    cloud.codes[code] = 'google.parent@example.test';
    return ok({ code: code });
  }
  if (req.op === 'exchange') {
    const email = cloud.codes[a.code];
    if (!email) return { data: null, error: { message: 'invalid or used code' } };
    delete cloud.codes[a.code];
    if (!cloud.users[email]) cloud.users[email] = { id: newId('user'), email: email };
    const token = newId('tok');
    cloud.tokens[token] = cloud.users[email].id;
    return ok({ session: { access_token: token, user: { id: cloud.users[email].id, email: email } } });
  }
  const uid = cloud.tokens[req.token] || null;
  if (req.op === 'signout') {
    cloud.signOutScopes.push(a.scope || 'global');
    delete cloud.tokens[req.token];
    return ok({});
  }
  if (req.op === 'rpc') {
    if (!uid) return { data: null, error: { message: 'not signed in' } };
    if (a.fn !== 'delete_my_account') return { data: null, error: { message: 'unknown function' } };
    Object.keys(cloud.children).forEach((cid) => {
      if (cloud.children[cid].parent_id !== uid) return;
      Object.keys(cloud.progress).forEach((k) => {
        if (cloud.progress[k].child_id === cid) delete cloud.progress[k];
      });
      delete cloud.children[cid];
    });
    delete cloud.parents[uid];
    Object.keys(cloud.users).forEach((e) => {
      if (cloud.users[e].id === uid) delete cloud.users[e];
    });
    Object.keys(cloud.tokens).forEach((t) => {
      if (cloud.tokens[t] === uid) delete cloud.tokens[t];
    });
    return ok(null);
  }
  if (req.op !== 'query') return { data: null, error: { message: 'unknown op ' + req.op } };
  const t = a.table;
  const tables = { parents: cloud.parents, children: cloud.children, progress: cloud.progress };
  if (!tables[t]) return { data: null, error: { message: 'no table ' + t } };
  if (a.kind === 'select') {
    if (!uid) return ok([]);
    let rows = Object.keys(tables[t]).map((k) => tables[t][k]);
    if (t === 'parents') rows = rows.filter((r) => r.id === uid);
    if (t === 'children') rows = rows.filter((r) => r.parent_id === uid);
    if (t === 'progress') rows = rows.filter((r) => ownedChild(uid, r.child_id));
    return ok(pickCols(applyFilters(rows, a.filters), a.payload));
  }
  if (a.kind === 'upsert') {
    if (!uid) return rlsError();
    const rows = a.payload;
    if (t === 'parents') {
      if (rows.some((r) => r.id !== uid)) return rlsError();
      cloud.consentSent = rows.map((r) => Object.keys(r));
      // Like the set_consented_at trigger: the database's clock, on first agreement or a new version.
      rows.forEach((r) => {
        const old = cloud.parents[r.id];
        const at = !old || old.consent_version !== r.consent_version ? new Date().toISOString() : old.consented_at;
        cloud.parents[r.id] = Object.assign({}, old || {}, r, { consented_at: at });
      });
      return ok(null);
    }
    if (t === 'children') {
      for (const r of rows) {
        if (r.parent_id !== uid) return rlsError();
        if (cloud.children[r.id] && cloud.children[r.id].parent_id !== uid) return rlsError();
        if (!cloud.parents[uid]) return { data: null, error: { code: '23503', message: 'insert or update on table "children" violates foreign key constraint "children_parent_id_fkey"' } };
      }
      const after = Object.assign({}, cloud.children);
      rows.forEach((r) => {
        after[r.id] = childRow(after[r.id], r);
      });
      if (Object.keys(after).filter((k) => after[k].parent_id === uid).length > 10) return { data: null, error: { code: 'P0001', message: 'A family can have at most 10 children' } };
      cloud.children = after;
      cloud.childUpserts = (cloud.childUpserts || 0) + rows.length;
      rows.forEach((r) => clearBeforeReset(after[r.id]));
      return ok(a.returning ? pickCols(rows.map((r) => after[r.id]), a.returning) : null);
    }
    if (t === 'progress') {
      for (const r of rows) {
        if (!ownedChild(uid, r.child_id)) return rlsError();
        if (!(r.stars >= 0 && r.stars <= 3)) return { data: null, error: { code: '23514', message: 'stars out of range' } };
      }
      cloud.progressUpserts += rows.length;
      // Like Postgres: timestamptz comes back as '+00:00', jsonb keys in its own order.
      rows.forEach((r) => {
        // Like the skip_progress_before_reset trigger: records built before a reset are skipped.
        if ((r.reset_gen || 0) < (cloud.children[r.child_id].reset_gen || 0)) return;
        const k = r.child_id + '|' + r.activity_id;
        const kept = keepRicher(cloud.progress[k], r);
        if (!kept) return;
        const m = {};
        Object.keys(kept.mistakes || {}).reverse().forEach((x) => (m[x] = kept.mistakes[x]));
        cloud.progress[k] = Object.assign({}, kept, { mistakes: m, last_played: kept.last_played ? new Date(kept.last_played).toISOString().replace('Z', '+00:00') : null });
      });
      return ok(null);
    }
  }
  if (a.kind === 'update') {
    if (!uid) return rlsError();
    if (t !== 'children') return { data: null, error: { message: 'update not expected on ' + t } };
    // Like PostgREST: only this family's rows that match the filter; none -> an empty list.
    const hit = applyFilters(Object.keys(cloud.children).map((k) => cloud.children[k]), a.filters).filter((r) => r.parent_id === uid);
    cloud.childUpdates = (cloud.childUpdates || 0) + 1;
    const out = hit.map((was) => {
      const row = childRow(was, Object.assign({}, a.payload, { id: was.id, parent_id: was.parent_id }));
      cloud.children[was.id] = row;
      clearBeforeReset(row);
      return row;
    });
    return ok(a.returning ? pickCols(out, a.returning) : null);
  }
  if (a.kind === 'delete') {
    if (!uid) return ok(null);
    if (t !== 'children') return { data: null, error: { message: 'delete not expected on ' + t } };
    const gone = applyFilters(Object.keys(cloud.children).map((k) => cloud.children[k]), a.filters).filter((r) => r.parent_id === uid);
    gone.forEach((c) => {
      delete cloud.children[c.id];
      Object.keys(cloud.progress).forEach((k) => {
        if (cloud.progress[k].child_id === c.id) delete cloud.progress[k];
      });
    });
    return ok(null);
  }
  return { data: null, error: { message: 'unsupported ' + a.kind } };
}
function cloudKids(email) {
  const u = cloud.users[email];
  if (!u) return [];
  return Object.keys(cloud.children).map((k) => cloud.children[k]).filter((c) => c.parent_id === u.id);
}
function cloudRec(childId, aid) {
  return cloud.progress[childId + '|' + aid] || null;
}

/* The test js/config.js: same settings as the real one, plus a fake supabase-js v2 client. */
const TEST_CONFIG = `
window.MQ = window.MQ || {};
window.MQ.config = {
  supabaseUrl: '', supabaseAnonKey: '', contactEmail: ${JSON.stringify(CONTACT)},
  siteName: 'Interactive Maths', consentVersion: ${JSON.stringify(CONSENT_VERSION)},
  createClient: function () {
    // Test hook: the sign-in service cannot be reached when the page starts.
    if (localStorage.getItem('fake-start-fail')) throw new Error('net::ERR_FAILED (test: sign-in service unreachable)');
    return window.__makeFakeSupabase();
  }
};
window.__makeFakeSupabase = function () {
  var SKEY = 'fake-sb.session';
  var subs = [];
  function readS() { try { return JSON.parse(localStorage.getItem(SKEY)); } catch (e) { return null; } }
  function writeS(s) { if (s) localStorage.setItem(SKEY, JSON.stringify(s)); else localStorage.removeItem(SKEY); }
  // Test hooks in localStorage: 'fake-net-down' (requests fail although the browser says
  // online), 'fake-delay' (ms before each reply arrives), 'fake-fail-children' (the
  // database refuses child rows, like the 10-children limit) and 'fake-lose-reply' (a change
  // reaches the database but its reply is lost).
  function call(op, args) {
    if (navigator.onLine === false || localStorage.getItem('fake-net-down')) return Promise.resolve({ data: null, error: { message: 'TypeError: Failed to fetch' } });
    if (localStorage.getItem('fake-fail-children') && op === 'query' && args.table === 'children' && args.kind === 'upsert') return Promise.resolve({ data: null, error: { code: '23514', message: 'A family can have at most 10 child profiles. (test)' } });
    var s = readS();
    var delay = +localStorage.getItem('fake-delay') || 0;
    return window.__sb({ op: op, token: s ? s.access_token : null, args: args || {} }).then(function (res) {
      if (localStorage.getItem('fake-lose-reply') && !(op === 'query' && args.kind === 'select')) return { data: null, error: { message: 'TypeError: Failed to fetch' } };
      return delay ? new Promise(function (r) { setTimeout(function () { r(res); }, delay); }) : res;
    });
  }
  function fire(ev, s) { subs.slice().forEach(function (cb) { setTimeout(function () { cb(ev, s); }, 0); }); }
  // Like supabase-js detectSessionInUrl: the ?code= is read a moment later, not during createClient.
  var init = new Promise(function (r) { setTimeout(r, 40); }).then(function () {
    var m = window.location.search.match(/[?&]code=([^&]+)/);
    if (!m) return 'INITIAL_SESSION';
    return window.__sb({ op: 'exchange', args: { code: decodeURIComponent(m[1]) } }).then(function (res) {
      if (res.error) return 'INITIAL_SESSION';
      writeS(res.data.session);
      return 'SIGNED_IN';
    });
  }).then(function (ev) { fire(ev, readS()); });
  function builder(table, kind, payload) {
    var q = { table: table, kind: kind, payload: payload, filters: [] };
    var b = {
      eq: function (c, v) { q.filters.push([c, 'eq', v]); return b; },
      in: function (c, v) { q.filters.push([c, 'in', v]); return b; },
      select: function (cols) { q.returning = cols || '*'; return b; },
      then: function (ok, bad) { return call('query', q).then(ok, bad); }
    };
    return b;
  }
  var client = {
    from: function (t) {
      return {
        select: function (cols) { return builder(t, 'select', cols || '*'); },
        upsert: function (rows) { return builder(t, 'upsert', JSON.parse(JSON.stringify(Array.isArray(rows) ? rows : [rows]))); },
        update: function (fields) { return builder(t, 'update', JSON.parse(JSON.stringify(fields))); },
        delete: function () { return builder(t, 'delete', null); }
      };
    },
    rpc: function (fn) { return call('rpc', { fn: fn }); },
    auth: {
      getSession: function () { return init.then(function () { return { data: { session: readS() }, error: null }; }); },
      onAuthStateChange: function (cb) { subs.push(cb); return { data: { subscription: { unsubscribe: function () {} } } }; },
      signInWithOtp: function (o) { return call('otp', { email: o.email, redirect: o.options && o.options.emailRedirectTo }); },
      signInWithOAuth: function (o) {
        return call('oauth', { provider: o.provider }).then(function (res) {
          var to = o.options.redirectTo;
          var i = to.indexOf('#');
          window.location.href = (i === -1 ? to : to.slice(0, i)) + '?code=' + encodeURIComponent(res.data.code) + (i === -1 ? '' : to.slice(i));
          return { data: {}, error: null };
        });
      },
      storageKey: SKEY,
      // Like supabase-js 2.45: a network failure returns an error and keeps the session.
      signOut: function (o) {
        // Test hook 'fake-session-revoked': like supabase-js when the expired session cannot be
        // renewed (refresh token revoked): it removes the session, says SIGNED_OUT, returns the error.
        if (localStorage.getItem('fake-session-revoked')) {
          writeS(null);
          subs.slice().forEach(function (cb) { cb('SIGNED_OUT', null); });
          return Promise.resolve({ error: { name: 'AuthApiError', status: 400, code: 'refresh_token_not_found', message: 'Invalid Refresh Token: Refresh Token Not Found' } });
        }
        return call('signout', { scope: o && o.scope }).then(function (res) {
          if (res.error) return { error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch' } };
          writeS(null);
          fire('SIGNED_OUT', null);
          return { error: null };
        });
      }
    }
  };
  // Like supabase-js: coming back to the tab says SIGNED_IN again for the same session.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && readS()) fire('SIGNED_IN', readS());
  });
  // Test hook: the session ends by itself (expired, or the account was deleted elsewhere).
  window.__fakeSbExpire = function () { writeS(null); fire('SIGNED_OUT', null); };
  return client;
};
`;

/* ------------------------------------------------------------------ *
 * Test helpers
 * ------------------------------------------------------------------ */
const results = [];
let failed = 0;
function check(name, ok, detail) {
  results.push((ok ? '✓ ' : '✗ ') + name + (ok || !detail ? '' : ' — ' + detail));
  if (!ok) failed++;
  console.log(results[results.length - 1]);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function until(fn, ms = 6000) {
  const t0 = Date.now();
  for (;;) {
    let v;
    try {
      v = await fn();
    } catch (e) {
      v = false;
    }
    if (v) return v;
    if (Date.now() - t0 > ms) return false;
    await sleep(100);
  }
}

let browser;
let BASE;
const pageErrors = [];
async function newDevice(name, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: opts.width || 1366, height: opts.height || 900 }, acceptDownloads: true });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  if (opts.fake !== false) {
    await ctx.route(/\/js\/config\.js(\?.*)?$/, (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: TEST_CONFIG }));
    await ctx.exposeBinding('__sb', (src, req) => cloudHandle(req));
  }
  const watch = (p) => {
    p.on('pageerror', (e) => pageErrors.push(name + ' pageerror: ' + (e.stack || e.message)));
    p.on('console', (m) => {
      if (m.type() === 'error' && !/fonts\.g|ERR_FAILED|ERR_INTERNET_DISCONNECTED|\(test\)/.test(m.text())) pageErrors.push(name + ' console.error: ' + m.text());
    });
  };
  ctx.on('page', watch);
  const page = await ctx.newPage();
  return { name, ctx, page };
}
async function go(page, hash) {
  await page.goto(BASE + '/index.html' + hash, { waitUntil: 'load' });
  await page.waitForTimeout(150);
}
async function answerGate(page) {
  const q = await page.textContent('.gate-q');
  const m = q.match(/(\d+)\s*×\s*(\d+)/);
  await page.fill('#gate-answer', String(+m[1] * +m[2]));
  await page.press('#gate-answer', 'Enter');
  await page.waitForSelector('.page.parent, .kids-page', { timeout: 3000 });
}
async function openParent(page) {
  if (!/#\/?parent/.test(page.url())) await page.evaluate(() => (window.location.hash = '#parent'));
  await page.waitForSelector('.gate-card, .page.parent');
  if (await page.$('.gate-card')) await answerGate(page);
  await page.waitForSelector('#acct-panel h2');
}
const kidsOf = (page) => page.evaluate(() => window.MQ.store.children().map((c) => ({ id: c.id, name: c.name, avatar: c.avatar, stars: window.MQ.store.totalStars(c.id) })));
const syncState = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.MQ.sync.state)));
/** Pretend the named child played an activity on this device. */
function play(page, childName, aid, rec) {
  return page.evaluate(
    ([n, aid, rec]) => {
      const S = window.MQ.store;
      const was = S.currentChild().id;
      const c = S.children().filter((x) => x.name === n)[0];
      S.switchChild(c.id);
      Object.assign(S.activity(aid), rec, { lastPlayed: new Date().toISOString() });
      S.switchChild(was);
      S.save('play');
    },
    [childName, aid, rec]
  );
}
async function signInByEmail(dev, email) {
  const page = dev.page;
  await openParent(page);
  await page.waitForSelector('#acct-email');
  await page.fill('#acct-email', email);
  await page.click('text=Email me a sign-in link');
  await page.waitForSelector('.acct-sent');
  const mail = cloud.outbox.filter((o) => o.email === email).pop();
  // Open the link from the email in the same tab, as the redirect does.
  await page.goto(BASE + '/index.html?code=' + encodeURIComponent(mail.code) + '#parent', { waitUntil: 'load' });
  await page.waitForSelector('.page.parent, .gate-card');
  if (await page.$('.gate-card')) await answerGate(page);
  return mail;
}
const focusedText = (page) => page.evaluate(() => (document.activeElement ? (document.activeElement.id ? '#' + document.activeElement.id + ' ' : '') + document.activeElement.textContent : ''));
const setFlag = (page, k, v) => page.evaluate(([k, v]) => (v ? localStorage.setItem(k, v) : localStorage.removeItem(k)), [k, v]);
const hScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
async function download(page) {
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }), page.click('text=Download my data')]);
  const file = await dl.path();
  return { name: dl.suggestedFilename(), json: JSON.parse(fs.readFileSync(file, 'utf8')) };
}

/* ------------------------------------------------------------------ *
 * The tests
 * ------------------------------------------------------------------ */
async function main() {
  const server = await startServer();
  BASE = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch({ headless: !headed });

  /* ---- on-device mode (the real js/config.js, no accounts) ---- */
  {
    const D = await newDevice('local', { fake: false });
    const p = D.page;
    await go(p, '#home');
    check('on-device: home renders with one child (no picker)', !!(await p.$('.map, .units, main')) && !(await p.$('.who-page')));
    check('on-device: sync is off', (await p.evaluate(() => window.MQ.sync && window.MQ.sync.state.enabled)) === false);
    await go(p, '#parent');
    check('gate: #parent shows the grown-up question first', !!(await p.$('.gate-card')) && !(await p.$('#acct-panel')));
    check('gate: answer box has focus and numeric keyboard', await p.evaluate(() => document.activeElement && document.activeElement.id === 'gate-answer' && document.activeElement.getAttribute('inputmode') === 'numeric'));
    const q1 = await p.textContent('.gate-q');
    const m = q1.match(/(\d+)\s*×\s*(\d+)/);
    check('gate: question is (13–19) × (6–9)', !!m && +m[1] >= 13 && +m[1] <= 19 && +m[2] >= 6 && +m[2] <= 9, q1);
    await p.fill('#gate-answer', String(+m[1] * +m[2] + 1));
    await p.press('#gate-answer', 'Enter');
    await p.waitForTimeout(100);
    check('gate: wrong answer stays on gate with a new question', !!(await p.$('.gate-card')) && /new question/i.test(await p.textContent('.gate-msg')) && (await p.inputValue('#gate-answer')) === '');
    await answerGate(p);
    check('gate: right answer opens the Parent corner', !!(await p.$('#acct-panel')));
    const acct = await p.textContent('#acct-panel');
    check('on-device: account card says device only and offers download', /this device only/.test(acct) && /Download my data/.test(acct) && !/Sign in/.test(acct), acct.slice(0, 120));
    check('on-device: no developer file path and no repeated "device only" line', !/SETUP-ACCOUNTS|docs\//.test(acct) && !(await p.isVisible('#acct-where')));
    const dl = await download(p);
    check('on-device: Download my data gives a dated JSON file', /^interactive-maths-data-\d{4}-\d\d-\d\d\.json$/.test(dl.name) && Array.isArray(dl.json.children) && dl.json.children.length === 1, dl.name);

    // add / rename / picture / remove
    await p.click('text=+ Add a child');
    await p.fill('#kids-new-name', 'Asha <b>x</b>');
    await p.click('button:has-text("Add child")');
    await p.waitForTimeout(150);
    let kids = await kidsOf(p);
    check('profiles: add a child (name kept as plain text)', kids.length === 2 && kids[1].name === 'Asha <b>x</b>' && !(await p.$('.kids-tab b')), JSON.stringify(kids));
    await p.click('.kids-tab:has-text("Player 1")');
    await p.fill('#kids-name', 'Mira');
    await p.click('text=Save name');
    await p.waitForTimeout(100);
    await p.click('.kids-manage .kids-avatar[aria-label="Panda"]');
    await p.waitForTimeout(100);
    check('a11y: picture change keeps focus on the chosen picture and is announced', /🐼/.test(await focusedText(p)) && !!(await until(() => p.evaluate(() => /Picture changed/.test((document.getElementById('sr-live') || {}).textContent || '')), 1000)));
    kids = await kidsOf(p);
    check('profiles: rename and change picture', kids[0].name === 'Mira' && kids[0].avatar === '🐼', JSON.stringify(kids));
    await p.click('.kids-tab:has-text("Asha")');
    await p.click('.kids-remove-btn');
    check('profiles: remove asks first', /This deletes Asha <b>x<\/b>'s stars/.test(await p.textContent('.kids-warn')));
    check('a11y: focus moves to "Yes, remove"', /^Yes, remove/.test(await focusedText(p)), await focusedText(p));
    await p.click('button:has-text("Yes, remove")');
    await p.waitForTimeout(100);
    kids = await kidsOf(p);
    check('profiles: remove a child', kids.length === 1 && kids[0].name === 'Mira', JSON.stringify(kids));
    await p.click('text=+ Add a child');
    await p.fill('#kids-new-name', 'Ravi');
    await p.click('button:has-text("Add child")');
    await p.waitForTimeout(100);
    await play(p, 'Mira', 'ruler-lab', { stars: 2, plays: 1, answered: 5, firstTry: 4 });
    await play(p, 'Ravi', 'tally-marks', { stars: 3, plays: 1, answered: 6, firstTry: 6 });

    // picker: once per tab session with 2+ children
    const t2 = await D.ctx.newPage();
    await t2.goto(BASE + '/index.html#home', { waitUntil: 'load' });
    await t2.waitForTimeout(150);
    check('picker: shows on first home visit of a new tab with 2 children', !!(await t2.$('.who-page')) && (await t2.$$('.who-card')).length === 2);
    check('picker: the current child has a visible "Playing now" badge', (await t2.$$('.who-now')).length === 1 && /Playing now/.test(await t2.textContent('.who-card.is-current')));
    await t2.click('.who-card:has-text("Ravi")');
    await t2.waitForTimeout(150);
    check('picker: choosing a child goes home and updates chip and stars', /#home$/.test(t2.url()) && /Ravi/.test(await t2.textContent('.who-chip')) && /★\s*3/.test(await t2.textContent('.total-stars')));
    await t2.evaluate(() => (window.location.hash = '#who'));
    await t2.click('.who-card:has-text("Mira")');
    await t2.waitForTimeout(150);
    check('picker: switching back shows Mira and her stars', /Mira/.test(await t2.textContent('.who-chip')) && /★\s*2/.test(await t2.textContent('.total-stars')));
    await t2.evaluate(() => (window.location.hash = '#unit-1'));
    await t2.evaluate(() => (window.location.hash = '#home'));
    await t2.waitForTimeout(100);
    check('picker: not shown again in the same tab', !(await t2.$('.who-page')));
    const t3 = await D.ctx.newPage();
    await t3.goto(BASE + '/index.html#unit-1', { waitUntil: 'load' });
    await t3.waitForTimeout(150);
    check('picker: never intercepts a direct #unit- link', !(await t3.$('.who-page')) && /#unit-1/.test(t3.url()));
    await t3.close();
    await t2.close();
    // reset: the "Are you sure?" step survives a background re-render, the message shows by the button
    await p.click('.kids-tab:has-text("Mira")');
    await p.click('.reset-row .btn');
    await p.evaluate(() => window.dispatchEvent(new StorageEvent('storage', { key: 'g3maths.v2' })));
    await p.waitForTimeout(150);
    check('reset: the confirm step survives a background update and keeps focus', !!(await p.$('.reset-row .reset-yes')) && /^Yes, reset Mira/.test(await focusedText(p)), await focusedText(p));
    await p.click('.reset-row .reset-yes');
    await p.waitForTimeout(100);
    check('reset: the message is shown next to the reset button', /Mira's progress has been reset/.test(await p.textContent('.reset-row')) && (await p.evaluate(() => window.MQ.store.totalStars(window.MQ.store.children().filter((c) => c.name === 'Mira')[0].id))) === 0);
    await p.fill('#kids-name', '');
    await p.click('text=Save name');
    check('messages: an error is not shown in the success colour', !!(await p.$('.kids-manage .kids-msg.is-error')) && /type a nickname/.test(await p.textContent('.kids-manage .kids-msg.is-error')));
    // the progress table plays as the child whose table it is
    await p.click('.kids-tab:has-text("Ravi")');
    await p.click('.progress-table a[href="#play-ruler-lab"]');
    await p.waitForTimeout(200);
    check('dashboard: an activity link plays as the child whose table is shown', /#play-ruler-lab$/.test(p.url()) && (await p.evaluate(() => window.MQ.store.currentChild().name)) === 'Ravi');
    // another tab switches child while this one plays: the stars go to the child who played
    const q = await D.ctx.newPage();
    await q.goto(BASE + '/index.html#unit-1', { waitUntil: 'load' });
    await q.evaluate(() => window.MQ.store.switchChild(window.MQ.store.children().filter((c) => c.name === 'Mira')[0].id));
    await sleep(200);
    await p.evaluate(() => window.MQ.dev.goto('practice', window.MQ.dev.practiceCount));
    await p.waitForTimeout(200);
    const credit = await p.evaluate(() => {
      const S = window.MQ.store;
      const by = (n) => S.children().filter((c) => c.name === n)[0].id;
      const plays = (n) => (S.progressOf(by(n)).activities['ruler-lab'] || {}).plays || 0;
      return { ravi: plays('Ravi'), mira: plays('Mira') };
    });
    check('tabs: an activity finished after another tab switched child is saved to the child who played', credit.ravi === 1 && credit.mira === 0, JSON.stringify(credit));
    await q.close();
    await go(p, '#privacy');
    const priv = await p.textContent('.privacy');
    check('privacy: on-device, no contact email -> "the site owner"', /Draft — to be checked/.test(priv) && /the site owner/.test(priv));
    check('privacy: with accounts off, requests go to the site owner, not "delete your account in the Parent corner"', /Accounts are switched off/.test(priv) && !/delete your account in the Parent corner/.test(priv), priv.slice(0, 200));
    await D.ctx.close();

    // one child: straight home
    const D1 = await newDevice('local1', { fake: false });
    await go(D1.page, '#home');
    check('picker: not shown with only one child', !(await D1.page.$('.who-page')));
    // a background update while a finger is down on a unit card does not swallow the tap
    const ub = await D1.page.locator('.unit-card[href="#unit-1"]').boundingBox();
    await D1.page.mouse.move(ub.x + ub.width / 2, ub.y + ub.height / 2);
    await D1.page.mouse.down();
    await D1.page.evaluate(() => window.MQ.store.save('pull'));
    await D1.page.mouse.up();
    await D1.page.waitForTimeout(200);
    check('home: a tap that straddles a background update still opens the unit', /#unit-1$/.test(D1.page.url()), D1.page.url());
    await go(D1.page, '#home');
    // another tab adds a second child: this tab reads the change and stays on the map
    const o2 = await D1.ctx.newPage();
    await o2.goto(BASE + '/index.html#unit-1', { waitUntil: 'load' });
    await o2.evaluate(() => window.MQ.store.addChild('Tara', '🐯'));
    await sleep(300);
    check('tabs: a change in another tab is picked up without jumping to the picker', !(await D1.page.$('.who-page')) && /#home$/.test(D1.page.url()) && (await D1.page.evaluate(() => window.MQ.store.children().length)) === 2);
    await D1.page.evaluate(() => window.MQ.store.setSetting('sound', false));
    check('tabs: saving in one tab does not overwrite the other tab\'s child', (await o2.evaluate(() => JSON.parse(localStorage.getItem('g3maths.v2')).children.length)) === 2);
    await o2.close();
    await go(D1.page, '#parent');
    await answerGate(D1.page);
    await D1.page.evaluate(() => {
      const S = window.MQ.store;
      S.children().slice(1).forEach((c) => S.removeChild(c.id));
    });
    await D1.page.reload({ waitUntil: 'load' });
    await D1.page.waitForSelector('.kids-remove-btn');
    await D1.page.click('.kids-remove-btn');
    check('only child: remove warns that a new player starts', /starts again with a new player/.test(await D1.page.textContent('.kids-warn')));
    await D1.page.click('button:has-text("Yes, remove")');
    check('only child: message says a new player was added', /A new player has been added/.test(await D1.page.textContent('.kids-msg')));
    await D1.page.evaluate(() => {
      for (let i = 2; i <= 10; i++) window.MQ.store.addChild('Kid ' + i, '🐢');
    });
    await D1.page.reload({ waitUntil: 'load' });
    await D1.page.waitForSelector('.kids-add-box');
    check('limit: with 10 children "+ Add a child" is replaced by a note', !(await D1.page.$('.kids-add-box button')) && /up to 10 children/.test(await D1.page.textContent('.kids-add-box')));
    await go(D1.page, '#who');
    check('limit: picker does not offer to add an 11th child', !(await D1.page.$('a[href="#add-child"]')) && /up to 10 children/.test(await D1.page.textContent('.who-actions')));
    await D1.page.evaluate(() => sessionStorage.clear());
    await go(D1.page, '#parent');
    await D1.page.waitForSelector('.gate-card');
    for (let i = 0; i < 3; i++) {
      const q = await D1.page.textContent('.gate-q');
      const m = q.match(/(\d+)\s*×\s*(\d+)/);
      await D1.page.fill('#gate-answer', String(+m[1] * +m[2] + 3));
      await D1.page.press('#gate-answer', 'Enter');
      await D1.page.waitForTimeout(50);
    }
    check('gate: 3 wrong answers in a row make it wait, and say how long', (await D1.page.isDisabled('#gate-answer')) && /wait \d+ seconds/i.test(await D1.page.textContent('.gate-msg')), await D1.page.textContent('.gate-msg'));
    await D1.ctx.close();
  }

  /* ---- the gate runs out while the Parent corner is open ---- */
  {
    const GD = await newDevice('gate', { fake: false, width: 800, height: 700 });
    const g = GD.page;
    const expire = () => g.evaluate(() => sessionStorage.setItem('g3maths.gate', String(Date.now() - 31 * 60 * 1000)));
    await go(g, '#parent');
    await answerGate(g);
    await g.evaluate(() => window.MQ.store.save()); // so a 'storage' event below reads the same profile back
    await g.click('.reset-row .btn');
    await expire();
    await g.click('.reset-row .reset-yes');
    await g.waitForSelector('.gate-card');
    await answerGate(g);
    const rs = await g.evaluate(() => {
      const b = document.querySelector('.reset-row .reset-yes');
      const r = b && b.getBoundingClientRect();
      return { focused: !!b && document.activeElement === b, onScreen: !!r && r.top >= 0 && r.bottom <= window.innerHeight };
    });
    check('gate ran out during a step: afterwards that step is on screen and has focus', rs.focused && rs.onScreen, JSON.stringify(rs));
    await g.click('.reset-row .reset-cancel');
    // a background update after 30 minutes does not swap the page for the gate
    await g.focus('.kids-tab');
    await expire();
    await g.evaluate(() => window.dispatchEvent(new StorageEvent('storage', { key: 'g3maths.v2' })));
    await g.waitForTimeout(150);
    check('gate ran out, background update: no gate pops up and focus stays', !(await g.$('.gate-card')) && (await g.evaluate(() => !!document.activeElement && document.activeElement.classList.contains('kids-tab'))));
    await g.click('.kids-remove-btn');
    check('gate ran out: the next action asks the question again', !!(await g.$('.gate-card')));
    await answerGate(g);
    // Safari / Firefox on a Mac: clicking a button does not focus it, so the input loses focus on mousedown
    await g.evaluate(() => {
      window.__safariDown = (e) => {
        if (!e.target.closest || !e.target.closest('button')) return;
        e.preventDefault();
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      };
      document.addEventListener('mousedown', window.__safariDown, true);
    });
    await g.fill('#kids-name', 'NewName');
    await g.evaluate(() => window.dispatchEvent(new StorageEvent('storage', { key: 'g3maths.v2' })));
    await g.waitForTimeout(100);
    const bx = await g.locator('button:has-text("Save name")').boundingBox();
    await g.mouse.move(bx.x + bx.width / 2, bx.y + bx.height / 2);
    await g.mouse.down();
    await g.waitForTimeout(150);
    await g.mouse.up();
    await g.waitForTimeout(150);
    check('Safari-style click on "Save name" just after a background update still saves the name', (await g.evaluate(() => window.MQ.store.children()[0].name)) === 'NewName', await g.evaluate(() => window.MQ.store.children()[0].name));
    await g.evaluate(() => document.removeEventListener('mousedown', window.__safariDown, true));
    // adding a sibling in the Parent corner does not change who is playing
    await g.click('text=+ Add a child');
    await g.fill('#kids-new-name', 'Sib');
    await g.click('button:has-text("Add child")');
    await g.waitForTimeout(100);
    check('add in the Parent corner: the child playing now stays the player', (await g.evaluate(() => window.MQ.store.currentChild().name)) === 'NewName' && (await g.evaluate(() => window.MQ.store.children().length)) === 2);
    // the child is removed (e.g. by a sync) while the gate is showing: no "Name saved" for someone else
    await g.click('.kids-tab:has-text("Sib")');
    await g.fill('#kids-name', 'Sib2');
    await expire();
    await g.click('text=Save name');
    await g.waitForSelector('.gate-card');
    await g.evaluate(() => window.MQ.store.removeChild(window.MQ.store.children().filter((c) => c.name === 'Sib')[0].id));
    await answerGate(g);
    const after = { names: await g.evaluate(() => window.MQ.store.children().map((c) => c.name)), msg: await g.textContent('.kids-manage') };
    check('gate ran out, child removed meanwhile: nothing is saved and no success message is shown', after.names.join() === 'NewName' && !/Name saved/.test(after.msg), JSON.stringify(after));
    check('child removed meanwhile: the parent is told, in the "try again" colour', /Sib had already been removed/.test(after.msg) && !!(await g.$('.kids-manage .kids-msg.is-error')), after.msg);
    // typed but not saved yet: a background update keeps the nickname and picture of "Add a child" and a rename
    const bump = () => g.evaluate(() => window.dispatchEvent(new StorageEvent('storage', { key: 'g3maths.v2' })));
    await g.click('text=+ Add a child');
    await g.fill('#kids-new-name', 'Rohan');
    await g.click('.kids-add .kids-avatar[aria-label="Koala"]');
    await bump();
    await g.waitForTimeout(150);
    const dr = await g.evaluate(() => ({ name: (document.getElementById('kids-new-name') || {}).value, pic: (document.querySelector('.kids-add .kids-avatar.is-on') || {}).textContent, focus: document.activeElement && document.activeElement.id }));
    check('add a child: a background update keeps the typed nickname, the chosen picture and focus on it', dr.name === 'Rohan' && dr.pic === '🐨' && dr.focus === 'kids-new-pic-6', JSON.stringify(dr));
    await g.click('.kids-add button:has-text("Cancel")');
    await g.fill('#kids-name', 'Aarav');
    await g.focus('button:has-text("Save name")');
    await bump();
    await g.waitForTimeout(150);
    check('rename: a background update keeps the name typed but not saved yet', (await g.inputValue('#kids-name')) === 'Aarav', await g.inputValue('#kids-name'));
    await g.fill('#kids-name', 'NewName');
    await g.click('text=Save name');
    // the family fills up while the gate is showing: "Could not add …" next to the add form, as an error
    await g.click('text=+ Add a child');
    await g.fill('#kids-new-name', 'Zed');
    await expire();
    await g.click('button:has-text("Add child")');
    await g.waitForSelector('.gate-card');
    await g.evaluate(() => {
      for (let i = 2; i <= 10; i++) window.MQ.store.addChild('Kid ' + i, '🐢', { makeCurrent: false });
    });
    await answerGate(g);
    const fullMsg = await g.evaluate(() => {
      const m = document.querySelector('.kids-add-box .kids-msg');
      return { text: m ? m.textContent : '', err: !!m && m.classList.contains('is-error'), kids: window.MQ.store.children().length };
    });
    check('family filled up while the gate showed: "Could not add Zed" by the add box, as an error', /Could not add Zed\. A family can have up to 10 children/.test(fullMsg.text) && fullMsg.err && fullMsg.kids === 10, JSON.stringify(fullMsg));
    await GD.ctx.close();
  }

  /* ---- accounts and sync (fake Supabase) ---- */
  const P1 = 'parent.one@example.test';
  const P2 = 'parent.two@example.test';
  const A = await newDevice('A');
  const B = await newDevice('B');
  const pa = A.page;
  const pb = B.page;

  await go(pa, '#home');
  await openParent(pa);
  check('sync: signed-out card offers Google and email link', !!(await pa.$('.acct-google')) && !!(await pa.$('#acct-email')) && /Children never need an email/.test(await pa.textContent('#acct-panel')));
  await pa.fill('#acct-email', 'not-an-email');
  await pa.click('text=Email me a sign-in link');
  check('sync: bad email is caught before sending', /full email address/.test(await pa.textContent('#acct-panel')) && cloud.outbox.length === 0);
  await pa.evaluate(() => window.dispatchEvent(new StorageEvent('storage', { key: 'g3maths.v2' })));
  await sleep(150);
  check('sign-in card: its message stays when the page is rebuilt (e.g. another tab saved)', /full email address/.test(await pa.textContent('#acct-panel .acct-msg.is-error')));
  await pa.fill('#acct-email', 'blocked@example.test');
  await pa.click('text=Email me a sign-in link');
  await until(() => pa.evaluate(() => /not set up/.test(document.querySelector('#acct-panel .acct-msg').textContent)), 3000);
  const blockedTxt = await pa.textContent('#acct-panel .acct-msg');
  check('sign-in: a refusal that trying again cannot fix says so, with the contact email', /not set up on this website yet/.test(blockedTxt) && blockedTxt.includes(CONTACT) && !/try again later/i.test(blockedTxt), blockedTxt);
  // device A: two children with progress before signing in
  await pa.evaluate(() => {
    const S = window.MQ.store;
    S.updateChild(S.currentChild().id, { name: 'Mira' });
    S.addChild('Ravi', '🐯');
  });
  await play(pa, 'Mira', 'ruler-lab', { stars: 2, plays: 1, answered: 5, firstTry: 4 });
  await play(pa, 'Ravi', 'tally-marks', { stars: 3, plays: 1, answered: 6, firstTry: 6 });

  await signInByEmail(A, P1);
  const consentShown = await until(() => pa.$('#acct-consent'));
  check('sign-in: email link signs in and asks for consent', !!consentShown, JSON.stringify(await syncState(pa)));
  check('sign-in: ?code= is removed from the address bar', !/code=/.test(pa.url()) && /#parent$/.test(pa.url()), pa.url());
  await sleep(1800);
  check('consent: nothing uploaded before agreeing', cloudKids(P1).length === 0 && Object.keys(cloud.progress).length === 0 && Object.keys(cloud.parents).length === 0);
  check('consent: "Agree" is disabled until the box is ticked', await pa.isDisabled('text=Agree and turn on sync'));
  const upl = (await pa.textContent('.acct-profiles').catch(() => '')) || '';
  check('consent: lists the profiles on this device that will be uploaded', /Mira/.test(upl) && /Ravi/.test(upl), upl);
  const consentTxt = await pa.textContent('#acct-panel');
  check('consent: the list also names device IP addresses, the sign-in log and reset times, and links the full notice', /IP address and browser/.test(consentTxt) && /security log/.test(consentTxt) && /last reset/.test(consentTxt) && !!(await pa.$('#acct-panel .muted a[href="#privacy"]')));
  await pa.check('#acct-consent');
  await pa.click('text=Agree and turn on sync');
  await until(() => pa.$('.acct-status-saved'));
  const k1 = cloudKids(P1);
  const aKids = await kidsOf(pa);
  const mira = aKids.filter((c) => c.name === 'Mira')[0];
  const ravi = aKids.filter((c) => c.name === 'Ravi')[0];
  check('consent: after agreeing, local children and progress are uploaded', k1.length === 2 && !!mira && cloudRec(mira.id, 'ruler-lab') && cloudRec(mira.id, 'ruler-lab').stars === 2 && cloudRec(ravi.id, 'tally-marks').stars === 3, JSON.stringify(k1));
  check('consent: parents row has the consent version', cloud.parents[cloud.users[P1].id] && cloud.parents[cloud.users[P1].id].consent_version === CONSENT_VERSION);
  check('sync: status line says saved', /All progress saved/.test(await pa.textContent('#acct-panel')));
  check('sync: intro says progress is synced', /synced to your account/.test(await pa.textContent('#acct-where')));

  // device B: same parent gets the same children and stars
  await go(pb, '#home');
  await signInByEmail(B, P1);
  await until(() => pb.$('.acct-status-saved'));
  let bKids = await kidsOf(pb);
  check('device B: gets the same children and stars', bKids.length === 2 && bKids.some((c) => c.id === mira.id && c.stars === 2) && bKids.some((c) => c.id === ravi.id && c.stars === 3), JSON.stringify(bKids));
  check('device B: its empty "Player 1" is not added to the family', cloudKids(P1).length === 2, JSON.stringify(cloudKids(P1).map((c) => c.name)));

  const sym = await pa.evaluate(() => {
    const m = window.MQ.sync._merge;
    const t = '2026-11-01T10:00:00.000Z';
    const a = { stars: 2, plays: 3, firstTry: 12, answered: 24, lastPlayed: t, mistakes: { a: 1 } };
    const b = { stars: 3, plays: 3, firstTry: 9, answered: 24, lastPlayed: t, mistakes: { b: 3 } };
    const c = { stars: 1, plays: 3, firstTry: 9, answered: 24, lastPlayed: t, mistakes: { a: 3 } };
    const f = (r) => JSON.stringify([r.stars, r.plays, r.firstTry, r.answered, r.lastPlayed, r.mistakes]);
    return [[a, b], [b, c], [a, c]].every(([x, y]) => f(m(x, y)) === f(m(y, x)));
  });
  check('merge: a tie in answers is decided the same way on every device', sym);

  // progress on B merges back to A, keeping the most stars
  await play(pb, 'Mira', 'ruler-lab', { stars: 3, plays: 2, answered: 9, firstTry: 8 });
  await play(pb, 'Mira', 'tally-marks', { stars: 1, plays: 1, answered: 4, firstTry: 2 });
  await until(() => cloudRec(mira.id, 'ruler-lab').stars === 3 && cloudRec(mira.id, 'tally-marks'));
  await pa.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  const merged = await until(() => pa.evaluate((id) => window.MQ.store.totalStars(id) === 4, mira.id), 4000);
  check('merge: B\'s new stars reach A when A comes back to the page', !!merged, String(await pa.evaluate((id) => window.MQ.store.totalStars(id), mira.id)));
  await pa.reload({ waitUntil: 'load' });
  await until(() => pa.$('.acct-status-saved'));
  check('merge: after reload A has 3 + 1 stars for Mira', (await pa.evaluate((id) => window.MQ.store.totalStars(id), mira.id)) === 4);
  await sleep(1500);
  await pa.evaluate(() => {
    window.__lostConsent = false;
    window.MQ.sync.onChange((st) => {
      if (st.user && !st.consented) window.__lostConsent = true;
    });
  });
  const upBefore = cloud.progressUpserts;
  await pa.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await sleep(1800);
  check('focus: coming back to the tab re-uploads nothing that has not changed', cloud.progressUpserts === upBefore, String(cloud.progressUpserts - upBefore) + ' rows re-sent');
  check('focus: SIGNED_IN again for the same parent never drops consent', !(await pa.evaluate(() => window.__lostConsent)) && !(await pa.$('#acct-consent')));
  // a change made while a save is on its way is not lost
  await setFlag(pa, 'fake-delay', '900');
  await pa.evaluate((id) => window.MQ.store.updateChild(id, { avatar: '🐼' }), ravi.id);
  await sleep(1500);
  await pa.evaluate((id) => window.MQ.store.updateChild(id, { avatar: '🐸' }), ravi.id);
  await setFlag(pa, 'fake-delay', '');
  await until(() => cloud.children[ravi.id].avatar === '🐸', 6000);
  await pa.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await sleep(800);
  check('in-flight: a picture changed during a save reaches the cloud and does not revert', cloud.children[ravi.id].avatar === '🐸' && (await pa.evaluate((id) => window.MQ.store.children().filter((c) => c.id === id)[0].avatar, ravi.id)) === '🐸', cloud.children[ravi.id].avatar);
  // offline start (consent cannot be checked), then the connection comes back
  await setFlag(pa, 'fake-net-down', '1');
  await pa.reload({ waitUntil: 'load' });
  await until(() => pa.evaluate(() => window.MQ.sync.state.user && window.MQ.sync.state.status === 'offline'));
  check('offline start: signed in, no consent step, says offline', !(await pa.$('#acct-consent')) && /Offline/.test(await pa.textContent('#acct-panel')), await pa.textContent('#acct-panel'));
  await play(pa, 'Mira', 'tally-marks', { stars: 2, plays: 2, answered: 8, firstTry: 6 });
  await setFlag(pa, 'fake-net-down', '');
  await pa.evaluate(() => window.dispatchEvent(new Event('online')));
  const back = await until(() => cloudRec(mira.id, 'tally-marks') && cloudRec(mira.id, 'tally-marks').stars === 2, 5000);
  check('offline start: sync resumes when back online', !!back && !!(await until(() => pa.$('.acct-status-saved'))), JSON.stringify(cloudRec(mira.id, 'tally-marks')));

  // offline on A, then back online
  await A.ctx.setOffline(true);
  await sleep(200);
  await play(pa, 'Mira', 'pattern-steps', { stars: 3, plays: 1, answered: 6, firstTry: 6 });
  await until(() => pa.$('.acct-status-offline'), 4000);
  check('offline: status says offline and nothing reaches the cloud', !!(await pa.$('.acct-status-offline')) && !cloudRec(mira.id, 'pattern-steps'), JSON.stringify(await syncState(pa)));
  await play(pb, 'Mira', 'pattern-steps', { stars: 1, plays: 3, answered: 10, firstTry: 4 });
  await until(() => cloudRec(mira.id, 'pattern-steps'));
  await A.ctx.setOffline(false);
  const caught = await until(() => cloudRec(mira.id, 'pattern-steps').stars === 3 && cloudRec(mira.id, 'pattern-steps').plays === 3, 6000);
  check('offline: back online, A catches up without losing stars (max)', !!caught, JSON.stringify(cloudRec(mira.id, 'pattern-steps')));
  check('offline: status returns to saved', !!(await until(() => pa.$('.acct-status-saved'))));
  await pb.reload({ waitUntil: 'load' });
  await until(() => pb.$('.acct-status-saved'));
  check('offline: B then sees the 3 stars', (await pb.evaluate((id) => window.MQ.store.progressOf(id).activities['pattern-steps'].stars, mira.id)) === 3);

  // removing a child on A removes it on B
  await openParent(pa);
  await pa.click('.kids-tab:has-text("Ravi")');
  await pa.click('.kids-remove-btn');
  await pa.click('button:has-text("Yes, remove Ravi")');
  await until(() => !cloudKids(P1).some((c) => c.id === ravi.id));
  check('remove: child removed from the cloud', !cloudKids(P1).some((c) => c.id === ravi.id) && !cloudRec(ravi.id, 'tally-marks'));
  await pb.reload({ waitUntil: 'load' });
  await until(() => pb.$('.acct-status-saved'));
  await sleep(1600);
  bKids = await kidsOf(pb);
  check('remove: device B drops the child after syncing', !bKids.some((c) => c.id === ravi.id), JSON.stringify(bKids));
  check('remove: device B does not upload it again', !cloudKids(P1).some((c) => c.id === ravi.id), JSON.stringify(cloudKids(P1).map((c) => c.name)));

  // download (signed in)
  await openParent(pa);
  const dlA = await download(pa);
  check('download: signed-in export has the account email and children', dlA.json.account && dlA.json.account.email === P1 && dlA.json.children.some((c) => c.name === 'Mira' && c.progress['ruler-lab'].stars === 3));

  // reset on A reaches B, and B's old copy (even one never uploaded) does not bring the stars back
  await B.ctx.setOffline(true);
  await play(pb, 'Mira', 'tally-marks', { stars: 3, plays: 9, answered: 30, firstTry: 28 });
  await sleep(300);
  await pa.evaluate((id) => window.MQ.store.reset(id), mira.id);
  await until(() => cloud.children[mira.id].reset_at && cloudRec(mira.id, 'ruler-lab').stars === 0);
  await B.ctx.setOffline(false);
  await until(() => pb.evaluate((id) => window.MQ.store.totalStars(id) === 0, mira.id), 6000);
  await sleep(1600);
  await pa.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await sleep(800);
  const miraRows = Object.keys(cloud.progress).filter((k) => k.indexOf(mira.id + '|') === 0).map((k) => cloud.progress[k]);
  const rs = {
    a: await pa.evaluate((id) => window.MQ.store.totalStars(id), mira.id),
    b: await pb.evaluate((id) => window.MQ.store.totalStars(id), mira.id),
    cloud: miraRows.map((r) => r.activity_id + ':' + r.stars),
    bDirty: await pb.evaluate((id) => Object.keys(window.MQ.store.raw().dirty[id] || {}).length, mira.id),
  };
  check('reset: reaches the other device, which does not upload its old stars again', rs.a === 0 && rs.b === 0 && rs.bDirty === 0 && miraRows.length > 0 && miraRows.every((r) => r.stars === 0), JSON.stringify(rs));
  // a refused child row does not hold back the progress of children already in the account
  await setFlag(pa, 'fake-fail-children', '1');
  await pa.evaluate(() => window.MQ.store.addChild('Kid X', '🐢'));
  await play(pa, 'Mira', 'pattern-steps', { stars: 2, plays: 4, answered: 14, firstTry: 9 });
  await until(() => cloudRec(mira.id, 'pattern-steps') && cloudRec(mira.id, 'pattern-steps').plays === 4, 5000);
  await until(() => pa.$('.acct-status-error'));
  const errTxt = await pa.textContent('#acct-panel');
  check('refused child: the others\' progress is still saved, and the message is in plain words', cloudRec(mira.id, 'pattern-steps').plays === 4 && /up to 10 children/.test(errTxt) && !/\(test\)|23514/.test(errTxt), errTxt.slice(0, 240));
  await setFlag(pa, 'fake-fail-children', '');
  await pa.evaluate(() => {
    const S = window.MQ.store;
    S.removeChild(S.children().filter((c) => c.name === 'Kid X')[0].id);
  });
  await until(() => pa.$('.acct-status-saved'));

  // removed on B, then the picture changed on A before A fetched: the child is not added back
  await pa.evaluate(() => window.MQ.store.addChild('Tara', '🐯', { makeCurrent: false }));
  await until(() => cloudKids(P1).some((c) => c.name === 'Tara'));
  const tara = cloudKids(P1).filter((c) => c.name === 'Tara')[0];
  await pb.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await until(() => pb.evaluate((id) => window.MQ.store.children().some((c) => c.id === id), tara.id));
  await pb.evaluate((id) => window.MQ.store.removeChild(id), tara.id);
  await until(() => !cloud.children[tara.id]);
  await pa.evaluate((id) => window.MQ.store.updateChild(id, { avatar: '🐧' }), tara.id);
  await sleep(1800);
  await pb.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await sleep(800);
  const hasTara = (p) => p.evaluate((id) => window.MQ.store.children().some((c) => c.id === id), tara.id);
  const tr = { cloud: !!cloud.children[tara.id], a: await hasTara(pa), b: await hasTara(pb) };
  check('removed on B, picture changed on A before A fetched: the child stays removed on every device', !tr.cloud && !tr.a && !tr.b, JSON.stringify(tr));

  // reset: what A never had, a refused new child in the same save, and B replaying before it hears of the reset
  await play(pb, 'Mira', 'clock-twins', { stars: 3, plays: 4, answered: 32, firstTry: 30, mistakes: { 'old-mistake': 5 } });
  await until(() => cloudRec(mira.id, 'clock-twins'));
  await pa.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await until(() => pa.evaluate((id) => !!window.MQ.store.progressOf(id).activities['clock-twins'], mira.id));
  await play(pb, 'Mira', 'jug-reader', { stars: 2, plays: 2, answered: 16, firstTry: 10, mistakes: { m: 2 } });
  await until(() => cloudRec(mira.id, 'jug-reader'));
  await setFlag(pa, 'fake-fail-children', '1');
  const genBefore = cloud.children[mira.id].reset_gen || 0;
  await pa.evaluate(() => window.MQ.store.addChild('Kid Y', '🐢', { makeCurrent: false }));
  await pa.evaluate((id) => window.MQ.store.reset(id), mira.id);
  await until(() => (cloud.children[mira.id].reset_gen || 0) > genBefore, 5000);
  await sleep(300);
  check('reset with a refused new child in the same save: the reset still reaches the account', (cloud.children[mira.id].reset_gen || 0) === genBefore + 1 && !!cloud.children[mira.id].reset_at, JSON.stringify(cloud.children[mira.id]));
  check('reset: records the resetting device never had are cleared in the account too', !cloudRec(mira.id, 'jug-reader'), JSON.stringify(cloudRec(mira.id, 'jug-reader')));
  const upBefore2 = cloud.progressUpserts;
  // B still holds the old record and the child plays it again (as finish() does) before B fetches
  await pb.evaluate((id) => {
    const S = window.MQ.store;
    const r = S.activity('clock-twins', id);
    r.plays++;
    r.answered += 8;
    r.firstTry += 7;
    r.stars = Math.max(r.stars, 2);
    r.mistakes['new-mistake'] = (r.mistakes['new-mistake'] || 0) + 1;
    r.lastPlayed = new Date().toISOString();
    S.save();
  }, mira.id);
  await until(() => cloud.progressUpserts > upBefore2, 4000);
  await sleep(300);
  await pb.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await sleep(800);
  await pa.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await sleep(800);
  const ctOf = async (p) => JSON.parse(await p.evaluate((id) => JSON.stringify(window.MQ.store.progressOf(id).activities['clock-twins'] || null), mira.id));
  const oldBack = (r) => !!r && (r.plays > 1 || r.stars === 3 || !!(r.mistakes || {})['old-mistake']);
  const rr = { cloud: cloudRec(mira.id, 'clock-twins'), a: await ctOf(pa), b: await ctOf(pb), aStars: await pa.evaluate((id) => window.MQ.store.totalStars(id), mira.id), bStars: await pb.evaluate((id) => window.MQ.store.totalStars(id), mira.id) };
  check('reset: a device that replays an activity before it hears of the reset does not bring old stars, plays or mistakes back', !oldBack(rr.cloud) && !oldBack(rr.a) && !oldBack(rr.b) && rr.aStars === 0 && rr.bStars === 0, JSON.stringify(rr));
  await setFlag(pa, 'fake-fail-children', '');
  await pa.evaluate(() => {
    const S = window.MQ.store;
    S.removeChild(S.children().filter((c) => c.name === 'Kid Y')[0].id);
  });
  await until(() => pa.$('.acct-status-saved'));

  // a device whose clock is two days fast resets: later play on other devices still shows everywhere
  const F = await newDevice('F-fast-clock');
  await F.ctx.addInitScript(() => {
    const RD = Date;
    const off = 2 * 864e5;
    function FD(...a) {
      return a.length ? new RD(...a) : new RD(RD.now() + off);
    }
    FD.now = () => RD.now() + off;
    FD.parse = RD.parse;
    FD.UTC = RD.UTC;
    FD.prototype = RD.prototype;
    window.Date = FD;
  });
  await go(F.page, '#home');
  await signInByEmail(F, P1);
  await until(() => F.page.$('.acct-status-saved'));
  const genF = cloud.children[mira.id].reset_gen || 0;
  await F.page.evaluate((id) => window.MQ.store.reset(id), mira.id);
  await until(() => (cloud.children[mira.id].reset_gen || 0) > genF, 5000);
  await pb.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await sleep(800);
  await play(pb, 'Mira', 'ruler-lab', { stars: 2, plays: 1, answered: 8, firstTry: 6 });
  await until(() => cloudRec(mira.id, 'ruler-lab') && cloudRec(mira.id, 'ruler-lab').stars === 2, 5000);
  await pa.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  await F.page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')));
  const seen = await until(() => pa.evaluate((id) => window.MQ.store.totalStars(id) === 2, mira.id), 4000);
  check('reset from a device with a fast clock: play after it still reaches the other devices', !!seen && (await F.page.evaluate((id) => window.MQ.store.totalStars(id), mira.id)) === 2, String(await pa.evaluate((id) => window.MQ.store.totalStars(id), mira.id)));
  await F.ctx.close();

  // sign out is refused while progress could not be saved
  await setFlag(pa, 'fake-net-down', '1');
  await play(pa, 'Mira', 'ruler-lab', { stars: 3, plays: 5, answered: 20, firstTry: 18 });
  await sleep(1500);
  await pa.click('button:has-text("Sign out")');
  await pa.click('text=Sign out now');
  await until(() => pa.$('.acct-signout-anyway'));
  check('sign out: refused while progress is unsaved, device kept', !!(await pa.$('.acct-signout-anyway')) && /not been saved/.test(await pa.textContent('#acct-panel')) && (await kidsOf(pa)).some((c) => c.name === 'Mira'));
  await setFlag(pa, 'fake-net-down', '');
  await pa.click('.acct-signout button:has-text("Cancel")');
  await pa.evaluate(() => window.MQ.sync.syncNow());
  await until(() => cloudRec(mira.id, 'ruler-lab').plays === 5);
  await until(() => pa.$('.acct-status-saved'));
  const tab2 = await A.ctx.newPage();
  await tab2.goto(BASE + '/index.html#unit-1', { waitUntil: 'load' });
  await sleep(300);
  // sign out wipes A; a second parent on A does not get the first family
  await pa.click('button:has-text("Sign out")');
  check('sign out: warns that progress leaves this device', /removes your children's progress from this device/.test(await pa.textContent('#acct-panel')));
  await pa.click('text=Sign out now');
  await until(() => pa.$('#acct-email'));
  const afterOut = await pa.evaluate(() => ({ kids: window.MQ.store.children().map((c) => c.name), raw: localStorage.getItem('g3maths.v2') || '' }));
  check('sign out: device wiped to a fresh Player 1', afterOut.kids.length === 1 && afterOut.kids[0] === 'Player 1' && !/Mira|Ravi/.test(afterOut.raw), JSON.stringify(afterOut.kids));
  check('sign out: family data stays in the account', cloudKids(P1).some((c) => c.id === mira.id));
  check('sign out: only this device is signed out (scope local)', cloud.signOutScopes[cloud.signOutScopes.length - 1] === 'local', JSON.stringify(cloud.signOutScopes));
  await tab2.evaluate(() => window.MQ.store.setSetting('voice', false));
  const t2raw = await tab2.evaluate(() => ({ kids: window.MQ.store.children().map((c) => c.name), raw: localStorage.getItem('g3maths.v2') || '' }));
  check('sign out: another open tab does not write the family back', !/Mira|Ravi/.test(t2raw.raw) && t2raw.kids.join() === 'Player 1', JSON.stringify(t2raw.kids));
  await tab2.close();
  await signInByEmail(A, P2);
  await until(() => pa.$('#acct-consent'));
  await pa.check('#acct-consent');
  await pa.click('text=Agree and turn on sync');
  await until(() => pa.$('.acct-status-saved'));
  const a2 = await kidsOf(pa);
  check('second parent on A: does not receive the first family', !a2.some((c) => c.id === mira.id || c.name === 'Mira') && !cloudKids(P2).some((c) => c.id === mira.id || c.name === 'Mira'), JSON.stringify(a2));

  // session ends by itself on B; a second parent signing in on B must not get or upload family 1
  await pb.evaluate(() => window.__fakeSbExpire());
  await until(() => pb.evaluate(() => !window.MQ.sync.state.user));
  await signInByEmail(B, P2);
  await until(() => pb.evaluate(() => ['saved', 'error'].indexOf(window.MQ.sync.state.status) !== -1 && window.MQ.sync.state.user));
  await sleep(1600);
  const b2 = await kidsOf(pb);
  const sB = await syncState(pb);
  check('expired session on B: next parent does not see the first family', !b2.some((c) => c.id === mira.id), JSON.stringify(b2));
  check('expired session on B: nothing of family 1 uploaded, no sync error', sB.status === 'saved' && !cloudKids(P2).some((c) => c.name === 'Mira'), sB.status + ' ' + sB.lastError);
  check('family 1 is untouched in the cloud', cloudKids(P1).length === 1 && cloudRec(mira.id, 'ruler-lab').stars === 3);

  // both second steps open: a status change keeps focus on the delete step's Cancel
  await openParent(pa);
  await pa.click('#acct-panel button:has-text("Sign out")');
  await pa.click('text=Delete my account');
  await pa.focus('.acct-delete-cancel');
  await setFlag(pa, 'fake-net-down', '1');
  await pa.evaluate(() => window.MQ.sync.syncNow());
  await until(() => pa.$('.acct-status-offline'));
  await sleep(100);
  check('a11y: a re-render keeps focus on the delete step\'s Cancel, not the sign-out one', await pa.evaluate(() => !!document.activeElement && document.activeElement.classList.contains('acct-delete-cancel')), await focusedText(pa));
  await setFlag(pa, 'fake-net-down', '');
  await pa.evaluate(() => window.MQ.sync.syncNow());
  await until(() => pa.$('.acct-status-saved'));
  await pa.click('.acct-signout-cancel');
  await pa.click('.acct-delete-cancel');
  // delete account (parent two, on A)
  await pa.click('text=Delete my account');
  check('delete: needs DELETE typed', await pa.isDisabled('text=Delete everything'));
  check('a11y: focus moves to the DELETE box', /^#acct-delete-input/.test(await focusedText(pa)), await focusedText(pa));
  // the card is rebuilt while typing (the connection drops): the text cursor stays at the end
  await pa.keyboard.type('DEL');
  await setFlag(pa, 'fake-net-down', '1');
  await pa.evaluate(() => window.MQ.sync.syncNow());
  await until(() => pa.$('.acct-status-offline'));
  await pa.keyboard.type('ETE');
  check('typing DELETE while the card is rebuilt: the letters stay in order', (await pa.inputValue('#acct-delete-input')) === 'DELETE', await pa.inputValue('#acct-delete-input'));
  await setFlag(pa, 'fake-net-down', '');
  await pa.evaluate(() => window.MQ.sync.syncNow());
  await until(() => pa.$('.acct-status-saved'));
  await pa.fill('#acct-delete-input', 'DELETE');
  await pa.click('text=Delete everything');
  await until(() => /#home$/.test(pa.url()));
  const p2Gone = !cloud.users[P2] && !Object.keys(cloud.children).some((k) => cloud.children[k].name === 'Player 1' && !cloud.parents[cloud.children[k].parent_id]) && cloudKids(P2).length === 0;
  check('delete: account, children and progress removed from the cloud', p2Gone && Object.keys(cloud.parents).length === 1);
  const aDel = await pa.evaluate(() => ({ kids: window.MQ.store.children().length, user: window.MQ.sync.state.user }));
  check('delete: device wiped and signed out, routed home', aDel.kids === 1 && !aDel.user && /#home$/.test(pa.url()));
  check('delete: other families are untouched', cloudKids(P1).length === 1);

  // privacy with a contact email
  await go(pa, '#privacy');
  check('privacy: shows the contact email and consent version', (await pa.textContent('.privacy')).includes(CONTACT) && (await pa.textContent('.privacy')).includes(CONSENT_VERSION));

  // the session was already revoked on the server: Sign out still signs out and clears the device
  const X = await newDevice('X');
  await go(X.page, '#home');
  await signInByEmail(X, P1);
  await until(() => X.page.$('.acct-status-saved'));
  await setFlag(X.page, 'fake-session-revoked', '1');
  await X.page.click('#acct-panel button:has-text("Sign out")');
  await X.page.click('text=Sign out now');
  await until(() => X.page.$('#acct-email'));
  await sleep(200);
  const xr = await X.page.evaluate(() => ({ kids: window.MQ.store.children().map((c) => c.name), user: window.MQ.sync.state.user }));
  check('revoked session: Sign out still signs out and clears the device', !xr.user && xr.kids.join() === 'Player 1' && !/Could not sign out/.test(await X.page.textContent('#acct-panel')), JSON.stringify(xr));
  await setFlag(X.page, 'fake-session-revoked', '');
  // the session ends by itself, the child plays on, then a different account signs in
  await signInByEmail(X, P1);
  await until(() => X.page.$('.acct-status-saved'));
  await X.page.evaluate(() => window.__fakeSbExpire());
  await until(() => X.page.evaluate(() => !window.MQ.sync.state.user));
  await play(X.page, 'Mira', 'tally-marks', { stars: 2, plays: 12, answered: 50, firstTry: 40 });
  check('session ended by itself: the sign-in card offers to remove the profiles', !!(await until(() => X.page.$('.acct-clear'))));
  const P4 = 'parent.four@example.test';
  const p1Tally = JSON.stringify(cloudRec(mira.id, 'tally-marks'));
  await signInByEmail(X, P4);
  await until(() => X.page.$('.acct-discard'));
  await sleep(1500);
  check('other account with unsaved progress: nothing is cleared or uploaded, the parent is asked', !!(await X.page.$('.acct-discard')) && (await kidsOf(X.page)).some((c) => c.id === mira.id) && cloudKids(P4).length === 0, JSON.stringify(await kidsOf(X.page)));
  const dlX = await download(X.page);
  check('other account: the downloaded copy is not labelled with the signed-in parent\'s email', dlX.json.account === null && /different account/.test(dlX.json.note || '') && dlX.json.children.some((c) => c.name === 'Mira'), JSON.stringify(dlX.json.account));
  await X.page.click('.acct-discard');
  await X.page.click('.acct-discard-yes');
  await until(() => X.page.$('#acct-consent'));
  check('other account: "remove it and use this account" clears it, then asks for consent', !(await kidsOf(X.page)).some((c) => c.id === mira.id) && !!(await X.page.$('#acct-consent')));
  check('other account: the first family is untouched', cloudKids(P1).length === 1 && JSON.stringify(cloudRec(mira.id, 'tally-marks')) === p1Tally);
  check('consent: the time is not sent by the device', !(cloud.consentSent || []).some((keys) => keys.indexOf('consented_at') !== -1), JSON.stringify(cloud.consentSent));
  await X.ctx.close();

  // Google sign-in, then sign out before agreeing (device progress kept)
  const G = await newDevice('G');
  await go(G.page, '#home');
  await play(G.page, 'Player 1', 'ruler-lab', { stars: 1, plays: 1, answered: 3, firstTry: 1 });
  await openParent(G.page);
  await G.page.click('.acct-google');
  await G.page.waitForURL(/code=|#parent/);
  await G.page.waitForSelector('.page.parent, .gate-card');
  if (await G.page.$('.gate-card')) await answerGate(G.page);
  const gc = await until(() => G.page.$('#acct-consent'));
  check('google: sign-in returns to #parent and asks for consent', !!gc && /google\.parent@example\.test/.test(await G.page.textContent('#acct-panel')));
  await G.page.click('#acct-panel button:has-text("Sign out")');
  await until(() => G.page.$('#acct-email'));
  check('google: signing out before agreeing keeps the device progress', (await G.page.evaluate(() => window.MQ.store.totalStars())) === 1 && cloudKids('google.parent@example.test').length === 0);
  // signing in again without agreeing: the login can be deleted, the device keeps its progress
  await G.page.click('.acct-google');
  await G.page.waitForURL(/code=|#parent/);
  await G.page.waitForSelector('.page.parent, .gate-card');
  if (await G.page.$('.gate-card')) await answerGate(G.page);
  await until(() => G.page.$('#acct-consent'));
  await G.page.click('#acct-panel button:has-text("Delete my account")');
  const gWarn = await G.page.textContent('.acct-delete');
  await G.page.fill('#acct-delete-input', 'DELETE');
  await G.page.click('text=Delete everything');
  await until(() => /#home$/.test(G.page.url()));
  check('google: a parent who did not agree can delete the login, and the device keeps its progress', /stay on this device/.test(gWarn) && !cloud.users['google.parent@example.test'] && (await G.page.evaluate(() => window.MQ.store.totalStars())) === 1, gWarn);
  await G.ctx.close();

  // a sign-in link that failed (expired / used / other browser)
  const E = await newDevice('E');
  await E.page.goto(BASE + '/index.html?error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid&sb=', { waitUntil: 'load' });
  await E.page.waitForSelector('.gate-card');
  check('bad link: address cleaned to #parent', /\/index\.html#parent$/.test(E.page.url()), E.page.url());
  await answerGate(E.page);
  await E.page.waitForSelector('.acct-problem');
  check('bad link: sign-in card explains what happened', /Sign-in did not finish/.test(await E.page.textContent('.acct-problem')));
  await E.page.goto(BASE + '/index.html?code=used-or-unknown#parent', { waitUntil: 'load' });
  await E.page.waitForSelector('.page.parent');
  check('used link: sign-in card explains, code removed', !!(await until(() => E.page.$('.acct-problem'))) && !/code=/.test(E.page.url()));
  // Google sign-in cancelled: Google comes back in the same tab with error=access_denied
  await E.page.evaluate(() => sessionStorage.setItem('g3maths.signin', 'google'));
  await E.page.goto(BASE + '/index.html?error=access_denied&error_code=access_denied&error_description=The+user+denied#error=access_denied&error_description=The+user+denied', { waitUntil: 'load' });
  await E.page.waitForSelector('.page.parent, .gate-card');
  if (await E.page.$('.gate-card')) await answerGate(E.page);
  await E.page.waitForSelector('.acct-problem');
  const gTxt = await E.page.textContent('.acct-problem');
  check('google cancelled: the card says Google sign-in did not finish, not "ask for a new link"', /Google sign-in was cancelled/.test(gTxt) && !/link/.test(gTxt) && /#parent$/.test(E.page.url()), gTxt);
  // the sign-in service cannot be reached at start
  await setFlag(E.page, 'fake-start-fail', '1');
  await E.page.reload({ waitUntil: 'load' });
  await E.page.waitForSelector('#acct-panel h2');
  const failTxt = await E.page.textContent('#acct-panel');
  check('start failure: says it could not connect (not "accounts off") and offers Try again', /Could not connect to your account/.test(failTxt) && !/not switched on/.test(failTxt) && !!(await E.page.$('#acct-panel button:has-text("Try again")')), failTxt);
  await setFlag(E.page, 'fake-start-fail', '');
  await E.page.click('#acct-panel button:has-text("Try again")');
  check('start failure: Try again connects', !!(await until(() => E.page.$('#acct-email'))));
  await E.ctx.close();

  // privacy notice changed: the consent step's sign-out still clears this family's profiles
  const P3 = 'parent.three@example.test';
  const V = await newDevice('V');
  await go(V.page, '#home');
  await V.page.evaluate(() => window.MQ.store.updateChild(window.MQ.store.currentChild().id, { name: 'Zoya' }));
  await signInByEmail(V, P3);
  await until(() => V.page.$('#acct-consent'));
  await V.page.check('#acct-consent');
  await V.page.click('text=Agree and turn on sync');
  await until(async () => (await V.page.$('.acct-status-saved')) && cloudKids(P3).length === 1);
  cloud.parents[cloud.users[P3].id].consent_version = 'older';
  await V.page.reload({ waitUntil: 'load' });
  await until(() => V.page.$('#acct-consent'));
  await play(V.page, 'Zoya', 'ruler-lab', { stars: 1, plays: 1, answered: 3, firstTry: 1 });
  await V.page.click('#acct-panel button:has-text("Sign out")');
  check('new notice: sign-out warns that profiles leave this device', /removes your children's progress from this device/.test(await V.page.textContent('#acct-panel')));
  await V.page.click('text=Sign out now');
  await until(() => V.page.$('.acct-signout-anyway'));
  check('new notice: unsaved plays are pointed out before signing out', /sync is not turned on/.test(await V.page.textContent('#acct-panel')));
  await V.page.click('.acct-signout-anyway');
  await until(() => V.page.$('#acct-email'));
  check('new notice: signing out clears the family from this device', !/Zoya/.test(await V.page.evaluate(() => localStorage.getItem('g3maths.v2') || '')) && cloudKids(P3).some((c) => c.name === 'Zoya'));
  await V.ctx.close();

  // phone width: no horizontal scroll
  const PH = await newDevice('phone', { width: 375, height: 740 });
  const pp = PH.page;
  await go(pp, '#home');
  await openParent(pp);
  check('375px: #parent (signed out) has no horizontal scroll', (await hScroll(pp)) <= 0, String(await hScroll(pp)));
  await signInByEmail(PH, P1);
  await until(() => pp.$('.acct-status-saved'));
  await pp.evaluate(() => window.MQ.store.addChild('Kiran', '🐸'));
  await until(() => pp.$('.acct-status-saved'));
  check('375px: #parent (signed in) has no horizontal scroll', (await hScroll(pp)) <= 0, String(await hScroll(pp)));
  await pp.evaluate(() => (window.location.hash = '#who'));
  await pp.waitForSelector('.who-page');
  check('375px: #who has no horizontal scroll', (await hScroll(pp)) <= 0, String(await hScroll(pp)));
  check('375px: chip shows the avatar only', !(await pp.isVisible('.who-chip-name')) && (await pp.isVisible('.who-chip-avatar')));
  await pp.evaluate(() => (window.location.hash = '#privacy'));
  await pp.waitForSelector('.privacy');
  check('375px: #privacy has no horizontal scroll', (await hScroll(pp)) <= 0, String(await hScroll(pp)));
  await pp.evaluate(() => {
    try {
      sessionStorage.clear();
    } catch (e) {}
    window.location.hash = '#parent';
  });
  await pp.waitForSelector('.gate-card');
  check('375px: gate has no horizontal scroll', (await hScroll(pp)) <= 0, String(await hScroll(pp)));
  await answerGate(pp);
  // reset while offline is not undone when the connection comes back
  await play(pp, 'Kiran', 'ruler-lab', { stars: 2, plays: 1, answered: 5, firstTry: 3 });
  const kiran = (await kidsOf(pp)).filter((c) => c.name === 'Kiran')[0];
  await until(() => cloudRec(kiran.id, 'ruler-lab') && cloudRec(kiran.id, 'ruler-lab').stars === 2);
  await PH.ctx.setOffline(true);
  await pp.evaluate((id) => window.MQ.store.reset(id), kiran.id);
  await sleep(200);
  await PH.ctx.setOffline(false);
  await until(() => cloudRec(kiran.id, 'ruler-lab').stars === 0, 5000);
  await sleep(500);
  check('reset offline: stays reset on this device and in the cloud', cloudRec(kiran.id, 'ruler-lab').stars === 0 && (await pp.evaluate((id) => window.MQ.store.totalStars(id), kiran.id)) === 0, JSON.stringify(cloudRec(kiran.id, 'ruler-lab')));
  // no connection at all: "Sign out anyway" still signs this device out and clears it; a child
  // removed meanwhile is still deleted from the account the next time it signs in here
  await setFlag(pp, 'fake-net-down', '1');
  await play(pp, 'Kiran', 'tally-marks', { stars: 1, plays: 1, answered: 3, firstTry: 1 });
  await pp.evaluate(() => window.MQ.store.addChild('Lali', '🐰', { makeCurrent: false }));
  await setFlag(pp, 'fake-net-down', '');
  await until(() => cloudKids(P1).some((c) => c.name === 'Lali'));
  await until(() => pp.$('.acct-status-saved'));
  const lali = cloudKids(P1).filter((c) => c.name === 'Lali')[0];
  await setFlag(pp, 'fake-net-down', '1');
  await pp.evaluate((id) => window.MQ.store.removeChild(id), lali.id);
  await sleep(1500);
  await pp.click('#acct-panel button:has-text("Sign out")');
  await pp.click('text=Sign out now');
  await until(() => pp.$('.acct-signout-anyway'));
  check('offline sign out: explains that it is offline', /offline/i.test(await pp.textContent('#acct-panel')));
  check('offline sign out: says a removed child has not been deleted from the account yet', /A child you removed has not been deleted from your account yet/.test(await pp.textContent('#acct-panel')), await pp.textContent('.acct-signout'));
  await pp.click('.acct-signout-anyway');
  await until(() => pp.$('#acct-email'));
  const off = await pp.evaluate(() => ({ user: window.MQ.sync.state.user, sess: localStorage.getItem('fake-sb.session'), raw: localStorage.getItem('g3maths.v2') || '' }));
  check('offline sign out: signed out and device cleared without the server', !off.user && !off.sess && !/Kiran|Mira|Lali/.test(off.raw));
  await setFlag(pp, 'fake-net-down', '');
  check('offline sign out: the removal waits on the device (ids only)', !!cloud.children[lali.id] && (await pp.evaluate(() => localStorage.getItem('g3maths.removals') || '')).includes(lali.id));
  await signInByEmail(PH, P1);
  await until(() => pp.$('.acct-status-saved'));
  await until(() => !cloud.children[lali.id], 4000);
  const lr = { cloud: !!cloud.children[lali.id], here: (await kidsOf(pp)).some((c) => c.id === lali.id), kept: await pp.evaluate(() => localStorage.getItem('g3maths.removals')) };
  check('signing in again: the child removed before "Sign out anyway" is deleted from the account, and not brought back', !lr.cloud && !lr.here && !lr.kept, JSON.stringify(lr));
  await PH.ctx.close();

  /* ---- two devices of one family, R1 and R2 ---- */
  {
    const P5 = 'parent.five@example.test';
    const R1 = await newDevice('R1');
    const R2 = await newDevice('R2');
    const r1 = R1.page;
    const r2 = R2.page;
    await go(r1, '#home');
    await r1.evaluate(() => window.MQ.store.updateChild(window.MQ.store.currentChild().id, { name: 'Noor' }));
    await play(r1, 'Noor', 'ruler-lab', { stars: 2, plays: 1, answered: 5, firstTry: 4 });
    await signInByEmail(R1, P5);
    await until(() => r1.$('#acct-consent'));
    await r1.check('#acct-consent');
    await r1.click('text=Agree and turn on sync');
    await until(() => r1.$('.acct-status-saved'));
    await go(r2, '#home');
    await signInByEmail(R2, P5);
    await until(() => r2.$('.acct-status-saved'));
    await go(r1, '#home');
    await go(r2, '#home');
    await sleep(300);
    const noor = cloudKids(P5)[0];
    // R1's reset reaches the database but the reply is lost; R1 then has no connection. R2
    // resets again and the child plays on R2. R1 sends its reset again when it is back.
    await setFlag(r1, 'fake-lose-reply', '1');
    await r1.evaluate((id) => window.MQ.store.reset(id), noor.id);
    await until(() => (cloud.children[noor.id].reset_gen || 0) === 1, 4000);
    await sleep(300);
    await setFlag(r1, 'fake-lose-reply', '');
    await setFlag(r1, 'fake-net-down', '1');
    await r2.evaluate(() => window.MQ.sync.syncNow());
    await sleep(300);
    await r2.evaluate((id) => window.MQ.store.reset(id), noor.id);
    await until(() => (cloud.children[noor.id].reset_gen || 0) === 2, 4000);
    await play(r2, 'Noor', 'tally-marks', { stars: 3, plays: 2, answered: 16, firstTry: 15 });
    await until(() => cloudRec(noor.id, 'tally-marks'), 4000);
    await setFlag(r1, 'fake-net-down', '');
    await r1.evaluate(() => window.MQ.sync.syncNow());
    await sleep(1500);
    await r2.evaluate(() => window.MQ.sync.syncNow());
    await sleep(500);
    const rs2 = { gen: cloud.children[noor.id].reset_gen, tally: cloudRec(noor.id, 'tally-marks'), r2: await r2.evaluate((id) => window.MQ.store.totalStars(id), noor.id), r1pending: await r1.evaluate((id) => !!window.MQ.store.raw().resetPending[id], noor.id) };
    check('reset sent again after a lost reply, with another reset in between: counted once, later play kept', rs2.gen === 2 && !!rs2.tally && rs2.tally.stars === 3 && rs2.r2 === 3 && !rs2.r1pending, JSON.stringify(rs2));
    // R1's page stays open (no fetch since); the child plays a lot on R2, R2 signs out, then
    // plays once on R1: the account keeps the richer record.
    await sleep(1500);
    await play(r2, 'Noor', 'clock-twins', { stars: 3, plays: 6, answered: 40, firstTry: 38, mistakes: { carry: 2 } });
    await until(() => cloudRec(noor.id, 'clock-twins') && cloudRec(noor.id, 'clock-twins').plays === 6, 4000);
    await r2.evaluate(() => window.MQ.sync.signOut());
    await r1.evaluate((id) => {
      const S = window.MQ.store;
      const r = S.activity('clock-twins', id);
      r.plays++;
      r.answered += 8;
      r.firstTry += 4;
      r.stars = Math.max(r.stars, 1);
      r.lastPlayed = new Date().toISOString();
      S.save();
    }, noor.id);
    await sleep(2500);
    const ct = cloudRec(noor.id, 'clock-twins');
    const r1ct = JSON.parse(await r1.evaluate((id) => JSON.stringify(window.MQ.store.progressOf(id).activities['clock-twins']), noor.id));
    check('a device that had not fetched plays once: the account keeps the other device\'s stars and plays', !!ct && ct.stars === 3 && ct.plays >= 6 && ct.answered >= 40 && r1ct.stars === 3, JSON.stringify({ cloud: ct, r1: r1ct }));
    await R1.ctx.close();
    await R2.ctx.close();
  }

  await A.ctx.close();
  await B.ctx.close();
  check('no page errors or console errors', pageErrors.length === 0, '\n    ' + pageErrors.slice(0, 10).join('\n    '));
  await browser.close();
  server.close();
}

main()
  .catch((e) => {
    check('test run finished', false, e.stack || String(e));
  })
  .then(async () => {
    try {
      if (browser) await browser.close();
    } catch (e) {}
    console.log('\n' + (results.length - failed) + ' passed, ' + failed + ' failed');
    process.exit(failed ? 1 : 0);
  });

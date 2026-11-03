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
function cloudHandle(req) {
  const ok = (data) => ({ data: data, error: null });
  const a = req.args || {};
  if (req.op === 'otp') {
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
      rows.forEach((r) => (cloud.parents[r.id] = Object.assign({}, cloud.parents[r.id] || {}, r)));
      return ok(null);
    }
    if (t === 'children') {
      for (const r of rows) {
        if (r.parent_id !== uid) return rlsError();
        if (cloud.children[r.id] && cloud.children[r.id].parent_id !== uid) return rlsError();
        if (!cloud.parents[uid]) return { data: null, error: { code: '23503', message: 'insert or update on table "children" violates foreign key constraint "children_parent_id_fkey"' } };
      }
      const after = Object.assign({}, cloud.children);
      rows.forEach((r) => (after[r.id] = Object.assign({}, after[r.id] || {}, r)));
      if (Object.keys(after).filter((k) => after[k].parent_id === uid).length > 10) return { data: null, error: { code: 'P0001', message: 'A family can have at most 10 children' } };
      cloud.children = after;
      return ok(null);
    }
    if (t === 'progress') {
      for (const r of rows) {
        if (!ownedChild(uid, r.child_id)) return rlsError();
        if (!(r.stars >= 0 && r.stars <= 3)) return { data: null, error: { code: '23514', message: 'stars out of range' } };
      }
      cloud.progressUpserts += rows.length;
      // Like Postgres: timestamptz comes back as '+00:00', jsonb keys in its own order.
      rows.forEach((r) => {
        const m = {};
        Object.keys(r.mistakes || {}).reverse().forEach((k) => (m[k] = r.mistakes[k]));
        cloud.progress[r.child_id + '|' + r.activity_id] = Object.assign({}, r, { mistakes: m, last_played: r.last_played ? new Date(r.last_played).toISOString().replace('Z', '+00:00') : null });
      });
      return ok(null);
    }
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
  siteName: 'Grade 3 Maths', consentVersion: ${JSON.stringify(CONSENT_VERSION)},
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
  // online) and 'fake-delay' (ms before each reply arrives).
  function call(op, args) {
    if (navigator.onLine === false || localStorage.getItem('fake-net-down')) return Promise.resolve({ data: null, error: { message: 'TypeError: Failed to fetch' } });
    var s = readS();
    var delay = +localStorage.getItem('fake-delay') || 0;
    return window.__sb({ op: op, token: s ? s.access_token : null, args: args || {} }).then(function (res) {
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
      then: function (ok, bad) { return call('query', q).then(ok, bad); }
    };
    return b;
  }
  var client = {
    from: function (t) {
      return {
        select: function (cols) { return builder(t, 'select', cols || '*'); },
        upsert: function (rows) { return builder(t, 'upsert', JSON.parse(JSON.stringify(Array.isArray(rows) ? rows : [rows]))); },
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
      if (m.type() === 'error' && !/fonts\.g|ERR_FAILED|ERR_INTERNET_DISCONNECTED/.test(m.text())) pageErrors.push(name + ' console.error: ' + m.text());
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
    check('on-device: Download my data gives a dated JSON file', /^grade3-maths-data-\d{4}-\d\d-\d\d\.json$/.test(dl.name) && Array.isArray(dl.json.children) && dl.json.children.length === 1, dl.name);

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
    await go(p, '#privacy');
    const priv = await p.textContent('.privacy');
    check('privacy: on-device, no contact email -> "the site owner"', /Draft — to be checked/.test(priv) && /the site owner/.test(priv));
    await D.ctx.close();

    // one child: straight home
    const D1 = await newDevice('local1', { fake: false });
    await go(D1.page, '#home');
    check('picker: not shown with only one child', !(await D1.page.$('.who-page')));
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
    check('gate: 3 wrong answers in a row make it wait', (await D1.page.isDisabled('#gate-answer')) && /ask a grown-up/i.test(await D1.page.textContent('.gate-msg')));
    await D1.ctx.close();
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

  // delete account (parent two, on A)
  await openParent(pa);
  await pa.click('text=Delete my account');
  check('delete: needs DELETE typed', await pa.isDisabled('text=Delete everything'));
  check('a11y: focus moves to the DELETE box', /^#acct-delete-input/.test(await focusedText(pa)), await focusedText(pa));
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
  // no connection at all: "Sign out anyway" still signs this device out and clears it
  await setFlag(pp, 'fake-net-down', '1');
  await play(pp, 'Kiran', 'tally-marks', { stars: 1, plays: 1, answered: 3, firstTry: 1 });
  await sleep(1500);
  await pp.click('#acct-panel button:has-text("Sign out")');
  await pp.click('text=Sign out now');
  await until(() => pp.$('.acct-signout-anyway'));
  check('offline sign out: explains that it is offline', /offline/i.test(await pp.textContent('#acct-panel')));
  await pp.click('.acct-signout-anyway');
  await until(() => pp.$('#acct-email'));
  const off = await pp.evaluate(() => ({ user: window.MQ.sync.state.user, sess: localStorage.getItem('fake-sb.session'), raw: localStorage.getItem('g3maths.v2') || '' }));
  check('offline sign out: signed out and device cleared without the server', !off.user && !off.sess && !/Kiran|Mira/.test(off.raw));
  await setFlag(pp, 'fake-net-down', '');
  await PH.ctx.close();

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

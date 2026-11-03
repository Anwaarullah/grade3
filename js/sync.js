/* Grade 3 Maths — parent accounts and cloud sync (Supabase).
 *
 * Progress is always saved on the device first (MQ.store). When a parent is signed in,
 * changed records are pushed to Supabase and other devices' records are pulled and merged,
 * so the site keeps working offline and catches up when the connection returns.
 *
 * Off unless MQ.config.supabaseUrl and supabaseAnonKey are set (see js/config.js).
 * Tests can pass MQ.config.createClient to supply a fake client.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var cfg = MQ.config || {};
  // Served from this site (same origin), so no outside script host is involved. To update,
  // copy dist/umd/supabase.js of the new @supabase/supabase-js release to js/vendor/.
  var SUPABASE_JS = 'js/vendor/supabase-2.45.4.js';
  var LINK_PROBLEM = 'Sign-in did not finish. The link may have expired, been used already, or been opened in a different browser. Please ask for a new link on this device.';
  var GOOGLE_PROBLEM = 'Google sign-in was cancelled or did not finish. Please try again.';
  // Which sign-in this tab started ('google' or 'email'), so a failed return gets the right
  // message. Google comes back in the same tab; an email link usually opens a new one (no flag).
  var METHOD_KEY = 'g3maths.signin';
  function setMethod(m) {
    try {
      if (m) window.sessionStorage.setItem(METHOD_KEY, m);
      else window.sessionStorage.removeItem(METHOD_KEY);
    } catch (e) {}
  }
  /** The message for a sign-in that came back without signing in; forgets the started method. */
  function signInProblem() {
    var m = null;
    try {
      m = window.sessionStorage.getItem(METHOD_KEY);
    } catch (e) {}
    setMethod(null);
    return m === 'google' ? GOOGLE_PROBLEM : LINK_PROBLEM;
  }
  // How long the Parent corner says "Connecting…" before it shows the offline state instead
  // (supabase-js retries renewing an expired sign-in for up to about a minute).
  var START_WAIT_MS = 5000;

  var listeners = [];
  var state = {
    enabled: !!((cfg.supabaseUrl && cfg.supabaseAnonKey) || cfg.createClient),
    ready: false,
    startFailed: false, // accounts are set up but the sign-in service could not be reached
    user: null, // { id, email }
    consented: false,
    consentKnown: false, // false until the account's consent has been checked
    status: 'idle', // idle | syncing | saved | offline | error
    lastError: '',
    signInError: '', // a sign-in link that did not work (shown on the sign-in card)
    reconnecting: false, // signed in on this device, but the sign-in could not be renewed yet (no connection)
    otherAccount: false, // this device holds unsaved progress of a different account (nothing is synced meanwhile)
  };
  var client = null;
  var subscribed = false;
  var pushTimer = null;
  var pushing = null; // the push in flight, so pushes never overlap
  var sessionTask = Promise.resolve();
  var inFlight = {}; // a sign-out or account deletion on its way: asking again returns the same one
  function once(key, fn) {
    if (inFlight[key]) return inFlight[key];
    var p = (inFlight[key] = Promise.resolve().then(fn));
    function done() {
      if (inFlight[key] === p) delete inFlight[key];
    }
    p.then(done, done);
    return p;
  }

  function emit() {
    listeners.forEach(function (fn) {
      try {
        fn(state);
      } catch (e) {
        console.error(e);
      }
    });
  }
  function setStatus(s, err) {
    state.status = s;
    state.lastError = err || '';
    emit();
  }
  function errMsg(e) {
    return (e && e.message) || String(e);
  }
  function isOffline() {
    return typeof navigator !== 'undefined' && navigator.onLine === false;
  }
  function isNetworkError(e) {
    if (isOffline()) return true;
    if (!e) return false;
    if (e.name === 'AuthRetryableFetchError' || e.name === 'TypeError') return true;
    return /failed to fetch|networkerror|network request failed|load failed/i.test(errMsg(e));
  }
  function syncFailed(e) {
    var net = isNetworkError(e);
    if (!net) console.error('Could not sync:', errMsg(e), e); // a dropped connection is expected; it is retried when back online
    setStatus(net ? 'offline' : 'error', errMsg(e));
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () {
        // Take the failed tag away so a later retry can add it again.
        if (s.parentNode) s.parentNode.removeChild(s);
        reject(new Error('Could not load ' + src));
      };
      document.head.appendChild(s);
    });
  }

  function makeClient() {
    if (client) return Promise.resolve(client);
    if (cfg.createClient) {
      return new Promise(function (resolve) {
        resolve(cfg.createClient());
      });
    }
    var go = function () {
      return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
      });
    };
    if (window.supabase && window.supabase.createClient) return Promise.resolve(go());
    return loadScript(SUPABASE_JS).then(go);
  }

  /** Forget the sign-in kept in this browser without asking the server (used when offline). */
  function clearLocalSession() {
    var key = client && client.auth && client.auth.storageKey;
    if (!key) return;
    [key, key + '-code-verifier', key + '-user'].forEach(function (k) {
      try {
        window.localStorage.removeItem(k);
      } catch (e) {}
    });
  }

  /*
   * A sign-in forgotten on this device without telling the server (no connection). supabase-js
   * may still be renewing it in the background (it retries for a while), and when the
   * connection comes back it would save it again and sign this device back in, with the
   * family's children. Such a renewal is dropped, in every tab of this site. Only the account
   * id is kept, for a few minutes, and a new sign-in on this device (?code=) clears it.
   */
  var FORGOT_KEY = 'g3maths.forgotten';
  var FORGOT_MS = 10 * 60 * 1000;
  var refreshStopped = false;
  function forgetSession(uid) {
    if (uid) {
      try {
        window.localStorage.setItem(FORGOT_KEY, JSON.stringify({ id: uid, at: Date.now() }));
      } catch (e) {}
    }
    if (client && client.auth && client.auth.stopAutoRefresh) {
      refreshStopped = true;
      Promise.resolve()
        .then(function () {
          return client.auth.stopAutoRefresh();
        })
        .catch(function () {});
    }
    clearLocalSession();
  }
  function forgotten(uid) {
    var v = null;
    try {
      v = JSON.parse(window.localStorage.getItem(FORGOT_KEY));
    } catch (e) {}
    if (!v) return false;
    var age = Date.now() - (Number(v.at) || 0);
    if (age < 0 || age > FORGOT_MS) {
      unforget();
      return false;
    }
    return v.id === uid;
  }
  function unforget() {
    try {
      window.localStorage.removeItem(FORGOT_KEY);
    } catch (e) {}
  }
  /** A renewed copy of a forgotten sign-in: remove it again, and ask the server to end it. */
  function dropRenewed(session) {
    clearLocalSession();
    var auth = client && client.auth;
    if (auth && auth.admin && auth.admin.signOut && session.access_token) {
      Promise.resolve()
        .then(function () {
          return auth.admin.signOut(session.access_token, 'local');
        })
        .catch(function () {});
    }
  }

  /*
   * Children removed on this device whose removal had not reached the account when the device
   * was cleared (e.g. "Sign out anyway" without a connection). Kept by account id (child ids
   * only, no names) and sent the next time that account is signed in on this device.
   */
  var REMOVALS_KEY = 'g3maths.removals';
  function readRemovals() {
    try {
      var v = JSON.parse(window.localStorage.getItem(REMOVALS_KEY));
      return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
    } catch (e) {
      return {};
    }
  }
  function writeRemovals(all) {
    try {
      if (Object.keys(all).length) window.localStorage.setItem(REMOVALS_KEY, JSON.stringify(all));
      else window.localStorage.removeItem(REMOVALS_KEY);
    } catch (e) {}
  }
  function removalsFor(uid) {
    var list = readRemovals()[uid];
    return Array.isArray(list)
      ? list.filter(function (id) {
          return typeof id === 'string';
        })
      : [];
  }
  /** Before the device is cleared: keep its account's removals that were not sent yet. */
  function keepRemovals() {
    var d = MQ.store.raw();
    if (!d.accountId || !d.deletedChildren.length) return;
    var all = readRemovals();
    var list = removalsFor(d.accountId);
    d.deletedChildren.forEach(function (id) {
      if (list.indexOf(id) === -1) list.push(id);
    });
    all[d.accountId] = list.slice(-50);
    writeRemovals(all);
  }
  /** ids: sent to the account (or the account is gone: all of them). */
  function removalsDone(uid, ids) {
    var all = readRemovals();
    if (!all[uid]) return;
    var left = ids
      ? removalsFor(uid).filter(function (id) {
          return ids.indexOf(id) === -1;
        })
      : [];
    if (left.length) all[uid] = left;
    else delete all[uid];
    writeRemovals(all);
  }
  /** Clear this device (sign-out, another account), keeping removals that were not sent yet. */
  function clearDevice() {
    keepRemovals();
    MQ.store.wipe();
  }

  /** The sign-in kept in this browser by supabase-js, or null. */
  function storedSession() {
    var key = client && client.auth && client.auth.storageKey;
    if (!key) return null;
    try {
      var s = JSON.parse(window.localStorage.getItem(key));
      return s && s.access_token && s.user && s.user.id ? s : null;
    } catch (e) {
      return null;
    }
  }
  /**
   * Resolves true when supabase-js still holds this parent's session. When it cannot renew an
   * expired one it sends requests with the public key only, and an empty list of children
   * from such a request must never be read as "every child was removed".
   */
  function sessionFor(uid) {
    return Promise.resolve(client.auth.getSession()).then(function (r) {
      var s = r && r.data ? r.data.session : null;
      if (s && s.user && s.user.id === uid) return true;
      if (r && r.error && isNetworkError(r.error)) throw r.error; // shown as offline, retried later
      return false; // the sign-in ended (e.g. it could not be renewed): SIGNED_OUT follows
    });
  }
  /** The session had already ended on the server, or was removed by supabase-js on the way. */
  function alreadySignedOut(e) {
    if (!e) return false;
    if (e.name === 'AuthSessionMissingError' || !state.user) return true;
    if ([400, 401, 403, 404].indexOf(e.status) !== -1) return true;
    return /^(refresh_token_not_found|session_not_found|user_not_found)$/.test(e.code || '');
  }

  /* ---------------- merging ---------------- */
  function toRow(childId, activityId, r) {
    return {
      child_id: childId,
      activity_id: activityId,
      stars: r.stars || 0,
      plays: r.plays || 0,
      first_try: r.firstTry || 0,
      answered: r.answered || 0,
      last_played: r.lastPlayed || null,
      mistakes: r.mistakes || {},
      reset_gen: r.gen || 0,
    };
  }
  function fromRow(row) {
    return {
      stars: row.stars || 0,
      plays: row.plays || 0,
      firstTry: row.first_try || 0,
      answered: row.answered || 0,
      lastPlayed: row.last_played || null,
      mistakes: row.mistakes || {},
      gen: Number(row.reset_gen) || 0,
    };
  }
  function timeOf(iso) {
    var t = iso ? Date.parse(iso) : NaN;
    return isNaN(t) ? 0 : t;
  }
  /** True when two progress rows hold the same synced values (the database may reorder or reformat them). */
  function sameRow(a, b) {
    var nums = ['stars', 'plays', 'first_try', 'answered', 'reset_gen'];
    for (var i = 0; i < nums.length; i++) {
      if ((Number(a[nums[i]]) || 0) !== (Number(b[nums[i]]) || 0)) return false;
    }
    if (timeOf(a.last_played) !== timeOf(b.last_played)) return false;
    var ma = a.mistakes || {};
    var mb = b.mistakes || {};
    var ka = Object.keys(ma);
    if (ka.length !== Object.keys(mb).length) return false;
    return ka.every(function (k) {
      return Object.prototype.hasOwnProperty.call(mb, k) && Number(ma[k]) === Number(mb[k]);
    });
  }
  function blankRec(gen) {
    return { stars: 0, plays: 0, firstTry: 0, answered: 0, lastPlayed: null, mistakes: {}, gen: gen || 0 };
  }
  function mistakesKey(r) {
    var m = r.mistakes || {};
    return JSON.stringify(
      Object.keys(m)
        .sort()
        .map(function (k) {
          return [k, Number(m[k]) || 0];
        })
    );
  }
  /** True when a has more history than b. Every device decides the same way, even on a tie. */
  function richer(a, b) {
    var diff = (a.answered || 0) - (b.answered || 0);
    if (!diff) diff = timeOf(a.lastPlayed) - timeOf(b.lastPlayed);
    if (!diff) diff = (a.firstTry || 0) - (b.firstTry || 0);
    if (diff) return diff > 0;
    return mistakesKey(a) >= mistakesKey(b);
  }
  /** Keep whichever record has more history; never lose stars. merge(a, b) equals merge(b, a). */
  function mergeRecord(local, remote) {
    if (!local) return remote;
    if (!remote) return local;
    // Built after a later "Reset progress": the other one is from before it.
    if ((local.gen || 0) !== (remote.gen || 0)) return JSON.parse(JSON.stringify((local.gen || 0) > (remote.gen || 0) ? local : remote));
    var base = richer(remote, local) ? remote : local;
    var out = JSON.parse(JSON.stringify(base));
    out.stars = Math.max(local.stars || 0, remote.stars || 0);
    out.plays = Math.max(local.plays || 0, remote.plays || 0);
    if (local.lastPlayed && remote.lastPlayed) out.lastPlayed = timeOf(local.lastPlayed) >= timeOf(remote.lastPlayed) ? local.lastPlayed : remote.lastPlayed;
    else out.lastPlayed = local.lastPlayed || remote.lastPlayed || null;
    return out;
  }
  function progressIn(d, childId) {
    if (!d.progress[childId]) d.progress[childId] = { activities: {} };
    if (!d.progress[childId].activities) d.progress[childId].activities = {};
    return d.progress[childId];
  }
  function markDirty(d, childId, aid) {
    d.dirty[childId] = d.dirty[childId] || {};
    d.dirty[childId][aid] = true;
  }
  function hasChild(d, id) {
    return d.children.some(function (c) {
      return c.id === id;
    });
  }
  /** The automatic "Player 1" that nobody has played with or renamed, and that is not in the account. */
  function isUnusedPlaceholder(d, c) {
    if (!c.placeholder || d.syncedChildren[c.id]) return false;
    var acts = (d.progress[c.id] || {}).activities || {};
    return !Object.keys(acts).some(function (a) {
      return acts[a].plays > 0;
    });
  }
  /** Changes on this device that have not reached the account yet (an unused "Player 1" is nothing to lose). */
  function hasUnsaved() {
    var d = MQ.store.raw();
    if (d.deletedChildren.length) return true;
    var kids = d.children.filter(function (c) {
      return !isUnusedPlaceholder(d, c);
    });
    if (kids.some(function (c) { return d.dirtyChildren[c.id]; })) return true;
    return Object.keys(d.dirty).some(function (cid) {
      return hasChild(d, cid) && Object.keys(d.dirty[cid] || {}).length > 0;
    });
  }

  /** The device holds another account's profiles with changes that never reached that account. */
  function foreignUnsaved() {
    var d = MQ.store.raw();
    return !!(state.user && d.accountId && d.accountId !== state.user.id && hasUnsaved());
  }
  /**
   * The account's reset count for a child (children.reset_gen, counted by the database, so no
   * device clock is involved). A higher count than this device knew: "Reset progress" was
   * pressed on another device, so blank the records built before it, without uploading them.
   * ours: the count the database gave to this device's own reset; what was played here since
   * that reset is kept (renumbered, and uploaded).
   */
  function adoptReset(d, cid, gen, ours) {
    var was = d.resetGen[cid] || 0;
    var acts = progressIn(d, cid).activities;
    Object.keys(acts).forEach(function (a) {
      var g = acts[a].gen || 0;
      if (ours && g === was) {
        if (g === gen) return;
        acts[a].gen = gen;
        markDirty(d, cid, a);
      } else if (g < gen) {
        acts[a] = blankRec(gen);
        if (d.dirty[cid]) delete d.dirty[cid][a];
      }
    });
    d.resetGen[cid] = gen;
  }
  /** Forget a child on this device (it was removed on another device). */
  function dropChild(d, id) {
    d.children = d.children.filter(function (c) {
      return c.id !== id;
    });
    delete d.progress[id];
    delete d.dirty[id];
    delete d.dirtyChildren[id];
    delete d.syncedChildren[id];
    delete d.resetGen[id];
    delete d.resetPending[id];
    if (d.currentChildId === id) d.currentChildId = null;
  }

  /* ---------------- pull / push ---------------- */
  function pull() {
    if (!client || !state.user || !state.consented) return Promise.resolve();
    var uid = state.user.id;
    return sessionFor(uid).then(function (ok) {
      if (ok && state.user && state.user.id === uid) return pullFor(uid);
    });
  }
  function pullFor(uid) {
    var d = MQ.store.raw();
    // The profiles on this device came from another parent's account (their session ended
    // without "Sign out"). What reached that account is safe there, so clear them rather than
    // upload them into this one, unless some of it never reached it: then the parent chooses
    // (see state.otherAccount) and nothing is synced meanwhile.
    if (d.accountId && d.accountId !== uid) {
      if (hasUnsaved()) {
        state.otherAccount = true;
        setStatus('idle');
        return Promise.resolve();
      }
      MQ.store.wipe();
      d = MQ.store.raw();
    }
    state.otherAccount = false;
    // The screens are told only when something changed (see the end), so coming back to the
    // tab does not rebuild them for nothing.
    var before = JSON.stringify(d);
    // Children removed here that had not reached the account when it signed out on this
    // device: removed now (see keepRemovals), and not brought back by this fetch.
    removalsFor(uid).forEach(function (id) {
      if (d.deletedChildren.indexOf(id) === -1) d.deletedChildren.push(id);
      if (hasChild(d, id)) dropChild(d, id);
    });
    // The device was cleared (sign-out, another tab) or another parent signed in while a
    // reply was on its way: drop that reply.
    function stale() {
      return MQ.store.raw() !== d || !state.user || state.user.id !== uid;
    }
    return client
      .from('children')
      .select('id,name,avatar,reset_gen')
      .then(function (res) {
        if (res.error) throw res.error;
        if (stale()) return null;
        var remoteKids = res.data || [];
        d.accountId = uid;
        remoteKids.forEach(function (rk) {
          d.syncedChildren[rk.id] = true;
          if (d.deletedChildren.indexOf(rk.id) !== -1) return;
          var local = d.children.filter(function (c) { return c.id === rk.id; })[0];
          if (!local) d.children.push({ id: rk.id, name: rk.name, avatar: rk.avatar });
          else if (!d.dirtyChildren[rk.id]) {
            local.name = rk.name;
            local.avatar = rk.avatar;
          }
          // "Reset progress" on another device. A reset made on this device that has not reached
          // the account yet wins: it is the later one, and the database counts it when it arrives.
          var gen = Number(rk.reset_gen) || 0;
          if (!d.resetPending[rk.id] && gen > (d.resetGen[rk.id] || 0)) adoptReset(d, rk.id, gen, false);
        });
        // The automatic "Player 1" of a fresh or wiped device is not uploaded into a family that
        // already has children, or next to other children on this device, as long as nobody has
        // played with it yet. (The consent step lists it when it is the only profile.)
        var others = d.children.some(function (c) {
          return !isUnusedPlaceholder(d, c);
        });
        if (remoteKids.length || others) {
          d.children = d.children.filter(function (c) {
            if (!isUnusedPlaceholder(d, c)) return true;
            delete d.progress[c.id];
            delete d.dirty[c.id];
            delete d.dirtyChildren[c.id];
            if (d.currentChildId === c.id) d.currentChildId = null;
            return false;
          });
        }
        // A child that was in the account before but is gone now was removed on another
        // device: remove it here too. Children made on this device (never uploaded) get
        // uploaded on the next push.
        d.children.slice().forEach(function (c) {
          if (remoteKids.some(function (rk) { return rk.id === c.id; })) return;
          if (d.syncedChildren[c.id]) dropChild(d, c.id);
          else d.dirtyChildren[c.id] = true;
        });
        if (!d.currentChildId && d.children.length) d.currentChildId = d.children[0].id;
        var ids = remoteKids
          .map(function (k) { return k.id; })
          .filter(function (id) { return hasChild(d, id); });
        if (!ids.length) return { data: [] };
        return client.from('progress').select('*').in('child_id', ids);
      })
      .then(function (res) {
        if (!res) return;
        if (res.error) throw res.error;
        if (stale()) return;
        (res.data || []).forEach(function (row) {
          if (!hasChild(d, row.child_id)) return;
          var p = progressIn(d, row.child_id);
          var local = p.activities[row.activity_id];
          // Built before the latest reset this device knows of: blank. While a reset made on this
          // device has not reached the account (e.g. it was done offline), every cloud record of
          // that child is from before it; the database deletes them when the reset arrives.
          if (d.resetPending[row.child_id] || (Number(row.reset_gen) || 0) < (d.resetGen[row.child_id] || 0)) return;
          var merged = mergeRecord(local, fromRow(row));
          p.activities[row.activity_id] = merged;
          if (!sameRow(toRow(row.child_id, row.activity_id, merged), row)) markDirty(d, row.child_id, row.activity_id);
        });
        if (JSON.stringify(d) !== before) MQ.store.save('pull');
      });
  }

  /** Sends this device's changes. Resolves true when everything was saved, false otherwise. */
  function push() {
    if (pushing) return pushing.then(push);
    if (!client || !state.user || !state.consented) return Promise.resolve(false);
    if (isOffline()) {
      setStatus('offline');
      return Promise.resolve(false);
    }
    var uid = state.user.id;
    var d = MQ.store.raw();
    // Not yet matched with this account (e.g. the device was cleared in another tab): fetch first.
    if (d.accountId !== uid) {
      return pull()
        .then(function () {
          return MQ.store.raw().accountId === uid ? push() : false;
        })
        .catch(function (e) {
          syncFailed(e);
          return false;
        });
    }
    var deleted = d.deletedChildren.slice();
    var sentKids = {};
    function kidKey(c) {
      return JSON.stringify([c.name, c.avatar, d.resetPending[c.id] || null]);
    }
    // Children never saved to the account are added; the others are only ever updated, so a
    // child removed on another device is never added back (see kidSaved).
    var newKids = [];
    var oldKids = [];
    d.children.filter(function (c) { return d.dirtyChildren[c.id]; }).forEach(function (c) {
      sentKids[c.id] = kidKey(c);
      // reset_id: a "Reset progress" made here that the account does not have yet. The database
      // counts it (reset_gen); a device never sets or lowers the count of a child already saved.
      var row = { id: c.id, name: c.name, avatar: c.avatar, reset_id: d.resetPending[c.id] || null };
      if (d.syncedChildren[c.id]) oldKids.push(row);
      else newKids.push(Object.assign(row, { parent_id: uid, reset_gen: d.resetGen[c.id] || 0 }));
    });
    var sentRows = {};
    /**
     * The changed records that can be saved now. They wait while their child is not in the
     * account yet, or while a reset made here has not reached it (they are built on a count the
     * account does not have yet).
     */
    function progressRows() {
      var out = [];
      Object.keys(d.dirty).forEach(function (cid) {
        if (!hasChild(d, cid) || !d.syncedChildren[cid] || d.resetPending[cid]) return;
        Object.keys(d.dirty[cid]).forEach(function (aid) {
          var r = progressIn(d, cid).activities[aid];
          if (!r) return;
          var row = toRow(cid, aid, r);
          sentRows[cid + '|' + aid] = JSON.stringify(row);
          out.push(row);
        });
      });
      return out;
    }
    if (!newKids.length && !oldKids.length && !deleted.length && !progressRows().length) {
      setStatus('saved');
      return Promise.resolve(true);
    }
    var again = false; // something changed while the request was on its way
    var dropped = false; // a child was removed on another device
    function stale() {
      return MQ.store.raw() !== d || !state.user || state.user.id !== uid;
    }
    /** row: the child as the database now has it. */
    function kidSaved(k, row) {
      var c = d.children.filter(function (x) { return x.id === k.id; })[0];
      if (!c) return; // removed here meanwhile: deletedChildren sends that next
      d.syncedChildren[k.id] = true;
      var same = kidKey(c) === sentKids[k.id];
      var ours = !!k.reset_id && d.resetPending[k.id] === k.reset_id;
      if (ours) delete d.resetPending[k.id];
      var gen = Number(row && row.reset_gen) || 0;
      if (ours) adoptReset(d, k.id, gen, true);
      else if (!d.resetPending[k.id] && gen > (d.resetGen[k.id] || 0)) adoptReset(d, k.id, gen, false);
      if (same) delete d.dirtyChildren[k.id];
      else again = true;
    }
    setStatus('syncing');
    var step = Promise.resolve();
    if (deleted.length) {
      step = step.then(function () {
        return client.from('children').delete().in('id', deleted).then(function (res) {
          if (res.error) throw res.error;
          d.deletedChildren = d.deletedChildren.filter(function (id) { return deleted.indexOf(id) === -1; });
          removalsDone(uid, deleted);
        });
      });
    }
    // A child row that is refused (e.g. over the 10-children limit) does not hold back the
    // other children, or the progress of children already in the account.
    var kidsError = null;
    if (newKids.length) {
      step = step.then(function () {
        return client
          .from('children')
          .upsert(newKids)
          .select('id,reset_gen')
          .then(function (res) {
            if (res.error) {
              kidsError = res.error;
              return;
            }
            newKids.forEach(function (k) {
              var row = (res.data || []).filter(function (x) { return x.id === k.id; })[0];
              kidSaved(k, row || k);
            });
          });
      });
    }
    if (oldKids.length) {
      step = step.then(function () {
        return Promise.all(
          oldKids.map(function (k) {
            var fields = { name: k.name, avatar: k.avatar };
            if (k.reset_id) fields.reset_id = k.reset_id;
            return client
              .from('children')
              .update(fields)
              .eq('id', k.id)
              .select('id,reset_gen')
              .then(function (res) {
                if (res.error) {
                  kidsError = kidsError || res.error;
                  return;
                }
                var row = (res.data || [])[0];
                if (row) return kidSaved(k, row);
                // No such child in the account any more: it was removed on another device.
                dropChild(d, k.id);
                dropped = true;
              });
          })
        );
      });
    }
    step = step.then(function () {
      var send = progressRows();
      if (!send.length) return;
      return client.from('progress').upsert(send).then(function (res) {
        if (res.error) throw res.error;
        send.forEach(function (row) {
          var cid = row.child_id;
          var aid = row.activity_id;
          if (!d.dirty[cid]) return;
          var r = progressIn(d, cid).activities[aid];
          if (r && JSON.stringify(toRow(cid, aid, r)) !== sentRows[cid + '|' + aid]) again = true;
          else delete d.dirty[cid][aid];
        });
      });
    });
    pushing = step
      .then(function () {
        if (kidsError) throw kidsError;
        if (stale()) {
          // Another tab saved meanwhile, so this tab now holds that tab's copy, whose dirty flags
          // still list what was just sent: push again (the same rows, harmless) to clear them.
          if (state.user && state.user.id === uid && MQ.store.raw().accountId === uid) again = true;
          return false;
        }
        MQ.store.save(dropped ? 'pull' : 'pushed'); // 'pull': the screens show the removal
        setStatus('saved');
        return true;
      })
      .catch(function (e) {
        if (dropped && !stale()) MQ.store.save('pull'); // still show the removal
        syncFailed(e);
        return false;
      })
      .then(function (ok) {
        pushing = null;
        if (again) schedulePush();
        return ok && !again;
      });
    return pushing;
  }

  function schedulePush() {
    if (!state.user || !state.consented) return;
    clearTimeout(pushTimer);
    // Fetch first, then send: a record played on another device since this one last fetched is
    // merged in rather than replaced by this device's older copy (the database also keeps the
    // richer record, see backend/schema.sql). After an error this also matters: e.g. the records
    // of a child removed on another device make every push fail until this device learns of it.
    pushTimer = setTimeout(catchUp, 1200);
  }

  /** Looks up whether this parent agreed to the current privacy notice. */
  function checkConsent() {
    var uid = state.user.id;
    return client
      .from('parents')
      .select('consent_version')
      .eq('id', uid)
      .then(function (res) {
        if (res.error) throw res.error;
        if (!state.user || state.user.id !== uid) return;
        var row = (res.data || [])[0];
        // The parents row exists from the first agreement until the account is deleted, so the
        // account whose profiles are on this device was deleted on another device: clear them.
        if (!row && MQ.store.raw().accountId === uid) {
          removalsDone(uid);
          MQ.store.wipe();
        }
        state.consented = !!(row && row.consent_version === cfg.consentVersion);
        state.consentKnown = true;
      })
      .catch(function (e) {
        if (!isNetworkError(e)) throw e;
        // Offline: keep what we knew and try again when the connection is back.
        setStatus('offline', errMsg(e));
      });
  }

  function onSession(session) {
    var u = session && session.user ? { id: session.user.id, email: session.user.email || '' } : null;
    // A sign-in this device forgot while offline came back (see forgetSession): not a new one.
    if (u && !(state.user && state.user.id === u.id) && forgotten(u.id)) {
      dropRenewed(session);
      return sessionTask;
    }
    if (u && refreshStopped && client.auth.startAutoRefresh) {
      refreshStopped = false;
      Promise.resolve()
        .then(function () {
          return client.auth.startAutoRefresh();
        })
        .catch(function () {});
    }
    // supabase-js says SIGNED_IN again for the same sign-in (tab focus, other tabs, token
    // refresh): nothing to redo, and consent stays as it is.
    if (u && state.user && state.user.id === u.id) {
      if (u.email && u.email !== state.user.email) {
        state.user.email = u.email;
        emit();
      }
      return sessionTask;
    }
    state.user = u;
    state.consented = false;
    state.consentKnown = false;
    state.reconnecting = false;
    state.otherAccount = !!u && foreignUnsaved();
    if (!u) {
      clearTimeout(pushTimer);
      setStatus('idle');
      sessionTask = Promise.resolve();
      return sessionTask;
    }
    state.signInError = '';
    setStatus('syncing');
    sessionTask = checkConsent()
      .then(function () {
        if (!state.user || state.user.id !== u.id || !state.consentKnown) return;
        if (!state.consented) {
          setStatus('idle');
          return;
        }
        return pull().then(push);
      })
      .catch(syncFailed);
    return sessionTask;
  }

  /** Fetch other devices' changes, then send ours. */
  function catchUp() {
    if (client && !state.user) return state.reconnecting ? reconnect() : Promise.resolve();
    if (!client || !state.user) return Promise.resolve();
    if (isOffline()) {
      setStatus('offline'); // tried again when the browser is back online
      return Promise.resolve();
    }
    var uid = state.user.id;
    var first = state.consentKnown ? Promise.resolve() : checkConsent().then(emit);
    return first
      .then(function () {
        if (!state.user || state.user.id !== uid || !state.consented) return;
        return pull().then(push);
      })
      .catch(syncFailed);
  }

  /** The sign-in kept on this device could not be renewed at start: ask supabase-js again. */
  function reconnect() {
    return Promise.resolve(client.auth.getSession())
      .then(function (r) {
        var s = r && r.data ? r.data.session : null;
        if (s) return onSession(s);
        if (!storedSession()) onSession(null); // the library gave up on it
      })
      .catch(function (e) {
        console.warn(e);
      });
  }
  function gotSession(res, hadCode) {
    var session = res && res.data ? res.data.session : null;
    // supabase-js reads the ?code=... left by the sign-in redirect in the background;
    // getSession() waits for that, so only now is it safe to tidy the address bar.
    try {
      if (/[?&]code=/.test(window.location.search)) window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    } catch (e) {}
    if (!session && res && res.error && isNetworkError(res.error) && storedSession()) {
      // Still signed in, but the expired sign-in could not be renewed without a connection:
      // keep it (not the sign-in card) and try again when the connection is back.
      state.ready = true;
      state.reconnecting = true;
      setStatus('offline', errMsg(res.error));
      return;
    }
    if (hadCode && !session) state.signInError = signInProblem();
    else if (session) setMethod(null);
    state.ready = true;
    return onSession(session);
  }

  /* ---------------- public API ---------------- */
  var sync = (MQ.sync = {
    state: state,
    onChange: function (fn) {
      listeners.push(fn);
    },
    start: function () {
      if (!state.enabled) {
        state.ready = true;
        return Promise.resolve();
      }
      var hadCode = false;
      try {
        hadCode = /[?&]code=/.test(window.location.search);
      } catch (e) {}
      if (hadCode) unforget(); // a new sign-in on this device
      return makeClient()
        .then(function (c) {
          client = c;
          if (!subscribed) {
            subscribed = true;
            client.auth.onAuthStateChange(function (event, session) {
              if (event === 'SIGNED_OUT') onSession(null);
              else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') && session) onSession(session);
            });
          }
          var got = Promise.resolve(client.auth.getSession()).then(function (res) {
            return gotSession(res, hadCode);
          });
          var slow = new Promise(function (resolve) {
            setTimeout(resolve, START_WAIT_MS);
          }).then(function () {
            if (state.ready) return;
            // Slow or no connection: stop saying "Connecting…". The answer is still used when it comes.
            state.ready = true;
            state.reconnecting = hadCode || !!storedSession();
            setStatus(state.reconnecting ? 'offline' : 'idle');
          });
          return Promise.race([got, slow]);
        })
        .catch(function (e) {
          console.error(e);
          state.ready = true;
          state.enabled = false;
          state.startFailed = true;
          setStatus('error', 'Could not reach the sign-in service. Progress is saved on this device.');
        });
    },
    /** Try again after start() could not reach the sign-in service. */
    retry: function () {
      if (!state.startFailed) return Promise.resolve();
      state.startFailed = false;
      state.enabled = true;
      state.ready = false;
      setStatus('idle');
      return sync.start();
    },
    signInWithGoogle: function () {
      state.signInError = '';
      setMethod('google');
      return client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname + '#parent' } });
    },
    sendEmailLink: function (email) {
      state.signInError = '';
      setMethod('email');
      return client.auth.signInWithOtp({ email: email, options: { emailRedirectTo: window.location.origin + window.location.pathname + '#parent' } });
    },
    giveConsent: function () {
      return client
        .from('parents')
        // consented_at is set by the database (backend/schema.sql), not by this device's clock.
        .upsert({ id: state.user.id, consent_version: cfg.consentVersion })
        .then(function (res) {
          if (res.error) throw res.error;
          state.consented = true;
          state.consentKnown = true;
          return pull().then(push);
        });
    },
    hasUnsaved: hasUnsaved,
    /** Clear this device's profiles (the sign-in ended by itself): removals not sent yet are kept for that account. */
    clearDevice: clearDevice,
    /** True when the profiles on this device came from the signed-in account. */
    deviceFromAccount: function () {
      return !!(state.user && MQ.store.raw().accountId === state.user.id);
    },
    /**
     * Saves what is left to save, signs out, then clears this device so the next person on a
     * shared device does not see (or upload into their own account) this family's children.
     * If the device's profiles never came from the account, they are left as they were.
     * Refuses (error.code 'unsaved') while changes could not be saved, unless opts.force.
     */
    signOut: function (opts) {
      var force = !!(opts && opts.force);
      // Signed in, but the sign-in could not be renewed yet (offline at start).
      var waiting = !state.user && state.reconnecting;
      var kept = waiting ? storedSession() : null;
      var d0 = MQ.store.raw();
      // Another account's unsaved profiles (state.otherAccount) stay for that account.
      var fromAccount = state.otherAccount
        ? false
        : waiting
        ? !!(kept && d0.accountId && d0.accountId === kept.user.id)
        : !!(state.user && state.consented) || sync.deviceFromAccount();
      clearTimeout(pushTimer);
      // Fetch, then send (not a send alone): e.g. a child removed on another device makes every
      // send fail until this device learns about it. Also checks consent if that is not known yet.
      var first = fromAccount && state.user ? catchUp() : Promise.resolve();
      return first
        .then(function () {
          if (fromAccount && !force && hasUnsaved()) {
            var msg = !state.user || !state.consentKnown
              ? 'Could not reach your account to save the progress on this device. Check the connection and try again.'
              : !state.consented
              ? 'Some progress on this device has not been saved to your account, because sync is not turned on.'
              : isOffline() || state.status === 'offline'
              ? 'You are offline, so some progress has not been saved to your account yet. Try again when you are back online.'
              : 'Some progress has not been saved to your account yet. Please try again in a moment.';
            // Not just progress: say what else has not reached the account.
            var d1 = MQ.store.raw();
            var removals = d1.deletedChildren.length;
            var resets = Object.keys(d1.resetPending).length;
            if (removals) msg += ' A child you removed has not been deleted from your account yet. If you sign out now, it is deleted the next time you sign in on this device.';
            if (resets) msg += ' A progress reset has not reached your account yet. If you sign out now, the old progress stays in your account; reset it again after signing in.';
            var err = new Error(msg);
            err.code = 'unsaved';
            err.pendingRemovals = removals;
            err.pendingResets = resets;
            throw err;
          }
          if (waiting) {
            forgetSession(kept ? kept.user.id : d0.accountId); // the server cannot be reached anyway
            return;
          }
          var uid = state.user && state.user.id;
          // scope 'local': only this device signs out; the family's other devices stay signed in.
          return Promise.resolve()
            .then(function () {
              return client.auth.signOut({ scope: 'local' });
            })
            .then(function (res) {
              if (res && res.error) throw res.error;
            })
            .catch(function (e) {
              // No connection: the server cannot be told, but this device can still forget the
              // sign-in. Already ended (e.g. "Invalid Refresh Token"): nothing left to tell.
              if (!isNetworkError(e) && !alreadySignedOut(e)) throw e;
              forgetSession(uid);
            });
        })
        .then(function () {
          state.user = null;
          state.consented = false;
          state.consentKnown = false;
          state.reconnecting = false;
          state.otherAccount = false;
          if (fromAccount) clearDevice();
          setStatus('idle');
        });
    },
    /** state.otherAccount: drop the other account's unsaved profiles and use the signed-in account. */
    useThisAccount: function () {
      state.otherAccount = false;
      clearDevice(); // that account's removals are sent when it is signed in here again
      emit();
      return catchUp();
    },
    /**
     * Deletes the parent account and every child profile and record in the cloud, then clears
     * this device. opts.keepLocal: the profiles on this device never came from the account
     * (e.g. the parent did not agree to sync), so they stay.
     */
    deleteAccount: function (opts) {
      var keepLocal = !!(opts && opts.keepLocal);
      var uid = state.user && state.user.id;
      return client.rpc('delete_my_account').then(function (res) {
        if (res.error) throw res.error;
        clearTimeout(pushTimer);
        if (uid) removalsDone(uid);
        return Promise.resolve()
          .then(function () {
            return client.auth.signOut();
          })
          .then(function (r) {
            if (r && r.error) clearLocalSession();
          })
          .catch(clearLocalSession)
          .then(function () {
            state.user = null;
            state.consented = false;
            state.consentKnown = false;
            state.otherAccount = false;
            if (!keepLocal) MQ.store.wipe();
            setStatus('idle');
          });
      });
    },
    /** This device's copy of the family's profiles and progress, plus the account email, as a JSON string. */
    exportData: function () {
      var d = MQ.store.raw();
      // The profiles here belong to a different account than the one signed in: not labelled
      // with this parent's email and consent.
      var foreign = state.otherAccount || !!(d.accountId && state.user && d.accountId !== state.user.id);
      var out = {
        exportedAt: new Date().toISOString(),
        account: state.user && !foreign ? { email: state.user.email, privacyNoticeAgreed: state.consented ? cfg.consentVersion : null } : null,
      };
      if (foreign) out.note = 'These profiles belong to a different account than the one signed in.';
      return JSON.stringify(
        Object.assign(out, {
          children: d.children.map(function (c) {
            return { name: c.name, avatar: c.avatar, progress: (d.progress[c.id] || {}).activities || {} };
          }),
        }),
        null,
        2
      );
    },
    pushNow: push,
    pullNow: pull,
    /** Fetch, then send (what "Try again" does). */
    syncNow: catchUp,
    _merge: mergeRecord,
  });
  // Asking again while a sign-out or account deletion is on its way (e.g. the parent left the
  // Parent corner and came back) returns the same request instead of starting a second one.
  ['signOut', 'deleteAccount'].forEach(function (k) {
    var fn = sync[k];
    sync[k] = function (opts) {
      return once(k, function () {
        return fn(opts);
      });
    };
  });

  MQ.store.onChange(function (what) {
    if (what === 'pull' || what === 'pushed' || what === 'settings' || what === 'switch' || what === 'wipe') return;
    schedulePush();
  });
  // A sign-in link that failed comes back with error=... in the address (and no #parent).
  // Remove it before supabase-js sees it (it would sign this device out) and open the Parent
  // corner, where the sign-in card explains what happened.
  if (state.enabled) {
    try {
      var loc = window.location;
      if (/(^|[?&#])error_(code|description)=/.test(loc.search + '&' + loc.hash.replace(/^#/, ''))) {
        // Fixed wording only: the service's error_description is never shown.
        state.signInError = signInProblem();
        window.history.replaceState(null, '', loc.pathname + '#parent');
      }
    } catch (e) {}
  }
  window.addEventListener('online', function () {
    if (state.startFailed) sync.retry();
    else catchUp();
  });
  // Coming back to the tab (e.g. after playing on another device) picks up those stars.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible') catchUp();
  });
  window.addEventListener('offline', function () {
    if (state.user) setStatus('offline');
  });
})();

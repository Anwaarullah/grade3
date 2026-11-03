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
  };
  var client = null;
  var subscribed = false;
  var pushTimer = null;
  var pushing = null; // the push in flight, so pushes never overlap
  var sessionTask = Promise.resolve();

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
    if (!net) console.error(e); // a dropped connection is expected; it is retried when back online
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
    };
  }
  function timeOf(iso) {
    var t = iso ? Date.parse(iso) : NaN;
    return isNaN(t) ? 0 : t;
  }
  /** True when two progress rows hold the same synced values (the database may reorder or reformat them). */
  function sameRow(a, b) {
    var nums = ['stars', 'plays', 'first_try', 'answered'];
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
  /** Keep whichever record has more history; never lose stars. */
  function mergeRecord(local, remote) {
    if (!local) return remote;
    if (!remote) return local;
    var base = (remote.answered || 0) > (local.answered || 0) ? remote : local;
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
  /** Changes on this device that have not reached the account yet. */
  function hasUnsaved() {
    var d = MQ.store.raw();
    if (d.deletedChildren.length) return true;
    if (Object.keys(d.dirtyChildren).some(function (id) { return hasChild(d, id); })) return true;
    return Object.keys(d.dirty).some(function (cid) {
      return hasChild(d, cid) && Object.keys(d.dirty[cid] || {}).length > 0;
    });
  }

  /* ---------------- pull / push ---------------- */
  function pull() {
    if (!client || !state.user || !state.consented) return Promise.resolve();
    var uid = state.user.id;
    var d = MQ.store.raw();
    // The profiles on this device came from another parent's account (their session ended
    // without "Sign out"): they are safe in that account, so clear them rather than upload
    // them into this one.
    if (d.accountId && d.accountId !== uid) {
      MQ.store.wipe();
      d = MQ.store.raw();
    }
    // The device was cleared (sign-out, another tab) or another parent signed in while a
    // reply was on its way: drop that reply.
    function stale() {
      return MQ.store.raw() !== d || !state.user || state.user.id !== uid;
    }
    return client
      .from('children')
      .select('id,name,avatar')
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
        });
        // The automatic "Player 1" of a fresh or wiped device is not uploaded into a family
        // that already has children, as long as nobody has played with it yet.
        if (remoteKids.length) {
          d.children = d.children.filter(function (c) {
            if (!c.placeholder || remoteKids.some(function (rk) { return rk.id === c.id; })) return true;
            var acts = (d.progress[c.id] || {}).activities || {};
            if (Object.keys(acts).some(function (a) { return acts[a].plays > 0; })) return true;
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
        d.children = d.children.filter(function (c) {
          if (remoteKids.some(function (rk) { return rk.id === c.id; })) return true;
          if (!d.syncedChildren[c.id]) {
            d.dirtyChildren[c.id] = true;
            return true;
          }
          delete d.progress[c.id];
          delete d.dirty[c.id];
          delete d.dirtyChildren[c.id];
          delete d.syncedChildren[c.id];
          if (d.currentChildId === c.id) d.currentChildId = null;
          return false;
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
          var resetAt = d.resetAt[row.child_id];
          // "Reset progress" on this device wins over cloud records from before the reset,
          // even if the reset has not been uploaded yet (e.g. it was done offline): the
          // record's dirty flag, set by the reset, uploads it on the next push.
          if (resetAt && timeOf(row.last_played) <= timeOf(resetAt)) return;
          var merged = mergeRecord(local, fromRow(row));
          p.activities[row.activity_id] = merged;
          if (!sameRow(toRow(row.child_id, row.activity_id, merged), row)) markDirty(d, row.child_id, row.activity_id);
        });
        MQ.store.save('pull');
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
    var kids = d.children.filter(function (c) { return d.dirtyChildren[c.id]; }).map(function (c) {
      sentKids[c.id] = JSON.stringify([c.name, c.avatar]);
      return { id: c.id, name: c.name, avatar: c.avatar, parent_id: uid };
    });
    var rows = [];
    var sentRows = {};
    Object.keys(d.dirty).forEach(function (cid) {
      if (!hasChild(d, cid)) return;
      Object.keys(d.dirty[cid]).forEach(function (aid) {
        var r = progressIn(d, cid).activities[aid];
        if (!r) return;
        var row = toRow(cid, aid, r);
        sentRows[cid + '|' + aid] = JSON.stringify(row);
        rows.push(row);
      });
    });
    if (!kids.length && !rows.length && !deleted.length) {
      setStatus('saved');
      return Promise.resolve(true);
    }
    var again = false; // something changed while the request was on its way
    function stale() {
      return MQ.store.raw() !== d || !state.user || state.user.id !== uid;
    }
    setStatus('syncing');
    var step = Promise.resolve();
    if (deleted.length) {
      step = step.then(function () {
        return client.from('children').delete().in('id', deleted).then(function (res) {
          if (res.error) throw res.error;
          d.deletedChildren = d.deletedChildren.filter(function (id) { return deleted.indexOf(id) === -1; });
        });
      });
    }
    if (kids.length) {
      step = step.then(function () {
        return client.from('children').upsert(kids).then(function (res) {
          if (res.error) throw res.error;
          kids.forEach(function (k) {
            d.syncedChildren[k.id] = true;
            var c = d.children.filter(function (x) { return x.id === k.id; })[0];
            if (c && JSON.stringify([c.name, c.avatar]) !== sentKids[k.id]) again = true;
            else delete d.dirtyChildren[k.id];
          });
        });
      });
    }
    if (rows.length) {
      step = step.then(function () {
        return client.from('progress').upsert(rows).then(function (res) {
          if (res.error) throw res.error;
          rows.forEach(function (row) {
            var cid = row.child_id;
            var aid = row.activity_id;
            if (!d.dirty[cid]) return;
            var r = progressIn(d, cid).activities[aid];
            if (r && JSON.stringify(toRow(cid, aid, r)) !== sentRows[cid + '|' + aid]) again = true;
            else delete d.dirty[cid][aid];
          });
        });
      });
    }
    pushing = step
      .then(function () {
        if (stale()) return false;
        MQ.store.save('pushed');
        setStatus('saved');
        return true;
      })
      .catch(function (e) {
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
    // After an error, fetch first: e.g. a child removed on another device makes every push fail
    // until this device learns about it.
    pushTimer = setTimeout(function () {
      if (state.status === 'error') catchUp();
      else push();
    }, 1200);
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
    if (!client || !state.user) return Promise.resolve();
    var uid = state.user.id;
    var first = state.consentKnown ? Promise.resolve() : checkConsent().then(emit);
    return first
      .then(function () {
        if (!state.user || state.user.id !== uid || !state.consented) return;
        return pull().then(push);
      })
      .catch(syncFailed);
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
          return client.auth.getSession();
        })
        .then(function (res) {
          var session = res && res.data ? res.data.session : null;
          // supabase-js reads the ?code=... left by the sign-in redirect in the background;
          // getSession() waits for that, so only now is it safe to tidy the address bar.
          try {
            if (/[?&]code=/.test(window.location.search)) window.history.replaceState(null, '', window.location.pathname + window.location.hash);
          } catch (e) {}
          if (hadCode && !session) state.signInError = LINK_PROBLEM;
          state.ready = true;
          return onSession(session);
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
      return client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname + '#parent' } });
    },
    sendEmailLink: function (email) {
      state.signInError = '';
      return client.auth.signInWithOtp({ email: email, options: { emailRedirectTo: window.location.origin + window.location.pathname + '#parent' } });
    },
    giveConsent: function () {
      return client
        .from('parents')
        .upsert({ id: state.user.id, consent_version: cfg.consentVersion, consented_at: new Date().toISOString() })
        .then(function (res) {
          if (res.error) throw res.error;
          state.consented = true;
          state.consentKnown = true;
          return pull().then(push);
        });
    },
    hasUnsaved: hasUnsaved,
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
      var fromAccount = !!(state.user && state.consented) || sync.deviceFromAccount();
      clearTimeout(pushTimer);
      var first = fromAccount && state.consented ? push() : Promise.resolve(true);
      return first
        .then(function () {
          if (fromAccount && !force && hasUnsaved()) {
            var msg = !state.consented
              ? 'Some progress on this device has not been saved to your account, because sync is not turned on.'
              : isOffline()
              ? 'You are offline, so some progress has not been saved to your account yet. Try again when you are back online.'
              : 'Some progress has not been saved to your account yet. Please try again in a moment.';
            var err = new Error(msg);
            err.code = 'unsaved';
            throw err;
          }
          // scope 'local': only this device signs out; the family's other devices stay signed in.
          return Promise.resolve()
            .then(function () {
              return client.auth.signOut({ scope: 'local' });
            })
            .then(function (res) {
              if (res && res.error) throw res.error;
            })
            .catch(function (e) {
              // No connection: the server cannot be told, but this device can still forget the sign-in.
              if (!isNetworkError(e)) throw e;
              clearLocalSession();
            });
        })
        .then(function () {
          state.user = null;
          state.consented = false;
          state.consentKnown = false;
          if (fromAccount) MQ.store.wipe();
          setStatus('idle');
        });
    },
    /** Deletes the parent account and every child profile and record in the cloud, then clears this device. */
    deleteAccount: function () {
      return client.rpc('delete_my_account').then(function (res) {
        if (res.error) throw res.error;
        clearTimeout(pushTimer);
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
            MQ.store.wipe();
            setStatus('idle');
          });
      });
    },
    /** Everything stored about this family, as a JSON string. */
    exportData: function () {
      var d = MQ.store.raw();
      return JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          account: state.user ? { email: state.user.email, privacyNoticeAgreed: state.consented ? cfg.consentVersion : null } : null,
          children: d.children.map(function (c) {
            return { name: c.name, avatar: c.avatar, progress: (d.progress[c.id] || {}).activities || {} };
          }),
        },
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
        state.signInError = LINK_PROBLEM;
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

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
  var SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';

  var listeners = [];
  var state = {
    enabled: !!((cfg.supabaseUrl && cfg.supabaseAnonKey) || cfg.createClient),
    ready: false,
    user: null, // { id, email }
    consented: false,
    status: 'idle', // idle | syncing | saved | offline | error
    lastError: '',
  };
  var client = null;
  var pushTimer = null;

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

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = function () {
        reject(new Error('Could not load ' + src));
      };
      document.head.appendChild(s);
    });
  }

  function makeClient() {
    if (cfg.createClient) return Promise.resolve(cfg.createClient());
    var go = function () {
      return window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
      });
    };
    if (window.supabase && window.supabase.createClient) return Promise.resolve(go());
    return loadScript(SUPABASE_JS).then(go);
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
  /** Keep whichever record has more history; never lose stars. */
  function mergeRecord(local, remote) {
    if (!local) return remote;
    if (!remote) return local;
    var base = (remote.answered || 0) > (local.answered || 0) ? remote : local;
    var out = JSON.parse(JSON.stringify(base));
    out.stars = Math.max(local.stars || 0, remote.stars || 0);
    out.plays = Math.max(local.plays || 0, remote.plays || 0);
    if (local.lastPlayed && remote.lastPlayed) out.lastPlayed = local.lastPlayed > remote.lastPlayed ? local.lastPlayed : remote.lastPlayed;
    else out.lastPlayed = local.lastPlayed || remote.lastPlayed || null;
    return out;
  }

  /* ---------------- pull / push ---------------- */
  function pull() {
    if (!client || !state.user || !state.consented) return Promise.resolve();
    var d = MQ.store.raw();
    return client
      .from('children')
      .select('id,name,avatar')
      .then(function (res) {
        if (res.error) throw res.error;
        var remoteKids = res.data || [];
        remoteKids.forEach(function (rk) {
          if (d.deletedChildren.indexOf(rk.id) !== -1) return;
          var local = d.children.filter(function (c) { return c.id === rk.id; })[0];
          if (!local) d.children.push({ id: rk.id, name: rk.name, avatar: rk.avatar });
          else if (!d.dirtyChildren[rk.id]) {
            local.name = rk.name;
            local.avatar = rk.avatar;
          }
        });
        // Children made on this device before signing in get uploaded on the next push.
        d.children.forEach(function (c) {
          if (!remoteKids.some(function (rk) { return rk.id === c.id; })) d.dirtyChildren[c.id] = true;
        });
        if (!d.currentChildId && d.children.length) d.currentChildId = d.children[0].id;
        var ids = remoteKids.map(function (k) { return k.id; });
        if (!ids.length) return null;
        return client.from('progress').select('*').in('child_id', ids);
      })
      .then(function (res) {
        if (res && res.error) throw res.error;
        (res ? res.data || [] : []).forEach(function (row) {
          var p = MQ.store.progressOf(row.child_id);
          var merged = mergeRecord(p.activities[row.activity_id], fromRow(row));
          p.activities[row.activity_id] = merged;
          var local = fromRow(row);
          if (JSON.stringify(merged) !== JSON.stringify(local)) {
            d.dirty[row.child_id] = d.dirty[row.child_id] || {};
            d.dirty[row.child_id][row.activity_id] = true;
          }
        });
        MQ.store.save('pull');
      });
  }

  function push() {
    if (!client || !state.user || !state.consented) return Promise.resolve();
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setStatus('offline');
      return Promise.resolve();
    }
    var d = MQ.store.raw();
    var deleted = d.deletedChildren.slice();
    var kids = d.children.filter(function (c) { return d.dirtyChildren[c.id]; }).map(function (c) {
      return { id: c.id, name: c.name, avatar: c.avatar, parent_id: state.user.id };
    });
    var rows = [];
    Object.keys(d.dirty).forEach(function (cid) {
      if (!d.children.some(function (c) { return c.id === cid; })) return;
      Object.keys(d.dirty[cid]).forEach(function (aid) {
        var r = MQ.store.progressOf(cid).activities[aid];
        if (r) rows.push(toRow(cid, aid, r));
      });
    });
    if (!kids.length && !rows.length && !deleted.length) {
      setStatus('saved');
      return Promise.resolve();
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
            delete d.dirtyChildren[k.id];
          });
        });
      });
    }
    if (rows.length) {
      step = step.then(function () {
        return client.from('progress').upsert(rows).then(function (res) {
          if (res.error) throw res.error;
          rows.forEach(function (r) {
            if (d.dirty[r.child_id]) delete d.dirty[r.child_id][r.activity_id];
          });
        });
      });
    }
    return step
      .then(function () {
        MQ.store.save('pushed');
        setStatus('saved');
      })
      .catch(function (e) {
        console.error(e);
        setStatus(navigator.onLine === false ? 'offline' : 'error', (e && e.message) || String(e));
      });
  }

  function schedulePush() {
    if (!state.user || !state.consented) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, 1200);
  }

  function checkConsent() {
    return client
      .from('parents')
      .select('consent_version')
      .eq('id', state.user.id)
      .then(function (res) {
        if (res.error) throw res.error;
        var row = (res.data || [])[0];
        state.consented = !!(row && row.consent_version === cfg.consentVersion);
      });
  }

  function onSession(session) {
    state.user = session && session.user ? { id: session.user.id, email: session.user.email || '' } : null;
    state.consented = false;
    if (!state.user) {
      setStatus('idle');
      return Promise.resolve();
    }
    setStatus('syncing');
    return checkConsent()
      .then(function () {
        if (!state.consented) {
          setStatus('idle');
          return;
        }
        return pull().then(push);
      })
      .catch(function (e) {
        console.error(e);
        setStatus('error', (e && e.message) || String(e));
      });
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
      return makeClient()
        .then(function (c) {
          client = c;
          // Remove ?code=... left by the sign-in redirect so the page URL stays clean.
          try {
            if (/[?&]code=/.test(window.location.search)) window.history.replaceState(null, '', window.location.pathname + window.location.hash);
          } catch (e) {}
          client.auth.onAuthStateChange(function (event, session) {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') onSession(session);
          });
          return client.auth.getSession();
        })
        .then(function (res) {
          state.ready = true;
          return onSession(res && res.data ? res.data.session : null);
        })
        .catch(function (e) {
          console.error(e);
          state.ready = true;
          state.enabled = false;
          setStatus('error', 'Could not reach the sign-in service. Progress is saved on this device.');
        });
    },
    signInWithGoogle: function () {
      return client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname + '#parent' } });
    },
    sendEmailLink: function (email) {
      return client.auth.signInWithOtp({ email: email, options: { emailRedirectTo: window.location.origin + window.location.pathname + '#parent' } });
    },
    giveConsent: function () {
      return client
        .from('parents')
        .upsert({ id: state.user.id, consent_version: cfg.consentVersion, consented_at: new Date().toISOString() })
        .then(function (res) {
          if (res.error) throw res.error;
          state.consented = true;
          return pull().then(push);
        });
    },
    signOut: function () {
      return client.auth.signOut().then(function () {
        state.user = null;
        state.consented = false;
        setStatus('idle');
      });
    },
    /** Deletes the parent account and every child profile and record in the cloud, then clears this device. */
    deleteAccount: function () {
      return client.rpc('delete_my_account').then(function (res) {
        if (res.error) throw res.error;
        return client.auth.signOut().catch(function () {}).then(function () {
          state.user = null;
          state.consented = false;
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
          account: state.user ? { email: state.user.email } : null,
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
    _merge: mergeRecord,
  });

  MQ.store.onChange(function (what) {
    if (what === 'pull' || what === 'pushed' || what === 'settings' || what === 'switch') return;
    schedulePush();
  });
  window.addEventListener('online', function () {
    if (state.user && state.consented) pull().then(push);
  });
  window.addEventListener('offline', function () {
    if (state.user) setStatus('offline');
  });
})();

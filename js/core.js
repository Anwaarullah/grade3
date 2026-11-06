/* Interactive Maths — core runtime.
 * Plain browser JavaScript (no build step, no modules) so the site works from
 * any static host and even when index.html is opened directly from disk.
 * Everything lives on the global `MQ` object.
 */
(function () {
  'use strict';

  var MQ = (window.MQ = window.MQ || {});

  /* ------------------------------------------------------------------ *
   * Small utilities
   * ------------------------------------------------------------------ */
  var util = (MQ.util = {
    /** Random integer between a and b inclusive. */
    rand: function (a, b) {
      return a + Math.floor(Math.random() * (b - a + 1));
    },
    pick: function (arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    },
    shuffle: function (arr) {
      var a = arr.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i];
        a[i] = a[j];
        a[j] = t;
      }
      return a;
    },
    range: function (a, b) {
      var out = [];
      for (var i = a; i <= b; i++) out.push(i);
      return out;
    },
    clamp: function (v, lo, hi) {
      return Math.max(lo, Math.min(hi, v));
    },
    /** Format a number that may end in .5 as "13½". */
    fmt: function (n) {
      if (typeof n !== 'number' || !isFinite(n)) return String(n);
      var whole = Math.floor(n + 1e-9);
      var frac = Math.round((n - whole) * 100) / 100;
      if (frac === 0.5) return (whole === 0 ? '' : whole) + '½';
      if (frac === 0.25) return (whole === 0 ? '' : whole) + '¼';
      if (frac === 0.75) return (whole === 0 ? '' : whole) + '¾';
      return String(Math.round(n * 100) / 100);
    },
    /** Parse what a child types: "12", "13.5", "13 1/2", "13½", "½", "3/4". Returns NaN if not a number. */
    parseNum: function (raw) {
      if (raw == null) return NaN;
      var s = String(raw).trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ');
      s = s.replace(/(cm|km|m|square units|squares|units|sq)\.?$/, '').trim();
      if (s === '') return NaN;
      var uni = { '½': 0.5, '¼': 0.25, '¾': 0.75 };
      var m = s.match(/^(\d+)?\s*([½¼¾])$/);
      if (m) return (m[1] ? parseInt(m[1], 10) : 0) + uni[m[2]];
      m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
      if (m) return parseInt(m[1], 10) + parseInt(m[2], 10) / parseInt(m[3], 10);
      m = s.match(/^(\d+)\/(\d+)$/);
      if (m) return parseInt(m[1], 10) / parseInt(m[2], 10);
      if (/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s);
      return NaN;
    },
    /** True if two numbers are equal within a small tolerance. */
    same: function (a, b) {
      return Math.abs(a - b) < 1e-6;
    },
  });

  /* ------------------------------------------------------------------ *
   * DOM helpers
   * ------------------------------------------------------------------ */
  function append(parent, child) {
    if (child == null || child === false) return;
    if (Array.isArray(child)) {
      child.forEach(function (c) {
        append(parent, c);
      });
      return;
    }
    parent.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  }

  function applyAttrs(node, attrs, isSvg) {
    if (!attrs) return;
    Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class' || k === 'className') {
        if (isSvg) node.setAttribute('class', v);
        else node.className = v;
      } else if (k === 'style' && typeof v === 'object') {
        Object.keys(v).forEach(function (p) {
          if (p.indexOf('--') === 0) node.style.setProperty(p, v[p]);
          else node.style[p] = v[p];
        });
      } else if (k === 'html') {
        node.innerHTML = v;
      } else if (k === 'text') {
        node.textContent = v;
      } else if (k === 'dataset') {
        Object.keys(v).forEach(function (d) {
          node.dataset[d] = v[d];
        });
      } else if (k.indexOf('on') === 0 && typeof v === 'function') {
        node.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (v === true) {
        node.setAttribute(k, '');
      } else {
        node.setAttribute(k, v);
      }
    });
  }

  /** MQ.el('div', {class: 'x', onclick: fn}, 'text', childNode, [more]) */
  MQ.el = function (tag, attrs) {
    var node = document.createElement(tag);
    applyAttrs(node, attrs, false);
    for (var i = 2; i < arguments.length; i++) append(node, arguments[i]);
    return node;
  };

  /** MQ.svg('rect', {x: 0, y: 0, width: 10, height: 10}) — creates SVG elements. */
  MQ.svg = function (tag, attrs) {
    var node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    applyAttrs(node, attrs, true);
    for (var i = 2; i < arguments.length; i++) append(node, arguments[i]);
    return node;
  };

  MQ.clear = function (node) {
    while (node.firstChild) node.removeChild(node.firstChild);
    return node;
  };

  /* ------------------------------------------------------------------ *
   * Saved progress, per child profile (browser storage, always wrapped in
   * try/catch). js/sync.js mirrors it to the cloud when a parent signs in.
   *
   * Stored shape (localStorage 'g3maths.v2'):
   *   { version: 2, currentChildId, settings: { sound, voice },
   *     children: [ { id, name, avatar } ],
   *     progress: { <childId>: { activities: { <activityId>: record } } },
   *     dirty: { <childId>: { <activityId>: true } }, dirtyChildren: { <childId>: true },
   *     deletedChildren: [ ids ], syncedChildren: { <childId>: true },
   *     resetGen: { <childId>: how many times "Reset progress" was pressed for this child, as far
   *                 as this device knows (synced as children.reset_gen; each record carries the
   *                 count it was built on as rec.gen, and records with a lower count are blank) },
   *     resetPending: { <childId>: id of a reset made on this device that has not reached the account yet },
   *     accountId: id of the signed-in parent this device's profiles belong to (set by js/sync.js) }
   * ------------------------------------------------------------------ */
  var STORE_KEY = 'g3maths.v2';
  var OLD_KEY = 'mathsMission.v1';
  var db = null;
  var listeners = [];

  function uuid() {
    try {
      if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    } catch (e) {}
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
  function blankRecord(gen) {
    return { stars: 0, plays: 0, firstTry: 0, answered: 0, lastPlayed: null, mistakes: {}, gen: gen || 0 };
  }
  function blankDb() {
    return { version: 2, currentChildId: null, settings: { sound: true, voice: false }, children: [], progress: {}, dirty: {}, dirtyChildren: {}, deletedChildren: [], syncedChildren: {}, resetGen: {}, resetPending: {} };
  }
  function readJson(key) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  function getDb() {
    if (db) return db;
    var d = readJson(STORE_KEY);
    if (!d || typeof d !== 'object' || d.version !== 2) {
      d = blankDb();
      // Bring progress from the single-player version into a first profile.
      var old = readJson(OLD_KEY);
      if (old && typeof old === 'object') {
        if (old.settings) d.settings = Object.assign(d.settings, old.settings);
        var acts = old.activities || {};
        if (Object.keys(acts).length) {
          var id = uuid();
          d.children.push({ id: id, name: 'Player 1', avatar: '🦊' });
          d.progress[id] = { activities: acts };
          d.currentChildId = id;
          d.dirtyChildren[id] = true;
          d.dirty[id] = {};
          Object.keys(acts).forEach(function (a) {
            d.dirty[id][a] = true;
          });
        }
      }
    }
    db = normalise(d);
    return db;
  }
  /** Fill in missing parts, make sure a profile exists and currentChildId points at a real child. */
  function normalise(d) {
    ['children', 'deletedChildren'].forEach(function (k) {
      if (!Array.isArray(d[k])) d[k] = [];
    });
    ['progress', 'dirty', 'dirtyChildren', 'syncedChildren', 'resetGen', 'resetPending'].forEach(function (k) {
      if (!d[k] || typeof d[k] !== 'object') d[k] = {};
    });
    delete d.resetAt; // an earlier version kept reset times from the devices' clocks
    // Drop leftovers of children that no longer exist (e.g. a late sync reply after a wipe).
    // dirtyChildren and deletedChildren keep their own meaning and are left alone.
    var known = {};
    d.children.forEach(function (c) {
      known[c.id] = true;
    });
    ['progress', 'dirty', 'syncedChildren', 'resetGen', 'resetPending'].forEach(function (k) {
      Object.keys(d[k]).forEach(function (id) {
        if (!known[id]) delete d[k][id];
      });
    });
    d.settings = Object.assign({ sound: true, voice: false }, d.settings || {});
    if (d.currentChildId && !d.children.some(function (c) { return c.id === d.currentChildId; })) d.currentChildId = null;
    if (!d.children.length) {
      // Always have a profile to save into, so progress is never dropped.
      var first = uuid();
      // placeholder: never uploaded by js/sync.js while unused if the family or this device has other children.
      d.children.push({ id: first, name: 'Player 1', avatar: '🦊', placeholder: true });
      d.progress[first] = d.progress[first] || { activities: {} };
      d.dirtyChildren[first] = true;
    }
    if (!d.currentChildId && d.children.length) d.currentChildId = d.children[0].id;
    return d;
  }
  function childProgress(id) {
    var d = getDb();
    if (!id) return { activities: {} };
    if (!d.progress[id]) d.progress[id] = { activities: {} };
    if (!d.progress[id].activities) d.progress[id].activities = {};
    return d.progress[id];
  }
  function emit(what) {
    listeners.forEach(function (fn) {
      try {
        fn(what);
      } catch (e) {
        console.error(e);
      }
    });
  }

  var store = (MQ.store = {
    uuid: uuid,
    /** The current child's progress: { activities, settings }. */
    load: function () {
      var d = getDb();
      var p = childProgress(d.currentChildId);
      p.settings = d.settings; // settings are per device, shared by all profiles
      return p;
    },
    save: function (what) {
      var d = normalise(getDb()); // e.g. sync removed the last child: start a fresh "Player 1"
      try {
        var copy = JSON.parse(JSON.stringify(d));
        Object.keys(copy.progress).forEach(function (k) {
          delete copy.progress[k].settings;
        });
        window.localStorage.setItem(STORE_KEY, JSON.stringify(copy));
      } catch (e) {
        /* storage blocked: progress lives only for this visit */
      }
      emit(what || 'save');
    },
    /**
     * Record for an activity (created if missing) — marks it for sync. childId: whose record
     * (default: the current child). Returns null when that child no longer exists.
     */
    activity: function (id, childId) {
      var d = getDb();
      var cid = childId || d.currentChildId;
      if (childId && !d.children.some(function (c) { return c.id === childId; })) return null;
      var p = childProgress(cid);
      var gen = (cid && d.resetGen[cid]) || 0;
      // A record from before a reset this device knows about is blank (see adoptReset in js/sync.js).
      if (!p.activities[id] || (p.activities[id].gen || 0) < gen) p.activities[id] = blankRecord(gen);
      if (cid) {
        d.dirty[cid] = d.dirty[cid] || {};
        d.dirty[cid][id] = true;
      }
      return p.activities[id];
    },
    settings: function () {
      return getDb().settings;
    },
    setSetting: function (key, value) {
      getDb().settings[key] = value;
      store.save('settings');
    },
    /** Clear one child's progress (default: the current child). */
    reset: function (childId) {
      var d = getDb();
      var id = childId || d.currentChildId;
      if (!id || !d.children.some(function (c) { return c.id === id; })) return;
      var acts = childProgress(id).activities;
      // Counted, not timed (device clocks can be wrong): records built on an older count are
      // blank on every device. The database numbers the resets (children.reset_gen, see
      // js/sync.js); until it has this one, d.resetPending holds it.
      var gen = (d.resetGen[id] || 0) + 1;
      d.resetGen[id] = gen;
      d.resetPending[id] = uuid();
      d.dirty[id] = d.dirty[id] || {};
      Object.keys(acts).forEach(function (a) {
        acts[a] = blankRecord(gen);
        d.dirty[id][a] = true;
      });
      d.dirtyChildren[id] = true;
      store.save('reset');
    },
    totalStars: function (childId) {
      var d = getDb();
      var acts = childProgress(childId || d.currentChildId).activities;
      return Object.keys(acts).reduce(function (sum, id) {
        return sum + (acts[id].stars || 0);
      }, 0);
    },

    /* ---- child profiles ---- */
    children: function () {
      return getDb().children.slice();
    },
    currentChild: function () {
      var d = getDb();
      return d.children.filter(function (c) { return c.id === d.currentChildId; })[0] || null;
    },
    progressOf: function (childId) {
      return childProgress(childId);
    },
    switchChild: function (id) {
      var d = getDb();
      if (d.children.some(function (c) { return c.id === id; })) {
        d.currentChildId = id;
        store.save('switch');
      }
    },
    /** opts.makeCurrent === false: the child who is playing now stays the player. */
    addChild: function (name, avatar, opts) {
      var d = getDb();
      var c = { id: uuid(), name: String(name).trim().slice(0, 30) || 'Player', avatar: avatar || '🙂' };
      d.children.push(c);
      d.progress[c.id] = { activities: {} };
      d.dirtyChildren[c.id] = true;
      if (!opts || opts.makeCurrent !== false || !d.currentChildId) d.currentChildId = c.id;
      store.save('children');
      return c;
    },
    updateChild: function (id, fields) {
      var c = getDb().children.filter(function (x) { return x.id === id; })[0];
      if (!c) return;
      if (fields.name != null) c.name = String(fields.name).trim().slice(0, 30) || c.name;
      if (fields.avatar) c.avatar = fields.avatar;
      delete c.placeholder;
      getDb().dirtyChildren[id] = true;
      store.save('children');
    },
    removeChild: function (id) {
      var d = getDb();
      d.children = d.children.filter(function (c) { return c.id !== id; });
      delete d.progress[id];
      delete d.dirty[id];
      delete d.dirtyChildren[id];
      delete d.syncedChildren[id];
      d.deletedChildren.push(id);
      if (d.currentChildId === id) d.currentChildId = null;
      normalise(d); // a fresh "Player 1" if that was the last child, and a valid currentChildId
      store.save('children');
    },

    /* ---- used by js/sync.js ---- */
    raw: getDb,
    onChange: function (fn) {
      listeners.push(fn);
    },
    /** Replace everything on this device (e.g. after deleting the account). */
    wipe: function () {
      var keep = getDb().settings;
      var d = blankDb();
      d.settings = keep;
      db = normalise(d); // starts again with a fresh "Player 1"
      try {
        window.localStorage.removeItem(OLD_KEY);
      } catch (e) {}
      store.save('wipe');
    },
  });

  // Another tab of this site saved (or a parent signed out there and the device was cleared):
  // forget the copy held in memory so this tab reads the new one instead of writing its old
  // copy back over it.
  try {
    window.addEventListener('storage', function (e) {
      if (e.key !== STORE_KEY && e.key !== null) return;
      db = null;
      emit('pull');
    });
  } catch (e) {}

  /* ------------------------------------------------------------------ *
   * Sound effects (tiny synthesised beeps, no audio files needed)
   * ------------------------------------------------------------------ */
  var audioCtx = null;
  function tone(freq, start, dur, type, vol) {
    var t0 = audioCtx.currentTime + start;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol || 0.15, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }
  MQ.sound = function (name) {
    if (!store.settings().sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      if (name === 'correct') {
        tone(660, 0, 0.12, 'triangle');
        tone(880, 0.1, 0.18, 'triangle');
      } else if (name === 'wrong') {
        tone(300, 0, 0.18, 'sine', 0.1);
        tone(250, 0.12, 0.22, 'sine', 0.08);
      } else if (name === 'star') {
        [523, 659, 784, 1047].forEach(function (f, i) {
          tone(f, i * 0.1, 0.25, 'triangle', 0.12);
        });
      } else if (name === 'click') {
        tone(520, 0, 0.05, 'square', 0.04);
      } else if (name === 'pop') {
        tone(740, 0, 0.07, 'triangle', 0.1);
      }
    } catch (e) {
      /* audio not available */
    }
  };

  /* ------------------------------------------------------------------ *
   * Read-aloud (optional, uses the browser's built-in voice)
   * ------------------------------------------------------------------ */
  MQ.speak = function (text, force) {
    if (!force && !store.settings().voice) return;
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      var clean = String(text)
        .replace(/<[^>]+>/g, ' ')
        .replace(/½/g, ' and a half')
        .replace(/¼/g, ' and a quarter')
        .replace(/¾/g, ' and three quarters')
        .replace(/×/g, ' times ')
        .replace(/÷/g, ' divided by ')
        .replace(/\bcm\b/g, 'centimetres')
        .replace(/\bkm\b/g, 'kilometres')
        .replace(/(\d)\s?m\b/g, '$1 metres');
      var u = new SpeechSynthesisUtterance(clean);
      u.rate = 0.92;
      u.pitch = 1.1;
      window.speechSynthesis.speak(u);
    } catch (e) {
      /* no voice */
    }
  };

  /* ------------------------------------------------------------------ *
   * Robot mascot "Bolt" (inline SVG so it needs no image files)
   * mood: 'happy' | 'think' | 'cheer' | 'oops'
   * ------------------------------------------------------------------ */
  MQ.robot = function (mood, size) {
    mood = mood || 'happy';
    size = size || 96;
    var s = MQ.svg;
    var mouth;
    if (mood === 'think') mouth = s('path', { d: 'M40 70 h20', stroke: '#1b2a4a', 'stroke-width': 4, 'stroke-linecap': 'round' });
    else if (mood === 'oops') mouth = s('path', { d: 'M40 73 q10 -8 20 0', fill: 'none', stroke: '#1b2a4a', 'stroke-width': 4, 'stroke-linecap': 'round' });
    else if (mood === 'cheer') mouth = s('path', { d: 'M37 66 q13 16 26 0 z', fill: '#1b2a4a' });
    else mouth = s('path', { d: 'M39 67 q11 10 22 0', fill: 'none', stroke: '#1b2a4a', 'stroke-width': 4, 'stroke-linecap': 'round' });
    var arms =
      mood === 'cheer'
        ? [s('path', { d: 'M18 92 L6 70', stroke: '#9fb3d9', 'stroke-width': 7, 'stroke-linecap': 'round' }), s('path', { d: 'M82 92 L94 70', stroke: '#9fb3d9', 'stroke-width': 7, 'stroke-linecap': 'round' })]
        : [s('path', { d: 'M18 92 L8 108', stroke: '#9fb3d9', 'stroke-width': 7, 'stroke-linecap': 'round' }), s('path', { d: 'M82 92 L92 108', stroke: '#9fb3d9', 'stroke-width': 7, 'stroke-linecap': 'round' })];
    return s(
      'svg',
      { viewBox: '0 0 100 125', width: size, height: size * 1.25, class: 'robot robot-' + mood, 'aria-hidden': 'true' },
      s('line', { x1: 50, y1: 6, x2: 50, y2: 22, stroke: '#9fb3d9', 'stroke-width': 4 }),
      s('circle', { cx: 50, cy: 6, r: 6, fill: '#ffb703', class: 'robot-bulb' }),
      s('rect', { x: 14, y: 22, width: 72, height: 62, rx: 18, fill: '#dbe6ff', stroke: '#9fb3d9', 'stroke-width': 3 }),
      s('rect', { x: 22, y: 32, width: 56, height: 44, rx: 12, fill: '#ffffff' }),
      s('circle', { cx: 38, cy: 50, r: mood === 'cheer' ? 5 : 6.5, fill: '#1b2a4a' }),
      s('circle', { cx: 62, cy: 50, r: mood === 'cheer' ? 5 : 6.5, fill: '#1b2a4a' }),
      s('circle', { cx: 40, cy: 48, r: 2, fill: '#fff' }),
      s('circle', { cx: 64, cy: 48, r: 2, fill: '#fff' }),
      mouth,
      s('rect', { x: 26, y: 86, width: 48, height: 32, rx: 10, fill: '#dbe6ff', stroke: '#9fb3d9', 'stroke-width': 3 }),
      s('circle', { cx: 50, cy: 102, r: 7, fill: '#2ec4b6' }),
      arms
    );
  };

  /* ------------------------------------------------------------------ *
   * Activity registry
   * ------------------------------------------------------------------ */
  MQ.activities = {};

  /**
   * Register an activity.
   * MQ.register('ruler-lab', {
   *   learn: [ function (stage, api) {...}, ... ],        // teaching screens (optional)
   *   practice: { count: 8, render: function (stage, api) {...} }
   * });
   * See ACTIVITY_API.md for the full contract.
   */
  MQ.register = function (id, def) {
    if (!def || !def.practice || typeof def.practice.render !== 'function') {
      throw new Error('MQ.register(' + id + '): practice.render is required');
    }
    MQ.activities[id] = def;
  };

  var PRAISE = ['Brilliant!', 'Great work!', 'Correct!', 'Super!', 'You got it!', 'Fantastic!', 'Spot on!', 'Well done!'];
  var RETRY = ['Not quite. Try again!', 'Nearly! Have another go.', 'Hmm, check again.'];

  /**
   * Run an activity inside `shell`, an object built by the app with these elements:
   *   shell.stage, shell.say(text, mood), shell.feedback(text, kind),
   *   shell.setNext(enabled, label), shell.onNext(fn), shell.setReveal(visible, fn),
   *   shell.setProgress(phase, index, count), shell.done(result)
   */
  MQ.runActivity = function (id, shell) {
    var def = MQ.activities[id];
    if (!def) throw new Error('Unknown activity: ' + id);
    var learn = def.learn || [];
    var count = def.practice.count || 8;
    var cleanups = [];
    var result = { firstTry: 0, answered: 0, count: count, mistakes: {} };
    // The child who started: another tab may switch the current child before this one finishes.
    var childId = store.raw().currentChildId;
    var current = null; // { phase, index }

    function runCleanups() {
      while (cleanups.length) {
        try {
          cleanups.pop()();
        } catch (e) {
          console.error(e);
        }
      }
    }

    function baseApi(phase, index) {
      var api = {
        phase: phase,
        index: index,
        count: phase === 'practice' ? count : learn.length,
        stage: shell.stage,
        util: util,
        say: function (text, mood) {
          shell.say(text, mood);
        },
        feedback: function (text, kind) {
          shell.feedback(text, kind || 'info');
        },
        sound: MQ.sound,
        cleanup: function (fn) {
          cleanups.push(fn);
        },
        lockNext: function () {
          shell.setNext(false);
        },
        unlockNext: function () {
          shell.setNext(true);
        },
        next: function () {
          go(phase, index + 1);
        },
        /** setTimeout that is cancelled automatically when the screen changes. */
        later: function (fn, ms) {
          var t = setTimeout(fn, ms);
          cleanups.push(function () {
            clearTimeout(t);
          });
          return t;
        },
      };
      return api;
    }

    function go(phase, index) {
      runCleanups();
      MQ.clear(shell.stage);
      shell.feedback('', 'info');
      shell.setReveal(false);
      if (phase === 'learn' && index >= learn.length) {
        phase = 'practice';
        index = 0;
      }
      if (phase === 'practice' && index >= count) {
        finish();
        return;
      }
      current = { phase: phase, index: index };
      shell.setProgress(phase, index, phase === 'practice' ? count : learn.length);
      shell.stage.className = 'stage stage-' + phase;

      if (phase === 'learn') {
        var api = baseApi('learn', index);
        shell.setNext(true, index === learn.length - 1 ? "Let's practise ▶" : 'Next ▶');
        shell.onNext(function () {
          go('learn', index + 1);
        });
        try {
          learn[index](shell.stage, api);
        } catch (e) {
          console.error(e);
          shell.feedback('Oops, this screen had a problem. Press Next to carry on.', 'try');
        }
        return;
      }

      // practice question
      var papi = baseApi('practice', index);
      var tries = 0;
      var answered = false;
      var revealFn = null;
      papi.level = index < count / 3 ? 1 : index < (2 * count) / 3 ? 2 : 3;
      papi.tries = function () {
        return tries;
      };
      papi.isAnswered = function () {
        return answered;
      };
      papi.onReveal = function (fn) {
        revealFn = fn;
      };
      /**
       * Report the child's answer. ok=true/false. hint = what to say when wrong
       * (or custom praise when right). mistake = short phrase logged for the parent.
       */
      papi.check = function (ok, hint, mistake) {
        if (answered) return ok;
        if (ok) {
          answered = true;
          result.answered++;
          if (tries === 0) result.firstTry++;
          MQ.sound('correct');
          var praise = (typeof hint === 'string' && hint) || util.pick(PRAISE);
          shell.say(praise, 'cheer');
          shell.feedback(praise, 'good');
          shell.setReveal(false);
          shell.setNext(true, index === count - 1 ? 'Finish ★' : 'Next ▶');
        } else {
          tries++;
          if (mistake) result.mistakes[mistake] = (result.mistakes[mistake] || 0) + 1;
          MQ.sound('wrong');
          var msg = (typeof hint === 'string' && hint) || util.pick(RETRY);
          shell.say(msg, 'oops');
          shell.feedback(msg, 'try');
          if (tries >= 2 && revealFn) {
            shell.setReveal(true, function () {
              if (answered) return;
              answered = true;
              result.answered++;
              shell.setReveal(false);
              try {
                revealFn();
              } catch (e) {
                console.error(e);
              }
              shell.say("That's how it works. Let's keep going!", 'happy');
              shell.setNext(true, index === count - 1 ? 'Finish ★' : 'Next ▶');
            });
          }
        }
        return ok;
      };
      shell.setNext(false, index === count - 1 ? 'Finish ★' : 'Next ▶');
      shell.onNext(function () {
        if (answered) go('practice', index + 1);
      });
      try {
        def.practice.render(shell.stage, papi);
      } catch (e) {
        console.error(e);
        shell.feedback('Oops, this question had a problem. Press Next to skip it.', 'try');
        answered = true;
        shell.setNext(true);
      }
    }

    function finish() {
      runCleanups();
      MQ.clear(shell.stage);
      var ratio = result.firstTry / count;
      var stars = ratio >= 0.9 ? 3 : ratio >= 0.6 ? 2 : 1;
      var rec = store.activity(id, childId);
      // null: that child was removed (e.g. in another tab) while playing, so nobody else gets the stars.
      if (rec) {
        rec.plays++;
        rec.stars = Math.max(rec.stars || 0, stars);
        rec.lastStars = stars;
        rec.firstTry += result.firstTry;
        rec.answered += count;
        rec.lastPlayed = new Date().toISOString();
        Object.keys(result.mistakes).forEach(function (k) {
          rec.mistakes[k] = (rec.mistakes[k] || 0) + result.mistakes[k];
        });
        store.save();
      }
      MQ.sound('star');
      shell.done({ stars: stars, firstTry: result.firstTry, count: count, mistakes: result.mistakes });
    }

    // Dev hook used by tools/smoke.js to jump to any screen.
    MQ.dev = {
      goto: function (phase, index) {
        go(phase, index);
      },
      current: function () {
        return current;
      },
      learnCount: learn.length,
      practiceCount: count,
    };

    go(learn.length ? 'learn' : 'practice', 0);
    return {
      stop: runCleanups,
    };
  };
})();

/* Cube Builder — count cubes in cuboids layer by layer, and find every cuboid for 12 cubes (Unit 4.1, Think like a mathematician). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  /* ------------------------------------------------------------------ *
   * Small helpers
   * ------------------------------------------------------------------ */
  // Layer colours (bottom layer first), like coloured linking cubes.
  var PAL = ['#ffb35c', '#6cb4ee', '#7ed39b', '#c79bf2', '#f78fa7', '#f6d55c'];
  var D = Math.PI / 180;

  function mix(hex, t) {
    // t > 0 mixes towards white, t < 0 towards dark ink.
    var n = parseInt(hex.slice(1), 16);
    var c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    var to = t > 0 ? [255, 255, 255] : [27, 42, 74];
    var k = Math.abs(t);
    c = c.map(function (v, i) { return Math.round(v + (to[i] - v) * k); });
    return 'rgb(' + c.join(',') + ')';
  }
  function key(d) { return d.slice().sort(function (a, b) { return a - b; }).join('-'); }
  function total(d) { return d[0] * d[1] * d[2]; }
  function rep(n, times) { var a = []; for (var i = 0; i < times; i++) a.push(n); return a; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }
  function byText(d) { var s = d.slice().sort(function (a, b) { return a - b; }); return s[0] + ' by ' + s[1] + ' by ' + s[2]; }

  /* ------------------------------------------------------------------ *
   * 3D cube-stack view: every cube of an L x W x H block is drawn
   * (L = cubes in a row, W = rows going back, H = layers).
   * Painter's algorithm on whole cubes, orthographic projection.
   * "Spread" lifts the layers off and lays them side by side so every
   * cube (even the hidden middle ones) can be seen from above.
   * ------------------------------------------------------------------ */
  function makeView(api, o) {
    o = o || {};
    var w = o.w || 400, h = o.h || 300, pad = o.pad == null ? 26 : o.pad;
    var st = { L: o.L || 1, W: o.W || 1, H: o.H || 1, yaw: o.yaw == null ? 32 : o.yaw, pitch: o.pitch || 30, t: 0, drop: 0 };
    var svg = S('svg', { viewBox: '0 0 ' + w + ' ' + h, class: 'cb-svg ' + (o.cls || ''), role: 'img', 'aria-label': 'A block made of cubes' });
    svg.appendChild(S('rect', { x: 0, y: 0, width: w, height: h, rx: 14, fill: o.bg || '#f8fafd' }));
    var g = S('g');
    svg.appendChild(g);
    var labelText = o.labelText || null; // function(k) -> text beside layer k
    var view = { svg: svg, st: st, onChange: null };

    function layerPos(k) {
      var t = st.t, gap = 1;
      var a = U.clamp(t * 3, 0, 1), b = U.clamp(t * 3 - 1, 0, 1), c = U.clamp(t * 3 - 2, 0, 1);
      var z = k * (1 + gap * a);
      return { x: b * k * (st.L + gap), z: z * (1 - c) };
    }
    function cubes() {
      var out = [];
      for (var z = 0; z < st.H; z++) {
        var p = layerPos(z);
        var dz = z === st.H - 1 ? st.drop : 0;
        for (var y = 0; y < st.W; y++) for (var x = 0; x < st.L; x++) out.push({ x: x, y: y, z: z, o: [x + p.x, y, p.z + dz] });
      }
      return out;
    }
    function frame(list) {
      var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
      list.forEach(function (c) {
        for (var i = 0; i < 3; i++) {
          mn[i] = Math.min(mn[i], c.o[i]);
          mx[i] = Math.max(mx[i], c.o[i] + 1);
        }
      });
      var ctr = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
      var hx = (mx[0] - mn[0]) / 2, hy = (mx[1] - mn[1]) / 2, hz = (mx[2] - mn[2]) / 2;
      var r = Math.sqrt(hx * hx + hy * hy);
      var sp = Math.sin(st.pitch * D), cp = Math.cos(st.pitch * D);
      var extW = 2 * r, extH = 2 * r * sp + 2 * hz * cp;
      var extra = labelText ? 70 : 0;
      var sc = Math.min(o.maxCube || 52, (w - 2 * pad - extra) / extW, (h - 2 * pad - (labelText && st.t > 0.99 ? 26 : 0)) / extH);
      return { ctr: ctr, sc: sc };
    }
    function projector(f) {
      var cy = Math.cos(st.yaw * D), sy = Math.sin(st.yaw * D);
      var sp = Math.sin(st.pitch * D), cp = Math.cos(st.pitch * D);
      var shiftX = labelText && st.t < 0.99 ? -28 : 0;
      var shiftY = labelText && st.t > 0.99 ? -12 : 0;
      return {
        p: function (v) {
          var x = v[0] - f.ctr[0], y = v[1] - f.ctr[1], z = v[2] - f.ctr[2];
          var x1 = x * cy - y * sy, y1 = x * sy + y * cy;
          return [w / 2 + shiftX + x1 * f.sc, h / 2 + shiftY - (y1 * sp + z * cp) * f.sc, -y1 * cp + z * sp];
        },
        vis: function (n) {
          var n1y = n[0] * sy + n[1] * cy;
          return -n1y * cp + n[2] * sp > 1e-6;
        },
      };
    }
    var FACES = [
      { n: [0, 0, 1], c: [[0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]], tone: 0.42 },
      { n: [0, 0, -1], c: [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0]], tone: -0.25 },
      { n: [0, -1, 0], c: [[0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]], tone: 0.08 },
      { n: [0, 1, 0], c: [[0, 1, 0], [1, 1, 0], [1, 1, 1], [0, 1, 1]], tone: 0.08 },
      { n: [-1, 0, 0], c: [[0, 0, 0], [0, 1, 0], [0, 1, 1], [0, 0, 1]], tone: -0.14 },
      { n: [1, 0, 0], c: [[1, 0, 0], [1, 1, 0], [1, 1, 1], [1, 0, 1]], tone: -0.14 },
    ];

    view.render = function () {
      MQ.clear(g);
      var list = cubes();
      var f = frame(list), P = projector(f);
      var stacked = st.t === 0 && st.drop === 0;
      var vis = FACES.map(function (F) { return P.vis(F.n); });
      list.forEach(function (c) { c.d = P.p([c.o[0] + 0.5, c.o[1] + 0.5, c.o[2] + 0.5])[2]; });
      list.sort(function (a, b) { return a.d - b.d; });
      list.forEach(function (c) {
        var base = PAL[c.z % PAL.length];
        FACES.forEach(function (F, fi) {
          if (!vis[fi]) return;
          // skip faces pressed against a neighbour (same layer always; between layers only when stacked)
          var nx = c.x + F.n[0], ny = c.y + F.n[1], nz = c.z + F.n[2];
          if (F.n[2] === 0 && nx >= 0 && nx < st.L && ny >= 0 && ny < st.W) return;
          if (F.n[2] !== 0 && stacked && nz >= 0 && nz < st.H) return;
          var pts = F.c.map(function (k) { var q = P.p([c.o[0] + k[0], c.o[1] + k[1], c.o[2] + k[2]]); return q[0].toFixed(1) + ',' + q[1].toFixed(1); });
          g.appendChild(S('polygon', { points: pts.join(' '), fill: mix(base, F.tone), stroke: '#2b3a55', 'stroke-width': f.sc > 30 ? 1.6 : 1.1, 'stroke-linejoin': 'round' }));
        });
      });
      // layer labels
      if (labelText) {
        for (var k = 0; k < st.H; k++) {
          var txt = labelText(k, st);
          if (txt == null || txt === '') continue;
          var p = layerPos(k), dz = k === st.H - 1 ? st.drop : 0;
          var xs = [], ys = [];
          [0, st.L].forEach(function (a) { [0, st.W].forEach(function (b) { [0, 1].forEach(function (cz) {
            var q = P.p([a + p.x, b, p.z + dz + cz]);
            xs.push(q[0]);
            ys.push(q[1]);
          }); }); });
          var lx, ly;
          if (st.t > 0.99) {
            lx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2;
            ly = Math.max.apply(null, ys) + 22;
          } else {
            lx = Math.max.apply(null, xs) + 30;
            ly = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
          }
          var tw = 14 + String(txt).length * 11;
          g.appendChild(S('g', { class: 'cb-tag' },
            S('rect', { x: lx - tw / 2, y: ly - 14, width: tw, height: 28, rx: 14, fill: '#fff', stroke: PAL[k % PAL.length], 'stroke-width': 3 }),
            S('text', { x: lx, y: ly + 6, 'text-anchor': 'middle', 'font-size': 18, 'font-weight': 800, fill: '#1b2a4a' }, String(txt))));
        }
      }
      if (view.onChange) view.onChange();
    };

    // How many cubes can be seen right now (cubes touching a face we can see).
    view.seen = function () {
      if (st.t > 0.99) return total([st.L, st.W, st.H]);
      var P = projector(frame(cubes()));
      var vp = P.vis([1, 0, 0]), vn = P.vis([-1, 0, 0]), wp = P.vis([0, 1, 0]), wn = P.vis([0, -1, 0]);
      var n = 0;
      for (var z = 0; z < st.H; z++) for (var y = 0; y < st.W; y++) for (var x = 0; x < st.L; x++) {
        if (z === st.H - 1 || (vp && x === st.L - 1) || (vn && x === 0) || (wp && y === st.W - 1) || (wn && y === 0)) n++;
      }
      return n;
    };

    view.set = function (L, W, H) {
      st.L = L;
      st.W = W;
      st.H = H;
      view.render();
    };

    // simple tweens driven by api.later (cancelled automatically on screen change)
    var tw = {};
    view.tween = function (prop, to, ms, done) {
      var from = st[prop], t0 = Date.now(), id = {};
      tw[prop] = id;
      if (!api) {
        st[prop] = to;
        view.render();
        if (done) done();
        return;
      }
      (function step() {
        if (tw[prop] !== id) return;
        var k = Math.min(1, (Date.now() - t0) / ms);
        var e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        st[prop] = from + (to - from) * e;
        if (k >= 1) st[prop] = to;
        view.render();
        if (k < 1) api.later(step, 16);
        else if (done) done();
      })();
    };
    view.turn = function (dir) {
      var target = Math.round((st.yaw + dir * 90 - 32) / 90) * 90 + 32;
      if (Math.abs(target - st.yaw) < 1) target += dir * 90;
      view.tween('yaw', target, 450);
    };
    view.spread = function (on, done) {
      // lay the layers out in a row that runs across the screen
      if (on) view.tween('yaw', Math.round((st.yaw - 14) / 360) * 360 + 14, 700);
      view.tween('t', on ? 1 : 0, 1100, done);
    };

    if (o.drag !== false && api) {
      var y0 = 0;
      var un = MQ.ui.drag(svg, svg, {
        start: function () { y0 = st.yaw; tw.yaw = null; },
        move: function (p, dx) { st.yaw = y0 - dx * 0.7; view.render(); if (o.onTurn) o.onTurn(); },
      });
      api.cleanup(un);
    }
    view.render();
    return view;
  }

  // Turn / lift buttons under a view.
  function viewTools(view, opts) {
    opts = opts || {};
    var lifted = false;
    var liftBtn = el('button', { class: 'btn btn-ghost cb-tool cb-lift', type: 'button' }, 'Lift layers off ⇅');
    liftBtn.addEventListener('click', function () {
      lifted = !lifted;
      liftBtn.textContent = lifted ? 'Put layers back ⇅' : 'Lift layers off ⇅';
      view.spread(lifted);
      if (opts.onLift) opts.onLift(lifted);
    });
    var left = el('button', { class: 'btn btn-ghost cb-tool cb-turn-l', type: 'button', onclick: function () { view.turn(-1); if (opts.onTurn) opts.onTurn(); } }, '↶ Turn');
    var right = el('button', { class: 'btn btn-ghost cb-tool cb-turn-r', type: 'button', onclick: function () { view.turn(1); if (opts.onTurn) opts.onTurn(); } }, 'Turn ↷');
    var row = el('div', { class: 'cb-tools' }, left, right, opts.noLift ? null : liftBtn);
    row.setLifted = function (v) {
      lifted = v;
      liftBtn.textContent = lifted ? 'Put layers back ⇅' : 'Lift layers off ⇅';
    };
    row.liftBtn = liftBtn;
    return row;
  }

  // "1 layer: 3 + 3 = 6" and "3 layers: 6 + 6 + 6 = 18" working, as chips.
  function working(d) {
    var H = d[2], n = d[0] * d[1];
    var rows = Math.min(d[0], d[1]), per = Math.max(d[0], d[1]); // describe a layer as rows of the longer side
    var box = el('div', { class: 'cb-work' });
    box.appendChild(el('div', { class: 'cb-work-line' },
      el('span', { class: 'cb-work-lab' }, (H === 1 ? 'Just 1 layer' : 'One layer') + ' (' + plural(rows, 'row', 'rows') + ' of ' + per + '):'),
      rows > 1 ? MQ.ui.sum(rep(per, rows), n) : el('span', { class: 'chip chip-total' }, String(n))));
    if (H === 1) return box;
    box.appendChild(el('div', { class: 'cb-work-line' },
      el('span', { class: 'cb-work-lab' }, plural(H, 'layer', 'layers') + ' of ' + n + ':'),
      n > 1 && H <= 6 ? MQ.ui.sum(rep(n, H), n * H) : el('span', { class: 'chip chip-total' }, String(n * H))));
    return box;
  }

  function card(title, body) {
    return el('div', { class: 'cb-card' }, title ? el('div', { class: 'cb-card-title' }, title) : null, body);
  }

  /* ------------------------------------------------------------------ *
   * Builder: three steppers (cubes in a row, rows, layers)
   * ------------------------------------------------------------------ */
  var CAP = 24;
  function makeBuilder(api, opts) {
    var d = opts.start ? opts.start.slice() : [1, 1, 1];
    var view = makeView(api, { w: opts.w || 400, h: opts.h || 300, L: d[0], W: d[1], H: d[2], yaw: 32, maxCube: opts.maxCube || 46 });
    var NAMES = ['Cubes in a row', 'Rows', 'Layers'];
    var vals = [], minus = [], plus = [];
    var steppers = el('div', { class: 'cb-steppers' });
    var note = el('div', { class: 'cb-note' });
    NAMES.forEach(function (nm, i) {
      vals[i] = el('span', { class: 'cb-step-val' }, String(d[i]));
      minus[i] = el('button', { class: 'btn cb-step-btn cb-minus-' + i, type: 'button', 'aria-label': 'Fewer: ' + nm }, '−');
      plus[i] = el('button', { class: 'btn cb-step-btn cb-plus-' + i, type: 'button', 'aria-label': 'More: ' + nm }, '+');
      minus[i].addEventListener('click', function () { change(i, -1); });
      plus[i].addEventListener('click', function () { change(i, 1); });
      steppers.appendChild(el('div', { class: 'cb-step' }, el('span', { class: 'cb-step-name' }, nm), el('span', { class: 'cb-step-ctl' }, minus[i], vals[i], plus[i])));
    });
    var b = { el: null, view: view, dims: function () { return d.slice(); }, locked: false };
    function refresh() {
      for (var i = 0; i < 3; i++) {
        vals[i].textContent = String(d[i]);
        minus[i].disabled = b.locked || d[i] <= 1;
        var nd = d.slice();
        nd[i]++;
        plus[i].disabled = b.locked || d[i] >= 12 || total(nd) > CAP;
      }
      view.set(d[0], d[1], d[2]);
      if (opts.onChange) opts.onChange(d.slice());
    }
    function change(i, by) {
      if (b.locked) return;
      var nd = d.slice();
      nd[i] = U.clamp(nd[i] + by, 1, 12);
      if (total(nd) > CAP) {
        note.textContent = 'The box only holds ' + CAP + ' cubes.';
        return;
      }
      note.textContent = '';
      d = nd;
      api.sound('click');
      refresh();
    }
    b.setDims = function (nd) {
      d = nd.slice();
      refresh();
    };
    b.lock = function () {
      b.locked = true;
      refresh();
    };
    b.unlock = function () {
      b.locked = false;
      refresh();
    };
    b.el = el('div', { class: 'cb-builder' }, view.svg, viewTools(view, { noLift: true }), opts.detachSteppers ? null : steppers, opts.detachSteppers ? null : note);
    b.note = note;
    b.steppers = steppers;
    refresh();
    return b;
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  // Level 1 pool: [cubes in a row, rows, layers]; 8, 12 or 16 cubes, one or two layers.
  var POOL1 = [[2, 2, 2], [4, 2, 1], [3, 2, 2], [4, 3, 1], [6, 2, 1], [4, 2, 2], [4, 4, 1], [8, 2, 1]];
  // Level 2 models (book p.66: long x high x deep). Stored as [row, rows back, layers].
  var M8 = [2, 2, 2], M16 = [2, 2, 4], M18A = [3, 3, 2], M18B = [6, 3, 1];
  // All cuboids for 12 cubes in a systematic order (sorted dimensions).
  var TWELVE = [[1, 1, 12], [1, 2, 6], [1, 3, 4], [2, 2, 3]];

  function buildDeck() {
    // choose 4 level-1 blocks: totals 8, 12, 16 all present, at least 2 with two layers,
    // at least one single layer, all different, not both 2x2x2 and 2x2x4 (one of those is kept for level 2)
    var subsets = [];
    for (var a = 0; a < POOL1.length; a++) for (var b = a + 1; b < POOL1.length; b++) for (var c = b + 1; c < POOL1.length; c++) for (var e = c + 1; e < POOL1.length; e++) {
      var s = [POOL1[a], POOL1[b], POOL1[c], POOL1[e]];
      var tots = s.map(total), keys = s.map(key);
      var two = s.filter(function (x) { return x[2] === 2; }).length;
      if (tots.indexOf(8) < 0 || tots.indexOf(12) < 0 || tots.indexOf(16) < 0) continue;
      if (two < 2 || two > 3) continue;
      if (keys.indexOf('2-2-2') >= 0 && keys.indexOf('2-2-4') >= 0) continue;
      subsets.push(s);
    }
    var l1 = U.pick(subsets).slice().sort(function (x, y) { return total(x) - total(y) || x[2] - y[2]; });
    var l1keys = l1.map(key);
    var first = U.shuffle([M8, M16]).filter(function (m) { return l1keys.indexOf(key(m)) < 0; })[0];
    var q = [];
    l1.forEach(function (d) { q.push({ type: 'count', d: d, yaw: U.pick([28, 34, 40, -30, -38]) }); });
    q.push({ type: 'copy', d: first, yaw: U.pick([30, 38, -34]) });
    q.push({ type: 'copy', d: M18A, yaw: U.pick([30, 38, -34]) });
    q.push({ type: 'copy', d: M18B, yaw: U.pick([30, 38, -34]), same18: true });
    q.push({ type: 'twelve', step: 1 });
    q.push({ type: 'twelve', step: 2 });
    q.push({ type: 'twelve', step: 3 });
    return q;
  }
  var deck = null;
  var found = []; // keys of the 12-cube cuboids found in this run

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */
  function learnTray(stage, api) {
    api.say('Drag the sugar cubes into the tray. Fill it up!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('One layer', 'Fill the tray: 3 cubes in a row, 2 rows.'));
    var Wd = 640, Hd = 290, cell = 76, tx = 40, ty = 50, COLS = 3, ROWS = 2;
    var svg = S('svg', { viewBox: '0 0 ' + Wd + ' ' + Hd, class: 'cb-svg cb-tray-svg' });
    svg.appendChild(S('rect', { x: 0, y: 0, width: Wd, height: Hd, rx: 14, fill: '#f8fafd' }));
    // tray
    svg.appendChild(S('rect', { x: tx - 12, y: ty - 12, width: COLS * cell + 24, height: ROWS * cell + 24, rx: 12, fill: '#e9dcc6', stroke: '#b89a6c', 'stroke-width': 3 }));
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      svg.appendChild(S('rect', { x: tx + c * cell + 3, y: ty + r * cell + 3, width: cell - 6, height: cell - 6, rx: 8, fill: '#f6eedf', stroke: '#cdb68e', 'stroke-width': 2, 'stroke-dasharray': '6 5' }));
    }
    var rowTags = [];
    for (r = 0; r < ROWS; r++) {
      var t = S('text', { x: tx + COLS * cell + 34, y: ty + r * cell + cell / 2 + 9, 'font-size': 26, 'font-weight': 800, fill: '#0b6e66', class: 'cb-rowtag' }, '');
      rowTags.push(t);
      svg.appendChild(t);
    }
    svg.appendChild(S('text', { x: 470, y: 30, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, fill: '#5b6b88' }, 'Sugar cubes'));
    var grid = [[null, null, null], [null, null, null]];
    var placed = 0;
    var countLine = el('div', { class: 'cb-count-line' }, 'Cubes in the tray: ', el('b', { class: 'cb-tray-count' }, '0'));
    function sugar(x, y) {
      var gg = S('g', { class: 'cb-sugar', transform: 'translate(' + x + ',' + y + ')' },
        S('rect', { x: 3, y: 3, width: cell - 6, height: cell - 6, rx: 9, fill: '#ffffff', stroke: '#8a97ad', 'stroke-width': 2.5 }),
        S('rect', { x: 11, y: 11, width: cell - 22, height: cell - 22, rx: 6, fill: '#f1f4f9' }),
        S('circle', { cx: 24, cy: 26, r: 2.2, fill: '#c9d2e0' }), S('circle', { cx: 50, cy: 34, r: 2.2, fill: '#c9d2e0' }), S('circle', { cx: 34, cy: 52, r: 2.2, fill: '#c9d2e0' }));
      return gg;
    }
    function updateTags() {
      var run = 0;
      for (var rr = 0; rr < ROWS; rr++) {
        var full = grid[rr].every(function (v) { return v; });
        if (full && (rr === 0 || rowTags[rr - 1].textContent)) {
          run += COLS;
          rowTags[rr].textContent = String(run);
        } else rowTags[rr].textContent = '';
      }
    }
    var homes = [];
    for (var i = 0; i < 6; i++) homes.push({ x: 360 + (i % 3) * 86 + (i >= 3 ? 20 : 0), y: 48 + Math.floor(i / 3) * 100 + (i % 2) * 10 });
    homes.forEach(function (hm) {
      var gg = sugar(hm.x, hm.y);
      gg.dataset.home = hm.x + ',' + hm.y;
      svg.appendChild(gg);
      var at = null, moved = false;
      // bring to front before the drag helper captures the pointer
      gg.addEventListener('pointerdown', function () { if (!gg.dataset.done) svg.appendChild(gg); });
      var un = MQ.ui.drag(svg, gg, {
        start: function () {
          moved = false;
        },
        move: function (p, dx, dy) {
          if (gg.dataset.done) return;
          if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
          gg.setAttribute('transform', 'translate(' + (hm.x + dx) + ',' + (hm.y + dy) + ')');
        },
        end: function (p) {
          if (gg.dataset.done) return;
          var cc = Math.floor((p.x - tx) / cell), rr = Math.floor((p.y - ty) / cell);
          var target = null;
          if (cc >= 0 && cc < COLS && rr >= 0 && rr < ROWS && !grid[rr][cc]) target = [rr, cc];
          else if (!moved || (p.x > tx - 30 && p.x < tx + COLS * cell + 30 && p.y > ty - 30 && p.y < ty + ROWS * cell + 30)) {
            // click, or dropped near the tray: next empty space in order
            for (var r2 = 0; r2 < ROWS && !target; r2++) for (var c2 = 0; c2 < COLS && !target; c2++) if (!grid[r2][c2]) target = [r2, c2];
          }
          if (!target) {
            gg.setAttribute('transform', 'translate(' + hm.x + ',' + hm.y + ')');
            return;
          }
          at = target;
          grid[at[0]][at[1]] = true;
          gg.dataset.done = '1';
          gg.classList.add('cb-placed');
          gg.setAttribute('transform', 'translate(' + (tx + at[1] * cell) + ',' + (ty + at[0] * cell) + ')');
          placed++;
          api.sound('pop');
          countLine.querySelector('b').textContent = String(placed);
          updateTags();
          if (placed === 6) {
            api.say('Count in rows: 3, 6. One layer has 6 cubes!', 'cheer');
            api.feedback('2 rows of 3: 3 + 3 = 6 cubes in one layer.', 'good');
            done.hidden = false;
            api.unlockNext();
          }
        },
      });
      api.cleanup(un);
    });
    var done = el('div', { class: 'cb-done', hidden: true }, MQ.ui.sum([3, 3], 6), el('span', { class: 'cb-done-txt' }, '2 rows of 3 = 6'));
    stage.appendChild(svg);
    stage.appendChild(countLine);
    stage.appendChild(done);
  }

  function learnLayers(stage, api) {
    api.say('Now stack the layers. Press "Add a layer".');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Stack the layers', 'Each layer has 6 cubes. Add layers and count on in sixes.'));
    var view = makeView(api, { w: 420, h: 300, L: 3, W: 2, H: 1, yaw: 30, maxCube: 50, labelText: function (k) { return String((k + 1) * 6); } });
    view.svg.classList.add('cb-svg-main');
    var add = el('button', { class: 'btn cb-add', type: 'button' }, 'Add a layer ⬆');
    var side = el('div', { class: 'cb-side' });
    function show() {
      MQ.clear(side);
      var H = view.st.H;
      side.appendChild(el('div', { class: 'cb-big' }, plural(H, 'layer', 'layers') + ' of 6'));
      side.appendChild(MQ.ui.sum(rep(6, H), 6 * H));
      var jumps = el('div', { class: 'cb-jumps' }, el('span', { class: 'cb-jumps-lab' }, 'Count in sixes:'));
      for (var k = 1; k <= H; k++) jumps.appendChild(el('span', { class: 'cb-jump' }, String(6 * k)));
      side.appendChild(jumps);
      if (H === 3) {
        side.appendChild(el('div', { class: 'cb-big cb-good' }, '3 layers of 6 = 18'));
      }
    }
    add.addEventListener('click', function () {
      if (view.st.H >= 3) return;
      view.st.H++;
      view.st.drop = 2.5;
      api.sound('pop');
      view.tween('drop', 0, 500);
      show();
      if (view.st.H === 3) {
        add.disabled = true;
        api.say('3 layers of 6 = 18. That is 6 + 6 + 6!', 'cheer');
        api.feedback('Count one layer, then add it again for each layer: 6, 12, 18.', 'good');
        api.unlockNext();
      } else {
        api.say('6 + 6 = 12. Add one more!');
      }
    });
    show();
    stage.appendChild(el('div', { class: 'cb-row' }, el('div', { class: 'cb-col' }, view.svg, add), side));
  }

  function learnHidden(stage, api) {
    api.say('Some cubes are hiding! Turn the block, then lift the layers off.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Hidden cubes', 'You cannot see every cube. Some are at the back and in the middle.'));
    var d = [3, 2, 3];
    var lifted = false;
    var view = makeView(api, { w: 420, h: 300, L: d[0], W: d[1], H: d[2], yaw: 32, maxCube: 50, labelText: function (k, st) { return st.t > 0.99 ? '6' : ''; } });
    var firstSeen = view.seen();
    var seenEl = el('b', { class: 'cb-seen' }, String(firstSeen));
    var side = el('div', { class: 'cb-side' },
      el('div', { class: 'cb-line' }, 'Cubes I can see now: ', seenEl),
      el('div', { class: 'cb-line cb-muted' }, 'Cubes in the block: ', el('b', { class: 'cb-total' }, '?')));
    var after = el('div', { class: 'cb-after', hidden: true });
    side.appendChild(after);
    view.onChange = function () { seenEl.textContent = String(view.seen()); };
    var tools = viewTools(view, {
      onLift: function (on) {
        if (!on || lifted) return;
        lifted = true;
        api.later(function () {
          side.querySelector('.cb-total').textContent = '18';
          side.querySelector('.cb-muted').classList.remove('cb-muted');
          after.hidden = false;
          after.appendChild(working(d));
          after.appendChild(el('div', { class: 'cb-line' }, 'From the front you saw ' + firstSeen + '. So ' + (18 - firstSeen) + ' were hidden!'));
          api.say('3 layers of 6 = 18. ' + (18 - firstSeen) + ' cubes were hiding!', 'cheer');
          api.unlockNext();
        }, 1150);
      },
    });
    stage.appendChild(el('div', { class: 'cb-row' }, el('div', { class: 'cb-col' }, view.svg, tools, el('div', { class: 'cb-tip' }, 'Drag the block to turn it.')), side));
  }

  /* ------------------------------------------------------------------ *
   * Practice
   * ------------------------------------------------------------------ */
  function countHint(api, d, a, seenNow) {
    var L = d[0], W = d[1], H = d[2], n = L * W, T = n * H;
    var strong = api.tries() >= 1;
    var tail = strong ? ' One layer is ' + (W > 1 ? W + ' rows of ' + L : '1 row of ' + L) + '. Add one layer for each of the ' + plural(H, 'layer', 'layers') + '.' : '';
    if (H > 1 && a === n) return ['That is one layer. How many layers are there?' + tail, 'Counted one layer, not all the layers'];
    if (W > 1 && (a === L * H || a === L)) return ['You counted the front. There are more rows behind! Turn the block.' + tail, 'Counted only the front of the block'];
    if (a === seenNow && a < T) return ['You counted the cubes you can see. Some are hidden! Lift the layers off.' + tail, 'Missed the hidden cubes'];
    if (a < T) return ['Not enough. Some cubes are hidden at the back or underneath. Lift the layers off.' + tail, 'Missed the hidden cubes'];
    return ['Too many. Maybe a cube was counted twice. Count one layer, then add the layers.' + tail, 'Slipped when adding the layers'];
  }

  function renderCount(stage, api, q) {
    var d = q.d, T = total(d);
    api.say(d[2] > 1 ? 'Count one layer. Then add the layers.' : 'Count the rows, then add them.', 'think');
    var wrap = el('div', { class: 'cb-q', dataset: { kind: 'count', total: String(T), dims: d.join(',') } });
    stage.appendChild(MQ.ui.prompt('How many <b>cubes</b> make this block?'));
    var view = makeView(api, { w: 420, h: 300, L: d[0], W: d[1], H: d[2], yaw: q.yaw, maxCube: 50, labelText: function (k, st) { return st.t > 0.99 && revealed ? String(d[0] * d[1]) : ''; } });
    var revealed = false;
    var tools = viewTools(view, { noLift: d[2] === 1 });
    var side = el('div', { class: 'cb-side' });
    var inp = MQ.ui.numberInput({
      unit: 'cubes',
      onSubmit: function (a) {
        if (a === T) {
          inp.good();
          inp.disable();
          side.appendChild(working(d));
          api.check(true, d[2] > 1 ? plural(d[2], 'layer', 'layers') + ' of ' + d[0] * d[1] + ' = ' + T + '!' : 'Yes, ' + T + ' cubes!');
        } else {
          inp.bad();
          var hm = countHint(api, d, a, view.seen());
          api.check(false, hm[0], hm[1]);
        }
      },
    });
    side.appendChild(inp.el);
    side.appendChild(el('div', { class: 'cb-tip' }, d[2] > 1 ? 'Tip: lift the layers off to see the hidden cubes.' : 'Tip: count one row, then add the rows.'));
    wrap.appendChild(el('div', { class: 'cb-row' }, el('div', { class: 'cb-col' }, view.svg, tools), side));
    stage.appendChild(wrap);
    inp.focus();
    api.onReveal(function () {
      revealed = true;
      inp.setValue(String(T));
      inp.good();
      inp.disable();
      if (d[2] > 1) {
        tools.setLifted(true);
        view.spread(true);
      }
      side.appendChild(working(d));
      api.feedback(d[2] > 1 ? 'Lift the layers off: each layer has ' + d[0] * d[1] + '. ' + rep(d[0] * d[1], d[2]).join(' + ') + ' = ' + T + ' cubes.' : 'Just 1 layer: ' + (d[1] > 1 ? plural(d[1], 'row', 'rows') + ' of ' + d[0] + ', ' + rep(d[0], d[1]).join(' + ') + ' = ' + T : T) + ' cubes.', 'info');
    });
  }

  function renderCopy(stage, api, q) {
    var d = q.d, T = total(d);
    api.say('Make your block look the same. Turn it to see the back!', 'think');
    var wrap = el('div', { class: 'cb-q', dataset: { kind: 'copy', total: String(T), dims: d.join(',') } });
    stage.appendChild(MQ.ui.prompt('Build a copy of this block. Then count its cubes.'));
    var target = makeView(api, { w: 360, h: 230, L: d[0], W: d[1], H: d[2], yaw: q.yaw, maxCube: 40 });
    var tTools = viewTools(target, { noLift: true });
    var b = makeBuilder(api, { w: 360, h: 230, detachSteppers: true, maxCube: 40 });
    var phase = 'build';
    var check = el('button', { class: 'btn cb-check-build', type: 'button' }, 'Check my block');
    var countBox = el('div', { class: 'cb-countbox', hidden: true });
    var inp = MQ.ui.numberInput({
      unit: 'cubes',
      onSubmit: function (a) {
        if (phase !== 'count') return;
        if (a === T) {
          inp.good();
          inp.disable();
          countBox.appendChild(working(d));
          var msg = q.same18 ? '18 again! A different shape, but the same number of cubes.' : (d[2] > 1 ? plural(d[2], 'layer', 'layers') + ' of ' + d[0] * d[1] + ' = ' + T + '!' : T + ' cubes!');
          api.check(true, msg);
          if (q.same18) countBox.appendChild(el('div', { class: 'cb-line cb-good' }, 'The last block used 18 too. Two different shapes, both 18 cubes!'));
        } else {
          inp.bad();
          var hm = countHint(api, d, a, -1);
          api.check(false, hm[0], hm[1]);
        }
      },
    });
    countBox.appendChild(el('div', { class: 'cb-line' }, 'Same block! How many cubes does it use?'));
    countBox.appendChild(inp.el);
    function matched() {
      phase = 'count';
      b.lock();
      check.hidden = true;
      b.steppers.hidden = true;
      countBox.hidden = false;
      inp.focus();
    }
    check.addEventListener('click', function () {
      if (phase !== 'build') return;
      var m = b.dims();
      if (key(m) === key(d)) {
        api.sound('pop');
        var turned = m.join() !== d.join();
        api.feedback(turned ? 'Same block, just turned round! Now count the cubes.' : 'That matches! Now count the cubes.', 'good');
        api.say('Now count the cubes: one layer, then add the layers.', 'happy');
        matched();
        return;
      }
      var strong = api.tries() >= 1;
      var hint, tag;
      if (m[0] === d[0] && m[2] === d[2] && m[1] !== d[1]) {
        hint = 'The front looks right! Turn the picture: how many rows go back?';
        tag = 'Counted only the front of the block';
      } else if (m[2] !== d[2] && key([m[0], m[1], 1]) === key([d[0], d[1], 1])) {
        hint = 'One layer is right. Count the layers: each layer is a different colour.';
        tag = 'Built the wrong number of layers';
      } else {
        hint = 'Count the cubes along the front row, then the rows going back, then the layers.';
        tag = 'Built a block with the wrong number of cubes';
      }
      if (strong) hint += ' The picture has ' + d[0] + ' in a row and ' + plural(d[2], 'layer', 'layers') + '.';
      api.check(false, hint, tag);
    });
    var cols = el('div', { class: 'cb-row cb-row-2' },
      card('Copy this', el('div', { class: 'cb-col' }, target.svg, tTools)),
      card('Your block', b.el));
    wrap.appendChild(cols);
    wrap.appendChild(el('div', { class: 'cb-actions' }, b.steppers, check, countBox));
    wrap.appendChild(b.note);
    stage.appendChild(wrap);
    api.onReveal(function () {
      b.setDims(d);
      b.lock();
      check.hidden = true;
      b.steppers.hidden = true;
      countBox.hidden = false;
      phase = 'done';
      inp.setValue(String(T));
      inp.good();
      inp.disable();
      countBox.appendChild(working(d));
      api.feedback(d[0] + ' in a row, ' + plural(d[1], 'row', 'rows') + ', ' + plural(d[2], 'layer', 'layers') + '. ' + (d[2] > 1 ? rep(d[0] * d[1], d[2]).join(' + ') + ' = ' + T : rep(d[0], d[1]).join(' + ') + ' = ' + T) + ' cubes.', 'info');
    });
  }

  function tickList() {
    var box = el('div', { class: 'cb-ticks' }, el('div', { class: 'cb-card-title' }, 'Blocks with 12 cubes'));
    TWELVE.forEach(function (t) {
      var k = key(t), got = found.indexOf(k) >= 0;
      var row = el('div', { class: 'cb-tick' + (got ? ' cb-got' : ''), dataset: { key: k } });
      row.appendChild(el('span', { class: 'cb-tick-box' }, got ? '✓' : ''));
      row.appendChild(el('span', { class: 'cb-tick-txt' }, got ? byText(t) : t[0] + ' by ' + t[1] + ' by ?'));
      if (got) {
        var mini = makeView(null, { w: 120, h: 50, L: t[2], W: t[0], H: t[1], yaw: 30, maxCube: 16, pad: 6, drag: false, bg: '#ffffff' });
        mini.svg.classList.add('cb-mini');
        row.appendChild(mini.svg);
      }
      box.appendChild(row);
    });
    return box;
  }

  function renderTwelve(stage, api, q) {
    var step = q.step;
    var wrap = el('div', { class: 'cb-q', dataset: { kind: 'twelve', step: String(step) } });
    if (step === 1) {
      api.say('Use exactly 12 cubes. Make a block!', 'think');
      stage.appendChild(MQ.ui.prompt('Use <b>exactly 12</b> cubes. Build a block.'));
    } else if (step === 2) {
      api.say('Now make a different block with 12 cubes.', 'think');
      stage.appendChild(MQ.ui.prompt('Build a <b>different</b> block with 12 cubes.'));
    } else {
      api.say('Find all the 12-cube blocks. Work in order: 1 row, then 2 rows...', 'think');
      stage.appendChild(MQ.ui.prompt('Find <b>all</b> the blocks you can make with 12 cubes.'));
    }
    var ticksHolder = el('div', { class: 'cb-ticks-holder' });
    var live = el('div', { class: 'cb-live' });
    var b = makeBuilder(api, {
      w: 400, h: 280,
      onChange: function (d) {
        MQ.clear(live);
        var n = d[0] * d[1], T = n * d[2];
        live.appendChild(el('div', { class: 'cb-line' }, 'Cubes used: ', el('b', { class: 'cb-used' + (T === 12 ? ' cb-good' : '') }, String(T))));
        live.appendChild(working(d));
      },
    });
    function redrawTicks() {
      MQ.clear(ticksHolder);
      ticksHolder.appendChild(tickList());
      wrap.dataset.found = found.join(' ');
    }
    redrawTicks();
    var check = el('button', { class: 'btn cb-check-12', type: 'button' }, 'Check my block');
    var allBtn = step === 3 ? el('button', { class: 'btn btn-ghost cb-all', type: 'button' }, 'I found them all') : null;
    function missing() { return TWELVE.filter(function (t) { return found.indexOf(key(t)) < 0; }); }
    function orderNudge() {
      var m = missing()[0];
      return m ? ' Work in order: try ' + m[0] + ' by ' + m[1] + ' next.' : '';
    }
    function finishAll() {
      b.lock();
      check.disabled = true;
      if (allBtn) allBtn.disabled = true;
    }
    check.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var d = b.dims(), T = total(d), k = key(d);
      var strong = api.tries() >= 1;
      if (T !== 12) {
        var n = d[0] * d[1];
        var msg = 'Your block uses ' + T + ' cubes. ' + (T < 12 ? 'You need 12: add more.' : 'That is too many: you need 12.');
        if (strong) {
          var jumps = [];
          for (var v = n; v < 12 + n && jumps.length < 12; v += n) jumps.push(v);
          msg += ' Each layer has ' + n + '. Count on: ' + jumps.join(', ') + (12 % n === 0 ? '. So ' + plural(12 / n, 'layer makes', 'layers make') + ' 12.' : '. You jump past 12! Change the layer.');
        }
        api.check(false, msg, 'Block does not use 12 cubes');
        return;
      }
      if (found.indexOf(k) >= 0) {
        api.check(false, 'That is ' + byText(d) + ' again, just turned round. Same block! Try a new one.' + (strong ? orderNudge() : ''), 'Thought a turned block was a new one');
        return;
      }
      found.push(k);
      redrawTicks();
      api.sound('pop');
      if (step < 3) {
        finishAll();
        api.check(true, byText(d) + ' uses 12 cubes. Ticked!');
        return;
      }
      var left = missing().length;
      if (!left) {
        finishAll();
        api.check(true, 'All 4 found! Working in order finds them all.');
      } else {
        api.say('New one! ' + left + ' more to find.' + orderNudge(), 'happy');
        api.feedback('Ticked: ' + byText(d) + '. ' + plural(left, 'more block', 'more blocks') + ' to find.', 'good');
      }
    });
    if (allBtn) {
      allBtn.addEventListener('click', function () {
        if (api.isAnswered()) return;
        var m = missing();
        if (!m.length) {
          finishAll();
          api.check(true, 'All 4 found!');
          return;
        }
        api.check(false, 'Not yet! ' + plural(m.length, 'block is', 'blocks are') + ' missing.' + orderNudge(), 'Stopped before finding every block');
      });
    }
    var side = el('div', { class: 'cb-side cb-side-12' }, live, el('div', { class: 'cb-actions' }, check, allBtn), ticksHolder);
    wrap.appendChild(el('div', { class: 'cb-row' }, b.el, side));
    stage.appendChild(wrap);
    api.onReveal(function () {
      var m = missing();
      var show = step < 3 ? m.slice(0, 1) : m;
      if (!show.length) show = [TWELVE[3]];
      show.forEach(function (t) {
        if (found.indexOf(key(t)) < 0) found.push(key(t));
      });
      var last = show[show.length - 1];
      b.setDims([last[2], last[0], last[1]]);
      finishAll();
      redrawTicks();
      api.feedback(step < 3 ? byText(last) + ': ' + working12(last) : 'All 4: 1 by 1 by 12, 1 by 2 by 6, 1 by 3 by 4, 2 by 2 by 3. Turned ones are the same block.', 'info');
    });
  }
  function working12(t) {
    var d = [t[2], t[0], t[1]], n = d[0] * d[1];
    return 'one layer of ' + n + (d[2] > 1 ? ', ' + rep(n, d[2]).join(' + ') + ' = 12.' : ' = 12.');
  }

  MQ.register('cube-builder', {
    learn: [learnTray, learnLayers, learnHidden],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) {
          deck = buildDeck();
          found = [];
        }
        var q = deck[api.index];
        if (q.type === 'count') renderCount(stage, api, q);
        else if (q.type === 'copy') renderCopy(stage, api, q);
        else renderTwelve(stage, api, q);
      },
    },
  });

  var css = [
    '.cb-svg{display:block;width:100%;height:auto;user-select:none;-webkit-user-select:none}',
    '.cb-tray-svg{max-width:640px}',
    '.cb-sugar{cursor:grab}',
    '.cb-sugar.cb-placed{cursor:default}',
    '.cb-row{display:flex;flex-wrap:wrap;gap:18px;justify-content:center;align-items:flex-start;width:100%;max-width:900px}',
    '.cb-row-2 > *{flex:1 1 300px;max-width:360px}',
    '.cb-col{display:flex;flex-direction:column;align-items:center;gap:8px;flex:1 1 320px;max-width:430px;min-width:0}',
    '.cb-side{display:flex;flex-direction:column;align-items:center;gap:12px;flex:1 1 260px;max-width:400px;min-width:0;padding-top:6px}',
    '.cb-side .sum-row{flex-wrap:wrap;justify-content:center}',
    '.cb-q{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.cb-tools{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.cb-tool{padding:6px 14px;font-size:1rem}',
    '.cb-tip{color:var(--ink-soft);font-size:.92rem;font-weight:700;text-align:center}',
    '.cb-big{font-size:1.5rem;font-weight:800;text-align:center}',
    '.cb-good{color:var(--good)}',
    '.cb-line{font-size:1.15rem;font-weight:700;text-align:center}',
    '.cb-line b{font-size:1.4rem}',
    '.cb-muted{color:var(--ink-soft)}',
    '.cb-count-line{font-size:1.25rem;font-weight:700}',
    '.cb-done{display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:center}',
    '.cb-done-txt{font-size:1.25rem;font-weight:800;color:var(--good)}',
    '.cb-jumps{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.cb-jumps-lab{font-weight:700;color:var(--ink-soft)}',
    '.cb-jump{display:inline-flex;align-items:center;justify-content:center;min-width:44px;height:44px;border-radius:50%;background:#fff3cd;border:3px solid var(--gold);font-weight:800;font-size:1.15rem}',
    '.cb-after{display:flex;flex-direction:column;gap:10px;align-items:center}',
    '.cb-work{display:flex;flex-direction:column;gap:8px;align-items:center;background:#fff;border:2px solid var(--line);border-radius:14px;padding:10px 12px;max-width:100%}',
    '.cb-work-line{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px}',
    '.cb-work-line .sum-row{flex-wrap:wrap;justify-content:center}',
    '.cb-work-lab{font-weight:700;color:var(--ink-soft)}',
    '.cb-card{background:#fff;border:2px solid var(--line);border-radius:16px;padding:8px;display:flex;flex-direction:column;gap:6px;align-items:center;min-width:0}',
    '.cb-card > .cb-col,.cb-card > .cb-builder{width:100%;max-width:none}',
    '.cb-card-title{font-weight:800;font-size:1.05rem;text-align:center}',
    '.cb-builder{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;min-width:0;flex:1 1 320px;max-width:420px}',
    '.cb-steppers{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.cb-step{display:flex;flex-direction:column;align-items:center;gap:2px;background:var(--paper-2);border-radius:12px;padding:4px 8px}',
    '.cb-step-name{font-size:.85rem;font-weight:800;color:var(--ink-soft)}',
    '.cb-step-ctl{display:flex;align-items:center;gap:6px}',
    '.cb-step-btn{min-width:38px;height:38px;padding:0 10px;font-size:1.3rem}',
    '.cb-step-val{min-width:30px;text-align:center;font-size:1.4rem;font-weight:800}',
    '.cb-note{min-height:1.2em;color:var(--try);font-weight:700;font-size:.92rem}',
    '.cb-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center}',
    '.cb-countbox{display:flex;flex-direction:column;gap:8px;align-items:center}',
    '.cb-live{display:flex;flex-direction:column;gap:6px;align-items:center}',
    '.cb-ticks{background:#fff;border:2px solid var(--line);border-radius:14px;padding:8px 12px;display:flex;flex-direction:column;gap:4px;min-width:220px}',
    '.cb-tick{display:flex;align-items:center;gap:8px;font-weight:700;color:var(--ink-soft);min-height:36px}',
    '.cb-tick.cb-got{color:var(--ink)}',
    '.cb-tick-box{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border:3px solid var(--line);border-radius:7px;color:var(--good);font-weight:900}',
    '.cb-got .cb-tick-box{border-color:var(--good);background:var(--good-bg)}',
    '.cb-mini{width:90px;height:auto;margin-left:auto}',
    '.cb-side-12{gap:10px}',
    '@media (max-width:640px){.cb-step-btn{min-width:34px;height:34px}.cb-big{font-size:1.25rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'cube-builder' }, css));
})();

/* Spin and Count — run spinner, dice and survey investigations, tally the results,
 * read the frequencies and turn a tally into a graph (Unit 10.1).
 * Experiments are truly random, but every question is computed from the data that was
 * actually generated and drawn on screen. Tally marks are drawn in gates of 5
 * (four lines and one line across). Graphs are drawn to scale from the same counts.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;
  var ID = 'spin-and-count';

  /* ------------------------------------------------------------------ *
   * Data
   * ------------------------------------------------------------------ */
  var SPIN = [
    { name: 'red', color: '#e63946' },
    { name: 'blue', color: '#3a86ff' },
    { name: 'green', color: '#38b000' },
    { name: 'yellow', color: '#ffbe0b' },
    { name: 'purple', color: '#8338ec' },
  ];
  SPIN.forEach(function (c) {
    c.swatch = c.color;
  });

  function C(name, icon) {
    return { name: name, icon: icon };
  }
  // Level 1 finished tally charts (4 options).
  var CTX1 = [
    { key: 'fruit', title: 'Favourite fruit at snack time', head: 'Fruit', cats: [C('apple', '🍎'), C('banana', '🍌'), C('orange', '🍊'), C('grapes', '🍇')], most: 'Which fruit is the most popular?' },
    { key: 'travel', title: 'How we come to school', head: 'Way', cats: [C('walk', '🚶'), C('car', '🚗'), C('bus', '🚌'), C('bike', '🚲')], most: 'Which way to school is the most popular?' },
    { key: 'games', title: 'Favourite playground game', head: 'Game', cats: [C('football', '⚽'), C('skipping', '🪢'), C('slide', '🛝'), C('tag', '🏃')], most: 'Which game is the most popular?' },
    { key: 'pets', title: 'Pets in our class', head: 'Pet', cats: [C('cat', '🐈'), C('dog', '🐕'), C('fish', '🐟'), C('rabbit', '🐇')], most: 'Which pet is the most popular?' },
    { key: 'drinks', title: 'Drinks at lunch', head: 'Drink', cats: [C('water', '💧'), C('milk', '🥛'), C('juice', '🧃'), C('smoothie', '🥤')], most: 'Which drink is the most popular?' },
    { key: 'clubs', title: 'After-school clubs', head: 'Club', cats: [C('art', '🎨'), C('music', '🎵'), C('chess', '♟️'), C('cooking', '🍳')], most: 'Which club is the most popular?' },
  ];
  // Level 2 survey with 10 answers (from the workbook survey ideas).
  var SURVEYS = [
    { key: 'uniform', title: 'Favourite school uniform', ask: 'Which uniform do you like best?', head: 'Uniform', cats: [C('green T-shirt', '🟩'), C('yellow T-shirt', '🟨'), C('green shirt', '🟢'), C('yellow shirt', '🟡')] },
    { key: 'petfood', title: 'Food our pets eat', ask: 'What food does your pet eat?', head: 'Food', cats: [C('fish flakes', '🐟'), C('dog biscuits', '🦴'), C('cat food', '🥫')] },
    { key: 'breakfast', title: 'What we eat for breakfast', ask: 'What do you eat for breakfast?', head: 'Breakfast', cats: [C('cereal', '🥣'), C('toast', '🍞'), C('eggs', '🍳'), C('fruit', '🍌')] },
  ];
  var PICNIC = { key: 'picnic', title: 'What to take on our picnic', head: 'Food', cats: [C('sandwiches', '🥪'), C('strawberries', '🍓'), C('juice', '🧃'), C('cake', '🍰')] };
  var NAMES = ['Ali', 'Mia', 'Sam', 'Zara', 'Leo', 'Ava', 'Omar', 'Lily', 'Ben', 'Noor', 'Kai', 'Ruby', 'Max', 'Isla', 'Yusuf', 'Ella'];

  var STEPS = [
    { id: 'ask', icon: '❓', title: 'Ask', text: 'Choose a question and plan how to answer it' },
    { id: 'collect', icon: '📝', title: 'Collect', text: 'Collect the data and record it in a tally chart' },
    { id: 'look', icon: '🔍', title: 'Look', text: 'Look at the data: what does it show?' },
    { id: 'check', icon: '✅', title: 'Check', text: 'Check: does it answer our question?' },
  ];

  /* ------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------ */
  function sum(a) {
    return a.reduce(function (s, v) { return s + v; }, 0);
  }
  function maxIdx(a) {
    var m = Math.max.apply(null, a);
    var idx = [];
    a.forEach(function (v, i) { if (v === m) idx.push(i); });
    return idx;
  }
  function gates(n) {
    return Math.floor(n / 5);
  }
  function times(n) {
    return n + (n === 1 ? ' time' : ' times');
  }
  function countsOf(list, k) {
    var c = [];
    for (var i = 0; i < k; i++) c.push(0);
    list.forEach(function (v) { c[v]++; });
    return c;
  }
  function randomCounts(total, k) {
    var c = [];
    for (var i = 0; i < k; i++) c.push(0);
    for (var j = 0; j < total; j++) c[U.rand(0, k - 1)]++;
    return c;
  }
  /** Split `total` answers over k options with each between lo and hi (inclusive). */
  function splitCounts(total, k, lo, hi, ok) {
    for (var t = 0; t < 2000; t++) {
      var c = [];
      for (var i = 0; i < k; i++) c.push(lo);
      var left = total - lo * k;
      while (left > 0) {
        var j = U.rand(0, k - 1);
        if (c[j] < hi) {
          c[j]++;
          left--;
        }
      }
      if (!ok || ok(c)) return c;
    }
    return null;
  }
  /** Which wrong value counts as a gate slip: each gate of 5 read as 4 (or as 6). */
  function freqTag(val, truth) {
    var g = gates(truth);
    if (g > 0 && (val === truth - g || val === truth + g)) return 'Tally marks miscounted (gate of 5)';
    return 'Frequency does not match tally';
  }
  function catLabel(c) {
    return c.swatch ? '<span class="snc-sw" style="background:' + c.swatch + '"></span> ' + c.name : c.icon + ' ' + c.name;
  }
  function catNode(c) {
    var s = el('span', { class: 'snc-catn' });
    s.innerHTML = catLabel(c);
    return s;
  }
  function txt(t, cls) {
    var p = el('div', { class: cls || 'snc-note' });
    p.innerHTML = t;
    return p;
  }
  function row() {
    var r = el('div', { class: 'snc-row' });
    Array.prototype.slice.call(arguments).forEach(function (c) {
      if (c) r.appendChild(c);
    });
    return r;
  }
  function col(cls) {
    var r = el('div', { class: 'snc-col ' + (cls || '') });
    Array.prototype.slice.call(arguments, 1).forEach(function (c) {
      if (c) r.appendChild(c);
    });
    return r;
  }

  /** Count-along chips for a tally: 5, 10, 11, 12 (gates count in 5s, then 1s). */
  function countAlong(n) {
    var w = el('div', { class: 'snc-along' });
    var v = 0;
    var g = gates(n);
    for (var i = 0; i < g; i++) {
      v += 5;
      w.appendChild(el('span', { class: 'snc-ch snc-ch5' }, String(v)));
    }
    for (var j = 0; j < n - g * 5; j++) {
      v += 1;
      w.appendChild(el('span', { class: 'snc-ch' }, String(v)));
    }
    if (!n) w.appendChild(el('span', { class: 'snc-ch' }, '0'));
    return w;
  }
  function alongText(n) {
    var parts = [];
    var v = 0;
    for (var i = 0; i < gates(n); i++) parts.push((v += 5));
    for (var j = 0; j < n % 5; j++) parts.push((v += 1));
    return parts.length ? parts.join(', ') : '0';
  }

  /* ------------------------------------------------------------------ *
   * Tally marks (SVG): gates of 5 = four lines and one diagonal
   * ------------------------------------------------------------------ */
  var PITCH = 46;
  function tallySvg(n, fresh) {
    var g = gates(n);
    var rem = n - g * 5;
    var w = Math.max(14, g * PITCH + rem * 9 + 6);
    var s = svg('svg', { class: 'snc-tsvg', viewBox: '0 0 ' + w + ' 28', width: w, height: 28, 'aria-label': n + ' tally marks' });
    var k = 0;
    function mark(x1, y1, x2, y2, cls) {
      k++;
      s.appendChild(svg('line', { x1: x1, y1: y1, x2: x2, y2: y2, class: 'snc-mk' + (cls ? ' ' + cls : '') + (fresh && k === n ? ' snc-fresh' : '') }));
    }
    for (var i = 0; i < g; i++) {
      var x0 = i * PITCH + 5;
      for (var j = 0; j < 4; j++) mark(x0 + j * 9, 3, x0 + j * 9, 25);
      mark(x0 - 4, 21, x0 + 31, 7, 'snc-diag');
    }
    for (var r = 0; r < rem; r++) mark(g * PITCH + 5 + r * 9, 3, g * PITCH + 5 + r * 9, 25);
    return s;
  }

  /**
   * Tally chart table. cats: [{name, icon|swatch}]. opts.freq: 'show' | 'hide' | 'input'
   * Returns { el, counts, set(i, n, fresh), add(i), showFreq(i), showAll(), inputs, rowEl(i), mark(i, cls), work(i), clearMarks() }
   */
  function tallyChart(cats, counts, opts) {
    opts = opts || {};
    var t = { counts: counts.slice(), inputs: [], rows: [] };
    var table = el('table', { class: 'snc-tally' + (opts.compact ? ' snc-compact' : '') });
    if (opts.caption) table.appendChild(el('caption', null, opts.caption));
    var thead = el('tr', null, el('th', null, opts.head || 'Option'), el('th', null, 'Tally'), el('th', null, 'Frequency'));
    table.appendChild(el('thead', null, thead));
    var tbody = el('tbody');
    table.appendChild(tbody);
    cats.forEach(function (c, i) {
      var marks = el('div', { class: 'snc-marks' });
      var work = el('div', { class: 'snc-work' });
      var freq = el('td', { class: 'snc-freq' });
      var tr = el('tr', null, el('td', { class: 'snc-cat' }, catNode(c)), el('td', { class: 'snc-mcell' }, marks, work), freq);
      if (opts.freq === 'input') {
        var inp = el('input', { class: 'snc-fin', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Frequency for ' + c.name });
        inp.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' && opts.onEnter) {
            e.preventDefault();
            opts.onEnter();
          }
        });
        t.inputs.push(inp);
        freq.appendChild(inp);
      }
      if (opts.onRow) {
        tr.classList.add('snc-click');
        tr.addEventListener('click', function (e) {
          if (e.target && e.target.tagName === 'INPUT') return;
          opts.onRow(i, tr);
        });
      }
      t.rows.push({ tr: tr, marks: marks, freq: freq, work: work });
      tbody.appendChild(tr);
    });
    t.set = function (i, n, fresh) {
      t.counts[i] = n;
      MQ.clear(t.rows[i].marks);
      t.rows[i].marks.appendChild(tallySvg(n, fresh));
      if (opts.freq === 'show') t.showFreq(i);
      else if (opts.freq === 'hide' && !t.rows[i].freq.textContent) t.rows[i].freq.textContent = '?';
    };
    t.add = function (i) {
      t.set(i, t.counts[i] + 1, true);
    };
    t.showFreq = function (i, cls) {
      var f = t.rows[i].freq;
      if (opts.freq === 'input') {
        t.inputs[i].value = String(t.counts[i]);
        return;
      }
      MQ.clear(f);
      f.appendChild(el('span', { class: 'snc-fv' + (cls ? ' ' + cls : '') }, String(t.counts[i])));
    };
    t.setFreqText = function (i, v, cls) {
      var f = t.rows[i].freq;
      MQ.clear(f);
      f.appendChild(el('span', { class: 'snc-fv' + (cls ? ' ' + cls : '') }, String(v)));
    };
    t.showAll = function () {
      cats.forEach(function (c, i) { t.showFreq(i); });
    };
    t.mark = function (i, cls) {
      t.rows[i].tr.classList.remove('snc-good', 'snc-bad', 'snc-hi');
      if (cls) t.rows[i].tr.classList.add(cls);
    };
    t.clearMarks = function () {
      cats.forEach(function (c, i) {
        t.mark(i, null);
        if (t.inputs[i]) t.inputs[i].classList.remove('snc-good', 'snc-bad');
      });
    };
    t.work = function (i, show) {
      MQ.clear(t.rows[i].work);
      if (show !== false) t.rows[i].work.appendChild(countAlong(t.counts[i]));
    };
    cats.forEach(function (c, i) { t.set(i, t.counts[i]); });
    t.el = el('div', { class: 'snc-tallybox' }, table);
    return t;
  }

  /** Two runs side by side in one table: colour | run 1 tally | run 1 | run 2 tally | run 2. */
  function compareTable(cats, run1, who) {
    var t = { counts: cats.map(function () { return 0; }) };
    var cells = [];
    var table = el('table', { class: 'snc-tally snc-compact snc-cmp' });
    table.appendChild(el('thead', null, el('tr', null, el('th', null, 'Colour'), el('th', null, who + '\'s tally'), el('th', { class: 'snc-fh' }, 'Run 1'), el('th', null, 'Your tally'), el('th', { class: 'snc-fh' }, 'Run 2'))));
    var tbody = el('tbody');
    table.appendChild(tbody);
    cats.forEach(function (c, i) {
      var m1 = el('div', { class: 'snc-marks' }, tallySvg(run1[i]));
      var w1 = el('div', { class: 'snc-work' });
      var m2 = el('div', { class: 'snc-marks' }, tallySvg(0));
      var w2 = el('div', { class: 'snc-work' });
      var f2 = el('td', { class: 'snc-freq' }, '0');
      var tr = el('tr', null, el('td', { class: 'snc-cat' }, catNode(c)), el('td', { class: 'snc-mcell' }, m1, w1), el('td', { class: 'snc-freq' }, String(run1[i])), el('td', { class: 'snc-mcell' }, m2, w2), f2);
      cells.push({ tr: tr, m2: m2, w1: w1, w2: w2, f2: f2 });
      tbody.appendChild(tr);
    });
    t.add = function (i) {
      t.counts[i]++;
      MQ.clear(cells[i].m2);
      cells[i].m2.appendChild(tallySvg(t.counts[i], true));
      cells[i].f2.textContent = String(t.counts[i]);
    };
    t.mark = function (i, cls) {
      cells[i].tr.classList.remove('snc-good', 'snc-bad', 'snc-hi');
      if (cls) cells[i].tr.classList.add(cls);
    };
    t.work = function (i) {
      MQ.clear(cells[i].w1);
      MQ.clear(cells[i].w2);
      cells[i].w1.appendChild(countAlong(run1[i]));
      cells[i].w2.appendChild(countAlong(t.counts[i]));
    };
    t.el = el('div', { class: 'snc-tallybox' }, table);
    return t;
  }

  /* ------------------------------------------------------------------ *
   * Spinner (5 equal sectors) and dice
   * ------------------------------------------------------------------ */
  function polar(a, r) {
    var rad = (a * Math.PI) / 180;
    return [100 + r * Math.sin(rad), 100 - r * Math.cos(rad)];
  }
  function makeSpinner(api, cols) {
    var n = cols.length;
    var step = 360 / n;
    var s = svg('svg', { class: 'snc-spinner', viewBox: '0 0 200 200', role: 'img', 'aria-label': 'Spinner with ' + n + ' equal parts' });
    var wheel = svg('g', { class: 'snc-wheel' });
    cols.forEach(function (c, i) {
      var a = polar(i * step, 86);
      var b = polar((i + 1) * step, 86);
      wheel.appendChild(svg('path', { d: 'M100 100 L' + a[0].toFixed(2) + ' ' + a[1].toFixed(2) + ' A86 86 0 0 1 ' + b[0].toFixed(2) + ' ' + b[1].toFixed(2) + ' Z', fill: c.color, stroke: '#fff', 'stroke-width': 3 }));
    });
    s.appendChild(svg('circle', { cx: 100, cy: 100, r: 89, fill: 'none', stroke: '#1b2a4a', 'stroke-width': 3 }));
    s.appendChild(wheel);
    s.appendChild(svg('circle', { cx: 100, cy: 100, r: 9, fill: '#1b2a4a' }));
    s.appendChild(svg('path', { d: 'M88 2 L112 2 L100 26 Z', fill: '#1b2a4a', stroke: '#fff', 'stroke-width': 2 }));
    var cur = 0;
    return {
      el: el('div', { class: 'snc-spinbox' }, s),
      /** Turn the wheel so the pointer lands in sector k, then call cb. */
      spin: function (k, fast, cb) {
        var off = k * step + U.rand(12, step - 12);
        var targetMod = (360 - off) % 360;
        var curMod = ((cur % 360) + 360) % 360;
        cur = cur + (fast ? 360 : 720) + ((targetMod - curMod + 360) % 360);
        var ms = fast ? 220 : 750;
        wheel.style.transition = 'transform ' + ms + 'ms cubic-bezier(.2,.7,.3,1)';
        wheel.style.transform = 'rotate(' + cur + 'deg)';
        api.later(cb, ms + 40);
      },
    };
  }

  var PIPS = {
    1: [[2, 2]],
    2: [[1, 1], [3, 3]],
    3: [[1, 1], [2, 2], [3, 3]],
    4: [[1, 1], [3, 1], [1, 3], [3, 3]],
    5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]],
    6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]],
  };
  function dieFace(v, x, color) {
    var g = svg('g', { transform: 'translate(' + x + ',4)' });
    g.appendChild(svg('rect', { x: 0, y: 0, width: 64, height: 64, rx: 12, fill: '#fff', stroke: color, 'stroke-width': 4 }));
    PIPS[v].forEach(function (p) {
      g.appendChild(svg('circle', { cx: p[0] * 16, cy: p[1] * 16, r: 6, fill: '#1b2a4a' }));
    });
    return g;
  }
  function makeDice(api) {
    var s = svg('svg', { class: 'snc-dice', viewBox: '0 0 160 72', role: 'img', 'aria-label': 'Two dice' });
    var lab = el('div', { class: 'snc-dtotal' }, ' ');
    function draw(a, b) {
      MQ.clear(s);
      s.appendChild(dieFace(a, 6, '#3a86ff'));
      s.appendChild(dieFace(b, 90, '#e63946'));
      s.setAttribute('aria-label', 'Dice show ' + a + ' and ' + b);
    }
    draw(3, 4);
    return {
      el: el('div', { class: 'snc-dicebox' }, s, lab),
      show: function (a, b) {
        draw(a, b);
        lab.textContent = a + ' + ' + b + ' = ' + (a + b);
      },
      roll: function (a, b, fast, cb) {
        var flips = fast ? 1 : 3;
        var ms = fast ? 70 : 110;
        var k = 0;
        lab.textContent = '…';
        s.classList.add('snc-shake');
        function f() {
          if (k < flips) {
            draw(U.rand(1, 6), U.rand(1, 6));
            k++;
            api.later(f, ms);
            return;
          }
          s.classList.remove('snc-shake');
          draw(a, b);
          lab.textContent = a + ' + ' + b + ' = ' + (a + b);
          cb();
        }
        f();
      },
    };
  }

  /**
   * Run `total` trials one at a time ("once") or all the rest ("rest").
   * o.outcome() -> random outcome; o.animate(out, fast, cb); o.record(out); o.onDone().
   */
  function experiment(api, o) {
    var n = 0;
    var busy = false;
    var auto = false;
    var token = 0;
    var done = false;
    var counter = el('div', { class: 'snc-counter' });
    var once = el('button', { class: 'btn', type: 'button' }, o.onceLabel);
    var rest = el('button', { class: 'btn btn-ghost snc-rest', type: 'button' }, o.restLabel);
    var box = el('div', { class: 'snc-exp' }, el('div', { class: 'snc-expbtns' }, once, rest), counter);
    function upd() {
      counter.innerHTML = o.word + ': <b>' + n + '</b> of ' + o.total;
      var off = busy || done || (o.ready && !o.ready());
      once.disabled = off || auto;
      rest.disabled = off || auto;
    }
    function finish() {
      done = true;
      auto = false;
      upd();
      if (o.onDone) o.onDone();
    }
    function one(fast) {
      if (busy || done) return;
      busy = true;
      upd();
      var tk = token;
      var out = o.outcome();
      o.animate(out, fast, function () {
        if (tk !== token) return;
        o.record(out, true);
        n++;
        busy = false;
        if (n >= o.total) finish();
        else {
          upd();
          if (auto) api.later(function () { one(true); }, 40);
        }
      });
    }
    once.addEventListener('click', function () {
      one(false);
    });
    rest.addEventListener('click', function () {
      if (busy || done) return;
      auto = true;
      one(true);
    });
    upd();
    return {
      el: box,
      refresh: upd,
      isDone: function () { return done; },
      /** For tests: finish every remaining trial at once. */
      finishNow: function () {
        if (done) return;
        token++;
        busy = false;
        while (n < o.total) {
          var out = o.outcome();
          if (o.show) o.show(out);
          o.record(out, false);
          n++;
        }
        finish();
      },
    };
  }

  /* ------------------------------------------------------------------ *
   * Graphs drawn from counts (to scale)
   * ------------------------------------------------------------------ */
  function barChart(cats, counts, opts) {
    opts = opts || {};
    var mx = Math.max.apply(null, counts.concat([opts.min || 6]));
    var top = mx + 1;
    if (top % 2) top++;
    var W = 460, H = 300, L = 46, R = 12, T = opts.title ? 34 : 14, B = 52;
    var unit = (H - T - B) / top;
    var bw = (W - L - R) / cats.length;
    var s = svg('svg', { class: 'snc-bars', viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Bar chart' });
    if (opts.title) s.appendChild(svg('text', { x: W / 2, y: 22, 'text-anchor': 'middle', class: 'snc-gtitle' }, opts.title));
    for (var v = 0; v <= top; v++) {
      var y = H - B - v * unit;
      s.appendChild(svg('line', { x1: L, y1: y, x2: W - R, y2: y, class: 'snc-gl' }));
      if (top <= 12 || v % 2 === 0) s.appendChild(svg('text', { x: L - 8, y: y + 5, 'text-anchor': 'end', class: 'snc-gnum' }, String(v)));
    }
    var bars = [];
    cats.forEach(function (c, i) {
      var x = L + i * bw + bw * 0.18;
      var w = bw * 0.64;
      var h = counts[i] * unit;
      var r = svg('rect', { x: x, y: H - B - h, width: w, height: h, fill: c.color || opts.colors[i % opts.colors.length], class: 'snc-bar' + (opts.grow ? ' snc-grow' : '') });
      if (opts.grow) r.style.animationDelay = i * 0.12 + 's';
      s.appendChild(r);
      bars.push(r);
      var cx = L + i * bw + bw / 2;
      if (c.icon) s.appendChild(svg('text', { x: cx, y: H - B + 22, 'text-anchor': 'middle', class: 'snc-gic' }, c.icon));
      s.appendChild(svg('text', { x: cx, y: H - B + (c.icon ? 42 : 24), 'text-anchor': 'middle', class: 'snc-gcat' }, c.name.length > 11 ? c.name.split(' ')[0] : c.name));
    });
    s.appendChild(svg('line', { x1: L, y1: H - B, x2: W - R, y2: H - B, class: 'snc-axis' }));
    s.appendChild(svg('line', { x1: L, y1: T - 6, x2: L, y2: H - B, class: 'snc-axis' }));
    return {
      el: el('div', { class: 'snc-chartbox' }, s),
      setBar: function (i, v, cls) {
        var h = v * unit;
        bars[i].setAttribute('y', H - B - h);
        bars[i].setAttribute('height', h);
        bars[i].classList.remove('snc-bbad', 'snc-bgood');
        if (cls) bars[i].classList.add(cls);
      },
      markBar: function (i, cls) {
        bars[i].classList.remove('snc-bbad', 'snc-bgood');
        if (cls) bars[i].classList.add(cls);
      },
    };
  }
  function pictogram(cats, counts, opts) {
    opts = opts || {};
    var w = el('div', { class: 'snc-picto' });
    if (opts.title) w.appendChild(el('div', { class: 'snc-ptitle' }, opts.title));
    cats.forEach(function (c, i) {
      var pics = el('div', { class: 'snc-pics' });
      for (var k = 0; k < counts[i]; k++) {
        var p = c.color ? el('span', { class: 'snc-dot', style: { background: c.color } }) : el('span', { class: 'snc-pic' }, c.icon);
        p.style.animationDelay = (i * 0.15 + k * 0.04).toFixed(2) + 's';
        pics.appendChild(p);
      }
      w.appendChild(el('div', { class: 'snc-prow' }, el('div', { class: 'snc-plab' }, catNode(c)), pics));
    });
    var keyPic = cats[0].color ? el('span', { class: 'snc-dot snc-dot-key', style: { background: '#8a98b8' } }) : el('span', { class: 'snc-pic' }, '🙂');
    w.appendChild(el('div', { class: 'snc-key' }, 'Key: ', keyPic, ' = ' + (opts.keyText || '1')));
    return { el: w };
  }

  /* ------------------------------------------------------------------ *
   * Frequency answers (several boxes, one Check)
   * ------------------------------------------------------------------ */
  function freqCheck(api, tally, truth, opts) {
    opts = opts || {};
    var last = null;
    var btn = el('button', { class: 'btn btn-check snc-checkbtn', type: 'button' }, 'Check');
    function check() {
      if (api.isAnswered()) return;
      if (opts.before && !opts.before()) return;
      var raw = tally.inputs.map(function (i) { return i.value.trim(); });
      if (raw.some(function (r) { return r === ''; })) {
        api.feedback('Write a number in every frequency box first.', 'try');
        return;
      }
      var vals = raw.map(function (r) { return U.parseNum(r); });
      if (vals.some(function (v) { return isNaN(v); })) {
        api.feedback('Use numbers only in the frequency boxes.', 'try');
        return;
      }
      var key = vals.join(',');
      if (key === last) {
        api.feedback('Change an answer before you check again.', 'try');
        return;
      }
      last = key;
      tally.clearMarks();
      var wrong = [];
      vals.forEach(function (v, i) {
        if (v !== truth[i]) wrong.push(i);
      });
      if (!wrong.length) {
        tally.inputs.forEach(function (inp) {
          inp.classList.add('snc-good');
          inp.disabled = true;
        });
        btn.disabled = true;
        api.check(true, opts.praise || 'Every frequency matches its tally!');
        if (opts.after) opts.after();
        return;
      }
      wrong.forEach(function (i) { tally.inputs[i].classList.add('snc-bad'); });
      var tags = wrong.map(function (i) { return freqTag(vals[i], truth[i]); });
      var gi = tags.indexOf('Tally marks miscounted (gate of 5)');
      var f = wrong[gi >= 0 ? gi : 0];
      var tag = tags[gi >= 0 ? gi : 0];
      var name = opts.cats[f].name;
      var more = wrong.length > 1 ? ' (' + wrong.length + ' boxes are orange.)' : '';
      var hint;
      if (api.tries() === 0) {
        if (tag === 'Tally marks miscounted (gate of 5)') hint = 'Look at the ' + name + ' row. Each gate (4 lines with one across) is 5, not 4.' + more;
        else hint = 'Count the ' + name + ' tally again: count the gates in 5s, then add the single lines.' + more;
      } else {
        tally.work(f);
        tally.mark(f, 'snc-hi');
        hint = 'Count along the ' + name + ' row: ' + alongText(truth[f]) + '.' + more;
      }
      api.check(false, hint, tag);
    }
    btn.addEventListener('click', check);
    var wn = 0;
    return {
      el: btn,
      check: check,
      reveal: function () {
        btn.disabled = true;
        tally.clearMarks();
        tally.inputs.forEach(function (inp, i) {
          inp.value = String(truth[i]);
          inp.disabled = true;
          inp.classList.add('snc-good');
          tally.work(i);
        });
        var w = 'Count each gate as 5, then add the single lines: ' + opts.cats.map(function (c, i) { return c.name + ' ' + truth[i]; }).join(', ') + '.';
        api.feedback(w, 'info');
        if (opts.after) opts.after();
      },
      solve: function () {
        tally.inputs.forEach(function (inp, i) { inp.value = String(truth[i]); });
        check();
      },
      wrong: function () {
        var k = wn % truth.length;
        tally.inputs.forEach(function (inp, i) { inp.value = String(truth[i]); });
        tally.inputs[k].value = String(truth[k] + 1 + Math.floor(wn / truth.length));
        wn++;
        check();
      },
    };
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  function l1Freq() {
    for (;;) {
      var v = [];
      for (var i = 0; i < 4; i++) v.push(U.rand(1, 12));
      var big = v.filter(function (x) { return x >= 5; }).length;
      if (big >= 2 && Math.max.apply(null, v) >= 10 && new Set(v).size >= 3) return v;
    }
  }
  function l1Most() {
    for (;;) {
      var v = [];
      for (var i = 0; i < 4; i++) v.push(U.rand(2, 12));
      var srt = v.slice().sort(function (a, b) { return b - a; });
      // one clear winner, a close second, and gates needed to tell them apart
      if (srt[0] > srt[1] && srt[0] - srt[1] <= 2 && srt[0] >= 7) return v;
    }
  }
  function l1Spot() {
    var v = l1Freq();
    var cand = [];
    v.forEach(function (x, i) { if (x >= 5) cand.push(i); });
    var k = U.pick(cand);
    var g = gates(v[k]);
    var opts = [v[k] - g, v[k] + 1, v[k] - 1].filter(function (x) { return x >= 1 && x !== v[k]; });
    return { counts: v, wrongIdx: k, shown: U.pick(opts) };
  }
  function buildDeck() {
    var ctx = U.shuffle(CTX1.slice());
    var deck = [];
    deck.push({ type: 'freq', ctx: ctx[0], counts: l1Freq() });
    deck.push({ type: 'most', ctx: ctx[1], counts: l1Most() });
    var sp = l1Spot();
    deck.push({ type: 'spot', variant: U.pick(['freq', 'chart']), ctx: ctx[2], counts: sp.counts, wrongIdx: sp.wrongIdx, shown: sp.shown });
    deck.push({ type: 'spin' });
    deck.push({ type: 'again', run1: randomCounts(20, 5), who: U.pick(['Kai', 'Mia', 'Omar', 'Lily']) });
    var sv = U.pick(SURVEYS);
    var k = sv.cats.length;
    var sc = splitCounts(10, k, 1, 6, function (c) { return Math.max.apply(null, c) >= 5; });
    var ans = [];
    sc.forEach(function (n, i) { for (var j = 0; j < n; j++) ans.push(i); });
    deck.push({ type: 'survey', ctx: sv, answers: U.shuffle(ans), names: U.shuffle(NAMES.slice()).slice(0, 10) });
    deck.push({ type: 'dice', ask: U.pick(['sevens', 'most']) });
    var pc = splitCounts(20, 4, 2, 9, function (c) { return Math.max.apply(null, c) >= 6 && maxIdx(c).length === 1; });
    var pa = [];
    pc.forEach(function (n, i) { for (var j = 0; j < n; j++) pa.push(i); });
    deck.push({ type: 'picnic', ctx: PICNIC, answers: U.shuffle(pa) });
    return deck;
  }

  /* Questions computed from experiment data (pure, exposed for tests) */
  function spinQuestion(counts) {
    var a = U.rand(0, 4);
    var pairs = [];
    for (var i = 0; i < 5; i++) for (var j = 0; j < 5; j++) if (counts[i] > counts[j]) pairs.push([i, j]);
    if (pairs.length) {
      var p = U.pick(pairs);
      return { a: a, ansA: counts[a], b: p[0], c: p[1], kind: 'more', ansB: counts[p[0]] - counts[p[1]] };
    }
    return { a: a, ansA: counts[a], b: 0, c: 1, kind: 'total', ansB: counts[0] + counts[1] };
  }
  function againQuestion(r1, r2) {
    var changed = [], same = [];
    r1.forEach(function (v, i) { (v === r2[i] ? same : changed).push(i); });
    var i = changed.length && (!same.length || Math.random() < 0.8) ? U.pick(changed) : U.pick(same);
    var ans = r2[i] === r1[i] ? 'same' : r2[i] > r1[i] ? 'up' : 'down';
    return { i: i, ans: ans };
  }
  function diceQuestion(ask, counts) {
    // counts[t] for totals 0..12 (2..12 used)
    var totals = U.range(2, 12);
    var c = totals.map(function (t) { return counts[t]; });
    var mi = maxIdx(c);
    if (ask === 'most' && mi.length === 1) {
      var best = totals[mi[0]];
      var others = U.shuffle(totals.filter(function (t) { return t !== best && counts[t] > 0; }));
      if (others.length < 3) others = others.concat(U.shuffle(totals.filter(function (t) { return t !== best && counts[t] === 0; })));
      var opts = [best].concat(others.slice(0, 3)).sort(function (a, b) { return a - b; });
      return { kind: 'most', ans: best, options: opts };
    }
    var t = 7;
    if (ask === 'most') {
      // tie for most: ask about one total instead (choose one with a gate if possible)
      var big = totals.filter(function (x) { return counts[x] >= 5; });
      t = big.length ? U.pick(big) : 7;
    }
    return { kind: 'count', total: t, ans: counts[t] };
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */
  var learnData = null; // spinner results from learn screen 2, reused on screen 3

  function learnSteps(stage, api) {
    api.say('Statisticians answer questions with data. They follow four steps. Put the cards in order!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Four steps of an investigation', 'Click the cards in order: what do you do first?'));
    var slots = [], placed = [null, null, null, null];
    var slotRow = el('div', { class: 'snc-slots' });
    for (var i = 0; i < 4; i++) {
      var sl = el('div', { class: 'snc-slot' }, el('div', { class: 'snc-slotn' }, String(i + 1)));
      slots.push(sl);
      slotRow.appendChild(sl);
    }
    var tray = el('div', { class: 'snc-tray' });
    var cards = {};
    var finished = false;
    function cardEl(st) {
      var c = el('button', { class: 'snc-step', type: 'button' }, el('span', { class: 'snc-stepic' }, st.icon), el('b', null, st.title), el('span', { class: 'snc-steptx' }, st.text));
      c.addEventListener('click', function () {
        if (finished) return;
        MQ.sound('click');
        var at = placed.indexOf(st.id);
        if (at >= 0) {
          placed[at] = null;
          tray.appendChild(c);
          c.classList.remove('snc-bad');
          return;
        }
        var free = placed.indexOf(null);
        if (free < 0) return;
        placed[free] = st.id;
        slots[free].appendChild(c);
        if (placed.indexOf(null) < 0) verdict();
      });
      cards[st.id] = c;
      return c;
    }
    function verdict() {
      var bad = 0;
      placed.forEach(function (id, k) {
        var ok = id === STEPS[k].id;
        cards[id].classList.toggle('snc-bad', !ok);
        cards[id].classList.toggle('snc-good', ok);
        if (!ok) bad++;
      });
      if (!bad) {
        finished = true;
        api.sound('correct');
        api.say('Ask, collect, look, check. Now let\'s do a real investigation!', 'cheer');
        api.feedback('First we ask a question, then collect data, then look at it, and check it answers the question.', 'good');
        api.unlockNext();
      } else {
        api.sound('wrong');
        api.say('Nearly! Click an orange card to take it back.', 'think');
        api.feedback('You can\'t collect data until you know your question. You look at data after you collect it.', 'try');
      }
    }
    U.shuffle(STEPS.slice()).forEach(function (st) { tray.appendChild(cardEl(st)); });
    stage.appendChild(slotRow);
    stage.appendChild(tray);
  }

  function learnSpin(stage, api) {
    api.say('Our question: which colour will the spinner land on most? First, make a prediction!');
    api.lockNext();
    var prediction = null;
    var tally = tallyChart(SPIN, [0, 0, 0, 0, 0], { freq: 'show', head: 'Colour', compact: true });
    var sp = makeSpinner(api, SPIN);
    var predBox = el('div', { class: 'snc-pred' }, el('div', { class: 'snc-predq' }, 'I think this colour will win:'));
    var exp;
    var ch = MQ.ui.choices(SPIN.map(function (c, i) { return { label: '<span class="snc-sw" style="background:' + c.color + '"></span> ' + c.name, value: i }; }), function (v) {
      prediction = v;
      ch.buttons.forEach(function (b) { b.classList.toggle('snc-picked', b.value_ === v); });
      api.say('Good thinking! All five parts are the same size. Now spin 20 times.', 'happy');
      exp.refresh();
    }, { columns: 5 });
    ch.classList.add('snc-predch');
    predBox.appendChild(ch);
    exp = experiment(api, {
      total: 20,
      word: 'Spins',
      onceLabel: '🌀 Spin',
      restLabel: 'Spin the rest',
      ready: function () { return prediction !== null; },
      outcome: function () { return U.rand(0, 4); },
      animate: function (k, fast, cb) { sp.spin(k, fast, cb); },
      record: function (k) {
        tally.add(k);
        tally.clearMarks();
        tally.mark(k, 'snc-hi');
      },
      onDone: function () {
        tally.clearMarks();
        learnData = tally.counts.slice();
        var win = maxIdx(learnData);
        var names = win.map(function (i) { return SPIN[i].name; });
        ch.disable();
        var msg;
        if (prediction === null) prediction = win[0];
        if (win.indexOf(prediction) >= 0) msg = 'Your prediction came true: ' + names.join(' and ') + (win.length > 1 ? ' tied for most!' : ' won!');
        else msg = names.join(' and ') + (win.length > 1 ? ' tied for most' : ' won') + ' this time. A prediction is a good guess, and spinners can surprise us!';
        api.say(msg, 'cheer');
        api.feedback('The parts are equal, but the results are not equal. Each spin is a surprise. Frequencies: ' + SPIN.map(function (c, i) { return c.name + ' ' + learnData[i]; }).join(', ') + '.', 'info');
        api.unlockNext();
      },
    });
    stage.appendChild(predBox);
    stage.appendChild(row(col('snc-left', sp.el, exp.el), tally.el));
    MQ.__test = { finish: function () { if (prediction === null) ch.buttons[0].click(); exp.finishNow(); } };
  }

  function learnGraph(stage, api) {
    if (!learnData) learnData = randomCounts(20, 5);
    var data = learnData;
    api.say('Now show your results as a graph. Which one will you choose?');
    api.lockNext();
    var tally = tallyChart(SPIN, data, { freq: 'show', head: 'Colour', compact: true });
    var gbox = el('div', { class: 'snc-gbox' }, txt('Pick a graph and watch the tally turn into it.'));
    var why = el('div', { class: 'snc-why' });
    var chosen = null;
    var REASONS = {
      bar: ['The bars are easy to compare', 'I can read the numbers on the scale', 'It looks neat with lots of data'],
      picto: ['Each picture is one spin, easy to count', 'Pictures are quick to see', 'It looks like the tally, one for one'],
    };
    function draw(kind) {
      MQ.clear(gbox);
      if (kind === 'bar') gbox.appendChild(barChart(SPIN, data, { title: '20 spins', grow: true }).el);
      else gbox.appendChild(pictogram(SPIN, data, { title: '20 spins', keyText: '1 spin' }).el);
    }
    var pick = MQ.ui.choices([{ label: '📊 Bar chart', value: 'bar' }, { label: '🟢 Pictogram', value: 'picto' }], function (v) {
      chosen = v;
      pick.buttons.forEach(function (b) { b.classList.toggle('snc-picked', b.value_ === v); });
      draw(v);
      MQ.clear(why);
      why.appendChild(el('div', { class: 'snc-predq' }, 'Why did you choose it?'));
      var rc = MQ.ui.choices(REASONS[v], function (r) {
        rc.mark(r, 'good');
        rc.disable();
        api.sound('correct');
        api.say('Good reason! Both graphs show the same numbers as the tally.', 'cheer');
        api.feedback('Both are fine. A graph is a picture of the tally: each bar or row matches its frequency.', 'good');
        api.unlockNext();
      }, { columns: 1 });
      rc.classList.add('snc-reasons');
      why.appendChild(rc);
      api.say('Bolt asks: why did you choose the ' + (v === 'bar' ? 'bar chart' : 'pictogram') + '?', 'think');
    }, { columns: 2 });
    pick.classList.add('snc-pick2');
    stage.appendChild(row(col('snc-left', tally.el, pick, why), gbox));
    MQ.__test = { finish: function () { if (!chosen) pick.buttons[0].click(); why.querySelector('.choice').click(); } };
  }

  /* ------------------------------------------------------------------ *
   * Practice renderers
   * ------------------------------------------------------------------ */
  function renderFreq(stage, api, q) {
    api.say('Count each tally. Remember: a gate is 5!', 'think');
    stage.appendChild(MQ.ui.prompt('<b>' + q.ctx.title + '</b>: write the frequency for each row.'));
    var fc;
    var tally = tallyChart(q.ctx.cats, q.counts, { freq: 'input', head: q.ctx.head, onEnter: function () { fc.check(); } });
    fc = freqCheck(api, tally, q.counts, { cats: q.ctx.cats });
    stage.appendChild(tally.el);
    stage.appendChild(fc.el);
    api.onReveal(fc.reveal);
    MQ.__test = { solve: fc.solve, wrong: fc.wrong };
  }

  function renderMost(stage, api, q) {
    api.say('Look at the tallies carefully. Gates count as 5.', 'think');
    stage.appendChild(MQ.ui.prompt('<b>' + q.ctx.title + '</b>. ' + q.ctx.most));
    var tally = tallyChart(q.ctx.cats, q.counts, { freq: 'hide', head: q.ctx.head });
    var best = maxIdx(q.counts)[0];
    var tried = {};
    var ch = MQ.ui.choices(q.ctx.cats.map(function (c, i) { return { label: c.icon + ' ' + c.name, value: i }; }), function (v) {
      if (api.isAnswered()) return;
      if (tried[v]) {
        api.feedback('You already tried ' + q.ctx.cats[v].name + '. Pick another one.', 'try');
        return;
      }
      if (v === best) {
        ch.mark(v, 'good');
        ch.disable();
        tally.showAll();
        tally.mark(best, 'snc-good');
        api.check(true, q.ctx.cats[best].name + ' has ' + q.counts[best] + '. That is the most!');
        return;
      }
      tried[v] = true;
      ch.mark(v, 'bad');
      var hint;
      if (api.tries() === 0) hint = 'Count both tallies: ' + q.ctx.cats[v].name + ' and the others. Count each gate as 5, then the single lines.';
      else {
        tally.work(v);
        tally.setFreqText(v, q.counts[v]);
        hint = q.ctx.cats[v].name + ' is ' + alongText(q.counts[v]) + ', so it has ' + q.counts[v] + '. Is there a row with more?';
      }
      api.check(false, hint, q.counts[v] >= 5 || q.counts[best] >= 5 ? 'Tally marks miscounted (gate of 5)' : 'Compared the tallies wrongly');
    }, { columns: 4 });
    stage.appendChild(tally.el);
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.disable();
      ch.mark(best, 'good');
      q.counts.forEach(function (n, i) { tally.work(i); });
      tally.showAll();
      tally.mark(best, 'snc-good');
      api.feedback('Count in 5s for each gate, then 1s: ' + q.ctx.cats.map(function (c, i) { return c.name + ' ' + q.counts[i]; }).join(', ') + '. ' + q.ctx.cats[best].name + ' has the most.', 'info');
    });
    var wn = 0;
    MQ.__test = {
      solve: function () { ch.buttons[best].click(); },
      wrong: function () {
        var others = [0, 1, 2, 3].filter(function (i) { return i !== best; });
        ch.buttons[others[wn++ % 3]].click();
      },
    };
  }

  function renderSpot(stage, api, q) {
    var isChart = q.variant === 'chart';
    api.say(isChart ? 'Bolt drew a bar chart from this tally, but one bar is wrong. Can you find it?' : 'One frequency does not match its tally. Can you find it?', 'think');
    stage.appendChild(MQ.ui.prompt('<b>' + q.ctx.title + '</b>. Which ' + (isChart ? 'bar' : 'frequency') + ' does <b>not</b> match the tally?'));
    var tally = tallyChart(q.ctx.cats, q.counts, { freq: isChart ? 'hide' : 'show', head: q.ctx.head, compact: true });
    var shownCounts = q.counts.slice();
    shownCounts[q.wrongIdx] = q.shown;
    var chart = null;
    if (isChart) {
      chart = barChart(q.ctx.cats, shownCounts, { colors: ['#5aa9e6', '#7cc6a4', '#f7b267', '#b39ddb'], min: 12 });
      stage.appendChild(row(tally.el, chart.el));
    } else {
      tally.setFreqText(q.wrongIdx, q.shown);
      stage.appendChild(tally.el);
    }
    var tag = isChart ? 'Chart does not match the tally' : 'Frequency does not match tally';
    var tried = {};
    var w = q.wrongIdx;
    function fix() {
      tally.work(w);
      tally.mark(w, 'snc-good');
      if (isChart) {
        chart.setBar(w, q.counts[w], 'snc-bgood');
        tally.showAll();
      } else tally.setFreqText(w, q.counts[w], 'snc-fixed');
    }
    var ch = MQ.ui.choices(q.ctx.cats.map(function (c, i) { return { label: c.icon + ' ' + c.name, value: i }; }), function (v) {
      if (api.isAnswered()) return;
      if (tried[v]) {
        api.feedback('You already checked ' + q.ctx.cats[v].name + '. Try another row.', 'try');
        return;
      }
      if (v === w) {
        ch.mark(v, 'good');
        ch.disable();
        fix();
        api.check(true, 'Yes! The tally shows ' + q.counts[w] + ', not ' + q.shown + '. Now it is fixed.');
        return;
      }
      tried[v] = true;
      ch.mark(v, 'bad');
      tally.work(v);
      if (isChart) chart.markBar(v, 'snc-bgood');
      var hint;
      if (api.tries() === 0) hint = q.ctx.cats[v].name + ' matches: the tally is ' + alongText(q.counts[v]) + ', so ' + q.counts[v] + '. Check another row.';
      else hint = q.ctx.cats[v].name + ' is fine. Count each of the other tallies in 5s and 1s and compare with the ' + (isChart ? 'top of its bar.' : 'number next to it.');
      api.check(false, hint, tag);
    }, { columns: 4 });
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.disable();
      ch.mark(w, 'good');
      if (isChart) chart.markBar(w, 'snc-bbad');
      api.later(fix, 600);
      api.feedback('The ' + q.ctx.cats[w].name + ' tally is ' + alongText(q.counts[w]) + ', so it is ' + q.counts[w] + '. The ' + (isChart ? 'bar showed ' : 'frequency said ') + q.shown + '.', 'info');
    });
    var wn = 0;
    MQ.__test = {
      solve: function () { ch.buttons[w].click(); },
      wrong: function () {
        var others = [0, 1, 2, 3].filter(function (i) { return i !== w; });
        ch.buttons[others[wn++ % 3]].click();
      },
    };
  }

  /* Level 2: 20 spins, then how many / how many more */
  function renderSpin(stage, api) {
    api.say('Spin the spinner 20 times. The tally fills in as you go.', 'happy');
    stage.appendChild(MQ.ui.prompt('Spin <b>20</b> times, then answer from the tally chart.'));
    var tally = tallyChart(SPIN, [0, 0, 0, 0, 0], { freq: 'hide', head: 'Colour', compact: true });
    var sp = makeSpinner(api, SPIN);
    var qbox = el('div', { class: 'snc-qbox' });
    var qq = null, inA, inB, btn, last = null, wn = 0;
    var exp = experiment(api, {
      total: 20, word: 'Spins', onceLabel: '🌀 Spin', restLabel: 'Spin the rest',
      outcome: function () { return U.rand(0, 4); },
      animate: function (k, fast, cb) { sp.spin(k, fast, cb); },
      record: function (k) { tally.add(k); },
      onDone: ask,
    });
    function ask() {
      var c = tally.counts;
      qq = spinQuestion(c);
      api.say('20 spins done! Now read your tally chart.', 'think');
      inA = el('input', { class: 'snc-fin', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Answer 1' });
      inB = el('input', { class: 'snc-fin', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Answer 2' });
      [inA, inB].forEach(function (i) {
        i.addEventListener('keydown', function (e) { if (e.key === 'Enter') check(); });
      });
      btn = el('button', { class: 'btn btn-check', type: 'button', onclick: check }, 'Check');
      var q2 = qq.kind === 'more'
        ? 'How many more times did it land on ' + catLabel(SPIN[qq.b]) + ' than on ' + catLabel(SPIN[qq.c]) + '?'
        : 'How many times did it land on ' + catLabel(SPIN[qq.b]) + ' and ' + catLabel(SPIN[qq.c]) + ' altogether?';
      qbox.appendChild(el('div', { class: 'snc-qline' }, txt('1. How many times did it land on ' + catLabel(SPIN[qq.a]) + '?', 'snc-qt'), inA));
      qbox.appendChild(el('div', { class: 'snc-qline' }, txt('2. ' + q2, 'snc-qt'), inB));
      qbox.appendChild(btn);
      api.onReveal(reveal);
    }
    function check() {
      if (api.isAnswered() || !qq) return;
      var a = inA.value.trim(), b = inB.value.trim();
      if (a === '' || b === '') {
        api.feedback('Answer both questions first.', 'try');
        return;
      }
      var va = U.parseNum(a), vb = U.parseNum(b);
      if (isNaN(va) || isNaN(vb)) {
        api.feedback('Use numbers only.', 'try');
        return;
      }
      if (a + '|' + b === last) {
        api.feedback('Change an answer before you check again.', 'try');
        return;
      }
      last = a + '|' + b;
      var c = tally.counts;
      inA.classList.toggle('snc-bad', va !== qq.ansA);
      inB.classList.toggle('snc-bad', vb !== qq.ansB);
      if (va === qq.ansA && vb === qq.ansB) {
        inA.classList.add('snc-good');
        inB.classList.add('snc-good');
        inA.disabled = inB.disabled = btn.disabled = true;
        tally.showAll();
        api.check(true, 'Yes! You read the tally chart perfectly.');
        return;
      }
      var hint, tag;
      if (va !== qq.ansA) {
        tag = freqTag(va, qq.ansA);
        if (api.tries() === 0) hint = 'Question 1: count the ' + SPIN[qq.a].name + ' tally again. Each gate is 5.';
        else {
          tally.work(qq.a);
          tally.mark(qq.a, 'snc-hi');
          hint = 'Question 1: count along the ' + SPIN[qq.a].name + ' row: ' + alongText(qq.ansA) + '.';
        }
      } else {
        var B = c[qq.b], Cc = c[qq.c];
        if (qq.kind === 'more' && vb === B + Cc) tag = 'Added instead of finding how many more';
        else tag = 'Frequency does not match tally';
        if (api.tries() === 0) hint = qq.kind === 'more' ? 'Question 2: find both frequencies, then count on from the smaller one to the bigger one.' : 'Question 2: find both frequencies and add them.';
        else {
          tally.work(qq.b);
          tally.work(qq.c);
          tally.setFreqText(qq.b, B);
          tally.setFreqText(qq.c, Cc);
          hint = qq.kind === 'more' ? 'Question 2: ' + SPIN[qq.b].name + ' is ' + B + ' and ' + SPIN[qq.c].name + ' is ' + Cc + '. Count on from ' + Cc + ' to ' + B + '.' : 'Question 2: ' + B + ' + ' + Cc + ' = ?';
        }
      }
      api.check(false, hint, tag);
    }
    function reveal() {
      var c = tally.counts;
      inA.value = String(qq.ansA);
      inB.value = String(qq.ansB);
      inA.disabled = inB.disabled = btn.disabled = true;
      inA.classList.remove('snc-bad');
      inB.classList.remove('snc-bad');
      inA.classList.add('snc-good');
      inB.classList.add('snc-good');
      tally.showAll();
      [qq.a, qq.b, qq.c].forEach(function (i) { tally.work(i); });
      var w2 = qq.kind === 'more' ? c[qq.b] + ' − ' + c[qq.c] + ' = ' + qq.ansB : c[qq.b] + ' + ' + c[qq.c] + ' = ' + qq.ansB;
      api.feedback('1. ' + SPIN[qq.a].name + ': ' + alongText(qq.ansA) + ' → ' + qq.ansA + '.  2. ' + w2 + '.', 'info');
    }
    stage.appendChild(row(col('snc-left', sp.el, exp.el), col('', tally.el, qbox)));
    MQ.__test = {
      solve: function () {
        exp.finishNow();
        inA.value = String(qq.ansA);
        inB.value = String(qq.ansB);
        check();
      },
      wrong: function () {
        exp.finishNow();
        inA.value = String(qq.ansA);
        inB.value = String(qq.ansB + 1 + wn++);
        check();
      },
    };
  }

  /* Level 2: second run, compare */
  function renderAgain(stage, api, q) {
    api.say(q.who + ' spun this spinner 20 times. If you spin 20 times, will you get the same?', 'think');
    stage.appendChild(MQ.ui.prompt('Run 1 is ' + q.who + '\'s. You do <b>Run 2</b>. Same or different?'));
    var t2 = compareTable(SPIN, q.run1, q.who);
    var t1 = t2;
    var sp = makeSpinner(api, SPIN);
    var pred = null, qq = null, ch = null, tried = {}, wn = 0;
    var predBox = el('div', { class: 'snc-pred' }, el('div', { class: 'snc-predq' }, 'Predict: will Run 2 be the same as Run 1?'));
    var pc = MQ.ui.choices([{ label: 'The same', value: 'same' }, { label: 'Different', value: 'diff' }], function (v) {
      pred = v;
      pc.buttons.forEach(function (b) { b.classList.toggle('snc-picked', b.value_ === v); });
      pc.disable();
      api.say('Let\'s find out! Spin 20 times.', 'happy');
      exp.refresh();
    }, { columns: 2 });
    predBox.appendChild(pc);
    var qbox = el('div', { class: 'snc-qbox' });
    var exp = experiment(api, {
      total: 20, word: 'Spins', onceLabel: '🌀 Spin', restLabel: 'Spin the rest',
      ready: function () { return pred !== null; },
      outcome: function () { return U.rand(0, 4); },
      animate: function (k, fast, cb) { sp.spin(k, fast, cb); },
      record: function (k) { t2.add(k); },
      onDone: ask,
    });
    var ANS = { same: 'The same number', up: 'More in Run 2', down: 'Fewer in Run 2' };
    function ask() {
      var r2 = t2.counts;
      qq = againQuestion(q.run1, r2);
      var identical = q.run1.every(function (v, i) { return v === r2[i]; });
      api.say(identical ? 'Wow, exactly the same! That hardly ever happens.' : 'Different numbers this time. That is normal: results change each time.', 'cheer');
      qbox.appendChild(txt('Did ' + catLabel(SPIN[qq.i]) + ' get the same number both times?', 'snc-qt'));
      ch = MQ.ui.choices(['same', 'up', 'down'].map(function (k) { return { label: ANS[k], value: k }; }), pick, { columns: 3 });
      qbox.appendChild(ch);
      api.onReveal(reveal);
    }
    function pick(v) {
      if (api.isAnswered()) return;
      if (tried[v]) {
        api.feedback('You already tried that one. Pick another.', 'try');
        return;
      }
      var a = q.run1[qq.i], b = t2.counts[qq.i], nm = SPIN[qq.i].name;
      if (v === qq.ans) {
        ch.mark(v, 'good');
        ch.disable();
        t1.mark(qq.i, 'snc-good');
        t2.mark(qq.i, 'snc-good');
        api.check(true, nm + ': ' + a + ' in Run 1 and ' + b + ' in Run 2. ' + (a === b ? 'The same this time!' : 'Spins give different results each time.'));
        return;
      }
      tried[v] = true;
      ch.mark(v, 'bad');
      var tag = v === 'same' ? 'Expected equal results' : 'Compared the two runs wrongly';
      var hint;
      if (api.tries() === 0) hint = v === 'same' ? 'Spinners do not always give the same numbers. Look at the ' + nm + ' row in both charts.' : 'Find the ' + nm + ' frequency in Run 1, then in Run 2. Which is bigger?';
      else {
        t1.mark(qq.i, 'snc-hi');
        t2.mark(qq.i, 'snc-hi');
        hint = nm + ' got ' + a + ' in Run 1 and ' + b + ' in Run 2.';
      }
      api.check(false, hint, tag);
    }
    function reveal() {
      var a = q.run1[qq.i], b = t2.counts[qq.i];
      ch.disable();
      ch.mark(qq.ans, 'good');
      t1.mark(qq.i, 'snc-good');
      t2.mark(qq.i, 'snc-good');
      t1.work(qq.i);
      t2.work(qq.i);
      api.feedback(SPIN[qq.i].name + ': Run 1 = ' + a + ', Run 2 = ' + b + '. ' + (a === b ? 'The same.' : b > a ? b + ' is more than ' + a + '.' : b + ' is fewer than ' + a + '.'), 'info');
    }
    stage.appendChild(predBox);
    stage.appendChild(row(col('snc-left snc-left-sm', sp.el, exp.el), t2.el));
    stage.appendChild(qbox);
    var wrongs = function () { return ['same', 'up', 'down'].filter(function (k) { return k !== qq.ans; }); };
    MQ.__test = {
      solve: function () {
        if (pred === null) pc.buttons[1].click();
        exp.finishNow();
        ch.buttons.filter(function (b) { return b.value_ === qq.ans; })[0].click();
      },
      wrong: function () {
        if (pred === null) pc.buttons[1].click();
        exp.finishNow();
        var w = wrongs()[wn++ % 2];
        ch.buttons.filter(function (b) { return b.value_ === w; })[0].click();
      },
    };
  }

  /* Level 2: survey of 10, tally by clicking, frequencies, then pick a display */
  function renderSurvey(stage, api, q) {
    var ctx = q.ctx;
    var cur = 0;
    api.say('We asked 10 children: "' + ctx.ask + '" Click the right row for each answer.', 'happy');
    stage.appendChild(MQ.ui.prompt('<b>' + ctx.title + '</b>: tally each answer, then write the frequencies.'));
    var fc;
    var tally = tallyChart(ctx.cats, ctx.cats.map(function () { return 0; }), {
      freq: 'input', head: ctx.head, compact: true,
      onEnter: function () { fc.check(); },
      onRow: function (i) { place(i); },
    });
    var cards = el('div', { class: 'snc-cards' });
    var chips = q.answers.map(function (a, k) {
      var c = el('div', { class: 'snc-card' }, el('span', { class: 'snc-cn' }, q.names[k] + ':'), el('span', null, ctx.cats[a].icon + ' ' + ctx.cats[a].name));
      cards.appendChild(c);
      return c;
    });
    function highlight() {
      chips.forEach(function (c, k) {
        c.classList.toggle('snc-now', k === cur);
        c.classList.toggle('snc-done', k < cur);
      });
    }
    function place(i) {
      if (cur >= q.answers.length || api.isAnswered()) return;
      var a = q.answers[cur];
      if (i !== a) {
        api.feedback(q.names[cur] + ' said ' + ctx.cats[a].name + '. Click the ' + ctx.cats[a].name + ' row.', 'try');
        return;
      }
      MQ.sound('pop');
      tally.add(i);
      cur++;
      highlight();
      if (cur >= q.answers.length) {
        api.say('All 10 answers are in the tally. Now write the frequencies.', 'think');
        api.feedback('Count each tally (a gate is 5) and write the frequency.', 'info');
        if (tally.inputs[0]) tally.inputs[0].focus();
      }
    }
    var truth = countsOf(q.answers, ctx.cats.length);
    var display = el('div', { class: 'snc-display' });
    function offerDisplay() {
      MQ.clear(display);
      display.appendChild(el('div', { class: 'snc-predq' }, 'How would you show this data?'));
      var gb = el('div', { class: 'snc-gbox' });
      var dc = MQ.ui.choices([{ label: '📊 Bar chart', value: 'bar' }, { label: '🙂 Pictogram', value: 'picto' }], function (v) {
        dc.buttons.forEach(function (b) { b.classList.toggle('snc-picked', b.value_ === v); });
        MQ.clear(gb);
        gb.appendChild(v === 'bar' ? barChart(ctx.cats, truth, { title: ctx.title, colors: ['#5aa9e6', '#7cc6a4', '#f7b267', '#b39ddb'], grow: true }).el : pictogram(ctx.cats, truth, { title: ctx.title, keyText: '1 child' }).el);
        api.say(v === 'bar' ? 'A bar chart makes it easy to compare. Good choice!' : 'A pictogram is quick to read. Good choice!', 'cheer');
      }, { columns: 2 });
      dc.classList.add('snc-pick2');
      display.appendChild(dc);
      display.appendChild(gb);
    }
    fc = freqCheck(api, tally, truth, {
      cats: ctx.cats,
      praise: 'Your frequencies match your tally. Now choose a graph!',
      before: function () {
        if (cur < q.answers.length) {
          api.feedback('Tally all 10 answers first. Click the row for ' + q.names[cur] + '\'s answer.', 'try');
          return false;
        }
        return true;
      },
      after: offerDisplay,
    });
    highlight();
    stage.appendChild(row(cards, col('', tally.el, fc.el)));
    stage.appendChild(display);
    api.onReveal(function () {
      while (cur < q.answers.length) {
        tally.add(q.answers[cur]);
        cur++;
      }
      highlight();
      fc.reveal();
    });
    function fillAll() {
      while (cur < q.answers.length) place(q.answers[cur]);
    }
    MQ.__test = {
      solve: function () { fillAll(); fc.solve(); },
      wrong: function () { fillAll(); fc.wrong(); },
    };
  }

  /* Level 3: two dice, 20 throws, totals 2..12 */
  var PRED7 = [{ label: '0 or 1', lo: 0, hi: 1 }, { label: '2 or 3', lo: 2, hi: 3 }, { label: '4 or 5', lo: 4, hi: 5 }, { label: '6 or more', lo: 6, hi: 20 }];
  function sevensGrid() {
    var s = svg('svg', { class: 'snc-grid36', viewBox: '0 0 236 236', role: 'img', 'aria-label': '36 ways two dice can land' });
    var cell = 30, o = 26;
    for (var i = 1; i <= 6; i++) {
      s.appendChild(svg('text', { x: o + (i - 1) * cell + cell / 2, y: 18, 'text-anchor': 'middle', class: 'snc-g36h', fill: '#e63946' }, String(i)));
      s.appendChild(svg('text', { x: 12, y: o + (i - 1) * cell + cell / 2 + 5, 'text-anchor': 'middle', class: 'snc-g36h', fill: '#3a86ff' }, String(i)));
    }
    for (var a = 1; a <= 6; a++) {
      for (var b = 1; b <= 6; b++) {
        var t = a + b;
        var x = o + (b - 1) * cell, y = o + (a - 1) * cell;
        s.appendChild(svg('rect', { x: x, y: y, width: cell - 2, height: cell - 2, rx: 5, class: 'snc-g36' + (t === 7 ? ' snc-g7' : t === 2 ? ' snc-g2' : '') }));
        s.appendChild(svg('text', { x: x + cell / 2 - 1, y: y + cell / 2 + 4, 'text-anchor': 'middle', class: 'snc-g36t' }, String(t)));
      }
    }
    return el('div', { class: 'snc-why7' }, s, txt('<b class="snc-k7">7</b> can be made <b>6 ways</b>.<br><b class="snc-k2">2</b> can be made only <b>1 way</b> (1 + 1).<br>So 7 usually comes up more, but not every time!'));
  }
  function renderDice(stage, api, q) {
    api.say('Throw two dice and add them. How many 7s will you get in 20 throws? Make a guess!', 'think');
    stage.appendChild(MQ.ui.prompt('Predict, then throw two dice <b>20</b> times.'));
    var TOT = U.range(2, 12).map(function (t) { return { name: String(t), icon: '' }; });
    var tally = tallyChart(TOT, U.range(2, 12).map(function () { return 0; }), { freq: 'hide', head: 'Total', compact: true });
    tally.el.classList.add('snc-dicetally');
    var counts = [];
    for (var z = 0; z <= 12; z++) counts.push(0);
    var dice = makeDice(api);
    var pred = null, qq = null, wn = 0, tried = {}, last = null;
    var predBox = el('div', { class: 'snc-pred' }, el('div', { class: 'snc-predq' }, 'How many 7s in 20 throws?'));
    var pc = MQ.ui.choices(PRED7.map(function (p, i) { return { label: p.label, value: i }; }), function (v) {
      pred = v;
      pc.buttons.forEach(function (b) { b.classList.toggle('snc-picked', b.value_ === v); });
      pc.disable();
      api.say('Good guess! Now throw.', 'happy');
      exp.refresh();
    }, { columns: 4 });
    pc.classList.add('snc-predch');
    predBox.appendChild(pc);
    var qbox = el('div', { class: 'snc-qbox' });
    var after = el('div', { class: 'snc-after' });
    var exp = experiment(api, {
      total: 20, word: 'Throws', onceLabel: '🎲 Throw', restLabel: 'Throw the rest',
      ready: function () { return pred !== null; },
      outcome: function () { return [U.rand(1, 6), U.rand(1, 6)]; },
      animate: function (o, fast, cb) { dice.roll(o[0], o[1], fast, cb); },
      show: function (o) { dice.show(o[0], o[1]); },
      record: function (o) {
        var t = o[0] + o[1];
        counts[t]++;
        tally.add(t - 2);
      },
      onDone: ask,
    });
    var input = null, ch = null, btn = null;
    function ask() {
      var s7 = counts[7];
      var p = PRED7[pred === null ? 1 : pred];
      var close = s7 >= p.lo - 1 && s7 <= p.hi + 1;
      api.say('You guessed ' + p.label + ' sevens. ' + (s7 >= p.lo && s7 <= p.hi ? 'Your prediction was spot on!' : close ? 'That was close!' : 'Dice can surprise us. That is why we test!'), 'cheer');
      qq = diceQuestion(q.ask, counts);
      if (qq.kind === 'most') {
        qbox.appendChild(txt('Which total came up the <b>most</b>?', 'snc-qt'));
        ch = MQ.ui.choices(qq.options.map(function (t) { return { label: String(t), value: t }; }), pickMost, { columns: 4 });
        qbox.appendChild(ch);
      } else {
        qbox.appendChild(txt('How many times did you get a total of <b>' + qq.total + '</b>?', 'snc-qt'));
        input = MQ.ui.numberInput({ onSubmit: function (n, raw) { checkCount(n, raw); } });
        qbox.appendChild(input.el);
        input.focus();
      }
      api.onReveal(reveal);
    }
    function row7(t) {
      return t - 2;
    }
    function showWhy() {
      MQ.clear(after);
      after.appendChild(sevensGrid());
    }
    function pickMost(v) {
      if (api.isAnswered()) return;
      if (tried[v]) {
        api.feedback('You already tried ' + v + '. Pick another total.', 'try');
        return;
      }
      if (v === qq.ans) {
        ch.mark(v, 'good');
        ch.disable();
        tally.showAll();
        tally.mark(row7(v), 'snc-good');
        api.check(true, v + ' came up ' + times(counts[v]) + '. That is the most!');
        showWhy();
        return;
      }
      tried[v] = true;
      ch.mark(v, 'bad');
      var hint;
      if (api.tries() === 0) hint = 'Count the tally for ' + v + ' and for the other totals. Each gate is 5.';
      else {
        tally.work(row7(v));
        tally.setFreqText(row7(v), counts[v]);
        hint = v + ' came up ' + times(counts[v]) + '. Find a longer tally.';
      }
      api.check(false, hint, counts[v] >= 5 || counts[qq.ans] >= 5 ? 'Tally marks miscounted (gate of 5)' : 'Compared the tallies wrongly');
    }
    function checkCount(n, raw) {
      if (api.isAnswered()) return;
      if (String(raw).trim() === last) {
        api.feedback('Change your answer before you check again.', 'try');
        return;
      }
      last = String(raw).trim();
      if (n === qq.ans) {
        input.disable();
        input.input.classList.add('good');
        tally.showFreq(row7(qq.total));
        tally.mark(row7(qq.total), 'snc-good');
        api.check(true, 'Yes! ' + qq.total + ' came up ' + times(qq.ans) + '.');
        showWhy();
        return;
      }
      input.input.classList.add('bad');
      var hint;
      if (api.tries() === 0) hint = 'Find the row for ' + qq.total + ' and count its tally. ' + (qq.ans >= 5 ? 'Each gate is 5.' : 'Count each line.');
      else {
        tally.work(row7(qq.total));
        tally.mark(row7(qq.total), 'snc-hi');
        hint = 'Count along the ' + qq.total + ' row: ' + alongText(qq.ans) + '.';
      }
      api.check(false, hint, freqTag(n, qq.ans));
    }
    function reveal() {
      if (qq.kind === 'most') {
        ch.disable();
        ch.mark(qq.ans, 'good');
        qq.options.forEach(function (t) { tally.work(row7(t)); tally.setFreqText(row7(t), counts[t]); });
        tally.mark(row7(qq.ans), 'snc-good');
        api.feedback('Totals: ' + qq.options.map(function (t) { return t + ' came up ' + counts[t]; }).join(', ') + '. ' + qq.ans + ' came up the most.', 'info');
      } else {
        input.setValue ? input.setValue(qq.ans) : (input.input.value = String(qq.ans));
        input.disable();
        input.input.classList.remove('bad');
        tally.work(row7(qq.total));
        tally.showFreq(row7(qq.total));
        tally.mark(row7(qq.total), 'snc-good');
        api.feedback('The ' + qq.total + ' row: ' + alongText(qq.ans) + ', so ' + qq.total + ' came up ' + times(qq.ans) + '.', 'info');
      }
      showWhy();
    }
    stage.appendChild(row(col('snc-left', predBox, dice.el, exp.el, qbox), tally.el, after));
    MQ.__test = {
      solve: function () {
        if (pred === null) pc.buttons[1].click();
        exp.finishNow();
        if (qq.kind === 'most') ch.buttons.filter(function (b) { return b.value_ === qq.ans; })[0].click();
        else {
          input.input.value = String(qq.ans);
          checkCount(qq.ans, String(qq.ans));
        }
      },
      wrong: function () {
        if (pred === null) pc.buttons[1].click();
        exp.finishNow();
        if (qq.kind === 'most') {
          var ws = qq.options.filter(function (t) { return t !== qq.ans; });
          var w = ws[wn++ % ws.length];
          ch.buttons.filter(function (b) { return b.value_ === w; })[0].click();
        } else {
          var v = qq.ans + 1 + wn++;
          input.input.value = String(v);
          checkCount(v, String(v));
        }
      },
    };
  }

  /* Level 3: picnic survey of 20 */
  function renderPicnic(stage, api, q) {
    var ctx = q.ctx;
    api.say('20 children chose what to take on the picnic. Click each answer to tally it.', 'happy');
    stage.appendChild(MQ.ui.prompt('<b>' + ctx.title + '</b>: tally all 20 answers, then write the frequencies.'));
    var fc;
    var tally = tallyChart(ctx.cats, [0, 0, 0, 0], { freq: 'input', head: ctx.head, compact: true, onEnter: function () { fc.check(); } });
    var truth = countsOf(q.answers, 4);
    var left = q.answers.length;
    var cards = el('div', { class: 'snc-cards snc-cards20' });
    var chips = q.answers.map(function (a) {
      var c = el('button', { class: 'snc-card snc-pcard', type: 'button', title: ctx.cats[a].name }, ctx.cats[a].icon);
      c.addEventListener('click', function () { take(c, a); });
      cards.appendChild(c);
      return c;
    });
    var totalLine = el('div', { class: 'snc-note' });
    function updTotal() {
      var vals = tally.inputs.map(function (i) { return U.parseNum(i.value); });
      totalLine.innerHTML = vals.every(function (v) { return !isNaN(v); }) ? 'Check: ' + vals.join(' + ') + ' = <b>' + sum(vals) + '</b>' + (sum(vals) === 20 ? ' ✓' : ' (should be 20)') : 'Tip: the frequencies should add up to 20.';
    }
    tally.inputs.forEach(function (i) { i.addEventListener('input', updTotal); });
    function take(c, a) {
      if (c.disabled || api.isAnswered()) return;
      c.disabled = true;
      c.classList.add('snc-done');
      MQ.sound('pop');
      tally.add(a);
      left--;
      if (!left) {
        api.say('All 20 tallied! Count each row in 5s and 1s.', 'think');
        if (tally.inputs[0]) tally.inputs[0].focus();
      }
    }
    fc = freqCheck(api, tally, truth, {
      cats: ctx.cats,
      praise: 'All four frequencies are right, and they add up to 20!',
      before: function () {
        if (left > 0) {
          api.feedback('Click every picture to tally it first (' + left + ' left).', 'try');
          return false;
        }
        return true;
      },
      after: updTotal,
    });
    updTotal();
    var legend = el('div', { class: 'snc-legend' }, ctx.cats.map(function (c) { return c.icon + ' ' + c.name; }).join(' · '));
    stage.appendChild(row(col('', cards, legend), col('', tally.el, totalLine, fc.el)));
    api.onReveal(function () {
      chips.forEach(function (c, k) {
        if (!c.disabled) take(c, q.answers[k]);
      });
      fc.reveal();
    });
    function fillAll() {
      chips.forEach(function (c, k) {
        if (!c.disabled) take(c, q.answers[k]);
      });
    }
    MQ.__test = {
      solve: function () { fillAll(); fc.solve(); },
      wrong: function () { fillAll(); fc.wrong(); },
    };
  }

  /* ------------------------------------------------------------------ */
  var deck = null;
  MQ.register(ID, {
    learn: [learnSteps, learnSpin, learnGraph],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        MQ.__test = null;
        if (q.type === 'freq') renderFreq(stage, api, q);
        else if (q.type === 'most') renderMost(stage, api, q);
        else if (q.type === 'spot') renderSpot(stage, api, q);
        else if (q.type === 'spin') renderSpin(stage, api, q);
        else if (q.type === 'again') renderAgain(stage, api, q);
        else if (q.type === 'survey') renderSurvey(stage, api, q);
        else if (q.type === 'dice') renderDice(stage, api, q);
        else renderPicnic(stage, api, q);
      },
    },
  });
  // for automated deck checks
  MQ.__sncBuildDeck = buildDeck;
  MQ.__snc = { spinQuestion: spinQuestion, againQuestion: againQuestion, diceQuestion: diceQuestion, freqTag: freqTag };

  var css = [
    '.snc-row{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;align-items:flex-start;width:100%}',
    '.snc-col{display:flex;flex-direction:column;gap:10px;align-items:center;min-width:0;max-width:100%}',
    '.snc-left{flex:0 1 260px}',
    '.snc-note{font-weight:700;color:var(--ink-soft);text-align:center}',
    '.snc-tallybox{max-width:100%;overflow-x:auto}',
    '.snc-tally{border-collapse:separate;border-spacing:0;background:#fff;border:2px solid var(--line);border-radius:14px;overflow:hidden;font-size:1.1rem}',
    '.snc-tally caption{font-weight:800;color:var(--ink-soft);padding-bottom:4px}',
    '.snc-tally th{background:var(--paper-2);padding:6px 12px;font-size:.95rem;text-align:left}',
    '.snc-tally td{padding:6px 12px;border-top:1px solid var(--paper-2);vertical-align:middle}',
    '.snc-compact td{padding:3px 10px}',
    '.snc-compact th{padding:4px 10px}',
    '.snc-cat{font-weight:800;white-space:nowrap}',
    '.snc-mcell{min-width:150px}',
    '.snc-marks{min-height:28px;display:flex;align-items:center}',
    '.snc-tsvg{display:block}',
    '.snc-mk{stroke:#1b2a4a;stroke-width:3;stroke-linecap:round}',
    '.snc-diag{stroke:#c2410c}',
    '.snc-fresh{animation:snc-draw .35s ease-out}',
    '@keyframes snc-draw{from{stroke:var(--accent);stroke-width:6}to{}}',
    '.snc-freq{text-align:center;min-width:76px;font-weight:800;font-size:1.25rem}',
    '.snc-fv.snc-fixed{color:var(--good)}',
    '.snc-fin{width:64px;height:42px;font:inherit;font-size:1.3rem;font-weight:800;text-align:center;border-radius:10px;border:3px solid var(--line);color:var(--ink)}',
    '.snc-fin:focus{outline:none;border-color:var(--accent)}',
    '.snc-fin.snc-good{border-color:var(--good);background:var(--good-bg)}',
    '.snc-fin.snc-bad{border-color:var(--try);background:var(--try-bg)}',
    '.snc-tally tr.snc-good td{background:var(--good-bg)}',
    '.snc-tally tr.snc-bad td{background:var(--try-bg)}',
    '.snc-tally tr.snc-hi td{background:#fff3cd}',
    '.snc-tally tr.snc-click{cursor:pointer}',
    '.snc-tally tr.snc-click:hover td{background:#e2f7f4}',
    '.snc-work:empty{display:none}',
    '.snc-along{display:flex;gap:3px;flex-wrap:wrap;margin-top:3px}',
    '.snc-ch{font-size:.8rem;font-weight:800;padding:1px 6px;border-radius:8px;background:var(--info-bg);border:1.5px solid var(--line)}',
    '.snc-ch5{background:#fff3cd;border-color:var(--gold)}',
    '.snc-sw{display:inline-block;width:16px;height:16px;border-radius:4px;vertical-align:-2px;border:1.5px solid rgba(0,0,0,.25)}',
    '.snc-catn{white-space:nowrap}',
    /* steps */
    '.snc-slots{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;width:100%;max-width:860px}',
    '.snc-slot{min-height:150px;border:3px dashed var(--line);border-radius:16px;position:relative;display:flex;padding:6px;background:var(--paper)}',
    '.snc-slotn{position:absolute;top:-14px;left:-10px;width:30px;height:30px;border-radius:50%;background:var(--accent);color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center}',
    '.snc-tray{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;min-height:150px;width:100%;max-width:860px}',
    '.snc-step{font:inherit;flex:1 1 160px;max-width:200px;display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px;border-radius:14px;border:3px solid var(--line);background:#fff;color:var(--ink);cursor:pointer;text-align:center}',
    '.snc-slot .snc-step{max-width:none;width:100%}',
    '.snc-step:hover{border-color:var(--accent)}',
    '.snc-step b{font-size:1.2rem}',
    '.snc-stepic{font-size:1.8rem}',
    '.snc-steptx{font-size:.92rem;color:var(--ink-soft);font-weight:700}',
    '.snc-step.snc-good{border-color:var(--good);background:var(--good-bg)}',
    '.snc-step.snc-bad{border-color:var(--try);background:var(--try-bg)}',
    /* spinner, dice, experiment */
    '.snc-spinbox{width:190px;max-width:100%}',
    '.snc-spinner{display:block;width:100%;height:auto}',
    '.snc-wheel{transform-origin:100px 100px}',
    '.snc-dicebox{display:flex;flex-direction:column;align-items:center}',
    '.snc-dice{width:170px;height:auto;display:block}',
    '.snc-shake{animation:snc-shake .2s linear infinite}',
    '@keyframes snc-shake{0%{transform:rotate(-4deg)}50%{transform:rotate(4deg)}100%{transform:rotate(-4deg)}}',
    '.snc-dtotal{font-weight:800;font-size:1.3rem;min-height:1.6em}',
    '.snc-exp{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.snc-expbtns{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.snc-counter{font-weight:700;color:var(--ink-soft)}',
    '.snc-counter b{color:var(--ink);font-size:1.2rem}',
    '.snc-pred{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;max-width:640px}',
    '.snc-predq{font-weight:800;font-size:1.1rem}',
    '.snc-pred .choice,.snc-pick2 .choice,.snc-qbox .choice{min-height:46px;font-size:1.05rem;padding:6px 10px}',
    '.choice.snc-picked{border-color:var(--accent);background:#e2f7f4}',
    '.snc-reasons .choice{min-height:44px;font-size:1rem;text-align:left}',
    '.snc-why{width:100%;max-width:300px}',
    '.snc-why:empty{display:none}',
    '.snc-pick2{max-width:380px}',
    '.snc-qbox{display:flex;flex-direction:column;gap:8px;align-items:center;max-width:460px}',
    '.snc-qbox:empty{display:none}',
    '.snc-qline{display:flex;align-items:center;gap:10px;justify-content:space-between;width:100%}',
    '.snc-qt{font-weight:800;font-size:1.1rem}',
    /* graphs */
    '.snc-gbox{flex:1 1 380px;max-width:480px;min-width:0;display:flex;justify-content:center}',
    '.snc-gbox:empty{display:none}',
    '.snc-chartbox{flex:1 1 360px;max-width:480px;min-width:0}',
    '.snc-bars{display:block;width:100%;height:auto}',
    '.snc-gl{stroke:#d5ddf0;stroke-width:1.5}',
    '.snc-axis{stroke:var(--ink);stroke-width:3;stroke-linecap:round}',
    '.snc-gnum{font-size:14px;font-weight:800;fill:var(--ink)}',
    '.snc-gcat{font-size:14px;font-weight:700;fill:var(--ink)}',
    '.snc-gic{font-size:18px}',
    '.snc-gtitle{font-size:17px;font-weight:800;fill:var(--ink)}',
    '.snc-bar{stroke:#1b2a4a;stroke-width:2}',
    '.snc-bar.snc-bbad{stroke:var(--try);stroke-width:4}',
    '.snc-bar.snc-bgood{stroke:var(--good);stroke-width:4}',
    '.snc-grow{transform-box:fill-box;transform-origin:bottom;animation:snc-grow .6s ease-out both}',
    '@keyframes snc-grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}',
    '.snc-picto{background:#fff;border:2px solid var(--line);border-radius:14px;padding:10px 14px;display:flex;flex-direction:column;gap:4px}',
    '.snc-ptitle{font-weight:800;text-align:center}',
    '.snc-prow{display:flex;align-items:center;gap:8px;min-height:30px}',
    '.snc-plab{width:120px;font-weight:800;flex:none}',
    '.snc-pics{display:flex;gap:4px}',
    '.snc-dot{width:22px;height:22px;border-radius:50%;border:1.5px solid rgba(0,0,0,.3);flex:none;animation:snc-pop .3s ease-out both}',
    '.snc-pic{width:24px;text-align:center;font-size:20px;line-height:26px;flex:none;animation:snc-pop .3s ease-out both}',
    '.snc-key .snc-dot,.snc-key .snc-pic{display:inline-block;vertical-align:middle;animation:none}',
    '@keyframes snc-pop{from{transform:scale(0)}to{transform:scale(1)}}',
    '.snc-key{font-weight:800;color:var(--ink-soft);margin-top:4px}',
    /* surveys */
    '.snc-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;flex:0 1 330px}',
    '.snc-card{background:#fff;border:2px solid var(--line);border-radius:10px;padding:5px 8px;font-weight:700;font-size:.98rem;display:flex;gap:5px;flex-wrap:wrap}',
    '.snc-cn{color:var(--ink-soft)}',
    '.snc-card.snc-now{border-color:var(--accent);background:#e2f7f4;box-shadow:0 0 0 3px rgba(46,196,182,.3)}',
    '.snc-card.snc-done{opacity:.4}',
    '.snc-cards20{grid-template-columns:repeat(5,minmax(0,1fr));flex:0 1 300px}',
    '.snc-pcard{font:inherit;font-size:1.8rem;justify-content:center;cursor:pointer;padding:4px}',
    '.snc-pcard:hover:not(:disabled){border-color:var(--accent)}',
    '.snc-pcard:disabled{cursor:default}',
    '.snc-legend{max-width:300px;font-weight:700;color:var(--ink-soft);text-align:center}',
    '.snc-display{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.snc-display:empty{display:none}',
    /* dice extras */
    '.snc-dicetally .snc-mcell{min-width:120px}',
    '.snc-dicetally td{padding:1px 10px}',
    '.snc-dicetally .snc-tsvg{height:22px;width:auto}',
    '.snc-dicetally .snc-marks{min-height:22px}',
    '.snc-dicetally .snc-freq{font-size:1.1rem}',
    '.snc-cmp .snc-mcell{min-width:96px}',
    '.snc-cmp .snc-freq{min-width:54px}',
    '.snc-left-sm{flex:0 1 200px}',
    '.snc-left-sm .snc-spinbox{width:160px}',
    '.snc-cards20{width:290px;flex:none}',
    '.snc-after:empty{display:none}',
    '.snc-why7{display:flex;flex-direction:column;align-items:center;gap:6px;max-width:250px}',
    '.snc-grid36{width:220px;height:auto}',
    '.snc-g36{fill:#f2f5fc;stroke:#c9d3ee}',
    '.snc-g7{fill:#ffe08a;stroke:#e0a800}',
    '.snc-g2{fill:#b9f0d4;stroke:#1f9d6b}',
    '.snc-g36t{font-size:12px;font-weight:700;fill:var(--ink)}',
    '.snc-g36h{font-size:13px;font-weight:800}',
    '.snc-k7{background:#ffe08a;padding:0 5px;border-radius:5px}',
    '.snc-k2{background:#b9f0d4;padding:0 5px;border-radius:5px}',
    '@media (max-width:820px){.snc-slots{grid-template-columns:repeat(2,minmax(0,1fr))}.snc-left{flex:1 1 100%}.snc-tally{font-size:1rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

/* Unit 6 Challenge — same fence, different gardens, then a mixed review of Unit 6.
 * Every question here is self-contained (no calls into other activity files).
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  function repeated(n, times) {
    var a = [];
    for (var i = 0; i < times; i++) a.push(n);
    return a;
  }
  function plural(n, word) {
    return n + ' ' + word + (n === 1 ? '' : 's');
  }

  /** A garden on a grid: L squares long, W squares wide, green fill and a fence outline. */
  function gardenSvg(L, W, opts) {
    opts = opts || {};
    var cell = opts.cell || 16;
    var cols = opts.cols || L;
    var rows = opts.rows || W;
    var g = MQ.ui.grid({ cols: cols, rows: rows, cell: cell, pad: opts.pad == null ? 26 : opts.pad, className: 'mc-grid' });
    var x0 = g.x(0);
    var y0 = g.y(0);
    var grass = svg('g');
    for (var r = 0; r < W; r++) for (var c = 0; c < L; c++) grass.appendChild(svg('rect', { x: g.x(c), y: g.y(r), width: cell, height: cell, class: 'mc-grass' }));
    g.under.appendChild(grass);
    var fence = svg('rect', { x: x0, y: y0, width: L * cell, height: W * cell, class: 'mc-fence' });
    g.layer.appendChild(fence);
    if (opts.labels !== false) {
      // widen the picture to the left so the width label (e.g. "10 m") is not cut off
      var extra = 34;
      g.svg.setAttribute('viewBox', -extra + ' 0 ' + (g.width + extra) + ' ' + g.height);
      g.svg.setAttribute('width', g.width + extra);
      g.layer.appendChild(svg('text', { x: x0 + (L * cell) / 2, y: y0 - 8, 'text-anchor': 'middle', class: 'mc-dim' }, L + (opts.unit ? ' ' + opts.unit : '')));
      g.layer.appendChild(svg('text', { x: x0 - 8, y: y0 + (W * cell) / 2 + 6, 'text-anchor': 'end', class: 'mc-dim' }, W + (opts.unit ? ' ' + opts.unit : '')));
    }
    return g;
  }

  /* ---------------------------------------------------------------- *
   * Question data
   * ---------------------------------------------------------------- */
  var UNIT_ITEMS = [
    { name: 'the length of a crayon', icon: '🖍️', unit: 'cm', why: 'A crayon fits in your hand' },
    { name: 'the length of a key', icon: '🔑', unit: 'cm', why: 'A key is tiny' },
    { name: 'the length of a spoon', icon: '🥄', unit: 'cm', why: 'A spoon fits in your hand' },
    { name: 'the height of a door', icon: '🚪', unit: 'm', why: 'A door is taller than you, but not a journey' },
    { name: 'the length of a school field', icon: '⚽', unit: 'm', why: 'You can run across a school field' },
    { name: 'the length of a classroom', icon: '🏫', unit: 'm', why: 'You can walk across a classroom in a few steps' },
    { name: 'the distance to another city', icon: '🏙️', unit: 'km', why: 'Going to another city is a long journey' },
    { name: 'a car trip to the seaside', icon: '🚗', unit: 'km', why: 'A long car trip is a long distance' },
    { name: 'the drive to the airport', icon: '✈️', unit: 'km', why: 'You need a car to get to the airport' },
  ];
  var UNIT_NAMES = { cm: 'centimetres', m: 'metres', km: 'kilometres' };

  // Grid shapes made of whole squares and half-squares (two halves = one whole).
  // whole: [c, r]; half: [c, r, corner] where corner is where the right angle sits.
  var HALF_SHAPES = [
    { cols: 7, rows: 3, whole: [[1, 1], [2, 1], [3, 1], [4, 1], [5, 1]], half: [[0, 1, 'br'], [6, 1, 'bl']] }, // 5 + 2 halves = 6
    { cols: 6, rows: 4, whole: [[1, 2], [2, 2], [3, 2], [4, 2], [2, 1], [3, 1]], half: [[1, 1, 'br'], [4, 1, 'bl']] }, // 6 + 2 halves = 7
    { cols: 4, rows: 5, whole: [[1, 2], [2, 2], [1, 3], [2, 3]], half: [[1, 1, 'br'], [2, 1, 'bl']] }, // 4 + 2 halves = 5
    { cols: 7, rows: 4, whole: [[2, 1], [3, 1], [4, 1], [2, 2], [3, 2], [4, 2]], half: [[1, 1, 'br'], [1, 2, 'tr'], [5, 1, 'bl'], [5, 2, 'tl']] }, // 6 + 4 halves = 8
  ];

  var deck = null;

  function buildDeck() {
    var conv = U.pick([2, 3, 4, 5, 6]);
    var rStart = U.pick([3, 4, 5, 6]);
    var rLen = U.rand(5, 8);
    var unitItem = U.pick(UNIT_ITEMS);
    var round = U.pick([275, 263, 248, 317, 186, 342, 225, 154]);
    var rect = U.pick([
      [6, 4],
      [7, 3],
      [8, 5],
      [5, 3],
      [9, 2],
    ]);
    var shape = U.pick(['rectangle', 'hexagon', 'square', 'rectangle', 'hexagon']);
    var half = U.pick(HALF_SHAPES);
    var ap = U.pick([
      [4, 5],
      [3, 5],
      [4, 3],
      [5, 2],
    ]);
    return [
      { type: 'convert', m: conv },
      { type: 'ruler', start: rStart, len: rLen },
      { type: 'unit', item: unitItem },
      { type: 'round', n: round },
      { type: 'perim', L: rect[0], W: rect[1] },
      { type: 'regular', shape: shape },
      { type: 'halves', shape: half },
      { type: 'areaper', r: ap[0], c: ap[1], ask: U.pick(['area', 'perimeter']) },
      { type: 'square', area: U.pick([16, 25, 36]) },
      { type: 'garden' },
    ];
  }

  /* ---------------------------------------------------------------- *
   * Practice question renderers (each is self-contained)
   * ---------------------------------------------------------------- */
  var Q = {};

  Q.convert = function (stage, api, q) {
    var ans = q.m * 100;
    api.say('Remember: 1 metre is 100 centimetres.', 'think');
    stage.appendChild(MQ.ui.prompt('A shelf is <b>' + q.m + ' m</b> long. How many centimetres is that?'));
    var row = el('div', { class: 'mc-sticks' });
    for (var i = 0; i < q.m; i++) row.appendChild(el('div', { class: 'mc-stick' }, '1 m'));
    stage.appendChild(row);
    var work = el('div', { class: 'mc-work' });
    var box = MQ.ui.numberInput({
      prefix: q.m + ' m =',
      unit: 'cm',
      onSubmit: function (n) {
        if (n === ans) {
          box.good();
          box.disable();
          show();
          api.check(true, 'Yes! ' + q.m + ' lots of 100 cm = ' + ans + ' cm.');
          return;
        }
        box.bad();
        var hint;
        var tag;
        if (n === q.m * 10) {
          hint = '1 m is 100 cm, not 10 cm. Each metre stick is 100 cm.';
          tag = 'Used 10 instead of 100 (m to cm)';
        } else if (n === q.m * 1000) {
          hint = '1000 is for kilometres to metres. 1 m = 100 cm.';
          tag = 'Used 1000 instead of 100 (m to cm)';
        } else if (n === q.m) {
          hint = 'That is the number of metres. Each metre is 100 cm.';
          tag = 'Did not convert metres to cm';
        } else {
          hint = 'Each metre stick is 100 cm. Count in hundreds.';
          tag = 'Converted metres to cm wrongly';
        }
        if (api.tries() >= 1) hint += ' ' + repeated(100, q.m).join(' + ') + ' = ?';
        api.check(false, hint, tag);
      },
    });
    stage.appendChild(box.el);
    stage.appendChild(work);
    box.focus();
    function show() {
      Array.prototype.forEach.call(row.children, function (s) {
        s.textContent = '100 cm';
        s.classList.add('mc-stick-on');
      });
      MQ.clear(work);
      work.appendChild(MQ.ui.sum(repeated(100, q.m), ans, 'cm'));
    }
    api.onReveal(function () {
      box.setValue(String(ans));
      box.good();
      box.disable();
      show();
      api.feedback('Each metre is 100 cm: ' + repeated(100, q.m).join(' + ') + ' = ' + ans + ' cm.', 'info');
    });
  };

  Q.ruler = function (stage, api, q) {
    var s = q.start;
    var e = q.start + q.len;
    var cmPx = 44;
    api.say('Careful! This ruler is broken. It does not start at 0.', 'think');
    stage.appendChild(MQ.ui.prompt('How long is the crayon?'));
    var ruler = MQ.ui.ruler({ from: s - 1, to: e + 1, cm: cmPx, broken: true });
    var W = ruler.width + 20;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' 170', width: W, height: 170, style: { maxWidth: '100%', height: 'auto' } });
    ruler.moveTo(10, 70);
    var x1 = 10 + ruler.xOf(s);
    var x2 = 10 + ruler.xOf(e);
    // crayon from s to e, drawn to scale
    var tip = 26;
    var crayon = svg(
      'g',
      { class: 'mc-crayon' },
      svg('rect', { x: x1, y: 32, width: x2 - x1 - tip, height: 28, rx: 4, class: 'mc-crayon-body' }),
      svg('rect', { x: x1 + 14, y: 32, width: 22, height: 28, class: 'mc-crayon-band' }),
      svg('polygon', { points: [x2 - tip, 32, x2, 46, x2 - tip, 60].join(' '), class: 'mc-crayon-tip' })
    );
    root.appendChild(crayon);
    root.appendChild(svg('line', { x1: x1, y1: 28, x2: x1, y2: 92, class: 'mc-guide' }));
    root.appendChild(svg('line', { x1: x2, y1: 28, x2: x2, y2: 92, class: 'mc-guide' }));
    root.appendChild(ruler.g);
    var hops = svg('g');
    root.appendChild(hops);
    stage.appendChild(el('div', { class: 'mc-pic' }, root));
    var work = el('div', { class: 'mc-work' });
    var box = MQ.ui.numberInput({
      unit: 'cm',
      onSubmit: function (n) {
        if (n === q.len) {
          box.good();
          box.disable();
          show();
          api.check(true, 'Yes! ' + e + ' − ' + s + ' = ' + q.len + ' cm.');
          return;
        }
        box.bad();
        var hint;
        var tag;
        if (n === e) {
          hint = 'The crayon starts at ' + s + ', not 0. Count the centimetres from ' + s + ' to ' + e + '.';
          tag = 'Read the end number instead of end − start';
        } else if (n === q.len + 1) {
          hint = 'Count the spaces between the numbers, not the marks.';
          tag = 'Counted the marks instead of the spaces';
        } else {
          hint = 'Count the jumps from ' + s + ' to ' + e + '.';
          tag = 'Misread a broken ruler';
        }
        if (api.tries() >= 1) hint += ' Or work out ' + e + ' − ' + s + '.';
        api.check(false, hint, tag);
      },
    });
    stage.appendChild(box.el);
    stage.appendChild(work);
    box.focus();
    function show() {
      MQ.clear(hops);
      for (var i = 0; i < q.len; i++) {
        var a = 10 + ruler.xOf(s + i);
        var b = 10 + ruler.xOf(s + i + 1);
        hops.appendChild(svg('path', { d: 'M' + a + ' 128 Q ' + (a + b) / 2 + ' 160 ' + b + ' 128', class: 'mc-hop' }));
        hops.appendChild(svg('text', { x: (a + b) / 2, y: 166, 'text-anchor': 'middle', class: 'mc-hop-n' }, String(i + 1)));
      }
      MQ.clear(work);
      work.appendChild(el('div', { class: 'mc-eq' }, e + ' − ' + s + ' = ' + q.len + ' cm'));
    }
    api.onReveal(function () {
      box.setValue(String(q.len));
      box.good();
      box.disable();
      show();
      api.feedback('The crayon starts at ' + s + ' and ends at ' + e + ': ' + q.len + ' jumps of 1 cm.', 'info');
    });
  };

  Q.unit = function (stage, api, q) {
    var it = q.item;
    api.say('Which unit would you use to measure this?', 'think');
    stage.appendChild(MQ.ui.prompt('Which unit would you use to measure it?'));
    stage.appendChild(el('div', { class: 'mc-item' }, el('span', { class: 'mc-item-icon' }, it.icon), el('span', null, it.name)));
    var ch = MQ.ui.choices(
      ['cm', 'm', 'km'].map(function (k) {
        return { label: UNIT_NAMES[k] + ' (' + k + ')', value: k };
      }),
      function (v) {
        if (v === it.unit) {
          ch.mark(v, 'good');
          ch.disable();
          api.check(true, it.why + ', so we use ' + UNIT_NAMES[it.unit] + '!');
          return;
        }
        ch.mark(v, 'bad');
        var small = { cm: 0, m: 1, km: 2 };
        var tag = small[v] < small[it.unit] ? 'Chose a unit that is too small' : 'Chose a unit that is too big';
        var hint = small[v] < small[it.unit] ? 'That unit is too small. You would need a huge number!' : 'That unit is too big for this.';
        if (api.tries() >= 1) hint = it.why + '. cm = hand size, m = room size, km = journeys.';
        api.check(false, hint, tag);
      },
      { columns: 3 }
    );
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(it.unit, 'good');
      ch.disable();
      api.feedback(it.why + ', so we use ' + UNIT_NAMES[it.unit] + '.', 'info');
    });
  };

  Q.round = function (stage, api, q) {
    var n = q.n;
    var lo = Math.floor(n / 10) * 10;
    var hi = lo + 10;
    var ones = n - lo;
    var ans = ones >= 5 ? hi : lo;
    api.say('Which ten is it closer to?', 'think');
    stage.appendChild(MQ.ui.prompt('A rug is <b>' + n + ' cm</b> long.<br>Round it to the nearest 10 cm.'));
    var W = 560;
    var xOf = function (v) {
      return 40 + ((v - lo) / 10) * (W - 80);
    };
    var root = svg('svg', { viewBox: '0 0 ' + W + ' 120', width: W, height: 120, style: { maxWidth: '100%', height: 'auto' } });
    root.appendChild(svg('line', { x1: 30, y1: 70, x2: W - 30, y2: 70, class: 'mc-nl' }));
    for (var v = lo; v <= hi; v++) {
      var big = v === lo || v === hi;
      root.appendChild(svg('line', { x1: xOf(v), y1: big ? 54 : 62, x2: xOf(v), y2: big ? 86 : 78, class: 'mc-nl' + (v === lo + 5 ? ' mc-mid' : '') }));
      if (big) root.appendChild(svg('text', { x: xOf(v), y: 110, 'text-anchor': 'middle', class: 'mc-nl-n' }, v + ' cm'));
    }
    root.appendChild(svg('text', { x: xOf(lo + 5), y: 104, 'text-anchor': 'middle', class: 'mc-nl-mid' }, 'halfway'));
    root.appendChild(svg('circle', { cx: xOf(n), cy: 70, r: 9, class: 'mc-dot' }));
    root.appendChild(svg('text', { x: xOf(n), y: 40, 'text-anchor': 'middle', class: 'mc-nl-n mc-dot-n' }, String(n)));
    var arrow = svg('path', { d: '', class: 'mc-arrow' });
    root.appendChild(arrow);
    stage.appendChild(el('div', { class: 'mc-pic' }, root));
    var ch = MQ.ui.choices(
      [lo, hi].map(function (v) {
        return { label: v + ' cm', value: v };
      }),
      function (v) {
        if (v === ans) {
          ch.mark(v, 'good');
          ch.disable();
          show();
          api.check(true, 'Yes! ' + n + ' is closer to ' + ans + '.');
          return;
        }
        ch.mark(v, 'bad');
        var hint;
        var tag;
        if (ones === 5) {
          hint = n + ' is exactly halfway. When it is halfway, we round up.';
          tag = 'Rounded down when exactly halfway (5)';
        } else if (ones > 5) {
          hint = 'Look at the ones digit: ' + ones + '. That is past halfway, so round up.';
          tag = 'Rounded down when the ones digit was 5 or more';
        } else {
          hint = 'Look at the ones digit: ' + ones + '. That is before halfway, so round down.';
          tag = 'Rounded up when the ones digit was less than 5';
        }
        api.check(false, hint, tag);
      },
      { columns: 2 }
    );
    stage.appendChild(ch);
    function show() {
      var xa = xOf(n);
      var xb = xOf(ans);
      arrow.setAttribute('d', 'M' + xa + ' 60 Q ' + (xa + xb) / 2 + ' 18 ' + xb + ' 52');
    }
    api.onReveal(function () {
      ch.mark(ans, 'good');
      ch.disable();
      show();
      api.feedback('The ones digit is ' + ones + (ones >= 5 ? ' (5 or more), so round up' : ' (less than 5), so round down') + ': ' + n + ' → ' + ans + ' cm.', 'info');
    });
  };

  Q.perim = function (stage, api, q) {
    var L = q.L;
    var W = q.W;
    var P = 2 * (L + W);
    api.say('Opposite sides of a rectangle are the same length.', 'think');
    stage.appendChild(MQ.ui.prompt('A notice board is a rectangle. What is its <b>perimeter</b>?'));
    var px = 34;
    var w = L * px;
    var h = W * px;
    var S = 60;
    var root = svg('svg', { viewBox: '0 0 ' + (w + 2 * S) + ' ' + (h + 2 * S - 10), width: w + 2 * S, height: h + 2 * S - 10, style: { maxWidth: '100%', height: 'auto' } });
    root.appendChild(svg('rect', { x: S, y: S - 10, width: w, height: h, class: 'mc-board' }));
    root.appendChild(svg('text', { x: S + w / 2, y: S - 20, 'text-anchor': 'middle', class: 'mc-dim' }, L + ' cm'));
    root.appendChild(svg('text', { x: S + w + 10, y: S - 10 + h / 2 + 6, class: 'mc-dim' }, W + ' cm'));
    var hidden = svg(
      'g',
      { class: 'mc-hidden' },
      svg('text', { x: S + w / 2, y: S - 10 + h + 28, 'text-anchor': 'middle', class: 'mc-dim mc-dim-new' }, L + ' cm'),
      svg('text', { x: S - 10, y: S - 10 + h / 2 + 6, 'text-anchor': 'end', class: 'mc-dim mc-dim-new' }, W + ' cm')
    );
    root.appendChild(hidden);
    stage.appendChild(el('div', { class: 'mc-pic' }, root));
    var work = el('div', { class: 'mc-work' });
    var box = MQ.ui.numberInput({
      unit: 'cm',
      onSubmit: function (n) {
        if (n === P) {
          box.good();
          box.disable();
          show();
          api.check(true, 'Yes! ' + L + ' + ' + W + ' + ' + L + ' + ' + W + ' = ' + P + ' cm.');
          return;
        }
        box.bad();
        var hint;
        var tag;
        if (n === L + W) {
          hint = 'You added 2 sides. A rectangle has 4 sides. The other two match the ones you can see.';
          tag = 'Added only the two labelled sides';
        } else if (n === L * W) {
          hint = 'That is the area (the space inside). Perimeter is the distance all the way round.';
          tag = 'Found the area instead of the perimeter';
        } else {
          hint = 'Add all 4 sides. The bottom is the same as the top, the left is the same as the right.';
          tag = 'Added the sides of a rectangle wrongly';
        }
        if (api.tries() >= 1) hint += ' ' + L + ' + ' + W + ' + ' + L + ' + ' + W + ' = ?';
        api.check(false, hint, tag);
      },
    });
    stage.appendChild(box.el);
    stage.appendChild(work);
    box.focus();
    function show() {
      hidden.classList.remove('mc-hidden');
      MQ.clear(work);
      work.appendChild(MQ.ui.sum([L, W, L, W], P, 'cm'));
    }
    api.onReveal(function () {
      box.setValue(String(P));
      box.good();
      box.disable();
      show();
      api.feedback('Opposite sides match, so add all 4: ' + L + ' + ' + W + ' + ' + L + ' + ' + W + ' = ' + P + ' cm.', 'info');
    });
  };

  Q.regular = function (stage, api, q) {
    var shapes = {
      rectangle: { regular: false, name: 'rectangle', sides: [6, 3, 6, 3], unit: 'cm' },
      square: { regular: true, name: 'square', sides: [4, 4, 4, 4], unit: 'cm' },
      hexagon: { regular: true, name: 'hexagon', sides: [3, 3, 3, 3, 3, 3], unit: 'cm' },
    };
    var sh = shapes[q.shape];
    api.say('A regular shape has all its sides the same length and all its angles the same.', 'think');
    stage.appendChild(MQ.ui.prompt('Is this shape <b>regular</b> or <b>irregular</b>?'));
    var Wd = 340;
    var Ht = 240;
    var pts;
    var u = 40; // px per cm, drawn to scale
    if (q.shape === 'rectangle') pts = [[50, 60], [50 + 6 * u, 60], [50 + 6 * u, 60 + 3 * u], [50, 60 + 3 * u]];
    else if (q.shape === 'square') pts = [[90, 40], [90 + 4 * u, 40], [90 + 4 * u, 40 + 4 * u], [90, 40 + 4 * u]];
    else {
      pts = [];
      var R = 3 * u;
      for (var i = 0; i < 6; i++) {
        var a = (Math.PI / 3) * i;
        pts.push([Wd / 2 + R * Math.cos(a), Ht / 2 + R * Math.sin(a)]);
      }
    }
    // Fit the picture round the shape, with room for the side labels (the hexagon is taller than 240).
    var xs = pts.map(function (p) { return p[0]; });
    var ys = pts.map(function (p) { return p[1]; });
    var bx = Math.min.apply(null, xs) - 70;
    var by = Math.min.apply(null, ys) - 40;
    var bw = Math.max.apply(null, xs) + 70 - bx;
    var bh = Math.max.apply(null, ys) + 40 - by;
    var root = svg('svg', { viewBox: bx + ' ' + by + ' ' + bw + ' ' + bh, width: bw, height: bh, style: { maxWidth: '100%', height: 'auto' } });
    root.appendChild(svg('polygon', { points: pts.map(function (p) { return p.join(','); }).join(' '), class: 'mc-shape' }));
    var labels = svg('g', { class: 'mc-hidden' });
    var cx = pts.reduce(function (s, p) { return s + p[0]; }, 0) / pts.length;
    var cy = pts.reduce(function (s, p) { return s + p[1]; }, 0) / pts.length;
    pts.forEach(function (p, k) {
      var p2 = pts[(k + 1) % pts.length];
      var mx = (p[0] + p2[0]) / 2;
      var my = (p[1] + p2[1]) / 2;
      var dx = mx - cx;
      var dy = my - cy;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      var off = 22 + 16 * Math.abs(dx / d); // labels beside an upright side need more room
      labels.appendChild(svg('text', { x: mx + (dx / d) * off, y: my + (dy / d) * off + 6, 'text-anchor': 'middle', class: 'mc-dim mc-dim-new' }, sh.sides[k] + ' cm'));
    });
    root.appendChild(labels);
    stage.appendChild(el('div', { class: 'mc-pic' }, root));
    var ans = sh.regular ? 'regular' : 'irregular';
    var ch = MQ.ui.choices(['regular', 'irregular'], function (v) {
      if (v === ans) {
        ch.mark(v, 'good');
        ch.disable();
        labels.classList.remove('mc-hidden');
        api.check(true, sh.regular ? 'Yes! All the sides are equal and all the corners are the same. Regular!' : 'Yes! The sides are not all the same length, so it is irregular.');
        return;
      }
      ch.mark(v, 'bad');
      if (sh.regular) {
        api.check(false, api.tries() >= 1 ? 'Every side of this ' + sh.name + ' is the same length, and every corner is the same. That makes it regular.' : 'Look at the sides. Are they all the same length?', 'Thought a regular shape was irregular');
      } else {
        api.check(false, api.tries() >= 1 ? 'The long sides are 6 cm but the short sides are only 3 cm. Not all equal, so it is irregular.' : 'Are ALL the sides the same length? Compare a long side and a short side.', 'Thought a rectangle is regular');
      }
    });
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(ans, 'good');
      ch.disable();
      labels.classList.remove('mc-hidden');
      api.feedback(sh.regular ? 'All sides ' + sh.sides[0] + ' cm and all corners the same: regular.' : 'Sides 6 cm and 3 cm are not all the same: irregular.', 'info');
    });
  };

  Q.halves = function (stage, api, q) {
    var sh = q.shape;
    var nW = sh.whole.length;
    var nH = sh.half.length;
    var ans = nW + nH / 2;
    api.say('Two half-squares make one whole square.', 'think');
    stage.appendChild(MQ.ui.prompt('What is the <b>area</b> of this shape?'));
    var cell = 50;
    var g = MQ.ui.grid({ cols: sh.cols, rows: sh.rows, cell: cell, pad: 12, className: 'mc-grid' });
    sh.whole.forEach(function (w) {
      g.fill(w[0], w[1], 'mc-shape-fill');
    });
    var halfEls = sh.half.map(function (h) {
      return g.half(h[0], h[1], h[2], 'mc-shape-fill');
    });
    var marks = svg('g');
    g.layer.appendChild(marks);
    stage.appendChild(el('div', { class: 'mc-pic' }, g.svg));
    var work = el('div', { class: 'mc-work' });
    var box = MQ.ui.numberInput({
      unit: 'square units',
      half: true,
      onSubmit: function (n) {
        if (U.same(n, ans)) {
          box.good();
          box.disable();
          show();
          api.check(true, 'Yes! ' + nW + ' whole + ' + nH / 2 + ' more from the halves = ' + U.fmt(ans) + ' square units.');
          return;
        }
        box.bad();
        var hint;
        var tag;
        if (U.same(n, nW)) {
          hint = 'You counted the whole squares. Now pair up the half-squares: 2 halves = 1 whole.';
          tag = 'Left out the half-squares';
        } else if (U.same(n, nW + nH)) {
          hint = 'Each triangle is only half a square. 2 halves make 1 whole.';
          tag = 'Counted each half-square as a whole one';
        } else {
          hint = 'Count the whole squares first. Then pair up the halves.';
          tag = 'Miscounted a shape with half-squares';
        }
        if (api.tries() >= 1) hint += ' There are ' + nW + ' whole squares and ' + nH + ' halves.';
        api.check(false, hint, tag);
      },
    });
    stage.appendChild(box.el);
    stage.appendChild(work);
    box.focus();
    function show() {
      MQ.clear(marks);
      sh.whole.slice().sort(function (a, b) { return a[1] - b[1] || a[0] - b[0]; }).forEach(function (w, i) {
        marks.appendChild(svg('text', { x: g.x(w[0]) + cell / 2, y: g.y(w[1]) + cell / 2 + 8, 'text-anchor': 'middle', class: 'mc-num' }, String(i + 1)));
      });
      halfEls.forEach(function (p, i) {
        p.setAttribute('class', 'mc-half-' + (Math.floor(i / 2) % 2 ? 'b' : 'a'));
      });
      sh.half.forEach(function (h) {
        var off = { tl: [0.3, 0.35], tr: [0.7, 0.35], bl: [0.3, 0.8], br: [0.7, 0.8] }[h[2]];
        marks.appendChild(svg('text', { x: g.x(h[0]) + cell * off[0], y: g.y(h[1]) + cell * off[1] + 4, 'text-anchor': 'middle', class: 'mc-num mc-num-half' }, '½'));
      });
      MQ.clear(work);
      work.appendChild(el('div', { class: 'mc-eq' }, nW + ' whole' + repeated(' + (½ + ½)', nH / 2).join('') + ' = ' + U.fmt(ans) + ' square units'));
    }
    api.onReveal(function () {
      box.setValue(U.fmt(ans));
      box.good();
      box.disable();
      show();
      api.feedback(nW + ' whole squares, and ' + nH + ' halves make ' + nH / 2 + ' more: ' + U.fmt(ans) + ' square units.', 'info');
    });
  };

  Q.areaper = function (stage, api, q) {
    var R = q.r;
    var C = q.c;
    var area = R * C;
    var per = 2 * (R + C);
    var isArea = q.ask === 'area';
    var ans = isArea ? area : per;
    api.say(isArea ? 'Area is the space inside. Count the squares.' : 'Perimeter is the distance round the edge.', 'think');
    stage.appendChild(MQ.ui.prompt('What is the <span class="mc-key">' + (isArea ? 'area' : 'perimeter') + '</span> of this rectangle?'));
    var cell = 42;
    var g = MQ.ui.grid({ cols: C + 2, rows: R + 2, cell: cell, pad: 10, className: 'mc-grid' });
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) g.fill(c + 1, r + 1, 'mc-rect-fill');
    g.layer.appendChild(svg('rect', { x: g.x(1), y: g.y(1), width: C * cell, height: R * cell, class: 'mc-rect-edge' }));
    var marks = svg('g');
    g.layer.appendChild(marks);
    stage.appendChild(el('div', { class: 'mc-pic' }, g.svg));
    var work = el('div', { class: 'mc-work' });
    var box = MQ.ui.numberInput({
      unit: isArea ? 'square units' : 'units',
      onSubmit: function (n) {
        if (n === ans) {
          box.good();
          box.disable();
          show();
          api.check(true, isArea ? 'Yes! ' + R + ' rows of ' + C + ' = ' + area + ' square units.' : 'Yes! ' + C + ' + ' + R + ' + ' + C + ' + ' + R + ' = ' + per + ' units.');
          return;
        }
        box.bad();
        var hint;
        var tag;
        if (isArea && n === per) {
          hint = 'That is the perimeter (round the edge). The question asks for the AREA: the squares inside.';
          tag = 'Gave the perimeter when asked for the area';
        } else if (!isArea && n === area) {
          hint = 'That is the area (squares inside). The question asks for the PERIMETER: the distance round the edge.';
          tag = 'Gave the area when asked for the perimeter';
        } else if (!isArea && n === R + C) {
          hint = 'That is only 2 sides. Go all the way round: 4 sides.';
          tag = 'Added only two sides';
        } else {
          hint = isArea ? 'Count in rows: ' + C + ' in each row.' : 'Count the edges all the way round the outside.';
          tag = isArea ? 'Miscounted the area' : 'Miscounted the perimeter';
        }
        if (api.tries() >= 1) hint += isArea ? ' ' + repeated(C, R).join(' + ') + ' = ?' : ' ' + C + ' + ' + R + ' + ' + C + ' + ' + R + ' = ?';
        api.check(false, hint, tag);
      },
    });
    stage.appendChild(box.el);
    stage.appendChild(work);
    box.focus();
    function show() {
      MQ.clear(marks);
      MQ.clear(work);
      if (isArea) {
        for (var r2 = 0; r2 < R; r2++) marks.appendChild(svg('text', { x: g.x(C + 1) + 8, y: g.y(r2 + 1) + cell / 2 + 7, class: 'mc-num' }, String((r2 + 1) * C)));
        work.appendChild(MQ.ui.sum(repeated(C, R), area, 'square units'));
      } else {
        var k = 0;
        function lab(x, y) {
          k++;
          marks.appendChild(svg('text', { x: x, y: y, 'text-anchor': 'middle', class: 'mc-num mc-num-small' }, String(k)));
        }
        var c2;
        var r3;
        for (c2 = 0; c2 < C; c2++) lab(g.x(c2 + 1) + cell / 2, g.y(1) - 8);
        for (r3 = 0; r3 < R; r3++) lab(g.x(C + 1) + 14, g.y(r3 + 1) + cell / 2 + 6);
        for (c2 = C - 1; c2 >= 0; c2--) lab(g.x(c2 + 1) + cell / 2, g.y(R + 1) + 22);
        for (r3 = R - 1; r3 >= 0; r3--) lab(g.x(1) - 14, g.y(r3 + 1) + cell / 2 + 6);
        work.appendChild(MQ.ui.sum([C, R, C, R], per, 'units'));
      }
    }
    api.onReveal(function () {
      box.setValue(String(ans));
      box.good();
      box.disable();
      show();
      api.feedback(isArea ? 'Area: ' + R + ' rows of ' + C + ' = ' + area + ' square units.' : 'Perimeter: ' + C + ' + ' + R + ' + ' + C + ' + ' + R + ' = ' + per + ' units.', 'info');
    });
  };

  Q.square = function (stage, api, q) {
    var A = q.area;
    var s = Math.round(Math.sqrt(A));
    api.say('A square has the same number of rows and columns.', 'think');
    stage.appendChild(MQ.ui.prompt('A square tablecloth has an area of <b>' + A + ' square units</b>.<br>How long is each side?'));
    var tries = el('div', { class: 'mc-sq-row' });
    [2, 3, 4, 5, 6].forEach(function (n) {
      var cell = 10;
      var root = svg('svg', { viewBox: '0 0 ' + (n * cell + 4) + ' ' + (n * cell + 4), width: n * cell + 4, height: n * cell + 4 });
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) root.appendChild(svg('rect', { x: 2 + c * cell, y: 2 + r * cell, width: cell, height: cell, class: 'mc-mini' }));
      var card = el('div', { class: 'mc-sq-card', 'data-n': n }, root, el('div', null, n + ' × ' + n + ' = ' + n * n));
      tries.appendChild(card);
    });
    stage.appendChild(el('p', { class: 'mc-note' }, 'Some squares to help you:'));
    stage.appendChild(tries);
    var box = MQ.ui.numberInput({
      prefix: 'Each side =',
      unit: 'units',
      onSubmit: function (n) {
        if (n === s) {
          box.good();
          box.disable();
          highlight();
          api.check(true, 'Yes! ' + s + ' × ' + s + ' = ' + A + '.');
          return;
        }
        box.bad();
        var hint;
        var tag;
        if (Math.abs(n - A / 4) < 0.5 && Math.abs(A / 4 - s) >= 1) {
          hint = 'Dividing by 4 is perimeter thinking. Area is rows × columns: which number × itself makes ' + A + '?';
          tag = 'Divided the area by 4 (perimeter thinking)';
        } else if (n === A) {
          hint = A + ' is the area. We want one side.';
          tag = 'Gave the area instead of the side length';
        } else if (n > 0 && n < 10) {
          hint = n + ' × ' + n + ' = ' + n * n + (n * n < A ? '. Too small.' : '. Too big.') + ' Which helper square has ' + A + ' squares inside?';
          tag = 'Wrong side length for a square';
        } else {
          hint = 'Which square has ' + A + ' squares inside? Look at the helper squares.';
          tag = 'Wrong side length for a square';
        }
        api.check(false, hint, tag);
      },
    });
    stage.appendChild(box.el);
    box.focus();
    function highlight() {
      Array.prototype.forEach.call(tries.children, function (c) {
        if (Number(c.getAttribute('data-n')) === s) c.classList.add('mc-sq-on');
      });
    }
    api.onReveal(function () {
      box.setValue(String(s));
      box.good();
      box.disable();
      highlight();
      api.feedback(s + ' × ' + s + ' = ' + A + ', so each side is ' + s + ' units.', 'info');
    });
  };

  Q.garden = function (stage, api) {
    var opts = [
      [10, 2],
      [8, 4],
      [6, 6],
    ];
    api.say('All three gardens have 24 m of fence. Which one has the most space?', 'think');
    stage.appendChild(MQ.ui.prompt('Each garden has a <b>24 m</b> fence. Which garden has the <b>most space</b> inside?'));
    var labels = {};
    var ch = MQ.ui.choices(
      opts.map(function (o) {
        var g = gardenSvg(o[0], o[1], { cell: 15, cols: 10, rows: 6, pad: 22, unit: 'm' });
        var area = el('div', { class: 'mc-hidden mc-area-lab' }, o[0] + ' × ' + o[1] + ' = ' + o[0] * o[1] + ' square metres');
        labels[o[0]] = area;
        return { label: el('div', { class: 'mc-gcard' }, g.svg, el('div', { class: 'mc-gname' }, o[0] + ' m by ' + o[1] + ' m'), area), value: o[0] };
      }),
      function (v) {
        if (v === 6) {
          ch.mark(v, 'good');
          ch.disable();
          showAll();
          api.check(true, 'Yes! 6 × 6 = 36 square metres. The square garden has the most space!');
          return;
        }
        ch.mark(v, 'bad');
        labels[v].classList.remove('mc-hidden');
        var o = opts.filter(function (x) { return x[0] === v; })[0];
        var hint = 'That garden has ' + o[0] + ' × ' + o[1] + ' = ' + o[0] * o[1] + ' square metres. Is there a bigger one?';
        api.check(false, api.tries() >= 1 ? hint + ' Count the squares inside each garden.' : hint, v === 10 ? 'Thought the longest garden has the most space' : 'Chose a garden that is not the biggest');
      },
      { columns: 3 }
    );
    ch.classList.add('mc-garden-choices');
    stage.appendChild(ch);
    function showAll() {
      Object.keys(labels).forEach(function (k) {
        labels[k].classList.remove('mc-hidden');
      });
    }
    api.onReveal(function () {
      ch.mark(6, 'good');
      ch.disable();
      showAll();
      api.feedback('Same fence, different space: 2 × 10 = 20, 4 × 8 = 32, 6 × 6 = 36 square metres. The square wins!', 'info');
    });
  };

  /* ---------------------------------------------------------------- *
   * Activity
   * ---------------------------------------------------------------- */
  MQ.register('mission-challenge', {
    learn: [
      // 1. Garden fences
      function (stage, api) {
        api.say('Every garden gets 24 m of fence. Change the length. Which garden has the most room?');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Garden fences', 'The fence is always <b>24 m</b>. Make different gardens.'));
        var tried = {};
        var nTried = 0;
        var L = 2;
        var picHolder = el('div', { class: 'mc-pic' });
        var info = el('div', { class: 'mc-ginfo' });
        var lenVal = el('span', { class: 'mc-lenval' }, '');
        var slider = el('input', { type: 'range', min: 1, max: 11, step: 1, value: L, class: 'mc-slider', 'aria-label': 'Length of the garden' });
        var minus = el('button', { class: 'btn mc-step', type: 'button', 'aria-label': 'Shorter' }, '−');
        var plus = el('button', { class: 'btn mc-step', type: 'button', 'aria-label': 'Longer' }, '+');
        var controls = el('div', { class: 'mc-controls' }, el('span', { class: 'mc-ctl-name' }, 'Length'), minus, slider, plus, lenVal);
        var tbody = el('tbody');
        var table = el('table', { class: 'mc-table' }, el('thead', null, el('tr', null, el('th', null, 'Length'), el('th', null, 'Width'), el('th', null, 'Area (square metres)'))), tbody);
        var left = el('div', { class: 'mc-gleft' }, picHolder, controls);
        var right = el('div', { class: 'mc-gright' }, info, el('div', { class: 'mc-table-title' }, 'Gardens you made'), table);
        stage.appendChild(el('div', { class: 'mc-garden-lab' }, left, right));

        function update() {
          var W = 12 - L;
          var A = L * W;
          slider.value = L;
          lenVal.textContent = L + ' m';
          MQ.clear(picHolder);
          picHolder.appendChild(gardenSvg(L, W, { cell: 24, cols: 11, rows: 11, pad: 30, unit: 'm' }).svg);
          MQ.clear(info);
          info.appendChild(el('div', { class: 'mc-fenceline' }, 'Fence: ' + L + ' + ' + W + ' + ' + L + ' + ' + W + ' = 24 m'));
          info.appendChild(el('div', { class: 'mc-arealine' }, 'Area: ' + L + ' × ' + W + ' = ', el('b', null, A + ' square metres')));
          var key = String(L);
          if (!tried[key]) {
            tried[key] = { L: L, W: W, area: A };
            nTried++;
            redrawTable();
            api.sound('pop');
          }
          markRow(key);
          if (A === 36) {
            api.say('6 by 6 gives 36 square metres. The biggest! A square is a rectangle too.', 'cheer');
            api.feedback('The square garden (6 m by 6 m) has the most space: 36 square metres.', 'good');
          } else if (nTried >= 3) {
            api.say(A <= 20 ? 'Long and thin gives a small garden. Can you find the biggest?' : 'Getting bigger! Can you find the biggest garden?', 'think');
          }
          if (nTried >= 3) api.unlockNext();
          else api.feedback('Try ' + (3 - nTried) + ' more different ' + (3 - nTried === 1 ? 'garden' : 'gardens') + '.', 'info');
        }
        function redrawTable() {
          MQ.clear(tbody);
          var rows = Object.keys(tried).map(function (k) {
            return tried[k];
          });
          rows.sort(function (x, y) {
            return x.L - y.L;
          });
          var best = Math.max.apply(null, rows.map(function (r) { return r.area; }));
          rows.forEach(function (r) {
            var tr = el('tr', { 'data-key': String(r.L), class: r.area === best ? 'mc-best' : '' }, el('td', null, r.L + ' m'), el('td', null, r.W + ' m'), el('td', null, String(r.area)));
            tbody.appendChild(tr);
          });
        }
        function markRow(key) {
          Array.prototype.forEach.call(tbody.children, function (tr) {
            tr.classList.toggle('mc-now', tr.getAttribute('data-key') === key);
          });
        }
        function setL(v) {
          v = U.clamp(v, 1, 11);
          if (v === L) return;
          L = v;
          update();
        }
        slider.addEventListener('input', function () {
          setL(Number(slider.value));
        });
        minus.addEventListener('click', function () {
          setL(L - 1);
        });
        plus.addEventListener('click', function () {
          setL(L + 1);
        });
        update();
      },

      // 2. Same area, different fences
      function (stage, api) {
        api.say('These gardens all have 12 squares of grass. Do they need the same fence? Click each one.');
        stage.appendChild(MQ.ui.lesson('Same area, different fences', 'Each garden covers <b>12 square metres</b>.'));
        var list = [
          [12, 1],
          [6, 2],
          [4, 3],
        ];
        var seen = 0;
        var row = el('div', { class: 'mc-same-row' });
        list.forEach(function (o) {
          var L = o[0];
          var W = o[1];
          var P = 2 * (L + W);
          var g = gardenSvg(L, W, { cell: 16, cols: L, rows: 3, pad: 22, unit: 'm' });
          var fence = el('div', { class: 'mc-same-fence' }, 'Fence: ?');
          var card = el('button', { class: 'mc-same-card', type: 'button' }, g.svg, el('div', { class: 'mc-gname' }, L + ' × ' + W + ' = 12 square metres'), fence);
          card.addEventListener('click', function () {
            if (card.classList.contains('mc-open')) return;
            card.classList.add('mc-open');
            api.sound('pop');
            fence.textContent = 'Fence: ' + L + ' + ' + W + ' + ' + L + ' + ' + W + ' = ' + P + ' m';
            seen++;
            if (seen === 3) {
              api.say('Same grass, different fences! Long and thin needs the most fence.', 'cheer');
              api.feedback('12 square metres each, but the fences are 26 m, 16 m and 14 m.', 'good');
            }
          });
          row.appendChild(card);
        });
        stage.appendChild(row);
      },
    ],

    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        Q[q.type](stage, api, q);
      },
    },
  });

  var css = [
    '.mc-pic{display:flex;justify-content:center;max-width:100%}',
    '.mc-pic svg{max-width:100%;height:auto}',
    '.mc-work{display:flex;flex-direction:column;align-items:center;gap:6px;min-height:8px}',
    '.mc-eq{font-size:1.4rem;font-weight:800;color:#0b6e66;background:var(--good-bg);border-radius:12px;padding:6px 16px;text-align:center}',
    '.mc-grass{fill:#a7e3a1}',
    '.mc-fence{fill:none;stroke:#8a5a2b;stroke-width:5;stroke-linejoin:round}',
    '.mc-dim{font-size:18px;font-weight:800;fill:var(--ink)}',
    '.mc-dim-new{fill:#0b6e66}',
    '.mc-hidden{display:none}',
    '.mc-garden-lab{display:flex;gap:20px;align-items:flex-start;justify-content:center;flex-wrap:wrap;width:100%}',
    '.mc-gleft{display:flex;flex-direction:column;align-items:center;gap:8px}',
    '.mc-gright{display:flex;flex-direction:column;gap:10px;min-width:250px}',
    '.mc-controls{display:flex;align-items:center;gap:8px}',
    '.mc-ctl-name{font-weight:800}',
    '.mc-step{min-width:44px;padding:4px 0;font-size:1.4rem;background:var(--paper-2);color:var(--ink)}',
    '.mc-slider{width:170px;accent-color:#2f8f3a}',
    '.mc-lenval{font-weight:800;font-size:1.2rem;min-width:46px}',
    '.mc-fenceline{font-weight:700;color:#8a5a2b;font-size:1.05rem}',
    '.mc-arealine{font-size:1.4rem;font-weight:800}',
    '.mc-arealine b{color:#2f8f3a}',
    '.mc-table-title{font-weight:800;color:var(--ink-soft);font-size:.9rem;text-transform:uppercase;letter-spacing:.05em}',
    '.mc-table{border-collapse:collapse;font-size:1.05rem;background:#fff}',
    '.mc-table th,.mc-table td{border:2px solid var(--line);padding:4px 14px;text-align:center}',
    '.mc-table th{background:var(--paper-2)}',
    '.mc-table tr.mc-now td{outline:none;background:#eef3ff}',
    '.mc-table tr.mc-best td{font-weight:800;color:#2f8f3a}',
    '.mc-same-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}',
    '.mc-same-card{background:#fff;border:3px solid var(--line);border-radius:16px;padding:8px;cursor:pointer;font:inherit;color:var(--ink);display:flex;flex-direction:column;align-items:center;gap:4px}',
    '.mc-same-card:hover{border-color:var(--accent)}',
    '.mc-same-card.mc-open{border-color:#8a5a2b;cursor:default}',
    '.mc-same-card svg{max-width:100%;height:auto}',
    '.mc-same-fence{font-weight:800;color:#8a5a2b}',
    '.mc-gname{font-weight:800}',
    '.mc-sticks{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}',
    '.mc-stick{width:110px;padding:8px 0;text-align:center;font-weight:800;background:#ffe9a8;border:2px solid #d4a72c;border-radius:6px}',
    '.mc-stick-on{background:#e2f7ee;border-color:var(--good);color:var(--good)}',
    '.mc-crayon-body{fill:#4f8ef7}',
    '.mc-crayon-band{fill:#2b5fb8}',
    '.mc-crayon-tip{fill:#2b5fb8}',
    '.mc-guide{stroke:#c2410c;stroke-width:2;stroke-dasharray:4 4}',
    '.mc-hop{fill:none;stroke:#0b6e66;stroke-width:2.5}',
    '.mc-hop-n{font-size:13px;font-weight:800;fill:#0b6e66}',
    '.mc-item{display:flex;align-items:center;gap:12px;font-size:1.5rem;font-weight:800;background:#fff;border:3px dashed var(--line);border-radius:16px;padding:14px 24px}',
    '.mc-item-icon{font-size:2.6rem}',
    '.mc-nl{stroke:var(--ink);stroke-width:3}',
    '.mc-mid{stroke:#c2410c}',
    '.mc-nl-n{font-size:18px;font-weight:800;fill:var(--ink)}',
    '.mc-nl-mid{font-size:13px;fill:#c2410c;font-weight:700}',
    '.mc-dot{fill:#2563eb}',
    '.mc-dot-n{fill:#2563eb}',
    '.mc-arrow{fill:none;stroke:var(--good);stroke-width:4;stroke-dasharray:6 4}',
    '.mc-board{fill:#f4d9b0;stroke:#8a5a2b;stroke-width:5}',
    '.mc-shape{fill:#c9dcff;stroke:#2b5fb8;stroke-width:4;stroke-linejoin:round}',
    '.mc-shape-fill{fill:#ffc98a}',
    '.mc-half-a{fill:#7fd1c7}',
    '.mc-half-b{fill:#c9b6ff}',
    '.mc-num{font-size:20px;font-weight:800;fill:var(--ink)}',
    '.mc-num-half{font-size:15px}',
    '.mc-num-small{font-size:15px;fill:#c2410c}',
    '.mc-rect-fill{fill:#bfe9e4}',
    '.mc-rect-edge{fill:none;stroke:#0b6e66;stroke-width:4}',
    '.mc-key{background:#fff3cd;border-bottom:4px solid var(--gold);padding:0 6px;border-radius:6px;text-transform:uppercase}',
    '.mc-note{margin:0;color:var(--ink-soft);font-weight:700}',
    '.mc-sq-row{display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;justify-content:center}',
    '.mc-sq-card{display:flex;flex-direction:column;align-items:center;gap:4px;background:#fff;border:2px solid var(--line);border-radius:12px;padding:8px;font-weight:800;font-size:.95rem}',
    '.mc-sq-on{border-color:var(--good);background:var(--good-bg);color:var(--good)}',
    '.mc-mini{fill:#ffe7bd;stroke:#d79a2b;stroke-width:1}',
    '.mc-garden-choices{max-width:760px}',
    '.mc-garden-choices .choice{padding:8px}',
    '.mc-gcard{display:flex;flex-direction:column;align-items:center;gap:4px}',
    '.mc-gcard svg{max-width:100%;height:auto}',
    '.mc-area-lab{color:#2f8f3a;font-size:1rem}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'mission-challenge' }, css));
})();

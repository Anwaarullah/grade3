/* Same Amount? Water levels in different shapes, the pebble test, "how much is left?"
 * and the two-cup pouring puzzle (Unit 13.2 Capacity).
 *
 * Every container is drawn as a prism (straight sides, constant depth), so the water
 * height in SVG units is exactly  volume * K / innerWidth.  All drawings and all answers
 * come from the same numbers.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  var K = 30; // SVG area units per ml (height = ml * K / width)

  function hFor(ml, w) {
    return (ml * K) / w;
  }

  /* ------------------------------------------------------------------ *
   * Everyday containers (inner width w, inner height H, in SVG units)
   * ------------------------------------------------------------------ */
  var CONT = {
    glass: { name: 'tall glass', w: 50, H: 260 },
    tumbler: { name: 'short glass', w: 75, H: 170 },
    mug: { name: 'mug', w: 95, H: 160 },
    jar: { name: 'jar', w: 120, H: 210 },
    jug: { name: 'wide jug', w: 150, H: 200 },
    tub: { name: 'tub', w: 185, H: 140 },
  };
  var CONT_KEYS = Object.keys(CONT);
  var MIN_H = 25; // smallest water column we draw
  var TOP_GAP = 12; // water stays at least this far below the rim

  function fits(type, ml) {
    var h = hFor(ml, CONT[type].w);
    return h >= MIN_H && h <= CONT[type].H - TOP_GAP;
  }

  // Two-cup puzzle
  var CAP_A = 500;
  var CAP_B = 300;
  var CAP_BOWL = 1500;
  var TARGETS = [800, 200, 700, 600, 100];
  var SOLUTIONS = {
    1000: ['fillA', 'A>bowl', 'fillA', 'A>bowl'],
    800: ['fillA', 'A>bowl', 'fillB', 'B>bowl'],
    200: ['fillA', 'A>B', 'A>bowl'],
    700: ['fillA', 'A>B', 'A>bowl', 'fillA', 'A>bowl'],
    600: ['fillB', 'B>bowl', 'fillB', 'B>bowl'],
    100: ['fillB', 'B>A', 'fillB', 'B>A', 'B>bowl'],
  };
  var MOVE_LABEL = {
    fillA: 'Fill A',
    fillB: 'Fill B',
    'A>B': 'Pour A → B',
    'B>A': 'Pour B → A',
    'A>bowl': 'Pour A → bowl',
    'B>bowl': 'Pour B → bowl',
    emptyA: 'Empty A',
    emptyB: 'Empty B',
    emptyBowl: 'Empty bowl',
  };
  var PUZZLE_HINT = {
    1000: '500 + 500 = 1000. Fill A and pour it into the bowl. Then do it again.',
    800: '500 + 300 = 800. Fill A and pour it into the bowl. Then fill B and pour that in too.',
    200: 'Fill A (500 ml). Pour A into B until B is full (300 ml). What is left in A? Pour that into the bowl.',
    700: 'First make 200 ml: fill A, then pour A into B. Put the 200 ml from A in the bowl. Then add a full A: 200 + 500.',
    600: '300 + 300 = 600. Use cup B two times.',
    100: 'Fill B and pour it into A. Fill B again and pour into A until A is full. A only has room for 200 more, so 100 ml stays in B.',
  };

  // Exact pouring: pour until the source is empty or the destination is full.
  function applyMove(st, mv) {
    var s = { a: st.a, b: st.b, bowl: st.bowl };
    var caps = { a: CAP_A, b: CAP_B, bowl: CAP_BOWL };
    function pour(from, to) {
      var amt = Math.min(s[from], caps[to] - s[to]);
      s[from] -= amt;
      s[to] += amt;
      return amt;
    }
    var moved = 0;
    if (mv === 'fillA') s.a = CAP_A;
    else if (mv === 'fillB') s.b = CAP_B;
    else if (mv === 'emptyA') s.a = 0;
    else if (mv === 'emptyB') s.b = 0;
    else if (mv === 'emptyBowl') s.bowl = 0;
    else if (mv === 'A>B') moved = pour('a', 'b');
    else if (mv === 'B>A') moved = pour('b', 'a');
    else if (mv === 'A>bowl') moved = pour('a', 'bowl');
    else if (mv === 'B>bowl') moved = pour('b', 'bowl');
    s.moved = moved;
    return s;
  }

  function runMoves(seq) {
    var st = { a: 0, b: 0, bowl: 0 };
    seq.forEach(function (m) {
      st = applyMove(st, m);
    });
    return st;
  }

  // One short sentence describing a move and its result.
  function moveSentence(before, mv, after) {
    switch (mv) {
      case 'fillA':
        return 'Fill cup A: 500 ml.';
      case 'fillB':
        return 'Fill cup B: 300 ml.';
      case 'emptyA':
        return 'Empty cup A into the sink.';
      case 'emptyB':
        return 'Empty cup B into the sink.';
      case 'emptyBowl':
        return 'Empty the bowl into the sink.';
      case 'A>B':
        if (!after.moved) return before.a ? 'B is already full.' : 'A is empty. Nothing to pour.';
        return 'Pour A into B. B takes ' + after.moved + ' ml. ' + (after.a ? before.a + ' − ' + after.moved + ' = ' + after.a + ' ml is left in A.' : 'A is empty now.');
      case 'B>A':
        if (!after.moved) return before.b ? 'A is already full.' : 'B is empty. Nothing to pour.';
        return 'Pour B into A. A takes ' + after.moved + ' ml. ' + (after.b ? before.b + ' − ' + after.moved + ' = ' + after.b + ' ml is left in B.' : 'B is empty now.');
      case 'A>bowl':
        if (!after.moved) return before.a ? 'The bowl is full.' : 'A is empty. Nothing to pour.';
        return 'Pour ' + after.moved + ' ml from A into the bowl. Bowl: ' + before.bowl + ' + ' + after.moved + ' = ' + after.bowl + ' ml.';
      case 'B>bowl':
        if (!after.moved) return before.b ? 'The bowl is full.' : 'B is empty. Nothing to pour.';
        return 'Pour ' + after.moved + ' ml from B into the bowl. Bowl: ' + before.bowl + ' + ' + after.moved + ' = ' + after.bowl + ' ml.';
    }
    return '';
  }

  /* ------------------------------------------------------------------ *
   * Small helpers
   * ------------------------------------------------------------------ */
  function svgBox(w, h, cls) {
    return S('svg', { class: 'sma-svg ' + (cls || ''), viewBox: '0 0 ' + w + ' ' + h, role: 'img' });
  }

  // Animate t from 0 to 1 in n steps (api.later so it stops when the screen changes).
  function tween(api, n, ms, fn, done) {
    var i = 0;
    function step() {
      i++;
      fn(Math.min(1, i / n));
      if (i < n) api.later(step, ms);
      else if (done) done();
    }
    step();
  }

  function parseAmount(raw) {
    var s = String(raw == null ? '' : raw).trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ');
    var unit = '';
    var m = s.match(/^(.*?)\s*(millilitres?|milliliters?|ml|litres?|liters?|l)\.?$/);
    if (m) {
      s = m[1].trim();
      unit = m[2].charAt(0) === 'm' ? 'ml' : 'l';
    }
    if (s === '') return NaN;
    var n = U.parseNum(s);
    if (isNaN(n)) return NaN;
    return unit === 'l' ? n * 1000 : n;
  }

  function amountInput(onSubmit) {
    var input = el('input', { class: 'num-input', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Your answer', placeholder: '?' });
    var check = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    var row = el('div', { class: 'num-row' }, input, el('span', { class: 'num-unit' }, 'ml'), check);
    function submit() {
      if (input.disabled) return;
      var n = parseAmount(input.value);
      if (isNaN(n)) {
        input.classList.add('shake');
        input.focus();
        return;
      }
      input.classList.remove('shake');
      onSubmit(n);
    }
    check.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    });
    return {
      el: row,
      isEmpty: function () {
        return !input.value.trim();
      },
      set: function (v) {
        input.value = v;
      },
      good: function () {
        input.classList.remove('bad');
        input.classList.add('good');
      },
      bad: function () {
        input.classList.remove('good');
        input.classList.add('bad');
      },
      disable: function () {
        input.disabled = true;
        check.disabled = true;
      },
    };
  }

  function chipsRow(vals, fmt) {
    var row = el('div', { class: 'sma-count' });
    vals.forEach(function (v, i) {
      if (i) row.appendChild(el('span', { class: 'sma-arrow' }, '→'));
      row.appendChild(el('span', { class: 'chip' + (i === vals.length - 1 ? ' chip-total' : '') }, fmt ? fmt(v) : String(v)));
    });
    return row;
  }

  function litreLabel(v) {
    if (v === 1000) return '1 litre';
    if (v === 2000) return '2 litres';
    return v + ' ml';
  }

  /* ------------------------------------------------------------------ *
   * Drawings
   * ------------------------------------------------------------------ */

  // A kitchen container. cx = centre, yBot = inner bottom. Returns a controller.
  function drawContainer(svg, type, cx, yBot) {
    var c = CONT[type];
    var w = c.w;
    var H = c.H;
    var x = cx - w / 2;
    var top = yBot - H;
    var g = S('g', { class: 'sma-cont sma-c-' + type });
    if (type === 'mug') g.appendChild(S('path', { class: 'sma-handle', d: 'M' + (x + w + 3) + ' ' + (top + 30) + ' C ' + (x + w + 45) + ' ' + (top + 30) + ', ' + (x + w + 45) + ' ' + (top + 110) + ', ' + (x + w + 3) + ' ' + (top + 110) }));
    if (type === 'jug') g.appendChild(S('path', { class: 'sma-handle', d: 'M' + (x + w + 3) + ' ' + (top + 26) + ' C ' + (x + w + 50) + ' ' + (top + 30) + ', ' + (x + w + 50) + ' ' + (top + 120) + ', ' + (x + w + 3) + ' ' + (top + 130) }));
    // body (outer glass) and inner space
    var body = S('rect', { class: 'sma-body', x: x - 4, y: top, width: w + 8, height: H + 4 });
    if (type === 'mug') body.setAttribute('class', 'sma-body sma-mug');
    if (type === 'tub') body.setAttribute('class', 'sma-body sma-tub');
    g.appendChild(body);
    if (type === 'glass' || type === 'tumbler') g.appendChild(S('rect', { class: 'sma-foot', x: x - 6, y: yBot, width: w + 12, height: 8, rx: 3 }));
    if (type === 'jug') g.appendChild(S('path', { class: 'sma-body', d: 'M' + (x - 4) + ' ' + top + ' L' + (x - 18) + ' ' + (top - 12) + ' L' + (x - 4) + ' ' + (top + 14) + ' Z' }));
    if (type === 'tub') g.appendChild(S('rect', { class: 'sma-lip', x: x - 9, y: top - 4, width: w + 18, height: 8, rx: 3 }));
    var water = S('rect', { class: 'sma-water', x: x, y: yBot, width: w, height: 0 });
    var surf = S('line', { class: 'sma-surf', x1: x, x2: x + w, y1: yBot, y2: yBot, visibility: 'hidden' });
    var bands = S('g', { class: 'sma-bands', visibility: 'hidden' });
    g.appendChild(water);
    g.appendChild(bands);
    g.appendChild(surf);
    svg.appendChild(g);
    var vol = 0;
    var ctl = {
      type: type,
      x: x,
      w: w,
      cx: cx,
      top: top,
      yBot: yBot,
      level: function () {
        return vol;
      },
      heightOf: function () {
        return hFor(vol, w);
      },
      set: function (v) {
        vol = v;
        var h = hFor(v, w);
        water.setAttribute('y', yBot - h);
        water.setAttribute('height', h);
        surf.setAttribute('y1', yBot - h);
        surf.setAttribute('y2', yBot - h);
        surf.setAttribute('visibility', v > 0 ? 'visible' : 'hidden');
      },
      // dashed lines every 100 ml inside the water
      showBands: function () {
        MQ.clear(bands);
        for (var k = 1; k * 100 < vol; k++) {
          var y = yBot - hFor(k * 100, w);
          bands.appendChild(S('line', { class: 'sma-band', x1: x, x2: x + w, y1: y, y2: y }));
        }
        bands.setAttribute('visibility', 'visible');
      },
      hideBands: function () {
        bands.setAttribute('visibility', 'hidden');
      },
    };
    ctl.set(0);
    return ctl;
  }

  // A straight-sided measuring jug or cylinder. o: {x, yBot, cap, hFull, step, label(v), minor, minorLabel, cls}
  function drawMeasure(svg, o) {
    var w = (o.cap * K) / o.hFull; // prism width, so the same K holds for every drawing
    var x = o.x;
    var yBot = o.yBot;
    var top = yBot - o.hFull - 22;
    var g = S('g', { class: 'sma-measure ' + (o.cls || '') });
    g.appendChild(S('path', { class: 'sma-glass', d: 'M' + (x - 4) + ' ' + top + ' L' + (x - 4) + ' ' + (yBot + 4) + ' L' + (x + w + 4) + ' ' + (yBot + 4) + ' L' + (x + w + 4) + ' ' + top }));
    g.appendChild(S('path', { class: 'sma-glass-rim', d: 'M' + (x - 4) + ' ' + top + ' L' + (x - 14) + ' ' + (top - 10) }));
    var water = S('rect', { class: 'sma-water', x: x, y: yBot, width: w, height: 0 });
    var surf = S('line', { class: 'sma-surf', x1: x, x2: x + w, y1: yBot, y2: yBot, visibility: 'hidden' });
    var under = S('g'); // shaded parts drawn behind the scale
    var over = S('g'); // pebble, poured-out band etc.
    g.appendChild(water);
    g.appendChild(under);
    g.appendChild(surf);
    g.appendChild(over);
    function yOf(v) {
      return yBot - hFor(v, w);
    }
    var tg = S('g', { class: 'sma-scale' });
    var v;
    if (o.minor) {
      for (v = o.minor; v < o.cap; v += o.step) {
        var ym = yOf(v);
        tg.appendChild(S('line', { class: 'sma-tick sma-minor', x1: x + w - 16, x2: x + w, y1: ym, y2: ym }));
        if (o.minorLabel) tg.appendChild(S('text', { class: 'sma-lbl sma-lbl-s', x: x + w - 20, y: ym + 4.5, 'text-anchor': 'end' }, String(v)));
      }
    }
    for (v = o.step; v <= o.cap; v += o.step) {
      var y = yOf(v);
      tg.appendChild(S('line', { class: 'sma-tick', x1: x, x2: x + 18, y1: y, y2: y }));
      tg.appendChild(S('text', { class: 'sma-lbl', x: x + 22, y: y + 5 }, o.label ? o.label(v) : String(v)));
    }
    g.appendChild(tg);
    if (o.caption) g.appendChild(S('text', { class: 'sma-cap-t', x: x + w / 2, y: top - 6, 'text-anchor': 'middle' }, o.caption));
    svg.appendChild(g);
    var vol = 0;
    var m = {
      g: g,
      x: x,
      w: w,
      top: top,
      yBot: yBot,
      yOf: yOf,
      under: under,
      over: over,
      level: function () {
        return vol;
      },
      set: function (val) {
        vol = val;
        var yy = yOf(val);
        water.setAttribute('y', yy);
        water.setAttribute('height', yBot - yy);
        surf.setAttribute('y1', yy);
        surf.setAttribute('y2', yy);
        surf.setAttribute('visibility', val > 0 ? 'visible' : 'hidden');
      },
    };
    m.set(0);
    return m;
  }

  // Garden pebble whose drawn area is exactly ml * K (so it pushes up exactly that much water)
  function pebbleShape(ml) {
    var rx = 26 + (ml / 300) * 22;
    var ry = (ml * K) / (Math.PI * rx);
    return { rx: rx, ry: ry };
  }
  function drawPebble(parent, cx, cy, ml) {
    var p = pebbleShape(ml);
    var g = S('g', { class: 'sma-pebble' });
    g.appendChild(S('ellipse', { class: 'sma-peb', cx: cx, cy: cy, rx: p.rx, ry: p.ry }));
    g.appendChild(S('ellipse', { class: 'sma-peb-shine', cx: cx - p.rx * 0.35, cy: cy - p.ry * 0.4, rx: p.rx * 0.28, ry: p.ry * 0.18 }));
    parent.appendChild(g);
    return g;
  }

  /* ------------------------------------------------------------------ *
   * Compare scene: two containers, each with an identical measuring jug
   * ------------------------------------------------------------------ */
  var JUG_H = 260; // 1000 ml measuring jug, inner height

  function compareScene(stage, data) {
    var svg = svgBox(780, 392, 'sma-cmp');
    svg.setAttribute('viewBox', '0 50 780 342'); // nothing is drawn above y = 55
    var yBot = 350;
    var pos = [
      { cx: 110, jx: 238 },
      { cx: 502, jx: 630 },
    ];
    var parts = ['A', 'B'].map(function (k, i) {
      var c = drawContainer(svg, data[k].type, pos[i].cx, yBot);
      c.set(data[k].v);
      svg.appendChild(S('text', { class: 'sma-name', x: pos[i].cx, y: yBot + 30, 'text-anchor': 'middle' }, CONT[data[k].type].name));
      var jug = drawMeasure(svg, { x: pos[i].jx, yBot: yBot, cap: 1000, hFull: JUG_H, step: 100, caption: 'ml', cls: 'sma-faint' });
      var res = S('text', { class: 'sma-res', x: pos[i].jx + jug.w / 2, y: yBot + 30, 'text-anchor': 'middle' }, '');
      svg.appendChild(res);
      var stream = S('path', { class: 'sma-stream', visibility: 'hidden', d: 'M' + (c.x + c.w + 2) + ' ' + (c.top + 2) + ' Q' + (jug.x + jug.w / 2) + ' ' + (c.top - 30) + ' ' + (jug.x + jug.w / 2) + ' ' + (jug.top + 30) });
      svg.appendChild(stream);
      return { c: c, jug: jug, res: res, stream: stream, v: data[k].v };
    });
    stage.appendChild(svg);
    var poured = false;
    return {
      svg: svg,
      parts: parts,
      showBands: function () {
        parts.forEach(function (p) {
          if (!poured) p.c.showBands();
        });
      },
      pour: function (api, done) {
        if (poured) {
          if (done) done();
          return;
        }
        poured = true;
        parts.forEach(function (p) {
          p.c.hideBands();
          p.jug.g.classList.remove('sma-faint');
          p.stream.setAttribute('visibility', 'visible');
        });
        tween(
          api,
          24,
          45,
          function (t) {
            parts.forEach(function (p) {
              p.c.set(p.v * (1 - t));
              p.jug.set(p.v * t);
            });
          },
          function () {
            parts.forEach(function (p) {
              p.stream.setAttribute('visibility', 'hidden');
              p.res.textContent = p.v + ' ml';
            });
            if (done) done();
          }
        );
      },
    };
  }

  /* ------------------------------------------------------------------ *
   * Two-cup puzzle widget
   * ------------------------------------------------------------------ */
  var CUP_W = 100;
  var BOWL_W = 240;

  function cupsPuzzle(stage, api, target, onSolved) {
    var svg = svgBox(700, 286, 'sma-pz');
    svg.setAttribute('viewBox', '0 24 700 262'); // bowl label starts at y = 33
    var yBot = 246;
    var cupA = drawPCup(svg, 45, yBot, CUP_W, CAP_A, 'Cup A', '500 ml');
    var cupB = drawPCup(svg, 195, yBot, CUP_W, CAP_B, 'Cup B', '300 ml');
    var bowl = drawPCup(svg, 400, yBot, BOWL_W, CAP_BOWL, 'Big bowl', null, true);
    // goal line on the bowl, drawn to scale
    var gy = yBot - hFor(target, BOWL_W);
    svg.appendChild(S('line', { class: 'sma-goal', x1: 400 - 6, x2: 400 + BOWL_W + 6, y1: gy, y2: gy }));
    svg.appendChild(S('text', { class: 'sma-goal-t', x: 400 + BOWL_W + 10, y: gy + 5 }, target + ''));
    svg.appendChild(S('text', { class: 'sma-goal-t', x: 400 + BOWL_W + 10, y: gy + 22 }, 'ml'));
    var stream = S('path', { class: 'sma-stream', visibility: 'hidden', d: '' });
    svg.appendChild(stream);
    var shapes = { a: cupA, b: cupB, bowl: bowl };

    var st = { a: 0, b: 0, bowl: 0 };
    var busy = false;
    var locked = false;
    var moves = 0;
    var status = el('div', { class: 'sma-status' }, 'Press a button to start.');
    var btns = {};
    var grid = el('div', { class: 'sma-pbtns' });
    function addBtn(key, label, cls) {
      var b = el('button', { class: 'btn sma-pbtn ' + (cls || ''), type: 'button' }, label);
      b.addEventListener('click', function () {
        if (key === 'reset') doReset();
        else doMove(key);
      });
      btns[key] = b;
      grid.appendChild(b);
    }
    addBtn('fillA', 'Fill A', 'sma-fill');
    addBtn('fillB', 'Fill B', 'sma-fill');
    addBtn('A>B', 'Pour A → B', 'sma-pour');
    addBtn('B>A', 'Pour B → A', 'sma-pour');
    addBtn('A>bowl', 'Pour A → bowl', 'sma-pour');
    addBtn('B>bowl', 'Pour B → bowl', 'sma-pour');
    addBtn('emptyA', 'Empty A', 'sma-empty');
    addBtn('emptyB', 'Empty B', 'sma-empty');
    addBtn('emptyBowl', 'Empty bowl', 'sma-empty');
    addBtn('reset', '↺ Start again', 'btn-ghost');
    var statusRow = el('div', { class: 'sma-statusrow' }, status);
    stage.appendChild(svg);
    stage.appendChild(statusRow);
    stage.appendChild(grid);

    function show(s) {
      cupA.set(s.a);
      cupB.set(s.b);
      bowl.set(s.bowl);
    }
    function streamFor(from, to) {
      var f = shapes[from];
      var t = to === 'sink' ? null : shapes[to];
      var sx = f.x + f.w;
      var sy = f.top;
      if (!t) return 'M' + sx + ' ' + sy + ' Q' + (sx + 30) + ' ' + (sy - 20) + ' ' + (sx + 34) + ' ' + (yBot + 20);
      var tx = t.x + t.w / 2;
      var mid = Math.min(sy, t.top) - 40;
      if (t.x < f.x) {
        sx = f.x;
        return 'M' + sx + ' ' + sy + ' Q' + tx + ' ' + mid + ' ' + tx + ' ' + (t.top + 20);
      }
      return 'M' + sx + ' ' + sy + ' Q' + tx + ' ' + mid + ' ' + tx + ' ' + (t.top + 20);
    }
    function animate(from, to, srcKey, dstKey, done) {
      if (srcKey) {
        stream.setAttribute('d', streamFor(srcKey, dstKey));
        stream.setAttribute('visibility', 'visible');
      }
      tween(
        api,
        10,
        40,
        function (t) {
          show({ a: from.a + (to.a - from.a) * t, b: from.b + (to.b - from.b) * t, bowl: from.bowl + (to.bowl - from.bowl) * t });
        },
        function () {
          stream.setAttribute('visibility', 'hidden');
          show(to);
          if (done) done();
        }
      );
    }
    var SRC = { 'A>B': ['a', 'b'], 'B>A': ['b', 'a'], 'A>bowl': ['a', 'bowl'], 'B>bowl': ['b', 'bowl'], emptyA: ['a', 'sink'], emptyB: ['b', 'sink'], emptyBowl: ['bowl', 'sink'] };

    function step(mv, done) {
      var before = st;
      var after = applyMove(st, mv);
      st = { a: after.a, b: after.b, bowl: after.bowl };
      status.textContent = moveSentence(before, mv, after);
      var sd = SRC[mv];
      animate(before, st, sd && (before[sd[0]] > 0) ? sd[0] : null, sd ? sd[1] : null, done);
    }
    function doMove(mv) {
      if (busy || locked) return;
      busy = true;
      moves++;
      api.sound('pop');
      step(mv, function () {
        busy = false;
        if (st.bowl === target) {
          locked = true;
          setDisabled(true);
          if (onSolved) onSolved(moves);
        }
      });
    }
    function doReset() {
      if (busy || locked) return;
      api.sound('click');
      st = { a: 0, b: 0, bowl: 0 };
      moves = 0;
      show(st);
      status.textContent = 'All empty. Start again.';
    }
    function setDisabled(d) {
      Object.keys(btns).forEach(function (k) {
        btns[k].disabled = d;
      });
    }
    show(st);
    return {
      statusRow: statusRow,
      state: function () {
        return { a: st.a, b: st.b, bowl: st.bowl };
      },
      moves: function () {
        return moves;
      },
      lock: function () {
        locked = true;
        setDisabled(true);
      },
      // Play a solution step by step from empty cups. Calls done(lines).
      play: function (seq, done) {
        locked = true;
        setDisabled(true);
        st = { a: 0, b: 0, bowl: 0 };
        show(st);
        var lines = [];
        var i = 0;
        function next() {
          if (i >= seq.length) {
            if (done) done(lines);
            return;
          }
          var before = st;
          var mv = seq[i++];
          step(mv, function () {
            lines.push(moveSentence(before, mv, applyMove(before, mv)));
            api.later(next, 700);
          });
        }
        api.later(next, 300);
      },
    };
  }

  // Straight-sided cup or bowl for the puzzle. Shows its current amount above it.
  function drawPCup(svg, x, yBot, w, cap, name, sub, isBowl) {
    var H = hFor(cap, w);
    var top = yBot - H;
    var g = S('g', { class: 'sma-pcup' });
    if (!isBowl) g.appendChild(S('path', { class: 'sma-handle sma-handle-s', d: 'M' + (x + w + 3) + ' ' + (top + 18) + ' C ' + (x + w + 34) + ' ' + (top + 18) + ', ' + (x + w + 34) + ' ' + (top + Math.min(H - 10, 70)) + ', ' + (x + w + 3) + ' ' + (top + Math.min(H - 10, 70)) }));
    g.appendChild(S('rect', { class: isBowl ? 'sma-body sma-bowl' : 'sma-body sma-cup', x: x - 4, y: top, width: w + 8, height: H + 4 }));
    var water = S('rect', { class: 'sma-water', x: x, y: yBot, width: w, height: 0 });
    var surf = S('line', { class: 'sma-surf', x1: x, x2: x + w, y1: yBot, y2: yBot, visibility: 'hidden' });
    g.appendChild(water);
    g.appendChild(surf);
    var amt = S('text', { class: 'sma-amt', x: x + w / 2, y: top - 10, 'text-anchor': 'middle' }, '0 ml');
    g.appendChild(amt);
    g.appendChild(S('text', { class: 'sma-name', x: x + w / 2, y: yBot + 24, 'text-anchor': 'middle' }, name + (sub ? ' (' + sub + ')' : '')));
    svg.appendChild(g);
    return {
      x: x,
      w: w,
      top: top,
      set: function (v) {
        var h = hFor(v, w);
        water.setAttribute('y', yBot - h);
        water.setAttribute('height', h);
        surf.setAttribute('y1', yBot - h);
        surf.setAttribute('y2', yBot - h);
        surf.setAttribute('visibility', v > 0.5 ? 'visible' : 'hidden');
        amt.textContent = Math.round(v) + ' ml';
      },
    };
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  var deck = null;

  function amounts() {
    var a = [];
    for (var v = 100; v <= 900; v += 100) a.push(v);
    return a;
  }

  // kind: 'less' (taller level is the smaller amount), 'more' (taller is more), 'same'
  function makeCompare(kind, used) {
    for (var tries = 0; tries < 2000; tries++) {
      var t1 = U.pick(CONT_KEYS);
      var t2 = U.pick(CONT_KEYS);
      if (t1 === t2) continue;
      var v1 = U.pick(amounts());
      var v2 = kind === 'same' ? v1 : U.pick(amounts());
      if (!fits(t1, v1) || !fits(t2, v2)) continue;
      var h1 = hFor(v1, CONT[t1].w);
      var h2 = hFor(v2, CONT[t2].w);
      if (Math.abs(h1 - h2) < 30) continue;
      // let 1 be the container with the taller water
      if (h2 > h1) continue;
      if (kind === 'less' && !(v1 < v2)) continue;
      if (kind === 'more' && !(v1 > v2 && Math.abs(CONT[t1].w - CONT[t2].w) >= 30)) continue;
      if (kind === 'same' && Math.abs(CONT[t1].w - CONT[t2].w) < 40) continue;
      var swap = Math.random() < 0.5;
      var A = { type: swap ? t2 : t1, v: swap ? v2 : v1 };
      var B = { type: swap ? t1 : t2, v: swap ? v1 : v2 };
      var key = 'cmp:' + A.type + A.v + '/' + B.type + B.v;
      var rkey = 'cmp:' + B.type + B.v + '/' + A.type + A.v;
      if (used[key] || used[rkey]) continue;
      used[key] = true;
      return { type: 'compare', kind: kind, A: A, B: B, key: key };
    }
    throw new Error('same-amount: could not make a compare question');
  }

  function compareAnswer(q) {
    if (q.A.v === q.B.v) return 'same';
    return q.A.v > q.B.v ? 'A' : 'B';
  }

  function makePebble(used) {
    for (var tries = 0; tries < 500; tries++) {
      var s = U.pick([300, 350, 400, 450, 500, 550, 600]);
      var d = U.pick([50, 100, 150, 200, 250, 300]);
      var n = s + d;
      if (n > 900) continue;
      // at most one level on a half-way mark keeps the reading fair
      if (s % 100 && n % 100) continue;
      var key = 'peb:' + s + '+' + d;
      if (used[key]) continue;
      used[key] = true;
      return { type: 'pebble', start: s, diff: d, end: n, key: key };
    }
    throw new Error('same-amount: could not make a pebble question');
  }

  var LEFT_KINDS = [
    { cap: 1000, out: 500, words: '500 ml' },
    { cap: 1000, out: 250, words: 'a quarter', quarter: 1 },
    { cap: 1000, out: 750, words: 'three quarters', quarter: 3 },
    { cap: 2000, out: 500, words: '500 ml' },
    { cap: 2000, out: 500, words: 'a quarter', quarter: 1 },
  ];
  function makeLeft(used) {
    var opts = U.shuffle(LEFT_KINDS.slice());
    for (var i = 0; i < opts.length; i++) {
      var o = opts[i];
      var key = 'left:' + o.cap + ':' + o.out;
      if (used[key]) continue;
      used[key] = true;
      return { type: 'left', cap: o.cap, out: o.out, left: o.cap - o.out, words: o.words, quarter: o.quarter || 0, key: key };
    }
    throw new Error('same-amount: no "left" question');
  }

  function buildDeck() {
    var used = {};
    var q = [];
    // Level 1: compare shapes. "Taller is less" and "the same" are always in.
    U.shuffle(['less', 'same', U.pick(['more', 'less'])]).forEach(function (k) {
      q.push(makeCompare(k, used));
    });
    // Level 2: pebble + "how much is left?" + one more of either
    var l2 = [makePebble(used), makeLeft(used), Math.random() < 0.5 ? makePebble(used) : makeLeft(used)];
    U.shuffle(l2).forEach(function (x) {
      q.push(x);
    });
    // Level 3: two-cup puzzles, one easier target then one harder target
    var easy = U.pick([800, 200, 600]);
    var hard = U.pick([700, 100]);
    q.push({ type: 'cups', target: easy, key: 'cups:' + easy });
    q.push({ type: 'cups', target: hard, key: 'cups:' + hard });
    return q;
  }

  /* ------------------------------------------------------------------ *
   * Practice renderers
   * ------------------------------------------------------------------ */
  function renderCompare(stage, api, q) {
    var ans = compareAnswer(q);
    var nameA = CONT[q.A.type].name;
    var nameB = CONT[q.B.type].name;
    var hA = hFor(q.A.v, CONT[q.A.type].w);
    var hB = hFor(q.B.v, CONT[q.B.type].w);
    var taller = hA > hB ? 'A' : 'B';
    api.say('Which one has more water? Think before we pour.', 'think');
    stage.appendChild(MQ.ui.prompt('Which has <b>more water</b>?'));
    var scene = compareScene(stage, q);
    function nameOf(k) {
      return k === 'A' ? nameA : nameB;
    }
    function resultLine() {
      var big = q.A.v > q.B.v ? 'A' : 'B';
      if (ans === 'same') return 'Both have ' + q.A.v + ' ml. The same amount, even though the levels look different!';
      var line = 'The ' + nameA + ' had ' + q.A.v + ' ml. The ' + nameB + ' had ' + q.B.v + ' ml. ' + Math.max(q.A.v, q.B.v) + ' is more.';
      if (big !== taller) line += ' The lower water was more!';
      return line;
    }
    var ch = MQ.ui.choices(
      [
        { label: 'The ' + nameA, value: 'A' },
        { label: 'The same', value: 'same' },
        { label: 'The ' + nameB, value: 'B' },
      ],
      function (v) {
        if (v === ans) {
          ch.mark(v, 'good');
          ch.disable();
          api.check(true, 'Yes! Let\'s pour to check.');
          scene.pour(api, function () {
            api.feedback(resultLine(), 'good');
            api.say(ans !== 'same' && ans !== taller ? 'The lower water was more!' : 'The jugs show it!', 'cheer');
          });
          return;
        }
        ch.mark(v, 'bad');
        scene.showBands();
        var stronger = api.tries() >= 1;
        if (v === taller) {
          api.check(false, stronger ? 'Count the dashed bands. Each band is 100 ml. Which has more bands?' : 'Its water is higher, but look how thin it is! Wide ones hold more for each step up. Each dashed band is 100 ml.', 'Judged by level only');
        } else if (v === 'same') {
          api.check(false, stronger ? 'Count the 100 ml bands in each one. Are the counts the same?' : 'Count the dashed bands. Each band is 100 ml. Do they both have the same number?', 'Judged by level only');
        } else {
          api.check(false, stronger ? 'Count the dashed bands. Each band is 100 ml, even the thin tall ones.' : 'Wide does not always mean more. Count the dashed bands: each one is 100 ml.', 'Judged by width only');
        }
      },
      { columns: 3 }
    );
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(ans, 'good');
      ch.disable();
      scene.pour(api, function () {
        api.feedback('Pour both into the same kind of jug to compare. ' + resultLine(), 'info');
      });
      api.feedback('Watch: we pour both into the same kind of measuring jug.', 'info');
    });
  }

  function countOnSteps(from, to) {
    var a = [from];
    var v = from;
    while (to - v >= 100) {
      v += 100;
      a.push(v);
    }
    if (v < to) a.push(to);
    return a;
  }
  function jumpsOf(list) {
    var j = [];
    for (var i = 1; i < list.length; i++) j.push(list[i] - list[i - 1]);
    return j;
  }

  function renderPebble(stage, api, q) {
    api.say('A pebble goes in the water. How much does the water go up?', 'think');
    stage.appendChild(MQ.ui.prompt('How many <b>ml</b> did the water go up?'));
    var svg = svgBox(540, 360, 'sma-peb-svg');
    var yBot = 322;
    var opts = { cap: 1000, hFull: 280, step: 100, minor: 50, minorLabel: true, caption: 'ml' };
    opts.x = 100;
    opts.yBot = yBot;
    var before = drawMeasure(svg, opts);
    opts.x = 340;
    var after = drawMeasure(svg, opts);
    before.set(q.start);
    after.set(q.end);
    var pb = pebbleShape(q.diff);
    drawPebble(after.under, after.x + after.w / 2, yBot - pb.ry - 1, q.diff);
    svg.appendChild(S('text', { class: 'sma-name', x: before.x + before.w / 2, y: yBot + 30, 'text-anchor': 'middle' }, 'Before'));
    svg.appendChild(S('text', { class: 'sma-name', x: after.x + after.w / 2, y: yBot + 30, 'text-anchor': 'middle' }, 'After'));
    // arrow between
    svg.appendChild(S('path', { class: 'sma-arr', d: 'M' + (before.x + before.w + 30) + ' 180 L' + (after.x - 34) + ' 180' }));
    svg.appendChild(S('path', { class: 'sma-arr-h', d: 'M' + (after.x - 44) + ' 170 L' + (after.x - 32) + ' 180 L' + (after.x - 44) + ' 190' }));
    var row = el('div', { class: 'sma-row' });
    row.appendChild(svg);
    var side = el('div', { class: 'sma-side' });
    var work = el('div', { class: 'sma-work' });
    function showRise() {
      MQ.clear(after.over);
      var y1 = after.yOf(q.end);
      var y0 = after.yOf(q.start);
      after.over.appendChild(S('rect', { class: 'sma-rise', x: after.x, y: y1, width: after.w, height: y0 - y1 }));
      after.over.appendChild(S('line', { class: 'sma-was', x1: after.x - 10, x2: after.x + after.w + 10, y1: y0, y2: y0 }));
    }
    var input = amountInput(function (v) {
      if (U.same(v, q.diff)) {
        input.good();
        input.disable();
        showRise();
        api.check(true, 'Yes! From ' + q.start + ' up to ' + q.end + ' is ' + q.diff + ' ml.');
        return;
      }
      input.bad();
      var t = api.tries();
      if (U.same(v, q.end) || U.same(v, q.start)) {
        api.check(false, t >= 1 ? 'Find the jump from ' + q.start + ' to ' + q.end + '. Count on from ' + q.start + '.' : 'That is a water level. We want how much it went UP. Look at the Before and After levels.', 'Gave a level, not the difference');
      } else if (U.same(v, q.start + q.end)) {
        api.check(false, 'Do not add the levels. Count on from ' + q.start + ' up to ' + q.end + '.', 'Subtracted the wrong way round');
      } else if (Math.abs(v - q.diff) === 50 || Math.abs(v - q.diff) === 100) {
        api.check(false, t >= 1 ? 'Count on in 50s from ' + q.start + ': ' + q.start + ', ' + (q.start + 50) + ', ... until you reach ' + q.end + '.' : 'Close! Check each level again. The small marks on the right are the 50s.', 'Misread a half-way mark');
      } else {
        api.check(false, t >= 1 ? 'Start at ' + q.start + '. Count on to ' + q.end + '. How far did you count?' : 'Read the Before level and the After level. Then find the difference.', 'Did not find the difference');
      }
    });
    side.appendChild(el('div', { class: 'sma-q2' }, 'The water went up by'));
    side.appendChild(input.el);
    side.appendChild(work);
    row.appendChild(side);
    stage.appendChild(row);
    api.onReveal(function () {
      input.set(q.diff);
      input.good();
      input.disable();
      showRise();
      MQ.clear(work);
      var list = countOnSteps(q.start, q.end);
      work.appendChild(el('div', { class: 'sma-tip' }, 'Count on from ' + q.start + ':'));
      work.appendChild(chipsRow(list, function (x) {
        return x + '';
      }));
      work.appendChild(MQ.ui.sum(jumpsOf(list), q.diff, 'ml'));
      api.feedback('Before: ' + q.start + ' ml. After: ' + q.end + ' ml. Count on from ' + q.start + ' to ' + q.end + ': ' + q.end + ' − ' + q.start + ' = ' + q.diff + ' ml. The pebble pushed the water up by ' + q.diff + ' ml.', 'info');
    });
  }

  function renderLeft(stage, api, q) {
    var capWords = q.cap === 1000 ? '1 litre' : '2 litre';
    api.say('The jug is full. Pour some out. How much is left?', 'think');
    stage.appendChild(MQ.ui.prompt('A full <b>' + capWords + '</b> jug (' + q.cap + ' ml). Pour out <b>' + q.words + '</b>. How much is <b>left</b>?'));
    var hFull = q.cap === 1000 ? 240 : 280;
    var svg = svgBox(440, 350, 'sma-left-svg');
    var yBot = 322;
    var w = (q.cap * K) / hFull;
    var jug = drawMeasure(svg, { x: 190 - w / 2, yBot: yBot, cap: q.cap, hFull: hFull, step: 250, label: litreLabel, caption: '' });
    jug.set(q.cap);
    var row = el('div', { class: 'sma-row' });
    row.appendChild(svg);
    var side = el('div', { class: 'sma-side' });
    var work = el('div', { class: 'sma-work' });
    var poured = false;
    function drawQuarters() {
      var part = q.cap / 4;
      for (var k = 1; k < 4; k++) {
        var y = jug.yOf(k * part);
        jug.over.appendChild(S('line', { class: 'sma-qline', x1: jug.x, x2: jug.x + jug.w, y1: y, y2: y }));
      }
      for (var j = 0; j < 4; j++) {
        jug.over.appendChild(S('text', { class: 'sma-qtext', x: jug.x + jug.w - 8, y: jug.yOf(j * part + part / 2) + 6, 'text-anchor': 'end' }, part + ' ml'));
      }
    }
    function drawOut() {
      var y1 = jug.yOf(q.cap);
      var y0 = jug.yOf(q.left);
      jug.under.appendChild(S('rect', { class: 'sma-out', x: jug.x, y: y1, width: jug.w, height: y0 - y1 }));
      var my = (y0 + y1) / 2;
      jug.over.appendChild(S('text', { class: 'sma-out-t', x: jug.x + jug.w + 14, y: my - 4 }, 'poured out'));
      jug.over.appendChild(S('text', { class: 'sma-out-t', x: jug.x + jug.w + 14, y: my + 15 }, q.out + ' ml'));
    }
    var pourBtn = el('button', { class: 'btn sma-go', type: 'button' }, 'Pour out ' + q.words);
    var input = amountInput(function (v) {
      if (U.same(v, q.left)) {
        input.good();
        input.disable();
        api.check(true, 'Yes! ' + q.cap + ' − ' + q.out + ' = ' + q.left + ' ml left.');
        return;
      }
      input.bad();
      var t = api.tries();
      if (U.same(v, q.out)) {
        api.check(false, 'That is the part poured out. How much is still in the jug?', 'Gave the amount poured out, not what is left');
      } else if (q.cap === 2000 && U.same(v, 1000 - q.out)) {
        api.check(false, 'This jug holds 2 litres, not 1 litre. Start from 2000 ml.', 'Took away from 1 litre, not 2 litres');
      } else if (q.quarter && U.same(v, q.cap - 250 * q.quarter) && q.cap !== 1000) {
        api.check(false, 'A quarter of 2 litres is not 250 ml. Split the 2000 ml jug into 4 equal parts.', 'Used a quarter of 1 litre, not of 2 litres');
      } else {
        api.check(false, t >= 1 ? 'Count back from ' + q.cap + ' in 250s until you have taken away ' + q.out + '.' : 'Look where the water is now. Read the scale, or take ' + q.out + ' away from ' + q.cap + '.', 'Did not take away');
      }
    });
    input.disable();
    var askLbl = el('div', { class: 'sma-q2 sma-hide' }, 'Left in the jug:');
    pourBtn.addEventListener('click', function () {
      if (poured) return;
      poured = true;
      pourBtn.disabled = true;
      api.sound('pop');
      if (q.quarter) drawQuarters();
      tween(
        api,
        20,
        45,
        function (t) {
          jug.set(q.cap - q.out * t);
        },
        function () {
          drawOut();
          askLbl.classList.remove('sma-hide');
          enableInput();
          api.say('How much is left in the jug?', 'think');
        }
      );
    });
    function enableInput() {
      var inp = input.el.querySelector('input');
      var b = input.el.querySelector('button');
      inp.disabled = false;
      b.disabled = false;
      try {
        inp.focus({ preventScroll: true });
      } catch (e) {}
    }
    side.appendChild(pourBtn);
    side.appendChild(askLbl);
    side.appendChild(input.el);
    side.appendChild(work);
    row.appendChild(side);
    stage.appendChild(row);
    api.onReveal(function () {
      if (!poured) {
        poured = true;
        pourBtn.disabled = true;
        if (q.quarter) drawQuarters();
        jug.set(q.left);
        drawOut();
      }
      input.set(q.left);
      input.good();
      input.disable();
      askLbl.classList.remove('sma-hide');
      MQ.clear(work);
      var lines = [];
      if (q.quarter) {
        var part = q.cap / 4;
        work.appendChild(el('div', { class: 'sma-tip' }, '4 equal parts make ' + q.cap + ' ml:'));
        work.appendChild(MQ.ui.sum([part, part, part, part], q.cap, 'ml'));
        lines.push(q.words.charAt(0).toUpperCase() + q.words.slice(1) + ' of ' + (q.cap === 1000 ? '1 litre' : '2 litres') + ' is ' + q.out + ' ml.');
      }
      var back = [];
      for (var v = q.cap; v >= q.left; v -= 250) back.push(v);
      work.appendChild(el('div', { class: 'sma-tip' }, 'Count back in 250s:'));
      work.appendChild(chipsRow(back, function (x) {
        return x + '';
      }));
      work.appendChild(el('div', { class: 'sma-sent' }, q.cap + ' ml − ' + q.out + ' ml = ' + q.left + ' ml'));
      lines.push(q.cap + ' ml take away ' + q.out + ' ml leaves ' + q.left + ' ml.');
      api.feedback(lines.join(' '), 'info');
    });
  }

  function renderCups(stage, api, q) {
    api.say('Use the two cups to get exactly ' + q.target + ' ml in the bowl.', 'think');
    stage.appendChild(MQ.ui.prompt('Get exactly <b>' + q.target + ' ml</b> in the bowl.'));
    var revealed = false;
    var P = cupsPuzzle(stage, api, q.target, function (n) {
      if (revealed) return;
      api.check(true, 'Exactly ' + q.target + ' ml! You did it in ' + n + (n === 1 ? ' move.' : ' moves.'));
    });
    var checkBtn = el('button', { class: 'btn btn-check sma-checkbowl', type: 'button' }, 'Check my bowl');
    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var s = P.state();
      if (s.bowl === 0) {
        api.feedback('Pour some water into the bowl first. Then press Check.', 'info');
        return;
      }
      var t = api.tries();
      var base = s.bowl > q.target ? 'The bowl has ' + s.bowl + ' ml. That is too much. Empty the bowl and try again.' : 'The bowl has ' + s.bowl + ' ml. You need ' + q.target + ' ml: that is ' + (q.target - s.bowl) + ' ml more.';
      api.check(false, t >= 1 ? base + ' Tip: ' + PUZZLE_HINT[q.target] : base, 'Lost track of what is in each cup');
    });
    P.statusRow.appendChild(checkBtn);
    api.onReveal(function () {
      revealed = true;
      checkBtn.disabled = true;
      var seq = SOLUTIONS[q.target];
      api.feedback('Watch: ' + seq.map(function (m) {
        return MOVE_LABEL[m];
      }).join(', ') + '.', 'info');
      P.play(seq, function (lines) {
        api.feedback(lines.join(' ') + ' Now the bowl has ' + q.target + ' ml.', 'info');
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */
  function learnMarcus(stage, api) {
    api.say('My friend Marcus says: the higher water always has more. Is he right?');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Higher water = more water?', 'The glass has the <b>higher</b> water. Pour both into the <b>same kind of jug</b> to check.'));
    var data = { A: { type: 'glass', v: 300 }, B: { type: 'jug', v: 500 } };
    var scene = compareScene(stage, data);
    var btn = el('button', { class: 'btn btn-big sma-go', type: 'button' }, 'Pour to check');
    btn.addEventListener('click', function () {
      btn.disabled = true;
      api.sound('pop');
      scene.pour(api, function () {
        api.say('The lower water was more! Marcus was wrong.', 'cheer');
        api.feedback('Glass: 300 ml. Wide jug: 500 ml. Only compare levels in the same shape of jug.', 'good');
        api.unlockNext();
      });
    });
    stage.appendChild(btn);
  }

  function learnPebble(stage, api) {
    api.say('Drag the pebble into the water. Watch the level.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('The pebble test', 'Drag the garden pebble into the cylinder.'));
    var svg = svgBox(560, 360, 'sma-peb-svg');
    var yBot = 322;
    var cyl = drawMeasure(svg, { x: 300, yBot: yBot, cap: 1000, hFull: 280, step: 100, minor: 50, minorLabel: true, caption: 'ml' });
    cyl.set(500);
    var pb = pebbleShape(100);
    var home = { x: 120, y: 250 };
    var g = S('g', { class: 'sma-drag', transform: 'translate(' + home.x + ',' + home.y + ')' });
    g.appendChild(S('rect', { class: 'sma-hit', x: -60, y: -50, width: 120, height: 100 }));
    drawPebble(g, 0, 0, 100);
    svg.appendChild(g);
    var hint = S('text', { class: 'sma-name', x: home.x, y: home.y + 60, 'text-anchor': 'middle' }, 'pebble');
    svg.appendChild(hint);
    stage.appendChild(svg);
    var ask = el('div', { class: 'sma-ask' });
    stage.appendChild(ask);
    var dropped = false;
    var moved = 0;
    function drop() {
      if (dropped) return;
      dropped = true;
      api.sound('pop');
      svg.removeChild(g);
      svg.removeChild(hint);
      var peb = drawPebble(cyl.under, cyl.x + cyl.w / 2, cyl.yBot - pb.ry - 1, 100);
      peb.setAttribute('opacity', '0');
      tween(
        api,
        16,
        45,
        function (t) {
          peb.setAttribute('opacity', String(t));
          cyl.set(500 + 100 * t);
        },
        function () {
          var y0 = cyl.yOf(500);
          cyl.over.appendChild(S('line', { class: 'sma-was', x1: cyl.x - 10, x2: cyl.x + cyl.w + 10, y1: y0, y2: y0 }));
          cyl.over.appendChild(S('text', { class: 'sma-was-t', x: cyl.x - 14, y: y0 + 5, 'text-anchor': 'end' }, 'was 500'));
          api.say('It went from 500 to 600. How much did it go up?', 'think');
          var ch = MQ.ui.choices([100, 500, 600].map(function (v) {
            return { label: v + ' ml', value: v };
          }), function (v) {
            if (v === 100) {
              ch.mark(v, 'good');
              ch.disable();
              var y1 = cyl.yOf(600);
              cyl.over.appendChild(S('rect', { class: 'sma-rise', x: cyl.x, y: y1, width: cyl.w, height: y0 - y1 }));
              api.sound('correct');
              api.feedback('500 → 600 is 100 ml. The pebble pushed the water up by 100 ml.', 'good');
              api.say('Yes! The difference is 100 ml.', 'cheer');
              api.unlockNext();
            } else {
              ch.mark(v, 'bad');
              api.sound('wrong');
              api.feedback(v === 600 ? '600 is where the water is now. How far did it go UP from 500?' : '500 is where it started. Count on from 500 to 600.', 'try');
            }
          }, { columns: 3 });
          ask.appendChild(el('div', { class: 'sma-q2' }, 'How much did the water go up?'));
          ask.appendChild(ch);
        }
      );
    }
    api.cleanup(
      MQ.ui.drag(svg, g, {
        start: function () {
          moved = 0;
        },
        move: function (p, dx, dy) {
          moved = Math.abs(dx) + Math.abs(dy);
          g.setAttribute('transform', 'translate(' + (home.x + dx) + ',' + (home.y + dy) + ')');
        },
        end: function (p) {
          var over = p.x > cyl.x - 50 && p.x < cyl.x + cyl.w + 50 && p.y > cyl.top - 60 && p.y < cyl.yBot + 20;
          if (over || moved < 10) drop();
          else g.setAttribute('transform', 'translate(' + home.x + ',' + home.y + ')');
        },
      })
    );
  }

  function learnCups(stage, api) {
    api.say('Cup A holds 500 ml. Cup B holds 300 ml. Make 1000 ml in the bowl.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Two cups', 'Use the buttons to get exactly <b>1000 ml</b> in the bowl. Try: Fill A, then Pour A → bowl.'));
    cupsPuzzle(stage, api, 1000, function () {
      api.sound('correct');
      api.say('500 + 500 = 1000. Brilliant pouring!', 'cheer');
      api.feedback('Two full cup A pours: 500 + 500 = 1000 ml. Now try harder amounts!', 'good');
      api.unlockNext();
    });
  }

  MQ.register('same-amount', {
    learn: [learnMarcus, learnPebble, learnCups],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'compare') return renderCompare(stage, api, q);
        if (q.type === 'pebble') return renderPebble(stage, api, q);
        if (q.type === 'left') return renderLeft(stage, api, q);
        return renderCups(stage, api, q);
      },
    },
    _test: {
      K: K,
      CONT: CONT,
      buildDeck: buildDeck,
      compareAnswer: compareAnswer,
      hFor: hFor,
      pebbleShape: pebbleShape,
      applyMove: applyMove,
      runMoves: runMoves,
      SOLUTIONS: SOLUTIONS,
      TARGETS: TARGETS,
      CAPS: { a: CAP_A, b: CAP_B, bowl: CAP_BOWL },
      parseAmount: parseAmount,
      fits: fits,
    },
  });

  var css = [
    '.sma-svg{display:block;height:auto;max-width:100%;user-select:none;-webkit-user-select:none}',
    '.sma-cmp{width:720px}',
    '.sma-pz{width:580px}',
    '.sma-peb-svg{width:470px}',
    '.sma-left-svg{width:360px}',
    '.sma-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:14px 28px;width:100%;max-width:960px}',
    '.sma-side{display:flex;flex-direction:column;align-items:center;gap:10px;min-width:0;max-width:100%}',
    '.sma-work{display:flex;flex-direction:column;align-items:center;gap:8px;max-width:420px}',
    '.sma-count{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;max-width:100%}',
    '.sma-arrow{color:var(--ink-soft);font-weight:800}',
    '.sma-tip{color:var(--ink-soft);font-size:.95rem;font-weight:700}',
    '.sma-q2{font-size:1.2rem;font-weight:800}',
    '.sma-sent{font-size:1.3rem;font-weight:800;color:var(--good)}',
    '.sma-hide{visibility:hidden}',
    '.sma-ask{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;max-width:560px;min-height:10px}',
    '.sma-status{font-size:1.05rem;font-weight:700;color:var(--ink);background:#fff;border:2px solid var(--line);border-radius:12px;padding:6px 14px;max-width:640px;text-align:center;min-height:2.2em}',
    '.sma-pbtns{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;width:100%;max-width:760px}',
    '.sma-pbtn{padding:8px 6px;font-size:.95rem;min-height:44px;white-space:normal;line-height:1.15}',
    '.sma-fill{background:#e3f3fd;color:#155f8d;border-color:#9fd0ee}',
    '.sma-pour{background:#e7f7ef;color:#16754f;border-color:#a6dcc2}',
    '.sma-empty{background:#fff1e6;color:#9a3c0c;border-color:#f3c2a0}',
    '.sma-statusrow{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px 14px;max-width:100%}',
    '.sma-go{min-width:200px}',
    '@media (max-width:700px){.sma-pbtns{grid-template-columns:repeat(3,minmax(0,1fr))}}',
    // drawings
    '.sma-body{fill:#f3faff;stroke:#7d93b8;stroke-width:3.5;stroke-linejoin:round}',
    '.sma-mug{fill:#fff7ec;stroke:#c98a3d}',
    '.sma-tub{fill:#fbfbf4;stroke:#9aa77a}',
    '.sma-cup{fill:#f3faff}',
    '.sma-bowl{fill:#fdf7ff;stroke:#9c86c4}',
    '.sma-foot{fill:#dfe8f5;stroke:#7d93b8;stroke-width:2}',
    '.sma-lip{fill:#e5ead2;stroke:#9aa77a;stroke-width:2}',
    '.sma-handle{fill:none;stroke:#7d93b8;stroke-width:9;stroke-linecap:round}',
    '.sma-c-mug .sma-handle{stroke:#c98a3d}',
    '.sma-handle-s{stroke-width:7}',
    '.sma-glass{fill:#f3faff;stroke:#7d93b8;stroke-width:3;stroke-linejoin:round}',
    '.sma-glass-rim{fill:none;stroke:#7d93b8;stroke-width:3;stroke-linecap:round}',
    '.sma-water{fill:#8fd0f5;opacity:.88}',
    '.sma-surf{stroke:#2b8ccc;stroke-width:3}',
    '.sma-band{stroke:#1d6fa5;stroke-width:2;stroke-dasharray:6 4}',
    '.sma-faint{opacity:.35}',
    '.sma-tick{stroke:#1b2a4a;stroke-width:2.2}',
    '.sma-minor{stroke-width:1.5}',
    '.sma-lbl{font-size:15px;font-weight:800;fill:#1b2a4a;paint-order:stroke;stroke:#f3faff;stroke-width:3px;font-family:inherit}',
    '.sma-lbl-s{font-size:12px;font-weight:700;fill:#4a5a7d}',
    '.sma-cap-t{font-size:15px;font-weight:800;fill:#4a5a7d}',
    '.sma-name{font-size:18px;font-weight:800;fill:#1b2a4a}',
    '.sma-res{font-size:22px;font-weight:800;fill:#1f9d6b}',
    '.sma-amt{font-size:19px;font-weight:800;fill:#155f8d}',
    '.sma-stream{fill:none;stroke:#5bb5ea;stroke-width:7;stroke-linecap:round;opacity:.9}',
    '.sma-goal{stroke:#e08900;stroke-width:3;stroke-dasharray:9 6}',
    '.sma-goal-t{font-size:15px;font-weight:800;fill:#c45f00}',
    '.sma-peb{fill:#9aa0a8;stroke:#6b717a;stroke-width:2}',
    '.sma-peb-shine{fill:#c3c8cf}',
    '.sma-drag{cursor:grab}',
    '.sma-hit{fill:rgba(0,0,0,0)}',
    '.sma-rise{fill:rgba(255,183,3,.45);stroke:#e08900;stroke-width:2}',
    '.sma-was{stroke:#c45f00;stroke-width:2.5;stroke-dasharray:6 4}',
    '.sma-was-t{font-size:14px;font-weight:800;fill:#c45f00}',
    '.sma-arr{stroke:#4a5a7d;stroke-width:4;fill:none}',
    '.sma-arr-h{stroke:#4a5a7d;stroke-width:4;fill:none;stroke-linejoin:round}',
    '.sma-out{fill:#fff;stroke:#c45f00;stroke-width:2.5;stroke-dasharray:7 5}',
    '.sma-out-t{font-size:15px;font-weight:800;fill:#c45f00;paint-order:stroke;stroke:#fff;stroke-width:3px}',
    '.sma-qline{stroke:#6b4bb0;stroke-width:2;stroke-dasharray:4 4}',
    '.sma-qtext{font-size:13px;font-weight:800;fill:#6b4bb0;paint-order:stroke;stroke:#fff;stroke-width:3px}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'same-amount' }, css));
})();

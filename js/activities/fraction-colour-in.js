/* Colour the Fraction — name fractions of shapes from equal parts (Unit 7.1).
 * Denominator = how many equal parts, numerator = how many we are talking about,
 * and all the parts together make one whole. Trays that ask for a fraction of a number
 * of squares are pre-split into equal groups, so the child never has to divide.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var TAG = {
    over: 'Wrote coloured parts over uncoloured parts (3/7 for 3/10)',
    swap: 'Wrote the fraction upside down (10/3 for 3/10)',
    whole: 'Did not see 10/10 as one whole',
    count: 'Miscounted the parts',
    unequal: 'Picked a cut with unequal parts',
    rest: 'Named the coloured part instead of the rest',
  };

  /* ---------------------------------------------------------------- *
   * Fractions in HTML
   * ---------------------------------------------------------------- */
  function frac(n, d, cls) {
    return '<span class="fc-frac' + (cls ? ' ' + cls : '') + '"><span class="fc-fn">' + n + '</span><span class="fc-fd">' + d + '</span></span>';
  }

  /** Two small stacked boxes for typing a fraction. */
  function fracBox(label, swatchCls) {
    var num = el('input', { class: 'fc-fin', type: 'text', inputmode: 'numeric', maxlength: 2, autocomplete: 'off', 'aria-label': label + ': top number' });
    var den = el('input', { class: 'fc-fin', type: 'text', inputmode: 'numeric', maxlength: 2, autocomplete: 'off', 'aria-label': label + ': bottom number' });
    var wrap = el('div', { class: 'fc-fbox' }, el('div', { class: 'fc-fbox-label' }, el('span', { class: 'fc-swatch ' + swatchCls }), label), el('div', { class: 'fc-fstack' }, num, el('span', { class: 'fc-fline' }), den));
    return {
      el: wrap,
      num: num,
      den: den,
      val: function () {
        return [num.value.trim() === '' ? NaN : Number(num.value.trim()), den.value.trim() === '' ? NaN : Number(den.value.trim())];
      },
      set: function (n, d) {
        num.value = n;
        den.value = d;
      },
      mark: function (kind) {
        wrap.classList.remove('fc-good', 'fc-bad');
        if (kind) wrap.classList.add('fc-' + kind);
      },
      disable: function () {
        num.disabled = true;
        den.disabled = true;
      },
    };
  }

  /* ---------------------------------------------------------------- *
   * Shapes cut into parts. Everything is made in unit coordinates as
   * polygons, then fitted into a viewBox, so all parts are drawn to scale.
   * ---------------------------------------------------------------- */
  function ang(i, s, rotDeg) {
    return ((-90 + (rotDeg || 0) + (360 * i) / s) * Math.PI) / 180;
  }
  function vtx(i, s, rot) {
    var a = ang(i, s, rot);
    return [Math.cos(a), Math.sin(a)];
  }
  function mid(a, b) {
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  }

  function circleParts(n) {
    var parts = [];
    for (var i = 0; i < n; i++) {
      var a0 = ang(i, n), a1 = ang(i + 1, n);
      var steps = Math.max(2, Math.ceil(((a1 - a0) * 180) / Math.PI / 4));
      var pts = [[0, 0]];
      for (var k = 0; k <= steps; k++) {
        var a = a0 + ((a1 - a0) * k) / steps;
        pts.push([Math.cos(a), Math.sin(a)]);
      }
      parts.push(pts);
    }
    return { parts: parts, kind: 'circle' };
  }
  function polyVerts(s, rot) {
    var v = [];
    for (var i = 0; i < s; i++) v.push(vtx(i, s, rot));
    return v;
  }
  /** Regular polygon cut from the centre to every corner: s equal triangles. */
  function polyParts(s, rot) {
    var v = polyVerts(s, rot);
    var parts = v.map(function (p, i) {
      return [[0, 0], p, v[(i + 1) % s]];
    });
    return { parts: parts, verts: v, kind: 'poly' };
  }
  /** Centre to corners and to the middle of every side: 2s equal triangles. */
  function polyMidParts(s, rot) {
    var v = polyVerts(s, rot);
    var parts = [];
    v.forEach(function (p, i) {
      var q = v[(i + 1) % s];
      var m = mid(p, q);
      parts.push([[0, 0], p, m]);
      parts.push([[0, 0], m, q]);
    });
    return { parts: parts, verts: v, kind: 'poly' };
  }
  /** Lines from a point that is NOT the centre: s unequal parts. */
  function polyOffParts(s) {
    var v = polyVerts(s);
    var rin = Math.cos(Math.PI / s);
    var P = [0.5 * rin * Math.cos(0.35), 0.5 * rin * Math.sin(0.35)];
    var parts = v.map(function (p, i) {
      return [P, p, v[(i + 1) % s]];
    });
    return { parts: parts, verts: v, kind: 'poly' };
  }
  /** Centre to every other corner (decagon in 5 equal parts). */
  function polySkipParts(s) {
    var v = polyVerts(s);
    var parts = [];
    for (var i = 0; i < s; i += 2) parts.push([[0, 0], v[i], v[(i + 1) % s], v[(i + 2) % s]]);
    return { parts: parts, verts: v, kind: 'poly' };
  }
  /** Triangle cut by joining the middles of its sides: 4 equal triangles. */
  function triMidParts() {
    var v = polyVerts(3);
    var a = v[0], b = v[1], c = v[2];
    var ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
    return { parts: [[a, ab, ca], [ab, b, bc], [ca, bc, c], [ab, bc, ca]], verts: v, kind: 'poly' };
  }
  /** A bar (chocolate bar) in n equal strips. */
  function barParts(n) {
    var W = 2.6, H = 1.1;
    var parts = [];
    for (var i = 0; i < n; i++) parts.push([[(W * i) / n, 0], [(W * (i + 1)) / n, 0], [(W * (i + 1)) / n, H], [(W * i) / n, H]]);
    return { parts: parts, kind: 'bar' };
  }
  /** A tray of boxes, rows x cols. */
  function trayParts(rows, cols) {
    var parts = [];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) parts.push([[c, r], [c + 1, r], [c + 1, r + 1], [c, r + 1]]);
    return { parts: parts, kind: 'tray' };
  }

  var MAKERS = {
    circle: function (d) { return circleParts(d); },
    bar: function (d) { return barParts(d); },
    tri: function () { return polyParts(3); },
    square4: function () { return polyParts(4, 45); },
    pent: function () { return polyParts(5); },
    pent10: function () { return polyMidParts(5); },
    deca: function () { return polyParts(10); },
    tray25: function () { return trayParts(2, 5); },
  };

  /** Draw a set of parts. opts: maxW, maxH, base (class), onPart(i, path). */
  function drawParts(shape, opts) {
    opts = opts || {};
    var maxW = opts.maxW || 260;
    var maxH = opts.maxH || 260;
    var pad = opts.pad == null ? 8 : opts.pad;
    var xs = [], ys = [];
    shape.parts.forEach(function (p) {
      p.forEach(function (q) {
        xs.push(q[0]);
        ys.push(q[1]);
      });
    });
    var minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
    var minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
    var k = Math.min((maxW - 2 * pad) / (maxX - minX), (maxH - 2 * pad) / (maxY - minY));
    var W = (maxX - minX) * k + 2 * pad;
    var H = (maxY - minY) * k + 2 * pad;
    function tx(q) {
      return [pad + (q[0] - minX) * k, pad + (q[1] - minY) * k];
    }
    var root = svg('svg', { viewBox: '0 0 ' + W.toFixed(1) + ' ' + H.toFixed(1), width: Math.round(W), height: Math.round(H), class: 'fc-shape ' + (opts.base || 'fc-base-plate'), style: { maxWidth: '100%', height: 'auto' } });
    var gParts = svg('g', { class: 'fc-parts' });
    var gLabels = svg('g', { class: 'fc-labels' });
    root.appendChild(gParts);
    var paths = shape.parts.map(function (p, i) {
      var pts = p.map(tx);
      var d = 'M' + pts.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' L') + ' Z';
      var path = svg('path', { d: d, class: 'fc-part', 'data-i': i });
      // label spot: average of the corners (circle: part way along the middle of the slice)
      var cx = 0, cy = 0;
      if (shape.kind === 'circle') {
        var a = (ang(i, shape.parts.length) + ang(i + 1, shape.parts.length)) / 2;
        var rr = shape.parts.length > 6 ? 0.72 : 0.6;
        var t = tx([rr * Math.cos(a), rr * Math.sin(a)]);
        cx = t[0];
        cy = t[1];
      } else {
        var uniq = p;
        uniq.forEach(function (q) {
          var t2 = tx(q);
          cx += t2[0];
          cy += t2[1];
        });
        cx /= uniq.length;
        cy /= uniq.length;
      }
      path.labelAt = [cx, cy];
      path.mid = shape.kind === 'circle' ? (ang(i, shape.parts.length) + ang(i + 1, shape.parts.length)) / 2 : Math.atan2(cy - H / 2, cx - W / 2);
      gParts.appendChild(path);
      if (opts.onPart) {
        path.classList.add('fc-click');
        path.addEventListener('click', function () {
          opts.onPart(i, path);
        });
      }
      return path;
    });
    var sideEls = [];
    if (shape.verts && opts.sides) {
      var v = shape.verts.map(tx);
      v.forEach(function (p, i) {
        var q = v[(i + 1) % v.length];
        var hit = svg('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], class: 'fc-side', 'data-side': i });
        hit.midAt = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
        sideEls.push(hit);
        root.appendChild(hit);
      });
    }
    root.appendChild(gLabels);
    var api = {
      svg: root,
      el: el('div', { class: 'fc-shape-box' }, root),
      paths: paths,
      sides: sideEls,
      W: W,
      H: H,
      label: function (i, text, cls) {
        var at = paths[i].labelAt;
        var fs = shape.parts.length >= 10 ? 15 : 20;
        var t = svg('text', { x: at[0], y: at[1] + fs * 0.35, 'text-anchor': 'middle', class: 'fc-num-label' + (cls ? ' ' + cls : ''), style: { fontSize: fs + 'px' } }, String(text));
        gLabels.appendChild(t);
        return t;
      },
      labelPoint: function (x, y, text) {
        var t = svg('text', { x: x, y: y + 6, 'text-anchor': 'middle', class: 'fc-num-label fc-side-label' }, String(text));
        gLabels.appendChild(t);
        return t;
      },
      clearLabels: function () {
        MQ.clear(gLabels);
      },
      fill: function (i, cls) {
        var p = paths[i];
        ['fc-on', 'fc-red', 'fc-blue', 'fc-green', 'fc-yellow'].forEach(function (c) {
          p.classList.remove(c);
        });
        if (cls) p.classList.add(cls);
      },
    };
    return api;
  }

  /** Pick n of d parts: sometimes side by side, sometimes spread out. */
  function pickParts(d, n) {
    if (Math.random() < 0.5) {
      var s = U.rand(0, d - 1);
      return U.range(0, n - 1).map(function (k) {
        return (s + k) % d;
      });
    }
    return U.shuffle(U.range(0, d - 1)).slice(0, n);
  }

  var OBJ = {
    circle: [{ name: 'cake', base: 'fc-base-cake' }, { name: 'pizza', base: 'fc-base-pizza' }, { name: 'paper plate', base: 'fc-base-plate' }],
    bar: [{ name: 'chocolate bar', base: 'fc-base-choc' }],
    tri: [{ name: 'tile', base: 'fc-base-tile' }],
    square4: [{ name: 'tile', base: 'fc-base-tile' }],
    pent: [{ name: 'tile', base: 'fc-base-tile' }],
    pent10: [{ name: 'tile', base: 'fc-base-tile' }],
    deca: [{ name: 'tile', base: 'fc-base-tile' }],
    tray25: [{ name: 'ice cube tray', base: 'fc-base-tray' }],
  };
  var SHAPES_FOR = {
    2: ['circle', 'bar'],
    3: ['circle', 'tri', 'bar'],
    4: ['circle', 'bar', 'square4'],
    5: ['circle', 'pent', 'bar'],
    10: ['circle', 'pent10', 'deca', 'tray25'],
  };

  /* ---------------------------------------------------------------- *
   * Trays already split into equal groups (Workbook p.98 Q1, p.100 Q5)
   * gr x gc squares in each group, groups laid out GR x GC.
   * ---------------------------------------------------------------- */
  var TRAYS_EASY = [
    { n: 3, d: 4, GR: 1, GC: 4, gr: 2, gc: 1 },
    { n: 3, d: 10, GR: 2, GC: 5, gr: 1, gc: 1 },
    { n: 1, d: 3, GR: 1, GC: 3, gr: 1, gc: 3 },
    { n: 2, d: 3, GR: 1, GC: 3, gr: 2, gc: 1 },
    { n: 2, d: 5, GR: 1, GC: 5, gr: 2, gc: 1 },
  ];
  var TRAYS_HARD = [
    { n: 1, d: 3, GR: 1, GC: 3, gr: 2, gc: 2 },
    { n: 3, d: 4, GR: 4, GC: 1, gr: 1, gc: 5 },
    { n: 4, d: 10, GR: 1, GC: 10, gr: 2, gc: 1 },
    { n: 2, d: 3, GR: 1, GC: 3, gr: 2, gc: 2 },
    { n: 3, d: 4, GR: 2, GC: 2, gr: 1, gc: 3 },
  ];

  var SIDES_NAME = { 3: 'triangle', 5: 'pentagon', 10: 'decagon' };

  /* ---------------------------------------------------------------- *
   * Deck
   * ---------------------------------------------------------------- */
  var deck = null;

  function nameQ(d, ask) {
    var shapeKey = U.pick(SHAPES_FOR[d]);
    var n = d === 2 ? 1 : U.rand(1, d - 1);
    var obj = U.pick(OBJ[shapeKey]);
    var c = ask === 'rest' ? d - n : n;
    return { type: 'name', d: d, n: n, ask: ask, c: c, shape: shapeKey, obj: obj, shaded: pickParts(d, n) };
  }

  function buildDeck() {
    var q = [];
    // Level 1 (questions 1–4): name the fraction coloured
    var ds = U.shuffle([3, 5, 10]);
    q.push(nameQ(U.pick([2, 4]), 'coloured'));
    q.push(nameQ(ds[0], 'coloured'));
    q.push(nameQ(ds[1], 'coloured'));
    q.push(nameQ(ds[2], 'rest'));
    // Level 2 (5–7): colour tenths and type fractions; shade fractions of trays
    var g = U.rand(2, 4);
    var y = U.pick([3, 4, 5].filter(function (v) { return v !== g && g + v <= 8; }));
    var l2 = [
      { type: 'tenths', g: g, y: y },
      { type: 'tray', t: U.pick(TRAYS_EASY) },
      { type: 'tray', t: U.pick(TRAYS_HARD) },
    ];
    q = q.concat([l2[0]].concat(U.shuffle(l2.slice(1))));
    // Level 3 (8–10): count sides and cut; shade more on a strip
    var sides = U.shuffle([3, 5, 10]);
    var half = Math.random() < 0.6;
    var a = half ? U.rand(1, 4) : U.rand(6, 8);
    q.push({ type: 'sides', s: sides[0] });
    q.push({ type: 'more', a: a, target: half ? 5 : 10 });
    q.push({ type: 'sides', s: sides[1] });
    return q;
  }

  /* ---------------------------------------------------------------- *
   * Practice question renderers
   * ---------------------------------------------------------------- */

  function renderName(stage, api, q) {
    var d = q.d, c = q.c;
    var askText = q.ask === 'rest' ? 'is <u>not</u> coloured' : 'is coloured';
    api.say(q.ask === 'rest' ? 'Look at the white parts this time!' : 'Count the equal parts. How many are coloured?', 'think');
    var box = el('div', { class: 'fc-q', 'data-type': 'name', 'data-answer': c + '/' + d });
    box.appendChild(MQ.ui.prompt('What fraction of the ' + q.obj.name + ' ' + askText + '?'));
    var sh = drawParts(MAKERS[q.shape](d), { base: q.obj.base, maxW: q.shape === 'bar' ? 360 : 250, maxH: 230 });
    q.shaded.forEach(function (i) {
      sh.fill(i, 'fc-on');
    });
    box.appendChild(sh.el);
    var opts = [c + '/' + d, d + '/' + c];
    var over = q.ask === 'rest' ? c + '/' + (d - c) : c + '/' + (d - c);
    if (d - c > 0) opts.push(over);
    if (q.ask === 'rest') opts.push(q.n + '/' + d);
    var uniq = [];
    opts.forEach(function (o) {
      if (uniq.indexOf(o) === -1) uniq.push(o);
    });
    if (uniq.length < 3) uniq.push(c + '/' + (d + 1));
    var options = U.shuffle(uniq).map(function (o) {
      var p = o.split('/');
      return { label: frac(p[0], p[1]), value: o };
    });
    var ch = MQ.ui.choices(options, function (v) {
      if (v === c + '/' + d) {
        ch.mark(v, 'good');
        ch.disable();
        api.check(true, 'Yes! ' + d + ' equal parts, ' + c + (q.ask === 'rest' ? ' not coloured' : ' coloured') + '. That is ' + c + '/' + d + '.');
        return;
      }
      ch.mark(v, 'bad');
      var strong = api.tries() >= 1;
      var what = q.ask === 'rest' ? 'not coloured' : 'coloured';
      if (v === d + '/' + c) {
        api.check(false, strong ? 'Upside down! The bottom number is ALL the parts: ' + d + '. The top number is the ' + what + ' parts: ' + c + '.' : 'The bottom number tells how many equal parts the whole ' + q.obj.name + ' has. Which number goes at the bottom?', TAG.swap);
      } else if (v === q.n + '/' + d && q.ask === 'rest') {
        api.check(false, strong ? 'That is the coloured part. Count only the WHITE parts for the top number.' : 'That is how much is coloured. Bolt asked about the parts that are NOT coloured.', TAG.rest);
      } else if (v === over) {
        api.check(false, strong ? 'The bottom number counts EVERY part, coloured and white. Count them all: there are ' + d + '.' : 'The bottom number is all the parts, not just the other ones. Count every part of the ' + q.obj.name + '.', TAG.over);
      } else {
        api.check(false, strong ? 'Count again, touching each part: there are ' + d + ' parts altogether.' : 'Count all the parts again carefully.', TAG.count);
      }
    }, { columns: options.length });
    ch.buttons.forEach(function (b) {
      b.setAttribute('data-val', b.value_);
    });
    box.appendChild(ch);
    stage.appendChild(box);
    api.onReveal(function () {
      ch.mark(c + '/' + d, 'good');
      ch.disable();
      var k = 0;
      for (var i = 0; i < d; i++) {
        var on = q.shaded.indexOf(i) !== -1;
        var counted = q.ask === 'rest' ? !on : on;
        if (counted) sh.label(i, ++k, 'fc-label-strong');
      }
      api.feedback(d + ' equal parts altogether, so ' + d + ' goes at the bottom. ' + c + ' parts are ' + (q.ask === 'rest' ? 'not coloured' : 'coloured') + ', so ' + c + ' goes on top: ' + c + '/' + d + '.', 'info');
    });
  }

  function renderTenths(stage, api, q) {
    var COLS = { g: { cls: 'fc-green', name: 'green', target: q.g }, y: { cls: 'fc-yellow', name: 'yellow', target: q.y } };
    var rest = 10 - q.g - q.y;
    api.say('Colour the plate first. Then write the fractions.', 'think');
    var box = el('div', { class: 'fc-q', 'data-type': 'tenths', 'data-g': q.g, 'data-y': q.y });
    box.appendChild(MQ.ui.prompt('Colour <b>' + q.g + '</b> parts green and <b>' + q.y + '</b> parts yellow.'));
    var paint = 'g';
    var state = U.range(0, 9).map(function () { return null; });
    var locked = false;
    var sh = drawParts(circleParts(10), {
      base: 'fc-base-plate',
      maxW: 240,
      maxH: 240,
      onPart: function (i) {
        if (locked) return;
        if (state[i] === paint) state[i] = null;
        else {
          if (count(paint) >= COLS[paint].target) {
            api.feedback('You already have ' + COLS[paint].target + ' ' + COLS[paint].name + '. Click a ' + COLS[paint].name + ' part to take it off.', 'info');
            return;
          }
          state[i] = paint;
        }
        api.sound('pop');
        sh.fill(i, state[i] ? COLS[state[i]].cls : null);
        update();
      },
    });
    function count(k) {
      return state.filter(function (s) { return s === k; }).length;
    }
    var counters = {};
    var paletteHelp = el('div', { class: 'fc-help' }, 'Pick a colour, then click the parts.');
    var palette = el('div', { class: 'fc-palette' });
    ['g', 'y'].forEach(function (k) {
      counters[k] = el('span', { class: 'fc-count' }, '0 / ' + COLS[k].target);
      var b = el('button', { class: 'fc-paint' + (k === paint ? ' fc-paint-on' : ''), type: 'button', 'data-paint': k, onclick: function () {
        paint = k;
        palette.querySelectorAll('.fc-paint').forEach(function (x) { x.classList.toggle('fc-paint-on', x === b); });
      } }, el('span', { class: 'fc-swatch ' + COLS[k].cls }), COLS[k].name, counters[k]);
      palette.appendChild(b);
    });
    var side = el('div', { class: 'fc-side-panel' }, paletteHelp, palette);
    box.appendChild(el('div', { class: 'fc-row' }, sh.el, side));
    stage.appendChild(box);

    var boxes = null;
    var answerRow = el('div', { class: 'fc-answers' });
    side.appendChild(answerRow);

    function update() {
      counters.g.textContent = count('g') + ' / ' + q.g;
      counters.y.textContent = count('y') + ' / ' + q.y;
      if (count('g') === q.g && count('y') === q.y && !boxes) showBoxes();
    }

    function showBoxes() {
      locked = true;
      sh.svg.classList.add('fc-locked');
      api.say('Now write a fraction for each colour.', 'think');
      api.feedback('Nice colouring! Now fill in the fractions.', 'info');
      boxes = {
        g: fracBox('green', 'fc-green'),
        y: fracBox('yellow', 'fc-yellow'),
        w: fracBox('not coloured', 'fc-white'),
      };
      var row = el('div', { class: 'fc-fboxes' }, boxes.g.el, boxes.y.el, boxes.w.el);
      var checkBtn = el('button', { class: 'btn fc-check', type: 'button', onclick: check }, 'Check');
      answerRow.appendChild(row);
      answerRow.appendChild(checkBtn);
      [boxes.g, boxes.y, boxes.w].forEach(function (b) {
        [b.num, b.den].forEach(function (inp) {
          inp.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
              e.preventDefault();
              check();
            }
          });
        });
      });
      api.later(function () {
        try { boxes.g.num.focus({ preventScroll: true }); } catch (e) {}
      }, 50);
      box.setAttribute('data-ready', '1');
    }

    function check() {
      if (api.isAnswered()) return;
      var want = { g: q.g, y: q.y, w: rest };
      var names = { g: 'green', y: 'yellow', w: 'not coloured' };
      var vals = {};
      var empty = false;
      ['g', 'y', 'w'].forEach(function (k) {
        vals[k] = boxes[k].val();
        if (isNaN(vals[k][0]) || isNaN(vals[k][1])) empty = true;
      });
      if (empty) {
        api.feedback('Fill in the top and bottom of all three fractions.', 'info');
        return;
      }
      var firstBad = null;
      ['g', 'y', 'w'].forEach(function (k) {
        var ok = vals[k][0] === want[k] && vals[k][1] === 10;
        boxes[k].mark(ok ? 'good' : 'bad');
        if (!ok && !firstBad) firstBad = k;
      });
      if (!firstBad) {
        ['g', 'y', 'w'].forEach(function (k) { boxes[k].disable(); });
        api.check(true, 'Yes! ' + q.g + '/10 + ' + q.y + '/10 + ' + rest + '/10 make 10/10: the whole plate.');
        return;
      }
      var v = vals[firstBad], w = want[firstBad], nm = names[firstBad];
      var strong = api.tries() >= 1;
      if (v[0] === 10 && v[1] === w) {
        api.check(false, strong ? 'The ' + nm + ' fraction is upside down. Put 10 (all the parts) at the bottom and ' + w + ' on top.' : 'Check the ' + nm + ' fraction: which number is ALL the parts of the plate? That one goes at the bottom.', TAG.swap);
      } else if (v[0] === w && v[1] === 10 - w) {
        api.check(false, strong ? 'For ' + nm + ', the bottom number is all 10 parts, not just the other parts: ' + w + '/10.' : 'Look at the bottom of the ' + nm + ' fraction. It should count EVERY part of the plate.', TAG.over);
      } else if (v[1] !== 10) {
        api.check(false, strong ? 'The plate has 10 equal parts, so every bottom number is 10.' : 'Count all the parts of the plate for the bottom number.', TAG.count);
      } else {
        api.check(false, strong ? 'Count the ' + nm + ' parts one by one: there are ' + w + '. That is the top number.' : 'Count the ' + nm + ' parts again for the top number.', TAG.count);
      }
    }

    api.onReveal(function () {
      locked = true;
      state = U.range(0, 9).map(function (i) { return i < q.g ? 'g' : i < q.g + q.y ? 'y' : null; });
      state.forEach(function (s, i) {
        sh.fill(i, s ? COLS[s].cls : null);
      });
      if (!boxes) showBoxes();
      update();
      boxes.g.set(q.g, 10);
      boxes.y.set(q.y, 10);
      boxes.w.set(rest, 10);
      ['g', 'y', 'w'].forEach(function (k) {
        boxes[k].mark('good');
        boxes[k].disable();
      });
      api.feedback('The plate has 10 equal parts, so every bottom number is 10. Count each colour for the top: ' + q.g + ' green, ' + q.y + ' yellow, ' + rest + ' white. ' + q.g + ' + ' + q.y + ' + ' + rest + ' = 10, so they make 10/10: one whole plate.', 'info');
    });
  }

  function trayGroups(t) {
    // returns groups: list of list of [col, row] squares
    var groups = [];
    for (var GR = 0; GR < t.GR; GR++) {
      for (var GC = 0; GC < t.GC; GC++) {
        var cells = [];
        for (var r = 0; r < t.gr; r++) for (var c = 0; c < t.gc; c++) cells.push([GC * t.gc + c, GR * t.gr + r]);
        groups.push({ cells: cells, gr: GR, gc: GC });
      }
    }
    return groups;
  }

  function renderTray(stage, api, q) {
    var t = q.t;
    var groups = trayGroups(t);
    var per = t.gr * t.gc;
    var total = per * t.d;
    api.say('Bolt split the tray into ' + t.d + ' equal groups. Click groups to colour them.', 'think');
    var box = el('div', { class: 'fc-q', 'data-type': 'tray', 'data-n': t.n, 'data-d': t.d });
    box.appendChild(MQ.ui.prompt('Colour ' + frac(t.n, t.d, 'fc-frac-inline') + ' of the tray.'));
    var cell = total >= 20 ? 40 : 52;
    var gap = 10;
    var cols = t.GC * t.gc, rows = t.GR * t.gr;
    var W = cols * cell + (t.GC - 1) * gap + 16;
    var H = rows * cell + (t.GR - 1) * gap + 16;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'fc-tray', style: { maxWidth: '100%', height: 'auto' } });
    var on = groups.map(function () { return false; });
    var gEls = groups.map(function (g, gi) {
      var ge = svg('g', { class: 'fc-group fc-group-' + (gi % 2 ? 'b' : 'a'), 'data-g': gi });
      var x0 = 8 + g.gc * (t.gc * cell + gap);
      var y0 = 8 + g.gr * (t.gr * cell + gap);
      ge.appendChild(svg('rect', { x: x0 - 3, y: y0 - 3, width: t.gc * cell + 6, height: t.gr * cell + 6, rx: 8, class: 'fc-group-bg' }));
      for (var r = 0; r < t.gr; r++) for (var c = 0; c < t.gc; c++) ge.appendChild(svg('rect', { x: x0 + c * cell + 2, y: y0 + r * cell + 2, width: cell - 4, height: cell - 4, rx: 5, class: 'fc-sq' }));
      ge.addEventListener('click', function () {
        if (api.isAnswered()) return;
        on[gi] = !on[gi];
        ge.classList.toggle('fc-group-on', on[gi]);
        api.sound('pop');
        counter.textContent = 'Groups coloured: ' + on.filter(Boolean).length + ' of ' + t.d;
      });
      root.appendChild(ge);
      return ge;
    });
    var counter = el('div', { class: 'fc-counter' }, 'Groups coloured: 0 of ' + t.d);
    var checkBtn = el('button', { class: 'btn fc-check', type: 'button', onclick: check }, 'Check');
    box.appendChild(el('div', { class: 'fc-shape-box' }, root));
    box.appendChild(el('div', { class: 'fc-tray-note' }, t.d + ' equal groups of ' + per + (per === 1 ? ' square' : ' squares')));
    box.appendChild(el('div', { class: 'fc-check-row' }, counter, checkBtn));
    stage.appendChild(box);

    function sumText(n) {
      var parts = [];
      for (var i = 0; i < n; i++) parts.push(per);
      return per === 1 ? n + (n === 1 ? ' square' : ' squares') : parts.join(' + ') + ' = ' + n * per + ' squares';
    }

    function check() {
      if (api.isAnswered()) return;
      var k = on.filter(Boolean).length;
      if (k === 0) {
        api.feedback('Click a group to colour it.', 'info');
        return;
      }
      if (k === t.n) {
        api.check(true, 'Yes! ' + t.n + ' of ' + t.d + ' equal groups. That is ' + sumText(t.n) + ' coloured, and ' + (total - t.n * per) + ' left white.');
        return;
      }
      var strong = api.tries() >= 1;
      if (k === t.d - t.n && t.d - t.n !== t.n) {
        api.check(false, strong ? 'The TOP number says how many groups to colour: ' + t.n + '. You coloured ' + k + '.' : 'You coloured the part that should stay white. The top number is how many groups to colour.', TAG.over);
      } else {
        api.check(false, strong ? 'Colour exactly ' + t.n + ' of the ' + t.d + ' groups. You have ' + k + ' now.' : 'The top number, ' + t.n + ', tells you how many groups to colour.', TAG.count);
      }
    }

    api.onReveal(function () {
      on = groups.map(function (g, i) { return i < t.n; });
      gEls.forEach(function (ge, i) {
        ge.classList.toggle('fc-group-on', on[i]);
      });
      counter.textContent = 'Groups coloured: ' + t.n + ' of ' + t.d;
      checkBtn.disabled = true;
      api.feedback('The bottom number ' + t.d + ' means ' + t.d + ' equal groups. The top number ' + t.n + ' means colour ' + t.n + ' of them: ' + sumText(t.n) + '.', 'info');
    });
  }

  function cutPicture(kind, s) {
    var shape;
    if (kind === 'good') shape = polyParts(s);
    else if (kind === 'unequal') shape = polyOffParts(s);
    else shape = s === 3 ? triMidParts() : s === 5 ? polyMidParts(5) : polySkipParts(10);
    return drawParts(shape, { base: 'fc-base-tile', maxW: 130, maxH: 120, pad: 4 });
  }

  function renderSides(stage, api, q) {
    var s = q.s;
    var name = SIDES_NAME[s];
    var box = el('div', { class: 'fc-q', 'data-type': 'sides', 'data-s': s });
    var promptEl = MQ.ui.prompt('Click each side of the ' + name + ' tile to count its sides.');
    box.appendChild(promptEl);
    var counted = 0;
    var step = 'sides';
    var main = drawParts(polyParts(s), { base: 'fc-base-tile', maxW: 240, maxH: 230, sides: true, pad: 26 });
    main.svg.classList.add('fc-uncut');
    var sideCount = el('div', { class: 'fc-counter' }, 'Sides counted: 0');
    var panel = el('div', { class: 'fc-side-panel fc-steps' }, sideCount);
    box.appendChild(el('div', { class: 'fc-row' }, main.el, panel));
    stage.appendChild(box);
    api.say('First count the sides of this tile.', 'think');
    var coloured = [];

    main.sides.forEach(function (ln) {
      ln.addEventListener('click', function () {
        if (step !== 'sides' || ln.done) return;
        ln.done = true;
        counted++;
        ln.classList.add('fc-side-done');
        main.labelPoint(ln.midAt[0] + (ln.midAt[0] - main.W / 2) * 0.12, ln.midAt[1] + (ln.midAt[1] - main.H / 2) * 0.12, counted);
        api.sound('pop');
        sideCount.textContent = 'Sides counted: ' + counted;
        if (counted === s) showCuts();
      });
    });

    var cutCh = null;
    function showCuts() {
      step = 'cut';
      api.say(s + ' sides! So we need ' + s + ' equal parts.', 'happy');
      promptEl.innerHTML = 'It has <b>' + s + '</b> sides. Which cut makes <b>' + s + ' equal parts</b>?';
      var kinds = U.shuffle(['good', 'unequal', 'count']);
      cutCh = MQ.ui.choices(kinds.map(function (k) {
        return { label: cutPicture(k, s).svg, value: k };
      }), function (v) {
        if (step !== 'cut') return;
        if (v === 'good') {
          cutCh.mark(v, 'good');
          cutCh.disable();
          showColour();
          return;
        }
        cutCh.mark(v, 'bad');
        var strong = api.tries() >= 1;
        if (v === 'unequal') api.check(false, strong ? 'In that one the lines do not start in the middle, so some parts are big and some are small. Pick the one where every part is the same.' : 'Look closely: are all the parts in that one the same size?', TAG.unequal);
        else api.check(false, strong ? 'Count the parts in that one: it does not have ' + s + '. We need one part for each side: ' + s + ' parts.' : 'Count the parts in that picture. We need ' + s + ' equal parts.', TAG.count);
      }, { columns: 3 });
      cutCh.classList.add('fc-cut-choices');
      cutCh.buttons.forEach(function (b) {
        b.setAttribute('data-val', b.value_);
      });
      panel.appendChild(cutCh);
    }

    var fracCh = null;
    function showColour() {
      step = 'colour';
      MQ.clear(panel);
      // re-draw the main tile cut into s equal parts
      var cutShape = drawParts(polyParts(s), {
        base: 'fc-base-tile',
        maxW: 240,
        maxH: 230,
        onPart: function (i) {
          if (step !== 'colour') return;
          var at = coloured.indexOf(i);
          if (at !== -1) coloured.splice(at, 1);
          else if (coloured.length < 2) coloured.push(i);
          else {
            api.feedback('Just 2 parts. Click a coloured part to take it off.', 'info');
            return;
          }
          api.sound('pop');
          cutShape.fill(i, at === -1 ? 'fc-on' : null);
          if (coloured.length === 2) showFractions();
        },
      });
      main.el.replaceWith(cutShape.el);
      main = cutShape;
      promptEl.innerHTML = 'Now colour <b>2</b> of the parts.';
      api.say('Good cut! Every part is the same. Now colour 2 parts.', 'happy');
    }

    function showFractions() {
      if (fracCh) return;
      step = 'name';
      promptEl.innerHTML = 'What fraction of the tile is coloured?';
      api.say('Now name the fraction.', 'think');
      var opts = U.shuffle([2 + '/' + s, s + '/' + 2, 2 + '/' + (s - 2)]);
      fracCh = MQ.ui.choices(opts.map(function (o) {
        var p = o.split('/');
        return { label: frac(p[0], p[1]), value: o };
      }), function (v) {
        if (v === 2 + '/' + s) {
          fracCh.mark(v, 'good');
          fracCh.disable();
          step = 'done';
          api.check(true, 'Yes! ' + s + ' sides, ' + s + ' equal parts, 2 coloured: 2/' + s + '.');
          return;
        }
        fracCh.mark(v, 'bad');
        var strong = api.tries() >= 1;
        if (v === s + '/2') api.check(false, strong ? 'Upside down! ' + s + ' parts altogether goes at the bottom, 2 coloured goes on top.' : 'Which number is ALL the parts? That one goes at the bottom.', TAG.swap);
        else api.check(false, strong ? 'The bottom number is ALL ' + s + ' parts, not just the white ones.' : 'The bottom number counts every part, coloured and white.', TAG.over);
      }, { columns: 3 });
      fracCh.buttons.forEach(function (b) {
        b.setAttribute('data-val', b.value_);
      });
      panel.appendChild(fracCh);
    }

    api.onReveal(function () {
      step = 'done';
      MQ.clear(panel);
      var shown = drawParts(polyParts(s), { base: 'fc-base-tile', maxW: 240, maxH: 230 });
      shown.fill(0, 'fc-on');
      shown.fill(1, 'fc-on');
      for (var i = 0; i < s; i++) shown.label(i, i + 1, i < 2 ? 'fc-label-strong' : '');
      main.el.replaceWith(shown.el);
      main = shown;
      promptEl.innerHTML = 'The ' + name + ' has <b>' + s + '</b> sides, so cut it from the middle to each corner: <b>' + s + '</b> equal parts.';
      panel.appendChild(el('div', { class: 'fc-big-answer', html: '2 coloured of ' + s + ' equal parts = ' + frac(2, s, 'fc-frac-big') }));
      api.feedback('Lines from the centre to each corner make ' + s + ' equal parts. 2 are coloured, so the fraction is 2/' + s + '.', 'info');
    });
  }

  function renderMore(stage, api, q) {
    var a = q.a, b = q.target - q.a;
    var half = q.target === 5;
    var box = el('div', { class: 'fc-q', 'data-type': 'more', 'data-a': a, 'data-b': b });
    var promptEl = MQ.ui.prompt('<b>' + a + '</b> boxes are coloured. Colour <b>' + b + '</b> more.');
    box.appendChild(promptEl);
    api.say('Colour ' + b + ' more boxes on the strip.', 'think');
    var state = U.range(0, 9).map(function (i) { return i < a ? 'old' : null; });
    var added = 0;
    var step = 'colour';
    var sh = drawParts(trayParts(1, 10), {
      base: 'fc-base-strip',
      maxW: 600,
      maxH: 100,
      onPart: function (i) {
        if (step !== 'colour' || state[i] === 'old') return;
        if (state[i] === 'new') {
          state[i] = null;
          added--;
        } else {
          if (added >= b) {
            api.feedback('That is ' + b + ' already. Click a new box to take it off.', 'info');
            return;
          }
          state[i] = 'new';
          added++;
        }
        api.sound('pop');
        sh.fill(i, state[i] ? 'fc-on' : null);
        if (added === b) showOptions();
      },
    });
    for (var i = 0; i < a; i++) {
      sh.fill(i, 'fc-on');
      sh.paths[i].classList.add('fc-old');
    }
    box.appendChild(sh.el);
    var area = el('div', { class: 'fc-more-area' });
    box.appendChild(area);
    stage.appendChild(box);
    var ch = null;

    function showOptions() {
      step = 'name';
      promptEl.innerHTML = 'How much of the strip is coloured now?';
      api.say(half ? 'Which fraction shows how much is coloured?' : 'Every box is coloured! What is that?', 'think');
      var options;
      if (half) {
        options = [
          { label: frac(5, 10), value: '5/10', ok: true },
          { label: frac(1, 2), value: '1/2', ok: true },
          { label: frac(a, 10), value: 'a', ok: false },
          { label: frac(5, 5), value: '5/5', ok: false },
        ];
      } else {
        options = [
          { label: frac(10, 10) + '<span class="fc-opt-text">= 1 whole strip</span>', value: 'whole', ok: true },
          { label: frac(10, 10) + '<span class="fc-opt-text">= 10 strips</span>', value: 'ten', ok: false },
          { label: frac(a, 10), value: 'a', ok: false },
          { label: frac(b, 10), value: 'b', ok: false },
        ];
      }
      options = U.shuffle(options);
      ch = MQ.ui.choices(options, function (v) {
        var picked = options.filter(function (o) { return o.value === v; })[0];
        if (picked.ok) {
          ch.mark(v, 'good');
          ch.disable();
          step = 'done';
          api.check(true, half ? 'Yes! 5 of 10 boxes is 5/10, and that is the same as 1/2: half the strip!' : 'Yes! 10/10 is all the parts: one whole strip!');
          return;
        }
        ch.mark(v, 'bad');
        var strong = api.tries() >= 1;
        if (v === 'a') api.check(false, strong ? 'Count ALL the coloured boxes, the ' + a + ' from before and the ' + b + ' new ones.' : 'Did you count the new boxes too?', TAG.count);
        else if (v === 'b') api.check(false, strong ? 'Count ALL the coloured boxes, old and new: ' + a + ' and ' + b + ' more.' : 'Count the boxes that were coloured before too.', TAG.count);
        else if (v === 'ten') api.check(false, strong ? 'It is still just ONE strip. All 10 of its 10 parts are coloured, so 10/10 is 1 whole.' : 'How many strips are there? Just one!', TAG.whole);
        else api.check(false, strong ? 'The bottom number is ALL 10 boxes, not the white ones. 5 of 10 boxes is coloured.' : 'The bottom number counts every box on the strip.', TAG.over);
      }, { columns: 4 });
      ch.classList.add('fc-more-choices');
      ch.buttons.forEach(function (bt) {
        var o = options.filter(function (x) { return x.value === bt.value_; })[0];
        bt.setAttribute('data-val', bt.value_);
        if (o.ok) bt.setAttribute('data-ok', '1');
      });
      area.appendChild(ch);
    }

    api.onReveal(function () {
      step = 'done';
      for (var i = 0; i < 10; i++) {
        if (state[i] === null && added < b) {
          state[i] = 'new';
          added++;
          sh.fill(i, 'fc-on');
        }
      }
      if (!ch) showOptions();
      ch.buttons.forEach(function (bt) {
        if (bt.getAttribute('data-ok')) bt.classList.add('good');
      });
      ch.disable();
      // a sorted strip with a halves bar underneath shows the working
      var sorted = drawParts(trayParts(1, 10), { base: 'fc-base-strip', maxW: 600, maxH: 100 });
      for (var j = 0; j < q.target; j++) sorted.fill(j, 'fc-on');
      area.appendChild(el('div', { class: 'fc-reveal-cap' }, 'Put the coloured boxes together:'));
      area.appendChild(sorted.el);
      if (half) {
        var halves = drawParts({ kind: 'tray', parts: [[[0, 0], [5, 0], [5, 1], [0, 1]], [[5, 0], [10, 0], [10, 1], [5, 1]]] }, { base: 'fc-base-strip', maxW: 600, maxH: 100 });
        halves.fill(0, 'fc-on');
        halves.label(0, '1/2');
        area.appendChild(halves.el);
        api.feedback('5 coloured and 5 white: the same amount each. 5/10 is the same as 1/2.', 'info');
      } else {
        api.feedback('All 10 of the 10 equal boxes are coloured: 10/10. That is one whole strip.', 'info');
      }
    });
  }

  /* ---------------------------------------------------------------- *
   * Activity
   * ---------------------------------------------------------------- */
  function bigFrac(numText, denText) {
    var num = el('span', { class: 'fc-bf-n' }, numText);
    var den = el('span', { class: 'fc-bf-d' }, denText);
    var node = el('div', { class: 'fc-bigfrac' }, num, el('span', { class: 'fc-bf-line' }), den);
    return { el: node, num: num, den: den };
  }

  MQ.register('fraction-colour-in', {
    learn: [
      // 1. Count the parts: the denominator
      function (stage, api) {
        api.lockNext();
        api.say('This cake is cut into equal slices. Click each slice to count them!');
        stage.appendChild(MQ.ui.lesson('Count the parts', 'Click every slice of the cake.'));
        var counted = 0;
        var bf = bigFrac('', '?');
        var sh = drawParts(circleParts(5), {
          base: 'fc-base-cake',
          maxW: 250,
          maxH: 250,
          onPart: function (i, p) {
            if (p.done) return;
            p.done = true;
            counted++;
            p.classList.add('fc-lit');
            sh.label(i, counted);
            api.sound('pop');
            if (counted === 5) {
              bf.den.textContent = '5';
              bf.den.classList.add('fc-drop');
              api.say('5 equal slices! The bottom number is 5. It is called the denominator.', 'cheer');
              api.feedback('The <b>denominator</b> (bottom number) tells how many equal parts make the whole.', 'good');
              api.unlockNext();
            }
          },
        });
        var note = el('div', { class: 'fc-note' }, 'bottom number = how many equal parts');
        stage.appendChild(el('div', { class: 'fc-row' }, sh.el, el('div', { class: 'fc-frac-card' }, bf.el, note)));
      },

      // 2. Colour and count: the numerator
      function (stage, api) {
        api.lockNext();
        var steps = [
          { cls: 'fc-red', name: 'red', n: 1 },
          { cls: 'fc-blue', name: 'blue', n: 2 },
        ];
        var stepI = 0;
        var done = 0;
        var colourOf = [null, null, null, null, null];
        api.say('Click 1 slice to paint it red.');
        stage.appendChild(MQ.ui.lesson('Colour and count', 'The top number counts the parts we are talking about.'));
        var cards = {};
        var cardRow = el('div', { class: 'fc-cards' });
        [{ cls: 'fc-red', name: 'red' }, { cls: 'fc-blue', name: 'blue' }, { cls: 'fc-green', name: 'green' }].forEach(function (c) {
          var bf = bigFrac('?', '5');
          cards[c.name] = bf;
          cardRow.appendChild(el('div', { class: 'fc-frac-card fc-small-card' }, el('div', { class: 'fc-card-name' }, el('span', { class: 'fc-swatch ' + c.cls }), c.name), bf.el));
        });
        var sh = drawParts(circleParts(5), {
          base: 'fc-base-cake',
          maxW: 230,
          maxH: 230,
          onPart: function (i) {
            if (stepI >= steps.length || colourOf[i]) return;
            var st = steps[stepI];
            colourOf[i] = st.name;
            sh.fill(i, st.cls);
            done++;
            api.sound('pop');
            cards[st.name].num.textContent = String(done);
            if (done === st.n) {
              cards[st.name].num.classList.add('fc-drop');
              stepI++;
              done = 0;
              if (stepI === 1) {
                api.say('1 red slice out of 5: that is 1/5. Now click 2 slices to paint them blue.');
              } else {
                colourOf.forEach(function (c, k) {
                  if (!c) {
                    colourOf[k] = 'green';
                    sh.fill(k, 'fc-green');
                  }
                });
                cards.green.num.textContent = '2';
                cards.green.num.classList.add('fc-drop');
                api.say('2 blue out of 5 is 2/5. The other 2 slices are green: 2/5.', 'cheer');
                api.feedback('The <b>numerator</b> (top number) counts the parts of that colour. The bottom stays 5.', 'good');
                api.unlockNext();
              }
            }
          },
        });
        stage.appendChild(el('div', { class: 'fc-row' }, sh.el, cardRow));
      },

      // 3. Back to one whole
      function (stage, api) {
        api.lockNext();
        api.say('Let\'s put the cake back together!');
        stage.appendChild(MQ.ui.lesson('All the parts make one whole', 'Push the slices back together.'));
        var colours = ['fc-red', 'fc-blue', 'fc-blue', 'fc-green', 'fc-green'];
        var sh = drawParts(circleParts(5), { base: 'fc-base-cake', maxW: 250, maxH: 250, pad: 26 });
        sh.paths.forEach(function (p, i) {
          sh.fill(i, colours[i]);
          var groupMid = i === 0 ? p.mid : i <= 2 ? (sh.paths[1].mid + sh.paths[2].mid) / 2 : (sh.paths[3].mid + sh.paths[4].mid) / 2;
          p.style.transform = 'translate(' + (Math.cos(groupMid) * 20).toFixed(1) + 'px,' + (Math.sin(groupMid) * 20).toFixed(1) + 'px)';
          p.classList.add('fc-slide');
        });
        var eq = el('div', { class: 'fc-eq', html: frac(1, 5) + '<span class="fc-op">+</span>' + frac(2, 5) + '<span class="fc-op">+</span>' + frac(2, 5) + '<span class="fc-op">=</span><span class="fc-q-mark">?</span>' });
        var btn = el('button', { class: 'btn btn-big', type: 'button' }, 'Push together');
        var askBox = el('div', { class: 'fc-ask' });
        stage.appendChild(el('div', { class: 'fc-row' }, sh.el, el('div', { class: 'fc-side-panel' }, eq, btn)));
        stage.appendChild(askBox);
        btn.addEventListener('click', function () {
          btn.disabled = true;
          sh.paths.forEach(function (p) {
            p.style.transform = 'translate(0px,0px)';
          });
          api.sound('pop');
          api.later(function () {
            eq.innerHTML = frac(1, 5) + '<span class="fc-op">+</span>' + frac(2, 5) + '<span class="fc-op">+</span>' + frac(2, 5) + '<span class="fc-op">=</span>' + frac(5, 5, 'fc-frac-hl');
            api.say('1 + 2 + 2 = 5 slices. 5/5 is every slice! Is that the whole cake?', 'think');
            askBox.appendChild(MQ.ui.prompt(frac(5, 5, 'fc-frac-inline') + ' is the same as…'));
            var ch = MQ.ui.choices([
              { label: '1 whole cake', value: 'one' },
              { label: '5 cakes', value: 'five' },
              { label: 'half a cake', value: 'half' },
            ], function (v) {
              if (v === 'one') {
                ch.mark(v, 'good');
                ch.disable();
                api.say('Yes! 5/5 is one whole cake. 10/10 would be one whole too!', 'cheer');
                api.feedback('All the equal parts together make <b>one whole</b>.', 'good');
                api.unlockNext();
              } else {
                ch.mark(v, 'bad');
                api.feedback('Look at the picture: it is still just one cake, with every slice there.', 'try');
              }
            }, { columns: 3 });
            askBox.appendChild(ch);
          }, 700);
        });
      },
    ],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'name') renderName(stage, api, q);
        else if (q.type === 'tenths') renderTenths(stage, api, q);
        else if (q.type === 'tray') renderTray(stage, api, q);
        else if (q.type === 'sides') renderSides(stage, api, q);
        else renderMore(stage, api, q);
      },
    },
  });

  // exposed for tests only (deck checking)
  MQ.dev_fc = { buildDeck: buildDeck, trayGroups: trayGroups };

  var css = [
    '.fc-q{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.fc-row{display:flex;align-items:center;justify-content:center;gap:24px;flex-wrap:wrap;width:100%}',
    '.fc-shape-box{display:flex;justify-content:center;max-width:100%}',
    '.fc-shape{display:block}',
    '.fc-part{stroke:#6b5a3e;stroke-width:2.5;stroke-linejoin:round;fill:var(--fc-base,#fff);transition:fill .15s ease}',
    '.fc-base-cake{--fc-base:#fdebd0}',
    '.fc-base-pizza{--fc-base:#ffe2a8}',
    '.fc-base-plate{--fc-base:#ffffff}',
    '.fc-base-tile{--fc-base:#f1f5ff}',
    '.fc-base-choc{--fc-base:#f3e3d3}',
    '.fc-base-tray{--fc-base:#eaf6ff}',
    '.fc-base-strip{--fc-base:#ffffff}',
    '.fc-click{cursor:pointer}',
    '.fc-click:hover{filter:brightness(.94)}',
    '.fc-locked .fc-click{cursor:default}',
    '.fc-part.fc-on{fill:#ff9f43}',
    '.fc-part.fc-red{fill:#ef5350}',
    '.fc-part.fc-blue{fill:#42a5f5}',
    '.fc-part.fc-green{fill:#66bb6a}',
    '.fc-part.fc-yellow{fill:#ffd54f}',
    '.fc-part.fc-lit{fill:#ffe6a6}',
    '.fc-part.fc-old{stroke:#6b5a3e}',
    '.fc-slide{transition:transform .6s ease, fill .15s ease}',
    '.fc-num-label{font-weight:800;fill:#1b2a4a;pointer-events:none;paint-order:stroke;stroke:#fff;stroke-width:4px}',
    '.fc-label-strong{fill:#7a2e00}',
    '.fc-side-label{font-size:18px}',
    '.fc-side{stroke:#1b2a4a;stroke-width:4;stroke-linecap:round;cursor:pointer}',
    '.fc-side:hover{stroke:#ff9f43;stroke-width:8}',
    '.fc-side-done{stroke:#ff9f43;stroke-width:7}',
    '.fc-uncut .fc-part{stroke:none}',
    '.fc-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;font-weight:800;font-size:1.35rem;margin:0 2px}',
    '.fc-frac .fc-fn{padding:0 4px}',
    '.fc-frac .fc-fd{border-top:3px solid currentColor;padding:1px 4px 0}',
    '.fc-frac-inline{font-size:1.25rem;color:#0b6e66}',
    '.fc-frac-big{font-size:2rem;color:#0b6e66}',
    '.fc-frac-hl{color:#0b6e66;background:#fff3cd;border-radius:8px;padding:2px 6px}',
    '.choice .fc-frac{font-size:1.6rem}',
    '.fc-opt-text{display:block;font-size:.95rem;margin-top:4px}',
    '.fc-frac-card{display:flex;flex-direction:column;align-items:center;gap:8px;background:#fff;border:3px solid var(--line);border-radius:16px;padding:14px 22px}',
    '.fc-small-card{padding:10px 16px}',
    '.fc-cards{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}',
    '.fc-card-name{display:flex;align-items:center;gap:6px;font-weight:800}',
    '.fc-bigfrac{display:flex;flex-direction:column;align-items:center;font-size:2.6rem;font-weight:800;line-height:1.1;min-width:70px}',
    '.fc-bf-n,.fc-bf-d{min-height:1.15em;min-width:1.2em;text-align:center}',
    '.fc-bf-line{display:block;width:100%;min-width:64px;border-top:5px solid var(--ink);margin:4px 0}',
    '.fc-drop{color:#0b6e66;animation:fcDrop .45s ease}',
    '@keyframes fcDrop{0%{transform:translateY(-18px);opacity:0}100%{transform:none;opacity:1}}',
    '.fc-note{font-size:.95rem;color:var(--ink-soft);max-width:180px;text-align:center}',
    '.fc-swatch{display:inline-block;width:18px;height:18px;border-radius:5px;border:2px solid #6b5a3e;vertical-align:middle}',
    '.fc-swatch.fc-red{background:#ef5350}.fc-swatch.fc-blue{background:#42a5f5}.fc-swatch.fc-green{background:#66bb6a}.fc-swatch.fc-yellow{background:#ffd54f}.fc-swatch.fc-white{background:#fff}',
    '.fc-eq{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;font-size:1.3rem}',
    '.fc-eq .fc-frac{font-size:1.7rem}',
    '.fc-op{font-size:1.6rem;font-weight:800;color:var(--ink-soft)}',
    '.fc-q-mark{font-size:1.8rem;font-weight:800;color:var(--ink-soft)}',
    '.fc-ask{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}',
    '.fc-side-panel{display:flex;flex-direction:column;align-items:center;gap:12px;min-width:0;max-width:100%}',
    '.fc-palette{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.fc-paint{display:flex;align-items:center;gap:8px;font:inherit;font-weight:800;font-size:1.05rem;padding:8px 14px;border-radius:12px;border:3px solid var(--line);background:#fff;color:var(--ink);cursor:pointer}',
    '.fc-paint-on{border-color:var(--ink);box-shadow:0 0 0 3px #ffe7a3}',
    '.fc-count{font-size:.9rem;color:var(--ink-soft);background:var(--paper-2);border-radius:8px;padding:1px 6px}',
    '.fc-answers{display:flex;flex-direction:column;align-items:center;gap:10px}',
    '.fc-fboxes{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}',
    '.fc-fbox{display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 10px;border:3px solid var(--line);border-radius:14px;background:#fff}',
    '.fc-fbox.fc-good{border-color:var(--good);background:var(--good-bg)}',
    '.fc-fbox.fc-bad{border-color:var(--try);background:var(--try-bg)}',
    '.fc-fbox-label{display:flex;align-items:center;gap:6px;font-weight:800;font-size:.95rem}',
    '.fc-fstack{display:flex;flex-direction:column;align-items:center;gap:4px}',
    '.fc-fin{width:58px;height:46px;font-size:1.5rem;font-weight:800;text-align:center;border:3px solid var(--line);border-radius:10px;font-family:inherit;color:var(--ink)}',
    '.fc-fin:focus{outline:3px solid var(--gold);outline-offset:1px}',
    '.fc-fline{display:block;width:70px;border-top:4px solid var(--ink)}',
    '.fc-check-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:center}',
    '.fc-counter{font-weight:800;font-size:1.1rem;color:var(--ink-soft)}',
    '.fc-tray{display:block}',
    '.fc-group{cursor:pointer}',
    '.fc-group-bg{fill:none;stroke:#7a8bb5;stroke-width:3}',
    '.fc-sq{stroke:#6b7ba6;stroke-width:1.5}',
    '.fc-group-a .fc-sq{fill:#e3f0ff}',
    '.fc-group-b .fc-sq{fill:#fde7f1}',
    '.fc-group:hover .fc-sq{filter:brightness(.95)}',
    '.fc-group-on .fc-sq{fill:#ff9f43}',
    '.fc-group-on .fc-group-bg{stroke:#c45f00}',
    '.fc-tray-note{color:var(--ink-soft);font-weight:700}',
    '.fc-cut-choices{max-width:520px}',
    '.fc-cut-choices .choice{display:flex;justify-content:center;align-items:center;padding:8px}',
    '.fc-cut-choices svg{max-width:100%;height:auto}',
    '.fc-steps{width:min(520px,100%)}',
    '.fc-big-answer{font-size:1.3rem;font-weight:800;display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.fc-more-area{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.fc-more-choices{max-width:700px}',
    '.fc-help{color:var(--ink-soft);font-weight:700}',
    '.fc-reveal-cap{font-weight:800;color:var(--ink-soft)}',
    '.fc-check{min-width:120px}',
    '@media (max-width:640px){.fc-row{gap:12px}.fc-bigfrac{font-size:2.1rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'fraction-colour-in' }, css));
})();

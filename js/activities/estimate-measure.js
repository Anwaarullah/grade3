/* Estimate and Measure — guess a length first, then measure it with a ruler (Unit 6.1). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var CM = 32; // on-screen pixels (SVG units) per centimetre

  /* ------------------------------------------------------------------ *
   * Everyday objects drawn horizontally, exactly `len` px long, from x0.
   * ------------------------------------------------------------------ */
  var OBJECTS = [
    { id: 'eraser', name: 'eraser', min: 3, max: 6, draw: drawEraser },
    { id: 'key', name: 'key', min: 4, max: 8, draw: drawKey },
    { id: 'crayon', name: 'crayon', min: 5, max: 10, draw: drawCrayon },
    { id: 'pencil', name: 'pencil', min: 7, max: 18, draw: drawPencil },
    { id: 'straw', name: 'straw', min: 10, max: 18, draw: drawStraw },
    { id: 'spoon', name: 'spoon', min: 11, max: 18, draw: drawSpoon },
    { id: 'brush', name: 'paintbrush', min: 12, max: 18, draw: drawBrush },
    { id: 'toothbrush', name: 'toothbrush', min: 15, max: 18, draw: drawToothbrush },
  ];

  function drawEraser(g, x0, len, y) {
    g.appendChild(svg('rect', { x: x0, y: y - 14, width: len, height: 28, rx: 5, fill: '#f6a6b2', stroke: '#c96a7a', 'stroke-width': 2 }));
    g.appendChild(svg('rect', { x: x0 + len * 0.45, y: y - 14, width: len * 0.55, height: 28, fill: '#8ecae6', stroke: '#4d8fb0', 'stroke-width': 2 }));
  }
  function drawKey(g, x0, len, y) {
    var r = 15;
    g.appendChild(svg('rect', { x: x0 + r, y: y - 5, width: len - r, height: 10, fill: '#d4a72c', stroke: '#8a6a10', 'stroke-width': 2 }));
    var tx = x0 + len;
    g.appendChild(svg('polygon', { points: [tx - 30, y + 5, tx - 30, y + 14, tx - 22, y + 10, tx - 16, y + 16, tx - 8, y + 9, tx, y + 5].join(' '), fill: '#d4a72c', stroke: '#8a6a10', 'stroke-width': 2 }));
    g.appendChild(svg('circle', { cx: x0 + r, cy: y, r: r, fill: '#e9c04a', stroke: '#8a6a10', 'stroke-width': 2 }));
    g.appendChild(svg('circle', { cx: x0 + r - 4, cy: y, r: 5, fill: '#fff', stroke: '#8a6a10', 'stroke-width': 2 }));
  }
  function drawCrayon(g, x0, len, y) {
    var tip = 22;
    g.appendChild(svg('rect', { x: x0, y: y - 11, width: len - tip, height: 22, rx: 4, fill: '#e63946', stroke: '#a3212c', 'stroke-width': 2 }));
    g.appendChild(svg('rect', { x: x0 + 10, y: y - 11, width: (len - tip) * 0.6, height: 22, fill: '#ffd6d9', stroke: '#a3212c', 'stroke-width': 2 }));
    g.appendChild(svg('polygon', { points: [x0 + len - tip, y - 11, x0 + len, y - 2, x0 + len, y + 2, x0 + len - tip, y + 11].join(' '), fill: '#e63946', stroke: '#a3212c', 'stroke-width': 2 }));
  }
  function drawPencil(g, x0, len, y) {
    var cone = 30;
    g.appendChild(svg('rect', { x: x0, y: y - 11, width: 14, height: 22, rx: 4, fill: '#f6a6b2', stroke: '#b5707b', 'stroke-width': 2 }));
    g.appendChild(svg('rect', { x: x0 + 12, y: y - 11, width: 10, height: 22, fill: '#b8c0cc', stroke: '#6b7280', 'stroke-width': 2 }));
    g.appendChild(svg('rect', { x: x0 + 22, y: y - 11, width: len - 22 - cone, height: 22, fill: '#ffc93c', stroke: '#b8860b', 'stroke-width': 2 }));
    g.appendChild(svg('polygon', { points: [x0 + len - cone, y - 11, x0 + len, y, x0 + len - cone, y + 11].join(' '), fill: '#f1d2a6', stroke: '#b8860b', 'stroke-width': 2 }));
    g.appendChild(svg('polygon', { points: [x0 + len - 10, y - 3.7, x0 + len, y, x0 + len - 10, y + 3.7].join(' '), fill: '#333' }));
  }
  function drawStraw(g, x0, len, y) {
    g.appendChild(svg('rect', { x: x0, y: y - 7, width: len, height: 14, rx: 3, fill: '#fff', stroke: '#2b6cb0', 'stroke-width': 2 }));
    for (var x = x0 + 8; x < x0 + len - 6; x += 16) g.appendChild(svg('line', { x1: x, y1: y - 6, x2: x + 6, y2: y + 6, stroke: '#2b6cb0', 'stroke-width': 4 }));
  }
  function drawSpoon(g, x0, len, y) {
    var bowl = 70;
    g.appendChild(svg('path', { d: 'M' + x0 + ' ' + (y - 6) + ' L' + (x0 + len - bowl + 6) + ' ' + (y - 3) + ' L' + (x0 + len - bowl + 6) + ' ' + (y + 3) + ' L' + x0 + ' ' + (y + 6) + ' Z', fill: '#c9d3e6', stroke: '#6b7a99', 'stroke-width': 2 }));
    g.appendChild(svg('ellipse', { cx: x0 + len - bowl / 2, cy: y, rx: bowl / 2, ry: 19, fill: '#dbe3f2', stroke: '#6b7a99', 'stroke-width': 2 }));
  }
  function drawBrush(g, x0, len, y) {
    var bristle = 34;
    var ferrule = 24;
    g.appendChild(svg('path', { d: 'M' + x0 + ' ' + (y - 4) + ' L' + (x0 + len - bristle - ferrule) + ' ' + (y - 8) + ' L' + (x0 + len - bristle - ferrule) + ' ' + (y + 8) + ' L' + x0 + ' ' + (y + 4) + ' Z', fill: '#2a9d8f', stroke: '#1d6b62', 'stroke-width': 2 }));
    g.appendChild(svg('rect', { x: x0 + len - bristle - ferrule, y: y - 8, width: ferrule, height: 16, fill: '#b8c0cc', stroke: '#6b7280', 'stroke-width': 2 }));
    g.appendChild(svg('path', { d: 'M' + (x0 + len - bristle) + ' ' + (y - 8) + ' Q' + (x0 + len - 6) + ' ' + (y - 6) + ' ' + (x0 + len) + ' ' + y + ' Q' + (x0 + len - 6) + ' ' + (y + 6) + ' ' + (x0 + len - bristle) + ' ' + (y + 8) + ' Z', fill: '#7a4a22', stroke: '#4a2c12', 'stroke-width': 2 }));
  }
  function drawToothbrush(g, x0, len, y) {
    var head = 60;
    g.appendChild(svg('rect', { x: x0, y: y - 7, width: len, height: 14, rx: 7, fill: '#8ecae6', stroke: '#2b6cb0', 'stroke-width': 2 }));
    for (var x = x0 + len - head + 6; x < x0 + len - 4; x += 8) g.appendChild(svg('rect', { x: x, y: y - 22, width: 5, height: 15, rx: 2, fill: '#fff', stroke: '#9aa5b1', 'stroke-width': 1.5 }));
  }

  function objectFor(len, avoid) {
    var fits = OBJECTS.filter(function (o) {
      return len >= o.min && len <= o.max && o.id !== avoid;
    });
    if (!fits.length) fits = OBJECTS.filter(function (o) { return len >= o.min && len <= o.max; });
    return U.pick(fits);
  }

  /* ------------------------------------------------------------------ *
   * Measuring scene: object at the top, a 1 cm reference square, and a ruler
   * that slides in underneath. The object starts exactly at 0 on the ruler.
   * ------------------------------------------------------------------ */
  function scene(obj, len) {
    var to = len <= 12 ? 15 : 20;
    var ruler = MQ.ui.ruler({ from: 0, to: to, cm: CM, label: false });
    var W = ruler.width + 56;
    var Hh = 172;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + Hh, class: 'em-svg', role: 'img', 'aria-label': 'A ' + obj.name + ' to measure' });
    var rx = 20;
    var ry = 104;
    var x0 = rx + ruler.xOf(0);
    var oy = 72;
    // 1 cm reference square (top right)
    var sq = svg('g', { class: 'em-ref' });
    sq.appendChild(svg('rect', { x: W - 20 - CM, y: 8, width: CM, height: CM, class: 'em-ref-sq' }));
    sq.appendChild(svg('text', { x: W - 20 - CM - 8, y: 8 + CM / 2 + 6, 'text-anchor': 'end', class: 'em-ref-txt' }, '1 cm'));
    root.appendChild(sq);
    var objG = svg('g', { class: 'em-obj' });
    obj.draw(objG, x0, len * CM, oy);
    root.appendChild(objG);
    // guide lines (start and end), shown when measuring
    var guides = svg('g', { class: 'em-guides', visibility: 'hidden' });
    guides.appendChild(svg('line', { x1: x0, y1: oy - 28, x2: x0, y2: ry + 2, class: 'em-guide' }));
    var endLine = svg('line', { x1: x0 + len * CM, y1: oy - 28, x2: x0 + len * CM, y2: ry + 2, class: 'em-guide em-guide-end' });
    guides.appendChild(endLine);
    root.appendChild(guides);
    var rulerWrap = svg('g', { class: 'em-ruler-wrap' });
    rulerWrap.appendChild(ruler.g);
    rulerWrap.appendChild(svg('text', { x: rx + ruler.width + 4, y: ry + 40, class: 'em-ruler-cm' }, 'cm'));
    ruler.moveTo(rx, ry);
    rulerWrap.style.transform = 'translate(' + -(W + 20) + 'px, 0px)';
    rulerWrap.style.opacity = '0';
    root.appendChild(rulerWrap);
    var mark = svg('g', { visibility: 'hidden' });
    mark.appendChild(svg('circle', { cx: x0 + len * CM, cy: ry + 34, r: 15, class: 'em-endmark' }));
    root.appendChild(mark);
    var readLbl = svg('text', { x: x0 + len * CM, y: oy - 34, 'text-anchor': 'middle', class: 'em-read', visibility: 'hidden' }, len + ' cm');
    root.appendChild(readLbl);
    return {
      svg: root,
      showRuler: function () {
        rulerWrap.style.transform = 'translate(0px, 0px)';
        rulerWrap.style.opacity = '1';
      },
      showGuides: function () {
        guides.setAttribute('visibility', 'visible');
      },
      showReading: function () {
        guides.setAttribute('visibility', 'visible');
        mark.setAttribute('visibility', 'visible');
        readLbl.setAttribute('visibility', 'visible');
      },
    };
  }

  // How close was the estimate? Returns a meter element.
  function closeness(est, real) {
    var d = Math.abs(est - real);
    var levels = [
      { max: 1, text: 'Super Estimator! 🌟', cls: 'em-z1' },
      { max: 3, text: 'Great guess! 👍', cls: 'em-z2' },
      { max: 5, text: 'Good try!', cls: 'em-z3' },
      { max: 99, text: 'Keep going: use your finger widths!', cls: 'em-z4' },
    ];
    var lv = levels.filter(function (l) { return d <= l.max; })[0];
    var zones = el('div', { class: 'em-meter' });
    [['0–1 cm', 'em-z1'], ['2–3 cm', 'em-z2'], ['4–5 cm', 'em-z3'], ['6+ cm', 'em-z4']].forEach(function (z) {
      zones.appendChild(el('div', { class: 'em-zone ' + z[1] + (z[1] === lv.cls ? ' em-on' : '') }, z[0]));
    });
    var working = est === real ? 'Spot on: ' + est + ' cm and ' + real + ' cm!' : 'Guess ' + est + ' cm, real ' + real + ' cm: ' + Math.max(est, real) + ' − ' + Math.min(est, real) + ' = ' + d + ' cm away';
    return {
      d: d,
      text: lv.text,
      el: el('div', { class: 'em-close' }, el('div', { class: 'em-close-title' }, working), zones),
    };
  }

  // Estimate slider + Lock in button. onLock(est)
  function estimator(max, onLock) {
    var val = el('span', { class: 'em-est-val' }, '?');
    var range = el('input', { type: 'range', min: '0', max: String(max), step: '1', value: '0', class: 'em-range', 'aria-label': 'Your estimate in centimetres' });
    var lock = el('button', { class: 'btn', type: 'button', disabled: true }, 'Lock in 🔒');
    range.addEventListener('input', function () {
      var v = parseInt(range.value, 10);
      val.textContent = v ? v + ' cm' : '?';
      lock.disabled = !v;
    });
    lock.addEventListener('click', function () {
      var v = parseInt(range.value, 10);
      if (!v) return;
      range.disabled = true;
      lock.disabled = true;
      MQ.clear(wrap);
      wrap.classList.add('em-est-locked');
      wrap.appendChild(el('div', { class: 'em-est-top' }, '🔒 My estimate: ', el('span', { class: 'em-est-val' }, v + ' cm')));
      onLock(v);
    });
    var wrap = el('div', { class: 'em-est' }, el('div', { class: 'em-est-top' }, el('span', null, 'My estimate: '), val), el('div', { class: 'em-est-row' }, el('span', { class: 'em-tiny' }, '0'), range, el('span', { class: 'em-tiny' }, max + ' cm'), lock));
    wrap.range = range;
    wrap.lock = lock;
    return wrap;
  }

  /* ------------------------------------------------------------------ *
   * Question banks
   * ------------------------------------------------------------------ */
  var SENSE = [
    {
      q: 'Which is about <b>1 metre</b> long?',
      tag: 'No feel for 1 m yet',
      opts: [
        { icon: '🚪', label: 'the width of a door', ok: true, why: 'A door is about 1 metre wide: one big grown-up step.' },
        { icon: '✏️', label: 'a pencil', why: 'A pencil fits in your hand. It is only about 15 cm.' },
        { icon: '🚌', label: 'a bus', why: 'A bus is much longer: about 12 metres!' },
      ],
    },
    {
      q: 'Which is about <b>20 cm</b> long?',
      tag: 'No feel for 10 cm or 20 cm yet',
      opts: [
        { icon: '👟', label: 'a shoe', ok: true, why: 'A shoe is about 20 cm: a bit shorter than a school ruler.' },
        { icon: '🚗', label: 'a car', why: 'A car is about 4 metres long. Far too big!' },
        { icon: '🐜', label: 'an ant', why: 'An ant is smaller than your fingertip: less than 1 cm.' },
      ],
    },
    {
      q: 'About how <b>tall</b> is a door?',
      tag: 'No feel for 1 m yet',
      icon: '🚪',
      opts: [
        { label: '2 m', ok: true, why: 'A door is about 2 m tall: a bit taller than a grown-up.' },
        { label: '20 cm', why: '20 cm is about as long as a shoe. A door is much taller!' },
        { label: '2 km', why: '2 km is a long walk! A door is only about 2 metres.' },
      ],
    },
    {
      q: 'About how long is a <b>pencil</b>?',
      tag: 'No feel for 10 cm or 20 cm yet',
      icon: '✏️',
      opts: [
        { label: '15 cm', ok: true, why: 'A new pencil is about 15 cm: half a school ruler.' },
        { label: '15 m', why: '15 m is longer than a bus! A pencil fits in your hand.' },
        { label: '1 cm', why: '1 cm is only a finger width. A pencil is much longer.' },
      ],
    },
    {
      q: 'Which is about <b>1 cm</b> wide?',
      tag: 'No feel for 1 cm yet',
      opts: [
        { icon: '☝️', label: 'your fingertip', ok: true, why: 'Your fingertip is about 1 cm wide.' },
        { icon: '✋', label: 'your hand', why: 'A hand is about 10 cm wide or more.' },
        { icon: '📕', label: 'a book', why: 'A book is about 20 cm wide.' },
      ],
    },
    {
      q: 'About how long is a <b>classroom</b>?',
      tag: 'No feel for 1 m yet',
      icon: '🏫',
      opts: [
        { label: '8 m', ok: true, why: 'A classroom is about 8 m: about 8 big grown-up steps.' },
        { label: '8 cm', why: '8 cm is shorter than a pencil!' },
        { label: '8 km', why: '8 km is a long car journey, not a room.' },
      ],
    },
  ];

  var KM = [
    { place: 'The park at the end of your road', icon: '🌳', clue: '2 minutes walk', more: false, why: 'A 2-minute walk is much less than 1 km. 1 km takes about 15 minutes to walk.' },
    { place: 'The next town', icon: '🏘️', clue: '30 minutes by car', more: true, why: 'A car goes a long way in 30 minutes: many kilometres!' },
    { place: 'The school gate, from your classroom', icon: '🏫', clue: '1 minute walk', more: false, why: 'A 1-minute walk is far less than 1 km.' },
    { place: 'The seaside', icon: '🏖️', clue: '1 hour by car', more: true, why: 'An hour in a car is a long journey: many kilometres.' },
    { place: 'The shop across the street', icon: '🏪', clue: 'just cross the road', more: false, why: 'Across the road is only a few metres.' },
    { place: "Grandma's house in another city", icon: '🏙️', clue: '2 hours by train', more: true, why: 'Another city is a long journey: lots of kilometres.' },
    { place: 'The other end of the school field', icon: '⚽', clue: 'a short run', more: false, why: 'A school field is about 100 m: much less than 1 km.' },
    { place: 'The airport', icon: '✈️', clue: '40 minutes by car', more: true, why: '40 minutes in a car is many kilometres.' },
  ];

  var deck = null;

  function buildDeck() {
    var q = [];
    var lens = U.shuffle(U.range(3, 15)).slice(0, 3);
    var prevObj = null;
    lens.forEach(function (len) {
      var o = objectFor(len, prevObj);
      prevObj = o.id;
      q.push({ type: 'measure', len: len, obj: o, max: 20 });
    });
    // Level 2: difference, sense, difference
    var diffs = [];
    while (diffs.length < 2) {
      var real = U.rand(5, 18);
      var gap = U.rand(1, 6);
      var est = Math.random() < 0.5 ? real - gap : real + gap;
      if (est < 2 || est > 20) continue;
      if (diffs.some(function (d) { return d.real === real || d.est === est; })) continue;
      diffs.push({ type: 'diff', real: real, est: est });
    }
    var sense = U.shuffle(SENSE);
    q.push(diffs[0], { type: 'sense', s: sense[0] }, diffs[1]);
    // Level 3: long object measure + km reasoning (random order)
    var longLen;
    do longLen = U.rand(12, 18);
    while (lens.indexOf(longLen) !== -1);
    var l3 = [{ type: 'measure', len: longLen, obj: objectFor(longLen, prevObj), max: 20 }, { type: 'km', k: U.pick(KM) }];
    return q.concat(U.shuffle(l3));
  }

  /* ------------------------------------------------------------------ *
   * Practice renderers
   * ------------------------------------------------------------------ */
  function renderMeasure(stage, api, q) {
    api.say('First, guess! How long is the ' + q.obj.name + '? Use the 1 cm square to help.', 'think');
    stage.appendChild(MQ.ui.prompt('Estimate the length of the <b>' + q.obj.name + '</b>.'));
    var sc = scene(q.obj, q.len);
    stage.appendChild(el('div', { class: 'em-box' }, sc.svg));
    var area = el('div', { class: 'em-area' });
    stage.appendChild(area);
    var estimate = null;
    var box = null;

    var est = estimator(q.max, function (v) {
      estimate = v;
      api.sound('pop');
      sc.showRuler();
      api.say('Locked in: ' + v + ' cm. Now measure it! Read the ruler at the end.', 'think');
      api.later(function () {
        sc.showGuides();
        box = MQ.ui.numberInput({ unit: 'cm', prefix: 'It measures', onSubmit: submit });
        area.appendChild(box.el);
        box.focus();
      }, 700);
    });
    area.appendChild(est);

    function submit(n) {
      if (api.isAnswered()) return;
      if (U.same(n, q.len)) {
        box.good();
        box.disable();
        sc.showReading();
        var c = closeness(estimate, q.len);
        area.appendChild(c.el);
        api.check(true, 'Yes, ' + q.len + ' cm! Your estimate was ' + (c.d === 0 ? 'spot on!' : c.d + ' cm away. ' + c.text));
        return;
      }
      box.bad();
      var hint;
      var tag = 'Misread the ruler';
      if (U.same(n, estimate) && estimate !== q.len) {
        hint = 'That is your estimate. Now read the real length on the ruler.';
        tag = 'Wrote the estimate instead of measuring';
      } else if (U.same(n, q.len + 1)) {
        hint = 'Did you count from 1? The ' + q.obj.name + ' starts at 0. Look at the number under its end.';
        tag = 'Started counting at 1 instead of 0';
      } else if (api.tries() === 0) {
        hint = 'Follow the dotted line down from the end of the ' + q.obj.name + '. Which number is it on?';
      } else {
        hint = 'The ' + q.obj.name + ' starts at 0. Its end is just past ' + (q.len - 1) + '. Which number comes next?';
      }
      api.check(false, hint, tag);
    }

    api.onReveal(function () {
      if (box) {
        box.setValue(q.len);
        box.good();
        box.disable();
      }
      sc.showRuler();
      sc.showReading();
      api.feedback('The ' + q.obj.name + ' starts at 0 and ends at ' + q.len + ', so it is ' + q.len + ' cm long.', 'info');
    });
  }

  function renderDiff(stage, api, q) {
    var big = Math.max(q.est, q.real);
    var small = Math.min(q.est, q.real);
    var d = big - small;
    api.say('How far away was the estimate? Find the gap between the two numbers.', 'think');
    stage.appendChild(MQ.ui.prompt('My estimate was <b>' + q.est + ' cm</b>. It measured <b>' + q.real + ' cm</b>.<br>How many cm away was my estimate?'));
    // Bars on a ruler scale (drawn to scale)
    var S = 30;
    var ruler = MQ.ui.ruler({ from: 0, to: 20, cm: S, height: 48, label: false });
    var W = ruler.width + 156;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' 190', class: 'em-svg' });
    var x0 = 120 + ruler.xOf(0);
    var gapG = svg('g', { visibility: 'hidden' });
    gapG.appendChild(svg('rect', { x: x0 + small * S, y: 14, width: d * S, height: 84, rx: 4, class: 'em-gap' }));
    for (var k = 0; k < d; k++) {
      var a = x0 + (small + k) * S;
      gapG.appendChild(svg('path', { d: 'M' + a + ' 106 Q' + (a + S / 2) + ' 94 ' + (a + S) + ' 106', class: 'em-jump' }));
    }
    root.appendChild(gapG);
    root.appendChild(svg('text', { x: 112, y: 40, 'text-anchor': 'end', class: 'em-bar-lbl' }, 'Estimate'));
    root.appendChild(svg('rect', { x: x0, y: 22, width: q.est * S, height: 26, rx: 5, class: 'em-bar-est' }));
    root.appendChild(svg('text', { x: x0 + q.est * S - 8, y: 41, 'text-anchor': 'end', class: 'em-bar-num' }, q.est + ' cm'));
    root.appendChild(svg('text', { x: 112, y: 84, 'text-anchor': 'end', class: 'em-bar-lbl' }, 'Measured'));
    root.appendChild(svg('rect', { x: x0, y: 66, width: q.real * S, height: 26, rx: 5, class: 'em-bar-real' }));
    root.appendChild(svg('text', { x: x0 + q.real * S - 8, y: 85, 'text-anchor': 'end', class: 'em-bar-num' }, q.real + ' cm'));
    ruler.moveTo(120, 112);
    root.appendChild(ruler.g);
    root.appendChild(svg('text', { x: 120 + ruler.width + 6, y: 152, class: 'em-ruler-cm' }, 'cm'));
    stage.appendChild(el('div', { class: 'em-box' }, root));
    var work = el('div', { class: 'em-area' });
    var box = MQ.ui.numberInput({ unit: 'cm', prefix: 'It was', onSubmit: submit });
    stage.appendChild(box.el);
    stage.appendChild(work);
    box.focus();

    function showWork() {
      gapG.setAttribute('visibility', 'visible');
      MQ.clear(work);
      work.appendChild(el('div', { class: 'em-work' }, 'Count on from ' + small + ' to ' + big + ': ' + d + (d === 1 ? ' jump' : ' jumps') + '.   ' + big + ' − ' + small + ' = ' + d + ' cm'));
    }

    function submit(n) {
      if (api.isAnswered()) return;
      if (U.same(n, d)) {
        box.good();
        box.disable();
        showWork();
        api.check(true, 'Yes! ' + big + ' − ' + small + ' = ' + d + '. The estimate was ' + d + ' cm away.');
        return;
      }
      box.bad();
      var tag = 'Found the difference wrongly';
      var hint;
      if (U.same(n, q.est + q.real)) {
        hint = 'You added them. We want the gap between ' + small + ' and ' + big + '. Count on from ' + small + '.';
        tag = 'Added instead of finding the difference';
      } else if (U.same(n, q.real) || U.same(n, q.est)) {
        hint = 'That is one of the lengths. How big is the gap between ' + small + ' and ' + big + '?';
      } else if (api.tries() === 0) {
        hint = 'Look at the ends of the two bars. Count on from ' + small + ' to ' + big + '.';
      } else {
        gapG.setAttribute('visibility', 'visible');
        hint = 'Count the little jumps in the yellow gap, from ' + small + ' up to ' + big + '.';
      }
      api.check(false, hint, tag);
    }

    api.onReveal(function () {
      box.setValue(d);
      box.good();
      box.disable();
      showWork();
      api.feedback('The gap from ' + small + ' cm to ' + big + ' cm is ' + d + ' cm, so the estimate was ' + d + ' cm away.', 'info');
    });
  }

  function renderSense(stage, api, s) {
    api.say('Think about real life. Which makes sense?', 'think');
    stage.appendChild(MQ.ui.prompt(s.q));
    if (s.icon) stage.appendChild(el('div', { class: 'em-big-icon' }, s.icon));
    var opts = U.shuffle(s.opts);
    var right = s.opts.filter(function (o) { return o.ok; })[0];
    var ch = MQ.ui.choices(
      opts.map(function (o) {
        return { label: o.icon ? '<span class="em-opt-icon">' + o.icon + '</span><br>' + o.label : o.label, value: o.label };
      }),
      function (v) {
        var o = s.opts.filter(function (x) { return x.label === v; })[0];
        if (o.ok) {
          ch.mark(v, 'good');
          ch.disable();
          api.check(true, o.why);
        } else {
          ch.mark(v, 'bad');
          api.check(false, api.tries() === 0 ? o.why : o.why + ' Picture it at home or at school.', s.tag);
        }
      },
      { columns: 3 }
    );
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(right.label, 'good');
      ch.disable();
      api.feedback(right.why, 'info');
    });
  }

  function renderKm(stage, api, k) {
    api.say('1 km is about a 15-minute walk. Use that to help you!', 'think');
    stage.appendChild(MQ.ui.prompt('Is it <b>more</b> or <b>less</b> than 1 km away?'));
    stage.appendChild(el('div', { class: 'em-place' }, el('span', { class: 'em-place-icon' }, k.icon), el('div', null, el('div', { class: 'em-place-name' }, k.place), el('div', { class: 'em-place-clue' }, '⏱️ ' + k.clue))));
    stage.appendChild(el('div', { class: 'em-bench' }, '🚶 1 km ≈ a 15-minute walk  ·  about 1000 big steps'));
    var ch = MQ.ui.choices(
      [
        { label: 'Less than 1 km', value: 'less' },
        { label: 'More than 1 km', value: 'more' },
      ],
      function (v) {
        var ok = (v === 'more') === k.more;
        if (ok) {
          ch.mark(v, 'good');
          ch.disable();
          api.check(true, k.why);
        } else {
          ch.mark(v, 'bad');
          api.check(false, api.tries() === 0 ? 'Think about the clue: ' + k.clue + '. Is that longer or shorter than a 15-minute walk?' : k.why, 'Unsure how far 1 km is');
        }
      },
      { columns: 2 }
    );
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(k.more ? 'more' : 'less', 'good');
      ch.disable();
      api.feedback(k.why, 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Activity
   * ------------------------------------------------------------------ */
  var BENCH = [
    { icon: '☝️', name: 'Finger width', val: 'about 1 cm' },
    { icon: '✋', name: 'Hand span', val: 'about 10–15 cm' },
    { icon: '📏', name: 'School ruler', val: '30 cm' },
    { icon: '🚶', name: 'Big grown-up step', val: 'about 1 m' },
    { icon: '🚪', name: 'Door height', val: 'about 2 m' },
  ];

  MQ.register('estimate-measure', {
    learn: [
      // 1. Body rulers / benchmarks
      function (stage, api) {
        api.say('An estimate is a clever guess. It does not have to be exact! Click each card.', 'happy');
        stage.appendChild(MQ.ui.lesson('Rulers you always carry', 'Use these to help you guess.'));
        var grid = el('div', { class: 'em-cards' });
        var seen = 0;
        BENCH.forEach(function (b) {
          var val = el('div', { class: 'em-card-val' }, '?');
          var card = el('button', { class: 'em-card', type: 'button' }, el('div', { class: 'em-card-icon' }, b.icon), el('div', { class: 'em-card-name' }, b.name), val);
          card.addEventListener('click', function () {
            if (card.classList.contains('em-open')) return;
            card.classList.add('em-open');
            val.textContent = b.val;
            api.sound('pop');
            seen++;
            if (seen === BENCH.length) {
              api.say('Now you have five body rulers. Use them to estimate!', 'cheer');
              api.feedback('Remember: an estimate just needs to be close.', 'good');
            }
          });
          grid.appendChild(card);
        });
        stage.appendChild(grid);
        // 1 cm square at true on-screen scale
        var s = svg('svg', { viewBox: '0 0 200 40', class: 'em-cm-demo', width: 200, height: 40 });
        s.appendChild(svg('rect', { x: 4, y: 4, width: CM, height: CM, class: 'em-ref-sq' }));
        s.appendChild(svg('text', { x: CM + 14, y: 27, class: 'em-ref-txt' }, '= 1 cm on screen'));
        stage.appendChild(s);
      },

      // 2. Guess, then measure
      function (stage, api) {
        api.say('Look at the pencil. Slide to your guess, then lock it in!', 'think');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Guess, then measure', 'The blue square is 1 cm. How long is the pencil?'));
        var len = U.pick([9, 11, 13]);
        var sc = scene(OBJECTS[3], len);
        stage.appendChild(el('div', { class: 'em-box' }, sc.svg));
        var area = el('div', { class: 'em-area' });
        stage.appendChild(area);
        area.appendChild(
          estimator(20, function (v) {
            api.sound('pop');
            sc.showRuler();
            api.later(function () {
              sc.showReading();
              var c = closeness(v, len);
              area.appendChild(c.el);
              api.say('The pencil is really ' + len + ' cm. ' + c.text, c.d <= 3 ? 'cheer' : 'happy');
              api.feedback('When we estimate, close is good. When we measure, we must be exact.', 'info');
              api.unlockNext();
            }, 900);
          })
        );
      },

      // 3. Try it at home
      function (stage, api) {
        api.say('Time to hunt at home! Guess first, then measure with a ruler or tape.', 'happy');
        stage.appendChild(MQ.ui.lesson('Try it at home 🏠', 'Find 4 things for each box. Guess, then measure.'));
        var cols = [
          { title: 'About 20 cm', icons: '👟 📕 🥄 🧦', tip: 'Hint: a bit shorter than a ruler' },
          { title: 'About 10 cm', icons: '🖍️ 🧼 ☕ 🧽', tip: 'Hint: about one hand span' },
          { title: 'Between 1 m and 2 m', icons: '🛋️ 🛏️ 🪟 🧍', tip: 'Hint: one or two big steps' },
        ];
        var row = el('div', { class: 'em-home' });
        cols.forEach(function (c) {
          var boxes = el('div', { class: 'em-ticks' });
          for (var i = 0; i < 4; i++) boxes.appendChild(el('span', { class: 'em-tickbox' }));
          row.appendChild(el('div', { class: 'em-home-col' }, el('div', { class: 'em-home-title' }, c.title), el('div', { class: 'em-home-icons' }, c.icons), boxes, el('div', { class: 'em-tiny' }, c.tip)));
        });
        stage.appendChild(row);
        stage.appendChild(el('div', { class: 'em-tiny' }, 'Write each guess and each measurement. How close were you?'));
      },
    ],

    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'measure') return renderMeasure(stage, api, q);
        if (q.type === 'diff') return renderDiff(stage, api, q);
        if (q.type === 'sense') return renderSense(stage, api, q.s);
        return renderKm(stage, api, q.k);
      },
    },
  });

  var css = [
    '.em-box{width:100%;max-width:820px;background:#fff;border:2px solid var(--line);border-radius:16px;padding:6px 8px}',
    '.em-svg{display:block;width:100%;height:auto;user-select:none}',
    '.em-ref-sq{fill:#e9eefc;stroke:#2b6cb0;stroke-width:2}',
    '.em-ref-txt{font-size:15px;font-weight:800;fill:#2b6cb0}',
    '.em-ruler-cm{font-size:15px;font-weight:800;fill:#7a5c00}',
    '.em-ruler-wrap{transition:transform .8s cubic-bezier(.3,.8,.3,1),opacity .4s}',
    '.em-guide{stroke:#2b6cb0;stroke-width:2;stroke-dasharray:5 4}',
    '.em-guide-end{stroke:#e63946}',
    '.em-endmark{fill:none;stroke:#e63946;stroke-width:3}',
    '.em-read{font-size:20px;font-weight:800;fill:#e63946;paint-order:stroke;stroke:#fff;stroke-width:5px}',
    '.em-area{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.em-est{display:flex;flex-direction:column;align-items:center;gap:6px;background:var(--info-bg);border-radius:16px;padding:10px 18px;max-width:640px;width:100%}',
    '.em-est-top{font-size:1.3rem;font-weight:800}',
    '.em-est-locked{padding:6px 18px;max-width:360px}',
    '.em-est-val{display:inline-block;min-width:70px;color:#0b6e66}',
    '.em-est-row{display:flex;align-items:center;gap:10px;width:100%;flex-wrap:wrap;justify-content:center}',
    '.em-range{flex:1;min-width:200px;height:28px;accent-color:#2b6cb0;cursor:pointer}',
    '.em-tiny{color:var(--ink-soft);font-size:.95rem;font-weight:700}',
    '.em-close{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;max-width:560px}',
    '.em-close-title{font-weight:800;font-size:1.1rem}',
    '.em-meter{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;width:100%}',
    '.em-zone{text-align:center;padding:6px 2px;border-radius:8px;font-weight:800;font-size:.9rem;opacity:.35}',
    '.em-zone.em-on{opacity:1;outline:3px solid var(--ink);transform:scale(1.06)}',
    '.em-z1{background:#c8f0d9;color:#11633f}',
    '.em-z2{background:#dcefc0;color:#3d6410}',
    '.em-z3{background:#ffe8b0;color:#7a5200}',
    '.em-z4{background:#ffd9c2;color:#8a3a08}',
    '.em-close-verdict{font-weight:800;font-size:1.2rem;padding:4px 14px;border-radius:12px}',
    '.em-bar-lbl{font-size:17px;font-weight:800;fill:#1b2a4a}',
    '.em-bar-num{font-size:17px;font-weight:800;fill:#1b2a4a}',
    '.em-bar-est{fill:#e9eefc;stroke:#2b6cb0;stroke-width:2;stroke-dasharray:6 4}',
    '.em-bar-real{fill:#ffc93c;stroke:#b8860b;stroke-width:2}',
    '.em-gap{fill:#ffe08a;stroke:#e09b00;stroke-width:2}',
    '.em-jump{fill:none;stroke:#e63946;stroke-width:2.5}',
    '.em-work{font-size:1.25rem;font-weight:800;background:#fff3cd;border:2px solid var(--gold);border-radius:14px;padding:8px 16px;text-align:center;white-space:pre-wrap}',
    '.em-big-icon{font-size:3.4rem;line-height:1}',
    '.em-opt-icon{font-size:2rem}',
    '.em-place{display:flex;align-items:center;gap:14px;background:#fff;border:3px dashed var(--line);border-radius:16px;padding:12px 22px}',
    '.em-place-icon{font-size:3rem}',
    '.em-place-name{font-size:1.4rem;font-weight:800}',
    '.em-place-clue{font-size:1.15rem;color:var(--ink-soft);font-weight:700}',
    '.em-bench{background:var(--info-bg);border-radius:12px;padding:6px 14px;font-weight:800}',
    '.em-cards{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;width:100%;max-width:820px}',
    '.em-card{background:#fff;border:3px solid var(--line);border-radius:16px;padding:12px 6px;text-align:center;cursor:pointer;font-family:inherit;color:var(--ink);transition:transform .1s,border-color .1s}',
    '.em-card:hover{border-color:var(--accent);transform:translateY(-2px)}',
    '.em-card-icon{font-size:2.6rem;line-height:1.2}',
    '.em-card-name{font-weight:800;font-size:1rem;margin-top:4px}',
    '.em-card-val{margin-top:8px;font-weight:800;font-size:1.15rem;color:var(--ink-soft);background:var(--paper-2);border-radius:10px;padding:4px}',
    '.em-card.em-open{border-color:var(--good);cursor:default}',
    '.em-card.em-open .em-card-val{background:var(--good-bg);color:var(--good)}',
    '.em-cm-demo{max-width:100%}',
    '.em-home{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;width:100%;max-width:820px}',
    '.em-home-col{background:#fff;border:3px solid var(--line);border-radius:16px;padding:14px;text-align:center;display:flex;flex-direction:column;gap:8px;align-items:center}',
    '.em-home-title{font-size:1.25rem;font-weight:800;color:#0b6e66}',
    '.em-home-icons{font-size:1.9rem;white-space:nowrap}',
    '.em-ticks{display:flex;gap:8px}',
    '.em-tickbox{width:26px;height:26px;border:3px solid var(--line);border-radius:6px;background:#fff}',
    '@media (max-width:760px){.em-cards{grid-template-columns:repeat(3,minmax(0,1fr))}.em-home{grid-template-columns:1fr}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'estimate-measure' }, css));
})();

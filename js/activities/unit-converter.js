/* Unit Converter — 1 m = 100 cm and 1 km = 1000 m, with halves and quarters (Unit 6.1). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  var FR = { 25: '¼', 50: '½', 75: '¾' };

  /* ------------------------------------------------------------------ *
   * Drawing helpers. Everything is drawn to scale: one metre stick is
   * always the same length inside a picture, half a stick is half as long.
   * ------------------------------------------------------------------ */
  function box(w, h, label) {
    return S('svg', { viewBox: '0 0 ' + w + ' ' + h, class: 'uc-svg', width: w, height: h, role: 'img', 'aria-label': label || 'picture', style: { maxWidth: '100%', height: 'auto' } });
  }
  function txt(x, y, s, cls, anchor) {
    return S('text', { x: x, y: y, class: cls || 'uc-lab', 'text-anchor': anchor || 'middle' }, String(s));
  }

  /** A wooden metre stick (or a cut piece of one) with a darker band every other 10 cm. */
  function stick(x, y, cm, ppc, h) {
    var g = S('g', { class: 'uc-stick' });
    g.appendChild(S('rect', { x: x, y: y, width: cm * ppc, height: h, rx: 3, class: 'uc-stick-body' }));
    for (var c = 10; c < cm; c += 20) {
      g.appendChild(S('rect', { x: x + c * ppc, y: y, width: Math.min(10, cm - c) * ppc, height: h, class: 'uc-stick-band' }));
    }
    for (c = 10; c < cm; c += 10) g.appendChild(S('line', { x1: x + c * ppc, y1: y, x2: x + c * ppc, y2: y + h * 0.3, class: 'uc-tick' }));
    g.appendChild(S('rect', { x: x, y: y, width: cm * ppc, height: h, rx: 3, class: 'uc-stick-edge' }));
    return g;
  }

  /** A metre made of n blocks of 10 cm (out of 10), with +10 jumps above. */
  function blocksFig(n, onSlot) {
    var x0 = 22;
    var bw = 74;
    var by = 62;
    var bh = 56;
    var root = box(800, 152, n * 10 + ' centimetres of a metre');
    for (var i = 0; i < 10; i++) {
      var x = x0 + i * bw;
      if (i < n) {
        root.appendChild(S('rect', { x: x, y: by, width: bw, height: bh, class: 'uc-block ' + (i % 2 ? 'uc-block-b' : 'uc-block-a') }));
        root.appendChild(txt(x + bw / 2, by + bh / 2 + 6, '10 cm', 'uc-blocklab'));
        root.appendChild(S('path', { d: 'M' + (x + 5) + ' ' + (by - 4) + ' Q' + (x + bw / 2) + ' ' + (by - 50) + ' ' + (x + bw - 5) + ' ' + (by - 4), class: 'uc-arc' }));
        root.appendChild(txt(x + bw / 2, by - 31, '+10', 'uc-small uc-arclab'));
      } else {
        var slot = S('rect', { x: x + 3, y: by + 3, width: bw - 6, height: bh - 6, rx: 6, class: 'uc-slot' + (onSlot ? ' uc-click' : '') });
        if (onSlot) slot.addEventListener('click', onSlot);
        root.appendChild(slot);
      }
    }
    for (i = 0; i <= n; i++) {
      var last = i === n && n > 0;
      root.appendChild(txt(x0 + i * bw, by + bh + 24, last ? i * 10 + ' cm' : i * 10, last ? 'uc-lab uc-lab-strong' : 'uc-small'));
    }
    return root;
  }

  /** One metre stick cut into halves or quarters. mode: null | 'half' | 'quarter' | 'threeq' */
  function fracFig(mode) {
    var x0 = 40;
    var ppc = 7.2;
    var y = 64;
    var h = 54;
    var root = box(800, 150, 'A metre stick, 100 cm long');
    root.appendChild(stick(x0, y, 100, ppc, h));
    var part = mode === 'half' ? 50 : mode ? 25 : 0;
    var shaded = { half: 50, quarter: 25, threeq: 75 }[mode] || 0;
    var c;
    if (shaded) {
      var bx2 = x0 + shaded * ppc;
      root.appendChild(S('rect', { x: x0, y: y, width: shaded * ppc, height: h, rx: 3, class: 'uc-shade' }));
      for (c = 10; c < shaded; c += 10) root.appendChild(S('line', { x1: x0 + c * ppc, y1: y + 1.5, x2: x0 + c * ppc, y2: y + h * 0.3, class: 'uc-tick uc-tick-on' }));
      root.appendChild(S('path', { d: 'M' + (x0 + 2) + ' ' + (y - 6) + ' V' + (y - 18) + ' H' + (bx2 - 2) + ' V' + (y - 6), class: 'uc-bracket' }));
      root.appendChild(txt((x0 + bx2) / 2, y - 25, FR[shaded] + ' m', 'uc-lab uc-lab-strong'));
    }
    var marks = [0, 100];
    if (part) {
      marks = [];
      for (c = 0; c <= 100; c += part) marks.push(c);
    }
    marks.forEach(function (m) {
      if (m > 0 && m < 100) root.appendChild(S('line', { x1: x0 + m * ppc, y1: y - 5, x2: x0 + m * ppc, y2: y + h + 5, class: 'uc-divider' }));
      root.appendChild(txt(x0 + m * ppc, y + h + 24, m === 100 ? '100 cm' : m, m === shaded ? 'uc-lab uc-lab-strong' : 'uc-small'));
    });
    if (part) {
      for (c = 0; c < 100; c += part) {
        root.appendChild(txt(x0 + (c + part / 2) * ppc, y + h / 2 + 12, part + ' cm', c < shaded ? 'uc-partlab uc-partlab-on' : 'uc-partlab'));
      }
    }
    return root;
  }

  /** Metre sticks stacked one under another, plus an optional cut piece (25, 50 or 75 cm). */
  function sticksFig(whole, piece, opts) {
    opts = opts || {};
    var rows = whole + (piece ? 1 : 0);
    var shown = Math.max(rows, opts.minRows || 0);
    var big = shown > 6;
    var rh = big ? 17 : 26;
    var gap = big ? 8 : 10;
    var top = 6;
    var ppc = 5.2;
    var x0 = 110;
    var labCls = big ? 'uc-lab uc-lab-sm' : 'uc-lab';
    var root = box(800, top + shown * (rh + gap) + 4, rows + ' metre sticks');
    var total = 0;
    for (var i = 0; i < rows; i++) {
      var isPiece = i === whole;
      var len = isPiece ? piece : 100;
      total += len;
      var y = top + i * (rh + gap);
      var cy = y + rh / 2 + (big ? 5 : 6);
      root.appendChild(stick(x0, y, len, ppc, rh));
      root.appendChild(txt(x0 - 14, cy, isPiece ? FR[piece] + ' m' : '1 m', labCls, 'end'));
      root.appendChild(txt(x0 + 100 * ppc + 22, cy, total + ' cm', labCls + (i === rows - 1 ? ' uc-lab-strong' : ' uc-lab-soft'), 'start'));
    }
    return root;
  }

  /* A kilometre drawn as 10 football pitches of 100 m, end to end. */
  var ROAD = { x0: 40, pw: 74, py: 84, ph: 46 };
  function xOfMetres(m) {
    return ROAD.x0 + (m / 100) * ROAD.pw;
  }
  function pitch(x, y, w, h) {
    var g = S('g', { class: 'uc-pitch' });
    g.appendChild(S('rect', { x: x, y: y, width: w, height: h, class: 'uc-pitch-grass' }));
    g.appendChild(S('rect', { x: x + 4, y: y + 4, width: w - 8, height: h - 8, class: 'uc-pitch-line' }));
    g.appendChild(S('line', { x1: x + w / 2, y1: y + 4, x2: x + w / 2, y2: y + h - 4, class: 'uc-pitch-line' }));
    g.appendChild(S('circle', { cx: x + w / 2, cy: y + h / 2, r: 7, class: 'uc-pitch-line' }));
    g.appendChild(S('rect', { x: x + 4, y: y + h / 2 - 8, width: 7, height: 16, class: 'uc-pitch-line' }));
    g.appendChild(S('rect', { x: x + w - 11, y: y + h / 2 - 8, width: 7, height: 16, class: 'uc-pitch-line' }));
    return g;
  }
  function flag(f) {
    var x = xOfMetres(f.m);
    var g = S('g', { class: 'uc-flag' + (f.on ? ' uc-flag-on' : '') + (f.onClick ? ' uc-click' : '') });
    g.appendChild(S('line', { x1: x, y1: 50, x2: x, y2: ROAD.py + ROAD.ph, class: 'uc-post' }));
    g.appendChild(S('rect', { x: x - 38, y: 4, width: 76, height: 46, rx: 10, class: 'uc-sign' }));
    if (f.on) {
      g.appendChild(txt(x, 25, f.top, 'uc-signtop'));
      g.appendChild(txt(x, 43, f.bottom, 'uc-signbot'));
    } else {
      g.appendChild(txt(x, 36, '?', 'uc-signq'));
    }
    if (f.onClick) {
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', 'Flag at ' + f.m + ' metres');
      g.addEventListener('click', f.onClick);
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          f.onClick();
        }
      });
    }
    return g;
  }
  /** opts: { shadeTo: metres walked (highlighted), flags: [{m, top, bottom, on, onClick}] } */
  function roadFig(opts) {
    opts = opts || {};
    var R = ROAD;
    var root = box(820, 186, '1 kilometre is 10 football pitches of 100 metres');
    for (var i = 0; i < 10; i++) root.appendChild(pitch(R.x0 + i * R.pw, R.py, R.pw, R.ph));
    if (opts.shadeTo) {
      if (opts.shadeTo < 1000) root.appendChild(S('rect', { x: xOfMetres(opts.shadeTo), y: R.py, width: xOfMetres(1000) - xOfMetres(opts.shadeTo), height: R.ph, class: 'uc-fade' }));
      root.appendChild(S('rect', { x: R.x0, y: R.py + R.ph + 4, width: xOfMetres(opts.shadeTo) - R.x0, height: 7, rx: 3, class: 'uc-walk' }));
    }
    for (i = 0; i <= 10; i++) root.appendChild(txt(R.x0 + i * R.pw, R.py + R.ph + 30, i === 10 ? '1000 m' : i * 100, i * 100 === opts.shadeTo ? 'uc-small uc-lab-strong' : 'uc-small'));
    root.appendChild(txt(R.x0 - 6, 180, '1 football pitch is about 100 m long', 'uc-small uc-soft', 'start'));
    (opts.flags || []).forEach(function (f) {
      root.appendChild(flag(f));
    });
    return root;
  }
  var QUARTER_FLAGS = [
    { m: 250, top: '¼ km', bottom: '250 m' },
    { m: 500, top: '½ km', bottom: '500 m' },
    { m: 750, top: '¾ km', bottom: '750 m' },
    { m: 1000, top: '1 km', bottom: '1000 m' },
  ];
  function flagsUpTo(m) {
    return QUARTER_FLAGS.filter(function (f) {
      return f.m <= m;
    }).map(function (f) {
      return { m: f.m, top: f.top, bottom: f.bottom, on: true };
    });
  }

  /** Two ribbons drawn to the same centimetre scale. c = {a: '¾', acm: 75, b: 70} */
  function compareFig(c) {
    var x0 = 130;
    var ppc = 5.6;
    var ay = 30;
    var root = box(800, 142, 'Two ribbons compared');
    root.appendChild(S('line', { x1: x0, y1: ay, x2: x0 + 100 * ppc, y2: ay, class: 'uc-axis' }));
    for (var k = 0; k <= 100; k += 10) {
      root.appendChild(S('line', { x1: x0 + k * ppc, y1: ay - 5, x2: x0 + k * ppc, y2: ay + 5, class: 'uc-axis' }));
      root.appendChild(txt(x0 + k * ppc, ay - 10, k === 100 ? '100 cm' : k, 'uc-small'));
    }
    var rows = [
      { left: c.a + ' m', cm: c.acm, cls: 'uc-ribbon-a' },
      { left: c.b + ' cm', cm: c.b, cls: 'uc-ribbon-b' },
    ];
    var longest = Math.max(c.acm, c.b);
    root.appendChild(S('line', { x1: x0 + longest * ppc, y1: ay + 6, x2: x0 + longest * ppc, y2: 136, class: 'uc-guide' }));
    rows.forEach(function (r, i) {
      var y = 50 + i * 46;
      root.appendChild(S('rect', { x: x0, y: y, width: r.cm * ppc, height: 30, rx: 6, class: r.cls }));
      root.appendChild(txt(x0 - 14, y + 22, r.left, 'uc-lab', 'end'));
      // values in one column to the right of the scale, clear of the dashed guide line
      root.appendChild(txt(x0 + 100 * ppc + 16, y + 22, r.cm + ' cm', r.cm === longest ? 'uc-lab uc-lab-strong' : 'uc-lab uc-lab-soft', 'start'));
    });
    return root;
  }

  /* ------------------------------------------------------------------ *
   * Working-out helpers
   * ------------------------------------------------------------------ */
  function hundreds(n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(100);
    return a;
  }
  function countHundreds(n) {
    if (n <= 7) {
      return hundreds(n)
        .map(function (v, i) {
          return (i + 1) * 100;
        })
        .join(', ');
    }
    return '100, 200, 300 … ' + n * 100;
  }
  /** 100 + 100 + 100 = 300 cm as chips for small counts, a counting line for big ones. */
  function hundredsWorking(n, extra) {
    var parts = hundreds(n);
    if (extra) parts.push(extra);
    if (parts.length <= 6) return MQ.ui.sum(parts, n * 100 + (extra || 0), 'cm');
    var line = 'Count in hundreds: ' + countHundreds(n) + ' cm';
    if (extra) line += ', then ' + n * 100 + ' + ' + extra + ' = ' + (n * 100 + extra) + ' cm';
    return el('div', { class: 'uc-cap' }, line);
  }
  function fact(text) {
    return el('div', { class: 'uc-fact' }, text);
  }
  function revealPanel(fig, working, factText) {
    return el('div', { class: 'uc-reveal-box' }, el('div', { class: 'uc-fig' }, fig), working || null, factText ? fact(factText) : null);
  }

  /* ------------------------------------------------------------------ *
   * Question bank
   * Each builder returns { key, kind, ctx, ask, unit, answer, answerLabel,
   * options, say, praise, diagnose(v) -> {hint, tag}, hint2, reveal(), explain }
   * ------------------------------------------------------------------ */
  var WHOLE = [
    { n: 2, icon: '🚪', s: 'The classroom door is # tall.' },
    { n: 3, icon: '🛏️', s: 'The bedroom is # wide.' },
    { n: 4, icon: '🏫', s: 'The classroom board is # long.' },
    { n: 5, icon: '🌳', s: 'The garden is # long.' },
    { n: 6, icon: '🚐', s: 'A minibus is # long.' },
    { n: 7, icon: '🌻', s: 'The garden fence is # long.' },
    { n: 8, icon: '🚶', s: 'The school corridor is # long.' },
    { n: 9, icon: '🚌', s: 'The school bus is # long.' },
  ];

  var MIXED = [
    { whole: 3, piece: 50, icon: '🎀', s: 'A roll of ribbon is 3½ m long.', opts: [300, 350, 35] },
    { whole: 5, piece: 25, icon: '🌱', s: 'The garden hose is 5¼ m long.', opts: [550, 575, 525, 500] },
    { whole: 2, piece: 50, icon: '🛋️', s: 'The sofa is 2½ m long.', opts: [200, 250, 25] },
    { whole: 4, piece: 75, icon: '🍳', s: 'The kitchen is 4¾ m long.', opts: [400, 425, 450, 475] },
    { whole: 6, piece: 25, icon: '🧵', s: 'A ball of string is 6¼ m long.', opts: [600, 625, 650, 675] },
  ];

  var HALF_CM = [
    { cm: 150, icon: '🧣', s: 'A long scarf is 150 cm long.' },
    { cm: 250, icon: '👕', s: 'The washing line is 250 cm long.' },
    { cm: 350, icon: '🪜', s: 'A ladder is 350 cm long.' },
    { cm: 450, icon: '🚗', s: 'A car is 450 cm long.' },
  ];

  var COMPARE = [
    { a: '¾', acm: 75, b: 70 },
    { a: '½', acm: 50, b: 45 },
    { a: '¼', acm: 25, b: 30 },
    { a: '¾', acm: 75, b: 80 },
    { a: '½', acm: 50, b: 60 },
    { a: '½', acm: 50, b: 50 },
  ];

  function cmOptions(values) {
    return values.map(function (v) {
      return { label: v + ' cm', value: v };
    });
  }
  function mOptions(values) {
    return values.map(function (v) {
      return { label: U.fmt(v) + ' m', value: v };
    });
  }

  /** Likely slips when changing whole metres into centimetres. */
  function mToCmDiagnose(metres, v) {
    if (U.same(v, metres * 10)) return { hint: 'That gives 10 cm for each metre. But 1 metre is 100 cm!', tag: 'Used 10 instead of 100 (m to cm)' };
    if (U.same(v, metres * 1000)) return { hint: '1000 goes with kilometres (1 km = 1000 m). For metres, 1 m = 100 cm.', tag: 'Mixed up 100 cm and 1000 m' };
    if (U.same(v, metres)) return { hint: 'That is the number of metres. Now change it into centimetres.', tag: 'Wrote metres instead of centimetres' };
    return { hint: 'Not quite. Each metre is 100 cm. Count in hundreds.', tag: 'Counting in hundreds slip (m to cm)' };
  }

  function qCmInM() {
    return {
      key: 'cm-in-m',
      kind: 'choice',
      ctx: { icon: '📏', text: 'A metre stick is 1 m long.' },
      ask: '1 m =',
      answer: 100,
      answerLabel: '100 cm',
      options: cmOptions([10, 100, 1000]),
      say: 'How many centimetres make 1 metre?',
      praise: 'Yes! 10 blocks of 10 cm make 100 cm.',
      diagnose: function (v) {
        if (v === 10) return { hint: '10 cm is only about as long as a crayon. A metre is much longer!', tag: 'Thought 1 m = 10 cm (it is 100 cm)' };
        return { hint: '1000 goes with kilometres: 1 km = 1000 m. How many cm make 1 metre?', tag: 'Mixed up 100 cm and 1000 m' };
      },
      hint2: 'Think of the metre we built: 10 blocks of 10 cm. Count in tens: 10, 20, 30 …',
      reveal: function () {
        return revealPanel(blocksFig(10), el('div', { class: 'uc-cap' }, 'Count in tens: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100'), '1 m = 100 cm');
      },
      explain: '10 blocks of 10 cm make 100 cm.',
    };
  }

  function qHalfM() {
    return {
      key: 'half-m',
      kind: 'input',
      ctx: { icon: '📚', text: 'The bookshelf is ½ m wide.' },
      ask: '½ m =',
      unit: 'cm',
      answer: 50,
      answerLabel: '50 cm',
      say: 'Half a metre. How many centimetres?',
      praise: 'Yes! 50 + 50 = 100, so ½ m = 50 cm.',
      diagnose: function (v) {
        if (U.same(v, 5)) return { hint: '5 cm is tiny, like a fingertip! A whole metre is 100 cm. What is half of 100?', tag: 'Halved 10 instead of 100' };
        if (U.same(v, 500)) return { hint: '500 is half of 1000. That is for kilometres. A metre is only 100 cm.', tag: 'Mixed up ½ m and ½ km' };
        if (U.same(v, 100)) return { hint: '100 cm is a whole metre. Half a metre is less.', tag: 'Gave a whole metre instead of half' };
        if (U.same(v, 25)) return { hint: '25 cm is a quarter of a metre. Half is bigger.', tag: 'Mixed up half and quarter' };
        return { hint: 'A metre is 100 cm. What is half of 100?', tag: 'Half a metre in cm' };
      },
      hint2: 'Split 100 cm into 2 equal parts. How many cm in each part?',
      reveal: function () {
        return revealPanel(fracFig('half'), MQ.ui.sum([50, 50], 100, 'cm'), '½ m = 50 cm');
      },
      explain: '100 cm in 2 equal parts: 50 + 50.',
    };
  }

  function qWholeM(w) {
    var n = w.n;
    return {
      key: 'whole-m-' + n,
      kind: 'input',
      ctx: { icon: w.icon, text: w.s.replace('#', n + ' m') },
      ask: n + ' m =',
      unit: 'cm',
      answer: n * 100,
      answerLabel: n * 100 + ' cm',
      say: 'Change the metres into centimetres.',
      praise: 'Yes! ' + n + ' hundreds make ' + n * 100 + ' cm.',
      diagnose: function (v) {
        return mToCmDiagnose(n, v);
      },
      hint2: 'Count in hundreds, one hundred for each metre: 100, 200, 300 … Stop after ' + n + '.',
      reveal: function () {
        return revealPanel(sticksFig(n, 0), hundredsWorking(n), n + ' m = ' + n * 100 + ' cm');
      },
      explain: n + ' sticks of 100 cm. So ' + n + ' m = ' + n * 100 + ' cm.',
    };
  }

  function qHalfKm() {
    return {
      key: 'half-km',
      kind: 'choice',
      ctx: { icon: '🛒', text: 'The shop is ½ km from home.' },
      ask: '½ km =',
      answer: 500,
      answerLabel: '500 m',
      options: mOptions([1000, 500, 10]),
      say: 'Half a kilometre. How many metres?',
      praise: 'Yes! Half of 1000 m is 500 m.',
      diagnose: function (v) {
        if (v === 1000) return { hint: '1000 m is a whole kilometre. Half a kilometre is less.', tag: 'Gave a whole km instead of half' };
        return { hint: '10 m is only a few big steps! 1 km is 1000 m. What is half of that?', tag: 'Mixed up the km fact (1 km = 1000 m)' };
      },
      hint2: '1 km is 1000 m, like 10 football pitches. Half is 5 pitches of 100 m.',
      reveal: function () {
        return revealPanel(roadFig({ shadeTo: 500, flags: flagsUpTo(500).slice(1) }), MQ.ui.sum([100, 100, 100, 100, 100], 500, 'm'), '½ km = 500 m');
      },
      explain: 'Half of 10 pitches is 5 pitches: 500 m.',
    };
  }

  function qQuarterKm() {
    return {
      key: 'quarter-km',
      kind: 'choice',
      ctx: { icon: '🏫', text: 'The walk to school is ¼ km.' },
      ask: '¼ km =',
      answer: 250,
      answerLabel: '250 m',
      options: mOptions([25, 250, 750]),
      say: 'A quarter of a kilometre. How many metres?',
      praise: 'Yes! ¼ km = 250 m.',
      diagnose: function (v) {
        if (v === 25) return { hint: '25 is a quarter of 100. But 1 km is 1000 m, not 100 m!', tag: 'Quarter of 100 instead of 1000 (km)' };
        return { hint: '750 m is three quarters of a km. One quarter is smaller.', tag: 'Mixed up ¼ and ¾' };
      },
      hint2: 'Half of 1000 m is 500 m. A quarter is half of that again.',
      reveal: function () {
        return revealPanel(roadFig({ shadeTo: 250, flags: flagsUpTo(250) }), MQ.ui.sum([100, 100, 50], 250, 'm'), '¼ km = 250 m');
      },
      explain: '2½ pitches: 100 + 100 + 50 = 250 m.',
    };
  }

  function qThreeQKm() {
    return {
      key: 'threeq-km',
      kind: 'choice',
      ctx: { icon: '🌳', text: 'The path around the park is ¾ km.' },
      ask: '¾ km =',
      answer: 750,
      answerLabel: '750 m',
      options: mOptions([75, 450, 750]),
      say: 'Three quarters of a kilometre. How many metres?',
      praise: 'Yes! 250 + 250 + 250 = 750 m.',
      diagnose: function (v) {
        if (v === 75) return { hint: '75 is ¾ of 100. But a kilometre is 1000 m!', tag: 'Quarter or three-quarter conversion (used 100, not 1000)' };
        return { hint: 'Close! ¼ km is 250 m. ¾ km is three of those quarters.', tag: 'Quarter or three-quarter conversion' };
      },
      hint2: 'Add three quarters of a kilometre: 250 + 250 + 250.',
      reveal: function () {
        return revealPanel(roadFig({ shadeTo: 750, flags: flagsUpTo(750) }), MQ.ui.sum([250, 250, 250], 750, 'm'), '¾ km = 750 m');
      },
      explain: 'Three quarters: 250 + 250 + 250 = 750 m.',
    };
  }

  function qMixed(m) {
    var total = m.whole * 100 + m.piece;
    var label = m.whole + FR[m.piece];
    return {
      key: 'mixed-' + total,
      kind: 'choice',
      ctx: { icon: m.icon, text: m.s },
      ask: label + ' m =',
      answer: total,
      answerLabel: total + ' cm',
      options: cmOptions(m.opts),
      columns: m.opts.length,
      say: 'Whole metres and a part. How many centimetres?',
      praise: 'Yes! ' + m.whole * 100 + ' + ' + m.piece + ' = ' + total + ' cm.',
      diagnose: function (v) {
        if (v === m.whole * 100) return { hint: v + ' cm is just the ' + m.whole + ' whole metres. Add the ' + FR[m.piece] + ' m too!', tag: 'Forgot the fraction part of the metre' };
        if (v < 100) return { hint: 'That is far too short! Each whole metre is 100 cm, not 10 cm.', tag: 'Used 10 instead of 100 (m to cm)' };
        var part = v - m.whole * 100;
        if (FR[part]) {
          var swap = (part === 25 && m.piece === 75) || (part === 75 && m.piece === 25);
          return { hint: v + ' cm would be ' + m.whole + FR[part] + ' m. How many cm is ' + FR[m.piece] + ' of a metre?', tag: swap ? 'Mixed up ¼ and ¾' : 'Quarter or three-quarter conversion' };
        }
        return { hint: 'Count the whole metres in hundreds, then add the part.', tag: 'Counting in hundreds slip (m to cm)' };
      },
      hint2: 'Count ' + m.whole + ' metres in hundreds (100, 200 …), then add ' + m.piece + ' cm for the ' + FR[m.piece] + ' m.',
      reveal: function () {
        return revealPanel(sticksFig(m.whole, m.piece), hundredsWorking(m.whole, m.piece), label + ' m = ' + total + ' cm');
      },
      explain: m.whole + ' sticks and ' + FR[m.piece] + ' of a stick: ' + m.whole * 100 + ' + ' + m.piece + ' = ' + total + ' cm.',
    };
  }

  function qTenM() {
    return {
      key: 'ten-m',
      kind: 'input',
      ctx: { icon: '🧱', text: 'The playground wall is 10 m long.' },
      ask: '10 m =',
      unit: 'cm',
      answer: 1000,
      answerLabel: '1000 cm',
      say: 'Ten metres. How many centimetres?',
      praise: 'Yes! Ten hundreds make 1000 cm.',
      diagnose: function (v) {
        if (U.same(v, 100)) return { hint: '100 cm is just 1 metre. The wall is 10 metres long!', tag: 'Used 10 instead of 100 (m to cm)' };
        return mToCmDiagnose(10, v);
      },
      hint2: 'Count in hundreds ten times: 100, 200, 300 … Ten hundreds make one thousand.',
      reveal: function () {
        return revealPanel(sticksFig(10, 0), hundredsWorking(10), '10 m = 1000 cm');
      },
      explain: 'Ten sticks of 100 cm make 1000 cm.',
    };
  }

  function qThreeQM() {
    return {
      key: 'threeq-m',
      kind: 'input',
      ctx: { icon: '🪑', text: 'The school desk is ¾ m tall.' },
      ask: '¾ m =',
      unit: 'cm',
      answer: 75,
      answerLabel: '75 cm',
      say: 'Three quarters of a metre. How many centimetres?',
      praise: 'Yes! 25 + 25 + 25 = 75 cm.',
      diagnose: function (v) {
        if (U.same(v, 750)) return { hint: '750 goes with kilometres: ¾ km = 750 m. A metre is only 100 cm.', tag: 'Mixed up ¾ m and ¾ km' };
        if (U.same(v, 25)) return { hint: '25 cm is one quarter. You need three quarters.', tag: 'Used ¼ instead of ¾' };
        if (U.same(v, 50)) return { hint: '50 cm is half a metre. ¾ is more than half.', tag: 'Used ½ instead of ¾' };
        if (U.same(v, 0.75)) return { hint: 'Write your answer in centimetres. How many cm is ¼ of a metre?', tag: 'Did not change ¾ m into cm' };
        if (U.same(v, 34) || U.same(v, 3)) return { hint: '¾ means 3 out of 4 equal parts of 100 cm.', tag: 'Wrote the fraction digits as cm' };
        return { hint: '¾ means 3 quarters. How many cm is one quarter of 100?', tag: 'Quarter or three-quarter conversion' };
      },
      hint2: 'One quarter of a metre is 25 cm. Add three of them: 25 + 25 + 25.',
      reveal: function () {
        return revealPanel(fracFig('threeq'), MQ.ui.sum([25, 25, 25], 75, 'cm'), '¾ m = 75 cm');
      },
      explain: 'Three quarters: 25 + 25 + 25 = 75 cm.',
    };
  }

  function qCmToM(w) {
    var n = w.n;
    var cm = n * 100;
    return {
      key: 'cm-to-m-' + n,
      kind: 'input',
      ctx: { icon: w.icon, text: w.s.replace('#', cm + ' cm') },
      ask: cm + ' cm =',
      unit: 'm',
      answer: n,
      answerLabel: n + ' m',
      say: 'Now go the other way: centimetres into metres.',
      praise: 'Yes! ' + cm + ' cm is ' + n + ' hundreds, so ' + n + ' m.',
      diagnose: function (v) {
        if (U.same(v, n * 10)) return { hint: 'That uses 10 cm in a metre. But 100 cm make 1 m!', tag: 'Used 10 instead of 100 (cm to m)' };
        if (U.same(v, cm)) return { hint: cm + ' m would be a very long way! Change the centimetres into metres.', tag: 'Copied the cm number as metres' };
        return { hint: 'Every 100 cm makes 1 m. How many hundreds are in ' + cm + '?', tag: 'Counting in hundreds slip (cm to m)' };
      },
      hint2: 'Count in hundreds up to ' + cm + ': 100, 200, 300 … How many hundreds did you count?',
      reveal: function () {
        return revealPanel(sticksFig(n, 0), hundredsWorking(n), cm + ' cm = ' + n + ' m');
      },
      explain: cm + ' cm is ' + n + ' sticks of 100 cm, so ' + n + ' m.',
    };
  }

  function qHalfCmToM(h) {
    var whole = Math.floor(h.cm / 100);
    var ans = whole + 0.5;
    var parts = hundreds(whole).concat([50]);
    return {
      key: 'half-cm-' + h.cm,
      kind: 'choice',
      ctx: { icon: h.icon, text: h.s },
      ask: h.cm + ' cm =',
      answer: ans,
      answerLabel: U.fmt(ans) + ' m',
      options: mOptions([ans, h.cm / 10, h.cm]),
      say: 'How many metres is that?',
      praise: 'Yes! ' + whole * 100 + ' cm + 50 cm = ' + U.fmt(ans) + ' m.',
      diagnose: function (v) {
        if (U.same(v, h.cm / 10)) return { hint: v + ' m is longer than a classroom! Remember: 100 cm make 1 m.', tag: 'Wrote cm as tens of metres (e.g. 250 cm as 25 m)' };
        return { hint: h.cm + ' m would be a long walk! Change the centimetres into metres.', tag: 'Copied the cm number as metres' };
      },
      hint2: h.cm + ' = ' + parts.join(' + ') + '. Each 100 cm is 1 m, and 50 cm is ½ m.',
      reveal: function () {
        return revealPanel(sticksFig(whole, 50), MQ.ui.sum(parts, h.cm, 'cm'), h.cm + ' cm = ' + U.fmt(ans) + ' m');
      },
      explain: whole + (whole === 1 ? ' whole metre' : ' whole metres') + ' and half a metre: ' + U.fmt(ans) + ' m.',
    };
  }

  function qMToKm(m) {
    var ans = m / 1000;
    var big = m / 100; // 7½ or 2½: the "100 m in a km" slip
    return {
      key: 'm-to-km-' + m,
      kind: 'choice',
      ctx: m === 750 ? { icon: '⚽', text: 'From home to the school field is 750 m.' } : { icon: '📮', text: 'From home to the post box is 250 m.' },
      ask: m + ' m =',
      answer: ans,
      answerLabel: FR[m / 10] + ' km',
      options: [0.25, 0.5, 0.75, big].map(function (v) {
        return { label: U.fmt(v) + ' km', value: v };
      }),
      columns: 4,
      say: 'What part of a kilometre is that?',
      praise: m === 750 ? 'Yes! 750 m is three lots of 250 m: ¾ km.' : 'Yes! 250 m is one quarter of 1000 m: ¼ km.',
      diagnose: function (v) {
        if (U.same(v, big)) return { hint: U.fmt(v) + ' km would be ' + v * 1000 + ' m. ' + m + ' m is less than 1 km.', tag: 'Used 100 m in a km instead of 1000' };
        if (U.same(v, 0.5)) return { hint: '½ km is 500 m. ' + m + ' m is ' + (m > 500 ? 'more' : 'less') + ' than that.', tag: 'Quarter or three-quarter conversion' };
        if (U.same(v, 0.25)) return { hint: '¼ km is only 250 m. 750 m is more.', tag: 'Mixed up ¼ and ¾' };
        return { hint: '¾ km is 750 m. 250 m is less.', tag: 'Mixed up ¼ and ¾' };
      },
      hint2: m === 750 ? '¼ km is 250 m. How many 250s make 750? 250 + 250 + 250 …' : 'Half of 1000 m is 500 m. Half of 500 m is 250 m. What part of a km is that?',
      reveal: function () {
        return revealPanel(roadFig({ shadeTo: m, flags: flagsUpTo(1000) }), MQ.ui.sum(m === 750 ? [250, 250, 250] : [250, 250, 250, 250], m === 750 ? 750 : 1000, 'm'), m + ' m = ' + FR[m / 10] + ' km');
      },
      explain: m === 750 ? '750 m is 3 quarters of 1000 m: ¾ km.' : '250 m is 1 of 4 equal parts of 1000 m: ¼ km.',
    };
  }

  function qCompare(c) {
    var ans = c.acm > c.b ? 'a' : c.acm < c.b ? 'b' : 'same';
    var aWork = { '¾': '25 + 25 + 25 cm', '½': 'half of 100 cm', '¼': 'a quarter of 100 cm' }[c.a];
    var winner = ans === 'a' ? c.a + ' m' : c.b + ' cm';
    return {
      key: 'compare-' + c.a + '-' + c.b,
      kind: 'choice',
      ctx: { icon: '🎀', text: 'Two ribbons: one is ' + c.a + ' m, the other is ' + c.b + ' cm.' },
      ask: 'Which ribbon is longer?',
      noBlank: true,
      answer: ans,
      answerLabel: ans === 'same' ? 'Both the same' : winner,
      options: [
        { label: c.a + ' m', value: 'a' },
        { label: c.b + ' cm', value: 'b' },
        { label: 'Both the same', value: 'same' },
      ],
      say: 'Change them into the same unit, then compare.',
      praise: ans === 'same' ? 'Yes! ' + c.a + ' m = ' + c.acm + ' cm, the same as ' + c.b + ' cm.' : 'Yes! ' + c.a + ' m = ' + c.acm + ' cm, so ' + winner + ' is longer.',
      diagnose: function (v) {
        if (v === 'same') return { hint: 'Are they really the same? Change ' + c.a + ' m into cm and check.', tag: 'Compared m and cm without converting' };
        return { hint: 'Change ' + c.a + ' m into centimetres first. Then compare the two numbers.', tag: 'Compared m and cm without converting' };
      },
      hint2: c.a + ' m is ' + aWork + '. Is that more or less than ' + c.b + ' cm?',
      reveal: function () {
        var line = ans === 'same' ? c.acm + ' cm and ' + c.b + ' cm are the same length.' : 'The longer ribbon is ' + winner + '.';
        return revealPanel(compareFig(c), el('div', { class: 'uc-cap' }, line), c.a + ' m = ' + c.acm + ' cm');
      },
      explain: c.a + ' m = ' + c.acm + ' cm. Compare it with ' + c.b + ' cm.',
    };
  }

  /* ------------------------------------------------------------------ *
   * Deck: 4 level-1, 3 level-2 and 3 level-3 questions (matches api.level
   * for count 10). No question appears twice, and no fact appears both ways.
   * ------------------------------------------------------------------ */
  var deck = null;

  function buildDeck() {
    var wholes = U.shuffle(WHOLE);
    var w1 = wholes.filter(function (w) {
      return [2, 3, 4, 5, 7].indexOf(w.n) !== -1;
    })[0];
    var w3 = wholes.filter(function (w) {
      return w.n !== w1.n;
    })[0];

    // Level 1: the two big facts, a half, and whole metres.
    var level1 = [qCmInM()].concat(U.shuffle([qHalfM(), qWholeM(w1), qHalfKm()]));

    // Level 2: quarters of a km, mixed metres, bigger numbers.
    var quarterFirst = Math.random() < 0.5;
    var mixed = U.pick(MIXED);
    var level2 = U.shuffle([quarterFirst ? qQuarterKm() : qThreeQKm(), qMixed(mixed), Math.random() < 0.5 ? qTenM() : qThreeQM()]);

    // Level 3: reverse conversions and comparing.
    var mixedCm = mixed.whole * 100 + mixed.piece;
    var halfCm = U.pick(
      HALF_CM.filter(function (h) {
        return h.cm !== mixedCm; // 2½ m → 250 cm is not asked back as 250 cm → 2½ m
      })
    );
    var mToKmMetres = quarterFirst ? 750 : 250; // ¼ km → 250 m is not asked back as 250 m → ¼ km
    var reverse = U.shuffle([
      function () {
        return qHalfCmToM(halfCm);
      },
      function () {
        return qMToKm(mToKmMetres);
      },
      function () {
        return qCompare(U.pick(COMPARE));
      },
    ])
      .slice(0, 2)
      .map(function (f) {
        return f();
      });
    var level3 = U.shuffle([qCmToM(w3)].concat(reverse));

    return level1.concat(level2, level3);
  }

  /* ------------------------------------------------------------------ *
   * One practice question
   * ------------------------------------------------------------------ */
  function eq(a, b) {
    return typeof a === 'number' && typeof b === 'number' ? U.same(a, b) : a === b;
  }

  function renderQuestion(stage, api, q) {
    api.say(q.say, 'think');
    stage.appendChild(el('div', { class: 'uc-ctx' }, el('span', { class: 'uc-ctx-icon', 'aria-hidden': 'true' }, q.ctx.icon), el('span', null, q.ctx.text)));

    // Choice questions: big prompt with a blank. Number questions: "7 m = [   ] cm" in one row.
    var blank = null;
    if (q.kind === 'choice') {
      blank = q.noBlank ? null : el('span', { class: 'uc-blank' }, '?');
      var promptEl = MQ.ui.prompt('');
      promptEl.classList.add('uc-prompt');
      promptEl.appendChild(document.createTextNode(q.ask + ' '));
      if (blank) promptEl.appendChild(blank);
      stage.appendChild(promptEl);
    }

    function fill() {
      if (!blank) return;
      blank.textContent = q.answerLabel;
      blank.classList.add('uc-filled');
    }

    var tip = el('div', { class: 'uc-tip', hidden: true }, '💡 1 m = 100 cm   ·   1 km = 1000 m');
    var revealBox = el('div', { class: 'uc-reveal' });

    function wrong(v) {
      var d = q.diagnose(v);
      var msg = api.tries() >= 1 ? q.hint2 : d.hint;
      // Level 1 shows the facts after one slip; later levels only after two.
      if (api.level === 1 || api.tries() >= 1) tip.hidden = false;
      api.check(false, msg, d.tag);
    }

    var answerEl;
    var markAnswer;
    if (q.kind === 'choice') {
      // Shuffle the options (except "which is longer", which keeps its natural order) so the
      // right answer is not always in the same place.
      var ch = MQ.ui.choices(
        q.noBlank ? q.options : U.shuffle(q.options),
        function (v, btn) {
          if (api.isAnswered()) return;
          if (eq(v, q.answer)) {
            ch.mark(v, 'good');
            ch.disable();
            fill();
            api.check(true, q.praise);
          } else {
            ch.mark(v, 'bad');
            btn.disabled = true;
            wrong(v);
          }
        },
        { columns: q.columns || q.options.length }
      );
      answerEl = ch;
      markAnswer = function () {
        ch.mark(q.answer, 'good');
        ch.disable();
      };
    } else {
      var ni = MQ.ui.numberInput({
        prefix: q.ask,
        unit: q.unit,
        onSubmit: function (num) {
          if (api.isAnswered()) return;
          if (U.same(num, q.answer)) {
            ni.good();
            ni.disable();
            fill();
            api.check(true, q.praise);
          } else {
            ni.bad();
            wrong(num);
            try {
              ni.input.select();
            } catch (e) {}
          }
        },
      });
      answerEl = el('div', { class: 'uc-numq' }, ni.el);
      ni.focus();
      markAnswer = function () {
        ni.setValue(U.fmt(q.answer));
        ni.good();
        ni.disable();
      };
    }
    stage.appendChild(answerEl);
    stage.appendChild(tip);
    stage.appendChild(revealBox);

    // "Show me": mark the right answer, then draw the picture with the working.
    api.onReveal(function () {
      markAnswer();
      fill();
      tip.hidden = true;
      MQ.clear(revealBox);
      revealBox.appendChild(q.reveal());
      api.feedback(q.explain, 'info');
      try {
        revealBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } catch (e) {}
    });
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */
  function learnBuildMetre(stage, api) {
    api.say('Each block is 10 cm, about as long as a crayon. Add blocks to make a metre!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Building a metre', 'Click <b>Add 10 cm</b> or an empty space.'));
    var counter = el('div', { class: 'uc-counter', 'aria-live': 'polite' }, '0 cm');
    var figHolder = el('div', { class: 'uc-fig' });
    var addBtn = el('button', { class: 'btn', type: 'button' }, '➕ Add 10 cm');
    var done = el('div', { class: 'uc-fact uc-pop', hidden: true }, '100 cm = 1 m');
    var n = 0;
    function draw() {
      MQ.clear(figHolder);
      figHolder.appendChild(blocksFig(n, n < 10 ? add : null));
      counter.textContent = n * 10 + ' cm';
    }
    function add() {
      if (n >= 10) return;
      n++;
      api.sound('pop');
      draw();
      if (n === 1) api.say('10 cm. Keep going!');
      else if (n === 5) api.say('50 cm. Halfway there!');
      else if (n === 9) api.say('90 cm. One more block!');
      if (n === 10) {
        addBtn.disabled = true;
        done.hidden = false;
        api.sound('correct');
        api.say('10 jumps of 10 make 100. So 1 metre is 100 centimetres!', 'cheer');
        api.feedback('100 cm = 1 m. Press Next.', 'good');
        api.unlockNext();
      }
    }
    addBtn.addEventListener('click', add);
    draw();
    stage.appendChild(counter);
    stage.appendChild(figHolder);
    stage.appendChild(addBtn);
    stage.appendChild(done);
  }

  function learnHalves(stage, api) {
    api.say('A metre is 100 cm. Click each button to cut the metre into parts.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Halves and quarters of a metre', null));
    var figHolder = el('div', { class: 'uc-fig' }, fracFig(null));
    var panel = el('div', { class: 'uc-panel' }, el('div', { class: 'uc-cap' }, 'Try ½ m, ¼ m and ¾ m.'));
    var tried = {};
    var INFO = {
      half: { label: '½ m', fact: '½ m = 50 cm', cap: '2 equal parts', sum: [[50, 50], 100], say: 'Cut 100 cm into 2 equal parts. Each half is 50 cm.' },
      quarter: { label: '¼ m', fact: '¼ m = 25 cm', cap: '4 equal parts', sum: [[25, 25, 25, 25], 100], say: 'Cut 100 cm into 4 equal parts. Each quarter is 25 cm.' },
      threeq: { label: '¾ m', fact: '¾ m = 75 cm', cap: '3 of the 4 parts', sum: [[25, 25, 25], 75], say: 'Three quarters is 3 parts: 25 + 25 + 25 = 75 cm.' },
    };
    var btns = {};
    var row = el('div', { class: 'uc-row' });
    ['half', 'quarter', 'threeq'].forEach(function (k) {
      btns[k] = el('button', { class: 'btn btn-ghost uc-fbtn', type: 'button', onclick: function () { show(k); } }, INFO[k].label);
      row.appendChild(btns[k]);
    });
    function show(k) {
      var info = INFO[k];
      api.sound('pop');
      MQ.clear(figHolder);
      figHolder.appendChild(fracFig(k));
      MQ.clear(panel);
      panel.appendChild(fact(info.fact));
      panel.appendChild(el('div', { class: 'uc-cap' }, info.cap));
      panel.appendChild(MQ.ui.sum(info.sum[0], info.sum[1], 'cm'));
      Object.keys(btns).forEach(function (b) {
        btns[b].classList.toggle('uc-now', b === k);
      });
      btns[k].classList.add('uc-done');
      tried[k] = true;
      if (tried.half && tried.quarter && tried.threeq) {
        api.say(info.say + ' Great, you tried them all!', 'cheer');
        api.feedback('½ m = 50 cm · ¼ m = 25 cm · ¾ m = 75 cm', 'good');
        api.unlockNext();
      } else {
        api.say(info.say);
      }
    }
    stage.appendChild(figHolder);
    stage.appendChild(row);
    stage.appendChild(panel);
  }

  function learnKilometre(stage, api) {
    api.say('A football pitch is about 100 m long. 10 pitches in a row make 1 kilometre! Click each flag.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('A kilometre', '1 km = 1000 m'));
    var figHolder = el('div', { class: 'uc-fig uc-fig-wide' });
    var panel = el('div', { class: 'uc-panel' }, el('div', { class: 'uc-cap' }, 'Click a ? flag to see how far it is.'));
    var revealed = {};
    var current = 0;
    var INFO = {
      250: { fact: '¼ km = 250 m', work: function () { return MQ.ui.sum([100, 100, 50], 250, 'm'); }, say: '2½ pitches. A quarter of a kilometre is 250 m.' },
      500: { fact: '½ km = 500 m', work: function () { return MQ.ui.sum([100, 100, 100, 100, 100], 500, 'm'); }, say: 'Half of 10 pitches is 5 pitches: 500 m.' },
      750: { fact: '¾ km = 750 m', work: function () { return MQ.ui.sum([250, 250, 250], 750, 'm'); }, say: 'Three quarters: 250 + 250 + 250 = 750 m.' },
      1000: { fact: '1 km = 1000 m', work: function () { return el('div', { class: 'uc-cap' }, 'Count in hundreds: 100, 200, 300 … 1000 m'); }, say: '10 pitches of 100 m make 1000 m. That is 1 kilometre!' },
    };
    function draw() {
      MQ.clear(figHolder);
      figHolder.appendChild(
        roadFig({
          shadeTo: current,
          flags: QUARTER_FLAGS.map(function (f) {
            return { m: f.m, top: f.top, bottom: f.bottom, on: !!revealed[f.m], onClick: function () { open(f.m); } };
          }),
        })
      );
    }
    function open(m) {
      revealed[m] = true;
      current = m;
      api.sound('pop');
      draw();
      MQ.clear(panel);
      panel.appendChild(fact(INFO[m].fact));
      panel.appendChild(INFO[m].work());
      if (revealed[250] && revealed[500] && revealed[750] && revealed[1000]) {
        api.say(INFO[m].say + ' You found them all!', 'cheer');
        api.feedback('¼ km = 250 m · ½ km = 500 m · ¾ km = 750 m · 1 km = 1000 m', 'good');
        api.unlockNext();
      } else {
        api.say(INFO[m].say);
      }
    }
    draw();
    stage.appendChild(figHolder);
    stage.appendChild(panel);
  }

  function learnLotsOfMetres(stage, api) {
    api.say('Each metre stick is 100 cm. Add sticks and count in hundreds!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Lots of metres', null));
    var whole = 1;
    var piece = 0;
    var figHolder = el('div', { class: 'uc-fig' });
    var sumHolder = el('div', { class: 'uc-panel uc-panel-short' });
    var addStick = el('button', { class: 'btn', type: 'button' }, '➕ Add a metre stick');
    var addHalf = el('button', { class: 'btn', type: 'button', disabled: true }, '➕ Add half a stick');
    function draw() {
      MQ.clear(figHolder);
      figHolder.appendChild(sticksFig(whole, piece, { minRows: 4 }));
      MQ.clear(sumHolder);
      var label = whole + (piece ? FR[piece] : '');
      sumHolder.appendChild(fact(label + ' m = ' + (whole * 100 + piece) + ' cm'));
      sumHolder.appendChild(whole + (piece ? 1 : 0) > 1 ? hundredsWorking(whole, piece) : el('div', { class: 'uc-cap' }, 'One metre stick is 100 cm.'));
    }
    addStick.addEventListener('click', function () {
      if (whole >= 3) return;
      whole++;
      api.sound('pop');
      draw();
      if (whole === 3) {
        addStick.disabled = true;
        addHalf.disabled = false;
        api.say('3 m = 100 + 100 + 100 = 300 cm. Now add half a stick!');
      } else {
        api.say(whole + ' sticks: 100, 200. Add one more!');
      }
    });
    addHalf.addEventListener('click', function () {
      if (piece) return;
      piece = 50;
      addHalf.disabled = true;
      api.sound('correct');
      draw();
      api.say('Half a metre is 50 cm. 300 + 50 = 350 cm. So 3½ m = 350 cm!', 'cheer');
      api.feedback('3 m = 300 cm and 3½ m = 350 cm. Time to practise!', 'good');
      api.unlockNext();
    });
    draw();
    stage.appendChild(figHolder);
    stage.appendChild(el('div', { class: 'uc-row' }, addStick, addHalf));
    stage.appendChild(sumHolder);
  }

  MQ.register('unit-converter', {
    learn: [learnBuildMetre, learnHalves, learnKilometre, learnLotsOfMetres],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0 || !deck[api.index]) deck = buildDeck();
        renderQuestion(stage, api, deck[api.index]);
      },
    },
  });

  /* Activity-specific styles. */
  var css = [
    '.uc-svg{display:block;width:100%;height:auto;margin:0 auto;user-select:none;-webkit-user-select:none}',
    '.uc-fig{width:100%;max-width:800px}',
    '.uc-fig-wide{max-width:820px}',
    '.uc-stick-body{fill:#fff4d6}',
    '.uc-stick-band{fill:#ffd08a}',
    '.uc-stick-edge{fill:none;stroke:#b5730f;stroke-width:2}',
    '.uc-tick{stroke:#8a5608;stroke-width:1.5}',
    '.uc-lab{font-size:18px;font-weight:800;fill:#1b2a4a}',
    '.uc-lab-sm{font-size:17px}',
    '.uc-lab-soft{fill:#4a5a7d;font-weight:700}',
    '.uc-lab-strong{fill:#b34d00}',
    '.uc-small{font-size:15px;font-weight:700;fill:#4a5a7d}',
    '.uc-small.uc-lab-strong{fill:#b34d00;font-weight:800}',
    '.uc-soft{font-weight:600}',
    '.uc-block{stroke:#b5730f;stroke-width:2}',
    '.uc-block-a{fill:#ffc56e}',
    '.uc-block-b{fill:#ffe7bb}',
    '.uc-blocklab{font-size:16px;font-weight:800;fill:#5a3800}',
    '.uc-slot{fill:#fff;stroke:#c9d3ee;stroke-width:2.5;stroke-dasharray:7 5}',
    '.uc-click{cursor:pointer}',
    '.uc-slot.uc-click:hover{fill:#fff4e0;stroke:#ff9f1c}',
    '.uc-arc{fill:none;stroke:#ff9f1c;stroke-width:2.5}',
    '.uc-arclab{fill:#b34d00}',
    '.uc-shade{fill:#bfeee7;stroke:#0b8f84;stroke-width:3}',
    '.uc-tick-on{stroke:#0b8f84}',
    '.uc-bracket{fill:none;stroke:#b34d00;stroke-width:3;stroke-linejoin:round}',
    '.uc-divider{stroke:#1b2a4a;stroke-width:2.5;stroke-dasharray:6 4}',
    '.uc-partlab{font-size:18px;font-weight:800;fill:#6b7896}',
    '.uc-partlab-on{fill:#064e47}',
    '.uc-pitch-grass{fill:#9fd98f}',
    '.uc-pitch-line{fill:none;stroke:#fff;stroke-width:2}',
    '.uc-fade{fill:rgba(255,255,255,.66)}',
    '.uc-walk{fill:#ff9f1c}',
    '.uc-post{stroke:#6b7280;stroke-width:3}',
    '.uc-sign{fill:#fff;stroke:#c9d3ee;stroke-width:3}',
    '.uc-flag.uc-click:hover .uc-sign{stroke:#ff9f1c;fill:#fff7e8}',
    '.uc-flag-on .uc-sign{fill:#fff3cd;stroke:#e0a100}',
    '.uc-flag:focus{outline:none}',
    '.uc-flag:focus-visible .uc-sign{stroke:#ffb703;stroke-width:5}',
    '.uc-signq{font-size:24px;font-weight:800;fill:#4a5a7d}',
    '.uc-signtop{font-size:17px;font-weight:800;fill:#1b2a4a}',
    '.uc-signbot{font-size:14px;font-weight:800;fill:#b34d00}',
    '.uc-axis{stroke:#4a5a7d;stroke-width:2}',
    '.uc-ribbon-a{fill:#ffb3c6;stroke:#d9708f;stroke-width:2}',
    '.uc-ribbon-b{fill:#a9d8f5;stroke:#5aa6d6;stroke-width:2}',
    '.uc-guide{stroke:#1b2a4a;stroke-width:2;stroke-dasharray:5 4}',
    '.uc-counter{font-size:2.4rem;font-weight:800;color:#b34d00;line-height:1}',
    '.uc-fact{font-size:1.55rem;font-weight:800;background:#fff3cd;border:3px solid var(--gold);border-radius:16px;padding:4px 20px;text-align:center}',
    '.uc-pop{animation:pop .35s ease}',
    '.uc-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.uc-fbtn{min-width:120px;font-size:1.4rem}',
    '.uc-fbtn.uc-now{outline:3px solid var(--accent);outline-offset:2px}',
    '.uc-fbtn.uc-done::after{content:"✓";color:var(--good);margin-left:4px}',
    '.uc-panel{display:flex;flex-direction:column;align-items:center;gap:8px;min-height:130px}',
    '.uc-panel-short{min-height:100px}',
    '.uc-cap{font-size:1.1rem;font-weight:700;color:var(--ink-soft);text-align:center}',
    '.uc-ctx{display:flex;align-items:center;gap:14px;background:#fff;border:3px dashed var(--line);border-radius:16px;padding:8px 20px;font-size:1.25rem;font-weight:800;max-width:720px}',
    '.uc-ctx-icon{font-size:2.3rem;line-height:1}',
    '.prompt.uc-prompt{font-size:2.1rem}',
    '.uc-numq .num-prefix{font-size:2.1rem;margin-right:4px}',
    '.uc-numq .num-unit{font-size:1.7rem}',
    '.uc-blank{display:inline-block;min-width:80px;padding:0 6px;border-bottom:4px solid var(--accent);color:var(--ink-soft)}',
    '.uc-blank.uc-filled{color:var(--good)}',
    '.uc-tip{font-size:1.05rem;font-weight:800;background:var(--info-bg);border:2px solid var(--line);border-radius:12px;padding:6px 14px;white-space:pre-wrap;text-align:center}',
    '.uc-reveal{width:100%;max-width:820px}',
    '.uc-reveal:empty{display:none}',
    '.uc-reveal-box{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;background:#fffdf6;border:2px solid #f3e2b0;border-radius:16px;padding:10px}',
    '@media (max-width:640px){.prompt.uc-prompt,.uc-numq .num-prefix{font-size:1.7rem}.uc-ctx{font-size:1.05rem;padding:8px 12px}.uc-fact{font-size:1.3rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'unit-converter' }, css));
})();

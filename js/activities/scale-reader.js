/* Kitchen Scales — read dial scales in grams and kilograms, compare masses with <, > or =,
 * round a reading to the nearest label and work out what is left of a bag (Unit 13.1).
 * Every needle angle is computed from the same value the answer is checked against.
 * All drawings are original.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  /* ------------------------------------------------------------------ *
   * Dial scales
   * ------------------------------------------------------------------ */
  // max = top of the dial, step = labelled numbers, minor = small ticks (all in the dial's unit)
  var DIALS = {
    g50: { max: 50, step: 10, minor: 5, unit: 'g' },
    g100: { max: 100, step: 10, minor: 5, unit: 'g' },
    g500: { max: 500, step: 100, minor: 50, unit: 'g' },
    g1000: { max: 1000, step: 100, minor: 50, unit: 'g' },
    g1250: { max: 1250, step: 250, minor: 50, unit: 'g' },
    kg5: { max: 5, step: 1, minor: 0.1, unit: 'kg' },
    kg10: { max: 10, step: 1, minor: 0.5, unit: 'kg' },
  };
  var CX = 150;
  var CY = 205;
  var SWEEP = 300; // degrees from 0 to max, gap at the bottom
  var R_TICK = 82; // outer edge of ticks
  var R_LABEL = 95; // labels sit outside the ticks so the needle never hides them
  var R_TIP = 80;
  var R_FACE = 124;

  function n2(v) {
    return Math.round(v * 100) / 100;
  }
  function isMult(v, step) {
    var q = v / step;
    return Math.abs(q - Math.round(q)) < 1e-6;
  }
  function angleOf(spec, v) {
    return -SWEEP / 2 + (SWEEP * v) / spec.max;
  }
  function polar(deg, r) {
    var a = (deg * Math.PI) / 180;
    return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
  }
  /** Label centre: pushed out a little at the sides so wide numbers clear the ticks. */
  function labelPos(spec, lv) {
    var a = angleOf(spec, lv);
    var chars = U.fmt(lv).length;
    var fs = spec.max >= 1000 ? 14 : 18;
    var halfW = chars * fs * 0.29;
    return polar(a, R_LABEL + Math.abs(Math.sin((a * Math.PI) / 180)) * Math.max(0, halfW - 6));
  }
  function labelsOf(spec) {
    var out = [];
    for (var i = 0; i * spec.step <= spec.max + 1e-9; i++) out.push(n2(i * spec.step));
    return out;
  }
  function fmtV(v, unit) {
    return U.fmt(n2(v)) + ' ' + unit;
  }

  /** A small object drawn so its bottom centre sits at (0, 0). */
  function drawItem(item) {
    var g = S('g', { class: 'sr-item' });
    if (item.sack) {
      g.appendChild(S('path', { d: 'M-30,0 Q-38,-32 -24,-56 L-15,-62 Q0,-68 15,-62 L24,-56 Q38,-32 30,0 Z', fill: item.color || '#f3e6c8', stroke: '#b89b6a', 'stroke-width': 2.5 }));
      g.appendChild(S('path', { d: 'M-15,-62 Q0,-55 15,-62', stroke: '#9c7f4d', fill: 'none', 'stroke-width': 3 }));
      g.appendChild(S('text', { x: 0, y: -22, 'text-anchor': 'middle', class: 'sr-sack-txt' }, item.sack));
    } else {
      g.appendChild(S('text', { x: 0, y: -6, 'text-anchor': 'middle', class: 'sr-emoji' }, item.e));
    }
    return g;
  }

  /**
   * A kitchen scale with a round dial. opts: { item, value, mini, hits(onHit) }
   * Returns { svg, spec, setValue(v), setItem(item), mark(v, cls), tickMark(v, cls), over, hitEls }
   */
  function dial(kind, opts) {
    opts = opts || {};
    var spec = DIALS[kind];
    var vb = opts.mini ? '24 79 252 252' : '0 0 300 340';
    var root = S('svg', { viewBox: vb, class: 'sr-dial' + (opts.mini ? ' sr-dial-mini' : ''), 'data-kind': kind });
    if (!opts.mini) {
      root.appendChild(S('rect', { x: 138, y: 66, width: 24, height: 16, fill: '#b8c4e3' }));
      root.appendChild(S('ellipse', { cx: CX, cy: 66, rx: 108, ry: 12, class: 'sr-pan' }));
      root.appendChild(S('rect', { x: 12, y: 74, width: 276, height: 262, rx: 40, class: 'sr-body' }));
    }
    root.appendChild(S('circle', { cx: CX, cy: CY, r: R_FACE, class: 'sr-face' }));
    var under = S('g');
    root.appendChild(under);
    var tickCount = Math.round(spec.max / spec.minor);
    for (var i = 0; i <= tickCount; i++) {
      var v = i * spec.minor;
      var major = isMult(v, spec.step);
      var half = !major && isMult(v, spec.step / 2);
      var inner = major ? 66 : half ? 71 : 75;
      var a = angleOf(spec, v);
      var p1 = polar(a, R_TICK);
      var p2 = polar(a, inner);
      root.appendChild(S('line', { x1: n2(p1.x), y1: n2(p1.y), x2: n2(p2.x), y2: n2(p2.y), class: major ? 'sr-tick sr-tick-major' : half ? 'sr-tick sr-tick-half' : 'sr-tick' }));
    }
    var over = S('g', { class: 'sr-over' });
    root.appendChild(over);
    var labelEls = {};
    var four = spec.max >= 1000;
    labelsOf(spec).forEach(function (lv) {
      var p = labelPos(spec, lv);
      var t = S('text', { x: n2(p.x), y: n2(p.y + 6), 'text-anchor': 'middle', class: 'sr-label' + (four ? ' sr-label-sm' : '') }, U.fmt(lv));
      labelEls[lv] = t;
      root.appendChild(t);
    });
    root.appendChild(S('text', { x: CX, y: CY + 98, 'text-anchor': 'middle', class: 'sr-dial-unit' }, spec.unit));
    var needle = S('g', { class: 'sr-needle' });
    needle.appendChild(S('polygon', { points: [CX - 4, CY + 20, CX + 4, CY + 20, CX + 1.2, CY - R_TIP, CX - 1.2, CY - R_TIP].join(' '), class: 'sr-needle-arm' }));
    needle.appendChild(S('circle', { cx: CX, cy: CY, r: 9, class: 'sr-hub' }));
    needle.style.transformOrigin = CX + 'px ' + CY + 'px';
    needle.style.transformBox = 'view-box';
    root.appendChild(needle);
    var itemLayer = S('g', { transform: 'translate(' + CX + ',62)' });
    root.appendChild(itemLayer);
    var hitEls = {};
    if (opts.hits) {
      labelsOf(spec).forEach(function (lv) {
        var p = labelPos(spec, lv);
        var c = S('circle', { cx: n2(p.x), cy: n2(p.y), r: 19, class: 'sr-hit', 'data-v': String(lv) });
        c.addEventListener('click', function () {
          opts.hits(lv, c);
        });
        hitEls[lv] = c;
        root.appendChild(c);
      });
    }
    var d = {
      svg: root,
      spec: spec,
      kind: kind,
      over: over,
      hitEls: hitEls,
      labelEls: labelEls,
      value: 0,
      setValue: function (v, instant) {
        d.value = v;
        root.setAttribute('data-value', String(n2(v)));
        if (instant) needle.style.transition = 'none';
        needle.style.transform = 'rotate(' + n2(angleOf(spec, v)) + 'deg)';
        if (instant) {
          // force the jump, then restore the swing for later moves
          needle.getBoundingClientRect();
          needle.style.transition = '';
        }
      },
      setItem: function (item) {
        MQ.clear(itemLayer);
        if (item) itemLayer.appendChild(drawItem(item));
      },
      /** Ring around a label. */
      mark: function (lv, cls) {
        var p = labelPos(spec, lv);
        var c = S('circle', { cx: n2(p.x), cy: n2(p.y), r: 17, class: 'sr-ring ' + (cls || '') });
        over.appendChild(c);
        return c;
      },
      /** Thick coloured tick at value v. */
      tickMark: function (v, cls) {
        var a = angleOf(spec, v);
        var p1 = polar(a, R_TICK + 3);
        var p2 = polar(a, 60);
        var l = S('line', { x1: n2(p1.x), y1: n2(p1.y), x2: n2(p2.x), y2: n2(p2.y), class: 'sr-tickmark ' + (cls || '') });
        over.appendChild(l);
        return l;
      },
      /** Coloured band from v1 to v2 along the tick ring. */
      band: function (v1, v2, cls) {
        var a1 = angleOf(spec, v1);
        var a2 = angleOf(spec, v2);
        var r = 74;
        var p1 = polar(a1, r);
        var p2 = polar(a2, r);
        var large = a2 - a1 > 180 ? 1 : 0;
        var path = S('path', { d: 'M' + n2(p1.x) + ',' + n2(p1.y) + ' A' + r + ',' + r + ' 0 ' + large + ',1 ' + n2(p2.x) + ',' + n2(p2.y), class: 'sr-band ' + (cls || '') });
        over.appendChild(path);
        return path;
      },
    };
    d.setValue(opts.value || 0, true);
    if (opts.item) d.setItem(opts.item);
    return d;
  }

  /* ------------------------------------------------------------------ *
   * Small UI helpers
   * ------------------------------------------------------------------ */

  /** <, = , > tiles that can be dragged into the slot or clicked. */
  function symbolSlot(onPick) {
    var slot = el('div', { class: 'sr-slot', 'aria-label': 'Sign box' }, '?');
    var tiles = el('div', { class: 'sr-tiles' });
    var off = false;
    ['<', '=', '>'].forEach(function (sym) {
      var t = el('button', { class: 'sr-tile', type: 'button', 'data-sym': sym, 'aria-label': sym === '<' ? 'less than' : sym === '>' ? 'more than' : 'equals' }, sym);
      var start = null;
      var dragging = false;
      t.addEventListener('pointerdown', function (e) {
        if (off) return;
        e.preventDefault();
        start = { x: e.clientX, y: e.clientY };
        dragging = false;
        try {
          t.setPointerCapture(e.pointerId);
        } catch (err) {}
      });
      t.addEventListener('pointermove', function (e) {
        if (!start) return;
        var dx = e.clientX - start.x;
        var dy = e.clientY - start.y;
        if (!dragging && Math.abs(dx) + Math.abs(dy) > 6) {
          dragging = true;
          t.classList.add('sr-dragging');
        }
        if (dragging) t.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      });
      function finish(e, cancelled) {
        if (!start) return;
        var wasDrag = dragging;
        start = null;
        dragging = false;
        t.classList.remove('sr-dragging');
        t.style.transform = '';
        if (cancelled || off) return;
        if (!wasDrag) {
          onPick(sym);
          return;
        }
        var r = slot.getBoundingClientRect();
        var pad = 20;
        if (e.clientX >= r.left - pad && e.clientX <= r.right + pad && e.clientY >= r.top - pad && e.clientY <= r.bottom + pad) onPick(sym);
      }
      t.addEventListener('pointerup', function (e) {
        finish(e, false);
      });
      t.addEventListener('pointercancel', function (e) {
        finish(e, true);
      });
      // keyboard: Enter / Space on the button
      t.addEventListener('click', function (e) {
        if (e.detail === 0 && !off) onPick(sym);
      });
      tiles.appendChild(t);
    });
    return {
      slot: slot,
      tiles: tiles,
      set: function (sym, cls) {
        slot.textContent = sym;
        slot.classList.remove('good', 'bad');
        if (cls) slot.classList.add(cls);
      },
      disable: function () {
        off = true;
        tiles.classList.add('sr-off');
      },
    };
  }

  /**
   * Answer box. opts: { unit (fixed label) | pickUnit: true, onSubmit(num, unit) }.
   * Typing "300 g" or "2kg" is fine: the unit letters are taken off (and chosen, if there are unit buttons).
   */
  function answerBox(opts) {
    var chosen = null;
    var unitBtns = {};
    var ni = MQ.ui.numberInput({
      unit: opts.unit,
      onSubmit: function (num) {
        opts.onSubmit(num, opts.unit || chosen);
      },
    });
    function choose(u) {
      chosen = u;
      Object.keys(unitBtns).forEach(function (k) {
        unitBtns[k].classList.toggle('on', k === u);
      });
    }
    if (opts.pickUnit) {
      var grp = el('div', { class: 'sr-units', role: 'group', 'aria-label': 'Unit' });
      ['g', 'kg'].forEach(function (u) {
        var b = el('button', { class: 'sr-unit', type: 'button', 'data-unit': u, onclick: function () {
          if (b.disabled) return;
          MQ.sound('click');
          choose(u);
        } }, u);
        unitBtns[u] = b;
        grp.appendChild(b);
      });
      ni.el.insertBefore(grp, ni.el.lastChild);
    }
    ni.input.addEventListener('input', function () {
      var m = ni.input.value.match(/^\s*(\d+(?:\.\d+)?)\s*(kg|g)\s*$/i);
      if (!m) return;
      var u = m[2].toLowerCase();
      if (opts.unit && opts.unit !== u) return;
      ni.input.value = m[1];
      if (opts.pickUnit) choose(u);
    });
    return {
      el: ni.el,
      ni: ni,
      unit: function () {
        return opts.unit || chosen;
      },
      choose: choose,
      done: function (value, unit) {
        if (value != null) ni.setValue(String(value));
        if (unit) choose(unit);
        ni.good();
        ni.disable();
        Object.keys(unitBtns).forEach(function (k) {
          unitBtns[k].disabled = true;
        });
      },
      focus: ni.focus,
    };
  }

  function chips(parts) {
    var row = el('div', { class: 'sum-row sr-work' });
    parts.forEach(function (p) {
      if (p === '+' || p === '−' || p === '=' || p === '<' || p === '>' || p === '→' || p === ',') row.appendChild(el('span', { class: 'sum-op' }, p));
      else if (typeof p === 'object') row.appendChild(el('span', { class: 'chip ' + (p.cls || '') }, p.t));
      else row.appendChild(el('span', { class: 'chip' }, p));
    });
    return row;
  }

  function cmp(a, b) {
    return a < b ? '<' : a > b ? '>' : '=';
  }
  function toG(v, unit) {
    return unit === 'kg' ? Math.round(v * 1000) : v;
  }

  /* ------------------------------------------------------------------ *
   * Things to weigh (masses are realistic for the dial they go on)
   * ------------------------------------------------------------------ */
  var READ_ITEMS = {
    g50: { 10: { e: '🍪', n: 'biscuit' }, 20: { e: '🍓', n: 'strawberry' }, 30: { e: '🥜', n: 'handful of nuts' }, 40: { e: '🍞', n: 'slice of bread' }, 50: { e: '🥚', n: 'egg' } },
    g500: { 100: { e: '🍋', n: 'lemon' }, 200: { e: '🍊', n: 'orange' }, 300: { e: '🥭', n: 'mango' }, 400: { e: '🥫', n: 'tin of beans' }, 500: { e: '🧁', n: 'box of cupcakes' } },
    kg5: { 1: { sack: 'RICE', n: 'bag of rice' }, 2: { sack: 'FLOUR', n: 'bag of flour', color: '#f7f2e8' }, 3: { e: '🍈', n: 'melon' }, 4: { e: '🥔', n: 'bag of potatoes' }, 5: { e: '🍉', n: 'watermelon' } },
    g1250: { 250: { e: '🧈', n: 'block of butter' }, 500: { e: '🧀', n: 'piece of cheese' }, 750: { e: '🍍', n: 'pineapple' }, 1000: { sack: 'SUGAR', n: 'bag of sugar', color: '#ffffff' }, 1250: { e: '🥬', n: 'cabbage' } },
  };
  var KG10_ITEMS = [
    { e: '🎃', n: 'pumpkin' },
    { e: '🥔', n: 'sack of potatoes' },
    { e: '🍎', n: 'box of apples' },
    { e: '🍉', n: 'pile of watermelons' },
  ];
  var ROUND_ITEMS = {
    g1000: [{ e: '🍌', n: 'bunch of bananas' }, { e: '🍎', n: 'bag of apples' }, { e: '🥕', n: 'bag of carrots' }, { e: '🧅', n: 'bag of onions' }, { e: '🥦', n: 'broccoli' }],
    g100: [{ e: '🍅', n: 'tomato' }, { e: '🥝', n: 'kiwi fruit' }, { e: '🍒', n: 'handful of cherries' }, { e: '🍑', n: 'peach' }],
    kg5: [{ e: '🥔', n: 'bag of potatoes' }, { e: '🎃', n: 'pumpkin' }, { e: '🍈', n: 'melon' }, { e: '🍊', n: 'bag of oranges' }],
  };
  var ROUND_TO = { g1000: 100, g100: 10, kg5: 1 };

  // Pairs to compare. a/b: [value, unit, dial, item]. The g dial value always sits on a label.
  var PAIRS = [
    { a: [1000, 'g', 'g1250', { sack: 'FLOUR', n: 'flour', color: '#f7f2e8' }], b: [1, 'kg', 'kg5', { sack: 'RICE', n: 'rice' }] },
    { a: [800, 'g', 'g1000', { e: '🍐', n: 'pears' }], b: [1, 'kg', 'kg5', { e: '🍎', n: 'apples' }] },
    { a: [1250, 'g', 'g1250', { e: '🥬', n: 'cabbage' }], b: [1, 'kg', 'kg5', { e: '🍈', n: 'melon' }] },
    { a: [500, 'g', 'g500', { e: '🧁', n: 'cupcakes' }], b: [5, 'kg', 'kg5', { e: '🍉', n: 'watermelon' }] },
    { a: [10, 'g', 'g50', { e: '🍬', n: 'sweets' }], b: [1, 'kg', 'kg5', { sack: 'SUGAR', n: 'sugar', color: '#ffffff' }] },
    { a: [2, 'kg', 'kg5', { sack: 'FLOUR', n: 'flour', color: '#f7f2e8' }], b: [750, 'g', 'g1250', { e: '🍍', n: 'pineapple' }] },
    { a: [1, 'kg', 'kg5', { e: '🥔', n: 'potatoes' }], b: [1000, 'g', 'g1000', { e: '🥕', n: 'carrots' }] },
    { a: [3, 'kg', 'kg5', { e: '🎃', n: 'pumpkin' }], b: [900, 'g', 'g1000', { e: '🍌', n: 'bananas' }] },
    { a: [400, 'g', 'g500', { e: '🥫', n: 'tin of soup' }], b: [4, 'kg', 'kg5', { e: '🍉', n: 'watermelon' }] },
  ];

  // "The needle went further round, so it is heavier" — the gram needle always goes further, but the kg side is heavier.
  var ARGUMENTS = [
    { g: [700, 'g1000', { e: '🥔', n: 'potatoes' }], kg: [2, 'kg10', { sack: 'FLOUR', n: 'flour', color: '#f7f2e8' }] },
    { g: [900, 'g1000', { e: '🍎', n: 'apples' }], kg: [3, 'kg10', { e: '🎃', n: 'pumpkin' }] },
    { g: [400, 'g500', { e: '🧀', n: 'cheese' }], kg: [1, 'kg5', { sack: 'RICE', n: 'rice' }] },
    { g: [800, 'g1000', { e: '🥕', n: 'carrots' }], kg: [2, 'kg10', { e: '🍈', n: 'melons' }] },
  ];

  /* ------------------------------------------------------------------ *
   * Deck: 10 questions. Level 1 = 0–3, level 2 = 4–6, level 3 = 7–9 (core levels).
   * ------------------------------------------------------------------ */
  function roundValue(kind) {
    // Returns the needle value in the dial's unit. Never halfway; always clearly nearer one label.
    if (kind === 'g1000') return U.rand(0, 9) * 100 + U.pick([20, 30, 70, 80]);
    if (kind === 'g100') return U.rand(0, 9) * 10 + U.pick([2, 3, 7, 8]);
    return n2(U.rand(0, 4) + U.pick([2, 3, 7, 8]) / 10);
  }
  function roundAnswer(kind, v) {
    var to = ROUND_TO[kind];
    return n2(Math.round(v / to) * to);
  }

  function readQ(kind, used) {
    var vals = labelsOf(DIALS[kind]).filter(function (v) {
      return v > 0 && !used[kind + ':' + v];
    });
    var v = U.pick(vals);
    used[kind + ':' + v] = true;
    var item = kind === 'kg10' ? U.pick(KG10_ITEMS) : READ_ITEMS[kind][v];
    return { type: 'read', kind: kind, value: v, unit: DIALS[kind].unit, item: item, answer: v };
  }

  function roundQ(kind, used) {
    var v;
    var guard = 0;
    do {
      v = roundValue(kind);
      guard++;
    } while ((roundAnswer(kind, v) === 0 || used['r' + kind + ':' + v]) && guard < 100);
    used['r' + kind + ':' + v] = true;
    return { type: 'round', kind: kind, value: v, unit: DIALS[kind].unit, to: ROUND_TO[kind], item: U.pick(ROUND_ITEMS[kind]), answer: roundAnswer(kind, v) };
  }

  function subQ(kgTotal) {
    var max = kgTotal === 1 ? 900 : 950;
    var x = U.rand(2, max / 50) * 50;
    var story = kgTotal === 1 ? U.pick([{ e: 'rice', s: 'RICE', verb: 'We cook' }, { e: 'flour', s: 'FLOUR', verb: 'We bake with' }, { e: 'sugar', s: 'SUGAR', verb: 'We use' }]) : U.pick([{ e: 'potatoes', s: null, emoji: '🥔', verb: 'We cook' }, { e: 'flour', s: 'FLOUR', verb: 'We bake with' }]);
    return { type: 'sub', kg: kgTotal, used: x, story: story, unit: 'g', answer: kgTotal * 1000 - x };
  }

  function round7Q() {
    var good = U.shuffle([6.7, 6.8, 6.9, 7, 7.1, 7.2, 7.3]);
    var bad = U.shuffle([5.8, 6.1, 6.2, 6.3, 7.7, 7.8, 7.9, 8.2]);
    var nGood = U.rand(1, 3);
    var vals = U.shuffle(good.slice(0, nGood).concat(bad.slice(0, 4 - nGood)));
    return { type: 'round7', values: vals, answer: vals.map(function (v) { return Math.round(v) === 7; }) };
  }

  function buildDeck() {
    var used = {};
    var q = [];
    var kinds = U.shuffle(['g50', 'g500', 'kg5']);
    kinds.push(U.pick(['g50', 'g500', 'kg5']));
    kinds.forEach(function (k) {
      q.push(readQ(k, used));
    });
    q.push(readQ(U.pick(['g1250', 'kg10']), used));
    var p = U.pick(PAIRS);
    q.push({ type: 'compare', pair: p, answer: cmp(toG(p.a[0], p.a[1]), toG(p.b[0], p.b[1])) });
    var arg = U.pick(ARGUMENTS);
    q.push({ type: 'argue', arg: arg, gFirst: Math.random() < 0.5, answer: 'kg' });
    var rk = U.shuffle(['g1000', 'g100', 'kg5']);
    q.push(roundQ(rk[0], used));
    q.push(subQ(1));
    var last = U.pick(['round7', 'subBig', 'round']);
    if (last === 'round7') q.push(round7Q());
    else if (last === 'subBig') q.push(subQ(U.pick([2, 3])));
    else q.push(roundQ(rk[1], used));
    return q;
  }

  /* ------------------------------------------------------------------ *
   * Rice bar: rows of ten 100 g blocks (one row per kilogram)
   * ------------------------------------------------------------------ */
  var BW = 54; // block width
  var BH = 40;
  var BX = 92; // left of the first block
  function kgBar(nKg) {
    var W = BX + 10 * (BW + 2) + 12;
    var H = nKg * (BH + 12) + 8;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'sr-bar', width: W, height: H });
    var blocks = [];
    for (var r = 0; r < nKg; r++) {
      var y = 6 + r * (BH + 12);
      root.appendChild(S('text', { x: BX - 10, y: y + BH / 2 + 7, 'text-anchor': 'end', class: 'sr-bar-lbl' }, '1 kg'));
      for (var c = 0; c < 10; c++) {
        var x = BX + c * (BW + 2);
        var rect = S('rect', { x: x, y: y, width: BW, height: BH, rx: 5, class: 'sr-block' });
        root.appendChild(rect);
        root.appendChild(S('text', { x: x + BW / 2, y: y + BH / 2 + 5, 'text-anchor': 'middle', class: 'sr-block-txt' }, '100'));
        blocks.push({ x: x, y: y, rect: rect });
      }
    }
    var over = S('g');
    root.appendChild(over);
    return {
      svg: root,
      /** Shade `used` grams from the end of the last row (red), the rest green. */
      shade: function (used) {
        var full = Math.floor(used / 100);
        var half = used % 100 === 50;
        blocks.forEach(function (b, i) {
          var fromEnd = blocks.length - 1 - i;
          b.rect.setAttribute('class', 'sr-block ' + (fromEnd < full ? 'sr-block-used' : 'sr-block-left'));
          if (half && fromEnd === full) over.appendChild(S('rect', { x: b.x + BW / 2, y: b.y, width: BW / 2, height: BH, rx: 4, class: 'sr-block-used sr-half' }));
        });
      },
    };
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */
  function learn1(stage, api) {
    api.say('A kilogram is heavy. A gram is tiny. 1 kilogram is the same as 1000 grams.');
    stage.appendChild(MQ.ui.lesson('1 kg = 1000 g', 'One bag of rice on two different scales.'));
    var rice = { sack: 'RICE', n: 'rice' };
    var dA = dial('kg5', { item: rice, value: 1 });
    var dB = dial('g1250', { value: 0 });
    var capB = el('div', { class: 'sr-cap' }, '? g');
    stage.appendChild(
      el(
        'div',
        { class: 'sr-pair' },
        el('div', { class: 'sr-side' }, dA.svg, el('div', { class: 'sr-cap' }, '1 kg')),
        el('div', { class: 'sr-side' }, dB.svg, capB)
      )
    );
    var bags = el('div', { class: 'sr-bags' });
    var count = el('div', { class: 'sr-count' });
    api.lockNext();
    var btn = el('button', { class: 'btn', type: 'button', 'data-act': 'grams' }, 'Show it in grams ▶');
    btn.addEventListener('click', function () {
      btn.disabled = true;
      dA.setItem(null);
      var shown = [];
      for (var i = 0; i < 10; i++) {
        (function (k) {
          api.later(function () {
            api.sound('pop');
            bags.appendChild(el('span', { class: 'sr-bag' }, '100 g'));
            shown.push(String((k + 1) * 100));
            count.textContent = 'Count in 100s: ' + shown.join(', ');
            if (k === 9) {
              dB.setItem(rice);
              dB.setValue(1000);
              capB.textContent = '1000 g';
              capB.classList.add('sr-cap-good');
              api.say('Ten bags of 100 grams make 1000 grams. Same rice, two ways to say it!', 'cheer');
              api.feedback('1 kg = 1000 g', 'good');
              api.unlockNext();
            }
          }, 250 * (k + 1));
        })(i);
      }
    });
    stage.appendChild(btn);
    stage.appendChild(bags);
    stage.appendChild(count);
  }

  function learn2(stage, api) {
    api.say('Drag the fruit onto the scale. Then click the number the needle points to.');
    api.lockNext();
    var step = 0;
    var rounds = [
      { kind: 'g500', value: U.pick([200, 300, 400]), item: { e: '🍎', n: 'apples' }, msg: 'This dial counts in 100s.' },
      { kind: 'g50', value: U.pick([20, 30, 40]), item: { e: '🍓', n: 'strawberries' }, msg: 'This dial counts in 10s!' },
    ];
    var title = el('div', { class: 'prompt' });
    var holder = el('div', { class: 'sr-scene-wrap' });
    stage.appendChild(title);
    stage.appendChild(holder);

    function show() {
      MQ.clear(holder);
      var r = rounds[step];
      title.innerHTML = step === 0 ? 'Put the apples on the scale.' : 'A new dial! <b>Look at the labels first.</b>';
      if (step === 1) api.say('A new dial. Look at the labels first! What does it count in?', 'think');
      var scene = S('svg', { viewBox: '0 0 520 340', class: 'sr-scene' });
      var d = dial(r.kind, {
        hits: function (lv) {
          if (!placed || done) return;
          if (Math.abs(lv - r.value) < 1e-9) {
            done = true;
            d.mark(lv, 'sr-ring-good');
            api.sound('correct');
            api.feedback('Yes! ' + r.msg + ' The needle points to ' + r.value + ' g.', 'good');
            if (step === 0) {
              step = 1;
              api.later(show, 1600);
            } else {
              api.say('Great reading! Always check what the dial counts in.', 'cheer');
              api.unlockNext();
            }
          } else {
            d.mark(lv, 'sr-ring-bad');
            api.sound('wrong');
            api.feedback('Not that one. Follow the red needle to its tip. ' + r.msg, 'try');
          }
        },
      });
      d.svg.setAttribute('x', 220);
      d.svg.setAttribute('y', 0);
      d.svg.setAttribute('width', 300);
      d.svg.setAttribute('height', 340);
      scene.appendChild(d.svg);
      scene.appendChild(S('text', { x: 100, y: 230, 'text-anchor': 'middle', class: 'sr-scene-hint' }, 'drag me'));
      var home = { x: 100, y: 190 };
      var fruit = S('g', { class: 'sr-drag', transform: 'translate(' + home.x + ',' + home.y + ')' });
      fruit.appendChild(S('circle', { cx: 0, cy: -32, r: 42, class: 'sr-grab' }));
      fruit.appendChild(drawItem(r.item));
      scene.appendChild(fruit);
      var placed = false;
      var done = false;
      var pan = { x: 370, y: 62 };
      function drop() {
        placed = true;
        fruit.setAttribute('transform', 'translate(' + pan.x + ',' + pan.y + ')');
        fruit.classList.remove('sr-drag');
        api.sound('pop');
        d.setValue(r.value);
        api.feedback('Now click the number the needle points to.', 'info');
      }
      var unbind = MQ.ui.drag(scene, fruit, {
        move: function (p, dx, dy) {
          if (placed) return;
          fruit.setAttribute('transform', 'translate(' + (home.x + dx) + ',' + (home.y + dy) + ')');
        },
        end: function (p, e) {
          if (placed) return;
          var moved = Math.abs(p.x - home.x) + Math.abs(p.y - home.y);
          if (Math.hypot(p.x - pan.x, p.y - pan.y) < 95 || moved < 40) drop();
          else fruit.setAttribute('transform', 'translate(' + home.x + ',' + home.y + ')');
        },
      });
      api.cleanup(unbind);
      holder.appendChild(scene);
    }
    show();
  }

  function learn3(stage, api) {
    api.say('Which is heavier: 500 grams of cupcakes or 5 kilograms of watermelon?', 'think');
    api.lockNext();
    var dA = dial('g500', { item: { e: '🧁' }, value: 500 });
    var dB = dial('kg5', { item: { e: '🍉' }, value: 5 });
    var capB = el('div', { class: 'sr-cap' }, '5 kg');
    stage.appendChild(
      el(
        'div',
        { class: 'sr-pair' },
        el('div', { class: 'sr-side' }, dA.svg, el('div', { class: 'sr-cap' }, '500 g')),
        el('div', { class: 'sr-side' }, dB.svg, capB)
      )
    );
    var area = el('div', { class: 'sr-col' });
    stage.appendChild(area);
    var ch = MQ.ui.choices(
      [
        { label: '🧁 500 g of cupcakes', value: 'g' },
        { label: '🍉 5 kg of watermelon', value: 'kg' },
      ],
      function (v) {
        ch.disable();
        ch.mark('kg', 'good');
        if (v === 'kg') {
          api.sound('correct');
          api.say('Yes! Let us see why. Change 5 kg into grams.', 'cheer');
        } else {
          ch.mark('g', 'bad');
          api.sound('wrong');
          api.say('500 is a bigger number than 5, but grams are tiny! Change 5 kg into grams.', 'oops');
        }
        capB.textContent = '5 kg = 5000 g';
        capB.classList.add('sr-cap-good');
        api.later(stepTwo, 900);
      },
      { columns: 2 }
    );
    area.appendChild(ch);

    function stepTwo() {
      api.feedback('500 g is less than 5000 g. Drag the right sign into the box.', 'info');
      var ss = symbolSlot(function (sym) {
        if (sym === '<') {
          ss.set('<', 'good');
          ss.disable();
          api.sound('correct');
          api.say('500 g < 5 kg. Same units first, then compare!', 'cheer');
          api.feedback('Make the units the same before you compare.', 'good');
          api.unlockNext();
        } else {
          ss.set(sym, 'bad');
          api.sound('wrong');
          api.feedback('500 g and 5000 g: which is smaller? The small end of the sign points to the smaller mass.', 'try');
        }
      });
      area.appendChild(el('div', { class: 'sr-sentence' }, el('span', { class: 'sr-amt' }, '500 g'), ss.slot, el('span', { class: 'sr-amt' }, '5 kg')));
      area.appendChild(ss.tiles);
    }
  }

  function learn4(stage, api) {
    api.say('We have 1 kg of rice. We cook 350 grams. Drag 350 g of blocks into the pan.');
    api.lockNext();
    stage.appendChild(MQ.ui.prompt('1 kg of rice = <b>1000 g</b>. Cook <b>350 g</b>.'));
    var W = 680;
    var H = 270;
    var scene = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'sr-rice' });
    // pot
    scene.appendChild(S('rect', { x: 230, y: 170, width: 220, height: 84, rx: 18, class: 'sr-pot' }));
    scene.appendChild(S('rect', { x: 210, y: 162, width: 260, height: 14, rx: 7, class: 'sr-pot-rim' }));
    var potTxt = S('text', { x: 340, y: 222, 'text-anchor': 'middle', class: 'sr-pot-txt' }, 'Cooked: 0 g');
    scene.appendChild(potTxt);
    scene.appendChild(S('text', { x: 20, y: 28, class: 'sr-bar-lbl' }, '1 kg bag'));
    var sizes = [100, 100, 100, 100, 100, 100, 100, 100, 100, 50, 50];
    var blocks = [];
    var x = 20;
    var taken = 0;
    var TARGET = 350;
    sizes.forEach(function (sz, i) {
      var w = sz === 100 ? 54 : 26;
      var g = S('g', { class: 'sr-rblock', 'data-g': String(sz), 'data-i': String(i) });
      g.appendChild(S('rect', { x: 0, y: 0, width: w, height: 48, rx: 5, class: 'sr-block' }));
      g.appendChild(S('text', { x: w / 2, y: 29, 'text-anchor': 'middle', class: 'sr-block-txt' + (sz === 50 ? ' sr-block-txt-sm' : '') }, String(sz)));
      var b = { g: g, size: sz, home: { x: x, y: 40 }, taken: false };
      g.setAttribute('transform', 'translate(' + x + ',40)');
      x += w + 4;
      blocks.push(b);
      scene.appendChild(g);
    });
    var potSlots = 0;
    function canReach(need, list) {
      // can some of these block sizes make exactly `need`?
      var ok = { 0: true };
      list.forEach(function (s) {
        Object.keys(ok).map(Number).forEach(function (k) {
          ok[k + s] = true;
        });
      });
      return !!ok[need];
    }
    function take(b) {
      if (b.taken || taken >= TARGET) return false;
      var rest = blocks.filter(function (o) {
        return !o.taken && o !== b;
      }).map(function (o) {
        return o.size;
      });
      var need = TARGET - taken - b.size;
      if (need < 0 || !canReach(need, rest)) {
        api.sound('wrong');
        api.feedback(need < 0 ? 'Too much! We only need ' + (TARGET - taken) + ' g more.' : 'Then we could not make exactly 350 g. Try another block.', 'try');
        return false;
      }
      b.taken = true;
      taken += b.size;
      var px = 244 + potSlots * 34;
      potSlots++;
      b.g.setAttribute('transform', 'translate(' + px + ',134) scale(0.55)');
      b.g.classList.add('sr-in-pot');
      api.sound('pop');
      potTxt.textContent = 'Cooked: ' + taken + ' g';
      if (taken === TARGET) finish();
      else api.feedback('Cooked ' + taken + ' g so far. We need 350 g.', 'info');
      return true;
    }
    function finish() {
      blocks.forEach(function (o) {
        if (!o.taken) o.g.classList.add('sr-left');
      });
      api.say('1000 g take away 350 g leaves 650 g. Change kg to g first, then subtract!', 'cheer');
      api.feedback('1 kg − 350 g = 1000 g − 350 g = 650 g left', 'good');
      rule.hidden = false;
      api.unlockNext();
    }
    blocks.forEach(function (b) {
      var unbind = MQ.ui.drag(scene, b.g, {
        move: function (p, dx, dy) {
          if (b.taken) return;
          b.g.setAttribute('transform', 'translate(' + (b.home.x + dx) + ',' + (b.home.y + dy) + ')');
        },
        end: function (p, e) {
          if (b.taken) return;
          var moved = Math.abs(p.x - b.startP.x) + Math.abs(p.y - b.startP.y);
          if (p.y > 120 || moved < 6) {
            if (take(b)) return;
          }
          b.g.setAttribute('transform', 'translate(' + b.home.x + ',' + b.home.y + ')');
        },
        start: function (p) {
          b.startP = p;
        },
      });
      api.cleanup(unbind);
    });
    stage.appendChild(scene);
    var rule = el('div', { class: 'sr-rule', hidden: true }, el('b', null, 'Rule: '), 'change kg into g first. 1 kg = 1000 g. Then take away.');
    stage.appendChild(rule);
  }

  /* ------------------------------------------------------------------ *
   * Practice renderers
   * ------------------------------------------------------------------ */
  function countUp(api, d, upTo, unit, holder) {
    var labels = labelsOf(d.spec).filter(function (v) {
      return v <= upTo + 1e-9;
    });
    var shown = [];
    labels.forEach(function (lv, i) {
      api.later(function () {
        d.mark(lv, i === labels.length - 1 ? 'sr-ring-good' : 'sr-ring-soft');
        shown.push(U.fmt(lv));
        MQ.clear(holder);
        holder.appendChild(el('div', { class: 'sr-count' }, 'Count the labels: ' + shown.join(', ') + (i === labels.length - 1 ? ' → ' + U.fmt(upTo) + ' ' + unit : '')));
      }, 120 + i * 320);
    });
  }

  function renderRead(stage, api, q) {
    var spec = DIALS[q.kind];
    var stepWord = spec.step === 1 ? '1s' : spec.step + 's';
    api.say(api.level === 1 ? 'What does the scale show? Type the number, then pick g or kg.' : 'Look at the labels first. What does this dial count in?', 'think');
    stage.appendChild(MQ.ui.prompt('How heavy is the ' + q.item.n + '?'));
    var d = dial(q.kind, { item: q.item, value: 0 });
    stage.appendChild(d.svg);
    api.later(function () {
      d.setValue(q.value);
    }, 60);
    var work = el('div', { class: 'sr-workbox' });
    var box = answerBox({
      pickUnit: true,
      onSubmit: function (num, unit) {
        if (!unit) {
          api.feedback('Good! Now click g or kg next to the box.', 'info');
          return;
        }
        var okNum = U.same(num, q.value);
        if (okNum && unit === q.unit) {
          box.done();
          api.check(true, 'Yes! ' + fmtV(q.value, q.unit) + '.');
          return;
        }
        box.ni.bad();
        var second = api.tries() >= 1;
        if (okNum) {
          api.check(false, 'The number is right! Now look at the bottom of the dial: does it say g or kg?', 'Wrote the wrong unit (g or kg)');
          return;
        }
        var idx = q.value / spec.step;
        var ignored = spec.step !== 1 && (U.same(num, idx) || (spec.step !== 100 && U.same(num, idx * 100)));
        if (ignored) {
          api.check(false, second ? 'Count the labels in ' + stepWord + ': ' + labelsOf(spec).slice(0, 3).join(', ') + ' … Stop where the needle points.' : 'Look at the numbers on the dial. This dial counts in ' + stepWord + ', not in 1s.', 'Ignored the dial labels');
          return;
        }
        api.check(false, second ? 'Put your finger on the middle of the red needle and slide it to the tip. Which number is right next to the tip?' : 'Follow the red needle from the middle all the way to its tip. Which label does it point to?', 'Read the wrong label');
      },
    });
    stage.appendChild(box.el);
    stage.appendChild(work);
    box.focus();
    api.onReveal(function () {
      box.done(q.value, q.unit);
      countUp(api, d, q.value, q.unit, work);
    });
  }

  function renderRound(stage, api, q) {
    var spec = DIALS[q.kind];
    var lo = n2(Math.floor(q.value / q.to + 1e-9) * q.to);
    var hi = n2(lo + q.to);
    var mid = n2((lo + hi) / 2);
    var nearHi = q.value > mid;
    var toTxt = q.unit === 'kg' ? 'whole kg' : q.to + ' g';
    api.say('The needle is between two labels. Which label is it nearer to?', 'think');
    stage.appendChild(MQ.ui.prompt('About how heavy is the ' + q.item.n + '? Round to the nearest <b>' + toTxt + '</b>.'));
    var d = dial(q.kind, { item: q.item, value: 0 });
    stage.appendChild(d.svg);
    api.later(function () {
      d.setValue(q.value);
    }, 60);
    var work = el('div', { class: 'sr-workbox' });
    var box = answerBox({
      unit: q.unit,
      onSubmit: function (num) {
        if (U.same(num, q.answer)) {
          box.done();
          api.check(true, 'Yes! It is nearer to ' + U.fmt(q.answer) + ', so about ' + fmtV(q.answer, q.unit) + '.');
          return;
        }
        box.ni.bad();
        var second = api.tries() >= 1;
        var other = nearHi ? lo : hi;
        if (U.same(num, other)) {
          api.check(false, second ? 'Find the middle tick between ' + U.fmt(lo) + ' and ' + U.fmt(hi) + '. The needle is ' + (nearHi ? 'past' : 'before') + ' it, so which label is nearer?' : 'Is the needle nearer to ' + U.fmt(lo) + ' or to ' + U.fmt(hi) + '? Look at the middle tick between them.', 'Rounded to the wrong label');
          return;
        }
        var idx = Math.round(q.answer / spec.step);
        if (spec.step !== 1 && U.same(num, idx)) {
          api.check(false, 'Look at the labels: this dial counts in ' + spec.step + 's.', 'Ignored the dial labels');
          return;
        }
        api.check(false, second ? 'The needle is between ' + U.fmt(lo) + ' and ' + U.fmt(hi) + '. Pick one of those two labels.' : 'Find the two labels the needle is between. Your answer is one of them.', 'Did not round to a labelled number');
      },
    });
    stage.appendChild(box.el);
    stage.appendChild(work);
    box.focus();
    api.onReveal(function () {
      box.done(q.answer);
      d.mark(lo, nearHi ? 'sr-ring-soft' : 'sr-ring-good');
      d.mark(hi, nearHi ? 'sr-ring-good' : 'sr-ring-soft');
      d.tickMark(mid, 'sr-tickmark-mid');
      work.appendChild(chips([{ t: 'between ' + U.fmt(lo) + ' and ' + U.fmt(hi) }, '→', { t: (nearHi ? 'past' : 'before') + ' the middle (' + U.fmt(mid) + ')' }, '→', { t: 'about ' + fmtV(q.answer, q.unit), cls: 'chip-total' }]));
    });
  }

  function renderCompare(stage, api, q) {
    var p = q.pair;
    api.say('Which is heavier? Make the units the same first!', 'think');
    stage.appendChild(MQ.ui.prompt('Drag <b>&lt;</b>, <b>=</b> or <b>&gt;</b> into the box.'));
    function side(s) {
      var d = dial(s[2], { item: s[3], value: 0 });
      api.later(function () {
        d.setValue(s[0]);
      }, 60);
      var cap = el('div', { class: 'sr-cap' }, s[3].n);
      return { d: d, el: el('div', { class: 'sr-side' }, d.svg, cap), cap: cap };
    }
    var A = side(p.a);
    var B = side(p.b);
    stage.appendChild(el('div', { class: 'sr-pair' }, A.el, B.el));
    var aG = toG(p.a[0], p.a[1]);
    var bG = toG(p.b[0], p.b[1]);
    var raw = cmp(p.a[0], p.b[0]);
    var kgSide = p.a[1] === 'kg' ? p.a : p.b;
    var conv = kgSide[0] + ' kg = ' + kgSide[0] * 1000 + ' g';
    var work = el('div', { class: 'sr-workbox' });
    var ss = symbolSlot(function (sym) {
      if (api.isAnswered()) return;
      if (sym === q.answer) {
        ss.set(sym, 'good');
        ss.disable();
        api.check(true, 'Yes! ' + aG + ' g ' + q.answer + ' ' + bG + ' g.');
        return;
      }
      ss.set(sym, 'bad');
      var second = api.tries() >= 1;
      var tag = q.answer === '=' ? 'Did not see 1000 g = 1 kg' : sym === raw ? 'Compared numbers without units' : 'Mixed up < and >';
      var hint;
      if (second) hint = conv + '. So compare ' + aG + ' g with ' + bG + ' g. The small end of the sign points to the smaller one.';
      else if (tag === 'Mixed up < and >') hint = 'The open side of the sign faces the heavier one. Check which side is heavier.';
      else hint = 'Careful! Look at the units: g and kg. Change the kg into g first: 1 kg = 1000 g.';
      api.check(false, hint, tag);
    });
    stage.appendChild(el('div', { class: 'sr-sentence' }, el('span', { class: 'sr-amt' }, fmtV(p.a[0], p.a[1])), ss.slot, el('span', { class: 'sr-amt' }, fmtV(p.b[0], p.b[1]))));
    stage.appendChild(ss.tiles);
    stage.appendChild(work);
    api.onReveal(function () {
      ss.set(q.answer, 'good');
      ss.disable();
      var kgCap = p.a[1] === 'kg' ? A.cap : B.cap;
      kgCap.textContent = conv;
      kgCap.classList.add('sr-cap-good');
      work.appendChild(chips([{ t: conv }]));
      work.appendChild(chips([{ t: aG + ' g' }, q.answer, { t: bG + ' g', cls: 'chip-total' }]));
    });
  }

  function renderArgue(stage, api, q) {
    var a = q.arg;
    api.say('The needle on the ' + a.g[2].n + ' went further round. Does that make them heavier?', 'think');
    stage.appendChild(MQ.ui.prompt('Which is heavier?'));
    var dG = dial(a.g[1], { item: a.g[2], value: 0 });
    var dK = dial(a.kg[1], { item: a.kg[2], value: 0 });
    api.later(function () {
      dG.setValue(a.g[0]);
      dK.setValue(a.kg[0]);
    }, 60);
    var capG = el('div', { class: 'sr-cap' }, a.g[2].n + ': ' + a.g[0] + ' g');
    var capK = el('div', { class: 'sr-cap' }, a.kg[2].n + ': ' + a.kg[0] + ' kg');
    var sG = el('div', { class: 'sr-side' }, dG.svg, capG);
    var sK = el('div', { class: 'sr-side' }, dK.svg, capK);
    stage.appendChild(el('div', { class: 'sr-pair' }, q.gFirst ? sG : sK, q.gFirst ? sK : sG));
    var gEmoji = a.g[2].e || '🛍️';
    var kEmoji = a.kg[2].e || '🛍️';
    var opts = [
      { label: gEmoji + ' The ' + a.g[2].n, value: 'g' },
      { label: kEmoji + ' The ' + a.kg[2].n, value: 'kg' },
    ];
    if (!q.gFirst) opts.reverse();
    opts.push({ label: '⚖️ The same', value: 'same' });
    var work = el('div', { class: 'sr-workbox' });
    var kgG = a.kg[0] * 1000;
    var ch = MQ.ui.choices(
      opts,
      function (v) {
        if (v === 'kg') {
          ch.mark(v, 'good');
          ch.disable();
          api.check(true, 'Yes! ' + a.kg[0] + ' kg = ' + kgG + ' g, and ' + kgG + ' g is more than ' + a.g[0] + ' g.');
          return;
        }
        ch.mark(v, 'bad');
        var second = api.tries() >= 1;
        api.check(false, second ? a.kg[0] + ' kg = ' + kgG + ' g. Is ' + a.g[0] + ' g more or less than ' + kgG + ' g?' : 'The needle went further round, but look at the units! One dial is in g and one is in kg.', 'Compared numbers without units');
      },
      { columns: 3 }
    );
    stage.appendChild(ch);
    stage.appendChild(work);
    api.onReveal(function () {
      ch.mark('kg', 'good');
      ch.disable();
      capK.textContent = a.kg[2].n + ': ' + a.kg[0] + ' kg = ' + kgG + ' g';
      capK.classList.add('sr-cap-good');
      work.appendChild(chips([{ t: a.g[0] + ' g' }, '<', { t: kgG + ' g', cls: 'chip-total' }]));
      api.feedback('Further round does not mean heavier when the units are different.', 'info');
    });
  }

  function renderSub(stage, api, q) {
    var total = q.kg * 1000;
    var name = q.story.e;
    api.say(q.kg === 1 ? 'Change 1 kg into grams first. Then take away.' : 'Each kilogram is 1000 grams. Change the kilograms into grams first.', 'think');
    stage.appendChild(MQ.ui.prompt('A <b>' + q.kg + '&nbsp;kg</b> bag of ' + name + '. ' + q.story.verb + ' <b>' + q.used + '&nbsp;g</b>.<br>How much is left?'));
    var bag = S('svg', { viewBox: '-45 -75 90 80', class: 'sr-bagpic' });
    bag.appendChild(drawItem(q.story.s ? { sack: q.story.s, color: q.story.s === 'FLOUR' ? '#f7f2e8' : q.story.s === 'SUGAR' ? '#ffffff' : null } : { e: q.story.emoji }));
    var bar = kgBar(q.kg);
    var note = el('div', { class: 'sr-note' }, q.kg === 1 ? '1 kg = 10 blocks of 100 g' : q.kg + ' kg = ' + (q.kg === 2 ? '1000 g + 1000 g' : '1000 g + 1000 g + 1000 g'));
    stage.appendChild(el('div', { class: 'sr-subrow' }, bag, el('div', { class: 'sr-col' }, bar.svg, note)));
    var work = el('div', { class: 'sr-workbox' });
    var box = answerBox({
      unit: 'g',
      onSubmit: function (num) {
        if (U.same(num, q.answer)) {
          box.done();
          bar.shade(q.used);
          api.check(true, 'Yes! ' + total + ' g − ' + q.used + ' g = ' + q.answer + ' g left.');
          return;
        }
        box.ni.bad();
        var second = api.tries() >= 1;
        if (U.same(num, q.used)) {
          api.check(false, 'That is how much we used. How much is still in the bag?', 'Gave the amount used, not what is left');
          return;
        }
        if (num < 10 || U.same(num, q.used - q.kg) || U.same(num, q.kg * 100 - q.used)) {
          api.check(false, second ? q.kg + ' kg = ' + total + ' g. Now work out ' + total + ' − ' + q.used + '.' : 'Change ' + q.kg + ' kg into grams first. 1 kg = 1000 g.', 'Subtracted g from kg without converting');
          return;
        }
        var nextH = Math.ceil(q.used / 100) * 100;
        var countHint = nextH === q.used ? 'Count up in 100s from ' + q.used + ' to ' + total + '.' : 'Count up from ' + q.used + ' to ' + nextH + ', then in 100s to ' + total + '.';
        api.check(false, second ? countHint : 'Nearly! Check your take-away: ' + total + ' g − ' + q.used + ' g. ' + (q.kg === 1 ? '' : 'Add your answer to ' + q.used + ': do you get ' + total + '?'), 'Slip when subtracting from ' + total);
      },
    });
    stage.appendChild(box.el);
    stage.appendChild(work);
    box.focus();
    api.onReveal(function () {
      box.done(q.answer);
      bar.shade(q.used);
      work.appendChild(chips([{ t: q.kg + ' kg = ' + total + ' g' }]));
      work.appendChild(chips([{ t: total + ' g' }, '−', { t: q.used + ' g', cls: 'sr-chip-used' }, '=', { t: q.answer + ' g left', cls: 'chip-total' }]));
      work.appendChild(chips(['Check:', { t: q.used + ' g' }, '+', { t: q.answer + ' g' }, '=', { t: total + ' g' }]));
    });
  }

  function renderRound7(stage, api, q) {
    api.say('A bag of potatoes is 7 kg to the nearest kg. Which dials could it be?', 'think');
    stage.appendChild(MQ.ui.prompt('Potatoes: <b>7 kg</b> to the nearest kg.<br>Click <b>every</b> dial that rounds to 7 kg.'));
    var picked = q.values.map(function () {
      return false;
    });
    var cards = [];
    var grid = el('div', { class: 'sr-cards' });
    q.values.forEach(function (v, i) {
      var d = dial('kg10', { mini: true, value: v });
      var b = el('button', { class: 'sr-card', type: 'button', 'data-i': String(i), 'aria-pressed': 'false' }, el('span', { class: 'sr-card-tag' }, String.fromCharCode(65 + i)), d.svg);
      b.addEventListener('click', function () {
        if (api.isAnswered()) return;
        MQ.sound('click');
        picked[i] = !picked[i];
        b.classList.toggle('on', picked[i]);
        b.classList.remove('bad');
        b.setAttribute('aria-pressed', String(picked[i]));
      });
      cards.push({ b: b, d: d });
      grid.appendChild(b);
    });
    stage.appendChild(grid);
    var checkBtn = el('button', { class: 'btn btn-check sr-check', type: 'button' }, 'Check');
    stage.appendChild(checkBtn);
    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      if (picked.indexOf(true) === -1) {
        api.feedback('Click the dials that round to 7 kg first.', 'info');
        return;
      }
      var wrongPick = 0;
      var missed = 0;
      picked.forEach(function (p, i) {
        if (p && !q.answer[i]) wrongPick++;
        if (!p && q.answer[i]) missed++;
      });
      if (!wrongPick && !missed) {
        checkBtn.disabled = true;
        cards.forEach(function (c, i) {
          if (q.answer[i]) c.b.classList.add('good');
        });
        api.check(true, 'Yes! Those needles are all nearer to 7 than to 6 or 8.');
        return;
      }
      var second = api.tries() >= 1;
      if (second) {
        cards.forEach(function (c, i) {
          if (picked[i] && !q.answer[i]) c.b.classList.add('bad');
        });
      }
      var hint;
      if (wrongPick) hint = second ? 'The red ones are not nearest to 7. A needle before the middle tick (6½) is nearer to 6; past 7½ it is nearer to 8.' : 'Some of your picks are nearer to 6 or 8. Look at the middle ticks either side of 7.';
      else hint = second ? 'You missed one. ' + q.answer.filter(Boolean).length + ' dials round to 7 kg.' : 'Good so far, but there is another one. Check every dial.';
      api.check(false, hint, 'Rounded to the wrong label');
    });
    api.onReveal(function () {
      checkBtn.disabled = true;
      cards.forEach(function (c, i) {
        c.d.band(6.5, 7.5, 'sr-band-good');
        c.b.classList.remove('bad', 'on');
        if (q.answer[i]) c.b.classList.add('good');
        else c.b.classList.add('sr-dim');
      });
      api.feedback('The green part goes from 6½ kg to 7½ kg. Needles in it round to 7 kg.', 'info');
    });
  }

  MQ.register('scale-reader', {
    learn: [learn1, learn2, learn3, learn4],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        // Harmless hook for automated tests: the question type and answer.
        var wrap = el('div', { class: 'sr-q', 'data-type': q.type, 'data-answer': Array.isArray(q.answer) ? q.answer.map(Number).join(',') : String(q.answer), 'data-unit': q.unit || '' });
        stage.appendChild(wrap);
        if (q.type === 'read') renderRead(wrap, api, q);
        else if (q.type === 'round') renderRound(wrap, api, q);
        else if (q.type === 'compare') renderCompare(wrap, api, q);
        else if (q.type === 'argue') renderArgue(wrap, api, q);
        else if (q.type === 'sub') renderSub(wrap, api, q);
        else renderRound7(wrap, api, q);
      },
    },
  });
  var deck = null;

  // Exposed for offline answer checks (no effect on the page).
  MQ.scaleReaderTest = { buildDeck: buildDeck, DIALS: DIALS, angleOf: angleOf, labelsOf: labelsOf };

  var css = [
    '.sr-q{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.sr-dial{width:270px;max-width:100%;height:auto;display:block;user-select:none}',
    '.sr-side .sr-dial{width:230px}',
    '.sr-pan{fill:#dfe6f3;stroke:#9fb3d9;stroke-width:2.5}',
    '.sr-body{fill:#f4f6fb;stroke:#c9d3ee;stroke-width:3}',
    '.sr-face{fill:#fff;stroke:#9fb3d9;stroke-width:3}',
    '.sr-tick{stroke:#8a96b3;stroke-width:1.6}',
    '.sr-tick-half{stroke:#4a5a7d;stroke-width:2.2}',
    '.sr-tick-major{stroke:#1b2a4a;stroke-width:3.2}',
    '.sr-label{font-size:18px;font-weight:800;fill:#1b2a4a;font-family:var(--font)}',
    '.sr-label-sm{font-size:14px}',
    '.sr-dial-unit{font-size:24px;font-weight:800;fill:#0b6e66;font-family:var(--font)}',
    '.sr-needle{transition:transform .9s cubic-bezier(.3,1.45,.55,1)}',
    '.sr-needle-arm{fill:#e5383b}',
    '.sr-hub{fill:#1b2a4a}',
    '.sr-emoji{font-size:54px}',
    '.sr-sack-txt{font-size:13px;font-weight:800;fill:#6b5426;font-family:var(--font);letter-spacing:.04em}',
    '.sr-hit{fill:transparent;cursor:pointer}',
    '.sr-hit:hover{fill:rgba(46,196,182,.18)}',
    '.sr-ring{fill:none;stroke-width:4}',
    '.sr-ring-good{stroke:var(--good);fill:rgba(31,157,107,.15)}',
    '.sr-ring-bad{stroke:var(--try)}',
    '.sr-ring-soft{stroke:#9fb3d9;stroke-dasharray:4 3}',
    '.sr-tickmark{stroke-width:5;stroke-linecap:round}',
    '.sr-tickmark-mid{stroke:#f08c00}',
    '.sr-band{fill:none;stroke-width:18;stroke-linecap:butt}',
    '.sr-band-good{stroke:rgba(31,157,107,.35)}',
    '.sr-pair{display:flex;align-items:flex-end;justify-content:center;gap:18px;flex-wrap:wrap;width:100%}',
    '.sr-side{display:flex;flex-direction:column;align-items:center;gap:2px;max-width:100%}',
    '.sr-cap{font-weight:800;font-size:1.15rem;padding:2px 12px;border-radius:10px;text-align:center}',
    '.sr-cap-good{background:var(--good-bg);color:var(--good)}',
    '.sr-col{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;max-width:100%}',
    '.sr-bags{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;min-height:38px;max-width:640px}',
    '.sr-bag{background:#f3e6c8;border:2px solid #b89b6a;border-radius:10px 10px 6px 6px;padding:4px 8px;font-weight:800;font-size:.95rem;animation:pop .25s ease}',
    '.sr-count{font-weight:800;font-size:1.1rem;color:var(--ink-soft);text-align:center}',
    '.sr-scene{width:520px;max-width:100%;height:auto;user-select:none;touch-action:none}',
    '.sr-scene-hint{font-size:16px;font-weight:700;fill:var(--ink-soft);font-family:var(--font)}',
    '.sr-grab{fill:rgba(46,196,182,.12);stroke:rgba(46,196,182,.5);stroke-width:2;stroke-dasharray:6 4}',
    '.sr-drag{cursor:grab}',
    '.sr-sentence{display:flex;align-items:center;gap:14px;justify-content:center;flex-wrap:wrap}',
    '.sr-amt{font-size:1.6rem;font-weight:800;background:var(--info-bg);border:2px solid var(--line);border-radius:14px;padding:6px 16px}',
    '.sr-slot{width:72px;height:72px;border:4px dashed var(--line);border-radius:16px;display:grid;place-items:center;font-size:2.3rem;font-weight:800;background:#fff;color:var(--ink-soft)}',
    '.sr-slot.good{border-style:solid;border-color:var(--good);background:var(--good-bg);color:var(--good)}',
    '.sr-slot.bad{border-style:solid;border-color:var(--try);background:var(--try-bg);color:var(--try)}',
    '.sr-tiles{display:flex;gap:14px;justify-content:center}',
    '.sr-tile{width:72px;height:64px;font-size:2rem;font-weight:800;border-radius:14px;border:3px solid var(--line);background:#fff;color:var(--ink);cursor:grab;touch-action:none;font-family:inherit}',
    '.sr-tile:hover{border-color:var(--accent)}',
    '.sr-tile.sr-dragging{position:relative;z-index:30;cursor:grabbing;box-shadow:0 8px 18px rgba(27,42,74,.25)}',
    '.sr-tiles.sr-off .sr-tile{opacity:.45;cursor:default}',
    '.sr-units{display:flex;gap:6px}',
    '.sr-unit{min-width:64px;height:60px;font-size:1.35rem;font-weight:800;border-radius:14px;border:3px solid var(--line);background:#fff;color:var(--ink);cursor:pointer;font-family:inherit}',
    '.sr-unit.on{background:var(--accent);border-color:var(--accent);color:#06212a}',
    '.sr-unit:disabled{cursor:default}',
    '.sr-workbox{display:flex;flex-direction:column;align-items:center;gap:8px;min-height:0}',
    '.sr-work{font-size:1.15rem}',
    '.sr-chip-used{background:#ffe3e3;border-color:#f08c8c}',
    '.sr-rice{width:680px;max-width:100%;height:auto;user-select:none;touch-action:none}',
    '.sr-block{fill:#f3e6c8;stroke:#b89b6a;stroke-width:2}',
    '.sr-block-used{fill:#ffc9c9;stroke:#e03131;stroke-width:2}',
    '.sr-block-left{fill:#c3f0d8;stroke:var(--good);stroke-width:2}',
    '.sr-left .sr-block{fill:#c3f0d8;stroke:var(--good)}',
    '.sr-block-txt{font-size:17px;font-weight:800;fill:#5c4a24;font-family:var(--font);pointer-events:none}',
    '.sr-block-txt-sm{font-size:14px}',
    '.sr-rblock{cursor:grab}',
    '.sr-in-pot{cursor:default}',
    '.sr-pot{fill:#c9d3ee;stroke:#7d8aa8;stroke-width:3}',
    '.sr-pot-rim{fill:#9fb3d9}',
    '.sr-pot-txt{font-size:20px;font-weight:800;fill:#1b2a4a;font-family:var(--font)}',
    '.sr-bar{width:660px;max-width:100%;height:auto}',
    '.sr-bar-lbl{font-size:18px;font-weight:800;fill:#1b2a4a;font-family:var(--font)}',
    '.sr-rule{background:#fff3cd;border:2px solid var(--gold);border-radius:14px;padding:8px 16px;font-size:1.15rem;font-weight:700}',
    '.sr-subrow{display:flex;align-items:center;gap:12px;justify-content:center;width:100%;flex-wrap:wrap}',
    '.sr-subrow .sr-col{flex:1 1 360px;max-width:660px}',
    '.sr-bagpic{width:76px;height:auto;flex:none}',
    '.sr-note{font-weight:800;color:var(--ink-soft)}',
    '.sr-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;width:100%;max-width:820px}',
    '.sr-card{position:relative;border:3px solid var(--line);border-radius:16px;background:#fff;padding:6px;cursor:pointer;font-family:inherit}',
    '.sr-card:hover{border-color:var(--accent)}',
    '.sr-card.on{border-color:#3a86ff;background:#e8f0ff;box-shadow:0 0 0 3px rgba(58,134,255,.25)}',
    '.sr-card.good{border-color:var(--good);background:var(--good-bg)}',
    '.sr-card.bad{border-color:var(--try);background:var(--try-bg)}',
    '.sr-card.sr-dim{opacity:.55}',
    '.sr-card .sr-dial{width:100%}',
    '.sr-card-tag{position:absolute;left:8px;top:4px;font-weight:800;font-size:1.1rem;color:var(--ink-soft)}',
    '.sr-check{min-width:140px}',
    '@media (max-width:900px){.sr-cards{grid-template-columns:repeat(2,minmax(0,1fr));max-width:440px}.sr-side .sr-dial{width:200px}.sr-dial{width:240px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'scale-reader' }, css));
})();

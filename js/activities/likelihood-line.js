/* How Likely? — place events on a likelihood line from "will not happen" to "will happen"
 * (Project 6, Textbook p.275–276, after Unit 17; uses Unit 16 chance words).
 * Learn: sure and impossible events at the ends; a coin in the middle and rain somewhere in between;
 * the guessing game (land inside the green band for a star).
 * Practice: L1 place sure / impossible / coin events; L2 bags and spinners with exact counts
 * (the target is count ÷ total along the line, close enough = within 1/8 of the line) and
 * "which is nearer will happen?"; L3 Bolt's arrow is shown, choose the event that fits it.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;
  var ID = 'likelihood-line';

  /* ---------------------------------------------------------------- *
   * Line geometry (SVG units). p = 0 is "will not happen", p = 1 is "will happen".
   * ---------------------------------------------------------------- */
  var W = 800;
  var H = 240;
  var X0 = 80;
  var X1 = 720;
  var LY = 96;
  var TOL = 1 / 8; // close enough: 1/8 of the line (book: 1 cm on a line about 9 cm long)
  var END = 0.06; // this close to an end counts as "at the end"
  var EPS = 1e-9;

  function xOf(p) {
    return X0 + (X1 - X0) * p;
  }
  function pOf(x) {
    return U.clamp((x - X0) / (X1 - X0), 0, 1);
  }

  var COL = {
    red: { hex: '#e63946', name: 'red', letter: 'R', ink: '#fff' },
    blue: { hex: '#3a86ff', name: 'blue', letter: 'B', ink: '#fff' },
    green: { hex: '#2a9d8f', name: 'green', letter: 'G', ink: '#fff' },
    yellow: { hex: '#f4c430', name: 'yellow', letter: 'Y', ink: '#3b2f00' },
    heads: { hex: '#e9c46a', name: 'heads', letter: 'H', ink: '#3b2f00' },
    tails: { hex: '#c3cad2', name: 'tails', letter: 'T', ink: '#1f2933' },
  };
  var PAIRS = [
    ['red', 'blue'],
    ['green', 'yellow'],
    ['blue', 'yellow'],
    ['red', 'green'],
  ];
  var PAINTS = ['red', 'blue', 'green', 'yellow'];

  var TAG = {
    mightEnd: 'Put a "might" event at an end',
    backwards: 'Read the line backwards',
    middleLikely: 'Thought the middle means "probably will"',
    middleUnlikely: 'Thought the middle means "probably not"',
    sureBetween: 'Put a sure or impossible event in between',
    evenOff: 'Did not put an even chance in the middle',
    counts: 'Ignored how many of each colour',
    fewer: 'Picked the colour with fewer counters',
  };

  /* ---------------------------------------------------------------- *
   * Everyday events. Only sure, impossible and coin events (exact chance).
   * ---------------------------------------------------------------- */
  var CERTAIN = [
    { e: '📅', t: 'After Monday comes Tuesday' },
    { e: '🎂', t: 'Next year I will be one year older' },
    { e: '🎲', t: 'A dice lands on a number from 1 to 6' },
    { e: '⚽', t: 'If I drop a ball, it will fall down' },
    { e: '🧊', t: 'Ice in a hot pan will melt' },
  ];
  var IMPOSSIBLE = [
    { e: '🎲', t: 'A dice lands on 7' },
    { e: '🐶', t: 'My dog will do my maths homework' },
    { e: '🐟', t: 'The goldfish will ride a bike to school' },
    { e: '📅', t: 'Next week will have 8 days' },
    { e: '🏠', t: 'I will grow taller than my house tonight' },
  ];
  var EVEN = [
    { e: '🪙', t: 'A coin lands on heads', face: 'heads' },
    { e: '🪙', t: 'A coin lands on tails', face: 'tails' },
  ];

  // [count of the colour asked about, count of the other colour]
  var BAG_PLACE = [[3, 1], [1, 3], [1, 5], [5, 1], [2, 1], [1, 2], [4, 2], [2, 4], [4, 1], [1, 4]];
  var SPIN_PLACE = [[3, 1], [1, 3], [2, 2], [4, 0], [0, 4], [5, 1], [1, 5], [3, 3], [2, 1], [1, 2]];
  var COMPARE = [[3, 1], [1, 3], [1, 5], [5, 1], [2, 4], [4, 2], [1, 2], [2, 1], [2, 2], [3, 3]];
  var CHOOSE = [[3, 1], [1, 3], [5, 1], [1, 5], [4, 1], [1, 4], [2, 1], [1, 2], [4, 2], [2, 4]];

  /* ---------------------------------------------------------------- *
   * Set-ups: { kind: 'bag'|'spinner', cols: [{c, n}, {c, n}], pick }
   * ---------------------------------------------------------------- */
  function countOf(s, c) {
    var n = 0;
    s.cols.forEach(function (k) {
      if (k.c === c) n += k.n;
    });
    return n;
  }
  function totalOf(s) {
    return s.cols.reduce(function (a, k) {
      return a + k.n;
    }, 0);
  }
  function posOf(s) {
    return countOf(s, s.pick) / totalOf(s);
  }
  function otherOf(s) {
    return s.cols[0].c === s.pick ? s.cols[1] : s.cols[0];
  }
  function cap(t) {
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function pairKey(a, b) {
    return Math.min(a, b) + '-' + Math.max(a, b);
  }
  function dot(c) {
    return '<span class="llk-dot" style="background:' + COL[c].hex + '"></span>';
  }
  /** "3 out of 4 counters are red" */
  function desc(s) {
    var a = countOf(s, s.pick);
    var n = totalOf(s);
    var thing = s.kind === 'bag' ? 'counters' : 'parts of the spinner';
    return a + ' out of ' + n + ' ' + thing + ' ' + (a === 1 ? 'is' : 'are') + ' ' + s.pick;
  }
  /** Line segments in order: the asked-for colour first, then the rest. */
  function partsOf(s) {
    var out = [];
    var o = otherOf(s);
    for (var i = 0; i < countOf(s, s.pick); i++) out.push(s.pick);
    for (var j = 0; j < o.n; j++) out.push(o.c);
    return out;
  }
  function coinParts(face) {
    return face === 'heads' ? ['heads', 'tails'] : ['tails', 'heads'];
  }

  /* ---------------------------------------------------------------- *
   * What went wrong? t = true place, p = where it was put (0..1).
   * ---------------------------------------------------------------- */
  function classify(t, p) {
    if (t === 0 || t === 1) return Math.abs(p - (1 - t)) <= TOL + EPS ? TAG.backwards : TAG.sureBetween;
    if (p <= END || p >= 1 - END) return TAG.mightEnd;
    if (t === 0.5) return TAG.evenOff;
    if (Math.abs(p - 0.5) <= 0.07) return t > 0.5 ? TAG.middleLikely : TAG.middleUnlikely;
    if ((p - 0.5) * (t - 0.5) < 0 && Math.abs(p - (1 - t)) <= TOL + EPS) return TAG.backwards;
    return TAG.counts;
  }
  function isClose(p, t) {
    return Math.abs(p - t) <= TOL + EPS;
  }

  /* ---------------------------------------------------------------- *
   * Deck
   * ---------------------------------------------------------------- */
  function setup(kind, a, b, pair) {
    return { kind: kind, cols: [{ c: pair[0], n: a }, { c: pair[1], n: b }], pick: pair[0] };
  }
  function takeFresh(list, used) {
    var opts = U.shuffle(list.slice()).filter(function (ab) {
      return !used[pairKey(ab[0], ab[1])];
    });
    var ab = opts[0];
    used[pairKey(ab[0], ab[1])] = true;
    return ab;
  }
  function startFor(t) {
    var opts = [0.15, 0.3, 0.45, 0.6, 0.75, 0.88].filter(function (s) {
      return Math.abs(s - t) > 0.3 && Math.abs(s - (1 - t)) > 0.05;
    });
    return U.pick(opts);
  }

  function buildDeck() {
    var cert = U.shuffle(CERTAIN.slice());
    var imp = U.shuffle(IMPOSSIBLE.slice());
    var even = U.shuffle(EVEN.slice());
    var used = {};
    var q = [];

    // Level 1: one sure, one impossible, one coin event.
    U.shuffle([
      { ev: cert[0], t: 1, cat: 'certain' },
      { ev: imp[0], t: 0, cat: 'impossible' },
      { ev: even[0], t: 0.5, cat: 'even' },
    ]).forEach(function (o) {
      q.push({ type: 'place', ev: o.ev, cat: o.cat, t: o.t, start: startFor(o.t) });
    });

    // Level 2: a bag, a spinner, then "which is nearer will happen?".
    var ab = takeFresh(BAG_PLACE, used);
    var s1 = setup('bag', ab[0], ab[1], U.pick(PAIRS));
    q.push({ type: 'place', setup: s1, t: posOf(s1), start: startFor(posOf(s1)) });

    ab = takeFresh(SPIN_PLACE, used);
    var s2 = setup('spinner', ab[0], ab[1], U.pick(PAIRS));
    q.push({ type: 'place', setup: s2, t: posOf(s2), start: startFor(posOf(s2)) });

    ab = takeFresh(COMPARE, used);
    var pr = U.shuffle(U.pick(PAIRS).slice());
    var s3 = { kind: 'bag', cols: [{ c: pr[0], n: ab[0] }, { c: pr[1], n: ab[1] }], pick: pr[0] };
    var answer = ab[0] === ab[1] ? 'same' : ab[0] > ab[1] ? pr[0] : pr[1];
    q.push({ type: 'compare', setup: s3, answer: answer });

    // Level 3: Bolt's arrow is shown; which event fits?
    var arrowAt = U.pick([0, 0.5, 1]);
    var evOpts = [
      { e: cert[1].e, text: cert[1].t, t: 1 },
      { e: imp[1].e, text: imp[1].t, t: 0 },
      { e: even[1].e, text: even[1].t, t: 0.5 },
    ];
    q.push({ type: 'choose', arrow: arrowAt, options: U.shuffle(evOpts) });

    ab = takeFresh(CHOOSE, used);
    var pr2 = U.shuffle(U.pick(PAIRS).slice());
    var s4 = { kind: 'bag', cols: [{ c: pr2[0], n: ab[0] }, { c: pr2[1], n: ab[1] }], pick: pr2[0] };
    var target = U.pick([pr2[0], pr2[1]]);
    var n4 = totalOf(s4);
    var arrow4 = countOf(s4, target) / n4;
    var third = PAINTS.filter(function (c) {
      return c !== pr2[0] && c !== pr2[1];
    });
    var bagOpts = [
      { c: pr2[0], text: 'I pick ' + pr2[0], t: ab[0] / n4 },
      { c: pr2[1], text: 'I pick ' + pr2[1], t: ab[1] / n4 },
    ];
    var extra = [
      { c: third[0], text: 'I pick ' + third[0], t: 0 },
      { c: null, text: 'I pick ' + pr2[0] + ' or ' + pr2[1], t: 1 },
    ].filter(function (o) {
      return Math.abs(o.t - arrow4) >= 0.2;
    });
    bagOpts.push(U.pick(extra));
    q.push({ type: 'choose', arrow: arrow4, setup: s4, target: target, options: U.shuffle(bagOpts) });
    return q;
  }

  /* ---------------------------------------------------------------- *
   * Words
   * ---------------------------------------------------------------- */
  function work(q) {
    if (q.setup) {
      var s = q.setup;
      var a = countOf(s, s.pick);
      var n = totalOf(s);
      if (a === 0) return 'There is no ' + s.pick + ' at all, so it can never happen: the "will not happen" end.';
      if (a === n) return 'All ' + n + ' are ' + s.pick + ', so it is sure: the "will happen" end.';
      var w = cap(desc(s)) + '. Split the line into ' + n + ' equal parts. ' + cap(s.pick) + ' goes ' + a + ' of the ' + n + ' parts along.';
      if (2 * a === n) w += ' That is the middle: an even chance.';
      return w;
    }
    if (q.t === 1) return 'It is sure to happen, so it goes at the "will happen" end.';
    if (q.t === 0) return 'It can never happen, so it goes at the "will not happen" end.';
    return 'A coin has 2 sides. ' + cap(q.ev.face) + ' is 1 of the 2, so it goes 1 of 2 parts along: the middle. An even chance!';
  }

  function praise(q) {
    if (q.setup) {
      var s = q.setup;
      var a = countOf(s, s.pick);
      var n = totalOf(s);
      if (a === 0) return 'Yes! No ' + s.pick + ', so it will not happen.';
      if (a === n) return 'Yes! All ' + s.pick + ', so it will happen.';
      if (2 * a === n) return 'Yes! Half and half: an even chance.';
      return 'Yes! ' + a + ' of the ' + n + ' parts along.';
    }
    if (q.t === 1) return 'Yes! Sure to happen: the right end.';
    if (q.t === 0) return 'Yes! It can never happen: the left end.';
    return 'Yes! Heads or tails: an even chance, in the middle.';
  }

  function placeHint(tag, q, second) {
    var s = q.setup;
    var a = s ? countOf(s, s.pick) : 0;
    var n = s ? totalOf(s) : 0;
    var countIt = s ? cap(desc(s)) + '. Count ' + a + ' of the ' + n + ' parts along from "will not happen".' : '';
    if (tag === TAG.backwards) {
      if (q.t === 1) return second ? 'It is sure to happen. Drag the arrow to the RIGHT end, "will happen".' : 'Check the ends: "will happen" is on the right.';
      if (q.t === 0) return second ? 'It can never happen. Drag the arrow to the LEFT end, "will not happen".' : 'Check the ends: "will not happen" is on the left.';
      return second ? countIt : 'Check the ends. More likely means nearer "will happen", on the right.';
    }
    if (tag === TAG.sureBetween) {
      if (q.t === 1) {
        var y = s ? 'Every one is ' + s.pick + '. You are sure to get ' + s.pick + '!' : 'Could it fail to happen? No!';
        return y + (second ? ' Push the arrow all the way to the right end, "will happen".' : ' So it goes right at the end.');
      }
      var z = s ? 'Is there any ' + s.pick + '? No! So you cannot get ' + s.pick + '.' : 'Could this ever happen? No!';
      return z + (second ? ' Push the arrow all the way to the left end, "will not happen".' : ' So it goes right at the end.');
    }
    if (tag === TAG.mightEnd) {
      if (!second) return 'It might happen, so it goes in between, not at an end.';
      return s ? cap(desc(s)) + '. It might happen, but not for sure. Count ' + a + ' of the ' + n + ' parts along.' : 'Heads or tails: 1 out of 2. Put it in the middle, at "even chance".';
    }
    if (tag === TAG.evenOff) {
      if (s) {
        var o = otherOf(s);
        return second ? 'Same chance means the middle mark, halfway between the ends.' : a + ' ' + s.pick + ' and ' + o.n + ' ' + o.c + ': the same number. That is an even chance.';
      }
      return second ? 'Put the arrow on the middle mark, halfway between the ends.' : 'Heads and tails are just as likely. That is an even chance.';
    }
    if (tag === TAG.middleLikely) {
      return second ? countIt : 'The middle means an even chance, like a coin. There are more ' + s.pick + ', so move it nearer "will happen".';
    }
    if (tag === TAG.middleUnlikely) {
      return second ? countIt : 'The middle means an even chance, like a coin. There are fewer ' + s.pick + ', so move it nearer "will not happen".';
    }
    return second ? countIt : 'Count each colour. ' + cap(desc(s)) + '.';
  }

  /* ---------------------------------------------------------------- *
   * Drawing: the line
   * ---------------------------------------------------------------- */
  function makeLine() {
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'llk-svg', role: 'img', 'aria-label': 'Line from will not happen (left) to will happen (right)' });
    var bandG = svg('g');
    var baseG = svg('g');
    var partsG = svg('g');
    var tickG = svg('g');
    var markG = svg('g');
    var arrowG = svg('g');
    root.appendChild(bandG);
    root.appendChild(baseG);
    root.appendChild(partsG);
    root.appendChild(tickG);
    root.appendChild(markG);
    root.appendChild(arrowG);

    baseG.appendChild(svg('rect', { x: X0, y: LY - 6, width: X1 - X0, height: 12, rx: 6, class: 'llk-track' }));
    baseG.appendChild(svg('rect', { x: X0 - 5, y: LY - 24, width: 10, height: 48, rx: 4, class: 'llk-end llk-end-no' }));
    baseG.appendChild(svg('rect', { x: X1 - 5, y: LY - 24, width: 10, height: 48, rx: 4, class: 'llk-end llk-end-yes' }));
    baseG.appendChild(svg('rect', { x: xOf(0.5) - 3, y: LY - 18, width: 6, height: 36, rx: 3, class: 'llk-mid' }));
    [
      [X0, 'will not', 'happen', 'llk-lbl-no'],
      [xOf(0.5), 'even', 'chance', 'llk-lbl-mid'],
      [X1, 'will', 'happen', 'llk-lbl-yes'],
    ].forEach(function (L) {
      baseG.appendChild(svg('text', { x: L[0], y: H - 36, 'text-anchor': 'middle', class: 'llk-lbl ' + L[3] }, L[1]));
      baseG.appendChild(svg('text', { x: L[0], y: H - 10, 'text-anchor': 'middle', class: 'llk-lbl ' + L[3] }, L[2]));
    });

    var hit = svg('rect', { x: 0, y: 0, width: W, height: LY + 26, class: 'llk-hit', tabindex: '0', 'aria-label': 'Drag the arrow along the line' });
    root.appendChild(hit);

    var line = { svg: root, hit: hit };

    line.band = function (t) {
      MQ.clear(bandG);
      var a = Math.max(0, t - TOL);
      var b = Math.min(1, t + TOL);
      bandG.appendChild(svg('rect', { x: xOf(a) - (a === 0 ? 8 : 0), y: LY - 30, width: xOf(b) - xOf(a) + (a === 0 ? 8 : 0) + (b === 1 ? 8 : 0), height: 60, rx: 10, class: 'llk-band' }));
    };
    /** Equal parts with no colours (a hint). */
    line.ticks = function (n) {
      MQ.clear(tickG);
      for (var k = 1; k < n; k++) tickG.appendChild(svg('rect', { x: xOf(k / n) - 2, y: LY - 16, width: 4, height: 32, class: 'llk-tick' }));
    };
    /** Coloured equal parts; the first `count` are numbered 1, 2, 3 … */
    line.parts = function (list, count) {
      MQ.clear(partsG);
      MQ.clear(tickG);
      var n = list.length;
      var seg = (X1 - X0) / n;
      list.forEach(function (c, k) {
        var x = X0 + k * seg;
        partsG.appendChild(svg('rect', { x: x + 2, y: LY - 10, width: seg - 4, height: 20, rx: 6, fill: COL[c].hex, class: 'llk-part' }));
        if (k < count) partsG.appendChild(svg('text', { x: x + seg / 2, y: LY - 18, 'text-anchor': 'middle', class: 'llk-partnum' }, String(k + 1)));
      });
    };
    /** Marker below the line (Bolt's answer, a colour, someone else's guess). */
    line.marker = function (p, opts) {
      var g = svg('g', { class: 'llk-marker ' + (opts.cls || 'llk-ans') });
      g.appendChild(svg('polygon', { points: '0,' + (LY + 9) + ' -15,' + (LY + 31) + ' 15,' + (LY + 31), style: opts.hex ? 'fill:' + opts.hex : null }));
      g.appendChild(svg('rect', { x: -4, y: LY + 29, width: 8, height: 14, style: opts.hex ? 'fill:' + opts.hex : null }));
      g.appendChild(svg('circle', { cx: 0, cy: LY + 62, r: 21, style: opts.hex ? 'stroke:' + opts.hex : null }));
      g.appendChild(svg('text', { x: 0, y: LY + 70, 'text-anchor': 'middle', class: 'llk-emo-s' }, opts.label));
      markG.appendChild(g);
      var m = {
        g: g,
        set: function (q) {
          m.p = q;
          g.setAttribute('transform', 'translate(' + xOf(q) + ',0)');
        },
      };
      m.set(p);
      return m;
    };
    /** Arrow above the line. Draggable when bound with dragArrow(). */
    line.arrow = function (opts) {
      var g = svg('g', { class: 'llk-arrow ' + (opts.cls || 'llk-me') });
      g.appendChild(svg('rect', { x: -6, y: 50, width: 12, height: LY - 36 - 50 + 2, rx: 3 }));
      g.appendChild(svg('polygon', { points: '-19,' + (LY - 36) + ' 19,' + (LY - 36) + ' 0,' + (LY - 7) }));
      g.appendChild(svg('circle', { cx: 0, cy: 27, r: 24 }));
      g.appendChild(svg('text', { x: 0, y: 36, 'text-anchor': 'middle', class: 'llk-emo' }, opts.emoji || ''));
      arrowG.appendChild(g);
      var a = {
        g: g,
        p: opts.p,
        start: opts.p,
        moved: false,
        locked: false,
        set: function (q) {
          if (q < 0.015) q = 0;
          if (q > 0.985) q = 1;
          a.p = q;
          if (Math.abs(q - a.start) > 0.004) a.moved = true;
          g.setAttribute('transform', 'translate(' + xOf(q) + ',0)');
        },
        lock: function () {
          a.locked = true;
          g.classList.add('llk-locked');
        },
      };
      g.setAttribute('transform', 'translate(' + xOf(opts.p) + ',0)');
      return a;
    };
    return line;
  }

  /** Drag (or click, or ←/→ keys) anywhere along the line strip to move the arrow. */
  function dragArrow(api, line, arrow, onEnd) {
    var unbind = MQ.ui.drag(line.svg, line.hit, {
      start: function (p) {
        if (!arrow.locked) arrow.set(pOf(p.x));
      },
      move: function (p) {
        if (!arrow.locked) arrow.set(pOf(p.x));
      },
      end: function (p) {
        if (arrow.locked) return;
        arrow.set(pOf(p.x));
        if (onEnd) onEnd(arrow.p);
      },
    });
    api.cleanup(unbind);
    line.hit.addEventListener('keydown', function (e) {
      if (arrow.locked) return;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        arrow.set(U.clamp(arrow.p + (e.key === 'ArrowLeft' ? -1 : 1) / 40, 0, 1));
      } else if (e.key === 'Enter' && onEnd) {
        onEnd(arrow.p);
      }
    });
  }

  function slide(api, thing, from, to, ms, done) {
    var steps = 16;
    for (var i = 1; i <= steps; i++) {
      (function (k) {
        api.later(function () {
          thing.set(from + ((to - from) * k) / steps);
          if (k === steps && done) done();
        }, (ms * k) / steps);
      })(i);
    }
  }

  /* ---------------------------------------------------------------- *
   * Drawing: cards, bags, spinners, coins
   * ---------------------------------------------------------------- */
  function card(emoji, html, cls) {
    return el('div', { class: 'llk-card ' + (cls || '') }, el('span', { class: 'llk-card-ic' }, emoji), el('span', { html: html }));
  }

  function bagPic(s) {
    var list = [];
    s.cols.forEach(function (k) {
      for (var i = 0; i < k.n; i++) list.push(k.c);
    });
    var n = list.length;
    var cols = n <= 3 ? n : Math.ceil(n / 2);
    var rows = n <= 3 ? 1 : 2;
    var root = svg('svg', { viewBox: '0 0 200 155', class: 'llk-pic', role: 'img', 'aria-label': 'A bag of counters' });
    root.appendChild(svg('path', { d: 'M40,34 L160,34 Q170,34 171,44 L183,138 Q184,150 172,150 L28,150 Q16,150 17,138 L29,44 Q30,34 40,34 Z', class: 'llk-bag' }));
    root.appendChild(svg('rect', { x: 76, y: 18, width: 48, height: 18, rx: 7, class: 'llk-bag-tie' }));
    list.forEach(function (c, i) {
      var cx = 100 + ((i % cols) - (cols - 1) / 2) * 44;
      var cy = rows === 1 ? 94 : 72 + Math.floor(i / cols) * 46;
      root.appendChild(svg('circle', { cx: cx, cy: cy, r: 18, fill: COL[c].hex, class: 'llk-counter' }));
      root.appendChild(svg('text', { x: cx, y: cy + 7, 'text-anchor': 'middle', class: 'llk-cl', fill: COL[c].ink }, COL[c].letter));
    });
    return root;
  }

  function spinPic(s) {
    var list = [];
    s.cols.forEach(function (k) {
      for (var i = 0; i < k.n; i++) list.push(k.c);
    });
    // Spread the colours out a little so it looks like a real spinner.
    if (list.length > 2) {
      var a = list.filter(function (c) { return c === list[0]; });
      var b = list.filter(function (c) { return c !== list[0]; });
      var mixed = [];
      while (a.length || b.length) {
        if (a.length) mixed.push(a.shift());
        if (b.length) mixed.push(b.shift());
      }
      list = mixed;
    }
    var n = list.length;
    var cx = 100;
    var cy = 80;
    var r = 68;
    var root = svg('svg', { viewBox: '0 0 200 160', class: 'llk-pic', role: 'img', 'aria-label': 'A spinner with ' + n + ' equal parts' });
    if (n === 1) {
      root.appendChild(svg('circle', { cx: cx, cy: cy, r: r, fill: COL[list[0]].hex, class: 'llk-sector' }));
    }
    function pt(deg, rad) {
      var t = ((deg - 90) * Math.PI) / 180;
      return [cx + rad * Math.cos(t), cy + rad * Math.sin(t)];
    }
    list.forEach(function (c, k) {
      var a0 = (360 * k) / n;
      var a1 = (360 * (k + 1)) / n;
      if (n > 1) {
        var p0 = pt(a0, r);
        var p1 = pt(a1, r);
        root.appendChild(svg('path', { d: 'M' + cx + ',' + cy + ' L' + p0[0].toFixed(2) + ',' + p0[1].toFixed(2) + ' A' + r + ',' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + p1[0].toFixed(2) + ',' + p1[1].toFixed(2) + ' Z', fill: COL[c].hex, class: 'llk-sector' }));
      }
      var m = pt((a0 + a1) / 2, n === 1 ? 0 : 44);
      root.appendChild(svg('text', { x: m[0], y: m[1] + 7, 'text-anchor': 'middle', class: 'llk-cl', fill: COL[c].ink }, COL[c].letter));
    });
    var tip = pt(35, 52);
    root.appendChild(svg('line', { x1: cx, y1: cy, x2: tip[0], y2: tip[1], class: 'llk-pointer' }));
    root.appendChild(svg('circle', { cx: cx, cy: cy, r: 7, class: 'llk-hub' }));
    return root;
  }

  function caption(s) {
    return s.cols
      .map(function (k) {
        return dot(k.c) + ' <b>' + k.n + '</b> ' + k.c;
      })
      .join(' &nbsp; ');
  }

  function picBox(s) {
    return el('div', { class: 'llk-picbox' }, s.kind === 'bag' ? bagPic(s) : spinPic(s), el('div', { class: 'llk-cap', html: caption(s) }));
  }

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */
  function learnEnds(stage, api) {
    api.lockNext();
    api.say('This line shows how likely things are.', 'happy');
    stage.appendChild(MQ.ui.lesson('How likely is it?', 'Left end: <b>will not happen</b>. Right end: <b>will happen</b>.'));
    var cards = el('div', { class: 'llk-cards' }, card('🌅', 'The sun will rise tomorrow', 'llk-card-bolt'));
    stage.appendChild(cards);
    var line = makeLine();
    stage.appendChild(line.svg);
    var sun = line.marker(0.5, { label: '🌅', cls: 'llk-bolt-m' });
    api.later(function () {
      slide(api, sun, 0.5, 1, 900, function () {
        api.say('The sun will rise for sure. So it goes at the "will happen" end.', 'happy');
        api.later(yourTurn, 2200);
      });
    }, 700);

    function yourTurn() {
      cards.appendChild(card('🐱', 'My cat will drive the school bus', 'llk-card-me'));
      var arrow = line.arrow({ emoji: '🐱', p: 0.55 });
      api.say('Your turn! Drag the orange arrow. Where does the cat go?', 'think');
      dragArrow(api, line, arrow, function (p) {
        if (p <= 0.1) {
          arrow.set(0);
          arrow.lock();
          api.sound('correct');
          api.say('Yes! A cat can never drive a bus. It will not happen.', 'cheer');
          api.feedback('Impossible things go at the left end: "will not happen".', 'good');
          api.unlockNext();
        } else if (p >= 0.9) {
          api.sound('wrong');
          api.feedback('That end is "will happen". Can a cat really drive a bus?', 'try');
        } else {
          api.feedback('Could a cat ever drive a bus? Never! Keep going, all the way to the end.', 'try');
        }
      });
    }
  }

  function learnMiddle(stage, api) {
    api.lockNext();
    api.say('A coin lands heads or tails. Both are just as likely.', 'happy');
    stage.appendChild(MQ.ui.lesson('An even chance', 'Heads is 1 out of 2. That is the <b>middle</b> of the line.'));
    var cards = el('div', { class: 'llk-cards' }, card('🪙', 'A coin lands on heads', 'llk-card-bolt'));
    stage.appendChild(cards);
    var line = makeLine();
    stage.appendChild(line.svg);
    line.parts(coinParts('heads'), 1);
    var coin = line.marker(1, { label: '🪙', cls: 'llk-bolt-m' });
    api.later(function () {
      slide(api, coin, 1, 0.5, 800, function () {
        api.say('2 equal parts: heads and tails. Heads goes 1 part along: the middle!', 'happy');
        api.later(yourTurn, 2400);
      });
    }, 700);

    function yourTurn() {
      line.parts([], 0);
      cards.appendChild(card('🌧️', 'It will rain tomorrow', 'llk-card-me'));
      var arrow = line.arrow({ emoji: '🌧️', p: 0 });
      arrow.start = -1; // any drag counts as a move
      api.say('Will it rain tomorrow? It might! Drag the arrow to where you think.', 'think');
      dragArrow(api, line, arrow, function (p) {
        if (p > END && p < 1 - END) {
          arrow.lock();
          api.sound('correct');
          var other = U.clamp(p + (p < 0.5 ? 0.17 : -0.17), 0.12, 0.88);
          line.marker(other, { label: '🧑', cls: 'llk-other-m' });
          api.say('Good! Rain might happen, so it goes in between.', 'cheer');
          api.feedback('A grown-up might put it here instead (the grey pin). That is fine: nobody knows the weather for sure!', 'good');
          api.unlockNext();
        } else {
          api.feedback('Rain might happen, or might not. So it does not go at an end. Drag it in between.', 'try');
        }
      });
    }
  }

  function learnGame(stage, api) {
    api.lockNext();
    api.say('Let\'s play! I hide an arrow. You guess where it is.', 'happy');
    stage.appendChild(MQ.ui.lesson('Guess my arrow!', 'Land inside the green band to win a star.'));
    var stars = el('div', { class: 'llk-stars' }, '☆ ☆');
    stage.appendChild(stars);
    var holder = el('div', { class: 'llk-holder' });
    stage.appendChild(holder);
    var bag = { kind: 'bag', cols: [{ c: 'red', n: 3 }, { c: 'blue', n: 1 }], pick: 'red' };
    var rounds = [
      { emoji: '🪙', text: 'A coin lands on tails', t: 0.5, parts: coinParts('tails'), count: 1, why: 'Tails is 1 out of 2: the middle.' },
      { emoji: '🎯', text: 'I pick a <b>red</b> counter without looking', t: 0.75, setup: bag, parts: partsOf(bag), count: 3, why: '3 out of 4 counters are red: 3 of the 4 parts along.' },
    ];
    var won = 0;

    function play() {
      MQ.clear(holder);
      if (won >= rounds.length) {
        stars.textContent = '⭐ ⭐';
        api.sound('star');
        api.say('Two stars! Play this game with your grown-up too.', 'cheer');
        api.feedback('Take turns: one says an event, the other guesses where the arrow goes.', 'good');
        api.unlockNext();
        return;
      }
      var r = rounds[won];
      var top = el('div', { class: 'llk-row' });
      if (r.setup) top.appendChild(picBox(r.setup));
      top.appendChild(card(r.emoji, r.text, 'llk-card-bolt'));
      holder.appendChild(top);
      var line = makeLine();
      holder.appendChild(line.svg);
      var arrow = line.arrow({ emoji: '❓', p: 0.12 });
      dragArrow(api, line, arrow);
      var btn = el('button', { class: 'btn llk-btn' }, 'Guess!');
      holder.appendChild(btn);
      api.say(won === 0 ? 'My event: a coin lands on tails. Where is my arrow?' : 'Now: I pick red from this bag. Where is my arrow?', 'think');
      btn.onclick = function () {
        if (btn.dataset.done === 'again') return play();
        if (btn.dataset.done === 'next') {
          won++;
          return play();
        }
        if (!arrow.moved) {
          api.feedback('Drag the orange arrow along the line first.', 'info');
          return;
        }
        arrow.lock();
        line.band(r.t);
        line.parts(r.parts, r.count);
        line.marker(r.t, { label: '🤖', cls: 'llk-bolt-m' });
        if (isClose(arrow.p, r.t)) {
          api.sound('star');
          stars.textContent = won === 0 ? '⭐ ☆' : '⭐ ⭐';
          api.say('In the green band! A star for you!', 'cheer');
          api.feedback(r.why, 'good');
          btn.textContent = won === rounds.length - 1 ? 'Finish the game' : 'Next round ▶';
          btn.dataset.done = 'next';
        } else {
          api.sound('wrong');
          api.say('Not in the green band this time.', 'oops');
          api.feedback(r.why + ' Have another go!', 'try');
          btn.textContent = 'Try again';
          btn.dataset.done = 'again';
        }
      };
    }
    play();
  }

  /* ---------------------------------------------------------------- *
   * Practice
   * ---------------------------------------------------------------- */
  function placeQuestion(stage, api, q) {
    var s = q.setup;
    if (s) {
      api.say(s.kind === 'bag' ? 'I pick one counter without looking. Where does it go?' : 'I spin once. Where does it go on the line?', 'think');
      stage.appendChild(MQ.ui.prompt('Drag the arrow to where this goes.'));
      var row = el('div', { class: 'llk-row' }, picBox(s), card('🎯', s.kind === 'bag' ? 'I pick ' + dot(s.pick) + ' <b>' + s.pick + '</b>' : 'It lands on ' + dot(s.pick) + ' <b>' + s.pick + '</b>', 'llk-card-me'));
      stage.appendChild(row);
    } else {
      api.say('Is it sure, impossible, or in between? Drag the arrow.', 'think');
      stage.appendChild(MQ.ui.prompt('Drag the arrow to where this goes.'));
      stage.appendChild(card(q.ev.e, q.ev.t, 'llk-card-me llk-card-big'));
    }
    var line = makeLine();
    stage.appendChild(line.svg);
    var arrow = line.arrow({ emoji: s ? '🎯' : q.ev.e, p: q.start });
    dragArrow(api, line, arrow);
    var btn = el('button', { class: 'btn llk-btn' }, 'Check ✓');
    stage.appendChild(btn);
    var partsList = s ? partsOf(s) : q.cat === 'even' ? coinParts(q.ev.face) : null;
    var partsCount = s ? countOf(s, s.pick) : 1;

    function showAnswer() {
      arrow.lock();
      btn.disabled = true;
      line.band(q.t);
      if (partsList) line.parts(partsList, partsCount);
      line.marker(q.t, { label: '✓', cls: 'llk-ans' });
    }

    btn.onclick = function () {
      if (api.isAnswered()) return;
      if (!arrow.moved) {
        api.feedback('Drag the orange arrow along the line first.', 'info');
        return;
      }
      var p = arrow.p;
      if (isClose(p, q.t)) {
        showAnswer();
        api.check(true, praise(q));
        return;
      }
      var tag = classify(q.t, p);
      var second = api.tries() >= 1;
      if (partsList) line.ticks(partsList.length); // equal parts as a help
      api.check(false, placeHint(tag, q, second), tag);
    };

    api.onReveal(function () {
      showAnswer();
      api.feedback(work(q), 'info');
    });
  }

  function compareQuestion(stage, api, q) {
    var s = q.setup;
    var A = s.cols[0];
    var B = s.cols[1];
    api.say('I pick one counter. Which colour is more likely?', 'think');
    stage.appendChild(MQ.ui.prompt('Which goes nearer <b>"will happen"</b>?'));
    stage.appendChild(picBox(s));
    var line = makeLine();
    var ch = MQ.ui.choices(
      [
        { label: dot(A.c) + ' I pick ' + A.c, value: A.c },
        { label: dot(B.c) + ' I pick ' + B.c, value: B.c },
        { label: '= The same place', value: 'same' },
      ],
      function (v) {
        if (api.isAnswered()) return;
        if (v === q.answer) {
          ch.mark(v, 'good');
          ch.disable();
          showAnswer();
          api.check(true, q.answer === 'same' ? 'Yes! ' + A.n + ' and ' + B.n + ': the same chance, the same place.' : 'Yes! More ' + q.answer + ' counters, so ' + q.answer + ' is more likely.');
          return;
        }
        ch.mark(v, 'bad');
        var second = api.tries() >= 1;
        var big = A.n > B.n ? A : B;
        var small = A.n > B.n ? B : A;
        var countSay = 'Count them: ' + A.n + ' ' + A.c + ' and ' + B.n + ' ' + B.c + '. ';
        if (q.answer === 'same') {
          api.check(false, second ? countSay + 'The same number, so the same chance and the same place.' : 'Count each colour. Is there more of one?', TAG.counts);
        } else if (v === 'same') {
          api.check(false, second ? countSay + cap(big.c) + ' has more, so ' + big.c + ' is nearer "will happen".' : 'Count each colour. Are they really the same?', TAG.counts);
        } else {
          api.check(false, second ? countSay + cap(big.c) + ' has more, so ' + big.c + ' is nearer "will happen".' : 'There are fewer ' + small.c + '. Fewer counters means less likely.', TAG.fewer);
        }
      },
      { columns: 3 }
    );
    stage.appendChild(ch);
    stage.appendChild(line.svg);
    line.svg.classList.add('llk-faded');

    function showAnswer() {
      line.svg.classList.remove('llk-faded');
      var n = totalOf(s);
      var sa = { kind: s.kind, cols: s.cols, pick: big().c };
      line.parts(partsOf(sa), 0);
      if (A.n === B.n) {
        line.marker(0.5, { label: '=', cls: 'llk-ans' });
        return;
      }
      line.marker(A.n / n, { label: COL[A.c].letter, hex: COL[A.c].hex, cls: 'llk-col-m' });
      line.marker(B.n / n, { label: COL[B.c].letter, hex: COL[B.c].hex, cls: 'llk-col-m' });
    }
    function big() {
      return A.n >= B.n ? A : B;
    }

    api.onReveal(function () {
      ch.mark(q.answer, 'good');
      ch.disable();
      showAnswer();
      var n = totalOf(s);
      var w = A.n + ' out of ' + n + ' are ' + A.c + ', ' + B.n + ' out of ' + n + ' are ' + B.c + '. ';
      w += q.answer === 'same' ? 'The same number, so they go in the same place: the middle.' : cap(q.answer) + ' has more, so ' + q.answer + ' sits nearer "will happen".';
      api.feedback(w, 'info');
    });
  }

  function chooseQuestion(stage, api, q) {
    var s = q.setup;
    var right = q.options.filter(function (o) {
      return isClose(o.t, q.arrow);
    })[0];
    api.say('Here is my arrow. Which one goes there?', 'think');
    stage.appendChild(MQ.ui.prompt('Which one fits <b>my arrow</b>?'));
    if (s) stage.appendChild(picBox(s));
    var line = makeLine();
    stage.appendChild(line.svg);
    line.arrow({ emoji: '🤖', p: q.arrow, cls: 'llk-bolt' }).lock();
    var ch = MQ.ui.choices(
      q.options.map(function (o, i) {
        return { label: (o.c ? dot(o.c) + ' ' : o.e ? '<span class="llk-opt-ic">' + o.e + '</span> ' : '') + o.text, value: String(i) };
      }),
      function (v) {
        if (api.isAnswered()) return;
        var o = q.options[+v];
        if (o === right) {
          ch.mark(v, 'good');
          ch.disable();
          if (s) line.parts(partsOf({ kind: s.kind, cols: s.cols, pick: q.target }), countOf(s, q.target));
          api.check(true, 'Yes! That one fits my arrow.');
          return;
        }
        ch.mark(v, 'bad');
        var second = api.tries() >= 1;
        api.check(false, chooseHint(q, o, second, line), classify(o.t, q.arrow));
      },
      { columns: 1 }
    );
    ch.classList.add('llk-choices');
    stage.appendChild(ch);

    api.onReveal(function () {
      ch.mark(String(q.options.indexOf(right)), 'good');
      ch.disable();
      if (s) line.parts(partsOf({ kind: s.kind, cols: s.cols, pick: q.target }), countOf(s, q.target));
      var w;
      if (s) {
        var n = totalOf(s);
        var k = countOf(s, q.target);
        w = k + ' out of ' + n + ' counters are ' + q.target + '. Split the line into ' + n + ' parts: my arrow is ' + k + ' of the ' + n + ' parts along.';
      } else if (q.arrow === 0) w = 'My arrow is at "will not happen". "' + right.text + '" can never happen.';
      else if (q.arrow === 1) w = 'My arrow is at "will happen". "' + right.text + '" is sure to happen.';
      else w = 'My arrow is in the middle: an even chance. A coin is heads or tails, 1 out of 2.';
      api.feedback(w, 'info');
    });
  }

  function chooseHint(q, o, second, line) {
    var s = q.setup;
    if (s) {
      line.ticks(totalOf(s));
      var A = s.cols[0];
      var B = s.cols[1];
      if (second) return 'Count: ' + A.n + ' ' + A.c + ' and ' + B.n + ' ' + B.c + '. I split the line into ' + totalOf(s) + ' parts. How many parts along is my arrow?';
      if (o.t === 0) return 'Can you pick ' + o.c + '? There is none, so that goes at "will not happen". My arrow is not at an end.';
      if (o.t === 1) return 'That is sure to happen, so it goes at "will happen". My arrow is not at an end.';
      return q.arrow > 0.5 ? 'My arrow is past the middle, nearer "will happen". Which colour is there more of?' : 'My arrow is before the middle, nearer "will not happen". Which colour is there less of?';
    }
    var what = o.t === 1 ? '"' + o.text + '" is sure to happen.' : o.t === 0 ? '"' + o.text + '" can never happen.' : '"' + o.text + '" might happen: an even chance.';
    if (q.arrow === 0) return second ? what + ' Look for the one that can never happen.' : 'My arrow is at "will not happen". Which one can never happen?';
    if (q.arrow === 1) return second ? what + ' Look for the one that is sure to happen.' : 'My arrow is at "will happen". Which one is sure to happen?';
    return second ? what + ' Look for the one that is half and half.' : 'My arrow is in the middle: an even chance, like heads or tails.';
  }

  /* ---------------------------------------------------------------- */
  var deck = null;

  MQ.register(ID, {
    learn: [learnEnds, learnMiddle, learnGame],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'place') return placeQuestion(stage, api, q);
        if (q.type === 'compare') return compareQuestion(stage, api, q);
        return chooseQuestion(stage, api, q);
      },
    },
  });

  // Hooks for automated tests only (not used by the page).
  MQ.activities[ID]._test = {
    buildDeck: buildDeck,
    classify: classify,
    TOL: TOL,
    TAG: TAG,
  };

  var css = [
    '.llk-svg{width:100%;max-width:780px;height:auto;display:block;user-select:none;-webkit-user-select:none}',
    '.llk-faded{opacity:.35}',
    '.llk-track{fill:#cfd8e3}',
    '.llk-end{fill:#7b8794}',
    '.llk-end-yes{fill:#1f9d6b}',
    '.llk-end-no{fill:#b23a48}',
    '.llk-mid{fill:#7b8794}',
    '.llk-lbl{font-size:22px;font-weight:800;fill:var(--ink)}',
    '.llk-lbl-no{fill:#9b2c3a}',
    '.llk-lbl-yes{fill:#167a52}',
    '.llk-lbl-mid{fill:#52606d}',
    '.llk-hit{fill:transparent;cursor:grab;outline:none}',
    '.llk-hit:focus-visible{stroke:var(--accent);stroke-width:3;stroke-dasharray:6 6}',
    '.llk-band{fill:rgba(31,157,107,.22);stroke:#1f9d6b;stroke-width:2;stroke-dasharray:6 4}',
    '.llk-tick{fill:#1f2933}',
    '.llk-part{stroke:#fff;stroke-width:1}',
    '.llk-partnum{font-size:17px;font-weight:800;fill:#1f2933}',
    '.llk-arrow{pointer-events:none}',
    '.llk-me rect,.llk-me polygon{fill:#f77f00}',
    '.llk-me circle{fill:#fff;stroke:#f77f00;stroke-width:5}',
    '.llk-bolt rect,.llk-bolt polygon{fill:#3a86ff}',
    '.llk-bolt circle{fill:#fff;stroke:#3a86ff;stroke-width:5}',
    '.llk-emo{font-size:26px}',
    '.llk-emo-s{font-size:20px;font-weight:800;fill:#1f2933}',
    '.llk-marker{pointer-events:none}',
    '.llk-marker polygon,.llk-marker rect{fill:#3a86ff}',
    '.llk-marker circle{fill:#fff;stroke:#3a86ff;stroke-width:4}',
    '.llk-ans polygon,.llk-ans rect{fill:#1f9d6b}',
    '.llk-ans circle{stroke:#1f9d6b}',
    '.llk-ans text{fill:#1f9d6b;font-size:24px}',
    '.llk-other-m polygon,.llk-other-m rect{fill:#9aa5b1}',
    '.llk-other-m circle{stroke:#9aa5b1}',
    '.llk-cards{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;width:100%}',
    '.llk-card{display:inline-flex;align-items:center;gap:10px;background:#fff;border:3px solid var(--line);border-radius:16px;padding:8px 16px;font-size:1.25rem;font-weight:800;max-width:100%;box-sizing:border-box}',
    '.llk-card-me{border-color:#f77f00}',
    '.llk-card-bolt{border-color:#3a86ff}',
    '.llk-card-big{font-size:1.45rem;padding:12px 22px}',
    '.llk-card-ic{font-size:2rem;line-height:1}',
    '.llk-row{display:flex;flex-wrap:wrap;gap:16px;align-items:center;justify-content:center;width:100%}',
    '.llk-holder{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.llk-picbox{display:flex;flex-direction:column;align-items:center;gap:2px}',
    '.llk-pic{width:170px;max-width:100%;height:auto}',
    '.llk-cap{font-size:1.1rem}',
    '.llk-bag{fill:#f3e6cc;stroke:#a7834f;stroke-width:4}',
    '.llk-bag-tie{fill:#a7834f}',
    '.llk-counter{stroke:#1f2933;stroke-width:1.5}',
    '.llk-cl{font-size:19px;font-weight:800}',
    '.llk-sector{stroke:#fff;stroke-width:3}',
    '.llk-pointer{stroke:#1f2933;stroke-width:6;stroke-linecap:round}',
    '.llk-hub{fill:#1f2933}',
    '.llk-dot{display:inline-block;width:.9em;height:.9em;border-radius:50%;vertical-align:-.1em;border:1.5px solid #1f2933}',
    '.llk-stars{font-size:2rem;letter-spacing:4px}',
    '.llk-btn{font-size:1.2rem;min-width:160px}',
    '.llk-opt-ic{font-size:1.4rem}',
    '.llk-choices{max-width:620px}',
    '@media (max-width:700px){.llk-card{font-size:1.05rem}.llk-pic{width:130px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

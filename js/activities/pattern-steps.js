/* Pattern Steps — grow and shrink patterns by a constant amount (Unit 17.2).
 * Every pattern is drawn as groups of everyday objects, written as number sentences
 * and shown as equal jumps on a number track (repeated adding, not times-table recall).
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  /* ------------------------------------------------------------------ *
   * Objects
   * ------------------------------------------------------------------ */
  var KINDS = {
    apple: { one: 'apple', many: 'apples', pitch: 22 },
    button: { one: 'button', many: 'buttons', pitch: 22 },
    pencil: { one: 'pencil', many: 'pencils', pitch: 22 },
    cupcake: { one: 'cupcake', many: 'cupcakes', pitch: 24 },
    block: { one: 'block', many: 'blocks', pitch: 22 },
    dot: { one: 'dot', many: 'dots', pitch: 20 },
    tree: { one: 'triangle', many: 'triangles', pitch: 26 },
    house: { one: 'house', many: 'houses', pitch: 30 },
  };

  function word(kind, n) {
    return n === 1 ? KINDS[kind].one : KINDS[kind].many;
  }

  // One object, centred on (x, y), about p units across. Each counted object has class pst-item.
  function glyph(kind, x, y, p) {
    var k = p / 22;
    var g = S('g', { class: 'pst-item', transform: 'translate(' + x + ',' + y + ') scale(' + k + ')' });
    if (kind === 'apple') {
      g.appendChild(S('circle', { cx: 0, cy: 1.5, r: 8.5, fill: '#e63946', stroke: '#a4161a', 'stroke-width': 1.5 }));
      g.appendChild(S('line', { x1: 0, y1: -6, x2: 1.5, y2: -10.5, stroke: '#6b4226', 'stroke-width': 2, 'stroke-linecap': 'round' }));
      g.appendChild(S('ellipse', { cx: 5, cy: -9, rx: 3.6, ry: 2, fill: '#52b043' }));
    } else if (kind === 'button') {
      g.appendChild(S('circle', { cx: 0, cy: 0, r: 9, fill: '#4ea8de', stroke: '#1d5f8a', 'stroke-width': 1.5 }));
      [[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]].forEach(function (h) {
        g.appendChild(S('circle', { cx: h[0], cy: h[1], r: 1.6, fill: '#e8f4fb' }));
      });
    } else if (kind === 'pencil') {
      g.appendChild(S('rect', { x: -3.5, y: -11, width: 7, height: 3.5, rx: 1, fill: '#f497b6', stroke: '#8a4b2a', 'stroke-width': 1 }));
      g.appendChild(S('rect', { x: -3.5, y: -7.5, width: 7, height: 12.5, fill: '#ffbe0b', stroke: '#8a4b2a', 'stroke-width': 1 }));
      g.appendChild(S('polygon', { points: '-3.5,5 3.5,5 0,11.5', fill: '#f4d6a0', stroke: '#8a4b2a', 'stroke-width': 1 }));
      g.appendChild(S('polygon', { points: '-1.2,9.3 1.2,9.3 0,11.5', fill: '#333' }));
    } else if (kind === 'cupcake') {
      g.appendChild(S('ellipse', { cx: 0, cy: -1.5, rx: 9, ry: 7, fill: '#ffafcc', stroke: '#c9184a', 'stroke-width': 1.2 }));
      g.appendChild(S('polygon', { points: '-8.5,1 8.5,1 6,10 -6,10', fill: '#8ecae6', stroke: '#219ebc', 'stroke-width': 1.2 }));
      g.appendChild(S('circle', { cx: 0, cy: -8.5, r: 2.4, fill: '#d62828' }));
    } else if (kind === 'block') {
      g.appendChild(S('rect', { x: -8.5, y: -8.5, width: 17, height: 17, rx: 2, fill: '#90be6d', stroke: '#4f772d', 'stroke-width': 1.5 }));
    } else if (kind === 'dot') {
      g.appendChild(S('circle', { cx: 0, cy: 0, r: 7.5, fill: '#2a9d8f', stroke: '#1d6b62', 'stroke-width': 1.5 }));
    } else if (kind === 'house') {
      g.appendChild(S('rect', { x: -7.5, y: -1, width: 15, height: 11, fill: '#f4a261', stroke: '#9c4a1a', 'stroke-width': 1.3 }));
      g.appendChild(S('polygon', { points: '-10,-1 10,-1 0,-11', fill: '#bc6c25', stroke: '#6f3b10', 'stroke-width': 1.3 }));
      g.appendChild(S('rect', { x: -2, y: 4, width: 4, height: 6, fill: '#6f3b10' }));
    }
    return g;
  }

  // Where the objects of one group sit (in pitch units), so small groups are easy to count.
  var POS = {
    1: [[0, 0]],
    2: [[-0.55, 0], [0.55, 0]],
    3: [[-0.55, -0.5], [0.55, -0.5], [0, 0.5]],
    4: [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]],
    5: [[-0.66, -0.66], [0.66, -0.66], [0, 0], [-0.66, 0.66], [0.66, 0.66]], // like the 5 on a dice
    6: [[-1, -0.55], [0, -0.55], [1, -0.55], [-1, 0.55], [0, 0.55], [1, 0.55]],
  };

  // A little tree: up to 2 triangles stacked (each triangle is one counted object) and a trunk.
  function tree(x, y, triangles, p) {
    var k = p / 26;
    var g = S('g', { transform: 'translate(' + x + ',' + y + ') scale(' + k + ')' });
    g.appendChild(S('rect', { x: -2, y: 9, width: 4, height: 6, fill: '#8d5a2b' }));
    g.appendChild(S('polygon', { class: 'pst-item', points: '-10,10 10,10 0,-5', fill: '#52b043', stroke: '#2d6a1f', 'stroke-width': 1.5 }));
    if (triangles > 1) g.appendChild(S('polygon', { class: 'pst-item', points: '-8.5,1 8.5,1 0,-14', fill: '#74c365', stroke: '#2d6a1f', 'stroke-width': 1.5 }));
    return g;
  }

  function cluster(kind, n, cx, cy, p) {
    var g = S('g', {});
    if (kind === 'tree') {
      var trees = Math.ceil(n / 2);
      for (var t = 0; t < trees; t++) {
        var tx = cx + (t - (trees - 1) / 2) * p * 0.9;
        g.appendChild(tree(tx, cy, Math.min(2, n - 2 * t), trees > 2 ? p * 0.8 : p));
      }
      return g;
    }
    (POS[Math.min(n, 6)] || []).forEach(function (o) {
      g.appendChild(glyph(kind, cx + o[0] * p, cy + o[1] * p, p));
    });
    return g;
  }

  /**
   * A picture of one step: a row of group boxes. groups = [{n, role}], role is
   * 'start' | 'add' | 'new' | 'ghost' (empty dashed box) | 'ask' (box with "?").
   * data-total holds the number of objects drawn.
   */
  function stepSvg(kind, groups, maxCols) {
    var p = KINDS[kind].pitch;
    var cell = Math.round(p * 2.6 + 10);
    var gap = 6;
    var pad = 3;
    var cols = Math.min(groups.length, maxCols || 3);
    var rows = Math.ceil(groups.length / cols);
    var w = pad * 2 + cols * cell + (cols - 1) * gap;
    var h = pad * 2 + rows * cell + (rows - 1) * gap;
    var total = 0;
    var root = S('svg', { viewBox: '0 0 ' + w + ' ' + h, width: w, height: h, class: 'pst-pic' });
    groups.forEach(function (gr, i) {
      var x = pad + (i % cols) * (cell + gap);
      var y = pad + Math.floor(i / cols) * (cell + gap);
      root.appendChild(S('rect', { x: x, y: y, width: cell, height: cell, rx: 12, class: 'pst-grp pst-grp-' + gr.role }));
      if (gr.n > 0 && gr.role !== 'ghost' && gr.role !== 'ask') {
        root.appendChild(cluster(kind, gr.n, x + cell / 2, y + cell / 2, p));
        total += gr.n;
      } else if (gr.role === 'ghost' || gr.role === 'ask') {
        root.appendChild(S('text', { x: x + cell / 2, y: y + cell / 2 + 10, 'text-anchor': 'middle', class: 'pst-ghost-txt' }, gr.role === 'ask' ? '?' : '+'));
      }
    });
    root.setAttribute('data-total', total);
    return root;
  }

  // Groups for step i (0-based) of a growing pattern: the start group, then i added groups.
  function growGroups(q, i) {
    var gs = [{ n: q.s, role: 'start' }];
    for (var j = 0; j < i; j++) gs.push({ n: q.c, role: 'add' });
    return gs;
  }

  function term(q, i) {
    return q.s + i * q.c;
  }

  // A tray of rows x cols objects; only the first `left` rows are still full.
  function traySvg(kind, rows, cols, left, pitch, opts) {
    opts = opts || {};
    var pad = 10;
    var side = opts.labels ? 40 : 0;
    var w = cols * pitch + pad * 2 + side;
    var h = rows * pitch + pad * 2;
    var root = S('svg', { viewBox: '0 0 ' + w + ' ' + h, width: w, height: h, class: 'pst-pic' });
    root.appendChild(S('rect', { x: 2, y: 2, width: cols * pitch + pad * 2 - 4, height: h - 4, rx: 12, class: 'pst-tray' }));
    var total = 0;
    for (var r = 0; r < rows; r++) {
      var y = pad + r * pitch;
      var full = r < left;
      root.appendChild(S('rect', { x: pad - 3, y: y + 2, width: cols * pitch + 6, height: pitch - 4, rx: 8, class: full ? 'pst-row' : 'pst-row-gone' }));
      for (var c = 0; c < cols; c++) {
        var cx = pad + c * pitch + pitch / 2;
        var cy = y + pitch / 2;
        if (full) {
          root.appendChild(glyph(kind, cx, cy, pitch * 0.82));
          total++;
        } else {
          root.appendChild(S('circle', { cx: cx, cy: cy, r: pitch * 0.32, class: 'pst-slot' }));
        }
      }
      if (!full && opts.labels) root.appendChild(S('text', { x: cols * pitch + pad * 2 + 4, y: y + pitch / 2 + 5, class: 'pst-gone-label' }, '− ' + cols));
    }
    root.setAttribute('data-total', total);
    return root;
  }

  function card(title, pic, sentHtml, cls) {
    var sent = el('div', { class: 'pst-sent', html: sentHtml || '' });
    var c = el('div', { class: 'pst-card' + (cls ? ' ' + cls : '') }, el('div', { class: 'pst-card-title' }, title), pic, sent);
    c.sent = sent;
    return c;
  }

  function growSent(q, i) {
    if (i === 0) return '<b>' + q.s + '</b>';
    return term(q, i - 1) + ' <span class="pst-const">+ ' + q.c + '</span> = <b>' + term(q, i) + '</b>';
  }

  function shrinkSent(start, c, i) {
    if (i === 0) return '<b>' + start + '</b>';
    return start - (i - 1) * c + ' <span class="pst-const">− ' + c + '</span> = <b>' + (start - i * c) + '</b>';
  }

  /* ------------------------------------------------------------------ *
   * Number track with jump arcs
   * ------------------------------------------------------------------ */
  function track(max) {
    var W = 720;
    var L = 22;
    var R = W - 22;
    var Y = 60;
    var H = 92;
    var unit = (R - L) / max;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'pst-track' + (max > 20 ? ' pst-dense' : '') });
    function x(n) {
      return L + n * unit;
    }
    root.appendChild(S('line', { x1: L, y1: Y, x2: R, y2: Y, class: 'pst-track-line' }));
    var labels = {};
    for (var n = 0; n <= max; n++) {
      root.appendChild(S('line', { x1: x(n), y1: Y - 6, x2: x(n), y2: Y + 6, class: 'pst-tick' }));
      labels[n] = S('text', { x: x(n), y: Y + 25, 'text-anchor': 'middle', class: 'pst-tick-num' }, String(n));
      root.appendChild(labels[n]);
    }
    var arcs = S('g', {});
    var marks = S('g', {});
    root.appendChild(arcs);
    root.appendChild(marks);
    return {
      el: root,
      max: max,
      jump: function (a, b, label, cls) {
        var xa = x(a);
        var xb = x(b);
        var mid = (xa + xb) / 2;
        var top = Y - 4 - 44;
        var g = S('g', { class: 'pst-jump ' + (cls || '') });
        g.appendChild(S('path', { d: 'M' + xa + ' ' + (Y - 4) + ' Q' + mid + ' ' + top + ' ' + xb + ' ' + (Y - 4), class: 'pst-arc' }));
        g.appendChild(S('text', { x: mid, y: (Y - 4 + top) / 2 - 5, 'text-anchor': 'middle', class: 'pst-arc-label' }, label));
        arcs.appendChild(g);
        return g;
      },
      mark: function (n, cls) {
        marks.appendChild(S('circle', { cx: x(n), cy: Y, r: 7, class: 'pst-mark ' + (cls || '') }));
        if (labels[n]) labels[n].classList.add('pst-tick-on');
      },
      clearHints: function () {
        Array.prototype.slice.call(arcs.querySelectorAll('.pst-jump-hint')).forEach(function (h) {
          h.parentNode.removeChild(h);
        });
      },
    };
  }

  function trackMax(n) {
    return Math.max(10, Math.ceil((n + 1) / 5) * 5);
  }

  // "first op c op c ... = total" as chips: repeated adding or taking away.
  function chainRow(first, op, c, k, total) {
    var row = el('div', { class: 'sum-row pst-chain' });
    row.appendChild(el('span', { class: 'chip' }, String(first)));
    for (var i = 0; i < k; i++) {
      row.appendChild(el('span', { class: 'sum-op' }, op));
      row.appendChild(el('span', { class: 'chip pst-chip-c' }, String(c)));
    }
    row.appendChild(el('span', { class: 'sum-op' }, '='));
    row.appendChild(el('span', { class: 'chip chip-total' }, String(total)));
    return row;
  }

  /* ------------------------------------------------------------------ *
   * Mistake diagnosis
   * ------------------------------------------------------------------ */
  var TAG = {
    stepNo: 'Added the step number, not the constant',
    constTotal: 'Gave the constant instead of the total',
    totalConst: 'Gave the total instead of the constant',
    one: 'Added 1 instead of the constant',
    start: 'Started from the wrong number',
    none: 'Did not add the constant',
    extra: 'Added one jump too many',
    down: 'Went down instead of up',
    slip: 'Counting-on slip',
    spot: 'Did not spot the constant',
    two: 'Gave two jumps instead of one',
    house: 'Counted shapes, not houses (the constant is a group)',
    startConst: 'Gave the start instead of the constant',
    steps: 'Counted the wrong number of steps',
    stepsNotC: 'Took away the number of steps, not the constant',
    early: 'Did not shorten all the way to 0',
    past: 'Went past 0 when shortening',
    oneAway: 'Took away 1 each time, not the constant',
    constSteps: 'Gave the constant instead of the number of steps',
    back: 'Counting-back slip',
    added: 'Added instead of taking away',
  };

  // Wrong total for "what comes next" in a growing pattern.
  function diagNext(o, v) {
    // o = { s, c, last, stepNo, ans }
    if (v === o.c) return { tag: TAG.constTotal, hint: o.c + ' is how many we add each step. Now add it on: ' + o.last + ' + ' + o.c + ' = ?' };
    if (v === o.last + o.stepNo && o.stepNo !== o.c) return { tag: TAG.stepNo, hint: 'This is step ' + o.stepNo + ', but we do not add ' + o.stepNo + '. Every step adds the same amount: ' + o.c + '.' };
    if (v === o.last + 1 && o.c !== 1) return { tag: TAG.one, hint: 'You added 1. Look at the pictures: each step has ' + o.c + ' more, not 1.' };
    if (v === o.last) return { tag: TAG.none, hint: 'That is the same as the last step. The next step has ' + o.c + ' more.' };
    if (o.s !== o.c && v === o.c * o.stepNo) return { tag: TAG.start, hint: 'This pattern starts at ' + o.s + ', not at ' + o.c + '. Count on from the last step: ' + o.last + '.' };
    if (v === o.ans + o.c) return { tag: TAG.extra, hint: 'That is one jump too many. The next step is just one jump of ' + o.c + ' after ' + o.last + '.' };
    if (v < o.last) return { tag: TAG.down, hint: 'This pattern grows, so the next step is more than ' + o.last + '.' };
    return { tag: TAG.slip, hint: 'Start at ' + o.last + ' and count on ' + o.c + ' more.' };
  }

  // Wrong "goes up in …" chip for a growing pattern.
  function diagConst(o, v) {
    if (v === o.last) return { tag: TAG.totalConst, hint: o.last + ' is how many are in the last step. The constant is how many are <b>added</b> each step.' };
    if (v === 1 && o.c !== 1) return { tag: TAG.one, hint: o.dots ? 'Each new group is more than 1 dot. Count the dots in one new group.' : 'Count what is new in each step. It is more than 1.' };
    if (v === 2 * o.c) return { tag: TAG.two, hint: v + ' is two jumps. Look from one step to the very next step.' };
    if (v === o.c + 1) return { tag: TAG.spot, hint: 'Look at two steps side by side. How many more are in the second one?' };
    return { tag: TAG.spot, hint: 'Look at the sentences: what is added every time?' };
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  var TRAYS = [
    { kind: 'cupcake', rows: 4, cols: 4 }, // 16 by 4
    { kind: 'button', rows: 4, cols: 5 }, // 20 by 5
    { kind: 'apple', rows: 4, cols: 3 }, // 12 by 3
  ];

  function sig(q) {
    return [q.type, q.kind, q.s, q.c, q.n, q.k, q.rows, q.cols].join('|');
  }

  function buildDeck() {
    var deck = [];
    var seen = {};
    function add(q) {
      seen[sig(q)] = true;
      deck.push(q);
    }

    // Level 1: constant 1 or 2, start 1-4, next step is at most step 4, totals up to 12.
    var kinds1 = U.shuffle(['apple', 'button', 'pencil', 'cupcake', 'block']);
    var cs = U.shuffle([1, 2, 1, 2]);
    var usedTree = false;
    var combos = {};
    cs.forEach(function (c, i) {
      var q;
      for (var guard = 0; guard < 200; guard++) {
        var s = U.rand(1, 4);
        var n = U.rand(2, 3);
        if (combos[c + '-' + s + '-' + n]) continue;
        if (s === c && n === 2 && Math.random() < 0.6) continue; // prefer a start that is not the constant
        var kind = kinds1[i];
        if (c === 2 && s % 2 === 0 && !usedTree && Math.random() < 0.5) {
          kind = 'tree';
          usedTree = true;
        }
        combos[c + '-' + s + '-' + n] = true;
        q = { type: 'extend', kind: kind, s: s, c: c, n: n, level: 1 };
        break;
      }
      add(q);
    });

    // Level 2: start from the constant; constant 2, 3 or 5; up to 5 steps (totals up to 25).
    var sc = U.pick([2, 3]);
    var l2 = [
      { type: 'sentence', kind: sc === 2 ? U.pick(['button', 'block', 'tree']) : U.pick(['button', 'block', 'apple']), s: sc, c: sc, n: U.rand(3, 4), level: 2 },
      { type: 'extend', kind: 'dot', s: 5, c: 5, n: U.rand(3, 4), chips: true, level: 2 },
      { type: 'house', kind: 'house', s: 3, c: 1, n: 3, level: 2 },
    ];
    U.shuffle(l2).forEach(add);

    // Level 3: shorten to 0, and find the constant then go 3 more steps.
    var t1 = U.pick([TRAYS[1], TRAYS[2]]);
    var t2 = U.pick(TRAYS.filter(function (t) {
      return t !== t1;
    }));
    var fc = U.pick([2, 3, 4].filter(function (c) {
      return c !== sc;
    }));
    var l3 = [
      { type: 'shrinkEmpty', kind: t1.kind, rows: t1.rows, cols: t1.cols, level: 3 },
      { type: 'shrinkMore', kind: t2.kind, rows: t2.rows, cols: t2.cols, k: 2, level: 3 },
      { type: 'findc', kind: U.pick(['apple', 'button', 'block', 'pencil', 'cupcake']), s: fc, c: fc, n: 3, level: 3 },
    ];
    U.shuffle(l3).forEach(add);
    return deck;
  }

  /* ------------------------------------------------------------------ *
   * Practice: growing patterns
   * ------------------------------------------------------------------ */
  function stepCards(q, upto) {
    var row = el('div', { class: 'pst-cards' });
    for (var i = 0; i < upto; i++) row.appendChild(card('Step ' + (i + 1), stepSvg(q.kind, growGroups(q, i)), growSent(q, i)));
    return row;
  }

  function growTrack(q, ans) {
    var tr = track(trackMax(ans));
    tr.mark(q.s, 'pst-mark-start');
    for (var i = 1; i < q.n; i++) {
      tr.jump(term(q, i - 1), term(q, i), '+' + q.c);
      tr.mark(term(q, i));
    }
    return tr;
  }

  // A static "?" card for the next step; .fill() draws it when the answer is known.
  function askCard(q, stepNo, unitWord) {
    var holder = el('div', { class: 'pst-pic-wrap' });
    holder.appendChild(stepSvg(q.kind, growGroups(q, q.n - 1).concat([{ n: 0, role: 'ask' }])));
    var c = card('Step ' + stepNo, holder, term(q, q.n - 1) + ' + ? = ?', 'pst-card-q');
    c.fill = function () {
      MQ.clear(holder);
      holder.appendChild(stepSvg(q.kind, growGroups(q, q.n - 1).concat([{ n: q.c, role: 'new' }])));
      c.sent.innerHTML = growSent(q, q.n);
    };
    return c;
  }

  function renderGrow(stage, api, q) {
    var last = term(q, q.n - 1);
    var ans = term(q, q.n);
    var stepNo = q.n + 1;
    var many = word(q.kind, 2);
    var info = { s: q.s, c: q.c, last: last, stepNo: stepNo, ans: ans, dots: q.kind === 'dot' };
    var done = false;
    var isHouse = q.type === 'house';
    var isFind = q.type === 'findc';
    var needChips = q.chips || isHouse || isFind;
    var finalAns = isFind ? last + 3 * q.c : ans;

    // Prompt + Bolt
    var promptEl = MQ.ui.prompt('');
    stage.appendChild(promptEl);
    var row = stepCards(q, q.n);
    stage.appendChild(row);

    // The next-step card: a build card for 'extend', a "?" card otherwise.
    var added = 0;
    var buildPic = el('div', { class: 'pst-pic-wrap' });
    var buildBtns = null;
    var nextCard;
    function drawBuild() {
      MQ.clear(buildPic);
      buildPic.appendChild(stepSvg(q.kind, growGroups(q, q.n - 1).concat([{ n: added, role: added ? 'new' : 'ghost' }])));
      nextCard.sent.innerHTML = last + ' + ' + (added ? '<span class="pst-const">' + added + '</span>' : '?') + ' = ?';
    }
    if (q.type === 'extend') {
      var plus = el('button', { class: 'btn pst-small', type: 'button', onclick: function () {
        if (done || added >= 6) return;
        added++;
        api.sound('pop');
        drawBuild();
      } }, '+ 1');
      var minus = el('button', { class: 'btn btn-half pst-small', type: 'button', onclick: function () {
        if (done || added <= 0) return;
        added--;
        api.sound('click');
        drawBuild();
      } }, '− 1');
      buildBtns = el('div', { class: 'pst-build-btns' }, minus, plus);
      nextCard = card('Step ' + stepNo, buildPic, '', 'pst-card-q');
      nextCard.appendChild(buildBtns);
      drawBuild();
      nextCard.fill = function () {
        added = q.c;
        drawBuild();
        nextCard.sent.innerHTML = growSent(q, q.n);
        plus.disabled = true;
        minus.disabled = true;
      };
    } else if (!isFind) {
      nextCard = askCard(q, stepNo);
    }
    if (nextCard) row.appendChild(nextCard);

    var tr = growTrack(q, finalAns);
    stage.appendChild(tr.el);

    var answerArea = el('div', { class: 'pst-part' });
    stage.appendChild(answerArea);
    var working = el('div', { class: 'pst-part' });
    stage.appendChild(working);

    function showWorking() {
      MQ.clear(working);
      if (isFind) working.appendChild(chainRow(last, '+', q.c, 3, finalAns));
      else if (isHouse) working.appendChild(chainRow(q.s, '+', q.c, q.n, ans));
      else working.appendChild(chainRow(q.s, '+', q.c, q.n, ans));
    }

    // ----- part 2: the number answer -----
    var box = null;
    var box1 = null;
    var box2 = null;
    function finishGood() {
      done = true;
      if (nextCard && nextCard.fill) nextCard.fill();
      tr.clearHints();
      if (isFind) {
        for (var j = 0; j < 3; j++) tr.jump(last + j * q.c, last + (j + 1) * q.c, '+' + q.c, 'pst-jump-good');
      } else tr.jump(last, ans, '+' + q.c, 'pst-jump-good');
      tr.mark(finalAns, 'pst-mark-good');
      showWorking();
    }

    function hintJumps() {
      tr.clearHints();
      var k = isFind ? 3 : 1;
      for (var j = 0; j < k; j++) tr.jump(last + j * q.c, last + (j + 1) * q.c, '+' + q.c, 'pst-jump-hint');
    }

    function onNumber(v) {
      if (done) return;
      if (v === finalAns) {
        box.good();
        box.disable();
        finishGood();
        api.check(true, isFind ? last + ' + ' + q.c + ' + ' + q.c + ' + ' + q.c + ' = ' + finalAns + '. Brilliant!' : last + ' + ' + q.c + ' = ' + ans + '. Well done!');
        return;
      }
      box.bad();
      var d;
      if (isFind) {
        if (v === last + q.c) d = { tag: TAG.steps, hint: 'That is only 1 more step. We need 3 more steps: + ' + q.c + ', + ' + q.c + ', + ' + q.c + '.' };
        else if (v === last + 2 * q.c) d = { tag: TAG.steps, hint: 'That is 2 more steps. One more jump of ' + q.c + '!' };
        else if (v === last + 4 * q.c) d = { tag: TAG.steps, hint: 'That is 4 more steps, one too many. Make just 3 jumps.' };
        else if (v === last + 3) d = { tag: TAG.stepNo, hint: 'You added 3. But each step adds ' + q.c + ', and we need 3 steps: ' + last + ' + ' + q.c + ' + ' + q.c + ' + ' + q.c + '.' };
        else d = diagNext(info, v);
      } else if (isHouse && v === last + 2) {
        d = { tag: TAG.house, hint: 'Each house is 2 shapes, but we add only 1 <b>house</b> each step.' };
      } else d = diagNext(info, v);
      var hint = d.hint;
      if (api.tries() >= 1) {
        hintJumps();
        hint += isFind ? ' Follow the dashed jumps on the track from ' + last + '.' : ' Look at the dashed jump on the track: start at ' + last + ' and jump ' + q.c + '.';
      }
      api.check(false, hint, d.tag);
    }

    function onBoxes() {
      if (done) return;
      var v1 = U.parseNum(box1.value);
      var v2 = U.parseNum(box2.value);
      if (isNaN(v1) || isNaN(v2)) {
        api.feedback('Write a number in both boxes, then press Check.', 'info');
        (isNaN(v1) ? box1 : box2).focus();
        return;
      }
      if (v1 === q.c && v2 === ans) {
        done = true;
        box1.classList.add('good');
        box2.classList.add('good');
        box1.disabled = box2.disabled = checkBtn.disabled = true;
        finishGood();
        api.check(true, last + ' + ' + q.c + ' = ' + ans + '. The constant is ' + q.c + '!');
        return;
      }
      var d;
      if (v1 !== q.c) {
        box1.classList.add('bad');
        if (v1 === ans || v1 === last) d = { tag: TAG.totalConst, hint: 'The first box is how many we <b>add</b> each step, not how many there are.' };
        else if (v1 === stepNo) d = { tag: TAG.stepNo, hint: 'This is step ' + stepNo + ', but we do not add ' + stepNo + '. Look at the sentences above: what is added every time?' };
        else if (v1 === 1) d = { tag: TAG.one, hint: 'Each step adds more than 1. Look at the sentences above.' };
        else d = { tag: TAG.spot, hint: 'Look at the sentences above: what is added every time?' };
      } else {
        box1.classList.remove('bad');
        box1.classList.add('good');
        box2.classList.add('bad');
        d = diagNext(info, v2);
        d.hint = 'Yes, we add ' + q.c + '! ' + d.hint;
      }
      var hint = d.hint;
      if (api.tries() >= 1) {
        hintJumps();
        hint += ' Look at the dashed jump on the track.';
      }
      api.check(false, hint, d.tag);
    }

    var checkBtn = null;
    function showNumberPart() {
      MQ.clear(answerArea);
      if (q.type === 'sentence') {
        box1 = el('input', { class: 'num-input pst-box', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'how many are added' });
        box2 = el('input', { class: 'num-input pst-box', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'how many in the next step' });
        checkBtn = el('button', { class: 'btn btn-check', type: 'button', onclick: onBoxes }, 'Check');
        [box1, box2].forEach(function (b) {
          b.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
              e.preventDefault();
              onBoxes();
            }
          });
          b.addEventListener('input', function () {
            b.classList.remove('bad');
          });
        });
        answerArea.appendChild(el('div', { class: 'pst-sentq' }, el('span', null, String(last)), el('span', { class: 'pst-op' }, '+'), box1, el('span', { class: 'pst-op' }, '='), box2, checkBtn));
        try {
          box1.focus({ preventScroll: true });
        } catch (e) {}
        return;
      }
      box = MQ.ui.numberInput({ prefix: isFind ? 'After 3 more steps:' : 'Step ' + stepNo + ' has', unit: many, onSubmit: onNumber });
      answerArea.appendChild(box.el);
      box.focus();
    }

    // ----- part 1 (some items): "goes up in …" chips -----
    var chips = null;
    var chipsDone = !needChips;
    function partTwoPrompt() {
      if (isFind) {
        promptEl.innerHTML = 'It goes up in <b>' + q.c + '</b>. How many ' + many + ' after <b>3 more steps</b>?';
        api.say('Now jump on 3 more steps of ' + q.c + '.', 'think');
      } else if (isHouse) {
        promptEl.innerHTML = 'How many <b>houses</b> in step ' + stepNo + '?';
        api.say('One more house each step. How many in step ' + stepNo + '?', 'think');
      } else {
        promptEl.innerHTML = 'Build <b>step ' + stepNo + '</b>, then type how many ' + many + '.';
        api.say('Click + 1 to add ' + q.c + ' ' + word(q.kind, q.c) + ', then type the total.', 'think');
      }
    }

    if (needChips) {
      var opts;
      if (isHouse) {
        promptEl.innerHTML = 'This pattern goes up in …';
        api.say('Each house is a square and a roof. What is added each step?', 'think');
        opts = [1, 2, 3, 5].map(function (v) {
          return { label: v + (v === 1 ? ' house' : ' houses'), value: v };
        });
      } else {
        promptEl.innerHTML = 'This pattern goes up in …';
        api.say(q.kind === 'dot' ? 'Count the dots in each new group. What is added each step?' : 'What is added each step?', 'think');
        var vals = [1, q.c, last, isFind ? q.c + 1 : 2 * q.c];
        opts = U.shuffle(vals).map(function (v) {
          return { label: String(v), value: v };
        });
      }
      chips = MQ.ui.choices(opts, function (v) {
        if (done || chipsDone) return;
        if (v === q.c) {
          chips.mark(v, 'good');
          chips.disable();
          chipsDone = true;
          api.sound('pop');
          api.feedback('Yes! It goes up in ' + q.c + (isHouse ? ' house' : '') + ' every step.', 'good');
          partTwoPrompt();
          showNumberPart();
          return;
        }
        chips.mark(v, 'bad');
        var d;
        if (isHouse) {
          if (v === 2) d = { tag: TAG.house, hint: 'A house is 2 shapes (a square and a roof), but it is still 1 house. Count the new houses.' };
          else if (v === 3) d = { tag: TAG.startConst, hint: '3 is how many houses we start with. How many houses are added each step?' };
          else d = { tag: TAG.totalConst, hint: '5 is how many houses are in step 3. How many are added each step?' };
        } else d = diagConst(info, v);
        var hint = d.hint;
        if (api.tries() >= 1) hint += ' Look at the <span class="pst-const">+</span> boxes under the pictures.';
        api.check(false, hint, d.tag);
      }, { columns: 4 });
      answerArea.appendChild(chips);
    } else {
      if (q.type === 'sentence') {
        promptEl.innerHTML = 'Fill in the boxes for <b>step ' + stepNo + '</b>.';
        api.say('What is added each time? Write it in the first box.', 'think');
      } else partTwoPrompt();
      showNumberPart();
    }

    api.onReveal(function () {
      if (chips && !chipsDone) {
        chips.mark(q.c, 'good');
        chips.disable();
        chipsDone = true;
        partTwoPrompt();
        showNumberPart();
      }
      if (q.type === 'sentence') {
        box1.value = q.c;
        box2.value = ans;
        box1.classList.remove('bad');
        box2.classList.remove('bad');
        box1.classList.add('good');
        box2.classList.add('good');
        box1.disabled = box2.disabled = checkBtn.disabled = true;
      } else {
        box.setValue(finalAns);
        box.good();
        box.disable();
      }
      finishGood();
      var txt = isFind
        ? 'It goes up in ' + q.c + '. 3 more jumps: ' + last + ' + ' + q.c + ' + ' + q.c + ' + ' + q.c + ' = ' + finalAns + '.'
        : 'It goes up in ' + q.c + (isHouse ? ' house' : '') + ' each step. ' + last + ' + ' + q.c + ' = ' + ans + '.';
      api.feedback(txt, 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice: shortening patterns
   * ------------------------------------------------------------------ */
  function renderShrink(stage, api, q) {
    var start = q.rows * q.cols;
    var c = q.cols;
    var many = word(q.kind, 2);
    var done = false;
    var empty = q.type === 'shrinkEmpty';
    var ans = empty ? q.rows : start - q.k * c;

    var promptEl = MQ.ui.prompt('');
    stage.appendChild(promptEl);
    var row = el('div', { class: 'pst-cards' });
    stage.appendChild(row);
    row.appendChild(card(empty ? 'Start' : 'Now', traySvg(q.kind, q.rows, q.cols, q.rows, 28), shrinkSent(start, c, 0)));
    if (empty) row.appendChild(card('Step 1', traySvg(q.kind, q.rows, q.cols, q.rows - 1, 28), shrinkSent(start, c, 1)));
    var tr = track(start);
    stage.appendChild(tr.el);
    tr.mark(start, 'pst-mark-start');
    if (empty) {
      tr.jump(start, start - c, '−' + c, 'pst-jump-back');
      tr.mark(start - c);
    }
    var answerArea = el('div', { class: 'pst-part' });
    stage.appendChild(answerArea);
    var working = el('div', { class: 'pst-part' });
    stage.appendChild(working);

    var box = null;
    var chips = null;
    var chipsDone = !empty;

    function finish() {
      done = true;
      tr.clearHints();
      var steps = empty ? q.rows : q.k;
      for (var j = empty ? 1 : 0; j < steps; j++) {
        tr.jump(start - j * c, start - (j + 1) * c, '−' + c, 'pst-jump-good');
        tr.mark(start - (j + 1) * c, 'pst-mark-good');
      }
      if (empty) {
        row.appendChild(card('Step ' + q.rows, traySvg(q.kind, q.rows, q.cols, 0, 28, { labels: true }), '<b>0</b> left'));
        working.appendChild(chainRow(start, '−', c, q.rows, 0));
      } else {
        row.appendChild(card('After ' + q.k + ' steps', traySvg(q.kind, q.rows, q.cols, q.rows - q.k, 28, { labels: true }), '<b>' + ans + '</b> left'));
        working.appendChild(chainRow(start, '−', c, q.k, ans));
      }
    }

    function hintJumps() {
      tr.clearHints();
      if (empty) {
        for (var j = 1; j < q.rows; j++) tr.jump(start - j * c, start - (j + 1) * c, '−' + c, 'pst-jump-hint');
      } else tr.jump(start, start - c, '−' + c, 'pst-jump-hint');
    }

    function onNumber(v) {
      if (done) return;
      if (v === ans) {
        box.good();
        box.disable();
        finish();
        api.check(true, empty ? start + ', ' + U.range(1, q.rows).map(function (j) { return start - j * c; }).join(', ') + '. That is ' + q.rows + ' steps to 0!' : start + ' − ' + U.range(1, q.k).map(function () { return c; }).join(' − ') + ' = ' + ans + '. Great!');
        return;
      }
      box.bad();
      var d;
      if (empty) {
        if (v === c) d = { tag: TAG.constSteps, hint: c + ' is how many we take away each time. How many times can we take ' + c + ' before there are 0?' };
        else if (v < q.rows) d = { tag: TAG.early, hint: 'After ' + v + ' steps there are still ' + (start - v * c) + ' left. Keep going until 0.' };
        else if (v === q.rows + 1) d = { tag: TAG.past, hint: 'After ' + q.rows + ' steps there are 0 left. We cannot take any more!' };
        else if (v === start) d = { tag: TAG.oneAway, hint: 'We take away ' + c + ' each time, not 1. Count back in ' + c + 's.' };
        else d = { tag: TAG.back, hint: 'Count back in ' + c + 's: ' + start + ', ' + (start - c) + ', … until you reach 0. Count the jumps.' };
      } else {
        if (v === start - q.k) d = { tag: TAG.stepsNotC, hint: 'You took away ' + q.k + '. But each step takes away ' + c + ': ' + start + ' − ' + c + ' − ' + c + (q.k === 3 ? ' − ' + c : '') + '.' };
        else if (v === start - c * (q.k - 1) && q.k > 1) d = { tag: TAG.steps, hint: 'That is after ' + (q.k - 1) + (q.k - 1 === 1 ? ' step' : ' steps') + '. We need ' + q.k + ' steps.' };
        else if (q.k === 3 && v === start - c) d = { tag: TAG.steps, hint: 'That is after 1 step. We need 3 steps.' };
        else if (v === start - c * (q.k + 1)) d = { tag: TAG.steps, hint: 'That is after ' + (q.k + 1) + ' steps, one too many.' };
        else if (v === start) d = { tag: TAG.none, hint: 'That is how many there are now. Take away ' + c + ', ' + q.k + ' times.' };
        else if (v > start) d = { tag: TAG.added, hint: 'This pattern gets shorter. Take away ' + c + ' each step.' };
        else if (v === start - q.k * (c - 1) || v === start - q.k * (c + 1)) d = { tag: TAG.back, hint: 'Count back ' + c + ' each step. Use the rows in the tray: each row is ' + c + '.' };
        else d = { tag: TAG.back, hint: 'Each row in the tray is ' + c + '. Cover ' + q.k + ' rows and count what is left.' };
      }
      var hint = d.hint;
      if (api.tries() >= 1) {
        hintJumps();
        hint += empty ? ' Count the jumps on the track down to 0.' : ' Start at ' + start + ' on the track and make ' + q.k + ' jumps back of ' + c + '.';
      }
      api.check(false, hint, d.tag);
    }

    function showNumberPart() {
      MQ.clear(answerArea);
      if (empty) {
        promptEl.innerHTML = 'How many <b>steps</b> until there are <b>0</b> left?';
        api.say('Keep taking away ' + c + '. How many steps to get to 0?', 'think');
        box = MQ.ui.numberInput({ prefix: 'Steps to 0:', onSubmit: onNumber });
      } else {
        promptEl.innerHTML = 'We take away <b>' + c + '</b> ' + many + ' each step. How many are left after <b>' + q.k + ' more steps</b>?';
        api.say('Take away ' + c + ', then ' + c + ' again' + (q.k === 3 ? ', and again' : '') + '.', 'think');
        box = MQ.ui.numberInput({ prefix: 'Left:', unit: many, onSubmit: onNumber });
      }
      answerArea.appendChild(box.el);
      box.focus();
    }

    if (empty) {
      promptEl.innerHTML = 'This pattern goes down in …';
      api.say('The tray is getting emptier. How many go each step?', 'think');
      var vals = U.shuffle([1, c, start, start - c]);
      chips = MQ.ui.choices(vals.map(function (v) {
        return { label: String(v), value: v };
      }), function (v) {
        if (done || chipsDone) return;
        if (v === c) {
          chips.mark(v, 'good');
          chips.disable();
          chipsDone = true;
          api.sound('pop');
          api.feedback('Yes! It goes down in ' + c + ': one row each step.', 'good');
          showNumberPart();
          return;
        }
        chips.mark(v, 'bad');
        var d;
        if (v === 1) d = { tag: TAG.oneAway, hint: 'More than 1 goes each step. Count the empty row: how many spaces?' };
        else if (v === start) d = { tag: TAG.totalConst, hint: start + ' is how many we start with. How many are taken away each step?' };
        else d = { tag: TAG.totalConst, hint: (start - c) + ' is how many are left. How many were taken away?' };
        var hint = d.hint;
        if (api.tries() >= 1) hint += ' Look at the jump on the track: ' + start + ' − ? = ' + (start - c) + '.';
        api.check(false, hint, d.tag);
      }, { columns: 4 });
      answerArea.appendChild(chips);
    } else showNumberPart();

    api.onReveal(function () {
      if (chips && !chipsDone) {
        chips.mark(c, 'good');
        chips.disable();
        chipsDone = true;
        showNumberPart();
      }
      box.setValue(ans);
      box.good();
      box.disable();
      finish();
      api.feedback(empty
        ? 'It goes down in ' + c + '. ' + start + ' → ' + U.range(1, q.rows).map(function (j) { return start - j * c; }).join(' → ') + ': that is ' + q.rows + ' steps to 0.'
        : 'Take away ' + c + ', ' + q.k + ' times: ' + start + ' → ' + U.range(1, q.k).map(function (j) { return start - j * c; }).join(' → ') + '. So ' + ans + ' are left.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Register
   * ------------------------------------------------------------------ */
  var deck = null;

  MQ.register('pattern-steps', {
    learn: [
      // 1. A growing pattern of trees: add 2 triangles each step.
      function (stage, api) {
        api.lockNext();
        api.say('A little tree is made of <b>2 triangles</b>. Click <b>Add 2</b> to plant another tree.');
        stage.appendChild(MQ.ui.lesson('A growing pattern', 'Each step, we add the <b>same</b> number of triangles.'));
        var q = { kind: 'tree', s: 2, c: 2 };
        var row = el('div', { class: 'pst-cards' });
        stage.appendChild(row);
        var k = 0;
        function addCard() {
          var cd = card('Step ' + (k + 1), stepSvg('tree', growGroups(q, k)), growSent(q, k));
          if (k) cd.classList.add('pst-pop');
          row.appendChild(cd);
        }
        addCard();
        var btn = el('button', { class: 'btn pst-act', type: 'button', onclick: function () {
          if (k >= 3) return;
          k++;
          api.sound('pop');
          addCard();
          var tot = 2 + 2 * k;
          if (k === 1) api.say(tot - 2 + ' <b>+ 2</b> = ' + tot + '. We added 2 triangles. Add 2 again!');
          else if (k === 2) {
            api.say('We add <b>2</b> every time. The 2 is the <b>constant</b>!', 'cheer');
            api.feedback('The <b>constant</b> is the amount added every step. Here it is 2.', 'good');
            api.unlockNext();
          } else {
            api.say('2, 4, 6, 8. Counting in 2s! The constant is still 2.', 'cheer');
            btn.disabled = true;
          }
        } }, 'Add 2 ▲▲');
        stage.appendChild(btn);
      },
      // 2. Shortening: a tray of 16 cupcakes, take 4 each step.
      function (stage, api) {
        api.lockNext();
        api.say('16 cupcakes in a tray. Click <b>Take 4</b> to take one row away.');
        stage.appendChild(MQ.ui.lesson('A shrinking pattern', 'We can <b>shorten</b> a pattern by taking away the same amount each step.'));
        var left = 4;
        var pic = el('div', { class: 'pst-pic-wrap' });
        var sents = el('div', { class: 'pst-sents' });
        var tr = track(16);
        tr.mark(16, 'pst-mark-start');
        function draw() {
          MQ.clear(pic);
          pic.appendChild(traySvg('cupcake', 4, 4, left, 40, { labels: true }));
        }
        draw();
        sents.appendChild(el('div', { html: '<b>16</b>' }));
        var btn = el('button', { class: 'btn pst-act', type: 'button', onclick: function () {
          if (left <= 0) return;
          var before = left * 4;
          left--;
          var now = left * 4;
          api.sound('pop');
          draw();
          sents.appendChild(el('div', { class: 'pst-pop', html: shrinkSent(16, 4, 4 - left) }));
          tr.jump(before, now, '−4', 'pst-jump-back');
          tr.mark(now);
          if (left === 0) {
            btn.disabled = true;
            api.say('16, 12, 8, 4, 0. We took away <b>4</b> each time. The constant is 4!', 'cheer');
            api.feedback('The pattern got <b>shorter</b> until there were 0 left.', 'good');
            api.unlockNext();
          } else api.say(before + ' − 4 = ' + now + '. Take 4 again!');
        } }, 'Take 4');
        stage.appendChild(el('div', { class: 'pst-learn-row' }, el('div', { class: 'pst-card' }, pic), sents));
        stage.appendChild(btn);
        stage.appendChild(tr.el);
      },
      // 3. Equal jumps on a number track (counting in 3s).
      function (stage, api) {
        api.lockNext();
        api.say('Each bag has <b>3 apples</b>. Click <b>Jump + 3</b> to add a bag.');
        stage.appendChild(MQ.ui.lesson('Same jump every time', 'A pattern makes <b>equal jumps</b> on the number track.'));
        var picWrap = el('div', { class: 'pst-pic-wrap' });
        var sumWrap = el('div', { class: 'pst-part' });
        var tr = track(20);
        tr.mark(0, 'pst-mark-start');
        var k = 0;
        function draw() {
          MQ.clear(picWrap);
          var gs = [];
          for (var i = 0; i < k; i++) gs.push({ n: 3, role: 'add' });
          gs.push({ n: 0, role: 'ghost' });
          picWrap.appendChild(stepSvg('apple', gs, 7));
          MQ.clear(sumWrap);
          if (k) sumWrap.appendChild(MQ.ui.sum(U.range(1, k).map(function () { return 3; }), 3 * k));
        }
        draw();
        var btn = el('button', { class: 'btn pst-act', type: 'button', onclick: function () {
          if (k >= 6) return;
          k++;
          api.sound('pop');
          tr.jump(3 * (k - 1), 3 * k, '+3');
          tr.mark(3 * k);
          draw();
          if (k === 4) {
            api.say('3, 6, 9, 12. Every jump is <b>3</b>. That is the constant!', 'cheer');
            api.feedback('Same jump each time = the <b>constant</b>. Counting in 3s is a pattern.', 'good');
            api.unlockNext();
          } else if (k >= 6) {
            btn.disabled = true;
            api.say('3, 6, 9, 12, 15, 18. All the jumps are the same size!', 'cheer');
          } else if (k < 4) api.say('We are on ' + 3 * k + '. Jump 3 more!');
        } }, 'Jump + 3');
        stage.appendChild(picWrap);
        stage.appendChild(btn);
        stage.appendChild(tr.el);
        stage.appendChild(sumWrap);
      },
    ],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'shrinkEmpty' || q.type === 'shrinkMore') renderShrink(stage, api, q);
        else renderGrow(stage, api, q);
      },
      // Test hooks (used only by development scripts).
      _buildDeck: buildDeck,
      _deck: function () {
        return deck;
      },
    },
  });

  var css = [
    '.pst-cards{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:flex-end;max-width:100%}',
    '.pst-card{background:#fff;border:2px solid var(--line);border-radius:14px;padding:6px 8px;display:flex;flex-direction:column;align-items:center;gap:4px;max-width:100%;box-sizing:border-box}',
    '.pst-card-q{border:3px dashed var(--accent)}',
    '.pst-card-title{font-weight:800;font-size:.95rem;color:var(--ink-soft)}',
    '.pst-pic{display:block;max-width:100%;height:auto}',
    '.pst-pic-wrap{display:flex;justify-content:center;max-width:100%}',
    '.pst-sent{font-size:1.15rem;font-weight:800;min-height:1.5em;white-space:nowrap}',
    '.pst-const{display:inline-block;background:#fff3cd;border:2px solid var(--gold);border-radius:8px;padding:0 6px;color:#7a5200;line-height:1.3}',
    '.pst-grp-start{fill:#eef3f7;stroke:#b7c5d1;stroke-width:2}',
    '.pst-grp-add{fill:#fff6d6;stroke:#e2b93b;stroke-width:2}',
    '.pst-grp-new{fill:#e3f6e8;stroke:#2a9d4b;stroke-width:2.5}',
    '.pst-grp-ghost,.pst-grp-ask{fill:#fff;stroke:#a9b4bf;stroke-width:2;stroke-dasharray:6 5}',
    '.pst-ghost-txt{font-size:30px;font-weight:800;fill:#8a96a3}',
    '.pst-build-btns{display:flex;gap:8px}',
    '.pst-small{min-height:42px;padding:6px 16px;font-size:1.1rem}',
    '.pst-act{font-size:1.2rem;min-width:150px}',
    '.pst-track{display:block;max-width:100%;height:auto}',
    '.pst-track-line{stroke:#5b6770;stroke-width:3}',
    '.pst-tick{stroke:#5b6770;stroke-width:2}',
    '.pst-tick-num{font-size:15px;font-weight:700;fill:#5b6770}',
    '.pst-dense .pst-tick-num{font-size:12px}',
    '.pst-tick-on{fill:#0b6e66;font-weight:900}',
    '.pst-mark{fill:#ffd166;stroke:#a87b00;stroke-width:2}',
    '.pst-mark-start{fill:#b7c5d1;stroke:#5b6770}',
    '.pst-mark-good{fill:#7bd389;stroke:#1f7a3a}',
    '.pst-arc{fill:none;stroke:#e2a400;stroke-width:3}',
    '.pst-arc-label{font-size:15px;font-weight:800;fill:#7a5200}',
    '.pst-jump-hint .pst-arc{stroke:#e76f51;stroke-dasharray:7 6}',
    '.pst-jump-hint .pst-arc-label{fill:#c2410c}',
    '.pst-jump-good .pst-arc{stroke:#2a9d4b}',
    '.pst-jump-good .pst-arc-label{fill:#1f7a3a}',
    '.pst-jump-back .pst-arc{stroke:#457b9d}',
    '.pst-jump-back .pst-arc-label{fill:#1d3557}',
    '.pst-part{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}',
    '.pst-part:empty{display:none}',
    '.pst-sentq{display:flex;align-items:center;gap:8px;font-size:1.6rem;font-weight:800;flex-wrap:wrap;justify-content:center}',
    '.pst-box{width:90px}',
    '.pst-box.bad{border-color:var(--try)}',
    '.pst-box.good{border-color:var(--good);background:var(--good-bg)}',
    '.pst-sents{display:flex;flex-direction:column;align-items:flex-start;gap:4px;font-size:1.25rem;font-weight:800;min-width:150px}',
    '.pst-learn-row{display:flex;gap:18px;align-items:center;justify-content:center;flex-wrap:wrap}',
    '.pst-tray{fill:#f3e9dc;stroke:#b08968;stroke-width:3}',
    '.pst-row{fill:#fffaf2;stroke:#e6d5c3;stroke-width:1.5}',
    '.pst-row-gone{fill:none;stroke:none}',
    '.pst-slot{fill:none;stroke:#c3ccd5;stroke-width:2;stroke-dasharray:4 4}',
    '.pst-gone-label{font-size:15px;font-weight:800;fill:#457b9d}',
    '.pst-chip-c{background:#fff3cd;border-color:var(--gold)}',
    '.pst-pop{animation:pst-pop .45s ease}',
    '@keyframes pst-pop{0%{transform:scale(.7);opacity:0}100%{transform:scale(1);opacity:1}}',
    '@media (max-width:640px){.pst-sent{font-size:1rem}.pst-sentq{font-size:1.3rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'pattern-steps' }, css));
})();

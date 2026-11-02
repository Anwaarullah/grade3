/* Reflect It — complete a shape's reflection in a vertical or horizontal mirror line on a square grid (Unit 17.1). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  /* ------------------------------------------------------------------ *
   * Colours. 'a' and 'b' are the two paint colours a shape can use.
   * ------------------------------------------------------------------ */
  var PAINT = {
    a: { name: 'Blue', cls: 'rfi-a' },
    b: { name: 'Orange', cls: 'rfi-b' },
  };

  /* ------------------------------------------------------------------ *
   * Designs. Each is drawn as rows of text, as if it sits on the LEFT of a
   * vertical mirror line: the right-most column is the side nearest the line.
   * '.' = empty, 'a' / 'b' = a square painted in that colour.
   * They are turned into cells { d, t, k }:
   *   d = how many squares between this square and the line (0 = touching),
   *   t = position along the line, k = colour.
   * Every design is lopsided (not symmetrical across the line direction),
   * so a slid copy always looks different from a flipped one.
   * ------------------------------------------------------------------ */
  var DESIGNS = {
    1: [
      { key: 'step', rows: ['..a', '.aa'] },
      { key: 'hook', rows: ['aa', 'a.', 'aa'] },
      { key: 'arrow', rows: ['.a', 'aa', '.a'] },
      { key: 'flag', rows: ['aa', '.a', '.a'] },
      { key: 'house', rows: ['.a', 'aa', 'aa'] },
      { key: 'boot', rows: ['a.', 'a.', 'aa'] },
      { key: 'zigzag', rows: ['a.', 'aa', '.a'] },
      { key: 'corner', rows: ['aaa', '..a'] },
      { key: 'key', rows: ['a..', 'aaa'] },
    ],
    2: [
      { key: 'stairs', stairs: true, rows: ['a..', 'aa.', 'bbb'] },
      { key: 'zig-step', stairs: true, rows: ['aa.', 'aab', '..b'] },
      { key: 'half-house', rows: ['.a', 'aa', 'bb', 'bb'] },
      { key: 'flag2', rows: ['bb.', 'bba', '..a', '..a'] },
      { key: 'half-tree', rows: ['..a', '.aa', 'aaa', '..b'] },
      { key: 'L-shape', rows: ['a..', 'a..', 'abb'] },
      { key: 'chair', rows: ['a..', 'a..', 'aab', 'a.b'] },
    ],
    3: [
      { key: 'big-stairs', stairs: true, rows: ['a...', 'aa..', 'bbb.', 'bbbb'] },
      { key: 'down-steps', stairs: true, rows: ['aaaa', '.bbb', '..aa', '...b'] },
      { key: 'stepped-L', rows: ['ab..', 'a...', 'a...', 'aabb'] },
      { key: 'house2', rows: ['a..', 'aaa', 'bbb', 'b.b'] },
      { key: 'mug', rows: ['aaa.', 'aaab', 'aaa.'] },
      { key: 'flower', rows: ['.a.', 'aaa', '.a.', '.b.', '.bb'] },
      { key: 'zigzag2', rows: ['aa..', '.bb.', '..aa', '...b'] },
    ],
  };

  // Setup per level: grid size N (square), line at N/2, cells per shape.
  var LEVEL = {
    1: { n: 6, cell: 54, min: 3, max: 5 },
    2: { n: 8, cell: 44, min: 5, max: 8 },
    3: { n: 10, cell: 36, min: 7, max: 10 },
  };

  function designCells(rows) {
    var w = 0;
    rows.forEach(function (row) { w = Math.max(w, row.length); });
    var cells = [];
    rows.forEach(function (row, t) {
      for (var i = 0; i < row.length; i++) {
        var ch = row.charAt(i);
        if (ch === 'a' || ch === 'b') cells.push({ d: w - 1 - i, t: t, k: ch });
      }
    });
    // Normalise so the nearest square has d = 0 and the first row t = 0.
    var minD = Math.min.apply(null, cells.map(function (c) { return c.d; }));
    var minT = Math.min.apply(null, cells.map(function (c) { return c.t; }));
    cells.forEach(function (c) { c.d -= minD; c.t -= minT; });
    return cells;
  }

  function extent(cells, prop) {
    var lo = Infinity, hi = -Infinity;
    cells.forEach(function (c) { lo = Math.min(lo, c[prop]); hi = Math.max(hi, c[prop]); });
    return { lo: lo, hi: hi, size: hi - lo + 1 };
  }

  /* ------------------------------------------------------------------ *
   * Geometry. A question: { orient: 'v'|'h', side: 'lo'|'hi', L (line
   * position, a grid line index), n (grid size), cells: [{c, r, k}] }.
   * 'lo' = the shape is left of (v) or above (h) the line.
   * ------------------------------------------------------------------ */
  function place(dc, orient, side, L, gap, toff, tflip, tSize) {
    var dd = dc.d + gap;
    var tt = (tflip ? tSize - 1 - dc.t : dc.t) + toff;
    var across = side === 'lo' ? L - 1 - dd : L + dd;
    return orient === 'v' ? { c: across, r: tt, k: dc.k } : { c: tt, r: across, k: dc.k };
  }

  function mirrorCell(cell, orient, L) {
    return orient === 'v' ? { c: 2 * L - 1 - cell.c, r: cell.r, k: cell.k } : { c: cell.c, r: 2 * L - 1 - cell.r, k: cell.k };
  }

  // Coordinate across the mirror line, and along it.
  function acrossOf(cell, orient) { return orient === 'v' ? cell.c : cell.r; }
  function alongOf(cell, orient) { return orient === 'v' ? cell.r : cell.c; }
  function makeCell(across, along, orient, k) {
    return orient === 'v' ? { c: across, r: along, k: k } : { c: along, r: across, k: k };
  }
  // Number of the square counting out from the line (1 = touching the line).
  function countFromLine(cell, q) {
    var a = acrossOf(cell, q.orient);
    return a < q.L ? q.L - a : a - q.L + 1;
  }

  function key(c) { return c.c + ',' + c.r; }
  function posSet(cells) {
    var s = {};
    cells.forEach(function (c) { s[key(c)] = c.k || true; });
    return s;
  }
  function samePositions(a, b) {
    if (a.length !== b.length) return false;
    var s = posSet(a);
    for (var i = 0; i < b.length; i++) if (!s[key(b[i])]) return false;
    return true;
  }
  // Move cells by delta across the line.
  function shiftAcross(cells, delta, orient) {
    return cells.map(function (c) { return makeCell(acrossOf(c, orient) + delta, alongOf(c, orient), orient, c.k); });
  }
  // Copy that slid across the line (same way round), sitting where the reflection sits.
  function slidCopy(q) {
    var o = extent(q.cells.map(function (c) { return { a: acrossOf(c, q.orient) }; }), 'a');
    var m = extent(q.answer.map(function (c) { return { a: acrossOf(c, q.orient) }; }), 'a');
    return shiftAcross(q.cells, m.lo - o.lo, q.orient);
  }
  // Reflection turned the wrong way too (flipped along the line as well).
  function flippedAlong(cells, orient) {
    var e = extent(cells.map(function (c) { return { t: alongOf(c, orient) }; }), 't');
    return cells.map(function (c) { return makeCell(acrossOf(c, orient), e.lo + e.hi - alongOf(c, orient), orient, c.k); });
  }
  function acrossMin(cells, orient) {
    return Math.min.apply(null, cells.map(function (c) { return acrossOf(c, orient); }));
  }
  // Does `child` equal `target` moved some distance across the line? Returns the delta or null.
  function matchesShifted(child, target, orient) {
    if (child.length !== target.length || !child.length) return null;
    var delta = acrossMin(child, orient) - acrossMin(target, orient);
    return samePositions(child, shiftAcross(target, delta, orient)) ? delta : null;
  }
  function onDrawSide(cell, q) {
    var a = acrossOf(cell, q.orient);
    return q.side === 'lo' ? a >= q.L : a < q.L;
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  function makeQuestion(level, design, orient, gap) {
    var cfg = LEVEL[level];
    var n = cfg.n, L = n / 2;
    var dc = designCells(design.rows);
    var tSize = extent(dc, 't').size;
    var side = Math.random() < 0.5 ? 'lo' : 'hi';
    var tflip = Math.random() < 0.5;
    var toff = U.rand(0, n - tSize);
    var cells = dc.map(function (c) { return place(c, orient, side, L, gap, toff, tflip, tSize); });
    var q = {
      level: level, design: design.key, stairs: !!design.stairs, orient: orient, side: side, n: n, L: L, cell: cfg.cell, pad: 18,
      gap: gap, cells: cells, colours: Object.keys(posColours(cells)).sort(),
    };
    q.answer = cells.map(function (c) { return mirrorCell(c, orient, L); });
    return q;
  }
  function posColours(cells) {
    var o = {};
    cells.forEach(function (c) { o[c.k] = true; });
    return o;
  }

  function maxGap(level, design) {
    var w = extent(designCells(design.rows), 'd').size;
    return LEVEL[level].n / 2 - w;
  }

  // A gap of 1 or more; the widest gap that fits is chosen half the time so bigger gaps appear.
  function pickGap(level, design) {
    var m = Math.max(1, maxGap(level, design));
    return Math.random() < 0.5 ? m : U.rand(1, m);
  }

  function buildDeck() {
    var deck = [];
    // Level 1 (questions 1-3): vertical line, one colour, shapes touching the line.
    U.shuffle(DESIGNS[1]).slice(0, 3).forEach(function (d) { deck.push(makeQuestion(1, d, 'v', 0)); });
    // Level 2 (questions 4-6): one staircase, vertical and horizontal lines, gaps of 1-3 squares.
    var stairs2 = U.shuffle(DESIGNS[2].filter(function (d) { return d.stairs; }));
    var others2 = U.shuffle(DESIGNS[2].filter(function (d) { return !d.stairs; }));
    var picks2 = U.shuffle([stairs2[0], others2[0], others2[1]]);
    var orients2 = U.shuffle(['v', 'h', U.pick(['v', 'h'])]);
    var gapless = U.rand(0, 2); // one of the three may touch the line; the others have a gap
    picks2.forEach(function (d, i) {
      var g = i === gapless ? 0 : pickGap(2, d);
      deck.push(makeQuestion(2, d, orients2[i], g));
    });
    // Level 3 (questions 7-8): bigger two-colour shapes with a gap, one of each line.
    var picks3 = U.shuffle(DESIGNS[3]).slice(0, 2);
    var orients3 = U.shuffle(['v', 'h']);
    picks3.forEach(function (d, i) {
      deck.push(makeQuestion(3, d, orients3[i], pickGap(3, d)));
    });
    return deck;
  }

  /* ------------------------------------------------------------------ *
   * Drawing helpers
   * ------------------------------------------------------------------ */
  function drawBoard(q, opts) {
    opts = opts || {};
    var g = MQ.ui.grid({ cols: q.cols || q.n, rows: q.rows || q.n, cell: q.cell, pad: q.pad, className: 'rfi-grid' });
    // Tint the side the child draws on.
    if (opts.tint !== false) {
      var drawLo = q.side === 'hi';
      var cols = g.cols, rows = g.rows;
      var tint = q.orient === 'v'
        ? S('rect', { x: g.x(drawLo ? 0 : q.L), y: g.y(0), width: (drawLo ? q.L : cols - q.L) * g.cell, height: rows * g.cell, class: 'rfi-side' })
        : S('rect', { x: g.x(0), y: g.y(drawLo ? 0 : q.L), width: cols * g.cell, height: (drawLo ? q.L : rows - q.L) * g.cell, class: 'rfi-side' });
      g.under.appendChild(tint);
    }
    q.cells.forEach(function (c) { g.fill(c.c, c.r, 'rfi-cell ' + PAINT[c.k].cls); });
    var lineG = S('g', { class: 'rfi-mirror' });
    if (q.orient === 'v') {
      lineG.appendChild(S('line', { x1: g.x(q.L), y1: g.y(0) - 12, x2: g.x(q.L), y2: g.y(g.rows) + 12 }));
    } else {
      lineG.appendChild(S('line', { x1: g.x(0) - 12, y1: g.y(q.L), x2: g.x(g.cols) + 12, y2: g.y(q.L) }));
    }
    g.marks = S('g', { class: 'rfi-marks' });
    g.layer.appendChild(g.marks);
    g.layer.appendChild(lineG);
    return g;
  }

  function cellText(g, c, r, text, cls) {
    var t = S('text', { x: g.x(c) + g.cell / 2, y: g.y(r) + g.cell / 2, class: cls || 'rfi-num', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, String(text));
    g.marks.appendChild(t);
    return t;
  }

  function ringCell(g, c, r, cls) {
    var m = 4;
    var rect = S('rect', { x: g.x(c) + m, y: g.y(r) + m, width: g.cell - 2 * m, height: g.cell - 2 * m, rx: 6, class: cls });
    g.marks.appendChild(rect);
    return rect;
  }

  function paletteRow(colours, current, onPick) {
    var row = el('div', { class: 'rfi-palette' }, el('span', { class: 'rfi-pal-label' }, 'Colour:'));
    var btns = {};
    colours.forEach(function (k) {
      var b = el('button', { type: 'button', class: 'rfi-brush' + (k === current ? ' rfi-on' : ''), 'data-colour': k },
        el('span', { class: 'rfi-swatch ' + PAINT[k].cls + '-bg' }), PAINT[k].name);
      b.addEventListener('click', function () {
        Object.keys(btns).forEach(function (j) { btns[j].classList.toggle('rfi-on', j === k); });
        MQ.sound('click');
        onPick(k);
      });
      btns[k] = b;
      row.appendChild(b);
    });
    return row;
  }

  // Animate a <g> of cells: fn(progress 0..1) sets its transform. Uses api.later.
  function animate(api, steps, ms, fn, done) {
    var i = 0;
    function tick() {
      i++;
      fn(i / steps);
      if (i < steps) api.later(tick, ms);
      else if (done) done();
    }
    fn(0);
    api.later(tick, ms);
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */

  // 1. Half a butterfly: count squares from the line and click the partner.
  function learnButterfly(stage, api) {
    api.say('A mirror line makes a reflection. Each square has a partner on the other side.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Count from the line', 'Same number of squares from the line on both sides.'));
    var q = { orient: 'v', side: 'lo', n: 8, L: 4, cell: 50, pad: 18, cols: 8, rows: 6 };
    var half = designCells(['aa..', 'aaab', '.aab', '.aab', 'aaab', 'aa..']);
    q.cells = half.map(function (c) { return place(c, 'v', 'lo', 4, 0, 0, false, 6); });
    var answer = q.cells.map(function (c) { return mirrorCell(c, 'v', 4); });
    // Two squares are missing on the right; the rest of the wing is already drawn.
    var targets = [
      answer.filter(function (c) { return c.r === 1 && c.c === 5; })[0], // 2nd square from the line
      answer.filter(function (c) { return c.r === 4 && c.c === 7; })[0], // 4th square from the line
    ];
    var g = drawBoard(q);
    answer.forEach(function (c) {
      if (targets.indexOf(c) === -1) g.fill(c.c, c.r, 'rfi-cell ' + PAINT[c.k].cls);
    });
    stage.appendChild(el('div', { class: 'rfi-board' }, g.svg));
    var step = 0;
    var counted = [];

    function showTarget() {
      counted.forEach(function (n) { if (n.parentNode) n.parentNode.removeChild(n); });
      counted = [];
      var t = targets[step];
      var src = mirrorCell(t, 'v', 4);
      var n = countFromLine(src, q);
      for (var i = 1; i <= n; i++) counted.push(cellText(g, 4 - i, src.r, i, 'rfi-num rfi-num-on'));
      counted.push(ringCell(g, src.c, src.r, 'rfi-ring'));
      api.say('This square is ' + n + ' squares from the line. Click its partner: ' + n + ' squares from the line on the other side.', 'think');
      api.feedback('Count ' + U.range(1, n).join(', ') + ' from the mirror line on the right.', 'info');
    }

    g.svg.addEventListener('click', function (e) {
      if (step >= targets.length) return;
      var p = g.cellAt(MQ.ui.svgPoint(g.svg, e));
      if (!p) return;
      var t = targets[step];
      if (p.c === t.c && p.r === t.r) {
        g.fill(t.c, t.r, 'rfi-cell rfi-pop ' + PAINT[t.k].cls);
        var n = countFromLine(t, q);
        for (var i = 1; i <= n; i++) counted.push(cellText(g, 3 + i, t.r, i, 'rfi-num rfi-num-on'));
        api.sound('correct');
        step++;
        if (step < targets.length) {
          api.say(n + ' squares on this side too. Well done!', 'cheer');
          api.later(showTarget, 1600);
        } else {
          api.say('The butterfly is finished! Both wings match.', 'cheer');
          api.feedback('Each square and its partner are the same number of squares from the line.', 'good');
          api.unlockNext();
        }
      } else if (p.c < 4) {
        api.feedback('Click on the right side of the mirror line.', 'try');
      } else {
        api.sound('wrong');
        var want = countFromLine(t, q);
        api.feedback('That square is ' + countFromLine(p, q) + ' from the line' + (p.r !== t.r ? ' and in a different row' : '') + '. Stay in the same row and count ' + want + '.', 'try');
      }
    });
    showTarget();
  }

  // 2. Slide or flip? A staircase on a horizontal line.
  function learnFlip(stage, api) {
    api.say('A reflection is a flip, not a slide. Let us see the difference.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Flip, do not slide', 'Press <b>Slide</b>, then press <b>Flip</b>.'));
    var q = { orient: 'h', side: 'lo', n: 6, L: 3, cell: 48, pad: 18, cols: 7, rows: 6 };
    var st = [];
    // Staircase sitting on the line: 1, 2, 3 squares wide, longest step touching the line.
    [[0, 3], [1, 2], [2, 1]].forEach(function (row) {
      for (var t = 0; t < row[1]; t++) st.push({ d: row[0], t: t, k: 'a' });
    });
    q.cells = st.map(function (c) { return place(c, 'h', 'lo', 3, 0, 2, false, 3); });
    var g = drawBoard(q, { tint: false });
    stage.appendChild(el('div', { class: 'rfi-board' }, g.svg));
    var copy = S('g', { class: 'rfi-copy' });
    g.layer.insertBefore(copy, g.layer.firstChild);
    var cs = g.cell;
    function drawCopy(cls) {
      MQ.clear(copy);
      q.cells.forEach(function (c) {
        copy.appendChild(S('rect', { x: g.x(c.c), y: g.y(c.r), width: cs, height: cs, class: cls }));
      });
    }
    var tag = el('div', { class: 'rfi-tag' }, '\u00a0');
    stage.appendChild(tag);
    var lineY = g.y(3);
    var slideBtn = el('button', { type: 'button', class: 'btn btn-big' }, '1. Slide it ⬇');
    var flipBtn = el('button', { type: 'button', class: 'btn btn-big', disabled: true }, '2. Flip it ↕');
    stage.appendChild(el('div', { class: 'rfi-btnrow' }, slideBtn, flipBtn));
    var busy = false;
    slideBtn.addEventListener('click', function () {
      if (busy) return;
      busy = true;
      MQ.sound('click');
      drawCopy('rfi-ghost-bad');
      tag.textContent = '';
      animate(api, 12, 50, function (p) {
        copy.setAttribute('transform', 'translate(0,' + p * 3 * cs + ')');
      }, function () {
        busy = false;
        tag.textContent = '✗ Slid: same way up';
        tag.className = 'rfi-tag rfi-tag-bad';
        api.say('Sliding keeps it the same way up. The long step is now far from the line. That is NOT a reflection.', 'oops');
        flipBtn.disabled = false;
      });
    });
    flipBtn.addEventListener('click', function () {
      if (busy) return;
      busy = true;
      MQ.sound('click');
      drawCopy('rfi-ghost-good');
      tag.textContent = '';
      animate(api, 14, 50, function (p) {
        var s = 1 - 2 * p;
        if (Math.abs(s) < 0.02) s = 0.02;
        copy.setAttribute('transform', 'translate(0,' + lineY + ') scale(1,' + s + ') translate(0,' + -lineY + ')');
      }, function () {
        busy = false;
        tag.textContent = '✓ Flipped: a reflection';
        tag.className = 'rfi-tag rfi-tag-good';
        api.say('Flip! The long step stays next to the line, like in a mirror.', 'cheer');
        api.feedback('A reflection is flipped over the mirror line. The part next to the line stays next to the line.', 'good');
        api.unlockNext();
      });
    });
  }

  // 3. A shape with a gap: count the empty squares to the line.
  function learnGap(stage, api) {
    api.say('This arrow is not touching the mirror line. How many empty squares are between them?', 'think');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Mind the gap', 'Count the empty squares between the shape and the line.'));
    var q = { orient: 'v', side: 'lo', n: 8, L: 4, cell: 50, pad: 18, cols: 8, rows: 5 };
    var dc = designCells(['.a', 'aa', '.a']);
    q.cells = dc.map(function (c) { return place(c, 'v', 'lo', 4, 2, 1, false, 3); });
    q.answer = q.cells.map(function (c) { return mirrorCell(c, 'v', 4); });
    var g = drawBoard(q);
    stage.appendChild(el('div', { class: 'rfi-board' }, g.svg));
    var area = el('div', { class: 'rfi-ask' });
    stage.appendChild(area);
    var phase = 'count';
    var ch = MQ.ui.choices([1, 2, 3, 4], function (v) {
      if (v === 2) {
        ch.mark(v, 'good');
        ch.disable();
        api.sound('correct');
        [3, 2].forEach(function (c, i) { cellText(g, c, 2, i + 1, 'rfi-num rfi-gapnum'); ringCell(g, c, 2, 'rfi-gapring'); });
        api.say('Yes, a gap of 2. Leave a gap of 2 on the other side too. Click where the nearest square goes.', 'happy');
        api.feedback('Click the first square of the reflection, after a gap of 2.', 'info');
        phase = 'click';
      } else {
        ch.mark(v, 'bad');
        api.sound('wrong');
        api.feedback('Look at the middle row. Count the empty squares from the arrow to the red line.', 'try');
      }
    }, { columns: 4 });
    area.appendChild(ch);

    g.svg.addEventListener('click', function (e) {
      if (phase !== 'click') return;
      var p = g.cellAt(MQ.ui.svgPoint(g.svg, e));
      if (!p) return;
      if (p.c < 4) {
        api.feedback('Click on the right side of the mirror line.', 'try');
        return;
      }
      var gapR = p.c - 4; // empty squares between line and this square
      if (p.c === 6 && p.r >= 1 && p.r <= 3) {
        phase = 'done';
        api.sound('correct');
        [4, 5].forEach(function (c, i) { cellText(g, c, 2, i + 1, 'rfi-num rfi-gapnum'); ringCell(g, c, 2, 'rfi-gapring'); });
        q.answer.forEach(function (c, i) {
          api.later(function () { g.fill(c.c, c.r, 'rfi-cell rfi-pop ' + PAINT[c.k].cls); }, 150 * i);
        });
        api.later(function () {
          api.say('Gap of 2 here, gap of 2 there. The arrow now points the other way!', 'cheer');
          api.feedback('Same gap on both sides of the mirror line.', 'good');
          api.unlockNext();
        }, 700);
      } else if (gapR === 0) {
        api.sound('wrong');
        api.feedback('That touches the line. Leave 2 empty squares first.', 'try');
      } else if (p.c !== 6) {
        api.sound('wrong');
        api.feedback('That leaves a gap of ' + gapR + '. We need a gap of 2.', 'try');
      } else {
        api.sound('wrong');
        api.feedback('Right distance, but there is no arrow square in that row. Try the rows with the arrow.', 'try');
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice
   * ------------------------------------------------------------------ */
  var deck = null;

  function lineWord(q) {
    return q.orient === 'v' ? 'vertical' : 'horizontal';
  }

  function diagnose(q, child) {
    var res = { ok: false };
    var ans = q.answer;
    var ansSet = posSet(ans);
    var childSet = posSet(child);
    var extra = child.filter(function (c) { return !ansSet[key(c)]; });
    var missing = ans.filter(function (c) { return !childSet[key(c)]; });
    var wrongColour = child.filter(function (c) { return ansSet[key(c)] && ansSet[key(c)] !== c.k; });
    res.extra = extra;
    res.missing = missing;
    res.wrongColour = wrongColour;
    if (!extra.length && !missing.length) {
      if (!wrongColour.length) { res.ok = true; return res; }
      res.tag = 'Colours did not match';
      res.hint = 'The squares are in the right places! But ' + (wrongColour.length === 1 ? '1 square is' : wrongColour.length + ' squares are') + ' the wrong colour. Each partner must be the same colour.';
      return res;
    }
    var gapWord = q.gap === 1 ? '1 empty square' : q.gap + ' empty squares';
    if (matchesShifted(child, slidCopy(q), q.orient) !== null) {
      res.tag = 'Slid the shape instead of flipping it';
      res.hint = 'Your shape faces the same way as the first one. A mirror flips it: the part next to the line stays next to the line.';
      return res;
    }
    var delta = matchesShifted(child, ans, q.orient);
    if (delta !== null) {
      var childGap = Math.min.apply(null, child.map(function (c) { return countFromLine(c, q); })) - 1;
      if (q.gap > 0 && childGap === 0) {
        res.tag = 'Ignored the gap to the line';
        res.hint = 'Good flip! But the shape has a gap of ' + gapWord + ' before the line. Leave the same gap on your side.';
      } else {
        res.tag = 'Wrong distance from the mirror line';
        res.hint = 'Good flip, wrong place. Your shape is ' + (childGap > q.gap ? 'too far from' : 'too close to') + ' the line. Count how far each square is from the line.';
      }
      return res;
    }
    var turned = flippedAlong(ans, q.orient);
    if (!samePositions(turned, ans) && matchesShifted(child, turned, q.orient) !== null) {
      res.tag = 'Flipped the wrong way';
      res.hint = q.orient === 'v'
        ? 'Your shape is upside down. A vertical mirror swaps left and right, but top stays at the top.'
        : 'Your shape is back to front. A horizontal mirror swaps top and bottom, but left stays on the left.';
      return res;
    }
    if (missing.length && !extra.length) {
      res.tag = 'Missed some squares';
      res.hint = (missing.length === 1 ? '1 square is' : missing.length + ' squares are') + ' still missing. Every square needs a partner.';
    } else if (extra.length && !missing.length) {
      res.tag = 'Added extra squares';
      res.hint = (extra.length === 1 ? '1 square does' : extra.length + ' squares do') + ' not belong. Check each square has a partner in the shape.';
    } else {
      res.tag = 'Some squares in the wrong place';
      res.hint = 'Some squares are in the wrong place. Pick one square in the shape, count how far it is from the line, and find its partner.';
    }
    if (q.gap > 0) res.hint += ' Remember the gap of ' + gapWord + '.';
    return res;
  }

  function renderQuestion(stage, api) {
    if (!deck || api.index === 0 || !deck[api.index]) deck = buildDeck();
    var q = deck[api.index];
    var twoColours = q.colours.length > 1;
    var brush = q.colours[0];
    var painted = {}; // "c,r" -> { c, r, k, node }
    var lastChecked = null; // drawing at the last wrong Check, so an unchanged re-check is not marked again

    var sayLine = q.level === 1
      ? 'Finish the picture. Each square needs a partner the same distance from the line.'
      : twoColours
        ? 'Reflect the shape. Pick the right colour for each square!'
        : 'Reflect the shape in the mirror line.';
    api.say(sayLine, 'think');
    stage.appendChild(MQ.ui.prompt('Reflect the shape in the <b>' + lineWord(q) + '</b> mirror line.'));
    if (twoColours) stage.appendChild(paletteRow(q.colours, brush, function (k) { brush = k; }));

    var g = drawBoard(q);
    g.svg.classList.add('rfi-play');
    var board = el('div', { class: 'rfi-board' }, g.svg);
    stage.appendChild(board);

    var checkBtn = el('button', { type: 'button', class: 'btn btn-big rfi-check' }, 'Check ✓');
    var clearBtn = el('button', { type: 'button', class: 'btn btn-ghost rfi-clear' }, 'Start again');
    stage.appendChild(el('div', { class: 'rfi-btnrow' }, clearBtn, checkBtn));

    function clearMarks() { MQ.clear(g.marks); }
    function setCell(c, r, k) {
      var id = c + ',' + r;
      if (painted[id]) {
        g.under.removeChild(painted[id].node);
        delete painted[id];
      }
      if (k) painted[id] = { c: c, r: r, k: k, node: g.fill(c, r, 'rfi-cell rfi-pop ' + PAINT[k].cls) };
    }
    function childCells() {
      return Object.keys(painted).map(function (id) { return { c: painted[id].c, r: painted[id].r, k: painted[id].k }; });
    }

    g.svg.addEventListener('click', function (e) {
      if (api.isAnswered()) return;
      var p = g.cellAt(MQ.ui.svgPoint(g.svg, e));
      if (!p) return;
      if (!onDrawSide(p, q)) {
        api.feedback('Draw on the shaded side of the mirror line.', 'info');
        return;
      }
      clearMarks();
      var cur = painted[p.c + ',' + p.r];
      if (cur && cur.k === brush) setCell(p.c, p.r, null);
      else setCell(p.c, p.r, brush);
      MQ.sound('pop');
    });

    clearBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      Object.keys(painted).forEach(function (id) { setCell(painted[id].c, painted[id].r, null); });
      clearMarks();
    });

    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var child = childCells();
      if (!child.length) {
        api.feedback('Click some squares on the shaded side first.', 'info');
        return;
      }
      var snap = child.map(function (c) { return key(c) + c.k; }).sort().join('|');
      if (snap === lastChecked) {
        api.feedback('Change some squares first, then press Check again.', 'info');
        return;
      }
      clearMarks();
      var res = diagnose(q, child);
      if (res.ok) {
        checkBtn.disabled = true;
        clearBtn.disabled = true;
        api.check(true, q.gap > 0 ? 'Perfect! Same gap, flipped over the line.' : null);
        return;
      }
      var second = api.tries() >= 1;
      var hint = res.hint;
      if (second) {
        res.extra.forEach(function (c) { ringCell(g, c.c, c.r, 'rfi-bad'); });
        res.wrongColour.forEach(function (c) { ringCell(g, c.c, c.r, 'rfi-bad'); });
        res.missing.forEach(function (c) {
          var src = mirrorCell(c, q.orient, q.L);
          ringCell(g, src.c, src.r, 'rfi-need');
        });
        var bits = [];
        if (res.extra.length || res.wrongColour.length) bits.push('Red boxes are wrong.');
        if (res.missing.length) bits.push('Shape squares with a dashed ring have no partner yet.');
        hint = res.tag + '. ' + bits.join(' ');
      }
      lastChecked = snap;
      api.check(false, hint, res.tag);
    });

    api.onReveal(function () {
      Object.keys(painted).forEach(function (id) { setCell(painted[id].c, painted[id].r, null); });
      clearMarks();
      checkBtn.disabled = true;
      clearBtn.disabled = true;
      q.cells.forEach(function (c) { cellText(g, c.c, c.r, countFromLine(c, q), 'rfi-num rfi-num-on'); });
      if (q.gap > 0) {
        // Number the empty gap squares on both sides, next to the square nearest the line.
        var near = q.cells.filter(function (c) { return countFromLine(c, q) === q.gap + 1; })[0];
        var along = alongOf(near, q.orient);
        for (var i = 1; i <= q.gap; i++) {
          [q.L - i, q.L + i - 1].forEach(function (a) {
            var gc = makeCell(a, along, q.orient);
            ringCell(g, gc.c, gc.r, 'rfi-gapring');
            cellText(g, gc.c, gc.r, i, 'rfi-num rfi-gapnum');
          });
        }
      }
      q.answer.forEach(function (c, i) {
        api.later(function () {
          g.fill(c.c, c.r, 'rfi-cell rfi-pop ' + PAINT[c.k].cls);
          cellText(g, c.c, c.r, countFromLine(c, q), 'rfi-num rfi-num-on');
        }, 120 * i);
      });
      api.feedback('The numbers count squares from the line. Each square\'s partner has the same number' + (q.gap > 0 ? ', so the gap of ' + q.gap + ' is the same on both sides.' : '.') + (twoColours ? ' Same colour too.' : ''), 'info');
    });
  }

  MQ.register('reflect-it', {
    learn: [learnButterfly, learnFlip, learnGap],
    practice: { count: 8, render: renderQuestion },
    // Used only by development tests.
    _dev: {
      buildDeck: buildDeck,
      deck: function () { return deck; },
      designs: DESIGNS,
      designCells: designCells,
      diagnose: diagnose,
    },
  });

  var css = [
    '.rfi-board{width:100%;display:flex;justify-content:center}',
    '.rfi-grid{display:block;max-width:100%;height:auto}',
    '.rfi-play{cursor:pointer}',
    '.rfi-side{fill:#fff6d9}',
    '.rfi-cell{stroke:none}',
    '.rfi-a{fill:#4f7fe8}',
    '.rfi-b{fill:#f4a020}',
    '.rfi-a-bg{background:#4f7fe8}',
    '.rfi-b-bg{background:#f4a020}',
    '.rfi-mirror line{stroke:#e63946;stroke-width:5;stroke-dasharray:12 7;stroke-linecap:round}',
    '.rfi-num{font-size:20px;font-weight:800;fill:#1b2a4a;pointer-events:none}',
    '.rfi-num-on{fill:#fff;stroke:#1b2a4a;stroke-width:3px;paint-order:stroke}',
    '.rfi-gapnum{fill:#7a5a00}',
    '.rfi-ring{fill:none;stroke:#1b2a4a;stroke-width:4;stroke-dasharray:6 4}',
    '.rfi-gapring{fill:#ffe08a;fill-opacity:.55;stroke:#d4a72c;stroke-width:2}',
    '.rfi-bad{fill:none;stroke:#d62828;stroke-width:5}',
    '.rfi-need{fill:none;stroke:#1b2a4a;stroke-width:4;stroke-dasharray:6 4}',
    '.rfi-marks{pointer-events:none}',
    '.rfi-ghost-bad{fill:#f4a020;fill-opacity:.55;stroke:#c2410c;stroke-width:3;stroke-dasharray:6 4}',
    '.rfi-ghost-good{fill:#4f7fe8;fill-opacity:.6;stroke:#1f4fb8;stroke-width:3}',
    '.rfi-tag{font-size:1.2rem;font-weight:800;min-height:1.6em}',
    '.rfi-tag-bad{color:#c2410c}',
    '.rfi-tag-good{color:#1f9d6b}',
    '.rfi-pop{animation:rfiPop .35s ease}',
    '@keyframes rfiPop{from{opacity:0}to{opacity:1}}',
    '.rfi-btnrow{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}',
    '.rfi-ask{width:100%;max-width:520px}',
    '.rfi-palette{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center}',
    '.rfi-pal-label{font-weight:800;font-size:1.1rem}',
    '.rfi-brush{display:inline-flex;align-items:center;gap:8px;font-size:1.1rem;font-weight:800;padding:8px 16px;border-radius:14px;border:3px solid var(--line);background:#fff;color:var(--ink);cursor:pointer}',
    '.rfi-brush.rfi-on{border-color:var(--ink);box-shadow:0 0 0 3px #ffe08a}',
    '.rfi-swatch{display:inline-block;width:26px;height:26px;border-radius:6px}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'reflect-it' }, css));
})();

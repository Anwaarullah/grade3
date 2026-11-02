/* Six Square Designs — build and complete tile designs with one or two lines of symmetry (Unit 17.2). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  /* ------------------------------------------------------------------ *
   * Colours. 't' is the plain orange tile used for shape-only designs.
   * ------------------------------------------------------------------ */
  var PAINT = {
    t: { name: 'Orange', cls: 'ssd-t' },
    r: { name: 'Red', cls: 'ssd-r' },
    y: { name: 'Yellow', cls: 'ssd-y' },
    b: { name: 'Blue', cls: 'ssd-b' },
    g: { name: 'Green', cls: 'ssd-g' },
  };

  /* ------------------------------------------------------------------ *
   * Cell maths. A design is a list of cells { c, r, k } (column, row, colour).
   * A vertical line is stored as s = c + c' for every pair of partner columns
   * (so the line sits at x = (s + 1) / 2 cells); a horizontal line likewise
   * with rows.
   * ------------------------------------------------------------------ */
  function K(c, r) { return c + ',' + r; }
  function fromRows(rows, oc, or) {
    var out = [];
    rows.forEach(function (row, r) {
      for (var c = 0; c < row.length; c++) {
        var ch = row.charAt(c);
        if (ch !== '.') out.push({ c: c + (oc || 0), r: r + (or || 0), k: ch });
      }
    });
    return out;
  }
  function transpose(rows) {
    var out = [];
    for (var c = 0; c < rows[0].length; c++) {
      var s = '';
      for (var r = 0; r < rows.length; r++) s += rows[r].charAt(c);
      out.push(s);
    }
    return out;
  }
  function mapOf(list) {
    var m = {};
    list.forEach(function (x) { m[K(x.c, x.r)] = x; });
    return m;
  }
  function bbox(list) {
    var b = { minC: Infinity, maxC: -Infinity, minR: Infinity, maxR: -Infinity };
    list.forEach(function (x) {
      b.minC = Math.min(b.minC, x.c); b.maxC = Math.max(b.maxC, x.c);
      b.minR = Math.min(b.minR, x.r); b.maxR = Math.max(b.maxR, x.r);
    });
    b.w = b.maxC - b.minC + 1;
    b.h = b.maxR - b.minR + 1;
    return b;
  }
  function mirror(x, axis, s) {
    return axis === 'v' ? { c: s - x.c, r: x.r, k: x.k } : { c: x.c, r: s - x.r, k: x.k };
  }
  // Cells whose partner across the line is missing (or a different colour when useColour).
  function unpaired(list, axis, s, useColour) {
    var m = mapOf(list);
    return list.filter(function (x) {
      var p = mirror(x, axis, s);
      var q = m[K(p.c, p.r)];
      return !q || (useColour && q.k !== x.k);
    });
  }
  function symAbout(list, axis, s, useColour) {
    return list.length > 0 && unpaired(list, axis, s, useColour).length === 0;
  }
  // Lines of symmetry of a design: only up-down and side-to-side lines through
  // the centre of the design's own bounding box can work.
  function linesOf(list, useColour) {
    if (!list.length) return { v: false, h: false, n: 0 };
    var b = bbox(list);
    var sv = b.minC + b.maxC, sh = b.minR + b.maxR;
    var v = symAbout(list, 'v', sv, useColour);
    var h = symAbout(list, 'h', sh, useColour);
    return { v: v, h: h, n: (v ? 1 : 0) + (h ? 1 : 0), sv: sv, sh: sh };
  }
  // Smallest design containing `list` that is symmetrical in all the given lines.
  function closure(list, axes) {
    var m = {};
    list.forEach(function (x) { m[K(x.c, x.r)] = { c: x.c, r: x.r, k: x.k }; });
    var changed = true;
    while (changed) {
      changed = false;
      Object.keys(m).forEach(function (id) {
        axes.forEach(function (a) {
          var p = mirror(m[id], a.axis, a.s);
          if (!m[K(p.c, p.r)]) { m[K(p.c, p.r)] = p; changed = true; }
        });
      });
    }
    return Object.keys(m).map(function (id) { return m[id]; });
  }
  // The cells that are images of x in the lines (x itself included).
  function orbit(x, axes) {
    return closure([x], axes);
  }
  // Groups of tiles joined edge to edge.
  function components(list) {
    var m = mapOf(list), seen = {}, out = [];
    list.forEach(function (x) {
      if (seen[K(x.c, x.r)]) return;
      var comp = [], stack = [x];
      seen[K(x.c, x.r)] = true;
      while (stack.length) {
        var y = stack.pop();
        comp.push(y);
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          var id = K(y.c + d[0], y.r + d[1]);
          if (m[id] && !seen[id]) { seen[id] = true; stack.push(m[id]); }
        });
      }
      out.push(comp);
    });
    return out;
  }
  function connected(list) { return list.length > 0 && components(list).length === 1; }
  function snapOf(list) {
    return list.map(function (x) { return K(x.c, x.r) + (x.k || ''); }).sort().join('|');
  }
  function samePos(a, b) {
    if (a.length !== b.length) return false;
    var m = mapOf(a);
    return b.every(function (x) { return !!m[K(x.c, x.r)]; });
  }

  /* ------------------------------------------------------------------ *
   * Designs (all original). Rows of text; '.' = no tile.
   * ------------------------------------------------------------------ */
  // Level 1: one vertical line (and no horizontal line).
  var V_DESIGNS = [
    ['..t..', '.ttt.', 'tt.tt'],
    ['t...t', 'tt.tt', '.ttt.', '..t..'],
    ['.tt.', 'tttt', 't..t'],
    ['tt..tt', '.tttt.', '..tt..'],
    ['t..t', 'tttt', '.tt.', '.tt.'],
    ['.t.t.', 'ttttt', '..t..'],
  ];
  // Level 1: two lines.
  var BOTH_DESIGNS = [
    ['.t.', 'ttt', '.t.'],
    ['tt.tt', 'ttttt', 'tt.tt'],
    ['.tt.', 'tttt', 'tttt', '.tt.'],
    ['t.t', 'ttt', 't.t'],
    ['..t..', '.ttt.', 'tt.tt', '.ttt.', '..t..'],
    ['tttt', 't..t', 'tttt'],
  ];
  // Level 2: one example answer for each (number of tiles)-(number of lines) target.
  var BUILD_EXAMPLES = {
    '4-1': ['ttt', '.t.'],
    '4-2': ['tt', 'tt'],
    '5-1': ['ttt', '.t.', '.t.'],
    '5-2': ['.t.', 'ttt', '.t.'],
    '6-1': ['tttt', '.tt.'],
    '6-2': ['ttt', 'ttt'],
  };
  // Level 3: colour pictures. Every square is part of the picture unless '.'.
  var PICTURES = [
    { key: 'flag', noun: 'flag', axes: ['v', 'h'], colours: ['b', 'y', 'r'],
      rows: ['bbbbbbb', 'byyryyb', 'brrrrrb', 'byyryyb', 'bbbbbbb'] },
    { key: 'coaster', noun: 'coaster', axes: ['v', 'h'], colours: ['r', 'y', 'b'],
      rows: ['yrrrry', 'rybbyr', 'rybbyr', 'yrrrry'] },
    { key: 'cross-flag', noun: 'flag', axes: ['v', 'h'], colours: ['g', 'y', 'b'],
      rows: ['gggyggg', 'gggyggg', 'yyybyyy', 'gggyggg', 'gggyggg'] },
    { key: 'butterfly', noun: 'butterfly', axes: ['v'], colours: ['r', 'y', 'g'],
      rows: ['rr...rr', 'ryrgryr', 'rrrgrrr', '.yrgry.', '.rrgrr.', '...g...'] },
  ];
  // Level 3: designs with only a vertical line; the child adds the part below a horizontal line.
  var GAIN_DESIGNS = [
    ['.r.', 'ryr', 'rrr'],
    ['b..b', 'byyb', 'bbbb'],
    ['..b..', '.byb.', 'byyyb'],
    ['r.r.r', 'rrrrr', '.yyy.'],
    ['.yy.', 'bbbb', 'b..b'],
  ];

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  function axesFor(list, words) {
    var b = bbox(list);
    return words.map(function (w) { return { axis: w, s: w === 'v' ? b.minC + b.maxC : b.minR + b.maxR }; });
  }

  function makeMissing(rows, words, k) {
    var full = fromRows(rows, 1, 1);
    var b = bbox(full);
    var axes = axesFor(full, words);
    for (var tries = 0; tries < 500; tries++) {
      var gone = U.shuffle(full).slice(0, k);
      var goneMap = mapOf(gone);
      var given = full.filter(function (x) { return !goneMap[K(x.c, x.r)]; });
      if (closure(given, axes).length === full.length) {
        return { type: 'missing', rows: rows, cols: b.w + 2, nrows: b.h + 2, axes: axes, given: given, answer: gone, k: k, full: full };
      }
    }
    return null;
  }

  function makeColour(pic) {
    var full = fromRows(pic.rows, 1, 1);
    var b = bbox(full);
    var axes = axesFor(full, pic.axes);
    var target = U.rand(6, 8);
    var done = {}, blanks = {};
    var count = 0;
    U.shuffle(full).forEach(function (x) {
      if (done[K(x.c, x.r)]) return;
      var orb = orbit(x, axes);
      orb.forEach(function (o) { done[K(o.c, o.r)] = true; });
      if (orb.length < 2 || count >= target) return;
      // Blank all but one square of this group, so one coloured partner always stays.
      var keep = U.pick(orb);
      orb.forEach(function (o) {
        if (o !== keep && count < target) { blanks[K(o.c, o.r)] = true; count++; }
      });
    });
    var full2 = full;
    return {
      type: 'colour', key: pic.key, noun: pic.noun, colours: pic.colours, cols: b.w + 2, nrows: b.h + 2, axes: axes,
      full: full2,
      given: full2.filter(function (x) { return !blanks[K(x.c, x.r)]; }),
      blanks: full2.filter(function (x) { return blanks[K(x.c, x.r)]; }),
    };
  }

  function makeGain(rows) {
    var top = fromRows(rows, 1, 1);
    var w = rows[0].length, h = rows.length;
    var axes = [{ axis: 'v', s: w + 1 }, { axis: 'h', s: 2 * h + 1 }];
    var answer = top.map(function (x) { return mirror(x, 'h', 2 * h + 1); });
    var colours = [];
    top.forEach(function (x) { if (colours.indexOf(x.k) === -1) colours.push(x.k); });
    return { type: 'gain', rows: rows, cols: w + 2, nrows: 2 * h + 2, lineRow: 1 + h, h: h, axes: axes, given: top, answer: answer, colours: colours };
  }

  function buildDeck() {
    var deck = [];
    // Level 1: missing tiles. Vertical line, horizontal line, then both lines.
    var vIdx = U.shuffle(U.range(0, V_DESIGNS.length - 1));
    deck.push(makeMissing(V_DESIGNS[vIdx[0]], ['v'], 1));
    deck.push(makeMissing(transpose(V_DESIGNS[vIdx[1]]), ['h'], U.pick([1, 2])));
    deck.push(makeMissing(U.pick(BOTH_DESIGNS), ['v', 'h'], 2));
    // Level 2: free build. Three different tile counts; both targets appear.
    var ns = U.shuffle([4, 5, 6]);
    var targets = U.shuffle([1, 2, U.pick([1, 2])]);
    ns.forEach(function (n, i) { deck.push({ type: 'build', n: n, lines: targets[i] }); });
    // Level 3: a colour picture, then make a one-line design gain a second line.
    deck.push(makeColour(U.pick(PICTURES)));
    deck.push(makeGain(U.pick(GAIN_DESIGNS)));
    return deck;
  }

  /* ------------------------------------------------------------------ *
   * Drawing helpers
   * ------------------------------------------------------------------ */
  function makeBoard(cols, rows, cell) {
    var g = MQ.ui.grid({ cols: cols, rows: rows, cell: cell, pad: 18, className: 'ssd-grid' });
    g.shade = S('g');
    g.tiles = S('g');
    g.lineG = S('g', { class: 'ssd-lines' });
    g.marks = S('g', { class: 'ssd-marks' });
    g.under.appendChild(g.shade);
    g.layer.appendChild(g.tiles);
    g.layer.appendChild(g.lineG);
    g.layer.appendChild(g.marks);
    return g;
  }
  function tileRect(g, c, r, k, extra) {
    var node = S('rect', { x: g.x(c) + 2, y: g.y(r) + 2, width: g.cell - 4, height: g.cell - 4, rx: 5, class: 'ssd-tile ' + PAINT[k].cls + (extra ? ' ' + extra : '') });
    g.tiles.appendChild(node);
    return node;
  }
  function drawLine(g, axis, s, cls) {
    var pos = (s + 1) / 2;
    var ln = axis === 'v'
      ? S('line', { x1: g.x(pos), y1: g.y(0) - 12, x2: g.x(pos), y2: g.y(g.rows) + 12, class: cls || 'ssd-line' })
      : S('line', { x1: g.x(0) - 12, y1: g.y(pos), x2: g.x(g.cols) + 12, y2: g.y(pos), class: cls || 'ssd-line' });
    g.lineG.appendChild(ln);
    return ln;
  }
  function ring(g, c, r, cls) {
    var m = 3;
    var node = S('rect', { x: g.x(c) + m, y: g.y(r) + m, width: g.cell - 2 * m, height: g.cell - 2 * m, rx: 6, class: cls });
    g.marks.appendChild(node);
    return node;
  }
  function connector(g, a, b) {
    var h = g.cell / 2;
    g.marks.appendChild(S('line', { x1: g.x(a.c) + h, y1: g.y(a.r) + h, x2: g.x(b.c) + h, y2: g.y(b.r) + h, class: 'ssd-link' }));
    [a, b].forEach(function (p) { g.marks.appendChild(S('circle', { cx: g.x(p.c) + h, cy: g.y(p.r) + h, r: 6, class: 'ssd-dot' })); });
  }
  function clearMarks(g) { MQ.clear(g.marks); }

  function lineName(axis) { return axis === 'v' ? 'vertical (up and down)' : 'horizontal (side to side)'; }

  function readoutInto(box, res) {
    MQ.clear(box);
    function chip(label, ok) {
      return el('span', { class: 'ssd-chip ' + (ok ? 'ssd-chip-yes' : 'ssd-chip-no') }, label + (ok ? ' ✓' : ' ✗'));
    }
    box.appendChild(chip('↕ Vertical', res.v));
    box.appendChild(chip('↔ Horizontal', res.h));
    box.appendChild(el('span', { class: 'ssd-total' }, '= ' + res.n + (res.n === 1 ? ' line' : ' lines')));
  }

  function paletteRow(colours, current, onPick) {
    var row = el('div', { class: 'ssd-palette' }, el('span', { class: 'ssd-pal-label' }, 'Colour:'));
    var btns = {};
    colours.forEach(function (k) {
      var b = el('button', { type: 'button', class: 'ssd-brush' + (k === current ? ' ssd-on' : ''), 'data-colour': k },
        el('span', { class: 'ssd-swatch ' + PAINT[k].cls + '-bg' }), PAINT[k].name);
      b.addEventListener('click', function () {
        Object.keys(btns).forEach(function (j) { btns[j].classList.toggle('ssd-on', j === k); });
        MQ.sound('click');
        onPick(k);
      });
      btns[k] = b;
      row.appendChild(b);
    });
    return row;
  }

  function buttons(stage, checkLabel) {
    var checkBtn = el('button', { type: 'button', class: 'btn btn-big ssd-check' }, checkLabel || 'Check ✓');
    var clearBtn = el('button', { type: 'button', class: 'btn btn-ghost ssd-clear' }, 'Start again');
    stage.appendChild(el('div', { class: 'ssd-btnrow' }, clearBtn, checkBtn));
    return { check: checkBtn, clear: clearBtn };
  }

  // Animate with api.later: fn(progress 0..1).
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
   * Learn 1: six tiles in a row have two lines; move one tile and they vanish.
   * ------------------------------------------------------------------ */
  function learnSix(stage, api) {
    api.say('Drag the six tiles into the dotted row.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Six square tiles', 'Drag each tile into the dotted row.'));
    var g = makeBoard(8, 5, 54);
    var ROW = 3;
    for (var c = 1; c <= 6; c++) g.shade.appendChild(S('rect', { x: g.x(c) + 3, y: g.y(ROW) + 3, width: g.cell - 6, height: g.cell - 6, rx: 5, class: 'ssd-slot' }));
    var start = [[0, 0], [2, 0], [4, 1], [5, 0], [7, 1], [1, 1]];
    var tiles = start.map(function (p) { return { c: p[0], r: p[1], k: 't' }; });
    var board = el('div', { class: 'ssd-board' }, g.svg);
    stage.appendChild(board);
    var box = el('div', { class: 'ssd-readout' });
    stage.appendChild(box);
    var phase = 'row';

    function isRow() {
      var r0 = tiles[0].r;
      if (!tiles.every(function (t) { return t.r === r0; })) return false;
      var cs = tiles.map(function (t) { return t.c; }).sort(function (a, b) { return a - b; });
      return cs[5] - cs[0] === 5;
    }
    function occupied(c, r, except) {
      return tiles.some(function (t) { return t !== except && t.c === c && t.r === r; });
    }
    function update() {
      MQ.clear(g.lineG);
      if (phase === 'row') {
        if (isRow()) {
          phase = 'break';
          var res = linesOf(tiles);
          if (res.v) drawLine(g, 'v', res.sv);
          if (res.h) drawLine(g, 'h', res.sh);
          readoutInto(box, res);
          api.sound('correct');
          api.say('A row of 6 has TWO lines of symmetry: up and down, and side to side. Now lift the END tile onto the top of the row.', 'cheer');
          api.feedback('Both halves match across each dashed line. Now drag the end tile so it sits on top of the tile next to it.', 'good');
        } else {
          api.feedback('Tiles in the row: ' + tiles.filter(function (t) { return t.r === ROW && t.c >= 1 && t.c <= 6; }).length + ' of 6', 'info');
        }
        return;
      }
      if (!connected(tiles)) {
        MQ.clear(box);
        box.appendChild(el('span', { class: 'ssd-total' }, 'The tiles must touch edge to edge.'));
        if (phase === 'break') api.say('That tile is not touching the others. Put it on top of the row, touching a tile.', 'think');
        return;
      }
      var r2 = linesOf(tiles);
      if (r2.v) drawLine(g, 'v', r2.sv);
      if (r2.h) drawLine(g, 'h', r2.sh);
      readoutInto(box, r2);
      if (phase === 'break' && r2.n === 0) {
        phase = 'done';
        api.say('One tile moved, and both lines are gone! No fold makes the halves match now.', 'cheer');
        api.feedback('Every tile needs a partner across the line. Moving one tile can break the symmetry.', 'good');
        api.unlockNext();
      } else if (phase === 'break' && r2.n === 1) {
        api.say('Now it has 1 line. Try putting the END tile on top of the row instead.', 'think');
      } else if (phase === 'break' && r2.n === 2) {
        api.say('Two lines again. Now put the END tile on top of the row.', 'think');
      }
    }

    tiles.forEach(function (t) {
      t.node = tileRect(g, t.c, t.r, 't', 'ssd-drag');
      var unbind = MQ.ui.drag(g.svg, t.node, {
        move: function (p, dx, dy) { t.node.setAttribute('transform', 'translate(' + dx + ',' + dy + ')'); },
        end: function (p) {
          t.node.removeAttribute('transform');
          var cell = g.cellAt(p);
          if (cell && !occupied(cell.c, cell.r, t) && (cell.c !== t.c || cell.r !== t.r)) {
            t.c = cell.c;
            t.r = cell.r;
            t.node.setAttribute('x', g.x(t.c) + 2);
            t.node.setAttribute('y', g.y(t.r) + 2);
            MQ.sound('pop');
            update();
          }
        },
      });
      api.cleanup(unbind);
    });
    update();
  }

  /* ------------------------------------------------------------------ *
   * Learn 2: pattern blocks with a vertical line; find the horizontal line by folding.
   * ------------------------------------------------------------------ */
  function learnBlocks(stage, api) {
    api.say('This design has an up-and-down line. Can you find a side-to-side line too?', 'think');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Find the side-to-side line', 'Move the green line with ▲ ▼ or drag it. Then press <b>Fold</b>.'));
    var s = 50, h = s * Math.sqrt(3) / 2;
    function hex(cx) {
      var pts = [];
      for (var i = 0; i < 6; i++) {
        var a = (-90 + 60 * i) * Math.PI / 180;
        pts.push([cx + s * Math.cos(a), s * Math.sin(a)]);
      }
      return pts;
    }
    function rhomb(x0, sy) { // sy = -1 above, +1 below
      return [[x0, sy * s], [x0 + h, sy * s / 2], [x0 + 2 * h, sy * s], [x0 + h, sy * 1.5 * s]];
    }
    var shapes = [
      { pts: hex(-2 * h), k: 'y' }, { pts: hex(0), k: 'r' }, { pts: hex(2 * h), k: 'y' },
      { pts: rhomb(-2 * h, -1), k: 'b' }, { pts: rhomb(0, -1), k: 'b' },
      { pts: rhomb(-2 * h, 1), k: 'b' }, { pts: rhomb(0, 1), k: 'b' },
    ];
    function poly(sh, cls) {
      return S('polygon', { points: sh.pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '), class: cls + ' ' + PAINT[sh.k].cls });
    }
    var root = S('svg', { viewBox: '-185 -120 370 240', class: 'ssd-blocks', width: 518, height: 336, style: { maxWidth: '100%', height: 'auto' } });
    var design = S('g');
    shapes.forEach(function (sh) { design.appendChild(poly(sh, 'ssd-block')); });
    root.appendChild(design);
    root.appendChild(S('line', { x1: 0, y1: -112, x2: 0, y2: 112, class: 'ssd-line' }));
    var ghost = S('g', { class: 'ssd-ghostg' });
    root.appendChild(ghost);
    var POS = [-75, -50, -25, 0, 25, 50, 75];
    var pi = 1;
    var lineG = S('g', { class: 'ssd-moveline' });
    var hl = S('line', { x1: -178, x2: 178, y1: 0, y2: 0, class: 'ssd-hline' });
    var hit = S('rect', { x: -180, y: -14, width: 360, height: 28, class: 'ssd-hit' });
    lineG.appendChild(hit);
    lineG.appendChild(hl);
    root.appendChild(lineG);
    stage.appendChild(el('div', { class: 'ssd-board' }, root));
    var tag = el('div', { class: 'ssd-tag' }, ' ');
    stage.appendChild(tag);
    var upBtn = el('button', { type: 'button', class: 'btn ssd-small' }, '▲ Up');
    var downBtn = el('button', { type: 'button', class: 'btn ssd-small' }, '▼ Down');
    var foldBtn = el('button', { type: 'button', class: 'btn btn-big' }, 'Fold ↕');
    stage.appendChild(el('div', { class: 'ssd-btnrow' }, upBtn, downBtn, foldBtn));
    var busy = false, solved = false;

    function place() {
      lineG.setAttribute('transform', 'translate(0,' + POS[pi] + ')');
      MQ.clear(ghost);
      ghost.removeAttribute('transform');
      tag.textContent = ' ';
      tag.className = 'ssd-tag';
    }
    function moveTo(i) {
      if (busy || solved) return;
      i = U.clamp(i, 0, POS.length - 1);
      if (i !== pi) { pi = i; MQ.sound('click'); }
      place();
    }
    upBtn.addEventListener('click', function () { moveTo(pi - 1); });
    downBtn.addEventListener('click', function () { moveTo(pi + 1); });
    var unbind = MQ.ui.drag(root, lineG, {
      move: function (p) {
        var best = 0;
        POS.forEach(function (y, i) { if (Math.abs(y - p.y) < Math.abs(POS[best] - p.y)) best = i; });
        if (best !== pi) moveTo(best);
      },
    });
    api.cleanup(unbind);

    foldBtn.addEventListener('click', function () {
      if (busy || solved) return;
      busy = true;
      MQ.sound('click');
      MQ.clear(ghost);
      shapes.forEach(function (sh) { ghost.appendChild(poly(sh, 'ssd-ghost')); });
      var L = POS[pi];
      animate(api, 12, 55, function (p) {
        var sc = 1 - 2 * p;
        if (Math.abs(sc) < 0.02) sc = 0.02;
        ghost.setAttribute('transform', 'translate(0,' + L + ') scale(1,' + sc + ') translate(0,' + -L + ')');
      }, function () {
        busy = false;
        if (L === 0) {
          solved = true;
          tag.textContent = '✓ Every block lands on a matching block';
          tag.className = 'ssd-tag ssd-tag-good';
          api.sound('correct');
          api.say('Yes! Top and bottom match, shape AND colour. This design has 2 lines of symmetry.', 'cheer');
          api.feedback('2 lines: one vertical (up and down) and one horizontal (side to side).', 'good');
          api.unlockNext();
        } else {
          tag.textContent = '✗ The folded blocks do not match';
          tag.className = 'ssd-tag ssd-tag-bad';
          api.sound('wrong');
          api.say('The dotted copy does not sit on the blocks. Move the line ' + (L < 0 ? 'down' : 'up') + ' and fold again.', 'oops');
        }
      });
    });
    place();
  }

  /* ------------------------------------------------------------------ *
   * Learn 3: four-quarter canvas. Paint one quarter; it reflects into all four.
   * ------------------------------------------------------------------ */
  function learnQuarters(stage, api) {
    api.say('Paint squares in the top-left corner. Watch the other three corners!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Two lines, four matching corners', 'Paint at least 3 squares in the shaded corner.'));
    var N = 6, axes = [{ axis: 'v', s: N - 1 }, { axis: 'h', s: N - 1 }];
    var colours = ['r', 'b', 'y'];
    var brush = 'r';
    stage.appendChild(paletteRow(colours, brush, function (k) { brush = k; }));
    var g = makeBoard(N, N, 50);
    g.svg.classList.add('ssd-play');
    g.shade.appendChild(S('rect', { x: g.x(0), y: g.y(0), width: 3 * g.cell, height: 3 * g.cell, class: 'ssd-side' }));
    axes.forEach(function (a) { drawLine(g, a.axis, a.s); });
    stage.appendChild(el('div', { class: 'ssd-board' }, g.svg));
    var box = el('div', { class: 'ssd-readout' });
    stage.appendChild(box);
    var oddBtn = el('button', { type: 'button', class: 'btn', disabled: true }, 'Change one colour 🎨');
    var fixBtn = el('button', { type: 'button', class: 'btn btn-ghost', disabled: true }, 'Fix it');
    stage.appendChild(el('div', { class: 'ssd-btnrow' }, oddBtn, fixBtn));
    var cells = {}; // id -> {c, r, k, node}
    var odd = null, demoDone = false;

    function setCell(c, r, k) {
      var id = K(c, r);
      if (cells[id]) { g.tiles.removeChild(cells[id].node); delete cells[id]; }
      if (k) cells[id] = { c: c, r: r, k: k, node: tileRect(g, c, r, k, 'ssd-pop') };
    }
    function list() { return Object.keys(cells).map(function (id) { return cells[id]; }); }
    function quarterCount() { return list().filter(function (x) { return x.c < 3 && x.r < 3; }).length; }
    function update() {
      var l = list();
      if (!l.length) { MQ.clear(box); return; }
      var v = symAbout(l, 'v', N - 1, true), h = symAbout(l, 'h', N - 1, true);
      readoutInto(box, { v: v, h: h, n: (v ? 1 : 0) + (h ? 1 : 0) });
      oddBtn.disabled = quarterCount() < 3 || !!odd;
      fixBtn.disabled = !odd;
    }

    g.svg.addEventListener('click', function (e) {
      var p = g.cellAt(MQ.ui.svgPoint(g.svg, e));
      if (!p) return;
      if (p.c >= 3 || p.r >= 3) {
        api.feedback('Paint in the shaded top-left corner. Bolt copies it for you.', 'info');
        return;
      }
      clearMarks(g);
      if (odd) { setCell(odd.c, odd.r, odd.k); odd = null; }
      var cur = cells[K(p.c, p.r)];
      var k = cur && cur.k === brush ? null : brush;
      orbit({ c: p.c, r: p.r }, axes).forEach(function (o) { setCell(o.c, o.r, k); });
      MQ.sound('pop');
      update();
      if (quarterCount() >= 3 && !demoDone) {
        api.say('Every square has partners across both lines. Now press "Change one colour".', 'happy');
      }
    });

    oddBtn.addEventListener('click', function () {
      var l = list().filter(function (x) { return x.c < 3 && x.r < 3; });
      if (!l.length || odd) return;
      var src = U.pick(l);
      var c = N - 1 - src.c, r = N - 1 - src.r;
      var other = colours.filter(function (k) { return k !== src.k; })[0];
      odd = { c: c, r: r, k: src.k };
      setCell(c, r, other);
      clearMarks(g);
      ring(g, c, r, 'ssd-bad');
      ring(g, src.c, N - 1 - src.r, 'ssd-need');
      ring(g, N - 1 - src.c, src.r, 'ssd-need');
      MQ.sound('wrong');
      update();
      demoDone = true;
      api.say('Same shape, but one colour is different. Now BOTH lines are broken! Colours must match too.', 'oops');
      api.feedback('The ringed square does not match its partners across the lines.', 'try');
      api.unlockNext();
    });
    fixBtn.addEventListener('click', function () {
      if (!odd) return;
      setCell(odd.c, odd.r, odd.k);
      odd = null;
      clearMarks(g);
      MQ.sound('correct');
      update();
      api.say('Fixed! Same shapes and same colours, so both lines are back.', 'cheer');
      api.feedback('Two lines: all four corners match, colours too.', 'good');
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice
   * ------------------------------------------------------------------ */
  var deck = null;

  function axesWords(axes) {
    if (axes.length === 2) return 'both dashed lines';
    return 'the ' + (axes[0].axis === 'v' ? 'vertical' : 'horizontal') + ' dashed line';
  }

  // Level 1: click where the missing tile(s) go.
  function renderMissing(stage, api, q) {
    var two = q.axes.length === 2;
    api.say((q.k === 1 ? 'One tile is missing.' : 'Two tiles are missing.') + ' Fold the design in your head. Where do they go?', 'think');
    stage.appendChild(MQ.ui.prompt('Click where the <b>' + q.k + ' missing tile' + (q.k > 1 ? 's go' : ' goes') + '</b> so the design is symmetrical in ' + axesWords(q.axes) + '.'));
    var cell = Math.min(56, Math.floor(400 / Math.max(q.cols, q.nrows)));
    var g = makeBoard(q.cols, q.nrows, cell);
    g.svg.classList.add('ssd-play');
    var givenMap = mapOf(q.given);
    q.given.forEach(function (x) { tileRect(g, x.c, x.r, 't'); });
    q.axes.forEach(function (a) { drawLine(g, a.axis, a.s); });
    stage.appendChild(el('div', { class: 'ssd-board' }, g.svg));
    var btns = buttons(stage);
    var placed = {};
    var lastChecked = null;

    function childList() { return Object.keys(placed).map(function (id) { return { c: placed[id].c, r: placed[id].r, k: 't' }; }); }
    g.svg.addEventListener('click', function (e) {
      if (api.isAnswered()) return;
      var p = g.cellAt(MQ.ui.svgPoint(g.svg, e));
      if (!p) return;
      var id = K(p.c, p.r);
      if (givenMap[id]) { api.feedback('That tile is already there. Click an empty square.', 'info'); return; }
      clearMarks(g);
      if (placed[id]) { g.tiles.removeChild(placed[id].node); delete placed[id]; }
      else placed[id] = { c: p.c, r: p.r, node: tileRect(g, p.c, p.r, 't', 'ssd-new ssd-pop') };
      MQ.sound('pop');
    });
    btns.clear.addEventListener('click', function () {
      if (api.isAnswered()) return;
      Object.keys(placed).forEach(function (id) { g.tiles.removeChild(placed[id].node); });
      placed = {};
      clearMarks(g);
    });
    btns.check.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var child = childList();
      if (!child.length) { api.feedback('Click an empty square to put a tile there.', 'info'); return; }
      if (child.length !== q.k) {
        api.feedback(q.k === 1 ? 'Only 1 tile is missing. You have put ' + child.length + '.' : '2 tiles are missing. You have put ' + child.length + '.', 'info');
        return;
      }
      var snap = snapOf(child);
      if (snap === lastChecked) { api.feedback('Move a tile first, then press Check again.', 'info'); return; }
      clearMarks(g);
      var all = q.given.concat(child);
      var okEach = q.axes.map(function (a) { return symAbout(all, a.axis, a.s); });
      if (okEach.every(Boolean)) {
        btns.check.disabled = true;
        btns.clear.disabled = true;
        api.check(true, 'Yes! Every tile has a mirror partner.');
        return;
      }
      lastChecked = snap;
      var tag = two && okEach.some(Boolean) ? 'Only one line when two were needed' : 'Tile has no mirror partner';
      var hint;
      if (two && okEach[0] && !okEach[1]) hint = 'Left and right match now. But fold top onto bottom: some tiles have no partner there.';
      else if (two && !okEach[0] && okEach[1]) hint = 'Top and bottom match now. But fold left onto right: some tiles have no partner there.';
      else hint = 'Fold along the dashed line in your head. A tile on one side needs a partner the same distance away on the other side.';
      if (api.tries() >= 1) {
        var bad = {};
        q.axes.forEach(function (a) { unpaired(all, a.axis, a.s).forEach(function (x) { bad[K(x.c, x.r)] = x; }); });
        Object.keys(bad).forEach(function (id) { ring(g, bad[id].c, bad[id].r, 'ssd-bad'); });
        hint = 'The red-ringed tiles have no partner across the line. Count squares from the line and put the partner there.';
      }
      api.check(false, hint, tag);
    });
    api.onReveal(function () {
      Object.keys(placed).forEach(function (id) { g.tiles.removeChild(placed[id].node); });
      placed = {};
      clearMarks(g);
      btns.check.disabled = true;
      btns.clear.disabled = true;
      var all = q.given;
      q.answer.forEach(function (x, i) {
        api.later(function () {
          tileRect(g, x.c, x.r, 't', 'ssd-ans ssd-pop');
          // Show a partner tile that is already there.
          var partner = null;
          q.axes.forEach(function (a) {
            var p = mirror(x, a.axis, a.s);
            if (!partner && mapOf(all)[K(p.c, p.r)]) partner = p;
          });
          if (!partner && two) {
            var p2 = mirror(mirror(x, 'v', q.axes[0].s), 'h', q.axes[1].s);
            if (mapOf(all)[K(p2.c, p2.r)]) partner = p2;
          }
          ring(g, x.c, x.r, 'ssd-goodring');
          if (partner) { ring(g, partner.c, partner.r, 'ssd-goodring'); connector(g, x, partner); }
        }, 250 * i);
      });
      api.feedback('Each green tile is the mirror partner of a tile across the line: same row or column, same number of squares from the line.', 'info');
    });
  }

  // Level 2: free build with N tiles and a target number of lines.
  function renderBuild(stage, api, q) {
    var N = 6;
    api.say('Make a design with ' + q.n + ' tiles and ' + (q.lines === 1 ? 'exactly ONE line of symmetry.' : 'TWO lines of symmetry.'), 'think');
    stage.appendChild(MQ.ui.prompt('Use <b>' + q.n + ' tiles</b> joined edge to edge. Make <b>' + (q.lines === 1 ? 'exactly 1 line' : '2 lines') + '</b> of symmetry.'));
    var g = makeBoard(N, N, 54);
    g.svg.classList.add('ssd-play');
    stage.appendChild(el('div', { class: 'ssd-board' }, g.svg));
    var count = el('div', { class: 'ssd-count' });
    var box = el('div', { class: 'ssd-readout' });
    stage.appendChild(count);
    stage.appendChild(box);
    var btns = buttons(stage);
    var placed = {};
    var lastChecked = null;

    function list() { return Object.keys(placed).map(function (id) { return { c: placed[id].c, r: placed[id].r, k: 't' }; }); }
    function showCount() { count.textContent = 'Tiles: ' + Object.keys(placed).length + ' of ' + q.n; }
    function clearAll() {
      Object.keys(placed).forEach(function (id) { g.tiles.removeChild(placed[id].node); });
      placed = {};
      clearMarks(g);
      MQ.clear(g.lineG);
      MQ.clear(box);
      showCount();
    }
    g.svg.addEventListener('click', function (e) {
      if (api.isAnswered()) return;
      var p = g.cellAt(MQ.ui.svgPoint(g.svg, e));
      if (!p) return;
      var id = K(p.c, p.r);
      clearMarks(g);
      MQ.clear(g.lineG);
      MQ.clear(box);
      if (placed[id]) { g.tiles.removeChild(placed[id].node); delete placed[id]; }
      else {
        if (Object.keys(placed).length >= q.n) { api.feedback('You have used all ' + q.n + ' tiles. Click a tile to pick it up first.', 'info'); showCount(); return; }
        placed[id] = { c: p.c, r: p.r, node: tileRect(g, p.c, p.r, 't', 'ssd-pop') };
      }
      MQ.sound('pop');
      showCount();
    });
    btns.clear.addEventListener('click', function () { if (!api.isAnswered()) clearAll(); });
    btns.check.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var l = list();
      if (!l.length) { api.feedback('Click squares on the grid to put tiles down.', 'info'); return; }
      if (l.length !== q.n) { api.feedback('Use exactly ' + q.n + ' tiles. You have ' + l.length + '.', 'info'); return; }
      var snap = snapOf(l);
      if (snap === lastChecked) { api.feedback('Change your design first, then press Check again.', 'info'); return; }
      clearMarks(g);
      MQ.clear(g.lineG);
      var second = api.tries() >= 1;
      if (!connected(l)) {
        lastChecked = snap;
        MQ.clear(box);
        var hintJ = 'Some tiles are not joined. Each tile must share a whole side with another tile. Touching corners is not enough.';
        if (second) {
          var comps = components(l).sort(function (a, b) { return b.length - a.length; });
          comps.slice(1).forEach(function (cp) { cp.forEach(function (x) { ring(g, x.c, x.r, 'ssd-bad'); }); });
          hintJ = 'The red-ringed tiles are not joined to the others. Move them so they share a side.';
        }
        api.check(false, hintJ, 'Tiles not joined edge to edge');
        return;
      }
      var res = linesOf(l);
      if (res.v) drawLine(g, 'v', res.sv);
      if (res.h) drawLine(g, 'h', res.sh);
      readoutInto(box, res);
      if (res.n === q.lines) {
        btns.check.disabled = true;
        btns.clear.disabled = true;
        api.check(true, res.n === 2 ? 'Two lines! Both folds match.' : 'Exactly one line: ' + (res.v ? 'vertical' : 'horizontal') + '. Great designing!');
        return;
      }
      lastChecked = snap;
      var hint, tag;
      if (q.lines === 2 && res.n === 1) {
        tag = 'Only one line when two were needed';
        hint = res.v ? 'Left and right match. Now make the top and bottom match too.' : 'Top and bottom match. Now make the left and right match too.';
        if (second) {
          var ax = res.v ? 'h' : 'v';
          drawLine(g, ax, ax === 'v' ? res.sv : res.sh, 'ssd-line ssd-testline');
          unpaired(l, ax, ax === 'v' ? res.sv : res.sh).forEach(function (x) { ring(g, x.c, x.r, 'ssd-bad'); });
          hint = 'The red-ringed tiles have no partner across the grey line. Try a shape like a rectangle or a plus.';
        }
      } else if (q.lines === 1 && res.n === 2) {
        tag = 'Made two lines when one was asked';
        hint = 'This design has 2 lines! Move one tile so only one fold works.';
        if (second) hint = 'Both lines work. Move tiles so left and right still match, but the top and bottom are different (like a letter T).';
      } else {
        tag = 'Tile has no mirror partner';
        hint = 'No line works yet. Fold it in your head: every tile needs a partner on the other side.';
        if (second) {
          var bv = unpaired(l, 'v', res.sv), bh = unpaired(l, 'h', res.sh);
          var useV = bv.length <= bh.length;
          drawLine(g, useV ? 'v' : 'h', useV ? res.sv : res.sh, 'ssd-line ssd-testline');
          (useV ? bv : bh).forEach(function (x) { ring(g, x.c, x.r, 'ssd-bad'); });
          hint = 'Look at the grey middle line. The red-ringed tiles have no partner across it.';
        }
      }
      api.check(false, hint, tag);
    });
    api.onReveal(function () {
      clearAll();
      btns.check.disabled = true;
      btns.clear.disabled = true;
      var rows = BUILD_EXAMPLES[q.n + '-' + q.lines];
      var ex = fromRows(rows, Math.floor((N - rows[0].length) / 2), Math.floor((N - rows.length) / 2));
      ex.forEach(function (x) { placed[K(x.c, x.r)] = { c: x.c, r: x.r, node: tileRect(g, x.c, x.r, 't', 'ssd-ans ssd-pop') }; });
      showCount();
      var res = linesOf(ex);
      if (res.v) drawLine(g, 'v', res.sv);
      if (res.h) drawLine(g, 'h', res.sh);
      readoutInto(box, res);
      api.feedback('Here is one way: ' + q.n + ' tiles. ' + (res.n === 2 ? 'Left matches right AND top matches bottom: 2 lines.' : 'Left matches right, but top and bottom are different: 1 line.'), 'info');
    });
    showCount();
  }

  // Level 3a: colour the blank squares so the colours are symmetrical too.
  function renderColour(stage, api, q) {
    var two = q.axes.length === 2;
    api.say('Paint the white squares. The colours must match across ' + (two ? 'BOTH lines.' : 'the line.'), 'think');
    stage.appendChild(MQ.ui.prompt('Colour the white squares so the ' + q.noun + ' is symmetrical in ' + axesWords(q.axes) + ', <b>colours too</b>.'));
    var brush = q.colours[0];
    stage.appendChild(paletteRow(q.colours, brush, function (k) { brush = k; }));
    var cell = Math.min(54, Math.floor(420 / Math.max(q.cols, q.nrows)));
    var g = makeBoard(q.cols, q.nrows, cell);
    g.svg.classList.add('ssd-play');
    var givenMap = mapOf(q.given), blankMap = mapOf(q.blanks);
    q.given.forEach(function (x) { tileRect(g, x.c, x.r, x.k); });
    q.blanks.forEach(function (x) {
      g.tiles.appendChild(S('rect', { x: g.x(x.c) + 2, y: g.y(x.r) + 2, width: g.cell - 4, height: g.cell - 4, rx: 5, class: 'ssd-blank' }));
    });
    q.axes.forEach(function (a) { drawLine(g, a.axis, a.s); });
    stage.appendChild(el('div', { class: 'ssd-board' }, g.svg));
    var btns = buttons(stage);
    var painted = {};
    var lastChecked = null;

    function setCell(c, r, k) {
      var id = K(c, r);
      if (painted[id]) { g.tiles.removeChild(painted[id].node); delete painted[id]; }
      if (k) painted[id] = { c: c, r: r, k: k, node: tileRect(g, c, r, k, 'ssd-pop') };
    }
    function list() { return Object.keys(painted).map(function (id) { return { c: painted[id].c, r: painted[id].r, k: painted[id].k }; }); }
    g.svg.addEventListener('click', function (e) {
      if (api.isAnswered()) return;
      var p = g.cellAt(MQ.ui.svgPoint(g.svg, e));
      if (!p) return;
      var id = K(p.c, p.r);
      if (givenMap[id]) { api.feedback('That square is already coloured. Paint the white squares.', 'info'); return; }
      if (!blankMap[id]) { api.feedback('That square is not part of the ' + q.noun + '.', 'info'); return; }
      clearMarks(g);
      var cur = painted[id];
      setCell(p.c, p.r, cur && cur.k === brush ? null : brush);
      MQ.sound('pop');
    });
    btns.clear.addEventListener('click', function () {
      if (api.isAnswered()) return;
      Object.keys(painted).forEach(function (id) { setCell(painted[id].c, painted[id].r, null); });
      clearMarks(g);
    });
    btns.check.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var l = list();
      var left = q.blanks.length - l.length;
      if (left > 0) { api.feedback('Paint every white square first. ' + left + (left === 1 ? ' square is' : ' squares are') + ' still white.', 'info'); return; }
      var snap = snapOf(l);
      if (snap === lastChecked) { api.feedback('Change a colour first, then press Check again.', 'info'); return; }
      clearMarks(g);
      var all = q.given.concat(l);
      var okEach = q.axes.map(function (a) { return symAbout(all, a.axis, a.s, true); });
      if (okEach.every(Boolean)) {
        btns.check.disabled = true;
        btns.clear.disabled = true;
        api.check(true, 'Beautiful! Every square matches its partner, colour and all.');
        return;
      }
      lastChecked = snap;
      var hint;
      if (two && okEach[0] !== okEach[1]) {
        hint = okEach[0] ? 'Left and right match, but top and bottom do not. Compare the colours above and below the side-to-side line.'
          : 'Top and bottom match, but left and right do not. Compare the colours on each side of the up-and-down line.';
      } else {
        hint = 'The shape is right, but some colours do not match. Each square must be the same colour as its partner across the line.';
      }
      if (api.tries() >= 1) {
        var bad = {};
        q.axes.forEach(function (a) {
          unpaired(all, a.axis, a.s, true).forEach(function (x) { if (painted[K(x.c, x.r)]) bad[K(x.c, x.r)] = x; });
        });
        Object.keys(bad).forEach(function (id) { ring(g, bad[id].c, bad[id].r, 'ssd-bad'); });
        hint = 'The red-ringed squares are a different colour from their partner across the dashed line. Look across the line and copy that colour.';
      }
      api.check(false, hint, 'Colours did not match');
    });
    api.onReveal(function () {
      Object.keys(painted).forEach(function (id) { setCell(painted[id].c, painted[id].r, null); });
      clearMarks(g);
      btns.check.disabled = true;
      btns.clear.disabled = true;
      q.blanks.forEach(function (x, i) {
        api.later(function () {
          tileRect(g, x.c, x.r, x.k, 'ssd-pop');
          ring(g, x.c, x.r, 'ssd-goodring');
          var partner = null;
          orbit(x, q.axes).forEach(function (o) {
            if (!partner && givenMap[K(o.c, o.r)]) partner = o;
          });
          if (partner) connector(g, x, partner);
        }, 160 * i);
      });
      api.feedback('Each painted square copies the colour of its partner across the line' + (two ? 's' : '') + ' (follow the dotted links).', 'info');
    });
  }

  // Level 3b: a one-line design; add tiles below the horizontal line so it gains a second line.
  function renderGain(stage, api, q) {
    api.say('This design has an up-and-down line. Add tiles below the side-to-side line to give it a second line!', 'think');
    stage.appendChild(MQ.ui.prompt('Add tiles in the shaded part so the design is symmetrical in <b>both</b> dashed lines.'));
    var brush = q.colours[0];
    if (q.colours.length > 1) stage.appendChild(paletteRow(q.colours, brush, function (k) { brush = k; }));
    var cell = Math.min(52, Math.floor(420 / Math.max(q.cols, q.nrows)));
    var g = makeBoard(q.cols, q.nrows, cell);
    g.svg.classList.add('ssd-play');
    g.shade.appendChild(S('rect', { x: g.x(0), y: g.y(q.lineRow), width: q.cols * g.cell, height: (q.nrows - q.lineRow) * g.cell, class: 'ssd-side' }));
    q.given.forEach(function (x) { tileRect(g, x.c, x.r, x.k); });
    q.axes.forEach(function (a) { drawLine(g, a.axis, a.s); });
    stage.appendChild(el('div', { class: 'ssd-board' }, g.svg));
    var btns = buttons(stage);
    var painted = {};
    var lastChecked = null;

    function setCell(c, r, k) {
      var id = K(c, r);
      if (painted[id]) { g.tiles.removeChild(painted[id].node); delete painted[id]; }
      if (k) painted[id] = { c: c, r: r, k: k, node: tileRect(g, c, r, k, 'ssd-pop') };
    }
    function list() { return Object.keys(painted).map(function (id) { return { c: painted[id].c, r: painted[id].r, k: painted[id].k }; }); }
    g.svg.addEventListener('click', function (e) {
      if (api.isAnswered()) return;
      var p = g.cellAt(MQ.ui.svgPoint(g.svg, e));
      if (!p) return;
      if (p.r < q.lineRow) { api.feedback('Put your tiles in the shaded part, below the side-to-side line.', 'info'); return; }
      clearMarks(g);
      var cur = painted[K(p.c, p.r)];
      setCell(p.c, p.r, cur && cur.k === brush ? null : brush);
      MQ.sound('pop');
    });
    btns.clear.addEventListener('click', function () {
      if (api.isAnswered()) return;
      Object.keys(painted).forEach(function (id) { setCell(painted[id].c, painted[id].r, null); });
      clearMarks(g);
    });
    btns.check.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var l = list();
      if (!l.length) { api.feedback('Click squares in the shaded part to add tiles.', 'info'); return; }
      var snap = snapOf(l);
      if (snap === lastChecked) { api.feedback('Change some tiles first, then press Check again.', 'info'); return; }
      clearMarks(g);
      var all = q.given.concat(l);
      var okEach = q.axes.map(function (a) { return symAbout(all, a.axis, a.s, true); });
      if (okEach.every(Boolean)) {
        btns.check.disabled = true;
        btns.clear.disabled = true;
        api.check(true, 'Now it has 2 lines: vertical and horizontal!');
        return;
      }
      lastChecked = snap;
      var ansMap = mapOf(q.answer), childMap = mapOf(l);
      var hint, tag;
      var slid = q.given.map(function (x) { return { c: x.c, r: x.r + q.h, k: x.k }; });
      if (samePos(l, q.answer)) {
        tag = 'Colours did not match';
        hint = 'The tiles are in the right places! But some colours do not match their partner above the line.';
      } else if (samePos(l, slid) && !samePos(slid, q.answer)) {
        tag = 'Slid the design instead of flipping it';
        hint = 'Your copy is the same way up. A mirror flips it: the row touching the line must match the row on the other side of the line.';
      } else {
        tag = 'Tile has no mirror partner';
        var missing = q.answer.filter(function (x) { return !childMap[K(x.c, x.r)]; }).length;
        var extra = l.filter(function (x) { return !ansMap[K(x.c, x.r)]; }).length;
        hint = missing && !extra ? 'Some tiles above the line still have no partner below it.'
          : 'Some of your tiles have no partner above the line. Fold top onto bottom in your head.';
      }
      if (api.tries() >= 1) {
        l.forEach(function (x) {
          var a = ansMap[K(x.c, x.r)];
          if (!a || a.k !== x.k) ring(g, x.c, x.r, 'ssd-bad');
        });
        q.given.forEach(function (x) {
          var m = mirror(x, 'h', q.axes[1].s);
          var cm = childMap[K(m.c, m.r)];
          if (!cm) ring(g, x.c, x.r, 'ssd-need');
        });
        hint = 'Red rings: tiles in the wrong place or colour. Dashed rings: tiles above the line that still need a partner below it, the same distance from the line.';
      }
      api.check(false, hint, tag);
    });
    api.onReveal(function () {
      Object.keys(painted).forEach(function (id) { setCell(painted[id].c, painted[id].r, null); });
      clearMarks(g);
      btns.check.disabled = true;
      btns.clear.disabled = true;
      var hs = q.axes[1].s;
      q.answer.forEach(function (x, i) {
        api.later(function () {
          tileRect(g, x.c, x.r, x.k, 'ssd-pop');
          ring(g, x.c, x.r, 'ssd-goodring');
        }, 130 * i);
      });
      // Link one column of partners so the flip is easy to see.
      var mid = q.given.filter(function (x) { return x.c === q.given[0].c; });
      mid.forEach(function (x) { connector(g, x, mirror(x, 'h', hs)); });
      api.feedback('Each tile is flipped over the side-to-side line: the row touching the line is copied first, then the next row, the same colours.', 'info');
    });
  }

  function renderQuestion(stage, api) {
    if (!deck || api.index === 0 || !deck[api.index]) deck = buildDeck();
    var q = deck[api.index];
    if (q.type === 'missing') renderMissing(stage, api, q);
    else if (q.type === 'build') renderBuild(stage, api, q);
    else if (q.type === 'colour') renderColour(stage, api, q);
    else renderGain(stage, api, q);
  }

  MQ.register('six-square-designs', {
    learn: [learnSix, learnBlocks, learnQuarters],
    practice: { count: 8, render: renderQuestion },
    // Used only by development tests.
    _dev: {
      buildDeck: buildDeck,
      deck: function () { return deck; },
      linesOf: linesOf,
      symAbout: symAbout,
      closure: closure,
      connected: connected,
      fromRows: fromRows,
      examples: BUILD_EXAMPLES,
      pictures: PICTURES,
      gain: GAIN_DESIGNS,
      vDesigns: V_DESIGNS,
      bothDesigns: BOTH_DESIGNS,
    },
  });

  var css = [
    '.ssd-board{width:100%;display:flex;justify-content:center}',
    '.ssd-grid,.ssd-blocks{display:block;max-width:100%;height:auto}',
    '.ssd-play{cursor:pointer}',
    '.ssd-side{fill:#fff6d9}',
    '.ssd-slot{fill:none;stroke:#9aa7c7;stroke-width:3;stroke-dasharray:5 5}',
    '.ssd-tile{stroke:rgba(0,0,0,.28);stroke-width:2}',
    '.ssd-drag{cursor:grab}',
    '.ssd-drag.dragging{cursor:grabbing;opacity:.85}',
    '.ssd-t{fill:#f4a020}',
    '.ssd-r{fill:#e5484d}',
    '.ssd-y{fill:#f7d046}',
    '.ssd-b{fill:#4f7fe8}',
    '.ssd-g{fill:#2fb36d}',
    '.ssd-t-bg{background:#f4a020}',
    '.ssd-r-bg{background:#e5484d}',
    '.ssd-y-bg{background:#f7d046}',
    '.ssd-b-bg{background:#4f7fe8}',
    '.ssd-g-bg{background:#2fb36d}',
    '.ssd-new{fill:#ffc061;stroke:#b35c00;stroke-width:3}',
    '.ssd-ans{fill:#7ad3a0;stroke:#1f7a4c;stroke-width:3}',
    '.ssd-blank{fill:#fff;stroke:#9aa7c7;stroke-width:2;stroke-dasharray:4 4}',
    '.ssd-line{stroke:#7b2cbf;stroke-width:5;stroke-dasharray:12 7;stroke-linecap:round;pointer-events:none}',
    '.ssd-testline{stroke:#8a94a6}',
    '.ssd-lines,.ssd-marks{pointer-events:none}',
    '.ssd-bad{fill:none;stroke:#d62828;stroke-width:5}',
    '.ssd-need{fill:none;stroke:#1b2a4a;stroke-width:4;stroke-dasharray:6 4}',
    '.ssd-goodring{fill:none;stroke:#1f7a4c;stroke-width:4}',
    '.ssd-link{stroke:#1f7a4c;stroke-width:3;stroke-dasharray:3 5;stroke-linecap:round}',
    '.ssd-dot{fill:#1f7a4c}',
    '.ssd-block{stroke:#1b2a4a;stroke-width:2.5;stroke-linejoin:round}',
    '.ssd-ghost{fill-opacity:.35;stroke:#1b2a4a;stroke-width:3;stroke-dasharray:6 4}',
    '.ssd-ghostg{pointer-events:none}',
    '.ssd-hline{stroke:#1f9d6b;stroke-width:6;stroke-dasharray:14 8;stroke-linecap:round}',
    '.ssd-hit{fill:#1f9d6b;fill-opacity:.08;cursor:ns-resize}',
    '.ssd-moveline{cursor:ns-resize}',
    '.ssd-readout{display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;min-height:2.2em;font-size:1.15rem;font-weight:800}',
    '.ssd-chip{padding:4px 12px;border-radius:999px;border:2px solid var(--line);background:#fff}',
    '.ssd-chip-yes{border-color:#1f9d6b;color:#1f7a4c;background:#e6f7ee}',
    '.ssd-chip-no{color:#8a94a6}',
    '.ssd-total{color:var(--ink)}',
    '.ssd-count{font-size:1.15rem;font-weight:800;color:var(--ink-soft)}',
    '.ssd-tag{font-size:1.2rem;font-weight:800;min-height:1.6em}',
    '.ssd-tag-bad{color:#c2410c}',
    '.ssd-tag-good{color:#1f9d6b}',
    '.ssd-pop{animation:ssdPop .3s ease}',
    '@keyframes ssdPop{from{opacity:0}to{opacity:1}}',
    '.ssd-btnrow{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}',
    '.ssd-small{font-size:1.05rem}',
    '.ssd-palette{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center}',
    '.ssd-pal-label{font-weight:800;font-size:1.1rem}',
    '.ssd-brush{display:inline-flex;align-items:center;gap:8px;font-size:1.1rem;font-weight:800;padding:8px 16px;border-radius:14px;border:3px solid var(--line);background:#fff;color:var(--ink);cursor:pointer}',
    '.ssd-brush.ssd-on{border-color:var(--ink);box-shadow:0 0 0 3px #ffe08a}',
    '.ssd-swatch{display:inline-block;width:26px;height:26px;border-radius:6px}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'six-square-designs' }, css));
})();

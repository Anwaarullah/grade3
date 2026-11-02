/* Square Counter — area by counting squares, with half-squares (Unit 6.3). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  /* ------------------------------------------------------------------ *
   * Shape model
   * A shape is { key, name, wholes: [[c, r]], halves: [[c, r, corner]] }
   * in grid-cell units. corner = where the right angle of the half-square
   * triangle sits: 'tl' | 'tr' | 'bl' | 'br' (same as MQ.ui.grid().half).
   * ------------------------------------------------------------------ */

  function area(s) {
    return s.wholes.length + s.halves.length / 2;
  }

  function cellsOf(s) {
    return s.wholes.map(function (w) { return [w[0], w[1]]; }).concat(s.halves.map(function (h) { return [h[0], h[1]]; }));
  }

  function bbox(s) {
    var cs = cellsOf(s);
    var minC = Infinity, minR = Infinity, maxC = -Infinity, maxR = -Infinity;
    cs.forEach(function (p) {
      minC = Math.min(minC, p[0]); maxC = Math.max(maxC, p[0]);
      minR = Math.min(minR, p[1]); maxR = Math.max(maxR, p[1]);
    });
    return { c: minC, r: minR, w: maxC - minC + 1, h: maxR - minR + 1 };
  }

  function shift(s, dc, dr) {
    return {
      key: s.key, name: s.name,
      wholes: s.wholes.map(function (w) { return [w[0] + dc, w[1] + dr]; }),
      halves: s.halves.map(function (h) { return [h[0] + dc, h[1] + dr, h[2]]; }),
    };
  }

  // Move the shape so its bounding box starts at (0, 0).
  function normal(s) {
    var b = bbox(s);
    return shift(s, -b.c, -b.r);
  }

  var FLIP_H = { tl: 'tr', tr: 'tl', bl: 'br', br: 'bl' };
  var FLIP_V = { tl: 'bl', bl: 'tl', tr: 'br', br: 'tr' };

  function flipH(s) {
    var b = bbox(s);
    return {
      key: s.key, name: s.name,
      wholes: s.wholes.map(function (w) { return [b.c + b.w - 1 - (w[0] - b.c), w[1]]; }),
      halves: s.halves.map(function (h) { return [b.c + b.w - 1 - (h[0] - b.c), h[1], FLIP_H[h[2]]]; }),
    };
  }

  function flipV(s) {
    var b = bbox(s);
    return {
      key: s.key, name: s.name,
      wholes: s.wholes.map(function (w) { return [w[0], b.r + b.h - 1 - (w[1] - b.r)]; }),
      halves: s.halves.map(function (h) { return [h[0], b.r + b.h - 1 - (h[1] - b.r), FLIP_V[h[2]]]; }),
    };
  }

  // Swap rows and columns (only used for shapes made of whole squares).
  function transpose(s) {
    return { key: s.key, name: s.name, wholes: s.wholes.map(function (w) { return [w[1], w[0]]; }), halves: [] };
  }

  function randomTurn(s) {
    if (Math.random() < 0.5) s = flipH(s);
    if (Math.random() < 0.5) s = flipV(s);
    if (!s.halves.length && Math.random() < 0.5) s = transpose(s);
    return normal(s);
  }

  // Vertices (grid units) of each piece, used to find the outline.
  function pieceVerts(c, r, corner) {
    if (!corner) return [[c, r], [c + 1, r], [c + 1, r + 1], [c, r + 1]];
    return {
      tl: [[c, r], [c + 1, r], [c, r + 1]],
      tr: [[c, r], [c + 1, r], [c + 1, r + 1]],
      bl: [[c, r], [c, r + 1], [c + 1, r + 1]],
      br: [[c + 1, r], [c + 1, r + 1], [c, r + 1]],
    }[corner];
  }

  // Edges used by exactly one piece form the outline of the shape.
  function outline(s) {
    var count = {};
    var segs = {};
    function add(vs) {
      for (var i = 0; i < vs.length; i++) {
        var a = vs[i], b = vs[(i + 1) % vs.length];
        var k1 = a.join(','), k2 = b.join(',');
        var key = k1 < k2 ? k1 + '|' + k2 : k2 + '|' + k1;
        count[key] = (count[key] || 0) + 1;
        segs[key] = [a, b];
      }
    }
    s.wholes.forEach(function (w) { add(pieceVerts(w[0], w[1])); });
    s.halves.forEach(function (h) { add(pieceVerts(h[0], h[1], h[2])); });
    return Object.keys(count).filter(function (k) { return count[k] === 1; }).map(function (k) { return segs[k]; });
  }

  // Perimeter in unit edges (only meaningful for shapes of whole squares).
  function unitPerimeter(s) {
    return s.halves.length ? -1 : outline(s).length;
  }

  // Centre of a half-square triangle, in grid units.
  function halfCentre(h) {
    var vs = pieceVerts(h[0], h[1], h[2]);
    return [(vs[0][0] + vs[1][0] + vs[2][0]) / 3, (vs[0][1] + vs[1][1] + vs[2][1]) / 3];
  }

  /* ---------- shape makers (every area is computed from the cells drawn) ---------- */

  function rect(w, h) {
    var ws = [];
    for (var r = 0; r < h; r++) for (var c = 0; c < w; c++) ws.push([c, r]);
    return { key: 'rect' + w + 'x' + h, name: 'rectangle', wholes: ws, halves: [] };
  }

  // w x h rectangle with an a x b block cut from one corner.
  function lShape(w, h, a, b) {
    var ws = [];
    for (var r = 0; r < h; r++) for (var c = 0; c < w; c++) if (!(c >= w - a && r < b)) ws.push([c, r]);
    return { key: 'L' + w + h + a + b, name: 'L shape', wholes: ws, halves: [] };
  }

  // T: a bar w wide and t thick, with a 1-wide stem k long under the middle.
  function tShape(w, t, k) {
    var ws = [];
    for (var r = 0; r < t; r++) for (var c = 0; c < w; c++) ws.push([c, r]);
    var mid = (w - 1) / 2;
    for (var j = 0; j < k; j++) ws.push([mid, t + j]);
    return { key: 'T' + w + t + k, name: 'T shape', wholes: ws, halves: [] };
  }

  // Plus: a centre block t x t with an arm a long on each side.
  function plusShape(a, t) {
    var n = 2 * a + t;
    var ws = [];
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        var inCol = c >= a && c < a + t;
        var inRow = r >= a && r < a + t;
        if (inCol || inRow) ws.push([c, r]);
      }
    }
    return { key: 'plus' + a + t, name: 'plus shape', wholes: ws, halves: [] };
  }

  // Right-angled triangle with two n-long sides along the grid (staircase of halves).
  function stair(n) {
    var ws = [], hs = [];
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < r; c++) ws.push([c, r]);
      hs.push([r, r, 'bl']);
    }
    return { key: 'stair' + n, name: 'triangle', wholes: ws, halves: hs };
  }

  // w x h rectangle with a sloping side on the right (a trapezium).
  function trapOne(w, h) {
    var s = rect(w, h);
    for (var r = 0; r < h; r++) {
      for (var j = 0; j < r; j++) s.wholes.push([w + j, r]);
      s.halves.push([w + r, r, 'bl']);
    }
    s.key = 'trap1-' + w + 'x' + h;
    s.name = 'trapezium';
    return s;
  }

  // w x h rectangle with sloping sides on both ends.
  function trapTwo(w, h) {
    var ws = [], hs = [];
    for (var r = 0; r < h; r++) {
      hs.push([h - 1 - r, r, 'br']);
      for (var j = 0; j < r; j++) ws.push([h - r + j, r]);
      for (var c = 0; c < w; c++) ws.push([h + c, r]);
      for (var k = 0; k < r; k++) ws.push([h + w + k, r]);
      hs.push([h + w + r, r, 'bl']);
    }
    return { key: 'trap2-' + w + 'x' + h, name: 'trapezium', wholes: ws, halves: hs };
  }

  // A 2-wide house: pointed roof made of two halves on top of a 2 x h body.
  function houseTwo(h) {
    var s = rect(2, h);
    s = shift(s, 0, 1);
    s.halves = [[0, 0, 'br'], [1, 0, 'bl']];
    s.key = 'house2-' + h;
    s.name = 'house';
    return s;
  }

  // A 4-wide house: a roof two squares tall on top of a 4 x h body.
  function houseFour(h) {
    var s = shift(rect(4, h), 0, 2);
    s.wholes.push([1, 1], [2, 1]);
    s.halves = [[1, 0, 'br'], [2, 0, 'bl'], [0, 1, 'br'], [3, 1, 'bl']];
    s.key = 'house4-' + h;
    s.name = 'house';
    return s;
  }

  // A square standing on its corner, 4 squares across.
  function diamond() {
    return {
      key: 'diamond4', name: 'diamond',
      wholes: [[1, 1], [2, 1], [1, 2], [2, 2]],
      halves: [[1, 0, 'br'], [2, 0, 'bl'], [0, 1, 'br'], [3, 1, 'bl'], [0, 2, 'tr'], [3, 2, 'tl'], [1, 3, 'tr'], [2, 3, 'tl']],
    };
  }

  // A label tag: a w x 2 rectangle with a point on each end.
  function tag(w) {
    var ws = [];
    for (var r = 0; r < 2; r++) for (var c = 1; c <= w; c++) ws.push([c, r]);
    return { key: 'tag' + w, name: 'tag', wholes: ws, halves: [[0, 0, 'br'], [0, 1, 'tr'], [w + 1, 0, 'bl'], [w + 1, 1, 'tl']] };
  }

  /* ---------- drawing ---------- */

  // Draw a shape on a grid. Returns { pieces: [{c, r, corner, node}], outline: <g> }.
  function drawShape(g, s, cls) {
    var pieces = [];
    s.wholes.forEach(function (w) {
      pieces.push({ c: w[0], r: w[1], corner: null, node: g.fill(w[0], w[1], cls || 'sc-fill') });
    });
    s.halves.forEach(function (h) {
      pieces.push({ c: h[0], r: h[1], corner: h[2], node: g.half(h[0], h[1], h[2], cls || 'sc-fill') });
    });
    var og = S('g', { class: 'sc-outline' });
    outline(s).forEach(function (seg) {
      og.appendChild(S('line', { x1: g.x(seg[0][0]), y1: g.y(seg[0][1]), x2: g.x(seg[1][0]), y2: g.y(seg[1][1]) }));
    });
    g.layer.appendChild(og);
    return { pieces: pieces, outline: og };
  }

  function label(g, gx, gy, text, cls) {
    var t = S('text', { x: g.x(gx), y: g.y(gy), class: cls || 'sc-num', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, String(text));
    g.layer.appendChild(t);
    return t;
  }

  function pieceCentre(p) {
    return p.corner ? halfCentre([p.c, p.r, p.corner]) : [p.c + 0.5, p.r + 0.5];
  }

  // Sort pieces row by row, left to right.
  function readingOrder(a, b) {
    return a.r - b.r || a.c - b.c;
  }

  function cellOf(g, evt) {
    return g.cellAt(MQ.ui.svgPoint(g.svg, evt));
  }

  var PAIR_COLOURS = ['#ffd166', '#a0e7a0', '#ffadad', '#9bd0ff', '#d7b8ff', '#ffc89b', '#b5ead7', '#f9c6e8'];

  /* ------------------------------------------------------------------ *
   * Practice deck
   * ------------------------------------------------------------------ */

  function level1Shapes() {
    var rects = [];
    for (var w = 2; w <= 5; w++) for (var h = 2; h <= 5; h++) if (w * h >= 4 && w * h <= 20) rects.push(rect(w, h));
    var ls = [lShape(3, 3, 1, 1), lShape(3, 3, 2, 2), lShape(4, 3, 2, 2), lShape(4, 3, 3, 1), lShape(4, 4, 2, 2), lShape(5, 3, 3, 2), lShape(4, 4, 3, 3), lShape(5, 4, 2, 2), lShape(5, 4, 3, 2)];
    var others = [tShape(3, 1, 2), tShape(3, 1, 3), tShape(5, 1, 3), tShape(5, 2, 2), tShape(3, 2, 3), plusShape(1, 1), plusShape(2, 1), plusShape(1, 2), plusShape(3, 1)];
    var pick = [U.pick(rects), U.pick(ls), U.pick(others)];
    return U.shuffle(pick).map(function (s) { return randomTurn(s); });
  }

  function level2Pool() {
    return [stair(3), stair(4), stair(5), trapOne(3, 2), trapOne(2, 3), trapOne(7, 1), trapOne(1, 3), trapOne(4, 2), trapTwo(1, 2), trapTwo(2, 2), trapTwo(3, 2), trapTwo(6, 1), houseTwo(3), houseFour(1), houseFour(2), diamond(), tag(2), tag(3), tag(4)];
  }

  function level2Shapes() {
    // Three different kinds, at least one with an answer ending in ½.
    for (var tries = 0; tries < 50; tries++) {
      var pool = U.shuffle(level2Pool());
      var out = [], kinds = {};
      pool.forEach(function (s) {
        if (out.length < 3 && !kinds[s.name]) {
          kinds[s.name] = true;
          out.push(s);
        }
      });
      if (out.some(function (s) { return area(s) % 1 !== 0; })) {
        return out.map(function (s) { return randomTurn(s); });
      }
    }
    return [stair(3), trapTwo(2, 2), tag(3)];
  }

  // Three shapes: two share an area, the third is one square more or less.
  function sameAreaSet() {
    var pool = [rect(2, 3), rect(3, 2), lShape(4, 2, 2, 1), lShape(3, 3, 2, 1), trapTwo(1, 2), tag(2), tShape(3, 1, 3), trapOne(2, 2),
      rect(2, 4), rect(4, 2), lShape(3, 3, 1, 1), lShape(4, 3, 2, 2), stair(4), houseFour(1), diamond(), tag(3), trapOne(3, 2),
      lShape(3, 3, 2, 2), plusShape(1, 1), houseTwo(2), lShape(3, 3, 1, 2), houseTwo(3), rect(3, 3), tShape(3, 1, 4)];
    var target = U.pick([6, 8]);
    var same = U.shuffle(pool.filter(function (s) { return area(s) === target; }));
    var a = same[0];
    var b = same.filter(function (s) { return s.name !== a.name; })[0];
    var odd = U.pick(pool.filter(function (s) { return Math.abs(area(s) - target) === 1; }));
    return U.shuffle([a, b, odd]).map(function (s) { return randomTurn(s); });
  }

  var deck = null;

  function buildDeck() {
    var q = [];
    level1Shapes().forEach(function (s) { q.push({ type: 'count', shape: s }); });
    level2Shapes().forEach(function (s) { q.push({ type: 'count', shape: s }); });
    var l3 = [{ type: 'draw', n: U.rand(6, 12) }, { type: 'same', shapes: sameAreaSet() }];
    if (Math.random() < 0.5) l3.reverse();
    return q.concat(l3);
  }

  /* ------------------------------------------------------------------ *
   * Practice: count the area
   * ------------------------------------------------------------------ */

  function renderCount(stage, api, s) {
    var b = bbox(s);
    var mx = U.rand(1, 2), my = 1;
    var cols = b.w + mx + U.rand(1, 2), rows = b.h + my + 1;
    var cell = Math.min(46, Math.floor(420 / rows), Math.floor(560 / cols));
    var g = MQ.ui.grid({ cols: cols, rows: rows, cell: cell, pad: 14, className: 'sc-grid' });
    s = shift(s, mx, my);
    var hasHalves = s.halves.length > 0;
    var answer = area(s);
    var drawn = drawShape(g, s);
    var pieceAt = {};
    drawn.pieces.forEach(function (p) { pieceAt[p.c + ',' + p.r] = p; });

    api.say(hasHalves ? 'Count the whole squares, then put the halves together.' : 'Count the squares inside the shape. Click each one as you count.', 'think');
    stage.appendChild(MQ.ui.prompt('What is the <b>area</b> of this ' + s.name + '?'));
    stage.appendChild(g.svg);
    var counter = el('div', { class: 'sc-counter' }, 'Click squares to mark them as you count.');
    stage.appendChild(counter);

    // Marks the child places while counting.
    var marked = []; // pieces in the order they were marked
    var marks = [];
    function redrawMarks() {
      marks.forEach(function (m) { if (m.parentNode) m.parentNode.removeChild(m); });
      marks = [];
      var n = 0, halves = 0;
      drawn.pieces.forEach(function (p) { p.node.classList.remove('sc-marked'); });
      marked.forEach(function (p) {
        p.node.classList.add('sc-marked');
        var ctr = pieceCentre(p);
        if (p.corner) {
          halves++;
          marks.push(label(g, ctr[0], ctr[1], '½', 'sc-num sc-num-half'));
        } else {
          n++;
          marks.push(label(g, ctr[0], ctr[1], n));
        }
      });
      if (!marked.length) counter.textContent = 'Click squares to mark them as you count.';
      else counter.textContent = 'Marked: ' + n + ' whole square' + (n === 1 ? '' : 's') + (hasHalves ? ' and ' + halves + ' half square' + (halves === 1 ? '' : 's') : '');
    }
    g.svg.addEventListener('click', function (e) {
      if (api.isAnswered()) return;
      var c = cellOf(g, e);
      if (!c) return;
      var p = pieceAt[c.c + ',' + c.r];
      if (!p) {
        api.feedback('That square is outside the shape. Only count the coloured part.', 'info');
        return;
      }
      var i = marked.indexOf(p);
      if (i === -1) marked.push(p);
      else marked.splice(i, 1);
      api.sound('pop');
      redrawMarks();
    });

    var wholes = s.wholes.length, halves = s.halves.length;
    var perim = unitPerimeter(s);
    var rowTotals = [];
    for (var r = 0; r < rows; r++) {
      var t = 0;
      drawn.pieces.forEach(function (p) { if (p.r === r) t += p.corner ? 0.5 : 1; });
      if (t) rowTotals.push(t);
    }

    var box = MQ.ui.numberInput({
      unit: 'square units',
      half: true,
      onSubmit: function (v) {
        if (U.same(v, answer)) {
          box.good();
          box.disable();
          api.check(true, hasHalves ? 'Yes! ' + U.fmt(answer) + ' square units. The halves paired up nicely.' : 'Yes! The area is ' + answer + ' square units.');
          return;
        }
        box.bad();
        var second = api.tries() >= 1;
        if (hasHalves && U.same(v, wholes + halves)) {
          api.check(false, second ? 'Each triangle is only half a square. ' + halves + ' halves make ' + U.fmt(halves / 2) + ' whole squares.' : 'Careful! The triangles are half squares. Two halves make one whole.', 'Counted half squares as whole squares');
        } else if (hasHalves && U.same(v, wholes)) {
          api.check(false, second ? 'Add the halves too: ' + halves + ' halves make ' + U.fmt(halves / 2) + ' more.' : 'You counted the whole squares. Don\'t forget the half squares!', 'Left out the half squares');
        } else if (U.same(v, cols * rows)) {
          api.check(false, 'That is the whole grid! Only count the squares inside the coloured shape.', 'Counted the background grid too');
        } else if (perim > 0 && U.same(v, perim)) {
          api.check(false, 'That counts the edges round the outside (the perimeter). Area counts the squares inside.', 'Counted the edges instead of the squares');
        } else if (Math.abs(v - answer) <= 2) {
          api.check(false, second ? 'Count row by row: ' + rowTotals.map(U.fmt).join(' + ') + '.' : 'So close! Click each square as you count, so you don\'t miss one or count one twice.', 'Missed or double-counted a square');
        } else {
          api.check(false, second ? 'Count row by row: ' + rowTotals.map(U.fmt).join(' + ') + '.' : (hasHalves ? 'Count the whole squares first. Then pair up the halves.' : 'Count the squares inside the shape, one at a time.'), 'Miscounted the squares');
        }
      },
    });
    stage.appendChild(box.el);
    box.focus();

    api.onReveal(function () {
      box.disable();
      box.setValue(U.fmt(answer));
      box.good();
      marked = [];
      redrawMarks();
      revealCount(g, drawn.pieces);
      counter.innerHTML = workingText(wholes, halves, answer);
    });
  }

  // Number each whole square in order and give each pair of halves the next number.
  function revealCount(g, pieces) {
    var ws = pieces.filter(function (p) { return !p.corner; }).sort(readingOrder);
    var hs = pieces.filter(function (p) { return p.corner; }).sort(readingOrder);
    ws.forEach(function (p, i) {
      p.node.classList.add('sc-marked');
      var ctr = pieceCentre(p);
      label(g, ctr[0], ctr[1], i + 1);
    });
    for (var i = 0; i < hs.length; i++) {
      var pairNo = Math.floor(i / 2);
      var p = hs[i];
      var ctr = pieceCentre(p);
      var lone = i === hs.length - 1 && hs.length % 2 === 1;
      p.node.style.fill = lone ? '#eeeeee' : PAIR_COLOURS[pairNo % PAIR_COLOURS.length];
      label(g, ctr[0], ctr[1], lone ? '½' : ws.length + pairNo + 1, 'sc-num sc-num-half');
    }
  }

  function workingText(wholes, halves, total) {
    if (!halves) return '<b>' + wholes + '</b> squares inside, so the area is <b>' + total + ' square units</b>.';
    return '<b>' + wholes + '</b> whole squares + <b>' + halves + '</b> halves (= ' + U.fmt(halves / 2) + ' whole) = <b>' + U.fmt(total) + ' square units</b>';
  }

  /* ------------------------------------------------------------------ *
   * Practice: draw a shape with area N
   * ------------------------------------------------------------------ */

  function connected(keys) {
    if (!keys.length) return false;
    var set = {};
    keys.forEach(function (k) { set[k] = true; });
    var seen = {}, stack = [keys[0]];
    seen[keys[0]] = true;
    while (stack.length) {
      var p = stack.pop().split(',').map(Number);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        var k = (p[0] + d[0]) + ',' + (p[1] + d[1]);
        if (set[k] && !seen[k]) {
          seen[k] = true;
          stack.push(k);
        }
      });
    }
    return Object.keys(seen).length === keys.length;
  }

  function renderDraw(stage, api, n) {
    api.say('Build a shape that covers exactly ' + n + ' squares. All squares must touch side to side.', 'think');
    stage.appendChild(MQ.ui.prompt('Draw a shape with an <b>area of ' + n + ' square units</b>.'));
    var g = MQ.ui.grid({ cols: 9, rows: 6, cell: 50, pad: 14, className: 'sc-grid' });
    stage.appendChild(g.svg);
    var order = []; // keys "c,r" in click order
    var nodes = {};
    var labels = [];
    var counter = el('div', { class: 'sc-counter' }, 'Click squares to colour them. Click again to remove.');
    function redraw() {
      labels.forEach(function (t) { if (t.parentNode) t.parentNode.removeChild(t); });
      labels = order.map(function (k, i) {
        var p = k.split(',').map(Number);
        return label(g, p[0] + 0.5, p[1] + 0.5, i + 1);
      });
      counter.textContent = order.length ? 'Squares coloured: ' + order.length : 'Click squares to colour them. Click again to remove.';
    }
    g.svg.addEventListener('click', function (e) {
      if (api.isAnswered()) return;
      var c = cellOf(g, e);
      if (!c) return;
      var k = c.c + ',' + c.r;
      var i = order.indexOf(k);
      if (i === -1) {
        order.push(k);
        nodes[k] = g.fill(c.c, c.r, 'sc-fill sc-marked');
      } else {
        order.splice(i, 1);
        nodes[k].parentNode.removeChild(nodes[k]);
        delete nodes[k];
      }
      api.sound('pop');
      redraw();
    });
    stage.appendChild(counter);

    var checkBtn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check my shape');
    var clearBtn = el('button', { class: 'btn btn-ghost', type: 'button' }, 'Clear');
    clearBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      order.forEach(function (k) { nodes[k].parentNode.removeChild(nodes[k]); });
      order = [];
      nodes = {};
      redraw();
    });
    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var k = order.length;
      if (k === 0) {
        api.feedback('Click some squares first to build your shape.', 'info');
        return;
      }
      if (k !== n) {
        var more = k < n;
        api.check(false, 'Your shape covers ' + k + ' square' + (k === 1 ? '' : 's') + '. ' + (more ? 'Add ' + (n - k) + ' more' : 'Take ' + (k - n) + ' away') + ' to make ' + n + '.', 'Built a shape with the wrong number of squares');
        return;
      }
      if (!connected(order)) {
        api.check(false, 'Some squares are not joined. Every square must touch another along a side, not just at a corner.', 'Made a shape with squares not joined edge to edge');
        return;
      }
      checkBtn.disabled = true;
      clearBtn.disabled = true;
      api.check(true, 'Great shape! It covers ' + n + ' squares, so its area is ' + n + ' square units.');
    });
    stage.appendChild(el('div', { class: 'sc-btns' }, clearBtn, checkBtn));

    api.onReveal(function () {
      checkBtn.disabled = true;
      clearBtn.disabled = true;
      order.forEach(function (k) { nodes[k].parentNode.removeChild(nodes[k]); });
      nodes = {};
      // One possible answer: rows of 4 squares, joined together.
      order = [];
      var w = n % 3 === 0 ? 3 : 4;
      for (var i = 0; i < n; i++) {
        var key = (2 + (i % w)) + ',' + (1 + Math.floor(i / w));
        order.push(key);
        var p = key.split(',').map(Number);
        nodes[key] = g.fill(p[0], p[1], 'sc-fill sc-marked');
      }
      redraw();
      var full = Math.floor(n / w), left = n % w;
      var parts = [];
      for (var j = 0; j < full; j++) parts.push(w);
      if (left) parts.push(left);
      counter.innerHTML = 'Here is one way: rows of ' + parts.join(' + ') + ' = <b>' + n + ' squares</b>. Any shape works if it has ' + n + ' squares joined side to side!';
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice: which two shapes have the same area?
   * ------------------------------------------------------------------ */

  function renderSame(stage, api, shapes) {
    api.say('Two of these shapes cover the same number of squares. Which two?', 'think');
    stage.appendChild(MQ.ui.prompt('Which <b>two</b> shapes have the <b>same area</b>?'));
    var maxW = 0, maxH = 0;
    shapes.forEach(function (s) {
      var b = bbox(s);
      maxW = Math.max(maxW, b.w);
      maxH = Math.max(maxH, b.h);
    });
    var cols = maxW + 2, rows = maxH + 2;
    var cell = Math.min(38, Math.floor(260 / cols));
    var names = ['A', 'B', 'C'];
    var areaLabels = [];
    var drawn = [];
    var row = el('div', { class: 'sc-three' });
    shapes.forEach(function (s, i) {
      var b = bbox(s);
      var g = MQ.ui.grid({ cols: cols, rows: rows, cell: cell, pad: 8, className: 'sc-grid' });
      var placed = shift(s, Math.floor((cols - b.w) / 2), Math.floor((rows - b.h) / 2));
      drawn.push({ g: g, d: drawShape(g, placed) });
      var lab = el('div', { class: 'sc-area-label' }, '');
      areaLabels.push(lab);
      row.appendChild(el('div', { class: 'sc-card' }, el('div', { class: 'sc-card-name' }, 'Shape ' + names[i]), g.svg, lab));
    });
    stage.appendChild(row);

    var areas = shapes.map(area);
    var pairs = [[0, 1], [0, 2], [1, 2]];
    var right = pairs.filter(function (p) { return areas[p[0]] === areas[p[1]]; })[0];
    var rightVal = names[right[0]] + names[right[1]];
    var ch = MQ.ui.choices(pairs.map(function (p) { return { label: names[p[0]] + ' and ' + names[p[1]], value: names[p[0]] + names[p[1]] }; }), function (v) {
      if (v === rightVal) {
        ch.mark(v, 'good');
        ch.disable();
        showAreas();
        api.check(true, 'Yes! Shapes ' + names[right[0]] + ' and ' + names[right[1]] + ' both cover ' + U.fmt(areas[right[0]]) + ' squares, even though they look different.');
      } else {
        ch.mark(v, 'bad');
        var anyHalves = shapes.some(function (s) { return s.halves.length; });
        api.check(false, api.tries() >= 1 ? 'Write down the area of each shape: count the whole squares' + (anyHalves ? ', then add half a square for each triangle.' : '.') : 'Don\'t go by the look! Count the squares inside each shape.' + (anyHalves ? ' Two halves make one whole.' : ''), 'Judged area by how the shapes look');
      }
    }, { columns: 3 });
    stage.appendChild(ch);

    function showAreas() {
      areaLabels.forEach(function (lab, i) {
        lab.textContent = 'Area = ' + U.fmt(areas[i]) + ' square units';
        if (i === right[0] || i === right[1]) lab.classList.add('sc-area-good');
      });
    }
    api.onReveal(function () {
      ch.mark(rightVal, 'good');
      ch.disable();
      drawn.forEach(function (x) { revealCount(x.g, x.d.pieces); });
      showAreas();
    });
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */

  // 1. Tile a 5 x 3 patio.
  function learnTiles(stage, api) {
    api.say('This patio needs tiles. Click each square to lay a tile!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Area is the space inside', 'Area = how many squares cover a shape.'));
    var g = MQ.ui.grid({ cols: 7, rows: 5, cell: 58, pad: 14, className: 'sc-grid' });
    var patio = rect(5, 3);
    patio = shift(patio, 1, 1);
    var drawn = drawShape(g, patio, 'sc-empty');
    var done = {};
    var n = 0;
    var counter = el('div', { class: 'sc-counter sc-big' }, 'Tiles: 0');
    var after = el('div', { class: 'sc-after' });
    g.svg.addEventListener('click', function (e) {
      var c = cellOf(g, e);
      if (!c || n >= 15) return;
      var k = c.c + ',' + c.r;
      var inside = c.c >= 1 && c.c <= 5 && c.r >= 1 && c.r <= 3;
      if (!inside) {
        api.feedback('That square is the garden, not the patio. Tile inside the outline.', 'info');
        return;
      }
      if (done[k]) {
        api.feedback('That square already has a tile. Count each square once!', 'info');
        return;
      }
      done[k] = true;
      n++;
      g.fill(c.c, c.r, 'sc-tile');
      label(g, c.c + 0.5, c.r + 0.5, n);
      api.sound('pop');
      counter.textContent = 'Tiles: ' + n;
      if (n === 15) {
        counter.innerHTML = 'Area = <b>15 square units</b>';
        after.appendChild(el('p', { class: 'sc-note' }, '3 rows of 5 tiles:'));
        after.appendChild(MQ.ui.sum([5, 5, 5], 15, 'square units'));
        api.say('15 tiles cover the patio. Its area is 15 square units!', 'cheer');
        api.feedback('Each tile is one square unit. We write area in square units.', 'good');
        api.unlockNext();
      }
    });
    drawn.outline.classList.add('sc-outline-dash');
    stage.appendChild(g.svg);
    stage.appendChild(counter);
    stage.appendChild(after);
  }

  // 2. Two halves make a whole.
  function learnHalves(stage, api) {
    api.say('Some squares are cut in half. Click two halves to join them into one whole square.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Two halves make a whole', 'A triangle cut corner to corner is <b>half</b> a square.'));
    var wrap = el('div', { class: 'sc-halves-row' });
    var g = MQ.ui.grid({ cols: 6, rows: 4, cell: 62, pad: 14, className: 'sc-grid' });
    var s = shift(tag(2), 1, 1);
    var drawn = drawShape(g, s);
    var wholes = drawn.pieces.filter(function (p) { return !p.corner; }).sort(readingOrder);
    wholes.forEach(function (p, i) {
      label(g, p.c + 0.5, p.r + 0.5, i + 1);
    });
    var halves = drawn.pieces.filter(function (p) { return p.corner; });
    // tray where joined halves appear as whole squares
    var tray = S('svg', { viewBox: '0 0 200 110', class: 'sc-tray', width: 200, height: 110 });
    tray.appendChild(S('text', { x: 100, y: 16, 'text-anchor': 'middle', class: 'sc-tray-title' }, 'Joined squares'));
    wrap.appendChild(g.svg);
    wrap.appendChild(tray);
    stage.appendChild(wrap);
    var counter = el('div', { class: 'sc-counter sc-big' }, '4 whole squares + ? ');
    stage.appendChild(counter);

    var selected = null;
    var pairs = 0;
    g.svg.addEventListener('click', function (e) {
      var c = cellOf(g, e);
      if (!c) return;
      var p = halves.filter(function (h) { return h.c === c.c && h.r === c.r; })[0];
      if (!p) {
        var w = wholes.filter(function (h) { return h.c === c.c && h.r === c.r; })[0];
        if (w) api.feedback('That one is already a whole square. Click a triangle.', 'info');
        return;
      }
      if (p.used) return;
      if (!selected) {
        selected = p;
        p.node.classList.add('sc-picked');
        api.sound('click');
        api.feedback('Now click another half.', 'info');
        return;
      }
      if (selected === p) {
        p.node.classList.remove('sc-picked');
        selected = null;
        return;
      }
      joinPair(selected, p);
      selected = null;
    });

    function joinPair(a, b) {
      var col = PAIR_COLOURS[pairs];
      [a, b].forEach(function (p) {
        p.used = true;
        p.node.classList.remove('sc-picked');
        p.node.style.fill = col;
        var ctr = pieceCentre(p);
        label(g, ctr[0], ctr[1], 4 + pairs + 1, 'sc-num sc-num-half');
      });
      // Animate two triangles sliding together into one square in the tray.
      var x0 = 30 + pairs * 90, y0 = 30, sz = 60;
      var t1 = S('polygon', { points: [x0, y0, x0 + sz, y0, x0, y0 + sz].join(' '), class: 'sc-fly', style: { fill: col, transform: 'translate(-24px, -10px)' } });
      var t2 = S('polygon', { points: [x0 + sz, y0, x0 + sz, y0 + sz, x0, y0 + sz].join(' '), class: 'sc-fly', style: { fill: col, transform: 'translate(24px, 10px)' } });
      var box = S('rect', { x: x0, y: y0, width: sz, height: sz, class: 'sc-tray-box' });
      var num = S('text', { x: x0 + sz / 2, y: y0 + sz / 2, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'sc-num', style: { opacity: 0 } }, String(4 + pairs + 1));
      tray.appendChild(box);
      tray.appendChild(t1);
      tray.appendChild(t2);
      tray.appendChild(num);
      api.later(function () {
        t1.style.transform = 'translate(0,0)';
        t2.style.transform = 'translate(0,0)';
      }, 30);
      api.later(function () {
        num.style.opacity = 1;
      }, 650);
      pairs++;
      api.sound('pop');
      if (pairs === 1) {
        counter.textContent = '4 whole squares + 1 joined square + …';
        api.feedback('Two halves make one whole square! Join the other two halves.', 'good');
      } else {
        counter.innerHTML = '4 + 2 = <b>6 square units</b>';
        api.say('4 whole squares and 2 squares made from halves. The area is 6 square units!', 'cheer');
        api.feedback('4 halves make 2 whole squares, so the area is 4 + 2 = 6 square units.', 'good');
        api.unlockNext();
      }
    }
  }

  // 3. Count carefully: only the shape, each square once.
  function learnCareful(stage, api) {
    api.say('Only count squares inside the shape. Click each one once.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Count carefully', 'Count only the squares <b>inside</b> the shape, and count each one <b>once</b>.'));
    var g = MQ.ui.grid({ cols: 7, rows: 6, cell: 52, pad: 14, className: 'sc-grid' });
    var s = shift(plusShape(2, 1), 1, 0);
    var drawn = drawShape(g, s);
    var total = drawn.pieces.length;
    var done = {};
    var n = 0;
    var counter = el('div', { class: 'sc-counter sc-big' }, 'Counted: 0');
    g.svg.addEventListener('click', function (e) {
      var c = cellOf(g, e);
      if (!c || n >= total) return;
      var k = c.c + ',' + c.r;
      var p = drawn.pieces.filter(function (q) { return q.c === c.c && q.r === c.r; })[0];
      if (!p) {
        api.sound('wrong');
        api.feedback('That square is in the background. Only count the coloured shape!', 'try');
        return;
      }
      if (done[k]) {
        api.feedback('You counted that one already! Each square is counted once.', 'try');
        return;
      }
      done[k] = true;
      n++;
      p.node.classList.add('sc-marked');
      label(g, c.c + 0.5, c.r + 0.5, n);
      api.sound('pop');
      api.feedback('', 'info');
      counter.textContent = 'Counted: ' + n;
      if (n === total) {
        counter.innerHTML = 'Area = <b>' + total + ' square units</b>';
        api.say('The grid has ' + g.cols * g.rows + ' squares, but only ' + total + ' are inside the shape.', 'cheer');
        api.feedback('Great counting! The area of the plus shape is ' + total + ' square units.', 'good');
        api.unlockNext();
      }
    });
    stage.appendChild(g.svg);
    stage.appendChild(counter);
  }

  MQ.register('square-counter', {
    learn: [learnTiles, learnHalves, learnCareful],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'count') return renderCount(stage, api, q.shape);
        if (q.type === 'draw') return renderDraw(stage, api, q.n);
        return renderSame(stage, api, q.shapes);
      },
    },
  });

  var css = [
    '.sc-grid{background:#fff;border-radius:12px;cursor:pointer}',
    '.sc-fill{fill:#bfe6e1;stroke:none}',
    '.sc-fill.sc-marked{fill:#7fd3c8}',
    '.sc-empty{fill:#f7f2e6;stroke:none}',
    '.sc-tile{fill:#e9a979;stroke:#b5764a;stroke-width:2}',
    '.sc-picked{fill:#ffd166 !important;stroke:#c98a00;stroke-width:3}',
    '.sc-outline line{stroke:#0b6e66;stroke-width:4;stroke-linecap:round}',
    '.sc-outline-dash line{stroke:#8a5a2b;stroke-dasharray:8 6}',
    '.sc-num{font-size:18px;font-weight:800;fill:#1b2a4a;pointer-events:none}',
    '.sc-num-half{font-size:15px}',
    '.sc-counter{font-size:1.15rem;font-weight:700;color:var(--ink-soft);text-align:center;min-height:1.6em}',
    '.sc-counter b{color:#0b6e66}',
    '.sc-big{font-size:1.45rem;color:var(--ink)}',
    '.sc-after{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.sc-note{margin:0;font-weight:700;color:var(--ink-soft)}',
    '.sc-btns{display:flex;gap:10px;justify-content:center}',
    '.sc-three{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;width:100%}',
    '.sc-card{background:#fff;border:3px solid var(--line);border-radius:16px;padding:8px;display:flex;flex-direction:column;align-items:center;gap:4px}',
    '.sc-card .sc-grid{width:240px}',
    '.sc-card-name{font-weight:800;font-size:1.2rem}',
    '.sc-area-label{font-weight:800;min-height:1.4em;color:var(--ink-soft)}',
    '.sc-area-good{color:var(--good)}',
    '.sc-halves-row{display:flex;gap:18px;align-items:center;justify-content:center;flex-wrap:wrap}',
    '.sc-tray{background:#fff;border:3px dashed var(--line);border-radius:14px}',
    '.sc-tray-title{font-size:14px;font-weight:800;fill:var(--ink-soft)}',
    '.sc-tray-box{fill:none;stroke:#c9d3ee;stroke-width:2;stroke-dasharray:4 4}',
    '.sc-fly{stroke:#0b6e66;stroke-width:2;transition:transform .6s ease}',
    '.sc-tray text.sc-num{transition:opacity .3s ease}',
    '@media (max-width:640px){.sc-card .sc-grid{width:200px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'square-counter' }, css));
})();

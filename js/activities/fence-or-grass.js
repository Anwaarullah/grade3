/* Fence or Floor? — tell area and perimeter apart (Unit 6.3). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  var AREA = { icon: '🧱', word: 'area', thing: 'floor', unit: 'square units' };
  var PERIM = { icon: '🚧', word: 'perimeter', thing: 'fence', unit: 'units' };

  var PLACES = ['school garden', 'playground', 'classroom', 'vegetable patch', 'car park', 'kitchen floor', 'sports field', 'bedroom', 'shop floor', 'sandpit'];

  /* ------------------------------------------------------------------ *
   * Shapes made of whole grid squares: { key, name, cells: [[c, r]] }
   * ------------------------------------------------------------------ */

  function keyOf(c, r) {
    return c + ',' + r;
  }

  function cellSet(cells) {
    var set = {};
    cells.forEach(function (p) { set[keyOf(p[0], p[1])] = true; });
    return set;
  }

  function bbox(cells) {
    var minC = Infinity, minR = Infinity, maxC = -Infinity, maxR = -Infinity;
    cells.forEach(function (p) {
      minC = Math.min(minC, p[0]); maxC = Math.max(maxC, p[0]);
      minR = Math.min(minR, p[1]); maxR = Math.max(maxR, p[1]);
    });
    return { c: minC, r: minR, w: maxC - minC + 1, h: maxR - minR + 1 };
  }

  function shiftCells(cells, dc, dr) {
    return cells.map(function (p) { return [p[0] + dc, p[1] + dr]; });
  }

  function normalCells(cells) {
    var b = bbox(cells);
    return shiftCells(cells, -b.c, -b.r);
  }

  function randomTurn(shape) {
    var cells = shape.cells.slice();
    var b = bbox(cells);
    if (Math.random() < 0.5) cells = cells.map(function (p) { return [b.w - 1 - p[0], p[1]]; });
    if (Math.random() < 0.5) cells = cells.map(function (p) { return [p[0], b.h - 1 - p[1]]; });
    if (Math.random() < 0.5) cells = cells.map(function (p) { return [p[1], p[0]]; });
    return { key: shape.key, name: shape.name, w: shape.w, h: shape.h, cells: normalCells(cells) };
  }

  /**
   * Outline of the shape as unit edges, walked clockwise from the top-left corner.
   * Each edge is { a: [x, y], b: [x, y], out: [dx, dy] } in grid units, where out
   * points away from the shape (used to place the edge numbers).
   */
  function boundary(cells) {
    var set = cellSet(cells);
    var byStart = {};
    var all = [];
    cells.forEach(function (p) {
      var c = p[0], r = p[1];
      // clockwise on screen (y goes down): top →, right ↓, bottom ←, left ↑
      if (!set[keyOf(c, r - 1)]) all.push({ a: [c, r], b: [c + 1, r], out: [0, -1] });
      if (!set[keyOf(c + 1, r)]) all.push({ a: [c + 1, r], b: [c + 1, r + 1], out: [1, 0] });
      if (!set[keyOf(c, r + 1)]) all.push({ a: [c + 1, r + 1], b: [c, r + 1], out: [0, 1] });
      if (!set[keyOf(c - 1, r)]) all.push({ a: [c, r + 1], b: [c, r], out: [-1, 0] });
    });
    all.forEach(function (e) {
      var k = e.a.join(',');
      (byStart[k] = byStart[k] || []).push(e);
    });
    // start at the top edge of the top-left cell
    var start = all.filter(function (e) { return e.out[1] === -1; }).sort(function (x, y) { return x.a[1] - y.a[1] || x.a[0] - y.a[0]; })[0];
    var ordered = [start];
    var used = [start];
    var cur = start;
    while (ordered.length < all.length) {
      var list = byStart[cur.b.join(',')] || [];
      var nxt = list.filter(function (e) { return used.indexOf(e) === -1; })[0];
      if (!nxt) break;
      used.push(nxt);
      ordered.push(nxt);
      cur = nxt;
    }
    // Fall back to the plain list if the walk could not visit every edge.
    return ordered.length === all.length ? ordered : all;
  }

  function areaOf(shape) {
    return shape.cells.length;
  }

  function perimOf(shape) {
    return boundary(shape.cells).length;
  }

  // Lengths of the straight sides, in order round the shape (e.g. [4, 3, 4, 3]).
  function sideRuns(cells) {
    var edges = boundary(cells);
    var runs = [];
    var prev = null;
    edges.forEach(function (e) {
      var dir = e.out.join(',');
      if (dir === prev) runs[runs.length - 1]++;
      else runs.push(1);
      prev = dir;
    });
    if (runs.length > 1 && edges[0].out.join(',') === edges[edges.length - 1].out.join(',')) {
      runs[0] += runs.pop();
    }
    return runs;
  }

  function rowCounts(cells) {
    var b = bbox(cells);
    var out = [];
    for (var r = b.r; r < b.r + b.h; r++) {
      var n = cells.filter(function (p) { return p[1] === r; }).length;
      if (n) out.push(n);
    }
    return out;
  }

  function rect(w, h) {
    var cells = [];
    for (var r = 0; r < h; r++) for (var c = 0; c < w; c++) cells.push([c, r]);
    return { key: 'rect' + Math.min(w, h) + 'x' + Math.max(w, h), name: w === h ? 'square' : 'rectangle', w: w, h: h, cells: cells };
  }

  function lShape(w, h, a, b) {
    var cells = [];
    for (var r = 0; r < h; r++) for (var c = 0; c < w; c++) if (!(c >= w - a && r < b)) cells.push([c, r]);
    return { key: 'L' + w + h + a + b, name: 'L shape', cells: cells };
  }

  function tShape(w, t, k) {
    var cells = [];
    for (var r = 0; r < t; r++) for (var c = 0; c < w; c++) cells.push([c, r]);
    for (var j = 0; j < k; j++) cells.push([(w - 1) / 2, t + j]);
    return { key: 'T' + w + t + k, name: 'T shape', cells: cells };
  }

  // U shape: w x h block with a gap (w - 2 wide, d deep) cut from the top middle.
  function uShape(w, h, d) {
    var cells = [];
    for (var r = 0; r < h; r++) for (var c = 0; c < w; c++) if (!(c > 0 && c < w - 1 && r < d)) cells.push([c, r]);
    return { key: 'U' + w + h + d, name: 'U shape', cells: cells };
  }

  // Steps: row r is (r + 1) * k squares long.
  function steps(n, k) {
    var cells = [];
    for (var r = 0; r < n; r++) for (var c = 0; c < (r + 1) * k; c++) cells.push([c, r]);
    return { key: 'steps' + n + k, name: 'step shape', cells: cells };
  }

  function plusShape(a, t) {
    var n = 2 * a + t;
    var cells = [];
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if ((c >= a && c < a + t) || (r >= a && r < a + t)) cells.push([c, r]);
    return { key: 'plus' + a + t, name: 'plus shape', cells: cells };
  }

  /* ------------------------------------------------------------------ *
   * Drawing: floor squares and fence edges on a grid
   * ------------------------------------------------------------------ */

  /**
   * Draw a shape on grid g. Returns helpers:
   *   showFloor(stepMs, done) – fill and number the squares one by one
   *   showFence(stepMs, done) – light up and number the edges one by one
   * stepMs = 0 shows everything at once. `numbers: false` skips the numbers.
   */
  function drawShape(g, cells, api, opts) {
    opts = opts || {};
    var fontSize = Math.max(11, Math.round(g.cell * 0.32));
    var base = S('g', { class: 'fg-base' });
    cells.forEach(function (p) {
      base.appendChild(S('rect', { x: g.x(p[0]), y: g.y(p[1]), width: g.cell, height: g.cell, class: 'fg-plain' }));
    });
    g.under.appendChild(base);
    var floorG = S('g', { class: 'fg-floor-layer' });
    g.under.appendChild(floorG);
    var edges = boundary(cells);
    var outlineG = S('g', { class: 'fg-outline' });
    edges.forEach(function (e) {
      outlineG.appendChild(S('line', { x1: g.x(e.a[0]), y1: g.y(e.a[1]), x2: g.x(e.b[0]), y2: g.y(e.b[1]) }));
    });
    g.layer.appendChild(outlineG);
    var fenceG = S('g', { class: 'fg-fence-layer' });
    g.layer.appendChild(fenceG);
    var floorNums = S('g', { class: 'fg-floor-nums' });
    g.layer.appendChild(floorNums);

    var ordered = cells.slice().sort(function (a, b) { return a[1] - b[1] || a[0] - b[0]; });

    // Edge-number positions: just outside each edge. At an inside corner two numbers
    // would meet, so slide each one along its own edge, away from the other.
    var labelPos = edges.map(function (e) {
      return [(e.a[0] + e.b[0]) / 2 + e.out[0] * 0.3, (e.a[1] + e.b[1]) / 2 + e.out[1] * 0.3];
    });
    edges.forEach(function (e, i) {
      edges.forEach(function (f, j) {
        if (j <= i) return;
        var p = labelPos[i], q = labelPos[j];
        if (Math.abs(p[0] - q[0]) + Math.abs(p[1] - q[1]) > 0.6) return;
        [[i, e, q], [j, f, p]].forEach(function (t) {
          var pos = labelPos[t[0]], ed = t[1], other = t[2];
          var dx = ed.b[0] - ed.a[0], dy = ed.b[1] - ed.a[1];
          var sign = (pos[0] - other[0]) * dx + (pos[1] - other[1]) * dy >= 0 ? 1 : -1;
          pos[0] += dx * 0.18 * sign;
          pos[1] += dy * 0.18 * sign;
        });
      });
    });
    var floorShown = false, fenceShown = false;

    function run(n, stepMs, each, done) {
      var i = 0;
      function tick() {
        each(i);
        i++;
        if (i < n) {
          if (stepMs) api.later(tick, stepMs);
          else tick();
        } else if (done) done();
      }
      if (n) tick();
      else if (done) done();
    }

    return {
      edges: edges,
      showFloor: function (stepMs, done) {
        MQ.clear(floorG);
        MQ.clear(floorNums);
        floorShown = true;
        run(ordered.length, stepMs, function (i) {
          var p = ordered[i];
          floorG.appendChild(S('rect', { x: g.x(p[0]), y: g.y(p[1]), width: g.cell, height: g.cell, class: 'fg-floor' }));
          if (opts.numbers !== false) {
            floorNums.appendChild(S('text', { x: g.x(p[0] + 0.5), y: g.y(p[1] + 0.5), class: 'fg-num fg-num-floor', 'text-anchor': 'middle', 'dominant-baseline': 'central', style: { fontSize: fontSize + 2 + 'px' } }, String(i + 1)));
          }
          if (stepMs) api.sound('click');
        }, done);
      },
      showFence: function (stepMs, done) {
        MQ.clear(fenceG);
        fenceShown = true;
        run(edges.length, stepMs, function (i) {
          var e = edges[i];
          fenceG.appendChild(S('line', { x1: g.x(e.a[0]), y1: g.y(e.a[1]), x2: g.x(e.b[0]), y2: g.y(e.b[1]), class: 'fg-fence' }));
          if (opts.numbers !== false) {
            var mx = labelPos[i][0];
            var my = labelPos[i][1];
            fenceG.appendChild(S('text', { x: g.x(mx), y: g.y(my), class: 'fg-num fg-num-fence', 'text-anchor': 'middle', 'dominant-baseline': 'central', style: { fontSize: fontSize + 'px' } }, String(i + 1)));
          }
          if (stepMs) api.sound('click');
        }, done);
      },
      focus: function (which) {
        g.svg.classList.remove('fg-focus-area', 'fg-focus-perim');
        if (which) g.svg.classList.add('fg-focus-' + which);
      },
      shown: function () {
        return { floor: floorShown, fence: fenceShown };
      },
    };
  }

  // Grid sized to fit the shape with a 1-square border for the edge numbers.
  function gridFor(cells, maxW, maxH, maxCell) {
    var b = bbox(cells);
    var cols = b.w + 2, rows = b.h + 2;
    var cell = Math.min(maxCell || 50, Math.floor(maxW / cols), Math.floor(maxH / rows));
    return { g: MQ.ui.grid({ cols: cols, rows: rows, cell: cell, pad: 10, className: 'fg-grid' }), cells: shiftCells(cells, 1 - b.c, 1 - b.r) };
  }

  function keyword(kind) {
    var k = kind === 'area' ? AREA : PERIM;
    return el('div', { class: 'fg-key fg-key-' + (kind === 'area' ? 'area' : 'perim') },
      el('span', { class: 'fg-key-icon' }, k.icon),
      el('span', { class: 'fg-key-word' }, k.word.toUpperCase()),
      el('span', { class: 'fg-key-thing' }, '= the ' + k.thing + (kind === 'area' ? ' (squares inside)' : ' (edges round the outside)')));
  }

  function resultLine(kind, value, strong) {
    var k = kind === 'area' ? AREA : PERIM;
    return el('div', { class: 'fg-result fg-result-' + (kind === 'area' ? 'area' : 'perim') + (strong ? ' fg-result-strong' : '') }, k.icon + ' ' + k.word.charAt(0).toUpperCase() + k.word.slice(1) + ' = ' + value + ' ' + k.unit);
  }

  /* ------------------------------------------------------------------ *
   * Practice deck
   * ------------------------------------------------------------------ */

  function level1Shapes(n) {
    var all = [];
    for (var w = 2; w <= 6; w++) for (var h = 2; h <= w; h++) all.push(rect(w, h));
    var squares = U.shuffle(all.filter(function (s) { return s.w === s.h; }));
    var rects = U.shuffle(all.filter(function (s) { return s.w !== s.h; }));
    var pick = [squares[0], rects[0], rects[1], squares[1]].slice(0, n);
    return U.shuffle(pick).map(function (s) {
      return Math.random() < 0.5 ? s : { key: s.key, name: s.name, w: s.h, h: s.w, cells: rect(s.h, s.w).cells };
    });
  }

  function level2Shapes(n) {
    var pool = [lShape(4, 3, 2, 1), lShape(4, 3, 2, 2), lShape(3, 3, 1, 1), lShape(5, 3, 3, 2), lShape(4, 4, 2, 2), lShape(5, 4, 2, 3),
      tShape(3, 1, 2), tShape(5, 1, 3), tShape(5, 2, 2), uShape(3, 3, 2), uShape(4, 3, 1), uShape(5, 3, 2), uShape(5, 4, 2),
      steps(3, 1), steps(3, 2), steps(4, 1), plusShape(1, 1), plusShape(2, 1)];
    var byName = {};
    U.shuffle(pool).forEach(function (s) { if (!byName[s.name]) byName[s.name] = s; });
    return U.shuffle(Object.keys(byName)).slice(0, n).map(function (k) { return randomTurn(byName[k]); });
  }

  // [long thin, compact]: the long one has the bigger perimeter but the smaller area.
  var BIGGER_PAIRS = [
    [rect(9, 1), rect(4, 3)],
    [rect(8, 1), rect(3, 3)],
    [rect(7, 2), rect(4, 4)],
    [rect(10, 1), rect(4, 3)],
    [rect(8, 1), lShape(4, 3, 2, 1)],
  ];

  // Two shapes with the same area. Some pairs share a perimeter, most do not.
  var SAME_PAIRS = [
    [rect(6, 2), rect(4, 3)],
    [rect(6, 1), rect(3, 2)],
    [rect(8, 2), rect(4, 4)],
    [rect(5, 2), lShape(4, 3, 2, 1)],
    [rect(6, 2), lShape(4, 4, 2, 2)],
    [rect(3, 2), lShape(4, 2, 2, 1)],
    [rect(4, 2), lShape(3, 3, 1, 1)],
    [rect(9, 1), rect(3, 3)],
  ];

  var deck = null;

  function buildDeck() {
    var q = [];
    var kinds = U.shuffle(['area', 'area', 'perimeter', 'perimeter']);
    level1Shapes(4).forEach(function (s, i) { q.push({ type: 'ask', shape: s, ask: kinds[i], place: null }); });
    var k2 = U.shuffle(['area', 'perimeter', U.pick(['area', 'perimeter'])]);
    level2Shapes(3).forEach(function (s, i) { q.push({ type: 'ask', shape: s, ask: k2[i] }); });
    var places = U.shuffle(PLACES);
    q.forEach(function (x, i) { x.place = places[i % places.length]; });
    var big = U.pick(BIGGER_PAIRS);
    var same = U.pick(SAME_PAIRS);
    var l3 = U.shuffle([
      { type: 'bigger', shapes: U.shuffle(big.map(randomTurn)) },
      { type: 'same', shapes: U.shuffle(same.map(randomTurn)) },
      { type: 'grow' },
    ]);
    return q.concat(l3);
  }

  /* ------------------------------------------------------------------ *
   * Practice: area OR perimeter of one shape
   * ------------------------------------------------------------------ */

  function renderAsk(stage, api, q) {
    var shape = q.shape;
    var isArea = q.ask === 'area';
    var area = areaOf(shape);
    var perim = perimOf(shape);
    var answer = isArea ? area : perim;
    var other = isArea ? perim : area;
    var place = q.place || 'garden';
    var isRect = /rect|square/.test(shape.name) || shape.key.indexOf('rect') === 0;
    var b = bbox(shape.cells);

    api.say(isArea ? 'Area question! Count the squares on the floor.' : 'Perimeter question! Count the edges of the fence.', 'think');
    stage.appendChild(keyword(isArea ? 'area' : 'perim'));
    stage.appendChild(MQ.ui.prompt('This ' + place + ' is a' + (/^[aeiouL]/.test(shape.name) ? 'n ' : ' ') + shape.name + '. What is its <b class="fg-' + (isArea ? 'area' : 'perim') + '-word">' + (isArea ? 'area' : 'perimeter') + '</b>?'));
    var gf = gridFor(shape.cells, 560, 360, 48);
    var g = gf.g;
    var drawn = drawShape(g, gf.cells, api);
    stage.appendChild(g.svg);
    var results = el('div', { class: 'fg-results' });
    stage.appendChild(results);

    var runs = sideRuns(shape.cells);
    var rows = rowCounts(shape.cells);
    var box = MQ.ui.numberInput({
      unit: isArea ? 'square units' : 'units',
      onSubmit: function (v) {
        if (v === answer) {
          box.good();
          box.disable();
          api.check(true, isArea ? 'Yes! ' + answer + ' squares cover the floor: area = ' + answer + ' square units.' : 'Yes! ' + answer + ' edges round the outside: perimeter = ' + answer + ' units.');
          return;
        }
        box.bad();
        var second = api.tries() >= 1;
        if (v === other && other !== answer) {
          api.check(false, isArea ? 'That\'s the fence! The question asks for the floor. Count the squares inside.' : 'That\'s the floor! The question asks for the fence. Count the edges round the outside.', 'Swapped area and perimeter');
          return;
        }
        if (isArea) {
          if (isRect && v === b.w + b.h) {
            api.check(false, 'You added two sides. Area is all the squares inside. Count row by row: ' + rows.join(' + ') + '.', 'Added the sides instead of counting the squares');
          } else {
            api.check(false, second ? 'Count row by row: ' + rows.join(' + ') + ' = ?' : 'Count every square inside, one row at a time.', 'Miscounted the squares inside');
          }
        } else {
          if (isRect && v === b.w + b.h) {
            api.check(false, 'That is only two sides. The fence goes all the way round: ' + runs.join(' + ') + '.', 'Added only two sides for perimeter');
          } else {
            api.check(false, second ? 'Add up the sides as you walk round: ' + runs.join(' + ') + ' = ?' : 'Walk round the edge from one corner and count every little edge.', 'Missed some edges round the outside');
          }
        }
      },
    });
    stage.appendChild(box.el);
    box.focus();

    api.onReveal(function () {
      box.disable();
      box.setValue(String(answer));
      box.good();
      drawn.showFloor(0);
      drawn.showFence(0);
      drawn.focus(isArea ? 'area' : 'perim');
      MQ.clear(results);
      results.appendChild(resultLine('area', area, isArea));
      results.appendChild(resultLine('perim', perim, !isArea));
      if (isArea) results.appendChild(el('div', { class: 'fg-working' }, 'Rows: ' + rows.join(' + ') + ' = ' + area));
      else results.appendChild(el('div', { class: 'fg-working' }, 'Sides: ' + runs.join(' + ') + ' = ' + perim));
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice: compare two shapes
   * ------------------------------------------------------------------ */

  function twoCards(stage, api, shapes) {
    var row = el('div', { class: 'fg-two' });
    var out = [];
    var maxW = 0, maxH = 0;
    shapes.forEach(function (s) {
      var b = bbox(s.cells);
      maxW = Math.max(maxW, b.w);
      maxH = Math.max(maxH, b.h);
    });
    var cell = Math.min(40, Math.floor(340 / (maxW + 2)), Math.floor(250 / (maxH + 2)));
    shapes.forEach(function (s, i) {
      var b = bbox(s.cells);
      var g = MQ.ui.grid({ cols: maxW + 2, rows: maxH + 2, cell: cell, pad: 8, className: 'fg-grid' });
      var cells = shiftCells(s.cells, 1 + Math.floor((maxW - b.w) / 2) - b.c, 1 + Math.floor((maxH - b.h) / 2) - b.r);
      var d = drawShape(g, cells, api);
      var info = el('div', { class: 'fg-card-info' });
      row.appendChild(el('div', { class: 'fg-card' }, el('div', { class: 'fg-card-name' }, 'Shape ' + 'AB'[i]), g.svg, info));
      out.push({ shape: s, g: g, d: d, info: info, area: areaOf(s), perim: perimOf(s) });
    });
    stage.appendChild(row);
    return out;
  }

  function renderBigger(stage, api, shapes) {
    api.say('Which shape covers more squares? Look carefully!', 'think');
    stage.appendChild(keyword('area'));
    stage.appendChild(MQ.ui.prompt('Which shape has the <b class="fg-area-word">bigger area</b>?'));
    var cards = twoCards(stage, api, shapes);
    var right = cards[0].area > cards[1].area ? 'A' : 'B';
    var longer = cards[0].perim > cards[1].perim ? 'A' : 'B';
    var ch = MQ.ui.choices([{ label: 'Shape A', value: 'A' }, { label: 'Shape B', value: 'B' }], function (v) {
      if (v === right) {
        ch.mark(v, 'good');
        ch.disable();
        showAll();
        api.check(true, 'Yes! Shape ' + right + ' covers ' + cards['AB'.indexOf(right)].area + ' squares. Longer does not mean bigger!');
      } else {
        ch.mark(v, 'bad');
        api.check(false, api.tries() >= 1 ? 'Count the squares row by row in each shape, then compare.' : 'Longer is not always bigger! Count the squares inside each shape.', v === longer ? 'Thought the longer shape has the bigger area' : 'Compared the areas wrongly');
      }
    }, { columns: 2 });
    stage.appendChild(ch);
    function showAll() {
      cards.forEach(function (c) {
        c.d.showFloor(0);
        MQ.clear(c.info);
        c.info.appendChild(resultLine('area', c.area, true));
        c.info.appendChild(resultLine('perim', c.perim, false));
      });
    }
    api.onReveal(function () {
      ch.mark(right, 'good');
      ch.disable();
      showAll();
      cards.forEach(function (c) { c.d.showFence(0); c.d.focus('area'); });
    });
  }

  function renderSame(stage, api, shapes) {
    api.say('Both shapes cover the same number of squares. What about the fence round them?', 'think');
    stage.appendChild(keyword('perim'));
    var cards = twoCards(stage, api, shapes);
    stage.insertBefore(MQ.ui.prompt('Both shapes have an area of <b class="fg-area-word">' + cards[0].area + ' square units</b>. Do they have the same <b class="fg-perim-word">perimeter</b>?'), stage.lastChild);
    var same = cards[0].perim === cards[1].perim;
    var ch = MQ.ui.choices([{ label: 'Yes, the same perimeter', value: 'yes' }, { label: 'No, different perimeters', value: 'no' }], function (v) {
      var ok = (v === 'yes') === same;
      if (ok) {
        ch.mark(v, 'good');
        ch.disable();
        showAll();
        api.check(true, same ? 'Yes! Both fences are ' + cards[0].perim + ' units long.' : 'Right! Same area, but the fences are ' + cards[0].perim + ' and ' + cards[1].perim + ' units.');
      } else {
        ch.mark(v, 'bad');
        if (api.tries() >= 1) {
          api.check(false, 'Shape A\'s perimeter is ' + cards[0].perim + ' units. Now count the edges round Shape B.', same ? 'Thought same area means different perimeter' : 'Thought same area means same perimeter');
        } else {
          api.check(false, same ? 'Don\'t guess! Count the edges round each shape and compare.' : 'Same area does not always mean the same fence. Count the edges round each shape.', same ? 'Thought same area means different perimeter' : 'Thought same area means same perimeter');
        }
      }
    }, { columns: 2 });
    stage.appendChild(ch);
    function showAll() {
      cards.forEach(function (c) {
        c.d.showFence(0);
        MQ.clear(c.info);
        c.info.appendChild(resultLine('area', c.area, false));
        c.info.appendChild(resultLine('perim', c.perim, true));
      });
    }
    api.onReveal(function () {
      ch.mark(same ? 'yes' : 'no', 'good');
      ch.disable();
      cards.forEach(function (c) { c.d.showFloor(0); c.d.focus('perim'); });
      showAll();
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice: growing squares – predict 5 x 5
   * ------------------------------------------------------------------ */

  function growTable(n, withInputs) {
    var head = el('tr', null, el('th', null, 'Square'), el('th', { class: 'fg-th-area' }, '🧱 Area'), el('th', { class: 'fg-th-perim' }, '🚧 Perimeter'));
    var body = [];
    for (var i = 1; i <= n; i++) {
      body.push(el('tr', { 'data-n': i }, el('td', null, i + ' × ' + i), el('td', { class: 'fg-td-area' }, String(i * i)), el('td', { class: 'fg-td-perim' }, String(4 * i))));
    }
    return el('table', { class: 'fg-table' }, el('thead', null, head), el('tbody', null, body));
  }

  function renderGrow(stage, api) {
    api.say('The squares grow bigger each time. Can you spot the pattern?', 'think');
    stage.appendChild(MQ.ui.prompt('Predict the <b class="fg-area-word">area</b> and the <b class="fg-perim-word">perimeter</b> of a <b>5 × 5</b> square.'));
    var row = el('div', { class: 'fg-grow-row' });
    for (var n = 1; n <= 4; n++) {
      var g = MQ.ui.grid({ cols: n, rows: n, cell: 20, pad: 4, className: 'fg-grid fg-mini' });
      var cells = rect(n, n).cells;
      var d = drawShape(g, cells, api, { numbers: false });
      d.showFloor(0);
      d.showFence(0);
      row.appendChild(el('div', { class: 'fg-mini-card' }, g.svg, el('div', null, n + ' × ' + n)));
    }
    var mysteryG = MQ.ui.grid({ cols: 5, rows: 5, cell: 20, pad: 4, className: 'fg-grid fg-mini' });
    var mystery = drawShape(mysteryG, rect(5, 5).cells, api, { numbers: false });
    row.appendChild(el('div', { class: 'fg-mini-card' }, mysteryG.svg, el('div', null, '5 × 5 ?')));
    var table = growTable(4);
    var aIn = el('input', { class: 'num-input fg-small-input', type: 'text', inputmode: 'numeric', autocomplete: 'off', placeholder: '?', 'aria-label': 'Area of the 5 by 5 square' });
    var pIn = el('input', { class: 'num-input fg-small-input', type: 'text', inputmode: 'numeric', autocomplete: 'off', placeholder: '?', 'aria-label': 'Perimeter of the 5 by 5 square' });
    table.querySelector('tbody').appendChild(el('tr', { class: 'fg-row-5' }, el('td', null, '5 × 5'), el('td', null, aIn, ' sq units'), el('td', null, pIn, ' units')));
    var wrap = el('div', { class: 'fg-grow-wrap' }, row, table);
    stage.appendChild(wrap);
    var checkBtn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    stage.appendChild(checkBtn);

    function submit() {
      if (api.isAnswered()) return;
      var a = U.parseNum(aIn.value), p = U.parseNum(pIn.value);
      if (isNaN(a) || isNaN(p)) {
        api.feedback('Fill in both boxes: the area and the perimeter.', 'info');
        (isNaN(a) ? aIn : pIn).focus();
        return;
      }
      aIn.classList.toggle('good', a === 25);
      aIn.classList.toggle('bad', a !== 25);
      pIn.classList.toggle('good', p === 20);
      pIn.classList.toggle('bad', p !== 20);
      if (a === 25 && p === 20) {
        aIn.disabled = pIn.disabled = checkBtn.disabled = true;
        mystery.showFloor(0);
        mystery.showFence(0);
        api.check(true, 'Yes! 25 squares inside and 20 edges round the outside.');
        return;
      }
      if (a === 20 && p === 25) {
        api.check(false, 'You swapped them! Area is the squares inside, perimeter is the edges round the outside.', 'Swapped area and perimeter');
        return;
      }
      var second = api.tries() >= 1;
      if (a !== 25) {
        api.check(false, second ? '5 rows of 5 squares: 5 + 5 + 5 + 5 + 5 = ?' : 'Look at the area column: 1, 4, 9, 16 … Count the squares in a 5 × 5 square: 5 rows of 5.', a === 20 ? 'Swapped area and perimeter' : 'Could not find the area of the 5 × 5 square');
      } else {
        api.check(false, second ? 'A 5 × 5 square has 4 sides of 5: 5 + 5 + 5 + 5 = ?' : 'Look at the perimeter column: 4, 8, 12, 16 … it goes up by 4 each time.', p === 25 ? 'Swapped area and perimeter' : 'Could not find the perimeter of the 5 × 5 square');
      }
    }
    checkBtn.addEventListener('click', submit);
    [aIn, pIn].forEach(function (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });
    });
    api.later(function () { try { aIn.focus({ preventScroll: true }); } catch (e) { aIn.focus(); } }, 50);

    api.onReveal(function () {
      aIn.value = '25';
      pIn.value = '20';
      aIn.classList.remove('bad');
      pIn.classList.remove('bad');
      aIn.classList.add('good');
      pIn.classList.add('good');
      aIn.disabled = pIn.disabled = checkBtn.disabled = true;
      mystery.showFloor(0);
      mystery.showFence(0);
      api.feedback('Area: 5 rows of 5 = 5 + 5 + 5 + 5 + 5 = 25 square units. Perimeter: 5 + 5 + 5 + 5 = 20 units.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */

  // 1. Fence or floor? A 4 x 3 school garden.
  function learnFenceFloor(stage, api) {
    api.say('Here is the school garden. Press both buttons to see the fence and the floor.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Fence or floor?', '<b class="fg-perim-word">Perimeter</b> is a length round the edge. <b class="fg-area-word">Area</b> is the squares inside.'));
    var g = MQ.ui.grid({ cols: 6, rows: 5, cell: 58, pad: 10, className: 'fg-grid' });
    var d = drawShape(g, shiftCells(rect(4, 3).cells, 1, 1), api);
    var results = el('div', { class: 'fg-results' });
    var seen = { fence: false, floor: false };
    var busy = false;
    function finish() {
      busy = false;
      if (seen.fence && seen.floor) {
        api.say('Same garden, two different numbers: 14 units of fence, 12 square units of floor.', 'cheer');
        api.feedback('The fence is a length (units). The floor is squares (square units).', 'good');
        api.unlockNext();
      }
    }
    var fenceBtn = el('button', { class: 'btn fg-btn-perim', type: 'button' }, '🚧 Fence = perimeter');
    var floorBtn = el('button', { class: 'btn fg-btn-area', type: 'button' }, '🧱 Floor = area');
    fenceBtn.addEventListener('click', function () {
      if (busy) return;
      busy = true;
      d.focus(null);
      api.say('Walk round the edge and count each side of a square: 1, 2, 3 …');
      d.showFence(140, function () {
        seen.fence = true;
        if (!results.querySelector('.fg-result-perim')) results.appendChild(resultLine('perim', 14, true));
        finish();
      });
    });
    floorBtn.addEventListener('click', function () {
      if (busy) return;
      busy = true;
      d.focus(null);
      api.say('Count every square inside the garden: 1, 2, 3 …');
      d.showFloor(160, function () {
        seen.floor = true;
        if (!results.querySelector('.fg-result-area')) results.appendChild(resultLine('area', 12, true));
        finish();
      });
    });
    stage.appendChild(el('div', { class: 'fg-toggle' }, fenceBtn, floorBtn));
    stage.appendChild(g.svg);
    stage.appendChild(results);
  }

  // 2. The 3 x 3 trap.
  function learnTrap(stage, api) {
    api.say('Careful, this one is a trap! Which number is the area?', 'think');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('The 3 × 3 trap', 'A 3 × 3 square. Two numbers: <b>9</b> and <b>12</b>.'));
    var g = MQ.ui.grid({ cols: 5, rows: 5, cell: 54, pad: 10, className: 'fg-grid' });
    var d = drawShape(g, shiftCells(rect(3, 3).cells, 1, 1), api);
    var ask = el('div', { class: 'fg-trap-ask' });
    var results = el('div', { class: 'fg-results' });
    stage.appendChild(el('div', { class: 'fg-trap' }, g.svg, ask));
    stage.appendChild(results);

    function step(kind) {
      MQ.clear(ask);
      var isArea = kind === 'area';
      ask.appendChild(keyword(isArea ? 'area' : 'perim'));
      ask.appendChild(MQ.ui.prompt('Which number is the <b class="fg-' + (isArea ? 'area' : 'perim') + '-word">' + (isArea ? 'area' : 'perimeter') + '</b>?'));
      var ch = MQ.ui.choices([9, 12], function (v) {
        var right = isArea ? 9 : 12;
        if (v === right) {
          ch.mark(v, 'good');
          ch.disable();
          api.sound('correct');
          if (isArea) {
            api.feedback('Yes! 9 squares inside, so the area is 9 square units.', 'good');
            d.showFloor(150, function () {
              results.appendChild(resultLine('area', 9, true));
              api.later(function () { step('perim'); }, 500);
            });
          } else {
            api.feedback('Yes! 12 edges round the outside, so the perimeter is 12 units.', 'good');
            d.showFence(130, function () {
              results.appendChild(resultLine('perim', 12, true));
              api.say('9 squares inside, 12 edges round the outside. Don\'t fall in the trap!', 'cheer');
              api.unlockNext();
            });
          }
        } else {
          ch.mark(v, 'bad');
          api.sound('wrong');
          api.feedback(isArea ? '12 counts the edges round the outside. Area counts the squares inside.' : '9 is the squares inside. Perimeter counts the edges round the outside.', 'try');
        }
      }, { columns: 2 });
      ask.appendChild(ch);
    }
    step('area');
  }

  // 3. Growing squares: same number, different meaning.
  function learnGrow(stage, api) {
    api.say('Click each square to count its area and perimeter. Watch the 4 × 4 one!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Same number, different meaning', 'Click each square to fill in the table.'));
    var row = el('div', { class: 'fg-grow-row' });
    var table = growTable(4);
    var rowsEls = table.querySelectorAll('tbody tr');
    Array.prototype.forEach.call(rowsEls, function (tr) { tr.classList.add('fg-hidden-row'); });
    var opened = 0;
    for (var n = 1; n <= 4; n++) {
      (function (n) {
        var g = MQ.ui.grid({ cols: n, rows: n, cell: 30, pad: 6, className: 'fg-grid fg-mini' });
        var d = drawShape(g, rect(n, n).cells, api, { numbers: false });
        var card = el('button', { class: 'fg-mini-card fg-mini-btn', type: 'button' }, g.svg, el('div', null, n + ' × ' + n));
        var done = false;
        card.addEventListener('click', function () {
          if (done) return;
          done = true;
          card.classList.add('fg-opened');
          d.showFloor(0);
          d.showFence(0);
          api.sound('pop');
          rowsEls[n - 1].classList.remove('fg-hidden-row');
          opened++;
          if (n === 4) {
            rowsEls[3].classList.add('fg-row-same');
            api.say('16 and 16! But 16 squares inside, and 16 edges round the outside.', 'cheer');
          } else {
            api.say(n + ' × ' + n + ': area ' + n * n + ' square units, perimeter ' + 4 * n + ' units.');
          }
          if (opened === 4) {
            api.feedback('At 4 × 4 the numbers match, but one counts squares and one counts edges.', 'good');
            api.unlockNext();
          }
        });
        row.appendChild(card);
      })(n);
    }
    stage.appendChild(el('div', { class: 'fg-grow-wrap' }, row, table));
  }

  MQ.register('fence-or-grass', {
    learn: [learnFenceFloor, learnTrap, learnGrow],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'ask') return renderAsk(stage, api, q);
        if (q.type === 'bigger') return renderBigger(stage, api, q.shapes);
        if (q.type === 'same') return renderSame(stage, api, q.shapes);
        return renderGrow(stage, api);
      },
    },
  });

  var css = [
    '.fg-grid{background:#fff;border-radius:12px}',
    '.fg-plain{fill:#f4f1e8}',
    '.fg-floor{fill:#a8dd9b}',
    '.fg-outline line{stroke:#5b6475;stroke-width:3;stroke-linecap:round}',
    '.fg-fence{stroke:#e8590c;stroke-width:7;stroke-linecap:round}',
    '.fg-num{font-weight:800;pointer-events:none}',
    '.fg-num-floor{fill:#1e5c2b}',
    '.fg-num-fence{fill:#c2410c}',
    '.fg-focus-area .fg-fence-layer{opacity:.25}',
    '.fg-focus-perim .fg-floor-layer,.fg-focus-perim .fg-floor-nums{opacity:.3}',
    '.fg-key{display:flex;align-items:center;gap:12px;padding:8px 20px;border-radius:16px;border:3px solid;font-weight:800;flex-wrap:wrap;justify-content:center}',
    '.fg-key-icon{font-size:2.2rem}',
    '.fg-key-word{font-size:2rem;letter-spacing:.04em}',
    '.fg-key-thing{font-size:1.05rem}',
    '.fg-key-area{background:#e6f6e1;border-color:#2b8a3e;color:#2b8a3e}',
    '.fg-key-perim{background:#fff0e3;border-color:#d9480f;color:#c2410c}',
    '.prompt b.fg-area-word,.lesson b.fg-area-word{color:#2b8a3e}',
    '.prompt b.fg-perim-word,.lesson b.fg-perim-word{color:#d9480f}',
    '.fg-results{display:flex;flex-direction:column;align-items:center;gap:4px;min-height:0}',
    '.fg-result{font-size:1.15rem;font-weight:700;padding:2px 10px;border-radius:10px}',
    '.fg-result-area{color:#2b8a3e}',
    '.fg-result-perim{color:#c2410c}',
    '.fg-result-strong{font-size:1.35rem;font-weight:800;background:#fff3cd}',
    '.fg-working{font-weight:700;color:var(--ink-soft)}',
    '.fg-toggle{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}',
    '.fg-btn-perim{background:#ffe1cc;color:#a13a0b}',
    '.fg-btn-area{background:#d7f0cf;color:#1e5c2b}',
    '.fg-trap{display:flex;gap:20px;align-items:center;justify-content:center;flex-wrap:wrap}',
    '.fg-trap-ask{display:flex;flex-direction:column;align-items:center;gap:10px;min-width:280px}',
    '.fg-two{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;width:100%}',
    '.fg-card{background:#fff;border:3px solid var(--line);border-radius:16px;padding:8px;display:flex;flex-direction:column;align-items:center;gap:4px}',
    '.fg-card .fg-grid{max-width:360px}',
    '.fg-card-name{font-weight:800;font-size:1.2rem}',
    '.fg-card-info{display:flex;flex-direction:column;align-items:center;min-height:1.4em}',
    '.fg-card-info .fg-result{font-size:1rem}',
    '.fg-grow-wrap{display:flex;flex-direction:column;align-items:center;gap:14px}',
    '.fg-grow-row{display:flex;gap:12px;align-items:flex-end;justify-content:center;flex-wrap:wrap}',
    '.fg-mini-card{display:flex;flex-direction:column;align-items:center;gap:4px;font-weight:800;background:#fff;border:3px solid var(--line);border-radius:14px;padding:8px;font-family:inherit;font-size:1rem;color:var(--ink)}',
    '.fg-mini-btn{cursor:pointer}',
    '.fg-mini-btn:hover:not(.fg-opened){border-color:var(--accent)}',
    '.fg-opened{border-color:var(--good)}',
    '.fg-mini .fg-fence{stroke-width:4}',
    '.fg-table{border-collapse:collapse;font-size:1.15rem;background:#fff}',
    '.fg-table th,.fg-table td{border:2px solid var(--line);padding:6px 14px;text-align:center}',
    '.fg-th-area,.fg-td-area{color:#2b8a3e;font-weight:800}',
    '.fg-th-perim,.fg-td-perim{color:#c2410c;font-weight:800}',
    '.fg-hidden-row td.fg-td-area,.fg-hidden-row td.fg-td-perim{color:transparent}',
    '.fg-row-same td{background:#fff3cd}',
    '.fg-small-input{width:80px;height:46px;font-size:1.3rem}',
    '.fg-row-5 td{font-weight:800}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'fence-or-grass' }, css));
})();

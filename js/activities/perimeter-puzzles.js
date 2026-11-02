/* Perimeter Puzzles — square patterns, working backwards and secret perimeters (Unit 6.2). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var SIDE_COLORS = ['#e85d04', '#2a7de1', '#1f9d6b', '#8e44ad'];

  function rep(n, times) {
    var a = [];
    for (var i = 0; i < times; i++) a.push(n);
    return a;
  }

  /* ------------------------------------------------------------------ *
   * A plain square (or regular polygon) drawing with labels and ticks.
   * ------------------------------------------------------------------ */
  function plainShape(pts, opts) {
    opts = opts || {};
    var W = opts.W || 360;
    var H = opts.H || 300;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'pp-svg', style: { maxWidth: '100%', height: 'auto' } });
    var base = svg('g');
    var top = svg('g');
    root.appendChild(base);
    root.appendChild(top);
    var poly = svg('polygon', { points: pts.map(function (p) { return p.join(','); }).join(' '), class: 'pp-shape ' + (opts.fill || '') });
    base.appendChild(poly);
    var cx = 0, cy = 0;
    pts.forEach(function (p) {
      cx += p[0] / pts.length;
      cy += p[1] / pts.length;
    });
    var o = { svg: root, top: top, base: base, pts: pts, cx: cx, cy: cy };
    o.normal = function (i) {
      var a = pts[i];
      var b = pts[(i + 1) % pts.length];
      var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      var dx = b[0] - a[0], dy = b[1] - a[1];
      var L = Math.sqrt(dx * dx + dy * dy);
      var n = [dy / L, -dx / L];
      if ((mx - cx) * n[0] + (my - cy) * n[1] < 0) n = [-n[0], -n[1]];
      return { n: n, m: [mx, my] };
    };
    o.label = function (i, text, cls) {
      var q = o.normal(i);
      var off = 24 + 20 * Math.abs(q.n[0]);
      var t = svg('text', { x: q.m[0] + q.n[0] * off, y: q.m[1] + q.n[1] * off + 7, 'text-anchor': 'middle', class: 'pp-label ' + (cls || '') }, text);
      top.appendChild(t);
      return t;
    };
    o.tick = function (i) {
      var q = o.normal(i);
      top.appendChild(svg('line', { x1: q.m[0] - q.n[0] * 9, y1: q.m[1] - q.n[1] * 9, x2: q.m[0] + q.n[0] * 9, y2: q.m[1] + q.n[1] * 9, class: 'pp-tick' }));
    };
    o.light = function (i, color) {
      var a = pts[i];
      var b = pts[(i + 1) % pts.length];
      top.appendChild(svg('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'pp-lit', style: { stroke: color || '#e85d04' } }));
    };
    o.center = function (text, cls) {
      var t = svg('text', { x: cx, y: cy + 8, 'text-anchor': 'middle', class: 'pp-center ' + (cls || '') }, text);
      top.appendChild(t);
      return t;
    };
    return o;
  }
  function squarePts(x, y, s) {
    return [[x, y], [x + s, y], [x + s, y + s], [x, y + s]];
  }
  function triPts(cx, cy, s) {
    var h = (s * Math.sqrt(3)) / 2;
    return [[cx, cy - (2 * h) / 3], [cx + s / 2, cy + h / 3], [cx - s / 2, cy + h / 3]];
  }

  // A small "4 times table" strip: side 1..6 against perimeter 4..24.
  function timesStrip(highlightP) {
    var t = el('table', { class: 'pp-table pp-table-small' });
    var r1 = el('tr', null, el('th', null, 'Side'));
    var r2 = el('tr', null, el('th', null, 'Perimeter'));
    for (var s = 1; s <= 6; s++) {
      var on = s * 4 === highlightP;
      r1.appendChild(el('td', { class: on ? 'pp-hl' : '' }, s + ' cm'));
      r2.appendChild(el('td', { class: on ? 'pp-hl' : '' }, s * 4 + ' cm'));
    }
    t.appendChild(r1);
    t.appendChild(r2);
    return t;
  }

  /* ------------------------------------------------------------------ *
   * Practice deck
   * ------------------------------------------------------------------ */
  var deck = null;
  function buildDeck() {
    // 4 is left out: a 4 cm square has 16 squares inside AND a 16 cm perimeter, so
    // counting the squares by mistake would still give the right answer.
    var sides = U.shuffle([2, 3, 5, 6]);
    var l1 = U.shuffle([{ type: 'sqP', n: sides[0] }, { type: 'sqP', n: sides[1] }, { type: 'triP' }]);
    var ps = U.shuffle([8, 12, 16, 20, 24]);
    var l2 = U.shuffle([{ type: 'sqSide', p: ps[0] }, { type: 'sqSide', p: ps[1] }, { type: 'grow' }]);
    var seqs = [
      { terms: [24, 20, 16], next: 12 },
      { terms: [24, 20, 16, 12], next: 8 },
      { terms: [20, 16, 12], next: 8 },
    ];
    var l3 = U.shuffle([{ type: 'build', target: U.pick([12, 16, 20]) }, { type: 'pattern', seq: U.pick(seqs) }]);
    return l1.concat(l2, l3);
  }

  /* ------------------------------------------------------------------ *
   * Styles
   * ------------------------------------------------------------------ */
  var css = [
    '.pp-svg{display:block}',
    '.pp-shape{fill:#e3ecff;stroke:var(--ink);stroke-width:4;stroke-linejoin:round}',
    '.pp-shape.pp-ghost{fill:none;stroke:#8a94ad;stroke-width:3;stroke-dasharray:8 6}',
    '.pp-shape.pp-warm{fill:#ffe9c7}',
    '.pp-sq{fill:#d9ccff;stroke:#4b2aa8;stroke-width:3}',
    '.pp-sq-new{fill:#ffd8b0;stroke:#c2410c}',
    '.pp-ghostsq{fill:none;stroke:#8a94ad;stroke-width:3;stroke-dasharray:7 5}',
    '.pp-label{font-size:21px;font-weight:800;fill:var(--ink);paint-order:stroke;stroke:#fff;stroke-width:5px}',
    '.pp-label.pp-new{fill:#e85d04}',
    '.pp-label.pp-q{fill:#b26b00}',
    '.pp-small{font-size:15px;font-weight:800;fill:var(--ink-soft)}',
    '.pp-center{font-size:21px;font-weight:800;fill:#4b2aa8}',
    '.pp-tick{stroke:var(--ink);stroke-width:3}',
    '.pp-lit{stroke-width:7;stroke-linecap:round}',
    '.pp-token{transition:transform .35s ease}',
    '.pp-table{border-collapse:collapse;font-size:1.15rem;font-weight:800;background:#fff}',
    '.pp-table th,.pp-table td{border:2px solid var(--line);padding:6px 12px;text-align:center;min-width:54px}',
    '.pp-table th{background:var(--paper-2);text-align:left}',
    '.pp-jump{display:block;color:#c2410c;font-size:.8rem;line-height:1}',
    '.pp-table .pp-hl{background:#fff3cd}',
    '.pp-table-small{font-size:1rem}',
    '.pp-table-small th,.pp-table-small td{padding:4px 8px;min-width:44px}',
    '.pp-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.pp-mid{align-items:center;gap:18px}',
    '.pp-sum{min-height:48px;display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.pp-note{font-size:1.05rem;font-weight:800;color:#0b6e66;text-align:center}',
    '.pp-live{font-size:1.25rem;font-weight:800;text-align:center}',
    '.pp-live b{color:#c2410c}',
    '.pp-rect{fill:#dff3d8;stroke:var(--ink);stroke-width:4}',
    '.pp-handle circle{fill:var(--gold);stroke:#7a5200;stroke-width:3}',
    '.pp-handle text{font-size:16px;font-weight:800;fill:#2b1d00;pointer-events:none}',
    '.pp-handle.dragging circle{fill:#ffd166}',
    '.pp-anchor{fill:var(--ink)}',
    '.pp-seq{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;font-size:1.5rem;font-weight:800}',
    '.pp-seq .chip{font-size:1.5rem;min-width:56px;text-align:center}',
    '.pp-seq .pp-gap{color:#c2410c;font-size:1rem;min-width:30px;text-align:center}',
    '.pp-small-note{font-size:1rem;font-weight:700;color:var(--ink-soft)}',
    '.pp-blank{background:#fff3cd;border-color:var(--gold)}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'perimeter-puzzles' }, css));

  /* ------------------------------------------------------------------ *
   * Activity
   * ------------------------------------------------------------------ */
  MQ.register('perimeter-puzzles', {
    learn: [
      // 1. Growing squares
      function (stage, api) {
        api.lockNext();
        api.say('Each new square has sides 1 cm longer. What happens to the perimeter? Press Grow!');
        stage.appendChild(MQ.ui.lesson('Growing squares', null));
        var g = MQ.ui.grid({ cols: 26, rows: 7, cell: 20, pad: 10 });
        stage.appendChild(g.svg);
        var cols = el('tr', null, el('th', null, 'Side'));
        var perims = el('tr', null, el('th', null, 'Perimeter'));
                var pCells = [];
                for (var s = 1; s <= 6; s++) {
          cols.appendChild(el('td', null, s + ' cm'));
          var pc = el('td', null, '');
          perims.appendChild(pc);
          pCells.push(pc);
        }
        stage.appendChild(el('table', { class: 'pp-table' }, cols, perims));
        var sumBox = el('div', { class: 'pp-sum' });
        var btn = el('button', { class: 'btn', type: 'button' }, '🌱 Grow');
        stage.appendChild(el('div', { class: 'pp-btns pp-mid' }, btn, sumBox));
        var shown = 0;
        var last = null;
        function add() {
          if (shown >= 6) return;
          shown++;
          var side = shown;
          var start = ((side - 1) * side) / 2 + (side - 1);
          if (last) last.setAttribute('class', 'pp-sq');
          last = svg('rect', { x: g.x(start), y: g.y(7 - side), width: side * g.cell, height: side * g.cell, class: 'pp-sq pp-sq-new' });
          g.layer.appendChild(last);
          g.layer.appendChild(svg('text', { x: g.x(start) + (side * g.cell) / 2, y: g.y(7 - side) - 6, 'text-anchor': 'middle', class: 'pp-small' }, side + ' cm'));
          pCells[side - 1].textContent = side * 4 + ' cm';
          if (side > 1) pCells[side - 1].appendChild(el('span', { class: 'pp-jump' }, '+4'));
          pCells[side - 1].classList.add('pp-hl');
          if (side > 1) {
            pCells[side - 2].classList.remove('pp-hl');
          }
          MQ.clear(sumBox);
          sumBox.appendChild(MQ.ui.sum(rep(side, 4), side * 4, 'cm'));
          api.sound('pop');
          if (side === 1) {
            api.say('A 1 cm square: 1 + 1 + 1 + 1 = 4 cm. Press Grow again.', 'happy');
          } else if (side < 6) {
            api.say('Each of the 4 sides got 1 cm longer, so the perimeter grew by 4 cm.', 'think');
          } else {
            btn.disabled = true;
            api.say('4, 8, 12, 16, 20, 24. That is the 4 times table! Say it with me.', 'cheer');
            api.feedback('4, 8, 12, 16, 20, 24: up 4 each time, the 4 times table! Each side grows 1 cm, and a square has 4 sides.', 'good');
            api.unlockNext();
          }
        }
        btn.addEventListener('click', add);
        add();
      },

      // 2. Working backwards
      function (stage, api) {
        api.say('This square has a perimeter of 16 cm. How long is each side? Let\'s share the 16 out!', 'think');
        stage.appendChild(MQ.ui.lesson('Working backwards: perimeter = 16 cm', null));
        var W = 560, H = 270;
        var sx = 280, sy = 30, unit = 52, side = unit * 4;
        var sh = plainShape(squarePts(sx, sy, side), { W: W, H: H });
        var tokens = [];
        var tokG = svg('g');
        sh.svg.appendChild(tokG);
        var labelG = svg('g');
        sh.svg.appendChild(labelG);
        function home(i) {
          return [40 + (i % 4) * 44, 84 + Math.floor(i / 4) * 44];
        }
        function target(i) {
          var k = i % 4;
          var j = Math.floor(i / 4);
          var a = j * unit + unit / 2;
          if (k === 0) return [sx + a, sy];
          if (k === 1) return [sx + side, sy + a];
          if (k === 2) return [sx + side - a, sy + side];
          return [sx, sy + side - a];
        }
        function setPos(t, p) {
          t.style.transform = 'translate(' + p[0] + 'px,' + p[1] + 'px)';
        }
        for (var i = 0; i < 16; i++) {
          var t = svg('circle', { cx: 0, cy: 0, r: 13, class: 'pp-token', style: { fill: '#ffb703', stroke: '#7a5200', strokeWidth: 2 } });
          setPos(t, home(i));
          tokG.appendChild(t);
          tokens.push(t);
        }
        labelG.appendChild(svg('text', { x: 106, y: 52, 'text-anchor': 'middle', class: 'pp-small' }, '16 counters = 16 cm'));
        var sumBox = el('div', { class: 'pp-sum' });
        var btn = el('button', { class: 'btn', type: 'button' }, '🤲 Share them out');
        stage.appendChild(sh.svg);
        stage.appendChild(btn);
        stage.appendChild(sumBox);
        var busy = false;
        btn.addEventListener('click', function () {
          if (busy) return;
          busy = true;
          btn.disabled = true;
          MQ.clear(sumBox);
          while (sh.top.firstChild) sh.top.removeChild(sh.top.firstChild);
          tokens.forEach(function (tk, n) {
            tk.style.fill = '#ffb703';
            setPos(tk, home(n));
          });
          var counts = [0, 0, 0, 0];
          var k = 0;
          function step() {
            if (k >= 16) {
              for (var s = 0; s < 4; s++) sh.label(s, '4 cm', 'pp-new');
              sumBox.appendChild(MQ.ui.sum([4, 4, 4, 4], 16, 'cm'));
              api.say('4 on each side! Each side is 4 cm. Check: 4 + 4 + 4 + 4 = 16.', 'cheer');
              api.feedback('16 shared between 4 sides = 4 on each side. Share the perimeter between the 4 equal sides.', 'good');
              btn.textContent = '🤲 Share again';
              btn.disabled = false;
              busy = false;
              return;
            }
            var tk = tokens[k];
            var sideNo = k % 4;
            tk.style.fill = SIDE_COLORS[sideNo];
            setPos(tk, target(k));
            counts[sideNo]++;
            api.sound('click');
            k++;
            api.later(step, 330);
          }
          step();
        });
      },

      // 3. Double it
      function (stage, api) {
        api.say('This square has 3 cm sides. What happens to the perimeter if we double the sides?', 'think');
        stage.appendChild(MQ.ui.lesson('Double it', null));
        var g = MQ.ui.grid({ cols: 8, rows: 7, cell: 26, pad: 30 });
        stage.appendChild(g.svg);
        var shapeG = svg('g');
        g.layer.appendChild(shapeG);
        var sumBox = el('div', { class: 'pp-sum' });
        var bDouble = el('button', { class: 'btn', type: 'button' }, '✖2 Double the sides');
        var bHalf = el('button', { class: 'btn btn-ghost', type: 'button', disabled: true }, '½ Halve');
        stage.appendChild(el('div', { class: 'pp-btns' }, bDouble, bHalf));
        stage.appendChild(sumBox);
        function draw(n) {
          MQ.clear(shapeG);
          MQ.clear(sumBox);
          if (n === 6) shapeG.appendChild(svg('rect', { x: g.x(1), y: g.y(1), width: 3 * g.cell, height: 3 * g.cell, class: 'pp-ghostsq' }));
          shapeG.appendChild(svg('rect', { x: g.x(1), y: g.y(1), width: n * g.cell, height: n * g.cell, class: n === 6 ? 'pp-sq pp-sq-new' : 'pp-sq', style: { fillOpacity: 0.55 } }));
          shapeG.appendChild(svg('text', { x: g.x(1) + (n * g.cell) / 2, y: g.y(1) - 10, 'text-anchor': 'middle', class: 'pp-label' }, n + ' cm'));
          shapeG.appendChild(svg('text', { x: g.x(1) - 8, y: g.y(1) + (n * g.cell) / 2 + 7, 'text-anchor': 'end', class: 'pp-label', style: { fontSize: '17px' } }, n + ' cm'));
          sumBox.appendChild(MQ.ui.sum(rep(n, 4), n * 4, 'cm'));
          if (n === 6) sumBox.appendChild(el('div', { class: 'pp-note' }, 'Perimeter 12 cm → 24 cm. 12 + 12 = 24: the perimeter doubled too!'));
        }
        draw(3);
        bDouble.addEventListener('click', function () {
          draw(6);
          bDouble.disabled = true;
          bHalf.disabled = false;
          api.sound('pop');
          api.say('Sides 3 → 6 cm. Perimeter 12 → 24 cm. Double the sides, double the perimeter!', 'cheer');
        });
        bHalf.addEventListener('click', function () {
          draw(3);
          bDouble.disabled = false;
          bHalf.disabled = true;
          api.sound('pop');
          api.say('Halve the sides: 6 → 3 cm. The perimeter halves too: 24 → 12 cm.', 'happy');
        });
      },
    ],

    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        var sumBox = el('div', { class: 'pp-sum' });

        // ---------- square or triangle: find the perimeter ----------
        if (q.type === 'sqP' || q.type === 'triP') {
          var isTri = q.type === 'triP';
          var n = isTri ? 4 : q.n;
          var k = isTri ? 3 : 4;
          var total = n * k;
          var shape;
          if (isTri) {
            api.say('All 3 sides are the same. Add them all!', 'think');
            stage.appendChild(MQ.ui.prompt('A regular triangle has sides of <b>4 cm</b>. What is its perimeter?'));
            shape = plainShape(triPts(180, 165, 200), { W: 360, H: 270, fill: 'pp-warm' });
          } else {
            api.say('A square has 4 equal sides. Add all 4!', 'think');
            stage.appendChild(MQ.ui.prompt('This square has sides of <b>' + n + ' cm</b>. What is its perimeter?<br><span class="pp-small-note">Each square on the grid is 1 cm.</span>'));
            var cell = Math.min(48, Math.floor(180 / n));
            var size = n * cell;
            var g = MQ.ui.grid({ cols: n, rows: n, cell: cell, pad: 36 });
            var gutter = 34; // extra room left and right for the side labels
            shape = plainShape(squarePts(g.x(0) + gutter, g.y(0), size), { W: g.width + gutter * 2, H: g.height });
            var lines = g.svg.querySelector('.grid-lines');
            lines.setAttribute('transform', 'translate(' + gutter + ',0)');
            shape.svg.insertBefore(lines, shape.svg.firstChild);
            shape.base.querySelector('polygon').style.fillOpacity = 0.6;
          }
          shape.label(0, n + ' cm');
          for (var s = 0; s < k; s++) shape.tick(s);
          stage.appendChild(shape.svg);
          var input = MQ.ui.numberInput({
            unit: 'cm',
            onSubmit: function (v) {
              if (v === total) {
                input.good();
                input.disable();
                sumBox.appendChild(MQ.ui.sum(rep(n, k), total, 'cm'));
                api.check(true, 'Yes! ' + rep(n, k).join(' + ') + ' = ' + total + ' cm.');
                return;
              }
              input.bad();
              var hint, tag;
              if (v === n * (k - 1)) {
                tag = k === 4 ? 'Added only 3 sides' : 'Added only 2 sides';
                hint = 'So close! You added ' + (k - 1) + ' sides. A ' + (isTri ? 'triangle' : 'square') + ' has ' + k + ' sides.';
              } else if (v === n) {
                tag = 'Added only the labelled sides';
                hint = 'That is just one side. The tick marks show all ' + k + ' sides are ' + n + ' cm.';
              } else if (!isTri && v === n * n) {
                tag = 'Counted squares inside instead of edges';
                hint = 'That is the number of squares inside. Perimeter is the walk round the edge.';
              } else if (v === n * 2) {
                tag = 'Added only 2 sides';
                hint = 'You added 2 sides. Walk all the way round: there are ' + k + ' sides.';
              } else {
                tag = 'Added the sides wrongly';
                hint = 'Not quite. Add ' + n + ' for each side as you go round.';
              }
              if (api.tries() >= 1) hint += ' Try ' + rep(n, k).join(' + ') + ' = ?';
              api.check(false, hint, tag);
              input.focus();
            },
          });
          stage.appendChild(input.el);
          stage.appendChild(sumBox);
          input.focus();
          api.onReveal(function () {
            input.setValue(String(total));
            input.good();
            input.disable();
            for (var i = 0; i < k; i++) {
              shape.light(i, SIDE_COLORS[i]);
              if (i) shape.label(i, n + ' cm', 'pp-new');
            }
            MQ.clear(sumBox);
            sumBox.appendChild(MQ.ui.sum(rep(n, k), total, 'cm'));
            api.feedback(k + ' sides of ' + n + ' cm: ' + rep(n, k).join(' + ') + ' = ' + total + ' cm.', 'info');
          });
          return;
        }

        // ---------- square: perimeter given, find the side ----------
        if (q.type === 'sqSide') {
          var side = q.p / 4;
          api.say('Work backwards! Share the perimeter between the 4 equal sides.', 'think');
          stage.appendChild(MQ.ui.prompt('A square has a perimeter of <b>' + q.p + ' cm</b>. How long is each side?'));
          var sq = plainShape(squarePts(105, 34, 170), { W: 380, H: 236 });
          sq.label(0, '?', 'pp-q');
          for (var t = 0; t < 4; t++) sq.tick(t);
          sq.center('Perimeter').setAttribute('y', sq.cy - 6);
          sq.center('= ' + q.p + ' cm').setAttribute('y', sq.cy + 24);
          stage.appendChild(sq.svg);
          var helper = el('div');
          var inp = MQ.ui.numberInput({
            unit: 'cm',
            onSubmit: function (v) {
              if (v === side) {
                inp.good();
                inp.disable();
                MQ.clear(helper);
                sumBox.appendChild(MQ.ui.sum(rep(side, 4), q.p, 'cm'));
                api.check(true, 'Yes! ' + q.p + ' shared between 4 sides is ' + side + ' cm each. Check: ' + rep(side, 4).join(' + ') + ' = ' + q.p + '.');
                return;
              }
              inp.bad();
              var hint, tag;
              if (v === q.p / 2) {
                tag = 'Divided by 2 instead of 4';
                hint = 'You shared between 2 sides. A square has 4 sides! Check: ' + v + ' + ' + v + ' + ' + v + ' + ' + v + ' is too much.';
              } else if (v === q.p) {
                tag = 'Gave the perimeter, not one side';
                hint = q.p + ' cm is the whole walk round. How long is just one side?';
              } else if (v === 4) {
                tag = 'Gave the number of sides';
                hint = '4 is how many sides there are. What number added 4 times makes ' + q.p + '?';
              } else if (v === q.p - 4) {
                tag = 'Took away 4 instead of sharing';
                hint = 'Share ' + q.p + ' between the 4 sides instead of taking 4 away. What number + itself 4 times makes ' + q.p + '?';
              } else {
                tag = 'Did not share the perimeter between 4 sides';
                hint = 'Check: ' + v + ' + ' + v + ' + ' + v + ' + ' + v + ' = ' + v * 4 + ', not ' + q.p + '. Try a ' + (v * 4 > q.p ? 'smaller' : 'bigger') + ' number.';
              }
              if (api.tries() >= 1) {
                hint += ' Use the table: find ' + q.p + ' cm in the perimeter row.';
                MQ.clear(helper);
                helper.appendChild(timesStrip(q.p));
              }
              api.check(false, hint, tag);
              inp.focus();
            },
          });
          stage.appendChild(inp.el);
          stage.appendChild(helper);
          stage.appendChild(sumBox);
          inp.focus();
          api.onReveal(function () {
            inp.setValue(String(side));
            inp.good();
            inp.disable();
            MQ.clear(helper);
            for (var i = 0; i < 4; i++) {
              sq.light(i, SIDE_COLORS[i]);
              if (i) sq.label(i, side + ' cm', 'pp-new');
            }
            sq.top.querySelector('.pp-q').textContent = side + ' cm';
            MQ.clear(sumBox);
            sumBox.appendChild(MQ.ui.sum(rep(side, 4), q.p, 'cm'));
            api.feedback(q.p + ' shared between 4 sides = ' + side + ' cm on each side.', 'info');
          });
          return;
        }

        // ---------- each side grows by 2 cm ----------
        if (q.type === 'grow') {
          api.say('Every side gets longer. Think about the new side first!', 'think');
          stage.appendChild(MQ.ui.prompt('Each side of this <b>5 cm</b> square gets <b>2 cm longer</b>. What is the new perimeter?'));
          var unitPx = 26;
          var gs = plainShape(squarePts(90, 44, 5 * unitPx), { W: 380, H: 232 });
          gs.base.insertBefore(svg('polygon', { points: squarePts(90, 44, 7 * unitPx).map(function (p) { return p.join(','); }).join(' '), class: 'pp-shape pp-ghost' }), gs.base.firstChild);
          gs.label(0, '5 cm');
          gs.label(3, '5 cm');
          gs.top.appendChild(svg('text', { x: 90 + 6 * unitPx, y: 36, 'text-anchor': 'middle', class: 'pp-label pp-new' }, '+2'));
          gs.top.appendChild(svg('text', { x: 90 + 7 * unitPx + 26, y: 44 + 6 * unitPx + 7, 'text-anchor': 'middle', class: 'pp-label pp-new' }, '+2'));
          stage.appendChild(gs.svg);
          var gi = MQ.ui.numberInput({
            unit: 'cm',
            onSubmit: function (v) {
              if (v === 28) {
                gi.good();
                gi.disable();
                sumBox.appendChild(MQ.ui.sum([7, 7, 7, 7], 28, 'cm'));
                api.check(true, 'Yes! The new side is 7 cm. 7 + 7 + 7 + 7 = 28 cm. That is 8 cm more: 2 cm for each of the 4 sides.');
                return;
              }
              gi.bad();
              var hint, tag;
              if (v === 22) {
                tag = 'Added 2 instead of 8 when each side grew by 2';
                hint = 'You added 2 once. But ALL 4 sides grow by 2 cm! How long is each new side?';
              } else if (v === 20) {
                tag = 'Gave the old perimeter';
                hint = '20 cm is the perimeter before it grew. Each side is now 5 + 2 = 7 cm.';
              } else if (v === 7) {
                tag = 'Gave the new side, not the perimeter';
                hint = 'Yes, each side is now 7 cm! Now walk all the way round: 4 sides.';
              } else if (v === 21) {
                tag = 'Added only 3 sides';
                hint = 'You added 3 sides of 7 cm. A square has 4 sides.';
              } else {
                tag = 'Added the sides wrongly';
                hint = 'Not quite. Each side is 5 cm + 2 cm. Then add all 4 sides.';
              }
              if (api.tries() >= 1) hint += ' New side: 5 + 2 = 7 cm. Now add 7 + 7 + 7 + 7.';
              api.check(false, hint, tag);
              gi.focus();
            },
          });
          stage.appendChild(gi.el);
          stage.appendChild(sumBox);
          gi.focus();
          api.onReveal(function () {
            gi.setValue('28');
            gi.good();
            gi.disable();
            var big = squarePts(90, 44, 7 * unitPx);
            var bigShape = svg('polygon', { points: big.map(function (p) { return p.join(','); }).join(' '), class: 'pp-shape pp-warm', style: { fillOpacity: 0.5 } });
            gs.base.insertBefore(bigShape, gs.base.firstChild);
            gs.top.appendChild(svg('text', { x: 90 + 7 * unitPx + 34, y: 44 + 3.5 * unitPx + 7, 'text-anchor': 'middle', class: 'pp-label pp-new' }, '7 cm'));
            MQ.clear(sumBox);
            sumBox.appendChild(MQ.ui.sum([7, 7, 7, 7], 28, 'cm'));
            api.feedback('New side: 5 + 2 = 7 cm. Or: old perimeter 20 cm + 2 cm on each of the 4 sides = 28 cm.', 'info');
          });
          return;
        }

        // ---------- pattern: shrinking squares ----------
        if (q.type === 'pattern') {
          var seq = q.seq;
          var lastT = seq.terms[seq.terms.length - 1];
          api.say('These are the perimeters of squares that get smaller. What comes next?', 'think');
          stage.appendChild(MQ.ui.prompt('Squares shrink by 1 cm each side. Their perimeters are:'));
          // little squares drawn to scale (side = perimeter ÷ 4)
          var cellPx = 18;
          var widthSq = seq.terms.reduce(function (a, p) { return a + (p / 4) * cellPx + 22; }, 0) + 70;
          var maxS = seq.terms[0] / 4;
          var sqSvg = svg('svg', { viewBox: '0 0 ' + widthSq + ' ' + (maxS * cellPx + 40), width: widthSq, height: maxS * cellPx + 40, class: 'pp-svg', style: { maxWidth: '100%', height: 'auto' } });
          var x = 10;
          seq.terms.forEach(function (p) {
            var s = p / 4;
            sqSvg.appendChild(svg('rect', { x: x, y: 10 + (maxS - s) * cellPx, width: s * cellPx, height: s * cellPx, class: 'pp-sq' }));
            sqSvg.appendChild(svg('text', { x: x + (s * cellPx) / 2, y: maxS * cellPx + 34, 'text-anchor': 'middle', class: 'pp-small' }, s + ' cm'));
            x += s * cellPx + 22;
          });
          var qBox = svg('text', { x: x + 22, y: 10 + maxS * cellPx - 10, 'text-anchor': 'middle', class: 'pp-label pp-q' }, '?');
          sqSvg.appendChild(qBox);
          stage.appendChild(sqSvg);
          var row = el('div', { class: 'pp-seq' });
          var gaps = [];
          seq.terms.forEach(function (p, i) {
            if (i) {
              var gp = el('span', { class: 'pp-gap' }, '');
              gaps.push(gp);
              row.appendChild(gp);
            }
            row.appendChild(el('span', { class: 'chip' }, p + ' cm'));
          });
          var lastGap = el('span', { class: 'pp-gap' }, '');
          gaps.push(lastGap);
          row.appendChild(lastGap);
          var blank = el('span', { class: 'chip pp-blank' }, '?');
          row.appendChild(blank);
          stage.appendChild(row);
          function showJumps() {
            gaps.forEach(function (gp) {
              gp.textContent = '−4';
            });
          }
          var pi = MQ.ui.numberInput({
            unit: 'cm',
            onSubmit: function (v) {
              if (v === seq.next) {
                pi.good();
                pi.disable();
                showJumps();
                blank.textContent = seq.next + ' cm';
                qBox.textContent = seq.next / 4 + ' cm';
                api.check(true, 'Yes! The perimeters go down by 4 each time. ' + seq.next + ' cm is the perimeter of a ' + seq.next / 4 + ' cm square.');
                return;
              }
              pi.bad();
              var hint, tag;
              if (v > lastT) {
                tag = 'Counted up instead of down';
                hint = 'The squares are getting smaller, so the numbers go DOWN. How much less each time?';
              } else if (v === lastT - 2 || v === lastT - 1) {
                tag = 'Did not see the pattern goes down in 4s';
                hint = 'Look at the jumps: ' + seq.terms[0] + ' to ' + seq.terms[1] + ' is ' + (seq.terms[0] - seq.terms[1]) + ' less. Is it the same jump every time?';
              } else {
                tag = 'Did not see the pattern goes down in 4s';
                hint = 'How much smaller is each number than the one before?';
              }
              if (api.tries() >= 1) {
                showJumps();
                hint += ' It goes down by 4 each time. What is ' + lastT + ' − 4?';
              }
              api.check(false, hint, tag);
              pi.focus();
            },
          });
          stage.appendChild(pi.el);
          pi.focus();
          api.onReveal(function () {
            pi.setValue(String(seq.next));
            pi.good();
            pi.disable();
            showJumps();
            blank.textContent = seq.next + ' cm';
            qBox.textContent = seq.next / 4 + ' cm';
            api.feedback('Down 4 each time (one less cm on each of the 4 sides): ' + lastT + ' − 4 = ' + seq.next + ' cm.', 'info');
          });
          return;
        }

        // ---------- build a rectangle with a given perimeter ----------
        var T = q.target;
        api.say('Drag the yellow corner to make a rectangle with a perimeter of ' + T + ' units.', 'think');
        stage.appendChild(MQ.ui.prompt('Build a rectangle with a perimeter of <b>' + T + ' units</b>.'));
        var COLS = 11, ROWS = 7, MAXW = 9, MAXH = 5;
        var grid = MQ.ui.grid({ cols: COLS, rows: ROWS, cell: 40, pad: 12 });
        var w = 2, h = 1;
        var rect = svg('rect', { x: grid.x(1), y: grid.y(1), class: 'pp-rect' });
        grid.under.appendChild(rect);
        var wLabel = svg('text', { 'text-anchor': 'middle', class: 'pp-label' });
        var hLabel = svg('text', { 'text-anchor': 'end', class: 'pp-label' });
        grid.layer.appendChild(svg('circle', { cx: grid.x(1), cy: grid.y(1), r: 6, class: 'pp-anchor' }));
        grid.layer.appendChild(wLabel);
        grid.layer.appendChild(hLabel);
        var handle = svg('g', { class: 'pp-handle', 'data-handle': '1' }, svg('circle', { r: 15 }), svg('text', { y: 6, 'text-anchor': 'middle' }, '↘'));
        grid.layer.appendChild(handle);
        var live = el('div', { class: 'pp-live' });
        var locked = false;
        function per() {
          return 2 * (w + h);
        }
        function update() {
          rect.setAttribute('width', w * grid.cell);
          rect.setAttribute('height', h * grid.cell);
          handle.setAttribute('transform', 'translate(' + grid.x(1 + w) + ',' + grid.y(1 + h) + ')');
          wLabel.setAttribute('x', grid.x(1) + (w * grid.cell) / 2);
          wLabel.setAttribute('y', grid.y(1 + h) + 26);
          wLabel.textContent = String(w);
          hLabel.setAttribute('x', grid.x(1) - 4);
          hLabel.setAttribute('y', grid.y(1) + (h * grid.cell) / 2 + 7);
          hLabel.textContent = String(h);
          live.innerHTML = 'Perimeter: ' + w + ' + ' + h + ' + ' + w + ' + ' + h + ' = <b>' + per() + ' units</b>';
        }
        function moveTo(p) {
          if (locked) return;
          var nw = U.clamp(Math.round((p.x - grid.x(1)) / grid.cell), 1, MAXW);
          var nh = U.clamp(Math.round((p.y - grid.y(1)) / grid.cell), 1, MAXH);
          if (nw !== w || nh !== h) {
            w = nw;
            h = nh;
            update();
            MQ.sound('click');
          }
        }
        update();
        api.cleanup(MQ.ui.drag(grid.svg, handle, { move: moveTo, end: moveTo }));
        function svgClick(e) {
          if (e.target.closest && e.target.closest('.pp-handle')) return;
          moveTo(MQ.ui.svgPoint(grid.svg, e));
        }
        grid.svg.addEventListener('click', svgClick);
        api.cleanup(function () {
          grid.svg.removeEventListener('click', svgClick);
        });
        stage.appendChild(grid.svg);
        stage.appendChild(live);
        function solutions() {
          var out = [];
          for (var a = 1; a <= MAXW; a++) {
            var b = T / 2 - a;
            if (b >= 1 && b <= MAXH) out.push([a, b]);
          }
          return out;
        }
        var checkBtn = el('button', { class: 'btn btn-check', type: 'button' }, '✔ Check my rectangle');
        checkBtn.addEventListener('click', function () {
          if (locked) return;
          var P = per();
          if (P === T) {
            locked = true;
            checkBtn.disabled = true;
            var other = solutions().filter(function (s) {
              return !(s[0] === w && s[1] === h) && !(s[0] === h && s[1] === w);
            });
            var o = other.length ? U.pick(other) : null;
            var msg = 'Yes! ' + w + ' + ' + h + ' + ' + w + ' + ' + h + ' = ' + T + ' units.' + (w === h ? ' A square is a special rectangle!' : '') + (o ? ' Another one that works: ' + o[0] + ' by ' + o[1] + '.' : '');
            api.check(true, msg);
            return;
          }
          var hint, tag;
          if (w * h === T) {
            tag = 'Made the squares inside match instead of the perimeter';
            hint = 'That rectangle has ' + T + ' squares inside, but its walk round is ' + P + ' units. Perimeter is the edge!';
          } else {
            tag = 'Built a rectangle with the wrong perimeter';
            hint = 'Its perimeter is ' + P + ' units. You need ' + T + '. Make it ' + (P < T ? 'bigger' : 'smaller') + '.';
          }
          if (api.tries() >= 1) hint += ' Tip: the width and the height must add up to ' + T / 2 + ', because you go round each of them twice.';
          api.check(false, hint, tag);
        });
        stage.appendChild(checkBtn);
        api.onReveal(function () {
          locked = true;
          checkBtn.disabled = true;
          w = T / 2 - 2;
          h = 2;
          update();
          api.feedback('A ' + w + ' by ' + h + ' rectangle: ' + w + ' + ' + h + ' + ' + w + ' + ' + h + ' = ' + T + ' units. Width + height = ' + T / 2 + ', and you go round twice.', 'info');
        });
      },
    },
  });
})();

/* Rectangle Builder — rows of squares are multiplication (Unit 6.3).
 * The times-tables bridge: see a rectangle as rows × columns, build rectangles with a
 * given area, then work back from a square's area to its side.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  /* ---------------------------------------------------------------- *
   * Helpers
   * ---------------------------------------------------------------- */

  function repeated(n, times) {
    var a = [];
    for (var i = 0; i < times; i++) a.push(n);
    return a;
  }

  /** Every rows × columns pair with this area that fits a grid of maxR rows, maxC columns. */
  function pairsFor(area, maxR, maxC) {
    var out = [];
    for (var r = 1; r <= area; r++) {
      if (area % r === 0 && r <= maxR && area / r <= maxC) out.push([r, area / r]);
    }
    return out;
  }

  /** "1 × 12, 2 × 6, 3 × 4" — each shape once (2 × 6 and 6 × 2 count as the same shape turned). */
  function shapesText(area, maxR, maxC, skip) {
    var seen = {};
    var list = [];
    pairsFor(area, maxR, maxC).forEach(function (p) {
      var a = Math.min(p[0], p[1]);
      var b = Math.max(p[0], p[1]);
      var key = a + 'x' + b;
      if (seen[key]) return;
      seen[key] = true;
      if (skip && Math.min(skip[0], skip[1]) === a && Math.max(skip[0], skip[1]) === b) return;
      list.push(a + ' × ' + b);
    });
    return list.join(', ');
  }

  /**
   * An array of squares (rows × cols) with room on the right for running totals.
   * Returns { el, countRows(api, opts) }.
   */
  function arrayPic(rows, cols, opts) {
    opts = opts || {};
    var cell = opts.cell || (cols >= 10 ? 38 : 50);
    var pad = 74; // same space on both sides so the squares sit in the middle
    var labelW = 0;
    var W = cols * cell + pad * 2 + labelW;
    var H = rows * cell + 20;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'rb-array', style: { maxWidth: '100%', height: 'auto' } });
    var rowEls = [];
    var labels = [];
    for (var r = 0; r < rows; r++) {
      var g = svg('g', { class: 'rb-row' });
      for (var c = 0; c < cols; c++) {
        g.appendChild(svg('rect', { x: pad + c * cell + 2, y: 10 + r * cell + 2, width: cell - 4, height: cell - 4, rx: 5, class: 'rb-sq' }));
      }
      root.appendChild(g);
      rowEls.push(g);
      var t = svg('text', { x: pad + cols * cell + 14, y: 10 + r * cell + cell / 2 + 9, class: 'rb-count' }, '');
      root.appendChild(t);
      labels.push(t);
    }
    var wrap = el('div', { class: 'rb-pic' }, root);
    return {
      el: wrap,
      svg: root,
      reset: function () {
        rowEls.forEach(function (g) {
          g.classList.remove('rb-lit');
        });
        labels.forEach(function (t) {
          t.textContent = '';
        });
      },
      /** Light each row in turn while the count jumps. opts.step ms, opts.done callback. */
      countRows: function (api, o) {
        o = o || {};
        var step = o.step || 750;
        this.reset();
        rowEls.forEach(function (g, i) {
          api.later(function () {
            g.classList.add('rb-lit');
            labels[i].textContent = String((i + 1) * cols);
            api.sound('pop');
            if (o.each) o.each(i);
          }, step * (i + 1));
        });
        api.later(function () {
          if (o.done) o.done();
        }, step * rows + 300);
      },
    };
  }

  /** "3 rows of 4 = 4 + 4 + 4 = 3 × 4 = 12" as chips. */
  function rowsFact(rows, cols) {
    var row = el('div', { class: 'sum-row rb-fact' });
    row.appendChild(el('span', { class: 'rb-words' }, rows + (rows === 1 ? ' row' : ' rows') + ' of ' + cols));
    row.appendChild(el('span', { class: 'sum-op' }, '='));
    repeated(cols, rows).forEach(function (n, i) {
      if (i) row.appendChild(el('span', { class: 'sum-op' }, '+'));
      row.appendChild(el('span', { class: 'chip' }, String(n)));
    });
    row.appendChild(el('span', { class: 'sum-op' }, '='));
    row.appendChild(el('span', { class: 'chip rb-times' }, rows + ' × ' + cols));
    row.appendChild(el('span', { class: 'sum-op' }, '='));
    row.appendChild(el('span', { class: 'chip chip-total' }, String(rows * cols)));
    return row;
  }

  /**
   * The rectangle builder: a grid with a rectangle anchored top-left. Drag the corner
   * handle (snaps to grid lines), click a square, or use the + / − buttons.
   * opts: maxR, maxC, r, c, cell, onChange(r, c)
   */
  function builder(api, opts) {
    var maxR = opts.maxR || 8;
    var maxC = opts.maxC || 12;
    var cell = opts.cell || 34;
    var state = { r: opts.r || 1, c: opts.c || 1, locked: false };
    var g = MQ.ui.grid({ cols: maxC, rows: maxR, cell: cell, pad: 30, className: 'rb-grid' });
    var fills = svg('g');
    g.under.appendChild(fills);
    var outline = svg('rect', { class: 'rb-outline', x: g.x(0), y: g.y(0), width: 0, height: 0 });
    var colLabel = svg('text', { class: 'rb-side', 'text-anchor': 'middle' }, '');
    var rowLabel = svg('text', { class: 'rb-side', 'text-anchor': 'middle' }, '');
    var hit = svg('circle', { r: 22, class: 'rb-hit' });
    var knob = svg('circle', { r: 11, class: 'rb-knob' });
    var handle = svg('g', { class: 'rb-handle' }, hit, knob);
    g.layer.appendChild(outline);
    g.layer.appendChild(colLabel);
    g.layer.appendChild(rowLabel);
    g.layer.appendChild(handle);

    var readout = el('div', { class: 'rb-readout' });

    function stepper(name, key, max) {
      var val = el('span', { class: 'rb-step-val' }, '');
      var minus = el('button', { class: 'btn rb-step-btn', type: 'button', 'aria-label': 'One less ' + name, onclick: function () { set(key === 'r' ? state.r - 1 : state.r, key === 'c' ? state.c - 1 : state.c); } }, '−');
      var plus = el('button', { class: 'btn rb-step-btn', type: 'button', 'aria-label': 'One more ' + name, onclick: function () { set(key === 'r' ? state.r + 1 : state.r, key === 'c' ? state.c + 1 : state.c); } }, '+');
      var box = el('div', { class: 'rb-step' }, el('span', { class: 'rb-step-name' }, name), minus, val, plus);
      box.val = val;
      box.btns = [minus, plus];
      return box;
    }
    var rowsStep = stepper('Rows', 'r', maxR);
    var colsStep = stepper('Columns', 'c', maxC);
    var steppers = el('div', { class: 'rb-steppers' }, rowsStep, colsStep);

    function draw() {
      var r = state.r;
      var c = state.c;
      MQ.clear(fills);
      for (var rr = 0; rr < r; rr++) for (var cc = 0; cc < c; cc++) fills.appendChild(svg('rect', { x: g.x(cc), y: g.y(rr), width: cell, height: cell, class: 'rb-fill' }));
      outline.setAttribute('width', c * cell);
      outline.setAttribute('height', r * cell);
      colLabel.setAttribute('x', g.x(0) + (c * cell) / 2);
      colLabel.setAttribute('y', g.y(0) - 9);
      colLabel.textContent = String(c);
      rowLabel.setAttribute('x', g.x(0) - 14);
      rowLabel.setAttribute('y', g.y(0) + (r * cell) / 2 + 7);
      rowLabel.textContent = String(r);
      handle.setAttribute('transform', 'translate(' + g.x(c) + ',' + g.y(r) + ')');
      rowsStep.val.textContent = String(r);
      colsStep.val.textContent = String(c);
      readout.innerHTML = '<span class="rb-r">' + r + '</span> × <span class="rb-c">' + c + '</span> = <b>' + r * c + '</b>' + '<small>' + r + (r === 1 ? ' row' : ' rows') + ' of ' + c + '</small>';
    }

    function set(r, c, silent) {
      if (state.locked) return;
      r = U.clamp(Math.round(r), 1, maxR);
      c = U.clamp(Math.round(c), 1, maxC);
      if (r === state.r && c === state.c) return;
      state.r = r;
      state.c = c;
      draw();
      if (!silent && opts.onChange) opts.onChange(r, c);
    }

    api.cleanup(
      MQ.ui.drag(g.svg, handle, {
        move: function (p) {
          set((p.y - g.pad) / cell, (p.x - g.pad) / cell);
        },
      })
    );
    function onClick(e) {
      if (state.locked || handle.contains(e.target)) return;
      var hitCell = g.cellAt(MQ.ui.svgPoint(g.svg, e));
      if (hitCell) set(hitCell.r + 1, hitCell.c + 1);
    }
    g.svg.addEventListener('click', onClick);
    api.cleanup(function () {
      g.svg.removeEventListener('click', onClick);
    });
    draw();

    var wrap = el('div', { class: 'rb-builder' }, el('div', { class: 'rb-pic' }, g.svg), el('div', { class: 'rb-side-panel' }, readout, steppers, el('p', { class: 'rb-help' }, 'Drag the blue dot, click a square, or use + and −.')));
    return {
      el: wrap,
      grid: g,
      get: function () {
        return { r: state.r, c: state.c, area: state.r * state.c };
      },
      set: function (r, c) {
        set(r, c, true);
      },
      lock: function () {
        state.locked = true;
        wrap.classList.add('rb-locked');
        rowsStep.btns.concat(colsStep.btns).forEach(function (b) {
          b.disabled = true;
        });
      },
    };
  }

  /* ---------------------------------------------------------------- *
   * Practice deck
   * ---------------------------------------------------------------- */
  var deck = null;

  function buildDeck() {
    var q = [];
    // Level 1: arrays to count (no repeats). Keep mostly 2, 5, 10 then 3, 4.
    var arrays = U.shuffle([
      [2, 5],
      [3, 5],
      [4, 5],
      [2, 10],
      [3, 10],
      [5, 2],
      [3, 4],
      [4, 3],
      [5, 4],
      [2, 3],
      [4, 4],
      [5, 3],
    ]);
    var easy = arrays.filter(function (a) {
      return a[1] === 2 || a[1] === 5 || a[1] === 10;
    });
    var harder = arrays.filter(function (a) {
      return !(a[1] === 2 || a[1] === 5 || a[1] === 10);
    });
    q.push({ type: 'array', r: easy[0][0], c: easy[0][1] });
    q.push({ type: 'array', r: easy[1][0], c: easy[1][1] });
    q.push({ type: 'array', r: harder[0][0], c: harder[0][1] });
    // Level 2: build a rectangle with a given area
    var areas = U.shuffle([8, 10, 15, 18, 20]);
    q.push({ type: 'build', area: 12 });
    q.push({ type: 'build', area: areas[0] });
    q.push({ type: 'build', area: areas[1] });
    // Level 3: squares
    q.push({ type: 'side', area: U.pick([9, 16, 36]) });
    q.push({ type: 'perimeter', area: 25 });
    return q;
  }

  /* ---------------------------------------------------------------- *
   * Activity
   * ---------------------------------------------------------------- */
  MQ.register('rectangle-builder', {
    learn: [
      // 1. Rows of squares
      function (stage, api) {
        api.say('Here are some floor tiles. Let\'s count them in rows, not one by one!');
        stage.appendChild(MQ.ui.lesson('Rows of squares', 'How many squares? Count a whole row at a time.'));
        var pic = arrayPic(3, 4, { cell: 60 });
        stage.appendChild(pic.el);
        var factBox = el('div', { class: 'rb-factbox' });
        var btn = el('button', { class: 'btn btn-big', type: 'button' }, '▶ Count in rows');
        stage.appendChild(btn);
        stage.appendChild(factBox);
        btn.addEventListener('click', function () {
          btn.disabled = true;
          MQ.clear(factBox);
          pic.countRows(api, {
            each: function (i) {
              api.say(['4!', '8!', '12!'][i], 'happy');
            },
            done: function () {
              factBox.appendChild(rowsFact(3, 4));
              api.say('3 rows of 4 squares. 4, 8, 12. That is 3 × 4 = 12!', 'cheer');
              btn.disabled = false;
              btn.textContent = '↻ Count again';
            },
          });
        });
      },

      // 2. Turn it round
      function (stage, api) {
        api.say('What happens if we turn the rectangle round?');
        stage.appendChild(MQ.ui.lesson('Turn it round', 'Same squares, turned round. Is it still 12?'));
        var holder = el('div', { class: 'rb-turn-holder' });
        var caption = el('div', { class: 'rb-turn-caption' });
        var btn = el('button', { class: 'btn btn-big', type: 'button' }, '↻ Turn it');
        var fact = el('div', { class: 'rb-factbox' });
        stage.appendChild(holder);
        stage.appendChild(caption);
        stage.appendChild(btn);
        stage.appendChild(fact);
        var turned = false;
        var cell = 48;
        var S = 5 * cell; // square canvas so the rotation stays inside
        function draw(rows, cols) {
          MQ.clear(holder);
          var root = svg('svg', { viewBox: '0 0 ' + S + ' ' + S, width: S, height: S, class: 'rb-turn', style: { maxWidth: '100%', height: 'auto' } });
          var g = svg('g', { class: 'rb-turn-g' });
          var x0 = (S - cols * cell) / 2;
          var y0 = (S - rows * cell) / 2;
          for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) g.appendChild(svg('rect', { x: x0 + c * cell + 2, y: y0 + r * cell + 2, width: cell - 4, height: cell - 4, rx: 5, class: 'rb-sq rb-sq-' + (r % 2 ? 'b' : 'a') }));
          root.appendChild(g);
          holder.appendChild(root);
          caption.innerHTML = '<b>' + rows + '</b> rows of <b>' + cols + '</b> = ' + repeated(cols, rows).join(' + ') + ' = <b>12</b>';
          return g;
        }
        var g = draw(3, 4);
        btn.addEventListener('click', function () {
          btn.disabled = true;
          api.sound('click');
          g.classList.add('rb-spin');
          api.later(function () {
            turned = !turned;
            g = turned ? draw(4, 3) : draw(3, 4);
            btn.disabled = false;
            MQ.clear(fact);
            fact.appendChild(el('div', { class: 'rb-equal' }, '3 × 4 = 4 × 3 = 12'));
            api.say(turned ? 'Now it is 4 rows of 3. Still 12 squares! 3 × 4 = 4 × 3.' : 'Back to 3 rows of 4. Still 12!', 'cheer');
          }, 900);
        });
      },

      // 3. Build it
      function (stage, api) {
        api.say('Your turn! Make a rectangle that covers 6 squares.');
        api.lockNext();
        stage.appendChild(MQ.ui.prompt('Build a rectangle with an <b>area of 6</b> squares.'));
        var found = {};
        var b = builder(api, {
          maxR: 6,
          maxC: 8,
          cell: 40,
          r: 1,
          c: 1,
          onChange: function (r, c) {
            if (r * c === 6) {
              var key = r + 'x' + c;
              api.unlockNext();
              if (!found[key]) {
                found[key] = true;
                api.sound('correct');
              }
              api.feedback(r + ' rows of ' + c + ' = ' + r + ' × ' + c + ' = 6. Can you find another way to make 6?', 'good');
              api.say('Yes! ' + r + ' × ' + c + ' = 6. Other ways: ' + shapesText(6, 6, 8, [r, c]) + '.', 'cheer');
            } else {
              api.feedback(r + ' × ' + c + ' = ' + r * c + (r * c < 6 ? '. Too small, make it bigger.' : '. Too big, make it smaller.'), 'info');
            }
          },
        });
        stage.appendChild(b.el);
      },
    ],

    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];

        /* ---- count an array ---- */
        if (q.type === 'array') {
          var R = q.r;
          var C = q.c;
          var N = R * C;
          api.say('How many squares? Try counting in rows.', 'think');
          stage.appendChild(MQ.ui.prompt('How many squares are there?'));
          var pic = arrayPic(R, C);
          stage.appendChild(pic.el);
          var work = el('div', { class: 'rb-factbox' });
          var box = MQ.ui.numberInput({
            unit: 'squares',
            onSubmit: function (n) {
              if (n === N) {
                box.good();
                box.disable();
                MQ.clear(work);
                work.appendChild(rowsFact(R, C));
                api.check(true, 'Yes! ' + R + ' rows of ' + C + ' = ' + R + ' × ' + C + ' = ' + N + '.');
                return;
              }
              box.bad();
              var hint;
              var tag;
              if (n === C) {
                hint = 'That is just one row. How many rows are there? Count ' + C + ' for every row.';
                tag = 'Counted only one row';
              } else if (n === R) {
                hint = 'That is how many rows there are. Each row has ' + C + ' squares. Count ' + C + ' for every row.';
                tag = 'Counted only one row';
              } else if (n === R + C) {
                hint = 'You added the rows and the columns. Count every square: ' + C + ' in each row.';
                tag = 'Added rows and columns instead of counting all the squares';
              } else if (n === 2 * (R + C)) {
                hint = 'That counts round the edge. We want all the squares inside.';
                tag = 'Counted round the edge (perimeter) instead of the squares';
              } else {
                hint = 'Count in rows: each row has ' + C + '. Jump ' + C + ' for each row.';
                tag = 'Miscounted the squares';
              }
              if (api.tries() >= 1) hint = 'Jump ' + C + ' for each row: ' + U.range(1, R).map(function (i) { return i * C; }).join(', ') + '. There are ' + R + ' rows.';
              api.check(false, hint, tag);
            },
          });
          stage.appendChild(box.el);
          stage.appendChild(work);
          box.focus();
          api.onReveal(function () {
            box.setValue(String(N));
            box.disable();
            MQ.clear(work);
            pic.countRows(api, {
              step: 650,
              done: function () {
                work.appendChild(rowsFact(R, C));
                box.good();
              },
            });
          });
          return;
        }

        /* ---- build a rectangle with a given area ---- */
        if (q.type === 'build') {
          var A = q.area;
          var maxR = 8;
          var maxC = 12;
          api.say('Build a rectangle that covers exactly ' + A + ' squares.', 'think');
          stage.appendChild(MQ.ui.prompt('Build a rectangle with an <b>area of ' + A + '</b> squares.'));
          var bld = builder(api, {
            maxR: maxR,
            maxC: maxC,
            cell: 34,
            r: 1,
            c: 1,
          });
          stage.appendChild(bld.el);
          var bwork = el('div', { class: 'rb-factbox' });
          var checkBtn = el('button', { class: 'btn btn-big btn-check', type: 'button' }, '✔ Check my rectangle');
          stage.appendChild(checkBtn);
          stage.appendChild(bwork);
          checkBtn.addEventListener('click', function () {
            if (api.isAnswered()) return;
            var s = bld.get();
            if (s.area === A) {
              bld.lock();
              checkBtn.disabled = true;
              MQ.clear(bwork);
              bwork.appendChild(rowsFact(s.r, s.c));
              var others = shapesText(A, maxR, maxC, [s.r, s.c]);
              api.check(true, 'Yes! ' + s.r + ' × ' + s.c + ' = ' + A + '.' + (others ? ' Other ways: ' + others + '.' : ''));
              return;
            }
            var hint;
            var tag;
            if (s.r + s.c === A) {
              hint = 'You made the rows and columns add up to ' + A + '. But area is all the squares: ' + s.r + ' rows of ' + s.c + ' = ' + s.area + '.';
              tag = 'Added rows and columns instead of multiplying';
            } else if (s.area < A) {
              hint = 'Your rectangle covers ' + (s.area === 1 ? '1 square' : s.area + ' squares') + '. You need ' + A + ', so make it bigger.';
              tag = 'Built a rectangle with the wrong area';
            } else {
              hint = 'Your rectangle covers ' + (s.area === 1 ? '1 square' : s.area + ' squares') + '. You need ' + A + ', so make it smaller.';
              tag = 'Built a rectangle with the wrong area';
            }
            if (api.tries() >= 1) {
              var p = pairsFor(A, maxR, maxC).filter(function (x) { return x[0] >= 2 && x[1] >= 2; })[0] || pairsFor(A, maxR, maxC)[0];
              hint += ' Try ' + p[0] + ' rows. Count in ' + p[1] + 's: ' + U.range(1, p[0]).map(function (i) { return i * p[1]; }).join(', ') + '.';
            }
            api.check(false, hint, tag);
          });
          api.onReveal(function () {
            var p = pairsFor(A, maxR, maxC).filter(function (x) { return x[0] >= 2 && x[1] >= 2; });
            p = p[Math.floor(p.length / 2)] || pairsFor(A, maxR, maxC)[0];
            bld.set(p[0], p[1]);
            bld.lock();
            checkBtn.disabled = true;
            MQ.clear(bwork);
            bwork.appendChild(rowsFact(p[0], p[1]));
            api.feedback('One way: ' + p[0] + ' rows of ' + p[1] + '. All the ways: ' + shapesText(A, maxR, maxC) + '.', 'info');
          });
          return;
        }

        /* ---- square: area → side ---- */
        if (q.type === 'side') {
          var SA = q.area;
          var side = Math.round(Math.sqrt(SA));
          api.say('A square has the same number of rows and columns. Build some squares to test!', 'think');
          stage.appendChild(MQ.ui.prompt('A square has an area of <b>' + SA + ' square units</b>.<br>How long is each side?'));
          var sb = builder(api, { maxR: 7, maxC: 7, cell: 38, r: 2, c: 2 });
          var sbox = MQ.ui.numberInput({
            unit: 'units',
            prefix: 'Each side =',
            onSubmit: function (n) {
              if (n === side) {
                sbox.good();
                sbox.disable();
                sb.set(side, side);
                sb.lock();
                api.check(true, 'Yes! ' + side + ' × ' + side + ' = ' + SA + ', so each side is ' + side + '.');
                return;
              }
              sbox.bad();
              var hint;
              var tag;
              if (Math.abs(n - SA / 4) < 1.01) {
                hint = 'Dividing by 4 is perimeter thinking (going round the 4 sides). Area is rows × columns. Which number × itself makes ' + SA + '?';
                tag = 'Divided the area by 4 (perimeter thinking)';
              } else if (n === SA) {
                hint = SA + ' is the area: all the squares. We want the length of one side.';
                tag = 'Gave the area instead of the side length';
              } else if (n * n < SA) {
                hint = n + ' × ' + n + ' = ' + n * n + '. That is too small. Try a bigger square.';
                tag = 'Wrong side length for a square';
              } else {
                hint = n + ' × ' + n + ' = ' + n * n + '. That is too big. Try a smaller square.';
                tag = 'Wrong side length for a square';
              }
              if (api.tries() >= 1) hint += ' Build squares: 2 × 2 = 4, 3 × 3 = 9, 4 × 4 = 16 ...';
              api.check(false, hint, tag);
            },
          });
          stage.appendChild(sbox.el);
          stage.appendChild(sb.el);
          sbox.focus();
          api.onReveal(function () {
            sb.set(side, side);
            sb.lock();
            sbox.setValue(String(side));
            sbox.good();
            sbox.disable();
            api.feedback(side + ' rows of ' + side + ' = ' + repeated(side, side).join(' + ') + ' = ' + SA + '. So each side is ' + side + '.', 'info');
          });
          return;
        }

        /* ---- square: area 25 → perimeter ---- */
        var PA = q.area;
        var ps = Math.round(Math.sqrt(PA));
        var per = ps * 4;
        api.say('Two steps! First find the side. Then go all the way round.', 'think');
        stage.appendChild(MQ.ui.prompt('A square has an area of <b>' + PA + ' square units</b>.<br>What is its <b>perimeter</b>?'));
        var cellP = 40;
        var gp = MQ.ui.grid({ cols: ps + 2, rows: ps, cell: cellP, pad: 34, className: 'rb-grid' });
        var sqRect = svg('rect', { x: gp.x(0), y: gp.y(0), width: ps * cellP, height: ps * cellP, class: 'rb-outline rb-ghost' });
        var labels = svg('g', { class: 'rb-hidden' });
        labels.appendChild(svg('text', { class: 'rb-side', x: gp.x(0) + (ps * cellP) / 2, y: gp.y(0) - 9, 'text-anchor': 'middle' }, ps + ''));
        labels.appendChild(svg('text', { class: 'rb-side', x: gp.x(0) + (ps * cellP) / 2, y: gp.y(ps) + 26, 'text-anchor': 'middle' }, ps + ''));
        labels.appendChild(svg('text', { class: 'rb-side', x: gp.x(0) - 15, y: gp.y(0) + (ps * cellP) / 2 + 7, 'text-anchor': 'middle' }, ps + ''));
        labels.appendChild(svg('text', { class: 'rb-side', x: gp.x(ps) + 15, y: gp.y(0) + (ps * cellP) / 2 + 7, 'text-anchor': 'middle' }, ps + ''));
        gp.layer.appendChild(sqRect);
        gp.layer.appendChild(labels);
        var pwork = el('div', { class: 'rb-factbox' });
        var pbox = MQ.ui.numberInput({
          unit: 'units',
          onSubmit: function (n) {
            if (n === per) {
              pbox.good();
              pbox.disable();
              showWorking();
              api.check(true, 'Yes! Each side is ' + ps + ', and ' + ps + ' + ' + ps + ' + ' + ps + ' + ' + ps + ' = ' + per + '.');
              return;
            }
            pbox.bad();
            var hint;
            var tag;
            if (n === PA) {
              hint = PA + ' is the area (the squares inside). Perimeter is the distance round the outside.';
              tag = 'Gave the area instead of the perimeter';
            } else if (n === ps) {
              hint = 'Yes, each side is ' + ps + '! But perimeter goes round all 4 sides.';
              tag = 'Gave one side instead of the perimeter';
            } else if (n === ps * 2) {
              hint = 'That is only 2 sides. A square has 4 sides.';
              tag = 'Added only two sides';
            } else if (Math.abs(n - PA / 4) < 1.01) {
              hint = 'Do not divide the area by 4. First find the side: which number × itself makes ' + PA + '?';
              tag = 'Divided the area by 4 (perimeter thinking)';
            } else {
              hint = 'Step 1: which number × itself makes ' + PA + '? That is the side. Step 2: add all 4 sides.';
              tag = 'Could not find the perimeter from the area';
            }
            if (api.tries() >= 1 && n !== ps) hint += ' Hint: ' + ps + ' × ' + ps + ' = ' + PA + '.';
            api.check(false, hint, tag);
          },
        });
        stage.appendChild(el('div', { class: 'rb-pic' }, gp.svg));
        stage.appendChild(pbox.el);
        stage.appendChild(pwork);
        pbox.focus();
        function showWorking() {
          labels.classList.remove('rb-hidden');
          sqRect.classList.remove('rb-ghost');
          for (var r = 0; r < ps; r++) for (var c = 0; c < ps; c++) gp.fill(c, r, 'rb-fill');
          MQ.clear(pwork);
          pwork.appendChild(el('div', { class: 'rb-equal rb-small' }, 'Side: ' + ps + ' × ' + ps + ' = ' + PA));
          pwork.appendChild(MQ.ui.sum(repeated(ps, 4), per, 'units'));
        }
        api.onReveal(function () {
          pbox.setValue(String(per));
          pbox.good();
          pbox.disable();
          showWorking();
        });
      },
    },
  });

  var css = [
    '.rb-pic{display:flex;justify-content:center;max-width:100%}',
    '.rb-array{display:block}',
    '.rb-sq{fill:#ffd99a;stroke:#d79a2b;stroke-width:2;transition:fill .25s}',
    '.rb-sq-b{fill:#ffe7bd}',
    '.rb-lit .rb-sq{fill:var(--accent);stroke:#0b6e66}',
    '.rb-count{font-size:26px;font-weight:800;fill:#0b6e66}',
    '.rb-factbox{display:flex;flex-direction:column;align-items:center;gap:8px;min-height:10px}',
    '.rb-fact{font-size:1.25rem}',
    '.rb-words{font-weight:800}',
    '.rb-times{background:#e2f7ee;border-color:var(--good)}',
    '.rb-turn-holder{display:flex;justify-content:center}',
    '.rb-turn-g{transform-box:fill-box;transform-origin:center;transition:transform .85s ease}',
    '.rb-spin{transform:rotate(90deg)}',
    '.rb-turn-caption{font-size:1.4rem;font-weight:700}',
    '.rb-equal{font-size:1.8rem;font-weight:800;color:#0b6e66;background:var(--good-bg);border-radius:14px;padding:6px 18px}',
    '.rb-small{font-size:1.3rem}',
    '.rb-builder{display:flex;gap:18px;align-items:center;justify-content:center;flex-wrap:wrap;max-width:100%}',
    '.rb-fill{fill:#bfe9e4}',
    '.rb-outline{fill:none;stroke:#0b6e66;stroke-width:4}',
    '.rb-ghost{stroke-dasharray:8 6;stroke:#8aa}',
    '.rb-side{font-size:20px;font-weight:800;fill:#0b6e66}',
    '.rb-hidden{display:none}',
    '.rb-hit{fill:transparent}',
    '.rb-knob{fill:#2563eb;stroke:#fff;stroke-width:3;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))}',
    '.rb-handle:hover .rb-knob,.rb-handle.dragging .rb-knob{fill:#1d4ed8;r:13}',
    '.rb-grid{cursor:pointer}',
    '.rb-locked .rb-grid{cursor:default}',
    '.rb-locked .rb-handle{display:none}',
    '.rb-side-panel{display:flex;flex-direction:column;align-items:center;gap:12px;min-width:220px}',
    '.rb-readout{font-size:2.2rem;font-weight:800;background:#fff;border:3px solid var(--line);border-radius:16px;padding:8px 18px;text-align:center;line-height:1.2}',
    '.rb-readout small{display:block;font-size:1rem;color:var(--ink-soft)}',
    '.rb-readout b{color:#0b6e66}',
    '.rb-steppers{display:flex;flex-direction:column;gap:8px}',
    '.rb-step{display:flex;align-items:center;gap:8px}',
    '.rb-step-name{width:84px;font-weight:800;text-align:right}',
    '.rb-step-btn{min-width:46px;padding:6px 0;font-size:1.4rem;background:var(--paper-2);color:var(--ink)}',
    '.rb-step-val{min-width:34px;text-align:center;font-size:1.4rem;font-weight:800}',
    '.rb-help{margin:0;font-size:.9rem;color:var(--ink-soft);max-width:220px;text-align:center}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'rectangle-builder' }, css));
})();

/* Array Fact Family (Unit 5.1): rows and columns, turn-around facts, splitting an array for division,
 * and the four (or eight) facts of a family. CSS prefix: af- */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;
  var ID = 'array-fact-family';

  /* ------------------------------------------------------------------ *
   * Everyday things laid out in arrays
   * ------------------------------------------------------------------ */
  var KINDS = {
    muffin: { noun: 'muffins', tray: 'muffin tin' },
    egg: { noun: 'eggs', tray: 'egg box' },
    button: { noun: 'buttons', tray: 'card' },
    apple: { noun: 'apples', tray: 'crate' },
    counter: { noun: 'counters', tray: 'tray' },
    cookie: { noun: 'cookies', tray: 'baking tray' },
  };
  var PRACTICE_KINDS = ['egg', 'button', 'apple', 'counter', 'cookie', 'muffin'];

  // Readable mistake tags for the parent dashboard
  var TAG = {
    flipped: 'Wrote the division backwards (5 ÷ 30)',
    total: 'Put the total in the wrong place (30 = 10 ÷ 3)',
    comm: 'Thought turning the array changes the total',
    count: 'Miscounted the array (count row by row)',
    missing: 'Missed a fact in the family (wrote the same fact twice)',
    mixMul: 'Mixed up the numbers in a × fact',
    mixDiv: 'Mixed up the numbers in a ÷ fact',
    rowsCols: 'Mixed up rows and columns',
    wrongBuild: 'Built the wrong number of rows or columns',
    square: 'Thought a square array has 8 different facts',
    markedOk: 'Marked a correct fact as wrong',
  };

  function drawItem(kind, cx, cy, cell) {
    var r = cell * 0.36;
    var g = S('g', { class: 'af-item' });
    if (kind === 'muffin') {
      g.appendChild(S('circle', { cx: cx, cy: cy, r: r, fill: '#c98a4b', stroke: '#8a5a2b', 'stroke-width': 1.5 }));
      g.appendChild(S('circle', { cx: cx - r * 0.2, cy: cy - r * 0.2, r: r * 0.55, fill: '#e6b07a' }));
    } else if (kind === 'egg') {
      g.appendChild(S('ellipse', { cx: cx, cy: cy, rx: r * 0.82, ry: r * 1.02, fill: '#fffaf0', stroke: '#c9b48a', 'stroke-width': 1.5 }));
    } else if (kind === 'button') {
      g.appendChild(S('circle', { cx: cx, cy: cy, r: r, fill: '#4d96ff', stroke: '#2a6fd6', 'stroke-width': 1.5 }));
      var h = r * 0.3;
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (d) {
        g.appendChild(S('circle', { cx: cx + d[0] * h, cy: cy + d[1] * h, r: r * 0.13, fill: '#fff' }));
      });
    } else if (kind === 'apple') {
      g.appendChild(S('circle', { cx: cx, cy: cy + r * 0.08, r: r * 0.95, fill: '#e63946', stroke: '#a4161a', 'stroke-width': 1.5 }));
      g.appendChild(S('path', { d: 'M' + cx + ' ' + (cy - r * 0.8) + ' l' + r * 0.1 + ' ' + -r * 0.35, stroke: '#6b4226', 'stroke-width': 2, 'stroke-linecap': 'round' }));
      g.appendChild(S('ellipse', { cx: cx + r * 0.32, cy: cy - r * 0.95, rx: r * 0.25, ry: r * 0.12, fill: '#55a630' }));
    } else if (kind === 'cookie') {
      g.appendChild(S('circle', { cx: cx, cy: cy, r: r, fill: '#d4a373', stroke: '#a0703f', 'stroke-width': 1.5 }));
      [[-0.35, -0.3], [0.3, -0.1], [-0.1, 0.35], [0.35, 0.4]].forEach(function (d) {
        g.appendChild(S('circle', { cx: cx + d[0] * r, cy: cy + d[1] * r, r: r * 0.12, fill: '#5c3d2e' }));
      });
    } else {
      g.appendChild(S('circle', { cx: cx, cy: cy, r: r, fill: '#ffc93c', stroke: '#d99a00', 'stroke-width': 1.5 }));
    }
    return g;
  }

  /* ------------------------------------------------------------------ *
   * Array picture: a tray of rows and columns.
   * cfg: rows, cols, kind, later(fn, ms), jumps (default true), box (max tray px),
   *      build: {maxR, maxC, onChange(r,c), onRelease(r,c)}, clickRows: fn(lit)
   * ------------------------------------------------------------------ */
  function makeArray(cfg) {
    var o = { rows: cfg.rows || 0, cols: cfg.cols || 0, lit: 0, split: null, busy: false, locked: false };
    var wrap = el('div', { class: 'af-array' });
    var svgEl, rowBands, jumpG, splitG, itemsG;
    var P = 10;
    var JW = cfg.jumps === false ? 0 : 130;
    var BOT = 26;
    var geo = {};

    function measure() {
      var R = cfg.build ? cfg.build.maxR : o.rows;
      var C = cfg.build ? cfg.build.maxC : o.cols;
      var box = cfg.box || 250;
      var cell = cfg.cell || U.clamp(Math.floor(box / Math.max(R, C, 1)), 24, 50);
      geo = { R: R, C: C, cell: cell, trayW: C * cell + 2 * P, trayH: R * cell + 2 * P };
      geo.W = geo.trayW + JW;
      geo.H = geo.trayH + BOT;
    }
    function cx(c) {
      return P + c * geo.cell + geo.cell / 2;
    }
    function cy(r) {
      return P + r * geo.cell + geo.cell / 2;
    }

    function draw() {
      measure();
      MQ.clear(wrap);
      svgEl = S('svg', { viewBox: '0 0 ' + geo.W + ' ' + geo.H, width: geo.W, height: geo.H, class: 'af-svg', style: { maxWidth: '100%', height: 'auto' } });
      var trayG = S('g', { class: 'af-trayg' });
      trayG.appendChild(S('rect', { x: 1, y: 1, width: geo.trayW - 2, height: geo.trayH - 2, rx: 14, class: 'af-tray af-tray-' + cfg.kind }));
      rowBands = [];
      for (var r = 0; r < geo.R; r++) {
        var band = S('rect', { x: 4, y: P + r * geo.cell + 2, width: geo.trayW - 8, height: geo.cell - 4, rx: 10, class: 'af-band' });
        rowBands.push(band);
        trayG.appendChild(band);
      }
      for (r = 0; r < geo.R; r++) {
        for (var c = 0; c < geo.C; c++) {
          trayG.appendChild(S('circle', { cx: cx(c), cy: cy(r), r: geo.cell * 0.42, class: 'af-hole' }));
        }
      }
      itemsG = S('g', { class: 'af-items' });
      trayG.appendChild(itemsG);
      drawItems();
      svgEl.appendChild(trayG);
      splitG = S('g', { class: 'af-splitg' });
      jumpG = S('g', { class: 'af-jumpg' });
      svgEl.appendChild(splitG);
      svgEl.appendChild(jumpG);
      o.trayG = trayG;
      if (cfg.clickRows && !cfg.build) {
        for (r = 0; r < o.rows; r++) {
          var hit = S('rect', { x: 0, y: P + r * geo.cell, width: geo.trayW, height: geo.cell, class: 'af-rowhit', 'data-row': r, fill: 'transparent' });
          hit.addEventListener('click', function () {
            if (o.locked || o.busy) return;
            if (o.lit < o.rows) {
              stepJump();
              MQ.sound('pop');
              cfg.clickRows(o.lit);
            }
          });
          svgEl.appendChild(hit);
        }
        svgEl.classList.add('af-clickable');
      }
      if (cfg.build) bindBuild();
      wrap.appendChild(svgEl);
      // re-apply lit rows and split after a redraw
      var lit = o.lit;
      o.lit = 0;
      for (var i = 0; i < lit; i++) stepJump();
      if (o.split) split(o.split);
    }

    function drawItems() {
      MQ.clear(itemsG);
      for (var r = 0; r < o.rows; r++) {
        var rg = S('g', { class: 'af-rowg', 'data-row': r });
        for (var c = 0; c < o.cols; c++) rg.appendChild(drawItem(cfg.kind, cx(c), cy(r), geo.cell));
        itemsG.appendChild(rg);
      }
    }

    function bindBuild() {
      var down = false;
      function setFrom(e) {
        var p = MQ.ui.svgPoint(svgEl, e);
        var c = Math.floor((p.x - P) / geo.cell);
        var r = Math.floor((p.y - P) / geo.cell);
        if (c < 0 || r < 0 || c >= geo.C || r >= geo.R) return;
        if (r + 1 !== o.rows || c + 1 !== o.cols) {
          o.rows = r + 1;
          o.cols = c + 1;
          clearJumps();
          drawItems();
          if (cfg.build.onChange) cfg.build.onChange(o.rows, o.cols);
        }
      }
      svgEl.style.touchAction = 'none';
      svgEl.classList.add('af-buildable');
      svgEl.addEventListener('pointerdown', function (e) {
        if (o.locked) return;
        e.preventDefault();
        down = true;
        try {
          svgEl.setPointerCapture(e.pointerId);
        } catch (err) {}
        setFrom(e);
      });
      svgEl.addEventListener('pointermove', function (e) {
        if (!down || o.locked) return;
        setFrom(e);
      });
      function up() {
        if (!down) return;
        down = false;
        if (cfg.build.onRelease) cfg.build.onRelease(o.rows, o.cols);
      }
      svgEl.addEventListener('pointerup', up);
      svgEl.addEventListener('pointercancel', up);
    }

    function stepJump() {
      if (o.lit >= o.rows || !JW) return;
      var i = o.lit;
      rowBands[i].classList.add('af-band-on');
      var bx = geo.trayW + 34;
      var br = Math.min(17, geo.cell * 0.44);
      var y = cy(i);
      if (i > 0) {
        var y0 = cy(i - 1);
        jumpG.appendChild(S('path', { d: 'M' + (bx + br) + ' ' + (y0 + 2) + ' C' + (bx + br + 34) + ' ' + y0 + ' ' + (bx + br + 34) + ' ' + y + ' ' + (bx + br + 2) + ' ' + (y - 1), class: 'af-arc' }));
        jumpG.appendChild(S('path', { d: 'M' + (bx + br + 2) + ' ' + (y - 1) + ' l9 -5 l-1 9 z', class: 'af-arrowhead' }));
        jumpG.appendChild(S('text', { x: bx + br + 32, y: (y0 + y) / 2 + 5, class: 'af-plus' }, '+' + o.cols));
      }
      jumpG.appendChild(S('circle', { cx: bx, cy: y, r: br, class: 'af-bubble' }));
      jumpG.appendChild(S('text', { x: bx, y: y + br * 0.36, 'text-anchor': 'middle', class: 'af-bubble-t', style: { fontSize: Math.round(br * 0.95) + 'px' } }, String((i + 1) * o.cols)));
      o.lit++;
    }

    function clearJumps() {
      o.lit = 0;
      if (jumpG) MQ.clear(jumpG);
      (rowBands || []).forEach(function (b) {
        b.classList.remove('af-band-on');
      });
    }

    function showJumps(done) {
      if (o.busy) return;
      clearJumps();
      clearSplit();
      o.busy = true;
      var i = 0;
      (function tick() {
        stepJump();
        MQ.sound('pop');
        i++;
        if (i < o.rows) cfg.later(tick, 420);
        else {
          o.busy = false;
          if (done) cfg.later(done, 250);
        }
      })();
    }

    function clearSplit() {
      o.split = null;
      if (splitG) MQ.clear(splitG);
    }

    function split(mode) {
      clearJumps();
      if (splitG) MQ.clear(splitG);
      o.split = mode;
      var cell = geo.cell;
      var i;
      if (mode === 'rows') {
        for (i = 0; i < o.rows; i++) {
          splitG.appendChild(S('rect', { x: 5, y: P + i * cell + 3, width: o.cols * cell + 2 * P - 10, height: cell - 6, rx: cell / 2 - 3, class: 'af-ring' }));
        }
        for (i = 1; i < o.rows; i++) {
          splitG.appendChild(S('line', { x1: 2, y1: P + i * cell, x2: geo.trayW - 2, y2: P + i * cell, class: 'af-cut' }));
        }
      } else if (mode === 'cols') {
        for (i = 0; i < o.cols; i++) {
          splitG.appendChild(S('rect', { x: P + i * cell + 3, y: 5, width: cell - 6, height: o.rows * cell + 2 * P - 10, rx: cell / 2 - 3, class: 'af-ring' }));
        }
        for (i = 1; i < o.cols; i++) {
          splitG.appendChild(S('line', { x1: P + i * cell, y1: 2, x2: P + i * cell, y2: geo.trayH - 2, class: 'af-cut' }));
        }
      }
    }

    // Labels: number in each row (right) or in each column (below)
    function splitLabels() {
      var i;
      if (o.split === 'rows') {
        for (i = 0; i < o.rows; i++) splitG.appendChild(S('text', { x: geo.trayW + 12, y: cy(i) + 6, class: 'af-split-t' }, String(o.cols)));
      } else if (o.split === 'cols') {
        for (i = 0; i < o.cols; i++) splitG.appendChild(S('text', { x: cx(i), y: geo.trayH + 19, 'text-anchor': 'middle', class: 'af-split-t' }, String(o.rows)));
      }
    }

    function rotate(done) {
      if (o.busy) return;
      o.busy = true;
      clearJumps();
      clearSplit();
      var g = o.trayG;
      g.style.transformBox = 'fill-box';
      g.style.transformOrigin = 'center';
      g.style.transition = 'transform 0.7s ease';
      g.getBoundingClientRect();
      g.style.transform = 'rotate(90deg)';
      cfg.later(function () {
        var t = o.rows;
        o.rows = o.cols;
        o.cols = t;
        o.busy = false;
        draw();
        if (done) done();
      }, 760);
    }

    draw();
    return {
      el: wrap,
      get rows() {
        return o.rows;
      },
      get cols() {
        return o.cols;
      },
      get lit() {
        return o.lit;
      },
      get busy() {
        return o.busy;
      },
      stepJump: stepJump,
      showJumps: showJumps,
      clearJumps: clearJumps,
      split: split,
      splitLabels: splitLabels,
      rotate: rotate,
      setSize: function (r, c) {
        o.rows = r;
        o.cols = c;
        o.lit = 0;
        o.split = null;
        draw();
      },
      lock: function () {
        o.locked = true;
        wrap.classList.add('af-locked');
      },
    };
  }

  /* ------------------------------------------------------------------ *
   * Facts as text
   * ------------------------------------------------------------------ */
  function factText(st, T) {
    function n(v) {
      return T != null && v === T ? '<span class="af-T">' + v + '</span>' : String(v);
    }
    if (st.form === 'left') return n(st.res) + ' = ' + n(st.a) + ' ' + st.op + ' ' + n(st.b);
    return n(st.a) + ' ' + st.op + ' ' + n(st.b) + ' = ' + n(st.res);
  }
  function plainFact(st) {
    return factText(st, null);
  }
  function stmt(form, op, a, b, res) {
    return { form: form, op: op, a: a, b: b, res: res };
  }
  function isTrue(st) {
    return st.op === '×' ? st.a * st.b === st.res : st.b !== 0 && st.a === st.b * st.res;
  }
  // A statement belongs to the family {x, y, T} when it is true and uses exactly those numbers
  function inFamily(st, fam) {
    if (!isTrue(st)) return false;
    var nums = [st.a, st.b, st.res].sort(function (p, q) {
      return p - q;
    });
    var want = [fam.c, fam.r, fam.T].sort(function (p, q) {
      return p - q;
    });
    return nums.join(',') === want.join(',');
  }

  /* Judge one filled statement. vals = [a, b, res]; prev = earlier filled statements in the same step. */
  function judge(spec, vals, fam, prev) {
    var a = vals[0];
    var b = vals[1];
    var res = vals[2];
    var T = fam.T;
    var ans = { form: spec.form, op: spec.op, a: spec.ans[0], b: spec.ans[1], res: spec.ans[2] };
    var ansTxt = plainFact(ans);
    var place = spec.form === 'left' ? 'on its own, before the = sign' : 'after the = sign';
    if (spec.op === '×') {
      if (a * b === res && res === T) {
        for (var i = 0; i < prev.length; i++) {
          var p = prev[i];
          if (p.op === '×' && p.form === spec.form && p.a === a && p.b === b && a !== b) {
            return { ok: false, tag: TAG.missing, hint1: 'You wrote ' + plainFact(p) + ' twice. Turn the tray round in your head: write the turn-around fact.', hint2: 'The turn-around of ' + plainFact(p) + ' swaps the two small numbers: ' + b + ' × ' + a + '.' };
          }
        }
        return { ok: true };
      }
      if (res !== T && (a === T || b === T)) {
        return { ok: false, tag: TAG.total, hint1: T + ' is the total. In a × fact the total is what you make, so it goes ' + place + '.', hint2: 'Multiply the two small numbers to make ' + T + ': ' + ansTxt + '.' };
      }
      return { ok: false, tag: TAG.mixMul, hint1: 'Multiply how many in each row by the number of rows: ' + fam.c + ' and ' + fam.r + ' make ' + T + '.', hint2: 'Count in ' + fam.c + 's along the rows: ' + fam.c + ' × ' + fam.r + ' = ' + T + '. This box: ' + ansTxt + '.' };
    }
    // division
    if (a === T && b * res === T) return { ok: true };
    if (a !== T && b === T) {
      return { ok: false, tag: TAG.flipped, hint1: 'That division is back to front. We share out the total, ' + T + ', so ' + T + ' comes first: ' + T + ' ÷ …', hint2: 'The big number is always the one being divided: ' + ansTxt + '.' };
    }
    if (a !== T && res === T) {
      return { ok: false, tag: TAG.total, hint1: T + ' is the total. It is the number being divided, never the answer of its own ÷ fact.', hint2: 'Start with the total: ' + T + ' ÷ … Look: ' + ansTxt + '.' };
    }
    if (a !== T) {
      return { ok: false, tag: TAG.flipped, hint1: 'A ÷ fact in this family always starts with the total, ' + T + '.', hint2: ansTxt + ': ' + T + ' shared into ' + ans.b + ' equal groups gives ' + ans.res + ' in each.' };
    }
    return { ok: false, tag: TAG.mixDiv, hint1: T + ' split into ' + b + ' equal groups: how many in each group? Look at the rows of the tray.', hint2: T + ' split into ' + ans.b + ' equal groups gives ' + ans.res + ' in each: ' + ansTxt + '.' };
  }

  /* ------------------------------------------------------------------ *
   * Family statement specs. ans = [a, b, res]; fixed = which of those are given.
   * Array: r rows of c. Group size c, number of groups r: c × r = T (book order).
   * ------------------------------------------------------------------ */
  function stepRight(fam) {
    var T = fam.T;
    var p = U.pick([fam.c, fam.r]);
    var o = p === fam.c ? fam.r : fam.c;
    var d = U.pick([fam.c, fam.r]);
    var e = T / d;
    return [
      { form: 'right', op: '×', ans: [p, o, T], fixed: [true, false, false] },
      { form: 'right', op: '×', ans: [o, p, T], fixed: [false, false, true] },
      { form: 'right', op: '÷', ans: [T, d, e], fixed: [false, true, false] },
      { form: 'right', op: '÷', ans: [T, e, d], fixed: [false, false, true] },
    ];
  }
  function stepLeft(fam) {
    var T = fam.T;
    var p = U.pick([fam.c, fam.r]);
    var o = p === fam.c ? fam.r : fam.c;
    var d = U.pick([fam.c, fam.r]);
    var e = T / d;
    return [
      { form: 'left', op: '×', ans: [p, o, T], fixed: [true, false, false] },
      { form: 'left', op: '×', ans: [o, p, T], fixed: [false, true, false] },
      { form: 'left', op: '÷', ans: [T, d, e], fixed: [false, true, false] },
      { form: 'left', op: '÷', ans: [T, e, d], fixed: [false, false, true] },
    ];
  }
  function stepSquare(fam) {
    var n = fam.c;
    var N = fam.T;
    return [
      { form: 'right', op: '×', ans: [n, n, N], fixed: [true, false, false] },
      { form: 'right', op: '÷', ans: [N, n, n], fixed: [false, false, true] },
      { form: 'left', op: '×', ans: [n, n, N], fixed: [false, true, false] },
      { form: 'left', op: '÷', ans: [N, n, n], fixed: [false, false, true] },
    ];
  }

  /* Spot-the-mistake: 8 facts with 1–2 wrong divisions */
  function wrongVariants(form, T, d, q) {
    // all false statements made from the same three numbers for a division in this form
    if (form === 'right') {
      return [
        { st: stmt('right', '÷', d, T, q), tag: TAG.flipped },
        { st: stmt('right', '÷', d, q, T), tag: TAG.total },
        { st: stmt('right', '÷', q, T, d), tag: TAG.flipped },
      ];
    }
    return [
      { st: stmt('left', '÷', d, T, q), tag: TAG.flipped },
      { st: stmt('left', '÷', d, q, T), tag: TAG.total },
      { st: stmt('left', '÷', q, T, d), tag: TAG.flipped },
    ];
  }
  function buildSpot(fam) {
    var x = fam.c;
    var y = fam.r;
    var T = fam.T;
    var facts = [
      stmt('right', '×', x, y, T),
      stmt('right', '×', y, x, T),
      stmt('right', '÷', T, x, y),
      stmt('right', '÷', T, y, x),
      stmt('left', '×', x, y, T),
      stmt('left', '×', y, x, T),
      stmt('left', '÷', T, x, y),
      stmt('left', '÷', T, y, x),
    ];
    var divIdx = U.shuffle([2, 3, 6, 7]);
    var nWrong = U.rand(1, 2);
    var wrong = divIdx.slice(0, nWrong).sort(function (p, q) {
      return p - q;
    });
    // with two mistakes, one is a backwards division and one has the total in the wrong place
    var kinds = nWrong === 2 ? U.shuffle([0, 1]) : [U.pick([0, 1])];
    var items = facts.map(function (f, i) {
      var item = { shown: f, ok: true, idx: i };
      if (wrong.indexOf(i) !== -1) {
        var vars = wrongVariants(f.form, T, f.b, f.res);
        var bad = vars[kinds[wrong.indexOf(i)]];
        var others = vars.filter(function (v) {
          return plainFact(v.st) !== plainFact(bad.st);
        });
        item = {
          shown: bad.st,
          ok: false,
          idx: i,
          kindTag: bad.tag,
          fix: f,
          fixOptions: U.shuffle([{ st: f, ok: true }].concat(others.map(function (v) {
            return { st: v.st, ok: false, tag: v.tag };
          }))),
        };
      }
      return item;
    });
    return { items: items, wrong: wrong };
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  var deck = null;

  function buildDeck() {
    var used = {};
    function pair(cs, rs, cond) {
      for (var t = 0; t < 500; t++) {
        var c = U.pick(cs);
        var r = U.pick(rs);
        var key = Math.min(r, c) + 'x' + Math.max(r, c);
        if (used[key]) continue;
        if (cond && !cond(r, c)) continue;
        used[key] = true;
        return { r: r, c: c, T: r * c };
      }
      throw new Error('array-fact-family: could not pick numbers');
    }
    var kinds = U.shuffle(PRACTICE_KINDS).concat(U.shuffle(PRACTICE_KINDS));
    var k = 0;
    function withKind(q) {
      q.kind = kinds[k++ % kinds.length];
      return q;
    }
    function notSquare(r, c) {
      return r !== c;
    }
    var L1c = [2, 5, 10];
    var L1r = [2, 3, 4, 5];
    var L2c = [3, 4, 5, 6];
    var L2r = [3, 4, 5, 6];
    var q = [];
    var f;
    // Level 1: 2, 5 and 10 tables, up to 5 rows
    f = pair(L1c, L1r, notSquare);
    q.push(withKind({ type: 'count', level: 1, r: f.r, c: f.c, T: f.T }));
    f = pair(L1c, L1r, notSquare);
    q.push(withKind({ type: 'family', level: 1, r: f.r, c: f.c, T: f.T, given: null, steps: [stepRight(f)] }));
    f = pair(L1c, L1r, notSquare);
    q.push(withKind({ type: 'turn', level: 1, r: f.r, c: f.c, T: f.T }));
    f = pair(L1c, L1r, notSquare);
    q.push(withKind({ type: 'family', level: 1, r: f.r, c: f.c, T: f.T, given: null, steps: [stepRight(f)] }));
    // Level 2: 3, 4 and 6 tables, up to 6 rows
    var l2cond = function (r, c) {
      return r !== c && ([3, 4, 6].indexOf(r) !== -1 || [3, 4, 6].indexOf(c) !== -1);
    };
    f = pair(L2c, L2r, l2cond);
    q.push(withKind({ type: 'family', level: 2, r: f.r, c: f.c, T: f.T, given: null, steps: [stepRight(f), stepLeft(f)] }));
    f = pair(L2c, L2r, l2cond);
    var mode = U.pick(['rows', 'cols']);
    var d = mode === 'rows' ? f.r : f.c;
    var qq = f.T / d;
    q.push(
      withKind({
        type: 'which',
        level: 2,
        r: f.r,
        c: f.c,
        T: f.T,
        mode: mode,
        options: U.shuffle([
          { st: stmt('right', '÷', f.T, d, qq), ok: true },
          { st: stmt('right', '÷', d, f.T, qq), ok: false, tag: TAG.flipped },
          { st: stmt('left', '÷', qq, d, f.T), ok: false, tag: TAG.total },
          { st: stmt('left', '÷', d, f.T, qq), ok: false, tag: TAG.flipped },
        ]),
      })
    );
    f = pair(L2c, L2r, l2cond);
    var right = stepRight(f);
    q.push(withKind({ type: 'family', level: 2, r: f.r, c: f.c, T: f.T, given: right, steps: [stepLeft(f)] }));
    // Level 3: spot the mistake, build an array, square array
    f = pair([3, 6, 9, 10], [3, 4, 5, 6, 7, 8, 9], notSquare);
    var sp = buildSpot(f);
    q.push(withKind({ type: 'spot', level: 3, r: f.r, c: f.c, T: f.T, items: sp.items, wrong: sp.wrong }));
    f = pair([3, 4, 6, 8, 9], [6, 7, 8, 9], notSquare);
    q.push(withKind({ type: 'build', level: 3, r: f.r, c: f.c, T: f.T }));
    var n = U.pick([2, 3, 4, 5]);
    var sq = { r: n, c: n, T: n * n };
    q.push(withKind({ type: 'square', level: 3, r: n, c: n, T: n * n, steps: [stepSquare(sq)] }));
    return q;
  }

  /* ------------------------------------------------------------------ *
   * Tile board: number tiles that drag (or click) into slots
   * ------------------------------------------------------------------ */
  function makeBoard(api, numbers) {
    var b = { slots: [], selected: null, enabled: true };
    var tilesRow = el('div', { class: 'af-tiles' }, el('span', { class: 'af-tiles-label' }, 'Number tiles:'));
    numbers.forEach(function (v) {
      var t = el('button', { class: 'af-tile', type: 'button', 'data-value': v, 'aria-label': 'Tile ' + v }, String(v));
      bindTile(t, v);
      tilesRow.appendChild(t);
    });
    b.el = tilesRow;

    function activeSlots() {
      return b.slots.filter(function (s) {
        return !s.disabled;
      });
    }
    function select(s) {
      b.slots.forEach(function (x) {
        x.classList.remove('af-sel');
      });
      b.selected = s || null;
      if (s) s.classList.add('af-sel');
    }
    function nextEmpty(after) {
      var list = activeSlots();
      var start = after ? list.indexOf(after) + 1 : 0;
      for (var i = 0; i < list.length; i++) {
        var s = list[(start + i) % list.length];
        if (s.value_ == null) return s;
      }
      return null;
    }
    function fill(slot, v) {
      if (!slot || slot.disabled || !b.enabled) return;
      slot.value_ = v;
      slot.textContent = String(v);
      slot.dataset.filled = String(v);
      slot.classList.add('af-full');
      slot.parentNode.classList.remove('af-bad');
      MQ.sound('pop');
      select(nextEmpty(slot));
    }
    function placeClick(v) {
      if (!b.enabled) return;
      var s = b.selected && !b.selected.disabled ? b.selected : nextEmpty(null);
      if (s) fill(s, v);
    }
    function bindTile(t, v) {
      var start = null;
      var ghost = null;
      function move(e) {
        if (!start) return;
        if (!ghost && Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y) > 6) {
          ghost = el('div', { class: 'af-ghost' }, String(v));
          document.body.appendChild(ghost);
        }
        if (ghost) {
          ghost.style.left = e.clientX + 'px';
          ghost.style.top = e.clientY + 'px';
        }
      }
      function up(e) {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        if (!start) return;
        start = null;
        if (ghost) {
          ghost.parentNode.removeChild(ghost);
          ghost = null;
          var under = document.elementFromPoint(e.clientX, e.clientY);
          var slot = under && under.closest ? under.closest('.af-slot') : null;
          if (slot && b.slots.indexOf(slot) !== -1) fill(slot, v);
        } else {
          placeClick(v);
        }
      }
      t.addEventListener('pointerdown', function (e) {
        if (!b.enabled) return;
        e.preventDefault();
        start = { x: e.clientX, y: e.clientY };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
      });
      t.addEventListener('click', function (e) {
        if (e.detail === 0) placeClick(v); // keyboard
      });
      api.cleanup(function () {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
      });
    }

    b.addSlot = function (slot) {
      slot.addEventListener('click', function () {
        if (slot.disabled || !b.enabled) return;
        select(slot);
      });
      b.slots.push(slot);
    };
    b.selectFirst = function () {
      select(nextEmpty(null));
    };
    b.disable = function () {
      b.enabled = false;
      select(null);
      tilesRow.querySelectorAll('.af-tile').forEach(function (t) {
        t.disabled = true;
      });
      b.slots.forEach(function (s) {
        s.disabled = true;
      });
    };
    b.fill = fill;
    return b;
  }

  /* One statement row with slots */
  function stmtRow(spec, board, idTag) {
    var row = el('div', { class: 'af-st', 'data-stmt': idTag });
    var parts = [];
    var slots = [null, null, null];
    function piece(k) {
      if (spec.fixed[k]) return el('span', { class: 'af-fixed' }, String(spec.ans[k]));
      var s = el('button', { class: 'af-slot', type: 'button', 'data-slot': idTag + '-' + k, 'data-answer': spec.ans[k], 'aria-label': 'Empty box' }, '');
      s.value_ = null;
      slots[k] = s;
      if (board) board.addSlot(s);
      return s;
    }
    var A = piece(0);
    var B = piece(1);
    var R = piece(2);
    if (spec.form === 'left') parts = [R, el('span', { class: 'af-op' }, '='), A, el('span', { class: 'af-op' }, spec.op), B];
    else parts = [A, el('span', { class: 'af-op' }, spec.op), B, el('span', { class: 'af-op' }, '='), R];
    parts.forEach(function (p) {
      row.appendChild(p);
    });
    var view = {
      el: row,
      spec: spec,
      slots: slots,
      values: function () {
        return [0, 1, 2].map(function (k) {
          return spec.fixed[k] ? spec.ans[k] : slots[k].value_;
        });
      },
      good: function () {
        row.classList.remove('af-bad');
        row.classList.add('af-good');
      },
      bad: function () {
        row.classList.remove('af-good');
        row.classList.add('af-bad');
      },
      lock: function () {
        slots.forEach(function (s) {
          if (s) s.disabled = true;
        });
      },
      unlock: function () {
        slots.forEach(function (s) {
          if (s) s.disabled = false;
        });
        row.classList.remove('af-wait');
      },
      wait: function () {
        slots.forEach(function (s) {
          if (s) s.disabled = true;
        });
        row.classList.add('af-wait');
      },
      showAnswer: function () {
        slots.forEach(function (s, k) {
          if (!s) return;
          s.value_ = spec.ans[k];
          s.textContent = String(spec.ans[k]);
          s.classList.add('af-full');
          s.disabled = true;
        });
        view.good();
      },
    };
    return view;
  }

  function givenRow(spec, T) {
    var st = { form: spec.form, op: spec.op, a: spec.ans[0], b: spec.ans[1], res: spec.ans[2] };
    return el('div', { class: 'af-st af-given', html: factText(st, T) });
  }

  function famOf(q) {
    return { r: q.r, c: q.c, T: q.T };
  }

  function rowsOf(q) {
    return q.r + (q.r === 1 ? ' row' : ' rows') + ' of ' + q.c;
  }

  function repeatAdd(c, r) {
    var parts = [];
    for (var i = 0; i < r; i++) parts.push(c);
    return MQ.ui.sum(parts, c * r);
  }

  /* ------------------------------------------------------------------ *
   * Practice question types
   * ------------------------------------------------------------------ */
  function renderCount(stage, api, q) {
    var K = KINDS[q.kind];
    api.say('Count row by row. Click each row to jump!', 'think');
    stage.appendChild(MQ.ui.prompt('How many ' + K.noun + ' are in the ' + K.tray + '?'));
    var info = el('div', { class: 'af-note' }, 'Click the rows to count in ' + q.c + 's.');
    var arr = makeArray({ rows: q.r, cols: q.c, kind: q.kind, later: api.later, clickRows: function (lit) {
      info.textContent = lit < q.r ? lit + ' rows: ' + lit * q.c + ' so far' : 'All ' + q.r + ' rows: ' + q.T + ' ' + K.noun;
    } });
    var work = el('div', { class: 'af-work' });
    var input = MQ.ui.numberInput({
      unit: K.noun,
      onSubmit: function (v) {
        if (v === q.T) {
          input.good();
          input.disable();
          arr.lock();
          finish();
          api.check(true, q.c + ' + … in ' + q.r + ' rows = ' + q.T + '. Well counted!');
        } else {
          input.bad();
          var hint;
          if (api.tries() >= 1) hint = 'Count in ' + q.c + 's, one jump for each row: ' + U.range(1, Math.min(3, q.r)).map(function (i) { return i * q.c; }).join(', ') + (q.r > 3 ? ', …' : '') + ' There are ' + q.r + ' rows.';
          else if (v === q.r || v === q.c) hint = 'That is how many ' + (v === q.r ? 'rows' : 'in one row') + '. How many ' + K.noun + ' altogether? Click the rows to count in ' + q.c + 's.';
          else hint = 'Not quite. Each row has ' + q.c + '. Click the rows one at a time and count on in ' + q.c + 's.';
          api.check(false, hint, TAG.count);
        }
      },
    });
    function finish() {
      if (arr.lit < q.r) arr.showJumps();
      MQ.clear(work);
      work.appendChild(repeatAdd(q.c, q.r));
      work.appendChild(el('div', { class: 'af-fact', html: rowsOf(q) + ' = ' + q.c + ' × ' + q.r + ' = <span class="af-T">' + q.T + '</span>' }));
    }
    stage.appendChild(el('div', { class: 'af-row' }, el('div', { class: 'af-left' }, arr.el, info), el('div', { class: 'af-right' }, input.el, work)));
    input.focus();
    api.onReveal(function () {
      input.setValue(q.T);
      input.good();
      input.disable();
      arr.lock();
      finish();
      api.feedback(q.r + ' rows of ' + q.c + ': count ' + U.range(1, q.r).map(function (i) { return i * q.c; }).join(', ') + '. There are ' + q.T + '.', 'info');
    });
  }

  function renderTurn(stage, api, q) {
    var K = KINDS[q.kind];
    api.say('Turn the ' + K.tray + ' round. Do you get more ' + K.noun + '?', 'think');
    stage.appendChild(MQ.ui.prompt(rowsOf(q) + ': <b>' + q.c + ' × ' + q.r + ' = ' + q.T + '</b>. &nbsp;What is <b>' + q.r + ' × ' + q.c + '</b>?'));
    var arr = makeArray({ rows: q.r, cols: q.c, kind: q.kind, later: api.later });
    var caption = el('div', { class: 'af-note' }, rowsOf(q) + ' = ' + q.T);
    var turned = false;
    var turnBtn = el('button', { class: 'btn af-turn', type: 'button' }, 'Turn it ↻');
    turnBtn.addEventListener('click', function () {
      if (arr.busy) return;
      arr.rotate(function () {
        turned = !turned;
        caption.textContent = arr.rows + ' rows of ' + arr.cols + ' = ?';
        arr.showJumps(function () {
          caption.textContent = arr.rows + ' rows of ' + arr.cols + ' = ' + q.T;
        });
      });
    });
    var input = MQ.ui.numberInput({
      prefix: q.r + ' × ' + q.c + ' =',
      onSubmit: function (v) {
        if (v === q.T) {
          input.good();
          input.disable();
          turnBtn.disabled = true;
          api.check(true, 'Yes! ' + q.c + ' × ' + q.r + ' = ' + q.r + ' × ' + q.c + ' = ' + q.T + '. Turning does not change the total.');
        } else {
          input.bad();
          api.check(false, api.tries() >= 1 ? 'Turning the ' + K.tray + ' does not add or take away any ' + K.noun + '. ' + q.c + ' × ' + q.r + ' = ' + q.T + ', so ' + q.r + ' × ' + q.c + ' = ?' : 'Press "Turn it" and watch. Are there more ' + K.noun + ', or the same?', TAG.comm);
        }
      },
    });
    stage.appendChild(el('div', { class: 'af-row' }, el('div', { class: 'af-left' }, arr.el, caption), el('div', { class: 'af-right' }, turnBtn, input.el)));
    arr.showJumps();
    api.onReveal(function () {
      input.setValue(q.T);
      input.good();
      input.disable();
      turnBtn.disabled = true;
      function after() {
        caption.textContent = arr.rows + ' rows of ' + arr.cols + ' = ?';
        arr.showJumps(function () {
          caption.textContent = arr.rows + ' rows of ' + arr.cols + ' = ' + q.T + ', the same as before';
        });
      }
      if (!turned && !arr.busy) arr.rotate(after);
      else after();
      api.feedback('Turned round: ' + q.c + ' rows of ' + q.r + '. Still ' + q.T + ' ' + K.noun + '. ' + q.r + ' × ' + q.c + ' = ' + q.T + '.', 'info');
    });
  }

  function renderWhich(stage, api, q) {
    var K = KINDS[q.kind];
    var d = q.mode === 'rows' ? q.r : q.c;
    var each = q.T / d;
    var word = q.mode === 'rows' ? 'rows' : 'columns';
    api.say('The total is shared out. Which ÷ fact matches?', 'think');
    stage.appendChild(MQ.ui.prompt(q.T + ' ' + K.noun + ' split into ' + d + ' equal ' + word + '. Which fact is right?'));
    var arr = makeArray({ rows: q.r, cols: q.c, kind: q.kind, later: api.later });
    arr.split(q.mode);
    var cap = el('div', { class: 'af-note' }, q.T + ' split into ' + d + ' ' + word + '. Count one ' + (q.mode === 'rows' ? 'row' : 'column') + '.');
    var correct = q.options.filter(function (o) {
      return o.ok;
    })[0];
    var ch = MQ.ui.choices(
      q.options.map(function (o) {
        return { label: plainFact(o.st), value: plainFact(o.st) };
      }),
      function (v) {
        var o = q.options.filter(function (x) {
          return plainFact(x.st) === v;
        })[0];
        if (o.ok) {
          ch.mark(v, 'good');
          ch.disable();
          done();
          api.check(true, q.T + ' shared into ' + d + ' ' + word + ' gives ' + each + ' in each. ' + plainFact(o.st) + '!');
        } else {
          ch.mark(v, 'bad');
          var hint = o.tag === TAG.flipped ? 'That one is back to front. The total, ' + q.T + ', is what we split, so it comes first: ' + q.T + ' ÷ …' : q.T + ' is the total we split up. It cannot be the answer: look for a fact that starts with ' + q.T + '.';
          if (api.tries() >= 1) hint += ' Then count how many are in one ' + (q.mode === 'rows' ? 'row' : 'column') + '.';
          api.check(false, hint, o.tag);
        }
      },
      { columns: 2 }
    );
    ch.classList.add('af-choices');
    ch.buttons.forEach(function (bt) {
      bt.setAttribute('data-value', bt.value_);
      bt.setAttribute('data-ok', plainFact(correct.st) === bt.value_ ? '1' : '0');
    });
    function done() {
      arr.splitLabels();
      cap.textContent = q.T + ' split into ' + d + ' ' + word + ' → ' + each + ' in each';
    }
    stage.appendChild(el('div', { class: 'af-row' }, el('div', { class: 'af-left' }, arr.el, cap), el('div', { class: 'af-right' }, ch)));
    api.onReveal(function () {
      ch.mark(plainFact(correct.st), 'good');
      ch.disable();
      done();
      api.feedback('Start with the total: ' + plainFact(correct.st) + '. ' + q.T + ' split into ' + d + ' ' + word + ' gives ' + each + ' in each.', 'info');
    });
  }

  /* Fill statements (one or two steps) with number tiles. given = statements shown already done. */
  function familyBoard(stage, api, q, opts) {
    opts = opts || {};
    var fam = famOf(q);
    var nums = q.r === q.c ? [q.c, q.T] : U.shuffle([q.c, q.r, q.T]);
    var board = makeBoard(api, nums);
    var cols = el('div', { class: 'af-cols' });
    var views = [];
    var cur = 0;
    var titles = { right: 'Answer at the end', left: 'Answer at the start' };
    if (q.given) {
      var gcol = el('div', { class: 'af-col' }, el('div', { class: 'af-col-h' }, '✔ ' + titles.right));
      q.given.forEach(function (sp) {
        gcol.appendChild(givenRow(sp, q.T));
      });
      cols.appendChild(gcol);
    }
    q.steps.forEach(function (step, si) {
      var col = el('div', { class: 'af-col' });
      if (!opts.single) col.appendChild(el('div', { class: 'af-col-h' }, (q.steps.length > 1 ? 'Step ' + (si + 1) + ': ' : '') + titles[step[0].form]));
      var vs = step.map(function (sp, i) {
        var v = stmtRow(sp, board, si + '' + i);
        col.appendChild(v.el);
        if (si > 0) v.wait();
        return v;
      });
      views.push(vs);
      cols.appendChild(col);
    });
    if (opts.single) cols.classList.add('af-cols-grid');
    var checkBtn = el('button', { class: 'btn af-check', type: 'button' }, 'Check ✔');
    var box = el('div', { class: 'af-fam' }, board.el, cols, checkBtn);
    board.selectFirst();

    function revealAll() {
      views.forEach(function (vs) {
        vs.forEach(function (v) {
          v.unlock();
          v.showAnswer();
        });
      });
      board.disable();
      checkBtn.disabled = true;
    }

    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var vs = views[cur];
      var spec = q.steps[cur];
      var vals = vs.map(function (v) {
        return v.values();
      });
      var empty = vals.some(function (v) {
        return v.indexOf(null) !== -1;
      });
      if (empty) {
        api.feedback('Fill every empty box first, then press Check.', 'info');
        return;
      }
      var prev = [];
      var results = vals.map(function (v, i) {
        var r = judge(spec[i], v, fam, prev.slice());
        prev.push({ form: spec[i].form, op: spec[i].op, a: v[0], b: v[1], res: v[2] });
        return r;
      });
      var bad = [];
      results.forEach(function (r, i) {
        if (r.ok) {
          vs[i].good();
          vs[i].lock();
        } else {
          vs[i].bad();
          bad.push(r);
        }
      });
      if (!bad.length) {
        cur++;
        if (cur < q.steps.length) {
          MQ.sound('correct');
          views[cur].forEach(function (v) {
            v.unlock();
          });
          board.selectFirst();
          api.say('Step 1 done! Now put the answer at the start.', 'happy');
          api.feedback('All 4 are right! Now write them the other way round: the answer goes first.', 'good');
          return;
        }
        board.disable();
        checkBtn.disabled = true;
        if (opts.onDone) opts.onDone();
        api.check(true, opts.praise || 'All the facts in the family! Brilliant!');
        return;
      }
      var f = bad[0];
      var extra = bad.length > 1 ? ' (' + bad.length + ' boxes need fixing.)' : '';
      api.check(false, (api.tries() >= 1 ? f.hint2 : f.hint1) + extra, f.tag);
    });

    return { el: box, revealAll: revealAll };
  }

  function renderFamily(stage, api, q) {
    var K = KINDS[q.kind];
    var twoSteps = q.steps.length > 1;
    if (q.given) {
      api.say('Here are 4 facts. Now write each one with the answer first!', 'think');
      stage.appendChild(MQ.ui.prompt('Fill the family again, with the answer <b>first</b>.'));
    } else if (twoSteps) {
      api.say('Make all 8 facts! First 4, then the same facts the other way round.', 'think');
      stage.appendChild(MQ.ui.prompt('Fill the fact family for this ' + K.tray + '.'));
    } else {
      api.say('Drag the number tiles into the boxes. Or click a tile!', 'think');
      stage.appendChild(MQ.ui.prompt('Fill the fact family for this ' + K.tray + '.'));
    }
    var arr = makeArray({ rows: q.r, cols: q.c, kind: q.kind, later: api.later, box: 260, clickRows: function () {} });
    var cap = el('div', { class: 'af-note' }, 'Click the rows to count in ' + q.c + 's.');
    var fb = familyBoard(stage, api, q, {
      single: !twoSteps && !q.given,
      onDone: function () {
        if (arr.lit < q.r) arr.showJumps();
        cap.innerHTML = rowsOf(q) + ' = <b>' + q.T + '</b>';
      },
    });
    stage.appendChild(el('div', { class: 'af-row' }, el('div', { class: 'af-left af-left-sm' }, arr.el, cap), el('div', { class: 'af-right af-right-wide' }, fb.el)));
    api.onReveal(function () {
      fb.revealAll();
      arr.lock();
      if (arr.lit < q.r) arr.showJumps();
      cap.innerHTML = rowsOf(q) + ' = <b>' + q.T + '</b>';
      api.feedback(q.T + ' is the total. It is the answer of the × facts and the number being divided in the ÷ facts.', 'info');
    });
  }

  function renderSpot(stage, api, q) {
    var nWrong = q.wrong.length;
    api.say('I wrote this family, but I made ' + (nWrong === 1 ? 'a mistake' : '2 mistakes') + '. Can you find ' + (nWrong === 1 ? 'it' : 'them') + '?', 'oops');
    stage.appendChild(MQ.ui.prompt('Bolt made <b>' + nWrong + '</b> mistake' + (nWrong === 1 ? '' : 's') + '. Tap the wrong fact' + (nWrong === 1 ? '' : 's') + ', then press Check.'));
    var arr = makeArray({ rows: q.r, cols: q.c, kind: q.kind, later: api.later, box: 260, clickRows: function () {} });
    var cap = el('div', { class: 'af-note' }, rowsOf(q) + ' = ' + q.T);
    var picked = {};
    var phase = 1;
    var fixing = 0;
    var btns = q.items.map(function (it) {
      var bt = el('button', { class: 'af-sfact', type: 'button', 'data-idx': it.idx, 'data-ok': it.ok ? '1' : '0', html: factText(it.shown, q.T) });
      bt.addEventListener('click', function () {
        if (phase !== 1 || api.isAnswered()) return;
        picked[it.idx] = !picked[it.idx];
        bt.classList.toggle('af-picked', picked[it.idx]);
        MQ.sound('click');
      });
      return bt;
    });
    var colA = el('div', { class: 'af-col' }, el('div', { class: 'af-col-h' }, 'Answer at the end'));
    var colB = el('div', { class: 'af-col' }, el('div', { class: 'af-col-h' }, 'Answer at the start'));
    btns.forEach(function (bt, i) {
      (i < 4 ? colA : colB).appendChild(bt);
    });
    var checkBtn = el('button', { class: 'btn af-check', type: 'button' }, 'Check ✔');
    var fixBox = el('div', { class: 'af-fixbox' });
    var right = el('div', { class: 'af-right af-right-wide' }, el('div', { class: 'af-cols' }, colA, colB), checkBtn, fixBox);
    stage.appendChild(el('div', { class: 'af-row' }, el('div', { class: 'af-left af-left-sm' }, arr.el, cap), right));

    function fixed(it) {
      var bt = btns[q.items.indexOf(it)];
      bt.classList.remove('af-picked', 'af-fixing');
      bt.classList.add('af-fixed-ok');
      bt.innerHTML = '<s class="af-strike">' + plainFact(it.shown) + '</s> ' + factText(it.fix, q.T);
    }

    function showFix() {
      MQ.clear(fixBox);
      var it = q.items[q.wrong[fixing]];
      var bt = btns[q.wrong[fixing]];
      bt.classList.add('af-fixing');
      fixBox.appendChild(el('div', { class: 'af-note', html: 'How should <b>' + plainFact(it.shown) + '</b> be written?' }));
      var ch = MQ.ui.choices(
        it.fixOptions.map(function (o) {
          return { label: plainFact(o.st), value: plainFact(o.st) };
        }),
        function (v) {
          var o = it.fixOptions.filter(function (x) {
            return plainFact(x.st) === v;
          })[0];
          if (o.ok) {
            ch.mark(v, 'good');
            ch.disable();
            fixed(it);
            fixing++;
            if (fixing < q.wrong.length) {
              MQ.sound('correct');
              api.feedback('Fixed! Now the next one.', 'good');
              api.later(showFix, 700);
            } else {
              api.check(true, 'You fixed the family! The total, ' + q.T + ', is always the number being divided.');
            }
          } else {
            ch.mark(v, 'bad');
            var hint = o.tag === TAG.flipped ? 'Still back to front. The total, ' + q.T + ', is what we divide, so it comes straight before the ÷ sign.' : q.T + ' must not be the answer of a ÷ fact. Divide ' + q.T + ' instead.';
            if (api.tries() >= 1) hint += ' Look at the other ÷ facts that are right.';
            api.check(false, hint, o.tag);
          }
        },
        { columns: 3 }
      );
      ch.classList.add('af-choices');
      ch.buttons.forEach(function (b2) {
        b2.setAttribute('data-value', b2.value_);
        var oo = it.fixOptions.filter(function (x) {
          return plainFact(x.st) === b2.value_;
        })[0];
        b2.setAttribute('data-ok', oo.ok ? '1' : '0');
      });
      fixBox.appendChild(ch);
    }

    checkBtn.addEventListener('click', function () {
      if (phase !== 1 || api.isAnswered()) return;
      if (!Object.keys(picked).some(function (k) {
        return picked[k];
      })) {
        api.feedback('Tap the wrong fact' + (nWrong === 1 ? '' : 's') + ' first, then press Check.', 'info');
        return;
      }
      var missed = q.wrong.filter(function (i) {
        return !picked[i];
      });
      var extra = q.items.filter(function (it) {
        return it.ok && picked[it.idx];
      });
      if (!missed.length && !extra.length) {
        phase = 2;
        checkBtn.disabled = true;
        btns.forEach(function (bt) {
          bt.disabled = true;
        });
        MQ.sound('correct');
        api.say('You found ' + (nWrong === 1 ? 'it' : 'them') + '! Now fix ' + (nWrong === 1 ? 'it' : 'them') + '.', 'happy');
        api.feedback('Well spotted! Now choose the right way to write ' + (nWrong === 1 ? 'it' : 'each one') + '.', 'good');
        showFix();
        return;
      }
      if (extra.length && !missed.length) {
        var e1 = extra[0].shown;
        api.check(false, plainFact(e1) + ' is right: ' + (e1.op === '×' ? 'it multiplies to make ' + q.T + '.' : 'it starts with ' + q.T + ' and ' + e1.b + ' × ' + e1.res + ' = ' + q.T + '.') + ' Tap it again to un-pick it.', TAG.markedOk);
        return;
      }
      var m = q.items[missed[0]];
      var hint = api.tries() >= 1 ? 'Check every ÷ fact. Is ' + q.T + ' the number being divided (just before ÷)? If ' + q.T + ' is the answer, or comes after ÷, it is wrong.' : 'Look at the ÷ facts. The total, ' + q.T + ', must be the number being divided.';
      if (extra.length) hint += ' Also, ' + plainFact(extra[0].shown) + ' is right.';
      api.check(false, hint, m.kindTag);
    });

    api.onReveal(function () {
      phase = 3;
      checkBtn.disabled = true;
      btns.forEach(function (bt) {
        bt.disabled = true;
      });
      MQ.clear(fixBox);
      q.wrong.forEach(function (i) {
        fixed(q.items[i]);
      });
      arr.showJumps();
      api.feedback('The wrong ones did not start with ' + q.T + '. The total is always the number being divided.', 'info');
    });
  }

  function renderBuild(stage, api, q) {
    var K = KINDS[q.kind];
    api.say('Build it! Drag across the ' + K.tray + '. Rows go across.', 'think');
    stage.appendChild(MQ.ui.prompt('Build <b>' + q.r + ' rows of ' + q.c + '</b> ' + K.noun + '. That is ' + q.c + ' × ' + q.r + '.'));
    var label = el('div', { class: 'af-buildlabel' }, 'Drag or click in the ' + K.tray + '.');
    var arr = makeArray({
      rows: 0,
      cols: 0,
      kind: q.kind,
      later: api.later,
      cell: 26,
      build: {
        maxR: 10,
        maxC: 10,
        onChange: function (r, c) {
          label.textContent = r + (r === 1 ? ' row' : ' rows') + ' of ' + c;
        },
      },
    });
    var checkBtn = el('button', { class: 'btn af-check', type: 'button' }, 'Check ✔');
    var work = el('div', { class: 'af-work' });
    function done() {
      arr.lock();
      checkBtn.disabled = true;
      arr.showJumps();
      label.textContent = rowsOf(q) + ' = ' + q.T;
      MQ.clear(work);
      work.appendChild(el('div', { class: 'af-fact', html: q.c + ' × ' + q.r + ' = <span class="af-T">' + q.T + '</span>' }));
      work.appendChild(el('div', { class: 'af-fact af-fact-sm', html: '<span class="af-T">' + q.T + '</span> ÷ ' + q.r + ' = ' + q.c + ' &nbsp; <span class="af-T">' + q.T + '</span> ÷ ' + q.c + ' = ' + q.r }));
    }
    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var r = arr.rows;
      var c = arr.cols;
      if (!r) {
        api.feedback('Drag across the ' + K.tray + ' to fill it first.', 'info');
        return;
      }
      if (r === q.r && c === q.c) {
        done();
        api.check(true, rowsOf(q) + '. ' + q.c + ' × ' + q.r + ' = ' + q.T + '!');
        return;
      }
      if (r === q.c && c === q.r) {
        api.check(false, 'You built ' + r + ' rows of ' + c + '. Same total, but turned round! Rows go across ↔. I need ' + q.r + ' rows, with ' + q.c + ' in each row.', TAG.rowsCols);
        return;
      }
      var h = [];
      if (r !== q.r) h.push('you have ' + r + (r === 1 ? ' row' : ' rows') + ' (across ↔), I need ' + q.r);
      if (c !== q.c) h.push('each row has ' + c + ', I need ' + q.c + ' in each row');
      var msg = 'Nearly: ' + h.join(', and ') + '.';
      if (api.tries() >= 1) msg += ' Start at the top-left corner and drag to the right and down.';
      api.check(false, msg, TAG.wrongBuild);
    });
    stage.appendChild(el('div', { class: 'af-row' }, el('div', { class: 'af-left' }, arr.el, label), el('div', { class: 'af-right' }, checkBtn, work)));
    api.onReveal(function () {
      arr.setSize(q.r, q.c);
      done();
      api.feedback(q.r + ' rows (across) with ' + q.c + ' in each row: ' + q.c + ' × ' + q.r + ' = ' + q.T + '.', 'info');
    });
  }

  function renderSquare(stage, api, q) {
    var K = KINDS[q.kind];
    var n = q.c;
    api.say('A square ' + K.tray + '! Turn it round. What do you notice?', 'think');
    var promptEl = MQ.ui.prompt(rowsOf(q) + '. Turn it round. How many <b>different</b> facts are in this family?');
    stage.appendChild(promptEl);
    var arr = makeArray({ rows: n, cols: n, kind: q.kind, later: api.later, box: 200 });
    var cap = el('div', { class: 'af-note' }, rowsOf(q) + ' = ' + q.T);
    var turnBtn = el('button', { class: 'btn af-turn', type: 'button' }, 'Turn it ↻');
    turnBtn.addEventListener('click', function () {
      if (arr.busy) return;
      arr.rotate(function () {
        cap.textContent = 'Turned: still ' + rowsOf(q) + '. The same picture!';
      });
    });
    var right = el('div', { class: 'af-right af-right-wide' });
    var fb = null;
    var ch = MQ.ui.choices(
      [
        { label: '4 facts', value: 4 },
        { label: '8 facts', value: 8 },
      ],
      function (v) {
        if (v === 4) {
          ch.mark(4, 'good');
          ch.disable();
          turnBtn.disabled = true;
          MQ.sound('correct');
          api.feedback('Yes! Turning it gives the same fact, so there are only 4. Now fill them in.', 'good');
          api.say('Only 4 facts. Fill them in!', 'happy');
          step2();
        } else {
          ch.mark(8, 'bad');
          api.check(false, api.tries() >= 1 ? n + ' × ' + n + ' turned round is still ' + n + ' × ' + n + '. The turn-around is the same fact, so the family has fewer facts.' : 'Press "Turn it". Does the ' + K.tray + ' look any different? Is there a new turn-around fact?', TAG.square);
        }
      },
      { columns: 2 }
    );
    ch.classList.add('af-choices');
    ch.buttons.forEach(function (b2) {
      b2.setAttribute('data-value', b2.value_);
    });
    right.appendChild(turnBtn);
    right.appendChild(ch);
    function step2() {
      if (fb) return;
      promptEl.innerHTML = 'Fill the <b>4</b> facts for ' + rowsOf(q) + '.';
      fb = familyBoard(stage, api, q, {
        single: true,
        praise: 'A square array has just 4 facts. Well done!',
        onDone: function () {
          arr.showJumps();
        },
      });
      right.appendChild(fb.el);
    }
    stage.appendChild(el('div', { class: 'af-row' }, el('div', { class: 'af-left af-left-sm' }, arr.el, cap), right));
    api.onReveal(function () {
      ch.mark(4, 'good');
      ch.disable();
      turnBtn.disabled = true;
      step2();
      fb.revealAll();
      arr.showJumps();
      api.feedback('Turning ' + n + ' rows of ' + n + ' gives the same picture, so ' + n + ' × ' + n + ' = ' + q.T + ' has only 4 facts.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */
  function learnRows(stage, api) {
    api.lockNext();
    api.say('Fill the tin: 3 rows of 5 muffins. Drag from the top-left corner!');
    stage.appendChild(MQ.ui.lesson('Rows and columns', 'A <b>row</b> goes across ↔. A <b>column</b> goes down ↕.'));
    var label = el('div', { class: 'af-buildlabel' }, 'Drag or click in the tin.');
    var work = el('div', { class: 'af-work' });
    var doneFlag = false;
    var arr = makeArray({
      rows: 0,
      cols: 0,
      kind: 'muffin',
      later: api.later,
      cell: 44,
      build: {
        maxR: 5,
        maxC: 6,
        onChange: function (r, c) {
          label.textContent = r + (r === 1 ? ' row' : ' rows') + ' of ' + c;
        },
        onRelease: function (r, c) {
          if (doneFlag) return;
          if (r === 3 && c === 5) {
            doneFlag = true;
            arr.lock();
            api.feedback('3 rows of 5! Now count row by row…', 'good');
            arr.showJumps(function () {
              work.appendChild(repeatAdd(5, 3));
              work.appendChild(el('div', { class: 'af-fact', html: '3 rows of 5 = 5 × 3 = <span class="af-T">15</span>' }));
              api.say('Count the rows, not every muffin: 5, 10, 15!', 'cheer');
              api.feedback('Jump 5 for each row: 5, 10, 15.', 'good');
              api.unlockNext();
            });
          } else if (r === 5 && c === 3) {
            api.feedback('That is 5 rows of 3. Rows go across ↔: make 3 rows with 5 in each.', 'try');
          } else {
            api.feedback('That is ' + r + (r === 1 ? ' row' : ' rows') + ' of ' + c + '. We need 3 rows with 5 in each row.', 'try');
          }
        },
      },
    });
    stage.appendChild(el('div', { class: 'af-row' }, el('div', { class: 'af-left' }, arr.el, label), el('div', { class: 'af-right' }, work)));
  }

  function learnTurn(stage, api) {
    api.lockNext();
    api.say('Turn the tin a quarter turn. Watch the muffins!');
    stage.appendChild(MQ.ui.lesson('Turn it round', 'Same muffins, turned round. Does the total change?'));
    var arr = makeArray({ rows: 3, cols: 5, kind: 'muffin', later: api.later, box: 220 });
    var cap = el('div', { class: 'af-fact', html: '3 rows of 5: 5 × 3 = <span class="af-T">15</span>' });
    var work = el('div', { class: 'af-work' });
    var turns = 0;
    var btn = el('button', { class: 'btn af-turn', type: 'button' }, 'Turn it ↻');
    btn.addEventListener('click', function () {
      if (arr.busy) return;
      MQ.sound('click');
      arr.rotate(function () {
        turns++;
        var r = arr.rows;
        var c = arr.cols;
        cap.innerHTML = r + ' rows of ' + c + ' = ?';
        arr.showJumps(function () {
          cap.innerHTML = r + ' rows of ' + c + ': ' + c + ' × ' + r + ' = <span class="af-T">15</span>';
          if (turns === 1) {
            MQ.clear(work);
            work.appendChild(el('div', { class: 'af-fact af-big', html: '5 × 3 = 3 × 5 = <span class="af-T">15</span>' }));
            work.appendChild(el('div', { class: 'af-note' }, 'These are turn-around facts. Turning does not change the total.'));
            api.say('Still 15! 5 × 3 and 3 × 5 are turn-around facts.', 'cheer');
            api.unlockNext();
          }
        });
      });
    });
    stage.appendChild(el('div', { class: 'af-row' }, el('div', { class: 'af-left' }, arr.el, cap), el('div', { class: 'af-right' }, btn, work)));
    arr.showJumps();
  }

  function learnSplit(stage, api) {
    api.lockNext();
    api.say('Division splits the total. Cut the tray into rows, then into columns.');
    stage.appendChild(MQ.ui.lesson('Splitting it up', 'Dividing means splitting the total into equal parts.'));
    var arr = makeArray({ rows: 3, cols: 5, kind: 'counter', later: api.later, box: 220 });
    var cap = el('div', { class: 'af-note' }, '15 counters');
    var facts = el('div', { class: 'af-work' });
    var seen = {};
    function show(mode) {
      MQ.sound('pop');
      arr.split(mode);
      arr.splitLabels();
      seen[mode] = true;
      if (mode === 'rows') {
        cap.textContent = '15 split into 3 rows → 5 in each row';
        rowFact.innerHTML = '<span class="af-T">15</span> ÷ 3 = 5';
        rowFact.classList.add('af-on');
      } else {
        cap.textContent = '15 split into 5 columns → 3 in each column';
        colFact.innerHTML = '<span class="af-T">15</span> ÷ 5 = 3';
        colFact.classList.add('af-on');
      }
      if (seen.rows && seen.cols) {
        api.say('See? 15, the total, always comes first when we divide.', 'cheer');
        api.feedback('15 ÷ 3 = 5 and 15 ÷ 5 = 3. The total is the number being divided.', 'good');
        api.unlockNext();
      }
    }
    var rowFact = el('div', { class: 'af-fact af-dim' }, '15 ÷ 3 = ?');
    var colFact = el('div', { class: 'af-fact af-dim' }, '15 ÷ 5 = ?');
    facts.appendChild(rowFact);
    facts.appendChild(colFact);
    var b1 = el('button', { class: 'btn af-splitbtn', type: 'button', 'data-split': 'rows', onclick: function () { show('rows'); } }, '✂ Split into rows');
    var b2 = el('button', { class: 'btn af-splitbtn', type: 'button', 'data-split': 'cols', onclick: function () { show('cols'); } }, '✂ Split into columns');
    stage.appendChild(el('div', { class: 'af-row' }, el('div', { class: 'af-left' }, arr.el, cap), el('div', { class: 'af-right' }, el('div', { class: 'af-btnrow' }, b1, b2), facts)));
  }

  function learnTriangle(stage, api) {
    api.lockNext();
    api.say('3, 5 and 15 are a family. Tap each card to see a fact.');
    stage.appendChild(MQ.ui.lesson('The fact family', 'The big number, the total, goes at the top.'));
    var tri = S('svg', { viewBox: '0 0 220 190', width: 220, height: 190, class: 'af-tri', style: { maxWidth: '100%', height: 'auto' } });
    tri.appendChild(S('path', { d: 'M110 18 L205 172 L15 172 Z', class: 'af-tri-shape' }));
    [[110, 52, 15, true], [50, 150, 3, false], [170, 150, 5, false]].forEach(function (p) {
      tri.appendChild(S('circle', { cx: p[0], cy: p[1], r: 26, class: p[3] ? 'af-tri-top' : 'af-tri-dot' }));
      tri.appendChild(S('text', { x: p[0], y: p[1] + 9, 'text-anchor': 'middle', class: 'af-tri-t' }, String(p[2])));
    });
    var factsList = [
      '3 × 5 = <span class="af-T">15</span>',
      '5 × 3 = <span class="af-T">15</span>',
      '<span class="af-T">15</span> ÷ 3 = 5',
      '<span class="af-T">15</span> ÷ 5 = 3',
    ];
    var opened = 0;
    var quiz = el('div', { class: 'af-quiz' });
    var cards = el('div', { class: 'af-cards' });
    factsList.forEach(function (h, i) {
      var c = el('button', { class: 'af-card', type: 'button', 'data-card': i }, i < 2 ? '× fact ?' : '÷ fact ?');
      c.addEventListener('click', function () {
        if (c.classList.contains('af-open')) return;
        c.classList.add('af-open');
        c.innerHTML = h;
        MQ.sound('pop');
        opened++;
        if (opened === 4) askQuiz();
      });
      cards.appendChild(c);
    });
    function askQuiz() {
      api.say('In ÷ facts, 15 always comes first. Which one is right?', 'think');
      quiz.appendChild(el('div', { class: 'af-note' }, 'Which division is right?'));
      var ch = MQ.ui.choices(
        [
          { label: '3 ÷ 15 = 5', value: 'bad' },
          { label: '15 ÷ 3 = 5', value: 'good' },
        ],
        function (v) {
          if (v === 'good') {
            ch.mark('good', 'good');
            ch.disable();
            api.sound('correct');
            api.say('Yes! The total is always the number being divided.', 'cheer');
            api.feedback('15 ÷ 3 = 5. The total, 15, comes first. Let\'s practise!', 'good');
            api.unlockNext();
          } else {
            ch.mark('bad', 'bad');
            api.sound('wrong');
            api.feedback('3 ÷ 15 is back to front. We split the total, 15, so 15 comes first.', 'try');
          }
        },
        { columns: 2 }
      );
      ch.classList.add('af-choices');
      ch.buttons.forEach(function (b2) {
        b2.setAttribute('data-value', b2.value_);
      });
      quiz.appendChild(ch);
    }
    stage.appendChild(el('div', { class: 'af-row' }, el('div', { class: 'af-left' }, tri), el('div', { class: 'af-right' }, cards, quiz)));
  }

  /* ------------------------------------------------------------------ */
  MQ.register(ID, {
    learn: [learnRows, learnTurn, learnSplit, learnTriangle],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'count') return renderCount(stage, api, q);
        if (q.type === 'turn') return renderTurn(stage, api, q);
        if (q.type === 'which') return renderWhich(stage, api, q);
        if (q.type === 'spot') return renderSpot(stage, api, q);
        if (q.type === 'build') return renderBuild(stage, api, q);
        if (q.type === 'square') return renderSquare(stage, api, q);
        return renderFamily(stage, api, q);
      },
    },
  });

  MQ._test = MQ._test || {};
  MQ._test[ID] = {
    buildDeck: buildDeck,
    isTrue: isTrue,
    inFamily: inFamily,
    deck: function () {
      return deck;
    },
  };

  var css = [
    '.af-row{display:flex;gap:22px;align-items:flex-start;justify-content:center;flex-wrap:wrap;width:100%}',
    '.af-left{display:flex;flex-direction:column;align-items:center;gap:6px;flex:0 1 auto;min-width:0;max-width:100%}',
    '.af-left-sm{max-width:370px}',
    '.af-right{display:flex;flex-direction:column;align-items:center;gap:12px;flex:1 1 280px;min-width:0;max-width:460px}',
    '.af-right-wide{max-width:600px;flex-basis:420px}',
    '.af-array{display:flex;justify-content:center;max-width:100%}',
    '.af-svg{display:block;overflow:visible;user-select:none}',
    '.af-clickable .af-rowhit{cursor:pointer}',
    '.af-clickable .af-rowhit:hover{fill:rgba(255,183,3,.12)}',
    '.af-locked .af-rowhit{cursor:default}',
    '.af-buildable{cursor:crosshair}',
    '.af-tray{fill:#eef1f6;stroke:#b8c2d6;stroke-width:2}',
    '.af-tray-muffin{fill:#d5dbe3;stroke:#9aa5b5}',
    '.af-tray-egg{fill:#ecdcb8;stroke:#c9b48a}',
    '.af-tray-apple{fill:#e8d3b0;stroke:#b08b57}',
    '.af-tray-cookie{fill:#dfe3ea;stroke:#a7b0bf}',
    '.af-tray-button{fill:#fff;stroke:#b8c2d6}',
    '.af-hole{fill:rgba(27,42,74,.07)}',
    '.af-band{fill:#ffe8a3;opacity:0;transition:opacity .25s}',
    '.af-band-on{opacity:1}',
    '.af-bubble{fill:#fff3cd;stroke:var(--gold);stroke-width:2.5}',
    '.af-bubble-t{font-weight:800;fill:var(--ink)}',
    '.af-arc{fill:none;stroke:#e09f00;stroke-width:2.5}',
    '.af-arrowhead{fill:#e09f00}',
    '.af-plus{font-weight:800;font-size:15px;fill:#b07800}',
    '.af-ring{fill:none;stroke:#2a6fd6;stroke-width:2.5}',
    '.af-cut{stroke:#c2410c;stroke-width:3;stroke-dasharray:7 5}',
    '.af-split-t{font-weight:800;font-size:18px;fill:#2a6fd6}',
    '.af-note{font-size:1.05rem;font-weight:700;color:var(--ink-soft);text-align:center}',
    '.af-buildlabel{font-size:1.25rem;font-weight:800;color:#0b6e66;min-height:1.6em;text-align:center}',
    '.af-work{display:flex;flex-direction:column;align-items:center;gap:10px}',
    '.af-fact{font-size:1.45rem;font-weight:800;text-align:center;background:#fff;border:2px solid var(--line);border-radius:14px;padding:6px 14px}',
    '.af-fact-sm{font-size:1.2rem}',
    '.af-big{font-size:1.7rem}',
    '.af-dim{color:var(--ink-soft);opacity:.6}',
    '.af-on{opacity:1;color:var(--ink);border-color:var(--good);background:var(--good-bg)}',
    '.af-T{color:#b45309;background:#fff3cd;border-radius:6px;padding:0 4px}',
    '.af-turn,.af-check,.af-splitbtn{font-size:1.15rem}',
    '.af-btnrow{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.af-fam{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}',
    '.af-tiles{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center;background:var(--paper);border:2px dashed var(--line);border-radius:14px;padding:8px 12px}',
    '.af-tiles-label{font-weight:800;color:var(--ink-soft)}',
    '.af-tile{min-width:62px;height:52px;padding:0 10px;font-size:1.5rem;font-weight:800;border-radius:12px;border:3px solid #e0a800;background:#ffe8a3;color:var(--ink);cursor:grab;touch-action:none;user-select:none}',
    '.af-tile:hover:not(:disabled){transform:translateY(-2px)}',
    '.af-tile:disabled{opacity:.5;cursor:default}',
    '.af-ghost{position:fixed;z-index:50;pointer-events:none;transform:translate(-50%,-50%);min-width:56px;height:50px;line-height:44px;text-align:center;font-size:1.5rem;font-weight:800;border-radius:12px;border:3px solid #e0a800;background:#ffe8a3;box-shadow:0 6px 16px rgba(0,0,0,.2)}',
    '.af-cols{display:flex;gap:16px;justify-content:center;flex-wrap:wrap;width:100%}',
    '.af-cols-grid .af-col{display:grid;grid-template-columns:repeat(2,minmax(0,auto));gap:8px 14px}',
    '.af-col{display:flex;flex-direction:column;gap:7px;align-items:stretch}',
    '.af-col-h{font-weight:800;color:var(--ink-soft);font-size:.95rem;text-align:center}',
    '.af-st{display:flex;align-items:center;justify-content:center;gap:6px;padding:4px 8px;border-radius:12px;border:2px solid transparent;font-size:1.35rem;font-weight:800}',
    '.af-st.af-good{background:var(--good-bg);border-color:var(--good)}',
    '.af-st.af-bad{background:var(--try-bg);border-color:var(--try)}',
    '.af-st.af-wait{opacity:.4}',
    '.af-given{background:var(--paper);color:var(--ink-soft);min-height:52px}',
    '.af-slot{width:58px;height:46px;border-radius:10px;border:3px dashed #9aa8c7;background:#fff;font-size:1.35rem;font-weight:800;color:var(--ink);cursor:pointer;padding:0}',
    '.af-slot.af-full{border-style:solid;border-color:#e0a800;background:#fffaf0}',
    '.af-slot.af-sel{outline:4px solid var(--accent);outline-offset:1px}',
    '.af-slot:disabled{cursor:default}',
    '.af-fixed{min-width:40px;text-align:center}',
    '.af-op{color:var(--ink-soft);min-width:18px;text-align:center}',
    '.af-sfact{font-size:1.3rem;font-weight:800;padding:6px 12px;border-radius:12px;border:3px solid var(--line);background:#fff;color:var(--ink);cursor:pointer;min-height:48px}',
    '.af-sfact:hover:not(:disabled){border-color:var(--accent)}',
    '.af-sfact:disabled{cursor:default}',
    '.af-sfact.af-picked{border-color:var(--try);background:var(--try-bg)}',
    '.af-sfact.af-picked::after{content:" ✗";color:var(--try)}',
    '.af-sfact.af-fixing{outline:4px solid var(--gold)}',
    '.af-sfact.af-fixed-ok{border-color:var(--good);background:var(--good-bg)}',
    '.af-strike{color:var(--try);font-size:1rem;margin-right:6px}',
    '.af-fixbox{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.af-choices{max-width:520px}',
    '.af-choices .choice{font-size:1.3rem;white-space:nowrap;padding:10px 8px}',
    '.af-fixbox .af-choices{max-width:560px}',
    '.af-tri-shape{fill:#f4f7ff;stroke:var(--line);stroke-width:3;stroke-linejoin:round}',
    '.af-tri-top{fill:#fff3cd;stroke:var(--gold);stroke-width:3}',
    '.af-tri-dot{fill:#fff;stroke:#9aa8c7;stroke-width:3}',
    '.af-tri-t{font-size:26px;font-weight:800;fill:var(--ink)}',
    '.af-cards{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;width:100%;max-width:420px}',
    '.af-card{min-height:58px;border-radius:14px;border:3px solid var(--line);background:var(--paper-2);font-size:1.3rem;font-weight:800;color:var(--ink-soft);cursor:pointer}',
    '.af-card.af-open{background:#fff;color:var(--ink);border-color:var(--good);cursor:default}',
    '.af-quiz{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.af-tri{display:block}',
    '@media (max-width:700px){.af-slot{width:50px;height:44px}.af-st{font-size:1.2rem;gap:4px;padding:3px 4px}.af-cols-grid .af-col{grid-template-columns:1fr}.af-row{gap:14px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

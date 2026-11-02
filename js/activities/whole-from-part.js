/* Find the Whole — work back from a part to the whole (Unit 7.1).
 * Bolt shows part of a shape and its fraction. The child stamps copies of the same piece
 * onto a square or triangle grid until the whole has as many equal pieces as the bottom
 * number says. Building by copying pieces means no multiplying is needed.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var TAG = {
    size: 'Used pieces of a different size',
    numer: 'Thought the whole has as many pieces as the top number',
    count: 'Built the whole with the wrong number of pieces',
    only: 'Thought there is only one right whole',
  };
  var H3 = Math.sqrt(3) / 2;

  function frac(n, d, cls) {
    return '<span class="wp-frac' + (cls ? ' ' + cls : '') + '"><span class="wp-fn">' + n + '</span><span class="wp-fd">' + d + '</span></span>';
  }

  /* ---------------------------------------------------------------- *
   * Grid models. Cells have string keys; verts are in grid units.
   * ---------------------------------------------------------------- */
  function sqGrid(cols, rows) {
    var keys = [];
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) keys.push(c + ',' + r);
    function p(k) {
      var a = k.split(',');
      return [+a[0], +a[1]];
    }
    return {
      type: 'sq',
      keys: keys,
      w: cols,
      h: rows,
      has: function (k) {
        var q = p(k);
        return q[0] >= 0 && q[1] >= 0 && q[0] < cols && q[1] < rows;
      },
      verts: function (k) {
        var q = p(k);
        return [[q[0], q[1]], [q[0] + 1, q[1]], [q[0] + 1, q[1] + 1], [q[0], q[1] + 1]];
      },
      nb: function (k) {
        var q = p(k);
        return [[q[0] - 1, q[1]], [q[0] + 1, q[1]], [q[0], q[1] - 1], [q[0], q[1] + 1]].map(function (x) {
          return x[0] + ',' + x[1];
        });
      },
      centre: function (k) {
        var q = p(k);
        return [q[0] + 0.5, q[1] + 0.5];
      },
      parse: p,
    };
  }

  /** Triangle grid: row r, position i. Up-pointing when (r + i) is even. Side = 1. */
  function triGrid(rows, n) {
    var keys = [];
    for (var r = 0; r < rows; r++) for (var i = 0; i < n; i++) keys.push(r + ',' + i);
    function p(k) {
      var a = k.split(',');
      return [+a[0], +a[1]];
    }
    function up(r, i) {
      return ((r + i) % 2 + 2) % 2 === 0;
    }
    return {
      type: 'tri',
      keys: keys,
      w: (n + 1) / 2,
      h: rows * H3,
      up: up,
      has: function (k) {
        var q = p(k);
        return q[0] >= 0 && q[1] >= 0 && q[0] < rows && q[1] < n;
      },
      verts: function (k) {
        var q = p(k), r = q[0], i = q[1], x = i / 2;
        if (up(r, i)) return [[x, (r + 1) * H3], [x + 1, (r + 1) * H3], [x + 0.5, r * H3]];
        return [[x, r * H3], [x + 1, r * H3], [x + 0.5, (r + 1) * H3]];
      },
      nb: function (k) {
        var q = p(k), r = q[0], i = q[1];
        var out = [r + ',' + (i - 1), r + ',' + (i + 1)];
        out.push(up(r, i) ? r + 1 + ',' + i : r - 1 + ',' + i);
        return out;
      },
      centre: function (k) {
        var v = this.verts(k);
        return [(v[0][0] + v[1][0] + v[2][0]) / 3, (v[0][1] + v[1][1] + v[2][1]) / 3];
      },
      parse: p,
    };
  }

  /* ---------------------------------------------------------------- *
   * Pieces (stamps). cells(grid, anchor, rot) -> keys, or null if off the grid.
   * ---------------------------------------------------------------- */
  function rotOffsets(offs, rot) {
    var o = offs.map(function (x) { return x.slice(); });
    for (var k = 0; k < rot; k++) o = o.map(function (x) { return [-x[1], x[0]]; });
    o.sort(function (a, b) { return a[1] - b[1] || a[0] - b[0]; });
    var f = o[0];
    return o.map(function (x) { return [x[0] - f[0], x[1] - f[1]]; });
  }
  function sqStamp(id, name, offs, rots) {
    return {
      id: id,
      name: name,
      size: offs.length,
      rots: rots,
      cells: function (g, anchor, rot) {
        var a = g.parse(anchor);
        var out = rotOffsets(offs, rot || 0).map(function (x) { return a[0] + x[0] + ',' + (a[1] + x[1]); });
        for (var i = 0; i < out.length; i++) if (!g.has(out[i])) return null;
        return out;
      },
    };
  }
  var STAMPS = {
    sq1: sqStamp('sq1', 'square', [[0, 0]], 1),
    dom: sqStamp('dom', 'rectangle', [[0, 0], [1, 0]], 2),
    L4: sqStamp('L4', 'L shape', [[0, 0], [0, 1], [0, 2], [1, 2]], 4),
    sq4: sqStamp('sq4', 'big square', [[0, 0], [1, 0], [0, 1], [1, 1]], 1),
    tri1: {
      id: 'tri1',
      name: 'triangle',
      size: 1,
      rots: 1,
      cells: function (g, anchor) {
        return g.has(anchor) ? [anchor] : null;
      },
    },
    tri4: {
      id: 'tri4',
      name: 'big triangle',
      size: 4,
      rots: 1,
      cells: function (g, anchor) {
        var a = g.parse(anchor), r = a[0], i = a[1];
        var dr = g.up(r, i) ? 1 : -1;
        var out = [anchor, r + dr + ',' + (i - 1), r + dr + ',' + i, r + dr + ',' + (i + 1)];
        for (var k = 0; k < out.length; k++) if (!g.has(out[k])) return null;
        return out;
      },
    },
  };
  var BIG_OF = { sq1: 'sq4', dom: 'sq4', tri1: 'tri4' };

  /* ---------------------------------------------------------------- *
   * Placement rules shared by the builder, the solver and the checker
   * ---------------------------------------------------------------- */
  function occupied(pieces) {
    var occ = {};
    pieces.forEach(function (p) {
      p.cells.forEach(function (k) {
        occ[k] = true;
      });
    });
    return occ;
  }
  /** '' if ok, otherwise a reason. */
  function placeProblem(g, pieces, cells) {
    if (!cells) return 'off';
    var occ = occupied(pieces);
    for (var i = 0; i < cells.length; i++) if (occ[cells[i]]) return 'taken';
    if (!pieces.length) return '';
    var touch = cells.some(function (k) {
      return g.nb(k).some(function (n) {
        return occ[n];
      });
    });
    return touch ? '' : 'apart';
  }
  function centroidOf(g, keys) {
    var x = 0, y = 0;
    keys.forEach(function (k) {
      var c = g.centre(k);
      x += c[0];
      y += c[1];
    });
    return [x / keys.length, y / keys.length];
  }
  /** Choose placements of `stamp` until there are `total` pieces. random=0 → compact. */
  function solve(g, pieces, stamp, total, random) {
    var ps = pieces.slice();
    var plan = [];
    while (ps.length < total) {
      var all = [];
      ps.forEach(function (p) { all = all.concat(p.cells); });
      var cen = centroidOf(g, all);
      var best = null, bestS = Infinity;
      g.keys.forEach(function (k) {
        for (var rot = 0; rot < stamp.rots; rot++) {
          var cells = stamp.cells(g, k, rot);
          if (placeProblem(g, ps, cells)) continue;
          var s = 0;
          cells.forEach(function (c) {
            var q = g.centre(c);
            s += (q[0] - cen[0]) * (q[0] - cen[0]) + (q[1] - cen[1]) * (q[1] - cen[1]);
          });
          s += Math.random() * (random || 0.001);
          if (s < bestS) {
            bestS = s;
            best = { anchor: k, rot: rot, cells: cells, stamp: stamp.id };
          }
        }
      });
      if (!best) return null;
      ps.push(best);
      plan.push(best);
    }
    return plan;
  }

  /* ---------------------------------------------------------------- *
   * Drawing pieces
   * ---------------------------------------------------------------- */
  function vkey(v) {
    return Math.round(v[0] * 1000) + ':' + Math.round(v[1] * 1000);
  }
  function outlineEdges(g, cells) {
    var count = {}, seg = {};
    cells.forEach(function (k) {
      var v = g.verts(k);
      for (var i = 0; i < v.length; i++) {
        var a = v[i], b = v[(i + 1) % v.length];
        var ka = vkey(a), kb = vkey(b);
        var key = ka < kb ? ka + '|' + kb : kb + '|' + ka;
        count[key] = (count[key] || 0) + 1;
        seg[key] = [a, b];
      }
    });
    return Object.keys(count).filter(function (k) { return count[k] === 1; }).map(function (k) { return seg[k]; });
  }
  function polyPts(v, tx) {
    return v.map(function (q) {
      var t = tx(q);
      return t[0].toFixed(1) + ',' + t[1].toFixed(1);
    }).join(' ');
  }
  /** Draw pieces into a <g>. cls(piece, index) gives the fill class; numbers optional. */
  function drawPieces(gEl, g, pieces, tx, opts) {
    opts = opts || {};
    pieces.forEach(function (p, idx) {
      var pg = svg('g', { class: 'wp-piece ' + (opts.cls ? opts.cls(p, idx) : 'wp-new') });
      p.cells.forEach(function (k) {
        pg.appendChild(svg('polygon', { points: polyPts(g.verts(k), tx), class: 'wp-cellfill' }));
      });
      outlineEdges(g, p.cells).forEach(function (s) {
        var a = tx(s[0]), b = tx(s[1]);
        pg.appendChild(svg('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'wp-edge' }));
      });
      if (opts.numbers) {
        var cen = centroidOf(g, p.cells);
        var bestK = p.cells[0], bd = Infinity;
        p.cells.forEach(function (k) {
          var c = g.centre(k);
          var d = (c[0] - cen[0]) * (c[0] - cen[0]) + (c[1] - cen[1]) * (c[1] - cen[1]);
          if (d < bd) {
            bd = d;
            bestK = k;
          }
        });
        var at = tx(g.centre(bestK));
        pg.appendChild(svg('text', { x: at[0], y: at[1] + 6, 'text-anchor': 'middle', class: 'wp-num' }, String(idx + 1)));
      }
      gEl.appendChild(pg);
    });
  }
  /** A small picture of some pieces, fitted to its own box. */
  function miniPic(g, pieces, maxW, maxH, opts) {
    var xs = [], ys = [];
    pieces.forEach(function (p) {
      p.cells.forEach(function (k) {
        g.verts(k).forEach(function (v) {
          xs.push(v[0]);
          ys.push(v[1]);
        });
      });
    });
    var minX = Math.min.apply(null, xs), minY = Math.min.apply(null, ys);
    var bw = Math.max.apply(null, xs) - minX, bh = Math.max.apply(null, ys) - minY;
    var pad = 6;
    var k = Math.min((maxW - 2 * pad) / bw, (maxH - 2 * pad) / bh, (opts && opts.unit) || 1000);
    var W = bw * k + 2 * pad, Hh = bh * k + 2 * pad;
    var root = svg('svg', { viewBox: '0 0 ' + W.toFixed(1) + ' ' + Hh.toFixed(1), width: Math.round(W), height: Math.round(Hh), class: 'wp-mini', style: { maxWidth: '100%', height: 'auto' } });
    var gEl = svg('g');
    root.appendChild(gEl);
    drawPieces(gEl, g, pieces, function (v) { return [pad + (v[0] - minX) * k, pad + (v[1] - minY) * k]; }, opts);
    return root;
  }

  /* ---------------------------------------------------------------- *
   * The builder: click grid cells to stamp copies of a piece.
   * opts: grid, given (pieces), stamps (ids; first is the right size), d, onChange(info)
   * ---------------------------------------------------------------- */
  function builder(api, opts) {
    var g = opts.grid;
    var unit = g.type === 'sq' ? 38 : 50;
    var pad = 10;
    var W = g.w * unit + 2 * pad, Hh = g.h * unit + 2 * pad;
    function tx(v) {
      return [pad + v[0] * unit, pad + v[1] * unit];
    }
    var root = svg('svg', { viewBox: '0 0 ' + W.toFixed(1) + ' ' + Hh.toFixed(1), width: Math.round(W), height: Math.round(Hh), class: 'wp-grid', style: { maxWidth: '100%', height: 'auto' } });
    var gCells = svg('g', { class: 'wp-cells' });
    var gPieces = svg('g', { class: 'wp-pieces' });
    var gGhost = svg('g', { class: 'wp-ghost' });
    root.appendChild(gCells);
    root.appendChild(gPieces);
    root.appendChild(gGhost);
    var state = { stamp: opts.stamps[0], rot: 0, locked: false, hover: null };
    var given = opts.given.map(function (p) { return { cells: p.cells, stamp: p.stamp, given: true }; });
    var placed = [];

    g.keys.forEach(function (k) {
      var poly = svg('polygon', { points: polyPts(g.verts(k), tx), class: 'wp-cell', 'data-k': k });
      poly.addEventListener('pointerenter', function () {
        state.hover = k;
        ghost();
      });
      poly.addEventListener('click', function () {
        place(k);
      });
      gCells.appendChild(poly);
    });
    function onLeave() {
      state.hover = null;
      ghost();
    }
    root.addEventListener('pointerleave', onLeave);

    function all() {
      return given.concat(placed);
    }
    function ghost() {
      MQ.clear(gGhost);
      if (state.locked || !state.hover) return;
      var cells = STAMPS[state.stamp].cells(g, state.hover, state.rot);
      if (!cells) return;
      var bad = !!placeProblem(g, all(), cells);
      cells.forEach(function (k) {
        gGhost.appendChild(svg('polygon', { points: polyPts(g.verts(k), tx), class: bad ? 'wp-ghost-bad' : 'wp-ghost-ok' }));
      });
    }
    function draw() {
      MQ.clear(gPieces);
      drawPieces(gPieces, g, all(), tx, {
        numbers: true,
        cls: function (p) {
          return p.given ? 'wp-given' : p.stamp === opts.stamps[0] ? 'wp-new' : 'wp-big';
        },
      });
      counter.textContent = 'Pieces: ' + all().length;
      undoBtn.disabled = clearBtn.disabled = state.locked || !placed.length;
      ghost();
      if (opts.onChange) opts.onChange(info());
    }
    function place(k) {
      if (state.locked) return;
      var cells = STAMPS[state.stamp].cells(g, k, state.rot);
      var why = placeProblem(g, all(), cells);
      if (why) {
        api.feedback(why === 'apart' ? 'New pieces must touch the shape along a whole side.' : why === 'taken' ? 'That space is already used.' : 'That piece does not fit there. Try nearer the middle.', 'info');
        return;
      }
      placed.push({ cells: cells, stamp: state.stamp });
      api.sound('pop');
      draw();
    }
    function info() {
      var ps = all();
      return {
        total: ps.length,
        added: placed.length,
        wrongSize: placed.filter(function (p) { return p.stamp !== opts.stamps[0]; }).length,
      };
    }

    // side panel: piece tray, turn, undo, clear, counter
    var tray = el('div', { class: 'wp-tray' });
    var trayBtns = opts.stamps.map(function (id) {
      var b = el('button', { class: 'wp-stamp', type: 'button', 'data-stamp': id, 'aria-label': STAMPS[id].name });
      b.addEventListener('click', function () {
        if (state.locked) return;
        state.stamp = id;
        state.rot = 0;
        refreshTray();
      });
      tray.appendChild(b);
      return b;
    });
    var tg = g.type === 'sq' ? sqGrid(4, 4) : triGrid(3, 5);
    function refreshTray() {
      trayBtns.forEach(function (b, i) {
        var id = opts.stamps[i];
        MQ.clear(b);
        var cells = null;
        for (var t = 0; t < tg.keys.length && !cells; t++) cells = STAMPS[id].cells(tg, tg.keys[t], id === state.stamp ? state.rot : 0);
        b.appendChild(miniPic(tg, [{ cells: cells, stamp: id }], 90, 64, { unit: g.type === 'sq' ? 18 : 30, cls: function () { return 'wp-new'; } }));
        b.classList.toggle('wp-stamp-on', id === state.stamp);
      });
      turnBtn.hidden = STAMPS[state.stamp].rots < 2;
      ghost();
    }
    var turnBtn = el('button', { class: 'btn btn-ghost wp-small-btn wp-turn', type: 'button', onclick: function () {
      if (state.locked) return;
      state.rot = (state.rot + 1) % STAMPS[state.stamp].rots;
      refreshTray();
    } }, '↻ Turn');
    var undoBtn = el('button', { class: 'btn btn-ghost wp-small-btn wp-undo', type: 'button', onclick: function () {
      if (state.locked || !placed.length) return;
      placed.pop();
      draw();
    } }, '↶ Undo');
    var clearBtn = el('button', { class: 'btn btn-ghost wp-small-btn wp-clear', type: 'button', onclick: function () {
      if (state.locked) return;
      placed = [];
      draw();
    } }, '✕ Clear');
    var counter = el('div', { class: 'wp-counter' });
    var panel = el('div', { class: 'wp-panel' }, el('div', { class: 'wp-panel-label' }, opts.stamps.length > 1 ? 'Pick a piece:' : 'Your piece:'), tray, el('div', { class: 'wp-btnrow' }, turnBtn, undoBtn, clearBtn), counter);
    var wrap = el('div', { class: 'wp-builder' }, el('div', { class: 'wp-grid-box' }, root), panel);
    refreshTray();
    draw();
    api.cleanup(function () {
      root.removeEventListener('pointerleave', onLeave);
    });

    return {
      el: wrap,
      panel: panel,
      info: info,
      lock: function () {
        state.locked = true;
        wrap.classList.add('wp-locked');
        [turnBtn, undoBtn, clearBtn].concat(trayBtns).forEach(function (b) { b.disabled = true; });
        ghost();
      },
      /** First anchor where this piece can go now (used by the tests). */
      find: function (id) {
        for (var i = 0; i < g.keys.length; i++) {
          var cells = STAMPS[id].cells(g, g.keys[i], 0);
          if (!placeProblem(g, all(), cells)) return g.keys[i];
        }
        return null;
      },
      /** A compact whole made only of right-size pieces (from the given part). */
      plan: function () {
        return solve(g, given, STAMPS[opts.stamps[0]], opts.d, 0);
      },
      /** Show the right whole, adding pieces one at a time. */
      showWhole: function (done) {
        placed = [];
        var plan = solve(g, given, STAMPS[opts.stamps[0]], opts.d, 0) || [];
        state.locked = true;
        draw();
        plan.forEach(function (p, i) {
          api.later(function () {
            placed.push({ cells: p.cells, stamp: p.stamp });
            api.sound('pop');
            draw();
            if (i === plan.length - 1 && done) done();
          }, 450 * (i + 1));
        });
        if (!plan.length && done) done();
        wrap.classList.add('wp-locked');
        [turnBtn, undoBtn, clearBtn].concat(trayBtns).forEach(function (b) { b.disabled = true; });
      },
    };
  }

  /* ---------------------------------------------------------------- *
   * Question set-ups
   * ---------------------------------------------------------------- */
  /** Bolt's part: k pieces of the given kind, placed in the middle of a fresh grid. */
  function setup(kind, k) {
    var g, given = [];
    if (kind === 'tri1') {
      g = triGrid(6, 17);
      if (k === 1) given = [{ cells: ['2,8'], stamp: 'tri1' }];
      else given = [{ cells: ['2,8'], stamp: 'tri1' }, { cells: ['3,8'], stamp: 'tri1' }]; // a diamond
    } else {
      g = sqGrid(12, 8);
      var st = STAMPS[kind];
      if (kind === 'L4') given = [{ cells: st.cells(g, '5,2', 0), stamp: 'L4' }];
      else if (kind === 'dom') for (var i = 0; i < k; i++) given.push({ cells: st.cells(g, (5 - Math.floor(k / 2)) + i + ',3', 1), stamp: 'dom' });
      else for (var j = 0; j < k; j++) given.push({ cells: [(6 - Math.floor(k / 2)) + j + ',3'], stamp: 'sq1' });
    }
    given.forEach(function (p) {
      p.given = true;
    });
    return { g: g, given: given };
  }

  var PIECE_WORD = { sq1: 'squares', dom: 'rectangles', tri1: 'triangles', L4: 'L shapes' };

  var deck = null;

  function chooseAllQ() {
    var pool = [
      { kind: 'tri1', k: 2, d: 4 },
      { kind: 'sq1', k: 1, d: 3 },
      { kind: 'sq1', k: 2, d: 5 },
      { kind: 'tri1', k: 1, d: 3 },
    ];
    return U.pick(pool);
  }

  function buildDeck() {
    var q = [];
    // Level 1 (questions 1–3): 1/2 and 1/3, one piece kind each, one tray piece
    var kinds = U.shuffle(['sq1', 'dom', 'tri1']);
    var ds = U.shuffle([2, 3, U.pick([2, 3])]);
    for (var i = 0; i < 3; i++) q.push({ type: 'build', kind: kinds[i], k: 1, d: ds[i], stamps: [kinds[i]] });
    // Level 2 (4–6): 2/4 and 2/3; the tray also has a bigger piece
    var sqk = U.shuffle(['sq1', 'dom']);
    var l2 = [
      { type: 'build', kind: 'tri1', k: 2, d: 4 },
      { type: 'build', kind: sqk[0], k: 2, d: 3 },
      U.pick([{ type: 'build', kind: sqk[1], k: 2, d: 4 }, { type: 'build', kind: 'tri1', k: 2, d: 3 }]),
    ];
    U.shuffle(l2).forEach(function (x) {
      x.stamps = [x.kind, BIG_OF[x.kind]];
      q.push(x);
    });
    // Level 3 (7–9): strips (2/5 or 3/10), the L shape (1/3 or 1/5), which could be the whole?
    var strip = U.pick([{ k: 2, d: 5 }, { k: 3, d: 10 }]);
    var l3 = [
      { type: 'build', kind: 'sq1', k: strip.k, d: strip.d, stamps: ['sq1', 'sq4'], strip: true },
      { type: 'build', kind: 'L4', k: 1, d: U.pick([3, 5]), stamps: ['L4'] },
      Object.assign({ type: 'choose' }, chooseAllQ()),
    ];
    return q.concat(U.shuffle(l3.slice(0, 2)).concat([l3[2]]));
  }

  /* ---------------------------------------------------------------- *
   * Practice renderers
   * ---------------------------------------------------------------- */
  function renderBuild(stage, api, q) {
    var s = setup(q.kind, q.k);
    var word = PIECE_WORD[q.kind];
    var box = el('div', { class: 'wp-q', 'data-type': 'build', 'data-k': q.k, 'data-d': q.d });
    var partName = q.kind === 'L4' ? 'This L shape' : q.k === 1 ? 'This piece' : 'These ' + q.k + ' ' + word;
    box.appendChild(MQ.ui.prompt(partName + ' ' + (q.k === 1 ? 'is' : 'are') + ' ' + frac(q.k, q.d, 'wp-frac-inline') + ' of a shape. Build the whole shape.'));
    api.say(q.kind === 'L4' ? 'Stamp copies of the L shape to make the whole. Use Turn to spin it.' : 'The bottom number tells how many equal pieces the whole has.', 'think');
    var b = builder(api, { grid: s.g, given: s.given, stamps: q.stamps, d: q.d });
    var checkBtn = el('button', { class: 'btn wp-check', type: 'button' }, 'Check');
    b.panel.appendChild(checkBtn);
    box.appendChild(b.el);
    box.__wp = b;
    stage.appendChild(box);

    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var inf = b.info();
      var strong = api.tries() >= 1;
      if (!inf.added && q.k === 1) {
        api.feedback('Click the grid to add pieces next to Bolt\'s piece first.', 'info');
        return;
      }
      if (inf.wrongSize) {
        api.check(false, strong ? 'Every piece must be the same size as Bolt\'s. Undo the big piece and use the small one.' : 'Look at the sizes. Is every new piece the same as Bolt\'s piece?', TAG.size);
        return;
      }
      if (inf.total === q.d) {
        b.lock();
        checkBtn.disabled = true;
        api.check(true, 'Yes! ' + q.d + ' equal pieces make the whole. Bolt\'s part is ' + q.k + ' of them: ' + q.k + '/' + q.d + '.');
        return;
      }
      if (inf.total === q.k) {
        api.check(false, strong ? 'The bottom number is ' + q.d + ', so the whole has ' + q.d + ' pieces. You have ' + q.k + '. Add more and count on.' : 'Bolt\'s part is only ' + q.k + ' of the pieces. How many pieces does the whole need? Look at the bottom number.', TAG.numer);
      } else if (inf.total < q.d) {
        api.check(false, strong ? 'Count all the pieces: you have ' + inf.total + '. The whole needs ' + q.d + ', so add more.' : 'Count every piece, Bolt\'s too. The bottom number says how many the whole has.', TAG.count);
      } else {
        api.check(false, strong ? 'You have ' + inf.total + ' pieces, but the whole has ' + q.d + ', counting Bolt\'s pieces too. Use Undo.' : 'Too many! Count Bolt\'s pieces as part of the whole.', TAG.count);
      }
    });

    api.onReveal(function () {
      checkBtn.disabled = true;
      api.feedback('Watch: the bottom number is ' + q.d + ', so the whole needs ' + q.d + ' equal pieces. Bolt has ' + q.k + ', so we add pieces and count on to ' + q.d + '.', 'info');
      b.showWhole(function () {
        api.feedback(q.d + ' equal pieces = 1 whole. Bolt\'s ' + q.k + ' ' + (q.k === 1 ? 'piece is' : 'pieces are') + ' ' + q.k + '/' + q.d + ' of it. Other shapes with ' + q.d + ' equal pieces are right too!', 'info');
      });
    });
  }

  function canon(g, cells) {
    var ps = cells.map(g.parse);
    var m0 = Math.min.apply(null, ps.map(function (p) { return p[0]; }));
    var m1 = Math.min.apply(null, ps.map(function (p) { return p[1]; }));
    if (g.type === 'tri' && (m0 + m1) % 2) m1 -= 1;
    return ps.map(function (p) { return p[0] - m0 + ',' + (p[1] - m1); }).sort().join(';');
  }
  function dims(g, cells) {
    var xs = [], ys = [];
    cells.forEach(function (k) { g.verts(k).forEach(function (v) { xs.push(v[0]); ys.push(v[1]); }); });
    var a = Math.round((Math.max.apply(null, xs) - Math.min.apply(null, xs)) * 100), b = Math.round((Math.max.apply(null, ys) - Math.min.apply(null, ys)) * 100);
    return [Math.min(a, b), Math.max(a, b)].join('x');
  }

  /** Make the four pictures for "which could be the whole?". */
  function makeOptions(q) {
    var stamp = STAMPS[q.kind], big = STAMPS[BIG_OF[q.kind]];
    for (var tries = 0; tries < 300; tries++) {
      var s = setup(q.kind, q.k);
      var a = solve(s.g, s.given, stamp, q.d, 6);
      var b = solve(s.g, s.given, stamp, q.d, 6);
      if (!a || !b) continue;
      var wa = s.given.concat(a), wb = s.given.concat(b);
      var ca = wa.reduce(function (x, p) { return x.concat(p.cells); }, []);
      var cb = wb.reduce(function (x, p) { return x.concat(p.cells); }, []);
      if (canon(s.g, ca) === canon(s.g, cb) || dims(s.g, ca) === dims(s.g, cb)) continue;
      // wrong size: same number of pieces, but one is the big piece
      var w1 = solve(s.g, s.given, stamp, q.d - 1, 6);
      if (!w1) continue;
      var bigP = solve(s.g, s.given.concat(w1), big, q.d, 3);
      if (!bigP) continue;
      // wrong count: only the top number of pieces (or one too many when the top is 1)
      var wcN = q.k >= 2 ? q.k : q.d + 1;
      var wc = wcN > q.k ? solve(s.g, s.given, stamp, wcN, 6) : [];
      if (!wc) continue;
      return {
        g: s.g,
        given: s.given,
        opts: [
          { id: 'a', ok: true, pieces: wa },
          { id: 'b', ok: true, pieces: wb },
          { id: 'big', ok: false, pieces: s.given.concat(w1, bigP), tag: TAG.size },
          { id: 'count', ok: false, pieces: s.given.concat(wc), tag: wcN === q.k ? TAG.numer : TAG.count, n: wcN },
        ],
      };
    }
    return null;
  }

  function renderChoose(stage, api, q) {
    var made = makeOptions(q);
    if (!made) {
      q = { type: 'choose', kind: 'sq1', k: 1, d: 3 };
      made = makeOptions(q);
    }
    var word = PIECE_WORD[q.kind];
    var box = el('div', { class: 'wp-q', 'data-type': 'choose', 'data-k': q.k, 'data-d': q.d });
    api.say('More than one could be right! Pick every whole that works.', 'think');
    box.appendChild(MQ.ui.prompt('Bolt\'s part is ' + frac(q.k, q.d, 'wp-frac-inline') + ' of a shape. Which could be the <b>whole</b>? Pick <b>all</b> that work.'));
    var partPic = miniPic(made.g, made.given, 140, 100, { unit: 38, cls: function () { return 'wp-given'; } });
    box.appendChild(el('div', { class: 'wp-part-box' }, el('div', { class: 'wp-part-label' }, 'Bolt\'s part'), partPic));
    var order = U.shuffle(made.opts);
    var picked = {};
    var cards = order.map(function (o) {
      var pic = miniPic(made.g, o.pieces, 180, 130, {
        unit: 38,
        numbers: false,
        cls: function (p) {
          return p.given ? 'wp-given' : p.stamp === q.kind ? 'wp-new' : 'wp-big';
        },
      });
      var card = el('button', { class: 'wp-card', type: 'button', 'data-id': o.id, 'data-ok': o.ok ? '1' : '' }, pic, el('span', { class: 'wp-card-tick' }, '✓'));
      card.addEventListener('click', function () {
        if (api.isAnswered()) return;
        picked[o.id] = !picked[o.id];
        card.classList.toggle('wp-card-on', !!picked[o.id]);
        api.sound('click');
      });
      return card;
    });
    box.appendChild(el('div', { class: 'wp-cards' }, cards));
    var checkBtn = el('button', { class: 'btn wp-check', type: 'button' }, 'Check');
    box.appendChild(checkBtn);
    stage.appendChild(box);

    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var ids = Object.keys(picked).filter(function (k) { return picked[k]; });
      if (!ids.length) {
        api.feedback('Click the pictures that could be the whole, then press Check.', 'info');
        return;
      }
      var strong = api.tries() >= 1;
      var bad = ids.filter(function (id) { return id === 'big' || id === 'count'; });
      if (!bad.length && ids.length === 2) {
        cards.forEach(function (c) { c.disabled = true; if (c.getAttribute('data-ok')) c.classList.add('wp-card-good'); });
        api.check(true, 'Yes! Both have ' + q.d + ' equal ' + word + '. A whole can look different and still be right.');
        return;
      }
      if (bad.indexOf('big') !== -1) {
        api.check(false, strong ? 'One picture has a big piece. All ' + q.d + ' pieces must be the same size as Bolt\'s.' : 'Check the sizes. Are all the pieces in your pictures the same as Bolt\'s?', TAG.size);
      } else if (bad.indexOf('count') !== -1) {
        var n = made.opts[3].n;
        api.check(false, strong ? 'Count the pieces: one picture has ' + n + '. The whole must have ' + q.d + ' (the bottom number).' : 'Count the pieces in each picture you chose. The whole needs ' + q.d + '.', made.opts[3].tag);
      } else {
        api.check(false, strong ? 'There are TWO right answers. Look for another whole with ' + q.d + ' equal ' + word + '.' : 'Good, but there is more than one right answer. Look again!', TAG.only);
      }
    });

    api.onReveal(function () {
      checkBtn.disabled = true;
      cards.forEach(function (c) {
        c.disabled = true;
        c.classList.remove('wp-card-on');
        var id = c.getAttribute('data-id');
        c.classList.add(c.getAttribute('data-ok') ? 'wp-card-good' : 'wp-card-bad');
        var o = made.opts.filter(function (x) { return x.id === id; })[0];
        c.appendChild(el('span', { class: 'wp-card-note' }, o.ok ? q.d + ' equal pieces ✓' : id === 'big' ? 'a big piece ✗' : o.n + ' pieces ✗'));
      });
      api.feedback('The whole needs ' + q.d + ' pieces, all the same size as Bolt\'s. Two pictures do that, so both are right.', 'info');
    });
  }

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */
  function posterCards() {
    // 1/3 four ways. Each: grid model + 3 pieces (first one shaded).
    var tg = triGrid(1, 3);
    var sg = sqGrid(3, 2);
    var cards = [];
    cards.push({ g: tg, pieces: [{ cells: ['0,0'] }, { cells: ['0,1'] }, { cells: ['0,2'] }] });
    cards.push({ g: sg, pieces: [{ cells: ['0,0'] }, { cells: ['1,0'] }, { cells: ['2,0'] }] });
    cards.push({ hex: true });
    cards.push({ g: sg, pieces: [{ cells: ['0,1'] }, { cells: ['1,1'] }, { cells: ['1,0'] }] });
    return cards;
  }
  function hexPic(numbers) {
    var R = 26, w = Math.sqrt(3) * R, pad = 6;
    var root = svg('svg', { viewBox: '0 0 ' + (3 * w + 2 * pad) + ' ' + (2 * R + 2 * pad), width: Math.round(3 * w + 2 * pad), height: 2 * R + 2 * pad, class: 'wp-mini', style: { maxWidth: '100%', height: 'auto' } });
    for (var i = 0; i < 3; i++) {
      var cx = pad + w / 2 + i * w, cy = pad + R;
      var pts = [];
      for (var k = 0; k < 6; k++) {
        var a = ((-90 + 60 * k) * Math.PI) / 180;
        pts.push((cx + R * Math.cos(a)).toFixed(1) + ',' + (cy + R * Math.sin(a)).toFixed(1));
      }
      var gp = svg('g', { class: 'wp-piece ' + (i === 0 ? 'wp-given' : 'wp-plain') }, svg('polygon', { points: pts.join(' '), class: 'wp-cellfill wp-hex' }));
      if (numbers) gp.appendChild(svg('text', { x: cx, y: cy + 6, 'text-anchor': 'middle', class: 'wp-num' }, String(i + 1)));
      root.appendChild(gp);
    }
    return root;
  }

  var WHOLES4 = [
    ['0,2', '1,1', '1,2', '1,3'], // big triangle
    ['0,0', '0,1', '0,2', '0,3'], // long parallelogram
    ['0,0', '0,1', '0,2', '1,2'], // a different 4-triangle shape
  ];

  MQ.register('whole-from-part', {
    learn: [
      // 1. Same fraction, different shapes
      function (stage, api) {
        api.lockNext();
        api.say('Bolt made a one-third poster. Click each picture to count its parts.');
        stage.appendChild(MQ.ui.lesson('One-third, four ways', 'Click every picture.'));
        var seen = 0;
        var row = el('div', { class: 'wp-poster' });
        posterCards().forEach(function (c) {
          function pic(numbers) {
            if (c.hex) return hexPic(numbers);
            return miniPic(c.g, c.pieces, 170, 90, { unit: 52, numbers: numbers, cls: function (p, i) { return i === 0 ? 'wp-given' : 'wp-plain'; } });
          }
          var holder = el('div', { class: 'wp-poster-pic' }, pic(false));
          var cap = el('div', { class: 'wp-poster-cap' }, '?');
          var card = el('button', { class: 'wp-poster-card', type: 'button' }, holder, cap);
          card.addEventListener('click', function () {
            if (card.done) return;
            card.done = true;
            MQ.clear(holder);
            holder.appendChild(pic(true));
            cap.innerHTML = '1 of 3 equal parts = ' + frac(1, 3);
            card.classList.add('wp-poster-done');
            api.sound('pop');
            seen++;
            if (seen === 4) {
              api.say('Triangles, squares, hexagons: each time 1 of 3 equal parts. All one-third!', 'cheer');
              api.feedback('One-third means 1 of 3 <b>equal</b> parts, whatever the shape.', 'good');
              api.unlockNext();
            }
          });
          row.appendChild(card);
        });
        stage.appendChild(row);
      },

      // 2. Part to whole
      function (stage, api) {
        api.lockNext();
        api.say('These 2 triangles are 2/4 of a shape. The whole has 4 triangles. Add 2 more!');
        stage.appendChild(MQ.ui.prompt('These 2 triangles are ' + frac(2, 4, 'wp-frac-inline') + ' of a shape. Click the grid to add triangles.'));
        var s = setup('tri1', 2);
        var finished = false;
        var b = builder(api, {
          grid: s.g,
          given: s.given,
          stamps: ['tri1'],
          d: 4,
          onChange: function (inf) {
            if (finished) return;
            if (inf.total === 4) {
              finished = true;
              b.lock();
              api.say('4 equal triangles: that is the whole shape! Bolt\'s 2 are 2/4 of it.', 'cheer');
              api.feedback('The bottom number 4 told us the whole has <b>4 equal pieces</b>.', 'good');
              api.unlockNext();
            }
          },
        });
        var box = el('div', { class: 'wp-q', 'data-type': 'learn-build', 'data-k': 2, 'data-d': 4 }, b.el);
        box.__wp = b;
        stage.appendChild(box);
      },

      // 3. More than one answer
      function (stage, api) {
        api.lockNext();
        api.say('Here are three wholes. Click each one to count its triangles.');
        stage.appendChild(MQ.ui.lesson('More than one answer', 'Each whole must have 4 equal triangles.'));
        var g = triGrid(2, 5);
        var seen = 0;
        var row = el('div', { class: 'wp-poster' });
        WHOLES4.forEach(function (cells) {
          var pieces = cells.map(function (k) { return { cells: [k] }; });
          function pic(numbers) {
            return miniPic(g, pieces, 190, 110, { unit: 60, numbers: numbers, cls: function () { return 'wp-new'; } });
          }
          var holder = el('div', { class: 'wp-poster-pic' }, pic(false));
          var cap = el('div', { class: 'wp-poster-cap' }, '?');
          var card = el('button', { class: 'wp-poster-card', type: 'button' }, holder, cap);
          card.addEventListener('click', function () {
            if (card.done) return;
            card.done = true;
            MQ.clear(holder);
            holder.appendChild(pic(true));
            cap.textContent = '4 equal triangles ✓';
            card.classList.add('wp-poster-done');
            api.sound('pop');
            seen++;
            if (seen === WHOLES4.length) {
              api.say('All three have 4 equal triangles, so all three are right!', 'cheer');
              api.feedback('A whole can have different shapes. It just needs the right number of <b>equal</b> pieces.', 'good');
              api.unlockNext();
            }
          });
          row.appendChild(card);
        });
        stage.appendChild(row);
      },
    ],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'build') renderBuild(stage, api, q);
        else renderChoose(stage, api, q);
      },
    },
  });

  // exposed for tests only
  MQ.dev_wp = { buildDeck: buildDeck, setup: setup, solve: solve, STAMPS: STAMPS, makeOptions: makeOptions, placeProblem: placeProblem };

  var css = [
    '.wp-q{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.wp-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;font-weight:800;margin:0 3px}',
    '.wp-frac .wp-fn{padding:0 4px}',
    '.wp-frac .wp-fd{border-top:3px solid currentColor;padding:1px 4px 0}',
    '.wp-frac-inline{font-size:1.3rem;color:#0b6e66}',
    '.wp-builder{display:flex;gap:18px;align-items:flex-start;justify-content:center;flex-wrap:wrap;width:100%}',
    '.wp-grid-box{min-width:0;max-width:100%;display:flex;justify-content:center}',
    '.wp-grid{display:block;touch-action:manipulation;user-select:none}',
    '.wp-cell{fill:#fff;stroke:#c9d3ee;stroke-width:1.2;cursor:pointer}',
    '.wp-locked .wp-cell{cursor:default}',
    '.wp-ghost polygon{pointer-events:none}',
    '.wp-ghost-ok{fill:rgba(66,165,245,.35);stroke:#1e88e5;stroke-width:2;stroke-dasharray:5 4}',
    '.wp-ghost-bad{fill:rgba(239,83,80,.18);stroke:#e57373;stroke-width:2;stroke-dasharray:5 4}',
    '.wp-piece{pointer-events:none}',
    '.wp-cellfill{stroke:none}',
    '.wp-given .wp-cellfill{fill:#ffb35c;stroke:#ffb35c;stroke-width:1}',
    '.wp-new .wp-cellfill,.wp-big .wp-cellfill{fill:#9fd0ff;stroke:#9fd0ff;stroke-width:1}',
    '.wp-plain .wp-cellfill{fill:#ffffff}',
    '.wp-hex{stroke:#3d4a6b !important;stroke-width:2.5}',
    '.wp-edge{stroke:#3d4a6b;stroke-width:2.5;stroke-linecap:round}',
    '.wp-num{font-weight:800;font-size:17px;fill:#1b2a4a}',
    '.wp-panel{display:flex;flex-direction:column;align-items:center;gap:10px;min-width:200px;max-width:100%}',
    '.wp-panel-label{font-weight:800;color:var(--ink-soft)}',
    '.wp-tray{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.wp-stamp{display:flex;align-items:center;justify-content:center;min-width:96px;min-height:76px;padding:6px;border-radius:14px;border:3px solid var(--line);background:#fff;cursor:pointer}',
    '.wp-stamp-on{border-color:#1e88e5;box-shadow:0 0 0 3px #cfe6ff}',
    '.wp-stamp:disabled{cursor:default;opacity:.7}',
    '.wp-btnrow{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.wp-small-btn{min-height:42px;padding:6px 12px;font-size:.95rem}',
    '.wp-counter{font-weight:800;font-size:1.2rem}',
    '.wp-check{min-width:130px}',
    '.wp-part-box{display:flex;align-items:center;gap:12px;background:#fff7ec;border:2px dashed #ffb35c;border-radius:14px;padding:6px 14px}',
    '.wp-part-label{font-weight:800;color:#9a5a00}',
    '.wp-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;width:100%;max-width:820px}',
    '.wp-card{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;min-height:140px;padding:10px;border-radius:14px;border:3px solid var(--line);background:#fff;cursor:pointer;font:inherit;color:var(--ink)}',
    '.wp-card:hover:not(:disabled){border-color:var(--accent)}',
    '.wp-card-on{border-color:#1e88e5;background:#eef6ff}',
    '.wp-card-tick{position:absolute;top:6px;right:8px;width:26px;height:26px;border-radius:50%;border:2px solid var(--line);color:transparent;font-weight:800;line-height:22px;text-align:center}',
    '.wp-card-on .wp-card-tick{background:#1e88e5;border-color:#1e88e5;color:#fff}',
    '.wp-card-good{border-color:var(--good);background:var(--good-bg)}',
    '.wp-card-bad{border-color:var(--try);background:var(--try-bg)}',
    '.wp-card-note{font-weight:800;font-size:.9rem}',
    '.wp-poster{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;width:100%;max-width:860px}',
    '.wp-poster-card{display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px;border-radius:14px;border:3px solid var(--line);background:#fff;cursor:pointer;font:inherit;color:var(--ink)}',
    '.wp-poster-card:hover{border-color:var(--accent)}',
    '.wp-poster-done{border-color:var(--good);background:var(--good-bg);cursor:default}',
    '.wp-poster-pic{min-height:96px;display:flex;align-items:center;justify-content:center}',
    '.wp-poster-cap{font-weight:800;font-size:1.05rem;display:flex;align-items:center;gap:4px;min-height:44px}',
    '.wp-poster-cap .wp-frac{font-size:1.15rem}',
    '@media (max-width:760px){.wp-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'whole-from-part' }, css));
})();

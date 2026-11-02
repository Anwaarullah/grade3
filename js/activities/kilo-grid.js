/* Make a Kilogram — drag weight tiles so each row totals exactly 1000 g (Unit 13.1 Mass). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var KG = 1000;
  var SLOT_W = 112;
  var SLOT_H = 64;
  var TILE_W = 104;
  var TILE_H = 56;
  // Strip segment colours and the matching light tint for tiles sitting in that slot.
  var SEG = ['#74c0fc', '#ffc078', '#8ce99a'];
  var TINT = ['#e3f2ff', '#fff0de', '#e3f9e5'];

  // Book-style set: the only split into three 1 kg rows is {700,250,50} {500,300,200} {450,400,150}.
  var BOOK_SET = [200, 250, 150, 300, 400, 500, 450, 700, 50];
  // Challenge set: rows AND columns can all be 1 kg.
  var CHALLENGE_GRID = [
    [50, 350, 600],
    [450, 400, 150],
    [500, 250, 250],
  ];

  function sum(a) {
    return a.reduce(function (s, v) {
      return s + v;
    }, 0);
  }

  /* ------------------------------------------------------------------ *
   * Question generators (pure, so they can be tested in node)
   * ------------------------------------------------------------------ */

  // Level 1: two tiles placed (multiples of 100), pick the missing tile from 3.
  function genLevel1(used) {
    for (var guard = 0; guard < 500; guard++) {
      var a = U.rand(1, 6) * 100;
      var b = U.rand(1, 6) * 100;
      var c = KG - a - b;
      if (c < 200 || c > 700 || a === b) continue;
      var key = 'L1:' + [a, b].sort().join('+');
      if (used[key]) continue;
      // Distractors: one hundred out either way, or the 50/500 mix-up.
      var pool = [c + 100, c - 100, c + 200, c - 200].filter(function (v) {
        return v >= 100 && v <= 900;
      });
      if (c === 500) pool.push(50);
      var opts = [c].concat(U.shuffle(pool).slice(0, 2));
      used[key] = true;
      return { type: 'one', fixed: [a, b], missing: c, options: U.shuffle(opts), gap: U.rand(0, 2) };
    }
    return null;
  }

  // Level 2: one tile placed (an odd multiple of 50), choose two of 5 tiles to complete 1000 g.
  // Exactly one pair in the tray works.
  function genLevel2(used) {
    for (var guard = 0; guard < 2000; guard++) {
      var p = U.pick([150, 250, 350, 450, 550, 650]);
      if (used['L2:' + p]) continue;
      var r = KG - p; // e.g. 550
      var a = U.rand(1, r / 50 - 1) * 50;
      var b = r - a;
      if (a === b || a < 50 || b < 50 || a === p || b === p) continue;
      var cand = [a + 50, a - 50, b + 50, b - 50, a + 100, b - 100, a + 150, b + 150];
      for (var v = 50; v <= 800; v += 50) cand.push(v);
      cand = U.shuffle(cand.slice(0, 6)).concat(U.shuffle(cand.slice(6)));
      var tray = [a, b];
      for (var i = 0; i < cand.length && tray.length < 5; i++) {
        var d = cand[i];
        if (d < 50 || d > 800 || tray.indexOf(d) !== -1) continue;
        var bad = tray.some(function (t) {
          return t + d === r;
        });
        if (bad || d * 2 === r) continue;
        tray.push(d);
      }
      if (tray.length < 5) continue;
      used['L2:' + p] = true;
      return { type: 'two', fixed: p, pair: [a, b], tray: U.shuffle(tray) };
    }
    return null;
  }

  // Level 3a: all nine book tiles; every ROW must be 1000 g.
  function genRows() {
    return { type: 'grid', cols: false, tiles: BOOK_SET.slice().sort(function (x, y) { return y - x; }), fixed: [null, null, null, null, null, null, null, null, null] };
  }

  // Level 3b: rows AND columns. Shuffle the known solution (row/column order, maybe flip), pre-place row 1.
  function genRowsCols() {
    var g = CHALLENGE_GRID.map(function (r) {
      return r.slice();
    });
    if (Math.random() < 0.5) g = [0, 1, 2].map(function (c) {
      return g.map(function (row) {
        return row[c];
      });
    });
    var ro = U.shuffle([0, 1, 2]);
    var co = U.shuffle([0, 1, 2]);
    g = ro.map(function (r) {
      return co.map(function (c) {
        return g[r][c];
      });
    });
    var fixed = [];
    var rest = [];
    g.forEach(function (row, r) {
      row.forEach(function (v) {
        if (r === 0) fixed.push(v);
        else {
          fixed.push(null);
          rest.push(v);
        }
      });
    });
    var q = { type: 'grid', cols: true, tiles: rest.sort(function (x, y) { return y - x; }), fixed: fixed };
    return solveGrid(q.tiles, q.fixed, true) ? q : genRowsCols();
  }

  function buildDeck() {
    var used = {};
    var d = [];
    for (var i = 0; i < 3; i++) d.push(genLevel1(used));
    for (var j = 0; j < 3; j++) d.push(genLevel2(used));
    d.push(genRows());
    d.push(genRowsCols());
    return d;
  }

  /** Brute force: fill the empty cells of a 3x3 grid with `tiles` so rows (and cols) are 1000. */
  function solveGrid(tiles, fixed, cols) {
    var cells = fixed.slice();
    var free = [];
    cells.forEach(function (v, i) {
      if (v == null) free.push(i);
    });
    var left = tiles.slice();
    function rowOk(r) {
      var s = 0;
      for (var c = 0; c < 3; c++) {
        if (cells[r * 3 + c] == null) return sum3partial(r) < KG;
        s += cells[r * 3 + c];
      }
      return s === KG;
    }
    function sum3partial(r) {
      var s = 0;
      for (var c = 0; c < 3; c++) s += cells[r * 3 + c] || 0;
      return s;
    }
    function colsOk() {
      for (var c = 0; c < 3; c++) if (cells[c] + cells[3 + c] + cells[6 + c] !== KG) return false;
      return true;
    }
    function go(k) {
      if (k === free.length) return !cols || colsOk();
      var cell = free[k];
      var tried = {};
      for (var i = 0; i < left.length; i++) {
        var v = left[i];
        if (v == null || tried[v]) continue;
        tried[v] = true;
        cells[cell] = v;
        left[i] = null;
        if (rowOk(Math.floor(cell / 3)) && go(k + 1)) return true;
        left[i] = v;
        cells[cell] = null;
      }
      return false;
    }
    return go(0) ? cells : null;
  }

  /* ------------------------------------------------------------------ *
   * The board: slots, draggable tiles, a 1000 g strip or row totals
   * ------------------------------------------------------------------ */

  /**
   * cfg: { w, h, slots: [{x, y, row, col, fixed}], tray: [{value, x, y}],
   *        strip: {x, y, w, h} | null, rowTotals: bool, colTotals: bool,
   *        totalText: {x, y} | null, onChange(board) }
   */
  function makeBoard(api, cfg) {
    var root = svg('svg', { class: 'kgr-svg', viewBox: '0 0 ' + cfg.w + ' ' + cfg.h, role: 'img', 'aria-label': 'Weight tiles and boxes' });
    var base = svg('g');
    var info = svg('g');
    var tileLayer = svg('g');
    root.appendChild(base);
    root.appendChild(info);
    root.appendChild(tileLayer);
    var locked = false;
    var tiles = [];
    var slots = cfg.slots.map(function (s, i) {
      var o = { x: s.x, y: s.y, row: s.row || 0, col: s.col != null ? s.col : i, tile: null, index: i };
      base.appendChild(svg('rect', { class: 'kgr-slot', x: s.x, y: s.y, width: SLOT_W, height: SLOT_H, rx: 12 }));
      return o;
    });
    cfg.tray.forEach(function (t) {
      base.appendChild(svg('rect', { class: 'kgr-home', x: t.x - 2, y: t.y - 2, width: TILE_W + 4, height: TILE_H + 4, rx: 12 }));
    });

    function tileTint(t) {
      if (!t.slot) return '#fff';
      return cfg.strip ? TINT[t.slot.index % 3] : t.fixed ? '#eef1f6' : '#fff';
    }

    function makeTile(value, home, fixed) {
      var g = svg('g', { class: 'kgr-tile' + (fixed ? ' kgr-fixed' : ''), tabindex: fixed ? null : '0', role: fixed ? null : 'button', 'aria-label': value + ' grams' });
      var body = svg('rect', { class: 'kgr-tile-body', x: 0, y: 6, width: TILE_W, height: TILE_H - 6, rx: 10 });
      g.appendChild(svg('rect', { class: 'kgr-knob', x: TILE_W / 2 - 14, y: 0, width: 28, height: 12, rx: 5 }));
      g.appendChild(body);
      g.appendChild(svg('text', { class: 'kgr-tile-text', x: TILE_W / 2, y: 40, 'text-anchor': 'middle', text: value + ' g' }));
      var t = { value: value, home: home, slot: null, fixed: !!fixed, g: g, body: body };
      tiles.push(t);
      tileLayer.appendChild(g);
      return t;
    }

    function posOf(t) {
      return t.slot ? { x: t.slot.x + (SLOT_W - TILE_W) / 2, y: t.slot.y + (SLOT_H - TILE_H) / 2 } : t.home;
    }
    function moveTo(t, x, y) {
      t.g.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    }
    function settle(t) {
      var p = posOf(t);
      moveTo(t, p.x, p.y);
      t.body.setAttribute('fill', tileTint(t));
      t.g.classList.toggle('kgr-in', !!t.slot);
    }
    function put(t, slot) {
      if (t.slot) t.slot.tile = null;
      t.slot = slot || null;
      if (slot) slot.tile = t;
    }

    // Fixed tiles sit in their slots and cannot move.
    cfg.slots.forEach(function (s, i) {
      if (s.fixed != null) {
        var t = makeTile(s.fixed, null, true);
        put(t, slots[i]);
        settle(t);
      }
    });

    function changed() {
      redrawInfo();
      if (cfg.onChange) cfg.onChange(board);
    }

    // Click / Enter: tray tile -> next empty slot; slot tile -> back to the tray.
    function tap(t) {
      if (locked || t.fixed) return;
      if (t.slot) put(t, null);
      else {
        var empty = slots.filter(function (s) {
          return !s.tile;
        })[0];
        if (!empty) {
          api.feedback('All the boxes are full. Click a tile in a box to send it back.', 'info');
          return;
        }
        put(t, empty);
      }
      api.sound('pop');
      settle(t);
      changed();
    }

    function drop(t, p) {
      var target = null;
      var best = 1e9;
      slots.forEach(function (s) {
        var cx = s.x + SLOT_W / 2;
        var cy = s.y + SLOT_H / 2;
        var d = Math.abs(p.x - cx) / SLOT_W + Math.abs(p.y - cy) / SLOT_H;
        if (d < 0.9 && d < best) {
          best = d;
          target = s;
        }
      });
      if (target && target.tile && target.tile.fixed) target = null;
      if (target === t.slot) {
        settle(t);
        return;
      }
      var from = t.slot;
      if (target && target.tile) {
        var other = target.tile;
        put(other, null);
        put(t, target);
        if (from) put(other, from);
        settle(other);
      } else put(t, target);
      api.sound('pop');
      settle(t);
      changed();
    }

    function addMovable(value, home) {
      var t = makeTile(value, home, false);
      settle(t);
      var start = null;
      var moved = false;
      api.cleanup(
        MQ.ui.drag(root, t.g, {
          start: function () {
            if (locked) return;
            start = posOf(t);
            moved = false;
          },
          move: function (p, dx, dy) {
            if (locked || !start) return;
            if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
            moveTo(t, start.x + dx, start.y + dy);
          },
          end: function (p) {
            if (locked || !start) return;
            start = null;
            if (!moved) {
              settle(t);
              tap(t);
            } else drop(t, p);
            tileLayer.appendChild(t.g); // keep the last-moved tile on top (after the pointer is released)
          },
        })
      );
      t.g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          tap(t);
        }
      });
      return t;
    }
    cfg.tray.forEach(function (h) {
      addMovable(h.value, { x: h.x, y: h.y });
    });

    function rowValues(r) {
      return slots
        .filter(function (s) {
          return s.row === r && s.tile;
        })
        .map(function (s) {
          return s.tile.value;
        });
    }
    function rowCount(r) {
      return slots.filter(function (s) {
        return s.row === r;
      }).length;
    }
    function colValues(c) {
      return slots
        .filter(function (s) {
          return s.col === c && s.tile;
        })
        .map(function (s) {
          return s.tile.value;
        });
    }

    var gapLabel = null; // text shown in the empty part of the strip (null = '?')

    function drawStrip() {
      var S = cfg.strip;
      var k = S.w / KG;
      var x = S.x;
      var total = 0;
      info.appendChild(svg('rect', { class: 'kgr-strip-bg', x: S.x, y: S.y, width: S.w, height: S.h, rx: 6 }));
      slots.forEach(function (s) {
        if (!s.tile) return;
        var w = s.tile.value * k;
        var maxX = cfg.w - 8;
        var drawW = Math.max(0, Math.min(w, maxX - x));
        var over = x + w > S.x + S.w;
        info.appendChild(svg('rect', { class: 'kgr-seg', x: x, y: S.y, width: drawW, height: S.h, fill: SEG[s.index % 3], stroke: '#fff', 'stroke-width': 2 }));
        if (over) {
          var ox = Math.max(x, S.x + S.w);
          info.appendChild(svg('rect', { class: 'kgr-over', x: ox, y: S.y, width: Math.max(0, x + drawW - ox), height: S.h }));
        }
        if (drawW >= 44) info.appendChild(svg('text', { class: 'kgr-seg-text', x: x + Math.min(w, drawW) / 2, y: S.y + S.h / 2 + 7, 'text-anchor': 'middle', text: s.tile.value + ' g' }));
        x += w;
        total += s.tile.value;
      });
      if (total < KG) {
        var gx = S.x + total * k;
        info.appendChild(svg('rect', { class: 'kgr-gap', x: gx + 2, y: S.y + 2, width: S.w - total * k - 4, height: S.h - 4, rx: 4 }));
        var lab = gapLabel != null ? gapLabel : '?';
        info.appendChild(svg('text', { class: 'kgr-gap-text', x: gx + (S.w - total * k) / 2, y: S.y + S.h / 2 + 8, 'text-anchor': 'middle', text: lab }));
      }
      // Ten 100 g pieces drawn on top so they can be counted.
      for (var i = 0; i < 10; i++) {
        info.appendChild(svg('rect', { class: 'kgr-piece', x: S.x + i * 100 * k, y: S.y, width: 100 * k, height: S.h }));
      }
      info.appendChild(svg('rect', { class: 'kgr-strip-edge' + (total === KG ? ' kgr-full' : ''), x: S.x, y: S.y, width: S.w, height: S.h, rx: 6 }));
      info.appendChild(svg('text', { class: 'kgr-scale', x: S.x, y: S.y - 8, 'text-anchor': 'middle', text: '0 g' }));
      info.appendChild(svg('text', { class: 'kgr-scale kgr-scale-end', x: S.x + S.w, y: S.y - 8, 'text-anchor': 'middle', text: '1000 g = 1 kg' }));
      if (total > KG) {
        info.appendChild(svg('text', { class: 'kgr-over-text', x: Math.min(cfg.w - 6, S.x + S.w + 8), y: S.y + S.h + 22, 'text-anchor': 'end', text: (total - KG) + ' g too much' }));
      }
    }

    function totalClass(t, full) {
      if (t === KG) return ' kgr-ok';
      if (t > KG) return ' kgr-heavy';
      return full ? ' kgr-light' : '';
    }

    function redrawInfo() {
      MQ.clear(info);
      if (cfg.strip) drawStrip();
      if (cfg.totalText) {
        var t = sum(rowValues(0));
        info.appendChild(svg('text', { class: 'kgr-total' + totalClass(t, rowValues(0).length === rowCount(0)), x: cfg.totalText.x, y: cfg.totalText.y, text: '= ' + t + ' g' }));
      }
      if (cfg.rowTotals) {
        for (var r = 0; r < 3; r++) {
          var vals = rowValues(r);
          var tot = sum(vals);
          var full = vals.length === 3;
          var y0 = slots[r * 3].y;
          var bx = cfg.rowTotals.x;
          var bw = cfg.rowTotals.w;
          info.appendChild(svg('text', { class: 'kgr-rt' + totalClass(tot, full), x: bx, y: y0 + 26, text: '= ' + tot + ' g' + (tot === KG ? ' ✓' : '') }));
          info.appendChild(svg('rect', { class: 'kgr-mini-bg', x: bx, y: y0 + 38, width: bw, height: 16, rx: 4 }));
          var fw = (Math.min(tot, KG) / KG) * bw;
          info.appendChild(svg('rect', { class: 'kgr-mini' + totalClass(tot, full), x: bx, y: y0 + 38, width: fw, height: 16, rx: 4 }));
          for (var i = 1; i < 10; i++) info.appendChild(svg('line', { class: 'kgr-mini-tick', x1: bx + (i * bw) / 10, x2: bx + (i * bw) / 10, y1: y0 + 38, y2: y0 + 54 }));
        }
      }
      if (cfg.colTotals) {
        for (var c = 0; c < 3; c++) {
          var cv = colValues(c);
          var ct = sum(cv);
          info.appendChild(svg('text', { class: 'kgr-ct' + totalClass(ct, cv.length === 3), x: slots[c].x + SLOT_W / 2, y: cfg.colTotals.y, 'text-anchor': 'middle', text: '↓ ' + ct + ' g' }));
        }
      }
    }

    var board = {
      el: root,
      slots: slots,
      tiles: tiles,
      rowValues: rowValues,
      colValues: colValues,
      isFull: function () {
        return slots.every(function (s) {
          return s.tile;
        });
      },
      emptyCount: function () {
        return slots.filter(function (s) {
          return !s.tile;
        }).length;
      },
      lock: function () {
        locked = true;
        root.classList.add('kgr-locked');
      },
      unlock: function () {
        locked = false;
        root.classList.remove('kgr-locked');
      },
      setGapLabel: function (txt) {
        gapLabel = txt;
        redrawInfo();
      },
      /** Send these tiles (or every movable tile) back to the tray. */
      sendHome: function (list) {
        (list || tiles).forEach(function (t) {
          if (t.fixed) return;
          put(t, null);
          settle(t);
        });
        redrawInfo();
      },
      /** Fill the board with one value per slot (fixed slots ignored). Keeps tiles already right. */
      arrange: function (values) {
        var want = values.slice();
        var spare = tiles.filter(function (t) {
          return !t.fixed;
        });
        slots.forEach(function (s, i) {
          if (s.tile && !s.tile.fixed && s.tile.value === want[i]) {
            spare.splice(spare.indexOf(s.tile), 1);
            want[i] = null;
          }
        });
        spare.forEach(function (t) {
          put(t, null);
        });
        slots.forEach(function (s, i) {
          if (want[i] == null || (s.tile && s.tile.fixed)) return;
          for (var j = 0; j < spare.length; j++) {
            if (spare[j].value === want[i]) {
              put(spare[j], s);
              spare.splice(j, 1);
              break;
            }
          }
        });
        tiles.forEach(settle);
        redrawInfo();
      },
    };
    redrawInfo();
    return board;
  }

  /** A single row of 3 slots under a 1000 g strip, with a tray of tiles underneath. */
  function rowBoard(api, fixedBySlot, trayValues, onChange) {
    var W = 960;
    var slotXs = [250, 400, 550];
    var n = trayValues.length;
    var step = 124;
    var tx0 = W / 2 - (n * step - (step - TILE_W)) / 2;
    return makeBoard(api, {
      w: W,
      h: 296,
      strip: { x: 130, y: 36, w: 700, h: 56 },
      slots: slotXs.map(function (x, i) {
        return { x: x, y: 124, row: 0, col: i, fixed: fixedBySlot[i] };
      }),
      tray: trayValues.map(function (v, i) {
        return { value: v, x: tx0 + i * step, y: 226 };
      }),
      totalText: { x: 690, y: 166 },
      onChange: onChange,
    });
  }

  function addPluses(board) {
    var sv = board.el;
    var g = svg('g', { class: 'kgr-ops' });
    [381, 531].forEach(function (x) {
      g.appendChild(svg('text', { class: 'kgr-op', x: x, y: 166, 'text-anchor': 'middle', text: '+' }));
    });
    sv.insertBefore(g, sv.firstChild);
  }

  /** "600 → 700 → 800 → 900 → 1000": counting on in hundreds (or one 50 then hundreds). */
  function countOn(from) {
    var steps = [from];
    var v = from;
    if (v % 100) {
      v += 50;
      steps.push(v);
    }
    while (v < KG) {
      v += 100;
      steps.push(v);
    }
    var row = el('div', { class: 'kgr-count' });
    steps.forEach(function (s, i) {
      if (i) row.appendChild(el('span', { class: 'kgr-jump' }, '+' + (s - steps[i - 1])));
      row.appendChild(el('span', { class: 'chip' + (s === KG ? ' chip-total' : '') }, s + ' g'));
    });
    return row;
  }

  function slotValues(board) {
    return board.slots.map(function (s) {
      return s.tile ? s.tile.value : null;
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice renderers
   * ------------------------------------------------------------------ */

  function renderOne(stage, api, q) {
    api.say('Which tile makes the row 1000 grams?', 'think');
    stage.appendChild(MQ.ui.prompt('Make the row <b>1000 g</b>. Which tile is missing?'));
    var fixed = [null, null, null];
    var k = 0;
    for (var i = 0; i < 3; i++) if (i !== q.gap) fixed[i] = q.fixed[k++];
    var s = q.fixed[0] + q.fixed[1];
    var work = el('div', { class: 'kgr-work' });
    var board = rowBoard(api, fixed, q.options, function (b) {
      if (api.isAnswered() || !b.isFull()) return;
      var picked = b.slots[q.gap].tile;
      var total = sum(b.rowValues(0));
      if (total === KG) {
        b.lock();
        b.setGapLabel(null);
        api.check(true, q.fixed[0] + ' + ' + q.fixed[1] + ' + ' + q.missing + ' = 1000 g. One kilogram!');
        return;
      }
      var hint;
      if (api.tries() >= 1) hint = q.fixed[0] + ' + ' + q.fixed[1] + ' = ' + s + ' g. Count on in hundreds from ' + s + ' to 1000.';
      else hint = 'That makes ' + total + ' g. It is ' + Math.abs(total - KG) + ' g too ' + (total > KG ? 'heavy' : 'light') + '. Look at the gap in the bar.';
      api.check(false, hint, picked.value === 50 ? 'Added 50s wrongly' : 'Row total not 1000');
      b.lock();
      api.later(function () {
        if (api.isAnswered()) return;
        b.sendHome([picked]);
        b.unlock();
      }, 1300);
    });
    addPluses(board);
    stage.appendChild(el('div', { class: 'kgr-board' }, board.el));
    stage.appendChild(el('p', { class: 'kgr-help' }, 'Drag a tile into the empty box, or click it.'));
    stage.appendChild(work);
    api.onReveal(function () {
      var want = fixed.slice();
      want[q.gap] = q.missing;
      board.arrange(want);
      board.setGapLabel(null);
      board.lock();
      MQ.clear(work);
      work.appendChild(el('div', { class: 'kgr-work-title' }, 'Count on from ' + s + ' g to 1000 g:'));
      work.appendChild(countOn(s));
      work.appendChild(MQ.ui.sum([q.fixed[0], q.fixed[1], q.missing], KG, 'g'));
      api.feedback(q.fixed[0] + ' + ' + q.fixed[1] + ' = ' + s + ' g. ' + s + ' needs ' + q.missing + ' g more to make 1000 g.', 'info');
    });
  }

  function renderTwo(stage, api, q) {
    api.say('Pick two tiles. Make the row 1000 grams.', 'think');
    stage.appendChild(MQ.ui.prompt('<b>' + q.fixed + ' g</b> is in. Choose <b>two</b> tiles to make <b>1000 g</b>.'));
    var r = KG - q.fixed;
    var work = el('div', { class: 'kgr-work' });
    var board = rowBoard(api, [q.fixed, null, null], q.tray, function (b) {
      if (api.isAnswered() || !b.isFull()) return;
      var picks = [b.slots[1].tile, b.slots[2].tile];
      var total = sum(b.rowValues(0));
      if (total === KG) {
        b.lock();
        api.check(true, q.fixed + ' + ' + picks[0].value + ' + ' + picks[1].value + ' = 1000 g. Brilliant!');
        return;
      }
      var off = Math.abs(total - KG);
      var hint;
      if (api.tries() >= 1) hint = q.fixed + ' needs ' + r + ' g more. Find two tiles that make ' + r + '. Try the ' + (r % 100 === 50 ? '50s first: one tile must end in 50.' : 'biggest tile first.');
      else hint = 'That makes ' + total + ' g: ' + off + ' g too ' + (total > KG ? 'heavy' : 'light') + '. How much more does ' + q.fixed + ' need?';
      api.check(false, hint, off === 50 || off % 100 === 50 ? 'Added 50s wrongly' : 'Row total not 1000');
      b.lock();
      api.later(function () {
        if (api.isAnswered()) return;
        b.sendHome(picks);
        b.unlock();
      }, 1300);
    });
    addPluses(board);
    stage.appendChild(el('div', { class: 'kgr-board' }, board.el));
    stage.appendChild(el('p', { class: 'kgr-help' }, 'Drag two tiles into the boxes, or click them.'));
    stage.appendChild(work);
    api.onReveal(function () {
      board.arrange([q.fixed, q.pair[0], q.pair[1]]);
      board.lock();
      MQ.clear(work);
      work.appendChild(el('div', { class: 'kgr-work-title' }, q.fixed + ' g needs ' + r + ' g more. Count on:'));
      work.appendChild(countOn(q.fixed));
      work.appendChild(MQ.ui.sum([q.fixed, q.pair[0], q.pair[1]], KG, 'g'));
      api.feedback(q.pair[0] + ' + ' + q.pair[1] + ' = ' + r + ' g, and ' + q.fixed + ' + ' + r + ' = 1000 g.', 'info');
    });
  }

  function renderGrid(stage, api, q) {
    var both = q.cols;
    api.say(both ? 'Bonus! Every row AND every column must make 1000 grams.' : 'Make every row 1000 grams.', 'think');
    stage.appendChild(MQ.ui.prompt(both ? 'Make every <b>row</b> and every <b>column</b> total <b>1000 g</b>.' : 'Make every <b>row</b> total <b>1000 g</b>. Use all nine tiles.'));
    var GX = 82;
    var GY = 14;
    var slots = [];
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) slots.push({ x: GX + c * (SLOT_W + 12), y: GY + r * (SLOT_H + 12), row: r, col: c, fixed: q.fixed[r * 3 + c] });
    }
    var tray = q.tiles.map(function (v, i) {
      return { value: v, x: 634 + (i % 3) * 108, y: GY + 4 + Math.floor(i / 3) * (SLOT_H + 12) };
    });
    var H = both ? 286 : 250;
    var board = makeBoard(api, { w: 960, h: H, slots: slots, tray: tray, rowTotals: { x: 456, w: 150 }, colTotals: both ? { y: 270 } : null });
    var labels = svg('g');
    for (var rr = 0; rr < 3; rr++) labels.appendChild(svg('text', { class: 'kgr-row-label', x: GX - 10, y: GY + rr * (SLOT_H + 12) + 39, 'text-anchor': 'end', text: 'Row ' + (rr + 1) }));
    if (both) labels.appendChild(svg('text', { class: 'kgr-row-label kgr-col-label', x: 4, y: 270, text: 'Columns' }));
    board.el.insertBefore(labels, board.el.firstChild);
    stage.appendChild(el('div', { class: 'kgr-board kgr-board-grid' }, board.el));
    var work = el('div', { class: 'kgr-work' });
    var checkBtn = el('button', { class: 'btn kgr-check', type: 'button' }, 'Check');
    stage.appendChild(el('div', { class: 'kgr-actions' }, el('span', { class: 'kgr-help' }, 'Drag or click tiles. Then press Check.'), checkBtn));
    stage.appendChild(work);

    function bigHint(rowVals) {
      var top = Math.max.apply(null, rowVals);
      return ' Start with ' + top + ' g: it needs ' + (KG - top) + ' g more.';
    }

    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var rows = [0, 1, 2].map(function (i) {
        return board.rowValues(i);
      });
      var badFull = -1;
      rows.forEach(function (v, i) {
        if (badFull < 0 && v.length === 3 && sum(v) !== KG) badFull = i;
      });
      var empty = board.emptyCount();
      if (empty) {
        var note = empty + (empty === 1 ? ' box is' : ' boxes are') + ' still empty. Fill every box, then press Check.';
        if (badFull >= 0) {
          var t0 = sum(rows[badFull]);
          note += ' (Row ' + (badFull + 1) + ' is ' + Math.abs(t0 - KG) + ' g too ' + (t0 > KG ? 'heavy' : 'light') + '.)';
        }
        api.feedback(note, 'info');
        api.say('Fill all the boxes first.', 'think');
        return;
      }
      if (badFull >= 0) {
        var t = sum(rows[badFull]);
        var off = Math.abs(t - KG);
        var hint = 'Row ' + (badFull + 1) + ' is ' + t + ' g. It is ' + off + ' g too ' + (t > KG ? 'heavy' : 'light') + '.';
        if (api.tries() >= 1) {
          // Point at the biggest tile not yet in a finished row.
          var loose = [];
          rows.forEach(function (v) {
            if (sum(v) !== KG) loose = loose.concat(v);
          });
          hint += bigHint(loose);
        }
        api.check(false, hint, api.tries() >= 1 ? 'Gave up on the grid (try the biggest tile first)' : off % 100 === 50 ? 'Added 50s wrongly' : 'Row total not 1000');
        return;
      }
      if (both) {
        var badCol = -1;
        for (var c2 = 0; c2 < 3; c2++) if (badCol < 0 && sum(board.colValues(c2)) !== KG) badCol = c2;
        if (badCol >= 0) {
          var ct = sum(board.colValues(badCol));
          var ch = 'All rows are 1000 g. Column ' + (badCol + 1) + ' is ' + ct + ' g: ' + Math.abs(ct - KG) + ' g too ' + (ct > KG ? 'heavy' : 'light') + '. Swap two tiles inside a row.';
          if (api.tries() >= 1) {
            var topV = board.slots[badCol].tile.value;
            ch += ' The top tile is ' + topV + ' g, so the two below it must make ' + (KG - topV) + ' g.';
          }
          api.check(false, ch, api.tries() >= 1 ? 'Gave up on the grid (try the biggest tile first)' : 'Column total not 1000');
          return;
        }
      }
      board.lock();
      checkBtn.disabled = true;
      api.check(true, both ? 'Every row and every column is 1000 g. Amazing!' : 'Three rows, three kilograms. Brilliant!');
    });

    api.onReveal(function () {
      var sol = solveGrid(q.tiles, q.fixed, both);
      board.arrange(sol);
      board.lock();
      checkBtn.disabled = true;
      MQ.clear(work);
      for (var i = 0; i < 3; i++) work.appendChild(el('div', { class: 'kgr-work-line' }, el('span', { class: 'kgr-work-name' }, 'Row ' + (i + 1)), MQ.ui.sum(sol.slice(i * 3, i * 3 + 3), KG, 'g')));
      if (both) {
        for (var c3 = 0; c3 < 3; c3++) work.appendChild(el('div', { class: 'kgr-work-line' }, el('span', { class: 'kgr-work-name' }, 'Column ' + (c3 + 1)), MQ.ui.sum([sol[c3], sol[3 + c3], sol[6 + c3]], KG, 'g')));
      }
      var top = Math.max.apply(null, q.tiles);
      api.feedback('Start with the biggest tile, ' + top + ' g. It needs ' + (KG - top) + ' g more. Then fill the next row the same way.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */

  function learnStrip(stage, api) {
    api.say('Three weights, one kilogram.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('1 kilogram = 1000 grams', 'The bar is <b>1 kg</b>. It has ten <b>100 g</b> pieces. Drag all three tiles into the boxes.'));
    var work = el('div', { class: 'kgr-work' });
    var board = rowBoard(api, [null, null, null], U.shuffle([500, 300, 200]), function (b) {
      MQ.clear(work);
      if (!b.isFull()) return;
      b.lock();
      var v = slotValues(b);
      work.appendChild(MQ.ui.sum(v, KG, 'g'));
      api.sound('correct');
      api.say('The bar is full. Exactly 1 kilogram!', 'cheer');
      api.feedback(v.join(' + ') + ' = 1000 g. That is 1 kg!', 'good');
      api.unlockNext();
    });
    addPluses(board);
    stage.appendChild(el('div', { class: 'kgr-board' }, board.el));
    stage.appendChild(work);
  }

  function learnBonds(stage, api) {
    api.say('700 grams is in. How much more do we need?');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('How much more makes 1000 g?', 'Put the <b>700 g</b> tile in a box. Then look at the gap.'));
    var holder = el('div', { class: 'kgr-learn' });
    stage.appendChild(holder);

    // Step 1: place 700, then answer "how much more?"
    var ask = el('div', { class: 'kgr-ask' });
    var board = rowBoard(api, [null, null, null], [700], function (b) {
      if (!b.isFull() && b.rowValues(0).length === 1 && !ask.firstChild) askGap(b);
    });
    addPluses(board);
    holder.appendChild(el('div', { class: 'kgr-board' }, board.el));
    holder.appendChild(ask);

    function askGap(b) {
      b.lock();
      api.say('Count the empty pieces. How much more?', 'think');
      ask.appendChild(MQ.ui.prompt('700 g + <b>?</b> = 1000 g'));
      var ch = MQ.ui.choices(
        [200, 300, 400].map(function (v) {
          return { label: v + ' g', value: v };
        }),
        function (v) {
          if (v === 300) {
            ch.mark(v, 'good');
            ch.disable();
            b.setGapLabel('300 g');
            api.sound('correct');
            MQ.clear(ask);
            ask.appendChild(countOn(700));
            ask.appendChild(el('button', { class: 'btn', type: 'button', onclick: stepTwo }, 'Now make 300 g ▶'));
            api.feedback('Count on: 800, 900, 1000. Three hundreds: 300 g.', 'good');
            api.say('Yes! 700 and 300 make 1000.', 'cheer');
          } else {
            ch.mark(v, 'bad');
            api.sound('wrong');
            api.feedback('Count the empty 100 g pieces in the bar: 800, 900, 1000.', 'try');
          }
        },
        { columns: 3 }
      );
      ask.appendChild(ch);
    }

    // Step 2: make 300 from two tiles (250 + 50).
    function stepTwo() {
      MQ.clear(holder);
      api.feedback('', 'info');
      api.say('No 300 tile! Make 300 with two tiles.', 'think');
      var note = el('div', { class: 'kgr-work' });
      var b2 = rowBoard(api, [700, null, null], U.shuffle([250, 50, 200, 150]), function (b) {
        if (!b.isFull()) return;
        var picks = [b.slots[1].tile, b.slots[2].tile];
        var t = sum(b.rowValues(0));
        if (t === KG) {
          b.lock();
          MQ.clear(note);
          note.appendChild(MQ.ui.sum([700, picks[0].value, picks[1].value], KG, 'g'));
          api.sound('correct');
          api.say('250 and 50 make 300. One kilogram!', 'cheer');
          api.feedback('250 + 50 = 300, so 700 + 250 + 50 = 1000 g.', 'good');
          api.unlockNext();
        } else {
          b.lock();
          api.sound('wrong');
          api.feedback('That makes ' + t + ' g: ' + Math.abs(t - KG) + ' g too ' + (t > KG ? 'heavy' : 'light') + '. Which two tiles make 300?', 'try');
          api.later(function () {
            b.sendHome(picks);
            b.unlock();
          }, 1300);
        }
      });
      addPluses(b2);
      holder.appendChild(MQ.ui.prompt('Make <b>300 g</b> from two tiles.'));
      holder.appendChild(el('div', { class: 'kgr-board' }, b2.el));
      holder.appendChild(note);
    }
  }

  var deck = null;

  var def = {
    learn: [learnStrip, learnBonds],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'one') renderOne(stage, api, q);
        else if (q.type === 'two') renderTwo(stage, api, q);
        else renderGrid(stage, api, q);
      },
    },
    // For offline tests only.
    _test: { buildDeck: buildDeck, solveGrid: solveGrid, BOOK_SET: BOOK_SET, CHALLENGE_GRID: CHALLENGE_GRID },
  };
  MQ.register('kilo-grid', def);

  var css = [
    '.kgr-board{width:100%;max-width:900px}',
    '.kgr-svg{display:block;width:100%;max-width:100%;height:auto;user-select:none;-webkit-user-select:none}',
    '.kgr-slot{fill:#f8fafc;stroke:#9aa7c2;stroke-width:2.5;stroke-dasharray:7 5}',
    '.kgr-home{fill:none;stroke:#e1e6f0;stroke-width:2;stroke-dasharray:4 4}',
    '.kgr-tile{cursor:grab;outline:none}',
    '.kgr-tile .kgr-tile-body{stroke:#51607e;stroke-width:2.5}',
    '.kgr-tile .kgr-knob{fill:#8a96ad}',
    '.kgr-tile:hover .kgr-tile-body,.kgr-tile:focus .kgr-tile-body{stroke:var(--accent);stroke-width:3.5}',
    '.kgr-tile.dragging{cursor:grabbing}',
    '.kgr-tile.dragging .kgr-tile-body{filter:drop-shadow(0 4px 5px rgba(27,42,74,.25))}',
    '.kgr-fixed{cursor:default}',
    '.kgr-fixed .kgr-tile-body{stroke:#9aa7c2;stroke-dasharray:none}',
    '.kgr-fixed .kgr-knob{fill:#b8c1d3}',
    '.kgr-locked .kgr-tile{cursor:default}',
    '.kgr-tile-text{font-size:24px;font-weight:800;fill:var(--ink);pointer-events:none}',
    '.kgr-strip-bg{fill:#fff}',
    '.kgr-strip-edge{fill:none;stroke:var(--ink-soft);stroke-width:3}',
    '.kgr-strip-edge.kgr-full{stroke:var(--good);stroke-width:5}',
    '.kgr-piece{fill:none;stroke:#b5c0d6;stroke-width:1.5}',
    '.kgr-gap{fill:#fff8e6;stroke:#e9b949;stroke-width:2;stroke-dasharray:6 4}',
    '.kgr-gap-text{font-size:32px;font-weight:800;fill:#b7791f}',
    '.kgr-seg-text{font-size:19px;font-weight:800;fill:var(--ink);pointer-events:none}',
    '.kgr-over{fill:rgba(194,65,12,.35)}',
    '.kgr-over-text{font-size:18px;font-weight:800;fill:var(--try)}',
    '.kgr-scale{font-size:16px;font-weight:700;fill:var(--ink-soft)}',
    '.kgr-scale-end{font-weight:800;fill:var(--ink)}',
    '.kgr-op{font-size:30px;font-weight:800;fill:var(--ink-soft)}',
    '.kgr-col-label{font-size:15px}',
    '.kgr-total{font-size:30px;font-weight:800;fill:var(--ink)}',
    '.kgr-rt{font-size:22px;font-weight:800;fill:var(--ink)}',
    '.kgr-ct{font-size:20px;font-weight:800;fill:var(--ink)}',
    '.kgr-ok{fill:var(--good)}',
    '.kgr-heavy{fill:var(--try)}',
    '.kgr-light{fill:#b7791f}',
    '.kgr-mini-bg{fill:#eef1f6;stroke:#b5c0d6;stroke-width:1.5}',
    '.kgr-mini{fill:#74c0fc}',
    '.kgr-mini.kgr-ok{fill:var(--good)}',
    '.kgr-mini.kgr-heavy{fill:var(--try)}',
    '.kgr-mini.kgr-light{fill:#e9b949}',
    '.kgr-mini-tick{stroke:#fff;stroke-width:1.5}',
    '.kgr-row-label{font-size:17px;font-weight:800;fill:var(--ink-soft)}',
    '.kgr-help{margin:0;color:var(--ink-soft);font-size:.95rem}',
    '.kgr-actions{display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center}',
    '.kgr-check{font-size:1.1rem;padding:10px 28px}',
    '.kgr-work{display:flex;flex-direction:column;align-items:center;gap:8px}',
    '.kgr-work:empty{display:none}',
    '.kgr-work-title{font-weight:800}',
    '.kgr-work-line{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.kgr-work-name{font-weight:800;min-width:80px;text-align:right;color:var(--ink-soft)}',
    '.kgr-count{display:flex;align-items:center;flex-wrap:wrap;gap:6px;justify-content:center;font-weight:800}',
    '.kgr-jump{font-size:.85rem;color:var(--good)}',
    '.kgr-learn,.kgr-ask{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.kgr-ask .choices{max-width:520px;width:100%}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'kilo-grid' }, css));
})();

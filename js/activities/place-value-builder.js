/* Build a number — hundreds, tens and ones with base-ten blocks, a bead abacus and
 * arrow cards (Unit 1.1). Blocks are drawn to scale: a hundred square is 10 × 10 small
 * squares and a ten stick is 10 small squares, so every piece can be counted.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  /* ---------------------------------------------------------------- *
   * Place-value helpers
   * ---------------------------------------------------------------- */
  var KINDS = ['h', 't', 'o'];
  var PLACE = {
    h: { name: 'hundreds', one: 'hundred', val: 100, Name: 'Hundreds' },
    t: { name: 'tens', one: 'ten', val: 10, Name: 'Tens' },
    o: { name: 'ones', one: 'one', val: 1, Name: 'Ones' },
  };
  var PIECE = {
    h: { one: 'hundred square', many: 'hundred squares' },
    t: { one: 'ten stick', many: 'ten sticks' },
    o: { one: 'single cube', many: 'single cubes' },
  };
  var BEAD = {
    h: { one: 'bead on the hundreds spike', many: 'beads on the hundreds spike' },
    t: { one: 'bead on the tens spike', many: 'beads on the tens spike' },
    o: { one: 'bead on the ones spike', many: 'beads on the ones spike' },
  };
  var COUNTER = {
    h: { one: 'counter in the Hundreds column', many: 'counters in the Hundreds column' },
    t: { one: 'counter in the Tens column', many: 'counters in the Tens column' },
    o: { one: 'counter in the Ones column', many: 'counters in the Ones column' },
  };

  function digitsOf(n) {
    return { h: Math.floor(n / 100), t: Math.floor(n / 10) % 10, o: n % 10 };
  }
  function numOf(c) {
    return c.h * 100 + c.t * 10 + c.o;
  }
  /** "3 tens", "1 ten" */
  function countWord(d, k) {
    return d + ' ' + (d === 1 ? PLACE[k].one : PLACE[k].name);
  }
  function nounWord(d, nouns, k) {
    return d + ' ' + (d === 1 ? nouns[k].one : nouns[k].many);
  }
  /** "10, 20, 30" — counting in steps of the place value */
  function steps(d, k) {
    var out = [];
    for (var i = 1; i <= d; i++) out.push(i * PLACE[k].val);
    return out.join(', ');
  }
  function sameCounts(a, b) {
    return a.h === b.h && a.t === b.t && a.o === b.o;
  }

  /* ---------------------------------------------------------------- *
   * Drawing base-ten pieces (to scale: u = size of one small square)
   * ---------------------------------------------------------------- */
  function gridPath(x, y, cols, rows, u) {
    var d = '';
    for (var c = 1; c < cols; c++) d += 'M' + (x + c * u) + ' ' + y + 'v' + rows * u;
    for (var r = 1; r < rows; r++) d += 'M' + x + ' ' + (y + r * u) + 'h' + cols * u;
    return d;
  }
  function pieceSize(kind, u) {
    if (kind === 'h') return { w: 10 * u, h: 10 * u };
    if (kind === 't') return { w: u, h: 10 * u };
    return { w: u, h: u };
  }
  /** One base-ten piece as a <g> with its top-left corner at (x, y). */
  function drawPiece(kind, x, y, u, hitPad) {
    var s = pieceSize(kind, u);
    var g = svg('g', { class: 'pv-blk pv-blk-' + kind });
    if (hitPad) g.appendChild(svg('rect', { x: x - hitPad, y: y - hitPad, width: s.w + 2 * hitPad, height: s.h + 2 * hitPad, class: 'pv-hit' }));
    g.appendChild(svg('rect', { x: x, y: y, width: s.w, height: s.h, class: 'pv-fill' }));
    if (kind === 'h') g.appendChild(svg('path', { d: gridPath(x, y, 10, 10, u), class: 'pv-gridline' }));
    if (kind === 't') g.appendChild(svg('path', { d: gridPath(x, y, 1, 10, u), class: 'pv-gridline' }));
    g.appendChild(svg('rect', { x: x, y: y, width: s.w, height: s.h, class: 'pv-edge' }));
    return g;
  }

  /** Running-count labels over pieces of one kind: 100, 200, 300 … (shown one by one). */
  function countLabels(layer, pieces, kind, api, stepMs) {
    var list = pieces.filter(function (p) {
      return p.kind === kind;
    });
    list.forEach(function (p, i) {
      var cx = p.x + p.w / 2;
      var y = kind === 'h' ? p.y + p.h / 2 + 7 : p.y - 6;
      var t = svg('text', { x: cx, y: y, class: 'pv-countlab pv-countlab-' + kind, 'text-anchor': 'middle' }, String((i + 1) * PLACE[kind].val));
      if (stepMs) {
        t.style.opacity = '0';
        api.later(function () {
          t.style.opacity = '1';
          api.sound('pop');
        }, stepMs * (i + 1));
      }
      layer.appendChild(t);
    });
    return list.length * (stepMs || 0);
  }

  /**
   * A loose base-ten picture (like a book picture): hundred squares, then ten sticks,
   * then single cubes. Returns { el, svg, pieces, labels(kind, api, ms), labelAll(api, ms) }.
   */
  function loosePic(c, u, opts) {
    opts = opts || {};
    u = u || 7;
    var gap = 34;
    var top = 24;
    var pieces = [];
    var x = 12;
    var bodyH = 10 * u;
    var fstep = 10 * u + 8;
    if (c.h) {
      var perRow = Math.min(c.h, 5);
      for (var i = 0; i < c.h; i++) pieces.push({ kind: 'h', x: x + (i % 5) * fstep, y: top + Math.floor(i / 5) * fstep, w: 10 * u, h: 10 * u });
      bodyH = Math.max(bodyH, Math.ceil(c.h / 5) * fstep - 8);
      x += perRow * fstep - 8 + gap;
    }
    if (c.t) {
      var tstep = u + 12;
      for (var j = 0; j < c.t; j++) pieces.push({ kind: 't', x: x + j * tstep, y: top, w: u, h: 10 * u });
      x += c.t * tstep - 12 + gap;
    }
    if (c.o) {
      var ostep = u + 13;
      var orow = u + 20;
      for (var k = 0; k < c.o; k++) pieces.push({ kind: 'o', x: x + (k % 5) * ostep, y: top + 10 * u - u - (Math.floor(k / 5) ? 0 : orow), w: u, h: u });
      x += Math.min(c.o, 5) * ostep - 13 + gap;
    }
    var W = Math.max(x - gap + 12, 120);
    var H = top + bodyH + 10;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'pv-loose' + (opts.className ? ' ' + opts.className : ''), style: { maxWidth: '100%', height: 'auto' } });
    var layer = svg('g');
    var labels = svg('g');
    pieces.forEach(function (p) {
      var g = drawPiece(p.kind, p.x, p.y, u);
      g.setAttribute('data-kind', p.kind);
      p.g = g;
      layer.appendChild(g);
    });
    root.appendChild(layer);
    root.appendChild(labels);
    return {
      el: root,
      svg: root,
      pieces: pieces,
      labels: function (kind, api, ms) {
        return countLabels(labels, pieces, kind, api, ms);
      },
      light: function (kind) {
        pieces.forEach(function (p) {
          p.g.classList.toggle('pv-pulse', p.kind === kind);
        });
      },
    };
  }

  /* ---------------------------------------------------------------- *
   * The place-value mat: Hundreds | Tens | Ones columns, with a tray of blocks
   * underneath. Drag a block from the tray onto the mat (or click it) to add one;
   * drag a block off the mat (or click it) to take it away. Max 9 per column.
   * ---------------------------------------------------------------- */
  var MU = 8; // small square size on the mat
  var CW = 270; // column width
  var MPAD = 10;
  var HEAD = 36;

  function matPiecePos(kind, i, x0, y0) {
    if (kind === 'h') return { x: x0 + 9 + (i % 3) * (10 * MU + 6), y: y0 + 8 + Math.floor(i / 3) * (10 * MU + 6) };
    if (kind === 't') return { x: x0 + 35 + i * (MU + 16), y: y0 + 26 };
    return { x: x0 + 71 + (i % 5) * (MU + 22), y: y0 + 26 + Math.floor(i / 5) * (MU + 26) };
  }

  function mat(api, opts) {
    opts = opts || {};
    var state = { h: 0, t: 0, o: 0 };
    if (opts.counts) state = { h: opts.counts.h, t: opts.counts.t, o: opts.counts.o };
    var interactive = !!opts.interactive;
    var locked = !interactive;
    var rowsH = interactive ? 3 : Math.max(1, Math.ceil(state.h / 3));
    var areaH = Math.max(112, rowsH * (10 * MU + 6) + 12);
    var W = MPAD * 2 + CW * 3;
    var matTop = 4;
    var areaTop = matTop + HEAD;
    var matBottom = areaTop + areaH;
    var digitsTop = matBottom + 8;
    var showDigitsRow = !!opts.digits || !!opts.digitsLater;
    var trayTop = (showDigitsRow ? digitsTop + 56 : matBottom) + 12;
    var trayH = 96;
    var H = interactive ? trayTop + trayH + 4 : (showDigitsRow ? digitsTop + 56 : matBottom + 6);

    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'pv-mat' + (interactive ? ' pv-mat-live' : ''), style: { maxWidth: '100%', height: 'auto' } });
    var cols = {};
    var digitBoxes = {};
    var digitsG = svg('g', { class: 'pv-digits' });
    KINDS.forEach(function (k, ci) {
      var x0 = MPAD + ci * CW;
      var bg = svg('rect', { x: x0 + 3, y: matTop, width: CW - 6, height: HEAD + areaH, rx: 12, class: 'pv-col pv-col-' + k, 'data-kind': k });
      root.appendChild(bg);
      root.appendChild(svg('text', { x: x0 + CW / 2, y: matTop + 25, class: 'pv-colhead', 'text-anchor': 'middle' }, PLACE[k].Name));
      cols[k] = bg;
      var box = svg('rect', { x: x0 + CW / 2 - 30, y: digitsTop, width: 60, height: 50, rx: 10, class: 'pv-dbox' });
      var txt = svg('text', { x: x0 + CW / 2, y: digitsTop + 38, class: 'pv-dtext', 'text-anchor': 'middle' }, '');
      digitsG.appendChild(box);
      digitsG.appendChild(txt);
      digitBoxes[k] = { box: box, text: txt };
    });
    if (showDigitsRow) root.appendChild(digitsG);
    if (!opts.digits) digitsG.style.display = 'none';
    var piecesG = svg('g', { class: 'pv-pieces' });
    var labelsG = svg('g');
    root.appendChild(piecesG);
    root.appendChild(labelsG);

    // tray of endless blocks under the mat
    if (interactive) {
      root.appendChild(svg('rect', { x: MPAD + 3, y: trayTop, width: W - 2 * MPAD - 6, height: trayH, rx: 12, class: 'pv-tray' }));
      KINDS.forEach(function (k, ci) {
        var x0 = MPAD + ci * CW;
        var s = pieceSize(k, MU);
        var px = x0 + CW / 2 - s.w / 2 - 40;
        var py = trayTop + (trayH - s.h) / 2;
        if (k !== 'h') py = trayTop + (trayH - 10 * MU) / 2 + (k === 'o' ? 10 * MU / 2 - s.h / 2 : 0);
        var g = drawPiece(k, px, py, MU, k === 'h' ? 4 : k === 't' ? 14 : 22);
        g.setAttribute('class', g.getAttribute('class') + ' pv-src');
        g.setAttribute('data-src', '1');
        g.setAttribute('data-kind', k);
        root.appendChild(g);
        root.appendChild(svg('text', { x: px + s.w + 22, y: trayTop + trayH / 2 + 8, class: 'pv-traylab' }, '= ' + PLACE[k].val));
      });
    }
    var ghostLayer = svg('g', { class: 'pv-ghost' });
    root.appendChild(ghostLayer);

    var pieces = [];
    function draw() {
      MQ.clear(piecesG);
      MQ.clear(labelsG);
      pieces = [];
      KINDS.forEach(function (k, ci) {
        var x0 = MPAD + ci * CW;
        for (var i = 0; i < state[k]; i++) {
          var pos = matPiecePos(k, i, x0, areaTop);
          var s = pieceSize(k, MU);
          var g = drawPiece(k, pos.x, pos.y, MU, interactive ? (k === 'h' ? 2 : k === 't' ? 7 : 10) : 0);
          g.setAttribute('class', g.getAttribute('class') + ' pv-piece');
          g.setAttribute('data-piece', '1');
          g.setAttribute('data-kind', k);
          piecesG.appendChild(g);
          pieces.push({ kind: k, x: pos.x, y: pos.y, w: s.w, h: s.h, g: g });
        }
        var d = digitBoxes[k];
        var leftHasSome = (k === 't' && state.h > 0) || (k === 'o' && (state.h > 0 || state.t > 0));
        d.text.textContent = state[k] > 0 || leftHasSome ? String(state[k]) : '';
        var zero = state[k] === 0 && leftHasSome;
        d.box.classList.toggle('pv-dzero', zero);
        d.text.classList.toggle('pv-dzero-t', zero);
      });
      root.setAttribute('data-counts', state.h + ',' + state.t + ',' + state.o);
    }

    function add(k) {
      if (locked) return;
      if (state[k] >= 9) {
        api.feedback('The ' + PLACE[k].name + ' column is full. 9 is the most we need: 10 ' + PLACE[k].name + ' would make the next block up!', 'info');
        return;
      }
      state[k]++;
      api.sound('pop');
      draw();
      if (opts.onChange) opts.onChange(m.get());
    }
    function remove(k) {
      if (locked || state[k] <= 0) return;
      state[k]--;
      api.sound('click');
      draw();
      if (opts.onChange) opts.onChange(m.get());
    }

    // pointer handling (one set of listeners for the whole mat)
    var drag = null;
    function inMat(p) {
      return p.x >= MPAD && p.x <= W - MPAD && p.y >= matTop && p.y <= matBottom + (showDigitsRow ? 56 : 0);
    }
    function onMove(e) {
      if (!drag) return;
      var p = MQ.ui.svgPoint(root, e);
      if (!drag.moved && Math.abs(p.x - drag.p0.x) + Math.abs(p.y - drag.p0.y) < 6) return;
      if (!drag.moved) {
        drag.moved = true;
        var s = pieceSize(drag.kind, MU);
        drag.ghost = drawPiece(drag.kind, -s.w / 2, -s.h / 2, MU);
        ghostLayer.appendChild(drag.ghost);
        if (drag.el && !drag.fromSrc) drag.el.classList.add('pv-lifted');
      }
      drag.ghost.setAttribute('transform', 'translate(' + p.x + ',' + p.y + ')');
      KINDS.forEach(function (k) {
        cols[k].classList.toggle('pv-col-target', drag.fromSrc && inMat(p) && k === drag.kind);
      });
    }
    function stopListening() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    }
    function onUp(e) {
      if (!drag) return;
      stopListening();
      var d = drag;
      drag = null;
      MQ.clear(ghostLayer);
      KINDS.forEach(function (k) {
        cols[k].classList.remove('pv-col-target');
      });
      var p = MQ.ui.svgPoint(root, e);
      if (!d.moved) {
        if (d.fromSrc) add(d.kind);
        else remove(d.kind);
        return;
      }
      if (d.fromSrc) {
        if (inMat(p)) add(d.kind);
      } else if (!inMat(p)) {
        remove(d.kind);
      } else {
        draw();
      }
    }
    function onDown(e) {
      if (locked || drag) return;
      var t = e.target && e.target.closest ? e.target.closest('[data-src],[data-piece]') : null;
      if (!t || !root.contains(t)) return;
      e.preventDefault();
      drag = { kind: t.getAttribute('data-kind'), fromSrc: t.hasAttribute('data-src'), p0: MQ.ui.svgPoint(root, e), moved: false, el: t };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    }
    if (interactive) {
      root.style.touchAction = 'none';
      root.addEventListener('pointerdown', onDown);
      api.cleanup(function () {
        root.removeEventListener('pointerdown', onDown);
        stopListening();
      });
    }

    var m = {
      el: root,
      svg: root,
      get: function () {
        return { h: state.h, t: state.t, o: state.o };
      },
      set: function (c) {
        state = { h: c.h, t: c.t, o: c.o };
        draw();
      },
      lock: function () {
        locked = true;
        root.classList.add('pv-locked');
      },
      showDigits: function () {
        if (!root.contains(digitsG)) root.insertBefore(digitsG, piecesG);
        digitsG.style.display = '';
      },
      light: function (k) {
        KINDS.forEach(function (kk) {
          cols[kk].classList.toggle('pv-lit', kk === k);
        });
        pieces.forEach(function (p) {
          p.g.classList.toggle('pv-pulse', p.kind === k);
        });
      },
      zeroCol: function (k) {
        cols[k].classList.add('pv-col-zero');
      },
      labels: function (k, ms) {
        return countLabels(labelsG, pieces, k, api, ms);
      },
      clearLabels: function () {
        MQ.clear(labelsG);
      },
    };
    draw();
    return m;
  }

  /* ---------------------------------------------------------------- *
   * A 3-spike bead abacus. opts.interactive adds + / − buttons under each spike.
   * ---------------------------------------------------------------- */
  function abacus(api, opts) {
    opts = opts || {};
    var state = opts.counts ? { h: opts.counts.h, t: opts.counts.t, o: opts.counts.o } : { h: 0, t: 0, o: 0 };
    var locked = !opts.interactive;
    var SP = 92;
    var W = SP * 3 + 30;
    var baseY = 196;
    var H = opts.interactive ? 290 : 236;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'pv-abacus' + (opts.interactive ? ' pv-abacus-live' : ''), style: { maxWidth: '100%', height: 'auto' } });
    var beads = svg('g');
    var labs = svg('g');
    root.appendChild(svg('rect', { x: 6, y: baseY, width: W - 12, height: 16, rx: 6, class: 'pv-ab-base' }));
    KINDS.forEach(function (k, i) {
      var cx = 15 + SP / 2 + i * SP;
      root.appendChild(svg('line', { x1: cx, y1: 14, x2: cx, y2: baseY, class: 'pv-ab-spike' }));
      root.appendChild(svg('text', { x: cx, y: baseY + 40, class: 'pv-ab-lab', 'text-anchor': 'middle' }, k === 'h' ? 'H' : k === 't' ? 'T' : 'O'));
      if (opts.interactive) {
        var minus = svg('g', { class: 'pv-ab-btn pv-ab-minus', 'data-kind': k }, svg('circle', { cx: cx - 22, cy: baseY + 74, r: 18 }), svg('text', { x: cx - 22, y: baseY + 82, 'text-anchor': 'middle' }, '−'));
        var plus = svg('g', { class: 'pv-ab-btn pv-ab-plus', 'data-kind': k }, svg('circle', { cx: cx + 22, cy: baseY + 74, r: 18 }), svg('text', { x: cx + 22, y: baseY + 82, 'text-anchor': 'middle' }, '+'));
        minus.addEventListener('click', function () {
          change(k, -1);
        });
        plus.addEventListener('click', function () {
          change(k, 1);
        });
        root.appendChild(minus);
        root.appendChild(plus);
      }
    });
    root.appendChild(beads);
    root.appendChild(labs);
    function draw() {
      MQ.clear(beads);
      KINDS.forEach(function (k, i) {
        var cx = 15 + SP / 2 + i * SP;
        for (var b = 0; b < state[k]; b++) beads.appendChild(svg('ellipse', { cx: cx, cy: baseY - 10 - b * 19, rx: 26, ry: 9, class: 'pv-bead pv-bead-' + k }));
      });
      root.setAttribute('data-counts', state.h + ',' + state.t + ',' + state.o);
    }
    function change(k, dlt) {
      if (locked) return;
      var v = state[k] + dlt;
      if (v > 9) {
        api.feedback('9 beads is the most on one spike: 10 would make the next place up!', 'info');
        return;
      }
      if (v < 0) return;
      state[k] = v;
      api.sound(dlt > 0 ? 'pop' : 'click');
      draw();
      if (opts.onChange) opts.onChange(a.get());
    }
    draw();
    var a = {
      el: root,
      get: function () {
        return { h: state.h, t: state.t, o: state.o };
      },
      set: function (c) {
        state = { h: c.h, t: c.t, o: c.o };
        draw();
      },
      lock: function () {
        locked = true;
        root.classList.add('pv-locked');
      },
      /** Write each spike's value under it: "3 hundreds = 300". */
      values: function () {
        MQ.clear(labs);
        KINDS.forEach(function (k, i) {
          var cx = 15 + SP / 2 + i * SP;
          labs.appendChild(svg('text', { x: cx, y: 14, class: 'pv-ab-val', 'text-anchor': 'middle' }, String(state[k] * PLACE[k].val)));
        });
      },
    };
    return a;
  }

  /* ---------------------------------------------------------------- *
   * Counters in a place-value grid (like the book's stars in columns)
   * ---------------------------------------------------------------- */
  function countersGrid(c) {
    var CWg = 170;
    var W = CWg * 3 + 4;
    var H = 210;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'pv-cgrid', style: { maxWidth: '100%', height: 'auto' } });
    var revealG = svg('g');
    KINDS.forEach(function (k, i) {
      var x0 = 2 + i * CWg;
      root.appendChild(svg('rect', { x: x0, y: 2, width: CWg, height: 44, class: 'pv-cg-head pv-cg-head-' + k }));
      root.appendChild(svg('rect', { x: x0, y: 46, width: CWg, height: 120, class: 'pv-cg-cell' }));
      root.appendChild(svg('text', { x: x0 + CWg / 2, y: 32, class: 'pv-colhead', 'text-anchor': 'middle' }, PLACE[k].Name));
      for (var j = 0; j < c[k]; j++) {
        var cx = x0 + CWg / 2 - 46 + (j % 3) * 46;
        var cy = 46 + 36 + Math.floor(j / 3) * 48;
        root.appendChild(svg('circle', { cx: cx, cy: cy, r: 17, class: 'pv-counter' }));
      }
      revealG.appendChild(svg('text', { x: x0 + CWg / 2, y: 196, class: 'pv-cg-val', 'text-anchor': 'middle' }, countWord(c[k], k) + ' = ' + c[k] * PLACE[k].val));
    });
    revealG.style.display = 'none';
    root.appendChild(revealG);
    return {
      el: root,
      reveal: function () {
        revealG.style.display = '';
      },
    };
  }

  /** Coloured "300 + 20 + 7 = 327" row. */
  function partsRow(c, total) {
    var row = el('div', { class: 'sum-row pv-parts' });
    var first = true;
    KINDS.forEach(function (k) {
      if (!first) row.appendChild(el('span', { class: 'sum-op' }, '+'));
      first = false;
      row.appendChild(el('span', { class: 'chip pv-chip-' + k }, String(c[k] * PLACE[k].val)));
    });
    row.appendChild(el('span', { class: 'sum-op' }, '='));
    row.appendChild(el('span', { class: 'chip chip-total' }, String(total)));
    return row;
  }

  /** Big coloured number: each digit in its column colour. */
  function colouredNumber(n, cls) {
    var d = digitsOf(n);
    return el('span', { class: 'pv-bignum ' + (cls || '') }, KINDS.map(function (k) {
      return el('span', { class: 'pv-dig-' + k }, String(d[k]));
    }));
  }

  /* ---------------------------------------------------------------- *
   * Hints for "read the number" answers (blocks, counters, beads)
   * ---------------------------------------------------------------- */
  function readHint(n, target, nouns, api) {
    var d = digitsOf(target);
    var strong = api.tries() >= 1;
    var total = d.h + d.t + d.o;
    if (n === total) {
      return {
        tag: 'Counted a ten as one',
        hint: strong
          ? 'Each piece is not worth 1. Count the hundreds in 100s (' + steps(d.h, 'h') + '), then the tens in 10s, then the ones.'
          : 'You counted every piece as 1. In the hundreds each one is worth 100. In the tens each one is worth 10.',
      };
    }
    if (n > 999) {
      return { tag: 'Wrote the parts side by side', hint: 'That number is too long. Write just 3 digits: how many hundreds, how many tens, how many ones.' };
    }
    if (d.t !== d.o && n === d.h * 100 + d.o * 10 + d.t) {
      return { tag: 'Mixed up tens and ones', hint: strong ? 'The tens digit is ' + d.t + ' and the ones digit is ' + d.o + '. Tens go in the middle.' : 'Check the tens and ones. Did they swap places?' };
    }
    if (n < 100 && (d.t === 0 || d.o === 0) && (n === d.h * 10 + d.t + d.o)) {
      return { tag: 'Forgot the zero place holder', hint: 'There are no ' + (d.t === 0 ? 'tens' : 'ones') + ', but we still write a 0 in that place. It needs 3 digits.' };
    }
    var g = digitsOf(n);
    if (n >= 100) {
      var wrong = KINDS.filter(function (k) {
        return g[k] !== d[k];
      });
      if (wrong.length === 1) {
        var k = wrong[0];
        return {
          tag: nouns === BEAD ? 'Miscounted beads' : 'Miscounted blocks',
          hint: strong ? 'There are ' + nounWord(d[k], nouns, k) + '. So the ' + PLACE[k].name + ' digit is ' + d[k] + '.' : 'Nearly! Count the ' + nouns[k].many + ' again. Touch each one as you count.',
        };
      }
    }
    return {
      tag: nouns === BEAD ? 'Miscounted beads' : 'Miscounted blocks',
      hint: strong ? 'There are ' + nounWord(d.h, nouns, 'h') + ', ' + nounWord(d.t, nouns, 't') + ' and ' + nounWord(d.o, nouns, 'o') + '.' : 'Count the hundreds first, then the tens, then the ones. Write one digit for each.',
    };
  }

  /** Hints for "build the number" (mat or abacus). */
  function buildHint(c, target, nouns, api) {
    var d = digitsOf(target);
    var strong = api.tries() >= 1;
    if (!c.h && !c.t && !c.o) {
      return { tag: 'Miscounted blocks', hint: nouns === BEAD ? 'The abacus is empty. Press + to put beads on each spike.' : 'The mat is empty. Drag blocks up from the tray (or click them).' };
    }
    if (d.t !== d.o && c.h === d.h && c.t === d.o && c.o === d.t) {
      return { tag: 'Mixed up tens and ones', hint: strong ? target + ' has ' + countWord(d.t, 't') + ' and ' + countWord(d.o, 'o') + '. Swap them round.' : 'Your tens and ones have swapped. Which digit tells the tens?' };
    }
    for (var i = 0; i < 3; i++) {
      var k = KINDS[i];
      if (c[k] === d[k]) continue;
      if (d[k] === 0) {
        return { tag: 'Forgot the zero place holder', hint: target + ' has 0 ' + PLACE[k].name + ', so the ' + PLACE[k].name + ' ' + (nouns === BEAD ? 'spike' : 'column') + ' stays empty. Take those away.' };
      }
      return {
        tag: nouns === BEAD ? 'Miscounted beads' : 'Miscounted blocks',
        hint: strong
          ? target + ' needs ' + nounWord(d[k], nouns, k) + '. You have ' + c[k] + '.'
          : 'Look at the ' + PLACE[k].name + '. The ' + PLACE[k].name + ' digit of ' + target + ' is ' + d[k] + '. Count yours.',
      };
    }
    return { tag: 'Miscounted blocks', hint: 'Count each column again.' };
  }

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */

  // 1. Sweet shop delivery: 3 boxes of 100, 2 bags of 10, 7 loose → 327
  function learnShop(stage, api) {
    api.lockNext();
    api.say('A delivery of sweets for the shop! How many? Click the boxes first.');
    stage.appendChild(MQ.ui.lesson('How many sweets?', 'Count the <b>boxes</b> in 100s, the <b>bags</b> in 10s, then the <b>loose</b> sweets in 1s.'));
    var u = 9;
    var W = 660;
    var H = 190;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'pv-shop', style: { maxWidth: '100%', height: 'auto' } });
    var groups = {};
    var labels = {};
    var items = { h: [], t: [], o: [] };
    function sweet(cx, cy, cls) {
      return svg('circle', { cx: cx, cy: cy, r: 3.4, class: 'pv-sweet ' + (cls || '') });
    }
    // boxes
    var gH = svg('g', { class: 'pv-group', 'data-group': 'h' });
    for (var b = 0; b < 3; b++) {
      var bx = 14 + b * 114;
      var by = 34;
      gH.appendChild(svg('rect', { x: bx, y: by, width: 104, height: 104, rx: 6, class: 'pv-box' }));
      for (var r = 0; r < 10; r++) for (var c = 0; c < 10; c++) gH.appendChild(sweet(bx + 7 + c * u + u / 2, by + 7 + r * u + u / 2, 'pv-sweet-h'));
      items.h.push({ x: bx + 52, y: by - 8 });
    }
    gH.appendChild(svg('text', { x: 14 + 166, y: 168, class: 'pv-shoplab', 'text-anchor': 'middle' }, '3 boxes of 100'));
    // bags
    var gT = svg('g', { class: 'pv-group', 'data-group': 't' });
    for (var t = 0; t < 2; t++) {
      var tx = 380 + t * 44;
      gT.appendChild(svg('path', { d: 'M' + (tx + 2) + ' 34 h28 l4 6 v94 a6 6 0 0 1 -6 6 h-24 a6 6 0 0 1 -6 -6 v-94 z', class: 'pv-bag' }));
      for (var s = 0; s < 10; s++) gT.appendChild(sweet(tx + 18, 46 + s * u + 2, 'pv-sweet-t'));
      items.t.push({ x: tx + 18, y: 26 });
    }
    gT.appendChild(svg('text', { x: 420, y: 168, class: 'pv-shoplab', 'text-anchor': 'middle' }, '2 bags of 10'));
    // loose
    var gO = svg('g', { class: 'pv-group', 'data-group': 'o' });
    gO.appendChild(svg('rect', { x: 498, y: 64, width: 148, height: 76, rx: 10, class: 'pv-tray-loose' }));
    for (var l = 0; l < 7; l++) {
      var lx = 516 + (l % 4) * 34;
      var ly = 92 + Math.floor(l / 4) * 30;
      gO.appendChild(sweet(lx, ly, 'pv-sweet-o pv-sweet-big'));
      items.o.push({ x: lx, y: ly - 10 });
    }
    gO.appendChild(svg('text', { x: 572, y: 168, class: 'pv-shoplab', 'text-anchor': 'middle' }, '7 loose'));
    groups = { h: gH, t: gT, o: gO };
    [[gH, 8, 350], [gT, 370, 472], [gO, 490, 652]].forEach(function (z) {
      z[0].insertBefore(svg('rect', { x: z[1], y: 8, width: z[2] - z[1], height: 172, rx: 12, class: 'pv-hit' }), z[0].firstChild);
    });
    var labG = svg('g');
    root.appendChild(gH);
    root.appendChild(gT);
    root.appendChild(gO);
    root.appendChild(labG);
    stage.appendChild(root);

    var slots = {};
    var eq = el('div', { class: 'sum-row pv-eq' });
    KINDS.forEach(function (k, i) {
      if (i) eq.appendChild(el('span', { class: 'sum-op' }, '+'));
      slots[k] = el('span', { class: 'chip pv-slot pv-chip-' + k }, '?');
      eq.appendChild(slots[k]);
    });
    eq.appendChild(el('span', { class: 'sum-op' }, '='));
    var total = el('span', { class: 'chip chip-total pv-slot' }, '?');
    eq.appendChild(total);
    stage.appendChild(eq);

    var order = ['h', 't', 'o'];
    var at = 0;
    var busy = false;
    var SAY = {
      h: 'Boxes of 100: 100, 200, 300. Now the bags!',
      t: 'Bags of 10: 10, 20. Now the loose sweets!',
      o: '1, 2, 3, 4, 5, 6, 7.',
    };
    function mark() {
      KINDS.forEach(function (k, i) {
        groups[k].classList.toggle('pv-next', i === at);
        groups[k].classList.toggle('pv-done', i < at);
      });
    }
    mark();
    KINDS.forEach(function (k) {
      groups[k].addEventListener('click', function () {
        if (busy || at >= 3) return;
        if (k !== order[at]) {
          api.feedback(at === 0 ? 'Start with the biggest: the boxes of 100.' : 'Next: the ' + (order[at] === 't' ? 'bags of 10' : 'loose sweets') + '.', 'info');
          return;
        }
        busy = true;
        var list = items[k];
        list.forEach(function (it, i) {
          api.later(function () {
            labG.appendChild(svg('text', { x: it.x, y: it.y, class: 'pv-countlab pv-countlab-' + k, 'text-anchor': 'middle' }, String((i + 1) * PLACE[k].val)));
            api.sound('pop');
          }, 450 * (i + 1));
        });
        api.later(function () {
          slots[k].textContent = String(list.length * PLACE[k].val);
          slots[k].classList.add('pv-filled');
          at++;
          busy = false;
          mark();
          if (at < 3) {
            api.say(SAY[k]);
          } else {
            total.textContent = '327';
            total.classList.add('pv-filled');
            api.say('300 + 20 + 7 = 327. Three hundred and twenty-seven sweets!', 'cheer');
            api.feedback('3 hundreds, 2 tens and 7 ones make 327.', 'good');
            api.unlockNext();
          }
        }, 450 * list.length + 400);
      });
    });
  }

  // 2. Build 408 on the mat; the empty tens column still needs a 0.
  function learnBuild(stage, api) {
    api.lockNext();
    var target = 408;
    api.say('Make 408 on the mat. Drag blocks up from the tray, or click them.');
    stage.appendChild(el('div', { class: 'prompt pv-prompt' }, 'Make ', colouredNumber(target), el('span', { class: 'pv-say' }, ' (four hundred and eight)')));
    var done = false;
    var m = mat(api, {
      interactive: true,
      digits: true,
      onChange: function (c) {
        if (done) return;
        if (sameCounts(c, digitsOf(target))) {
          done = true;
          m.lock();
          m.zeroCol('t');
          api.say('Yes! 4 hundreds, 0 tens, 8 ones. The tens column is empty, so we write a 0.', 'cheer');
          api.feedback('No tens? Still write 0 in the tens place: 4 0 8. Without the 0 it would say 48!', 'good');
          api.unlockNext();
        } else if (c.t > 0) {
          api.feedback('408 has <b>no</b> tens. Click a stick to take it away.', 'info');
        } else {
          api.feedback('', 'info');
        }
      },
    });
    stage.appendChild(el('div', { class: 'pv-matwrap' }, m.el));
  }

  // 3. Click a digit: its column lights up and its value appears (394).
  function learnSpotlight(stage, api) {
    api.lockNext();
    var n = 394;
    var c = digitsOf(n);
    api.say('Click each digit of 394. What is it worth?');
    var seen = {};
    var digitBtns = el('div', { class: 'pv-digitbtns' });
    var m = mat(api, { counts: c });
    var card = el('div', { class: 'pv-valuecard' }, el('div', { class: 'pv-vc-label' }, 'Click a digit'));
    var busy = false;
    KINDS.forEach(function (k) {
      var b = el('button', { class: 'pv-digit pv-dig-' + k, type: 'button', 'data-kind': k }, String(c[k]));
      b.addEventListener('click', function () {
        if (busy) return;
        busy = true;
        digitBtns.querySelectorAll('.pv-digit').forEach(function (x) {
          x.classList.toggle('pv-on', x === b);
        });
        m.clearLabels();
        m.light(k);
        var ms = m.labels(k, k === 'o' ? 250 : 350);
        MQ.clear(card);
        card.appendChild(el('div', { class: 'pv-vc-label' }, 'The ' + c[k] + ' means ' + countWord(c[k], k)));
        api.say(k === 't' ? 'Count the tens: ' + steps(c[k], k) + '. 9 tens is worth 90.' : k === 'h' ? '3 hundreds: 100, 200, 300. It is worth 300.' : '4 ones: worth just 4.');
        api.later(function () {
          card.appendChild(el('div', { class: 'pv-vc-value pv-dig-' + k }, 'worth ' + c[k] * PLACE[k].val));
          seen[k] = true;
          busy = false;
          var left = KINDS.filter(function (kk) {
            return !seen[kk];
          });
          if (!left.length) {
            api.feedback('394 = 300 + 90 + 4. The 9 is worth 90, not 9!', 'good');
            api.unlockNext();
          } else {
            api.feedback('Now click the ' + c[left[0]] + '.', 'info');
          }
        }, ms + 300);
      });
      digitBtns.appendChild(b);
    });
    stage.appendChild(el('div', { class: 'pv-spot' }, el('div', { class: 'pv-spot-left' }, digitBtns, card), el('div', { class: 'pv-matwrap pv-matwrap-sm' }, m.el)));
  }

  // 4. 375 three ways: blocks, bead abacus, arrow cards that slide together.
  function arrowCards(api, n, onJoin) {
    var d = digitsOf(n);
    var D = 44;
    var CH = 66;
    var W = 620;
    var H = CH + 16;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'pv-cards', style: { maxWidth: '100%', height: 'auto' } });
    var defs = [
      { k: 'h', digits: [d.h, 0, 0] },
      { k: 't', digits: [d.t, 0] },
      { k: 'o', digits: [d.o] },
    ];
    var joinedX = W / 2 - (3 * D + 12) / 2;
    var joined = false;
    var cards = defs.map(function (def, i) {
      var w = def.digits.length * D;
      var g = svg('g', { class: 'pv-card pv-card-' + def.k, 'data-kind': def.k });
      g.appendChild(svg('path', { d: 'M0 8 h' + w + ' l12 ' + CH / 2 + ' l-12 ' + CH / 2 + ' h-' + w + ' z', class: 'pv-card-body' }));
      def.digits.forEach(function (dg, j) {
        g.appendChild(svg('text', { x: j * D + D / 2, y: 8 + CH / 2 + 15, class: 'pv-card-text', 'text-anchor': 'middle' }, String(dg)));
      });
      def.w = w;
      def.g = g;
      def.joinX = joinedX + (3 - def.digits.length) * D;
      def.splitX = [20, 230, 420][i];
      def.x = def.splitX;
      root.appendChild(g);
      return def;
    });
    function place(animate) {
      cards.forEach(function (c) {
        c.g.style.transition = animate ? 'transform .6s ease' : 'none';
        c.g.style.transform = 'translate(' + c.x + 'px,0px)';
      });
    }
    function setJoined(j) {
      joined = j;
      cards.forEach(function (c) {
        c.x = j ? c.joinX : c.splitX;
      });
      root.setAttribute('data-joined', j ? '1' : '0');
      place(true);
      if (onJoin) onJoin(j);
    }
    place(false);
    root.setAttribute('data-joined', '0');
    var drag = null;
    function onMove(e) {
      if (!drag) return;
      var p = MQ.ui.svgPoint(root, e);
      var dx = p.x - drag.p0.x;
      if (Math.abs(dx) > 4) drag.moved = true;
      drag.c.g.style.transition = 'none';
      drag.c.g.style.transform = 'translate(' + (drag.x0 + dx) + 'px,0px)';
    }
    function stop() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    }
    function onUp() {
      if (!drag) return;
      stop();
      drag = null;
      setJoined(!joined);
    }
    cards.forEach(function (c) {
      c.g.style.cursor = 'grab';
      c.g.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        drag = { c: c, p0: MQ.ui.svgPoint(root, e), x0: c.x, moved: false };
        root.appendChild(c.g); // on top while dragging
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointercancel', onUp);
      });
    });
    root.style.touchAction = 'none';
    api.cleanup(stop);
    return {
      el: root,
      // keep the stacking order right after a drag: hundreds bottom, ones top
      fixOrder: function () {
        cards.forEach(function (c) {
          root.appendChild(c.g);
        });
      },
    };
  }

  function learnThreeWays(stage, api) {
    api.lockNext();
    var n = 375;
    var c = digitsOf(n);
    api.say('Here is 375 three ways. Drag a card to slide the cards together!');
    var info = el('div', { class: 'pv-cardsinfo' }, el('span', { class: 'pv-say' }, '300 and 70 and 5'));
    var cards = arrowCards(api, n, function (joined) {
      cards.fixOrder();
      MQ.clear(info);
      if (joined) {
        info.appendChild(el('span', null, '300 + 70 + 5 = ', colouredNumber(n, 'pv-bignum-sm')));
        api.say('Together they make 375. Drag a card again to split it.', 'cheer');
        api.feedback('The cards sit on top of each other: the 7 covers a 0, the 5 covers a 0.', 'good');
        api.unlockNext();
      } else {
        info.appendChild(el('span', { class: 'pv-say' }, '375 = 300 + 70 + 5'));
        api.say('Split again: 300, 70 and 5.');
      }
    });
    stage.appendChild(el('div', { class: 'pv-cardbox' }, cards.el, info));
    var blocks = loosePic(c, 6);
    var ab = abacus(api, { counts: c });
    ab.values();
    stage.appendChild(
      el(
        'div',
        { class: 'pv-ways' },
        el('figure', { class: 'pv-way' }, blocks.el, el('figcaption', null, 'Blocks: 3 hundreds, 7 tens, 5 ones')),
        el('figure', { class: 'pv-way' }, ab.el, el('figcaption', null, 'Abacus: 3, 7 and 5 beads'))
      )
    );
  }

  /* ---------------------------------------------------------------- *
   * Practice deck
   * ---------------------------------------------------------------- */
  var deck = null;

  function buildDeck() {
    var used = {};
    function fresh(gen) {
      for (var i = 0; i < 300; i++) {
        var n = gen();
        if (!used[n]) {
          used[n] = true;
          return n;
        }
      }
      return gen();
    }
    function mk(h, t, o) {
      return h * 100 + t * 10 + o;
    }
    var R = U.rand;
    var q = [];
    // Level 1: read blocks / counters (no zeros, 1-6 pieces per column)
    U.shuffle(['blocks', 'blocks', 'counters']).forEach(function (type) {
      q.push({ type: type, n: fresh(function () {
        return mk(R(1, 6), R(1, 6), R(1, 6));
      }) });
    });
    // Level 2: build with a zero in the tens, build with a zero in the ones, missing part
    var l2 = [
      { type: 'build', n: fresh(function () { return mk(R(1, 9), 0, R(1, 9)); }) },
      { type: 'build', n: fresh(function () { return mk(R(1, 9), R(1, 9), 0); }) },
      { type: 'missing', n: fresh(function () { return mk(R(1, 9), R(1, 9), R(1, 9)); }), blank: U.pick(['h', 't', 't', 'o']) },
    ];
    U.shuffle(l2).forEach(function (x) {
      q.push(x);
    });
    // Level 3: value of a digit, recombine out of order, abacus read or build
    var l3 = [];
    l3.push({
      type: 'value',
      n: fresh(function () {
        var a = U.shuffle(U.range(1, 9));
        return mk(a[0], a[1], a[2]);
      }),
      ring: U.pick(['h', 't', 't', 'o']),
    });
    var withZero = Math.random() < 0.4;
    var zeroAt = U.pick(['t', 'o']);
    var rn = fresh(function () {
      return mk(R(1, 9), withZero && zeroAt === 't' ? 0 : R(1, 9), withZero && zeroAt === 'o' ? 0 : R(1, 9));
    });
    var rd = digitsOf(rn);
    var parts = KINDS.filter(function (k) {
      return rd[k] > 0;
    }).map(function (k) {
      return rd[k] * PLACE[k].val;
    });
    var shuffled = parts;
    for (var i = 0; i < 20; i++) {
      shuffled = U.shuffle(parts);
      if (shuffled[0] !== parts[0]) break; // not starting with the hundreds
    }
    l3.push({ type: 'recombine', n: rn, parts: shuffled });
    var abZero = Math.random() < 0.35 ? U.pick(['t', 'o']) : null;
    l3.push({
      type: U.pick(['abacus-read', 'abacus-build']),
      n: fresh(function () {
        return mk(R(1, 9), abZero === 't' ? 0 : R(1, 9), abZero === 'o' ? 0 : R(1, 9));
      }),
    });
    U.shuffle(l3).forEach(function (x) {
      q.push(x);
    });
    return q;
  }

  /* ---------------------------------------------------------------- *
   * Practice question types
   * ---------------------------------------------------------------- */
  function qReadBlocks(wrap, api, q) {
    var c = digitsOf(q.n);
    api.say('What number do these blocks show?', 'think');
    wrap.appendChild(MQ.ui.prompt('What number is this?'));
    var pic = loosePic(c, 7, { className: 'pv-readpic' });
    wrap.appendChild(el('div', { class: 'pv-picbox' }, pic.el));
    var work = el('div', { class: 'pv-work' });
    var inp = MQ.ui.numberInput({
      onSubmit: function (n) {
        if (n === q.n) {
          inp.good();
          inp.disable();
          api.check(true, countWord(c.h, 'h') + ', ' + countWord(c.t, 't') + ', ' + countWord(c.o, 'o') + ' = ' + q.n + '!');
        } else {
          inp.bad();
          var h = readHint(n, q.n, PIECE, api);
          api.check(false, h.hint, h.tag);
        }
      },
    });
    wrap.appendChild(inp.el);
    wrap.appendChild(work);
    inp.focus();
    api.onReveal(function () {
      inp.setValue(String(q.n));
      inp.good();
      inp.disable();
      pic.labels('h', api, 0);
      pic.labels('t', api, 0);
      pic.labels('o', api, 0);
      work.appendChild(partsRow(c, q.n));
    });
  }

  function qReadCounters(wrap, api, q) {
    var c = digitsOf(q.n);
    api.say('Each counter is worth its column. What number is it?', 'think');
    wrap.appendChild(MQ.ui.prompt('What number do the counters show?'));
    var g = countersGrid(c);
    wrap.appendChild(el('div', { class: 'pv-picbox' }, g.el));
    var work = el('div', { class: 'pv-work' });
    var inp = MQ.ui.numberInput({
      onSubmit: function (n) {
        if (n === q.n) {
          inp.good();
          inp.disable();
          g.reveal();
          api.check(true, 'Yes! ' + q.n + '.');
        } else {
          inp.bad();
          var h = readHint(n, q.n, COUNTER, api);
          api.check(false, h.hint, h.tag);
        }
      },
    });
    wrap.appendChild(inp.el);
    wrap.appendChild(work);
    inp.focus();
    api.onReveal(function () {
      inp.setValue(String(q.n));
      inp.good();
      inp.disable();
      g.reveal();
      work.appendChild(partsRow(c, q.n));
    });
  }

  function qBuild(wrap, api, q) {
    var d = digitsOf(q.n);
    api.say('Build ' + q.n + ' on the mat. Then press Check.', 'think');
    var checkBtn = el('button', { class: 'btn btn-check pv-check', type: 'button' }, 'Check ✓');
    wrap.appendChild(el('div', { class: 'prompt pv-prompt' }, 'Build ', el('span', { class: 'pv-bignum' }, String(q.n)), checkBtn));
    var m = mat(api, { interactive: true, digitsLater: true });
    wrap.appendChild(el('div', { class: 'pv-matwrap' }, m.el));
    var work = el('div', { class: 'pv-work' });
    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var c = m.get();
      if (sameCounts(c, d)) {
        m.lock();
        m.showDigits();
        checkBtn.disabled = true;
        api.check(true, countWord(d.h, 'h') + ', ' + countWord(d.t, 't') + ', ' + countWord(d.o, 'o') + '. That is ' + q.n + '!');
      } else {
        var h = buildHint(c, q.n, PIECE, api);
        api.check(false, h.hint, h.tag);
      }
    });
    wrap.appendChild(work);
    api.onReveal(function () {
      m.set(d);
      m.lock();
      m.showDigits();
      KINDS.forEach(function (k) {
        if (d[k] === 0) m.zeroCol(k);
      });
      checkBtn.disabled = true;
      work.appendChild(partsRow(d, q.n));
    });
  }

  function qMissing(wrap, api, q) {
    var d = digitsOf(q.n);
    var b = q.blank;
    var ans = d[b] * PLACE[b].val;
    api.say('Which part is missing?', 'think');
    var line = el('div', { class: 'prompt pv-misline' });
    line.appendChild(el('span', { class: 'pv-bignum-sm' }, String(q.n)));
    line.appendChild(el('span', { class: 'sum-op' }, ' = '));
    var blankEl = null;
    KINDS.forEach(function (k, i) {
      if (i) line.appendChild(el('span', { class: 'sum-op' }, ' + '));
      if (k === b) {
        blankEl = el('span', { class: 'chip pv-blank' }, '?');
        line.appendChild(blankEl);
      } else line.appendChild(el('span', { class: 'chip pv-chip-' + k }, String(d[k] * PLACE[k].val)));
    });
    wrap.appendChild(line);
    var work = el('div', { class: 'pv-work' });
    var inp = MQ.ui.numberInput({
      onSubmit: function (n) {
        if (n === ans) {
          inp.good();
          inp.disable();
          blankEl.textContent = String(ans);
          blankEl.classList.add('pv-chip-' + b);
          api.check(true, 'Yes! The ' + d[b] + ' in ' + q.n + ' is worth ' + ans + '.');
          return;
        }
        inp.bad();
        var strong = api.tries() >= 1;
        if (n === d[b] && b !== 'o') {
          api.check(false, strong ? countWord(d[b], b) + ': count ' + steps(d[b], b) + '. So it is worth …?' : 'The ' + d[b] + ' is in the ' + PLACE[b].name + ' place. It is worth more than ' + d[b] + '.', 'Gave the digit not its value');
        } else if (KINDS.some(function (k) {
          return k !== b && n === d[b] * PLACE[k].val;
        })) {
          api.check(false, 'Which place is the missing digit in? It is the ' + PLACE[b].name + ' digit, ' + d[b] + '.', 'Mixed up tens and ones');
        } else {
          api.check(false, strong ? q.n + ' is ' + countWord(d.h, 'h') + ', ' + countWord(d.t, 't') + ' and ' + countWord(d.o, 'o') + '. Which one is missing?' : 'Read ' + q.n + ' aloud. Which part is not there yet?', b === 'o' ? 'Mixed up tens and ones' : 'Gave the digit not its value');
        }
      },
    });
    wrap.appendChild(inp.el);
    wrap.appendChild(work);
    inp.focus();
    api.onReveal(function () {
      inp.setValue(String(ans));
      inp.good();
      inp.disable();
      blankEl.textContent = String(ans);
      blankEl.classList.add('pv-chip-' + b);
      var only = {
        h: b === 'h' ? d.h : 0,
        t: b === 't' ? d.t : 0,
        o: b === 'o' ? d.o : 0,
      };
      var pic = loosePic(only, 6);
      work.appendChild(pic.el);
      pic.labels(b, api, 0);
      work.appendChild(el('div', { class: 'pv-say' }, countWord(d[b], b) + ' = ' + ans));
    });
  }

  function qValue(wrap, api, q) {
    var d = digitsOf(q.n);
    var k = q.ring;
    var ans = d[k] * PLACE[k].val;
    api.say('Look at the ringed digit. Which place is it in?', 'think');
    var numEl = el('div', { class: 'pv-ringnum' }, KINDS.map(function (kk) {
      return el('span', { class: 'pv-rd' + (kk === k ? ' pv-ringed' : '') }, String(d[kk]));
    }));
    wrap.appendChild(numEl);
    wrap.appendChild(el('div', { class: 'prompt pv-step' }, '1. The ringed ' + d[k] + ' means…'));
    var opts = KINDS.map(function (kk) {
      return { label: countWord(d[k], kk), value: kk };
    });
    var step2 = el('div', { class: 'pv-step2' });
    var work = el('div', { class: 'pv-work' });
    var inp = null;
    var ch = MQ.ui.choices(opts, function (v) {
      if (v === k) {
        ch.mark(v, 'good');
        ch.disable();
        api.sound('pop');
        api.say(countWord(d[k], k) + '. Now: what is it worth?', 'think');
        api.feedback('', 'info');
        showStep2();
      } else {
        ch.mark(v, 'bad');
        api.check(false, api.tries() >= 1 ? 'Places from the right: ones, tens, hundreds. The ' + d[k] + ' is ' + (k === 'o' ? 'last' : k === 't' ? 'in the middle' : 'first') + '.' : 'Say ' + q.n + ' aloud. Where is the ' + d[k] + '? First, middle or last?', 'Mixed up tens and ones');
      }
    }, { columns: 3 });
    wrap.appendChild(ch);
    wrap.appendChild(step2);
    wrap.appendChild(work);
    function showStep2() {
      if (inp) return;
      step2.appendChild(el('div', { class: 'prompt pv-step' }, '2. So the ' + d[k] + ' is worth:'));
      inp = MQ.ui.numberInput({
        onSubmit: function (n) {
          if (n === ans) {
            inp.good();
            inp.disable();
            api.check(true, countWord(d[k], k) + ' = ' + ans + '. Great!');
            return;
          }
          inp.bad();
          var strong = api.tries() >= 1;
          if (n === d[k] && k !== 'o') {
            api.check(false, strong ? 'Count the ' + PLACE[k].name + ': ' + steps(d[k], k) + '. What is it worth?' : countWord(d[k], k) + ' is not the same as ' + d[k] + '. Count in ' + PLACE[k].val + 's.', 'Gave the digit not its value');
          } else if (KINDS.some(function (kk) {
            return kk !== k && n === d[k] * PLACE[kk].val;
          })) {
            api.check(false, 'That is the value in a different place. It is ' + countWord(d[k], k) + '.', 'Mixed up tens and ones');
          } else {
            api.check(false, k === 'o' ? 'A ones digit is worth just itself: ' + d[k] + ' ones.' : strong ? 'Count in ' + PLACE[k].val + 's: ' + steps(d[k], k) + '.' : 'How many ' + PLACE[k].name + '? Count them in ' + PLACE[k].val + 's.', 'Wrote a label instead of a value');
          }
        },
      });
      step2.appendChild(inp.el);
      inp.focus();
    }
    api.onReveal(function () {
      ch.mark(k, 'good');
      ch.disable();
      showStep2();
      inp.setValue(String(ans));
      inp.good();
      inp.disable();
      var only = { h: k === 'h' ? d.h : 0, t: k === 't' ? d.t : 0, o: k === 'o' ? d.o : 0 };
      var pic = loosePic(only, 6);
      work.appendChild(pic.el);
      pic.labels(k, api, 0);
      work.appendChild(el('div', { class: 'pv-say' }, countWord(d[k], k) + ' = ' + ans));
    });
  }

  function qRecombine(wrap, api, q) {
    var d = digitsOf(q.n);
    api.say('Add the parts. Careful: they are mixed up!', 'think');
    var line = el('div', { class: 'prompt pv-misline' });
    q.parts.forEach(function (p, i) {
      if (i) line.appendChild(el('span', { class: 'sum-op' }, ' + '));
      line.appendChild(el('span', { class: 'chip pv-chip-plain' }, String(p)));
    });
    line.appendChild(el('span', { class: 'sum-op' }, ' = ?'));
    wrap.appendChild(line);
    var work = el('div', { class: 'pv-work' });
    var naive = parseInt(q.parts.map(function (p) {
      return String(p).charAt(0);
    }).join(''), 10);
    var inp = MQ.ui.numberInput({
      onSubmit: function (n) {
        if (n === q.n) {
          inp.good();
          inp.disable();
          api.check(true, 'Yes! ' + q.n + '.');
          return;
        }
        inp.bad();
        var strong = api.tries() >= 1;
        var zk = d.t === 0 ? 't' : d.o === 0 ? 'o' : null;
        if (n > 999) {
          api.check(false, 'Too many digits! ' + q.n + ' is a 3-digit number. Find the hundreds, the tens and the ones.', 'Wrote the parts side by side');
        } else if (zk && n === parseInt(String(q.n).replace('0', ''), 10)) {
          api.check(false, 'There are no ' + PLACE[zk].name + ', so write 0 in the ' + PLACE[zk].name + ' place.', 'Forgot the zero place holder');
        } else if (n === naive) {
          api.check(false, strong ? 'Hundreds first: ' + d.h * 100 + '. Then the tens, then the ones.' : 'You wrote the digits in the order they came. Which part is the hundreds?', 'Put the parts in the wrong places');
        } else if (d.t !== d.o && n === d.h * 100 + d.o * 10 + d.t) {
          api.check(false, 'Check the tens and the ones. Which part is the tens?', 'Mixed up tens and ones');
        } else {
          api.check(false, strong ? 'Find the hundreds: ' + d.h * 100 + '. Then add the rest.' : 'Find the hundreds part first, then the tens, then the ones.', 'Put the parts in the wrong places');
        }
      },
    });
    wrap.appendChild(inp.el);
    wrap.appendChild(work);
    inp.focus();
    api.onReveal(function () {
      inp.setValue(String(q.n));
      inp.good();
      inp.disable();
      var tbl = el('div', { class: 'pv-hto' });
      KINDS.forEach(function (k) {
        tbl.appendChild(el('div', { class: 'pv-hto-h pv-chip-' + k }, PLACE[k].Name));
      });
      KINDS.forEach(function (k) {
        tbl.appendChild(el('div', { class: 'pv-hto-d pv-dig-' + k }, String(d[k])));
      });
      work.appendChild(el('div', { class: 'pv-say' }, 'Put them in order: hundreds, tens, ones.'));
      work.appendChild(partsRow(d, q.n));
      work.appendChild(tbl);
    });
  }

  function qAbacusRead(wrap, api, q) {
    var d = digitsOf(q.n);
    api.say('What number is on the abacus?', 'think');
    wrap.appendChild(MQ.ui.prompt('What number does the abacus show?'));
    var ab = abacus(api, { counts: d });
    wrap.appendChild(el('div', { class: 'pv-picbox' }, ab.el));
    var work = el('div', { class: 'pv-work' });
    var inp = MQ.ui.numberInput({
      onSubmit: function (n) {
        if (n === q.n) {
          inp.good();
          inp.disable();
          ab.values();
          api.check(true, 'Yes! ' + q.n + '.');
        } else {
          inp.bad();
          var h = readHint(n, q.n, BEAD, api);
          api.check(false, h.hint, h.tag);
        }
      },
    });
    wrap.appendChild(inp.el);
    wrap.appendChild(work);
    inp.focus();
    api.onReveal(function () {
      inp.setValue(String(q.n));
      inp.good();
      inp.disable();
      ab.values();
      work.appendChild(partsRow(d, q.n));
    });
  }

  function qAbacusBuild(wrap, api, q) {
    var d = digitsOf(q.n);
    api.say('Put beads on the abacus to show ' + q.n + '.', 'think');
    wrap.appendChild(el('div', { class: 'prompt pv-prompt' }, 'Show ', el('span', { class: 'pv-bignum' }, String(q.n)), ' on the abacus'));
    var ab = abacus(api, { interactive: true });
    wrap.appendChild(el('div', { class: 'pv-picbox' }, ab.el));
    var work = el('div', { class: 'pv-work' });
    var checkBtn = el('button', { class: 'btn btn-check pv-check', type: 'button' }, 'Check ✓');
    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var c = ab.get();
      if (sameCounts(c, d)) {
        ab.lock();
        ab.values();
        checkBtn.disabled = true;
        api.check(true, 'Yes! ' + q.n + ' on the abacus.');
      } else {
        var h = buildHint(c, q.n, BEAD, api);
        api.check(false, h.hint, h.tag);
      }
    });
    wrap.appendChild(checkBtn);
    wrap.appendChild(work);
    api.onReveal(function () {
      ab.set(d);
      ab.lock();
      ab.values();
      checkBtn.disabled = true;
      work.appendChild(partsRow(d, q.n));
    });
  }

  var TYPES = {
    blocks: qReadBlocks,
    counters: qReadCounters,
    build: qBuild,
    missing: qMissing,
    value: qValue,
    recombine: qRecombine,
    'abacus-read': qAbacusRead,
    'abacus-build': qAbacusBuild,
  };

  MQ.register('place-value-builder', {
    learn: [learnShop, learnBuild, learnSpotlight, learnThreeWays],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0 || !deck[api.index]) deck = buildDeck();
        var q = deck[api.index];
        var wrap = el('div', { class: 'pv-q', 'data-type': q.type, 'data-answer': String(q.n) });
        if (q.blank) wrap.setAttribute('data-blank', q.blank);
        if (q.ring) wrap.setAttribute('data-ring', q.ring);
        stage.appendChild(wrap);
        TYPES[q.type](wrap, api, q);
      },
    },
  });

  var css = [
    '.pv-q{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.pv-mat,.pv-loose,.pv-shop,.pv-cards,.pv-abacus,.pv-cgrid{display:block;user-select:none;-webkit-user-select:none}',
    '.pv-matwrap{width:100%;display:flex;justify-content:center}',
    '.pv-matwrap-sm .pv-mat{max-width:620px !important}',
    '.pv-way .pv-abacus{width:230px}',
    '.pv-prompt .pv-check{margin-left:14px;align-self:center}',
    '.pv-col{stroke:var(--line);stroke-width:2;transition:fill .25s}',
    '.pv-col-h{fill:#eef6fc}.pv-col-t{fill:#eff8ea}.pv-col-o{fill:#fff7e3}',
    '.pv-col.pv-lit{stroke:var(--ink);stroke-width:4}',
    '.pv-col-h.pv-lit{fill:#cfe7f7}.pv-col-t.pv-lit{fill:#d6efc7}.pv-col-o.pv-lit{fill:#ffe7a8}',
    '.pv-col.pv-col-target{stroke:var(--accent);stroke-width:4;stroke-dasharray:8 5}',
    '.pv-col.pv-col-zero{stroke:#e76f00;stroke-width:4;stroke-dasharray:10 6}',
    '.pv-colhead{font-size:20px;font-weight:800;fill:var(--ink)}',
    '.pv-tray{fill:#f4f1ea;stroke:#d8cfbd;stroke-width:2}',
    '.pv-traylab{font-size:20px;font-weight:800;fill:var(--ink-soft)}',
    '.pv-hit{fill:transparent}',
    '.pv-blk-h .pv-fill{fill:#8ecae6}.pv-blk-h .pv-edge,.pv-blk-h .pv-gridline{stroke:#1d6fa5}',
    '.pv-blk-t .pv-fill{fill:#a7d58a}.pv-blk-t .pv-edge,.pv-blk-t .pv-gridline{stroke:#3d7a1f}',
    '.pv-blk-o .pv-fill{fill:#ffcf5c}.pv-blk-o .pv-edge{stroke:#a87400}',
    '.pv-edge{fill:none;stroke-width:1.6}.pv-gridline{fill:none;stroke-width:.7;opacity:.65}',
    '.pv-src,.pv-piece{cursor:grab}',
    '.pv-src:hover .pv-fill{filter:brightness(1.08)}',
    '.pv-piece:hover .pv-edge{stroke-width:3}',
    '.pv-locked .pv-piece{cursor:default}',
    '.pv-lifted{opacity:.3}',
    '.pv-ghost{pointer-events:none;opacity:.85}',
    '.pv-pulse{animation:pv-pulse 1s ease-in-out 3}',
    '@keyframes pv-pulse{50%{opacity:.4}}',
    '.pv-countlab{font-size:15px;font-weight:800;paint-order:stroke;stroke:#fff;stroke-width:4px;transition:opacity .2s}',
    '.pv-countlab-h{font-size:20px;fill:#0b4f7d}.pv-countlab-t{fill:#2d5e13}.pv-countlab-o{fill:#8a5d00}',
    '.pv-dbox{fill:#fff;stroke:var(--line);stroke-width:2}',
    '.pv-dtext{font-size:34px;font-weight:800;fill:var(--ink)}',
    '.pv-dbox.pv-dzero{fill:#fff1e0;stroke:#e76f00;stroke-width:3}',
    '.pv-dtext.pv-dzero-t{fill:#c25400}',
    '.pv-bignum{font-size:2.2rem;font-weight:800;letter-spacing:.04em}',
    '.pv-bignum-sm{font-size:1.6rem;font-weight:800}',
    '.pv-dig-h{color:#1d6fa5}.pv-dig-t{color:#3d7a1f}.pv-dig-o{color:#a06a00}',
    '.pv-prompt{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;justify-content:center;margin:0}',
    '.pv-say{font-size:1.1rem;font-weight:700;color:var(--ink-soft)}',
    '.chip.pv-chip-h,.pv-hto-h.pv-chip-h{background:#d8ecf8;color:#0b4f7d}',
    '.chip.pv-chip-t,.pv-hto-h.pv-chip-t{background:#dcf0cf;color:#2d5e13}',
    '.chip.pv-chip-o,.pv-hto-h.pv-chip-o{background:#ffefc2;color:#7a5200}',
    '.pv-eq .pv-slot{min-width:64px;text-align:center}',
    '.pv-slot.pv-filled{animation:pv-pop .4s ease}',
    '@keyframes pv-pop{50%{transform:scale(1.2)}}',
    '.pv-box{fill:#f3e2c7;stroke:#9c6b30;stroke-width:2}',
    '.pv-bag{fill:#fde6ee;stroke:#c2577a;stroke-width:2}',
    '.pv-tray-loose{fill:#f7f7f7;stroke:#cfcfcf;stroke-width:2;stroke-dasharray:6 4}',
    '.pv-sweet-h{fill:#e85d75}.pv-sweet-t{fill:#9b5de5}.pv-sweet-o{fill:#f08c00}',
    '.pv-sweet-big{r:6px}',
    '.pv-shoplab{font-size:17px;font-weight:800;fill:var(--ink)}',
    '.pv-group{cursor:pointer}',
    '.pv-group.pv-next{animation:pv-glow 1.2s ease-in-out infinite}',
    '@keyframes pv-glow{50%{filter:drop-shadow(0 0 7px #ffb703) drop-shadow(0 0 3px #ffb703)}}',
    '.pv-group.pv-done{opacity:.9}',
    '.pv-spot{display:flex;gap:18px;align-items:center;justify-content:center;flex-wrap:wrap;width:100%}',
    '.pv-spot-left{display:flex;flex-direction:column;align-items:center;gap:12px}',
    '.pv-digitbtns{display:flex;gap:8px}',
    '.pv-digit{font:inherit;font-size:3rem;font-weight:800;width:76px;height:92px;border-radius:16px;border:3px solid var(--line);background:#fff;cursor:pointer}',
    '.pv-digit:hover{border-color:var(--accent)}',
    '.pv-digit.pv-on{border-color:var(--ink);background:var(--paper-2);transform:translateY(-3px)}',
    '.pv-valuecard{min-width:220px;min-height:96px;text-align:center;background:var(--paper);border:2px solid var(--line);border-radius:14px;padding:10px 14px}',
    '.pv-vc-label{font-size:1.15rem;font-weight:700;color:var(--ink-soft)}',
    '.pv-vc-value{font-size:2rem;font-weight:800}',
    '.pv-cardbox{display:flex;flex-direction:column;align-items:center;gap:4px;width:100%}',
    '.pv-card{cursor:grab}',
    '.pv-card-body{stroke-width:2.5}',
    '.pv-card-h .pv-card-body{fill:#d8ecf8;stroke:#1d6fa5}.pv-card-t .pv-card-body{fill:#dcf0cf;stroke:#3d7a1f}.pv-card-o .pv-card-body{fill:#ffefc2;stroke:#a06a00}',
    '.pv-card-text{font-size:44px;font-weight:800;fill:var(--ink)}',
    '.pv-cardsinfo{font-size:1.2rem;font-weight:800;min-height:2.2rem}',
    '.pv-ways{display:flex;gap:20px;justify-content:center;align-items:flex-end;flex-wrap:wrap;width:100%}',
    '.pv-way{margin:0;display:flex;flex-direction:column;align-items:center;gap:6px;background:#fff;border:2px solid var(--line);border-radius:14px;padding:10px;max-width:100%}',
    '.pv-way figcaption{font-weight:700;color:var(--ink-soft)}',
    '.pv-ab-base{fill:#9c6b30}',
    '.pv-ab-spike{stroke:#6b4b25;stroke-width:5;stroke-linecap:round}',
    '.pv-ab-lab{font-size:24px;font-weight:800;fill:var(--ink)}',
    '.pv-ab-val{font-size:20px;font-weight:800;fill:var(--ink);paint-order:stroke;stroke:#fff;stroke-width:5px}',
    '.pv-bead{stroke-width:2}',
    '.pv-bead-h{fill:#8ecae6;stroke:#1d6fa5}.pv-bead-t{fill:#a7d58a;stroke:#3d7a1f}.pv-bead-o{fill:#ffcf5c;stroke:#a87400}',
    '.pv-ab-btn{cursor:pointer}',
    '.pv-ab-btn circle{fill:#fff;stroke:var(--accent);stroke-width:3}',
    '.pv-ab-btn:hover circle{fill:var(--paper-2)}',
    '.pv-ab-btn text{font-size:26px;font-weight:800;fill:var(--ink);pointer-events:none}',
    '.pv-locked .pv-ab-btn{opacity:.35;cursor:default}',
    '.pv-cg-head{fill:var(--paper-2);stroke:var(--ink-soft);stroke-width:2}',
    '.pv-cg-cell{fill:#fff;stroke:var(--ink-soft);stroke-width:2}',
    '.pv-counter{fill:#c77dff;stroke:#7b2cbf;stroke-width:2}',
    '.pv-cg-val{font-size:18px;font-weight:800;fill:var(--good)}',
    '.pv-picbox{background:#fff;border:2px solid var(--line);border-radius:14px;padding:8px;max-width:100%}',
    '.pv-work{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.pv-work:empty{display:none}',
    '.pv-work .pv-loose{max-width:100%}',
    '.pv-misline{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px}',
    '.pv-misline .chip{font-size:1.5rem}',
    '.pv-blank{min-width:70px;text-align:center;border:3px dashed var(--accent);background:#fff}',
    '.pv-chip-plain{background:var(--paper-2)}',
    '.pv-ringnum{font-size:4rem;font-weight:800;letter-spacing:.12em;display:flex;gap:6px}',
    '.pv-rd{display:inline-block;width:1.1em;text-align:center}',
    '.pv-ringed{border:5px solid #e76f00;border-radius:50%}',
    '.pv-step{font-size:1.2rem;margin:0}',
    '.pv-step2{display:flex;flex-direction:column;align-items:center;gap:8px}',
    '.pv-hto{display:grid;grid-template-columns:repeat(3,96px);gap:4px;text-align:center}',
    '.pv-hto-h{font-weight:800;border-radius:8px;padding:4px}',
    '.pv-hto-d{font-size:2rem;font-weight:800;background:#fff;border:2px solid var(--line);border-radius:8px}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'place-value-builder' }, css));
})();

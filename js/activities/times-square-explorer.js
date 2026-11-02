/* Times Square Explorer — read and build the 10 × 10 multiplication square (Unit 11.1).
 * Every product is shown as an array of dots (rows × columns), with counting in jumps as the
 * bridge. Turn-arounds (3 × 8 = 8 × 3), reading divisions from the square, and fact families.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;
  var ID = 'times-square-explorer';

  /* ---------------------------------------------------------------- *
   * Small helpers
   * ---------------------------------------------------------------- */

  function range(a, b) {
    var out = [];
    for (var i = a; i <= b; i++) out.push(i);
    return out;
  }

  /** "8, 16, 24" — the first n jumps of size c. */
  function jumps(c, n) {
    var out = [];
    for (var k = 1; k <= n; k++) out.push(c * k);
    return out;
  }

  /** Kind hint for a wrong product. tries = wrong tries before this one. */
  function productHint(r, c, v, tries) {
    var first = jumps(c, Math.max(1, Math.min(r - 1, 3))).join(', ');
    var jumpLine = 'Count along in jumps of ' + c + ', ' + r + ' times: ' + first + ' …';
    var near = [(r - 1) * c, (r + 1) * c, r * (c - 1), r * (c + 1)];
    if (v === r + c) {
      return {
        tag: 'Added instead of multiplied',
        msg: 'That is ' + r + ' + ' + c + '. Times means ' + r + ' rows of ' + c + '. ' + (tries >= 1 ? jumpLine : 'Count along the row in jumps of ' + c + '.'),
      };
    }
    if (near.indexOf(v) !== -1 && v > 0) {
      return {
        tag: 'Read the wrong row or column',
        msg: 'So close! That is the number next door. Finger on row ' + r + ', finger on column ' + c + ', slide them together.' + (tries >= 1 ? ' ' + jumpLine : ''),
      };
    }
    return {
      tag: 'Times fact not known yet',
      msg: tries >= 1 ? jumpLine : 'Look at the dots: ' + r + ' rows of ' + c + '. Count along the row in jumps of ' + c + '.',
    };
  }

  /* ---------------------------------------------------------------- *
   * The multiplication square (any set of row and column headings)
   * ---------------------------------------------------------------- */

  function square(o) {
    o = o || {};
    var rows = o.rows || range(1, 10);
    var cols = o.cols || range(1, 10);
    var cs = o.cell || 44;
    var W = cs * (cols.length + 1);
    var H = cs * (rows.length + 1);
    var extra = o.extraRight || 0;
    W += extra;
    var root = svg('svg', {
      viewBox: '-2 -2 ' + (W + 4) + ' ' + (H + 4),
      class: 'tse-square' + (o.cls ? ' ' + o.cls : ''),
      width: W + 4,
      height: H + 4,
      style: { maxWidth: '100%', height: 'auto' },
    });
    var fs = Math.round(cs * 0.44);
    var cells = {};
    var rowHeads = {};
    var colHeads = {};

    function box(x, y, cls, text, attrs) {
      var g = svg('g', attrs || {});
      var rect = svg('rect', { x: x, y: y, width: cs, height: cs, class: cls });
      var t = svg('text', { x: x + cs / 2, y: y + cs / 2 + fs * 0.36, 'text-anchor': 'middle', class: 'tse-num', 'font-size': fs }, text);
      g.appendChild(rect);
      g.appendChild(t);
      root.appendChild(g);
      return { g: g, rect: rect, text: t };
    }

    box(0, 0, 'tse-corner', '×');
    cols.forEach(function (c, ci) {
      colHeads[c] = box(cs * (ci + 1), 0, 'tse-head', String(c), { 'data-head': 'c' + c });
    });
    rows.forEach(function (r, ri) {
      rowHeads[r] = box(0, cs * (ri + 1), 'tse-head', String(r), { 'data-head': 'r' + r });
      cols.forEach(function (c, ci) {
        var blank = o.blank ? o.blank(r, c) : false;
        var b = box(cs * (ci + 1), cs * (ri + 1), 'tse-sq' + (blank ? ' tse-blank' : '') + (o.diagonal && r === c ? ' tse-diagcell' : ''), blank ? '?' : String(r * c), { 'data-r': r, 'data-c': c, class: 'tse-cell' });
        b.r = r;
        b.c = c;
        if (blank) b.text.classList.add('tse-q');
        cells[r + 'x' + c] = b;
      });
    });
    if (o.diagonal) {
      var n = Math.min(rows.length, cols.length);
      root.appendChild(svg('line', { x1: cs, y1: cs, x2: cs * (n + 1), y2: cs * (n + 1), class: 'tse-diag' }));
    }
    var overlay = svg('g', { class: 'tse-overlay' });
    root.appendChild(overlay);

    var sq = {
      svg: root,
      overlay: overlay,
      cs: cs,
      rows: rows,
      cols: cols,
      cell: function (r, c) {
        return cells[r + 'x' + c];
      },
      rowHead: function (r) {
        return rowHeads[r];
      },
      colHead: function (c) {
        return colHeads[c];
      },
      center: function (r, c) {
        var ri = rows.indexOf(r);
        var ci = cols.indexOf(c);
        return { x: cs * (ci + 1) + cs / 2, y: cs * (ri + 1) + cs / 2 };
      },
      setText: function (r, c, t, cls) {
        var b = cells[r + 'x' + c];
        b.text.textContent = String(t);
        b.text.classList.remove('tse-q');
        b.rect.classList.remove('tse-blank');
        if (cls) b.rect.classList.add(cls);
      },
      /** Light the path from the headings to cell (r, c): "slide your fingers together". */
      light: function (r, c) {
        sq.unlight();
        rows.forEach(function (rr) {
          cols.forEach(function (cc) {
            var b = cells[rr + 'x' + cc];
            if ((rr === r && cols.indexOf(cc) <= cols.indexOf(c)) || (cc === c && rows.indexOf(rr) <= rows.indexOf(r))) b.rect.classList.add('tse-path');
          });
        });
        if (cells[r + 'x' + c]) cells[r + 'x' + c].rect.classList.add('tse-target');
        if (rowHeads[r]) rowHeads[r].rect.classList.add('tse-head-on');
        if (colHeads[c]) colHeads[c].rect.classList.add('tse-head-on');
      },
      unlight: function () {
        Object.keys(cells).forEach(function (k) {
          cells[k].rect.classList.remove('tse-path', 'tse-target');
        });
        Object.keys(rowHeads).forEach(function (k) {
          rowHeads[k].rect.classList.remove('tse-head-on');
        });
        Object.keys(colHeads).forEach(function (k) {
          colHeads[k].rect.classList.remove('tse-head-on');
        });
      },
      /** Hover and click on body cells. */
      on: function (hover, click, leave) {
        root.classList.add('tse-live');
        root.addEventListener('mouseover', function (e) {
          var g = e.target.closest && e.target.closest('[data-r]');
          if (g && hover) hover(+g.getAttribute('data-r'), +g.getAttribute('data-c'));
        });
        root.addEventListener('mouseleave', function () {
          if (leave) leave();
        });
        root.addEventListener('click', function (e) {
          var g = e.target.closest && e.target.closest('[data-r]');
          if (g && click) click(+g.getAttribute('data-r'), +g.getAttribute('data-c'));
        });
      },
    };
    return sq;
  }

  /* ---------------------------------------------------------------- *
   * Dot arrays: r rows of c dots, drawn exactly
   * ---------------------------------------------------------------- */

  function dots(r, c, o) {
    o = o || {};
    var sp = o.sp || 28;
    var rad = sp * 0.36;
    var totW = o.totals ? sp * 2.2 : 0;
    var split = o.split || 0; // gap after this many rows (doubling picture)
    var gap = split ? sp * 0.6 : 0;
    var W = c * sp + 8 + totW;
    var H = r * sp + 8 + gap;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'tse-dots', style: { maxWidth: '100%', height: 'auto' } });
    var rowEls = [];
    var totals = [];
    for (var i = 0; i < r; i++) {
      var y = 4 + i * sp + sp / 2 + (split && i >= split ? gap : 0);
      var g = svg('g', { class: 'tse-dotrow' + (split && i >= split ? ' tse-dotrow-b' : '') });
      g.appendChild(svg('rect', { x: 2, y: y - sp / 2 + 1, width: c * sp + 4, height: sp - 2, rx: sp / 2.4, class: 'tse-rowband' }));
      for (var j = 0; j < c; j++) g.appendChild(svg('circle', { cx: 4 + j * sp + sp / 2, cy: y, r: rad, class: 'tse-dot' }));
      root.appendChild(g);
      rowEls.push(g);
      if (o.totals) {
        var t = svg('text', { x: c * sp + 8 + sp * 0.35, y: y + sp * 0.22, class: 'tse-total', 'font-size': Math.round(sp * 0.62) }, '');
        root.appendChild(t);
        totals.push(t);
      }
    }
    if (split) root.appendChild(svg('line', { x1: 0, y1: 4 + split * sp + gap / 2, x2: c * sp + 8, y2: 4 + split * sp + gap / 2, class: 'tse-splitline' }));
    return {
      svg: root,
      rows: rowEls,
      /** Light the rows one after another with the running total. */
      count: function (api, step, done) {
        rowEls.forEach(function (g, i) {
          api.later(function () {
            g.classList.add('tse-lit');
            if (totals[i]) totals[i].textContent = String((i + 1) * c);
            api.sound('pop');
          }, step * (i + 1));
        });
        if (done) api.later(done, step * r + 250);
      },
      showAll: function () {
        rowEls.forEach(function (g, i) {
          g.classList.add('tse-lit');
          if (totals[i]) totals[i].textContent = String((i + 1) * c);
        });
      },
    };
  }

  /** "8 → 16 → 24" chips for counting in jumps. */
  function jumpChips(c, r) {
    var row = el('div', { class: 'sum-row tse-jumps' });
    row.appendChild(el('span', { class: 'tse-jlabel' }, 'Jumps of ' + c + ':'));
    jumps(c, r).forEach(function (n, i) {
      if (i) row.appendChild(el('span', { class: 'sum-op' }, '→'));
      row.appendChild(el('span', { class: 'chip' + (i === r - 1 ? ' chip-total' : '') }, String(n)));
    });
    return row;
  }

  /** Panel with a caption and an array. */
  function arrayPanel(r, c, o) {
    o = o || {};
    var sp = o.sp || (Math.max(r, c) >= 9 ? 22 : Math.max(r, c) >= 7 ? 25 : 30);
    var d = dots(r, c, { sp: sp, totals: o.totals, split: o.split });
    var cap = el('div', { class: 'tse-cap' }, el('b', null, r + (r === 1 ? ' row' : ' rows') + ' of ' + c), o.product ? '  →  ' + r + ' × ' + c + ' = ' + r * c : '');
    var wrap = el('div', { class: 'tse-arr' }, cap, el('div', { class: 'tse-arr-pic' }, d.svg));
    wrap.dots = d;
    return wrap;
  }

  /* ---------------------------------------------------------------- *
   * Number cards and frames: drag or click a card into a frame
   * ---------------------------------------------------------------- */

  function slot() {
    var s = { el: el('span', { class: 'tse-slot', tabindex: '0', role: 'button', 'aria-label': 'empty box' }, ''), value: null, locked: false };
    return s;
  }

  function setSlot(s, v) {
    s.value = v;
    s.el.textContent = v == null ? '' : String(v);
    s.el.classList.toggle('tse-filled', v != null);
  }

  /**
   * cards: values; slots: list from slot(); onPlace(slot, value) returns false to refuse.
   * Click a card to drop it into the glowing frame (then the next empty frame glows),
   * or drag it onto any frame.
   */
  function cardKit(api, values, slots, onPlace) {
    var kit = { disabled: false, slots: slots, active: null };
    var row = el('div', { class: 'tse-cards' });
    kit.el = row;

    function nextEmpty(after) {
      var start = after ? slots.indexOf(after) + 1 : 0;
      for (var k = 0; k < slots.length; k++) {
        var s = slots[(start + k) % slots.length];
        if (s.value == null && !s.locked) return s;
      }
      return null;
    }
    function setActive(s) {
      kit.active = s;
      slots.forEach(function (x) {
        x.el.classList.toggle('tse-active', x === s && !kit.disabled);
      });
    }
    function place(s, v) {
      if (!s || s.locked || kit.disabled) return;
      if (onPlace && onPlace(s, v) === false) return;
      setSlot(s, v);
      api.sound('pop');
      setActive(nextEmpty(s));
    }
    kit.place = place;
    kit.setActive = setActive;
    kit.refresh = function () {
      setActive(kit.active && kit.active.value == null && !kit.active.locked ? kit.active : nextEmpty(null));
    };
    kit.disable = function () {
      kit.disabled = true;
      setActive(null);
      row.classList.add('tse-off');
      kit.buttons.forEach(function (b) {
        b.disabled = true;
      });
    };
    slots.forEach(function (s) {
      function pick() {
        if (kit.disabled || s.locked) return;
        setActive(s);
      }
      s.el.addEventListener('click', pick);
      s.el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pick();
        }
      });
    });

    var ghost = null;
    function dropGhost() {
      if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
      ghost = null;
    }
    api.cleanup(dropGhost);

    kit.buttons = values.map(function (v) {
      var b = el('button', { class: 'tse-card', type: 'button', 'data-v': v }, String(v));
      var start = null;
      var dragging = false;
      var justDragged = false;
      b.style.touchAction = 'none';
      b.addEventListener('pointerdown', function (e) {
        if (kit.disabled) return;
        start = { x: e.clientX, y: e.clientY };
        dragging = false;
        try {
          b.setPointerCapture(e.pointerId);
        } catch (err) {}
      });
      b.addEventListener('pointermove', function (e) {
        if (!start) return;
        if (!dragging && Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y) > 8) {
          dragging = true;
          dropGhost();
          ghost = el('div', { class: 'tse-card tse-ghost' }, String(v));
          document.body.appendChild(ghost);
        }
        if (dragging && ghost) {
          ghost.style.left = e.clientX - 28 + 'px';
          ghost.style.top = e.clientY - 28 + 'px';
        }
      });
      function up(e) {
        if (!start) return;
        start = null;
        if (!dragging) return;
        dragging = false;
        justDragged = true;
        dropGhost();
        var under = document.elementFromPoint(e.clientX, e.clientY);
        var target = under && under.closest ? under.closest('.tse-slot') : null;
        var s = target ? slots.filter(function (x) { return x.el === target; })[0] : null;
        if (s) place(s, v);
      }
      b.addEventListener('pointerup', up);
      b.addEventListener('pointercancel', function () {
        start = null;
        dragging = false;
        dropGhost();
      });
      b.addEventListener('click', function () {
        if (justDragged) {
          justDragged = false;
          return;
        }
        if (kit.disabled) return;
        place(kit.active || nextEmpty(null), v);
      });
      row.appendChild(b);
      return b;
    });
    kit.refresh();
    return kit;
  }

  /** One sentence frame: parts are slot objects or strings. */
  function sentence(parts) {
    var row = el('div', { class: 'tse-sent' });
    parts.forEach(function (p) {
      if (typeof p === 'object') row.appendChild(p.el);
      else if (p === '×' || p === '÷' || p === '=') row.appendChild(el('span', { class: 'tse-op' }, p));
      else row.appendChild(el('span', { class: 'tse-given' }, String(p)));
    });
    return row;
  }

  /* ---------------------------------------------------------------- *
   * Soup tins on a shelf (learn screen 1)
   * ---------------------------------------------------------------- */

  function shelf(rows, cols) {
    var tw = 44;
    var th = 58;
    var gapX = 10;
    var rowH = 84;
    var left = 16;
    var W = left + cols * (tw + gapX) + 90;
    var H = rows * rowH + 14;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'tse-shelf', style: { maxWidth: '100%', height: 'auto' } });
    root.appendChild(svg('rect', { x: 4, y: 2, width: left + cols * (tw + gapX) - 2, height: H - 4, rx: 8, class: 'tse-shelf-back' }));
    var bands = [];
    var totals = [];
    for (var r = 0; r < rows; r++) {
      var y0 = 8 + r * rowH;
      var band = svg('rect', { x: 8, y: y0, width: left + cols * (tw + gapX) - 10, height: th + 8, rx: 8, class: 'tse-shelf-band' });
      root.appendChild(band);
      bands.push(band);
      for (var c = 0; c < cols; c++) {
        var x = left + c * (tw + gapX);
        var y = y0 + 6;
        var g = svg('g', { class: 'tse-tin' });
        g.appendChild(svg('rect', { x: x, y: y + 4, width: tw, height: th - 8, class: 'tse-tin-body' }));
        g.appendChild(svg('rect', { x: x, y: y + th * 0.3, width: tw, height: th * 0.38, class: 'tse-tin-label' }));
        g.appendChild(svg('ellipse', { cx: x + tw / 2, cy: y + th - 4, rx: tw / 2, ry: 4, class: 'tse-tin-body' }));
        g.appendChild(svg('ellipse', { cx: x + tw / 2, cy: y + 4, rx: tw / 2, ry: 4, class: 'tse-tin-top' }));
        g.appendChild(svg('circle', { cx: x + tw / 2, cy: y + th * 0.49, r: 5, class: 'tse-tin-dot' }));
        root.appendChild(g);
      }
      root.appendChild(svg('rect', { x: 4, y: y0 + th + 8, width: left + cols * (tw + gapX) - 2, height: 9, rx: 3, class: 'tse-plank' }));
      var t = svg('text', { x: left + cols * (tw + gapX) + 16, y: y0 + th / 2 + 14, class: 'tse-total', 'font-size': 32 }, '');
      root.appendChild(t);
      totals.push(t);
    }
    return { svg: root, bands: bands, totals: totals };
  }

  /* ---------------------------------------------------------------- *
   * Practice deck
   * ---------------------------------------------------------------- */

  var L1_SET = [2, 3, 4, 5, 10];
  var FAMILY_PAIRS = [
    [4, 7],
    [8, 9],
    [6, 8],
    [3, 8],
    [4, 8],
    [3, 5],
    [3, 7],
    [5, 7],
    [2, 9],
    [4, 9],
    [3, 6],
    [4, 6],
  ];

  function key(a, b) {
    return Math.min(a, b) + 'x' + Math.max(a, b);
  }

  function buildDeck() {
    var used = {};
    var products = {};
    var deck = [];
    // Level 1: blank cell in a mini square (rows/columns 1-5 and 10), products up to 50.
    var l1 = [];
    L1_SET.forEach(function (a) {
      L1_SET.forEach(function (b) {
        if (a <= b && !(a === 10 && b === 10)) l1.push([a, b]);
      });
    });
    U.shuffle(l1)
      .slice(0, 3)
      .forEach(function (p) {
        var flip = Math.random() < 0.5;
        var r = flip ? p[1] : p[0];
        var c = flip ? p[0] : p[1];
        used[key(r, c)] = true;
        deck.push({ type: 'cell', level: 1, r: r, c: c, ans: r * c });
      });
    // Level 2: blank cell in the 2, 3, 4, 5 or 10 row/column (or its turn-around), other factor 2-10.
    var tries = 0;
    while (deck.length < 5 && tries++ < 500) {
      var a = U.pick(L1_SET);
      var b = Math.random() < 0.75 ? U.rand(6, 9) : U.rand(2, 10);
      if (used[key(a, b)]) continue;
      used[key(a, b)] = true;
      var flip2 = Math.random() < 0.5;
      deck.push({ type: 'cell', level: 2, r: flip2 ? b : a, c: flip2 ? a : b, ans: a * b });
    }
    // Level 2, last item: "double the row" (workbook): 3 row -> 6 row or 4 row -> 8 row.
    var from = U.pick([3, 4]);
    var col = U.rand(3, 9);
    deck.push({ type: 'double', level: 2, from: from, to: from * 2, c: col, base: from * col, ans: from * 2 * col });
    // Level 3: fact families for non-square products.
    U.shuffle(FAMILY_PAIRS).forEach(function (p) {
      if (deck.length >= 9) return;
      var P = p[0] * p[1];
      if (products[P] || used[key(p[0], p[1])]) return;
      products[P] = true;
      used[key(p[0], p[1])] = true;
      var flip3 = Math.random() < 0.5;
      deck.push({ type: 'family', level: 3, r: flip3 ? p[1] : p[0], c: flip3 ? p[0] : p[1], P: P });
    });
    return deck;
  }

  var deck = null;

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */

  function learnShelf(stage, api) {
    api.lockNext();
    api.say('Soup tins on a shop shelf! How many tins are there?');
    stage.appendChild(MQ.ui.lesson('Tins in rows', '3 rows of tins. 8 tins in each row.'));
    var sh = shelf(3, 8);
    var out = el('div', { class: 'tse-after' });
    var btn = el('button', { class: 'btn tse-go', type: 'button' }, 'Count in rows ▶');
    stage.appendChild(el('div', { class: 'tse-pic' }, sh.svg));
    stage.appendChild(btn);
    stage.appendChild(out);
    btn.addEventListener('click', function () {
      btn.disabled = true;
      sh.bands.forEach(function (b, i) {
        api.later(function () {
          b.classList.add('tse-lit');
          sh.totals[i].textContent = String((i + 1) * 8);
          api.sound('pop');
          api.say(i === 0 ? '8…' : i === 1 ? '…16…' : '…24 tins!', 'think');
        }, 900 * (i + 1));
      });
      api.later(function () {
        btn.style.display = 'none';
        var d = dots(3, 8, { sp: 34 });
        d.showAll();
        out.appendChild(MQ.ui.sum([8, 8, 8], 24));
        out.appendChild(el('div', { class: 'tse-row' }, el('div', { class: 'tse-pic' }, d.svg), el('div', { class: 'tse-big' }, '3 × 8 = ', el('b', null, '24'))));
        api.say('Each tin is a dot. 3 rows of 8 is 3 × 8 = 24.', 'cheer');
        api.feedback('3 rows of 8: count in jumps of 8 → 8, 16, 24. So 3 × 8 = 24.', 'good');
        api.unlockNext();
      }, 900 * 3 + 600);
    });
  }

  function learnSquare(stage, api) {
    api.lockNext();
    api.say('This is the times square. Point at any box to see its dots!');
    var targets = [
      [4, 2],
      [6, 3],
      [9, 4],
    ];
    var done = {};
    function isTarget(r, c) {
      return targets.some(function (t) {
        return t[0] === r && t[1] === c;
      });
    }
    stage.appendChild(MQ.ui.lesson('The times square', 'Row number × column number. Fill the three <b>?</b> boxes.'));
    var sq = square({ blank: isTarget, cls: 'tse-sq-main' });
    var panel = el('div', { class: 'tse-panel' });
    var tasks = el(
      'div',
      { class: 'tse-tasks' },
      targets.map(function (t) {
        return el('span', { class: 'tse-task', 'data-t': t[0] + 'x' + t[1] }, t[0] + ' × ' + t[1]);
      })
    );
    stage.appendChild(tasks);
    stage.appendChild(el('div', { class: 'tse-row tse-top' }, el('div', { class: 'tse-sqwrap' }, sq.svg), panel));
    var selected = null;
    var input = null;

    function show(r, c) {
      sq.light(r, c);
      MQ.clear(panel);
      var blank = isTarget(r, c) && !done[r + 'x' + c];
      panel.appendChild(el('div', { class: 'tse-where' }, 'Row ' + r + ', column ' + c));
      var ap = arrayPanel(r, c, { totals: blank && selected && selected[0] === r && selected[1] === c && selected.help });
      panel.appendChild(ap);
      if (selected && selected.help && selected[0] === r && selected[1] === c) ap.dots.showAll();
      if (!blank) {
        panel.appendChild(el('div', { class: 'tse-big' }, r + ' × ' + c + ' = ', el('b', null, String(r * c))));
        return;
      }
      if (!(selected && selected[0] === r && selected[1] === c)) {
        panel.appendChild(el('div', { class: 'tse-note' }, 'Click this box to fill it in.'));
        return;
      }
      input = MQ.ui.numberInput({
        prefix: r + ' × ' + c + ' =',
        onSubmit: function (v) {
          if (v === r * c) {
            done[r + 'x' + c] = true;
            sq.setText(r, c, r * c, 'tse-done');
            tasks.querySelector('[data-t="' + r + 'x' + c + '"]').classList.add('tse-task-done');
            api.sound('correct');
            selected = null;
            show(r, c);
            var left = targets.filter(function (t) {
              return !done[t[0] + 'x' + t[1]];
            }).length;
            if (left === 0) {
              api.say('All three! The square holds every times fact.', 'cheer');
              api.feedback('Row × column = the number where they meet.', 'good');
              api.unlockNext();
            } else {
              api.say('Yes! ' + r + ' rows of ' + c + ' = ' + r * c + '. Now another ? box.', 'happy');
              api.feedback(left + (left === 1 ? ' box' : ' boxes') + ' to go.', 'info');
            }
          } else {
            api.sound('wrong');
            input.bad();
            var h = productHint(r, c, v, selected.wrong || 0);
            selected.wrong = (selected.wrong || 0) + 1;
            selected.help = true;
            api.say(h.msg, 'oops');
            api.feedback(h.msg, 'try');
            var keep = input.input.value;
            show(r, c);
            input.setValue(keep);
            input.bad();
            input.focus();
          }
        },
      });
      if (selected.draft) input.setValue(selected.draft);
      input.input.addEventListener('input', function () {
        selected.draft = input.input.value;
      });
      panel.appendChild(input.el);
      input.focus();
    }

    sq.on(
      function (r, c) {
        show(r, c);
      },
      function (r, c) {
        if (isTarget(r, c) && !done[r + 'x' + c]) {
          if (!selected || selected[0] !== r || selected[1] !== c) selected = [r, c];
        }
        show(r, c);
      },
      function () {
        if (selected) show(selected[0], selected[1]);
      }
    );
    MQ.clear(panel);
    panel.appendChild(el('div', { class: 'tse-note' }, 'Point at a box. Its dots appear here.'));
    var a0 = arrayPanel(2, 5, { product: true });
    panel.appendChild(a0);
  }

  function learnTurn(stage, api) {
    api.lockNext();
    api.say('Click 3 × 8: row 3, column 8.');
    stage.appendChild(MQ.ui.lesson('Turn it around', 'Find <b>3 × 8</b>. Then fold the square along the line.'));
    var sq = square({ diagonal: true, cls: 'tse-sq-main' });
    var panel = el('div', { class: 'tse-panel' });
    var foldBtn = el('button', { class: 'btn tse-go', type: 'button', disabled: true }, 'Fold along the line ↘');
    stage.appendChild(el('div', { class: 'tse-row tse-top' }, el('div', { class: 'tse-sqwrap' }, sq.svg), panel));
    var sp = 24;
    var size = 8 * sp + 8;
    var spin = svg('svg', { viewBox: '0 0 ' + size + ' ' + size, width: size, height: size, class: 'tse-dots', style: { maxWidth: '100%', height: 'auto' } });
    var grp = svg('g', { class: 'tse-spin' });
    var ox = (size - 8 * sp) / 2;
    var oy = (size - 3 * sp) / 2;
    for (var i = 0; i < 3; i++) {
      for (var j = 0; j < 8; j++) grp.appendChild(svg('circle', { cx: ox + j * sp + sp / 2, cy: oy + i * sp + sp / 2, r: sp * 0.36, class: 'tse-dot' }));
    }
    spin.appendChild(grp);
    var cap = el('div', { class: 'tse-cap' }, el('b', null, '3 rows of 8'), '  →  3 × 8 = 24');
    var stage1 = false;
    panel.appendChild(el('div', { class: 'tse-note' }, 'Find row 3, column 8.'));

    sq.on(null, function (r, c) {
      if (stage1) return;
      if (r === 3 && c === 8) {
        stage1 = true;
        sq.light(3, 8);
        MQ.clear(panel);
        panel.appendChild(cap);
        panel.appendChild(el('div', { class: 'tse-arr-pic' }, spin));
        panel.appendChild(foldBtn);
        foldBtn.disabled = false;
        api.sound('pop');
        api.say('3 rows of 8 = 24. Now fold the square!', 'happy');
      } else {
        api.sound('wrong');
        sq.light(r, c);
        api.feedback('That is row ' + r + ', column ' + c + '. Rows go across, columns go down. Find row 3, column 8.', 'try');
      }
    });

    foldBtn.addEventListener('click', function () {
      foldBtn.disabled = true;
      var a = sq.center(3, 8);
      var b = sq.center(8, 3);
      var fly = svg('g', { class: 'tse-fly' });
      fly.appendChild(svg('rect', { x: a.x - sq.cs / 2, y: a.y - sq.cs / 2, width: sq.cs, height: sq.cs, rx: 6, class: 'tse-fly-box' }));
      fly.appendChild(svg('text', { x: a.x, y: a.y + 7, 'text-anchor': 'middle', class: 'tse-num', 'font-size': 20 }, '24'));
      sq.overlay.appendChild(fly);
      api.later(function () {
        fly.style.transform = 'translate(' + (b.x - a.x) + 'px,' + (b.y - a.y) + 'px)';
        grp.classList.add('tse-turned');
      }, 60);
      api.later(function () {
        sq.light(8, 3);
        sq.cell(3, 8).rect.classList.add('tse-target');
        MQ.clear(cap);
        cap.appendChild(el('b', null, '8 rows of 3'));
        cap.appendChild(document.createTextNode('  →  8 × 3 = 24'));
        panel.appendChild(el('div', { class: 'tse-big tse-small' }, '3 × 8 = 24 and 8 × 3 = 24'));
        panel.appendChild(el('div', { class: 'tse-note' }, 'The same 24 dots, just turned!'));
        api.say('Same dots, turned around. So you only need to learn half the square!', 'cheer');
        api.feedback('3 × 8 and 8 × 3 land on the same number, 24. Each side of the line is a mirror.', 'good');
        api.unlockNext();
      }, 1500);
    });
  }

  function learnDivide(stage, api) {
    api.lockNext();
    api.say('Click the 24 in row 3.');
    stage.appendChild(MQ.ui.lesson('Read a division', 'Find <b>24</b> in row 3. Its row and column give two divisions.'));
    var sq = square({ cls: 'tse-sq-small' });
    var panel = el('div', { class: 'tse-panel tse-panel-wide' });
    stage.appendChild(el('div', { class: 'tse-row tse-top' }, el('div', { class: 'tse-sqwrap tse-sqwrap-s' }, sq.svg), panel));
    panel.appendChild(el('div', { class: 'tse-note' }, 'Look along row 3 for 24.'));
    sq.rowHead(3).rect.classList.add('tse-head-on');
    var found = false;
    sq.on(null, function (r, c) {
      if (found) return;
      if (r === 3 && c === 8) {
        found = true;
        sq.light(3, 8);
        api.sound('pop');
        build();
      } else if (r * c === 24) {
        api.feedback('That is 24 too (' + r + ' × ' + c + ')! For now, find the 24 in row 3.', 'info');
      } else {
        api.feedback('That box is ' + r * c + '. Slide along row 3 until you reach 24.', 'try');
      }
    });

    function build() {
      MQ.clear(panel);
      api.say('The heads are 3 and 8. Drag them into the boxes.', 'happy');
      var ap = arrayPanel(3, 8, { sp: 26 });
      ap.dots.showAll();
      panel.appendChild(ap);
      var s1 = slot();
      var s2 = slot();
      panel.appendChild(el('div', { class: 'tse-sents' }, sentence([24, '÷', 3, '=', s1]), sentence([24, '÷', 8, '=', s2])));
      var placed = 0;
      var kit = cardKit(api, [3, 8], [s1, s2], function (s, v) {
        var want = s === s1 ? 8 : 3;
        if (v !== want) {
          api.sound('wrong');
          api.feedback(
            s === s1 ? '24 ÷ 3: 24 dots in 3 rows. How many in each row? Count one row.' : '24 ÷ 8: 24 dots in rows of 8. How many rows?',
            'try'
          );
          return false;
        }
        s.locked = true;
        s.el.classList.add('tse-ok');
        placed++;
        if (placed === 2) {
          api.later(function () {
            api.say('24 ÷ 3 = 8 and 24 ÷ 8 = 3. The square does division too!', 'cheer');
            api.feedback('Start at the big number, 24. Divide by the row head or the column head.', 'good');
            kit.disable();
            api.unlockNext();
          }, 200);
        }
      });
      panel.appendChild(el('div', { class: 'tse-heads' }, el('span', { class: 'tse-note' }, 'Heads:'), kit.el));
    }
  }

  /* ---------------------------------------------------------------- *
   * Practice
   * ---------------------------------------------------------------- */

  function practiceCell(stage, api, q) {
    var r = q.r;
    var c = q.c;
    var level1 = q.level === 1;
    var heads = level1 ? [1, 2, 3, 4, 5, 10] : range(1, 10);
    api.say(level1 ? 'What number goes in the ? box?' : 'Find the missing number in the square.', 'think');
    stage.appendChild(MQ.ui.prompt('Row <b>' + r + '</b>, column <b>' + c + '</b>. What is <b>' + r + ' × ' + c + '</b>?'));
    var sq = square({
      rows: heads,
      cols: heads,
      cell: level1 ? 50 : 42,
      cls: level1 ? 'tse-sq-mini' : 'tse-sq-main',
      blank: function (rr, cc) {
        return rr === r && cc === c;
      },
    });
    sq.light(r, c);
    var side = el('div', { class: 'tse-panel' });
    var ap = arrayPanel(r, c, { totals: true });
    if (level1) side.appendChild(ap);
    else side.appendChild(el('div', { class: 'tse-note' }, 'Finger on row ' + r + ', finger on column ' + c + '. Slide them together.'));
    var wrap = el('div', { class: 'tse-row tse-top', 'data-answer': String(q.ans) }, el('div', { class: 'tse-sqwrap' + (level1 ? ' tse-sqwrap-mini' : '') }, sq.svg), side);
    stage.appendChild(wrap);
    var shownArray = level1;
    var input = MQ.ui.numberInput({
      prefix: r + ' × ' + c + ' =',
      onSubmit: function (v) {
        if (api.isAnswered()) return;
        if (v === q.ans) {
          input.good();
          input.disable();
          sq.setText(r, c, q.ans, 'tse-done');
          api.check(true, r + ' rows of ' + c + ' = ' + q.ans + '!');
          return;
        }
        input.bad();
        var h = productHint(r, c, v, api.tries());
        if (!shownArray) {
          shownArray = true;
          MQ.clear(side);
          side.appendChild(ap);
        }
        if (api.tries() >= 1) ap.dots.showAll();
        api.check(false, h.msg, h.tag);
        input.focus();
      },
    });
    stage.appendChild(input.el);
    input.focus();
    api.onReveal(function () {
      input.setValue(q.ans);
      input.good();
      input.disable();
      sq.setText(r, c, q.ans, 'tse-done');
      MQ.clear(side);
      side.appendChild(ap);
      ap.dots.showAll();
      side.appendChild(jumpChips(c, r));
      api.feedback(r + ' rows of ' + c + ': count in jumps of ' + c + ' → ' + jumps(c, r).join(', ') + '. So ' + r + ' × ' + c + ' = ' + q.ans + '.', 'info');
    });
  }

  function practiceDouble(stage, api, q) {
    var a = q.from;
    var b = q.to;
    var c = q.c;
    api.say('The ' + b + ' row is double the ' + a + ' row!', 'think');
    stage.appendChild(MQ.ui.prompt('Double the <b>' + a + '</b> row to get the <b>' + b + '</b> row. What is <b>' + b + ' × ' + c + '</b>?'));
    var sq = square({
      rows: [a, b],
      cols: range(1, 10),
      cell: 46,
      extraRight: 70,
      cls: 'tse-sq-wide',
      blank: function (rr, cc) {
        return rr === b && cc === c;
      },
    });
    sq.cell(a, c).rect.classList.add('tse-target');
    sq.cell(b, c).rect.classList.add('tse-path');
    sq.rowHead(a).rect.classList.add('tse-head-on');
    sq.rowHead(b).rect.classList.add('tse-head-on');
    sq.colHead(c).rect.classList.add('tse-head-on');
    var xr = sq.cs * 11 + 8;
    var ya = sq.cs * 1.5;
    var yb = sq.cs * 2.5;
    var arrow = svg('g', { class: 'tse-dbl' });
    arrow.appendChild(svg('path', { d: 'M' + xr + ' ' + ya + ' C ' + (xr + 34) + ' ' + ya + ' ' + (xr + 34) + ' ' + yb + ' ' + (xr + 4) + ' ' + yb, class: 'tse-dbl-arrow' }));
    arrow.appendChild(svg('path', { d: 'M' + (xr + 14) + ' ' + (yb - 8) + ' L ' + (xr + 3) + ' ' + yb + ' L ' + (xr + 14) + ' ' + (yb + 8), class: 'tse-dbl-arrow' }));
    arrow.appendChild(svg('text', { x: xr + 32, y: sq.cs * 2 + 6, class: 'tse-dbl-text', 'font-size': 18 }, '×2'));
    sq.overlay.appendChild(arrow);
    var side = el('div', { class: 'tse-panel' }, el('div', { class: 'tse-note' }, a + ' × ' + c + ' = ' + q.base + '. Double it!'));
    stage.appendChild(el('div', { class: 'tse-col', 'data-answer': String(q.ans) }, el('div', { class: 'tse-sqwrap tse-sqwrap-wide' }, sq.svg), side));
    var ap = arrayPanel(b, c, { split: a, totals: true });
    var shown = false;
    var input = MQ.ui.numberInput({
      prefix: b + ' × ' + c + ' =',
      onSubmit: function (v) {
        if (api.isAnswered()) return;
        if (v === q.ans) {
          input.good();
          input.disable();
          sq.setText(b, c, q.ans, 'tse-done');
          api.check(true, q.base + ' + ' + q.base + ' = ' + q.ans + '. Doubling works!');
          return;
        }
        input.bad();
        if (!shown) {
          shown = true;
          side.appendChild(ap);
        }
        if (api.tries() >= 1) ap.dots.showAll();
        var tag;
        var msg;
        if (v === q.base) {
          tag = 'Doubled wrongly';
          msg = 'That is the ' + a + ' row number. Double it: ' + q.base + ' + ' + q.base + '.';
        } else if (v === b + c) {
          tag = 'Added instead of multiplied';
          msg = 'That is ' + b + ' + ' + c + '. Double ' + q.base + ' instead: ' + q.base + ' + ' + q.base + '.';
        } else if (v === b * (c - 1) || v === b * (c + 1)) {
          tag = 'Read the wrong row or column';
          msg = 'That is the box next door. Stay in column ' + c + ': double ' + q.base + '.';
        } else {
          tag = 'Doubled wrongly';
          msg = api.tries() >= 1 ? 'Double ' + q.base + ': ' + q.base + ' + ' + q.base + '. Add the tens, then the ones.' : 'Look at the dots: ' + a + ' rows of ' + c + ' and ' + a + ' more rows of ' + c + '. That is ' + q.base + ' + ' + q.base + '.';
        }
        api.check(false, msg, tag);
        input.focus();
      },
    });
    stage.appendChild(input.el);
    input.focus();
    api.onReveal(function () {
      input.setValue(q.ans);
      input.good();
      input.disable();
      sq.setText(b, c, q.ans, 'tse-done');
      if (!shown) side.appendChild(ap);
      ap.dots.showAll();
      side.appendChild(MQ.ui.sum([q.base, q.base], q.ans));
      api.feedback(a + ' rows of ' + c + ' = ' + q.base + '. Two lots: ' + q.base + ' + ' + q.base + ' = ' + q.ans + '. So ' + b + ' × ' + c + ' = ' + q.ans + '.', 'info');
    });
  }

  /** Check a fact family. f = [[x,y],[x,y],[p,q,r],[p,q,r]] (values or null). */
  function judgeFamily(f, a, b, P) {
    var res = { ok: false, bad: [] };
    var divEmpty = f[2].every(function (v) { return v == null; }) && f[3].every(function (v) { return v == null; });
    var anyEmpty = f.some(function (s) {
      return s.some(function (v) {
        return v == null;
      });
    });
    if (divEmpty) {
      res.tag = 'Fact family missing the divisions';
      res.msg = 'A fact family has two divisions too! Start each one with the big number, ' + P + '.';
      res.bad = [2, 3];
      return res;
    }
    if (anyEmpty) {
      res.empty = true;
      return res;
    }
    var sum = a + b;
    function isPair(s) {
      return (s[0] === a && s[1] === b) || (s[0] === b && s[1] === a);
    }
    var mulBad = [0, 1].filter(function (i) {
      return !isPair(f[i]);
    });
    if (mulBad.length) {
      res.bad = mulBad;
      var usedSum = mulBad.some(function (i) {
        return f[i][0] === sum || f[i][1] === sum;
      });
      res.tag = usedSum ? 'Added instead of multiplied' : 'Read the wrong row or column';
      res.msg = usedSum ? sum + ' is ' + a + ' + ' + b + '. We need two numbers that multiply to ' + P + ': look at the row and column heads.' : 'The two numbers that multiply to ' + P + ' are the row and column heads: ' + a + ' and ' + b + '.';
      return res;
    }
    if (f[0][0] === f[1][0]) {
      res.bad = [1];
      res.tag = 'Forgot the turn-around fact';
      res.msg = 'Both × facts are the same. Turn the second one around!';
      return res;
    }
    function isDiv(s) {
      return s[0] === P && ((s[1] === a && s[2] === b) || (s[1] === b && s[2] === a));
    }
    var divBad = [2, 3].filter(function (i) {
      return !isDiv(f[i]);
    });
    if (divBad.length) {
      res.bad = divBad;
      var swapped = divBad.some(function (i) {
        var s = f[i].slice().sort(function (x, y) { return x - y; });
        var t = [a, b, P].sort(function (x, y) { return x - y; });
        return s[0] === t[0] && s[1] === t[1] && s[2] === t[2] && f[i][0] !== P;
      });
      if (swapped) {
        res.tag = 'Division numbers in the wrong order';
        res.msg = 'A division starts with the big number: ' + P + ' ÷ … We share the ' + P + ' out.';
      } else {
        res.tag = 'Division facts wrong';
        res.msg = P + ' ÷ ' + a + ' means ' + P + ' dots in ' + a + ' rows. How many in each row? Look at the dots.';
      }
      return res;
    }
    if (f[2][1] === f[3][1]) {
      res.bad = [3];
      res.tag = 'Forgot the turn-around fact';
      res.msg = 'Both divisions are the same. Divide ' + P + ' by the other number in the second one.';
      return res;
    }
    res.ok = true;
    return res;
  }

  function practiceFamily(stage, api, q) {
    var a = q.r;
    var b = q.c;
    var P = q.P;
    api.say('Here is ' + P + ' in the square. Build its fact family!', 'think');
    stage.appendChild(MQ.ui.prompt('<b>' + P + '</b> is in row ' + a + ', column ' + b + '. Write its <b>fact family</b>.'));
    var sq = square({ cell: 40, cls: 'tse-sq-small' });
    sq.light(a, b);
    var ap = arrayPanel(a, b, { sp: 22 });
    var slots = [];
    function s() {
      var x = slot();
      slots.push(x);
      return x;
    }
    var m1 = [s(), s()];
    var m2 = [s(), s()];
    var d1 = [s(), s(), s()];
    var d2 = [s(), s(), s()];
    var sents = [sentence([m1[0], '×', m1[1], '=', P]), sentence([m2[0], '×', m2[1], '=', P]), sentence([d1[0], '÷', d1[1], '=', d1[2]]), sentence([d2[0], '÷', d2[1], '=', d2[2]])];
    var frames = el('div', { class: 'tse-sents tse-family' }, sents);
    var cards = U.shuffle([P, a, b, a + b]);
    var kit = cardKit(api, cards, slots, function () {
      sents.forEach(function (x) {
        x.classList.remove('tse-sent-bad');
      });
      return true;
    });
    var checkBtn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    var answer = [a, b, b, a, P, a, b, P, b, a].join(',');
    stage.appendChild(
      el(
        'div',
        { class: 'tse-row tse-top', 'data-answer': answer },
        el('div', { class: 'tse-sqwrap tse-sqwrap-s' }, sq.svg),
        el('div', { class: 'tse-panel tse-panel-wide tse-fam' }, ap, frames)
      )
    );
    stage.appendChild(el('div', { class: 'tse-cardbar' }, el('span', { class: 'tse-note' }, 'Cards:'), kit.el, checkBtn));

    function values(list) {
      return list.map(function (x) {
        return x.value;
      });
    }
    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var f = [values(m1), values(m2), values(d1), values(d2)];
      var res = judgeFamily(f, a, b, P);
      sents.forEach(function (x) {
        x.classList.remove('tse-sent-bad');
      });
      if (res.empty) {
        api.feedback('Fill every box first. Click a card, or drag it into a box.', 'info');
        kit.refresh();
        return;
      }
      if (res.ok) {
        kit.disable();
        checkBtn.disabled = true;
        sents.forEach(function (x) {
          x.classList.add('tse-sent-ok');
        });
        api.check(true, 'Two × and two ÷: a full fact family for ' + P + '!');
        return;
      }
      res.bad.forEach(function (i) {
        sents[i].classList.add('tse-sent-bad');
      });
      if (res.tag === 'Division numbers in the wrong order' || res.tag === 'Division facts wrong') ap.dots.showAll();
      var msg = res.msg;
      if (api.tries() >= 1) msg += ' (' + P + ' ÷ ' + a + ' = ' + b + ' is one of them.)';
      api.check(false, msg, res.tag);
      kit.setActive(res.bad.length ? [m1, m2, d1, d2][res.bad[0]][0] : null);
    });

    api.onReveal(function () {
      var fill = [a, b, b, a, P, a, b, P, b, a];
      slots.forEach(function (x, i) {
        setSlot(x, fill[i]);
      });
      kit.disable();
      checkBtn.disabled = true;
      sents.forEach(function (x) {
        x.classList.remove('tse-sent-bad');
        x.classList.add('tse-sent-ok');
      });
      ap.dots.showAll();
      api.feedback(a + ' rows of ' + b + ' = ' + P + '. Turn it: ' + b + ' rows of ' + a + '. Share ' + P + ' into ' + a + ' rows → ' + b + ' in each. Share into ' + b + ' rows → ' + a + ' in each.', 'info');
    });
  }

  var def = {
    learn: [learnShelf, learnSquare, learnTurn, learnDivide],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'cell') practiceCell(stage, api, q);
        else if (q.type === 'double') practiceDouble(stage, api, q);
        else practiceFamily(stage, api, q);
      },
    },
  };
  // Pure helpers exposed for tests (harmless: they only build/check data).
  def.buildDeck = buildDeck;
  def.judgeFamily = judgeFamily;
  def.productHint = productHint;
  MQ.register(ID, def);

  var css = [
    '.tse-row{display:flex;gap:18px;align-items:center;justify-content:center;flex-wrap:wrap;width:100%}',
    '.tse-top{align-items:flex-start}',
    '.tse-col{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}',
    '.tse-col>*{flex:none}',
    '.tse-panel.tse-fam{flex-direction:row;flex-wrap:wrap;justify-content:center;align-items:flex-start}',
    '.tse-pic{display:flex;justify-content:center;max-width:100%}',
    '.tse-after{display:flex;flex-direction:column;align-items:center;gap:10px}',
    '.tse-big{font-size:2rem;font-weight:800;background:#fff;border:3px solid var(--line);border-radius:16px;padding:6px 18px;text-align:center}',
    '.tse-big b{color:#0b6e66}',
    '.tse-small{font-size:1.3rem}',
    '.tse-go{font-size:1.2rem}',
    '.tse-sqwrap{flex:1 1 380px;max-width:480px;min-width:0;display:flex;justify-content:center}',
    '.tse-sqwrap-s{flex-basis:340px;max-width:400px}',
    '.tse-sqwrap-mini{flex-basis:320px;max-width:360px}',
    '.tse-sqwrap-wide{flex:none;width:100%;max-width:600px}',
    '.tse-square{display:block;user-select:none}',
    '.tse-square .tse-num{font-weight:800;fill:var(--ink);pointer-events:none;font-family:inherit}',
    '.tse-sq{fill:#fff;stroke:#c9d3dc;stroke-width:1.5}',
    '.tse-live .tse-cell{cursor:pointer}',
    '.tse-live .tse-cell:hover .tse-sq{stroke:#0b6e66;stroke-width:3}',
    '.tse-head{fill:#e3edff;stroke:#9db4dd;stroke-width:1.5}',
    '.tse-corner{fill:#cfdcf5;stroke:#9db4dd;stroke-width:1.5}',
    '.tse-head-on{fill:#ffb703;stroke:#c98a00}',
    '.tse-path{fill:#fff3c4}',
    '.tse-target{fill:#ffd166;stroke:#c98a00;stroke-width:3}',
    '.tse-blank{fill:#fff;stroke:var(--accent);stroke-width:3;stroke-dasharray:6 4}',
    '.tse-target.tse-blank{fill:#fff3c4}',
    '.tse-q{fill:#c2410c !important}',
    '.tse-done{fill:var(--good-bg);stroke:var(--good);stroke-width:3}',
    '.tse-diag{stroke:#e63946;stroke-width:2.5;stroke-dasharray:8 6;opacity:.45;pointer-events:none}',
    '.tse-diagcell{fill:#ffe9ec}',
    '.tse-fly{transition:transform 1.2s ease-in-out;pointer-events:none}',
    '.tse-fly-box{fill:#ffd166;stroke:#c98a00;stroke-width:3;opacity:.92}',
    '.tse-panel{flex:0 1 280px;min-width:240px;display:flex;flex-direction:column;align-items:center;gap:10px}',
    '.tse-panel-wide{flex-basis:380px}',
    '.tse-where{font-weight:800;font-size:1.15rem;color:var(--ink-soft)}',
    '.tse-note{color:var(--ink-soft);font-weight:700;text-align:center}',
    '.tse-arr{display:flex;flex-direction:column;align-items:center;gap:6px;background:#fff;border:2px solid var(--line);border-radius:14px;padding:8px 10px;max-width:100%}',
    '.tse-arr-pic{display:flex;justify-content:center;max-width:100%}',
    '.tse-cap{font-size:1.1rem;font-weight:700;text-align:center}',
    '.tse-dots{display:block}',
    '.tse-dot{fill:#4d96ff}',
    '.tse-dotrow-b .tse-dot{fill:#2ec4b6}',
    '.tse-rowband{fill:transparent;transition:fill .3s}',
    '.tse-lit .tse-rowband{fill:#fff3c4}',
    '.tse-total{font-weight:800;fill:#0b6e66;font-family:inherit}',
    '.tse-splitline{stroke:#e63946;stroke-width:2;stroke-dasharray:6 5}',
    '.tse-spin{transform-box:fill-box;transform-origin:center;transition:transform 1.2s ease-in-out}',
    '.tse-turned{transform:rotate(90deg)}',
    '.tse-shelf{display:block}',
    '.tse-shelf-back{fill:#f6efe6;stroke:#d8c8b3;stroke-width:2}',
    '.tse-shelf-band{fill:transparent;transition:fill .3s}',
    '.tse-shelf-band.tse-lit{fill:#fff0a8}',
    '.tse-plank{fill:#a9784a}',
    '.tse-tin-body{fill:#cfd8dc;stroke:#8fa1aa;stroke-width:1.5}',
    '.tse-tin-top{fill:#eef2f4;stroke:#8fa1aa;stroke-width:1.5}',
    '.tse-tin-label{fill:#e76f51}',
    '.tse-tin-dot{fill:#fff3c4}',
    '.tse-tasks{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.tse-task{font-size:1.25rem;font-weight:800;background:#fff;border:3px dashed var(--accent);border-radius:12px;padding:4px 14px}',
    '.tse-task-done{border-style:solid;border-color:var(--good);background:var(--good-bg)}',
    '.tse-task-done::after{content:" ✓";color:var(--good)}',
    '.tse-jumps{font-size:1.1rem}',
    '.tse-jlabel{font-weight:800;margin-right:4px}',
    '.tse-sents{display:flex;flex-direction:column;gap:8px;align-items:center}',
    '.tse-sent{display:flex;align-items:center;gap:6px;font-size:1.5rem;font-weight:800;padding:4px 10px;border-radius:12px;border:2px solid transparent}',
    '.tse-sent-bad{border-color:var(--try);background:var(--try-bg)}',
    '.tse-sent-ok{border-color:var(--good);background:var(--good-bg)}',
    '.tse-op{min-width:18px;text-align:center}',
    '.tse-given{min-width:44px;text-align:center}',
    '.tse-slot{display:inline-flex;align-items:center;justify-content:center;min-width:54px;height:48px;border:3px dashed #9db4dd;border-radius:10px;background:#fff;cursor:pointer;padding:0 6px}',
    '.tse-slot.tse-filled{border-style:solid;border-color:#4d96ff;background:#eef5ff}',
    '.tse-slot.tse-active{border-color:#ffb703;box-shadow:0 0 0 4px #ffe8a3}',
    '.tse-slot.tse-ok{border-color:var(--good);background:var(--good-bg);cursor:default}',
    '.tse-cards{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.tse-card{min-width:58px;height:54px;font-size:1.5rem;font-weight:800;border-radius:12px;border:3px solid #c98a00;background:#ffd166;color:var(--ink);cursor:grab;font-family:inherit;padding:0 10px}',
    '.tse-card:hover:not(:disabled){background:#ffc23d}',
    '.tse-card:disabled{opacity:.5;cursor:default}',
    '.tse-ghost{position:fixed;z-index:1000;pointer-events:none;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 14px rgba(0,0,0,.25)}',
    '.tse-heads,.tse-cardbar{display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap}',
    '.tse-dbl-arrow{fill:none;stroke:#e63946;stroke-width:3;marker-end:none}',
    '.tse-dbl-text{fill:#e63946;font-weight:800;font-family:inherit}',
    '@media (max-width:900px){.tse-big{font-size:1.6rem}.tse-sent{font-size:1.3rem}.tse-slot{min-width:46px;height:44px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

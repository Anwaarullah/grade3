/* Venn Card Game — Project 5 "Venn variety" (after Unit 16).
 * Two property cards label a two-circle Venn diagram on "Numbers".
 * Every placement is checked from the two property predicates:
 *   region = L (left only) / B (both) / R (right only) / O (outside).
 * Level 3 "is a part empty?" answers are found by brute force over the numbers on the strip,
 * and only property pairs whose emptiness is true for ALL numbers are used.
 * "One more than a 4x number": 0 is in the 4 times table (0 x 4 = 0), so 1 counts (n % 4 === 1).
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  /* ---------------- properties (the maths) ---------------- */
  function multWhy(k) {
    return function (n) {
      if (n % k === 0) return 'counting in ' + k + 's lands on ' + n;
      var a = Math.floor(n / k) * k;
      return 'counting in ' + k + 's goes ' + a + ', ' + (a + k) + ' and jumps over ' + n;
    };
  }
  function mult(k) {
    return {
      label: 'Multiples of ' + k,
      word: 'a multiple of ' + k,
      table: true,
      step: k,
      test: function (n) {
        return n % k === 0;
      },
      why: multWhy(k),
      light: 'Counting in ' + k + 's: ' + k + ', ' + 2 * k + ', ' + 3 * k + ' …',
    };
  }
  function cmp(kind, k) {
    var lt = kind === 'lt';
    return {
      label: (lt ? 'Less than ' : 'More than ') + k,
      word: (lt ? 'less than ' : 'more than ') + k,
      test: function (n) {
        return lt ? n < k : n > k;
      },
      why: function (n) {
        var yes = lt ? n < k : n > k;
        return n + ' is ' + (yes ? '' : 'not ') + (lt ? 'less than ' : 'more than ') + k;
      },
      light: lt ? 'Numbers before ' + k : 'Numbers after ' + k,
    };
  }
  function ends(d) {
    return {
      label: 'Ends in ' + d,
      word: 'a number that ends in ' + d,
      test: function (n) {
        return n % 10 === d;
      },
      why: function (n) {
        return n + (n % 10 === d ? ' ends in ' + d : ' ends in ' + (n % 10) + ', not ' + d);
      },
      light: 'Look at the last digit: ' + d,
    };
  }
  var P = {
    even: {
      label: 'Even',
      word: 'even',
      step: 2,
      test: function (n) {
        return n % 2 === 0;
      },
      why: function (n) {
        return n + ' ends in ' + (n % 10) + ', so it is ' + (n % 2 === 0 ? 'even' : 'odd');
      },
      light: 'Counting in 2s: 2, 4, 6 …',
    },
    odd: {
      label: 'Odd',
      word: 'odd',
      test: function (n) {
        return n % 2 === 1;
      },
      why: function (n) {
        return n + ' ends in ' + (n % 10) + ', so it is ' + (n % 2 === 1 ? 'odd' : 'even');
      },
      light: 'Odd numbers: 1, 3, 5, 7 …',
    },
    lt10: cmp('lt', 10),
    lt20: cmp('lt', 20),
    lt30: cmp('lt', 30),
    gt20: cmp('gt', 20),
    gt25: cmp('gt', 25),
    ends5: ends(5),
    ends0: ends(0),
    m2: mult(2),
    m3: mult(3),
    m4: mult(4),
    m5: mult(5),
    m10: mult(10),
    one4: {
      label: 'One more than a 4× number',
      word: 'one more than a 4× number',
      table: true,
      test: function (n) {
        return n % 4 === 1;
      },
      why: function (n) {
        var m = n - 1;
        if (m === 0) return '1 − 1 = 0, and 0 is in the 4 times table (0 × 4)';
        return n + ' − 1 = ' + m + (m % 4 === 0 ? ', which is in the 4 times table' : ', which is not in the 4 times table');
      },
      light: '4 times table 0, 4, 8, 12 … then add 1: 1, 5, 9, 13 …',
    },
  };

  function regionOf(n, a, b) {
    var A = P[a].test(n);
    var B = P[b].test(n);
    return A && B ? 'B' : A ? 'L' : B ? 'R' : 'O';
  }
  function countRegions(a, b, lo, hi) {
    var c = { L: [], B: [], R: [], O: [] };
    for (var n = lo; n <= hi; n++) c[regionOf(n, a, b)].push(n);
    return c;
  }
  function regionName(reg, a, b) {
    if (reg === 'L') return 'only in the “' + P[a].label + '” circle';
    if (reg === 'R') return 'only in the “' + P[b].label + '” circle';
    if (reg === 'B') return 'in the middle, where the circles overlap';
    return 'outside both circles';
  }
  function regionChoiceLabel(reg, a, b) {
    if (reg === 'L') return '<b>' + P[a].label + '</b> but NOT ' + P[b].label.toLowerCase();
    if (reg === 'R') return '<b>' + P[b].label + '</b> but NOT ' + P[a].label.toLowerCase();
    return '<b>Both</b> ' + P[a].label.toLowerCase() + ' AND ' + P[b].label.toLowerCase();
  }
  function tick(ok) {
    return ok ? '<span class="vpg-yes">✔</span>' : '<span class="vpg-no">✘</span>';
  }
  function workLine(n, a, b) {
    var reg = regionOf(n, a, b);
    return '<b>' + n + '</b>: ' + P[a].word + ' ' + tick(P[a].test(n)) + ' · ' + P[b].word + ' ' + tick(P[b].test(n)) + ' → ' + regionName(reg, a, b);
  }

  /* ---------------- pair lists ---------------- */
  var L1_PAIRS = [
    ['even', 'lt10'],
    ['odd', 'gt20'],
    ['even', 'gt20'],
    ['odd', 'lt10'],
    ['ends5', 'lt20'],
    ['ends5', 'gt20'],
  ];
  var L2_PAIRS = [
    ['m5', 'even'],
    ['m5', 'odd'],
    ['m10', 'lt30'],
    ['m10', 'gt20'],
    ['m2', 'gt25'],
    ['m5', 'lt20'],
    ['m2', 'lt10'],
  ];
  // empty: the region that can NEVER have a number (true for every whole number, not only on the strip).
  var EMPTY_PAIRS = [
    { a: 'm10', b: 'even', empty: 'L', reason: 'Every multiple of 10 ends in 0, so it is always even.' },
    { a: 'odd', b: 'm4', empty: 'B', reason: 'Counting in 4s only lands on even numbers, so no multiple of 4 is odd.' },
    { a: 'odd', b: 'one4', empty: 'R', reason: 'Numbers in the 4 times table are even, and one more than an even number is odd.' },
    { a: 'm5', b: 'ends0', empty: 'R', reason: 'Every number that ends in 0 is on the counting-in-5s path: 10, 20, 30 …' },
    { a: 'even', b: 'ends5', empty: 'B', reason: 'A number that ends in 5 is always odd, so it can never be even.' },
    { a: 'm4', b: 'even', empty: 'L', reason: 'Counting in 4s only lands on even numbers: 4, 8, 12, 16 …' },
    { a: 'm10', b: 'm5', empty: 'L', reason: 'Every multiple of 10 is two jumps of 5, so it is a multiple of 5 too.' },
    { a: 'ends5', b: 'odd', empty: 'L', reason: 'Every number that ends in 5 is odd.' },
  ];
  var FULL_PAIRS = [
    { a: 'even', b: 'm3' },
    { a: 'm4', b: 'm5' },
    { a: 'm3', b: 'm4' },
    { a: 'odd', b: 'm3' },
    { a: 'm3', b: 'm5' },
  ];
  var RANGE_WRONG = 'The strip stops at 40. A bigger number would fit there.';
  var FLIP = { L: 'R', R: 'L', B: 'B', O: 'O' };

  var TAG = {
    overlap: 'Put a number in the middle that fits only one label',
    missedBoth: 'Put a number that fits both labels in only one circle',
    wrongCircle: 'Put a number in the wrong circle',
    outsideFits: 'Put a number outside the circles when it fits a label',
    insideNone: 'Put a number in a circle when it fits neither label',
    recall: 'Guessed a times-table fact instead of skip-counting',
    missedEmpty: 'Missed a part that must stay empty',
    falseEmpty: 'Said a part is empty when a number fits there',
    wrongEmpty: 'Picked the wrong empty part',
    reason: 'Could not explain why a part is empty',
  };

  /* ---------------- Venn drawing ---------------- */
  var VW = 600;
  var RECT = { x: 8, y: 44, w: 584, h: 290 };
  var CL = { x: 225, y: 190 };
  var CR = { x: 375, y: 190 };
  var RAD = 128;
  var TW = 48;
  var TH = 40;
  var IY = Math.sqrt(RAD * RAD - 75 * 75);
  var P1 = '300,' + (190 - IY).toFixed(2);
  var P2 = '300,' + (190 + IY).toFixed(2);
  var ARC = 'A' + RAD + ',' + RAD + ' 0 ';
  var PATHS = {
    L: 'M' + P1 + ' ' + ARC + '1,0 ' + P2 + ' ' + ARC + '0,1 ' + P1 + 'Z',
    B: 'M' + P1 + ' ' + ARC + '0,1 ' + P2 + ' ' + ARC + '0,1 ' + P1 + 'Z',
    R: 'M' + P1 + ' ' + ARC + '1,1 ' + P2 + ' ' + ARC + '0,0 ' + P1 + 'Z',
  };

  function inC(x, y, c) {
    return (x - c.x) * (x - c.x) + (y - c.y) * (y - c.y) < RAD * RAD;
  }
  function regionAt(x, y) {
    if (x < RECT.x || x > RECT.x + RECT.w || y < RECT.y || y > RECT.y + RECT.h) return null;
    var a = inC(x, y, CL);
    var b = inC(x, y, CR);
    return a && b ? 'B' : a ? 'L' : b ? 'R' : 'O';
  }
  // Tile slots per region, packed once (tile + 4 units margin wholly inside the region).
  var SLOTS = (function () {
    var out = {};
    var anchors = { L: { x: 165, y: 190 }, B: { x: 300, y: 190 }, R: { x: 435, y: 190 } };
    ['L', 'B', 'R', 'O'].forEach(function (reg) {
      var cand = [];
      for (var y = RECT.y + 24; y <= RECT.y + RECT.h - 24; y += 4) {
        for (var x = RECT.x + 28; x <= RECT.x + RECT.w - 28; x += 4) {
          var ok = true;
          for (var i = 0; i <= 2 && ok; i++) {
            for (var j = 0; j <= 2 && ok; j++) {
              if (regionAt(x - TW / 2 - 4 + (i * (TW + 8)) / 2, y - TH / 2 - 4 + (j * (TH + 8)) / 2) !== reg) ok = false;
            }
          }
          if (ok) {
            var d;
            if (reg === 'O') {
              d = Math.min(Math.hypot(x - RECT.x, y - RECT.y), Math.hypot(x - RECT.x - RECT.w, y - RECT.y), Math.hypot(x - RECT.x, y - RECT.y - RECT.h), Math.hypot(x - RECT.x - RECT.w, y - RECT.y - RECT.h));
            } else d = Math.hypot(x - anchors[reg].x, (y - anchors[reg].y) * 0.7);
            cand.push({ x: x, y: y, d: d });
          }
        }
      }
      cand.sort(function (p, q) {
        return p.d - q.d;
      });
      var got = [];
      cand.forEach(function (c) {
        for (var k = 0; k < got.length; k++) if (Math.abs(got[k].x - c.x) < TW + 6 && Math.abs(got[k].y - c.y) < TH + 6) return;
        got.push({ x: c.x, y: c.y });
      });
      out[reg] = got;
    });
    return out;
  })();

  /**
   * Build a Venn for properties a (left) and b (right).
   * opts: tiles [numbers] (draggable, start in a tray), onDrop(tile, reg) -> false to send back, small (no tray).
   */
  function venn(api, a, b, opts) {
    opts = opts || {};
    var hasTray = !!(opts.tiles && opts.tiles.length);
    var VH = hasTray ? 404 : 340;
    var svg = S('svg', { viewBox: '0 0 ' + VW + ' ' + VH, class: 'vpg-venn' + (opts.small ? ' vpg-venn-small' : ''), role: 'img', 'aria-label': 'Venn diagram: ' + P[a].label + ' and ' + P[b].label });
    var outside = S('rect', { x: RECT.x, y: RECT.y, width: RECT.w, height: RECT.h, rx: 10, class: 'vpg-rect' });
    svg.appendChild(outside);
    var shapes = { O: outside };
    ['L', 'B', 'R'].forEach(function (k) {
      shapes[k] = S('path', { d: PATHS[k], class: 'vpg-reg vpg-reg-' + k });
      svg.appendChild(shapes[k]);
    });
    svg.appendChild(S('circle', { cx: CL.x, cy: CL.y, r: RAD, class: 'vpg-ring vpg-ring-a' }));
    svg.appendChild(S('circle', { cx: CR.x, cy: CR.y, r: RAD, class: 'vpg-ring vpg-ring-b' }));
    svg.appendChild(S('text', { x: RECT.x + 12, y: RECT.y + 24, class: 'vpg-numbers' }, 'Numbers'));
    // property cards
    [
      [a, 152, 'a'],
      [b, 448, 'b'],
    ].forEach(function (c) {
      var len = P[c[0]].label.length;
      var fs = len > 20 ? 16 : 19;
      svg.appendChild(S('rect', { x: c[1] - 136, y: 2, width: 272, height: 36, rx: 9, class: 'vpg-card vpg-card-' + c[2] }));
      svg.appendChild(S('text', { x: c[1], y: 26, 'text-anchor': 'middle', class: 'vpg-card-text', 'font-size': fs }, P[c[0]].label));
    });
    if (hasTray) {
      svg.appendChild(S('rect', { x: RECT.x, y: 344, width: RECT.w, height: 56, rx: 10, class: 'vpg-tray' }));
    }
    var notes = S('g', { class: 'vpg-notes' });
    var tileLayer = S('g');
    svg.appendChild(notes);
    svg.appendChild(tileLayer);
    var used = { L: [], B: [], R: [], O: [] };
    var tiles = [];
    var locked = false;

    function freeSlot(t) {
      if (t.reg && t.reg !== 'tray') {
        var arr = used[t.reg];
        var i = arr.indexOf(t.slot);
        if (i >= 0) arr.splice(i, 1);
      }
      t.slot = null;
    }
    function setPos(t, x, y) {
      t.x = x;
      t.y = y;
      t.g.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    }
    function toTray(t) {
      freeSlot(t);
      t.reg = 'tray';
      setPos(t, t.tx, t.ty);
    }
    function place(t, reg, near) {
      freeSlot(t);
      var list = SLOTS[reg];
      var best = null;
      var bd = Infinity;
      list.forEach(function (s, i) {
        if (used[reg].indexOf(i) >= 0) return;
        var d = near ? Math.hypot(s.x - near.x, s.y - near.y) : i;
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      if (best === null) {
        // region full (only after mistakes): keep the tile where it was dropped
        t.reg = reg;
        var at = near || { x: { L: 165, B: 300, R: 435, O: 50 }[reg], y: reg === 'O' ? 70 : 190 };
        setPos(t, at.x, at.y);
        return true;
      }
      used[reg].push(best);
      t.reg = reg;
      t.slot = best;
      setPos(t, list[best].x, list[best].y);
      return true;
    }
    function addTile(n, i, k) {
      var g = S('g', { class: 'vpg-tile' });
      g.appendChild(S('rect', { x: -TW / 2, y: -TH / 2, width: TW, height: TH, rx: 8 }));
      g.appendChild(S('text', { x: 0, y: 8, 'text-anchor': 'middle' }, String(n)));
      tileLayer.appendChild(g);
      var t = { n: n, g: g, reg: 'tray', slot: null, tx: VW / 2 + (i - (k - 1) / 2) * 62, ty: 372 };
      setPos(t, t.tx, t.ty);
      tiles.push(t);
      var ox = 0;
      var oy = 0;
      var active = false;
      // raise the tile before ui.drag captures the pointer (moving it later would drop the capture)
      function raise() {
        if (!locked && !t.done && tileLayer.lastChild !== g) tileLayer.appendChild(g);
      }
      g.addEventListener('pointerdown', raise);
      api.cleanup(function () {
        g.removeEventListener('pointerdown', raise);
      });
      var unbind = MQ.ui.drag(svg, g, {
        start: function () {
          active = !locked && !t.done;
          if (!active) return;
          ox = t.x;
          oy = t.y;
          g.classList.remove('vpg-bad', 'vpg-good');
          api.sound('pop');
        },
        move: function (p, dx, dy) {
          if (!active) return;
          setPos(t, U.clamp(ox + dx, 24, VW - 24), U.clamp(oy + dy, 20, VH - 20));
        },
        end: function () {
          if (!active) return;
          active = false;
          var reg = regionAt(t.x, t.y);
          if (!reg) {
            toTray(t);
          } else {
            place(t, reg, { x: t.x, y: t.y });
            if (opts.onDrop && opts.onDrop(t, reg) === false) toTray(t);
          }
          if (opts.onChange) opts.onChange();
        },
      });
      api.cleanup(unbind);
      return t;
    }
    if (hasTray) {
      opts.tiles.forEach(function (n, i) {
        addTile(n, i, opts.tiles.length);
      });
    }
    function staticTile(n, reg) {
      var g = S('g', { class: 'vpg-tile vpg-static' });
      g.appendChild(S('rect', { x: -TW / 2, y: -TH / 2, width: TW, height: TH, rx: 8 }));
      g.appendChild(S('text', { x: 0, y: 8, 'text-anchor': 'middle' }, String(n)));
      tileLayer.appendChild(g);
      var t = { n: n, g: g, reg: null, slot: null };
      tiles.push(t);
      place(t, reg);
      return t;
    }
    function note(reg, text, cls) {
      var pos = { L: [165, 196], B: [300, 196], R: [435, 196], O: [60, 316] }[reg];
      var t = S('text', { x: pos[0], y: pos[1], 'text-anchor': 'middle', class: 'vpg-note ' + (cls || '') }, text);
      notes.appendChild(t);
      return t;
    }
    return {
      svg: svg,
      tiles: tiles,
      place: place,
      toTray: toTray,
      staticTile: staticTile,
      note: note,
      clearNotes: function () {
        MQ.clear(notes);
      },
      lock: function () {
        locked = true;
        svg.classList.add('vpg-locked');
      },
      mark: function (reg, cls) {
        ['L', 'B', 'R', 'O'].forEach(function (k) {
          shapes[k].classList.remove('vpg-hi', 'vpg-empty');
        });
        if (reg) shapes[reg].classList.add(cls || 'vpg-hi');
      },
    };
  }

  /* ---------------- skip-counting number strip ---------------- */
  function strip(api, a, b, lo, hi, opts) {
    opts = opts || {};
    var cells = {};
    var grid = el('div', { class: 'vpg-grid' });
    for (var n = lo; n <= hi; n++) {
      cells[n] = el('div', { class: 'vpg-cell' }, String(n));
      grid.appendChild(cells[n]);
    }
    var on = { a: false, b: false };
    var caption = el('div', { class: 'vpg-caption' }, 'Press a button to light up the numbers.');
    var timers = 0;
    function paint(side, key) {
      var cls = 'vpg-on-' + side;
      var list = [];
      for (var m = lo; m <= hi; m++) if (P[key].test(m)) list.push(m);
      var run = ++timers;
      for (var m2 = lo; m2 <= hi; m2++) cells[m2].classList.remove(cls);
      if (!on[side]) {
        caption.textContent = 'Press a button to light up the numbers.';
        return;
      }
      caption.textContent = P[key].light;
      var slow = P[key].table || P[key].step;
      list.forEach(function (m, i) {
        if (!slow || opts.instant) cells[m].classList.add(cls);
        else
          api.later(function () {
            if (run === timers && on[side]) cells[m].classList.add(cls);
          }, 140 * i);
      });
    }
    var btnA = el('button', { class: 'btn vpg-light vpg-light-a', type: 'button' }, '💡 ' + P[a].label);
    var btnB = el('button', { class: 'btn vpg-light vpg-light-b', type: 'button' }, '💡 ' + P[b].label);
    function toggle(side, key, btn) {
      on[side] = !on[side];
      btn.classList.toggle('vpg-pressed', on[side]);
      paint(side, key);
      if (opts.onLight) opts.onLight(side, on[side]);
    }
    btnA.addEventListener('click', function () {
      toggle('a', a, btnA);
    });
    btnB.addEventListener('click', function () {
      toggle('b', b, btnB);
    });
    var box = el('div', { class: 'vpg-strip' }, el('div', { class: 'vpg-strip-title' }, 'Number helper ' + lo + '–' + hi), el('div', { class: 'vpg-btns' }, btnA, btnB), caption, grid);
    if (opts.note) box.appendChild(el('div', { class: 'vpg-strip-note' }, opts.note));
    box.lightAll = function () {
      opts.instant = true;
      if (!on.a) toggle('a', a, btnA);
      if (!on.b) toggle('b', b, btnB);
      caption.textContent = 'Blue = ' + P[a].label.toLowerCase() + ' · Orange = ' + P[b].label.toLowerCase() + ' · Both colours = both';
    };
    return box;
  }

  /* ---------------- deck ---------------- */
  function levelOf(i, count) {
    return i < count / 3 ? 1 : i < (2 * count) / 3 ? 2 : 3;
  }
  function pickTiles(a, b, lo, hi, k) {
    var c = countRegions(a, b, lo, hi);
    var chosen = [];
    U.shuffle(['L', 'B', 'R', 'O']).forEach(function (reg) {
      if (c[reg].length) chosen.push(U.pick(c[reg]));
    });
    var rest = U.shuffle(U.range(lo, hi).filter(function (n) {
      return chosen.indexOf(n) < 0;
    }));
    while (chosen.length < k) chosen.push(rest.pop());
    return U.shuffle(chosen.slice(0, k));
  }
  function maybeSwap(a, b) {
    return Math.random() < 0.5 ? [a, b] : [b, a];
  }
  function buildDeck(count) {
    var l1 = U.shuffle(L1_PAIRS.slice());
    var l2 = U.shuffle(L2_PAIRS.slice());
    var emp = U.shuffle(EMPTY_PAIRS.slice());
    var full = U.shuffle(FULL_PAIRS.slice());
    var l3 = [];
    var n3 = 0;
    for (var i = 0; i < count; i++) if (levelOf(i, count) === 3) n3++;
    for (var j = 0; j < n3; j++) {
      // first level-3 question always has an empty part; the rest are a mix
      var useEmpty = j === 0 || Math.random() < 0.5;
      var src = useEmpty ? emp.shift() : full.shift();
      var swap = Math.random() < 0.5;
      l3.push({
        type: 'empty',
        a: swap ? src.b : src.a,
        b: swap ? src.a : src.b,
        empty: src.empty ? (swap ? FLIP[src.empty] : src.empty) : null,
        reason: src.reason || null,
        lo: 1,
        hi: 40,
      });
    }
    l3 = U.shuffle(l3);
    var deck = [];
    for (var q = 0; q < count; q++) {
      var lv = levelOf(q, count);
      if (lv === 3) {
        deck.push(l3.shift());
        continue;
      }
      var pair = lv === 1 ? l1.shift() : l2.shift();
      var ab = maybeSwap(pair[0], pair[1]);
      var lo = 1;
      var hi = lv === 1 ? 30 : 50;
      deck.push({ type: 'sort', a: ab[0], b: ab[1], lo: lo, hi: hi, tiles: pickTiles(ab[0], ab[1], lo, hi, lv === 1 ? 4 : 5) });
    }
    return deck;
  }

  /* ---------------- learn screens ---------------- */
  function layout(left, right) {
    return el('div', { class: 'vpg-row' }, el('div', { class: 'vpg-main' }, left), right);
  }

  function learnFill(stage, api) {
    api.say('Two cards: Even and Multiples of 3. Can you put a number in every part?');
    api.lockNext();
    stage.appendChild(el('div', { class: 'prompt', html: 'Drag <b>2</b>, <b>3</b> and <b>6</b> into the right parts.' }));
    var placed = 0;
    var v = venn(api, 'even', 'm3', {
      tiles: [2, 3, 6],
      onDrop: function (t, reg) {
        var want = regionOf(t.n, 'even', 'm3');
        if (reg !== want) {
          api.sound('wrong');
          api.feedback(t.n + ': ' + P.even.why(t.n) + ', and ' + P.m3.why(t.n) + '. Try another part.', 'try');
          return false;
        }
        api.sound('correct');
        t.g.classList.add('vpg-good');
        t.done = true;
        placed = v.tiles.filter(function (x) {
          return x.done;
        }).length;
        api.feedback(workLine(t.n, 'even', 'm3'), 'good');
        if (placed === 3) {
          v.lock();
          api.say('Every part has a number. That is 2 points!', 'cheer');
          api.feedback('2 is even only · 3 is a multiple of 3 only · 6 is both. All three parts filled = <b>2 points</b>!', 'good');
          api.unlockNext();
        }
        return true;
      },
    });
    stage.appendChild(layout(v.svg, strip(api, 'even', 'm3', 1, 20)));
  }

  function learnEmpty(stage, api) {
    api.say('New cards: Odd, and one more than a 4× number. Watch the right part.');
    api.lockNext();
    stage.appendChild(el('div', { class: 'prompt', html: 'Drag the numbers in. Can anything go in the <b>?</b> part?' }));
    var asked = false;
    var askBox = el('div', { class: 'vpg-ask' });
    var v = venn(api, 'odd', 'one4', {
      tiles: [3, 5, 9, 13],
      onDrop: function (t, reg) {
        var want = regionOf(t.n, 'odd', 'one4');
        if (reg !== want) {
          api.sound('wrong');
          api.feedback(t.n + ': ' + P.odd.why(t.n) + '; ' + P.one4.why(t.n) + '. Try another part.', 'try');
          return false;
        }
        api.sound('correct');
        t.g.classList.add('vpg-good');
        t.done = true;
        api.feedback(workLine(t.n, 'odd', 'one4'), 'good');
        if (!asked && v.tiles.every(function (x) {
          return x.done;
        })) {
          asked = true;
          v.lock();
          ask();
        }
        return true;
      },
    });
    v.note('R', '?', 'vpg-q');
    function ask() {
      api.say('5, 9 and 13 all went in the middle. Can any number go in the ? part?', 'think');
      askBox.appendChild(el('div', { class: 'vpg-ask-q' }, 'A number that is one more than a 4× number but NOT odd?'));
      var ch = MQ.ui.choices(
        [
          { label: 'Yes, I can find one', value: 'yes' },
          { label: 'No, it must stay empty', value: 'no' },
        ],
        function (val) {
          if (val === 'yes') {
            ch.mark('yes', 'bad');
            api.feedback('Try some: 0 + 1 = 1, 4 + 1 = 5, 8 + 1 = 9, 12 + 1 = 13 … every one is odd.', 'try');
            return;
          }
          ch.mark('no', 'good');
          ch.disable();
          v.mark('R', 'vpg-empty');
          v.clearNotes();
          v.note('R', 'empty', 'vpg-q');
          api.say('Yes! 4× numbers are even. Even plus 1 is odd. 1 point for that reason!', 'cheer');
          api.feedback('The 4 times table (0, 4, 8, 12 …) is all even. One more than an even number is always odd, so the ? part stays empty. Explaining that = <b>1 point</b>.', 'good');
          api.unlockNext();
        },
        { columns: 2 }
      );
      askBox.appendChild(ch);
    }
    stage.appendChild(layout(el('div', null, v.svg, askBox), strip(api, 'odd', 'one4', 1, 20, { note: '0 × 4 = 0 is in the 4 times table, so 1 (= 0 + 1) counts.' })));
  }

  function learnScore(stage, api) {
    api.say('Here is how to score. Click both cards.');
    api.lockNext();
    stage.appendChild(el('div', { class: 'prompt', html: 'How to score in the Venn card game' }));
    var seen = {};
    function card(key, a, b, fill, title, pts) {
      var v = venn(api, a, b, { small: true });
      fill(v);
      var back = el('div', { class: 'vpg-points' }, pts);
      var c = el('button', { class: 'vpg-score', type: 'button' }, v.svg, el('div', { class: 'vpg-score-title' }, title), back);
      c.addEventListener('click', function () {
        api.sound('star');
        c.classList.add('vpg-flipped');
        seen[key] = true;
        if (seen.two && seen.one) {
          api.say('Two points for filling all three. One point for a good reason!', 'cheer');
          api.feedback('Now play! Some pairs fill every part. Some pairs have a part that must stay empty.', 'good');
          api.unlockNext();
        }
      });
      return c;
    }
    stage.appendChild(
      el(
        'div',
        { class: 'vpg-scores' },
        card(
          'two',
          'even',
          'm3',
          function (v) {
            v.staticTile(2, 'L');
            v.staticTile(6, 'B');
            v.staticTile(3, 'R');
          },
          'All three parts have a number',
          '⭐⭐ 2 points'
        ),
        card(
          'one',
          'odd',
          'one4',
          function (v) {
            v.staticTile(3, 'L');
            v.staticTile(5, 'B');
            v.mark('R', 'vpg-empty');
            v.note('R', 'empty', 'vpg-q');
          },
          'One part must be empty, and you say why',
          '⭐ 1 point'
        )
      )
    );
  }

  /* ---------------- practice ---------------- */
  function sortQuestion(stage, api, q) {
    var a = q.a;
    var b = q.b;
    var lvl = api.level;
    api.say(lvl === 1 ? 'Drag each number to the right part. Then press Check.' : 'Use the number helper if you need to skip-count.', 'think');
    stage.appendChild(el('div', { class: 'prompt', html: 'Sort the numbers: <b>' + P[a].label + '</b> and <b>' + P[b].label + '</b>' }));
    var checkBtn = el('button', { class: 'btn vpg-check', type: 'button' }, 'Check ✔');
    var v = venn(api, a, b, {
      tiles: q.tiles,
      onChange: function () {
        v.tiles.forEach(function (t) {
          t.g.classList.remove('vpg-bad');
        });
      },
    });
    var work = el('div', { class: 'vpg-work' });
    stage.appendChild(layout(el('div', null, v.svg, el('div', { class: 'vpg-check-row' }, checkBtn), work), strip(api, a, b, q.lo, q.hi)));

    function classify(t) {
      var want = regionOf(t.n, a, b);
      var got = t.reg;
      var thinksA = got === 'L' || got === 'B';
      var thinksB = got === 'R' || got === 'B';
      if ((thinksA !== P[a].test(t.n) && P[a].table) || (thinksB !== P[b].test(t.n) && P[b].table)) {
        var key = thinksA !== P[a].test(t.n) && P[a].table ? a : b;
        return { tag: TAG.recall, key: key, want: want };
      }
      if (got === 'B') return { tag: want === 'O' ? TAG.insideNone : TAG.overlap, want: want };
      if (got === 'O') return { tag: TAG.outsideFits, want: want };
      if (want === 'B') return { tag: TAG.missedBoth, want: want };
      if (want === 'O') return { tag: TAG.insideNone, want: want };
      return { tag: TAG.wrongCircle, want: want };
    }

    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var inTray = v.tiles.filter(function (t) {
        return t.reg === 'tray';
      });
      if (inTray.length) {
        api.feedback('Drag every number into the Numbers box first (outside the circles is a place too).', 'info');
        return;
      }
      var wrong = v.tiles.filter(function (t) {
        return t.reg !== regionOf(t.n, a, b);
      });
      if (!wrong.length) {
        v.lock();
        checkBtn.disabled = true;
        v.tiles.forEach(function (t) {
          t.g.classList.add('vpg-good');
        });
        var regs = {};
        v.tiles.forEach(function (t) {
          regs[t.reg] = 1;
        });
        api.check(true, regs.L && regs.B && regs.R ? 'All in the right places, and all three parts have a number: 2 points!' : 'All in the right places!');
        return;
      }
      wrong.forEach(function (t) {
        t.g.classList.add('vpg-bad');
      });
      var t = wrong[0];
      var c = classify(t);
      var lead = wrong.length > 1 ? wrong.length + ' numbers are in the wrong place (red). ' : '';
      var hint;
      if (api.tries() >= 1) {
        hint = lead + t.n + ': ' + P[a].why(t.n) + ', and ' + P[b].why(t.n) + '. So ' + t.n + ' goes ' + regionName(c.want, a, b) + '.';
      } else if (c.tag === TAG.recall) {
        hint = lead + 'Check ' + t.n + ' on the number helper: light up “' + P[c.key].label + '”. Is ' + t.n + ' lit?';
      } else if (c.tag === TAG.overlap) {
        hint = lead + t.n + ' fits only one card. The middle is just for numbers that fit both.';
      } else if (c.tag === TAG.missedBoth) {
        hint = lead + 'Look at ' + t.n + ' again. Does it fit the other card too?';
      } else if (c.tag === TAG.outsideFits) {
        hint = lead + t.n + ' is outside, but it fits a card. Which one?';
      } else if (c.tag === TAG.insideNone) {
        hint = lead + 'Does ' + t.n + ' really fit ' + (t.reg === 'B' ? 'both cards' : 'that card') + '? Check each card.';
      } else {
        hint = lead + t.n + ' is in the wrong circle. Which card does it fit?';
      }
      api.check(false, hint, c.tag);
    });

    api.onReveal(function () {
      v.lock();
      checkBtn.disabled = true;
      v.tiles.forEach(function (t) {
        v.toTray(t);
      });
      v.tiles.forEach(function (t) {
        v.place(t, regionOf(t.n, a, b));
        t.g.classList.remove('vpg-bad');
        t.g.classList.add('vpg-good');
      });
      var lines = v.tiles
        .slice()
        .sort(function (x, y) {
          return x.n - y.n;
        })
        .map(function (t) {
          return el('div', { class: 'vpg-work-line', html: workLine(t.n, a, b) });
        });
      MQ.clear(work);
      lines.forEach(function (l) {
        work.appendChild(l);
      });
      api.feedback('Each number is checked against both cards. See the list under the diagram.', 'info');
    });
  }

  function emptyQuestion(stage, api, q) {
    var a = q.a;
    var b = q.b;
    var counts = countRegions(a, b, q.lo, q.hi); // brute force over the strip
    var emptyReg = null;
    ['L', 'B', 'R'].forEach(function (r) {
      if (!counts[r].length) emptyReg = r;
    });
    api.say('Can every part get a number? Or must one part stay empty?', 'think');
    stage.appendChild(el('div', { class: 'prompt', html: '<b>' + P[a].label + '</b> and <b>' + P[b].label + '</b>: can all three parts be filled?' }));
    var v = venn(api, a, b, {});
    var st = strip(api, a, b, q.lo, q.hi);
    var step2 = el('div', { class: 'vpg-step2' });
    var opts = [{ label: '<b>All three parts</b> can have a number', value: 'all' }];
    ['L', 'B', 'R'].forEach(function (r) {
      opts.push({ label: regionChoiceLabel(r, a, b) + ' is <b>empty</b>', value: r });
    });
    var ch = MQ.ui.choices(opts, pick, { columns: 2 });
    ch.classList.add('vpg-choices');
    ch.buttons.forEach(function (btn) {
      if (btn.value_ === 'all') return;
      btn.addEventListener('mouseenter', function () {
        if (!api.isAnswered()) v.mark(btn.value_);
      });
      btn.addEventListener('mouseleave', function () {
        if (!api.isAnswered()) v.mark(null);
      });
    });
    stage.appendChild(layout(el('div', null, v.svg, ch, step2), st));

    function showExamples() {
      v.clearNotes();
      ['L', 'B', 'R'].forEach(function (r) {
        if (counts[r].length) v.staticTile(counts[r][0], r);
      });
      if (emptyReg) {
        v.mark(emptyReg, 'vpg-empty');
        v.note(emptyReg, 'empty', 'vpg-q');
      }
    }

    function pick(val) {
      if (api.isAnswered() || step2.childNodes.length) return;
      v.mark(val === 'all' ? null : val);
      if (val === (emptyReg || 'all')) {
        ch.mark(val, 'good');
        ch.disable();
        if (!emptyReg) {
          showExamples();
          api.check(true, 'Yes! ' + counts.L[0] + ', ' + counts.B[0] + ' and ' + counts.R[0] + ' fill all three parts: 2 points!');
          return;
        }
        api.say('Yes, that part is empty. Now: why?', 'think');
        api.feedback('Right part! Now choose the reason.', 'info');
        askReason();
        return;
      }
      ch.mark(val, 'bad');
      var hint;
      var tag;
      if (val === 'all') {
        tag = TAG.missedEmpty;
        hint =
          api.tries() >= 1
            ? 'Look for a number that is ' + regionChoiceLabel(emptyReg, a, b).replace(/<\/?b>/g, '').toLowerCase() + '. Light up both cards: no number on the strip is like that.'
            : 'Light up both cards on the number helper. Is there a part with no number at all?';
      } else {
        var ex = counts[val][0];
        tag = emptyReg ? TAG.wrongEmpty : TAG.falseEmpty;
        hint = 'That part is not empty. Try ' + ex + ': ' + P[a].why(ex) + ', and ' + P[b].why(ex) + '.';
        if (api.tries() >= 1) hint += emptyReg ? ' Light up both cards and find the part with no number.' : ' Every part can have a number.';
      }
      api.check(false, hint, tag);
    }

    function askReason() {
      var others = EMPTY_PAIRS.filter(function (p) {
        return p.reason !== q.reason && [p.a, p.b].indexOf(a) < 0 && [p.a, p.b].indexOf(b) < 0;
      });
      var reasons = U.shuffle([q.reason, RANGE_WRONG, U.pick(others).reason]);
      step2.appendChild(el('div', { class: 'vpg-ask-q' }, 'Why must it stay empty?'));
      var rc = MQ.ui.choices(
        reasons.map(function (r) {
          return { label: r, value: r };
        }),
        function (r) {
          if (api.isAnswered()) return;
          if (r === q.reason) {
            rc.mark(r, 'good');
            rc.disable();
            showExamples();
            api.check(true, 'Great reason! That part can never have a number: 1 point!');
            return;
          }
          rc.mark(r, 'bad');
          var hint =
            r === RANGE_WRONG
              ? 'Bigger numbers follow the same pattern, so they would not fit either. Look for a rule that is always true.'
              : 'That is true, but it is about different cards. Which reason talks about ' + P[a].label.toLowerCase() + ' and ' + P[b].label.toLowerCase() + '?';
          api.check(false, hint, TAG.reason);
        },
        { columns: 1 }
      );
      rc.classList.add('vpg-reasons');
      step2.appendChild(rc);
    }

    api.onReveal(function () {
      ch.disable();
      ch.mark(emptyReg || 'all', 'good');
      st.lightAll();
      showExamples();
      MQ.clear(step2);
      var msg = emptyReg
        ? 'The part “' + regionChoiceLabel(emptyReg, a, b).replace(/<\/?b>/g, '') + '” is empty. ' + q.reason
        : 'All three parts can be filled: ' + workLine(counts.L[0], a, b) + '<br>' + workLine(counts.B[0], a, b) + '<br>' + workLine(counts.R[0], a, b);
      step2.appendChild(el('div', { class: 'vpg-work', html: msg }));
      api.feedback(emptyReg ? 'Light up both cards: no number lands in that part. ' + q.reason : 'Example numbers are shown in each part.', 'info');
    });
  }

  var deck = null;
  MQ.register('venn-property-game', {
    learn: [learnFill, learnEmpty, learnScore],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0 || deck.length !== api.count) deck = buildDeck(api.count);
        var q = deck[api.index];
        if (q.type === 'sort') sortQuestion(stage, api, q);
        else emptyQuestion(stage, api, q);
      },
    },
  });

  // exposed for tests only
  MQ._vpg = { P: P, regionOf: regionOf, countRegions: countRegions, buildDeck: buildDeck, EMPTY_PAIRS: EMPTY_PAIRS, FULL_PAIRS: FULL_PAIRS, L1_PAIRS: L1_PAIRS, L2_PAIRS: L2_PAIRS, SLOTS: SLOTS };

  document.head.appendChild(
    el(
      'style',
      { 'data-activity': 'venn-property-game' },
      [
        '.vpg-row{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;align-items:flex-start;width:100%;max-width:1100px}',
        '.vpg-main{flex:1 1 440px;max-width:500px;min-width:0;display:flex;flex-direction:column;align-items:center}',
        '.vpg-main>div{width:100%}',
        '.vpg-venn{width:100%;max-width:600px;height:auto;display:block;user-select:none}',
        '.vpg-rect{fill:#fffdf5;stroke:#5b5b5b;stroke-width:2.5}',
        '.vpg-reg-L{fill:#d6e8fb}',
        '.vpg-reg-R{fill:#ffe3c4}',
        '.vpg-reg-B{fill:#e4d7f5}',
        '.vpg-reg,.vpg-rect{transition:fill .2s}',
        '.vpg-hi{fill:#fff3a6 !important}',
        '.vpg-empty{fill:#eeeeee !important;stroke:#999;stroke-dasharray:6 5;stroke-width:2}',
        '.vpg-ring{fill:none;stroke-width:4;pointer-events:none}',
        '.vpg-ring-a{stroke:#2f6db0}',
        '.vpg-ring-b{stroke:#d9731a}',
        '.vpg-numbers{font-size:18px;font-weight:800;fill:#444}',
        '.vpg-card{stroke-width:3}',
        '.vpg-card-a{fill:#d6e8fb;stroke:#2f6db0}',
        '.vpg-card-b{fill:#ffe3c4;stroke:#d9731a}',
        '.vpg-card-text{font-weight:800;fill:#222}',
        '.vpg-tray{fill:#f3f1ea;stroke:#c9c4b5;stroke-width:2;stroke-dasharray:6 4}',
        '.vpg-tile rect{fill:#fff;stroke:#333;stroke-width:2.5}',
        '.vpg-tile text{font-size:22px;font-weight:800;fill:#222;pointer-events:none}',
        '.vpg-tile.dragging rect{stroke:#0b6e66;stroke-width:3.5}',
        '.vpg-tile.vpg-good rect{stroke:#2e9e4f;fill:#eaf8ee;stroke-width:3.5}',
        '.vpg-tile.vpg-bad rect{stroke:#d33;fill:#fde8e8;stroke-width:3.5}',
        '.vpg-locked .vpg-tile{cursor:default !important}',
        '.vpg-note{font-size:22px;font-weight:800;fill:#777;pointer-events:none}',
        '.vpg-q{font-size:26px;fill:#666}',
        '.vpg-strip{flex:0 1 330px;min-width:260px;background:#fff;border:2px solid var(--line);border-radius:14px;padding:10px 12px;box-sizing:border-box}',
        '.vpg-strip-title{font-weight:800;margin-bottom:6px}',
        '.vpg-btns{display:flex;flex-direction:column;gap:6px}',
        '.vpg-light{font-size:1rem;padding:6px 10px;text-align:left;background:#fff;color:var(--ink);border:2.5px solid}',
        '.vpg-light-a{border-color:#2f6db0}',
        '.vpg-light-b{border-color:#d9731a}',
        '.vpg-light-a.vpg-pressed{background:#d6e8fb}',
        '.vpg-light-b.vpg-pressed{background:#ffe3c4}',
        '.vpg-caption{font-size:.95rem;min-height:2.4em;margin:6px 0;color:var(--ink-soft)}',
        '.vpg-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:3px}',
        '.vpg-cell{text-align:center;font-weight:700;font-size:.95rem;padding:3px 0;border:1.5px solid #ddd;border-radius:6px;background:#fff}',
        '.vpg-cell.vpg-on-a{background:#9cc6f0;border-color:#2f6db0}',
        '.vpg-cell.vpg-on-b{background:#ffc58a;border-color:#d9731a}',
        '.vpg-cell.vpg-on-a.vpg-on-b{background:linear-gradient(135deg,#9cc6f0 50%,#ffc58a 50%);border-color:#7a4fb0}',
        '.vpg-strip-note{font-size:.9rem;margin-top:6px;color:var(--ink-soft)}',
        '.vpg-check-row{display:flex;justify-content:center;margin-top:6px}',
        '.vpg-check{font-size:1.15rem}',
        '.vpg-work{margin-top:8px;font-size:1rem;line-height:1.5;background:var(--info-bg);border-radius:10px;padding:6px 10px}',
        '.vpg-work:empty{display:none}',
        '.vpg-yes{color:#1f8a3e;font-weight:800}',
        '.vpg-no{color:#c22;font-weight:800}',
        '.vpg-ask{margin-top:8px}',
        '.vpg-ask-q{font-weight:800;font-size:1.1rem;text-align:center;margin:6px 0}',
        '.vpg-choices{margin-top:8px;max-width:600px}',
        '.vpg-choices .choice,.vpg-reasons .choice{font-size:1rem;min-height:48px}',
        '.vpg-step2{width:100%}',
        '.vpg-scores{display:flex;flex-wrap:wrap;gap:16px;justify-content:center}',
        '.vpg-score{flex:0 1 340px;background:#fff;border:3px solid var(--line);border-radius:16px;padding:10px;cursor:pointer;font:inherit;color:var(--ink)}',
        '.vpg-score:hover{border-color:var(--accent)}',
        '.vpg-score-title{font-weight:800;font-size:1.05rem;margin-top:6px}',
        '.vpg-points{font-size:1.4rem;font-weight:800;margin-top:6px;visibility:hidden}',
        '.vpg-flipped{border-color:#2e9e4f;background:#f2fbf4}',
        '.vpg-flipped .vpg-points{visibility:visible}',
        '.vpg-venn-small{max-width:320px;margin:0 auto}',
        '@media (max-width:900px){.vpg-strip{flex:1 1 100%}}',
      ].join('\n')
    )
  );
})();

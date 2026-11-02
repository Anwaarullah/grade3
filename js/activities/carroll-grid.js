/* Carroll Grid — sort items into a 2 by 2 grid by a rule and its opposite (Unit 10.2). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  /* ------------------------------------------------------------------ *
   * Geometry (SVG user units): header column on the left, header row on top,
   * 2 x 2 cells, card tray on the right. Cells are keyed 'yy', 'yn', 'ny', 'nn'
   * = row answer then column answer (y = fits the rule, n = does not).
   * ------------------------------------------------------------------ */
  var CW = 56;
  var CH = 44;
  var GX = 4; // outer left
  var GY = 4; // outer top
  var HX = 132; // row-header width
  var HY = 52; // column-header height
  var CELLW = 212;
  var CELLH = 168;
  var X0 = GX + HX; // first cell left
  var Y0 = GY + HY; // first cell top
  var X2 = X0 + 2 * CELLW;
  var Y2 = Y0 + 2 * CELLH;
  var TRAY = { x: X2 + 12, y: GY, w: 140, h: Y2 - GY };
  var VBW = TRAY.x + TRAY.w + 4;
  var VBH = Y2 + 4;
  var CELLS = ['yy', 'yn', 'ny', 'nn'];
  function cellBox(key) {
    var r = key.charAt(0) === 'y' ? 0 : 1;
    var c = key.charAt(1) === 'y' ? 0 : 1;
    return { x: X0 + c * CELLW, y: Y0 + r * CELLH, width: CELLW, height: CELLH, r: r, c: c };
  }
  function cellAt(x, y) {
    if (x < X0 || x > X2 || y < Y0 || y > Y2) return null;
    return (y < Y0 + CELLH ? 'y' : 'n') + (x < X0 + CELLW ? 'y' : 'n');
  }
  function inTray(x, y) {
    return x >= TRAY.x && x <= TRAY.x + TRAY.w && y >= TRAY.y && y <= TRAY.y + TRAY.h;
  }
  var SLOTS = {};
  CELLS.forEach(function (k) {
    var b = cellBox(k);
    var list = [];
    for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) list.push({ x: b.x + b.width / 2 + (c - 1) * 66, y: b.y + b.height / 2 + (r - 1) * 52 });
    // fill the middle row first so small groups sit centrally
    SLOTS[k] = [list[4], list[3], list[5], list[1], list[7], list[0], list[2], list[6], list[8]];
  });
  var TRAY_SLOTS = [];
  for (var ti = 0; ti < 12; ti++) TRAY_SLOTS.push({ x: TRAY.x + (ti % 2 ? 105 : 35), y: GY + 62 + Math.floor(ti / 2) * 52 });
  var CAP = 5;

  /* ------------------------------------------------------------------ *
   * Data. Every property is written out; null = not clear-cut (never used with that rule).
   * ------------------------------------------------------------------ */
  var COLOURS = { blue: '#2f6fe0', yellow: '#f5c518', red: '#e5484d' };
  // flat coloured shapes for colour / shape rules
  var FLAT = {
    circle: { name: 'circle', curves: 1, four: 0 },
    oval: { name: 'oval', curves: 1, four: 0 },
    semi: { name: 'semicircle', curves: 1, four: 0 },
    triangle: { name: 'triangle', curves: 0, four: 0 },
    square: { name: 'square', curves: 0, four: 1 },
    rectangle: { name: 'rectangle', curves: 0, four: 1 },
  };
  // everyday objects
  var OBJ = {
    apple: { e: '🍎', name: 'red apple', red: 1, food: 1, round: 1 },
    tomato: { e: '🍅', name: 'tomato', red: 1, food: 1, round: 1 },
    cherries: { e: '🍒', name: 'bunch of cherries', red: 1, food: 1, round: 1 },
    banana: { e: '🍌', name: 'banana', red: 0, food: 1, round: 0 },
    cheese: { e: '🧀', name: 'cheese', red: 0, food: 1, round: 0 },
    carrot: { e: '🥕', name: 'carrot', red: 0, food: 1, round: 0 },
    orange: { e: '🍊', name: 'orange', red: 0, food: 1, round: 1 },
    cookie: { e: '🍪', name: 'cookie', red: 0, food: 1, round: 1 },
    book: { e: '📕', name: 'red book', red: 1, food: 0, round: 0 },
    rose: { e: '🌹', name: 'rose', red: 1, food: 0, round: 0 },
    car: { e: '🚗', name: 'red car', red: 1, food: 0, round: 0 },
    football: { e: '⚽', name: 'football', red: 0, food: 0, round: 1 },
    basketball: { e: '🏀', name: 'basketball', red: 0, food: 0, round: 1 },
    teddy: { e: '🧸', name: 'teddy bear', red: 0, food: 0, round: 0 },
    sponge: { e: '🧽', name: 'sponge', red: 0, food: 0, round: 0 },
  };
  var OBJ_PAIRS = [
    ['red', 'food'],
    ['food', 'round'],
  ];
  // household objects for "make your own"
  var HOME = {
    teddy: { e: '🧸', name: 'teddy bear', wheels: 0, wood: 0, soft: 1, elec: 0 },
    chair: { e: '🪑', name: 'wooden chair', wheels: 0, wood: 1, soft: 0, elec: 0 },
    bike: { e: '🚲', name: 'bicycle', wheels: 1, wood: 0, soft: 0, elec: 0 },
    tv: { e: '📺', name: 'television', wheels: 0, wood: 0, soft: 0, elec: 1 },
    socks: { e: '🧦', name: 'sock', wheels: 0, wood: 0, soft: 1, elec: 0 },
    skateboard: { e: '🛹', name: 'skateboard', wheels: 1, wood: 1, soft: 0, elec: 0 },
  };
  var HOME_RULES = ['wheels', 'wood', 'soft', 'elec'];
  // the eight shapes from Check your progress: 2D or not, vertices or not
  var SOLIDS = {
    rect: { name: 'rectangle', d2: 1, vert: 1, vn: 4 },
    cube: { name: 'cube', d2: 0, vert: 1, vn: 8 },
    circ: { name: 'circle', d2: 1, vert: 0, vn: 0 },
    cyl: { name: 'cylinder', d2: 0, vert: 0, vn: 0 },
    tri: { name: 'triangle', d2: 1, vert: 1, vn: 3 },
    pent: { name: 'pentagon', d2: 1, vert: 1, vn: 5 },
    hex: { name: 'hexagon', d2: 1, vert: 1, vn: 6 },
    oct: { name: 'octagon', d2: 1, vert: 1, vn: 8 },
  };

  /* ------------------------------------------------------------------ *
   * Rules: {label, notLabel, test(card), why(card)}
   * ------------------------------------------------------------------ */
  function cardName(c) {
    if (c.n != null) return String(c.n);
    if (c.flat) return 'the ' + c.colour + ' ' + FLAT[c.flat].name;
    if (c.obj) return 'the ' + OBJ[c.obj].name;
    if (c.home) return 'the ' + HOME[c.home].name;
    return 'the ' + SOLIDS[c.solid].name;
  }
  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function jumpsText(n, k) {
    var lo = Math.floor(n / k) * k;
    if (lo === n) {
      var list = [];
      if (n / k <= 7) for (var i = k; i <= n; i += k) list.push(i);
      else list = ['…', n - 2 * k, n - k, n];
      return 'jumps of ' + k + ' land on it (' + list.join(', ') + ')';
    }
    return 'jumps of ' + k + ' go ' + lo + ', ' + (lo + k) + ' and jump over ' + n;
  }
  function digits(n) {
    return String(n).length;
  }
  var CACHE = {};
  function rule(id) {
    if (CACHE[id]) return CACHE[id];
    var p = id.split(':');
    var k = p[1] != null ? parseInt(p[1], 10) : null;
    var r;
    function prop(getter, label, notLabel, yes, no) {
      return {
        label: label,
        notLabel: notLabel,
        test: function (c) {
          return getter(c) === 1;
        },
        why: function (c) {
          return cardName(c) + ' ' + (getter(c) === 1 ? yes : no);
        },
      };
    }
    switch (p[0]) {
      case 'blue':
      case 'yellow':
        r = prop(
          function (c) {
            return c.flat ? (c.colour === p[0] ? 1 : 0) : null;
          },
          p[0],
          'not ' + p[0],
          'is ' + p[0],
          'is not ' + p[0]
        );
        break;
      case 'red':
        r = prop(
          function (c) {
            return c.flat ? (c.colour === 'red' ? 1 : 0) : c.obj ? OBJ[c.obj].red : null;
          },
          'red',
          'not red',
          'is red',
          'is not red'
        );
        break;
      case 'curves':
        r = prop(
          function (c) {
            return FLAT[c.flat].curves;
          },
          'curves',
          'not curves',
          'has a curved edge',
          'has only straight sides'
        );
        break;
      case 'four':
        r = prop(
          function (c) {
            return FLAT[c.flat].four;
          },
          '4 sides',
          'not 4 sides',
          'has 4 straight sides',
          'does not have 4 straight sides'
        );
        break;
      case 'food':
        r = prop(
          function (c) {
            return OBJ[c.obj].food;
          },
          'food',
          'not food',
          'is food',
          'is not food'
        );
        break;
      case 'round':
        r = prop(
          function (c) {
            return OBJ[c.obj].round;
          },
          'round',
          'not round',
          'is round',
          'is not round'
        );
        break;
      case 'wheels':
        r = prop(function (c) { return HOME[c.home].wheels; }, 'has wheels', 'no wheels', 'has wheels', 'has no wheels');
        break;
      case 'wood':
        r = prop(function (c) { return HOME[c.home].wood; }, 'made of wood', 'not wood', 'is made of wood', 'is not made of wood');
        break;
      case 'soft':
        r = prop(function (c) { return HOME[c.home].soft; }, 'soft', 'not soft', 'is soft', 'is not soft');
        break;
      case 'elec':
        r = prop(function (c) { return HOME[c.home].elec; }, 'uses electricity', 'no electricity', 'uses electricity', 'does not use electricity');
        break;
      case 'd2':
        r = {
          label: '2D',
          notLabel: 'not 2D',
          test: function (c) {
            return SOLIDS[c.solid].d2 === 1;
          },
          why: function (c) {
            return SOLIDS[c.solid].d2 ? cardName(c) + ' is flat (2D)' : cardName(c) + ' is a solid 3D shape, even though it is drawn on a flat screen';
          },
        };
        break;
      case 'vert':
        r = {
          label: 'has vertices',
          notLabel: 'no vertices',
          test: function (c) {
            return SOLIDS[c.solid].vert === 1;
          },
          why: function (c) {
            var s = SOLIDS[c.solid];
            if (s.vert) return cardName(c) + ' has ' + s.vn + ' vertices (corners)';
            return cardName(c) + ' has no vertices: its edges are curved, with no corners';
          },
        };
        break;
      case 'even':
        r = {
          label: 'even',
          notLabel: 'not even',
          test: function (c) {
            return c.n % 2 === 0;
          },
          why: function (c) {
            return c.n + ' ends in ' + (c.n % 10) + ', so it is ' + (c.n % 2 === 0 ? 'even' : 'not even (odd)');
          },
        };
        break;
      case 'odd':
        r = {
          label: 'odd',
          notLabel: 'not odd',
          test: function (c) {
            return c.n % 2 === 1;
          },
          why: function (c) {
            return c.n + ' ends in ' + (c.n % 10) + ', so it is ' + (c.n % 2 === 1 ? 'odd' : 'not odd (even)');
          },
        };
        break;
      case 'mult':
      case 'div':
        r = {
          label: (p[0] === 'div' ? 'divisible by ' : 'multiple of ') + k,
          notLabel: p[0] === 'div' ? 'not divisible by ' + k : 'not a multiple of ' + k,
          mult: k,
          test: function (c) {
            return c.n % k === 0;
          },
          why: function (c) {
            if (k === 10) return c.n + ' ends in ' + (c.n % 10) + ', so it is ' + (c.n % 10 === 0 ? '' : 'not ') + 'a multiple of 10';
            return c.n + (c.n % k === 0 ? ' is' : ' is not') + ' ' + (p[0] === 'div' ? 'divisible by ' : 'a multiple of ') + k + ': ' + jumpsText(c.n, k);
          },
        };
        break;
      case 'lt':
        r = {
          label: 'less than ' + k,
          notLabel: 'not less than ' + k,
          test: function (c) {
            return c.n < k;
          },
          why: function (c) {
            if (c.n === k) return c.n + ' is not less than ' + k + ' (not less than ' + k + ' means ' + k + ' or more)';
            return c.n + ' is ' + (c.n < k ? '' : 'not ') + 'less than ' + k;
          },
        };
        break;
      case 'dig':
        r = {
          label: k + '-digit',
          notLabel: 'not ' + k + '-digit',
          test: function (c) {
            return digits(c.n) === k;
          },
          why: function (c) {
            var d = digits(c.n);
            return c.n + ' has ' + d + (d === 1 ? ' digit' : ' digits');
          },
        };
        break;
      default:
        throw new Error('Unknown rule ' + id);
    }
    r.id = id;
    CACHE[id] = r;
    return r;
  }
  // q.row and q.col are rule ids. Cell key = row answer + column answer.
  function cellFor(row, col, c) {
    return (rule(row).test(c) ? 'y' : 'n') + (rule(col).test(c) ? 'y' : 'n');
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  function distribute(row, col, items, total, minEach) {
    var by = { yy: [], yn: [], ny: [], nn: [] };
    items.forEach(function (c) {
      by[cellFor(row, col, c)].push(c);
    });
    var counts = {};
    CELLS.forEach(function (k) {
      counts[k] = by[k].length ? Math.min(minEach == null ? 1 : minEach, by[k].length) : 0;
    });
    var left = total - CELLS.reduce(function (s, k) {
      return s + counts[k];
    }, 0);
    var guard = 0;
    while (left > 0 && guard++ < 100) {
      var open = CELLS.filter(function (k) {
        return counts[k] < Math.min(CAP, by[k].length);
      });
      if (!open.length) break;
      counts[U.pick(open)]++;
      left--;
    }
    var cards = [];
    CELLS.forEach(function (k) {
      U.shuffle(by[k])
        .slice(0, counts[k])
        .forEach(function (c) {
          cards.push(Object.assign({}, c, { cell: k }));
        });
    });
    return U.shuffle(cards);
  }
  function nums(list) {
    return list.map(function (n) {
      return { n: n };
    });
  }
  function flatItems() {
    var out = [];
    Object.keys(FLAT).forEach(function (f) {
      Object.keys(COLOURS).forEach(function (c) {
        out.push({ flat: f, colour: c });
      });
    });
    return out;
  }
  function round(kind, row, col, items, total, extra) {
    return Object.assign({ type: 'sort', kind: kind, row: row, col: col, cards: distribute(row, col, items, total) }, extra || {});
  }
  function stripMax(cards, steps) {
    var m = Math.max.apply(null, cards.map(function (c) {
      return c.n;
    }));
    steps.forEach(function (k) {
      m = Math.max(m, Math.ceil(m / k) * k);
    });
    return m;
  }
  function mixNums() {
    // 1-, 2- and 3-digit numbers, some multiples of 10 (workbook p.148-149 style)
    var out = [];
    U.range(1, 9).forEach(function (n) {
      out.push(n);
    });
    U.range(10, 99).forEach(function (n) {
      out.push(n);
    });
    for (var n = 100; n <= 990; n += U.rand(7, 23)) out.push(n);
    for (var t = 110; t <= 990; t += 10) if (out.indexOf(t) === -1 && Math.random() < 0.25) out.push(t);
    return nums(out);
  }
  function lt50Nums() {
    // numbers below 50, 50 itself, 50-99 and some 3-digit numbers (workbook p.144 Q5)
    var list = U.range(4, 99);
    [106, 245, 555, 912, 130, 371, 208, 764, 199, 450].forEach(function (n) {
      list.push(n);
    });
    return nums(list);
  }
  var MAKERS = {
    lt50odd: function () {
      var q;
      for (var t = 0; t < 100; t++) {
        q = round('lt50odd', 'lt:50', 'odd', lt50Nums().filter(function (c) {
          return c.n !== 50;
        }), 7);
        if (q.cards.filter(function (c) { return c.n >= 100; }).length >= 2) break;
      }
      if (Math.random() < 0.7) {
        // 50 belongs in 'not less than 50'
        q.cards.push({ n: 50, cell: cellFor('lt:50', 'odd', { n: 50 }) });
        q.cards = U.shuffle(q.cards);
      } else {
        var big = U.pick([245, 555, 912, 106, 130, 371, 208, 764, 199, 450].filter(function (n) {
          return !q.cards.some(function (x) {
            return x.n === n;
          });
        }));
        q.cards.push({ n: big, cell: cellFor('lt:50', 'odd', { n: big }) });
      }
      return q;
    },
    d3d5: function () {
      var q = round('d3d5', 'div:3', 'div:5', nums(U.range(10, 69)), 8);
      q.steps = [3, 5];
      q.max = stripMax(q.cards, q.steps);
      return q;
    },
    dig10: function () {
      return round('dig10', 'dig:3', 'mult:10', mixNums(), 8);
    },
    hidden: function () {
      return hiddenRound();
    },
  };
  var HIDDEN_SETS = [
    { row: 'dig:3', col: 'mult:10', items: mixNums, pool: ['even', 'lt:50', 'dig:2', 'mult:5'] },
    { row: 'lt:50', col: 'odd', items: lt50Nums, pool: ['dig:3', 'mult:5', 'lt:20', 'mult:3'] },
    { row: 'div:3', col: 'div:5', items: function () { return nums(U.range(10, 69)); }, pool: ['even', 'div:10', 'lt:50', 'odd'] },
    { row: 'even', col: 'mult:3', items: function () { return nums(U.range(10, 24)); }, pool: ['mult:4', 'lt:20', 'mult:5', 'odd'] },
  ];
  function sameSort(row, col, cards) {
    return cards.every(function (c) {
      return cellFor(row, col, c) === c.cell;
    });
  }
  function hiddenRound() {
    for (var t = 0; t < 300; t++) {
      var set = U.pick(HIDDEN_SETS);
      var cards = distribute(set.row, set.col, set.items(), 8);
      if (CELLS.some(function (k) { return !cards.some(function (c) { return c.cell === k; }); })) continue;
      var opts = [set.row, set.col].concat(U.shuffle(set.pool).slice(0, 2));
      var ok = true;
      opts.forEach(function (r) {
        opts.forEach(function (c) {
          if (r === c || (r === set.row && c === set.col)) return;
          if (sameSort(r, c, cards)) ok = false;
        });
      });
      if (!ok) continue;
      var steps = opts
        .filter(function (o) {
          return /^(mult|div):/.test(o) && !/:10$/.test(o);
        })
        .map(function (o) {
          return parseInt(o.split(':')[1], 10);
        })
        .filter(function (k, i, a) {
          return a.indexOf(k) === i;
        })
        .sort(function (a, b) {
          return a - b;
        });
      var maxN = Math.max.apply(null, cards.map(function (c) { return c.n; }));
      if (maxN > 120) steps = []; // jumps only make sense for small numbers
      var q = { type: 'hidden', kind: 'hidden', row: set.row, col: set.col, options: U.shuffle(opts), cards: U.shuffle(cards) };
      if (steps.length) {
        q.steps = steps;
        q.max = stripMax(cards, steps);
      }
      return q;
    }
    throw new Error('hiddenRound failed');
  }

  function buildDeck() {
    var q = [];
    // Level 1: pictures
    q.push(round('flat', 'blue', 'curves', flatItems().filter(function (c) {
      return c.colour !== 'red' || Math.random() < 0.5;
    }), 6));
    q.push(round('flat', U.pick(['red', 'yellow']), 'four', flatItems(), 6));
    var op = U.pick(OBJ_PAIRS);
    q.push(round('obj', op[0], op[1], Object.keys(OBJ).map(function (k) {
      return { obj: k };
    }), 7));
    // Level 2: numbers 10-24 (even x multiple of 3), the eight shapes, 1-digit x even
    var l2 = [
      round('n1024', 'even', 'mult:3', nums(U.range(10, 24)), 8, { steps: [2, 3], max: 24 }),
      Object.assign({ type: 'sort', kind: 'solids', row: 'd2', col: 'vert' }, {
        cards: U.shuffle(Object.keys(SOLIDS).map(function (k) {
          return { solid: k, cell: cellFor('d2', 'vert', { solid: k }) };
        })),
      }),
      round('dig1', 'dig:1', 'even', nums(U.range(1, 120)), 8),
    ];
    U.shuffle(l2).forEach(function (x) {
      q.push(x);
    });
    // Level 3: a hidden-label round plus two of the workbook extras
    var l3 = ['hidden'].concat(U.shuffle(['lt50odd', 'd3d5', 'dig10']).slice(0, 2));
    U.shuffle(l3).forEach(function (k) {
      q.push(MAKERS[k]());
    });
    return q;
  }

  /* ------------------------------------------------------------------ *
   * Card pictures
   * ------------------------------------------------------------------ */
  function flatSvg(kind, colour) {
    var f = { fill: COLOURS[colour], stroke: '#1b2a4a', 'stroke-width': 1.5, 'stroke-linejoin': 'round' };
    var g = S('g', { transform: 'translate(8,6)' });
    if (kind === 'circle') g.appendChild(S('circle', Object.assign({ cx: 20, cy: 16, r: 14 }, f)));
    else if (kind === 'oval') g.appendChild(S('ellipse', Object.assign({ cx: 20, cy: 16, rx: 19, ry: 11 }, f)));
    else if (kind === 'semi') g.appendChild(S('path', Object.assign({ d: 'M3 25 A17 17 0 0 1 37 25 Z' }, f)));
    else if (kind === 'triangle') g.appendChild(S('polygon', Object.assign({ points: '4,30 36,30 20,2' }, f)));
    else if (kind === 'square') g.appendChild(S('rect', Object.assign({ x: 7, y: 3, width: 26, height: 26 }, f)));
    else g.appendChild(S('rect', Object.assign({ x: 1, y: 7, width: 38, height: 19 }, f)));
    return g;
  }
  function regPoly(n, cx, cy, r, rot) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var a = (rot || -Math.PI / 2) + (2 * Math.PI * i) / n;
      pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  }
  function solidSvg(k) {
    var st = { fill: '#cfe3ff', stroke: '#1b2a4a', 'stroke-width': 1.6, 'stroke-linejoin': 'round' };
    var g = S('g', { transform: 'translate(8,6)' });
    var add = function (tag, a) {
      g.appendChild(S(tag, Object.assign({}, st, a)));
    };
    if (k === 'rect') add('rect', { x: 2, y: 7, width: 36, height: 19 });
    else if (k === 'circ') add('circle', { cx: 20, cy: 16, r: 14 });
    else if (k === 'tri') add('polygon', { points: '4,30 36,30 20,3' });
    else if (k === 'pent') add('polygon', { points: regPoly(5, 20, 17.5, 15) });
    else if (k === 'hex') add('polygon', { points: regPoly(6, 20, 16, 15, 0) });
    else if (k === 'oct') add('polygon', { points: regPoly(8, 20, 16, 15, Math.PI / 8) });
    else if (k === 'cube') {
      add('polygon', { points: '4,12 26,12 26,31 4,31', fill: '#cfe3ff' });
      add('polygon', { points: '4,12 13,4 35,4 26,12', fill: '#e6f0ff' });
      add('polygon', { points: '26,12 35,4 35,23 26,31', fill: '#9fbfec' });
    } else if (k === 'cyl') {
      add('path', { d: 'M8 7 L8 26 A12 5 0 0 0 32 26 L32 7', fill: '#9fbfec' });
      add('ellipse', { cx: 20, cy: 7, rx: 12, ry: 5, fill: '#e6f0ff' });
    }
    return g;
  }
  function cardFace(c) {
    if (c.n != null) return S('text', { x: CW / 2, y: CH / 2 + 1, class: 'cg-cnum', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, String(c.n));
    if (c.flat) return flatSvg(c.flat, c.colour);
    if (c.solid) return solidSvg(c.solid);
    var e = c.obj ? OBJ[c.obj].e : HOME[c.home].e;
    return S('text', { x: CW / 2, y: CH / 2 + 2, class: 'cg-cemo', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, e);
  }

  /* ------------------------------------------------------------------ *
   * Skip-count checker (number line with jumps of k, and a pin for a card's number)
   * ------------------------------------------------------------------ */
  function makeStrip(max, steps) {
    var x0 = 24;
    var x1 = 736;
    var ly = 56;
    var X = function (n) {
      return x0 + ((x1 - x0) * n) / max;
    };
    var root = S('svg', { viewBox: '0 -8 760 112', class: 'cg-strip-svg', role: 'img', 'aria-label': 'Number line from 0 to ' + max });
    var tens = S('g');
    var pinG = S('g');
    var jumps = S('g');
    var pinTop = S('g');
    root.appendChild(S('line', { x1: x0, y1: ly, x2: x1, y2: ly, class: 'cg-sline' }));
    for (var n = 0; n <= max; n++) {
      var big = n % 10 === 0;
      root.appendChild(S('line', { x1: X(n), y1: ly - (big ? 6 : 3), x2: X(n), y2: ly + (big ? 6 : 3), class: 'cg-stick' }));
      if (big || n === max) tens.appendChild(S('text', { x: X(n), y: ly + 17, class: 'cg-stens', 'text-anchor': 'middle' }, String(n)));
    }
    root.appendChild(tens);
    root.appendChild(pinG);
    root.appendChild(jumps);
    root.appendChild(pinTop);
    var active = [];
    var buttons = steps.map(function (k) {
      var b = el('button', { class: 'cg-jbtn', type: 'button', 'data-step': k }, el('span', { class: 'cg-jarc' }, '⤻'), ' Jumps of ' + k);
      b.addEventListener('click', function () {
        toggle(k);
      });
      return b;
    });
    function draw() {
      MQ.clear(jumps);
      tens.style.display = active.length > 1 ? 'none' : '';
      active.forEach(function (k, lane) {
        var dir = lane === 0 ? -1 : 1;
        var every = (k * (x1 - x0)) / max >= 21 ? 1 : 2;
        var i = 0;
        for (var v = 0; v + k <= max; v += k, i++) {
          var xa = X(v);
          var xb = X(v + k);
          var delay = Math.min(i * 45, 1200) + 'ms';
          jumps.appendChild(S('path', { d: 'M' + xa + ' ' + ly + ' Q' + (xa + xb) / 2 + ' ' + (ly + dir * 30) + ' ' + xb + ' ' + ly, pathLength: 1, class: 'cg-arc cg-lane' + lane, style: { animationDelay: delay } }));
          jumps.appendChild(S('circle', { cx: xb, cy: ly, r: 4, class: 'cg-land cg-lane' + lane, style: { animationDelay: delay } }));
          if ((i + 1) % every === 0) jumps.appendChild(S('text', { x: xb, y: lane === 0 ? ly - 31 : ly + 44, class: 'cg-jlab cg-lane' + lane, 'text-anchor': 'middle', style: { animationDelay: delay } }, String(v + k)));
        }
      });
      buttons.forEach(function (b) {
        b.classList.toggle('cg-on', active.indexOf(+b.getAttribute('data-step')) !== -1);
      });
    }
    function toggle(k, force) {
      var i = active.indexOf(k);
      var on = force != null ? force : i === -1;
      if (on && i === -1) {
        active.push(k);
        if (active.length > 2) active.shift();
      } else if (!on && i !== -1) active.splice(i, 1);
      draw();
    }
    function pin(v) {
      MQ.clear(pinG);
      MQ.clear(pinTop);
      if (v == null || v > max) return;
      var x = X(v);
      var w = String(v).length * 10 + 14;
      pinG.appendChild(S('line', { x1: x, y1: 4, x2: x, y2: ly + 8, class: 'cg-pinline' }));
      pinTop.appendChild(S('rect', { x: x - w / 2, y: -8, width: w, height: 19, rx: 9.5, class: 'cg-pinbox' }));
      pinTop.appendChild(S('text', { x: x, y: 6.5, class: 'cg-pintext', 'text-anchor': 'middle' }, String(v)));
    }
    return { el: el('div', { class: 'cg-strip' }, root), buttons: buttons, toggle: toggle, pin: pin, isOn: function (k) { return active.indexOf(k) !== -1; } };
  }

  /* ------------------------------------------------------------------ *
   * The grid: cards drag with pointer events, or click a card then a cell.
   * Hovering a cell lights its row and column headers.
   * ------------------------------------------------------------------ */
  function wrapWords(t, max) {
    var words = t.split(' ');
    var lines = [''];
    words.forEach(function (w) {
      var cur = lines[lines.length - 1];
      if (cur && (cur + ' ' + w).length > max) lines.push(w);
      else lines[lines.length - 1] = cur ? cur + ' ' + w : w;
    });
    return lines;
  }
  function makeGrid(api, o) {
    var withTray = o.tray !== false;
    var W = withTray ? VBW : X2 + 4;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + VBH, class: 'cg-svg' });
    var cellRects = {};
    CELLS.forEach(function (k) {
      var b = cellBox(k);
      cellRects[k] = S('rect', { x: b.x, y: b.y, width: b.width, height: b.height, class: 'cg-cell' });
      root.appendChild(cellRects[k]);
    });
    var headLayer = S('g');
    root.appendChild(headLayer);
    root.appendChild(S('rect', { x: GX, y: GY, width: X2 - GX, height: Y2 - GY, rx: 6, class: 'cg-frame' }));
    root.appendChild(S('line', { x1: X0, y1: GY, x2: X0, y2: Y2, class: 'cg-frame-thick' }));
    root.appendChild(S('line', { x1: GX, y1: Y0, x2: X2, y2: Y0, class: 'cg-frame-thick' }));
    root.appendChild(S('line', { x1: X0 + CELLW, y1: GY, x2: X0 + CELLW, y2: Y2, class: 'cg-frame-line' }));
    root.appendChild(S('line', { x1: GX, y1: Y0 + CELLH, x2: X2, y2: Y0 + CELLH, class: 'cg-frame-line' }));
    var heads = {};
    var rules = { row: o.row, col: o.col };
    function drawHeads() {
      MQ.clear(headLayer);
      heads = {};
      [0, 1].forEach(function (i) {
        // column headers
        var cr = rules.col ? rule(rules.col) : null;
        var ct = cr ? (i === 0 ? cr.label : cr.notLabel) : '?';
        var cx = X0 + i * CELLW;
        var cg = S('g', { class: 'cg-head cg-head-col' + (cr ? '' : ' cg-head-q') });
        cg.appendChild(S('rect', { x: cx + 3, y: GY + 3, width: CELLW - 6, height: HY - 6, rx: 8 }));
        cg.appendChild(S('text', { x: cx + CELLW / 2, y: GY + HY / 2 + 6, 'text-anchor': 'middle' }, ct));
        headLayer.appendChild(cg);
        heads['c' + i] = cg;
        // row headers
        var rr = rules.row ? rule(rules.row) : null;
        var rt = rr ? (i === 0 ? rr.label : rr.notLabel) : '?';
        var ry = Y0 + i * CELLH;
        var rg = S('g', { class: 'cg-head cg-head-row' + (rr ? '' : ' cg-head-q') });
        rg.appendChild(S('rect', { x: GX + 3, y: ry + 3, width: HX - 6, height: CELLH - 6, rx: 8 }));
        var lines = wrapWords(rt, 11);
        lines.forEach(function (ln, j) {
          rg.appendChild(S('text', { x: GX + HX / 2, y: ry + CELLH / 2 + 6 + (j - (lines.length - 1) / 2) * 20, 'text-anchor': 'middle' }, ln));
        });
        headLayer.appendChild(rg);
        heads['r' + i] = rg;
      });
    }
    drawHeads();
    if (withTray) {
      root.appendChild(S('rect', { x: TRAY.x, y: TRAY.y, width: TRAY.w, height: TRAY.h, rx: 12, class: 'cg-tray' }));
      root.appendChild(S('text', { x: TRAY.x + TRAY.w / 2, y: TRAY.y + 26, class: 'cg-traylab', 'text-anchor': 'middle' }, 'Cards'));
    }
    var layer = S('g');
    root.appendChild(layer);

    var cards = [];
    var byId = {};
    var occ = {};
    CELLS.forEach(function (k) {
      occ[k] = SLOTS[k].map(function () {
        return null;
      });
    });
    var locked = false;
    var sel = null;
    var drag = null;

    function setPos(card, x, y, anim) {
      card.x = x;
      card.y = y;
      card.g.classList.toggle('cg-anim', !!anim);
      card.g.style.transform = 'translate(' + (x - CW / 2) + 'px,' + (y - CH / 2) + 'px)';
    }
    function free(card) {
      if (card.cell) occ[card.cell][card.slot] = null;
      card.cell = null;
      card.slot = -1;
    }
    function placeAt(card, k, px, py, anim) {
      if (card.cell === k && px == null) return true;
      var old = { cell: card.cell, slot: card.slot };
      free(card);
      var best = -1;
      var bestD = Infinity;
      occ[k].forEach(function (who, i) {
        if (who) return;
        var d = px == null ? i : Math.hypot(SLOTS[k][i].x - px, SLOTS[k][i].y - py);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      if (best === -1) {
        if (old.cell) {
          occ[old.cell][old.slot] = card.id;
          card.cell = old.cell;
          card.slot = old.slot;
        }
        return false;
      }
      occ[k][best] = card.id;
      card.cell = k;
      card.slot = best;
      setPos(card, SLOTS[k][best].x, SLOTS[k][best].y, anim);
      return true;
    }
    function toTray(card, anim) {
      free(card);
      var s = TRAY_SLOTS[card.tray];
      setPos(card, s.x, s.y, anim);
    }
    function hot(k) {
      CELLS.forEach(function (c) {
        cellRects[c].classList.toggle('cg-hot', c === k);
      });
      lightHeads(k, 'cg-lit');
    }
    function lightHeads(k, cls) {
      ['r0', 'r1', 'c0', 'c1'].forEach(function (h) {
        heads[h].classList.remove(cls);
      });
      if (!k) return;
      heads['r' + (k.charAt(0) === 'y' ? 0 : 1)].classList.add(cls);
      heads['c' + (k.charAt(1) === 'y' ? 0 : 1)].classList.add(cls);
    }
    function select(card) {
      sel = sel === card ? null : card;
      cards.forEach(function (c) {
        c.g.classList.toggle('cg-sel', c === sel);
      });
      if (sel && o.onPick) o.onPick(sel.c);
    }
    function changed(card) {
      card.g.classList.remove('cg-bad');
      if (o.onChange) o.onChange(card);
    }
    function drop(card, x, y) {
      var k = cellAt(x, y);
      if (k) {
        if (o.onDrop && !o.onDrop(card.c, k)) {
          toTray(card, true);
          card.g.classList.add('cg-bounce');
          api.later(function () {
            card.g.classList.remove('cg-bounce');
          }, 500);
        } else if (!placeAt(card, k, x, y, true)) toTray(card, true);
      } else toTray(card, true);
      if (sel) select(sel);
      changed(card);
    }

    o.cards.forEach(function (c, i) {
      var g = S('g', { class: 'cg-card', 'data-id': c.id, role: 'button', 'aria-label': cardName(c) });
      g.appendChild(S('rect', { x: 0, y: 0, width: CW, height: CH, rx: 9, class: 'cg-cbg' }));
      g.appendChild(cardFace(c));
      var card = { id: c.id, c: c, g: g, cell: null, slot: -1, tray: i, x: 0, y: 0 };
      cards.push(card);
      byId[c.id] = card;
      layer.appendChild(g);
      if (withTray) toTray(card, false);
    });

    function pt(e) {
      return MQ.ui.svgPoint(root, e);
    }
    layer.addEventListener('pointerdown', function (e) {
      if (locked) return;
      var g = e.target.closest ? e.target.closest('.cg-card') : null;
      if (!g) return;
      e.preventDefault();
      var card = byId[g.getAttribute('data-id')];
      var p = pt(e);
      drag = { card: card, sx: e.clientX, sy: e.clientY, ox: p.x - card.x, oy: p.y - card.y, moved: false };
    });
    function onMove(e) {
      if (!drag) {
        // a selected card: light the headers of the cell under the mouse
        if (sel && !locked) {
          var q = pt(e);
          hot(cellAt(q.x, q.y));
        }
        return;
      }
      if (!drag.moved) {
        if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) < 6) return;
        drag.moved = true;
        layer.appendChild(drag.card.g);
        drag.card.g.classList.add('cg-lift');
        if (o.onPick) o.onPick(drag.card.c);
      }
      var p = pt(e);
      setPos(drag.card, p.x - drag.ox, p.y - drag.oy, false);
      hot(cellAt(drag.card.x, drag.card.y));
    }
    function onUp() {
      if (!drag) return;
      var d = drag;
      drag = null;
      if (!d.moved) {
        select(d.card);
        return;
      }
      d.card.g.classList.remove('cg-lift');
      hot(null);
      drop(d.card, d.card.x, d.card.y);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    api.cleanup(function () {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      drag = null;
    });
    root.addEventListener('click', function (e) {
      if (locked || !sel) return;
      if (e.target.closest && e.target.closest('.cg-card')) return;
      var p = pt(e);
      var card = sel;
      if (cellAt(p.x, p.y)) {
        drop(card, p.x, p.y);
        hot(null);
      } else if (inTray(p.x, p.y)) {
        toTray(card, true);
        select(card);
        hot(null);
        changed(card);
      }
    });

    return {
      svg: root,
      el: el('div', { class: 'cg-mat' + (withTray ? '' : ' cg-mat-notray') }, root),
      cellOf: function (cid) {
        return byId[cid].cell;
      },
      place: function (cid, k) {
        var card = byId[cid];
        var ok = placeAt(card, k, null, null, true);
        changed(card);
        return ok;
      },
      lock: function () {
        locked = true;
        if (sel) select(sel);
        hot(null);
        lightHeads(null, 'cg-glow');
        root.classList.add('cg-locked');
      },
      mark: function (cid, cls) {
        byId[cid].g.classList.add(cls);
      },
      clearMarks: function () {
        cards.forEach(function (c) {
          c.g.classList.remove('cg-bad', 'cg-ok');
        });
      },
      flash: function (k) {
        var r = cellRects[k];
        r.classList.remove('cg-flash');
        void r.getBoundingClientRect();
        r.classList.add('cg-flash');
        lightHeads(k, 'cg-glow');
      },
      setRules: function (row, col) {
        rules.row = row;
        rules.col = col;
        drawHeads();
      },
      solveAll: function () {
        cards.forEach(function (c) {
          if (c.cell !== c.c.cell) free(c);
        });
        cards.forEach(function (c) {
          if (!c.cell) placeAt(c, c.c.cell, null, null, true);
        });
      },
    };
  }

  /* ------------------------------------------------------------------ *
   * Wording
   * ------------------------------------------------------------------ */
  function cellText(q, k) {
    var R = rule(q.row);
    var C = rule(q.col);
    return 'the "' + (k.charAt(0) === 'y' ? R.label : R.notLabel) + '" row and the "' + (k.charAt(1) === 'y' ? C.label : C.notLabel) + '" column';
  }
  function explain(q, c) {
    return 'Row: ' + rule(q.row).why(c) + '. Column: ' + rule(q.col).why(c) + '. So it goes in ' + cellText(q, c.cell) + '.';
  }
  function shortName(c) {
    return c.n != null ? String(c.n) : cardName(c).replace(/^the /, '');
  }
  function working(q) {
    var R = rule(q.row);
    var C = rule(q.col);
    function list(fn) {
      var cs = q.cards.filter(fn);
      return cs.length ? cs.map(shortName).join(', ') : 'none';
    }
    return (
      'Top row (' + R.label + '): ' + list(function (c) { return c.cell.charAt(0) === 'y'; }) +
      '. First column (' + C.label + '): ' + list(function (c) { return c.cell.charAt(1) === 'y'; }) +
      '. Where they meet: ' + list(function (c) { return c.cell === 'yy'; }) + '. All the rest go in the "not" cells.'
    );
  }
  function isMult(id) {
    return /^(mult|div):/.test(id) && !/:10$/.test(id);
  }

  /* ------------------------------------------------------------------ *
   * Practice: sort the cards
   * ------------------------------------------------------------------ */
  function renderSort(stage, api, q) {
    var cards = q.cards.map(function (c, i) {
      return Object.assign({ id: 'c' + i }, c);
    });
    var strip = q.steps ? makeStrip(q.max, q.steps) : null;
    var lastSig = null;
    var V = makeGrid(api, {
      row: q.row,
      col: q.col,
      cards: cards,
      onPick: function (c) {
        if (strip && c.n != null) strip.pin(c.n);
      },
    });
    var checkBtn = el('button', { class: 'btn btn-check cg-check', type: 'button' }, 'Check ✔');
    checkBtn.addEventListener('click', onCheck);
    stage.appendChild(V.el);
    stage.appendChild(el('div', { class: 'cg-ctrl' }, strip ? strip.el : null, el('div', { class: 'cg-btns' }, strip ? strip.buttons : null, checkBtn)));

    if (q.kind === 'solids') api.say('Is it flat (2D) or solid (3D)? Does it have vertices (corners)? Check the row, then the column.', 'think');
    else if (q.kind === 'lt50odd') api.say('"Not less than 50" means 50 or more. Check the row, then the column.', 'think');
    else if (strip) api.say('Not sure about a multiple? Press a jumps button, then pick up the card: the red pin shows its number.', 'think');
    else api.say('Check the row, then the column. Every card has exactly one cell.', 'think');

    function onCheck() {
      if (api.isAnswered()) return;
      if (cards.some(function (c) { return !V.cellOf(c.id); })) {
        api.feedback('Put every card in the grid first, then press Check.', 'try');
        return;
      }
      var sig = cards.map(function (c) { return V.cellOf(c.id); }).join();
      if (sig === lastSig) {
        api.feedback('Move the orange cards first, then press Check again.', 'try');
        return;
      }
      lastSig = sig;
      V.clearMarks();
      var wrong = cards.filter(function (c) {
        return V.cellOf(c.id) !== c.cell;
      });
      if (!wrong.length) {
        V.lock();
        cards.forEach(function (c) {
          V.mark(c.id, 'cg-ok');
        });
        api.check(true, 'All sorted! Every card has exactly one cell.');
        return;
      }
      wrong.forEach(function (c) {
        V.mark(c.id, 'cg-bad');
      });
      var n = wrong.length;
      var lead = n === 1 ? '1 card is in the wrong cell (orange). ' : n + ' cards are in the wrong cell (orange). ';
      var tag = null;
      var focus = wrong[0];
      var hint = null;
      function find(fn) {
        for (var i = 0; i < wrong.length; i++) {
          var at = V.cellOf(wrong[i].id);
          if (fn(wrong[i], at.charAt(0) === 'y', at.charAt(1) === 'y')) return wrong[i];
        }
        return null;
      }
      var f;
      // the shape traps first (rows: 2D, columns: has vertices)
      if ((f = find(function (c, ry, cy) { return c.solid === 'cyl' && cy; }))) {
        tag = 'Thought cylinder has vertices';
        hint = lead + 'A cylinder has curved edges but no corners, so it has no vertices.';
      } else if ((f = find(function (c, ry, cy) { return c.solid === 'circ' && cy; }))) {
        tag = 'Thought a circle has vertices';
        hint = lead + 'A circle has one curved edge and no corners, so it has no vertices.';
      } else if ((f = find(function (c, ry) { return c.solid === 'cube' && ry; }))) {
        tag = 'Thought a drawn cube is 2D';
        hint = lead + 'The cube is drawn on a flat screen, but a real cube is a solid shape, so it is not 2D.';
      } else if ((f = find(function (c, ry) { return q.row === 'lt:50' && c.n === 50 && ry; }))) {
        tag = "Put 50 in 'less than 50'";
        hint = lead + '"Not less than 50" means 50 or more, so 50 goes in the "not less than 50" row.';
      } else if ((f = find(function (c) {
        var at = V.cellOf(c.id);
        return c.cell.charAt(0) !== c.cell.charAt(1) && at === c.cell.charAt(1) + c.cell.charAt(0);
      }))) {
        tag = 'Read row label as column';
        hint = lead + 'Read the label at the side for the row, and the label on top for the column.';
      } else if ((f = find(function (c, ry, cy) {
        return (isMult(q.row) && ry !== (c.cell.charAt(0) === 'y')) || (isMult(q.col) && cy !== (c.cell.charAt(1) === 'y'));
      }))) {
        tag = 'Multiple-of check wrong';
        var mid = isMult(q.row) && V.cellOf(f.id).charAt(0) !== f.cell.charAt(0) ? q.row : q.col;
        var k = rule(mid).mult;
        hint = lead + 'Check "' + rule(mid).label + '": press Jumps of ' + k + ' and see if ' + f.n + ' is a landing spot.';
      } else {
        tag = 'Placed in the wrong cell';
        hint = lead + 'For each orange card, check the row label first, then the column label.';
      }
      focus = f || focus;
      if (api.tries() >= 1) {
        hint = (n > 1 ? n + ' cards are still wrong. ' : '') + 'Look at ' + cardName(focus) + '. ' + explain(q, focus);
        V.flash(focus.cell);
        if (strip && focus.n != null) {
          [q.row, q.col].forEach(function (id) {
            if (isMult(id)) strip.toggle(rule(id).mult, true);
          });
          strip.pin(focus.n);
        }
      }
      api.check(false, hint, tag);
    }

    api.onReveal(function () {
      V.lock();
      V.clearMarks();
      V.solveAll();
      cards.forEach(function (c) {
        V.mark(c.id, 'cg-ok');
      });
      if (strip) {
        q.steps.forEach(function (k) {
          strip.toggle(k, true);
        });
        strip.pin(null);
      }
      api.feedback(working(q), 'info');
    });

    var wrongN = 0;
    MQ.__test = {
      solve: function () {
        cards.forEach(function (c) {
          V.place(c.id, c.cell);
        });
        checkBtn.click();
      },
      wrong: function () {
        cards.forEach(function (c) {
          V.place(c.id, c.cell);
        });
        var c = cards[wrongN++ % cards.length];
        var others = CELLS.filter(function (k) {
          return k !== c.cell;
        });
        V.place(c.id, others[wrongN % 3]);
        checkBtn.click();
      },
    };
  }

  /* ------------------------------------------------------------------ *
   * Practice: Bolt sorted the cards; choose the row and column labels
   * ------------------------------------------------------------------ */
  function renderHidden(stage, api, q) {
    var cards = q.cards.map(function (c, i) {
      return Object.assign({ id: 'c' + i }, c);
    });
    var strip = q.steps ? makeStrip(q.max, q.steps) : null;
    var V = makeGrid(api, { row: null, col: null, cards: cards, tray: false });
    cards.forEach(function (c) {
      V.place(c.id, c.cell);
    });
    V.lock();
    V.svg.addEventListener('click', function (e) {
      var g = e.target.closest ? e.target.closest('.cg-card') : null;
      if (g && strip) strip.pin(+g.textContent);
    });
    var pick = { row: null, col: null };
    var lastSig = null;
    var groups = {};
    function group(k, title) {
      var box = el('div', { class: 'cg-lgroup cg-lgroup-' + k }, el('div', { class: 'cg-lhead' }, title));
      groups[k] = q.options.map(function (opt) {
        var R = rule(opt);
        var b = el('button', { class: 'cg-opt', type: 'button' }, R.label + ' / ' + R.notLabel);
        b.addEventListener('click', function () {
          if (api.isAnswered()) return;
          pick[k] = opt;
          groups[k].forEach(function (x) {
            x.classList.toggle('cg-on', x === b);
          });
          V.setRules(pick.row, pick.col);
          MQ.sound('click');
        });
        b.opt = opt;
        box.appendChild(b);
        return b;
      });
      return box;
    }
    var checkBtn = el('button', { class: 'btn btn-check cg-check', type: 'button' }, 'Check ✔');
    checkBtn.addEventListener('click', onCheck);
    var side = el('div', { class: 'cg-side' }, group('col', 'Columns (top)'), group('row', 'Rows (side)'), checkBtn);
    stage.appendChild(el('div', { class: 'cg-lrow' }, V.el, side));
    if (strip) stage.appendChild(el('div', { class: 'cg-ctrl' }, strip.el, el('div', { class: 'cg-btns' }, strip.buttons)));
    api.say('Bolt sorted these cards but lost the labels! Choose the labels for the columns and the rows.', 'think');

    function onCheck() {
      if (api.isAnswered()) return;
      if (!pick.row || !pick.col) {
        api.feedback('Choose labels for the columns and for the rows, then press Check.', 'try');
        return;
      }
      if (pick.row === pick.col) {
        api.feedback('The rows and the columns need different labels.', 'try');
        return;
      }
      var sig = pick.row + '|' + pick.col;
      if (sig === lastSig) {
        api.feedback('Change a label first, then press Check again.', 'try');
        return;
      }
      lastSig = sig;
      V.clearMarks();
      if (sameSort(pick.row, pick.col, cards)) {
        cards.forEach(function (c) {
          V.mark(c.id, 'cg-ok');
        });
        api.check(true, 'Yes! Those labels split the cards exactly like that.');
        return;
      }
      var tag;
      var hint;
      if (pick.row === q.col && pick.col === q.row) {
        tag = 'Read row label as column';
        hint = 'Those are the right two rules, but swapped. The column labels go along the top; the row labels go down the side.';
      } else {
        tag = 'Labels do not split the items';
        var bad = null;
        var where = null;
        ['col', 'row'].some(function (k) {
          var R = rule(pick[k]);
          var idx = k === 'row' ? 0 : 1;
          return cards.some(function (c) {
            if (R.test(c) !== (c.cell.charAt(idx) === 'y')) {
              bad = c;
              where = k;
              return true;
            }
            return false;
          });
        });
        var R = rule(pick[where]);
        var placedYes = bad.cell.charAt(where === 'row' ? 0 : 1) === 'y';
        V.mark(bad.id, 'cg-bad');
        hint = 'Look at ' + bad.n + ': it is in the "' + (placedYes ? R.label : R.notLabel) + '" ' + (where === 'row' ? 'row' : 'column') + ', but ' + R.why(bad) + '.';
        if (api.tries() >= 1) {
          var tl = cards.filter(function (c) {
            return c.cell === 'yy';
          });
          hint += ' The top-left cards (' + tl.map(shortName).join(', ') + ') fit BOTH first labels. What do they have in common?';
          V.flash('yy');
          if (strip && isMult(pick[where])) {
            strip.toggle(rule(pick[where]).mult, true);
            strip.pin(bad.n);
          }
        }
      }
      api.check(false, hint, tag);
    }

    api.onReveal(function () {
      V.setRules(q.row, q.col);
      ['row', 'col'].forEach(function (k) {
        groups[k].forEach(function (x) {
          x.classList.toggle('cg-on', x.opt === q[k]);
          x.disabled = true;
        });
      });
      checkBtn.disabled = true;
      V.clearMarks();
      cards.forEach(function (c) {
        V.mark(c.id, 'cg-ok');
      });
      if (strip) {
        [q.row, q.col].forEach(function (id) {
          if (isMult(id)) strip.toggle(rule(id).mult, true);
        });
        strip.pin(null);
      }
      api.feedback(working(q), 'info');
    });

    var wrongPairs = [];
    q.options.forEach(function (r) {
      q.options.forEach(function (c) {
        if (r !== c && !(r === q.row && c === q.col)) wrongPairs.push([r, c]);
      });
    });
    var wrongN = 0;
    function choose(r, c) {
      groups.row.filter(function (x) { return x.opt === r; })[0].click();
      groups.col.filter(function (x) { return x.opt === c; })[0].click();
    }
    MQ.__test = {
      solve: function () {
        choose(q.row, q.col);
        checkBtn.click();
      },
      wrong: function () {
        var p = wrongPairs[wrongN++ % wrongPairs.length];
        choose(p[0], p[1]);
        checkBtn.click();
      },
    };
  }

  /* ------------------------------------------------------------------ *
   * Learn screens: each drop is judged straight away
   * ------------------------------------------------------------------ */
  function learnGrid(api, q, msgs) {
    var cards = q.cards.map(function (c, i) {
      return Object.assign({ id: 'c' + i, cell: cellFor(q.row, q.col, c) }, c);
    });
    q.cards = cards;
    var done = {};
    var strip = msgs.strip || null;
    var V = makeGrid(api, {
      row: q.row,
      col: q.col,
      cards: cards,
      onPick: function (c) {
        if (strip && c.n != null) strip.pin(c.n);
      },
      onDrop: function (c, k) {
        if (k === c.cell) {
          done[c.id] = true;
          api.sound('correct');
          api.feedback(explain(q, c), 'good');
          if (cards.every(function (x) { return done[x.id] || x.id === c.id; })) {
            api.later(function () {
              V.lock();
              api.say(msgs.done, 'cheer');
              if (msgs.doneFb) api.feedback(msgs.doneFb, 'good');
              api.unlockNext();
            }, 900);
          }
          return true;
        }
        done[c.id] = false;
        api.sound('wrong');
        api.feedback('Not there. ' + explain(q, c), 'try');
        return false;
      },
    });
    return V;
  }

  var deck = null;
  MQ.register('carroll-grid', {
    learn: [
      function (stage, api) {
        api.say('A Carroll grid has a rule and its opposite. Drag a card and watch both labels light up.');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Rows and columns', 'Read the <b>row</b> label at the side and the <b>column</b> label on top.'));
        var q = { row: 'blue', col: 'curves', cards: [{ flat: 'circle', colour: 'blue' }, { flat: 'triangle', colour: 'blue' }, { flat: 'circle', colour: 'yellow' }, { flat: 'triangle', colour: 'yellow' }] };
        var V = learnGrid(api, q, { done: 'Every shape has exactly one cell.', doneFb: 'Blue or not blue (row), curves or not curves (column): one cell each.' });
        stage.appendChild(V.el);
      },
      function (stage, api) {
        api.say('Numbers now. Is it even? Is it a multiple of 3? Use the jumps to check.');
        api.lockNext();
        var strip = makeStrip(24, [3]);
        var q = { row: 'even', col: 'mult:3', cards: [{ n: 12 }, { n: 15 }, { n: 16 }, { n: 23 }] };
        var V = learnGrid(api, q, { strip: strip, done: 'Great! "Not even" is the same as odd.', doneFb: '12: even, multiple of 3. 15: not even, multiple of 3. 16: even, not a multiple of 3. 23: neither.' });
        strip.buttons[0].addEventListener('click', function () {
          if (strip.isOn(3)) api.feedback('Jumps of 3 land on 3, 6, 9, 12, 15, 18, 21, 24. Is your number a landing spot?', 'info');
        });
        stage.appendChild(el('div', { class: 'cg-ctrl' }, strip.el, el('div', { class: 'cg-btns' }, strip.buttons)));
        V.el.classList.add('cg-small');
        stage.appendChild(V.el);
      },
      function (stage, api) {
        api.say('Make your own grid! Choose a rule for the rows and a different rule for the columns.');
        api.lockNext();
        var holder = el('div', { class: 'cg-own' });
        var pick = { row: null, col: null };
        var groups = {};
        function group(k, title) {
          var box = el('div', { class: 'cg-lgroup cg-lgroup-' + k }, el('div', { class: 'cg-lhead' }, title));
          groups[k] = HOME_RULES.map(function (id) {
            var R = rule(id);
            var b = el('button', { class: 'cg-opt', type: 'button' }, R.label);
            b.addEventListener('click', function () {
              pick[k] = id;
              groups[k].forEach(function (x) {
                x.classList.toggle('cg-on', x === b);
              });
              MQ.sound('click');
              build();
            });
            b.opt = id;
            box.appendChild(b);
            return b;
          });
          return box;
        }
        var side = el('div', { class: 'cg-side' }, group('col', 'Columns (top)'), group('row', 'Rows (side)'));
        var gridBox = el('div', { class: 'cg-gridbox' });
        holder.appendChild(gridBox);
        holder.appendChild(side);
        stage.appendChild(holder);
        function build() {
          MQ.clear(gridBox);
          api.lockNext();
          if (pick.row && pick.row === pick.col) {
            api.feedback('Choose two different rules.', 'try');
          }
          var ready = pick.row && pick.col && pick.row !== pick.col;
          var q = { row: ready ? pick.row : null, col: ready ? pick.col : null, cards: Object.keys(HOME).map(function (k) { return { home: k }; }) };
          if (!ready) {
            var V0 = makeGrid(api, { row: pick.row && pick.row !== pick.col ? pick.row : null, col: pick.col && pick.row !== pick.col ? pick.col : null, cards: [], tray: false });
            V0.lock();
            gridBox.appendChild(V0.el);
            return;
          }
          api.feedback('Now drag the 6 things into the grid.', 'info');
          var V = learnGrid(api, q, { done: 'Your own Carroll grid! Every thing has exactly one cell.', doneFb: 'Any two rules work, because each rule has its opposite.' });
          gridBox.appendChild(V.el);
        }
        build();
      },
    ],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'hidden') renderHidden(stage, api, q);
        else renderSort(stage, api, q);
      },
    },
  });

  MQ.__cgBuildDeck = buildDeck;

  var css = [
    '.cg-mat{width:100%;max-width:640px;display:flex;justify-content:center}',
    '.cg-mat.cg-small{max-width:560px}',
    '.cg-svg{width:100%;height:auto;display:block;user-select:none;-webkit-user-select:none;touch-action:none}',
    '.cg-cell{fill:#fff;transition:fill .12s}',
    '.cg-cell.cg-hot{fill:#fff3b0}',
    '.cg-cell.cg-flash{animation:cgflash 1.1s ease 3}',
    '@keyframes cgflash{50%{fill:#ffe08a}}',
    '.cg-frame{fill:none;stroke:#7a8bb5;stroke-width:3}',
    '.cg-frame-thick{stroke:#7a8bb5;stroke-width:3}',
    '.cg-frame-line{stroke:#9aa8c7;stroke-width:2}',
    '.cg-head rect{stroke-width:2;transition:fill .12s,stroke .12s}',
    '.cg-head text{font-weight:800;font-size:18px;fill:#1b2a4a}',
    '.cg-head-col rect{fill:#e4efff;stroke:#2b6cd8}',
    '.cg-head-row rect{fill:#ffeedd;stroke:#e07a1f}',
    '.cg-head-q text{fill:#8a96b3}',
    '.cg-head.cg-lit rect,.cg-head.cg-glow rect{fill:#ffd84d;stroke:#b07d00;stroke-width:3}',
    '.cg-tray{fill:#f3f6fd;stroke:#c9d3ee;stroke-width:2;stroke-dasharray:6 5}',
    '.cg-traylab{font-size:15px;font-weight:800;fill:#4a5a7d}',
    '.cg-card{cursor:grab}',
    '.cg-card.cg-anim{transition:transform .35s ease}',
    '.cg-cbg{fill:#fff;stroke:#9aa8c7;stroke-width:2}',
    '.cg-card:hover .cg-cbg{stroke:var(--accent)}',
    '.cg-card.cg-sel .cg-cbg{stroke:#ffb703;stroke-width:4}',
    '.cg-card.cg-lift{cursor:grabbing;filter:drop-shadow(0 4px 5px rgba(27,42,74,.3))}',
    '.cg-card.cg-bad .cg-cbg{fill:#fff1e6;stroke:#ea580c;stroke-width:4}',
    '.cg-card.cg-ok .cg-cbg{stroke:#1f9d6b;stroke-width:3}',
    '.cg-card.cg-bounce .cg-cbg{fill:#fff1e6}',
    '.cg-locked .cg-card{cursor:default}',
    '.cg-cnum{font-size:22px;font-weight:800;fill:#1b2a4a;font-family:inherit}',
    '.cg-cemo{font-size:28px}',
    '.cg-ctrl{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;max-width:820px;flex-wrap:wrap}',
    '.cg-strip{flex:1 1 440px;min-width:0;background:#fff;border:2px solid var(--line);border-radius:14px;padding:2px 6px}',
    '.cg-strip-svg{width:100%;height:auto;display:block}',
    '.cg-btns{display:flex;flex-direction:column;gap:8px;align-items:stretch}',
    '.cg-check{min-height:48px}',
    '.cg-jbtn{border:2px solid var(--line);background:#fff;border-radius:12px;padding:6px 12px;font:inherit;font-weight:800;color:var(--ink);cursor:pointer;white-space:nowrap}',
    '.cg-jbtn:hover{border-color:var(--accent)}',
    '.cg-jbtn.cg-on{background:#e6f7f2;border-color:#1f9d6b}',
    '.cg-jarc{color:#7c3aed}',
    '.cg-sline{stroke:#1b2a4a;stroke-width:2.5}',
    '.cg-stick{stroke:#1b2a4a;stroke-width:1.5}',
    '.cg-stens{font-size:13px;fill:#4a5a7d;font-weight:700}',
    '.cg-arc{fill:none;stroke-width:2.5;stroke-dasharray:1;stroke-dashoffset:1;animation:cgdraw .35s ease forwards}',
    '.cg-arc.cg-lane0{stroke:#7c3aed}.cg-arc.cg-lane1{stroke:#0e9f8e}',
    '.cg-land{opacity:0;animation:cgfade .3s ease forwards}',
    '.cg-land.cg-lane0{fill:#7c3aed}.cg-land.cg-lane1{fill:#0e9f8e}',
    '.cg-jlab{font-size:15px;font-weight:800;opacity:0;animation:cgfade .3s ease forwards}',
    '.cg-jlab.cg-lane0{fill:#5b21b6}.cg-jlab.cg-lane1{fill:#0b6e66}',
    '@keyframes cgdraw{to{stroke-dashoffset:0}}',
    '@keyframes cgfade{to{opacity:1}}',
    '.cg-pinline{stroke:#e5484d;stroke-width:2.5}',
    '.cg-pinbox{fill:#e5484d}',
    '.cg-pintext{fill:#fff;font-size:14px;font-weight:800}',
    '.cg-lrow,.cg-own{display:flex;gap:14px;align-items:center;justify-content:center;width:100%;flex-wrap:wrap}',
    '.cg-lrow .cg-mat,.cg-gridbox{flex:1 1 400px;max-width:520px;display:flex;justify-content:center}',
    '.cg-own .cg-gridbox .cg-mat{max-width:640px}',
    '.cg-own .cg-gridbox{max-width:620px;flex-basis:560px}',
    '.cg-side{display:flex;flex-direction:column;gap:10px;flex:0 1 250px}',
    '.cg-lgroup{border:2px solid var(--line);border-radius:14px;padding:8px;display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#fff}',
    '.cg-lgroup-col{border-color:#2b6cd8}.cg-lgroup-row{border-color:#e07a1f}',
    '.cg-lhead{grid-column:1/-1;font-weight:800;font-size:.95rem}',
    '.cg-lgroup-col .cg-lhead{color:#2b6cd8}.cg-lgroup-row .cg-lhead{color:#c2410c}',
    '.cg-opt{border:2px solid var(--line);background:var(--paper);border-radius:10px;padding:6px;font:inherit;font-weight:700;font-size:.85rem;color:var(--ink);cursor:pointer;line-height:1.15}',
    '.cg-opt:hover:not(:disabled){border-color:var(--accent)}',
    '.cg-opt.cg-on{background:#fff3cd;border-color:#ffb703}',
    '.cg-opt:disabled{cursor:default}',
    '@media (max-width:640px){.cg-side{flex-basis:100%}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'carroll-grid' }, css));
})();

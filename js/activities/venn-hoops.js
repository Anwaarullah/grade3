/* Venn Hoops — sort cards into two overlapping hoops inside a box (Unit 10.2). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  /* ------------------------------------------------------------------ *
   * Geometry (SVG user units). Two circles inside a box, card tray on the right.
   * ------------------------------------------------------------------ */
  var CW = 56; // card width
  var CH = 44; // card height
  var G = { x0: 2, y0: 46, x1: 618, y1: 426, ax: 236, bx: 384, cy: 236, r: 156 };
  var VBW = 772;
  var VBH = 432;
  var TRAY = { x: 628, y: 46, w: 140, h: 380 };
  var REGS = ['both', 'a', 'b', 'none'];

  function regionAt(x, y) {
    if (x < G.x0 || x > G.x1 || y < G.y0 || y > G.y1) return null;
    var inA = Math.sqrt((x - G.ax) * (x - G.ax) + (y - G.cy) * (y - G.cy)) < G.r;
    var inB = Math.sqrt((x - G.bx) * (x - G.bx) + (y - G.cy) * (y - G.cy)) < G.r;
    return inA && inB ? 'both' : inA ? 'a' : inB ? 'b' : 'none';
  }
  function inTray(x, y) {
    return x >= TRAY.x && x <= TRAY.x + TRAY.w && y >= TRAY.y && y <= TRAY.y + TRAY.h;
  }
  // A card centred at (cx, cy) sits wholly in region `reg` (with a margin).
  function cardFits(reg, cx, cy) {
    var m = 5;
    var hw = CW / 2 + m;
    var hh = CH / 2 + m;
    for (var i = 0; i <= 4; i++) {
      for (var j = 0; j <= 4; j++) {
        if (i > 0 && i < 4 && j > 0 && j < 4) continue; // edges only
        if (regionAt(cx - hw + (2 * hw * i) / 4, cy - hh + (2 * hh * j) / 4) !== reg) return false;
      }
    }
    return regionAt(cx, cy) === reg;
  }
  // Greedy packing of non-overlapping card slots in each region (computed once).
  var ANCHOR = {
    both: { x: (G.ax + G.bx) / 2, y: G.cy },
    a: { x: G.ax - 78, y: G.cy },
    b: { x: G.bx + 78, y: G.cy },
    none: { x: 40, y: 70 },
  };
  // Row-by-row packing: each row is filled centrally inside every stretch where a card fits;
  // the row phase that gives the most slots wins.
  var SLOTS = (function () {
    var out = {};
    var gx = CW + 6;
    var gy = CH + 6;
    REGS.forEach(function (reg) {
      var best = [];
      for (var py = 0; py < gy; py += 2) {
        var got = [];
        for (var y = G.y0 + py; y <= G.y1; y += gy) {
          var run = null;
          for (var x = G.x0; x <= G.x1 + 2; x += 2) {
            var fits = x <= G.x1 && cardFits(reg, x, y);
            if (fits) {
              if (!run) run = [x, x];
              else run[1] = x;
            } else if (run) {
              var k = Math.floor((run[1] - run[0]) / gx) + 1;
              var s0 = (run[0] + run[1]) / 2 - ((k - 1) * gx) / 2;
              for (var i = 0; i < k; i++) got.push({ x: s0 + i * gx, y: y });
              run = null;
            }
          }
        }
        if (got.length > best.length) best = got;
      }
      var cx = (G.x0 + G.x1) / 2;
      var cyy = (G.y0 + G.y1) / 2;
      best.forEach(function (p) {
        p.k = reg === 'none' ? -Math.hypot(p.x - cx, (p.y - cyy) * 1.6) : Math.hypot(p.x - ANCHOR[reg].x, (p.y - ANCHOR[reg].y) * 0.8);
      });
      best.sort(function (p, q) {
        return p.k - q.k;
      });
      out[reg] = best.map(function (p) {
        return { x: p.x, y: p.y };
      });
    });
    return out;
  })();
  var TRAY_SLOTS = [];
  for (var ti = 0; ti < 12; ti++) TRAY_SLOTS.push({ x: ti % 2 ? 734 : 662, y: 100 + Math.floor(ti / 2) * 52 });
  var CAP = { both: 5, a: 5, b: 5, none: 6 };

  /* ------------------------------------------------------------------ *
   * Data: everyday pictures with every property written out.
   * null = not clear-cut, so the item is never used with that rule.
   * ------------------------------------------------------------------ */
  var ITEMS = {
    apple: { e: '🍎', name: 'red apple', red: 1, round: 1, food: 1, wheels: 0, yellow: 0 },
    gapple: { e: '🍏', name: 'green apple', red: 0, round: 1, food: 1, wheels: 0, yellow: 0 },
    tomato: { e: '🍅', name: 'tomato', red: 1, round: 1, food: 1, wheels: 0, yellow: 0 },
    cherries: { e: '🍒', name: 'bunch of cherries', red: 1, round: 1, food: 1, wheels: 0, yellow: 0 },
    banana: { e: '🍌', name: 'banana', red: 0, round: 0, food: 1, wheels: 0, yellow: 1 },
    orange: { e: '🍊', name: 'orange', red: 0, round: 1, food: 1, wheels: 0, yellow: 0 },
    cheese: { e: '🧀', name: 'cheese', red: 0, round: 0, food: 1, wheels: 0, yellow: 1 },
    corn: { e: '🌽', name: 'corn cob', red: 0, round: 0, food: 1, wheels: 0, yellow: 1 },
    carrot: { e: '🥕', name: 'carrot', red: 0, round: 0, food: 1, wheels: 0, yellow: 0 },
    bread: { e: '🍞', name: 'loaf of bread', red: 0, round: 0, food: 1, wheels: 0, yellow: null },
    cookie: { e: '🍪', name: 'cookie', red: 0, round: 1, food: 1, wheels: 0, yellow: null },
    doughnut: { e: '🍩', name: 'doughnut', red: 0, round: 1, food: 1, wheels: 0, yellow: 0 },
    football: { e: '⚽', name: 'football', red: 0, round: 1, food: 0, wheels: 0, yellow: 0 },
    basketball: { e: '🏀', name: 'basketball', red: 0, round: 1, food: 0, wheels: 0, yellow: 0 },
    teddy: { e: '🧸', name: 'teddy bear', red: 0, round: 0, food: 0, wheels: 0, yellow: 0 },
    book: { e: '📕', name: 'red book', red: 1, round: 0, food: 0, wheels: 0, yellow: 0 },
    rose: { e: '🌹', name: 'rose', red: 1, round: 0, food: 0, wheels: 0, yellow: 0 },
    car: { e: '🚗', name: 'red car', red: 1, round: 0, food: 0, wheels: 1, yellow: 0 },
    taxi: { e: '🚕', name: 'yellow taxi', red: 0, round: 0, food: 0, wheels: 1, yellow: 1 },
    bike: { e: '🚲', name: 'bicycle', red: null, round: 0, food: 0, wheels: 1, yellow: null },
    scooter: { e: '🛴', name: 'scooter', red: null, round: 0, food: 0, wheels: 1, yellow: null },
    trolley: { e: '🛒', name: 'shopping trolley', red: null, round: 0, food: 0, wheels: 1, yellow: null },
    sponge: { e: '🧽', name: 'sponge', red: 0, round: 0, food: 0, wheels: 0, yellow: 1 },
    sunflower: { e: '🌻', name: 'sunflower', red: 0, round: null, food: 0, wheels: 0, yellow: 1 },
    // drawn pictures for the first lesson
    ball: { draw: 'ball', name: 'red ball', red: 1, round: 1, food: 0, wheels: 0, yellow: 0 },
    pencil: { draw: 'pencil', name: 'blue pencil', red: 0, round: 0, food: 0, wheels: 0, yellow: 0 },
  };
  var PIC_PAIRS = [
    ['red', 'round'],
    ['yellow', 'food'],
    ['wheels', 'red'],
    ['round', 'food'],
  ];

  // 2D shapes in a 40 x 32 box. sym = has at least one line of symmetry (defined, not computed).
  function regPoly(n, cx, cy, r) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var a = -Math.PI / 2 + (2 * Math.PI * i) / n;
      pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  }
  var SHAPES = {
    rt: { name: 'right-angled triangle', tri: 1, sym: 0, pts: '6,30 6,8 40,30', why: 'no fold line makes its two halves match' },
    sc: { name: 'slanted triangle', tri: 1, sym: 0, pts: '2,30 40,30 36,4', why: 'all its sides are different, so no fold line works' },
    is: { name: 'tall triangle', tri: 1, sym: 1, pts: '9,30 33,30 21,1', line: [21, 0, 21, 31] },
    eq: { name: 'triangle with equal sides', tri: 1, sym: 1, pts: '5,30 37,30 21,2.3', line: [21, 1, 21, 31] },
    rect: { name: 'rectangle', tri: 0, sym: 1, pts: '2,8 40,8 40,26 2,26', line: [21, 5, 21, 29] },
    sq: { name: 'square', tri: 0, sym: 1, pts: '8,3 34,3 34,29 8,29', line: [21, 1, 21, 31] },
    trap: { name: 'trapezium', tri: 0, sym: 1, pts: '2,28 40,28 30,6 12,6', line: [21, 3, 21, 31] },
    pent: { name: 'pentagon', tri: 0, sym: 1, pts: regPoly(5, 21, 17.5, 15), line: [21, 1, 21, 31] },
    hex: { name: 'hexagon', tri: 0, sym: 1, pts: regPoly(6, 21, 16, 15), line: [21, 0, 21, 32] },
    circ: { name: 'circle', tri: 0, sym: 1, circle: [21, 16, 14], line: [21, 1, 21, 31] },
    para: { name: 'parallelogram', tri: 0, sym: 0, pts: '1,28 29,28 40,6 12,6', why: 'it leans over, so no fold line makes the halves match' },
    quad: { name: 'wonky four-sided shape', tri: 0, sym: 0, pts: '3,26 37,30 31,3 13,11', why: 'its sides are all different, so no fold line works' },
  };
  function sidesOf(k) {
    var s = SHAPES[k];
    if (s.circle) return 0;
    return s.pts.split(' ').length;
  }

  /* ------------------------------------------------------------------ *
   * Rules. Each card is {n} (number), {pic} (picture) or {shape}.
   * ------------------------------------------------------------------ */
  function cardName(c) {
    if (c.n != null) return String(c.n);
    if (c.pic) return 'the ' + ITEMS[c.pic].name;
    return 'the ' + SHAPES[c.shape].name;
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
    return 'jumps of ' + k + ' go ' + (lo === 0 ? '0' : lo) + ', ' + (lo + k) + ' and jump over ' + n;
  }
  var RULE_CACHE = {};
  function rule(id) {
    if (RULE_CACHE[id]) return RULE_CACHE[id];
    var p = id.split(':');
    var k = p[1] != null ? parseInt(p[1], 10) : null;
    var r;
    var picRule = function (prop, label, yesTxt, noTxt) {
      return {
        label: label,
        test: function (c) {
          return ITEMS[c.pic][prop] === 1;
        },
        why: function (c) {
          return cardName(c) + ' ' + (ITEMS[c.pic][prop] === 1 ? yesTxt : noTxt);
        },
      };
    };
    switch (p[0]) {
      case 'red':
        r = picRule('red', 'red things', 'is red', 'is not red');
        break;
      case 'yellow':
        r = picRule('yellow', 'yellow things', 'is yellow', 'is not yellow');
        break;
      case 'round':
        r = picRule('round', 'round things', 'is round', 'is not round');
        break;
      case 'food':
        r = picRule('food', 'is food', 'is food', 'is not food');
        break;
      case 'wheels':
        r = picRule('wheels', 'has wheels', 'has wheels', 'has no wheels');
        break;
      case 'even':
      case 'odd':
        r = {
          label: p[0],
          test: function (c) {
            return (c.n % 2 === 0) === (p[0] === 'even');
          },
          why: function (c) {
            return c.n + ' ends in ' + (c.n % 10) + ', so it is ' + (c.n % 2 === 0 ? 'even' : 'odd');
          },
        };
        break;
      case 'lt':
        r = {
          label: 'less than ' + k,
          test: function (c) {
            return c.n < k;
          },
          why: function (c) {
            return c.n + ' is ' + (c.n < k ? '' : 'not ') + 'less than ' + k;
          },
        };
        break;
      case 'gt':
        r = {
          label: 'more than ' + k,
          test: function (c) {
            return c.n > k;
          },
          why: function (c) {
            return c.n + ' is ' + (c.n > k ? '' : 'not ') + 'more than ' + k;
          },
        };
        break;
      case 'mult':
        r = {
          label: 'multiple of ' + k,
          mult: k,
          test: function (c) {
            return c.n % k === 0;
          },
          why: function (c) {
            return c.n + (c.n % k === 0 ? ' is' : ' is not') + ' a multiple of ' + k + ': ' + jumpsText(c.n, k);
          },
        };
        break;
      case 'tens':
        r = {
          label: 'has ' + k + (k === 1 ? ' ten' : ' tens'),
          test: function (c) {
            return c.n < 100 && Math.floor(c.n / 10) === k;
          },
          why: function (c) {
            var t = Math.floor(c.n / 10);
            return c.n + ' has ' + t + (t === 1 ? ' ten' : ' tens');
          },
        };
        break;
      case 'tri':
        r = {
          label: 'triangle',
          test: function (c) {
            return SHAPES[c.shape].tri === 1;
          },
          why: function (c) {
            var n = sidesOf(c.shape);
            return cardName(c) + ' has ' + (n === 0 ? 'no straight sides' : n + ' sides') + ', so it is ' + (n === 3 ? '' : 'not ') + 'a triangle';
          },
        };
        break;
      case 'sym':
        r = {
          label: 'has a line of symmetry',
          test: function (c) {
            return SHAPES[c.shape].sym === 1;
          },
          why: function (c) {
            var s = SHAPES[c.shape];
            return s.sym ? cardName(c) + ' folds in half with both halves matching' : cardName(c) + ' has no line of symmetry: ' + s.why;
          },
        };
        break;
      default:
        throw new Error('Unknown rule ' + id);
    }
    r.id = id;
    RULE_CACHE[id] = r;
    return r;
  }
  function regionFor(a, b, c) {
    var A = rule(a).test(c);
    var B = rule(b).test(c);
    return A && B ? 'both' : A ? 'a' : B ? 'b' : 'none';
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  function distribute(by, total, empty) {
    var counts = {};
    REGS.forEach(function (r) {
      counts[r] = r === empty || !by[r].length ? 0 : 1;
    });
    var left = total - REGS.reduce(function (s, r) {
      return s + counts[r];
    }, 0);
    var guard = 0;
    while (left > 0 && guard++ < 100) {
      var open = REGS.filter(function (r) {
        return r !== empty && counts[r] < Math.min(CAP[r], by[r].length);
      });
      if (!open.length) break;
      counts[U.pick(open)]++;
      left--;
    }
    var cards = [];
    REGS.forEach(function (r) {
      U.shuffle(by[r])
        .slice(0, counts[r])
        .forEach(function (c) {
          cards.push(Object.assign({}, c, { region: r }));
        });
    });
    return U.shuffle(cards);
  }
  function sortByRegion(a, b, items) {
    var by = { both: [], a: [], b: [], none: [] };
    items.forEach(function (c) {
      by[regionFor(a, b, c)].push(c);
    });
    return by;
  }
  function numCards(lo, hi, skip) {
    return U.range(lo, hi)
      .filter(function (n) {
        return (skip || []).indexOf(n) === -1;
      })
      .map(function (n) {
        return { n: n };
      });
  }
  function emptyRegions(cards) {
    return REGS.filter(function (r) {
      return !cards.some(function (c) {
        return c.region === r;
      });
    });
  }
  function sortRound(type, a, b, items, total, empty, extra) {
    var by = sortByRegion(a, b, items);
    var cards = distribute(by, total, empty);
    return Object.assign({ type: 'sort', kind: type, a: a, b: b, cards: cards, empty: emptyRegions(cards) }, extra || {});
  }
  function maybeEmpty(p) {
    return Math.random() < p ? U.pick(REGS) : null;
  }

  var L2_PAIRS = [
    { a: 'odd', b: 'lt:20', lo: 1, hi: 50, skip: [20] },
    { a: 'even', b: 'gt:50', lo: 20, hi: 99, skip: [50] },
    { a: 'gt:10', b: 'odd', lo: 1, hi: 99, skip: [10] },
    { a: 'even', b: 'lt:30', lo: 1, hi: 60, skip: [30] },
    { a: 'odd', b: 'gt:50', lo: 20, hi: 99, skip: [50] },
  ];

  var LABEL_SETS = [
    { a: 'mult:3', b: 'mult:5', lo: 1, hi: 80, pool: ['mult:2', 'mult:10', 'odd', 'lt:20'] },
    { a: 'tens:3', b: 'even', lo: 10, hi: 69, pool: ['tens:2', 'tens:4', 'odd', 'mult:5', 'gt:50'] },
    { a: 'gt:10', b: 'odd', lo: 1, hi: 99, pool: ['even', 'lt:10', 'gt:50', 'mult:5'] },
    { a: 'mult:2', b: 'mult:3', lo: 1, hi: 20, pool: ['mult:4', 'mult:5', 'odd', 'lt:10'] },
  ];
  function sameSorting(x, y, cards) {
    return cards.every(function (c) {
      return regionFor(x, y, c) === c.region;
    });
  }
  function labelsRound() {
    for (var tries = 0; tries < 200; tries++) {
      var set = U.pick(LABEL_SETS);
      var by = sortByRegion(set.a, set.b, numCards(set.lo, set.hi));
      var cards = distribute(by, 8, null);
      if (emptyRegions(cards).length) continue;
      var dis = U.shuffle(set.pool).slice(0, 2);
      var opts = [set.a, set.b].concat(dis);
      var ok = true;
      opts.forEach(function (x) {
        opts.forEach(function (y) {
          if (x === y || (x === set.a && y === set.b)) return;
          if (sameSorting(x, y, cards)) ok = false;
        });
      });
      if (!ok) continue;
      var steps = opts
        .filter(function (o) {
          return /^mult:/.test(o);
        })
        .map(function (o) {
          return parseInt(o.split(':')[1], 10);
        })
        .sort(function (p, q) {
          return p - q;
        });
      var maxN = Math.max.apply(null, cards.map(function (c) {
        return c.n;
      }));
      return { type: 'labels', kind: 'labels', a: set.a, b: set.b, options: U.shuffle(opts), cards: U.shuffle(cards), steps: steps.length ? steps : null, max: stripMax(maxN, steps) };
    }
    throw new Error('labelsRound failed');
  }
  function stripMax(maxN, steps) {
    var top = maxN;
    (steps || []).forEach(function (k) {
      top = Math.max(top, Math.ceil(maxN / k) * k);
    });
    return Math.ceil(top / 2) * 2;
  }

  var L3_MAKERS = {
    m23: function () {
      return sortRound('m23', 'mult:2', 'mult:3', numCards(1, 20), 8, null, { steps: [2, 3], max: 20 });
    },
    odd5: function () {
      return sortRound('odd5', 'odd', 'mult:5', numCards(1, 40), 8, maybeEmpty(0.3), { steps: [5], max: 40 });
    },
    m4lt100: function () {
      var empty = Math.random() < 0.6 ? 'a' : maybeEmpty(0.3);
      var q = sortRound('m4lt100', 'mult:4', 'lt:100', numCards(24, 121), 8, empty, { steps: [4] });
      q.max = stripMax(Math.max.apply(null, q.cards.map(function (c) {
        return c.n;
      })), [4]);
      return q;
    },
    m35: function () {
      return sortRound('m35', 'mult:3', 'mult:5', numCards(1, 80), 8, maybeEmpty(0.3), { steps: [3, 5], max: 80 });
    },
    tens: function () {
      var t = U.pick([1, 3, 4]);
      return sortRound('tens', 'tens:' + t, 'even', numCards(10, 69), 8, maybeEmpty(0.3));
    },
    shapes: function () {
      var items = Object.keys(SHAPES).map(function (k) {
        return { shape: k };
      });
      return sortRound('shapes', 'tri', 'sym', items, 7, Math.random() < 0.5 ? 'none' : null);
    },
    labels: labelsRound,
  };
  var L3_MULT = ['m23', 'odd5', 'm4lt100', 'm35'];
  var L3_OTHER = ['tens', 'shapes', 'labels'];

  function buildDeck() {
    var q = [];
    U.shuffle(PIC_PAIRS)
      .slice(0, 3)
      .forEach(function (pr) {
        var items = Object.keys(ITEMS)
          .filter(function (k) {
            return !ITEMS[k].draw && ITEMS[k][pr[0]] != null && ITEMS[k][pr[1]] != null;
          })
          .map(function (k) {
            return { pic: k };
          });
        q.push(sortRound('pics', pr[0], pr[1], items, U.pick([6, 7]), null));
      });
    U.shuffle(L2_PAIRS)
      .slice(0, 3)
      .forEach(function (pr) {
        q.push(sortRound('nums', pr.a, pr.b, numCards(pr.lo, pr.hi, pr.skip), 7, null));
      });
    var first = U.pick(L3_MULT);
    var rest = U.shuffle(L3_MULT.concat(L3_OTHER).filter(function (t) {
      return t !== first;
    })).slice(0, 2);
    U.shuffle([first].concat(rest)).forEach(function (t) {
      q.push(L3_MAKERS[t]());
    });
    return q;
  }

  /* ------------------------------------------------------------------ *
   * Card pictures
   * ------------------------------------------------------------------ */
  var DRAW = {
    ball: function () {
      return S('g', null, S('circle', { cx: 28, cy: 22, r: 16, fill: '#e63946', stroke: '#9b1c27', 'stroke-width': 1.5 }), S('path', { d: 'M18 15 q6 -7 14 -6', fill: 'none', stroke: '#fff', 'stroke-width': 3, 'stroke-linecap': 'round', opacity: 0.8 }));
    },
    pencil: function () {
      return S(
        'g',
        { transform: 'rotate(-25 28 22)' },
        S('rect', { x: 4, y: 18, width: 6, height: 9, rx: 2, fill: '#f4a7b9' }),
        S('rect', { x: 10, y: 18, width: 30, height: 9, fill: '#2f6fe0' }),
        S('polygon', { points: '40,18 50,22.5 40,27', fill: '#f2d2a9' }),
        S('polygon', { points: '47,21 50,22.5 47,24', fill: '#333' })
      );
    },
  };
  function shapeSvg(k, withLine) {
    var s = SHAPES[k];
    var g = S('g', { transform: 'translate(7,6)' });
    var style = { fill: '#cfe3ff', stroke: '#1b2a4a', 'stroke-width': 2, 'stroke-linejoin': 'round' };
    if (s.circle) g.appendChild(S('circle', Object.assign({ cx: s.circle[0], cy: s.circle[1], r: s.circle[2] }, style)));
    else g.appendChild(S('polygon', Object.assign({ points: s.pts }, style)));
    if (withLine && s.line) g.appendChild(S('line', { x1: s.line[0], y1: s.line[1], x2: s.line[2], y2: s.line[3], class: 'vh-symline' }));
    return g;
  }
  function cardFace(c) {
    if (c.n != null) return S('text', { x: CW / 2, y: CH / 2 + 1, class: 'vh-cnum', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, String(c.n));
    if (c.pic) {
      var it = ITEMS[c.pic];
      if (it.draw) return DRAW[it.draw]();
      return S('text', { x: CW / 2, y: CH / 2 + 2, class: 'vh-cemo', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, it.e);
    }
    return shapeSvg(c.shape, false);
  }

  /* ------------------------------------------------------------------ *
   * Skip-count checker: a number line with jumps of k, and a pin for a card's number.
   * ------------------------------------------------------------------ */
  function makeStrip(max, steps) {
    var x0 = 24;
    var x1 = 736;
    var ly = 56;
    var X = function (n) {
      return x0 + ((x1 - x0) * n) / max;
    };
    var root = S('svg', { viewBox: '0 -8 760 112', class: 'vh-strip-svg', role: 'img', 'aria-label': 'Number line from 0 to ' + max });
    var tens = S('g', { class: 'vh-tens' });
    var jumps = S('g');
    var pinG = S('g');
    var pinTop = S('g');
    root.appendChild(S('line', { x1: x0, y1: ly, x2: x1, y2: ly, class: 'vh-sline' }));
    var unit = (x1 - x0) / max;
    for (var n = 0; n <= max; n++) {
      var big = n % 10 === 0;
      if (unit >= 3 || big || n % 2 === 0) root.appendChild(S('line', { x1: X(n), y1: ly - (big ? 6 : 3), x2: X(n), y2: ly + (big ? 6 : 3), class: 'vh-stick' }));
      if (big || n === max) tens.appendChild(S('text', { x: X(n), y: ly + 17, class: 'vh-stens', 'text-anchor': 'middle' }, String(n)));
    }
    root.appendChild(tens);
    root.appendChild(pinG);
    root.appendChild(jumps);
    root.appendChild(pinTop);
    var active = [];
    var buttons = (steps || []).map(function (k) {
      var b = el('button', { class: 'vh-jbtn', type: 'button', 'data-step': k }, el('span', { class: 'vh-jarc' }, '⤻'), ' Jumps of ' + k);
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
        var labelEvery = (k * (x1 - x0)) / max >= 21 ? 1 : 2;
        var i = 0;
        for (var v = 0; v + k <= max; v += k, i++) {
          var xa = X(v);
          var xb = X(v + k);
          var d = 'M' + xa + ' ' + ly + ' Q' + (xa + xb) / 2 + ' ' + (ly + dir * 30) + ' ' + xb + ' ' + ly;
          var delay = Math.min(i * 45, 1200) + 'ms';
          jumps.appendChild(S('path', { d: d, pathLength: 1, class: 'vh-arc vh-lane' + lane, style: { animationDelay: delay } }));
          jumps.appendChild(S('circle', { cx: xb, cy: ly, r: 4, class: 'vh-land vh-lane' + lane, style: { animationDelay: delay } }));
          if ((i + 1) % labelEvery === 0) jumps.appendChild(S('text', { x: xb, y: lane === 0 ? ly - 31 : ly + 44, class: 'vh-jlab vh-lane' + lane, 'text-anchor': 'middle', style: { animationDelay: delay } }, String(v + k)));
        }
      });
      buttons.forEach(function (b) {
        b.classList.toggle('vh-on', active.indexOf(+b.getAttribute('data-step')) !== -1);
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
    function pin(n) {
      MQ.clear(pinG);
      MQ.clear(pinTop);
      if (n == null || n > max) return;
      var x = X(n);
      var w = String(n).length * 10 + 14;
      pinG.appendChild(S('line', { x1: x, y1: 4, x2: x, y2: ly + 8, class: 'vh-pinline' }));
      pinTop.appendChild(S('rect', { x: x - w / 2, y: -8, width: w, height: 19, rx: 9.5, class: 'vh-pinbox' }));
      pinTop.appendChild(S('text', { x: x, y: 6.5, class: 'vh-pintext', 'text-anchor': 'middle' }, String(n)));
    }
    return { el: el('div', { class: 'vh-strip' }, root), buttons: buttons, toggle: toggle, pin: pin, isOn: function (k) { return active.indexOf(k) !== -1; } };
  }

  /* ------------------------------------------------------------------ *
   * The Venn mat: two hoops in a box, cards that drag (pointer events) or
   * click-then-click. Regions are decided by geometry (distance to centres).
   * ------------------------------------------------------------------ */
  var uid = 0;
  function makeVenn(api, o) {
    var id = 'vhm' + ++uid;
    var withTray = o.tray !== false;
    var W = withTray ? VBW : 622;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + VBH, class: 'vh-svg' + (withTray ? '' : ' vh-notray') });
    var full = { x: 0, y: 0, width: W, height: VBH };
    var circA = { cx: G.ax, cy: G.cy, r: G.r };
    var circB = { cx: G.bx, cy: G.cy, r: G.r };
    var box = { x: G.x0, y: G.y0, width: G.x1 - G.x0, height: G.y1 - G.y0 };
    root.appendChild(
      S(
        'defs',
        null,
        S('mask', { id: id + 'a' }, S('rect', Object.assign({ fill: '#000' }, full)), S('circle', Object.assign({ fill: '#fff' }, circA)), S('circle', Object.assign({ fill: '#000' }, circB))),
        S('mask', { id: id + 'b' }, S('rect', Object.assign({ fill: '#000' }, full)), S('circle', Object.assign({ fill: '#fff' }, circB)), S('circle', Object.assign({ fill: '#000' }, circA))),
        S('mask', { id: id + 'n' }, S('rect', Object.assign({ fill: '#000' }, full)), S('rect', Object.assign({ fill: '#fff' }, box)), S('circle', Object.assign({ fill: '#000' }, circA)), S('circle', Object.assign({ fill: '#000' }, circB))),
        S('clipPath', { id: id + 'c' }, S('circle', circB))
      )
    );
    function regionShape(reg, cls) {
      if (reg === 'a') return S('circle', Object.assign({ mask: 'url(#' + id + 'a)', class: cls }, circA));
      if (reg === 'b') return S('circle', Object.assign({ mask: 'url(#' + id + 'b)', class: cls }, circB));
      if (reg === 'both') return S('circle', Object.assign({ 'clip-path': 'url(#' + id + 'c)', class: cls }, circA));
      return S('rect', Object.assign({ mask: 'url(#' + id + 'n)', class: cls }, box));
    }
    var overlays = {};
    REGS.forEach(function (reg) {
      root.appendChild(regionShape(reg, 'vh-tint vh-tint-' + reg));
    });
    REGS.forEach(function (reg) {
      overlays[reg] = regionShape(reg, 'vh-ov');
      root.appendChild(overlays[reg]);
    });
    root.appendChild(S('rect', Object.assign({ rx: 10, class: 'vh-box' }, box)));
    root.appendChild(S('circle', Object.assign({ class: 'vh-ring vh-ring-a' }, circA)));
    root.appendChild(S('circle', Object.assign({ class: 'vh-ring vh-ring-b' }, circB)));
    // "empty" notes, shown when a region is meant to be empty
    var emptyNote = {};
    REGS.forEach(function (reg) {
      var p = reg === 'none' ? { x: 48, y: 72 } : ANCHOR[reg];
      emptyNote[reg] = S('text', { x: p.x, y: p.y + 5, class: 'vh-empty', 'text-anchor': 'middle' }, 'empty');
      root.appendChild(emptyNote[reg]);
    });
    // labels above the box
    var labelLayer = S('g');
    root.appendChild(labelLayer);
    var labels = { a: o.labelA, b: o.labelB };
    function drawLabels() {
      MQ.clear(labelLayer);
      ['a', 'b'].forEach(function (k) {
        var t = labels[k] || '?';
        var w = Math.max(54, t.length * 10.6 + 30);
        var x = k === 'a' ? 70 : G.bx + G.r + 10 - w;
        var g = S('g', { class: 'vh-label vh-label-' + k + (labels[k] ? '' : ' vh-label-q') });
        g.appendChild(S('rect', { x: x, y: 6, width: w, height: 32, rx: 16 }));
        g.appendChild(S('text', { x: x + w / 2, y: 28, 'text-anchor': 'middle' }, t));
        labelLayer.appendChild(g);
      });
    }
    drawLabels();
    if (withTray) {
      root.appendChild(S('rect', { x: TRAY.x, y: TRAY.y, width: TRAY.w, height: TRAY.h, rx: 12, class: 'vh-tray' }));
      root.appendChild(S('text', { x: TRAY.x + TRAY.w / 2, y: TRAY.y + 26, class: 'vh-traylab', 'text-anchor': 'middle' }, 'Cards'));
    }
    var layer = S('g');
    root.appendChild(layer);

    var cards = [];
    var byId = {};
    var occ = {};
    REGS.forEach(function (r) {
      occ[r] = SLOTS[r].map(function () {
        return null;
      });
    });
    var locked = false;
    var sel = null;
    var drag = null;

    function setPos(card, x, y, anim) {
      card.x = x;
      card.y = y;
      card.g.classList.toggle('vh-anim', !!anim);
      card.g.style.transform = 'translate(' + (x - CW / 2) + 'px,' + (y - CH / 2) + 'px)';
    }
    function free(card) {
      if (card.reg) occ[card.reg][card.slot] = null;
      card.reg = null;
      card.slot = -1;
    }
    function placeAt(card, reg, px, py, anim) {
      if (card.reg === reg && px == null) return true;
      var old = { reg: card.reg, slot: card.slot };
      free(card);
      var best = -1;
      var bestD = Infinity;
      occ[reg].forEach(function (who, i) {
        if (who) return;
        var s = SLOTS[reg][i];
        var d = px == null ? i : Math.hypot(s.x - px, s.y - py);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      if (best === -1) {
        if (old.reg) {
          occ[old.reg][old.slot] = card.id;
          card.reg = old.reg;
          card.slot = old.slot;
        }
        return false;
      }
      occ[reg][best] = card.id;
      card.reg = reg;
      card.slot = best;
      setPos(card, SLOTS[reg][best].x, SLOTS[reg][best].y, anim);
      return true;
    }
    function toTray(card, anim) {
      free(card);
      var s = TRAY_SLOTS[card.tray];
      setPos(card, s.x, s.y, anim);
    }
    function hot(reg) {
      REGS.forEach(function (r) {
        overlays[r].classList.toggle('vh-hot', r === reg);
      });
    }
    function select(card) {
      sel = sel === card ? null : card;
      cards.forEach(function (c) {
        c.g.classList.toggle('vh-sel', c === sel);
      });
      if (sel && o.onPick) o.onPick(sel.c);
    }
    function changed(card) {
      card.g.classList.remove('vh-bad');
      if (o.onChange) o.onChange(card);
    }
    function drop(card, x, y) {
      var reg = regionAt(x, y);
      if (reg) {
        if (o.onDrop && !o.onDrop(card.c, reg)) {
          toTray(card, true);
          card.g.classList.add('vh-bounce');
          api.later(function () {
            card.g.classList.remove('vh-bounce');
          }, 500);
        } else if (!placeAt(card, reg, x, y, true)) toTray(card, true);
      } else toTray(card, true);
      if (sel) select(sel);
      changed(card);
    }

    o.cards.forEach(function (c, i) {
      var g = S('g', { class: 'vh-card', 'data-id': c.id, role: 'button', 'aria-label': cardName(c) });
      g.appendChild(S('rect', { x: 0, y: 0, width: CW, height: CH, rx: 9, class: 'vh-cbg' }));
      g.appendChild(cardFace(c));
      var card = { id: c.id, c: c, g: g, reg: null, slot: -1, tray: i, x: 0, y: 0 };
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
      var g = e.target.closest ? e.target.closest('.vh-card') : null;
      if (!g) return;
      e.preventDefault();
      var card = byId[g.getAttribute('data-id')];
      var p = pt(e);
      drag = { card: card, sx: e.clientX, sy: e.clientY, ox: p.x - card.x, oy: p.y - card.y, moved: false };
    });
    function onMove(e) {
      if (!drag) return;
      if (!drag.moved) {
        if (Math.abs(e.clientX - drag.sx) + Math.abs(e.clientY - drag.sy) < 6) return;
        drag.moved = true;
        layer.appendChild(drag.card.g);
        drag.card.g.classList.add('vh-lift');
        if (o.onPick) o.onPick(drag.card.c);
      }
      var p = pt(e);
      setPos(drag.card, p.x - drag.ox, p.y - drag.oy, false);
      hot(regionAt(drag.card.x, drag.card.y));
    }
    function onUp() {
      if (!drag) return;
      var d = drag;
      drag = null;
      if (!d.moved) {
        select(d.card);
        return;
      }
      d.card.g.classList.remove('vh-lift');
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
      if (e.target.closest && e.target.closest('.vh-card')) return;
      var p = pt(e);
      var card = sel;
      if (regionAt(p.x, p.y)) drop(card, p.x, p.y);
      else if (inTray(p.x, p.y)) {
        toTray(card, true);
        select(card);
        changed(card);
      }
    });

    var V = {
      svg: root,
      el: el('div', { class: 'vh-mat' }, root),
      cards: cards,
      regionOf: function (cid) {
        return byId[cid].reg;
      },
      place: function (cid, reg) {
        var card = byId[cid];
        var ok = placeAt(card, reg, null, null, true);
        if (!ok) {
          // region full: move the newest occupant out so the card fits (only used by test/reveal)
          var other = byId[occ[reg][occ[reg].length - 1]];
          toTray(other, true);
          ok = placeAt(card, reg, null, null, true);
        }
        changed(card);
        return ok;
      },
      toTray: function (cid) {
        toTray(byId[cid], true);
      },
      lock: function () {
        locked = true;
        if (sel) select(sel);
        root.classList.add('vh-locked');
      },
      mark: function (cid, cls) {
        byId[cid].g.classList.add(cls);
      },
      clearMarks: function () {
        cards.forEach(function (c) {
          c.g.classList.remove('vh-bad', 'vh-ok');
        });
      },
      flash: function (reg) {
        var ov = overlays[reg];
        ov.classList.remove('vh-flash');
        void ov.getBoundingClientRect();
        ov.classList.add('vh-flash');
      },
      showEmpty: function (reg) {
        emptyNote[reg].classList.add('vh-show');
      },
      setLabel: function (k, t) {
        labels[k] = t;
        drawLabels();
      },
      // reveal: every card to its own region, moving the ones in the wrong place
      solveAll: function () {
        cards.forEach(function (c) {
          if (c.reg !== c.c.region) free(c);
        });
        cards.forEach(function (c) {
          if (!c.reg) placeAt(c, c.c.region, null, null, true);
        });
      },
      symLines: function () {
        cards.forEach(function (c) {
          if (c.c.shape && SHAPES[c.c.shape].sym) c.g.appendChild(shapeSvg(c.c.shape, true));
        });
      },
    };
    return V;
  }

  /* ------------------------------------------------------------------ *
   * Shared wording
   * ------------------------------------------------------------------ */
  function regionText(q, reg) {
    var A = rule(q.a).label;
    var B = rule(q.b).label;
    if (reg === 'both') return 'the middle, where the hoops overlap';
    if (reg === 'a') return 'the "' + A + '" hoop only';
    if (reg === 'b') return 'the "' + B + '" hoop only';
    return 'the box, outside both hoops';
  }
  function explain(q, c) {
    return cap(rule(q.a).why(c)) + '. ' + cap(rule(q.b).why(c)) + '. So it goes in ' + regionText(q, c.region) + '.';
  }
  function listNames(cs) {
    return cs
      .map(function (c) {
        return c.n != null ? String(c.n) : cardName(c).replace(/^the /, '');
      })
      .join(', ');
  }
  function working(q) {
    var A = rule(q.a).label;
    var B = rule(q.b).label;
    var parts = [];
    var head = { both: 'Both rules', a: 'Only "' + A + '"', b: 'Only "' + B + '"', none: 'Neither (box)' };
    REGS.forEach(function (r) {
      var cs = q.cards.filter(function (c) {
        return c.region === r;
      });
      parts.push(head[r] + ': ' + (cs.length ? listNames(cs) : 'nothing. Empty is fine!'));
    });
    return parts.join(' · ');
  }
  function multRuleOf(q) {
    var ids = [q.a, q.b].filter(function (x) {
      return /^mult:/.test(x);
    });
    return ids.map(function (x) {
      return { id: x, side: x === q.a ? 'a' : 'b', k: rule(x).mult };
    });
  }
  function inSide(reg, side) {
    return reg === 'both' || reg === side;
  }

  /* ------------------------------------------------------------------ *
   * Practice: sort the cards
   * ------------------------------------------------------------------ */
  function renderSort(stage, api, q) {
    var A = rule(q.a);
    var B = rule(q.b);
    var cards = q.cards.map(function (c, i) {
      return Object.assign({ id: 'c' + i }, c);
    });
    var strip = q.steps ? makeStrip(q.max, q.steps) : null;
    var lastSig = null;
    var V = makeVenn(api, {
      labelA: A.label,
      labelB: B.label,
      cards: cards,
      onPick: function (c) {
        if (strip && c.n != null) strip.pin(c.n);
      },
    });
    var checkBtn = el('button', { class: 'btn btn-check vh-check', type: 'button' }, 'Check ✔');
    checkBtn.addEventListener('click', onCheck);
    stage.appendChild(V.el);
    stage.appendChild(el('div', { class: 'vh-ctrl' }, strip ? strip.el : null, el('div', { class: 'vh-btns' }, strip ? strip.buttons : null, checkBtn)));

    if (q.kind === 'pics') api.say('Drag each card. Fits both rules? The middle! Fits neither? The box.', 'think');
    else if (q.kind === 'shapes') api.say('Sort the shapes. Count the sides, and imagine folding each shape in half.', 'think');
    else if (strip) api.say('Not sure about a multiple? Press a jumps button and drag the card: the red pin shows its number.', 'think');
    else api.say('Test each number with both rules, then drag it to its place.', 'think');

    function onCheck() {
      if (api.isAnswered()) return;
      var loose = cards.filter(function (c) {
        return !V.regionOf(c.id);
      });
      if (loose.length) {
        var allNone = loose.every(function (c) {
          return c.region === 'none';
        });
        api.feedback(allNone && loose.length < cards.length ? 'Every card goes on the mat. A card that fits neither rule still goes inside the box, outside the hoops.' : 'Put every card on the mat first, then press Check.', 'try');
        return;
      }
      var sig = cards
        .map(function (c) {
          return V.regionOf(c.id);
        })
        .join();
      if (sig === lastSig) {
        api.feedback('Move the orange cards first, then press Check again.', 'try');
        return;
      }
      lastSig = sig;
      V.clearMarks();
      var wrong = cards.filter(function (c) {
        return V.regionOf(c.id) !== c.region;
      });
      if (!wrong.length) {
        V.lock();
        cards.forEach(function (c) {
          V.mark(c.id, 'vh-ok');
        });
        api.check(true, q.empty.length ? 'All sorted! And yes, a space can stay empty.' : 'All sorted! Every card is in the right place.');
        return;
      }
      wrong.forEach(function (c) {
        V.mark(c.id, 'vh-bad');
      });
      var n = wrong.length;
      var lead = n === 1 ? '1 card is in the wrong place (orange). ' : n + ' cards are in the wrong place (orange). ';
      var mults = multRuleOf(q);
      var tag;
      var focus = wrong[0];
      var inEmpty = wrong.filter(function (c) {
        return q.empty.indexOf(V.regionOf(c.id)) !== -1;
      });
      var oneHoop = wrong.filter(function (c) {
        var at = V.regionOf(c.id);
        return c.region === 'both' && (at === 'a' || at === 'b');
      });
      var multBad = [];
      mults.forEach(function (m) {
        wrong.forEach(function (c) {
          if (inSide(V.regionOf(c.id), m.side) !== inSide(c.region, m.side)) multBad.push({ c: c, m: m });
        });
      });
      var hint;
      if (oneHoop.length) {
        tag = 'Fits both but put in one hoop';
        focus = oneHoop[0];
        hint = lead + 'One of them fits BOTH rules, so it goes in the middle where the hoops overlap.';
      } else if (inEmpty.length) {
        tag = 'Thought a region cannot be empty';
        focus = inEmpty[0];
        var er = V.regionOf(focus.id);
        hint = lead + 'Does anything really belong in ' + regionText(q, er) + '? A space is allowed to stay empty.';
      } else if (multBad.length) {
        tag = 'Multiple-of check wrong';
        focus = multBad[0].c;
        hint = lead + 'Check "multiple of ' + multBad[0].m.k + '": press Jumps of ' + multBad[0].m.k + ' and see if ' + focus.n + ' is a landing spot.';
      } else {
        tag = 'Placed in the wrong hoop';
        var outer = wrong.filter(function (c) {
          return c.region === 'none';
        });
        hint = lead + (outer.length ? 'If a card fits neither rule, it goes in the box, outside both hoops.' : 'Ask two questions for each orange card: does it fit "' + A.label + '"? Does it fit "' + B.label + '"?');
      }
      if (api.tries() >= 1) {
        // stronger: explain one card fully and light up where it belongs
        hint = (n > 1 ? n + ' cards are still wrong. ' : '') + 'Look at ' + cardName(focus) + '. ' + explain(q, focus);
        V.flash(focus.region);
        if (q.empty.length && tag === 'Thought a region cannot be empty') q.empty.forEach(V.showEmpty);
        if (strip && focus.n != null) {
          mults.forEach(function (m) {
            strip.toggle(m.k, true);
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
        V.mark(c.id, 'vh-ok');
      });
      q.empty.forEach(V.showEmpty);
      if (q.kind === 'shapes') V.symLines();
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
          V.place(c.id, c.region);
        });
        checkBtn.click();
      },
      wrong: function () {
        cards.forEach(function (c) {
          V.place(c.id, c.region);
        });
        var c = cards[wrongN++ % cards.length];
        var target = REGS.filter(function (r) {
          return r !== c.region;
        })[wrongN % 3];
        V.place(c.id, target);
        checkBtn.click();
      },
    };
  }

  /* ------------------------------------------------------------------ *
   * Practice: the hoops are filled; choose the two labels
   * ------------------------------------------------------------------ */
  function renderLabels(stage, api, q) {
    var cards = q.cards.map(function (c, i) {
      return Object.assign({ id: 'c' + i }, c);
    });
    var strip = q.steps ? makeStrip(q.max, q.steps) : null;
    var V = makeVenn(api, { labelA: null, labelB: null, cards: cards, tray: false });
    cards.forEach(function (c) {
      V.place(c.id, c.region);
    });
    V.lock();
    V.svg.addEventListener('click', function (e) {
      var g = e.target.closest ? e.target.closest('.vh-card') : null;
      if (g && strip) strip.pin(+g.textContent);
    });
    var pick = { a: null, b: null };
    var lastSig = null;
    var groups = {};
    function group(k, title) {
      var box = el('div', { class: 'vh-lgroup vh-lgroup-' + k }, el('div', { class: 'vh-lhead' }, title));
      groups[k] = q.options.map(function (opt) {
        var b = el('button', { class: 'vh-opt', type: 'button' }, rule(opt).label);
        b.addEventListener('click', function () {
          if (api.isAnswered()) return;
          pick[k] = opt;
          groups[k].forEach(function (x) {
            x.classList.toggle('vh-on', x === b);
          });
          V.setLabel(k, rule(opt).label);
          MQ.sound('click');
        });
        b.opt = opt;
        box.appendChild(b);
        return b;
      });
      return box;
    }
    var checkBtn = el('button', { class: 'btn btn-check vh-check', type: 'button' }, 'Check ✔');
    checkBtn.addEventListener('click', onCheck);
    var side = el('div', { class: 'vh-side' }, group('a', 'Blue hoop'), group('b', 'Orange hoop'), checkBtn);
    stage.appendChild(el('div', { class: 'vh-lrow' }, V.el, side));
    if (strip) stage.appendChild(el('div', { class: 'vh-ctrl' }, strip.el, el('div', { class: 'vh-btns' }, strip.buttons)));
    api.say('Bolt sorted these cards but lost the labels! Choose a label for each hoop.', 'think');

    function onCheck() {
      if (api.isAnswered()) return;
      if (!pick.a || !pick.b) {
        api.feedback('Choose a label for both hoops, then press Check.', 'try');
        return;
      }
      if (pick.a === pick.b) {
        api.feedback('The two hoops need different labels.', 'try');
        return;
      }
      var sig = pick.a + '|' + pick.b;
      if (sig === lastSig) {
        api.feedback('Change a label first, then press Check again.', 'try');
        return;
      }
      lastSig = sig;
      V.clearMarks();
      if (sameSorting(pick.a, pick.b, cards)) {
        cards.forEach(function (c) {
          V.mark(c.id, 'vh-ok');
        });
        api.check(true, 'Yes! Every card fits those labels.');
        return;
      }
      var tag;
      var hint;
      if (pick.a === q.b && pick.b === q.a) {
        tag = 'Swapped the hoop labels';
        hint = 'Those are the right two labels, but on the wrong hoops. Test a card that is in one hoop only.';
      } else {
        // first card that contradicts a chosen label
        var badSide = null;
        var bad = null;
        ['a', 'b'].some(function (k) {
          var R = rule(pick[k]);
          return cards.some(function (c) {
            if (R.test(c) !== inSide(c.region, k)) {
              badSide = k;
              bad = c;
              return true;
            }
            return false;
          });
        });
        var R = rule(pick[badSide]);
        var hoop = badSide === 'a' ? 'blue' : 'orange';
        V.mark(bad.id, 'vh-bad');
        tag = /^mult:/.test(pick[badSide]) || /^mult:/.test(q[badSide]) ? 'Multiple-of check wrong' : 'Chose a label that does not fit';
        hint = 'Look at ' + bad.n + ': it is ' + (inSide(bad.region, badSide) ? 'inside' : 'outside') + ' the ' + hoop + ' hoop ("' + R.label + '"), but ' + R.why(bad) + '.';
        if (api.tries() >= 1) {
          var mids = cards.filter(function (c) {
            return c.region === 'both';
          });
          hint += ' The middle cards (' + listNames(mids) + ') fit BOTH labels. What do they have in common?';
          V.flash('both');
          if (strip && /^mult:/.test(pick[badSide])) {
            strip.toggle(rule(pick[badSide]).mult, true);
            strip.pin(bad.n);
          }
        }
      }
      api.check(false, hint, tag);
    }

    api.onReveal(function () {
      V.setLabel('a', rule(q.a).label);
      V.setLabel('b', rule(q.b).label);
      ['a', 'b'].forEach(function (k) {
        groups[k].forEach(function (x) {
          x.classList.toggle('vh-on', x.opt === q[k]);
          x.disabled = true;
        });
      });
      checkBtn.disabled = true;
      V.clearMarks();
      cards.forEach(function (c) {
        V.mark(c.id, 'vh-ok');
      });
      if (strip) {
        multRuleOf(q).forEach(function (m) {
          strip.toggle(m.k, true);
        });
        strip.pin(null);
      }
      api.feedback(working(q), 'info');
    });

    var wrongPairs = [];
    q.options.forEach(function (x) {
      q.options.forEach(function (y) {
        if (x !== y && !(x === q.a && y === q.b)) wrongPairs.push([x, y]);
      });
    });
    var wrongN = 0;
    function choose(a, b) {
      groups.a.filter(function (x) {
        return x.opt === a;
      })[0].click();
      groups.b.filter(function (x) {
        return x.opt === b;
      })[0].click();
    }
    MQ.__test = {
      solve: function () {
        choose(q.a, q.b);
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
   * Learn screens: a small Venn where each drop is judged at once
   * ------------------------------------------------------------------ */
  function learnVenn(stage, api, q, msgs) {
    var cards = q.cards.map(function (c, i) {
      return Object.assign({ id: 'c' + i }, c);
    });
    var done = {};
    var strip = msgs.strip || null;
    var V = makeVenn(api, {
      labelA: rule(q.a).label,
      labelB: rule(q.b).label,
      cards: cards,
      onPick: function (c) {
        if (strip && c.n != null) strip.pin(c.n);
      },
      onDrop: function (c, reg) {
        if (reg === c.region) {
          done[c.id] = true;
          api.sound('correct');
          api.feedback(explain(q, c), 'good');
          if (cards.every(function (x) { return done[x.id] || x.id === c.id; })) {
            api.later(function () {
              V.lock();
              api.say(msgs.done, 'cheer');
              api.feedback(msgs.doneFb, 'good');
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
    api.lockNext();
    return V;
  }

  MQ.register('venn-hoops', {
    learn: [
      function (stage, api) {
        api.say('Two hoops on a mat! One is for red things, one is for round things. Drag each card.');
        stage.appendChild(MQ.ui.lesson('Two hoops in a box', 'Fits <b>both</b>? The middle. Fits <b>neither</b>? The box, outside the hoops.'));
        var q = { a: 'red', b: 'round', cards: [{ pic: 'ball' }, { pic: 'book' }, { pic: 'gapple' }, { pic: 'pencil' }] };
        q.cards.forEach(function (c) {
          c.region = regionFor(q.a, q.b, c);
        });
        var V = learnVenn(stage, api, q, {
          done: 'The red ball is red AND round, so it sits in the middle.',
          doneFb: 'Middle = both rules. Box = neither rule, but it is still on the mat.',
        });
        stage.appendChild(V.el);
      },
      function (stage, api) {
        api.say('Now numbers. Is it even? Is it less than 10? Ask both questions.');
        stage.appendChild(MQ.ui.lesson('Sort the numbers', 'Ask two questions for every card.'));
        var q = { a: 'even', b: 'lt:10', cards: [{ n: 4 }, { n: 7 }, { n: 12 }, { n: 15 }] };
        q.cards.forEach(function (c) {
          c.region = regionFor(q.a, q.b, c);
        });
        var V = learnVenn(stage, api, q, {
          done: 'Each part of the mat has its own number. Great sorting!',
          doneFb: '4: both. 12: even only. 7: less than 10 only. 15: neither, so it goes in the box.',
        });
        stage.appendChild(V.el);
      },
      function (stage, api) {
        api.say('Is 18 a multiple of 3? Press Jumps of 3. If a jump lands on 18, it is!');
        var strip = makeStrip(30, [3]);
        strip.pin(18);
        var q = { a: 'mult:3', b: 'even', cards: [{ n: 18 }, { n: 20 }, { n: 9 }, { n: 7 }] };
        q.cards.forEach(function (c) {
          c.region = regionFor(q.a, q.b, c);
        });
        var V = learnVenn(stage, api, q, {
          strip: strip,
          done: 'Jumps of 3 land on 9 and 18, so they are multiples of 3.',
          doneFb: 'Use the jumps whenever you are not sure about a multiple.',
        });
        strip.buttons[0].addEventListener('click', function () {
          if (strip.isOn(3)) api.feedback('3, 6, 9, 12, 15, 18 … a jump lands on 18, so 18 is a multiple of 3.', 'info');
        });
        V.el.classList.add('vh-small');
        stage.appendChild(el('div', { class: 'vh-ctrl' }, strip.el, el('div', { class: 'vh-btns' }, strip.buttons)));
        stage.appendChild(V.el);
      },
    ],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'labels') renderLabels(stage, api, q);
        else renderSort(stage, api, q);
      },
    },
  });
  var deck = null;

  // for automated checks
  MQ.__vhBuildDeck = buildDeck;
  MQ.__vhSlots = SLOTS;

  var css = [
    '.vh-mat{width:100%;max-width:650px;display:flex;justify-content:center}',
    '.vh-mat.vh-small{max-width:600px}',
    '.vh-svg{width:100%;height:auto;display:block;user-select:none;-webkit-user-select:none;touch-action:none}',
    '.vh-tint-a{fill:#e4efff}.vh-tint-b{fill:#ffeedd}.vh-tint-both{fill:#ece3ff}.vh-tint-none{fill:#fff}',
    '.vh-ov{fill:#ffd84d;opacity:0;pointer-events:none;transition:opacity .12s}',
    '.vh-ov.vh-hot{opacity:.45}',
    '.vh-ov.vh-flash{animation:vhflash 1.1s ease 3}',
    '@keyframes vhflash{50%{opacity:.6}}',
    '.vh-box{fill:none;stroke:#7a8bb5;stroke-width:3}',
    '.vh-ring{fill:none;stroke-width:4;pointer-events:none}',
    '.vh-ring-a{stroke:#2b6cd8}.vh-ring-b{stroke:#e07a1f}',
    '.vh-label rect{stroke-width:2.5}',
    '.vh-label text{font-weight:800;font-size:17px;fill:#1b2a4a}',
    '.vh-label-a rect{fill:#e4efff;stroke:#2b6cd8}.vh-label-b rect{fill:#ffeedd;stroke:#e07a1f}',
    '.vh-label-q text{fill:#8a96b3}',
    '.vh-empty{font-size:15px;font-weight:800;fill:#6b5bb5;opacity:0;font-style:italic}',
    '.vh-empty.vh-show{opacity:1}',
    '.vh-tray{fill:#f3f6fd;stroke:#c9d3ee;stroke-width:2;stroke-dasharray:6 5}',
    '.vh-traylab{font-size:15px;font-weight:800;fill:#4a5a7d}',
    '.vh-card{cursor:grab}',
    '.vh-card.vh-anim{transition:transform .35s ease}',
    '.vh-cbg{fill:#fff;stroke:#9aa8c7;stroke-width:2}',
    '.vh-card:hover .vh-cbg{stroke:var(--accent)}',
    '.vh-card.vh-sel .vh-cbg{stroke:#ffb703;stroke-width:4}',
    '.vh-card.vh-lift{cursor:grabbing;filter:drop-shadow(0 4px 5px rgba(27,42,74,.3))}',
    '.vh-card.vh-bad .vh-cbg{fill:#fff1e6;stroke:#ea580c;stroke-width:4}',
    '.vh-card.vh-ok .vh-cbg{stroke:#1f9d6b;stroke-width:3}',
    '.vh-card.vh-bounce .vh-cbg{fill:#fff1e6}',
    '.vh-locked .vh-card{cursor:default}',
    '.vh-cnum{font-size:22px;font-weight:800;fill:#1b2a4a;font-family:inherit}',
    '.vh-cemo{font-size:28px}',
    '.vh-symline{stroke:#c2410c;stroke-width:2;stroke-dasharray:3 3}',
    '.vh-ctrl{display:flex;align-items:center;justify-content:center;gap:12px;width:100%;max-width:820px;flex-wrap:wrap}',
    '.vh-strip{flex:1 1 440px;min-width:0;background:#fff;border:2px solid var(--line);border-radius:14px;padding:2px 6px}',
    '.vh-strip-svg{width:100%;height:auto;display:block}',
    '.vh-btns{display:flex;flex-direction:column;gap:8px;align-items:stretch}',
    '.vh-check{min-height:48px}',
    '.vh-jbtn{border:2px solid var(--line);background:#fff;border-radius:12px;padding:6px 12px;font:inherit;font-weight:800;color:var(--ink);cursor:pointer;white-space:nowrap}',
    '.vh-jbtn:hover{border-color:var(--accent)}',
    '.vh-jbtn.vh-on{background:#e6f7f2;border-color:#1f9d6b}',
    '.vh-jarc{color:#7c3aed}',
    '.vh-sline{stroke:#1b2a4a;stroke-width:2.5}',
    '.vh-stick{stroke:#1b2a4a;stroke-width:1.5}',
    '.vh-stens{font-size:13px;fill:#4a5a7d;font-weight:700}',
    '.vh-arc{fill:none;stroke-width:2.5;stroke-dasharray:1;stroke-dashoffset:1;animation:vhdraw .35s ease forwards}',
    '.vh-arc.vh-lane0{stroke:#7c3aed}.vh-arc.vh-lane1{stroke:#0e9f8e}',
    '.vh-land{opacity:0;animation:vhfade .3s ease forwards}',
    '.vh-land.vh-lane0{fill:#7c3aed}.vh-land.vh-lane1{fill:#0e9f8e}',
    '.vh-jlab{font-size:15px;font-weight:800;opacity:0;animation:vhfade .3s ease forwards}',
    '.vh-jlab.vh-lane0{fill:#5b21b6}.vh-jlab.vh-lane1{fill:#0b6e66}',
    '@keyframes vhdraw{to{stroke-dashoffset:0}}',
    '@keyframes vhfade{to{opacity:1}}',
    '.vh-pinline{stroke:#e5484d;stroke-width:2.5}',
    '.vh-pinbox{fill:#e5484d}',
    '.vh-pintext{fill:#fff;font-size:14px;font-weight:800}',
    '.vh-lrow{display:flex;gap:14px;align-items:center;justify-content:center;width:100%;flex-wrap:wrap}',
    '.vh-lrow .vh-mat{flex:1 1 420px;max-width:560px}',
    '.vh-side{display:flex;flex-direction:column;gap:10px;flex:0 1 250px}',
    '.vh-lgroup{border:2px solid var(--line);border-radius:14px;padding:8px;display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#fff}',
    '.vh-lgroup-a{border-color:#2b6cd8}.vh-lgroup-b{border-color:#e07a1f}',
    '.vh-lhead{grid-column:1/-1;font-weight:800;font-size:.95rem}',
    '.vh-lgroup-a .vh-lhead{color:#2b6cd8}.vh-lgroup-b .vh-lhead{color:#c2410c}',
    '.vh-opt{border:2px solid var(--line);background:var(--paper);border-radius:10px;padding:6px 6px;font:inherit;font-weight:700;font-size:.9rem;color:var(--ink);cursor:pointer;line-height:1.15}',
    '.vh-opt:hover:not(:disabled){border-color:var(--accent)}',
    '.vh-opt.vh-on{background:#fff3cd;border-color:#ffb703}',
    '.vh-opt:disabled{cursor:default}',
    '@media (max-width:640px){.vh-side{flex-basis:100%}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'venn-hoops' }, css));
})();

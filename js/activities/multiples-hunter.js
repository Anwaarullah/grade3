/* Multiples Hunter (Unit 5.1, with 5.2 Q5 and 5.3 Q4).
 * Multiples of 2, 5 and 10 by the last digit, Venn sorting (with the outside region and the
 * part that is always empty), hopping multiples of 4, 8 and 9 on a number grid, a riddle and
 * "the nth multiple" as hops. Every classification is computed (n % k), never typed in.
 * CSS prefix: mh-
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;
  var ID = 'multiples-hunter';

  /* ---------------------------------------------------------------- *
   * Mistake tags (parent-readable)
   * ---------------------------------------------------------------- */
  var TAG = {
    firstDigit: 'Looked at the first digit, not the last digit',
    fiveTen: 'Thought a number ending in 5 is a multiple of 10',
    overlap: 'Missed that a number goes in both circles',
    outside: 'Put a number in a circle when it belongs outside',
    skipped: 'Missed a multiple',
    notMult: 'Chose a number that is not a multiple',
    empty: 'Could not say which part of the Venn diagram is empty',
    middle: 'Could not describe the numbers in the overlap',
    hop: 'Miscounted a hop on the number grid',
    describe: 'Described the multiples wrongly (odd / even / digits)',
    parity: 'Mixed up odd and even',
    between: 'Chose a number that is not between the two numbers',
    nth: 'Counted the wrong number of hops for "the nth multiple"',
    nthAdd: 'Added the numbers instead of counting hops (4 + 7)',
  };

  /* ---------------------------------------------------------------- *
   * Number helpers (everything is computed)
   * ---------------------------------------------------------------- */
  function ones(n) {
    return n % 10;
  }
  function first(n) {
    return +String(n).charAt(0);
  }
  function isMult(n, k) {
    return n % k === 0;
  }
  function isEven(n) {
    return n % 2 === 0;
  }
  function digitSum(n) {
    return String(n)
      .split('')
      .reduce(function (s, d) {
        return s + +d;
      }, 0);
  }
  /** [99, 18, 9]: keep adding the digits until one digit is left. */
  function digitChain(n) {
    var out = [n];
    while (out[out.length - 1] > 9) out.push(digitSum(out[out.length - 1]));
    return out;
  }
  function ordinal(n) {
    var s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : n % 10 === 1 ? 'st' : n % 10 === 2 ? 'nd' : n % 10 === 3 ? 'rd' : 'th';
    return n + s;
  }
  /** Last digits that multiples of k can end in (computed from 1–100). */
  function endings(k) {
    var seen = {};
    U.range(1, 100).forEach(function (n) {
      if (isMult(n, k)) seen[ones(n)] = true;
    });
    return Object.keys(seen)
      .map(Number)
      .sort(function (a, b) {
        return a - b;
      });
  }
  function orList(arr) {
    if (arr.length === 1) return String(arr[0]);
    return arr.slice(0, -1).join(', ') + ' or ' + arr[arr.length - 1];
  }
  function ruleText(k) {
    return 'Multiples of ' + k + ' end in ' + orList(endings(k)) + '.';
  }
  function gcd(x, y) {
    return y ? gcd(y, x % y) : x;
  }
  function lcm(x, y) {
    return (x * y) / gcd(x, y);
  }
  function parityWord(n) {
    return isEven(n) ? 'even' : 'odd';
  }
  /** Number as HTML with the ones digit in its own span. */
  function numHTML(n) {
    var s = String(n);
    return (s.length > 1 ? '<span class="mh-lead">' + s.slice(0, -1) + '</span>' : '') + '<span class="mh-one">' + s.slice(-1) + '</span>';
  }
  function pickNum(lo, hi, pred, used) {
    for (var t = 0; t < 3000; t++) {
      var n = U.rand(lo, hi);
      if (!used[n] && pred(n)) {
        used[n] = true;
        return n;
      }
    }
    return null;
  }
  function btn(label, cls, onclick) {
    return el('button', { class: 'btn ' + (cls || ''), type: 'button', onclick: onclick }, label);
  }
  function tagChoices(ch) {
    ch.buttons.forEach(function (b) {
      b.setAttribute('data-value', String(b.value_));
    });
    return ch;
  }

  /* ---------------------------------------------------------------- *
   * Deck
   * ---------------------------------------------------------------- */
  function makeTap(k, max, count) {
    var lo = max === 100 ? 10 : 101;
    var hi = max === 100 ? 100 : 999;
    var used = {};
    var nums = [];
    var isT = function (n) {
      return isMult(n, k);
    };
    function add(pred) {
      var n = pickNum(lo, hi, pred, used);
      if (n != null) nums.push(n);
    }
    var nT = Math.round(count / 2) + U.rand(-1, 0);
    if (max === 1000 && Math.random() < 0.5) {
      used[1000] = true;
      nums.push(1000);
    }
    // targets that catch "first digit" thinking
    if (k === 2) {
      add(function (n) {
        return isT(n) && first(n) % 2 === 1;
      });
      add(function (n) {
        return isT(n) && first(n) % 2 === 1;
      });
    } else if (k === 5) {
      add(function (n) {
        return ones(n) === 5;
      });
      add(function (n) {
        return ones(n) === 0;
      });
    }
    while (nums.filter(isT).length < nT) add(isT);
    // non-targets that are traps
    var trap =
      k === 2
        ? function (n) {
            return !isT(n) && first(n) % 2 === 0;
          }
        : k === 5
        ? function (n) {
            return !isT(n) && first(n) === 5;
          }
        : function (n) {
            return !isT(n) && ones(n) === 5;
          };
    add(trap);
    add(trap);
    while (nums.length < count)
      add(function (n) {
        return !isT(n);
      });
    nums = U.shuffle(nums);
    return {
      type: 'tap',
      k: k,
      max: max,
      nums: nums,
      answer: nums.filter(isT).sort(function (a, b) {
        return a - b;
      }),
    };
  }

  function regionOf(n, a, b) {
    var A = isMult(n, a);
    var B = isMult(n, b);
    return A && B ? 'both' : A ? 'a' : B ? 'b' : 'out';
  }

  function makeVenn(pair, count) {
    var a = pair[0];
    var b = pair[1];
    var possible = {};
    U.range(1, 1000).forEach(function (n) {
      possible[regionOf(n, a, b)] = true;
    });
    var regs = ['both', 'a', 'b', 'out'].filter(function (r) {
      return possible[r];
    });
    var quota = {};
    regs.forEach(function (r) {
      quota[r] = 2;
    });
    var left = count - 2 * regs.length;
    while (left > 0) {
      var r = U.pick(regs);
      if (quota[r] < 4) {
        quota[r]++;
        left--;
      }
    }
    var used = {};
    var nums = [];
    regs.forEach(function (r) {
      for (var i = 0; i < quota[r]; i++) {
        var small = Math.random() < 0.3;
        var pred = function (n) {
          return regionOf(n, a, b) === r;
        };
        // one outside number with an even first digit catches "first digit" thinking
        if (r === 'out' && i === 0 && a === 2)
          pred = function (n) {
            return regionOf(n, a, b) === 'out' && first(n) % 2 === 0;
          };
        var n = pickNum(small ? 10 : 100, small ? 99 : 999, pred, used);
        if (n == null) n = pickNum(10, 999, pred, used);
        nums.push(n);
      }
    });
    nums = U.shuffle(nums);
    var region = {};
    nums.forEach(function (n) {
      region[n] = regionOf(n, a, b);
    });
    var labels = { a: 'Multiple of ' + a + ' only', b: 'Multiple of ' + b + ' only', both: 'In both circles (the middle)', out: 'Outside both circles' };
    var empty = ['a', 'b', 'both', 'out'].filter(function (r) {
      return !possible[r];
    });
    var follow;
    if (empty.length) {
      follow = {
        kind: 'empty',
        answer: empty[0],
        options: ['a', 'both', 'b', 'out'].map(function (v) {
          return { value: v, label: labels[v] };
        }),
      };
    } else {
      var mids = U.range(1, 1000).filter(function (n) {
        return regionOf(n, a, b) === 'both';
      });
      var opts = [
        { value: 'end0', label: 'They all end in 0', test: function (n) { return ones(n) === 0; } },
        { value: 'end5', label: 'They all end in 5', test: function (n) { return ones(n) === 5; } },
        { value: 'odd', label: 'They are all odd', test: function (n) { return !isEven(n); } },
      ];
      var ans = opts.filter(function (o) {
        return mids.every(o.test);
      });
      follow = {
        kind: 'middle',
        answer: ans[0].value,
        options: opts.map(function (o) {
          return { value: o.value, label: o.label };
        }),
      };
    }
    return { type: 'venn', a: a, b: b, nums: nums, region: region, labels: labels, follow: follow };
  }

  function makeGrid(k) {
    var g = k === 9 ? { from: 1, to: 100, top: 1 } : { from: 71, to: 120, top: 61 };
    var start = k === 9 ? 0 : Math.floor((g.from - 1) / k) * k;
    var targets = U.range(g.from, g.to).filter(function (n) {
      return isMult(n, k);
    });
    var stmts = [
      { value: 'even', label: 'They are all even', test: function (arr) { return arr.every(isEven); } },
      { value: 'odd', label: 'They are all odd', test: function (arr) { return arr.every(function (n) { return !isEven(n); }); } },
      { value: 'mixed', label: 'Odd and even are mixed', test: function (arr) { return arr.some(isEven) && arr.some(function (n) { return !isEven(n); }); } },
      {
        value: 'nine',
        label: 'Add the digits: always 9',
        test: function (arr) {
          return arr.every(function (n) {
            var c = digitChain(n);
            return c[c.length - 1] === 9;
          });
        },
      },
    ].map(function (s) {
      return { value: s.value, label: s.label, truth: s.test(targets) };
    });
    return { type: 'grid', k: k, from: g.from, to: g.to, top: g.top, start: start, targets: targets, stmts: stmts };
  }

  function makeRiddle() {
    for (var t = 0; t < 5000; t++) {
      var three = Math.random() < 0.5;
      var L = three ? U.rand(200, 960) : U.rand(20, 85);
      var Up = L + U.rand(10, 12);
      var parity = U.pick(['odd', 'even']);
      var k = U.pick([5, 10]);
      var strip = U.range(L - 3, Up + 3);
      var pBetween = function (n) {
        return n > L && n < Up;
      };
      var pPar = function (n) {
        return parity === 'odd' ? !isEven(n) : isEven(n);
      };
      var pMul = function (n) {
        return isMult(n, k);
      };
      var all = strip.filter(function (n) {
        return pBetween(n) && pPar(n) && pMul(n);
      });
      var noBetween = strip.filter(function (n) {
        return pPar(n) && pMul(n);
      });
      var noMul = strip.filter(function (n) {
        return pBetween(n) && pPar(n);
      });
      if (all.length === 1 && noBetween.length > 1 && noMul.length > 1) {
        return { type: 'riddle', L: L, U: Up, parity: parity, k: k, strip: strip, answer: all[0] };
      }
    }
    return { type: 'riddle', L: 70, U: 80, parity: 'odd', k: 5, strip: U.range(67, 83), answer: 75 };
  }

  function makeNth() {
    var k = U.pick([4, 8]);
    var n = U.rand(3, 9);
    return { type: 'nth', k: k, n: n, answer: k * n };
  }

  function buildDeck() {
    var deck = [];
    var k1 = U.pick([5, 10]);
    var k2 = k1 === 5 ? 10 : 5;
    deck.push(makeTap(2, 100, 8));
    deck.push(makeTap(k1, 100, 10));
    deck.push(makeTap(k2, 1000, 10));
    deck.push(makeTap(2, 1000, 12));
    var pairs = U.shuffle([[5, 10], [2, 5], [2, 10]]);
    deck.push(makeVenn(pairs[0], 8));
    deck.push(makeVenn(pairs[1], 9));
    deck.push(makeVenn(pairs[2], 10));
    deck.push(makeGrid(U.pick([4, 8, 9])));
    deck.push(makeRiddle());
    deck.push(makeNth());
    deck.forEach(function (q, i) {
      q.level = i < 10 / 3 ? 1 : i < 20 / 3 ? 2 : 3;
    });
    return deck;
  }
  var deck = null;

  /* ---------------------------------------------------------------- *
   * Drawings
   * ---------------------------------------------------------------- */
  function frogShape() {
    return S(
      'g',
      { class: 'mh-frog' },
      S('ellipse', { cx: 0, cy: 3, rx: 14, ry: 10, fill: '#55a630', stroke: '#2b6a17', 'stroke-width': 1.5 }),
      S('circle', { cx: -7, cy: -6, r: 5, fill: '#55a630', stroke: '#2b6a17', 'stroke-width': 1.5 }),
      S('circle', { cx: 7, cy: -6, r: 5, fill: '#55a630', stroke: '#2b6a17', 'stroke-width': 1.5 }),
      S('circle', { cx: -7, cy: -6, r: 2.6, fill: '#fff' }),
      S('circle', { cx: 7, cy: -6, r: 2.6, fill: '#fff' }),
      S('circle', { cx: -6.5, cy: -6, r: 1.3, fill: '#1b2a4a' }),
      S('circle', { cx: 7.5, cy: -6, r: 1.3, fill: '#1b2a4a' }),
      S('path', { d: 'M-6 6 q6 5 12 0', fill: 'none', stroke: '#1b2a4a', 'stroke-width': 1.6, 'stroke-linecap': 'round' })
    );
  }

  /* ---------------------------------------------------------------- *
   * Venn engine: two circles in a box, a tray of number tiles.
   * ---------------------------------------------------------------- */
  var VW = 800;
  var VH = 478;
  var BOX = { x: 10, y: 52, w: 780, h: 322 };
  var CA = { x: 310, y: 213, r: 160 };
  var CB = { x: 490, y: 213, r: 160 };
  var TRAY = { x: 10, y: 392, w: 780, h: 80 };
  var SLOTS = (function () {
    var a = [[262, 98], [262, 143], [262, 188], [262, 233], [262, 278], [262, 323], [200, 168], [200, 213], [200, 258]];
    var s = {
      both: [[400, 128], [400, 170], [400, 213], [400, 256], [400, 298]],
      a: a,
      b: a.map(function (p) {
        return [VW - p[0], p[1]];
      }),
      out: [],
    };
    [92, 142, 192, 242, 292, 342].forEach(function (y) {
      s.out.push([55, y]);
      s.out.push([745, y]);
    });
    return s;
  })();

  function dist(p, c) {
    return Math.sqrt((p.x - c.x) * (p.x - c.x) + (p.y - c.y) * (p.y - c.y));
  }
  function regionAt(p) {
    if (p.x < BOX.x || p.x > BOX.x + BOX.w || p.y < BOX.y || p.y > BOX.y + BOX.h) return null;
    var inA = dist(p, CA) <= CA.r;
    var inB = dist(p, CB) <= CB.r;
    return inA && inB ? 'both' : inA ? 'a' : inB ? 'b' : 'out';
  }

  function vennEngine(api, opts) {
    var a = opts.a;
    var b = opts.b;
    var root = S('svg', { viewBox: '0 0 ' + VW + ' ' + VH, class: 'mh-svg mh-venn', width: VW, height: VH });
    root.appendChild(S('rect', { x: BOX.x, y: BOX.y, width: BOX.w, height: BOX.h, rx: 14, class: 'mh-vbox' }));
    root.appendChild(S('circle', { cx: CA.x, cy: CA.y, r: CA.r, class: 'mh-ca' }));
    root.appendChild(S('circle', { cx: CB.x, cy: CB.y, r: CB.r, class: 'mh-cb' }));
    root.appendChild(S('circle', { cx: CA.x, cy: CA.y, r: CA.r, class: 'mh-cline' }));
    root.appendChild(S('circle', { cx: CB.x, cy: CB.y, r: CB.r, class: 'mh-cline' }));
    root.appendChild(S('text', { x: 200, y: 38, class: 'mh-vlab mh-vlab-a', 'text-anchor': 'middle' }, 'Multiple of ' + a));
    root.appendChild(S('text', { x: 600, y: 38, class: 'mh-vlab mh-vlab-b', 'text-anchor': 'middle' }, 'Multiple of ' + b));
    root.appendChild(S('text', { x: 22, y: 366, class: 'mh-vout' }, 'Outside: neither'));
    root.appendChild(S('rect', { x: TRAY.x, y: TRAY.y, width: TRAY.w, height: TRAY.h, rx: 14, class: 'mh-tray' }));
    var notes = S('g', { class: 'mh-vnotes' });
    root.appendChild(notes);
    var tileLayer = S('g');
    root.appendChild(tileLayer);

    var tiles = {};
    var order = [];
    var occupied = { a: {}, b: {}, both: {}, out: {} };
    var locked = false;
    var selected = null;

    function trayPos(i) {
      var n = order.length;
      var step = Math.min(76, (TRAY.w - 40) / Math.max(1, n));
      var x0 = VW / 2 - (step * (n - 1)) / 2;
      return [x0 + i * step, TRAY.y + TRAY.h / 2];
    }
    function setPos(t, x, y) {
      t.x = x;
      t.y = y;
      t.g.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    }
    function freeSlot(t) {
      if (t.region && t.slot != null) delete occupied[t.region][t.slot];
      t.slot = null;
    }
    function place(n, region) {
      var t = tiles[n];
      freeSlot(t);
      t.region = region || null;
      t.g.classList.remove('mh-bad');
      if (!region) {
        var p = trayPos(order.indexOf(n));
        setPos(t, p[0], p[1]);
      } else {
        var list = SLOTS[region];
        var idx = -1;
        for (var i = 0; i < list.length; i++)
          if (!occupied[region][i]) {
            idx = i;
            break;
          }
        if (idx === -1) idx = list.length - 1;
        else occupied[region][idx] = true;
        t.slot = idx;
        setPos(t, list[idx][0], list[idx][1]);
      }
      tileLayer.appendChild(t.g);
      select(null);
      if (opts.onPlace && !locked) opts.onPlace(n, t.region);
    }
    function select(n) {
      if (selected != null && tiles[selected]) tiles[selected].g.classList.remove('mh-sel');
      selected = n;
      if (n != null) tiles[n].g.classList.add('mh-sel');
    }
    function add(n) {
      var g = S(
        'g',
        { class: 'mh-vtile', 'data-value': String(n) },
        S('rect', { x: -31, y: -18, width: 62, height: 36, rx: 9 }),
        S('text', { x: 0, y: 8, 'text-anchor': 'middle' }, String(n))
      );
      var t = { n: n, g: g, region: null, slot: null, x: 0, y: 0 };
      tiles[n] = t;
      order.push(n);
      tileLayer.appendChild(g);
      var ox = 0;
      var oy = 0;
      var moved = false;
      var unbind = MQ.ui.drag(root, g, {
        start: function () {
          ox = t.x;
          oy = t.y;
          moved = false;
        },
        move: function (p, dx, dy) {
          if (locked) return;
          if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
          setPos(t, ox + dx, oy + dy);
        },
        end: function (p) {
          if (locked) return;
          if (!moved) {
            setPos(t, ox, oy);
            select(selected === n ? null : n);
            return;
          }
          var r = regionAt(p);
          place(n, r);
        },
      });
      api.cleanup(unbind);
      // re-lay the tray
      order.forEach(function (m) {
        if (!tiles[m].region) {
          var pp = trayPos(order.indexOf(m));
          setPos(tiles[m], pp[0], pp[1]);
        }
      });
    }
    root.addEventListener('click', function (e) {
      if (locked || selected == null) return;
      if (e.target.closest && e.target.closest('.mh-vtile')) return;
      var p = MQ.ui.svgPoint(root, e);
      var r = regionAt(p);
      if (r || p.y > TRAY.y - 6) place(selected, r);
    });
    (opts.nums || []).forEach(add);

    return {
      svg: root,
      notes: notes,
      tiles: tiles,
      add: add,
      place: place,
      lock: function () {
        locked = true;
        select(null);
        root.classList.add('mh-locked');
      },
      unlock: function () {
        locked = false;
        root.classList.remove('mh-locked');
      },
      region: function (n) {
        return tiles[n].region;
      },
      allPlaced: function () {
        return order.every(function (n) {
          return tiles[n].region;
        });
      },
      mark: function (n, cls) {
        tiles[n].g.classList.add(cls);
      },
      note: function (x, y, text, cls) {
        notes.appendChild(S('text', { x: x, y: y, 'text-anchor': 'middle', class: 'mh-vnote ' + (cls || '') }, text));
      },
    };
  }

  /** Why is n not in region `placed`? Returns {hint, tag}. */
  function vennWhy(n, placed, a, b) {
    var right = regionOf(n, a, b);
    var d = ones(n);
    var claimA = placed === 'a' || placed === 'both';
    var claimB = placed === 'b' || placed === 'both';
    var isA = isMult(n, a);
    var isB = isMult(n, b);
    function notK(k) {
      if (k === 10 && d === 5) return { hint: n + ' ends in 5. It is a multiple of 5, but multiples of 10 end in 0.', tag: TAG.fiveTen };
      if (k === 2 && first(n) % 2 === 0 && n > 9)
        return { hint: n + ' starts with ' + first(n) + ', but look at the LAST digit: ' + d + '. ' + n + ' is odd, so it is not a multiple of 2.', tag: TAG.firstDigit };
      if (k === 5 && first(n) === 5 && n > 9) return { hint: n + ' starts with 5, but it ends in ' + d + '. ' + ruleText(5), tag: TAG.firstDigit };
      return { hint: n + ' ends in ' + d + '. ' + ruleText(k) + ' So ' + n + ' is not a multiple of ' + k + '.', tag: right === 'out' ? TAG.outside : TAG.notMult };
    }
    if (claimB && !isB) return notK(b);
    if (claimA && !isA) return notK(a);
    if (right === 'both') return { hint: n + ' is a multiple of ' + a + ' AND of ' + b + '. It goes in the middle, where the circles overlap.', tag: TAG.overlap };
    var k = isA ? a : b;
    return { hint: n + ' ends in ' + d + ', so it IS a multiple of ' + k + '. It belongs inside the ' + k + ' circle.', tag: TAG.skipped };
  }

  /* ---------------------------------------------------------------- *
   * Learn 1: doors 1–30, counting in 2s, 5s and 10s
   * ---------------------------------------------------------------- */
  function learnDoors(stage, api) {
    api.lockNext();
    api.say('Let us count along the doors. Press a button!', 'happy');
    stage.appendChild(MQ.ui.lesson('Last digit clues', 'Count along the doors. Watch the <b>last digit</b> of every door you land on.'));
    var W = 800;
    var dw = 58;
    var gap = 18;
    var x0 = (W - (10 * dw + 9 * gap)) / 2;
    var root = S('svg', { viewBox: '0 0 ' + W + ' 300', class: 'mh-svg mh-doors', width: W, height: 300 });
    var doors = {};
    U.range(1, 30).forEach(function (n) {
      var c = (n - 1) % 10;
      var r = Math.floor((n - 1) / 10);
      var x = x0 + c * (dw + gap);
      var y = 12 + r * 98;
      var g = S('g', { class: 'mh-door', 'data-n': String(n) });
      g.appendChild(S('rect', { x: x - 4, y: y + 80, width: dw + 8, height: 6, rx: 2, class: 'mh-step' }));
      g.appendChild(S('rect', { x: x, y: y, width: dw, height: 80, rx: 6, class: 'mh-door-body' }));
      g.appendChild(S('rect', { x: x + 8, y: y + 36, width: dw - 16, height: 36, rx: 3, class: 'mh-door-panel' }));
      g.appendChild(S('circle', { cx: x + dw - 9, cy: y + 46, r: 3, class: 'mh-knob' }));
      g.appendChild(S('rect', { x: x + 8, y: y + 7, width: dw - 16, height: 24, rx: 4, class: 'mh-plate' }));
      var s = String(n);
      var tx = S('text', { x: x + dw / 2, y: y + 26, 'text-anchor': 'middle', class: 'mh-door-num' });
      if (s.length > 1) tx.appendChild(S('tspan', null, s.slice(0, -1)));
      tx.appendChild(S('tspan', { class: 'mh-door-one' }, s.slice(-1)));
      g.appendChild(tx);
      root.appendChild(g);
      doors[n] = g;
    });
    stage.appendChild(el('div', { class: 'mh-pic' }, root));
    var run = el('div', { class: 'mh-run' });
    var rule = el('div', { class: 'mh-rulebox' });
    var done = {};
    var busy = false;
    var buttons = [2, 5, 10].map(function (k) {
      return btn('Count in ' + k + 's', 'mh-count mh-count-' + k, function () {
        if (busy) return;
        go(k, this);
      });
    });
    buttons.forEach(function (b, i) {
      b.setAttribute('data-k', String([2, 5, 10][i]));
    });
    stage.appendChild(el('div', { class: 'mh-btnrow' }, buttons));
    stage.appendChild(run);
    stage.appendChild(rule);

    function go(k, b) {
      busy = true;
      buttons.forEach(function (x) {
        x.disabled = true;
      });
      MQ.clear(run);
      MQ.clear(rule);
      U.range(1, 30).forEach(function (n) {
        doors[n].classList.remove('mh-lit', 'mh-lit-2', 'mh-lit-5', 'mh-lit-10');
      });
      var list = U.range(1, 30).filter(function (n) {
        return isMult(n, k);
      });
      var i = 0;
      function step() {
        var n = list[i];
        doors[n].classList.add('mh-lit', 'mh-lit-' + k);
        run.appendChild(el('span', { class: 'chip mh-runchip' }, String(n)));
        api.sound('pop');
        i++;
        if (i < list.length) api.later(step, 260);
        else api.later(finish, 300);
      }
      function finish() {
        busy = false;
        buttons.forEach(function (x) {
          x.disabled = false;
        });
        done[k] = true;
        b.classList.add('mh-done');
        var ends = endings(k);
        rule.appendChild(el('span', { class: 'mh-rule-lab' }, 'Last digits:'));
        ends.forEach(function (d) {
          rule.appendChild(el('span', { class: 'mh-digit mh-digit-' + k }, String(d)));
        });
        var extra = k === 2 ? ' They are the even numbers.' : k === 5 ? ' Odd and even are mixed.' : ' They are all even.';
        rule.appendChild(el('div', { class: 'mh-rule-text' }, ruleText(k) + extra));
        if (k === 2) api.say('Multiples of 2 are even: they end in 0, 2, 4, 6 or 8.', 'happy');
        else if (k === 5) api.say('Multiples of 5 end in 0 or 5.', 'happy');
        else api.say('Multiples of 10 end in 0.', 'happy');
        if (done[2] && done[5] && done[10]) {
          api.unlockNext();
          api.feedback('The last digit tells you! Press Next.', 'good');
        } else {
          var left = [2, 5, 10].filter(function (m) {
            return !done[m];
          });
          api.feedback('Now try counting in ' + left[0] + 's.', 'info');
        }
      }
      step();
    }
  }

  /* ---------------------------------------------------------------- *
   * Learn 2: cover all but the last digit
   * ---------------------------------------------------------------- */
  function learnCover(stage, api) {
    api.lockNext();
    api.say('Big numbers too! I covered all but the last digit.', 'think');
    stage.appendChild(MQ.ui.lesson('Big numbers too', 'Only the <b>last digit</b> (the ones) decides.'));
    var cards = {};
    function card(n) {
      var s = String(n);
      var lead = el('span', { class: 'mh-cardlead' }, s.slice(0, -1), el('span', { class: 'mh-cover' }, '?'));
      var c = el('div', { class: 'mh-bigcard', 'data-n': s }, lead, el('span', { class: 'mh-cardone' }, s.slice(-1)));
      cards[n] = c;
      return c;
    }
    stage.appendChild(el('div', { class: 'mh-cards' }, card(532), card(95)));
    var steps = [
      { n: 532, k: 2 },
      { n: 95, k: 2 },
      { n: 95, k: 5 },
      { n: 95, k: 10 },
    ];
    var ask = el('div', { class: 'mh-ask' });
    var holder = el('div', { class: 'mh-hold' });
    stage.appendChild(ask);
    stage.appendChild(holder);
    var idx = 0;
    function show() {
      var st = steps[idx];
      Object.keys(cards).forEach(function (m) {
        cards[m].classList.toggle('mh-current', +m === st.n);
      });
      ask.innerHTML = 'Is <b>' + st.n + '</b> a multiple of <b>' + st.k + '</b>?';
      MQ.clear(holder);
      var truth = isMult(st.n, st.k);
      var ch = tagChoices(
        MQ.ui.choices(
          [
            { label: 'Yes', value: 'yes' },
            { label: 'No', value: 'no' },
          ],
          function (v) {
            var d = ones(st.n);
            if ((v === 'yes') === truth) {
              ch.mark(v, 'good');
              ch.disable();
              api.sound('correct');
              var why;
              if (st.k === 2) why = st.n + ' ends in ' + d + '. ' + d + ' is ' + parityWord(d) + ', so ' + st.n + (truth ? ' is a multiple of 2.' : ' is NOT a multiple of 2.');
              else if (st.k === 5) why = st.n + ' ends in ' + d + (truth ? ', so it IS a multiple of 5.' : ', so it is NOT a multiple of 5.');
              else why = st.n + ' ends in ' + d + (truth ? ', so it IS a multiple of 10.' : ', not 0. It is NOT a multiple of 10.');
              api.feedback(why, 'good');
              api.say(st.k === 10 && !truth ? 'Ending in 5 is not enough for 10s!' : 'Yes! The last digit told you.', 'cheer');
              idx++;
              var nextSame = idx < steps.length && steps[idx].n === st.n;
              if (!nextSame) cards[st.n].classList.add('mh-open');
              if (idx < steps.length) api.later(show, 1200);
              else {
                ask.innerHTML = 'Cover up the front. <b>The last digit decides.</b>';
                MQ.clear(holder);
                api.unlockNext();
              }
            } else {
              ch.mark(v, 'bad');
              api.sound('wrong');
              var hint = 'Look only at the last digit: ' + d + '. ' + ruleText(st.k);
              if (st.n === 532) hint = 'Do not look at the 5 at the front. The last digit is 2. ' + ruleText(2);
              api.feedback(hint, 'try');
              api.later(function () {
                ch.buttons.forEach(function (bt) {
                  bt.classList.remove('bad');
                });
              }, 900);
            }
          },
          { columns: 2 }
        )
      );
      ch.classList.add('mh-yesno');
      holder.appendChild(ch);
    }
    show();
  }

  /* ---------------------------------------------------------------- *
   * Learn 3: Venn sort, and why "10 only" stays empty
   * ---------------------------------------------------------------- */
  function learnVenn(stage, api) {
    api.lockNext();
    stage.classList.add('mh-stage');
    api.say('Watch me drop 45 in.', 'happy');
    stage.appendChild(MQ.ui.lesson(null, '<b>Venn sort:</b> numbers in <b>neither</b> circle go outside the circles.'));
    var phase = 0;
    var tryNum = null;
    var placedOk = {};
    var eng = vennEngine(api, {
      a: 5,
      b: 10,
      nums: [45, 120, 96],
      onPlace: function (n, r) {
        if (!r) return;
        var right = regionOf(n, 5, 10);
        if (phase === 0 || phase === 3) return;
        if (phase === 2 && n !== tryNum) {
          if (r !== right) api.later(function () {
            eng.place(n, right);
          }, 300);
          return;
        }
        if (phase === 2) {
          // the "try 10 only" number
          phase = 3;
          eng.lock();
          if (r === 'b') api.feedback(n + ' ends in 0. Numbers ending in 0 are multiples of 5 too! It slides to the middle.', 'info');
          else if (r === 'both') api.feedback('Yes! ' + n + ' ends in 0, so it is a multiple of 5 AND of 10.', 'good');
          else api.feedback(n + ' ends in 0, so it is a multiple of 5 AND of 10. It goes in the middle.', 'info');
          api.later(function () {
            eng.unlock();
            eng.place(n, right);
            eng.lock();
            eng.mark(n, 'mh-good');
            eng.note(565, 205, 'Always', 'mh-vnote-empty');
            eng.note(565, 232, 'empty!', 'mh-vnote-empty');
            api.say('Every multiple of 10 is also a multiple of 5. So "10 only" stays empty!', 'cheer');
            api.unlockNext();
          }, r === 'both' ? 500 : 1100);
          return;
        }
        if (r === right) {
          placedOk[n] = true;
          eng.mark(n, 'mh-good');
          api.sound('correct');
          if (n === 120) api.feedback('120 ends in 0: a multiple of 10 AND of 5. It goes in the middle.', 'good');
          else api.feedback('96 ends in 6: not a multiple of 5 or 10. It goes outside.', 'good');
          if (placedOk[120] && placedOk[96]) api.later(askTen, 900);
        } else {
          api.sound('wrong');
          var why = vennWhy(n, r, 5, 10);
          api.feedback(why.hint, 'try');
          api.later(function () {
            eng.place(n, null);
          }, 700);
        }
      },
    });
    stage.appendChild(el('div', { class: 'mh-pic' }, eng.svg));
    var extra = el('div', { class: 'mh-hold' });
    stage.appendChild(extra);
    api.later(function () {
      eng.place(45, 'a');
      eng.mark(45, 'mh-good');
      api.feedback('45 ends in 5: a multiple of 5, but not of 10.', 'info');
      api.later(function () {
        phase = 1;
        api.say('Your turn! Drag 120 and 96.', 'happy');
      }, 600);
    }, 700);

    function askTen() {
      phase = 2;
      api.say('Can any number go in "10 only"? Pick one and drag it there.', 'think');
      var ch = tagChoices(
        MQ.ui.choices(
          [70, 300, 10].map(function (v) {
            return { label: 'Try ' + v, value: v };
          }),
          function (v) {
            ch.disable();
            tryNum = v;
            eng.add(v);
            api.feedback('Drag ' + v + ' into the "multiple of 10" circle, on the right.', 'info');
          },
          { columns: 3 }
        )
      );
      ch.classList.add('mh-try');
      extra.appendChild(ch);
    }
  }

  /* ---------------------------------------------------------------- *
   * Practice: tap the multiples
   * ---------------------------------------------------------------- */
  function renderTap(stage, api, q) {
    var k = q.k;
    api.say(api.index === 0 ? 'Find every multiple of 2. Look at the last digit!' : 'Tap all the multiples of ' + k + '.', 'happy');
    stage.appendChild(MQ.ui.prompt('Tap every <b>multiple of ' + k + '</b>.'));
    stage.appendChild(el('p', { class: 'mh-help' }, 'Look at the last digit (the ones). Tap again to un-tap.'));
    var cloud = el('div', { class: 'mh-cloud' });
    var tiles = {};
    var locked = false;
    q.nums.forEach(function (n) {
      var b = el('button', { class: 'mh-tile', type: 'button', 'data-value': String(n), html: numHTML(n) });
      b.addEventListener('click', function () {
        if (locked) return;
        b.classList.toggle('mh-on');
        b.classList.remove('mh-bad');
        api.sound('click');
      });
      tiles[n] = b;
      cloud.appendChild(b);
    });
    stage.appendChild(cloud);
    var work = el('div', { class: 'mh-work' });
    var check = btn('Check ✔', 'mh-check', onCheck);
    stage.appendChild(el('div', { class: 'mh-btnrow' }, check));
    stage.appendChild(work);

    function finish() {
      locked = true;
      check.disabled = true;
      cloud.classList.add('mh-showones', 'mh-locked');
      q.nums.forEach(function (n) {
        tiles[n].disabled = true;
      });
    }
    function onCheck() {
      if (locked) return;
      var sel = q.nums.filter(function (n) {
        return tiles[n].classList.contains('mh-on');
      });
      if (!sel.length) {
        api.feedback('Tap the multiples of ' + k + ' first, then press Check.', 'info');
        return;
      }
      var wrong = sel.filter(function (n) {
        return !isMult(n, k);
      });
      var missed = q.nums.filter(function (n) {
        return isMult(n, k) && sel.indexOf(n) === -1;
      });
      if (!wrong.length && !missed.length) {
        finish();
        sel.forEach(function (n) {
          tiles[n].classList.add('mh-good');
        });
        api.check(true, 'All ' + sel.length + ' found! ' + ruleText(k));
        return;
      }
      var second = api.tries() >= 1;
      if (second) cloud.classList.add('mh-showones');
      if (wrong.length) {
        wrong.forEach(function (n) {
          tiles[n].classList.add('mh-bad');
        });
        var n = wrong[0];
        var d = ones(n);
        var hint;
        var tag;
        if (k === 10 && d === 5) {
          hint = n + ' ends in 5. That makes it a multiple of 5, but multiples of 10 end in 0.';
          tag = TAG.fiveTen;
        } else if (k === 2 && first(n) % 2 === 0) {
          hint = n + ' starts with ' + first(n) + ', but look at the LAST digit: ' + d + '. ' + d + ' is odd, so ' + n + ' is odd.';
          tag = TAG.firstDigit;
        } else if (k === 5 && first(n) === 5) {
          hint = n + ' starts with 5, but it ends in ' + d + '. ' + ruleText(5);
          tag = TAG.firstDigit;
        } else {
          hint = n + ' ends in ' + d + '. ' + ruleText(k);
          tag = TAG.notMult;
        }
        if (wrong.length > 1) hint += ' (' + wrong.length + ' red ones to un-tap.)';
        if (second) hint += ' The last digits are now in colour.';
        api.check(false, hint, tag);
        return;
      }
      var m = missed[0];
      var h = 'Good so far! ' + missed.length + ' more to find. Check the last digit of every number.';
      if (second) h = 'Look at ' + m + '. Its last digit is ' + ones(m) + '. ' + ruleText(k);
      api.check(false, h, TAG.skipped);
    }

    api.onReveal(function () {
      finish();
      q.nums.forEach(function (n) {
        var t = tiles[n];
        t.classList.remove('mh-bad');
        if (isMult(n, k)) t.classList.add('mh-on', 'mh-good');
        else {
          t.classList.remove('mh-on');
          t.classList.add('mh-dim');
        }
      });
      api.feedback(ruleText(k) + ' Look at the last digit only.', 'info');
      MQ.clear(work);
      work.appendChild(el('div', { class: 'mh-rulebox' }, el('span', { class: 'mh-rule-lab' }, 'Last digits:'), endings(k).map(function (d) {
        return el('span', { class: 'mh-digit mh-digit-' + k }, String(d));
      }), el('div', { class: 'mh-rule-text' }, ruleText(k) + ' The multiples here: ' + q.answer.join(', ') + '.')));
    });
  }

  /* ---------------------------------------------------------------- *
   * Practice: Venn sort + follow-up
   * ---------------------------------------------------------------- */
  function renderVenn(stage, api, q) {
    stage.classList.add('mh-stage');
    var a = q.a;
    var b = q.b;
    api.say('Drag each number into the right part. Can it go in both circles?', 'think');
    stage.appendChild(MQ.ui.prompt('Sort the numbers into the Venn diagram.'));
    stage.appendChild(el('p', { class: 'mh-help' }, 'Drag a number (or tap it, then tap a place). Neither? Put it outside the circles.'));
    var eng = vennEngine(api, { a: a, b: b, nums: q.nums });
    stage.appendChild(el('div', { class: 'mh-pic' }, eng.svg));
    var check = btn('Check ✔', 'mh-check', onCheck);
    var row = el('div', { class: 'mh-btnrow' }, check);
    stage.appendChild(row);
    var follow = el('div', { class: 'mh-follow' });
    stage.appendChild(follow);
    var step = 1;
    var ch = null;

    function onCheck() {
      if (step !== 1) return;
      if (!eng.allPlaced()) {
        api.feedback('Some numbers are still in the tray. Put every number somewhere first.', 'info');
        return;
      }
      var wrong = q.nums.filter(function (n) {
        return eng.region(n) !== q.region[n];
      });
      if (wrong.length) {
        wrong.forEach(function (n) {
          eng.mark(n, 'mh-bad');
        });
        var why = vennWhy(wrong[0], eng.region(wrong[0]), a, b);
        var hint = why.hint;
        if (wrong.length > 1) hint += ' (' + wrong.length + ' numbers in red to move.)';
        if (api.tries() >= 1) hint += ' Cover all but the last digit.';
        api.check(false, hint, why.tag);
        return;
      }
      step = 2;
      eng.lock();
      check.disabled = true;
      row.style.display = 'none';
      q.nums.forEach(function (n) {
        eng.mark(n, 'mh-good');
      });
      api.sound('pop');
      api.feedback('Every number is in the right place! One more question.', 'info');
      showFollow();
    }

    function showFollow() {
      MQ.clear(follow);
      var f = q.follow;
      if (f.kind === 'empty') {
        follow.appendChild(el('div', { class: 'mh-ask' }, 'One part of this diagram will ', el('b', null, 'always'), ' be empty. Which part?'));
        api.say('Which part can never have a number?', 'think');
      } else {
        follow.appendChild(el('div', { class: 'mh-ask' }, 'Look at the numbers in the ', el('b', null, 'middle'), '. What is true about them?'));
        api.say('Look at the middle. What do they have in common?', 'think');
      }
      ch = tagChoices(
        MQ.ui.choices(f.options, function (v) {
          if (v === f.answer) {
            ch.mark(v, 'good');
            ch.disable();
            api.check(true, f.kind === 'empty' ? emptyWhy() : 'Yes! They end in 0, so they are multiples of 10.');
          } else {
            ch.mark(v, 'bad');
            var hint;
            if (f.kind === 'empty') {
              if (v === 'out' || v === 'a') hint = 'Can you think of a number that goes there? ' + (v === 'out' ? 'Try 7.' : 'Try ' + (a === 5 ? 15 : 4) + '.');
              else hint = 'Look at your numbers: there are some in the middle. Find the part with nothing in it.';
              if (api.tries() >= 1) hint = 'Every number ending in 0 is also a multiple of ' + a + '. So can a number be a multiple of ' + b + ' but NOT of ' + a + '?';
              api.check(false, hint, TAG.empty);
            } else {
              hint = 'Read the last digit of each number in the middle. ' + (api.tries() >= 1 ? 'Multiples of 2 AND 5 end in 0.' : '');
              api.check(false, hint, TAG.middle);
            }
          }
        }, { columns: f.options.length > 3 ? 2 : 3 })
      );
      ch.classList.add('mh-fchoices');
      if (f.options.length > 3) ch.classList.add('mh-four');
      follow.appendChild(ch);
    }
    function emptyWhy() {
      return 'Yes! Every multiple of ' + b + ' is also a multiple of ' + a + ', so "' + b + ' only" is always empty.';
    }

    api.onReveal(function () {
      eng.unlock();
      q.nums.forEach(function (n) {
        eng.place(n, q.region[n]);
      });
      eng.lock();
      q.nums.forEach(function (n) {
        eng.mark(n, 'mh-good');
      });
      check.disabled = true;
      row.style.display = 'none';
      if (q.follow.kind === 'empty') {
        eng.note(565, 205, 'Always', 'mh-vnote-empty');
        eng.note(565, 232, 'empty!', 'mh-vnote-empty');
      }
      if (step === 1) showFollow();
      ch.disable();
      ch.mark(q.follow.answer, 'good');
      var lines = [
        el('div', null, el('b', null, 'Middle: '), 'ends in ' + orList(endings(lcm(a, b))) + ' → a multiple of ' + a + ' and of ' + b + '.'),
        el('div', null, el('b', null, a + ' only: '), ruleText(a).replace('.', '') + ', but not a multiple of ' + b + '.'),
        el('div', null, el('b', null, 'Outside: '), 'not a multiple of ' + a + ' or ' + b + '.'),
      ];
      if (q.follow.kind === 'empty') lines.push(el('div', null, el('b', null, b + ' only: '), 'empty, because every multiple of ' + b + ' is also a multiple of ' + a + '.'));
      else lines.splice(2, 0, el('div', null, el('b', null, b + ' only: '), 'ends in 5 → a multiple of 5, but odd.'));
      follow.appendChild(el('div', { class: 'mh-why mh-why2' }, lines));
      api.feedback(q.follow.kind === 'empty' ? 'Every multiple of ' + b + ' is also a multiple of ' + a + ', so "' + b + ' only" is always empty.' : 'The numbers in the middle end in 0: they are multiples of 10.', 'info');
    });
  }

  /* ---------------------------------------------------------------- *
   * Practice: frog hops on a number grid
   * ---------------------------------------------------------------- */
  function renderGrid(stage, api, q) {
    stage.classList.add('mh-stage');
    var k = q.k;
    var cell = 42;
    var pad = 8;
    var rows = Math.ceil((q.to - q.top + 1) / 10);
    var left = q.start === 0 ? cell + 6 : 0; // room for the "0" lily pad
    var W = left + 10 * cell + pad * 2;
    var H = rows * cell + pad * 2 + 10;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'mh-svg mh-grid', width: W, height: H });
    function pos(n) {
      if (n === 0) return { x: pad + left / 2 - 3, y: pad + 10 + cell / 2, cx: pad, cy: pad + 10 };
      var i = n - q.top;
      var c = i % 10;
      var r = Math.floor(i / 10);
      var x = pad + left + c * cell;
      var y = pad + 10 + r * cell;
      return { x: x + cell / 2, y: y + cell / 2, cx: x, cy: y };
    }
    var cells = {};
    var cellLayer = S('g');
    var cntLayer = S('g', { class: 'mh-cnts' });
    var arcLayer = S('g', { class: 'mh-cnts' });
    root.appendChild(cellLayer);
    root.appendChild(arcLayer);
    root.appendChild(cntLayer);
    if (q.start === 0) {
      var p0 = pos(0);
      root.insertBefore(S('g', { class: 'mh-pad0' }, S('ellipse', { cx: p0.x, cy: p0.y, rx: 20, ry: 15, class: 'mh-lily' }), S('text', { x: p0.x, y: p0.y + 27, 'text-anchor': 'middle', class: 'mh-cnum' }, '0')), cellLayer);
    }
    U.range(q.top, q.to).forEach(function (n) {
      var p = pos(n);
      var pre = n < q.from;
      var g = S('g', { class: 'mh-cell' + (pre ? ' mh-pre' : ''), 'data-n': String(n) }, S('rect', { x: p.cx, y: p.cy, width: cell, height: cell, class: 'mh-crect' }), S('text', { x: p.x, y: p.cy + 30, 'text-anchor': 'middle', class: 'mh-cnum' }, String(n)));
      g.addEventListener('click', function () {
        tap(n);
      });
      cells[n] = g;
      cellLayer.appendChild(g);
    });
    var frog = frogShape();
    root.appendChild(frog);
    function putFrog(n) {
      var p = pos(n);
      frog.style.transform = 'translate(' + p.x + 'px,' + (p.cy + 10) + 'px) scale(.72)';
      if (n === 0) frog.style.transform = 'translate(' + p.x + 'px,' + (p.y - 2) + 'px) scale(.8)';
    }
    if (q.start >= q.top) cells[q.start].classList.add('mh-startcell');
    putFrog(q.start);

    var intro;
    if (k === 9) intro = 'The frog starts at 0 and hops 9 squares each time. Tap where it lands.';
    else if (k === 8) intro = 'The frog is on 64 (8 × 8 = 64). It hops 8 squares each time. Tap where it lands.';
    else intro = 'The frog is on 68, a multiple of 4. It hops 4 squares each time. Tap where it lands.';
    stage.appendChild(MQ.ui.prompt('Colour the <b>multiples of ' + k + '</b>' + (k === 9 ? ' on the 100 square.' : ' from 71 to 120.')));
    stage.appendChild(el('p', { class: 'mh-help mh-help-big' }, intro));
    api.say('Count ' + k + ' squares on each time. I will help with the first hops.', 'happy');

    var side = el('div', { class: 'mh-side' });
    var now = el('div', { class: 'mh-now' });
    var chips = el('div', { class: 'mh-chips' });
    var step2 = el('div', { class: 'mh-step2' });
    side.appendChild(el('div', { class: 'mh-sidelab' }, 'Running count'));
    side.appendChild(now);
    side.appendChild(chips);
    side.appendChild(step2);
    stage.appendChild(el('div', { class: 'mh-gridwrap' }, el('div', { class: 'mh-gridpic' }, root), side));

    var cur = q.start;
    var landed = [];
    var locked = false;
    var phase = 1;
    now.innerHTML = 'Frog on <b>' + cur + '</b>';
    showCount(cur);

    function showCount(from) {
      MQ.clear(cntLayer);
      for (var j = 1; j <= k; j++) {
        var n = from + j;
        if (n > q.to) break;
        var p = pos(n);
        cntLayer.appendChild(S('circle', { cx: p.cx + 10, cy: p.cy + 10, r: 8, class: 'mh-cntdot' + (j === k ? ' mh-cntlast' : '') }));
        cntLayer.appendChild(S('text', { x: p.cx + 10, y: p.cy + 14, 'text-anchor': 'middle', class: 'mh-cnt' }, String(j)));
      }
    }
    // The hop just made: the squares it passed over, numbered 1, 2, 3 ... k.
    function trail(from, to) {
      MQ.clear(arcLayer);
      for (var j = 1; from + j <= to; j++) {
        var p = pos(from + j);
        arcLayer.appendChild(S('circle', { cx: p.cx + 10, cy: p.cy + 10, r: 8, class: 'mh-traildot' }));
        arcLayer.appendChild(S('text', { x: p.cx + 10, y: p.cy + 14, 'text-anchor': 'middle', class: 'mh-cnt' }, String(j)));
      }
    }
    function land(n) {
      trail(cur, n);
      cells[n].classList.add('mh-landed');
      var prev = cur;
      cur = n;
      landed.push(n);
      putFrog(n);
      MQ.clear(cntLayer);
      now.innerHTML = prev + ' + ' + k + ' = <b>' + n + '</b>';
      chips.appendChild(el('span', { class: 'chip mh-hopchip' }, String(n)));
      api.sound('pop');
      if (landed.length < 2 && cur + k <= q.to) showCount(cur);
      if (cur + k > q.to) {
        phase = 2;
        now.innerHTML = 'Next hop: ' + cur + ' + ' + k + ' = ' + (cur + k) + ', off the grid!';
        showStatements();
      }
    }
    function tap(n) {
      if (locked || phase !== 1) return;
      var next = cur + k;
      if (n === next) {
        land(n);
        return;
      }
      if (n <= cur || n < q.from) {
        api.feedback('The frog is on ' + cur + '. It hops forward ' + k + ' squares.', 'info');
        return;
      }
      if (isMult(n, k) && n > next) {
        api.check(false, 'The frog lands on ' + next + ' first. Do not skip it! Count ' + k + ' squares on from ' + cur + '.', TAG.skipped);
        showCount(cur);
        return;
      }
      var gapN = n - cur;
      var hint = 'That is ' + gapN + ' squares on from ' + cur + '. The frog hops ' + k + '. ';
      if (cur < 100 && n === 100 && next > 100) hint += 'Keep counting past 100! ';
      hint += api.tries() >= 1 ? 'Count the numbered dots: ' + cur + ' + ' + k + ' = ' + next + '.' : 'Count ' + k + ' squares on from ' + cur + '.';
      api.check(false, hint, TAG.hop);
      showCount(cur);
    }

    var stmtBtns = {};
    var check2 = null;
    var revealing = false;
    function showStatements() {
      MQ.clear(step2);
      if (!revealing) {
        api.say('All coloured! Now, which sentences are true?', 'think');
        api.feedback('Every multiple of ' + k + ' is coloured. Now tick the true sentences.', 'info');
      }
      step2.appendChild(el('div', { class: 'mh-sidelab' }, 'Tick every true sentence'));
      var box = el('div', { class: 'mh-stmts' });
      q.stmts.forEach(function (s) {
        var b = el('button', { class: 'mh-stmt', type: 'button', 'data-value': s.value }, el('span', { class: 'mh-tick' }, ''), el('span', null, s.label));
        b.addEventListener('click', function () {
          if (locked) return;
          b.classList.toggle('mh-on');
          b.classList.remove('mh-bad');
          api.sound('click');
        });
        stmtBtns[s.value] = b;
        box.appendChild(b);
      });
      step2.appendChild(box);
      check2 = btn('Check ✔', 'mh-check', checkStatements);
      step2.appendChild(el('div', { class: 'mh-btnrow' }, check2));
    }
    function checkStatements() {
      if (locked) return;
      var on = q.stmts.filter(function (s) {
        return stmtBtns[s.value].classList.contains('mh-on');
      });
      if (!on.length) {
        api.feedback('Tick the sentences that are true, then press Check.', 'info');
        return;
      }
      var wrongOn = on.filter(function (s) {
        return !s.truth;
      });
      var missed = q.stmts.filter(function (s) {
        return s.truth && on.indexOf(s) === -1;
      });
      if (!wrongOn.length && !missed.length) {
        locked = true;
        check2.disabled = true;
        q.stmts.forEach(function (s) {
          stmtBtns[s.value].disabled = true;
        });
        on.forEach(function (s) {
          stmtBtns[s.value].classList.add('mh-good');
        });
        api.check(true, 'Yes! ' + q.stmts.filter(function (s) { return s.truth; }).map(function (s) { return s.label; }).join('. ') + '.');
        return;
      }
      var lastDigits = landed.map(ones);
      var hint;
      if (wrongOn.length) {
        var s = wrongOn[0];
        stmtBtns[s.value].classList.add('mh-bad');
        if (s.value === 'odd') hint = 'Look at the last digits: ' + lastDigits.join(', ') + '. Are they all odd?';
        else if (s.value === 'even') {
          var od = landed.filter(function (n) { return !isEven(n); })[0];
          hint = od + ' ends in ' + ones(od) + '. Is that even?';
        } else if (s.value === 'mixed') hint = 'Look at the last digits: ' + lastDigits.join(', ') + '. Is any of them odd?';
        else {
          var bad = landed.filter(function (n) { var c = digitChain(n); return c[c.length - 1] !== 9; })[0];
          hint = 'Try ' + bad + ': ' + String(bad).split('').join(' + ') + ' = ' + digitSum(bad) + '. Is that 9?';
        }
      } else {
        hint = 'Good! There is one more true sentence. Read each one again.';
        if (api.tries() >= 1) hint = 'Look again at: "' + missed[0].label + '".';
      }
      api.check(false, hint, TAG.describe);
    }

    api.onReveal(function () {
      locked = true;
      revealing = true;
      var rest = q.targets.filter(function (n) {
        return landed.indexOf(n) === -1;
      });
      var i = 0;
      function more() {
        if (i < rest.length) {
          land(rest[i]);
          locked = true;
          i++;
              api.later(more, 260);
        } else {
          MQ.clear(cntLayer);
          api.feedback('The frog lands on every multiple of ' + k + ': ' + landed.join(', ') + '.', 'info');
          if (!check2) showStatements();
          check2.disabled = true;
          q.stmts.forEach(function (s) {
            var b = stmtBtns[s.value];
            b.disabled = true;
            b.classList.remove('mh-bad', 'mh-on');
            if (s.truth) b.classList.add('mh-on', 'mh-good');
            else b.classList.add('mh-dim');
          });
          MQ.clear(chips);
          chips.classList.add('mh-sums');
          landed.forEach(function (n) {
            var c = digitChain(n);
            chips.appendChild(el('span', { class: 'mh-sum ' + (isEven(n) ? 'mh-even' : 'mh-odd') }, c.join(' → ')));
          });
          chips.parentNode.insertBefore(el('div', { class: 'mh-sidelab' }, 'Add the digits · even in blue, odd in orange'), chips);
        }
      }
      phase = 2;
      more();
    });
  }

  /* ---------------------------------------------------------------- *
   * Practice: riddle
   * ---------------------------------------------------------------- */
  function renderRiddle(stage, api, q) {
    stage.classList.add('mh-stage');
    api.say('A number riddle! Read the clues, then tap the number.', 'happy');
    stage.appendChild(MQ.ui.prompt('Who am I? Tap the number.'));
    var c1 = el('div', { class: 'mh-clue', 'data-clue': 'parity' }, el('div', { class: 'mh-clue-n' }, '1'), el('div', null, 'I am ', el('b', null, q.parity), '.'));
    var c2 = el(
      'div',
      { class: 'mh-clue mh-clue-wide', 'data-clue': 'between' },
      el('div', { class: 'mh-clue-n' }, '2'),
      el('div', null, 'I am ', el('b', null, 'between ' + q.L + ' and ' + q.U), '.'),
      el(
        'div',
        { class: 'mh-signs' },
        el('span', { class: 'mh-sign' }, el('span', { class: 'mh-signbig' }, '> ' + q.L), el('span', { class: 'mh-signsmall' }, 'more than ' + q.L)),
        el('span', { class: 'mh-sign' }, el('span', { class: 'mh-signbig' }, '< ' + q.U), el('span', { class: 'mh-signsmall' }, 'less than ' + q.U))
      )
    );
    var c3 = el('div', { class: 'mh-clue', 'data-clue': 'mult' }, el('div', { class: 'mh-clue-n' }, '3'), el('div', null, 'I am a ', el('b', null, 'multiple of ' + q.k), '.'));
    stage.appendChild(el('div', { class: 'mh-clues' }, c1, c2, c3));
    var strip = el('div', { class: 'mh-strip' });
    var tiles = {};
    var locked = false;
    q.strip.forEach(function (n) {
      var b = el('button', { class: 'mh-stile', type: 'button', 'data-value': String(n) }, String(n));
      b.addEventListener('click', function () {
        pick(n);
      });
      tiles[n] = b;
      strip.appendChild(b);
    });
    stage.appendChild(strip);
    var work = el('div', { class: 'mh-work' });
    stage.appendChild(work);

    function fails(n) {
      if ((q.parity === 'odd') === isEven(n)) return 'parity';
      if (!(n > q.L && n < q.U)) return 'between';
      if (!isMult(n, q.k)) return 'mult';
      return null;
    }
    function pick(n) {
      if (locked) return;
      if (tiles[n].classList.contains('mh-cross')) {
        api.feedback(n + ' is already crossed out. Try another number.', 'info');
        return;
      }
      var f = fails(n);
      if (!f) {
        locked = true;
        q.strip.forEach(function (m) {
          tiles[m].disabled = true;
        });
        tiles[n].classList.add('mh-good');
        api.check(true, 'Yes! ' + n + ' is ' + q.parity + ', between ' + q.L + ' and ' + q.U + ', and ends in ' + ones(n) + ' so it is a multiple of ' + q.k + '.');
        return;
      }
      tiles[n].classList.add('mh-cross');
      var hint;
      var tag;
      if (f === 'between') {
        if (n === q.L || n === q.U) hint = '"Between ' + q.L + ' and ' + q.U + '" does not include ' + n + ' itself. Look at clue 2: > ' + q.L + ' and < ' + q.U + '.';
        else hint = n + ' is ' + (n < q.L ? 'less than ' + q.L : 'more than ' + q.U) + '. Clue 2 says more than ' + q.L + ' and less than ' + q.U + '.';
        tag = TAG.between;
      } else if (f === 'parity') {
        hint = n + ' ends in ' + ones(n) + ', so it is ' + parityWord(n) + '. Clue 1 says ' + q.parity + '.';
        tag = TAG.parity;
      } else {
        hint = n + ' ends in ' + ones(n) + '. ' + ruleText(q.k) + ' Check clue 3.';
        tag = q.k === 10 && ones(n) === 5 ? TAG.fiveTen : TAG.notMult;
      }
      if (api.tries() >= 1) hint += ' Use one clue at a time to cross numbers out.';
      api.check(false, hint, tag);
    }

    api.onReveal(function () {
      locked = true;
      var groups = { between: [], parity: [], mult: [] };
      q.strip.forEach(function (n) {
        var f = fails(n);
        var t = tiles[n];
        t.disabled = true;
        if (f) {
          groups[f].push(n);
          t.classList.add('mh-cross', 'mh-x-' + f);
        } else t.classList.add('mh-good');
      });
      MQ.clear(work);
      work.appendChild(
        el(
          'div',
          { class: 'mh-why' },
          el('div', null, el('b', null, 'Clue 1 crosses out: '), (groups.parity.join(', ') || 'none') + ' (not ' + q.parity + ')'),
          el('div', null, el('b', null, 'Clue 2 crosses out: '), (groups.between.join(', ') || 'none') + ' (not between ' + q.L + ' and ' + q.U + ')'),
          el('div', null, el('b', null, 'Clue 3 crosses out: '), (groups.mult.join(', ') || 'none') + ' (not a multiple of ' + q.k + ')'),
          el('div', null, el('b', null, 'Left: ' + q.answer))
        )
      );
      api.feedback('Use the clues one at a time. Only ' + q.answer + ' is left.', 'info');
    });
  }

  /* ---------------------------------------------------------------- *
   * Practice: the nth multiple as hops on a number line
   * ---------------------------------------------------------------- */
  function renderNth(stage, api, q) {
    stage.classList.add('mh-stage');
    var k = q.k;
    var n = q.n;
    api.say('The ' + ordinal(n) + ' multiple of ' + k + ' means ' + k + ' × ' + n + ': ' + n + ' hops of ' + k + '.', 'think');
    stage.appendChild(MQ.ui.prompt('What is the <b>' + ordinal(n) + ' multiple of ' + k + '</b>?'));
    stage.appendChild(el('p', { class: 'mh-help mh-help-big' }, 'Read it as ', el('b', null, k + ' × ' + n), ': the frog makes ', el('b', null, n + ' hops of ' + k), ', starting at 0.'));
    var max = k * 10;
    var W = 800;
    var x0 = 30;
    var x1 = 770;
    var ly = 118;
    var sc = (x1 - x0) / max;
    var root = S('svg', { viewBox: '0 0 ' + W + ' 160', class: 'mh-svg mh-line', width: W, height: 160 });
    root.appendChild(S('line', { x1: x0 - 10, y1: ly, x2: x1 + 10, y2: ly, class: 'mh-axis' }));
    var decLabels = {};
    for (var v = 0; v <= max; v++) {
      var x = x0 + v * sc;
      var big = v % 10 === 0;
      root.appendChild(S('line', { x1: x, y1: ly - (big ? 9 : 5), x2: x, y2: ly + (big ? 9 : 5), class: big ? 'mh-tick' : 'mh-minor' }));
      if (v === 0 || v === max) {
        decLabels[v] = S('text', { x: x, y: ly + 30, 'text-anchor': 'middle', class: 'mh-dec' }, String(v));
        root.appendChild(decLabels[v]);
      }
    }
    var arcs = S('g');
    root.appendChild(arcs);
    var frog = frogShape();
    root.appendChild(frog);
    function putFrog(val) {
      frog.style.transform = 'translate(' + (x0 + val * sc) + 'px,' + (ly - 14) + 'px)';
    }
    putFrog(0);
    stage.appendChild(el('div', { class: 'mh-pic' }, root));

    var hops = 0;
    var hopEls = [];
    var locked = false;
    var count = el('div', { class: 'mh-hopcount' });
    var sumLine = el('div', { class: 'mh-sumline' });
    function draw() {
      count.innerHTML = 'Hops: <b>' + hops + '</b>';
      sumLine.textContent = hops ? U.range(1, hops).map(function () { return k; }).join(' + ') + ' = ' + hops * k : ' ';
      putFrog(hops * k);
      Object.keys(decLabels).forEach(function (d) {
        var hit = false;
        for (var h = 1; h <= hops; h++) if (h * k === +d) hit = true;
        decLabels[d].style.display = hit ? 'none' : '';
      });
    }
    function hop() {
      if (locked) return;
      if (hops >= 10) {
        api.feedback('That is the end of the line. Press Undo to go back.', 'info');
        return;
      }
      hops++;
      var a = (hops - 1) * k;
      var b = hops * k;
      var xa = x0 + a * sc;
      var xb = x0 + b * sc;
      var g = S(
        'g',
        { class: 'mh-nhop' },
        S('path', { d: 'M' + xa + ' ' + (ly - 4) + ' Q' + (xa + xb) / 2 + ' ' + (ly - 70) + ' ' + xb + ' ' + (ly - 4), class: 'mh-hoparc' }),
        S('circle', { cx: (xa + xb) / 2, cy: ly - 44, r: 11, class: 'mh-hopnum-bg' }),
        S('text', { x: (xa + xb) / 2, y: ly - 39, 'text-anchor': 'middle', class: 'mh-hopnum' }, String(hops)),
        S('text', { x: xb, y: ly + 30, 'text-anchor': 'middle', class: 'mh-land' }, String(b))
      );
      arcs.appendChild(g);
      hopEls.push(g);
      api.sound('pop');
      draw();
    }
    function undo() {
      if (locked || !hops) return;
      hops--;
      var g = hopEls.pop();
      arcs.removeChild(g);
      draw();
    }
    var hopBtn = btn('Hop + ' + k + ' 🐸', 'mh-hop', hop);
    var undoBtn = btn('Undo', 'btn-ghost mh-undo', undo);
    stage.appendChild(el('div', { class: 'mh-btnrow' }, hopBtn, undoBtn, count));
    stage.appendChild(sumLine);
    var input = MQ.ui.numberInput({
      prefix: 'The ' + ordinal(n) + ' multiple of ' + k + ' is',
      onSubmit: function (val) {
        if (locked) return;
        if (val === q.answer) {
          finish();
          input.good();
          api.check(true, 'Yes! ' + n + ' hops of ' + k + ': ' + k + ' × ' + n + ' = ' + q.answer + '.');
          return;
        }
        input.bad();
        var hint;
        var tag = TAG.nth;
        if (val === k * (n - 1)) hint = val + ' is only ' + (n - 1) + ' hops. The ' + ordinal(n) + ' multiple needs ' + n + ' hops.';
        else if (val === k * (n + 1)) hint = val + ' is ' + (n + 1) + ' hops: one too many. Count ' + n + ' hops.';
        else if (val === k + n) {
          hint = 'That is ' + k + ' + ' + n + '. The ' + ordinal(n) + ' multiple means ' + n + ' hops of ' + k + ', not ' + k + ' + ' + n + '.';
          tag = TAG.nthAdd;
        } else if (val === n) hint = n + ' is the number of hops. Where does the frog land after ' + n + ' hops?';
        else if (hops !== n) hint = 'Press Hop until the frog has made ' + n + ' hops, then read where it lands.';
        else hint = 'Read the number under the frog after hop ' + n + '.';
        if (api.tries() >= 1) hint += ' Count in ' + k + 's: ' + U.range(1, Math.min(3, n)).map(function (h) { return h * k; }).join(', ') + ', …';
        api.check(false, hint, tag);
      },
    });
    input.el.classList.add('mh-ans');
    stage.appendChild(input.el);
    var work = el('div', { class: 'mh-work' });
    stage.appendChild(work);
    draw();

    function finish() {
      locked = true;
      input.disable();
      hopBtn.disabled = true;
      undoBtn.disabled = true;
    }

    api.onReveal(function () {
      finish();
      locked = false;
      while (hops > 0) undo();
      locked = true;
      var i = 0;
      function more() {
        locked = false;
        hop();
        locked = true;
        i++;
        if (i < n) api.later(more, 300);
        else {
          input.setValue(String(q.answer));
          input.good();
          MQ.clear(work);
          work.appendChild(el('div', { class: 'mh-fact' }, 'The ' + ordinal(n) + ' multiple of ' + k + ' = ' + k + ' × ' + n + ' = ' + q.answer));
          api.feedback(n + ' hops of ' + k + ' land on ' + q.answer + '.', 'info');
        }
      }
      more();
    });
  }

  /* ---------------------------------------------------------------- *
   * Register
   * ---------------------------------------------------------------- */
  MQ.register(ID, {
    learn: [learnDoors, learnCover, learnVenn],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'tap') renderTap(stage, api, q);
        else if (q.type === 'venn') renderVenn(stage, api, q);
        else if (q.type === 'grid') renderGrid(stage, api, q);
        else if (q.type === 'riddle') renderRiddle(stage, api, q);
        else renderNth(stage, api, q);
      },
    },
  });

  MQ._test = MQ._test || {};
  MQ._test[ID] = {
    buildDeck: buildDeck,
    deck: function () {
      return deck;
    },
    geometry: { VW: VW, VH: VH, SLOTS: SLOTS, TRAY: TRAY },
  };

  var css = [
    '.mh-stage{gap:10px}',
    '.mh-pic{width:100%;display:flex;justify-content:center}',
    '.mh-svg{display:block;max-width:100%;height:auto;user-select:none;-webkit-user-select:none}',
    '.mh-help{margin:-6px 0 0;color:var(--ink-soft);font-weight:700;text-align:center}',
    '.mh-help-big{font-size:1.1rem;color:var(--ink)}',
    '.mh-btnrow{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;align-items:center}',
    '.mh-check{background:var(--accent)}',
    '.mh-work{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.mh-work:empty{display:none}',
    '.mh-ask{font-size:1.3rem;font-weight:800;text-align:center}',
    '.mh-ask b{color:#0b6e66}',
    '.mh-hold{width:100%;display:flex;justify-content:center}',
    /* doors */
    '.mh-door-body{fill:#e9eef8;stroke:#9fb3d9;stroke-width:2;transition:fill .2s}',
    '.mh-door-panel{fill:none;stroke:#c9d4ea;stroke-width:2}',
    '.mh-knob{fill:#9fb3d9}',
    '.mh-step{fill:#c9d4ea}',
    '.mh-plate{fill:#fff;stroke:#c9d4ea;stroke-width:1.5}',
    '.mh-door-num{font-size:18px;font-weight:800;fill:#1b2a4a}',
    '.mh-lit-2 .mh-door-body{fill:#bde0fe}',
    '.mh-lit-5 .mh-door-body{fill:#ffd6a5}',
    '.mh-lit-10 .mh-door-body{fill:#caffbf}',
    '.mh-lit .mh-door-body{stroke:#1b2a4a}',
    '.mh-lit .mh-door-one{fill:#d62828;font-size:21px}',
    '.mh-run{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;min-height:36px;max-width:760px}',
    '.mh-runchip{padding:3px 9px;font-weight:800;font-size:1.05rem}',
    '.mh-count{background:#3a86ff}',
    '.mh-count-5{background:#f4a261;color:#2b1d00}',
    '.mh-count-10{background:#2a9d8f}',
    '.mh-count.mh-done::after{content:" ✓"}',
    '.mh-rulebox{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;padding:8px 14px;border-radius:14px;background:var(--info-bg);font-weight:800}',
    '.mh-rulebox:empty{display:none}',
    '.mh-rule-lab{font-size:1.1rem}',
    '.mh-rule-text{flex-basis:100%;text-align:center;font-size:1.1rem}',
    '.mh-digit{display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;border-radius:10px;font-size:1.5rem;color:#d62828;background:#fff;border:2px solid #d62828}',
    /* cover cards */
    '.mh-cards{display:flex;gap:30px;flex-wrap:wrap;justify-content:center}',
    '.mh-bigcard{display:flex;align-items:center;padding:10px 24px;border-radius:18px;background:#fff;border:3px solid var(--line);font-size:4.2rem;font-weight:800;line-height:1.1;transition:border-color .2s,box-shadow .2s}',
    '.mh-bigcard.mh-current{border-color:var(--accent);box-shadow:0 0 0 4px rgba(255,159,28,.25)}',
    '.mh-cardlead{position:relative;color:var(--ink)}',
    '.mh-cover{position:absolute;inset:-4px -2px;display:flex;align-items:center;justify-content:center;background:#ffe066;border:2px solid #e0b100;border-radius:8px;transform:rotate(-3deg);font-size:2rem;color:#9a6b00;transition:opacity .4s,transform .4s}',
    '.mh-open .mh-cover{opacity:0;transform:translateY(-30px) rotate(-12deg)}',
    '.mh-cardone{color:#d62828;text-decoration:underline;text-decoration-thickness:5px;text-underline-offset:6px}',
    '.mh-yesno{max-width:320px}',
    /* venn */
    '.mh-venn{width:600px;max-width:100%;touch-action:none}',
    '.mh-vbox{fill:#fbfcff;stroke:#9fb3d9;stroke-width:2.5}',
    '.mh-ca{fill:rgba(58,134,255,.13)}',
    '.mh-cb{fill:rgba(244,162,97,.18)}',
    '.mh-cline{fill:none;stroke:#4a5a7d;stroke-width:2.5}',
    '.mh-vlab{font-size:22px;font-weight:800}',
    '.mh-vlab-a{fill:#1d5fc4}',
    '.mh-vlab-b{fill:#b35c12}',
    '.mh-vout{font-size:18px;font-weight:800;fill:#7a88a8}',
    '.mh-tray{fill:#f1f5fb;stroke:#c9d4ea;stroke-width:2;stroke-dasharray:6 5}',
    '.mh-vtile{cursor:grab;transition:transform .3s ease}',
    '.mh-vtile.dragging{transition:none;cursor:grabbing}',
    '.mh-vtile rect{fill:#fff;stroke:#1b2a4a;stroke-width:2.5}',
    '.mh-vtile text{font-size:21px;font-weight:800;fill:#1b2a4a;pointer-events:none}',
    '.mh-vtile.mh-sel rect{stroke:#8338ec;stroke-width:4;fill:#f3ebff}',
    '.mh-vtile.mh-bad rect{stroke:var(--try);stroke-width:4;fill:var(--try-bg)}',
    '.mh-vtile.mh-good rect{stroke:var(--good);fill:var(--good-bg)}',
    '.mh-locked .mh-vtile{cursor:default}',
    '.mh-vnote{font-size:22px;font-weight:800;fill:#8338ec}',
    '.mh-vnote-mid{font-size:17px;fill:#0b6e66}',
    '.mh-follow{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.mh-follow:empty{display:none}',
    '.mh-fchoices{max-width:620px}',
    '.mh-fchoices .choice{font-size:1rem;min-height:46px;padding:6px 10px}',
    '@media (min-width:900px){.mh-fchoices.mh-four{grid-template-columns:repeat(4,minmax(0,1fr))!important;max-width:800px}}',
    '.mh-why.mh-why2{display:grid;grid-template-columns:1fr 1fr;gap:3px 18px;font-size:.98rem;max-width:800px}',
    '@media (max-width:700px){.mh-why2{grid-template-columns:1fr}}',
    '.mh-why{background:var(--info-bg);border-radius:14px;padding:8px 14px;font-size:1.05rem;display:flex;flex-direction:column;gap:3px;max-width:720px}',
    '.mh-try{max-width:480px}',
    /* tap cloud */
    '.mh-cloud{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;max-width:760px;padding:16px;border-radius:40px;background:#f1f5fb}',
    '.mh-tile{min-width:92px;padding:10px 14px;border-radius:999px;border:3px solid var(--line);background:#fff;font:inherit;font-size:1.7rem;font-weight:800;color:var(--ink);cursor:pointer;transition:transform .08s}',
    '.mh-tile:hover{transform:translateY(-2px);border-color:var(--accent)}',
    '.mh-tile.mh-on{background:#fff3cd;border-color:#ffb703;box-shadow:0 0 0 3px rgba(255,183,3,.35)}',
    '.mh-tile.mh-bad{border-color:var(--try);background:var(--try-bg)}',
    '.mh-tile.mh-good{border-color:var(--good);background:var(--good-bg)}',
    '.mh-tile.mh-dim{opacity:.45}',
    '.mh-showones .mh-one{color:#d62828;text-decoration:underline;text-decoration-thickness:3px;text-underline-offset:4px}',
    '.mh-locked .mh-tile{cursor:default}',
    /* grid */
    '.mh-gridwrap{display:flex;gap:18px;justify-content:center;align-items:flex-start;flex-wrap:wrap;width:100%}',
    '.mh-gridpic{flex:0 1 450px;min-width:0}',
    '.mh-grid{width:450px;max-width:100%;height:auto}',
    '.mh-crect{fill:#fff;stroke:#c9d4ea;stroke-width:1.5}',
    '.mh-cell{cursor:pointer}',
    '.mh-cell:hover .mh-crect{fill:#f3f7ff}',
    '.mh-cnum{font-size:15px;font-weight:800;fill:#1b2a4a;pointer-events:none}',
    '.mh-pre .mh-crect{fill:#f1f3f8}',
    '.mh-pre .mh-cnum{fill:#9aa6c2}',
    '.mh-pre{cursor:default}',
    '.mh-startcell .mh-crect{fill:#e3f4d7}',
    '.mh-landed .mh-crect,.mh-landed:hover .mh-crect{fill:#ffd166;stroke:#d99a00}',
    '.mh-lily{fill:#b7e4a6;stroke:#55a630;stroke-width:2}',
    '.mh-cntdot{fill:#8338ec;opacity:.85}',
    '.mh-traildot{fill:#2b9348;opacity:.8}',
    '.mh-cntlast{fill:#d62828}',
    '.mh-cnt{font-size:11px;font-weight:800;fill:#fff;pointer-events:none}',
    '.mh-cnts{pointer-events:none}',
    '.mh-hoparc{fill:none;stroke:#2b9348;stroke-width:3;stroke-linecap:round;stroke-dasharray:5 4}',
    '.mh-frog{pointer-events:none;transition:transform .3s ease}',
    '.mh-side{flex:1 1 280px;min-width:0;max-width:390px;display:flex;flex-direction:column;gap:8px}',
    '.mh-sidelab{font-size:.85rem;font-weight:800;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.3px}',
    '.mh-now{font-size:1.25rem;font-weight:800;padding:6px 12px;border-radius:12px;background:var(--info-bg)}',
    '.mh-chips{display:flex;flex-wrap:wrap;gap:5px}',
    '.mh-hopchip{padding:3px 9px;font-weight:800;background:#fff3cd;border-color:#ffb703}',
    '.mh-step2{display:flex;flex-direction:column;gap:6px}',
    '.mh-step2:empty{display:none}',
    '.mh-stmts{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
    '.mh-stmt{display:flex;align-items:center;gap:8px;text-align:left;padding:6px 8px;border-radius:12px;border:3px solid var(--line);background:#fff;font:inherit;font-size:.98rem;font-weight:800;color:var(--ink);cursor:pointer;line-height:1.2}',
    '.mh-tick{flex:0 0 24px;height:24px;border-radius:7px;border:2.5px solid #9fb3d9;display:inline-flex;align-items:center;justify-content:center;color:#fff}',
    '.mh-stmt.mh-on .mh-tick{background:#2a9d8f;border-color:#2a9d8f}',
    '.mh-stmt.mh-on .mh-tick::after{content:"✓";font-size:18px}',
    '.mh-stmt.mh-on{border-color:#2a9d8f}',
    '.mh-stmt.mh-bad{border-color:var(--try);background:var(--try-bg)}',
    '.mh-stmt.mh-good{border-color:var(--good);background:var(--good-bg)}',
    '.mh-stmt.mh-dim{opacity:.5;text-decoration:line-through}',
    '.mh-sums{display:flex;flex-wrap:wrap;gap:5px}',
    '.mh-sum{padding:2px 7px;border-radius:8px;font-weight:800;font-size:.9rem}',
    '.mh-even{background:#dbeafe;color:#1d4ed8}',
    '.mh-odd{background:#ffedd5;color:#c2410c}',
    /* riddle */
    '.mh-clues{display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap;justify-content:center;width:100%}',
    '.mh-clue{position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px 12px 8px 38px;border-radius:16px;background:#fff;border:3px solid var(--line);font-size:1.15rem;font-weight:700}',
    '.mh-clue b{color:#0b6e66}',
    '.mh-clue-n{position:absolute;left:10px;top:10px;width:24px;height:24px;border-radius:50%;background:var(--accent);color:#fff;font-size:.95rem;font-weight:800;display:flex;align-items:center;justify-content:center}',
    '.mh-signs{display:flex;gap:10px}',
    '.mh-sign{display:flex;flex-direction:column;align-items:center;padding:4px 10px;border-radius:10px;background:var(--info-bg)}',
    '.mh-signbig{font-size:1.3rem;font-weight:800}',
    '.mh-signsmall{font-size:.85rem;font-weight:700;color:var(--ink-soft)}',
    '.mh-strip{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:820px}',
    '.mh-stile{min-width:58px;padding:10px 6px;border-radius:12px;border:3px solid var(--line);background:#fff;font:inherit;font-size:1.3rem;font-weight:800;color:var(--ink);cursor:pointer}',
    '.mh-stile:hover{border-color:var(--accent)}',
    '.mh-stile.mh-cross{opacity:.45;text-decoration:line-through;text-decoration-thickness:3px;background:#f1f3f8}',
    '.mh-stile.mh-x-between{text-decoration-color:#8338ec}',
    '.mh-stile.mh-x-parity{text-decoration-color:#d62828}',
    '.mh-stile.mh-x-mult{text-decoration-color:#f77f00}',
    '.mh-stile.mh-good{border-color:var(--good);background:var(--good-bg);color:var(--good);opacity:1}',
    /* nth */
    '.mh-line{max-height:170px}',
    '.mh-axis{stroke:#1b2a4a;stroke-width:3}',
    '.mh-tick{stroke:#1b2a4a;stroke-width:2.5}',
    '.mh-minor{stroke:#9fb3d9;stroke-width:1.5}',
    '.mh-dec{font-size:16px;font-weight:700;fill:#7a88a8}',
    '.mh-land{font-size:19px;font-weight:800;fill:#2b9348}',
    '.mh-hopnum-bg{fill:#fff;stroke:#2b9348;stroke-width:2}',
    '.mh-hopnum{font-size:14px;font-weight:800;fill:#2b9348}',
    '.mh-hop{background:#2b9348}',
    '.mh-hopcount{font-size:1.3rem;font-weight:800;padding:6px 14px;border-radius:12px;background:var(--info-bg)}',
    '.mh-sumline{font-size:1.25rem;font-weight:800;color:#2b9348;min-height:1.5em;text-align:center}',
    '.mh-ans .num-prefix{font-size:1.2rem}',
    '.mh-fact{font-size:1.6rem;font-weight:800;color:#0b6e66;text-align:center}',
    '@media (max-width:700px){.mh-tile{min-width:74px;font-size:1.4rem;padding:8px 10px}.mh-bigcard{font-size:3rem}.mh-clue{font-size:1.1rem}.mh-side{max-width:none}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

/* Coin-Toss Walk — a garden-path chance game (Unit 16.1, LB p.252 Q2, WB p.231 Q3).
 *
 * RULES (used everywhere in this file, learn and practice):
 *   - The path has 10 stones, numbered 1-10. The pond is next to stone 1, the shed next to stone 10.
 *   - 10 stones have no single middle stone, so the counter always STARTS ON STONE 5
 *     (the last stone of the first half: stones 1-5 | 6-10). It is marked with a star.
 *   - Heads (H): one stone towards the pond (number goes down by 1).
 *     Tails (T): one stone towards the shed (number goes up by 1).
 *   - At an end: if the coin says go further (heads on stone 1, tails on stone 10) the
 *     counter STAYS PUT on that stone. That toss still counts.
 * Grid game (WB p.231 Q3): 3x3 grid, start bottom-right, finish top-left, a spinner with
 *   6 equal parts (3 "up", 3 "left"). Move one square; stay put if there is no square that way.
 *   The game stops when the counter reaches the finish. Fewest spins = 4 (2 up + 2 left).
 * Every practice answer is computed from the exact toss / spin list shown on screen.
 * "Could it happen?" questions use the exact set of stones reachable after N tosses
 * (end rule included), so parity and path length are both handled exactly.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  var STONES = 10;
  var START = 5;

  /* ------------------------------------------------------------------ *
   * Pure logic
   * ------------------------------------------------------------------ */
  function step(pos, t) {
    var np = pos + (t === 'H' ? -1 : 1);
    if (np < 1 || np > STONES) return pos; // stay put at an end
    return np;
  }
  /** positions after each toss, starting with the start stone */
  function walk(tosses, from) {
    var p = from == null ? START : from;
    var out = [p];
    tosses.forEach(function (t) {
      p = step(p, t);
      out.push(p);
    });
    return out;
  }
  function finish(tosses) {
    var w = walk(tosses);
    return w[w.length - 1];
  }
  /** did the end rule (stay put) happen anywhere in this toss list? */
  function hasStay(tosses) {
    var w = walk(tosses);
    for (var i = 1; i < w.length; i++) if (w[i] === w[i - 1]) return true;
    return false;
  }
  /** finish ignoring the end rule (may be off the path) */
  function naiveFinish(tosses) {
    var p = START;
    tosses.forEach(function (t) {
      p += t === 'H' ? -1 : 1;
    });
    return p;
  }
  /** reach[k] = sorted array of stones you could be on after k tosses (end rule included) */
  function reachSets(n) {
    var cur = {};
    cur[START] = true;
    var out = [[START]];
    for (var k = 1; k <= n; k++) {
      var nxt = {};
      Object.keys(cur).forEach(function (s) {
        s = +s;
        nxt[step(s, 'H')] = true;
        nxt[step(s, 'T')] = true;
      });
      cur = nxt;
      out.push(
        Object.keys(cur)
          .map(Number)
          .sort(function (a, b) {
            return a - b;
          })
      );
    }
    return out;
  }
  /** the same, but pretending the path never ends (for "naive" checks) */
  function naiveReach(n, stone) {
    var d = Math.abs(stone - START);
    return d <= n && (n - d) % 2 === 0;
  }
  /** a random toss list of length n that ends on target (null if impossible) */
  function exampleTosses(n, target) {
    var memo = {};
    function can(pos, left) {
      var key = pos + ':' + left;
      if (key in memo) return memo[key];
      var r = left === 0 ? pos === target : can(step(pos, 'H'), left - 1) || can(step(pos, 'T'), left - 1);
      memo[key] = r;
      return r;
    }
    if (!can(START, n)) return null;
    var out = [];
    var pos = START;
    for (var i = n; i > 0; i--) {
      var opts = U.shuffle(['H', 'T']);
      var pick = can(step(pos, opts[0]), i - 1) ? opts[0] : opts[1];
      out.push(pick);
      pos = step(pos, pick);
    }
    return out;
  }
  function randTosses(n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(Math.random() < 0.5 ? 'H' : 'T');
    return a;
  }

  /* Grid game: c 0-2 left→right, r 0-2 top→bottom. Start (2,2), finish (0,0). */
  var G_START = { c: 2, r: 2 };
  function gStep(p, s) {
    if (s === 'U') return p.r > 0 ? { c: p.c, r: p.r - 1 } : { c: p.c, r: p.r };
    return p.c > 0 ? { c: p.c - 1, r: p.r } : { c: p.c, r: p.r };
  }
  function gWalk(spins) {
    var p = { c: G_START.c, r: G_START.r };
    var out = [p];
    spins.forEach(function (s) {
      p = gStep(p, s);
      out.push(p);
    });
    return out;
  }
  function gNaive(spins) {
    var p = { c: G_START.c, r: G_START.r };
    spins.forEach(function (s) {
      if (s === 'U') p = { c: p.c, r: p.r - 1 };
      else p = { c: p.c - 1, r: p.r };
    });
    return p;
  }
  function gAtFinish(p) {
    return p.c === 0 && p.r === 0;
  }

  /* ------------------------------------------------------------------ *
   * Words and mistake tags
   * ------------------------------------------------------------------ */
  var WORDS = {
    will: '✅ Will happen',
    might: '❓ Might happen',
    wont: '❌ Won’t happen',
  };
  var TAG = {
    dir: 'Moved the wrong way for heads or tails',
    count: 'Lost count of the steps (one stone per toss)',
    stay: 'Forgot to stay put at the end of the path',
    gridStay: 'Forgot to stay put at the edge of the grid',
    gridCount: 'Lost track of the moves on the grid',
    repeat: 'Thought a chance game will end the same way again',
    differ: 'Thought a chance game can never end the same way again',
    tooFew: 'Did not check there are enough tosses to get that far',
    oneStone: 'Missed that every toss moves the counter one stone',
    mightAsWill: 'Said "will" for something that only might happen',
    canHappen: 'Said "won’t" for something that can happen',
    willAsMight: 'Said "might" for something that is sure to happen',
    mode: 'Did not count the dots to find the most common stone',
  };

  /* ------------------------------------------------------------------ *
   * Drawing: the garden path
   * ------------------------------------------------------------------ */
  function sx(i) {
    return 110 + (i - 1) * 62;
  }

  /**
   * opts.top: extra space above the path (for dots); opts.halves: show the 1-5 | 6-10 brackets.
   * Returns { svg, setCounter(i), mark(i, cls), unmark(cls), onPick(fn), hops(list), dot(i, k, cls) }
   */
  function gardenPath(opts) {
    opts = opts || {};
    var top = opts.top || 0;
    var H = 182 + top;
    var y = 110 + top;
    var root = S('svg', { viewBox: '0 0 780 ' + H, class: 'ccw-path', role: 'img', 'aria-label': 'Garden path with 10 stones, pond at stone 1, shed at stone 10' });
    root.appendChild(S('rect', { x: 0, y: 0, width: 780, height: H, rx: 16, class: 'ccw-grass' }));
    root.appendChild(S('rect', { x: 76, y: y - 30, width: 646, height: 60, rx: 22, class: 'ccw-gravel' }));
    // pond
    root.appendChild(S('ellipse', { cx: 40, cy: y, rx: 34, ry: 32, class: 'ccw-pond' }));
    root.appendChild(S('path', { d: 'M22 ' + (y - 6) + ' q8 -6 16 0 t16 0 M24 ' + (y + 8) + ' q8 -6 16 0 t14 0', class: 'ccw-ripple' }));
    root.appendChild(S('text', { x: 40, y: y + 54, 'text-anchor': 'middle', class: 'ccw-end-label' }, 'Pond'));
    // shed
    root.appendChild(S('rect', { x: 730, y: y - 22, width: 44, height: 46, class: 'ccw-shed' }));
    root.appendChild(S('polygon', { points: '724,' + (y - 20) + ' 752,' + (y - 44) + ' 780,' + (y - 20), class: 'ccw-roof' }));
    root.appendChild(S('rect', { x: 744, y: y - 4, width: 16, height: 28, class: 'ccw-door' }));
    root.appendChild(S('text', { x: 752, y: y + 54, 'text-anchor': 'middle', class: 'ccw-end-label' }, 'Shed'));

    if (opts.halves) {
      var hy = y - 62;
      [[1, 5], [6, 10]].forEach(function (pr) {
        var x1 = sx(pr[0]) - 24;
        var x2 = sx(pr[1]) + 24;
        root.appendChild(S('path', { d: 'M' + x1 + ' ' + (hy + 10) + ' V' + hy + ' H' + x2 + ' V' + (hy + 10), class: 'ccw-bracket' }));
        root.appendChild(S('text', { x: (x1 + x2) / 2, y: hy - 8, 'text-anchor': 'middle', class: 'ccw-bracket-t' }, 'stones ' + pr[0] + '–' + pr[1]));
      });
    }

    var stones = {};
    for (var i = 1; i <= STONES; i++) {
      var g = S('g', { class: 'ccw-stone' + (i === START ? ' ccw-start' : ''), 'data-stone': i });
      g.appendChild(S('rect', { x: sx(i) - 31, y: 0, width: 62, height: H, class: 'ccw-hit' }));
      g.appendChild(S('ellipse', { cx: sx(i), cy: y, rx: 26, ry: 20, class: 'ccw-st' }));
      g.appendChild(S('text', { x: sx(i), y: y + 44, 'text-anchor': 'middle', class: 'ccw-num' }, String(i)));
      if (i === START) g.appendChild(S('text', { x: sx(i), y: y + 64, 'text-anchor': 'middle', class: 'ccw-start-t' }, '⭐ start'));
      stones[i] = g;
      root.appendChild(g);
    }
    var hopLayer = S('g', { class: 'ccw-hops' });
    var dotLayer = S('g', { class: 'ccw-dots' });
    root.appendChild(hopLayer);
    root.appendChild(dotLayer);
    var counter = S('g', { class: 'ccw-counter' });
    counter.appendChild(S('circle', { cx: 0, cy: 0, r: 15, class: 'ccw-counter-c' }));
    counter.appendChild(S('circle', { cx: -5, cy: -5, r: 4, class: 'ccw-counter-shine' }));
    root.appendChild(counter);

    var api = {
      svg: root,
      y: y,
      setCounter: function (i, show) {
        counter.style.transform = 'translate(' + sx(i) + 'px,' + y + 'px)';
        counter.style.display = show === false ? 'none' : '';
      },
      mark: function (i, cls) {
        stones[i].classList.add(cls);
      },
      unmark: function (cls) {
        Object.keys(stones).forEach(function (k) {
          stones[k].classList.remove(cls);
        });
      },
      onPick: function (fn) {
        root.classList.add('ccw-pickable');
        Object.keys(stones).forEach(function (k) {
          stones[k].addEventListener('click', function () {
            if (root.classList.contains('ccw-locked')) return;
            fn(+k);
          });
        });
      },
      lock: function () {
        root.classList.add('ccw-locked');
        root.classList.remove('ccw-pickable');
      },
      /** draw numbered hops for a walk (list of positions) */
      hops: function (w) {
        MQ.clear(hopLayer);
        for (var k = 1; k < w.length; k++) {
          var a = w[k - 1];
          var b = w[k];
          var h = 34 + ((k - 1) % 3) * 13;
          if (a === b) {
            var cx = sx(a);
            hopLayer.appendChild(S('path', { d: 'M' + (cx - 10) + ' ' + (y - 22) + ' C' + (cx - 26) + ' ' + (y - 22 - h) + ' ' + (cx + 26) + ' ' + (y - 22 - h) + ' ' + (cx + 10) + ' ' + (y - 22), class: 'ccw-hop ccw-hop-stay' }));
            hopLayer.appendChild(S('text', { x: cx, y: y - 26 - h * 0.75, 'text-anchor': 'middle', class: 'ccw-hop-n ccw-hop-stay-t' }, k + ' stay'));
          } else {
            var x1 = sx(a);
            var x2 = sx(b);
            var mx = (x1 + x2) / 2;
            hopLayer.appendChild(S('path', { d: 'M' + x1 + ' ' + (y - 22) + ' Q' + mx + ' ' + (y - 22 - h * 2) + ' ' + x2 + ' ' + (y - 22), class: 'ccw-hop' }));
            hopLayer.appendChild(S('circle', { cx: x2, cy: y - 22, r: 4, class: 'ccw-hop-end' }));
            hopLayer.appendChild(S('text', { x: mx, y: y - 26 - h, 'text-anchor': 'middle', class: 'ccw-hop-n' }, String(k)));
          }
        }
      },
      dot: function (i, k, spacing, cls) {
        dotLayer.appendChild(S('circle', { cx: sx(i), cy: y - 38 - k * spacing, r: Math.min(9, spacing / 2 - 1), class: 'ccw-dot ' + (cls || '') }));
      },
      clearDots: function () {
        MQ.clear(dotLayer);
      },
    };
    api.setCounter(START);
    return api;
  }

  /** one coin chip (H or T); clicking it ticks it off when tickable */
  function coin(t, n, tickable) {
    var c = el('span', { class: 'ccw-coin ccw-' + t, title: t === 'H' ? 'heads' : 'tails' }, el('span', { class: 'ccw-coin-n' }, n ? String(n) : ''), el('span', { class: 'ccw-coin-l' }, t));
    if (tickable) {
      c.classList.add('ccw-tick');
      c.addEventListener('click', function () {
        c.classList.toggle('ccw-done');
      });
    }
    return c;
  }
  function coinRow(tosses, tickable) {
    var row = el('div', { class: 'ccw-coins' });
    tosses.forEach(function (t, i) {
      row.appendChild(coin(t, i + 1, tickable));
    });
    return row;
  }
  function legend() {
    return el(
      'div',
      { class: 'ccw-legend' },
      el('span', { class: 'ccw-leg' }, coin('H'), el('b', null, 'Heads'), ' = 1 stone ⬅ to the pond'),
      el('span', { class: 'ccw-leg' }, coin('T'), el('b', null, 'Tails'), ' = 1 stone ➡ to the shed')
    );
  }
  function walkText(tosses) {
    var w = walk(tosses);
    var parts = ['Start on ' + w[0]];
    tosses.forEach(function (t, i) {
      parts.push(t + ' → ' + w[i + 1] + (w[i + 1] === w[i] ? ' (stay put)' : ''));
    });
    return parts.join(',  ');
  }

  /** rows of mini-stones: which stones you could be on after 0, 1, 2 ... n tosses */
  function reachRows(n, highlight) {
    var R = reachSets(n);
    var rowH = 30;
    var H = 34 + (n + 1) * rowH;
    var root = S('svg', { viewBox: '0 0 780 ' + H, class: 'ccw-rows', role: 'img', 'aria-label': 'Stones you could be on after each toss' });
    root.appendChild(S('rect', { x: 0, y: 0, width: 780, height: H, rx: 12, class: 'ccw-rows-bg' }));
    for (var i = 1; i <= STONES; i++) {
      root.appendChild(S('text', { x: sx(i), y: 22, 'text-anchor': 'middle', class: 'ccw-rows-head' + (highlight.indexOf(i) >= 0 ? ' ccw-rows-head-hi' : '') }, 'stone ' + i));
      if (highlight.indexOf(i) >= 0) root.appendChild(S('rect', { x: sx(i) - 28, y: 30, width: 56, height: H - 34, rx: 8, class: 'ccw-rows-col' }));
    }
    R.forEach(function (set, k) {
      var yy = 34 + k * rowH;
      root.appendChild(S('text', { x: 12, y: yy + 19, class: 'ccw-rows-lab' + (k === n ? ' ccw-rows-lab-last' : '') }, k === 0 ? 'start' : 'after ' + k));
      for (var s = 1; s <= STONES; s++) {
        var on = set.indexOf(s) >= 0;
        root.appendChild(S('rect', { x: sx(s) - 22, y: yy + 3, width: 44, height: rowH - 8, rx: 7, class: on ? (k === n ? 'ccw-cell-last' : 'ccw-cell-on') : 'ccw-cell-off' }));
      }
    });
    return root;
  }

  /* ------------------------------------------------------------------ *
   * Drawing: the grid game and its spinner
   * ------------------------------------------------------------------ */
  var GC = 86; // grid cell
  var GP = 8;
  function gx(c) {
    return GP + c * GC + GC / 2;
  }
  function gy(r) {
    return GP + r * GC + GC / 2;
  }
  function gridBoard() {
    var size = GP * 2 + GC * 3;
    var root = S('svg', { viewBox: '0 0 ' + size + ' ' + size, class: 'ccw-grid', role: 'img', 'aria-label': '3 by 3 grid, start bottom right, finish top left' });
    var cells = [];
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < 3; c++) {
        var g = S('g', { class: 'ccw-gcell', 'data-c': c, 'data-r': r });
        g.appendChild(S('rect', { x: GP + c * GC, y: GP + r * GC, width: GC, height: GC, class: 'ccw-gsq' + (c === 0 && r === 0 ? ' ccw-gfin' : '') + (c === 2 && r === 2 ? ' ccw-gstart' : '') }));
        if (c === 0 && r === 0) g.appendChild(S('text', { x: gx(0), y: GP + GC - 10, 'text-anchor': 'middle', class: 'ccw-glab' }, '🏁 Finish'));
        if (c === 2 && r === 2) g.appendChild(S('text', { x: gx(2), y: GP + 3 * GC - 10, 'text-anchor': 'middle', class: 'ccw-glab' }, 'Start'));
        cells.push(g);
        root.appendChild(g);
      }
    }
    var marks = S('g');
    root.appendChild(marks);
    var counter = S('g', { class: 'ccw-counter' });
    counter.appendChild(S('circle', { cx: 0, cy: 0, r: 17, class: 'ccw-counter-c' }));
    counter.appendChild(S('circle', { cx: -6, cy: -6, r: 4.5, class: 'ccw-counter-shine' }));
    root.appendChild(counter);
    var api = {
      svg: root,
      setCounter: function (p) {
        counter.style.transform = 'translate(' + gx(p.c) + 'px,' + (gy(p.r) - 6) + 'px)';
      },
      onPick: function (fn) {
        root.classList.add('ccw-pickable');
        cells.forEach(function (g) {
          g.addEventListener('click', function () {
            if (root.classList.contains('ccw-locked')) return;
            fn({ c: +g.getAttribute('data-c'), r: +g.getAttribute('data-r') }, g);
          });
        });
      },
      lock: function () {
        root.classList.add('ccw-locked');
        root.classList.remove('ccw-pickable');
      },
      cell: function (p) {
        return cells[p.r * 3 + p.c];
      },
      /** numbered badges for each spin of a walk */
      trail: function (w) {
        MQ.clear(marks);
        var per = {};
        for (var k = 1; k < w.length; k++) {
          var key = w[k].c + ',' + w[k].r;
          var n = per[key] || 0;
          per[key] = n + 1;
          var bx = GP + w[k].c * GC + 14 + (n % 4) * 19;
          var by = GP + w[k].r * GC + 16 + Math.floor(n / 4) * 19;
          var stay = w[k].c === w[k - 1].c && w[k].r === w[k - 1].r;
          marks.appendChild(S('circle', { cx: bx, cy: by, r: 9, class: stay ? 'ccw-badge-stay' : 'ccw-badge' }));
          marks.appendChild(S('text', { x: bx, y: by + 4, 'text-anchor': 'middle', class: 'ccw-badge-t' }, String(k)));
        }
      },
    };
    api.setCounter(G_START);
    return api;
  }

  function spinner() {
    var C = 100;
    var R = 90;
    var root = S('svg', { viewBox: '0 0 200 200', class: 'ccw-spinner', role: 'img', 'aria-label': 'Spinner with 6 equal parts: 3 up and 3 left' });
    function pt(a, r) {
      var rad = (a * Math.PI) / 180;
      return [C + r * Math.sin(rad), C - r * Math.cos(rad)];
    }
    for (var i = 0; i < 6; i++) {
      var a1 = i * 60;
      var a2 = a1 + 60;
      var p1 = pt(a1, R);
      var p2 = pt(a2, R);
      var up = i % 2 === 0;
      root.appendChild(S('path', { d: 'M' + C + ' ' + C + ' L' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2) + ' A' + R + ' ' + R + ' 0 0 1 ' + p2[0].toFixed(2) + ' ' + p2[1].toFixed(2) + ' Z', class: up ? 'ccw-sec-up' : 'ccw-sec-left' }));
      var m = pt(a1 + 30, 60);
      root.appendChild(S('text', { x: m[0], y: m[1] - 2, 'text-anchor': 'middle', class: 'ccw-sec-arrow' }, up ? '⬆' : '⬅'));
      root.appendChild(S('text', { x: m[0], y: m[1] + 16, 'text-anchor': 'middle', class: 'ccw-sec-word' }, up ? 'up' : 'left'));
    }
    var needle = S('g', { class: 'ccw-needle' });
    needle.appendChild(S('line', { x1: C, y1: C, x2: C, y2: C - 74, class: 'ccw-needle-l' }));
    needle.appendChild(S('polygon', { points: C + ',' + (C - 84) + ' ' + (C - 8) + ',' + (C - 68) + ' ' + (C + 8) + ',' + (C - 68), class: 'ccw-needle-h' }));
    root.appendChild(needle);
    root.appendChild(S('circle', { cx: C, cy: C, r: 8, class: 'ccw-hub' }));
    needle.style.transformOrigin = C + 'px ' + C + 'px';
    var turned = 0;
    return {
      svg: root,
      /** spin to a random part; returns 'U' or 'L' */
      spin: function () {
        var part = U.rand(0, 5);
        var target = part * 60 + 10 + Math.random() * 40;
        var base = Math.ceil(turned / 360) * 360 + 720;
        turned = base + target;
        needle.style.transform = 'rotate(' + turned + 'deg)';
        return part % 2 === 0 ? 'U' : 'L';
      },
    };
  }

  function arrowChip(s, n) {
    return el('span', { class: 'ccw-arrow ccw-arrow-' + s }, el('span', { class: 'ccw-coin-n' }, n ? String(n) : ''), s === 'U' ? '⬆ up' : '⬅ left');
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  function genTrace(n) {
    // short lists: both faces present, never reaches an end (no stay put yet)
    for (;;) {
      var t = randTosses(n);
      if (t.indexOf('H') < 0 || t.indexOf('T') < 0) continue;
      if (hasStay(t)) continue;
      if (finish(t) === START && n !== 4) continue;
      return t;
    }
  }
  function genTrace10(withStay) {
    for (;;) {
      var t = randTosses(10);
      if (hasStay(t) !== withStay) continue;
      if (withStay && finish(t) === naiveFinish(t)) continue; // the stay must matter
      return t;
    }
  }

  function verdictOn(n, stone) {
    var set = reachSets(n)[n];
    if (set.indexOf(stone) < 0) return 'wont';
    return set.length === 1 ? 'will' : 'might';
  }
  function verdictAway(n, d) {
    var set = reachSets(n)[n];
    var hit = set.filter(function (s) {
      return Math.abs(s - START) === d;
    }).length;
    if (hit === 0) return 'wont';
    return hit === set.length ? 'will' : 'might';
  }
  function verdictOff(n) {
    var set = reachSets(n)[n];
    if (set.indexOf(START) < 0) return 'will';
    return set.length === 1 ? 'wont' : 'might';
  }

  /** Level 2 "could it happen?" question */
  function genReachEasy() {
    var kind = U.pick(['repeat', 'end', 'tooFew']);
    if (kind === 'repeat') {
      var last = finish(randTosses(10));
      return { type: 'reach', kind: 'on', n: 10, stone: last, repeat: true, answer: verdictOn(10, last) };
    }
    if (kind === 'end') {
      var st = U.pick([1, 10]);
      return { type: 'reach', kind: 'on', n: 10, stone: st, answer: verdictOn(10, st) };
    }
    var n = U.pick([2, 3, 4]);
    var far = U.range(1, STONES).filter(function (s) {
      return Math.abs(s - START) > n;
    });
    var s2 = U.pick(far);
    return { type: 'reach', kind: 'on', n: n, stone: s2, why: 'far', answer: verdictOn(n, s2) };
  }

  /** Level 3: path length and "one stone every toss" questions (only where the end rule makes no difference) */
  function genReachHard() {
    var cands = [];
    [3, 4, 5].forEach(function (n) {
      U.range(1, STONES).forEach(function (s) {
        var d = Math.abs(s - START);
        if (d <= n && (n - d) % 2 === 1) {
          var v = verdictOn(n, s);
          if (v === 'wont' && !naiveReach(n, s)) cands.push({ type: 'reach', kind: 'on', n: n, stone: s, why: 'one', answer: v, group: 'wont' });
        }
      });
    });
    [[6, 5], [2, 3], [3, 4], [1, 3], [4, 4], [2, 4], [1, 1]].forEach(function (p) {
      var d = p[0];
      var n = p[1];
      var v = verdictAway(n, d);
      var naive = d <= n && (n - d) % 2 === 0 && (START - d >= 1 || START + d <= STONES);
      if ((v !== 'wont') !== naive) return; // end rule would change the answer: skip
      cands.push({ type: 'reach', kind: 'away', n: n, d: d, why: d > n ? 'far' : 'one', answer: v, group: v });
    });
    [1, 3].forEach(function (n) {
      cands.push({ type: 'reach', kind: 'off', n: n, answer: verdictOff(n), group: 'will' });
    });
    var groups = ['wont', 'might', 'will'].filter(function (g) {
      return cands.some(function (c) {
        return c.group === g;
      });
    });
    var g = U.pick(groups);
    return U.pick(
      cands.filter(function (c) {
        return c.group === g;
      })
    );
  }

  function genDots() {
    for (;;) {
      var games = [];
      for (var i = 0; i < 6; i++) games.push(finish(randTosses(10)));
      var cnt = {};
      games.forEach(function (s) {
        cnt[s] = (cnt[s] || 0) + 1;
      });
      var max = Math.max.apply(null, Object.keys(cnt).map(function (k) {
        return cnt[k];
      }));
      var tops = Object.keys(cnt).filter(function (k) {
        return cnt[k] === max;
      });
      if (max >= 2 && tops.length === 1) return { type: 'dots', games: games, answer: +tops[0], max: max };
    }
  }

  function genGrid() {
    for (;;) {
      var n = U.rand(5, 7);
      var sp = [];
      for (var i = 0; i < n; i++) sp.push(Math.random() < 0.5 ? 'U' : 'L');
      var w = gWalk(sp);
      var early = false;
      for (var k = 1; k < w.length - 1; k++) if (gAtFinish(w[k])) early = true;
      if (early) continue;
      var stays = 0;
      for (var j = 1; j < w.length; j++) if (w[j].c === w[j - 1].c && w[j].r === w[j - 1].r) stays++;
      if (stays < 1) continue;
      var end = w[w.length - 1];
      if (end.c === G_START.c && end.r === G_START.r) continue;
      return { type: 'grid', spins: sp, answer: end };
    }
  }

  function buildDeck() {
    return [
      { type: 'trace', tosses: genTrace(3) },
      { type: 'trace', tosses: genTrace(4) },
      { type: 'trace', tosses: genTrace(5) },
      { type: 'trace', tosses: genTrace10(Math.random() < 0.5) },
      genReachEasy(),
      genGrid(),
      genDots(),
      genReachHard(),
    ];
  }

  var deck = null;
  var lastFinishes = []; // learn screens share games

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */
  function tossGame(stage, api, opts) {
    // a playable 10-toss game; opts.onDone(finishStone), opts.path (existing gardenPath)
    var p = opts.path;
    var tosses = [];
    var pos = START;
    var log = el('div', { class: 'ccw-coins ccw-log' });
    var count = el('span', { class: 'ccw-count' }, '0 of 10 tosses');
    var tossBtn = el('button', { class: 'btn ccw-toss', type: 'button' }, '🪙 Toss the coin');
    var restBtn = opts.rest ? el('button', { class: 'btn btn-ghost ccw-rest', type: 'button' }, 'Toss the rest') : null;
    p.setCounter(START);
    function one() {
      var t = Math.random() < 0.5 ? 'H' : 'T';
      var np = step(pos, t);
      tosses.push(t);
      log.appendChild(coin(t, tosses.length));
      count.textContent = tosses.length + ' of 10 tosses';
      if (np === pos) {
        api.feedback((t === 'H' ? 'Heads, but there is no stone nearer the pond.' : 'Tails, but there is no stone nearer the shed.') + ' Stay put!', 'info');
      } else {
        api.feedback((t === 'H' ? 'Heads: 1 stone to the pond' : 'Tails: 1 stone to the shed') + ' → stone ' + np, 'info');
      }
      pos = np;
      p.setCounter(pos);
      if (tosses.length >= 10) {
        tossBtn.disabled = true;
        if (restBtn) restBtn.disabled = true;
        opts.onDone(pos, tosses);
      }
    }
    tossBtn.addEventListener('click', function () {
      if (tosses.length < 10) {
        MQ.sound('pop');
        one();
      }
    });
    if (restBtn)
      restBtn.addEventListener('click', function () {
        if (tosses.length >= 10) return;
        restBtn.disabled = true;
        tossBtn.disabled = true;
        (function go() {
          if (tosses.length >= 10) return;
          one();
          if (tosses.length < 10) api.later(go, 280);
        })();
      });
    return el('div', { class: 'ccw-tossbar' }, el('div', { class: 'ccw-tossbtns' }, tossBtn, restBtn, count), log);
  }

  var learn = [
    // 1. the path, the start stone, the rules; toss 10 times
    function (stage, api) {
      api.say('Heads: one stone to the pond. Tails: one stone to the shed. Toss 10 times!');
      api.lockNext();
      lastFinishes = [];
      stage.appendChild(MQ.ui.lesson('Coin-toss walk', '10 stones have no single middle stone, so we always <b>start on stone 5 ⭐</b>. At an end, if the coin says go further, <b>stay put</b>.'));
      stage.appendChild(legend());
      var p = gardenPath({ halves: true });
      stage.appendChild(p.svg);
      stage.appendChild(
        tossGame(stage, api, {
          path: p,
          onDone: function (end) {
            lastFinishes.push(end);
            p.mark(end, 'ccw-fin1');
            api.say('We finished on stone ' + end + '. I coloured it in!', 'cheer');
            api.feedback('Game over: the counter finished on stone ' + end + '.', 'good');
            api.unlockNext();
          },
        })
      );
    },
    // 2. predict a replay, then play again and compare
    function (stage, api) {
      api.lockNext();
      var first = lastFinishes[0] || finish(randTosses(10));
      lastFinishes = [first];
      api.say('If we play again, will we finish on stone ' + first + ' again?', 'think');
      stage.appendChild(MQ.ui.prompt('Last game finished on stone <b>' + first + '</b>. Play again: will we finish on stone ' + first + ' again?'));
      var p = gardenPath();
      p.mark(first, 'ccw-fin1');
      var area = el('div', { class: 'ccw-col' });
      var ch = MQ.ui.choices(
        ['will', 'might', 'wont'].map(function (k) {
          return { label: WORDS[k], value: k };
        }),
        function (v) {
          if (v !== 'might') {
            ch.mark(v, 'bad');
            api.feedback(v === 'will' ? 'Are we sure? The coin could land differently this time.' : 'Could it never happen? The same tosses could come up again!', 'info');
            return;
          }
          ch.mark('might', 'good');
          ch.disable();
          api.say('Yes! It might. Let’s test it.', 'happy');
          api.feedback('It might happen. We can’t be sure, because each toss is a surprise.', 'good');
          area.appendChild(
            tossGame(stage, api, {
              path: p,
              rest: true,
              onDone: function (end) {
                lastFinishes.push(end);
                p.mark(end, 'ccw-fin2');
                if (end === first) {
                  api.say('Same stone this time! Next time it might not be.', 'cheer');
                  api.feedback('Game 1: stone ' + first + '. Game 2: stone ' + end + '. The same this time, but that was luck.', 'good');
                } else {
                  api.say('Different this time! Game 1: stone ' + first + '. Game 2: stone ' + end + '.', 'cheer');
                  api.feedback('Game 1: stone ' + first + '. Game 2: stone ' + end + '. A chance game can end differently.', 'good');
                }
                api.unlockNext();
              },
            })
          );
        },
        { columns: 3 }
      );
      stage.appendChild(ch);
      stage.appendChild(p.svg);
      stage.appendChild(el('div', { class: 'ccw-key' }, el('span', { class: 'ccw-sw ccw-sw1' }), 'game 1', el('span', { class: 'ccw-sw ccw-sw2' }), 'game 2'));
      stage.appendChild(area);
    },
    // 3. many games: a dot for every finish
    function (stage, api) {
      api.lockNext();
      api.say('Let’s play lots of games. Each dot shows where one game finished.');
      stage.appendChild(MQ.ui.lesson('Where do games finish?', 'Every dot is one game of 10 tosses.'));
      var p = gardenPath({ top: 150 });
      p.setCounter(START, false);
      var games = lastFinishes.slice();
      var counts = {};
      var info = el('div', { class: 'ccw-count' });
      function redraw() {
        p.clearDots();
        counts = {};
        var max = 1;
        games.forEach(function (s) {
          counts[s] = (counts[s] || 0) + 1;
          max = Math.max(max, counts[s]);
        });
        var spacing = Math.min(20, 180 / max);
        var seen = {};
        games.forEach(function (s) {
          var k = seen[s] || 0;
          seen[s] = k + 1;
          p.dot(s, k, spacing);
        });
        info.textContent = games.length + ' games played';
      }
      function play(n) {
        for (var i = 0; i < n; i++) games.push(finish(randTosses(10)));
        redraw();
        MQ.sound('pop');
        if (games.length >= 10) {
          api.unlockNext();
          api.say('See? The games finish in lots of different places.', 'cheer');
          api.feedback('Same rules, different finishes. Some stones get more dots than others, but no stone is sure.', 'good');
        } else {
          api.feedback('Keep going: play at least 10 games.', 'info');
        }
      }
      stage.appendChild(p.svg);
      stage.appendChild(
        el(
          'div',
          { class: 'ccw-tossbtns' },
          el('button', { class: 'btn', type: 'button', onclick: function () { play(1); } }, 'Play 1 game'),
          el('button', { class: 'btn', type: 'button', onclick: function () { play(5); } }, 'Play 5 games'),
          info
        )
      );
      redraw();
    },
    // 4. grid game (WB p.231 Q3)
    function (stage, api) {
      api.lockNext();
      api.say('A new game! Spin: go up or left one square. No square that way? Stay put.');
      stage.appendChild(MQ.ui.prompt('Get from <b>Start</b> to the <b>Finish 🏁</b>. How many spins will it take?'));
      var board = gridBoard();
      var sp = spinner();
      var pos = { c: G_START.c, r: G_START.r };
      var spins = [];
      var trail = [pos];
      var log = el('div', { class: 'ccw-coins ccw-log' });
      var spinBtn = el('button', { class: 'btn', type: 'button' }, '🌀 Spin');
      var again = el('button', { class: 'btn btn-ghost', type: 'button', style: { display: 'none' } }, 'Play again');
      var qArea = el('div', { class: 'ccw-col' });
      var busy = false;
      var asked = false;
      spinBtn.addEventListener('click', function () {
        if (busy || gAtFinish(pos)) return;
        busy = true;
        var s = sp.spin();
        MQ.sound('click');
        api.later(function () {
          busy = false;
          var np = gStep(pos, s);
          spins.push(s);
          log.appendChild(arrowChip(s, spins.length));
          if (np.c === pos.c && np.r === pos.r) api.feedback((s === 'U' ? 'Up' : 'Left') + ', but there is no square that way. Stay put!', 'info');
          else api.feedback((s === 'U' ? 'Up' : 'Left') + ' one square.', 'info');
          pos = np;
          trail.push(pos);
          board.setCounter(pos);
          board.trail(trail);
          if (gAtFinish(pos)) {
            spinBtn.disabled = true;
            again.style.display = '';
            api.say('Finished in ' + spins.length + ' spins!', 'cheer');
            api.feedback('You reached the finish in ' + spins.length + ' spins. The fewest possible is 4: 2 ups and 2 lefts.', 'good');
            if (!asked) ask();
          }
        }, 900);
      });
      again.addEventListener('click', function () {
        pos = { c: G_START.c, r: G_START.r };
        spins = [];
        trail = [pos];
        MQ.clear(log);
        board.setCounter(pos);
        board.trail(trail);
        spinBtn.disabled = false;
        again.style.display = 'none';
        api.feedback('', 'info');
      });
      function ask() {
        asked = true;
        qArea.appendChild(MQ.ui.prompt('Will this game <b>always</b> take 4 spins?'));
        var ch = MQ.ui.choices(
          [
            { label: 'Yes, always 4', value: 'yes' },
            { label: 'No, it might take more', value: 'no' },
          ],
          function (v) {
            if (v === 'yes') {
              ch.mark(v, 'bad');
              api.feedback('Hmm. What if the spinner says "up" when you are already on the top row?', 'info');
              return;
            }
            ch.mark('no', 'good');
            ch.disable();
            api.say('Right! 4 is the fewest, but it might take more.', 'cheer');
            api.feedback('4 spins is the fewest (2 up + 2 left). A spin that says "no space" makes you stay put, so it might take more.', 'good');
            api.unlockNext();
          },
          { columns: 2 }
        );
        qArea.appendChild(ch);
      }
      stage.appendChild(el('div', { class: 'ccw-gridrow' }, board.svg, el('div', { class: 'ccw-col' }, sp.svg, el('div', { class: 'ccw-tossbtns' }, spinBtn, again))));
      stage.appendChild(log);
      stage.appendChild(qArea);
    },
  ];

  /* ------------------------------------------------------------------ *
   * Practice
   * ------------------------------------------------------------------ */
  function renderTrace(stage, api, q) {
    var t = q.tosses;
    var ans = finish(t);
    var staysHappen = hasStay(t);
    var naive = naiveFinish(t);
    var hN = t.filter(function (x) { return x === 'H'; }).length;
    var tN = t.length - hN;
    api.say(t.length === 10 ? '10 tosses! Tap each coin as you go so you don’t lose your place.' : 'Follow the coins. Where does the counter end?', 'think');
    stage.appendChild(MQ.ui.prompt('Start on stone 5 ⭐. Follow the ' + t.length + ' tosses. Click the stone where the counter <b>ends</b>.'));
    stage.appendChild(coinRow(t, true));
    stage.appendChild(legend());
    var p = gardenPath();
    stage.appendChild(p.svg);
    var done = false;
    function show() {
      done = true;
      p.lock();
      p.unmark('ccw-bad');
      p.hops(walk(t));
      p.setCounter(ans);
      p.mark(ans, 'ccw-good');
    }
    p.onPick(function (s) {
      if (done) return;
      p.unmark('ccw-bad');
      if (s === ans) {
        show();
        api.check(true, 'Yes! The counter ends on stone ' + ans + '.');
        return;
      }
      p.mark(s, 'ccw-bad');
      var tag;
      var hint;
      if (staysHappen && s === naive) {
        tag = TAG.stay;
        hint = 'Watch the end of the path: on stone 1, heads means stay put. On stone 10, tails means stay put.';
      } else if (s === 2 * START - naive && s !== ans) {
        tag = TAG.dir;
        hint = 'Check the direction: heads go towards the pond (smaller numbers), tails towards the shed.';
      } else {
        tag = TAG.count;
        hint = 'Move exactly one stone for each coin. Tap the coins as you go.';
      }
      if (api.tries() >= 1) {
        if (staysHappen) hint += ' Go coin by coin from stone 5 and look out for a stay put.';
        else hint += ' There are ' + hN + ' heads (' + hN + ' back) and ' + tN + ' tails (' + tN + ' on). Start on 5.';
      }
      api.check(false, hint, tag);
    });
    api.onReveal(function () {
      show();
      api.feedback(walkText(t) + '. It ends on stone ' + ans + '.', 'info');
    });
  }

  function reachQuestionText(q) {
    if (q.kind === 'on' && q.repeat) return 'The last game of 10 tosses finished on stone <b>' + q.stone + '</b>. We play again with 10 new tosses. Will we finish on stone ' + q.stone + ' again?';
    if (q.kind === 'on' && q.n === 10 && (q.stone === 1 || q.stone === 10)) return 'Start on stone 5 ⭐ and toss 10 times. Will the counter finish on stone ' + q.stone + ', right next to the ' + (q.stone === 1 ? 'pond' : 'shed') + '?';
    if (q.kind === 'on') return 'Start on stone 5 ⭐ and toss the coin <b>' + q.n + ' times</b>. Will the counter finish on stone <b>' + q.stone + '</b>?';
    if (q.kind === 'away') return 'Start on stone 5 ⭐ and toss the coin <b>' + q.n + (q.n === 1 ? ' time' : ' times') + '</b>. Will the counter finish <b>' + q.d + (q.d === 1 ? ' stone' : ' stones') + '</b> away from the start?';
    return 'Start on stone 5 ⭐ and toss the coin <b>' + q.n + (q.n === 1 ? ' time' : ' times') + '</b>. Will the counter be <b>off</b> the start stone at the end?';
  }
  function reachTargets(q) {
    if (q.kind === 'on') return [q.stone];
    if (q.kind === 'off') return [START];
    return [START - q.d, START + q.d].filter(function (s) {
      return s >= 1 && s <= STONES;
    });
  }
  function reachWorking(q) {
    var set = reachSets(q.n)[q.n];
    var after = 'After ' + q.n + (q.n === 1 ? ' toss' : ' tosses') + ' the counter can only be on stone' + (set.length > 1 ? 's ' : ' ') + set.join(', ') + '. ';
    if (q.answer === 'wont') {
      if (q.why === 'far') {
        if (q.kind === 'away') return 'Each toss moves the counter just 1 stone, so ' + q.n + ' tosses can take it at most ' + q.n + ' stones away. ' + q.d + ' stones is too far: it won’t happen.';
        return 'Stone ' + q.stone + ' is ' + Math.abs(q.stone - START) + ' stones from the start, but ' + q.n + ' tosses move at most ' + q.n + ' stones. It won’t happen.';
      }
      return after + 'Every toss moves the counter one stone, so it can’t be there. It won’t happen.';
    }
    if (q.answer === 'will') {
      if (q.kind === 'off') return after + 'Stone 5 is not one of them, so it will happen.';
      return after + 'Every one of them is ' + q.d + ' stone' + (q.d === 1 ? '' : 's') + ' away, so it will happen.';
    }
    if (q.repeat) return 'It can happen (the toss list below is one way), but other tosses finish somewhere else. It might happen.';
    if (q.n > 6) return 'It can happen (the toss list below is one way), but other tosses finish somewhere else. It might happen.';
    return after + 'That includes it, but the others are possible too. It might happen.';
  }

  function renderReach(stage, api, q) {
    api.say('Think about every way the coins could land.', 'think');
    stage.appendChild(MQ.ui.prompt(reachQuestionText(q)));
    var p = gardenPath();
    if (q.repeat) p.mark(q.stone, 'ccw-fin1');
    stage.appendChild(p.svg);
    var ch = MQ.ui.choices(
      ['will', 'might', 'wont'].map(function (k) {
        return { label: WORDS[k], value: k };
      }),
      function (v) {
        if (v === q.answer) {
          ch.mark(v, 'good');
          ch.disable();
          api.check(true, 'Yes! ' + reachWorking(q));
          return;
        }
        ch.mark(v, 'bad');
        var tag;
        var hint;
        if (q.answer === 'wont') {
          if (q.why === 'far') {
            tag = TAG.tooFew;
            hint = 'Count the stones from the start to there. Can ' + q.n + ' tosses get that far?';
          } else {
            tag = TAG.oneStone;
            hint = 'Every toss MUST move the counter one stone. Try it on the path: where can you be after 1 toss? After 2?';
          }
        } else if (q.answer === 'might') {
          if (q.repeat) {
            tag = v === 'will' ? TAG.repeat : TAG.differ;
            hint = v === 'will' ? 'Will the coins land exactly the same way again? We can’t be sure.' : 'Could the same tosses come up again? They could!';
          } else {
            tag = v === 'will' ? TAG.mightAsWill : TAG.canHappen;
            hint = v === 'will' ? 'Is it the ONLY place the counter could finish? Other tosses go somewhere else.' : 'Can you find some tosses that get there? Try heads and tails on the path.';
          }
        } else {
          tag = v === 'might' ? TAG.willAsMight : TAG.oneStone;
          hint = 'Every toss moves the counter one stone. List every stone it could be on after ' + q.n + (q.n === 1 ? ' toss.' : ' tosses.');
        }
        if (api.tries() >= 1) hint += ' Pick the answer that is true for EVERY way the coins could land.';
        api.check(false, hint, tag);
      },
      { columns: 3 }
    );
    stage.appendChild(ch);
    var work = el('div', { class: 'ccw-col' });
    stage.appendChild(work);
    api.onReveal(function () {
      ch.mark(q.answer, 'good');
      ch.disable();
      if (q.n <= 6) {
        work.appendChild(el('div', { class: 'ccw-cap' }, 'Green = stones you could be on after each toss'));
        work.appendChild(reachRows(q.n, reachTargets(q)));
      } else {
        var ex = exampleTosses(q.n, q.stone);
        work.appendChild(el('div', { class: 'ccw-cap' }, 'One way to finish on stone ' + q.stone + ':'));
        work.appendChild(coinRow(ex));
        p.hops(walk(ex));
        p.setCounter(q.stone);
        p.mark(q.stone, 'ccw-good');
      }
      api.feedback(reachWorking(q), 'info');
    });
  }

  function renderDots(stage, api, q) {
    api.say('Bolt played 6 games. Which stone got the most finishes?', 'think');
    stage.appendChild(MQ.ui.prompt('Each dot is where one game of 10 tosses finished. Click the stone where games finished <b>most often</b>.'));
    var p = gardenPath({ top: 60 });
    p.setCounter(START, false);
    var seen = {};
    q.games.forEach(function (s) {
      var k = seen[s] || 0;
      seen[s] = k + 1;
      p.dot(s, k, 20);
    });
    stage.appendChild(p.svg);
    var labels = S('g');
    p.svg.appendChild(labels);
    function showCounts() {
      Object.keys(seen).forEach(function (s) {
        labels.appendChild(S('text', { x: sx(+s), y: p.y - 38 - seen[s] * 20 - 4, 'text-anchor': 'middle', class: 'ccw-dotcount' + (+s === q.answer ? ' ccw-dotcount-top' : '') }, String(seen[s])));
      });
    }
    var done = false;
    p.onPick(function (s) {
      if (done) return;
      p.unmark('ccw-bad');
      if (s === q.answer) {
        done = true;
        p.lock();
        p.mark(s, 'ccw-good');
        showCounts();
        api.check(true, 'Yes! Stone ' + q.answer + ' has ' + q.max + ' dots, the tallest pile.');
        return;
      }
      p.mark(s, 'ccw-bad');
      var c = seen[s] || 0;
      var hint = 'Stone ' + s + ' has ' + c + (c === 1 ? ' dot' : ' dots') + '. Count the dots above each stone. Which pile is tallest?';
      if (api.tries() >= 1) hint = 'Stone ' + s + ' has ' + c + (c === 1 ? ' dot' : ' dots') + '. The tallest pile has ' + q.max + ' dots. Find it!';
      api.check(false, hint, TAG.mode);
    });
    api.onReveal(function () {
      done = true;
      p.lock();
      p.unmark('ccw-bad');
      p.mark(q.answer, 'ccw-good');
      showCounts();
      api.feedback('Count each pile: stone ' + q.answer + ' has ' + q.max + ' dots, more than any other stone. But the next game might finish anywhere!', 'info');
    });
  }

  function renderGrid(stage, api, q) {
    api.say('Up or left one square. No square that way? Stay put!', 'think');
    stage.appendChild(MQ.ui.prompt('Start in the bottom-right square. Follow the ' + q.spins.length + ' spins. Click the square where the counter <b>ends</b>.'));
    var row = el('div', { class: 'ccw-coins' });
    q.spins.forEach(function (s, i) {
      var c = arrowChip(s, i + 1);
      c.classList.add('ccw-tick');
      c.addEventListener('click', function () {
        c.classList.toggle('ccw-done');
      });
      row.appendChild(c);
    });
    stage.appendChild(row);
    var board = gridBoard();
    stage.appendChild(board.svg);
    var w = gWalk(q.spins);
    var naive = gNaive(q.spins);
    var done = false;
    var badCell = null;
    function show() {
      done = true;
      board.lock();
      if (badCell) badCell.classList.remove('ccw-gbad');
      board.trail(w);
      board.setCounter(q.answer);
      board.cell(q.answer).classList.add('ccw-ggood');
    }
    board.onPick(function (p, g) {
      if (done) return;
      if (badCell) badCell.classList.remove('ccw-gbad');
      if (p.c === q.answer.c && p.r === q.answer.r) {
        show();
        api.check(true, 'Yes! Spot on.');
        return;
      }
      badCell = g;
      g.classList.add('ccw-gbad');
      var naiveIn = naive.c >= 0 && naive.r >= 0;
      var tag = naiveIn && p.c === naive.c && p.r === naive.r ? TAG.gridStay : TAG.gridCount;
      var hint = tag === TAG.gridStay ? 'Some spins hit the edge. If there is no square that way, the counter stays put.' : 'Move one square for each spin, in order. Tap the spins as you go.';
      if (api.tries() >= 1) {
        var w1 = w[1];
        hint += ' Spin 1 is ' + (q.spins[0] === 'U' ? 'up' : 'left') + ', so the counter goes to the ' + (w1.r === 1 ? 'middle row' : 'middle column') + '. Keep going from there.';
      }
      api.check(false, hint, tag);
    });
    api.onReveal(function () {
      show();
      var parts = [];
      for (var k = 1; k < w.length; k++) {
        var stay = w[k].c === w[k - 1].c && w[k].r === w[k - 1].r;
        parts.push(k + ': ' + (q.spins[k - 1] === 'U' ? 'up' : 'left') + (stay ? ' (no space, stay put)' : ''));
      }
      api.feedback(parts.join(',  ') + '. The numbers on the grid show where the counter was after each spin (orange = stayed put).', 'info');
    });
  }

  MQ.register('crocodile-coin-walk', {
    learn: learn,
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        var wrap = el('div', { class: 'ccw-q' });
        stage.appendChild(wrap);
        if (q.type === 'trace') renderTrace(wrap, api, q);
        else if (q.type === 'reach') renderReach(wrap, api, q);
        else if (q.type === 'dots') renderDots(wrap, api, q);
        else renderGrid(wrap, api, q);
      },
    },
    // exposed for tests only
    _logic: {
      step: step,
      walk: walk,
      finish: finish,
      reachSets: reachSets,
      exampleTosses: exampleTosses,
      gWalk: gWalk,
      buildDeck: buildDeck,
    },
  });

  var css = [
    '.ccw-q,.ccw-col{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}',
    '.ccw-q .prompt{font-size:1.25rem}',
    '.ccw-path{width:100%;max-width:780px;height:auto;display:block}',
    '.ccw-grass{fill:#eef7e8}',
    '.ccw-gravel{fill:#e6dccb}',
    '.ccw-pond{fill:#9bd3ee;stroke:#3a8fb7;stroke-width:3}',
    '.ccw-ripple{fill:none;stroke:#fff;stroke-width:2.5;stroke-linecap:round}',
    '.ccw-shed{fill:#c28d5c;stroke:#6b4423;stroke-width:3}',
    '.ccw-roof{fill:#8d5a33;stroke:#6b4423;stroke-width:3;stroke-linejoin:round}',
    '.ccw-door{fill:#6b4423}',
    '.ccw-end-label{font-size:15px;font-weight:800;fill:#3d4a63}',
    '.ccw-bracket{fill:none;stroke:#8a94a8;stroke-width:2.5}',
    '.ccw-bracket-t{font-size:14px;font-weight:700;fill:#5b6478}',
    '.ccw-hit{fill:transparent}',
    '.ccw-st{fill:#b9bfc9;stroke:#7d8594;stroke-width:3}',
    '.ccw-start .ccw-st{stroke:#e0a800;stroke-width:4}',
    '.ccw-num{font-size:20px;font-weight:800;fill:#1b2a4a}',
    '.ccw-start-t{font-size:13px;font-weight:800;fill:#a87400}',
    '.ccw-fin1 .ccw-st{fill:#ffd166}',
    '.ccw-fin2 .ccw-st{fill:#a0c4ff}',
    '.ccw-fin1.ccw-fin2 .ccw-st{fill:#c3e88d}',
    '.ccw-good .ccw-st{fill:#9be3b0;stroke:#1f8a4c}',
    '.ccw-bad .ccw-st{fill:#ffc9c9;stroke:#d64545}',
    '.ccw-pickable .ccw-stone{cursor:pointer}',
    '.ccw-pickable .ccw-stone:hover .ccw-st{stroke:#1b2a4a}',
    '.ccw-counter{transition:transform .3s ease}',
    '.ccw-counter-c{fill:#e63946;stroke:#fff;stroke-width:3}',
    '.ccw-counter-shine{fill:#fff;opacity:.6}',
    '.ccw-hop{fill:none;stroke:#3a6ea5;stroke-width:2.5}',
    '.ccw-hop-stay{stroke:#e07a00;stroke-dasharray:4 3}',
    '.ccw-hop-end{fill:#3a6ea5}',
    '.ccw-hop-n{font-size:13px;font-weight:800;fill:#3a6ea5}',
    '.ccw-hop-stay-t{fill:#c26a00}',
    '.ccw-dot{fill:#7b61ff;stroke:#fff;stroke-width:1.5}',
    '.ccw-dotcount{font-size:15px;font-weight:800;fill:#5b6478}',
    '.ccw-dotcount-top{fill:#1f8a4c;font-size:18px}',
    '.ccw-coins{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;max-width:780px}',
    '.ccw-coin{position:relative;display:inline-flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:50%;font-weight:900;font-size:1.3rem;border:3px solid #b08900;background:#ffe08a;color:#5c4400;user-select:none}',
    '.ccw-coin.ccw-T{background:#e3e7ee;border-color:#7d8594;color:#2f3a4f}',
    '.ccw-coin-n{position:absolute;top:-8px;left:-6px;font-size:.7rem;font-weight:800;background:#fff;border:1.5px solid var(--line);border-radius:8px;padding:0 4px;color:var(--ink-soft)}',
    '.ccw-coin-n:empty{display:none}',
    '.ccw-tick{cursor:pointer}',
    '.ccw-done{opacity:.35}',
    '.ccw-done::after{content:"✓";position:absolute;right:-6px;bottom:-6px;font-size:1rem;color:var(--good)}',
    '.ccw-legend{display:flex;flex-wrap:wrap;justify-content:center;gap:8px 22px;font-size:1rem}',
    '.ccw-leg{display:inline-flex;align-items:center;gap:6px}',
    '.ccw-leg .ccw-coin{width:30px;height:30px;font-size:.95rem}',
    '.ccw-tossbar{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.ccw-tossbtns{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px}',
    '.ccw-count{font-weight:800;color:var(--ink-soft)}',
    '.ccw-log{min-height:46px}',
    '@keyframes ccwflip{0%{transform:scaleX(.1)}100%{transform:scaleX(1)}}',
    '.ccw-log .ccw-coin:last-child{animation:ccwflip .35s ease}',
    '.ccw-key{display:flex;align-items:center;gap:8px;font-weight:700;color:var(--ink-soft)}',
    '.ccw-sw{display:inline-block;width:18px;height:14px;border-radius:7px;border:2px solid #7d8594}',
    '.ccw-sw1{background:#ffd166}.ccw-sw2{background:#a0c4ff;margin-left:10px}',
    '.ccw-rows{width:100%;max-width:780px;height:auto}',
    '.ccw-rows-bg{fill:#f7f9fc;stroke:#dfe5ee}',
    '.ccw-rows-head{font-size:12px;font-weight:700;fill:#5b6478}',
    '.ccw-rows-head-hi{fill:#b45309;font-size:13px;font-weight:900}',
    '.ccw-rows-col{fill:#fff3cd;stroke:#e0a800;stroke-width:2}',
    '.ccw-rows-lab{font-size:13px;font-weight:700;fill:#5b6478}',
    '.ccw-rows-lab-last{fill:#1b2a4a;font-weight:900}',
    '.ccw-cell-on{fill:#b7e4c7}',
    '.ccw-cell-last{fill:#2d9d5c}',
    '.ccw-cell-off{fill:#e9edf3}',
    '.ccw-cap{font-weight:800;color:var(--ink-soft)}',
    '.ccw-gridrow{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:18px 30px;width:100%}',
    '.ccw-gridrow .ccw-col{width:auto}',
    '.ccw-grid{width:290px;max-width:100%;height:auto}',
    '.ccw-gsq{fill:#fff;stroke:#7d8594;stroke-width:2.5}',
    '.ccw-gfin{fill:#e6f6ec}',
    '.ccw-gstart{fill:#fff7dc}',
    '.ccw-glab{font-size:14px;font-weight:800;fill:#3d4a63}',
    '.ccw-pickable .ccw-gcell{cursor:pointer}',
    '.ccw-pickable .ccw-gcell:hover .ccw-gsq{fill:#f1f5ff}',
    '.ccw-gbad .ccw-gsq{fill:#ffc9c9}',
    '.ccw-ggood .ccw-gsq{fill:#9be3b0}',
    '.ccw-badge{fill:#3a6ea5}',
    '.ccw-badge-stay{fill:#e07a00}',
    '.ccw-badge-t{font-size:11px;font-weight:800;fill:#fff}',
    '.ccw-spinner{width:190px;height:auto;max-width:100%}',
    '.ccw-sec-up{fill:#cfe8ff;stroke:#1b2a4a;stroke-width:2}',
    '.ccw-sec-left{fill:#ffe0c2;stroke:#1b2a4a;stroke-width:2}',
    '.ccw-sec-arrow{font-size:22px;font-weight:900;fill:#1b2a4a}',
    '.ccw-sec-word{font-size:13px;font-weight:800;fill:#1b2a4a}',
    '.ccw-needle{transition:transform .85s cubic-bezier(.2,.7,.2,1)}',
    '.ccw-needle-l{stroke:#1b2a4a;stroke-width:5;stroke-linecap:round}',
    '.ccw-needle-h{fill:#1b2a4a}',
    '.ccw-hub{fill:#e63946;stroke:#fff;stroke-width:2}',
    '.ccw-arrow{position:relative;display:inline-flex;align-items:center;padding:8px 12px;border-radius:12px;font-weight:800;border:2.5px solid #1b2a4a;user-select:none}',
    '.ccw-arrow-U{background:#cfe8ff}.ccw-arrow-L{background:#ffe0c2}',
    '@media (max-width:640px){.ccw-coin{width:38px;height:38px;font-size:1.1rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'crocodile-coin-walk' }, css));
})();

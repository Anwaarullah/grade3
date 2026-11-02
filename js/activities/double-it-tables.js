/* Double It! 2s, 4s, 8s (Unit 5.2, and the doubling part of 5.3): double the group size and the
 * answer doubles. A copy of an array slides in beside it; doubles strips; halving back. CSS prefix: dt- */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;
  var ID = 'double-it-tables';

  // Readable mistake tags for the parent dashboard
  var TAG = {
    both: 'Doubled (or halved) both numbers, not just the group size (2 × 6 → 4 × 12)',
    forgot: 'Changed the group size but forgot to double (or halve) the answer',
    wrongWay: 'Halved the wrong way (doubled when it said halve, or halved when it said double)',
    dbl: 'Doubling or halving error with a 2-digit number',
    ones: 'Counted in ones and lost count (count in 4s or 8s)',
    groups: 'Changed the number of groups',
    fact: 'Wrote the wrong numbers in the × fact',
  };

  // Things drawn in equal groups. size = how many in ONE group (each drawn so it can be counted).
  var KINDS = {
    square: { one: 'square', many: 'squares', part: 'sides', size: 4 },
    chair: { one: 'chair', many: 'chairs', part: 'legs', size: 4 },
    spider: { one: 'spider', many: 'spiders', part: 'legs', size: 8 },
    bike: { one: 'bike', many: 'bikes', part: 'wheels', size: 2 },
    car: { one: 'car', many: 'cars', part: 'wheels', size: 4 },
  };

  /* ------------------------------------------------------------------ *
   * Doubling and halving words
   * ------------------------------------------------------------------ */
  function dblParts(n) {
    var t = Math.floor(n / 10) * 10;
    return { t: t, o: n % 10 };
  }
  // "double 18 = 10 + 10 + 8 + 8" (no answer)
  function dblStart(n) {
    var d = dblParts(n);
    if (n < 10 || d.o === 0) return 'double ' + n + ' = ' + n + ' + ' + n;
    return 'double ' + n + ' = ' + d.t + ' + ' + d.t + ' + ' + d.o + ' + ' + d.o + ' = ' + 2 * d.t + ' + ' + 2 * d.o;
  }
  function dblText(n) {
    return dblStart(n) + ' = ' + 2 * n;
  }
  // Split an even number into an even number of tens and the rest: 36 → 20 + 16, 54 → 40 + 14
  function halfParts(n) {
    var t = Math.floor(n / 10) * 10;
    var o = n % 10;
    if ((t / 10) % 2 === 1) {
      t -= 10;
      o += 10;
    }
    return { t: t, o: o };
  }
  function halfStart(n) {
    var h = halfParts(n);
    if (h.t === 0 || h.o === 0) return 'half of ' + n + ': which number + the same number = ' + n + '?';
    return 'half of ' + n + ' = half of ' + h.t + ' + half of ' + h.o + ' = ' + h.t / 2 + ' + ' + h.o / 2;
  }
  function halfText(n) {
    var h = halfParts(n);
    if (h.t === 0 || h.o === 0) return 'half of ' + n + ' = ' + n / 2 + ', because ' + n / 2 + ' + ' + n / 2 + ' = ' + n;
    return halfStart(n) + ' = ' + n / 2;
  }
  function times(n, v) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(v);
    return a;
  }

  /* ------------------------------------------------------------------ *
   * Everyday objects (100 × 100 boxes)
   * ------------------------------------------------------------------ */
  var DRAW = {
    square: function (g) {
      var c = '#3a86ff';
      [[28, 20, 72, 20], [80, 28, 80, 72], [72, 80, 28, 80], [20, 72, 20, 28]].forEach(function (l) {
        g.appendChild(S('line', { x1: l[0], y1: l[1], x2: l[2], y2: l[3], stroke: c, 'stroke-width': 7, 'stroke-linecap': 'round' }));
      });
      g.appendChild(S('rect', { x: 27, y: 27, width: 46, height: 46, fill: '#e7f0ff' }));
    },
    chair: function (g) {
      [[24, 56, 90], [70, 56, 90], [33, 64, 96], [79, 64, 96]].forEach(function (l) {
        g.appendChild(S('line', { x1: l[0], y1: l[1], x2: l[0], y2: l[2], stroke: '#6f4518', 'stroke-width': 5, 'stroke-linecap': 'round' }));
      });
      g.appendChild(S('rect', { x: 22, y: 8, width: 50, height: 44, rx: 6, fill: '#ddb892', stroke: '#6f4518', 'stroke-width': 2 }));
      g.appendChild(S('path', { d: 'M20 52 L72 52 L84 64 L32 64 Z', fill: '#9c6644', stroke: '#6f4518', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
    },
    spider: function (g) {
      var ink = '#1b2a4a';
      var ys = [44, 51, 58, 65];
      var kx = [28, 32, 32, 28];
      var fy = [[26, 24], [40, 40], [60, 62], [78, 88]];
      for (var i = 0; i < 4; i++) {
        [-1, 1].forEach(function (s) {
          var x0 = 50 + s * 8;
          g.appendChild(S('polyline', { points: x0 + ',' + ys[i] + ' ' + (50 + s * kx[i]) + ',' + fy[i][0] + ' ' + (50 + s * 45) + ',' + fy[i][1], fill: 'none', stroke: ink, 'stroke-width': 3.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
        });
      }
      g.appendChild(S('ellipse', { cx: 50, cy: 60, rx: 13, ry: 17, fill: '#4a4e69' }));
      g.appendChild(S('circle', { cx: 50, cy: 38, r: 9, fill: '#22223b' }));
      g.appendChild(S('circle', { cx: 47, cy: 36, r: 2, fill: '#fff' }));
      g.appendChild(S('circle', { cx: 53, cy: 36, r: 2, fill: '#fff' }));
    },
    bike: function (g) {
      [[24, 66], [76, 66]].forEach(function (w) {
        g.appendChild(S('circle', { cx: w[0], cy: w[1], r: 18, fill: '#fff', stroke: '#1b2a4a', 'stroke-width': 4.5 }));
        g.appendChild(S('circle', { cx: w[0], cy: w[1], r: 2.5, fill: '#1b2a4a' }));
      });
      g.appendChild(S('path', { d: 'M24 66 L44 66 L62 40 L36 40 L24 66 M44 66 L36 34 M62 40 L76 66 M62 40 L60 30', fill: 'none', stroke: '#e63946', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      g.appendChild(S('rect', { x: 28, y: 29, width: 16, height: 6, rx: 3, fill: '#1b2a4a' }));
      g.appendChild(S('path', { d: 'M54 30 L68 28', stroke: '#1b2a4a', 'stroke-width': 4, 'stroke-linecap': 'round' }));
    },
    car: function (g) {
      // seen from above: four wheels at the corners
      [[17, 20], [75, 20], [17, 62], [75, 62]].forEach(function (w) {
        g.appendChild(S('rect', { x: w[0], y: w[1], width: 9, height: 18, rx: 3, fill: '#1b2a4a' }));
      });
      g.appendChild(S('rect', { x: 24, y: 8, width: 52, height: 84, rx: 14, fill: '#2a9d8f', stroke: '#1d6e64', 'stroke-width': 2 }));
      g.appendChild(S('rect', { x: 31, y: 26, width: 38, height: 14, rx: 4, fill: '#cdeffd' }));
      g.appendChild(S('rect', { x: 31, y: 64, width: 38, height: 10, rx: 4, fill: '#cdeffd' }));
    },
  };

  function objSvg(kind, size) {
    var s = S('svg', { viewBox: '0 0 100 100', width: size || 64, height: size || 64, class: 'dt-obj', 'aria-hidden': 'true' });
    var g = S('g');
    DRAW[kind](g);
    s.appendChild(g);
    return s;
  }

  /* Picture of n objects. Tap to count in jumps (4, 8, 12, ...). */
  function groupsPic(kind, n, cfg) {
    cfg = cfg || {};
    var K = KINDS[kind];
    var o = { lit: 0, locked: false };
    var wrap = el('div', { class: 'dt-pic' + (cfg.small ? ' dt-pic-sm' : ''), 'data-kind': kind });
    var cards = [];
    for (var i = 0; i < n; i++) {
      var badge = el('span', { class: 'dt-badge' }, '');
      var c = el('div', { class: 'dt-card', 'data-group': i }, objSvg(kind, cfg.small ? 42 : 64), badge);
      c.badge = badge;
      cards.push(c);
      wrap.appendChild(c);
    }
    function step() {
      if (o.lit >= n) return;
      var c2 = cards[o.lit];
      o.lit++;
      c2.classList.add('dt-lit');
      c2.badge.textContent = String(o.lit * K.size);
    }
    if (cfg.tap) {
      wrap.classList.add('dt-tap');
      wrap.addEventListener('click', function () {
        if (o.locked || o.lit >= n) return;
        MQ.sound('pop');
        step();
      });
    }
    o.el = wrap;
    o.showAll = function (later, done) {
      o.locked = true;
      wrap.classList.remove('dt-tap');
      (function tick() {
        if (o.lit >= n) {
          if (done) done();
          return;
        }
        step();
        if (later) later(tick, 260);
        else tick();
      })();
    };
    o.lock = function () {
      o.locked = true;
      wrap.classList.remove('dt-tap');
    };
    return o;
  }

  /* ------------------------------------------------------------------ *
   * The doubling array. rows = number of groups, columns = group size.
   * A copy of the whole array slides in beside it (double) or slides away (halve).
   * cfg: rows, size, steps (max doublings), start, cell, later, onChange(state)
   * ------------------------------------------------------------------ */
  var BLOCK_COLORS = ['#3a86ff', '#f4a261', '#06a77d'];
  function makeDoubler(cfg) {
    var rows = cfg.rows;
    var size = cfg.size;
    var maxSt = cfg.steps || 1;
    var GAP = 12;
    var P = 10;
    var TOP = 34;
    var cell = cfg.cell || 26;
    var widths = [size * cell];
    for (var i = 1; i <= maxSt; i++) widths.push(2 * widths[i - 1] + GAP);
    var W = 2 * P + widths[maxSt];
    var H = TOP + rows * cell + P + 2;
    var o = { state: 0, busy: false, cols: size };
    var svgEl = S('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'dt-arr', style: { maxWidth: '100%', height: 'auto' } });
    svgEl.appendChild(S('rect', { x: 1, y: TOP - 6, width: W - 2, height: rows * cell + P + 6, rx: 12, class: 'dt-tray' }));
    for (var r = 0; r < rows; r++) {
      svgEl.appendChild(S('rect', { x: 4, y: TOP + r * cell + 1, width: W - 8, height: cell - 2, rx: cell / 2 - 1, class: 'dt-band' }));
    }
    var holder = S('g');
    svgEl.appendChild(holder);
    var blocks = [];
    var colX = [];
    for (var c = 0; c < size; c++) colX.push(P + c * cell + cell / 2);

    function blockG(k, xs) {
      var g = S('g', { class: 'dt-blk', 'data-block': k });
      var x0 = xs[0] - cell / 2;
      var x1 = xs[xs.length - 1] + cell / 2;
      g.appendChild(S('rect', { x: x0 - 3, y: TOP - 3, width: x1 - x0 + 6, height: rows * cell + 6, rx: 8, class: 'dt-outline' }));
      g.appendChild(S('path', { d: 'M' + (x0 + 2) + ' ' + (TOP - 9) + ' v-5 H' + (x1 - 2) + ' v5', class: 'dt-brace', stroke: BLOCK_COLORS[k] }));
      g.appendChild(S('text', { x: (x0 + x1) / 2, y: TOP - 18, 'text-anchor': 'middle', class: 'dt-blab', fill: BLOCK_COLORS[k] }, String(xs.length)));
      for (var rr = 0; rr < rows; rr++) {
        xs.forEach(function (x) {
          g.appendChild(S('circle', { cx: x, cy: TOP + rr * cell + cell / 2, r: cell * 0.34, fill: BLOCK_COLORS[k], class: 'dt-dot' }));
        });
      }
      return g;
    }
    function offOf(k) {
      return widths[k - 1] + GAP;
    }
    function setT(g, x, anim, y) {
      g.style.transition = anim ? 'transform .65s ease, opacity .5s' : 'none';
      g.style.transform = 'translate(' + x + 'px,' + (y || 0) + 'px)';
    }
    function setH(h) {
      svgEl.setAttribute('viewBox', '0 0 ' + W + ' ' + h);
      svgEl.setAttribute('height', h);
    }
    function changed() {
      o.cols = size * Math.pow(2, o.state);
      if (cfg.onChange) cfg.onChange(o.state, o.cols);
    }
    function addBlock(k, placed) {
      var xs = colX.slice();
      var g = blockG(k, xs);
      g.xs = xs;
      holder.appendChild(g);
      blocks[k] = g;
      setT(g, placed ? offOf(k) : 0, false);
      if (placed) finishBlock(k);
      return g;
    }
    function finishBlock(k) {
      var g = blocks[k];
      g.classList.remove('dt-pending');
      g.classList.add('dt-placed');
      colX = colX.concat(g.xs.map(function (x) {
        return x + offOf(k);
      }));
      o.state = k;
    }
    blocks[0] = blockG(0, colX.slice());
    blocks[0].classList.add('dt-placed');
    holder.appendChild(blocks[0]);

    o.setState = function (st) {
      setH(H);
      o.gen = (o.gen || 0) + 1;
      o.busy = false;
      while (blocks.length > 1) holder.removeChild(blocks.pop());
      colX = colX.slice(0, size);
      o.state = 0;
      for (var k = 1; k <= st; k++) addBlock(k, true);
      changed();
    };
    o.double = function (done) {
      if (o.busy || o.state >= maxSt) return;
      var k = o.state + 1;
      var g = blocks[k] && blocks[k].classList.contains('dt-pending') ? blocks[k] : addBlock(k, false);
      g.classList.add('dt-pending');
      o.busy = true;
      var gen = o.gen;
      MQ.sound('pop');
      // force layout so the slide animates
      g.getBoundingClientRect();
      cfg.later(function () {
        if (gen === o.gen) setT(g, offOf(k), true);
      }, 30);
      cfg.later(function () {
        if (gen !== o.gen) return;
        finishBlock(k);
        o.busy = false;
        changed();
        if (done) done();
      }, 720);
    };
    o.halve = function (done) {
      if (o.busy || o.state <= 0) return;
      var k = o.state;
      var g = blocks[k];
      o.busy = true;
      var gen = o.gen;
      MQ.sound('pop');
      setT(g, 0, true);
      g.style.opacity = '0';
      cfg.later(function () {
        if (gen !== o.gen) return;
        holder.removeChild(g);
        blocks.pop();
        colX = colX.slice(0, g.xs.length);
        o.state = k - 1;
        o.busy = false;
        changed();
        if (done) done();
      }, 720);
    };
    // A pending copy the child drags to the right. Returns the unbind function.
    o.dragCopy = function (onDone) {
      var k = o.state + 1;
      var g = addBlock(k, false);
      g.classList.add('dt-pending');
      // The copy waits BELOW the array (no overlap) and slides up and across into place.
      var drop = rows * cell + 22;
      setH(H + drop);
      var start = 0;
      var target = offOf(k);
      var pos = start;
      function place(anim) {
        setT(g, pos, anim, drop * (1 - pos / target));
      }
      place(false);
      var hand = S('text', { x: g.xs[g.xs.length - 1] + cell * 0.9, y: TOP + rows * cell * 0.5 + 8, class: 'dt-hand' }, '↗');
      g.appendChild(hand);
      var base = pos;
      var unbind = MQ.ui.drag(svgEl, g, {
        start: function () {
          if (o.busy) return;
          base = pos;
        },
        move: function (p, dx) {
          if (o.busy) return;
          pos = U.clamp(base + dx, 0, target);
          place(false);
        },
        end: function () {
          if (o.busy || !g.classList.contains('dt-pending')) return;
          if (pos > target * 0.45) {
            if (hand.parentNode) g.removeChild(hand);
            o.double(finished);
          } else {
            pos = start;
            place(true);
          }
        },
      });
      o.slideNow = function () {
        if (!g.classList.contains('dt-pending') || o.busy) return;
        if (hand.parentNode) g.removeChild(hand);
        o.double(finished);
      };
      function finished() {
        setH(H);
        if (onDone) onDone();
      }
      return unbind;
    };
    o.el = el('div', { class: 'dt-arrwrap' }, svgEl);
    o.svg = svgEl;
    o.setState(cfg.start || 0);
    return o;
  }

  /* Number line 0..step*count with jumps of step, one at a time. */
  function numberLine(step, count) {
    var max = step * count;
    var L = 20;
    var R = 600;
    var y = 74;
    var sc = (R - L) / max;
    var s = S('svg', { viewBox: '0 0 620 100', width: 620, height: 100, class: 'dt-nl', style: { maxWidth: '100%', height: 'auto' } });
    s.appendChild(S('line', { x1: L - 6, y1: y, x2: R + 6, y2: y, class: 'dt-nl-line' }));
    for (var v = 0; v <= max; v++) {
      var big = v % step === 0;
      s.appendChild(S('line', { x1: L + v * sc, y1: y - (big ? 8 : 4), x2: L + v * sc, y2: y + (big ? 8 : 4), class: 'dt-nl-tick' }));
    }
    s.appendChild(S('text', { x: L, y: y + 24, 'text-anchor': 'middle', class: 'dt-nl-num' }, '0'));
    var hops = S('g');
    s.appendChild(hops);
    var o = { el: s, n: 0 };
    o.hop = function () {
      if (o.n >= count) return;
      var a = L + o.n * step * sc;
      var b = L + (o.n + 1) * step * sc;
      o.n++;
      hops.appendChild(S('path', { d: 'M' + a + ' ' + (y - 4) + ' Q' + (a + b) / 2 + ' ' + (y - 46) + ' ' + b + ' ' + (y - 4), class: 'dt-nl-hop' }));
      hops.appendChild(S('text', { x: (a + b) / 2, y: y - 30, 'text-anchor': 'middle', class: 'dt-nl-plus' }, '+' + step));
      hops.appendChild(S('text', { x: b, y: y + 24, 'text-anchor': 'middle', class: 'dt-nl-num dt-nl-on' }, String(o.n * step)));
    };
    o.play = function (later, done) {
      (function tick() {
        o.hop();
        MQ.sound('pop');
        if (o.n < count) later(tick, 380);
        else if (done) later(done, 200);
      })();
    };
    return o;
  }

  /* Doubles strip: 12 → 24 → 48 */
  function makeStrip(vals, opts) {
    opts = opts || {};
    var wrap = el('div', { class: 'dt-strip' });
    var chips = [];
    vals.forEach(function (v, i) {
      if (i) wrap.appendChild(el('span', { class: 'dt-sarrow' }, el('small', null, opts.word || 'double'), '→'));
      var c = el('span', { class: 'dt-schip' + (opts.hide && opts.hide.indexOf(i) !== -1 ? ' dt-shid' : ''), 'data-i': i }, opts.hide && opts.hide.indexOf(i) !== -1 ? '?' : String(v));
      chips.push(c);
      wrap.appendChild(c);
    });
    wrap.show = function (i) {
      chips[i].textContent = String(vals[i]);
      chips[i].classList.remove('dt-shid');
      chips[i].classList.add('dt-snew');
    };
    return wrap;
  }

  /* A × fact with some boxes to fill. parts: [a, b, p], each {v: number} or {k: key, cap: caption} */
  function factRow(parts, onEnter) {
    var row = el('div', { class: 'dt-fact' });
    var boxes = {};
    function part(x) {
      if (x.k == null) return el('span', { class: 'dt-cellw' }, el('span', { class: 'dt-num' + (x.T ? ' dt-T' : '') }, String(x.v)), x.cap ? el('span', { class: 'dt-cap' }, x.cap) : null);
      var inp = el('input', { class: 'dt-box', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: '3', 'data-slot': x.k, 'aria-label': x.cap || 'answer', placeholder: '?' });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          onEnter();
        }
      });
      inp.addEventListener('input', function () {
        inp.classList.remove('dt-good', 'dt-bad');
      });
      boxes[x.k] = inp;
      return el('span', { class: 'dt-cellw' }, inp, x.cap ? el('span', { class: 'dt-cap' }, x.cap) : null);
    }
    row.appendChild(part(parts[0]));
    row.appendChild(el('span', { class: 'dt-op' }, '×'));
    row.appendChild(part(parts[1]));
    row.appendChild(el('span', { class: 'dt-op' }, '='));
    row.appendChild(part(parts[2]));
    return {
      el: row,
      boxes: boxes,
      val: function (k) {
        var raw = boxes[k].value.trim();
        if (raw === '') return null;
        var n = U.parseNum(raw);
        return isNaN(n) ? null : n;
      },
      mark: function (k, ok) {
        boxes[k].classList.remove('dt-good', 'dt-bad');
        boxes[k].classList.add(ok ? 'dt-good' : 'dt-bad');
      },
      set: function (k, v) {
        boxes[k].value = String(v);
        boxes[k].classList.remove('dt-bad');
        boxes[k].classList.add('dt-good');
      },
      lock: function () {
        Object.keys(boxes).forEach(function (k) {
          boxes[k].disabled = true;
        });
      },
      focus: function () {
        var ks = Object.keys(boxes);
        if (ks.length) {
          try {
            boxes[ks[0]].focus({ preventScroll: true });
          } catch (e) {}
        }
      },
    };
  }

  function checkBtn(fn) {
    return el('button', { class: 'btn dt-check', type: 'button', onclick: fn }, 'Check');
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  var deck = null;

  function buildDeck() {
    var q = [];
    // Level 1 (4): picture facts. Number of groups 2-6, all different.
    var ns = U.shuffle([2, 3, 4, 5, 6]);
    var four = U.shuffle(['square', 'chair']);
    four.forEach(function (k, i) {
      q.push({ type: 'count', level: 1, kind: k, size: 4, n: ns[i], total: 4 * ns[i] });
    });
    q.push({ type: 'count', level: 1, kind: 'spider', size: 8, n: ns[2], total: 8 * ns[2] });
    q.push({ type: 'change', level: 1, story: true, dir: 'double', from: { s: 4, n: ns[3], p: 4 * ns[3] }, to: { s: 8, n: ns[3], p: 8 * ns[3] } });

    // Level 2 (3): double/halve tables. 2× ↔ 4× (× 3 to × 9), 3× ↔ 6× (× 5, 7, 8, 9)
    var n24 = U.shuffle(U.range(3, 9)).slice(0, 2);
    var dirs = U.shuffle(['double', 'halve']);
    n24.forEach(function (n, i) {
      var small = { s: 2, n: n, p: 2 * n };
      var big = { s: 4, n: n, p: 4 * n };
      q.push(dirs[i] === 'double' ? { type: 'change', level: 2, dir: 'double', from: small, to: big } : { type: 'change', level: 2, dir: 'halve', from: big, to: small });
    });
    var n36 = U.pick([5, 7, 8, 9]);
    var s3 = { s: 3, n: n36, p: 3 * n36 };
    var s6 = { s: 6, n: n36, p: 6 * n36 };
    q.push(U.pick([true, false]) ? { type: 'change', level: 2, dir: 'double', from: s3, to: s6 } : { type: 'change', level: 2, dir: 'halve', from: s6, to: s3 });

    // Level 3 (3): 2× → 4× → 8× chains, one fact given in any column, products up to 72
    var left = U.shuffle(U.range(3, 9).filter(function (n) {
      return n24.indexOf(n) === -1;
    }));
    var givens = U.shuffle([0, 1, 2]);
    for (var i = 0; i < 3; i++) {
      var n = left[i];
      q.push({ type: 'chain', level: 3, n: n, sizes: [2, 4, 8], prods: [2 * n, 4 * n, 8 * n], given: givens[i] });
    }
    return q;
  }

  /* ------------------------------------------------------------------ *
   * Practice: count a picture and write the fact (level 1)
   * ------------------------------------------------------------------ */
  function renderCount(stage, api, q) {
    var K = KINDS[q.kind];
    var s = q.size;
    var n = q.n;
    var T = q.total;
    api.say(q.kind === 'spider' ? 'Count the legs on ONE spider first. Then count in ' + s + 's!' : 'How many ' + K.part + ' on one ' + K.one + '? That is the group size.', 'think');
    stage.appendChild(MQ.ui.prompt('There are <b>' + n + ' ' + K.many + '</b>. How many <b>' + K.part + '</b> altogether? Write the fact.'));
    var pic = groupsPic(q.kind, n, { tap: true });
    var work = el('div', { class: 'dt-work' });
    var fr = factRow([{ k: 'a', cap: K.part + ' on one' }, { k: 'b', cap: K.many }, { k: 'p', cap: 'altogether' }], check);
    var btn = checkBtn(check);
    stage.appendChild(el('div', { class: 'dt-row' }, el('div', { class: 'dt-left' }, pic.el, el('div', { class: 'dt-note' }, 'Tap the picture to count in ' + s + 's.')), el('div', { class: 'dt-right' }, el('div', { class: 'dt-q' }, fr.el, btn), work)));
    fr.focus();

    function finish() {
      fr.lock();
      btn.disabled = true;
      pic.showAll(api.later);
      MQ.clear(work);
      work.appendChild(MQ.ui.sum(times(n, s), T));
      work.appendChild(el('div', { class: 'dt-say', html: n + ' groups of ' + s + ' = <b>' + s + ' × ' + n + ' = <span class="dt-T">' + T + '</span></b>' }));
      if (s === 8) work.appendChild(el('div', { class: 'dt-note' }, 'Or double the 4s: 4 × ' + n + ' = ' + 4 * n + ', ' + dblText(4 * n) + '.'));
    }
    function check() {
      if (api.isAnswered()) return;
      var a = fr.val('a');
      var b = fr.val('b');
      var p = fr.val('p');
      if (a === null || b === null || p === null) {
        api.feedback('Write a number in every box, then press Check.', 'info');
        return;
      }
      var straight = a === s && b === n;
      var turned = a === n && b === s && s !== n;
      var factorsOk = straight || turned;
      fr.mark('a', factorsOk || a === s);
      fr.mark('b', factorsOk || b === n);
      fr.mark('p', p === T);
      if (factorsOk && p === T) {
        finish();
        api.check(true, (turned ? 'Yes! We usually write the group size first: ' : 'Yes! ') + s + ' × ' + n + ' = ' + T + '. ' + n + ' groups of ' + s + '.');
        return;
      }
      var second = api.tries() >= 1;
      if (!factorsOk) {
        if (q.kind === 'spider' && (a === 4 || b === 4)) {
          api.check(false, 'Look at both sides of one spider: 4 legs + 4 legs. Double 4 is 8, so each spider has 8 legs.', TAG.fact);
        } else {
          api.check(false, second ? 'Count the ' + K.part + ' on ONE ' + K.one + ': that is the group size (' + s + '). How many ' + K.many + '? That is the number of groups.' : 'The first number is the group size: ' + K.part + ' on ONE ' + K.one + '. The second is how many ' + K.many + '.', TAG.fact);
        }
        return;
      }
      if (s === 8 && p === 4 * n) {
        api.check(false, 'That is only 4 legs for each spider. Each spider has 8 legs, so double ' + 4 * n + '.', TAG.forgot);
        return;
      }
      var jumps = U.range(1, Math.min(3, n)).map(function (i) {
        return i * s;
      }).join(', ');
      api.check(false, second ? 'Count in ' + s + 's, one jump for each ' + K.one + ': ' + jumps + (n > 3 ? ', …' : '') + ' There are ' + n + ' ' + K.many + '.' : 'Nearly! Do not count one by one. Tap each ' + K.one + ' and count in ' + s + 's.', TAG.ones);
    }
    api.onReveal(function () {
      fr.set('a', s);
      fr.set('b', n);
      fr.set('p', T);
      finish();
      api.feedback(n + ' ' + K.many + ' with ' + s + ' ' + K.part + ' each: count ' + U.range(1, n).map(function (i) {
        return i * s;
      }).join(', ') + '. So ' + s + ' × ' + n + ' = ' + T + '.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice: double or halve one fact (level 1 story, level 2 tables)
   * ------------------------------------------------------------------ */
  function renderChange(stage, api, q) {
    var dbl = q.dir === 'double';
    var small = dbl ? q.from : q.to;
    var big = dbl ? q.to : q.from;
    var n = q.to.n;
    var G = q.from.p;
    var P = q.to.p;
    if (q.story) {
      api.say('A chair has 4 legs. A spider has 8 legs: double!', 'think');
      stage.appendChild(MQ.ui.prompt('<b>' + n + ' chairs</b> have 4 × ' + n + ' = ' + G + ' legs. <b>' + n + ' spiders</b> have 8 legs each. How many spider legs?'));
    } else {
      api.say(dbl ? 'Double the group size, double the answer!' : 'Halve the group size, halve the answer!', 'think');
      stage.appendChild(MQ.ui.prompt('Follow the <b>' + (dbl ? 'double' : 'halve') + '</b> arrow. Fill in the ' + q.to.s + '× fact.'));
    }
    // book-style table: small table on the left, big on the right
    var fr = factRow([{ v: q.to.s }, { k: 'n', cap: 'groups' }, { k: 'p', cap: 'answer' }], check);
    var givenEl = el('div', { class: 'dt-given', html: q.from.s + ' × ' + q.from.n + ' = <span class="dt-T">' + G + '</span>' });
    var cellL = el('div', { class: 'dt-tcell' }, el('div', { class: 'dt-th' }, small.s + '× table'), dbl ? givenEl : fr.el);
    var cellR = el('div', { class: 'dt-tcell' }, el('div', { class: 'dt-th' }, big.s + '× table'), dbl ? fr.el : givenEl);
    var arrows = el('div', { class: 'dt-arrows' }, el('div', { class: 'dt-ar' + (dbl ? ' dt-ar-on' : '') }, 'double →'), el('div', { class: 'dt-ar' + (dbl ? '' : ' dt-ar-on') }, '← halve'));
    var table = el('div', { class: 'dt-table' }, cellL, arrows, cellR);
    var btn = checkBtn(check);
    var work = el('div', { class: 'dt-work' });
    var helpBox = el('div', { class: 'dt-help' });
    var helpBtn = el('button', { class: 'btn btn-ghost dt-helpbtn', type: 'button', onclick: function () {
      MQ.clear(helpBox);
      helpBox.appendChild(el('div', { class: 'dt-say' }, dbl ? dblStart(G) + ' = ?' : halfStart(G) + ' = ?'));
      MQ.sound('click');
    } }, dbl ? 'Doubles helper' : 'Halves helper');

    var visual;
    var arr = null;
    var pics = null;
    if (q.story) {
      pics = { a: groupsPic('chair', n, { small: true }), b: groupsPic('spider', n, { small: true, tap: true }) };
      visual = el('div', { class: 'dt-story dt-left' }, el('div', { class: 'dt-storycol' }, pics.a.el, el('div', { class: 'dt-note' }, n + ' chairs: 4 legs each')), el('div', { class: 'dt-storyar' }, 'double →'), el('div', { class: 'dt-storycol' }, pics.b.el, el('div', { class: 'dt-note' }, n + ' spiders: 8 legs each')));
    } else {
      var cap = el('div', { class: 'dt-note' });
      var toggle = el('button', { class: 'btn dt-slide', type: 'button' });
      arr = makeDoubler({
        rows: n,
        size: small.s,
        steps: 1,
        start: dbl ? 0 : 1,
        cell: n > 7 ? 22 : 26,
        later: api.later,
        onChange: function (st, cols) {
          cap.textContent = n + ' rows of ' + cols;
          toggle.textContent = st === 0 ? 'Slide in a copy →' : '← Take the copy away';
          toggle.setAttribute('data-act', st === 0 ? 'double' : 'halve');
        },
      });
      toggle.addEventListener('click', function () {
        if (arr.state === 0) arr.double();
        else arr.halve();
      });
      visual = el('div', { class: 'dt-left' }, arr.el, cap, toggle);
    }
    stage.appendChild(el('div', { class: 'dt-row' }, visual, el('div', { class: 'dt-right dt-right-wide' }, table, el('div', { class: 'dt-btnrow' }, btn, helpBtn), helpBox, work)));
    fr.focus();

    function finish() {
      fr.lock();
      btn.disabled = true;
      helpBtn.disabled = true;
      MQ.clear(helpBox);
      MQ.clear(work);
      work.appendChild(makeStrip(dbl ? [G, P] : [G, P], { word: dbl ? 'double' : 'halve' }));
      work.appendChild(el('div', { class: 'dt-say' }, dbl ? dblText(G) : halfText(G)));
      work.appendChild(el('div', { class: 'dt-note' }, 'Still ' + n + ' groups. Only the group size and the answer ' + (dbl ? 'doubled.' : 'halved.')));
      if (arr) {
        var want = dbl ? 1 : 0;
        if (arr.busy) arr.setState(want);
        else if (arr.state !== want) {
          if (dbl) arr.double();
          else arr.halve();
        }
      }
      if (pics) pics.b.showAll(api.later);
    }
    function check() {
      if (api.isAnswered()) return;
      var nv = fr.val('n');
      var pv = fr.val('p');
      if (nv === null || pv === null) {
        api.feedback('Write a number in both boxes, then press Check.', 'info');
        return;
      }
      fr.mark('n', nv === n);
      fr.mark('p', pv === P);
      if (nv === n && pv === P) {
        finish();
        api.check(true, q.to.s + ' × ' + n + ' = ' + P + '. ' + (dbl ? 'Double ' + G + ' is ' + P : 'Half of ' + G + ' is ' + P) + '. Brilliant!');
        return;
      }
      var second = api.tries() >= 1;
      if (nv !== n) {
        var both = dbl ? nv === 2 * n : nv * 2 === n;
        var what = q.story ? n + ' chairs became ' + n + ' spiders' : 'there are still ' + n + ' rows';
        if (both) api.check(false, 'You ' + (dbl ? 'doubled' : 'halved') + ' both numbers. Only the group size changes: ' + what + '. So it is ' + q.to.s + ' × ' + n + '.', TAG.both);
        else api.check(false, 'The number of groups stays the same: ' + what + '.', TAG.groups);
        return;
      }
      if (pv === G) {
        api.check(false, dbl ? 'The group size doubled, so the answer doubles too. What is double ' + G + '?' : 'The group size halved, so the answer halves too. What is half of ' + G + '?', TAG.forgot);
        return;
      }
      if (dbl ? pv < G : pv > G) {
        api.check(false, dbl ? 'The arrow says double, so the answer gets bigger than ' + G + '.' : 'The arrow says halve, so the answer gets smaller than ' + G + '.', TAG.wrongWay);
        return;
      }
      if (dbl) api.check(false, second ? dblStart(G) + ' = ?' : 'Nearly! Check double ' + G + '. Split it into tens and ones and double each part.', G >= 10 ? TAG.dbl : TAG.ones);
      else api.check(false, second ? halfStart(G) + ' = ?' : 'Nearly! Check half of ' + G + '. Which number doubled makes ' + G + '?', G >= 10 ? TAG.dbl : TAG.ones);
    }
    api.onReveal(function () {
      fr.set('n', n);
      fr.set('p', P);
      finish();
      api.feedback((dbl ? 'Double' : 'Halve') + ' the group size (' + q.from.s + ' → ' + q.to.s + ') and the answer (' + G + ' → ' + P + '). The ' + n + ' groups stay the same.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice: 2× → 4× → 8× chain (level 3)
   * ------------------------------------------------------------------ */
  function renderChain(stage, api, q) {
    var n = q.n;
    var g = q.given;
    api.say('Double to go right. Halve to go left. The ' + n + ' groups stay the same!', 'think');
    stage.appendChild(MQ.ui.prompt('One fact is given. Fill in the other two. <b>' + n + ' groups</b> in every fact.'));
    var frs = [];
    var cells = [];
    q.sizes.forEach(function (s, j) {
      var body;
      if (j === g) body = el('div', { class: 'dt-given', html: s + ' × ' + n + ' = <span class="dt-T">' + q.prods[j] + '</span>' });
      else {
        frs[j] = factRow([{ v: s }, { v: n }, { k: 'p' + j, cap: 'answer' }], check);
        body = frs[j].el;
      }
      cells.push(el('div', { class: 'dt-tcell', 'data-col': j }, el('div', { class: 'dt-th' }, s + '× table'), body));
    });
    function arrows() {
      return el('div', { class: 'dt-arrows' }, el('div', { class: 'dt-ar dt-ar-on' }, 'double →'), el('div', { class: 'dt-ar dt-ar-on' }, '← halve'));
    }
    var table = el('div', { class: 'dt-table dt-table3' }, cells[0], arrows(), cells[1], arrows(), cells[2]);
    var btn = checkBtn(check);
    var helpBox = el('div', { class: 'dt-help' });
    var G = q.prods[g];
    var helpBtn = el('button', { class: 'btn btn-ghost dt-helpbtn', type: 'button', onclick: function () {
      MQ.clear(helpBox);
      if (g < 2) helpBox.appendChild(el('div', { class: 'dt-say' }, dblStart(G) + ' = ?'));
      if (g > 0) helpBox.appendChild(el('div', { class: 'dt-say' }, halfStart(G) + ' = ?'));
      MQ.sound('click');
    } }, 'Doubles helper');
    var work = el('div', { class: 'dt-work' });
    var cap = el('div', { class: 'dt-note' });
    var bH = el('button', { class: 'btn dt-slide', type: 'button', 'data-act': 'halve' }, '← Halve');
    var bD = el('button', { class: 'btn dt-slide', type: 'button', 'data-act': 'double' }, 'Double →');
    var arr = makeDoubler({
      rows: n,
      size: 2,
      steps: 2,
      start: g,
      cell: n > 7 ? 20 : 24,
      later: api.later,
      onChange: function (st, cols) {
        cap.textContent = n + ' rows of ' + cols;
        bH.disabled = st === 0 || api.isAnswered();
        bD.disabled = st === 2 || api.isAnswered();
      },
    });
    bH.addEventListener('click', function () {
      arr.halve();
    });
    bD.addEventListener('click', function () {
      arr.double();
    });
    stage.appendChild(table);
    stage.appendChild(el('div', { class: 'dt-row' }, el('div', { class: 'dt-left' }, arr.el, cap, el('div', { class: 'dt-btnrow' }, bH, bD)), el('div', { class: 'dt-right' }, el('div', { class: 'dt-btnrow' }, btn, helpBtn), helpBox, work)));
    if (frs[g === 0 ? 1 : 0]) frs[g === 0 ? 1 : 0].focus();

    function missing() {
      return [0, 1, 2].filter(function (j) {
        return j !== g;
      });
    }
    function finish() {
      missing().forEach(function (j) {
        frs[j].lock();
      });
      btn.disabled = true;
      helpBtn.disabled = true;
      bH.disabled = true;
      bD.disabled = true;
      MQ.clear(helpBox);
      MQ.clear(work);
      work.appendChild(makeStrip(q.prods));
      work.appendChild(el('div', { class: 'dt-say' }, dblText(q.prods[0])));
      work.appendChild(el('div', { class: 'dt-say' }, dblText(q.prods[1])));
      arr.setState(2);
    }
    function check() {
      if (api.isAnswered()) return;
      var ms = missing();
      var vals = {};
      var empty = false;
      ms.forEach(function (j) {
        vals[j] = frs[j].val('p' + j);
        if (vals[j] === null) empty = true;
      });
      if (empty) {
        api.feedback('Write a number in both empty boxes, then press Check.', 'info');
        return;
      }
      ms.forEach(function (j) {
        frs[j].mark('p' + j, vals[j] === q.prods[j]);
      });
      var wrong = ms.filter(function (j) {
        return vals[j] !== q.prods[j];
      }).sort(function (a, b) {
        return Math.abs(a - g) - Math.abs(b - g);
      });
      if (!wrong.length) {
        finish();
        api.check(true, '2 × ' + n + ' = ' + q.prods[0] + ', 4 × ' + n + ' = ' + q.prods[1] + ', 8 × ' + n + ' = ' + q.prods[2] + '. Super doubling!');
        return;
      }
      var j = wrong[0];
      var nb = j > g ? j - 1 : j + 1; // the neighbour nearer the given fact (given or already right)
      var up = j > nb;
      var known = q.prods[nb];
      var v = vals[j];
      var from = q.sizes[nb] + ' × ' + n + ' = ' + known;
      var to = q.sizes[j] + ' × ' + n;
      if (v === known) {
        api.check(false, 'The group size ' + (up ? 'doubled' : 'halved') + ' (' + q.sizes[nb] + ' → ' + q.sizes[j] + '), so the answer must ' + (up ? 'double' : 'halve') + ' too. ' + from + '.', TAG.forgot);
        return;
      }
      if (up ? v < known : v > known) {
        api.check(false, to + ' is to the ' + (up ? 'right: double' : 'left: halve') + '. ' + from + ', so ' + to + ' is ' + (up ? 'bigger' : 'smaller') + ' than ' + known + '.', TAG.wrongWay);
        return;
      }
      var second = api.tries() >= 1;
      var h = up ? dblStart(known) + ' = ?' : halfStart(known) + ' = ?';
      api.check(false, second ? from + '. ' + h : 'Check ' + to + '. It is ' + (up ? 'double ' : 'half of ') + known + '.', known >= 10 ? TAG.dbl : TAG.ones);
    }
    api.onReveal(function () {
      missing().forEach(function (j) {
        frs[j].set('p' + j, q.prods[j]);
      });
      finish();
      api.feedback('Same ' + n + ' groups each time. Double: ' + q.prods.join(' → ') + '. Halve to go back.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */
  function learnBikes(stage, api) {
    api.lockNext();
    api.say('6 children have bikes. Then they swap them for toy cars!');
    stage.appendChild(MQ.ui.lesson('The group size doubles', 'A bike has <b>2</b> wheels. A car has <b>4</b> wheels.'));
    var picBox = el('div', { class: 'dt-picbox' });
    var bikes = groupsPic('bike', 6, {});
    picBox.appendChild(bikes.el);
    var cap = el('div', { class: 'dt-note' }, '6 bikes, 2 wheels each');
    var f1 = el('div', { class: 'dt-say', html: '6 groups of 2 = 2 × 6 = <span class="dt-T">12</span>' });
    var right = el('div', { class: 'dt-right' }, MQ.ui.sum(times(6, 2), 12), f1);
    var swap = el('button', { class: 'btn dt-swap', type: 'button', 'data-act': 'swap' }, 'Swap bikes for cars 🔁');
    right.appendChild(swap);
    swap.addEventListener('click', function () {
      swap.disabled = true;
      MQ.sound('pop');
      MQ.clear(picBox);
      var cars = groupsPic('car', 6, {});
      picBox.appendChild(cars.el);
      cap.textContent = '6 cars, 4 wheels each';
      swap.style.display = 'none';
      right.appendChild(MQ.ui.sum(times(6, 4), 24));
      right.appendChild(el('div', { class: 'dt-say', html: '6 groups of 4 = 4 × 6 = <span class="dt-T">24</span>' }));
      right.appendChild(makeStrip([12, 24]));
      api.say('Same number of groups, twice as many in each. So the answer doubles!', 'cheer');
      api.feedback('Still 6 groups. 2 → 4 in each group, so 12 → 24.', 'good');
      api.unlockNext();
    });
    stage.appendChild(el('div', { class: 'dt-row' }, el('div', { class: 'dt-left' }, picBox, cap), right));
  }

  function learnSlide(stage, api) {
    api.lockNext();
    api.say('Here are 6 rows of 2. Drag the copy across to sit beside it!');
    stage.appendChild(MQ.ui.lesson('See the doubling', 'Rows = number of groups. Columns = group size. We write <b>group size × number of groups</b>.'));
    var fact = el('div', { class: 'dt-say', html: '6 rows of 2 = 2 × 6 = <span class="dt-T">12</span>' });
    var nlBox = el('div', { class: 'dt-nlbox' });
    var arr = makeDoubler({ rows: 6, size: 2, steps: 1, cell: 32, later: api.later });
    var slideBtn = el('button', { class: 'btn dt-slide', type: 'button', 'data-act': 'double' }, 'Slide the copy →');
    var unbind = arr.dragCopy(function () {
      slideBtn.disabled = true;
      fact.innerHTML = '6 rows of 4 = 4 × 6 = <span class="dt-T">24</span>';
      api.feedback('Each row now has 4. Count in 4s…', 'good');
      var nl = numberLine(4, 6);
      nlBox.appendChild(nl.el);
      nl.play(api.later, function () {
        nlBox.appendChild(makeStrip([12, 24]));
        api.say('4, 8, 12, 16, 20, 24! Double 12 is 24.', 'cheer');
        api.feedback('Still 6 rows. The group size doubled (2 → 4), so 12 doubled to 24.', 'good');
        api.unlockNext();
      });
    });
    api.cleanup(unbind);
    slideBtn.addEventListener('click', function () {
      arr.slideNow();
    });
    stage.appendChild(el('div', { class: 'dt-row' }, el('div', { class: 'dt-left' }, arr.el, el('div', { class: 'dt-note' }, 'Drag the copy, or press the button.')), el('div', { class: 'dt-right' }, fact, slideBtn)));
    stage.appendChild(nlBox);
  }

  function learnAgain(stage, api) {
    api.lockNext();
    api.say('A spider has 8 legs. Double the 4s to get the 8s!');
    stage.appendChild(MQ.ui.lesson('Double again', '6 spiders. Each spider has <b>8</b> legs: double 4.'));
    var fact = el('div', { class: 'dt-say', html: '6 rows of 4 = 4 × 6 = <span class="dt-T">24</span>' });
    var strip = makeStrip([12, 24, 48], { hide: [2] });
    var how = el('div', { class: 'dt-help' });
    var arr = makeDoubler({ rows: 6, size: 2, steps: 2, start: 1, cell: 26, later: api.later });
    var slideBtn = el('button', { class: 'btn dt-slide', type: 'button', 'data-act': 'double' }, 'Slide the copy →');
    var unbind = arr.dragCopy(function () {
      slideBtn.disabled = true;
      fact.innerHTML = '6 rows of 8 = 8 × 6 = <span class="dt-T">48</span>';
      strip.show(2);
      how.appendChild(el('div', { class: 'dt-say' }, dblText(24)));
      api.say('Double 24 is 48. 6 spiders have 48 legs!', 'cheer');
      api.feedback('2s → 4s → 8s: double, then double again. 12 → 24 → 48.', 'good');
      api.unlockNext();
    });
    api.cleanup(unbind);
    slideBtn.addEventListener('click', function () {
      arr.slideNow();
    });
    var spider = el('div', { class: 'dt-spider' }, objSvg('spider', 90), el('div', { class: 'dt-note' }, '4 legs + 4 legs = 8'));
    stage.appendChild(el('div', { class: 'dt-row' }, el('div', { class: 'dt-left' }, arr.el, slideBtn), el('div', { class: 'dt-right' }, spider, fact, strip, how)));
  }

  function learnHalve(stage, api) {
    api.lockNext();
    api.say('Arrows go both ways. Halve the 4s to get the 2s!');
    stage.appendChild(MQ.ui.lesson('Halving back', 'Halve the group size and halve the answer. The groups stay the same.'));
    var cap = el('div', { class: 'dt-note' }, '9 rows of 4');
    var arr = makeDoubler({
      rows: 9,
      size: 2,
      steps: 1,
      start: 1,
      cell: 24,
      later: api.later,
      onChange: function (st, cols) {
        cap.textContent = '9 rows of ' + cols;
      },
    });
    var leftFact = el('div', { class: 'dt-given dt-dim' }, '2 × 9 = ?');
    var table = el(
      'div',
      { class: 'dt-table' },
      el('div', { class: 'dt-tcell' }, el('div', { class: 'dt-th' }, '2× table'), leftFact),
      el('div', { class: 'dt-arrows' }, el('div', { class: 'dt-ar' }, 'double →'), el('div', { class: 'dt-ar dt-ar-on' }, '← halve')),
      el('div', { class: 'dt-tcell' }, el('div', { class: 'dt-th' }, '4× table'), el('div', { class: 'dt-given', html: '4 × 9 = <span class="dt-T">36</span>' }))
    );
    var quiz = el('div', { class: 'dt-quiz' });
    var halveBtn = el('button', { class: 'btn dt-slide', type: 'button', 'data-act': 'halve' }, '← Halve it');
    halveBtn.addEventListener('click', function () {
      if (arr.busy || arr.state === 0) return;
      halveBtn.disabled = true;
      arr.halve(ask);
    });
    function ask() {
      api.say('9 rows of 2 now. Half of 36 is…?', 'think');
      quiz.appendChild(el('div', { class: 'dt-note' }, '2 × 9 = ?'));
      var ch = MQ.ui.choices(
        U.shuffle([18, 36, 72]),
        function (v) {
          if (v === 18) {
            ch.mark(18, 'good');
            ch.disable();
            api.sound('correct');
            leftFact.classList.remove('dt-dim');
            leftFact.innerHTML = '2 × 9 = <span class="dt-T">18</span>';
            quiz.appendChild(el('div', { class: 'dt-say' }, halfText(36)));
            api.say('Yes! Half of 36 is 18. Check: double 18 = 10 + 10 + 8 + 8 = 36.', 'cheer');
            api.feedback('4 × 9 = 36, so 2 × 9 = 18. Let\'s practise!', 'good');
            api.unlockNext();
          } else {
            ch.mark(v, 'bad');
            api.sound('wrong');
            api.feedback(v === 72 ? '72 is double 36. Halve means make it smaller: half of 36.' : 'The group size halved, so the answer halves too. Half of 36?', 'try');
          }
        },
        { columns: 3 }
      );
      ch.classList.add('dt-choices');
      ch.buttons.forEach(function (b) {
        b.setAttribute('data-value', b.value_);
      });
      quiz.appendChild(ch);
    }
    stage.appendChild(el('div', { class: 'dt-row' }, el('div', { class: 'dt-left' }, arr.el, cap), el('div', { class: 'dt-right dt-right-wide' }, table, halveBtn, quiz)));
  }

  /* ------------------------------------------------------------------ */
  MQ.register(ID, {
    learn: [learnBikes, learnSlide, learnAgain, learnHalve],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'count') return renderCount(stage, api, q);
        if (q.type === 'chain') return renderChain(stage, api, q);
        return renderChange(stage, api, q);
      },
    },
  });

  MQ._test = MQ._test || {};
  MQ._test[ID] = {
    buildDeck: buildDeck,
    dblText: dblText,
    halfText: halfText,
    deck: function () {
      return deck;
    },
  };

  var css = [
    '.dt-row{display:flex;gap:22px;align-items:flex-start;justify-content:center;flex-wrap:wrap;width:100%}',
    '.dt-left{display:flex;flex-direction:column;align-items:center;gap:8px;flex:0 1 auto;min-width:0;max-width:100%}',
    '.dt-right{display:flex;flex-direction:column;align-items:center;gap:10px;flex:1 1 280px;min-width:0;max-width:460px}',
    '.dt-right-wide{max-width:620px;flex-basis:420px}',
    '.dt-pic{display:grid;grid-template-columns:repeat(3,auto);gap:6px 10px;justify-content:center}',
    '.dt-pic-sm{gap:4px 5px}','.dt-pic-sm .dt-card{min-width:0;padding:2px 4px 0}',
    '.dt-tap{cursor:pointer}',
    '.dt-card{display:flex;flex-direction:column;align-items:center;padding:4px 6px 2px;border-radius:12px;border:2px solid var(--line);background:#fff;min-width:60px}',
    '.dt-card.dt-lit{background:#fff8e1;border-color:var(--gold)}',
    '.dt-badge{font-weight:800;font-size:1.05rem;color:#b45309;min-height:1.3em;line-height:1.3em}',
    '.dt-pic-sm .dt-badge{font-size:.95rem}',
    '.dt-obj{display:block}',
    '.dt-picbox{display:flex;justify-content:center}',
    '.dt-arrwrap{display:flex;justify-content:center;max-width:100%}',
    '.dt-arr{display:block;overflow:visible;user-select:none}',
    '.dt-tray{fill:#f4f7ff;stroke:#c3cde0;stroke-width:2}',
    '.dt-band{fill:rgba(27,42,74,.05)}',
    '.dt-outline{fill:none;stroke:transparent;stroke-width:2.5}',
    '.dt-pending .dt-outline{stroke:#e09f00;stroke-dasharray:6 4;fill:rgba(255,232,163,.35)}',
    '.dt-pending{cursor:grab}',
    '.dt-pending .dt-dot{opacity:.3}',
    '.dt-pending .dt-blab,.dt-pending .dt-brace{opacity:0}',
    '.dt-brace{fill:none;stroke-width:2.5}',
    '.dt-blab{font-weight:800;font-size:17px}',
    '.dt-dot{stroke:rgba(0,0,0,.18);stroke-width:1}',
    '.dt-hand{font-size:30px;font-weight:800;fill:#e09f00}',
    '.dt-nlbox{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;max-width:640px}',
    '.dt-nl{display:block}',
    '.dt-nl-line{stroke:var(--ink);stroke-width:2.5}',
    '.dt-nl-tick{stroke:var(--ink);stroke-width:2}',
    '.dt-nl-num{font-size:15px;font-weight:700;fill:var(--ink-soft)}',
    '.dt-nl-on{fill:#b45309;font-weight:800}',
    '.dt-nl-hop{fill:none;stroke:#e09f00;stroke-width:3}',
    '.dt-nl-plus{font-size:14px;font-weight:800;fill:#b07800}',
    '.dt-strip{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center}',
    '.dt-schip{min-width:54px;text-align:center;font-size:1.5rem;font-weight:800;padding:4px 10px;border-radius:12px;background:#fff3cd;border:2px solid var(--gold)}',
    '.dt-schip.dt-shid{background:var(--paper-2);border-style:dashed;color:var(--ink-soft)}',
    '.dt-schip.dt-snew{background:var(--good-bg);border-color:var(--good)}',
    '.dt-sarrow{display:flex;flex-direction:column;align-items:center;font-weight:800;color:#b07800;line-height:1}',
    '.dt-sarrow small{font-size:.8rem}',
    '.dt-say{font-size:1.3rem;font-weight:800;text-align:center;background:#fff;border:2px solid var(--line);border-radius:14px;padding:6px 14px}',
    '.dt-note{font-size:1.05rem;font-weight:700;color:var(--ink-soft);text-align:center}',
    '.dt-T{color:#b45309;background:#fff3cd;border-radius:6px;padding:0 4px}',
    '.dt-work{display:flex;flex-direction:column;align-items:center;gap:8px}',
    '.dt-help{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.dt-help .dt-say{font-size:1.15rem;background:var(--info-bg)}',
    '.dt-q{display:flex;flex-direction:column;align-items:center;gap:10px}',
    '.dt-fact{display:flex;align-items:flex-start;gap:6px;font-size:1.6rem;font-weight:800}',
    '.dt-cellw{display:flex;flex-direction:column;align-items:center;gap:2px}',
    '.dt-cap{font-size:.78rem;font-weight:700;color:var(--ink-soft);max-width:90px;text-align:center;line-height:1.1}',
    '.dt-num{display:inline-block;min-width:34px;height:50px;line-height:50px;text-align:center}',
    '.dt-op{height:50px;line-height:50px;color:var(--ink-soft)}',
    '.dt-box{width:64px;height:50px;border-radius:10px;border:3px solid #9aa8c7;background:#fff;font-size:1.5rem;font-weight:800;text-align:center;color:var(--ink);padding:0}',
    '.dt-box:focus{outline:4px solid var(--accent);outline-offset:1px}',
    '.dt-box.dt-good{border-color:var(--good);background:var(--good-bg)}',
    '.dt-box.dt-bad{border-color:var(--try);background:var(--try-bg)}',
    '.dt-box:disabled{color:var(--ink)}',
    '.dt-table{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;background:var(--paper);border:2px solid var(--line);border-radius:16px;padding:8px 12px}',
    '.dt-tcell{display:flex;flex-direction:column;align-items:center;gap:4px}',
    '.dt-th{font-weight:800;color:var(--ink-soft);font-size:.95rem}',
    '.dt-given{font-size:1.6rem;font-weight:800;min-height:50px;line-height:50px;padding:0 8px}',
    '.dt-dim{color:var(--ink-soft);opacity:.7}',
    '.dt-arrows{display:flex;flex-direction:column;gap:4px;align-items:center}',
    '.dt-ar{font-weight:800;font-size:1rem;padding:2px 8px;border-radius:10px;color:#9aa8c7;border:2px solid transparent;white-space:nowrap}',
    '.dt-ar-on{color:#b07800;background:#fff3cd;border-color:var(--gold)}',
    '.dt-table3 .dt-fact,.dt-table3 .dt-given{font-size:1.4rem}',
    '.dt-table3 .dt-box{width:58px}',
    '.dt-btnrow{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.dt-check,.dt-slide,.dt-swap{font-size:1.15rem}',
    '.dt-helpbtn{font-size:1rem}',
    '.dt-story{flex-direction:row !important;align-items:center !important;justify-content:center;gap:10px !important;flex-wrap:wrap}',
    '.dt-storycol{display:flex;flex-direction:column;align-items:center;gap:4px}',
    '.dt-storyar{font-weight:800;color:#b07800;background:#fff3cd;border:2px solid var(--gold);border-radius:10px;padding:2px 8px}',
    '.dt-spider{display:flex;flex-direction:column;align-items:center}',
    '.dt-quiz{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.dt-choices{max-width:360px}',
    '.dt-choices .choice{font-size:1.4rem}',
    '@media (max-width:700px){.dt-row{gap:12px}.dt-fact,.dt-given{font-size:1.3rem}.dt-box{width:54px}.dt-table{gap:6px;padding:6px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

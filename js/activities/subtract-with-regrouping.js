/* Take away with swaps — subtract 1-, 2- and 3-digit numbers from a 3-digit number,
 * opening a ten into 10 ones when there are not enough ones (Unit 3.2).
 * Only the ones are regrouped: no question needs a hundred changed into tens. */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;
  var ID = 'subtract-with-regrouping';
  var P = 'swr-';

  /* ---------------- maths helpers ---------------- */
  function r10(n) {
    return Math.round(n / 10) * 10; // 5 rounds up
  }
  function dig(n) {
    return { h: Math.floor(n / 100), t: Math.floor(n / 10) % 10, o: n % 10 };
  }
  function needsSwap(n, m) {
    return n % 10 < m % 10;
  }
  // Only the ones may regroup: after any swap the tens and hundreds must still be enough.
  function okSub(n, m) {
    var a = dig(n), b = dig(m);
    var c = a.o < b.o ? 1 : 0;
    return a.t - c >= b.t && a.h >= b.h && n > m;
  }
  // "Take the small digit from the big one" in every column (262 - 37 -> 235).
  function smallFromBig(n, m) {
    var a = dig(n), b = dig(m);
    return Math.abs(a.h - b.h) * 100 + Math.abs(a.t - b.t) * 10 + Math.abs(a.o - b.o);
  }
  function estOptions(n, m) {
    var E = r10(n) - r10(m);
    var fl = Math.floor(n / 10) * 10 - Math.floor(m / 10) * 10;
    var ce = Math.ceil(n / 10) * 10 - Math.ceil(m / 10) * 10;
    var pool = U.shuffle([fl, ce, E - 10, E + 10]).concat([r10(n) + r10(m), E + 100]).filter(function (v, i, arr) {
      return v !== E && v > 0 && arr.indexOf(v) === i;
    });
    return { E: E, options: U.shuffle([E, pool[0], pool[1]]) };
  }

  /* ---------------- base-ten mat (drawn to scale: cube 10, ten 10x100, hundred 100x100) ---------------- */
  var PITCH = 13; // spacing of ones in the ten-frames
  function blockMat(opts) {
    opts = opts || {};
    var maxFlats = Math.max(1, opts.maxFlats || 1);
    var fcols = Math.min(5, maxFlats);
    var frows = Math.ceil(maxFlats / fcols);
    var PAD = 12, HEAD = 30;
    var hW = fcols * 100 + (fcols - 1) * 8 + PAD * 2;
    var tW = 9 * 16 - 6 + PAD * 2;
    var oW = 5 * PITCH + PAD * 2 + 6;
    var bodyH = Math.max(frows * 108 - 8, 100) + PAD * 2;
    var xT = hW + 4, xO = xT + tW + 4;
    var W0 = xO + oW;
    var W = W0 + (opts.extraW || 0);
    var H = HEAD + bodyH + (opts.extraH || 0);
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: P + 'mat', width: W, height: H, style: { width: Math.min(W * (opts.scale || 1.45), 860) + 'px' }, role: 'img', 'aria-label': 'Base ten blocks' });
    [['Hundreds', 0, hW, 'h'], ['Tens', xT, tW, 't'], ['Ones', xO, oW, 'o']].forEach(function (c) {
      root.appendChild(svg('rect', { x: c[1], y: 0, width: c[2], height: HEAD + bodyH, rx: 10, class: P + 'col ' + P + 'col-' + c[3] }));
      root.appendChild(svg('text', { x: c[1] + c[2] / 2, y: 21, 'text-anchor': 'middle', class: P + 'colhead' }, c[0]));
    });
    var layer = svg('g');
    var extra = svg('g');
    root.appendChild(layer);
    root.appendChild(extra);
    function gridPath(x, y, w, h) {
      var d = '';
      for (var k = 1; k < w / 10; k++) d += 'M' + (x + k * 10) + ' ' + y + 'v' + h;
      for (var j = 1; j < h / 10; j++) d += 'M' + x + ' ' + (y + j * 10) + 'h' + w;
      return d;
    }
    function block(kind, i, cls, x, y) {
      var w = kind === 'h' ? 100 : 10, h = kind === 'o' ? 10 : 100;
      var g = svg('g', { class: P + 'blk ' + P + 'blk-' + kind + ' ' + P + cls.split(' ').join(' ' + P) });
      g.appendChild(svg('rect', { x: x, y: y, width: w, height: h, rx: kind === 'o' ? 1.5 : 2 }));
      if (kind !== 'o') g.appendChild(svg('path', { d: gridPath(x, y, w, h), class: P + 'gl' }));
      if (cls.indexOf('gone') !== -1) g.appendChild(svg('path', { d: 'M' + x + ' ' + y + 'L' + (x + w) + ' ' + (y + h) + 'M' + (x + w) + ' ' + y + 'L' + x + ' ' + (y + h), class: P + 'x' }));
      if (opts.onBlock) {
        g.addEventListener('click', function () {
          opts.onBlock(kind, i);
        });
      }
      return g;
    }
    function render(st) {
      MQ.clear(layer);
      (st.h || []).forEach(function (cls, i) {
        layer.appendChild(block('h', i, cls, PAD + (i % fcols) * 108, HEAD + PAD + Math.floor(i / fcols) * 108));
      });
      (st.t || []).forEach(function (cls, i) {
        layer.appendChild(block('t', i, cls, xT + PAD + i * 16, HEAD + PAD));
      });
      (st.o || []).forEach(function (cls, i) {
        var f = Math.floor(i / 10), k = i % 10;
        layer.appendChild(block('o', i, cls, xO + PAD + 4 + (k % 5) * PITCH, HEAD + PAD + f * (2 * PITCH + 12) + Math.floor(k / 5) * PITCH));
      });
      // ten-frame outlines so "10 ones" is easy to see
      var frames = Math.max(1, Math.ceil((st.o || []).length / 10));
      for (var f = 0; f < frames; f++) {
        layer.insertBefore(svg('rect', { x: xO + PAD + 1, y: HEAD + PAD - 3 + f * (2 * PITCH + 12), width: 5 * PITCH + 3, height: 2 * PITCH + 3, rx: 4, class: P + 'frame' }), layer.firstChild);
      }
    }
    return { svg: root, render: render, extra: extra, W0: W0, W: W, H: H, HEAD: HEAD, bodyH: bodyH, xO: xO, oW: oW, xT: xT };
  }
  function fill(n, cls) {
    var d = dig(n), st = { h: [], t: [], o: [] };
    for (var i = 0; i < d.h; i++) st.h.push(cls);
    for (i = 0; i < d.t; i++) st.t.push(cls);
    for (i = 0; i < d.o; i++) st.o.push(cls);
    return st;
  }
  /* ---------------- empty number line ---------------- */
  // jumps drawn left to right from start; shown = how many are drawn
  function jumpLine(start, jumps, shown, opts) {
    opts = opts || {};
    var W = 760, H = 150, L = 40, R = 40, Y = 100;
    var total = jumps.reduce(function (s, j) { return s + j; }, 0);
    var avail = W - L - R;
    var ws = jumps.map(function (j) { return Math.max(90, (j / total) * avail); });
    var sw = ws.reduce(function (s, w) { return s + w; }, 0);
    ws = ws.map(function (w) { return (w * avail) / sw; });
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: P + 'line', width: W, height: H });
    root.appendChild(svg('line', { x1: 10, y1: Y, x2: W - 10, y2: Y, class: P + 'nl-base' }));
    var x = L, v = start;
    function mark(xx, val, cls) {
      root.appendChild(svg('line', { x1: xx, y1: Y - 10, x2: xx, y2: Y + 10, class: P + 'nl-tick' }));
      root.appendChild(svg('text', { x: xx, y: Y + 34, 'text-anchor': 'middle', class: P + 'nl-num ' + (cls || '') }, String(val)));
    }
    mark(x, start, P + 'nl-start');
    jumps.forEach(function (j, i) {
      var x2 = x + ws[i];
      if (i < shown) {
        var mid = (x + x2) / 2;
        root.appendChild(svg('path', { d: 'M' + (x + 3) + ' ' + (Y - 4) + ' Q' + mid + ' ' + (Y - 70) + ' ' + (x2 - 3) + ' ' + (Y - 4), class: P + 'nl-arc' }));
        root.appendChild(svg('path', { d: 'M' + (x2 - 3) + ' ' + (Y - 4) + 'l-9 -5 M' + (x2 - 3) + ' ' + (Y - 4) + 'l-3 -10', class: P + 'nl-arc' }));
        root.appendChild(svg('text', { x: mid, y: Y - 44, 'text-anchor': 'middle', class: P + 'nl-jump' }, opts.jumpText ? opts.jumpText(i, j) : '+' + j));
        mark(x2, v + j, i === jumps.length - 1 ? P + 'nl-end' : '');
      }
      x = x2;
      v += j;
    });
    return root;
  }

  /* ---------------- rounding mini line (to scale: one tick per number) ---------------- */
  function roundLine(n, chosen) {
    var lo = Math.floor(n / 10) * 10, S = 30, L = 30;
    var W = L * 2 + S * 10, H = 84;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: P + 'rline', width: W, height: H });
    root.appendChild(svg('line', { x1: L - 10, y1: 40, x2: W - L + 10, y2: 40, class: P + 'nl-base' }));
    for (var k = 0; k <= 10; k++) {
      var big = k === 0 || k === 10, half = k === 5;
      root.appendChild(svg('line', { x1: L + k * S, y1: 40 - (big ? 14 : half ? 10 : 6), x2: L + k * S, y2: 40 + (big ? 14 : half ? 10 : 6), class: P + 'nl-tick' }));
    }
    [lo, lo + 10].forEach(function (v, i) {
      root.appendChild(svg('text', { x: L + i * 10 * S, y: 76, 'text-anchor': 'middle', class: P + 'nl-num' + (chosen === v ? ' ' + P + 'nl-end' : '') }, String(v)));
    });
    var px = L + (n - lo) * S;
    root.appendChild(svg('circle', { cx: px, cy: 40, r: 9, class: P + 'dot' }));
    root.appendChild(svg('text', { x: px, y: 20, 'text-anchor': 'middle', class: P + 'nl-jump' }, String(n)));
    return root;
  }


  // Open one ten: the last ten-stick becomes 10 green ones after the ones already there.
  function opened(st) {
    var o = st.o.slice();
    for (var i = 0; i < 10; i++) o.push('open');
    return { h: st.h.slice(), t: st.t.slice(0, -1), o: o };
  }
  // Take k blocks of one kind away: the last k (not already gone) are crossed out.
  function takeAway(st, kind, k) {
    var out = { h: st.h.slice(), t: st.t.slice(), o: st.o.slice() };
    var arr = out[kind];
    for (var i = arr.length - 1; i >= 0 && k > 0; i--) {
      if (arr[i].indexOf('gone') === -1) {
        arr[i] = arr[i] + ' gone';
        k--;
      }
    }
    return out;
  }
  function finalState(n, m) {
    var st = fill(n, 'a');
    if (needsSwap(n, m)) st = opened(st);
    var b = dig(m);
    st = takeAway(st, 'o', b.o);
    st = takeAway(st, 't', b.t);
    return takeAway(st, 'h', b.h);
  }

  /* ---------------- written column working ---------------- */
  // st: { open: bool (show the swap), ans: answer digits shown from the right (0-3) }
  function columnWork(n, m) {
    var box = el('div', { class: P + 'colwork', 'aria-label': 'Column working' });
    function cells(num) {
      var s = String(num);
      while (s.length < 3) s = ' ' + s;
      return s.split('');
    }
    function update(st) {
      st = st || {};
      MQ.clear(box);
      var A = cells(n), B = cells(m);
      var diff = n - m;
      var R = cells(diff);
      var a = dig(n);
      var open = needsSwap(n, m) && st.open;
      [['', '', open ? String(a.t - 1) : '', open ? '1' + a.o : '']].forEach(function (r) {
        r.forEach(function (c) {
          box.appendChild(el('span', { class: P + 'cw ' + P + 'cw-carry' }, c));
        });
      });
      box.appendChild(el('span', { class: P + 'cw ' + P + 'cw-op' }, ''));
      A.forEach(function (c, i) {
        box.appendChild(el('span', { class: P + 'cw' + (open && i > 0 ? ' ' + P + 'strike' : '') + (i === 2 ? ' ' + P + 'cw-o' : '') }, c === ' ' ? '' : c));
      });
      box.appendChild(el('span', { class: P + 'cw ' + P + 'cw-op' }, '−'));
      B.forEach(function (c, i) {
        box.appendChild(el('span', { class: P + 'cw' + (i === 2 ? ' ' + P + 'cw-o' : '') }, c === ' ' ? '' : c));
      });
      box.appendChild(el('span', { class: P + 'cw-line' }));
      box.appendChild(el('span', { class: P + 'cw ' + P + 'cw-op' }, ''));
      var shown = st.ans || 0;
      R.forEach(function (c, ci) {
        var vis = ci >= 3 - shown;
        box.appendChild(el('span', { class: P + 'cw ' + P + 'cw-ans' }, vis && c !== ' ' ? c : ''));
      });
    }
    update({});
    return { el: box, update: update };
  }

  /* ---------------- contexts ---------------- */
  var CTX1 = [
    function (n, b) { return 'A shop has <b>' + n + '</b> eggs. <b>' + b + '</b> are broken.'; },
    function (n, b) { return 'The school has <b>' + n + '</b> pencils. <b>' + b + '</b> are given out.'; },
    function (n, b) { return 'There are <b>' + n + '</b> books on a shelf. <b>' + b + '</b> are borrowed.'; },
  ];
  var CTX2 = [
    function (a, b) { return 'A store gets <b>' + a + '</b> cartons of milk. <b>' + b + '</b> are damaged. How many are left?'; },
    function (a, b) { return 'A van has <b>' + a + '</b> parcels. It delivers <b>' + b + '</b>. How many are still on the van?'; },
    function (a, b) { return 'A shop has <b>' + a + '</b> melons. It sells <b>' + b + '</b>. How many melons are left?'; },
    function (a, b) { return '<b>' + a + '</b> people are on a train. <b>' + b + '</b> get off. How many are still on?'; },
  ];
  var CTX3 = [
    function (a, b) { return 'A school has <b>' + a + '</b> children. <b>' + b + '</b> are girls. How many are boys?'; },
    function (a, b) { return '<b>' + a + '</b> children are in the museum. <b>' + b + '</b> go home. How many are still there?'; },
    function (a, b) { return 'A van had <b>' + a + '</b> parcels. It dropped off <b>' + b + '</b>. How many are left?'; },
    function (a, b) { return 'The library had <b>' + a + '</b> books on the shelves. <b>' + b + '</b> were borrowed. How many are left?'; },
  ];
  var CTXD = [
    function (a, b) { return 'The bakery sold <b>' + a + '</b> rolls on Monday and <b>' + b + '</b> on Tuesday. How many <b>more</b> on Tuesday?'; },
    function (a, b) { return 'Class 3 read <b>' + a + '</b> pages. Class 4 read <b>' + b + '</b> pages. What is the <b>difference</b>?'; },
    function (a, b) { return 'A shop had <b>' + a + '</b> visitors on Friday and <b>' + b + '</b> on Saturday. How many <b>more</b> on Saturday?'; },
  ];

  /* ---------------- deck ---------------- */
  var deck = null;
  function buildDeck() {
    var used = {};
    var q = [];
    function fresh(key) {
      if (used[key]) return false;
      used[key] = true;
      return true;
    }
    // Level 1: 3-digit minus single digit, two need a swap and one does not (or the other way round)
    var pattern = U.shuffle([true, false, U.pick([true, false])]);
    var ctx1 = U.shuffle(CTX1);
    while (q.length < 3) {
      var sw = pattern[q.length];
      var n = U.rand(1, 9) * 100 + U.rand(1, 9) * 10 + U.rand(0, 9);
      var b = U.rand(3, 9);
      if (needsSwap(n, b) !== sw || !okSub(n, b) || !fresh(n + '-' + b)) continue;
      q.push({ type: 'mat', n: n, m: b, ans: n - b, swap: sw, ctx: q.length === 1 ? ctx1[0] : null });
    }
    // Level 2: 3-digit minus 2-digit with a swap, estimate first; word problems
    var ctx2 = U.shuffle(CTX2);
    while (q.length < 6) {
      var x = U.rand(1, 9) * 100 + U.rand(2, 9) * 10 + U.rand(0, 7);
      var y = U.rand(1, 8) * 10 + U.rand(1, 9);
      if (!needsSwap(x, y) || !okSub(x, y) || !fresh(x + '-' + y)) continue;
      var eo = estOptions(x, y);
      q.push({ type: 'est', n: x, m: y, ans: x - y, est: eo.E, options: eo.options, text: ctx2[q.length - 3](x, y) });
    }
    // Level 3: 3-digit minus 3-digit word problem, difference by counting up, digit cards
    var kinds = U.shuffle(['word', 'diff', 'cards']);
    kinds.forEach(function (k) {
      for (var guard = 0; guard < 1000; guard++) {
        if (k === 'word') {
          var a = U.rand(3, 9) * 100 + U.rand(1, 9) * 10 + U.rand(0, 7);
          var c = U.rand(1, 6) * 100 + U.rand(0, 8) * 10 + U.rand(1, 9);
          if (dig(a).h <= dig(c).h || !needsSwap(a, c) || !okSub(a, c) || !fresh(a + '-' + c)) continue;
          q.push({ type: 'word', n: a, m: c, ans: a - c, est: r10(a) - r10(c), text: U.pick(CTX3)(a, c) });
          return;
        }
        if (k === 'diff') {
          var lo = U.rand(1, 8) * 100 + U.rand(0, 6) * 10 + U.rand(1, 9);
          var j1 = 10 - (lo % 10);
          var j2 = U.rand(2, 6) * 10;
          var j3 = U.rand(1, 9);
          var hi = lo + j1 + j2 + j3;
          if (Math.floor(hi / 100) !== Math.floor(lo / 100) || hi - lo >= 100 || !fresh(lo + '~' + hi)) continue;
          q.push({ type: 'diff', n: hi, m: lo, ans: hi - lo, jumps: [j1, j2, j3], text: U.pick(CTXD)(lo, hi) });
          return;
        }
        var digits = U.shuffle(U.range(1, 9)).slice(0, 4);
        var key = digits.slice().sort().join('');
        if (!fresh('cards' + key)) continue;
        var s = digits.slice().sort(function (p, r) { return p - r; });
        // canonical swap arrangement: biggest card taken away, smallest in the ones
        var canon = [s[2], s[1], s[0], s[3]];
        var cn = canon[0] * 100 + canon[1] * 10 + canon[2];
        q.push({ type: 'cards', digits: digits, canon: canon, n: cn, m: canon[3], ans: cn - canon[3] });
        return;
      }
    });
    return q;
  }

  /* ---------------- hints ---------------- */
  function diagnose(ans, n, m, api) {
    var right = n - m;
    var a = dig(n), b = dig(m);
    var sw = needsSwap(n, m);
    var steps = sw
      ? 'Ones: ' + a.o + ' is less than ' + b.o + ', so open a ten: ' + (10 + a.o) + ' − ' + b.o + ' = ' + (10 + a.o - b.o) + '. Tens: ' + a.t + ' − 1 = ' + (a.t - 1) + ', then ' + (a.t - 1) + ' − ' + b.t + ' = ' + (a.t - 1 - b.t) + '. Hundreds: ' + a.h + ' − ' + b.h + ' = ' + (a.h - b.h) + '.'
      : 'Ones: ' + a.o + ' − ' + b.o + ' = ' + (a.o - b.o) + '. Tens: ' + a.t + ' − ' + b.t + ' = ' + (a.t - b.t) + '. Hundreds: ' + a.h + ' − ' + b.h + ' = ' + (a.h - b.h) + '.';
    var r = { hint: '', tag: '' };
    if (sw && ans === smallFromBig(n, m)) {
      r.hint = 'Careful! We must take ' + b.o + ' away from ' + a.o + ', not ' + a.o + ' from ' + b.o + '. ' + a.o + ' is too few, so open a ten first.';
      r.tag = 'Took the small digit from the big one';
    } else if (sw && ans === right + 10) {
      r.hint = 'You opened a ten. Did you make the tens 1 smaller? ' + a.t + ' tens becomes ' + (a.t - 1) + '.';
      r.tag = "Swapped but didn't reduce the tens";
    } else if (!sw && ans === right - 10) {
      r.hint = 'There are enough ones: ' + a.o + ' − ' + b.o + ' works. No ten needs opening this time.';
      r.tag = 'Swapped when not needed';
    } else if (ans === n + m) {
      r.hint = 'Read the question again: we are <b>taking away</b>, not adding.';
      r.tag = 'Added instead of subtracted';
    } else if (ans === n - m * 10 || ans === n - m * 100) {
      r.hint = 'Line up the ones under the ones. ' + m + ' has ' + (m < 10 ? 'only ones' : 'tens and ones') + '.';
      r.tag = 'Lined up digits wrongly';
    } else {
      r.hint = 'Start with the ones: ' + a.o + ' − ' + b.o + '. ' + (sw ? 'Not enough ones, so open a ten.' : 'There are enough ones.');
      r.tag = sw ? 'Slip when subtracting with a swap' : 'Slip when subtracting';
    }
    if (api.tries() >= 1) r.hint += ' ' + steps;
    return r;
  }

  /* ---------------- learn screens ---------------- */
  function learnMelons(stage, api) {
    api.say('The store got 262 melons. 7 are damaged. Only 2 single melons, so click a box of 10 to open it!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('262 − 7', '1 crate = 100 melons · 1 box = 10 melons · 1 small cube = 1 melon'));
    var st = fill(262, 'a');
    var isOpen = false, done = false;
    var mat = blockMat({
      maxFlats: 2,
      onBlock: function (kind) {
        if (kind === 't') openTen();
      },
    });
    mat.svg.classList.add(P + 'can-open');
    mat.render(st);
    stage.appendChild(el('div', { class: P + 'matbox' }, mat.svg));
    var readout = el('div', { class: P + 'readout' }, '2 hundreds, 6 tens, 2 ones = 262. Can we take 7 ones from 2?');
    stage.appendChild(readout);
    var take = el('button', { class: 'btn ' + P + 'step', type: 'button' }, 'Take away 7 ▶');
    stage.appendChild(take);
    function openTen() {
      if (isOpen) return;
      isOpen = true;
      mat.svg.classList.remove(P + 'can-open');
      st = opened(st);
      mat.render(st);
      api.sound('pop');
      readout.innerHTML = '1 ten → 10 ones. Now <b>5 tens</b> and <b>12 ones</b>.';
      api.say('Now there are 12 ones. Enough to take 7!', 'happy');
    }
    take.addEventListener('click', function () {
      if (done) return;
      if (!isOpen) {
        api.sound('wrong');
        api.feedback('Only 2 ones, and we need to take 7. Click a ten-stick to open it first.', 'try');
        return;
      }
      done = true;
      take.disabled = true;
      st = takeAway(st, 'o', 7);
      mat.render(st);
      api.sound('pop');
      readout.innerHTML = '12 − 7 = 5 ones. 262 − 7 = <b>255</b> melons left.';
      api.say('255 melons left. We swapped 1 ten for 10 ones!', 'cheer');
      api.feedback('Not enough ones? Open a ten.', 'good');
      api.unlockNext();
    });
  }

  function learnEnough(stage, api) {
    api.say('Before you take away, look at the ones. Are there enough?');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Enough ones?', 'Look at the top ones digit. Can you take the bottom ones digit away from it?'));
    var items = [[178, 25], [352, 7], [469, 34]];
    var k = 0;
    var box = el('div', { class: P + 'enough' });
    stage.appendChild(box);
    function show() {
      MQ.clear(box);
      if (k >= items.length) return;
      var n = items[k][0], m = items[k][1];
      var cw = columnWork(n, m);
      cw.el.classList.add(P + 'hl-ones');
      var info = el('div', { class: P + 'readout' }, n + ' − ' + m + ': ' + (n % 10) + ' ones, take away ' + (m % 10) + '?');
      var ch = MQ.ui.choices([{ label: '✅ Yes, enough', value: 'yes' }, { label: '🔓 No, open a ten', value: 'no' }], function (v) {
        var right = needsSwap(n, m) ? 'no' : 'yes';
        if (v === right) {
          ch.mark(v, 'good');
          ch.disable();
          api.sound('correct');
          cw.update({ open: true, ans: 3 });
          info.innerHTML = (right === 'yes' ? (n % 10) + ' − ' + (m % 10) + ' works. No swap needed. ' : 'Only ' + (n % 10) + '. Open a ten: ' + (10 + (n % 10)) + ' − ' + (m % 10) + ' = ' + (10 + (n % 10) - (m % 10)) + '. ') + n + ' − ' + m + ' = <b>' + (n - m) + '</b>';
          k++;
          if (k >= items.length) {
            api.say('Great! Only open a ten when you need to.', 'cheer');
            api.feedback('Check the ones first, every time.', 'good');
            api.unlockNext();
          } else {
            api.later(show, 2200);
          }
        } else {
          ch.mark(v, 'bad');
          api.sound('wrong');
          api.feedback(right === 'yes' ? (n % 10) + ' is bigger than ' + (m % 10) + ', so we can take it away.' : (n % 10) + ' is smaller than ' + (m % 10) + '. We can\'t take ' + (m % 10) + ' from ' + (n % 10) + '.', 'try');
        }
      }, { columns: 2 });
      box.appendChild(el('div', { class: P + 'row' }, cw.el, el('div', { class: P + 'side' }, info, ch)));
    }
    show();
  }

  function learnBig(stage, api) {
    api.say('472 parcels, and the van takes 267. Estimate first, then follow the steps.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('472 − 267', 'Estimate: 470 − 270 = <b>200</b>'));
    var mat = blockMat({ maxFlats: 4, scale: 1.2 });
    var st = fill(472, 'a');
    mat.render(st);
    var cw = columnWork(472, 267);
    stage.appendChild(el('div', { class: P + 'row' }, el('div', { class: P + 'matbox' }, mat.svg), cw.el));
    var readout = el('div', { class: P + 'readout' }, 'Ones: 2 − 7? Not enough!');
    stage.appendChild(readout);
    var steps = [
      ['Open a ten', function () {
        st = opened(st);
        mat.render(st);
        cw.update({ open: true });
        readout.innerHTML = '472 = 400 + 60 + 12. Now <b>6 tens</b> and <b>12 ones</b>.';
      }],
      ['Take away 7 ones', function () {
        st = takeAway(st, 'o', 7);
        mat.render(st);
        cw.update({ open: true, ans: 1 });
        readout.innerHTML = '12 − 7 = <b>5</b> ones';
      }],
      ['Take away 6 tens', function () {
        st = takeAway(st, 't', 6);
        mat.render(st);
        cw.update({ open: true, ans: 2 });
        readout.innerHTML = '6 − 6 = <b>0</b> tens';
      }],
      ['Take away 2 hundreds', function () {
        st = takeAway(st, 'h', 2);
        mat.render(st);
        cw.update({ open: true, ans: 3 });
        readout.innerHTML = '4 − 2 = 2 hundreds. 472 − 267 = <b>205</b>. Estimate was 200: close ✓';
        api.say('205! It is close to our estimate of 200, so it makes sense.', 'cheer');
        api.feedback('Estimate, open a ten if needed, then ones, tens, hundreds.', 'good');
        api.unlockNext();
      }],
    ];
    var k = 0;
    var btn = el('button', { class: 'btn ' + P + 'step', type: 'button' }, steps[0][0] + ' ▶');
    btn.addEventListener('click', function () {
      if (k >= steps.length) return;
      api.sound('click');
      steps[k][1]();
      k++;
      if (k < steps.length) btn.textContent = steps[k][0] + ' ▶';
      else btn.hidden = true;
    });
    stage.appendChild(btn);
  }

  function learnCountUp(stage, api) {
    api.say('To find the difference between 426 and 483, count up from 426. Click the jumps!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Difference: 426 and 483', 'Jump to the next ten, then the tens, then the ones.'));
    var jumps = [4, 50, 3];
    var box = el('div', { class: P + 'linebox' });
    stage.appendChild(box);
    var shown = 0;
    function draw() {
      MQ.clear(box);
      box.appendChild(jumpLine(426, jumps, shown));
    }
    draw();
    var btns = el('div', { class: P + 'btns' });
    var readout = el('div', { class: P + 'readout' }, 'Start at 426.');
    jumps.forEach(function (j, i) {
      var b = el('button', { class: 'btn ' + P + 'jump', type: 'button', disabled: i > 0 }, '+' + j);
      b.addEventListener('click', function () {
        if (b.disabled) return;
        api.sound('pop');
        shown = i + 1;
        draw();
        b.disabled = true;
        if (i < jumps.length - 1) {
          btns.children[i + 1].disabled = false;
          readout.innerHTML = i === 0 ? '426 + 4 = <b>430</b>, a tidy ten.' : '430 + 50 = <b>480</b>. Nearly there!';
        } else {
          readout.innerHTML = '4 + 50 + 3 = <b>57</b>. So 483 − 426 = 57.';
          api.say('The jumps add up to 57. That is the difference!', 'cheer');
          api.feedback('Counting up is a great way to find a difference.', 'good');
          api.unlockNext();
        }
      });
      btns.appendChild(b);
    });
    stage.appendChild(btns);
    stage.appendChild(readout);
  }

  /* ---------------- practice ---------------- */
  function answerRow(q, api, onOk) {
    var inp = MQ.ui.numberInput({
      onSubmit: function (v) {
        if (v === q.ans) {
          inp.good();
          inp.disable();
          if (onOk) onOk();
          api.check(true);
        } else {
          inp.bad();
          var d = diagnose(v, q.n, q.m, api);
          api.check(false, d.hint, d.tag);
        }
      },
    });
    return inp;
  }
  function revealWork(stage, q, extra) {
    var cw = columnWork(q.n, q.m);
    cw.update({ open: true, ans: 3 });
    var a = dig(q.n), b = dig(q.m);
    var txt = needsSwap(q.n, q.m) ? 'Only ' + a.o + ' ones, so open a ten: ' + (10 + a.o) + ' − ' + b.o + ' = ' + (10 + a.o - b.o) + '. ' : 'Enough ones: ' + a.o + ' − ' + b.o + ' = ' + (a.o - b.o) + '. ';
    stage.appendChild(el('div', { class: P + 'reveal' }, extra || null, cw.el, el('div', { class: P + 'readout' }, txt + q.n + ' − ' + q.m + ' = ' + q.ans)));
  }

  function renderMat(stage, api, q) {
    api.say('Look at the ones first. Is a swap needed?', 'think');
    stage.appendChild(MQ.ui.prompt((q.ctx ? q.ctx(q.n, q.m) + '<br>' : '') + q.n + ' − ' + q.m + ' = ?'));
    var st = fill(q.n, 'a');
    var isOpen = false;
    var mat = blockMat({
      maxFlats: dig(q.n).h,
      onBlock: function (kind) {
        if (kind === 't' && step2) openTen(true);
      },
    });
    mat.render(st);
    stage.appendChild(el('div', { class: P + 'matbox' }, mat.svg));
    function openTen(sound) {
      if (isOpen) return;
      isOpen = true;
      st = opened(st);
      mat.render(st);
      if (sound) api.sound('pop');
    }
    var step2 = false;
    var area = el('div', { class: P + 'stepbox' });
    stage.appendChild(area);
    area.appendChild(el('div', { class: P + 'q' }, 'Enough ones to take away ' + q.m + '?'));
    var inp;
    var ch = MQ.ui.choices([{ label: '✅ Yes, enough', value: 'yes' }, { label: '🔓 No, open a ten', value: 'no' }], function (v) {
      var right = q.swap ? 'no' : 'yes';
      if (v === right) {
        ch.mark(v, 'good');
        ch.disable();
        api.sound('correct');
        goStep2();
      } else {
        ch.mark(v, 'bad');
        var a = q.n % 10;
        if (q.swap) api.check(false, 'There are only ' + a + ' ones. Can you take ' + q.m + ' away from ' + a + '?', 'Took the small digit from the big one');
        else api.check(false, 'There are ' + a + ' ones. ' + a + ' − ' + q.m + ' works, so no swap is needed.', 'Swapped when not needed');
      }
    }, { columns: 2 });
    area.appendChild(ch);
    function goStep2() {
      if (step2) return;
      step2 = true;
      if (q.swap) {
        mat.svg.classList.add(P + 'can-open');
        api.feedback('Right! Click a ten-stick to open it, then take ' + q.m + ' away.', 'info');
      } else api.feedback('Right! Take ' + q.m + ' ones away.', 'info');
      inp = answerRow(q, api);
      area.appendChild(inp.el);
      inp.focus();
    }
    api.onReveal(function () {
      ch.mark(q.swap ? 'no' : 'yes', 'good');
      ch.disable();
      goStep2();
      mat.svg.classList.remove(P + 'can-open');
      mat.render(finalState(q.n, q.m));
      inp.setValue(q.ans);
      inp.good();
      inp.disable();
      revealWork(stage, q);
    });
  }

  function renderEst(stage, api, q) {
    api.say('First estimate: round each number to the nearest 10.', 'think');
    stage.appendChild(MQ.ui.prompt(q.text));
    var stepBox = el('div', { class: P + 'stepbox' });
    stage.appendChild(stepBox);
    stepBox.appendChild(el('div', { class: P + 'q' }, 'Which is the best estimate for ' + q.n + ' − ' + q.m + '?'));
    var inp;
    var ansBox = el('div', { class: P + 'stepbox' });
    var ch = MQ.ui.choices(q.options, function (v) {
      if (v === q.est) {
        ch.mark(v, 'good');
        ch.disable();
        api.sound('correct');
        api.feedback('Yes! ' + r10(q.n) + ' − ' + r10(q.m) + ' = ' + q.est + '. Now the exact answer.', 'good');
        api.say('Good estimate! Now work it out exactly.', 'happy');
        showAnswer();
      } else {
        ch.mark(v, 'bad');
        var hint = v === r10(q.n) + r10(q.m) ? 'That is adding! We are taking away. Round each number, then subtract.' : 'Round each number to the nearest 10 first, then take away.';
        if (api.tries() >= 1) hint = q.n + ' rounds to ' + r10(q.n) + ' and ' + q.m + ' rounds to ' + r10(q.m) + '. ' + r10(q.n) + ' − ' + r10(q.m) + ' = ?';
        api.check(false, hint, v === r10(q.n) + r10(q.m) ? 'Added instead of subtracted' : 'Estimate far from the answer');
      }
    }, { columns: 3 });
    stepBox.appendChild(ch);
    stage.appendChild(ansBox);
    function showAnswer() {
      if (inp) return;
      ansBox.appendChild(el('div', { class: P + 'q' }, q.n + ' − ' + q.m + ' = ?'));
      inp = answerRow(q, api, function () {
        api.feedback(q.n + ' − ' + q.m + ' = ' + q.ans + '. Close to ' + q.est + ' ✓', 'good');
      });
      ansBox.appendChild(inp.el);
      inp.focus();
    }
    api.onReveal(function () {
      ch.mark(q.est, 'good');
      ch.disable();
      showAnswer();
      inp.setValue(q.ans);
      inp.good();
      inp.disable();
      revealWork(stage, q, el('div', { class: P + 'readout' }, 'Estimate: ' + r10(q.n) + ' − ' + r10(q.m) + ' = ' + q.est));
    });
  }

  function renderWord(stage, api, q) {
    api.say('Estimate, then take away. Ones first!', 'think');
    stage.appendChild(MQ.ui.prompt(q.text));
    stage.appendChild(el('div', { class: P + 'q' }, q.n + ' − ' + q.m + ' = ?'));
    var inp = answerRow(q, api, function () {
      api.feedback(q.n + ' − ' + q.m + ' = ' + q.ans + '. Estimate ' + r10(q.n) + ' − ' + r10(q.m) + ' = ' + q.est + ', close ✓', 'good');
    });
    stage.appendChild(inp.el);
    inp.focus();
    api.onReveal(function () {
      inp.setValue(q.ans);
      inp.good();
      inp.disable();
      revealWork(stage, q, el('div', { class: P + 'readout' }, 'Estimate: ' + r10(q.n) + ' − ' + r10(q.m) + ' = ' + q.est));
    });
  }

  function renderDiff(stage, api, q) {
    api.say('Count up from the smaller number. Add up the jumps!', 'think');
    stage.appendChild(MQ.ui.prompt(q.text));
    var holder = el('div', { class: P + 'linebox' });
    holder.appendChild(jumpLine(q.m, q.jumps, q.jumps.length, { jumpText: function () { return '+ ?'; } }));
    stage.appendChild(holder);
    stage.appendChild(el('div', { class: P + 'q' }, 'Difference between ' + q.m + ' and ' + q.n + ' = ?'));
    var inp = MQ.ui.numberInput({
      onSubmit: function (v) {
        if (v === q.ans) {
          inp.good();
          inp.disable();
          api.check(true, q.jumps.join(' + ') + ' = ' + q.ans + '. Brilliant counting!');
          return;
        }
        inp.bad();
        var hint, tag;
        if (v === q.n + q.m) {
          hint = 'A difference is how far apart they are. Count up from ' + q.m + ' to ' + q.n + '.';
          tag = 'Added instead of subtracted';
        } else if (v === q.jumps[1] + q.jumps[2] || v === q.jumps[0] + q.jumps[1] || v === q.jumps[0] + q.jumps[2]) {
          hint = 'Did you add every jump? There are 3 jumps.';
          tag = 'Missed a jump on the number line';
        } else if (v === smallFromBig(q.n, q.m) && v !== q.ans) {
          hint = 'Taking the small digit from the big one does not work here. Count up in jumps instead.';
          tag = 'Took the small digit from the big one';
        } else {
          hint = 'How far from ' + q.m + ' to the next ten, ' + (q.m + q.jumps[0]) + '? Then to ' + (q.n - q.jumps[2]) + '? Then to ' + q.n + '?';
          tag = 'Slip when counting up';
        }
        if (api.tries() >= 1) hint += ' The jumps are ' + q.jumps[0] + ', ' + q.jumps[1] + ' and ' + q.jumps[2] + '.';
        api.check(false, hint, tag);
      },
    });
    stage.appendChild(inp.el);
    inp.focus();
    api.onReveal(function () {
      MQ.clear(holder);
      holder.appendChild(jumpLine(q.m, q.jumps, q.jumps.length));
      inp.setValue(q.ans);
      inp.good();
      inp.disable();
      stage.appendChild(el('div', { class: P + 'readout' }, q.jumps.join(' + ') + ' = ' + q.ans + '. So ' + q.n + ' − ' + q.m + ' = ' + q.ans + '.'));
    });
  }

  function renderCards(stage, api, q) {
    api.say('Click the cards to make a 3-digit number take away a 1-digit number. It must need a swap!', 'think');
    stage.appendChild(MQ.ui.prompt('Make a take-away that <b>needs a swap</b>, then work it out.'));
    var slots = [null, null, null, null];
    var used = [false, false, false, false];
    var cardsRow = el('div', { class: P + 'cards' });
    var cardBtns = q.digits.map(function (d, i) {
      var b = el('button', { class: P + 'card', type: 'button', 'data-digit': d }, String(d));
      b.addEventListener('click', function () {
        if (used[i] || locked) return;
        var s = slots.indexOf(null);
        if (s < 0) return;
        api.sound('click');
        slots[s] = i;
        used[i] = true;
        draw();
      });
      cardsRow.appendChild(b);
      return b;
    });
    var slotEls = [0, 1, 2, 3].map(function (s) {
      var b = el('button', { class: P + 'slot', type: 'button', 'aria-label': 'Card space ' + (s + 1) });
      b.addEventListener('click', function () {
        if (slots[s] == null || locked) return;
        used[slots[s]] = false;
        slots[s] = null;
        draw();
      });
      return b;
    });
    var locked = false;
    var sumRow = el('div', { class: P + 'cardsum' }, slotEls[0], slotEls[1], slotEls[2], el('span', { class: P + 'op' }, '−'), slotEls[3], el('span', { class: P + 'op' }, '='));
    function draw() {
      slotEls.forEach(function (b, s) {
        b.textContent = slots[s] == null ? '' : String(q.digits[slots[s]]);
        b.classList.toggle(P + 'filled', slots[s] != null);
      });
      cardBtns.forEach(function (b, i) {
        b.disabled = used[i] || locked;
      });
    }
    var inp = MQ.ui.numberInput({
      onSubmit: function (v) {
        if (slots.indexOf(null) !== -1) {
          api.feedback('Put all 4 cards in the spaces first.', 'info');
          return;
        }
        var D = slots.map(function (i) { return q.digits[i]; });
        var n = D[0] * 100 + D[1] * 10 + D[2], m = D[3];
        if (D[2] >= m) {
          inp.bad();
          api.check(false, n + ' − ' + m + ' does not need a swap: ' + D[2] + ' ones is enough. Put a smaller digit in the ones place' + (api.tries() >= 1 ? ', like ' + q.canon[2] + ', and take away ' + q.canon[3] + '.' : '.'), 'Made one with no swap');
          return;
        }
        if (v === n - m) {
          inp.good();
          inp.disable();
          locked = true;
          draw();
          api.check(true, n + ' − ' + m + ' = ' + (n - m) + '. A swap was needed. Great!');
        } else {
          inp.bad();
          var d = diagnose(v, n, m, api);
          api.check(false, d.hint, d.tag);
        }
      },
    });
    sumRow.appendChild(inp.el);
    stage.appendChild(cardsRow);
    stage.appendChild(sumRow);
    draw();
    api.onReveal(function () {
      var D = slots.indexOf(null) === -1 ? slots.map(function (i) { return q.digits[i]; }) : null;
      if (!D || D[2] >= D[3]) {
        D = q.canon.slice();
        slots = D.map(function (d) { return q.digits.indexOf(d); });
        used = [true, true, true, true];
      }
      locked = true;
      draw();
      var n = D[0] * 100 + D[1] * 10 + D[2], m = D[3];
      inp.setValue(n - m);
      inp.good();
      inp.disable();
      revealWork(stage, { n: n, m: m, ans: n - m });
    });
  }

  MQ.register(ID, {
    learn: [learnMelons, learnEnough, learnBig, learnCountUp],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'mat') renderMat(stage, api, q);
        else if (q.type === 'est') renderEst(stage, api, q);
        else if (q.type === 'diff') renderDiff(stage, api, q);
        else if (q.type === 'cards') renderCards(stage, api, q);
        else renderWord(stage, api, q);
      },
    },
    // for automated tests only
    _deck: function () {
      return deck;
    },
    _build: buildDeck,
  });

  var css = [
    '.swr-matbox{width:100%;display:flex;justify-content:center}',
    '.swr-mat{max-width:100%;height:auto;display:block}',
    '.swr-col{fill:#f7f9ff;stroke:#c9d3ee;stroke-width:2}',
    '.swr-col-h{fill:#f3f6ff}.swr-col-t{fill:#f6fbf9}.swr-col-o{fill:#fffaf0}',
    '.swr-colhead{font-size:16px;font-weight:800;fill:#4a5a7d}',
    '.swr-blk rect{stroke-width:1.2}',
    '.swr-gl{stroke:rgba(0,0,0,.18);stroke-width:.8;fill:none}',
    '.swr-a rect{fill:#8ecae6;stroke:#2a6f97}',
    '.swr-open rect{fill:#9be3b0;stroke:#1f9d6b}',
    '.swr-blk-o.swr-open{animation:swr-in .5s ease}',
    '@keyframes swr-in{from{opacity:0}to{opacity:1}}',
    '.swr-gone rect{fill:#fff;stroke:#c9a3a3;stroke-dasharray:2 2}',
    '.swr-gone .swr-gl{stroke:rgba(0,0,0,.06)}',
    '.swr-x{stroke:#c2410c;stroke-width:1.6;opacity:.75}',
    '.swr-can-open .swr-blk-t{cursor:pointer}',
    '.swr-can-open .swr-blk-t:hover rect{stroke:#e09a00;stroke-width:2.6}',
    '.swr-can-open .swr-blk-t rect{animation:swr-pulse 1s ease-in-out infinite alternate}',
    '@keyframes swr-pulse{from{stroke-width:1.2}to{stroke-width:2.6;stroke:#e09a00}}',
    '.swr-frame{fill:#fff;stroke:#e3c98f;stroke-width:1.2;stroke-dasharray:3 2}',
    '.swr-readout{font-size:1.2rem;font-weight:700;text-align:center;max-width:720px}',
    '.swr-readout b{color:#0b6e66}',
    '.swr-row{display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:center;width:100%}',
    '.swr-row .swr-matbox{width:auto;flex:1 1 420px;min-width:0}',
    '.swr-enough{width:100%}',
    '.swr-enough .swr-row>div:last-child{display:flex;flex-direction:column;gap:10px;align-items:center;flex:1 1 300px;max-width:460px}',
    '.swr-hl-ones .swr-cw-o{background:#fff3cd;border-radius:6px}',
    '.swr-btns{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}',
    '.swr-jump{min-width:90px;font-size:1.3rem}',
    '.swr-colwork{display:grid;grid-template-columns:repeat(4,40px);font-size:2rem;font-weight:800;line-height:1.1;background:#fff;border:2px solid var(--line);border-radius:14px;padding:6px 14px;font-variant-numeric:tabular-nums;color:var(--ink)}',
    '.swr-cw{text-align:center;min-height:1.1em}',
    '.swr-cw-carry{font-size:1.1rem;color:#c2410c;align-self:end;min-height:1.3rem}',
    '.swr-cw-op{color:var(--ink-soft)}',
    '.swr-strike{text-decoration:line-through;text-decoration-color:#c2410c;text-decoration-thickness:3px;color:var(--ink-soft)}',
    '.swr-cw-line{grid-column:1 / span 4;border-top:3px solid var(--ink);margin:2px 0}',
    '.swr-cw-ans{color:#0b6e66}',
    '.swr-linebox{width:100%;display:flex;justify-content:center}',
    '.swr-line{max-width:100%;height:auto}',
    '.swr-nl-base{stroke:#1b2a4a;stroke-width:3}',
    '.swr-nl-tick{stroke:#1b2a4a;stroke-width:2}',
    '.swr-nl-num{font-size:19px;font-weight:800;fill:#1b2a4a}',
    '.swr-nl-start{fill:#2a6f97}',
    '.swr-nl-end{fill:#1f9d6b}',
    '.swr-nl-arc{fill:none;stroke:#2ec4b6;stroke-width:3;stroke-linecap:round}',
    '.swr-nl-jump{font-size:19px;font-weight:800;fill:#0b6e66}',
    '.swr-stepbox{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.swr-stepbox .choices{max-width:520px}',
    '.swr-q{font-size:1.25rem;font-weight:800;text-align:center}',
    '.swr-reveal{display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:center;width:100%}',
    '.swr-reveal .swr-colwork{font-size:1.6rem}',
    '.swr-cards{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}',
    '.swr-card{width:64px;height:80px;border-radius:12px;border:3px solid #2a6f97;background:#e8f4fb;font-size:2.2rem;font-weight:800;color:var(--ink);cursor:pointer;font-family:inherit}',
    '.swr-card:disabled{opacity:.3;cursor:default}',
    '.swr-cardsum{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.swr-slot{width:58px;height:72px;border-radius:12px;border:3px dashed var(--line);background:#fff;font-size:2rem;font-weight:800;color:var(--ink);font-family:inherit;cursor:pointer}',
    '.swr-slot.swr-filled{border-style:solid;border-color:#2a6f97;background:#e8f4fb}',
    '.swr-op{font-size:2rem;font-weight:800}',
    '@media (max-width:640px){.swr-colwork{font-size:1.5rem;grid-template-columns:repeat(4,32px)}.swr-card{width:54px;height:68px}.swr-slot{width:48px;height:62px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

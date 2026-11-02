/* Adding with swaps — add 1-, 2- and 3-digit numbers to a 3-digit number,
 * swapping 10 ones for a ten (Unit 3.1). Only the ones are ever regrouped. */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;
  var ID = 'add-with-regrouping';
  var P = 'awr-';

  /* ---------------- maths helpers ---------------- */
  function r10(n) {
    return Math.round(n / 10) * 10; // 5 rounds up
  }
  function dig(n) {
    return { h: Math.floor(n / 100), t: Math.floor(n / 10) % 10, o: n % 10 };
  }
  function needsSwap(n, m) {
    return (n % 10) + (m % 10) >= 10;
  }
  // Only the ones may regroup: tens (with carry) and hundreds must stay single digits.
  function okAdd(n, m) {
    var a = dig(n), b = dig(m);
    var c = a.o + b.o >= 10 ? 1 : 0;
    return a.t + b.t + c <= 9 && n + m <= 999;
  }
  // What you get if you write the ones total as two digits (148 + 136 -> 2714).
  function noCarryJoin(n, m) {
    var a = dig(n), b = dig(m);
    var hs = a.h + b.h, ts = a.t + b.t, os = a.o + b.o;
    return parseInt(String(hs || '') + String(hs || ts ? ts : '') + String(os), 10);
  }
  function estOptions(n, m) {
    var E = r10(n) + r10(m);
    var fl = Math.floor(n / 10) * 10 + Math.floor(m / 10) * 10;
    var ce = Math.ceil(n / 10) * 10 + Math.ceil(m / 10) * 10;
    var pool = [fl, ce, E - 10, E + 10, E + 100].filter(function (v, i, arr) {
      return v !== E && v > 0 && arr.indexOf(v) === i;
    });
    var opts = [E, pool[0], pool[1]];
    return { E: E, options: U.shuffle(opts) };
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
  function both(n, m) {
    var a = fill(n, 'a'), b = fill(m, 'b');
    return { h: a.h.concat(b.h), t: a.t.concat(b.t), o: a.o.concat(b.o) };
  }
  // Swap: the first 10 ones become one ten-stick (green) at the end of the tens.
  function swapped(st) {
    return { h: st.h.slice(), t: st.t.concat(['swap']), o: st.o.slice(10).map(function (c) { return c.replace(' glow', ''); }) };
  }
  function glowTen(st) {
    return { h: st.h, t: st.t, o: st.o.map(function (c, i) { return i < 10 ? c + ' glow' : c; }) };
  }

  /* ---------------- written column working ---------------- */
  // st: { carry: bool, ans: how many answer digits to show (from the right, 0-3) }
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
      var A = cells(n), B = cells(m), R = cells(n + m);
      var carry = needsSwap(n, m) && st.carry;
      var rows = [
        ['', '', carry ? '1' : '', ''],
        [''].concat(A),
        ['+'].concat(B),
      ];
      rows.forEach(function (r, ri) {
        r.forEach(function (c, ci) {
          box.appendChild(el('span', { class: P + 'cw ' + (ri === 0 ? P + 'cw-carry' : '') + (ci === 0 ? ' ' + P + 'cw-op' : '') }, c === ' ' ? '' : c));
        });
      });
      box.appendChild(el('span', { class: P + 'cw-line' }));
      var shown = st.ans || 0;
      box.appendChild(el('span', { class: P + 'cw ' + P + 'cw-op' }, ''));
      R.forEach(function (c, ci) {
        var vis = ci >= 3 - shown;
        box.appendChild(el('span', { class: P + 'cw ' + P + 'cw-ans' + (vis ? '' : ' ' + P + 'cw-blank') }, vis && c !== ' ' ? c : ''));
      });
    }
    update({});
    return { el: box, update: update };
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

  /* ---------------- contexts ---------------- */
  var CTX1 = [
    function (n, b) { return 'The shop has <b>' + n + '</b> pencils. <b>' + b + '</b> more arrive.'; },
    function (n, b) { return 'The bakery made <b>' + n + '</b> buns. Then <b>' + b + '</b> more.'; },
    function (n, b) { return 'A library has <b>' + n + '</b> books. Kids bring back <b>' + b + '</b> more.'; },
  ];
  var CTX2 = [
    { t: function (a, b) { return '<b>' + a + '</b> people visit the museum in the morning and <b>' + b + '</b> in the afternoon. How many altogether?'; }, first2: false },
    { t: function (a, b) { return 'The library lends <b>' + a + '</b> books on Monday and <b>' + b + '</b> on Tuesday. How many in total?'; }, first2: false },
    { t: function (a, b) { return 'A market stall has <b>' + a + '</b> apples. A box of <b>' + b + '</b> apples arrives. How many apples now?'; }, first2: true },
    { t: function (a, b) { return 'The school hall has <b>' + a + '</b> chairs out. The caretaker brings <b>' + b + '</b> more. How many chairs?'; }, first2: false },
  ];
  var CTX3 = [
    function (a, b) { return 'The bakery baked <b>' + a + '</b> cakes on Saturday and <b>' + b + '</b> on Sunday. How many cakes in total?'; },
    function (a, b) { return 'At the school show there were <b>' + a + '</b> children and <b>' + b + '</b> adults. How many people altogether?'; },
    function (a, b) { return 'A library has <b>' + a + '</b> story books and <b>' + b + '</b> fact books. How many books altogether?'; },
    function (a, b) { return 'A shop sold <b>' + a + '</b> pens last week and <b>' + b + '</b> this week. How many pens in total?'; },
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
    // Level 1: 3-digit + single digit, one swap, tens digit 0-8
    var ctx1 = U.shuffle(CTX1);
    while (q.length < 3) {
      var n = U.rand(1, 9) * 100 + U.rand(0, 8) * 10 + U.rand(2, 9);
      var b = U.rand(2, 9);
      if ((n % 10) + b < 10 || !okAdd(n, b) || !fresh(n + '+' + b)) continue;
      q.push({ type: 'mat', n: n, m: b, ans: n + b, ctx: q.length === 1 ? null : ctx1[q.length] });
    }
    // Level 2: 3-digit + 2-digit with a swap, estimate first. One with the 2-digit number first.
    var ctx2 = U.shuffle(CTX2.filter(function (c) { return !c.first2; })).slice(0, 2).concat(CTX2.filter(function (c) { return c.first2; }));
    ctx2 = U.shuffle(ctx2);
    while (q.length < 6) {
      var c2 = ctx2[q.length - 3];
      var big = U.rand(1, 8) * 100 + U.rand(0, 7) * 10 + U.rand(1, 9);
      var small = U.rand(1, 8) * 10 + U.rand(1, 9);
      if (!needsSwap(big, small) || !okAdd(big, small) || !fresh(big + '+' + small)) continue;
      var a1 = c2.first2 ? small : big, a2 = c2.first2 ? big : small;
      var eo = estOptions(a1, a2);
      q.push({ type: 'est', n: a1, m: a2, ans: big + small, est: eo.E, options: eo.options, text: c2.t(a1, a2) });
    }
    // Level 3: three different kinds
    var kinds = U.shuffle([U.pick(['word', 'line']), 'noswap', 'machine']);
    var ctx3 = U.shuffle(CTX3);
    kinds.forEach(function (k, i) {
      for (var guard = 0; guard < 500; guard++) {
        if (k === 'word' || k === 'line') {
          var x = U.rand(1, 6) * 100 + U.rand(0, 6) * 10 + U.rand(1, 9);
          var y = U.rand(1, 3) * 100 + U.rand(1, 6) * 10 + U.rand(1, 9);
          if (!needsSwap(x, y) || !okAdd(x, y) || !fresh(x + '+' + y)) continue;
          q.push({ type: k, n: x, m: y, ans: x + y, est: r10(x) + r10(y), text: ctx3[i](x, y) });
          return;
        }
        if (k === 'noswap') {
          var x2 = U.rand(1, 7) * 100 + U.rand(1, 6) * 10 + U.rand(1, 6);
          var y2 = U.pick([U.rand(1, 3) * 100, 0]) + U.rand(1, 3) * 10 + U.rand(1, 3);
          if (needsSwap(x2, y2) || !okAdd(x2, y2) || x2 + y2 > 999 || !fresh(x2 + '+' + y2)) continue;
          q.push({ type: 'noswap', n: x2, m: y2, ans: x2 + y2, est: r10(x2) + r10(y2), text: ctx3[i](x2, y2) });
          return;
        }
        // adding machine: +k to three numbers from a grid; at least two need a swap
        var kk = U.rand(2, 6) * 10 + U.rand(3, 8);
        var ins = [];
        var hs = U.shuffle(U.range(1, 8));
        var ko = kk % 10;
        var wantSwap = U.shuffle([true, true, U.pick([true, false])]);
        var tens = U.shuffle(U.range(0, 8 - Math.floor(kk / 10)));
        for (var g2 = 0; g2 < 3; g2++) {
          var ov = wantSwap[g2] ? U.rand(10 - ko, 9) : U.rand(0, 9 - ko);
          var v = hs[g2] * 100 + tens[g2] * 10 + ov;
          if (okAdd(v, kk)) ins.push(v);
        }
        if (ins.length < 3 || !fresh('m' + kk)) continue;
        q.push({ type: 'machine', k: kk, ins: ins, outs: ins.map(function (v2) { return v2 + kk; }) });
        return;
      }
    });
    return q;
  }

  /* ---------------- hints ---------------- */
  function diagnose(ans, n, m, api) {
    var right = n + m;
    var a = dig(n), b = dig(m);
    var os = a.o + b.o;
    var steps = 'Ones: ' + a.o + ' + ' + b.o + ' = ' + os + (os >= 10 ? ' → write ' + (os - 10) + ', swap 10 ones for 1 ten.' : '.') + ' Tens: ' + (os >= 10 ? '1 + ' : '') + a.t + ' + ' + b.t + ' = ' + (a.t + b.t + (os >= 10 ? 1 : 0)) + '. Hundreds: ' + (a.h + b.h) + '.';
    var r = { hint: '', tag: '' };
    if (needsSwap(n, m) && ans === right - 10) {
      r.hint = 'So close! ' + a.o + ' + ' + b.o + ' = ' + os + ' ones. That makes a new ten. Did you add it to the tens?';
      r.tag = 'Forgot the swapped ten';
    } else if (!needsSwap(n, m) && ans === right + 10) {
      r.hint = 'The ones make only ' + os + ', so there is no ten to swap. Add each column on its own.';
      r.tag = 'Swapped when not needed';
    } else if (needsSwap(n, m) && ans === noCarryJoin(n, m)) {
      r.hint = 'Only one digit fits in the ones place! ' + os + ' ones = 1 ten and ' + (os - 10) + ' ones.';
      r.tag = 'Wrote 2 digits in the ones column';
    } else if (ans === n + m * 10 || ans === n + m * 100 || ans === m + n * 10) {
      r.hint = 'Line up the ones under the ones. ' + Math.min(n, m) + ' has ' + (Math.min(n, m) < 10 ? 'only ones' : 'tens and ones') + '.';
      r.tag = 'Added a digit to the wrong column';
    } else if (ans === Math.abs(n - m)) {
      r.hint = 'Read the question again: we are <b>adding</b>, not taking away.';
      r.tag = 'Answered a different question';
    } else {
      r.hint = 'Start with the ones: ' + a.o + ' + ' + b.o + ' = ' + os + '. ' + (os >= 10 ? 'Swap 10 ones for a ten.' : 'Then add the tens.');
      r.tag = needsSwap(n, m) ? 'Slip when adding with a swap' : 'Slip when adding';
    }
    if (api.tries() >= 1) r.hint += ' ' + steps;
    return r;
  }

  /* ---------------- learn screens ---------------- */
  function learnBakery(stage, api) {
    api.say('The bakery has 148 cakes. 6 more come out of the oven. Drag them onto the mat!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('148 + 6', '1 tray = 100 cakes · 1 box = 10 cakes · 1 small cube = 1 cake'));
    var mat = blockMat({ maxFlats: 1, extraW: 150 });
    var st = fill(148, 'a');
    mat.render(st);
    // tray of 6 new cakes on the right
    var tx = mat.W0 + 20, ty = mat.HEAD + 14;
    var tray = svg('g', { class: P + 'tray' });
    tray.appendChild(svg('rect', { x: tx, y: ty, width: 110, height: 70, rx: 12, class: P + 'tray-bg' }));
    for (var i = 0; i < 6; i++) tray.appendChild(svg('rect', { x: tx + 26 + (i % 3) * PITCH * 1.6, y: ty + 16 + Math.floor(i / 3) * 20, width: 10, height: 10, rx: 1.5, class: P + 'blk-o ' + P + 'b' }));
    tray.appendChild(svg('text', { x: tx + 55, y: ty + 92, 'text-anchor': 'middle', class: P + 'tray-txt' }, '6 new cakes'));
    mat.extra.appendChild(tray);
    stage.appendChild(el('div', { class: P + 'matbox' }, mat.svg));
    var readout = el('div', { class: P + 'readout' }, '1 hundred, 4 tens, 8 ones = 148');
    stage.appendChild(readout);
    var packBtn = el('button', { class: 'btn ' + P + 'step', type: 'button', hidden: true }, '📦 Pack a box of 10');
    stage.appendChild(packBtn);
    var dropped = false;
    function drop() {
      if (dropped) return;
      dropped = true;
      tray.setAttribute('transform', '');
      tray.style.display = 'none';
      st = both(148, 6);
      mat.render(glowTen(st));
      api.sound('pop');
      readout.innerHTML = '8 + 6 = <b>14 ones</b>. That is too many for the ones place!';
      api.say('14 ones! Only 9 fit in a place. Pack 10 of them into a box.', 'think');
      packBtn.hidden = false;
    }
    api.cleanup(
      MQ.ui.drag(mat.svg, tray, {
        move: function (p, dx, dy) {
          tray.setAttribute('transform', 'translate(' + dx + ',' + dy + ')');
        },
        end: function (p) {
          var moved = tray.getAttribute('transform');
          if (p.x < mat.W0 || !moved || moved === 'translate(0,0)') drop();
          else tray.setAttribute('transform', '');
        },
      })
    );
    packBtn.addEventListener('click', function () {
      if (packBtn.disabled) return;
      packBtn.disabled = true;
      st = swapped(st);
      mat.render(st);
      api.sound('pop');
      readout.innerHTML = '1 hundred, <b>5 tens</b>, <b>4 ones</b> = <b>154</b>';
      api.say('10 ones became 1 ten. Now there are 154 cakes!', 'cheer');
      api.feedback('148 + 6 = 154. We swapped 10 ones for 1 ten.', 'good');
      api.unlockNext();
    });
  }

  function learnMat(stage, api) {
    api.say('Now two big numbers: 148 + 136. Ones first! Press the button for each step.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('148 + 136', 'Blue is 148. Orange is 136.'));
    var mat = blockMat({ maxFlats: 2 });
    var st = both(148, 136);
    mat.render(st);
    var cw = columnWork(148, 136);
    stage.appendChild(el('div', { class: P + 'row' }, el('div', { class: P + 'matbox' }, mat.svg), cw.el));
    var readout = el('div', { class: P + 'readout' }, 'Start with the ones.');
    stage.appendChild(readout);
    var steps = [
      ['Add the ones', function () {
        mat.render(glowTen(st));
        readout.innerHTML = '8 + 6 = <b>14 ones</b>. More than 9!';
        api.say('14 ones. Too many! We need a swap.', 'think');
      }],
      ['Swap 10 ones for a ten', function () {
        st = swapped(st);
        mat.render(st);
        cw.update({ carry: true, ans: 1 });
        readout.innerHTML = '14 ones = 1 ten and <b>4 ones</b>. Write 4, and a small 1 in the tens.';
      }],
      ['Add the tens', function () {
        cw.update({ carry: true, ans: 2 });
        readout.innerHTML = '1 + 4 + 3 = <b>8 tens</b>. Don\'t forget the swapped ten!';
      }],
      ['Add the hundreds', function () {
        cw.update({ carry: true, ans: 3 });
        readout.innerHTML = '1 + 1 = <b>2 hundreds</b>. 148 + 136 = <b>284</b>';
        api.say('148 + 136 = 284. Ones, then tens, then hundreds!', 'cheer');
        api.feedback('Ones first. Swap when there are 10 or more.', 'good');
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

  function learnLine(stage, api) {
    api.say('Another way: jump along a number line. 215 people are in the museum and 67 more come in.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('215 + 67', 'Jump the tens, then the ones. Split 7 into 5 + 2 to reach the next ten.'));
    var jumps = [60, 5, 2];
    var box = el('div', { class: P + 'linebox' });
    stage.appendChild(box);
    var shown = 0;
    var readout = el('div', { class: P + 'readout' }, 'Start at 215. Click the first jump.');
    var btns = el('div', { class: P + 'btns' });
    function draw() {
      MQ.clear(box);
      box.appendChild(jumpLine(215, jumps, shown));
    }
    draw();
    jumps.forEach(function (j, i) {
      var b = el('button', { class: 'btn ' + P + 'jump', type: 'button', disabled: i > 0 }, '+' + j);
      b.addEventListener('click', function () {
        if (b.disabled) return;
        api.sound('pop');
        shown = i + 1;
        draw();
        b.disabled = true;
        var land = 215 + jumps.slice(0, i + 1).reduce(function (s, x) { return s + x; }, 0);
        if (i < jumps.length - 1) {
          btns.children[i + 1].disabled = false;
          readout.innerHTML = 'Now at <b>' + land + '</b>.' + (i === 0 ? ' 7 more to go: jump 5 to reach 280.' : ' 2 more to go.');
        } else {
          readout.innerHTML = '215 + 60 + 5 + 2 = <b>282</b>';
          api.say('282 people! The jump to 280 is where the swap happens.', 'cheer');
          api.feedback('Jumping to the next ten is the same as swapping 10 ones for a ten.', 'good');
          api.unlockNext();
        }
      });
      btns.appendChild(b);
    });
    stage.appendChild(btns);
    stage.appendChild(readout);
  }

  function learnEstimate(stage, api) {
    api.say('Estimate first! Round each number to the nearest 10. Which ten is 148 nearer to?');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Estimate 148 + 136', 'Round each number to the nearest 10. Halfway (5) rounds up.'));
    var nums = [148, 136];
    var picked = [];
    var area = el('div', { class: P + 'est' });
    stage.appendChild(area);
    var result = el('div', { class: P + 'readout' });
    stage.appendChild(result);
    function ask(i) {
      var n = nums[i], lo = Math.floor(n / 10) * 10;
      var row = el('div', { class: P + 'est-row' });
      var lineHolder = el('div', null, roundLine(n));
      row.appendChild(lineHolder);
      var ch = MQ.ui.choices([lo, lo + 10], function (v) {
        if (v === r10(n)) {
          ch.mark(v, 'good');
          ch.disable();
          MQ.clear(lineHolder);
          lineHolder.appendChild(roundLine(n, v));
          api.sound('correct');
          picked.push(v);
          if (i === 0) {
            api.say('Yes! Now round 136.', 'happy');
            ask(1);
          } else done();
        } else {
          ch.mark(v, 'bad');
          api.sound('wrong');
          api.feedback(n + ' is ' + (n - lo) + ' steps from ' + lo + ' but only ' + (lo + 10 - n) + ' from ' + (lo + 10) + '. Which is nearer?', 'try');
        }
      }, { columns: 2 });
      ch.classList.add(P + 'est-ch');
      row.appendChild(ch);
      area.appendChild(row);
    }
    function done() {
      result.innerHTML = 'Estimate: 150 + 140 = <b>290</b> &nbsp;·&nbsp; Exact: 148 + 136 = <b>284</b>';
      api.say('284 is close to 290, so our answer makes sense!', 'cheer');
      api.feedback('Always check: is the answer close to the estimate?', 'good');
      api.unlockNext();
    }
    ask(0);
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

  function renderMat(stage, api, q) {
    api.say(q.ctx ? 'How many now? The blocks can help.' : 'Add them. Too many ones? Pack 10 into a ten!', 'think');
    stage.appendChild(MQ.ui.prompt((q.ctx ? q.ctx(q.n, q.m) + '<br>' : '') + q.n + ' + ' + q.m + ' = ?'));
    var mat = blockMat({ maxFlats: dig(q.n).h });
    var st = both(q.n, q.m);
    mat.render(st);
    stage.appendChild(el('div', { class: P + 'matbox' }, mat.svg));
    var pack = el('button', { class: 'btn btn-ghost ' + P + 'pack', type: 'button' }, '📦 Pack 10 ones into a ten');
    var packed = false;
    function doPack() {
      if (packed) return;
      packed = true;
      st = swapped(st);
      mat.render(st);
      pack.disabled = true;
      pack.textContent = '10 ones → 1 ten ✓';
    }
    pack.addEventListener('click', function () {
      api.sound('pop');
      doPack();
    });
    var inp = answerRow(q, api);
    stage.appendChild(el('div', { class: P + 'btns' }, pack));
    stage.appendChild(inp.el);
    inp.focus();
    api.onReveal(function () {
      doPack();
      inp.setValue(q.ans);
      inp.good();
      inp.disable();
      var cw = columnWork(q.n, q.m);
      cw.update({ carry: true, ans: 3 });
      var a = dig(q.n);
      stage.appendChild(el('div', { class: P + 'reveal' }, cw.el, el('div', { class: P + 'readout' }, a.o + ' + ' + q.m + ' = ' + (a.o + q.m) + ' ones → 1 ten and ' + (a.o + q.m - 10) + ' ones. ' + q.n + ' + ' + q.m + ' = ' + q.ans)));
    });
  }

  function renderEst(stage, api, q) {
    api.say('First estimate: round each number to the nearest 10.', 'think');
    stage.appendChild(MQ.ui.prompt(q.text));
    var stepBox = el('div', { class: P + 'stepbox' });
    stage.appendChild(stepBox);
    stepBox.appendChild(el('div', { class: P + 'q' }, 'Which is the best estimate for ' + q.n + ' + ' + q.m + '?'));
    var inp;
    var ansBox = el('div', { class: P + 'ansbox' });
    var ch = MQ.ui.choices(q.options, function (v) {
      if (v === q.est) {
        ch.mark(v, 'good');
        ch.disable();
        api.sound('correct');
        api.feedback('Yes! ' + r10(q.n) + ' + ' + r10(q.m) + ' = ' + q.est + '. Now work out the exact answer.', 'good');
        api.say('Good estimate! Now the exact answer.', 'happy');
        showAnswer();
      } else {
        ch.mark(v, 'bad');
        var hint = 'Round each number first: ' + q.n + ' → ? and ' + q.m + ' → ?';
        if (api.tries() >= 1) hint = q.n + ' rounds to ' + r10(q.n) + ' and ' + q.m + ' rounds to ' + r10(q.m) + '. Add those.';
        api.check(false, hint, 'Estimate far from the answer');
      }
    }, { columns: 3 });
    stepBox.appendChild(ch);
    stage.appendChild(ansBox);
    function showAnswer() {
      if (inp) return;
      ansBox.appendChild(el('div', { class: P + 'q' }, q.n + ' + ' + q.m + ' = ?'));
      inp = answerRow(q, api, function () {
        api.feedback(q.n + ' + ' + q.m + ' = ' + q.ans + '. Close to ' + q.est + ' ✓', 'good');
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
      var cw = columnWork(q.n, q.m);
      cw.update({ carry: true, ans: 3 });
      stage.appendChild(el('div', { class: P + 'reveal' }, cw.el, el('div', { class: P + 'readout' }, 'Estimate: ' + r10(q.n) + ' + ' + r10(q.m) + ' = ' + q.est + '. Exact: ' + q.ans + '. Close ✓')));
    });
  }

  function renderWord(stage, api, q) {
    var isLine = q.type === 'line';
    api.say(isLine ? 'Use the number line: jump the hundreds, then the tens, then the ones.' : q.type === 'noswap' ? 'Read carefully. Is a swap needed this time?' : 'Estimate, then add. Ones first!', 'think');
    stage.appendChild(MQ.ui.prompt(q.text));
    var d = dig(q.m);
    var jumps = [d.h * 100, d.t * 10, d.o].filter(function (j) { return j > 0; });
    var holder = el('div', { class: P + 'linebox' });
    if (isLine) {
      holder.appendChild(jumpLine(q.n, jumps, jumps.length, { jumpText: function (i, j) { return '+' + j; } }));
      // hide the landing numbers: he works them out
      Array.prototype.forEach.call(holder.querySelectorAll('.' + P + 'nl-num'), function (t, i) {
        if (i > 0) t.textContent = '?';
      });
      stage.appendChild(holder);
    }
    stage.appendChild(el('div', { class: P + 'q' }, q.n + ' + ' + q.m + ' = ?'));
    var inp = answerRow(q, api, function () {
      api.feedback(q.n + ' + ' + q.m + ' = ' + q.ans + '. Estimate ' + r10(q.n) + ' + ' + r10(q.m) + ' = ' + q.est + ', close ✓', 'good');
    });
    stage.appendChild(inp.el);
    inp.focus();
    api.onReveal(function () {
      inp.setValue(q.ans);
      inp.good();
      inp.disable();
      var parts = [];
      if (isLine) {
        MQ.clear(holder);
        holder.appendChild(jumpLine(q.n, jumps, jumps.length));
      } else {
        var cw = columnWork(q.n, q.m);
        cw.update({ carry: true, ans: 3 });
        parts.push(cw.el);
      }
      var a = dig(q.n), os = a.o + d.o;
      parts.push(el('div', { class: P + 'readout' }, (os >= 10 ? 'Ones: ' + a.o + ' + ' + d.o + ' = ' + os + ' → swap 10 ones for a ten. ' : 'Ones: ' + a.o + ' + ' + d.o + ' = ' + os + ', no swap needed. ') + 'Estimate ' + q.est + ', answer ' + q.ans + '.'));
      stage.appendChild(el('div', { class: P + 'reveal' }, parts));
    });
  }

  function renderMachine(stage, api, q) {
    api.say('The adding machine adds ' + q.k + ' to every number. Fill in what comes out!', 'think');
    stage.appendChild(MQ.ui.prompt('Adding machine: <b>+ ' + q.k + '</b>'));
    var rows = el('div', { class: P + 'machine' });
    var inputs = q.ins.map(function (v) {
      var input = el('input', { class: 'num-input ' + P + 'min', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': v + ' plus ' + q.k, placeholder: '?' });
      rows.appendChild(el('div', { class: P + 'mrow' }, el('span', { class: P + 'min-num' }, String(v)), el('span', { class: P + 'arrow' }, '+ ' + q.k + ' →'), input));
      return input;
    });
    stage.appendChild(rows);
    var check = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    stage.appendChild(check);
    function submit() {
      if (check.disabled) return;
      var vals = inputs.map(function (i) { return U.parseNum(i.value); });
      if (vals.some(function (v) { return isNaN(v); })) {
        api.feedback('Fill in all three boxes first.', 'info');
        return;
      }
      var bad = -1;
      vals.forEach(function (v, i) {
        inputs[i].classList.remove('good', 'bad');
        inputs[i].classList.add(v === q.outs[i] ? 'good' : 'bad');
        if (v !== q.outs[i] && bad < 0) bad = i;
      });
      if (bad < 0) {
        check.disabled = true;
        inputs.forEach(function (i) { i.disabled = true; });
        api.check(true, 'All three right! The machine is happy.');
      } else {
        var d = diagnose(vals[bad], q.ins[bad], q.k, api);
        api.check(false, 'Look again at ' + q.ins[bad] + ' + ' + q.k + '. ' + d.hint, d.tag);
      }
    }
    check.addEventListener('click', submit);
    inputs.forEach(function (i) {
      i.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') submit();
      });
    });
    api.onReveal(function () {
      check.disabled = true;
      inputs.forEach(function (i, k) {
        i.value = q.outs[k];
        i.disabled = true;
        i.classList.remove('bad');
        i.classList.add('good');
      });
      var works = q.ins.map(function (v) {
        var cw = columnWork(v, q.k);
        cw.update({ carry: true, ans: 3 });
        return cw.el;
      });
      stage.appendChild(el('div', { class: P + 'reveal ' + P + 'reveal-3' }, works));
    });
  }

  MQ.register(ID, {
    learn: [learnBakery, learnMat, learnLine, learnEstimate],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'mat') renderMat(stage, api, q);
        else if (q.type === 'est') renderEst(stage, api, q);
        else if (q.type === 'machine') renderMachine(stage, api, q);
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
    '.awr-matbox{width:100%;display:flex;justify-content:center}',
    '.awr-mat{max-width:100%;height:auto;display:block}',
    '.awr-col{fill:#f7f9ff;stroke:#c9d3ee;stroke-width:2}',
    '.awr-col-h{fill:#f3f6ff}.awr-col-t{fill:#f6fbf9}.awr-col-o{fill:#fffaf0}',
    '.awr-colhead{font-size:16px;font-weight:800;fill:#4a5a7d}',
    '.awr-blk rect{stroke-width:1.2}',
    '.awr-gl{stroke:rgba(0,0,0,.18);stroke-width:.8;fill:none}',
    '.awr-a rect{fill:#8ecae6;stroke:#2a6f97}',
    '.awr-b rect,rect.awr-b{fill:#ffc78a;stroke:#c46a10}',
    '.awr-swap rect{fill:#9be3b0;stroke:#1f9d6b}',
    '.awr-glow rect{stroke:#e09a00;stroke-width:2.6;animation:awr-pulse 1s ease-in-out infinite alternate}',
    '@keyframes awr-pulse{from{opacity:1}to{opacity:.6}}',
    '.awr-blk-t.awr-swap{animation:awr-in .5s ease}',
    '@keyframes awr-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}',
    '.awr-frame{fill:#fff;stroke:#e3c98f;stroke-width:1.2;stroke-dasharray:3 2}',
    '.awr-tray{cursor:grab}',
    '.awr-tray-bg{fill:#fff3e0;stroke:#f4a259;stroke-width:2.5;stroke-dasharray:6 4}',
    '.awr-tray-txt{font-size:14px;font-weight:800;fill:#c46a10}',
    '.awr-readout{font-size:1.2rem;font-weight:700;text-align:center;max-width:720px}',
    '.awr-readout b{color:#0b6e66}',
    '.awr-row{display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:center;width:100%}',
    '.awr-row .awr-matbox{width:auto;flex:1 1 420px;min-width:0}',
    '.awr-btns{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}',
    '.awr-jump{min-width:90px;font-size:1.3rem}',
    '.awr-colwork{display:grid;grid-template-columns:repeat(4,36px);font-size:2rem;font-weight:800;line-height:1.1;background:#fff;border:2px solid var(--line);border-radius:14px;padding:6px 14px;font-variant-numeric:tabular-nums;color:var(--ink)}',
    '.awr-cw{text-align:center;min-height:1.1em}',
    '.awr-cw-carry{font-size:1.1rem;color:#c2410c;align-self:end}',
    '.awr-cw-op{color:var(--ink-soft)}',
    '.awr-cw-line{grid-column:1 / span 4;border-top:3px solid var(--ink);margin:2px 0}',
    '.awr-cw-ans{color:#0b6e66}',
    '.awr-linebox{width:100%;display:flex;justify-content:center}',
    '.awr-line{max-width:100%;height:auto}',
    '.awr-nl-base{stroke:#1b2a4a;stroke-width:3}',
    '.awr-nl-tick{stroke:#1b2a4a;stroke-width:2}',
    '.awr-nl-num{font-size:19px;font-weight:800;fill:#1b2a4a}',
    '.awr-nl-start{fill:#2a6f97}',
    '.awr-nl-end{fill:#1f9d6b}',
    '.awr-nl-arc{fill:none;stroke:#f4a259;stroke-width:3;stroke-linecap:round}',
    '.awr-nl-jump{font-size:19px;font-weight:800;fill:#c46a10}',
    '.awr-dot{fill:#2a6f97}',
    '.awr-rline{max-width:100%;height:auto;width:360px}',
    '.awr-est{display:flex;flex-direction:column;gap:8px;align-items:center;width:100%}',
    '.awr-est-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px}',
    '.awr-est-ch{max-width:240px}',
    '.awr-stepbox,.awr-ansbox{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.awr-q{font-size:1.25rem;font-weight:800;text-align:center}',
    '.awr-reveal{display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:center;width:100%}',
    '.awr-reveal .awr-colwork{font-size:1.6rem}',
    '.awr-machine{display:flex;flex-direction:column;gap:8px;align-items:center}',
    '.awr-mrow{display:flex;align-items:center;gap:12px;font-size:1.5rem;font-weight:800}',
    '.awr-min-num{min-width:64px;text-align:right}',
    '.awr-arrow{color:#c46a10}',
    '.awr-min{width:120px;height:52px}',
    '@media (max-width:640px){.awr-colwork{font-size:1.5rem;grid-template-columns:repeat(4,28px)}.awr-mrow{font-size:1.2rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

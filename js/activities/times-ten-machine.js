/* Times-10 Machine (Unit 5.1): multiply 1-digit and 2-digit numbers by 10.
 * The idea taught is "every digit slides one place to the left on a hundreds/tens/ones chart
 * and 0 fills the empty ones place" (never "just add a zero"), always next to a picture:
 * boxes of 10 pencils, base-ten blocks, repeated addition. CSS prefix: tt-
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;
  var ID = 'times-ten-machine';

  /* ------------------------------------------------------------------ *
   * Mistake tags (parent-readable)
   * ------------------------------------------------------------------ */
  var TAG = {
    addTen: 'Added 10 instead of multiplying by 10 (23 × 10 = 33)',
    zeroPlace: 'Put the 0 in the wrong place',
    notMoved: 'Did not move the digits one place left',
    twoZeros: 'Added two zeros (made it 100 times bigger)',
    swapped: 'Swapped the order of the digits',
    count: 'Lost count of the tens',
    zeroTen: 'Thought 0 × 10 is 10',
    backwards: 'Did not work backwards to find the missing number',
  };

  var COLS = ['H', 'T', 'O'];
  var COL_NAME = { H: 'hundreds', T: 'tens', O: 'ones' };
  var COL_FILL = { H: '#efe7fb', T: '#e3f0fd', O: '#e6f6ea' };
  var COL_INK = { H: '#6a3fb5', T: '#1f63b5', O: '#1f7a3e' };

  function digitsOf(n) {
    return String(n)
      .split('')
      .map(Number);
  }
  function tensWord(k) {
    return k === 1 ? '1 ten' : k + ' tens';
  }
  function onesWord(k) {
    return k === 1 ? '1 one' : k + ' ones';
  }
  function hundWord(k) {
    return k === 1 ? '1 hundred' : k + ' hundreds';
  }
  function swapDigits(n) {
    var d = digitsOf(n);
    return d.length === 2 ? d[1] * 10 + d[0] : n;
  }

  /* ------------------------------------------------------------------ *
   * Pictures
   * ------------------------------------------------------------------ */
  var PENCIL_COLS = ['#ffb703', '#e63946', '#3a86ff', '#06a77d', '#8338ec'];

  function pencil(x, y, h, c) {
    var g = S('g', { class: 'tt-pencil' });
    g.appendChild(S('rect', { x: x, y: y + 10, width: 7, height: h - 10, fill: c, stroke: '#1b2a4a', 'stroke-width': 0.8 }));
    g.appendChild(S('path', { d: 'M' + x + ' ' + (y + 10) + ' L' + (x + 3.5) + ' ' + y + ' L' + (x + 7) + ' ' + (y + 10) + ' Z', fill: '#f6d7a7', stroke: '#1b2a4a', 'stroke-width': 0.8 }));
    g.appendChild(S('circle', { cx: x + 3.5, cy: y + 1.5, r: 1.3, fill: '#1b2a4a' }));
    return g;
  }

  // A box of 10 pencils inside a 96 × 96 cell. empty: an open empty box.
  function box10(empty) {
    var g = S('g', { class: 'tt-box' });
    if (!empty) {
      for (var i = 0; i < 10; i++) g.appendChild(pencil(9 + i * 8.2, 4, 66, PENCIL_COLS[i % 5]));
    } else {
      g.appendChild(S('path', { d: 'M4 44 L14 30 L82 30 L92 44 Z', fill: '#d9b25a', stroke: '#9c6b1f', 'stroke-width': 2 }));
    }
    g.appendChild(S('rect', { x: 4, y: 44, width: 88, height: 46, rx: 6, fill: '#e9c46a', stroke: '#9c6b1f', 'stroke-width': 2 }));
    g.appendChild(S('text', { x: 48, y: 74, 'text-anchor': 'middle', class: 'tt-boxlab' }, empty ? 'EMPTY' : '10'));
    return g;
  }

  // n boxes of 10 pencils in one row, with a count label under each box (shown when counted).
  function boxesPic(n, opts) {
    opts = opts || {};
    var cell = 104;
    var W = Math.max(n, 1) * cell + 8;
    var H = 136;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'tt-svg tt-boxes', width: Math.min(W, opts.maxW || 760) });
    var labels = [];
    var shown = 0;
    var pic = { el: el('div', { class: 'tt-pic' }, root) };
    for (var i = 0; i < n; i++) {
      var g = S('g', { transform: 'translate(' + (8 + i * cell) + ',4)', class: 'tt-boxg', 'data-box': i });
      g.appendChild(S('rect', { x: 0, y: 0, width: 96, height: 96, fill: 'transparent' }));
      g.appendChild(box10(!!opts.empty));
      var lab = S('text', { x: 48 + 8 + i * cell, y: 126, 'text-anchor': 'middle', class: 'tt-count' }, '');
      labels.push(lab);
      root.appendChild(g);
      root.appendChild(lab);
      if (opts.clickable) {
        g.style.cursor = 'pointer';
        g.addEventListener('click', function () {
          if (pic.locked) return;
          pic.countTo(shown + 1);
          MQ.sound('pop');
        });
      }
    }
    pic.countTo = function (k) {
      k = Math.min(k, n);
      for (var j = 0; j < n; j++) {
        labels[j].textContent = j < k ? String(opts.empty ? 0 : (j + 1) * 10) : '';
        labels[j].classList.toggle('tt-count-on', j < k);
      }
      shown = k;
    };
    pic.all = function () {
      pic.countTo(n);
    };
    return pic;
  }

  // Base-ten blocks: flats (hundreds), rods (tens), cubes (ones). s = size of one cube.
  function blockGroup(h, t, o, s) {
    var g = S('g', { class: 'tt-blocks' });
    var x = 0;
    var top = 0;
    var side = 10 * s;
    var gap = 14;
    var k;
    if (h) {
      for (k = h - 1; k >= 0; k--) {
        var fx = x + k * 5;
        var fy = top + k * 5;
        g.appendChild(S('rect', { x: fx, y: fy, width: side, height: side, class: 'tt-flat' }));
        for (var l = 1; l < 10; l++) {
          g.appendChild(S('line', { x1: fx + l * s, y1: fy, x2: fx + l * s, y2: fy + side, class: 'tt-bline' }));
          g.appendChild(S('line', { x1: fx, y1: fy + l * s, x2: fx + side, y2: fy + l * s, class: 'tt-bline' }));
        }
      }
      x += side + (h - 1) * 5 + gap;
    }
    if (t) {
      for (k = 0; k < t; k++) {
        var rx = x + k * (s + 3);
        g.appendChild(S('rect', { x: rx, y: top, width: s, height: side, class: 'tt-rod' }));
        for (var m = 1; m < 10; m++) g.appendChild(S('line', { x1: rx, y1: top + m * s, x2: rx + s, y2: top + m * s, class: 'tt-bline' }));
      }
      x += t * (s + 3) - 3 + gap;
    }
    if (o) {
      var per = 5;
      for (k = 0; k < o; k++) {
        var cx = x + (k % per) * (s + 3);
        var cy = top + side - s - Math.floor(k / per) * (s + 3);
        g.appendChild(S('rect', { x: cx, y: cy, width: s, height: s, class: 'tt-cube' }));
      }
      x += Math.min(o, per) * (s + 3) - 3 + gap;
    }
    var height = Math.max(h ? side + (h - 1) * 5 : 0, t || o ? side : 0);
    return { g: g, w: Math.max(0, x - gap), h: height };
  }

  // Before → after block picture for n × 10 (n is 1- or 2-digit).
  function blocksSlide(n) {
    var d = digitsOf(n);
    var t = d.length === 2 ? d[0] : 0;
    var o = d[d.length - 1];
    var s = 6;
    var before = blockGroup(0, t, o, s);
    var after = blockGroup(t, o, 0, s);
    var arrowW = 70;
    var W = before.w + arrowW + after.w + 20;
    var H = Math.max(before.h, after.h) + 30;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'tt-svg tt-blk', width: W });
    var b = before.g;
    b.setAttribute('transform', 'translate(10,' + (H - 24 - before.h) + ')');
    root.appendChild(b);
    var a = after.g;
    a.setAttribute('transform', 'translate(' + (10 + before.w + arrowW) + ',' + (H - 24 - after.h) + ')');
    root.appendChild(a);
    var ay = H - 24 - Math.min(before.h, after.h) / 2;
    var ax = 10 + before.w + 12;
    root.appendChild(S('path', { d: 'M' + ax + ' ' + ay + ' L' + (ax + arrowW - 24) + ' ' + ay, class: 'tt-arrow' }));
    root.appendChild(S('path', { d: 'M' + (ax + arrowW - 32) + ' ' + (ay - 7) + ' L' + (ax + arrowW - 24) + ' ' + ay + ' L' + (ax + arrowW - 32) + ' ' + (ay + 7), class: 'tt-arrow' }));
    root.appendChild(S('text', { x: ax + (arrowW - 24) / 2, y: ay - 10, 'text-anchor': 'middle', class: 'tt-arrowlab' }, '× 10'));
    root.appendChild(S('text', { x: 10 + before.w / 2, y: H - 4, 'text-anchor': 'middle', class: 'tt-blklab' }, String(n)));
    root.appendChild(S('text', { x: 10 + before.w + arrowW + after.w / 2, y: H - 4, 'text-anchor': 'middle', class: 'tt-blklab' }, String(n * 10)));
    return root;
  }

  /* ------------------------------------------------------------------ *
   * Place-value chart (display only) with the ×10 slide animation.
   * opts: later(fn, ms), cw
   * ------------------------------------------------------------------ */
  function makeChart(opts) {
    opts = opts || {};
    var cw = opts.cw || 88;
    var pad = 6;
    var headH = 34;
    var rowH = 70;
    var arrowH = 30;
    var W = pad * 2 + 3 * cw;
    var H = pad * 2 + headH + rowH + arrowH;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'tt-svg tt-chart', width: W * (opts.scale || 1) });
    var rowY = pad + headH + rowH / 2;
    function colX(i) {
      return pad + i * cw + cw / 2;
    }
    COLS.forEach(function (c, i) {
      var x = pad + i * cw;
      root.appendChild(S('rect', { x: x, y: pad, width: cw, height: headH + rowH, fill: COL_FILL[c], class: 'tt-col' }));
      root.appendChild(S('text', { x: x + cw / 2, y: pad + 24, 'text-anchor': 'middle', class: 'tt-head', fill: COL_INK[c] }, c));
    });
    root.appendChild(S('rect', { x: pad, y: pad, width: 3 * cw, height: headH + rowH, class: 'tt-frame' }));
    root.appendChild(S('line', { x1: pad, y1: pad + headH, x2: pad + 3 * cw, y2: pad + headH, class: 'tt-gridline' }));
    for (var i = 1; i < 3; i++) root.appendChild(S('line', { x1: pad + i * cw, y1: pad, x2: pad + i * cw, y2: pad + headH + rowH, class: 'tt-gridline' }));
    var arrows = S('g', { class: 'tt-arrows' });
    var digs = S('g');
    root.appendChild(arrows);
    root.appendChild(digs);
    var ch = { el: root, digits: [] };

    function put(d, col, zero) {
      var g = S('g', { class: 'tt-dig' + (zero ? ' tt-dig-zero' : '') });
      g.appendChild(S('text', { x: 0, y: 0, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'tt-digtext' }, String(d)));
      g.style.transform = 'translate(' + colX(col) + 'px,' + rowY + 'px)';
      digs.appendChild(g);
      var o = { g: g, d: d, col: col };
      ch.digits.push(o);
      return o;
    }
    function move(o, col) {
      o.col = col;
      o.g.style.transform = 'translate(' + colX(col) + 'px,' + rowY + 'px)';
    }
    function arrow(from, to) {
      var x1 = colX(from);
      var x2 = colX(to);
      var y = pad + headH + rowH + 4;
      arrows.appendChild(S('path', { d: 'M' + x1 + ' ' + y + ' Q' + (x1 + x2) / 2 + ' ' + (y + 26) + ' ' + x2 + ' ' + y, class: 'tt-slidearrow' }));
      var dir = x2 < x1 ? 1 : -1;
      arrows.appendChild(S('path', { d: 'M' + (x2 + dir * 3) + ' ' + (y + 11) + ' L' + x2 + ' ' + y + ' L' + (x2 + dir * 11) + ' ' + (y + 4), class: 'tt-slidearrow' }));
    }
    ch.value = function () {
      var v = 0;
      ch.digits.forEach(function (o) {
        if (o.col >= 0 && o.col <= 2) v += o.d * Math.pow(10, 2 - o.col);
      });
      return v;
    };
    ch.setNumber = function (n) {
      digs.innerHTML = '';
      arrows.innerHTML = '';
      ch.digits = [];
      var ds = digitsOf(n);
      ds.forEach(function (d, k) {
        put(d, 3 - ds.length + k);
      });
    };
    ch.times10 = function (done) {
      arrows.innerHTML = '';
      ch.digits.forEach(function (o) {
        arrow(o.col, o.col - 1);
        move(o, o.col - 1);
      });
      var later = opts.later || function (f) {
        f();
      };
      later(function () {
        var z = put(0, 2, true);
        z.g.style.transition = 'none';
        z.g.style.opacity = '0';
        z.g.style.transform = 'translate(' + colX(2) + 'px,' + (rowY - 40) + 'px)';
        later(function () {
          z.g.style.transition = '';
          z.g.style.opacity = '1';
          z.g.style.transform = 'translate(' + colX(2) + 'px,' + rowY + 'px)';
          later(function () {
            if (done) done();
          }, 650);
        }, 30);
      }, 700);
    };
    ch.divide10 = function (done) {
      arrows.innerHTML = '';
      var later = opts.later || function (f) {
        f();
      };
      ch.digits.forEach(function (o) {
        if (o.col < 2) arrow(o.col, o.col + 1);
        if (o.col === 2) {
          o.g.style.opacity = '0';
          o.g.style.transform = 'translate(' + (colX(2) + 50) + 'px,' + (rowY + 30) + 'px)';
          o.col = 9;
        } else move(o, o.col + 1);
      });
      later(function () {
        if (done) done();
      }, 800);
    };
    return ch;
  }

  /* ------------------------------------------------------------------ *
   * The ×10 machine picture: [in] → (× 10) → [out]
   * ------------------------------------------------------------------ */
  function makeMachine() {
    var W = 520;
    var H = 132;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'tt-svg tt-machine', width: W });
    root.appendChild(S('rect', { x: 10, y: 34, width: 120, height: 64, rx: 14, class: 'tt-mbox' }));
    root.appendChild(S('text', { x: 70, y: 26, 'text-anchor': 'middle', class: 'tt-mlab' }, 'IN'));
    root.appendChild(S('path', { d: 'M136 66 L176 66 M168 58 L176 66 L168 74', class: 'tt-arrow' }));
    var body = S('g', { class: 'tt-mbody' });
    body.appendChild(S('rect', { x: 182, y: 14, width: 156, height: 104, rx: 18, class: 'tt-mmain' }));
    body.appendChild(S('rect', { x: 202, y: 36, width: 116, height: 54, rx: 10, class: 'tt-mscreen' }));
    body.appendChild(S('text', { x: 260, y: 64, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'tt-mop' }, '× 10'));
    [214, 236, 258].forEach(function (x, i) {
      body.appendChild(S('circle', { cx: x, cy: 104, r: 5, class: 'tt-mlight tt-mlight' + i }));
    });
    root.appendChild(body);
    root.appendChild(S('path', { d: 'M344 66 L384 66 M376 58 L384 66 L376 74', class: 'tt-arrow' }));
    root.appendChild(S('rect', { x: 390, y: 34, width: 120, height: 64, rx: 14, class: 'tt-mbox tt-mbox-out' }));
    root.appendChild(S('text', { x: 450, y: 26, 'text-anchor': 'middle', class: 'tt-mlab' }, 'OUT'));
    var inT = S('text', { x: 70, y: 67, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'tt-mval' }, '');
    var outT = S('text', { x: 450, y: 67, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'tt-mval' }, '');
    root.appendChild(inT);
    root.appendChild(outT);
    return {
      el: root,
      setIn: function (v) {
        inT.textContent = v == null ? '' : String(v);
      },
      setOut: function (v) {
        outT.textContent = v == null ? '' : String(v);
      },
      run: function (on) {
        body.classList.toggle('tt-running', !!on);
      },
    };
  }

  /* ------------------------------------------------------------------ *
   * Small countable items for word problems, in rows of 10 (gap after 5).
   * ------------------------------------------------------------------ */
  function smallItem(kind, cx, cy) {
    var g = S('g');
    if (kind === 'pencils') {
      [-8, -3, 2, 7].forEach(function (dx, i) {
        g.appendChild(S('rect', { x: cx + dx - 2, y: cy - 16, width: 4, height: 10, fill: PENCIL_COLS[i], stroke: '#1b2a4a', 'stroke-width': 0.5 }));
      });
      g.appendChild(S('rect', { x: cx - 14, y: cy - 8, width: 28, height: 22, rx: 3, fill: '#e9c46a', stroke: '#9c6b1f', 'stroke-width': 1.5 }));
      g.appendChild(S('text', { x: cx, y: cy + 8, 'text-anchor': 'middle', class: 'tt-itemlab' }, '10'));
    } else if (kind === 'stickers') {
      g.appendChild(S('rect', { x: cx - 13, y: cy - 15, width: 26, height: 30, rx: 4, fill: '#ffe1ea', stroke: '#d6336c', 'stroke-width': 1.5 }));
      var pts = [];
      for (var k = 0; k < 10; k++) {
        var r = k % 2 ? 3 : 7;
        var a = (Math.PI / 5) * k - Math.PI / 2;
        pts.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy - 5 + r * Math.sin(a)).toFixed(1));
      }
      g.appendChild(S('polygon', { points: pts.join(' '), fill: '#ffb703', stroke: '#c77d00', 'stroke-width': 0.8 }));
      g.appendChild(S('text', { x: cx, y: cy + 12, 'text-anchor': 'middle', class: 'tt-itemlab tt-itemlab-s' }, '10'));
    } else {
      g.appendChild(S('circle', { cx: cx, cy: cy, r: 14, fill: '#dfe6ec', stroke: '#7d8c99', 'stroke-width': 1.8 }));
      g.appendChild(S('circle', { cx: cx, cy: cy, r: 10.5, fill: 'none', stroke: '#aab6c1', 'stroke-width': 1 }));
      g.appendChild(S('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', class: 'tt-itemlab tt-itemlab-s' }, '10c'));
    }
    return g;
  }

  function itemsPic(kind, n) {
    var cell = 36;
    var gapMid = 14;
    var rows = Math.ceil(n / 10);
    var labW = 70;
    var W = 10 * cell + gapMid + labW + 10;
    var H = rows * 40 + 8;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'tt-svg tt-items', width: W * 1.15 });
    var rowLabs = [];
    for (var r = 0; r < rows; r++) {
      var inRow = Math.min(10, n - r * 10);
      for (var c = 0; c < inRow; c++) {
        var x = 8 + c * cell + cell / 2 + (c >= 5 ? gapMid : 0);
        root.appendChild(smallItem(kind, x, 4 + r * 40 + 20));
      }
      var lab = S('text', { x: 10 * cell + gapMid + 18, y: 4 + r * 40 + 26, class: 'tt-rowlab' }, '');
      lab.dataset.v = String(inRow * 10);
      rowLabs.push(lab);
      root.appendChild(lab);
    }
    return {
      el: el('div', { class: 'tt-pic' }, root),
      label: function () {
        rowLabs.forEach(function (l) {
          l.textContent = l.dataset.v + (kind === 'coins' ? 'c' : '');
        });
      },
    };
  }

  function planksPic(len) {
    var W = 470;
    var H = 10 * 22 + 8;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'tt-svg tt-planks', width: W });
    for (var i = 0; i < 10; i++) {
      var y = 4 + i * 22;
      root.appendChild(S('text', { x: 18, y: y + 13, 'text-anchor': 'middle', class: 'tt-planknum' }, String(i + 1)));
      root.appendChild(S('rect', { x: 34, y: y, width: 330, height: 16, rx: 3, class: 'tt-plank' }));
      root.appendChild(S('path', { d: 'M' + (80 + (i % 3) * 70) + ' ' + (y + 6) + ' q20 -4 40 0', class: 'tt-grain' }));
      root.appendChild(S('text', { x: 376, y: y + 13, class: 'tt-planklab' }, len + ' cm'));
    }
    return { el: el('div', { class: 'tt-pic' }, root) };
  }

  /* ------------------------------------------------------------------ *
   * Working shown after a correct answer or "Show me"
   * ------------------------------------------------------------------ */
  function slideWords(n) {
    var d = digitsOf(n);
    if (d.length === 1) return onesWord(d[0]) + ' → ' + tensWord(d[0]) + '. 0 fills the ones.';
    return tensWord(d[0]) + ' → ' + hundWord(d[0]) + ' · ' + onesWord(d[1]) + ' → ' + tensWord(d[1]) + ' · 0 fills the ones.';
  }

  function factChip(text) {
    return el('div', { class: 'tt-fact' }, text);
  }

  /* ------------------------------------------------------------------ *
   * Hints for a typed n × 10 answer
   * ------------------------------------------------------------------ */
  function diagnose(n, v, raw, second, opts) {
    opts = opts || {};
    var N = n * 10;
    var d = digitsOf(n);
    var unitNote = opts.unit ? ' ' + opts.unit : '';
    var countBack = d.length === 1 ? 'Count the boxes in tens: 10, 20, 30 …' : 'Put ' + n + ' on the chart. Slide each digit one place left, then 0 fills the ones.';
    var slide = d.length === 1 ? 'The ' + n + ' slides from ones to tens, and 0 fills the ones.' : 'The ' + d[0] + ' slides to hundreds, the ' + d[1] + ' slides to tens, and 0 fills the ones.';
    var s = String(raw || '').replace(/\s+/g, '');
    if (v === n + 10) {
      return { tag: TAG.addTen, hint: second ? n + ' + 10 = ' + (n + 10) + ', but × 10 means ' + n + ' tens. ' + slide : 'That is ' + n + ' + 10. × 10 means ' + n + ' lots of 10. ' + countBack };
    }
    if (v === n * 100) {
      return { tag: TAG.twoZeros, hint: second ? 'That is 100 times bigger! Each digit moves just ONE place left. ' + slide : 'Too big! × 10 moves each digit only ONE place left, and only one 0 fills the ones.' };
    }
    if (/^0+\d/.test(s) && v === n) {
      return { tag: TAG.zeroPlace, hint: second ? 'A 0 in front does nothing: ' + s + ' is still ' + n + '. ' + slide : 'A 0 at the front does not change the number. Where does the 0 go?' };
    }
    if (v === n) {
      return { tag: TAG.notMoved, hint: second ? slide : 'That is the number that went in. × 10 slides every digit one place left.' };
    }
    if (d.length === 2 && (v === d[0] * 100 + d[1] || v === d[0] * 1000 + d[1] * 10 + 0 || v === d[0] * 100 + d[1] * 1 || v === d[0] * 1000 + d[1])) {
      return { tag: TAG.zeroPlace, hint: second ? 'The 0 goes at the end, in the ones place. ' + slide : 'The 0 is in the wrong place. The 0 fills the empty ONES place.' };
    }
    if (d.length === 2 && d[0] !== d[1] && v === swapDigits(n) * 10) {
      return { tag: TAG.swapped, hint: second ? slide : 'The digits swapped places. Keep them in the same order: ' + d[0] + ' then ' + d[1] + '.' };
    }
    if (d.length === 1 && v % 10 === 0 && v > 0 && v < 100) {
      return { tag: TAG.count, hint: second ? 'Count one ten for each box: there are ' + n + ' boxes.' : 'Nearly. Count the boxes in tens. Touch each box as you count.' };
    }
    if (v % 10 !== 0) {
      return { tag: TAG.zeroPlace, hint: second ? slide : 'A × 10 answer always has 0 in the ones place. ' + countBack };
    }
    return { tag: TAG.notMoved, hint: second ? slide + ' So ' + n + ' × 10 = ?' + unitNote : countBack };
  }

  /* ------------------------------------------------------------------ *
   * Learn 1: bundles of ten
   * ------------------------------------------------------------------ */
  function learnBundles(stage, api) {
    api.lockNext();
    api.say('4 pencils. Click each one to turn it into a box of 10!', 'think');
    stage.appendChild(MQ.ui.lesson('Bundles of ten', 'Every <b>1 pencil</b> becomes a <b>box of 10</b>.'));
    var n = 4;
    var cell = 120;
    var W = n * cell + 10;
    var H = 160;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'tt-svg tt-bundles', width: W * 1.2 });
    var order = 0;
    var labels = [];
    var sumBox = el('div', { class: 'tt-work' });
    for (var i = 0; i < n; i++) {
      (function (i) {
        var g = S('g', { class: 'tt-card', 'data-card': i, transform: 'translate(' + (10 + i * cell) + ',4)' });
        var bg = S('rect', { x: 0, y: 0, width: 108, height: 124, rx: 14, class: 'tt-cardbg' });
        g.appendChild(bg);
        var inner = S('g', { transform: 'translate(6,10)' });
        inner.appendChild(pencil(44, 6, 80, PENCIL_COLS[i]));
        inner.appendChild(S('text', { x: 48, y: 104, 'text-anchor': 'middle', class: 'tt-cardtxt' }, 'click me'));
        g.appendChild(inner);
        var lab = S('text', { x: 10 + i * cell + 54, y: 152, 'text-anchor': 'middle', class: 'tt-count tt-count-on' }, '');
        labels.push(lab);
        root.appendChild(g);
        root.appendChild(lab);
        g.addEventListener('click', function () {
          if (g.dataset.done) return;
          g.dataset.done = '1';
          order++;
          MQ.sound('pop');
          inner.innerHTML = '';
          var b = box10(false);
          b.setAttribute('transform', 'translate(0,4)');
          inner.appendChild(b);
          g.classList.add('tt-card-done');
          lab.textContent = String(order * 10);
          sumBox.innerHTML = '';
          sumBox.appendChild(MQ.ui.sum(U.range(1, order).map(function () {
            return 10;
          }), order * 10));
          if (order === n) {
            sumBox.appendChild(factChip('4 × 10 = 40'));
            sumBox.appendChild(el('div', { class: 'tt-note' }, '4 ones became 4 tens.'));
            api.say('4 boxes of 10: 10, 20, 30, 40. So 4 × 10 = 40!', 'cheer');
            api.feedback('4 × 10 = 40. Each pencil became a ten.', 'good');
            api.unlockNext();
          } else {
            api.say(order * 10 + '! Keep going.', 'happy');
          }
        });
      })(i);
    }
    stage.appendChild(el('div', { class: 'tt-pic' }, root));
    stage.appendChild(sumBox);
  }

  /* ------------------------------------------------------------------ *
   * Learn 2: the slide on a hundreds/tens/ones chart
   * ------------------------------------------------------------------ */
  function learnSlide(stage, api) {
    api.lockNext();
    api.say('Press × 10 and watch the 4 slide!', 'think');
    stage.appendChild(MQ.ui.lesson('The slide', '× 10 slides <b>every digit one place left</b>. Then <b>0 fills the ones</b>.'));
    var ch = makeChart({ later: api.later, scale: 1.15 });
    var nums = [4, 23];
    var step = 0;
    var busy = false;
    var label = el('div', { class: 'tt-eq' }, '4 × 10 = ?');
    var go = el('button', { class: 'btn tt-go', type: 'button' }, '× 10');
    var work = el('div', { class: 'tt-work' });
    ch.setNumber(4);
    stage.appendChild(el('div', { class: 'tt-row' }, ch.el, el('div', { class: 'tt-col-stack' }, label, go)));
    stage.appendChild(work);
    go.addEventListener('click', function () {
      if (busy) return;
      var n = nums[Math.min(step, 1)];
      if (go.dataset.mode === 'load') {
        ch.setNumber(23);
        label.textContent = '23 × 10 = ?';
        go.textContent = '× 10';
        go.dataset.mode = '';
        work.innerHTML = '';
        api.say('Now 23. Where will the 2 go?', 'think');
        return;
      }
      busy = true;
      go.disabled = true;
      MQ.sound('click');
      ch.times10(function () {
        busy = false;
        label.textContent = n + ' × 10 = ' + n * 10;
        work.innerHTML = '';
        work.appendChild(el('div', { class: 'tt-note' }, slideWords(n)));
        work.appendChild(blocksSlide(n));
        step++;
        if (step === 1) {
          api.say('The 4 slid to tens. 0 fills the ones: 40!', 'happy');
          go.textContent = 'Try 23';
          go.dataset.mode = 'load';
          go.disabled = false;
        } else {
          api.say('2 to hundreds, 3 to tens, 0 in ones: 230!', 'cheer');
          api.feedback('23 × 10 = 230. Every digit moved one place left.', 'good');
          api.unlockNext();
        }
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * Learn 3: always ends in 0
   * ------------------------------------------------------------------ */
  function learnZero(stage, api) {
    api.lockNext();
    api.say('Feed 3 numbers into the machine. Look at the ones!', 'think');
    stage.appendChild(MQ.ui.lesson('Always ends in 0', 'Pick a number to feed the machine.'));
    var m = makeMachine();
    stage.appendChild(el('div', { class: 'tt-pic' }, m.el));
    var list = el('div', { class: 'tt-results' });
    var fed = 0;
    var busy = false;
    var btns = el('div', { class: 'tt-feed' });
    [7, 15, 38, 9, 64].forEach(function (n) {
      var b = el('button', { class: 'choice tt-feedbtn', type: 'button', 'data-value': n }, String(n));
      b.addEventListener('click', function () {
        if (busy || b.disabled) return;
        busy = true;
        b.disabled = true;
        MQ.sound('click');
        m.setIn(n);
        m.setOut('');
        m.run(true);
        api.later(function () {
          m.run(false);
          m.setOut(n * 10);
          MQ.sound('pop');
          var s = String(n * 10);
          list.appendChild(el('div', { class: 'tt-res' }, n + ' × 10 = ' + s.slice(0, -1), el('span', { class: 'tt-z' }, '0')));
          fed++;
          busy = false;
          if (fed === 3) {
            api.say('Every answer ends in 0. So it is always even!', 'cheer');
            api.feedback('× 10 answers always have 0 ones. Numbers ending in 0 are even.', 'good');
            stage.appendChild(el('div', { class: 'tt-note tt-note-big' }, 'The ones digit is always ', el('span', { class: 'tt-z' }, '0'), ', so the answer is always even.'));
            api.unlockNext();
          } else if (fed < 3) {
            api.say('Look at the ones digit. Try another!', 'happy');
          }
        }, 900);
      });
      btns.appendChild(b);
    });
    stage.appendChild(btns);
    stage.appendChild(list);
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  var WORDS = {
    pencils: {
      unit: 'pencils',
      text: function (n) {
        return 'A school buys <b>' + n + ' boxes</b> of pencils. Each box holds <b>10 pencils</b>. How many pencils?';
      },
      fact: function (n) {
        return '10 × ' + n + ' = ' + n * 10;
      },
    },
    stickers: {
      unit: 'stickers',
      text: function (n) {
        return 'Ana buys <b>' + n + ' packs</b> of stickers. Each pack has <b>10 stickers</b>. How many stickers?';
      },
      fact: function (n) {
        return '10 × ' + n + ' = ' + n * 10;
      },
    },
    coins: {
      unit: 'c',
      text: function (n) {
        return 'Leo has <b>' + n + ' coins</b>. Each one is a <b>10c</b> coin. How much money is that?';
      },
      fact: function (n) {
        return '10c × ' + n + ' = ' + n * 10 + 'c';
      },
    },
    planks: {
      unit: 'cm',
      text: function (n) {
        return 'Dad has <b>10 planks</b>. Each plank is <b>' + n + ' cm</b> long. How long are they all together, end to end?';
      },
      fact: function (n) {
        return n + ' × 10 = ' + n * 10 + ' cm';
      },
    },
  };

  function twoDigit(used, lo, hi) {
    var n;
    var guard = 0;
    do {
      n = U.rand(lo, hi);
      guard++;
    } while ((n % 10 === 0 || used[n]) && guard < 500);
    used[n] = true;
    return n;
  }

  function buildDeck() {
    var deck = [];
    var used = {};
    // Level 1: single digits 1–9 × 10, both orders.
    var singles = U.shuffle(U.range(1, 9)).slice(0, 3);
    var forms1 = U.shuffle(['n10', '10n', U.pick(['n10', '10n'])]);
    singles.forEach(function (n, i) {
      used[n] = true;
      deck.push({ type: 'single', n: n, form: forms1[i], answer: n * 10 });
    });
    // Level 2: 2-digit (10–99) × 10 on the chart by dragging, one of each order.
    var forms2 = U.shuffle(['n10', '10n']);
    for (var i = 0; i < 2; i++) {
      var n = twoDigit(used, 11, 99);
      var d = digitsOf(n);
      deck.push({ type: 'drag', n: n, form: forms2[i], answer: n * 10, slots: { H: d[0], T: d[1], O: 0 } });
    }
    // Word problem: boxes of 10 pencils, packs of 10 stickers, 10c coins (drawn: up to 39), or ten planks.
    var ctx = U.pick(['pencils', 'stickers', 'coins', 'planks']);
    var wn = ctx === 'planks' ? twoDigit(used, 21, 98) : twoDigit(used, 12, 39);
    deck.push({ type: 'word', ctx: ctx, n: wn, unit: WORDS[ctx].unit, answer: wn * 10 });
    // Level 3: missing number (__ × 10 = 470), then Bolt's 0 × 10 card.
    var mn = twoDigit(used, 12, 99);
    deck.push({ type: 'missing', n: mn, product: mn * 10, form: U.pick(['n10', '10n']), answer: mn });
    deck.push({ type: 'zero', ctx: U.pick(['boxes', 'packs']), claim: 10, answer: 0 });
    deck.forEach(function (q, k) {
      q.level = k < 8 / 3 ? 1 : k < 16 / 3 ? 2 : 3;
    });
    return deck;
  }
  var deck = null;

  function factText(q) {
    return q.form === '10n' ? '10 × ' + q.n : q.n + ' × 10';
  }

  /* ------------------------------------------------------------------ *
   * Practice: single digit × 10 (boxes of 10 + chart)
   * ------------------------------------------------------------------ */
  function renderSingle(stage, api, q) {
    api.say(q.n + ' boxes of 10 pencils. Click the boxes to count in tens!', 'think');
    stage.appendChild(MQ.ui.prompt('How many pencils? <b>' + factText(q) + '</b> = ?'));
    var pic = boxesPic(q.n, { clickable: true });
    stage.appendChild(pic.el);
    var ch = makeChart({ later: api.later, cw: 72 });
    ch.setNumber(q.n);
    var inp = MQ.ui.numberInput({ prefix: factText(q) + ' =', onSubmit: submit, label: factText(q) });
    stage.appendChild(el('div', { class: 'tt-row' }, ch.el, inp.el));
    var work = el('div', { class: 'tt-work' });
    stage.appendChild(work);
    inp.focus();
    function finish() {
      inp.disable();
      pic.locked = true;
      pic.all();
      ch.times10(function () {});
      work.appendChild(MQ.ui.sum(U.range(1, q.n).map(function () {
        return 10;
      }), q.answer));
      work.appendChild(el('div', { class: 'tt-note' }, q.n + ' boxes of 10: ' + slideWords(q.n)));
    }
    function submit(v, raw) {
      if (api.isAnswered()) return;
      if (v === q.answer && !/^0/.test(String(raw).trim())) {
        inp.good();
        finish();
        api.check(true, q.n + ' tens = ' + q.answer + '. ' + factText(q) + ' = ' + q.answer + '!');
        return;
      }
      if (v === q.answer) {
        api.feedback('Right number! Write it without a 0 at the front: ' + q.answer + '.', 'info');
        return;
      }
      inp.bad();
      var h = diagnose(q.n, v, raw, api.tries() >= 1);
      api.check(false, h.hint, h.tag);
    }
    api.onReveal(function () {
      inp.setValue(String(q.answer));
      inp.good();
      finish();
      api.feedback(q.n + ' boxes of 10: ' + U.range(1, q.n).map(function (k) {
        return k * 10;
      }).join(', ') + '. ' + factText(q) + ' = ' + q.answer + '.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice: 2-digit × 10 by dragging digits on the chart
   * ------------------------------------------------------------------ */
  var DG = { pad: 8, labW: 112, cw: 96, headH: 36, rowH: 74, gap: 10, trayGap: 22, trayH: 84, tile: 60 };
  DG.W = DG.pad * 2 + DG.labW + 3 * DG.cw;
  DG.rowBefore = DG.pad + DG.headH;
  DG.rowAfter = DG.rowBefore + DG.rowH + DG.gap;
  DG.trayY = DG.rowAfter + DG.rowH + DG.trayGap;
  DG.H = DG.trayY + DG.trayH + DG.pad;
  function dgColX(i) {
    return DG.pad + DG.labW + i * DG.cw + DG.cw / 2;
  }

  function renderDrag(stage, api, q) {
    var d = digitsOf(q.n);
    api.say('Drag each digit one place left. What fills the ones?', 'think');
    stage.appendChild(MQ.ui.prompt('<b>' + factText(q) + '</b> = ?' + (q.form === '10n' ? ' <span class="tt-small">(same as ' + q.n + ' × 10)</span>' : '')));
    var root = S('svg', { viewBox: '0 0 ' + DG.W + ' ' + DG.H, class: 'tt-svg tt-dragsvg', width: DG.W * 1.12 });
    // columns
    COLS.forEach(function (c, i) {
      var x = DG.pad + DG.labW + i * DG.cw;
      root.appendChild(S('rect', { x: x, y: DG.pad, width: DG.cw, height: DG.rowAfter + DG.rowH - DG.pad, fill: COL_FILL[c], class: 'tt-col' }));
      root.appendChild(S('text', { x: x + DG.cw / 2, y: DG.pad + 25, 'text-anchor': 'middle', class: 'tt-head', fill: COL_INK[c] }, c));
    });
    root.appendChild(S('rect', { x: DG.pad + DG.labW, y: DG.pad, width: 3 * DG.cw, height: DG.rowAfter + DG.rowH - DG.pad, class: 'tt-frame' }));
    for (var i = 1; i < 3; i++) root.appendChild(S('line', { x1: DG.pad + DG.labW + i * DG.cw, y1: DG.pad, x2: DG.pad + DG.labW + i * DG.cw, y2: DG.rowAfter + DG.rowH, class: 'tt-gridline' }));
    root.appendChild(S('line', { x1: DG.pad + DG.labW, y1: DG.rowBefore, x2: DG.pad + DG.labW + 3 * DG.cw, y2: DG.rowBefore, class: 'tt-gridline' }));
    root.appendChild(S('line', { x1: DG.pad, y1: DG.rowAfter - DG.gap / 2, x2: DG.pad + DG.labW + 3 * DG.cw, y2: DG.rowAfter - DG.gap / 2, class: 'tt-gridline tt-dash' }));
    root.appendChild(S('text', { x: DG.pad + 4, y: DG.rowBefore + DG.rowH / 2 + 7, class: 'tt-rowname' }, 'Before'));
    root.appendChild(S('text', { x: DG.pad + 4, y: DG.rowAfter + DG.rowH / 2 - 4, class: 'tt-rowname' }, 'After'));
    root.appendChild(S('text', { x: DG.pad + 4, y: DG.rowAfter + DG.rowH / 2 + 18, class: 'tt-rowname tt-rowname-op' }, '× 10'));
    // before digits (fixed)
    d.forEach(function (dig, k) {
      root.appendChild(S('text', { x: dgColX(1 + k), y: DG.rowBefore + DG.rowH / 2, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'tt-before' }, String(dig)));
    });
    // after slots
    var slotRects = {};
    COLS.forEach(function (c, i) {
      var r = S('rect', { x: dgColX(i) - DG.tile / 2 - 4, y: DG.rowAfter + (DG.rowH - DG.tile) / 2 - 4, width: DG.tile + 8, height: DG.tile + 8, rx: 12, class: 'tt-slot', 'data-slot': c });
      slotRects[c] = r;
      root.appendChild(r);
    });
    // tray
    root.appendChild(S('rect', { x: DG.pad + DG.labW, y: DG.trayY, width: 3 * DG.cw, height: DG.trayH, rx: 14, class: 'tt-tray' }));
    root.appendChild(S('text', { x: DG.pad + 4, y: DG.trayY + DG.trayH / 2 + 6, class: 'tt-rowname tt-rowname-soft' }, 'Tiles'));
    var arrowsG = S('g', { class: 'tt-arrows' });
    root.appendChild(arrowsG);
    var tilesG = S('g');
    root.appendChild(tilesG);

    var trayCY = DG.trayY + DG.trayH / 2;
    var slotCY = DG.rowAfter + DG.rowH / 2;
    var tiles = [
      { v: d[0], home: { x: dgColX(0), y: trayCY }, at: 'T' },
      { v: d[1], home: { x: dgColX(2), y: trayCY }, at: 'O' },
      { v: 0, home: { x: dgColX(1), y: trayCY }, at: null, zero: true },
    ];
    var occ = { H: null, T: null, O: null };
    var selected = null;
    var locked = false;

    function posOf(t) {
      return t.at ? { x: dgColX(COLS.indexOf(t.at)), y: slotCY } : t.home;
    }
    function draw(t, dx, dy) {
      var p = posOf(t);
      t.g.style.transform = 'translate(' + (p.x + (dx || 0)) + 'px,' + (p.y + (dy || 0)) + 'px)';
    }
    function setAt(t, slot) {
      if (t.at) occ[t.at] = null;
      t.at = slot;
      if (slot) occ[slot] = t;
    }
    function place(t, slot) {
      var prev = t.at;
      if (slot && occ[slot] && occ[slot] !== t) {
        var other = occ[slot];
        setAt(t, null);
        setAt(other, prev);
        draw(other);
      }
      setAt(t, slot);
      draw(t);
      tiles.forEach(function (x) {
        x.g.dataset.at = x.at || 'tray';
      });
    }
    function select(t) {
      selected = t;
      tiles.forEach(function (x) {
        x.g.classList.toggle('tt-sel', x === t);
      });
    }
    function slotAt(p) {
      var best = null;
      COLS.forEach(function (c, i) {
        if (Math.abs(p.x - dgColX(i)) <= DG.cw / 2 && Math.abs(p.y - slotCY) <= DG.rowH / 2 + 6) best = c;
      });
      return best;
    }
    tiles.forEach(function (t, k) {
      var g = S('g', { class: 'tt-tile' + (t.zero ? ' tt-tile-zero' : ''), 'data-value': t.v, 'data-tile': k });
      g.appendChild(S('rect', { x: -DG.tile / 2, y: -DG.tile / 2, width: DG.tile, height: DG.tile, rx: 12, class: 'tt-tilebg' }));
      g.appendChild(S('text', { x: 0, y: 1, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'tt-tiletext' }, String(t.v)));
      t.g = g;
      tilesG.appendChild(g);
      if (t.at) occ[t.at] = t;
      draw(t);
      g.dataset.at = t.at || 'tray';
      var moved = false;
      var unbind = MQ.ui.drag(root, g, {
        start: function () {
          if (locked) return;
          moved = false;
          g.classList.add('tt-lift');
        },
        move: function (p, dx, dy) {
          if (locked) return;
          if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
          g.style.transition = 'none';
          draw(t, dx, dy);
        },
        end: function (p) {
          g.classList.remove('tt-lift');
          g.style.transition = '';
          if (locked) return;
          if (!moved) {
            draw(t);
            select(selected === t ? null : t);
            MQ.sound('click');
            return;
          }
          place(t, slotAt(p));
          select(null);
          MQ.sound('pop');
        },
      });
      api.cleanup(unbind);
    });
    COLS.forEach(function (c) {
      slotRects[c].addEventListener('click', function () {
        if (locked || !selected) return;
        place(selected, c);
        select(null);
        MQ.sound('pop');
      });
    });

    var check = el('button', { class: 'btn tt-check', type: 'button' }, 'Check');
    var reset = el('button', { class: 'btn btn-ghost tt-reset', type: 'button' }, 'Start again');
    stage.appendChild(el('div', { class: 'tt-row' }, el('div', { class: 'tt-dragwrap' }, root), el('div', { class: 'tt-col-stack' }, check, reset)));
    var work = el('div', { class: 'tt-work' });
    stage.appendChild(work);
    reset.addEventListener('click', function () {
      if (locked) return;
      tiles.forEach(function (t, k) {
        setAt(t, k === 0 ? 'T' : k === 1 ? 'O' : null);
      });
      tiles.forEach(function (t) {
        draw(t);
        t.g.dataset.at = t.at || 'tray';
      });
      select(null);
    });

    function finish() {
      locked = true;
      check.disabled = true;
      reset.disabled = true;
      tiles.forEach(function (t) {
        t.g.classList.add('tt-tile-locked');
        if (t.at) t.g.classList.add('tt-good');
      });
      arrowsG.innerHTML = '';
      [[1, 0], [2, 1]].forEach(function (p) {
        var x1 = dgColX(p[0]);
        var x2 = dgColX(p[1]);
        var y1 = DG.rowBefore + DG.rowH / 2 + 22;
        var y2 = DG.rowAfter + 4;
        arrowsG.appendChild(S('path', { d: 'M' + x1 + ' ' + y1 + ' L' + (x2 + 6) + ' ' + y2, class: 'tt-slidearrow' }));
        arrowsG.appendChild(S('path', { d: 'M' + (x2 + 6) + ' ' + (y2 - 12) + ' L' + (x2 + 6) + ' ' + y2 + ' L' + (x2 + 17) + ' ' + (y2 - 5), class: 'tt-slidearrow' }));
      });
      work.appendChild(factChip(factText(q) + ' = ' + q.answer));
      work.appendChild(el('div', { class: 'tt-note' }, slideWords(q.n) + ' ' + q.n + ' tens = ' + q.answer + '.'));
      work.appendChild(blocksSlide(q.n));
    }

    check.addEventListener('click', function () {
      if (locked || api.isAnswered()) return;
      var v = { H: occ.H ? occ.H.v : null, T: occ.T ? occ.T.v : null, O: occ.O ? occ.O.v : null };
      var second = api.tries() >= 1;
      var slide = 'The ' + d[0] + ' slides to H, the ' + d[1] + ' slides to T, and 0 fills the ones.';
      var placedDigits = tiles[0].at && tiles[1].at;
      if (!placedDigits) {
        api.feedback('Put both digits, ' + d[0] + ' and ' + d[1] + ', on the After row first.', 'info');
        return;
      }
      if (v.H === d[0] && v.T === d[1] && v.O === 0) {
        finish();
        api.check(true, 'Yes! Every digit slid one place left: ' + factText(q) + ' = ' + q.answer + '.');
        return;
      }
      if (tiles[0].at === 'T' && tiles[1].at === 'O') {
        api.check(false, second ? slide : 'The ' + d[0] + ' and ' + d[1] + ' are still in the same places. × 10 slides each digit one place LEFT.', TAG.notMoved);
        return;
      }
      if (tiles[0].at === 'H' && tiles[1].at === 'T' && !occ.O) {
        api.check(false, second ? 'Drag the 0 tile into the O column. Without it, the number would read ' + q.n + '.' : 'Good slide! But the ones place is empty. What fills it?', TAG.zeroPlace);
        return;
      }
      if (tiles[1].at === 'H' && tiles[0].at === 'T') {
        api.check(false, second ? slide : 'The digits swapped places. Keep them in order: ' + d[0] + ' first, then ' + d[1] + '.', TAG.swapped);
        return;
      }
      if (tiles[2].at && tiles[2].at !== 'O') {
        api.check(false, second ? slide : 'The 0 is in the wrong place. The 0 fills the empty ONES place.', TAG.zeroPlace);
        return;
      }
      api.check(false, second ? slide : 'Slide each digit just ONE place left. Tens become hundreds, ones become tens.', TAG.notMoved);
    });

    api.onReveal(function () {
      select(null);
      tiles.forEach(function (t) {
        setAt(t, null);
      });
      setAt(tiles[0], 'H');
      setAt(tiles[1], 'T');
      setAt(tiles[2], 'O');
      tiles.forEach(function (t) {
        draw(t);
        t.g.dataset.at = t.at;
      });
      finish();
      api.feedback(slideWords(q.n) + ' ' + factText(q) + ' = ' + q.answer + '.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice: word problem
   * ------------------------------------------------------------------ */
  function renderWord(stage, api, q) {
    var W = WORDS[q.ctx];
    api.say(q.ctx === 'planks' ? '10 planks, all the same. Multiply by 10!' : 'Each one is a 10. How many tens?', 'think');
    stage.appendChild(MQ.ui.prompt(W.text(q.n)));
    var pic = q.ctx === 'planks' ? planksPic(q.n) : itemsPic(q.ctx, q.n);
    stage.appendChild(pic.el);
    var inp = MQ.ui.numberInput({ unit: W.unit, onSubmit: submit, label: 'Total' });
    stage.appendChild(inp.el);
    var work = el('div', { class: 'tt-work' });
    stage.appendChild(work);
    inp.focus();
    function finish() {
      inp.disable();
      if (pic.label) pic.label();
      var u = q.ctx === 'coins' ? 'c' : q.ctx === 'planks' ? ' cm' : '';
      if (q.ctx === 'planks') {
        work.appendChild(MQ.ui.sum(U.range(1, 10).map(function () {
          return q.n;
        }), q.answer, 'cm'));
      } else {
        var parts = [];
        for (var left = q.n; left > 0; left -= 10) parts.push(Math.min(10, left) * 10);
        work.appendChild(MQ.ui.sum(parts, q.answer, u.trim()));
      }
      var ch = makeChart({ later: api.later, cw: 66 });
      ch.setNumber(q.n);
      work.appendChild(el('div', { class: 'tt-row' }, ch.el, factChip(W.fact(q.n))));
      api.later(function () {
        ch.times10(function () {});
      }, 300);
    }
    function submit(v, raw) {
      if (api.isAnswered()) return;
      if (v === q.answer && !/^0/.test(String(raw).trim())) {
        inp.good();
        finish();
        api.check(true, W.fact(q.n) + '. ' + q.n + ' tens make ' + q.answer + '!');
        return;
      }
      if (v === q.answer) {
        api.feedback('Right number! Write it without a 0 at the front: ' + q.answer + '.', 'info');
        return;
      }
      inp.bad();
      var h = diagnose(q.n, v, raw, api.tries() >= 1, { unit: W.unit });
      if (q.ctx !== 'planks' && h.tag === TAG.count) h.hint = 'Each row of 10 is 100. Count the rows, then the rest in tens.';
      api.check(false, h.hint, h.tag);
    }
    api.onReveal(function () {
      inp.setValue(String(q.answer));
      inp.good();
      finish();
      api.feedback(q.ctx === 'planks' ? '10 planks of ' + q.n + ' cm: ' + q.n + ' × 10 = ' + q.answer + ' cm.' : q.n + ' tens = ' + q.answer + '. ' + W.fact(q.n) + '.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice: missing number  __ × 10 = 470
   * ------------------------------------------------------------------ */
  function renderMissing(stage, api, q) {
    var pd = digitsOf(q.product);
    api.say('What number went IN? Slide the digits back!', 'think');
    stage.appendChild(MQ.ui.prompt('The machine gave out <b>' + q.product + '</b>. What went in?'));
    var m = makeMachine();
    m.setIn('?');
    m.setOut(q.product);
    stage.appendChild(el('div', { class: 'tt-pic' }, m.el));
    var ch = makeChart({ later: api.later, cw: 72 });
    ch.setNumber(q.product);
    var inp = MQ.ui.numberInput(q.form === '10n' ? { prefix: '10 ×', unit: '= ' + q.product, onSubmit: submit, label: 'Missing number' } : { unit: '× 10 = ' + q.product, onSubmit: submit, label: 'Missing number' });
    stage.appendChild(el('div', { class: 'tt-row' }, ch.el, inp.el));
    var work = el('div', { class: 'tt-work' });
    stage.appendChild(work);
    inp.focus();
    function finish() {
      inp.disable();
      m.setIn(q.n);
      ch.divide10(function () {});
      work.appendChild(factChip(q.n + ' × 10 = ' + q.product));
      work.appendChild(el('div', { class: 'tt-note' }, 'Going back: ' + hundWord(pd[0]) + (pd[0] === 1 ? ' was ' : ' were ') + tensWord(pd[0]) + ', ' + tensWord(pd[1]) + (pd[1] === 1 ? ' was ' : ' were ') + onesWord(pd[1]) + '. ' + q.n + ' tens = ' + q.product + '.'));
    }
    function submit(v) {
      if (api.isAnswered()) return;
      var second = api.tries() >= 1;
      if (v === q.n) {
        inp.good();
        finish();
        api.check(true, 'Yes! ' + q.n + ' × 10 = ' + q.product + '. You worked backwards!');
        return;
      }
      inp.bad();
      var back = 'The ' + pd[0] + ' slides back to tens, the ' + pd[1] + ' slides back to ones, and the 0 drops off.';
      if (v === q.product || v === q.product * 10) {
        api.check(false, second ? back : q.product + ' is what came OUT. Which number × 10 makes ' + q.product + '?', TAG.backwards);
      } else if (v === q.product - 10 || v === q.product + 10) {
        api.check(false, second ? back : 'Taking away or adding 10 is not it. Which number × 10 makes ' + q.product + '?', TAG.addTen);
      } else if (v === swapDigits(q.n)) {
        api.check(false, second ? back : 'Swapped digits! Keep them in order: ' + pd[0] + ' then ' + pd[1] + '.', TAG.swapped);
      } else {
        api.check(false, second ? back : 'Check it: does your number × 10 make ' + q.product + '? Slide the digits one place right.', TAG.backwards);
      }
    }
    api.onReveal(function () {
      inp.setValue(String(q.n));
      inp.good();
      finish();
      api.feedback(q.product + ' is ' + q.n + ' tens. So ' + q.n + ' × 10 = ' + q.product + '.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice: Bolt says 0 × 10 = 10. Is Bolt right?
   * ------------------------------------------------------------------ */
  function renderZero(stage, api, q) {
    var thing = q.ctx === 'boxes' ? { many: 'boxes', item: 'pencils' } : { many: 'pencil boxes', item: 'pencils' };
    api.say('I think 0 × 10 = 10. Am I right?', 'think');
    stage.appendChild(el('div', { class: 'tt-claim' }, el('span', { class: 'tt-claim-who' }, 'Bolt says:'), el('span', { class: 'tt-claim-fact' }, '0 × 10 = 10')));
    stage.appendChild(MQ.ui.prompt('Here are <b>10 empty ' + thing.many + '</b>. Each has <b>0 ' + thing.item + '</b>. Is Bolt right?'));
    var pic = boxesPic(10, { empty: true, maxW: 700 });
    stage.appendChild(pic.el);
    var opts = U.shuffle([
      { label: 'Yes, 0 × 10 = 10', value: 10 },
      { label: 'No, 0 × 10 = 0', value: 0 },
      { label: 'No, 0 × 10 = 100', value: 100 },
    ]);
    var ch = MQ.ui.choices(opts, pick, { columns: 3 });
    ch.classList.add('tt-choices');
    ch.buttons.forEach(function (b) {
      b.dataset.value = String(b.value_);
    });
    stage.appendChild(ch);
    var work = el('div', { class: 'tt-work' });
    stage.appendChild(work);
    function finish() {
      ch.disable();
      ch.mark(0, 'good');
      pic.all();
      work.appendChild(MQ.ui.sum(U.range(1, 10).map(function () {
        return 0;
      }), 0));
      work.appendChild(el('div', { class: 'tt-note' }, '10 lots of nothing is still nothing. 0 × 10 = 0.'));
    }
    function pick(v) {
      if (api.isAnswered()) return;
      var second = api.tries() >= 1;
      if (v === 0) {
        finish();
        api.check(true, 'You are right, I was wrong! 10 empty boxes hold 0 pencils. 0 × 10 = 0.');
        return;
      }
      ch.mark(v, 'bad');
      if (v === 10) api.check(false, second ? 'Add up the boxes: 0 + 0 + 0 … ten times. What do you get?' : 'Look inside the boxes. How many pencils can you count altogether?', TAG.zeroTen);
      else api.check(false, second ? 'Add up the boxes: 0 + 0 + 0 … ten times. What do you get?' : 'Each box has nothing in it. Can 10 empty boxes hold 100 pencils?', TAG.zeroTen);
    }
    api.onReveal(function () {
      finish();
      api.feedback('Each box has 0 pencils: 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 + 0 = 0. So 0 × 10 = 0, and Bolt was wrong.', 'info');
    });
  }

  /* ------------------------------------------------------------------ */
  MQ.register(ID, {
    learn: [learnBundles, learnSlide, learnZero],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        stage.classList.add('tt-stage');
        if (q.type === 'single') renderSingle(stage, api, q);
        else if (q.type === 'drag') renderDrag(stage, api, q);
        else if (q.type === 'word') renderWord(stage, api, q);
        else if (q.type === 'missing') renderMissing(stage, api, q);
        else renderZero(stage, api, q);
      },
    },
  });

  MQ._test = MQ._test || {};
  MQ._test[ID] = {
    buildDeck: buildDeck,
    deck: function () {
      return deck;
    },
  };

  var css = [
    '.tt-stage{gap:12px}',
    '.tt-svg{display:block;max-width:100%;height:auto;user-select:none;-webkit-user-select:none}',
    '.tt-pic{width:100%;display:flex;justify-content:center}',
    '.tt-dragwrap{flex:0 1 auto;max-width:100%;display:flex;justify-content:center}',
    '.tt-row{display:flex;gap:18px;align-items:center;justify-content:center;flex-wrap:wrap;width:100%}',
    '.tt-col-stack{display:flex;flex-direction:column;gap:10px;align-items:center}',
    '.tt-work{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.tt-work:empty{display:none}',
    '.tt-note{font-weight:700;color:var(--ink-soft);text-align:center;font-size:1.05rem}',
    '.tt-note-big{font-size:1.2rem;color:var(--ink)}',
    '.tt-small{font-size:1rem;color:var(--ink-soft);font-weight:700}',
    '.tt-fact{font-size:1.5rem;font-weight:800;padding:6px 16px;border-radius:14px;background:#fff3cd;border:2px solid var(--gold)}',
    '.tt-eq{font-size:1.7rem;font-weight:800;min-width:170px;text-align:center}',
    '.tt-go{font-size:1.4rem;min-width:130px}',
    '.tt-check{background:var(--accent)}',
    /* boxes and pencils */
    '.tt-boxlab{font-size:17px;font-weight:800;fill:#7a4f12}',
    '.tt-count{font-size:20px;font-weight:800;fill:var(--ink-soft)}',
    '.tt-count-on{fill:#0b6e66}',
    '.tt-boxg:hover .tt-box{opacity:.85}',
    '.tt-cardbg{fill:#fff;stroke:var(--line);stroke-width:2.5}',
    '.tt-card{cursor:pointer}',
    '.tt-card:hover .tt-cardbg{stroke:var(--accent)}',
    '.tt-card-done{cursor:default}',
    '.tt-card-done .tt-cardbg{fill:#fffaf0;stroke:var(--gold)}',
    '.tt-cardtxt{font-size:13px;font-weight:700;fill:var(--ink-soft)}',
    /* chart */
    '.tt-frame{fill:none;stroke:#8a9bc4;stroke-width:2}',
    '.tt-gridline{stroke:#a9b6d6;stroke-width:1.5}',
    '.tt-dash{stroke-dasharray:6 5}',
    '.tt-head{font-size:20px;font-weight:800}',
    '.tt-dig{transition:transform .7s ease,opacity .5s ease}',
    '.tt-digtext{font-size:44px;font-weight:800;fill:var(--ink)}',
    '.tt-dig-zero .tt-digtext{fill:#e76f00}',
    '.tt-slidearrow{fill:none;stroke:#e76f00;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}',
    '.tt-arrow{fill:none;stroke:var(--ink-soft);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}',
    '.tt-arrowlab{font-size:15px;font-weight:800;fill:var(--ink-soft)}',
    /* blocks */
    '.tt-flat{fill:#c9b6f2;stroke:#6a3fb5;stroke-width:1.2}',
    '.tt-rod{fill:#9cc8f5;stroke:#1f63b5;stroke-width:1.2}',
    '.tt-cube{fill:#a7e0b5;stroke:#1f7a3e;stroke-width:1.2}',
    '.tt-bline{stroke:rgba(0,0,0,.18);stroke-width:.6}',
    '.tt-blklab{font-size:16px;font-weight:800;fill:var(--ink)}',
    /* machine */
    '.tt-mbox{fill:#fff;stroke:#8a9bc4;stroke-width:2.5}',
    '.tt-mbox-out{stroke:var(--gold)}',
    '.tt-mlab{font-size:13px;font-weight:800;fill:var(--ink-soft);letter-spacing:1px}',
    '.tt-mmain{fill:#ffd166;stroke:#c99700;stroke-width:3}',
    '.tt-mscreen{fill:#fff;stroke:#c99700;stroke-width:2}',
    '.tt-mop{font-size:30px;font-weight:800;fill:var(--ink)}',
    '.tt-mval{font-size:34px;font-weight:800;fill:var(--ink)}',
    '.tt-mlight{fill:#e9eef8;stroke:#c99700;stroke-width:1.5}',
    '.tt-running .tt-mlight0{fill:#e63946}',
    '.tt-running .tt-mlight1{fill:#ffb703}',
    '.tt-running .tt-mlight2{fill:#06a77d}',
    '.tt-running .tt-mmain{animation:tt-shake .3s linear infinite}',
    '@keyframes tt-shake{50%{transform:translateY(-2px)}}',
    '.tt-feed{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.tt-feedbtn{min-width:80px}',
    '.tt-results{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.tt-res{font-size:1.35rem;font-weight:800;padding:6px 14px;border-radius:12px;background:var(--info-bg);border:2px solid var(--line)}',
    '.tt-z{color:#e76f00;background:#ffe8cc;border-radius:6px;padding:0 4px}',
    /* items, planks */
    '.tt-itemlab{font-size:11px;font-weight:800;fill:#5a3a0a}',
    '.tt-itemlab-s{font-size:10px;fill:#333}',
    '.tt-rowlab{font-size:17px;font-weight:800;fill:#0b6e66}',
    '.tt-plank{fill:#deb887;stroke:#8b5a2b;stroke-width:1.5}',
    '.tt-grain{fill:none;stroke:#b07d4a;stroke-width:1}',
    '.tt-planklab{font-size:14px;font-weight:800;fill:var(--ink)}',
    '.tt-planknum{font-size:12px;font-weight:700;fill:var(--ink-soft)}',
    /* drag chart */
    '.tt-before{font-size:40px;font-weight:800;fill:#8a96b0}',
    '.tt-rowname{font-size:17px;font-weight:800;fill:var(--ink)}',
    '.tt-rowname-op{fill:#e76f00}',
    '.tt-rowname-soft{fill:var(--ink-soft)}',
    '.tt-slot{fill:#fff;fill-opacity:.65;stroke:#8a9bc4;stroke-width:2;stroke-dasharray:6 5}',
    '.tt-tray{fill:#f4f6fb;stroke:var(--line);stroke-width:2}',
    '.tt-tile{transition:transform .35s ease}',
    '.tt-tile.dragging{transition:none}',
    '.tt-tilebg{fill:#fff;stroke:#1f63b5;stroke-width:3}',
    '.tt-tile-zero .tt-tilebg{stroke:#e76f00;fill:#fff4e6}',
    '.tt-tiletext{font-size:36px;font-weight:800;fill:var(--ink);pointer-events:none}',
    '.tt-tile-zero .tt-tiletext{fill:#e76f00}',
    '.tt-sel .tt-tilebg,.tt-lift .tt-tilebg{stroke:var(--gold);stroke-width:5}',
    '.tt-good .tt-tilebg{stroke:var(--good);fill:var(--good-bg)}',
    '.tt-tile-locked{cursor:default!important}',
    /* zero card */
    '.tt-claim{display:flex;gap:12px;align-items:center;padding:8px 18px;border-radius:16px;background:#fff;border:3px dashed var(--try)}',
    '.tt-claim-who{font-weight:800;color:var(--ink-soft);font-size:1.1rem}',
    '.tt-claim-fact{font-weight:800;font-size:1.8rem}',
    '.tt-choices{max-width:720px}',
    '@media (max-width:820px){.tt-eq{font-size:1.4rem}.tt-fact{font-size:1.25rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

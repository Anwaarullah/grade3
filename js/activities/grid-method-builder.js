/* Grid Method Builder — estimate, then multiply a 2-digit number by 2–5 (Unit 11.3).
 * Bridge: a number is built from ten-strips and ones squares, copied into rows (an exact
 * base-ten array), split into a tens part and a ones part, and then written as a grid:
 *   × | 20 | 7
 *   4 | 80 | 28     80 + 28 = 108   (estimate 30 × 4 = 120)
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var TAG = {
    zero: 'Lost the zero (20 × 4 = 8)',
    add: 'Added the parts wrongly',
    round: 'Rounded the wrong way for the estimate',
    onlyTens: 'Multiplied only the tens',
    big: '3-digit total added wrongly',
    fact: 'Times fact slip in a grid box',
    split: 'Split the number into tens and ones wrongly',
  };

  /* ---------------------------------------------------------------- *
   * Maths helpers (everything drawn and checked comes from these)
   * ---------------------------------------------------------------- */
  function parts(a, n) {
    var tens = Math.floor(a / 10);
    var ones = a % 10;
    var near = ones >= 5 ? tens * 10 + 10 : tens * 10; // 5 ones: halfway, round up
    return {
      a: a,
      n: n,
      tens: tens,
      ones: ones,
      tv: tens * 10, // value of the tens part (20)
      T: tens * 10 * n, // tens box (80)
      O: ones * n, // ones box (28)
      S: a * n, // total (108)
      low: tens * 10,
      high: tens * 10 + 10,
      near: near,
      est: near * n,
    };
  }

  function repeat(v, k) {
    var out = [];
    for (var i = 0; i < k; i++) out.push(v);
    return out;
  }

  /* ---------------------------------------------------------------- *
   * Deck
   * ---------------------------------------------------------------- */
  var BOOK_L2 = [
    [23, 4],
    [35, 4],
  ];
  var BOOK_L3 = [
    [58, 3],
    [94, 2],
    [76, 5],
    [46, 5],
    [89, 2],
    [67, 3],
    [78, 4],
    [27, 5],
  ];

  function okOnes(a, allowFive) {
    var o = a % 10;
    return o !== 0 && (allowFive || o !== 5);
  }

  function buildDeck() {
    var used = {};
    var q = [];
    function add(a, n, level, extra) {
      used[a + 'x' + n] = true;
      var item = parts(a, n);
      item.level = level;
      item.estimate = level >= 2;
      item.headings = false;
      item.book = !!(extra && extra.book);
      q.push(item);
    }
    function randomOne(lo, hi, ns, allowFive) {
      for (var guard = 0; guard < 500; guard++) {
        var a = U.rand(lo, hi);
        var n = U.pick(ns);
        if (!okOnes(a, allowFive) || used[a + 'x' + n]) continue;
        return [a, n];
      }
      throw new Error('grid-method-builder: no fresh question');
    }
    // Level 1: 11–29 × 2 or × 3 (no estimate step, picture always shown)
    for (var i = 0; i < 3; i++) {
      var p1 = randomOne(11, 29, i === 1 ? [3] : i === 0 ? [2] : [2, 3], true);
      add(p1[0], p1[1], 1);
    }
    // Level 2: 20–49 × 4 or × 5, one book item (23 × 4 or 35 × 4) about half the time
    var l2 = [];
    if (Math.random() < 0.6) l2.push(U.pick(BOOK_L2).concat(['book']));
    while (l2.length < 3) {
      var r2 = randomOne(20, 49, [4, 5], false);
      var dup = l2.some(function (x) {
        return x[0] === r2[0] && x[1] === r2[1];
      });
      if (!dup) {
        used[r2[0] + 'x' + r2[1]] = true;
        l2.push(r2);
      }
    }
    U.shuffle(l2).forEach(function (x) {
      add(x[0], x[1], 2, { book: x[2] === 'book' });
    });
    // Level 3: two book items + one fresh 50–99 × 2–5
    var l3 = U.shuffle(BOOK_L3)
      .filter(function (x) {
        return !used[x[0] + 'x' + x[1]];
      })
      .slice(0, 2)
      .map(function (x) {
        return x.concat(['book']);
      });
    l3.forEach(function (x) {
      used[x[0] + 'x' + x[1]] = true;
    });
    l3.push(randomOne(50, 99, [2, 3, 4, 5], false));
    l3 = U.shuffle(l3);
    l3.forEach(function (x) {
      add(x[0], x[1], 3, { book: x[2] === 'book' });
    });
    // One level 3 question has blank headings to fill in (like the workbook's 27 × 5).
    var l3q = q.slice(6);
    var withHead = l3q.filter(function (x) {
      return x.a === 27 && x.n === 5;
    })[0] || U.pick(l3q);
    withHead.headings = true;
    return q;
  }

  /* ---------------------------------------------------------------- *
   * Base-ten array picture: n rows, each row = tens ten-strips + ones squares.
   * Every ten-strip is drawn as 10 unit squares; sizes are exact.
   * ---------------------------------------------------------------- */
  var UNIT = 20; // one square in viewBox units
  var SG = 6; // gap between strips
  var OG = 4; // gap between ones squares
  var RG = 8; // gap between rows
  var SPLIT = 30; // gap between tens part and ones part

  function arrayPic(a, n, o) {
    o = o || {};
    var tens = Math.floor(a / 10);
    var ones = a % 10;
    var tensW = tens ? tens * 10 * UNIT + (tens - 1) * SG : 0;
    var onesW = ones ? ones * UNIT + (ones - 1) * OG : 0;
    var core = tensW + (tens && ones ? SPLIT : 0) + onesW;
    var maxW = o.maxW || 820;
    var maxS = o.maxScale || 1.15;
    var s0 = Math.min(maxS, maxW / (core + 90));
    var left = 26 / s0;
    var right = (o.rightLabels ? 76 : 8) / s0;
    var top = (o.heads ? 26 : 6) / s0;
    var W = left + core + right;
    var s = Math.min(maxS, maxW / W);
    var f = 15 / s; // labels look about 15px whatever the scale
    var H = top + n * UNIT + (n - 1) * RG + 6 / s;
    var root = svg('svg', {
      viewBox: '0 0 ' + W.toFixed(1) + ' ' + H.toFixed(1),
      width: Math.round(W * s),
      height: Math.round(H * s),
      class: 'gmb-pic',
      role: 'img',
      'aria-label': n + ' rows of ' + a + ': ' + tens + ' ten-strips and ' + ones + ' ones in each row',
      style: { maxWidth: '100%', height: 'auto' },
    });
    var strips = [];
    var onesEls = [];
    var rightLabels = [];
    var splitX = left + tensW + SPLIT / 2;
    function rowY(r) {
      return top + r * (UNIT + RG);
    }
    if (o.heads) {
      if (tens) root.appendChild(svg('text', { x: left + tensW / 2, y: top - 8 / s, class: 'gmb-head', 'text-anchor': 'middle', style: { fontSize: f + 'px' } }, String(tens * 10)));
      if (ones) root.appendChild(svg('text', { x: left + tensW + (tens ? SPLIT : 0) + onesW / 2, y: top - 8 / s, class: 'gmb-head gmb-head-o', 'text-anchor': 'middle', style: { fontSize: f + 'px' } }, String(ones)));
    }
    for (var r = 0; r < n; r++) {
      var y = rowY(r);
      if ((UNIT + RG) * s >= 15) root.appendChild(svg('text', { x: left / 2, y: y + UNIT / 2 + f * 0.35, class: 'gmb-rownum', 'text-anchor': 'middle', style: { fontSize: f * 0.85 + 'px' } }, String(r + 1)));
      var rowStrips = [];
      for (var k = 0; k < tens; k++) {
        var x = left + k * (10 * UNIT + SG);
        var g = svg('g', { class: 'gmb-strip' });
        g.appendChild(svg('rect', { x: x, y: y, width: 10 * UNIT, height: UNIT, rx: 2, class: 'gmb-strip-body' }));
        for (var j = 1; j < 10; j++) g.appendChild(svg('line', { x1: x + j * UNIT, y1: y, x2: x + j * UNIT, y2: y + UNIT, class: 'gmb-strip-line' }));
        var t = svg('text', { x: x + 5 * UNIT, y: y + UNIT / 2 + 5, class: 'gmb-strip-num', 'text-anchor': 'middle' }, '');
        g.appendChild(t);
        g.numEl = t;
        g.sx = x;
        g.sy = y;
        root.appendChild(g);
        rowStrips.push(g);
      }
      strips.push(rowStrips);
      var rowOnes = [];
      for (var m = 0; m < ones; m++) {
        var ox = left + tensW + (tens ? SPLIT : 0) + m * (UNIT + OG);
        var sq = svg('rect', { x: ox, y: y, width: UNIT, height: UNIT, rx: 2, class: 'gmb-one' });
        root.appendChild(sq);
        rowOnes.push(sq);
      }
      onesEls.push(rowOnes);
      if (o.rightLabels) {
        var rl = svg('text', { x: left + core + 10 / s, y: y + UNIT / 2 + f * 0.35, class: 'gmb-rowlabel', style: { fontSize: f + 'px' } }, '');
        root.appendChild(rl);
        rightLabels.push(rl);
      }
    }
    var splitLine = null;
    if (tens && ones) {
      splitLine = svg('line', { x1: splitX, y1: 2, x2: splitX, y2: H - 2, class: 'gmb-split' + (o.split ? ' gmb-on' : ''), style: { strokeWidth: 3 / s + 'px', strokeDasharray: 7 / s + ' ' + 5 / s } });
      root.appendChild(splitLine);
    }
    return {
      svg: root,
      strips: strips,
      ones: onesEls,
      rightLabels: rightLabels,
      scale: s,
      showSplit: function () {
        if (splitLine) splitLine.classList.add('gmb-on');
      },
      /** label inside strips is only readable when the picture is not shrunk much */
      canLabel: s >= 0.7,
    };
  }

  /** Light every strip and ones square (for reveal); label strips 10, 20, … when readable. */
  function lightAll(pic, labelStrips) {
    var k = 0;
    pic.strips.forEach(function (row) {
      row.forEach(function (g) {
        k++;
        g.classList.add('gmb-lit');
        if (labelStrips && pic.canLabel) g.numEl.textContent = String(k * 10);
      });
    });
    pic.ones.forEach(function (row) {
      row.forEach(function (sq) {
        sq.classList.add('gmb-lit');
      });
    });
    pic.showSplit();
  }

  /* ---------------------------------------------------------------- *
   * Working shown under the grid (reveal + learn)
   * ---------------------------------------------------------------- */
  function chipRow(items) {
    var row = el('div', { class: 'sum-row gmb-work-row' });
    items.forEach(function (it) {
      if (typeof it === 'string' && /^[+=,…→]$/.test(it)) row.appendChild(el('span', { class: 'sum-op' }, it));
      else if (it && it.nodeType) row.appendChild(it);
      else row.appendChild(el('span', { class: 'chip' }, String(it)));
    });
    return row;
  }

  function tensWorking(p) {
    var count = p.tens * p.n;
    var label = el('span', { class: 'gmb-work-label gmb-work-t' }, 'Tens');
    if (count <= 8) {
      var items = [label];
      for (var i = 1; i <= count; i++) {
        if (i > 1) items.push(',');
        items.push(String(i * 10));
      }
      items.push('→');
      items.push(el('span', { class: 'chip chip-total' }, count + ' tens = ' + p.T));
      return chipRow(items);
    }
    var it2 = [label];
    repeat(p.tv, p.n).forEach(function (v, j) {
      if (j) it2.push('+');
      it2.push(String(v));
    });
    it2.push('=');
    it2.push(el('span', { class: 'chip chip-total' }, p.T));
    it2.push(el('span', { class: 'gmb-work-note' }, '(' + p.tens + ' tens × ' + p.n + ' = ' + count + ' tens)'));
    return chipRow(it2);
  }

  function onesWorking(p) {
    var items = [el('span', { class: 'gmb-work-label gmb-work-o' }, 'Ones')];
    repeat(p.ones, p.n).forEach(function (v, j) {
      if (j) items.push('+');
      items.push(String(v));
    });
    items.push('=');
    items.push(el('span', { class: 'chip chip-total' }, p.O));
    return chipRow(items);
  }

  function totalWorking(p) {
    return chipRow([el('span', { class: 'gmb-work-label' }, 'Total'), String(p.T), '+', String(p.O), '=', el('span', { class: 'chip chip-total' }, p.S)]);
  }

  function compareEl(p) {
    var diff = Math.abs(p.S - p.est);
    return el(
      'div',
      { class: 'gmb-compare' },
      el('span', { class: 'gmb-cmp-box' }, 'Estimate ', el('b', null, String(p.est))),
      el('span', { class: 'gmb-cmp-box gmb-cmp-ans' }, 'Answer ', el('b', null, String(p.S))),
      el('span', { class: 'gmb-cmp-note' }, diff === 0 ? 'Exactly the same!' : 'Only ' + diff + ' apart: close, so it makes sense ✓')
    );
  }

  /* ---------------------------------------------------------------- *
   * Small number line for the estimate (low ten → high ten)
   * ---------------------------------------------------------------- */
  function miniLine(p) {
    var W = 460;
    var H = 74;
    var x0 = 40;
    var step = 38;
    function X(v) {
      return x0 + (v - p.low) * step;
    }
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'gmb-mini', style: { maxWidth: '100%', height: 'auto' } });
    root.appendChild(svg('line', { x1: X(p.low), y1: 44, x2: X(p.high), y2: 44, class: 'gmb-nl-line' }));
    for (var v = p.low; v <= p.high; v++) {
      var big = v === p.low || v === p.high;
      root.appendChild(svg('line', { x1: X(v), y1: big ? 32 : 38, x2: X(v), y2: big ? 56 : 50, class: 'gmb-nl-tick' }));
      if (big) root.appendChild(svg('text', { x: X(v), y: 72, class: 'gmb-nl-num', 'text-anchor': 'middle' }, String(v)));
    }
    root.appendChild(svg('circle', { cx: X(p.a), cy: 44, r: 8, class: 'gmb-nl-dot' }));
    root.appendChild(svg('text', { x: X(p.a), y: 24, class: 'gmb-nl-a', 'text-anchor': 'middle' }, String(p.a)));
    return root;
  }

  /* ---------------------------------------------------------------- *
   * The grid with answer boxes
   * ---------------------------------------------------------------- */
  function boxInput(label, cls) {
    return el('input', { class: 'gmb-in' + (cls ? ' ' + cls : ''), type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: '3', 'aria-label': label, placeholder: '?' });
  }

  function gridWidget(p, withHeads, onEnter) {
    var ins = {};
    var hT;
    var hO;
    var hN;
    if (withHeads) {
      ins.h1 = boxInput('Tens heading', 'gmb-in-head');
      ins.h2 = boxInput('Ones heading', 'gmb-in-head');
      ins.hn = boxInput('Number to multiply by', 'gmb-in-head');
      hT = ins.h1;
      hO = ins.h2;
      hN = ins.hn;
    } else {
      hT = String(p.tv);
      hO = String(p.ones);
      hN = String(p.n);
    }
    ins.t = boxInput('Tens box');
    ins.o = boxInput('Ones box');
    ins.s = boxInput('Total');
    var table = el(
      'table',
      { class: 'gmb-grid' },
      el('tr', { class: 'gmb-cap' }, el('td'), el('td', null, 'tens'), el('td', null, 'ones')),
      el('tr', null, el('th', { class: 'gmb-x' }, '×'), el('th', { class: 'gmb-th-t' }, hT), el('th', { class: 'gmb-th-o' }, hO)),
      el('tr', null, el('th', { class: 'gmb-th-n' }, hN), el('td', { class: 'gmb-td-t' }, ins.t), el('td', { class: 'gmb-td-o' }, ins.o))
    );
    var echoT = el('span', { class: 'gmb-echo gmb-echo-t' }, '?');
    var echoO = el('span', { class: 'gmb-echo gmb-echo-o' }, '?');
    var totalRow = el('div', { class: 'gmb-total' }, el('span', { class: 'gmb-total-label' }, 'Add the boxes:'), echoT, el('span', { class: 'sum-op' }, '+'), echoO, el('span', { class: 'sum-op' }, '='), ins.s);
    function echo() {
      echoT.textContent = ins.t.value.trim() || '?';
      echoO.textContent = ins.o.value.trim() || '?';
    }
    Object.keys(ins).forEach(function (k) {
      ins[k].addEventListener('input', function () {
        ins[k].classList.remove('gmb-bad');
        echo();
      });
      ins[k].addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          onEnter();
        }
      });
    });
    var order = withHeads ? ['h1', 'h2', 'hn', 't', 'o', 's'] : ['t', 'o', 's'];
    return {
      el: el('div', { class: 'gmb-gridwrap' }, table, totalRow),
      ins: ins,
      order: order,
      echo: echo,
      values: function () {
        var v = {};
        order.forEach(function (k) {
          var raw = ins[k].value.trim();
          v[k] = /^\d{1,3}$/.test(raw) ? parseInt(raw, 10) : null;
        });
        return v;
      },
      fill: function () {
        var right = { h1: p.tv, h2: p.ones, hn: p.n, t: p.T, o: p.O, s: p.S };
        order.forEach(function (k) {
          ins[k].value = String(right[k]);
          ins[k].classList.remove('gmb-bad');
          ins[k].classList.add('gmb-good');
        });
        echo();
      },
      disable: function () {
        order.forEach(function (k) {
          ins[k].disabled = true;
        });
      },
      bad: function (k) {
        ins[k].classList.add('gmb-bad');
      },
      good: function () {
        order.forEach(function (k) {
          ins[k].classList.remove('gmb-bad');
          ins[k].classList.add('gmb-good');
        });
      },
      focusFirst: function () {
        try {
          ins[order[0]].focus({ preventScroll: true });
        } catch (e) {}
      },
    };
  }

  /** Decide what is wrong (first problem only). Returns null when all right. */
  function diagnose(p, v, tries) {
    var strong = tries >= 1;
    if ('h1' in v) {
      if (v.h1 !== p.tv) {
        if (v.h1 === p.tens) return { k: 'h1', tag: TAG.zero, hint: p.a + ' has ' + p.tens + ' tens. ' + p.tens + ' tens is worth ' + p.tv + ', so the tens heading is ' + p.tv + '.' };
        return { k: 'h1', tag: TAG.split, hint: 'Split ' + p.a + ' into tens and ones: ' + p.tv + ' and ' + p.ones + '. Write the tens part at the top of the tens column.' };
      }
      if (v.h2 !== p.ones) return { k: 'h2', tag: TAG.split, hint: 'Split ' + p.a + ' into tens and ones: ' + p.tv + ' and ' + p.ones + '. The ones heading is ' + p.ones + '.' };
      if (v.hn !== p.n) return { k: 'hn', tag: TAG.split, hint: 'We multiply by ' + p.n + ', so ' + p.n + ' goes down the side (it means ' + p.n + ' rows).' };
    }
    if (v.t !== p.T) {
      if (v.t === p.tens * p.n) return { k: 't', tag: TAG.zero, hint: p.tens + ' tens × ' + p.n + ' = ' + p.tens * p.n + ' tens = ' + p.T + '. Don’t lose the zero!' + (strong ? ' Count the ten-strips: 10, 20, 30 …' : '') };
      if (v.t === p.tv) return { k: 't', tag: TAG.fact, hint: 'There are ' + p.n + ' rows, so ' + p.tv + ' is there ' + p.n + ' times: ' + repeat(p.tv, p.n).join(' + ') + '.' };
      return {
        k: 't',
        tag: TAG.fact,
        hint: strong
          ? 'Count up in ' + p.tv + 's: ' + repeat(p.tv, p.n).map(function (x, i) { return x * (i + 1); }).slice(0, -1).join(', ') + ', … one more jump!'
          : 'Tens box: ' + p.tv + ' × ' + p.n + '. Think ' + p.tens + ' × ' + p.n + ' = ' + p.tens * p.n + ', so it is ' + p.tens * p.n + ' tens.',
      };
    }
    if (v.o !== p.O) {
      if (v.o === p.ones) return { k: 'o', tag: TAG.onlyTens, hint: 'You multiplied the tens. Now multiply the ones too: ' + p.ones + ' × ' + p.n + ' = ' + repeat(p.ones, p.n).join(' + ') + '.' };
      var steps = repeat(p.ones, p.n).map(function (x, i) { return x * (i + 1); });
      return {
        k: 'o',
        tag: TAG.fact,
        hint: strong
          ? 'Count on in ' + p.ones + 's: ' + steps.slice(0, -1).join(', ') + ', … one more jump of ' + p.ones + '!'
          : 'Ones box: ' + p.ones + ' × ' + p.n + ' means ' + repeat(p.ones, p.n).join(' + ') + '. Add them up.',
      };
    }
    if (v.s !== p.S) {
      if (v.s === p.T + p.ones && p.ones !== p.O) return { k: 's', tag: TAG.onlyTens, hint: 'Add the two boxes: ' + p.T + ' + ' + p.O + '. The ones box is ' + p.O + ', not ' + p.ones + '.' };
      var oT = Math.floor(p.O / 10) * 10;
      var oU = p.O % 10;
      var split = oT && oU ? p.T + ' + ' + oT + ' = ' + (p.T + oT) + ', then add ' + oU + ' more.' : 'Add the tens first, then the ones.';
      if (p.S >= 100) {
        return {
          k: 's',
          tag: TAG.big,
          hint: strong ? 'Try it in two jumps: ' + split : 'Line up hundreds, tens and ones, then add ' + p.T + ' + ' + p.O + '. Start with the ones.',
        };
      }
      return { k: 's', tag: TAG.add, hint: 'Add the two boxes: ' + p.T + ' + ' + p.O + '. ' + (strong ? split : 'Add the tens first, then the ones.') };
    }
    return null;
  }

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */
  var L = parts(27, 4);

  // 1. Estimate: drag 27 to the nearer ten, then 30 × 4 as ten-strips.
  function learnEstimate(stage, api) {
    api.say('Before we multiply, we estimate. Is 27 nearer to 20 or to 30? Drag the pin to the nearer ten.', 'think');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Estimate first: 27 × 4', 'Round <b>27</b> to the nearest ten.'));
    var W = 720;
    var H = 120;
    var x0 = 60;
    var step = 60;
    function X(v) {
      return x0 + (v - 20) * step;
    }
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'gmb-line', style: { maxWidth: '100%', height: 'auto' } });
    root.appendChild(svg('line', { x1: X(20), y1: 80, x2: X(30), y2: 80, class: 'gmb-nl-line' }));
    var endHits = {};
    for (var v = 20; v <= 30; v++) {
      var big = v === 20 || v === 30;
      root.appendChild(svg('line', { x1: X(v), y1: big ? 64 : 72, x2: X(v), y2: big ? 96 : 88, class: 'gmb-nl-tick' }));
      root.appendChild(svg('text', { x: X(v), y: 116, class: big ? 'gmb-nl-num gmb-nl-big' : 'gmb-nl-num gmb-nl-small', 'text-anchor': 'middle' }, String(v)));
      if (big) {
        var hit = svg('rect', { x: X(v) - 30, y: 60, width: 60, height: 60, class: 'gmb-hitbox', 'data-ten': String(v) });
        root.appendChild(hit);
        endHits[v] = hit;
      }
    }
    var pin = svg('g', { class: 'gmb-pin' });
    pin.appendChild(svg('line', { x1: 0, y1: 40, x2: 0, y2: 80, class: 'gmb-pin-stem' }));
    pin.appendChild(svg('circle', { cx: 0, cy: 26, r: 22, class: 'gmb-pin-head' }));
    pin.appendChild(svg('text', { x: 0, y: 33, class: 'gmb-pin-text', 'text-anchor': 'middle' }, '27'));
    root.appendChild(pin);
    var pos = 27;
    var done = false;
    function place(val) {
      pin.setAttribute('transform', 'translate(' + X(val) + ',0)');
    }
    place(27);
    stage.appendChild(el('div', { class: 'gmb-linewrap' }, root));
    var after = el('div', { class: 'gmb-after' });
    stage.appendChild(after);

    function choose(ten) {
      if (done) return;
      if (ten === 30) {
        done = true;
        place(30);
        pin.classList.add('gmb-pin-ok');
        api.sound('correct');
        api.say('Yes! 27 is only 3 away from 30. So 27 × 4 is about 30 × 4.', 'cheer');
        showTimes();
      } else {
        place(27);
        api.sound('wrong');
        api.feedback('27 is 7 steps from 20 but only 3 steps from 30. Which ten is nearer?', 'try');
      }
    }
    function showTimes() {
      var pic = arrayPic(30, 4, { maxW: 560, rightLabels: true });
      after.appendChild(el('div', { class: 'gmb-subtitle' }, '30 × 4: three ten-strips, 4 times'));
      after.appendChild(el('div', { class: 'gmb-picbox' }, pic.svg));
      var k = 0;
      pic.strips.forEach(function (row, r) {
        api.later(function () {
          row.forEach(function (g) {
            k++;
            g.classList.add('gmb-lit');
            g.numEl.textContent = String(k * 10);
          });
          pic.rightLabels[r].textContent = (r + 1) * 3 + ' tens';
          api.sound('pop');
        }, 500 * (r + 1));
      });
      api.later(function () {
        after.appendChild(chipRow(['3 tens × 4', '=', '12 tens', '=', el('span', { class: 'chip chip-total' }, '120')]));
        api.feedback('3 × 4 = 12, so 30 × 4 = 12 tens = 120. Our estimate: 27 × 4 is about 120.', 'good');
        api.unlockNext();
      }, 500 * 4 + 400);
    }
    var startPos = 27;
    api.cleanup(
      MQ.ui.drag(root, pin, {
        start: function () {
          startPos = pos;
        },
        move: function (p, dx) {
          if (done) return;
          pos = U.clamp(startPos + dx / step, 20, 30);
          place(pos);
        },
        end: function () {
          if (done) return;
          if (Math.abs(pos - 30) <= 1.5) choose(30);
          else if (Math.abs(pos - 20) <= 1.5) choose(20);
          else {
            pos = 27;
            place(27);
            api.feedback('Drag the pin all the way to 20 or to 30.', 'info');
          }
          pos = done ? 30 : 27;
        },
      })
    );
    [20, 30].forEach(function (t) {
      endHits[t].addEventListener('click', function () {
        choose(t);
      });
    });
  }

  // 2. Build 27 from strips and ones, then copy the row until there are 4 rows.
  function learnBuild(stage, api) {
    api.say('Let’s build 27. Drag (or click) 2 ten-strips and 7 ones into the first row.', 'happy');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Build 27, then make 4 rows', '27 × 4 means <b>4 rows of 27</b>.'));
    var left = 40;
    var trayY = 16;
    var rowsY = 110;
    var rowStep = UNIT + 14;
    var tensW = 2 * 10 * UNIT + SG;
    var core = tensW + SPLIT + 7 * UNIT + 6 * OG;
    var W = left + core + 30;
    var H = rowsY + 4 * rowStep + 6;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: Math.round(W * 1.1), height: Math.round(H * 1.1), class: 'gmb-build', style: { maxWidth: '100%', height: 'auto' } });

    function stripShape(x, y, cls) {
      var g = svg('g', { class: 'gmb-strip ' + (cls || '') });
      g.appendChild(svg('rect', { x: x, y: y, width: 10 * UNIT, height: UNIT, rx: 2, class: 'gmb-strip-body' }));
      for (var j = 1; j < 10; j++) g.appendChild(svg('line', { x1: x + j * UNIT, y1: y, x2: x + j * UNIT, y2: y + UNIT, class: 'gmb-strip-line' }));
      return g;
    }
    function oneShape(x, y, cls) {
      return svg('rect', { x: x, y: y, width: UNIT, height: UNIT, rx: 2, class: 'gmb-one ' + (cls || '') });
    }
    // tray
    var srcTen = stripShape(left, trayY, 'gmb-src');
    srcTen.setAttribute('data-src', 'ten');
    var srcOne = oneShape(left + 10 * UNIT + 70, trayY, 'gmb-src');
    srcOne.setAttribute('data-src', 'one');
    root.appendChild(srcTen);
    root.appendChild(srcOne);
    root.appendChild(svg('text', { x: left + 5 * UNIT, y: trayY + UNIT + 22, class: 'gmb-tray-label', 'text-anchor': 'middle' }, 'ten-strip = 10'));
    root.appendChild(svg('text', { x: left + 10 * UNIT + 70 + UNIT / 2, y: trayY + UNIT + 22, class: 'gmb-tray-label', 'text-anchor': 'middle' }, 'one = 1'));
    // row tracks
    var tracks = [];
    for (var r = 0; r < 4; r++) {
      var ty = rowsY + r * rowStep;
      root.appendChild(svg('text', { x: left / 2, y: ty + UNIT / 2 + 5, class: 'gmb-rownum', 'text-anchor': 'middle' }, String(r + 1)));
      var tr = svg('rect', { x: left - 4, y: ty - 4, width: core + 8, height: UNIT + 8, rx: 6, class: 'gmb-track' + (r === 0 ? ' gmb-track-live' : '') });
      root.appendChild(tr);
      tracks.push(tr);
    }
    var pieces = svg('g');
    root.appendChild(pieces);
    var state = { tens: 0, ones: 0, rows: 1 };

    function drawRow(r) {
      var y = rowsY + r * rowStep;
      for (var k = 0; k < state.tens; k++) pieces.appendChild(stripShape(left + k * (10 * UNIT + SG), y, r ? 'gmb-copy' : ''));
      for (var m = 0; m < state.ones; m++) pieces.appendChild(oneShape(left + tensW + SPLIT + m * (UNIT + OG), y, r ? 'gmb-copy' : ''));
    }
    function redraw() {
      MQ.clear(pieces);
      for (var rr = 0; rr < state.rows; rr++) drawRow(rr);
      readout.innerHTML = state.rows === 1 ? 'Row 1: <b>' + state.tens + '</b> tens and <b>' + state.ones + '</b> ones = <b>' + (state.tens * 10 + state.ones) + '</b>' : '<b>' + state.rows + '</b> rows of 27';
      copyBtn.disabled = !(state.tens === 2 && state.ones === 7) || state.rows >= 4;
    }
    function addPiece(kind) {
      if (state.rows > 1) return;
      if (kind === 'ten') {
        if (state.tens >= 2) {
          api.feedback('27 has only 2 tens. Now add the ones.', 'info');
          return;
        }
        state.tens++;
      } else {
        if (state.ones >= 7) {
          api.feedback('27 has only 7 ones.' + (state.tens < 2 ? ' Add another ten-strip.' : ''), 'info');
          return;
        }
        state.ones++;
      }
      api.sound('pop');
      redraw();
      if (state.tens === 2 && state.ones === 7) {
        api.say('That’s 27! Now press “Copy row” until there are 4 rows.', 'cheer');
        api.feedback('Row 1 is 27. Copy it to make 4 rows.', 'good');
      }
    }
    var readout = el('div', { class: 'gmb-readout' });
    var copyBtn = el(
      'button',
      {
        class: 'btn gmb-copy-btn',
        type: 'button',
        onclick: function () {
          if (copyBtn.disabled) return;
          state.rows++;
          api.sound('pop');
          redraw();
          if (state.rows === 4) {
            copyBtn.disabled = true;
            api.say('4 rows of 27. That is 27 × 4!', 'cheer');
            api.feedback('4 rows of 27 = 27 × 4. Next we count it the easy way.', 'good');
            api.unlockNext();
          }
        },
      },
      '⧉ Copy row'
    );
    [
      [srcTen, 'ten'],
      [srcOne, 'one'],
    ].forEach(function (pair) {
      var src = pair[0];
      var ghost = null;
      var moved = 0;
      api.cleanup(
        MQ.ui.drag(root, src, {
          start: function () {
            moved = 0;
            ghost = src.cloneNode(true);
            ghost.classList.add('gmb-ghost');
            ghost.classList.remove('dragging');
            root.appendChild(ghost);
          },
          move: function (p, dx, dy) {
            moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
            if (ghost) ghost.setAttribute('transform', 'translate(' + dx + ',' + dy + ')');
          },
          end: function (p) {
            if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
            ghost = null;
            if (moved < 6 || p.y > rowsY - 30) addPiece(pair[1]);
          },
        })
      );
    });
    stage.appendChild(el('div', { class: 'gmb-picbox' }, root));
    stage.appendChild(el('div', { class: 'gmb-buildbar' }, readout, copyBtn));
    redraw();
  }

  // 3. Split: count the tens in jumps of 10, the ones as 7 + 7 + 7 + 7.
  function learnSplit(stage, api) {
    api.say('A line splits the tens from the ones. Click each ten-strip to count in tens.', 'think');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Split into tens and ones', 'Count the <b>tens</b> part, then the <b>ones</b> part.'));
    var pic = arrayPic(27, 4, { split: true, rightLabels: true, heads: true, maxW: 760 });
    stage.appendChild(el('div', { class: 'gmb-picbox' }, pic.svg));
    var out = el('div', { class: 'gmb-learn-work' });
    stage.appendChild(out);
    var tensCount = 0;
    var onesRows = 0;
    var tensDone = false;
    var onesSeen = [];
    var tensChips = el('div', { class: 'sum-row gmb-work-row' }, el('span', { class: 'gmb-work-label gmb-work-t' }, 'Tens'));
    out.appendChild(tensChips);
    pic.strips.forEach(function (row) {
      row.forEach(function (g) {
        g.classList.add('gmb-clickable');
        g.addEventListener('click', function () {
          if (g.classList.contains('gmb-lit')) return;
          tensCount++;
          g.classList.add('gmb-lit');
          g.numEl.textContent = String(tensCount * 10);
          api.sound('pop');
          if (tensCount > 1) tensChips.appendChild(el('span', { class: 'sum-op' }, ','));
          tensChips.appendChild(el('span', { class: 'chip' }, String(tensCount * 10)));
          if (tensCount === 8) {
            tensDone = true;
            tensChips.appendChild(el('span', { class: 'sum-op' }, '→'));
            tensChips.appendChild(el('span', { class: 'chip chip-total' }, '8 tens = 80'));
            api.say('8 tens = 80. Now click each row of ones.', 'cheer');
            pic.ones.forEach(function (row2) {
              row2.forEach(function (sq) {
                sq.classList.add('gmb-clickable');
              });
            });
          }
        });
      });
    });
    var onesChips = el('div', { class: 'sum-row gmb-work-row' }, el('span', { class: 'gmb-work-label gmb-work-o' }, 'Ones'));
    pic.ones.forEach(function (row, r) {
      row.forEach(function (sq) {
        sq.addEventListener('click', function () {
          if (!tensDone) {
            api.feedback('Count the ten-strips first: click each one.', 'info');
            return;
          }
          if (onesSeen[r]) return;
          onesSeen[r] = true;
          onesRows++;
          row.forEach(function (s2) {
            s2.classList.add('gmb-lit');
          });
          pic.rightLabels[r].textContent = String(onesRows * 7);
          api.sound('pop');
          if (onesRows === 1) out.appendChild(onesChips);
          else onesChips.appendChild(el('span', { class: 'sum-op' }, '+'));
          onesChips.appendChild(el('span', { class: 'chip' }, '7'));
          if (onesRows === 4) {
            onesChips.appendChild(el('span', { class: 'sum-op' }, '='));
            onesChips.appendChild(el('span', { class: 'chip chip-total' }, '28'));
            api.say('7 + 7 + 7 + 7 = 28. Tens part 80, ones part 28!', 'cheer');
            api.feedback('Tens: 80. Ones: 28. Next, we put them in a grid.', 'good');
            api.unlockNext();
          }
        });
      });
    });
  }

  // 4. The picture becomes the grid; add 80 + 28 and compare with the estimate.
  function learnGrid(stage, api) {
    api.say('The picture turns into a grid. Now add the two boxes.', 'happy');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('The grid method', 'Tens box + ones box = the answer.'));
    var pic = arrayPic(27, 4, { split: true, heads: true, maxW: 420, maxScale: 0.6 });
    lightAll(pic, false);
    var grid = el(
      'table',
      { class: 'gmb-grid gmb-grid-show' },
      el('tr', { class: 'gmb-cap' }, el('td'), el('td', null, 'tens'), el('td', null, 'ones')),
      el('tr', null, el('th', { class: 'gmb-x' }, '×'), el('th', { class: 'gmb-th-t' }, '20'), el('th', { class: 'gmb-th-o' }, '7')),
      el('tr', null, el('th', { class: 'gmb-th-n' }, '4'), el('td', { class: 'gmb-td-t gmb-pop' }, '80'), el('td', { class: 'gmb-td-o gmb-pop' }, '28'))
    );
    stage.appendChild(el('div', { class: 'gmb-pair' }, el('div', { class: 'gmb-picbox' }, pic.svg), el('div', { class: 'gmb-arrow' }, '→'), grid));
    var cmp = el('div', { class: 'gmb-after' });
    var inp = MQ.ui.numberInput({
      prefix: '80 + 28 =',
      label: '80 plus 28',
      onSubmit: function (num) {
        if (num === 108) {
          inp.good();
          inp.disable();
          api.sound('correct');
          api.say('108! Our estimate was 120. 108 is close to 120, so it makes sense.', 'cheer');
          api.feedback('27 × 4 = 108. Estimate 120: close, so the answer makes sense.', 'good');
          cmp.appendChild(compareEl(L));
          api.unlockNext();
        } else {
          inp.bad();
          api.sound('wrong');
          api.feedback(num === 98 ? 'Careful: 80 + 20 = 100, not 90. Then add the 8.' : 'Add in two jumps: 80 + 20 = 100, then 100 + 8.', 'try');
        }
      },
    });
    stage.appendChild(inp.el);
    stage.appendChild(cmp);
    inp.focus();
  }

  /* ---------------------------------------------------------------- *
   * Practice
   * ---------------------------------------------------------------- */
  var deck = null;

  function renderQuestion(stage, api) {
    if (!deck || api.index === 0) deck = buildDeck();
    var p = deck[api.index];
    var root = el('div', { class: 'gmb-q', 'data-a': String(p.a), 'data-n': String(p.n), 'data-answer': String(p.S), 'data-est': String(p.est), 'data-near': String(p.near), 'data-heads': p.headings ? '1' : '0' });
    stage.appendChild(root);
    root.appendChild(MQ.ui.prompt('Work out <span class="gmb-big">' + p.a + ' × ' + p.n + '</span>'));

    var picShown = false;
    var picHolder = el('div', { class: 'gmb-picbox gmb-pichold' });
    var pic = null;
    function showPic() {
      if (picShown) return;
      picShown = true;
      pic = arrayPic(p.a, p.n, { split: true, heads: true, maxW: 820, maxScale: p.level === 1 ? 1 : 0.9 });
      picHolder.appendChild(el('div', { class: 'gmb-pic-cap' }, p.n + ' rows of ' + p.a));
      picHolder.appendChild(pic.svg);
    }

    var estDone = !p.estimate;
    var estBox = null;
    var estChoices = null;
    var opts = [];
    if (p.estimate) {
      var third = p.low - 10 >= 10 && Math.random() < 0.5 ? p.low - 10 : p.high + 10;
      opts = [p.low, p.high, third].sort(function (x, y) {
        return x - y;
      });
      estBox = el('div', { class: 'gmb-est' });
      estBox.appendChild(el('div', { class: 'gmb-step' }, el('span', { class: 'gmb-stepnum' }, '1'), 'Estimate: round ' + p.a + ' to the nearest ten' + (p.ones === 5 ? ' (5 ones is halfway: round up)' : '') + '.'));
      estBox.appendChild(miniLine(p));
      estChoices = MQ.ui.choices(
        opts.map(function (t) {
          return { label: t + ' × ' + p.n + ' = ' + t * p.n, value: t };
        }),
        function (t) {
          if (estDone || api.isAnswered()) return;
          if (t === p.near) {
            estChoices.mark(t, 'good');
            finishEstimate(false);
          } else {
            estChoices.mark(t, 'bad');
            var hint;
            if (t !== p.low && t !== p.high) hint = 'That ten is too far away. ' + p.a + ' is between ' + p.low + ' and ' + p.high + '.';
            else if (p.ones === 5) hint = p.a + ' is exactly halfway between ' + p.low + ' and ' + p.high + '. When it ends in 5, we round up.';
            else hint = p.a + ' is ' + (p.a - p.low) + ' away from ' + p.low + ' and ' + (p.high - p.a) + ' away from ' + p.high + '. Which ten is nearer?';
            if (api.tries() >= 1) hint += ' Round ' + p.a + ' to ' + p.near + ', then ' + p.near / 10 + ' tens × ' + p.n + '.';
            showPic();
            api.check(false, hint, TAG.round);
          }
        },
        { columns: 3 }
      );
      estBox.appendChild(estChoices);
      root.appendChild(estBox);
    }

    var gridSec = el('div', { class: 'gmb-gridsec' + (estDone ? '' : ' gmb-hide') });
    if (p.estimate) gridSec.appendChild(el('div', { class: 'gmb-step' }, el('span', { class: 'gmb-stepnum' }, '2'), p.headings ? 'Fill in the grid: write the headings too.' : 'Now the exact answer: fill in the grid.'));
    var gw = gridWidget(p, p.headings, check);
    var checkBtn = el('button', { class: 'btn btn-check gmb-check', type: 'button', onclick: check }, 'Check');
    gridSec.appendChild(el('div', { class: 'gmb-gridrow' }, gw.el, checkBtn));
    root.appendChild(gridSec);
    root.appendChild(picHolder);
    var workHolder = el('div', { class: 'gmb-workbox' });
    root.appendChild(workHolder);
    if (p.level === 1) showPic();

    function finishEstimate(silent) {
      estDone = true;
      estChoices.disable();
      var chip = el('div', { class: 'gmb-est-done' }, '✓ Estimate: ' + p.a + ' is about ' + p.near + ', so ' + p.near + ' × ' + p.n + ' = ', el('b', null, String(p.est)));
      MQ.clear(estBox);
      estBox.appendChild(chip);
      gridSec.classList.remove('gmb-hide');
      if (!silent) {
        api.sound('pop');
        api.say('Good estimate: about ' + p.est + '. Now find the exact answer.', 'happy');
        api.feedback(p.a + ' × ' + p.n + ' is about ' + p.est + '. Now fill in the grid.', 'info');
        gw.focusFirst();
      }
    }

    function check() {
      if (api.isAnswered() || !estDone) return;
      var v = gw.values();
      var empty = gw.order.filter(function (k) {
        return v[k] === null;
      });
      if (empty.length) {
        empty.forEach(function (k) {
          gw.ins[k].classList.add('shake');
        });
        api.later(function () {
          empty.forEach(function (k) {
            gw.ins[k].classList.remove('shake');
          });
        }, 400);
        api.feedback('Fill in every box with a number, then press Check.', 'info');
        return;
      }
      var bad = diagnose(p, v, api.tries());
      if (bad) {
        gw.bad(bad.k);
        if (p.level >= 2) showPic();
        api.check(false, bad.hint, bad.tag);
        return;
      }
      gw.good();
      gw.disable();
      checkBtn.disabled = true;
      if (p.estimate) {
        workHolder.appendChild(compareEl(p));
        api.check(true, p.a + ' × ' + p.n + ' = ' + p.S + '. ' + (p.S === p.est ? 'Same as the estimate!' : p.S + ' is close to the estimate ' + p.est + ', so it makes sense!'));
      } else {
        api.check(true, p.T + ' + ' + p.O + ' = ' + p.S + '. So ' + p.a + ' × ' + p.n + ' = ' + p.S + '!');
      }
    }

    api.onReveal(function () {
      if (!estDone) {
        estChoices.mark(p.near, 'good');
        finishEstimate(true);
      }
      gw.fill();
      gw.disable();
      checkBtn.disabled = true;
      showPic();
      lightAll(pic, true);
      MQ.clear(workHolder);
      workHolder.appendChild(tensWorking(p));
      workHolder.appendChild(onesWorking(p));
      workHolder.appendChild(totalWorking(p));
      if (p.estimate) workHolder.appendChild(compareEl(p));
      api.feedback(p.tv + ' × ' + p.n + ' = ' + p.T + ' and ' + p.ones + ' × ' + p.n + ' = ' + p.O + '. ' + p.T + ' + ' + p.O + ' = ' + p.S + '.', 'info');
    });

    if (p.level === 1) api.say('Fill the grid: tens box, ones box, then add them.', 'think');
    else if (p.level === 2) api.say('Estimate first. Which ten is ' + p.a + ' nearest to?', 'think');
    else api.say('Estimate, then use the grid. Is your answer near your estimate?', 'think');
    if (estDone) gw.focusFirst();
  }

  MQ.register('grid-method-builder', {
    learn: [learnEstimate, learnBuild, learnSplit, learnGrid],
    practice: { count: 9, render: renderQuestion },
    _buildDeck: buildDeck, // used by tests only
    _parts: parts,
  });

  var css = [
    '.gmb-q{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.gmb-big{font-size:2rem;color:#0b6e66;white-space:nowrap}',
    '.gmb-picbox{display:flex;flex-direction:column;align-items:center;max-width:100%;width:auto}',
    '.gmb-pichold:empty{display:none}',
    '.gmb-pic-cap{font-weight:800;color:var(--ink-soft);font-size:.95rem;margin-bottom:4px}',
    '.gmb-pic,.gmb-build,.gmb-line,.gmb-mini{display:block;max-width:100%;height:auto}',
    '.gmb-strip-body{fill:#8ecae6;stroke:#1d6f9a;stroke-width:2}',
    '.gmb-strip-line{stroke:#1d6f9a;stroke-width:1;opacity:.7}',
    '.gmb-strip.gmb-lit .gmb-strip-body{fill:#3a9fd1}',
    '.gmb-strip-num{font-size:15px;font-weight:800;fill:#fff;pointer-events:none}',
    '.gmb-one{fill:#ffd166;stroke:#b7791f;stroke-width:2}',
    '.gmb-one.gmb-lit{fill:#f4a261}',
    '.gmb-copy .gmb-strip-body,.gmb-one.gmb-copy{opacity:.92}',
    '.gmb-split{stroke:#c2410c;opacity:0;transition:opacity .5s ease}',
    '.gmb-split.gmb-on{opacity:1}',
    '.gmb-head{font-weight:800;fill:#1d6f9a}',
    '.gmb-head-o{fill:#b7791f}',
    '.gmb-rownum{fill:var(--ink-soft);font-weight:700}',
    '.gmb-rowlabel{fill:var(--ink);font-weight:800}',
    '.gmb-clickable{cursor:pointer}',
    '.gmb-strip.gmb-clickable:hover .gmb-strip-body{stroke:var(--gold);stroke-width:4}',
    '.gmb-one.gmb-clickable:hover{stroke:var(--gold);stroke-width:4}',
    '.gmb-src{cursor:grab}',
    '.gmb-ghost{opacity:.7;pointer-events:none}',
    '.gmb-track{fill:#fff;stroke:var(--line);stroke-width:2;stroke-dasharray:6 5}',
    '.gmb-track-live{fill:#f2fbfa;stroke:var(--accent)}',
    '.gmb-tray-label{font-size:15px;font-weight:700;fill:var(--ink-soft)}',
    '.gmb-buildbar{display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center}',
    '.gmb-readout{font-size:1.25rem;font-weight:700}',
    '.gmb-readout b{color:#0b6e66}',
    '.gmb-linewrap{width:100%;display:flex;justify-content:center}',
    '.gmb-nl-line{stroke:var(--ink);stroke-width:4}',
    '.gmb-nl-tick{stroke:var(--ink);stroke-width:3}',
    '.gmb-nl-num{font-size:18px;font-weight:800;fill:var(--ink)}',
    '.gmb-nl-small{font-size:14px;font-weight:600;fill:var(--ink-soft)}',
    '.gmb-nl-big{font-size:22px}',
    '.gmb-nl-dot{fill:#ef476f;stroke:#fff;stroke-width:3}',
    '.gmb-nl-a{font-size:18px;font-weight:800;fill:#ef476f}',
    '.gmb-hitbox{fill:transparent;cursor:pointer}',
    '.gmb-hitbox:hover{fill:rgba(255,183,3,.18)}',
    '.gmb-pin{cursor:grab}',
    '.gmb-pin-stem{stroke:#ef476f;stroke-width:4}',
    '.gmb-pin-head{fill:#ef476f;stroke:#fff;stroke-width:3}',
    '.gmb-pin-ok .gmb-pin-head,.gmb-pin-ok .gmb-pin-stem{fill:var(--good);stroke:var(--good)}',
    '.gmb-pin-ok .gmb-pin-head{stroke:#fff}',
    '.gmb-pin-text{font-size:17px;font-weight:800;fill:#fff;pointer-events:none}',
    '.gmb-after{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.gmb-subtitle{font-weight:800;font-size:1.1rem}',
    '.gmb-learn-work{display:flex;flex-direction:column;align-items:center;gap:8px}',
    '.gmb-work-row{font-size:1.15rem}',
    '.gmb-work-label{font-weight:800;padding:4px 10px;border-radius:10px;background:var(--paper-2);margin-right:4px}',
    '.gmb-work-t{background:#d6eef9;color:#1d6f9a}',
    '.gmb-work-o{background:#fff1cc;color:#8a5a12}',
    '.gmb-work-note{font-size:1rem;color:var(--ink-soft);font-weight:700}',
    '.gmb-workbox{display:flex;flex-direction:column;align-items:center;gap:8px}',
    '.gmb-workbox:empty{display:none}',
    '.gmb-pair{display:flex;align-items:center;justify-content:center;gap:18px;flex-wrap:wrap;max-width:100%}',
    '.gmb-arrow{font-size:2rem;font-weight:800;color:var(--ink-soft)}',
    '.gmb-grid{border-collapse:collapse;font-weight:800;font-size:1.5rem}',
    '.gmb-grid th,.gmb-grid td{border:3px solid var(--ink);padding:6px 10px;text-align:center;min-width:64px;height:58px;background:#fff}',
    '.gmb-grid .gmb-cap td{border:none;background:none;height:auto;padding:0 0 2px;font-size:.85rem;color:var(--ink-soft);font-weight:700}',
    '.gmb-grid th.gmb-x{background:var(--paper-2)}',
    '.gmb-grid th.gmb-th-t,.gmb-grid td.gmb-td-t{background:#eaf6fc}',
    '.gmb-grid th.gmb-th-o,.gmb-grid td.gmb-td-o{background:#fff8e1}',
    '.gmb-grid th.gmb-th-n{background:#f1f1f6}',
    '.gmb-grid-show td.gmb-pop{color:#0b6e66;animation:gmbPop .6s ease both;font-size:1.7rem}',
    '.gmb-grid-show td.gmb-td-o.gmb-pop{animation-delay:.4s}',
    '@keyframes gmbPop{0%{transform:scale(.4);opacity:0}100%{transform:scale(1);opacity:1}}',
    '.gmb-in{width:84px;height:48px;font-size:1.5rem;font-weight:800;text-align:center;border-radius:10px;border:3px solid var(--line);color:var(--ink);font-family:inherit;background:#fff}',
    '.gmb-in:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(255,183,3,.45)}',
    '.gmb-in-head{width:66px}',
    '.gmb-in.gmb-bad{border-color:var(--try);background:var(--try-bg)}',
    '.gmb-in.gmb-good{border-color:var(--good);background:var(--good-bg);color:var(--good)}',
    '.gmb-in:disabled{opacity:1}',
    '.gmb-gridrow{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap}',
    '.gmb-gridwrap{display:flex;align-items:center;gap:18px;flex-wrap:wrap;justify-content:center}',
    '.gmb-total{display:flex;align-items:center;gap:6px;font-size:1.4rem;font-weight:800;flex-wrap:wrap;justify-content:center}',
    '.gmb-total-label{font-size:1rem;color:var(--ink-soft);margin-right:4px}',
    '.gmb-echo{display:inline-block;min-width:48px;text-align:center;padding:4px 8px;border-radius:10px;background:var(--paper-2)}',
    '.gmb-echo-t{background:#eaf6fc}',
    '.gmb-echo-o{background:#fff8e1}',
    '.gmb-check{font-size:1.15rem}',
    '.gmb-hide{display:none!important}',
    '.gmb-gridsec{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.gmb-est{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%}',
    '.gmb-step{font-weight:800;font-size:1.1rem;display:flex;align-items:center;gap:8px;text-align:left}',
    '.gmb-stepnum{display:inline-grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--accent);color:#fff;flex:none}',
    '.gmb-est-done{font-size:1.15rem;font-weight:700;background:var(--good-bg);color:var(--good);padding:6px 14px;border-radius:12px;text-align:center}',
    '.gmb-compare{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;font-size:1.1rem}',
    '.gmb-cmp-box{padding:6px 12px;border-radius:12px;background:var(--paper-2);font-weight:700}',
    '.gmb-cmp-ans{background:var(--good-bg);color:var(--good)}',
    '.gmb-cmp-note{font-weight:800;color:var(--good)}',
    '.gmb-copy-btn:disabled{opacity:.45}',
    '@media (max-width:640px){.gmb-big{font-size:1.6rem}.gmb-grid th,.gmb-grid td{min-width:52px;height:50px;padding:4px 6px}.gmb-in{width:70px}.gmb-in-head{width:56px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'grid-method-builder' }, css));
})();

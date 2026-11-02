/* Fair Shares — deal pizza slices one at a time, then name each share as a fraction (Unit 7.1).
 * The child is weak at division, so sharing is always done by dealing slices out on screen,
 * one at a time, never as a written calculation.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  /* Mistake tags (parent-readable). */
  var T_YOU = 'Forgot to count yourself';
  var T_UNEQUAL = 'Chose pieces that are not equal';
  var T_BIGDEN = 'Thought a bigger bottom number means a bigger piece';
  var T_SWAP = 'Swapped the top and bottom numbers';
  var T_PEOPLE = 'Used the number of people as the bottom number';
  var T_PARTS = 'Bottom number was not the number of equal parts';
  var T_SHARE = 'Miscounted the pieces in one share';
  var T_SAME = 'Thought one piece is always the same amount';
  var T_COUNT = 'Miscounted the people';

  var NAMES = ['You', 'Amir', 'Lily', 'Ben', 'Zara', 'Omar', 'Mia', 'Leo', 'Ana', 'Sam'];
  var PART_NAMES = { 2: 'halves', 3: 'thirds', 4: 'quarters', 5: 'fifths' };

  var FOOD = {
    pizza: { whole: 'pizza', one: 'slice', many: 'slices', fill: '#f9cf5b', edge: '#d98c3a', icon: '🍕' },
    cake: { whole: 'cake', one: 'piece', many: 'pieces', fill: '#f8d3df', edge: '#d9668c', icon: '🎂' },
    brownies: { whole: 'tray of brownies', one: 'brownie', many: 'brownies', fill: '#8a5a3c', edge: '#5e3a24', icon: '🟫' },
  };
  var TRAY = { 6: { rows: 2, cols: 3 }, 9: { rows: 3, cols: 3 } };
  var CELL = 60; // brownie cell size in "whole" coordinates

  /* ---------------------------------------------------------------- *
   * Small drawing helpers
   * ---------------------------------------------------------------- */
  function r2(n) {
    return Math.round(n * 100) / 100;
  }
  function pt(r, deg) {
    var a = ((deg - 90) * Math.PI) / 180;
    return [r * Math.cos(a), r * Math.sin(a)];
  }
  /** Pie slice at the origin from angle a0 to a1 (degrees, 0 = top, clockwise). */
  function sectorPath(r, a0, a1) {
    var p0 = pt(r, a0);
    var p1 = pt(r, a1);
    var large = a1 - a0 > 180 ? 1 : 0;
    return 'M0 0 L' + r2(p0[0]) + ' ' + r2(p0[1]) + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + r2(p1[0]) + ' ' + r2(p1[1]) + ' Z';
  }
  function arcPath(r, a0, a1) {
    var p0 = pt(r, a0);
    var p1 = pt(r, a1);
    var large = a1 - a0 > 180 ? 1 : 0;
    return 'M' + r2(p0[0]) + ' ' + r2(p0[1]) + ' A' + r + ' ' + r + ' 0 ' + large + ' 1 ' + r2(p1[0]) + ' ' + r2(p1[1]);
  }

  /** One round slice (pizza or cake) as a <g> at the origin, radius 100. */
  function roundPiece(kind, a0, a1) {
    var f = FOOD[kind];
    return svg(
      'g',
      { class: 'fp-piece fp-' + kind },
      svg('path', { d: sectorPath(100, a0, a1), fill: f.fill, class: 'fp-cut' }),
      svg('path', { d: arcPath(94, a0 + 0.8, a1 - 0.8), fill: 'none', stroke: f.edge, 'stroke-width': 10, 'stroke-linecap': 'round', class: 'fp-crust' })
    );
  }

  /** Centre of brownie number i in a tray, relative to the tray centre. */
  function cellPos(S, i) {
    var t = TRAY[S];
    var c = i % t.cols;
    var r = Math.floor(i / t.cols);
    return [(c + 0.5) * CELL - (t.cols * CELL) / 2, (r + 0.5) * CELL - (t.rows * CELL) / 2];
  }
  function browniePiece(S, i) {
    var p = cellPos(S, i);
    return svg('g', { class: 'fp-piece fp-brownies' }, svg('rect', { x: p[0] - CELL / 2 + 3, y: p[1] - CELL / 2 + 3, width: CELL - 6, height: CELL - 6, rx: 9, fill: FOOD.brownies.fill, class: 'fp-cut' }));
  }
  /** Outline of the whole (dashed ghost), at the origin. */
  function ghostWhole(kind, S) {
    if (kind === 'brownies') {
      var t = TRAY[S];
      return svg('rect', { x: (-t.cols * CELL) / 2, y: (-t.rows * CELL) / 2, width: t.cols * CELL, height: t.rows * CELL, rx: 10, class: 'fp-ghost' });
    }
    return svg('circle', { cx: 0, cy: 0, r: 100, class: 'fp-ghost' });
  }

  /** A whole cut into equal (or uneven) pieces; returns {svg, pieces}. weights optional. */
  function wholePic(kind, S, opts) {
    opts = opts || {};
    var size = opts.size || 220;
    var root = svg('svg', { viewBox: '-110 -110 220 220', width: size, height: size, class: 'fp-whole' + (opts.className ? ' ' + opts.className : '') });
    var pieces = [];
    if (kind === 'brownies') {
      for (var i = 0; i < S; i++) {
        var b = browniePiece(S, i);
        root.appendChild(b);
        pieces.push(b);
      }
    } else {
      var w = opts.weights || U.range(1, S).map(function () {
        return 1;
      });
      var tot = w.reduce(function (a, b) {
        return a + b;
      }, 0);
      var a = opts.start || 0;
      w.forEach(function (wi) {
        var a1 = a + (wi / tot) * 360;
        var p = roundPiece(kind, a, a1);
        p.angle = a1 - a;
        root.appendChild(p);
        pieces.push(p);
        a = a1;
      });
    }
    return { svg: root, pieces: pieces };
  }

  /** A chocolate-bar-style slab cut into strips (equal or uneven), for "equal parts" questions. */
  function barPic(n, weights, size) {
    var W = 240;
    var H = 120;
    var root = svg('svg', { viewBox: '-10 -10 260 140', width: size || 220, height: ((size || 220) * 140) / 260, class: 'fp-whole' });
    var w = weights || U.range(1, n).map(function () {
      return 1;
    });
    var tot = w.reduce(function (a, b) {
      return a + b;
    }, 0);
    var x = 0;
    var pieces = [];
    w.forEach(function (wi) {
      var pw = (wi / tot) * W;
      var r = svg('rect', { x: r2(x), y: 0, width: r2(pw), height: H, class: 'fp-bar fp-cut' });
      root.appendChild(r);
      pieces.push(r);
      x += pw;
    });
    pieces.forEach(function (p, i) {
      p.angle = (w[i] / tot) * 360;
    });
    return { svg: root, pieces: pieces };
  }

  /** Mark the biggest and smallest pieces of an uneven picture. */
  function markUneven(pic) {
    var big = pic.pieces[0];
    var small = pic.pieces[0];
    pic.pieces.forEach(function (p) {
      if (p.angle > big.angle) big = p;
      if (p.angle < small.angle) small = p;
    });
    big.classList.add('fp-big');
    small.classList.add('fp-small');
  }

  /** Weights for n uneven parts: clearly different sizes (largest at least 1.8 × smallest). */
  function unevenWeights(n) {
    for (;;) {
      var w = U.range(1, n).map(function () {
        return 0.5 + Math.random() * 1.6;
      });
      var mx = Math.max.apply(null, w);
      var mn = Math.min.apply(null, w);
      if (mx / mn >= 1.8) return w;
    }
  }

  /* Stacked fraction in HTML. */
  function frac(n, d, cls) {
    return el('span', { class: 'fp-frac' + (cls ? ' ' + cls : '') }, el('span', { class: 'fp-fn' }, String(n)), el('span', { class: 'fp-fd' }, String(d)));
  }
  function fracHTML(n, d) {
    return '<span class="fp-frac fp-frac-sm"><span class="fp-fn">' + n + '</span><span class="fp-fd">' + d + '</span></span>';
  }

  /** Repeated addition chips: 2 + 2 + 2 + 2 + 2 = 10 slices. */
  function shareSum(each, P, S, word) {
    var parts = [];
    for (var i = 0; i < P; i++) parts.push(each);
    var row = MQ.ui.sum(parts, S, word);
    row.classList.add('fp-sum');
    return row;
  }

  /* ---------------------------------------------------------------- *
   * The dealer: a whole on the left, plates on the right. Each click
   * deals ONE piece to the next plate, going round until none are left.
   * ---------------------------------------------------------------- */
  function dealer(api, o) {
    var kind = o.kind;
    var S = o.pieces;
    var P = o.people;
    var f = FOOD[kind];
    var rows = P > 5 ? 2 : 1;
    var cols = Math.min(P, 5);
    var W = 900;
    var H = rows === 2 ? 290 : 240;
    var BIG = kind === 'brownies' ? 1.05 : 1.08;
    var SM = kind === 'brownies' ? 0.36 : 0.4;
    var cx = 140;
    var cy = H / 2;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'fp-deal' });
    // board under the whole
    if (kind === 'brownies') {
      var t = TRAY[S];
      root.appendChild(svg('rect', { x: cx - (t.cols * CELL * BIG) / 2 - 10, y: cy - (t.rows * CELL * BIG) / 2 - 10, width: t.cols * CELL * BIG + 20, height: t.rows * CELL * BIG + 20, rx: 14, class: 'fp-board' }));
    } else {
      root.appendChild(svg('circle', { cx: cx, cy: cy, r: 100 * BIG + 10, class: 'fp-board' }));
    }
    // plates
    var dx = Math.min(116, 580 / cols);
    var x0 = 300 + (580 - dx * cols) / 2 + dx / 2;
    var plates = [];
    var plateLayer = svg('g');
    root.appendChild(plateLayer);
    for (var j = 0; j < P; j++) {
      var row = rows === 2 ? Math.floor(j / 5) : 0;
      var col = rows === 2 ? j % 5 : j;
      var px = x0 + col * dx;
      var py = rows === 2 ? 70 + row * 135 : 105;
      var g = svg('g', { class: 'fp-plate' + (j === 0 ? ' fp-plate-you' : ''), transform: 'translate(' + px + ',' + py + ')' });
      g.appendChild(svg('circle', { r: 50, class: 'fp-plate-dish' }));
      var gh = ghostWhole(kind, S);
      gh.setAttribute('transform', 'scale(' + SM + ')');
      g.appendChild(gh);
      g.appendChild(svg('text', { x: 0, y: 72, 'text-anchor': 'middle', class: 'fp-plate-name' }, NAMES[j]));
      plateLayer.appendChild(g);
      plates.push({ x: px, y: py, g: g, pieces: [] });
    }
    // pieces
    var pieceLayer = svg('g');
    root.appendChild(pieceLayer);
    var pieces = [];
    for (var i = 0; i < S; i++) {
      var p = kind === 'brownies' ? browniePiece(S, i) : roundPiece(kind, (i * 360) / S, ((i + 1) * 360) / S);
      p.style.transform = 'translate(' + cx + 'px,' + cy + 'px) scale(' + BIG + ') ' + (kind === 'brownies' ? 'translate(0px,0px)' : 'rotate(0deg)');
      pieceLayer.appendChild(p);
      pieces.push(p);
    }

    var dealt = 0;
    var busy = false;
    var finished = false;
    var dealBtn = el('button', { class: 'btn fp-deal-btn', type: 'button' }, f.icon + ' Deal one ' + f.one);
    var restBtn = el('button', { class: 'btn btn-ghost fp-rest-btn', type: 'button', hidden: true }, '⏩ Deal the rest');
    var status = el('div', { class: 'fp-deal-status' }, S + ' ' + f.many + ' to share between ' + P + ' people.');
    var wrap = el('div', { class: 'fp-dealer' }, el('div', { class: 'fp-deal-pic' }, root), el('div', { class: 'fp-deal-row' }, dealBtn, restBtn, status));
    wrap.dataset.dealt = '0';

    function move(i) {
      var j = i % P;
      var k = Math.floor(i / P);
      var pl = plates[j];
      var tail;
      if (kind === 'brownies') {
        var a = cellPos(S, k);
        var b = cellPos(S, i);
        tail = 'translate(' + r2(a[0] - b[0]) + 'px,' + r2(a[1] - b[1]) + 'px)';
      } else {
        tail = 'rotate(' + r2(((k - i) * 360) / S) + 'deg)';
      }
      pieces[i].style.transform = 'translate(' + pl.x + 'px,' + pl.y + 'px) scale(' + SM + ') ' + tail;
      pl.pieces.push(pieces[i]);
    }
    function after() {
      wrap.dataset.dealt = String(dealt);
      var left = S - dealt;
      status.textContent = left ? left + ' ' + (left === 1 ? f.one : f.many) + ' left to deal.' : 'All ' + S + ' ' + f.many + ' are shared out!';
      if (dealt >= P && left) restBtn.hidden = false;
      if (!left) {
        dealBtn.disabled = true;
        restBtn.hidden = true;
        if (!finished) {
          finished = true;
          if (o.onDone) o.onDone(S / P);
        }
      }
    }
    function dealOne() {
      if (dealt >= S) return;
      move(dealt);
      dealt++;
      api.sound('pop');
      after();
    }
    dealBtn.addEventListener('click', function () {
      if (busy) return;
      dealOne();
    });
    restBtn.addEventListener('click', function () {
      if (busy) return;
      busy = true;
      dealBtn.disabled = true;
      restBtn.disabled = true;
      (function step() {
        dealOne();
        if (dealt < S) api.later(step, 260);
      })();
    });

    return {
      el: wrap,
      done: function () {
        return dealt >= S;
      },
      /** Deal everything at once (used by "Show me"). */
      finishNow: function () {
        while (dealt < S) {
          move(dealt);
          dealt++;
        }
        after();
      },
      disable: function () {
        dealBtn.disabled = true;
        restBtn.hidden = true;
      },
      glowPlate: function (j) {
        plates[j].g.classList.add('fp-plate-glow');
        plates[j].pieces.forEach(function (p) {
          p.classList.add('fp-glow');
        });
      },
    };
  }

  /* ---------------------------------------------------------------- *
   * Answer form: "Each person gets [ ] slices" + stacked fraction boxes
   * ---------------------------------------------------------------- */
  function intInput(label) {
    return el('input', { class: 'fp-in', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: 2, 'aria-label': label });
  }
  function fracForm(o) {
    var eachIn = o.askEach ? intInput('Pieces each') : null;
    var nIn = intInput('Top number');
    var dIn = intInput('Bottom number');
    var btn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    var lines = el('div', { class: 'fp-form-lines' });
    if (eachIn) lines.appendChild(el('div', { class: 'fp-form-line' }, el('span', null, 'Each person gets'), eachIn, el('span', null, o.many + '.')));
    lines.appendChild(
      el(
        'div',
        { class: 'fp-form-line' },
        el('span', null, 'One share is'),
        el('span', { class: 'fp-frac fp-frac-in' }, el('span', { class: 'fp-fn' }, nIn), el('span', { class: 'fp-fd' }, dIn)),
        el('span', null, 'of the ' + o.whole + '.')
      )
    );
    var wrap = el('div', { class: 'fp-form' }, lines, btn);
    var inputs = [eachIn, nIn, dIn].filter(Boolean);
    function read(inp) {
      var s = inp.value.trim();
      return /^\d{1,2}$/.test(s) ? parseInt(s, 10) : NaN;
    }
    function submit() {
      if (btn.disabled) return;
      var bad = inputs.filter(function (inp) {
        return isNaN(read(inp));
      })[0];
      if (bad) {
        bad.classList.remove('shake');
        void bad.offsetWidth; // restart the shake animation
        bad.classList.add('shake');
        bad.focus();
        return;
      }
      o.onSubmit(eachIn ? read(eachIn) : null, read(nIn), read(dIn));
    }
    btn.addEventListener('click', submit);
    inputs.forEach(function (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });
    });
    return {
      el: wrap,
      focus: function () {
        try {
          inputs[0].focus({ preventScroll: true });
        } catch (e) {}
      },
      fill: function (each, n, d) {
        if (eachIn) eachIn.value = each;
        nIn.value = n;
        dIn.value = d;
      },
      disable: function () {
        inputs.forEach(function (inp) {
          inp.disabled = true;
        });
        btn.disabled = true;
      },
      good: function () {
        inputs.forEach(function (inp) {
          inp.classList.remove('bad');
          inp.classList.add('good');
        });
      },
      mark: function (which) {
        inputs.forEach(function (inp) {
          inp.classList.remove('bad');
        });
        (which || []).forEach(function (w) {
          var inp = w === 'each' ? eachIn : w === 'n' ? nIn : dIn;
          if (inp) inp.classList.add('bad');
        });
      },
    };
  }

  /** Judge a share answer. Returns {ok, hint, tag, marks}. Equivalent fractions are accepted. */
  function judgeShare(q, each, n, d, tries) {
    var f = FOOD[q.kind];
    var S = q.pieces;
    var P = q.people;
    var e = S / P;
    if (q.askEach && each !== e) {
      return {
        ok: false,
        marks: ['each'],
        tag: T_SHARE,
        hint: tries ? 'Point at each ' + f.one + ' on the "You" plate and count them one by one.' : 'Count the ' + f.many + ' on just one plate. Everyone has the same.',
      };
    }
    if (n > 0 && d > 0 && n * S === d * e) return { ok: true };
    if (n === S && d === e) {
      return { ok: false, marks: ['n', 'd'], tag: T_SWAP, hint: tries ? 'Swap them round: ' + e + ' on top (your ' + f.many + '), ' + S + ' underneath (the whole).' : 'Nearly! The top and bottom are swapped. The bottom number is the whole ' + f.whole + '.' };
    }
    if (d === P && n === e && P !== S) {
      return {
        ok: false,
        marks: ['d'],
        tag: T_PEOPLE,
        hint: tries ? 'The bottom number is how many equal ' + f.many + ' the whole ' + f.whole + ' was cut into: count them all.' : 'The bottom number is not the people. It is how many equal ' + f.many + ' make the whole ' + f.whole + '.',
      };
    }
    if (d !== S) {
      return { ok: false, marks: ['d'], tag: T_PARTS, hint: tries ? 'Count every ' + f.one + ' in the whole ' + f.whole + '. That number goes underneath.' : 'Bottom number: how many equal ' + f.many + ' were in the whole ' + f.whole + '?' };
    }
    return { ok: false, marks: ['n'], tag: T_SHARE, hint: tries ? 'Top number: how many ' + f.many + ' are on the "You" plate?' : 'Top number: how many ' + f.many + ' does one person get?' };
  }

  /* ---------------------------------------------------------------- *
   * Deck
   * ---------------------------------------------------------------- */
  var deck = null;

  function buildDeck() {
    var q = [];
    // Level 1: equal parts ×2 (different part numbers), share a cake 1 piece each
    var ns = U.shuffle([2, 3, 4, 5]);
    var cakeS = U.pick([2, 4, 10]);
    var l1 = [
      { type: 'equal', n: ns[0], shape: U.pick(['circle', 'bar']) },
      { type: 'equal', n: ns[1], shape: U.pick(['circle', 'bar']) },
      { type: 'share', kind: 'cake', pieces: cakeS, people: cakeS, askEach: false },
    ];
    l1 = [l1[0], l1[2], l1[1]];
    l1.forEach(function (x) {
      q.push(x);
    });
    // Level 2: pizza of 10 shared by 2, 5 or 10 (two of them) + a tray of brownies between 3
    var ps = U.shuffle([2, 5, 10]).slice(0, 2);
    var l2 = [
      { type: 'share', kind: 'pizza', pieces: 10, people: ps[0], askEach: true },
      { type: 'share', kind: 'pizza', pieces: 10, people: ps[1], askEach: true },
      { type: 'share', kind: 'brownies', pieces: U.pick([6, 9]), people: 3, askEach: true },
    ];
    U.shuffle(l2).forEach(function (x) {
      q.push(x);
    });
    // Level 3: two "you and __ friends" stories + one "who gets more?"
    var used = {};
    q.forEach(function (x) {
      if (x.type === 'share') used[x.kind + x.pieces + '/' + x.people] = true;
    });
    var stories = U.shuffle(
      [
        { kind: 'pizza', pieces: 10, friends: 4 },
        { kind: 'pizza', pieces: 10, friends: 9 },
        { kind: 'pizza', pieces: 10, friends: 1 },
        { kind: 'cake', pieces: 4, friends: 3 },
        { kind: 'cake', pieces: 10, friends: 4 },
        { kind: 'brownies', pieces: 6, friends: 2 },
        { kind: 'brownies', pieces: 9, friends: 2 },
      ].filter(function (s) {
        return !used[s.kind + s.pieces + '/' + (s.friends + 1)];
      })
    );
    var cmp = U.pick([
      [5, 10],
      [2, 4],
      [3, 5],
      [4, 10],
      [2, 5],
    ]);
    var names = U.shuffle(['Mia', 'Leo', 'Zara', 'Ben', 'Lily', 'Omar']).slice(0, 2);
    var l3 = [
      { type: 'story', kind: stories[0].kind, pieces: stories[0].pieces, friends: stories[0].friends, people: stories[0].friends + 1, askEach: true },
      { type: 'story', kind: stories[1].kind, pieces: stories[1].pieces, friends: stories[1].friends, people: stories[1].friends + 1, askEach: true },
      { type: 'compare', a: cmp[0], b: cmp[1], names: names, flip: Math.random() < 0.5 },
    ];
    U.shuffle(l3).forEach(function (x) {
      q.push(x);
    });
    return q;
  }

  function sig(q) {
    if (q.type === 'equal') return 'equal' + q.n;
    if (q.type === 'compare') return 'cmp' + q.a + '/' + q.b;
    return 'share' + q.kind + q.pieces + '/' + q.people;
  }

  /* ---------------------------------------------------------------- *
   * Practice renderers
   * ---------------------------------------------------------------- */
  function renderEqual(stage, api, q, box) {
    var name = PART_NAMES[q.n];
    var what = q.shape === 'circle' ? 'cake' : 'chocolate bar';
    api.say('Which ' + what + ' is cut into ' + q.n + ' equal parts?', 'think');
    stage.insertBefore(MQ.ui.prompt('Which ' + what + ' is cut into <b>' + q.n + ' equal parts</b> (' + name + ')?'), box);
    var correct = U.rand(0, 2);
    box.dataset.answer = String(correct);
    var pics = [];
    var opts = [0, 1, 2].map(function (i) {
      var w = i === correct ? null : unevenWeights(q.n);
      var pic = q.shape === 'circle' ? wholePic('cake', q.n, { weights: w, size: 170, start: U.rand(0, 3) * 30 }) : barPic(q.n, w, 190);
      pics.push(pic);
      return { label: pic.svg, value: i };
    });
    var ch = MQ.ui.choices(opts, function (v) {
      if (v === correct) {
        ch.mark(v, 'good');
        ch.disable();
        api.check(true, 'Yes! All ' + q.n + ' parts are the same size, so each one is a fair share.');
      } else {
        ch.mark(v, 'bad');
        markUneven(pics[v]);
        api.check(false, api.tries() ? 'In that one the red-edged part is much bigger than the blue-edged part. Find the one where every part matches.' : 'Look closely: are all the parts the same size? Fair shares need equal parts.', T_UNEQUAL);
      }
    }, { columns: 3 });
    ch.classList.add('fp-pics');
    box.appendChild(ch);
    api.onReveal(function () {
      ch.mark(correct, 'good');
      ch.disable();
      pics.forEach(function (p, i) {
        if (i !== correct) markUneven(p);
      });
      api.feedback('The green one has ' + q.n + ' parts that are all the same size. In the others, one part (red edge) is much bigger than another (blue edge).', 'info');
    });
  }

  /** Share question (also used after the people are counted in a story). */
  function shareBody(api, q, box, intro) {
    var f = FOOD[q.kind];
    var area = el('div', { class: 'fp-area' });
    box.appendChild(area);
    var formHolder = el('div', { class: 'fp-form-holder' });
    var work = el('div', { class: 'fp-work' });
    var d = dealer(api, {
      kind: q.kind,
      pieces: q.pieces,
      people: q.people,
      onDone: function () {
        api.say('All shared out! Now look at one plate.', 'think');
        formHolder.hidden = false;
        form.focus();
      },
    });
    area.appendChild(d.el);
    formHolder.hidden = true;
    var form = fracForm({
      askEach: q.askEach,
      many: f.many,
      whole: f.whole,
      onSubmit: function (each, n, den) {
        var r = judgeShare(q, each, n, den, api.tries());
        if (r.ok) {
          form.good();
          form.disable();
          d.glowPlate(0);
          showWork(n, den);
          var e = q.pieces / q.people;
          var msg = n === e && den === q.pieces ? 'Yes! You get ' + e + ' of the ' + q.pieces + ' equal ' + f.many + '.' : 'Yes! ' + n + '/' + den + ' is the same amount as ' + e + '/' + q.pieces + '.';
          api.check(true, msg);
        } else {
          form.mark(r.marks);
          api.check(false, r.hint, r.tag);
        }
      },
    });
    formHolder.appendChild(form.el);
    area.appendChild(formHolder);
    area.appendChild(work);
    if (intro) api.say(intro, 'think');

    function showWork() {
      MQ.clear(work);
      var e = q.pieces / q.people;
      work.appendChild(el('div', { class: 'fp-work-line' }, shareSum(e, q.people, q.pieces, f.many)));
      var line = el('div', { class: 'fp-work-line fp-work-frac' }, el('span', null, 'You get ' + e + ' of ' + q.pieces + ' equal ' + f.many + ' ='), frac(e, q.pieces));
      work.appendChild(line);
    }

    return {
      reveal: function () {
        d.finishNow();
        d.glowPlate(0);
        formHolder.hidden = false;
        var e = q.pieces / q.people;
        form.fill(e, e, q.pieces);
        form.good();
        form.disable();
        showWork();
        api.feedback('Dealing round the plates gives ' + e + ' each. The whole had ' + q.pieces + ' equal ' + f.many + ', so one share is ' + e + '/' + q.pieces + '.', 'info');
      },
    };
  }

  function renderShare(stage, api, q, box) {
    var f = FOOD[q.kind];
    var say;
    if (q.kind === 'cake') say = 'This cake has ' + q.pieces + ' equal pieces for ' + q.people + ' people. Deal them out!';
    else if (q.kind === 'brownies') say = q.pieces + ' brownies for 3 people. Deal them out one at a time!';
    else say = 'A pizza with 10 equal slices is shared by ' + q.people + ' people. Deal it out!';
    stage.insertBefore(MQ.ui.prompt('Share the ' + f.whole + ' fairly between <b>' + q.people + ' people</b>. What fraction does each person get?'), box);
    api.say(say, 'think');
    var body = shareBody(api, q, box);
    api.onReveal(body.reveal);
  }

  function renderStory(stage, api, q, box) {
    var f = FOOD[q.kind];
    var cut = q.kind === 'brownies' ? 'a tray of ' + q.pieces + ' brownies' : 'a ' + f.whole + ' cut into ' + q.pieces + ' equal ' + f.many;
    stage.insertBefore(MQ.ui.prompt('You and <b>' + q.friends + (q.friends === 1 ? ' friend' : ' friends') + '</b> share ' + cut + '.'), box);
    api.say('First: how many people are sharing?', 'think');
    var step1 = el('div', { class: 'fp-step1' }, el('div', { class: 'fp-step-q' }, 'How many people?'));
    var body = null;
    var ni = MQ.ui.numberInput({
      label: 'How many people',
      onSubmit: function (num) {
        if (num === q.people) {
          ni.good();
          ni.disable();
          api.sound('correct');
          api.feedback('Yes! You + ' + q.friends + ' = ' + q.people + ' people.', 'good');
          start();
        } else if (num === q.friends) {
          ni.bad();
          api.check(false, api.tries() ? 'You are a person too! Count: you is 1, then add your ' + q.friends + (q.friends === 1 ? ' friend.' : ' friends.') : "Don't forget to count yourself!", T_YOU);
        } else {
          ni.bad();
          api.check(false, api.tries() ? 'Hold up 1 finger for you, then 1 for each friend. How many fingers?' : 'Count you, then each friend.', T_COUNT);
        }
      },
    });
    step1.appendChild(ni.el);
    box.appendChild(step1);
    ni.focus();
    function start() {
      if (body) return;
      body = shareBody(api, q, box, 'Now deal the ' + f.many + ' out to ' + q.people + ' plates.');
    }
    api.onReveal(function () {
      ni.setValue(q.people);
      ni.good();
      ni.disable();
      start();
      body.reveal();
      api.feedback('You + ' + q.friends + ' = ' + q.people + ' people. Dealing gives ' + q.pieces / q.people + ' each, so one share is ' + q.pieces / q.people + '/' + q.pieces + '.', 'info');
    });
  }

  function renderCompare(stage, api, q, box) {
    // q.a < q.b: the pizza cut into fewer slices has bigger slices.
    var left = q.flip ? { n: q.b, name: q.names[1] } : { n: q.a, name: q.names[0] };
    var right = q.flip ? { n: q.a, name: q.names[0] } : { n: q.b, name: q.names[1] };
    var winner = left.n < right.n ? left : right;
    box.dataset.answer = winner.name;
    stage.insertBefore(
      MQ.ui.prompt(left.name + "'s pizza is cut into <b>" + left.n + '</b> equal slices. ' + right.name + "'s same-size pizza is cut into <b>" + right.n + '</b> equal slices. Each eats 1 slice. Who eats more pizza?'),
      box
    );
    api.say('Who gets more? Look at the size of the slices.', 'think');
    var picL = wholePic('pizza', left.n, { size: 200 });
    var picR = wholePic('pizza', right.n, { size: 200 });
    var cards = el(
      'div',
      { class: 'fp-cmp' },
      el('div', { class: 'fp-cmp-card' }, picL.svg, el('div', { class: 'fp-cmp-name' }, left.name + ': 1 of ' + left.n)),
      el('div', { class: 'fp-cmp-card' }, picR.svg, el('div', { class: 'fp-cmp-name' }, right.name + ': 1 of ' + right.n))
    );
    box.appendChild(cards);
    var overlay = el('div', { class: 'fp-overlay' });
    var ch = MQ.ui.choices(
      [
        { label: left.name + ' ' + fracHTML(1, left.n), value: left.name },
        { label: right.name + ' ' + fracHTML(1, right.n), value: right.name },
        { label: 'The same', value: 'same' },
      ],
      function (v) {
        if (v === winner.name) {
          ch.mark(v, 'good');
          ch.disable();
          showWhy();
          api.check(true, 'Yes! Fewer slices means bigger slices. 1/' + winner.n + ' is more.');
        } else if (v === 'same') {
          ch.mark(v, 'bad');
          api.check(false, api.tries() ? 'Put a finger on one slice of each pizza. Are they the same size?' : 'They both eat 1 slice, but are the slices the same size?', T_SAME);
        } else {
          ch.mark(v, 'bad');
          var loser = winner === left ? right : left;
          api.check(false, api.tries() ? 'Cutting the same pizza into ' + loser.n + ' makes the slices smaller than cutting it into ' + winner.n + '.' : loser.n + ' is a bigger number, but more slices means each slice is smaller. Look at the pictures.', T_BIGDEN);
        }
      },
      { columns: 3 }
    );
    box.appendChild(ch);
    box.appendChild(overlay);
    function showWhy() {
      picL.pieces[0].classList.add('fp-glow');
      picR.pieces[0].classList.add('fp-glow');
      MQ.clear(overlay);
      var big = Math.max(left.n, right.n);
      var small = Math.min(left.n, right.n);
      var o = svg('svg', { viewBox: '-110 -110 220 130', width: 200, height: 118, class: 'fp-whole' });
      var a = roundPiece('pizza', -180 / small, 180 / small);
      a.classList.add('fp-glow');
      var b = roundPiece('pizza', -180 / big, 180 / big);
      b.classList.add('fp-top');
      o.appendChild(a);
      o.appendChild(b);
      overlay.appendChild(el('div', { class: 'fp-overlay-pic' }, o));
      overlay.appendChild(el('div', { class: 'fp-overlay-text', html: 'One slice on top of the other: ' + fracHTML(1, small) + ' is bigger than ' + fracHTML(1, big) + '.' }));
    }
    api.onReveal(function () {
      ch.mark(winner.name, 'good');
      ch.disable();
      showWhy();
      var bigN = Math.max(left.n, right.n);
      var smallN = Math.min(left.n, right.n);
      api.feedback('The same pizza cut into fewer slices has bigger slices. 1/' + smallN + ' is more than 1/' + bigN + ', so ' + winner.name + ' eats more.', 'info');
    });
  }

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */
  function learnEqual(stage, api) {
    api.say('Fractions only work with equal parts. Which pizza is cut fairly? Click it.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Equal or not?', 'Both pizzas are cut into 4 pieces. Which one is fair for 4 friends?'));
    var fairFirst = Math.random() < 0.5;
    var fair = wholePic('pizza', 4, { size: 200 });
    var unfair = wholePic('pizza', 4, { size: 200, weights: [1.7, 0.6, 1.1, 0.6] });
    var row = el('div', { class: 'fp-two' });
    var done = false;
    function card(pic, isFair) {
      var b = el('button', { class: 'fp-pick', type: 'button', 'data-fair': isFair ? '1' : '0' }, pic.svg);
      b.addEventListener('click', function () {
        if (done) return;
        if (isFair) {
          done = true;
          b.classList.add('good');
          markUneven(unfair);
          api.sound('correct');
          api.say('Yes! 4 equal slices. Each slice is one quarter.', 'cheer');
          api.feedback('Fair shares need <b>equal</b> parts. In the other pizza one slice is much bigger.', 'good');
          api.unlockNext();
        } else {
          b.classList.add('bad');
          markUneven(unfair);
          api.sound('wrong');
          api.feedback('Look: the slice with the red edge is much bigger than the blue one. Is that fair?', 'try');
        }
      });
      return b;
    }
    var c1 = card(fair, true);
    var c2 = card(unfair, false);
    if (fairFirst) {
      row.appendChild(c1);
      row.appendChild(c2);
    } else {
      row.appendChild(c2);
      row.appendChild(c1);
    }
    stage.appendChild(row);
  }

  function learnDeal(stage, api) {
    api.say('You and 4 friends share a pizza with 10 slices. Deal them out one at a time!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Deal it out', 'Click the button to give one slice to the next plate. Keep going until the pizza is gone.'));
    var work = el('div', { class: 'fp-work' });
    var d = dealer(api, {
      kind: 'pizza',
      pieces: 10,
      people: 5,
      onDone: function () {
        api.say('2 slices each! Everyone got the same.', 'cheer');
        api.feedback('10 slices shared between 5 people: 2 each.', 'good');
        work.appendChild(shareSum(2, 5, 10, 'slices'));
        api.unlockNext();
      },
    });
    stage.appendChild(d.el);
    stage.appendChild(work);
  }

  function learnName(stage, api) {
    api.say('You got 2 slices. Click 2 slices to take them.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Name the share', 'The bottom number is how many equal slices make the whole pizza. The top number is how many you get.'));
    var row = el('div', { class: 'fp-name-row' });
    var picBox = el('div', { class: 'fp-name-pic' });
    var fracBox = el('div', { class: 'fp-name-frac' });
    row.appendChild(picBox);
    row.appendChild(fracBox);
    stage.appendChild(row);
    var again = el('button', { class: 'btn fp-again', type: 'button', hidden: true }, 'What if 10 people share? ▶');
    stage.appendChild(again);
    var round = 0;

    function setup(S, want) {
      MQ.clear(picBox);
      MQ.clear(fracBox);
      var pic = wholePic('pizza', S, { size: 240 });
      var got = 0;
      var top = el('span', { class: 'fp-fn' }, '?');
      fracBox.appendChild(el('div', { class: 'fp-name-lab' }, 'slices you get'));
      fracBox.appendChild(el('span', { class: 'fp-frac fp-frac-big' }, top, el('span', { class: 'fp-fd' }, String(S))));
      fracBox.appendChild(el('div', { class: 'fp-name-lab' }, 'equal slices in the whole pizza'));
      var said = el('div', { class: 'fp-name-said' });
      fracBox.appendChild(said);
      pic.pieces.forEach(function (p) {
        p.classList.add('fp-click');
        p.addEventListener('click', function () {
          if (got >= want || p.classList.contains('fp-glow')) return;
          p.classList.add('fp-glow');
          got++;
          top.textContent = String(got);
          api.sound('pop');
          if (got === want) {
            said.innerHTML = want + ' of ' + S + ' equal slices = ' + fracHTML(want, S) + ' of the pizza';
            if (round === 0) {
              api.say('2 out of 10 equal slices. We write two-tenths.', 'cheer');
              again.hidden = false;
            } else {
              api.say('1 out of 10 slices: one-tenth. More people, smaller shares!', 'cheer');
              api.feedback('5 people: ' + fracHTML(2, 10) + ' each. 10 people: ' + fracHTML(1, 10) + ' each.', 'good');
              api.unlockNext();
            }
          }
        });
      });
      picBox.appendChild(pic.svg);
    }
    again.addEventListener('click', function () {
      again.hidden = true;
      round = 1;
      api.say('Now you and 9 friends share. That is 10 people, so 1 slice each. Click your slice.');
      setup(10, 1);
    });
    setup(10, 2);
  }

  /* ---------------------------------------------------------------- *
   * Register
   * ---------------------------------------------------------------- */
  MQ.register('fair-share-pizza', {
    learn: [learnEqual, learnDeal, learnName],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        var box = el('div', { class: 'fp-q', 'data-type': q.type, 'data-sig': sig(q) });
        if (q.type === 'share' || q.type === 'story') {
          box.dataset.kind = q.kind;
          box.dataset.pieces = String(q.pieces);
          box.dataset.people = String(q.people);
          box.dataset.askEach = q.askEach ? '1' : '0';
          if (q.type === 'story') box.dataset.friends = String(q.friends);
        }
        if (q.type === 'equal') box.dataset.n = String(q.n);
        if (q.type === 'compare') {
          box.dataset.a = String(q.a);
          box.dataset.b = String(q.b);
        }
        stage.appendChild(box);
        if (q.type === 'equal') renderEqual(stage, api, q, box);
        else if (q.type === 'share') renderShare(stage, api, q, box);
        else if (q.type === 'story') renderStory(stage, api, q, box);
        else renderCompare(stage, api, q, box);
      },
    },
  });

  var css = [
    '.fp-q{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.fp-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;font-weight:800;line-height:1.05;margin:0 .15em}',
    '.fp-fn{border-bottom:3px solid currentColor;padding:0 .2em 1px;min-width:1em;text-align:center}',
    '.fp-fd{padding:1px .2em 0;min-width:1em;text-align:center}',
    '.fp-frac-sm{font-size:.85em}.fp-frac-sm .fp-fn{border-bottom-width:2px}',
    '.fp-frac-big{font-size:3.2rem;color:#0b6e66}.fp-frac-big .fp-fn{border-bottom-width:5px}',
    '.fp-whole{max-width:100%;height:auto;overflow:visible}',
    '.fp-cut{stroke:#fff;stroke-width:3;stroke-linejoin:round}',
    '.fp-bar{fill:#9c6644;stroke:#fff;stroke-width:4}',
    '.fp-big{stroke:#c2410c !important;stroke-width:6 !important}',
    '.fp-big .fp-cut{stroke:#c2410c;stroke-width:6}',
    '.fp-small{stroke:#2563eb !important;stroke-width:6 !important}',
    '.fp-small .fp-cut{stroke:#2563eb;stroke-width:6}',
    '.fp-pics .choice{display:flex;align-items:center;justify-content:center;padding:10px;min-height:150px}',
    '.fp-pics{max-width:720px}',
    '.fp-ghost{fill:none;stroke:#b8c4e3;stroke-width:4;stroke-dasharray:8 7}',
    '.fp-board{fill:#f1e4d0;stroke:#d9c3a5;stroke-width:3}',
    '.fp-plate-dish{fill:#fff;stroke:#c9d3ee;stroke-width:3}',
    '.fp-plate-name{font-size:17px;font-weight:800;fill:var(--ink-soft)}',
    '.fp-plate-you .fp-plate-name{fill:#0b6e66}',
    '.fp-plate-glow .fp-plate-dish{stroke:var(--gold);stroke-width:5}',
    '.fp-piece{transition:transform .45s ease}',
    '.fp-glow .fp-cut{fill:#ffb703;stroke:#9a6b00}',
    '.fp-brownies.fp-glow .fp-cut{fill:#c98a5a;stroke:#ffb703;stroke-width:6}',
    '.fp-top .fp-cut{fill:#8ecae6;opacity:.9}',
    '.fp-click{cursor:pointer}.fp-click:hover .fp-cut{opacity:.85}',
    '.fp-dealer{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}',
    '.fp-deal-pic{width:100%;max-width:900px}',
    '.fp-deal{width:100%;height:auto;display:block}',
    '.fp-deal-row{display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap}',
    '.fp-deal-status{font-weight:800;color:var(--ink-soft);font-size:1.05rem}',
    '.fp-area{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.fp-form{display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center;background:var(--paper);border:2px solid var(--line);border-radius:16px;padding:10px 16px}',
    '.fp-form-lines{display:flex;flex-direction:column;gap:8px}',
    '.fp-form-line{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:1.25rem;font-weight:800}',
    '.fp-in{width:64px;height:48px;font-size:1.5rem;font-weight:800;text-align:center;border-radius:12px;border:3px solid var(--line);color:var(--ink);font-family:inherit;background:#fff}',
    '.fp-in.good{border-color:var(--good);background:var(--good-bg)}',
    '.fp-in.bad{border-color:var(--try)}',
    '.fp-frac-in .fp-fn{padding-bottom:5px;border-bottom-width:4px}.fp-frac-in .fp-fd{padding-top:5px}',
    '.fp-work{display:flex;flex-direction:column;align-items:center;gap:8px}',
    '.fp-work-frac{display:flex;align-items:center;gap:8px;font-size:1.3rem;font-weight:800}',
    '.fp-work-frac .fp-frac{font-size:1.8rem;color:#0b6e66}',
    '.fp-sum .chip{padding:4px 10px}',
    '.fp-step1{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:center}',
    '.fp-step-q{font-size:1.25rem;font-weight:800}',
    '.fp-cmp{display:flex;gap:24px;justify-content:center;flex-wrap:wrap}',
    '.fp-cmp-card{display:flex;flex-direction:column;align-items:center;gap:6px;max-width:44%}',
    '.fp-cmp-name{font-weight:800;font-size:1.15rem}',
    '.fp-overlay{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:center;font-weight:800;font-size:1.2rem}',
    '.fp-two{display:flex;gap:28px;justify-content:center;flex-wrap:wrap}',
    '.fp-pick{background:#fff;border:4px solid var(--line);border-radius:18px;padding:10px;cursor:pointer;max-width:44vw}',
    '.fp-pick:hover{border-color:var(--accent)}',
    '.fp-pick.good{border-color:var(--good);background:var(--good-bg)}',
    '.fp-pick.bad{border-color:var(--try);background:var(--try-bg)}',
    '.fp-pick svg{display:block;max-width:100%;height:auto}',
    '.fp-name-row{display:flex;align-items:center;justify-content:center;gap:32px;flex-wrap:wrap}',
    '.fp-name-pic svg{display:block}',
    '.fp-name-frac{display:flex;flex-direction:column;align-items:center;gap:6px;min-width:220px}',
    '.fp-name-lab{font-weight:700;color:var(--ink-soft);font-size:.95rem}',
    '.fp-name-said{font-weight:800;font-size:1.2rem;min-height:2.6em;text-align:center}',
    '@media (max-width:640px){.fp-form-line{font-size:1.1rem}.fp-name-row{gap:12px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'fair-share-pizza' }, css));
})();

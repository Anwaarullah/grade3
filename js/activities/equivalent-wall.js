/* Equivalent Fraction Wall — different fractions, same amount: 1/2 = 2/4 = 4/8 on a fraction wall,
 * chains that count in steps, 9/27 as a unit fraction and "same amount?" strips (Unit 12.2). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;
  var ID = 'equivalent-wall';

  // Every strip is exactly W wide and starts at LX, so equal amounts end at the same x.
  var W = 600;
  var LX = 96;
  var VBW = LX + W + 20;

  var NAMES = { 2: 'halves', 3: 'thirds', 4: 'quarters', 5: 'fifths', 6: 'sixths', 8: 'eighths', 10: 'tenths', 12: 'twelfths' };

  /* ---------------- small helpers ---------------- */
  function fracHTML(n, d, cls) {
    return '<span class="eqw-frac' + (cls ? ' ' + cls : '') + '"><span class="eqw-fn">' + n + '</span><span class="eqw-fd">' + d + '</span></span>';
  }
  function fracEl(n, d, cls) {
    return el('span', { class: 'eqw-frac' + (cls ? ' ' + cls : ''), html: '<span class="eqw-fn">' + n + '</span><span class="eqw-fd">' + d + '</span>' });
  }
  function svgFrac(x, cy, n, d, size, cls) {
    var g = S('g', { class: 'eqw-sfrac' + (cls ? ' ' + cls : '') });
    var w = Math.max(String(n).length, String(d).length) * size * 0.62 + 6;
    g.appendChild(S('text', { x: x, y: cy - size * 0.2, 'text-anchor': 'middle', 'font-size': size }, String(n)));
    g.appendChild(S('line', { x1: x - w / 2, y1: cy, x2: x + w / 2, y2: cy }));
    g.appendChild(S('text', { x: x, y: cy + size * 0.88, 'text-anchor': 'middle', 'font-size': size }, String(d)));
    return g;
  }
  function labSize(h) {
    return Math.min(20, Math.max(12, Math.round(h * 0.42)));
  }
  function svgRoot(H, cls) {
    return S('svg', { viewBox: '0 0 ' + VBW + ' ' + H, width: VBW, height: H, class: 'eqw-svg' + (cls ? ' ' + cls : '') });
  }
  function xAt(n, d) {
    return LX + (W * n) / d;
  }
  function vline(parent, x, y1, y2, cls) {
    var l = S('line', { x1: x, y1: y1, x2: x, y2: y2, class: cls || 'eqw-line' });
    parent.appendChild(l);
    return l;
  }
  function list(from, step, count) {
    var out = [];
    for (var i = 1; i <= count; i++) out.push(from === null ? step * i : from + step * (i - 1));
    return out;
  }
  function repeat(v, k) {
    var a = [];
    for (var i = 0; i < k; i++) a.push(v);
    return a;
  }

  /**
   * One fraction strip of d equal pieces, LX..LX+W.
   * o: { y, h, d, on, cls, label:[n,d], unitLabels, extra }
   */
  function strip(parent, o) {
    var g = S('g', { class: 'eqw-strip' + (o.extra ? ' ' + o.extra : ''), 'data-d': o.d });
    var pieces = [];
    var groups = [];
    var w = W / o.d;
    for (var i = 0; i < o.d; i++) {
      var pg = S('g', { class: 'eqw-pg', 'data-i': i, 'data-d': o.d });
      var r = S('rect', { x: LX + w * i, y: o.y, width: w, height: o.h, class: 'eqw-p' });
      pg.appendChild(r);
      if (o.unitLabels && w >= 44) pg.appendChild(svgFrac(LX + w * i + w / 2, o.y + o.h / 2, 1, o.d, o.h >= 44 ? 15 : 12, 'eqw-plab'));
      g.appendChild(pg);
      pieces.push(r);
      groups.push(pg);
    }
    var labG = S('g', { class: 'eqw-lab' });
    g.appendChild(labG);
    var st = {
      g: g,
      pieces: pieces,
      groups: groups,
      y: o.y,
      h: o.h,
      d: o.d,
      shade: function (n, cls) {
        pieces.forEach(function (r, j) {
          r.setAttribute('class', 'eqw-p' + (j < n ? ' ' + (cls || 'eqw-on') : ''));
        });
      },
      label: function (n, d, cls) {
        MQ.clear(labG);
        labG.appendChild(svgFrac(LX / 2, o.y + o.h / 2, n, d, labSize(o.h), cls));
      },
    };
    st.shade(o.on || 0, o.cls);
    if (o.label) st.label(o.label[0], o.label[1]);
    parent.appendChild(g);
    return st;
  }

  // Numbers 1, 2, 3 ... written on the first k pieces of a strip (counting, not multiplying).
  function countLabels(parent, st, k) {
    var g = S('g', { class: 'eqw-counts' });
    var w = W / st.d;
    for (var i = 0; i < k; i++) {
      g.appendChild(S('text', { x: LX + w * i + w / 2, y: st.y + st.h / 2 + 6, 'text-anchor': 'middle', 'font-size': w >= 30 ? 17 : 12 }, String(i + 1)));
    }
    parent.appendChild(g);
    return g;
  }

  function numBox(role) {
    return el('input', { class: 'eqw-in', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: '3', 'data-role': role, 'aria-label': 'missing number', placeholder: '?' });
  }
  function digits(inp) {
    var raw = inp.value.trim();
    return /^\d+$/.test(raw) ? parseInt(raw, 10) : null;
  }
  function setBox(inp, kind) {
    inp.classList.remove('eqw-good', 'eqw-bad');
    if (kind) inp.classList.add('eqw-' + kind);
  }
  function focusLater(api, inp) {
    api.later(function () {
      try {
        inp.focus({ preventScroll: true });
      } catch (e) {
        inp.focus();
      }
    }, 40);
  }

  /* ================================================================== *
   * LEARN 1: cover one half with quarters, then eighths
   * ================================================================== */
  function learnCover(stage, api) {
    api.lockNext();
    api.say('Half the strip is shaded. Cover the same length with quarters!');
    stage.appendChild(MQ.ui.lesson('Same length, more pieces', 'Drag (or click) the small piece onto the empty row.'));

    var rowH = 44;
    var yA = 12;
    var tracks = [
      { d: 4, need: 2, y: 70 },
      { d: 8, need: 4, y: 128 },
    ];
    var yTray = 200;
    var H = yTray + rowH + 12;
    var root = svgRoot(H, 'eqw-learn1');
    strip(root, { y: yA, h: rowH, d: 2, on: 1, cls: 'eqw-ref', label: [1, 2], unitLabels: true });

    tracks.forEach(function (t, ti) {
      t.g = S('g', { class: 'eqw-track' + (ti ? ' eqw-hide' : ''), 'data-d': t.d });
      for (var i = 0; i < t.d; i++) t.g.appendChild(S('rect', { x: xAt(i, t.d), y: t.y, width: W / t.d, height: rowH, class: 'eqw-slot' }));
      t.lab = S('g');
      t.lab.appendChild(svgFrac(LX / 2, t.y + rowH / 2, '?', t.d, labSize(rowH)));
      t.g.appendChild(t.lab);
      t.count = 0;
      root.appendChild(t.g);
    });
    var line = vline(root, xAt(1, 2), 4, tracks[0].y + rowH + 8);
    root.appendChild(S('text', { x: LX - 10, y: yTray + rowH / 2 + 6, 'text-anchor': 'end', class: 'eqw-traytext' }, 'Piece:'));
    root.appendChild(S('rect', { x: LX - 4, y: yTray - 4, width: W / 4 + 8, height: rowH + 8, rx: 8, class: 'eqw-tray' }));
    var srcLayer = S('g');
    root.appendChild(srcLayer);

    var chain = el('div', { class: 'eqw-chain', html: fracHTML(1, 2) });
    stage.appendChild(root);
    stage.appendChild(chain);

    var phase = 0;
    var src = null;
    var unbind = null;
    function makeSource() {
      if (unbind) unbind();
      MQ.clear(srcLayer);
      var t = tracks[phase];
      src = S('g', { class: 'eqw-src', 'data-d': t.d });
      src.appendChild(S('rect', { x: LX, y: yTray, width: W / t.d, height: rowH, class: 'eqw-p eqw-on' }));
      src.appendChild(svgFrac(LX + W / t.d / 2, yTray + rowH / 2, 1, t.d, 15, 'eqw-plab'));
      srcLayer.appendChild(src);
      unbind = MQ.ui.drag(root, src, {
        move: function (p, dx, dy) {
          src.setAttribute('transform', 'translate(' + dx + ',' + dy + ')');
        },
        end: function (p) {
          src.removeAttribute('transform');
          var tr = tracks[phase];
          var dropped = p.y > tr.y - 30 && p.y < tr.y + rowH + 30;
          var clicked = Math.abs(p.y - (yTray + rowH / 2)) < rowH && p.x > LX - 10 && p.x < LX + W / tr.d + 10;
          if (dropped || clicked) place();
          else api.feedback('Drop the piece on the empty row.', 'info');
        },
      });
      api.cleanup(function () {
        if (unbind) unbind();
      });
    }

    function place() {
      var t = tracks[phase];
      if (!t || t.count >= t.need) return;
      var i = t.count;
      t.g.appendChild(S('rect', { x: xAt(i, t.d), y: t.y, width: W / t.d, height: rowH, class: 'eqw-p eqw-on eqw-placed' }));
      t.g.appendChild(svgFrac(xAt(i, t.d) + W / t.d / 2, t.y + rowH / 2, 1, t.d, 15, 'eqw-plab'));
      t.count++;
      api.sound('pop');
      if (t.count < t.need) {
        api.feedback(t.count + ' ' + (t.count === 1 ? 'piece' : 'pieces') + '. Does it reach the red line yet?', 'info');
        return;
      }
      MQ.clear(t.lab);
      t.lab.appendChild(svgFrac(LX / 2, t.y + rowH / 2, t.need, t.d, labSize(rowH), 'eqw-labgood'));
      api.sound('correct');
      if (phase === 0) {
        chain.innerHTML = fracHTML(1, 2) + '<span class="eqw-eq">=</span>' + fracHTML(2, 4, 'eqw-new');
        api.say('2 quarters cover one half! Now try eighths.', 'cheer');
        api.feedback('2 quarters reach the red line, just like 1 half.', 'good');
        MQ.clear(srcLayer);
        api.later(function () {
          phase = 1;
          tracks[1].g.classList.remove('eqw-hide');
          line.setAttribute('y2', tracks[1].y + rowH + 8);
          makeSource();
        }, 900);
      } else {
        phase = 2;
        if (unbind) unbind();
        MQ.clear(srcLayer);
        chain.innerHTML = fracHTML(1, 2) + '<span class="eqw-eq">=</span>' + fracHTML(2, 4) + '<span class="eqw-eq">=</span>' + fracHTML(4, 8, 'eqw-new');
        api.say('4 eighths cover it too. Same amount, different numbers!', 'cheer');
        api.feedback('1/2 = 2/4 = 4/8. They are equivalent: the same amount.', 'good');
        api.unlockNext();
      }
    }
    makeSource();
  }

  /* ================================================================== *
   * LEARN 2 and 3: add rows to a wall; the tops and bottoms count in steps
   * ================================================================== */
  function learnChain(b, mode) {
    return function (stage, api) {
      api.lockNext();
      var rows = 5;
      if (mode === 'table') {
        api.say('Let us build the half wall. Watch the numbers!');
        stage.appendChild(MQ.ui.lesson('The half pattern', 'Add a row. Every row covers the same half.'));
      } else {
        api.say('Now a quarter wall. Watch the bottom numbers!');
        stage.appendChild(MQ.ui.lesson('The quarter pattern', 'Add a row. Every row covers the same quarter.'));
      }
      var rowH = 30;
      var gap = 6;
      var top = 8;
      var H = top + rows * (rowH + gap) + 4;
      var root = svgRoot(H, 'eqw-wall');
      var sts = [];
      for (var k = 1; k <= rows; k++) {
        var st = strip(root, { y: top + (k - 1) * (rowH + gap), h: rowH, d: k * b, on: k, label: [k, k * b], unitLabels: true, extra: k > 1 ? 'eqw-hide' : '' });
        sts.push(st);
      }
      vline(root, xAt(1, b), 2, H - 2);
      stage.appendChild(root);

      var shown = 1;
      var addBtn = el('button', { class: 'btn eqw-add', type: 'button' }, 'Add the next row ▶');
      var info = el('div', { class: 'eqw-pattern' });
      stage.appendChild(info);
      stage.appendChild(addBtn);

      // table mode: tops and bottoms light up; jumps mode: a 0..5b number line with jumps of b
      var cellsTop = [];
      var cellsBot = [];
      var jumpsTop = [];
      var jumpsBot = [];
      var chainEl = null;
      var jumpG = null;
      var jl = null;
      if (mode === 'table') {
        var tTop = el('div', { class: 'eqw-trow' }, el('span', { class: 'eqw-thead' }, 'top'));
        var tBot = el('div', { class: 'eqw-trow eqw-trow-bot' }, el('span', { class: 'eqw-thead' }, 'bottom'));
        for (var c = 1; c <= rows; c++) {
          if (c > 1) {
            var jt = el('span', { class: 'eqw-tj' }, '+1');
            var jb = el('span', { class: 'eqw-tj' }, '+' + b);
            jumpsTop.push(jt);
            jumpsBot.push(jb);
            tTop.appendChild(jt);
            tBot.appendChild(jb);
          }
          var ct = el('span', { class: 'eqw-tcell', 'data-k': c }, String(c));
          var cb = el('span', { class: 'eqw-tcell', 'data-k': c }, String(c * b));
          cellsTop.push(ct);
          cellsBot.push(cb);
          tTop.appendChild(ct);
          tBot.appendChild(cb);
        }
        info.appendChild(el('div', { class: 'eqw-table' }, tTop, tBot));
      } else {
        var max = rows * b;
        var NW = 640;
        var nl = 30;
        jl = S('svg', { viewBox: '0 0 700 92', width: 700, height: 92, class: 'eqw-svg eqw-nl' });
        var xN = function (v) {
          return nl + (NW * v) / max;
        };
        jl.appendChild(S('line', { x1: xN(0), y1: 62, x2: xN(max), y2: 62, class: 'eqw-axis' }));
        for (var v = 0; v <= max; v++) {
          var isStep = v % b === 0;
          jl.appendChild(S('line', { x1: xN(v), y1: isStep ? 52 : 56, x2: xN(v), y2: isStep ? 72 : 68, class: 'eqw-ntick' }));
          if (isStep) jl.appendChild(S('text', { x: xN(v), y: 90, 'text-anchor': 'middle', class: 'eqw-nnum' + (v === 0 ? '' : ' eqw-nnum-off'), 'data-v': v }, String(v)));
        }
        jumpG = S('g');
        jl.appendChild(jumpG);
        jl.xN = xN;
        info.appendChild(jl);
        chainEl = el('div', { class: 'eqw-chain eqw-chain-sm' });
        info.appendChild(chainEl);
      }

      function light(k) {
        if (mode === 'table') {
          cellsTop[k - 1].classList.add('eqw-lit');
          cellsBot[k - 1].classList.add('eqw-lit');
          if (k > 1) {
            jumpsTop[k - 2].classList.add('eqw-lit');
            jumpsBot[k - 2].classList.add('eqw-lit');
          }
        } else {
          var v1 = (k - 1) * b;
          var v2 = k * b;
          var x1 = jl.xN(v1);
          var x2 = jl.xN(v2);
          jumpG.appendChild(S('path', { d: 'M' + x1 + ' 52 Q' + (x1 + x2) / 2 + ' 4 ' + x2 + ' 52', class: 'eqw-arc' }));
          jumpG.appendChild(S('text', { x: (x1 + x2) / 2, y: 22, 'text-anchor': 'middle', class: 'eqw-arct' }, '+' + b));
          var t = jl.querySelector('.eqw-nnum[data-v="' + v2 + '"]');
          if (t) t.setAttribute('class', 'eqw-nnum eqw-nnum-on');
          var parts = [];
          for (var i = 1; i <= k; i++) parts.push(fracHTML(i, i * b, i === k ? 'eqw-new' : ''));
          chainEl.innerHTML = parts.join('<span class="eqw-eq">=</span>');
        }
      }
      light(1);

      addBtn.addEventListener('click', function () {
        if (shown >= rows) return;
        shown++;
        sts[shown - 1].g.classList.remove('eqw-hide');
        light(shown);
        api.sound('pop');
        if (mode === 'table') api.say('Top ' + shown + ', bottom ' + shown * b + '.', 'happy');
        else api.say('Jump ' + b + ' more: ' + shown * b + '.', 'happy');
        if (shown === rows) {
          addBtn.disabled = true;
          if (mode === 'table') {
            api.say('Tops go up 1 at a time. Bottoms go up in 2s. Both go up in steps!', 'cheer');
            api.feedback('Bottoms: 2, 4, 6, 8, 10. That is counting in 2s, the 2 times table!', 'good');
          } else {
            api.say('The bottoms count in 4s: 4, 8, 12, 16, 20!', 'cheer');
            api.feedback('1/4 = 2/8 = 3/12 = 4/16 = 5/20. Every row reaches the same red line.', 'good');
          }
          api.unlockNext();
        }
      });
    };
  }

  /* ================================================================== *
   * PRACTICE DATA
   * ================================================================== */
  // "Same amount?" pairs. Equal ones are the simplified answers the workbook expects.
  var EQUAL_PAIRS = [
    [[2, 4], [1, 2]],
    [[9, 12], [3, 4]],
    [[10, 15], [2, 3]],
    [[3, 30], [1, 10]],
    [[2, 10], [1, 5]],
    [[6, 10], [3, 5]],
  ];
  // Pairs that are NOT equal, built from the two classic chain mistakes.
  var TRAP_PAIRS = [
    { a: [1, 2], b: [2, 3], trap: 'added' },
    { a: [1, 4], b: [2, 5], trap: 'added' },
    { a: [1, 3], b: [2, 4], trap: 'added' },
    { a: [2, 3], b: [3, 4], trap: 'added' },
    { a: [3, 10], b: [3, 30], trap: 'one' },
    { a: [1, 2], b: [1, 4], trap: 'one' },
  ];
  // Unit-fraction bars: n/d where the bar splits into d/n groups of n.
  var UNIT_POOL = [
    [9, 27],
    [9, 27],
    [9, 27],
    [5, 20],
    [6, 18],
    [4, 20],
    [3, 12],
  ];

  function chainQ(b, len, blanks) {
    return {
      type: 'chain',
      b: b,
      len: len,
      blanks: blanks.map(function (bl) {
        return { k: bl.k, part: bl.part, ans: bl.part === 'n' ? bl.k : bl.k * b };
      }),
    };
  }

  function buildDeck() {
    var q = [];
    // Level 1: cover a shaded half or quarter with smaller pieces.
    var l1 = [
      { b: 2, D: U.pick([4, 6]) },
      { b: 2, D: U.pick([10, 8]) },
      { b: 4, D: U.pick([8, 12]) },
    ];
    U.shuffle(l1).forEach(function (c) {
      q.push({ type: 'cover', a: 1, b: c.b, D: c.D, ans: c.D / c.b });
    });
    // Level 2: fill the next term of a chain (one chain each from 1/2, 1/10, 1/4).
    U.shuffle([2, 10, 4]).forEach(function (b) {
      var len = b === 2 ? U.rand(3, 5) : b === 4 ? U.rand(2, 4) : U.rand(2, 3);
      q.push(chainQ(b, len, [{ k: len, part: U.pick(['n', 'd']) }]));
    });
    // Level 3: two of: two missing terms, unit fraction bar, "same amount?" cards.
    U.shuffle(['chain2', 'unit', 'match'])
      .slice(0, 2)
      .forEach(function (t) {
        if (t === 'chain2') {
          var b = U.pick([2, 4, 10]);
          var len = b === 10 ? 4 : 5;
          var ks = U.shuffle(U.range(2, len)).slice(0, 2).sort(function (x, y) {
            return x - y;
          });
          q.push(chainQ(b, len, [{ k: ks[0], part: U.pick(['n', 'd']) }, { k: ks[1], part: U.pick(['n', 'd']) }]));
        } else if (t === 'unit') {
          var u = U.pick(UNIT_POOL);
          var n = u[0];
          var d = u[1];
          var g = d / n;
          q.push({ type: 'unit', n: n, d: d, g: g, options: U.shuffle([2, g, n]) });
        } else {
          var eqs = U.shuffle(EQUAL_PAIRS).slice(0, 2);
          var tr = U.pick(TRAP_PAIRS);
          var cards = eqs.map(function (p) {
            return { a: p[0], b: p[1], same: true, trap: null };
          });
          cards.push({ a: tr.a, b: tr.b, same: false, trap: tr.trap });
          q.push({ type: 'match', cards: U.shuffle(cards) });
        }
      });
    return q;
  }
  var deck = null;

  /* ================================================================== *
   * PRACTICE: cover a half or quarter
   * ================================================================== */
  function renderCover(stage, api, q) {
    var pl = NAMES[q.D];
    api.say('How many ' + pl + ' cover the shaded part?', 'think');
    stage.appendChild(MQ.ui.prompt('How many <b>' + pl + '</b> cover ' + fracHTML(q.a, q.b) + '?'));
    var rowH = 50;
    var y1 = 10;
    var y2 = 74;
    var H = y2 + rowH + 10;
    var root = svgRoot(H, 'eqw-cover');
    strip(root, { y: y1, h: rowH, d: q.b, on: q.a, cls: 'eqw-ref', label: [q.a, q.b], unitLabels: true });
    var cov = strip(root, { y: y2, h: rowH, d: q.D, on: 0, label: ['?', q.D], unitLabels: true, extra: 'eqw-click' });
    vline(root, xAt(q.a, q.b), 2, H - 2);
    stage.appendChild(root);

    var shaded = 0;
    var countEl = el('div', { class: 'eqw-count' });
    function updateCount() {
      countEl.textContent = 'You shaded ' + shaded + (shaded === 1 ? ' piece' : ' pieces') + '.';
    }
    updateCount();
    stage.appendChild(el('div', { class: 'eqw-small' }, 'Click the pieces to shade them up to the red line.'));
    cov.groups.forEach(function (pg, i) {
      pg.addEventListener('click', function () {
        if (api.isAnswered()) return;
        shaded = shaded === i + 1 ? i : i + 1;
        cov.shade(shaded);
        updateCount();
        MQ.sound('click');
      });
    });

    var inp = numBox('n');
    var checkBtn = el('button', { class: 'btn btn-check eqw-check', type: 'button' }, 'Check');
    var row = el('div', { class: 'eqw-ansrow' }, fracEl(q.a, q.b, 'eqw-big'), el('span', { class: 'eqw-eq' }, '='), el('span', { class: 'eqw-frac eqw-big eqw-fin' }, el('span', { class: 'eqw-fn' }, inp), el('span', { class: 'eqw-fd' }, String(q.D))), checkBtn);
    stage.appendChild(countEl);
    stage.appendChild(row);
    focusLater(api, inp);

    function finish() {
      inp.value = String(q.ans);
      setBox(inp, 'good');
      inp.disabled = true;
      checkBtn.disabled = true;
      shaded = q.ans;
      cov.shade(q.ans);
      cov.label(q.ans, q.D, 'eqw-labgood');
      countLabels(root, cov, q.ans);
      updateCount();
    }

    function submit() {
      if (api.isAnswered()) return;
      var n = digits(inp);
      if (n === null) {
        api.feedback('Type a number in the box first.', 'info');
        inp.focus();
        return;
      }
      if (n === q.ans) {
        finish();
        api.check(true, q.ans + ' ' + pl + ' cover the same length. ' + q.a + '/' + q.b + ' = ' + q.ans + '/' + q.D + '!');
        return;
      }
      setBox(inp, 'bad');
      var second = api.tries() >= 1;
      // show the child's answer on the strip: it stops short of or runs past the red line
      if (n > 0 && n <= q.D) {
        shaded = n;
        cov.shade(n, 'eqw-bad');
        updateCount();
      }
      var where = n < q.ans ? 'stops before' : 'goes past';
      var tag;
      var hint;
      if (n === q.a + (q.D - q.b)) {
        tag = 'Added the same number to top and bottom';
        hint = 'Adding the same number to top and bottom does not work. Your ' + n + '/' + q.D + ' (pink) ' + where + ' the red line.';
      } else if (n === q.a) {
        tag = 'Changed only one number';
        hint = '1/' + q.D + ' is a much smaller piece than 1/' + q.b + '. Look: 1 piece ' + where + ' the red line.';
      } else {
        tag = 'Miscounted the small pieces';
        hint = n > 0 && n <= q.D ? 'Your ' + n + ' pieces (pink) ' + where + ' the red line. Shade up to the line and count.' : 'Shade the pieces up to the red line, then count them.';
      }
      if (second) hint += ' Count each piece: 1, 2, … and stop at the line.';
      api.check(false, hint, tag);
    }
    checkBtn.addEventListener('click', submit);
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    });
    api.onReveal(function () {
      finish();
      api.feedback('Count the ' + pl + ' up to the red line: ' + U.range(1, q.ans).join(', ') + '. So ' + q.a + '/' + q.b + ' = ' + q.ans + '/' + q.D + '.', 'info');
    });
  }

  /* ================================================================== *
   * PRACTICE: chains (one or two gaps)
   * ================================================================== */
  function renderChain(stage, api, q) {
    var b = q.b;
    var two = q.blanks.length > 1;
    api.say(two ? 'Two gaps! Count in steps.' : 'Fill the gap. Count in steps!', 'think');
    stage.appendChild(MQ.ui.prompt(two ? 'Fill in the <b>two</b> missing numbers.' : 'Fill in the missing number.'));

    var blankAt = {};
    q.blanks.forEach(function (bl) {
      blankAt[bl.k + bl.part] = bl;
    });

    // the chain, with the step jumps between terms
    var chainRow = el('div', { class: 'eqw-chainq' });
    for (var k = 1; k <= q.len; k++) {
      if (k > 1) chainRow.appendChild(el('div', { class: 'eqw-eqcol' }, el('span', { class: 'eqw-jump' }, '+1'), el('span', { class: 'eqw-eq' }, '='), el('span', { class: 'eqw-jump' }, '+' + b)));
      var tn = blankAt[k + 'n'] ? (blankAt[k + 'n'].inp = numBox(k + 'n')) : String(k);
      var td = blankAt[k + 'd'] ? (blankAt[k + 'd'].inp = numBox(k + 'd')) : String(k * b);
      chainRow.appendChild(el('span', { class: 'eqw-frac eqw-term', 'data-k': k }, el('span', { class: 'eqw-fn' }, tn), el('span', { class: 'eqw-fd' }, td)));
    }
    stage.appendChild(chainRow);
    stage.appendChild(el('div', { class: 'eqw-small' }, 'Tops count in 1s. Bottoms count in ' + b + 's.'));

    // the wall: one row per term whose bottom number is shown
    var rowH = 26;
    var gap = 6;
    var top = 6;
    var H = top + (q.len + 1) * (rowH + gap) + 2;
    var root = svgRoot(H, 'eqw-wall');
    var sts = [];
    for (var j = 1; j <= q.len; j++) {
      var hideD = !!blankAt[j + 'd'];
      var hideN = !!blankAt[j + 'n'];
      var st = strip(root, { y: top + (j - 1) * (rowH + gap), h: rowH, d: j * b, on: hideN ? 0 : j, label: [hideN ? '?' : j, j * b], extra: hideD ? 'eqw-hide' : '' });
      sts.push(st);
    }
    var yoursY = top + q.len * (rowH + gap);
    var yours = null;
    vline(root, xAt(1, b), 2, yoursY - 2);
    stage.appendChild(root);

    var checkBtn = el('button', { class: 'btn btn-check eqw-check', type: 'button' }, 'Check');
    stage.appendChild(checkBtn);
    var work = el('div', { class: 'eqw-work' });
    stage.appendChild(work);
    focusLater(api, q.blanks[0].inp);

    function showYours(n, d) {
      if (yours) {
        root.removeChild(yours.g);
        yours = null;
      }
      if (!(n > 0 && d > 0 && n <= d && d <= 60)) return;
      yours = strip(root, { y: yoursY, h: rowH, d: d, on: n, cls: 'eqw-bad', label: [n, d], extra: 'eqw-yours' });
      yours.label(n, d, 'eqw-labbad');
    }

    function finish() {
      q.blanks.forEach(function (bl) {
        bl.inp.value = String(bl.ans);
        setBox(bl.inp, 'good');
        bl.inp.disabled = true;
      });
      checkBtn.disabled = true;
      if (yours) {
        root.removeChild(yours.g);
        yours = null;
      }
      sts.forEach(function (st, i) {
        st.g.classList.remove('eqw-hide');
        st.shade(i + 1);
        st.label(i + 1, (i + 1) * b);
      });
    }

    function submit() {
      if (api.isAnswered()) return;
      var empty = null;
      q.blanks.forEach(function (bl) {
        bl.v = digits(bl.inp);
        if (bl.v === null && !empty) empty = bl;
      });
      if (empty) {
        api.feedback(two ? 'Fill both boxes first.' : 'Type a number in the box first.', 'info');
        empty.inp.focus();
        return;
      }
      var wrong = null;
      q.blanks.forEach(function (bl) {
        if (bl.v === bl.ans) setBox(bl.inp, 'good');
        else {
          setBox(bl.inp, 'bad');
          if (!wrong) wrong = bl;
        }
      });
      if (!wrong) {
        finish();
        api.check(true, 'Yes! Tops count in 1s, bottoms count in ' + b + 's.');
        return;
      }
      var k = wrong.k;
      var prevN = k - 1;
      var prevD = (k - 1) * b;
      var v = wrong.v;
      var un;
      var ud;
      var added;
      var one;
      if (wrong.part === 'n') {
        un = v;
        ud = k * b;
        added = v === prevN + b;
        one = v === prevN || v === 1;
      } else {
        un = k;
        ud = v;
        added = v === prevD + 1;
        one = v === prevD || v === b;
      }
      showYours(un, ud);
      var second = api.tries() >= 1;
      var canSee = un > 0 && ud > 0 && un <= ud && ud <= 60;
      var tag;
      var hint;
      if (added) {
        tag = 'Added the same number to top and bottom';
        hint = 'Adding the same number to top and bottom changes the amount.' + (canSee ? ' Your pink ' + un + '/' + ud + ' does not line up with the red line.' : '');
        if (second) hint += ' Tops go up 1, bottoms go up ' + b + '.';
      } else if (one) {
        tag = 'Changed only one number';
        hint = 'Both numbers change along the chain: the top counts in 1s and the bottom counts in ' + b + 's.';
        if (second) hint += wrong.part === 'n' ? ' This is fraction number ' + k + ' in the chain.' : ' Count on ' + b + ' from ' + prevD + '.';
      } else {
        tag = 'Lost the step pattern';
        if (wrong.part === 'd') {
          hint = 'The bottoms jump in ' + b + 's. Count on ' + b + ' more each time.';
          if (second) hint = 'Count the bottoms in ' + b + 's: ' + list(null, b, k - 1).join(', ') + ', … What comes next?';
        } else {
          hint = 'The tops count 1, 2, 3, 4 … one more each time.';
          if (second) hint = 'Count the pieces up to the red line on the ' + k * b + '-piece row.';
        }
        if (canSee && !second) hint += ' Your pink strip does not line up with the red line.';
      }
      api.check(false, hint, tag);
    }
    checkBtn.addEventListener('click', submit);
    q.blanks.forEach(function (bl) {
      bl.inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });
    });

    api.onReveal(function () {
      finish();
      MQ.clear(work);
      q.blanks.forEach(function (bl) {
        if (bl.part === 'd') {
          work.appendChild(el('div', { class: 'eqw-workline' }, el('span', { class: 'eqw-worklab' }, 'Bottom ' + bl.k + ':'), MQ.ui.sum(repeat(b, bl.k), bl.k * b)));
        } else {
          work.appendChild(el('div', { class: 'eqw-workline' }, el('span', { class: 'eqw-worklab' }, 'Top ' + bl.k + ':'), el('span', { class: 'chip' }, 'fraction number ' + bl.k + ' → top ' + bl.k)));
        }
      });
      api.feedback('Tops: ' + U.range(1, q.len).join(', ') + '. Bottoms count in ' + b + 's: ' + list(null, b, q.len).join(', ') + '. Every row reaches the red line.', 'info');
    });
  }

  /* ================================================================== *
   * PRACTICE: which unit fraction equals 9/27?
   * ================================================================== */
  function renderUnit(stage, api, q) {
    api.say('Which unit fraction is the same amount?', 'think');
    stage.appendChild(MQ.ui.prompt('Which unit fraction is the same as ' + fracHTML(q.n, q.d) + '?'));
    var sq = W / q.d;
    var h = Math.min(40, Math.max(26, sq));
    var y = 14;
    var H = y + h + 64;
    var root = svgRoot(H, 'eqw-bar');
    var bar = strip(root, { y: y, h: h, d: q.d, on: q.n, label: [q.n, q.d] });
    var brG = S('g');
    var totG = S('g', { class: 'eqw-hide' });
    for (var gi = 0; gi < q.g; gi++) {
      var x1 = xAt(gi * q.n, q.d);
      var x2 = xAt((gi + 1) * q.n, q.d);
      brG.appendChild(S('rect', { x: x1, y: y, width: x2 - x1, height: h, class: 'eqw-grp' }));
      brG.appendChild(S('path', { d: 'M' + (x1 + 3) + ' ' + (y + h + 6) + ' v8 H' + (x2 - 3) + ' v-8', class: 'eqw-brace' }));
      brG.appendChild(S('text', { x: (x1 + x2) / 2, y: y + h + 32, 'text-anchor': 'middle', class: 'eqw-brt' }, String(q.n)));
      totG.appendChild(S('text', { x: x2, y: y + h + 56, 'text-anchor': 'middle', class: 'eqw-tot' }, String((gi + 1) * q.n)));
    }
    root.appendChild(brG);
    root.appendChild(totG);
    stage.appendChild(root);
    void bar;
    stage.appendChild(el('div', { class: 'eqw-small' }, 'The bar is cut into equal groups of ' + q.n + '.'));

    var ch = MQ.ui.choices(
      q.options.map(function (o) {
        return { label: fracHTML(1, o), value: o };
      }),
      function (v) {
        if (api.isAnswered()) return;
        if (v === q.g) {
          ch.mark(v, 'good');
          ch.disable();
          totG.classList.remove('eqw-hide');
          api.check(true, q.g + ' equal groups, and 1 group is shaded. ' + q.n + '/' + q.d + ' = 1/' + q.g + '!');
          return;
        }
        ch.mark(v, 'bad');
        totG.classList.remove('eqw-hide');
        var hint;
        if (v === q.n) hint = q.n + ' is how many squares are in one group, not how many groups. Count the groups.';
        else hint = 'Is the shaded part 1/' + v + ' of the bar? Count how many equal groups there are.';
        if (api.tries() >= 1) hint += ' Count in ' + q.n + 's: ' + list(null, q.n, q.g).join(', ') + '. That is ' + q.g + ' groups.';
        api.check(false, hint, 'Picked the wrong unit fraction');
      },
      { columns: 3 }
    );
    ch.classList.add('eqw-choices');
    ch.buttons.forEach(function (bt) {
      bt.setAttribute('data-value', String(bt.value_));
    });
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(q.g, 'good');
      ch.disable();
      totG.classList.remove('eqw-hide');
      api.feedback('Count in ' + q.n + 's: ' + list(null, q.n, q.g).join(', ') + '. That is ' + q.g + ' equal groups. 1 group shaded, so ' + q.n + '/' + q.d + ' = 1/' + q.g + '.', 'info');
    });
  }

  /* ================================================================== *
   * PRACTICE: "same amount?" cards
   * ================================================================== */
  function renderMatch(stage, api, q) {
    api.say('Do the shaded parts end in the same place?', 'think');
    stage.appendChild(MQ.ui.prompt('Same amount? Look where the shading <b>ends</b>.'));
    var list3 = el('div', { class: 'eqw-cards' });
    stage.appendChild(list3);
    var rowH = 28;
    var done = 0;
    var cards = q.cards.map(function (c, idx) {
      var root = svgRoot(2 * rowH + 18, 'eqw-cardsvg');
      var s1 = strip(root, { y: 4, h: rowH, d: c.a[1], on: c.a[0], label: c.a });
      var s2 = strip(root, { y: 4 + rowH + 10, h: rowH, d: c.b[1], on: c.b[0], cls: 'eqw-on2', label: c.b });
      void s1;
      void s2;
      var guide = null;
      function showGuide() {
        if (guide) return;
        guide = vline(root, xAt(c.a[0], c.a[1]), 0, 2 * rowH + 18, 'eqw-line');
      }
      var yes = el('button', { class: 'choice eqw-yn', type: 'button', 'data-value': 'yes', 'data-idx': idx }, 'Same amount');
      var no = el('button', { class: 'choice eqw-yn', type: 'button', 'data-value': 'no', 'data-idx': idx }, 'Not the same');
      var verdict = el('div', { class: 'eqw-verdict' });
      var card = el('div', { class: 'eqw-card', 'data-idx': idx }, root, el('div', { class: 'eqw-ynrow' }, yes, no, verdict));
      list3.appendChild(card);
      var obj = { c: c, yes: yes, no: no, done: false };
      function settle() {
        obj.done = true;
        yes.disabled = true;
        no.disabled = true;
        (c.same ? yes : no).classList.add('good');
        showGuide();
        verdict.innerHTML = c.same ? fracHTML(c.a[0], c.a[1]) + ' = ' + fracHTML(c.b[0], c.b[1]) : fracHTML(c.a[0], c.a[1]) + ' ≠ ' + fracHTML(c.b[0], c.b[1]);
        card.classList.add('eqw-card-done');
      }
      obj.settle = settle;
      function pick(saysSame) {
        if (obj.done || api.isAnswered()) return;
        MQ.sound('click');
        var btn = saysSame ? yes : no;
        if (saysSame === c.same) {
          yes.classList.remove('bad');
          no.classList.remove('bad');
          settle();
          done++;
          api.sound('pop');
          if (done === cards.length) api.check(true, 'Yes! Same length means same amount.');
          else api.feedback('Right! Now the next one.', 'good');
          return;
        }
        btn.classList.add('bad');
        showGuide();
        var second = api.tries() >= 1;
        var hint;
        var tag;
        if (c.same) {
          tag = 'Thinks a right answer in another form is wrong';
          hint = 'Follow the red line: both shadings end there. Different numbers can be the same amount.';
        } else if (c.trap === 'added') {
          tag = 'Added the same number to top and bottom';
          hint = 'Follow the red line: the shadings end in different places. Adding 1 to top and bottom changes the amount.';
        } else {
          tag = 'Changed only one number';
          hint = 'Follow the red line: the shadings end in different places. Changing only one number changes the amount.';
        }
        if (second) hint += ' Same end = same amount.';
        api.check(false, hint, tag);
      }
      yes.addEventListener('click', function () {
        pick(true);
      });
      no.addEventListener('click', function () {
        pick(false);
      });
      return obj;
    });
    api.onReveal(function () {
      cards.forEach(function (o) {
        o.yes.classList.remove('bad');
        o.no.classList.remove('bad');
        if (!o.done) o.settle();
      });
      api.feedback('The red line shows where the top strip ends. If the bottom shading ends there too, it is the same amount.', 'info');
    });
  }

  MQ.register(ID, {
    learn: [learnCover, learnChain(2, 'table'), learnChain(4, 'jumps')],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'cover') renderCover(stage, api, q);
        else if (q.type === 'chain') renderChain(stage, api, q);
        else if (q.type === 'unit') renderUnit(stage, api, q);
        else renderMatch(stage, api, q);
      },
    },
    _buildDeck: buildDeck, // used by the deck test only
  });

  var css = [
    '.eqw-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;margin:0 .12em;font-weight:800}',
    '.eqw-fn{padding:0 .14em}',
    '.eqw-fd{border-top:.09em solid currentColor;padding:0 .14em}',
    '.eqw-svg{display:block;max-width:100%;height:auto;margin:0 auto}',
    '.eqw-learn1,.eqw-cover,.eqw-wall,.eqw-bar{width:100%;max-width:760px}',
    '.eqw-p{fill:#fff;stroke:#33415c;stroke-width:1.5}',
    '.eqw-p.eqw-on{fill:#ffc94d}',
    '.eqw-p.eqw-on2{fill:#8ecae6}',
    '.eqw-p.eqw-ref{fill:#ff9f1c}',
    '.eqw-p.eqw-bad{fill:#f4a6a6}',
    '.eqw-slot{fill:#f6f8fa;stroke:#8d99ae;stroke-width:1.5;stroke-dasharray:6 4}',
    '.eqw-tray{fill:#eef6f5;stroke:#b8d8d4;stroke-width:2}',
    '.eqw-traytext{font-size:18px;font-weight:800;fill:#5c6b7a}',
    '.eqw-src{cursor:grab}',
    '.eqw-src.dragging{cursor:grabbing;opacity:.85}',
    '.eqw-line{stroke:#d62828;stroke-width:3;stroke-dasharray:8 5;pointer-events:none}',
    '.eqw-click .eqw-pg{cursor:pointer}',
    '.eqw-click .eqw-pg:hover .eqw-p{stroke-width:3}',
    '.eqw-hide{display:none}',
    '.eqw-sfrac text{font-weight:800;fill:#1d2b3a}',
    '.eqw-sfrac line{stroke:#1d2b3a;stroke-width:2}',
    '.eqw-plab text{fill:#33415c}.eqw-plab line{stroke:#33415c;stroke-width:1.5}',
    '.eqw-plab{pointer-events:none}',
    '.eqw-labgood text{fill:#2d6a4f}.eqw-labgood line{stroke:#2d6a4f}',
    '.eqw-labbad text{fill:#c0392b}.eqw-labbad line{stroke:#c0392b}',
    '.eqw-counts text{font-weight:800;fill:#1d2b3a;pointer-events:none}',
    '.eqw-chain{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px;font-size:2.1rem;min-height:84px}',
    '.eqw-chain-sm{font-size:1.6rem;min-height:64px}',
    '.eqw-eq{font-size:1.6em;font-weight:800;margin:0 8px;color:var(--ink)}',
    '.eqw-chain-sm .eqw-eq{font-size:1.2em;margin:0 4px}',
    '.eqw-new{color:#0b6e66;animation:eqw-pop .45s ease}',
    '@keyframes eqw-pop{0%{transform:scale(.5);opacity:0}100%{transform:scale(1);opacity:1}}',
    '.eqw-pattern{display:flex;flex-direction:column;align-items:center;width:100%;max-width:760px}',
    '.eqw-table{display:flex;flex-direction:column;gap:6px;align-items:center}',
    '.eqw-trow{display:flex;align-items:center;gap:6px}',
    '.eqw-trow-bot{border-top:4px solid var(--ink);padding-top:6px}',
    '.eqw-thead{width:72px;font-weight:800;color:var(--ink-soft);text-align:right;margin-right:6px}',
    '.eqw-tcell{width:56px;height:46px;display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:800;border:3px solid var(--line);border-radius:10px;background:#fff;color:#c4ccd4}',
    '.eqw-tcell.eqw-lit{color:var(--ink);border-color:#ff9f1c;background:#fff4e0}',
    '.eqw-tj{width:34px;text-align:center;font-weight:800;font-size:.95rem;color:transparent}',
    '.eqw-tj.eqw-lit{color:#0b6e66}',
    '.eqw-nl{width:100%;max-width:700px}',
    '.eqw-axis{stroke:#1d2b3a;stroke-width:3}',
    '.eqw-ntick{stroke:#1d2b3a;stroke-width:2}',
    '.eqw-nnum{font-size:18px;font-weight:800;fill:#1d2b3a}',
    '.eqw-nnum-off{fill:#c4ccd4}',
    '.eqw-nnum-on{fill:#0b6e66}',
    '.eqw-arc{fill:none;stroke:#0b6e66;stroke-width:3}',
    '.eqw-arct{font-size:17px;font-weight:800;fill:#0b6e66}',
    '.eqw-small{font-size:.95rem;color:var(--ink-soft);font-weight:600;text-align:center}',
    '.eqw-count{font-weight:800;font-size:1.05rem;min-height:1.3em}',
    '.eqw-ansrow{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap}',
    '.eqw-big{font-size:2.2rem}',
    '.eqw-fin .eqw-fn{padding-bottom:4px}',
    '.eqw-in{width:74px;height:54px;font-size:1.6rem;font-weight:800;text-align:center;border-radius:12px;border:3px solid var(--line);color:var(--ink);font-family:inherit;background:#fff}',
    '.eqw-in:focus{outline:none;border-color:var(--accent)}',
    '.eqw-in.eqw-good{border-color:var(--good);background:var(--good-bg);color:var(--good)}',
    '.eqw-in.eqw-bad{border-color:var(--try);background:var(--try-bg)}',
    '.eqw-ansrow .eqw-in{width:84px}',
    '.eqw-chainq{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:2px;font-size:2rem}',
    '.eqw-term .eqw-fn,.eqw-term .eqw-fd{min-width:1.6em;text-align:center;display:flex;justify-content:center;padding:2px .14em}',
    '.eqw-term .eqw-in{width:64px;height:48px;font-size:1.4rem}',
    '.eqw-eqcol{display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 4px}',
    '.eqw-eqcol .eqw-eq{font-size:1.3em;margin:0;line-height:1.1}',
    '.eqw-jump{font-size:.85rem;font-weight:800;color:#0b6e66;background:#e3f6f4;border-radius:10px;padding:1px 7px}',
    '.eqw-work{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.eqw-workline{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.eqw-worklab{font-weight:800}',
    '.eqw-grp{fill:none;stroke:#1d2b3a;stroke-width:4}',
    '.eqw-brace{fill:none;stroke:#0b6e66;stroke-width:2.5}',
    '.eqw-brt{font-size:18px;font-weight:800;fill:#0b6e66}',
    '.eqw-tot{font-size:18px;font-weight:800;fill:#c2410c}',
    '.eqw-choices{max-width:520px}',
    '.eqw-choices .choice .eqw-frac{font-size:1.5em}',
    '.eqw-cards{display:flex;flex-direction:column;gap:10px;width:100%;max-width:900px}',
    '.eqw-card{display:flex;align-items:center;gap:12px;background:#fff;border:3px solid var(--line);border-radius:14px;padding:8px 12px}',
    '.eqw-card-done{border-color:var(--good)}',
    '.eqw-cardsvg{flex:1 1 420px;min-width:0;max-width:600px}',
    '.eqw-ynrow{display:flex;flex-direction:column;gap:6px;min-width:170px;align-items:stretch}',
    '.eqw-yn{min-height:44px;font-size:1.05rem;padding:6px 12px}',
    '.eqw-verdict{font-size:1.3rem;font-weight:800;text-align:center;color:var(--good)}',
    '@media (max-width:820px){.eqw-card{flex-direction:column;align-items:stretch}.eqw-ynrow{flex-direction:row;flex-wrap:wrap;justify-content:center}.eqw-chainq{font-size:1.6rem}.eqw-term .eqw-in{width:54px;height:44px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

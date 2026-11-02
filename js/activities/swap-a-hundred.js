/* Swap a Hundred — subtraction with an exchange: 1 hundred becomes 10 tens (Unit 9.2).
 * A one-row Hundreds/Tens/Ones mat (same pieces as tens-make-a-hundred): click or drag a hundred flat
 * to swap it for 10 tens sticks, and "Take away" buttons that refuse when a column is short.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  /* ---------------------------------------------------------------- *
   * Number helpers
   * ---------------------------------------------------------------- */
  function digits(n) {
    return { h: Math.floor(n / 100), t: Math.floor(n / 10) % 10, o: n % 10 };
  }
  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : many);
  }
  /** Which exchanges a − b needs, working ones first (column method). */
  function needs(a, b) {
    var A = digits(a);
    var B = digits(b);
    var t = A.o < B.o;
    var h = A.t - (t ? 1 : 0) < B.t;
    return { t: t, h: h };
  }
  function category(a, b) {
    var n = needs(a, b);
    return n.t && n.h ? 'both' : n.t ? 'ten' : n.h ? 'hundred' : 'none';
  }
  /** a after the exchanges needed for a − b: counts of hundreds, tens, ones. */
  function exchanged(a, b) {
    var A = digits(a);
    var n = needs(a, b);
    return { h: A.h - (n.h ? 1 : 0), t: A.t + (n.h ? 10 : 0) - (n.t ? 1 : 0), o: A.o + (n.t ? 10 : 0) };
  }
  /** The classic error: in every column take the smaller digit from the larger. */
  function smallFromLarge(a, b) {
    var A = digits(a);
    var B = digits(b);
    return Math.abs(A.h - B.h) * 100 + Math.abs(A.t - B.t) * 10 + Math.abs(A.o - B.o);
  }
  /** "100 + 140 + 6" from counts. keepZero shows a 0 tens/ones part; zero hundreds are dropped. */
  function partsText(c, keepZero) {
    var out = [];
    if (c.h) out.push(c.h * 100);
    if (c.t || keepZero) out.push(c.t * 10);
    if (c.o || keepZero) out.push(c.o);
    if (!out.length) out.push(0);
    return out.join(' + ');
  }
  function countsText(c) {
    return plural(c.h, 'hundred', 'hundreds') + ' · ' + plural(c.t, 'ten', 'tens') + ' · ' + plural(c.o, 'one', 'ones');
  }

  /* ---------------------------------------------------------------- *
   * Mistake diagnosis for a typed difference
   * ---------------------------------------------------------------- */
  function walkHint(a, b) {
    var n = needs(a, b);
    var X = exchanged(a, b);
    var B = digits(b);
    var cols = [];
    cols.push(X.o + ' − ' + B.o);
    cols.push(X.t * 10 + ' − ' + B.t * 10);
    if (X.h || B.h) cols.push(X.h * 100 + ' − ' + B.h * 100);
    var first = n.h || n.t ? 'Swap first: ' + a + ' = ' + partsText(X, true) + '.' : a + ' = ' + partsText(digits(a), true) + '.';
    return first + ' Now do ' + cols.join(', then ') + '.';
  }

  function diagnoseSub(a, b, ans, tries) {
    var c = a - b;
    var n = needs(a, b);
    var A = digits(a);
    var B = digits(b);
    var sfl = smallFromLarge(a, b);
    var d = ans - c;
    var out;
    if (ans === a + b) {
      out = { tag: 'Added instead of taking away', hint: ans + ' is bigger than ' + a + '! We take away ' + b + ', so the answer is smaller.' };
    } else if (ans === sfl && sfl !== c) {
      var rv = [];
      if (A.o < B.o) rv.push('In the ones it is ' + A.o + ' take away ' + B.o + ', not ' + B.o + ' take away ' + A.o + '. Not enough ones: swap a ten!');
      if (A.t < B.t) rv.push('In the tens it is ' + A.t + ' take away ' + B.t + ', not ' + B.t + ' take away ' + A.t + '. Not enough tens: swap a hundred!');
      if (!rv.length) rv.push('Take the bottom number away from the top number in every column. Swap first if a column is short.');
      out = { tag: 'Took smaller digit from larger', hint: rv.join(' ') };
    } else if (n.h && d === 100) {
      out = { tag: 'Forgot to reduce the hundreds', hint: 'You swapped a hundred for 10 tens. So there is one hundred less: ' + A.h + ' hundreds become ' + (A.h - 1) + '.' };
    } else if (n.t && d === 10) {
      out = { tag: 'Forgot to reduce the tens', hint: 'You swapped a ten for 10 ones. So there is one ten less.' };
    } else if (n.h && A.t === 0) {
      out = { tag: 'Stuck on zero tens', hint: a + ' has 0 tens. Swap 1 hundred for 10 tens, then take away ' + plural(B.t, 'ten', 'tens') + '.' };
    } else if (Math.abs(d) === 10) {
      out = { tag: 'Tens subtracted wrongly', hint: 'Nearly! Check the tens again.' };
    } else if (Math.abs(d) === 100) {
      out = { tag: 'Hundreds subtracted wrongly', hint: 'Nearly! Check the hundreds again.' };
    } else if (Math.abs(d) < 10) {
      out = { tag: 'Ones subtracted wrongly', hint: 'Very close! Check the ones again.' };
    } else if (n.h) {
      out = { tag: 'Did not exchange when tens were short', hint: 'Are there enough tens? ' + A.t + ' tens take away ' + B.t + ' tens… Swap a hundred first!' };
    } else {
      out = { tag: 'Subtraction slip', hint: 'Take away the ones, then the tens, then the hundreds.' };
    }
    if (tries >= 1) out.hint = walkHint(a, b);
    return out;
  }

  /** A repeat of the same wrong answer is not a new mistake: just nudge, do not count a try. */
  function repeated(memo, v, api) {
    if (memo.last === v) {
      api.feedback('That is the same answer as before. Try a different one.', 'try');
      return true;
    }
    memo.last = v;
    return false;
  }

  /* ---------------------------------------------------------------- *
   * Place value mat (SVG, one row) with Take away and Swap tools
   * ---------------------------------------------------------------- */
  var VBW = 820;
  var HEAD = 34;
  var RH = 100;
  var CX = { h: 110, t: 350, o: 690 };
  var CW = { h: 240, t: 340, o: 120 };
  var NAMES = { h: 'Hundreds', t: 'Tens', o: 'Ones' };
  var WORD = { h: ['hundred', 'hundreds'], t: ['ten', 'tens'], o: ['one', 'ones'] };
  var SIZE = { h: [40, 40], t: [12, 76], o: [16, 16] };

  function piecePos(k, i) {
    var top = HEAD;
    if (k === 'h') return { x: CX.h + 12 + (i % 5) * 46, y: top + 6 + Math.floor(i / 5) * 48 };
    if (k === 't') return { x: CX.t + 10 + i * 16 + Math.floor(i / 5) * 8, y: top + 12 };
    var f = Math.floor(i / 10);
    var j = i % 10;
    return { x: CX.o + 12 + (j % 5) * 19, y: top + 8 + f * 46 + Math.floor(j / 5) * 19 };
  }
  function piece(k, i, cls) {
    var p = piecePos(k, i);
    var s = SIZE[k];
    var g = svg('g', { class: 'swh-piece swh-k' + k + ' ' + cls });
    g.appendChild(svg('rect', { x: p.x, y: p.y, width: s[0], height: s[1], rx: 2, class: 'swh-body' }));
    var d = '';
    var j;
    if (k === 'h') for (j = 1; j < 10; j++) d += 'M' + (p.x + j * 4) + ' ' + p.y + 'v40M' + p.x + ' ' + (p.y + j * 4) + 'h40';
    if (k === 't') for (j = 1; j < 10; j++) d += 'M' + p.x + ' ' + (p.y + j * 7.6) + 'h12';
    if (d) g.appendChild(svg('path', { d: d, class: 'swh-lines' }));
    if (cls.indexOf('swh-taken') >= 0) g.appendChild(svg('path', { d: 'M' + (p.x - 3) + ' ' + (p.y + s[1] + 3) + 'L' + (p.x + s[0] + 3) + ' ' + (p.y - 3), class: 'swh-slash' }));
    return g;
  }

  /**
   * opts: b (number to take away, or null), swapH (default true), swapT (default false),
   * hLocked (hundred swap hidden until mat.unlockH()), maxH (max hundred swaps),
   * readout: 'parts' | 'counts', onChange(what).
   * what: 'swap-h', 'swap-t', 'take-k', 'refuse-k', 'done'.
   */
  function makeMat(api, a, opts) {
    opts = opts || {};
    var b = opts.b == null ? null : opts.b;
    var B = b == null ? null : digits(b);
    var swapOK = { h: opts.swapH !== false, t: !!opts.swapT };
    var hLocked = !!opts.hLocked;
    var maxH = opts.maxH == null ? 99 : opts.maxH;
    var st;
    var took;
    var swapsH;
    var frozen = false;
    var pop = {};

    function reset() {
      var d = digits(a);
      st = { h: { n: d.h, fresh: 0, taken: 0 }, t: { n: d.t, fresh: 0, taken: 0 }, o: { n: d.o, fresh: 0, taken: 0 } };
      took = { h: !B || !B.h, t: !B || !B.t, o: !B || !B.o };
      swapsH = 0;
      pop = {};
    }
    reset();

    var H = HEAD + RH + 4;
    var root = svg('svg', { viewBox: '0 0 ' + VBW + ' ' + H, class: 'swh-mat-svg', width: VBW, height: H, role: 'img', 'aria-label': 'Place value mat showing ' + a });
    var colG = {};
    var layer = {};
    var grab = {};
    ['h', 't', 'o'].forEach(function (k) {
      root.appendChild(svg('rect', { x: CX[k] + 2, y: 2, width: CW[k] - 4, height: HEAD - 6, rx: 8, class: 'swh-head swh-head-' + k }));
      root.appendChild(svg('text', { x: CX[k] + CW[k] / 2, y: HEAD - 11, 'text-anchor': 'middle', class: 'swh-head-text' }, NAMES[k]));
      colG[k] = svg('g', { class: 'swh-col-g' });
      colG[k].appendChild(svg('rect', { x: CX[k] + 2, y: HEAD, width: CW[k] - 4, height: RH, rx: 10, class: 'swh-cell' }));
      layer[k] = svg('g');
      grab[k] = svg('g', { class: 'swh-grab' });
      colG[k].appendChild(layer[k]);
      colG[k].appendChild(grab[k]);
      root.appendChild(colG[k]);
    });
    root.appendChild(svg('text', { x: 56, y: HEAD + RH / 2 + 11, 'text-anchor': 'middle', class: 'swh-rlabel' }, String(a)));

    var readout = el('div', { class: 'swh-readout' });
    var tools = el('div', { class: 'swh-tools' });
    var takeBtn = {};
    var swapBtn = {};

    function canSwap(k) {
      if (frozen || !swapOK[k]) return false;
      if (k === 'h') return !hLocked && swapsH < maxH && st.h.n >= 1 && st.t.n < 10;
      return st.t.n >= 1 && st.o.n < 10;
    }

    function draw() {
      ['h', 't', 'o'].forEach(function (k) {
        MQ.clear(layer[k]);
        MQ.clear(grab[k]);
        grab[k].removeAttribute('transform');
        var s = st[k];
        var normal = s.n - s.fresh;
        var total = s.n + s.taken;
        var dragOk = k !== 'o' && canSwap(k);
        for (var i = 0; i < total; i++) {
          var cls = i < normal ? 'swh-a' : i < s.n ? 'swh-n' + (pop[k] ? ' swh-pop' : '') : 'swh-taken';
          var node = piece(k, i, cls);
          if (dragOk && i === s.n - 1) grab[k].appendChild(node);
          else layer[k].appendChild(node);
        }
        grab[k].classList.toggle('swh-can', dragOk);
        layer[k].classList.toggle('swh-can', dragOk);
      });
      pop = {};
      var c = { h: st.h.n, t: st.t.n, o: st.o.n };
      if (opts.readout === 'parts') {
        readout.innerHTML = a + ' = <span class="swh-ph">' + c.h * 100 + '</span> + <span class="swh-pt">' + c.t * 10 + '</span> + <span class="swh-po">' + c.o + '</span>';
      } else {
        readout.textContent = 'On the mat: ' + countsText(c);
      }
      ['h', 't', 'o'].forEach(function (k) {
        var tb = takeBtn[k];
        if (tb) {
          tb.disabled = frozen || took[k];
          if (took[k]) tb.textContent = '✓ ' + plural(B[k], WORD[k][0], WORD[k][1]) + ' taken';
        }
      });
      if (swapBtn.h) {
        swapBtn.h.hidden = hLocked;
        swapBtn.h.disabled = frozen;
      }
      if (swapBtn.t) swapBtn.t.disabled = frozen;
    }

    function shake(k) {
      colG[k].classList.remove('swh-shake');
      void root.getBoundingClientRect();
      colG[k].classList.add('swh-shake');
      api.later(function () { colG[k].classList.remove('swh-shake'); }, 520);
    }
    function changed(what) {
      if (opts.onChange) opts.onChange(what);
    }

    function doSwap(k) {
      var s = st[k];
      s.n--;
      s.fresh = Math.min(s.fresh, s.n);
      var down = k === 'h' ? 't' : 'o';
      st[down].n += 10;
      st[down].fresh += 10;
      if (k === 'h') swapsH++;
    }
    function doTake(k) {
      var s = st[k];
      var need = B[k];
      var normal = s.n - s.fresh;
      var fromNormal = Math.min(need, normal);
      s.fresh -= need - fromNormal;
      s.n -= need;
      s.taken += need;
      took[k] = true;
    }

    var mat = {
      el: null,
      svg: root,
      counts: function () {
        return { h: st.h.n, t: st.t.n, o: st.o.n };
      },
      value: function () {
        return st.h.n * 100 + st.t.n * 10 + st.o.n;
      },
      swap: function (k) {
        if (frozen) return false;
        if (!canSwap(k)) {
          var msg;
          if (k === 'h' && hLocked) msg = 'Try taking away first.';
          else if (k === 'h' && st.h.n < 1) msg = 'There are no hundreds left to swap.';
          else if (k === 'h' && swapsH >= maxH) msg = 'One swap is enough here.';
          else if (k === 'h') msg = 'You already have ' + st.t.n + ' tens. That is enough!';
          else if (st.t.n < 1) msg = 'There are no tens to swap. Swap a hundred first!';
          else msg = 'You already have ' + st.o.n + ' ones. That is enough!';
          api.feedback(msg, 'try');
          shake(k);
          return false;
        }
        doSwap(k);
        pop[k === 'h' ? 't' : 'o'] = true;
        api.sound('pop');
        draw();
        changed('swap-' + k);
        return true;
      },
      take: function (k) {
        if (frozen || !B || took[k]) return false;
        if (st[k].n < B[k]) {
          shake(k);
          api.sound('wrong');
          var up = k === 'o' ? 'a ten' : 'a hundred';
          api.feedback('Only ' + plural(st[k].n, WORD[k][0], WORD[k][1]) + '. Not enough to take ' + plural(B[k], WORD[k][0], WORD[k][1]) + '! Swap ' + up + ' first.', 'try');
          changed('refuse-' + k);
          return false;
        }
        doTake(k);
        api.sound('click');
        draw();
        changed('take-' + k);
        if (took.h && took.t && took.o) changed('done');
        return true;
      },
      unlockH: function () {
        hLocked = false;
        if (swapBtn.h) swapBtn.h.classList.add('swh-glow');
        draw();
      },
      disable: function () {
        frozen = true;
        draw();
      },
      /** Instant: start again from a, swap one hundred (for the partition questions). */
      showSwap: function () {
        reset();
        doSwap('h');
        frozen = true;
        draw();
      },
      /** Instant: start again from a and do the whole subtraction, column by column. */
      solve: function () {
        reset();
        if (B) {
          if (st.o.n < B.o) {
            if (st.t.n < 1) doSwap('h');
            doSwap('t');
          }
          doTake('o');
          if (st.t.n < B.t) doSwap('h');
          doTake('t');
          doTake('h');
        }
        frozen = true;
        draw();
      },
    };

    // Tool buttons
    if (B) {
      ['o', 't', 'h'].forEach(function (k) {
        if (!B[k]) return;
        takeBtn[k] = el('button', { class: 'btn swh-tool swh-take', type: 'button', onclick: function () { mat.take(k); } }, 'Take away ' + plural(B[k], WORD[k][0], WORD[k][1]));
        tools.appendChild(takeBtn[k]);
      });
    }
    if (swapOK.h) {
      swapBtn.h = el('button', { class: 'btn swh-tool swh-swap', type: 'button', onclick: function () { mat.swap('h'); } }, 'Swap 1 hundred → 10 tens');
      tools.appendChild(swapBtn.h);
    }
    if (swapOK.t) {
      swapBtn.t = el('button', { class: 'btn swh-tool swh-swap', type: 'button', onclick: function () { mat.swap('t'); } }, 'Swap 1 ten → 10 ones');
      tools.appendChild(swapBtn.t);
    }

    // Click a flat (or stick) to swap it; or drag the last one into the next column.
    ['h', 't'].forEach(function (k) {
      if (!swapOK[k]) return;
      layer[k].addEventListener('click', function (e) {
        var p = e.target.closest ? e.target.closest('.swh-a, .swh-n') : null;
        if (p && !frozen) mat.swap(k);
      });
      var last = { dx: 0, dy: 0 };
      var edge = k === 'h' ? CX.t : CX.o;
      api.cleanup(
        MQ.ui.drag(root, grab[k], {
          start: function () {
            last = { dx: 0, dy: 0 };
          },
          move: function (p, dx, dy) {
            if (frozen) return;
            last = { dx: dx, dy: dy };
            grab[k].setAttribute('transform', 'translate(' + dx + ',' + dy + ')');
          },
          end: function (p) {
            grab[k].removeAttribute('transform');
            if (frozen) return;
            var click = Math.abs(last.dx) + Math.abs(last.dy) < 6;
            if (click || p.x > edge) mat.swap(k);
          },
        })
      );
    });

    draw();
    mat.el = el('div', { class: 'swh-matbox' }, el('div', { class: 'swh-mat' }, root), readout, tools.childNodes.length ? tools : null);
    return mat;
  }

  /* ---------------------------------------------------------------- *
   * Column view: a over b, a rule, and an answer row
   * ---------------------------------------------------------------- */
  function colView(a, b, ans) {
    var grid = el('div', { class: 'swh-colv', role: 'table', 'aria-label': a + ' take away ' + b });
    var cols = { h: [], t: [], o: [] };
    var ansCells = {};
    function cell(txt, cls, k) {
      var c = el('div', { class: 'swh-c ' + (cls || '') }, txt == null ? '' : String(txt));
      grid.appendChild(c);
      if (k) cols[k].push(c);
      return c;
    }
    function row(n, op, cls) {
      cell(op || '', 'swh-c-op');
      var d = digits(n);
      var out = {};
      ['h', 't', 'o'].forEach(function (k) {
        var txt = n == null ? '?' : k === 'h' ? (n >= 100 ? d.h : '') : k === 't' ? (n >= 10 ? d.t : '') : d.o;
        out[k] = cell(txt, 'swh-c-d ' + (cls || ''), k);
      });
      return out;
    }
    cell('');
    cell('H', 'swh-c-head', 'h');
    cell('T', 'swh-c-head', 't');
    cell('O', 'swh-c-head', 'o');
    row(a);
    row(b, '−');
    grid.appendChild(el('div', { class: 'swh-c-rule' }));
    if (ans !== undefined) ansCells = row(ans, '', 'swh-c-ans');
    return {
      el: el('div', { class: 'swh-colwrap' }, grid),
      mark: function (k, cls) {
        cols[k].forEach(function (c) { c.classList.add(cls); });
      },
      setAns: function (n) {
        var d = digits(n);
        ansCells.h.textContent = n >= 100 ? d.h : '';
        ansCells.t.textContent = n >= 10 ? d.t : '';
        ansCells.o.textContent = d.o;
      },
      ansCell: function (k) {
        return ansCells[k];
      },
    };
  }

  /** Working box: swap, ones, tens, hundreds, answer (and the add-back check). */
  function workingEl(a, b, withCheck) {
    var n = needs(a, b);
    var X = exchanged(a, b);
    var B = digits(b);
    var c = a - b;
    var box = el('div', { class: 'swh-work' });
    function line(name, text, cls) {
      box.appendChild(el('div', { class: 'swh-work-line ' + (cls || '') }, el('span', { class: 'swh-work-name' }, name), el('span', { html: text })));
    }
    if (n.h || n.t) line('Swap', a + ' = ' + partsText(X, true) + (n.h && n.t ? ' (swapped a hundred and a ten)' : n.h ? ' (1 hundred → 10 tens)' : ' (1 ten → 10 ones)'));
    else line('Split', a + ' = ' + partsText(digits(a), true));
    line('Ones', X.o + ' − ' + B.o + ' = <b>' + (X.o - B.o) + '</b>');
    line('Tens', X.t * 10 + ' − ' + B.t * 10 + ' = <b>' + (X.t - B.t) * 10 + '</b>');
    if (X.h || B.h) line('Hundreds', X.h * 100 + ' − ' + B.h * 100 + ' = <b>' + (X.h - B.h) * 100 + '</b>');
    var ps = [(X.h - B.h) * 100, (X.t - B.t) * 10, X.o - B.o].filter(function (v) { return v > 0; });
    line('Answer', (ps.length > 1 ? ps.join(' + ') + ' = ' : '') + '<b>' + c + '</b>', 'swh-work-total');
    if (withCheck) line('Check', c + ' + ' + b + ' = <b>' + a + '</b> ✓', 'swh-work-check');
    return box;
  }

  /* ---------------------------------------------------------------- *
   * Question generators (ranges from Textbook p.140–142, Workbook p.115–119)
   * ---------------------------------------------------------------- */
  function genPart(zero) {
    var h = U.rand(2, 9);
    var t = zero ? 0 : U.rand(1, 9);
    var o = U.rand(1, 9);
    var ask = zero ? U.pick(['t', 'h']) : 't';
    var n = h * 100 + t * 10 + o;
    return { type: 'part', n: n, ask: ask, answer: ask === 't' ? (t + 10) * 10 : (h - 1) * 100, key: 'part' + n };
  }
  /** 148 − 60: 3-digit take away a multiple of 10 with more tens than it has. */
  function genSubTens() {
    var h = U.rand(1, 6);
    var t = U.rand(0, 8);
    var a = h * 100 + t * 10 + U.rand(0, 9);
    var b = U.rand(t + 1, 9) * 10;
    return { type: 'sub', a: a, b: b, answer: a - b, key: a + '-' + b };
  }
  /** 246 − 84: 3-digit take away 2-digit, the tens are short, the ones are fine. */
  function genSub2H() {
    var h = U.rand(1, 5);
    var t = U.rand(0, 8);
    var o = U.rand(1, 9);
    var a = h * 100 + t * 10 + o;
    var b = U.rand(t + 1, 9) * 10 + U.rand(1, o);
    return { type: 'sub', a: a, b: b, answer: a - b, key: a + '-' + b };
  }
  /** 3-digit take away 3-digit with the given exchanges (+ add back to check). */
  function genSub3(cat) {
    for (;;) {
      var a = U.rand(200, 999);
      var b = U.rand(101, a - 50);
      if (Math.floor(b / 100) >= Math.floor(a / 100)) continue;
      if (category(a, b) !== cat) continue;
      if (a % 10 === 0 && b % 10 === 0) continue;
      return { type: 'sub3', a: a, b: b, answer: a - b, key: a + '-' + b };
    }
  }
  /** Sort into no swap / swap a ten / swap a hundred (Workbook p.117 Q4). */
  function genSort(cat) {
    for (;;) {
      var a = U.rand(120, 799);
      var b = Math.random() < 0.5 ? U.rand(12, 99) : U.rand(101, a - 10);
      if (b >= a - 9 || b % 10 === 0) continue;
      if (category(a, b) !== cat) continue;
      return { type: 'sort', a: a, b: b, cat: cat, answer: a - b, key: a + '-' + b };
    }
  }
  /** Take away 90: which one needs no swap? (Workbook p.118 Q9) */
  function genNinety() {
    var used = {};
    function num(nine) {
      for (;;) {
        var t = nine ? 9 : U.rand(0, 8);
        var n = U.rand(1, 8) * 100 + t * 10 + U.rand(0, 9);
        if (!used[n]) {
          used[n] = true;
          return n;
        }
      }
    }
    var right = num(true);
    var opts = U.shuffle([right, num(false), num(false)]);
    return { type: 'ninety', opts: opts, answer: right, key: 'ninety' + opts.join(',') };
  }
  /** Bolt's error hunt (Workbook p.118 Q7): partitioned, tens done the wrong way round. */
  function genHunt() {
    if (Math.random() < 0.4) return huntOf(419, 187);
    for (;;) {
      var a = U.rand(300, 799);
      var b = U.rand(101, a - 100);
      var A = digits(a);
      var B = digits(b);
      if (B.h >= A.h || A.t === 0 || A.o < B.o || A.t >= B.t || B.o === 0) continue;
      var q = huntOf(a, b);
      if (q.wrong + b > 999) continue;
      return q;
    }
  }
  function huntOf(a, b) {
    var A = digits(a);
    var B = digits(b);
    var wrong = (A.h - B.h) * 100 + (B.t - A.t) * 10 + (A.o - B.o);
    return { type: 'hunt', a: a, b: b, wrong: wrong, answer: a - b, key: 'hunt' + a + '-' + b };
  }

  var deck = null;
  function buildDeck() {
    var seen = {};
    function uniq(fn) {
      for (var i = 0; i < 300; i++) {
        var q = fn();
        if (!seen[q.key]) {
          seen[q.key] = true;
          return q;
        }
      }
      return fn();
    }
    var sortCat = U.pick(['none', 'ten', 'hundred']);
    return [
      // Level 1: swap a hundred to rewrite a number; 3-digit minus tens; "take away 90"
      uniq(function () { return genPart(false); }),
      uniq(function () { return genPart(true); }),
      uniq(genSubTens),
      uniq(genNinety),
      // Level 2: 3-digit minus 2-digit with a hundred swapped (246 − 84); sort round
      uniq(genSub2H),
      uniq(function () { return genSort(sortCat); }),
      uniq(genSub2H),
      // Level 3: 3-digit minus 3-digit with one or two swaps, then add back; Bolt's error hunt
      uniq(function () { return genSub3('hundred'); }),
      uniq(genHunt),
      uniq(function () { return genSub3('both'); }),
    ];
  }

  var SORT_LABEL = { none: 'No swap needed', ten: 'Swap 1 ten → 10 ones', hundred: 'Swap 1 hundred → 10 tens' };

  /* ---------------------------------------------------------------- *
   * Practice renderers
   * ---------------------------------------------------------------- */
  function qPrompt(html) {
    return MQ.ui.prompt('<span class="swh-q">' + html + '</span>');
  }

  /** "452 = 300 + ? + 2" */
  function renderPart(stage, api, q) {
    var n = q.n;
    var d = digits(n);
    var H = (d.h - 1) * 100;
    var T = (d.t + 10) * 10;
    var correct = q.answer;
    var box = '<span class="swh-qbox">?</span>';
    api.say(d.t === 0 ? n + ' has 0 tens. Swap a hundred for 10 tens!' : 'Swap 1 hundred for 10 tens. Fill the gap.', 'think');
    var pr = qPrompt(n + ' = ' + (q.ask === 'h' ? box : H) + ' + ' + (q.ask === 't' ? box : T) + ' + ' + d.o);
    stage.appendChild(pr);
    var mat = makeMat(api, n, { readout: 'counts', maxH: 1 });
    stage.appendChild(mat.el);
    var memo = {};
    var workBox = el('div', { class: 'swh-workbox' });
    var input = MQ.ui.numberInput({
      prefix: '? =',
      onSubmit: function (v) {
        if (v === correct) {
          input.good();
          input.disable();
          mat.disable();
          fill();
          api.check(true, 'Yes! ' + n + ' = ' + H + ' + ' + T + ' + ' + d.o + '. Same number, new parts!');
          return;
        }
        if (repeated(memo, v, api)) return;
        input.bad();
        var tag;
        var hint;
        if (q.ask === 't') {
          if (d.t === 0 && (v === 0 || v === 10)) {
            tag = 'Stuck on zero tens';
            hint = '0 tens + 10 new tens = 10 tens. How much is 10 tens?';
          } else if (v === d.t * 10) {
            tag = 'Forgot the 10 new tens';
            hint = 'That is the tens before the swap. Add the 10 new tens!';
          } else if (v === d.t + 10) {
            tag = 'Wrote tens as a count, not a value';
            hint = (d.t + 10) + ' tens is not ' + (d.t + 10) + '. How much is ' + (d.t + 10) + ' tens?';
          } else {
            tag = 'Tens part wrong after the swap';
            hint = 'The hundred flat became 10 tens. ' + d.t + ' tens + 10 tens = ? tens.';
          }
        } else if (v === d.h * 100) {
          tag = 'Forgot to reduce the hundreds';
          hint = 'One hundred went to the tens. So there is one hundred less!';
        } else if (v === d.h - 1) {
          tag = 'Wrote hundreds as a count, not a value';
          hint = (d.h - 1) + ' hundreds is not ' + (d.h - 1) + '. Write its full value.';
        } else {
          tag = 'Hundreds part wrong after the swap';
          hint = 'We swapped 1 hundred. ' + d.h + ' hundreds take away 1 hundred = ? hundreds.';
        }
        if (api.tries() >= 1) {
          hint = q.ask === 't'
            ? d.t + ' tens + 10 tens = ' + (d.t + 10) + ' tens. Count in tens: ' + (d.t + 10) + ' tens = ?'
            : d.h + ' hundreds − 1 hundred = ' + (d.h - 1) + ' hundreds. Write it in full.';
        }
        api.check(false, hint, tag);
      },
    });
    stage.appendChild(input.el);
    stage.appendChild(workBox);
    input.focus();
    function fill() {
      var bx = pr.querySelector('.swh-qbox');
      if (bx) {
        bx.textContent = String(correct);
        bx.classList.add('swh-qbox-done');
      }
    }
    api.onReveal(function () {
      mat.showSwap();
      input.setValue(String(correct));
      input.good();
      input.disable();
      fill();
      workBox.appendChild(
        el('div', { class: 'swh-work' },
          el('div', { class: 'swh-work-line' }, el('span', { class: 'swh-work-name' }, 'Hundreds'), el('span', null, d.h + ' − 1 = ' + (d.h - 1) + ' hundreds = '), el('b', null, String(H))),
          el('div', { class: 'swh-work-line' }, el('span', { class: 'swh-work-name' }, 'Tens'), el('span', null, d.t + ' + 10 = ' + (d.t + 10) + ' tens = '), el('b', null, String(T))),
          el('div', { class: 'swh-work-line swh-work-total' }, el('span', { class: 'swh-work-name' }, n), el('span', null, '= ' + H + ' + ' + T + ' + ' + d.o)))
      );
      api.feedback('Swap 1 hundred for 10 tens: ' + n + ' = ' + H + ' + ' + T + ' + ' + d.o, 'info');
    });
  }

  /** Typed subtraction with the mat as optional help; at level 3 add back to check. */
  function renderSub(stage, api, q) {
    var a = q.a;
    var b = q.b;
    var correct = q.answer;
    var withCheck = q.type === 'sub3';
    var n = needs(a, b);
    stage.appendChild(qPrompt(a + ' − ' + b + ' = ?'));
    var line;
    if (n.t && n.h) line = 'Ones first. Short of ones? Swap a ten. Short of tens? Swap a hundred!';
    else if (b % 10 === 0) line = 'Take away the tens. Not enough tens? Swap a hundred!';
    else line = 'Ones first, then tens. Not enough tens? Swap a hundred!';
    api.say(line, 'think');
    var mat = makeMat(api, a, { b: b, readout: 'counts', swapT: api.level >= 3 });
    stage.appendChild(mat.el);
    var memo = {};
    var stage2 = false;
    var workBox = el('div', { class: 'swh-workbox' });
    var input = MQ.ui.numberInput({
      prefix: a + ' − ' + b + ' =',
      onSubmit: function (v) {
        if (!stage2) {
          if (v === correct) {
            input.good();
            input.disable();
            mat.disable();
            if (!withCheck) {
              api.check(true, U.pick(['Yes! ', 'Correct! ', 'Brilliant! ']) + a + ' − ' + b + ' = ' + correct + '.');
              return;
            }
            stage2 = true;
            api.sound('pop');
            api.say('Now check it! Add ' + b + ' back on.', 'think');
            api.feedback('Yes! ' + a + ' − ' + b + ' = ' + correct + '. Now check by adding.', 'good');
            checkRow.hidden = false;
            check.focus();
            return;
          }
          if (repeated(memo, v, api)) return;
          input.bad();
          var dg = diagnoseSub(a, b, v, api.tries());
          api.check(false, dg.hint, dg.tag);
        }
      },
    });
    var check = MQ.ui.numberInput({
      prefix: correct + ' + ' + b + ' =',
      onSubmit: function (v) {
        if (v === a) {
          check.good();
          check.disable();
          api.check(true, correct + ' + ' + b + ' = ' + a + '. It matches! ' + a + ' − ' + b + ' = ' + correct + '.');
          return;
        }
        if (repeated(memo, 'c' + v, api)) return;
        check.bad();
        api.check(false, api.tries() >= 1 ? 'Add the ones, then the tens, then the hundreds. If ' + correct + ' is right you get back to ' + a + '.' : 'Add ' + correct + ' + ' + b + ' carefully. Ones first.', 'Added back wrongly');
      },
    });
    var checkRow = el('div', { class: 'swh-checkrow', hidden: true }, el('span', { class: 'swh-checklabel' }, 'Check:'), check.el);
    stage.appendChild(el('div', { class: 'swh-answers' }, input.el, checkRow));
    stage.appendChild(workBox);
    input.focus();
    api.onReveal(function () {
      mat.solve();
      input.setValue(String(correct));
      input.good();
      input.disable();
      if (withCheck) {
        checkRow.hidden = false;
        check.setValue(String(a));
        check.good();
        check.disable();
      }
      workBox.appendChild(workingEl(a, b, withCheck));
      api.feedback(walkHint(a, b).replace(' Now do ', ' Then ') + ' ' + a + ' − ' + b + ' = ' + correct, 'info');
    });
  }

  function reasons(a, b) {
    var A = digits(a);
    var B = digits(b);
    var n = needs(a, b);
    var out = [];
    out.push(n.t ? 'Ones: ' + A.o + ' take away ' + B.o + '. Not enough ones → swap a ten.' : 'Ones: ' + A.o + ' take away ' + B.o + '. Enough ones ✓');
    var tAvail = A.t - (n.t ? 1 : 0);
    out.push(n.h ? 'Tens: ' + tAvail + ' take away ' + B.t + '. Not enough tens → swap a hundred.' : 'Tens: ' + tAvail + ' take away ' + B.t + '. Enough tens ✓');
    return out;
  }

  function renderSort(stage, api, q) {
    var a = q.a;
    var b = q.b;
    var cat = q.cat;
    var A = digits(a);
    var B = digits(b);
    api.say('Before you take away: is a swap needed? Look at the ones, then the tens.', 'think');
    var cv = colView(a, b);
    var reasonBox = el('div', { class: 'swh-reasons' });
    stage.appendChild(el('div', { class: 'swh-split' }, cv.el, reasonBox));
    var ch = MQ.ui.choices(
      ['none', 'ten', 'hundred'].map(function (k) { return { label: SORT_LABEL[k], value: k }; }),
      function (v, btn) {
        if (btn.classList.contains('bad')) {
          api.feedback('You tried that one. Pick another.', 'try');
          return;
        }
        if (v === cat) {
          ch.mark(v, 'good');
          ch.disable();
          showReasons();
          api.check(true, 'Yes! ' + SORT_LABEL[cat] + '. ' + a + ' − ' + b + ' = ' + (a - b) + '.');
          return;
        }
        ch.mark(v, 'bad');
        var hint;
        var tag;
        var onesLine = 'Ones: ' + A.o + ' take away ' + B.o + '.';
        var tensLine = 'Tens: ' + A.t + ' take away ' + B.t + '.';
        if (cat === 'none') {
          tag = 'Swapped when it was not needed';
          hint = v === 'ten' ? onesLine + ' There are enough ones.' : tensLine + ' There are enough tens.';
        } else if (cat === 'ten') {
          tag = 'Did not exchange when ones were short';
          hint = onesLine + ' Not enough ones!';
          if (v === 'hundred') hint = 'The tens are fine. Look at the ones: ' + A.o + ' take away ' + B.o + '.';
        } else {
          tag = 'Did not exchange when tens were short';
          hint = tensLine + ' Not enough tens!';
          if (v === 'ten') hint = 'The ones are fine. Look at the tens: ' + A.t + ' take away ' + B.t + '.';
        }
        if (api.tries() >= 1) hint = reasons(a, b).join(' ');
        api.check(false, hint, tag);
      },
      { columns: 3 }
    );
    stage.appendChild(ch);
    function showReasons() {
      var n = needs(a, b);
      if (n.t) cv.mark('o', 'swh-short');
      if (n.h) cv.mark('t', 'swh-short');
      MQ.clear(reasonBox);
      reasons(a, b).forEach(function (r) { reasonBox.appendChild(el('div', { class: 'swh-reason' }, r)); });
    }
    api.onReveal(function () {
      ch.mark(cat, 'good');
      ch.disable();
      showReasons();
      api.feedback(SORT_LABEL[cat] + '. ' + a + ' − ' + b + ' = ' + (a - b), 'info');
    });
  }

  function renderNinety(stage, api, q) {
    var right = q.answer;
    api.say('Take away 90 from each. Which one needs NO swap?', 'think');
    stage.appendChild(qPrompt('Which one does <b>not</b> need a swap?'));
    var notes = el('div', { class: 'swh-ninety-notes' });
    var ch = MQ.ui.choices(
      q.opts.map(function (n) { return { label: n + ' − 90', value: n }; }),
      function (v, btn) {
        if (btn.classList.contains('bad')) {
          api.feedback('You tried that one. Pick another.', 'try');
          return;
        }
        if (v === right) {
          ch.mark(v, 'good');
          ch.disable();
          showNotes();
          api.check(true, 'Yes! ' + right + ' has 9 tens. 9 tens − 9 tens = 0. So taking 90 needs a swap only sometimes!');
          return;
        }
        ch.mark(v, 'bad');
        var t = digits(v).t;
        api.check(false, api.tries() >= 1 ? 'Look for the number with 9 tens. Only 9 tens is enough to take away 9 tens.' : v + ' has ' + plural(t, 'ten', 'tens') + '. ' + plural(t, 'ten', 'tens') + ' take away 9 tens: not enough. That one needs a swap.', 'Did not exchange when tens were short');
      },
      { columns: 3 }
    );
    stage.appendChild(ch);
    stage.appendChild(notes);
    function showNotes() {
      MQ.clear(notes);
      q.opts.forEach(function (n) {
        var t = digits(n).t;
        var ok = t >= 9;
        notes.appendChild(el('div', { class: 'swh-note ' + (ok ? 'swh-note-ok' : 'swh-note-swap') }, el('b', null, n + ' − 90'), el('span', null, t + ' tens − 9 tens'), el('span', null, ok ? '✓ no swap: ' + (n - 90) : '✗ swap a hundred: ' + (n - 90))));
      });
    }
    api.onReveal(function () {
      ch.mark(right, 'good');
      ch.disable();
      showNotes();
      api.feedback('Only a number with 9 tens can take away 9 tens without a swap. So: sometimes!', 'info');
    });
  }

  /** Bolt's error hunt: check, find the wrong line, then fix it. */
  function renderHunt(stage, api, q) {
    var a = q.a;
    var b = q.b;
    var A = digits(a);
    var B = digits(b);
    var wrong = q.wrong;
    var correct = q.answer;
    api.say('I worked out ' + a + ' − ' + b + ' and got ' + wrong + '. Is that right?', 'think');
    stage.appendChild(qPrompt('Bolt: ' + a + ' − ' + b + ' = ' + wrong + ' ?'));
    var work = el('div', { class: 'swh-bolt' });
    function wline(text, cls) {
      var d = el('div', { class: 'swh-bolt-line ' + (cls || '') }, text);
      work.appendChild(d);
      return d;
    }
    wline(a + ' = ' + A.h * 100 + ' + ' + A.t * 10 + ' + ' + A.o);
    wline(b + ' = ' + B.h * 100 + ' + ' + B.t * 10 + ' + ' + B.o);
    var lines = {
      h: wline(A.h * 100 + ' − ' + B.h * 100 + ' = ' + (A.h - B.h) * 100, 'swh-bolt-pick'),
      t: wline(B.t * 10 + ' − ' + A.t * 10 + ' = ' + (B.t - A.t) * 10, 'swh-bolt-pick'),
      o: wline(A.o + ' − ' + B.o + ' = ' + (A.o - B.o), 'swh-bolt-pick'),
    };
    wline((A.h - B.h) * 100 + ' + ' + (B.t - A.t) * 10 + ' + ' + (A.o - B.o) + ' = ' + wrong, 'swh-bolt-sum');
    wline('Check: ' + wrong + ' + ' + b + ' = ' + (wrong + b), 'swh-bolt-check');
    var side = el('div', { class: 'swh-side' });
    stage.appendChild(el('div', { class: 'swh-split' }, work, side));
    var step = 1;
    var memo = {};
    var input = null;
    var picked = {};

    // Step 1: does the check match?
    side.appendChild(el('div', { class: 'swh-side-title' }, 'Bolt started with ' + a + '. His check gave ' + (wrong + b) + '.'));
    var ch = MQ.ui.choices(
      [{ label: 'His answer is right', value: 'yes' }, { label: 'His answer is wrong', value: 'no' }],
      function (v, btn) {
        if (btn.classList.contains('bad')) {
          api.feedback('You tried that one. Pick the other.', 'try');
          return;
        }
        if (v === 'no') {
          ch.mark(v, 'good');
          ch.disable();
          api.sound('correct');
          api.feedback('Yes! ' + (wrong + b) + ' is not ' + a + '. The check does not match.', 'good');
          stepTwo();
          return;
        }
        ch.mark(v, 'bad');
        api.check(false, 'Adding back should give ' + a + '. Bolt got ' + (wrong + b) + '. Do they match?', 'Did not check with addition');
      },
      { columns: 1 }
    );
    side.appendChild(ch);

    function stepTwo() {
      step = 2;
      MQ.clear(side);
      side.appendChild(el('div', { class: 'swh-side-title' }, 'Click the line Bolt got wrong.'));
      api.say('My check did not match! Which line did I get wrong?', 'think');
      work.classList.add('swh-bolt-picking');
      ['h', 't', 'o'].forEach(function (k) {
        lines[k].setAttribute('role', 'button');
        lines[k].setAttribute('tabindex', '0');
        lines[k].addEventListener('click', function () { pickLine(k); });
        lines[k].addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            pickLine(k);
          }
        });
      });
    }
    function pickLine(k) {
      if (step !== 2) return;
      if (picked[k]) {
        api.feedback('You tried that line. Pick another.', 'try');
        return;
      }
      if (k === 't') {
        lines.t.classList.add('swh-bolt-bad');
        api.sound('correct');
        api.feedback('Yes! ' + a + ' has ' + A.t * 10 + ', not ' + B.t * 10 + '. Bolt took ' + A.t * 10 + ' from ' + B.t * 10 + ' — the wrong way round.', 'good');
        stepThree();
        return;
      }
      picked[k] = true;
      lines[k].classList.add('swh-bolt-fine');
      api.check(false, k === 'h' ? A.h * 100 + ' − ' + B.h * 100 + ' is the right way round. Look at the tens line.' : A.o + ' − ' + B.o + ' is fine. Look at the tens line: which number is from ' + a + '?', 'Missed the wrong-way-round tens');
    }
    function stepThree() {
      step = 3;
      work.classList.remove('swh-bolt-picking');
      MQ.clear(side);
      api.say('Help me fix it. Swap a hundred for 10 tens first!', 'think');
      side.appendChild(el('div', { class: 'swh-side-title' }, 'What is the right answer?'));
      input = MQ.ui.numberInput({
        prefix: a + ' − ' + b + ' =',
        onSubmit: function (v) {
          if (v === correct) {
            input.good();
            input.disable();
            side.appendChild(workingEl(a, b, true));
            api.check(true, 'Yes! ' + a + ' − ' + b + ' = ' + correct + '. Check: ' + correct + ' + ' + b + ' = ' + a + ' ✓');
            return;
          }
          if (repeated(memo, v, api)) return;
          input.bad();
          var dg = diagnoseSub(a, b, v, api.tries());
          api.check(false, dg.hint, dg.tag);
        },
      });
      side.appendChild(input.el);
      input.focus();
    }

    api.onReveal(function () {
      ch.mark('no', 'good');
      ch.disable();
      step = 4;
      work.classList.remove('swh-bolt-picking');
      lines.t.classList.add('swh-bolt-bad');
      MQ.clear(side);
      side.appendChild(el('div', { class: 'swh-side-title' }, 'Bolt did ' + B.t * 10 + ' − ' + A.t * 10 + '. Swap a hundred instead:'));
      side.appendChild(workingEl(a, b, true));
      api.feedback('The tens were the wrong way round. Swap: ' + a + ' = ' + partsText(exchanged(a, b), true) + '. ' + a + ' − ' + b + ' = ' + correct, 'info');
    });
  }

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */
  MQ.register('swap-a-hundred', {
    learn: [
      // 1. Exchange: 235, 452, 309
      function (stage, api) {
        var list = [235, 452, 309];
        var after = {
          235: 'Same number, new parts! 100 + 130 + 5 is still 235.',
          452: '4 hundreds became 3. 5 tens became 15 tens.',
          309: '0 tens became 10 tens! 309 = 200 + 100 + 9.',
        };
        var i = 0;
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Swap 1 hundred for 10 tens', 'Click a hundred flat (or drag it to the Tens).'));
        var holder = el('div', { class: 'swh-qwrap' });
        stage.appendChild(holder);
        function show() {
          MQ.clear(holder);
          var n = list[i];
          api.say(n === 309 ? '309 has 0 tens. Swap a hundred and see!' : i === 0 ? '1 hundred flat is the same as 10 tens. Swap one!' : 'Now ' + n + '. Swap a hundred!');
          var nextBtn = el('button', { class: 'btn swh-tool', type: 'button', hidden: true, onclick: function () { i++; show(); } }, i < list.length - 1 ? 'Try ' + list[i + 1] + ' ▶' : '');
          var mat = makeMat(api, n, {
            readout: 'parts',
            maxH: 1,
            onChange: function (w) {
              if (w !== 'swap-h') return;
              mat.disable();
              api.say(after[n], 'cheer');
              var d = digits(n);
              api.feedback(n + ' = ' + (d.h - 1) * 100 + ' + ' + (d.t + 10) * 10 + ' + ' + d.o, 'good');
              if (i < list.length - 1) nextBtn.hidden = false;
              else api.unlockNext();
            },
          });
          holder.appendChild(mat.el);
          holder.appendChild(nextBtn);
        }
        show();
      },
      // 2. 246 − 84: the mat refuses 4 tens − 8 tens until a swap
      function (stage, api) {
        api.lockNext();
        api.say('246 − 84. Take away the ones first, then the tens.');
        stage.appendChild(MQ.ui.lesson('246 − 84', 'Click the buttons to take away 84.'));
        var result = el('div', { class: 'swh-pv' });
        var mat = makeMat(api, 246, {
          b: 84,
          readout: 'counts',
          hLocked: true,
          onChange: function (w) {
            if (w === 'take-o') api.say('6 − 4 = 2 ones. Now the tens.', 'happy');
            else if (w === 'refuse-t') {
              mat.unlockH();
              api.say('Only 4 tens! I can\'t take 8 tens. Swap a hundred for 10 tens.', 'think');
            } else if (w === 'swap-h') {
              api.say('Now there are 14 tens. Take away 8 tens!', 'happy');
              api.feedback('1 hundred → 10 tens. 4 tens + 10 tens = 14 tens.', 'good');
            } else if (w === 'take-t' && mat.counts().o === 6) api.say('14 − 8 = 6 tens. Now the ones.', 'happy');
            else if (w === 'done') {
              var c = mat.counts();
              MQ.clear(result);
              [[c.h, 'hundred'], [c.t, 'tens'], [c.o, 'ones']].forEach(function (p) {
                result.appendChild(el('div', { class: 'swh-pv-box' }, el('b', null, String(p[0])), el('span', null, p[1])));
              });
              result.appendChild(el('div', { class: 'swh-pv-eq' }, '= ' + mat.value()));
              api.say('246 − 84 = 162. The swap saved the day!', 'cheer');
              api.feedback('246 − 84 = 162', 'good');
              api.unlockNext();
            }
          },
        });
        stage.appendChild(mat.el);
        stage.appendChild(result);
      },
      // 3. Spot Bolt's mistake: 246 − 84 = 242
      function (stage, api) {
        api.lockNext();
        api.say('I did 246 − 84 and got 242. Oops! In which column did I take away the wrong way round?', 'think');
        stage.appendChild(MQ.ui.lesson('Spot my mistake', null));
        var cv = colView(246, 84, 242);
        var side = el('div', { class: 'swh-side' });
        stage.appendChild(el('div', { class: 'swh-split' }, cv.el, side));
        var below = el('div', { class: 'swh-qwrap' });
        var tried = {};
        var ch = MQ.ui.choices(
          [{ label: 'Hundreds', value: 'h' }, { label: 'Tens', value: 't' }, { label: 'Ones', value: 'o' }],
          function (v) {
            if (v === 't') {
              ch.mark('t', 'good');
              ch.disable();
              api.sound('correct');
              cv.mark('t', 'swh-short');
              cv.ansCell('t').classList.add('swh-c-wrong');
              cv.ansCell('h').classList.add('swh-c-wrong');
              api.say('Yes! I did 8 − 4. But it is 4 tens take away 8 tens. I needed a swap!', 'cheer');
              MQ.clear(side);
              side.appendChild(workingEl(246, 84, true));
              side.appendChild(el('div', { class: 'swh-reason swh-reason-bad' }, 'My answer: 242 + 84 = 326 ✗ not 246'));
              var mat = makeMat(api, 246, { b: 84, readout: 'counts' });
              mat.solve();
              below.appendChild(mat.el);
              api.feedback('Swap 1 hundred → 10 tens. 14 tens − 8 tens = 6 tens. So 246 − 84 = 162, not 242.', 'good');
              api.unlockNext();
              return;
            }
            ch.mark(v, 'bad');
            api.sound('wrong');
            if (tried[v]) return;
            tried[v] = true;
            api.feedback(v === 'o' ? 'Ones: 6 − 4 = 2. That is the right way round.' : 'Hundreds: 2 − 0. That is the right way round. Look at the tens: 4 and 8.', 'try');
          },
          { columns: 3 }
        );
        side.appendChild(el('div', { class: 'swh-side-title' }, 'Which column?'));
        side.appendChild(ch);
        stage.appendChild(below);
      },
    ],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'part') return renderPart(stage, api, q);
        if (q.type === 'sub' || q.type === 'sub3') return renderSub(stage, api, q);
        if (q.type === 'ninety') return renderNinety(stage, api, q);
        if (q.type === 'sort') return renderSort(stage, api, q);
        return renderHunt(stage, api, q);
      },
      // Exposed for offline deck tests only (tools never call this in the page).
      _test: { buildDeck: buildDeck, needs: needs, category: category, exchanged: exchanged, smallFromLarge: smallFromLarge, diagnoseSub: diagnoseSub },
    },
  });

  /* ---------------------------------------------------------------- *
   * Styles
   * ---------------------------------------------------------------- */
  var css = [
    '.swh-qwrap{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.swh-matbox{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.swh-mat{width:100%;max-width:820px;display:flex;justify-content:center}',
    '.swh-mat-svg{display:block;width:100%;max-width:820px;height:auto;touch-action:none;user-select:none}',
    '.swh-head{stroke:none}',
    '.swh-head-h{fill:#e3f4e8}.swh-head-t{fill:#e5efff}.swh-head-o{fill:#fff1dc}',
    '.swh-head-text{font-size:18px;font-weight:800;fill:var(--ink)}',
    '.swh-cell{fill:#fff;stroke:var(--line);stroke-width:2}',
    '.swh-rlabel{font-size:30px;font-weight:800;fill:#2a64ad}',
    '.swh-body{stroke-width:1.5}',
    '.swh-lines{stroke-width:1;fill:none;opacity:.55}',
    '.swh-a .swh-body{fill:#9cc8ff;stroke:#2a64ad}.swh-a .swh-lines{stroke:#2a64ad}',
    '.swh-n .swh-body{fill:#9fe0b4;stroke:#1f8a52}.swh-n .swh-lines{stroke:#1f8a52}',
    '.swh-taken{opacity:.28;pointer-events:none}',
    '.swh-taken .swh-body{fill:#eee;stroke:#999;stroke-dasharray:3 2}.swh-taken .swh-lines{stroke:#999}',
    '.swh-slash{stroke:#d1495b;stroke-width:3;stroke-linecap:round}',
    '.swh-can .swh-a,.swh-can .swh-n{cursor:pointer}',
    '.swh-grab.swh-can .swh-body{stroke-width:3}',
    '.swh-can .swh-a:hover,.swh-can .swh-n:hover{filter:brightness(1.08)}',
    '.swh-piece{transform-box:fill-box;transform-origin:center}',
    '.swh-pop{animation:swh-pop .6s ease}',
    '@keyframes swh-pop{0%{transform:scale(.2);opacity:0}70%{transform:scale(1.15);opacity:1}100%{transform:scale(1)}}',
    '.swh-shake{animation:swh-shake .5s ease}',
    '@keyframes swh-shake{20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(5px)}}',
    '.swh-shake .swh-cell{stroke:#d1495b;stroke-width:4}',
    '.swh-readout{font-size:1.35rem;font-weight:800;min-height:1.5em;text-align:center}',
    '.swh-ph{color:#1f8a52}.swh-pt{color:#2a64ad}.swh-po{color:#b35f0e}',
    '.swh-tools{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}',
    '.swh-tool{background:#fff;color:var(--ink);border:3px solid var(--line);font-size:1rem}',
    '.swh-tool:hover:not(:disabled){border-color:var(--accent)}',
    '.swh-tool:disabled{opacity:.6;cursor:default}',
    '.swh-take{border-color:#d1495b;background:#fff0f1}',
    '.swh-swap{border-color:#e0a100;background:#fff7dc}',
    '.swh-glow{animation:swh-glow 1.3s ease-in-out infinite}',
    '@keyframes swh-glow{50%{box-shadow:0 0 0 6px rgba(255,183,3,.45)}}',
    '.swh-tool[hidden],.swh-checkrow[hidden]{display:none}',
    '.swh-q{white-space:nowrap;font-size:1.8rem}',
    '.swh-qbox{display:inline-block;min-width:1.8em;border:3px dashed var(--accent);border-radius:10px;padding:0 6px;color:var(--ink-soft)}',
    '.swh-qbox-done{border-style:solid;border-color:var(--good);color:var(--good)}',
    '.swh-answers{display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;justify-content:center}',
    '.swh-checkrow{display:flex;gap:8px;align-items:center}',
    '.swh-checklabel{font-weight:800;font-size:1.2rem;color:#1f8a52}',
    '.swh-pv{display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;min-height:64px}',
    '.swh-pv-box{display:flex;flex-direction:column;align-items:center;background:#fff;border:3px solid var(--line);border-radius:12px;padding:4px 14px;min-width:80px}',
    '.swh-pv-box b{font-size:1.8rem;line-height:1.1}',
    '.swh-pv-box span{font-size:.9rem;color:var(--ink-soft);font-weight:700}',
    '.swh-pv-eq{font-size:2rem;font-weight:800;color:var(--good)}',
    '.swh-split{display:flex;flex-wrap:wrap;gap:22px;align-items:center;justify-content:center;width:100%}',
    '.swh-side{display:flex;flex-direction:column;gap:10px;align-items:center;min-width:240px;max-width:100%}',
    '.swh-side-title{font-size:1.2rem;font-weight:800;text-align:center;max-width:380px}',
    '.swh-colwrap{background:#fff;border:3px solid var(--line);border-radius:16px;padding:8px 14px;max-width:100%}',
    '.swh-colv{display:grid;grid-template-columns:40px repeat(3,56px);align-items:center;font-weight:800}',
    '.swh-c{height:48px;line-height:48px;text-align:center;font-size:2rem;border-radius:8px}',
    '.swh-c-head{font-size:1rem;color:var(--ink-soft);height:26px;line-height:26px}',
    '.swh-c-op{color:var(--ink-soft)}',
    '.swh-c-rule{grid-column:2 / -1;border-top:3px solid var(--ink);margin:3px 0}',
    '.swh-c-ans{color:#2a64ad}',
    '.swh-short{background:#ffe3e6}',
    '.swh-c-wrong{color:#d1495b;text-decoration:line-through}',
    '.swh-reasons{display:flex;flex-direction:column;gap:6px;min-width:220px}',
    '.swh-reasons:empty{display:none}',
    '.swh-reason{font-size:1.1rem;font-weight:700;background:var(--info-bg);border:2px solid var(--line);border-radius:10px;padding:6px 10px}',
    '.swh-reason-bad{color:#b02a3c}',
    '.swh-work{display:flex;flex-direction:column;gap:4px;background:var(--info-bg);border:2px solid var(--line);border-radius:12px;padding:8px 14px;font-size:1.15rem}',
    '.swh-work-line{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}',
    '.swh-work-name{min-width:84px;color:var(--ink-soft);font-weight:800}',
    '.swh-work-total{border-top:2px solid var(--line);padding-top:4px}',
    '.swh-work-check{color:#1f8a52;font-weight:700}',
    '.swh-workbox:empty{display:none}',
    '.swh-ninety-notes{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}',
    '.swh-ninety-notes:empty{display:none}',
    '.swh-note{display:flex;flex-direction:column;align-items:center;gap:2px;border:3px solid var(--line);border-radius:12px;padding:6px 12px;background:#fff;font-size:1.05rem}',
    '.swh-note-ok{border-color:var(--good);background:var(--good-bg)}',
    '.swh-note-swap{border-color:#e0a100;background:#fff7dc}',
    '.swh-bolt{display:flex;flex-direction:column;gap:4px;background:#fff;border:3px solid var(--line);border-radius:14px;padding:10px 16px;font-size:1.35rem;font-weight:700}',
    '.swh-bolt-line{padding:2px 10px;border-radius:8px;border:2px solid transparent}',
    '.swh-bolt-sum{border-top:2px solid var(--line);border-radius:0;font-weight:800}',
    '.swh-bolt-check{color:#b02a3c}',
    '.swh-bolt-picking .swh-bolt-pick{cursor:pointer;border-color:#e0a100;background:#fff7dc}',
    '.swh-bolt-picking .swh-bolt-pick:hover{background:#ffeeb3}',
    '.swh-bolt-fine{border-color:var(--line)!important;background:#f1f1f1!important;color:var(--ink-soft)}',
    '.swh-bolt-bad{border-color:#d1495b!important;background:#ffe3e6!important;text-decoration:line-through}',
    '@media (max-width:640px){.swh-q{font-size:1.4rem}.swh-colv{grid-template-columns:32px repeat(3,46px)}.swh-bolt{font-size:1.15rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'swap-a-hundred' }, css));
})();

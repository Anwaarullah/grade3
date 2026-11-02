/* Fraction Strip Sums — add and subtract same-denominator fractions on strips, estimating
 * against a gold half-way line first (Unit 12.3). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  var NAMES = { 1: 'wholes', 2: 'halves', 3: 'thirds', 4: 'quarters', 5: 'fifths', 10: 'tenths' };
  function pname(d) {
    return NAMES[d] || 'pieces';
  }

  /* ---------- fraction text ---------- */
  function fr(n, d, cls) {
    return '<span class="fss-frac' + (cls ? ' ' + cls : '') + '"><span class="fss-fn">' + n + '</span><span class="fss-fd">' + d + '</span></span>';
  }
  // A value written by a child or by Bolt: d === 1 means a whole number (0 or 1).
  function frOrWhole(n, d, cls) {
    return d === 1 ? '<span class="fss-whole' + (cls ? ' ' + cls : '') + '">' + n + '</span>' : fr(n, d, cls);
  }
  function opSign(op) {
    return '<span class="fss-op">' + (op === '-' ? '−' : op) + '</span>';
  }
  // e.g. "4/10 + 3/10 = 7/10" (with extra "= 1" / "= ½" when it helps)
  function sentenceHTML(a, op, b, d, t, from1) {
    var h = (from1 ? '<span class="fss-whole">1</span>' : fr(a, d)) + opSign(op) + fr(b, d) + opSign('=');
    if (from1) h += fr(d, d, 'fss-soft') + opSign(op) + fr(b, d) + opSign('=');
    h += fr(t, d, 'fss-ans');
    if (t === d) h += opSign('=') + '<span class="fss-whole fss-ans">1</span>';
    else if (t === 0) h += opSign('=') + '<span class="fss-whole fss-ans">0</span>';
    else if (2 * t === d) h += opSign('=') + fr(1, 2, 'fss-ans');
    return h;
  }

  /* ---------- the strip (exactly to scale: equal pieces of one 600-unit whole) ---------- */
  var SX = 20;
  var SW = 600;
  var SY = 46;
  var SH = 66;
  function makeStrip(d, opts) {
    opts = opts || {};
    var root = S('svg', { viewBox: '0 0 640 164', width: 640, height: 164, class: 'fss-strip', 'data-d': d });
    var gPieces = S('g', { class: 'fss-pieces' });
    var gTop = S('g', { class: 'fss-top' });
    root.appendChild(gPieces);
    var pw = SW / d;
    var pieces = [];
    for (var i = 0; i < d; i++) {
      (function (i) {
        var x = SX + i * pw;
        var g = S('g', { class: 'fss-pg', 'data-idx': i });
        g.appendChild(S('rect', { x: x, y: SY, width: pw, height: SH, class: 'fss-piece' }));
        g.appendChild(S('line', { x1: x + 10, y1: SY + 10, x2: x + pw - 10, y2: SY + SH - 10, class: 'fss-xl' }));
        g.appendChild(S('line', { x1: x + pw - 10, y1: SY + 10, x2: x + 10, y2: SY + SH - 10, class: 'fss-xl' }));
        var num = S('text', { x: x + pw / 2, y: SY + SH / 2 + 8, class: 'fss-pnum', 'text-anchor': 'middle' });
        g.appendChild(num);
        if (opts.onPiece) {
          g.classList.add('fss-click');
          g.addEventListener('click', function () {
            opts.onPiece(i);
          });
        }
        gPieces.appendChild(g);
        pieces.push({ g: g, num: num, color: '', crossed: false });
      })(i);
    }
    root.appendChild(S('rect', { x: SX, y: SY, width: SW, height: SH, class: 'fss-outline' }));
    // gold half-way line and the 0, ½, 1 labels underneath
    root.appendChild(S('line', { x1: SX + SW / 2, y1: SY - 4, x2: SX + SW / 2, y2: SY + SH + 10, class: 'fss-half' }));
    root.appendChild(S('text', { x: SX, y: SY + SH + 30, class: 'fss-end', 'text-anchor': 'middle' }, '0'));
    root.appendChild(S('text', { x: SX + SW, y: SY + SH + 30, class: 'fss-end', 'text-anchor': 'middle' }, '1'));
    var hg = S('g', { class: 'fss-halflab' });
    hg.appendChild(S('text', { x: SX + SW / 2, y: SY + SH + 25, 'text-anchor': 'middle' }, '1'));
    hg.appendChild(S('line', { x1: SX + SW / 2 - 7, y1: SY + SH + 29, x2: SX + SW / 2 + 7, y2: SY + SH + 29 }));
    hg.appendChild(S('text', { x: SX + SW / 2, y: SY + SH + 44, 'text-anchor': 'middle' }, '2'));
    root.appendChild(hg);
    root.appendChild(gTop);

    function paint(i) {
      var p = pieces[i];
      p.g.setAttribute('class', 'fss-pg' + (opts.onPiece ? ' fss-click' : '') + (p.color ? ' fss-c-' + p.color : '') + (p.crossed ? ' fss-crossed' : ''));
      p.g.setAttribute('data-color', p.color || 'none');
      p.g.setAttribute('data-crossed', p.crossed ? '1' : '0');
    }
    var api = {
      svg: root,
      d: d,
      pieces: pieces,
      color: function (i, c) {
        pieces[i].color = c || '';
        paint(i);
      },
      cross: function (i, on) {
        pieces[i].crossed = !!on;
        paint(i);
      },
      colorRange: function (from, n, c) {
        for (var k = from; k < from + n && k < d; k++) api.color(k, c);
      },
      clear: function () {
        for (var k = 0; k < d; k++) {
          pieces[k].color = '';
          pieces[k].crossed = false;
          pieces[k].num.textContent = '';
          paint(k);
        }
        while (gTop.firstChild) gTop.removeChild(gTop.firstChild);
      },
      crossedCount: function () {
        return pieces.filter(function (p) {
          return p.crossed;
        }).length;
      },
      number: function (from, n) {
        for (var k = 0; k < n; k++) pieces[from + k].num.textContent = String(k + 1);
      },
      // bracket above pieces [from, from+n) with an optional stacked fraction label
      bracket: function (from, n, cls, label) {
        if (n <= 0) return;
        var x1 = SX + from * pw + 4;
        var x2 = SX + (from + n) * pw - 4;
        var g = S('g', { class: 'fss-br ' + (cls || '') });
        g.appendChild(S('path', { d: 'M' + x1 + ' ' + (SY - 4) + ' V' + (SY - 14) + ' H' + x2 + ' V' + (SY - 4) }));
        if (label) g.appendChild(S('text', { x: (x1 + x2) / 2, y: SY - 20, 'text-anchor': 'middle' }, label));
        gTop.appendChild(g);
      },
    };
    return api;
  }

  /* ---------- number sentence with answer boxes ----------
   * parts: {f:[n,d]} fixed fraction, {whole:n}, {op:'+'}, {box:true, d:d, editDen:bool}
   */
  function sentence(parts, opts) {
    opts = opts || {};
    var row = el('div', { class: 'fss-sent' });
    var boxes = [];
    var all = [];
    parts.forEach(function (p) {
      if (p.op) row.appendChild(el('span', { class: 'fss-op', html: p.op === '-' ? '−' : p.op }));
      else if (p.whole != null) row.appendChild(el('span', { class: 'fss-whole', text: String(p.whole) }));
      else if (p.f) row.appendChild(el('span', { html: fr(p.f[0], p.f[1]) }));
      else if (p.box) {
        var idx = boxes.length;
        var num = el('input', { class: 'fss-in fss-num', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: 2, 'aria-label': 'Top number', 'data-idx': idx, placeholder: '?' });
        var den;
        if (p.editDen) {
          den = el('input', { class: 'fss-in fss-den', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: 2, 'aria-label': 'Bottom number', 'data-idx': idx });
          den.value = String(p.d);
        } else {
          den = el('span', { class: 'fss-fixden', text: String(p.d) });
        }
        var box = el('span', { class: 'fss-fbox' }, num, el('span', { class: 'fss-bar' }), den);
        row.appendChild(box);
        var rec = { num: num, den: den, d: p.d, edit: !!p.editDen, box: box };
        boxes.push(rec);
        all.push(num);
        if (p.editDen) all.push(den);
      }
    });
    var check = el('button', { class: 'btn btn-check fss-check', type: 'button' }, opts.button || 'Check');
    row.appendChild(check);
    function submit() {
      if (check.disabled) return;
      if (opts.onSubmit) opts.onSubmit(api.read());
    }
    check.addEventListener('click', submit);
    all.forEach(function (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });
      inp.addEventListener('input', function () {
        inp.value = inp.value.replace(/[^0-9]/g, '');
        if (opts.onInput) opts.onInput(api.read());
      });
    });
    var api = {
      el: row,
      boxes: boxes,
      // each box -> {n, d}; n/d are integers, null when empty. Empty editable bottom = whole number.
      read: function () {
        return boxes.map(function (b) {
          var n = b.num.value.trim() === '' ? null : parseInt(b.num.value, 10);
          var d = b.edit ? (b.den.value.trim() === '' ? 1 : parseInt(b.den.value, 10)) : b.d;
          return { n: n, d: d };
        });
      },
      set: function (i, n, d) {
        boxes[i].num.value = String(n);
        if (boxes[i].edit) boxes[i].den.value = String(d);
      },
      disable: function () {
        all.forEach(function (i) {
          i.disabled = true;
        });
        check.disabled = true;
      },
      enable: function () {
        all.forEach(function (i) {
          i.disabled = false;
        });
        check.disabled = false;
      },
      mark: function (kind) {
        boxes.forEach(function (b) {
          b.box.classList.remove('fss-good', 'fss-bad');
          if (kind) b.box.classList.add('fss-' + kind);
        });
      },
      focus: function () {
        if (!all.length) return;
        setTimeout(function () {
          try {
            all[0].focus({ preventScroll: true });
          } catch (e) {
            all[0].focus();
          }
        }, 30);
      },
    };
    return api;
  }

  /* ---------- maths ---------- */
  function result(op, a, b) {
    return op === '+' ? a + b : a - b;
  }
  function side(t, d) {
    // where t/d sits against one half
    return 2 * t < d ? 'lt' : 2 * t === d ? 'eq' : 'gt';
  }
  var SIDE_TEXT = { lt: 'less than ½', eq: 'equal to ½', gt: 'more than ½' };

  /**
   * Judge a typed answer n/dd for "a op b" (all over d). from1: the sum is 1 − b/d (a = d).
   * Returns {ok} or {ok:false, hint, tag} or {slip: message} for non-maths slips.
   */
  function judge(q, n, dd, tries) {
    var a = q.a;
    var b = q.b;
    var d = q.d;
    var t = result(q.op, a, b);
    var nm = pname(d);
    if (n == null || isNaN(n)) return { slip: 'Type the top number first.' };
    if (dd == null || isNaN(dd)) return { slip: 'Type the bottom number too.' };
    if (dd === 0 && n !== 0) return { slip: 'The bottom number cannot be 0. It tells us the size of the pieces.' };
    if (dd === 0 && n === 0) {
      return { ok: false, tag: 'Wrote 0/0 for nothing left', hint: 'Nothing is left: that is 0 ' + nm + '. Write 0 on top and keep ' + d + ' on the bottom.' };
    }
    if (n * d === t * dd) return { ok: true };
    var strong = tries >= 1;
    if (q.op === '+' && n === a + b && dd === 2 * d) {
      return { ok: false, tag: 'Added the bottom numbers', hint: 'The pieces are still ' + nm + ', so the bottom number stays ' + d + '. Only the top number changes.' + (strong ? ' ' + a + ' + ' + b + ' = ' + t + '.' : '') };
    }
    if (q.from1) {
      var notWhole = dd !== d || n === b || n === 0 || n === 1;
      return { ok: false, tag: notWhole ? 'Forgot 1 is a whole strip' : 'Counted the pieces wrongly', hint: '1 whole strip is ' + d + '/' + d + '. Take ' + b + ' ' + (b === 1 ? 'piece' : 'pieces') + ' away.' + (strong ? ' ' + d + ' − ' + b + ' = ' + t + ', so ' + t + ' ' + nm + ' are left.' : '') };
    }
    if (q.op === '-' && b === 0) {
      return { ok: false, tag: 'Thinks taking away 0 leaves 0', hint: 'We take away 0 pieces, so nothing goes. All ' + a + ' ' + nm + ' are still there!' };
    }
    if (q.op === '-' && n === a + b && dd === d) {
      return { ok: false, tag: 'Added instead of taking away', hint: 'This is a take-away. Count the pieces that are NOT crossed out.' + (strong ? ' ' + a + ' − ' + b + ' = ' + t + '.' : '') };
    }
    if (dd !== d && n === t) {
      return { ok: false, tag: 'Changed the bottom number', hint: 'The pieces are still ' + nm + '. Keep ' + d + ' on the bottom.' };
    }
    if (q.op === '+') {
      return { ok: false, tag: 'Counted the pieces wrongly', hint: 'Count all the coloured pieces, orange and blue.' + (strong ? ' ' + a + ' + ' + b + ' = ' + t + ' ' + nm + '.' : '') };
    }
    return { ok: false, tag: 'Counted the pieces wrongly', hint: 'Count the pieces that are left, not the crossed-out ones.' + (strong ? ' ' + a + ' − ' + b + ' = ' + t + ' ' + nm + '.' : '') };
  }

  /* ---------- deck ---------- */
  // Calculations for "tick or correct": [a, op, b, d, shownN, shownD] (shownD 1 = whole number)
  var SPOT = [
    [5, '+', 4, 10, 9, 10],
    [3, '-', 1, 4, 1, 2],
    [2, '+', 3, 5, 1, 1],
    [6, '-', 1, 10, 5, 10],
    [1, '+', 1, 3, 2, 3],
    [7, '-', 2, 10, 1, 2],
    [5, '-', 1, 5, 3, 5],
    [10, '-', 3, 10, 1, 10],
    [2, '+', 2, 5, 4, 10],
    [4, '-', 1, 4, 2, 4],
    [3, '+', 3, 10, 6, 20],
    [3, '-', 0, 3, 0, 3],
  ];
  var SPOT_ZERO = [
    [3, '-', 0, 3, 0, 3],
    [4, '-', 0, 4, 4, 4],
    [5, '-', 5, 5, 0, 5],
    [3, '-', 0, 3, 3, 3],
  ];
  function spotItem(arr) {
    return { a: arr[0], op: arr[1], b: arr[2], d: arr[3], sn: arr[4], sd: arr[5] };
  }

  function buildDeck() {
    var used = {};
    function key(op, a, b, d) {
      return op + a + '/' + d + ' ' + b;
    }
    function fresh(gen) {
      for (var k = 0; k < 200; k++) {
        var q = gen();
        var kk = key(q.op, q.a, q.b, q.d);
        if (!used[kk]) {
          used[kk] = true;
          return q;
        }
      }
      throw new Error('fss: could not make a fresh question');
    }
    function addQ(type, d, maxTotal) {
      return fresh(function () {
        var a = U.rand(1, maxTotal - 1);
        var b = U.rand(1, maxTotal - a);
        return { type: type, op: '+', a: a, b: b, d: d };
      });
    }
    var q = [];
    var ds = U.shuffle([3, 4, 5]);
    // Level 1 (questions 1-4): add on a strip; read an addition from a tenths strip
    q.push(addQ('add', ds[0], ds[0]));
    q.push(addQ('add', ds[1], ds[1]));
    q.push(addQ('readadd', 10, 9));
    q.push(addQ('add', ds[2], ds[2]));
    // Level 2 (questions 5-7): estimate first, then add / subtract; read a crossed-out strip
    var dAdd = U.pick([10, 10, 5]);
    q.push(addQ('est', dAdd, dAdd));
    var dSub = U.pick([5, 10]);
    q.push(
      fresh(function () {
        var a = U.rand(2, dSub);
        var b = U.rand(1, a);
        return { type: 'est', op: '-', a: a, b: b, d: dSub };
      })
    );
    q.push(
      fresh(function () {
        var a = U.rand(4, 10);
        var b = U.rand(1, a - 1);
        return { type: 'readsub', op: '-', a: a, b: b, d: 10 };
      })
    );
    // Level 3 (questions 8-10): one whole minus; a pair that makes 1; tick or correct
    var d1 = U.pick([4, 10, 5]);
    q.push(
      fresh(function () {
        var b = Math.random() < 0.2 ? d1 : U.rand(1, d1 - 1);
        return { type: 'from1', from1: true, op: '-', a: d1, b: b, d: d1 };
      })
    );
    var dp = U.pick([4, 5]);
    // avoid repeating an earlier addition with the same pair (e.g. 1/4 + 3/4)
    var pairOk = U.range(1, dp - 1).filter(function (k) {
      return !q.some(function (x) {
        return x.op === '+' && x.d === dp && ((x.a === k && x.b === dp - k) || (x.b === k && x.a === dp - k));
      });
    });
    var p = U.pick(pairOk.length ? pairOk : U.range(1, dp - 1));
    q.push({ type: 'pair', op: '+', d: dp, a: p, b: dp - p });
    var hasZero = q.some(function (x) {
      return x.op === '-' && (x.a === x.b || x.b === 0);
    });
    q.push({ type: 'spot', item: spotItem(U.pick(hasZero ? SPOT : SPOT_ZERO)) });
    return q;
  }

  var deck = null;

  /* ---------- learn screens ---------- */
  function learnAdd(stage, api) {
    api.lockNext();
    api.say('Let\'s add tenths! Click the orange tile 4 times.');
    stage.appendChild(MQ.ui.lesson('Adding tenths', 'The gold line shows half of the strip.'));
    var st = makeStrip(10);
    stage.appendChild(st.svg);
    var o = 0;
    var b = 0;
    var orange = el('button', { class: 'fss-tile fss-tile-or', type: 'button', 'data-color': 'or', html: fr(1, 10) + '<span class="fss-tl">orange</span>' });
    var blue = el('button', { class: 'fss-tile fss-tile-bl', type: 'button', 'data-color': 'bl', disabled: true, html: fr(1, 10) + '<span class="fss-tl">blue</span>' });
    var read = el('div', { class: 'fss-read' });
    stage.appendChild(el('div', { class: 'fss-tray' }, orange, blue));
    stage.appendChild(read);
    function show() {
      var h = '';
      if (o) h += fr(o, 10, 'fss-or');
      if (b) h += opSign('+') + fr(b, 10, 'fss-bl') + opSign('=') + fr(o + b, 10, 'fss-ans');
      read.innerHTML = h;
    }
    orange.addEventListener('click', function () {
      if (o >= 4) return;
      st.color(o, 'or');
      o++;
      api.sound('pop');
      show();
      if (o === 4) {
        orange.disabled = true;
        blue.disabled = false;
        st.bracket(0, 4, 'fss-br-or', '4/10');
        api.say('4 tenths. Now click the blue tile 3 times.');
      }
    });
    blue.addEventListener('click', function () {
      if (o < 4 || b >= 3) return;
      st.color(4 + b, 'bl');
      b++;
      api.sound('pop');
      show();
      if (b === 3) {
        blue.disabled = true;
        st.bracket(4, 3, 'fss-br-bl', '3/10');
        read.innerHTML += '<div class="fss-not">not ' + fr(7, 20) + '</div>';
        api.say('7 tenths! The pieces are still tenths. Only the top number changes.', 'cheer');
        api.feedback('4 tenths + 3 tenths = 7 tenths. The pieces stay the same size, so it is not 7/20.', 'good');
        api.unlockNext();
      }
    });
  }

  function learnEstimate(stage, api) {
    api.lockNext();
    var rounds = [
      { a: 2, b: 2, d: 5 },
      { a: 2, b: 3, d: 10 },
    ];
    var r = 0;
    var holder = el('div', { class: 'fss-col' });
    stage.appendChild(MQ.ui.lesson('Estimate first', 'Will the answer be less than, equal to or more than half?'));
    stage.appendChild(holder);
    function round() {
      MQ.clear(holder);
      var q = rounds[r];
      var t = q.a + q.b;
      var right = side(t, q.d);
      api.say(r === 0 ? 'Guess first. Will it pass the gold line?' : 'One more. Where will this one land?', 'think');
      holder.appendChild(el('div', { class: 'fss-sent fss-sent-show', html: fr(q.a, q.d) + opSign('+') + fr(q.b, q.d) + opSign('=') + '<span class="fss-q">?</span>' }));
      var st = makeStrip(q.d);
      holder.appendChild(st.svg);
      var ch = MQ.ui.choices(estOptions(), function (v) {
        if (v !== right) {
          ch.mark(v, 'bad');
          api.sound('wrong');
          api.feedback('Hmm. Picture ' + t + ' ' + pname(q.d) + ' on the strip. Try another button.', 'try');
          return;
        }
        ch.mark(v, 'good');
        ch.disable();
        api.sound('correct');
        // fill the strip piece by piece so he sees where the total lands
        for (var i = 0; i < t; i++) {
          (function (i) {
            api.later(function () {
              st.color(i, i < q.a ? 'or' : 'bl');
              api.sound('pop');
            }, 250 * (i + 1));
          })(i);
        }
        api.later(function () {
          st.bracket(0, q.a, 'fss-br-or', q.a + '/' + q.d);
          st.bracket(q.a, q.b, 'fss-br-bl', q.b + '/' + q.d);
          holder.firstChild.innerHTML = sentenceHTML(q.a, '+', q.b, q.d, t);
          if (r === 0) {
            api.feedback('2/5 + 2/5 = 4/5. It goes past the gold line: more than ½, even though the numbers are small!', 'good');
            api.say('Past the gold line! More than half.', 'cheer');
            api.later(function () {
              r = 1;
              round();
            }, 2600);
          } else {
            api.feedback('2/10 + 3/10 = 5/10. It stops right on the gold line: equal to ½.', 'good');
            api.say('Exactly on the line! 5 tenths is a half.', 'cheer');
            api.unlockNext();
          }
        }, 250 * t + 300);
      }, { columns: 3 });
      ch.classList.add('fss-est');
      holder.appendChild(ch);
    }
    round();
  }

  function learnCross(stage, api, whole) {
    api.lockNext();
    var d = whole ? 10 : 5;
    var a = whole ? 10 : 4;
    var take = 3;
    var left = a - take;
    stage.appendChild(MQ.ui.lesson(whole ? 'One whole take away' : 'Taking away', whole ? 'A whole strip is 1. That is 10 tenths.' : 'Cross out the pieces you take away.'));
    var sent = el('div', { class: 'fss-sent fss-sent-show', html: (whole ? '<span class="fss-whole">1</span>' : fr(a, d)) + opSign('-') + fr(take, d) + opSign('=') + '<span class="fss-q">?</span>' });
    stage.appendChild(sent);
    var done = false;
    var st = makeStrip(d, {
      onPiece: function (i) {
        if (done) return;
        if (i >= a) {
          api.feedback('That piece is not part of the ' + a + '/' + d + '. Click an orange piece.', 'info');
          return;
        }
        var on = !st.pieces[i].crossed;
        if (on && st.crossedCount() >= take) {
          api.feedback('We only take away ' + take + ' pieces.', 'info');
          return;
        }
        st.cross(i, on);
        api.sound('click');
        var c = st.crossedCount();
        api.feedback(c + ' crossed out.', 'info');
        if (c === take) {
          done = true;
          st.svg.classList.add('fss-locked');
          sent.innerHTML = whole ? sentenceHTML(d, '-', take, d, left, true) : sentenceHTML(a, '-', take, d, left);
          if (whole) {
            api.say('1 is 10 tenths. Take 3 away: 7 tenths are left!', 'cheer');
            api.feedback('1 − 3/10 = 10/10 − 3/10 = 7/10. Count the pieces that are not crossed out.', 'good');
          } else {
            api.say('Only 1 fifth is left!', 'cheer');
            api.feedback('4/5 − 3/5 = 1/5. The pieces are still fifths.', 'good');
          }
          api.unlockNext();
        }
      },
    });
    st.colorRange(0, a, 'or');
    st.bracket(0, a, 'fss-br-or', whole ? '1 = 10/10' : a + '/' + d);
    stage.appendChild(st.svg);
    api.say(whole ? 'Take away 3 tenths. Click 3 pieces to cross them out.' : 'The strip shows 4/5. Click 3 orange pieces to take them away.');
  }

  function estOptions() {
    return [
      { label: '<b>&lt; ½</b><small>less than half</small>', value: 'lt' },
      { label: '<b>= ½</b><small>equal to half</small>', value: 'eq' },
      { label: '<b>&gt; ½</b><small>more than half</small>', value: 'gt' },
    ];
  }

  /* ---------- practice ---------- */
  // Draw "a op b" on a strip: a orange; + then b blue; − then the last b of the a crossed out.
  function drawOp(st, op, a, b, from1) {
    st.colorRange(0, a, 'or');
    if (op === '+') {
      st.colorRange(a, b, 'bl');
    } else {
      for (var k = a - b; k < a; k++) st.cross(k, true);
    }
  }
  function bracketOp(st, op, a, b, d, from1) {
    if (op === '+') {
      st.bracket(0, a, 'fss-br-or', a + '/' + d);
      st.bracket(a, b, 'fss-br-bl', b + '/' + d);
    } else {
      st.bracket(0, a, 'fss-br-or', from1 ? '1 = ' + d + '/' + d : a + '/' + d);
    }
  }
  function showWork(stage, html, note) {
    var old = stage.querySelector('.fss-work');
    if (old) old.parentNode.removeChild(old);
    stage.appendChild(el('div', { class: 'fss-work' }, el('div', { class: 'fss-sent fss-sent-show', html: html }), note ? el('div', { class: 'fss-note', html: note }) : null));
  }

  function renderCalc(stage, api, q) {
    // add (L1), est (L2), from1 (L3)
    var d = q.d;
    var nm = pname(d);
    var t = result(q.op, q.a, q.b);
    var parts = q.from1 ? [{ whole: 1 }, { op: '-' }, { f: [q.b, d] }] : [{ f: [q.a, d] }, { op: q.op }, { f: [q.b, d] }];
    parts.push({ op: '=' }, { box: true, d: d, editDen: true });

    var st = makeStrip(d, q.type === 'from1' ? {
      onPiece: function (i) {
        if (api.isAnswered()) return;
        st.cross(i, !st.pieces[i].crossed);
        api.sound('click');
      },
    } : null);
    var sent = sentence(parts, {
      onSubmit: function (vals) {
        if (api.isAnswered()) return;
        if (q.type === 'est' && !estDone) {
          api.feedback('First choose your estimate: less than, equal to or more than ½.', 'info');
          return;
        }
        var v = vals[0];
        var res = judge(q, v.n, v.d, api.tries());
        if (res.slip) {
          api.feedback(res.slip, 'info');
          return;
        }
        if (res.ok) {
          sent.mark('good');
          sent.disable();
          var extra = '';
          if (v.d !== d) extra = ' ' + (v.d === 1 ? String(v.n) : v.n + '/' + v.d) + ' is the same as ' + t + '/' + d + '.';
          api.check(true, (q.from1 ? '1 = ' + d + '/' + d + '. ' : '') + t + ' ' + nm + '!' + extra);
        } else {
          sent.mark('bad');
          api.check(false, res.hint, res.tag);
        }
      },
    });

    if (q.type === 'add') {
      api.say('Add the fractions. Count the pieces!', 'think');
      stage.appendChild(MQ.ui.prompt('Add. The pieces are <b>' + nm + '</b>.'));
      drawOp(st, '+', q.a, q.b);
      bracketOp(st, '+', q.a, q.b, d);
    } else if (q.type === 'from1') {
      api.say('A whole strip is 1. Take some away!', 'think');
      stage.appendChild(MQ.ui.prompt('Take away from <b>1 whole</b>. You can click pieces to cross them out.'));
      st.colorRange(0, d, 'or');
      st.bracket(0, d, 'fss-br-or', '1 whole');
    } else {
      api.say('Estimate first: less than, equal to or more than half?', 'think');
      stage.appendChild(MQ.ui.prompt('First <b>estimate</b>. Then work it out.'));
    }
    stage.appendChild(sent.el);
    stage.appendChild(st.svg);

    var estDone = q.type !== 'est';
    var ch = null;
    var right = side(t, d);
    function estReveal() {
      drawOp(st, q.op, q.a, q.b);
      bracketOp(st, q.op, q.a, q.b, d);
    }
    if (q.type === 'est') {
      sent.disable();
      ch = MQ.ui.choices(estOptions(), function (v) {
        if (estDone || api.isAnswered()) return;
        if (v === right) {
          ch.mark(v, 'good');
          ch.disable();
          estDone = true;
          estReveal();
          api.sound('correct');
          api.say('Good estimate! Now work it out.', 'happy');
          api.feedback('Yes, ' + SIDE_TEXT[right] + '. Now type the answer.', 'good');
          sent.enable();
          sent.focus();
        } else {
          ch.mark(v, 'bad');
          var hint = 'Picture the strip. Will the answer reach the gold half-way line?';
          if (api.tries() >= 1) {
            hint = 'Half of a ' + nm + ' strip is ' + (d % 2 === 0 ? d / 2 + ' ' + nm : 'between ' + (d - 1) / 2 + ' and ' + (d + 1) / 2 + ' ' + nm) + '. ' + q.a + (q.op === '+' ? ' + ' : ' − ') + q.b + ' = ' + t + ' ' + nm + '.';
          }
          api.check(false, hint, 'Estimate on the wrong side of a half');
        }
      }, { columns: 3 });
      ch.classList.add('fss-est');
      stage.appendChild(ch);
    } else {
      sent.focus();
    }

    api.onReveal(function () {
      if (ch) {
        ch.mark(right, 'good');
        ch.disable();
      }
      st.clear();
      if (q.from1) {
        st.colorRange(0, d, 'or');
        for (var k = d - q.b; k < d; k++) st.cross(k, true);
        st.bracket(0, d, 'fss-br-or', '1 = ' + d + '/' + d);
      } else {
        drawOp(st, q.op, q.a, q.b);
        bracketOp(st, q.op, q.a, q.b, d);
      }
      st.number(0, t);
      sent.set(0, t, d);
      sent.mark('good');
      sent.disable();
      var note = q.op === '+' ? 'Count all the coloured pieces: ' + q.a + ' + ' + q.b + ' = ' + t + '. They are still ' + nm + '.' : (q.from1 ? '1 whole is ' + d + '/' + d + '. ' : '') + 'Count the pieces not crossed out: ' + q.a + ' − ' + q.b + ' = ' + t + '.';
      if (q.type === 'est') note = 'The answer is ' + SIDE_TEXT[right] + '. ' + note;
      showWork(stage, sentenceHTML(q.a, q.op, q.b, d, t, q.from1), note);
      api.feedback(note, 'info');
    });
  }

  function renderRead(stage, api, q) {
    var d = q.d;
    var t = result(q.op, q.a, q.b);
    var sub = q.op === '-';
    api.say(sub ? 'Some tenths are crossed out. Write the take-away.' : 'Write the addition the strip shows.', 'think');
    stage.appendChild(MQ.ui.prompt(sub ? 'Write the <b>subtraction</b> this strip shows.' : 'Write the <b>addition</b> this strip shows.'));
    var st = makeStrip(d);
    drawOp(st, q.op, q.a, q.b);
    if (sub) st.bracket(0, q.a, 'fss-br-or');
    else {
      st.bracket(0, q.a, 'fss-br-or');
      st.bracket(q.a, q.b, 'fss-br-bl');
    }
    stage.appendChild(st.svg);
    var sent = sentence([{ box: true, d: d }, { op: q.op }, { box: true, d: d }, { op: '=' }, { box: true, d: d }], {
      onSubmit: function (vals) {
        if (api.isAnswered()) return;
        if (vals.some(function (v) { return v.n == null; })) {
          api.feedback('Fill in all three top numbers.', 'info');
          return;
        }
        var n1 = vals[0].n;
        var n2 = vals[1].n;
        var n3 = vals[2].n;
        var partsOk = sub ? n1 === q.a && n2 === q.b : (n1 === q.a && n2 === q.b) || (n1 === q.b && n2 === q.a);
        if (partsOk && n3 === t) {
          sent.mark('good');
          sent.disable();
          api.check(true, sub ? q.a + ' tenths take away ' + q.b + ' leaves ' + t + ' tenths!' : q.a + ' tenths and ' + q.b + ' tenths make ' + t + ' tenths!');
          return;
        }
        sent.mark('bad');
        var strong = api.tries() >= 1;
        if (!partsOk) {
          if (sub) {
            var h = n1 !== q.a ? 'The first number is ALL the orange pieces, crossed out or not.' : 'The middle number is how many pieces are crossed out.';
            api.check(false, h + (strong ? ' Orange: ' + q.a + '. Crossed out: ' + q.b + '.' : ''), 'Read the strip wrongly');
          } else {
            api.check(false, 'Count the orange pieces, then the blue pieces.' + (strong ? ' Orange: ' + q.a + '. Blue: ' + q.b + '.' : ''), 'Read the strip wrongly');
          }
          return;
        }
        api.check(false, (sub ? 'Count the orange pieces that are NOT crossed out.' : 'Count all the coloured pieces together.') + (strong ? ' ' + q.a + (sub ? ' − ' : ' + ') + q.b + ' = ' + t + '.' : ''), 'Counted the pieces wrongly');
      },
    });
    stage.appendChild(sent.el);
    sent.focus();
    api.onReveal(function () {
      sent.set(0, q.a, d);
      sent.set(1, q.b, d);
      sent.set(2, t, d);
      sent.mark('good');
      sent.disable();
      st.clear();
      drawOp(st, q.op, q.a, q.b);
      bracketOp(st, q.op, q.a, q.b, d);
      st.number(0, t);
      var note = sub ? q.a + ' orange tenths, ' + q.b + ' crossed out, ' + t + ' left.' : q.a + ' orange tenths and ' + q.b + ' blue tenths: ' + t + ' tenths in all.';
      showWork(stage, sentenceHTML(q.a, q.op, q.b, d, t), note);
      api.feedback(note, 'info');
    });
  }

  function renderPair(stage, api, q) {
    var d = q.d;
    var nm = pname(d);
    api.say('Bolt found one way to make 1. Can you find another?', 'think');
    stage.appendChild(MQ.ui.prompt('Bolt found ' + fr(q.a, d) + ' + ' + fr(q.b, d) + ' = 1. Find a <b>different</b> pair that makes 1.'));
    var st = makeStrip(d);
    var sent = sentence([{ box: true, d: d }, { op: '+' }, { box: true, d: d }, { op: '=' }, { whole: 1 }], {
      onInput: function (vals) {
        if (api.isAnswered()) return;
        st.clear();
        var p = Math.min(vals[0].n || 0, d);
        var r = Math.min(vals[1].n || 0, d - p);
        st.colorRange(0, p, 'or');
        st.colorRange(p, r, 'bl');
      },
      onSubmit: function (vals) {
        if (api.isAnswered()) return;
        var p = vals[0].n;
        var r = vals[1].n;
        if (p == null || r == null) {
          api.feedback('Fill in both top numbers.', 'info');
          return;
        }
        if (p + r === d && ((p === q.a && r === q.b) || (p === q.b && r === q.a))) {
          api.feedback(p === q.a ? 'That is Bolt\'s pair. Find a different one!' : 'That is Bolt\'s pair turned round. Find a different one!', 'info');
          return;
        }
        if (p + r === d) {
          sent.mark('good');
          sent.disable();
          api.check(true, p + ' ' + nm + ' + ' + r + ' ' + nm + ' = ' + d + ' ' + nm + ', one whole strip!');
          return;
        }
        sent.mark('bad');
        var strong = api.tries() >= 1;
        api.check(false, (p + r < d ? 'That fills only ' + (p + r) + ' of the ' + d + ' pieces. The strip must be full.' : 'That is ' + (p + r) + ' pieces, more than the ' + d + ' in one strip.') + (strong ? ' The two top numbers must add up to ' + d + '.' : ''), 'Pair does not make 1');
      },
    });
    stage.appendChild(sent.el);
    stage.appendChild(st.svg);
    stage.appendChild(el('div', { class: 'fss-note' }, 'The strip colours in as you type.'));
    sent.focus();
    api.onReveal(function () {
      // choose a pair that is not Bolt's (and not his turned round)
      var p = 0;
      for (var k = 1; k < d; k++) {
        if (k !== q.a && k !== q.b) {
          p = k;
          break;
        }
      }
      var r = d - p;
      sent.set(0, p, d);
      sent.set(1, r, d);
      sent.mark('good');
      sent.disable();
      st.clear();
      st.colorRange(0, p, 'or');
      st.colorRange(p, r, 'bl');
      st.bracket(0, p, 'fss-br-or', p + '/' + d);
      st.bracket(p, r, 'fss-br-bl', r + '/' + d);
      var list = [];
      for (var x = 0; x <= d; x++) {
        if (x <= d - x) list.push(fr(x, d) + ' + ' + fr(d - x, d));
      }
      var note = 'The two top numbers must add up to ' + d + ', because ' + d + ' ' + nm + ' fill the strip.';
      showWork(stage, list.join('<span class="fss-sep">·</span>'), note + ' Each of these makes 1.');
      api.feedback(note, 'info');
    });
  }

  function renderSpot(stage, api, q) {
    var it = q.item;
    var d = it.d;
    var nm = pname(d);
    var t = result(it.op, it.a, it.b);
    var isRight = it.sn * d === t * it.sd;
    var simplified = isRight && it.sd !== d;
    api.say('Bolt did this sum. Is he right? Check with the strip.', 'think');
    stage.appendChild(MQ.ui.prompt('Is Bolt right? <b>Tick</b> it or <b>correct</b> it.'));
    var shown = fr(it.a, d) + opSign(it.op) + fr(it.b, d) + opSign('=') + frOrWhole(it.sn, it.sd, 'fss-bolt');
    stage.appendChild(el('div', { class: 'fss-sent fss-sent-show fss-spot', html: shown }));
    var st = makeStrip(d);
    drawOp(st, it.op, it.a, it.b);
    bracketOp(st, it.op, it.a, it.b, d);
    stage.appendChild(st.svg);
    var fixHolder = el('div', { class: 'fss-col' });
    var fix = null;
    var ch = MQ.ui.choices([{ label: '✓ Right', value: 'right' }, { label: '✗ Wrong', value: 'wrong' }], function (v) {
      if (api.isAnswered()) return;
      if (v === 'right' && isRight) {
        ch.mark(v, 'good');
        ch.disable();
        api.check(true, simplified ? 'Yes! ' + t + '/' + d + ' is the same as ' + it.sn + '/' + it.sd + '.' : 'Yes, Bolt is right!');
        return;
      }
      if (v === 'wrong' && !isRight) {
        ch.mark(v, 'good');
        ch.disable();
        api.say('Well spotted! Now write the right answer.', 'happy');
        api.feedback('Yes, it is wrong. What should it be?', 'good');
        fix = sentence([{ f: [it.a, d] }, { op: it.op }, { f: [it.b, d] }, { op: '=' }, { box: true, d: d, editDen: true }], {
          onSubmit: function (vals) {
            if (api.isAnswered()) return;
            var res = judge(it, vals[0].n, vals[0].d, api.tries());
            if (res.slip) {
              api.feedback(res.slip, 'info');
              return;
            }
            if (res.ok) {
              fix.mark('good');
              fix.disable();
              api.check(true, it.a + '/' + d + (it.op === '+' ? ' + ' : ' − ') + it.b + '/' + d + ' = ' + t + '/' + d + '!');
            } else {
              fix.mark('bad');
              api.check(false, res.hint, res.tag);
            }
          },
        });
        fixHolder.appendChild(fix.el);
        fix.focus();
        return;
      }
      ch.mark(v, 'bad');
      if (v === 'wrong') {
        // he called a right answer wrong
        var tag = 'Marked a right answer wrong';
        var hint = 'Count the pieces on the strip: ' + (it.op === '+' ? 'orange and blue together.' : 'the ones not crossed out.');
        if (simplified && it.sd === 1) {
          tag = 'Forgot 1 is a whole strip';
          hint = 'The whole strip is coloured. ' + d + '/' + d + ' is the same as 1!';
        } else if (simplified) {
          tag = 'Marked a right answer wrong because it was simplified';
          hint = t + '/' + d + ' reaches the gold line exactly. That is the same as ½!';
        } else if (it.op === '-' && it.b === 0) {
          tag = 'Thinks taking away 0 leaves 0';
          hint = 'Taking away nothing leaves everything. ' + it.a + '/' + d + ' − 0/' + d + ' is still ' + it.a + '/' + d + '.';
        } else if (t === 0) {
          tag = 'Didn\'t accept 0 as an answer';
          hint = 'All the pieces are crossed out, so 0 ' + nm + ' are left. 0/' + d + ' is right!';
        }
        api.check(false, hint, tag);
      } else {
        // he ticked a wrong answer
        var tag2 = 'Missed a wrong answer';
        var hint2 = 'Count the pieces on the strip again: ' + (it.op === '+' ? 'orange and blue together.' : 'the ones not crossed out.');
        if (it.op === '+' && it.sd === 2 * d) {
          tag2 = 'Added the bottom numbers';
          hint2 = 'Look at the bottom number. The pieces are still ' + nm + '!';
        } else if (it.op === '-' && it.b === 0) {
          tag2 = 'Thinks taking away 0 leaves 0';
          hint2 = 'Nothing is crossed out on the strip. How many pieces are left?';
        }
        api.check(false, hint2, tag2);
      }
    }, { columns: 2 });
    ch.classList.add('fss-tick');
    stage.appendChild(ch);
    stage.appendChild(fixHolder);
    api.onReveal(function () {
      ch.mark(isRight ? 'right' : 'wrong', 'good');
      ch.disable();
      if (fix) {
        fix.set(0, t, d);
        fix.mark('good');
        fix.disable();
      }
      st.number(0, t);
      var note;
      if (isRight) {
        note = 'Bolt is right. ' + (simplified ? t + '/' + d + ' = ' + (it.sd === 1 ? it.sn : it.sn + '/' + it.sd) + '.' : '');
      } else {
        note = 'Bolt is wrong. The strip shows ' + t + ' ' + nm + ', not ' + (it.sd === 1 ? it.sn : it.sn + '/' + it.sd) + '.';
      }
      showWork(stage, sentenceHTML(it.a, it.op, it.b, d, t), note);
      api.feedback(note, 'info');
    });
  }

  var def = {
    learn: [
      learnAdd,
      learnEstimate,
      function (stage, api) {
        learnCross(stage, api, false);
      },
      function (stage, api) {
        learnCross(stage, api, true);
      },
    ],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'readadd' || q.type === 'readsub') return renderRead(stage, api, q);
        if (q.type === 'pair') return renderPair(stage, api, q);
        if (q.type === 'spot') return renderSpot(stage, api, q);
        return renderCalc(stage, api, q);
      },
    },
  };
  // exposed for the deck test only
  def._buildDeck = buildDeck;
  def._judge = judge;
  MQ.register('fraction-strip-sums', def);

  var css = [
    '.fss-strip{max-width:100%;height:auto;display:block}',
    '.fss-piece{fill:#fff;stroke:#1b2a4a;stroke-width:2}',
    '.fss-outline{fill:none;stroke:#1b2a4a;stroke-width:3}',
    '.fss-c-or .fss-piece{fill:#ff9f43}',
    '.fss-c-bl .fss-piece{fill:#4d96ff}',
    '.fss-xl{stroke:#c2410c;stroke-width:5;stroke-linecap:round;display:none}',
    '.fss-crossed .fss-xl{display:inline}',
    '.fss-crossed .fss-piece{fill-opacity:.35}',
    '.fss-click{cursor:pointer}',
    '.fss-click:hover .fss-piece{stroke-width:4}',
    '.fss-locked .fss-click{cursor:default}',
    '.fss-pnum{font-weight:800;font-size:20px;fill:#1b2a4a;pointer-events:none}',
    '.fss-half{stroke:var(--gold);stroke-width:5;stroke-linecap:round;pointer-events:none}',
    '.fss-end{font-weight:800;font-size:20px;fill:var(--ink-soft)}',
    '.fss-halflab text{font-weight:800;font-size:16px;fill:#a86b00}',
    '.fss-halflab line{stroke:#a86b00;stroke-width:2}',
    '.fss-br path{fill:none;stroke-width:3}',
    '.fss-br text{font-weight:800;font-size:18px}',
    '.fss-br-or path{stroke:#d9701a}.fss-br-or text{fill:#b85a10}',
    '.fss-br-bl path{stroke:#2b6fd6}.fss-br-bl text{fill:#2b5fb0}',
    '.fss-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;margin:0 .1em;font-weight:800}',
    '.fss-fn{padding:0 .15em}',
    '.fss-fd{border-top:3px solid currentColor;padding:0 .15em}',
    '.fss-whole{font-weight:800;font-size:1.25em;vertical-align:middle;margin:0 .1em}',
    '.fss-op{font-weight:800;margin:0 .3em;vertical-align:middle}',
    '.fss-ans{color:var(--good)}',
    '.fss-soft{color:var(--ink-soft)}',
    '.fss-or{color:#c4620f}.fss-bl{color:#2b5fb0}',
    '.fss-q{display:inline-block;min-width:1.4em;text-align:center;color:var(--ink-soft);font-weight:800;vertical-align:middle;border-bottom:4px solid var(--accent)}',
    '.fss-sent{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px;font-size:1.7rem}',
    '.fss-sent-show{font-size:1.8rem}',
    '.fss-sent .fss-check{margin-left:14px;font-size:1.1rem}',
    '.fss-fbox{display:inline-flex;flex-direction:column;align-items:center;gap:3px;padding:4px;border-radius:12px;border:3px solid transparent}',
    '.fss-fbox.fss-good{border-color:var(--good);background:var(--good-bg)}',
    '.fss-fbox.fss-bad{border-color:var(--try);background:var(--try-bg)}',
    '.fss-in{width:2.1em;font-size:1.6rem;font-weight:800;text-align:center;border:3px solid var(--line);border-radius:10px;padding:2px 0;font-family:inherit;color:var(--ink);background:#fff}',
    '.fss-in:focus{outline:none;border-color:var(--accent)}',
    '.fss-in:disabled{background:var(--paper-2)}',
    '.fss-den{font-size:1.3rem;width:2.1em}',
    '.fss-bar{display:block;width:2.4em;height:3px;background:var(--ink);border-radius:2px}',
    '.fss-fixden{font-weight:800;font-size:1.6rem;line-height:1.2}',
    '.fss-tray{display:flex;gap:16px;justify-content:center}',
    '.fss-tile{display:flex;align-items:center;gap:10px;font-size:1.4rem;font-family:inherit;padding:8px 18px;border-radius:14px;border:3px solid #1b2a4a;cursor:pointer;color:#1b2a4a}',
    '.fss-tile-or{background:#ff9f43}.fss-tile-bl{background:#4d96ff;color:#fff}',
    '.fss-tile:disabled{opacity:.35;cursor:default}',
    '.fss-tl{font-size:1rem;font-weight:800}',
    '.fss-read{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;font-size:1.9rem;min-height:3.2em;gap:4px}',
    '.fss-not{flex-basis:100%;text-align:center;font-size:1.2rem;color:var(--try);font-weight:800}',
    '.fss-not .fss-frac{text-decoration:line-through}',
    '.fss-col{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.fss-est .choice{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 10px}',
    '.fss-est .choice b{font-size:1.6rem}',
    '.fss-est .choice small{font-size:.85rem;font-weight:700;color:var(--ink-soft)}',
    '.fss-est,.fss-tick{width:100%;max-width:560px}',
    '.fss-tick .choice{font-size:1.4rem}',
    '.fss-bolt{color:#7a3fb0}',
    '.fss-work{display:flex;flex-direction:column;align-items:center;gap:6px;background:var(--info-bg);border-radius:16px;padding:10px 18px}',
    '.fss-work .fss-sent{font-size:1.5rem}',
    '.fss-sep{margin:0 .6em;color:var(--ink-soft)}',
    '.fss-note{color:var(--ink-soft);font-weight:700;text-align:center}',
    '.prompt .fss-frac{font-size:.9em}',
    '@media (max-width:700px){.fss-sent{font-size:1.4rem}.fss-in{font-size:1.3rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'fraction-strip-sums' }, css));
})();

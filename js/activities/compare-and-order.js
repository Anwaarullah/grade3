/* Bigger or smaller? — compare 3-digit numbers digit by digit (hundreds first), use
 * <, > and =, and put numbers in order (Unit 1.2).
 * Numbers sit on parcels in Hundreds / Tens / Ones columns. The reveal lights the
 * columns from the hundreds to the ones until one column decides.
 * The < and > rule is taught as "the open side faces the bigger number".
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
  var KS = ['h', 't', 'o'];
  var PLACE = {
    h: { name: 'hundreds', Name: 'Hundreds', short: 'H' },
    t: { name: 'tens', Name: 'Tens', short: 'T' },
    o: { name: 'ones', Name: 'Ones', short: 'O' },
  };
  var WORD = { '<': 'is less than', '>': 'is greater than', '=': 'is equal to' };

  // Mistake tags (parent-readable)
  var T_ONES = 'Compared the ones first';
  var T_BIG = 'Looked at the biggest digit, not the hundreds';
  var T_REV = 'Reversed < and >';
  var T_2D = 'Thought a 2-digit number was bigger';
  var T_WAY = 'Ordered the wrong way round';
  var T_ORDER = 'Did not compare the hundreds first when ordering';
  var T_EQ = 'Used = for numbers that are different';
  var T_NOTEQ = 'Missed that the numbers are the same';
  var T_EQFIT = 'Thought equal numbers fit < or >';
  var T_MISS = 'Missed some digits that work';
  var T_EXTRA = 'Ticked digits that do not fit';
  var T_ZERO = 'Put 0 as the first digit of a number';

  function dg(n) {
    return { h: Math.floor(n / 100), t: Math.floor(n / 10) % 10, o: n % 10 };
  }
  function symOf(a, b) {
    return a < b ? '<' : a > b ? '>' : '=';
  }
  function holds(l, sym, r) {
    return sym === '<' ? l < r : sym === '>' ? l > r : l === r;
  }
  /** Columns looked at, left to right, up to and including the one that decides. */
  function compareSteps(a, b) {
    var da = dg(a);
    var db = dg(b);
    var out = [];
    for (var i = 0; i < 3; i++) {
      var k = KS[i];
      out.push({ k: k, x: da[k], y: db[k] });
      if (da[k] !== db[k]) break;
    }
    return out;
  }
  function decidingPlace(a, b) {
    var s = compareSteps(a, b);
    var last = s[s.length - 1];
    return last.x === last.y ? null : last.k;
  }

  /* ---------------------------------------------------------------- *
   * Question generators
   * ---------------------------------------------------------------- */
  // Level 1: differ in hundreds. trap = the smaller number has bigger tens AND ones digits.
  function genHundreds(trap, biggerLeft) {
    var hs = U.shuffle(U.range(1, 9)).slice(0, 2).sort();
    var big, small;
    if (trap) {
      var tb = U.rand(0, 7);
      var ob = U.rand(0, 7);
      big = hs[1] * 100 + tb * 10 + ob;
      small = hs[0] * 100 + U.rand(tb + 1, 9) * 10 + U.rand(ob + 1, 9);
    } else {
      big = hs[1] * 100 + U.rand(0, 99);
      small = hs[0] * 100 + U.rand(0, 99);
    }
    return biggerLeft ? { a: big, b: small } : { a: small, b: big };
  }
  // Level 2: same hundreds, tens decide (digits swapped, e.g. 838 / 883)
  function genTens() {
    var h = U.rand(1, 9);
    var xy = U.shuffle(U.range(0, 9)).slice(0, 2);
    var a = h * 100 + xy[0] * 10 + xy[1];
    var b = h * 100 + xy[1] * 10 + xy[0];
    return { a: a, b: b };
  }
  // Level 2: same hundreds and tens, ones decide (e.g. 475 / 472)
  function genOnes() {
    var h = U.rand(1, 9);
    var t = U.rand(0, 9);
    var os = U.shuffle(U.range(0, 9)).slice(0, 2);
    return { a: h * 100 + t * 10 + os[0], b: h * 100 + t * 10 + os[1] };
  }

  function genShelf() {
    var vals;
    var kind = U.pick(['digits', 'digits', 'mixed']);
    if (kind === 'digits') {
      // same three digits rearranged + one or two 2-digit numbers made from them
      var ds = U.shuffle(U.range(1, 9)).slice(0, 3);
      var perms = [];
      [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]].forEach(function (p) {
        perms.push(ds[p[0]] * 100 + ds[p[1]] * 10 + ds[p[2]]);
      });
      var twos = [];
      [[0, 1], [1, 0], [0, 2], [2, 0], [1, 2], [2, 1]].forEach(function (p) {
        twos.push(ds[p[0]] * 10 + ds[p[1]]);
      });
      // prefer 2-digit numbers that start with the biggest digit (they "look" big)
      var maxD = Math.max(ds[0], ds[1], ds[2]);
      var bigTwos = U.shuffle(twos.filter(function (n) {
        return Math.floor(n / 10) === maxD;
      }));
      var k2 = U.rand(1, 2);
      var chosen2 = k2 === 1 ? [bigTwos[0]] : [bigTwos[0], U.pick(twos.filter(function (n) { return n !== bigTwos[0]; }))];
      vals = U.shuffle(perms).slice(0, 5 - k2).concat(chosen2);
    } else {
      // four 3-digit numbers (two share the hundreds) + one 2-digit number with big digits
      var hs = U.shuffle(U.range(1, 9)).slice(0, 3);
      var set = {};
      vals = [];
      var add = function (n) {
        if (!set[n]) {
          set[n] = 1;
          vals.push(n);
          return true;
        }
        return false;
      };
      add(hs[0] * 100 + U.rand(0, 99));
      add(hs[1] * 100 + U.rand(0, 99));
      while (vals.length < 3) add(hs[1] * 100 + U.rand(0, 99));
      add(hs[2] * 100 + U.rand(0, 99));
      add(U.rand(6, 9) * 10 + U.rand(5, 9));
      vals = U.shuffle(vals);
    }
    return { type: 'shelf', vals: vals, dir: U.pick(['up', 'down']) };
  }

  function genOpen() {
    var n = U.rand(121, 879);
    if (n % 100 === 0) n += U.rand(1, 9);
    return { type: 'open', n: n, box: U.pick(['left', 'right']), sym: U.pick(['<', '>']) };
  }

  function tickAnswers(q) {
    var out = [];
    for (var d = 0; d <= 9; d++) {
      if (q.p === 'h' && d === 0) continue;
      var bn = boxNum(q, d);
      if (q.box === 'left' ? holds(bn, q.sym, q.k) : holds(q.k, q.sym, bn)) out.push(d);
    }
    return out;
  }
  function boxNum(q, d) {
    var x = { h: q.bd.h, t: q.bd.t, o: q.bd.o };
    x[q.p] = d;
    return x.h * 100 + x.t * 10 + x.o;
  }
  function genTick() {
    for (var guard = 0; guard < 500; guard++) {
      var k = U.rand(100, 999);
      var p = U.pick(['h', 't', 'o']);
      var kd = dg(k);
      var bd = { h: kd.h, t: kd.t, o: kd.o };
      var pi = KS.indexOf(p);
      var same = Math.random() < 0.5;
      for (var i = pi + 1; i < 3; i++) if (!same) bd[KS[i]] = U.rand(0, 9);
      bd[p] = 0;
      var q = { type: 'tick', k: k, p: p, bd: bd, sym: U.pick(['<', '>']), box: U.pick(['left', 'right']) };
      var ans = tickAnswers(q);
      if (ans.length >= 2 && ans.length <= 8) {
        q.answers = ans;
        return q;
      }
    }
    return { type: 'tick', k: 372, p: 'h', bd: { h: 0, t: 7, o: 2 }, sym: '<', box: 'right', answers: [4, 5, 6, 7, 8, 9] };
  }

  var deck = null;
  function buildDeck() {
    var q = [];
    var sides = U.shuffle([true, false, Math.random() < 0.5]);
    var traps = U.shuffle([true, true, false]);
    var seen = {};
    for (var i = 0; i < 3; i++) {
      var pr;
      do pr = genHundreds(traps[i], sides[i]);
      while (seen[pr.a + '-' + pr.b] || seen[pr.b + '-' + pr.a]);
      seen[pr.a + '-' + pr.b] = 1;
      q.push({ type: 'pick', a: pr.a, b: pr.b });
    }
    var l2 = [];
    var tp = genTens();
    l2.push({ type: 'sym', a: tp.a, b: tp.b });
    var op = genOnes();
    l2.push({ type: 'sym', a: op.a, b: op.b });
    var e = U.rand(100, 999);
    l2.push({ type: 'sym', a: e, b: e });
    q = q.concat(U.shuffle(l2));
    q.push(genShelf());
    q.push(genOpen());
    q.push(genTick());
    return q;
  }

  /* ---------------------------------------------------------------- *
   * Views
   * ---------------------------------------------------------------- */
  function parcel(n) {
    var d = dg(n);
    var cells = {};
    var label = el('div', { class: 'co-label' });
    KS.forEach(function (k) {
      label.appendChild(el('div', { class: 'co-head co-p-' + k }, PLACE[k].short));
    });
    KS.forEach(function (k) {
      cells[k] = el('div', { class: 'co-cell co-p-' + k, 'data-place': k, 'data-n': n }, String(d[k]));
      label.appendChild(cells[k]);
    });
    var root = el('div', { class: 'co-parcel', 'data-n': n }, el('div', { class: 'co-tape' }), label);
    return { el: root, cells: cells, n: n };
  }

  function sentence(a, b) {
    var s = symOf(a, b);
    return el('span', null, el('b', null, String(a)), ' ' + WORD[s] + ' ', el('b', null, String(b)));
  }

  /** Two parcels with a gap between them. */
  function pairView(a, b, opts) {
    opts = opts || {};
    var pa = parcel(a);
    var pb = parcel(b);
    var gap = el('div', { class: 'co-gap' + (opts.plain ? ' co-gap-plain' : '') }, opts.plain ? 'or' : '');
    var row = el('div', { class: 'co-pair' }, pa.el, gap, pb.el);
    var stepsEl = el('div', { class: 'co-steps' });
    var sentEl = el('div', { class: 'co-sentence' });
    var v = {
      a: a,
      b: b,
      el: row,
      gap: gap,
      pa: pa,
      pb: pb,
      stepsEl: stepsEl,
      sentEl: sentEl,
      light: function (k) {
        var x = pa.cells[k];
        var y = pb.cells[k];
        var dx = +x.textContent;
        var dy = +y.textContent;
        [x, y].forEach(function (c) {
          c.classList.remove('co-same', 'co-win', 'co-lose', 'co-hint');
        });
        if (dx === dy) {
          x.classList.add('co-same');
          y.classList.add('co-same');
        } else {
          (dx > dy ? x : y).classList.add('co-win');
          (dx > dy ? y : x).classList.add('co-lose');
        }
      },
      hint: function (k) {
        pa.cells[k].classList.add('co-hint');
        pb.cells[k].classList.add('co-hint');
      },
      clear: function () {
        KS.forEach(function (k) {
          [pa.cells[k], pb.cells[k]].forEach(function (c) {
            c.classList.remove('co-same', 'co-win', 'co-lose', 'co-hint');
          });
        });
        MQ.clear(stepsEl);
        MQ.clear(sentEl);
      },
      addStep: function (s) {
        var txt = s.x === s.y ? PLACE[s.k].Name + ': ' + s.x + ' and ' + s.y + ', the same' : PLACE[s.k].Name + ': ' + s.x + ' and ' + s.y + ', ' + Math.max(s.x, s.y) + ' is more';
        stepsEl.appendChild(el('span', { class: 'co-step co-p-' + s.k + (s.x === s.y ? ' co-step-same' : ' co-step-win') }, (s.x === s.y ? '= ' : '✓ ') + txt));
      },
      setSym: function (sym, cls) {
        gap.textContent = sym;
        gap.classList.remove('co-gap-good', 'co-gap-bad');
        gap.classList.add('co-filled');
        if (cls) gap.classList.add('co-gap-' + cls);
      },
      clearSym: function () {
        gap.textContent = '';
        gap.classList.remove('co-gap-good', 'co-gap-bad', 'co-filled');
      },
      showSentence: function () {
        MQ.clear(sentEl);
        sentEl.appendChild(sentence(a, b));
      },
    };
    return v;
  }

  /** Light the columns hundreds -> tens -> ones until one decides, then call done. */
  function animateCompare(v, api, done, delay) {
    var steps = compareSteps(v.a, v.b);
    var i = 0;
    v.clear();
    function step() {
      if (i >= steps.length) {
        if (done) done();
        return;
      }
      var s = steps[i++];
      v.light(s.k);
      v.addStep(s);
      api.later(step, delay || 650);
    }
    step();
  }

  /**
   * Pointer drag for HTML items with a floating ghost (mouse or touch).
   * o.item / o.target: selectors inside root; o.drop(item, target|null); o.tap(item); o.on() -> enabled
   */
  function dragKit(api, root, o) {
    var d = null;
    function targetAt(x, y) {
      var t = document.elementFromPoint(x, y);
      if (!t || !t.closest) return null;
      var z = t.closest(o.target);
      return z && root.contains(z) ? z : null;
    }
    function clearOver() {
      Array.prototype.forEach.call(root.querySelectorAll('.co-over'), function (n) {
        n.classList.remove('co-over');
      });
    }
    function killGhost(x) {
      if (x && x.ghost && x.ghost.parentNode) x.ghost.parentNode.removeChild(x.ghost);
      if (x && x.src) x.src.classList.remove('co-lifted');
    }
    function onMove(e) {
      if (!d) return;
      if (!d.moved) {
        if (Math.abs(e.clientX - d.x0) + Math.abs(e.clientY - d.y0) < 6) return;
        d.moved = true;
        d.ghost = d.src.cloneNode(true);
        d.ghost.classList.add('co-ghost');
        d.ghost.removeAttribute('data-n');
        d.ghost.style.width = d.src.offsetWidth + 'px';
        d.ghost.style.height = d.src.offsetHeight + 'px';
        document.body.appendChild(d.ghost);
        d.src.classList.add('co-lifted');
      }
      d.ghost.style.left = e.clientX + 'px';
      d.ghost.style.top = e.clientY + 'px';
      clearOver();
      var t = targetAt(e.clientX, e.clientY);
      if (t) t.classList.add('co-over');
    }
    function stop() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    }
    function onUp(e) {
      if (!d) return;
      stop();
      var x = d;
      d = null;
      killGhost(x);
      clearOver();
      if (!o.on()) return;
      if (!x.moved) {
        o.tap(x.src);
        return;
      }
      o.drop(x.src, targetAt(e.clientX, e.clientY));
    }
    function onDown(e) {
      if (d || !o.on()) return;
      if (e.button !== undefined && e.button !== 0) return;
      var c = e.target && e.target.closest ? e.target.closest(o.item) : null;
      if (!c || !root.contains(c) || c.disabled) return;
      e.preventDefault();
      d = { src: c, x0: e.clientX, y0: e.clientY, moved: false };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    }
    function onKey(e) {
      // keyboard Enter / Space gives a click with detail 0
      if (e.detail !== 0 || !o.on()) return;
      var c = e.target && e.target.closest ? e.target.closest(o.item) : null;
      if (c && root.contains(c)) o.tap(c);
    }
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('click', onKey);
    api.cleanup(function () {
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('click', onKey);
      stop();
      killGhost(d);
      d = null;
    });
  }

  /** The <, = and > tokens. Drag one into the gap of v, or click it. onPick(sym). */
  function symbolTokens(api, root, v, onPick) {
    var row = el('div', { class: 'co-syms' });
    ['<', '=', '>'].forEach(function (s) {
      row.appendChild(el('button', { class: 'co-sym', type: 'button', 'data-sym': s, 'aria-label': s === '<' ? 'less than' : s === '>' ? 'greater than' : 'equals' }, s));
    });
    var locked = false;
    dragKit(api, root, {
      item: '.co-sym',
      target: '.co-gap',
      on: function () {
        return !locked;
      },
      tap: function (b) {
        onPick(b.getAttribute('data-sym'));
      },
      drop: function (b, t) {
        if (t) onPick(b.getAttribute('data-sym'));
      },
    });
    return {
      el: row,
      lock: function () {
        locked = true;
        Array.prototype.forEach.call(row.children, function (b) {
          b.disabled = true;
        });
      },
      mark: function (s, cls) {
        var b = row.querySelector('[data-sym="' + s + '"]');
        if (b) b.classList.add('co-' + cls);
      },
    };
  }

  function ruleCard() {
    return el(
      'div',
      { class: 'co-rule' },
      el('span', { class: 'co-mini' }, '3'),
      el('span', { class: 'co-mini-sym' }, '<'),
      el('span', { class: 'co-mini co-mini-big' }, '8'),
      el('span', { class: 'co-rule-txt' }, 'The open side faces the bigger number'),
      el('span', { class: 'co-mini co-mini-big' }, '8'),
      el('span', { class: 'co-mini-sym' }, '>'),
      el('span', { class: 'co-mini' }, '3')
    );
  }

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */
  function learnHundreds(stage, api) {
    api.say('Which parcel has the bigger number? Look at the hundreds first. Click the hundreds column.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Hundreds first', 'Hundreds are worth the most, so we look at them first.'));
    var root = el('div', { class: 'co-q co-clickable' });
    var v = pairView(458, 643, { plain: true });
    root.appendChild(v.el);
    root.appendChild(v.stepsEl);
    root.appendChild(v.sentEl);
    stage.appendChild(root);
    var done = false;
    root.addEventListener('click', function (e) {
      if (done) return;
      var c = e.target.closest ? e.target.closest('.co-cell') : null;
      if (!c) return;
      var k = c.getAttribute('data-place');
      if (k !== 'h') {
        api.sound('wrong');
        api.feedback('That is the ' + PLACE[k].name + ' column. Start with the hundreds: the H column.', 'try');
        v.hint('h');
        return;
      }
      done = true;
      root.classList.remove('co-clickable');
      api.sound('correct');
      v.light('h');
      v.addStep({ k: 'h', x: 4, y: 6 });
      v.showSentence();
      api.say('6 hundreds is more than 4 hundreds. Decided! We do not even need the tens or ones.', 'cheer');
      api.feedback('643 is greater than 458, because 600 is more than 400.', 'good');
      api.unlockNext();
    });
  }

  function learnDecide(stage, api) {
    api.say('These hundreds are the same. Let\'s look along the columns.', 'think');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Same? Look at the next column', 'Hundreds, then tens, then ones. Stop when the digits are different.'));
    var root = el('div', { class: 'co-q' });
    var v = pairView(475, 472, { plain: true });
    root.appendChild(v.el);
    root.appendChild(v.stepsEl);
    root.appendChild(v.sentEl);
    stage.appendChild(root);
    var ready = false;
    var done = false;
    api.later(function () {
      v.light('h');
      v.addStep({ k: 'h', x: 4, y: 4 });
    }, 700);
    api.later(function () {
      v.light('t');
      v.addStep({ k: 't', x: 7, y: 7 });
    }, 1500);
    api.later(function () {
      ready = true;
      root.classList.add('co-clickable');
      api.say('Hundreds the same. Tens the same. Which column decides? Click it.', 'think');
    }, 2300);
    root.addEventListener('click', function (e) {
      if (!ready || done) return;
      var c = e.target.closest ? e.target.closest('.co-cell') : null;
      if (!c) return;
      var k = c.getAttribute('data-place');
      if (k !== 'o') {
        api.sound('wrong');
        var d = k === 'h' ? 4 : 7;
        api.feedback('Both have ' + d + ' ' + PLACE[k].name + '. The same digits cannot decide. Look further right.', 'try');
        return;
      }
      done = true;
      root.classList.remove('co-clickable');
      api.sound('correct');
      v.light('o');
      v.addStep({ k: 'o', x: 5, y: 2 });
      v.showSentence();
      api.say('Yes! The ones decide. 5 ones is more than 2 ones.', 'cheer');
      api.feedback('475 is greater than 472.', 'good');
      api.unlockNext();
    });
  }

  function learnSymbols(stage, api) {
    api.say('The open side of the sign faces the bigger number. Drag the right sign into the gap, or click it.');
    api.lockNext();
    stage.appendChild(ruleCard());
    var pairs = [
      [458, 643],
      [721, 712],
    ];
    var n = 0;
    var holder = el('div', { class: 'co-q' });
    stage.appendChild(holder);
    function show() {
      MQ.clear(holder);
      var a = pairs[n][0];
      var b = pairs[n][1];
      var want = symOf(a, b);
      var v = pairView(a, b);
      var done = false;
      holder.appendChild(v.el);
      var tokens = symbolTokens(api, holder, v, function (s) {
        if (done) return;
        if (s === want) {
          done = true;
          v.setSym(s, 'good');
          tokens.lock();
          v.showSentence();
          api.sound('correct');
          var bigger = Math.max(a, b);
          api.feedback('The open side faces ' + bigger + '. Read it out: ' + a + ' ' + WORD[s] + ' ' + b + '.', 'good');
          n++;
          if (n < pairs.length) {
            api.later(show, 2200);
          } else {
            api.say('Brilliant! Now you can compare numbers. Let\'s practise.', 'cheer');
            api.unlockNext();
          }
        } else {
          v.setSym(s, 'bad');
          api.sound('wrong');
          if (s === '=') api.feedback('= means both numbers are the same. These are different.', 'try');
          else api.feedback('Which number is bigger? Make the open side face it.', 'try');
        }
      });
      holder.appendChild(tokens.el);
      holder.appendChild(v.sentEl);
    }
    show();
  }

  /* ---------------------------------------------------------------- *
   * Practice
   * ---------------------------------------------------------------- */
  function biggestDigit(n) {
    var d = dg(n);
    return Math.max(d.h, d.t, d.o);
  }

  function renderPick(stage, api, q) {
    var root = el('div', { class: 'co-q', 'data-type': 'pick', 'data-q': JSON.stringify(q), 'data-answer': JSON.stringify({ greater: Math.max(q.a, q.b), sym: symOf(q.a, q.b) }) });
    var promptEl = MQ.ui.prompt('Which parcel has the <b>greater</b> number? Click it.');
    var v = pairView(q.a, q.b);
    v.pa.el.classList.add('co-pick');
    v.pb.el.classList.add('co-pick');
    root.appendChild(promptEl);
    root.appendChild(v.el);
    var big = Math.max(q.a, q.b);
    var small = Math.min(q.a, q.b);
    var want = symOf(q.a, q.b);
    var stepN = 1;
    var finished = false;
    var tokens = symbolTokens(api, root, v, function (s) {
      if (finished || stepN !== 2) return;
      if (s === want) {
        finished = true;
        v.setSym(s, 'good');
        tokens.lock();
        v.showSentence();
        api.check(true, 'Yes! ' + q.a + ' ' + WORD[s] + ' ' + q.b + '.');
        return;
      }
      v.setSym(s, 'bad');
      if (s === '=') {
        api.check(false, '= means both numbers are the same. ' + q.a + ' and ' + q.b + ' are different.', T_EQ);
      } else if (api.tries() >= 1) {
        api.check(false, big + ' is bigger, so the open side faces ' + big + ': ' + q.a + ' ' + want + ' ' + q.b + '.', T_REV);
      } else {
        api.check(false, 'Nearly! The open side of the sign faces the bigger number. Which parcel is bigger?', T_REV);
      }
    });
    tokens.el.classList.add('co-hidden');
    root.appendChild(tokens.el);
    root.appendChild(v.stepsEl);
    root.appendChild(v.sentEl);
    stage.appendChild(root);
    api.say('Look at the hundreds first!', 'think');

    function pick(n, pEl) {
      if (finished || stepN !== 1) return;
      if (n === big) {
        stepN = 2;
        pEl.classList.remove('co-bad');
        pEl.classList.add('co-good');
        [v.pa.el, v.pb.el].forEach(function (p) {
          p.classList.remove('co-pick');
          if (p !== pEl) p.classList.remove('co-bad');
        });
        v.light('h');
        api.sound('correct');
        api.say('Yes! ' + dg(big).h + ' hundreds is more than ' + dg(small).h + ' hundreds. Now drag the right sign into the gap.', 'happy');
        api.feedback(big + ' is greater. Now put <, > or = in the gap.', 'good');
        promptEl.innerHTML = 'Drag the right sign into the gap (or click it).';
        tokens.el.classList.remove('co-hidden');
        return;
      }
      pEl.classList.add('co-bad');
      var tag = dg(small).o > dg(big).o ? T_ONES : T_BIG;
      if (api.tries() >= 1) {
        v.hint('h');
        var sd0 = dg(small);
        var bd0 = dg(big);
        var trapTxt = sd0.t > bd0.t || sd0.o > bd0.o ? ', even though ' + small + ' has a bigger digit further along' : '';
        api.check(false, 'Look at the H column: ' + sd0.h + ' hundreds or ' + bd0.h + ' hundreds? ' + big + ' has more hundreds, so it is greater' + trapTxt + '.', tag);
      } else if (tag === T_ONES) {
        api.check(false, 'You may have looked at the ones. Start with the hundreds, they are worth the most.', tag);
      } else {
        api.check(false, 'A big digit in the tens or ones does not win. Start with the hundreds!', tag);
      }
    }
    v.pa.el.addEventListener('click', function () {
      pick(q.a, v.pa.el);
    });
    v.pb.el.addEventListener('click', function () {
      pick(q.b, v.pb.el);
    });

    api.onReveal(function () {
      finished = true;
      tokens.lock();
      tokens.el.classList.remove('co-hidden');
      [v.pa.el, v.pb.el].forEach(function (p) {
        p.classList.remove('co-pick', 'co-bad');
      });
      (q.a === big ? v.pa.el : v.pb.el).classList.add('co-good');
      promptEl.innerHTML = 'Compare the hundreds first.';
      tokens.el.classList.add('co-hidden');
      api.feedback(dg(big).h + ' hundreds is more than ' + dg(small).h + ' hundreds, so ' + big + ' is greater. The open side faces ' + big + '.', 'info');
      animateCompare(v, api, function () {
        v.setSym(want, 'good');
        v.showSentence();
      });
    });
  }

  function renderSym(stage, api, q) {
    var want = symOf(q.a, q.b);
    var root = el('div', { class: 'co-q', 'data-type': 'sym', 'data-q': JSON.stringify(q), 'data-answer': want });
    root.appendChild(MQ.ui.prompt('Drag the right sign into the gap: <b>&lt;</b>, <b>&gt;</b> or <b>=</b>'));
    var v = pairView(q.a, q.b);
    root.appendChild(v.el);
    var finished = false;
    var place = decidingPlace(q.a, q.b);
    var big = Math.max(q.a, q.b);
    var small = Math.min(q.a, q.b);
    var tokens = symbolTokens(api, root, v, function (s) {
      if (finished) return;
      if (s === want) {
        finished = true;
        v.setSym(s, 'good');
        tokens.lock();
        v.showSentence();
        api.check(true, 'Yes! ' + q.a + ' ' + WORD[s] + ' ' + q.b + '.');
        return;
      }
      v.setSym(s, 'bad');
      var strong = api.tries() >= 1;
      if (want === '=') {
        if (strong) KS.forEach(function (k) {
          v.hint(k);
        });
        api.check(false, strong ? 'Hundreds ' + dg(q.a).h + ' and ' + dg(q.b).h + ', tens ' + dg(q.a).t + ' and ' + dg(q.b).t + ', ones ' + dg(q.a).o + ' and ' + dg(q.b).o + '. Every digit is the same!' : 'Check each column: hundreds, tens and ones. Is any digit different?', T_NOTEQ);
        return;
      }
      if (s === '=') {
        api.check(false, '= means the same. Look carefully: one column has different digits.', T_EQ);
        return;
      }
      var bd = dg(big);
      var sd = dg(small);
      var onesTrap = place === 't' && sd.o > bd.o;
      if (strong) {
        v.hint(place);
        var why = place === 't' ? 'Both have ' + bd.h + ' hundreds. Tens: ' + bd.t + ' is more than ' + sd.t + '.' : 'Hundreds and tens are the same. Ones: ' + bd.o + ' is more than ' + sd.o + '.';
        api.check(false, why + ' So ' + big + ' is bigger, and the open side faces ' + big + '.', onesTrap ? T_ONES : T_REV);
      } else if (onesTrap) {
        api.check(false, 'The hundreds are the same. Next look at the tens, not the ones.', T_ONES);
      } else {
        api.check(false, 'Find the bigger number first, then make the open side face it.', T_REV);
      }
    });
    root.appendChild(tokens.el);
    root.appendChild(v.stepsEl);
    root.appendChild(v.sentEl);
    stage.appendChild(root);
    api.say(q.a === q.b ? 'Compare them column by column.' : 'Hundreds first. Same? Then look at the next column.', 'think');
    api.onReveal(function () {
      finished = true;
      tokens.lock();
      tokens.el.classList.add('co-hidden');
      v.clearSym();
      api.feedback(want === '=' ? 'Every column has the same digit, so the numbers are equal.' : 'Look along the columns from the hundreds. The first different digit decides: ' + big + ' is greater.', 'info');
      animateCompare(v, api, function () {
        v.setSym(want, 'good');
        v.showSentence();
      });
    });
  }

  /* --- Level 3: shelf --- */
  function dirPicture(dir) {
    var smallB = el('span', { class: 'co-dbox co-dbox-s' }, '📦');
    var bigB = el('span', { class: 'co-dbox co-dbox-b' }, '📦');
    var left = dir === 'up' ? el('span', { class: 'co-dend' }, smallB, 'smallest') : el('span', { class: 'co-dend' }, bigB, 'greatest');
    var right = dir === 'up' ? el('span', { class: 'co-dend' }, 'greatest', bigB) : el('span', { class: 'co-dend' }, 'smallest', smallB);
    return el('div', { class: 'co-dir co-dir-' + dir }, left, el('span', { class: 'co-arrow' }, ''), right);
  }

  function renderShelf(stage, api, q) {
    var answer = q.vals.slice().sort(function (x, y) {
      return q.dir === 'up' ? x - y : y - x;
    });
    var root = el('div', { class: 'co-q', 'data-type': 'shelf', 'data-q': JSON.stringify(q), 'data-answer': JSON.stringify(answer) });
    root.appendChild(MQ.ui.prompt('Put the parcels on the shelf from <b>' + (q.dir === 'up' ? 'smallest to greatest' : 'greatest to smallest') + '</b>.'));
    root.appendChild(dirPicture(q.dir));
    var slotRow = el('div', { class: 'co-shelf' });
    var tray = el('div', { class: 'co-tray' });
    var checkBtn = el('button', { class: 'btn co-check', type: 'button', disabled: true }, 'Check');
    var work = el('div', { class: 'co-work' });
    root.appendChild(slotRow);
    root.appendChild(el('div', { class: 'co-shelf-plank' }));
    root.appendChild(tray);
    root.appendChild(checkBtn);
    root.appendChild(work);
    stage.appendChild(root);
    api.say('Drag the parcels onto the shelf, or click them. Look at the arrow!', 'think');

    var items = q.vals.map(function (n) {
      return { n: n, at: -1 };
    });
    var locked = false;
    var marks = null; // after a 2nd wrong check: true/false per slot
    function itemAt(s) {
      for (var i = 0; i < items.length; i++) if (items[i].at === s) return items[i];
      return null;
    }
    function byN(n) {
      for (var i = 0; i < items.length; i++) if (items[i].n === n) return items[i];
      return null;
    }
    function box(it) {
      return el('button', { class: 'co-box', type: 'button', 'data-n': it.n, disabled: locked }, String(it.n));
    }
    function render() {
      MQ.clear(slotRow);
      MQ.clear(tray);
      for (var s = 0; s < 5; s++) {
        var it = itemAt(s);
        var slot = el('div', { class: 'co-slot' + (it ? ' co-full' : '') + (marks && it ? (marks[s] ? ' co-ok' : ' co-no') : ''), 'data-slot': s });
        if (it) slot.appendChild(box(it));
        else slot.appendChild(el('span', { class: 'co-slot-num' }, String(s + 1)));
        slotRow.appendChild(slot);
      }
      items.forEach(function (it) {
        if (it.at === -1) tray.appendChild(box(it));
      });
      if (!tray.children.length && !locked) tray.appendChild(el('span', { class: 'co-tray-empty' }, 'All on the shelf! Press Check.'));
      if (locked) tray.classList.add('co-hidden');
      checkBtn.classList.toggle('co-gone', locked);
      checkBtn.disabled = locked || items.some(function (x) {
        return x.at === -1;
      });
    }
    function changed() {
      marks = null;
      render();
    }
    dragKit(api, root, {
      item: '.co-box',
      target: '.co-slot, .co-tray',
      on: function () {
        return !locked;
      },
      tap: function (b) {
        var it = byN(+b.getAttribute('data-n'));
        if (it.at !== -1) {
          it.at = -1;
        } else {
          for (var s = 0; s < 5; s++) {
            if (!itemAt(s)) {
              it.at = s;
              break;
            }
          }
        }
        api.sound('pop');
        changed();
      },
      drop: function (b, t) {
        var it = byN(+b.getAttribute('data-n'));
        if (!t) return render();
        if (t.classList.contains('co-tray')) {
          it.at = -1;
        } else {
          var s = +t.getAttribute('data-slot');
          var other = itemAt(s);
          if (other && other !== it) other.at = it.at;
          it.at = s;
        }
        api.sound('pop');
        changed();
      },
    });
    render();

    checkBtn.addEventListener('click', function () {
      if (locked) return;
      var placed = [];
      for (var s = 0; s < 5; s++) placed.push(itemAt(s).n);
      var ok = placed.every(function (n, i) {
        return n === answer[i];
      });
      if (ok) {
        locked = true;
        marks = [true, true, true, true, true];
        render();
        api.check(true, 'Perfect order! ' + answer.join(q.dir === 'up' ? ' < ' : ' > '));
        return;
      }
      var rev = answer.slice().reverse();
      var reversed = placed.every(function (n, i) {
        return n === rev[i];
      });
      // a 2-digit number placed on the "bigger" side of a 3-digit number?
      var twoTrap = false;
      placed.forEach(function (n, i) {
        if (n >= 100) return;
        placed.forEach(function (m, j) {
          if (m < 100) return;
          if (q.dir === 'up' ? i > j : i < j) twoTrap = true;
        });
      });
      var strong = api.tries() >= 1;
      if (strong) {
        marks = placed.map(function (n, i) {
          return n === answer[i];
        });
        render();
      }
      var firstWrong = 0;
      while (placed[firstWrong] === answer[firstWrong]) firstWrong++;
      if (reversed) {
        api.check(false, strong ? 'Look at the arrow: start with the ' + (q.dir === 'up' ? 'smallest' : 'greatest') + ' number on the left. Turn your row round!' : 'Good comparing, but check the arrow. Which way does it go?', T_WAY);
      } else if (twoTrap) {
        var two = q.vals.filter(function (n) {
          return n < 100;
        });
        api.check(false, (strong ? 'Green parcels are in the right place. ' : '') + two.join(' and ') + (two.length > 1 ? ' have' : ' has') + ' only 2 digits: no hundreds! ' + (two.length > 1 ? 'They are' : 'It is') + ' smaller than every 3-digit number.', T_2D);
      } else {
        api.check(false, strong ? 'Green parcels are in the right place. Space ' + (firstWrong + 1) + ' needs ' + answer[firstWrong] + '. Compare hundreds first, then tens.' : 'Look at the hundreds digit of each parcel first. If two match, look at the tens.', T_ORDER);
      }
    });

    api.onReveal(function () {
      locked = true;
      items.forEach(function (it) {
        it.at = answer.indexOf(it.n);
      });
      marks = [true, true, true, true, true];
      render();
      MQ.clear(work);
      work.appendChild(orderTable(answer));
      var twos = answer.filter(function (n) {
        return n < 100;
      });
      api.feedback('From ' + (q.dir === 'up' ? 'smallest to greatest' : 'greatest to smallest') + ': ' + answer.join(q.dir === 'up' ? ' < ' : ' > ') + '. ' + twos.join(' and ') + (twos.length > 1 ? ' have' : ' has') + ' no hundreds, so ' + (twos.length > 1 ? 'they are' : 'it is') + ' the smallest.', 'info');
    });
  }

  /** Numbers in H/T/O columns, in order, hundreds column lit. */
  function orderTable(nums) {
    var t = el('div', { class: 'co-pvt' });
    t.appendChild(el('span', { class: 'co-pvt-h co-p-h' }, 'H'));
    t.appendChild(el('span', { class: 'co-pvt-h co-p-t' }, 'T'));
    t.appendChild(el('span', { class: 'co-pvt-h co-p-o' }, 'O'));
    t.appendChild(el('span', { class: 'co-pvt-note' }, ''));
    nums.forEach(function (n) {
      var d = dg(n);
      var two = n < 100;
      t.appendChild(el('span', { class: 'co-pvt-c co-pvt-lit' + (two ? ' co-pvt-none' : '') }, two ? '–' : String(d.h)));
      t.appendChild(el('span', { class: 'co-pvt-c' }, String(d.t)));
      t.appendChild(el('span', { class: 'co-pvt-c' }, String(d.o)));
      t.appendChild(el('span', { class: 'co-pvt-note' }, two ? 'no hundreds!' : ''));
    });
    return el('div', { class: 'co-pvt-wrap' }, el('div', { class: 'co-pvt-cap' }, 'Hundreds first. Same hundreds? Then the tens.'), t);
  }

  /* --- Level 3: open inequality --- */
  function openStatement(q, val) {
    var blank = el('span', { class: 'co-blank' + (val != null ? ' co-blank-full' : '') }, val != null ? String(val) : '?');
    var num = el('span', { class: 'co-onum' }, String(q.n));
    var sym = el('span', { class: 'co-osym' }, q.sym);
    var row = el('div', { class: 'co-open' }, q.box === 'left' ? [blank, sym, num] : [num, sym, blank]);
    row.blank = blank;
    return row;
  }
  function needSmaller(q) {
    // box < n  or  n > box  -> box must be smaller
    return (q.box === 'left' && q.sym === '<') || (q.box === 'right' && q.sym === '>');
  }
  function openWorks(q, v) {
    return q.box === 'left' ? holds(v, q.sym, q.n) : holds(q.n, q.sym, v);
  }
  function examplesFor(q) {
    var small = needSmaller(q);
    var cands = small ? [q.n - 1, Math.floor((q.n - 1) / 100) * 100, q.n - 50, 100, 0, Math.floor(q.n / 2 / 10) * 10] : [q.n + 1, Math.ceil((q.n + 1) / 100) * 100, q.n + 50, 900, 1000, Math.round((q.n + 1000) / 2 / 10) * 10];
    var out = [];
    cands.forEach(function (c) {
      if (c < 0 || c > 1000 || !openWorks(q, c)) return;
      for (var i = 0; i < out.length; i++) if (Math.abs(out[i] - c) < 70) return;
      out.push(c);
    });
    return out.slice(0, 4);
  }
  function numberStrip(q, examples, mine) {
    var X0 = 30;
    var SC = 0.7;
    function x(n) {
      return X0 + n * SC;
    }
    var s = svg('svg', { viewBox: '0 0 760 104', class: 'co-strip', width: 760, height: 104 });
    var small = needSmaller(q);
    var lo = small ? 0 : q.n + 1;
    var hi = small ? q.n - 1 : 1000;
    s.appendChild(svg('rect', { x: x(lo), y: 56, width: Math.max(2, x(hi) - x(lo)), height: 16, rx: 4, class: 'co-strip-ok' }));
    s.appendChild(svg('line', { x1: x(0), y1: 64, x2: x(1000), y2: 64, class: 'co-strip-line' }));
    for (var t = 0; t <= 1000; t += 100) {
      s.appendChild(svg('line', { x1: x(t), y1: 54, x2: x(t), y2: 74, class: 'co-strip-tick' }));
      s.appendChild(svg('text', { x: x(t), y: 94, 'text-anchor': 'middle', class: 'co-strip-num' }, String(t)));
    }
    for (var t2 = 50; t2 < 1000; t2 += 100) s.appendChild(svg('line', { x1: x(t2), y1: 58, x2: x(t2), y2: 70, class: 'co-strip-tick' }));
    // the given number
    s.appendChild(svg('line', { x1: x(q.n), y1: 28, x2: x(q.n), y2: 80, class: 'co-strip-n' }));
    s.appendChild(svg('rect', { x: x(q.n) - 24, y: 4, width: 48, height: 26, rx: 6, class: 'co-strip-nbox' }));
    s.appendChild(svg('text', { x: x(q.n), y: 23, 'text-anchor': 'middle', class: 'co-strip-ntext' }, String(q.n)));
    examples.forEach(function (e) {
      s.appendChild(svg('circle', { cx: x(e), cy: 64, r: 7, class: 'co-strip-dot' + (e === mine ? ' co-strip-mine' : '') }));
      var near = Math.abs(e - q.n) < 40;
      s.appendChild(svg('text', { x: near ? x(e) + (e < q.n ? -5 : 5) : x(e), y: 46, 'text-anchor': near ? (e < q.n ? 'end' : 'start') : 'middle', class: 'co-strip-ex' + (e === mine ? ' co-strip-mine-t' : '') }, String(e)));
    });
    return s;
  }

  function renderOpen(stage, api, q) {
    var small = needSmaller(q);
    var root = el('div', { class: 'co-q', 'data-type': 'open', 'data-q': JSON.stringify(q), 'data-answer': JSON.stringify({ min: small ? 0 : q.n + 1, max: small ? q.n - 1 : 1000 }) });
    root.appendChild(MQ.ui.prompt('Type a number that makes this <b>true</b>.'));
    var stmt = openStatement(q, null);
    root.appendChild(stmt);
    var work = el('div', { class: 'co-work' });
    var finished = false;
    var inp = MQ.ui.numberInput({
      label: 'Your number',
      onSubmit: function (v) {
        if (finished) return;
        stmt.blank.textContent = String(v);
        if (v !== Math.floor(v) || v < 0 || v > 1000) {
          inp.bad();
          api.check(false, 'Use a whole number from 0 to 1000.');
          return;
        }
        if (openWorks(q, v)) {
          finished = true;
          inp.good();
          inp.disable();
          stmt.blank.classList.add('co-blank-full');
          MQ.clear(work);
          var ex = examplesFor(q).filter(function (e) {
            return e !== v;
          }).slice(0, 3);
          work.appendChild(numberStrip(q, ex.concat([v]), v));
          work.appendChild(el('div', { class: 'co-strip-cap' }, 'Every number in the green part works. There are lots of answers!'));
          api.check(true, 'Yes! ' + (q.box === 'left' ? v + ' ' + WORD[q.sym] + ' ' + q.n : q.n + ' ' + WORD[q.sym] + ' ' + v) + '.');
          return;
        }
        inp.bad();
        var strong = api.tries() >= 1;
        if (v === q.n) {
          api.check(false, q.n + ' and ' + q.n + ' are the same: that needs =, not ' + q.sym + '. Try a number a bit ' + (small ? 'smaller.' : 'bigger.'), T_EQFIT);
        } else if (strong) {
          api.check(false, 'The open side faces the bigger number. Here the open side faces ' + (small ? q.n : 'the box') + ', so your number must be ' + (small ? 'smaller' : 'bigger') + ' than ' + q.n + '. Try ' + (small ? q.n - 1 : q.n + 1) + '?', T_REV);
        } else {
          var read = q.box === 'left' ? 'your number ' + WORD[q.sym] + ' ' + q.n : q.n + ' ' + WORD[q.sym] + ' your number';
          api.check(false, 'Read it out: "' + read + '". Is ' + v + ' ' + (small ? 'less' : 'greater') + ' than ' + q.n + '?', T_REV);
        }
      },
    });
    inp.input.addEventListener('input', function () {
      if (finished) return;
      var t = inp.input.value.trim();
      stmt.blank.textContent = t === '' ? '?' : t.slice(0, 5);
    });
    root.appendChild(inp.el);
    root.appendChild(work);
    stage.appendChild(root);
    inp.focus();
    api.say('Many numbers work here. Find one!', 'think');
    api.onReveal(function () {
      finished = true;
      inp.disable();
      var ex = examplesFor(q);
      stmt.blank.textContent = String(ex[0]);
      stmt.blank.classList.add('co-blank-full');
      inp.setValue(String(ex[0]));
      inp.good();
      api.feedback('Lots of numbers work! The answer must be ' + (small ? 'less' : 'greater') + ' than ' + q.n + '. ' + q.n + ' itself does not work.', 'info');
      MQ.clear(work);
      work.appendChild(numberStrip(q, ex, ex[0]));
      var exs = ex.slice().sort(function (x, y) {
        return x - y;
      });
      work.appendChild(el('div', { class: 'co-strip-cap' }, small ? 'Any number from 0 to ' + (q.n - 1) + ' works, like ' + exs.join(', ') + '.' : 'Any number from ' + (q.n + 1) + ' up to 1000 works, like ' + exs.join(', ') + '.'));
    });
  }

  /* --- Level 3: missing digit --- */
  function tickStatement(q, d) {
    var bd = q.bd;
    var boxParts = KS.map(function (k) {
      if (k === q.p) return el('span', { class: 'co-mbox' + (d != null ? ' co-mbox-full' : '') }, d != null ? String(d) : '');
      return el('span', { class: 'co-mdig' }, String(bd[k]));
    });
    var bnum = el('span', { class: 'co-mnum' }, boxParts);
    var knum = el('span', { class: 'co-onum' }, String(q.k));
    var sym = el('span', { class: 'co-osym' }, q.sym);
    var row = el('div', { class: 'co-open' }, q.box === 'left' ? [bnum, sym, knum] : [knum, sym, bnum]);
    row.box = boxParts[KS.indexOf(q.p)];
    return row;
  }

  function renderTick(stage, api, q) {
    var root = el('div', { class: 'co-q', 'data-type': 'tick', 'data-q': JSON.stringify(q), 'data-answer': JSON.stringify(q.answers) });
    root.appendChild(MQ.ui.prompt('Tick <b>every</b> digit that can go in the box.'));
    var stmt = tickStatement(q, null);
    root.appendChild(stmt);
    var sel = {};
    var finished = false;
    var row = el('div', { class: 'co-digs' });
    for (var d = 0; d <= 9; d++) row.appendChild(el('button', { class: 'co-dig', type: 'button', 'data-d': d }, String(d)));
    var checkBtn = el('button', { class: 'btn co-check', type: 'button' }, 'Check');
    var work = el('div', { class: 'co-work' });
    root.appendChild(row);
    root.appendChild(checkBtn);
    root.appendChild(work);
    stage.appendChild(root);
    api.say('Try each digit in the box. Which ones make it true?', 'think');

    function paint(bad) {
      Array.prototype.forEach.call(row.children, function (b) {
        var dd = +b.getAttribute('data-d');
        b.classList.toggle('co-on', !!sel[dd]);
        b.classList.toggle('co-wrongtick', !!(bad && bad.indexOf(dd) !== -1));
      });
    }
    row.addEventListener('click', function (e) {
      if (finished) return;
      var b = e.target.closest ? e.target.closest('.co-dig') : null;
      if (!b) return;
      var dd = +b.getAttribute('data-d');
      sel[dd] = !sel[dd];
      MQ.sound('click');
      var first = -1;
      for (var k = 0; k <= 9; k++) if (sel[k]) { first = k; break; }
      stmt.box.textContent = first === -1 ? '' : String(first);
      stmt.box.classList.toggle('co-mbox-full', first !== -1);
      paint(null);
    });

    function equalDigit() {
      for (var dd = 0; dd <= 9; dd++) if (boxNum(q, dd) === q.k && !(q.p === 'h' && dd === 0)) return dd;
      return -1;
    }
    checkBtn.addEventListener('click', function () {
      if (finished) return;
      var picked = [];
      for (var dd = 0; dd <= 9; dd++) if (sel[dd]) picked.push(dd);
      if (!picked.length) {
        api.feedback('Click the digits that work, then press Check.', 'info');
        return;
      }
      var extra = picked.filter(function (x) {
        return q.answers.indexOf(x) === -1;
      });
      var missing = q.answers.filter(function (x) {
        return picked.indexOf(x) === -1;
      });
      if (!extra.length && !missing.length) {
        finished = true;
        Array.prototype.forEach.call(row.children, function (b) {
          b.disabled = true;
        });
        checkBtn.disabled = true;
        api.check(true, 'Yes! ' + q.answers.join(', ') + ' all work.');
        return;
      }
      var strong = api.tries() >= 1;
      if (strong) paint(extra);
      var eqd = equalDigit();
      var count = ' (' + q.answers.length + ' digits work.)';
      var ex = extra[0];
      if (q.p === 'h' && sel[0]) {
        api.check(false, 'A 3-digit number cannot start with 0. ' + '0' + q.bd.t + q.bd.o + ' is really just ' + boxNum(q, 0) + '.' + (strong ? count : ''), T_ZERO);
      } else if (eqd !== -1 && sel[eqd]) {
        api.check(false, 'Try ' + eqd + ': ' + boxNum(q, eqd) + ' is the same as ' + q.k + '. Equal numbers do not fit ' + q.sym + '.' + (strong ? count : ''), T_EQFIT);
      } else if (extra.length && extra.length * 2 >= picked.length) {
        api.check(false, (strong ? 'Try ' + ex + ': is ' + stmtText(q, ex) + ' true? ' : '') + 'Check the sign: the open side faces the bigger number.' + (strong ? count : ''), T_REV);
      } else if (extra.length) {
        api.check(false, 'Try ' + ex + ' in the box: is ' + stmtText(q, ex) + ' true?' + (strong ? count : ''), T_EXTRA);
      } else {
        api.check(false, 'Good, those work! Some more digits work too. Try each digit in the box.' + (strong ? count : ''), T_MISS);
      }
    });

    api.onReveal(function () {
      finished = true;
      sel = {};
      q.answers.forEach(function (x) {
        sel[x] = true;
      });
      paint(null);
      Array.prototype.forEach.call(row.children, function (b) {
        b.disabled = true;
      });
      checkBtn.disabled = true;
      checkBtn.classList.add('co-gone');
      api.feedback('The digits that work: ' + q.answers.join(', ') + '.' + (q.p === 'h' ? ' (0 cannot start a 3-digit number.)' : ''), 'info');
      stmt.box.textContent = '';
      stmt.box.classList.remove('co-mbox-full');
      MQ.clear(work);
      var g = el('div', { class: 'co-trygrid' });
      for (var dd = 0; dd <= 9; dd++) {
        var okD = q.answers.indexOf(dd) !== -1;
        var lead0 = q.p === 'h' && dd === 0;
        var bn = boxNum(q, dd);
        var txt = lead0 ? '0' + String(q.bd.t) + q.bd.o : String(bn);
        g.appendChild(el('div', { class: 'co-try ' + (okD ? 'co-try-ok' : 'co-try-no') }, el('span', { class: 'co-try-n' }, txt), el('span', { class: 'co-try-why' }, lead0 ? '✗ not 3-digit' : okD ? '✓ ' + stmtText(q, dd) : bn === q.k ? '✗ equal' : '✗')));
      }
      work.appendChild(el('div', { class: 'co-strip-cap' }, 'Try every digit in the box and compare with ' + q.k + ':'));
      work.appendChild(g);
    });
  }
  function stmtText(q, d) {
    var bn = boxNum(q, d);
    return q.box === 'left' ? bn + ' ' + q.sym + ' ' + q.k : q.k + ' ' + q.sym + ' ' + bn;
  }

  /* ---------------------------------------------------------------- *
   * Register
   * ---------------------------------------------------------------- */
  MQ.register('compare-and-order', {
    learn: [learnHundreds, learnDecide, learnSymbols],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'pick') return renderPick(stage, api, q);
        if (q.type === 'sym') return renderSym(stage, api, q);
        if (q.type === 'shelf') return renderShelf(stage, api, q);
        if (q.type === 'open') return renderOpen(stage, api, q);
        return renderTick(stage, api, q);
      },
    },
  });

  /* ---------------------------------------------------------------- *
   * Styles
   * ---------------------------------------------------------------- */
  var css = [
    '.co-q{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.co-hidden{visibility:hidden}',
    '.co-gone{display:none}',
    '.co-tray.co-hidden{display:none}',
    /* place colours */
    '.co-p-h{--pc:#1d6fa5;--pb:#d8ecf8;--pt:#0b4f7d}',
    '.co-p-t{--pc:#3d7a1f;--pb:#dcf0cf;--pt:#2d5e13}',
    '.co-p-o{--pc:#a06a00;--pb:#ffefc2;--pt:#7a5200}',
    /* parcels */
    '.co-pair{display:flex;align-items:center;justify-content:center;gap:16px;max-width:100%}',
    '.co-parcel{position:relative;background:#e3bd86;border:3px solid #b5874a;border-radius:12px;padding:16px 14px 12px;box-shadow:0 4px 0 #b5874a;transition:transform .1s,box-shadow .15s}',
    '.co-tape{position:absolute;top:0;bottom:0;left:50%;width:26px;margin-left:-13px;background:#f1d8ae;opacity:.9}',
    '.co-label{position:relative;background:#fff;border-radius:8px;padding:6px 8px 8px;display:grid;grid-template-columns:repeat(3,58px);gap:5px}',
    '.co-head{text-align:center;font-weight:800;font-size:.9rem;border-radius:6px;background:var(--pb);color:var(--pt)}',
    '.co-cell{text-align:center;font-size:2.5rem;font-weight:800;line-height:1.25;border:3px solid var(--pc);border-radius:9px;color:var(--pt);background:#fff;transition:all .25s}',
    '.co-clickable .co-cell{cursor:pointer}',
    '.co-clickable .co-cell:hover{background:var(--pb);transform:translateY(-2px)}',
    '.co-cell.co-same{background:#eef0f4;border-color:#9aa3b5;color:#5c667a}',
    '.co-cell.co-win{background:#fff3c4;border-color:#e0a100;color:#7a5200;box-shadow:0 0 0 4px #ffd65a,0 0 18px #ffcc33;transform:scale(1.08)}',
    '.co-cell.co-lose{opacity:.5}',
    '.co-cell.co-hint{box-shadow:0 0 0 4px #8ecae6;background:var(--pb)}',
    '.co-pick{cursor:pointer}',
    '.co-pick:hover{transform:translateY(-3px);box-shadow:0 7px 0 #b5874a}',
    '.co-parcel.co-good{outline:5px solid var(--good);outline-offset:3px}',
    '.co-parcel.co-bad{outline:5px solid var(--try);outline-offset:3px}',
    '.co-gap{flex:0 0 auto;width:84px;height:84px;border:3px dashed #9aa6c4;border-radius:16px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:3.2rem;font-weight:800;line-height:1;color:var(--ink)}',
    '.co-gap-plain{border:none;background:none;width:44px;font-size:1.2rem;color:var(--ink-soft)}',
    '.co-gap.co-filled{border-style:solid}',
    '.co-gap.co-over{border-color:var(--accent);background:var(--paper-2)}',
    '.co-gap.co-gap-good{border-color:var(--good);background:var(--good-bg);color:var(--good)}',
    '.co-gap.co-gap-bad{border-color:var(--try);background:var(--try-bg);color:var(--try)}',
    /* symbol tokens */
    '.co-syms{display:flex;gap:14px;justify-content:center}',
    '.co-sym{font:inherit;width:74px;height:70px;font-size:2.8rem;font-weight:800;line-height:1;border:3px solid #7b2cbf;color:#5a189a;background:#f3e9fc;border-radius:14px;cursor:grab;box-shadow:0 3px 0 #c8a6e8;touch-action:none;user-select:none;-webkit-user-select:none}',
    '.co-sym:hover:not(:disabled){transform:translateY(-2px)}',
    '.co-sym:disabled{opacity:.45;cursor:default}',
    '.co-lifted{opacity:.3}',
    '.co-ghost{position:fixed;z-index:1000;pointer-events:none;transform:translate(-50%,-50%) rotate(-3deg);box-shadow:0 6px 16px rgba(0,0,0,.25);margin:0}',
    /* steps + sentence */
    '.co-steps{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;min-height:0}',
    '.co-steps:empty{display:none}',
    '.co-step{font-weight:800;font-size:1rem;border:2px solid var(--pc);background:var(--pb);color:var(--pt);border-radius:10px;padding:4px 10px}',
    '.co-step-same{border-color:#9aa3b5;background:#eef0f4;color:#4a5468}',
    '.co-sentence{font-size:1.5rem;font-weight:700;text-align:center}',
    '.co-sentence:empty{display:none}',
    '.co-sentence b{color:#0b6e66;font-size:1.7rem}',
    /* rule card */
    '.co-rule{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;background:#f8f4ff;border:2px solid #d9c6f0;border-radius:14px;padding:6px 16px}',
    '.co-mini{font-size:1.4rem;font-weight:800;color:var(--ink-soft)}',
    '.co-mini-big{font-size:2.2rem;color:#0b6e66}',
    '.co-mini-sym{font-size:2.2rem;font-weight:800;color:#5a189a}',
    '.co-rule-txt{font-weight:800;font-size:1.05rem;margin:0 12px;color:#5a189a}',
    /* shelf */
    '.co-dir{display:flex;align-items:center;gap:10px;font-weight:800;color:var(--ink-soft);width:100%;max-width:620px}',
    '.co-dend{display:flex;align-items:center;gap:6px;white-space:nowrap}',
    '.co-dbox-s{font-size:1.1rem}.co-dbox-b{font-size:2.2rem}',
    '.co-arrow{flex:1;height:6px;background:#7b9acc;border-radius:3px;position:relative;min-width:60px}',
    '.co-arrow:after{content:"";position:absolute;right:-4px;top:-9px;border-left:16px solid #7b9acc;border-top:12px solid transparent;border-bottom:12px solid transparent}',
    '.co-shelf{display:flex;gap:10px;justify-content:center;flex-wrap:nowrap;margin-bottom:-12px}',
    '.co-slot{width:112px;height:72px;border:3px dashed #b8a27a;border-radius:12px;background:#fffdf7;display:flex;align-items:center;justify-content:center}',
    '.co-slot.co-full{border-color:transparent;background:transparent}',
    '.co-slot.co-over{border-color:var(--accent);background:var(--paper-2)}',
    '.co-slot.co-ok .co-box{outline:4px solid var(--good)}',
    '.co-slot.co-no .co-box{outline:4px solid var(--try)}',
    '.co-slot-num{color:#b8a27a;font-weight:800}',
    '.co-shelf-plank{width:100%;max-width:620px;height:14px;background:#a8763e;border-radius:4px;box-shadow:0 4px 0 #7c5427}',
    '.co-box{font:inherit;width:104px;height:64px;font-size:1.9rem;font-weight:800;color:#4a3315;background:#e3bd86;border:3px solid #b5874a;border-radius:10px;box-shadow:0 3px 0 #b5874a;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;background-image:linear-gradient(90deg,transparent 42%,#f1d8ae 42%,#f1d8ae 58%,transparent 58%)}',
    '.co-box:disabled{cursor:default;color:#4a3315;opacity:1}',
    '.co-box:hover:not(:disabled){transform:translateY(-2px)}',
    '.co-tray{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;align-items:center;min-height:86px;width:100%;max-width:640px;padding:10px;background:#f4f1ea;border:2px solid #d8cfbd;border-radius:14px}',
    '.co-tray.co-over{border-color:var(--accent)}',
    '.co-tray-empty{color:var(--ink-soft);font-weight:700}',
    '.co-check{font-size:1.15rem}',
    '.co-work{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%}',
    '.co-work:empty{display:none}',
    /* place-value table */
    '.co-pvt-wrap{display:flex;flex-direction:column;align-items:center;gap:4px}',
    '.co-pvt-cap{font-weight:700;color:var(--ink-soft)}',
    '.co-pvt{display:grid;grid-template-columns:repeat(3,44px) 120px;gap:3px;align-items:center}',
    '.co-pvt-h{text-align:center;font-weight:800;border-radius:6px;background:var(--pb);color:var(--pt)}',
    '.co-pvt-c{text-align:center;font-size:1.3rem;font-weight:800;border:2px solid var(--line);border-radius:6px;background:#fff;line-height:1.3}',
    '.co-pvt-lit{background:#fff3c4;border-color:#e0a100}',
    '.co-pvt-none{background:#fff1e0;border-color:#e76f00;color:#c25400}',
    '.co-pvt-note{font-weight:800;color:#c25400;font-size:.95rem;padding-left:6px}',
    /* open inequality + missing digit */
    '.co-open{display:flex;align-items:center;gap:14px;font-size:3rem;font-weight:800;background:#fff;border:3px solid var(--line);border-radius:16px;padding:6px 24px}',
    '.co-onum{color:var(--ink)}',
    '.co-osym{color:#5a189a}',
    '.co-blank{display:inline-block;min-width:110px;text-align:center;border:3px dashed #9aa6c4;border-radius:12px;color:#9aa6c4;padding:0 10px}',
    '.co-blank-full{border-style:solid;border-color:var(--good);color:var(--good)}',
    '.co-mnum{display:inline-flex;gap:2px;align-items:center}',
    '.co-mbox{display:inline-block;width:52px;height:64px;border:3px dashed #9aa6c4;border-radius:10px;vertical-align:middle;text-align:center;line-height:58px;color:#5a189a}',
    '.co-mbox-full{border-style:solid;border-color:#7b2cbf;background:#f3e9fc}',
    '.co-digs{display:grid;grid-template-columns:repeat(10,minmax(0,58px));gap:8px;justify-content:center;width:100%}',
    '.co-dig{font:inherit;height:58px;font-size:1.7rem;font-weight:800;border:3px solid var(--line);border-radius:12px;background:#fff;color:var(--ink);cursor:pointer;position:relative}',
    '.co-dig:hover:not(:disabled){border-color:var(--accent)}',
    '.co-dig.co-on{background:var(--good-bg);border-color:var(--good);color:var(--good)}',
    '.co-dig.co-on:after{content:"✓";position:absolute;top:-2px;right:4px;font-size:.8rem}',
    '.co-dig.co-wrongtick{background:var(--try-bg);border-color:var(--try);color:var(--try)}',
    '.co-dig:disabled{cursor:default}',
    '.co-trygrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;width:100%;max-width:640px}',
    '.co-try{display:flex;flex-direction:column;align-items:center;border:2px solid;border-radius:10px;padding:2px 4px}',
    '.co-try-ok{border-color:var(--good);background:var(--good-bg);color:var(--good)}',
    '.co-try-no{border-color:#c9cfdc;background:#f4f5f8;color:#7a8396}',
    '.co-try-n{font-size:1.3rem;font-weight:800}',
    '.co-try-why{font-size:.85rem;font-weight:700}',
    /* number strip */
    '.co-strip{display:block;max-width:100%;height:auto}',
    '.co-strip-ok{fill:#bfead5}',
    '.co-strip-line{stroke:var(--ink);stroke-width:3}',
    '.co-strip-tick{stroke:var(--ink);stroke-width:2}',
    '.co-strip-num{font-size:14px;font-weight:700;fill:var(--ink-soft)}',
    '.co-strip-n{stroke:#5a189a;stroke-width:3}',
    '.co-strip-nbox{fill:#f3e9fc;stroke:#7b2cbf;stroke-width:2}',
    '.co-strip-ntext{font-size:17px;font-weight:800;fill:#5a189a}',
    '.co-strip-dot{fill:var(--good);stroke:#fff;stroke-width:2}',
    '.co-strip-mine{fill:#e0a100}',
    '.co-strip-ex{font-size:14px;font-weight:800;fill:var(--good)}',
    '.co-strip-mine-t{fill:#a06a00}',
    '.co-strip-cap{font-weight:700;color:var(--ink-soft);text-align:center}',
    /* narrow screens */
    '@media (max-width:700px){',
    '.co-label{grid-template-columns:repeat(3,42px);gap:4px}',
    '.co-cell{font-size:1.8rem}',
    '.co-parcel{padding:12px 8px 8px}',
    '.co-pair{gap:8px}',
    '.co-gap{width:64px;height:64px;font-size:2.4rem}',
    '.co-slot{width:88px;height:62px}',
    '.co-box{width:82px;height:54px;font-size:1.5rem}',
    '.co-shelf{gap:6px}',
    '.co-open{font-size:2.2rem;padding:4px 14px}',
    '.co-digs{gap:4px}',
    '.co-dig{font-size:1.3rem;height:50px}',
    '}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'compare-and-order' }, css));
})();

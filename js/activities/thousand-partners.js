/* Thousand Partners — partners to 1000 and mental adding/subtracting of multiples of 10 (Unit 9.3).
 * Bridges: the same 100 square with each square worth 10 (ten times larger, no × needed),
 * the complement ladder (one side +10, the other −10) and the jump line (jump to the next hundred).
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  function nextHundred(n) {
    return Math.floor(n / 100) * 100 + 100;
  }

  /* ---------- jump line ---------- */
  /**
   * Number line drawn to scale from `from` to `to` (to > from), with a jump to the next hundred
   * first (if it lies between) and then the rest. Labels each jump with its size.
   * opts.hideEnd: show "?" instead of the end number. Returns { el, jumps:[sizes] }.
   */
  function jumpLine(from, to, opts) {
    opts = opts || {};
    var W = 640;
    var L = 30;
    var R = W - 30;
    var lo = Math.floor(from / 100) * 100;
    var hi = Math.ceil(to / 100) * 100;
    if (hi === lo) hi = lo + 100;
    function X(v) {
      return L + ((v - lo) / (hi - lo)) * (R - L);
    }
    var root = svg('svg', { viewBox: '0 0 ' + W + ' 170', class: 'tkp-line', role: 'img', 'aria-label': 'number line' });
    root.appendChild(svg('line', { x1: L - 10, y1: 110, x2: R + 10, y2: 110, class: 'tkp-axis' }));
    var stops = [from];
    var nh = nextHundred(from);
    if (from % 100 !== 0 && nh < to) stops.push(nh);
    else if (from % 100 === 0 && from + 100 < to && opts.hundredStep) stops.push(from + 100);
    stops.push(to);
    var jumps = [];
    for (var i = 1; i < stops.length; i++) {
      var a = stops[i - 1];
      var b = stops[i];
      jumps.push(b - a);
      var xa = X(a);
      var xb = X(b);
      var mid = (xa + xb) / 2;
      var rise = Math.min(70, 26 + (xb - xa) / 4);
      root.appendChild(svg('path', { d: 'M' + xa + ' 108 Q' + mid + ' ' + (108 - rise * 1.6) + ' ' + xb + ' 108', class: 'tkp-arc tkp-arc' + i }));
      root.appendChild(svg('text', { x: mid, y: 108 - rise * 0.8 - 6, 'text-anchor': 'middle', class: 'tkp-jlbl tkp-jlbl' + i }, '+' + (b - a)));
    }
    // Labels: the stops in bold (dropped lower when two are close), other hundreds only where there is room.
    var lastX = -999;
    var lastLow = false;
    var stopXs = stops.map(X);
    stops.forEach(function (v, k) {
      var x = stopXs[k];
      var low = x - lastX < 46 && !lastLow;
      var cls = 'tkp-snum' + (k === stops.length - 1 ? ' tkp-snum-end' : k > 0 ? ' tkp-snum-mid' : '');
      root.appendChild(svg('text', { x: x, y: low ? 162 : 140, 'text-anchor': 'middle', class: cls }, k === stops.length - 1 && opts.hideEnd ? '?' : String(v)));
      lastX = x;
      lastLow = low;
    });
    for (var h = lo; h <= hi; h += 100) {
      root.appendChild(svg('line', { x1: X(h), y1: 100, x2: X(h), y2: 120, class: 'tkp-tick' }));
      var near = stopXs.some(function (sx) { return Math.abs(sx - X(h)) < 46; });
      if (!near) root.appendChild(svg('text', { x: X(h), y: 140, 'text-anchor': 'middle', class: 'tkp-tnum' }, String(h)));
    }
    root.appendChild(svg('circle', { cx: X(from), cy: 110, r: 6, class: 'tkp-dot' }));
    root.appendChild(svg('circle', { cx: X(to), cy: 110, r: 6, class: 'tkp-dot tkp-dot-end' }));
    return { el: root, jumps: jumps, stops: stops };
  }

  /* ---------- 100 square where every square is worth 10 ---------- */
  function tenSquare(n, worth) {
    var CELL = 24;
    var PAD = 4;
    var W = PAD * 2 + CELL * 10;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + W, class: 'tkp-sq', role: 'img', 'aria-label': 'square of 100' });
    var cells = [];
    for (var i = 0; i < 100; i++) {
      var r = Math.floor(i / 10);
      var c = i % 10;
      var rect = svg('rect', { x: PAD + c * CELL, y: PAD + r * CELL, width: CELL, height: CELL, class: 'tkp-cell' + (i < n ? ' tkp-on' : ' tkp-off') });
      cells.push(rect);
      root.appendChild(rect);
    }
    root.appendChild(svg('rect', { x: PAD, y: PAD, width: CELL * 10, height: CELL * 10, class: 'tkp-frame' }));
    var txt = [];
    function label(w) {
      txt.forEach(function (t) { root.removeChild(t); });
      txt = [];
      if (w === 10) {
        for (var k = 0; k < 100; k++) {
          var t = svg('text', { x: PAD + (k % 10) * CELL + CELL / 2, y: PAD + Math.floor(k / 10) * CELL + CELL * 0.68, 'text-anchor': 'middle', class: 'tkp-ten' }, '10');
          txt.push(t);
          root.appendChild(t);
        }
      }
    }
    label(worth);
    return { el: root, setWorth: label };
  }

  /* ---------- deck ---------- */
  function distinctPick(list, used) {
    var pool = U.shuffle(list).filter(function (v) { return !used[v]; });
    used[pool[0]] = true;
    return pool[0];
  }

  function buildDeck() {
    var used = {};
    var hundreds = U.range(1, 9).map(function (k) { return k * 100; });
    var fifties = U.range(1, 9).map(function (k) { return k * 100 + 50; }).filter(function (v) { return v !== 950; });
    var tens = U.range(11, 99).map(function (k) { return k * 10; }).filter(function (v) { return v % 50 !== 0 && v !== 530; }); // 530 is on a learn screen
    var q = [];
    q.push({ type: 'comp', n: distinctPick(hundreds, used), T: 1000 });
    q.push({ type: 'comp', n: distinctPick(fifties, used), T: 1000 });
    var s = 500 + 10 * U.rand(3, 6); // ladder starts after the learn-screen rows (500–530)
    q.push({ type: 'ladder', start: s, ask: s + 20 });
    q.push({ type: 'comp', n: distinctPick(fifties, used), T: 1000 });
    q.push({ type: 'comp', n: distinctPick(tens, used), T: 1000 });
    q.push({ type: 'comp', n: distinctPick(tens, used), T: 1000 });
    // to another multiple of 10 (not 1000)
    var T, a;
    do {
      T = U.rand(50, 95) * 10;
      a = U.rand(25, Math.floor(T / 10) - 11) * 10;
    } while (a % 100 === 0 || T % 100 === 0 && U.rand(0, 1) === 0);
    q.push({ type: 'comp', n: a, T: T });
    // add crossing a hundred
    var x, y;
    do {
      x = U.rand(21, 79) * 10;
      y = U.rand(11, 49) * 10;
    } while (x % 100 === 0 || y % 100 === 0 || (x % 100) + (y % 100) <= 100 || x + y >= 1000);
    q.push({ type: 'add', a: x, b: y });
    // subtract with an exchange: plain or with the missing number
    var p, m;
    do {
      p = U.rand(45, 98) * 10;
      m = U.rand(21, Math.floor(p / 10) - 11) * 10;
    } while (p % 100 === 0 || m % 100 === 0 || p % 100 >= m % 100);
    q.push(U.rand(0, 1) ? { type: 'sub', a: p, b: m } : { type: 'subMissing', a: p, c: p - m });
    q.push({ type: 'cards' });
    return q;
  }

  /* Answer and the jump line for each typed question. */
  function solve(q) {
    if (q.type === 'comp') return { ans: q.T - q.n, from: q.n, to: q.T, sentence: q.n + ' + ' + (q.T - q.n) + ' = ' + q.T };
    if (q.type === 'add') return { ans: q.a + q.b, from: q.a, to: q.a + q.b, sentence: q.a + ' + ' + q.b + ' = ' + (q.a + q.b) };
    if (q.type === 'sub') return { ans: q.a - q.b, from: q.b, to: q.a, sentence: q.a + ' − ' + q.b + ' = ' + (q.a - q.b) };
    if (q.type === 'subMissing') return { ans: q.a - q.c, from: q.c, to: q.a, sentence: q.a + ' − ' + (q.a - q.c) + ' = ' + q.c };
    if (q.type === 'ladder') return { ans: 1000 - q.ask, from: q.ask, to: 1000, sentence: q.ask + ' + ' + (1000 - q.ask) + ' = 1000' };
    return null;
  }
  function promptHtml(q) {
    var B = '<span class="tkp-blank">?</span>';
    if (q.type === 'comp') return q.n + ' + ' + B + ' = ' + q.T;
    if (q.type === 'add') return q.a + ' + ' + q.b + ' = ' + B;
    if (q.type === 'sub') return q.a + ' − ' + q.b + ' = ' + B;
    if (q.type === 'subMissing') return q.a + ' − ' + B + ' = ' + q.c;
    return '';
  }
  function filledHtml(q, ans) {
    return promptHtml(q).replace('<span class="tkp-blank">?</span>', '<span class="tkp-blank tkp-filled">' + ans + '</span>');
  }

  function digitwiseNoExchange(a, b) {
    var h = Math.abs(Math.floor(a / 100) - Math.floor(b / 100));
    var t = Math.abs(Math.floor(a / 10) % 10 - Math.floor(b / 10) % 10);
    return h * 100 + t * 10;
  }

  function mistakeFor(q, x, ans) {
    if (q.type === 'comp' || q.type === 'ladder') {
      var n = q.type === 'comp' ? q.n : q.ask;
      var T = q.type === 'comp' ? q.T : 1000;
      if (x * 10 === ans) return { tag: 'Added a zero to only one number', hint: x + ' is the partner to 100. Put the 0 back: it needs to make ' + T + '.' };
      if (n + x === T + 100 && T === 1000 && n % 100 !== 0) return { tag: 'Hundreds added to 10', hint: n + ' + ' + x + ' = ' + (n + x) + '. The tens make 100 already, so the hundreds only need to make ' + (Math.floor(T / 100) - 1) + '.' };
      if (n + x === T - 100) return { tag: 'Forgot to cross the hundred', hint: n + ' + ' + x + ' = ' + (n + x) + '. One hundred short!' };
      if (n + x === T + 100) return { tag: 'One hundred too many', hint: n + ' + ' + x + ' = ' + (n + x) + '. That is one hundred too many.' };
      return { tag: 'Partner did not make ' + (T === 1000 ? '1000' : 'the total'), hint: n + ' + ' + x + ' = ' + (n + x) + ', not ' + T + '.' };
    }
    if (q.type === 'add') {
      if (x === ans - 100) return { tag: 'Forgot to cross the hundred', hint: 'The tens make more than 100: ' + (q.a % 100) + ' + ' + (q.b % 100) + ' = ' + ((q.a % 100) + (q.b % 100)) + '. Did you count the extra hundred?' };
      return { tag: 'Adding slip with tens', hint: 'Jump to the next hundred first: ' + q.a + ' + ' + (nextHundred(q.a) - q.a) + ' = ' + nextHundred(q.a) + '.' };
    }
    var a = q.a;
    var b = q.type === 'sub' ? q.b : q.a - q.c;
    if (x === digitwiseNoExchange(a, b)) return { tag: 'Subtracted digits without regrouping', hint: 'Not enough tens to take away! Count up instead: from ' + (q.type === 'sub' ? b : q.c) + ' jump to the next hundred.' };
    if (x === ans + 100 || x === ans - 100) return { tag: 'Forgot to cross the hundred', hint: 'Check: ' + (q.type === 'sub' ? x + ' + ' + b : q.c + ' + ' + x) + ' = ' + (q.type === 'sub' ? x + b : q.c + x) + ', not ' + a + '.' };
    return { tag: 'Subtracting slip with tens', hint: 'Check by adding: ' + (q.type === 'sub' ? x + ' + ' + b + ' = ' + (x + b) : q.c + ' + ' + x + ' = ' + (q.c + x)) + ', not ' + a + '.' };
  }

  function strongHint(q, sol) {
    var from = sol.from;
    var nh = nextHundred(from);
    if (q.type === 'add') return 'Jump: ' + q.a + ' → ' + nextHundred(q.a) + ' is +' + (nextHundred(q.a) - q.a) + '. Then add the rest of ' + q.b + '.';
    if (from % 100 === 0) return 'Count up from ' + from + ' to ' + sol.to + ' in hundreds.';
    return 'Count up: ' + from + ' → ' + nh + ' is ' + (nh - from) + '. Then ' + nh + ' → ' + sol.to + ' is ' + (sol.to - nh) + '. Add the two jumps.';
  }

  /* ---------- practice renderers ---------- */

  function renderTyped(stage, api, q) {
    var sol = solve(q);
    var say = {
      comp: q.T === 1000 ? 'Hide the 0 and think of 100. What is the partner?' : 'Count up to ' + q.T + '. Jump to the next hundred first.',
      add: 'Add in your head. Jump to the next hundred first.',
      sub: 'Count up from ' + q.b + ' to ' + q.a + '.',
      subMissing: 'How much was taken away? Count up from ' + q.c + ' to ' + q.a + '.',
    }[q.type];
    api.say(say, 'think');
    var pr = MQ.ui.prompt(promptHtml(q));
    pr.classList.add('tkp-eq');
    stage.appendChild(pr);
    var work = el('div', { class: 'tkp-reveal' });
    var lastWrong = null;
    var input = MQ.ui.numberInput({
      label: 'Answer',
      onSubmit: function (x) {
        if (x === sol.ans) {
          input.good();
          input.disable();
          pr.innerHTML = filledHtml(q, sol.ans);
          api.check(true, 'Yes! ' + sol.sentence + '.');
          return;
        }
        if (x === lastWrong) {
          api.feedback('You tried ' + x + ' already. Try a different number.', 'info');
          return;
        }
        lastWrong = x;
        input.bad();
        var m = mistakeFor(q, x, sol.ans);
        api.check(false, api.tries() >= 1 ? m.hint + ' ' + strongHint(q, sol) : m.hint, m.tag);
        input.focus();
      },
    });
    stage.appendChild(input.el);
    stage.appendChild(work);
    input.focus();
    api.onReveal(function () {
      input.setValue(sol.ans);
      input.good();
      input.disable();
      pr.innerHTML = filledHtml(q, sol.ans);
      showJumpWorking(work, q, sol);
      api.feedback(sol.sentence, 'info');
    });
  }

  function showJumpWorking(work, q, sol) {
    MQ.clear(work);
    var jl = jumpLine(sol.from, sol.to);
    work.appendChild(jl.el);
    var lines = [];
    if (q.type === 'add') {
      lines.push(q.b + ' = ' + jl.jumps.join(' + ') + ', so jump ' + jl.jumps.map(function (j) { return '+' + j; }).join(' then ') + '.');
      lines.push(sol.sentence);
    } else {
      lines.push('Jumps: ' + jl.jumps.join(' + ') + ' = ' + sol.ans);
      if ((q.type === 'comp' || q.type === 'ladder') && sol.to === 1000 && sol.from % 10 === 0) {
        var n10 = sol.from / 10;
        lines.push('Hide the 0: ' + n10 + ' + ' + (100 - n10) + ' = 100, so ' + sol.from + ' + ' + sol.ans + ' = 1000.');
      } else {
        lines.push(sol.sentence);
      }
    }
    work.appendChild(
      el(
        'div',
        { class: 'tkp-work' },
        lines.map(function (l) {
          return el('div', null, l);
        })
      )
    );
  }

  function renderLadder(stage, api, q) {
    var sol = solve(q);
    api.say('One side goes up by 10. The other side goes down by 10.', 'think');
    stage.appendChild(MQ.ui.prompt('Fill in the next row.'));
    var table = el('div', { class: 'tkp-ladder' });
    [q.start, q.start + 10].forEach(function (s) {
      table.appendChild(el('div', { class: 'tkp-lrow' }, el('span', null, String(s)), el('span', null, '+'), el('span', null, String(1000 - s)), el('span', null, '= 1000')));
    });
    var blank = el('span', { class: 'tkp-blank' }, '?');
    table.appendChild(el('div', { class: 'tkp-lrow tkp-lrow-ask' }, el('span', null, String(q.ask)), el('span', null, '+'), blank, el('span', null, '= 1000')));
    stage.appendChild(table);
    var work = el('div', { class: 'tkp-reveal' });
    var lastWrong = null;
    var input = MQ.ui.numberInput({
      label: 'Next partner',
      onSubmit: function (x) {
        if (x === sol.ans) {
          input.good();
          input.disable();
          blank.textContent = String(sol.ans);
          blank.classList.add('tkp-filled');
          api.check(true, 'Yes! ' + (q.ask - 10) + ' went up to ' + q.ask + ', so ' + (sol.ans + 10) + ' went down to ' + sol.ans + '.');
          return;
        }
        if (x === lastWrong) {
          api.feedback('You tried ' + x + ' already. Try a different number.', 'info');
          return;
        }
        lastWrong = x;
        input.bad();
        var hint;
        var tag;
        if (x === sol.ans + 20) {
          hint = 'The left side went UP by 10, so the right side must go DOWN by 10.';
          tag = 'Moved the partner the wrong way';
        } else {
          var m = mistakeFor(q, x, sol.ans);
          hint = m.hint + ' The row above has ' + (1000 - q.ask + 10) + '. Take away 10.';
          tag = m.tag;
        }
        api.check(false, hint, tag);
        input.focus();
      },
    });
    stage.appendChild(input.el);
    stage.appendChild(work);
    input.focus();
    api.onReveal(function () {
      input.setValue(sol.ans);
      input.good();
      input.disable();
      blank.textContent = String(sol.ans);
      blank.classList.add('tkp-filled');
      work.appendChild(el('div', { class: 'tkp-work' }, el('div', null, (q.ask - 10) + ' + 10 = ' + q.ask + ' and ' + (sol.ans + 10) + ' − 10 = ' + sol.ans + '.'), el('div', null, q.ask + ' + ' + sol.ans + ' = 1000')));
      api.feedback(q.ask + ' + ' + sol.ans + ' = 1000', 'info');
    });
  }

  /* Digit cards 1–9: build one  _ _ 0 + _ _ 0 = 1000, each card used once. */
  function renderCards(stage, api) {
    api.say('Use the cards to make a sum that equals 1000.', 'think');
    stage.appendChild(MQ.ui.prompt('Click cards to fill the boxes. Each card once.'));
    var slots = [null, null, null, null]; // H1, T1, H2, T2
    var slotEls = [];
    function slot(i) {
      var s = el('button', { class: 'tkp-slot', type: 'button', 'aria-label': 'box ' + (i + 1) }, '');
      s.addEventListener('click', function () {
        if (done || slots[i] == null) return;
        cardEls[slots[i] - 1].disabled = false;
        slots[i] = null;
        s.textContent = '';
        MQ.sound('click');
      });
      slotEls.push(s);
      return s;
    }
    var line = el(
      'div',
      { class: 'tkp-cardsum' },
      slot(0), slot(1), el('span', { class: 'tkp-zero' }, '0'),
      el('span', { class: 'tkp-op' }, '+'),
      slot(2), slot(3), el('span', { class: 'tkp-zero' }, '0'),
      el('span', { class: 'tkp-op' }, '= 1000')
    );
    stage.appendChild(line);
    var done = false;
    var cardEls = U.range(1, 9).map(function (d) {
      var c = el('button', { class: 'tkp-card', type: 'button' }, String(d));
      c.addEventListener('click', function () {
        if (done) return;
        var i = slots.indexOf(null);
        if (i === -1) {
          api.feedback('All the boxes are full. Click a box to take a card back.', 'info');
          return;
        }
        slots[i] = d;
        slotEls[i].textContent = String(d);
        c.disabled = true;
        MQ.sound('pop');
      });
      return c;
    });
    stage.appendChild(el('div', { class: 'tkp-cards' }, cardEls));
    var checkBtn = el('button', { class: 'btn', type: 'button' }, 'Check');
    stage.appendChild(checkBtn);
    stage.appendChild(el('div', { class: 'tkp-tip' }, 'Tip: the tens make 10. The hundreds make 9.'));
    var work = el('div', { class: 'tkp-reveal' });
    stage.appendChild(work);
    checkBtn.addEventListener('click', function () {
      if (done) return;
      if (slots.indexOf(null) !== -1) {
        api.feedback('Fill all four boxes first.', 'info');
        return;
      }
      var a = slots[0] * 100 + slots[1] * 10;
      var b = slots[2] * 100 + slots[3] * 10;
      var s = a + b;
      if (s === 1000) {
        done = true;
        checkBtn.disabled = true;
        api.check(true, 'Yes! ' + a + ' + ' + b + ' = 1000. Tens: ' + slots[1] + ' + ' + slots[3] + ' = 10. Hundreds: ' + slots[0] + ' + ' + slots[2] + ' = 9.');
        return;
      }
      var tensSum = slots[1] + slots[3];
      var hSum = slots[0] + slots[2];
      var hint;
      var tag;
      if (tensSum === 10 && hSum === 10) {
        hint = a + ' + ' + b + ' = ' + s + '. The tens make 100 already, so the hundreds only need to make 9.';
        tag = 'Hundreds added to 10';
      } else if (tensSum !== 10) {
        hint = a + ' + ' + b + ' = ' + s + '. First make the tens: two cards that make 10.';
        tag = 'Tens did not make 10';
      } else {
        hint = a + ' + ' + b + ' = ' + s + '. The tens are right! Now the hundreds must make 9.';
        tag = 'Hundreds did not make 9';
      }
      api.check(false, hint, tag);
    });
    api.onReveal(function () {
      done = true;
      checkBtn.disabled = true;
      var ex = [3, 1, 6, 9]; // 310 + 690
      ex.forEach(function (d, i) {
        slots[i] = d;
        slotEls[i].textContent = String(d);
      });
      cardEls.forEach(function (c, i) {
        c.disabled = ex.indexOf(i + 1) !== -1;
      });
      work.appendChild(el('div', { class: 'tkp-work' }, el('div', null, 'Tens: 1 + 9 = 10 tens = 100.'), el('div', null, 'Hundreds: 3 + 6 = 9 hundreds = 900.'), el('div', null, '310 + 690 = 1000')));
      api.feedback('One answer: 310 + 690 = 1000. There are others too!', 'info');
    });
  }

  /* ---------- learn screens ---------- */

  function learnTenTimes(stage, api) {
    api.lockNext();
    api.say('35 + 65 = 100. Now make every square worth 10!');
    var sq = tenSquare(35, 1);
    var head = MQ.ui.prompt('35 + 65 = 100');
    head.classList.add('tkp-eq');
    stage.appendChild(head);
    var btn = el('button', { class: 'btn', type: 'button' }, 'Make each square worth 10');
    var lower = el('div', { class: 'tkp-lower' });
    stage.appendChild(el('div', { class: 'tkp-row' }, sq.el, el('div', { class: 'tkp-col' }, el('div', { class: 'tkp-key' }, el('span', { class: 'tkp-key-on' }, ''), ' 35'), el('div', { class: 'tkp-key' }, el('span', { class: 'tkp-key-off' }, ''), ' 65'), btn)));
    stage.appendChild(lower);
    btn.addEventListener('click', function () {
      btn.disabled = true;
      sq.setWorth(10);
      MQ.sound('pop');
      head.innerHTML = '35 tens + 65 tens = 100 tens<br><b>350 + 650 = 1000</b>';
      api.say('35 tens is 350. 65 tens is 650. Together: 1000!', 'cheer');
      lower.appendChild(MQ.ui.prompt('Your turn: 53 + 47 = 100, so 530 + <span class="tkp-blank">?</span> = 1000'));
      var input = MQ.ui.numberInput({
        label: 'Partner of 530',
        onSubmit: function (x) {
          if (x === 470) {
            input.good();
            input.disable();
            api.sound('correct');
            api.say('Yes! 530 + 470 = 1000.', 'cheer');
            api.feedback('Same bond, ten times bigger: 53 + 47 = 100, so 530 + 470 = 1000.', 'good');
            api.unlockNext();
          } else {
            input.bad();
            api.sound('wrong');
            api.feedback(x === 47 ? '47 is the partner to 100. Put the 0 back for 1000!' : '530 + ' + x + ' = ' + (530 + x) + '. Think 53 + 47 = 100, then add a 0 to both.', 'try');
          }
        },
      });
      lower.appendChild(input.el);
      input.focus();
    });
  }

  function learnLadder(stage, api) {
    api.lockNext();
    api.say('A ladder of partners to 1000. Fill the next two rows.');
    var table = el('div', { class: 'tkp-ladder' });
    [500, 510].forEach(function (s) {
      table.appendChild(el('div', { class: 'tkp-lrow' }, el('span', null, String(s)), el('span', null, '+'), el('span', null, String(1000 - s)), el('span', null, '= 1000')));
    });
    stage.appendChild(table);
    var asks = [520, 530];
    var k = 0;
    var holder = el('div', { class: 'tkp-lower' });
    stage.appendChild(holder);
    function ask() {
      MQ.clear(holder);
      if (k >= asks.length) {
        api.say('See? Left side up 10, right side down 10.', 'cheer');
        api.feedback('500 + 500, 510 + 490, 520 + 480, 530 + 470: one side +10, the other −10.', 'good');
        api.unlockNext();
        return;
      }
      var s = asks[k];
      var blank = el('span', { class: 'tkp-blank' }, '?');
      var row = el('div', { class: 'tkp-lrow tkp-lrow-ask' }, el('span', null, String(s)), el('span', null, '+'), blank, el('span', null, '= 1000'));
      table.appendChild(row);
      var input = MQ.ui.numberInput({
        label: 'Partner of ' + s,
        onSubmit: function (x) {
          if (x === 1000 - s) {
            blank.textContent = String(x);
            blank.classList.add('tkp-filled');
            row.classList.remove('tkp-lrow-ask');
            api.sound('correct');
            k++;
            ask();
          } else {
            input.bad();
            api.sound('wrong');
            api.feedback(x === 1000 - s + 20 ? 'The left side went UP by 10, so the right side goes DOWN by 10.' : 'Look at the row above. Take 10 away from its partner.', 'try');
          }
        },
      });
      holder.appendChild(input.el);
      input.focus();
    }
    ask();
  }

  function learnJump(stage, api) {
    api.lockNext();
    api.say('670 − 380. Count up from 380 to 670 in two jumps.');
    var pr = MQ.ui.prompt('670 − 380 = <span class="tkp-blank">?</span>');
    pr.classList.add('tkp-eq');
    stage.appendChild(pr);
    var jl = jumpLine(380, 670, { hideEnd: false });
    jl.el.classList.add('tkp-hide1', 'tkp-hide2');
    stage.appendChild(jl.el);
    var b1 = el('button', { class: 'btn', type: 'button' }, 'Jump to 400');
    var b2 = el('button', { class: 'btn', type: 'button', disabled: true }, 'Jump to 670');
    stage.appendChild(el('div', { class: 'tkp-btns' }, b1, b2));
    var sumEl = el('div', { class: 'tkp-work tkp-hidden' });
    stage.appendChild(sumEl);
    b1.addEventListener('click', function () {
      b1.disabled = true;
      b2.disabled = false;
      jl.el.classList.remove('tkp-hide1');
      MQ.sound('pop');
      api.say('380 to 400 is a jump of 20.', 'happy');
    });
    b2.addEventListener('click', function () {
      b2.disabled = true;
      jl.el.classList.remove('tkp-hide2');
      MQ.sound('pop');
      sumEl.classList.remove('tkp-hidden');
      sumEl.textContent = '20 + 270 = 290, so 670 − 380 = 290';
      pr.innerHTML = '670 − 380 = <span class="tkp-blank tkp-filled">290</span>';
      api.say('400 to 670 is 270. 20 + 270 = 290!', 'cheer');
      api.feedback('Jump to the next hundred first, then the rest.', 'good');
      api.unlockNext();
    });
  }

  var deck = null;
  MQ.register('thousand-partners', {
    learn: [learnTenTimes, learnLadder, learnJump],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'ladder') renderLadder(stage, api, q);
        else if (q.type === 'cards') renderCards(stage, api);
        else renderTyped(stage, api, q);
      },
    },
  });

  var css = [
    '.tkp-eq{font-size:2rem}',
    '.tkp-eq b{color:#0b6e66}',
    '.tkp-blank{display:inline-block;min-width:70px;border-bottom:4px solid var(--accent);color:var(--ink-soft);text-align:center}',
    '.tkp-filled{color:var(--good)}',
    '.tkp-reveal,.tkp-lower{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}',
    '.tkp-line{width:100%;max-width:640px;height:auto}',
    '.tkp-axis{stroke:#1d2b3a;stroke-width:3}',
    '.tkp-tick{stroke:#1d2b3a;stroke-width:2}',
    '.tkp-tnum{font-size:15px;font-weight:700;fill:#5b6b7b}',
    '.tkp-snum{font-size:18px;font-weight:800;fill:#1f5fbf}',
    '.tkp-snum-end{fill:#1d7a3a}',
    '.tkp-snum-mid{fill:#9a6b00}',
    '.tkp-dot{fill:#1f5fbf}',
    '.tkp-dot-end{fill:#1d7a3a}',
    '.tkp-arc{fill:none;stroke-width:3}',
    '.tkp-arc1{stroke:#e0a800}',
    '.tkp-arc2{stroke:#2ec4b6}',
    '.tkp-jlbl{font-size:18px;font-weight:800}',
    '.tkp-jlbl1{fill:#9a6b00}',
    '.tkp-jlbl2{fill:#0b6e66}',
    '.tkp-hide1 .tkp-arc1,.tkp-hide1 .tkp-jlbl1,.tkp-hide2 .tkp-arc2,.tkp-hide2 .tkp-jlbl2{visibility:hidden}',
    '.tkp-work{background:var(--info-bg);border-radius:14px;padding:8px 16px;font-size:1.15rem;font-weight:700;display:flex;flex-direction:column;gap:2px;max-width:640px;text-align:center}',
    '.tkp-hidden{visibility:hidden}',
    '.tkp-btns{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}',
    '.tkp-row{display:flex;gap:24px;align-items:center;justify-content:center;flex-wrap:wrap;width:100%}',
    '.tkp-col{display:flex;flex-direction:column;gap:10px;align-items:flex-start}',
    '.tkp-sq{width:100%;max-width:260px;height:auto}',
    '.tkp-cell{stroke:#c9d3df;stroke-width:1}',
    '.tkp-on{fill:#8fb8ff}',
    '.tkp-off{fill:#bfe9c9}',
    '.tkp-frame{fill:none;stroke:#1d2b3a;stroke-width:2}',
    '.tkp-ten{font-size:9px;font-weight:700;fill:#1d2b3a}',
    '.tkp-key{display:flex;align-items:center;gap:8px;font-size:1.3rem;font-weight:800}',
    '.tkp-key span{display:inline-block;width:22px;height:22px;border-radius:4px}',
    '.tkp-key-on{background:#8fb8ff}',
    '.tkp-key-off{background:#bfe9c9}',
    '.tkp-ladder{display:flex;flex-direction:column;gap:6px;background:#fff;border:3px solid var(--line);border-radius:16px;padding:10px 20px}',
    '.tkp-lrow{display:grid;grid-template-columns:80px 30px 80px 110px;align-items:center;font-size:1.6rem;font-weight:800;text-align:center}',
    '.tkp-lrow-ask{color:#0b6e66}',
    '.tkp-cardsum{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center}',
    '.tkp-slot{width:56px;height:68px;border:3px dashed var(--accent);border-radius:12px;background:#fff;font-size:2rem;font-weight:800;font-family:inherit;color:var(--ink);cursor:pointer}',
    '.tkp-zero{font-size:2rem;font-weight:800;width:30px;text-align:center}',
    '.tkp-op{font-size:2rem;font-weight:800;margin:0 8px}',
    '.tkp-cards{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.tkp-card{width:52px;height:64px;border:3px solid var(--line);border-radius:10px;background:#fffdf5;font-size:1.8rem;font-weight:800;font-family:inherit;color:var(--ink);cursor:pointer;box-shadow:0 3px 0 var(--line)}',
    '.tkp-card:hover:not(:disabled){border-color:var(--accent)}',
    '.tkp-card:disabled{opacity:.3;cursor:default}',
    '.tkp-tip{color:var(--ink-soft);font-weight:700}',
    '@media (max-width:640px){.tkp-lrow{grid-template-columns:64px 24px 64px 90px;font-size:1.3rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'thousand-partners' }, css));
})();

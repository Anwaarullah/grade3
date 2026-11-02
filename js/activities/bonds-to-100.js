/* Bonds to 100 — find the partner that makes 100 with a blank 100 square (Unit 9.3).
 * Rule taught: the ones make 10 and the tens make 9 (when the ones digit is 0, the tens make 10).
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var CELL = 30;
  var PAD = 6;

  function partner(n) {
    return 100 - n;
  }
  function rev(n) {
    var s = String(n);
    if (s.length !== 2) return null;
    return Number(s[1] + s[0]);
  }

  /* ---------- 100 square ---------- */
  /**
   * A 10 × 10 square. shade(n) fills the first n squares row by row.
   * split(n) colours the empty part: the rest of the row and the full rows, with labels.
   * opts.onPick(k) makes it clickable: clicking square k (1–100) shades up to it.
   */
  function hundredSquare(opts) {
    opts = opts || {};
    var W = PAD * 2 + CELL * 10;
    var LBL = opts.labels ? 200 : 0;
    var root = svg('svg', { viewBox: '0 0 ' + (W + LBL) + ' ' + W, class: 'b100-sq' + (opts.onPick ? ' b100-click' : ''), role: 'img', 'aria-label': '100 square' });
    root.style.maxWidth = (W + LBL) * 0.95 + 'px';
    var cells = [];
    for (var i = 0; i < 100; i++) {
      var r = Math.floor(i / 10);
      var c = i % 10;
      var rect = svg('rect', { x: PAD + c * CELL, y: PAD + r * CELL, width: CELL, height: CELL, class: 'b100-cell' });
      (function (k) {
        if (opts.onPick) rect.addEventListener('click', function () { opts.onPick(k + 1); });
      })(i);
      cells.push(rect);
      root.appendChild(rect);
    }
    root.appendChild(svg('rect', { x: PAD, y: PAD, width: CELL * 10, height: CELL * 10, class: 'b100-frame' }));
    var labels = svg('g');
    root.appendChild(labels);
    var api = {
      el: root,
      n: 0,
      shade: function (n) {
        api.n = n;
        MQ.clear(labels);
        cells.forEach(function (cell, k) {
          cell.setAttribute('class', 'b100-cell' + (k < n ? ' b100-on' : ''));
        });
      },
      split: function (n) {
        api.shade(n);
        var finish = n % 10 === 0 ? 0 : 10 - (n % 10);
        cells.forEach(function (cell, k) {
          if (k < n) return;
          cell.setAttribute('class', 'b100-cell ' + (k < n + finish ? 'b100-row' : 'b100-rows'));
        });
        if (!opts.labels) return;
        var x = W + 10;
        var firstEmptyRow = Math.floor(n / 10);
        if (finish) {
          labels.appendChild(svg('text', { x: x, y: PAD + firstEmptyRow * CELL + CELL * 0.72, class: 'b100-lbl b100-lbl-row' }, '← ' + finish + ' finish the row'));
        }
        var fullRows = (100 - n - finish) / 10;
        if (fullRows > 0) {
          var top = PAD + (firstEmptyRow + (finish ? 1 : 0)) * CELL;
          var mid = top + (fullRows * CELL) / 2;
          labels.appendChild(svg('text', { x: x, y: mid + 6, class: 'b100-lbl b100-lbl-rows' }, '← ' + fullRows * 10 + ' in full rows'));
        }
      },
    };
    return api;
  }

  /** "35 + 65 = 100" broken into the ones bond and the tens bond. */
  function bondWorking(n) {
    var p = partner(n);
    var t = Math.floor(n / 10);
    var o = n % 10;
    var lines = [];
    if (o === 0) {
      lines.push('The ones digit is 0, so the tens make 10: ' + t + ' tens + ' + (10 - t) + ' tens = 10 tens = 100.');
    } else {
      lines.push('Ones: ' + o + ' + ' + (10 - o) + ' = 10 (that makes 1 more ten).');
      lines.push('Tens: ' + t + ' + ' + (9 - t) + ' = 9, and 9 tens + 1 more ten = 10 tens.');
    }
    lines.push(n + ' + ' + p + ' = 100');
    return el(
      'div',
      { class: 'b100-work' },
      lines.map(function (l, i) {
        return el('div', { class: i === lines.length - 1 ? 'b100-work-total' : null }, l);
      })
    );
  }

  function mistake(n, x) {
    var o = n % 10;
    if (n < 10 && x === 10 - n) return { tag: 'Forgot the 0 tens in a single-digit number', hint: n + ' is 0 tens and ' + n + ' ones. ' + n + ' + ' + x + ' only makes 10, not 100. The tens still need to make 9.' };
    if (rev(n) === x && x !== partner(n)) return { tag: 'Reversed the digits', hint: 'Swapping the digits does not work. ' + n + ' + ' + x + ' = ' + (n + x) + ', not 100.' };
    if (n + x === 110 && o !== 0) return { tag: 'Made both digits add to 10', hint: n + ' + ' + x + ' = 110. The ones make 10, which gives an extra ten, so the tens only need to make 9.' };
    if (o === 0 && n + x === 90) return { tag: 'Tens made 9 when the ones were 0', hint: n + ' + ' + x + ' = 90. The ones digit is 0, so the tens must make 10.' };
    if (Math.abs(n + x - 100) <= 3) return { tag: 'Counted on in ones', hint: n + ' + ' + x + ' = ' + (n + x) + '. So close! Use bonds: what makes the ones up to 10?' };
    return { tag: 'Partner did not make 100', hint: n + ' + ' + x + ' = ' + (n + x) + ', not 100. What makes the ones up to 10? Then what makes the tens up to 9?' };
  }

  function strongHint(n) {
    var o = n % 10;
    var t = Math.floor(n / 10);
    if (o === 0) return 'The ones are 0. So the tens make 10: ' + t + ' and what make 10?';
    return 'Ones: ' + o + ' and what make 10? Tens: ' + t + ' and what make 9? Look at the empty squares.';
  }

  /* ---------- deck ---------- */
  var STORIES = [
    { n: 38, text: 'You pay for a <b>$38</b> toy with a <b>$100</b> note. How much change?', icon: '💵', pre: '$', unit: '' },
    { n: 43, text: 'A string is <b>1 m</b> long (100 cm). You cut off <b>43 cm</b>. How much is left?', icon: '🧵', pre: '', unit: 'cm' },
    { n: 17, text: 'A bag had <b>100</b> marbles. <b>17</b> were lost. How many are left?', icon: '🔵', pre: '', unit: '' },
    { n: 23, text: 'A book has <b>100</b> pages. You have read <b>23</b>. How many pages are left?', icon: '📖', pre: '', unit: '' },
    { n: 32, text: 'A box held <b>100</b> pencils. <b>32</b> were used. How many are left?', icon: '✏️', pre: '', unit: '' },
  ];

  var deck = null;
  function buildDeck() {
    var used = {};
    function take(list) {
      var pool = U.shuffle(list).filter(function (n) { return !used[n]; });
      used[pool[0]] = true;
      return pool[0];
    }
    var tens = U.range(1, 9).map(function (k) { return k * 10; });
    var fives = U.range(1, 9).map(function (k) { return k * 10 + 5; }).concat([5]).filter(function (n) { return n > 10; });
    var any = U.range(11, 98).filter(function (n) { return n % 5 !== 0 && n !== 19; }); // 19 is on a learn screen
    var tiny = [2, 3, 4, 6, 7, 8, 9, 91, 93, 94, 96, 97, 98, 99];
    var story = U.pick(STORIES);
    used[story.n] = true;
    var q = [];
    q.push({ type: 'type', n: take(tens), square: 'always' });
    q.push({ type: 'type', n: take(fives), square: 'always' });
    q.push({ type: 'type', n: take(tens), square: 'always' });
    q.push({ type: 'type', n: take(fives), square: 'always' });
    q.push({ type: 'type', n: take(any), square: 'after' });
    q.push({ type: 'type', n: take(any), square: 'after' });
    q.push({ type: 'type', n: take(any), square: 'after' });
    q.push({ type: 'type', n: take(tiny), square: 'after' });
    q.push(fixTable(take, any));
    q.push({ type: 'story', n: story.n, story: story });
    return q;
  }

  /** Three rows "n + x = 100": one or two of them are wrong in a typical way. */
  function fixTable(take, any) {
    var rows = [take(any), take(any), take(any)].map(function (n) {
      return { n: n, x: partner(n), wrong: false };
    });
    var wrongCount = U.pick([1, 2]);
    U.shuffle([0, 1, 2]).slice(0, wrongCount).forEach(function (i) {
      var n = rows[i].n;
      var options = [rev(n), 110 - n, partner(n) + 10, partner(n) - 10].filter(function (x) {
        return x != null && x > 0 && x < 100 && x !== partner(n);
      });
      rows[i].x = U.pick(options);
      rows[i].wrong = true;
    });
    return { type: 'fix', rows: rows };
  }

  /* ---------- practice renderers ---------- */

  function renderType(stage, api, q) {
    var n = q.n;
    var p = partner(n);
    api.say(q.square === 'always' ? 'The shaded squares show ' + n + '. How many squares are empty?' : 'What makes 100? Use bonds to 10.', 'think');
    var eq = MQ.ui.prompt(n + ' + <span class="b100-blank">?</span> = 100');
    eq.classList.add('b100-eq');
    stage.appendChild(eq);
    var sqHolder = el('div', { class: 'b100-sqwrap' });
    var row = el('div', { class: 'b100-learnrow' });
    stage.appendChild(row);
    var sq = null;
    function showSquare() {
      if (sq) return;
      sq = hundredSquare({ labels: true });
      sq.shade(n);
      sqHolder.appendChild(sq.el);
    }
    if (q.square === 'always') showSquare();
    var work = el('div', { class: 'b100-reveal' });
    var lastWrong = null;
    var input = MQ.ui.numberInput({
      label: 'Partner to 100',
      onSubmit: function (x) {
        if (x === p) {
          input.good();
          input.disable();
          eq.innerHTML = n + ' + <span class="b100-blank b100-filled">' + p + '</span> = 100';
          showSquare();
          sq.split(n);
          api.check(true, 'Yes! ' + n + ' + ' + p + ' = 100.');
          return;
        }
        if (x === lastWrong) {
          api.feedback('You tried ' + x + ' already. Try a different number.', 'info');
          return;
        }
        lastWrong = x;
        input.bad();
        showSquare();
        var m = mistake(n, x);
        api.check(false, api.tries() >= 1 ? m.hint + ' ' + strongHint(n) : m.hint, m.tag);
        input.focus();
      },
    });
    row.appendChild(input.el);
    row.appendChild(sqHolder);
    stage.appendChild(work);
    input.focus();
    api.onReveal(function () {
      input.setValue(p);
      input.good();
      input.disable();
      eq.innerHTML = n + ' + <span class="b100-blank b100-filled">' + p + '</span> = 100';
      showSquare();
      sq.split(n);
      work.appendChild(bondWorking(n));
      api.feedback(n + ' + ' + p + ' = 100', 'info');
    });
  }

  function renderStory(stage, api, q) {
    var s = q.story;
    var n = s.n;
    var p = partner(n);
    api.say('Find the partner of ' + n + ' to make 100.', 'think');
    stage.appendChild(el('div', { class: 'b100-story' }, el('span', { class: 'b100-story-icon' }, s.icon), el('span', { html: s.text })));
    var sqHolder = el('div', { class: 'b100-sqwrap' });
    var work = el('div', { class: 'b100-reveal' });
    var sq = null;
    function showSquare() {
      if (sq) return;
      sq = hundredSquare({ labels: true });
      sq.shade(n);
      sqHolder.appendChild(sq.el);
    }
    var lastWrong = null;
    var input = MQ.ui.numberInput({
      prefix: s.pre || null,
      unit: s.unit || null,
      label: 'Answer',
      onSubmit: function (x) {
        if (x === p) {
          input.good();
          input.disable();
          showSquare();
          sq.split(n);
          api.check(true, 'Yes! ' + n + ' + ' + p + ' = 100, so the answer is ' + s.pre + p + (s.unit ? ' ' + s.unit : '') + '.');
          return;
        }
        if (x === lastWrong) {
          api.feedback('You tried ' + x + ' already. Try a different number.', 'info');
          return;
        }
        lastWrong = x;
        input.bad();
        showSquare();
        var m = mistake(n, x);
        api.check(false, (api.tries() >= 1 ? m.hint + ' ' + strongHint(n) : 'This is ' + n + ' + ? = 100. ' + m.hint), m.tag);
        input.focus();
      },
    });
    stage.appendChild(el('div', { class: 'b100-learnrow' }, input.el, sqHolder));
    stage.appendChild(work);
    input.focus();
    api.onReveal(function () {
      input.setValue(p);
      input.good();
      input.disable();
      showSquare();
      sq.split(n);
      work.appendChild(bondWorking(n));
      api.feedback('100 − ' + n + ' = ' + p + ', because ' + n + ' + ' + p + ' = 100.', 'info');
    });
  }

  function renderFix(stage, api, q) {
    api.say('Bolt wrote this table. Some partners are wrong. Click the wrong ones.', 'think');
    stage.appendChild(MQ.ui.prompt('Click every row that is <b>wrong</b>, then press Check.'));
    var marked = [false, false, false];
    var table = el('div', { class: 'b100-table' });
    var rowEls = q.rows.map(function (r, i) {
      var mark = el('span', { class: 'b100-mark' }, '');
      var fix = el('span', { class: 'b100-fixv' }, '');
      var b = el('button', { class: 'b100-trow', type: 'button' }, el('span', { class: 'b100-tsum' }, r.n + ' + ' + r.x + ' = 100'), fix, mark);
      b.addEventListener('click', function () {
        if (b.disabled) return;
        marked[i] = !marked[i];
        b.classList.toggle('b100-marked', marked[i]);
        mark.textContent = marked[i] ? '✗ wrong' : '';
        MQ.sound('click');
      });
      b.mark = mark;
      b.fix = fix;
      table.appendChild(b);
      return b;
    });
    stage.appendChild(table);
    var checkBtn = el('button', { class: 'btn', type: 'button' }, 'Check');
    stage.appendChild(checkBtn);
    var work = el('div', { class: 'b100-reveal' });
    stage.appendChild(work);

    function showFixes() {
      rowEls.forEach(function (b, i) {
        var r = q.rows[i];
        b.disabled = true;
        b.classList.remove('b100-marked');
        b.classList.add(r.wrong ? 'b100-bad' : 'b100-ok');
        b.mark.textContent = r.wrong ? '✗' : '✓';
        b.fix.textContent = r.wrong ? '→ ' + r.n + ' + ' + partner(r.n) : '';
      });
      checkBtn.disabled = true;
    }

    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      if (marked.indexOf(true) === -1) {
        api.feedback('Click the rows you think are wrong first. Add each row: does it make 100?', 'info');
        return;
      }
      var missed = [];
      var extra = [];
      q.rows.forEach(function (r, i) {
        if (r.wrong && !marked[i]) missed.push(r);
        if (!r.wrong && marked[i]) extra.push(r);
      });
      if (!missed.length && !extra.length) {
        showFixes();
        api.check(true, 'Well spotted! The wrong rows are fixed in green.');
        return;
      }
      var hint;
      var tag;
      if (extra.length) {
        var e = extra[0];
        hint = e.n + ' + ' + e.x + ' really is 100: ones ' + (e.n % 10) + ' + ' + (e.x % 10) + ' = 10, tens make 9. That row is right.';
        tag = 'Marked a correct partner as wrong';
      } else {
        var m = missed[0];
        hint = api.tries() >= 1 ? 'Look at ' + m.n + ' + ' + m.x + ' = ' + (m.n + m.x) + '. That is not 100!' : 'One wrong row is not marked yet. Add each row: does it make exactly 100?';
        tag = 'Missed a wrong partner';
      }
      api.check(false, hint, tag);
    });

    api.onReveal(function () {
      showFixes();
      q.rows.forEach(function (r) {
        work.appendChild(el('div', { class: 'b100-work' + (r.wrong ? '' : ' b100-work-ok') }, r.wrong ? r.n + ' + ' + r.x + ' = ' + (r.n + r.x) + ' ✗   Right partner: ' + r.n + ' + ' + partner(r.n) + ' = 100' : r.n + ' + ' + r.x + ' = 100 ✓'));
      });
      api.feedback('Add each row. Only the green ones make exactly 100.', 'info');
    });
  }

  /* ---------- learn screens ---------- */

  function learnShade(stage, api) {
    api.lockNext();
    api.say('Click the squares to shade 35. Then we count the empty ones.');
    var eq = MQ.ui.prompt('35 + <span class="b100-blank">?</span> = 100');
    eq.classList.add('b100-eq');
    stage.appendChild(eq);
    var count = el('div', { class: 'b100-count' }, 'Shaded: 0');
    var done = false;
    var sq = hundredSquare({
      labels: true,
      onPick: function (k) {
        if (done) return;
        sq.shade(k);
        count.textContent = 'Shaded: ' + k;
        MQ.sound('pop');
        if (k === 35) {
          done = true;
          sq.el.classList.remove('b100-click');
          api.feedback('35 shaded: 3 full rows and 5 more. Now count the empty squares.', 'good');
          stage.appendChild(countBtn);
        } else {
          api.feedback(k < 35 ? 'Shaded ' + k + '. Keep going to 35. (Click a square to shade up to it.)' : 'Shaded ' + k + '. That is too many. Click an earlier square.', 'info');
        }
      },
    });
    stage.appendChild(el('div', { class: 'b100-sqwrap' }, sq.el));
    stage.appendChild(count);
    var countBtn = el('button', { class: 'btn', type: 'button' }, 'Count the empty squares');
    countBtn.addEventListener('click', function () {
      countBtn.disabled = true;
      sq.split(35);
      eq.innerHTML = '35 + <span class="b100-blank b100-filled">65</span> = 100';
      api.sound('correct');
      api.say('First finish the row: 5. Then the full rows: 60. 5 + 60 = 65!', 'cheer');
      api.feedback('35 + 65 = 100', 'good');
      api.unlockNext();
    });
    api.feedback('Click a square to shade up to it. Each row has 10.', 'info');
  }

  function learnRule(stage, api) {
    api.lockNext();
    api.say('Here is a quick trick: the ones make 10, and the tens make 9.');
    stage.appendChild(MQ.ui.lesson('Ones make 10, tens make 9', '<span class="b100-t">3</span><span class="b100-o">5</span> + <span class="b100-t">6</span><span class="b100-o">5</span> = 100 &nbsp; → &nbsp; <span class="b100-o">5 + 5 = 10</span>, &nbsp; <span class="b100-t">3 + 6 = 9</span>'));
    var sq = hundredSquare({ labels: true });
    sq.shade(53);
    stage.appendChild(MQ.ui.prompt('Your turn: <span class="b100-t">5</span><span class="b100-o">3</span> + <span class="b100-blank">?</span> = 100'));
    var row = el('div', { class: 'b100-learnrow' });
    var input = MQ.ui.numberInput({
      label: 'Partner of 53',
      onSubmit: function (x) {
        if (x === 47) {
          input.good();
          input.disable();
          sq.split(53);
          api.sound('correct');
          api.say('Yes! 3 + 7 = 10 and 5 + 4 = 9. 53 + 47 = 100.', 'cheer');
          api.feedback('Ones: 3 + 7 = 10. Tens: 5 + 4 = 9. 53 + 47 = 100.', 'good');
          api.unlockNext();
        } else {
          input.bad();
          api.sound('wrong');
          var m = mistake(53, x);
          api.feedback(m.hint + ' Ones: 3 and what make 10? Tens: 5 and what make 9?', 'try');
        }
      },
    });
    row.appendChild(input.el);
    row.appendChild(sq.el);
    stage.appendChild(row);
    input.focus();
  }

  function learnFix(stage, api) {
    api.lockNext();
    api.say('Oops! I wrote 19 + 91 = 100. Is that right?', 'oops');
    stage.appendChild(MQ.ui.prompt('Bolt wrote: 19 + 91 = 100'));
    var sq = hundredSquare({ labels: true });
    sq.shade(19);
    var holder = el('div', { class: 'b100-sqwrap' });
    holder.appendChild(sq.el);
    var showBtn = el('button', { class: 'btn', type: 'button' }, 'Count the empty squares');
    stage.appendChild(holder);
    stage.appendChild(showBtn);
    var lower = el('div', { class: 'b100-reveal' });
    stage.appendChild(lower);
    showBtn.addEventListener('click', function () {
      showBtn.disabled = true;
      sq.split(19);
      api.say('1 to finish the row, then 80 in full rows. So what is the partner of 19?', 'think');
      var ch = MQ.ui.choices(
        [
          { label: '91', value: 91 },
          { label: '81', value: 81 },
        ],
        function (v) {
          if (v === 81) {
            ch.mark(81, 'good');
            ch.disable();
            api.sound('correct');
            api.say('Yes! 19 + 81 = 100. Swapping the digits does not work.', 'cheer');
            api.feedback('Ones: 9 + 1 = 10. Tens: 1 + 8 = 9. 19 + 81 = 100.', 'good');
            api.unlockNext();
          } else {
            ch.mark(91, 'bad');
            api.sound('wrong');
            api.feedback('19 + 91 = 110. Too much! Count the empty squares: 1 + 80.', 'try');
          }
        },
        { columns: 2 }
      );
      lower.appendChild(ch);
    });
  }

  MQ.register('bonds-to-100', {
    learn: [learnShade, learnRule, learnFix],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'fix') renderFix(stage, api, q);
        else if (q.type === 'story') renderStory(stage, api, q);
        else renderType(stage, api, q);
      },
    },
  });

  var css = [
    '.b100-sqwrap{display:flex;justify-content:center;width:100%;max-width:490px;min-width:0}',
    '.b100-learnrow>.b100-sqwrap{width:auto;flex:1 1 300px}',
    '.b100-sq{width:100%;height:auto}',
    '.b100-cell{fill:#fff;stroke:#c9d3df;stroke-width:1}',
    '.b100-click .b100-cell{cursor:pointer}',
    '.b100-click .b100-cell:hover{fill:#e8f1ff}',
    '.b100-on{fill:#8fb8ff}',
    '.b100-row{fill:#ffd166}',
    '.b100-rows{fill:#bfe9c9}',
    '.b100-frame{fill:none;stroke:#1d2b3a;stroke-width:2}',
    '.b100-lbl{font-size:15px;font-weight:800}',
    '.b100-lbl-row{fill:#9a6b00}',
    '.b100-lbl-rows{fill:#1d7a3a}',
    '.b100-eq{font-size:2rem}',
    '.b100-blank{display:inline-block;min-width:60px;border-bottom:4px solid var(--accent);color:var(--ink-soft)}',
    '.b100-filled{color:var(--good)}',
    '.b100-count{font-size:1.2rem;font-weight:800}',
    '.b100-reveal{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%}',
    '.b100-work{background:var(--info-bg);border-radius:14px;padding:8px 16px;font-size:1.1rem;font-weight:700;display:flex;flex-direction:column;gap:2px;max-width:640px}',
    '.b100-work-ok{background:var(--good-bg)}',
    '.b100-work-total{font-size:1.3rem;font-weight:800;color:var(--good)}',
    '.b100-t{color:#1f5fbf;font-weight:800}',
    '.b100-o{color:#c26a00;font-weight:800}',
    '.b100-learnrow{display:flex;align-items:center;gap:20px;justify-content:center;flex-wrap:wrap;width:100%}',
    '.b100-learnrow>.b100-sq{max-width:300px!important}',
    '.b100-story{display:flex;align-items:center;gap:14px;background:#fff;border:3px solid var(--line);border-radius:16px;padding:12px 18px;font-size:1.25rem;font-weight:700;max-width:700px}',
    '.b100-story b{color:#0b6e66}',
    '.b100-story-icon{font-size:2.4rem}',
    '.b100-table{display:flex;flex-direction:column;gap:8px;width:100%;max-width:520px}',
    '.b100-trow{display:flex;align-items:center;gap:12px;background:#fff;border:3px solid var(--line);border-radius:14px;padding:10px 16px;font-size:1.4rem;font-weight:800;cursor:pointer;font-family:inherit;color:var(--ink);text-align:left}',
    '.b100-trow:hover:not(:disabled){border-color:var(--accent)}',
    '.b100-tsum{flex:1}',
    '.b100-marked{border-color:var(--try);background:var(--try-bg)}',
    '.b100-mark{color:var(--try);font-size:1.1rem}',
    '.b100-fixv{color:var(--good)}',
    '.b100-ok{border-color:var(--good);background:var(--good-bg)}',
    '.b100-ok .b100-mark{color:var(--good)}',
    '.b100-bad{border-color:var(--try)}',
    '.b100-trow:disabled{cursor:default}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'bonds-to-100' }, css));
})();

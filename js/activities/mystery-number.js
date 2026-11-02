/* Mystery Number — find a hidden number by trial and improvement (Unit 9.2).
 * Guess, check, then make the guess better using what the check told you.
 * Equal-bags questions (? + ? = 34) keep halving as addition: guess, add it to itself, compare.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var FACE = '🙂';

  /* ---------- puzzles ----------
   * kind 'sub':    a − ? = b   (answer a − b)
   * kind 'add':    b + ? = a   (answer a − b)
   * kind 'double': ? + ? = t   (answer t ÷ 2, found by doubling guesses)
   */
  function makeSub(a, b, story, icon, pre) {
    return { kind: 'sub', a: a, b: b, answer: a - b, story: story, icon: icon, pre: pre || '' };
  }
  function makeAdd(a, b, story, icon, pre) {
    return { kind: 'add', a: a, b: b, answer: a - b, story: story, icon: icon, pre: pre || '' };
  }
  function makeDouble(t, story, icon, pre) {
    return { kind: 'double', t: t, answer: t / 2, story: story, icon: icon, pre: pre || '' };
  }

  function target(p) {
    return p.kind === 'double' ? p.t : p.kind === 'sub' ? p.b : p.a;
  }
  function result(p, g) {
    if (p.kind === 'sub') return p.a - g;
    if (p.kind === 'add') return p.b + g;
    return g + g;
  }
  function workingText(p, g) {
    if (p.kind === 'sub') return p.a + ' − ' + g + ' = ' + (p.a - g);
    if (p.kind === 'add') return p.b + ' + ' + g + ' = ' + (p.b + g);
    return g + ' + ' + g + ' = ' + (g + g);
  }
  /** -1 guess too small, 1 guess too big, 0 just right. */
  function verdict(p, g) {
    var r = result(p, g);
    var t = target(p);
    if (r === t) return 0;
    if (p.kind === 'sub') return r > t ? -1 : 1;
    return r < t ? -1 : 1;
  }
  function faceSpan() {
    return '<span class="myn-face">' + FACE + '</span>';
  }
  function equationHtml(p, g) {
    var x = g == null ? faceSpan() : '<span class="myn-filled">' + g + '</span>';
    if (p.kind === 'sub') return p.a + ' − ' + x + ' = ' + p.b;
    if (p.kind === 'add') return p.b + ' + ' + x + ' = ' + p.a;
    return x + ' + ' + x + ' = ' + p.t;
  }

  /* Level 1: within 100, one of each kind. */
  function level1() {
    var out = [];
    var a = U.rand(55, 95);
    var ans = U.rand(15, 40);
    if (ans % 10 === 0) ans += 3;
    out.push(makeSub(a, a - ans, 'A box had <b>' + a + '</b> pencils. Some were taken out. <b>' + (a - ans) + '</b> are left. How many were taken out?', '✏️'));
    var half = U.pick([10, 11, 12, 13, 14, 15, 16, 18, 22, 23, 24]); // not 17 (learn screen), 19/21/28 (level 2)
    out.push(makeDouble(half * 2, 'Two bags have the <b>same</b> number of marbles. Together they have <b>' + half * 2 + '</b>. How many in each bag?', '🫙'));
    var total = U.rand(60, 98);
    var have = U.rand(25, total - 15);
    out.push(makeAdd(total, have, 'A shelf has <b>' + have + '</b> books. Some more are put on it. Now there are <b>' + total + '</b>. How many were put on?', '📚'));
    return U.shuffle(out);
  }

  /* Level 2: the book and workbook problems (3-digit numbers and equal shares). */
  var L2_DIFF = [
    function () { return makeSub(243, 151, '<b>243</b> people are in the park. <b>151</b> of them are children. How many adults?', '🌳'); },
    function () { return makeSub(364, 83, 'A shop had <b>364</b> newspapers. At the end of the day <b>83</b> are left. How many were sold?', '📰'); },
    function () { return makeSub(354, 171, 'A car trip is <b>354</b> km. There are <b>171</b> km still to go. How far has the car gone?', '🚗'); },
    function () { return makeAdd(764, 392, 'A school has <b>764</b> children. <b>392</b> are girls. How many are boys?', '🏫'); },
  ];
  var L2_HALF = [
    function () { return makeDouble(38, 'Two footballs cost the <b>same</b>. Together they cost <b>$38</b>. How much is one football?', '⚽', '$'); },
    function () { return makeDouble(42, 'Two packets have the <b>same</b> number of sweets. Together there are <b>42</b>. How many in each packet?', '🍬'); },
    function () { return makeDouble(56, 'Two boxes have the <b>same</b> number of crayons. Together there are <b>56</b>. How many in each box?', '🖍️'); },
  ];
  function level2() {
    var d = U.shuffle(L2_DIFF);
    return U.shuffle([d[0](), d[1](), U.pick(L2_HALF)()]);
  }

  /* Level 3: missing tens digits.  H1 a O − H2 b O = D, where D = 100(H1 − H2) + 10(a − b). */
  function digitPuzzle(h1, h2, o, d) {
    var pairs = [];
    for (var a = 0; a <= 9; a++) {
      var b = a - d;
      if (b >= 0 && b <= 9) pairs.push([a, b]);
    }
    return { kind: 'digits', h1: h1, h2: h2, o: o, d: d, D: 100 * (h1 - h2) + 10 * d, pairs: pairs, same: Math.abs(d) % 2 === 0 };
  }
  function level3() {
    var book = digitPuzzle(3, 1, 7, -4); // 3?7 − 1?7 = 160
    var other;
    do {
      var h1 = U.rand(4, 9);
      var h2 = U.rand(1, h1 - 1);
      var d = U.pick([-5, -3, -1, 1, 3, 5]); // odd gap: one odd and one even digit
      other = digitPuzzle(h1, h2, U.rand(1, 9), d);
    } while (other.D < 100);
    return [book, other];
  }

  var deck = null;
  function buildDeck() {
    return level1().concat(level2(), level3());
  }

  /* ---------- drawings ---------- */

  /** Bar model drawn to scale: whole on top, the two parts below, the mystery part highlighted. */
  function barModel(p) {
    var W = 560;
    var x0 = 20;
    var whole = p.kind === 'double' ? p.t : p.a;
    var known = p.kind === 'double' ? p.answer : p.b;
    var mystery = p.answer;
    var unit = W / whole;
    var root = svg('svg', { viewBox: '0 0 600 130', class: 'myn-bar', role: 'img', 'aria-label': 'bar model' });
    root.appendChild(svg('rect', { x: x0, y: 10, width: W, height: 44, rx: 6, class: 'myn-bar-whole' }));
    root.appendChild(svg('text', { x: x0 + W / 2, y: 40, 'text-anchor': 'middle', class: 'myn-bar-txt' }, p.pre + whole));
    var kw = known * unit;
    root.appendChild(svg('rect', { x: x0, y: 70, width: kw, height: 44, rx: 6, class: p.kind === 'double' ? 'myn-bar-mys' : 'myn-bar-known' }));
    root.appendChild(svg('text', { x: x0 + kw / 2, y: 100, 'text-anchor': 'middle', class: 'myn-bar-txt' }, p.pre + known));
    root.appendChild(svg('rect', { x: x0 + kw, y: 70, width: mystery * unit, height: 44, rx: 6, class: 'myn-bar-mys' }));
    root.appendChild(svg('text', { x: x0 + kw + (mystery * unit) / 2, y: 100, 'text-anchor': 'middle', class: 'myn-bar-txt' }, FACE + ' ' + p.pre + mystery));
    return root;
  }

  /** Marbles in a bag, in rows of 5 so they are easy to count. */
  function bagSvg(n) {
    var per = 5;
    var rows = Math.ceil(Math.max(n, 1) / per);
    var H = 40 + Math.max(rows, 4) * 22;
    var root = svg('svg', { viewBox: '0 0 150 ' + H, class: 'myn-bag', role: 'img', 'aria-label': n + ' marbles' });
    root.appendChild(svg('path', { d: 'M20 22 Q15 ' + (H - 6) + ' 75 ' + (H - 4) + ' Q135 ' + (H - 6) + ' 130 22 Z', class: 'myn-bag-body' }));
    root.appendChild(svg('rect', { x: 40, y: 8, width: 70, height: 16, rx: 6, class: 'myn-bag-tie' }));
    for (var i = 0; i < n; i++) {
      var r = Math.floor(i / per);
      var c = i % per;
      root.appendChild(svg('circle', { cx: 35 + c * 20, cy: 40 + r * 22, r: 8, class: 'myn-marble' }));
    }
    return root;
  }

  function sceneCard(p) {
    return el('div', { class: 'myn-scene' }, el('div', { class: 'myn-scene-icon' }, p.icon), el('div', { class: 'myn-scene-text', html: p.story }));
  }

  /* ---------- the guess–check–improve tool ---------- */
  /**
   * opts.onTry(g, v) is called for each new guess (v = verdict). Returns the tool.
   */
  function guessTool(p, opts) {
    var wrap = el('div', { class: 'myn-tool' });
    var eq = el('div', { class: 'myn-eq', html: equationHtml(p) });
    var table = el('div', { class: 'myn-tries' });
    var tried = {};
    var input = MQ.ui.numberInput({
      button: 'Check my guess',
      label: 'Your guess',
      prefix: p.pre ? p.pre : null,
      onSubmit: function (g) {
        if (g !== Math.floor(g) || g < 0) {
          opts.feedback('Use a whole number for your guess.');
          return;
        }
        if (tried[g]) {
          opts.feedback('You already tried ' + p.pre + g + '. Look at the table and pick a new number.');
          input.focus();
          return;
        }
        tried[g] = true;
        var v = verdict(p, g);
        addRow(g, v);
        input.clear();
        opts.onTry(g, v);
        if (v !== 0) input.focus();
      },
    });
    function addRow(g, v) {
      var label = v === 0 ? 'Just right!' : v < 0 ? 'Too small ⬆' : 'Too big ⬇';
      table.appendChild(
        el(
          'div',
          { class: 'myn-row myn-' + (v === 0 ? 'ok' : v < 0 ? 'small' : 'big') },
          el('span', { class: 'myn-row-g' }, p.pre + g),
          el('span', { class: 'myn-row-w' }, workingText(p, g)),
          el('span', { class: 'myn-row-v' }, label)
        )
      );
    }
    wrap.appendChild(eq);
    wrap.appendChild(input.el);
    wrap.appendChild(table);
    return {
      el: wrap,
      input: input,
      solve: function () {
        eq.innerHTML = equationHtml(p, p.pre + p.answer);
        if (!tried[p.answer]) addRow(p.answer, 0);
        tried[p.answer] = true;
        input.disable();
      },
    };
  }

  /** Short feedback for one guess: what the check shows and which way to go. */
  function tryMessage(p, g, v) {
    var r = result(p, g);
    var t = target(p);
    var w = workingText(p, g) + '. ';
    if (p.kind === 'sub') {
      return v < 0 ? w + 'That leaves ' + r + ', more than ' + t + '. Take away more: try a bigger number.' : w + 'That leaves ' + r + ', less than ' + t + '. You took away too much: try a smaller number.';
    }
    if (p.kind === 'add') {
      return v < 0 ? w + r + ' is less than ' + t + '. Try a bigger number.' : w + r + ' is more than ' + t + '. Try a smaller number.';
    }
    return v < 0 ? w + r + ' is less than ' + t + '. Put more in each one: try a bigger number.' : w + r + ' is more than ' + t + '. Take some out of each one: try a smaller number.';
  }

  function working(p) {
    var lines = [];
    if (p.kind === 'double') {
      lines.push('Both parts are the same. ' + p.answer + ' + ' + p.answer + ' = ' + p.t + ', so each one is ' + p.pre + p.answer + '.');
    } else if (p.kind === 'sub') {
      lines.push('The mystery number is the gap between ' + p.a + ' and ' + p.b + ': ' + p.a + ' − ' + p.b + ' = ' + p.answer + '.');
      lines.push('Check: ' + p.a + ' − ' + p.answer + ' = ' + p.b + ' ✓');
    } else {
      lines.push('The mystery number is the gap between ' + p.b + ' and ' + p.a + ': ' + p.a + ' − ' + p.b + ' = ' + p.answer + '.');
      lines.push('Check: ' + p.b + ' + ' + p.answer + ' = ' + p.a + ' ✓');
    }
    return el(
      'div',
      { class: 'myn-work' },
      lines.map(function (l) {
        return el('div', null, l);
      })
    );
  }

  /* ---------- practice renderers ---------- */

  function renderGuess(stage, api, p) {
    api.say(p.kind === 'double' ? 'Guess one part. Add it to itself. Too big or too small?' : 'Make a sensible guess, then check it.', 'think');
    stage.appendChild(sceneCard(p));
    var lo = -Infinity; // biggest guess that was too small
    var hi = Infinity; // smallest guess that was too big
    var misses = 0;
    var shown = el('div', { class: 'myn-reveal' });
    var tool = guessTool(p, {
      feedback: function (msg) {
        api.feedback(msg, 'info');
      },
      onTry: function (g, v) {
        if (v === 0) {
          tool.solve();
          shown.appendChild(barModel(p));
          api.check(true, 'Just right! ' + workingText(p, g) + '.');
          return;
        }
        misses++;
        var wrongWay = g <= lo || g >= hi;
        if (v < 0) lo = Math.max(lo, g);
        else hi = Math.min(hi, g);
        var t = target(p);
        var off = Math.abs(result(p, g) - t);
        if (wrongWay) {
          var msg =
            api.tries() === 0
              ? 'Look at the table. ' + (lo > -Infinity ? p.pre + lo + ' was too small, ' : '') + (hi < Infinity ? p.pre + hi + ' was too big, ' : '') + 'so the mystery number is ' + (lo > -Infinity && hi < Infinity ? 'between them.' : lo > -Infinity ? 'bigger than ' + p.pre + lo + '.' : 'smaller than ' + p.pre + hi + '.')
              : 'Use your last check: ' + workingText(p, g) + ' is ' + off + ' away from ' + t + '. ' + (p.kind === 'double' ? 'Change your number a little, then add it to itself again.' : 'Change your guess by about ' + off + '.');
          api.check(false, msg, 'Adjusted in the wrong direction');
        } else if (misses >= 4 && misses % 2 === 0) {
          api.check(
            false,
            workingText(p, g) + ' is ' + off + ' away from ' + t + '. ' + (p.kind === 'double' ? 'Change your number by a little, then add it to itself again.' : 'Change your guess by about ' + off + '.'),
            'Random guessing'
          );
        } else {
          api.feedback(tryMessage(p, g, v), 'info');
          api.say(v < 0 ? 'Too small. Go bigger!' : 'Too big. Go smaller!', 'think');
        }
      },
    });
    stage.appendChild(tool.el);
    stage.appendChild(shown);
    tool.input.focus();
    api.onReveal(function () {
      tool.solve();
      MQ.clear(shown);
      shown.appendChild(barModel(p));
      shown.appendChild(working(p));
      api.feedback('The mystery number is ' + p.pre + p.answer + '.', 'info');
    });
  }

  function digitBox(value, onChange) {
    var v = value;
    var num = el('div', { class: 'myn-dial-num' }, String(v));
    var box = el(
      'div',
      { class: 'myn-dial' },
      el('button', { class: 'myn-dial-btn', type: 'button', 'aria-label': 'up', onclick: function () { set(v === 9 ? 0 : v + 1); } }, '▲'),
      num,
      el('button', { class: 'myn-dial-btn', type: 'button', 'aria-label': 'down', onclick: function () { set(v === 0 ? 9 : v - 1); } }, '▼')
    );
    function set(n) {
      if (box.disabled_) return;
      v = n;
      num.textContent = String(v);
      MQ.sound('click');
      onChange(v);
    }
    box.get = function () {
      return v;
    };
    box.set = function (n) {
      v = n;
      num.textContent = String(n);
    };
    box.lock = function () {
      box.disabled_ = true;
      box.classList.add('myn-dial-off');
    };
    return box;
  }

  function digitsSum(q, a, b) {
    var top = q.h1 * 100 + a * 10 + q.o;
    var bot = q.h2 * 100 + b * 10 + q.o;
    return { top: top, bot: bot, diff: top - bot };
  }

  function digitRule(q) {
    var n = Math.abs(q.d);
    var hund = 100 * (q.h1 - q.h2);
    var lines = [
      'The ones are the same (' + q.o + ' − ' + q.o + ' = 0), so they cancel.',
      'The hundreds give ' + q.h1 + '00 − ' + q.h2 + '00 = ' + hund + '.',
    ];
    if (q.d < 0) lines.push(hund + ' − ' + n * 10 + ' = ' + q.D + ', so the bottom tens digit is ' + n + ' more than the top one.');
    else lines.push(hund + ' + ' + n * 10 + ' = ' + q.D + ', so the top tens digit is ' + n + ' more than the bottom one.');
    return lines;
  }

  function renderDigits(stage, api, q) {
    api.say('Turn the two dials. Find TWO ways to make it true.', 'think');
    stage.appendChild(MQ.ui.prompt('Find the missing tens digits. Find <b>two</b> different answers.'));
    var found = [];
    var wrongChecks = 0;
    var a0 = 0;
    var b0 = 0;
    var touched = false;
    var dA = digitBox(a0, function () { touched = true; });
    var dB = digitBox(b0, function () { touched = true; });
    var sumEl = el(
      'div',
      { class: 'myn-dsum' },
      el('div', { class: 'myn-dline' }, el('span', { class: 'myn-dig' }, String(q.h1)), dA, el('span', { class: 'myn-dig' }, String(q.o))),
      el('div', { class: 'myn-dline' }, el('span', { class: 'myn-op' }, '−'), el('span', { class: 'myn-dig' }, String(q.h2)), dB, el('span', { class: 'myn-dig' }, String(q.o))),
      el('div', { class: 'myn-dline myn-dres' }, el('span', { class: 'myn-op' }, '='), el('span', { class: 'myn-dig' }, String(q.D)))
    );
    var list = el('div', { class: 'myn-found' }, el('div', { class: 'myn-found-h' }, 'Answers found:'));
    var checkBtn = el('button', { class: 'btn', type: 'button' }, 'Check');
    var lower = el('div', { class: 'myn-lower' });
    stage.appendChild(el('div', { class: 'myn-digits' }, sumEl, el('div', { class: 'myn-side' }, checkBtn, list)));
    stage.appendChild(lower);

    function addFound(a, b) {
      var s = digitsSum(q, a, b);
      list.appendChild(el('div', { class: 'myn-found-row' }, s.top + ' − ' + s.bot + ' = ' + s.diff + ' ✓'));
    }

    checkBtn.addEventListener('click', function () {
      if (api.isAnswered() || found.length >= 2) return;
      if (!touched) {
        api.feedback('Turn the dials with ▲ and ▼ to choose two digits first.', 'info');
        return;
      }
      var a = dA.get();
      var b = dB.get();
      var s = digitsSum(q, a, b);
      if (s.diff === q.D) {
        if (found.some(function (f) { return f[0] === a && f[1] === b; })) {
          api.feedback('You already found that one. Find a different pair of digits.', 'info');
          return;
        }
        found.push([a, b]);
        addFound(a, b);
        MQ.sound('pop');
        if (found.length === 1) {
          api.say('Yes! Now find a different pair.', 'happy');
          api.feedback(s.top + ' − ' + s.bot + ' = ' + q.D + '. One found! Find another.', 'good');
        } else {
          askParity();
        }
        return;
      }
      wrongChecks++;
      var msgBase = s.top + ' − ' + s.bot + ' = ' + s.diff + ', not ' + q.D + '. ';
      if (a === b) {
        api.check(false, msgBase + 'The two missing digits do not have to be the same. Try different digits.', 'Assumed the two digits are the same');
      } else if (wrongChecks % 3 === 0) {
        api.check(false, msgBase + (api.tries() === 0 ? 'The ones cancel out. Look at the hundreds: ' + q.h1 + '00 − ' + q.h2 + '00 = ' + 100 * (q.h1 - q.h2) + '. How many tens are needed to make ' + q.D + '?' : digitRule(q).join(' ')), 'Random guessing');
      } else {
        api.feedback(msgBase + (s.diff > q.D ? 'Too big: make the top tens digit smaller or the bottom one bigger.' : 'Too small: make the top tens digit bigger or the bottom one smaller.'), 'info');
      }
    });

    function askParity() {
      dA.lock();
      dB.lock();
      checkBtn.disabled = true;
      api.say('Two answers! Now look at the digits in each pair.', 'cheer');
      api.feedback('Look at the two missing digits in each answer.', 'good');
      lower.appendChild(MQ.ui.prompt('The two missing digits in each answer are...'));
      var opts = [
        { label: 'Both odd or both even', value: 'same' },
        { label: 'One odd and one even', value: 'mixed' },
      ];
      var ch = MQ.ui.choices(
        opts,
        function (v) {
          var ok = (v === 'same') === q.same;
          if (ok) {
            ch.mark(v, 'good');
            ch.disable();
            api.check(true, q.same ? 'Yes! The digits are ' + Math.abs(q.d) + ' apart, so they are both odd or both even.' : 'Yes! The digits are ' + Math.abs(q.d) + ' apart, so one is odd and one is even.');
          } else {
            ch.mark(v, 'bad');
            var eg = found.map(function (f) { return f[0] + ' and ' + f[1]; }).join(', ');
            api.check(false, 'Look at your digits: ' + eg + '. Say odd or even for each one.', 'Mixed up odd and even');
          }
        },
        { columns: 2 }
      );
      ch.classList.add('myn-parity');
      lower.appendChild(ch);
      lower.choices = ch;
    }

    api.onReveal(function () {
      dA.lock();
      dB.lock();
      checkBtn.disabled = true;
      MQ.clear(list);
      list.appendChild(el('div', { class: 'myn-found-h' }, 'All the answers:'));
      q.pairs.forEach(function (pr) {
        addFound(pr[0], pr[1]);
      });
      dA.set(q.pairs[0][0]);
      dB.set(q.pairs[0][1]);
      MQ.clear(lower);
      lower.appendChild(
        el(
          'div',
          { class: 'myn-work' },
          digitRule(q).map(function (l) {
            return el('div', null, l);
          }),
          el('div', null, 'Digits ' + Math.abs(q.d) + ' apart are ' + (q.same ? 'both odd or both even.' : 'one odd and one even.'))
        )
      );
      api.feedback('There are ' + q.pairs.length + ' answers. Here they all are.', 'info');
    });
  }

  /* ---------- learn screens ---------- */

  function learnMuseum(stage, api) {
    api.lockNext();
    var p = makeSub(147, 63, '<b>147</b> people visit a museum. <b>63</b> are adults. The rest are children. How many children?', '🏛️');
    api.say('How many children? I will guess, check, and improve.');
    stage.appendChild(sceneCard(p));
    var eq = el('div', { class: 'myn-eq', html: equationHtml(p) });
    stage.appendChild(eq);
    var rows = el('div', { class: 'myn-tries' });
    var btnRow = el('div', { class: 'myn-btns' });
    var extra = el('div', { class: 'myn-reveal' });
    stage.appendChild(btnRow);
    stage.appendChild(rows);
    stage.appendChild(extra);

    function row(g) {
      var v = verdict(p, g);
      rows.appendChild(
        el(
          'div',
          { class: 'myn-row myn-' + (v === 0 ? 'ok' : v < 0 ? 'small' : 'big') },
          el('span', { class: 'myn-row-g' }, String(g)),
          el('span', { class: 'myn-row-w' }, workingText(p, g)),
          el('span', { class: 'myn-row-v' }, v === 0 ? 'Just right!' : v < 0 ? 'Too small ⬆' : 'Too big ⬇')
        )
      );
    }
    var b1 = el('button', { class: 'btn', type: 'button' }, 'Check 47');
    btnRow.appendChild(b1);
    api.feedback('Bolt guesses 47 first, because 147 − 47 is easy. Press the button.', 'info');
    b1.addEventListener('click', function () {
      b1.disabled = true;
      MQ.sound('click');
      row(47);
      api.say('147 − 47 = 100. We need 63. 100 is 37 too many!', 'think');
      api.feedback('100 − 63 = 37 too many left. So take away 37 more: 47 + 37 = 84.', 'info');
      var b2 = el('button', { class: 'btn', type: 'button' }, 'Check 84');
      btnRow.appendChild(b2);
      b2.addEventListener('click', function () {
        b2.disabled = true;
        row(84);
        eq.innerHTML = equationHtml(p, 84);
        extra.appendChild(barModel(p));
        api.sound('correct');
        api.say('147 − 84 = 63. Just right! 84 children.', 'cheer');
        api.feedback('Guess, check, improve. That is called trial and improvement.', 'good');
        api.unlockNext();
      });
    });
  }

  function learnBags(stage, api) {
    api.lockNext();
    var T = 34;
    var n = 15;
    api.say('Two bags have the same number of marbles. Together: 34.');
    stage.appendChild(MQ.ui.lesson('Two equal bags make 34', 'Put the same number in each bag.'));
    var bags = el('div', { class: 'myn-bags' });
    var sumEl = el('div', { class: 'myn-eq' });
    var minus = el('button', { class: 'btn btn-ghost', type: 'button' }, '− 1 from each bag');
    var plus = el('button', { class: 'btn', type: 'button' }, '+ 1 in each bag');
    stage.appendChild(bags);
    stage.appendChild(sumEl);
    stage.appendChild(el('div', { class: 'myn-btns' }, minus, plus));
    function draw() {
      MQ.clear(bags);
      bags.appendChild(el('div', { class: 'myn-bagbox' }, bagSvg(n), el('div', { class: 'myn-bag-n' }, String(n))));
      bags.appendChild(el('div', { class: 'myn-plus' }, '+'));
      bags.appendChild(el('div', { class: 'myn-bagbox' }, bagSvg(n), el('div', { class: 'myn-bag-n' }, String(n))));
      var tot = n + n;
      sumEl.innerHTML = n + ' + ' + n + ' = <b>' + tot + '</b>' + (tot === T ? ' ✓' : '');
      if (tot === T) {
        plus.disabled = true;
        minus.disabled = true;
        api.sound('correct');
        api.say('17 + 17 = 34. Each bag has 17!', 'cheer');
        api.feedback('Add your guess to itself and compare. No sharing sums needed!', 'good');
        api.unlockNext();
      } else {
        api.feedback(tot + (tot < T ? ' is less than 34. Add one more to each bag.' : ' is more than 34. Take one out of each bag.'), 'info');
      }
    }
    plus.addEventListener('click', function () {
      if (n < 25) {
        n++;
        MQ.sound('pop');
        draw();
      }
    });
    minus.addEventListener('click', function () {
      if (n > 10) {
        n--;
        MQ.sound('pop');
        draw();
      }
    });
    draw();
  }

  function learnYourTurn(stage, api) {
    api.lockNext();
    var p = makeSub(80, 45, 'There were <b>80</b> apples on a tree. Some were picked. <b>45</b> are left. How many were picked?', '🍎');
    api.say('Your turn! Type a guess and check it.', 'happy');
    stage.appendChild(sceneCard(p));
    var tool = guessTool(p, {
      feedback: function (m) {
        api.feedback(m, 'info');
      },
      onTry: function (g, v) {
        if (v === 0) {
          tool.solve();
          api.sound('correct');
          api.say('Just right! 80 − 35 = 45.', 'cheer');
          api.feedback('You found it! Now let\'s practise.', 'good');
          api.unlockNext();
        } else {
          api.feedback(tryMessage(p, g, v), 'info');
          api.say(v < 0 ? 'Too small. Go bigger!' : 'Too big. Go smaller!', 'think');
        }
      },
    });
    stage.appendChild(tool.el);
    tool.input.focus();
  }

  MQ.register('mystery-number', {
    learn: [learnMuseum, learnBags, learnYourTurn],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.kind === 'digits') renderDigits(stage, api, q);
        else renderGuess(stage, api, q);
      },
    },
  });

  var css = [
    '.myn-scene{display:flex;align-items:center;gap:14px;background:#fff;border:3px solid var(--line);border-radius:16px;padding:12px 18px;max-width:720px;width:100%;box-sizing:border-box}',
    '.myn-scene-icon{font-size:2.6rem;flex:none}',
    '.myn-scene-text{font-size:1.2rem;font-weight:700;line-height:1.4}',
    '.myn-scene-text b{color:#0b6e66}',
    '.myn-tool{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;max-width:720px}',
    '.myn-eq{font-size:2rem;font-weight:800;text-align:center}',
    '.myn-eq b{color:#0b6e66}',
    '.myn-face{display:inline-block;background:#fff3cd;border:3px solid var(--gold);border-radius:999px;padding:0 6px;line-height:1.3}',
    '.myn-filled{display:inline-block;background:var(--good-bg);border:3px solid var(--good);color:var(--good);border-radius:12px;padding:0 10px}',
    '.myn-tries{display:flex;flex-direction:column;gap:6px;width:100%;max-width:520px}',
    '.myn-row{display:grid;grid-template-columns:70px 1fr 130px;align-items:center;gap:8px;background:#fff;border:2px solid var(--line);border-radius:12px;padding:6px 12px;font-size:1.15rem;font-weight:800}',
    '.myn-row-g{color:var(--ink-soft)}',
    '.myn-row-v{text-align:right}',
    '.myn-small .myn-row-v,.myn-big .myn-row-v{color:#9a5b00}',
    '.myn-ok{border-color:var(--good);background:var(--good-bg)}',
    '.myn-ok .myn-row-v{color:var(--good)}',
    '.myn-btns{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}',
    '.myn-reveal{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.myn-bar{width:100%;max-width:600px;height:auto}',
    '.myn-bar-whole{fill:#e8f1ff;stroke:#4d96ff;stroke-width:2}',
    '.myn-bar-known{fill:#f1f3f5;stroke:#9aa5b1;stroke-width:2}',
    '.myn-bar-mys{fill:#fff3cd;stroke:#e0a800;stroke-width:2}',
    '.myn-bar-txt{font-size:20px;font-weight:800;fill:#1d2b3a}',
    '.myn-work{background:var(--info-bg);border-radius:14px;padding:10px 16px;font-size:1.15rem;font-weight:700;display:flex;flex-direction:column;gap:4px;max-width:640px}',
    '.myn-bags{display:flex;align-items:center;gap:12px;justify-content:center;flex-wrap:wrap}',
    '.myn-bagbox{display:flex;flex-direction:column;align-items:center}',
    '.myn-bag{width:150px;max-width:40vw;height:auto}',
    '.myn-bag-body{fill:#f6efe3;stroke:#b08a5a;stroke-width:3}',
    '.myn-bag-tie{fill:#b08a5a}',
    '.myn-marble{fill:#4d96ff;stroke:#1f5fbf;stroke-width:1.5}',
    '.myn-bag-n{font-size:1.6rem;font-weight:800}',
    '.myn-plus{font-size:2rem;font-weight:800}',
    '.myn-digits{display:flex;gap:28px;align-items:center;justify-content:center;flex-wrap:wrap}',
    '.myn-dsum{display:flex;flex-direction:column;align-items:flex-end;gap:6px;background:#fff;border:3px solid var(--line);border-radius:16px;padding:12px 20px}',
    '.myn-dline{display:flex;align-items:center;gap:6px}',
    '.myn-dres{border-top:4px solid var(--ink);padding-top:6px}',
    '.myn-dig{font-size:2.4rem;font-weight:800;min-width:34px;text-align:center}',
    '.myn-op{font-size:2.2rem;font-weight:800;margin-right:8px}',
    '.myn-dial{display:flex;flex-direction:column;align-items:center;background:#fff3cd;border:3px solid var(--gold);border-radius:12px;width:56px}',
    '.myn-dial-num{font-size:2.2rem;font-weight:800;line-height:1.1}',
    '.myn-dial-btn{border:0;background:transparent;font-size:1rem;cursor:pointer;width:100%;padding:2px 0;color:#7a5a00}',
    '.myn-dial-btn:hover{background:#ffe8a3}',
    '.myn-dial-off{opacity:.7}',
    '.myn-dial-off .myn-dial-btn{cursor:default;visibility:hidden}',
    '.myn-side{display:flex;flex-direction:column;gap:10px;align-items:flex-start;min-width:220px}',
    '.myn-found{display:flex;flex-direction:column;gap:4px;font-size:1.15rem;font-weight:800}',
    '.myn-found-h{color:var(--ink-soft);font-size:1rem}',
    '.myn-found-row{color:var(--good)}',
    '.myn-lower{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}',
    '@media (max-width:640px){.myn-row{grid-template-columns:50px 1fr 100px;font-size:1rem}.myn-eq{font-size:1.6rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'mystery-number' }, css));
})();

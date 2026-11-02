/* Digit sum detective — find digit sums (always down to one digit) and test the surprising
 * pattern they make in additions (Unit 3, Project 1). Every answer is computed from the numbers drawn.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var U = MQ.util;

  /* ---------------- maths ---------------- */
  function digits(n) {
    return String(n).split('').map(Number);
  }
  function digitTotal(n) {
    return digits(n).reduce(function (a, b) {
      return a + b;
    }, 0);
  }
  /** Each squeeze step: [number, its digits, their total], until one digit is left. */
  function steps(n) {
    var out = [];
    while (n >= 10) {
      var t = digitTotal(n);
      out.push([n, digits(n), t]);
      n = t;
    }
    return out;
  }
  function ds(n) {
    while (n >= 10) n = digitTotal(n);
    return n;
  }
  function sum(list) {
    return list.reduce(function (a, b) {
      return a + b;
    }, 0);
  }

  /* ---------------- the squeezer machine ---------------- */
  /** A machine for one number. Each click on Squeeze adds the digits once. */
  function squeezer(api, n, opts) {
    opts = opts || {};
    var cur = n;
    var done = n < 10;
    var stepsEl = el('div', { class: 'dsd-steps' });
    var res = el('div', { class: 'dsd-res' }, done ? 'Digit sum ' + n : '');
    var btn = el('button', { class: 'btn dsd-btn', type: 'button', disabled: done ? true : null }, 'Squeeze ▼');
    var box = el('div', { class: 'dsd-sq' + (opts.small ? ' dsd-sq-s' : '') }, el('div', { class: 'dsd-num' }, String(n)), el('div', { class: 'dsd-funnel' }), stepsEl, btn, res);
    function step(silent) {
      if (done) return;
      var t = digitTotal(cur);
      var row = el('div', { class: 'dsd-step' }, digits(cur).join(' + ') + ' = ', el('b', null, String(t)));
      if (t >= 10) row.appendChild(el('span', { class: 'dsd-more' }, ' two digits!'));
      stepsEl.appendChild(row);
      cur = t;
      if (!silent) api.sound('pop');
      if (cur < 10) {
        done = true;
        btn.disabled = true;
        btn.hidden = true;
        res.textContent = 'Digit sum ' + cur;
        box.classList.add('dsd-done');
        if (opts.onDone) opts.onDone(cur);
      } else if (opts.onStep) opts.onStep(cur);
    }
    btn.addEventListener('click', function () {
      step(false);
    });
    box.runAll = function () {
      while (!done) step(true);
    };
    box.isDone = function () {
      return done;
    };
    return box;
  }

  /** "22 + 41 = 63" with a small squeezer under each number. */
  function additionMachines(api, addends, total, onAllDone) {
    var nums = addends.concat([total]);
    var left = nums.length;
    var results = [];
    var row = el('div', { class: 'dsd-add' });
    var machines = nums.map(function (n, i) {
      var m = squeezer(api, n, {
        small: true,
        onDone: function (v) {
          results[i] = v;
          left--;
          if (!left && onAllDone) onAllDone(results);
        },
      });
      if (n < 10) {
        results[i] = n;
        left--;
      }
      if (i) row.appendChild(el('div', { class: 'dsd-op' }, i === nums.length - 1 ? '=' : '+'));
      row.appendChild(m);
      return m;
    });
    row.machines = machines;
    row.runAll = function () {
      machines.forEach(function (m) {
        m.runAll();
      });
    };
    return row;
  }

  /* ---------------- learn screens ---------------- */
  function learnSqueeze(stage, api) {
    api.say('To find a digit sum, add the digits. Keep going until only one digit is left!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('The digit squeezer', 'Click <b>Squeeze</b> to add the digits.'));
    var row = el('div', { class: 'dsd-row' });
    stage.appendChild(row);
    var first = squeezer(api, 76, {
      onStep: function (v) {
        api.say(v + ' has two digits. Squeeze again!', 'think');
      },
      onDone: function (v) {
        api.say('One digit! The digit sum of 76 is ' + v + '. Now try 435.', 'cheer');
        row.appendChild(
          squeezer(api, 435, {
            onStep: function (w) {
              api.say(w + ' has two digits. Squeeze again!', 'think');
            },
            onDone: function (w) {
              api.say('4 + 3 + 5 = 12, then 1 + 2 = ' + w + '. The digit sum of 435 is ' + w + '!', 'cheer');
              api.feedback('Keep squeezing until one digit is left.', 'good');
              api.unlockNext();
            },
          })
        );
      },
    });
    row.appendChild(first);
  }

  function learnNotice(stage, api) {
    api.say('22 + 41 = 63. Squeeze all three numbers. What do you notice?');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Digit sums in an addition', 'Squeeze each number.'));
    var ask = el('div', { class: 'dsd-ask' });
    stage.appendChild(
      additionMachines(api, [22, 41], 63, function (r) {
        ask.appendChild(MQ.ui.prompt('Add the first two digit sums: ' + r[0] + ' + ' + r[1] + ' = ?'));
        var ch = MQ.ui.choices(
          [8, 9, 10],
          function (v) {
            if (v === r[0] + r[1]) {
              ch.mark(v, 'good');
              ch.disable();
              api.sound('correct');
              api.say(r[0] + ' + ' + r[1] + ' = 9, and 63 squeezes to 9 too. The same!', 'cheer');
              api.feedback('The digit sums of the parts add up to the digit sum of the total.', 'good');
              api.unlockNext();
            } else {
              ch.mark(v, 'bad');
              api.sound('wrong');
              api.feedback('Count on: ' + r[0] + ' and ' + r[1] + ' more.', 'try');
            }
          },
          { columns: 3 }
        );
        ask.appendChild(ch);
      })
    );
    stage.appendChild(ask);
  }

  function learnHarder(stage, api) {
    api.say('Try 45 + 24 = 69. Squeeze all three.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Does it still work?', 'Squeeze each number.'));
    var ask = el('div', { class: 'dsd-ask' });
    stage.appendChild(
      additionMachines(api, [45, 24], 69, function (r) {
        var t = r[0] + r[1];
        api.say(r[0] + ' + ' + r[1] + ' = ' + t + '. That has two digits, so squeeze ' + t + ' too!', 'think');
        ask.appendChild(el('div', { class: 'dsd-line' }, r[0] + ' + ' + r[1] + ' = ' + t));
        ask.appendChild(
          squeezer(api, t, {
            small: true,
            onDone: function (v) {
              api.say(t + ' squeezes to ' + v + ', and 69 squeezes to ' + r[2] + '. The same again! Let\'s test if it always works.', 'cheer');
              api.feedback('Always squeeze down to one digit.', 'good');
              api.unlockNext();
            },
          })
        );
      })
    );
    stage.appendChild(ask);
  }

  /* ---------------- deck ---------------- */
  var deck = null;

  function buildDeck() {
    var used = {};
    function fresh(gen, test) {
      for (var i = 0; i < 500; i++) {
        var n = gen();
        if (!used[n] && (!test || test(n))) {
          used[n] = true;
          return n;
        }
      }
      return gen();
    }
    var q = [];
    // Level 1: 2-digit numbers (one step and two steps)
    var two = function () {
      return U.rand(11, 99);
    };
    var notTen = function (n) {
      return n % 10 !== 0;
    };
    var l1 = [
      fresh(two, function (n) { return notTen(n) && digitTotal(n) < 10; }),
      fresh(two, function (n) { return digitTotal(n) >= 10; }),
      fresh(two, function (n) { return digitTotal(n) >= 10; }),
    ];
    U.shuffle(l1).forEach(function (n) {
      q.push({ type: 'single', n: n, ans: ds(n) });
    });
    // Level 2: 3-digit numbers, always reduce to one digit
    var three = function () {
      return U.rand(100, 999);
    };
    var l2 = [
      fresh(three, function (n) { return digitTotal(n) >= 10; }),
      fresh(three, function (n) { return digitTotal(n) >= (Math.random() < 0.3 ? 19 : 10); }),
      fresh(three, function (n) { return n % 100 !== 0; }),
    ];
    U.shuffle(l2).forEach(function (n) {
      q.push({ type: 'single', n: n, ans: ds(n) });
    });
    // Level 3a: find all the digit sums in an addition and predict
    var addends;
    for (var k = 0; k < 500; k++) {
      if (Math.random() < 0.4) addends = [U.rand(11, 99), U.rand(11, 99), U.rand(11, 99)];
      else {
        var shape = U.pick([[2, 2], [3, 2], [3, 3]]);
        addends = shape.map(function (d) {
          return d === 2 ? U.rand(11, 99) : U.rand(101, 899);
        });
      }
      var tot = sum(addends);
      var sds = sum(addends.map(ds));
      if (tot <= 999 && (sds >= 10 || Math.random() < 0.3)) break;
    }
    q.push({ type: 'pattern', addends: addends, total: sum(addends), sums: addends.map(ds), pred: ds(sum(addends.map(ds))), totalDs: ds(sum(addends)) });
    // Level 3b: is this total right? (a wrong total forgets the regrouped ten)
    var a;
    var b;
    do {
      a = U.rand(120, 799);
      b = U.rand(Math.random() < 0.5 ? 12 : 101, 199);
    } while (a + b > 999 || (a % 10) + (b % 10) < 10);
    var real = a + b;
    var right = Math.random() < 0.35;
    var shown = right ? real : real - 10;
    q.push({ type: 'checkSum', addends: [a, b], real: real, shown: shown, right: right, match: ds(ds(a) + ds(b)) === ds(shown) });
    return q;
  }

  /* ---------------- practice ---------------- */
  function singleHint(q, x, strong) {
    var st = steps(q.n);
    if (x === q.n) return ['That is the number itself. Add its digits: ' + digits(q.n).join(' + ') + '.', 'Did not add the digits'];
    var sums = st.map(function (s) {
      return s[2];
    });
    if (x >= 10 && sums.indexOf(x) >= 0) return [x + ' is right so far, but it has two digits. Squeeze again: ' + digits(x).join(' + ') + '.', 'Stopped at a 2-digit answer'];
    if (x >= 10) return ['A digit sum is always one digit. Add the digits, then add again if you need to.', 'Stopped at a 2-digit answer'];
    if (strong) return ['Step by step: ' + digits(q.n).join(' + ') + ' = ' + st[0][2] + (st[0][2] >= 10 ? '. Then squeeze ' + st[0][2] + '.' : '.'), 'Added the digits wrongly'];
    return ['Add the digits again carefully: ' + digits(q.n).join(' + ') + '.', 'Added the digits wrongly'];
  }

  function renderSingle(stage, api, q) {
    api.say(q.n >= 100 ? 'Three digits! Add them all, then squeeze again if you need to.' : 'Add the digits. Is it one digit yet?', 'think');
    stage.appendChild(MQ.ui.prompt('What is the digit sum of <b>' + q.n + '</b>?'));
    stage.appendChild(el('div', { class: 'dsd-sq dsd-sq-q' }, el('div', { class: 'dsd-num' }, String(q.n)), el('div', { class: 'dsd-funnel' })));
    var show = el('div', { class: 'dsd-show' });
    var box = MQ.ui.numberInput({
      label: 'Digit sum',
      onSubmit: function (x) {
        if (x === q.ans) {
          box.good();
          box.disable();
          api.check(true, 'Yes! The digit sum of ' + q.n + ' is ' + q.ans + '.');
          return;
        }
        box.bad();
        var h = singleHint(q, x, api.tries() >= 1);
        api.check(false, h[0], h[1]);
      },
    });
    stage.appendChild(box.el);
    stage.appendChild(show);
    box.focus();
    api.onReveal(function () {
      box.setValue(String(q.ans));
      box.good();
      box.disable();
      var m = squeezer(api, q.n);
      m.runAll();
      show.appendChild(m);
      api.feedback(
        steps(q.n)
          .map(function (s) {
            return s[1].join(' + ') + ' = ' + s[2];
          })
          .join(', then ') + '. One digit: ' + q.ans + '.',
        'info'
      );
    });
  }

  function smallInput(label) {
    var input = el('input', { class: 'num-input dsd-in', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': label, placeholder: '?' });
    return input;
  }

  function renderPattern(stage, api, q) {
    api.say('Find the digit sum of each number. Then add them and squeeze. Does it match the total?', 'think');
    stage.appendChild(MQ.ui.prompt('Test the pattern on <b>' + q.addends.join(' + ') + ' = ' + q.total + '</b>'));
    var inputs = [];
    var grid = el('div', { class: 'dsd-grid' });
    q.addends.forEach(function (n) {
      var inp = smallInput('Digit sum of ' + n);
      inputs.push(inp);
      grid.appendChild(el('label', { class: 'dsd-cell' }, el('span', { class: 'dsd-cell-n' }, String(n)), el('span', { class: 'dsd-cell-l' }, 'digit sum'), inp));
    });
    var predIn = smallInput('Digit sums added and squeezed');
    var totIn = smallInput('Digit sum of ' + q.total);
    inputs.push(predIn, totIn);
    var row2 = el(
      'div',
      { class: 'dsd-grid' },
      el('label', { class: 'dsd-cell dsd-cell-wide' }, el('span', { class: 'dsd-cell-l' }, 'Add the digit sums, then squeeze'), predIn),
      el('label', { class: 'dsd-cell' }, el('span', { class: 'dsd-cell-n' }, String(q.total)), el('span', { class: 'dsd-cell-l' }, 'digit sum'), totIn)
    );
    stage.appendChild(grid);
    stage.appendChild(row2);
    var btn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    stage.appendChild(btn);
    var show = el('div', { class: 'dsd-show' });
    stage.appendChild(show);
    var want = q.sums.concat([q.pred, q.totalDs]);
    function go() {
      if (btn.disabled) return;
      var vals = inputs.map(function (i) {
        return i.value.trim() === '' ? NaN : Number(i.value.trim());
      });
      if (vals.some(isNaN)) return api.feedback('Fill in every box with a number.', 'info');
      var firstBad = -1;
      vals.forEach(function (v, i) {
        var ok = v === want[i];
        inputs[i].classList.remove('good', 'bad');
        inputs[i].classList.add(ok ? 'good' : 'bad');
        if (!ok && firstBad < 0) firstBad = i;
      });
      if (firstBad < 0) {
        inputs.forEach(function (i) {
          i.disabled = true;
        });
        btn.disabled = true;
        api.check(true, 'They match: ' + q.pred + ' and ' + q.totalDs + '. The pattern works again!');
        return;
      }
      var v = vals[firstBad];
      var strong = api.tries() >= 1;
      var nA = q.addends.length;
      if (firstBad < nA) {
        var h = singleHint({ n: q.addends[firstBad], ans: q.sums[firstBad] }, v, strong);
        api.check(false, 'Look at ' + q.addends[firstBad] + '. ' + h[0], h[1]);
      } else if (firstBad === nA) {
        var raw = sum(q.sums);
        if (v === raw && raw >= 10) api.check(false, q.sums.join(' + ') + ' = ' + raw + '. That has two digits, so squeeze it!', 'Forgot to squeeze the sum of digit sums');
        else if (v === q.total || v === sum(q.addends)) api.check(false, 'Add the digit sums from the boxes, not the numbers.', 'Added the numbers not the digits');
        else api.check(false, strong ? 'Add: ' + q.sums.join(' + ') + ' = ' + raw + (raw >= 10 ? ', then squeeze.' : '.') : 'Add your digit sums together, then squeeze to one digit.', 'Added the digits wrongly');
      } else {
        var h2 = singleHint({ n: q.total, ans: q.totalDs }, v, strong);
        api.check(false, 'Look at the total ' + q.total + '. ' + h2[0], h2[1]);
      }
    }
    btn.addEventListener('click', go);
    inputs.forEach(function (i) {
      i.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          go();
        }
      });
    });
    api.onReveal(function () {
      inputs.forEach(function (inp, i) {
        inp.value = String(want[i]);
        inp.classList.remove('bad');
        inp.classList.add('good');
        inp.disabled = true;
      });
      btn.disabled = true;
      var m = additionMachines(api, q.addends, q.total);
      m.runAll();
      show.appendChild(m);
      var raw = sum(q.sums);
      var pm = squeezer(api, raw, { small: true });
      pm.runAll();
      show.appendChild(el('div', { class: 'dsd-line' }, 'Digit sums: ' + q.sums.join(' + ') + ' = ' + raw));
      if (raw >= 10) show.appendChild(pm);
      api.feedback(q.sums.join(' + ') + ' = ' + raw + (raw >= 10 ? ' → ' + q.pred : '') + '. The total ' + q.total + ' → ' + q.totalDs + '. They match!', 'info');
    });
  }

  function renderCheckSum(stage, api, q) {
    api.say('Use the squeezers to check this sum. Do the digit sums match?', 'think');
    stage.appendChild(MQ.ui.prompt('Ben worked out <b>' + q.addends[0] + ' + ' + q.addends[1] + ' = ' + q.shown + '</b>. Is he right?'));
    var machines = additionMachines(api, q.addends, q.shown);
    stage.appendChild(machines);
    var show = el('div', { class: 'dsd-show' });
    var opts = [
      { label: 'Digit sums match. It looks right.', value: 'yes' },
      { label: 'Digit sums don\'t match. It is wrong.', value: 'no' },
    ];
    var correct = q.match ? 'yes' : 'no';
    var a = ds(q.addends[0]);
    var b = ds(q.addends[1]);
    var ch = MQ.ui.choices(
      opts,
      function (v) {
        if (v === correct) {
          ch.mark(v, 'good');
          ch.disable();
          api.check(true, q.match ? 'Yes! ' + a + ' + ' + b + ' squeezes to ' + ds(a + b) + ', the same as ' + q.shown + '.' : 'Yes! They don\'t match, so it is wrong. It should be ' + q.real + '.');
          if (!q.match) show.appendChild(el('div', { class: 'dsd-line' }, 'Correct: ' + q.addends[0] + ' + ' + q.addends[1] + ' = ' + q.real));
          return;
        }
        ch.mark(v, 'bad');
        api.check(
          false,
          api.tries() >= 1 ? 'Squeeze all three. Then add the first two digit sums and squeeze. Compare with ' + q.shown + '.' : 'Squeeze each number first. Add the two digit sums (and squeeze). Is it the same as the total\'s?',
          q.match ? 'Thought matching digit sums meant a wrong sum' : 'Did not compare the digit sums'
        );
      },
      { columns: 2 }
    );
    stage.appendChild(ch);
    stage.appendChild(show);
    api.onReveal(function () {
      ch.mark(correct, 'good');
      ch.disable();
      machines.runAll();
      var m = squeezer(api, a + b, { small: true });
      m.runAll();
      show.appendChild(el('div', { class: 'dsd-line' }, a + ' + ' + b + ' = ' + (a + b) + (a + b >= 10 ? ' → ' + ds(a + b) : '') + '. Total ' + q.shown + ' → ' + ds(q.shown) + (q.match ? '. Same!' : '. Not the same!')));
      if (!q.match) show.appendChild(el('div', { class: 'dsd-line' }, 'Correct: ' + q.addends[0] + ' + ' + q.addends[1] + ' = ' + q.real));
      api.feedback(q.match ? 'The digit sums match, so the sum looks right.' : 'The digit sums don\'t match, so the sum is wrong. He forgot the regrouped ten.', 'info');
    });
  }

  MQ.register('digit-sum-detective', {
    learn: [learnSqueeze, learnNotice, learnHarder],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0 || deck.length !== 8) deck = buildDeck();
        var q = deck[api.index];
        stage.__q = q;
        if (q.type === 'single') renderSingle(stage, api, q);
        else if (q.type === 'pattern') renderPattern(stage, api, q);
        else renderCheckSum(stage, api, q);
      },
    },
  });
  // Used only by the test scripts (deck checks); not used by the page.
  MQ.activities['digit-sum-detective']._test = { buildDeck: buildDeck, ds: ds, steps: steps };

  var css = [
    '.dsd-row{display:flex;flex-wrap:wrap;gap:20px;justify-content:center;align-items:flex-start}',
    '.dsd-sq{display:flex;flex-direction:column;align-items:center;gap:6px;background:#f3f8ff;border:3px solid var(--line);border-radius:18px;padding:10px 16px;min-width:200px}',
    '.dsd-sq.dsd-done{border-color:var(--good);background:var(--good-bg)}',
    '.dsd-num{font-size:2.6rem;font-weight:800;background:#fff;border:3px solid #9fb3d9;border-radius:14px;padding:0 18px;letter-spacing:.08em}',
    '.dsd-funnel{width:0;height:0;border-left:26px solid transparent;border-right:26px solid transparent;border-top:20px solid #9fb3d9}',
    '.dsd-steps{display:flex;flex-direction:column;align-items:center;gap:2px}',
    '.dsd-step{font-size:1.4rem;font-weight:700}',
    '.dsd-step b{color:#0b6e66}',
    '.dsd-more{font-size:.9rem;color:var(--try)}',
    '.dsd-res{font-size:1.3rem;font-weight:800;color:var(--good);min-height:1em}',
    '.dsd-sq-s{min-width:150px;padding:6px 10px;gap:3px}',
    '.dsd-sq-s .dsd-num{font-size:1.8rem;padding:0 12px}',
    '.dsd-sq-s .dsd-step{font-size:1.1rem}',
    '.dsd-sq-s .dsd-res{font-size:1.05rem}',
    '.dsd-sq-s .dsd-btn{min-height:42px;padding:6px 14px;font-size:.95rem}',
    '.dsd-sq-q{min-width:0}',
    '.dsd-add{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:flex-start}',
    '.dsd-op{font-size:2rem;font-weight:800;padding-top:14px;color:var(--ink-soft)}',
    '.dsd-ask{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.dsd-line{font-size:1.3rem;font-weight:800;text-align:center}',
    '.dsd-show{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.dsd-grid{display:flex;flex-wrap:wrap;gap:12px;justify-content:center}',
    '.dsd-cell{display:flex;flex-direction:column;align-items:center;gap:2px;background:#f3f8ff;border:2px solid var(--line);border-radius:14px;padding:6px 12px}',
    '.dsd-cell-n{font-size:1.6rem;font-weight:800}',
    '.dsd-cell-l{font-size:.9rem;font-weight:700;color:var(--ink-soft)}',
    '.dsd-cell-wide{max-width:260px}',
    '.dsd-in{width:80px;height:54px}',
    '@media (max-width:700px){.dsd-sq-s{min-width:120px}.dsd-op{font-size:1.5rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'digit-sum-detective' }, css));
})();

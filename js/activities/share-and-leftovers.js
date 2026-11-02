/* Share and Leftovers — division by sharing, with remainders (Unit 11.2).
 * Sweets are dealt one at a time onto plates, a round at a time. Sweets that cannot go
 * round drop into the "left over" jar: that is the remainder (14 ÷ 4 = 3 r2).
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var U = MQ.util;

  var COLORS = ['#e63946', '#f4a261', '#2a9d8f', '#457b9d', '#e76f9a', '#8ab17d'];

  function sweet(i) {
    return el('span', { class: 'sl-sweet', style: { background: COLORS[i % COLORS.length] } });
  }

  /* ------------------------------------------------------------------ *
   * The sharing table: a pile of sweets, d plates and a left-over jar.
   * ------------------------------------------------------------------ */
  function table(n, d, opts) {
    opts = opts || {};
    var state = { pile: n, plates: [], jar: 0, done: false };
    for (var i = 0; i < d; i++) state.plates.push(0);
    if (opts.plates) state.plates = opts.plates.slice();
    if (opts.jar != null) state.jar = opts.jar;
    if (opts.pile != null) state.pile = opts.pile;

    var pileBox = el('div', { class: 'sl-pile' });
    var pileLabel = el('div', { class: 'sl-label' });
    var plateEls = [];
    var platesRow = el('div', { class: 'sl-plates' });
    state.plates.forEach(function (c, i) {
      var inner = el('div', { class: 'sl-plate-in' });
      var count = el('div', { class: 'sl-count' });
      var p = el('div', { class: 'sl-plate' }, inner);
      plateEls.push({ wrap: el('div', { class: 'sl-plate-wrap' }, p, count), inner: inner, count: count, plate: p });
      platesRow.appendChild(plateEls[i].wrap);
    });
    var jarIn = el('div', { class: 'sl-jar-in' });
    var jarCount = el('div', { class: 'sl-count' });
    var jar = el('div', { class: 'sl-jar-wrap' }, el('div', { class: 'sl-jar' }, el('div', { class: 'sl-jar-lid' }), jarIn), el('div', { class: 'sl-label' }, 'left over'), jarCount);
    var root = el(
      'div',
      { class: 'sl-table' },
      el('div', { class: 'sl-pile-wrap' }, pileBox, pileLabel),
      el('div', { class: 'sl-share' }, platesRow, jar)
    );

    function draw() {
      MQ.clear(pileBox);
      for (var i = 0; i < state.pile; i++) pileBox.appendChild(sweet(i));
      pileBox.classList.toggle('sl-empty', state.pile === 0);
      pileLabel.textContent = state.pile === 1 ? '1 sweet to share' : state.pile + ' sweets to share';
      state.plates.forEach(function (c, k) {
        var pe = plateEls[k];
        MQ.clear(pe.inner);
        for (var j = 0; j < c; j++) pe.inner.appendChild(sweet(j + k));
        pe.count.textContent = String(c);
      });
      MQ.clear(jarIn);
      for (var m = 0; m < state.jar; m++) jarIn.appendChild(sweet(m + 3));
      jarCount.textContent = String(state.jar);
      jar.classList.toggle('sl-jar-full', state.jar > 0);
    }

    var t = {
      el: root,
      state: state,
      plateEls: plateEls,
      jarEl: jar,
      draw: draw,
      // Deal one sweet to every plate. If there are not enough to go round,
      // the rest go into the jar. Returns false when nothing more can be done.
      round: function () {
        if (state.done) return false;
        if (state.pile >= d) {
          state.pile -= d;
          for (var i = 0; i < d; i++) state.plates[i]++;
          MQ.sound('pop');
        } else {
          state.jar += state.pile;
          state.pile = 0;
          state.done = true;
          MQ.sound('click');
        }
        if (state.pile === 0) state.done = true;
        draw();
        return !state.done;
      },
      // Put everything back as at the start.
      reset: function () {
        state.pile = n;
        state.jar = 0;
        state.done = false;
        for (var i = 0; i < d; i++) state.plates[i] = 0;
        draw();
      },
    };
    draw();
    return t;
  }

  // Buttons that deal a round at a time, or everything (animated).
  function dealButtons(api, t, onDone) {
    var busy = false;
    var one = el('button', { class: 'btn', type: 'button' }, 'Deal a round');
    var all = el('button', { class: 'btn btn-ghost sl-all', type: 'button' }, 'Deal them all ▶▶');
    function finished() {
      one.disabled = true;
      all.disabled = true;
      if (onDone) onDone();
    }
    one.addEventListener('click', function () {
      if (busy || t.state.done) return;
      t.round();
      if (t.state.done) finished();
    });
    all.addEventListener('click', function () {
      if (busy || t.state.done) return;
      busy = true;
      (function step() {
        t.round();
        if (t.state.done) {
          busy = false;
          finished();
          return;
        }
        api.later(step, 260);
      })();
    });
    var wrap = el('div', { class: 'sl-btns' }, one, all);
    wrap.finishNow = function () {
      while (!t.state.done) t.round();
      one.disabled = true;
      all.disabled = true;
    };
    wrap.disable = function () {
      one.disabled = true;
      all.disabled = true;
    };
    return wrap;
  }

  function sentence(n, d, q, r) {
    return n + ' ÷ ' + d + ' = ' + q + (r ? ' r' + r : '');
  }

  // "3 + 3 + 3 + 3 = 12, + 2 left over = 14" as chips.
  function checkSum(n, d, q, r) {
    var parts = [];
    for (var i = 0; i < d; i++) parts.push(q);
    var row = el('div', { class: 'sl-check' });
    row.appendChild(el('span', { class: 'chip' }, d + ' plates × ' + q + ' = ' + parts.join(' + ') + ' = ' + q * d));
    if (r) row.appendChild(el('span', { class: 'chip' }, q * d + ' + ' + r + ' left over = ' + n));
    return row;
  }

  // Count in jumps of d: "4, 8, 12, … 28" up to q × d.
  function jumpCount(d, q) {
    var out = [];
    for (var i = 1; i <= q; i++) out.push(i * d);
    if (out.length > 12) return out.slice(0, 3).join(', ') + ', … ' + out.slice(-2).join(', ');
    return out.join(', ');
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */
  function learnShare(stage, api) {
    api.say('12 sweets, 4 plates. Let\'s share them fairly: one to each plate, round and round.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Share fairly', 'Press <b>Deal a round</b> to give one sweet to every plate.'));
    var t = table(12, 4);
    var out = el('div', { class: 'sl-out' });
    var btns = dealButtons(api, t, function () {
      out.appendChild(el('div', { class: 'sl-sentence' }, '12 ÷ 4 = 3'));
      api.say('Every plate has 3. None left over. 12 shared by 4 is 3.', 'cheer');
      api.feedback('12 ÷ 4 = 3. Each plate gets the same.', 'good');
      api.unlockNext();
    });
    stage.appendChild(t.el);
    stage.appendChild(btns);
    stage.appendChild(out);
  }

  function learnLeftover(stage, api) {
    api.say('Now 14 sweets on 4 plates. Deal them out.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Some left over', 'When there are not enough to go round, they go in the jar.'));
    var t = table(14, 4);
    var out = el('div', { class: 'sl-out' });
    var btns = dealButtons(api, t, function () {
      out.appendChild(el('div', { class: 'sl-sentence' }, '14 ÷ 4 = 3 ', el('span', { class: 'sl-r' }, 'r2')));
      out.appendChild(el('div', { class: 'sl-note' }, 'r means remainder: the ones left over.'));
      api.say('3 each, and 2 cannot go round. We write 14 ÷ 4 = 3 r2.', 'cheer');
      api.feedback('2 is the remainder. It is too few to give every plate one more.', 'good');
      api.unlockNext();
    });
    stage.appendChild(t.el);
    stage.appendChild(btns);
    stage.appendChild(out);
  }

  function learnCheck(stage, api) {
    api.say('Let\'s check 14 ÷ 4 = 3 r2. Click each plate to count, then click the jar.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Check it', 'Count the plates in jumps of 3, then add the jar.'));
    var t = table(14, 4, { plates: [3, 3, 3, 3], jar: 2, pile: 0 });
    t.state.done = true;
    t.draw();
    var total = 0;
    var clicked = 0;
    var running = el('div', { class: 'sl-sentence sl-running' }, '0');
    var jarDone = false;
    t.plateEls.forEach(function (pe) {
      pe.plate.classList.add('sl-click');
      pe.plate.addEventListener('click', function () {
        if (pe.plate.classList.contains('sl-counted')) return;
        pe.plate.classList.add('sl-counted');
        clicked++;
        total += 3;
        api.sound('pop');
        running.textContent = total + (clicked < 4 ? '' : '  (4 × 3 = 12)');
      });
    });
    t.jarEl.classList.add('sl-click');
    t.jarEl.addEventListener('click', function () {
      if (jarDone) return;
      if (clicked < 4) {
        api.feedback('Count all the plates first.', 'info');
        return;
      }
      jarDone = true;
      api.sound('correct');
      running.textContent = '12 + 2 = 14';
      stage.appendChild(checkSum(14, 4, 3, 2));
      api.say('4 × 3 = 12, and 2 more makes 14. It checks!', 'cheer');
      api.feedback('Plates × each + left over = the sweets we started with.', 'good');
      api.unlockNext();
    });
    stage.appendChild(t.el);
    stage.appendChild(running);
  }

  function learnTooBig(stage, api) {
    api.say('Oh no! Someone left 4 sweets in the jar. But there are 4 plates…');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Is this right?', '12 ÷ 4 = 2 r4 ?'));
    var t = table(12, 4, { plates: [2, 2, 2, 2], jar: 4, pile: 0 });
    var btn = el('button', { class: 'btn btn-big', type: 'button' }, 'Share the jar out');
    btn.addEventListener('click', function () {
      btn.disabled = true;
      t.state.jar = 0;
      for (var i = 0; i < 4; i++) t.state.plates[i]++;
      t.draw();
      api.sound('pop');
      stage.appendChild(el('div', { class: 'sl-sentence' }, '12 ÷ 4 = 3'));
      stage.appendChild(el('div', { class: 'sl-note' }, 'The remainder must be smaller than the number of plates.'));
      api.say('4 left over is enough for one more each! So 12 ÷ 4 = 3, nothing left.', 'cheer');
      api.feedback('If the jar has as many as the plates, deal again.', 'good');
      api.unlockNext();
    });
    stage.appendChild(t.el);
    stage.appendChild(btn);
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  var deck = null;

  function divQ(n, d, extra) {
    var q = { kind: 'div', n: n, d: d, q: Math.floor(n / d), r: n % d };
    if (extra) for (var k in extra) q[k] = extra[k];
    return q;
  }

  function buildDeck() {
    var out = [];
    var used = {};
    function add(q) {
      var key = q.kind + q.n + '/' + q.d;
      if (used[key]) return false;
      used[key] = true;
      out.push(q);
      return true;
    }
    function addFrom(gen) {
      for (var g = 0; g < 100; g++) if (add(gen())) return;
    }
    // Level 1: dividends 8–20, divisors 2 or 5, dealt on screen. Starts with 20 shared.
    add(divQ(20, U.pick([2, 3, 4, 5]), { deal: true }));
    addFrom(function () {
      return divQ(U.pick([9, 11, 13, 15, 17, 19]), 2, { deal: true });
    });
    addFrom(function () {
      var n;
      do {
        n = U.rand(8, 20);
      } while (n % 5 === 0);
      return divQ(n, 5, { deal: true });
    });
    // Level 2: dividends 10–35, divisors 3 or 4 (book: 28 ÷ 4, 32 ÷ 4, 10 ÷ 4, 30 ÷ 4 story).
    var l2 = [];
    l2.push(Math.random() < 0.5 ? divQ(30, 4, { story: true }) : divQ(U.pick([28, 32, 10]), 4));
    var d2 = U.pick([3, 4]);
    l2.push(function () {
      var m = U.rand(4, 8);
      return divQ(d2 * m, d2); // exact
    });
    l2.push(function () {
      var n;
      do {
        n = U.rand(10, 35);
      } while (n % 3 === 0);
      return divQ(n, 3, { story: Math.random() < 0.4 });
    });
    l2 = [l2[0]].concat(U.shuffle(l2.slice(1)));
    l2.forEach(function (x) {
      if (typeof x === 'function') addFrom(x);
      else add(x);
    });
    // Level 3: dividends 25–53, divisors 2–5, estimate first (book: 25 ÷ 2, 53 ÷ 5, 46 ÷ 3),
    // then a missing starting number (workbook p.159 Q12).
    var book = U.shuffle([divQ(25, 2), divQ(53, 5), divQ(46, 3)]);
    var l3 = [book[0], null];
    l3.forEach(function (x) {
      if (x) {
        x.estimate = true;
        add(x);
      } else
        addFrom(function () {
          var d = U.pick([2, 3, 4, 5]);
          var n;
          do {
            n = U.rand(25, 53);
          } while (n % d === 0);
          return divQ(n, d, { estimate: true });
        });
    });
    var miss = U.pick([
      [2, 7, 1],
      [3, 4, 2],
      [4, 7, 2],
      [3, 9, 1],
      [5, 6, 3],
      [4, 8, 3],
    ]);
    add({ kind: 'missing', d: miss[0], q: miss[1], r: miss[2], n: miss[0] * miss[1] + miss[2] });
    return out;
  }

  /* ------------------------------------------------------------------ *
   * Practice
   * ------------------------------------------------------------------ */
  function smallBox(label) {
    return el('input', { class: 'sl-box', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: 3, 'aria-label': label });
  }

  function estimateBand(q) {
    return q < 10 ? 0 : q < 20 ? 1 : 2;
  }
  var BANDS = ['fewer than 10', '10 to 19', '20 to 29'];

  function renderDiv(stage, api, q) {
    var n = q.n;
    var d = q.d;
    if (q.story) {
      api.say(n + ' sweets are shared equally by ' + d + ' children. How many each? How many left over?');
      stage.appendChild(el('div', { class: 'prompt' }, el('b', null, String(n)), ' sweets are shared equally by ', el('b', null, String(d)), ' children. How many does each child get? How many are left over?'));
    } else {
      api.say(api.level === 1 ? 'Deal the sweets onto the plates. Then fill in the boxes.' : 'Share ' + n + ' sweets between ' + d + ' plates.');
      stage.appendChild(el('div', { class: 'prompt' }, 'Share ', el('b', null, n + ' sweets'), ' equally between ', el('b', null, d + ' plates'), '.'));
    }
    var t = table(n, d);
    var btns = dealButtons(api, t, function () {
      if (q.deal) {
        answer.classList.remove('sl-hidden');
        key.classList.remove('sl-hidden');
        api.feedback('Now fill in the boxes.', 'info');
        focusFirst();
      }
    });
    var est = el('div', { class: 'sl-est' });
    var bq = smallBox('Each plate gets');
    var br = smallBox('Left over');
    var checkBtn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    var answer = el(
      'div',
      { class: 'sl-answer' + (q.deal || q.estimate ? ' sl-hidden' : '') },
      el('span', { class: 'sl-eq' }, n + ' ÷ ' + d + ' ='),
      bq,
      el('span', { class: 'sl-eq' }, 'r'),
      br,
      checkBtn
    );
    var hintLine = el('div', { class: 'sl-out' });
    if (q.deal) stage.appendChild(el('div', { class: 'sl-note' }, 'Deal first. The boxes appear when all the sweets are shared.'));
    stage.appendChild(t.el);
    stage.appendChild(btns);
    stage.appendChild(est);
    stage.appendChild(answer);
    var key = el('div', { class: 'sl-key' + (q.deal || q.estimate ? ' sl-hidden' : '') }, 'Write 0 in the r box if none are left over.');
    stage.appendChild(key);
    stage.appendChild(hintLine);
    if (q.estimate) btns.classList.add('sl-hidden');

    function focusFirst() {
      api.later(function () {
        try {
          bq.focus({ preventScroll: true });
        } catch (e) {}
      }, 30);
    }
    [bq, br].forEach(function (b) {
      b.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });
    });
    checkBtn.addEventListener('click', submit);

    var estimateDone = !q.estimate;
    var estCh = null;
    if (q.estimate) {
      api.say('First, estimate. About how many will each plate get?');
      est.appendChild(el('div', { class: 'sl-est-q' }, 'Estimate first: each plate gets…'));
      var band = estimateBand(q.q);
      estCh = MQ.ui.choices(
        BANDS.map(function (b, i) {
          return { label: b, value: i };
        }),
        function (v) {
          if (api.isAnswered() || estimateDone) return;
          if (v === band) {
            estCh.mark(v, 'good');
            estCh.disable();
            estimateDone = true;
            api.feedback('Good estimate! Now work it out exactly.', 'good');
            api.say('Good estimate! Now find the exact answer. You can deal the sweets if you like.', 'happy');
            answer.classList.remove('sl-hidden');
            key.classList.remove('sl-hidden');
            btns.classList.remove('sl-hidden');
            focusFirst();
            return;
          }
          estCh.mark(v, 'bad');
          var h = '10 on each plate would use 10 × ' + d + ' = ' + 10 * d + ' sweets. ';
          h += n < 10 * d ? n + ' is less than ' + 10 * d + ', so fewer than 10 each.' : '20 on each would use ' + 20 * d + '. ' + n + ' is ' + (n < 20 * d ? 'between them.' : 'more than that.');
          api.check(false, h, 'Estimated wrongly');
        },
        { columns: 3 }
      );
      est.appendChild(estCh);
    } else if (!q.deal) focusFirst();

    function lockAll() {
      bq.disabled = true;
      br.disabled = true;
      checkBtn.disabled = true;
      btns.disable();
    }

    function submit() {
      if (api.isAnswered() || !estimateDone) return;
      var a = bq.value.trim() === '' ? NaN : U.parseNum(bq.value);
      var r = br.value.trim() === '' ? 0 : U.parseNum(br.value);
      if (isNaN(a) || isNaN(r)) {
        bq.classList.add('shake');
        api.later(function () {
          bq.classList.remove('shake');
        }, 400);
        api.feedback('Write how many each plate gets, and how many are left over.', 'info');
        return;
      }
      if (br.value.trim() === '') br.value = '0';
      bq.classList.toggle('good', a === q.q);
      bq.classList.toggle('bad', a !== q.q);
      br.classList.toggle('good', r === q.r);
      br.classList.toggle('bad', r !== q.r);
      if (a === q.q && r === q.r) {
        lockAll();
        MQ.clear(hintLine);
        hintLine.appendChild(checkSum(n, d, q.q, q.r));
        api.check(true, 'Yes! ' + sentence(n, d, q.q, q.r) + '.');
        return;
      }
      var hint;
      var tag;
      var strong = api.tries() >= 1;
      if (a * d + r === n && r >= d) {
        tag = 'Remainder too big';
        hint = r + ' left over is enough to give every plate one more! The remainder must be smaller than ' + d + '.';
      } else if (a === q.q && r === 0 && q.r > 0) {
        tag = 'Forgot the remainder';
        hint = d + ' × ' + q.q + ' = ' + d * q.q + '. That leaves ' + n + ' − ' + d * q.q + '. How many are left over?';
      } else if (a === q.r && q.r !== q.q) {
        tag = 'Remainder written as the answer';
        hint = 'The first box is how many go on each plate. The r box is what is left over.';
      } else if (a === q.q) {
        tag = q.r === 0 ? 'Remainder too big' : 'Forgot the remainder';
        hint = d + ' plates × ' + q.q + ' = ' + d * q.q + '. How many of the ' + n + ' sweets are left?';
      } else {
        tag = 'Used the wrong table';
        hint = 'Check: ' + d + ' × ' + a + ' = ' + d * a + (d * a > n ? ', that is more than ' + n + '.' : '. Could each plate have one more?');
        if (strong) hint = 'Count in ' + d + 's: ' + jumpCount(d, q.q) + '. That is ' + q.q + ' jumps. ' + n + ' − ' + q.q * d + ' = ' + q.r + ' left.';
      }
      if (strong && tag !== 'Used the wrong table') hint += ' Try dealing the sweets to see.';
      api.check(false, hint, tag);
    }

    api.onReveal(function () {
      if (estCh) {
        estCh.mark(estimateBand(q.q), 'good');
        estCh.disable();
      }
      estimateDone = true;
      answer.classList.remove('sl-hidden');
      btns.classList.remove('sl-hidden');
      if (!t.state.done) {
        t.reset();
        btns.finishNow();
      }
      bq.value = q.q;
      br.value = q.r;
      bq.classList.remove('bad');
      br.classList.remove('bad');
      bq.classList.add('good');
      br.classList.add('good');
      lockAll();
      MQ.clear(hintLine);
      hintLine.appendChild(el('div', { class: 'sl-sentence' }, sentence(n, d, q.q, q.r)));
      hintLine.appendChild(el('div', { class: 'sl-note' }, 'Count in ' + d + 's: ' + jumpCount(d, q.q) + ' (' + q.q + ' each)'));
      hintLine.appendChild(checkSum(n, d, q.q, q.r));
      api.feedback(d + ' plates get ' + q.q + ' each (' + d + ' × ' + q.q + ' = ' + d * q.q + ')' + (q.r ? ' and ' + q.r + ' left over' : ', none left over') + '. ' + sentence(n, d, q.q, q.r) + '.', 'info');
    });
  }

  function renderMissing(stage, api, q) {
    api.say('The sweets are already shared. How many were there at the start?');
    stage.appendChild(el('div', { class: 'prompt' }, 'Some sweets were shared between ', el('b', null, q.d + ' plates'), '. How many sweets were there at the start?'));
    var plates = [];
    for (var i = 0; i < q.d; i++) plates.push(q.q);
    var t = table(q.n, q.d, { plates: plates, jar: q.r, pile: 0 });
    t.state.done = true;
    t.draw();
    var box = smallBox('Sweets at the start');
    var checkBtn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    var answer = el('div', { class: 'sl-answer' }, box, el('span', { class: 'sl-eq' }, '÷ ' + q.d + ' = ' + q.q + ' r' + q.r), checkBtn);
    var out = el('div', { class: 'sl-out' });
    stage.appendChild(t.el);
    stage.appendChild(answer);
    stage.appendChild(out);
    api.later(function () {
      try {
        box.focus({ preventScroll: true });
      } catch (e) {}
    }, 30);
    function submit() {
      if (api.isAnswered()) return;
      if (box.value.trim() === '' || isNaN(U.parseNum(box.value))) {
        api.feedback('Type how many sweets there were at the start.', 'info');
        return;
      }
      var v = U.parseNum(box.value);
      if (v === q.n) {
        box.classList.remove('bad');
        box.classList.add('good');
        box.disabled = true;
        checkBtn.disabled = true;
        out.appendChild(checkSum(q.n, q.d, q.q, q.r));
        api.check(true, 'Yes! ' + q.d + ' × ' + q.q + ' = ' + q.d * q.q + ', and ' + q.r + ' more makes ' + q.n + '.');
        return;
      }
      box.classList.add('bad');
      if (v === q.d * q.q) api.check(false, 'That is the sweets on the plates. Add the ' + q.r + ' in the jar too!', 'Forgot to add the leftovers back');
      else if (api.tries() >= 1) api.check(false, 'Count the plates in ' + q.q + 's: ' + jumpCount(q.q, q.d) + '. Then add the jar.', 'Starting number worked out wrongly');
      else api.check(false, q.d + ' plates with ' + q.q + ' on each: that is ' + q.d + ' × ' + q.q + '. Then add the jar.', 'Starting number worked out wrongly');
    }
    checkBtn.addEventListener('click', submit);
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    });
    api.onReveal(function () {
      box.value = q.n;
      box.classList.remove('bad');
      box.classList.add('good');
      box.disabled = true;
      checkBtn.disabled = true;
      MQ.clear(out);
      out.appendChild(el('div', { class: 'sl-note' }, 'Count the plates in ' + q.q + 's: ' + jumpCount(q.q, q.d)));
      out.appendChild(checkSum(q.n, q.d, q.q, q.r));
      api.feedback(q.d + ' × ' + q.q + ' = ' + q.d * q.q + ', + ' + q.r + ' in the jar = ' + q.n + ' sweets at the start.', 'info');
    });
  }

  MQ.register('share-and-leftovers', {
    _buildDeck: buildDeck, // used only by test scripts
    learn: [learnShare, learnLeftover, learnCheck, learnTooBig],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (api.index === 0 || !deck) deck = buildDeck();
        var q = deck[api.index];
        if (q.kind === 'missing') renderMissing(stage, api, q);
        else renderDiv(stage, api, q);
      },
    },
  });

  document.head.appendChild(
    el(
      'style',
      { 'data-activity': 'share-and-leftovers' },
      [
        '.sl-table{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:center;gap:16px;width:100%;max-width:880px;}',
        '.sl-pile-wrap{display:flex;flex-direction:column;align-items:center;gap:4px;}',
        '.sl-pile{display:grid;grid-template-columns:repeat(10,16px);gap:3px;padding:10px;min-height:40px;min-width:60px;background:#fff8e7;border:2px dashed #e0c58a;border-radius:14px;}',
        '.sl-pile.sl-empty{grid-template-columns:1fr;}',
        '.sl-sweet{width:16px;height:16px;border-radius:50%;display:inline-block;box-shadow:inset -2px -2px 0 rgba(0,0,0,.15);}',
        '.sl-label{font-weight:700;color:var(--ink-soft);font-size:1rem;}',
        '.sl-share{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:center;gap:14px;}',
        '.sl-plates{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;}',
        '.sl-plate-wrap{display:flex;flex-direction:column;align-items:center;gap:4px;}',
        '.sl-plate{width:112px;height:112px;border-radius:50%;background:#fff;border:3px solid #cfd6e4;box-shadow:inset 0 0 0 9px #f1f4f9;display:flex;align-items:center;justify-content:center;}',
        '.sl-plate-in{display:flex;flex-wrap:wrap;justify-content:center;align-content:center;gap:2px;width:84px;}',
        '.sl-plate-in .sl-sweet{width:13px;height:13px;}',
        '.sl-count{font-size:1.3rem;font-weight:800;color:var(--ink);}',
        '.sl-click{cursor:pointer;}',
        '.sl-plate.sl-click:hover{border-color:var(--accent);}',
        '.sl-counted{border-color:var(--good)!important;background:var(--good-bg);}',
        '.sl-jar-wrap{display:flex;flex-direction:column;align-items:center;gap:2px;}',
        '.sl-jar{width:92px;height:104px;border:3px solid #9fb3c8;border-top:none;border-radius:0 0 22px 22px;background:#f4f9ff;position:relative;display:flex;align-items:flex-end;justify-content:center;padding:6px;box-sizing:border-box;margin-top:10px;}',
        '.sl-jar-lid{position:absolute;top:-10px;left:-6px;right:-6px;height:10px;background:#9fb3c8;border-radius:6px;}',
        '.sl-jar-in{display:flex;flex-wrap:wrap-reverse;justify-content:center;gap:2px;}',
        '.sl-jar-full .sl-jar{border-color:#e0a030;background:#fff6e0;}',
        '.sl-jar-wrap.sl-click:hover .sl-jar{border-color:var(--accent);}',
        '.sl-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;}',
        '.sl-out{display:flex;flex-direction:column;align-items:center;gap:6px;}',
        '.sl-sentence{font-size:1.9rem;font-weight:800;background:#fff3cd;border:2px solid var(--gold);border-radius:14px;padding:6px 18px;}',
        '.sl-running{min-width:120px;text-align:center;}',
        '.sl-r{color:#c2410c;}',
        '.sl-note{font-size:1.1rem;font-weight:700;color:var(--ink-soft);text-align:center;}',
        '.sl-key{font-size:.95rem;color:var(--ink-soft);}',
        '.sl-check{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;font-size:1.15rem;font-weight:700;}',
        '.sl-answer{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px;}',
        '.sl-hidden{display:none;}',
        '.sl-eq{font-size:1.7rem;font-weight:800;}',
        '.sl-box{width:84px;height:58px;font-size:1.6rem;font-weight:800;text-align:center;border-radius:12px;border:3px solid var(--line);font-family:inherit;color:var(--ink);}',
        '.sl-box.good{border-color:var(--good);background:var(--good-bg);}',
        '.sl-box.bad{border-color:var(--try);background:var(--try-bg);}',
        '.sl-est{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;}',
        '.sl-est:empty{display:none;}',
        '.sl-est-q{font-size:1.2rem;font-weight:800;}',
        '@media (max-width:860px){.sl-plate{width:92px;height:92px;box-shadow:inset 0 0 0 6px #f1f4f9;}.sl-plate-in{width:72px;}.sl-plate-in .sl-sweet{width:11px;height:11px;}.sl-pile{grid-template-columns:repeat(10,13px);}.sl-pile .sl-sweet{width:13px;height:13px;}}',
      ].join('\n')
    )
  );
})();

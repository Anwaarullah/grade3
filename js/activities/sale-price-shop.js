/* Sale Price Shop — find a sale price after a reduction by a unit fraction (Unit 12.3).
 * The price is always shown as $1 coins. The child picks how many equal piles the fraction
 * needs, deals the coins into the piles, takes one pile away (the saving) and reads what is
 * left (the new price). The ÷ and − sentences appear only after the coins are shared.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var U = MQ.util;

  var ITEMS = {
    shorts: { name: 'shorts', icon: '🩳' },
    tshirt: { name: 'T-shirt', icon: '👕' },
    coat: { name: 'coat', icon: '🧥' },
    jumper: { name: 'jumper', icon: '🧶' },
    bag: { name: 'school bag', icon: '🎒' },
    lunch: { name: 'lunchbox', icon: '🍱' },
    books: { name: 'box of books', icon: '📚' },
    trousers: { name: 'trousers', icon: '👖' },
    trainers: { name: 'trainers', icon: '👟' },
    cap: { name: 'cap', icon: '🧢' },
  };
  // Book prices keep their book item where possible (Textbook Q7, WE1; Workbook Q7).
  var BOOK_ITEM = { '8/4': 'shorts', '4/4': 'tshirt', '32/4': 'coat', '20/4': 'jumper', '30/10': 'trousers', '30/3': 'tshirt' };
  var PILE_OPTIONS = [2, 3, 4, 5, 10];
  var WORD = { 2: 'half', 3: 'third', 4: 'quarter', 5: 'fifth', 10: 'tenth' };

  var T_SAVE_AS_PRICE = 'Gave the saving as the new price';
  var T_WRONG_PILES = 'Shared into the wrong number of piles';
  var T_FRAC_NUMBER = "Subtracted the fraction's number (e.g. took $4 off for 1/4)";
  var T_OLD_PRICE = 'Gave the old price (took nothing away)';
  var T_MISCOUNT = 'Miscounted the coins';

  /** Stacked fraction as HTML. */
  function frac(n, d) {
    return '<span class="sps-frac"><span>' + n + '</span><span>' + d + '</span></span>';
  }

  /** Columns for the coins inside one pile, so equal piles look identical and tidy. */
  function colsFor(per) {
    if (per <= 5) return per;
    if (per === 6) return 3;
    if (per % 5 === 0) return 5;
    if (per % 4 === 0) return 4;
    if (per % 3 === 0) return 3;
    return 5;
  }

  function coin() {
    return el('span', { class: 'sps-coin' }, '$1');
  }

  /* ---------------------------------------------------------------- *
   * Board: item + price tag, a purse of $1 coins, equal piles.
   * ---------------------------------------------------------------- */
  function makeBoard(api, o) {
    var n = o.n;
    var token = 0;
    var b = { n: n, k: 0, per: 0, dealt: false, removed: -1, piles: [] };

    var tag = el('div', { class: 'sps-tag', 'data-price': n, html: '$' + n });
    var sale = o.k ? el('div', { class: 'sps-sale', html: 'SALE<br>reduced by ' + frac(1, o.k) }) : null;
    var item = el('div', { class: 'sps-item' }, el('div', { class: 'sps-emoji' }, o.item.icon), el('div', { class: 'sps-itemcol' }, el('div', { class: 'sps-itemname' }, o.item.name), tag), sale);

    var purseCoins = [];
    var purse = el('div', { class: 'sps-purse', style: { gridTemplateColumns: 'repeat(' + Math.min(10, n) + ', var(--sps-c))' } });
    for (var i = 0; i < n; i++) {
      var c = coin();
      purseCoins.push(c);
      purse.appendChild(c);
    }
    var purseWrap = el('div', { class: 'sps-pursewrap' }, el('div', { class: 'sps-purselbl' }, n + ' coins of $1 = $' + n), purse);
    var pilesEl = el('div', { class: 'sps-piles' });
    var sents = el('div', { class: 'sps-sents' });

    b.el = el('div', { class: 'sps-board' }, item, purseWrap, pilesEl, sents);
    b.tag = tag;

    function buildPiles(k) {
      MQ.clear(pilesEl);
      b.k = k;
      b.per = n / k;
      b.piles = [];
      var cols = colsFor(b.per);
      // Lay the piles out in even rows: all in one row, or two rows of 5 for tenths.
      var perRow = k <= 5 ? k : Math.ceil(k / 2);
      var pileW = Math.max(66, cols * 29 - 3 + 22);
      pilesEl.style.maxWidth = perRow * (pileW + 10) + 4 + 'px';
      for (var p = 0; p < k; p++) {
        var grid = el('div', { class: 'sps-pile-coins', style: { gridTemplateColumns: 'repeat(' + cols + ', var(--sps-c))' } });
        var lbl = el('div', { class: 'sps-pile-lbl' }, '');
        var pile = el('button', { class: 'sps-pile', type: 'button', 'data-idx': p, disabled: true }, grid, lbl);
        b.piles.push({ el: pile, grid: grid, lbl: lbl, count: 0 });
        pilesEl.appendChild(pile);
        (function (idx) {
          pile.addEventListener('click', function () {
            if (b.onPick && b.removed < 0 && b.dealt) b.onPick(idx);
          });
        })(p);
      }
    }

    function finishDeal() {
      b.dealt = true;
      purseWrap.classList.add('sps-hidden');
      b.piles.forEach(function (p) {
        p.lbl.textContent = '$' + b.per;
      });
    }

    /** Deal one coin to each pile in turn. instant=true skips the animation. */
    b.deal = function (k, instant, done) {
      token++;
      var my = token;
      buildPiles(k);
      purseCoins.forEach(function (c) {
        c.classList.remove('sps-gonecoin');
      });
      if (instant) {
        b.piles.forEach(function (p) {
          for (var j = 0; j < b.per; j++) p.grid.appendChild(coin());
          p.count = b.per;
        });
        purseCoins.forEach(function (c) {
          c.classList.add('sps-gonecoin');
        });
        finishDeal();
        if (done) done();
        return;
      }
      var rounds = b.per;
      var wait = U.clamp(Math.round(2600 / rounds), 110, 420);
      var r = 0;
      var left = n;
      function round() {
        if (my !== token) return;
        b.piles.forEach(function (p) {
          left--;
          purseCoins[left].classList.add('sps-gonecoin');
          var c = coin();
          c.classList.add('sps-pop');
          p.grid.appendChild(c);
          p.count++;
        });
        api.sound('pop');
        r++;
        if (r < rounds) api.later(round, wait);
        else
          api.later(function () {
            if (my !== token) return;
            finishDeal();
            if (done) done();
          }, 250);
      }
      api.later(round, 200);
    };

    /** Let the child click a pile. */
    b.pickable = function (on, cb) {
      b.onPick = cb;
      pilesEl.classList.toggle('sps-pick', !!on);
      b.piles.forEach(function (p) {
        p.el.disabled = !on;
      });
    };

    b.remove = function (idx) {
      b.removed = idx;
      b.pickable(false);
      b.piles.forEach(function (p, i) {
        p.el.classList.add(i === idx ? 'sps-gone' : 'sps-keep');
        if (i === idx) p.lbl.textContent = '−$' + b.per + ' off';
      });
    };

    b.setTag = function (newPrice) {
      tag.innerHTML = '<s>$' + n + '</s> $' + newPrice;
      tag.classList.add('sps-tag-new');
    };

    b.sentence = function (html, cls) {
      var s = el('div', { class: 'sps-sent ' + (cls || ''), html: html });
      sents.appendChild(s);
      return s;
    };
    b.clearSentences = function () {
      MQ.clear(sents);
    };
    return b;
  }

  /* ---------------------------------------------------------------- *
   * Deck
   * ---------------------------------------------------------------- */
  function multiples(lo, hi, k) {
    var out = [];
    for (var v = lo; v <= hi; v++) if (v % k === 0 && v !== k * k) out.push(v);
    return out;
  }

  function buildDeck() {
    var used = {};
    var usedItems = {};
    var q = [];
    function add(level, k, lo, hi, preferBook) {
      var pool = U.shuffle(multiples(lo, hi, k)).filter(function (n) {
        return !used[n + '/' + k];
      });
      if (preferBook) {
        var book = pool.filter(function (n) {
          return BOOK_ITEM[n + '/' + k];
        });
        if (book.length && Math.random() < 0.6) pool = book;
      }
      var n = pool[0];
      used[n + '/' + k] = true;
      var key = BOOK_ITEM[n + '/' + k];
      if (!key || usedItems[key]) {
        key = U.shuffle(Object.keys(ITEMS)).filter(function (x) {
          return !usedItems[x];
        })[0];
      }
      usedItems[key] = true;
      q.push({ level: level, n: n, k: k, item: ITEMS[key] });
    }
    // Level 1: $4–$20 reduced by ½ or ¼
    U.shuffle([2, 4, 4]).forEach(function (k) {
      add(1, k, 4, 20, true);
    });
    // Level 2: $8–$40 reduced by ¼ or ⅒
    U.shuffle([4, 4, 10]).forEach(function (k) {
      add(2, k, 8, 40, true);
    });
    // Level 3: save and pay, up to $60, ⅓ ¼ ⅕ or ⅒
    add(3, U.pick([3, 5]), 12, 60, true);
    add(3, U.pick([4, 10]), 12, 60, false);
    return q;
  }

  /** Expected answers (used by the page and by the deck test). */
  function answers(q) {
    var save = q.n / q.k;
    return { save: save, pay: q.n - save };
  }

  var deck = null;

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */
  function learnTenth(stage, api) {
    api.say('These trousers cost $30. That is 30 coins in 10 equal stacks.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Reduced by one tenth', 'Take <b>one</b> of the <b>10</b> equal stacks off the price. Click a stack.'));
    var b = makeBoard(api, { n: 30, k: 10, item: ITEMS.trousers });
    stage.appendChild(b.el);
    b.deal(10, true);
    b.sentence('30 ÷ 10 = <b>3</b>');
    b.pickable(true, function (idx) {
      b.remove(idx);
      api.sound('click');
      b.sentence('30 − 3 = <b>27</b>', 'sps-sent-pay');
      b.setTag(27);
      api.say('One tenth of $30 is $3. Take it off: now they cost $27!', 'cheer');
      api.feedback('30 − 3 = 27. The trousers now cost $27.', 'good');
      api.unlockNext();
    });
  }

  function learnQuarter(stage, api) {
    api.say('A $20 jumper is reduced by one quarter. A quarter needs 4 equal piles.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Reduced by one quarter', 'Deal the 20 coins into <b>4</b> equal piles.'));
    var b = makeBoard(api, { n: 20, k: 4, item: ITEMS.jumper });
    stage.appendChild(b.el);
    var dealBtn = el('button', { class: 'btn sps-deal', type: 'button' }, 'Deal into 4 piles');
    stage.appendChild(dealBtn);
    dealBtn.addEventListener('click', function () {
      dealBtn.disabled = true;
      dealBtn.classList.add('sps-hidden');
      b.deal(4, false, function () {
        b.sentence('20 ÷ 4 = <b>5</b>');
        api.say('4 piles of $5. Click one pile to take it away.', 'think');
        b.pickable(true, function (idx) {
          b.remove(idx);
          api.sound('click');
          b.sentence('20 − 5 = <b>15</b>', 'sps-sent-pay');
          b.setTag(15);
          api.say('Take $5 off. The jumper costs $15 now!', 'cheer');
          api.feedback('One quarter of $20 is $5. 20 − 5 = 15.', 'good');
          api.unlockNext();
        });
      });
    });
  }

  function learnTwoTags(stage, api) {
    api.say('Careful! The pile we took away is not the new price.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Two different numbers', 'The pile you take away is what you <b>save</b>. The coins left are what you <b>pay</b>.'));
    var b = makeBoard(api, { n: 20, k: 4, item: ITEMS.jumper });
    b.deal(4, true);
    b.remove(3);
    b.sentence('20 ÷ 4 = <b>5</b>');
    stage.appendChild(b.el);
    var tags = el('div', { class: 'sps-ltags' });
    var opts = U.shuffle([
      { v: 'save', html: 'You save <b>$5</b>', cls: 'sps-ltag-save' },
      { v: 'pay', html: 'You pay <b>$15</b>', cls: 'sps-ltag-pay' },
    ]);
    var done = false;
    opts.forEach(function (o) {
      var t = el('button', { class: 'sps-ltag ' + o.cls, type: 'button', 'data-value': o.v, html: o.html });
      t.addEventListener('click', function () {
        if (done) return;
        if (o.v === 'pay') {
          done = true;
          t.classList.add('sps-ltag-right');
          b.setTag(15);
          b.sentence('20 − 5 = <b>15</b>', 'sps-sent-pay');
          api.sound('correct');
          api.say('Yes! You pay $15 and keep $5 in your pocket.', 'cheer');
          api.feedback('You save $5 (the pile taken away). You pay $15 (the coins left).', 'good');
          api.unlockNext();
        } else {
          api.sound('wrong');
          t.classList.add('sps-ltag-wrong');
          api.feedback('$5 is the pile we took away: that is the saving. What is left to pay?', 'try');
        }
      });
      tags.appendChild(t);
    });
    stage.appendChild(MQ.ui.prompt('Which tag shows what you <b>pay</b> at the till?'));
    stage.appendChild(tags);
  }

  /* ---------------------------------------------------------------- *
   * Practice
   * ---------------------------------------------------------------- */
  function renderPractice(stage, api) {
    if (!deck || api.index === 0) deck = buildDeck();
    var q = deck[api.index];
    var A = answers(q);
    var two = q.level === 3;
    var state = { piles: false, dealt: false, removed: false };

    var ask = two ? 'How much do you <b>save</b>, and what do you <b>pay</b>?' : 'What is the <b>new price</b>?';
    stage.appendChild(MQ.ui.prompt('The ' + q.item.name + ' costs $' + q.n + '. It is reduced by ' + frac(1, q.k) + '. ' + ask));
    var b = makeBoard(api, { n: q.n, k: q.k, item: q.item });
    stage.appendChild(b.el);
    var step = el('div', { class: 'sps-step' });
    stage.appendChild(step);

    api.say('How many equal piles do we need?', 'think');

    /* step 1: how many piles */
    var stepLbl = el('div', { class: 'sps-steplbl', html: 'Share the $' + q.n + ' into how many equal piles?' });
    var ch = MQ.ui.choices(
      PILE_OPTIONS.map(function (v) {
        return { label: v + ' piles', value: v };
      }),
      function (v) {
        if (state.piles) return;
        if (v === q.k) {
          ch.mark(v, 'good');
          ch.disable();
          state.piles = true;
          api.sound('click');
          api.feedback('Yes: one ' + WORD[q.k] + ' means ' + q.k + ' equal piles.', 'good');
          showDeal();
        } else {
          ch.mark(v, 'bad');
          api.check(
            false,
            api.tries() >= 1
              ? 'The bottom number of the fraction is ' + q.k + ', so we need ' + q.k + ' equal piles.'
              : 'Look at the bottom number of the fraction. It tells you how many equal piles to make.',
            T_WRONG_PILES
          );
        }
      },
      { columns: 5 }
    );
    ch.classList.add('sps-choices');
    step.appendChild(stepLbl);
    step.appendChild(ch);

    /* step 2: deal */
    var dealBtn = el('button', { class: 'btn sps-deal', type: 'button' }, 'Deal into ' + q.k + ' piles');
    function showDeal() {
      MQ.clear(step);
      step.appendChild(dealBtn);
      api.say('Now deal the coins.', 'happy');
    }
    dealBtn.addEventListener('click', function () {
      if (state.dealt || dealBtn.disabled) return;
      dealBtn.disabled = true;
      b.deal(q.k, false, afterDeal);
    });
    function afterDeal() {
      state.dealt = true;
      MQ.clear(step);
      b.sentence(q.n + ' ÷ ' + q.k + ' = <b>' + A.save + '</b>');
      step.appendChild(el('div', { class: 'sps-steplbl', html: 'One ' + WORD[q.k] + ' is one pile. Click a pile to take it off the price.' }));
      api.say('Take one pile away.', 'think');
      b.pickable(true, function (idx) {
        if (state.removed) return;
        state.removed = true;
        b.remove(idx);
        api.sound('click');
        showAnswer();
      });
    }

    /* step 3: answer */
    var inA, inSave, inPay, checkBtn;
    function showAnswer() {
      MQ.clear(step);
      if (!two) {
        api.say('How much is left to pay?', 'think');
        inA = MQ.ui.numberInput({ prefix: 'New price: $', label: 'New price in dollars', onSubmit: submitOne });
        inA.el.classList.add('sps-numrow');
        step.appendChild(inA.el);
        inA.focus();
      } else {
        api.say('What do you save? What do you pay?', 'think');
        inSave = el('input', { class: 'num-input sps-in', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'data-role': 'save', 'aria-label': 'You save, in dollars', placeholder: '?' });
        inPay = el('input', { class: 'num-input sps-in', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'data-role': 'pay', 'aria-label': 'You pay, in dollars', placeholder: '?' });
        checkBtn = el('button', { class: 'btn btn-check sps-check2', type: 'button' }, 'Check');
        [inSave, inPay].forEach(function (inp) {
          inp.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
              e.preventDefault();
              submitTwo();
            }
          });
        });
        checkBtn.addEventListener('click', submitTwo);
        step.appendChild(
          el(
            'div',
            { class: 'sps-two' },
            el('label', { class: 'sps-twotag sps-ltag-save' }, el('span', null, 'You save $'), inSave),
            el('label', { class: 'sps-twotag sps-ltag-pay' }, el('span', null, 'You pay $'), inPay),
            checkBtn
          )
        );
        api.later(function () {
          try {
            inSave.focus({ preventScroll: true });
          } catch (e) {
            inSave.focus();
          }
        }, 30);
      }
    }

    function finishWorking() {
      if (!b.sentsDone) {
        b.sentsDone = true;
        b.sentence(q.n + ' − ' + A.save + ' = <b>' + A.pay + '</b>', 'sps-sent-pay');
      }
      b.setTag(A.pay);
    }

    function payHint(v) {
      var t = api.tries();
      if (v === q.n) return ['That is the old price. Take one pile away first, then count what is left.', T_OLD_PRICE];
      if (v === A.save) return [t >= 1 ? 'The red pile is the saving ($' + A.save + '). Count the coins in the green piles: that is the new price.' : '$' + A.save + ' is the pile you took away. That is the saving, not the new price. What is left?', T_SAVE_AS_PRICE];
      if (v === q.n - q.k || v === q.n - 1)
        return [
          t >= 1 ? 'One ' + WORD[q.k] + ' of $' + q.n + ' is one pile: $' + A.save + '. Take $' + A.save + ' away from $' + q.n + '.' : 'Careful! ' + frac(1, q.k) + ' does not mean take $' + (v === q.n - 1 ? 1 : q.k) + ' off. It means take one pile of $' + A.save + ' off.',
          T_FRAC_NUMBER,
        ];
      return [t >= 1 ? 'There are ' + (q.k - 1) + ' green piles of $' + A.save + ' left. Count them: ' + Array(q.k).join(A.save + ' + ').slice(0, -3) + ' = ?' : 'Count the coins left in the green piles.', T_MISCOUNT];
    }

    function submitOne(v) {
      if (api.isAnswered()) return;
      if (v === A.pay) {
        inA.good();
        inA.disable();
        finishWorking();
        api.check(true, 'Yes! The ' + q.item.name + ' now costs $' + A.pay + '.');
        return;
      }
      inA.bad();
      var h = payHint(v);
      api.check(false, h[0], h[1]);
    }

    function submitTwo() {
      if (api.isAnswered()) return;
      if (inSave.value.trim() === '' || inPay.value.trim() === '') {
        api.feedback('Fill in both tags: what you save and what you pay.', 'info');
        return;
      }
      var s = U.parseNum(inSave.value);
      var p = U.parseNum(inPay.value);
      if (isNaN(s) || isNaN(p)) {
        api.feedback('Type a number of dollars in each box.', 'info');
        return;
      }
      var sOk = s === A.save;
      var pOk = p === A.pay;
      inSave.classList.toggle('good', sOk);
      inSave.classList.toggle('bad', !sOk);
      inPay.classList.toggle('good', pOk);
      inPay.classList.toggle('bad', !pOk);
      if (sOk && pOk) {
        inSave.disabled = inPay.disabled = checkBtn.disabled = true;
        finishWorking();
        api.check(true, 'Yes! You save $' + A.save + ' and pay $' + A.pay + '.');
        return;
      }
      if (s === A.pay && p === A.save) {
        api.check(false, 'You swapped them! The pile you took away ($' + A.save + ') is the saving. The coins left are what you pay.', T_SAVE_AS_PRICE);
        return;
      }
      if (!sOk) {
        if (s === q.k || s === 1) {
          api.check(false, frac(1, q.k) + ' does not mean $' + s + ' off. The saving is one whole pile. How many coins are in it?', T_FRAC_NUMBER);
        } else if (s === A.pay) {
          api.check(false, 'That is what you pay. The saving is only the one pile you took away.', T_SAVE_AS_PRICE);
        } else {
          api.check(false, api.tries() >= 1 ? q.n + ' ÷ ' + q.k + ' = ' + A.save + '. One pile is $' + A.save + '.' : 'The saving is the pile you took away. Count its coins.', T_MISCOUNT);
        }
        return;
      }
      var h = payHint(p);
      api.check(false, h[0], h[1]);
    }

    api.onReveal(function () {
      if (!state.piles) {
        state.piles = true;
        MQ.clear(step);
      }
      if (!state.dealt) {
        state.dealt = true;
        b.deal(q.k, true);
        b.clearSentences();
        b.sentence(q.n + ' ÷ ' + q.k + ' = <b>' + A.save + '</b>');
      }
      if (!state.removed) {
        state.removed = true;
        b.remove(q.k - 1);
        showAnswer();
      }
      finishWorking();
      if (two) {
        inSave.value = A.save;
        inPay.value = A.pay;
        inSave.className = 'num-input sps-in good';
        inPay.className = 'num-input sps-in good';
        inSave.disabled = inPay.disabled = checkBtn.disabled = true;
      } else {
        inA.setValue(A.pay);
        inA.good();
        inA.disable();
      }
      api.feedback(
        q.k + ' equal piles: ' + q.n + ' ÷ ' + q.k + ' = ' + A.save + '. Take one pile off: ' + q.n + ' − ' + A.save + ' = ' + A.pay + '. You save $' + A.save + ' and pay $' + A.pay + '.',
        'info'
      );
    });
  }

  var def = {
    learn: [learnTenth, learnQuarter, learnTwoTags],
    practice: { count: 8, render: renderPractice },
  };
  // For the deck test only (not used by the site).
  def._buildDeck = buildDeck;
  def._answers = answers;
  MQ.register('sale-price-shop', def);

  var css = [
    '.sps-board{--sps-c:26px;width:100%;max-width:980px;display:flex;flex-direction:column;align-items:center;gap:10px}',
    '.sps-item{display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center}',
    '.sps-emoji{font-size:3.4rem;line-height:1}',
    '.sps-itemcol{display:flex;flex-direction:column;align-items:flex-start;gap:4px}',
    '.sps-itemname{font-weight:800;color:var(--ink-soft);font-size:1rem}',
    '.sps-tag{position:relative;background:#fff8e1;border:3px solid #e0a800;border-radius:8px 24px 24px 8px;padding:4px 20px 4px 30px;font-size:1.8rem;font-weight:800;color:var(--ink)}',
    '.sps-tag::before{content:"";position:absolute;left:9px;top:50%;width:10px;height:10px;margin-top:-7px;border-radius:50%;border:2px solid #e0a800;background:#fff}',
    '.sps-tag s{color:#c0392b;font-size:1.3rem;margin-right:6px}',
    '.sps-tag-new{border-color:var(--good);background:var(--good-bg)}',
    '.sps-sale{background:#d62839;color:#fff;font-weight:800;border-radius:12px;padding:6px 14px;font-size:1.05rem;text-align:center;line-height:1.25}',
    '.sps-sale .sps-frac{font-size:1.2rem}',
    '.sps-pursewrap{display:flex;flex-direction:column;align-items:center;gap:4px}',
    '.sps-purselbl{font-weight:800;color:var(--ink-soft)}',
    '.sps-purse{display:grid;gap:4px;padding:10px;background:#f6f1e7;border:2px dashed #cbb994;border-radius:14px}',
    '.sps-coin{width:var(--sps-c);height:var(--sps-c);border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffe58a,#f4b400 70%);border:2px solid #c48a00;font-size:9px;font-weight:800;color:#6b4700;display:flex;align-items:center;justify-content:center;box-sizing:border-box;letter-spacing:-.3px}',
    '.sps-gonecoin{visibility:hidden}',
    '.sps-pop{animation:sps-pop .25s ease}',
    '@keyframes sps-pop{from{transform:scale(.3)}to{transform:scale(1)}}',
    '.sps-hidden{display:none !important}',
    '.sps-piles{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;max-width:100%}',
    '.sps-piles:empty{display:none}',
    '.sps-pile{box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;background:#fff;border:3px solid var(--line);border-radius:14px;padding:8px;font:inherit;color:var(--ink);min-width:66px}',
    '.sps-pile:disabled{cursor:default}',
    '.sps-pile-coins{display:grid;gap:3px}',
    '.sps-pile-lbl{font-weight:800;font-size:1.05rem;min-height:1.3em}',
    '.sps-pick .sps-pile{cursor:pointer}',
    '.sps-pick .sps-pile:hover{border-color:var(--accent);transform:translateY(-2px)}',
    '.sps-gone{border-style:dashed;border-color:#d62839;background:#fff0f0}',
    '.sps-gone .sps-pile-coins{opacity:.35}',
    '.sps-gone .sps-pile-lbl{color:#d62839}',
    '.sps-keep{border-color:var(--good);background:var(--good-bg)}',
    '.sps-sents{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.sps-sents:empty{display:none}',
    '.sps-sent{font-size:1.45rem;font-weight:800;background:#fff;border:2px solid var(--line);border-radius:12px;padding:4px 14px}',
    '.sps-sent-pay{border-color:var(--good);background:var(--good-bg)}',
    '.sps-step{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.sps-steplbl{font-size:1.15rem;font-weight:800;text-align:center}',
    '.sps-choices{max-width:620px}',
    '.sps-choices .choice{min-height:50px}',
    '.sps-deal{font-size:1.2rem}',
    '.sps-two{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:center}',
    '.sps-twotag{display:flex;align-items:center;gap:6px;font-size:1.25rem;font-weight:800;border:3px solid;border-radius:8px 24px 24px 8px;padding:6px 14px}',
    '.sps-twotag .num-input{width:100px;height:52px}',
    '.sps-ltags{display:flex;gap:16px;flex-wrap:wrap;justify-content:center}',
    '.sps-ltag{font:inherit;font-size:1.5rem;font-weight:800;border:3px solid;border-radius:8px 28px 28px 8px;padding:10px 24px;cursor:pointer;color:var(--ink)}',
    '.sps-ltag-save{border-color:#d62839;background:#fff0f0}',
    '.sps-ltag-pay{border-color:var(--good);background:var(--good-bg)}',
    '.sps-ltag-right{box-shadow:0 0 0 4px var(--good)}',
    '.sps-ltag-wrong{opacity:.6}',
    '.sps-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;margin:0 .12em;font-weight:800}',
    '.sps-frac>span:first-child{border-bottom:3px solid currentColor;padding:0 .18em 1px}',
    '.sps-frac>span:last-child{padding:1px .18em 0}',
    '@media (max-width:860px){.sps-board{--sps-c:22px}.sps-emoji{font-size:2.6rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'sale-price-shop' }, css));
})();

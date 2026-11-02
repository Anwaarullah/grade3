/* Test your guess — chance experiments with a dice, a coin and cereal-packet toys (Unit 2.1).
 * Learn: test Bolt's conjecture with 12 dice throws, throw again and compare, predict and flip a coin 20 times.
 * Practice: read a coin tally (heads, tails from heads + tails = 20, which was more), read a dice tally
 * (most / least, total throws, will it happen again?), run a toy-collecting experiment twice and compare.
 * Every number is computed from the tally that is drawn; every drawn line is one result.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var TOYS = [
    { k: 'ball', name: 'ball', icon: '⚽' },
    { k: 'car', name: 'car', icon: '🚗' },
    { k: 'yoyo', name: 'yo-yo', icon: '🪀' },
    { k: 'kite', name: 'kite', icon: '🪁' },
    { k: 'teddy', name: 'teddy', icon: '🧸' },
    { k: 'puzzle', name: 'puzzle', icon: '🧩' },
  ];
  var FACES = [1, 2, 3, 4, 5, 6];

  function sum(a) {
    return a.reduce(function (s, v) {
      return s + v;
    }, 0);
  }
  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : many || one + 's');
  }
  function hint(api, first, second) {
    return api.tries() >= 1 && second ? second : first;
  }
  /** Value read by someone who counts each gate as 1. */
  function gateAsOne(n) {
    return Math.floor(n / 5) + (n % 5);
  }
  /** "5, 10, 11, 12" */
  function countWords(n) {
    var out = [];
    for (var v = 5; v <= n; v += 5) out.push(v);
    for (var w = Math.floor(n / 5) * 5 + 1; w <= n; w++) out.push(w);
    return out.length ? out.join(', ') : '0';
  }

  /* ---------------------------------------------------------------- *
   * Random experiments (real chance)
   * ---------------------------------------------------------------- */
  function throwDice(n) {
    var c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    for (var i = 0; i < n; i++) c[U.rand(1, 6)]++;
    return c;
  }
  function flipCoins(n) {
    var h = 0;
    for (var i = 0; i < n; i++) if (Math.random() < 0.5) h++;
    return { H: h, T: n - h };
  }
  function diceVals(c) {
    return FACES.map(function (f) {
      return c[f];
    });
  }
  function uniqueExtreme(c, most) {
    var v = diceVals(c);
    var best = most ? Math.max.apply(null, v) : Math.min.apply(null, v);
    var who = FACES.filter(function (f) {
      return c[f] === best;
    });
    return who.length === 1 ? who[0] : null;
  }

  /* ---------------------------------------------------------------- *
   * Pictures: tally, dice face, coin
   * Same gate style as the other Unit 2 activities: a gate is 4 upright lines + 1 line across.
   * Each <line class="ce-stroke"> is exactly one result.
   * ---------------------------------------------------------------- */
  function tallySvg(n, perLine, animateLast) {
    perLine = perLine || 5;
    var S = 11, H = 30, STEP = 54, LINE = H + 12;
    var units = [];
    for (var g = 0; g < Math.floor(n / 5); g++) units.push(5);
    if (n % 5) units.push(n % 5);
    var lines = Math.max(1, Math.ceil(units.length / perLine));
    var cols = Math.max(1, Math.min(units.length, perLine));
    var W = (cols - 1) * STEP + 50;
    var Ht = lines * LINE - 6;
    var root = svg('svg', { class: 'ce-tally', viewBox: '0 0 ' + W + ' ' + Ht, width: W, height: Ht, role: 'img', 'aria-label': n + ' tally marks', 'data-n': String(n) });
    var last = null;
    units.forEach(function (u, i) {
      var x0 = (i % perLine) * STEP + 10;
      var y0 = Math.floor(i / perLine) * LINE + 3;
      for (var s = 0; s < Math.min(u, 4); s++) last = root.appendChild(svg('line', { x1: x0 + s * S, y1: y0, x2: x0 + s * S, y2: y0 + H - 4, class: 'ce-stroke', pathLength: 1 }));
      if (u === 5) last = root.appendChild(svg('line', { x1: x0 - 7, y1: y0 + H - 9, x2: x0 + 3 * S + 7, y2: y0 + 4, class: 'ce-stroke ce-cross', pathLength: 1 }));
    });
    if (animateLast && last) last.classList.add('ce-new');
    return root;
  }

  var PIPS = {
    1: [[50, 50]],
    2: [[28, 28], [72, 72]],
    3: [[28, 28], [50, 50], [72, 72]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]],
    5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[28, 25], [72, 25], [28, 50], [72, 50], [28, 75], [72, 75]],
  };
  function diceFace(n, size, cls) {
    var root = svg('svg', { viewBox: '0 0 100 100', width: size, height: size, class: 'ce-die' + (cls ? ' ' + cls : ''), role: 'img', 'aria-label': 'dice showing ' + n });
    var pips = svg('g');
    root.appendChild(svg('rect', { x: 5, y: 5, width: 90, height: 90, rx: 16, class: 'ce-die-body' }));
    root.appendChild(pips);
    function set(v) {
      MQ.clear(pips);
      PIPS[v].forEach(function (p) {
        pips.appendChild(svg('circle', { cx: p[0], cy: p[1], r: 9, class: 'ce-pip' }));
      });
      root.setAttribute('aria-label', 'dice showing ' + v);
    }
    set(n);
    return { svg: root, set: set };
  }
  function coinPic(side, size) {
    var root = svg('svg', { viewBox: '0 0 100 100', width: size, height: size, class: 'ce-coin', role: 'img' });
    root.appendChild(svg('circle', { cx: 50, cy: 50, r: 45, class: 'ce-coin-body' }));
    root.appendChild(svg('circle', { cx: 50, cy: 50, r: 36, class: 'ce-coin-ring' }));
    var t = svg('text', { x: 50, y: 64, 'text-anchor': 'middle', class: 'ce-coin-txt' }, side);
    root.appendChild(t);
    function set(s) {
      t.textContent = s;
      root.setAttribute('aria-label', s === 'H' ? 'heads' : 'tails');
    }
    set(side);
    return { svg: root, set: set };
  }
  function faceLabel(f) {
    return el('span', { class: 'ce-rowlab' }, diceFace(f, 28).svg, el('b', null, String(f)));
  }
  function coinLabel(s) {
    return el('span', { class: 'ce-rowlab' }, coinPic(s, 32).svg, el('b', null, s === 'H' ? 'Heads' : 'Tails'));
  }

  /* ---------------------------------------------------------------- *
   * Table: Label | (Guess) | Tally | Total (Total column hidden until shown)
   * o: rows [{k, label, n}], head, caption, guess, guessHead, hide {k:true}, perLine, cls
   * ---------------------------------------------------------------- */
  function makeTable(o) {
    var t = { rows: {}, n: {} };
    var head = el('tr', null, el('th', null, o.head), o.guess != null ? el('th', null, o.guessHead || 'Guess') : null, el('th', null, 'Tally'), el('th', { class: 'ce-f' }, 'Total'));
    var body = el('tbody');
    var table = el('table', { class: 'ce-table' }, el('thead', null, head), body);
    o.rows.forEach(function (r) {
      var tcell = el('td', { class: 'ce-tcell' });
      var fcell = el('td', { class: 'ce-f' });
      var tr = el('tr', { 'data-key': String(r.k) }, el('td', { class: 'ce-labcell' }, r.label), o.guess != null ? el('td', { class: 'ce-guess' }, String(o.guess)) : null, tcell, fcell);
      t.rows[r.k] = { tr: tr, tcell: tcell, fcell: fcell };
      t.n[r.k] = r.n || 0;
      body.appendChild(tr);
      draw(r.k, false);
    });
    function draw(k, anim) {
      var row = t.rows[k];
      MQ.clear(row.tcell);
      if (o.hide && o.hide[k]) row.tcell.appendChild(el('span', { class: 'ce-hidden' }, '?'));
      else row.tcell.appendChild(tallySvg(t.n[k], o.perLine, anim));
    }
    t.add = function (k) {
      t.n[k]++;
      draw(k, true);
    };
    t.unhide = function (k) {
      if (o.hide) o.hide[k] = false;
      draw(k, false);
    };
    t.showTotals = function (keys) {
      table.classList.add('ce-showf');
      (keys || Object.keys(t.rows)).forEach(function (k) {
        t.rows[k].fcell.textContent = String(t.n[k]);
      });
    };
    t.mark = function (k, cls) {
      t.rows[k].tr.classList.add(cls);
    };
    t.clearMarks = function (cls) {
      Object.keys(t.rows).forEach(function (k) {
        t.rows[k].tr.classList.remove(cls);
      });
    };
    t.el = el('div', { class: 'ce-tablewrap' + (o.cls ? ' ' + o.cls : '') }, o.caption ? el('div', { class: 'ce-cap' }, o.caption) : null, table);
    t.table = table;
    return t;
  }
  function diceTable(counts, o) {
    o = o || {};
    o.head = 'Number';
    o.rows = FACES.map(function (f) {
      return { k: f, label: faceLabel(f), n: counts ? counts[f] : 0 };
    });
    return makeTable(o);
  }
  function coinTable(c, o) {
    o = o || {};
    o.head = 'Side';
    o.perLine = 5;
    o.rows = ['H', 'T'].map(function (s) {
      return { k: s, label: coinLabel(s), n: c ? c[s] : 0 };
    });
    return makeTable(o);
  }
  function workLine(text) {
    return el('div', { class: 'ce-work' }, text);
  }
  function countLine(name, n) {
    return el('div', { class: 'ce-work' }, el('span', { class: 'ce-wname' }, name + ':'), el('span', { class: 'chip' }, countWords(n)), el('span', { class: 'sum-op' }, '→'), el('span', { class: 'chip chip-total' }, String(n)));
  }

  /* ---------------------------------------------------------------- *
   * Learn 1: Bolt's conjecture — 12 throws, each number twice?
   * ---------------------------------------------------------------- */
  var learnFirst = null; // counts from learn screen 1, reused on screen 2

  function runThrows(api, die, table, counter, n, step, done) {
    var made = 0;
    function one() {
      var v = U.rand(1, 6);
      die.set(v);
      die.svg.classList.remove('ce-roll');
      void die.svg.getBoundingClientRect();
      die.svg.classList.add('ce-roll');
      table.add(v);
      made++;
      counter.textContent = 'Throws: ' + made + ' of ' + n;
      api.sound('pop');
      if (made < n) api.later(one, step);
      else api.later(done, 250);
    }
    api.later(one, 60);
  }

  function learnConjecture(stage, api) {
    api.lockNext();
    api.say('My conjecture: 12 throws give each number twice!', 'think');
    stage.appendChild(MQ.ui.lesson("Test Bolt's guess", 'Bolt guesses that <b>12 throws</b> of a dice give <b>each number twice</b>. A guess like this is a <b>conjecture</b>. Test it!'));
    var die = diceFace(U.rand(1, 6), 92, 'ce-bigdie');
    var counter = el('div', { class: 'ce-counter' }, 'Throws: 0 of 12');
    var btn = el('button', { class: 'btn btn-big ce-go', type: 'button' }, '🎲 Throw 12 times');
    var table = diceTable(null, { caption: 'Our 12 throws', guess: 2, guessHead: "Bolt's guess" });
    var result = el('div', { class: 'ce-result' });
    stage.appendChild(el('div', { class: 'ce-row' }, el('div', { class: 'ce-side' }, die.svg, counter, btn), table.el));
    stage.appendChild(result);
    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      btn.disabled = true;
      api.say('Here we go…', 'happy');
      runThrows(api, die, table, counter, 12, 200, function () {
        table.showTotals();
        learnFirst = {};
        FACES.forEach(function (f) {
          learnFirst[f] = table.n[f];
          table.mark(f, table.n[f] === 2 ? 'ce-good' : 'ce-diff');
        });
        var twice = FACES.filter(function (f) {
          return table.n[f] === 2;
        }).length;
        if (twice === 6) {
          result.textContent = 'Every number came up twice! That is very rare.';
          api.say('Wow, my guess matched this time! That hardly ever happens.', 'cheer');
        } else {
          result.textContent = plural(twice, 'number') + ' came up exactly twice. The rest did not.';
          api.say('My guess did not match. That is fine! Chance does not follow guesses.', 'happy');
        }
        api.unlockNext();
      });
    });
  }

  /* ---------------------------------------------------------------- *
   * Learn 2: throw again — the second tally is different
   * ---------------------------------------------------------------- */
  function learnAgain(stage, api) {
    api.lockNext();
    var first = learnFirst || throwDice(12);
    api.say('Will 12 more throws give the same tally? Try it!', 'think');
    stage.appendChild(MQ.ui.lesson('Throw again', 'Here are the first 12 throws. Throw 12 more and compare.'));
    var t1 = diceTable(first, { caption: 'First 12 throws' });
    t1.showTotals();
    var t2 = diceTable(null, { caption: 'Second 12 throws' });
    var die = diceFace(U.rand(1, 6), 72, 'ce-bigdie');
    var counter = el('div', { class: 'ce-counter' }, 'Throws: 0 of 12');
    var btn = el('button', { class: 'btn btn-big ce-go', type: 'button' }, '🎲 Throw 12 more');
    var result = el('div', { class: 'ce-result' });
    stage.appendChild(el('div', { class: 'ce-row' }, t1.el, el('div', { class: 'ce-side ce-side-s' }, die.svg, counter, btn), t2.el));
    stage.appendChild(result);
    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      btn.disabled = true;
      runThrows(api, die, t2, counter, 12, 200, function () {
        t2.showTotals();
        var diff = FACES.filter(function (f) {
          return t2.n[f] !== first[f];
        });
        diff.forEach(function (f) {
          t1.mark(f, 'ce-diff');
          t2.mark(f, 'ce-diff');
        });
        if (!diff.length) {
          result.textContent = 'Exactly the same as last time! That almost never happens.';
          api.say('Amazing, the same! Next time it will almost surely be different.', 'cheer');
        } else {
          result.textContent = (diff.length === 6 ? 'All 6 rows' : plural(diff.length, 'row') + ' out of 6') + ' changed from the first throws (blue).';
          api.say('Different! Chance results change every time.', 'happy');
        }
        api.unlockNext();
      });
    });
  }

  /* ---------------------------------------------------------------- *
   * Learn 3: coin — predict, flip 20, heads + tails = 20
   * ---------------------------------------------------------------- */
  function learnCoin(stage, api) {
    api.lockNext();
    api.say('A coin lands heads or tails. What will 20 flips give?', 'think');
    stage.appendChild(MQ.ui.lesson('Flip a coin 20 times', 'What is <b>your</b> conjecture?'));
    var guess = null;
    var area = el('div', { class: 'ce-col' });
    var ch = MQ.ui.choices(
      [
        { label: 'More heads', value: 'H' },
        { label: 'More tails', value: 'T' },
        { label: 'About the same', value: 'S' },
      ],
      function (v) {
        if (guess) return;
        guess = v;
        ch.mark(v, 'good');
        ch.disable();
        start();
      },
      { columns: 3 }
    );
    stage.appendChild(ch);
    stage.appendChild(area);

    function start() {
      api.say('Good guess! Now flip. Click once at a time, or flip them all.', 'happy');
      var coin = coinPic('H', 86);
      coin.svg.classList.add('ce-bigcoin');
      var counter = el('div', { class: 'ce-counter' }, 'Flips: 0 of 20');
      var one = el('button', { class: 'btn ce-go', type: 'button' }, 'Flip once');
      var all = el('button', { class: 'btn ce-go2', type: 'button' }, 'Flip the rest');
      var table = coinTable(null, { caption: 'Our 20 flips' });
      var result = el('div', { class: 'ce-col' });
      area.appendChild(el('div', { class: 'ce-row' }, el('div', { class: 'ce-side' }, coin.svg, counter, el('div', { class: 'ce-btns' }, one, all)), table.el));
      area.appendChild(result);
      var made = 0;
      var busy = false;
      function flip() {
        var s = Math.random() < 0.5 ? 'H' : 'T';
        coin.set(s);
        coin.svg.classList.remove('ce-flip');
        void coin.svg.getBoundingClientRect();
        coin.svg.classList.add('ce-flip');
        table.add(s);
        made++;
        counter.textContent = 'Flips: ' + made + ' of 20';
        api.sound('pop');
        if (made === 20) finish();
      }
      function finish() {
        one.disabled = true;
        all.disabled = true;
        table.showTotals();
        var h = table.n.H, t = table.n.T;
        result.appendChild(MQ.ui.sum([h + ' heads', t + ' tails'], '20 flips'));
        var got = h > t + 2 ? 'H' : t > h + 2 ? 'T' : 'S';
        var name = { H: 'more heads', T: 'more tails', S: 'about the same' };
        var said = 'Heads and tails make 20 together. ';
        if (got === guess) api.say(said + 'You guessed ' + name[guess] + ', and it matched this time!', 'cheer');
        else api.say(said + 'It was ' + name[got] + ', not ' + name[guess] + '. That is fine. That is chance!', 'happy');
        api.unlockNext();
      }
      one.addEventListener('click', function () {
        if (busy || made >= 20) return;
        flip();
      });
      all.addEventListener('click', function () {
        if (busy || made >= 20) return;
        busy = true;
        one.disabled = true;
        all.disabled = true;
        (function step() {
          flip();
          if (made < 20) api.later(step, 140);
        })();
      });
    }
  }

  /* ---------------------------------------------------------------- *
   * Practice deck
   * ---------------------------------------------------------------- */
  var deck = null;
  var round1 = null; // { packets } from the first toy round

  function genCoin(pred, used) {
    for (var i = 0; i < 500; i++) {
      var c = flipCoins(20);
      if (pred(c) && used.indexOf(c.H) === -1) {
        used.push(c.H);
        return c;
      }
    }
    // fallback (practically never): accept any fresh result
    var d = flipCoins(20);
    used.push(d.H);
    return d;
  }
  function genDice(kind, usedN) {
    for (var i = 0; i < 2000; i++) {
      var n = U.rand(12, 30);
      if (usedN.indexOf(n) !== -1) continue;
      var c = throwDice(n);
      if (kind === 'most' && !uniqueExtreme(c, true)) continue;
      if (kind === 'least' && !uniqueExtreme(c, false)) continue;
      usedN.push(n);
      return { n: n, c: c };
    }
    return null;
  }
  function buildDeck() {
    var usedH = [];
    var usedN = [];
    var ext = U.pick(['most', 'least']);
    deck = [
      { type: 'heads', coin: genCoin(function (c) { return c.H >= 6 && c.H <= 14; }, usedH) },
      { type: 'tails', coin: genCoin(function (c) { return c.H >= 6 && c.H <= 14 && c.H !== 10; }, usedH) },
      { type: 'more', coin: genCoin(function (c) { return c.H !== 10; }, usedH) },
      { type: ext, dice: genDice(ext, usedN) },
      { type: 'total', dice: genDice('total', usedN) },
      { type: 'again', dice: genDice('again', usedN) },
      { type: 'gift1' },
      { type: 'gift2' },
    ];
    round1 = null;
  }

  function render(stage, api) {
    if (api.index === 0 || !deck) buildDeck();
    var q = deck[api.index] || deck[deck.length - 1];
    var wrap = el('div', { class: 'ce-q', 'data-type': q.type });
    stage.appendChild(wrap);
    if (q.type === 'heads' || q.type === 'tails' || q.type === 'more') coinQ(wrap, api, q);
    else if (q.type === 'most' || q.type === 'least') extremeQ(wrap, api, q);
    else if (q.type === 'total') totalQ(wrap, api, q);
    else if (q.type === 'again') againQ(wrap, api, q);
    else giftQ(wrap, api, q);
  }

  /* ---------- Level 1: coin tally ---------- */
  function coinQ(wrap, api, q) {
    var c = q.coin;
    var H = c.H, T = c.T;
    var hide = q.type === 'tails' ? { T: true } : null;
    var table = coinTable(c, { caption: 'A coin was flipped 20 times', hide: hide });
    var work = el('div', { class: 'ce-col' });
    if (q.type === 'heads') {
      api.say('Count the heads tally. Gates first!', 'think');
      wrap.appendChild(MQ.ui.prompt('How many times did the coin land on <b>heads</b>?'));
      wrap.appendChild(table.el);
      table.mark('H', 'ce-ask');
      var box = MQ.ui.numberInput({
        onSubmit: function (v) {
          if (v === H) {
            box.good();
            box.disable();
            table.showTotals(['H']);
            api.check(true);
            return;
          }
          box.bad();
          var m = readMistake(v, H, T, 20, 'heads');
          api.check(false, hint(api, m[0], 'Point at each gate and say 5, 10… then count on 1 for each single stick.'), m[1]);
        },
      });
      wrap.appendChild(box.el);
      wrap.appendChild(work);
      box.focus();
      api.onReveal(function () {
        box.setValue(H);
        box.good();
        box.disable();
        table.showTotals(['H']);
        table.mark('H', 'ce-good');
        work.appendChild(countLine('Heads', H));
      });
    } else if (q.type === 'tails') {
      api.say('Heads and tails together make all 20 flips.', 'think');
      wrap.appendChild(MQ.ui.prompt('The tails tally is hidden. The coin was flipped <b>20</b> times. How many times was it <b>tails</b>?'));
      wrap.appendChild(table.el);
      table.showTotals(['H']);
      table.mark('T', 'ce-ask');
      var box2 = MQ.ui.numberInput({
        onSubmit: function (v) {
          if (v === T) {
            box2.good();
            box2.disable();
            table.unhide('T');
            table.showTotals();
            work.appendChild(MQ.ui.sum([H + ' heads', T + ' tails'], '20 flips'));
            api.check(true, 'Yes! ' + H + ' + ' + T + ' = 20.');
            return;
          }
          box2.bad();
          var tag = 'Heads and tails don\'t add to the total';
          var msg;
          if (v === H) msg = 'That is the number of heads. Heads and tails must make 20 together.';
          else if (v === 20) msg = '20 is all the flips. Some of them were heads, so take those away.';
          else if (Math.abs(v - T) <= 2) {
            msg = 'Close! Check: does ' + H + ' + ' + v + ' make 20?';
            tag = 'Counted on to 20 wrong';
          } else msg = 'Heads + tails = 20. How many more than ' + H + ' make 20?';
          api.check(false, hint(api, msg, 'Count on from ' + H + ' to 20: ' + (H + 1) + ', ' + (H + 2) + ', … How many jumps?'), tag);
        },
      });
      wrap.appendChild(box2.el);
      wrap.appendChild(work);
      box2.focus();
      api.onReveal(function () {
        box2.setValue(T);
        box2.good();
        box2.disable();
        table.unhide('T');
        table.showTotals();
        table.mark('T', 'ce-good');
        work.appendChild(workLine('Count on from ' + H + ' to 20: that is ' + T + ' jumps.'));
        work.appendChild(MQ.ui.sum([H + ' heads', T + ' tails'], '20 flips'));
      });
    } else {
      api.say('Count both rows, then compare.', 'think');
      wrap.appendChild(MQ.ui.prompt('Which did the coin land on <b>more</b> often?'));
      wrap.appendChild(table.el);
      var ans = H > T ? 'H' : 'T';
      var ch = MQ.ui.choices(
        [
          { label: 'Heads', value: 'H' },
          { label: 'Tails', value: 'T' },
          { label: 'The same', value: 'S' },
        ],
        function (v) {
          if (v === ans) {
            ch.mark(v, 'good');
            ch.disable();
            table.showTotals();
            table.mark(ans, 'ce-good');
            api.check(true, (ans === 'H' ? 'Heads' : 'Tails') + ': ' + Math.max(H, T) + ' is more than ' + Math.min(H, T) + '.');
            return;
          }
          ch.mark(v, 'bad');
          if (v === 'S') api.check(false, hint(api, 'Coins don\'t always land 10 and 10. Count both rows.', 'Count heads: gates in 5s, then sticks. Now tails. Are they equal?'), 'Expected 10 heads and 10 tails');
          else api.check(false, hint(api, 'Count both tallies again. Which number is bigger?', 'Write down heads, then tails. Pick the bigger number.'), 'Misread the most common result');
        },
        { columns: 3 }
      );
      wrap.appendChild(ch);
      wrap.appendChild(work);
      api.onReveal(function () {
        ch.disable();
        ch.mark(ans, 'good');
        table.showTotals();
        table.mark(ans, 'ce-good');
        work.appendChild(countLine('Heads', H));
        work.appendChild(countLine('Tails', T));
        work.appendChild(workLine(Math.max(H, T) + ' is more than ' + Math.min(H, T) + ', so ' + (ans === 'H' ? 'heads' : 'tails') + ' came up more.'));
      });
    }
  }

  /** [hint, tag] for a wrong reading v of one tally row worth n (other row worth other). */
  function readMistake(v, n, other, total, name) {
    if (v === other) return ['That is the other row. Read the ' + name + ' row.', 'Read the wrong row'];
    if (v === total) return [total + ' is all the flips. Just count the ' + name + ' tally.', 'Gave the total, not one row'];
    if (n >= 5 && v === gateAsOne(n)) return ['Each gate is worth 5, not 1. Count the gates in 5s.', 'Counted a gate as 1'];
    if (n >= 5 && v === n - Math.floor(n / 5)) return ['A gate has 5 lines: 4 sticks and the line across.', 'Missed the line across a gate'];
    return ['Count the gates in 5s, then count on the single sticks.', 'Miscounted the tally'];
  }

  /* ---------- Level 2: dice tally ---------- */
  function extremeQ(wrap, api, q) {
    var c = q.dice.c, most = q.type === 'most';
    var ans = uniqueExtreme(c, most);
    var word = most ? 'most' : 'fewest';
    api.say(most ? 'Find the number with the biggest tally.' : 'Find the number with the smallest tally.', 'think');
    wrap.appendChild(MQ.ui.prompt('A dice was thrown ' + q.dice.n + ' times. Which number came up the <b>' + (most ? 'most' : 'fewest times') + '</b>?'));
    var table = diceTable(c, { caption: q.dice.n + ' throws of a dice' });
    wrap.appendChild(table.el);
    var work = el('div', { class: 'ce-col' });
    var ch = MQ.ui.choices(
      FACES.map(function (f) {
        return { label: el('span', { class: 'ce-chface' }, diceFace(f, 30).svg, el('b', null, String(f))), value: f };
      }),
      function (v) {
        if (v === ans) {
          ch.mark(v, 'good');
          ch.disable();
          table.showTotals();
          table.mark(ans, 'ce-good');
          api.check(true, ans + ' came up ' + plural(c[ans], 'time') + '. That is the ' + word + '.');
          return;
        }
        ch.mark(v, 'bad');
        var opp = uniqueExtreme(c, !most);
        var tag = most ? 'Misread the most common result' : 'Misread the least common result';
        var msg;
        var g1 = FACES.map(function (f) { return gateAsOne(c[f]); });
        var g1best = most ? Math.max.apply(null, g1) : Math.min.apply(null, g1);
        if (v === opp) msg = 'That number came up the ' + (most ? 'fewest' : 'most') + ' times. Look for the ' + (most ? 'biggest' : 'smallest') + ' tally.';
        else if (gateAsOne(c[v]) === g1best && c[v] !== c[ans]) {
          msg = 'A gate is worth 5. Count each row in 5s, then 1s.';
          tag = 'Counted a gate as 1';
        } else msg = 'Count ' + v + "'s row again, then the others. Which is the " + (most ? 'biggest' : 'smallest') + '?';
        api.check(false, hint(api, msg, 'Count every row: gates in 5s, then sticks. Write the 6 numbers down.'), tag);
      },
      { columns: 6 }
    );
    wrap.appendChild(ch);
    wrap.appendChild(work);
    api.onReveal(function () {
      ch.disable();
      ch.mark(ans, 'good');
      table.showTotals();
      table.mark(ans, 'ce-good');
      work.appendChild(workLine(ans + ' came up ' + plural(c[ans], 'time') + '. Every other number came up ' + (most ? 'fewer' : 'more') + ' times.'));
    });
  }

  function totalQ(wrap, api, q) {
    var c = q.dice.c, N = q.dice.n;
    api.say('Each tally mark is one throw.', 'think');
    wrap.appendChild(MQ.ui.prompt('How many times was the dice thrown <b>altogether</b>?'));
    var table = diceTable(c, { caption: 'Dice throws' });
    wrap.appendChild(table.el);
    var work = el('div', { class: 'ce-col' });
    var vals = diceVals(c);
    var box = MQ.ui.numberInput({
      unit: 'throws',
      onSubmit: function (v) {
        if (v === N) {
          box.good();
          box.disable();
          table.showTotals();
          work.appendChild(MQ.ui.sum(vals, N));
          api.check(true);
          return;
        }
        box.bad();
        var msg, tag = 'Added the throws wrong';
        if (v === 6) {
          msg = 'There are 6 rows, but each mark is a throw. Count all the marks.';
          tag = 'Counted the rows, not the marks';
        } else if (v === sum(vals.map(gateAsOne))) {
          msg = 'Each gate is worth 5, not 1.';
          tag = 'Counted a gate as 1';
        } else if (Math.abs(v - N) <= 3) msg = 'Very close! Find each row\'s number, then add them carefully.';
        else msg = 'Find the number for each row, then add all 6 numbers.';
        api.check(false, hint(api, msg, 'Count all the gates in 5s first, then count on every single stick.'), tag);
      },
    });
    wrap.appendChild(box.el);
    wrap.appendChild(work);
    box.focus();
    api.onReveal(function () {
      box.setValue(N);
      box.good();
      box.disable();
      table.showTotals();
      work.appendChild(MQ.ui.sum(vals, N, 'throws'));
    });
  }

  function againQ(wrap, api, q) {
    var c = q.dice.c, N = q.dice.n;
    api.say('Think about chance!', 'think');
    wrap.appendChild(MQ.ui.prompt('Here are ' + N + ' dice throws. If we throw ' + N + ' times <b>again</b>, will we get the same results?'));
    var row = el('div', { class: 'ce-row' });
    var table = diceTable(c, { caption: 'First ' + N + ' throws' });
    table.showTotals();
    row.appendChild(table.el);
    wrap.appendChild(row);
    var work = el('div', { class: 'ce-col' });
    var ch = MQ.ui.choices(
      [
        { label: 'Yes, exactly the same', value: 'yes' },
        { label: 'No, never the same', value: 'no' },
        { label: 'Probably different', value: 'prob' },
      ],
      function (v) {
        if (v === 'prob') {
          ch.mark(v, 'good');
          ch.disable();
          api.check(true, 'Yes! Chance results are almost always different next time.');
          return;
        }
        ch.mark(v, 'bad');
        if (v === 'yes') api.check(false, hint(api, 'A dice does not remember. Each throw is chance, so the tally changes.', 'Remember when Bolt threw twice? The two tallies were different.'), 'Expected the same result every time');
        else api.check(false, hint(api, 'Could it be the same? It could happen, but it is very unlikely.', 'Same results are possible, just very rare. So we say…'), "Thought it can never be the same");
      },
      { columns: 3 }
    );
    wrap.appendChild(ch);
    wrap.appendChild(work);
    api.onReveal(function () {
      ch.disable();
      ch.mark('prob', 'good');
      var c2 = throwDice(N);
      var t2 = diceTable(c2, { caption: 'Thrown again: ' + N + ' throws' });
      t2.showTotals();
      var diff = FACES.filter(function (f) {
        return c2[f] !== c[f];
      });
      diff.forEach(function (f) {
        t2.mark(f, 'ce-diff');
        table.mark(f, 'ce-diff');
      });
      row.appendChild(t2.el);
      work.appendChild(workLine(diff.length ? 'Bolt threw again: ' + plural(diff.length, 'row') + ' changed. Chance results are probably different each time.' : 'Bolt threw again and it matched! That is very rare. Usually it is different.'));
    });
  }

  /* ---------- Level 3: collect all 6 toys from cereal packets ---------- */
  function giftQ(wrap, api, q) {
    var second = q.type === 'gift2';
    var prev = round1;
    var prevSim = false;
    if (second && !prev) {
      prev = { packets: simulateRound() };
      prevSim = true;
    }
    api.say(second ? 'Round 2! Will it take the same number of packets?' : 'Each packet has one toy inside. Collect all 6!', 'think');
    wrap.appendChild(MQ.ui.prompt((second ? 'Round 2. ' : '') + 'Each cereal packet has <b>one toy</b>, chosen by chance. Open packets until you have <b>all 6 toys</b>.'));
    var got = {};
    TOYS.forEach(function (t) {
      got[t.k] = 0;
    });
    var packets = 0;
    var shelf = el('div', { class: 'ce-shelf' });
    var slots = {};
    TOYS.forEach(function (t) {
      var n = el('span', { class: 'ce-toyn' }, '');
      var s = el('div', { class: 'ce-toy', 'data-toy': t.k }, el('span', { class: 'ce-toyi' }, t.icon), el('span', { class: 'ce-toyname' }, t.name), n);
      slots[t.k] = { el: s, n: n };
      shelf.appendChild(s);
    });
    var box = el('div', { class: 'ce-packet' }, el('span', { class: 'ce-pk' }, '🥣'), el('span', { class: 'ce-pkt' }, 'Cereal'));
    var pop = el('div', { class: 'ce-pop' }, '');
    var one = el('button', { class: 'btn ce-go', type: 'button' }, 'Open a packet');
    var five = el('button', { class: 'btn ce-go2', type: 'button' }, 'Open 5 packets');
    var tallyBox = el('div', { class: 'ce-ptally' });
    var tallyCap = el('div', { class: 'ce-cap' }, 'Packets opened (one mark for each packet)');
    var tallyHold = el('div', { class: 'ce-tallyhold' }, tallySvg(0, 6));
    tallyBox.appendChild(tallyCap);
    tallyBox.appendChild(tallyHold);
    var tallyRow = el('div', { class: 'ce-row ce-tallyrow' }, tallyBox);
    var side = el('div', { class: 'ce-side' }, box, pop, el('div', { class: 'ce-btns' }, one, five));
    var giftRow = el('div', { class: 'ce-row' }, side, el('div', { class: 'ce-col ce-giftright' }, shelf, tallyRow));
    wrap.appendChild(giftRow);
    var ask = el('div', { class: 'ce-col' });
    wrap.appendChild(ask);
    var busy = false;
    var done = false;
    function haveAll() {
      return TOYS.every(function (t) {
        return got[t.k] > 0;
      });
    }
    function open() {
      var t = U.pick(TOYS);
      packets++;
      got[t.k]++;
      slots[t.k].el.classList.add('ce-have');
      slots[t.k].n.textContent = '×' + got[t.k];
      MQ.clear(pop);
      pop.appendChild(el('span', { class: 'ce-popi' }, t.icon));
      pop.appendChild(el('span', null, got[t.k] > 1 ? 'Another ' + t.name + '!' : 'A ' + t.name + '! New!'));
      MQ.clear(tallyHold);
      tallyHold.appendChild(tallySvg(packets, 6, true));
      api.sound('pop');
      if (haveAll()) finish();
    }
    function finish() {
      done = true;
      one.disabled = true;
      five.disabled = true;
      wrap.setAttribute('data-packets', String(packets));
      tallyCap.textContent = (second ? 'This round: ' : '') + 'packets opened';
      side.classList.add('ce-gone');
      api.say('All 6 toys! Now look at your packets tally.', 'cheer');
      if (!second) {
        round1 = { packets: packets };
        askCount();
      } else askCompare();
    }
    one.addEventListener('click', function () {
      if (busy || done) return;
      open();
    });
    five.addEventListener('click', function () {
      if (busy || done) return;
      busy = true;
      one.disabled = true;
      five.disabled = true;
      var k = 0;
      (function step() {
        open();
        k++;
        if (!done && k < 5) api.later(step, 150);
        else if (!done) {
          busy = false;
          one.disabled = false;
          five.disabled = false;
        }
      })();
    });
    api.onReveal(function () {});

    function askCount() {
      ask.appendChild(MQ.ui.prompt('How many <b>packets</b> did you open?'));
      var work = el('div', { class: 'ce-col' });
      var inp = MQ.ui.numberInput({
        unit: 'packets',
        onSubmit: function (v) {
          if (v === packets) {
            inp.good();
            inp.disable();
            api.check(true, packets + ' packets to get all 6 toys!');
            return;
          }
          inp.bad();
          var msg = 'Count the packets tally: gates in 5s, then the single sticks.', tag = 'Miscounted the tally';
          if (v === 6) {
            msg = 'There are 6 toys, but some came more than once. Count the packets tally.';
            tag = 'Counted the toys, not the packets';
          } else if (packets >= 5 && v === gateAsOne(packets)) {
            msg = 'Each gate is worth 5, not 1.';
            tag = 'Counted a gate as 1';
          }
          api.check(false, hint(api, msg, 'Point at each gate: 5, 10, 15… then count on 1 for each stick.'), tag);
        },
      });
      ask.appendChild(inp.el);
      ask.appendChild(work);
      inp.focus();
      api.onReveal(function () {
        inp.setValue(packets);
        inp.good();
        inp.disable();
        tallyHold.classList.add('ce-lit');
        work.appendChild(countLine('Packets', packets));
      });
    }

    function askCompare() {
      var P = prev.packets;
      var ans = packets > P ? 'more' : packets < P ? 'fewer' : 'same';
      var cmp = el('div', { class: 'ce-ptally ce-prev' }, el('div', { class: 'ce-cap' }, (prevSim ? "Bolt's round" : 'Round 1') + ': ' + P + ' packets'), tallySvg(P, 6));
      tallyRow.insertBefore(cmp, tallyBox);
      ask.appendChild(MQ.ui.prompt('Did this round need more packets, fewer, or the same as ' + (prevSim ? "Bolt's round" : 'Round 1') + '?'));
      var work = el('div', { class: 'ce-col' });
      var ch = MQ.ui.choices(
        [
          { label: 'More than ' + P, value: 'more' },
          { label: 'Fewer than ' + P, value: 'fewer' },
          { label: 'The same: ' + P, value: 'same' },
        ],
        function (v) {
          if (v === ans) {
            ch.mark(v, 'good');
            ch.disable();
            api.check(true, ans === 'same' ? 'The same, ' + P + ' both times! That is rare.' : 'This round: ' + packets + ' packets. Different! That is chance.');
            return;
          }
          ch.mark(v, 'bad');
          var tag = v === 'same' ? 'Expected the same result every time' : 'Miscounted the tally';
          api.check(false, hint(api, 'Count your packets tally first: gates in 5s, then sticks. Then compare with ' + P + '.', packets >= 5 ? 'Your tally has ' + plural(Math.floor(packets / 5), 'gate') + '. Count them in 5s, count on the sticks, then compare with ' + P + '.' : 'Count the sticks one by one, then compare with ' + P + '.'), tag);
        },
        { columns: 3 }
      );
      ask.appendChild(ch);
      ask.appendChild(work);
      api.onReveal(function () {
        ch.disable();
        ch.mark(ans, 'good');
        tallyHold.classList.add('ce-lit');
        work.appendChild(countLine('Last round', P));
        work.appendChild(countLine('This round', packets));
        work.appendChild(workLine(packets === P ? 'Both rounds needed ' + P + '. That is rare!' : packets + ' is ' + (ans === 'more' ? 'more' : 'fewer') + ' than ' + P + '. Each round is different, because the toys come by chance.'));
      });
    }
  }
  function simulateRound() {
    var seen = {}, n = 0, have = 0;
    while (have < 6) {
      var k = U.rand(0, 5);
      n++;
      if (!seen[k]) {
        seen[k] = 1;
        have++;
      }
    }
    return n;
  }

  MQ.register('chance-experiment', {
    learn: [learnConjecture, learnAgain, learnCoin],
    practice: { count: 8, render: render },
  });

  var css = [
    '.ce-q{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.ce-row{display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start;justify-content:center;width:100%}',
    '.ce-col{display:flex;flex-direction:column;align-items:center;gap:8px;max-width:100%}',
    '.ce-side{display:flex;flex-direction:column;align-items:center;gap:10px;min-width:150px;align-self:center}',
    '.ce-side-s{min-width:130px}',
    '.ce-btns{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.ce-go{background:#ffd166;color:#2b1d00}',
    '.ce-go2{background:#cfe8ff;color:#123}',
    '.ce-counter{font-size:1.15rem;font-weight:800;color:#0b6e66}',
    '.ce-result{font-size:1.2rem;font-weight:800;text-align:center;min-height:1.4em;color:#1b2a4a}',
    '.ce-tablewrap{display:flex;flex-direction:column;align-items:center;gap:6px;max-width:100%}',
    '.ce-cap{font-weight:800;color:#3a4a6b;text-align:center}',
    '.ce-table{border-collapse:collapse;background:#fff;font-size:1.1rem}',
    '.ce-table th,.ce-table td{border:2px solid #9fb0d6;padding:3px 10px;text-align:left;vertical-align:middle}',
    '.ce-table thead th{background:var(--paper-2);font-weight:800}',
    '.ce-tcell{min-width:130px;height:38px}',
    '.ce-f{display:none;text-align:center!important;font-weight:800;font-size:1.25rem;min-width:52px;color:#0b6e66}',
    '.ce-showf .ce-f{display:table-cell}',
    '.ce-guess{text-align:center!important;font-weight:800;color:#8a5a00;background:#fffaf0}',
    '.ce-rowlab{display:inline-flex;align-items:center;gap:8px;white-space:nowrap}',
    '.ce-tally{display:block;max-width:none}',
    '.ce-stroke{stroke:#2b3a55;stroke-width:4;stroke-linecap:round;fill:none}',
    '.ce-new{stroke-dasharray:1;stroke-dashoffset:0;animation:ce-draw .18s ease-out}',
    '@keyframes ce-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}',
    '.ce-hidden{display:inline-block;font-size:1.5rem;font-weight:800;color:#8a5a00;background:#fff3cd;border:2px dashed var(--gold);border-radius:10px;padding:0 18px}',
    '.ce-table tr.ce-ask td{background:#fffaf0}',
    '.ce-table tr.ce-ask .ce-labcell{box-shadow:inset 5px 0 0 var(--gold)}',
    '.ce-table tr.ce-good td{background:var(--good-bg)}',
    '.ce-table tr.ce-good .ce-stroke{stroke:#0b6e66}',
    '.ce-table tr.ce-diff td{background:#e3ecff}',
    '.ce-die-body{fill:#fff;stroke:#2b3a55;stroke-width:5}',
    '.ce-pip{fill:#2b3a55}',
    '.ce-die{display:block;flex:none}',
    '.ce-roll{animation:ce-roll .18s ease-out}',
    '@keyframes ce-roll{from{transform:rotate(-25deg) scale(.85)}to{transform:none}}',
    '.ce-coin{display:block;flex:none}',
    '.ce-coin-body{fill:#f2c14e;stroke:#a0761a;stroke-width:4}',
    '.ce-coin-ring{fill:none;stroke:#c99a2e;stroke-width:3}',
    '.ce-coin-txt{font-size:44px;font-weight:800;fill:#6b4b0c}',
    '.ce-flip{animation:ce-flip .13s ease-out}',
    '@keyframes ce-flip{from{transform:scaleX(.1)}to{transform:none}}',
    '.ce-chface{display:inline-flex;align-items:center;gap:6px}',
    '.ce-work{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;font-size:1.15rem;font-weight:700;text-align:center;max-width:680px}',
    '.ce-wname{font-weight:800}',
    '.ce-shelf{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;max-width:100%}',
    '.ce-toy{display:flex;flex-direction:column;align-items:center;gap:2px;background:#f3f4f7;border:2px dashed #b8c0d4;border-radius:12px;padding:6px 4px;min-width:62px;opacity:.55}',
    '.ce-toy.ce-have{background:var(--good-bg);border:2px solid var(--good);opacity:1}',
    '.ce-toyi{font-size:1.8rem;line-height:1}',
    '.ce-toyname{font-size:.9rem;font-weight:700}',
    '.ce-toyn{font-size:.9rem;font-weight:800;color:#0b6e66;min-height:1.1em}',
    '.ce-packet{display:flex;flex-direction:column;align-items:center;background:#fff3cd;border:3px solid #e3c77a;border-radius:14px;padding:8px 22px}',
    '.ce-pk{font-size:2.6rem;line-height:1.1}',
    '.ce-pkt{font-weight:800;color:#8a5a00}',
    '.ce-pop{display:flex;align-items:center;gap:8px;font-weight:800;min-height:2.4rem}',
    '.ce-popi{font-size:2rem}',
    '.ce-ptally{display:flex;flex-direction:column;align-items:center;gap:4px;background:#fff;border:2px solid var(--line);border-radius:14px;padding:8px 12px;max-width:100%;box-sizing:border-box;min-width:240px}',
    '.ce-tallyhold{min-height:46px}',
    '.ce-lit .ce-stroke{stroke:#0b6e66}',
    '.ce-prev{background:#f6f8fc}',
    '.ce-giftright{gap:10px}',
    '.ce-gone{display:none}',
    '.ce-prev{min-width:0}',
    '.ce-tallyrow{gap:12px;align-items:stretch}',
    '@media (max-width:820px){.ce-table{font-size:1rem}.ce-table th,.ce-table td{padding:3px 6px}.ce-toy{min-width:0}.ce-tcell{min-width:100px}.ce-ptally{min-width:0}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'chance-experiment' }, css));
})();

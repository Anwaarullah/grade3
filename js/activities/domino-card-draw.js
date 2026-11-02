/* What could I pick? — dominoes and number cards: will, might or won't (Unit 16.1).
 * Every answer is worked out from the exact dominoes / cards drawn on screen:
 *   will  = every item fits the rule, might = some do and some don't, won't = none do.
 * Two cards are always two DIFFERENT cards (no card is used twice).
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  /* ------------------------------------------------------------------ *
   * Chance words
   * ------------------------------------------------------------------ */
  var WORDS = {
    will: { label: '✅ Will happen', short: 'will happen' },
    might: { label: '❓ Might happen', short: 'might happen' },
    wont: { label: '❌ Won’t happen', short: 'will not happen' },
  };

  function chanceChoices(onPick) {
    var ch = MQ.ui.choices(
      ['will', 'might', 'wont'].map(function (k) {
        return { label: WORDS[k].label, value: k };
      }),
      onPick,
      { columns: 3 }
    );
    ch.classList.add('dmc-choices');
    ch.buttons.forEach(function (b) {
      b.setAttribute('data-v', b.value_);
    });
    return ch;
  }

  /** all fit → will, some fit → might, none fit → wont */
  function verdict(list, test) {
    var n = list.filter(test).length;
    if (n === list.length) return 'will';
    if (n === 0) return 'wont';
    return 'might';
  }

  /* ------------------------------------------------------------------ *
   * Rules about a total
   * ------------------------------------------------------------------ */
  function ruleTest(rule) {
    return function (v) {
      if (rule.kind === 'exact') return v === rule.t;
      if (rule.kind === 'more') return v > rule.t;
      return v < rule.t;
    };
  }
  function ruleText(rule) {
    if (rule.kind === 'exact') return 'exactly <b>' + rule.t + '</b>';
    if (rule.kind === 'more') return 'more than <b>' + rule.t + '</b>';
    return 'less than <b>' + rule.t + '</b>';
  }
  function rulePlain(rule) {
    return ruleText(rule).replace(/<\/?b>/g, '');
  }

  /* ------------------------------------------------------------------ *
   * Domino drawing: two square halves, standard pip layouts, blank = 0
   * ------------------------------------------------------------------ */
  var HS = 60; // half size
  var PIPS = {
    0: [],
    1: [[2, 2]],
    2: [[1, 1], [3, 3]],
    3: [[1, 1], [2, 2], [3, 3]],
    4: [[1, 1], [3, 1], [1, 3], [3, 3]],
    5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]],
    6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]],
  };

  function pipsGroup(n, x0) {
    var g = S('g', { class: 'dmc-pips' });
    PIPS[n].forEach(function (p) {
      g.appendChild(S('circle', { cx: x0 + p[0] * (HS / 4), cy: 4 + p[1] * (HS / 4), r: 6, class: 'dmc-pip' }));
    });
    return g;
  }

  /**
   * One domino as its own SVG. d = [a, b]. opts.faceDown starts it hidden.
   * Returns { el, svg, flip(), up, halves: [g, g] }
   */
  function domino(d, opts) {
    opts = opts || {};
    var W = HS * 2 + 8;
    var H = HS + 8;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'dmc-dom-svg', role: 'img', 'aria-label': 'domino ' + d[0] + ' and ' + d[1] });
    var face = S('g', { class: 'dmc-face' });
    face.appendChild(S('rect', { x: 2, y: 2, width: W - 4, height: H - 4, rx: 10, class: 'dmc-dom-body' }));
    var halves = [];
    [0, 1].forEach(function (i) {
      var hx = 4 + i * HS;
      var g = S('g', { class: 'dmc-half', 'data-half': i, 'data-n': d[i] });
      g.appendChild(S('rect', { x: hx, y: 4, width: HS, height: HS, rx: 7, class: 'dmc-half-hit' }));
      g.appendChild(pipsGroup(d[i], hx));
      face.appendChild(g);
      halves.push(g);
    });
    face.appendChild(S('line', { x1: W / 2, y1: 10, x2: W / 2, y2: H - 10, class: 'dmc-mid' }));
    var back = S('g', { class: 'dmc-back' });
    back.appendChild(S('rect', { x: 2, y: 2, width: W - 4, height: H - 4, rx: 10, class: 'dmc-back-body' }));
    back.appendChild(S('rect', { x: 10, y: 10, width: W - 20, height: H - 20, rx: 6, class: 'dmc-back-inner' }));
    back.appendChild(S('text', { x: W / 2, y: H / 2 + 9, 'text-anchor': 'middle', class: 'dmc-back-q' }, '?'));
    root.appendChild(face);
    root.appendChild(back);
    var label = el('div', { class: 'dmc-dom-label' }, ' ');
    var wrap = el('div', { class: 'dmc-dom', 'data-a': d[0], 'data-b': d[1], 'data-total': d[0] + d[1] }, root, label);
    var api = {
      el: wrap,
      svg: root,
      label: label,
      halves: halves,
      up: !opts.faceDown,
      flip: function () {
        api.up = true;
        wrap.classList.remove('dmc-down');
        wrap.classList.add('dmc-flipped');
      },
      setLabel: function (html, kind) {
        label.innerHTML = html;
        label.className = 'dmc-dom-label' + (kind ? ' dmc-' + kind : '');
      },
    };
    if (opts.faceDown) wrap.classList.add('dmc-down');
    return api;
  }

  function dominoRow(list, opts) {
    var row = el('div', { class: 'dmc-dom-row' });
    var items = list.map(function (d) {
      var dm = domino(d, opts);
      row.appendChild(dm.el);
      return dm;
    });
    return { el: row, items: items };
  }

  /* ------------------------------------------------------------------ *
   * Number line / sum strip (SVG). Jumps from 0 → a → a + b.
   * ------------------------------------------------------------------ */
  function numberLine(max, opts) {
    opts = opts || {};
    var step = max <= 13 ? 48 : max <= 16 ? 40 : 32;
    var padX = 24;
    var W = padX * 2 + max * step;
    var base = opts.base || 84;
    var H = base + 34;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'dmc-line', role: 'img', 'aria-label': 'number line 0 to ' + max });
    var under = S('g');
    var jumps = S('g');
    var top = S('g');
    function x(v) {
      return padX + v * step;
    }
    root.appendChild(under);
    root.appendChild(S('line', { x1: x(0) - 8, y1: base, x2: x(max) + 8, y2: base, class: 'dmc-axis' }));
    var ticks = [];
    for (var v = 0; v <= max; v++) {
      root.appendChild(S('line', { x1: x(v), y1: base - 7, x2: x(v), y2: base + 7, class: 'dmc-tick' }));
      var t = S('text', { x: x(v), y: base + 26, 'text-anchor': 'middle', class: 'dmc-tick-num' }, String(v));
      root.appendChild(t);
      ticks.push(t);
    }
    root.appendChild(jumps);
    root.appendChild(top);
    var stacks = {};
    return {
      el: root,
      x: x,
      clearJumps: function () {
        MQ.clear(jumps);
      },
      clearAll: function () {
        MQ.clear(jumps);
        MQ.clear(top);
        MQ.clear(under);
        stacks = {};
        ticks.forEach(function (t) {
          t.setAttribute('class', 'dmc-tick-num');
        });
      },
      /** Two hops: 0 → a, then a → a + b. level lifts the arcs for several pairs. */
      jump: function (a, b, cls, level) {
        level = level || 0;
        var h1 = 26 + level * 14;
        var hop = function (from, to, lab) {
          var x1 = x(from);
          var x2 = x(to);
          var mid = (x1 + x2) / 2;
          var h = Math.min(h1 + Math.abs(to - from) * 2, base - 14);
          jumps.appendChild(S('path', { d: 'M' + x1 + ' ' + base + ' Q' + mid + ' ' + (base - h * 2) + ' ' + x2 + ' ' + base, class: 'dmc-arc ' + (cls || '') }));
          jumps.appendChild(S('text', { x: mid, y: base - h - 4, 'text-anchor': 'middle', class: 'dmc-arc-lab ' + (cls || '') }, lab));
        };
        hop(0, a, '+' + a);
        hop(a, a + b, '+' + b);
        jumps.appendChild(S('circle', { cx: x(a + b), cy: base, r: 7, class: 'dmc-end ' + (cls || '') }));
      },
      /** A sum strip: rod of length a then rod of length b, stacked in row `row` above the line. */
      rods: function (a, b, row, tag) {
        var y = base - 34 - row * 24;
        [[0, a, 'dmc-rod-a'], [a, a + b, 'dmc-rod-b']].forEach(function (r) {
          jumps.appendChild(S('rect', { x: x(r[0]) + 1, y: y, width: x(r[1]) - x(r[0]) - 2, height: 20, rx: 5, class: 'dmc-rod ' + r[2] }));
          jumps.appendChild(S('text', { x: (x(r[0]) + x(r[1])) / 2, y: y + 15, 'text-anchor': 'middle', class: 'dmc-rod-lab' }, String(r[1] - r[0])));
        });
        jumps.appendChild(S('line', { x1: x(a + b), y1: y + 20, x2: x(a + b), y2: base, class: 'dmc-rod-drop' }));
        if (tag) jumps.appendChild(S('text', { x: x(a + b) + 8, y: y + 16, class: 'dmc-rod-tag ' + (tag === '✓' ? 'dmc-tag-ok' : 'dmc-tag-no') }, tag));
      },
      /** Flag a target value. */
      mark: function (v, cls) {
        if (v > max) return;
        top.appendChild(S('circle', { cx: x(v), cy: base, r: 12, class: 'dmc-mark ' + (cls || '') }));
        if (ticks[v]) ticks[v].setAttribute('class', 'dmc-tick-num dmc-tick-strong');
      },
      /** Shade the values that fit a test (green band under the line). */
      shade: function (test) {
        for (var v = 0; v <= max; v++) {
          if (!test(v)) continue;
          var x0 = v === 0 ? x(0) - 8 : x(v) - step / 2;
          var x1 = v === max ? x(max) + 8 : x(v) + step / 2;
          under.appendChild(S('rect', { x: x0, y: base - 12, width: x1 - x0, height: 24, class: 'dmc-shade' }));
        }
      },
      /** Stack a dot above a value (one per domino total). */
      dot: function (v, ok) {
        stacks[v] = (stacks[v] || 0) + 1;
        top.appendChild(S('circle', { cx: x(v), cy: base - 6 - stacks[v] * 16, r: 7, class: 'dmc-dot ' + (ok ? 'dmc-dot-ok' : 'dmc-dot-no') }));
      },
    };
  }

  /* ------------------------------------------------------------------ *
   * Number cards
   * ------------------------------------------------------------------ */
  function cardRow(n, onPick) {
    var row = el('div', { class: 'dmc-cards' });
    var cards = U.range(1, n).map(function (v) {
      var c = el('button', { class: 'dmc-card', type: 'button', 'data-n': v, 'aria-label': 'card ' + v }, String(v));
      c.addEventListener('click', function () {
        if (row.classList.contains('dmc-locked')) return;
        MQ.sound('pop');
        onPick(v, c);
      });
      row.appendChild(c);
      return c;
    });
    row.select = function (vals) {
      cards.forEach(function (c, i) {
        c.classList.toggle('dmc-sel', vals.indexOf(i + 1) !== -1);
      });
    };
    row.lock = function () {
      row.classList.add('dmc-locked');
    };
    return row;
  }

  function allPairs(n) {
    var out = [];
    for (var a = 1; a <= n; a++) for (var b = a + 1; b <= n; b++) out.push([a, b]);
    return out;
  }
  function pairsMaking(n, t) {
    return allPairs(n).filter(function (p) {
      return p[0] + p[1] === t;
    });
  }

  /** Click two different cards; shows the sum on the strip. Returns {el, picks} */
  function sumPicker(n, lineMax, onPair) {
    var picks = [];
    var line = numberLine(lineMax);
    var sumText = el('div', { class: 'dmc-sum-text' }, 'Click two cards to add them.');
    var row = cardRow(n, function (v) {
      if (picks.length === 2) picks = [];
      if (picks.indexOf(v) !== -1) {
        picks = picks.filter(function (p) {
          return p !== v;
        });
      } else picks.push(v);
      row.select(picks);
      line.clearJumps();
      if (picks.length === 2) {
        var a = Math.min(picks[0], picks[1]);
        var b = Math.max(picks[0], picks[1]);
        line.jump(a, b, 'dmc-try');
        sumText.innerHTML = a + ' + ' + b + ' = <b>' + (a + b) + '</b>';
        if (onPair) onPair(a, b, sumText, line);
      } else if (picks.length === 1) {
        sumText.innerHTML = picks[0] + ' + ?';
      } else sumText.textContent = 'Click two cards to add them.';
    });
    var lineWrap = el('div', { class: 'dmc-line-wrap' }, line.el);
    return { row: row, line: line, lineWrap: lineWrap, sumText: sumText };
  }

  /* ------------------------------------------------------------------ *
   * Learn-screen dominoes (my own halves; totals 1, 4, 4, 5, 7, 10)
   * ------------------------------------------------------------------ */
  var LEARN_SET = [[2, 3], [0, 1], [4, 6], [1, 3], [3, 4], [2, 2]];

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  var ALL_DOMS = [];
  for (var da = 0; da <= 6; da++) for (var db = da; db <= 6; db++) ALL_DOMS.push([da, db]);

  function total(d) {
    return d[0] + d[1];
  }

  /** Rules (about a domino total) that give the wanted verdict for these totals. */
  function domRules(totals, want) {
    var c = [];
    var mn = Math.min.apply(null, totals);
    var mx = Math.max.apply(null, totals);
    var t;
    for (t = 0; t <= 12; t++) c.push({ kind: 'exact', t: t });
    c.push({ kind: 'exact', t: 20 });
    for (t = 0; t <= 11; t++) c.push({ kind: 'more', t: t });
    for (t = 1; t <= 13; t++) c.push({ kind: 'less', t: t });
    c = c.filter(function (r) {
      return verdict(totals, ruleTest(r)) === want;
    });
    // keep the rules close to the data (more interesting than "less than 13")
    if (want === 'will') {
      c = c.filter(function (r) {
        return r.kind === 'more' ? r.t >= mn - 2 : r.kind === 'less' ? r.t <= mx + 3 : true;
      });
    }
    if (want === 'wont') {
      c = c.filter(function (r) {
        if (r.kind === 'more') return r.t <= mx + 2;
        if (r.kind === 'less') return r.t >= mn - 2;
        return true;
      });
    }
    return c;
  }

  function domKey(q) {
    return 'd|' + q.doms.map(function (d) { return Math.min(d[0], d[1]) + ':' + Math.max(d[0], d[1]); }).sort().join(',') + '|' + q.rule.kind + q.rule.t;
  }

  function makeDominoQ(want, used, forceZeroRule) {
    for (var tries = 0; tries < 400; tries++) {
      var n = U.rand(4, 6);
      var pool = U.shuffle(ALL_DOMS);
      var blanks = pool.filter(function (d) { return d[0] === 0; });
      var doms = [U.pick(blanks)];
      pool.forEach(function (d) {
        if (doms.length < n && doms.indexOf(d) === -1) doms.push(d);
      });
      doms = U.shuffle(doms).map(function (d) {
        return Math.random() < 0.5 ? [d[1], d[0]] : d.slice();
      });
      var totals = doms.map(total);
      var rules = domRules(totals, want);
      if (forceZeroRule) {
        rules = rules.filter(function (r) {
          return (r.kind === 'more' && r.t === 0) || (r.kind === 'exact' && r.t === 0);
        });
      }
      // occasionally use the "20" rule for won't
      if (want === 'wont' && !forceZeroRule && Math.random() < 0.25) {
        rules = rules.filter(function (r) { return r.t === 20; });
      }
      if (!rules.length) continue;
      var q = { type: 'domino', doms: doms, rule: U.pick(rules), want: want };
      q.answer = verdict(totals, ruleTest(q.rule));
      if (q.answer !== want) continue;
      q.key = domKey(q);
      if (used[q.key]) continue;
      used[q.key] = true;
      return q;
    }
    return null;
  }

  function cardRuleOptions(n, want) {
    var sums = allPairs(n).map(function (p) { return p[0] + p[1]; });
    var mx = n + (n - 1);
    var out = [];
    var t;
    if (want === 'wont') {
      [mx + 1, mx + 2, mx + 3, 20].forEach(function (v) { out.push({ kind: 'exact', t: v }); });
      if (n === 7) out.push({ kind: 'exact', t: 14 });
      out.push({ kind: 'more', t: mx });
    } else if (want === 'might') {
      for (t = 3; t <= mx; t++) out.push({ kind: 'exact', t: t });
      if (n === 7) out.push({ kind: 'exact', t: 10 }, { kind: 'exact', t: 10 });
      for (t = 4; t < mx; t += 2) out.push({ kind: 'more', t: t });
    } else {
      for (t = mx + 1; t <= Math.min(20, mx + 4); t++) out.push({ kind: 'less', t: t });
      out.push({ kind: 'more', t: 2 });
    }
    return out.filter(function (r) {
      return verdict(sums, ruleTest(r)) === want;
    });
  }

  function makeCardQ(want, used) {
    for (var tries = 0; tries < 200; tries++) {
      var n = U.pick([5, 7, 7]);
      var r = U.pick(cardRuleOptions(n, want));
      if (!r) continue;
      var q = { type: 'cards', n: n, rule: r };
      q.answer = verdict(allPairs(n).map(function (p) { return p[0] + p[1]; }), ruleTest(r));
      q.key = 'c|' + n + '|' + r.kind + r.t;
      if (q.answer !== want || used[q.key]) continue;
      used[q.key] = true;
      return q;
    }
    return null;
  }

  function makePairsQ(possible, used) {
    for (var tries = 0; tries < 200; tries++) {
      var n = possible ? U.pick([7, 7, 5]) : U.pick([7, 5]);
      var mx = 2 * n - 1;
      var t = possible ? U.rand(5, mx - 2) : U.pick([mx + 1, mx + 2]);
      var q = { type: 'pairs', n: n, t: t, pairs: pairsMaking(n, t) };
      q.answer = q.pairs.length ? 'might' : 'wont';
      q.key = 'p|' + n + '|' + t;
      if ((q.pairs.length > 0) !== possible || used[q.key] || used['c|' + n + '|exact' + t]) continue;
      used[q.key] = true;
      return q;
    }
    return null;
  }

  var deck = null;
  function buildDeck() {
    var used = {};
    var q = [];
    // Level 1: dominoes (one of each verdict, in random order). One won't/might uses a blank half rule.
    var l1 = U.shuffle(['will', 'might', 'wont']);
    var zeroAt = l1.indexOf('might');
    l1.forEach(function (w, i) {
      q.push(makeDominoQ(w, used, i === zeroAt && Math.random() < 0.5) || makeDominoQ(w, used));
    });
    // Level 2: two different cards from 1-5 or 1-7
    U.shuffle(['will', 'might', 'wont']).forEach(function (w) {
      q.push(makeCardQ(w, used));
    });
    // Level 3: find every pair that makes the target
    q.push(makePairsQ(true, used));
    q.push(makePairsQ(Math.random() < 0.5, used));
    return q;
  }

  /* ------------------------------------------------------------------ *
   * Hints and mistake tags
   * ------------------------------------------------------------------ */
  var TAG = {
    someAsAll: 'Said "will" when only some fit',
    allAsSome: 'Said "might" when every one fits',
    fitsAsWont: 'Said "won’t" when one fits',
    blank: 'Forgot a blank half counts as 0',
    miscount: 'Miscounted domino spots',
    maxTotal: 'Did not check the biggest possible total',
    noneAsMight: 'Said it could happen when none fit',
    missedPair: 'Missed a pair that makes the total',
  };

  /* ------------------------------------------------------------------ *
   * Practice: dominoes
   * ------------------------------------------------------------------ */
  function renderDomino(stage, api, q) {
    var test = ruleTest(q.rule);
    var totals = q.doms.map(total);
    var root = el('div', { class: 'dmc-q', 'data-type': 'domino', 'data-answer': q.answer, 'data-rule': q.rule.kind + ':' + q.rule.t, 'data-key': q.key });
    stage.appendChild(root);
    api.say('Look at every domino before you decide.', 'think');
    root.appendChild(MQ.ui.prompt('Bolt picks one domino without looking.<br>Will its total be ' + ruleText(q.rule) + '?'));
    var row = dominoRow(q.doms);
    root.appendChild(row.el);
    var work = el('div', { class: 'dmc-work' });
    var done = false;

    function showTotals() {
      row.items.forEach(function (dm, i) {
        var d = q.doms[i];
        var ok = test(totals[i]);
        dm.setLabel(d[0] + ' + ' + d[1] + ' = <b>' + totals[i] + '</b> ' + (ok ? '✓' : '✗'), ok ? 'ok' : 'no');
      });
    }

    function showWorking() {
      showTotals();
      MQ.clear(work);
      var max = q.rule.t > 12 ? Math.min(20, Math.max(q.rule.t, 12)) : 12;
      var line = numberLine(max, { base: 78 });
      line.shade(test);
      totals.forEach(function (t) {
        line.dot(t, test(t));
      });
      if (q.rule.kind === 'exact') line.mark(q.rule.t, 'dmc-mark-t');
      var n = totals.filter(test).length;
      var msg;
      if (q.answer === 'will') msg = 'All ' + totals.length + ' dominoes fit, so it <b>will happen</b>.';
      else if (q.answer === 'wont') msg = 'Not one domino fits, so it <b>will not happen</b>.';
      else msg = n + ' of the ' + totals.length + ' dominoes fit and ' + (totals.length - n) + ' don’t, so it <b>might happen</b>.';
      work.appendChild(el('div', { class: 'dmc-line-wrap' }, line.el));
      work.appendChild(el('div', { class: 'dmc-explain', html: '<span class="dmc-key"><i class="dmc-k-ok"></i> fits</span><span class="dmc-key"><i class="dmc-k-no"></i> does not fit</span> ' + msg }));
    }

    var ch = chanceChoices(function (v) {
      if (done) return;
      if (v === q.answer) {
        ch.mark(v, 'good');
        ch.disable();
        done = true;
        showWorking();
        api.check(true, q.answer === 'might' ? 'Yes! Some fit and some don’t, so it might happen.' : q.answer === 'will' ? 'Yes! Every domino fits, so it will happen.' : 'Yes! No domino fits, so it will not happen.');
        return;
      }
      ch.mark(v, 'bad');
      var second = api.tries() >= 1;
      var fits = q.doms.filter(function (d) { return test(total(d)); });
      var misfits = q.doms.filter(function (d) { return !test(total(d)); });
      var hint;
      var tag;
      if (q.answer === 'might') {
        if (v === 'will') {
          var m = misfits[0];
          hint = second ? 'Look at the ' + m[0] + ' and ' + m[1] + ' domino: ' + m[0] + ' + ' + m[1] + ' = ' + total(m) + '. Does that fit?' : 'Is there a domino whose total is NOT ' + rulePlain(q.rule) + '?';
          tag = TAG.someAsAll;
        } else {
          var f = fits[0];
          var blankFit = fits.filter(function (d) { return d[0] === 0 || d[1] === 0; })[0];
          if (blankFit) f = blankFit;
          hint = second ? 'Look at the ' + f[0] + ' and ' + f[1] + ' domino: ' + f[0] + ' + ' + f[1] + ' = ' + total(f) + '. That one fits!' : 'Count the spots on each half, then add. Is there one domino that fits?' + (blankFit ? ' A blank half counts as 0.' : '');
          tag = blankFit ? TAG.blank : TAG.fitsAsWont;
        }
      } else if (q.answer === 'will') {
        hint = second ? 'Every total fits the rule: ' + totals.join(', ') + '. Can Bolt miss?' : 'Check each domino. Can you find one that does NOT fit? If not, Bolt can’t miss.';
        tag = v === 'might' ? TAG.allAsSome : TAG.fitsAsWont;
        if (v === 'wont' && q.doms.some(function (d) { return d[0] === 0 || d[1] === 0; })) tag = TAG.blank;
      } else {
        var big = Math.max.apply(null, totals);
        if (q.rule.kind === 'more' || q.rule.t > 12) {
          hint = second ? 'The biggest total here is ' + big + '. Is ' + big + ' ' + rulePlain(q.rule) + '?' : 'Find the domino with the most spots. Does even that one fit?';
          tag = TAG.maxTotal;
        } else {
          hint = second ? 'The totals are ' + totals.join(', ') + '. Is any of them ' + rulePlain(q.rule) + '?' : 'Count the spots on both halves of each domino. Does any total fit?';
          tag = v === 'will' ? TAG.noneAsMight : TAG.miscount;
          if (v === 'might') tag = TAG.noneAsMight;
        }
      }
      if (second) showTotals();
      api.check(false, hint, tag);
    });
    root.appendChild(ch);
    root.appendChild(work);
    api.onReveal(function () {
      done = true;
      ch.mark(q.answer, 'good');
      ch.disable();
      showWorking();
      api.feedback('Check every domino: ' + totals.filter(test).length + ' of ' + totals.length + ' fit → ' + WORDS[q.answer].short + '.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice: two cards, will / might / won't
   * ------------------------------------------------------------------ */
  function cardReveal(q, line, sumText) {
    var n = q.n;
    var test = ruleTest(q.rule);
    line.clearAll();
    var big = [n - 1, n];
    if (q.rule.kind === 'exact' && q.rule.t <= 20) line.mark(q.rule.t, q.answer === 'wont' ? 'dmc-mark-no' : 'dmc-mark-t');
    else line.shade(test);
    var html;
    if (q.answer === 'wont') {
      line.rods(big[0], big[1], 0, '✗');
      html = 'Biggest pair: ' + big[0] + ' + ' + big[1] + ' = <b>' + (2 * n - 1) + '</b>. ' + (q.rule.kind === 'exact' ? q.rule.t + ' is out of reach' : 'Nothing is bigger') + ', so it <b>will not happen</b>.';
    } else if (q.answer === 'will') {
      if (q.rule.kind === 'less') {
        line.rods(big[0], big[1], 0, '✓');
        html = 'Even the biggest pair, ' + big[0] + ' + ' + big[1] + ' = ' + (2 * n - 1) + ', is less than ' + q.rule.t + '. Every pair fits, so it <b>will happen</b>.';
      } else {
        line.rods(1, 2, 0, '✓');
        html = 'Even the smallest pair, 1 + 2 = 3, is more than ' + q.rule.t + '. Every pair fits, so it <b>will happen</b>.';
      }
    } else {
      var good = allPairs(n).filter(function (p) { return test(p[0] + p[1]); })[0];
      var bad = allPairs(n).filter(function (p) { return !test(p[0] + p[1]); });
      bad = bad[bad.length - 1];
      if (q.rule.kind === 'exact') bad = allPairs(n).filter(function (p) { return !test(p[0] + p[1]); })[0];
      line.rods(good[0], good[1], 0, '✓');
      line.rods(bad[0], bad[1], 1, '✗');
      html = good[0] + ' + ' + good[1] + ' = ' + (good[0] + good[1]) + ' fits ✓, but ' + bad[0] + ' + ' + bad[1] + ' = ' + (bad[0] + bad[1]) + ' does not ✗. So it <b>might happen</b>.';
    }
    sumText.innerHTML = html;
    return html.replace(/<\/?b>/g, '');
  }

  function renderCards(stage, api, q) {
    var n = q.n;
    var mx = 2 * n - 1;
    var test = ruleTest(q.rule);
    var root = el('div', { class: 'dmc-q', 'data-type': 'cards', 'data-answer': q.answer, 'data-rule': q.rule.kind + ':' + q.rule.t, 'data-n': n, 'data-key': q.key });
    stage.appendChild(root);
    api.say('Try some pairs on the strip, then decide.', 'think');
    root.appendChild(MQ.ui.prompt('Cards 1 to ' + n + ' are face down. Bolt turns over <u>two different</u> cards.<br>Will the total be ' + ruleText(q.rule) + '?'));
    var lineMax = Math.max(mx, q.rule.t <= 20 ? q.rule.t : 0, 10);
    if (q.rule.kind === 'less') lineMax = Math.max(lineMax, q.rule.t);
    lineMax = Math.min(lineMax, 20);
    var done = false;
    var sp = sumPicker(n, lineMax, function (a, b, sumText) {
      if (done) return;
      sumText.innerHTML = a + ' + ' + b + ' = <b>' + (a + b) + '</b> ' + (test(a + b) ? '✓ fits' : '✗ does not fit');
    });
    if (q.rule.kind === 'exact' && q.rule.t <= lineMax) sp.line.mark(q.rule.t, 'dmc-mark-t');
    root.appendChild(sp.row);
    root.appendChild(sp.lineWrap);
    root.appendChild(sp.sumText);
    var ch = chanceChoices(function (v) {
      if (done) return;
      if (v === q.answer) {
        done = true;
        ch.mark(v, 'good');
        ch.disable();
        sp.row.lock();
        sp.row.select([]);
        cardReveal(q, sp.line, sp.sumText);
        api.check(true);
        return;
      }
      ch.mark(v, 'bad');
      var second = api.tries() >= 1;
      var hint;
      var tag;
      if (q.answer === 'wont') {
        hint = second ? 'The biggest pair is ' + (n - 1) + ' + ' + n + ' = ' + mx + '. Can two different cards ever make ' + (q.rule.kind === 'exact' ? q.rule.t : 'more than ' + q.rule.t) + '?' : 'What is the biggest total you can make? Try the two biggest cards.';
        tag = TAG.maxTotal;
      } else if (q.answer === 'might') {
        if (v === 'will') {
          var bad = allPairs(n).filter(function (p) { return !test(p[0] + p[1]); })[0];
          hint = second ? 'Try ' + bad[0] + ' + ' + bad[1] + ' = ' + (bad[0] + bad[1]) + '. Does that fit?' : 'Is there a pair that does NOT fit? Try some small cards.';
          tag = TAG.someAsAll;
        } else {
          var good = allPairs(n).filter(function (p) { return test(p[0] + p[1]); })[0];
          hint = second ? 'Try ' + good[0] + ' + ' + good[1] + ' on the strip.' : 'Can you find two cards that fit? Test some pairs on the strip.';
          tag = q.rule.kind === 'exact' ? TAG.missedPair : TAG.fitsAsWont;
        }
      } else {
        if (q.rule.kind === 'less') hint = second ? 'The biggest pair is ' + (n - 1) + ' + ' + n + ' = ' + mx + '. That is less than ' + q.rule.t + '. So is every pair?' : 'Try the biggest pair. Is even that less than ' + q.rule.t + '?';
        else hint = second ? 'The smallest pair is 1 + 2 = 3. That is more than ' + q.rule.t + '. So is every pair?' : 'Try the smallest pair. Is even that more than ' + q.rule.t + '?';
        tag = v === 'might' ? TAG.allAsSome : TAG.fitsAsWont;
      }
      api.check(false, hint, tag);
    });
    root.appendChild(ch);
    api.onReveal(function () {
      done = true;
      ch.mark(q.answer, 'good');
      ch.disable();
      sp.row.lock();
      sp.row.select([]);
      api.feedback(cardReveal(q, sp.line, sp.sumText), 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice: find every pair, then will / might / won't
   * ------------------------------------------------------------------ */
  function renderPairs(stage, api, q) {
    var n = q.n;
    var t = q.t;
    var mx = 2 * n - 1;
    var root = el('div', { class: 'dmc-q', 'data-type': 'pairs', 'data-answer': q.answer, 'data-target': t, 'data-n': n, 'data-key': q.key, 'data-pairs': q.pairs.map(function (p) { return p.join('+'); }).join(',') });
    stage.appendChild(root);
    api.say('Find every pair that makes ' + t + '.', 'think');
    var prompt = MQ.ui.prompt('Cards 1 to ' + n + '. Find <u>every</u> pair of different cards that makes <b>' + t + '</b>.');
    root.appendChild(prompt);
    var found = [];
    var step = 1;
    var done = false;
    var lineMax = Math.min(20, Math.max(mx, t));
    var foundBox = el('div', { class: 'dmc-found' });
    function drawFound() {
      MQ.clear(foundBox);
      foundBox.appendChild(el('span', { class: 'dmc-found-lab' }, 'Pairs found:'));
      if (!found.length) foundBox.appendChild(el('span', { class: 'dmc-none' }, 'none yet'));
      found.forEach(function (p) {
        foundBox.appendChild(el('span', { class: 'chip dmc-pair-chip' }, p[0] + ' + ' + p[1] + ' = ' + t));
      });
    }
    function redrawLine(line) {
      line.clearAll();
      line.mark(t, q.pairs.length ? 'dmc-mark-t' : 'dmc-mark-no');
      found.forEach(function (p, i) {
        line.rods(p[0], p[1], i);
      });
    }
    var sp = sumPicker(n, lineMax, function (a, b, sumText, line) {
      if (step !== 1) return;
      if (a + b === t) {
        var already = found.some(function (p) { return p[0] === a && p[1] === b; });
        if (already) {
          sumText.innerHTML = a + ' + ' + b + ' = ' + t + ' — you already have that one.';
        } else {
          found.push([a, b]);
          found.sort(function (x, y) { return x[0] - y[0]; });
          api.sound('pop');
          sumText.innerHTML = a + ' + ' + b + ' = <b>' + t + '</b> ✓ Added!';
          drawFound();
        }
        redrawLine(line);
      } else {
        sumText.innerHTML = a + ' + ' + b + ' = <b>' + (a + b) + '</b>, not ' + t + '.';
      }
    });
    sp.line.mark(t, 'dmc-mark-t');
    root.appendChild(sp.row);
    root.appendChild(sp.lineWrap);
    var actions = el('div', { class: 'dmc-actions' });
    root.appendChild(el('div', { class: 'dmc-pair-bar' }, sp.sumText, foundBox));
    root.appendChild(actions);
    drawFound();
    var allBtn = el('button', { class: 'btn dmc-all', type: 'button' }, 'I found them all');
    actions.appendChild(allBtn);
    var ch = null;

    function showStep2() {
      step = 2;
      MQ.clear(actions);
      redrawLine(sp.line);
      sp.row.lock();
      sp.row.select([]);
      sp.sumText.innerHTML = q.pairs.length ? q.pairs.length + (q.pairs.length === 1 ? ' pair makes ' : ' pairs make ') + t + '. Other pairs do not.' : 'No two different cards make ' + t + '. The biggest is ' + (n - 1) + ' + ' + n + ' = ' + mx + '.';
      actions.appendChild(MQ.ui.prompt('Bolt turns over two cards. Will they make <b>' + t + '</b>?'));
      ch = chanceChoices(function (v) {
        if (done) return;
        if (v === q.answer) {
          done = true;
          ch.mark(v, 'good');
          ch.disable();
          api.check(true, q.answer === 'might' ? 'Yes! Some pairs make ' + t + ', others don’t: might happen.' : 'Yes! No pair makes ' + t + ': it will not happen.');
          return;
        }
        ch.mark(v, 'bad');
        var hint;
        var tag;
        if (q.answer === 'might') {
          if (v === 'will') {
            hint = 'What if Bolt turns over 1 and 2? 1 + 2 = 3. Not every pair makes ' + t + '.';
            tag = TAG.someAsAll;
          } else {
            hint = 'You found ' + q.pairs[0][0] + ' + ' + q.pairs[0][1] + ' = ' + t + '. So it can happen!';
            tag = TAG.fitsAsWont;
          }
        } else {
          hint = 'No pair makes ' + t + '. The biggest total is ' + mx + '. Can it happen at all?';
          tag = TAG.maxTotal;
        }
        api.check(false, hint, tag);
      });
      actions.appendChild(ch);
    }

    allBtn.addEventListener('click', function () {
      if (step !== 1) return;
      var missing = q.pairs.filter(function (p) {
        return !found.some(function (f) { return f[0] === p[0] && f[1] === p[1]; });
      });
      if (!missing.length) {
        api.sound('correct');
        api.say(q.pairs.length ? 'You found them all!' : 'Right, no pair works!', 'happy');
        showStep2();
        return;
      }
      var second = api.tries() >= 1;
      var m = missing[0];
      api.check(false, second ? 'Try ' + m[0] + ' + ? = ' + t + '. Which card goes with ' + m[0] + '?' : 'There is still a pair to find. Start with the smallest card: 1 + ? = ' + t + ', then 2 + ? = ' + t + ' …', TAG.missedPair);
    });

    api.onReveal(function () {
      done = true;
      found = q.pairs.slice();
      drawFound();
      if (step === 1) showStep2();
      step = 3;
      ch.mark(q.answer, 'good');
      ch.disable();
      var lst = q.pairs.map(function (p) { return p[0] + ' + ' + p[1]; }).join(' and ');
      api.feedback(q.pairs.length ? 'Pairs that make ' + t + ': ' + lst + '. Other pairs do not, so it might happen.' : 'The biggest pair is ' + (n - 1) + ' + ' + n + ' = ' + mx + ', so ' + t + ' will not happen.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Register
   * ------------------------------------------------------------------ */
  MQ.register('domino-card-draw', {
    learn: [
      // 1. Face down: we cannot see, so we cannot be sure.
      function (stage, api) {
        api.lockNext();
        api.say('Bolt will pick one domino without looking. Will it have exactly 4 spots?', 'think');
        stage.appendChild(MQ.ui.lesson('Face down', 'They are face down, so we can’t see the spots. <b>Click each domino</b> to turn it over.'));
        var row = dominoRow(LEARN_SET, { faceDown: true });
        stage.appendChild(row.el);
        var info = el('div', { class: 'dmc-explain' });
        stage.appendChild(info);
        var flipped = 0;
        row.items.forEach(function (dm, i) {
          dm.el.classList.add('dmc-clickable');
          dm.el.addEventListener('click', function () {
            if (dm.up) return;
            dm.flip();
            api.sound('pop');
            flipped++;
            if (flipped === LEARN_SET.length) {
              row.items.forEach(function (d2, j) {
                d2.el.classList.remove('dmc-clickable');
                if (total(LEARN_SET[j]) === 4) d2.setLabel('4 spots ✓', 'ok');
              });
              info.innerHTML = 'Two dominoes have 4 spots. The others don’t.<br>Bolt could get 4, or he could not. It <b>might happen</b>.';
              api.say('Face down, you can’t be sure. Some have 4 spots, some don’t. It might happen!', 'cheer');
              api.unlockNext();
            }
          });
        });
      },
      // 2. Count the spots: blank = 0. Rule "more than 8".
      function (stage, api) {
        api.lockNext();
        api.say('Count the spots. Click each half of every domino.', 'think');
        stage.appendChild(MQ.ui.lesson('Count every spot', 'Click <b>each half</b>. No spots means <b>0</b>.'));
        var row = dominoRow(LEARN_SET);
        stage.appendChild(row.el);
        var below = el('div', { class: 'dmc-below' });
        stage.appendChild(below);
        var counted = LEARN_SET.map(function () { return [false, false]; });
        var left = LEARN_SET.length * 2;
        row.items.forEach(function (dm, i) {
          var d = LEARN_SET[i];
          dm.halves.forEach(function (h, k) {
            h.classList.add('dmc-clickable');
            h.addEventListener('click', function () {
              if (counted[i][k]) return;
              counted[i][k] = true;
              h.classList.add('dmc-counted');
              h.appendChild(S('text', { x: 4 + k * HS + HS / 2, y: 4 + HS / 2 + 12, 'text-anchor': 'middle', class: 'dmc-half-num' }, String(d[k])));
              api.sound('click');
              if (d[k] === 0) api.say('No spots on this half. That counts as 0.', 'happy');
              if (counted[i][0] && counted[i][1]) dm.setLabel(d[0] + ' + ' + d[1] + ' = <b>' + total(d) + '</b>');
              else dm.setLabel(counted[i][0] ? d[0] + ' + ?' : '? + ' + d[1]);
              left--;
              if (left === 0) askRule();
            });
          });
        });
        function askRule() {
          var test = function (v) { return v > 8; };
          row.items.forEach(function (dm, i) {
            var ok = test(total(LEARN_SET[i]));
            dm.setLabel(LEARN_SET[i][0] + ' + ' + LEARN_SET[i][1] + ' = <b>' + total(LEARN_SET[i]) + '</b> ' + (ok ? '✓' : '✗'), ok ? 'ok' : 'no');
          });
          var line = numberLine(12, { base: 78 });
          line.shade(test);
          LEARN_SET.forEach(function (d) { line.dot(total(d), test(total(d))); });
          below.appendChild(el('div', { class: 'dmc-line-wrap' }, line.el));
          below.appendChild(MQ.ui.prompt('Will Bolt pick a domino with <b>more than 8</b> spots?'));
          api.say('Green means more than 8. Only one dot is green. So, will, might or won’t?', 'think');
          var ch = chanceChoices(function (v) {
            if (v === 'might') {
              ch.mark(v, 'good');
              ch.disable();
              api.sound('correct');
              api.feedback('Only the 10 is more than 8. It can happen, but not every time: it might happen.', 'good');
              api.say('Yes! One fits, five don’t. It might happen.', 'cheer');
              api.unlockNext();
            } else {
              ch.mark(v, 'bad');
              api.sound('wrong');
              api.feedback(v === 'will' ? 'Not every domino has more than 8. Bolt might pick the 4.' : 'Look at the 4 and 6 domino: 10 spots. That is more than 8!', 'try');
            }
          });
          below.appendChild(ch);
        }
      },
      // 3. Cards 1-7: the biggest total is 6 + 7 = 13.
      function (stage, api) {
        api.lockNext();
        api.say('Can two different cards make 20? Find the biggest total you can.', 'think');
        stage.appendChild(MQ.ui.lesson('Two cards: 1 to 7', 'Click <b>two different cards</b>. Can you make <b>20</b>?'));
        var best = 0;
        var finished = false;
        var sp = sumPicker(7, 20, function (a, b, sumText, line) {
          if (finished) return;
          best = Math.max(best, a + b);
          if (a + b === 13) {
            finished = true;
            sumText.innerHTML = '6 + 7 = <b>13</b> is the biggest total. 20 is past 13, so 20 <b>will not happen</b>.';
            line.mark(20, 'dmc-mark-no');
            api.say('13 is the most you can make. 20 will not happen!', 'cheer');
            api.unlockNext();
          } else {
            sumText.innerHTML = a + ' + ' + b + ' = <b>' + (a + b) + '</b>. Biggest so far: ' + best + '. Can you go higher?';
            api.say('Try bigger cards!', 'think');
          }
        });
        sp.line.mark(20, 'dmc-mark-t');
        stage.appendChild(sp.row);
        stage.appendChild(sp.lineWrap);
        stage.appendChild(sp.sumText);
      },
    ],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'domino') return renderDomino(stage, api, q);
        if (q.type === 'cards') return renderCards(stage, api, q);
        return renderPairs(stage, api, q);
      },
    },
  });

  var css = [
    '.dmc-q{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.dmc-q .prompt{font-size:1.25rem}',
    '.dmc-dom-row{display:flex;flex-wrap:wrap;justify-content:center;gap:12px 14px;max-width:900px}',
    '.dmc-dom{display:flex;flex-direction:column;align-items:center;gap:4px}',
    '.dmc-dom-svg{width:118px;height:auto;max-width:100%;display:block}',
    '.dmc-dom-body{fill:#fffdf6;stroke:#1b2a4a;stroke-width:3}',
    '.dmc-half-hit{fill:transparent}',
    '.dmc-pip{fill:#1b2a4a}',
    '.dmc-mid{stroke:#1b2a4a;stroke-width:2.5}',
    '.dmc-back{display:none}',
    '.dmc-down .dmc-face{display:none}',
    '.dmc-down .dmc-back{display:inline}',
    '.dmc-back-body{fill:#3d5a80;stroke:#1b2a4a;stroke-width:3}',
    '.dmc-back-inner{fill:none;stroke:#98c1d9;stroke-width:2;stroke-dasharray:5 4}',
    '.dmc-back-q{fill:#e0fbfc;font-size:28px;font-weight:800}',
    '.dmc-flipped .dmc-dom-svg{animation:dcflip .35s ease}',
    '@keyframes dcflip{0%{transform:scaleX(0.1)}100%{transform:scaleX(1)}}',
    '.dmc-clickable{cursor:pointer}',
    '.dmc-dom.dmc-clickable:hover .dmc-back-body{fill:#4a6d99}',
    'g.dmc-half.dmc-clickable:hover .dmc-half-hit{fill:#fff3cd}',
    '.dmc-counted .dmc-half-hit{fill:#eef3ff}',
    '.dmc-counted .dmc-pip{fill:#9fb0cf}',
    '.dmc-half-num{font-size:34px;font-weight:800;fill:#c2410c}',
    '.dmc-dom-label{font-weight:800;font-size:1rem;min-height:1.4em;color:var(--ink-soft)}',
    '.dmc-dom-label.dmc-ok{color:var(--good)}',
    '.dmc-dom-label.dmc-no{color:#8a94a8}',
    '.dmc-choices{max-width:620px}',
    '.dmc-work,.dmc-below{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.dmc-line-wrap{width:100%;display:flex;justify-content:center}',
    '.dmc-line{width:100%;max-width:700px;height:auto;display:block}',
    '.dmc-axis{stroke:#1b2a4a;stroke-width:3}',
    '.dmc-tick{stroke:#1b2a4a;stroke-width:2}',
    '.dmc-tick-num{font-size:17px;font-weight:700;fill:#4a5a7d}',
    '.dmc-tick-strong{fill:#1b2a4a;font-weight:800}',
    '.dmc-shade{fill:#cdeedd}',
    '.dmc-dot{stroke:#fff;stroke-width:2}',
    '.dmc-dot-ok{fill:#1f9d6b}',
    '.dmc-dot-no{fill:#9aa6bd}',
    '.dmc-arc{fill:none;stroke:#2a6fdb;stroke-width:3}',
    '.dmc-arc-lab{font-size:15px;font-weight:800;fill:#2a6fdb}',
    '.dmc-end{fill:#2a6fdb}',
    '.dmc-arc.dmc-good{stroke:#1f9d6b}.dmc-arc-lab.dmc-good,.dmc-end.dmc-good{fill:#1f9d6b}',
    '.dmc-arc.dmc-big{stroke:#7b4fd6}.dmc-arc-lab.dmc-big,.dmc-end.dmc-big{fill:#7b4fd6}',
    '.dmc-mark{fill:none;stroke-width:3}',
    '.dmc-rod{stroke:#1b2a4a;stroke-width:1.5}',
    '.dmc-rod-a{fill:#bcd4ff}.dmc-rod-b{fill:#bfe9d3}',
    '.dmc-rod-lab{font-size:14px;font-weight:800;fill:#1b2a4a}',
    '.dmc-rod-tag{font-size:18px;font-weight:800}.dmc-tag-ok{fill:#1f9d6b}.dmc-tag-no{fill:#c2410c}',
    '.dmc-rod-drop{stroke:#1f9d6b;stroke-width:2;stroke-dasharray:3 3}',
    '.dmc-mark.dmc-mark-t{stroke:#ffb703}',
    '.dmc-mark.dmc-mark-no{stroke:#c2410c;stroke-dasharray:4 3}',
    '.dmc-explain{font-size:1.1rem;font-weight:700;text-align:center;max-width:720px}',
    '.dmc-key{display:inline-flex;align-items:center;gap:4px;margin-right:10px;font-size:.9rem;color:var(--ink-soft)}',
    '.dmc-key i{display:inline-block;width:12px;height:12px;border-radius:50%}',
    '.dmc-k-ok{background:#1f9d6b}.dmc-k-no{background:#9aa6bd}',
    '.dmc-cards{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.dmc-card{width:58px;height:78px;border-radius:10px;border:3px solid #1b2a4a;background:#fff;font-size:1.9rem;font-weight:800;color:#1b2a4a;cursor:pointer;font-family:inherit;box-shadow:0 2px 0 #c9d3ee;transition:transform .08s ease}',
    '.dmc-card:hover{transform:translateY(-3px)}',
    '.dmc-card.dmc-sel{background:#fff3cd;border-color:#e09b00;transform:translateY(-6px)}',
    '.dmc-locked .dmc-card{cursor:default;transform:none}',
    '.dmc-sum-text{font-size:1.15rem;font-weight:700;text-align:center;min-height:1.6em;max-width:720px}',
    '.dmc-pair-bar{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.dmc-found{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;font-weight:800}',
    '.dmc-found-lab{color:var(--ink-soft)}',
    '.dmc-none{color:#8a94a8;font-weight:700}',
    '.dmc-pair-chip{background:var(--good-bg);border-color:var(--good);color:var(--good)}',
    '.dmc-actions{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.dmc-actions .prompt{font-size:1.15rem}',
    '@media (max-width:700px){.dmc-dom-svg{width:96px}.dmc-card{width:48px;height:66px;font-size:1.6rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'domino-card-draw' }, css));
})();

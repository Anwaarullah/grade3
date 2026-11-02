/* Jump Along (Unit 5.1 Q9, 5.2 Q7–Q9, 5.3 Q7): a frog jumps along a number line by a
 * term-to-term rule. Continue sequences (count on in 2s, 3s, 4s, 5s, 6s, 8s, 9s, 10s from any start),
 * describe the terms (odd / even / multiples), find a missing rule and missing terms, count back,
 * and an open puzzle with more than one right answer. The start number is where the frog sits,
 * not a jump. Every number line is drawn to scale; every answer is computed from the same terms.
 * CSS prefix: ja-
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;
  var ID = 'jump-along-sequences';

  /* ---------------------------------------------------------------- *
   * Mistake tags (parent-readable)
   * ---------------------------------------------------------------- */
  var TAG = {
    start: 'Counted the start number as a jump',
    count: 'Miscounted a jump (one too many)',
    rule: 'Used the wrong rule (wrong jump size or wrong way)',
    bridge: 'Slipped when crossing a ten or a hundred (17 + 4, 194 + 10)',
    oddEven: 'Mixed up odd and even when describing the numbers',
    mult: 'Wrongly said (or missed) that the numbers are multiples of the rule',
    land: 'Could not tell if counting back lands on a number',
    fit: 'Made a sequence that does not go through both numbers',
    oneAnswer: 'Thought there is only one right answer',
  };

  /* ---------------------------------------------------------------- *
   * Number helpers
   * ---------------------------------------------------------------- */
  function isEven(n) {
    return n % 2 === 0;
  }
  function stepTxt(s) {
    return s > 0 ? '+ ' + s : '− ' + -s;
  }
  function stepShort(s) {
    return s > 0 ? '+' + s : '−' + -s;
  }
  function ruleWord(s) {
    return (s > 0 ? 'add ' : 'subtract ') + Math.abs(s);
  }
  function seq(start, s, n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(start + i * s);
    return out;
  }
  /** Line range: whole tens around the values, at least 20 wide. */
  function lineRange(vals) {
    var mn = Math.min.apply(null, vals);
    var mx = Math.max.apply(null, vals);
    var lo = Math.floor(mn / 10) * 10;
    var hi = Math.ceil(mx / 10) * 10;
    if (hi - lo < 20) hi = lo + 20;
    return { lo: lo, hi: hi };
  }
  /** Bridging through a ten or a hundred: 17 + 4 = 17 + 3 + 1 = 20 + 1 = 21. null if no split needed. */
  function bridge(p, s) {
    var e = p + s;
    var k = Math.abs(s);
    var a;
    if (s > 0) {
      if (k === 10) {
        if (Math.floor(p / 100) !== Math.floor(e / 100) && p % 100 !== 0) {
          a = 100 - (p % 100);
          return { mid: p + a, unit: 'hundred', pre: p + ' + 10 = ' + p + ' + ' + a + ' + ' + (10 - a) + ' = ' + (p + a) + ' + ' + (10 - a), e: e };
        }
        return null;
      }
      if (Math.floor(p / 10) !== Math.floor(e / 10) && p % 10 !== 0 && e % 10 !== 0) {
        a = 10 - (p % 10);
        return { mid: p + a, unit: 'ten', pre: p + ' + ' + k + ' = ' + p + ' + ' + a + ' + ' + (k - a) + ' = ' + (p + a) + ' + ' + (k - a), e: e };
      }
      return null;
    }
    if (p % 10 === 0 && e % 10 !== 0) {
      return { mid: p - 10, unit: 'ten', pre: p + ' − ' + k + ' = ' + p + ' − 10 + ' + (10 - k) + ' = ' + (p - 10) + ' + ' + (10 - k), e: e };
    }
    if (Math.floor(p / 10) !== Math.floor(e / 10) && p % 10 !== 0 && e % 10 !== 0) {
      a = p % 10;
      return { mid: p - a, unit: 'ten', pre: p + ' − ' + k + ' = ' + p + ' − ' + a + ' − ' + (k - a) + ' = ' + (p - a) + ' − ' + (k - a), e: e };
    }
    return null;
  }
  function workText(p, s) {
    var b = bridge(p, s);
    return b ? b.pre + ' = ' + b.e : p + ' ' + stepTxt(s) + ' = ' + (p + s);
  }
  /** Counting on/back in ones from p, k steps, not counting p itself. */
  function countList(p, s) {
    var dir = s > 0 ? 1 : -1;
    var out = [];
    for (var i = 1; i <= Math.abs(s); i++) out.push(p + dir * i + ' is ' + i);
    return out.join(', ');
  }

  /** Hint and mistake tag for a wrong term v (previous term p, signed rule s). */
  function classify(v, p, s, tries) {
    var e = p + s;
    var dir = s > 0 ? 1 : -1;
    var k = Math.abs(s);
    var on = s > 0 ? 'on' : 'back';
    var b = bridge(p, s);
    if (v === e - dir) {
      return {
        tag: TAG.start,
        hint: tries
          ? 'Do not count ' + p + '. Count ' + on + ' ' + k + ': ' + countList(p, s) + '.'
          : 'Nearly! The frog sits ON ' + p + ', so ' + p + ' is not a jump. Count ' + k + ' jumps ' + on + ' from ' + p + '.',
      };
    }
    if (b && (Math.abs(v - e) === 10 || Math.abs(v - e) === 100 || v === b.mid)) {
      return {
        tag: TAG.bridge,
        hint: tries
          ? 'Split the jump: ' + b.pre + ' = ?'
          : 'Careful: this jump crosses ' + b.mid + '. Jump to ' + b.mid + ' first, then the rest.',
      };
    }
    if (v === p - s) {
      return { tag: TAG.rule, hint: 'The rule is ' + ruleWord(s) + ', so the numbers get ' + (s > 0 ? 'bigger' : 'smaller') + '. Jump ' + (s > 0 ? 'forwards' : 'backwards') + ' from ' + p + '.' };
    }
    if (v === e + dir) {
      return { tag: TAG.count, hint: 'One jump too far. From ' + p + ', count ' + on + ' exactly ' + k + '.' + (tries ? ' ' + countList(p, s) + '.' : '') };
    }
    if ((v - p) * dir > 0) {
      return {
        tag: TAG.rule,
        hint: 'From ' + p + ' to ' + v + ' is a jump of ' + Math.abs(v - p) + '. The rule is ' + ruleWord(s) + '.' + (tries ? ' ' + workText(p, s).replace(/= \d+$/, '= ?') : ''),
      };
    }
    return { tag: TAG.rule, hint: 'Start at ' + p + ' and jump ' + stepTxt(s) + '.' + (tries ? ' ' + workText(p, s).replace(/= \d+$/, '= ?') : '') };
  }

  function describe(terms, k) {
    var allEven = terms.every(isEven);
    var allOdd = terms.every(function (t) {
      return !isEven(t);
    });
    return {
      even: allEven,
      odd: allOdd,
      mixed: !allEven && !allOdd,
      mult: terms.every(function (t) {
        return t % k === 0;
      }),
    };
  }

  /** Open puzzle check: 5 terms, all ≥ 0, constant positive step equal to the rule, through a and b. */
  function verifyOpen(terms, rule, a, b) {
    if (terms.length !== 5 || !(rule > 0)) return false;
    for (var i = 0; i < 5; i++) if (!(terms[i] >= 0) || Math.round(terms[i]) !== terms[i]) return false;
    for (i = 1; i < 5; i++) if (terms[i] - terms[i - 1] !== rule) return false;
    return terms.indexOf(a) !== -1 && terms.indexOf(b) !== -1;
  }
  /** Every 5-term add sequence (terms ≥ 0) through a and b, grouped by rule. */
  function openSolutions(a, b) {
    var out = [];
    var d = b - a;
    for (var r = 1; r <= d; r++) {
      if (d % r !== 0 || d / r > 4) continue;
      for (var st = 0; st <= a; st++) {
        var t = seq(st, r, 5);
        if (verifyOpen(t, r, a, b)) out.push({ rule: r, terms: t });
      }
    }
    return out;
  }

  /* ---------------------------------------------------------------- *
   * Deck
   * ---------------------------------------------------------------- */
  function anyStart(k, lo, hi) {
    var s;
    do s = U.rand(lo, hi);
    while (s % k === 0);
    return s;
  }
  function makeCont(k, start, nBox, extra) {
    var terms = seq(start, k, nBox + 1);
    var q = { type: 'cont', step: k, start: start, terms: terms, missing: U.range(1, nBox), answer: terms.slice(1) };
    var r = lineRange(terms);
    q.lo = r.lo;
    q.hi = r.hi;
    if (extra) for (var key in extra) q[key] = extra[key];
    if (q.describe) q.desc = describe(terms, k);
    return q;
  }
  function makeHundred() {
    var start = U.rand(1, 8) * 100 + U.rand(6, 9) * 10 + U.rand(1, 9);
    return makeCont(10, start, 4, { hundred: true });
  }
  function makeFind(k) {
    var start = U.rand(1, 20);
    var pat = U.pick(['A', 'B']);
    var n = pat === 'A' ? 6 : 4;
    var miss = pat === 'A' ? [3, 5] : [2, 3];
    var terms = seq(start, k, n);
    var r = lineRange(terms);
    return { type: 'find', step: k, start: start, terms: terms, missing: miss, answer: { rule: k, missing: miss.map(function (i) { return terms[i]; }) }, lo: r.lo, hi: r.hi };
  }
  function makeBack() {
    var k = U.pick([6, 8, 9]);
    var terms = [];
    for (var t = 100; t >= 0; t -= k) terms.push(t);
    var rem = 100 % k;
    var yes = Math.random() < 0.5;
    var target;
    if (yes) target = U.pick([rem, rem + k].filter(function (x) { return x >= 1 && x <= 12; }));
    else target = U.pick(U.range(1, 12).filter(function (x) { return x % k !== rem; }));
    return {
      type: 'back',
      step: -k,
      start: 100,
      terms: terms,
      missing: [1, 2, 3],
      answer: { terms: terms.slice(1, 4), lands: terms.indexOf(target) !== -1 },
      target: target,
      lo: 0,
      hi: 100,
    };
  }
  function makeOpen() {
    var a = 13;
    var b = 29;
    var sols = openSolutions(a, b);
    var rules = [];
    sols.forEach(function (s) {
      if (rules.indexOf(s.rule) === -1) rules.push(s.rule);
    });
    return { type: 'open', a: a, b: b, solutions: sols, answer: { rules: rules } };
  }

  function buildDeck() {
    var deck = [];
    var l1 = U.shuffle([2, 5, 4, 10]).slice(0, 2);
    deck.push(makeCont(l1[0], anyStart(l1[0], 1, 50), 4));
    deck.push(makeCont(l1[1], anyStart(l1[1], 1, 50), 5));
    deck.push(makeHundred());
    var l2 = U.shuffle([3, 6, 8, 9]).slice(0, 2);
    var multFirst = Math.random() < 0.5;
    l2.forEach(function (k, i) {
      var start = (i === 0) === multFirst ? k * U.rand(1, Math.floor(50 / k)) : anyStart(k, 1, 50);
      deck.push(makeCont(k, start, 4, { describe: true }));
    });
    deck.push(makeFind(U.pick([3, 4, 6, 8, 9])));
    deck.push(makeBack());
    deck.push(makeOpen());
    deck.forEach(function (q, i) {
      q.level = i < 8 / 3 ? 1 : i < 16 / 3 ? 2 : 3;
    });
    return deck;
  }
  var deck = null;

  /* ---------------------------------------------------------------- *
   * Drawings: the number line (to scale), lily pads, jump arcs, frog
   * ---------------------------------------------------------------- */
  function frogShape() {
    var g = '#55a630';
    var d = '#2b6a17';
    return S(
      'g',
      { class: 'ja-frog' },
      S('ellipse', { cx: 0, cy: 3, rx: 14, ry: 10, fill: g, stroke: d, 'stroke-width': 1.5 }),
      S('circle', { cx: -7, cy: -6, r: 5, fill: g, stroke: d, 'stroke-width': 1.5 }),
      S('circle', { cx: 7, cy: -6, r: 5, fill: g, stroke: d, 'stroke-width': 1.5 }),
      S('circle', { cx: -7, cy: -6, r: 2.6, fill: '#fff' }),
      S('circle', { cx: 7, cy: -6, r: 2.6, fill: '#fff' }),
      S('circle', { cx: -6.5, cy: -6, r: 1.3, fill: '#1b2a4a' }),
      S('circle', { cx: 7.5, cy: -6, r: 1.3, fill: '#1b2a4a' }),
      S('path', { d: 'M-6 6 q6 5 12 0', fill: 'none', stroke: '#1b2a4a', 'stroke-width': 1.6, 'stroke-linecap': 'round' })
    );
  }

  function numLine(lo, hi, tall) {
    var W = 800;
    var H = tall ? 236 : 200;
    var X0 = 40;
    var X1 = 760;
    var LY = 124;
    var sc = (X1 - X0) / (hi - lo);
    function X(v) {
      return X0 + (v - lo) * sc;
    }
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'ja-svg ja-line', width: W, height: H, 'data-lo': lo, 'data-hi': hi });
    root.appendChild(S('rect', { x: X0 - 26, y: LY - 11, width: X1 - X0 + 52, height: 22, rx: 11, class: 'ja-pond' }));
    root.appendChild(S('line', { x1: X0 - 14, y1: LY, x2: X1 + 14, y2: LY, class: 'ja-axis' }));
    var dec = {};
    for (var v = lo; v <= hi; v++) {
      var big = v % 10 === 0;
      var mid = v % 5 === 0;
      var len = big ? 10 : mid ? 7 : 4;
      root.appendChild(S('line', { x1: X(v), y1: LY - len, x2: X(v), y2: LY + len, class: big ? 'ja-t10' : mid ? 'ja-t5' : 'ja-t1' }));
      if (big) {
        dec[v] = S('text', { x: X(v), y: LY + 30, 'text-anchor': 'middle', class: 'ja-dec' }, String(v));
        root.appendChild(dec[v]);
      }
    }
    var arcsG = S('g');
    var padsG = S('g');
    var labsG = S('g');
    root.appendChild(padsG);
    root.appendChild(arcsG);
    root.appendChild(labsG);
    var frog = frogShape();
    root.appendChild(frog);
    var pads = {};
    var arcs = {};
    var api = {
      svg: root,
      X: X,
      pad: function (val, cls, label, low) {
        if (val < lo || val > hi) return null;
        if (pads[val]) {
          if (label != null) pads[val].setLabel(label, cls);
          return pads[val];
        }
        if (dec[val]) dec[val].style.display = 'none';
        var txt = label != null ? String(label) : String(val);
        var g = S('g', { class: 'ja-padg ' + (cls || ''), 'data-val': val });
        g.appendChild(S('ellipse', { cx: X(val), cy: LY, rx: 13, ry: 6, class: 'ja-pad' }));
        var wbox = 14 + 11 * txt.length;
        var dy = low ? 36 : 0;
        if (low) g.appendChild(S('line', { x1: X(val), y1: LY + 8, x2: X(val), y2: LY + 40 + dy, class: 'ja-lead' }));
        var rect = S('rect', { x: X(val) - wbox / 2, y: LY + 40 + dy, width: wbox, height: 28, rx: 8, class: 'ja-plab-bg' });
        var t = S('text', { x: X(val), y: LY + 60 + dy, 'text-anchor': 'middle', class: 'ja-plab' }, txt);
        g.appendChild(rect);
        g.appendChild(t);
        padsG.appendChild(g);
        var p = {
          g: g,
          setLabel: function (l, c) {
            l = String(l);
            t.textContent = l;
            var w = 14 + 11 * l.length;
            rect.setAttribute('x', X(val) - w / 2);
            rect.setAttribute('width', w);
            g.setAttribute('class', 'ja-padg ' + (c || ''));
          },
        };
        pads[val] = p;
        return p;
      },
      arc: function (a, b, txt, cls) {
        var key = a + '>' + b;
        if (arcs[key]) {
          arcs[key].t.textContent = txt;
          arcs[key].g.setAttribute('class', 'ja-arcg ' + (cls || ''));
          return arcs[key];
        }
        var xa = X(a);
        var xb = X(b);
        var h = U.clamp(Math.abs(xb - xa) * 0.45, 24, 64);
        var y0 = LY - 9;
        var cx = (xa + xb) / 2;
        var g = S('g', { class: 'ja-arcg ' + (cls || ''), 'data-from': a, 'data-to': b });
        g.appendChild(S('path', { d: 'M' + xa + ' ' + y0 + ' Q' + cx + ' ' + (y0 - 2 * h) + ' ' + xb + ' ' + y0, class: 'ja-arc' }));
        // arrow head at the landing end
        var dir = xb > xa ? 1 : -1;
        g.appendChild(S('path', { d: 'M' + (xb - dir * 9) + ' ' + (y0 - 9) + ' L' + xb + ' ' + y0 + ' L' + (xb - dir * 1) + ' ' + (y0 - 12), class: 'ja-arrow' }));
        var w = 14 + 10 * txt.length;
        g.appendChild(S('rect', { x: cx - w / 2, y: y0 - h - 13, width: w, height: 24, rx: 12, class: 'ja-alab-bg' }));
        var t = S('text', { x: cx, y: y0 - h + 4, 'text-anchor': 'middle', class: 'ja-alab' }, txt);
        g.appendChild(t);
        arcsG.appendChild(g);
        arcs[key] = { g: g, t: t };
        return arcs[key];
      },
      frogTo: function (val) {
        frog.style.transform = 'translate(' + X(val) + 'px,' + (LY - 13) + 'px)';
      },
      hideFrog: function () {
        frog.style.display = 'none';
      },
    };
    return api;
  }

  /* A row of terms: given numbers and answer boxes, with the jump shown between them. */
  function termRow(cells, seps, onEnter) {
    var row = el('div', { class: 'ja-row' });
    var boxes = {};
    var sepEls = [];
    cells.forEach(function (c, i) {
      if (i > 0) {
        var sp = el('span', { class: 'ja-sep' }, seps[i - 1] || '');
        sepEls.push(sp);
        row.appendChild(sp);
      }
      if (c.box == null) {
        row.appendChild(el('span', { class: 'ja-cell' }, el('span', { class: 'ja-num' + (c.start ? ' ja-startnum' : '') }, String(c.v)), c.cap ? el('span', { class: 'ja-cap' }, c.cap) : null));
      } else {
        var inp = el('input', { class: 'ja-box', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: '3', 'data-slot': String(c.box), 'aria-label': 'number ' + (i + 1), placeholder: '?' });
        inp.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            onEnter();
          }
        });
        inp.addEventListener('input', function () {
          inp.classList.remove('ja-good', 'ja-bad');
        });
        boxes[c.box] = inp;
        row.appendChild(el('span', { class: 'ja-cell' }, inp, c.cap ? el('span', { class: 'ja-cap' }, c.cap) : null));
      }
    });
    return {
      el: row,
      boxes: boxes,
      seps: sepEls,
      val: function (k) {
        var raw = boxes[k].value.trim();
        if (raw === '') return null;
        var n = U.parseNum(raw);
        return isNaN(n) ? NaN : n;
      },
      mark: function (k, ok) {
        boxes[k].classList.remove('ja-good', 'ja-bad');
        boxes[k].classList.add(ok ? 'ja-good' : 'ja-bad');
      },
      set: function (k, v) {
        boxes[k].value = String(v);
        boxes[k].classList.remove('ja-bad');
        boxes[k].classList.add('ja-good');
        boxes[k].disabled = true;
      },
      lock: function () {
        Object.keys(boxes).forEach(function (k) {
          boxes[k].disabled = true;
        });
      },
      firstOpen: function () {
        var ks = Object.keys(boxes);
        for (var i = 0; i < ks.length; i++) if (!boxes[ks[i]].disabled) return boxes[ks[i]];
        return null;
      },
    };
  }

  function btn(label, cls, onclick) {
    return el('button', { class: 'btn ' + (cls || ''), type: 'button', onclick: onclick }, label);
  }
  function focusLater(api, inp) {
    if (!inp) return;
    api.later(function () {
      try {
        inp.focus({ preventScroll: true });
      } catch (e) {
        inp.focus();
      }
    }, 60);
  }

  /** Animate the frog along a list of [from, to] jumps. */
  function hopChain(api, line, jumps, s, done) {
    var i = 0;
    function one() {
      if (i >= jumps.length) {
        if (done) done();
        return;
      }
      var j = jumps[i++];
      line.arc(j[0], j[1], stepShort(s), s > 0 ? 'ja-fwd' : 'ja-back');
      line.pad(j[1]);
      line.frogTo(j[1]);
      api.sound('pop');
      api.later(one, 260);
    }
    one();
  }

  /* ---------------------------------------------------------------- *
   * Learn 1: the start is where the frog sits; then jump by the rule
   * ---------------------------------------------------------------- */
  function learnStart(stage, api) {
    api.lockNext();
    stage.classList.add('ja-stage');
    api.say('The frog sits on the start number. That is not a jump!', 'happy');
    stage.appendChild(MQ.ui.lesson('Start and rule', 'Start on <b>5</b>. The rule is <b>add 4</b>. Press <b>Jump</b> to make the frog jump 4 each time.'));
    var line = numLine(0, 25);
    line.pad(5, 'ja-startpad');
    line.frogTo(5);
    stage.appendChild(el('div', { class: 'ja-pic' }, line.svg));
    var chips = el('div', { class: 'ja-terms' }, el('span', { class: 'chip ja-tchip ja-tstart' }, '5 (start)'));
    stage.appendChild(chips);
    var help = el('div', { class: 'ja-help' });
    var cur = 5;
    var n = 0;
    var jump = btn('Jump + 4 🐸', 'ja-jump', function () {
      if (n >= 4) return;
      var nx = cur + 4;
      line.arc(cur, nx, '+4', 'ja-fwd');
      line.pad(nx);
      line.frogTo(nx);
      api.sound('pop');
      chips.appendChild(el('span', { class: 'chip ja-tchip' }, String(nx)));
      var b = bridge(cur, 4);
      MQ.clear(help);
      help.appendChild(el('span', null, b ? b.pre + ' = ' + nx : cur + ' + 4 = ' + nx));
      if (b) api.say('Crossing ' + b.mid + '? Jump to ' + b.mid + ' first, then 1 more.', 'think');
      cur = nx;
      n++;
      if (n === 4) {
        jump.disabled = true;
        api.unlockNext();
        api.feedback('5, 9, 13, 17, 21. Five numbers, but only four jumps: the start is not a jump.', 'good');
        if (!b) api.say('Well done!', 'cheer');
      }
    });
    stage.appendChild(el('div', { class: 'ja-btnrow' }, jump));
    stage.appendChild(help);
  }

  /* ---------------------------------------------------------------- *
   * Learn 2: odd or even?
   * ---------------------------------------------------------------- */
  function learnOddEven(stage, api) {
    api.lockNext();
    stage.classList.add('ja-stage');
    api.say('Look at the numbers. Odd or even?', 'think');
    stage.appendChild(MQ.ui.lesson('Odd or even?', 'Start <b>5</b>, rule <b>add 4</b>. What do you notice about the numbers?'));
    var terms = seq(5, 4, 5);
    var line = numLine(0, 25);
    terms.forEach(function (t, i) {
      line.pad(t, i === 0 ? 'ja-startpad' : '');
      if (i) line.arc(terms[i - 1], t, '+4', 'ja-fwd');
    });
    line.frogTo(21);
    stage.appendChild(el('div', { class: 'ja-pic' }, line.svg));
    var chipEls = terms.map(function (t) {
      return el('span', { class: 'chip ja-tchip' }, String(t));
    });
    stage.appendChild(el('div', { class: 'ja-terms' }, chipEls));
    var why = el('div', { class: 'ja-why' });
    var ch = MQ.ui.choices(
      [
        { label: 'They are all odd', value: 'odd' },
        { label: 'They are all even', value: 'even' },
        { label: 'Odd and even mixed', value: 'mixed' },
      ],
      function (v) {
        if (v !== 'odd') {
          ch.mark(v, 'bad');
          api.feedback('Look at the last digit of each number: 5, 9, 3, 7, 1. Are those odd or even?', 'info');
          return;
        }
        ch.mark('odd', 'good');
        ch.disable();
        chipEls.forEach(function (c) {
          c.classList.add('ja-odd');
        });
        why.appendChild(el('div', null, el('b', null, '5 is odd'), ' and the jump ', el('b', null, '4 is even'), '. Odd + even = odd, so every number stays odd.'));
        why.appendChild(
          el(
            'div',
            { class: 'ja-why2' },
            'Start on 6 instead: ',
            seq(6, 4, 5).map(function (t) {
              return el('span', { class: 'chip ja-tchip ja-even' }, String(t));
            }),
            ' all even.'
          )
        );
        api.say('Odd start, even jumps: all odd!', 'cheer');
        api.unlockNext();
      },
      { columns: 3 }
    );
    ch.buttons.forEach(function (b) {
      b.setAttribute('data-value', b.value_);
    });
    ch.classList.add('ja-choices');
    stage.appendChild(ch);
    stage.appendChild(why);
  }

  /* ---------------------------------------------------------------- *
   * Learn 3: start at the rule = the times table
   * ---------------------------------------------------------------- */
  function learnNines(stage, api) {
    api.lockNext();
    stage.classList.add('ja-stage');
    api.say('Start on 9 and add 9. Watch!', 'happy');
    stage.appendChild(MQ.ui.lesson('Start at the rule', 'Start <b>9</b>, rule <b>add 9</b>. Press <b>Jump</b> four times.'));
    var line = numLine(0, 50);
    line.pad(9, 'ja-startpad');
    line.frogTo(9);
    stage.appendChild(el('div', { class: 'ja-pic' }, line.svg));
    var table = el('div', { class: 'ja-table' }, el('div', { class: 'ja-trow' }, el('span', { class: 'ja-add' }, '9'), el('span', { class: 'ja-eq' }, '= 9 × 1')));
    var cur = 9;
    var n = 1;
    var jump = btn('Jump + 9 🐸', 'ja-jump', function () {
      if (n >= 5) return;
      var nx = cur + 9;
      line.arc(cur, nx, '+9', 'ja-fwd');
      line.pad(nx);
      line.frogTo(nx);
      api.sound('pop');
      n++;
      table.appendChild(
        el(
          'div',
          { class: 'ja-trow' },
          el('span', { class: 'ja-add' }, U.range(1, n).map(function () { return '9'; }).join(' + ') + ' = ' + nx),
          el('span', { class: 'ja-eq' }, '= 9 × ' + n)
        )
      );
      cur = nx;
      if (n === 5) {
        jump.disabled = true;
        api.unlockNext();
        api.say('9, 18, 27, 36, 45: the 9 times table!', 'cheer');
        api.feedback('Start on the rule number and you get its multiples: 9 × 1, 9 × 2, 9 × 3 …', 'good');
      }
    });
    stage.appendChild(el('div', { class: 'ja-btnrow' }, jump));
    stage.appendChild(table);
  }

  /* ---------------------------------------------------------------- *
   * Learn 4: find the rule by measuring a jump
   * ---------------------------------------------------------------- */
  function learnFind(stage, api) {
    api.lockNext();
    stage.classList.add('ja-stage');
    api.say('No rule this time. Measure a jump!', 'think');
    stage.appendChild(MQ.ui.lesson('Find the rule', '<b>3, 11, 19, ?, 35</b>. How far is each jump?'));
    var terms = [3, 11, 19, 27, 35];
    var line = numLine(0, 40);
    [3, 11, 19, 35].forEach(function (t, i) {
      line.pad(t, i === 0 ? 'ja-startpad' : '');
    });
    line.pad(27, 'ja-qpad', '?');
    line.arc(3, 11, '?', 'ja-unk');
    line.arc(11, 19, '?', 'ja-unk');
    line.frogTo(3);
    stage.appendChild(el('div', { class: 'ja-pic' }, line.svg));
    var help = el('div', { class: 'ja-help' });
    var askRow = el('div', { class: 'ja-btnrow' });
    var measure = btn('Measure 3 → 11 📏', 'ja-jump', function () {
      measure.disabled = true;
      line.arc(3, 11, '+8', 'ja-fwd');
      line.arc(11, 19, '+8', 'ja-fwd');
      line.frogTo(11);
      api.sound('pop');
      help.appendChild(el('span', null, 'Count on from 3: 3 → 10 is 7, then 1 more to 11. 7 + 1 = 8. Rule: add 8.'));
      api.say('The rule is add 8. What comes after 19?', 'happy');
      var input = MQ.ui.numberInput({
        prefix: '19 + 8 =',
        onSubmit: function (v) {
          if (v !== 27) {
            input.bad && input.bad();
            api.feedback(v === 26 ? 'Do not count 19 itself. 19 + 1 + 7 = 20 + 7.' : 'Split the 8: 19 + 1 = 20, then 20 + 7 = ?', 'info');
            return;
          }
          input.setValue('27');
          input.good && input.good();
          input.disable();
          line.pad(27);
          line.arc(19, 27, '+8', 'ja-fwd');
          line.arc(27, 35, '+8', 'ja-fwd');
          line.frogTo(35);
          api.sound('pop');
          api.feedback('27, and 27 + 8 = 35. The rule fits every jump.', 'good');
          api.say('Yes! Check: 27 + 8 = 35.', 'cheer');
          api.unlockNext();
        },
      });
      input.el.classList.add('ja-ans');
      input.el.setAttribute('data-terms', terms.join(','));
      MQ.clear(askRow);
      askRow.appendChild(input.el);
      input.focus();
    });
    askRow.appendChild(measure);
    stage.appendChild(askRow);
    stage.appendChild(help);
  }

  /* ---------------------------------------------------------------- *
   * Practice engine: number line + row of terms with boxes
   * opts: { ruleBox: bool, onDone: fn, onWrong(tagInfo) }
   * ---------------------------------------------------------------- */
  function seqEngine(stage, api, q, opts) {
    var s = q.step;
    var terms = opts.rowTerms || q.terms;
    var line = numLine(q.lo, q.hi, opts.tall);
    var known = {};
    var ruleSolved = !opts.ruleBox;
    terms.forEach(function (t, i) {
      if (q.missing.indexOf(i) === -1) known[i] = true;
    });
    function arcLabel() {
      return ruleSolved ? stepShort(s) : '?';
    }
    function drawKnown() {
      Object.keys(known).forEach(function (k) {
        var i = +k;
        line.pad(terms[i], i === 0 ? 'ja-startpad' : '');
        if (known[i - 1]) line.arc(terms[i - 1], terms[i], arcLabel(), ruleSolved ? (s > 0 ? 'ja-fwd' : 'ja-back') : 'ja-unk');
      });
    }
    drawKnown();
    line.frogTo(terms[0]);
    var pic = el('div', { class: 'ja-pic' }, line.svg);
    stage.appendChild(pic);

    var cells = terms.map(function (t, i) {
      return known[i] ? { v: t, start: i === 0, cap: i === 0 ? 'start' : null } : { box: i };
    });
    var seps = terms.slice(1).map(function () {
      return ruleSolved ? stepTxt(s) : '?';
    });
    var row = termRow(cells, seps, check);
    var ruleInp = null;
    var ruleWrap = null;
    if (opts.ruleBox) {
      ruleInp = el('input', { class: 'ja-box ja-rulebox', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: '2', 'data-slot': 'rule', 'aria-label': 'rule', placeholder: '?' });
      ruleInp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          check();
        }
      });
      ruleInp.addEventListener('input', function () {
        ruleInp.classList.remove('ja-good', 'ja-bad');
      });
      ruleWrap = el('div', { class: 'ja-rule' }, el('span', null, 'Rule: add'), ruleInp);
      stage.appendChild(ruleWrap);
    } else {
      row.el.insertBefore(el('span', { class: 'ja-rulechip' }, 'Rule: ' + ruleWord(s)), row.el.firstChild);
    }
    var checkBtn = btn('Check', 'btn-check ja-checkbtn', check);
    stage.appendChild(el('div', { class: 'ja-rowwrap' }, row.el, checkBtn));
    var work = el('div', { class: 'ja-work' });
    var done = false;

    function frogEnd() {
      // furthest term reached by contiguous known terms from the start
      var i = 0;
      while (known[i + 1]) i++;
      return i;
    }
    function solve(i, animate) {
      known[i] = true;
      row.set(i, terms[i]);
      var js = [];
      if (known[i - 1]) js.push([terms[i - 1], terms[i]]);
      if (known[i + 1]) js.push([terms[i], terms[i + 1]]);
      js.forEach(function (j) {
        line.arc(j[0], j[1], stepShort(s), s > 0 ? 'ja-fwd' : 'ja-back');
      });
      line.pad(terms[i]);
      if (animate) api.sound('pop');
    }
    function finish() {
      done = true;
      row.lock();
      checkBtn.disabled = true;
      if (ruleInp) ruleInp.disabled = true;
      line.frogTo(terms[frogEnd()]);
    }
    function setRuleSolved() {
      ruleSolved = true;
      if (ruleInp) {
        ruleInp.value = String(Math.abs(s));
        ruleInp.classList.remove('ja-bad');
        ruleInp.classList.add('ja-good');
        ruleInp.disabled = true;
      }
      row.seps.forEach(function (sp) {
        sp.textContent = stepTxt(s);
      });
      drawKnown();
    }

    function check() {
      if (done) return;
      if (opts.ruleBox && !ruleSolved) {
        var raw = ruleInp.value.trim();
        if (raw === '') {
          api.feedback('First write the rule: how far is one jump?', 'info');
          ruleInp.focus();
          return;
        }
        var rv = U.parseNum(raw);
        if (rv !== Math.abs(s)) {
          ruleInp.classList.add('ja-bad');
          var a = terms[0];
          var b = terms[1];
          var hint;
          if (rv === b) hint = b + ' is a number in the sequence. The rule is the jump: how far from ' + a + ' to ' + b + '?';
          else if (rv === Math.abs(s) - 1) hint = 'Nearly! Do not count ' + a + ' itself. Count on from ' + a + ' to ' + b + '.';
          else hint = 'How far from ' + a + ' to ' + b + '? Count on from ' + a + '.';
          if (api.tries() >= 1) {
            var ten = Math.ceil((a + 1) / 10) * 10;
            hint = ten < b ? 'Count on from ' + a + ' to ' + ten + ' (that is ' + (ten - a) + '), then on to ' + b + ' (that is ' + (b - ten) + '). Add the two parts.' : 'Count on in ones from ' + a + ' to ' + b + '. How many jumps of 1?';
          }
          api.check(false, hint, TAG.rule);
          return;
        }
        setRuleSolved();
        api.sound('click');
      }
      var anyNew = false;
      for (var m = 0; m < q.missing.length; m++) {
        var i = q.missing[m];
        if (known[i]) continue;
        var v = row.val(i);
        if (v === null) {
          if (anyNew) line.frogTo(terms[frogEnd()]);
          api.feedback(anyNew ? 'Right so far! Now fill the next box.' : opts.ruleBox && ruleSolved && m === 0 ? 'Yes, the rule is add ' + Math.abs(s) + '! Now fill the missing numbers.' : 'Write a number in the next box.', 'info');
          focusLater(api, row.boxes[i]);
          return;
        }
        if (v === terms[i]) {
          solve(i, true);
          anyNew = true;
          continue;
        }
        row.mark(i, false);
        line.frogTo(terms[frogEnd()]);
        var c = classify(v, terms[i - 1], s, api.tries());
        api.check(false, c.hint, c.tag);
        focusLater(api, row.boxes[i]);
        return;
      }
      finish();
      opts.onDone();
    }

    return {
      line: line,
      row: row,
      work: work,
      reveal: function () {
        if (!ruleSolved) setRuleSolved();
        var jumps = [];
        q.missing.forEach(function (i) {
          if (!known[i]) {
            solve(i, false);
            if (known[i - 1]) jumps.push([terms[i - 1], terms[i]]);
          }
        });
        finish();
        MQ.clear(work);
        q.missing.forEach(function (i) {
          work.appendChild(el('span', { class: 'chip ja-wchip' }, workText(terms[i - 1], s)));
        });
        hopChain(api, line, jumps, s);
      },
      isDone: function () {
        return done;
      },
    };
  }

  /* ---------------------------------------------------------------- *
   * Practice: continue a sequence (and, level 2, describe it)
   * ---------------------------------------------------------------- */
  var DESC = [
    { value: 'even', label: 'They are all even' },
    { value: 'odd', label: 'They are all odd' },
    { value: 'mixed', label: 'Odd and even are mixed' },
    { value: 'mult', label: '' },
  ];
  function renderCont(stage, api, q) {
    stage.classList.add('ja-stage');
    var k = q.step;
    var n = q.missing.length;
    if (q.hundred) api.say('Add 10 each time. Careful when you cross a hundred!', 'think');
    else if (q.describe) api.say('Jump first. Then tell me about the numbers.', 'happy');
    else api.say('The start is where the frog sits. Now jump ' + k + ' each time.', 'happy');
    stage.appendChild(MQ.ui.prompt('Start on <b>' + q.start + '</b>. Rule: <b>add ' + k + '</b>. Write the next ' + n + ' numbers.'));
    var tick = null;
    var eng = seqEngine(stage, api, q, {
      onDone: function () {
        if (!q.describe) {
          var msg = 'Yes! ' + q.terms.join(', ') + '. ' + n + ' jumps of ' + k + '.';
          for (var i = 1; i < q.terms.length; i++) {
            if (q.hundred && bridge(q.terms[i - 1], k)) msg += ' Over the hundred: ' + workText(q.terms[i - 1], k) + '.';
          }
          api.check(true, msg);
          return;
        }
        api.feedback('Good jumping! Now tick every sentence that is true.', 'info');
        tick = descPanel();
      },
    });
    stage.appendChild(eng.work);

    function descPanel() {
      var wrap = el('div', { class: 'ja-desc' });
      wrap.appendChild(el('div', { class: 'ja-desc-q' }, 'Tick every sentence that is true for ', el('b', null, q.terms.join(', ')), ':'));
      var picked = {};
      var btns = {};
      var grid = el('div', { class: 'ja-stmts' });
      DESC.forEach(function (d) {
        var label = d.value === 'mult' ? 'They are all multiples of ' + k : d.label;
        var b = el('button', { class: 'ja-stmt', type: 'button', 'data-value': d.value }, el('span', { class: 'ja-tick' }), el('span', null, label));
        b.addEventListener('click', function () {
          if (b.disabled) return;
          picked[d.value] = !picked[d.value];
          b.classList.toggle('ja-on', !!picked[d.value]);
          b.classList.remove('ja-bad');
          api.sound('click');
        });
        btns[d.value] = b;
        grid.appendChild(b);
      });
      wrap.appendChild(grid);
      var cbtn = btn('Check', 'btn-check ja-checkbtn ja-desccheck', function () {
        var any = Object.keys(picked).some(function (x) {
          return picked[x];
        });
        if (!any) {
          api.feedback('Tick at least one sentence, then press Check.', 'info');
          return;
        }
        var wrongPar = ['even', 'odd', 'mixed'].filter(function (x) {
          return !!picked[x] !== q.desc[x];
        });
        var wrongMult = !!picked.mult !== q.desc.mult;
        if (!wrongPar.length && !wrongMult) {
          lock();
          explain();
          api.check(true, 'Yes! ' + reasonText());
          return;
        }
        wrongPar.concat(wrongMult ? ['mult'] : []).forEach(function (x) {
          if (picked[x]) btns[x].classList.add('ja-bad');
        });
        var hint;
        var tag;
        if (wrongPar.length) {
          tag = TAG.oddEven;
          hint = 'Look at the last digit of each number: ' + q.terms.map(function (t) { return t % 10; }).join(', ') + '. Even numbers end in 0, 2, 4, 6 or 8.';
          if (api.tries() >= 1) {
            hint = 'Odd or even? ' + q.terms.map(function (t) { return t + (isEven(t) ? ' even' : ' odd'); }).join(', ') + '.';
            colourChips();
          }
        } else {
          tag = TAG.mult;
          hint = q.desc.mult
            ? 'Is ' + q.start + ' in the ' + k + ' times table? ' + k + ' × ' + q.start / k + ' = ' + q.start + '. Start on a multiple, add ' + k + ': still multiples.'
            : 'Is ' + q.start + ' in the ' + k + ' times table? Count in ' + k + 's: ' + seq(k, k, 5).join(', ') + ' …';
        }
        api.check(false, hint, tag);
      });
      wrap.appendChild(cbtn);
      stage.appendChild(wrap);
      function lock() {
        Object.keys(btns).forEach(function (x) {
          btns[x].disabled = true;
          btns[x].classList.remove('ja-bad');
          if (q.desc[x]) btns[x].classList.add('ja-good');
          else btns[x].classList.add('ja-dim');
        });
        cbtn.disabled = true;
      }
      function setRight() {
        Object.keys(btns).forEach(function (x) {
          picked[x] = q.desc[x];
          btns[x].classList.toggle('ja-on', q.desc[x]);
        });
        lock();
      }
      return { lock: lock, setRight: setRight };
    }
    var chipsShown = null;
    function colourChips() {
      if (chipsShown) return;
      chipsShown = el(
        'div',
        { class: 'ja-terms' },
        q.terms.map(function (t) {
          return el('span', { class: 'chip ja-tchip ' + (isEven(t) ? 'ja-even' : 'ja-odd') }, t + (isEven(t) ? ' even' : ' odd'));
        })
      );
      stage.appendChild(chipsShown);
    }
    function reasonText() {
      var r = isEven(k)
        ? q.start + ' is ' + (isEven(q.start) ? 'even' : 'odd') + ' and ' + k + ' is even, so they are all ' + (isEven(q.start) ? 'even' : 'odd') + '.'
        : k + ' is odd, so odd and even take turns.';
      if (q.desc.mult) r += ' ' + q.start + ' = ' + k + ' × ' + q.start / k + ', so they are all multiples of ' + k + '.';
      return r;
    }
    function explain() {
      colourChips();
      eng.work.appendChild(el('div', { class: 'ja-why' }, reasonText()));
    }

    api.onReveal(function () {
      if (!eng.isDone()) eng.reveal();
      if (q.describe) {
        if (!tick) tick = descPanel();
        tick.setRight();
        explain();
        api.feedback('Each jump is ' + k + '. ' + reasonText(), 'info');
      } else {
        api.feedback('Count on ' + k + ' from each number. The start ' + q.start + ' is not a jump.', 'info');
      }
    });
  }

  /* ---------------------------------------------------------------- *
   * Practice: find the rule and the missing terms
   * ---------------------------------------------------------------- */
  function renderFind(stage, api, q) {
    stage.classList.add('ja-stage');
    api.say('How far is one jump? That is the rule.', 'think');
    var shown = q.terms
      .map(function (t, i) {
        return q.missing.indexOf(i) === -1 ? String(t) : '__';
      })
      .join(', ');
    stage.appendChild(MQ.ui.prompt('<b>' + shown + '</b><br>Find the rule and the missing numbers.'));
    var eng = seqEngine(stage, api, q, {
      ruleBox: true,
      onDone: function () {
        api.check(true, 'Yes! Rule: add ' + q.step + '. ' + q.terms.join(', ') + '.');
      },
    });
    stage.appendChild(eng.work);
    api.onReveal(function () {
      eng.reveal();
      eng.work.insertBefore(el('span', { class: 'chip ja-wchip ja-wrule' }, q.terms[0] + ' → ' + q.terms[1] + ' is ' + q.step + ': rule add ' + q.step), eng.work.firstChild);
      api.feedback('Measure one jump: ' + q.terms[1] + ' − ' + q.terms[0] + ' = ' + q.step + '. Then add ' + q.step + ' to fill the gaps.', 'info');
    });
  }

  /* ---------------------------------------------------------------- *
   * Practice: count back (subtract rule); does it land on a number?
   * ---------------------------------------------------------------- */
  function renderBack(stage, api, q) {
    stage.classList.add('ja-stage');
    var k = -q.step;
    var t = q.target;
    api.say('Subtract! The frog jumps backwards.', 'think');
    stage.appendChild(MQ.ui.prompt('Start on <b>100</b>. Rule: <b>subtract ' + k + '</b>. Write the next 3 numbers.'));
    var follow = el('div', { class: 'ja-follow' });
    var choice = null;
    var view = { lo: 0, hi: 100, step: q.step, terms: q.terms.slice(0, 4), missing: [1, 2, 3] };
    var eng = seqEngine(stage, api, view, {
      rowTerms: q.terms.slice(0, 4),
      tall: true,
      onDone: function () {
        api.feedback('Right! Now think: will the frog land on ' + t + '?', 'info');
        ask();
      },
    });
    eng.line.pad(t, 'ja-target', t + '?', true);
    stage.appendChild(follow);
    stage.appendChild(eng.work);

    function around() {
      // the terms just above and below the target
      var i = 0;
      while (i < q.terms.length && q.terms[i] > t) i++;
      return q.terms.slice(Math.max(0, i - 3), Math.min(q.terms.length, i + 1));
    }
    function jumpAll(done) {
      var js = [];
      for (var i = 4; i < q.terms.length; i++) js.push([q.terms[i - 1], q.terms[i]]);
      hopChain(api, eng.line, js, q.step, done);
    }
    function landText() {
      var near = around();
      var last = near[near.length - 1];
      var prev = near[near.length - 2];
      if (q.answer.lands) return '… ' + near.join(', ') + '. ' + prev + ' − ' + k + ' = ' + t + ': yes, it lands on ' + t + '!';
      return '… ' + near.join(', ') + '. ' + prev + ' − ' + k + ' = ' + last + ': it jumps over ' + t + ', so no.';
    }
    function ask() {
      follow.appendChild(el('div', { class: 'ja-ask' }, 'If the frog keeps jumping back ' + k + ', will it land on ', el('b', null, String(t)), '?'));
      choice = MQ.ui.choices(
        [
          { label: 'Yes, it lands on ' + t, value: 'yes' },
          { label: 'No, it jumps over ' + t, value: 'no' },
        ],
        function (v) {
          var ok = (v === 'yes') === q.answer.lands;
          if (ok) {
            choice.mark(v, 'good');
            choice.disable();
            jumpAll(function () {
              eng.line.pad(t, q.answer.lands ? 'ja-hit' : 'ja-target ja-miss', q.answer.lands ? t : t + '✗');
            });
            eng.work.appendChild(el('div', { class: 'ja-why' }, landText()));
            api.check(true, q.answer.lands ? 'Yes! It lands on ' + t + '.' : 'Yes! It jumps over ' + t + '.');
            return;
          }
          choice.mark(v, 'bad');
          var near = around();
          var hint = 'Keep counting back in ' + k + 's from ' + q.terms[3] + '. Write the numbers on paper if it helps.';
          if (api.tries() >= 1) hint = 'Near the end the frog lands on ' + near.slice(0, -1).join(', ') + ', then ' + near[near.length - 2] + ' − ' + k + ' = ?';
          api.check(false, hint, TAG.land);
        },
        { columns: 2 }
      );
      choice.buttons.forEach(function (b) {
        b.setAttribute('data-value', b.value_);
      });
      choice.classList.add('ja-choices');
      follow.appendChild(choice);
    }

    api.onReveal(function () {
      if (!eng.isDone()) eng.reveal();
      if (!choice) ask();
      choice.mark(q.answer.lands ? 'yes' : 'no', 'good');
      choice.disable();
      api.later(function () {
        jumpAll(function () {
          eng.line.pad(t, q.answer.lands ? 'ja-hit' : 'ja-target ja-miss', q.answer.lands ? t : t + '✗');
        });
      }, 900);
      eng.work.appendChild(el('div', { class: 'ja-why' }, landText()));
      api.feedback('Count back ' + k + ' each time. ' + landText(), 'info');
    });
  }

  /* ---------------------------------------------------------------- *
   * Practice: open puzzle (two terms given, more than one answer)
   * ---------------------------------------------------------------- */
  function renderOpen(stage, api, q) {
    stage.classList.add('ja-stage');
    var a = q.a;
    var b = q.b;
    api.say('There is more than one right answer here!', 'happy');
    stage.appendChild(MQ.ui.prompt('Two numbers in a sequence of <b>5</b> numbers are <b>' + a + '</b> and <b>' + b + '</b>.<br>Make the sequence and write its rule.'));
    var lineBox = el('div', { class: 'ja-pic' });
    stage.appendChild(lineBox);
    function drawLine(terms, rule) {
      var vals = [a, b].concat(terms || []);
      var r = lineRange(vals);
      var line = numLine(r.lo, r.hi);
      if (terms) {
        terms.forEach(function (t, i) {
          line.pad(t, t === a || t === b ? 'ja-given' : '');
          if (i) line.arc(terms[i - 1], t, '+' + rule, 'ja-fwd');
        });
        line.frogTo(terms[terms.length - 1]);
      } else {
        line.pad(a, 'ja-given');
        line.pad(b, 'ja-given');
        line.frogTo(a);
      }
      MQ.clear(lineBox);
      lineBox.appendChild(line.svg);
      return line;
    }
    drawLine(null);
    var found = el('div', { class: 'ja-found' });
    stage.appendChild(found);
    var area = el('div', { class: 'ja-openarea' });
    stage.appendChild(area);
    var work = el('div', { class: 'ja-work' });
    stage.appendChild(work);
    var round = 0;
    var firstRule = null;
    var cur = null;

    function makeRound() {
      round++;
      MQ.clear(area);
      if (round === 2) area.appendChild(el('div', { class: 'ja-ask' }, 'Now find ', el('b', null, 'another'), ' answer with a ', el('b', null, 'different rule'), '.'));
      var ruleInp = el('input', { class: 'ja-box ja-rulebox', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: '2', 'data-slot': 'rule', 'aria-label': 'rule', placeholder: '?' });
      ruleInp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          check();
        }
      });
      var row = termRow(
        U.range(0, 4).map(function (i) {
          return { box: i };
        }),
        ['', '', '', ''],
        check
      );
      area.appendChild(el('div', { class: 'ja-rule' }, el('span', null, 'Rule: add'), ruleInp));
      var cb = btn('Check', 'btn-check ja-checkbtn', check);
      area.appendChild(el('div', { class: 'ja-rowwrap' }, row.el, cb));
      cur = { row: row, rule: ruleInp, btn: cb };
      focusLater(api, row.boxes[0]);
    }
    function lockCur() {
      cur.row.lock();
      cur.rule.disabled = true;
      cur.btn.disabled = true;
    }
    function check() {
      if (api.isAnswered()) return;
      var vals = U.range(0, 4).map(function (i) {
        return cur.row.val(i);
      });
      var raw = cur.rule.value.trim();
      var rule = raw === '' ? null : U.parseNum(raw);
      if (vals.some(function (v) { return v === null; }) || rule === null) {
        api.feedback('Fill all 5 boxes and the rule, then press Check.', 'info');
        return;
      }
      if (vals.some(function (v) { return isNaN(v); }) || isNaN(rule)) {
        api.feedback('Write whole numbers only.', 'info');
        return;
      }
      U.range(0, 4).forEach(function (i) {
        cur.row.boxes[i].classList.remove('ja-good', 'ja-bad');
      });
      cur.rule.classList.remove('ja-bad');
      var diffs = [];
      for (var i = 1; i < 5; i++) diffs.push(vals[i] - vals[i - 1]);
      var same = diffs.every(function (d) {
        return d === diffs[0];
      });
      if (same && diffs[0] < 0) {
        api.feedback('Your numbers go down. Write them going up, with an add rule.', 'info');
        return;
      }
      if (same && diffs[0] > 0 && rule !== diffs[0]) {
        cur.rule.classList.add('ja-bad');
        api.check(false, 'Your numbers go up by ' + diffs[0] + ' each time, so the rule is add ' + diffs[0] + ', not add ' + rule + '.', TAG.rule);
        return;
      }
      // the jumps must all match the rule
      for (i = 1; i < 5; i++) {
        if (vals[i] - vals[i - 1] !== rule) {
          cur.row.mark(i, false);
          var c = classify(vals[i], vals[i - 1], rule > 0 ? rule : 1, api.tries());
          var hint = rule > 0 ? 'From ' + vals[i - 1] + ' to ' + vals[i] + ' is not add ' + rule + '. ' + vals[i - 1] + ' + ' + rule + ' = ?' : 'The rule must be a jump forwards, like add 2.';
          api.check(false, hint, rule > 0 ? c.tag : TAG.rule);
          return;
        }
      }
      if (vals.indexOf(a) === -1 || vals.indexOf(b) === -1) {
        var miss = vals.indexOf(a) === -1 ? a : b;
        var h2 = 'Your sequence needs ' + miss + ' in it. From ' + a + ' to ' + b + ' is ' + (b - a) + '. Which jump fits into ' + (b - a) + ' exactly?';
        if (api.tries() >= 1) h2 = 'Try add 8: two jumps of 8 go from ' + a + ' to ' + b + ' (' + a + ' + 8 + 8 = ' + b + ').';
        api.check(false, h2, TAG.fit);
        return;
      }
      if (vals.some(function (v) { return v < 0; })) {
        api.feedback('Use numbers from 0 up.', 'info');
        return;
      }
      // a valid sequence
      if (round === 2 && rule === firstRule) {
        cur.rule.classList.add('ja-bad');
        api.check(false, 'That works, but it is the same rule as before (add ' + rule + '). There is more than one answer: try a different jump.', TAG.oneAnswer);
        return;
      }
      U.range(0, 4).forEach(function (i) {
        cur.row.mark(i, true);
      });
      cur.rule.classList.add('ja-good');
      lockCur();
      drawLine(vals, rule);
      api.sound('pop');
      found.appendChild(el('span', { class: 'chip ja-wchip' }, 'add ' + rule + ': ' + vals.join(', ')));
      if (round === 1) {
        firstRule = rule;
        api.feedback('Yes, that works! Is there another way?', 'good');
        makeRound();
        return;
      }
      api.check(true, 'Yes! Two different answers. ' + othersText() );
      showAll();
    }
    function othersText() {
      return 'Add 4, add 8 and add 16 all work.';
    }
    function showAll() {
      MQ.clear(work);
      work.appendChild(el('div', { class: 'ja-why' }, 'More than one right answer:'));
      var seen = {};
      q.solutions.forEach(function (s) {
        work.appendChild(el('span', { class: 'chip ja-wchip' + (seen[s.rule] ? ' ja-wsoft' : '') }, 'add ' + s.rule + ': ' + s.terms.join(', ')));
        seen[s.rule] = true;
      });
    }
    makeRound();

    api.onReveal(function () {
      // fill what is left with rules not used yet
      var pickRule = [8, 4, 16].filter(function (r) {
        return r !== firstRule;
      });
      function fill(rule) {
        var sol = q.solutions.filter(function (s) {
          return s.rule === rule;
        })[0];
        sol.terms.forEach(function (t, i) {
          cur.row.set(i, t);
        });
        cur.rule.value = String(rule);
        cur.rule.classList.add('ja-good');
        lockCur();
        drawLine(sol.terms, rule);
        found.appendChild(el('span', { class: 'chip ja-wchip' }, 'add ' + rule + ': ' + sol.terms.join(', ')));
      }
      if (round === 1) {
        firstRule = pickRule[0];
        fill(pickRule[0]);
        makeRound();
        pickRule = pickRule.slice(1);
      }
      fill(pickRule[0]);
      showAll();
      api.feedback(a + ' to ' + b + ' is ' + (b - a) + '. 4 jumps of 4, 2 jumps of 8 or 1 jump of 16 fit. ' + othersText(), 'info');
    });
  }

  /* ---------------------------------------------------------------- *
   * Register
   * ---------------------------------------------------------------- */
  MQ.register(ID, {
    learn: [learnStart, learnOddEven, learnNines, learnFind],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'cont') renderCont(stage, api, q);
        else if (q.type === 'find') renderFind(stage, api, q);
        else if (q.type === 'back') renderBack(stage, api, q);
        else renderOpen(stage, api, q);
      },
    },
  });

  MQ._test = MQ._test || {};
  MQ._test[ID] = {
    buildDeck: buildDeck,
    deck: function () {
      return deck;
    },
    verifyOpen: verifyOpen,
    bridge: bridge,
    classify: classify,
  };

  var css = [
    '.ja-stage{gap:10px}',
    '.ja-pic{width:100%;display:flex;justify-content:center}',
    '.ja-svg{display:block;max-width:100%;height:auto;user-select:none;-webkit-user-select:none}',
    '.ja-line{width:800px;max-height:236px}',
    '.ja-pond{fill:#e3f2fb}',
    '.ja-axis{stroke:#1b2a4a;stroke-width:3}',
    '.ja-t10{stroke:#1b2a4a;stroke-width:2.5}',
    '.ja-t5{stroke:#4a5a7d;stroke-width:2}',
    '.ja-t1{stroke:#9fb3d9;stroke-width:1.5}',
    '.ja-lead{stroke:#8338ec;stroke-width:1.5;stroke-dasharray:3 3}',
    '.ja-dec{font-size:15px;font-weight:700;fill:#7a88a8}',
    '.ja-pad{fill:#95d5b2;stroke:#2d6a4f;stroke-width:2}',
    '.ja-plab-bg{fill:#fff;stroke:#2d6a4f;stroke-width:2}',
    '.ja-plab{font-size:18px;font-weight:800;fill:#1b4332}',
    '.ja-startpad .ja-pad{fill:#ffd166;stroke:#b7791f}',
    '.ja-startpad .ja-plab-bg{fill:#fff6db;stroke:#b7791f}',
    '.ja-qpad .ja-plab-bg,.ja-target .ja-plab-bg{stroke-dasharray:4 3;stroke:#8338ec}',
    '.ja-qpad .ja-plab,.ja-target .ja-plab{fill:#8338ec}',
    '.ja-qpad .ja-pad,.ja-target .ja-pad{fill:#f3ebff;stroke:#8338ec}',
    '.ja-hit .ja-pad{fill:#ffd166;stroke:#2b9348}',
    '.ja-hit .ja-plab-bg{fill:var(--good-bg);stroke:#2b9348;stroke-width:3}',
    '.ja-miss .ja-plab{fill:#d62828}',
    '.ja-given .ja-plab-bg{fill:#fff6db;stroke:#b7791f;stroke-width:3}',
    '.ja-arc{fill:none;stroke-width:3;stroke-linecap:round}',
    '.ja-arrow{fill:none;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}',
    '.ja-fwd .ja-arc,.ja-fwd .ja-arrow{stroke:#2b9348}',
    '.ja-back .ja-arc,.ja-back .ja-arrow{stroke:#e76f51}',
    '.ja-unk .ja-arc,.ja-unk .ja-arrow{stroke:#8338ec;stroke-dasharray:5 4}',
    '.ja-alab-bg{fill:#fff;stroke-width:2}',
    '.ja-fwd .ja-alab-bg{stroke:#2b9348}',
    '.ja-back .ja-alab-bg{stroke:#e76f51}',
    '.ja-unk .ja-alab-bg{stroke:#8338ec}',
    '.ja-alab{font-size:15px;font-weight:800}',
    '.ja-fwd .ja-alab{fill:#2b9348}',
    '.ja-back .ja-alab{fill:#c2410c}',
    '.ja-unk .ja-alab{fill:#8338ec}',
    '.ja-frog{pointer-events:none;transition:transform .25s ease}',
    '.ja-btnrow{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;align-items:center}',
    '.ja-jump{background:#2b9348}',
    '.ja-help{font-size:1.25rem;font-weight:800;color:#2b9348;min-height:1.5em;text-align:center}',
    '.ja-terms{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;min-height:36px}',
    '.ja-tchip{font-size:1.2rem;font-weight:800;padding:4px 12px}',
    '.ja-tstart{background:#fff6db;border-color:#b7791f}',
    '.ja-even{background:#dbeafe;color:#1d4ed8;border-color:#93c5fd}',
    '.ja-odd{background:#ffedd5;color:#c2410c;border-color:#fdba74}',
    '.ja-choices{max-width:640px}',
    '.ja-choices .choice{font-size:1.1rem;min-height:52px}',
    '.ja-why{background:var(--info-bg);border-radius:14px;padding:8px 14px;font-size:1.1rem;font-weight:700;text-align:center;max-width:760px}',
    '.ja-why:empty{display:none}',
    '.ja-why2{margin-top:6px;display:flex;flex-wrap:wrap;gap:5px;align-items:center;justify-content:center}',
    '.ja-table{display:flex;flex-direction:column;gap:3px;align-items:stretch;font-size:1.15rem;font-weight:800}',
    '.ja-trow{display:flex;gap:14px;justify-content:space-between}',
    '.ja-add{color:#2b9348}',
    '.ja-eq{color:#0b6e66}',
    '.ja-ans .num-prefix{font-size:1.4rem}',
    '.ja-rowwrap{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;align-items:center}',
    '.ja-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center}',
    '.ja-rulechip{font-weight:800;font-size:1.05rem;padding:6px 12px;border-radius:12px;background:#e3f4d7;color:#1b4332;margin-right:6px}',
    '.ja-cell{display:inline-flex;flex-direction:column;align-items:center}',
    '.ja-num{display:inline-flex;align-items:center;justify-content:center;min-width:64px;height:56px;padding:0 6px;border-radius:12px;background:#fff;border:3px solid #95d5b2;font-size:1.7rem;font-weight:800}',
    '.ja-startnum{border-color:#b7791f;background:#fff6db}',
    '.ja-cap{font-size:.8rem;font-weight:800;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.3px}',
    '.ja-sep{font-size:1rem;font-weight:800;color:#2b9348}',
    '.ja-box{width:76px;height:56px;border-radius:12px;border:3px solid var(--line);font:inherit;font-size:1.7rem;font-weight:800;text-align:center;color:var(--ink);background:#fff}',
    '.ja-box:focus{outline:none;border-color:var(--accent)}',
    '.ja-box.ja-good{border-color:var(--good);background:var(--good-bg)}',
    '.ja-box.ja-bad{border-color:var(--try);background:var(--try-bg)}',
    '.ja-box:disabled{color:var(--ink)}',
    '.ja-rule{display:flex;gap:10px;align-items:center;font-size:1.4rem;font-weight:800}',
    '.ja-rulebox{width:64px}',
    '.ja-work{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;max-width:820px}',
    '.ja-work:empty{display:none}',
    '.ja-wchip{font-weight:800;font-size:.98rem;padding:3px 9px;background:#f1f8ec;border-color:#95d5b2}',
    '.ja-wsoft{opacity:.75}',
    '.ja-wrule{background:#f3ebff;border-color:#c4a7f5}',
    '.ja-desc{display:flex;flex-direction:column;align-items:center;gap:8px}',
    '.ja-desc-q{font-size:1.15rem;font-weight:700;text-align:center}',
    '.ja-stmts{display:grid;grid-template-columns:1fr 1fr;gap:6px;max-width:640px;width:100%}',
    '.ja-stmt{display:flex;align-items:center;gap:8px;text-align:left;padding:5px 10px;border-radius:12px;border:3px solid var(--line);background:#fff;font:inherit;font-size:1.05rem;font-weight:800;color:var(--ink);cursor:pointer;line-height:1.2}',
    '.ja-tick{flex:0 0 24px;height:24px;border-radius:7px;border:2.5px solid #9fb3d9;display:inline-flex;align-items:center;justify-content:center;color:#fff}',
    '.ja-stmt.ja-on .ja-tick{background:#2a9d8f;border-color:#2a9d8f}',
    '.ja-stmt.ja-on .ja-tick::after{content:"✓";font-size:18px}',
    '.ja-stmt.ja-on{border-color:#2a9d8f}',
    '.ja-stmt.ja-bad{border-color:var(--try);background:var(--try-bg)}',
    '.ja-stmt.ja-good{border-color:var(--good);background:var(--good-bg)}',
    '.ja-stmt.ja-dim{opacity:.5}',
    '.ja-stmt:disabled{cursor:default}',
    '.ja-follow{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.ja-follow:empty{display:none}',
    '.ja-ask{font-size:1.25rem;font-weight:800;text-align:center}',
    '.ja-found{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}',
    '.ja-found:empty{display:none}',
    '.ja-openarea{display:flex;flex-direction:column;align-items:center;gap:8px}',
    '@media (max-width:700px){.ja-num,.ja-box{min-width:54px;width:60px;height:50px;font-size:1.4rem}.ja-stmts{grid-template-columns:1fr}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

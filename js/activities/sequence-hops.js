/* Sequence Hops — find the jump size in a sequence and keep jumping, even past 100 (Unit 11.1).
 * A ball hops along a number line drawn to scale. Every jump in a sequence is the same size;
 * the child finds that size (the term-to-term rule) and writes the next terms.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var W = 820; // viewBox width
  var H = 176; // viewBox height
  var M = 40; // side margin
  var LY = 128; // y of the number line
  var DOT_Y = LY; // dots sit on the line

  /* ------------------------------------------------------------------ *
   * Maths helpers
   * ------------------------------------------------------------------ */
  function terms(start, step, n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(start + i * step);
    return out;
  }
  function signed(step) {
    return step < 0 ? '− ' + -step : '+ ' + step;
  }
  function ruleText(step) {
    return step < 0 ? 'subtract ' + -step : 'add ' + step;
  }
  // True when a jump from a to b passes over a hundred (landing on it does not count).
  function crossesHundred(a, b) {
    var lo = Math.min(a, b);
    var hi = Math.max(a, b);
    return Math.floor((hi - 1) / 100) * 100 > lo;
  }
  function hundredBetween(a, b) {
    return Math.floor((Math.max(a, b) - 1) / 100) * 100;
  }

  // A short way to do one jump, written as a sum the child can follow.
  function jumpWorking(prev, step) {
    var next = prev + step;
    var s = Math.abs(step);
    if (crossesHundred(prev, next)) {
      var h = hundredBetween(prev, next);
      if (step > 0) {
        var a = h - prev;
        return prev + ' + ' + a + ' = ' + h + ', then + ' + (s - a) + ' = ' + next;
      }
      var b = prev - h;
      return prev + ' − ' + b + ' = ' + h + ', then − ' + (s - b) + ' = ' + next;
    }
    if (s === 9 || s === 8) {
      var k = 10 - s;
      if (step > 0) return prev + ' + 10 = ' + (prev + 10) + ', take ' + k + ' away = ' + next;
      return prev + ' − 10 = ' + (prev - 10) + ', add ' + k + ' back = ' + next;
    }
    return prev + ' ' + signed(step) + ' = ' + next;
  }

  // Short tip for how to do a jump of this size.
  function jumpTip(step) {
    var s = Math.abs(step);
    if (s === 9) return step > 0 ? 'Adding 9 is like adding 10 and taking 1 away.' : 'Taking 9 away is like taking 10 away and adding 1 back.';
    if (s === 8) return step > 0 ? 'Adding 8 is like adding 10 and taking 2 away.' : 'Taking 8 away is like taking 10 away and adding 2 back.';
    return step > 0 ? 'Count on ' + s + ' from the last number.' : 'Count back ' + s + ' from the last number.';
  }

  /* ------------------------------------------------------------------ *
   * Number line drawn to scale, with dots, labels, hop arcs and a ball.
   * ------------------------------------------------------------------ */
  function windowFor(values, extra) {
    var mn = Math.min.apply(null, values);
    var mx = Math.max.apply(null, values) + (extra || 0);
    var lo = Math.floor((mn - 1) / 10) * 10;
    var hi = Math.ceil((mx + 1) / 10) * 10;
    if (lo < 0) lo = 0;
    if (hi - lo < 20) hi = lo + 20;
    return { lo: lo, hi: hi };
  }

  function track(lo, hi, opts) {
    opts = opts || {};
    var span = hi - lo;
    function X(v) {
      return M + ((v - lo) / span) * (W - 2 * M);
    }
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'sh-svg', role: 'img', 'aria-label': 'Number line from ' + lo + ' to ' + hi });
    var bg = svg('rect', { x: 0, y: 0, width: W, height: H, fill: 'transparent' });
    root.appendChild(bg);
    var arcG = svg('g', { class: 'sh-arcs' });
    var lineG = svg('g');
    var dotG = svg('g');
    var ballG = svg('g', { class: 'sh-ball' });
    root.appendChild(lineG);
    root.appendChild(arcG);
    root.appendChild(dotG);
    root.appendChild(ballG);

    lineG.appendChild(svg('line', { x1: M - 16, y1: LY, x2: W - M + 16, y2: LY, class: 'sh-axis' }));
    for (var v = lo; v <= hi; v++) {
      var major = v % 10 === 0;
      var five = v % 5 === 0;
      var isH = v % 100 === 0;
      lineG.appendChild(svg('line', { x1: X(v), y1: LY - (major ? 9 : five ? 6 : 4), x2: X(v), y2: LY + (major ? 9 : five ? 6 : 4), class: 'sh-tick' + (isH ? ' sh-tick-h' : '') }));
      if (major) lineG.appendChild(svg('text', { x: X(v), y: LY + 30, class: 'sh-tlabel' + (isH ? ' sh-tlabel-h' : '') }, String(v)));
    }

    var t = {
      svg: root,
      X: X,
      lo: lo,
      hi: hi,
      dots: {},
      // A dot on the line with a pill label above it.
      dot: function (val, label, cls) {
        var g = svg('g', { class: 'sh-dot ' + (cls || '') });
        g.appendChild(svg('circle', { cx: X(val), cy: DOT_Y, r: 7 }));
        var txt = label == null ? String(val) : label;
        var w = Math.max(30, 13 * String(txt).length + 14);
        g.appendChild(svg('rect', { x: X(val) - w / 2, y: LY - 44, width: w, height: 28, rx: 8, class: 'sh-pill' }));
        var tx = svg('text', { x: X(val), y: LY - 24, class: 'sh-pill-text' }, String(txt));
        g.appendChild(tx);
        g.setText = function (s, c) {
          tx.textContent = String(s);
          var w2 = Math.max(30, 13 * String(s).length + 14);
          var r = g.querySelector('rect');
          r.setAttribute('x', X(val) - w2 / 2);
          r.setAttribute('width', w2);
          if (c) g.setAttribute('class', 'sh-dot ' + c);
        };
        dotG.appendChild(g);
        t.dots[val] = g;
        return g;
      },
      // A hop arc from a to b with a label at the top.
      arc: function (a, b, label, cls) {
        var x1 = X(a);
        var x2 = X(b);
        var top = LY - 52 - Math.min(40, Math.abs(x2 - x1) * 0.25);
        var mx = (x1 + x2) / 2;
        var g = svg('g', { class: 'sh-arc ' + (cls || '') });
        g.appendChild(svg('path', { d: 'M ' + x1 + ' ' + (LY - 46) + ' Q ' + mx + ' ' + (top - 30) + ' ' + x2 + ' ' + (LY - 46) }));
        // arrow head at b
        var dir = x2 > x1 ? -1 : 1;
        g.appendChild(svg('path', { class: 'sh-head', d: 'M ' + x2 + ' ' + (LY - 46) + ' l ' + dir * 10 + ' -9 M ' + x2 + ' ' + (LY - 46) + ' l ' + dir * 1 + ' -13' }));
        var lab = svg('text', { x: mx, y: top - 12, class: 'sh-arc-label' }, label);
        g.appendChild(lab);
        g.setLabel = function (s, c) {
          lab.textContent = s;
          if (c) g.setAttribute('class', 'sh-arc ' + c);
        };
        arcG.appendChild(g);
        return g;
      },
      clearArcs: function (cls) {
        Array.prototype.slice.call(arcG.querySelectorAll('.' + cls)).forEach(function (n) {
          n.parentNode.removeChild(n);
        });
      },
      ball: null,
      ballAt: null,
      // A ball that sits on the line at value v.
      makeBall: function (v) {
        MQ.clear(ballG);
        var g = svg('g', { class: 'sh-ball-in' });
        g.appendChild(svg('circle', { cx: 0, cy: 0, r: 13, class: 'sh-ball-c' }));
        g.appendChild(svg('path', { d: 'M -13 0 H 13 M 0 -13 V 13 M -9 -9 Q 0 0 -9 9 M 9 -9 Q 0 0 9 9', class: 'sh-ball-l' }));
        ballG.appendChild(g);
        t.ball = g;
        t.placeBall(v);
        return g;
      },
      placeBall: function (v, y) {
        t.ballAt = v;
        t.ball.style.transform = 'translate(' + X(v) + 'px,' + (y == null ? LY : y) + 'px)';
      },
      valueAt: function (x) {
        return Math.round(lo + ((x - M) / (W - 2 * M)) * span);
      },
      background: bg,
    };
    return t;
  }

  // Animate the ball from its spot to v with a little bounce.
  function hop(api, t, v, done) {
    var from = t.ballAt;
    var mid = (from + v) / 2;
    t.placeBall(mid, LY - 92);
    api.sound('pop');
    api.later(function () {
      t.placeBall(v);
      api.later(function () {
        if (done) done();
      }, 260);
    }, 260);
  }

  /* ------------------------------------------------------------------ *
   * Row of terms: given numbers and answer boxes, like the book.
   * ------------------------------------------------------------------ */
  function termRow(given, blanks, onEnter) {
    var row = el('div', { class: 'sh-row' });
    var boxes = [];
    given.forEach(function (g, i) {
      if (i) row.appendChild(el('span', { class: 'sh-comma' }, ','));
      row.appendChild(el('span', { class: 'sh-term' }, String(g)));
    });
    for (var i = 0; i < blanks; i++) {
      row.appendChild(el('span', { class: 'sh-comma' }, ','));
      var inp = el('input', { class: 'sh-box', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Next number ' + (i + 1), maxlength: 4 });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          onEnter();
        }
      });
      boxes.push(inp);
      row.appendChild(inp);
    }
    return { el: row, boxes: boxes };
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  var deck = null;

  function fillQ(start, step, withRule) {
    return { kind: 'fill', start: start, step: step, given: terms(start, step, 4), answers: terms(start + 4 * step, step, 3), rule: !!withRule };
  }

  function buildDeck() {
    var used = {};
    function key(q) {
      return q.kind + ':' + (q.start != null ? q.start : q.a) + ':' + q.step;
    }
    function take(q) {
      if (used[key(q)]) return false;
      used[key(q)] = true;
      out.push(q);
      return true;
    }
    var out = [];

    // Level 1: small steps that stay below about 100, plus one workbook set.
    var wb = U.shuffle([fillQ(8, 4), fillQ(26, 5), fillQ(27, -3)]);
    var l1steps = U.shuffle([2, 5, 10]).slice(0, 2);
    var l1 = [];
    l1steps.forEach(function (s) {
      var maxStart = Math.min(50, 100 - 6 * s);
      var q;
      do {
        q = fillQ(U.rand(10, maxStart), s);
      } while (q.start === wb[0].start && q.step === wb[0].step);
      l1.push(q);
    });
    l1.push(wb[0]);
    U.shuffle(l1).forEach(take);

    // Level 2: steps 3, 4, 8, 9 (adding), start 10–100, then name the rule.
    // Book sets 18, 27, 36, 45 (add 9) and 83, 91, 99, 107 (add 8) can appear.
    var l2steps = U.shuffle([3, 4, 8, 9]).slice(0, 3);
    l2steps.forEach(function (s) {
      var q;
      var guard = 0;
      do {
        if (s === 9 && Math.random() < 0.35) q = fillQ(18, 9, true);
        else if (s === 8 && Math.random() < 0.35) q = fillQ(83, 8, true);
        else {
          // Aim for sequences that cross 100 about half the time.
          var start = Math.random() < 0.5 ? U.rand(100 - 6 * s + 1, 100 - 3 * s) : U.rand(10, 100);
          q = fillQ(start, s, true);
        }
        guard++;
      } while (used[key(q)] && guard < 50);
      take(q);
    });

    // Level 3: subtract 8 or 9 across 100; generate five terms from a rule; two-numbers puzzle.
    var s7 = U.pick([8, 9]);
    var q7;
    if (s7 === 9 && Math.random() < 0.4) q7 = fillQ(135, -9);
    else q7 = fillQ(s7 === 9 ? U.rand(127, 140) : U.rand(124, 140), -s7);
    take(q7);

    var s8 = U.pick([8, 9]);
    var start8 = s8 === 8 && Math.random() < 0.4 ? 108 : U.rand(101, 100 + 4 * s8);
    take({ kind: 'gen', start: start8, step: -s8, answers: terms(start8 - s8, -s8, 5) });

    var gstep = U.pick([3, 4, 6]);
    var k = gstep === 6 ? 2 : U.pick([3, 4]);
    var a = U.rand(11, 30);
    var b = a + gstep * k;
    var gap = b - a;
    var wrong = [5, 7].filter(function (s) {
      return gap % s !== 0;
    });
    var extra = [10, 9].filter(function (s) {
      return gap % s !== 0 && wrong.indexOf(s) === -1;
    });
    var opts = U.shuffle([gstep].concat(wrong.concat(extra).slice(0, 2)));
    take({ kind: 'gap', a: a, b: b, step: gstep, options: opts });
    return out;
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */
  function learnFind(stage, api) {
    api.say('These numbers are a sequence. Every jump is the same size. How big is the jump?');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Find the jump', 'Drag the ball from <b>18</b> to <b>27</b>.'));
    var seq = [18, 27, 36, 45];
    var t = track(10, 80);
    seq.forEach(function (v) {
      t.dot(v);
    });
    t.makeBall(18);
    var done = false;
    var info = el('div', { class: 'sh-working' });
    var row = el('div', { class: 'sh-row' }, el('span', { class: 'sh-term' }, '18'), el('span', { class: 'sh-comma' }, ','), el('span', { class: 'sh-term' }, '27'), el('span', { class: 'sh-comma' }, ','), el('span', { class: 'sh-term' }, '36'), el('span', { class: 'sh-comma' }, ','), el('span', { class: 'sh-term' }, '45'));
    stage.appendChild(row);
    stage.appendChild(el('div', { class: 'sh-svg-wrap' }, t.svg));
    stage.appendChild(info);

    function land(v) {
      if (done) return;
      v = U.clamp(v, t.lo, t.hi);
      t.placeBall(v);
      if (v === 27) {
        done = true;
        api.sound('correct');
        t.arc(18, 27, '+ 9', 'sh-arc-good');
        info.innerHTML = '';
        info.appendChild(el('div', { class: 'sh-line' }, 'From 18 to 27 is a jump of ', el('b', null, '9'), '.'));
        api.say('From 18 to 27 is 9. Is every jump 9?', 'happy');
        api.later(function () {
          t.arc(27, 36, '+ 9', 'sh-arc-good');
        }, 600);
        api.later(function () {
          t.arc(36, 45, '+ 9', 'sh-arc-good');
          info.appendChild(el('div', { class: 'sh-rule' }, 'Rule: add 9 each time'));
          api.say('Yes! Every jump is 9. The rule is: add 9 each time.', 'cheer');
          api.feedback('The jump size is the rule of the sequence.', 'good');
          api.unlockNext();
        }, 1200);
      } else {
        api.sound('click');
        info.innerHTML = '';
        info.appendChild(el('div', { class: 'sh-line' }, 'That is ' + v + '. Find 27: count on from 18.'));
      }
    }
    var startX = 0;
    api.cleanup(
      MQ.ui.drag(t.svg, t.ball, {
        start: function () {
          startX = t.X(t.ballAt);
        },
        move: function (p, dx) {
          if (done) return;
          var x = U.clamp(startX + dx, t.X(t.lo), t.X(t.hi));
          t.ball.style.transition = 'none';
          t.ball.style.transform = 'translate(' + x + 'px,' + LY + 'px)';
        },
        end: function (p) {
          t.ball.style.transition = '';
          land(t.valueAt(p.x));
        },
      })
    );
    // Clicking on the line also moves the ball there.
    t.svg.addEventListener('click', function (e) {
      if (done || e.target.closest('.sh-ball')) return;
      land(t.valueAt(MQ.ui.svgPoint(t.svg, e).x));
    });
  }

  function learnHopOn(stage, api) {
    api.say('Now keep going. Press Hop to jump 9 more, three times.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Keep jumping', 'Adding 9 is like adding 10 and taking 1 away.'));
    var t = track(10, 80);
    var seq = [18, 27, 36, 45];
    seq.forEach(function (v, i) {
      t.dot(v);
      if (i) t.arc(seq[i - 1], v, '+ 9');
    });
    [54, 63, 72].forEach(function (v) {
      t.dot(v, '?', 'sh-dot-empty');
    });
    t.makeBall(45);
    var log = el('div', { class: 'sh-working' });
    var n = 0;
    var busy = false;
    var btn = el('button', { class: 'btn btn-big', type: 'button' }, 'Hop + 9 ▶');
    btn.addEventListener('click', function () {
      if (busy || n >= 3) return;
      busy = true;
      var from = 45 + n * 9;
      var to = from + 9;
      t.arc(from, to, '+ 9', 'sh-arc-good');
      hop(api, t, to, function () {
        t.dots[to].setText(to, 'sh-dot-new');
        log.appendChild(el('div', { class: 'sh-line' }, jumpWorking(from, 9)));
        n++;
        busy = false;
        if (n === 3) {
          btn.disabled = true;
          api.say('54, 63, 72. Each time: add 10, take 1 away.', 'cheer');
          api.feedback('18, 27, 36, 45, 54, 63, 72: the rule is add 9.', 'good');
          api.unlockNext();
        }
      });
    });
    stage.appendChild(el('div', { class: 'sh-svg-wrap' }, t.svg));
    stage.appendChild(btn);
    stage.appendChild(log);
  }

  function learnHopBack(stage, api) {
    api.say('This one gets smaller. The jumps go backwards. Hop back three times.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Going down, past 100', '135, 126, 117, 108 … the rule is <b>subtract 9</b>.'));
    var t = track(70, 140);
    var seq = [135, 126, 117, 108];
    seq.forEach(function (v, i) {
      t.dot(v);
      if (i) t.arc(seq[i - 1], v, '− 9');
    });
    [99, 90, 81].forEach(function (v) {
      t.dot(v, '?', 'sh-dot-empty');
    });
    t.makeBall(108);
    var log = el('div', { class: 'sh-working' });
    var n = 0;
    var busy = false;
    var btn = el('button', { class: 'btn btn-big', type: 'button' }, '◀ Hop − 9');
    btn.addEventListener('click', function () {
      if (busy || n >= 3) return;
      busy = true;
      var from = 108 - n * 9;
      var to = from - 9;
      t.arc(from, to, '− 9', 'sh-arc-good');
      hop(api, t, to, function () {
        t.dots[to].setText(to, 'sh-dot-new');
        log.appendChild(el('div', { class: 'sh-line' + (n === 0 ? ' sh-line-h' : '') }, jumpWorking(from, -9)));
        if (n === 0) api.say('Careful at 100! 108 take 8 is 100. Take 1 more: 99.', 'think');
        n++;
        busy = false;
        if (n === 3) {
          btn.disabled = true;
          api.say('99, 90, 81. You jumped past 100!', 'cheer');
          api.feedback('Stop at 100 on the way past. 108 − 8 = 100, then − 1 = 99.', 'good');
          api.unlockNext();
        }
      });
    });
    stage.appendChild(el('div', { class: 'sh-svg-wrap' }, t.svg));
    stage.appendChild(btn);
    stage.appendChild(log);
  }

  /* ------------------------------------------------------------------ *
   * Practice
   * ------------------------------------------------------------------ */
  function renderFill(stage, api, q) {
    var isGen = q.kind === 'gen';
    var given = isGen ? [q.start] : q.given;
    var all = given.concat(q.answers);
    var w = windowFor(all);
    var t = track(w.lo, w.hi);
    given.forEach(function (v, i) {
      t.dot(v);
      if (i && !isGen) t.arc(given[i - 1], v, '?', 'sh-arc-q');
    });
    q.answers.forEach(function (v) {
      t.dot(v, '?', 'sh-dot-empty');
    });

    if (isGen) {
      api.say('Start at ' + q.start + '. ' + (q.step < 0 ? 'Take away ' + -q.step : 'Add ' + q.step) + ' each time.');
      stage.appendChild(el('div', { class: 'prompt' }, 'Start at ', el('b', null, String(q.start)), '. The rule is ', el('b', null, ruleText(q.step)), '. Write the next 5 numbers.'));
    } else {
      api.say(api.level === 1 ? 'How big is each jump? Write the next 3 numbers.' : 'Find the jump. Then write the next 3 numbers.');
      stage.appendChild(el('div', { class: 'prompt' }, 'Write the next 3 numbers in the sequence.'));
    }

    var row = termRow(given, q.answers.length, submit);
    var checkBtn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    checkBtn.addEventListener('click', submit);
    var working = el('div', { class: 'sh-working' });
    var ruleArea = el('div', { class: 'sh-rule-area' });
    stage.appendChild(el('div', { class: 'sh-svg-wrap' }, t.svg));
    stage.appendChild(el('div', { class: 'sh-answer' }, row.el, checkBtn));
    stage.appendChild(working);
    stage.appendChild(ruleArea);
    try {
      row.boxes[0].focus({ preventScroll: true });
    } catch (e) {}

    var stepsShown = false;
    function showSteps() {
      if (stepsShown || isGen) return;
      stepsShown = true;
      t.clearArcs('sh-arc-q');
      given.forEach(function (v, i) {
        if (i) t.arc(given[i - 1], v, signed(q.step), 'sh-arc-good');
      });
    }

    function lockBoxes() {
      row.boxes.forEach(function (b) {
        b.disabled = true;
      });
      checkBtn.disabled = true;
    }

    function showAnswers() {
      showSteps();
      var prev = given[given.length - 1];
      MQ.clear(working);
      q.answers.forEach(function (v, i) {
        row.boxes[i].value = v;
        row.boxes[i].classList.remove('bad');
        row.boxes[i].classList.add('good');
        t.dots[v].setText(v, 'sh-dot-new');
        t.arc(prev, v, signed(q.step), 'sh-arc-good');
        working.appendChild(el('div', { class: 'sh-line' + (crossesHundred(prev, v) ? ' sh-line-h' : '') }, jumpWorking(prev, q.step)));
        prev = v;
      });
    }

    var termsDone = false;

    function submit() {
      if (api.isAnswered() || termsDone) return;
      var vals = row.boxes.map(function (b) {
        return b.value.trim() === '' ? NaN : U.parseNum(b.value);
      });
      var empty = vals.findIndex(function (v) {
        return isNaN(v);
      });
      if (empty !== -1) {
        row.boxes[empty].classList.add('shake');
        api.later(function () {
          row.boxes[empty].classList.remove('shake');
        }, 400);
        row.boxes[empty].focus();
        api.feedback('Fill in every box, then press Check.', 'info');
        return;
      }
      var bad = -1;
      row.boxes.forEach(function (b, i) {
        b.classList.remove('good', 'bad');
        if (vals[i] === q.answers[i]) b.classList.add('good');
        else {
          b.classList.add('bad');
          if (bad === -1) bad = i;
        }
      });
      if (bad === -1) {
        termsDone = true;
        lockBoxes();
        showAnswers();
        if (q.rule) askRule();
        else api.check(true, isGen ? 'Brilliant! ' + q.answers.join(', ') + '.' : 'Yes! The rule is ' + ruleText(q.step) + '.');
        return;
      }
      // Diagnose the first wrong box.
      var prev = bad === 0 ? given[given.length - 1] : q.answers[bad - 1];
      var want = q.answers[bad];
      var got = vals[bad];
      var s = Math.abs(q.step);
      var hint;
      var tag;
      if (q.step < 0 && got === prev + s) {
        tag = 'Added when the rule was subtract';
        hint = 'The numbers are getting smaller. Take ' + s + ' away each time.';
      } else if (crossesHundred(prev, want) && Math.abs(got - want) % 10 === 0) {
        tag = 'Slip when crossing 100';
        hint = 'Careful as you cross 100. ' + jumpWorking(prev, q.step).replace(/ = [0-9]+$/, ' = ?');
      } else if (crossesHundred(prev, want) && Math.abs(got - want) <= 2) {
        tag = 'Slip when crossing 100';
        hint = 'Stop at ' + hundredBetween(prev, want) + ' on the way. How much more is left to jump?';
      } else if (!isGen && got - prev !== q.step && bad === 0) {
        tag = 'Wrong step size';
        hint = 'Check the jump: from ' + given[0] + ' to ' + given[1] + ' is ' + signed(q.step) + '. Every jump is the same.';
      } else {
        tag = 'Wrong step size';
        hint = 'Each jump is ' + signed(q.step) + '. What is ' + prev + ' ' + signed(q.step) + '?';
      }
      if (api.tries() >= 1) {
        showSteps();
        hint += ' ' + jumpTip(q.step);
      }
      api.check(false, hint, tag);
    }

    function askRule() {
      api.say('Great! Now, what is the rule?', 'happy');
      api.feedback('Those numbers are right! Now choose the rule.', 'good');
      ruleArea.appendChild(el('div', { class: 'prompt' }, 'What is the rule?'));
      var s = q.step;
      var opts = [ruleText(s), ruleText(-s)];
      var near = U.pick([s + 1, s - 1].filter(function (x) {
        return x > 1 && x !== 10;
      }));
      if (q.start % s !== 0 && s >= 3) opts.push('the ' + s + ' times table');
      else opts.push(ruleText(near));
      var ch = MQ.ui.choices(U.shuffle(opts), function (v) {
        if (api.isAnswered()) return;
        if (v === ruleText(s)) {
          ch.mark(v, 'good');
          ch.disable();
          api.check(true, 'Yes! ' + ruleText(s).replace(/^a/, 'A') + ' each time.');
          return;
        }
        ch.mark(v, 'bad');
        if (/subtract/.test(v)) api.check(false, 'The numbers get bigger, so we add. How much each time?', 'Added when the rule was subtract');
        else if (/table/.test(v)) api.check(false, 'They jump in ' + s + 's, but ' + q.start + ' is not in the ' + s + ' times table. The rule is about the jump.', 'Rule named as a table instead of a step');
        else api.check(false, 'Look at the jumps on the line: each one is ' + signed(s) + '.', 'Wrong step size');
      }, { columns: 3 });
      ch.classList.add('sh-choices');
      ruleArea.appendChild(ch);
      ruleArea.choices = ch;
    }

    api.onReveal(function () {
      lockBoxes();
      showAnswers();
      api.feedback('Each jump is ' + signed(q.step) + ': ' + q.answers.join(', ') + '. The rule is ' + ruleText(q.step) + '.', 'info');
      if (ruleArea.choices) {
        ruleArea.choices.mark(ruleText(q.step), 'good');
        ruleArea.choices.disable();
      } else if (q.rule) {
        ruleArea.appendChild(el('div', { class: 'sh-rule' }, 'Rule: ' + ruleText(q.step) + ' each time'));
      }
    });
  }

  function renderGap(stage, api, q) {
    api.say(q.a + ' and ' + q.b + ' are in the same sequence. Which jump lands on both?');
    stage.appendChild(el('div', { class: 'prompt' }, el('b', null, String(q.a)), ' and ', el('b', null, String(q.b)), ' are both in a sequence that goes up in equal jumps. Which rule could it be?'));
    var w = windowFor([q.a, q.b], 9);
    var t = track(w.lo, w.hi);
    t.dot(q.a);
    t.dot(q.b);
    var working = el('div', { class: 'sh-working' });
    stage.appendChild(el('div', { class: 'sh-svg-wrap' }, t.svg));
    var gap = q.b - q.a;

    function tryHops(s, cls) {
      t.clearArcs('sh-arc-try');
      t.clearArcs('sh-arc-bad');
      var v = q.a;
      var landed = [];
      while (v < q.b) {
        t.arc(v, v + s, '+ ' + s, cls);
        v += s;
        landed.push(v);
      }
      return { last: v, landed: landed };
    }

    var ch = MQ.ui.choices(
      q.options.map(function (s) {
        return { label: 'add ' + s, value: s };
      }),
      function (s) {
        if (api.isAnswered()) return;
        if (s === q.step) {
          ch.mark(s, 'good');
          ch.disable();
          tryHops(s, 'sh-arc-good');
          MQ.clear(working);
          working.appendChild(el('div', { class: 'sh-line' }, q.a + ', ' + terms(q.a + s, s, gap / s).join(', ')));
          api.check(true, 'Yes! Jumps of ' + s + ' go from ' + q.a + ' and land on ' + q.b + '.');
          return;
        }
        ch.mark(s, 'bad');
        var r = tryHops(s, 'sh-arc-bad');
        MQ.clear(working);
        working.appendChild(el('div', { class: 'sh-line' }, 'Jumps of ' + s + ': ' + q.a + ', ' + r.landed.join(', ') + '. We jumped over ' + q.b + '!'));
        var hint = 'Jumps of ' + s + ' miss ' + q.b + '. Try another jump.';
        if (api.tries() >= 1) hint = 'The gap from ' + q.a + ' to ' + q.b + ' is ' + gap + '. Which jump fits into ' + gap + ' exactly?';
        api.check(false, hint, 'Step does not land on the second number');
      },
      { columns: 3 }
    );
    stage.appendChild(ch);
    stage.appendChild(working);

    api.onReveal(function () {
      ch.mark(q.step, 'good');
      ch.disable();
      tryHops(q.step, 'sh-arc-good');
      MQ.clear(working);
      var parts = [];
      for (var i = 0; i < gap / q.step; i++) parts.push(q.step);
      working.appendChild(el('div', { class: 'sh-line' }, 'The gap is ' + q.b + ' − ' + q.a + ' = ' + gap + '.'));
      working.appendChild(el('div', { class: 'sh-line' }, gap + ' = ' + parts.join(' + ') + ', so jumps of ' + q.step + ' land on ' + q.b + '.'));
      api.feedback('The gap is ' + gap + '. Jumps of ' + q.step + ' fit into ' + gap + ' exactly, so the rule could be add ' + q.step + '.', 'info');
    });
  }

  MQ.register('sequence-hops', {
    _buildDeck: buildDeck, // used only by test scripts
    learn: [learnFind, learnHopOn, learnHopBack],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (api.index === 0 || !deck) deck = buildDeck();
        var q = deck[api.index];
        if (q.kind === 'gap') renderGap(stage, api, q);
        else renderFill(stage, api, q);
      },
    },
  });

  document.head.appendChild(
    el(
      'style',
      { 'data-activity': 'sequence-hops' },
      [
        '.sh-svg-wrap{width:100%;max-width:820px;}',
        '.sh-svg{width:100%;height:auto;display:block;background:#fff;border:2px solid var(--line);border-radius:16px;}',
        '.sh-axis{stroke:var(--ink);stroke-width:3;stroke-linecap:round;}',
        '.sh-tick{stroke:var(--ink-soft);stroke-width:1.5;}',
        '.sh-tick-h{stroke:var(--gold);stroke-width:4;}',
        '.sh-tlabel{font-size:15px;fill:var(--ink-soft);text-anchor:middle;font-weight:700;}',
        '.sh-tlabel-h{fill:#b7791f;font-size:17px;font-weight:800;}',
        '.sh-dot circle{fill:#0b6e66;}',
        '.sh-pill{fill:#e6f6f4;stroke:#0b6e66;stroke-width:2;}',
        '.sh-pill-text{font-size:18px;font-weight:800;fill:var(--ink);text-anchor:middle;}',
        '.sh-dot-empty circle{fill:#fff;stroke:var(--ink-soft);stroke-width:2;}',
        '.sh-dot-empty .sh-pill{fill:#fff;stroke:var(--line);stroke-dasharray:4 3;}',
        '.sh-dot-empty .sh-pill-text{fill:var(--ink-soft);}',
        '.sh-dot-new circle{fill:var(--good);}',
        '.sh-dot-new .sh-pill{fill:var(--good-bg);stroke:var(--good);}',
        '.sh-arc path{fill:none;stroke:var(--ink-soft);stroke-width:2.5;stroke-linecap:round;}',
        '.sh-arc-label{font-size:18px;font-weight:800;fill:var(--ink-soft);text-anchor:middle;}',
        '.sh-arc-good path{stroke:#0b6e66;}',
        '.sh-arc-good .sh-arc-label{fill:#0b6e66;}',
        '.sh-arc-bad path{stroke:var(--try);stroke-dasharray:6 4;}',
        '.sh-arc-bad .sh-arc-label{fill:var(--try);}',
        '.sh-ball-in{transition:transform .26s ease-in-out;}',
        '.sh-ball-c{fill:#f28c28;stroke:#a85a12;stroke-width:2;}',
        '.sh-ball-l{fill:none;stroke:#a85a12;stroke-width:1.5;}',
        '.sh-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;font-size:1.6rem;font-weight:800;}',
        '.sh-term{min-width:56px;text-align:center;padding:6px 8px;border-radius:12px;background:var(--info-bg);border:2px solid var(--line);}',
        '.sh-comma{color:var(--ink-soft);}',
        '.sh-box{width:78px;height:54px;font-size:1.5rem;font-weight:800;text-align:center;border-radius:12px;border:3px solid var(--line);font-family:inherit;color:var(--ink);}',
        '.sh-box.good{border-color:var(--good);background:var(--good-bg);}',
        '.sh-box.bad{border-color:var(--try);background:var(--try-bg);}',
        '.sh-answer{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px;}',
        '.sh-working{display:flex;flex-direction:column;align-items:center;gap:4px;}',
        '.sh-line{font-size:1.2rem;font-weight:700;background:var(--paper-2);border-radius:10px;padding:4px 12px;}',
        '.sh-line-h{background:#fff3cd;}',
        '.sh-rule{font-size:1.3rem;font-weight:800;color:#0b6e66;background:var(--good-bg);border:2px solid var(--good);border-radius:12px;padding:6px 14px;}',
        '.sh-rule-area{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;}',
        '.sh-choices{max-width:600px;}',
        '@media (max-width:860px){.sh-box{width:64px;height:48px;font-size:1.3rem;}.sh-row{font-size:1.3rem;}.sh-term{min-width:46px;}}',
      ].join('\n')
    )
  );
})();

/* Quarter and Half Turns (Unit 15.1) — an arrow on a clock-like dial turns clockwise or
 * anticlockwise by quarter, half, three-quarter and full turns. A quarter turn is a right angle
 * (shaded quarter + little square); a half turn is two right angles (a straight line).
 * Angles are in degrees measured clockwise from 12 o'clock: 0 = 12, 90 = 3, 180 = 6, 270 = 9.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var C = 160; // centre of the dial (viewBox 0 0 320 320)
  var R_FACE = 150;
  var R_NUM = 116; // where the 12 / 3 / 6 / 9 click targets sit
  var R_TGT = 25;
  var L_ARROW = 86;
  var R_SEC = 70; // radius of the shaded turn
  var NAME = { 0: '12', 90: '3', 180: '6', 270: '9' };
  var CW = '↻';
  var ACW = '↺';

  function norm(d) {
    return ((Math.round(d) % 360) + 360) % 360;
  }
  function r2(n) {
    return Math.round(n * 100) / 100;
  }
  function pt(deg, r) {
    var a = (deg * Math.PI) / 180;
    return { x: r2(C + r * Math.sin(a)), y: r2(C - r * Math.cos(a)) };
  }
  function ease(p) {
    return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  }

  /** Shaded slice from angle `start`, turning `s` degrees (+ clockwise, − anticlockwise). */
  function sectorPath(start, s) {
    if (Math.abs(s) < 0.5) return '';
    if (Math.abs(s) >= 359.5) {
      return 'M' + (C - R_SEC) + ',' + C + ' a' + R_SEC + ',' + R_SEC + ' 0 1 0 ' + 2 * R_SEC + ',0 a' + R_SEC + ',' + R_SEC + ' 0 1 0 ' + -2 * R_SEC + ',0Z';
    }
    var a = pt(start, R_SEC);
    var b = pt(start + s, R_SEC);
    var large = Math.abs(s) > 180 ? 1 : 0;
    var sweep = s > 0 ? 1 : 0;
    return 'M' + C + ',' + C + ' L' + a.x + ',' + a.y + ' A' + R_SEC + ',' + R_SEC + ' 0 ' + large + ' ' + sweep + ' ' + b.x + ',' + b.y + ' Z';
  }

  /* ---------------------------------------------------------------- *
   * Words
   * ---------------------------------------------------------------- */

  function dirWord(dir) {
    return dir > 0 ? 'clockwise ' + CW : 'anticlockwise ' + ACW;
  }
  function amountWord(n, word) {
    if (word === 'ra') return n + ' right angle' + (n > 1 ? 's' : '');
    return ['', 'a quarter turn', 'a half turn', 'a three-quarter turn'][n];
  }
  function stepText(st) {
    return amountWord(st.n, st.word) + ' ' + dirWord(st.dir);
  }
  function capFor(n) {
    if (n === 1) return '1 right angle = a quarter turn';
    if (n === 2) return '2 right angles = a half turn: a straight line';
    if (n === 3) return '3 right angles = a three-quarter turn';
    return '4 right angles = a full turn: back to the start';
  }
  /** "3 → 6 → 9" going round from `start` in direction dir for n jumps. */
  function pathText(start, dir, n) {
    var out = [NAME[norm(start)]];
    for (var k = 1; k <= n; k++) out.push(NAME[norm(start + dir * 90 * k)]);
    return out.join(' → ');
  }
  function orderText(dir) {
    return dir > 0 ? '12 → 3 → 6 → 9 → 12' : '12 → 9 → 6 → 3 → 12';
  }

  /* ---------------------------------------------------------------- *
   * The dial
   * ---------------------------------------------------------------- */

  function makeDial(api, opts) {
    opts = opts || {};
    var root = svg('svg', { viewBox: '0 0 320 320', class: 'ts-dial', role: 'img', 'aria-label': 'A dial with an arrow' });
    root.appendChild(svg('circle', { cx: C, cy: C, r: R_FACE, class: 'ts-face' }));
    for (var i = 0; i < 12; i++) {
      var big = i % 3 === 0;
      var a = pt(i * 30, R_FACE - 4);
      var b = pt(i * 30, R_FACE - (big ? 0 : 12));
      if (!big) root.appendChild(svg('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'ts-tick' }));
    }
    var secLayer = svg('g');
    var decoLayer = svg('g');
    var countLayer = svg('g');
    var tgtLayer = svg('g');
    root.appendChild(secLayer);
    root.appendChild(decoLayer);
    root.appendChild(tgtLayer);

    function arrowShape(cls) {
      var g = svg('g', { class: cls });
      g.appendChild(svg('line', { x1: C, y1: C, x2: C, y2: C - L_ARROW + 16 }));
      g.appendChild(svg('polygon', { points: [C, C - L_ARROW, C - 12, C - L_ARROW + 20, C + 12, C - L_ARROW + 20].join(' ') }));
      return g;
    }
    var ghost = arrowShape('ts-ghost');
    ghost.style.display = 'none';
    var arrow = arrowShape('ts-arrow');
    root.appendChild(ghost);
    root.appendChild(arrow);
    root.appendChild(svg('circle', { cx: C, cy: C, r: 9, class: 'ts-hub' }));
    root.appendChild(countLayer);

    var targets = {};
    var picker = null;
    var locked = false;
    [0, 90, 180, 270].forEach(function (deg) {
      var p = pt(deg, R_NUM);
      var g = svg('g', { class: 'ts-tgt', 'data-pos': NAME[deg] });
      g.appendChild(svg('circle', { cx: p.x, cy: p.y, r: R_TGT }));
      g.appendChild(svg('text', { x: p.x, y: p.y + 1 }, NAME[deg]));
      g.addEventListener('click', function () {
        if (!picker || locked || busy) return;
        picker(deg);
      });
      targets[deg] = g;
      tgtLayer.appendChild(g);
    });

    var cap = el('div', { class: 'ts-cap' }, '');
    var box = el('div', { class: 'ts-dialbox' }, root, cap);
    if (opts.small) root.classList.add('ts-dial-sm');

    var busy = false;
    var token = 0;
    var arrowDeg = 0;

    function setArrow(deg) {
      arrowDeg = deg;
      arrow.setAttribute('transform', 'rotate(' + r2(deg) + ' ' + C + ' ' + C + ')');
    }
    function setGhost(deg) {
      if (deg == null) {
        ghost.style.display = 'none';
        return;
      }
      ghost.style.display = '';
      ghost.setAttribute('transform', 'rotate(' + r2(deg) + ' ' + C + ' ' + C + ')');
    }
    function clearMarks() {
      token++;
      busy = false;
      MQ.clear(secLayer);
      MQ.clear(decoLayer);
      MQ.clear(countLayer);
      cap.textContent = '';
    }
    /** Little square for a quarter turn, straight line for a half turn. */
    function decorate(start, s) {
      MQ.clear(decoLayer);
      var n = Math.round(Math.abs(s) / 90);
      var d = s > 0 ? 1 : -1;
      if (n === 1) {
        var q = 18;
        var u1 = pt(start, 1);
        var u2 = pt(start + d * 90, 1);
        var ax = (u1.x - C) * q, ay = (u1.y - C) * q, bx = (u2.x - C) * q, by = (u2.y - C) * q;
        decoLayer.appendChild(svg('polyline', { class: 'ts-sq', points: [C + ax, C + ay, C + ax + bx, C + ay + by, C + bx, C + by].map(r2).join(' ') }));
      } else if (n === 2) {
        var p1 = pt(start, L_ARROW - 4);
        var p2 = pt(start + 180, L_ARROW - 4);
        decoLayer.appendChild(svg('line', { class: 'ts-straight', x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }));
      }
    }
    function addCount(start, dir, k, cls) {
      var p = pt(start + dir * 90 * (k - 0.5), 46);
      var g = svg('g', { class: cls || 'ts-badge' });
      g.appendChild(svg('circle', { cx: p.x, cy: p.y, r: 12 }));
      g.appendChild(svg('text', { x: p.x, y: p.y + 1 }, String(k)));
      countLayer.appendChild(g);
      var e = pt(start + dir * 90 * k, R_SEC);
      secLayer.appendChild(svg('line', { class: 'ts-div', x1: C, y1: C, x2: e.x, y2: e.y }));
    }

    /**
     * Sweep the arrow from `start` by `signed` degrees, one right angle at a time.
     * o: { counts (default true), talk (feedback "1, 2..."), quarterMs, pause, cls, badgeCls,
     *      skip (quarters already done), ghost (default true), decorate (default true) }
     */
    function animateTurn(start, signed, o, done) {
      o = o || {};
      var my = ++token;
      var n = Math.round(Math.abs(signed) / 90);
      var dir = signed > 0 ? 1 : -1;
      var qms = o.quarterMs || 650;
      var pause = o.pause == null ? 320 : o.pause;
      var k = o.skip || 0;
      var sec = svg('path', { class: o.cls || 'ts-sec' });
      secLayer.appendChild(sec);
      if (k) sec.setAttribute('d', sectorPath(start, dir * 90 * k));
      if (o.ghost !== false) setGhost(start);
      busy = true;
      var said = [];
      for (var j = 1; j <= k; j++) said.push(j);
      function step() {
        if (my !== token) return;
        if (k >= n) {
          busy = false;
          if (done) done();
          return;
        }
        var from = start + dir * 90 * k;
        var t0 = Date.now();
        (function frame() {
          if (my !== token) return;
          var p = Math.min(1, (Date.now() - t0) / qms);
          var cur = from + dir * 90 * ease(p);
          setArrow(cur);
          sec.setAttribute('d', sectorPath(start, cur - start));
          if (p < 1) {
            api.later(frame, 16);
            return;
          }
          k++;
          if (o.counts !== false) {
            addCount(start, dir, k, o.badgeCls);
            api.sound('pop');
            said.push(k);
            if (o.talk) api.feedback((o.talkPrefix || '') + 'Count the right angles: ' + said.join(', ') + (k === n ? '.' : '…'), 'info');
          }
          if (o.decorate !== false) decorate(start, dir * 90 * k);
          api.later(step, k >= n ? 0 : pause);
        })();
      }
      step();
    }

    return {
      el: box,
      svg: root,
      cap: function (t) {
        cap.textContent = t || '';
      },
      setArrow: setArrow,
      arrowAt: function () {
        return arrowDeg;
      },
      setGhost: setGhost,
      clearMarks: clearMarks,
      decorate: decorate,
      animateTurn: animateTurn,
      busy: function () {
        return busy;
      },
      onPick: function (fn) {
        picker = fn;
        root.classList.add('ts-pick');
      },
      lock: function () {
        locked = true;
        root.classList.remove('ts-pick');
      },
      unlock: function () {
        locked = false;
        root.classList.add('ts-pick');
      },
      mark: function (deg, kind) {
        var g = targets[norm(deg)];
        g.classList.remove('good', 'bad');
        if (kind) g.classList.add(kind);
      },
      unmarkAll: function () {
        Object.keys(targets).forEach(function (k) {
          targets[k].classList.remove('good', 'bad');
        });
      },
    };
  }

  /** Play several turns one after another (each step counted from 1, second step in gold). */
  function playSteps(api, dial, start, steps, talk, done) {
    var at = start;
    var i = 0;
    function next() {
      if (i >= steps.length) {
        if (done) done();
        return;
      }
      var st = steps[i];
      var from = at;
      at = from + st.dir * 90 * st.n;
      var idx = i;
      i++;
      var multi = steps.length > 1;
      if (idx > 0) dial.clearMarks();
      if (multi) dial.cap((idx ? 'Then, from ' + NAME[norm(from)] + ': ' : 'First: ') + stepText(st));
      dial.animateTurn(
        from,
        st.dir * 90 * st.n,
        {
          cls: idx ? 'ts-sec2' : 'ts-sec',
          badgeCls: idx ? 'ts-badge2' : 'ts-badge',
          talk: talk,
          talkPrefix: multi ? (idx ? 'Second turn. ' : 'First turn. ') : '',
        },
        function () {
          if (talk && !multi) dial.cap(capFor(st.n));
          api.later(next, multi && idx < steps.length - 1 ? 1100 : 0);
        }
      );
    }
    next();
  }

  /* ---------------------------------------------------------------- *
   * Practice deck
   * ---------------------------------------------------------------- */

  function clickQ(start, steps) {
    var end = start;
    steps.forEach(function (s) {
      end += s.dir * 90 * s.n;
    });
    return { type: 'click', start: start, steps: steps, answer: norm(end) };
  }

  function twoStep(avoid) {
    for (;;) {
      var start = U.pick([0, 90, 180, 270]);
      var d1 = U.pick([1, -1]);
      var q = clickQ(start, [
        { n: U.pick([1, 2]), dir: d1, word: 'turn' },
        { n: U.pick([1, 2]), dir: -d1, word: 'turn' },
      ]);
      if (q.steps[0].n === 2 && q.steps[1].n === 2) continue; // would just come home
      if (avoid && (avoid.start === q.start || avoid.answer === q.answer)) continue;
      return q;
    }
  }

  function reverseQ(avoid) {
    for (;;) {
      var start = U.pick([0, 90, 180, 270]);
      var diff = U.pick([90, 180, 270]);
      if (avoid && avoid.diff === diff) continue;
      return { type: 'reverse', start: start, end: norm(start + diff), diff: diff };
    }
  }

  function buildDeck() {
    var d = [];
    // Level 1: start at 12; quarter clockwise, quarter anticlockwise, one half turn.
    U.shuffle([
      { n: 1, dir: 1 },
      { n: 1, dir: -1 },
      { n: 2, dir: U.pick([1, -1]) },
    ]).forEach(function (s) {
      d.push(clickQ(0, [{ n: s.n, dir: s.dir, word: 'turn' }]));
    });
    // Level 2: start at 3, 6 or 9; turns of 1, 2 and 3 right angles, either way.
    var starts = U.shuffle([90, 180, 270]);
    var ns = U.shuffle([1, 2, 3]);
    var words = U.shuffle(['turn', 'ra', U.pick(['turn', 'ra'])]);
    for (var i = 0; i < 3; i++) d.push(clickQ(starts[i], [{ n: ns[i], dir: U.pick([1, -1]), word: words[i] }]));
    // Level 3: a two-step turn, a reverse question, then one more of either.
    var t1 = twoStep();
    var r1 = reverseQ();
    d.push(t1, r1);
    d.push(Math.random() < 0.5 ? twoStep(t1) : reverseQ(r1));
    return d;
  }

  var deck = null;

  /* ---------------------------------------------------------------- *
   * Mistakes
   * ---------------------------------------------------------------- */

  function clickMistake(q, pos, strong) {
    var start = q.start;
    if (q.steps.length === 1) {
      var st = q.steps[0];
      var wrongWay = norm(start - st.dir * 90 * st.n);
      var strongTail = ' Go ' + (st.dir > 0 ? 'clockwise' : 'anticlockwise') + ': ' + orderText(st.dir) + '. Start at ' + NAME[start] + ' and count ' + st.n + (st.n > 1 ? ' jumps.' : ' jump.');
      if (pos === norm(start)) {
        return { tag: 'Did not turn (picked the start)', hint: 'That is where the arrow starts. It has to turn ' + amountWord(st.n, st.word) + '.' + (strong ? strongTail : '') };
      }
      if (st.n === 2) {
        return {
          tag: 'Did not see half turn = two right angles',
          hint: (st.word === 'ra' ? '2 right angles make a half turn. ' : 'A half turn is 2 right angles. ') + 'The arrow ends on the other side, in a straight line.' + (strong ? strongTail : ''),
        };
      }
      if (pos === wrongWay) {
        return {
          tag: 'Turned the wrong way (clockwise mix-up)',
          hint: (st.dir > 0 ? 'Clockwise goes the same way as clock hands.' : 'Anticlockwise goes the opposite way to clock hands.') + (strong ? strongTail : ' Check which way you went.'),
        };
      }
      if (st.n === 1) {
        return { tag: 'Turned too far', hint: 'That is 2 right angles. A quarter turn is just 1 right angle: the next number round.' + (strong ? strongTail : '') };
      }
      // n === 3, picked the opposite side
      return { tag: 'Lost count of right angles', hint: 'That is only 2 right angles. Keep going: you need 3.' + (strong ? strongTail : '') };
    }
    // two steps
    var s1 = q.steps[0];
    var s2 = q.steps[1];
    var mid = norm(start + s1.dir * 90 * s1.n);
    var strong2 = ' First turn: ' + pathText(start, s1.dir, s1.n) + '. Now do the second turn from ' + NAME[mid] + '.';
    if (pos === norm(start)) {
      return { tag: 'Lost count of right angles', hint: 'That is where the arrow starts. Do the first turn, then the second turn.' + (strong ? strong2 : '') };
    }
    if (pos === mid) {
      return { tag: 'Forgot the second turn', hint: 'That is where the first turn ends. Now do the second turn.' + (strong ? strong2 : '') };
    }
    var flip2 = norm(mid - s2.dir * 90 * s2.n);
    var flip1 = norm(start - s1.dir * 90 * s1.n + s2.dir * 90 * s2.n);
    if (pos === flip2 || pos === flip1) {
      return { tag: 'Turned the wrong way (clockwise mix-up)', hint: 'Do one turn at a time and watch the direction of each one. Clockwise is the way clock hands go.' + (strong ? strong2 : '') };
    }
    return { tag: 'Lost count of right angles', hint: 'Do one turn at a time. Count the right angles: a quarter is 1, a half is 2.' + (strong ? strong2 : '') };
  }

  var REV = [
    { v: 'cw1', n: 1, dir: 1 },
    { v: 'acw1', n: 1, dir: -1 },
    { v: 'cw2', n: 2, dir: 1 },
    { v: 'acw2', n: 2, dir: -1 },
    { v: 'cw3', n: 3, dir: 1 },
    { v: 'acw3', n: 3, dir: -1 },
  ];
  function revOpt(v) {
    return REV.filter(function (o) {
      return o.v === v;
    })[0];
  }
  function revWorks(q, o) {
    return norm(q.start + o.dir * 90 * o.n) === q.end;
  }
  function revLabel(o) {
    return ['', 'Quarter turn', 'Half turn', 'Three-quarter turn'][o.n] + '<br><span class="ts-small">' + dirWord(o.dir) + '</span>';
  }
  function revName(o) {
    return ['', 'a quarter turn', 'a half turn', 'a three-quarter turn'][o.n] + ' ' + (o.dir > 0 ? 'clockwise' : 'anticlockwise');
  }

  /* ---------------------------------------------------------------- *
   * Register
   * ---------------------------------------------------------------- */

  MQ.register('turn-spinner', {
    learn: [
      // 1. Clockwise and anticlockwise
      function (stage, api) {
        api.say('Clockwise goes the same way as the clock hands. Press both buttons.');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Which way round?', 'Clock hands go <b>clockwise</b> ' + CW + '. The other way is <b>anticlockwise</b> ' + ACW + '.'));
        var dial = makeDial(api);
        stage.appendChild(dial.el);
        var done = { cw: false, acw: false };
        function spin(dir) {
          dial.clearMarks();
          dial.setArrow(0);
          dial.animateTurn(0, dir * 360, { counts: false, decorate: false, ghost: false, quarterMs: 420, pause: 0 }, function () {
            done[dir > 0 ? 'cw' : 'acw'] = true;
            dial.cap(dir > 0 ? 'Clockwise: 12 → 3 → 6 → 9 → 12' : 'Anticlockwise: 12 → 9 → 6 → 3 → 12');
            api.say(dir > 0 ? 'Clockwise! The same way as the clock hands.' : 'Anticlockwise! The opposite way to the clock hands.', 'happy');
            if (done.cw && done.acw) {
              api.feedback('Well done! You have seen both ways round.', 'good');
              api.unlockNext();
            }
          });
        }
        stage.appendChild(
          el(
            'div',
            { class: 'ts-btns' },
            el('button', { class: 'btn ts-btn', type: 'button', onclick: function () { spin(1); } }, CW + ' Turn clockwise'),
            el('button', { class: 'btn ts-btn ts-btn-alt', type: 'button', onclick: function () { spin(-1); } }, ACW + ' Turn anticlockwise')
          )
        );
      },
      // 2. Quarter turn = right angle
      function (stage, api) {
        api.say('A quarter turn is a right angle. Try both quarter turns.');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Quarter turn', 'A quarter turn makes a <b>right angle</b>. We mark it with a little square.'));
        var dial = makeDial(api);
        stage.appendChild(dial.el);
        var done = { cw: false, acw: false };
        function turn(dir) {
          dial.clearMarks();
          dial.setArrow(0);
          dial.animateTurn(0, dir * 90, { quarterMs: 900 }, function () {
            done[dir > 0 ? 'cw' : 'acw'] = true;
            dial.cap('12 → ' + (dir > 0 ? '3' : '9') + ': a quarter turn ' + (dir > 0 ? 'clockwise' : 'anticlockwise') + ' = a right angle');
            api.say('See the shaded quarter and the little square? That is a right angle.', 'happy');
            if (done.cw && done.acw) {
              api.feedback('Both quarter turns are right angles. One goes to 3, one goes to 9.', 'good');
              api.unlockNext();
            }
          });
        }
        stage.appendChild(
          el(
            'div',
            { class: 'ts-btns' },
            el('button', { class: 'btn ts-btn', type: 'button', onclick: function () { turn(1); } }, CW + ' Quarter turn clockwise'),
            el('button', { class: 'btn ts-btn ts-btn-alt', type: 'button', onclick: function () { turn(-1); } }, ACW + ' Quarter turn anticlockwise')
          )
        );
      },
      // 3. Half and full turns
      function (stage, api) {
        api.say('Two quarter turns make a half turn. Press the button twice.');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Half turn and full turn', '2 right angles make a <b>half turn</b>. 2 half turns make a <b>full turn</b>.'));
        var dial = makeDial(api);
        stage.appendChild(dial.el);
        var halves = 0;
        var btn = el('button', { class: 'btn ts-btn', type: 'button' }, CW + ' Half turn clockwise');
        btn.addEventListener('click', function () {
          if (dial.busy()) return;
          if (halves >= 2) {
            halves = 0;
            dial.clearMarks();
            dial.setArrow(0);
            btn.textContent = CW + ' Half turn clockwise';
            return;
          }
          halves++;
          var h = halves;
          btn.disabled = true;
          dial.animateTurn(0, h * 180, { skip: (h - 1) * 2, quarterMs: 700, talk: true }, function () {
            btn.disabled = false;
            if (h === 1) {
              dial.cap('2 right angles = a half turn: a straight line');
              api.say('Half a turn! The arrow and the start make a straight line.', 'happy');
            } else {
              dial.cap('4 right angles = a full turn: back to the start');
              api.say('A full turn! The arrow is back where it started.', 'cheer');
              api.feedback('Half turn = 2 right angles. Full turn = 4 right angles.', 'good');
              btn.textContent = 'Start again';
              api.unlockNext();
            }
          });
        });
        stage.appendChild(el('div', { class: 'ts-btns' }, btn));
      },
      // 4. Predict, then watch
      function (stage, api) {
        api.lockNext();
        var tasks = [
          { start: 0, n: 1, dir: -1, word: 'turn' },
          { start: 90, n: 2, dir: 1, word: 'turn' },
        ];
        var t = 0;
        var promptEl = MQ.ui.prompt('');
        stage.appendChild(promptEl);
        var dial = makeDial(api);
        stage.appendChild(dial.el);
        function show() {
          var task = tasks[t];
          dial.clearMarks();
          dial.unmarkAll();
          dial.setGhost(null);
          dial.setArrow(task.start);
          dial.unlock();
          promptEl.innerHTML = 'The arrow points to <b>' + NAME[task.start] + '</b>. Turn it <b>' + stepText(task) + '</b>.<br>Click where it will point.';
          api.say('Where will it point? Show me with your finger first, then click the number.', 'think');
        }
        dial.onPick(function (pos) {
          var task = tasks[t];
          var ans = norm(task.start + task.dir * 90 * task.n);
          if (pos !== ans) {
            dial.mark(pos, 'bad');
            api.sound('wrong');
            api.feedback(task.n === 2 ? 'A half turn is 2 right angles. Count 2 numbers round.' : 'Anticlockwise goes the opposite way to clock hands. Try again.', 'try');
            return;
          }
          dial.mark(pos, 'good');
          dial.lock();
          api.sound('correct');
          api.feedback('Yes! Watch it turn.', 'good');
          dial.animateTurn(task.start, task.dir * 90 * task.n, { quarterMs: 700 }, function () {
            dial.cap(capFor(task.n));
            t++;
            if (t < tasks.length) {
              api.later(show, 1500);
            } else {
              api.say('Great predicting! Now let\'s practise.', 'cheer');
              api.feedback('You can predict turns. Press the button to start practising.', 'good');
              api.unlockNext();
            }
          });
        });
        show();
      },
    ],

    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];

        if (q.type === 'click') {
          var two = q.steps.length > 1;
          var html = 'The arrow points to <b>' + NAME[q.start] + '</b>. It turns <b>' + stepText(q.steps[0]) + '</b>' + (two ? ', then <b>' + stepText(q.steps[1]) + '</b>' : '') + '.<br>Where does it point now? Click the number.';
          stage.appendChild(MQ.ui.prompt(html));
          var dial = makeDial(api);
          dial.setArrow(q.start);
          stage.appendChild(dial.el);
          api.say(two ? 'Two turns! Do one turn at a time.' : 'Where will the arrow point? Use your finger first.', 'think');
          dial.onPick(function (pos) {
            if (api.isAnswered()) return;
            if (pos === q.answer) {
              dial.mark(pos, 'good');
              dial.lock();
              api.check(true, two ? 'Yes! One turn at a time gets you there.' : 'Yes! ' + capFor(q.steps[0].n) + '.');
              playSteps(api, dial, q.start, q.steps, false, function () {
                dial.cap(two ? 'It ends at ' + NAME[q.answer] : capFor(q.steps[0].n));
              });
            } else {
              dial.mark(pos, 'bad');
              var m = clickMistake(q, pos, api.tries() >= 1);
              api.check(false, m.hint, m.tag);
            }
          });
          api.onReveal(function () {
            dial.lock();
            dial.unmarkAll();
            dial.mark(q.answer, 'good');
            dial.clearMarks();
            dial.setArrow(q.start);
            playSteps(api, dial, q.start, q.steps, true, function () {
              api.feedback((two ? 'Both turns done: ' : capFor(q.steps[0].n) + '. ') + 'The arrow ends at ' + NAME[q.answer] + '.', 'info');
              if (two) dial.cap('It ends at ' + NAME[q.answer]);
            });
          });
          return;
        }

        // reverse: which turn takes the arrow from start to end?
        stage.appendChild(MQ.ui.prompt('The arrow turned from <b>' + NAME[q.start] + '</b> to <b>' + NAME[q.end] + '</b>. Which turn could it be?'));
        var rdial = makeDial(api, { small: true });
        rdial.setGhost(q.start);
        rdial.setArrow(q.end);
        rdial.cap('Dashed = start · Blue = end');
        api.say('Two different turns work here. Find one!', 'think');
        var good = REV.filter(function (o) {
          return revWorks(q, o);
        });
        var ch = MQ.ui.choices(
          REV.map(function (o) {
            return { label: revLabel(o), value: o.v };
          }),
          function (v) {
            if (api.isAnswered()) return;
            var o = revOpt(v);
            if (revWorks(q, o)) {
              ch.mark(v, 'good');
              ch.disable();
              var other = good.filter(function (g) {
                return g.v !== v;
              })[0];
              api.check(true, 'Yes! ' + revName(other).charAt(0).toUpperCase() + revName(other).slice(1) + ' works too.');
              rdial.clearMarks();
              rdial.setArrow(q.start);
              rdial.animateTurn(q.start, o.dir * 90 * o.n, { quarterMs: 450, pause: 150 }, function () {
                rdial.cap(capFor(o.n));
              });
              return;
            }
            ch.mark(v, 'bad');
            var strong = api.tries() >= 1;
            var tag, hint;
            var sameAmountOtherWay = REV.filter(function (g) {
              return g.n === o.n && g.dir === -o.dir;
            })[0];
            if (q.diff === 180) {
              tag = 'Did not see half turn = two right angles';
              hint = 'The start and end arrows make a straight line. How many right angles is that?';
            } else if (revWorks(q, sameAmountOtherWay)) {
              tag = 'Turned the wrong way (clockwise mix-up)';
              hint = 'Right size of turn, but check the direction. Clockwise is the way clock hands go.';
            } else {
              tag = 'Lost count of right angles';
              hint = 'Count the right angles from the dashed arrow to the blue arrow.';
            }
            if (strong) {
              var cwN = q.diff / 90;
              hint += ' Clockwise: ' + pathText(q.start, 1, cwN) + ' is ' + cwN + ' right angle' + (cwN > 1 ? 's' : '') + '.';
            }
            api.check(false, hint, tag);
          },
          { columns: 2 }
        );
        ch.classList.add('ts-choices');
        stage.appendChild(el('div', { class: 'ts-row' }, rdial.el, ch));
        api.onReveal(function () {
          ch.disable();
          good.forEach(function (g) {
            ch.mark(g.v, 'good');
          });
          var order = good.slice().sort(function (a, b) {
            return a.n - b.n;
          });
          var i = 0;
          function play() {
            if (i >= order.length) {
              api.feedback(revName(order[0]).replace(/^a/, 'A') + ' and ' + revName(order[1]) + ' both go from ' + NAME[q.start] + ' to ' + NAME[q.end] + '.', 'info');
              return;
            }
            var o = order[i];
            i++;
            rdial.clearMarks();
            rdial.setArrow(q.start);
            rdial.animateTurn(q.start, o.dir * 90 * o.n, { talk: true, talkPrefix: revName(o).replace(/^a/, 'A') + '. ' }, function () {
              rdial.cap(revName(o).replace(/^a/, 'A') + ' works');
              api.later(play, 1300);
            });
          }
          play();
        });
      },
    },
  });

  var css = [
    '.ts-dialbox{display:flex;flex-direction:column;align-items:center;gap:4px}',
    '.ts-dial{width:320px;max-width:100%;height:auto;display:block;user-select:none}',
    '.ts-dial-sm{width:290px}',
    '.ts-face{fill:#fff;stroke:#3d4a5c;stroke-width:5}',
    '.ts-tick{stroke:#a7b1bc;stroke-width:2.5;stroke-linecap:round}',
    '.ts-tgt circle{fill:#f4f7fb;stroke:#c8d1dc;stroke-width:2.5}',
    '.ts-tgt text{font-size:26px;font-weight:800;fill:#2b3440;text-anchor:middle;dominant-baseline:middle;pointer-events:none}',
    '.ts-pick .ts-tgt{cursor:pointer}',
    '.ts-pick .ts-tgt circle{stroke-dasharray:6 4}',
    '.ts-pick .ts-tgt:hover circle{stroke:var(--accent);fill:#e6f9f7;stroke-dasharray:none;stroke-width:3.5}',
    '.ts-tgt.good circle{fill:var(--good-bg);stroke:var(--good);stroke-dasharray:none;stroke-width:4}',
    '.ts-tgt.good text{fill:var(--good)}',
    '.ts-tgt.bad circle{fill:var(--try-bg);stroke:var(--try);stroke-dasharray:none;stroke-width:4}',
    '.ts-tgt.bad text{fill:var(--try)}',
    '.ts-sec{fill:#2ec4b6;fill-opacity:.25;stroke:#1a9e92;stroke-width:2}',
    '.ts-sec2{fill:#ffb703;fill-opacity:.3;stroke:#c98a00;stroke-width:2}',
    '.ts-div{stroke:#1a9e92;stroke-width:1.5;stroke-dasharray:3 3}',
    '.ts-arrow line{stroke:#2563eb;stroke-width:9;stroke-linecap:round}',
    '.ts-arrow polygon{fill:#2563eb}',
    '.ts-ghost line{stroke:#8d99a6;stroke-width:6;stroke-dasharray:9 7;stroke-linecap:round}',
    '.ts-ghost polygon{fill:#b6bfc9}',
    '.ts-hub{fill:#2b3440}',
    '.ts-sq{fill:#fff;fill-opacity:.6;stroke:#1d3557;stroke-width:3}',
    '.ts-straight{stroke:#1d3557;stroke-width:4;stroke-linecap:round;opacity:.55}',
    '.ts-badge circle{fill:#1d3557}',
    '.ts-badge2 circle{fill:#b86e00}',
    '.ts-badge text,.ts-badge2 text{fill:#fff;font-size:15px;font-weight:800;text-anchor:middle;dominant-baseline:middle}',
    '.ts-cap{font-size:1.15rem;font-weight:800;min-height:1.5em;text-align:center;color:#1d3557}',
    '.ts-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.ts-btn{font-size:1.1rem;background:#2563eb;color:#fff}',
    '.ts-btn-alt{background:#1d3557}',
    '.ts-row{display:flex;flex-wrap:wrap;gap:18px;justify-content:center;align-items:center;width:100%}',
    '.ts-choices{max-width:420px;flex:1 1 300px}',
    '.ts-choices .choice{font-size:1.05rem;min-height:58px;padding:6px 10px;line-height:1.2}',
    '.ts-small{font-size:.9rem;font-weight:700}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'turn-spinner' }, css));
})();

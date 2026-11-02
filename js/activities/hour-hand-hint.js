/* Hour Hand Hints — estimate the time from the short hand alone, then place the minute hand (Unit 8.1). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  /* ---------------- shared Unit 8 clock (copied from the unit clock reference) ---------------- */
  function hhPoint(cx, cy, d, deg) {
    var a = (deg * Math.PI) / 180;
    return { x: Math.round((cx + d * Math.sin(a)) * 100) / 100, y: Math.round((cy - d * Math.cos(a)) * 100) / 100 };
  }

  function makeClock(o) {
    var r = o.r || 120;
    var pad = o.ring ? 44 : 10;
    var size = 2 * (r + pad);
    var cx = size / 2, cy = size / 2;
    var root = S('svg', { viewBox: '0 0 ' + size + ' ' + size, width: o.width || size, class: 'hh-clock', style: { maxWidth: '100%', height: 'auto' } });
    root.appendChild(S('circle', { cx: cx, cy: cy, r: r, fill: '#fff', stroke: '#1b2a4a', 'stroke-width': 5 }));
    var layer = S('g', { class: 'hh-layer' });
    root.appendChild(layer); // highlights sit on the face, under ticks, numbers and hands
    for (var t = 0; t < 60; t++) {
      var big = t % 5 === 0;
      var p1 = hhPoint(cx, cy, r - 4, t * 6), p2 = hhPoint(cx, cy, r - (big ? 16 : 9), t * 6);
      root.appendChild(S('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: '#1b2a4a', 'stroke-width': big ? 3 : 1.4, 'stroke-linecap': 'round' }));
    }
    for (var n = 1; n <= 12; n++) {
      var q = hhPoint(cx, cy, r * 0.72, n * 30);
      root.appendChild(S('text', { x: q.x, y: q.y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': Math.round(r * 0.19), 'font-weight': 800, fill: '#1b2a4a' }, String(n)));
      if (o.ring) {
        var rq = hhPoint(cx, cy, r + 24, n * 30);
        root.appendChild(S('text', { x: rq.x, y: rq.y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': Math.round(r * 0.14), 'font-weight': 700, fill: '#0b6e66', class: 'hh-ring-num' }, String(n * 5)));
      }
    }
    var hourHand = S('line', { x1: cx, y1: cy, x2: cx, y2: cy - r * 0.5, stroke: '#1b2a4a', 'stroke-width': r * 0.075, 'stroke-linecap': 'round', class: 'hh-hour' });
    var minuteHand = S('line', { x1: cx, y1: cy, x2: cx, y2: cy - r * 0.82, stroke: '#e85d04', 'stroke-width': r * 0.045, 'stroke-linecap': 'round', class: 'hh-minute' });
    root.appendChild(hourHand);
    root.appendChild(minuteHand);
    if (o.showMinute === false) minuteHand.style.display = 'none';
    root.appendChild(S('circle', { cx: cx, cy: cy, r: r * 0.05, fill: '#1b2a4a' }));
    function setHand(line, len, deg) {
      var p = hhPoint(cx, cy, len, deg);
      line.setAttribute('x2', p.x);
      line.setAttribute('y2', p.y);
    }
    var api = {
      svg: root, cx: cx, cy: cy, r: r, layer: layer, hourHand: hourHand, minuteHand: minuteHand,
      setTime: function (h, m) {
        setHand(hourHand, r * 0.5, (h % 12) * 30 + m * 0.5);
        setHand(minuteHand, r * 0.82, m * 6);
      },
      /** the hour hand shows the real time h:m (the clue); records it for the reveal and for tests */
      setHourTime: function (h, m) {
        setHand(hourHand, r * 0.5, (h % 12) * 30 + m * 0.5);
        root.setAttribute('data-h', h);
        root.setAttribute('data-m', m);
      },
      setMinuteAngle: function (deg) { setHand(minuteHand, r * 0.82, deg); },
      showMinute: function (on) { minuteHand.style.display = on ? '' : 'none'; },
      angleOf: function (p) { var a = (Math.atan2(p.x - cx, -(p.y - cy)) * 180) / Math.PI; return (a + 360) % 360; },
    };
    api.setTime(o.hour || 12, o.minute || 0);
    return api;
  }

  function hhDigital(h, m) { return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; }
  function hhNextHour(h) { return h === 12 ? 1 : h + 1; }
  function hhWords(h, m) {
    if (m === 0) return h + " o'clock";
    if (m === 15) return 'quarter past ' + h;
    if (m === 30) return 'half past ' + h;
    if (m === 45) return 'quarter to ' + hhNextHour(h);
    if (m < 30) return m + (m === 1 ? ' minute' : ' minutes') + ' past ' + h;
    var to = 60 - m;
    return to + (to === 1 ? ' minute' : ' minutes') + ' to ' + hhNextHour(h);
  }

  /* ---------------- helpers for this activity ---------------- */

  /** circular distance between two minute positions (0-59) */
  function minDist(a, b) {
    var d = Math.abs((((a - b) % 60) + 60) % 60);
    return Math.min(d, 60 - d);
  }

  /** where the long hand points, as a clock number (0 -> 12) */
  function numberAt(min) { var n = Math.round(min / 5) % 12; return n === 0 ? 12 : n; }

  /** How far the short hand has travelled from h towards the next number, in words. */
  function gapInfo(h, m) {
    var n = hhNextHour(h);
    switch (m) {
      case 0: return { gap: 'right ON the ' + h, rule: "on the number → o'clock", place: 12 };
      case 15: return { gap: 'a quarter of the way from ' + h + ' to ' + n, rule: 'a quarter of the way → quarter past', place: 3 };
      case 30: return { gap: 'halfway from ' + h + ' to ' + n, rule: 'halfway → half past', place: 6 };
      case 45: return { gap: 'three quarters of the way from ' + h + ' to ' + n, rule: 'three quarters of the way → quarter to', place: 9 };
      case 20: return { gap: 'about a third of the way from ' + h + ' to ' + n, rule: 'about a third of the way → about 20 past', place: 4 };
      case 40: return { gap: 'about two thirds of the way from ' + h + ' to ' + n, rule: 'about two thirds of the way → about 20 to', place: 8 };
      default: return { gap: 'nearly on the ' + n, rule: "nearly on the next number → nearly " + n + " o'clock", place: 11 };
    }
  }

  function wedgePath(cx, cy, R, a1, a2) {
    var p1 = hhPoint(cx, cy, R, a1), p2 = hhPoint(cx, cy, R, a2);
    var large = a2 - a1 > 180 ? 1 : 0;
    return 'M' + cx + ' ' + cy + ' L' + p1.x + ' ' + p1.y + ' A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + p2.x + ' ' + p2.y + ' Z';
  }
  function arcPath(cx, cy, R, a1, a2) {
    var p1 = hhPoint(cx, cy, R, a1), p2 = hhPoint(cx, cy, R, a2);
    var large = a2 - a1 > 180 ? 1 : 0;
    return 'M' + p1.x + ' ' + p1.y + ' A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + p2.x + ' ' + p2.y;
  }

  /**
   * Shade the gap between h and the next number (dashed outline), the part of it the hour hand
   * has travelled (gold), and the minutes the long hand has gone round (orange arc on the rim).
   */
  function shade(ck, h, m, opts) {
    opts = opts || {};
    MQ.clear(ck.layer);
    var cx = ck.cx, cy = ck.cy, r = ck.r;
    var a0 = (h % 12) * 30;
    ck.layer.appendChild(S('path', { d: wedgePath(cx, cy, r * 0.93, a0, a0 + 30), class: 'hh-gap' }));
    if (opts.mid) {
      var mp = hhPoint(cx, cy, r * 0.93, a0 + 15);
      ck.layer.appendChild(S('line', { x1: cx, y1: cy, x2: mp.x, y2: mp.y, class: 'hh-midline' }));
    }
    if (m > 0) {
      ck.layer.appendChild(S('path', { d: wedgePath(cx, cy, r * 0.93, a0, a0 + m * 0.5), class: 'hh-went' }));
      if (!opts.noMinutes) ck.layer.appendChild(S('path', { d: arcPath(cx, cy, r - 10, 0, Math.min(m * 6, 359.9)), class: 'hh-minarc' }));
    }
  }

  /**
   * Let the child place the long hand: press anywhere on the face (or drag round it).
   * Snaps to whole minutes. Returns { lock(), set(min), value() }.
   */
  function handDrag(ck, api, cb) {
    var locked = false;
    var value = null;
    var hit = S('circle', { cx: ck.cx, cy: ck.cy, r: ck.r + 14, class: 'hh-hit' });
    ck.svg.appendChild(hit);
    function set(min) {
      value = ((min % 60) + 60) % 60;
      ck.showMinute(true);
      ck.minuteHand.classList.remove('hh-ghost');
      ck.setMinuteAngle(value * 6);
      ck.svg.setAttribute('data-placed', value);
    }
    function fromPoint(p) { return Math.round(ck.angleOf(p) / 6) % 60; }
    var unbind = MQ.ui.drag(ck.svg, hit, {
      start: function (p) { if (locked) return; set(fromPoint(p)); if (cb.move) cb.move(value); },
      move: function (p) { if (locked) return; set(fromPoint(p)); if (cb.move) cb.move(value); },
      end: function (p) { if (locked) return; set(fromPoint(p)); if (cb.end) cb.end(value); },
    });
    api.cleanup(unbind);
    return {
      set: set,
      value: function () { return value; },
      lock: function () { locked = true; hit.style.cursor = 'default'; ck.svg.classList.add('hh-locked'); },
    };
  }

  /** Turn the long hand step by step (the short way round) from one minute to another. */
  function animateMinute(ck, api, from, to, done) {
    var diff = (((to - from) % 60) + 60) % 60;
    var dir = diff <= 30 ? 1 : -1;
    var steps = dir === 1 ? diff : 60 - diff;
    var cur = from;
    ck.showMinute(true);
    ck.minuteHand.classList.remove('hh-ghost');
    function step() {
      if (steps <= 0) { ck.setMinuteAngle(to * 6); if (done) done(); return; }
      cur = (cur + dir + 60) % 60;
      steps--;
      ck.setMinuteAngle(cur * 6);
      api.later(step, 30);
    }
    step();
  }

  /** a start position for the ghost long hand: far from the answer and from the short hand */
  function ghostStart(h, m) {
    var hourMin = ((h % 12) * 30 + m * 0.5) / 6;
    var opts = [];
    for (var s = 0; s < 60; s += 5) if (minDist(s, m) >= 15 && minDist(s, hourMin) >= 8) opts.push(s);
    return opts.length ? U.pick(opts) : (m + 25) % 60;
  }

  function capBox() { return el('div', { class: 'hh-cap', 'aria-live': 'polite' }); }
  function fillCap(cap, h, m, about) {
    var g = gapInfo(h, m);
    MQ.clear(cap);
    cap.appendChild(el('span', { class: 'hh-rule' }, g.rule));
    cap.appendChild(el('span', { class: 'hh-digital' }, hhDigital(h, m)));
    cap.appendChild(el('span', { class: 'hh-words' }, (about ? 'about ' : '') + hhWords(h, m)));
  }

  /* ---------------- diagnosis for a placed long hand ---------------- */
  function diagnose(q, placed, second) {
    var h = q.h, m = q.m, n = hhNextHour(h), g = gapInfo(h, m);
    var hourMin = ((h % 12) * 30 + m * 0.5) / 6;
    var spot = 'Put the long hand on the ' + g.place + '.';
    if (m === 0 && minDist(placed, 30) <= 3)
      return { hint: second ? 'The short hand is right ON the ' + h + ", so it is " + h + " o'clock. " + spot : 'The short hand is right on the ' + h + ', not halfway. Right on a number means o\'clock!', tag: "Mixed up half past and o'clock" };
    if (m === 30 && minDist(placed, 0) <= 3)
      return { hint: second ? 'Halfway means half past. ' + spot : 'Look again: the short hand is halfway between ' + h + ' and ' + n + ', not on a number. Halfway means half past.', tag: "Mixed up half past and o'clock" };
    if (m === 15 && minDist(placed, 45) <= 3)
      return { hint: second ? 'Only a quarter of the way → quarter PAST ' + h + '. ' + spot : 'The short hand has only gone a little way past ' + h + ', a quarter of the way. That is quarter past, not quarter to.', tag: 'Mixed up quarter past and quarter to' };
    if (m === 45 && minDist(placed, 15) <= 3)
      return { hint: second ? 'Three quarters of the way → quarter TO ' + n + '. ' + spot : 'The short hand is nearly at ' + n + ', three quarters of the way. That is quarter to ' + n + ', not quarter past.', tag: 'Mixed up quarter past and quarter to' };
    if (minDist(placed, hourMin) <= 3 && minDist(m, hourMin) > 5)
      return { hint: second ? 'The short hand is ' + g.gap + '. That means ' + g.rule.split('→ ')[1] + '. ' + spot : 'The long hand does not copy the short hand! Look how far the short hand has gone from ' + h + ' towards ' + n + '.', tag: 'Put minute hand where the hour hand points' };
    return { hint: second ? 'The short hand is ' + g.gap + '. That means ' + g.rule.split('→ ')[1] + '. ' + spot : 'Look at the short hand: is it right on a number, a quarter of the way, halfway, or three quarters of the way?', tag: 'Misjudged how far the hour hand had gone' };
  }

  /* ---------------- practice deck ---------------- */
  var deck = null;

  function buildDeck() {
    var hours = U.shuffle(U.range(1, 12));
    var q = [];
    // Level 1 (3): exactly on a number or exactly halfway; at least one of each.
    U.shuffle([0, 30, U.pick([0, 30])]).forEach(function (m) { q.push({ type: 'drag', h: hours.pop(), m: m }); });
    // Level 2 (3): a quarter or three quarters of the way; at least one of each.
    U.shuffle([15, 45, U.pick([15, 45])]).forEach(function (m) { q.push({ type: 'drag', h: hours.pop(), m: m }); });
    // Level 3 (2): about a third / two thirds of the way, then the "nearly on the next number" clock (like 6:54).
    q.push({ type: 'pick', h: hours.pop(), m: U.pick([20, 40]) });
    q.push({ type: 'pick', h: hours.indexOf(6) !== -1 && Math.random() < 0.5 ? 6 : hours.pop(), m: 54 });
    return q;
  }

  /** the three digital options for a "pick" question, with the mistake each wrong one shows */
  function pickOptions(q) {
    var h = q.h, n = hhNextHour(h);
    if (q.m === 54) {
      return [
        { label: hhDigital(h, 55), ok: true },
        { label: hhDigital(n, 55), tag: 'Chose the next hour', hint: 'The short hand has not quite reached ' + n + ' yet, so it is still ' + h + '-something.' },
        { label: hhDigital(h, 5), tag: 'Mixed up past and to', hint: 'The short hand is nearly at ' + n + ', not just past ' + h + '. Nearly all of the hour has gone.' },
      ];
    }
    var other = q.m === 20 ? 40 : 20;
    return [
      { label: hhDigital(h, q.m), ok: true },
      { label: hhDigital(h, other), tag: 'Mixed up past and to', hint: q.m === 20 ? 'The short hand has only gone a little way from ' + h + ', less than halfway. So less than 30 minutes have gone.' : 'The short hand is more than halfway to ' + n + ', so more than 30 minutes have gone.' },
      { label: hhDigital(n, q.m), tag: 'Chose the next hour', hint: 'The short hand has not reached ' + n + ' yet, so the hour is still ' + h + '.' },
    ];
  }

  function practiceDrag(stage, api, q) {
    var h = q.h, m = q.m;
    api.say(api.level === 1 ? 'Is the short hand ON a number, or halfway?' : 'How far has the short hand gone? Place the long hand.', 'think');
    stage.appendChild(MQ.ui.prompt('Where does the <b>long hand</b> go? Drag it or click on the clock.'));
    var ck = makeClock({ r: 120, ring: true, width: 290, hour: h, minute: m });
    ck.setHourTime(h, m);
    var start = ghostStart(h, m);
    ck.setMinuteAngle(start * 6);
    ck.minuteHand.classList.add('hh-ghost');
    ck.svg.setAttribute('data-placed', start);
    ck.svg.setAttribute('data-kind', 'drag');
    var cap = capBox();
    var placed = start;
    var moved = false;
    var hd = handDrag(ck, api, { move: function (v) { placed = v; moved = true; }, end: function (v) { placed = v; moved = true; } });
    var checkBtn = el('button', { class: 'btn btn-check hh-check', type: 'button' }, 'Check');
    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      if (!moved) {
        api.feedback('First drag the long orange hand (or click the clock) to where you think it goes.', 'info');
        return;
      }
      if (minDist(placed, m) <= 2) {
        hd.lock();
        checkBtn.disabled = true;
        shade(ck, h, m);
        fillCap(cap, h, m);
        api.check(true, gapInfo(h, m).rule + '. It is ' + hhWords(h, m) + '!');
      } else {
        var d = diagnose(q, placed, api.tries() >= 1);
        api.check(false, d.hint, d.tag);
      }
    });
    stage.appendChild(el('div', { class: 'hh-wrap' }, ck.svg));
    stage.appendChild(el('div', { class: 'hh-row' }, checkBtn, cap));
    api.onReveal(function () {
      hd.lock();
      checkBtn.disabled = true;
      animateMinute(ck, api, placed, m, function () {
        ck.svg.setAttribute('data-placed', m);
        shade(ck, h, m);
      });
      fillCap(cap, h, m);
      var g = gapInfo(h, m);
      api.feedback('The short hand is ' + g.gap + '. That means ' + g.rule.split('→ ')[1] + ', so the long hand goes on the ' + g.place + '.', 'info');
    });
  }

  function practicePick(stage, api, q) {
    var h = q.h, m = q.m;
    api.say('Only the short hand! Which time is the best guess?', 'think');
    stage.appendChild(MQ.ui.prompt('Choose the <b>best estimate</b> of the time.'));
    var ck = makeClock({ r: 120, ring: true, width: 270, hour: h, minute: m, showMinute: false });
    ck.setHourTime(h, m);
    ck.svg.setAttribute('data-kind', 'pick');
    var cap = capBox();
    var opts = pickOptions(q);
    var correct = opts[0].label;
    var ch = MQ.ui.choices(U.shuffle(opts).map(function (o) { return { label: '<span class="hh-opt">' + o.label + '</span>', value: o.label }; }), function (v) {
      var o = opts.filter(function (x) { return x.label === v; })[0];
      if (o.ok) {
        ch.mark(v, 'good');
        ch.disable();
        shade(ck, h, m, { noMinutes: true });
        api.check(true, m === 54 ? 'Yes! Nearly on ' + hhNextHour(h) + ', but still ' + h + '-something.' : gapInfo(h, m).rule + '. Good estimate!');
      } else {
        ch.mark(v, 'bad');
        var hint = o.hint;
        if (api.tries() >= 1) hint += ' The short hand is ' + gapInfo(h, m).gap + '.';
        api.check(false, hint, o.tag);
      }
    }, { columns: 3 });
    stage.appendChild(el('div', { class: 'hh-wrap' }, ck.svg));
    stage.appendChild(ch);
    stage.appendChild(cap);
    api.onReveal(function () {
      ch.mark(correct, 'good');
      ch.disable();
      animateMinute(ck, api, 0, m, function () { shade(ck, h, m); });
      fillCap(cap, h, m);
      if (m === 54) api.feedback('At ' + h + ':54 the short hand is nearly on ' + hhNextHour(h) + ', but it has not got there yet. So it is still ' + h + '-something: about ' + correct + '.', 'info');
      else api.feedback('The short hand is ' + gapInfo(h, m).gap + '. That means ' + gapInfo(h, m).rule.split('→ ')[1] + ': ' + correct + '.', 'info');
    });
  }

  /* ---------------- learn screens ---------------- */

  // 1. Hour hand exactly on 4 -> the long hand goes to 12.
  function learnOnTheNumber(stage, api) {
    api.say('The short hand points right at 4. Where does the long hand go? Drag it!', 'think');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Right on a number', 'Short dark hand = hours. Long orange hand = minutes.'));
    var ck = makeClock({ r: 120, ring: true, width: 290, hour: 4, minute: 0 });
    ck.setHourTime(4, 0);
    ck.setMinuteAngle(40 * 6);
    ck.minuteHand.classList.add('hh-ghost');
    ck.svg.setAttribute('data-placed', 40);
    var cap = capBox();
    var wrong = 0;
    var hd = handDrag(ck, api, {
      end: function (v) {
        if (minDist(v, 0) <= 5) {
          hd.set(0);
          hd.lock();
          shade(ck, 4, 0);
          fillCap(cap, 4, 0);
          api.sound('correct');
          api.say("Yes! Right ON the 4 means 4 o'clock. The long hand is at the top, on the 12.", 'cheer');
          api.feedback("Short hand right on a number → o'clock → long hand on the 12.", 'good');
          api.unlockNext();
          return;
        }
        wrong++;
        api.sound('wrong');
        if (minDist(v, 20) <= 3) api.feedback('The long hand does not copy the short hand. Right on the 4 means no minutes have gone yet.', 'try');
        else if (wrong >= 2) api.feedback('Try the very top of the clock, at the 12.', 'try');
        else api.feedback("The short hand is right on a number, so it is o'clock. Where is the long hand at o'clock?", 'try');
      },
    });
    stage.appendChild(el('div', { class: 'hh-wrap' }, ck.svg));
    stage.appendChild(cap);
  }

  // 2. The hour hand slides from 8 to 9; stop it halfway.
  function learnHalfway(stage, api) {
    api.say('Watch the short hand walk from 8 to 9. Press Stop when it is halfway!', 'think');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Halfway', 'Press <b>Stop</b> when the short hand is halfway between 8 and 9.'));
    var ck = makeClock({ r: 120, ring: true, width: 290, hour: 8, minute: 0 });
    ck.setHourTime(8, 0);
    ck.svg.setAttribute('data-placed', 0);
    shade(ck, 8, 0, { mid: true, noMinutes: true });
    var cap = capBox();
    var m = 0, running = false, done = false, timer = 0;
    var btn = el('button', { class: 'btn btn-check hh-go', type: 'button' }, 'Start ▶');
    function tick(id) {
      if (!running || id !== timer) return;
      m++;
      ck.setTime(8, m);
      ck.setHourTime(8, m);
      ck.svg.setAttribute('data-placed', m % 60);
      shade(ck, 8, m, { mid: true, noMinutes: true });
      if (m >= 60) {
        running = false;
        api.say('It got all the way to 9! Let\'s try again.', 'oops');
        api.feedback('Press Stop when the short hand is halfway, on the dashed line.', 'try');
        btn.textContent = 'Try again ↺';
        return;
      }
      api.later(function () { tick(id); }, 200);
    }
    btn.addEventListener('click', function () {
      if (done) return;
      if (!running) {
        m = 0;
        timer++;
        running = true;
        MQ.clear(cap);
        api.feedback('', 'info');
        ck.setTime(8, 0);
        ck.setHourTime(8, 0);
        shade(ck, 8, 0, { mid: true, noMinutes: true });
        btn.textContent = 'Stop ■';
        var id = timer;
        api.later(function () { tick(id); }, 200);
        return;
      }
      running = false;
      if (Math.abs(m - 30) <= 3) {
        done = true;
        btn.disabled = true;
        ck.setTime(8, 30);
        ck.setHourTime(8, 30);
        ck.svg.setAttribute('data-placed', 30);
        shade(ck, 8, 30);
        fillCap(cap, 8, 30);
        api.sound('correct');
        api.say('Great stop! Halfway from 8 to 9, the long hand is on the 6. Half past 8!', 'cheer');
        api.feedback('Short hand halfway → long hand on the 6 → half past 8 (08:30).', 'good');
        api.unlockNext();
      } else {
        api.sound('wrong');
        api.say(m < 30 ? 'Too soon! The short hand had only gone a little way.' : 'Too late! The short hand was nearer to 9.', 'oops');
        api.feedback('Halfway is the dashed line, right in the middle of 8 and 9. Try again!', 'try');
        btn.textContent = 'Try again ↺';
      }
    });
    stage.appendChild(el('div', { class: 'hh-wrap' }, ck.svg));
    stage.appendChild(el('div', { class: 'hh-row' }, btn, cap));
  }

  // 3. Three quarters of the way from 12 to 1 -> about quarter to 1 (43-47 minutes accepted).
  function learnThreeQuarters(stage, api) {
    api.say('Now the short hand is three quarters of the way from 12 to 1. Where does the long hand go?', 'think');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Three quarters of the way', 'The short hand is <b>nearly</b> at 1. Drag the long hand.'));
    var ck = makeClock({ r: 120, ring: true, width: 290, hour: 12, minute: 45 });
    ck.setHourTime(12, 45);
    ck.setMinuteAngle(25 * 6);
    ck.minuteHand.classList.add('hh-ghost');
    ck.svg.setAttribute('data-placed', 25);
    var cap = capBox();
    var wrong = 0;
    var hd = handDrag(ck, api, {
      end: function (v) {
        if (v >= 43 && v <= 47) {
          hd.lock();
          shade(ck, 12, 45);
          fillCap(cap, 12, 45, true);
          api.sound('correct');
          api.say('Yes! About quarter to 1 is a good estimate. Anything from 43 to 47 minutes past 12 is fine.', 'cheer');
          api.feedback('Three quarters of the way → long hand near the 9 → about quarter to 1.', 'good');
          api.unlockNext();
          return;
        }
        wrong++;
        api.sound('wrong');
        if (minDist(v, 15) <= 3) api.feedback('That is quarter PAST. The short hand is nearly at 1, so it is quarter TO 1.', 'try');
        else if (minDist(v, 4) <= 3) api.feedback('The long hand does not copy the short hand. Three quarters of the hour have gone.', 'try');
        else if (wrong >= 2) api.feedback('Three quarters of the way round is the 9. Put the long hand there.', 'try');
        else api.feedback('The short hand has gone three quarters of the way. The long hand goes three quarters of the way round.', 'try');
      },
    });
    stage.appendChild(el('div', { class: 'hh-wrap' }, ck.svg));
    stage.appendChild(cap);
  }

  MQ.register('hour-hand-hint', {
    learn: [learnOnTheNumber, learnHalfway, learnThreeQuarters],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'drag') practiceDrag(stage, api, q);
        else practicePick(stage, api, q);
      },
    },
  });

  var css = [
    '.hh-wrap{display:flex;justify-content:center;width:100%}',
    '.hh-clock{display:block;user-select:none;-webkit-user-select:none}',
    '.hh-hit{fill:rgba(0,0,0,0);cursor:pointer}',
    '.hh-locked .hh-hit{cursor:default}',
    '.hh-ghost{opacity:.45;stroke-dasharray:10 7}',
    '.hh-gap{fill:none;stroke:#b08900;stroke-width:2;stroke-dasharray:6 5}',
    '.hh-went{fill:#ffd166;fill-opacity:.6;stroke:none}',
    '.hh-midline{stroke:#b08900;stroke-width:2.5;stroke-dasharray:5 5}',
    '.hh-minarc{fill:none;stroke:#e85d04;stroke-opacity:.35;stroke-width:12;stroke-linecap:round}',
    '.hh-row{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap}',
    '.hh-cap{display:flex;align-items:center;justify-content:center;gap:10px;flex-wrap:wrap;min-height:46px}',
    '.hh-cap:empty{display:none}',
    '.hh-rule{font-weight:800;font-size:1.1rem;background:#fff3c4;border:2px solid #f2c94c;border-radius:12px;padding:4px 12px}',
    '.hh-digital{font-family:"Courier New",monospace;font-weight:800;font-size:1.7rem;background:#1b2a4a;color:#7CFC9A;border-radius:12px;padding:2px 12px;letter-spacing:2px}',
    '.hh-words{font-weight:800;font-size:1.2rem;color:#0b6e66}',
    '.hh-opt{font-family:"Courier New",monospace;font-weight:800;font-size:1.7rem;letter-spacing:2px}',
    '.stage-practice .choices .hh-opt{display:inline-block}',
    '.hh-go,.hh-check{min-width:130px;font-size:1.15rem}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'hour-hand-hint' }, css));
})();

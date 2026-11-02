/* Set the Clock — drag the hands to show a time, move one hour on, and find times inside a window (Unit 8.1). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  /* ---------------- shared Unit 8 clock (copied from the unit clock reference) ---------------- */
  function stcPoint(cx, cy, d, deg) {
    var a = (deg * Math.PI) / 180;
    return { x: Math.round((cx + d * Math.sin(a)) * 100) / 100, y: Math.round((cy - d * Math.cos(a)) * 100) / 100 };
  }

  function makeClock(o) {
    var r = o.r || 120;
    var pad = o.ring ? 44 : 10;
    var size = 2 * (r + pad);
    var cx = size / 2, cy = size / 2;
    var root = S('svg', { viewBox: '0 0 ' + size + ' ' + size, width: o.width || size, class: 'stc-clock', style: { maxWidth: '100%', height: 'auto' } });
    root.appendChild(S('circle', { cx: cx, cy: cy, r: r, fill: '#fff', stroke: '#1b2a4a', 'stroke-width': 5 }));
    var layer = S('g', { class: 'stc-layer' });
    root.appendChild(layer); // highlights sit on the face, under ticks, numbers and hands
    for (var t = 0; t < 60; t++) {
      var big = t % 5 === 0;
      var p1 = stcPoint(cx, cy, r - 4, t * 6), p2 = stcPoint(cx, cy, r - (big ? 16 : 9), t * 6);
      root.appendChild(S('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: '#1b2a4a', 'stroke-width': big ? 3 : 1.4, 'stroke-linecap': 'round' }));
    }
    for (var n = 1; n <= 12; n++) {
      var q = stcPoint(cx, cy, r * 0.72, n * 30);
      root.appendChild(S('text', { x: q.x, y: q.y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': Math.round(r * 0.19), 'font-weight': 800, fill: '#1b2a4a' }, String(n)));
      if (o.ring) {
        var rq = stcPoint(cx, cy, r + 24, n * 30);
        root.appendChild(S('text', { x: rq.x, y: rq.y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': Math.round(r * 0.14), 'font-weight': 700, fill: '#0b6e66', class: 'stc-ring-num' }, String(n * 5)));
      }
    }
    var hourHand = S('line', { x1: cx, y1: cy, x2: cx, y2: cy - r * 0.5, stroke: '#1b2a4a', 'stroke-width': r * 0.075, 'stroke-linecap': 'round', class: 'stc-hour' });
    var minuteHand = S('line', { x1: cx, y1: cy, x2: cx, y2: cy - r * 0.82, stroke: '#e85d04', 'stroke-width': r * 0.045, 'stroke-linecap': 'round', class: 'stc-minute' });
    root.appendChild(hourHand);
    root.appendChild(minuteHand);
    root.appendChild(S('circle', { cx: cx, cy: cy, r: r * 0.05, fill: '#1b2a4a' }));
    function setHand(line, len, deg) {
      var p = stcPoint(cx, cy, len, deg);
      line.setAttribute('x2', p.x);
      line.setAttribute('y2', p.y);
    }
    var api = {
      svg: root, cx: cx, cy: cy, r: r, layer: layer, hourHand: hourHand, minuteHand: minuteHand,
      setTime: function (h, m) {
        setHand(hourHand, r * 0.5, (h % 12) * 30 + m * 0.5);
        setHand(minuteHand, r * 0.82, m * 6);
        root.setAttribute('data-h', h);
        root.setAttribute('data-m', m);
      },
      angleOf: function (p) { var a = (Math.atan2(p.x - cx, -(p.y - cy)) * 180) / Math.PI; return (a + 360) % 360; },
    };
    api.setTime(o.hour || 12, o.minute || 0);
    return api;
  }

  function stcDigital(h, m) { return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m; }
  function stcNextHour(h) { return h === 12 ? 1 : h + 1; }
  function stcWords(h, m) {
    if (m === 0) return h + " o'clock";
    if (m === 15) return 'quarter past ' + h;
    if (m === 30) return 'half past ' + h;
    if (m === 45) return 'quarter to ' + stcNextHour(h);
    if (m < 30) return m + (m === 1 ? ' minute' : ' minutes') + ' past ' + h;
    var to = 60 - m;
    return to + (to === 1 ? ' minute' : ' minutes') + ' to ' + stcNextHour(h);
  }

  /* ---------------- small helpers ---------------- */
  // A clock time is held as T = minutes after 12:00 on a 12-hour dial (0..719).
  function norm(T) { return ((T % 720) + 720) % 720; }
  function hourOf(T) { var h = Math.floor(norm(T) / 60); return h === 0 ? 12 : h; }
  function minOf(T) { return norm(T) % 60; }
  function toT(h, m) { return norm((h % 12) * 60 + m); }
  /** minutes since midnight-ish for the timeline (no 12 o'clock crossing in this activity's windows) */
  function dayT(h, m) { return h * 60 + m; }
  /** signed shortest difference b - a on a circle of size n */
  function sdiff(a, b, n) { var d = ((((b - a) % n) + n) % n); return d > n / 2 ? d - n : d; }
  function digitalBox(text, cls) { return el('span', { class: 'stc-digital' + (cls ? ' ' + cls : '') }, text); }

  /** where the short hand sits, in words */
  function hourPos(h, m) {
    var n = stcNextHour(h);
    if (m === 0) return 'right on the ' + h;
    if (m <= 10) return 'just past the ' + h;
    if (m < 25) return 'a little way past the ' + h;
    if (m <= 35) return 'about halfway from ' + h + ' to ' + n;
    if (m < 50) return 'more than halfway to ' + n + ', still ' + h + '-something';
    return 'nearly at the ' + n + ', but still ' + h + '-something';
  }

  /** "5, 10, 15, 20 then 21, 22, 23" as chips + words */
  function minuteWorking(m) {
    var row = el('div', { class: 'stc-work' });
    var fives = [], ones = [];
    for (var f = 5; f <= m; f += 5) fives.push(f);
    var base = fives.length ? fives[fives.length - 1] : 0;
    for (var o = base + 1; o <= m; o++) ones.push(o);
    if (m === 0) {
      row.appendChild(el('span', { class: 'chip stc-chip5' }, "on the 12 → o'clock"));
      return { el: row, text: "the long hand is on the 12 (o'clock)" };
    }
    fives.forEach(function (v) { row.appendChild(el('span', { class: 'chip stc-chip5' }, String(v))); });
    if (fives.length && ones.length) row.appendChild(el('span', { class: 'stc-then' }, 'then'));
    ones.forEach(function (v) { row.appendChild(el('span', { class: 'chip stc-chip1' }, String(v))); });
    var text = 'count the long hand ' + (fives.length ? 'in 5s: ' + fives.join(', ') : '') + (fives.length && ones.length ? ', then in 1s: ' : ones.length ? 'in 1s: ' : '') + ones.join(', ') + ' → ' + m + ' minutes';
    return { el: row, text: text };
  }

  function arcPath(cx, cy, R, a1, a2) {
    var p1 = stcPoint(cx, cy, R, a1), p2 = stcPoint(cx, cy, R, a2);
    var large = a2 - a1 > 180 ? 1 : 0;
    return 'M' + p1.x + ' ' + p1.y + ' A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + p2.x + ' ' + p2.y;
  }
  function wedgePath(cx, cy, R, a1, a2) {
    var p1 = stcPoint(cx, cy, R, a1), p2 = stcPoint(cx, cy, R, a2);
    var large = a2 - a1 > 180 ? 1 : 0;
    return 'M' + cx + ' ' + cy + ' L' + p1.x + ' ' + p1.y + ' A' + R + ' ' + R + ' 0 ' + large + ' 1 ' + p2.x + ' ' + p2.y + ' Z';
  }
  /** orange arc for the minutes gone + gold wedge for how far the short hand has gone */
  function showWorkOnClock(ck, h, m) {
    MQ.clear(ck.layer);
    ck.svg.classList.add('stc-ring-on');
    var a0 = (h % 12) * 30;
    if (m > 0) {
      ck.layer.appendChild(S('path', { d: wedgePath(ck.cx, ck.cy, ck.r * 0.6, a0, a0 + m * 0.5), class: 'stc-went' }));
      ck.layer.appendChild(S('path', { d: arcPath(ck.cx, ck.cy, ck.r - 10, 0, Math.min(m * 6, 359.9)), class: 'stc-minarc' }));
    }
    for (var f = 5; f <= m; f += 5) {
      var p = stcPoint(ck.cx, ck.cy, ck.r - 10, f * 6);
      ck.layer.appendChild(S('circle', { cx: p.x, cy: p.y, r: 6, class: 'stc-jumpdot' }));
    }
  }

  /* ---------------- a clock whose hands move together ---------------- */
  /**
   * opts: { h, m, width, onChange(h, m, T), onEnd(h, m, T), buttons: true }
   * Dragging the long hand round past 12 changes the hour (both ways). A press away from the
   * long hand jumps it there in the same hour. Buttons: ◀ hour / hour ▶ / −1 min / +1 min.
   */
  function setClock(api, opts) {
    var ck = makeClock({ r: 120, ring: true, width: opts.width || 290, hour: opts.h, minute: opts.m });
    var T = toT(opts.h, opts.m), startT = T, goal = T, token = 0, locked = false;
    var hit = S('circle', { cx: ck.cx, cy: ck.cy, r: ck.r + 14, class: 'stc-hit' });
    ck.svg.appendChild(hit);
    function render() {
      var h = hourOf(T), m = minOf(T);
      ck.setTime(h, m);
      if (opts.onChange) opts.onChange(h, m, T);
    }
    function fromPoint(p) { return Math.round(ck.angleOf(p) / 6) % 60; }
    var unbind = MQ.ui.drag(ck.svg, hit, {
      start: function (p) {
        if (locked) return;
        token++;
        var pm = fromPoint(p), d = sdiff(minOf(T), pm, 60);
        if (Math.abs(d) > 4) T = norm(Math.floor(T / 60) * 60 + pm); // press elsewhere: jump, same hour
        goal = T;
        render();
      },
      move: function (p) {
        if (locked) return;
        T = norm(T + sdiff(minOf(T), fromPoint(p), 60)); // passing 12 rolls the hour on or back
        goal = T;
        render();
      },
      end: function () {
        if (locked) return;
        if (opts.onEnd) opts.onEnd(hourOf(T), minOf(T), T);
      },
    });
    api.cleanup(unbind);

    function animateTo(target, done, frames) {
      goal = norm(target);
      var my = ++token;
      var total = Math.abs(sdiff(T, goal, 720));
      var step = Math.max(1, Math.ceil(total / (frames || 36)));
      function loop() {
        if (my !== token) return;
        var d = sdiff(T, goal, 720);
        if (d === 0) { render(); if (done) done(); return; }
        T = norm(T + (d > 0 ? Math.min(step, d) : Math.max(-step, d)));
        render();
        api.later(loop, 25);
      }
      loop();
    }

    var ctl = null, btns = [];
    if (opts.buttons) {
      var mk = function (label, title, fn) {
        var b = el('button', { class: 'btn stc-ctl', type: 'button', title: title }, label);
        b.addEventListener('click', function () { if (!locked) fn(); });
        btns.push(b);
        return b;
      };
      ctl = el('div', { class: 'stc-ctls' },
        mk('◀ hour', 'Move the short hand back one hour', function () { animateTo(goal - 60, after); }),
        mk('hour ▶', 'Move the short hand on one hour', function () { animateTo(goal + 60, after); }),
        mk('− 1 min', 'Long hand back one minute', function () { token++; T = norm(T - 1); goal = T; render(); after(); }),
        mk('+ 1 min', 'Long hand on one minute', function () { token++; T = norm(T + 1); goal = T; render(); after(); })
      );
    }
    function after() { if (opts.onEnd) opts.onEnd(hourOf(T), minOf(T), T); }
    render();
    return {
      ck: ck,
      ctl: ctl,
      h: function () { return hourOf(goal); },
      m: function () { return minOf(goal); },
      T: function () { return goal; },
      moved: function () { return goal !== startT; },
      animateTo: animateTo,
      lock: function () {
        locked = true;
        ck.svg.classList.add('stc-locked');
        btns.forEach(function (b) { b.disabled = true; });
      },
    };
  }

  /* ---------------- day timeline strip ---------------- */
  function makeTimeline(fromH, toH, a, b, opts) {
    opts = opts || {};
    var W = 640, H = 136, pad = 40, yb0 = 26, yb1 = 64;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, class: 'stc-timeline', style: { maxWidth: '100%', height: 'auto' } });
    function x(t) { return pad + ((t - fromH * 60) / ((toH - fromH) * 60)) * (W - 2 * pad); }
    root.appendChild(S('rect', { x: pad, y: yb0, width: W - 2 * pad, height: yb1 - yb0, rx: 6, class: 'stc-tl-bg' }));
    root.appendChild(S('rect', { x: x(a), y: yb0, width: x(b) - x(a), height: yb1 - yb0, class: 'stc-tl-band' }));
    root.appendChild(S('line', { x1: x(a), y1: yb0 - 4, x2: x(a), y2: yb1, class: 'stc-tl-edge' }));
    root.appendChild(S('line', { x1: x(b), y1: yb0 - 4, x2: x(b), y2: yb1, class: 'stc-tl-edge' }));
    root.appendChild(S('text', { x: x(a), y: 16, 'text-anchor': 'middle', class: 'stc-tl-endlab' }, stcDigital(Math.floor(a / 60), a % 60)));
    root.appendChild(S('text', { x: x(b), y: 16, 'text-anchor': 'middle', class: 'stc-tl-endlab' }, stcDigital(Math.floor(b / 60), b % 60)));
    for (var t = fromH * 60; t <= toH * 60; t += 30) {
      var full = t % 60 === 0;
      root.appendChild(S('line', { x1: x(t), y1: yb1, x2: x(t), y2: yb1 + (full ? 10 : 5), class: 'stc-tl-tick' }));
      if (full) root.appendChild(S('text', { x: x(t), y: yb1 + 26, 'text-anchor': 'middle', class: 'stc-tl-hour' }, (t / 60) + " o'clock"));
    }
    var marks = S('g');
    root.appendChild(marks);
    var live = null;
    var n = 0;
    function pin(t, label, cls, row) {
      var g = S('g', { class: 'stc-pin ' + (cls || '') });
      var xx = x(t), ly = row ? 126 : 104;
      g.appendChild(S('line', { x1: xx, y1: yb0, x2: xx, y2: ly - 12, class: 'stc-pin-line' }));
      g.appendChild(S('circle', { cx: xx, cy: (yb0 + yb1) / 2, r: 7, class: 'stc-pin-dot' }));
      if (label) {
        g.appendChild(S('rect', { x: xx - 27, y: ly - 13, width: 54, height: 19, rx: 6, class: 'stc-pin-lab-bg' }));
        g.appendChild(S('text', { x: xx, y: ly + 1, 'text-anchor': 'middle', class: 'stc-pin-lab' }, label));
      }
      return g;
    }
    return {
      svg: root,
      mark: function (t, label, cls) { marks.appendChild(pin(t, label, cls, n++ % 2)); },
      live: function (t, label) {
        if (live) live.remove();
        live = null;
        if (t < fromH * 60 || t > toH * 60) return;
        live = pin(t, label, 'stc-pin-live', 0);
        root.appendChild(live);
      },
    };
  }

  function inWindow(t, a, b) { return t > a && t < b; }
  /** why a time is inside or outside the window a..b (both ends NOT counted) */
  function windowWhy(h, m, a, b) {
    var t = dayT(h, m), d = stcDigital(h, m), A = stcDigital(Math.floor(a / 60), a % 60), B = stcDigital(Math.floor(b / 60), b % 60);
    if (t === a || t === b) return d + ' is exactly on the edge, so it is not between.';
    if (t < a) return d + ' is ' + (a - t) + (a - t === 1 ? ' minute' : ' minutes') + ' before ' + A + '. Too early: outside.';
    if (t > b) return d + ' is ' + (t - b) + (t - b === 1 ? ' minute' : ' minutes') + ' after ' + B + '. Too late: outside.';
    var extra = m >= 40 ? ' The short hand is nearly at ' + stcNextHour(h) + ', but it is still ' + h + '-something.' : '';
    return d + ' is after ' + A + ' and before ' + B + ': inside!' + extra;
  }

  /* ---------------- typed time box ---------------- */
  function timeInput(onSubmit) {
    var input = el('input', { class: 'num-input stc-tin', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Type a time', placeholder: '_ _:_ _' });
    var btn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    function go() {
      if (input.disabled) return;
      var raw = input.value.trim(), mm;
      var p = null;
      if ((mm = raw.match(/^(\d{1,2})\s*[:.]\s*(\d{2})$/)) || (mm = raw.match(/^(\d{1,2})(\d{2})$/))) p = { h: +mm[1], m: +mm[2] };
      onSubmit(p, raw);
    }
    btn.addEventListener('click', go);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); go(); } });
    return {
      el: el('div', { class: 'num-row' }, input, btn),
      input: input,
      disable: function () { input.disabled = true; btn.disabled = true; },
      setValue: function (v) { input.value = v; },
      focus: function () { try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); } },
    };
  }
  var FORMAT_MSG = 'Type the time like 8:30: the hour, then a colon (:), then two digits for the minutes.';

  /* ---------------- learn screens ---------------- */

  // 1. Drag the long hand round once: the short hand creeps from 7 to 8.
  function learnTogether(stage, api) {
    api.say('Drag the long orange hand all the way round. Watch the short hand!', 'think');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Both hands move together', 'Drag the <b>long hand</b> round once, starting at 12.'));
    var live = digitalBox('07:00');
    var said = {};
    var done = false;
    var sc = setClock(api, {
      h: 7, m: 0, width: 280,
      onChange: function (h, m, T) {
        live.textContent = stcDigital(h, m);
        // gold wedge: how far the short hand has crept from 7
        if (!sc) return;
        MQ.clear(sc.ck.layer);
        var gone = T - 420;
        if (gone > 0 && gone <= 60) sc.ck.layer.appendChild(S('path', { d: wedgePath(sc.ck.cx, sc.ck.cy, sc.ck.r * 0.6, 210, 210 + gone * 0.5), class: 'stc-went' }));
        if (done) return;
        if (T < 420 && !said.back) { said.back = true; api.feedback('That way goes back in time! Go round the way the numbers count: 1, 2, 3 …', 'try'); }
        if (T >= 435 && T < 450 && !said.q) { said.q = true; api.say('Quarter past 7. The short hand moved a little bit!', 'happy'); }
        if (T >= 450 && T < 470 && !said.h) { said.h = true; api.say('Half past 7. The short hand is halfway to 8!', 'happy'); }
        if (T >= 480 && T < 540) {
          done = true;
          sc.lock();
          api.sound('correct');
          api.say("Round once: one hour! The short hand went from 7 to 8. 8 o'clock!", 'cheer');
          api.feedback('The long hand goes all the way round → the short hand moves on ONE number.', 'good');
          api.unlockNext();
        }
      },
    });
    stage.appendChild(el('div', { class: 'stc-row' }, sc.ck.svg, el('div', { class: 'stc-side' }, el('div', { class: 'stc-lab' }, 'The clock says'), live, el('p', { class: 'stc-note' }, 'Long orange hand = minutes.<br>Short dark hand = hours.'))));
  }

  // 2. Everyday routine card: set it, then predict 1 hour later.
  var ROUTINES = [
    { icon: '🥣', what: 'Breakfast', h: 7, m: 15, when: 'morning' },
    { icon: '🚌', what: 'School bus', h: 8, m: 5, when: 'morning' },
    { icon: '🛏️', what: 'Bedtime', h: 8, m: 30, when: 'evening' },
  ];
  function learnRoutine(stage, api) {
    var r = U.pick(ROUTINES);
    var target = stcDigital(r.h, r.m);
    api.say('Set the clock to ' + target + '. Drag the long hand.', 'think');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('My day', 'Drag the long hand to show the time on the card.'));
    var card = el('div', { class: 'stc-card' },
      el('div', { class: 'stc-card-icon' }, r.icon),
      el('div', { class: 'stc-card-what' }, r.what),
      digitalBox(target),
      el('div', { class: 'stc-when stc-when-' + r.when }, (r.when === 'morning' ? '☀️ ' : '🌙 ') + r.when));
    var live = digitalBox(stcDigital(r.h, 0), 'stc-small');
    var side = el('div', { class: 'stc-side' }, card, el('div', { class: 'stc-lab' }, 'Your clock'), live);
    var set = false;
    var sc = setClock(api, {
      h: r.h, m: 0, width: 280,
      onChange: function (h, m) { live.textContent = stcDigital(h, m); },
      onEnd: function (h, m) {
        if (set) return;
        if (h === r.h && m === r.m) {
          set = true;
          sc.lock();
          api.sound('correct');
          api.say('Yes, ' + target + '! Now: what time is it 1 hour later?', 'cheer');
          api.feedback(target + ' = ' + stcWords(r.h, r.m) + '.', 'good');
          side.appendChild(laterBtn);
        } else if (h !== r.h) {
          api.feedback('The short hand moved to ' + h + '. Turn the long hand back so it is ' + r.h + '-something again.', 'try');
        } else if (m === r.h * 5 % 60 && r.m !== m) {
          api.feedback('The long hand shows minutes. Count in 5s from the 12 to ' + r.m + '.', 'try');
        } else {
          api.feedback('The clock says ' + stcDigital(h, m) + '. We want ' + target + '. Count in 5s: 5, 10, 15 …', 'try');
        }
      },
    });
    var nh = stcNextHour(r.h);
    var laterBtn = el('button', { class: 'btn btn-check', type: 'button' }, '1 hour later ⏩');
    laterBtn.addEventListener('click', function () {
      laterBtn.remove();
      var opts = U.shuffle([stcDigital(nh, r.m), stcDigital(r.h, r.m + 1), stcDigital(stcNextHour(nh), r.m)]);
      side.appendChild(el('div', { class: 'stc-lab' }, 'Guess first: 1 hour later it will be …'));
      var ch = MQ.ui.choices(opts.map(function (o) { return { label: '<span class="stc-opt">' + o + '</span>', value: o }; }), function (v) {
        if (v === stcDigital(nh, r.m)) {
          ch.mark(v, 'good');
          ch.disable();
          api.say('Watch the hands…', 'think');
          sc.animateTo(toT(nh, r.m), function () {
            showWorkOnClock(sc.ck, nh, r.m);
            api.sound('correct');
            api.say('The long hand went round once. The minutes stay the same!', 'cheer');
            api.feedback(target + ' → ' + stcDigital(nh, r.m) + ': the hour goes up by 1, the minutes stay :' + stcDigital(1, r.m).slice(3) + '.', 'good');
            api.unlockNext();
          }, 60);
        } else {
          ch.mark(v, 'bad');
          api.sound('wrong');
          if (v === stcDigital(r.h, r.m + 1)) api.feedback('That is 1 MINUTE later. One hour later, the minutes stay the same and the hour goes up by 1.', 'try');
          else api.feedback('That is 2 hours later. Only one hour: ' + r.h + ' → ' + nh + '.', 'try');
        }
      }, { columns: 3 });
      side.appendChild(ch);
    });
    stage.appendChild(el('div', { class: 'stc-row' }, sc.ck.svg, side));
  }

  // 3. Day timeline with 8 to 10 o'clock shaded: drop clocks inside or outside.
  function makeMini(h, m, w) {
    var ck = makeClock({ r: 60, width: w || 104, hour: h, minute: m });
    return ck;
  }
  function learnWindow(stage, api) {
    api.say("Is each clock between 8 o'clock and 10 o'clock? Drag it in or out.", 'think');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Between 8 and 10', 'Drag each clock (or click it, then click a box).'));
    var A = 480, B = 600;
    var tl = makeTimeline(6, 12, A, B);
    stage.appendChild(tl.svg);
    var times = U.shuffle([[7, 55], [8, 45], [9, 59], [10, 12]]);
    var tray = el('div', { class: 'stc-tray' });
    var zin = el('div', { class: 'stc-zone stc-zone-in', 'data-zone': 'in' }, el('div', { class: 'stc-zone-lab' }, "Inside: after 8, before 10"));
    var zout = el('div', { class: 'stc-zone stc-zone-out', 'data-zone': 'out' }, el('div', { class: 'stc-zone-lab' }, 'Outside'));
    var selected = null, placed = 0;
    function place(card, zone) {
      var h = +card.getAttribute('data-h'), m = +card.getAttribute('data-m');
      var inside = inWindow(dayT(h, m), A, B);
      var wantIn = zone === 'in';
      card.classList.remove('stc-sel');
      selected = null;
      if (inside === wantIn) {
        card.classList.add('stc-done');
        (wantIn ? zin : zout).appendChild(card);
        tl.mark(dayT(h, m), stcDigital(h, m), inside ? 'stc-pin-in' : 'stc-pin-out');
        api.sound('correct');
        api.feedback(windowWhy(h, m, A, B), 'good');
        placed++;
        if (placed === 4) {
          api.say('All sorted! 8:45 is inside, even with the short hand near 9.', 'cheer');
          api.unlockNext();
        }
      } else {
        api.sound('wrong');
        card.classList.add('stc-shake');
        api.later(function () { card.classList.remove('stc-shake'); }, 400);
        var t = dayT(h, m);
        if (inside) api.feedback(stcDigital(h, m) + ' is after 8 o\'clock and before 10 o\'clock. It belongs inside!' + (m >= 40 ? ' The short hand is near ' + stcNextHour(h) + ', but it is still ' + h + '-something.' : ''), 'try');
        else if (t < A) api.feedback('Look at the short hand: it has not reached 8 yet. ' + stcDigital(h, m) + ' is before 8 o\'clock.', 'try');
        else api.feedback('The short hand has gone past 10. ' + stcDigital(h, m) + ' is after 10 o\'clock: too late.', 'try');
      }
    }
    times.forEach(function (hm) {
      var ck = makeMini(hm[0], hm[1], 100);
      var card = el('div', { class: 'stc-mini', 'data-h': hm[0], 'data-m': hm[1], tabindex: 0 }, ck.svg, el('div', { class: 'stc-mini-dig' }, stcDigital(hm[0], hm[1])));
      tray.appendChild(card);
      htmlDrag(api, card, {
        tap: function () {
          if (card.classList.contains('stc-done')) return;
          if (selected) selected.classList.remove('stc-sel');
          selected = card;
          card.classList.add('stc-sel');
          api.sound('click');
        },
        drop: function (zone) { if (!card.classList.contains('stc-done') && zone) place(card, zone); },
      });
    });
    [zin, zout].forEach(function (z) {
      z.addEventListener('click', function (e) {
        if (selected && !e.target.closest('.stc-mini')) place(selected, z.getAttribute('data-zone'));
      });
    });
    stage.appendChild(tray);
    stage.appendChild(el('div', { class: 'stc-zones' }, zin, zout));
  }

  /** pointer drag for an HTML card; short press = tap. drop(zoneName|null) */
  function htmlDrag(api, item, cb) {
    var sx = 0, sy = 0, down = false, dragging = false;
    function pd(e) {
      if (item.classList.contains('stc-done')) return;
      down = true; dragging = false; sx = e.clientX; sy = e.clientY;
      try { item.setPointerCapture(e.pointerId); } catch (err) {}
    }
    function pm(e) {
      if (!down) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (!dragging && dx * dx + dy * dy > 49) { dragging = true; item.classList.add('stc-dragging'); }
      if (dragging) item.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    }
    function pu(e) {
      if (!down) return;
      down = false;
      if (!dragging) { cb.tap(); return; }
      dragging = false;
      item.style.visibility = 'hidden';
      var under = document.elementFromPoint(e.clientX, e.clientY);
      item.style.visibility = '';
      item.style.transform = '';
      item.classList.remove('stc-dragging');
      var z = under && under.closest ? under.closest('[data-zone]') : null;
      cb.drop(z ? z.getAttribute('data-zone') : null);
    }
    item.style.touchAction = 'none';
    item.addEventListener('pointerdown', pd);
    item.addEventListener('pointermove', pm);
    item.addEventListener('pointerup', pu);
    item.addEventListener('pointercancel', pu);
    item.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); cb.tap(); } });
    api.cleanup(function () {
      item.removeEventListener('pointerdown', pd);
      item.removeEventListener('pointermove', pm);
      item.removeEventListener('pointerup', pu);
      item.removeEventListener('pointercancel', pu);
    });
  }

  /* ---------------- practice deck ---------------- */
  var L2_TIMES = [[6, 20], [9, 41], [10, 48], [1, 35], [6, 54], [4, 28], [10, 44], [2, 54], [7, 19], [11, 7]];
  var WINDOWS = [[7, 48, 9, 12], [2, 0, 2, 30], [7, 1, 7, 32], [9, 30, 10, 0]];
  var SORT_POOLS = [[[7, 55], [7, 50], [7, 58]], [[8, 45], [8, 50], [8, 55]], [[9, 59], [9, 55], [9, 50]], [[10, 12], [10, 5], [10, 10]]];
  var deck = null;

  function buildDeck() {
    var q = [];
    var used = {};
    function key(h, m) { return h + ':' + m; }
    // Level 1: o'clock, half past, quarter past / to (three different kinds, different hours)
    var hours = U.shuffle(U.range(1, 12));
    U.shuffle([0, 30, 15, 45]).slice(0, 3).forEach(function (m) {
      var h = hours.pop();
      used[key(h, m)] = 1;
      q.push({ type: 'set', h: h, m: m });
    });
    // Level 2: two to-the-minute times (one of them a :54), then "1 hour later"
    var nearly = U.pick([[6, 54], [2, 54]]);
    var rest = U.shuffle(L2_TIMES.filter(function (t) { return t[1] !== 54; }));
    var two = U.shuffle([nearly, rest.pop()]);
    two.forEach(function (t) { used[key(t[0], t[1])] = 1; q.push({ type: 'set', h: t[0], m: t[1] }); });
    var lt = Math.random() < 0.3 ? U.pick([[12, 35], [12, 20]]) : rest.pop();
    q.push({ type: 'later', h: lt[0], m: lt[1] });
    // Level 3: make a time between 8 and 10; sort edge clocks; type a time in a workbook window
    q.push({ type: 'make', a: 480, b: 600 });
    var set;
    do { set = SORT_POOLS.map(function (p) { return U.pick(p); }); } while (set[0][1] === 55 && set[1][1] === 45 && set[2][1] === 59 && set[3][1] === 12);
    q.push({ type: 'sort', a: 480, b: 600, clocks: U.shuffle(set) });
    var w = U.pick(WINDOWS);
    q.push({ type: 'between', a: dayT(w[0], w[1]), b: dayT(w[2], w[3]) });
    return q;
  }

  /* ---- set the clock to a given time ---- */
  function startFor(h) {
    var s = ((h - 1 + U.rand(2, 9)) % 12) + 1; // a different hour, o'clock
    return { h: s, m: 0 };
  }

  function diagnoseSet(q, h, m, second) {
    var target = stcDigital(q.h, q.m), n = stcNextHour(q.h);
    if (m === q.m) {
      var off = Math.abs(sdiff(toT(q.h, q.m), toT(h, m), 720)) === 60;
      return {
        hint: 'The minutes are right! Now check the short hand: for ' + target + ' it should be ' + hourPos(q.h, q.m) + '.' + (second ? ' Use ◀ hour or hour ▶ to fix it.' : off ? ' It is one hour out.' : ''),
        tag: 'Hour hand left on the wrong number',
      };
    }
    if (m === (q.h % 12) * 5 && q.m !== m)
      return { hint: 'The long hand is pointing at the ' + q.h + '. But the long hand shows the MINUTES. Count in 5s from the 12 to ' + q.m + '.', tag: 'Minute hand on the hour number' };
    if (q.m >= 1 && q.m <= 12 && m === (q.m * 5) % 60)
      return { hint: 'The ' + q.m + ' on the clock means ' + ((q.m * 5) % 60 || 60) + ' minutes. ' + q.m + ' minutes is ' + q.m + ' small marks after the 12.', tag: 'Pointed at the number instead of counting minutes' };
    var dm = Math.abs(sdiff(m, q.m, 60));
    if (dm <= 2) return { hint: 'So close! Your clock says ' + stcDigital(h, m) + '. Use − 1 min or + 1 min to get exactly ' + target + '.', tag: 'Minutes a little out' };
    var w = minuteWorking(q.m);
    return {
      hint: second ? 'Long hand: ' + w.text + '. Short hand: ' + hourPos(q.h, q.m) + '.' : 'Look at the minutes: ' + stcDigital(q.h, q.m).slice(3) + '. Count round from the 12 in 5s, then in 1s.',
      tag: 'Counted the minutes wrongly',
    };
  }

  function practiceSet(stage, api, q) {
    var target = stcDigital(q.h, q.m);
    var wrap = el('div', { class: 'stc-q', 'data-kind': 'set', 'data-target': target });
    api.say(api.level === 1 ? 'Drag the long hand first. Then check the short hand!' : 'Count the minutes in 5s, then 1s. Watch the short hand!', 'think');
    wrap.appendChild(MQ.ui.prompt('Set the clock to <b>' + target + '</b>.'));
    var live = digitalBox('', 'stc-small');
    var st = startFor(q.h);
    var sc = setClock(api, { h: st.h, m: st.m, buttons: true, onChange: function (h, m) { live.textContent = stcDigital(h, m); } });
    var check = el('button', { class: 'btn btn-check stc-checkbtn', type: 'button' }, 'Check');
    var work = el('div', { class: 'stc-workbox' });
    var goal = el('div', { class: 'stc-goal' }, el('div', { class: 'stc-lab' }, 'Show this time'), digitalBox(target));
    if (api.level === 1) goal.appendChild(el('div', { class: 'stc-words' }, stcWords(q.h, q.m)));
    check.addEventListener('click', function () {
      if (api.isAnswered()) return;
      if (!sc.moved()) { api.feedback('First drag the long orange hand (or use the buttons) to set the time.', 'info'); return; }
      var h = sc.h(), m = sc.m();
      if (h === q.h && m === q.m) {
        sc.lock();
        check.disabled = true;
        showWorkOnClock(sc.ck, q.h, q.m);
        api.check(true, 'Yes! ' + target + ': the short hand is ' + hourPos(q.h, q.m) + '.');
      } else {
        var d = diagnoseSet(q, h, m, api.tries() >= 1);
        if (api.tries() >= 1) sc.ck.svg.classList.add('stc-ring-on');
        api.check(false, d.hint, d.tag);
      }
    });
    var side = el('div', { class: 'stc-side' }, goal, el('div', { class: 'stc-lab' }, 'Your clock'), live, sc.ctl, check);
    wrap.appendChild(el('div', { class: 'stc-row' }, sc.ck.svg, side));
    wrap.appendChild(work);
    stage.appendChild(wrap);
    api.onReveal(function () {
      sc.lock();
      check.disabled = true;
      sc.animateTo(toT(q.h, q.m), function () { showWorkOnClock(sc.ck, q.h, q.m); });
      var w = minuteWorking(q.m);
      MQ.clear(work);
      work.appendChild(w.el);
      work.appendChild(el('div', { class: 'stc-hourwhy' }, 'Short hand: ' + hourPos(q.h, q.m) + ' → hour ' + q.h));
      api.feedback(target + ': ' + w.text + '. The short hand is ' + hourPos(q.h, q.m) + '.', 'info');
    });
  }

  /* ---- 1 hour later (typed) ---- */
  function practiceLater(stage, api, q) {
    var nh = stcNextHour(q.h), ans = stcDigital(nh, q.m);
    var wrap = el('div', { class: 'stc-q', 'data-kind': 'later', 'data-h': q.h, 'data-m': q.m });
    api.say('One hour later. What changes? What stays the same?', 'think');
    wrap.appendChild(MQ.ui.prompt('The clock says <b>' + stcDigital(q.h, q.m) + '</b>. Type the time <b>1 hour later</b>.'));
    var sc = setClock(api, { h: q.h, m: q.m, width: 260 });
    sc.lock();
    var ti = timeInput(function (p) {
      if (api.isAnswered()) return;
      if (!p || p.m > 59 || p.h === 0 || p.h > 13) { api.feedback(FORMAT_MSG, 'info'); return; }
      if (p.h === nh && p.m === q.m) {
        ti.disable();
        sc.animateTo(toT(nh, q.m), function () { showWorkOnClock(sc.ck, nh, q.m); }, 50);
        api.check(true, 'Yes! ' + ans + '. The hour goes up by 1 and the minutes stay the same.');
        return;
      }
      var second = api.tries() >= 1;
      if (p.h === 13) api.check(false, 'Clocks do not show 13! After 12 the hours start again at 1.' + (second ? ' So 1 hour after ' + stcDigital(q.h, q.m) + ' is 01:' + stcDigital(1, q.m).slice(3) + '.' : ''), 'Went to 13 instead of 1');
      else if (p.m !== q.m) api.check(false, 'Look at the minutes: they should stay :' + stcDigital(1, q.m).slice(3) + '. One hour later, only the hour changes.' + (second ? ' The hour goes ' + q.h + ' → ' + nh + '.' : ''), 'Changed minutes when adding 1 hour');
      else if (p.h === q.h) api.check(false, 'That is the same time! One hour later, the hour goes up by 1.' + (second ? ' ' + q.h + ' → ' + nh + '.' : ''), 'Did not change the hour');
      else api.check(false, 'The minutes are right. Now the hour: just 1 more than ' + q.h + '.' + (second ? (q.h === 12 ? ' After 12 comes 1.' : ' ' + q.h + ' + 1 = ' + nh + '.') : ''), 'Added the wrong number of hours');
    });
    var side = el('div', { class: 'stc-side' }, el('div', { class: 'stc-lab' }, 'Now'), digitalBox(stcDigital(q.h, q.m)), el('div', { class: 'stc-lab' }, '1 hour later'), ti.el);
    wrap.appendChild(el('div', { class: 'stc-row' }, sc.ck.svg, side));
    stage.appendChild(wrap);
    ti.focus();
    api.onReveal(function () {
      ti.setValue(ans);
      ti.disable();
      sc.animateTo(toT(nh, q.m), function () { showWorkOnClock(sc.ck, nh, q.m); }, 60);
      api.feedback('The long hand goes all the way round once, so the short hand moves on one number: ' + q.h + ' → ' + nh + (q.h === 12 ? ' (after 12 comes 1)' : '') + '. The minutes stay :' + stcDigital(1, q.m).slice(3) + '. So ' + stcDigital(q.h, q.m) + ' → ' + ans + '.', 'info');
    });
  }

  /* ---- make a time between 8 and 10 ---- */
  function practiceMake(stage, api, q) {
    var wrap = el('div', { class: 'stc-q', 'data-kind': 'make', 'data-from': '08:00', 'data-to': '10:00' });
    api.say("Any time after 8 o'clock and before 10 o'clock is fine!", 'think');
    wrap.appendChild(MQ.ui.prompt("Set the clock to a time <b>after 8 o'clock</b> and <b>before 10 o'clock</b>."));
    var tl = makeTimeline(7, 11, q.a, q.b);
    var live = digitalBox('', 'stc-small');
    var st = U.pick([[6, 30], [7, 0], [10, 30], [11, 0]]);
    var sc = setClock(api, {
      h: st[0], m: st[1], buttons: true, width: 250,
      onChange: function (h, m) { live.textContent = stcDigital(h, m); tl.live(dayT(h, m), stcDigital(h, m)); },
    });
    var check = el('button', { class: 'btn btn-check stc-checkbtn', type: 'button' }, 'Check');
    check.addEventListener('click', function () {
      if (api.isAnswered()) return;
      if (!sc.moved()) { api.feedback('First move the hands (drag the long hand or use the buttons).', 'info'); return; }
      var h = sc.h(), m = sc.m(), t = dayT(h, m), d = stcDigital(h, m);
      if (inWindow(t, q.a, q.b)) {
        sc.lock();
        check.disabled = true;
        showWorkOnClock(sc.ck, h, m);
        api.check(true, d + ' is after 8 o\'clock and before 10 o\'clock. ' + (m >= 40 ? 'The short hand is near ' + stcNextHour(h) + ' but still ' + h + '-something.' : 'Well set!'));
        return;
      }
      var second = api.tries() >= 1;
      if (t === q.a || t === q.b) api.check(false, d + ' is exactly on the edge. "Between" means after 8 o\'clock and before 10 o\'clock, not right on them.' + (second ? ' Try 08:30 or 09:00.' : ''), 'Put a time just outside the window inside it');
      else if (t < q.a) api.check(false, d + ' is before 8 o\'clock: the short hand has not reached 8 yet. Move the time later.' + (second ? ' Press hour ▶ until the short hand is past 8.' : ''), 'Put a time just outside the window inside it');
      else api.check(false, d + ' is after 10 o\'clock (or not in the morning window). Move the time earlier.' + (second ? ' Press ◀ hour until the short hand is between 8 and 10.' : ''), 'Put a time just outside the window inside it');
    });
    var side = el('div', { class: 'stc-side' }, el('div', { class: 'stc-lab' }, 'Your clock'), live, sc.ctl, check);
    wrap.appendChild(el('div', { class: 'stc-row' }, sc.ck.svg, side));
    wrap.appendChild(tl.svg);
    stage.appendChild(wrap);
    api.onReveal(function () {
      sc.lock();
      check.disabled = true;
      sc.animateTo(toT(9, 0), function () { showWorkOnClock(sc.ck, 9, 0); });
      tl.mark(dayT(9, 0), '09:00', 'stc-pin-in');
      api.feedback("9 o'clock is one answer: it is after 8 o'clock and before 10 o'clock. 08:15, 08:45 or 09:30 work too. Exactly 8:00 or 10:00 do not count.", 'info');
    });
  }

  /* ---- sort edge clocks inside / outside ---- */
  function practiceSort(stage, api, q) {
    var wrap = el('div', { class: 'stc-q', 'data-kind': 'sort', 'data-from': '08:00', 'data-to': '10:00' });
    api.say('Look at both hands. Has it reached 8 yet? Has it gone past 10?', 'think');
    wrap.appendChild(MQ.ui.prompt("Which clocks show a time <b>between 8 o'clock and 10 o'clock</b>?"));
    var picks = [];
    var cards = [];
    var row = el('div', { class: 'stc-sortrow' });
    q.clocks.forEach(function (hm, i) {
      var h = hm[0], m = hm[1], inside = inWindow(dayT(h, m), q.a, q.b);
      var ck = makeMini(h, m, 120);
      var dig = el('div', { class: 'stc-mini-dig stc-hidden' }, stcDigital(h, m));
      var bIn = el('button', { class: 'btn stc-tog', type: 'button' }, 'Inside');
      var bOut = el('button', { class: 'btn stc-tog', type: 'button' }, 'Outside');
      var card = el('div', { class: 'stc-mini stc-sortcard', 'data-h': h, 'data-m': m, 'data-in': inside ? 1 : 0 }, ck.svg, dig, el('div', { class: 'stc-togs' }, bIn, bOut));
      function choose(v) {
        if (api.isAnswered()) return;
        picks[i] = v;
        bIn.classList.toggle('stc-on', v === 'in');
        bOut.classList.toggle('stc-on', v === 'out');
        card.classList.remove('stc-bad');
        api.sound('click');
      }
      bIn.addEventListener('click', function () { choose('in'); });
      bOut.addEventListener('click', function () { choose('out'); });
      cards.push({ card: card, h: h, m: m, inside: inside, dig: dig, bIn: bIn, bOut: bOut });
      row.appendChild(card);
    });
    var check = el('button', { class: 'btn btn-check stc-checkbtn', type: 'button' }, 'Check');
    var tlBox = el('div', { class: 'stc-tlbox' });
    check.addEventListener('click', function () {
      if (api.isAnswered()) return;
      for (var i = 0; i < cards.length; i++) if (!picks[i]) { api.feedback('Choose Inside or Outside for every clock first.', 'info'); return; }
      var wrong = cards.filter(function (c, j) { return (picks[j] === 'in') !== c.inside; });
      if (!wrong.length) {
        cards.forEach(function (c) { c.dig.classList.remove('stc-hidden'); c.card.classList.add('stc-good'); });
        check.disabled = true;
        api.check(true, 'All right! ' + cards.filter(function (c) { return c.inside; }).map(function (c) { return stcDigital(c.h, c.m); }).join(' and ') + ' are between 8 and 10.');
        return;
      }
      var second = api.tries() >= 1;
      var w = wrong[0];
      if (second) wrong.forEach(function (c) { c.card.classList.add('stc-bad'); c.dig.classList.remove('stc-hidden'); });
      var t = dayT(w.h, w.m);
      if (!w.inside) {
        var hint = t < q.a ? 'One clock you put inside is just BEFORE 8: its short hand has not reached 8 yet.' : 'One clock you put inside is just AFTER 10: its short hand has gone past 10.';
        api.check(false, (second ? windowWhy(w.h, w.m, q.a, q.b) + ' ' : '') + hint, 'Put a time just outside the window inside it');
      } else {
        api.check(false, (second ? windowWhy(w.h, w.m, q.a, q.b) + ' ' : '') + 'One clock you put outside is really inside. A short hand NEAR 9 or 10 can still be before 10 o\'clock.', 'Left a time inside the window out');
      }
    });
    wrap.appendChild(row);
    wrap.appendChild(check);
    wrap.appendChild(tlBox);
    stage.appendChild(wrap);
    api.onReveal(function () {
      check.disabled = true;
      var tl = makeTimeline(7, 11, q.a, q.b);
      cards.forEach(function (c) {
        c.dig.classList.remove('stc-hidden');
        c.card.classList.remove('stc-bad');
        c.bIn.classList.toggle('stc-on', c.inside);
        c.bOut.classList.toggle('stc-on', !c.inside);
        c.bIn.disabled = c.bOut.disabled = true;
        tl.mark(dayT(c.h, c.m), stcDigital(c.h, c.m), c.inside ? 'stc-pin-in' : 'stc-pin-out');
      });
      MQ.clear(tlBox);
      tlBox.appendChild(tl.svg);
      api.feedback(cards.map(function (c) { return windowWhy(c.h, c.m, q.a, q.b); }).join(' '), 'info');
    });
  }

  /* ---- type a time in a workbook window ---- */
  function practiceBetween(stage, api, q) {
    var A = stcDigital(Math.floor(q.a / 60), q.a % 60), B = stcDigital(Math.floor(q.b / 60), q.b % 60);
    var wrap = el('div', { class: 'stc-q', 'data-kind': 'between', 'data-from': A, 'data-to': B });
    api.say('Any time in the green part works. Not the edges!', 'think');
    wrap.appendChild(MQ.ui.prompt('Type any time <b>after ' + A + '</b> and <b>before ' + B + '</b>.'));
    var fromH = Math.floor(q.a / 60) - 1, toH = Math.ceil(q.b / 60) + 1;
    var tl = makeTimeline(fromH, toH, q.a, q.b);
    wrap.appendChild(tl.svg);
    var mid = Math.round((q.a + q.b) / 2 / 5) * 5;
    var ti = timeInput(function (p) {
      if (api.isAnswered()) return;
      if (!p || p.m > 59 || p.h < 1 || p.h > 12) { api.feedback(FORMAT_MSG, 'info'); return; }
      var t = dayT(p.h, p.m), d = stcDigital(p.h, p.m);
      if (inWindow(t, q.a, q.b)) {
        ti.disable();
        tl.mark(t, d, 'stc-pin-in');
        api.check(true, windowWhy(p.h, p.m, q.a, q.b));
        return;
      }
      tl.live(t, d);
      var second = api.tries() >= 1;
      var near = Math.min(Math.abs(t - q.a), Math.abs(t - q.b)) <= 15;
      var tag = near ? 'Put a time just outside the window inside it' : 'Chose a time far outside the window';
      api.check(false, windowWhy(p.h, p.m, q.a, q.b) + (second ? ' Try a time in the middle of the green part, like ' + stcDigital(Math.floor(mid / 60), mid % 60).replace(/^0/, '') + '.' : ' Look at the green part of the strip.'), tag);
    });
    wrap.appendChild(ti.el);
    wrap.appendChild(el('p', { class: 'stc-note' }, 'The end times themselves do not count.'));
    stage.appendChild(wrap);
    ti.focus();
    api.onReveal(function () {
      var d = stcDigital(Math.floor(mid / 60), mid % 60);
      ti.setValue(d);
      ti.disable();
      tl.live(-1);
      tl.mark(mid, d, 'stc-pin-in');
      api.feedback(d + ' is after ' + A + ' and before ' + B + ', right in the green part. Any time from ' + stcDigital(Math.floor((q.a + 1) / 60), (q.a + 1) % 60) + ' to ' + stcDigital(Math.floor((q.b - 1) / 60), (q.b - 1) % 60) + ' works.', 'info');
    });
  }

  MQ.register('set-the-clock', {
    learn: [learnTogether, learnRoutine, learnWindow],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'set') practiceSet(stage, api, q);
        else if (q.type === 'later') practiceLater(stage, api, q);
        else if (q.type === 'make') practiceMake(stage, api, q);
        else if (q.type === 'sort') practiceSort(stage, api, q);
        else practiceBetween(stage, api, q);
      },
    },
  });

  var css = [
    '.stc-q{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.stc-row{display:flex;align-items:center;justify-content:center;gap:22px;flex-wrap:wrap;width:100%}',
    '.stc-side{display:flex;flex-direction:column;align-items:center;gap:8px;min-width:200px;max-width:100%}',
    '.stc-clock{display:block;user-select:none;-webkit-user-select:none;touch-action:none}',
    '.stc-hit{fill:rgba(0,0,0,0);cursor:grab}',
    '.stc-locked .stc-hit{cursor:default}',
    '.stc-ring-num{opacity:0;transition:opacity .3s}',
    '.stc-ring-on .stc-ring-num{opacity:1}',
    '.stc-went{fill:#ffd166;fill-opacity:.55;stroke:none}',
    '.stc-minarc{fill:none;stroke:#e85d04;stroke-opacity:.3;stroke-width:12;stroke-linecap:round}',
    '.stc-jumpdot{fill:#e85d04;fill-opacity:.85}',
    '.stc-digital{font-family:"Courier New",monospace;font-weight:800;font-size:2.2rem;background:#1b2a4a;color:#7CFC9A;border-radius:12px;padding:4px 16px;letter-spacing:2px;display:inline-block}',
    '.stc-digital.stc-small{font-size:1.6rem;padding:2px 12px}',
    '.stc-lab{font-weight:800;color:var(--ink-soft);font-size:1rem}',
    '.stc-words{font-weight:800;font-size:1.15rem;color:#0b6e66}',
    '.stc-note{margin:0;text-align:center;color:var(--ink-soft);font-weight:700}',
    '.stc-goal{display:flex;flex-direction:column;align-items:center;gap:4px;background:#fff;border:2px solid var(--line);border-radius:14px;padding:8px 14px}',
    '.stc-ctls{display:grid;grid-template-columns:1fr 1fr;gap:6px}',
    '.stc-ctl{min-height:40px;padding:6px 12px;font-size:1rem}',
    '.stc-checkbtn{min-width:140px;font-size:1.15rem}',
    '.stc-workbox{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.stc-workbox:empty{display:none}',
    '.stc-work{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center}',
    '.stc-chip5{background:#fff1e6;border-color:#e85d04;font-weight:800}',
    '.stc-chip1{background:#fff;font-weight:800}',
    '.stc-then{font-weight:800;color:var(--ink-soft)}',
    '.stc-hourwhy{font-weight:800;background:#fff3c4;border:2px solid #f2c94c;border-radius:12px;padding:4px 12px}',
    '.stc-card{display:flex;flex-direction:column;align-items:center;gap:4px;background:#fff;border:3px solid var(--line);border-radius:16px;padding:10px 18px}',
    '.stc-card-icon{font-size:2.6rem;line-height:1}',
    '.stc-card-what{font-weight:800;font-size:1.25rem}',
    '.stc-when{font-weight:800;border-radius:10px;padding:2px 10px;font-size:.95rem}',
    '.stc-when-morning{background:#fff3c4}',
    '.stc-when-evening{background:#e6e9ff}',
    '.stc-opt{font-family:"Courier New",monospace;font-weight:800;font-size:1.5rem;letter-spacing:1px}',
    '.stc-side .choices{max-width:420px}',
    '.stc-timeline{display:block}',
    '.stc-tl-bg{fill:#fff;stroke:var(--line);stroke-width:2}',
    '.stc-tl-band{fill:#bfeedd;stroke:none}',
    '.stc-tl-edge{stroke:#1f9d6b;stroke-width:3}',
    '.stc-tl-endlab{font-family:"Courier New",monospace;font-weight:800;font-size:15px;fill:#1f7a55}',
    '.stc-tl-tick{stroke:#1b2a4a;stroke-width:2}',
    '.stc-tl-hour{font-weight:800;font-size:14px;fill:#1b2a4a}',
    '.stc-pin-line{stroke:#1b2a4a;stroke-width:2;stroke-dasharray:3 3}',
    '.stc-pin-dot{fill:#1b2a4a;stroke:#fff;stroke-width:2}',
    '.stc-pin-in .stc-pin-dot{fill:#1f9d6b}',
    '.stc-pin-out .stc-pin-dot{fill:#c2410c}',
    '.stc-pin-live .stc-pin-dot{fill:#e85d04}',
    '.stc-pin-lab-bg{fill:#1b2a4a}',
    '.stc-pin-lab{font-family:"Courier New",monospace;font-weight:800;font-size:13px;fill:#7CFC9A}',
    '.stc-tray{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;min-height:20px}',
    '.stc-mini{display:flex;flex-direction:column;align-items:center;gap:2px;background:#fff;border:3px solid var(--line);border-radius:14px;padding:6px;cursor:grab;user-select:none;-webkit-user-select:none}',
    '.stc-mini.stc-sel{border-color:var(--gold);box-shadow:0 0 0 3px #ffe7a3}',
    '.stc-mini.stc-dragging{position:relative;z-index:5;opacity:.9;box-shadow:0 6px 18px rgba(27,42,74,.25)}',
    '.stc-mini.stc-done{cursor:default;border-color:var(--good)}',
    '.stc-mini-dig{font-family:"Courier New",monospace;font-weight:800;font-size:1.2rem}',
    '.stc-hidden{visibility:hidden}',
    '.stc-shake{animation:stc-shake .35s}',
    '@keyframes stc-shake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}',
    '.stc-zones{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:720px}',
    '.stc-zone{min-height:150px;border:3px dashed var(--line);border-radius:16px;padding:6px;display:flex;flex-wrap:wrap;gap:6px;align-content:flex-start;justify-content:center;cursor:pointer}',
    '.stc-zone-in{background:#e2f7ee;border-color:#1f9d6b}',
    '.stc-zone-out{background:#fff6ee;border-color:#e0a77a}',
    '.stc-zone-lab{width:100%;text-align:center;font-weight:800}',
    '.stc-zone .stc-mini svg{width:70px}',
    '.stc-sortrow{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}',
    '.stc-sortcard{cursor:default}',
    '.stc-sortcard.stc-bad{border-color:var(--try);background:var(--try-bg)}',
    '.stc-sortcard.stc-good{border-color:var(--good)}',
    '.stc-togs{display:flex;gap:4px}',
    '.stc-tog{min-height:36px;padding:4px 10px;font-size:.95rem;background:#fff;color:var(--ink);border:2px solid var(--line)}',
    '.stc-tog.stc-on{background:#1b2a4a;color:#fff;border-color:#1b2a4a}',
    '.stc-tlbox:empty{display:none}',
    '.stc-tin{width:150px;font-family:"Courier New",monospace;font-weight:800}',
    '@media (max-width:820px){.stc-row{gap:12px}.stc-zone{min-height:120px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'set-the-clock' }, css));
})();

/* Clock to the Minute — read and set an analogue clock to the exact minute (Unit 14 opener).
 * The hour hand always moves with the minutes: hour angle = 30 × hour + 0.5 × minutes.
 * Time on a clock is kept as t = minutes after 12:00 (0–719); hour 0 is shown as 12.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  var ID = 'clock-to-the-minute';
  var R_FACE = 134;
  var HOUR_WORDS = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

  var TAG = {
    number: 'Read the minute number as the minutes',
    next: 'Used the next hour too early',
    swap: 'Hands swapped',
    ones: 'Counted 1s instead of 5s on the numbers',
    marks: 'Miscounted the little minute marks',
    hour: 'Read the hour hand wrong',
    setHour: 'Set the short hand to the wrong hour',
    onHour: 'Put the short hand on the hour, not nearly at the next',
    minute: 'Long hand in the wrong place',
    toPast: 'Wrote minutes "to" as minutes "past"',
  };

  /* ---------------- time helpers ---------------- */
  function hourOf(t) {
    var h = Math.floor(t / 60) % 12;
    return h === 0 ? 12 : h;
  }
  function minOf(t) {
    return t % 60;
  }
  function toT(h, m) {
    return (h % 12) * 60 + m;
  }
  function nextH(h) {
    return (h % 12) + 1;
  }
  function prevH(h) {
    return h === 1 ? 12 : h - 1;
  }
  function fmt(h, m, sep) {
    return h + (sep || ':') + (m < 10 ? '0' : '') + m;
  }
  function cyc(a, b) {
    var d = Math.abs(a - b) % 60;
    return Math.min(d, 60 - d);
  }
  function pol(r, deg) {
    var a = (deg * Math.PI) / 180;
    return { x: r * Math.sin(a), y: -r * Math.cos(a) };
  }

  /** Parse what the child types: "6:35", "6.35", "635". Returns {h, m} or {err}. */
  function parseTime(raw) {
    var s = String(raw || '').trim().replace(/\s+/g, '');
    if (!s) return { err: 'Type the time first, like 6:35.' };
    var mt = s.match(/^(\d{1,2})[:.;,](\d{1,2})$/) || s.match(/^(\d{1,2})(\d{2})$/);
    if (!mt) return { err: 'Write the hour, then two dots, then the minutes. Like 6:35.' };
    var h = parseInt(mt[1], 10);
    if (mt[2].length === 1) return { err: 'Minutes need two digits. Write ' + h + ':0' + mt[2] + ' for ' + mt[2] + ' minutes past.' };
    var m = parseInt(mt[2], 10);
    if (h < 1 || h > 12) return { err: 'The hour on our clock is a number from 1 to 12.' };
    if (m > 59) return { err: 'There are only 60 minutes in an hour, so the minutes go from 00 to 59.' };
    return { h: h, m: m };
  }

  /* ---------------- the kitchen clock ---------------- */
  /**
   * makeClock({ t, labels, minute: true, hour: true, lo, hi, onChange(t), onEnd(t) })
   * labels: show the 5, 10, 15 … minute ring outside the rim.
   * minute/hour: which hands can be dragged. lo/hi: clamp the time (no wrapping).
   */
  function makeClock(o) {
    o = o || {};
    var t = o.t || 0;
    var dragMinute = !!o.minute;
    var dragHour = !!o.hour;
    var root = S('svg', { viewBox: '-170 -170 340 340', class: 'ctm-clock' + (dragMinute || dragHour ? ' ctm-live' : ''), role: 'img', 'aria-label': 'Clock' });
    root.appendChild(S('circle', { cx: 0, cy: 3, r: 146, class: 'ctm-shadow' }));
    root.appendChild(S('circle', { cx: 0, cy: 0, r: 140, class: 'ctm-rim' }));
    root.appendChild(S('circle', { cx: 0, cy: 0, r: R_FACE, class: 'ctm-face' }));
    var countLayer = S('g', { class: 'ctm-count' });
    root.appendChild(countLayer);
    var ticks = [];
    for (var i = 0; i < 60; i++) {
      var big = i % 5 === 0;
      var a = pol(big ? 108 : 119, i * 6);
      var b = pol(128, i * 6);
      var tk = S('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: big ? 'ctm-tick ctm-tick-big' : 'ctm-tick' });
      ticks.push(tk);
      root.appendChild(tk);
    }
    for (var n = 1; n <= 12; n++) {
      var p = pol(90, n * 30);
      root.appendChild(S('text', { x: p.x, y: p.y + 9, class: 'ctm-num', 'text-anchor': 'middle' }, String(n)));
    }
    var labelRing = S('g', { class: 'ctm-labels' });
    var labels = [];
    for (var k = 0; k < 12; k++) {
      var q = pol(157, k * 30);
      var lab = S('text', { x: q.x, y: q.y + 5, class: 'ctm-lab', 'text-anchor': 'middle' }, k === 0 ? '0' : String(k * 5));
      labels.push(lab);
      labelRing.appendChild(lab);
    }
    root.appendChild(labelRing);
    var hourHand = S('g', { class: 'ctm-hour' }, S('line', { x1: 0, y1: 14, x2: 0, y2: -64, class: 'ctm-hour-line' }));
    var minHand = S('g', { class: 'ctm-min' }, S('line', { x1: 0, y1: 20, x2: 0, y2: -116, class: 'ctm-min-line' }));
    if (dragHour) hourHand.appendChild(S('circle', { cx: 0, cy: -52, r: 9, class: 'ctm-knob ctm-knob-hour' }));
    if (dragMinute) minHand.appendChild(S('circle', { cx: 0, cy: -116, r: 9, class: 'ctm-knob ctm-knob-min' }));
    root.appendChild(hourHand);
    root.appendChild(minHand);
    root.appendChild(S('circle', { cx: 0, cy: 0, r: 8, class: 'ctm-cap' }));

    var clock = { svg: root, touched: false, locked: false };
    var labelsOn = !!o.labels;

    function draw() {
      var m = minOf(t);
      minHand.setAttribute('transform', 'rotate(' + m * 6 + ')');
      hourHand.setAttribute('transform', 'rotate(' + t * 0.5 + ')'); // = 30 × hour + 0.5 × minutes
      root.setAttribute('data-t', String(t));
      root.setAttribute('data-time', fmt(hourOf(t), m));
      labelRing.style.display = labelsOn ? '' : 'none';
    }
    function set(nt, user) {
      if (o.lo != null) nt = Math.max(o.lo, Math.min(o.hi, nt));
      else nt = ((nt % 720) + 720) % 720;
      if (nt === t) return;
      t = nt;
      if (user) clock.touched = true;
      draw();
      if (o.onChange) o.onChange(t);
    }
    clock.t = function () {
      return t;
    };
    clock.set = function (nt) {
      set(nt, false);
    };
    clock.nudge = function (d) {
      if (clock.locked) return;
      set(t + d, true);
      if (o.onEnd) o.onEnd(t);
    };
    clock.showLabels = function (on) {
      labelsOn = on;
      draw();
    };
    /** Shade the minutes counted from 12 ('past') or still to go to 12 ('to'), and the hour gap. */
    clock.showCount = function (m, opts) {
      opts = opts || {};
      MQ.clear(countLayer);
      ticks.forEach(function (tk) {
        tk.classList.remove('ctm-tick-one');
      });
      labels.forEach(function (l) {
        l.classList.remove('ctm-lab-on');
      });
      if (opts.hour) {
        var hh = opts.hour % 12;
        var a0 = pol(90, hh * 30);
        var a1 = pol(90, hh * 30 + 30);
        countLayer.appendChild(S('path', { d: 'M' + a0.x + ' ' + a0.y + ' A90 90 0 0 1 ' + a1.x + ' ' + a1.y, class: 'ctm-hourband' }));
      }
      if (opts.to) {
        var from = pol(128, m * 6);
        countLayer.appendChild(S('path', { d: 'M0 0 L' + from.x + ' ' + from.y + ' A128 128 0 0 1 0 -128 Z', class: 'ctm-wedge-to' }));
      }
      if (m > 0) {
        var end = pol(128, m * 6);
        countLayer.appendChild(S('path', { d: 'M0 0 L0 -128 A128 128 0 ' + (m > 30 ? 1 : 0) + ' 1 ' + end.x + ' ' + end.y + ' Z', class: 'ctm-wedge' }));
      }
      var fives = Math.floor(m / 5);
      for (var j = 1; j <= fives && j < 12; j++) labels[j].classList.add('ctm-lab-on');
      for (var x = fives * 5 + 1; x <= m; x++) ticks[x].classList.add('ctm-tick-one');
    };
    clock.clearCount = function () {
      MQ.clear(countLayer);
      ticks.forEach(function (tk) {
        tk.classList.remove('ctm-tick-one');
      });
      labels.forEach(function (l) {
        l.classList.remove('ctm-lab-on');
      });
    };
    clock.lock = function () {
      clock.locked = true;
      root.classList.remove('ctm-live');
    };

    var grab = null;
    function angleOf(p) {
      var d = (Math.atan2(p.x, -p.y) * 180) / Math.PI;
      return d < 0 ? d + 360 : d;
    }
    function apply(p) {
      var ang = angleOf(p);
      var m = minOf(t);
      if (grab === 'min') {
        var nm = Math.round(ang / 6) % 60;
        var d = nm - m;
        if (d > 30) d -= 60;
        if (d <= -30) d += 60;
        set(t + d, true);
      } else if (grab === 'hour') {
        var h = Math.round((ang - 0.5 * m) / 30);
        h = ((h % 12) + 12) % 12;
        set(h * 60 + m, true);
      }
    }
    if (dragMinute || dragHour) {
      var unbind = MQ.ui.drag(root, root, {
        start: function (p) {
          if (clock.locked) return;
          var r = Math.sqrt(p.x * p.x + p.y * p.y);
          if (r < 14 || r > 168) {
            grab = null;
            return;
          }
          var ang = angleOf(p);
          var dMin = Math.abs(((ang - minOf(t) * 6 + 540) % 360) - 180);
          var dHour = Math.abs(((ang - t * 0.5 + 540) % 360) - 180);
          if (!dragHour) grab = 'min';
          else if (!dragMinute) grab = 'hour';
          else if (r > 80) grab = 'min';
          else grab = dHour <= dMin ? 'hour' : 'min';
          root.classList.add(grab === 'min' ? 'ctm-grab-min' : 'ctm-grab-hour');
          apply(p);
        },
        move: function (p) {
          if (grab && !clock.locked) apply(p);
        },
        end: function () {
          if (!grab) return;
          root.classList.remove('ctm-grab-min', 'ctm-grab-hour');
          grab = null;
          if (o.onEnd) o.onEnd(t);
        },
      });
      clock.unbind = unbind;
    }
    draw();
    return clock;
  }

  /* ---------------- shared pieces ---------------- */
  function digital(text, cls) {
    return el('div', { class: 'ctm-digital' + (cls ? ' ' + cls : '') }, text);
  }

  /** Chips: 5, 10, 15 … on the numbers, then +1s on the marks. */
  function countChips(m) {
    var row = el('div', { class: 'ctm-chips' });
    if (m === 0) {
      row.appendChild(el('span', { class: 'ctm-chip ctm-chip-five' }, 'on the 12'));
      row.appendChild(el('span', { class: 'ctm-eq' }, '= 0 minutes past (o\'clock)'));
      return row;
    }
    var fives = Math.floor(m / 5);
    var n = 0;
    for (var i = 1; i <= fives; i++) row.appendChild(el('span', { class: 'ctm-chip ctm-chip-five', style: { animationDelay: n++ * 0.08 + 's' } }, String(i * 5)));
    for (var j = fives * 5 + 1; j <= m; j++) row.appendChild(el('span', { class: 'ctm-chip ctm-chip-one', style: { animationDelay: n++ * 0.08 + 's' } }, String(j)));
    row.appendChild(el('span', { class: 'ctm-eq' }, '→ ' + m + ' minute' + (m === 1 ? '' : 's') + ' past'));
    return row;
  }

  function countLegend() {
    return el('div', { class: 'ctm-legend' }, el('span', { class: 'ctm-chip ctm-chip-five' }, '5s'), ' on the numbers', el('span', { class: 'ctm-chip ctm-chip-one' }, '1s'), ' on the little marks');
  }

  function hourLine(h, m) {
    if (m === 0) return 'The short hand is on the ' + h + '. The hour is ' + h + '.';
    if (m < 30) return 'The short hand has just gone past the ' + h + '. The hour is ' + h + '.';
    if (m === 30) return 'The short hand is halfway from ' + h + ' to ' + nextH(h) + '. The hour is still ' + h + '.';
    return 'The short hand is past halfway to ' + nextH(h) + ', but it has not reached it. The hour is still ' + h + '.';
  }

  /** The working shown by "Show me": shade the clock and list the steps. */
  function working(clock, h, m, extra) {
    clock.showLabels(true);
    clock.showCount(m, { hour: h });
    var box = el('div', { class: 'ctm-work' });
    if (extra) box.appendChild(el('p', { class: 'ctm-work-line', html: extra }));
    box.appendChild(el('p', { class: 'ctm-work-line', html: '<b>Hour:</b> ' + hourLine(h, m) }));
    box.appendChild(el('p', { class: 'ctm-work-line', html: '<b>Minutes:</b> count the long hand from 12.' }));
    box.appendChild(countChips(m));
    box.appendChild(el('div', { class: 'ctm-work-ans' }, 'The time is ', digital(fmt(h, m), 'ctm-digital-sm')));
    return box;
  }

  /** Text box for h:mm answers. onSubmit({h, m}) only for times that make sense. */
  function timeBox(api, onSubmit) {
    var input = el('input', { class: 'num-input ctm-time-input', type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: 'h:mm', 'aria-label': 'Time', maxlength: 6 });
    var btn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    var row = el('div', { class: 'num-row' }, input, btn);
    function submit() {
      if (input.disabled) return;
      var r = parseTime(input.value);
      if (r.err) {
        input.classList.add('shake');
        api.later(function () {
          input.classList.remove('shake');
        }, 400);
        api.feedback(r.err, 'info');
        input.focus();
        return;
      }
      onSubmit(r);
    }
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    });
    api.later(function () {
      try {
        input.focus({ preventScroll: true });
      } catch (e) {
        input.focus();
      }
    }, 40);
    return {
      el: row,
      input: input,
      done: function (value, good) {
        input.value = value;
        input.disabled = true;
        btn.disabled = true;
        input.classList.remove('bad');
        if (good) input.classList.add('good');
      },
      bad: function () {
        input.classList.add('bad');
      },
    };
  }

  /** Buttons that nudge the hands, for fine control with a trackpad. */
  function nudgeRow(clock, withHour) {
    var row = el('div', { class: 'ctm-nudge' });
    if (withHour) {
      row.appendChild(
        el('div', { class: 'ctm-nudge-grp' }, el('span', { class: 'ctm-nudge-lbl ctm-lbl-hour' }, 'Short hand'),
          el('button', { class: 'btn ctm-nbtn', type: 'button', 'data-nudge': '-60', 'aria-label': 'Hour back', onclick: function () { clock.nudge(-60); } }, '− 1 hour'),
          el('button', { class: 'btn ctm-nbtn', type: 'button', 'data-nudge': '60', 'aria-label': 'Hour on', onclick: function () { clock.nudge(60); } }, '+ 1 hour'))
      );
    }
    row.appendChild(
      el('div', { class: 'ctm-nudge-grp' }, el('span', { class: 'ctm-nudge-lbl ctm-lbl-min' }, 'Long hand'),
        el('button', { class: 'btn ctm-nbtn', type: 'button', 'data-nudge': '-1', 'aria-label': 'Minute back', onclick: function () { clock.nudge(-1); } }, '− 1 min'),
        el('button', { class: 'btn ctm-nbtn', type: 'button', 'data-nudge': '1', 'aria-label': 'Minute on', onclick: function () { clock.nudge(1); } }, '+ 1 min'))
    );
    return row;
  }

  function handKey() {
    return el('div', { class: 'ctm-key' }, el('span', { class: 'ctm-key-hour' }, 'short hand = hour'), el('span', { class: 'ctm-key-min' }, 'long hand = minutes'));
  }

  /* ---------------- marking ---------------- */
  /** Why might the child have read h:m as H:M? Returns {tag, hint, strong}. */
  function diagnoseRead(h, m, H, M) {
    var n1 = Math.floor(m / 5) || 12;
    var n2 = Math.ceil(m / 5) % 12 || 12;
    var hourHandMin = (5 * (h % 12) + m / 12) % 60;
    if (M === m && H === nextH(h)) {
      return { tag: TAG.next, hint: 'The minutes are right! Look at the short hand: has it reached the ' + nextH(h) + ' yet?', strong: 'The short hand is between ' + h + ' and ' + nextH(h) + '. It has not reached ' + nextH(h) + ', so the hour is still ' + h + '.' };
    }
    if (M === m) {
      return { tag: TAG.hour, hint: 'The minutes are right! Now check the hour. Which number has the short hand just gone past?', strong: 'The short hand is just past the ' + h + '. Use that number for the hour.' };
    }
    if ((H === n1 || H === n2) && cyc(M, hourHandMin) <= 3 && !(H === h && M === m)) {
      return { tag: TAG.swap, hint: 'Check which hand is which. The short hand shows the hour, the long hand shows the minutes.', strong: 'Swap them round: the short hand is near the ' + h + ', so the hour is ' + h + '. Now read the long hand for the minutes.' };
    }
    if (m >= 5 && (M === Math.floor(m / 5) || M === Math.round(m / 5))) {
      return { tag: TAG.number, hint: 'The long hand is near the ' + M + ', but that is not ' + M + ' minutes. Each number on the clock means 5 minutes.', strong: 'Count in 5s on the numbers: 5, 10, 15 … The long hand has passed the ' + n1 + ', which means ' + n1 * 5 + ' minutes. Then count on the little marks in 1s.' };
    }
    if (m >= 10 && M === Math.floor(m / 5) + (m % 5)) {
      return { tag: TAG.ones, hint: 'Did you count 1 for each number? From one number to the next is 5 minutes.', strong: 'Count the numbers in 5s first (5, 10, 15 …), then the little marks in 1s.' };
    }
    if (cyc(M, m) <= 3) {
      return { tag: TAG.marks, hint: 'Very close! Count the little marks after the last number again, one at a time.', strong: 'Find the last number the long hand passed and say its 5s number. Then add 1 for each little mark up to the hand.' };
    }
    return { tag: TAG.minute, hint: 'Look at the long hand. Start at 12 and count round in 5s on the numbers.', strong: 'Count in 5s on the numbers up to the long hand, then 1s on the little marks. The short hand gives the hour.' };
  }

  /** Why might the child have set h:m as the clock time t? */
  function diagnoseSet(h, m, t) {
    var CH = hourOf(t);
    var CM = minOf(t);
    var n1 = Math.floor(m / 5) || 12;
    var n2 = Math.ceil(m / 5) % 12 || 12;
    if (CM === m) {
      if (CH === nextH(h)) return { tag: TAG.next, hint: 'The long hand is right! But the short hand has gone too far. For ' + fmt(h, m) + ' it must not reach the ' + nextH(h) + ' yet.', strong: 'Press "− 1 hour". The short hand should sit between ' + h + ' and ' + nextH(h) + '.' };
      if (CH === prevH(h) && m >= 30) return { tag: TAG.onHour, hint: 'The long hand is right! It is nearly ' + nextH(h) + ' o\'clock, so the short hand should be nearly at the ' + nextH(h) + '.', strong: 'Press "+ 1 hour". For ' + fmt(h, m) + ' the short hand sits between ' + h + ' and ' + nextH(h) + ', close to the ' + nextH(h) + '.' };
      return { tag: TAG.setHour, hint: 'The long hand is right! Now move the short hand so it is just past the ' + h + '.', strong: 'Drag the short hand (or use the hour buttons) until it sits between ' + h + ' and ' + nextH(h) + '.' };
    }
    if ((CH === n1 || CH === n2) && cyc(CM, 5 * (h % 12)) <= 3) {
      return { tag: TAG.swap, hint: 'Check which hand is which. The long hand shows the minutes, the short hand shows the hour.', strong: 'Swap them: put the long hand on ' + m + ' minutes first. Then put the short hand near the ' + h + '.' };
    }
    if (m <= 12 && m % 5 !== 0 && CM === (5 * m) % 60) {
      return { tag: TAG.number, hint: 'The long hand is on the number ' + m + ', but that means ' + (5 * m) % 60 + ' minutes. Count the marks in 1s for ' + m + ' minutes.', strong: m + ' minutes: count in 5s on the numbers, then 1s on the little marks, until you reach ' + m + '.' };
    }
    if (cyc(CM, m) <= 3) {
      return { tag: TAG.marks, hint: 'So close! Count the little marks after the ' + (Math.floor(m / 5) || 12) + ' again.', strong: 'You can use "+ 1 min" and "− 1 min". The long hand needs to be on ' + m + ' minutes.' };
    }
    return { tag: TAG.minute, hint: 'Set the long hand first. Count from 12 in 5s on the numbers, then 1s on the marks, to reach ' + m + '.', strong: m + ' minutes: count 5, 10, 15 … then the little marks. Then put the short hand just past the ' + h + '.' };
  }

  /* ---------------- spoken times ---------------- */
  var PHRASES = [
    { w: 'five past', d: 'past', n: 5 },
    { w: 'ten past', d: 'past', n: 10 },
    { w: 'quarter past', d: 'past', n: 15 },
    { w: 'twenty past', d: 'past', n: 20 },
    { w: 'twenty-five past', d: 'past', n: 25 },
    { w: 'half past', d: 'past', n: 30 },
    { w: 'twenty-five to', d: 'to', n: 25 },
    { w: 'twenty to', d: 'to', n: 20 },
    { w: 'quarter to', d: 'to', n: 15 },
    { w: 'ten to', d: 'to', n: 10 },
    { w: 'five to', d: 'to', n: 5 },
  ];
  function spokenItem(ph, named) {
    var h = ph.d === 'past' ? named : prevH(named);
    var m = ph.d === 'past' ? ph.n : 60 - ph.n;
    return { type: 'spoken', text: ph.w + ' ' + HOUR_WORDS[named], ph: ph, named: named, h: h, m: m };
  }

  /* ---------------- the deck ---------------- */
  var deck = null;

  function buildDeck() {
    var used = {};
    var q = [];
    function free(h, m) {
      return !used[fmt(h, m)];
    }
    function take(item) {
      used[fmt(item.h, item.m)] = true;
      q.push(item);
    }
    function randTime(mins) {
      for (var g = 0; g < 200; g++) {
        var h = U.rand(1, 12);
        var m = U.pick(mins);
        if (free(h, m)) return { h: h, m: m };
      }
      return null;
    }
    var any = U.range(1, 59).filter(function (x) {
      return x % 5 !== 0;
    });

    // Level 1: 5-minute times, pick the digital time (one low, one past halfway, one any; the last uses dot times).
    [U.range(1, 5).map(function (x) { return x * 5; }), U.range(7, 11).map(function (x) { return x * 5; }), U.range(1, 11).map(function (x) { return x * 5; })].forEach(function (pool, i) {
      var tm = randTime(pool);
      var dot = i === 2;
      var sep = dot ? '.' : ':';
      var opts = [
        { label: fmt(tm.h, tm.m, sep), value: 'ok', tag: null },
        { label: fmt(nextH(tm.h), tm.m, sep), value: 'next', tag: TAG.next },
        { label: fmt(tm.h, tm.m / 5, sep), value: 'number', tag: TAG.number },
      ];
      take({ type: 'pick', h: tm.h, m: tm.m, dot: dot, options: U.shuffle(opts) });
    });

    // Level 2: any minute, typed; one of the three is a spoken time.
    var l2 = [];
    var a = randTime(any.filter(function (x) { return x < 30; }));
    used[fmt(a.h, a.m)] = true;
    l2.push({ type: 'read', h: a.h, m: a.m });
    var b = randTime(any.filter(function (x) { return x > 30; }));
    used[fmt(b.h, b.m)] = true;
    l2.push({ type: 'read', h: b.h, m: b.m });
    var sp = null;
    var toPhrases = PHRASES.filter(function (p) { return p.d === 'to'; });
    for (var g = 0; g < 200 && !sp; g++) {
      // Mostly "to" times (the harder kind); sometimes "quarter past".
      var ph = Math.random() < 0.75 ? U.pick(toPhrases) : U.pick(PHRASES);
      var cand = spokenItem(ph, U.rand(1, 12));
      if (free(cand.h, cand.m)) sp = cand;
    }
    used[fmt(sp.h, sp.m)] = true;
    l2.push(sp);
    U.shuffle(l2).forEach(function (it) {
      q.push(it);
    });

    // Level 3: set the hands. One book time, one any-minute time, then a near-the-hour time.
    var book = U.shuffle([{ h: 1, m: 34 }, { h: 6, m: 17 }, { h: 9, m: 12 }]).filter(function (x) { return free(x.h, x.m); });
    var l3 = [];
    var bk = book[0] || randTime(any);
    used[fmt(bk.h, bk.m)] = true;
    l3.push({ type: 'set', h: bk.h, m: bk.m });
    var rt = randTime(any.filter(function (x) { return x < 50 && x > 3; }));
    used[fmt(rt.h, rt.m)] = true;
    l3.push({ type: 'set', h: rt.h, m: rt.m });
    l3 = U.shuffle(l3);
    var near = Math.random() < 0.5 && free(5, 55) ? { h: 5, m: 55 } : randTime([51, 52, 53, 54, 55, 56, 57, 58]);
    used[fmt(near.h, near.m)] = true;
    l3.push({ type: 'set', h: near.h, m: near.m });
    l3.forEach(function (it) {
      q.push(it);
    });
    return q;
  }

  /* ---------------- learn screens ---------------- */
  function learnMinutes(stage, api) {
    var target = U.pick([17, 23, 38, 41, 52]);
    api.say('This is a kitchen clock. Drag the long hand round. Watch the minutes!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Counting minutes', 'Count <b>5s</b> on the numbers, then <b>1s</b> on the little marks.'));
    var disp = digital('4:00');
    var chipsBox = el('div', { class: 'ctm-chipbox' });
    var task = el('div', { class: 'ctm-task' }, 'Can you stop the long hand at ', el('b', null, target + ' minutes past'), '?');
    var done = false;
    var clock = makeClock({
      t: 240,
      labels: true,
      minute: true,
      onChange: update,
      onEnd: function (t) {
        if (!done && minOf(t) === target) {
          done = true;
          api.sound('correct');
          api.say('Yes! ' + target + ' minutes past ' + hourOf(t) + '. Count the 5s, then the 1s.', 'cheer');
          api.feedback('5s on the numbers, then 1s on the marks: ' + target + ' minutes.', 'good');
          task.classList.add('ctm-task-done');
          api.unlockNext();
        }
      },
    });
    if (clock.unbind) api.cleanup(clock.unbind);
    function update(t) {
      var m = minOf(t);
      disp.textContent = fmt(hourOf(t), m);
      clock.showCount(m);
      MQ.clear(chipsBox);
      chipsBox.appendChild(countChips(m));
    }
    update(240);
    stage.appendChild(
      el('div', { class: 'ctm-row' },
        el('div', { class: 'ctm-clockbox' }, clock.svg),
        el('div', { class: 'ctm-side' }, el('div', { class: 'ctm-side-lbl' }, 'Digital clock'), disp, task, countLegend(), chipsBox, nudgeRow(clock, false)))
    );
  }

  function learnCreep(stage, api) {
    api.say('Now watch the short hand. Move the long hand from 2:00 towards 3:00.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('The short hand moves too', 'As the minutes go by, the short hand slides from the <b>2</b> towards the <b>3</b>.'));
    var disp = digital('2:00');
    var task = el('div', { class: 'ctm-task' }, 'Stop at ', el('b', null, '2:35'), '. Where is the short hand?');
    var bar = S('svg', { viewBox: '0 0 360 86', class: 'ctm-bar' });
    bar.appendChild(S('line', { x1: 30, y1: 40, x2: 330, y2: 40, class: 'ctm-bar-line' }));
    bar.appendChild(S('line', { x1: 180, y1: 26, x2: 180, y2: 54, class: 'ctm-bar-half' }));
    bar.appendChild(S('text', { x: 180, y: 76, class: 'ctm-bar-small', 'text-anchor': 'middle' }, 'halfway (2:30)'));
    bar.appendChild(S('text', { x: 30, y: 20, class: 'ctm-bar-big', 'text-anchor': 'middle' }, '2'));
    bar.appendChild(S('text', { x: 330, y: 20, class: 'ctm-bar-big', 'text-anchor': 'middle' }, '3'));
    bar.appendChild(S('line', { x1: 30, y1: 30, x2: 30, y2: 50, class: 'ctm-bar-end' }));
    bar.appendChild(S('line', { x1: 330, y1: 30, x2: 330, y2: 50, class: 'ctm-bar-end' }));
    var fill = S('line', { x1: 30, y1: 40, x2: 30, y2: 40, class: 'ctm-bar-fill' });
    var dot = S('circle', { cx: 30, cy: 40, r: 10, class: 'ctm-bar-dot' });
    bar.appendChild(fill);
    bar.appendChild(dot);
    var note = el('div', { class: 'ctm-note' }, 'Short hand: on the 2.');
    var done = false;
    var clock = makeClock({
      t: 120,
      minute: true,
      lo: 120,
      hi: 179,
      onChange: update,
      onEnd: function (t) {
        if (!done && minOf(t) === 35) {
          done = true;
          api.sound('correct');
          api.say('Look! At 2:35 the short hand is past halfway. But it has not reached 3. So it is still 2-something.', 'cheer');
          api.feedback('2:35 — past halfway to 3, but the hour is still 2.', 'good');
          task.classList.add('ctm-task-done');
          api.unlockNext();
        }
      },
    });
    if (clock.unbind) api.cleanup(clock.unbind);
    function update(t) {
      var m = minOf(t);
      disp.textContent = fmt(2, m);
      var x = 30 + (300 * m) / 60;
      dot.setAttribute('cx', x);
      fill.setAttribute('x2', x);
      if (m === 0) note.textContent = 'Short hand: on the 2.';
      else if (m < 30) note.textContent = 'Short hand: just past the 2. Still 2-something.';
      else if (m === 30) note.textContent = 'Short hand: halfway between 2 and 3. Still 2-something.';
      else if (m < 50) note.textContent = 'Short hand: past halfway, but not at 3 yet. Still 2-something!';
      else note.textContent = 'Short hand: nearly at 3, but not yet. Still 2-something!';
    }
    stage.appendChild(
      el('div', { class: 'ctm-row' },
        el('div', { class: 'ctm-clockbox' }, clock.svg),
        el('div', { class: 'ctm-side' }, disp, task, el('div', { class: 'ctm-side-lbl' }, 'Where the short hand is, from 2 to 3'), bar, note, nudgeRow(clock, false)))
    );
  }

  /** The "set the hands" panel shared by learn screen 3 and level 3. */
  function setter(stage, api, h, m, onCheck) {
    var clock = makeClock({ t: 0, minute: true, hour: true });
    if (clock.unbind) api.cleanup(clock.unbind);
    var check = el('button', { class: 'btn btn-check ctm-setcheck', type: 'button' }, 'Check');
    check.addEventListener('click', function () {
      if (clock.locked) return;
      if (!clock.touched) {
        api.feedback('Drag the hands first. Start with the long hand.', 'info');
        return;
      }
      onCheck(clock.t());
    });
    var side = el('div', { class: 'ctm-side' },
      el('div', { class: 'ctm-side-lbl' }, 'Make the clock show'),
      digital(fmt(h, m), 'ctm-target'),
      el('ol', { class: 'ctm-steps' },
        el('li', null, 'Drag the ', el('b', { class: 'ctm-c-min' }, 'long hand'), ' to ', el('b', null, m + ' minutes'), '.'),
        el('li', null, 'Drag the ', el('b', { class: 'ctm-c-hour' }, 'short hand'), ' to just past the ', el('b', null, String(h)), '.')),
      nudgeRow(clock, true),
      check);
    var wrap = el('div', { class: 'ctm-row', 'data-answer': fmt(h, m), 'data-kind': 'set' }, el('div', { class: 'ctm-clockbox' }, clock.svg, handKey()), side);
    stage.appendChild(wrap);
    return { clock: clock, side: side, check: check };
  }

  function learnSet(stage, api) {
    api.say('Your turn! Make the clock say 6:17. Long hand first, then the short hand.');
    api.lockNext();
    var ui = setter(stage, api, 6, 17, function (t) {
      if (t === toT(6, 17)) {
        ui.clock.lock();
        ui.check.disabled = true;
        ui.clock.showCount(17, { hour: 6 });
        ui.clock.showLabels(true);
        api.sound('correct');
        api.say('Perfect! 6:17. The short hand is just past the 6.', 'cheer');
        api.feedback('15 on the 3, then 16, 17 on the marks. Short hand just past 6.', 'good');
        api.unlockNext();
        return;
      }
      var dg = diagnoseSet(6, 17, t);
      api.sound('wrong');
      api.say('Nearly! Have another look.', 'think');
      api.feedback(dg.hint, 'try');
    });
  }

  /* ---------------- practice ---------------- */
  function renderPick(stage, api, q) {
    api.say(q.dot ? 'What time does this clock show? These times use a dot.' : 'What time does this clock show?', 'think');
    var clock = makeClock({ t: toT(q.h, q.m) });
    var side = el('div', { class: 'ctm-side' });
    side.appendChild(MQ.ui.prompt('What time is it?'));
    if (q.dot) side.appendChild(el('div', { class: 'ctm-dotnote' }, 'A dot works like two dots: ', el('b', null, '7.10'), ' is the same time as ', el('b', null, '7:10'), '.'));
    var ch = MQ.ui.choices(q.options.map(function (o) {
      return { label: '<span class="ctm-opt">' + o.label + '</span>', value: o.value };
    }), function (v) {
      var opt = q.options.filter(function (o) { return o.value === v; })[0];
      if (v === 'ok') {
        ch.mark(v, 'good');
        ch.disable();
        api.check(true, opt.label + '! Short hand past the ' + q.h + ', long hand on ' + q.m + ' minutes.');
        return;
      }
      ch.mark(v, 'bad');
      var strong = api.tries() >= 1;
      if (v === 'next') {
        api.check(false, strong ? 'The short hand is between ' + q.h + ' and ' + nextH(q.h) + '. It has not reached ' + nextH(q.h) + ', so the hour is ' + q.h + '.' : 'Look at the short hand. Has it reached the ' + nextH(q.h) + ' yet?', TAG.next);
      } else {
        api.check(false, strong ? 'Count in 5s on the numbers: 5, 10, 15 … The ' + q.m / 5 + ' means ' + q.m + ' minutes.' : 'The long hand points at the ' + q.m / 5 + ', but that is not ' + q.m / 5 + ' minutes. Each number is 5 minutes.', TAG.number);
      }
    }, { columns: 3 });
    side.appendChild(ch);
    var workBox = el('div');
    side.appendChild(workBox);
    stage.appendChild(el('div', { class: 'ctm-row', 'data-answer': fmt(q.h, q.m), 'data-kind': 'pick' }, el('div', { class: 'ctm-clockbox' }, clock.svg), side));
    api.onReveal(function () {
      ch.mark('ok', 'good');
      ch.disable();
      workBox.appendChild(working(clock, q.h, q.m));
      api.feedback(revealLine(q.h, q.m), 'info');
    });
  }

  function revealLine(h, m) {
    var fives = Math.floor(m / 5) * 5, ones = m - fives;
    var cnt = fives ? 'Count 5s on the numbers to ' + fives + (ones ? ', then ' + ones + ' more on the marks' : '') : (ones ? 'Count ' + ones + ' marks past the 12' : 'The long hand is on the 12');
    return cnt + '. The short hand ' + (m ? 'has passed' : 'is on') + ' the ' + h + '. It is ' + fmt(h, m) + '.';
  }

  function renderRead(stage, api, q) {
    api.say('Read the clock to the exact minute. Type the time.', 'think');
    var clock = makeClock({ t: toT(q.h, q.m) });
    var side = el('div', { class: 'ctm-side' });
    side.appendChild(MQ.ui.prompt('What time is it? Type it like <b>6:35</b>.'));
    var workBox = el('div');
    var box = timeBox(api, function (r) {
      if (r.h === q.h && r.m === q.m) {
        box.done(fmt(q.h, q.m), true);
        api.check(true, fmt(q.h, q.m) + '! ' + (q.m > 30 ? 'The hour is still ' + q.h + '.' : 'Well read!'));
        return;
      }
      box.bad();
      var dg = diagnoseRead(q.h, q.m, r.h, r.m);
      api.check(false, api.tries() >= 1 ? dg.strong : dg.hint, dg.tag);
    });
    side.appendChild(box.el);
    side.appendChild(workBox);
    stage.appendChild(el('div', { class: 'ctm-row', 'data-answer': fmt(q.h, q.m), 'data-kind': 'read' }, el('div', { class: 'ctm-clockbox' }, clock.svg), side));
    api.onReveal(function () {
      box.done(fmt(q.h, q.m), true);
      workBox.appendChild(working(clock, q.h, q.m));
      api.feedback(revealLine(q.h, q.m), 'info');
    });
  }

  function renderSpoken(stage, api, q) {
    api.say('Bolt heard someone say a time. Write it in digits.', 'think');
    var side = el('div', { class: 'ctm-side ctm-side-wide' });
    side.appendChild(el('div', { class: 'ctm-speech' }, '“', q.text.charAt(0).toUpperCase() + q.text.slice(1), '”'));
    side.appendChild(MQ.ui.prompt('Write this time in digits, like <b>6:35</b>.'));
    var workBox = el('div', { class: 'ctm-spoken-work' });
    var box = timeBox(api, function (r) {
      if (r.h === q.h && r.m === q.m) {
        box.done(fmt(q.h, q.m), true);
        api.check(true, q.text.charAt(0).toUpperCase() + q.text.slice(1) + ' is ' + fmt(q.h, q.m) + '!');
        return;
      }
      box.bad();
      var strong = api.tries() >= 1;
      var ph = q.ph;
      if (ph.d === 'to' && r.m === ph.n) {
        api.check(false, strong ? ph.n + ' minutes TO ' + q.named + ' is the same as ' + q.m + ' minutes PAST ' + q.h + '. Count on from 12 to where the long hand would be.' : '"' + ph.w + '" means ' + ph.n + ' minutes before ' + q.named + ' o\'clock, not ' + ph.n + ' minutes past.', TAG.toPast);
      } else if (ph.d === 'to' && r.h === q.named) {
        api.check(false, strong ? 'It is ' + ph.n + ' minutes before ' + q.named + ' o\'clock, so it is still ' + q.h + '-something.' : 'It is not ' + q.named + ' o\'clock yet! The hour is the one before ' + q.named + '.', TAG.next);
      } else if (r.m === q.m) {
        api.check(false, 'The minutes are right. Check the hour: ' + (ph.d === 'to' ? 'it is still the hour before ' + q.named + '.' : 'it is past ' + q.named + '.'), TAG.hour);
      } else {
        api.check(false, strong ? (ph.d === 'past' ? ph.w.replace(' past', '') + ' past means ' + ph.n + ' minutes after the hour.' : ph.n + ' minutes to the hour = 60 − ' + ph.n + ' = ' + q.m + ' minutes past.') : (ph.n === 15 ? 'A quarter of an hour is 15 minutes. ' : '') + 'Think where the long hand would point.', TAG.minute);
      }
    });
    side.appendChild(box.el);
    stage.appendChild(el('div', { class: 'ctm-row', 'data-answer': fmt(q.h, q.m), 'data-kind': 'spoken' }, side, workBox));
    api.onReveal(function () {
      box.done(fmt(q.h, q.m), true);
      var clock = makeClock({ t: toT(q.h, q.m) });
      var ph = q.ph;
      var extra = ph.d === 'to'
        ? '<b>' + ph.w + ' ' + HOUR_WORDS[q.named] + '</b> = ' + ph.n + ' minutes before ' + q.named + ' o\'clock (orange part). From 12 that is ' + q.m + ' minutes past ' + q.h + '.'
        : '<b>' + ph.w + ' ' + HOUR_WORDS[q.named] + '</b> = ' + ph.n + ' minutes after ' + q.named + ' o\'clock.';
      var w = working(clock, q.h, q.m, extra);
      if (ph.d === 'to') clock.showCount(q.m, { hour: q.h, to: true });
      workBox.appendChild(el('div', { class: 'ctm-row ctm-row-tight' }, el('div', { class: 'ctm-clockbox ctm-clockbox-sm' }, clock.svg), w));
      api.feedback(ph.d === 'to' ? ph.n + ' minutes to ' + q.named + ' is ' + q.m + ' minutes past ' + q.h + ': ' + fmt(q.h, q.m) + '.' : ph.n + ' minutes past ' + q.named + ' is ' + fmt(q.h, q.m) + '.', 'info');
    });
  }

  function renderSet(stage, api, q) {
    api.say(q.m >= 50 ? 'Set the clock. Careful: it is nearly the next hour!' : 'Set the clock to this time. Long hand first.', 'think');
    var ui = setter(stage, api, q.h, q.m, function (t) {
      if (t === toT(q.h, q.m)) {
        ui.clock.lock();
        ui.check.disabled = true;
        api.check(true, fmt(q.h, q.m) + '! ' + (q.m >= 30 ? 'The short hand is close to the ' + nextH(q.h) + ' but not on it.' : 'The short hand is just past the ' + q.h + '.'));
        return;
      }
      var dg = diagnoseSet(q.h, q.m, t);
      api.check(false, api.tries() >= 1 ? dg.strong : dg.hint, dg.tag);
    });
    var workBox = el('div');
    ui.side.appendChild(workBox);
    api.onReveal(function () {
      ui.clock.set(toT(q.h, q.m));
      ui.clock.lock();
      ui.check.disabled = true;
      var w = working(ui.clock, q.h, q.m);
      MQ.clear(ui.side);
      ui.side.appendChild(el('div', { class: 'ctm-side-lbl' }, 'This is ' + fmt(q.h, q.m)));
      ui.side.appendChild(w);
      api.feedback(revealLine(q.h, q.m), 'info');
    });
  }

  MQ.register(ID, {
    learn: [learnMinutes, learnCreep, learnSet],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'pick') renderPick(stage, api, q);
        else if (q.type === 'read') renderRead(stage, api, q);
        else if (q.type === 'spoken') renderSpoken(stage, api, q);
        else renderSet(stage, api, q);
      },
    },
  });

  // Harmless hooks for automated tests (no effect on the page).
  MQ._ctm = { buildDeck: buildDeck, parseTime: parseTime, diagnoseRead: diagnoseRead, diagnoseSet: diagnoseSet, deck: function () { return deck; } };

  var css = [
    '.ctm-row{display:flex;align-items:center;justify-content:center;gap:24px;flex-wrap:wrap;width:100%}',
    '.ctm-row-tight{gap:14px}',
    '.ctm-clockbox{display:flex;flex-direction:column;align-items:center;gap:6px;flex:none;width:330px;max-width:100%}',
    '.ctm-clockbox-sm{width:250px}',
    '.ctm-clock{display:block;width:100%;height:auto;user-select:none;-webkit-user-select:none;touch-action:none}',
    '.ctm-shadow{fill:rgba(27,42,74,.10)}',
    '.ctm-rim{fill:#fff;stroke:#c8553d;stroke-width:12}',
    '.ctm-face{fill:#fffdf6}',
    '.ctm-tick{stroke:#8792a8;stroke-width:1.6;stroke-linecap:round}',
    '.ctm-tick-big{stroke:#1b2a4a;stroke-width:3.6}',
    '.ctm-tick-one{stroke:#e8590c;stroke-width:4}',
    '.ctm-num{font-size:26px;font-weight:800;fill:#1b2a4a;font-family:var(--font)}',
    '.ctm-lab{font-size:13px;font-weight:700;fill:#8a94a8;font-family:var(--font)}',
    '.ctm-lab-on{fill:#1d5fc9;font-weight:900;font-size:15px}',
    '.ctm-hour-line{stroke:#1b2a4a;stroke-width:11;stroke-linecap:round}',
    '.ctm-min-line{stroke:#2f6fde;stroke-width:6;stroke-linecap:round}',
    '.ctm-cap{fill:#c8553d;stroke:#fff;stroke-width:2}',
    '.ctm-knob{opacity:0;transition:opacity .15s}',
    '.ctm-live .ctm-knob{opacity:.9}',
    '.ctm-knob-min{fill:#2f6fde;stroke:#fff;stroke-width:2}',
    '.ctm-knob-hour{fill:#1b2a4a;stroke:#fff;stroke-width:2}',
    '.ctm-live{cursor:grab}',
    '.ctm-grab-min,.ctm-grab-hour{cursor:grabbing}',
    '.ctm-grab-min .ctm-min-line{stroke:#1b4fb0}',
    '.ctm-wedge{fill:rgba(47,111,222,.15);stroke:none}',
    '.ctm-wedge-to{fill:rgba(232,89,12,.16);stroke:none}',
    '.ctm-hourband{fill:none;stroke:rgba(255,183,3,.35);stroke-width:34;stroke-linecap:round}',
    '.ctm-side{display:flex;flex-direction:column;align-items:center;gap:12px;width:380px;max-width:100%}',
    '.ctm-side-wide{width:420px}',
    '.ctm-side .prompt{font-size:1.3rem}',
    '.ctm-side .choices{max-width:380px}',
    '.ctm-side-lbl{font-weight:800;color:var(--ink-soft);font-size:.95rem;text-align:center}',
    '.ctm-digital{font-family:"Courier New",ui-monospace,monospace;font-weight:700;font-size:2.8rem;letter-spacing:.06em;background:#1b2a4a;color:#7cf0b2;border-radius:14px;padding:4px 22px;min-width:170px;text-align:center;border:4px solid #c9d3ee;line-height:1.2}',
    '.ctm-digital-sm{font-size:1.7rem;padding:2px 14px;min-width:0;display:inline-block;vertical-align:middle;border-width:3px}',
    '.ctm-target{color:#ffd166}',
    '.ctm-task{font-size:1.15rem;font-weight:700;text-align:center;background:#fff8e6;border:2px dashed #ffb703;border-radius:12px;padding:8px 12px}',
    '.ctm-task-done{background:var(--good-bg);border-color:var(--good);border-style:solid}',
    '.ctm-legend{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center;font-weight:700;color:var(--ink-soft);font-size:.95rem}',
    '.ctm-chipbox{min-height:76px;display:flex;align-items:flex-start;justify-content:center;width:100%}',
    '.ctm-chips{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;align-items:center;max-width:380px}',
    '.ctm-chip{display:inline-block;min-width:30px;text-align:center;border-radius:10px;padding:2px 7px;font-weight:800;font-size:1rem;animation:ctm-in .25s ease both}',
    '.ctm-chip-five{background:#e3ecff;color:#1d5fc9;border:2px solid #9db8ef}',
    '.ctm-chip-one{background:#fff1e6;color:#b33f00;border:2px solid #f3a77a}',
    '.ctm-eq{font-weight:800;font-size:1.05rem;margin-left:4px}',
    '@keyframes ctm-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}',
    '.ctm-nudge{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}',
    '.ctm-nudge-grp{display:flex;align-items:center;gap:6px;background:var(--paper);border:2px solid var(--line);border-radius:12px;padding:5px 8px}',
    '.ctm-nudge-lbl{font-weight:800;font-size:.85rem}',
    '.ctm-lbl-hour,.ctm-c-hour{color:#1b2a4a}',
    '.ctm-lbl-min,.ctm-c-min{color:#2f6fde}',
    '.ctm-nbtn{min-height:38px;padding:4px 10px;font-size:.9rem;background:#fff;color:var(--ink);border:2px solid var(--line)}',
    '.ctm-setcheck{min-width:140px}',
    '.ctm-steps{margin:0;padding-left:22px;font-size:1.05rem;font-weight:700;text-align:left}',
    '.ctm-steps li{margin:3px 0}',
    '.ctm-key{display:flex;gap:12px;font-size:.85rem;font-weight:800;flex-wrap:wrap;justify-content:center}',
    '.ctm-key-hour{color:#1b2a4a}',
    '.ctm-key-min{color:#2f6fde}',
    '.ctm-bar{display:block;width:340px;max-width:100%;height:auto}',
    '.ctm-bar-line{stroke:#c9d3ee;stroke-width:10;stroke-linecap:round}',
    '.ctm-bar-fill{stroke:#ffb703;stroke-width:10;stroke-linecap:round}',
    '.ctm-bar-half{stroke:#4a5a7d;stroke-width:2;stroke-dasharray:4 3}',
    '.ctm-bar-end{stroke:#1b2a4a;stroke-width:3}',
    '.ctm-bar-dot{fill:#1b2a4a;stroke:#fff;stroke-width:3}',
    '.ctm-bar-big{font-size:22px;font-weight:900;fill:#1b2a4a;font-family:var(--font)}',
    '.ctm-bar-small{font-size:13px;font-weight:700;fill:#4a5a7d;font-family:var(--font)}',
    '.ctm-note{font-size:1.1rem;font-weight:800;text-align:center;min-height:2.6em}',
    '.ctm-opt{font-family:"Courier New",ui-monospace,monospace;font-size:1.6rem;font-weight:700}',
    '.ctm-dotnote{font-size:.95rem;font-weight:700;color:var(--ink-soft);text-align:center}',
    '.ctm-time-input{width:150px;letter-spacing:.04em}',
    '.ctm-speech{font-size:1.7rem;font-weight:900;background:#fff;border:3px solid var(--line);border-radius:18px;padding:12px 22px;text-align:center}',
    '.ctm-work{display:flex;flex-direction:column;align-items:center;gap:6px;max-width:400px}',
    '.ctm-work-line{margin:0;font-size:1rem;text-align:center}',
    '.ctm-work-ans{font-weight:800;font-size:1.1rem;display:flex;align-items:center;gap:8px}',
    '@media (max-width:640px){.ctm-clockbox{width:280px}.ctm-digital{font-size:2.2rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

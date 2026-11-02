/* Five-Minute Ring — read an analogue clock to the minute by counting the numbers in
 * fives (jumps round an outer ring: 5, 10, 15 ...) and then the small marks in ones (Unit 8.1).
 * Clocks use the shared Unit 8 look (white face, 60 ticks, long orange minute hand,
 * short dark hour hand at (h % 12) * 30 + m * 0.5 degrees). All drawings are original.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;
  var uid = 0;

  /* ---------------- shared Unit 8 clock (prefix fm-) ---------------- */
  function fmPoint(cx, cy, d, deg) {
    var a = (deg * Math.PI) / 180;
    return { x: Math.round((cx + d * Math.sin(a)) * 100) / 100, y: Math.round((cy - d * Math.cos(a)) * 100) / 100 };
  }
  function fmDigital(h, m) {
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  function fmNextHour(h) {
    return h === 12 ? 1 : h + 1;
  }
  function fmPrevHour(h) {
    return h === 1 ? 12 : h - 1;
  }
  /** In this activity every time is read as "past" (as the notes ask). */
  function fmPast(h, m) {
    if (m === 0) return h + " o'clock";
    return m + (m === 1 ? ' minute' : ' minutes') + ' past ' + h;
  }

  /**
   * makeClock({ r, hour, minute, ring: true, ringVisible, showHour, showMinute, width })
   * Extended from the Unit 8 clock reference: outer ring of 5, 10 ... 60 labels that can be
   * lit one jump at a time, dots on single minute marks, clickable numbers and marks.
   */
  function makeClock(o) {
    var r = o.r || 120;
    var pad = 48;
    var size = 2 * (r + pad);
    var cx = size / 2;
    var cy = size / 2;
    var id = ++uid;
    var root = S('svg', { viewBox: '0 0 ' + size + ' ' + size, width: o.width || 310, class: 'fm-clock', style: { maxWidth: '100%', height: 'auto' } });
    var defs = S('defs', null, S('marker', { id: 'fm-arr-' + id, viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto-start-reverse' }, S('path', { d: 'M0,0 L10,5 L0,10 Z', fill: '#0b6e66' })));
    root.appendChild(defs);
    root.appendChild(S('circle', { cx: cx, cy: cy, r: r, fill: '#fff', stroke: '#1b2a4a', 'stroke-width': 5 }));
    var under = S('g', { class: 'fm-under' });
    root.appendChild(under);
    for (var t = 0; t < 60; t++) {
      var big = t % 5 === 0;
      var p1 = fmPoint(cx, cy, r - 4, t * 6);
      var p2 = fmPoint(cx, cy, r - (big ? 16 : 9), t * 6);
      root.appendChild(S('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: '#1b2a4a', 'stroke-width': big ? 3 : 1.4, 'stroke-linecap': 'round' }));
    }
    var ringG = S('g', { class: 'fm-ring' });
    var ringLabels = {};
    for (var n = 1; n <= 12; n++) {
      var q = fmPoint(cx, cy, r * 0.72, n * 30);
      root.appendChild(S('text', { x: q.x, y: q.y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': Math.round(r * 0.19), 'font-weight': 800, fill: '#1b2a4a', class: 'fm-num' }, String(n)));
      var rq = fmPoint(cx, cy, r + 28, n * 30);
      ringLabels[n] = S('text', { x: rq.x, y: rq.y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': Math.round(r * 0.15), 'font-weight': 800, class: 'fm-ring-num' }, String(n * 5));
      ringG.appendChild(ringLabels[n]);
    }
    root.appendChild(ringG);
    if (!o.ring || o.ringVisible === false) ringG.style.display = 'none';
    var jumps = S('g', { class: 'fm-jumps' });
    var dots = S('g', { class: 'fm-dots' });
    root.appendChild(jumps);
    root.appendChild(dots);
    var hourHand = S('line', { x1: cx, y1: cy, x2: cx, y2: cy - r * 0.5, stroke: '#1b2a4a', 'stroke-width': r * 0.075, 'stroke-linecap': 'round', class: 'fm-hour' });
    var minuteHand = S('line', { x1: cx, y1: cy, x2: cx, y2: cy - r * 0.82, stroke: '#e85d04', 'stroke-width': r * 0.045, 'stroke-linecap': 'round', class: 'fm-minute' });
    if (o.showHour !== false) root.appendChild(hourHand);
    if (o.showMinute !== false) root.appendChild(minuteHand);
    root.appendChild(S('circle', { cx: cx, cy: cy, r: r * 0.05, fill: '#1b2a4a' }));
    var hits = S('g', { class: 'fm-hits' });
    root.appendChild(hits);

    function setHand(line, len, deg) {
      var p = fmPoint(cx, cy, len, deg);
      line.setAttribute('x2', p.x);
      line.setAttribute('y2', p.y);
    }
    var api = {
      svg: root,
      r: r,
      cx: cx,
      cy: cy,
      minuteHand: minuteHand,
      hourHand: hourHand,
      setTime: function (h, m) {
        setHand(hourHand, r * 0.5, (h % 12) * 30 + m * 0.5);
        setHand(minuteHand, r * 0.82, m * 6);
        root.setAttribute('data-h', h);
        root.setAttribute('data-m', m);
      },
      setMinuteAngle: function (deg) {
        setHand(minuteHand, r * 0.82, deg);
      },
      showRing: function (v) {
        ringG.style.display = v ? '' : 'none';
      },
      /** light ring label n (n*5 minutes) and draw the jump arrow from n-1 to n */
      lightJump: function (n) {
        ringLabels[n].classList.add('fm-lit');
        var a0 = (n - 1) * 30;
        var a1 = n * 30;
        var p0 = fmPoint(cx, cy, r + 6, a0 + 3);
        var p1 = fmPoint(cx, cy, r + 8, a1 - 4);
        var c = fmPoint(cx, cy, r + 44, (a0 + a1) / 2);
        jumps.appendChild(S('path', { d: 'M' + p0.x + ',' + p0.y + ' Q' + c.x + ',' + c.y + ' ' + p1.x + ',' + p1.y, class: 'fm-jump', 'marker-end': 'url(#fm-arr-' + id + ')' }));
      },
      /** a dot on the small mark for minute t */
      lightDot: function (t) {
        var p = fmPoint(cx, cy, r - 7, t * 6);
        dots.appendChild(S('circle', { cx: p.x, cy: p.y, r: 4.6, class: 'fm-dot' }));
      },
      /** pale circle behind clock number n (the number the short hand has passed) */
      markNumber: function (n, cls) {
        var p = fmPoint(cx, cy, r * 0.72, n * 30);
        under.appendChild(S('circle', { cx: p.x, cy: p.y, r: r * 0.15, class: cls || 'fm-hourmark' }));
      },
      /** shade the slice of the face between two angles */
      sector: function (a0, a1, cls) {
        var p0 = fmPoint(cx, cy, r - 2, a0);
        var p1 = fmPoint(cx, cy, r - 2, a1);
        under.appendChild(S('path', { d: 'M' + cx + ',' + cy + ' L' + p0.x + ',' + p0.y + ' A' + (r - 2) + ',' + (r - 2) + ' 0 0 1 ' + p1.x + ',' + p1.y + ' Z', class: cls || 'fm-sector' }));
      },
      clearLights: function () {
        MQ.clear(jumps);
        MQ.clear(dots);
        MQ.clear(under);
        for (var k = 1; k <= 12; k++) ringLabels[k].classList.remove('fm-lit');
      },
      /** big invisible click targets over the numbers 1-12 */
      addNumberHits: function (cb) {
        for (var k = 1; k <= 12; k++) {
          (function (num) {
            var p = fmPoint(cx, cy, r * 0.72, num * 30);
            var c = S('circle', { cx: p.x, cy: p.y, r: r * 0.16, class: 'fm-hit', 'data-num': num });
            c.addEventListener('click', function () {
              cb(num, c);
            });
            hits.appendChild(c);
          })(k);
        }
      },
      /** fat wedge-shaped click targets over the small minute marks (not on the numbers) */
      addMarkHits: function (cb) {
        for (var k = 1; k < 60; k++) {
          if (k % 5 === 0) continue;
          (function (min) {
            var a = min * 6;
            var pts = [fmPoint(cx, cy, r - 24, a - 3), fmPoint(cx, cy, r + 12, a - 3), fmPoint(cx, cy, r + 12, a + 3), fmPoint(cx, cy, r - 24, a + 3)];
            var poly = S('polygon', { points: pts.map(function (p) { return p.x + ',' + p.y; }).join(' '), class: 'fm-hit fm-mhit', 'data-min': min });
            poly.addEventListener('click', function () {
              cb(min, poly);
            });
            hits.insertBefore(poly, hits.firstChild);
          })(k);
        }
      },
    };
    api.setTime(o.hour || 12, o.minute || 0);
    return api;
  }

  /* ---------------- small UI helpers ---------------- */
  function chipRow() {
    var row = el('div', { class: 'fm-chips' });
    row.add = function (text, cls) {
      var c = el('span', { class: 'chip fm-chip' + (cls ? ' ' + cls : '') }, String(text));
      row.appendChild(c);
      return c;
    };
    row.arrow = function () {
      row.appendChild(el('span', { class: 'fm-arrow' }, '→'));
    };
    return row;
  }

  function digitalBox(text) {
    return el('div', { class: 'fm-digital' }, text);
  }

  function shake(inp) {
    inp.classList.remove('shake');
    void inp.offsetWidth;
    inp.classList.add('shake');
  }

  /** Two small boxes  [hh] : [mm]  + Check. Accepts 8 or 08, and "8:16" typed in the first box. */
  function timeInput(onSubmit) {
    var hh = el('input', { class: 'num-input fm-hh', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: 5, 'aria-label': 'Hour', placeholder: 'hour' });
    var mm = el('input', { class: 'num-input fm-mm', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: 2, 'aria-label': 'Minutes', placeholder: 'min' });
    var btn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    var wrap = el('div', { class: 'num-row fm-timein' }, hh, el('span', { class: 'fm-colon' }, ':'), mm, btn);
    function submit() {
      if (hh.disabled) return;
      var a = hh.value.trim();
      var b = mm.value.trim();
      if (a.indexOf(':') !== -1 || a.indexOf('.') !== -1) {
        var parts = a.split(/[:.]/);
        a = parts[0].trim();
        if (!b) b = (parts[1] || '').trim();
      }
      if (!/^\d{1,2}$/.test(a)) {
        shake(hh);
        hh.focus();
        return;
      }
      if (!/^\d{1,2}$/.test(b)) {
        shake(mm);
        mm.focus();
        return;
      }
      onSubmit(parseInt(a, 10), parseInt(b, 10));
    }
    btn.addEventListener('click', submit);
    hh.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      } else if ((e.key === ':' || e.key === 'Tab') && hh.value.trim() && hh.value.indexOf(':') === -1 && !e.shiftKey) {
        e.preventDefault();
        mm.focus();
      }
    });
    mm.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    });
    return {
      el: wrap,
      focus: function () {
        setTimeout(function () {
          try {
            hh.focus({ preventScroll: true });
          } catch (e) {
            hh.focus();
          }
        }, 30);
      },
      disable: function () {
        hh.disabled = mm.disabled = btn.disabled = true;
      },
      setValue: function (h, m) {
        hh.value = String(h);
        mm.value = (m < 10 ? '0' : '') + m;
      },
      mark: function (hourOk, minOk) {
        hh.classList.remove('good', 'bad');
        mm.classList.remove('good', 'bad');
        hh.classList.add(hourOk ? 'good' : 'bad');
        mm.classList.add(minOk ? 'good' : 'bad');
      },
    };
  }

  /* ---------------- maths shared by questions, hints and reveal ---------------- */
  /** the clock number the long hand is on or has just passed (12 for 0-4 minutes) */
  function minuteNumber(m) {
    var n = Math.floor(m / 5);
    return n === 0 ? 12 : n;
  }
  /** numbers the long hand is next to (the one passed and the one it is heading for) */
  function minuteNeighbours(m) {
    var a = minuteNumber(m);
    return m % 5 === 0 ? [a] : [a, a === 12 ? 1 : a + 1];
  }

  /**
   * Diagnose a wrong answer. hour === null when only the minutes were asked.
   * Returns { tag, hint } where hint has a gentle first-try and a stronger second-try form.
   */
  function diagnose(q, hour, min, second) {
    var h = q.h;
    var m = q.m;
    var fives = Math.floor(m / 5);
    var ones = m % 5;
    var near = minuteNeighbours(m);
    var hourHandMin = (h % 12) * 5 + m / 12; // where the short hand points, in minute marks
    var upTo = fives ? 'Count 5, 10, 15 … in jumps up to the ' + (fives === 12 ? 12 : fives) + ' (that is ' + fives * 5 + ')' : 'The long hand has not reached the 1 yet';
    var onesTxt = ones ? ', then count the little marks on in ones.' : '.';

    // swapped hands (needs an hour answer)
    if (hour !== null && hour !== h && near.indexOf(hour) !== -1 && (Math.abs(min - hourHandMin) <= 4 || min === h || min === h * 5 || min === fmNextHour(h) * 5)) {
      return {
        tag: 'Swapped hour and minute hands',
        hint: second ? 'Look at the hands again: the LONG orange hand gives the minutes, the SHORT dark hand gives the hour. The short hand has just passed the ' + h + '.' : 'Careful: you read the hands the wrong way round. Long orange hand = minutes, short dark hand = hour.',
      };
    }
    if (hour === null && min === h && h !== fives && min !== m) {
      return {
        tag: 'Swapped hour and minute hands',
        hint: second ? 'The ' + h + ' is where the SHORT hand points (that is the hour). Follow the LONG orange hand. ' + upTo + onesTxt : 'That is the short hand’s number. Minutes come from the long orange hand.',
      };
    }
    if (hour !== null && hour !== h) {
      if (hour === fmNextHour(h)) {
        return {
          tag: 'Read the hour it is nearly at',
          hint: second ? 'The short hand is between ' + h + ' and ' + fmNextHour(h) + '. It has not reached ' + fmNextHour(h) + ' yet, so the hour is still ' + h + '.' : 'The short hand is close to ' + hour + ', but has it got there yet? Use the number it has just passed.',
        };
      }
      if (hour === fmPrevHour(h)) {
        return {
          tag: 'Read the wrong hour',
          hint: second ? 'The short hand has already gone past the ' + h + '. So the hour is ' + h + '.' : 'Look again at the short hand. Which number has it JUST passed?',
        };
      }
      return {
        tag: 'Read the wrong hour',
        hint: second ? 'Follow the short dark hand: it has just passed the ' + h + '.' : 'Find the short dark hand. Which number has it just passed? That is the hour.',
      };
    }
    // the hour is right (or not asked): look at the minutes
    if (min === m) return { tag: '', hint: '' };
    if (near.indexOf(min) !== -1 || (fives && min === fives)) {
      return {
        tag: 'Read the number not the minutes',
        hint: second ? upTo + onesTxt : 'The long hand is near the ' + min + ', but that is not ' + min + ' minutes. Each number is 5 minutes: count in fives.',
      };
    }
    if (fives >= 2 && ones && min === fives + ones) {
      return {
        tag: 'Counted numbers in 1s not 5s',
        hint: second ? upTo + onesTxt : 'Each number is worth 5 minutes, not 1. Jump 5, 10, 15 … along the numbers.',
      };
    }
    if (Math.abs(min - m) <= 3 && Math.floor(min / 5) === fives) {
      return {
        tag: 'Miscounted the small marks',
        hint: second ? 'Start at ' + fives * 5 + ' and count each little mark: ' + (fives * 5 + 1) + ', ' + (fives * 5 + 2) + ' … stop at the long hand.' : 'So close! Count the little marks one at a time, from ' + (fives ? 'the ' + fives + ' (' + fives * 5 + ')' : 'the 12') + ' to the long hand.',
      };
    }
    if (Math.abs(min - m) <= 4) {
      return {
        tag: 'Miscounted the small marks',
        hint: second ? upTo + onesTxt : 'Nearly! Has the long hand really reached the next number? Count the jumps, then the little marks.',
      };
    }
    if (min > 0 && min % 5 === 0 && Math.abs(min - m) <= 10) {
      return {
        tag: 'Miscounted the five-jumps',
        hint: second ? upTo + onesTxt : 'Count the jumps again carefully: 5, 10, 15 … one jump for each number.',
      };
    }
    return {
      tag: 'Miscounted the five-jumps',
      hint: second ? upTo + onesTxt : 'Follow the long orange hand. Count in fives along the numbers it has passed, then in ones.',
    };
  }

  /** Animate the working on a clock: five-jumps, then single marks, then the hour. */
  function animateWorking(api, clock, q, chips, after) {
    clock.clearLights();
    clock.showRing(true);
    MQ.clear(chips);
    var fives = Math.floor(q.m / 5);
    var ones = q.m % 5;
    var steps = [];
    for (var n = 1; n <= fives; n++)
      (function (k) {
        steps.push(function () {
          clock.lightJump(k);
          chips.add(k * 5, 'fm-chip-five');
        });
      })(n);
    for (var t = 1; t <= ones; t++)
      (function (k) {
        steps.push(function () {
          if (k === 1 && fives) chips.arrow();
          clock.lightDot(fives * 5 + k);
          chips.add(fives * 5 + k, 'fm-chip-one');
        });
      })(t);
    steps.push(function () {
      clock.markNumber(q.h);
      if (after) after();
    });
    var i = 0;
    (function run() {
      if (i >= steps.length) return;
      steps[i++]();
      api.later(run, i <= fives ? 260 : 380);
    })();
  }

  /* ---------------- learn screens ---------------- */
  function layout(stage) {
    var clockBox = el('div', { class: 'fm-clockbox' });
    var side = el('div', { class: 'fm-side' });
    stage.appendChild(el('div', { class: 'fm-wrap' }, clockBox, side));
    return { clockBox: clockBox, side: side };
  }

  function learnRing(stage, api) {
    api.lockNext();
    api.say('Each number on the clock is worth 5 minutes. Click the numbers in order, starting at 1.');
    stage.appendChild(MQ.ui.lesson('Counting round in fives', 'Click <b>1</b>, then <b>2</b>, then <b>3</b> … all the way to <b>12</b>.'));
    var L = layout(stage);
    var clock = makeClock({ ring: true, hour: 12, minute: 0, showHour: false });
    clock.svg.classList.add('fm-ring-faint');
    L.clockBox.appendChild(clock.svg);
    var big = el('div', { class: 'fm-big' }, '0');
    var bigLabel = el('div', { class: 'fm-biglabel' }, 'minutes');
    var chips = chipRow();
    L.side.appendChild(el('div', { class: 'fm-count' }, big, bigLabel));
    L.side.appendChild(chips);
    var nextN = 1;
    clock.addNumberHits(function (n) {
      if (nextN > 12) return;
      if (n !== nextN) {
        api.sound('wrong');
        api.feedback('Jump to the next number in order: click the ' + nextN + '.', 'try');
        return;
      }
      api.sound('pop');
      clock.lightJump(n);
      clock.setMinuteAngle(n * 30);
      chips.add(n * 5, 'fm-chip-five');
      big.textContent = String(n * 5);
      nextN++;
      if (n === 12) {
        bigLabel.textContent = 'minutes = 1 whole hour';
        api.say('60! Twelve jumps of 5 make 60 minutes: one whole hour.', 'cheer');
        api.feedback('5, 10, 15 … 60. Counting in fives round the clock is the 5 times table!', 'good');
        api.unlockNext();
      } else {
        api.say(n * 5 + '!', 'happy');
        api.feedback('The long hand on the ' + n + ' means ' + n * 5 + ' minutes past.', 'info');
      }
    });
  }

  function learnMarks(stage, api) {
    api.lockNext();
    var q = { h: 9, m: 23 };
    api.say('The long hand is between 4 and 5. First count the numbers in fives: click 1, 2, 3, 4.');
    stage.appendChild(MQ.ui.lesson('Fives, then ones', 'Count in <b>fives</b> up to the 4. Then click the <b>little marks</b> one at a time.'));
    var L = layout(stage);
    var clock = makeClock({ ring: true, hour: q.h, minute: q.m });
    clock.svg.classList.add('fm-ring-faint');
    L.clockBox.appendChild(clock.svg);
    var big = el('div', { class: 'fm-big' }, '0');
    var bigLabel = el('div', { class: 'fm-biglabel' }, 'minutes');
    var chips = chipRow();
    L.side.appendChild(el('div', { class: 'fm-count' }, big, bigLabel));
    L.side.appendChild(chips);
    var result = el('div', { class: 'fm-result' });
    L.side.appendChild(result);
    var nextN = 1;
    var nextMark = 21;
    clock.addMarkHits(function (min) {
      if (nextMark > 23) return;
      if (nextN <= 4) {
        api.sound('wrong');
        api.feedback('First the fives: click the number ' + nextN + '.', 'try');
        return;
      }
      if (min !== nextMark) {
        api.sound('wrong');
        api.feedback(min > nextMark ? 'Not so fast! Click the very next little mark after ' + (nextMark - 1) + '.' : 'Go forwards: click the little mark just after ' + (nextMark - 1) + '.', 'try');
        return;
      }
      api.sound('pop');
      if (min === 21) chips.arrow();
      clock.lightDot(min);
      chips.add(min, 'fm-chip-one');
      big.textContent = String(min);
      nextMark++;
      if (min === 23) {
        bigLabel.textContent = 'minutes past';
        result.appendChild(el('div', { class: 'fm-words' }, '23 minutes past'));
        api.say('We stopped at the long hand: 23 minutes past!', 'cheer');
        api.feedback('Fives to 20, then ones: 21, 22, 23. So it is 23 minutes past.', 'good');
        api.unlockNext();
      } else {
        api.say(String(min), 'happy');
        api.feedback('Keep counting the little marks in ones until you reach the long hand.', 'info');
      }
    });
    clock.addNumberHits(function (n) {
      if (nextN > 4) {
        if (n === 5) {
          api.sound('wrong');
          api.feedback('The long hand has not reached the 5 yet. Now click the little marks after 20.', 'try');
        } else api.feedback('Now click the little marks after 20, one at a time.', 'info');
        return;
      }
      if (n !== nextN) {
        api.sound('wrong');
        api.feedback('Count in order: click the ' + nextN + '.', 'try');
        return;
      }
      api.sound('pop');
      clock.lightJump(n);
      chips.add(n * 5, 'fm-chip-five');
      big.textContent = String(n * 5);
      nextN++;
      if (n === 4) {
        api.say('20. The long hand is past the 4 but not at the 5. Now click the little marks one by one.', 'think');
        api.feedback('Click the little marks after the 4: 21, 22, 23 … stop at the long hand.', 'info');
      } else {
        api.say(n * 5 + '!', 'happy');
      }
    });
  }

  function learnHour(stage, api) {
    api.lockNext();
    var q = { h: 7, m: 50 };
    api.say('Now the short hand. It is very close to 8. Which number has it JUST gone past?', 'think');
    stage.appendChild(MQ.ui.lesson('Which hour?', 'The hour is the number the short hand has <b>just passed</b>, not the one it is nearest to.'));
    var L = layout(stage);
    var clock = makeClock({ ring: true, hour: q.h, minute: q.m });
    L.clockBox.appendChild(clock.svg);
    for (var n = 1; n <= 10; n++) clock.lightJump(n);
    clock.sector(q.h * 30, fmNextHour(q.h) * 30);
    L.side.appendChild(el('div', { class: 'fm-count' }, el('div', { class: 'fm-big' }, '50'), el('div', { class: 'fm-biglabel' }, 'minutes past')));
    L.side.appendChild(MQ.ui.prompt('The short hand has just passed …'));
    var result = el('div', { class: 'fm-result' });
    var ch = MQ.ui.choices(
      [7, 8].map(function (v) {
        return { label: 'the ' + v, value: v };
      }),
      function (v) {
        if (v === q.h) {
          ch.mark(v, 'good');
          ch.disable();
          clock.markNumber(q.h);
          api.sound('correct');
          result.appendChild(el('div', { class: 'fm-words' }, fmPast(q.h, q.m)));
          result.appendChild(digitalBox(fmDigital(q.h, q.m)));
          api.say('Yes! It has passed 7 but not reached 8 yet. So it is 50 minutes past 7.', 'cheer');
          api.feedback('Short hand just passed 7 → hour 7. Long hand → 50 minutes. Time: 07:50.', 'good');
          api.unlockNext();
        } else {
          ch.mark(v, 'bad');
          api.sound('wrong');
          api.say('It is very close to 8, but it has not got there yet.', 'oops');
          api.feedback('Look at the shaded slice: the short hand is still between 7 and 8. It reaches 8 only at 8 o’clock.', 'try');
        }
      },
      { columns: 2 }
    );
    L.side.appendChild(ch);
    L.side.appendChild(result);
  }

  /* ---------------- practice ---------------- */
  var COUNT = 10;
  var deck = null;

  function levelOf(i) {
    return i < COUNT / 3 ? 1 : i < (2 * COUNT) / 3 ? 2 : 3;
  }

  function buildDeck() {
    var used = {};
    var list = [];
    function key(h, m) {
      return h + ':' + m;
    }
    function add(h, m, extra) {
      used[key(h, m)] = true;
      var q = { h: h, m: m };
      if (extra) for (var k in extra) q[k] = extra[k];
      list.push(q);
    }
    function ok(h, m) {
      return !used[key(h, m)];
    }
    var n1 = 0;
    var n2 = 0;
    var n3 = 0;
    for (var i = 0; i < COUNT; i++) {
      var lv = levelOf(i);
      if (lv === 1) n1++;
      else if (lv === 2) n2++;
      else n3++;
    }
    // Level 1: minute hand on a number, 5-55 past. Keep the short hand off the long hand's number.
    var mins = U.shuffle(U.range(1, 11)).slice(0, n1);
    mins.forEach(function (k) {
      var h;
      var guard = 0;
      do {
        h = U.rand(1, 12);
      } while ((h === k || h === k + 1 || !ok(h, k * 5)) && guard++ < 50);
      add(h, k * 5, { level: 1 });
    });
    // Level 2: between numbers, 1-29 past, one 12 to 1 rollover clock (12:03-12:07, not on a number).
    var l2 = [];
    var roll = U.pick([3, 4, 6, 7]);
    l2.push({ h: 12, m: roll });
    while (l2.length < n2) {
      var m2 = U.rand(6, 29);
      if (m2 % 5 === 0) continue;
      var h2 = U.rand(1, 11);
      var nb = minuteNeighbours(m2);
      if (nb.indexOf(h2) !== -1 || nb.indexOf(fmNextHour(h2)) !== -1) continue;
      if (!ok(h2, m2) || l2.some(function (x) { return x.h === h2 || x.m === m2; })) continue;
      used[key(h2, m2)] = true;
      l2.push({ h: h2, m: m2 });
    }
    used[key(12, roll)] = true;
    U.shuffle(l2).forEach(function (x) {
      add(x.h, x.m, { level: 2 });
    });
    // Level 3: any minute 1-59, ring hidden. One clock where the hands are easy to swap
    // (long hand on a number after half past, short hand nearly at the next number, like 3:50).
    var l3 = [];
    var guard3 = 0;
    while (l3.length < 1 && guard3++ < 100) {
      var mS = U.pick([40, 50, 55]);
      var hS = U.rand(1, 11);
      if (hS === mS / 5 || fmNextHour(hS) === mS / 5 || !ok(hS, mS)) continue;
      l3.push({ h: hS, m: mS, swap: true });
    }
    while (l3.length < n3) {
      var m3 = l3.length === 1 ? U.rand(31, 59) : U.rand(1, 59);
      if (m3 % 5 === 0) continue;
      var h3 = U.rand(1, 12);
      var nb3 = minuteNeighbours(m3);
      if (nb3.indexOf(h3) !== -1 || !ok(h3, m3) || l3.some(function (x) { return x.m === m3; })) continue;
      used[key(h3, m3)] = true;
      l3.push({ h: h3, m: m3 });
    }
    U.shuffle(l3).forEach(function (x) {
      add(x.h, x.m, { level: 3, swap: !!x.swap });
    });
    return list;
  }

  var SCENES = ['🏠 The kitchen clock', '🏫 The classroom clock', '🛏️ The bedroom clock', '🚉 The station clock', '📚 The library clock', '🏠 The hall clock', '🏫 The school hall clock', '🛒 The shop clock', '🏊 The swimming pool clock', '🚌 The bus stop clock'];

  function renderPractice(stage, api) {
    if (!deck || api.index === 0 || deck.length !== COUNT) deck = buildDeck();
    var q = deck[api.index];
    var level = q.level;
    var L = layout(stage);
    var clock = makeClock({ ring: true, ringVisible: level < 3, hour: q.h, minute: q.m });
    clock.svg.classList.add('fm-ring-faint');
    L.clockBox.appendChild(clock.svg);
    L.clockBox.insertBefore(el('div', { class: 'fm-scene' }, SCENES[api.index % SCENES.length]), clock.svg);
    var chips = chipRow();
    var result = el('div', { class: 'fm-result' });

    if (level === 1) {
      api.say('Count in fives round the ring. How many minutes past is it?', 'think');
      L.side.appendChild(MQ.ui.prompt('How many <b>minutes past</b> the hour?'));
      var ni = MQ.ui.numberInput({
        unit: 'minutes past',
        onSubmit: function (num) {
          if (api.isAnswered()) return;
          if (num === q.m) {
            ni.good();
            ni.disable();
            api.check(true, 'Yes! The long hand is on the ' + q.m / 5 + ': that is ' + q.m + ' minutes past.');
            animateWorking(api, clock, q, chips);
            return;
          }
          ni.bad();
          var d = diagnose(q, null, num, api.tries() >= 1);
          api.check(false, d.hint, d.tag);
        },
      });
      L.side.appendChild(ni.el);
      L.side.appendChild(chips);
      L.side.appendChild(result);
      ni.focus();
      api.onReveal(function () {
        ni.setValue(q.m);
        ni.good();
        ni.disable();
        api.feedback('Jump in fives to the ' + q.m / 5 + ': ' + q.m + ' minutes past.', 'info');
        animateWorking(api, clock, q, chips, function () {
          result.appendChild(el('div', { class: 'fm-words' }, q.m + ' minutes past'));
        });
      });
      return;
    }

    api.say(level === 3 ? 'No ring this time! Read the clock: the hour, then the minutes past.' : 'Count in fives, then in ones. What time is it?', 'think');
    L.side.appendChild(MQ.ui.prompt('What time does the clock show?'));
    L.side.appendChild(el('div', { class: 'fm-help' }, 'Type the hour, then the minutes.'));
    var ti = timeInput(function (hour, min) {
      if (api.isAnswered()) return;
      if (hour === q.h && min === q.m) {
        ti.mark(true, true);
        ti.disable();
        api.check(true, 'Yes! ' + fmPast(q.h, q.m) + ' (' + fmDigital(q.h, q.m) + ').');
        animateWorking(api, clock, q, chips);
        return;
      }
      var d = diagnose(q, hour, min, api.tries() >= 1);
      ti.mark(hour === q.h, min === q.m);
      api.check(false, d.hint, d.tag);
      if (level === 3) {
        clock.showRing(true);
        api.later(function () {
          if (!api.isAnswered()) api.feedback(d.hint + ' The five-minute ring is back to help you.', 'try');
        }, 50);
      }
    });
    L.side.appendChild(ti.el);
    L.side.appendChild(chips);
    L.side.appendChild(result);
    ti.focus();
    api.onReveal(function () {
      ti.setValue(q.h, q.m);
      ti.mark(true, true);
      ti.disable();
      api.feedback('Short hand just passed ' + q.h + ' → hour ' + q.h + '. Long hand: count fives, then ones.', 'info');
      animateWorking(api, clock, q, chips, function () {
        result.appendChild(digitalBox(fmDigital(q.h, q.m)));
        result.appendChild(el('div', { class: 'fm-words' }, fmPast(q.h, q.m)));
      });
    });
  }

  MQ.register('five-minute-ring', {
    learn: [learnRing, learnMarks, learnHour],
    practice: { count: COUNT, render: renderPractice },
  });

  var css = [
    '.fm-wrap{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:18px 28px;width:100%}',
    '.fm-clockbox{flex:0 1 310px;max-width:100%;display:flex;flex-direction:column;align-items:center;gap:4px}',
    '.fm-clock{display:block;user-select:none;-webkit-user-select:none}',
    '.fm-side{flex:1 1 300px;max-width:460px;min-width:0;display:flex;flex-direction:column;align-items:center;gap:12px}',
    '.fm-ring-num{fill:#0b6e66;transition:fill .2s}',
    '.fm-ring-faint .fm-ring-num{fill:#b4bfd4}',
    '.fm-ring-faint .fm-ring-num.fm-lit,.fm-ring-num.fm-lit{fill:#0b6e66}',
    '.fm-jump{fill:none;stroke:#2ec4b6;stroke-width:3.5;stroke-linecap:round}',
    '.fm-dot{fill:#e85d04;stroke:#fff;stroke-width:1.5}',
    '.fm-hourmark{fill:#ffe08a}',
    '.fm-sector{fill:#fff3cd}',
    '.fm-hit{fill:transparent;cursor:pointer;pointer-events:all}',
    '.fm-hit:hover{fill:rgba(46,196,182,.18)}',
    '.fm-mhit:hover{fill:rgba(232,93,4,.22)}',
    '.fm-count{display:flex;align-items:baseline;gap:10px;justify-content:center;flex-wrap:wrap}',
    '.fm-big{font-size:3rem;font-weight:800;color:#0b6e66;line-height:1;min-width:1.6em;text-align:center}',
    '.fm-biglabel{font-size:1.2rem;font-weight:800;color:var(--ink-soft)}',
    '.fm-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;min-height:40px;max-width:460px}',
    '.fm-chip{font-weight:800;font-size:1.05rem;padding:4px 10px}',
    '.fm-chip-five{background:#d9f5f1;border-color:#2ec4b6;color:#0b6e66}',
    '.fm-chip-one{background:#ffe8d6;border-color:#e85d04;color:#a63f00}',
    '.fm-arrow{font-weight:800;font-size:1.3rem;color:var(--ink-soft)}',
    '.fm-result{display:flex;flex-direction:column;align-items:center;gap:8px}',
    '.fm-result:empty{display:none}',
    '.fm-words{font-size:1.5rem;font-weight:800;color:var(--ink);background:#fff;border:3px solid var(--good);border-radius:14px;padding:6px 16px}',
    '.fm-digital{font-family:"Courier New",monospace;font-weight:800;font-size:2.2rem;background:#1b2a4a;color:#7CFC9A;border-radius:12px;padding:4px 16px;letter-spacing:2px;display:inline-block}',
    '.fm-scene{font-weight:800;color:var(--ink-soft);font-size:1rem}',
    '.fm-help{color:var(--ink-soft);font-weight:700;margin-top:-6px}',
    '.fm-timein .num-input{width:96px}',
    '.fm-colon{font-size:2rem;font-weight:800}',
    '.fm-side .choices{max-width:360px}',
    '.fm-side .prompt{font-size:1.3rem}',
    '@media (max-width:700px){.fm-big{font-size:2.4rem}.fm-timein .num-input{width:80px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'five-minute-ring' }, css));
})();

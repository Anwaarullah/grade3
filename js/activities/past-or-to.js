/* Past or To? — change digital times into "past" and "to" words, and words back into digital
 * times (Unit 8.1). "Minutes to" is shown with a 60-minute bar: count on to 60 instead of a bare
 * subtraction. Clocks use the shared Unit 8 look (white face, 60 ticks, long orange minute hand,
 * short dark hour hand at (h % 12) * 30 + m * 0.5 degrees). All drawings and text are original.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  /* ---------------- shared Unit 8 clock helpers (prefix pt-) ---------------- */
  function ptPoint(cx, cy, d, deg) {
    var a = (deg * Math.PI) / 180;
    return { x: Math.round((cx + d * Math.sin(a)) * 100) / 100, y: Math.round((cy - d * Math.cos(a)) * 100) / 100 };
  }
  function ptDigital(h, m) {
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  function ptNext(h) {
    return h === 12 ? 1 : h + 1;
  }
  function ptPrev(h) {
    return h === 1 ? 12 : h - 1;
  }
  function minWord(n) {
    return n === 1 ? 'minute' : 'minutes';
  }
  /** Past for 1-30 (quarter past / half past), to for 31-59 (quarter to). */
  function ptWords(h, m) {
    if (m === 0) return h + " o'clock";
    if (m === 15) return 'quarter past ' + h;
    if (m === 30) return 'half past ' + h;
    if (m === 45) return 'quarter to ' + ptNext(h);
    if (m < 30) return m + ' ' + minWord(m) + ' past ' + h;
    var to = 60 - m;
    return to + ' ' + minWord(to) + ' to ' + ptNext(h);
  }
  var HOUR_WORDS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

  function wedgePath(cx, cy, R, a0, a1) {
    if (a1 - a0 >= 359.9) {
      return 'M' + (cx - R) + ',' + cy + ' A' + R + ',' + R + ' 0 1 1 ' + (cx + R) + ',' + cy + ' A' + R + ',' + R + ' 0 1 1 ' + (cx - R) + ',' + cy + ' Z';
    }
    var p0 = ptPoint(cx, cy, R, a0);
    var p1 = ptPoint(cx, cy, R, a1);
    var large = a1 - a0 > 180 ? 1 : 0;
    return 'M' + cx + ',' + cy + ' L' + p0.x + ',' + p0.y + ' A' + R + ',' + R + ' 0 ' + large + ' 1 ' + p1.x + ',' + p1.y + ' Z';
  }

  /**
   * makeClock({ r, hour, minute, width, halves })
   * The Unit 8 clock, extended with: past/to half shading, a swept wedge, a drag target.
   */
  function makeClock(o) {
    var r = o.r || 120;
    var pad = 10;
    var size = 2 * (r + pad);
    var cx = size / 2;
    var cy = size / 2;
    var root = S('svg', { viewBox: '0 0 ' + size + ' ' + size, width: o.width || 260, class: 'pt-clock', style: { maxWidth: '100%', height: 'auto' } });
    root.appendChild(S('circle', { cx: cx, cy: cy, r: r, fill: '#fff', stroke: '#1b2a4a', 'stroke-width': 5 }));
    var halves = S('g', { class: 'pt-halves' });
    var wedge = S('g', { class: 'pt-wedges' });
    root.appendChild(halves);
    root.appendChild(wedge);
    for (var t = 0; t < 60; t++) {
      var big = t % 5 === 0;
      var p1 = ptPoint(cx, cy, r - 4, t * 6);
      var p2 = ptPoint(cx, cy, r - (big ? 16 : 9), t * 6);
      root.appendChild(S('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: '#1b2a4a', 'stroke-width': big ? 3 : 1.4, 'stroke-linecap': 'round' }));
    }
    for (var n = 1; n <= 12; n++) {
      var q = ptPoint(cx, cy, r * 0.72, n * 30);
      root.appendChild(S('text', { x: q.x, y: q.y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': Math.round(r * 0.19), 'font-weight': 800, fill: '#1b2a4a' }, String(n)));
    }
    var layer = S('g', { class: 'pt-layer' });
    root.appendChild(layer);
    var hourHand = S('line', { x1: cx, y1: cy, x2: cx, y2: cy - r * 0.5, stroke: '#1b2a4a', 'stroke-width': r * 0.075, 'stroke-linecap': 'round', class: 'pt-hour' });
    var minuteHand = S('line', { x1: cx, y1: cy, x2: cx, y2: cy - r * 0.82, stroke: '#e85d04', 'stroke-width': r * 0.045, 'stroke-linecap': 'round', class: 'pt-minute' });
    root.appendChild(hourHand);
    root.appendChild(minuteHand);
    root.appendChild(S('circle', { cx: cx, cy: cy, r: r * 0.05, fill: '#1b2a4a' }));

    function setHand(line, len, deg) {
      var p = ptPoint(cx, cy, len, deg);
      line.setAttribute('x2', p.x);
      line.setAttribute('y2', p.y);
    }
    var api = {
      svg: root,
      r: r,
      cx: cx,
      cy: cy,
      h: 12,
      m: 0,
      setTime: function (h, m) {
        api.h = h;
        api.m = m;
        setHand(hourHand, r * 0.5, (h % 12) * 30 + m * 0.5);
        setHand(minuteHand, r * 0.82, m * 6);
        root.setAttribute('data-h', h);
        root.setAttribute('data-m', m);
      },
      showHalves: function () {
        MQ.clear(halves);
        halves.appendChild(S('path', { d: wedgePath(cx, cy, r - 2.5, 0, 180), class: 'pt-half-past' }));
        halves.appendChild(S('path', { d: wedgePath(cx, cy, r - 2.5, 180, 360), class: 'pt-half-to' }));
        var a = ptPoint(cx, cy, r * 0.4, 90);
        var b = ptPoint(cx, cy, r * 0.4, 270);
        halves.appendChild(S('text', { x: a.x, y: a.y + r * 0.2, 'text-anchor': 'middle', 'font-size': Math.round(r * 0.13), class: 'pt-half-label pt-past-txt' }, 'past'));
        halves.appendChild(S('text', { x: b.x, y: b.y + r * 0.2, 'text-anchor': 'middle', 'font-size': Math.round(r * 0.13), class: 'pt-half-label pt-to-txt' }, 'to'));
      },
      /** shade the minutes swept: 12 -> hand (past) or hand -> 12 (to) */
      showSweep: function (h, m) {
        MQ.clear(wedge);
        if (m === 0) return;
        if (m <= 30) wedge.appendChild(S('path', { d: wedgePath(cx, cy, r - 2.5, 0, m * 6), class: 'pt-sweep-past' }));
        else wedge.appendChild(S('path', { d: wedgePath(cx, cy, r - 2.5, m * 6, 360), class: 'pt-sweep-to' }));
      },
      clearSweep: function () {
        MQ.clear(wedge);
      },
      angleOf: function (p) {
        var a = (Math.atan2(p.x - cx, -(p.y - cy)) * 180) / Math.PI;
        return (a + 360) % 360;
      },
      /** whole face is a drag/click target for the minute hand; cb(minute) */
      addMinuteDrag: function (cb) {
        var hit = S('circle', { cx: cx, cy: cy, r: r + 6, class: 'pt-hit' });
        root.appendChild(hit);
        function at(p) {
          cb(Math.round(api.angleOf(p) / 6) % 60);
        }
        return MQ.ui.drag(root, hit, { start: at, move: at, end: function () {} });
      },
    };
    api.setTime(o.hour || 12, o.minute || 0);
    if (o.halves) api.showHalves();
    return api;
  }

  /* ---------------- digital display ---------------- */
  function digital(h, m) {
    var hs = el('span', { class: 'pt-dh' });
    var ms = el('span', { class: 'pt-dm' });
    var box = el('div', { class: 'pt-digital' }, hs, el('span', { class: 'pt-colon' }, ':'), ms);
    box.set = function (hh, mm) {
      var s = ptDigital(hh, mm).split(':');
      hs.textContent = s[0];
      ms.textContent = s[1];
    };
    box.mark = function (part, on) {
      (part === 'h' ? hs : ms).classList.toggle('pt-hl-' + part, on !== false);
    };
    box.blank = function () {
      hs.textContent = '--';
      ms.textContent = '--';
    };
    box.set(h, m);
    return box;
  }

  /* ---------------- the 60-minute bar ---------------- */
  var CW = 12;
  var BX = 34;
  var BY = 40;
  var CH = 42;
  /**
   * One hour as 60 boxes, from h o'clock (left) to the next o'clock (right).
   * states per cell: '', 'gone' (teal, minutes past), 'togo' (purple, minutes to go).
   */
  function makeBar(h, opts) {
    opts = opts || {};
    var W = BX * 2 + 60 * CW;
    var H = BY + CH + 52;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, class: 'pt-bar', style: { maxWidth: '100%', height: 'auto' } });
    var cellsG = S('g');
    var jumpsG = S('g', { class: 'pt-jumps' });
    var textG = S('g');
    root.appendChild(cellsG);
    var cells = [null];
    for (var i = 1; i <= 60; i++) {
      var c = S('rect', { x: BX + (i - 1) * CW, y: BY, width: CW, height: CH, class: 'pt-cell', 'data-i': i });
      cells.push(c);
      cellsG.appendChild(c);
    }
    for (var k = 0; k <= 12; k++) {
      var x = BX + k * 5 * CW;
      root.appendChild(S('line', { x1: x, y1: BY, x2: x, y2: BY + CH + (k % 2 === 0 ? 8 : 5), class: k % 2 === 0 ? 'pt-tick10' : 'pt-tick5' }));
      root.appendChild(S('text', { x: x, y: BY + CH + 20, 'text-anchor': 'middle', class: 'pt-barnum' + (k % 2 ? ' pt-barnum5' : '') }, String(k * 5)));
    }
    root.appendChild(S('rect', { x: BX, y: BY, width: 60 * CW, height: CH, class: 'pt-bar-outline' }));
    var leftLab = S('text', { x: BX - 6, y: BY + CH + 44, 'text-anchor': 'start', class: 'pt-endlab' }, h + " o'clock");
    var rightLab = S('text', { x: BX + 60 * CW + 6, y: BY + CH + 44, 'text-anchor': 'end', class: 'pt-endlab' }, ptNext(h) + " o'clock");
    root.appendChild(leftLab);
    root.appendChild(rightLab);
    root.appendChild(textG);
    root.appendChild(jumpsG);
    var hit = S('rect', { x: BX - 4, y: BY - 30, width: 60 * CW + 8, height: CH + 50, class: 'pt-hit' });
    var bar = {
      svg: root,
      cells: cells,
      state: [],
      set: function (i, st) {
        bar.state[i] = st;
        cells[i].setAttribute('class', 'pt-cell' + (st ? ' pt-c-' + st : ''));
      },
      /** cells 1..a gone, a+1..b to-go, rest blank */
      paint: function (gone, togo) {
        for (var j = 1; j <= 60; j++) bar.set(j, j <= gone ? 'gone' : j <= gone + (togo || 0) ? 'togo' : '');
      },
      xAt: function (minute) {
        return BX + minute * CW;
      },
      cellAt: function (p) {
        return U.clamp(Math.floor((p.x - BX) / CW) + 1, 1, 60);
      },
      /** label centred over a run of cells (only if it fits) */
      label: function (from, to, text, cls) {
        if ((to - from + 1) * CW < text.length * 8.5) return;
        textG.appendChild(S('text', { x: BX + ((from - 1 + to) / 2) * CW, y: BY + CH / 2 + 6, 'text-anchor': 'middle', class: 'pt-barlab ' + (cls || '') }, text));
      },
      clearText: function () {
        MQ.clear(textG);
      },
      jump: function (a, b) {
        var x0 = bar.xAt(a);
        var x1 = bar.xAt(b);
        var hgt = Math.min(30, 12 + (b - a) * 1.6);
        jumpsG.appendChild(S('path', { d: 'M' + x0 + ',' + (BY - 2) + ' Q' + (x0 + x1) / 2 + ',' + (BY - 2 - hgt * 1.6) + ' ' + x1 + ',' + (BY - 2), class: 'pt-jump' }));
        jumpsG.appendChild(S('text', { x: (x0 + x1) / 2, y: BY - hgt - 2, 'text-anchor': 'middle', class: 'pt-jumplab' }, '+' + (b - a)));
      },
      clearJumps: function () {
        MQ.clear(jumpsG);
      },
      addHit: function (cb) {
        root.appendChild(hit);
        return MQ.ui.drag(root, hit, cb);
      },
    };
    bar.paint(opts.gone || 0, opts.togo || 0);
    return bar;
  }

  /** Count on from m to 60: up to the next 5, the next 10, then in tens. */
  function jumpsFor(m) {
    var out = [];
    var a = m;
    if (a % 5) {
      out.push([a, a + (5 - (a % 5))]);
      a = out[out.length - 1][1];
    }
    if (a % 10 === 5) {
      out.push([a, a + 5]);
      a += 5;
    }
    while (a < 60) {
      out.push([a, a + 10]);
      a += 10;
    }
    return out;
  }

  function chips(list, cls) {
    var row = el('div', { class: 'pt-chips' });
    list.forEach(function (t) {
      if (t === '→' || t === '+' || t === '=') row.appendChild(el('span', { class: 'pt-op' }, t));
      else row.appendChild(el('span', { class: 'chip pt-chip ' + (cls || '') }, String(t)));
    });
    return row;
  }

  function jumpChips(m) {
    var js = jumpsFor(m);
    var parts = [];
    js.forEach(function (j, i) {
      if (i) parts.push('+');
      parts.push(j[1] - j[0]);
    });
    if (js.length > 1) {
      parts.push('=');
      parts.push(60 - m);
    }
    var row = chips(parts, 'pt-chip-to');
    row.insertBefore(el('span', { class: 'pt-chiplab' }, m + ' → 60:'), row.firstChild);
    return row;
  }

  function hourChange(from, to, text) {
    return el('div', { class: 'pt-hchange' }, el('span', { class: 'pt-hbox' }, String(from)), el('span', { class: 'pt-harrow' }, '➜'), el('span', { class: 'pt-hbox pt-hbox-new' }, String(to)), el('span', { class: 'pt-htext' }, text));
  }

  function wordsBox(text, kind) {
    return el('div', { class: 'pt-words' + (kind ? ' pt-words-' + kind : '') }, text);
  }

  function layout(stage) {
    var clockBox = el('div', { class: 'pt-clockbox' });
    var side = el('div', { class: 'pt-side' });
    stage.appendChild(el('div', { class: 'pt-wrap' }, clockBox, side));
    return { clockBox: clockBox, side: side };
  }

  /** Simple HTML drag for a card onto a drop zone. A plain click also drops it. */
  function cardDrag(card, zone, onDrop) {
    var sx = 0;
    var sy = 0;
    var moved = false;
    var active = false;
    function inside(e) {
      var b = zone.getBoundingClientRect();
      return e.clientX >= b.left && e.clientX <= b.right && e.clientY >= b.top && e.clientY <= b.bottom;
    }
    card.addEventListener('pointerdown', function (e) {
      if (card.classList.contains('pt-used')) return;
      e.preventDefault();
      active = true;
      moved = false;
      sx = e.clientX;
      sy = e.clientY;
      try {
        card.setPointerCapture(e.pointerId);
      } catch (err) {}
      card.classList.add('pt-dragging');
    });
    card.addEventListener('pointermove', function (e) {
      if (!active) return;
      var dx = e.clientX - sx;
      var dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
      card.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      zone.classList.toggle('pt-over', inside(e));
    });
    function up(e) {
      if (!active) return;
      active = false;
      card.classList.remove('pt-dragging');
      card.style.transform = '';
      zone.classList.remove('pt-over');
      if (!moved || inside(e)) onDrop();
    }
    card.addEventListener('pointerup', up);
    card.addEventListener('pointercancel', function () {
      active = false;
      card.style.transform = '';
      card.classList.remove('pt-dragging');
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onDrop();
      }
    });
    card.style.touchAction = 'none';
  }

  /* ---------------- learn screens ---------------- */
  function learnSplit(stage, api) {
    api.lockNext();
    api.say('A digital clock shows the hour, then a colon, then the minutes.');
    stage.appendChild(MQ.ui.lesson('Hours : minutes', 'Before the colon is the <b>hour</b>. After the colon are the <b>minutes</b>.'));
    var L = layout(stage);
    var clock = makeClock({ hour: 3, minute: 15, width: 240 });
    L.clockBox.appendChild(clock.svg);
    var disp = digital(3, 15);
    var tags = el('div', { class: 'pt-dtags' }, el('span', { class: 'pt-dtag pt-dtag-h' }, 'hour'), el('span', { class: 'pt-dtag pt-dtag-m' }, 'minutes'));
    tags.style.visibility = 'hidden';
    L.side.appendChild(el('div', { class: 'pt-dbox' }, disp, tags));
    var zone = el('div', { class: 'pt-drop' }, 'Drag the right words here');
    L.side.appendChild(zone);
    var cardRow = el('div', { class: 'pt-cards' });
    L.side.appendChild(cardRow);
    api.later(function () {
      tags.style.visibility = 'visible';
      disp.mark('h');
      api.feedback('03 before the colon: the hour is 3.', 'info');
    }, 700);
    api.later(function () {
      disp.mark('m');
      api.feedback('15 after the colon: 15 minutes. 15 minutes is a quarter of an hour.', 'info');
      api.say('Now drag the card that says this time onto the box.');
    }, 1900);
    var opts = U.shuffle([
      { t: 'quarter past 3', ok: true },
      { t: 'quarter to 3', why: 'Quarter TO 3 is before 3 o’clock (02:45). Here it is 15 minutes AFTER 3, so it is past.' },
      { t: 'half past 3', why: 'Half past means 30 minutes. Here the minutes are 15: a quarter of an hour.' },
    ]);
    var done = false;
    opts.forEach(function (o) {
      var card = el('div', { class: 'pt-card', tabindex: 0, role: 'button', 'data-text': o.t }, o.t);
      cardRow.appendChild(card);
      cardDrag(card, zone, function () {
        if (done) return;
        if (o.ok) {
          done = true;
          card.classList.add('pt-used');
          MQ.clear(zone);
          zone.appendChild(el('span', null, 'quarter past 3'));
          zone.classList.add('pt-drop-good');
          clock.showHalves();
          clock.showSweep(3, 15);
          api.sound('correct');
          api.say('Yes! 03:15 is quarter past 3.', 'cheer');
          api.feedback('03:15 → hour 3, 15 minutes after it → quarter past 3.', 'good');
          api.unlockNext();
        } else {
          api.sound('wrong');
          card.classList.add('shake');
          api.later(function () {
            card.classList.remove('shake');
          }, 400);
          api.feedback(o.why, 'try');
        }
      });
    });
  }

  function learnHalves(stage, api) {
    api.lockNext();
    api.say('The right half of the clock is PAST. The left half is TO. Drag the long orange hand round.');
    stage.appendChild(MQ.ui.lesson('Past or to?', 'Drag the <b>long hand</b> (or click the clock). Move it past the <b>6</b> into the purple half.'));
    var L = layout(stage);
    var clock = makeClock({ hour: 4, minute: 20, width: 280, halves: true });
    L.clockBox.appendChild(clock.svg);
    var disp = digital(4, 20);
    var words = wordsBox('', 'past');
    var note = el('div', { class: 'pt-note' });
    L.side.appendChild(disp);
    L.side.appendChild(words);
    L.side.appendChild(note);
    L.side.appendChild(el('div', { class: 'pt-legend' }, el('span', { class: 'pt-sw pt-sw-past' }), 'past: minutes after the hour', el('br'), el('span', { class: 'pt-sw pt-sw-to' }), 'to: minutes left before the next hour'));
    var h = 4;
    var m = 20;
    var unlocked = false;
    function show() {
      clock.setTime(h, m);
      clock.showSweep(h, m);
      disp.set(h, m);
      words.textContent = ptWords(h, m);
      words.className = 'pt-words ' + (m === 0 ? '' : m <= 30 ? 'pt-words-past' : 'pt-words-to');
      if (m === 0) note.textContent = 'Right on the 12: o’clock.';
      else if (m <= 30) note.textContent = 'Count from the 12 to the long hand: ' + m + ' ' + minWord(m) + ' past ' + h + '.';
      else note.textContent = 'Count from the long hand on to the 12: ' + (60 - m) + ' ' + minWord(60 - m) + ' to go until ' + ptNext(h) + ' o’clock.';
    }
    show();
    var unbind = clock.addMinuteDrag(function (nm) {
      if (nm === m) return;
      if (m >= 45 && nm < 15) h = ptNext(h);
      else if (m < 15 && nm >= 45) h = ptPrev(h);
      m = nm;
      show();
      if (!unlocked && m > 30) {
        unlocked = true;
        api.sound('correct');
        api.say('See? After the 6 we say TO the next hour!', 'cheer');
        api.feedback('Past the 6, we count the minutes left TO the next hour. Keep exploring, then press Next.', 'good');
        api.unlockNext();
      }
    });
    api.cleanup(unbind);
  }

  function learnBar(stage, api) {
    api.lockNext();
    var H = 1;
    var M = 52;
    api.say('01:52 is 52 minutes past 1. How many minutes are left until 2 o’clock?');
    stage.appendChild(MQ.ui.lesson('Count on to 60', 'The bar is one hour: 60 minutes. <b>52</b> have gone. Click the white boxes to count on to 60.'));
    var top = el('div', { class: 'pt-row' });
    var clock = makeClock({ hour: H, minute: M, width: 150, halves: true });
    var disp = digital(H, M);
    var counter = el('div', { class: 'pt-count' }, el('span', { class: 'pt-big' }, '0'), el('span', { class: 'pt-biglab' }, 'minutes to go'));
    top.appendChild(clock.svg);
    top.appendChild(el('div', { class: 'pt-col' }, disp, counter));
    stage.appendChild(top);
    var bar = makeBar(H, { gone: M });
    bar.label(1, M, '52 minutes gone', 'pt-barlab-gone');
    stage.appendChild(bar.svg);
    var countRow = el('div', { class: 'pt-chips' });
    stage.appendChild(countRow);
    var result = el('div', { class: 'pt-result' });
    stage.appendChild(result);
    var next = M + 1;
    var unbind = bar.addHit({
      start: function (p) {
        if (next > 60) return;
        var c = bar.cellAt(p);
        if (c <= M) {
          api.feedback('The teal part is the 52 minutes that have gone. Click the white boxes.', 'try');
          return;
        }
        bar.set(next, 'togo');
        countRow.appendChild(el('span', { class: 'chip pt-chip pt-chip-to' }, String(next)));
        counter.firstChild.textContent = String(next - M);
        api.sound('pop');
        if (next === 60) {
          bar.jump(52, 55);
          bar.jump(55, 60);
          bar.label(M + 1, 60, '8', 'pt-barlab-to');
          result.appendChild(wordsBox('01:52 is 8 minutes to 2', 'to'));
          result.appendChild(hourChange(1, 2, 'the hour goes up by one'));
          api.say('8 minutes to go! So 01:52 is 8 minutes TO 2.', 'cheer');
          api.feedback('52 → 60 is 8 minutes. And “to 2” because 2 o’clock is coming next.', 'good');
          api.unlockNext();
        } else {
          api.feedback(next + '…', 'info');
        }
        next++;
      },
    });
    api.cleanup(unbind);
  }

  function learnBack(stage, api) {
    api.lockNext();
    var TO = 24;
    var HTO = 3;
    var ansH = 2;
    var ansM = 36;
    api.say('Now the other way: 24 minutes to 3. Take 24 minutes off the end of the hour.');
    stage.appendChild(MQ.ui.lesson('24 minutes to 3', 'Drag from the right end of the bar (or click a box) to take off <b>24 minutes</b>.'));
    var top = el('div', { class: 'pt-row' });
    var clock = makeClock({ hour: 2, minute: 0, width: 150, halves: true });
    clock.svg.style.visibility = 'hidden';
    var disp = digital(ansH, ansM);
    disp.blank();
    var counter = el('div', { class: 'pt-count' }, el('span', { class: 'pt-big' }, '0'), el('span', { class: 'pt-biglab' }, 'taken off'));
    top.appendChild(clock.svg);
    top.appendChild(el('div', { class: 'pt-col' }, disp, counter));
    stage.appendChild(top);
    var bar = makeBar(2, { gone: 60 });
    stage.appendChild(bar.svg);
    var fine = el('div', { class: 'pt-fine' });
    stage.appendChild(fine);
    var after = el('div', { class: 'pt-col' });
    stage.appendChild(after);
    var off = 0;
    var cutDone = false;
    function paint() {
      bar.paint(60 - off, off);
      counter.firstChild.textContent = String(off);
    }
    function settle() {
      if (cutDone) return;
      if (off === TO) {
        cutDone = true;
        MQ.clear(fine);
        bar.clearText();
        bar.label(1, 36, '36 minutes gone', 'pt-barlab-gone');
        bar.label(37, 60, '24 to go', 'pt-barlab-to');
        api.sound('correct');
        api.say('36 minutes are left. Which hour is it really?', 'happy');
        api.feedback('Taking 24 off the end leaves 36. Count on to check: 36 → 40 → 50 → 60 is 4 + 10 + 10 = 24.', 'good');
        after.appendChild(el('div', { class: 'pt-q-small' }, '24 minutes TO 3: it is not 3 o’clock yet. What is the hour?'));
        var hrow = el('div', { class: 'pt-result' });
        var ch = MQ.ui.choices([2, 3, 4], function (v) {
          if (v === ansH) {
            ch.mark(v, 'good');
            ch.disable();
            disp.set(ansH, ansM);
            disp.mark('h');
            disp.mark('m');
            clock.setTime(ansH, ansM);
            clock.showSweep(ansH, ansM);
            clock.svg.style.visibility = 'visible';
            hrow.appendChild(hourChange(3, 2, 'the hour goes back one'));
            api.sound('correct');
            api.say('02:36! The hour goes back to 2, and 36 minutes have gone.', 'cheer');
            api.feedback('24 minutes to 3 is 36 minutes past 2: 02:36.', 'good');
            api.unlockNext();
          } else {
            ch.mark(v, 'bad');
            api.sound('wrong');
            api.feedback(v === 3 ? 'It is still BEFORE 3 o’clock, so the hour is the one before 3.' : '“To 3” means 3 o’clock comes next. Which hour comes just before 3?', 'try');
          }
        }, { columns: 3 });
        ch.classList.add('pt-hchoices');
        hrow.appendChild(ch);
        after.appendChild(hrow);
      } else if (off > 0) {
        api.feedback('You took off ' + off + '. We need 24. ' + (off < TO ? 'Take off a few more.' : 'That is too many: put some back.'), 'try');
      }
    }
    var unbind = bar.addHit({
      start: function (p) {
        if (cutDone) return;
        off = 61 - bar.cellAt(p);
        paint();
      },
      move: function (p) {
        if (cutDone) return;
        off = 61 - bar.cellAt(p);
        paint();
      },
      end: settle,
    });
    api.cleanup(unbind);
    fine.appendChild(el('button', { class: 'btn btn-ghost pt-finebtn', type: 'button', onclick: function () { if (cutDone || off <= 0) return; off--; paint(); settle(); } }, '− put 1 back'));
    fine.appendChild(el('button', { class: 'btn btn-ghost pt-finebtn', type: 'button', onclick: function () { if (cutDone || off >= 59) return; off++; paint(); settle(); } }, '+ take 1 more'));
    paint();
  }

  /* ---------------- practice deck ---------------- */
  var COUNT = 10;
  function levelOf(i) {
    return i < COUNT / 3 ? 1 : i < (2 * COUNT) / 3 ? 2 : 3;
  }
  var deck = null;

  var L1_BOOK = [[5, 9], [3, 13], [9, 27], [4, 17], [12, 14], [7, 22], [10, 8]];
  var L1_QH = [[6, 15], [3, 30], [8, 30], [10, 15]];
  var L2_BOOK = [[1, 52], [8, 34], [2, 38], [7, 37], [4, 48], [9, 41], [3, 50], [6, 55]];
  var L2_BONUS = [[2, 34], [4, 56], [12, 34], [3, 45]];
  var L3_PAST = [[5, 7], [2, 34], [6, 42], [9, 23], [11, 5]]; // [hour, minutes past]
  var L3_TO = [[3, 24], [11, 12], [6, 18], [9, 21], [5, 26]]; // [hour said, minutes to]
  var L3_QTO = [11, 2, 4, 9, 7]; // quarter to <hour>

  function buildDeck() {
    var used = {};
    var out = [];
    function key(h, m) {
      return h + ':' + m;
    }
    function take(pool, n, mk) {
      var got = 0;
      U.shuffle(pool).forEach(function (p) {
        if (got >= n) return;
        var q = mk(p);
        if (used[key(q.h, q.m)]) return;
        used[key(q.h, q.m)] = true;
        out.push(q);
        got++;
      });
    }
    var n1 = 0;
    for (var i = 0; i < COUNT; i++) if (levelOf(i) === 1) n1++;
    // Level 1: one quarter/half past, then book times and one random time 2-29 past
    var l1 = [];
    var start = out.length;
    take(L1_QH, 1, function (p) { return { kind: 'tiles', h: p[0], m: p[1] }; });
    take(L1_BOOK, n1 - 2, function (p) { return { kind: 'tiles', h: p[0], m: p[1] }; });
    var guard = 0;
    while (out.length < start + n1 && guard++ < 200) {
      var rh = U.rand(1, 12);
      var rm = U.rand(2, 29);
      if (rm === 15 || rm === rh || used[key(rh, rm)]) continue;
      used[key(rh, rm)] = true;
      out.push({ kind: 'tiles', h: rh, m: rm });
    }
    l1 = U.shuffle(out.splice(start, n1));
    out = out.concat(l1);
    // Level 2: 'to' times (two book times + one rising-digits bonus)
    take(L2_BOOK, 2, function (p) { return { kind: 'to', h: p[0], m: p[1] }; });
    take(L2_BONUS, 1, function (p) { return { kind: 'to', h: p[0], m: p[1], bonus: true }; });
    // Level 3: words to digital
    take(L3_PAST, 1, function (p) { return { kind: 'type', sub: 'past', said: p[0], n: p[1], h: p[0], m: p[1] }; });
    take(L3_TO, 1, function (p) { return { kind: 'type', sub: 'to', said: p[0], n: p[1], h: ptPrev(p[0]), m: 60 - p[1] }; });
    take(L3_QTO.map(function (x) { return [x]; }), 1, function (p) { return { kind: 'type', sub: 'qto', said: p[0], n: 15, h: ptPrev(p[0]), m: 45 }; });
    return out;
  }

  var SCENES = ['The school bus comes at', 'Football practice starts at', 'Lunch is ready at', 'The film starts at', 'Grandma phones at', 'The shop opens at'];

  /* ---------------- practice: Level 1 (build the words) ---------------- */
  function acceptedTiles(q) {
    var a = [[String(q.m), 'minutes', 'past', String(q.h)]];
    if (q.m === 15) a.unshift(['quarter', 'past', String(q.h)]);
    if (q.m === 30) a.unshift(['half', 'past', String(q.h)]);
    return a;
  }

  function diagTiles(q, toks, second) {
    var h = q.h;
    var m = q.m;
    var start = m === 15 ? '“quarter”' : m === 30 ? '“half”' : m + ' (the minutes after the colon)';
    var strong = 'Start with ' + start + ', then ' + (m === 15 || m === 30 ? '“past”' : '“minutes past”') + ', then ' + h + ' (the hour before the colon).';
    var isNum = function (t) {
      return /^\d+$/.test(t);
    };
    var shapeA = toks.length === 4 && isNum(toks[0]) && toks[1] === 'minutes' && (toks[2] === 'past' || toks[2] === 'to') && isNum(toks[3]);
    var shapeB = toks.length === 3 && (toks[0] === 'quarter' || toks[0] === 'half') && (toks[1] === 'past' || toks[1] === 'to') && isNum(toks[2]);
    if (!shapeA && !shapeB) {
      return { tag: 'Put the words in the wrong order', hint: second ? strong : 'Build it in this order: number of minutes, “minutes”, past or to, then the hour.' };
    }
    var mins = shapeA ? +toks[0] : toks[0] === 'quarter' ? 15 : 30;
    var pastTo = shapeA ? toks[2] : toks[1];
    var hour = +toks[toks.length - 1];
    if (pastTo === 'to') {
      return { tag: "Used 'to' for a 'past' time", hint: second ? 'Up to 30 minutes we say PAST the hour. ' + strong : 'The minutes are ' + m + ', less than 30. The long hand is still in the “past” half, so we say past.' };
    }
    if (mins === h && hour === m) {
      return { tag: 'Swapped hours and minutes', hint: second ? strong : 'The hour comes before the colon (' + h + '). The minutes come after it (' + m + ').' };
    }
    if (mins !== m && !shapeA) {
      return { tag: 'Mixed up quarter past and half past', hint: second ? strong : 'Quarter past means 15 minutes. Half past means 30. Here the minutes are ' + m + '.' };
    }
    if (mins !== m) {
      return { tag: 'Read the minutes wrong', hint: second ? strong : 'The minutes are the number after the colon: ' + ptDigital(h, m).split(':')[1] + ' means ' + m + '.' };
    }
    if (hour === ptNext(h)) {
      return { tag: "Changed the hour for a 'past' time", hint: second ? strong : 'It is only ' + m + ' minutes PAST ' + h + ', so the hour stays ' + h + '.' };
    }
    return { tag: 'Read the hour wrong', hint: second ? strong : 'The hour is the number before the colon: ' + h + '.' };
  }

  function renderTiles(stage, api, q) {
    api.say('Say ' + ptDigital(q.h, q.m) + ' in words. Click the tiles in order.', 'think');
    var L = layout(stage);
    var clock = makeClock({ hour: q.h, minute: q.m, width: 230 });
    L.clockBox.appendChild(clock.svg);
    var disp = digital(q.h, q.m);
    L.side.appendChild(disp);
    var line = el('div', { class: 'pt-line' });
    L.side.appendChild(line);
    var nums = [];
    [q.m, q.h, ptNext(q.h), 60 - q.m].forEach(function (n) {
      if (nums.indexOf(n) === -1) nums.push(n);
    });
    var numRow = el('div', { class: 'pt-bank' });
    var wordRow = el('div', { class: 'pt-bank' });
    L.side.appendChild(numRow);
    L.side.appendChild(wordRow);
    var placed = [];
    var tiles = [];
    function redraw() {
      MQ.clear(line);
      if (!placed.length) line.appendChild(el('span', { class: 'pt-line-ph' }, 'Your words go here'));
      placed.forEach(function (t, i) {
        line.appendChild(
          el('button', { class: 'pt-tile pt-tile-in', type: 'button', 'data-tok': t.tok, onclick: function () {
            if (api.isAnswered()) return;
            placed.splice(i, 1);
            t.btn.disabled = false;
            redraw();
          } }, t.tok)
        );
      });
    }
    function makeTile(tok, row) {
      var b = el('button', { class: 'pt-tile', type: 'button', 'data-tok': tok }, tok);
      var rec = { tok: tok, btn: b };
      b.addEventListener('click', function () {
        if (api.isAnswered() || b.disabled || placed.length >= 5) return;
        MQ.sound('click');
        placed.push(rec);
        b.disabled = true;
        redraw();
      });
      tiles.push(rec);
      row.appendChild(b);
    }
    U.shuffle(nums).forEach(function (n) {
      makeTile(String(n), numRow);
    });
    ['quarter', 'half', 'minutes', 'past', 'to'].forEach(function (w) {
      makeTile(w, wordRow);
    });
    redraw();
    var btns = el('div', { class: 'pt-btns' });
    var clearBtn = el('button', { class: 'btn btn-ghost pt-clear', type: 'button', onclick: function () {
      if (api.isAnswered()) return;
      placed.forEach(function (t) { t.btn.disabled = false; });
      placed = [];
      redraw();
    } }, 'Clear');
    var checkBtn = el('button', { class: 'btn btn-check pt-checkbtn', type: 'button', onclick: function () {
      if (api.isAnswered()) return;
      var toks = placed.map(function (t) { return t.tok; });
      if (!toks.length) {
        api.feedback('Click the tiles to build the time in words.', 'info');
        return;
      }
      var ok = acceptedTiles(q).some(function (a) { return a.join(' ') === toks.join(' '); });
      if (ok) {
        line.classList.add('pt-line-good');
        clock.showHalves();
        clock.showSweep(q.h, q.m);
        api.check(true, ptDigital(q.h, q.m) + ' is ' + toks.join(' ') + '!');
      } else {
        line.classList.add('pt-line-bad');
        api.later(function () { line.classList.remove('pt-line-bad'); }, 500);
        var d = diagTiles(q, toks, api.tries() >= 1);
        api.check(false, d.hint, d.tag);
      }
    } }, 'Check');
    btns.appendChild(clearBtn);
    btns.appendChild(checkBtn);
    L.side.appendChild(btns);
    api.onReveal(function () {
      var ans = acceptedTiles(q)[0];
      tiles.forEach(function (t) { t.btn.disabled = true; });
      placed = ans.map(function (tok) { return { tok: tok, btn: el('span') }; });
      redraw();
      line.classList.add('pt-line-good');
      disp.mark('h');
      disp.mark('m');
      clock.showHalves();
      clock.showSweep(q.h, q.m);
      api.feedback('Hour ' + q.h + ' (before the colon), ' + q.m + ' minutes (after it). Less than 30, so it is PAST: ' + ans.join(' ') + '.', 'info');
    });
  }

  /* ---------------- practice: Level 2 (how many minutes to?) ---------------- */
  function renderTo(stage, api, q) {
    var t = 60 - q.m;
    var nh = ptNext(q.h);
    api.say(q.bonus ? 'A special time: the digits go up by one! Say it with TO.' : 'After half past we say TO. How many minutes to which hour?', 'think');
    var L = layout(stage);
    var clock = makeClock({ hour: q.h, minute: q.m, width: 200, halves: true });
    L.clockBox.appendChild(clock.svg);
    var disp = digital(q.h, q.m);
    L.side.appendChild(q.bonus ? el('div', { class: 'pt-row pt-row-tight' }, disp, el('div', { class: 'pt-bonus' }, 'Bonus! The digits go up by one.')) : disp);
    var minOpts = [t, q.m];
    [t + 10, t - 10, t + 1, t - 1, t + 2].forEach(function (x) {
      if (minOpts.length < 4 && x > 0 && x < 30 && minOpts.indexOf(x) === -1) minOpts.push(x);
    });
    var pickM = null;
    var pickH = null;
    var chM = MQ.ui.choices(U.shuffle(minOpts).map(function (x) { return { label: String(x), value: x }; }), function (v) {
      if (api.isAnswered()) return;
      pickM = v;
      chM.buttons.forEach(function (b) { b.classList.toggle('pt-sel', b.value_ === v); b.classList.remove('bad'); });
    }, { columns: 4 });
    chM.classList.add('pt-chM');
    var chH = MQ.ui.choices(U.shuffle([q.h, nh, ptPrev(q.h)]).map(function (x) { return { label: String(x), value: x }; }), function (v) {
      if (api.isAnswered()) return;
      pickH = v;
      chH.buttons.forEach(function (b) { b.classList.toggle('pt-sel', b.value_ === v); b.classList.remove('bad'); });
    }, { columns: 3 });
    chH.classList.add('pt-chH');
    L.side.appendChild(el('div', { class: 'pt-rowlab' }, 'How many minutes TO the next hour?'));
    L.side.appendChild(chM);
    L.side.appendChild(el('div', { class: 'pt-rowlab' }, 'minutes to …'));
    L.side.appendChild(chH);
    var result = el('div', { class: 'pt-result' });
    var work = el('div', { class: 'pt-work' });
    var checkBtn = el('button', { class: 'btn btn-check pt-checkbtn', type: 'button', onclick: function () {
      if (api.isAnswered()) return;
      if (pickM === null || pickH === null) {
        api.feedback('Pick one number in each row, then press Check.', 'info');
        return;
      }
      var second = api.tries() >= 1;
      if (pickM === t && pickH === nh) {
        chM.mark(pickM, 'good');
        chH.mark(pickH, 'good');
        chM.disable();
        chH.disable();
        result.appendChild(wordsBox(ptDigital(q.h, q.m) + ' is ' + t + ' ' + minWord(t) + ' to ' + nh, 'to'));
        var praise = q.m + ' → 60 is ' + t + '. ' + t + ' ' + minWord(t) + ' to ' + nh + '!';
        if (t === 15) praise += ' We also say quarter to ' + nh + '.';
        else if (q.bonus) praise += ' (You can also say ' + q.m + ' minutes past ' + q.h + '.)';
        api.check(true, praise);
        return;
      }
      if (pickM !== t) chM.mark(pickM, 'bad');
      if (pickH !== nh) chH.mark(pickH, 'bad');
      var hint;
      var tag;
      if (pickM === q.m) {
        tag = "Used minutes past for a 'to' time";
        hint = second ? 'Count on from ' + q.m + ' to 60: ' + jumpsFor(q.m).map(function (j) { return j[1]; }).join(', ') + '. How many minutes is that?' : q.m + ' is how many minutes have GONE since ' + q.h + ' o’clock. For “to”, count on from ' + q.m + ' to 60.';
      } else if (pickM !== t) {
        tag = 'Did not subtract from 60';
        hint = second ? 'Count on in jumps: ' + jumpsFor(q.m).map(function (j) { return j[0] + ' → ' + j[1] + ' is ' + (j[1] - j[0]); }).join(', ') + '. Add the jumps.' : 'Count on from ' + q.m + ' up to 60. How many minutes is that?';
      } else if (pickH === q.h) {
        tag = 'Forgot to change the hour';
        hint = second ? 'After ' + q.h + ' o’clock comes ' + nh + ' o’clock. We are counting the minutes TO ' + nh + '.' : t + ' minutes is right! But it is nearly the NEXT hour. Which o’clock is coming?';
      } else {
        tag = 'Changed the hour the wrong way';
        hint = second ? 'After ' + q.h + ' o’clock comes ' + nh + ' o’clock. We count TO that one.' : t + ' minutes is right! “To” uses the hour that is coming next, not the one before.';
      }
      api.check(false, hint, tag);
    } }, 'Check');
    L.side.appendChild(checkBtn);
    L.side.appendChild(result);
    stage.appendChild(work);
    api.onReveal(function () {
      chM.mark(t, 'good');
      chH.mark(nh, 'good');
      chM.disable();
      chH.disable();
      clock.showSweep(q.h, q.m);
      var bar = makeBar(q.h, { gone: q.m, togo: t });
      bar.label(1, q.m, q.m + ' gone', 'pt-barlab-gone');
      bar.label(q.m + 1, 60, String(t), 'pt-barlab-to');
      jumpsFor(q.m).forEach(function (j) { bar.jump(j[0], j[1]); });
      bar.svg.setAttribute('width', 640);
      work.appendChild(bar.svg);
      work.appendChild(el('div', { class: 'pt-workrow' }, jumpChips(q.m), hourChange(q.h, nh, 'hour up one'), wordsBox(t + ' ' + minWord(t) + ' to ' + nh, 'to')));
      api.feedback('Count on from ' + q.m + ' to 60: ' + t + ' minutes to go, so it is ' + t + ' ' + minWord(t) + ' to ' + nh + (t === 15 ? ' (quarter to ' + nh + ')' : '') + '.', 'info');
    });
  }

  /* ---------------- practice: Level 3 (words to digital) ---------------- */
  function parseTime(raw) {
    var s = String(raw || '').trim().replace(/\s+/g, '').replace(/[.;]/g, ':');
    var mm = s.match(/^(\d{1,2}):(\d{2})$/);
    if (mm) return { h: +mm[1], m: +mm[2], leadOk: mm[1].length === 2, colon: true };
    mm = s.match(/^(\d{1,2}):(\d)$/);
    if (mm) return { h: +mm[1], m: +mm[2], shortMin: true, colon: true };
    mm = s.match(/^(\d{3,4})$/);
    if (mm) return { h: +s.slice(0, -2), m: +s.slice(-2), leadOk: s.length === 4, colon: false };
    return null;
  }

  function saidText(q) {
    if (q.sub === 'past') return q.n + ' ' + minWord(q.n) + ' past ' + q.said;
    if (q.sub === 'to') return q.n + ' ' + minWord(q.n) + ' to ' + q.said;
    return 'quarter to ' + HOUR_WORDS[q.said];
  }

  function diagType(q, h, m, second) {
    var H = q.said;
    if (q.sub === 'past') {
      var strongP = 'Past means after ' + H + ' o’clock: the hour is ' + H + ' and the minutes are ' + q.n + '.';
      if (h === q.n && m === H) return { tag: 'Swapped hours and minutes', hint: second ? strongP : 'The hour goes before the colon and the minutes after it.' };
      if (h === ptPrev(H) && m === 60 - q.n) return { tag: "Used 'to' working for a 'past' time", hint: second ? strongP : 'That is the working for a “to” time. PAST means just after ' + H + ' o’clock, so nothing changes.' };
      if (h !== H) return { tag: "Changed the hour for a 'past' time", hint: second ? strongP : 'For a “past” time the hour stays the same: ' + H + '.' };
      return { tag: 'Read the minutes wrong', hint: second ? strongP : 'The minutes are the number before “minutes past”: ' + q.n + '.' };
    }
    var t = q.n;
    var left = 60 - t;
    var what = q.sub === 'qto' ? 'Quarter to ' + HOUR_WORDS[H] + ' means 15 minutes to ' + H : t + ' minutes to ' + H + ' means ' + H + ' o’clock is ' + t + ' minutes away';
    var strong = 'Take ' + t + ' off the end of the hour: count on from your answer to 60 to check it makes ' + t + '. The hour is the one before ' + H + ': ' + ptPrev(H) + '.';
    if (h === H && m === t) return { tag: 'Did not subtract from 60', hint: second ? strong : what + '. It is not ' + H + ' o’clock yet! How many minutes have gone, and which hour is it now?' };
    if (h === H && m === left) return { tag: 'Forgot to change the hour', hint: second ? strong : left + ' minutes is right! But it is still BEFORE ' + H + ' o’clock, so the hour is ' + ptPrev(H) + '.' };
    if (h === ptPrev(H) && m === t) return { tag: 'Did not subtract from 60', hint: second ? strong : 'The hour ' + ptPrev(H) + ' is right! But ' + t + ' is the minutes still TO GO. How many have gone? Take ' + t + ' off the 60-minute hour.' };
    if (h === ptNext(H)) return { tag: 'Changed the hour the wrong way', hint: second ? strong : '“To ' + H + '” means just BEFORE ' + H + ' o’clock, so the hour goes back one, not forward.' };
    if (m === left) return { tag: 'Changed the hour the wrong way', hint: second ? strong : 'The minutes ' + left + ' are right. Check the hour: it is the hour just before ' + H + '.' };
    return { tag: 'Did not subtract from 60', hint: second ? strong : what + '. Count on from your minutes to 60: does it make ' + t + '?' };
  }

  function renderType(stage, api, q) {
    var scene = SCENES[api.index % SCENES.length];
    var said = saidText(q);
    if (q.sub === 'qto') {
      api.say('Finish the sentence with a digital time.', 'think');
      stage.appendChild(MQ.ui.prompt('<b>Quarter to ' + HOUR_WORDS[q.said] + '</b> is the same as …'));
    } else {
      api.say('Write the time the way a digital clock shows it.', 'think');
      stage.appendChild(MQ.ui.prompt(scene + ' <b>' + said + '</b>.<br>Write it as a digital time.'));
    }
    var input = el('input', { class: 'num-input pt-timein', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: 5, placeholder: '--:--', 'aria-label': 'Digital time' });
    var check = el('button', { class: 'btn btn-check pt-checkbtn', type: 'button' }, 'Check');
    stage.appendChild(el('div', { class: 'num-row' }, input, check));
    stage.appendChild(el('div', { class: 'pt-help' }, 'Type hours, a colon, then minutes, like 08:30.'));
    var work = el('div', { class: 'pt-work' });
    stage.appendChild(work);
    function submit() {
      if (api.isAnswered() || input.disabled) return;
      var p = parseTime(input.value);
      if (!p) {
        input.classList.remove('shake');
        void input.offsetWidth;
        input.classList.add('shake');
        api.feedback('Type the time like 08:30: hours, a colon, then two digits for the minutes.', 'info');
        return;
      }
      var second = api.tries() >= 1;
      if (p.h === q.h && p.m === q.m) {
        input.classList.remove('bad');
        input.classList.add('good');
        input.disabled = true;
        check.disabled = true;
        var note = '';
        if (p.shortMin) note = ' Minutes always have two digits on a digital clock, so we write ' + ptDigital(q.h, q.m) + '.';
        else if (!p.colon) note = ' We write it with a colon: ' + ptDigital(q.h, q.m) + '.';
        else if (!p.leadOk) note = ' A digital clock shows it as ' + ptDigital(q.h, q.m) + '.';
        var extra = '';
        if (q.sub === 'past' && q.n > 30) extra = ' ' + q.n + ' minutes past ' + q.said + ' is the same as ' + (60 - q.n) + ' minutes to ' + ptNext(q.said) + '.';
        api.check(true, 'Yes! ' + said.charAt(0).toUpperCase() + said.slice(1) + ' is ' + ptDigital(q.h, q.m) + '.' + note + extra);
        return;
      }
      input.classList.add('bad');
      var d = diagType(q, p.h, p.m, second);
      api.check(false, d.hint, d.tag);
    }
    check.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    });
    input.addEventListener('input', function () {
      input.classList.remove('bad');
    });
    api.later(function () {
      try {
        input.focus({ preventScroll: true });
      } catch (e) {}
    }, 50);
    api.onReveal(function () {
      input.value = ptDigital(q.h, q.m);
      input.classList.remove('bad');
      input.classList.add('good');
      input.disabled = true;
      check.disabled = true;
      var clock = makeClock({ hour: q.h, minute: q.m, width: 190, halves: true });
      clock.showSweep(q.h, q.m);
      var bar;
      var right = el('div', { class: 'pt-col pt-workcol' });
      if (q.sub === 'past') {
        bar = makeBar(q.h, { gone: q.m });
        bar.label(1, q.m, q.m + ' minutes past ' + q.h, 'pt-barlab-gone');
        right.appendChild(bar.svg);
        right.appendChild(el('div', { class: 'pt-workrow' }, hourChange(q.h, q.h, 'past: the hour stays the same'), wordsBox(ptDigital(q.h, q.m), 'past')));
        api.feedback(said + ': the hour stays ' + q.h + ' and ' + q.m + ' minutes have gone → ' + ptDigital(q.h, q.m) + '.', 'info');
      } else {
        bar = makeBar(q.h, { gone: q.m, togo: q.n });
        bar.label(1, q.m, q.m + ' gone', 'pt-barlab-gone');
        bar.label(q.m + 1, 60, q.n + ' to go', 'pt-barlab-to');
        jumpsFor(q.m).forEach(function (j) { bar.jump(j[0], j[1]); });
        right.appendChild(bar.svg);
        right.appendChild(el('div', { class: 'pt-workrow' }, jumpChips(q.m), hourChange(q.said, q.h, 'the hour goes back one'), wordsBox(ptDigital(q.h, q.m), 'to')));
        api.feedback('Take ' + q.n + ' off the end of the hour: ' + q.m + ' minutes are left (count on ' + q.m + ' → 60 = ' + q.n + '). Before ' + q.said + ' o’clock the hour is ' + q.h + ' → ' + ptDigital(q.h, q.m) + '.', 'info');
      }
      work.appendChild(el('div', { class: 'pt-wrap' }, el('div', { class: 'pt-clockbox pt-clockbox-sm' }, clock.svg), right));
    });
  }

  MQ.register('past-or-to', {
    learn: [learnSplit, learnHalves, learnBar, learnBack],
    practice: {
      count: COUNT,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        var box = el('div', { class: 'pt-q', 'data-kind': q.kind + (q.sub ? '-' + q.sub : ''), 'data-h': q.h, 'data-m': q.m });
        stage.appendChild(box);
        if (q.kind === 'tiles') renderTiles(box, api, q);
        else if (q.kind === 'to') renderTo(box, api, q);
        else renderType(box, api, q);
      },
    },
  });

  var css = [
    '.pt-q{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.pt-wrap{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:14px 26px;width:100%}',
    '.pt-clockbox{flex:0 1 280px;max-width:100%;display:flex;flex-direction:column;align-items:center}',
    '.pt-clockbox-sm{flex:0 1 190px}',
    '.pt-clock{display:block;user-select:none;-webkit-user-select:none}',
    '.pt-side{flex:1 1 300px;max-width:470px;min-width:0;display:flex;flex-direction:column;align-items:center;gap:10px}',
    '.pt-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px 28px}',
    '.pt-col{display:flex;flex-direction:column;align-items:center;gap:8px;min-width:0}',
    '.pt-workcol{flex:1 1 420px;max-width:800px}',
    '.pt-half-past{fill:#e3f6f3}',
    '.pt-half-to{fill:#efe7f8}',
    '.pt-half-label{font-weight:800;opacity:.85}',
    '.pt-past-txt{fill:#0b6e66}',
    '.pt-to-txt{fill:#6a4c93}',
    '.pt-sweep-past{fill:rgba(46,196,182,.35)}',
    '.pt-sweep-to{fill:rgba(130,90,190,.32)}',
    '.pt-hit{fill:transparent;cursor:pointer;pointer-events:all}',
    '.pt-digital{font-family:"Courier New",monospace;font-weight:800;font-size:2.4rem;background:#1b2a4a;color:#7CFC9A;border-radius:12px;padding:4px 16px;letter-spacing:2px;display:inline-flex;align-items:center;line-height:1.2}',
    '.pt-digital span{border-radius:8px;padding:0 4px;transition:background .3s,color .3s}',
    '.pt-digital .pt-hl-h{background:#ffd166;color:#1b2a4a}',
    '.pt-digital .pt-hl-m{background:#ffb38a;color:#1b2a4a}',
    '.pt-dbox{display:flex;flex-direction:column;align-items:center;gap:4px}',
    '.pt-dtags{display:flex;gap:26px;font-weight:800}',
    '.pt-dtag{padding:2px 10px;border-radius:10px}',
    '.pt-dtag-h{background:#ffd166}',
    '.pt-dtag-m{background:#ffb38a}',
    '.pt-drop{min-width:240px;min-height:58px;border:3px dashed var(--line);border-radius:14px;display:flex;align-items:center;justify-content:center;color:var(--ink-soft);font-weight:800;font-size:1.1rem;padding:6px 14px;background:#fff}',
    '.pt-drop.pt-over{border-color:var(--accent);background:#effbf9}',
    '.pt-drop-good{border-style:solid;border-color:var(--good);background:var(--good-bg);color:var(--good);font-size:1.4rem}',
    '.pt-cards{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}',
    '.pt-card{background:#fff;border:3px solid var(--line);border-radius:14px;padding:10px 16px;font-weight:800;font-size:1.2rem;cursor:grab;user-select:none;position:relative}',
    '.pt-card:hover{border-color:var(--accent)}',
    '.pt-card.pt-dragging{z-index:5;box-shadow:0 8px 20px rgba(27,42,74,.2);cursor:grabbing}',
    '.pt-card.pt-used{visibility:hidden}',
    '.pt-words{font-size:1.45rem;font-weight:800;background:#fff;border:3px solid var(--line);border-radius:14px;padding:6px 16px;text-align:center}',
    '.pt-words-past{border-color:#2ec4b6;color:#0b6e66}',
    '.pt-words-to{border-color:#8a63c2;color:#5b3f86}',
    '.pt-note{color:var(--ink-soft);font-weight:700;text-align:center;max-width:420px}',
    '.pt-legend{font-size:.95rem;color:var(--ink-soft);font-weight:700;line-height:1.8}',
    '.pt-sw{display:inline-block;width:18px;height:18px;border-radius:5px;vertical-align:-3px;margin-right:6px}',
    '.pt-sw-past{background:#bfeee8}',
    '.pt-sw-to{background:#dccbf0}',
    '.pt-bar{display:block;user-select:none;-webkit-user-select:none}',
    '.pt-cell{fill:#fff;stroke:#c9d3ee;stroke-width:1}',
    '.pt-c-gone{fill:#9fe0d8}',
    '.pt-c-togo{fill:#cdb6ec}',
    '.pt-bar-outline{fill:none;stroke:#1b2a4a;stroke-width:2.5}',
    '.pt-tick10{stroke:#1b2a4a;stroke-width:2}',
    '.pt-tick5{stroke:#1b2a4a;stroke-width:1.2}',
    '.pt-barnum{font-size:14px;font-weight:800;fill:#1b2a4a}',
    '.pt-barnum5{font-size:12px;fill:#4a5a7d}',
    '.pt-endlab{font-size:16px;font-weight:800;fill:#4a5a7d}',
    '.pt-barlab{font-size:16px;font-weight:800;pointer-events:none;paint-order:stroke;stroke:#fff;stroke-width:4px;stroke-linejoin:round}',
    '.pt-hchoices{max-width:260px}',
    '.pt-hchoices .choice{min-height:48px}',
    '.pt-barlab-gone{fill:#0b5a53}',
    '.pt-barlab-to{fill:#4a2f72}',
    '.pt-jump{fill:none;stroke:#8a63c2;stroke-width:2.5}',
    '.pt-jumplab{font-size:13px;font-weight:800;fill:#5b3f86}',
    '.pt-count{display:flex;align-items:baseline;gap:8px}',
    '.pt-big{font-size:2.6rem;font-weight:800;color:#5b3f86;line-height:1}',
    '.pt-biglab{font-weight:800;color:var(--ink-soft);font-size:1.1rem}',
    '.pt-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;max-width:780px}',
    '.pt-chips:empty{display:none}',
    '.pt-chip{font-weight:800;padding:3px 9px}',
    '.pt-chip-to{background:#efe7f8;border-color:#8a63c2;color:#4a2f72}',
    '.pt-chiplab{font-weight:800;color:var(--ink-soft)}',
    '.pt-op{font-weight:800;color:var(--ink-soft);font-size:1.2rem}',
    '.pt-result{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:center;justify-content:center}',
    '.pt-result:empty{display:none}',
    '.pt-hchange{display:flex;align-items:center;gap:8px;font-weight:800}',
    '.pt-hbox{display:inline-block;min-width:40px;text-align:center;background:#ffd166;border-radius:10px;padding:2px 8px;font-size:1.3rem}',
    '.pt-hbox-new{background:#ffe9a8;border:2px solid #e0a800}',
    '.pt-harrow{font-size:1.3rem;color:#e85d04}',
    '.pt-htext{color:var(--ink-soft);font-size:.95rem}',
    '.pt-fine{display:flex;gap:10px;justify-content:center}',
    '.pt-fine:empty{display:none}',
    '.pt-finebtn{font-size:.95rem;padding:6px 12px}',
    '.pt-q-small{font-weight:800;font-size:1.15rem;text-align:center}',
    '.pt-result .choices{max-width:320px}',
    '.pt-line{min-height:62px;width:100%;max-width:460px;border:3px dashed var(--line);border-radius:14px;background:#fff;display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:center;padding:6px}',
    '.pt-line-good{border-style:solid;border-color:var(--good);background:var(--good-bg)}',
    '.pt-line-bad{border-color:var(--try)}',
    '.pt-line-ph{color:var(--ink-soft);font-weight:700}',
    '.pt-bank{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}',
    '.pt-tile{font-family:inherit;font-weight:800;font-size:1.2rem;padding:8px 14px;border-radius:12px;border:3px solid var(--line);background:#fff;color:var(--ink);cursor:pointer;min-width:52px}',
    '.pt-tile:hover:not(:disabled){border-color:var(--accent)}',
    '.pt-tile:disabled{opacity:.3;cursor:default}',
    '.pt-tile-in{background:#fff8e1;border-color:#e0a800}',
    '.pt-btns{display:flex;gap:10px;justify-content:center}',
    '.pt-rowlab{font-weight:800;color:var(--ink-soft);margin-bottom:-4px}',
    '.pt-side .choices{max-width:400px}',
    '.pt-side .choice{min-height:46px;padding:4px 10px}',
    '.pt-row-tight{gap:8px 12px}',
    '.pt-bonus{max-width:220px;text-align:center;font-weight:800;font-size:1.1rem;color:#9a6b00;background:#fff3cd;border-radius:12px;padding:2px 12px}',
    '.choice.pt-sel{border-color:#1b2a4a;background:#fff3cd}',
    '.pt-work{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.pt-work:empty{display:none}',
    '.pt-workrow{display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center;justify-content:center}',
    '.pt-timein{width:170px;font-family:"Courier New",monospace;letter-spacing:2px}',
    '.pt-help{color:var(--ink-soft);font-weight:700;margin-top:-6px}',
    '@media (max-width:700px){.pt-digital{font-size:2rem}.pt-words{font-size:1.2rem}.pt-tile{font-size:1.05rem;padding:6px 10px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'past-or-to' }, css));
})();

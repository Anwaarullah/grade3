/* Calendar Hops — count on and back in days and weeks on real month calendars (Unit 14.1).
 * Every calendar is a real month (2026 / early 2027) drawn with Monday first, from JS Date.
 * A date is kept as a day number n = days since 1 Jan 1970 (UTC), so "N days later" is n + N.
 * Two counting rules, always labelled on screen and never mixed:
 *   days BETWEEN two dates  = leave out both end dates  (= later − earlier − 1)
 *   how long away / nights  = count the hops from the first day to the last (= later − earlier)
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  var ID = 'calendar-hops';
  var DAY = 86400000;
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var WD = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var WDS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var CW = 46; // cell width
  var CH = 42; // cell height
  var X0 = 4;
  var TOP = 62;

  var TAG = {
    between: "Counted the start or end date for 'between'",
    startDay: 'Counted the start day as day 1',
    extra: 'Counted one day too many',
    month: 'Forgot the month length',
    daysWeeks: 'Added days instead of weeks',
    rows: 'Hopped the wrong number of weeks',
    wrongWay: 'Counted the wrong way (after / before)',
    miscount: 'Miscounted the hops',
    checkout: 'Checked out a day late or early',
    nights: 'Miscounted the nights',
    step: 'Missed a step in the story',
    weekday: 'Weekday does not match the date',
    awayBoth: "Counted both end days for 'how long away'",
    awayBetween: "Used the 'between' rule for 'how long away'",
    missedDay: 'Missed a day when counting',
  };

  /* ---------------- dates ---------------- */
  function dn(y, m, d) {
    return Math.round(Date.UTC(y, m, d) / DAY);
  }
  function info(n) {
    var t = new Date(n * DAY);
    return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate(), wd: (t.getUTCDay() + 6) % 7 };
  }
  function mlen(y, m) {
    return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  }
  function ds(n) {
    var i = info(n);
    return i.d + ' ' + MONTHS[i.m];
  }
  function dsw(n) {
    var i = info(n);
    return WD[i.wd] + ' ' + i.d + ' ' + MONTHS[i.m];
  }
  function mk(y, m) {
    return y * 12 + m;
  }
  function ymOf(k) {
    return [Math.floor(k / 12), k % 12];
  }
  /** Every month from the month of a to the month of b. */
  function monthsSpan(a, b) {
    var A = info(Math.min(a, b));
    var B = info(Math.max(a, b));
    var out = [];
    for (var k = mk(A.y, A.m); k <= mk(B.y, B.m); k++) out.push(ymOf(k));
    return out;
  }
  function plural(n, w) {
    return n + ' ' + w + (n === 1 ? '' : 's');
  }
  function running(w) {
    var a = [];
    for (var i = 1; i <= w; i++) a.push(7 * i);
    return a.join(', ');
  }
  function sevens(w) {
    var a = [];
    for (var i = 0; i < w; i++) a.push(7);
    return a;
  }

  /* ---------------- the calendar ---------------- */
  function monthSvg(y, m) {
    var len = mlen(y, m);
    var off = info(dn(y, m, 1)).wd;
    var rows = Math.ceil((off + len) / 7);
    var W = X0 * 2 + 7 * CW;
    var H = TOP + rows * CH + 6;
    var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'chp-cal', role: 'img', 'aria-label': MONTHS[m] + ' ' + y, 'data-month': y + '-' + (m + 1) });
    svg.appendChild(S('rect', { x: 1, y: 1, width: W - 2, height: H - 2, rx: 12, class: 'chp-paper' }));
    svg.appendChild(S('rect', { x: 1, y: 1, width: W - 2, height: 34, rx: 12, class: 'chp-band' }));
    svg.appendChild(S('rect', { x: 1, y: 20, width: W - 2, height: 15, class: 'chp-band' }));
    svg.appendChild(S('text', { x: W / 2, y: 25, 'text-anchor': 'middle', class: 'chp-title' }, MONTHS[m] + ' ' + y));
    for (var c = 0; c < 7; c++) {
      svg.appendChild(S('text', { x: X0 + c * CW + CW / 2, y: 54, 'text-anchor': 'middle', class: 'chp-wd' + (c >= 5 ? ' chp-wd-we' : '') }, WDS[c]));
    }
    var cells = {};
    for (var d = 1; d <= len; d++) {
      var idx = off + d - 1;
      var col = idx % 7;
      var row = Math.floor(idx / 7);
      var x = X0 + col * CW;
      var yy = TOP + row * CH;
      var g = S('g', { class: 'chp-day' + (col >= 5 ? ' chp-we' : ''), 'data-date': y + '-' + (m + 1) + '-' + d });
      g.appendChild(S('rect', { x: x + 2, y: yy + 2, width: CW - 4, height: CH - 4, rx: 7, class: 'chp-cell' }));
      g.appendChild(S('text', { x: x + CW / 2 - 3, y: yy + CH / 2 + 7, 'text-anchor': 'middle', class: 'chp-num' }, String(d)));
      svg.appendChild(g);
      cells[d] = { g: g, x: x + CW / 2, y: yy + CH / 2, bx: x + CW - 10, by: yy + 11 };
    }
    var over = S('g', { class: 'chp-over' });
    svg.appendChild(over);
    return { svg: svg, cells: cells, over: over, y: y, m: m, len: len };
  }

  /** One or more months side by side. opts.onPick(n) when a day is clicked. */
  function calView(months, opts) {
    opts = opts || {};
    var wrap = el('div', { class: 'chp-cals chp-n' + months.length });
    var map = {};
    var mons = months.map(function (ym) {
      var M = monthSvg(ym[0], ym[1]);
      M.box = el('div', { class: 'chp-calbox' }, M.svg);
      wrap.appendChild(M.box);
      for (var d = 1; d <= M.len; d++) map[dn(ym[0], ym[1], d)] = { M: M, c: M.cells[d] };
      if (opts.onPick) {
        M.svg.classList.add('chp-live');
        M.svg.addEventListener('click', function (e) {
          var g = e.target.closest ? e.target.closest('.chp-day') : null;
          if (!g) return;
          var p = g.getAttribute('data-date').split('-');
          opts.onPick(dn(+p[0], +p[1] - 1, +p[2]));
        });
      }
      return M;
    });
    var view = { el: wrap, months: mons, map: map };
    view.has = function (n) {
      return !!map[n];
    };
    view.cls = function (n, cls, on) {
      var e = map[n];
      if (e) e.c.g.classList[on === false ? 'remove' : 'add'](cls);
    };
    view.clearCls = function (cls) {
      Object.keys(map).forEach(function (k) {
        map[k].c.g.classList.remove(cls);
      });
    };
    view.badge = function (n, text, delay, cls) {
      var e = map[n];
      if (!e) return null;
      var t = String(text);
      var b = S('g', { class: 'chp-badge' + (cls ? ' ' + cls : ''), style: { animationDelay: (delay || 0) + 'ms' } },
        S('circle', { cx: e.c.bx, cy: e.c.by, r: t.length > 2 ? 12 : 10 }),
        S('text', { x: e.c.bx, y: e.c.by + 4, 'text-anchor': 'middle' }, t));
      e.M.over.appendChild(b);
      return b;
    };
    view.icon = function (n, text, delay) {
      var e = map[n];
      if (!e) return null;
      var b = S('text', { x: e.c.bx, y: e.c.by + 6, 'text-anchor': 'middle', class: 'chp-icon', style: { animationDelay: (delay || 0) + 'ms' } }, text);
      e.M.over.appendChild(b);
      return b;
    };
    /** A curved hop arrow between two days on the same month page. */
    view.arc = function (a, b, delay) {
      var A = map[a];
      var B = map[b];
      if (!A || !B || A.M !== B.M) return null;
      var x1 = A.c.x;
      var y1 = A.c.y;
      var x2 = B.c.x;
      var y2 = B.c.y;
      var mx = (x1 + x2) / 2;
      var my = (y1 + y2) / 2;
      var dx = x2 - x1;
      var dy = y2 - y1;
      var L = Math.sqrt(dx * dx + dy * dy) || 1;
      var bend = Math.min(26, L * 0.35);
      var cx = mx + (dy / L) * bend;
      var cy = my - (dx / L) * bend;
      var p = S('path', { d: 'M' + x1 + ' ' + y1 + ' Q' + cx + ' ' + cy + ' ' + x2 + ' ' + y2, class: 'chp-arc', style: { animationDelay: (delay || 0) + 'ms' } });
      A.M.over.insertBefore(p, A.M.over.firstChild);
      return p;
    };
    view.clearOver = function () {
      mons.forEach(function (M) {
        MQ.clear(M.over);
      });
    };
    return view;
  }

  function ruleBox(kind) {
    if (kind === 'between') return el('div', { class: 'chp-rule chp-rule-between' }, el('b', null, 'Days BETWEEN'), ': leave out both end dates.');
    if (kind === 'away') return el('div', { class: 'chp-rule chp-rule-away' }, el('b', null, 'How long away'), ': count the hops from leave day to home day.');
    if (kind === 'nights') return el('div', { class: 'chp-rule chp-rule-away' }, el('b', null, 'Nights'), ': one bed each night. Check out the next morning.');
    if (kind === 'week') return el('div', { class: 'chp-rule chp-rule-week' }, el('b', null, '1 week'), ' = one row down = 7 days.');
    return el('div', { class: 'chp-rule chp-rule-week' }, el('b', null, 'Counting on'), ': finger on the start day. The first hop is day 1.');
  }

  function chipsRow(items, cls) {
    var row = el('div', { class: 'chp-chips' });
    items.forEach(function (t, i) {
      if (t === '→' || t === '+' || t === '=') row.appendChild(el('span', { class: 'chp-op' }, t));
      else row.appendChild(el('span', { class: 'chp-chip' + (cls ? ' ' + cls : ''), style: { animationDelay: i * 0.12 + 's' } }, t));
    });
    return row;
  }

  function hopDelay(n) {
    return Math.max(45, Math.min(130, Math.floor(2600 / Math.max(1, n))));
  }

  /** Day-by-day hop badges 1..n from start (exclusive) in direction dir. Returns total animation ms. */
  function dayHops(view, start, n, dir, cls) {
    var step = hopDelay(n);
    for (var k = 1; k <= n; k++) {
      var c = start + dir * k;
      view.cls(c, 'chp-path');
      view.badge(c, k, k * step, cls);
    }
    return n * step;
  }

  /** Week hops: badges 7, 14, 21 … one row at a time. */
  function weekHops(view, start, w, dir) {
    for (var k = 1; k <= w; k++) {
      var c = start + dir * 7 * k;
      view.arc(start + dir * 7 * (k - 1), c, k * 380);
      view.cls(c, 'chp-path');
      view.badge(c, 7 * k, k * 380 + 120, 'chp-badge-week');
    }
    return w * 380 + 200;
  }

  /* ---------------- answer panels ---------------- */
  /** Click a date on the calendar (and pick a weekday if askDay), then Check. */
  function datePanel(api, q, onCheck) {
    var chosen = null;
    var wd = null;
    var locked = false;
    var view = calView(q.months, {
      onPick: function (n) {
        if (locked) return;
        chosen = n;
        view.clearCls('chp-sel');
        view.cls(n, 'chp-sel');
        MQ.sound('pop');
        show.innerHTML = 'Your answer: <b>' + ds(n) + '</b>';
      },
    });
    var show = el('div', { class: 'chp-pick' }, 'Click the date on the calendar.');
    var wdCh = null;
    if (q.askDay) {
      wdCh = MQ.ui.choices(WDS.map(function (w, i) {
        return { label: w, value: i };
      }), function (v) {
        if (locked) return;
        wd = v;
        wdCh.buttons.forEach(function (b) {
          b.classList.toggle('chp-on', b.value_ === v);
        });
      }, { columns: 7 });
      wdCh.classList.add('chp-wdch');
    }
    var btn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    btn.addEventListener('click', function () {
      if (locked) return;
      if (chosen == null) {
        api.feedback('Click a date on the calendar first.', 'info');
        return;
      }
      if (q.askDay && wd == null) {
        api.feedback('Now choose the day of the week too.', 'info');
        return;
      }
      onCheck(chosen, wd);
    });
    var ans = el('div', { class: 'chp-answer' }, show, q.askDay ? el('div', { class: 'chp-sub' }, 'Which day of the week?') : null, wdCh, btn);
    return {
      view: view,
      el: ans,
      chosen: function () {
        return chosen;
      },
      bad: function () {
        if (chosen != null) {
          view.cls(chosen, 'chp-bad');
          var c = chosen;
          api.later(function () {
            view.cls(c, 'chp-bad', false);
          }, 900);
        }
      },
      done: function (n, w) {
        locked = true;
        btn.disabled = true;
        view.months.forEach(function (M) {
          M.svg.classList.remove('chp-live');
        });
        view.clearCls('chp-sel');
        view.cls(n, 'chp-ans');
        show.innerHTML = 'Answer: <b>' + (q.askDay ? dsw(n) : ds(n)) + '</b>';
        if (wdCh) {
          wdCh.disable();
          wdCh.buttons.forEach(function (b) {
            b.classList.remove('chp-on');
          });
          wdCh.mark(w, 'good');
        }
      },
    };
  }

  /** Type a number of days. The calendar can be clicked to tick days as a counting aid. */
  function numberPanel(api, q, onCheck) {
    var ticks = {};
    var count = 0;
    var locked = false;
    var tally = el('div', { class: 'chp-tally' }, 'Click days to tick them while you count.');
    var view = calView(q.months, {
      onPick: function (n) {
        if (locked) return;
        if (q.kind === 'between' && (n === q.a || n === q.b)) {
          api.feedback('That is an end date. For "between" it does not count.', 'info');
          return;
        }
        ticks[n] = !ticks[n];
        view.cls(n, 'chp-tick', ticks[n]);
        count += ticks[n] ? 1 : -1;
        MQ.sound('pop');
        tally.innerHTML = 'Days you have ticked: <b>' + count + '</b>';
      },
    });
    var box = MQ.ui.numberInput({
      unit: 'days',
      onSubmit: function (v) {
        if (locked) return;
        if (v !== Math.floor(v) || v < 0) {
          api.feedback('Type a whole number of days.', 'info');
          return;
        }
        onCheck(v);
      },
    });
    box.focus();
    return {
      view: view,
      el: el('div', { class: 'chp-answer' }, tally, box.el),
      box: box,
      done: function (v) {
        locked = true;
        box.setValue(String(v));
        box.disable();
        box.good();
        view.clearCls('chp-tick');
        view.months.forEach(function (M) {
          M.svg.classList.remove('chp-live');
        });
        tally.textContent = '';
      },
    };
  }

  /* ---------------- question data ---------------- */
  var POOL_FROM = mk(2026, 0);
  var POOL_TO = mk(2027, 2); // January 2026 … March 2027

  function pickMonth(ok) {
    var list = [];
    for (var k = POOL_FROM; k <= POOL_TO; k++) {
      var ym = ymOf(k);
      if (!ok || ok(k, mlen(ym[0], ym[1]))) list.push(k);
    }
    return U.pick(list);
  }

  var NAMES = ['Maya', 'Sam', 'Ali', 'Zara', 'Leo', 'Nadia', 'Omar', 'Ruby', 'Tariq', 'Ella'];

  function mkDateQ(o) {
    // o: kind, start, dir, n (days), weeks, months, text, rule
    o.ans = o.start + o.dir * o.n;
    o.key = o.kind + ':' + o.start + ':' + o.n + ':' + o.dir;
    o.answerType = 'date';
    var A = info(o.start);
    var B = info(o.ans);
    o.cross = A.m !== B.m;
    return o;
  }

  function genL1(kind, k) {
    var ym = ymOf(k);
    var len = mlen(ym[0], ym[1]);
    var N;
    var d;
    var W = 0;
    var text;
    var dir = kind.indexOf('after') === 0 ? 1 : -1;
    if (kind === 'after-days') {
      N = U.pick([3, 4, 5, 6, 8, 9]);
      d = U.rand(1, len - N);
    } else if (kind === 'before-days') {
      N = U.pick([3, 4, 5, 6, 8, 9]);
      d = U.rand(N + 1, len);
    } else if (kind === 'after-weeks') {
      W = U.pick([1, 2]);
      N = 7 * W;
      d = U.rand(1, len - N);
    } else {
      W = 2;
      N = 14;
      d = U.rand(N + 1, len);
    }
    var start = dn(ym[0], ym[1], d);
    var S1 = '<b>' + dsw(start) + '</b>';
    var wk = plural(W, 'week');
    if (kind === 'after-days') {
      text = U.pick([
        'A bag of bird seed lasts ' + N + ' days. The first bag is opened on ' + S1 + '. On what date is the next bag opened?',
        'Ben plants a bean seed on ' + S1 + '. A shoot pops up ' + N + ' days later. What date is that?',
        'What date is ' + N + ' days after ' + S1 + '?',
      ]);
    } else if (kind === 'before-days') {
      text = U.pick([
        'Gran comes to stay on ' + S1 + '. We tidy the spare room ' + N + ' days before. On what date do we tidy it?',
        'What date is ' + N + ' days before ' + S1 + '?',
        'The school fair is on ' + S1 + '. Posters go up ' + N + ' days before. What date do they go up?',
      ]);
    } else if (kind === 'after-weeks') {
      text = U.pick([
        'Swimming lessons stop on ' + S1 + '. They start again ' + wk + ' later. On what date?',
        'Mum orders a new bike on ' + S1 + '. It arrives ' + wk + ' later. What date does it arrive?',
        'What date is ' + wk + ' after ' + S1 + '?',
      ]);
    } else {
      text = U.pick([
        'The dentist visit was booked for ' + S1 + '. It moved ' + wk + ' earlier. What is the new date?',
        'The zoo trip was planned for ' + S1 + '. It moved ' + wk + ' earlier. What is the new date?',
      ]);
    }
    return mkDateQ({ kind: kind, start: start, dir: dir, n: N, weeks: W, months: [ym], text: text, rule: W ? 'week' : 'on' });
  }

  function genWeeks3After() {
    var k = pickMonth(function (kk) {
      return kk < POOL_TO;
    });
    var ym = ymOf(k);
    var len = mlen(ym[0], ym[1]);
    var d = U.rand(len - 19, len); // 3 weeks later is always in the next month
    var start = dn(ym[0], ym[1], d);
    var text = U.pick([
      'A 3-week holiday starts on <b>' + dsw(start) + '</b>. The family get home 3 weeks later. What date do they get home?',
      'A library book is borrowed on <b>' + dsw(start) + '</b>. It is due back 3 weeks later. What date is it due?',
    ]);
    return mkDateQ({ kind: 'weeks3-after', start: start, dir: 1, n: 21, weeks: 3, months: [ym, ymOf(k + 1)], text: text, rule: 'week' });
  }

  function genWeeks6Before() {
    var k = pickMonth(function (kk) {
      return kk >= POOL_FROM + 2;
    });
    var ym = ymOf(k);
    var d = U.rand(5, mlen(ym[0], ym[1]));
    var start = dn(ym[0], ym[1], d);
    var text = U.pick([
      'Sports day is on <b>' + dsw(start) + '</b>. Practice starts 6 weeks before. On what date does practice start?',
      'The school play is on <b>' + dsw(start) + '</b>. Rehearsals start 6 weeks before. What date do they start?',
    ]);
    return mkDateQ({ kind: 'weeks6-before', start: start, dir: -1, n: 42, weeks: 6, months: monthsSpan(start - 42, start), text: text, rule: 'week' });
  }

  function genCross30() {
    var k = pickMonth(function (kk, len) {
      return kk < POOL_TO && len < 31;
    });
    var ym = ymOf(k);
    var len = mlen(ym[0], ym[1]);
    var N = U.rand(12, 25);
    var d = U.rand(Math.max(1, len - N + 1), Math.min(len, len + 12 - N));
    var start = dn(ym[0], ym[1], d);
    var text = U.pick([
      'School closes on <b>' + dsw(start) + '</b>. It opens again ' + N + ' days later. On what date does it open?',
      'A parcel is posted on <b>' + dsw(start) + '</b>. It takes ' + N + ' days to arrive. On what date does it arrive?',
    ]);
    return mkDateQ({ kind: 'cross-days', start: start, dir: 1, n: N, weeks: 0, months: [ym, ymOf(k + 1)], text: text, rule: 'on' });
  }

  function genBetween() {
    var k = pickMonth(function (kk) {
      return kk < POOL_TO;
    });
    var ym = ymOf(k);
    var len = mlen(ym[0], ym[1]);
    var a;
    var b;
    var n;
    var ym2 = ymOf(k + 1);
    for (var g = 0; g < 200; g++) {
      var d1 = U.rand(len - 12, len - 1);
      var d2 = U.rand(3, 20);
      a = dn(ym[0], ym[1], d1);
      b = dn(ym2[0], ym2[1], d2);
      n = b - a - 1;
      if (n >= 12 && n <= 32) break;
    }
    var text = 'How many days are there <b>between</b> <b>' + ds(a) + '</b> and <b>' + ds(b) + '</b>?';
    return { kind: 'between', answerType: 'number', a: a, b: b, num: n, months: [ym, ym2], text: text, rule: 'between', key: 'between:' + a + ':' + b };
  }

  function genAway() {
    var n = U.rand(9, 27);
    var k = pickMonth(function (kk) {
      return kk < POOL_TO;
    });
    var ym = ymOf(k);
    var len = mlen(ym[0], ym[1]);
    var d = U.rand(Math.max(1, len - n - 8), len - 1);
    var a = dn(ym[0], ym[1], d);
    var b = a + n;
    var who = U.pick(NAMES);
    var text = U.pick([
      who + ' went to stay with cousins on <b>' + dsw(a) + '</b> and came home on <b>' + dsw(b) + '</b>. How many days was ' + who + ' away?',
      who + ' left for camp on <b>' + dsw(a) + '</b> and got home on <b>' + dsw(b) + '</b>. How long was ' + who + ' away?',
    ]);
    return { kind: 'away', answerType: 'number', a: a, b: b, num: n, months: monthsSpan(a, b), text: text, rule: 'away', key: 'away:' + a + ':' + b };
  }

  function genHotel() {
    var N = U.rand(3, 9);
    var k = pickMonth(function (kk) {
      return kk < POOL_TO;
    });
    var ym = ymOf(k);
    var len = mlen(ym[0], ym[1]);
    var d = U.rand(1, len);
    var a = dn(ym[0], ym[1], d);
    var fam = U.pick(['Khan', 'Brown', 'Patel', 'Silva', 'Okafor', 'Lee']);
    var text = 'The ' + fam + ' family arrive at a hotel on <b>' + dsw(a) + '</b>. They stay <b>' + N + ' nights</b>. On what date do they check out?';
    var q = mkDateQ({ kind: 'hotel', start: a, dir: 1, n: N, weeks: 0, months: monthsSpan(a, a + N), text: text, rule: 'nights' });
    return q;
  }

  function genStory() {
    var k = pickMonth(function (kk) {
      return kk < POOL_TO;
    });
    var ym = ymOf(k);
    var len = mlen(ym[0], ym[1]);
    var q;
    if (Math.random() < 0.55) {
      var T = U.rand(2, 4);
      var St = U.rand(5, 11);
      var P = dn(ym[0], ym[1], U.rand(1, len));
      var who = U.pick(NAMES);
      q = {
        kind: 'story', variant: 'travel', start: P, legs: [{ n: T, label: 'travel' }, { n: St, label: 'stay' }], ans: P + T + St,
        text: who + "'s family pack their bags on <b>" + dsw(P) + '</b>. They travel ' + T + ' days later. They stay away ' + St + ' days. On which <b>day</b> and <b>date</b> do they get home?',
      };
    } else {
      var X = dn(ym[0], ym[1], U.rand(1, len));
      var S2 = U.rand(4, 9);
      q = {
        kind: 'story', variant: 'delay', start: X, legs: [{ n: 7, label: 'one week later', week: true }, { n: S2, label: 'stay' }], ans: X + 7 + S2,
        text: 'Grandad was going to visit on <b>' + dsw(X) + '</b>. The visit is put back <b>one week</b>. He stays ' + S2 + ' days, then goes home. On which <b>day</b> and <b>date</b> does he go home?',
      };
    }
    q.answerType = 'date';
    q.askDay = true;
    q.dir = 1;
    q.n = q.ans - q.start;
    q.months = [ym, ymOf(k + 1)];
    q.rule = 'on';
    q.key = 'story:' + q.start + ':' + q.ans;
    return q;
  }

  /* ---------------- the deck ---------------- */
  var deck = null;
  var COUNT = 10;

  function levelOf(i) {
    return i < COUNT / 3 ? 1 : i < (2 * COUNT) / 3 ? 2 : 3;
  }

  function buildDeck() {
    var used = {};
    var usedMonths = {};
    var q = [];
    function take(gen) {
      for (var g = 0; g < 300; g++) {
        var it = gen();
        if (used[it.key]) continue;
        var mkey = String(it.months[0]);
        if (usedMonths[mkey] && g < 40) continue; // vary the months when we can
        used[it.key] = true;
        usedMonths[mkey] = true;
        return it;
      }
      return null;
    }
    // Level 1 (4): one month, no crossing — days after, days before, weeks after, 2 weeks before.
    U.shuffle(['after-days', 'after-weeks', 'before-days', 'before-weeks']).forEach(function (kind) {
      q.push(take(function () {
        return genL1(kind, pickMonth());
      }));
    });
    // Level 2 (3): two or three months — 'between' plus two of: 3 weeks after, 6 weeks before, N days across a short month.
    var l2 = [genBetween].concat(U.shuffle([genWeeks3After, genWeeks6Before, genCross30]).slice(0, 2));
    U.shuffle(l2).forEach(function (gen) {
      q.push(take(gen));
    });
    // Level 3 (3): story (day and date), how long away, hotel nights.
    U.shuffle([genStory, genAway, genHotel]).forEach(function (gen) {
      q.push(take(gen));
    });
    return q;
  }

  /* ---------------- marking ---------------- */
  function monthEndNote(q) {
    var A = info(q.start);
    if (q.dir > 0) return MONTHS[A.m] + ' has ' + mlen(A.y, A.m) + ' days';
    var p = ymOf(mk(A.y, A.m) - 1);
    return MONTHS[p[1]] + ' has ' + mlen(p[0], p[1]) + ' days';
  }

  function diagDate(q, c) {
    var after = q.dir > 0;
    var st = ds(q.start);
    var way = after ? 'forwards' : 'back';
    if (q.weeks && c === q.start + q.dir * q.weeks) {
      return {
        tag: TAG.daysWeeks,
        hint: 'That is ' + q.weeks + ' days ' + (after ? 'after' : 'before') + '. The question says ' + q.weeks + ' WEEKS. One week is one row ' + (after ? 'down' : 'up') + '.',
        strong: plural(q.weeks, 'week') + ' = ' + sevens(q.weeks).join(' + ') + ' = ' + q.n + ' days. Hop ' + q.weeks + ' rows ' + (after ? 'down' : 'up') + ' in the same column.',
      };
    }
    if (c === q.start - q.dir * q.n) {
      return { tag: TAG.wrongWay, hint: after ? '"After" means later. Hop forwards to later dates.' : '"Before" means earlier. Hop back to earlier dates.', strong: 'Start on ' + st + ' and hop ' + way + ' ' + q.n + ' days.' };
    }
    if (c === q.ans - q.dir) {
      return {
        tag: TAG.startDay,
        hint: 'One day out! Did you count ' + st + ' as day 1?' + (q.cross ? ' And check: ' + monthEndNote(q) + '.' : ''),
        strong: 'Put your finger on ' + st + '. The first hop lands on ' + ds(q.start + q.dir) + ': that is day 1.' + (q.cross ? ' ' + monthEndNote(q) + '.' : ''),
      };
    }
    if (c === q.ans + q.dir) {
      return { tag: TAG.extra, hint: 'One day too far. Count your hops again from ' + st + '.', strong: 'Count the hops, not the squares: ' + ds(q.start + q.dir) + ' is hop 1. Stop at hop ' + q.n + '.' };
    }
    if (q.cross && Math.abs(c - q.ans) <= 3) {
      return { tag: TAG.month, hint: 'Close! Check the end of the month. How many days does it have?', strong: monthEndNote(q) + '. Count right to the last day, then carry on from the 1st of the next month.' };
    }
    if (q.weeks && Math.abs(c - q.start) % 7 === 0) {
      return { tag: TAG.rows, hint: 'Right column! Now count the rows: ' + q.weeks + ' hops of one week.', strong: 'Each hop is one row, 7 days: ' + running(q.weeks) + '. Stop after ' + q.weeks + ' hops.' };
    }
    if (q.weeks) {
      return { tag: TAG.daysWeeks, hint: 'Weeks jump straight ' + (after ? 'down' : 'up') + ' a row. The answer stays in the same column as ' + st + '.', strong: 'Hop one row at a time from ' + st + ': ' + running(q.weeks) + ' days.' };
    }
    return { tag: TAG.miscount, hint: 'Start on ' + st + ' and hop ' + way + ' one day at a time. Count ' + q.n + ' hops.', strong: 'Finger on ' + st + '. Say "1" on ' + ds(q.start + q.dir) + ', "2" on ' + ds(q.start + 2 * q.dir) + ' … and stop at ' + q.n + '.' };
  }

  function diagHotel(q, c) {
    if (c === q.ans - 1) return { tag: TAG.checkout, hint: 'That is the last night in bed. You check out the next morning.', strong: q.n + ' nights = ' + q.n + ' beds, starting on ' + ds(q.start) + '. Check out the morning after the last bed.' };
    if (c === q.ans + 1) return { tag: TAG.checkout, hint: 'That is one night too many. Count the beds: ' + q.n + ' nights.', strong: 'Beds on ' + ds(q.start) + ' to ' + ds(q.ans - 1) + '. Check out the next morning.' };
    if (c < q.start) return { tag: TAG.wrongWay, hint: 'They check out after they arrive! Look at later dates.', strong: 'Put a bed on ' + ds(q.start) + ', then one on each night after it, ' + q.n + ' beds in all.' };
    return { tag: TAG.nights, hint: 'One bed each night, starting on ' + ds(q.start) + '. How many beds? ' + q.n + '.', strong: 'Count ' + q.n + ' hops from ' + ds(q.start) + ': each hop is one night.' };
  }

  function diagStory(q, c) {
    var L1 = q.legs[0].n;
    var L2 = q.legs[1].n;
    var mid = q.start + L1;
    var midTxt = q.variant === 'travel' ? 'They travel on ' + dsw(mid) + '.' : 'One week later is ' + dsw(mid) + '.';
    if (q.variant === 'delay' && c === q.start + 1 + L2) {
      return { tag: TAG.daysWeeks, hint: 'Put back ONE WEEK, not one day. One week is one row down.', strong: midTxt + ' Then count ' + L2 + ' days on from there.' };
    }
    if (c === q.start + L2 || c === mid) {
      return { tag: TAG.step, hint: 'There are two steps. Do the first step, then the second.', strong: 'Step 1: ' + midTxt + ' Step 2: count ' + L2 + ' days on from there.' };
    }
    if (c === q.ans - 1 || c === q.ans - 2) {
      return { tag: TAG.startDay, hint: 'A little short. In each step, the first hop lands on the NEXT day.', strong: 'Step 1: ' + midTxt + ' Step 2: finger on ' + ds(mid) + ', the next day is hop 1. Count ' + L2 + ' hops.' };
    }
    if (c === q.ans + 1) return { tag: TAG.extra, hint: 'One day too far. Count the hops of each step again.', strong: 'Step 1: ' + midTxt + ' Step 2: ' + L2 + ' hops from ' + ds(mid) + '.' };
    if (info(c).m !== info(q.start).m && Math.abs(c - q.ans) <= 3) return { tag: TAG.month, hint: 'Check the end of the month. How many days does it have?', strong: monthEndNote(q) + '. ' + midTxt };
    return { tag: TAG.miscount, hint: 'Go one step at a time. ' + (q.variant === 'travel' ? 'When do they travel?' : 'When is the new visit day?'), strong: 'Step 1: ' + midTxt + ' Step 2: count ' + L2 + ' days on from there.' };
  }

  function diagNumber(q, v) {
    var n = q.num;
    var A = info(q.a);
    var lenA = mlen(A.y, A.m);
    var monthAlt = false;
    if (A.m !== info(q.b).m) {
      [28, 30, 31].forEach(function (L) {
        if (L !== lenA && v === n + (L - lenA)) monthAlt = true;
      });
    }
    if (q.kind === 'between') {
      if (v === n + 1) return { tag: TAG.between, hint: 'One too many. Did you count ' + ds(q.a) + ' or ' + ds(q.b) + '? Between leaves out both end dates.', strong: 'Start counting on ' + ds(q.a + 1) + ' and stop on ' + ds(q.b - 1) + '.' };
      if (v === n + 2) return { tag: TAG.between, hint: 'Two too many. Between leaves out BOTH end dates: ' + ds(q.a) + ' and ' + ds(q.b) + '.', strong: 'Count only the days inside: ' + ds(q.a + 1) + ' up to ' + ds(q.b - 1) + '.' };
      if (v === n - 1) return { tag: TAG.missedDay, hint: 'One short. Leave out only the two end dates, keep every day in between.', strong: 'Count from ' + ds(q.a + 1) + ' to the end of ' + MONTHS[A.m] + ', then from 1 ' + MONTHS[info(q.b).m] + ' to ' + ds(q.b - 1) + '.' };
      if (monthAlt) return { tag: TAG.month, hint: 'Check the end of ' + MONTHS[A.m] + '. How many days does it have?', strong: MONTHS[A.m] + ' has ' + lenA + ' days. Count from ' + ds(q.a + 1) + ' to ' + lenA + ' ' + MONTHS[A.m] + ' first.' };
      return { tag: TAG.miscount, hint: 'Tick each day in between on the calendar, then count the ticks.', strong: 'Days in ' + MONTHS[A.m] + ' after the ' + A.d + ', then days in ' + MONTHS[info(q.b).m] + ' before the ' + info(q.b).d + '. Add them.' };
    }
    // away
    if (v === n + 1) return { tag: TAG.awayBoth, hint: 'One too many. Count the HOPS, not the squares: the leave day is where you start.', strong: 'Finger on ' + ds(q.a) + '. The first hop lands on ' + ds(q.a + 1) + ': that is 1. Keep hopping to ' + ds(q.b) + '.' };
    if (v === n - 1) return { tag: TAG.awayBetween, hint: 'One short. This is not "between": the hop that lands on the home day counts too.', strong: 'Count the hops from ' + ds(q.a) + ' right up to and landing on ' + ds(q.b) + '.' };
    if (monthAlt) return { tag: TAG.month, hint: 'Check the end of ' + MONTHS[A.m] + '. How many days does it have?', strong: MONTHS[A.m] + ' has ' + lenA + ' days. Hop to ' + lenA + ' ' + MONTHS[A.m] + ' first, then on to ' + ds(q.b) + '.' };
    return { tag: TAG.miscount, hint: 'Start on ' + ds(q.a) + ' and count the hops to ' + ds(q.b) + '.', strong: A.m !== info(q.b).m ? 'Hops to the end of ' + MONTHS[A.m] + ', then hops in ' + MONTHS[info(q.b).m] + ' up to the ' + info(q.b).d + '. Add them.' : info(q.b).d + ' − ' + A.d + ' hops.' };
  }

  /* ---------------- learn screens ---------------- */
  function token(view, n) {
    var e = view.map[n];
    var t = S('g', { class: 'chp-token' }, S('circle', { cx: 0, cy: 0, r: 19 }));
    t.style.transform = 'translate(' + (e.c.x - 3) + 'px,' + (e.c.y - 1) + 'px)';
    e.M.over.appendChild(t);
    return {
      g: t,
      moveTo: function (m) {
        var f = view.map[m];
        if (f.M !== e.M) return;
        t.style.transform = 'translate(' + (f.c.x - 3) + 'px,' + (f.c.y - 1) + 'px)';
      },
    };
  }

  function learnWeek(stage, api) {
    api.say('A week is 7 days. Watch the counter hop one week!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('One week = one row down', 'The counter is on <b>Thursday 4 June</b>. Press the button to hop one week.'));
    var view = calView([[2026, 5]]);
    view.el.classList.add('chp-big');
    var pos = dn(2026, 5, 4);
    view.cls(pos, 'chp-start');
    var tk = token(view, pos);
    var hops = 0;
    var totals = el('div', { class: 'chp-chips chp-totals' });
    var note = el('div', { class: 'chp-note' }, ' ');
    var busy = false;
    var btn = el('button', { class: 'btn chp-hopbtn', type: 'button' }, 'One week later ▼');
    btn.addEventListener('click', function () {
      if (busy || hops >= 3) return;
      busy = true;
      var from = pos;
      var to = pos + 7;
      hops++;
      if (hops === 1) {
        for (var k = 1; k <= 6; k++) view.badge(from + k, k, k * 110);
      }
      view.arc(from, to, hops === 1 ? 800 : 0);
      api.later(function () {
        tk.moveTo(to);
        pos = to;
        view.badge(to, 7 * hops, 350, 'chp-badge-week');
        MQ.sound('pop');
        totals.appendChild(el('span', { class: 'chp-chip chp-chip-week' }, plural(hops, 'week') + ' = ' + (hops === 1 ? '7' : sevens(hops).join(' + ') + ' = ' + 7 * hops) + ' days'));
        note.innerHTML = '<b>' + dsw(from) + '</b> → <b>' + dsw(to) + '</b>. Same day of the week!';
        busy = false;
        if (hops === 1) {
          api.say('One row down = 7 days. The 4th hops to the 11th.', 'cheer');
          api.feedback('4 + 7 = 11. One week later is one row straight down.', 'good');
          api.unlockNext();
        } else if (hops === 2) {
          api.say('Two weeks: 7, 14. Still a Thursday!', 'cheer');
        } else {
          api.say('Three weeks: 7, 14, 21 days. The month ends soon, so we stop here.', 'cheer');
          btn.disabled = true;
        }
      }, hops === 1 ? 950 : 300);
    });
    stage.appendChild(el('div', { class: 'chp-row' }, view.el, el('div', { class: 'chp-side' }, ruleBox('week'), btn, note, totals)));
  }

  function learnFlip(stage, api) {
    api.say('What happens at the end of a month? Hop a week from 25 January.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Hopping into the next month', 'January has <b>31 days</b>. After 31 January comes <b>1 February</b>.'));
    var start = dn(2027, 0, 25);
    var holder = el('div', { class: 'chp-flipbox' });
    var view = calView([[2027, 0]]);
    view.el.classList.add('chp-big');
    view.cls(start, 'chp-start');
    token(view, start);
    holder.appendChild(view.el);
    var note = el('div', { class: 'chp-note' }, 'The counter is on Monday 25 January.');
    var btn = el('button', { class: 'btn chp-hopbtn', type: 'button' }, 'One week later ▼');
    var done = false;
    btn.addEventListener('click', function () {
      if (done) return;
      done = true;
      btn.disabled = true;
      for (var k = 1; k <= 6; k++) view.badge(start + k, k, k * 160);
      note.innerHTML = 'Count: 26, 27, 28, 29, 30, 31 … that is the end of January!';
      api.later(function () {
        view.el.classList.add('chp-flipout');
      }, 6 * 160 + 500);
      api.later(function () {
        MQ.clear(holder);
        var feb = calView([[2027, 1]]);
        feb.el.classList.add('chp-big', 'chp-flipin');
        holder.appendChild(feb.el);
        var land = dn(2027, 1, 1);
        feb.cls(land, 'chp-ans');
        feb.badge(land, 7, 350, 'chp-badge-week');
        token(feb, land);
        MQ.sound('pop');
        note.innerHTML = '6 days to finish January, then <b>1 February</b> is day 7. <b>Monday 25 January → Monday 1 February</b>.';
        api.say('The page turned! January has 31 days, so one week after 25 January is 1 February.', 'cheer');
        api.feedback('25 January + 7 days: 26, 27, 28, 29, 30, 31, then 1 February.', 'good');
        api.unlockNext();
      }, 6 * 160 + 900);
    });
    var lens = el('div', { class: 'chp-lens' }, el('b', null, 'Month lengths'), el('span', null, '31 days: Jan, Mar, May, Jul, Aug, Oct, Dec'), el('span', null, '30 days: Apr, Jun, Sep, Nov'), el('span', null, '28 days: February'));
    stage.appendChild(el('div', { class: 'chp-row' }, holder, el('div', { class: 'chp-side' }, btn, note, lens)));
  }

  function learnBetween(stage, api) {
    api.say('How many days are there BETWEEN 11 March and 17 March? Click each one.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Days between', 'The two outlined dates are the ends. They <b>do not count</b>. Click every day in between.'));
    var a = dn(2027, 2, 11);
    var b = dn(2027, 2, 17);
    var got = {};
    var count = 0;
    var target = b - a - 1;
    var tally = el('div', { class: 'chp-bigcount' }, 'Days between: 0');
    var finished = false;
    var view = calView([[2027, 2]], {
      onPick: function (n) {
        if (finished) return;
        if (n === a || n === b) {
          api.feedback('That is an end date. For "between" we leave it out.', 'info');
          return;
        }
        if (n < a || n > b) {
          api.feedback('That day is outside. Click the days between 11 and 17 March.', 'info');
          return;
        }
        if (got[n]) return;
        got[n] = true;
        count++;
        view.cls(n, 'chp-btw');
        view.badge(n, count, 0);
        MQ.sound('pop');
        tally.textContent = 'Days between: ' + count;
        if (count === target) {
          finished = true;
          api.sound('correct');
          api.say('5 days between! Both end dates were left out.', 'cheer');
          api.feedback('Between 11 March and 17 March: 12, 13, 14, 15, 16. That is 5 days.', 'good');
          api.unlockNext();
        }
      },
    });
    view.el.classList.add('chp-big');
    view.cls(a, 'chp-end');
    view.cls(b, 'chp-end');
    stage.appendChild(el('div', { class: 'chp-row' }, view.el, el('div', { class: 'chp-side' }, ruleBox('between'), tally)));
  }

  function learnHotel(stage, api) {
    api.say('A hotel stay! Arrive on 8 July and stay 4 nights. Click to put a bed on each night.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Nights in a hotel', 'Arrive on <b>Wednesday 8 July</b>. Stay <b>4 nights</b>. Put a bed on each night, then find the check-out day.'));
    var a = dn(2026, 6, 8);
    var beds = 0;
    var phase = 'beds';
    var tally = el('div', { class: 'chp-bigcount' }, 'Beds: 0 of 4');
    var after = el('div', { class: 'chp-side-extra' });
    var view = calView([[2026, 6]], {
      onPick: function (n) {
        if (phase === 'beds') {
          var want = a + beds;
          if (n !== want) {
            api.feedback(beds === 0 ? 'The first night is the day they arrive: 8 July.' : 'Put the next bed on the next night: ' + ds(want) + '.', 'info');
            return;
          }
          beds++;
          view.cls(n, 'chp-night');
          view.icon(n, '🛏', 0);
          MQ.sound('pop');
          tally.textContent = 'Beds: ' + beds + ' of 4';
          if (beds === 4) {
            phase = 'out';
            api.say('4 beds = 4 nights. Now click the morning they check out.', 'think');
            api.feedback('Which morning do they leave? Click it.', 'info');
          }
        } else if (phase === 'out') {
          if (n === a + 4) {
            phase = 'done';
            view.cls(n, 'chp-ans');
            view.badge(n, 'out', 0, 'chp-badge-out');
            for (var k = 1; k <= 4; k++) view.arc(a + k - 1, a + k, k * 150);
            api.sound('correct');
            api.say('Yes! Check out on 12 July, the morning after the last bed.', 'cheer');
            api.feedback('8 July + 4 nights = 12 July. 4 hops from 8 to 12.', 'good');
            after.appendChild(ruleBox('away'));
            after.appendChild(el('div', { class: 'chp-note' }, '8 → 12 July is ', el('b', null, '4 hops'), ' = 4 nights away.'));
            api.unlockNext();
          } else if (n === a + 3) {
            api.feedback('That is the last night in bed. They check out the next morning.', 'info');
          } else {
            api.feedback('Check-out is the morning after the last bed.', 'info');
          }
        }
      },
    });
    view.el.classList.add('chp-big');
    view.cls(a, 'chp-start');
    stage.appendChild(el('div', { class: 'chp-row' }, view.el, el('div', { class: 'chp-side' }, ruleBox('nights'), tally, after)));
  }

  /* ---------------- practice ---------------- */
  function sayFor(q) {
    if (q.kind === 'between') return 'Between: leave out both end dates.';
    if (q.kind === 'away') return 'How long away? Count the hops.';
    if (q.kind === 'hotel') return 'One bed for each night.';
    if (q.kind === 'story') return 'Two steps. Then find the day and the date.';
    if (q.weeks) return 'Weeks hop a whole row: 7 days each.';
    return q.cross ? 'Watch out for the end of the month!' : 'Finger on the start day, then hop.';
  }

  function layout(stage, q, view, answerEl) {
    stage.appendChild(el('div', { class: 'chp-q' }, MQ.ui.prompt(q.text)));
    stage.appendChild(ruleBox(q.rule));
    var work = el('div', { class: 'chp-work' });
    stage.appendChild(view.el);
    stage.appendChild(answerEl);
    stage.appendChild(work);
    return work;
  }

  function renderDate(stage, api, q) {
    api.say(sayFor(q), 'think');
    var panel = datePanel(api, q, function (c, w) {
      var okDate = c === q.ans;
      var okDay = !q.askDay || w === info(q.ans).wd;
      if (okDate && okDay) {
        panel.done(q.ans, info(q.ans).wd);
        api.check(true, (q.askDay ? dsw(q.ans) : ds(q.ans)) + '! ' + (q.weeks ? running(q.weeks).split(', ').pop() + ' days, ' + q.weeks + ' row' + (q.weeks > 1 ? 's' : '') + '.' : 'Well counted.'));
        return;
      }
      if (c === q.start) {
        api.feedback('That is the start date. Now hop ' + (q.dir > 0 ? 'on' : 'back') + ' from it.', 'info');
        return;
      }
      var strong = api.tries() >= 1;
      if (okDate && !okDay) {
        api.check(false, strong ? ds(q.ans) + ' is in the ' + WD[info(q.ans).wd] + ' column.' : 'The date is right! Now read the day at the top of its column.', TAG.weekday);
        return;
      }
      panel.bad();
      var dg = q.kind === 'hotel' ? diagHotel(q, c) : q.kind === 'story' ? diagStory(q, c) : diagDate(q, c);
      api.check(false, strong ? dg.strong : dg.hint, dg.tag);
    });
    var view = panel.view;
    view.cls(q.start, 'chp-start');
    var work = layout(stage, q, view, panel.el);
    view.el.setAttribute('data-answer', ds(q.ans));
    view.el.setAttribute('data-kind', q.kind);

    api.onReveal(function () {
      panel.done(q.ans, info(q.ans).wd);
      var line;
      if (q.kind === 'hotel') {
        for (var k = 0; k < q.n; k++) {
          view.cls(q.start + k, 'chp-night');
          view.icon(q.start + k, '🛏', k * 150);
        }
        view.badge(q.ans, 'out', q.n * 150 + 100, 'chp-badge-out');
        line = q.n + ' nights: beds from ' + ds(q.start) + ' to ' + ds(q.ans - 1) + '. Check out the next morning: ' + ds(q.ans) + '.';
        work.appendChild(chipsRow([ds(q.start), '+', q.n + ' nights', '=', ds(q.ans)]));
      } else if (q.kind === 'story') {
        var L1 = q.legs[0];
        var L2 = q.legs[1];
        var mid = q.start + L1.n;
        var t;
        if (L1.week) {
          view.arc(q.start, mid, 200);
          view.badge(mid, 7, 400, 'chp-badge-week');
          t = 600;
        } else {
          t = dayHops(view, q.start, L1.n, 1, 'chp-badge-a');
        }
        view.cls(mid, 'chp-mid');
        var step = hopDelay(L2.n);
        for (var j = 1; j <= L2.n; j++) {
          view.cls(mid + j, 'chp-path');
          view.badge(mid + j, j, t + 300 + j * step, 'chp-badge-b');
        }
        line = (L1.week ? 'One week later is ' : 'Travel ' + L1.n + ' days later: ') + dsw(mid) + '. Then ' + L2.n + ' days on: ' + dsw(q.ans) + '.';
        work.appendChild(chipsRow([dsw(q.start), '→', (L1.week ? '+ 1 week (7)' : '+ ' + L1.n + ' days'), '→', dsw(mid), '→', '+ ' + L2.n + ' days', '→', dsw(q.ans)]));
      } else if (q.weeks) {
        weekHops(view, q.start, q.weeks, q.dir);
        line = plural(q.weeks, 'week') + ' = ' + sevens(q.weeks).join(' + ') + ' = ' + q.n + ' days. ' + ds(q.start) + (q.dir > 0 ? ' + ' : ' − ') + q.n + ' days = ' + ds(q.ans) + '.';
        var items = [];
        for (var w = 1; w <= q.weeks; w++) items.push(String(7 * w));
        work.appendChild(chipsRow(items, 'chp-chip-week'));
        work.appendChild(el('div', { class: 'chp-note' }, 'Hop one row at a time. The total grows 7 each hop.'));
      } else {
        dayHops(view, q.start, q.n, q.dir);
        line = ds(q.start) + (q.dir > 0 ? ' + ' : ' − ') + q.n + ' days = ' + ds(q.ans) + '.';
        if (q.cross) {
          var A = info(q.start);
          var len = mlen(A.y, A.m);
          var first = len - A.d;
          line = MONTHS[A.m] + ' has ' + len + ' days: ' + first + ' hops to ' + len + ' ' + MONTHS[A.m] + ', then ' + (q.n - first) + ' more → ' + ds(q.ans) + '.';
          work.appendChild(chipsRow([first + ' to the end of ' + MONTHS[A.m], '+', String(q.n - first), '=', q.n + ' days']));
        }
      }
      api.feedback(line, 'info');
    });
  }

  function renderNumber(stage, api, q) {
    api.say(sayFor(q), 'think');
    var panel = numberPanel(api, q, function (v) {
      if (v === q.num) {
        panel.done(q.num);
        api.check(true, q.num + ' days! ' + (q.kind === 'between' ? 'Both end dates left out.' : 'You counted the hops.'));
        return;
      }
      panel.box.bad();
      var dg = diagNumber(q, v);
      api.check(false, api.tries() >= 1 ? dg.strong : dg.hint, dg.tag);
    });
    var view = panel.view;
    if (q.kind === 'between') {
      view.cls(q.a, 'chp-end');
      view.cls(q.b, 'chp-end');
    } else {
      view.cls(q.a, 'chp-start');
      view.cls(q.b, 'chp-home');
      view.icon(q.b, '🏠', 0);
    }
    var work = layout(stage, q, view, panel.el);
    view.el.setAttribute('data-answer', String(q.num));
    view.el.setAttribute('data-kind', q.kind);

    api.onReveal(function () {
      panel.done(q.num);
      var A = info(q.a);
      var B = info(q.b);
      var lenA = mlen(A.y, A.m);
      var line;
      if (q.kind !== 'between') view.clearOver();
      if (q.kind === 'between') {
        var step = hopDelay(q.num);
        for (var k = 1; k <= q.num; k++) {
          view.cls(q.a + k, 'chp-btw');
          view.badge(q.a + k, k, k * step);
        }
        var p1 = lenA - A.d;
        var p2 = B.d - 1;
        line = 'Leave out ' + ds(q.a) + ' and ' + ds(q.b) + '. In between: ' + plural(p1, 'day') + ' in ' + MONTHS[A.m] + ' + ' + plural(p2, 'day') + ' in ' + MONTHS[B.m] + ' = ' + q.num + '.';
        work.appendChild(chipsRow([p1 + ' in ' + MONTHS[A.m], '+', p2 + ' in ' + MONTHS[B.m], '=', q.num + ' days between']));
      } else {
        dayHops(view, q.a, q.num, 1);
        if (A.m !== B.m) {
          var h1 = lenA - A.d;
          line = 'Count the hops: ' + h1 + ' to ' + lenA + ' ' + MONTHS[A.m] + ', then ' + B.d + ' more to ' + ds(q.b) + '. ' + h1 + ' + ' + B.d + ' = ' + q.num + ' days away.';
          work.appendChild(chipsRow([h1 + ' hops in ' + MONTHS[A.m], '+', B.d + ' in ' + MONTHS[B.m], '=', q.num + ' days away']));
        } else {
          line = 'Count the hops from ' + ds(q.a) + ' to ' + ds(q.b) + ': ' + B.d + ' − ' + A.d + ' = ' + q.num + ' days away.';
          work.appendChild(chipsRow([String(B.d), '−', String(A.d), '=', q.num + ' days away']));
        }
      }
      api.feedback(line, 'info');
    });
  }

  MQ.register(ID, {
    learn: [learnWeek, learnFlip, learnBetween, learnHotel],
    practice: {
      count: COUNT,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.answerType === 'number') renderNumber(stage, api, q);
        else renderDate(stage, api, q);
      },
    },
  });

  // Harmless hooks for automated tests (no effect on the page).
  MQ._chp = { buildDeck: buildDeck, levelOf: levelOf, info: info, dn: dn, mlen: mlen, diagDate: diagDate, diagNumber: diagNumber, diagStory: diagStory, diagHotel: diagHotel, deck: function () { return deck; } };

  var css = [
    '.chp-row{display:flex;align-items:center;justify-content:center;gap:22px;flex-wrap:wrap;width:100%}',
    '.chp-side{display:flex;flex-direction:column;align-items:center;gap:12px;width:330px;max-width:100%}',
    '.chp-side-extra{display:flex;flex-direction:column;align-items:center;gap:8px}',
    '.chp-cals{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;width:100%}',
    '.chp-calbox{flex:0 1 330px;max-width:100%;min-width:0}',
    '.chp-n3 .chp-calbox{flex-basis:280px}',
    '.chp-big{width:auto}',
    '.chp-big .chp-calbox{flex-basis:390px;width:390px}',
    '.chp-cal{display:block;width:100%;height:auto;user-select:none;-webkit-user-select:none}',
    '.chp-paper{fill:#fff;stroke:#c9d3ee;stroke-width:2}',
    '.chp-band{fill:#e8590c}',
    '.chp-title{fill:#fff;font-size:18px;font-weight:900;font-family:var(--font)}',
    '.chp-wd{fill:#4a5a7d;font-size:12.5px;font-weight:800;font-family:var(--font)}',
    '.chp-wd-we{fill:#b33f00}',
    '.chp-cell{fill:#f7f9fd;stroke:#dfe5f2;stroke-width:1.2}',
    '.chp-we .chp-cell{fill:#fff4ec}',
    '.chp-num{fill:#1b2a4a;font-size:17px;font-weight:800;font-family:var(--font);pointer-events:none}',
    '.chp-live .chp-day{cursor:pointer}',
    '.chp-live .chp-day:hover .chp-cell{stroke:#2f6fde;stroke-width:2.5}',
    '.chp-start .chp-cell{fill:#e3f6ea;stroke:#2b9348;stroke-width:3}',
    '.chp-home .chp-cell{fill:#e3f6ea;stroke:#2b9348;stroke-width:3}',
    '.chp-end .chp-cell{fill:#fff;stroke:#1b2a4a;stroke-width:3;stroke-dasharray:5 3}',
    '.chp-path .chp-cell{fill:#fff1d6}',
    '.chp-btw .chp-cell{fill:#ffe08a;stroke:#e0a800}',
    '.chp-tick .chp-cell{fill:#ffe9a8;stroke:#e0a800;stroke-width:2}',
    '.chp-night .chp-cell{fill:#e3ecff;stroke:#7d9ee0}',
    '.chp-mid .chp-cell{fill:#ffe1cc;stroke:#e8590c;stroke-width:2.5}',
    '.chp-sel .chp-cell{fill:#d6e4ff;stroke:#2f6fde;stroke-width:3.5}',
    '.chp-bad .chp-cell{fill:var(--try-bg);stroke:var(--try);stroke-width:3.5}',
    '.chp-ans .chp-cell{fill:#c8f0d4;stroke:#2b9348;stroke-width:4}',
    '.chp-over{pointer-events:none}',
    '.chp-badge{animation:chp-pop .3s ease both}',
    '.chp-badge circle{fill:#e8590c;stroke:#fff;stroke-width:1.5}',
    '.chp-badge text{fill:#fff;font-size:11px;font-weight:900;font-family:var(--font)}',
    '.chp-badge-week circle{fill:#1d5fc9}',
    '.chp-badge-a circle{fill:#7b2cbf}',
    '.chp-badge-b circle{fill:#e8590c}',
    '.chp-badge-out circle{fill:#2b9348}',
    '.chp-badge-out text{font-size:9px}',
    '.chp-icon{font-size:17px;animation:chp-pop .3s ease both}',
    '.chp-arc{fill:none;stroke:#1d5fc9;stroke-width:3;stroke-dasharray:5 4;stroke-linecap:round;animation:chp-pop .35s ease both}',
    '.chp-token circle{fill:rgba(232,89,12,.18);stroke:#e8590c;stroke-width:4}',
    '.chp-token{transition:transform .6s ease}',
    '@keyframes chp-pop{from{opacity:0}to{opacity:1}}',
    '.chp-flipout{animation:chp-fo .4s ease both}',
    '.chp-flipin{animation:chp-fi .45s ease both}',
    '@keyframes chp-fo{to{opacity:0;transform:perspective(700px) rotateX(70deg)}}',
    '@keyframes chp-fi{from{opacity:0;transform:perspective(700px) rotateX(-70deg)}to{opacity:1;transform:none}}',
    '.chp-flipbox{display:flex;justify-content:center;min-height:300px;max-width:100%}',
    '.chp-rule{font-size:1.05rem;font-weight:700;border-radius:12px;padding:6px 14px;text-align:center;border:2px solid}',
    '.chp-rule-between{background:#fff8e1;border-color:#e0a800;color:#6b4e00}',
    '.chp-rule-away{background:#e9f8ee;border-color:#2b9348;color:#1d5c30}',
    '.chp-rule-week{background:#e8f0ff;border-color:#7d9ee0;color:#1d3f80}',
    '.chp-hopbtn{font-size:1.15rem;min-width:200px}',
    '.chp-note{font-size:1.05rem;font-weight:700;text-align:center;max-width:620px}',
    '.chp-bigcount{font-size:1.6rem;font-weight:900;text-align:center}',
    '.chp-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center}',
    '.chp-chip{display:inline-block;border-radius:10px;padding:3px 10px;font-weight:800;font-size:1.02rem;background:#fff1e6;color:#8a3200;border:2px solid #f3a77a;animation:chp-in .25s ease both}',
    '.chp-chip-week{background:#e3ecff;color:#1d5fc9;border-color:#9db8ef}',
    '.chp-totals{flex-direction:column}',
    '.chp-op{font-weight:900;font-size:1.1rem}',
    '@keyframes chp-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}',
    '.chp-lens{display:flex;flex-direction:column;gap:2px;font-size:.95rem;background:var(--paper);border:2px solid var(--line);border-radius:12px;padding:8px 12px;text-align:left}',
    '.chp-q .prompt{font-size:1.25rem}',
    '.chp-answer{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.chp-pick,.chp-tally{font-size:1.1rem;font-weight:700;color:var(--ink-soft);text-align:center}',
    '.chp-pick b,.chp-tally b{color:var(--ink)}',
    '.chp-sub{font-weight:800}',
    '.chp-wdch{max-width:640px}',
    '.chp-wdch .choice{min-height:46px;padding:6px 4px;font-size:1.02rem}',
    '.chp-wdch .choice.chp-on{border-color:#2f6fde;background:#d6e4ff}',
    '.chp-work{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%}',
    '.chp-work:empty{display:none}',
    '@media (max-width:640px){.chp-wdch{grid-template-columns:repeat(4,minmax(0,1fr))!important}.chp-big .chp-calbox{width:auto}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

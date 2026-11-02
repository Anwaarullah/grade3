/* My Day Timetable — read a one-row school timetable, a holiday-camp week grid and an
 * after-school club planner; build your own day (Unit 14.2).
 * Times are kept as minutes after midnight (9:00 a.m. = 540, 1:15 p.m. = 795) and shown
 * as 12-hour h:mm. An activity from s to e is "on" at time T when s <= T < e
 * (at its end time it has finished).
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  var ID = 'my-day-timetable';
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  var DAY3 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  var TAG = {
    endForStart: 'Gave the end time for the start',
    startForEnd: 'Gave the start time for the end',
    ampm: 'Mixed up a.m. and p.m.',
    lesson: 'Read the wrong lesson',
    finish: 'Gave the time school finishes',
    timeForDay: 'Gave a time when a day was asked',
    dayForTime: 'Gave a day when a time was asked',
    row: 'Read the wrong row',
    col: 'Read the wrong column',
    not: 'Missed the NOT in the question',
    endInside: 'Counted the end time as inside the activity',
    over: 'Chose an activity that had already finished',
    notYet: 'Chose an activity that had not started yet',
    naive: 'Took away the times like ordinary numbers',
    count: 'Counted on in minutes wrongly',
    clash: 'Chose two clubs that overlap',
  };

  /* ---------------- time helpers ---------------- */
  function pad(m) {
    return (m < 10 ? '0' : '') + m;
  }
  function h12(t) {
    return Math.floor(t / 60) % 12 || 12;
  }
  /** 12-hour h:mm, with " a.m."/" p.m." when ampm is true. 12:00 is midday (p.m.). */
  function lab(t, ampm) {
    return h12(t) + ':' + pad(t % 60) + (ampm ? (t < 720 ? ' a.m.' : ' p.m.') : '');
  }
  /** Same clock numbers, other half of the day (for the a.m./p.m. distractor). */
  function flipAmPm(t) {
    return t < 720 ? t + 720 : t - 720;
  }
  function overlap(a, b) {
    return a.s < b.e && b.s < a.e;
  }

  /* ---------------- small clock face ---------------- */
  function pol(r, deg) {
    var a = (deg * Math.PI) / 180;
    return { x: r * Math.sin(a), y: -r * Math.cos(a) };
  }
  function miniClock(t) {
    var h = Math.floor(t / 60) % 12;
    var m = t % 60;
    var hourDeg = 30 * h + 0.5 * m;
    var minDeg = 6 * m;
    var root = S('svg', { viewBox: '-62 -62 124 124', class: 'mdt-clock', role: 'img', 'aria-label': 'Clock showing ' + lab(t), 'data-hour-angle': String(hourDeg), 'data-minute-angle': String(minDeg) });
    root.appendChild(S('circle', { cx: 0, cy: 0, r: 58, class: 'mdt-clock-rim' }));
    for (var i = 0; i < 60; i++) {
      var big = i % 5 === 0;
      var a = pol(big ? 46 : 50, i * 6);
      var b = pol(54, i * 6);
      root.appendChild(S('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: big ? 'mdt-tk mdt-tk-big' : 'mdt-tk' }));
    }
    for (var n = 1; n <= 12; n++) {
      var p = pol(37, n * 30);
      root.appendChild(S('text', { x: p.x, y: p.y + 5, class: 'mdt-clock-num', 'text-anchor': 'middle' }, String(n)));
    }
    root.appendChild(S('line', { x1: 0, y1: 6, x2: 0, y2: -27, class: 'mdt-hand-h', transform: 'rotate(' + hourDeg + ')' }));
    root.appendChild(S('line', { x1: 0, y1: 8, x2: 0, y2: -47, class: 'mdt-hand-m', transform: 'rotate(' + minDeg + ')' }));
    root.appendChild(S('circle', { cx: 0, cy: 0, r: 4, class: 'mdt-clock-cap' }));
    return root;
  }
  function clockPair(s, e) {
    return el('div', { class: 'mdt-clocks' },
      el('div', { class: 'mdt-clockbox' }, el('div', { class: 'mdt-clock-lbl' }, 'starts'), miniClock(s), el('div', { class: 'mdt-clock-time' }, lab(s, true))),
      el('div', { class: 'mdt-arrow' }, '→'),
      el('div', { class: 'mdt-clockbox' }, el('div', { class: 'mdt-clock-lbl' }, 'ends'), miniClock(e), el('div', { class: 'mdt-clock-time' }, lab(e, true))));
  }

  /* ---------------- data ---------------- */
  var LESSONS = [
    { n: 'Maths', i: '🔢' }, { n: 'Reading', i: '📖' }, { n: 'Science', i: '🔬' }, { n: 'Art', i: '🎨' },
    { n: 'Music', i: '🎵' }, { n: 'Games', i: '⚽' }, { n: 'Spelling', i: '✏️' }, { n: 'Computing', i: '💻' },
    { n: 'Geography', i: '🗺️' }, { n: 'History', i: '🏛️' },
  ];

  /** A one-row school day: 6 lessons, quarter-hour times, a lunch gap, finishing by 3:30 p.m. */
  function makeSchoolDay() {
    for (var g = 0; g < 1000; g++) {
      var pool = U.shuffle(LESSONS).slice(0, 6);
      var t = U.pick([525, 540]);
      var items = [];
      var lunch = false;
      for (var i = 0; i < 6; i++) {
        if (i > 0) t += U.pick([0, 0, 15]);
        if (i > 0 && !lunch && t >= 705) {
          t += U.pick([45, 60]);
          lunch = true;
        }
        var d = U.pick([30, 45, 60, 75]);
        items.push({ name: pool[i].n, icon: pool[i].i, s: t, e: t + d });
        t += d;
      }
      if (!lunch || t > 930) continue;
      var am = items.filter(function (it) { return it.e <= 720; }).length;
      var pm = items.filter(function (it) { return it.s >= 720; }).length;
      if (am < 3 || pm < 2) continue;
      return { title: 'School timetable', ampm: true, items: items };
    }
    return null;
  }

  var CAMP = {
    lunch: { n: 'Lunch', i: '🥪' },
    tennis: { n: 'Tennis', i: '🎾' },
    sing: { n: 'Singing', i: '🎤' },
    fill: [
      { n: 'Painting', i: '🎨' }, { n: 'Swimming', i: '🏊' }, { n: 'Story time', i: '📚' }, { n: 'Crafts', i: '✂️' },
      { n: 'Cooking', i: '🍳' }, { n: 'Drama', i: '🎭' }, { n: 'Gardening', i: '🌱' }, { n: 'Football', i: '⚽' },
      { n: 'Puzzles', i: '🧩' }, { n: 'Dance', i: '💃' }, { n: 'Nature walk', i: '🌳' },
    ],
  };
  var ROWS = [600, 660, 720, 780, 840]; // 10:00 … 2:00; each row lasts one hour, camp ends at 3:00

  /** Holiday camp week grid: lunch at 12:00 except one late-lunch day (1:00); tennis every day
   * but one; singing once in the week, in a row that has a next row (so its end time is listed). */
  function makeCamp() {
    var lateDay = U.rand(0, 4);
    var noTen = U.rand(0, 4);
    var singDay = U.rand(0, 4);
    var cells = [];
    var singRow = -1;
    for (var d = 0; d < 5; d++) {
      var col = [null, null, null, null, null];
      var lunchRow = d === lateDay ? 3 : 2;
      col[lunchRow] = CAMP.lunch;
      if (d === singDay) {
        singRow = U.pick([0, 1, 2, 3].filter(function (r) { return !col[r]; }));
        col[singRow] = CAMP.sing;
      }
      if (d !== noTen) {
        col[U.pick([0, 1, 2, 3, 4].filter(function (r) { return !col[r]; }))] = CAMP.tennis;
      }
      var fill = U.shuffle(CAMP.fill);
      for (var r = 0, k = 0; r < 5; r++) if (!col[r]) col[r] = fill[k++];
      cells.push(col);
    }
    return { cells: cells, lateDay: lateDay, noTen: noTen, singDay: singDay, singRow: singRow };
  }

  var OUTINGS = [
    { title: 'Farm day', acts: [{ n: 'Feed the goats', i: '🐐' }, { n: 'Tractor ride', i: '🚜' }, { n: 'Picnic lunch', i: '🧺' }, { n: 'Pond dipping', i: '🐸' }, { n: 'Pick apples', i: '🍎' }] },
    { title: 'Park day', acts: [{ n: 'Swings', i: '🛝' }, { n: 'Boat ride', i: '🚣' }, { n: 'Picnic lunch', i: '🧺' }, { n: 'Fly kites', i: '🪁' }, { n: 'Ice creams', i: '🍦' }] },
    { title: 'Beach day', acts: [{ n: 'Build sandcastles', i: '🏖️' }, { n: 'Rock pools', i: '🦀' }, { n: 'Picnic lunch', i: '🧺' }, { n: 'Swim', i: '🏊' }, { n: 'Beach games', i: '🏐' }] },
  ];

  /** A day out with gaps; at least one back-to-back pair. Question time T, mode 'edge' or 'inside'. */
  function makeOuting() {
    for (var g = 0; g < 1000; g++) {
      var o = U.pick(OUTINGS);
      var acts = o.acts.slice(0, 2).concat([o.acts[2]], U.shuffle(o.acts.slice(3)));
      var t = U.pick([600, 615, 630]);
      var items = [];
      for (var i = 0; i < 5; i++) {
        if (i > 0) t += U.pick([0, 0, 15, 30]);
        var d = U.pick([30, 45, 60]);
        items.push({ name: acts[i].n, icon: acts[i].i, s: t, e: t + d });
        t += d;
      }
      if (t > 960) continue;
      var edges = [];
      for (var k = 0; k + 1 < items.length; k++) if (items[k].e === items[k + 1].s) edges.push(k + 1);
      if (!edges.length) continue;
      var q;
      if (Math.random() < 0.5) {
        var ans = U.pick(edges);
        q = { mode: 'edge', T: items[ans].s, ans: ans };
      } else {
        var ai = U.rand(0, 4);
        var it = items[ai];
        var offs = [];
        for (var x = 5; x < it.e - it.s; x += 5) offs.push(x);
        q = { mode: 'inside', T: it.s + U.pick(offs), ans: ai };
      }
      q.tt = { title: o.title, ampm: true, items: items };
      return q;
    }
    return null;
  }

  /** "How long is Games?" — an afternoon with Games lasting 15–75 minutes (5-minute times). */
  function makeAfternoon() {
    var D = U.pick(U.range(3, 15).map(function (x) { return x * 5; }));
    var gs = U.pick(U.range(152, 168).map(function (x) { return x * 5; })); // 12:40 … 2:00 p.m.
    var before = U.pick([{ n: 'Reading', i: '📖' }, { n: 'Spelling', i: '✏️' }, { n: 'Science', i: '🔬' }]);
    var after = U.pick([{ n: 'Music', i: '🎵' }, { n: 'Art', i: '🎨' }, { n: 'Story time', i: '📚' }]);
    var bd = U.pick([30, 40, 45]);
    var ad = U.pick([30, 35, 45]);
    var items = [
      { name: before.n, icon: before.i, s: gs - bd, e: gs },
      { name: 'Games', icon: '⚽', s: gs, e: gs + D },
      { name: after.n, icon: after.i, s: gs + D, e: gs + D + ad },
    ];
    return { tt: { title: 'Friday afternoon', ampm: true, items: items }, gi: 1, D: D };
  }

  /** Count-on jumps from s to e: 15s while 15 or more are left, then 5s. */
  function jumps(s, e) {
    var out = [];
    var t = s;
    while (e - t >= 15) {
      out.push(15);
      t += 15;
    }
    while (e - t >= 5) {
      out.push(5);
      t += 5;
    }
    return out;
  }
  function naiveDiff(s, e) {
    return h12(e) * 100 + (e % 60) - (h12(s) * 100 + (s % 60));
  }

  /* After-school clubs (Mon–Thu). Each set has exactly one clash-free plan (checked by brute force in the deck test). */
  function C(club, icon, day, sh, sm, eh, em) {
    return { club: club, icon: icon, day: day, s: (sh + 12) * 60 + sm, e: (eh + 12) * 60 + em };
  }
  var CLUB_SETS = [
    {
      wants: ['Swimming', 'Chess', 'Football', 'Painting'],
      sessions: [
        C('Swimming', '🏊', 0, 3, 0, 4, 0), C('Chess', '♟️', 0, 3, 30, 4, 30), C('Drama', '🎭', 0, 4, 0, 5, 0),
        C('Football', '⚽', 1, 3, 0, 4, 0), C('Painting', '🎨', 1, 3, 30, 4, 15), C('Cooking', '🍳', 1, 4, 15, 5, 0),
        C('Gardening', '🌱', 2, 2, 0, 3, 0), C('Football', '⚽', 2, 3, 30, 4, 30), C('Chess', '♟️', 2, 4, 0, 5, 0),
        C('Painting', '🎨', 3, 3, 0, 3, 45), C('Singing', '🎤', 3, 3, 0, 4, 0), C('Dodgeball', '🤾', 3, 4, 0, 5, 0),
      ],
      why: [
        'Swimming is only on Monday, 3:00–4:00.',
        'Chess on Monday (3:30–4:30) clashes with Swimming, so Chess goes on Wednesday, 4:00–5:00.',
        'Football on Wednesday (3:30–4:30) clashes with Chess, so Football goes on Tuesday, 3:00–4:00.',
        'Painting on Tuesday (3:30–4:15) clashes with Football, so Painting goes on Thursday, 3:00–3:45.',
      ],
    },
    {
      wants: ['Cycling', 'Music', 'Cooking', 'Gardening'],
      sessions: [
        C('Gardening', '🌱', 0, 3, 0, 4, 0), C('Cooking', '🍳', 0, 3, 15, 4, 0), C('Karate', '🥋', 0, 4, 0, 5, 0),
        C('Cycling', '🚲', 1, 2, 0, 3, 0), C('Music', '🎵', 1, 2, 30, 3, 15), C('Chess', '♟️', 1, 3, 30, 4, 30),
        C('Music', '🎵', 2, 3, 30, 4, 15), C('Cooking', '🍳', 2, 4, 0, 4, 45), C('Drama', '🎭', 2, 3, 0, 4, 0),
        C('Gardening', '🌱', 3, 3, 0, 4, 0), C('Football', '⚽', 3, 3, 0, 4, 0), C('Crafts', '✂️', 3, 4, 15, 5, 0),
      ],
      why: [
        'Cycling is only on Tuesday, 2:00–3:00.',
        'Music on Tuesday (2:30–3:15) clashes with Cycling, so Music goes on Wednesday, 3:30–4:15.',
        'Cooking on Wednesday (4:00–4:45) starts before Music ends, so Cooking goes on Monday, 3:15–4:00.',
        'Gardening on Monday (3:00–4:00) clashes with Cooking, so Gardening goes on Thursday, 3:00–4:00.',
      ],
    },
    {
      wants: ['Tennis', 'Art', 'Drama', 'Computers'],
      sessions: [
        C('Drama', '🎭', 0, 3, 0, 4, 0), C('Art', '🎨', 0, 3, 30, 4, 30), C('Netball', '🏐', 0, 4, 30, 5, 15),
        C('Baking', '🧁', 1, 3, 0, 3, 45), C('Tennis', '🎾', 1, 3, 15, 4, 15), C('Art', '🎨', 1, 4, 0, 5, 0),
        C('Drama', '🎭', 2, 2, 0, 3, 0), C('Computers', '💻', 2, 2, 30, 3, 30), C('Football', '⚽', 2, 3, 30, 4, 30),
        C('Computers', '💻', 3, 3, 0, 4, 0), C('Singing', '🎤', 3, 3, 0, 4, 0), C('Chess', '♟️', 3, 4, 0, 5, 0),
      ],
      why: [
        'Tennis is only on Tuesday, 3:15–4:15.',
        'Art on Tuesday (4:00–5:00) starts before Tennis ends, so Art goes on Monday, 3:30–4:30.',
        'Drama on Monday (3:00–4:00) clashes with Art, so Drama goes on Wednesday, 2:00–3:00.',
        'Computers on Wednesday (2:30–3:30) clashes with Drama, so Computers goes on Thursday, 3:00–4:00.',
      ],
    },
  ];

  /** Every clash-free plan: one session per wanted club, no two chosen sessions overlapping on a day. */
  function clubPlans(set) {
    var opts = set.wants.map(function (w) {
      return set.sessions.filter(function (x) { return x.club === w; });
    });
    var plans = [];
    (function rec(i, chosen) {
      if (i === opts.length) {
        plans.push(chosen.slice());
        return;
      }
      opts[i].forEach(function (x) {
        var ok = chosen.every(function (c) { return c.day !== x.day || !overlap(c, x); });
        if (ok) {
          chosen.push(x);
          rec(i + 1, chosen);
          chosen.pop();
        }
      });
    })(0, []);
    return plans;
  }

  /* ---------------- the deck ---------------- */
  var deck = null;

  function buildDeck() {
    var q = [];
    // Level 1: one school timetable, three look-ups.
    var tt, si, ei;
    for (var g = 0; g < 200; g++) {
      tt = makeSchoolDay();
      var it = tt.items;
      // Start question: not the first lesson (that is the arrive question). 12:xx times have no a.m./p.m. twin, so skip them.
      var startAm = [], startPm = [], endAm = [], endPm = [];
      for (var i = 0; i < it.length; i++) {
        if (i > 0 && h12(it[i].s) !== 12) (it[i].s < 720 ? startAm : startPm).push(i);
        if (h12(it[i].e) !== 12) (it[i].e < 720 ? endAm : endPm).push(i);
      }
      var morningStart = Math.random() < 0.5;
      var sl = morningStart ? startAm : startPm;
      if (!sl.length) continue;
      si = U.pick(sl);
      var el2 = (morningStart ? endPm : endAm).filter(function (x) { return x !== si; });
      if (!el2.length) continue;
      ei = U.pick(el2);
      break;
    }
    var l1 = U.shuffle([{ type: 'start', tt: tt, li: si }, { type: 'end', tt: tt, li: ei }]);
    q.push(l1[0], l1[1], { type: 'arrive', tt: tt, li: 0 });

    // Level 2: the holiday camp grid (a day question, then a time question) and "what is happening at …?".
    var camp = makeCamp();
    q.push({ type: U.pick(['lateLunch', 'singDay', 'noRacquet']), camp: camp });
    q.push({ type: 'singTime', camp: camp });
    var out = makeOuting();
    q.push({ type: 'at', tt: out.tt, T: out.T, mode: out.mode, ans: out.ans });

    // Level 3: how long is Games, then the after-school club planner.
    var aft = makeAfternoon();
    q.push({ type: 'dur', tt: aft.tt, li: aft.gi, D: aft.D });
    q.push({ type: 'clubs', set: U.pick(CLUB_SETS) });
    return q;
  }

  /* ---------------- shared views ---------------- */
  /** One-row timetable: a cell per item with its start and end time. */
  function rowTable(tt, onPick) {
    var row = el('div', { class: 'mdt-row' + (onPick ? ' mdt-row-live' : '') });
    var cells = tt.items.map(function (x, i) {
      var c = el(onPick ? 'button' : 'div', { class: 'mdt-cell', type: onPick ? 'button' : null, 'data-i': String(i) },
        el('div', { class: 'mdt-cell-icon' }, x.icon),
        el('div', { class: 'mdt-cell-name' }, x.name),
        el('div', { class: 'mdt-cell-time mdt-ts' }, lab(x.s, tt.ampm)),
        el('div', { class: 'mdt-cell-to' }, 'to'),
        el('div', { class: 'mdt-cell-time mdt-te' }, lab(x.e, tt.ampm)));
      if (onPick) c.addEventListener('click', function () { onPick(i); });
      row.appendChild(c);
      return c;
    });
    var box = el('div', { class: 'mdt-tt' }, el('div', { class: 'mdt-tt-title' }, tt.title), row);
    box.cells = cells;
    box.clear = function () {
      cells.forEach(function (c) {
        c.classList.remove('mdt-on', 'mdt-dim');
        c.querySelectorAll('.mdt-hit').forEach(function (h) { h.classList.remove('mdt-hit'); });
      });
    };
    box.light = function (i, which) {
      cells[i].classList.add('mdt-on');
      if (which === 's') cells[i].querySelector('.mdt-ts').classList.add('mdt-hit');
      if (which === 'e') cells[i].querySelector('.mdt-te').classList.add('mdt-hit');
    };
    return box;
  }

  /** Holiday camp week grid with lightable rows, columns and cells. */
  function campGrid(camp, opts) {
    opts = opts || {};
    var g = el('div', { class: 'mdt-grid' });
    var heads = [], times = [], cells = [];
    g.appendChild(el('div', { class: 'mdt-g-corner' }, 'Time'));
    DAYS.forEach(function (d, i) {
      var h = el(opts.onDay ? 'button' : 'div', { class: 'mdt-g-day', type: opts.onDay ? 'button' : null }, el('span', { class: 'mdt-long' }, d), el('span', { class: 'mdt-short' }, DAY3[i]));
      if (opts.onDay) h.addEventListener('click', function () { opts.onDay(i); });
      heads.push(h);
      g.appendChild(h);
    });
    ROWS.forEach(function (t, r) {
      var th = el(opts.onTime ? 'button' : 'div', { class: 'mdt-g-time', type: opts.onTime ? 'button' : null }, lab(t));
      if (opts.onTime) th.addEventListener('click', function () { opts.onTime(r); });
      times.push(th);
      g.appendChild(th);
      cells[r] = [];
      for (var d = 0; d < 5; d++) {
        var a = camp.cells[d][r];
        var c = el('div', { class: 'mdt-g-cell', 'data-d': String(d), 'data-r': String(r) }, el('span', { class: 'mdt-g-icon' }, a.i), el('span', { class: 'mdt-g-name' }, a.n));
        cells[r][d] = c;
        g.appendChild(c);
      }
    });
    var box = el('div', { class: 'mdt-gridbox' }, el('div', { class: 'mdt-tt-title' }, 'Holiday camp timetable'), g, el('div', { class: 'mdt-g-note' }, 'Each activity lasts until the next time. Camp ends at 3:00.'));
    box.clear = function () {
      g.querySelectorAll('.mdt-lit,.mdt-meet,.mdt-mark,.mdt-hd-on').forEach(function (x) { x.classList.remove('mdt-lit', 'mdt-meet', 'mdt-mark', 'mdt-hd-on'); });
    };
    box.col = function (d) {
      heads[d].classList.add('mdt-hd-on');
      for (var r = 0; r < 5; r++) cells[r][d].classList.add('mdt-lit');
    };
    box.row = function (r) {
      times[r].classList.add('mdt-hd-on');
      for (var d = 0; d < 5; d++) cells[r][d].classList.add('mdt-lit');
    };
    box.meet = function (d, r) {
      cells[r][d].classList.add('mdt-meet');
    };
    box.mark = function (d, r) {
      cells[r][d].classList.add('mdt-mark');
    };
    return box;
  }

  /** Answer buttons for the grid: a row of days and a row of times. onPick({kind:'day'|'time', v}). */
  function dayTimeChoices(onPick) {
    var days = MQ.ui.choices(DAYS.map(function (d, i) { return { label: d, value: 'd' + i }; }), function (v) { onPick(v); }, { columns: 5 });
    var times = MQ.ui.choices(ROWS.map(function (t, r) { return { label: lab(t), value: 't' + r }; }), function (v) { onPick(v); }, { columns: 5 });
    days.classList.add('mdt-ch-days');
    times.classList.add('mdt-ch-times');
    var box = el('div', { class: 'mdt-dtc' }, el('div', { class: 'mdt-dtc-lbl' }, 'Days'), days, el('div', { class: 'mdt-dtc-lbl' }, 'Times'), times);
    box.mark = function (v, k) {
      days.mark(v, k);
      times.mark(v, k);
    };
    box.disable = function () {
      days.disable();
      times.disable();
    };
    return box;
  }

  /** A strip showing each activity as a bar on a time line, with a marker at T. */
  function timeStrip(tt, T, hi) {
    var a = tt.items[0].s;
    var b = tt.items[tt.items.length - 1].e;
    var W = 640;
    function x(t) {
      return 20 + ((t - a) * (W - 40)) / (b - a);
    }
    var root = S('svg', { viewBox: '0 0 ' + W + ' 112', class: 'mdt-strip' });
    root.appendChild(S('line', { x1: 20, y1: 60, x2: W - 20, y2: 60, class: 'mdt-strip-axis' }));
    tt.items.forEach(function (it, i) {
      root.appendChild(S('rect', { x: x(it.s), y: 44, width: x(it.e) - x(it.s), height: 32, rx: 6, class: 'mdt-strip-bar' + (i === hi ? ' mdt-strip-hi' : '') }));
      root.appendChild(S('text', { x: (x(it.s) + x(it.e)) / 2, y: 66, class: 'mdt-strip-icon', 'text-anchor': 'middle' }, it.icon));
      root.appendChild(S('text', { x: x(it.s), y: 94 + (i % 2) * 14, class: 'mdt-strip-t', 'text-anchor': 'middle' }, lab(it.s)));
    });
    root.appendChild(S('text', { x: x(b), y: 94, class: 'mdt-strip-t', 'text-anchor': 'middle' }, lab(b)));
    root.appendChild(S('line', { x1: x(T), y1: 24, x2: x(T), y2: 82, class: 'mdt-strip-now' }));
    root.appendChild(S('text', { x: x(T), y: 18, class: 'mdt-strip-nowt', 'text-anchor': 'middle' }, lab(T)));
    return root;
  }

  /** Number line from s to e with count-on jumps (15s then 5s). */
  function countOnLine(s, e) {
    var js = jumps(s, e);
    var W = 660;
    var D = e - s;
    function x(t) {
      return 30 + ((t - s) * (W - 60)) / D;
    }
    var root = S('svg', { viewBox: '0 0 ' + W + ' 130', class: 'mdt-line' });
    root.appendChild(S('line', { x1: 30, y1: 80, x2: W - 30, y2: 80, class: 'mdt-line-axis' }));
    var t = s;
    var stops = [s];
    js.forEach(function (j) {
      var x0 = x(t), x1 = x(t + j);
      root.appendChild(S('path', { d: 'M' + x0 + ' 78 Q' + (x0 + x1) / 2 + ' ' + (j === 15 ? 30 : 48) + ' ' + x1 + ' 78', class: 'mdt-jump' + (j === 5 ? ' mdt-jump5' : '') }));
      root.appendChild(S('text', { x: (x0 + x1) / 2, y: j === 15 ? 46 : 58, class: 'mdt-jump-t', 'text-anchor': 'middle' }, '+' + j));
      t += j;
      stops.push(t);
    });
    stops.forEach(function (st, i) {
      root.appendChild(S('line', { x1: x(st), y1: 72, x2: x(st), y2: 88, class: 'mdt-line-tick' }));
      var end = i === 0 || i === stops.length - 1;
      root.appendChild(S('text', { x: x(st), y: 106 + (end ? 0 : (i % 2) * 16), class: 'mdt-line-t' + (end ? ' mdt-line-big' : ''), 'text-anchor': 'middle' }, lab(st)));
    });
    return root;
  }

  /* ---------------- learn screens ---------------- */
  var LEARN_DAY = {
    title: 'Class 3 timetable',
    ampm: true,
    items: [
      { name: 'Maths', icon: '🔢', s: 540, e: 600 },
      { name: 'Spelling', icon: '✏️', s: 600, e: 630 },
      { name: 'Science', icon: '🔬', s: 645, e: 690 },
      { name: 'Art', icon: '🎨', s: 690, e: 735 },
      { name: 'Music', icon: '🎵', s: 795, e: 840 },
      { name: 'Games', icon: '⚽', s: 840, e: 900 },
    ],
  };

  function learnRow(stage, api) {
    api.say('This is a school timetable. Click a lesson to see when it starts and ends.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Reading a timetable', 'Find the lesson. The <b>top time</b> is when it starts. The <b>bottom time</b> is when it ends.'));
    var seen = {};
    var count = 0;
    var clocks = el('div', { class: 'mdt-clockhold' }, el('div', { class: 'mdt-task' }, 'Click two lessons.'));
    var tt = rowTable(LEARN_DAY, function (i) {
      var x = LEARN_DAY.items[i];
      tt.clear();
      tt.light(i, 's');
      tt.light(i, 'e');
      MQ.clear(clocks);
      clocks.appendChild(clockPair(x.s, x.e));
      api.sound('pop');
      api.say(x.name + ' starts at ' + lab(x.s, true) + ', and ends at ' + lab(x.e, true) + '.', 'happy');
      if (!seen[i]) {
        seen[i] = true;
        count++;
      }
      if (count >= 2) {
        api.feedback('Morning times are a.m. Afternoon times are p.m. 12:00 is midday.', 'good');
        api.unlockNext();
      } else {
        api.feedback('Now click another lesson.', 'info');
      }
    });
    stage.appendChild(tt);
    stage.appendChild(clocks);
  }

  function learnGrid(stage, api) {
    api.say('A holiday camp timetable. Days go across. Times go down.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('A week timetable', 'Click a <b>day</b> to light its column. Click a <b>time</b> to light its row.'));
    var camp = makeCamp();
    var target = { d: U.rand(0, 4), r: U.rand(0, 4) };
    var pick = { d: -1, r: -1 };
    var done = false;
    var task = el('div', { class: 'mdt-task' }, 'What is on ', el('b', null, DAYS[target.d]), ' at ', el('b', null, lab(ROWS[target.r])), '?');
    var readout = el('div', { class: 'mdt-readout' }, '');
    var grid = campGrid(camp, {
      onDay: function (d) {
        pick.d = d;
        show();
      },
      onTime: function (r) {
        pick.r = r;
        show();
      },
    });
    function show() {
      api.sound('click');
      grid.clear();
      if (pick.d >= 0) grid.col(pick.d);
      if (pick.r >= 0) grid.row(pick.r);
      if (pick.d < 0 || pick.r < 0) {
        readout.textContent = pick.d >= 0 ? DAYS[pick.d] + '. Now click a time.' : lab(ROWS[pick.r]) + '. Now click a day.';
        return;
      }
      grid.meet(pick.d, pick.r);
      var a = camp.cells[pick.d][pick.r];
      readout.textContent = DAYS[pick.d] + ' at ' + lab(ROWS[pick.r]) + ': ' + a.i + ' ' + a.n;
      if (!done && pick.d === target.d && pick.r === target.r) {
        done = true;
        task.classList.add('mdt-task-done');
        api.sound('correct');
        api.say('Yes! The column and the row meet at ' + a.n + '.', 'cheer');
        api.feedback('Find the day, find the time, and look where they meet.', 'good');
        api.unlockNext();
      }
    }
    stage.appendChild(task);
    stage.appendChild(grid);
    stage.appendChild(readout);
  }

  var BUILD_SLOTS = [
    { s: 540, e: 600 },
    { s: 600, e: 645 },
    { s: 660, e: 705 },
    { s: 720, e: 780, fixed: { n: 'Lunch', i: '🥪' } },
    { s: 780, e: 810 },
    { s: 810, e: 870 },
  ];
  var BUILD_CARDS = [{ n: 'Maths', i: '🔢' }, { n: 'Reading', i: '📖' }, { n: 'Art', i: '🎨' }, { n: 'Games', i: '⚽' }, { n: 'Music', i: '🎵' }];

  function learnBuild(stage, api) {
    api.say('Now make your own day! Drag each lesson into a time slot. Or click a lesson, then click a slot.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Build your day', 'Put each lesson where <b>you</b> want it.'));
    var placed = BUILD_SLOTS.map(function (sl) { return sl.fixed || null; });
    var selected = null;
    var locked = false;
    var tray = el('div', { class: 'mdt-tray' });
    var slotRow = el('div', { class: 'mdt-row mdt-slots' });
    var qbox = el('div', { class: 'mdt-qbox' });
    var slotEls = BUILD_SLOTS.map(function (sl, i) {
      var s = el('div', { class: 'mdt-cell mdt-slot' + (sl.fixed ? ' mdt-slot-fixed' : ''), 'data-slot': String(i) });
      s.addEventListener('click', function () {
        if (locked || sl.fixed || s._justDropped) return;
        if (selected) place(selected, i);
        else if (placed[i]) {
          placed[i] = null; // clicking a filled slot sends the lesson back to the tray
          render();
        }
      });
      slotRow.appendChild(s);
      return s;
    });
    var cardEls = {};
    BUILD_CARDS.forEach(function (c) {
      var ce = el('button', { class: 'mdt-card', type: 'button', 'data-card': c.n }, el('span', { class: 'mdt-cell-icon' }, c.i), el('span', null, c.n));
      cardEls[c.n] = ce;
      ce.addEventListener('pointerdown', function (e) { down(e, c); });
    });

    function render() {
      MQ.clear(tray);
      BUILD_CARDS.forEach(function (c) {
        var at = placed.indexOf(c);
        cardEls[c.n].classList.toggle('mdt-card-sel', selected === c);
        if (at < 0) tray.appendChild(cardEls[c.n]);
      });
      if (!tray.firstChild) tray.appendChild(el('div', { class: 'mdt-tray-empty' }, locked ? 'Your day is ready!' : ''));
      slotEls.forEach(function (s, i) {
        MQ.clear(s);
        var sl = BUILD_SLOTS[i];
        var c = placed[i];
        s.classList.toggle('mdt-slot-full', !!c);
        s.appendChild(c ? el('div', { class: 'mdt-cell-icon' }, c.i) : el('div', { class: 'mdt-cell-icon mdt-slot-q' }, '?'));
        s.appendChild(el('div', { class: 'mdt-cell-name' }, c ? c.n : 'empty'));
        s.appendChild(el('div', { class: 'mdt-cell-time' }, lab(sl.s, true)));
        s.appendChild(el('div', { class: 'mdt-cell-to' }, 'to'));
        s.appendChild(el('div', { class: 'mdt-cell-time' }, lab(sl.e, true)));
        if (c && !sl.fixed && !locked) {
          s.classList.add('mdt-slot-back');
          s.title = 'Click to take it out';
        } else s.classList.remove('mdt-slot-back');
      });
    }
    function place(card, i) {
      var from = placed.indexOf(card);
      if (from >= 0) placed[from] = null;
      if (placed[i] && from >= 0) placed[from] = placed[i]; // swap two placed lessons
      placed[i] = card;
      selected = null;
      api.sound('pop');
      render();
      if (BUILD_CARDS.every(function (c) { return placed.indexOf(c) >= 0; })) finish();
    }
    // Drag with a floating copy; a press without moving selects the card instead.
    var drag = null;
    function down(e, c) {
      if (locked) return;
      e.preventDefault();
      drag = { c: c, x: e.clientX, y: e.clientY, ghost: null };
    }
    function move(e) {
      if (!drag) return;
      if (!drag.ghost && Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 6) {
        drag.ghost = el('div', { class: 'mdt-card mdt-ghost' }, el('span', { class: 'mdt-cell-icon' }, drag.c.i), el('span', null, drag.c.n));
        document.body.appendChild(drag.ghost);
      }
      if (drag.ghost) {
        drag.ghost.style.left = e.clientX - 50 + 'px';
        drag.ghost.style.top = e.clientY - 30 + 'px';
      }
    }
    function up(e) {
      if (!drag) return;
      var d = drag;
      drag = null;
      if (!d.ghost) {
        selected = selected === d.c ? null : d.c;
        api.sound('click');
        render();
        if (selected) api.feedback('Now click a slot for ' + selected.n + '.', 'info');
        return;
      }
      d.ghost.parentNode.removeChild(d.ghost);
      var target = document.elementFromPoint(e.clientX, e.clientY);
      var slot = target && target.closest ? target.closest('.mdt-slot') : null;
      if (slot) {
        var i = parseInt(slot.getAttribute('data-slot'), 10);
        if (!BUILD_SLOTS[i].fixed) {
          slot._justDropped = true;
          api.later(function () { slot._justDropped = false; }, 50);
          place(d.c, i);
        }
      }
    }
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    api.cleanup(function () {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (drag && drag.ghost && drag.ghost.parentNode) drag.ghost.parentNode.removeChild(drag.ghost);
    });

    function finish() {
      locked = true;
      render();
      var c = U.pick(BUILD_CARDS);
      var i = placed.indexOf(c);
      var sl = BUILD_SLOTS[i];
      var askStart = Math.random() < 0.5;
      var want = askStart ? sl.s : sl.e;
      slotEls[i].classList.add('mdt-on');
      api.say('Great timetable! Now a question about your day.', 'cheer');
      api.feedback('', 'info');
      var opts = [];
      BUILD_SLOTS.forEach(function (b) {
        [b.s, b.e].forEach(function (t) { if (opts.indexOf(t) < 0) opts.push(t); });
      });
      opts = U.shuffle(opts.filter(function (t) { return t !== want && (t === sl.s || t === sl.e || Math.random() < 0.5); })).slice(0, 3).concat([want]);
      opts.sort(function (a, b) { return a - b; });
      MQ.clear(qbox);
      qbox.appendChild(MQ.ui.prompt('When does your <b>' + c.n + '</b> ' + (askStart ? 'start' : 'end') + '?'));
      var ch = MQ.ui.choices(opts.map(function (t) { return { label: lab(t, true), value: t }; }), function (v) {
        if (v === want) {
          ch.mark(v, 'good');
          ch.disable();
          api.sound('correct');
          api.say('Yes! ' + c.n + ' ' + (askStart ? 'starts' : 'ends') + ' at ' + lab(want, true) + '.', 'cheer');
          api.feedback('You read your own timetable. Let\'s practise!', 'good');
          api.unlockNext();
        } else {
          ch.mark(v, 'bad');
          api.sound('wrong');
          var other = askStart ? sl.e : sl.s;
          api.feedback(v === other ? 'That is when ' + c.n + ' ' + (askStart ? 'ends' : 'starts') + '. Look at the ' + (askStart ? 'top' : 'bottom') + ' time.' : 'Find ' + c.n + ' in your timetable first. It is lit up.', 'try');
        }
      }, { columns: 4 });
      qbox.appendChild(ch);
    }

    render();
    stage.appendChild(slotRow);
    stage.appendChild(tray);
    stage.appendChild(qbox);
  }

  /* ---------------- practice: one-row look-ups ---------------- */
  function timeOptions(correct, cands) {
    var seen = {};
    seen[correct] = true;
    var out = [{ t: correct, tag: null }];
    cands.forEach(function (c) {
      if (out.length < 4 && c.t != null && !seen[c.t] && c.t >= 0 && c.t < 1440) {
        seen[c.t] = true;
        out.push(c);
      }
    });
    return out;
  }

  /** The correct time, the answer options (with mistake tags) and the question text for a one-row look-up. */
  function rowQ(q) {
    var its = q.tt.items;
    var x = its[q.li];
    var last = its[its.length - 1];
    var want, cands, text;
    if (q.type === 'start') {
      want = x.s;
      text = 'When does <b>' + x.name + '</b> start?';
      cands = [{ t: x.e, tag: TAG.endForStart }, { t: flipAmPm(x.s), tag: TAG.ampm }, { t: its[q.li + 1] ? its[q.li + 1].s : null, tag: TAG.lesson }, { t: its[q.li - 1] ? its[q.li - 1].s : null, tag: TAG.lesson }, { t: its[q.li - 1] ? its[q.li - 1].e : null, tag: TAG.lesson }];
    } else if (q.type === 'end') {
      want = x.e;
      text = 'When does <b>' + x.name + '</b> end?';
      cands = [{ t: x.s, tag: TAG.startForEnd }, { t: flipAmPm(x.e), tag: TAG.ampm }, { t: its[q.li + 1] ? its[q.li + 1].e : null, tag: TAG.lesson }, { t: its[q.li - 1] ? its[q.li - 1].e : null, tag: TAG.lesson }, { t: its[q.li + 1] ? its[q.li + 1].s : null, tag: TAG.lesson }];
    } else {
      want = its[0].s;
      text = 'School starts with the first lesson. What time must you <b>arrive</b>?';
      cands = [{ t: its[0].e, tag: TAG.endForStart }, { t: last.e, tag: TAG.finish }, { t: flipAmPm(its[0].s), tag: TAG.ampm }, { t: its[1].s, tag: TAG.lesson }, { t: its[1].e, tag: TAG.lesson }];
    }
    // Fill up to four options with other times from the same timetable.
    U.shuffle(its).forEach(function (o) {
      cands.push({ t: o.s, tag: TAG.lesson }, { t: o.e, tag: TAG.lesson });
    });
    return { want: want, text: text, opts: timeOptions(want, cands) };
  }

  function renderRowQ(stage, api, q) {
    var tt = q.tt;
    var its = tt.items;
    var x = its[q.li];
    var r = rowQ(q);
    var want = r.want;
    var text = r.text;
    var opts = r.opts;
    api.say(q.type === 'arrive' ? 'Which lesson comes first?' : 'Find the lesson, then read its time.', 'think');
    var table = rowTable(tt);
    stage.appendChild(table);
    stage.appendChild(MQ.ui.prompt(text));
    var ch = MQ.ui.choices(U.shuffle(opts).map(function (o) { return { label: lab(o.t, true), value: o.t }; }), function (v) {
      if (v === want) {
        ch.mark(v, 'good');
        ch.disable();
        table.light(q.li, q.type === 'end' ? 'e' : 's');
        api.check(true, q.type === 'arrive' ? 'Yes! Be there when the first lesson starts: ' + lab(want, true) + '.' : null);
        return;
      }
      ch.mark(v, 'bad');
      var o = opts.filter(function (z) { return z.t === v; })[0];
      var strong = api.tries() >= 1;
      var hint;
      if (o.tag === TAG.ampm) hint = 'The numbers are right! Is it in the morning (a.m.) or the afternoon (p.m.)? Look at the timetable.';
      else if (o.tag === TAG.endForStart && q.type === 'arrive') hint = strong ? 'You need to be there when ' + its[0].name + ' STARTS. Read its top time.' : 'That is when the first lesson ends. You must be there before it starts!';
      else if (o.tag === TAG.endForStart) hint = strong ? 'Find ' + x.name + '. Start = the top time in its box.' : 'That is when ' + x.name + ' ends. Which time is the start?';
      else if (o.tag === TAG.startForEnd) hint = strong ? 'Find ' + x.name + '. End = the bottom time in its box.' : 'That is when ' + x.name + ' starts. Which time is the end?';
      else if (o.tag === TAG.finish) hint = 'That is when school finishes! You arrive at the start of the day. Look at the first lesson.';
      else if (q.type === 'arrive') hint = strong ? 'The first lesson is ' + its[0].name + ', on the left. Read its start time.' : 'That is not the first lesson. Which lesson is first, on the left?';
      else hint = strong ? x.name + ' is in box ' + (q.li + 1) + ' from the left. Read the time in that box.' : 'That time belongs to another lesson. Find ' + x.name + ' first.';
      api.check(false, hint, o.tag || TAG.lesson);
    }, { columns: 4 });
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(want, 'good');
      ch.disable();
      table.light(q.li, q.type === 'end' ? 'e' : 's');
      stage.appendChild(el('div', { class: 'mdt-work' }, clockPair(x.s, x.e)));
      if (q.type === 'arrive') api.feedback('First lesson: ' + its[0].name + ' starts at ' + lab(want, true) + ', so arrive by ' + lab(want, true) + '.', 'info');
      else api.feedback(x.name + ': starts ' + lab(x.s, true) + ', ends ' + lab(x.e, true) + '. The ' + (q.type === 'start' ? 'start' : 'end') + ' is ' + lab(want, true) + '.', 'info');
    });
  }

  /* ---------------- practice: camp grid ---------------- */
  function renderGridQ(stage, api, q) {
    var camp = q.camp;
    var ans; // 'd3' or 't2'
    var text;
    if (q.type === 'lateLunch') {
      ans = 'd' + camp.lateDay;
      text = 'Which <b>day</b> has a late lunch?';
    } else if (q.type === 'singDay') {
      ans = 'd' + camp.singDay;
      text = 'What <b>day</b> is singing?';
    } else if (q.type === 'noRacquet') {
      ans = 'd' + camp.noTen;
      text = 'You need your tennis racquet for tennis. Which day do you <b>NOT</b> need it?';
    } else {
      ans = 't' + camp.singRow;
      text = 'What <b>time</b> does singing start?';
    }
    var askDay = ans.charAt(0) === 'd';
    api.say(askDay ? 'Is the question asking for a day or a time?' : 'Find singing first. Then read across to the time.', 'think');
    var grid = campGrid(camp);
    stage.appendChild(grid);
    stage.appendChild(MQ.ui.prompt(text));
    var ch = dayTimeChoices(function (v) {
      if (v === ans) {
        ch.mark(v, 'good');
        ch.disable();
        showWork(false);
        api.check(true);
        return;
      }
      ch.mark(v, 'bad');
      var strong = api.tries() >= 1;
      var n = parseInt(v.slice(1), 10);
      if (askDay && v.charAt(0) === 't') {
        return api.check(false, 'The question says "which day". Your answer must be a day of the week, not a time.', TAG.timeForDay);
      }
      if (!askDay && v.charAt(0) === 'd') {
        return api.check(false, 'The question asks "what time". Find singing, then read the time at the side of its row.', TAG.dayForTime);
      }
      if (q.type === 'lateLunch') {
        return api.check(false, strong ? 'Lunch is in the 12:00 row on most days. Which day has lunch lower down, at 1:00?' : 'Look down ' + DAYS[n] + '. When is lunch there? Find the day where lunch is later.', TAG.col);
      }
      if (q.type === 'singDay') {
        var r0 = camp.cells[n].map(function (a) { return a.n; });
        return api.check(false, strong ? 'Look for the 🎤 in the grid. Then go up its column to the day.' : 'There is no singing on ' + DAYS[n] + ' (' + r0.join(', ') + '). Look for Singing.', TAG.col);
      }
      if (q.type === 'noRacquet') {
        return api.check(false, strong ? 'Check each day for 🎾. Only one day has no tennis.' : DAYS[n] + ' has tennis, so you DO need the racquet then. Find the day with NO tennis.', TAG.not);
      }
      // singTime, wrong time row
      var endT = camp.singRow + 1;
      if (n === endT) return api.check(false, 'That is when singing ends (the next time down). When does it start?', TAG.endForStart);
      return api.check(false, strong ? 'Singing is on ' + DAYS[camp.singDay] + '. Go left along its row to the time.' : 'Singing is not in that row. Find 🎤 first, then read the time on the left of its row.', TAG.row);
    });
    stage.appendChild(ch);
    function showWork(say) {
      grid.clear();
      if (q.type === 'lateLunch') {
        for (var d = 0; d < 5; d++) grid.mark(d, d === camp.lateDay ? 3 : 2);
        grid.col(camp.lateDay);
        grid.meet(camp.lateDay, 3);
        if (say) api.feedback('Lunch is at 12:00 on the other days, but on ' + DAYS[camp.lateDay] + ' it is at 1:00. Answer: ' + DAYS[camp.lateDay] + ' (a day, not a time).', 'info');
      } else if (q.type === 'singDay') {
        grid.col(camp.singDay);
        grid.meet(camp.singDay, camp.singRow);
        if (say) api.feedback('🎤 Singing is in the ' + DAYS[camp.singDay] + ' column. Answer: ' + DAYS[camp.singDay] + '.', 'info');
      } else if (q.type === 'noRacquet') {
        for (var dd = 0; dd < 5; dd++) {
          for (var r = 0; r < 5; r++) if (camp.cells[dd][r] === CAMP.tennis) grid.mark(dd, r);
        }
        grid.col(camp.noTen);
        if (say) api.feedback('Every day has 🎾 tennis except ' + DAYS[camp.noTen] + '. So you do not need the racquet on ' + DAYS[camp.noTen] + '.', 'info');
      } else {
        grid.row(camp.singRow);
        grid.meet(camp.singDay, camp.singRow);
        if (say) api.feedback('Singing is on ' + DAYS[camp.singDay] + ' in the ' + lab(ROWS[camp.singRow]) + ' row. It starts at ' + lab(ROWS[camp.singRow]) + ' and ends at ' + lab(ROWS[camp.singRow + 1]) + '.', 'info');
      }
    }
    api.onReveal(function () {
      ch.mark(ans, 'good');
      ch.disable();
      showWork(true);
    });
  }

  /* ---------------- practice: what is happening at T? ---------------- */
  function renderAt(stage, api, q) {
    var tt = q.tt;
    var its = tt.items;
    var T = q.T;
    var want = its[q.ans];
    api.say('Is the time after the start and before the end?', 'think');
    var table = rowTable(tt);
    stage.appendChild(table);
    stage.appendChild(MQ.ui.prompt('What is happening at <b>' + lab(T, true) + '</b>?'));
    var ch = MQ.ui.choices(its.map(function (x, i) { return { label: x.icon + ' ' + x.name, value: i }; }), function (v) {
      if (v === q.ans) {
        ch.mark(v, 'good');
        ch.disable();
        table.light(v);
        api.check(true, lab(T) + ' is inside ' + lab(want.s) + ' to ' + lab(want.e) + '. ' + want.name + '!');
        return;
      }
      ch.mark(v, 'bad');
      var x = its[v];
      var strong = api.tries() >= 1;
      if (x.e === T) return api.check(false, x.name + ' ENDS at ' + lab(T) + ', so at ' + lab(T) + ' it has just finished. What starts then?', TAG.endInside);
      if (x.e < T) return api.check(false, strong ? 'Look for the box whose start is before ' + lab(T) + ' and whose end is after it.' : x.name + ' finished at ' + lab(x.e) + '. That is before ' + lab(T) + '.', TAG.over);
      return api.check(false, strong ? 'Look for the box whose start is before ' + lab(T) + ' and whose end is after it.' : x.name + ' starts at ' + lab(x.s) + '. That is after ' + lab(T) + ', so it has not started yet.', TAG.notYet);
    }, { columns: 3 });
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(q.ans, 'good');
      ch.disable();
      table.light(q.ans);
      stage.appendChild(el('div', { class: 'mdt-work' }, timeStrip(tt, T, q.ans)));
      var prev = its[q.ans - 1];
      if (q.mode === 'edge' && prev) api.feedback(prev.name + ' ends at ' + lab(T) + ', so it has finished. ' + want.name + ' starts at ' + lab(T) + '. Answer: ' + want.name + '.', 'info');
      else api.feedback(want.name + ' is ' + lab(want.s) + ' to ' + lab(want.e) + '. ' + lab(T) + ' is after the start and before the end. Answer: ' + want.name + '.', 'info');
    });
  }

  /* ---------------- practice: how long? ---------------- */
  function renderDur(stage, api, q) {
    var x = q.tt.items[q.li];
    var D = x.e - x.s;
    var js = jumps(x.s, x.e);
    api.say('Count on from the start time to the end time.', 'think');
    var table = rowTable(q.tt);
    table.light(q.li);
    stage.appendChild(table);
    stage.appendChild(MQ.ui.prompt('How long is <b>Games</b>? <span class="mdt-small">(' + lab(x.s, true) + ' to ' + lab(x.e, true) + ')</span>'));
    var work = el('div', { class: 'mdt-work' });
    var box = MQ.ui.numberInput({
      unit: 'minutes',
      onSubmit: function (n) {
        if (n !== Math.round(n) || n <= 0) {
          api.feedback('Type a whole number of minutes, like 40.', 'info');
          return;
        }
        if (n === D) {
          box.good();
          box.disable();
          api.check(true, 'Yes! ' + js.join(' + ') + ' = ' + D + ' minutes.');
          return;
        }
        box.bad();
        var strong = api.tries() >= 1;
        var nv = naiveDiff(x.s, x.e);
        if (n === nv && nv !== D) {
          return api.check(false, 'Careful! An hour is 60 minutes, not 100, so we cannot take away the times like ordinary numbers. Count on from ' + lab(x.s) + '.', TAG.naive);
        }
        var first = x.s + js[0];
        api.check(false, strong ? 'Start at ' + lab(x.s) + '. Jump 15 to ' + lab(first) + ', and keep jumping until you reach ' + lab(x.e) + '. Add the jumps.' : 'Count on from ' + lab(x.s) + ' to ' + lab(x.e) + ' in jumps of 15 minutes, then 5s.', TAG.count);
      },
    });
    stage.appendChild(box.el);
    stage.appendChild(work);
    box.focus();
    api.onReveal(function () {
      box.setValue(String(D));
      box.good();
      box.disable();
      work.appendChild(countOnLine(x.s, x.e));
      work.appendChild(MQ.ui.sum(js, D, 'minutes'));
      api.feedback('Count on from ' + lab(x.s) + ' to ' + lab(x.e) + ': ' + js.join(' + ') + ' = ' + D + ' minutes.', 'info');
    });
  }

  /* ---------------- practice: after-school clubs ---------------- */
  function renderClubs(stage, api, q) {
    var set = q.set;
    var chosen = {}; // club -> session
    var hadClash = false;
    var done = false;
    api.say('Choose one day for each club you want. Two clubs must not be on at the same time!', 'think');
    stage.appendChild(MQ.ui.prompt('Plan your week: pick a day for <b>each</b> club on your list.'));
    var wantRow = el('div', { class: 'mdt-wants' });
    var grid = el('div', { class: 'mdt-clubs' });
    var cardOf = [];
    for (var d = 0; d < 4; d++) {
      var col = el('div', { class: 'mdt-club-col' }, el('div', { class: 'mdt-g-day' }, el('span', { class: 'mdt-long' }, DAYS[d]), el('span', { class: 'mdt-short' }, DAY3[d])));
      set.sessions.filter(function (x) { return x.day === d; }).sort(function (a, b) { return a.s - b.s; }).forEach(function (x) {
        var wanted = set.wants.indexOf(x.club) >= 0;
        var c = el(wanted ? 'button' : 'div', { class: 'mdt-club' + (wanted ? ' mdt-club-want' : ''), type: wanted ? 'button' : null }, el('span', { class: 'mdt-club-name' }, x.icon + ' ' + x.club), el('span', { class: 'mdt-club-time' }, lab(x.s) + '–' + lab(x.e)));
        if (wanted) c.addEventListener('click', function () {
          if (done) return;
          chosen[x.club] = chosen[x.club] === x ? null : x;
          api.sound('click');
          draw();
        });
        cardOf.push({ x: x, el: c });
        col.appendChild(c);
      });
      grid.appendChild(col);
    }
    function clashes() {
      var list = set.wants.map(function (w) { return chosen[w]; }).filter(Boolean);
      var bad = [];
      for (var i = 0; i < list.length; i++) for (var j = i + 1; j < list.length; j++) if (list[i].day === list[j].day && overlap(list[i], list[j])) bad.push([list[i], list[j]]);
      return bad;
    }
    function draw() {
      var bad = clashes();
      var inClash = [];
      bad.forEach(function (p) { inClash.push(p[0], p[1]); });
      cardOf.forEach(function (c) {
        var sel = chosen[c.x.club] === c.x;
        c.el.classList.toggle('mdt-club-sel', sel);
        c.el.classList.toggle('mdt-club-clash', inClash.indexOf(c.x) >= 0);
      });
      MQ.clear(wantRow);
      set.wants.forEach(function (w) {
        var c = chosen[w];
        var icon = set.sessions.filter(function (x) { return x.club === w; })[0].icon;
        wantRow.appendChild(el('div', { class: 'mdt-want' + (c ? ' mdt-want-ok' : '') }, icon + ' ' + w + ': ', el('b', null, c ? DAY3[c.day] + ' ' + lab(c.s) + '–' + lab(c.e) : '?')));
      });
      if (done) return;
      if (bad.length) api.feedback(bad[0][0].club + ' and ' + bad[0][1].club + ' are both on ' + DAYS[bad[0][0].day] + ' at the same time!', 'info');
      else if (hadClash) api.feedback('No clashes now.', 'info');
      hadClash = bad.length > 0;
    }
    var check = el('button', { class: 'btn btn-check', type: 'button' }, 'Check my plan');
    check.addEventListener('click', function () {
      if (done) return;
      var missing = set.wants.filter(function (w) { return !chosen[w]; });
      if (missing.length) {
        api.feedback('Choose a day for ' + missing.join(' and ') + ' too.', 'info');
        return;
      }
      var bad = clashes();
      if (!bad.length) {
        done = true;
        check.disabled = true;
        api.check(true, 'No clashes! You can go to all four clubs.');
        return;
      }
      var p = bad[0];
      api.check(false, api.tries() >= 1 ? 'Start with the club that is on only ONE day. It has to go there. Then move the clubs that clash with it.' : p[0].club + ' (' + lab(p[0].s) + '–' + lab(p[0].e) + ') and ' + p[1].club + ' (' + lab(p[1].s) + '–' + lab(p[1].e) + ') are on at the same time on ' + DAYS[p[0].day] + '. Move one of them.', TAG.clash);
    });
    stage.appendChild(el('div', { class: 'mdt-wants-lbl' }, 'Clubs you want:'));
    stage.appendChild(wantRow);
    stage.appendChild(grid);
    stage.appendChild(check);
    draw();
    api.onReveal(function () {
      done = true;
      check.disabled = true;
      var plan = clubPlans(set)[0];
      chosen = {};
      plan.forEach(function (x) { chosen[x.club] = x; });
      draw();
      stage.appendChild(el('ol', { class: 'mdt-why' }, set.why.map(function (w) { return el('li', null, w); })));
      api.feedback('Start with the club that is on only one day, then move any club that clashes with it.', 'info');
    });
  }

  MQ.register(ID, {
    learn: [learnRow, learnGrid, learnBuild],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'start' || q.type === 'end' || q.type === 'arrive') renderRowQ(stage, api, q);
        else if (q.type === 'at') renderAt(stage, api, q);
        else if (q.type === 'dur') renderDur(stage, api, q);
        else if (q.type === 'clubs') renderClubs(stage, api, q);
        else renderGridQ(stage, api, q);
      },
    },
  });

  // Harmless hooks for automated tests (no effect on the page).
  MQ._mdt = { buildDeck: buildDeck, rowQ: rowQ, clubPlans: clubPlans, CLUB_SETS: CLUB_SETS, ROWS: ROWS, lab: lab, jumps: jumps, deck: function () { return deck; } };

  var css = [
    '.mdt-tt,.mdt-gridbox{width:100%;max-width:900px;display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.mdt-tt-title{font-weight:900;font-size:1.05rem;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em}',
    '.mdt-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:6px;width:100%;background:#fff;border:3px solid var(--line);border-radius:14px;padding:6px}',
    '.mdt-cell{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;background:var(--paper);border:2px solid var(--line);border-radius:10px;padding:6px 4px;font-family:var(--font);color:var(--ink);text-align:center;min-height:118px}',
    'button.mdt-cell{cursor:pointer}',
    'button.mdt-cell:hover{border-color:var(--accent)}',
    '.mdt-cell-icon{font-size:1.6rem;line-height:1.2}',
    '.mdt-cell-name{font-weight:900;font-size:1.05rem}',
    '.mdt-cell-time{font-weight:800;font-size:1rem;white-space:nowrap;border-radius:6px;padding:0 4px}',
    '.mdt-cell-to{font-size:.8rem;color:var(--ink-soft);font-weight:700}',
    '.mdt-on{background:#fff4d6;border-color:#ffb703;box-shadow:0 0 0 3px rgba(255,183,3,.35)}',
    '.mdt-hit{background:#ffb703;color:#1b2a4a}',
    '.mdt-small{font-size:1rem;color:var(--ink-soft);font-weight:700}',
    '.mdt-clockhold{min-height:190px;display:flex;align-items:center;justify-content:center}',
    '.mdt-clocks{display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:center}',
    '.mdt-clockbox{display:flex;flex-direction:column;align-items:center;gap:2px}',
    '.mdt-clock{width:130px;height:auto;display:block}',
    '.mdt-clock-rim{fill:#fffdf6;stroke:#c8553d;stroke-width:5}',
    '.mdt-tk{stroke:#9aa3b5;stroke-width:1}',
    '.mdt-tk-big{stroke:#1b2a4a;stroke-width:2.2}',
    '.mdt-clock-num{font-size:11px;font-weight:800;fill:#1b2a4a;font-family:var(--font)}',
    '.mdt-hand-h{stroke:#1b2a4a;stroke-width:5;stroke-linecap:round}',
    '.mdt-hand-m{stroke:#2f6fde;stroke-width:3;stroke-linecap:round}',
    '.mdt-clock-cap{fill:#c8553d}',
    '.mdt-clock-lbl{font-weight:800;color:var(--ink-soft);font-size:.9rem}',
    '.mdt-clock-time{font-weight:900;font-size:1.15rem}',
    '.mdt-arrow{font-size:2rem;font-weight:900;color:var(--ink-soft)}',
    '.mdt-task{font-size:1.15rem;font-weight:700;text-align:center;background:#fff8e6;border:2px dashed #ffb703;border-radius:12px;padding:8px 14px}',
    '.mdt-task-done{background:var(--good-bg);border-color:var(--good);border-style:solid}',
    '.mdt-grid{display:grid;grid-template-columns:62px repeat(5,minmax(0,1fr));gap:3px;width:100%;background:#fff;border:3px solid var(--line);border-radius:14px;padding:6px}',
    '.mdt-g-corner{font-weight:800;color:var(--ink-soft);font-size:.85rem;display:flex;align-items:center;justify-content:center}',
    '.mdt-g-day,.mdt-g-time{font-family:var(--font);font-weight:900;font-size:1rem;background:#e9eefb;border:2px solid #c9d3ee;border-radius:8px;padding:3px 2px;text-align:center;color:var(--ink)}',
    'button.mdt-g-day,button.mdt-g-time{cursor:pointer}',
    'button.mdt-g-day:hover,button.mdt-g-time:hover{border-color:var(--accent)}',
    '.mdt-g-time{display:flex;align-items:center;justify-content:center}',
    '.mdt-short{display:none}',
    '.mdt-hd-on{background:#ffb703;border-color:#e09b00}',
    '.mdt-g-cell{display:flex;align-items:center;justify-content:center;gap:5px;background:var(--paper);border:2px solid var(--line);border-radius:8px;padding:2px 4px;min-height:34px;font-weight:800;font-size:.95rem;text-align:center;transition:background .15s}',
    '.mdt-g-icon{font-size:1.2rem}',
    '.mdt-lit{background:#fff4d6;border-color:#ffd166}',
    '.mdt-mark{box-shadow:inset 0 0 0 3px #2f6fde}',
    '.mdt-meet{background:#ffb703;border-color:#c98a00;transform:scale(1.04)}',
    '.mdt-g-note{font-size:.9rem;color:var(--ink-soft);font-weight:700}',
    '.mdt-readout{font-size:1.25rem;font-weight:900;min-height:1.6em;text-align:center}',
    '.mdt-dtc{display:grid;grid-template-columns:60px 1fr;gap:6px 10px;align-items:center;width:100%;max-width:760px}',
    '.mdt-dtc .choices{max-width:none}',
    '.mdt-dtc .choice{min-height:48px;font-size:1.05rem;padding:6px 4px}',
    '.mdt-dtc-lbl{font-weight:800;color:var(--ink-soft);text-align:right}',
    '.mdt-work{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.mdt-strip,.mdt-line{width:100%;max-width:660px;height:auto;display:block}',
    '.mdt-strip-axis,.mdt-line-axis{stroke:#9aa3b5;stroke-width:3}',
    '.mdt-strip-bar{fill:#e9eefb;stroke:#9db8ef;stroke-width:2}',
    '.mdt-strip-hi{fill:#ffd166;stroke:#c98a00}',
    '.mdt-strip-icon{font-size:18px}',
    '.mdt-strip-t,.mdt-line-t{font-size:13px;font-weight:800;fill:#4a5a7d;font-family:var(--font)}',
    '.mdt-line-big{font-size:16px;fill:#1b2a4a}',
    '.mdt-strip-now{stroke:#d62828;stroke-width:3;stroke-dasharray:5 3}',
    '.mdt-strip-nowt{font-size:15px;font-weight:900;fill:#d62828;font-family:var(--font)}',
    '.mdt-line-tick{stroke:#1b2a4a;stroke-width:2}',
    '.mdt-jump{fill:none;stroke:#2f6fde;stroke-width:3}',
    '.mdt-jump5{stroke:#e8590c}',
    '.mdt-jump-t{font-size:14px;font-weight:900;fill:#1b2a4a;font-family:var(--font)}',
    '.mdt-slots .mdt-slot{border-style:dashed;cursor:pointer}',
    '.mdt-slot-full{border-style:solid !important;background:#f1f8ee}',
    '.mdt-slot-fixed{background:#eef1f6 !important;cursor:default !important}',
    '.mdt-slot-q{color:#c9d3ee;font-weight:900}',
    '.mdt-tray{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;min-height:62px;align-items:center}',
    '.mdt-tray-empty{font-weight:800;color:var(--good)}',
    '.mdt-card{display:inline-flex;align-items:center;gap:6px;font-family:var(--font);font-weight:900;font-size:1.1rem;background:#fff;border:3px solid #9db8ef;border-radius:12px;padding:8px 14px;cursor:grab;color:var(--ink);touch-action:none;user-select:none}',
    '.mdt-card .mdt-cell-icon{font-size:1.3rem}',
    '.mdt-card-sel{border-color:#ffb703;background:#fff4d6;box-shadow:0 0 0 3px rgba(255,183,3,.4)}',
    '.mdt-ghost{position:fixed;z-index:1000;pointer-events:none;opacity:.9;box-shadow:0 6px 16px rgba(0,0,0,.2)}',
    '.mdt-qbox{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.mdt-qbox .prompt{font-size:1.25rem}',
    '.mdt-wants-lbl{font-weight:800;color:var(--ink-soft)}',
    '.mdt-wants{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}',
    '.mdt-want{background:#fff;border:2px dashed #9db8ef;border-radius:10px;padding:5px 10px;font-weight:800}',
    '.mdt-want-ok{border-style:solid;border-color:var(--good);background:var(--good-bg)}',
    '.mdt-clubs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;width:100%;max-width:860px;background:#fff;border:3px solid var(--line);border-radius:14px;padding:8px}',
    '.mdt-club-col{display:flex;flex-direction:column;gap:6px}',
    '.mdt-club{display:flex;flex-direction:column;align-items:center;font-family:var(--font);color:var(--ink-soft);background:#f4f5f8;border:2px solid #e1e5ee;border-radius:10px;padding:5px 4px;text-align:center}',
    '.mdt-club-want{color:var(--ink);background:#fff;border:2px solid #9db8ef;cursor:pointer}',
    '.mdt-club-want:hover{border-color:var(--accent)}',
    '.mdt-club-name{font-weight:900;font-size:1rem}',
    '.mdt-club-time{font-weight:800;font-size:.95rem}',
    '.mdt-club-sel{background:#e3f6e8;border-color:var(--good);box-shadow:0 0 0 3px rgba(46,160,90,.3)}',
    '.mdt-club-clash{background:#ffe3e3;border-color:#d62828;animation:mdt-flash .5s ease 3}',
    '@keyframes mdt-flash{50%{background:#ff9b9b}}',
    '.mdt-why{margin:0;padding-left:24px;font-weight:700;max-width:720px;text-align:left}',
    '.mdt-why li{margin:2px 0}',
    '@media (max-width:860px){.mdt-long{display:none}.mdt-short{display:inline}.mdt-g-name{font-size:.85rem}.mdt-g-cell{flex-direction:column;gap:0}.mdt-clock{width:110px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

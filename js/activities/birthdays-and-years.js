/* Birthdays and Years — ages, birth years and waiting times on a line of years (Unit 14.1).
 * Rule used everywhere (and said on screen): an age in a year means the age ON the birthday in
 * that year. In the year you are born you are 0, so age = year − birth year.
 * Big jumps are shown as a jump of 10, then single years. Day questions use a strip of days with
 * real month lengths (February is never used, so no leap-year questions).
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  var ID = 'birthdays-and-years';
  var COUNT = 8;
  var W = 800;
  var MARGIN = 36;
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MLEN = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // February is never used in a question
  var THIS_YEAR = 2026;

  var TAG = {
    subtracted: 'Subtracted instead of adding years',
    added: 'Added instead of subtracting years',
    offByOne: 'Off by one year',
    noChange: 'Did not add the years',
    yearsNotAge: 'Gave the number of years, not the age',
    ageNotYears: 'Gave the age, not the years to wait',
    yearNotAge: 'Gave a year, not an age',
    ageNotYear: 'Gave an age, not a year',
    only10: 'Stopped after the jump of 10',
    oneChild: 'Answered for only one child',
    addedWaits: 'Added the two waiting times',
    across2000: 'Subtracted years wrongly across 2000',
    miscount: 'Miscounted the years',
    bothDays: 'Counted both birthdays',
    dayShort: 'Counted one day too few',
    addedDates: 'Added the dates',
    monthLen: 'Forgot the month length',
    monthsNotDays: 'Gave months instead of days',
    startDay: 'Counted the start day as day 1',
    dayExtra: 'Counted one day too many',
    dayMiscount: 'Miscounted the days',
    birthYear: 'Gave the birth year, not the age',
  };

  var KIDS = [
    ['Maya', 'f'], ['Sam', 'm'], ['Ali', 'm'], ['Zara', 'f'], ['Leo', 'm'], ['Nadia', 'f'],
    ['Omar', 'm'], ['Ruby', 'f'], ['Tariq', 'm'], ['Ella', 'f'], ['Hana', 'f'], ['Yusuf', 'm'],
    ['Priya', 'f'], ['Ben', 'm'], ['Lina', 'f'], ['Kofi', 'm'],
  ];
  function kid(k) {
    var f = k[1] === 'f';
    return { name: k[0], he: f ? 'she' : 'he', his: f ? 'her' : 'his', He: f ? 'She' : 'He', His: f ? 'Her' : 'His' };
  }
  var PLACES = [
    ['The climbing wall', 'climb'],
    ['The big water slide', 'go on the slide'],
    ['The go-kart track', 'drive a go-kart'],
    ['The football club', 'join'],
    ['The tall roller coaster', 'ride'],
  ];

  /* ---------------- the line (years or days) ---------------- */
  /**
   * A horizontal number line with n positions. opts.lanes (1 or 2) rows for figures;
   * opts.label(i) -> null | {t, key}; opts.groups [{from, to, name}] month names under the labels.
   */
  function axis(n, opts) {
    var lanes = opts.lanes || 1;
    var LANE = opts.lane || 112;
    var TOP = 6;
    var base = [];
    for (var l = 0; l < lanes; l++) base.push(TOP + (l + 1) * LANE);
    var AX = base[lanes - 1];
    var H = AX + (opts.groups ? 62 : 40);
    var step = (W - 2 * MARGIN) / Math.max(1, n - 1);
    function x(i) {
      return MARGIN + i * step;
    }
    var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'bdy-line', role: 'img', 'aria-label': opts.aria || 'number line' });
    var gGuide = S('g', {});
    var gArcs = S('g', { class: 'bdy-arcs' });
    var gTicks = S('g', {});
    var gFigs = S('g', {});
    var gTop = S('g', { class: 'bdy-toplayer' });
    svg.appendChild(S('rect', { x: 1, y: 1, width: W - 2, height: H - 2, rx: 14, class: 'bdy-paper' }));
    svg.appendChild(gGuide);
    svg.appendChild(gTicks);
    svg.appendChild(gArcs);
    svg.appendChild(gFigs);
    svg.appendChild(gTop);
    for (l = 0; l < lanes - 1; l++) {
      gGuide.appendChild(S('line', { x1: x(0) - 14, x2: x(n - 1) + 14, y1: base[l], y2: base[l], class: 'bdy-guide' }));
    }
    gTicks.appendChild(S('line', { x1: x(0) - 18, x2: x(n - 1) + 18, y1: AX, y2: AX, class: 'bdy-axis' }));
    gTicks.appendChild(S('path', { d: 'M' + (x(n - 1) + 26) + ' ' + AX + ' l-10 -6 v12 z', class: 'bdy-arrowhead' }));
    var ticks = [];
    for (var i = 0; i < n; i++) {
      var lab = opts.label ? opts.label(i) : null;
      var key = lab && lab.key;
      gTicks.appendChild(S('line', { x1: x(i), x2: x(i), y1: AX - (key ? 9 : 6), y2: AX + (key ? 9 : 6), class: 'bdy-tick' + (key ? ' bdy-tick-key' : '') }));
      var t = null;
      if (lab) {
        t = S('text', { x: x(i), y: AX + 26, 'text-anchor': 'middle', class: 'bdy-lab' + (key ? ' bdy-lab-key' : '') + (opts.small ? ' bdy-lab-sm' : '') }, String(lab.t));
        gTicks.appendChild(t);
      }
      ticks.push(t);
    }
    (opts.groups || []).forEach(function (g, k) {
      var x1 = x(g.from);
      var x2 = x(g.to);
      gTicks.appendChild(S('text', { x: (x1 + x2) / 2, y: AX + 50, 'text-anchor': 'middle', class: 'bdy-month' }, g.name));
      if (k > 0) {
        var xs = x(g.from) - step / 2;
        gTicks.appendChild(S('line', { x1: xs, x2: xs, y1: AX - 30, y2: AX + 54, class: 'bdy-sep' }));
      }
    });

    var A = {
      svg: svg, x: x, base: base, AX: AX, n: n, step: step, gArcs: gArcs, gFigs: gFigs, gTop: gTop, ticks: ticks,
    };
    /** Hop arc from position i1 to i2 on a lane. */
    A.arc = function (lane, i1, i2, label, delay, cls) {
      var y = base[lane];
      var x1 = x(i1);
      var x2 = x(i2);
      var dx = Math.abs(x2 - x1);
      var h = Math.min(92, 22 + dx * 0.3);
      var mx = (x1 + x2) / 2;
      var g = S('g', { class: 'bdy-hop ' + (cls || ''), style: { animationDelay: (delay || 0) + 'ms' } });
      g.appendChild(S('path', { d: 'M' + x1 + ' ' + (y - 2) + ' Q' + mx + ' ' + (y - h) + ' ' + x2 + ' ' + (y - 2), class: 'bdy-arc' }));
      if (label != null && label !== '') {
        g.appendChild(S('text', { x: mx, y: y - h / 2 - 6, 'text-anchor': 'middle', class: 'bdy-arclab' + (String(label).length > 3 ? ' bdy-arclab-sm' : '') }, String(label)));
      }
      gArcs.appendChild(g);
      return g;
    };
    A.flag = function (i, text) {
      var g = S('g', { class: 'bdy-flag' });
      g.appendChild(S('circle', { cx: x(i), cy: AX - 17, r: 12 }));
      g.appendChild(S('text', { x: x(i), y: AX - 12, 'text-anchor': 'middle' }, text || '?'));
      gTop.appendChild(g);
      return g;
    };
    A.mark = function (i, cls) {
      if (ticks[i]) ticks[i].classList.add(cls || 'bdy-lab-hit');
    };
    /** A child figure standing on a lane. */
    A.fig = function (lane, i, o) {
      o = o || {};
      var g = S('g', { class: 'bdy-fig bdy-c' + (o.color || 0) });
      var inner = S('g', {});
      g.appendChild(inner);
      if (o.name) inner.appendChild(S('text', { x: 0, y: -94, 'text-anchor': 'middle', class: 'bdy-figname' }, o.name));
      inner.appendChild(S('line', { x1: -5, y1: -16, x2: -7, y2: -1, class: 'bdy-leg' }));
      inner.appendChild(S('line', { x1: 5, y1: -16, x2: 7, y2: -1, class: 'bdy-leg' }));
      inner.appendChild(S('path', { d: 'M-11 -14 Q-12 -34 0 -35 Q12 -34 11 -14 Z', class: 'bdy-body' }));
      inner.appendChild(S('circle', { cx: 0, cy: -43, r: 9, class: 'bdy-head' }));
      var badge = S('g', { class: 'bdy-badge' });
      badge.appendChild(S('circle', { cx: 0, cy: -70, r: 16 }));
      var bt = S('text', { x: 0, y: -64, 'text-anchor': 'middle' }, o.age == null ? '' : String(o.age));
      badge.appendChild(bt);
      inner.appendChild(badge);
      gFigs.appendChild(g);
      var F = { g: g, i: i };
      F.moveTo = function (j) {
        F.i = j;
        g.style.transform = 'translate(' + x(j) + 'px,' + base[lane] + 'px)';
      };
      F.age = function (a) {
        bt.textContent = String(a);
        badge.classList.remove('bdy-bump');
        badge.getBoundingClientRect();
        badge.classList.add('bdy-bump');
      };
      F.ok = function (on) {
        g.classList.toggle('bdy-fig-ok', !!on);
      };
      F.moveTo(i);
      return F;
    };
    A.cake = function (lane, i, name) {
      var g = S('g', { class: 'bdy-cake' });
      if (name) g.appendChild(S('text', { x: x(i), y: base[lane] - 46, 'text-anchor': 'middle', class: 'bdy-figname' }, name));
      g.appendChild(S('text', { x: x(i), y: base[lane] - 12, 'text-anchor': 'middle', class: 'bdy-cakeicon' }, '🎂'));
      gFigs.appendChild(g);
      return g;
    };
    return A;
  }

  /** A line of years lo..hi. keys are always labelled (and bold). */
  function yearLine(lo, hi, keys, lanes) {
    keys = keys || [];
    var n = hi - lo + 1;
    var every = n <= 17 ? 1 : 2;
    var A = axis(n, {
      lanes: lanes,
      aria: 'line of years from ' + lo + ' to ' + hi,
      label: function (i) {
        var y = lo + i;
        if (keys.indexOf(y) !== -1) return { t: y, key: true };
        if (every === 2) {
          if (y % 2) return null;
          for (var k = 0; k < keys.length; k++) if (Math.abs(keys[k] - y) === 1) return null;
        }
        return { t: y };
      },
    });
    A.lo = lo;
    A.hi = hi;
    A.ix = function (y) {
      return y - lo;
    };
    return A;
  }

  /**
   * A strip of days. parts: [{m, from, to}] consecutive runs of days.
   * Returns axis with .ix(m, d).
   */
  function dayLine(parts, lane) {
    var pos = [];
    var groups = [];
    parts.forEach(function (p) {
      var start = pos.length;
      for (var d = p.from; d <= p.to; d++) pos.push({ m: p.m, d: d });
      groups.push({ from: start, to: pos.length - 1, name: MONTHS[p.m] });
    });
    var A = axis(pos.length, {
      lane: lane || 96,
      groups: groups,
      small: pos.length > 20,
      aria: 'days from ' + parts[0].from + ' ' + MONTHS[parts[0].m],
      label: function (i) {
        return { t: pos[i].d };
      },
    });
    A.ix = function (m, d) {
      for (var i = 0; i < pos.length; i++) if (pos[i].m === m && pos[i].d === d) return i;
      return -1;
    };
    A.pos = pos;
    return A;
  }

  /**
   * Animate hops along a year line from year a to year b on a lane: one jump of 10 if the gap is
   * 10 or more, then single years. labelFn(k, year) labels each landing (default: running count).
   * onLand(year, k) is called as each hop lands. Returns the total time in ms.
   */
  function yearHops(api, L, lane, a, b, o) {
    o = o || {};
    var dir = b > a ? 1 : -1;
    var n = Math.abs(b - a);
    var t = o.start || 0;
    var k = 0;
    var cur = a;
    var sg = dir > 0 ? '+' : '−';
    function land(y, kk, delay) {
      if (o.onLand) {
        api.later(function () {
          o.onLand(y, kk);
        }, delay + 250);
      }
    }
    if (n >= 10 && o.tens !== false) {
      L.arc(lane, L.ix(cur), L.ix(cur + dir * 10), sg + '10', t, 'bdy-hop-ten');
      cur += dir * 10;
      k = 10;
      land(cur, k, t);
      t += 700;
    }
    while (k < n) {
      k++;
      var nx = cur + dir;
      L.arc(lane, L.ix(cur), L.ix(nx), o.labelFn ? o.labelFn(k, nx) : k, t, 'bdy-hop-one');
      cur = nx;
      land(cur, k, t);
      t += 330;
    }
    return t;
  }

  function chipsRow(items) {
    var row = el('div', { class: 'bdy-chips' });
    items.forEach(function (it, i) {
      if (it === '→' || it === '+' || it === '−' || it === '=') row.appendChild(el('span', { class: 'bdy-op' }, it));
      else row.appendChild(el('span', { class: 'bdy-chip', style: { animationDelay: i * 0.1 + 's' } }, String(it)));
    });
    return row;
  }

  function sign(text, limit) {
    return el('div', { class: 'bdy-sign' }, el('div', { class: 'bdy-sign-t' }, text), el('div', { class: 'bdy-sign-n' }, limit + ' years and over'));
  }

  function plural(n, w) {
    return n + ' ' + w + (n === 1 ? '' : 's');
  }

  /* ---------------- learn screens ---------------- */
  function learnBirthdays(stage, api) {
    api.say('Maya was born in 2010. Each birthday, she gets one year older. Click the cake!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('One birthday = one year', 'Maya is born in <b>2010</b>. She is <b>0</b>. How old is she on her birthday in <b>2023</b>?'));
    var L = yearLine(2010, 2030, [2010, 2023]);
    var target = L.ix(2023);
    var flag = L.flag(target, '?');
    var F = L.fig(0, 0, { age: 0, color: 0 });
    var year = 2010;
    var info = el('div', { class: 'bdy-big' }, 'In 2010 Maya is 0.');
    var btn = el('button', { class: 'btn bdy-btn', type: 'button' }, '🎂 Next birthday');
    var reached = false;
    btn.addEventListener('click', function () {
      if (year >= 2030) return;
      L.arc(0, L.ix(year), L.ix(year + 1), '', 0, 'bdy-hop-one');
      year++;
      F.moveTo(L.ix(year));
      F.age(year - 2010);
      MQ.sound('pop');
      info.innerHTML = 'In <b>' + year + '</b> Maya is <b>' + (year - 2010) + '</b>.';
      if (year === 2023 && !reached) {
        reached = true;
        flag.style.display = 'none';
        L.mark(target);
        api.sound('correct');
        api.say('13 birthdays, so she is 13 in 2023!', 'cheer');
        api.feedback('2010 → 2023 is 13 hops. 2023 − 2010 = 13.', 'good');
        api.unlockNext();
      }
      if (year >= 2030) {
        btn.disabled = true;
        api.say('20 in 2030! One year for every hop.', 'cheer');
      }
    });
    stage.appendChild(el('div', { class: 'bdy-linebox' }, L.svg));
    stage.appendChild(el('div', { class: 'bdy-controls' }, btn, info));
  }

  function learnBack(stage, api) {
    api.say('Omar is 13 on his birthday in 2023. Hop back to the year he was born.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Counting back', 'Omar is <b>13</b> in <b>2023</b>. Go back 13 years: <b>10 first, then the rest</b>.'));
    var L = yearLine(2007, 2025, [2023]);
    var F = L.fig(0, L.ix(2023), { age: 13, color: 1 });
    var year = 2023;
    var age = 13;
    var hops = [];
    var info = el('div', { class: 'bdy-big' }, 'Years back: 0');
    var b10 = el('button', { class: 'btn bdy-btn', type: 'button' }, '◀ Back 10 years');
    var b1 = el('button', { class: 'btn bdy-btn bdy-btn-2', type: 'button' }, '◀ Back 1 year');
    var done = false;
    function go(k) {
      if (done) return;
      if (k > age) {
        api.feedback('Only ' + age + ' more ' + (age === 1 ? 'year' : 'years') + ' to go back. Use 1-year hops.', 'info');
        return;
      }
      L.arc(0, L.ix(year), L.ix(year - k), k === 10 ? '−10' : '−1', 0, k === 10 ? 'bdy-hop-ten' : 'bdy-hop-one');
      year -= k;
      age -= k;
      hops.push(k);
      F.moveTo(L.ix(year));
      F.age(age);
      MQ.sound('pop');
      var back = 13 - age;
      info.innerHTML = 'Years back: <b>' + back + '</b> &nbsp;·&nbsp; now at <b>' + year + '</b>';
      if (age === 0) {
        done = true;
        b10.disabled = true;
        b1.disabled = true;
        L.mark(L.ix(2010));
        api.sound('correct');
        var tens = hops.indexOf(10) !== -1;
        api.say(tens ? 'Born in 2010! Back 10, then back 3.' : 'Born in 2010! Next time, try a jump of 10 first.', 'cheer');
        api.feedback('2023 − 10 = 2013, then 2013 − 3 = 2010. Omar was born in 2010.', 'good');
        stage.appendChild(chipsRow(['2023', '−', '10', '=', '2013', '→', '2013', '−', '3', '=', '2010']));
        api.unlockNext();
      }
    }
    b10.addEventListener('click', function () {
      go(10);
    });
    b1.addEventListener('click', function () {
      go(1);
    });
    stage.appendChild(el('div', { class: 'bdy-linebox' }, L.svg));
    stage.appendChild(el('div', { class: 'bdy-controls' }, b10, b1, info));
  }

  function learnWait(stage, api) {
    api.say('Ana is 8 and Ben is 9. They want to ride together. Click to move one year on.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Waiting together', 'The ride is for children aged <b>10 and over</b>. <b>Both</b> must be old enough. How many years must they wait?'));
    var L = yearLine(2026, 2029, [2026], 2);
    var ana = L.fig(0, 0, { age: 8, name: 'Ana', color: 2 });
    var ben = L.fig(1, 0, { age: 9, name: 'Ben', color: 1 });
    var years = 0;
    var info = el('div', { class: 'bdy-big' }, 'Years waited: 0');
    var btn = el('button', { class: 'btn bdy-btn', type: 'button' }, '🎂 One year later');
    btn.addEventListener('click', function () {
      if (years >= 2) return;
      L.arc(0, years, years + 1, '', 0, 'bdy-hop-one');
      L.arc(1, years, years + 1, '', 0, 'bdy-hop-one');
      years++;
      ana.moveTo(years);
      ben.moveTo(years);
      ana.age(8 + years);
      ben.age(9 + years);
      ana.ok(8 + years >= 10);
      ben.ok(9 + years >= 10);
      MQ.sound('pop');
      info.innerHTML = 'Years waited: <b>' + years + '</b>';
      if (years === 1) {
        api.say('Ben is 10 now. But Ana is only 9. Keep going!', 'think');
        api.feedback('After 1 year only Ben can ride. Ana must wait too.', 'info');
      } else {
        btn.disabled = true;
        api.sound('correct');
        api.say('Both are 10 or more! They waited 2 years. The younger one decides.', 'cheer');
        api.feedback('Ana needs 10 − 8 = 2 years. Ben needs 10 − 9 = 1 year. Together: 2 years.', 'good');
        api.unlockNext();
      }
    });
    stage.appendChild(el('div', { class: 'bdy-row' }, sign('🎢 The big ride:', 10), el('div', { class: 'bdy-linebox' }, L.svg)));
    stage.appendChild(el('div', { class: 'bdy-controls' }, btn, info));
  }

  /* ---------------- question generators ---------------- */
  var nameQ = [];
  function nextKid() {
    if (!nameQ.length) nameQ = U.shuffle(KIDS.slice());
    return kid(nameQ.pop());
  }

  function genNext(n) {
    var a = U.rand(6, 11);
    var Y = U.rand(THIS_YEAR - 1, THIS_YEAR);
    var K = nextKid();
    var when = n === 1 ? 'next year, in <b>' + (Y + 1) + '</b>' : 'in <b>' + (Y + n) + '</b>';
    return {
      type: 'next', key: 'next:' + a + ':' + n, a: a, n: n, Y: Y, T: Y + n, K: K, ans: a + n, unit: 'years old',
      text: K.name + ' turned <b>' + a + '</b> on ' + K.his + ' birthday in <b>' + Y + '</b>. How old will ' + K.he + ' be on ' + K.his + ' birthday ' + when + '?',
    };
  }
  function genUntil() {
    var Lm = U.pick([10, 10, 11, 12]);
    var a = U.rand(Lm - 5, Lm - 1);
    var P = U.pick(PLACES);
    var K = nextKid();
    return {
      type: 'until', key: 'until:' + a + ':' + Lm, a: a, Lm: Lm, Y: THIS_YEAR, P: P, K: K, ans: Lm - a, unit: 'years',
      text: K.name + ' is <b>' + a + '</b>. ' + P[0] + ' is for children aged <b>' + Lm + ' and over</b>. How many years until ' + K.he + ' can ' + P[1] + '?',
    };
  }
  function genAgeIn() {
    var B = U.rand(2000, 2016);
    var age = U.rand(10, Math.min(19, 2030 - B));
    var K = nextKid();
    return {
      type: 'ageIn', key: 'ageIn:' + B + ':' + age, B: B, T: B + age, K: K, ans: age, unit: 'years old',
      text: K.name + ' was born in <b>' + B + '</b>. How old ' + (B + age <= THIS_YEAR ? 'was ' + K.he : 'will ' + K.he + ' be') + ' on ' + K.his + ' birthday in <b>' + (B + age) + '</b>?',
    };
  }
  function genBorn() {
    var a = U.rand(10, 19);
    var Y = U.rand(Math.max(2015, 2000 + a), THIS_YEAR);
    var K = nextKid();
    return {
      type: 'born', key: 'born:' + Y + ':' + a, a: a, Y: Y, B: Y - a, K: K, ans: Y - a, unit: '', pad: U.rand(1, 3),
      text: K.name + ' turned <b>' + a + '</b> on ' + K.his + ' birthday in <b>' + Y + '</b>. In which year was ' + K.he + ' born?',
    };
  }
  /** Any month but February; crossing questions also skip January (so February never appears). */
  function goodMonth(crossing) {
    var list = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    if (!crossing) list.push(0);
    return U.pick(list);
  }
  function genDaysSame() {
    var m = goodMonth(false);
    var n = U.rand(3, 12);
    var a = U.rand(3, Math.min(20, MLEN[m] - n));
    var b = a + n;
    var K1 = nextKid();
    var K2 = nextKid();
    return {
      type: 'daysSame', key: 'daysSame:' + a + ':' + n, m: m, a: a, b: b, n: n, K1: K1, K2: K2, ans: n, unit: 'days',
      text: K1.name + '’s birthday is on <b>' + a + ' ' + MONTHS[m] + '</b>. ' + K2.name + '’s birthday is on <b>' + b + ' ' + MONTHS[m] + '</b>. They were born in the same year. How many days older is ' + K1.name + '?',
    };
  }
  function genTwoStep() {
    var a = U.rand(8, 14);
    var Y = U.rand(2018, 2025);
    var k = U.rand(3, Math.min(9, 2030 - Y));
    var K = nextKid();
    return {
      type: 'twoStep', key: 'twoStep:' + a + ':' + k, a: a, Y: Y, T: Y + k, k: k, K: K, ans: a + k, unit: 'years old',
      text: K.name + ' turned <b>' + a + '</b> on ' + K.his + ' birthday in <b>' + Y + '</b>. How old ' + (Y + k <= THIS_YEAR ? 'was ' + K.he : 'will ' + K.he + ' be') + ' on ' + K.his + ' birthday in <b>' + (Y + k) + '</b>?',
    };
  }
  function genWait2() {
    var a1 = U.rand(5, 10);
    var a2 = a1 + U.rand(1, 3);
    var limits = [10, 11, 12].filter(function (v) {
      return v > a2 && v - a1 <= 6;
    });
    if (!limits.length) return genWait2();
    var Lm = U.pick(limits);
    var P = U.pick(PLACES);
    var K1 = nextKid();
    var K2 = nextKid();
    return {
      type: 'wait2', key: 'wait2:' + a1 + ':' + a2 + ':' + Lm, a1: a1, a2: a2, Lm: Lm, P: P, K1: K1, K2: K2, Y: THIS_YEAR, ans: Lm - a1, unit: 'years',
      text: K1.name + ' is <b>' + a1 + '</b> and ' + K2.name + ' is <b>' + a2 + '</b>. ' + P[0] + ' is for children aged <b>' + Lm + ' and over</b>. How many years until they can <b>both</b> ' + P[1] + '?',
    };
  }
  function genAcross() {
    var B1 = U.rand(1993, 1999);
    var B2 = U.rand(2001, Math.min(2009, B1 + 14));
    var K1 = nextKid();
    var K2 = nextKid();
    return {
      type: 'across', key: 'across:' + B1 + ':' + B2, B1: B1, B2: B2, K1: K1, K2: K2, ans: B2 - B1, unit: 'years',
      text: K1.name + ' was born in <b>' + B1 + '</b>. ' + K2.name + ' was born in <b>' + B2 + '</b>. Their birthdays are on the same day of the year. How many years older is ' + K1.name + '?',
    };
  }
  function genDays31() {
    var m = goodMonth(true);
    var m2 = (m + 1) % 12;
    var d = U.rand(10, 28);
    var K1 = nextKid();
    var K2 = nextKid();
    return {
      type: 'days31', key: 'days31:' + m + ':' + d, m: m, m2: m2, d: d, K1: K1, K2: K2, L: MLEN[m], ans: MLEN[m], unit: 'days',
      text: K1.name + '’s birthday is on <b>' + d + ' ' + MONTHS[m] + '</b>. ' + K2.name + '’s birthday is on <b>' + d + ' ' + MONTHS[m2] + '</b>. How many days is it from ' + K1.name + '’s birthday to ' + K2.name + '’s?',
    };
  }
  function genSibling() {
    var m = goodMonth(true);
    var m2 = (m + 1) % 12;
    var L = MLEN[m];
    var d = U.rand(L - 6, L - 2);
    var N = U.rand(Math.max(6, L - d + 2), 10);
    var e = d + N - L;
    var K1 = nextKid();
    var K2 = nextKid();
    var q = {
      type: 'sibling', key: 'sibling:' + m + ':' + d + ':' + N, m: m, m2: m2, d: d, N: N, L: L, e: e, K1: K1, K2: K2,
      ans: m2 * 100 + e,
      text: K1.name + '’s birthday is on <b>' + d + ' ' + MONTHS[m] + '</b>. ' + K1.His + ' little ' + (K2.he === 'she' ? 'sister' : 'brother') + ' ' + K2.name + ' has a birthday <b>' + N + ' days later</b>. When is ' + K2.name + '’s birthday?',
    };
    // choices: the answer, one day early (counted the start day), one day late, and the impossible date
    var opts = [
      { v: m2 * 100 + e, t: e + ' ' + MONTHS[m2] },
      { v: e - 1 >= 1 ? m2 * 100 + e - 1 : m * 100 + L, t: e - 1 >= 1 ? e - 1 + ' ' + MONTHS[m2] : L + ' ' + MONTHS[m] },
      { v: m2 * 100 + e + 1, t: e + 1 + ' ' + MONTHS[m2] },
      { v: m * 100 + d + N, t: d + N + ' ' + MONTHS[m] },
    ];
    function order(o) {
      return (Math.floor(o.v / 100) === m ? 0 : 100) + (o.v % 100);
    }
    q.opts = opts.sort(function (x, y) {
      return order(x) - order(y);
    });
    return q;
  }

  function buildDeck() {
    nameQ = U.shuffle(KIDS.slice());
    var used = {};
    var q = [];
    function take(gen) {
      var it = null;
      for (var g = 0; g < 300; g++) {
        it = gen();
        if (!used[it.key]) break;
      }
      used[it.key] = true;
      return it;
    }
    // Level 1 (3): age next year, age in 2–3 years, years until an age limit.
    U.shuffle([
      function () {
        return genNext(1);
      },
      function () {
        return genNext(U.rand(2, 3));
      },
      genUntil,
    ]).forEach(function (g) {
      q.push(take(g));
    });
    // Level 2 (3): age in a later year, birth year from an age, days apart in one month.
    U.shuffle([genAgeIn, genBorn, genDaysSame]).forEach(function (g) {
      q.push(take(g));
    });
    // Level 3 (2): one two-step / waiting-together, one across-2000 / month-crossing.
    q.push(take(U.pick([genTwoStep, genWait2])));
    q.push(take(U.pick([genAcross, genDays31, genSibling])));
    return q;
  }

  /* ---------------- diagnosis ---------------- */
  function diag(q, v) {
    var d = function (tag, hint, strong) {
      return { tag: tag, hint: hint, strong: strong || hint };
    };
    var K = q.K || q.K1;
    switch (q.type) {
      case 'next':
        if (v === q.a) return d(TAG.noChange, 'That is ' + K.his + ' age in ' + q.Y + '. Each birthday adds 1 year.', q.Y + ' → ' + q.T + ' is ' + plural(q.n, 'birthday') + '. ' + q.a + ' + ' + q.n + ' = ?');
        if (v === q.a - q.n) return d(TAG.subtracted, K.He + ' gets OLDER. Count forwards, not back.', q.a + ' + ' + q.n + ' = ?');
        if (v === q.n) return d(TAG.yearsNotAge, 'That is how many years pass. How old is ' + K.he + ' then?', q.a + ' + ' + q.n + ' = ?');
        if (Math.abs(v - q.ans) === 1) return d(TAG.offByOne, 'Nearly! Hop one birthday at a time from ' + q.Y + ' to ' + q.T + '.', 'Count the hops: ' + q.Y + ' → ' + q.T + ' is ' + plural(q.n, 'year') + '. ' + q.a + ' + ' + q.n + ' = ?');
        return d(TAG.miscount, 'Start at ' + q.a + ' in ' + q.Y + '. Add 1 for each birthday.', q.a + ' + ' + q.n + ' = ?');
      case 'until':
        if (v === q.Lm + q.a) return d(TAG.added, 'Do not add the ages. How many birthdays from ' + q.a + ' up to ' + q.Lm + '?', q.Lm + ' − ' + q.a + ' = ?');
        if (v === q.Lm) return d(TAG.ageNotYears, q.Lm + ' is the age ' + K.he + ' needs. How many YEARS must ' + K.he + ' wait?', 'Count on from ' + q.a + ' to ' + q.Lm + '. ' + q.Lm + ' − ' + q.a + ' = ?');
        if (Math.abs(v - q.ans) === 1) return d(TAG.offByOne, 'Count the birthdays: ' + (q.a + 1) + ' is the first one.', 'Hop from ' + q.a + ' to ' + q.Lm + ', one birthday each hop. ' + q.Lm + ' − ' + q.a + ' = ?');
        return d(TAG.miscount, 'Count on from ' + q.a + ' to ' + q.Lm + '.', q.Lm + ' − ' + q.a + ' = ?');
      case 'ageIn':
        if (v > 1900) return d(v === q.T + q.B ? TAG.added : TAG.yearNotAge, 'The answer is an age, so it is a small number. How many years from ' + q.B + ' to ' + q.T + '?', 'Jump 10 years from ' + q.B + ' to ' + (q.B + 10) + ', then count the rest to ' + q.T + '.');
        if (v === q.ans + 1) return d(TAG.offByOne, 'In ' + q.B + ' ' + K.he + ' is a baby: age 0, not 1. Count the hops.', q.T + ' − ' + q.B + ' = ? Jump 10 to ' + (q.B + 10) + ', then ' + (q.T - q.B - 10) + ' more.');
        if (v === q.ans - 1) return d(TAG.offByOne, 'Nearly! Count every hop from ' + q.B + ' to ' + q.T + '.', q.T + ' − ' + q.B + ' = ? Jump 10 to ' + (q.B + 10) + ', then ' + (q.T - q.B - 10) + ' more.');
        return d(TAG.miscount, 'Jump 10 years from ' + q.B + ' first. Then count on to ' + q.T + '.', q.B + ' + 10 = ' + (q.B + 10) + '. From ' + (q.B + 10) + ' to ' + q.T + ' is ' + (q.T - q.B - 10) + ' more.');
      case 'born':
        if (v === q.Y + q.a) return d(TAG.added, K.He + ' was born BEFORE ' + q.Y + '. Count back, not on.', q.Y + ' − 10 = ' + (q.Y - 10) + '. Then go back ' + (q.a - 10) + ' more.');
        if (v < 100) return d(TAG.ageNotYear, 'The answer is a year, like ' + q.Y + '. Go back ' + q.a + ' years from ' + q.Y + '.', q.Y + ' − 10 = ' + (q.Y - 10) + '. Then go back ' + (q.a - 10) + ' more.');
        if (v === q.Y - 10 && q.a !== 10) return d(TAG.only10, 'Good jump of 10! Now go back the other ' + (q.a - 10) + '.', (q.Y - 10) + ' − ' + (q.a - 10) + ' = ?');
        if (Math.abs(v - q.ans) === 1) return d(TAG.offByOne, 'Nearly! Count the hops back again: ' + q.a + ' hops.', q.Y + ' − 10 = ' + (q.Y - 10) + '. Then ' + (q.Y - 10) + ' − ' + (q.a - 10) + ' = ?');
        return d(TAG.miscount, 'Go back ' + q.a + ' years from ' + q.Y + ': 10 first, then the rest.', q.Y + ' − 10 = ' + (q.Y - 10) + '. Then ' + (q.Y - 10) + ' − ' + (q.a - 10) + ' = ?');
      case 'twoStep':
        if (v === q.k) return d(TAG.yearsNotAge, q.k + ' is how many years pass. ' + K.He + ' was already ' + q.a + '!', q.a + ' + ' + q.k + ' = ?');
        if (v === q.Y - q.a) return d(TAG.birthYear, 'That is the year ' + K.he + ' was born. The question asks for an age.', q.Y + ' → ' + q.T + ' is ' + q.k + ' years. ' + q.a + ' + ' + q.k + ' = ?');
        if (v === q.a) return d(TAG.noChange, 'That is ' + K.his + ' age in ' + q.Y + '. How many birthdays until ' + q.T + '?', q.a + ' + ' + q.k + ' = ?');
        if (v === q.a - q.k) return d(TAG.subtracted, K.He + ' gets older. Add the years.', q.a + ' + ' + q.k + ' = ?');
        if (Math.abs(v - q.ans) === 1) return d(TAG.offByOne, 'Nearly! How many years from ' + q.Y + ' to ' + q.T + '? Count the hops.', q.T + ' − ' + q.Y + ' = ' + q.k + '. ' + q.a + ' + ' + q.k + ' = ?');
        return d(TAG.miscount, 'Step 1: how many years from ' + q.Y + ' to ' + q.T + '? Step 2: add them to ' + q.a + '.', q.T + ' − ' + q.Y + ' = ' + q.k + '. ' + q.a + ' + ' + q.k + ' = ?');
      case 'wait2':
        if (v === q.Lm - q.a2) return d(TAG.oneChild, 'Then ' + q.K2.name + ' can go. But is ' + q.K1.name + ' old enough? Both must be ' + q.Lm + '.', q.K1.name + ' is younger: ' + q.Lm + ' − ' + q.a1 + ' = ?');
        if (v === q.Lm - q.a1 + (q.Lm - q.a2)) return d(TAG.addedWaits, 'They grow older at the same time! Do not add the two waits.', 'Wait for the younger one: ' + q.Lm + ' − ' + q.a1 + ' = ?');
        if (Math.abs(v - q.ans) === 1) return d(TAG.offByOne, 'Move both children one year at a time until both are ' + q.Lm + '.', q.K1.name + ' needs ' + q.Lm + ' − ' + q.a1 + ' = ? years.');
        return d(TAG.miscount, 'Who is younger? That child has to wait longer.', q.K1.name + ' needs ' + q.Lm + ' − ' + q.a1 + ' = ? years.');
      case 'across':
        if (Math.abs(v - q.ans) === 1) return d(TAG.offByOne, 'Nearly! Count from ' + q.B1 + ' to 2000, then from 2000 to ' + q.B2 + '.', q.B1 + ' → 2000 is ' + (2000 - q.B1) + '. 2000 → ' + q.B2 + ' is ' + (q.B2 - 2000) + '. Add them.');
        return d(TAG.across2000, 'Stop at 2000 on the way. ' + q.B1 + ' → 2000, then 2000 → ' + q.B2 + '.', q.B1 + ' → 2000 is ' + (2000 - q.B1) + ' years. 2000 → ' + q.B2 + ' is ' + (q.B2 - 2000) + ' years. Add them.');
      case 'daysSame':
        if (v === q.n + 1) return d(TAG.bothDays, 'Count the hops from ' + q.a + ' to ' + q.b + ', not the days you touch.', q.b + ' − ' + q.a + ' = ?');
        if (v === q.a + q.b) return d(TAG.addedDates, 'Do not add the dates. How far is it from ' + q.a + ' to ' + q.b + '?', q.b + ' − ' + q.a + ' = ?');
        if (v === q.n - 1) return d(TAG.dayShort, 'Nearly! Count every hop from ' + q.a + ' to ' + q.b + '.', q.b + ' − ' + q.a + ' = ?');
        return d(TAG.dayMiscount, 'Count on from ' + q.a + ' to ' + q.b + ' on the day line.', q.b + ' − ' + q.a + ' = ?');
      case 'days31':
        var other = q.L === 31 ? 30 : 31;
        if (v === other) return d(TAG.monthLen, MONTHS[q.m] + ' has ' + q.L + ' days, not ' + other + '.', (q.L - q.d) + ' days to the end of ' + MONTHS[q.m] + ', then ' + q.d + ' more.');
        if (v === 1) return d(TAG.monthsNotDays, 'Yes, it is 1 month. How many DAYS is that?', (q.L - q.d) + ' days to the end of ' + MONTHS[q.m] + ', then ' + q.d + ' more.');
        if (v === q.L + 1) return d(TAG.bothDays, 'Count the hops, not both birthdays.', (q.L - q.d) + ' days to the end of ' + MONTHS[q.m] + ', then ' + q.d + ' more.');
        if (v === q.L - q.d) return d(TAG.dayShort, 'That gets you to ' + q.L + ' ' + MONTHS[q.m] + '. Keep going into ' + MONTHS[q.m2] + '.', (q.L - q.d) + ' + ' + q.d + ' = ?');
        return d(TAG.dayMiscount, 'How many days are left in ' + MONTHS[q.m] + ' after day ' + q.d + '? Then add the days in ' + MONTHS[q.m2] + '.', (q.L - q.d) + ' days to the end of ' + MONTHS[q.m] + ', then ' + q.d + ' more.');
      case 'sibling':
        var first = q.L - q.d;
        var s = 'From ' + q.d + ' ' + MONTHS[q.m] + ', ' + first + ' hops reach ' + q.L + ' ' + MONTHS[q.m] + '. Then ' + (q.N - first) + ' more into ' + MONTHS[q.m2] + '.';
        if (v === q.m * 100 + q.d + q.N) return d(TAG.monthLen, 'There is no ' + (q.d + q.N) + ' ' + MONTHS[q.m] + '! ' + MONTHS[q.m] + ' has only ' + q.L + ' days.', s);
        if (v === q.ans - 1 || v === q.m * 100 + q.L) return d(TAG.startDay, 'Did you count ' + q.d + ' ' + MONTHS[q.m] + ' as day 1? Start on the next day.', s);
        if (v === q.ans + 1) return d(TAG.dayExtra, 'One day too many. ' + MONTHS[q.m] + ' has ' + q.L + ' days.', s);
        return d(TAG.dayMiscount, s, s);
    }
    return d(TAG.miscount, 'Try again.', 'Try again.');
  }

  /* ---------------- practice drawing ---------------- */
  function sayFor(q) {
    if (q.type === 'wait2') return 'Both must be old enough!';
    if (q.type === 'across') return 'Stop at 2000 on the way.';
    if (q.type === 'born') return 'Count back. 10 first, then the rest.';
    if (q.type === 'daysSame' || q.type === 'days31') return 'Count the hops on the day line.';
    if (q.type === 'sibling') return 'Watch out for the end of the month!';
    if (q.type === 'twoStep') return 'Two steps: years first, then the age.';
    if (q.type === 'until') return 'One birthday at a time.';
    return 'Each birthday adds one year.';
  }

  function picture(q) {
    var P = { side: null };
    var L;
    if (q.type === 'next' || q.type === 'twoStep') {
      L = yearLine(q.Y - 1, q.T + (q.type === 'next' ? 2 : 1), [q.Y, q.T]);
      P.fig = L.fig(0, L.ix(q.Y), { age: q.a, color: 0 });
      P.flag = L.flag(L.ix(q.T));
    } else if (q.type === 'until') {
      L = yearLine(q.Y - 1, q.Y + q.ans + 2, [q.Y]);
      P.fig = L.fig(0, L.ix(q.Y), { age: q.a, color: 2 });
      P.side = sign(q.P[0] + ':', q.Lm);
    } else if (q.type === 'ageIn') {
      L = yearLine(q.B - 1, q.T + 1, [q.B, q.T]);
      P.fig = L.fig(0, L.ix(q.B), { age: 0, color: 1 });
      P.flag = L.flag(L.ix(q.T));
    } else if (q.type === 'born') {
      L = yearLine(q.B - q.pad, q.Y + 1, [q.Y]);
      P.fig = L.fig(0, L.ix(q.Y), { age: q.a, color: 0 });
    } else if (q.type === 'wait2') {
      L = yearLine(q.Y, q.Y + q.ans + 1, [q.Y], 2);
      P.figs = [L.fig(0, 0, { age: q.a1, name: q.K1.name, color: 2 }), L.fig(1, 0, { age: q.a2, name: q.K2.name, color: 1 })];
      P.side = sign(q.P[0] + ':', q.Lm);
    } else if (q.type === 'across') {
      L = yearLine(q.B1 - 1, q.B2 + 1, [q.B1, 2000, q.B2], 2);
      L.cake(0, L.ix(q.B1), q.K1.name + ' born');
      L.cake(1, L.ix(q.B2), q.K2.name + ' born');
    } else if (q.type === 'daysSame') {
      L = dayLine([{ m: q.m, from: Math.max(1, q.a - 2), to: Math.min(MLEN[q.m], q.b + 2) }]);
      L.cake(0, L.ix(q.m, q.a), q.K1.name);
      L.cake(0, L.ix(q.m, q.b), q.K2.name);
    } else if (q.type === 'days31') {
      L = dayLine([{ m: q.m, from: q.d - 1, to: q.L }, { m: q.m2, from: 1, to: q.d + 1 }]);
      L.cake(0, L.ix(q.m, q.d), q.K1.name);
      L.cake(0, L.ix(q.m2, q.d), q.K2.name);
    } else if (q.type === 'sibling') {
      L = dayLine([{ m: q.m, from: q.d - 1, to: q.L }, { m: q.m2, from: 1, to: q.e + 2 }]);
      L.cake(0, L.ix(q.m, q.d), q.K1.name);
    }
    P.L = L;
    return P;
  }

  /** Reveal animation + one line of working. Returns the line. */
  function revealWork(api, q, P, work) {
    var L = P.L;
    var line;
    if (q.type === 'next' || q.type === 'twoStep') {
      if (P.flag) P.flag.style.display = 'none';
      yearHops(api, L, 0, q.Y, q.T, {
        labelFn: function (k) {
          return q.a + k;
        },
        onLand: function (y, k) {
          P.fig.moveTo(L.ix(y));
          P.fig.age(q.a + k);
        },
      });
      L.mark(L.ix(q.T));
      var k = q.T - q.Y;
      line = q.Y + ' → ' + q.T + ' is ' + plural(k, 'year') + '. ' + q.a + ' + ' + k + ' = ' + q.ans + ' years old.';
      work.appendChild(chipsRow([q.a, '+', k, '=', q.ans + ' years old']));
    } else if (q.type === 'until') {
      yearHops(api, L, 0, q.Y, q.Y + q.ans, {
        labelFn: function (k) {
          return q.a + k;
        },
        onLand: function (y, k) {
          P.fig.moveTo(L.ix(y));
          P.fig.age(q.a + k);
          P.fig.ok(q.a + k >= q.Lm);
        },
      });
      line = 'From ' + q.a + ' to ' + q.Lm + ' is ' + plural(q.ans, 'birthday') + ': ' + q.Lm + ' − ' + q.a + ' = ' + plural(q.ans, 'year') + '.';
      work.appendChild(chipsRow([q.Lm, '−', q.a, '=', plural(q.ans, 'year')]));
    } else if (q.type === 'ageIn') {
      if (P.flag) P.flag.style.display = 'none';
      yearHops(api, L, 0, q.B, q.T, {
        onLand: function (y, k) {
          P.fig.moveTo(L.ix(y));
          P.fig.age(k);
        },
      });
      L.mark(L.ix(q.B + 10));
      var rest = q.ans - 10;
      line = q.B + ' + 10 = ' + (q.B + 10) + ', then ' + rest + ' more to ' + q.T + '. 10 + ' + rest + ' = ' + q.ans + ' years old.';
      work.appendChild(chipsRow([q.B, '→', q.B + 10, '→', q.T, '=', '10 + ' + rest, '=', q.ans]));
    } else if (q.type === 'born') {
      yearHops(api, L, 0, q.Y, q.B, {
        onLand: function (y, k) {
          P.fig.moveTo(L.ix(y));
          P.fig.age(q.a - k);
        },
      });
      L.mark(L.ix(q.B));
      L.mark(L.ix(q.Y - 10));
      line = q.Y + ' − 10 = ' + (q.Y - 10) + ', then ' + (q.Y - 10) + ' − ' + (q.a - 10) + ' = ' + q.B + '. Born in ' + q.B + '.';
      work.appendChild(chipsRow([q.Y, '−', 10, '=', q.Y - 10, '→', q.Y - 10, '−', q.a - 10, '=', q.B]));
    } else if (q.type === 'wait2') {
      var kids = [[q.a1, P.figs[0]], [q.a2, P.figs[1]]];
      kids.forEach(function (c, lane) {
        yearHops(api, L, lane, q.Y, q.Y + q.ans, {
          labelFn: function (k) {
            return c[0] + k;
          },
          onLand: function (y, k) {
            c[1].moveTo(L.ix(y));
            c[1].age(c[0] + k);
            c[1].ok(c[0] + k >= q.Lm);
          },
        });
      });
      line = q.K1.name + ' needs ' + q.Lm + ' − ' + q.a1 + ' = ' + (q.Lm - q.a1) + ', ' + q.K2.name + ' needs ' + q.Lm + ' − ' + q.a2 + ' = ' + (q.Lm - q.a2) + '. Both: wait ' + plural(q.ans, 'year') + '.';
      work.appendChild(chipsRow([q.K1.name + ': ' + plural(q.Lm - q.a1, 'year'), q.K2.name + ': ' + plural(q.Lm - q.a2, 'year'), '→', 'Both: ' + plural(q.ans, 'year')]));
    } else if (q.type === 'across') {
      var p1 = 2000 - q.B1;
      var p2 = q.B2 - 2000;
      L.arc(0, L.ix(q.B1), L.ix(2000), '+' + p1, 0, 'bdy-hop-ten');
      L.arc(0, L.ix(2000), L.ix(q.B2), '+' + p2, 600, 'bdy-hop-b');
      L.mark(L.ix(2000));
      line = q.B1 + ' → 2000 is ' + p1 + ', 2000 → ' + q.B2 + ' is ' + p2 + '. ' + p1 + ' + ' + p2 + ' = ' + q.ans + ' years older.';
      work.appendChild(chipsRow([q.B1 + ' → 2000 = ' + p1, '+', '2000 → ' + q.B2 + ' = ' + p2, '=', plural(q.ans, 'year')]));
    } else if (q.type === 'daysSame') {
      for (var i = 1; i <= q.n; i++) L.arc(0, L.ix(q.m, q.a + i - 1), L.ix(q.m, q.a + i), i, i * 160, 'bdy-hop-one');
      line = 'Count the hops from ' + q.a + ' to ' + q.b + ': ' + q.b + ' − ' + q.a + ' = ' + q.n + ' days.';
      work.appendChild(chipsRow([q.b, '−', q.a, '=', q.n + ' days']));
    } else if (q.type === 'days31') {
      var f = q.L - q.d;
      L.arc(0, L.ix(q.m, q.d), L.ix(q.m, q.L), '+' + f, 0, 'bdy-hop-ten');
      L.arc(0, L.ix(q.m, q.L), L.ix(q.m2, q.d), '+' + q.d, 600, 'bdy-hop-b');
      L.mark(L.ix(q.m, q.L));
      line = f + ' days left in ' + MONTHS[q.m] + ' (it has ' + q.L + '), then ' + q.d + ' in ' + MONTHS[q.m2] + '. ' + f + ' + ' + q.d + ' = ' + q.L + ' days.';
      work.appendChild(chipsRow([f + ' in ' + MONTHS[q.m], '+', q.d + ' in ' + MONTHS[q.m2], '=', q.L + ' days']));
    } else if (q.type === 'sibling') {
      var a = q.L - q.d;
      var pos = L.ix(q.m, q.d);
      for (var j = 1; j <= q.N; j++) L.arc(0, pos + j - 1, pos + j, j, j * 170, j <= a ? 'bdy-hop-one' : 'bdy-hop-b');
      L.cake(0, L.ix(q.m2, q.e), q.K2.name);
      L.mark(L.ix(q.m2, q.e));
      line = q.d + ' ' + MONTHS[q.m] + ' + ' + a + ' = ' + q.L + ' ' + MONTHS[q.m] + ', then ' + (q.N - a) + ' more = ' + q.e + ' ' + MONTHS[q.m2] + '.';
      work.appendChild(chipsRow([a + ' to ' + q.L + ' ' + MONTHS[q.m], '+', q.N - a + ' in ' + MONTHS[q.m2], '=', q.e + ' ' + MONTHS[q.m2]]));
    }
    return line;
  }

  function renderQ(stage, api, q) {
    api.say(sayFor(q), 'think');
    stage.appendChild(el('div', { class: 'bdy-q' }, MQ.ui.prompt(q.text)));
    var P = picture(q);
    var lineBox = el('div', { class: 'bdy-linebox' }, P.L.svg);
    lineBox.setAttribute('data-answer', String(q.ans));
    lineBox.setAttribute('data-type', q.type);
    stage.appendChild(P.side ? el('div', { class: 'bdy-row' }, P.side, lineBox) : lineBox);
    if (q.type !== 'sibling' && q.type !== 'daysSame' && q.type !== 'days31') {
      stage.appendChild(el('div', { class: 'bdy-rule' }, 'Ages are on the birthday in that year. A baby is ', el('b', null, '0'), ' in the year they are born.'));
    }
    var work = el('div', { class: 'bdy-work' });
    var finished = false;

    function wrong(v) {
      var dg = diag(q, v);
      api.check(false, api.tries() >= 1 ? dg.strong : dg.hint, dg.tag);
    }

    if (q.type === 'sibling') {
      var ch = MQ.ui.choices(q.opts.map(function (o) {
        return { label: o.t, value: o.v };
      }), function (v) {
        if (finished) return;
        if (v === q.ans) {
          finished = true;
          ch.mark(v, 'good');
          ch.disable();
          api.check(true, q.e + ' ' + MONTHS[q.m2] + '! You crossed the end of ' + MONTHS[q.m] + '.');
          return;
        }
        ch.mark(v, 'bad');
        wrong(v);
      }, { columns: 4 });
      ch.classList.add('bdy-choices');
      stage.appendChild(ch);
      stage.appendChild(work);
      api.onReveal(function () {
        finished = true;
        ch.mark(q.ans, 'good');
        ch.disable();
        api.feedback(revealWork(api, q, P, work), 'info');
      });
      return;
    }

    var box = MQ.ui.numberInput({
      unit: q.unit,
      placeholder: q.type === 'born' ? 'year' : '?',
      onSubmit: function (v) {
        if (finished) return;
        if (v !== Math.floor(v) || v < 0) {
          api.feedback('Type a whole number.', 'info');
          return;
        }
        if (v === q.ans) {
          finished = true;
          box.good();
          box.disable();
          var praise = q.type === 'born' ? 'Born in ' + q.ans + '! ' : q.unit === 'days' ? q.ans + ' days! ' : q.unit === 'years old' ? q.ans + ' years old! ' : plural(q.ans, 'year') + '! ';
          api.check(true, praise + 'Well counted.');
          return;
        }
        box.bad();
        wrong(v);
      },
    });
    stage.appendChild(box.el);
    stage.appendChild(work);
    box.focus();
    api.onReveal(function () {
      finished = true;
      box.setValue(String(q.ans));
      box.good();
      box.disable();
      api.feedback(revealWork(api, q, P, work), 'info');
    });
  }

  var deck = null;

  MQ.register(ID, {
    learn: [learnBirthdays, learnBack, learnWait],
    practice: {
      count: COUNT,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        renderQ(stage, api, deck[api.index]);
      },
    },
  });

  // Harmless hooks for automated tests (no effect on the page).
  MQ._bdy = { buildDeck: buildDeck, diag: diag, MLEN: MLEN, deck: function () { return deck; } };

  var css = [
    '.bdy-linebox{width:100%;max-width:820px}',
        '.bdy-row{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.bdy-line{display:block;width:100%;height:auto;user-select:none;-webkit-user-select:none}',
    '.bdy-paper{fill:#fff;stroke:#c9d3ee;stroke-width:2}',
    '.bdy-axis{stroke:#1b2a4a;stroke-width:3;stroke-linecap:round}',
    '.bdy-arrowhead{fill:#1b2a4a}',
    '.bdy-guide{stroke:#c9d3ee;stroke-width:2;stroke-dasharray:6 5}',
    '.bdy-tick{stroke:#1b2a4a;stroke-width:2}',
    '.bdy-tick-key{stroke:#e8590c;stroke-width:3}',
    '.bdy-lab{fill:#4a5a7d;font-size:14px;font-weight:800;font-family:var(--font)}',
    '.bdy-lab-sm{font-size:12.5px}',
    '.bdy-lab-key{fill:#1b2a4a;font-size:15px;font-weight:900}',
    '.bdy-lab-hit{fill:#2b9348;font-weight:900}',
    '.bdy-month{fill:#1d5fc9;font-size:14px;font-weight:900;font-family:var(--font)}',
    '.bdy-sep{stroke:#9db8ef;stroke-width:2;stroke-dasharray:4 4}',
    '.bdy-hop{animation:bdy-pop .35s ease both}',
    '.bdy-arc{fill:none;stroke-width:3;stroke-linecap:round}',
    '.bdy-hop-one .bdy-arc{stroke:#e8590c}',
    '.bdy-hop-ten .bdy-arc{stroke:#1d5fc9;stroke-width:4}',
    '.bdy-hop-b .bdy-arc{stroke:#7b2cbf;stroke-width:3.5}',
    '.bdy-arclab{fill:#1b2a4a;font-size:13px;font-weight:900;font-family:var(--font);paint-order:stroke;stroke:#fff;stroke-width:4px}',
    '.bdy-arclab-sm{font-size:12px}',
    '.bdy-hop-ten .bdy-arclab{fill:#1d5fc9;font-size:16px}',
    '.bdy-hop-b .bdy-arclab{fill:#7b2cbf;font-size:15px}',
    '.bdy-flag circle{fill:#fff8e1;stroke:#e0a800;stroke-width:2.5;stroke-dasharray:4 3}',
    '.bdy-flag text{fill:#8a6400;font-size:15px;font-weight:900;font-family:var(--font)}',
    '.bdy-fig{transition:transform .35s ease}',
    '.bdy-leg{stroke:#1b2a4a;stroke-width:4;stroke-linecap:round}',
    '.bdy-head{fill:#f6d2b3;stroke:#1b2a4a;stroke-width:2}',
    '.bdy-body{stroke:#1b2a4a;stroke-width:2}',
    '.bdy-c0 .bdy-body{fill:#ff9f1c}',
    '.bdy-c1 .bdy-body{fill:#2f6fde}',
    '.bdy-c2 .bdy-body{fill:#e05297}',
    '.bdy-badge circle{fill:#1b2a4a;stroke:#fff;stroke-width:2}',
    '.bdy-badge text{fill:#fff;font-size:16px;font-weight:900;font-family:var(--font)}',
    '.bdy-fig-ok .bdy-badge circle{fill:#2b9348}',
    '.bdy-bump{animation:bdy-pop .3s ease}',
    '.bdy-figname{fill:#1b2a4a;font-size:14px;font-weight:900;font-family:var(--font)}',
    '.bdy-cakeicon{font-size:24px}',
    '@keyframes bdy-pop{from{opacity:0}to{opacity:1}}',
    '.bdy-controls{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:center}',
    '.bdy-btn{font-size:1.15rem;min-width:190px}',
    '.bdy-btn-2{background:#7b2cbf}',
    '.bdy-big{font-size:1.4rem;font-weight:800;text-align:center;min-width:220px}',
    '.bdy-sign{display:flex;flex-wrap:wrap;gap:4px 12px;align-items:baseline;justify-content:center;background:#fff8e1;border:3px solid #e0a800;border-radius:14px;padding:6px 16px;text-align:center}',
    '.bdy-sign-t{font-weight:800;font-size:1.05rem;color:#6b4e00}',
    '.bdy-sign-n{font-weight:900;font-size:1.25rem;color:#1b2a4a}',
    '.bdy-rule{font-size:.98rem;color:var(--ink-soft);text-align:center}',
    '.bdy-q .prompt{font-size:1.25rem}',
    '.bdy-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center}',
    '.bdy-chip{display:inline-block;border-radius:10px;padding:3px 10px;font-weight:800;font-size:1.05rem;background:#fff1e6;color:#8a3200;border:2px solid #f3a77a;animation:bdy-in .25s ease both}',
    '.bdy-op{font-weight:900;font-size:1.1rem}',
    '@keyframes bdy-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}',
    '.bdy-work{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%}',
    '.bdy-work:empty{display:none}',
    '.bdy-choices{max-width:620px;width:100%}',
    '@media (max-width:640px){.bdy-choices{grid-template-columns:repeat(2,minmax(0,1fr))!important}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

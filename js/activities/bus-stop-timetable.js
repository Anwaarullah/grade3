/* Bus Stop Timetable — read bus, train and flight timetables: follow one bus down its
 * column, read a stop's row, spot '–' (does not stop), and pick the bus that gets you
 * there on time (Unit 14.2).
 * Times are minutes after midnight (7:30 a.m. = 450, 1:05 p.m. = 785), shown as 12-hour
 * h:mm with no a.m./p.m. A timetable is { kind, title, stops[], veh[], t[veh][stop] }
 * where t is a time or null ('–', the vehicle does not stop there). Within a vehicle the
 * times always go up from stop to stop. orient 'col' = one vehicle per column,
 * 'row' = one vehicle per row.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  var ID = 'bus-stop-timetable';

  var TAG = {
    swapCol: 'Read across a row instead of down a column',
    swapRow: 'Read down a column instead of across a row',
    wrongBus: 'Read the time for the wrong bus',
    wrongStop: 'Read the time at the wrong stop',
    leave: 'Gave the time you leave, not the time you arrive',
    dash: "Treated '–' as a time",
    stopsThere: 'Chose a bus that does stop there',
    skip: 'Picked a bus that skips the stop',
    first: 'Thought the first bus to leave arrives first',
    late: 'Picked a bus that arrives too late',
    missedOne: 'Missed a bus that is on time',
    exact: 'Arrived exactly on the deadline and called it before',
    earliestOnTime: 'Picked the earliest bus, not the latest on-time one',
    notEarliest: 'Did not pick the earliest one',
    gone: 'Picked one that had already gone',
    notNext: 'Skipped over the next one',
    pm: 'Thought 1:05 is earlier than 12:05',
    count: 'Counted the stops wrongly',
  };

  /* ---------------- time helpers ---------------- */
  function pad(m) {
    return (m < 10 ? '0' : '') + m;
  }
  function h12(t) {
    return Math.floor(t / 60) % 12 || 12;
  }
  function lab(t) {
    return h12(t) + ':' + pad(t % 60);
  }
  function labAP(t) {
    return lab(t) + (t < 720 ? ' a.m.' : ' p.m.');
  }

  /* ---------------- names ---------------- */
  var BUS_STOPS = ['Park Gate', 'Library', 'Market', 'Station', 'Pond Lane', 'Hill Road', 'Town Hall', 'Bakery', 'Sports Centre', 'Post Office', 'Garden Centre', 'Museum', 'Swimming Pool', 'Bridge Street'];
  var STATIONS = ['Riverside', 'Oak Hill', 'Green Bridge', 'Mill Town', 'Seaview', 'Westford', 'Kingsley', 'Brookfield', 'Ashby', 'Lakeside'];
  function word(kind) {
    return kind === 'train' ? 'train' : kind === 'flight' ? 'flight' : 'bus';
  }
  function Word(kind) {
    var w = word(kind);
    return w.charAt(0).toUpperCase() + w.slice(1);
  }
  function plural(kind) {
    return kind === 'bus' ? 'buses' : word(kind) + 's';
  }
  function place(kind) {
    return kind === 'train' ? 'station' : 'stop';
  }

  /* ---------------- timetable generator ---------------- */
  /** Random timetable: departures 7:30 onwards, every stop shared route lengths with a per-vehicle
   * speed, '–' with probability dashP (never at the first stop). Returns null if out of range. */
  function genTable(kind, stops, nVeh, dashP) {
    var n = stops.length;
    var base = [];
    for (var i = 1; i < n; i++) base.push(kind === 'train' ? U.rand(8, 16) : U.rand(5, 12));
    var t = [];
    var dep = 450 + U.rand(0, 20);
    for (var v = 0; v < nVeh; v++) {
      if (v > 0) dep += U.rand(8, 20);
      var f = 0.75 + Math.random() * 0.55;
      var row = [dep];
      var cur = dep;
      for (var s = 1; s < n; s++) {
        var seg = Math.max(3, Math.round(base[s - 1] * f));
        var skip = Math.random() < dashP;
        if (skip) seg = Math.max(2, seg - 2); // no stopping: a little quicker
        cur += seg;
        row.push(skip ? null : cur);
      }
      t.push(row);
    }
    var tt = { kind: kind, stops: stops, veh: t.map(function (r, k) { return Word(kind) + ' ' + (k + 1); }), t: t, orient: 'col' };
    return valid(tt) ? tt : null;
  }

  /** Times 7:30–10:00, strictly increasing along each vehicle, all different, at least two stops each,
   * vehicles in order of leaving the first stop. */
  function valid(tt) {
    var seen = {};
    for (var v = 0; v < tt.t.length; v++) {
      var row = tt.t[v];
      if (row[0] == null) return false;
      if (v > 0 && row[0] <= tt.t[v - 1][0]) return false;
      var last = -1;
      var cnt = 0;
      for (var s = 0; s < row.length; s++) {
        var x = row[s];
        if (x == null) continue;
        if (x < 450 || x > 600 || x <= last || seen[x]) return false;
        seen[x] = true;
        last = x;
        cnt++;
      }
      if (cnt < 2) return false;
    }
    return true;
  }

  function busStops(n, schoolAt) {
    var names = U.shuffle(BUS_STOPS).slice(0, schoolAt == null ? n : n - 1);
    if (schoolAt != null) names.splice(schoolAt, 0, 'School');
    return names;
  }
  function stopNames(kind, n, schoolAt) {
    return kind === 'train' ? U.shuffle(STATIONS).slice(0, n) : busStops(n, schoolAt);
  }
  function stoppers(tt, a, b) {
    var out = [];
    for (var v = 0; v < tt.t.length; v++) if (tt.t[v][a] != null && tt.t[v][b] != null) out.push(v);
    return out;
  }

  /* ---------------- question makers ---------------- */
  function mkArrive(orient) {
    for (var g = 0; g < 5000; g++) {
      var tt = genTable('bus', busStops(3, Math.random() < 0.4 ? 2 : null), 3, 0);
      if (!tt) continue;
      tt.orient = orient;
      var s = U.pick([1, 2]);
      var b = U.pick([0, 1, 2].filter(function (x) { return x !== s; }));
      var want = tt.t[b][s];
      var cands = [{ t: tt.t[s][b], tag: orient === 'col' ? TAG.swapCol : TAG.swapRow }];
      U.shuffle([0, 1, 2]).forEach(function (o) { if (o !== b) cands.push({ t: tt.t[o][s], tag: TAG.wrongBus }); });
      U.shuffle([0, 1, 2]).forEach(function (o) { if (o !== s) cands.push({ t: tt.t[b][o], tag: TAG.wrongStop }); });
      var opts = pickOpts(want, [cands[0], cands[1], cands.filter(function (c) { return c.tag === TAG.wrongStop; })[0]].concat(cands));
      return { type: 'arrive', tt: tt, v: b, s: s, ans: want, opts: opts };
    }
    return null;
  }

  /** Up to 4 distinct times: the answer plus tagged distractors, sorted. */
  function pickOpts(want, cands) {
    var seen = {};
    seen[want] = true;
    var out = [{ t: want, tag: null }];
    cands.forEach(function (c) {
      if (out.length < 4 && c && c.t != null && !seen[c.t]) {
        seen[c.t] = true;
        out.push(c);
      }
    });
    return out.sort(function (x, y) { return x.t - y.t; });
  }

  function mkRide() {
    for (var g = 0; g < 5000; g++) {
      var n = U.rand(4, 5);
      var sc = U.rand(2, n - 1);
      var tt = genTable('bus', busStops(n, sc), U.rand(4, 5), 0.18);
      if (!tt) continue;
      var a = U.pick([0, 0, 1].filter(function (x) { return x < sc - 1 || x === 0; }));
      var vs = stoppers(tt, a, sc);
      if (!vs.length) continue;
      var v = U.pick(vs);
      var want = tt.t[v][sc];
      var cands = [];
      U.shuffle(U.range(0, tt.t.length - 1)).forEach(function (o) { if (o !== v) cands.push({ t: tt.t[o][sc], tag: TAG.swapCol }); });
      var near = [];
      if (sc + 1 < n) near.push({ t: tt.t[v][sc + 1], tag: TAG.wrongStop });
      if (sc - 1 > a) near.push({ t: tt.t[v][sc - 1], tag: TAG.wrongStop });
      var bus = cands.filter(function (c) { return c.t != null; });
      var stopC = near.filter(function (c) { return c.t != null; });
      if (!bus.length) continue;
      var opts = pickOpts(want, [bus[0], stopC[0], { t: tt.t[v][a], tag: TAG.leave }].concat(bus, stopC));
      if (opts.length < 4) continue;
      return { type: 'ride', tt: tt, v: v, a: a, s: sc, ans: want, opts: opts };
    }
    return null;
  }

  function mkNoStop() {
    var kind = U.pick(['bus', 'train']);
    for (var g = 0; g < 5000; g++) {
      var n = U.rand(4, 5);
      var nv = U.rand(4, 6);
      var tt = genTable(kind, stopNames(kind, n, null), nv, 0.25);
      if (!tt) continue;
      var x = U.rand(1, n - 1);
      var ans = [];
      for (var v = 0; v < nv; v++) if (tt.t[v][x] == null) ans.push(v);
      if (ans.length < 1 || ans.length > 3 || ans.length > nv - 2) continue;
      var mode = Math.random() < 0.65 ? 'which' : 'count';
      return { type: 'nostop', mode: mode, tt: tt, x: x, ans: mode === 'which' ? ans : nv - ans.length, dashes: ans };
    }
    return null;
  }

  function mkEarliest() {
    for (var g = 0; g < 5000; g++) {
      var n = U.rand(4, 5);
      var tt = genTable('train', stopNames('train', n), U.rand(4, 5), 0.25);
      if (!tt) continue;
      tt.orient = 'row';
      var a = U.rand(0, n - 2);
      var b = U.rand(a + 1, n - 1);
      var atA = [];
      for (var v = 0; v < tt.t.length; v++) if (tt.t[v][a] != null) atA.push(v);
      if (!atA.length) continue;
      var first = atA.reduce(function (m, v2) { return tt.t[v2][a] < tt.t[m][a] ? v2 : m; });
      if (tt.t[first][b] != null) continue; // the trap: the first to leave A skips B
      var c = stoppers(tt, a, b);
      if (c.length < 2) continue;
      var ans = c.reduce(function (m, v2) { return tt.t[v2][a] < tt.t[m][a] ? v2 : m; });
      if (c.some(function (v2) { return tt.t[v2][b] < tt.t[ans][b]; })) continue; // leaving first must also mean arriving first
      return { type: 'earliest', tt: tt, a: a, b: b, ans: ans, first: first };
    }
    return null;
  }

  /** Shift a whole vehicle by d minutes (keeps it increasing). */
  function shifted(tt, v, d) {
    var c = { kind: tt.kind, stops: tt.stops, veh: tt.veh, orient: tt.orient, t: tt.t.map(function (r) { return r.slice(); }) };
    c.t[v] = c.t[v].map(function (x) { return x == null ? null : x + d; });
    return c;
  }

  /** Split the vehicles for "from a, reach s by/before D". */
  function sortOut(tt, a, s, D, strict) {
    var r = { on: [], late: [], skip: [], exact: [] };
    for (var v = 0; v < tt.t.length; v++) {
      var A = tt.t[v][a];
      var B = tt.t[v][s];
      if (A == null || B == null) r.skip.push(v);
      else if (strict ? B < D : B <= D) r.on.push(v);
      else r.late.push(v);
      if (A != null && B === D) r.exact.push(v);
    }
    return r;
  }
  function overtaken(tt, a, r) {
    return r.late.some(function (L) {
      return r.on.some(function (O) { return tt.t[L][a] < tt.t[O][a]; });
    });
  }

  var DEADLINES = [495, 510, 525, 540, 555, 570]; // 8:15 … 9:30

  function mkDeadline() {
    var strict = Math.random() < 0.5;
    for (var g = 0; g < 20000; g++) {
      var n = U.rand(4, 5);
      var sc = U.rand(2, n - 1);
      var base = genTable('bus', busStops(n, sc), U.rand(4, 5), 0.22);
      if (!base) continue;
      var a = U.pick([0, 1].filter(function (x) { return x <= sc - 2; }));
      // Every way to set the deadline for this table (strict: shift one bus to arrive exactly on it).
      var tries = [];
      if (strict) {
        stoppers(base, a, sc).forEach(function (e) {
          var arr = base.t[e][sc];
          var D0 = Math.round(arr / 15) * 15;
          if (DEADLINES.indexOf(D0) >= 0) tries.push({ tt: shifted(base, e, D0 - arr), D: D0 });
        });
      } else DEADLINES.forEach(function (D1) { tries.push({ tt: base, D: D1 }); });
      tries = U.shuffle(tries);
      for (var k = 0; k < tries.length; k++) {
        var tt = tries[k].tt;
        var D = tries[k].D;
        if (!valid(tt)) continue;
        var r = sortOut(tt, a, sc, D, strict);
        if (r.on.length < 1 || r.on.length > 3 || r.late.length < 1 || r.skip.length < 1) continue;
        if (strict ? r.exact.length !== 1 : r.exact.length !== 0) continue;
        if (!overtaken(tt, a, r)) continue;
        return { type: 'deadline', tt: tt, a: a, s: sc, D: D, strict: strict, ans: r.on, split: r };
      }
    }
    return null;
  }

  function mkBest() {
    for (var g = 0; g < 20000; g++) {
      var n = U.rand(4, 5);
      var sc = U.rand(2, n - 1);
      var tt = genTable('bus', busStops(n, sc), U.rand(4, 5), 0.22);
      if (!tt) continue;
      var a = U.pick([0, 1].filter(function (x) { return x <= sc - 2; }));
      var D = U.pick(DEADLINES);
      var r = sortOut(tt, a, sc, D, false);
      if (r.on.length < 2 || r.late.length < 1 || r.skip.length < 1 || r.exact.length) continue;
      var best = r.on.reduce(function (m, v) { return tt.t[v][a] > tt.t[m][a] ? v : m; });
      var lastIn = r.on.reduce(function (m, v) { return tt.t[v][sc] > tt.t[m][sc] ? v : m; });
      if (best !== lastIn) continue;
      return { type: 'best', tt: tt, a: a, s: sc, D: D, ans: best, split: r };
    }
    return null;
  }

  function mkMissed() {
    var kind = U.pick(['bus', 'train']);
    for (var g = 0; g < 20000; g++) {
      var n = 5;
      var nv = U.rand(5, 6);
      var tt = genTable(kind, stopNames(kind, n, null), nv, 0.1);
      if (!tt) continue;
      var x = U.rand(1, 3);
      var m = U.rand(0, nv - 3);
      tt.t[m + 1][x] = null;
      if (!valid(tt)) continue;
      if (tt.t[m][x] == null || tt.t[m + 2][x] == null) continue;
      var col = [];
      for (var v = 0; v < nv; v++) if (tt.t[v][x] != null) col.push(tt.t[v][x]);
      if (col.some(function (y, i) { return i > 0 && y <= col[i - 1]; })) continue; // no overtaking at this stop
      return { type: 'missed', tt: tt, x: x, m: m, T: tt.t[m][x], ans: m + 2 };
    }
    return null;
  }

  function mkFlight() {
    for (var g = 0; g < 5000; g++) {
      var am1 = U.rand(370, 560);
      var am2 = U.rand(am1 + 30, 650);
      var mm = U.rand(0, 40);
      var noon = 720 + mm;
      var one = 780 + mm;
      var late = U.rand(840, 990);
      var offs = [am1, am2, noon, one, late];
      var lands = offs.map(function (o) { return o + U.rand(30, 55); });
      var labels = offs.concat(lands).map(lab);
      if (labels.some(function (l, i) { return labels.indexOf(l) !== i; })) continue;
      var mode = Math.random() < 0.5 ? 'a' : 'b';
      var T = mode === 'a' ? U.rand(Math.max(am2 + 8, 665), 714) : U.rand(noon + 6, 775);
      if (T >= (mode === 'a' ? noon : one) || T <= (mode === 'a' ? am2 : noon)) continue;
      var order = U.shuffle([0, 1, 2, 3, 4]); // row k shows flight order[k]
      var t = order.map(function (i) { return [offs[i], lands[i]]; });
      var tt = { kind: 'flight', title: 'Flights today', stops: ['Takes off', 'Lands'], veh: ['Flight A', 'Flight B', 'Flight C', 'Flight D', 'Flight E'], t: t, orient: 'row' };
      var ans = order.indexOf(mode === 'a' ? 2 : 3);
      return { type: 'flight', mode: mode, tt: tt, T: T, ans: ans, roles: order.map(function (i) { return ['am', 'am', 'noon', 'one', 'late'][i]; }) };
    }
    return null;
  }

  /* ---------------- the deck ---------------- */
  var deck = null;

  function keyOf(q) {
    return q.type + '|' + q.tt.stops.join(',') + '|' + JSON.stringify(q.tt.t);
  }

  function buildDeck() {
    var row = U.rand(0, 2);
    var l1 = [mkArrive(row === 0 ? 'row' : 'col'), mkArrive(row === 1 ? 'row' : 'col'), mkArrive(row === 2 ? 'row' : 'col')];
    var l2 = [mkRide()].concat(U.shuffle([mkNoStop(), mkEarliest()]));
    var l3 = U.shuffle([mkDeadline(), mkMissed(), mkBest()]).concat([mkFlight()]);
    var q = l1.concat(l2, l3);
    var seen = {};
    q.forEach(function (x) {
      var k = keyOf(x);
      if (seen[k]) x.dup = true;
      seen[k] = true;
    });
    return q;
  }

  /* ---------------- timetable view ---------------- */
  /** HTML timetable. Clicking a cell rings it (pointing aid); clicking a heading lights its line. */
  function ttView(tt, opts) {
    opts = opts || {};
    var col = tt.orient !== 'row';
    var nv = tt.veh.length;
    var ns = tt.stops.length;
    var table = el('table', { class: 'bst-tt bst-' + tt.kind + (col ? ' bst-col' : ' bst-rowo') });
    var cells = [];
    var hv = [];
    var hs = [];
    var lit = { v: -1, s: -1 };
    for (var v = 0; v < nv; v++) cells.push([]);
    function mkHead(text, kindAttr, i) {
      var clickable = kindAttr === 'v' ? opts.onV : opts.onS;
      var th = el('th', { class: 'bst-h bst-h' + kindAttr, scope: kindAttr === 'v' ? (col ? 'col' : 'row') : (col ? 'row' : 'col') });
      var inner = el('button', { type: 'button', class: 'bst-hb' + (clickable ? ' bst-hb-go' : '') }, text);
      inner.addEventListener('click', function () {
        if (clickable) clickable(i);
        else if (!opts.noPoint) {
          var on = kindAttr === 'v' ? lit.v === i : lit.s === i;
          clearLight();
          if (!on) {
            if (kindAttr === 'v') view.lightV(i);
            else view.lightS(i);
            if (kindAttr === 'v') lit.v = i;
            else lit.s = i;
          }
        }
      });
      th.appendChild(inner);
      (kindAttr === 'v' ? hv : hs)[i] = th;
      return th;
    }
    function mkCell(v, s) {
      var x = tt.t[v][s];
      var td = el('td', { class: 'bst-c' + (x == null ? ' bst-dash' : ''), title: x == null ? 'does not stop' : null }, x == null ? '–' : lab(x));
      td.addEventListener('click', function () {
        if (opts.noPoint) return;
        td.classList.toggle('bst-pt');
        if (opts.onCell) opts.onCell(v, s);
      });
      cells[v][s] = td;
      return td;
    }
    var corner = tt.kind === 'flight' ? 'Flight' : col ? (tt.kind === 'train' ? 'Station' : 'Stop') : Word(tt.kind);
    var head = el('tr');
    head.appendChild(el('th', { class: 'bst-corner' }, corner));
    var i;
    if (col) {
      for (i = 0; i < nv; i++) head.appendChild(mkHead(tt.veh[i], 'v', i));
      table.appendChild(el('thead', null, head));
      var body = el('tbody');
      for (var s = 0; s < ns; s++) {
        var tr = el('tr', null, mkHead(tt.stops[s], 's', s));
        for (i = 0; i < nv; i++) tr.appendChild(mkCell(i, s));
        body.appendChild(tr);
      }
      table.appendChild(body);
    } else {
      for (i = 0; i < ns; i++) head.appendChild(mkHead(tt.stops[i], 's', i));
      table.appendChild(el('thead', null, head));
      var body2 = el('tbody');
      for (var v2 = 0; v2 < nv; v2++) {
        var tr2 = el('tr', null, mkHead(tt.veh[v2], 'v', v2));
        for (i = 0; i < ns; i++) tr2.appendChild(mkCell(v2, i));
        body2.appendChild(tr2);
      }
      table.appendChild(body2);
    }
    var hasDash = tt.t.some(function (r) { return r.some(function (x) { return x == null; }); });
    var title = tt.title || (tt.kind === 'train' ? 'Train timetable' : 'Bus timetable');
    var view = el('div', { class: 'bst-ttbox' },
      el('div', { class: 'bst-tt-title' }, title),
      el('div', { class: 'bst-scroll' }, table),
      hasDash && !opts.noKey ? el('div', { class: 'bst-key' }, el('b', null, '–'), ' means the ' + word(tt.kind) + ' does not stop there.') : null);
    function clearLight() {
      lit.v = -1;
      lit.s = -1;
      table.querySelectorAll('.bst-lit,.bst-hd-on').forEach(function (z) { z.classList.remove('bst-lit', 'bst-hd-on'); });
    }
    view.cells = cells;
    view.hv = hv;
    view.hs = hs;
    view.clear = function () {
      clearLight();
      table.querySelectorAll('.bst-pt,.bst-trace,.bst-meet,.bst-ok,.bst-no,.bst-skipc,.bst-miss').forEach(function (z) {
        z.classList.remove('bst-pt', 'bst-trace', 'bst-meet', 'bst-ok', 'bst-no', 'bst-skipc', 'bst-miss');
      });
      table.querySelectorAll('.bst-badge').forEach(function (b) { b.parentNode.removeChild(b); });
    };
    view.lightV = function (v) {
      hv[v].classList.add('bst-hd-on');
      for (var k = 0; k < ns; k++) cells[v][k].classList.add('bst-lit');
    };
    view.lightS = function (s) {
      hs[s].classList.add('bst-hd-on');
      for (var k = 0; k < nv; k++) cells[k][s].classList.add('bst-lit');
    };
    view.add = function (v, s, cls) {
      cells[v][s].classList.add(cls);
    };
    view.badge = function (v, s, txt) {
      table.querySelectorAll('.bst-badge').forEach(function (b) { b.parentNode.removeChild(b); });
      cells[v][s].appendChild(el('span', { class: 'bst-badge' }, txt));
    };
    /** Light vehicle v's cells from stop `from` to `to` one by one, with a moving icon. */
    view.trace = function (api, v, from, to, done) {
      var icon = tt.kind === 'train' ? '🚆' : tt.kind === 'flight' ? '✈️' : '🚌';
      var k = from;
      function step() {
        var c = cells[v][k];
        c.classList.add(tt.t[v][k] == null ? 'bst-skipc' : 'bst-trace');
        view.badge(v, k, icon);
        if (k === to) {
          c.classList.add('bst-meet');
          if (done) done();
          return;
        }
        k++;
        api.later(step, 550);
      }
      step();
    };
    return view;
  }

  /* ---------------- street picture (learn screens) ---------------- */
  var STREET_ICONS = { 'Park Gate': '🌳', Library: '📚', Market: '🍎', School: '🏫' };

  function street(stops) {
    var W = 760;
    var xs = stops.map(function (s, i) { return 80 + (i * (W - 160)) / (stops.length - 1); });
    var svg = S('svg', { viewBox: '0 0 ' + W + ' 170', class: 'bst-street', role: 'img', 'aria-label': 'A street with ' + stops.length + ' bus stops' });
    svg.appendChild(S('rect', { x: 0, y: 96, width: W, height: 34, class: 'bst-road' }));
    svg.appendChild(S('line', { x1: 0, y1: 113, x2: W, y2: 113, class: 'bst-road-mid' }));
    var tags = [];
    var signs = [];
    xs.forEach(function (x, i) {
      var g = S('g', { class: 'bst-stop' });
      g.appendChild(S('line', { x1: x + 26, y1: 42, x2: x + 26, y2: 96, class: 'bst-pole' }));
      g.appendChild(S('rect', { x: x + 12, y: 30, width: 28, height: 20, rx: 4, class: 'bst-sign' }));
      g.appendChild(S('text', { x: x + 26, y: 44, class: 'bst-sign-t', 'text-anchor': 'middle' }, 'BUS'));
      g.appendChild(S('text', { x: x - 12, y: 70, class: 'bst-st-icon', 'text-anchor': 'middle' }, STREET_ICONS[stops[i]] || '📍'));
      g.appendChild(S('text', { x: x, y: 152, class: 'bst-st-name', 'text-anchor': 'middle' }, stops[i]));
      var tag = S('text', { x: x + 26, y: 20, class: 'bst-st-time', 'text-anchor': 'middle' }, '');
      g.appendChild(tag);
      tags.push(tag);
      signs.push(g);
      svg.appendChild(g);
    });
    // the bus: anchored at its front-middle on the road
    var bus = S('g', { class: 'bst-bus' });
    bus.appendChild(S('rect', { x: -34, y: 74, width: 68, height: 32, rx: 7, class: 'bst-bus-body' }));
    [-26, -10, 6].forEach(function (wx) { bus.appendChild(S('rect', { x: wx, y: 79, width: 12, height: 11, rx: 2, class: 'bst-bus-win' })); });
    bus.appendChild(S('rect', { x: 21, y: 79, width: 9, height: 20, rx: 2, class: 'bst-bus-door' }));
    bus.appendChild(S('circle', { cx: -20, cy: 107, r: 6, class: 'bst-bus-wheel' }));
    bus.appendChild(S('circle', { cx: 18, cy: 107, r: 6, class: 'bst-bus-wheel' }));
    var label = S('text', { x: 0, y: 70, class: 'bst-bus-lbl', 'text-anchor': 'middle' }, '');
    bus.appendChild(label);
    svg.appendChild(bus);
    var api = { svg: svg };
    api.place = function (i, animate) {
      bus.style.transition = animate ? 'transform .5s ease-in-out' : 'none';
      bus.style.transform = 'translate(' + xs[i] + 'px,0px)';
    };
    api.label = function (txt) {
      label.textContent = txt;
    };
    api.tag = function (i, txt, cls) {
      tags[i].textContent = txt;
      tags[i].setAttribute('class', 'bst-st-time' + (cls ? ' ' + cls : ''));
    };
    api.clearTags = function () {
      tags.forEach(function (t) {
        t.textContent = '';
        t.setAttribute('class', 'bst-st-time');
      });
      signs.forEach(function (g) { g.setAttribute('class', 'bst-stop'); });
    };
    api.lightStop = function (i) {
      signs.forEach(function (g, k) { g.setAttribute('class', 'bst-stop' + (k === i ? ' bst-stop-on' : '')); });
    };
    api.place(0, false);
    return api;
  }

  /** Drive vehicle v along the street, lighting each timetable cell. onStop(i) after each stop. */
  function drive(api, st, view, tt, v, token, done) {
    var k = 0;
    st.clearTags();
    view.clear();
    view.lightV(v);
    st.label(tt.veh[v]);
    st.place(0, false);
    function step() {
      if (token()) return;
      var x = tt.t[v][k];
      st.place(k, true);
      view.add(v, k, x == null ? 'bst-skipc' : 'bst-trace');
      view.badge(v, k, '🚌');
      st.tag(k, x == null ? '–' : lab(x), x == null ? 'bst-st-skip' : '');
      if (k === tt.stops.length - 1) {
        view.add(v, k, 'bst-meet');
        if (done) api.later(function () { if (!token()) done(); }, 350);
        return;
      }
      k++;
      api.later(step, 800);
    }
    api.later(step, 150);
  }

  /* ---------------- learn screens ---------------- */
  var LEARN_STOPS = ['Park Gate', 'Library', 'Market', 'School'];
  var T1 = { kind: 'bus', title: 'Bus timetable', stops: LEARN_STOPS, veh: ['Bus 1', 'Bus 2', 'Bus 3'], orient: 'col', t: [[455, 466, 478, 490], [470, 482, 493, 504], [485, 497, 509, 521]] };
  var T2 = { kind: 'bus', title: 'Bus timetable', stops: LEARN_STOPS, veh: ['Bus 1', 'Bus 2', 'Bus 3', 'Bus 4'], orient: 'col', t: [[455, 466, 478, 490], [470, null, 489, 501], [485, 497, null, 518], [500, 511, 523, 535]] };
  var T3 = { kind: 'bus', title: 'Bus timetable', stops: LEARN_STOPS, veh: ['Bus 1', 'Bus 2', 'Bus 3', 'Bus 4'], orient: 'col', t: [[460, 472, 483, 495], [475, 488, 499, 511], [480, null, null, 506], [490, 502, 513, 525]] };
  var BELL = 510;

  function learnFollow(stage, api) {
    api.say('This timetable is for the buses on this street. Click Bus 2 to follow it!');
    api.lockNext();
    var st = street(LEARN_STOPS);
    var run = 0;
    var done = false;
    var task = el('div', { class: 'bst-task' }, 'Click ', el('b', null, 'Bus 2'), ' at the top of the timetable.');
    var view = ttView(T1, {
      onV: function (v) {
        var id = ++run;
        api.sound('click');
        api.say(T1.veh[v] + ' leaves ' + LEARN_STOPS[0] + ' at ' + lab(T1.t[v][0]) + '. Watch it go down the column!', 'happy');
        drive(api, st, view, T1, v, function () { return id !== run; }, function () {
          api.say(T1.veh[v] + ' gets to School at ' + lab(T1.t[v][3]) + '. One bus = one column. Read DOWN.', 'cheer');
          if (v === 1 && !done) {
            done = true;
            task.classList.add('bst-task-done');
            api.feedback('Follow one bus by reading DOWN its column.', 'good');
            api.unlockNext();
          } else if (!done) api.feedback('Now try Bus 2.', 'info');
        });
      },
    });
    stage.appendChild(task);
    stage.appendChild(st.svg);
    stage.appendChild(view);
  }

  function learnRow(stage, api) {
    api.say('A row shows every bus that calls at one stop. Click Library.');
    api.lockNext();
    var st = street(LEARN_STOPS);
    var done = false;
    var task = el('div', { class: 'bst-task' }, 'Click the stop ', el('b', null, 'Library'), ' on the left of the timetable.');
    var readout = el('div', { class: 'bst-readout' });
    var view = ttView(T2, {
      noKey: true,
      onS: function (s) {
        api.sound('click');
        view.clear();
        view.lightS(s);
        st.clearTags();
        st.lightStop(s);
        st.label('');
        MQ.clear(readout);
        var skip = [];
        T2.veh.forEach(function (name, v) {
          var x = T2.t[v][s];
          if (x == null) {
            view.add(v, s, 'bst-skipc');
            skip.push(name);
          }
          readout.appendChild(el('span', { class: 'bst-chip' + (x == null ? ' bst-chip-skip' : '') }, name + ': ' + (x == null ? '– does not stop' : lab(x))));
        });
        if (skip.length) {
          api.say('The – means ' + skip.join(' and ') + ' does not stop at ' + LEARN_STOPS[s] + '. It drives straight past!', 'think');
        } else {
          api.say('Every bus stops at ' + LEARN_STOPS[s] + '. Read ACROSS the row.', 'happy');
        }
        if (s === 1 && !done) {
          done = true;
          task.classList.add('bst-task-done');
          api.feedback('– is not a time. It means "this bus does not stop here".', 'good');
          api.unlockNext();
        }
      },
    });
    stage.appendChild(task);
    stage.appendChild(st.svg);
    stage.appendChild(view);
    stage.appendChild(readout);
  }

  /* small clock face */
  function pol(r, deg) {
    var a = (deg * Math.PI) / 180;
    return { x: r * Math.sin(a), y: -r * Math.cos(a) };
  }
  function miniClock(t) {
    var h = Math.floor(t / 60) % 12;
    var m = t % 60;
    var hd = 30 * h + 0.5 * m;
    var md = 6 * m;
    var root = S('svg', { viewBox: '-60 -60 120 120', class: 'bst-clock', role: 'img', 'aria-label': 'Clock showing ' + lab(t) });
    root.appendChild(S('circle', { cx: 0, cy: 0, r: 56, class: 'bst-clock-rim' }));
    for (var i = 0; i < 12; i++) {
      var a = pol(44, i * 30);
      var b = pol(51, i * 30);
      root.appendChild(S('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: 'bst-tk' }));
      var p = pol(35, (i + 1) * 30);
      root.appendChild(S('text', { x: p.x, y: p.y + 5, class: 'bst-clock-num', 'text-anchor': 'middle' }, String(i + 1)));
    }
    root.appendChild(S('line', { x1: 0, y1: 5, x2: 0, y2: -26, class: 'bst-hand-h', transform: 'rotate(' + hd + ')' }));
    root.appendChild(S('line', { x1: 0, y1: 7, x2: 0, y2: -44, class: 'bst-hand-m', transform: 'rotate(' + md + ')' }));
    root.appendChild(S('circle', { cx: 0, cy: 0, r: 4, class: 'bst-clock-cap' }));
    return root;
  }

  function learnBell(stage, api) {
    api.say('Beat the bell! You wait at Park Gate. Try a bus. Does it reach School by 8:30?');
    api.lockNext();
    var st = street(LEARN_STOPS);
    var run = 0;
    var gotOne = false;
    var tried = {};
    var bell = el('div', { class: 'bst-bell' }, miniClock(BELL), el('div', { class: 'bst-bell-t' }, '🔔 Be at ', el('b', null, 'School'), ' by ', el('b', null, lab(BELL)), '!'));
    var results = el('div', { class: 'bst-results' });
    var view = ttView(T3, { noPoint: false });
    var btns = el('div', { class: 'bst-tries' });
    var bEls = T3.veh.map(function (name, v) {
      var b = el('button', { type: 'button', class: 'btn bst-try' }, '🚌 Try ' + name);
      b.addEventListener('click', function () { go(v); });
      btns.appendChild(b);
      return b;
    });
    function go(v) {
      var id = ++run;
      api.sound('click');
      api.say(T3.veh[v] + ' leaves Park Gate at ' + lab(T3.t[v][0]) + '…', 'think');
      drive(api, st, view, T3, v, function () { return id !== run; }, function () {
        var arr = T3.t[v][3];
        var ok = arr <= BELL;
        st.tag(3, lab(arr) + (ok ? ' ✔' : ' ✘'), ok ? 'bst-st-ok' : 'bst-st-bad');
        view.add(v, 3, ok ? 'bst-ok' : 'bst-no');
        bEls[v].classList.add(ok ? 'bst-try-ok' : 'bst-try-bad');
        if (!tried[v]) {
          tried[v] = true;
          results.appendChild(el('span', { class: 'bst-chip ' + (ok ? 'bst-chip-ok' : 'bst-chip-bad') }, T3.veh[v] + ': ' + lab(arr) + (ok ? ' ✔ on time' : ' ✘ late')));
        }
        api.sound(ok ? 'correct' : 'wrong');
        var msg;
        if (v === 2) msg = 'Bus 3 left after Bus 2 but got there first! It did not stop at Library or Market.';
        else if (ok) msg = lab(arr) + ' is before ' + lab(BELL) + '. On time!';
        else if (arr - BELL <= 2) msg = lab(arr) + ' is just after ' + lab(BELL) + '. Late by ' + (arr - BELL) + ' minute' + (arr - BELL === 1 ? '' : 's') + '!';
        else msg = lab(arr) + ' is after ' + lab(BELL) + '. Too late!';
        api.say(msg, ok ? 'cheer' : 'oops');
        if (ok && !gotOne) {
          gotOne = true;
          api.feedback('Look at the time it ARRIVES at School, not the time it leaves.', 'good');
          api.unlockNext();
        }
      });
    }
    stage.appendChild(el('div', { class: 'bst-bellrow' }, bell, btns));
    stage.appendChild(st.svg);
    stage.appendChild(view);
    stage.appendChild(results);
  }

  /* ---------------- practice helpers ---------------- */
  function timeChoices(opts, onPick) {
    return MQ.ui.choices(opts.map(function (o) { return { label: lab(o.t), value: o.t }; }), onPick, { columns: 4 });
  }
  function vehChoices(tt, onPick) {
    return MQ.ui.choices(tt.veh.map(function (n, v) { return { label: n, value: v }; }), onPick, { columns: Math.min(tt.veh.length, 6) });
  }
  /** Toggle buttons (pick all that apply) and a Check button. */
  function toggles(tt, onCheck) {
    var sel = {};
    var box = el('div', { class: 'bst-togs' });
    var row = el('div', { class: 'bst-togrow' });
    var bs = tt.veh.map(function (n, v) {
      var b = el('button', { type: 'button', class: 'bst-tog', 'aria-pressed': 'false' }, n);
      b.addEventListener('click', function () {
        if (b.disabled) return;
        sel[v] = !sel[v];
        b.classList.toggle('bst-tog-on', !!sel[v]);
        b.setAttribute('aria-pressed', sel[v] ? 'true' : 'false');
        b.classList.remove('bst-tog-bad');
        MQ.sound('click');
      });
      row.appendChild(b);
      return b;
    });
    var check = el('button', { type: 'button', class: 'btn bst-check' }, 'Check ✓');
    check.addEventListener('click', function () {
      var picked = [];
      for (var v = 0; v < bs.length; v++) if (sel[v]) picked.push(v);
      onCheck(picked);
    });
    box.appendChild(row);
    box.appendChild(check);
    box.bs = bs;
    box.mark = function (v, cls) {
      bs[v].classList.add(cls);
    };
    box.show = function (ans) {
      bs.forEach(function (b, v) {
        var on = ans.indexOf(v) >= 0;
        sel[v] = on;
        b.classList.toggle('bst-tog-on', on);
        b.classList.remove('bst-tog-bad');
        if (on) b.classList.add('bst-tog-good');
      });
    };
    box.disable = function () {
      bs.forEach(function (b) { b.disabled = true; });
      check.disabled = true;
    };
    return box;
  }
  function sameSet(a, b) {
    if (a.length !== b.length) return false;
    return a.every(function (x) { return b.indexOf(x) >= 0; });
  }

  /* ---------------- practice renderers ---------------- */
  function renderArrive(stage, api, q) {
    var tt = q.tt;
    var col = tt.orient !== 'row';
    var V = tt.veh[q.v];
    var X = tt.stops[q.s];
    api.say(col ? 'Find ' + V + ' at the top. Slide down to ' + X + '.' : 'Find ' + V + ' on the left. Slide across to ' + X + '.', 'think');
    var view = ttView(tt);
    stage.appendChild(view);
    stage.appendChild(MQ.ui.prompt('What time does <b>' + V + '</b> arrive at <b>' + X + '</b>?'));
    var ch = timeChoices(q.opts, function (t) {
      if (t === q.ans) {
        ch.mark(t, 'good');
        ch.disable();
        view.clear();
        view.lightV(q.v);
        view.add(q.v, q.s, 'bst-meet');
        api.check(true, 'Yes! ' + V + ' gets to ' + X + ' at ' + lab(q.ans) + '.');
        return;
      }
      ch.mark(t, 'bad');
      var o = q.opts.filter(function (z) { return z.t === t; })[0];
      var strong = api.tries() >= 1;
      var hint;
      var line = col ? 'column' : 'row';
      if (o.tag === TAG.swapCol || o.tag === TAG.swapRow) hint = strong ? 'Put your finger on ' + V + '. Keep it in that ' + line + ' and move to ' + X + '.' : 'Careful: you mixed up the bus and the stop. ' + V + ' is a ' + line + '. Follow it to ' + X + '.';
      else if (o.tag === TAG.wrongBus) hint = strong ? V + ' is the ' + line + ' with "' + V + '" at the ' + (col ? 'top' : 'start') + '. Stay in it.' : 'That is the right stop, but another bus. Find ' + V + ' first.';
      else hint = strong ? 'Go along ' + V + ' until you reach the ' + X + (col ? ' row' : ' column') + '.' : 'That is ' + V + ', but at a different stop. Find ' + X + '.';
      api.check(false, hint, o.tag);
    });
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(q.ans, 'good');
      ch.disable();
      view.clear();
      view.lightV(q.v);
      view.trace(api, q.v, 0, q.s);
      api.feedback('Follow ' + V + (col ? ' down' : ' across') + ' to ' + X + ': ' + lab(q.ans) + '.', 'info');
    });
  }

  function renderRide(stage, api, q) {
    var tt = q.tt;
    var A = tt.stops[q.a];
    var dep = tt.t[q.v][q.a];
    var V = tt.veh[q.v];
    api.say('First find ' + lab(dep) + ' in the ' + A + ' row. That is your bus!', 'think');
    var view = ttView(tt);
    stage.appendChild(view);
    stage.appendChild(MQ.ui.prompt('I get the <b>' + lab(dep) + '</b> bus from <b>' + A + '</b>. When do I reach <b>School</b>?'));
    var ch = timeChoices(q.opts, function (t) {
      if (t === q.ans) {
        ch.mark(t, 'good');
        ch.disable();
        view.clear();
        view.lightV(q.v);
        view.add(q.v, q.s, 'bst-meet');
        api.check(true, 'Yes! The ' + lab(dep) + ' is ' + V + '. It reaches School at ' + lab(q.ans) + '.');
        return;
      }
      ch.mark(t, 'bad');
      var o = q.opts.filter(function (z) { return z.t === t; })[0];
      var strong = api.tries() >= 1;
      var hint;
      if (o.tag === TAG.leave) hint = 'That is when you get ON the bus. When does it get to School?';
      else if (o.tag === TAG.swapCol) hint = strong ? 'Your bus is ' + V + '. Stay in its column and go down to School.' : 'That time is for a different bus. Find ' + lab(dep) + ' in the ' + A + ' row first.';
      else hint = strong ? 'Go down ' + V + ' to the School row.' : 'Right bus, wrong stop! Look in the School row.';
      api.check(false, hint, o.tag);
    });
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(q.ans, 'good');
      ch.disable();
      view.clear();
      view.lightV(q.v);
      view.trace(api, q.v, q.a, q.s);
      api.feedback('The ' + lab(dep) + ' from ' + A + ' is ' + V + '. Down its column to School: ' + lab(q.ans) + '.', 'info');
    });
  }

  function renderNoStop(stage, api, q) {
    var tt = q.tt;
    var X = tt.stops[q.x];
    var w = plural(tt.kind);
    var view = ttView(tt);
    stage.appendChild(view);
    function showWork() {
      view.clear();
      view.lightS(q.x);
      tt.veh.forEach(function (n, v) { view.add(v, q.x, tt.t[v][q.x] == null ? 'bst-no' : 'bst-ok'); });
    }
    var parts = tt.veh.map(function (n, v) { return n + ' ' + (tt.t[v][q.x] == null ? '–' : lab(tt.t[v][q.x])); }).join(', ');
    if (q.mode === 'which') {
      api.say('Look along the ' + X + ' row for every –.', 'think');
      stage.appendChild(MQ.ui.prompt('Which ' + w + ' do <b>not</b> stop at <b>' + X + '</b>? Pick all of them.'));
      var tg = toggles(tt, function (picked) {
        if (!picked.length) {
          api.feedback('Click the ' + w + ' you choose, then press Check.', 'info');
          return;
        }
        if (sameSet(picked, q.ans)) {
          tg.disable();
          showWork();
          api.check(true, 'Yes! ' + q.ans.map(function (v) { return tt.veh[v]; }).join(' and ') + ' ' + (q.ans.length > 1 ? 'have' : 'has') + ' – at ' + X + '.');
          return;
        }
        var strong = api.tries() >= 1;
        var extra = picked.filter(function (v) { return q.ans.indexOf(v) < 0; });
        if (extra.length) {
          extra.forEach(function (v) { tg.mark(v, 'bst-tog-bad'); });
          var e = extra[0];
          return api.check(false, strong ? 'Only pick the ' + w + ' with – in the ' + X + ' row.' : tt.veh[e] + ' has a time at ' + X + ' (' + lab(tt.t[e][q.x]) + '), so it DOES stop there.', TAG.stopsThere);
        }
        api.check(false, strong ? 'Go along the ' + X + ' row slowly. Count every –.' : 'You missed one. There is another – in the ' + X + ' row.', TAG.dash);
      });
      stage.appendChild(tg);
      api.onReveal(function () {
        tg.show(q.ans);
        tg.disable();
        showWork();
        api.feedback(X + ': ' + parts + '. – means does not stop.', 'info');
      });
    } else {
      api.say('A time means it stops. A – means it does not.', 'think');
      stage.appendChild(MQ.ui.prompt('How many ' + w + ' stop at <b>' + X + '</b>?'));
      var nums = U.range(1, tt.veh.length);
      var ch = MQ.ui.choices(nums, function (n) {
        if (n === q.ans) {
          ch.mark(n, 'good');
          ch.disable();
          showWork();
          api.check(true, 'Yes! ' + q.ans + ' ' + (q.ans === 1 ? word(tt.kind) : w) + ' stop at ' + X + '.');
          return;
        }
        ch.mark(n, 'bad');
        var strong = api.tries() >= 1;
        if (n === tt.veh.length) return api.check(false, strong ? 'Count only the times in the ' + X + ' row. Skip every –.' : 'Not all of them! A – means that ' + word(tt.kind) + ' does not stop.', TAG.dash);
        api.check(false, strong ? 'Put your finger on each box in the ' + X + ' row. Count the times only.' : 'Count the times in the ' + X + ' row again.', TAG.count);
      }, { columns: nums.length });
      stage.appendChild(ch);
      api.onReveal(function () {
        ch.mark(q.ans, 'good');
        ch.disable();
        showWork();
        api.feedback(X + ': ' + parts + ' → ' + q.ans + ' times, so ' + q.ans + ' stop.', 'info');
      });
    }
  }

  function renderEarliest(stage, api, q) {
    var tt = q.tt;
    var A = tt.stops[q.a];
    var B = tt.stops[q.b];
    api.say('Your train must stop at ' + A + ' AND at ' + B + '.', 'think');
    var view = ttView(tt);
    stage.appendChild(view);
    stage.appendChild(MQ.ui.prompt('What is the <b>earliest</b> train from <b>' + A + '</b> to <b>' + B + '</b>?'));
    function work() {
      view.clear();
      view.lightS(q.a);
      view.lightS(q.b);
      tt.veh.forEach(function (n, v) {
        var ok = tt.t[v][q.a] != null && tt.t[v][q.b] != null;
        if (tt.t[v][q.a] == null) view.add(v, q.a, 'bst-no');
        if (tt.t[v][q.b] == null) view.add(v, q.b, 'bst-no');
        if (ok) view.add(v, q.a, 'bst-ok');
      });
    }
    var ch = vehChoices(tt, function (v) {
      if (v === q.ans) {
        ch.mark(v, 'good');
        ch.disable();
        work();
        api.check(true, 'Yes! ' + tt.veh[v] + ' leaves ' + A + ' at ' + lab(tt.t[v][q.a]) + ' and stops at ' + B + '.');
        return;
      }
      ch.mark(v, 'bad');
      var strong = api.tries() >= 1;
      if (tt.t[v][q.a] == null) return api.check(false, tt.veh[v] + ' has – at ' + A + '. It does not stop there, so you cannot get on!', TAG.skip);
      if (tt.t[v][q.b] == null) return api.check(false, strong ? 'Look for the first train with a time at ' + A + ' AND a time at ' + B + '.' : tt.veh[v] + (v === q.first ? ' leaves first, but it' : ' stops at ' + A + ', but it') + ' has – at ' + B + '. It does not stop there!', TAG.skip);
      api.check(false, strong ? 'Look for a train that leaves ' + A + ' before ' + lab(tt.t[v][q.a]) + ' and stops at ' + B + '.' : tt.veh[v] + ' works, but is there an earlier one?', TAG.notEarliest);
    });
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(q.ans, 'good');
      ch.disable();
      work();
      view.trace(api, q.ans, q.a, q.b);
      var f = tt.veh[q.first];
      api.feedback(f + ' leaves ' + A + ' first but has – at ' + B + '. ' + tt.veh[q.ans] + ' leaves at ' + lab(tt.t[q.ans][q.a]) + ' and reaches ' + B + ' at ' + lab(tt.t[q.ans][q.b]) + '.', 'info');
    });
  }

  /** Mark each vehicle's arrival at s (on time / late / –) and return the working text. */
  function deadlineWork(view, tt, q) {
    view.clear();
    view.lightS(q.s);
    var bits = [];
    tt.veh.forEach(function (n, v) {
      var A = tt.t[v][q.a];
      var B = tt.t[v][q.s];
      if (A == null) {
        view.add(v, q.a, 'bst-no');
        bits.push(n + ' – at ' + tt.stops[q.a]);
      } else if (B == null) {
        view.add(v, q.s, 'bst-no');
        bits.push(n + ' –');
      } else {
        var ok = q.strict ? B < q.D : B <= q.D;
        view.add(v, q.s, ok ? 'bst-ok' : 'bst-no');
        bits.push(n + ' ' + lab(B) + (ok ? ' ✔' : ' ✘'));
      }
    });
    return bits.join(', ');
  }

  function renderDeadline(stage, api, q) {
    var tt = q.tt;
    var A = tt.stops[q.a];
    var Dl = lab(q.D);
    var word2 = q.strict ? 'before' : 'by';
    api.say(q.strict ? 'Before ' + Dl + ' means ' + lab(q.D - 1) + ' or earlier.' : 'By ' + Dl + ' means ' + Dl + ' or earlier.', 'think');
    var view = ttView(tt);
    stage.appendChild(view);
    stage.appendChild(MQ.ui.prompt('I am at <b>' + A + '</b>. Which buses get me to <b>School ' + word2 + ' ' + Dl + '</b>? Pick all that work.'));
    var tg = toggles(tt, function (picked) {
      if (!picked.length) {
        api.feedback('Click the buses you choose, then press Check.', 'info');
        return;
      }
      if (sameSet(picked, q.ans)) {
        tg.disable();
        deadlineWork(view, tt, q);
        api.check(true, 'Yes! ' + q.ans.map(function (v) { return tt.veh[v] + ' (' + lab(tt.t[v][q.s]) + ')'; }).join(', ') + ' ' + (q.ans.length > 1 ? 'are' : 'is') + ' on time.');
        return;
      }
      var strong = api.tries() >= 1;
      var bad = picked.filter(function (v) { return q.ans.indexOf(v) < 0; });
      bad.forEach(function (v) { tg.mark(v, 'bst-tog-bad'); });
      if (bad.length) {
        var skip = bad.filter(function (v) { return q.split.skip.indexOf(v) >= 0; })[0];
        if (skip != null) {
          var where = tt.t[skip][q.a] == null ? A : 'School';
          return api.check(false, tt.veh[skip] + ' has – at ' + where + '. It does not stop there!', TAG.skip);
        }
        var ex = bad.filter(function (v) { return tt.t[v][q.s] === q.D; })[0];
        if (ex != null) return api.check(false, tt.veh[ex] + ' arrives at exactly ' + Dl + '. That is not BEFORE ' + Dl + '. Before means ' + lab(q.D - 1) + ' or earlier.', TAG.exact);
        var L = bad[0];
        var beat = q.ans.filter(function (O) { return tt.t[L][q.a] < tt.t[O][q.a]; });
        if (beat.length) return api.check(false, strong ? 'Look only at the School row. Which times are ' + word2 + ' ' + Dl + '?' : tt.veh[L] + ' leaves early, but it reaches School at ' + lab(tt.t[L][q.s]) + '. Too late! Check the School times.', TAG.first);
        return api.check(false, strong ? 'Look only at the School row. Which times are ' + word2 + ' ' + Dl + '?' : tt.veh[L] + ' reaches School at ' + lab(tt.t[L][q.s]) + '. That is after ' + Dl + '.', TAG.late);
      }
      api.check(false, strong ? 'Check every bus: does it stop at ' + A + '? Is its School time ' + word2 + ' ' + Dl + '?' : 'Those are right, but there is another bus that is on time too.', TAG.missedOne);
    });
    stage.appendChild(tg);
    api.onReveal(function () {
      tg.show(q.ans);
      tg.disable();
      var txt = deadlineWork(view, tt, q);
      view.trace(api, q.ans[0], q.a, q.s);
      api.feedback('School times: ' + txt + '. ' + (q.strict ? 'Before ' + Dl + ' means ' + lab(q.D - 1) + ' or earlier.' : 'By ' + Dl + ' means ' + Dl + ' or earlier.'), 'info');
    });
  }

  function renderBest(stage, api, q) {
    var tt = q.tt;
    var A = tt.stops[q.a];
    var Dl = lab(q.D);
    api.say('The best bus lets you leave as late as possible and still be on time.', 'think');
    var view = ttView(tt);
    stage.appendChild(view);
    stage.appendChild(MQ.ui.prompt('I am at <b>' + A + '</b>. I must be at <b>School by ' + Dl + '</b>. Which is the <b>best</b> bus? <span class="bst-small">(the latest one that is still on time)</span>'));
    var ch = vehChoices(tt, function (v) {
      if (v === q.ans) {
        ch.mark(v, 'good');
        ch.disable();
        deadlineWork(view, tt, q);
        api.check(true, 'Yes! ' + tt.veh[v] + ' leaves ' + A + ' at ' + lab(tt.t[v][q.a]) + ' and still gets to School at ' + lab(tt.t[v][q.s]) + '.');
        return;
      }
      ch.mark(v, 'bad');
      var strong = api.tries() >= 1;
      if (q.split.skip.indexOf(v) >= 0) return api.check(false, tt.veh[v] + ' has – at ' + (tt.t[v][q.a] == null ? A : 'School') + '. It does not stop there!', TAG.skip);
      if (q.split.late.indexOf(v) >= 0) return api.check(false, strong ? 'Find the buses whose School time is ' + Dl + ' or earlier. Pick the one that leaves last.' : tt.veh[v] + ' reaches School at ' + lab(tt.t[v][q.s]) + '. That is after ' + Dl + '. Too late!', TAG.late);
      api.check(false, strong ? 'Of the on-time buses, which leaves ' + A + ' last?' : tt.veh[v] + ' is on time, but you would wait at school a long time. Is there a later bus that is still on time?', TAG.earliestOnTime);
    });
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(q.ans, 'good');
      ch.disable();
      var txt = deadlineWork(view, tt, q);
      view.trace(api, q.ans, q.a, q.s);
      api.feedback('School times: ' + txt + '. Latest on-time bus: ' + tt.veh[q.ans] + ' (leaves ' + lab(tt.t[q.ans][q.a]) + ').', 'info');
    });
  }

  function renderMissed(stage, api, q) {
    var tt = q.tt;
    var X = tt.stops[q.x];
    var w = word(tt.kind);
    var col = tt.t.map(function (r) { return r[q.x]; });
    api.say('Look along the ' + X + ' row. Which ' + w + ' comes next AND stops?', 'think');
    var view = ttView(tt);
    stage.appendChild(view);
    stage.appendChild(MQ.ui.prompt('I just missed the <b>' + lab(q.T) + '</b> ' + w + ' at <b>' + X + '</b>. Which is the next ' + w + ' that stops at ' + X + '?'));
    function work() {
      view.clear();
      view.lightS(q.x);
      view.add(q.m, q.x, 'bst-miss');
      view.add(q.m + 1, q.x, 'bst-no');
      view.add(q.ans, q.x, 'bst-ok');
    }
    var ch = vehChoices(tt, function (v) {
      if (v === q.ans) {
        ch.mark(v, 'good');
        ch.disable();
        work();
        api.check(true, 'Yes! ' + tt.veh[q.m + 1] + ' does not stop, so take ' + tt.veh[v] + ' at ' + lab(col[v]) + '.');
        return;
      }
      ch.mark(v, 'bad');
      var strong = api.tries() >= 1;
      if (col[v] == null) return api.check(false, strong ? 'Skip every – in the ' + X + ' row. Which is the next time after ' + lab(q.T) + '?' : tt.veh[v] + ' has – at ' + X + '. It drives past without stopping!', TAG.skip);
      if (v === q.m) return api.check(false, 'That is the ' + w + ' you missed! It has gone. Look further along.', TAG.gone);
      if (col[v] < q.T) return api.check(false, tt.veh[v] + ' came at ' + lab(col[v]) + '. That is before ' + lab(q.T) + ', so it has gone too.', TAG.gone);
      api.check(false, strong ? 'Is there a ' + w + ' at ' + X + ' after ' + lab(q.T) + ' but before ' + lab(col[v]) + '?' : tt.veh[v] + ' stops, but there is one that comes sooner.', TAG.notNext);
    });
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(q.ans, 'good');
      ch.disable();
      work();
      view.trace(api, q.ans, 0, q.x);
      api.feedback('Missed ' + tt.veh[q.m] + ' (' + lab(q.T) + '). ' + tt.veh[q.m + 1] + ' has – at ' + X + '. Next: ' + tt.veh[q.ans] + ' at ' + lab(col[q.ans]) + '.', 'info');
    });
  }

  function renderFlight(stage, api, q) {
    var tt = q.tt;
    var Tl = lab(q.T);
    api.say(q.mode === 'a' ? 'After 12 o\'clock the clock starts again at 1.' : 'Which flights have gone already?', 'think');
    var view = ttView(tt);
    stage.appendChild(view);
    stage.appendChild(MQ.ui.prompt('It is <b>' + Tl + '</b>' + (q.mode === 'a' ? ' in the morning' : ', just after midday') + '. I am at the airport. Which flight is the <b>next</b> to take off?'));
    var work = el('div', { class: 'bst-work' });
    function strip() {
      MQ.clear(work);
      var idx = U.range(0, 4).sort(function (x, y) { return tt.t[x][0] - tt.t[y][0]; });
      var row = el('div', { class: 'bst-line' });
      var nowDone = false;
      idx.forEach(function (v) {
        if (!nowDone && tt.t[v][0] > q.T) {
          row.appendChild(el('span', { class: 'bst-chip bst-chip-now' }, '🧍 ' + labAP(q.T)));
          nowDone = true;
        }
        row.appendChild(el('span', { class: 'bst-chip' + (v === q.ans ? ' bst-chip-ok' : tt.t[v][0] < q.T ? ' bst-chip-gone' : '') }, tt.veh[v].replace('Flight ', '✈️ ') + ' ' + labAP(tt.t[v][0])));
      });
      work.appendChild(el('div', { class: 'bst-work-t' }, 'In time order:'));
      work.appendChild(row);
    }
    var ch = MQ.ui.choices(tt.veh.map(function (n, v) { return { label: n, value: v }; }), function (v) {
      if (v === q.ans) {
        ch.mark(v, 'good');
        ch.disable();
        view.clear();
        view.lightV(v);
        view.add(v, 0, 'bst-meet');
        api.check(true, 'Yes! ' + tt.veh[v] + ' takes off at ' + lab(tt.t[v][0]) + ', the next time after ' + Tl + '.');
        return;
      }
      ch.mark(v, 'bad');
      var strong = api.tries() >= 1;
      var role = q.roles[v];
      var t0 = lab(tt.t[v][0]);
      var nAns = lab(tt.t[q.ans][0]);
      if (q.mode === 'a' && role === 'one') return api.check(false, strong ? 'Count on from ' + Tl + ': 12 o\'clock comes first, then 1 o\'clock.' : t0 + ' is in the afternoon, AFTER ' + nAns + '. After 12 comes 1!', TAG.pm);
      if (q.mode === 'b' && role === 'late') return api.check(false, strong ? 'After 12 comes 1. Which flight takes off at 1-something?' : 'Is there a flight before ' + t0 + '? Remember: 1 o\'clock comes straight after 12 o\'clock.', TAG.pm);
      if (role === 'am' || (q.mode === 'b' && role === 'noon')) return api.check(false, t0 + ' was ' + (role === 'am' ? 'earlier this morning' : 'before ' + Tl) + '. That flight has gone!', TAG.gone);
      api.check(false, strong ? 'Find the take-off time that comes soonest after ' + Tl + '.' : t0 + ' is later on. Is there a flight that takes off sooner?', TAG.notNext);
    }, { columns: 5 });
    stage.appendChild(ch);
    stage.appendChild(work);
    api.onReveal(function () {
      ch.mark(q.ans, 'good');
      ch.disable();
      view.clear();
      view.lightS(0);
      view.add(q.ans, 0, 'bst-meet');
      strip();
      api.feedback('Now: ' + labAP(q.T) + ' → next take-off: ' + tt.veh[q.ans] + ' at ' + labAP(tt.t[q.ans][0]) + ' (12 o\'clock, then 1 o\'clock).', 'info');
    });
  }

  MQ.register(ID, {
    learn: [learnFollow, learnRow, learnBell],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'arrive') renderArrive(stage, api, q);
        else if (q.type === 'ride') renderRide(stage, api, q);
        else if (q.type === 'nostop') renderNoStop(stage, api, q);
        else if (q.type === 'earliest') renderEarliest(stage, api, q);
        else if (q.type === 'deadline') renderDeadline(stage, api, q);
        else if (q.type === 'best') renderBest(stage, api, q);
        else if (q.type === 'missed') renderMissed(stage, api, q);
        else renderFlight(stage, api, q);
      },
    },
  });

  // Harmless hook for automated tests (no effect on the page).
  MQ._bst = { buildDeck: buildDeck, lab: lab, mk: { arrive: mkArrive, ride: mkRide, nostop: mkNoStop, earliest: mkEarliest, deadline: mkDeadline, best: mkBest, missed: mkMissed, flight: mkFlight }, deck: function () { return deck; } };

  var css = [
    '.bst-task{font-size:1.1rem;font-weight:700;text-align:center;background:#fff8e6;border:2px dashed #ffb703;border-radius:12px;padding:6px 14px}',
    '.bst-task-done{background:var(--good-bg);border-color:var(--good);border-style:solid}',
    '.bst-street{width:100%;max-width:720px;height:auto;display:block}',
    '.bst-road{fill:#d9dde5}',
    '.bst-road-mid{stroke:#fff;stroke-width:3;stroke-dasharray:18 14}',
    '.bst-pole{stroke:#6b7a99;stroke-width:4}',
    '.bst-sign{fill:#2f6fde;stroke:#1d4fae;stroke-width:2}',
    '.bst-sign-t{fill:#fff;font-size:10px;font-weight:900;font-family:var(--font)}',
    '.bst-st-icon{font-size:22px}',
    '.bst-st-name{font-size:17px;font-weight:900;fill:#1b2a4a;font-family:var(--font)}',
    '.bst-stop-on .bst-st-name{fill:#c46a00}',
    '.bst-stop-on .bst-sign{fill:#ffb703;stroke:#c98a00}',
    '.bst-st-time{font-size:17px;font-weight:900;fill:#1b2a4a;font-family:var(--font)}',
    '.bst-st-skip{fill:#9aa3b5}',
    '.bst-st-ok{fill:#1f8a4c}',
    '.bst-st-bad{fill:#d62828}',
    '.bst-bus-body{fill:#ffb703;stroke:#c98a00;stroke-width:2}',
    '.bst-bus-win{fill:#dff1ff;stroke:#5a7bb5;stroke-width:1}',
    '.bst-bus-door{fill:#fff3c4;stroke:#c98a00;stroke-width:1}',
    '.bst-bus-wheel{fill:#333a48}',
    '.bst-bus-lbl{font-size:13px;font-weight:900;fill:#1b2a4a;font-family:var(--font)}',
    '.bst-ttbox{display:flex;flex-direction:column;align-items:center;gap:4px;max-width:100%}',
    '.bst-tt-title{font-weight:900;font-size:1rem;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em}',
    '.bst-scroll{max-width:100%;overflow-x:auto}',
    '.bst-tt{border-collapse:separate;border-spacing:3px;background:#fff;border:3px solid var(--line);border-radius:14px;padding:4px}',
    '.bst-tt th,.bst-tt td{text-align:center;border-radius:8px}',
    '.bst-corner{font-size:.85rem;font-weight:800;color:var(--ink-soft);padding:2px 6px}',
    '.bst-h{padding:0;background:#e9eefb;border:2px solid #c9d3ee}',
    '.bst-hb{font-family:var(--font);font-weight:900;font-size:1rem;color:var(--ink);background:none;border:0;padding:5px 8px;width:100%;cursor:pointer;white-space:nowrap}',
    '.bst-hb-go{color:#1d4fae;text-decoration:underline dotted}',
    '.bst-h:hover{border-color:var(--accent)}',
    '.bst-hd-on{background:#ffb703;border-color:#c98a00}',
    '.bst-c{position:relative;min-width:64px;padding:6px 8px;font-weight:800;font-size:1.12rem;background:var(--paper);border:2px solid var(--line);cursor:pointer;font-variant-numeric:tabular-nums;transition:background .2s}',
    '.bst-dash{color:#7b8499;font-size:1.3rem}',
    '.bst-lit{background:#fff4d6;border-color:#ffd166}',
    '.bst-pt{box-shadow:inset 0 0 0 3px #2f6fde}',
    '.bst-trace{background:#ffd166;border-color:#c98a00}',
    '.bst-skipc{background:#eceef3;border-color:#c3c8d4;border-style:dashed}',
    '.bst-meet{background:#ffb703;border-color:#c98a00;transform:scale(1.06)}',
    '.bst-ok{background:var(--good-bg);border-color:var(--good)}',
    '.bst-no{background:#ffe3e3;border-color:#d62828}',
    '.bst-miss{background:#eceef3;border-color:#9aa3b5;text-decoration:line-through}',
    '.bst-badge{position:absolute;top:-12px;right:-8px;font-size:1.05rem;pointer-events:none}',
    '.bst-key{font-size:.95rem;color:var(--ink-soft);font-weight:700}',
    '.bst-key b{font-size:1.15rem;color:var(--ink)}',
    '.bst-readout,.bst-results{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;min-height:2em}',
    '.bst-chip{display:inline-block;background:#fff;border:2px solid #c9d3ee;border-radius:999px;padding:3px 10px;font-weight:800;font-size:1rem}',
    '.bst-chip-skip,.bst-chip-gone{color:#7b8499;border-style:dashed}',
    '.bst-chip-ok{background:var(--good-bg);border-color:var(--good)}',
    '.bst-chip-bad{background:#ffe3e3;border-color:#d62828}',
    '.bst-chip-now{background:#fff4d6;border-color:#ffb703}',
    '.bst-bellrow{display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center}',
    '.bst-bell{display:flex;align-items:center;gap:10px}',
    '.bst-bell-t{font-size:1.2rem;font-weight:800}',
    '.bst-clock{width:84px;height:auto;display:block}',
    '.bst-clock-rim{fill:#fffdf6;stroke:#c8553d;stroke-width:5}',
    '.bst-tk{stroke:#1b2a4a;stroke-width:2}',
    '.bst-clock-num{font-size:12px;font-weight:800;fill:#1b2a4a;font-family:var(--font)}',
    '.bst-hand-h{stroke:#1b2a4a;stroke-width:5;stroke-linecap:round}',
    '.bst-hand-m{stroke:#2f6fde;stroke-width:3;stroke-linecap:round}',
    '.bst-clock-cap{fill:#c8553d}',
    '.bst-tries{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}',
    '.bst-try{font-size:1rem;padding:8px 12px}',
    '.bst-try-ok{box-shadow:0 0 0 3px var(--good)}',
    '.bst-try-bad{box-shadow:0 0 0 3px #d62828}',
    '.bst-togs{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.bst-togrow{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}',
    '.bst-tog{font-family:var(--font);font-weight:900;font-size:1.1rem;min-width:96px;padding:10px 14px;background:#fff;border:3px solid #c9d3ee;border-radius:12px;cursor:pointer;color:var(--ink)}',
    '.bst-tog:hover{border-color:var(--accent)}',
    '.bst-tog-on{background:#fff4d6;border-color:#ffb703}',
    '.bst-tog-on::before{content:"✓ "}',
    '.bst-tog-bad{background:#ffe3e3;border-color:#d62828}',
    '.bst-tog-good{background:var(--good-bg);border-color:var(--good)}',
    '.bst-check{font-size:1.1rem}',
    '.bst-small{font-size:1rem;color:var(--ink-soft);font-weight:700}',
    '.bst-work{display:flex;flex-direction:column;align-items:center;gap:4px}',
    '.bst-work-t{font-weight:800;color:var(--ink-soft)}',
    '.bst-line{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}',
    '@media (max-width:860px){.bst-c{min-width:52px;font-size:1rem;padding:5px 4px}.bst-hb{font-size:.9rem;padding:4px 4px;white-space:normal}.bst-tog{min-width:80px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

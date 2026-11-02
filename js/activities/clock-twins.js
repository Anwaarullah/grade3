/* Clock Twins — match analogue clocks, digital displays and words that show the same time
 * (Unit 8.1). Clocks use the shared Unit 8 look (white face, 60 ticks, long orange minute
 * hand, short dark hour hand at (h % 12) * 30 + m * 0.5 degrees). All drawings are original.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  /* ---------------- shared Unit 8 clock (prefix ct-) ---------------- */
  function ctPoint(cx, cy, d, deg) {
    var a = (deg * Math.PI) / 180;
    return { x: Math.round((cx + d * Math.sin(a)) * 100) / 100, y: Math.round((cy - d * Math.cos(a)) * 100) / 100 };
  }
  function ctDigital(h, m) {
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  function two(n) {
    return (n < 10 ? '0' : '') + n;
  }
  function ctNextHour(h) {
    return h === 12 ? 1 : h + 1;
  }
  /** Past for 1-30 (quarter past / half past), to for 31-59 (quarter to). */
  function ctWords(h, m) {
    if (m === 0) return h + " o'clock";
    if (m === 15) return 'quarter past ' + h;
    if (m === 30) return 'half past ' + h;
    if (m === 45) return 'quarter to ' + ctNextHour(h);
    if (m < 30) return m + (m === 1 ? ' minute' : ' minutes') + ' past ' + h;
    var to = 60 - m;
    return to + (to === 1 ? ' minute' : ' minutes') + ' to ' + ctNextHour(h);
  }
  function key(h, m) {
    return h + ':' + two(m);
  }

  /**
   * makeClock({ r, hour, minute, pad, width, hits })
   * Shared Unit 8 clock plus: a highlight layer, number marks, dots and labels on minute
   * marks, and (hits: true) fat invisible click lines over each hand.
   */
  function makeClock(o) {
    var r = o.r || 120;
    var pad = o.pad == null ? 10 : o.pad;
    var size = 2 * (r + pad);
    var cx = size / 2;
    var cy = size / 2;
    var root = S('svg', { viewBox: '0 0 ' + size + ' ' + size, width: o.width || size, class: 'ct-clock', style: { maxWidth: '100%', height: 'auto' } });
    root.appendChild(S('circle', { cx: cx, cy: cy, r: r, fill: '#fff', stroke: '#1b2a4a', 'stroke-width': 5 }));
    var under = S('g', { class: 'ct-under' });
    root.appendChild(under);
    for (var t = 0; t < 60; t++) {
      var big = t % 5 === 0;
      var p1 = ctPoint(cx, cy, r - 4, t * 6);
      var p2 = ctPoint(cx, cy, r - (big ? 16 : 9), t * 6);
      root.appendChild(S('line', { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, stroke: '#1b2a4a', 'stroke-width': big ? 3 : 1.4, 'stroke-linecap': 'round' }));
    }
    for (var n = 1; n <= 12; n++) {
      var q = ctPoint(cx, cy, r * 0.72, n * 30);
      root.appendChild(S('text', { x: q.x, y: q.y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': Math.round(r * 0.19), 'font-weight': 800, fill: '#1b2a4a' }, String(n)));
    }
    var layer = S('g', { class: 'ct-layer' });
    root.appendChild(layer);
    var hourHand = S('line', { x1: cx, y1: cy, x2: cx, y2: cy - r * 0.5, stroke: '#1b2a4a', 'stroke-width': r * 0.075, 'stroke-linecap': 'round', class: 'ct-hour' });
    var minuteHand = S('line', { x1: cx, y1: cy, x2: cx, y2: cy - r * 0.82, stroke: '#e85d04', 'stroke-width': r * 0.045, 'stroke-linecap': 'round', class: 'ct-minute' });
    root.appendChild(hourHand);
    root.appendChild(minuteHand);
    root.appendChild(S('circle', { cx: cx, cy: cy, r: r * 0.05, fill: '#1b2a4a' }));
    var top = S('g', { class: 'ct-top' });
    root.appendChild(top);
    var h0 = o.hour || 12;
    var m0 = o.minute || 0;
    function handEnd(len, deg) {
      return ctPoint(cx, cy, len, deg);
    }
    var api = {
      svg: root,
      r: r,
      cx: cx,
      cy: cy,
      hourHand: hourHand,
      minuteHand: minuteHand,
      hourDeg: function () {
        return (h0 % 12) * 30 + m0 * 0.5;
      },
      setTime: function (h, m) {
        h0 = h;
        m0 = m;
        var a = handEnd(r * 0.5, (h % 12) * 30 + m * 0.5);
        hourHand.setAttribute('x2', a.x);
        hourHand.setAttribute('y2', a.y);
        var b = handEnd(r * 0.82, m * 6);
        minuteHand.setAttribute('x2', b.x);
        minuteHand.setAttribute('y2', b.y);
        root.setAttribute('data-h', h);
        root.setAttribute('data-m', m);
      },
      /** pale yellow halo under a hand ('hour' | 'minute') */
      halo: function (which) {
        var len = which === 'hour' ? r * 0.5 : r * 0.82;
        var deg = which === 'hour' ? api.hourDeg() : m0 * 6;
        var p = handEnd(len, deg);
        layer.appendChild(S('line', { x1: cx, y1: cy, x2: p.x, y2: p.y, class: 'ct-halo', 'stroke-width': which === 'hour' ? r * 0.2 : r * 0.15 }));
      },
      markNumber: function (num) {
        var p = ctPoint(cx, cy, r * 0.72, num * 30);
        under.appendChild(S('circle', { cx: p.x, cy: p.y, r: r * 0.15, class: 'ct-hourmark' }));
      },
      dot: function (min, cls) {
        var p = ctPoint(cx, cy, r - 7, min * 6);
        top.appendChild(S('circle', { cx: p.x, cy: p.y, r: min % 5 === 0 ? 6.5 : 5, class: cls || 'ct-dot' }));
      },
      label: function (min, text, dist, cls, fs) {
        var p = ctPoint(cx, cy, dist, min * 6);
        top.appendChild(S('text', { x: p.x, y: p.y, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': fs || 15, 'font-weight': 800, class: cls || 'ct-lab' }, text));
      },
      clearMarks: function () {
        MQ.clear(layer);
        MQ.clear(under);
        MQ.clear(top);
      },
    };
    api.setTime(h0, m0);
    if (o.hits) {
      var mp = handEnd(r * 0.82, m0 * 6);
      var hp = handEnd(r * 0.5, api.hourDeg());
      api.minuteHit = S('line', { x1: cx, y1: cy, x2: mp.x, y2: mp.y, class: 'ct-hit', 'stroke-width': 30, 'data-hand': 'minute' });
      api.hourHit = S('line', { x1: cx, y1: cy, x2: hp.x, y2: hp.y, class: 'ct-hit', 'stroke-width': 34, 'data-hand': 'hour' });
      root.appendChild(api.minuteHit);
      root.appendChild(api.hourHit);
    }
    return api;
  }

  /* ---------------- mistake diagnosis ---------------- */
  function circDiff(a, b) {
    var d = Math.abs(a - b) % 60;
    return Math.min(d, 60 - d);
  }
  /** What a child would read if they swapped the hands of clock (h, m). */
  function swappedReading(h, m) {
    if (m % 5 !== 0) return null;
    var hh = m / 5 || 12;
    var deg = (h % 12) * 30 + m * 0.5;
    var mm = Math.round(deg / 6) % 60;
    return { h: hh, m: mm };
  }
  function countOn(m) {
    var base = m - (m % 5);
    var list = [];
    for (var k = base + 1; k <= m; k++) list.push(two(k));
    return { base: base, list: list };
  }
  function numberFor(min) {
    return min / 5 || 12;
  }
  /** "45 → 46, 47, 48" or "on the 9 → 45" */
  function minuteWorking(m) {
    if (m % 5 === 0) return 'long hand on the ' + numberFor(m) + ' → ' + two(m);
    var c = countOn(m);
    return two(c.base) + ' → ' + c.list.join(', ');
  }
  function hourWorking(h, m) {
    return 'short hand ' + (m === 0 ? 'on ' : 'past ') + h + ' → ' + two(h);
  }

  /**
   * x: non-digital card data {kind, h, m}; d: digital card data {h, m}.
   * Returns { hint, tag }.
   */
  function diagnose(x, d, tries) {
    var strong = tries >= 1;
    var dt = ctDigital(d.h, d.m);
    if (x.kind === 'words') {
      var w = ctWords(x.h, x.m);
      if (x.m > 30 && d.h === ctNextHour(x.h) && d.m === x.m) {
        return {
          tag: "Matched a 'to' time to the wrong hour",
          hint: '"' + w + '" means the clock has not reached ' + ctNextHour(x.h) + ' yet. It is still in the ' + x.h + " o'clock hour." + (strong ? ' So the digital time starts with ' + two(x.h) + '.' : ''),
        };
      }
      if (x.m > 30 && d.h === ctNextHour(x.h)) {
        return {
          tag: "Matched a 'to' time to the wrong hour",
          hint: "A 'to' time is still in the hour before. \"" + w + '" is in the ' + x.h + " o'clock hour." + (strong ? ' Count on from the minutes to 60 to check.' : ''),
        };
      }
      if (d.h === x.h) {
        if (x.m > 30) {
          return {
            tag: 'Matched by the hour only',
            hint: 'The hour is right, but check the minutes. ' + (strong ? 'Count on from :' + two(d.m) + ' to 60. Do you get ' + (60 - x.m) + '?' : 'For a "to" time, count on from the minutes up to 60.'),
          };
        }
        return { tag: 'Matched by the hour only', hint: 'Both are in the ' + x.h + " o'clock hour, but the minutes are different." + (strong ? ' "' + w + '" has ' + two(x.m) + ' after the colon.' : ' Look after the colon.') };
      }
      return { tag: 'Matched two different times', hint: 'Find the hour first, then the minutes. ' + (strong ? '"' + w + '": which hour is it really in?' : 'Say the digital time out loud.') };
    }
    // analogue clock
    if (x.m > 30 && d.h === ctNextHour(x.h) && circDiff(d.m, x.m) <= 2) {
      return {
        tag: "Matched a 'to' time to the wrong hour",
        hint: 'Look at the short hand: it is ' + (x.m >= 45 ? 'nearly at ' : 'past halfway to ') + ctNextHour(x.h) + ', but it has not got there yet.' + (strong ? ' So the hour is still ' + two(x.h) + ', not ' + two(ctNextHour(x.h)) + '.' : ''),
      };
    }
    var sw = swappedReading(x.h, x.m);
    if (sw && sw.h === d.h && sw.h !== x.h && circDiff(sw.m, d.m) <= 2 && !(d.h === x.h && d.m === x.m)) {
      return {
        tag: 'Swapped hour and minute hands',
        hint: 'Careful! The long orange hand shows the minutes, and the short dark hand shows the hour.' + (strong ? ' On this clock the short hand points to ' + (x.m === 0 ? '' : 'just past ') + x.h + '.' : ''),
      };
    }
    if (d.h === x.h) {
      if (circDiff(d.m, x.m) <= 5) {
        var c = countOn(Math.max(d.m, x.m));
        return {
          tag: 'Confused 45 and 48 minutes',
          hint: 'So close! These minute hands are only a few marks apart. Count the small marks after the ' + numberFor(c.base) + ' one by one.' + (strong ? ' This clock shows :' + two(x.m) + ' (' + minuteWorking(x.m) + '), not :' + two(d.m) + '.' : ''),
        };
      }
      return {
        tag: 'Matched by the hour only',
        hint: 'The hour is right, but look at the long orange hand. Count in fives, then the small marks.' + (strong ? ' Here it shows ' + two(x.m) + ' minutes (' + minuteWorking(x.m) + ').' : ''),
      };
    }
    if (d.m === x.m) {
      return { tag: 'Read the wrong hour', hint: 'The minutes match, but the hour does not. Which number has the short hand just passed?' + (strong ? ' Here it is ' + x.h + '.' : '') };
    }
    return { tag: 'Matched two different times', hint: 'Find the hour first (short hand), then the minutes (long hand).' + (strong ? ' Does this clock really say ' + dt + '?' : '') };
  }

  /* ---------------- deck ---------------- */
  var deck = null;
  var PAIR = [
    { c: '#0b9e8f', bg: '#e3f8f5', t: 'A' },
    { c: '#7048e8', bg: '#efeafd', t: 'B' },
    { c: '#1c7ed6', bg: '#e5f1fc', t: 'C' },
    { c: '#c2255c', bg: '#fbe7ef', t: 'D' },
  ];
  var POOL_L3 = [[1, 20], [12, 5], [2, 39], [6, 54], [10, 44], [7, 37], [8, 34], [1, 52], [5, 9], [2, 38], [9, 41], [3, 50], [11, 25], [6, 20], [10, 48], [5, 7], [7, 19], [11, 52]];
  var RISING = [[1, 23], [2, 34], [3, 45], [4, 56]];

  function buildDeck() {
    var used = {};
    var q = [];
    function mark(ts) {
      ts.forEach(function (t) {
        used[key(t.h, t.m)] = true;
      });
    }
    // Level 1 (3 questions): o'clock, half past, quarter past/to, all different hours.
    var swapAt = U.rand(0, 2);
    var hoursL1 = U.shuffle(U.range(1, 12));
    for (var i = 0; i < 3; i++) {
      var ts;
      if (i === swapAt) {
        // 3:00 and 12:15 look alike if the hands are swapped
        var third = U.pick([30, 45]);
        var hh = U.pick([1, 2, 5, 6, 7, 8, 9, 10, 11]);
        ts = [{ h: 3, m: 0 }, { h: 12, m: 15 }, { h: hh, m: third }];
      } else {
        ts = [];
        var types = U.shuffle([0, 15, 30, 45]).slice(0, 3);
        for (var k = 0; k < 3; k++) {
          var h;
          do {
            h = hoursL1.length ? hoursL1.pop() : U.rand(1, 12);
          } while (used[key(h, types[k])] || ts.some(function (t) { return t.h === h; }) || h === 3 || h === 12);
          ts.push({ h: h, m: types[k] });
        }
      }
      if (ts.some(function (t) { return used[key(t.h, t.m)]; })) {
        i--;
        continue;
      }
      mark(ts);
      q.push({ level: 1, times: U.shuffle(ts) });
    }
    // Level 2 (3 questions): all three in the same hour.
    var hoursL2 = U.shuffle([1, 2, 3, 5, 6, 7, 8, 9, 10, 11]).slice(0, 3);
    hoursL2.forEach(function (h, idx) {
      var ms;
      var guard = 0;
      do {
        guard++;
        if (idx !== 1) {
          var a = U.rand(1, 10) * 5; // 5..50
          var c;
          do {
            c = U.rand(1, 59);
          } while (circDiff(c, a) < 8 || circDiff(c, a + 3) < 8);
          ms = [a, a + 3, c];
        } else {
          ms = [U.rand(1, 59), U.rand(1, 59), U.rand(1, 59)];
        }
      } while (
        guard < 500 &&
        (circDiff(ms[0], ms[1]) < 3 ||
          circDiff(ms[0], ms[2]) < 3 ||
          circDiff(ms[1], ms[2]) < 3 ||
          ms.every(function (m) { return m % 5 === 0; }) ||
          ms.some(function (m) { return used[key(h, m)] || RISING.some(function (r) { return r[0] === h && r[1] === m; }); }))
      );
      var ts2 = ms.map(function (m) {
        return { h: h, m: m };
      });
      mark(ts2);
      q.push({ level: 2, times: U.shuffle(ts2) });
    });
    // Level 3: triples with words + one decoy digital (hour off by one for a 'to' time).
    var rising = U.shuffle(RISING).slice(0, 3).map(function (p) {
      return { h: p[0], m: p[1] };
    });
    var pool = U.shuffle(POOL_L3).map(function (p) {
      return { h: p[0], m: p[1] };
    });
    var a3 = [];
    var guard3 = 0;
    while (guard3++ < 1000) {
      a3 = [];
      var cand = U.shuffle(pool);
      for (var j = 0; j < cand.length && a3.length < 3; j++) {
        var t = cand[j];
        if (used[key(t.h, t.m)]) continue;
        if (a3.some(function (x) { return x.h === t.h; })) continue;
        if (rising.some(function (x) { return x.h === t.h && x.m === t.m; })) continue;
        a3.push(t);
      }
      if (a3.length === 3 && a3.filter(function (x) { return x.m > 30; }).length >= 2) break;
    }
    mark(a3);
    mark(rising);
    [a3, rising].forEach(function (ts3, idx) {
      var tos = ts3.filter(function (x) {
        return x.m > 30 && !ts3.some(function (y) { return y.h === ctNextHour(x.h) && y.m === x.m; });
      });
      var src = U.pick(tos);
      var decoy = { h: ctNextHour(src.h), m: src.m };
      q.push({ level: 3, times: U.shuffle(ts3), decoy: decoy, rising: idx === 1 });
    });
    return q;
  }

  /* ---------------- cards ---------------- */
  function clockCard(t, width) {
    var clk = makeClock({ hour: t.h, minute: t.m, width: width });
    var work = el('div', { class: 'ct-work' });
    var b = el('button', { type: 'button', class: 'ct-card ct-k-clock', 'data-kind': 'clock', 'data-key': key(t.h, t.m), 'data-h': t.h, 'data-m': t.m, 'aria-label': 'Analogue clock' }, clk.svg, work);
    return { el: b, kind: 'clock', h: t.h, m: t.m, key: key(t.h, t.m), clock: clk, work: work };
  }
  function digitalCard(t, isDecoy) {
    var k = isDecoy ? 'decoy' : key(t.h, t.m);
    var work = el('div', { class: 'ct-work' });
    var b = el('button', { type: 'button', class: 'ct-card ct-k-digital', 'data-kind': 'digital', 'data-key': k, 'data-h': t.h, 'data-m': t.m }, el('span', { class: 'ct-digital' }, ctDigital(t.h, t.m)), work);
    return { el: b, kind: 'digital', h: t.h, m: t.m, key: k, work: work };
  }
  function wordsCard(t) {
    var work = el('div', { class: 'ct-work' });
    var b = el('button', { type: 'button', class: 'ct-card ct-k-words', 'data-kind': 'words', 'data-key': key(t.h, t.m), 'data-h': t.h, 'data-m': t.m }, el('span', { class: 'ct-words' }, ctWords(t.h, t.m)), work);
    return { el: b, kind: 'words', h: t.h, m: t.m, key: key(t.h, t.m), work: work };
  }
  function setPair(card, p) {
    card.el.classList.add('ct-matched');
    card.el.style.borderColor = p.c;
    card.el.style.background = p.bg;
    if (!card.badge) {
      card.badge = el('span', { class: 'ct-badge', style: { background: p.c } }, p.t);
      card.el.appendChild(card.badge);
    }
  }
  function chip(text, cls) {
    return el('span', { class: 'chip ct-chip ' + (cls || '') }, text);
  }

  /* ---------------- practice ---------------- */
  function renderPractice(stage, api) {
    if (!deck || api.index === 0 || !deck[api.index]) deck = buildDeck();
    var Q = deck[api.index];
    var triple = Q.level === 3;
    var clocks = [];
    var digitals = [];
    var words = [];
    var colorOf = {};
    Q.times.forEach(function (t, i) {
      colorOf[key(t.h, t.m)] = PAIR[i];
    });
    var cw = triple ? 140 : 160;
    U.shuffle(Q.times).forEach(function (t) {
      clocks.push(clockCard(t, cw));
    });
    var dts = Q.times.map(function (t) {
      return digitalCard(t, false);
    });
    if (Q.decoy) dts.push(digitalCard(Q.decoy, true));
    digitals = U.shuffle(dts);
    if (triple) {
      words = U.shuffle(Q.times).map(function (t) {
        return wordsCard(t);
      });
    }
    var all = clocks.concat(digitals, words);

    if (Q.level === 1) api.say('Find the twins! Click a clock, then the digital time that matches it.');
    else if (Q.level === 2) api.say('All the same hour! Look closely at the long orange hand.', 'think');
    else if (Q.rising) api.say('Special times! Leave off the first 0 and the digits go up, like 2:34. Match each clock and word card to its digital time.', 'think');
    else api.say('Match each clock and each word card to its digital time. One digital time has no twin!', 'think');

    var promptHtml = triple ? 'Join each <b>clock</b> and each <b>word card</b> to a <b>digital time</b>.' : 'Click a <b>clock</b>, then its <b>digital twin</b>.';
    stage.appendChild(MQ.ui.prompt(promptHtml));
    stage.appendChild(el('div', { class: 'ct-row ct-row-clocks' }, clocks.map(function (c) { return c.el; })));
    stage.appendChild(el('div', { class: 'ct-row ct-row-digital' }, digitals.map(function (c) { return c.el; })));
    if (triple) stage.appendChild(el('div', { class: 'ct-row ct-row-words' }, words.map(function (c) { return c.el; })));

    var needed = clocks.length + words.length;
    var made = 0;
    var sel = null;
    var done = false;

    function select(c) {
      if (sel) sel.el.classList.remove('ct-sel');
      sel = c;
      if (c) c.el.classList.add('ct-sel');
    }
    function flash(c) {
      c.el.classList.remove('ct-wrong');
      void c.el.offsetWidth;
      c.el.classList.add('ct-wrong');
      api.later(function () {
        c.el.classList.remove('ct-wrong');
      }, 900);
    }
    function onCard(c) {
      if (done || api.isAnswered()) return;
      if (c.matched) {
        api.feedback('That card already has its twin. Pick another one.', 'info');
        return;
      }
      if (!sel) {
        select(c);
        MQ.sound('click');
        api.feedback(c.kind === 'digital' ? 'Now click the clock' + (triple ? ' or word card' : '') + ' that shows ' + ctDigital(c.h, c.m) + '.' : 'Now click its digital twin.', 'info');
        return;
      }
      if (sel === c) {
        select(null);
        api.feedback('Card put back. Pick a card to start a match.', 'info');
        return;
      }
      if (sel.kind === c.kind || (sel.kind !== 'digital' && c.kind !== 'digital')) {
        select(c);
        MQ.sound('click');
        api.feedback(triple ? 'Every match joins a card to a digital time. Now click a digital time.' : 'Now click a digital time.', 'info');
        return;
      }
      var x = sel.kind === 'digital' ? c : sel;
      var d = sel.kind === 'digital' ? sel : c;
      select(null);
      if (x.key === d.key) {
        var p = colorOf[x.key];
        x.matched = true;
        setPair(x, p);
        setPair(d, p);
        d.links = (d.links || 0) + 1;
        if (d.links >= (triple ? 2 : 1)) d.matched = true;
        made++;
        if (made >= needed) {
          done = true;
          all.forEach(function (k) {
            k.el.disabled = true;
          });
          digitals.forEach(function (k) {
            if (k.key === 'decoy') k.el.classList.add('ct-decoy');
          });
          api.check(true, triple ? 'Every twin found! ' + (Q.decoy ? ctDigital(Q.decoy.h, Q.decoy.m) + ' had no twin.' : '') : 'All twins found!');
        } else {
          MQ.sound('pop');
          api.feedback('Twins! ' + ctDigital(d.h, d.m) + ' matches. Keep going.', 'good');
        }
        return;
      }
      flash(x);
      flash(d);
      var dg = diagnose(x, d, api.tries());
      api.check(false, dg.hint, dg.tag);
    }
    all.forEach(function (c) {
      c.el.addEventListener('click', function () {
        onCard(c);
      });
    });

    api.onReveal(function () {
      done = true;
      select(null);
      Q.times.forEach(function (t) {
        var k = key(t.h, t.m);
        var p = colorOf[k];
        all.forEach(function (c) {
          if (c.key === k) setPair(c, p);
        });
      });
      clocks.forEach(function (c) {
        c.clock.markNumber(c.h);
        c.clock.halo('hour');
        var co = countOn(c.m);
        if (c.m % 5 === 0) c.clock.dot(c.m, 'ct-dot ct-dot5');
        else {
          c.clock.dot(co.base, 'ct-dot ct-dot5');
          for (var k2 = co.base + 1; k2 <= c.m; k2++) c.clock.dot(k2);
        }
        c.work.appendChild(chip(hourWorking(c.h, c.m), 'ct-chip-h'));
        c.work.appendChild(chip(minuteWorking(c.m), 'ct-chip-m'));
      });
      words.forEach(function (c) {
        if (c.m > 30) c.work.appendChild(chip(two(c.m) + ' → 60 is ' + (60 - c.m) + ' · still ' + c.h + " o'clock hour", 'ct-chip-m'));
      });
      digitals.forEach(function (c) {
        c.el.disabled = true;
        if (c.key === 'decoy') {
          c.el.classList.add('ct-decoy');
          c.work.appendChild(chip('no twin', 'ct-chip-x'));
        }
      });
      clocks.forEach(function (c) {
        c.el.disabled = true;
      });
      words.forEach(function (c) {
        c.el.disabled = true;
      });
      var lines = Q.times.map(function (t) {
        return ctDigital(t.h, t.m) + (Q.level === 2 ? ' (' + minuteWorking(t.m) + ')' : '') + (triple ? ' = ' + ctWords(t.h, t.m) : '');
      });
      var msg = 'Hour first (short hand), then minutes (long hand): ' + lines.join(' · ') + '.';
      if (Q.decoy) msg += ' ' + ctDigital(Q.decoy.h, Q.decoy.m) + ' has no twin: a "to" time stays in the hour before.';
      api.feedback(msg, 'info');
    });
  }

  /* ---------------- learn screens ---------------- */
  function learnHourMinute(stage, api) {
    api.lockNext();
    api.say('This clock and this digital clock show the same time. Click the HOUR part of the digital time.');
    var H = 4;
    var M = 17;
    var clk = makeClock({ hour: H, minute: M, pad: 34, width: 290, hits: true });
    var dHour = el('button', { type: 'button', class: 'ct-dpart', 'data-part': 'hour' }, '04');
    var dMin = el('button', { type: 'button', class: 'ct-dpart', 'data-part': 'minute' }, '17');
    var digital = el('div', { class: 'ct-digital ct-digital-big' }, dHour, el('span', null, ':'), dMin);
    var cap = el('div', { class: 'ct-cap' });
    var side = el('div', { class: 'ct-side' }, el('div', { class: 'ct-help' }, 'Digital clock'), digital, cap);
    stage.appendChild(el('div', { class: 'ct-wrap' }, el('div', { class: 'ct-clockbox' }, el('div', { class: 'ct-help' }, '🏠 The kitchen clock'), clk.svg), side));
    var step = 0;
    function doHour() {
      if (step !== 0) return;
      step = 1;
      MQ.sound('pop');
      dHour.classList.add('ct-on-h');
      clk.halo('hour');
      clk.markNumber(4);
      cap.appendChild(el('div', { class: 'ct-capline' }, chip('short hand just past 4', 'ct-chip-h'), el('span', { class: 'ct-arrow' }, '→'), chip('04', 'ct-chip-h')));
      api.say('The short hand has just gone past 4, so the hour is 04. Now click the MINUTES part.', 'happy');
      api.feedback('Hour: 04. Now click the minutes part (after the colon) or the long orange hand.', 'info');
    }
    function doMinute() {
      if (step === 0) {
        api.feedback('That is the minutes part. Find the hour first: the number before the colon, or the short hand.', 'info');
        return;
      }
      if (step !== 1) return;
      step = 2;
      MQ.sound('pop');
      dMin.classList.add('ct-on-m');
      clk.halo('minute');
      var line = el('div', { class: 'ct-capline' });
      cap.appendChild(line);
      var seq = [5, 10, 15, 16, 17];
      seq.forEach(function (v, i) {
        api.later(function () {
          if (v % 5 === 0) {
            clk.dot(v, 'ct-dot ct-dot5');
            clk.label(v, String(v), clk.r + 20, 'ct-lab ct-lab5', 17);
          } else {
            clk.dot(v);
            if (v === M) clk.label(v, String(v), clk.r + 24, 'ct-lab', 16);
          }
          if (i > 0) line.appendChild(el('span', { class: 'ct-arrow' }, i === 3 ? '→' : ','));
          line.appendChild(chip(String(v), v % 5 === 0 ? 'ct-chip-5' : 'ct-chip-m'));
          MQ.sound('click');
          if (i === seq.length - 1) {
            cap.appendChild(el('div', { class: 'ct-words ct-result' }, '17 minutes past 4 = 04:17'));
            api.say('Count in fives: 5, 10, 15. Then the small marks: 16, 17. So the minutes are 17!', 'cheer');
            api.feedback('Same time, two kinds of clock: 04:17.', 'good');
            api.unlockNext();
          }
        }, 550 * (i + 1));
      });
    }
    dHour.addEventListener('click', doHour);
    clk.hourHit.addEventListener('click', doHour);
    dMin.addEventListener('click', doMinute);
    clk.minuteHit.addEventListener('click', doMinute);
  }

  function zoomView(t) {
    var z = makeClock({ hour: t.h, minute: t.m, pad: 10 });
    // crop around the 9 and the 10 (r=120, centre 130,130)
    z.svg.setAttribute('viewBox', '-36 46 126 117');
    z.svg.setAttribute('width', 170);
    z.svg.classList.add('ct-zoom');
    return z;
  }

  function learnZoom(stage, api) {
    api.lockNext();
    api.say('These two clocks look nearly the same! Click each clock to look closer.', 'think');
    var times = U.shuffle([{ h: 4, m: 45 }, { h: 4, m: 48 }]);
    var zoomed = 0;
    var ready = false;
    var finished = false;
    var cards = times.map(function (t, i) {
      var clk = makeClock({ hour: t.h, minute: t.m, width: 190 });
      var face = el('button', { type: 'button', class: 'ct-card ct-zface', 'data-key': key(t.h, t.m), 'data-h': t.h, 'data-m': t.m, 'aria-label': 'Clock ' + (i ? 'B' : 'A') }, clk.svg);
      var slot = el('div', { class: 'ct-zslot' }, el('span', null, '🔍 Click the clock to look closer'));
      var cap = el('div', { class: 'ct-zcap' });
      var box = el('div', { class: 'ct-zbox' }, el('div', { class: 'ct-help' }, 'Clock ' + (i ? 'B' : 'A')), el('div', { class: 'ct-zpair' }, face, el('div', { class: 'ct-zright' }, slot, cap)));
      var c = { t: t, face: face, slot: slot, cap: cap, box: box, shown: false };
      face.addEventListener('click', function () {
        if (!c.shown) {
          c.shown = true;
          MQ.sound('pop');
          MQ.clear(slot);
          var z = zoomView(t);
          slot.appendChild(z.svg);
          slot.classList.add('ct-zon');
          z.dot(45, 'ct-dot ct-dot5');
          z.label(45, '45', 136, 'ct-lab ct-lab5', 13);
          cap.appendChild(chip('45', 'ct-chip-5'));
          var extra = t.m - 45;
          for (var k = 1; k <= extra; k++) {
            (function (k) {
              api.later(function () {
                z.dot(45 + k);
                z.label(45 + k, String(45 + k), k % 2 ? 150 : 134, 'ct-lab', 12);
                cap.appendChild(el('span', { class: 'ct-arrow' }, k === 1 ? '→' : ','));
                cap.appendChild(chip(String(45 + k), 'ct-chip-m'));
                MQ.sound('click');
              }, 500 * k);
            })(k);
          }
          api.later(function () {
            cap.appendChild(el('div', { class: 'ct-zres' }, extra ? extra + ' marks past the 9 → ' + ctDigital(t.h, t.m) : 'right on the 9 → ' + ctDigital(t.h, t.m)));
            zoomed++;
            if (zoomed === 2 && !ready) {
              ready = true;
              api.say('Now click the clock that shows 04:48.', 'happy');
              ask.style.visibility = 'visible';
            } else if (!ready) {
              api.feedback('Now look closer at the other clock too.', 'info');
            }
          }, 500 * extra + 400);
          return;
        }
        if (!ready || finished) return;
        if (t.m === 48) {
          finished = true;
          face.classList.add('ct-good');
          MQ.sound('correct');
          api.say('Yes! 3 small marks past the 9: 46, 47, 48. That is 04:48.', 'cheer');
          api.feedback('45 is right on the 9. 48 is 3 marks further on. Always count the small marks!', 'good');
          api.unlockNext();
        } else {
          MQ.sound('wrong');
          api.feedback('That long hand is right on the 9, so it shows 04:45. Find the one 3 marks past the 9.', 'info');
        }
      });
      return c;
    });
    var ask = el('div', { class: 'ct-ask' }, 'Which clock shows ', el('span', { class: 'ct-digital' }, '04:48'), ' ?');
    ask.style.visibility = 'hidden';
    stage.appendChild(ask);
    stage.appendChild(el('div', { class: 'ct-zrow' }, cards.map(function (c) { return c.box; })));
  }

  MQ.register('clock-twins', {
    learn: [learnHourMinute, learnZoom],
    practice: { count: 8, render: renderPractice },
  });

  var css = [
    '.ct-wrap{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:18px 34px;width:100%}',
    '.ct-clockbox{flex:0 1 290px;max-width:100%;display:flex;flex-direction:column;align-items:center;gap:4px}',
    '.ct-side{flex:1 1 280px;max-width:420px;min-width:0;display:flex;flex-direction:column;align-items:center;gap:12px}',
    '.ct-clock{display:block;user-select:none;-webkit-user-select:none}',
    '.ct-help{font-weight:800;color:var(--ink-soft);font-size:1rem}',
    '.ct-hit{stroke:transparent;fill:none;cursor:pointer;pointer-events:stroke;stroke-linecap:round}',
    '.ct-hit:hover{stroke:rgba(255,209,102,.35)}',
    '.ct-halo{stroke:#ffd166;stroke-opacity:.75;stroke-linecap:round}',
    '.ct-hourmark{fill:#ffe08a}',
    '.ct-dot{fill:#e85d04;stroke:#fff;stroke-width:1.5}',
    '.ct-dot5{fill:#0b9e8f}',
    '.ct-lab{fill:#a63f00}',
    '.ct-lab5{fill:#0b6e66}',
    '.ct-digital{font-family:"Courier New",monospace;font-weight:800;font-size:2rem;background:#1b2a4a;color:#7CFC9A;border-radius:12px;padding:4px 14px;letter-spacing:2px;display:inline-flex;align-items:center;line-height:1.2}',
    '.ct-digital-big{font-size:3rem;padding:6px 16px;gap:2px}',
    '.ct-dpart{font:inherit;color:inherit;background:transparent;border:3px dashed rgba(124,252,154,.45);border-radius:10px;padding:0 6px;cursor:pointer;letter-spacing:2px}',
    '.ct-dpart:hover{background:rgba(124,252,154,.15)}',
    '.ct-dpart.ct-on-h{background:#ffd166;color:#1b2a4a;border-style:solid;border-color:#ffd166}',
    '.ct-dpart.ct-on-m{background:#e85d04;color:#fff;border-style:solid;border-color:#e85d04}',
    '.ct-cap{display:flex;flex-direction:column;align-items:center;gap:10px;min-height:110px}',
    '.ct-capline{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center}',
    '.ct-chip{font-weight:800;font-size:1.05rem;padding:3px 10px}',
    '.ct-chip-h{background:#fff3c4;border-color:#f2c94c;color:#1b2a4a}',
    '.ct-chip-m{background:#ffe8d6;border-color:#e85d04;color:#a63f00}',
    '.ct-chip-5{background:#d9f5f1;border-color:#2ec4b6;color:#0b6e66}',
    '.ct-chip-x{background:#f1f3f5;border-color:#adb5bd;color:#495057}',
    '.ct-arrow{font-weight:800;font-size:1.2rem;color:var(--ink-soft)}',
    '.ct-words{font-size:1.25rem;font-weight:800;color:var(--ink)}',
    '.ct-result{background:#fff;border:3px solid var(--good);border-radius:14px;padding:6px 14px}',
    '.ct-ask{font-size:1.35rem;font-weight:800;display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.ct-zrow{display:flex;flex-wrap:wrap;justify-content:center;gap:16px 26px;width:100%}',
    '.ct-zbox{display:flex;flex-direction:column;align-items:center;gap:4px;min-width:0;max-width:100%}',
    '.ct-zpair{display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.ct-zright{display:flex;flex-direction:column;align-items:center;gap:6px;width:180px;max-width:100%}',
    '.ct-zslot{width:170px;height:158px;max-width:100%;border:3px dashed var(--line);border-radius:16px;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:800;color:var(--ink-soft);padding:8px;box-sizing:border-box;background:#fff}',
    '.ct-zslot.ct-zon{border:3px solid #1b2a4a;padding:0;overflow:hidden}',
    '.ct-zoom{display:block}',
    '.ct-zcap{display:flex;flex-wrap:wrap;gap:4px;align-items:center;justify-content:center;min-height:34px}',
    '.ct-zcap .ct-chip{font-size:.95rem;padding:2px 7px}',
    '.ct-zres{width:100%;text-align:center;font-weight:800;color:#0b6e66}',
    '.ct-row{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;gap:12px 18px;width:100%}',
    '.ct-card{position:relative;background:#fff;border:3px solid var(--line);border-radius:16px;padding:6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;font:inherit;color:inherit;transition:box-shadow .15s,border-color .15s;max-width:100%}',
    '.ct-card:hover:not(:disabled){border-color:#f2a900}',
    '.ct-card:disabled{cursor:default}',
    '.ct-card.ct-sel{border-color:#f2a900;box-shadow:0 0 0 4px #ffe08a}',
    '.ct-card.ct-good{border-color:var(--good);box-shadow:0 0 0 4px var(--good-bg)}',
    '.ct-card.ct-wrong{border-color:#e03131 !important;animation:ct-shake .45s}',
    '.ct-card.ct-decoy{opacity:.55}',
    '.ct-k-digital{padding:8px 10px}',
    '.ct-k-words{padding:8px 14px;min-width:140px}',
    '.ct-k-words .ct-words{font-size:1.15rem}',
    '.ct-badge{position:absolute;top:-11px;right:-11px;width:28px;height:28px;border-radius:50%;color:#fff;font-weight:800;font-size:1rem;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.25)}',
    '.ct-work{display:flex;flex-direction:column;align-items:center;gap:3px;max-width:170px}',
    '.ct-work:empty{display:none}',
    '.ct-work .ct-chip{font-size:.8rem;padding:1px 6px;text-align:center;line-height:1.25}',
    '.ct-k-words .ct-work{max-width:240px}',
    '@keyframes ct-shake{20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}',
    '@media (max-width:900px){.ct-k-digital .ct-digital{font-size:1.6rem;padding:3px 10px}.ct-row{gap:10px 12px}}',
    '@media (max-width:700px){.ct-digital{font-size:1.6rem}.ct-digital-big{font-size:2.4rem}.ct-row{gap:10px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'clock-twins' }, css));
})();

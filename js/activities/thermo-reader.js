/* Thermometer Check: read horizontal and vertical thermometers in °C, round to the nearest
 * labelled number, temperature differences and a day-temperature story (Unit 13.3 Temperature). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  /* ------------------------------------------------------------------ *
   * Scales. label = labelled every n °C; tick = small line every n °C (0 = none).
   * ------------------------------------------------------------------ */
  var SC = {
    t10: { min: 0, max: 40, label: 10, tick: 5 }, // labels in 10s, unlabelled 5s
    t5: { min: 0, max: 40, label: 5, tick: 1 }, // labels in 5s, 1 °C ticks
    t2: { min: 0, max: 30, label: 2, tick: 1 }, // labels in 2s, 1 °C ticks
    t5w: { min: 0, max: 50, label: 5, tick: 1 }, // workbook style 0-50
    t10bare: { min: 0, max: 40, label: 10, tick: 0 }, // labels in 10s, no small lines
    t10one: { min: 0, max: 40, label: 10, tick: 1 }, // labels in 10s, 1 °C ticks
    t100: { min: 0, max: 100, label: 10, tick: 5 }, // ice and boiling water
    gaps: { min: 0, max: 40, label: 40, tick: 5, allMajor: true }, // only 0 and 40 labelled
  };

  function nearestLabel(v, step) {
    // exactly halfway rounds up
    return Math.floor(v / step + 0.5) * step;
  }
  function labelBelow(v, step) {
    return Math.floor(v / step) * step;
  }
  function placeFor(v) {
    if (v <= 7) return 'in the fridge';
    if (v <= 14) return 'outside on a cold morning';
    if (v <= 19) return 'in the school hall';
    if (v <= 26) return 'in the classroom';
    return 'in the sunny garden';
  }
  function parseTemp(raw) {
    var s = String(raw == null ? '' : raw).trim().toLowerCase();
    s = s.replace(/\s*(degrees?\s*(celsius|c)?|°\s*c?|celsius|c)\.?$/, '').trim();
    return U.parseNum(s);
  }

  /* ------------------------------------------------------------------ *
   * Thermometer drawing (to scale). Returns a controller T.
   * o: {orient:'h'|'v', scale, len, value}
   * ------------------------------------------------------------------ */
  function thermo(o) {
    var sc = o.scale;
    var H = o.orient !== 'v';
    var len = o.len || (H ? 600 : 300);
    var span = sc.max - sc.min;
    var T = { scale: sc, horiz: H, len: len, ox: 0, oy: 0, labels: {}, ticks: {} };
    var g = S('g', { class: 'thr-thermo' });
    var x0 = 70, cT = 60, cx = 70, top = 46, y0 = top + len;
    T.W = H ? x0 + len + 72 : 250;
    T.H = H ? cT + 60 : y0 + 58;
    T.along = function (v) {
      return H ? x0 + ((v - sc.min) / span) * len : y0 - ((v - sc.min) / span) * len;
    };
    // point on the "hop side" (above a horizontal tube, left of a vertical one)
    T.P = function (a, off) {
      return H ? { x: a, y: cT - off } : { x: cx - off, y: a };
    };
    // point on the "scale side" (below / right)
    T.Q = function (a, off) {
      return H ? { x: a, y: cT + off } : { x: cx + off, y: a };
    };
    var bulb = H ? { x: 32, y: cT } : { x: cx, y: y0 + 32 };
    if (H) g.appendChild(S('rect', { class: 'thr-tube', x: 22, y: cT - 11, width: x0 + len + 18 - 22, height: 22, rx: 11 }));
    else g.appendChild(S('rect', { class: 'thr-tube', x: cx - 11, y: top - 20, width: 22, height: y0 + 32 - (top - 20), rx: 11 }));
    g.appendChild(S('circle', { class: 'thr-bulb', cx: bulb.x, cy: bulb.y, r: 19 }));
    var red = S('rect', { class: 'thr-red', 'data-thr-red': '1' });
    g.appendChild(red);
    var tg = S('g', { class: 'thr-scale' });
    var step = sc.tick || sc.label;
    for (var v = sc.min; v <= sc.max; v += step) {
      var a = T.along(v);
      var isLab = sc.labels ? sc.labels.indexOf(v) !== -1 : v % sc.label === 0;
      var major = sc.allMajor || v % sc.label === 0;
      var p1 = T.Q(a, 11), p2 = T.Q(a, 11 + (major ? 20 : 11));
      var line = S('line', { class: major ? 'thr-tick' : 'thr-tick thr-minor', x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, 'data-v': v });
      tg.appendChild(line);
      T.ticks[v] = line;
      if (isLab) {
        var t = H
          ? S('text', { class: 'thr-lbl', x: a, y: cT + 52, 'text-anchor': 'middle' }, String(v))
          : S('text', { class: 'thr-lbl', x: cx + 38, y: a + 6, 'text-anchor': 'start' }, String(v));
        tg.appendChild(t);
        T.labels[v] = t;
      }
    }
    g.appendChild(tg);
    g.appendChild(H ? S('text', { class: 'thr-unit', x: x0 + len + 30, y: cT + 7, 'text-anchor': 'start' }, '°C') : S('text', { class: 'thr-unit', x: cx, y: top - 28, 'text-anchor': 'middle' }, '°C'));
    var over = S('g', { class: 'thr-over' });
    g.appendChild(over);
    T.g = g;
    T.over = over;
    T.value = null;
    var setHooks = [];
    T.onSet = function (fn) {
      setHooks.push(fn);
    };
    T.set = function (val) {
      T.value = val;
      var a = T.along(val);
      red.setAttribute('data-val', val);
      if (H) {
        red.setAttribute('x', bulb.x);
        red.setAttribute('y', cT - 5.5);
        red.setAttribute('width', Math.max(0, a - bulb.x));
        red.setAttribute('height', 11);
      } else {
        red.setAttribute('x', cx - 5.5);
        red.setAttribute('y', a);
        red.setAttribute('width', 11);
        red.setAttribute('height', Math.max(0, bulb.y - a));
      }
      setHooks.forEach(function (fn) {
        fn(val, a);
      });
    };
    T.set(o.value == null ? sc.min : o.value);
    T.valAt = function (p) {
      var lx = p.x - T.ox, ly = p.y - T.oy;
      return H ? sc.min + ((lx - x0) / len) * span : sc.min + ((y0 - ly) / len) * span;
    };
    T.clear = function () {
      MQ.clear(over);
    };
    // gold ring at the end of the red line, plus a dashed guide across the ticks
    T.markEnd = function () {
      var a = T.along(T.value);
      var c = T.P(a, 0);
      var g1 = T.Q(a, 8), g2 = T.Q(a, 36);
      over.appendChild(S('line', { class: 'thr-guide', x1: g1.x, y1: g1.y, x2: g2.x, y2: g2.y }));
      over.appendChild(S('circle', { class: 'thr-ring', cx: c.x, cy: c.y, r: 10 }));
    };
    T.hiLabel = function (v, cls) {
      if (T.labels[v]) T.labels[v].classList.add(cls || 'thr-hi');
      if (T.ticks[v]) T.ticks[v].classList.add(cls || 'thr-hi');
    };
    // hops from one value to another, numbers written at each landing
    T.hops = function (from, to, step2, cls) {
      var n = 0;
      for (var x = from; x < to; x += step2) {
        var a1 = T.along(x), a2 = T.along(x + step2);
        var s1 = T.P(a1, 13), s2 = T.P(a2, 13), m = T.P((a1 + a2) / 2, 13 + Math.min(26, Math.abs(a2 - a1) * 0.7 + 6));
        over.appendChild(S('path', { class: 'thr-hop ' + (cls || ''), d: 'M' + s1.x + ' ' + s1.y + ' Q' + m.x + ' ' + m.y + ' ' + s2.x + ' ' + s2.y }));
        var tp = H ? { x: a2, y: cT - 42 } : { x: cx - 30, y: a2 + 5 };
        over.appendChild(S('text', { class: 'thr-hop-t', x: tp.x, y: tp.y, 'text-anchor': H ? 'middle' : 'end' }, String(x + step2)));
        n++;
      }
      return n;
    };
    // distance bracket between two values with a short text
    T.bracket = function (va, vb, text, cls) {
      var a1 = T.along(va), a2 = T.along(vb);
      var b = S('g', { class: 'thr-br ' + (cls || '') });
      if (H) {
        var y = cT - 24;
        b.appendChild(S('path', { d: 'M' + a1 + ' ' + (y + 8) + ' V' + y + ' H' + a2 + ' V' + (y + 8) }));
        b.appendChild(S('text', { x: (a1 + a2) / 2, y: y - 7, 'text-anchor': 'middle' }, text));
      } else {
        var x = cx + 92;
        b.appendChild(S('path', { d: 'M' + (x - 8) + ' ' + a1 + ' H' + x + ' V' + a2 + ' H' + (x - 8) }));
        b.appendChild(S('text', { x: x + 7, y: (a1 + a2) / 2 + 6, 'text-anchor': 'start' }, text));
      }
      over.appendChild(b);
    };
    // make labels clickable
    T.labelClick = function (cb) {
      Object.keys(T.labels).forEach(function (k) {
        var v = +k, a = T.along(v);
        var r = H ? S('rect', { class: 'thr-lhit', x: a - 19, y: cT + 30, width: 38, height: 30, rx: 8 }) : S('rect', { class: 'thr-lhit', x: cx + 31, y: a - 15, width: 44, height: 28, rx: 8 });
        r.addEventListener('click', function () {
          cb(v, r);
        });
        g.appendChild(r);
        T.labels[v].lhit = r;
      });
    };
    return T;
  }

  function thermoSvg(T, cls) {
    var root = S('svg', { viewBox: '0 0 ' + T.W + ' ' + T.H, class: 'thr-svg ' + (T.horiz ? 'thr-h' : 'thr-v') + (cls ? ' ' + cls : ''), role: 'img', 'aria-label': 'thermometer' });
    root.appendChild(T.g);
    T.root = root;
    return root;
  }

  // Drag the end of the red line (snaps to 1 °C). Returns {moved(), lock(), buttons}.
  function makeDraggable(T, api, onChange) {
    var H = T.horiz, sc = T.scale;
    var state = { moved: false, locked: false };
    var a0 = T.along(sc.min), a1 = T.along(sc.max);
    var hit = H
      ? S('rect', { class: 'thr-hit', x: a0 - 30, y: 22, width: a1 - a0 + 60, height: 80 })
      : S('rect', { class: 'thr-hit', x: 30, y: a1 - 30, width: 90, height: a0 - a1 + 60 });
    var knob = S('g', { class: 'thr-knob' });
    knob.appendChild(S('circle', { r: 14 }));
    knob.appendChild(S('text', { x: 0, y: 6, 'text-anchor': 'middle' }, H ? '⇔' : '⇕'));
    T.g.appendChild(knob);
    T.g.appendChild(hit);
    function place(v, a) {
      var c = T.P(a, 0);
      knob.setAttribute('transform', 'translate(' + c.x + ',' + c.y + ')');
    }
    T.onSet(place);
    place(T.value, T.along(T.value));
    function setV(v) {
      if (state.locked) return;
      v = U.clamp(Math.round(v), sc.min, sc.max);
      state.moved = true;
      if (v !== T.value) {
        T.set(v);
        if (onChange) onChange(v);
      }
    }
    api.cleanup(
      MQ.ui.drag(T.root, hit, {
        start: function (p) {
          setV(T.valAt(p));
        },
        move: function (p) {
          setV(T.valAt(p));
        },
      })
    );
    function nudge(d) {
      if (state.locked) return;
      api.sound('click');
      setV(T.value + d);
    }
    var less = el('button', { class: 'btn btn-ghost thr-nudge', type: 'button', title: 'Colder', onclick: function () { nudge(-1); } }, H ? '◀ 1' : '▼ 1');
    var more = el('button', { class: 'btn btn-ghost thr-nudge', type: 'button', title: 'Hotter', onclick: function () { nudge(1); } }, H ? '1 ▶' : '▲ 1');
    return {
      moved: function () {
        return state.moved;
      },
      buttons: [less, more],
      lock: function () {
        state.locked = true;
        hit.style.cursor = 'default';
        knob.setAttribute('visibility', 'hidden');
        less.disabled = true;
        more.disabled = true;
      },
    };
  }

  // Answer box with °C. Empty or non-number boxes get a gentle api.feedback, not a wrong try.
  function answerBox(api, onNum, opts) {
    opts = opts || {};
    var input = el('input', { class: 'num-input thr-in', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': opts.label || 'Your answer', placeholder: '?' });
    var btn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    var row = el('div', { class: 'num-row' }, opts.prefix ? el('span', { class: 'num-prefix' }, opts.prefix) : null, input, el('span', { class: 'num-unit' }, opts.unit || '°C'), btn);
    function submit() {
      if (input.disabled) return;
      if (input.value.trim() === '') {
        api.feedback('Type a number in the box first.', 'info');
        input.focus();
        return;
      }
      var n = parseTemp(input.value);
      if (isNaN(n)) {
        api.feedback('Type just the number, like 25.', 'info');
        input.focus();
        return;
      }
      var ok = onNum(n);
      input.classList.remove('good', 'bad');
      input.classList.add(ok ? 'good' : 'bad');
      if (ok) disable();
    }
    function disable() {
      input.disabled = true;
      btn.disabled = true;
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
      } catch (e) {}
    }, 40);
    return {
      el: row,
      input: input,
      disable: disable,
      show: function (v) {
        input.value = v;
        input.classList.remove('bad');
        input.classList.add('good');
        disable();
      },
    };
  }

  function chips(parts, cls) {
    var row = el('div', { class: 'thr-chips ' + (cls || '') });
    parts.forEach(function (p) {
      if (p === '→' || p === '+' || p === '−' || p === '=') row.appendChild(el('span', { class: 'thr-op' }, p));
      else row.appendChild(el('span', { class: 'chip' }, String(p)));
    });
    return row;
  }

  function oclock(h) {
    return h === 12 ? '12 o’clock (midnight)' : h + ' o’clock';
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  var FACTS = [
    { key: 'ice', value: 0, what: 'a glass of melting ice', icon: '🧊', fact: 'Melting ice is 0 °C.' },
    { key: 'boil', value: 100, what: 'a pan of boiling water', icon: '♨️', fact: 'Water boils at 100 °C.' },
    { key: 'tea', value: 70, what: 'a hot cup of tea', icon: '☕', fact: 'A hot cup of tea is about 70 °C.' },
    { key: 'bath', value: 40, what: 'a warm bath', icon: '🛁', fact: 'A warm bath is about 40 °C.' },
  ];
  var PAIRS = [
    ['Monday', 'Tuesday'],
    ['the kitchen', 'the bedroom'],
    ['Sam’s garden', 'Mia’s garden'],
    ['the hall', 'the library'],
  ];
  var TOWNS = [
    ['Lake Town', 'Desert Town'],
    ['Hill Town', 'Palm Town'],
  ];
  var MONTHS = ['April', 'May', 'June', 'July'];

  function genRead(scaleKey, used) {
    var sc = SC[scaleKey], pool = [];
    for (var v = sc.min + sc.label; v < sc.max; v += sc.label) if (scaleKey !== 't5' || v % 10) pool.push(v);
    pool = pool.filter(function (v) {
      return !used[v];
    });
    var v2 = U.pick(pool);
    used[v2] = 1;
    return { type: 'read', scale: scaleKey, value: v2, orient: U.pick(['h', 'v']), onLabel: true };
  }
  function genTick(scaleKey, used) {
    var sc = SC[scaleKey], pool = [];
    for (var v = 11; v <= Math.min(34, sc.max - 1); v++) if (v % sc.label && !used[v]) pool.push(v);
    var v2 = U.pick(pool);
    used[v2] = 1;
    return v2;
  }

  function buildDeck() {
    var used = {};
    var l1 = [genRead('t10', used), genRead('t5', used)];
    // hotter / colder: values on labels, different labelling on the two thermometers
    var pair = U.pick(PAIRS);
    var va = 5 * U.rand(2, 7), vb;
    do vb = 5 * U.rand(2, 7);
    while (Math.abs(vb - va) < 5);
    var hc = { type: 'hotter', ask: U.pick(['hotter', 'colder']), names: pair, values: [va, vb], scales: U.shuffle(['t5', 't10']) };
    l1.push(hc);
    var f = U.pick(FACTS);
    l1.push({ type: 'fact', scale: 't100', value: f.value, fact: f });
    l1 = U.shuffle(l1);

    var l2 = [
      { type: 'read', scale: 't5', value: genTick('t5', used), orient: 'h', onLabel: false },
      { type: 'read', scale: 't2', value: genTick('t2', used), orient: 'h', onLabel: false },
    ];
    var dk = U.pick(['t5', 't2']);
    l2.push({ type: 'drag', scale: dk, target: genTick(dk, used) });
    l2 = U.shuffle(l2);

    // level 3: one rounding question, then two of: missing labels, table, day story
    var r = Math.random(), round;
    if (r < 0.4) {
      round = { type: 'round', variant: 'r10', scale: 't10bare', orient: 'v', value: 10 * U.rand(1, 3) + U.pick([1, 2, 8, 9]) };
      if (round.value > 39) round.value = 38;
    } else if (r < 0.8) {
      var rv;
      do rv = U.rand(6, 49);
      while (rv % 5 === 0 || used[rv]);
      round = { type: 'round', variant: 'r5', scale: 't5w', orient: 'h', value: rv };
    } else {
      round = { type: 'round', variant: 'rhalf', scale: 't10one', orient: 'h', value: U.pick([15, 25, 35]) };
    }
    var others = U.shuffle(['missing', 'table', 'day']).slice(0, 2).map(function (t) {
      if (t === 'missing') {
        var k1, k2;
        do {
          k1 = U.rand(1, 7);
          k2 = U.rand(1, 7);
        } while (Math.abs(k1 - k2) < 2);
        return { type: 'missing', scale: 'gaps', ks: [Math.min(k1, k2), Math.max(k1, k2)] };
      }
      if (t === 'table') {
        var m = U.rand(0, 3), a = [], b = [], ai, bi;
        do {
          ai = U.rand(5, 18);
          bi = U.rand(28, 35);
        } while (ai % 10 <= bi % 10);
        for (var i = 0; i < 4; i++) {
          a.push(i === m ? ai : U.rand(5, 18));
          b.push(i === m ? bi : U.rand(28, 35));
        }
        return { type: 'table', towns: U.pick(TOWNS), month: m, a: a, b: b };
      }
      return { type: 'day', start: U.rand(15, 20), rise: U.rand(4, 8), hours: U.rand(3, 9), from: 10 };
    });
    return l1.concat(l2, [round], others);
  }

  function answerOf(q) {
    if (q.type === 'read' || q.type === 'fact') return q.value;
    if (q.type === 'drag') return q.target;
    if (q.type === 'hotter') {
      var hi = q.values[0] > q.values[1] ? 0 : 1;
      return q.names[q.ask === 'hotter' ? hi : 1 - hi];
    }
    if (q.type === 'round') return nearestLabel(q.value, SC[q.scale].label);
    if (q.type === 'missing') return [5 * q.ks[0], 5 * q.ks[1]];
    if (q.type === 'table') return q.b[q.month] - q.a[q.month];
    if (q.type === 'day') return q.start + q.rise - q.hours;
    return null;
  }

  /* ------------------------------------------------------------------ *
   * Practice renderers
   * ------------------------------------------------------------------ */
  function renderRead(stage, api, q) {
    var sc = SC[q.scale], v = q.value;
    var H = q.orient !== 'v';
    var place = placeFor(v);
    var labWord = { 10: '10s', 5: '5s', 2: '2s' }[sc.label];
    api.say(q.onLabel ? 'Where does the red line stop?' : 'Find the label before the end. Then count the small lines.', 'think');
    stage.appendChild(MQ.ui.prompt('This thermometer is <b>' + place + '</b>. What temperature does it show?'));
    var T = thermo({ orient: q.orient, scale: sc, value: v });
    stage.appendChild(el('div', { class: 'thr-pic' }, thermoSvg(T)));
    var below = labelBelow(v, sc.label);
    var box = answerBox(api, function (n) {
      if (n === v) {
        api.check(true, 'Yes! It shows ' + v + ' °C.');
        T.markEnd();
        return true;
      }
      var strong = api.tries() >= 1;
      var where = H ? 'under' : 'next to';
      if (q.onLabel) {
        if (n % sc.label === 0 && n !== v) {
          api.check(false, strong ? 'Put your finger on the end of the red line. Read the label ' + where + ' it.' : 'Look closely: which label is right ' + where + ' the end of the red line?', 'Read the wrong label');
        } else {
          api.check(false, strong ? 'The labels count in ' + labWord + '. The red line stops on a label. Read that label.' : 'The red line stops right on a label. Which number is it?', 'Counted ticks wrongly');
        }
        return false;
      }
      if (n === below) {
        api.check(false, strong ? 'Start at ' + below + ' and count on 1 for each small line until the red line stops.' : 'That is the label before the end. The red line goes a bit further. Count the small lines after ' + below + '.', 'Read the label before the end of the line');
      } else if (n === below + sc.label) {
        api.check(false, strong ? 'The red line stops before ' + n + '. Count on from ' + below + ' in 1s.' : 'The red line does not reach ' + n + ' yet. Look again at where it stops.', 'Rounded instead of reading exactly');
      } else {
        api.check(false, strong ? 'The line stops after ' + below + '. Each small line is 1 degree. Count on: ' + (below + 1) + ', …' : 'Each small line is 1 degree. Find the label just before the end of the red line, then count on in 1s.', 'Counted ticks wrongly');
      }
      return false;
    });
    stage.appendChild(box.el);
    api.onReveal(function () {
      T.markEnd();
      box.show(v);
      if (q.onLabel || v === below) {
        T.hiLabel(v);
        api.feedback('The red line stops exactly on the ' + v + ' label. It shows ' + v + ' °C.', 'info');
      } else {
        T.hiLabel(below);
        T.hops(below, v, 1);
        var cnt = [];
        for (var x = below; x <= v; x++) cnt.push(x);
        api.feedback('Start at the label ' + below + ', then count each small line: ' + cnt.slice(1).join(', ') + '. It shows ' + v + ' °C.', 'info');
      }
    });
  }

  function renderFact(stage, api, q) {
    var f = q.fact;
    api.say('This thermometer counts in 10s, up to 100.', 'think');
    stage.appendChild(MQ.ui.prompt(f.icon + ' This thermometer is in <b>' + f.what + '</b>. What does it show?'));
    var T = thermo({ orient: 'h', scale: SC.t100, value: q.value });
    stage.appendChild(el('div', { class: 'thr-pic' }, thermoSvg(T)));
    var box = answerBox(api, function (n) {
      if (n === q.value) {
        T.markEnd();
        api.check(true, 'Yes! ' + q.value + ' °C. ' + f.fact);
        return true;
      }
      var strong = api.tries() >= 1;
      var tag = q.value === 0 || q.value === 100 ? 'Did not know ice is 0 °C and boiling water is 100 °C' : 'Read the wrong label';
      if (q.value === 0) api.check(false, strong ? 'Melting ice is 0 °C. The red line stays in the bulb, at 0.' : 'The red line has not moved up the scale at all. Where does the scale start?', tag);
      else if (q.value === 100) api.check(false, strong ? 'Water boils at 100 °C. The red line goes right to the end.' : 'The red line goes all the way to the end of the scale. What is the last number?', tag);
      else api.check(false, strong ? 'Count the labels in 10s: 10, 20, 30… Stop where the red line stops.' : 'The labels count in 10s. Which label is under the end of the red line?', tag);
      return false;
    });
    stage.appendChild(box.el);
    api.onReveal(function () {
      T.markEnd();
      T.hiLabel(q.value);
      box.show(q.value);
      api.feedback('The red line stops at ' + q.value + '. ' + f.fact, 'info');
    });
  }

  function renderHotter(stage, api, q) {
    var ans = answerOf(q);
    api.say('Look at both red lines. Which is ' + q.ask + '?', 'think');
    stage.appendChild(MQ.ui.prompt('Which place is <b>' + q.ask + '</b>?'));
    var Ts = [];
    var wrap = el('div', { class: 'thr-stack' });
    q.names.forEach(function (name, i) {
      var T = thermo({ orient: 'h', scale: SC[q.scales[i]], value: q.values[i], len: 560 });
      Ts.push(T);
      wrap.appendChild(el('div', { class: 'thr-named' }, el('div', { class: 'thr-name' }, name), thermoSvg(T, 'thr-h-sm')));
    });
    stage.appendChild(wrap);
    var ch = MQ.ui.choices(
      q.names.map(function (n) {
        return { label: n, value: n };
      }),
      function (v) {
        if (v === ans) {
          ch.mark(v, 'good');
          ch.disable();
          Ts.forEach(function (T) {
            T.markEnd();
          });
          api.check(true, 'Yes! ' + ans + ' is ' + q.ask + '.');
        } else {
          ch.mark(v, 'bad');
          var strong = api.tries() >= 1;
          api.check(false, strong ? 'Read both: one shows ' + q.values[0] + ' °C and one shows ' + q.values[1] + ' °C. Which number is ' + (q.ask === 'hotter' ? 'bigger' : 'smaller') + '?' : q.ask === 'hotter' ? 'The longer the red line, the hotter it is. The labels are different, so read each one.' : 'The shorter the red line, the colder it is. The labels are different, so read each one.', 'Mixed up hotter and colder');
        }
      },
      { columns: 2 }
    );
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(ans, 'good');
      ch.disable();
      Ts.forEach(function (T, i) {
        T.markEnd();
        T.hiLabel(q.values[i]);
      });
      api.feedback(q.names[0] + ': ' + q.values[0] + ' °C. ' + q.names[1] + ': ' + q.values[1] + ' °C. So ' + ans + ' is ' + q.ask + '.', 'info');
    });
  }

  function renderDrag(stage, api, q) {
    var sc = SC[q.scale], t = q.target;
    var below = labelBelow(t, sc.label);
    api.say('Drag the red line to ' + t + ' °C. Then press Check.', 'think');
    stage.appendChild(MQ.ui.prompt('Show <b>' + t + ' °C</b> on the thermometer.'));
    var T = thermo({ orient: 'h', scale: sc, value: sc.min });
    stage.appendChild(el('div', { class: 'thr-pic' }, thermoSvg(T)));
    var d = makeDraggable(T, api);
    var check = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    stage.appendChild(el('div', { class: 'thr-btns' }, d.buttons[0], d.buttons[1], check));
    check.addEventListener('click', function () {
      if (api.isAnswered()) return;
      if (!d.moved()) {
        api.feedback('Drag the end of the red line along the scale first.', 'info');
        return;
      }
      var v = T.value;
      if (v === t) {
        d.lock();
        check.disabled = true;
        T.markEnd();
        api.check(true, 'Yes! That shows ' + t + ' °C.');
        return;
      }
      var strong = api.tries() >= 1;
      if (v === below) api.check(false, strong ? 'You are on ' + below + '. Now go on 1 small line at a time to ' + t + '.' : 'You stopped on the label ' + below + '. ' + t + ' is a bit further.', 'Read the label before the end of the line');
      else if (Math.abs(v - t) <= 3) api.check(false, strong ? 'Find ' + below + ', then count on in 1s: ' + (below + 1) + '… until you reach ' + t + '.' : 'Close! Count the small lines again. Each one is 1 degree. You are on ' + v + '.', 'Counted ticks wrongly');
      else api.check(false, strong ? 'Find the label ' + below + ' first. ' + t + ' is just after it.' : t + ' is between ' + below + ' and ' + (below + sc.label) + '. Move the line there.', 'Counted ticks wrongly');
    });
    api.onReveal(function () {
      T.set(t);
      d.lock();
      check.disabled = true;
      T.markEnd();
      T.hiLabel(below);
      T.hops(below, t, 1);
      var cnt = [];
      for (var x = below + 1; x <= t; x++) cnt.push(x);
      api.feedback('Find ' + below + ', then count on 1 for each small line: ' + cnt.join(', ') + '. The line stops at ' + t + ' °C.', 'info');
    });
  }

  function renderRound(stage, api, q) {
    var sc = SC[q.scale], v = q.value, step = sc.label;
    var ans = nearestLabel(v, step);
    var lo = labelBelow(v, step), hi = lo + step;
    var r10 = q.variant === 'r10';
    api.say(r10 ? 'There are no small lines here. Is the line nearer to one ten or the next?' : 'Which label is the red line nearest to?', 'think');
    stage.appendChild(MQ.ui.prompt(r10 ? 'Round this temperature to the <b>nearest 10 °C</b>.' : 'What is the temperature to the <b>nearest labelled number</b>?'));
    var T = thermo({ orient: q.orient, scale: sc, value: v });
    stage.appendChild(el('div', { class: 'thr-pic' }, thermoSvg(T)));
    if (q.variant === 'rhalf') stage.appendChild(el('div', { class: 'thr-tip' }, 'Remember: exactly halfway rounds up.'));
    var box = answerBox(api, function (n) {
      if (n === ans) {
        T.markEnd();
        api.check(true, 'Yes! ' + v + ' °C is nearest to ' + ans + ' °C.');
        return true;
      }
      var strong = api.tries() >= 1;
      if (q.variant === 'rhalf' && n === lo) {
        api.check(false, strong ? v + ' is exactly halfway between ' + lo + ' and ' + hi + '. Halfway rounds up.' : 'The line is exactly halfway. What do we do at halfway?', 'Rounded down at exactly halfway');
      } else if (n === lo || n === hi) {
        api.check(false, strong ? (r10 ? 'Find the middle between ' + lo + ' and ' + hi + '. Is the end of the line before or past the middle?' : 'Count the small steps from the end of the line to ' + lo + ', then to ' + hi + '. Which is fewer?') : 'Which label is closer to the end of the red line, ' + lo + ' or ' + hi + '?', 'Rounded to the wrong label');
      } else if (n === v || (n > lo && n < hi)) {
        api.check(false, strong ? 'Now round it: is it nearer ' + lo + ' or ' + hi + '?' : 'Good reading, but the answer must be a labelled number, like ' + lo + ' or ' + hi + '.', 'Gave the exact reading, not a label');
      } else {
        api.check(false, strong ? 'The red line ends between ' + lo + ' and ' + hi + '. Pick the nearer one.' : 'Find the two labels on each side of the end of the red line.', 'Rounded to the wrong label');
      }
      return false;
    });
    stage.appendChild(box.el);
    api.onReveal(function () {
      T.markEnd();
      T.bracket(lo, v, (v - lo) + ' away', ans === lo ? 'thr-br-good' : 'thr-br-far');
      T.bracket(v, hi, (hi - v) + ' away', ans === hi ? 'thr-br-good' : 'thr-br-far');
      T.hiLabel(ans);
      box.show(ans);
      var msg = 'The line stops at ' + v + ' °C. It is ' + (v - lo) + ' from ' + lo + ' and ' + (hi - v) + ' from ' + hi + '. ';
      msg += v - lo === hi - v ? 'Exactly halfway, so we round up to ' + ans + ' °C.' : 'It is nearer ' + ans + ', so ' + ans + ' °C.';
      api.feedback(msg, 'info');
    });
  }

  function renderMissing(stage, api, q) {
    var ks = q.ks, ans = answerOf(q);
    api.say('Only 0 and 40 have labels. Every gap is the same size.', 'think');
    stage.appendChild(MQ.ui.prompt('Fill in the missing labels <b>A</b> and <b>B</b>.'));
    var T = thermo({ orient: 'h', scale: SC.gaps, value: 0 });
    var letters = ['A', 'B'];
    ks.forEach(function (k, i) {
      var a = T.along(5 * k);
      T.g.appendChild(S('rect', { class: 'thr-qbox', x: a - 18, y: 92, width: 36, height: 26, rx: 7 }));
      T.g.appendChild(S('text', { class: 'thr-qlet', x: a, y: 111, 'text-anchor': 'middle' }, letters[i]));
    });
    stage.appendChild(el('div', { class: 'thr-pic' }, thermoSvg(T)));
    var ins = letters.map(function (L) {
      return el('input', { class: 'num-input thr-in thr-in-sm', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Label ' + L, placeholder: '?' });
    });
    var check = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    stage.appendChild(el('div', { class: 'num-row' }, el('span', { class: 'num-prefix' }, 'A ='), ins[0], el('span', { class: 'num-prefix thr-gap-l' }, 'B ='), ins[1], check));
    function submit() {
      if (api.isAnswered()) return;
      if (ins[0].value.trim() === '' || ins[1].value.trim() === '') {
        api.feedback('Fill in both boxes, A and B.', 'info');
        return;
      }
      var n = ins.map(function (i) {
        return parseTemp(i.value);
      });
      if (isNaN(n[0]) || isNaN(n[1])) {
        api.feedback('Type just the numbers.', 'info');
        return;
      }
      ins.forEach(function (inp, i) {
        inp.classList.remove('good', 'bad');
        inp.classList.add(n[i] === ans[i] ? 'good' : 'bad');
      });
      if (n[0] === ans[0] && n[1] === ans[1]) {
        ins.forEach(function (i) {
          i.disabled = true;
        });
        check.disabled = true;
        api.check(true, 'Yes! The labels count in 5s.');
        return;
      }
      var strong = api.tries() >= 1;
      if (n[0] === ks[0] && n[1] === ks[1]) api.check(false, strong ? 'There are 8 gaps from 0 to 40. Count in 5s: 0, 5, 10… Do you land on 40?' : 'Each gap is not 1 degree. Counting in 1s would end at 8, not 40.', 'Counted ticks wrongly');
      else if (n[0] === 10 * ks[0] && n[1] === 10 * ks[1]) api.check(false, strong ? 'Count in 5s from 0: 0, 5, 10, 15… Check you reach 40 at the end.' : 'Counting in 10s would end at 80, not 40. Try smaller jumps.', 'Counted ticks wrongly');
      else api.check(false, strong ? 'A is ' + ks[0] + ' gaps after 0. Count ' + ks[0] + ' jumps of 5.' : 'Count the gaps from 0 to 40. Which jump lands exactly on 40: 1s, 5s or 10s?', 'Counted ticks wrongly');
    }
    check.addEventListener('click', submit);
    ins.forEach(function (i) {
      i.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });
    });
    api.onReveal(function () {
      ins.forEach(function (inp, i) {
        inp.value = ans[i];
        inp.classList.remove('bad');
        inp.classList.add('good');
        inp.disabled = true;
      });
      check.disabled = true;
      T.hops(0, 40, 5);
      var seq = [];
      for (var x = 0; x <= 40; x += 5) seq.push(x);
      stage.appendChild(chips(seq.join(' → ').split(' ')));
      api.feedback('8 equal gaps from 0 to 40. Jumps of 5 land exactly on 40, so count in 5s. A = ' + ans[0] + ', B = ' + ans[1] + '.', 'info');
    });
  }

  // number line counting on from a to b: to the next ten, then in tens, then the rest
  function countOnParts(a, b) {
    var parts = [], x = a;
    var t = Math.ceil(a / 10) * 10;
    if (t > b) t = b;
    if (t > x) {
      parts.push({ from: x, to: t });
      x = t;
    }
    while (x + 10 <= b) {
      parts.push({ from: x, to: x + 10 });
      x += 10;
    }
    if (x < b) parts.push({ from: x, to: b });
    return parts;
  }
  function numberLine(a, b) {
    var lo = a - 1, hi = b + 1, W = 720, left = 30, right = W - 30;
    var X = function (v) {
      return left + ((v - lo) / (hi - lo)) * (right - left);
    };
    var root = S('svg', { viewBox: '0 0 ' + W + ' 120', class: 'thr-svg thr-nl' });
    root.appendChild(S('line', { class: 'thr-nl-line', x1: left, y1: 84, x2: right, y2: 84 }));
    for (var v = lo; v <= hi; v++) root.appendChild(S('line', { class: 'thr-nl-tick', x1: X(v), y1: 78, x2: X(v), y2: 90 }));
    var parts = countOnParts(a, b);
    var marks = [a];
    parts.forEach(function (p) {
      var x1 = X(p.from), x2 = X(p.to);
      root.appendChild(S('path', { class: 'thr-hop thr-hop-nl', d: 'M' + x1 + ' 76 Q' + (x1 + x2) / 2 + ' ' + (76 - Math.min(52, 14 + (x2 - x1) * 0.5)) + ' ' + x2 + ' 76' }));
      root.appendChild(S('text', { class: 'thr-nl-jump', x: (x1 + x2) / 2, y: Math.max(16, 76 - Math.min(52, 14 + (x2 - x1) * 0.5) / 2 - 10), 'text-anchor': 'middle' }, '+' + (p.to - p.from)));
      marks.push(p.to);
    });
    marks.forEach(function (m) {
      root.appendChild(S('line', { class: 'thr-nl-mark', x1: X(m), y1: 74, x2: X(m), y2: 94 }));
      root.appendChild(S('text', { class: 'thr-nl-num', x: X(m), y: 113, 'text-anchor': 'middle' }, String(m)));
    });
    return { svg: root, parts: parts };
  }

  function renderTable(stage, api, q) {
    var m = q.month, a = q.a[m], b = q.b[m], ans = b - a;
    api.say('Find the two temperatures for ' + MONTHS[m] + '. Count on from the smaller one.', 'think');
    stage.appendChild(MQ.ui.prompt('What is the <b>difference</b> between the two towns in <b>' + MONTHS[m] + '</b>?'));
    var head = el('tr', null, el('th', null, 'Town'));
    MONTHS.forEach(function (mo, i) {
      head.appendChild(el('th', { class: i === m ? 'thr-col' : '' }, mo));
    });
    var rows = [head];
    [q.a, q.b].forEach(function (arr, r) {
      var tr = el('tr', null, el('th', null, q.towns[r]));
      arr.forEach(function (v, i) {
        tr.appendChild(el('td', { class: i === m ? 'thr-col' : '' }, v + ' °C'));
      });
      rows.push(tr);
    });
    stage.appendChild(el('div', { class: 'thr-tablewrap' }, el('table', { class: 'thr-table' }, rows)));
    var work = el('div', { class: 'thr-work' });
    var box = answerBox(api, function (n) {
      if (n === ans) {
        api.check(true, 'Yes! From ' + a + ' to ' + b + ' is ' + ans + ' degrees.');
        return true;
      }
      var strong = api.tries() >= 1;
      if (n === a + b) api.check(false, strong ? 'Count on from ' + a + ' to ' + b + ': first to ' + Math.ceil(a / 10) * 10 + ', then in 10s.' : 'You added them. The difference is how far it is from ' + a + ' up to ' + b + '.', 'Added instead of finding the difference');
      else if (Math.abs(n - ans) === 10) api.check(false, strong ? 'Count on: ' + a + ' to ' + Math.ceil(a / 10) * 10 + ', then jumps of 10, then the last bit to ' + b + '.' : 'Nearly! Check how many jumps of 10 there are.', 'Counted on wrongly');
      else if (q.a.some(function (x, i) { return i !== m && q.b[i] - x === n; })) api.check(false, 'That is the difference for a different month. Use the ' + MONTHS[m] + ' column.', 'Used the wrong month');
      else api.check(false, strong ? 'Start at ' + a + '. Jump to ' + Math.ceil(a / 10) * 10 + ', then in 10s, then on to ' + b + '. Add up the jumps.' : 'Count on from ' + a + ' to ' + b + '. A number line helps.', 'Counted on wrongly');
      return false;
    }, { unit: 'degrees' });
    stage.appendChild(box.el);
    stage.appendChild(work);
    api.onReveal(function () {
      var nl = numberLine(a, b);
      work.appendChild(nl.svg);
      var parts = [];
      nl.parts.forEach(function (p, i) {
        if (i) parts.push('+');
        parts.push(p.to - p.from);
      });
      parts.push('=', ans);
      work.appendChild(chips(parts));
      box.show(ans);
      api.feedback('Count on from ' + a + ' to ' + b + ': ' + nl.parts.map(function (p) { return '+' + (p.to - p.from); }).join(', ') + '. That is ' + ans + ' degrees.', 'info');
    });
  }

  // small analogue clock
  function clockFace() {
    var root = S('svg', { viewBox: '0 0 120 120', class: 'thr-clock' });
    root.appendChild(S('circle', { class: 'thr-clock-face', cx: 60, cy: 60, r: 54 }));
    for (var h = 1; h <= 12; h++) {
      var ang = (h / 12) * Math.PI * 2;
      root.appendChild(S('text', { class: 'thr-clock-n', x: 60 + Math.sin(ang) * 40, y: 60 - Math.cos(ang) * 40 + 5, 'text-anchor': 'middle' }, String(h)));
    }
    var hand = S('line', { class: 'thr-clock-h', x1: 60, y1: 60, x2: 60, y2: 32 });
    root.appendChild(S('line', { class: 'thr-clock-m', x1: 60, y1: 60, x2: 60, y2: 18 }));
    root.appendChild(hand);
    root.appendChild(S('circle', { cx: 60, cy: 60, r: 4, fill: '#1b2a4a' }));
    return {
      svg: root,
      set: function (hr) {
        hand.setAttribute('transform', 'rotate(' + (hr % 12) * 30 + ' 60 60)');
      },
    };
  }

  function renderDay(stage, api, q) {
    var s = q.start, r = q.rise, h = q.hours, peak = s + r, T_END = 3 + h, ans = s + r - h;
    api.say('Use the buttons to move through the day. Count the hours.', 'think');
    stage.appendChild(MQ.ui.prompt('At 10 o’clock it is <b>' + s + ' °C</b>. By 3 o’clock it is <b>' + r + ' degrees warmer</b>. Then it gets <b>1 degree colder every hour</b>. What is the temperature at <b>' + oclock(T_END) + '</b>?'));
    var clock = clockFace();
    var timeT = el('div', { class: 'thr-time' }, '10 o’clock');
    var T = thermo({ orient: 'h', scale: SC.t5, value: s, len: 520 });
    stage.appendChild(el('div', { class: 'thr-dayrow' }, el('div', { class: 'thr-clockbox' }, clock.svg, timeT), el('div', { class: 'thr-pic thr-daypic' }, thermoSvg(T))));
    var log = el('div', { class: 'thr-chips thr-log' });
    var st = { hr: 10, warmed: false, busy: false };
    clock.set(10);
    var warmB = el('button', { class: 'btn btn-ghost', type: 'button' }, '☀️ Warm up to 3 o’clock');
    var hourB = el('button', { class: 'btn btn-ghost', type: 'button', disabled: true }, '1 hour later ▶');
    var resetB = el('button', { class: 'btn btn-ghost', type: 'button' }, '↺ Start again');
    function showTime() {
      timeT.textContent = oclock(st.hr);
      clock.set(st.hr);
      hourB.disabled = !st.warmed || st.hr >= 12 || st.busy || api.isAnswered();
      resetB.disabled = st.busy || api.isAnswered();
      warmB.disabled = st.warmed || st.busy || api.isAnswered();
    }
    function warm(done) {
      st.busy = true;
      st.warmed = true;
      showTime();
      var k = 0;
      (function stepUp() {
        k++;
        T.set(s + k);
        if (k < r) api.later(stepUp, 140);
        else {
          st.hr = 3;
          st.busy = false;
          log.appendChild(el('span', { class: 'chip thr-chip-up' }, '3 o’clock: +' + r));
          showTime();
          if (done) done();
        }
      })();
    }
    function hour() {
      if (st.hr >= 12) return;
      st.hr++;
      T.set(T.value - 1);
      log.appendChild(el('span', { class: 'chip thr-chip-down' }, st.hr + ': −1'));
      showTime();
    }
    warmB.addEventListener('click', function () {
      if (!st.warmed) warm();
    });
    hourB.addEventListener('click', hour);
    resetB.addEventListener('click', function () {
      if (st.busy || api.isAnswered()) return;
      st.hr = 10;
      st.warmed = false;
      T.set(s);
      MQ.clear(log);
      showTime();
    });
    stage.appendChild(el('div', { class: 'thr-btns' }, warmB, hourB, resetB));
    stage.appendChild(log);
    showTime();
    var box = answerBox(api, function (n) {
      if (n === ans) {
        api.check(true, 'Yes! ' + s + ' + ' + r + ' = ' + peak + ', then ' + h + ' hours colder: ' + ans + ' °C.');
        showTime();
        return true;
      }
      var strong = api.tries() >= 1;
      if (n === peak) api.check(false, strong ? 'After 3 o’clock it gets 1 degree colder each hour. Count the hours from 3 to ' + T_END + '.' : 'That is the temperature at 3 o’clock. It keeps getting colder after that.', 'Forgot the temperature falls');
      else if (n === s - h) api.check(false, strong ? 'First add the ' + r + ' degrees: ' + s + ' + ' + r + '. Then count back.' : 'It got warmer first. Add the ' + r + ' degrees before counting back.', 'Forgot the temperature rose first');
      else if (Math.abs(n - ans) <= 2) api.check(false, strong ? 'Count the hours on the clock: 4, 5, 6… up to ' + T_END + '. That is ' + h + ' hours, so count back ' + h + '.' : 'Nearly! Count the hours from 3 o’clock to ' + T_END + ' o’clock again.', 'Miscounted the hours');
      else if (n === peak + h || n === s - r) api.check(false, strong ? 'Warmer means add, colder means take away. ' + s + ' + ' + r + ', then count back.' : 'Check which way it goes: up by ' + r + ', then down 1 each hour.', 'Added and took away the wrong way');
      else api.check(false, strong ? 'Press Warm up, then press 1 hour later until the clock shows ' + T_END + '. Read the thermometer.' : 'Use the buttons: warm up first, then go 1 hour at a time.', 'Miscounted the hours');
      return false;
    });
    stage.appendChild(box.el);
    api.onReveal(function () {
      box.show(ans);
      function finish() {
        while (st.hr < T_END) hour();
        st.busy = false;
        showTime();
        T.markEnd();
        var back = [peak];
        for (var x = peak - 1; x >= ans; x--) back.push(x);
        stage.insertBefore(chips([s, '+', r, '=', peak]), box.el);
        stage.insertBefore(chips(back.join(' → ').split(' '), 'thr-chips-back'), box.el);
        api.feedback(s + ' + ' + r + ' = ' + peak + ' at 3 o’clock. From 3 to ' + T_END + ' is ' + h + ' hours, so count back ' + h + ': ' + ans + ' °C.', 'info');
      }
      st.hr = 10;
      T.set(s);
      MQ.clear(log);
      st.warmed = false;
      warm(finish);
    });
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */
  var THINGS = [
    { icon: '🍧', name: 'ice lolly', lo: 0, hi: 10, at: 0, row: 1, say: 'An ice lolly is very cold, about 0 °C.', hot: 'Too warm! The lolly would melt. Try much colder.', cold: 'Put it on the scale, at the cold end.' },
    { icon: '🏫', name: 'classroom', lo: 15, hi: 30, at: 20, row: 0, say: 'A classroom is about 20 °C.', hot: 'Too hot for a classroom! Try cooler.', cold: 'Brrr, too cold for a classroom. Try warmer.' },
    { icon: '☀️', name: 'sunny garden', lo: 25, hi: 45, at: 35, row: 1, say: 'A sunny garden can be about 35 °C.', hot: 'That is hotter than any garden! Try lower.', cold: 'Too cold for a sunny day. Try warmer.' },
    { icon: '☕', name: 'cup of tea', lo: 50, hi: 95, at: 70, row: 0, say: 'A hot cup of tea is about 70 °C.', hot: 'Nearly boiling! Tea we drink is a bit cooler.', cold: 'Too cold for hot tea. Try much hotter.' },
  ];

  function learnHotCold(stage, api) {
    api.say('Temperature is measured in degrees Celsius, °C. Drag each picture to a good place.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Hot and cold', 'Temperature tells us how hot or cold something is. We use <b>degrees Celsius</b>, written <b>°C</b>.'));
    var OY = 128;
    var T = thermo({ orient: 'h', scale: SC.t100, value: 0 });
    T.oy = OY;
    T.g.setAttribute('transform', 'translate(0,' + OY + ')');
    var root = S('svg', { viewBox: '0 0 ' + T.W + ' ' + (OY + T.H), class: 'thr-svg thr-h' });
    root.appendChild(T.g);
    var pins = S('g');
    root.appendChild(pins);
    var placed = 0;
    var homes = U.shuffle([120, 290, 460, 630]);
    var facts = el('div', { class: 'thr-facts', hidden: true }, el('span', { class: 'chip' }, '🧊 Melting ice: 0 °C'), el('span', { class: 'chip' }, '♨️ Boiling water: 100 °C'));
    THINGS.forEach(function (it, i) {
      var home = { x: homes[i], y: 38 };
      var g = S('g', { class: 'thr-item' });
      g.appendChild(S('rect', { x: -54, y: -30, width: 108, height: 62, rx: 12 }));
      g.appendChild(S('text', { class: 'thr-item-i', x: 0, y: 6, 'text-anchor': 'middle' }, it.icon));
      g.appendChild(S('text', { class: 'thr-item-t', x: 0, y: 25, 'text-anchor': 'middle' }, it.name));
      var pos = { x: home.x, y: home.y };
      function moveTo(x, y) {
        pos = { x: x, y: y };
        g.setAttribute('transform', 'translate(' + x + ',' + y + ')');
      }
      moveTo(home.x, home.y);
      root.appendChild(g);
      var done = false;
      api.cleanup(
        MQ.ui.drag(root, g, {
          move: function (p, dx, dy) {
            if (done) return;
            moveTo(home.x + dx, home.y + dy);
          },
          end: function (p) {
            if (done) return;
            root.appendChild(g); // bring to front on release only
            if (p.y < 110) {
              moveTo(home.x, home.y);
              api.feedback('Drop it on the thermometer, where you think it belongs.', 'info');
              return;
            }
            var v = T.valAt(p);
            if (v >= it.lo - 2 && v <= it.hi + 2) {
              done = true;
              g.classList.add('thr-item-done');
              g.style.cursor = 'default';
              var x = T.along(it.at), y = it.row ? 92 : 36;
              pins.appendChild(S('line', { class: 'thr-pin', x1: x, y1: y + 30, x2: x, y2: OY + 48 }));
              moveTo(x, y);
              api.sound('pop');
              placed++;
              if (placed === THINGS.length) {
                facts.hidden = false;
                T.hiLabel(0);
                T.hiLabel(100);
                api.say('Two facts to remember: melting ice is 0 °C. Boiling water is 100 °C.', 'cheer');
                api.feedback('Great! Ice melts at 0 °C and water boils at 100 °C.', 'good');
                api.unlockNext();
              } else api.feedback(it.say, 'good');
            } else {
              moveTo(home.x, home.y);
              api.sound('wrong');
              api.feedback(v > it.hi ? it.hot : it.cold, 'try');
            }
          },
        })
      );
    });
    stage.appendChild(el('div', { class: 'thr-pic' }, root));
    stage.appendChild(facts);
  }

  function learnLonger(stage, api) {
    api.say('The longer the red line, the hotter it is. Which is hotter?');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Longer line, hotter', 'Read where the red line <b>stops</b>.'));
    var A = thermo({ orient: 'h', scale: SC.t5, value: 15, len: 560 });
    var B = thermo({ orient: 'h', scale: SC.t5, value: 20, len: 560 });
    var top = el('div', { class: 'thr-stack' }, el('div', { class: 'thr-named' }, el('div', { class: 'thr-name' }, 'A'), thermoSvg(A, 'thr-h-sm')), el('div', { class: 'thr-named' }, el('div', { class: 'thr-name' }, 'B'), thermoSvg(B, 'thr-h-sm')));
    stage.appendChild(top);
    var part2 = el('div', { class: 'thr-part', hidden: true });
    var ch = MQ.ui.choices(['A', 'B'], function (v) {
      if (v === 'B') {
        ch.mark('B', 'good');
        ch.disable();
        A.markEnd();
        B.markEnd();
        api.sound('correct');
        api.feedback('A shows 15 °C and B shows 20 °C. B is hotter!', 'good');
        api.say('Now you! Drag the red line to show 25 °C.');
        api.later(function () {
          ch.hidden = true;
          part2.hidden = false;
        }, 900);
      } else {
        ch.mark('A', 'bad');
        api.sound('wrong');
        api.feedback('A’s red line is shorter. A shorter line is colder.', 'try');
      }
    }, { columns: 2 });
    stage.appendChild(ch);
    var C = thermo({ orient: 'h', scale: SC.t5, value: 0, len: 560 });
    part2.appendChild(el('div', { class: 'thr-named' }, el('div', { class: 'thr-name' }, 'You'), thermoSvg(C, 'thr-h-sm')));
    var d = makeDraggable(C, api);
    var check = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    part2.appendChild(el('div', { class: 'thr-btns' }, d.buttons[0], d.buttons[1], check));
    stage.appendChild(part2);
    check.addEventListener('click', function () {
      if (!d.moved()) {
        api.feedback('Drag the end of the red line first.', 'info');
        return;
      }
      if (C.value === 25) {
        d.lock();
        check.disabled = true;
        C.markEnd();
        api.sound('correct');
        api.feedback('25 °C! Hotter than A and B, so the line is longest.', 'good');
        api.say('Well done!', 'cheer');
        api.unlockNext();
      } else {
        api.sound('wrong');
        api.feedback('That shows ' + C.value + ' °C. Find the label 25 and stop the line there.', 'try');
      }
    });
  }

  function learnLabels(stage, api) {
    api.say('Same temperature, different labels. Each small line is 1 degree.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Different labels', 'Find the label before the end, then count the small lines.'));
    var cfg = [
      { sc: SC.t2, name: 'in 2s', opts: [16, 17, 18], from: 16 },
      { sc: { min: 0, max: 30, label: 5, tick: 1 }, name: 'in 5s', opts: [15, 17, 20], from: 15 },
    ];
    var done = 0;
    cfg.forEach(function (c) {
      var T = thermo({ orient: 'h', scale: c.sc, value: 17, len: 560 });
      var ch = MQ.ui.choices(c.opts.map(function (o) {
        return { label: o + ' °C', value: o };
      }), function (v) {
        if (v === 17) {
          ch.mark(v, 'good');
          ch.disable();
          T.markEnd();
          T.hiLabel(c.from);
          T.hops(c.from, 17, 1);
          api.sound('correct');
          done++;
          if (done === 2) {
            api.feedback('Both show 17 °C. The labels are different, but the temperature is the same.', 'good');
            api.say('Same line, same temperature!', 'cheer');
            api.unlockNext();
          } else api.feedback('Yes! ' + c.from + ', then count on to 17.', 'good');
        } else {
          ch.mark(v, 'bad');
          api.sound('wrong');
          api.feedback('Find ' + c.from + ', then count each small line until the red line stops.', 'try');
        }
      }, { columns: 3 });
      stage.appendChild(el('div', { class: 'thr-lab-row' }, el('div', { class: 'thr-named' }, el('div', { class: 'thr-name thr-name-wide' }, 'Labels ' + c.name), thermoSvg(T, 'thr-h-sm')), el('div', { class: 'thr-mini-ch' }, ch)));
    });
  }

  function learnNearest(stage, api) {
    api.say('Which label is the red line nearest to? Click it.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Nearest labelled number', 'Click the <b>label</b> nearest to the end of the red line.'));
    var T = thermo({ orient: 'h', scale: SC.t5, value: 13, len: 560 });
    stage.appendChild(el('div', { class: 'thr-pic' }, thermoSvg(T, 'thr-h-sm')));
    var part2 = el('div', { class: 'thr-part', hidden: true });
    stage.appendChild(part2);
    var step = 0;
    T.labelClick(function (v) {
      if (step !== 0) return;
      if (v === 15) {
        step = 1;
        T.markEnd();
        T.bracket(10, 13, '3 away', 'thr-br-far');
        T.bracket(13, 15, '2 away', 'thr-br-good');
        T.hiLabel(15);
        api.sound('correct');
        api.feedback('13 is 3 from 10 but only 2 from 15. So it rounds to 15 °C.', 'good');
        api.later(showHalf, 1200);
      } else {
        api.sound('wrong');
        api.feedback(v === 10 ? 'Count the small lines: 13 to 10 is 3 steps. 13 to 15 is…?' : 'Look at the labels on each side of the end: 10 and 15.', 'try');
      }
    });
    function showHalf() {
      api.say('Exactly halfway? We round up!', 'think');
      var T2 = thermo({ orient: 'h', scale: SC.t10one, value: 25, len: 560 });
      part2.appendChild(MQ.ui.prompt('25 °C is exactly halfway between 20 and 30. Click the label it rounds to.'));
      part2.appendChild(el('div', { class: 'thr-pic' }, thermoSvg(T2, 'thr-h-sm')));
      part2.hidden = false;
      var done = false;
      T2.labelClick(function (v) {
        if (done) return;
        if (v === 30) {
          done = true;
          T2.markEnd();
          T2.bracket(20, 25, '5 away', 'thr-br-far');
          T2.bracket(25, 30, '5 away', 'thr-br-good');
          T2.hiLabel(30);
          api.sound('correct');
          api.feedback('5 away from both! Exactly halfway rounds UP, so 25 °C → 30 °C.', 'good');
          api.say('Halfway rounds up. Let’s practise!', 'cheer');
          api.unlockNext();
        } else {
          api.sound('wrong');
          api.feedback(v === 20 ? 'It is 5 from 20 and 5 from 30. When it is exactly halfway, we round up.' : 'Look at the labels on each side: 20 and 30.', 'try');
        }
      });
    }
  }

  /* ------------------------------------------------------------------ *
   * Register
   * ------------------------------------------------------------------ */
  var deck = null;

  MQ.register('thermo-reader', {
    learn: [learnHotCold, learnLonger, learnLabels, learnNearest],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'read') return renderRead(stage, api, q);
        if (q.type === 'fact') return renderFact(stage, api, q);
        if (q.type === 'hotter') return renderHotter(stage, api, q);
        if (q.type === 'drag') return renderDrag(stage, api, q);
        if (q.type === 'round') return renderRound(stage, api, q);
        if (q.type === 'missing') return renderMissing(stage, api, q);
        if (q.type === 'table') return renderTable(stage, api, q);
        return renderDay(stage, api, q);
      },
    },
    _test: {
      buildDeck: buildDeck,
      answerOf: answerOf,
      scales: SC,
      countOnParts: countOnParts,
      deck: function () {
        return deck;
      },
    },
  });

  var css = [
    '.thr-svg{display:block;height:auto;max-width:100%;user-select:none;-webkit-user-select:none}',
    '.thr-h{width:720px}',
    '.thr-h-sm{width:640px}',
    '.thr-v{width:230px}',
    '.thr-nl{width:680px}',
    '.thr-pic{display:flex;justify-content:center;width:100%;max-width:100%}',
    '.thr-stack,.thr-part{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;max-width:100%}',
    '.thr-named{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;max-width:100%;min-width:0}',
    '.thr-named .thr-svg{flex:1 1 auto;min-width:0}',
    '.thr-name{flex:0 0 auto;min-width:44px;max-width:120px;padding:6px 10px;border-radius:12px;background:var(--paper-2);font-weight:800;text-align:center}',
    '.thr-name-wide{min-width:80px;font-size:.9rem}',
    '.thr-lab-row{display:flex;flex-direction:column;align-items:center;gap:4px;width:100%}',
    '.thr-mini-ch .choices{max-width:420px}',
    '.thr-mini-ch .choice{padding:8px 12px;font-size:1.1rem}',
    '.thr-btns{display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap}',
    '.thr-nudge{min-width:64px}',
    '.thr-tip{color:var(--ink-soft);font-weight:700}',
    '.thr-gap-l{margin-left:14px}',
    '.thr-in{width:110px}',
    '.thr-in-sm{width:90px}',
    '.thr-facts{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;font-size:1.15rem}',
    '.thr-chips{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;max-width:100%}',
    '.thr-op{font-weight:800;color:var(--ink-soft)}',
    '.thr-log{min-height:8px}',
    '.thr-chip-up{background:#ffe8d6}',
    '.thr-chip-down{background:#e3f0ff}',
    '.thr-work{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%}',
    '.thr-dayrow{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px;width:100%}',
    '.thr-daypic{flex:1 1 420px;max-width:640px;min-width:0}',
    '.thr-clockbox{display:flex;flex-direction:column;align-items:center;gap:2px}',
    '.thr-clock{width:104px;height:104px}',
    '.thr-time{font-weight:800}',
    '.thr-clock-face{fill:#fff;stroke:#1b2a4a;stroke-width:3}',
    '.thr-clock-n{font-size:13px;font-weight:700;fill:#1b2a4a}',
    '.thr-clock-h{stroke:#1b2a4a;stroke-width:5;stroke-linecap:round;transition:transform .25s}',
    '.thr-clock-m{stroke:#4a5a7d;stroke-width:3;stroke-linecap:round}',
    '.thr-tablewrap{max-width:100%;overflow-x:auto}',
    '.thr-table{border-collapse:collapse;background:#fff;font-size:1.1rem}',
    '.thr-table th,.thr-table td{border:2px solid var(--line);padding:6px 12px;text-align:center}',
    '.thr-table th{background:var(--paper-2)}',
    '.thr-table .thr-col{background:#fff4d6;font-weight:800}',
    '.thr-tube{fill:#fff;stroke:#7d8aa8;stroke-width:2.5}',
    '.thr-bulb{fill:#e63946;stroke:#b42531;stroke-width:2.5}',
    '.thr-red{fill:#e63946}',
    '.thr-tick{stroke:#1b2a4a;stroke-width:2.4}',
    '.thr-minor{stroke-width:1.4}',
    '.thr-tick.thr-hi{stroke:#e08900;stroke-width:4}',
    '.thr-lbl{font-size:18px;font-weight:700;fill:#1b2a4a;font-family:inherit}',
    '.thr-lbl.thr-hi{fill:#c45f00;font-size:21px;font-weight:800}',
    '.thr-unit{font-size:18px;font-weight:800;fill:#4a5a7d}',
    '.thr-guide{stroke:#e08900;stroke-width:2.5;stroke-dasharray:5 4}',
    '.thr-ring{fill:none;stroke:#e08900;stroke-width:3.5}',
    '.thr-hop{fill:none;stroke:#1f9d6b;stroke-width:2.5}',
    '.thr-hop-t{font-size:14px;font-weight:800;fill:#1f9d6b}',
    '.thr-br path{fill:none;stroke-width:2.5}',
    '.thr-br text{font-size:15px;font-weight:800}',
    '.thr-br-good path{stroke:#1f9d6b}.thr-br-good text{fill:#1f9d6b}',
    '.thr-br-far path{stroke:#9aa6c0}.thr-br-far text{fill:#6b7896}',
    '.thr-hit{fill:rgba(0,0,0,0);cursor:pointer}',
    '.thr-knob{pointer-events:none}',
    '.thr-knob circle{fill:#fff;stroke:#e63946;stroke-width:3}',
    '.thr-knob text{font-size:15px;font-weight:800;fill:#e63946}',
    '.thr-lhit{fill:rgba(255,183,3,0);cursor:pointer}',
    '.thr-lhit:hover{fill:rgba(255,183,3,.25)}',
    '.thr-qbox{fill:#fff4d6;stroke:#e08900;stroke-width:2}',
    '.thr-qlet{font-size:17px;font-weight:800;fill:#c45f00}',
    '.thr-item{cursor:grab}',
    '.thr-item rect{fill:#fff;stroke:#c9d3ee;stroke-width:2.5}',
    '.thr-item:hover rect{stroke:#e08900}',
    '.thr-item-done rect{stroke:#1f9d6b}',
    '.thr-item-i{font-size:26px}',
    '.thr-item-t{font-size:15px;font-weight:800;fill:#1b2a4a}',
    '.thr-pin{stroke:#1f9d6b;stroke-width:2;stroke-dasharray:4 3}',
    '.thr-nl-line{stroke:#1b2a4a;stroke-width:2.5}',
    '.thr-nl-tick{stroke:#9aa6c0;stroke-width:1.5}',
    '.thr-nl-mark{stroke:#1b2a4a;stroke-width:3}',
    '.thr-nl-num{font-size:16px;font-weight:800;fill:#1b2a4a}',
    '.thr-nl-jump{font-size:15px;font-weight:800;fill:#1f9d6b}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'thermo-reader' }, css));
})();

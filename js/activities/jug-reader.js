/* Fill the Jug: read and fill measuring jugs in ml and litres (Unit 13.2 Capacity). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  var FRAC = { 250: '¼ litre', 500: '½ litre', 750: '¾ litre', 1000: '1 litre' };
  var FRAC_CHOICES = [250, 500, 750, 1000].map(function (v) {
    return { label: FRAC[v], value: v };
  });

  /* ------------------------------------------------------------------ *
   * Helpers
   * ------------------------------------------------------------------ */

  // Scale marks for a jug. Every jug is drawn to scale from these values.
  function scaleMarks(kind, cap) {
    var m = [];
    var v;
    if (kind === 'q-ml' || kind === 'q-ml50') {
      if (kind === 'q-ml50') for (v = 50; v < 1000; v += 50) if (v % 250) m.push({ v: v });
      [250, 500, 750].forEach(function (x) {
        m.push({ v: x, label: x + ' ml', major: true });
      });
      m.push({ v: 1000, label: '1 litre', major: true });
    } else if (kind === 'frac') {
      [250, 500, 750, 1000].forEach(function (x) {
        m.push({ v: x, label: FRAC[x], major: true });
      });
    } else if (kind === 'h100' || kind === 'h50') {
      if (kind === 'h50') for (v = 50; v < 1000; v += 100) m.push({ v: v });
      for (v = 100; v <= 1000; v += 100) m.push({ v: v, label: v + ' ml', major: true });
    } else if (kind === 'litres') {
      for (v = 500; v < cap; v += 1000) m.push({ v: v });
      for (v = 1000; v <= cap; v += 1000) m.push({ v: v, label: v / 1000 + (v === 1000 ? ' litre' : ' litres'), major: true });
    }
    return m;
  }

  // Draw a measuring jug into svg. o: {x, yBot, w, hFull, cap, kind}
  function drawJug(svg, o) {
    var cap = o.cap || 1000;
    var hb = o.hFull + 34;
    var yTop = o.yBot - hb;
    var x = o.x;
    var w = o.w;
    var inner = o.yBot - 4;
    var g = S('g', { class: 'jgr-jug' });
    g.appendChild(
      S('path', {
        class: 'jgr-handle',
        d: 'M' + (x + w - 2) + ' ' + (yTop + 30) + ' C ' + (x + w + 50) + ' ' + (yTop + 34) + ', ' + (x + w + 50) + ' ' + (yTop + hb * 0.55) + ', ' + (x + w - 2) + ' ' + (yTop + hb * 0.6),
      })
    );
    g.appendChild(S('path', { class: 'jgr-glass', d: 'M' + (x - 14) + ' ' + (yTop - 6) + ' L' + x + ' ' + (yTop + 16) + ' L' + x + ' ' + (o.yBot - 12) + ' Q' + x + ' ' + o.yBot + ' ' + (x + 12) + ' ' + o.yBot + ' L' + (x + w - 12) + ' ' + o.yBot + ' Q' + (x + w) + ' ' + o.yBot + ' ' + (x + w) + ' ' + (o.yBot - 12) + ' L' + (x + w) + ' ' + yTop + ' L' + (x + 10) + ' ' + yTop }));
    var water = S('rect', { class: 'jgr-water', x: x + 4, y: inner, width: w - 8, height: 0, rx: 4 });
    var surf = S('line', { class: 'jgr-surf', x1: x + 4, x2: x + w - 4, y1: inner, y2: inner });
    g.appendChild(water);
    g.appendChild(surf);
    var guide = S('line', { class: 'jgr-guide', x1: x + 2, x2: x + w - 2, y1: 0, y2: 0, visibility: 'hidden' });
    var ticks = {};
    function yOf(v) {
      return inner - (v / cap) * o.hFull;
    }
    var tg = S('g');
    scaleMarks(o.kind, cap).forEach(function (m) {
      var y = yOf(m.v);
      var line = S('line', { class: m.major ? 'jgr-tick' : 'jgr-tick jgr-minor', x1: x, x2: x + (m.major ? 30 : 15), y1: y, y2: y });
      tg.appendChild(line);
      var text = null;
      if (m.label) {
        text = S('text', { class: 'jgr-lbl', x: x - 8, y: y + 5, 'text-anchor': 'end' }, m.label);
        tg.appendChild(text);
      }
      ticks[m.v] = { line: line, text: text, y: y, major: !!m.major };
    });
    g.appendChild(tg);
    g.appendChild(guide);
    svg.appendChild(g);
    var level = 0;
    var listeners = [];
    var jug = {
      g: g,
      x: x,
      w: w,
      cap: cap,
      yTop: yTop,
      yBot: o.yBot,
      ticks: ticks,
      yOf: yOf,
      valAt: function (y) {
        return ((inner - y) / o.hFull) * cap;
      },
      level: function () {
        return level;
      },
      set: function (v) {
        level = v;
        var y = yOf(v);
        water.setAttribute('y', y);
        water.setAttribute('height', Math.max(0, inner - y));
        surf.setAttribute('y1', y);
        surf.setAttribute('y2', y);
        surf.setAttribute('visibility', v > 0 ? 'visible' : 'hidden');
        listeners.forEach(function (f) {
          f(v, y);
        });
      },
      onSet: function (f) {
        listeners.push(f);
      },
      // Pour smoothly to v (steps with api.later so it stops when the screen changes).
      pour: function (api, v, done) {
        var from = level;
        var n = 12;
        var i = 0;
        function step() {
          i++;
          jug.set(i >= n ? v : from + ((v - from) * i) / n);
          if (i < n) api.later(step, 35);
          else if (done) done();
        }
        step();
      },
      highlight: function (v) {
        Object.keys(ticks).forEach(function (k) {
          ticks[k].line.classList.remove('jgr-hi');
          if (ticks[k].text) ticks[k].text.classList.remove('jgr-hi');
        });
        if (v == null) {
          guide.setAttribute('visibility', 'hidden');
          return;
        }
        var t = ticks[v];
        if (t) {
          t.line.classList.add('jgr-hi');
          if (t.text) t.text.classList.add('jgr-hi');
        }
        guide.setAttribute('y1', yOf(v));
        guide.setAttribute('y2', yOf(v));
        guide.setAttribute('visibility', 'visible');
      },
    };
    jug.set(0);
    return jug;
  }

  // Let the child drag the water surface up and down. Returns a controller.
  function makeFillable(svg, jug, api, opts) {
    var step = opts.step;
    var state = { touched: false, locked: false };
    var grip = S('g', { class: 'jgr-grip' });
    grip.appendChild(S('rect', { x: -26, y: -13, width: 52, height: 26, rx: 13 }));
    grip.appendChild(S('text', { x: 0, y: 6, 'text-anchor': 'middle' }, '⇕'));
    svg.appendChild(grip);
    function placeGrip(v, y) {
      grip.setAttribute('transform', 'translate(' + (jug.x + jug.w / 2 + 14) + ',' + Math.min(y, jug.yBot - 14) + ')');
    }
    jug.onSet(placeGrip);
    placeGrip(jug.level(), jug.yOf(jug.level()));
    var hit = S('rect', { class: 'jgr-hit', x: jug.x - 8, y: jug.yTop - 18, width: jug.w + 16, height: jug.yBot - jug.yTop + 26 });
    svg.appendChild(hit);
    function setV(v) {
      v = U.clamp(Math.round(v / step) * step, 0, jug.cap);
      state.touched = true;
      if (v !== jug.level()) {
        jug.set(v);
        if (opts.onChange) opts.onChange(v);
      }
    }
    function fromPoint(p) {
      if (state.locked) return;
      setV(jug.valAt(p.y));
    }
    api.cleanup(
      MQ.ui.drag(svg, hit, {
        start: fromPoint,
        move: function (p) {
          fromPoint(p);
        },
      })
    );
    function nudge(d) {
      if (state.locked) return;
      api.sound('click');
      setV(jug.level() + d * step);
    }
    var up = el('button', { class: 'btn jgr-nudge', type: 'button', title: 'More water', onclick: function () { nudge(1); } }, '▲');
    var down = el('button', { class: 'btn jgr-nudge', type: 'button', title: 'Less water', onclick: function () { nudge(-1); } }, '▼');
    return {
      state: state,
      buttons: [down, up],
      lock: function () {
        state.locked = true;
        hit.style.cursor = 'default';
        grip.setAttribute('visibility', 'hidden');
        up.disabled = true;
        down.disabled = true;
      },
    };
  }

  // Number box that also accepts "500 ml", "1 litre", "½ litre". Returns ml (or litres when inLitres).
  function parseAmount(raw, inLitres) {
    var s = String(raw == null ? '' : raw).trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ');
    var unit = '';
    var m = s.match(/^(.*?)\s*(millilitres?|milliliters?|ml|litres?|liters?|l)\.?$/);
    if (m) {
      s = m[1].trim();
      unit = m[2].charAt(0) === 'm' ? 'ml' : 'l';
    }
    var n = U.parseNum(s);
    if (isNaN(n)) return NaN;
    if (inLitres) return unit === 'ml' ? n / 1000 : n;
    return unit === 'l' ? n * 1000 : n;
  }

  function amountInput(unit, inLitres, onSubmit) {
    var input = el('input', { class: 'num-input', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Your answer', placeholder: '?' });
    var check = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    var row = el('div', { class: 'num-row' }, input, el('span', { class: 'num-unit' }, unit), check);
    function submit() {
      if (input.disabled) return;
      var n = parseAmount(input.value, inLitres);
      if (isNaN(n)) {
        input.classList.add('shake');
        input.focus();
        return;
      }
      input.classList.remove('shake');
      onSubmit(n);
    }
    check.addEventListener('click', submit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    });
    return {
      el: row,
      input: input,
      set: function (v) {
        input.value = v;
      },
      good: function () {
        input.classList.remove('bad');
        input.classList.add('good');
      },
      bad: function () {
        input.classList.remove('good');
        input.classList.add('bad');
      },
      disable: function () {
        input.disabled = true;
        check.disabled = true;
      },
    };
  }

  // Chips that count in jumps: "250 → 500 → 750"
  function countChips(vals, fmt, last) {
    var row = el('div', { class: 'jgr-count' });
    vals.forEach(function (v, i) {
      if (i) row.appendChild(el('span', { class: 'jgr-arrow' }, '→'));
      row.appendChild(el('span', { class: 'chip' + (i === vals.length - 1 ? ' chip-total' : '') }, fmt ? fmt(v) : String(v)));
    });
    if (last) row.appendChild(el('span', { class: 'jgr-eq' }, last));
    return row;
  }

  function steps(from, to, by) {
    var a = [];
    for (var v = from; v <= to + 1e-9; v += by) a.push(v);
    return a;
  }

  function mlText(v) {
    return v + ' ml';
  }

  function litresWords(v) {
    var whole = Math.floor(v / 1000);
    var half = v % 1000 === 500;
    if (!whole) return half ? 'half a litre' : '';
    var w = whole + (whole === 1 && !half ? ' litre' : ' litres');
    return half ? whole + ' and a half litres' : w;
  }

  // Simple everyday drawings
  function drawTin(x, y, s, label) {
    s = s || 1;
    var g = S('g', { class: 'jgr-tin', transform: 'translate(' + x + ',' + y + ') scale(' + s + ')' });
    g.appendChild(S('rect', { class: 'jgr-tin-body', x: -24, y: -36, width: 48, height: 72, rx: 6 }));
    g.appendChild(S('rect', { class: 'jgr-tin-band', x: -24, y: -14, width: 48, height: 26 }));
    g.appendChild(S('ellipse', { class: 'jgr-tin-top', cx: 0, cy: -36, rx: 24, ry: 6 }));
    if (label !== false) g.appendChild(S('text', { class: 'jgr-tin-lbl', x: 0, y: 4, 'text-anchor': 'middle' }, '250 ml'));
    return g;
  }

  function drawSpoon() {
    var g = S('g');
    g.appendChild(S('ellipse', { class: 'jgr-metal', cx: -22, cy: 0, rx: 16, ry: 10 }));
    g.appendChild(S('rect', { class: 'jgr-metal', x: -8, y: -3, width: 52, height: 6, rx: 3 }));
    return g;
  }
  function drawBottle() {
    var g = S('g');
    g.appendChild(S('path', { class: 'jgr-bottle', d: 'M-8 -52 L8 -52 L8 -38 Q22 -30 22 -16 L22 42 Q22 48 16 48 L-16 48 Q-22 48 -22 42 L-22 -16 Q-22 -30 -8 -38 Z' }));
    g.appendChild(S('rect', { class: 'jgr-cap', x: -9, y: -60, width: 18, height: 10, rx: 2 }));
    g.appendChild(S('rect', { class: 'jgr-bottle-in', x: -18, y: -8, width: 36, height: 52, rx: 4 }));
    return g;
  }
  function drawBowl() {
    var g = S('g');
    g.appendChild(S('path', { class: 'jgr-bowl', d: 'M-44 -12 L44 -12 Q40 26 0 28 Q-40 26 -44 -12 Z' }));
    g.appendChild(S('ellipse', { class: 'jgr-bowl-in', cx: 0, cy: -12, rx: 44, ry: 7 }));
    return g;
  }

  function svgBox(w, h, cls) {
    return S('svg', { class: 'jgr-svg ' + (cls || ''), viewBox: '0 0 ' + w + ' ' + h, role: 'img' });
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  var deck = null;

  function buildDeck() {
    var lv = U.shuffle([250, 500, 750, 1000]);
    var l1 = U.shuffle([
      { type: 'read', scale: 'q-ml', ask: 'ml', v: lv[0] },
      { type: 'read', scale: 'frac', ask: 'frac', v: lv[1] },
      { type: 'read', scale: 'frac', ask: 'ml', v: lv[2] },
      { type: 'read', scale: 'q-ml', ask: 'frac', v: lv[3] },
    ]);
    var fs = U.pick(['h100', 'h50', 'q-ml50']);
    var target = fs === 'h100' ? U.pick([200, 300, 400, 600, 700, 800, 900]) : fs === 'h50' ? U.pick([150, 350, 450, 650, 850]) : U.pick([300, 400, 450, 600, 650, 800, 900]);
    var l2 = U.shuffle([
      { type: 'fill', scale: fs, target: target },
      { type: 'fill', scale: 'frac', target: U.pick([250, 500, 750]) },
      { type: 'tins', n: U.rand(1, 4) },
    ]);
    var near;
    do {
      near = U.rand(1, 8) * 100 + U.pick([20, 30, 70, 80]);
    } while (near === 620);
    var big = U.pick([
      { cap: 3000, target: 2500 },
      { cap: 3000, target: 1500 },
      { cap: 2000, target: 1500 },
      { cap: 2000, target: 500 },
    ]);
    var flask = U.pick([
      { q: 2, ask: 'out' },
      { q: 2, ask: 'left' },
      { q: 1, ask: 'left' },
      { q: 1, ask: 'out' },
      { q: 3, ask: 'left' },
    ]);
    var others = U.shuffle([
      { type: 'crate', cans: U.pick([8, 12, 16]) },
      { type: 'big', cap: big.cap, target: big.target },
      { type: 'flask', q: flask.q, ask: flask.ask },
    ]).slice(0, 2);
    var l3 = U.shuffle([{ type: 'nearest', v: near }].concat(others));
    return l1.concat(l2, l3);
  }

  // The correct answer for a question (also used by tests).
  function answerOf(q) {
    switch (q.type) {
      case 'read':
        return q.v;
      case 'fill':
      case 'big':
        return q.target;
      case 'tins':
        return { ml: q.n * 250, frac: q.n * 250 };
      case 'nearest':
        return Math.round(q.v / 100) * 100;
      case 'crate':
        return q.cans / 4;
      case 'flask':
        var out = (400 / 4) * q.q;
        return q.ask === 'out' ? out : 400 - out;
    }
  }

  var FLASK_WORDS = { 1: 'a quarter', 2: 'half', 3: 'three quarters' };

  /* ------------------------------------------------------------------ *
   * Practice question renderers
   * ------------------------------------------------------------------ */

  function single(stage, kind, cap) {
    var svg = svgBox(360, 350, 'jgr-one');
    var jug = drawJug(svg, { x: 120, w: 140, yBot: 340, hFull: 262, cap: cap || 1000, kind: kind });
    stage.appendChild(svg);
    return { svg: svg, jug: jug };
  }

  function renderRead(stage, api, q) {
    var ans = q.v;
    api.say(q.ask === 'ml' ? 'How much water is in the jug?' : 'What fraction of a litre is in the jug?', 'think');
    stage.appendChild(MQ.ui.prompt(q.ask === 'ml' ? 'How many <b>millilitres</b> of water are in the jug?' : 'How much water is in the jug? Pick the <b>fraction of a litre</b>.'));
    var row = el('div', { class: 'jgr-row' });
    stage.appendChild(row);
    var J = single(row, q.scale);
    J.jug.set(ans);
    var side = el('div', { class: 'jgr-side' });
    row.appendChild(side);
    var work = el('div', { class: 'jgr-work' });
    var labels = [250, 500, 750, 1000];
    function hintWrong(given) {
      var t = api.tries();
      var onScale = labels.indexOf(given) !== -1;
      if (q.scale === 'frac' && q.ask === 'ml') {
        if (U.same(given * 1000, ans)) return ['That is the fraction. How many ml is it? 1 litre is 1000 ml.', 'Did not see 500 ml = half a litre'];
        if (onScale && t >= 1) return ['Look straight across from the top of the water. ¼ litre = 250 ml, ½ litre = 500 ml, ¾ litre = 750 ml.', 'Read the line above or below the water'];
        if (onScale) return ['Look straight across from the top of the water. Which line does it touch?', 'Read the line above or below the water'];
        return [t >= 1 ? 'Count up in 250s: ¼ litre is 250 ml, ½ litre is 500 ml, ¾ litre is 750 ml, 1 litre is 1000 ml.' : 'Each line on this jug is a quarter of a litre. A quarter of a litre is 250 ml.', 'Did not see 500 ml = half a litre'];
      }
      if (q.ask === 'ml') {
        if (onScale) return [t >= 1 ? 'Put your finger on the top of the water. Slide it straight across to the numbers.' : 'Look straight across from the top of the water. Which line does it touch?', 'Read the line above or below the water'];
        return [t >= 1 ? 'The lines count in 250s: 250, 500, 750, 1000. Which line is the water level with?' : 'Read the number next to the line at the top of the water.', 'Read the wrong scale step'];
      }
      // ask frac, any scale
      if (q.scale === 'q-ml') return [t >= 1 ? '1 litre is 1000 ml. 250 ml is ¼ litre, 500 ml is ½ litre, 750 ml is ¾ litre.' : 'Read the ml first. Then think: half of 1000 ml is 500 ml.', 'Did not see 500 ml = half a litre'];
      return ['Look straight across from the top of the water. Which line does it touch?', 'Read the line above or below the water'];
    }
    var input = null;
    var ch = null;
    if (q.ask === 'ml') {
      input = amountInput('ml', false, function (n) {
        if (U.same(n, ans)) {
          input.good();
          input.disable();
          J.jug.highlight(ans);
          api.check(true, 'Yes! ' + ans + ' ml' + (q.scale === 'frac' ? ' is the same as ' + FRAC[ans] + '.' : '.'));
        } else {
          input.bad();
          var h = hintWrong(n);
          api.check(false, h[0], h[1]);
        }
      });
      side.appendChild(input.el);
    } else {
      ch = MQ.ui.choices(FRAC_CHOICES, function (v) {
        if (v === ans) {
          ch.mark(v, 'good');
          ch.disable();
          J.jug.highlight(ans);
          api.check(true, 'Yes! ' + ans + ' ml = ' + FRAC[ans] + '.');
        } else {
          ch.mark(v, 'bad');
          var h = hintWrong(v);
          api.check(false, h[0], h[1]);
        }
      }, { columns: 2 });
      side.appendChild(ch);
    }
    side.appendChild(work);
    api.onReveal(function () {
      J.jug.highlight(ans);
      if (input) {
        input.set(ans);
        input.good();
        input.disable();
      }
      if (ch) {
        ch.mark(ans, 'good');
        ch.disable();
      }
      MQ.clear(work);
      work.appendChild(countChips(steps(250, ans, 250), function (v) { return v + ' ml'; }));
      work.appendChild(el('div', { class: 'jgr-note' }, ans + ' ml = ' + FRAC[ans]));
      api.feedback('The water is level with the ' + (q.scale === 'frac' ? FRAC[ans] : ans === 1000 ? '1 litre' : ans + ' ml') + ' line. Count in 250s: ' + steps(250, ans, 250).join(', ') + '. So it is ' + ans + ' ml, which is ' + FRAC[ans] + '.', 'info');
    });
  }

  // Counting words for the stronger fill hint and the reveal.
  function fillWorking(scale, target) {
    if (scale === 'frac') return { list: steps(250, target, 250), fmt: function (v) { return FRAC[v]; }, text: 'Count up the lines: ' + steps(250, target, 250).map(function (v) { return FRAC[v]; }).join(', ') + '.' };
    if (scale === 'h100') return { list: steps(100, target, 100), fmt: mlText, text: 'Count up the lines in 100s: ' + steps(100, target, 100).join(', ') + '.' };
    if (scale === 'h50') return { list: [target - 50, target], fmt: mlText, text: 'Find ' + (target - 50) + ' ml, then go up one small line: 50 ml more makes ' + target + ' ml.' };
    var b = Math.floor(target / 250) * 250;
    var list = steps(b, target, 50);
    if (b === 0) list = list.slice(1);
    var k = (target - b) / 50;
    return {
      list: list,
      fmt: mlText,
      text: (b ? 'Start at ' + b + ' ml' : 'Start at the bottom') + ' and go up ' + k + ' small line' + (k > 1 ? 's' : '') + ', 50 ml each: ' + list.join(', ') + '.',
    };
  }

  function renderFill(stage, api, q) {
    var T = q.target;
    var big = q.type === 'big';
    var scale = big ? 'litres' : q.scale;
    var name = big ? litresWords(T) : scale === 'frac' ? FRAC[T] : T + ' ml';
    api.say('Drag the water up to ' + name + '. Then press Check.', 'think');
    stage.appendChild(MQ.ui.prompt('Fill the jug to <b>' + name + '</b>.'));
    var row = el('div', { class: 'jgr-row' });
    stage.appendChild(row);
    var J = single(row, scale, big ? q.cap : 1000);
    var step = big ? 250 : 50;
    var side = el('div', { class: 'jgr-side' });
    row.appendChild(side);
    var ctl = makeFillable(J.svg, J.jug, api, { step: step });
    var check = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    side.appendChild(el('div', { class: 'jgr-tip' }, 'Drag the water, or use ▲ ▼'));
    side.appendChild(el('div', { class: 'jgr-btns' }, ctl.buttons[0], ctl.buttons[1], check));
    var work = el('div', { class: 'jgr-work' });
    side.appendChild(work);
    var W = big ? null : fillWorking(scale, T);
    check.addEventListener('click', function () {
      if (api.isAnswered()) return;
      if (!ctl.state.touched || J.jug.level() === 0) {
        api.feedback('Drag the water up in the jug first. Then press Check.', 'info');
        return;
      }
      var L = J.jug.level();
      if (L === T) {
        ctl.lock();
        check.disabled = true;
        J.jug.highlight(T);
        api.check(true, 'Spot on! That is ' + name + (scale === 'frac' ? ' = ' + T + ' ml.' : '.'));
        return;
      }
      var more = L > T ? 'Too much water.' : 'Not enough water.';
      var t = api.tries();
      if (big) {
        var whole = Math.floor(T / 1000);
        if (t >= 1) api.check(false, more + ' ' + (whole ? 'Find ' + whole + (whole === 1 ? ' litre' : ' litres') + ' first. Then go up to the small line: half a litre more.' : 'Half a litre is the small line halfway up to 1 litre.'), 'Read the wrong scale step');
        else api.check(false, more + ' Half a litre is the small line halfway between two litre lines.', 'Read the wrong scale step');
        return;
      }
      if (scale === 'frac') {
        api.check(false, more + ' ' + (t >= 1 ? W.text : FRAC[T] + ' has its own line. ½ litre is halfway up, because 500 ml is half of 1000 ml.'), 'Did not see 500 ml = half a litre');
        return;
      }
      var tag = 'Read the wrong scale step';
      var h;
      if (t >= 1) h = more + ' ' + W.text;
      else if ((scale === 'h50' || scale === 'q-ml50') && Math.abs(L - T) <= 100) h = more + ' Nearly! Each small line is 50 ml.';
      else if (scale === 'q-ml50') h = more + ' The small lines count in 50s. Start from the nearest number below ' + T + '.';
      else h = more + ' What does each line count in? Read the numbers.';
      api.check(false, h, tag);
    });
    api.onReveal(function () {
      ctl.lock();
      check.disabled = true;
      J.jug.set(T);
      J.jug.highlight(T);
      MQ.clear(work);
      if (big) {
        var whole = Math.floor(T / 1000);
        if (whole) work.appendChild(countChips([whole * 1000, T], function (v) { return litresWords(v) || v + ' ml'; }));
        work.appendChild(el('div', { class: 'jgr-note' }, litresWords(T) + ' = ' + T + ' ml'));
        api.feedback((whole ? 'Find ' + litresWords(whole * 1000) + ', then go up half a litre to the small line. ' : 'The small line halfway to 1 litre is half a litre. ') + litresWords(T) + ' is ' + T + ' ml.', 'info');
      } else {
        work.appendChild(countChips(W.list, W.fmt));
        if (scale === 'frac') work.appendChild(el('div', { class: 'jgr-note' }, FRAC[T] + ' = ' + T + ' ml'));
        api.feedback(W.text + ' The water goes up to ' + name + '.', 'info');
      }
    });
  }

  function renderTins(stage, api, q) {
    var n = q.n;
    var ml = n * 250;
    api.say(n === 1 ? 'One tin holds 250 ml. How much drink is that?' : 'Each tin holds 250 ml. How much drink in ' + n + ' tins?', 'think');
    stage.appendChild(MQ.ui.prompt('Each tin holds <b>250 ml</b>. How much drink is in ' + (n === 1 ? '1 tin' : n + ' tins') + '?'));
    var svg = svgBox(620, 350, 'jgr-wide');
    var tins = [];
    for (var i = 0; i < n; i++) {
      var t = drawTin(60 + (i % 2) * 90, 110 + Math.floor(i / 2) * 120, 1.2);
      svg.appendChild(t);
      tins.push(t);
    }
    var countText = [];
    for (i = 0; i < n; i++) {
      var ct = S('text', { class: 'jgr-jump', x: 60 + (i % 2) * 90, y: 170 + Math.floor(i / 2) * 120, 'text-anchor': 'middle', visibility: 'hidden' }, String((i + 1) * 250));
      svg.appendChild(ct);
      countText.push(ct);
    }
    var jug = drawJug(svg, { x: 380, w: 140, yBot: 340, hFull: 262, cap: 1000, kind: 'q-ml' });
    stage.appendChild(svg);
    var work = el('div', { class: 'jgr-work' });
    var stepBox = el('div', { class: 'jgr-side jgr-under' });
    stage.appendChild(stepBox);
    var stage2 = false;
    var ch = null;
    function showCount() {
      countText.forEach(function (c) {
        c.setAttribute('visibility', 'visible');
      });
      MQ.clear(work);
      work.appendChild(countChips(steps(250, ml, 250), mlText));
    }
    function askFraction() {
      stage2 = true;
      stepBox.appendChild(el('div', { class: 'jgr-q2' }, 'What fraction of a litre is ' + ml + ' ml?'));
      ch = MQ.ui.choices(FRAC_CHOICES, function (v) {
        if (v === ml) {
          ch.mark(v, 'good');
          ch.disable();
          jug.highlight(ml);
          api.check(true, 'Yes! ' + ml + ' ml = ' + FRAC[ml] + '.');
        } else {
          ch.mark(v, 'bad');
          api.check(false, api.tries() >= 1 ? '1 litre is 1000 ml. 250 ml is ¼ litre, 500 ml is ½ litre, 750 ml is ¾ litre.' : 'Look at the jug. The water reached ' + ml + ' ml. How much of the whole litre is that?', 'Did not see 500 ml = half a litre');
        }
      }, { columns: 4 });
      stepBox.appendChild(ch);
    }
    var input = amountInput('ml', false, function (v) {
      if (stage2) return;
      if (U.same(v, ml)) {
        input.good();
        input.disable();
        showCount();
        jug.pour(api, ml);
        api.feedback('Yes, ' + ml + ' ml! Now the fraction.', 'good');
        api.say('Good counting! Now the fraction of a litre.', 'happy');
        api.sound('pop');
        askFraction();
        return;
      }
      input.bad();
      if (U.same(v, n * 1000) || U.same(v, n)) {
        api.check(false, U.same(v, n) ? 'Each tin holds 250 ml, not 1 ml. Count in 250s, one jump for each tin.' : 'A tin is not a whole litre. Each tin holds 250 ml. Count in 250s.', U.same(v, n) ? 'Did not count in 250s' : 'Counted cans as litres');
        return;
      }
      api.check(false, api.tries() >= 1 ? 'Point to each tin and count on 250 each time: 250, 500, …' : 'Count in 250s, one jump for each tin.', 'Did not count in 250s');
    });
    stepBox.appendChild(input.el);
    stepBox.appendChild(work);
    api.onReveal(function () {
      input.set(ml);
      input.good();
      input.disable();
      showCount();
      jug.set(ml);
      jug.highlight(ml);
      if (!ch) askFraction();
      ch.mark(ml, 'good');
      ch.disable();
      work.appendChild(el('div', { class: 'jgr-note' }, ml + ' ml = ' + FRAC[ml]));
      api.feedback('Count in 250s, one jump for each tin: ' + steps(250, ml, 250).join(', ') + '. That is ' + ml + ' ml, which is ' + FRAC[ml] + '.', 'info');
    });
  }

  // Jug with every 100 ml line clickable; used by learn screen 4 and the rounding questions.
  function nearestJug(stage, v, onPick) {
    var svg = svgBox(400, 350, 'jgr-one');
    var jug = drawJug(svg, { x: 140, w: 140, yBot: 340, hFull: 262, cap: 1000, kind: 'h100' });
    jug.set(v);
    var hits = {};
    for (var m = 100; m <= 1000; m += 100) {
      (function (mv) {
        var y = jug.yOf(mv);
        var r = S('rect', { class: 'jgr-pick', x: 50, y: y - 12, width: jug.w + 96, height: 24, rx: 8 });
        r.addEventListener('click', function () {
          onPick(mv);
        });
        svg.appendChild(r);
        hits[mv] = r;
      })(m);
    }
    stage.appendChild(svg);
    return {
      svg: svg,
      jug: jug,
      mark: function (mv, cls) {
        if (hits[mv]) hits[mv].classList.add(cls);
      },
      disable: function () {
        Object.keys(hits).forEach(function (k) {
          hits[k].classList.add('jgr-off');
        });
      },
      // Show the two gaps: from the line below and to the line above.
      gaps: function () {
        var lo = Math.floor(v / 100) * 100;
        var hi = lo + 100;
        var x = jug.x + jug.w + 62;
        var g = S('g', { class: 'jgr-gaps' });
        [
          [lo, v],
          [v, hi],
        ].forEach(function (pr) {
          var y1 = jug.yOf(pr[0]);
          var y2 = jug.yOf(pr[1]);
          var small = pr[1] - pr[0] < 50;
          g.appendChild(S('line', { class: small ? 'jgr-gap jgr-gap-small' : 'jgr-gap', x1: x, x2: x, y1: y1, y2: y2 }));
          g.appendChild(S('line', { class: 'jgr-gap-end', x1: x - 6, x2: x + 6, y1: y1, y2: y1 }));
          g.appendChild(S('line', { class: 'jgr-gap-end', x1: x - 6, x2: x + 6, y1: y2, y2: y2 }));
          g.appendChild(S('text', { class: small ? 'jgr-gap-t jgr-gap-small' : 'jgr-gap-t', x: x + 10, y: (y1 + y2) / 2 + 5 }, pr[1] - pr[0] + ''));
        });
        svg.appendChild(g);
      },
    };
  }

  function renderNearest(stage, api, q) {
    var v = q.v;
    var ans = Math.round(v / 100) * 100;
    var lo = Math.floor(v / 100) * 100;
    var hi = lo + 100;
    var off = v - lo;
    api.say('The water is between two lines. Which line is it nearest?', 'think');
    stage.appendChild(MQ.ui.prompt('Which <b>marked line</b> is the water nearest to? Click that line.'));
    var done = false;
    var N = nearestJug(stage, v, function (mv) {
      if (done || api.isAnswered()) return;
      if (mv === ans) {
        done = true;
        N.mark(mv, 'jgr-good');
        N.disable();
        N.jug.highlight(ans);
        api.check(true, 'Yes! The water is nearest the ' + ans + ' ml line.');
        return;
      }
      N.mark(mv, 'jgr-bad');
      if (mv === lo || mv === hi) {
        api.check(false, api.tries() >= 1 ? 'The water is ' + (off < 50 ? 'only a little above ' + lo + ' ml' : 'most of the way up to ' + hi + ' ml') + '. Which line is closer?' : 'Look at the gap above the water and the gap below it. Which gap is smaller?', 'Rounded to the wrong mark');
      } else {
        api.check(false, 'Find the line just below the water and the line just above it. The answer is one of those two.', 'Read the wrong scale step');
      }
    });
    api.onReveal(function () {
      done = true;
      N.mark(ans, 'jgr-good');
      N.disable();
      N.jug.highlight(ans);
      N.gaps();
      api.feedback('The water is at about ' + v + ' ml. It is ' + off + ' ml above ' + lo + ' ml and ' + (hi - v) + ' ml below ' + hi + ' ml. The smaller gap wins: ' + ans + ' ml.', 'info');
    });
  }

  function renderCrate(stage, api, q) {
    var cans = q.cans;
    var rows = cans / 4;
    api.say('Each can holds 250 ml. Four cans make 1 litre. Count the rows!', 'think');
    stage.appendChild(MQ.ui.prompt('A box has <b>' + cans + ' cans</b>. Each can holds 250 ml. How many <b>litres</b> is that?'));
    var cw = 74;
    var rh = 78;
    var svg = svgBox(560, rows * rh + 24, 'jgr-crate');
    svg.appendChild(S('rect', { class: 'jgr-box', x: 20, y: 6, width: 4 * cw + 20, height: rows * rh + 12, rx: 10 }));
    var rowLbls = [];
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < 4; c++) svg.appendChild(drawTin(30 + cw / 2 + c * cw, 12 + rh / 2 + r * rh, 0.9));
      var ry = 12 + rh / 2 + r * rh;
      var lab = S('g', { visibility: 'hidden' });
      lab.appendChild(S('path', { class: 'jgr-brace', d: 'M' + (4 * cw + 50) + ' ' + (ry - 30) + ' q10 0 10 10 v12 l8 8 l-8 8 v12 q0 10 -10 10' }));
      lab.appendChild(S('text', { class: 'jgr-row-t', x: 4 * cw + 80, y: ry + 6 }, '1 litre'));
      lab.appendChild(S('text', { class: 'jgr-row-s', x: 4 * cw + 160, y: ry + 6 }, '(row ' + (r + 1) + ')'));
      svg.appendChild(lab);
      rowLbls.push(lab);
    }
    stage.appendChild(svg);
    var work = el('div', { class: 'jgr-work' });
    var input = amountInput('litres', true, function (v) {
      if (U.same(v, rows)) {
        input.good();
        input.disable();
        rowLbls.forEach(function (l) {
          l.setAttribute('visibility', 'visible');
        });
        api.check(true, 'Yes! ' + rows + ' rows of 4 cans = ' + rows + ' litres.');
        return;
      }
      input.bad();
      if (U.same(v, cans)) {
        api.check(false, 'A can is not a litre. Each can is only 250 ml. 4 cans fill 1 litre, so count the rows.', 'Counted cans as litres');
      } else if (U.same(v, cans * 250)) {
        api.check(false, 'That is right in ml! Now say it in litres. Each row of 4 cans is 1 litre.', 'Gave ml instead of litres');
      } else {
        api.check(false, api.tries() >= 1 ? 'One row: 250, 500, 750, 1000 ml. That is 1 litre. How many rows are there?' : 'Each row of 4 cans is 1 litre. Count the rows.', 'Counted cans as litres');
      }
    });
    var side = el('div', { class: 'jgr-side jgr-under' }, input.el, work);
    stage.appendChild(side);
    api.onReveal(function () {
      input.set(rows);
      input.good();
      input.disable();
      rowLbls.forEach(function (l) {
        l.setAttribute('visibility', 'visible');
      });
      MQ.clear(work);
      work.appendChild(countChips([250, 500, 750, 1000], mlText, '= 1 litre in each row'));
      var ones = [];
      for (var k = 0; k < rows; k++) ones.push(1);
      work.appendChild(MQ.ui.sum(ones, rows, 'litres'));
      api.feedback('One row of 4 cans: 250, 500, 750, 1000 ml = 1 litre. There are ' + rows + ' rows, so ' + rows + ' litres.', 'info');
    });
  }

  function drawFlask(svg, x, yBot, w, hFull) {
    // 400 ml flask with 4 equal bands of 100 ml
    var inner = yBot - 4;
    var top = inner - hFull;
    var g = S('g');
    g.appendChild(S('rect', { class: 'jgr-cap', x: x + w / 2 - 20, y: top - 44, width: 40, height: 18, rx: 4 }));
    g.appendChild(S('path', { class: 'jgr-flask', d: 'M' + (x + w / 2 - 16) + ' ' + (top - 28) + ' L' + (x + w / 2 + 16) + ' ' + (top - 28) + ' L' + (x + w / 2 + 16) + ' ' + (top - 14) + ' Q' + (x + w) + ' ' + (top - 10) + ' ' + (x + w) + ' ' + (top + 6) + ' L' + (x + w) + ' ' + (yBot - 12) + ' Q' + (x + w) + ' ' + yBot + ' ' + (x + w - 12) + ' ' + yBot + ' L' + (x + 12) + ' ' + yBot + ' Q' + x + ' ' + yBot + ' ' + x + ' ' + (yBot - 12) + ' L' + x + ' ' + (top + 6) + ' Q' + x + ' ' + (top - 10) + ' ' + (x + w / 2 - 16) + ' ' + (top - 14) + ' Z' }));
    var bandH = hFull / 4;
    var bands = [];
    var labels = [];
    for (var i = 0; i < 4; i++) {
      var y = inner - (i + 1) * bandH;
      var b = S('rect', { class: 'jgr-band', x: x + 4, y: y, width: w - 8, height: bandH });
      g.appendChild(b);
      bands.push(b);
      if (i < 3) g.appendChild(S('line', { class: 'jgr-band-line', x1: x + 4, x2: x + w - 4, y1: y, y2: y }));
      var t = S('text', { class: 'jgr-band-t', x: x + w / 2, y: y + bandH / 2 + 6, 'text-anchor': 'middle', visibility: 'hidden' }, '100 ml');
      g.appendChild(t);
      labels.push(t);
    }
    g.appendChild(S('text', { class: 'jgr-lbl', x: x + w + 14, y: top + 5 }, '400 ml'));
    g.appendChild(S('line', { class: 'jgr-tick', x1: x + w - 22, x2: x + w + 8, y1: top, y2: top }));
    svg.appendChild(g);
    return { bands: bands, labels: labels };
  }

  function renderFlask(stage, api, q) {
    var out = 100 * q.q;
    var left = 400 - out;
    var ans = q.ask === 'out' ? out : left;
    var words = FLASK_WORDS[q.q];
    api.say('This flask holds 400 ml. It is full.', 'think');
    stage.appendChild(MQ.ui.prompt('A full <b>400 ml</b> flask. Pour out <b>' + words + '</b>. ' + (q.ask === 'out' ? 'How much is <b>poured out</b>?' : 'How much is <b>left</b> in the flask?')));
    var row = el('div', { class: 'jgr-row' });
    stage.appendChild(row);
    var svg = svgBox(360, 330, 'jgr-one');
    var F = drawFlask(svg, 110, 320, 130, 240);
    row.appendChild(svg);
    var work = el('div', { class: 'jgr-work' });
    function showBands() {
      F.labels.forEach(function (t) {
        t.setAttribute('visibility', 'visible');
      });
    }
    function showPour() {
      for (var i = 0; i < q.q; i++) F.bands[3 - i].classList.add('jgr-band-out');
    }
    var input = amountInput('ml', false, function (v) {
      if (U.same(v, ans)) {
        input.good();
        input.disable();
        showBands();
        showPour();
        api.check(true, 'Yes! ' + (q.ask === 'out' ? out + ' ml poured out.' : left + ' ml left in the flask.'));
        return;
      }
      input.bad();
      showBands();
      var t = api.tries();
      if (q.ask === 'left' && U.same(v, out) && out !== left) api.check(false, 'That is the part you poured out. How much is still in the flask?', 'Found the part poured out, not what is left');
      else if (q.ask === 'out' && U.same(v, left) && out !== left) api.check(false, 'That is what is left. How much was poured out?', 'Found the part poured out, not what is left');
      else if (U.same(v, q.q * 250) || U.same(v, 1000 - q.q * 250)) api.check(false, 'This flask holds 400 ml, not 1 litre. Each quarter is 100 ml.', 'Used a quarter of a litre, not of 400 ml');
      else api.check(false, t >= 1 ? 'Halve 400: 200. Halve again: 100. Each band is 100 ml. Count the bands ' + (q.ask === 'out' ? 'poured out.' : 'still left.') : 'The flask is split into 4 equal bands. How much is one band?', 'Did not halve and halve again');
    });
    row.appendChild(el('div', { class: 'jgr-side' }, input.el, work));
    api.onReveal(function () {
      input.set(ans);
      input.good();
      input.disable();
      showBands();
      showPour();
      MQ.clear(work);
      work.appendChild(countChips([400, 200, 100], mlText, '(halve, halve again)'));
      var n = q.ask === 'out' ? q.q : 4 - q.q;
      var parts = [];
      for (var k = 0; k < n; k++) parts.push(100);
      work.appendChild(MQ.ui.sum(parts, ans, 'ml'));
      api.feedback('Halve 400 ml: 200 ml. Halve again: 100 ml, one band. ' + words.charAt(0).toUpperCase() + words.slice(1) + ' is ' + out + ' ml poured out, so ' + left + ' ml is left.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */

  function learnCapacity(stage, api) {
    api.say('Capacity is how much a container can hold. Drag each thing to the jug.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('What is capacity?', 'Drag the spoon, the bowl and the bottle to the <b>1 litre</b> jug.'));
    var svg = svgBox(640, 360, 'jgr-wide');
    var jug = drawJug(svg, { x: 400, w: 150, yBot: 350, hFull: 262, cap: 1000, kind: 'q-ml' });
    var items = [
      { name: 'teaspoon', ml: 5, draw: drawSpoon, home: { x: 110, y: 60 }, says: 'A teaspoon holds 5 ml. That is hardly anything in a 1 litre jug!' },
      { name: 'bowl', ml: 250, draw: drawBowl, home: { x: 110, y: 170 }, says: 'A bowl holds about 250 ml. That is a quarter of a litre.' },
      { name: 'bottle', ml: 500, draw: drawBottle, home: { x: 110, y: 290 }, says: 'A bottle holds about 500 ml. That is half a litre.' },
    ];
    var seen = {};
    var count = 0;
    items.forEach(function (it) {
      var g = S('g', { class: 'jgr-item', transform: 'translate(' + it.home.x + ',' + it.home.y + ')' });
      g.appendChild(S('rect', { class: 'jgr-item-hit', x: -60, y: -62, width: 120, height: 112, rx: 12 }));
      g.appendChild(it.draw());
      var lbl = S('text', { class: 'jgr-item-t', x: 70, y: 6 }, it.name);
      g.appendChild(lbl);
      svg.appendChild(g);
      var lastD = 0;
      function pour() {
        jug.pour(api, it.ml);
        jug.highlight(it.ml === 5 ? null : it.ml);
        api.sound('pop');
        api.feedback(it.says, 'good');
        api.say(it.says, 'happy');
        lbl.textContent = it.name + ' ✓ ' + it.ml + ' ml';
        if (!seen[it.name]) {
          seen[it.name] = true;
          count++;
        }
        if (count === items.length) {
          api.unlockNext();
          api.later(function () {
            api.say('1 litre is 1000 ml. That is the whole jug.', 'cheer');
          }, 2400);
        }
      }
      api.cleanup(
        MQ.ui.drag(svg, g, {
          start: function () {
            lastD = 0;
          },
          move: function (p, dx, dy) {
            lastD = Math.abs(dx) + Math.abs(dy);
            g.setAttribute('transform', 'translate(' + (it.home.x + dx) + ',' + (it.home.y + dy) + ')');
          },
          end: function (p) {
            var moved = lastD;
            g.setAttribute('transform', 'translate(' + it.home.x + ',' + it.home.y + ')');
            var onJug = p.x > jug.x - 40 && p.x < jug.x + jug.w + 50 && p.y > jug.yTop - 40 && p.y < jug.yBot + 10;
            if (onJug || moved < 30) pour();
          },
        })
      );
    });
    stage.appendChild(svg);
  }

  function learnTwoScales(stage, api) {
    api.say('These two jugs count in different ways. Fill them both to the middle line.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Two scales, same water', 'Drag the water up in either jug. Stop at the <b>middle line</b>.'));
    var svg = svgBox(660, 380, 'jgr-wide');
    var a = drawJug(svg, { x: 110, w: 130, yBot: 340, hFull: 262, cap: 1000, kind: 'q-ml' });
    var b = drawJug(svg, { x: 430, w: 130, yBot: 340, hFull: 262, cap: 1000, kind: 'frac' });
    var say = S('text', { class: 'jgr-big-t', x: 330, y: 372, 'text-anchor': 'middle' }, '');
    svg.appendChild(say);
    var found = {};
    var unlocked = false;
    function onChange(v) {
      if (a.level() !== v) a.set(v);
      if (b.level() !== v) b.set(v);
      if (FRAC[v]) {
        a.highlight(v);
        b.highlight(v);
        say.textContent = (v === 1000 ? '1000 ml' : v + ' ml') + ' = ' + FRAC[v];
        found[v] = true;
        if (v === 500 && !unlocked) {
          unlocked = true;
          api.unlockNext();
          api.sound('correct');
          api.say('500 ml is half a litre. Same water, two names!', 'cheer');
          api.feedback('500 ml = ½ litre. Now try ¼ litre and ¾ litre too.', 'good');
        } else if (unlocked && found[250] && found[750]) {
          api.feedback('250 ml = ¼ litre, 500 ml = ½ litre, 750 ml = ¾ litre.', 'good');
        }
      } else {
        a.highlight(null);
        b.highlight(null);
        say.textContent = '';
      }
    }
    var ca = makeFillable(svg, a, api, { step: 50, onChange: onChange });
    makeFillable(svg, b, api, { step: 50, onChange: onChange });
    stage.appendChild(svg);
    stage.appendChild(el('div', { class: 'jgr-btns' }, ca.buttons[0], ca.buttons[1]));
  }

  function learnTins(stage, api) {
    api.say('A tin holds 250 ml. Click each tin to pour it into the jug.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Four tins make a litre', 'Click a tin to pour it. Count in 250s.'));
    var svg = svgBox(640, 350, 'jgr-wide');
    var jug = drawJug(svg, { x: 400, w: 150, yBot: 340, hFull: 262, cap: 1000, kind: 'q-ml' });
    var chips = el('div', { class: 'jgr-count' });
    var poured = 0;
    var busy = false;
    for (var i = 0; i < 4; i++) {
      (function (i) {
        var t = drawTin(0, 0);
        var x = 90 + (i % 2) * 110;
        var y = 110 + Math.floor(i / 2) * 140;
        t.setAttribute('transform', 'translate(' + x + ',' + y + ') scale(1.3)');
        t.classList.add('jgr-click');
        t.addEventListener('click', function () {
          if (t.classList.contains('jgr-used') || busy) return;
          busy = true;
          t.classList.add('jgr-used');
          poured++;
          var v = poured * 250;
          api.sound('pop');
          jug.pour(api, v, function () {
            busy = false;
          });
          jug.highlight(v);
          if (poured > 1) chips.appendChild(el('span', { class: 'jgr-arrow' }, '→'));
          chips.appendChild(el('span', { class: 'chip' }, v + ' ml'));
          api.feedback(poured + (poured === 1 ? ' tin' : ' tins') + ' = ' + v + ' ml = ' + FRAC[v] + '.', 'good');
          if (poured === 4) {
            api.say('Four tins fill the jug: 1000 ml is 1 litre!', 'cheer');
            api.unlockNext();
          }
        });
        svg.appendChild(t);
      })(i);
    }
    stage.appendChild(svg);
    stage.appendChild(chips);
  }

  function learnBetween(stage, api) {
    api.say('Sometimes the water stops between two lines. Which line is it nearest?');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Between the lines', 'The water is at about <b>620 ml</b>. Click the <b>marked line</b> it is nearest to.'));
    var done = false;
    var N = nearestJug(stage, 620, function (mv) {
      if (done) return;
      if (mv === 600) {
        done = true;
        N.mark(600, 'jgr-good');
        N.disable();
        N.jug.highlight(600);
        N.gaps();
        api.sound('correct');
        api.say('Yes! 620 is only 20 above 600, but 80 below 700.', 'cheer');
        api.feedback('Nearest marked line: 600 ml. The smaller gap wins.', 'good');
        api.unlockNext();
      } else {
        N.mark(mv, 'jgr-bad');
        api.sound('wrong');
        api.feedback(mv === 700 ? '620 is 80 ml below 700, but only 20 ml above 600. Which gap is smaller?' : 'Look for the lines just above and just below the water.', 'try');
      }
    });
  }

  MQ.register('jug-reader', {
    learn: [learnCapacity, learnTwoScales, learnTins, learnBetween],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'read') return renderRead(stage, api, q);
        if (q.type === 'fill' || q.type === 'big') return renderFill(stage, api, q);
        if (q.type === 'tins') return renderTins(stage, api, q);
        if (q.type === 'nearest') return renderNearest(stage, api, q);
        if (q.type === 'crate') return renderCrate(stage, api, q);
        return renderFlask(stage, api, q);
      },
    },
    _test: { buildDeck: buildDeck, answerOf: answerOf, parseAmount: parseAmount, scaleMarks: scaleMarks },
  });

  var css = [
    '.jgr-svg{display:block;height:auto;max-width:100%;user-select:none;-webkit-user-select:none}',
    '.jgr-one{width:340px}',
    '.jgr-wide{width:600px}',
    '.jgr-crate{width:540px}',
    '.jgr-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:18px 28px;width:100%;max-width:900px}',
    '.jgr-side{display:flex;flex-direction:column;align-items:center;gap:12px;min-width:0;max-width:100%}',
    '.jgr-under{width:100%}',
    '.jgr-btns{display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap}',
    '.jgr-nudge{min-width:56px;font-size:1.2rem}',
    '.jgr-tip{color:var(--ink-soft);font-size:.95rem}',
    '.jgr-q2{font-size:1.2rem;font-weight:800}',
    '.jgr-work{display:flex;flex-direction:column;align-items:center;gap:8px;max-width:100%}',
    '.jgr-count{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;max-width:100%;min-height:10px}',
    '.jgr-arrow{color:var(--ink-soft);font-weight:800}',
    '.jgr-eq{font-weight:800;color:var(--ink-soft)}',
    '.jgr-note{font-size:1.25rem;font-weight:800;color:var(--good)}',
    '.jgr-glass{fill:#f3faff;stroke:#7d93b8;stroke-width:3;stroke-linejoin:round}',
    '.jgr-handle{fill:none;stroke:#7d93b8;stroke-width:9;stroke-linecap:round}',
    '.jgr-water{fill:#8fd0f5;opacity:.85}',
    '.jgr-surf{stroke:#2b8ccc;stroke-width:3}',
    '.jgr-tick{stroke:#1b2a4a;stroke-width:2.5}',
    '.jgr-minor{stroke-width:1.6}',
    '.jgr-tick.jgr-hi{stroke:#e08900;stroke-width:5}',
    '.jgr-lbl{font-size:18px;font-weight:700;fill:#1b2a4a;font-family:inherit}',
    '.jgr-lbl.jgr-hi{fill:#c45f00;font-size:19px}',
    '.jgr-guide{stroke:#e08900;stroke-width:2;stroke-dasharray:6 5}',
    '.jgr-hit{fill:rgba(0,0,0,0);cursor:ns-resize}',
    '.jgr-grip{pointer-events:none}',
    '.jgr-grip rect{fill:#fff;stroke:#2b8ccc;stroke-width:2.5}',
    '.jgr-grip text{font-size:18px;font-weight:800;fill:#2b8ccc}',
    '.jgr-pick{fill:rgba(255,183,3,0);stroke:none;cursor:pointer}',
    '.jgr-pick:hover{fill:rgba(255,183,3,.22)}',
    '.jgr-pick.jgr-good{fill:rgba(31,157,107,.25)}',
    '.jgr-pick.jgr-bad{fill:rgba(194,65,12,.18)}',
    '.jgr-pick.jgr-off{cursor:default;pointer-events:none}',
    '.jgr-gap{stroke:#e08900;stroke-width:3}',
    '.jgr-gap-end{stroke:#e08900;stroke-width:2}',
    '.jgr-gap-t{font-size:15px;font-weight:800;fill:#c45f00}',
    '.jgr-gap-small.jgr-gap{stroke:#1f9d6b}',
    'text.jgr-gap-small{fill:#1f9d6b}',
    '.jgr-tin-body{fill:#e85d4a;stroke:#9c3426;stroke-width:2}',
    '.jgr-tin-band{fill:#fff3e8}',
    '.jgr-tin-top{fill:#d5d9e2;stroke:#8d94a3;stroke-width:2}',
    '.jgr-tin-lbl{font-size:12px;font-weight:800;fill:#9c3426}',
    '.jgr-click{cursor:pointer}',
    '.jgr-click:hover .jgr-tin-body{fill:#f07563}',
    '.jgr-used{opacity:.28;cursor:default}',
    '.jgr-jump{font-size:15px;font-weight:800;fill:#c45f00}',
    '.jgr-box{fill:#f6e7cf;stroke:#b48a52;stroke-width:3}',
    '.jgr-brace{fill:none;stroke:#1f9d6b;stroke-width:3}',
    '.jgr-row-t{font-size:20px;font-weight:800;fill:#1f9d6b}',
    '.jgr-row-s{font-size:14px;fill:#4a5a7d}',
    '.jgr-metal{fill:#c7cdd8;stroke:#7d8596;stroke-width:2}',
    '.jgr-bottle{fill:#eef8ff;stroke:#5b8fb9;stroke-width:2.5}',
    '.jgr-bottle-in{fill:#8fd0f5}',
    '.jgr-cap{fill:#2b8ccc}',
    '.jgr-bowl{fill:#ffd6a5;stroke:#c98a3d;stroke-width:2.5}',
    '.jgr-bowl-in{fill:#fff4e2;stroke:#c98a3d;stroke-width:2}',
    '.jgr-item{cursor:grab}',
    '.jgr-item-hit{fill:rgba(0,0,0,0)}',
    '.jgr-item-t{font-size:17px;font-weight:800;fill:#1b2a4a}',
    '.jgr-big-t{font-size:24px;font-weight:800;fill:#1f9d6b}',
    '.jgr-flask{fill:#f3faff;stroke:#7d93b8;stroke-width:3}',
    '.jgr-band{fill:#8fd0f5;opacity:.85}',
    '.jgr-band-out{fill:#f3faff;opacity:1;stroke:#9fb3d1;stroke-dasharray:5 4}',
    '.jgr-band-line{stroke:#2b6f9e;stroke-width:2;stroke-dasharray:7 5}',
    '.jgr-band-t{font-size:17px;font-weight:800;fill:#1b2a4a}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'jug-reader' }, css));
})();

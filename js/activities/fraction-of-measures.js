/* Measure Fractions — fractions of 1 metre, 1 hour and 1 litre (Unit 12.3, workbook-led:
   WB p.166 Q6, p.176 Q4, p.177 Q8, p.178 Q10). Every share is drawn to scale first; the
   division sentence only appears after the picture. */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  var COLORS = ['#ffcf70', '#8fd3e8', '#b8e08f', '#f7a8b8'];
  var PALE = ['#fff1cc', '#dff3f9', '#e9f6dc', '#fde3e9'];
  var NAMES = ['Mia', 'Sam', 'Ali', 'Zoe', 'Leo', 'Nia'];

  /** Stacked fraction as HTML. */
  function frac(n, d, cls) {
    return '<span class="fom-frac' + (cls ? ' ' + cls : '') + '"><span class="fom-fn">' + n + '</span><span class="fom-fd">' + d + '</span></span>';
  }

  function sentence(html) {
    return el('div', { class: 'fom-sent', html: html });
  }

  function repeat(v, n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(v);
    return a;
  }

  /* ------------------------------------------------------------------ *
   * Metre stick / ribbon (100 cm, drawn to scale: 7.8 px per cm)
   * state: { cuts: [cm...], colored, jumps, cutLabels, hi, hover }
   * ------------------------------------------------------------------ */
  var MX0 = 40;
  var MPX = 7.8;
  var MY = 70;
  var MH = 50;
  function mx(cm) {
    return MX0 + cm * MPX;
  }

  function makeStick(state) {
    var svg = S('svg', { class: 'fom-svg fom-stick', viewBox: '0 0 860 182', role: 'img', 'aria-label': 'A metre stick, 100 cm long' });
    var base = S('g');
    var dyn = S('g');
    svg.appendChild(base);
    svg.appendChild(dyn);
    // wood
    base.appendChild(S('rect', { x: mx(0), y: MY, width: 100 * MPX, height: MH, rx: 4, fill: '#f6e3b4', stroke: '#8a6d3b', 'stroke-width': 2 }));
    var pieces = S('g');
    base.appendChild(pieces);
    var ticks = S('g');
    base.appendChild(ticks);
    for (var c = 0; c <= 100; c += 5) {
      var long = c % 10 === 0;
      ticks.appendChild(S('line', { x1: mx(c), x2: mx(c), y1: MY + MH, y2: MY + MH - (long ? 20 : 11), stroke: '#5b4a2a', 'stroke-width': long ? 2 : 1.4 }));
      if (long) ticks.appendChild(S('text', { x: mx(c), y: MY + MH + 22, class: 'fom-tick-lbl', 'text-anchor': 'middle' }, String(c)));
    }
    base.appendChild(S('text', { x: mx(100) + 6, y: MY + MH - 4, class: 'fom-small', 'text-anchor': 'start' }, 'cm'));

    function redraw() {
      MQ.clear(pieces);
      MQ.clear(dyn);
      var cuts = state.cuts.slice().sort(function (a, b) {
        return a - b;
      });
      var bounds = [0].concat(cuts, [100]);
      if (state.colored) {
        for (var i = 0; i < bounds.length - 1; i++) {
          var hiOn = state.hi === i;
          pieces.appendChild(
            S('rect', {
              class: 'fom-piece',
              'data-idx': i,
              x: mx(bounds[i]) + 1,
              y: MY + 1,
              width: (bounds[i + 1] - bounds[i]) * MPX - 2,
              height: MH - 2,
              fill: state.hi >= 0 && !hiOn ? PALE[i % 2] : COLORS[i % 2],
            })
          );
          if (hiOn) pieces.appendChild(S('rect', { x: mx(bounds[i]), y: MY - 2, width: (bounds[i + 1] - bounds[i]) * MPX, height: MH + 4, fill: 'none', stroke: '#e07a00', 'stroke-width': 4, rx: 4 }));
        }
      }
      cuts.forEach(function (c) {
        dyn.appendChild(S('line', { class: 'fom-cut', 'data-value': c, x1: mx(c), x2: mx(c), y1: MY - 6, y2: MY + MH + 6, stroke: '#c0392b', 'stroke-width': 3, 'stroke-dasharray': '6 4' }));
        if (state.cutLabels) {
          dyn.appendChild(S('rect', { x: mx(c) - 30, y: MY + MH + 32, width: 60, height: 24, rx: 8, fill: '#fff', stroke: '#c0392b', 'stroke-width': 2 }));
          dyn.appendChild(S('text', { x: mx(c), y: MY + MH + 50, class: 'fom-cut-lbl', 'text-anchor': 'middle' }, c + ' cm'));
        }
      });
      if (state.jumps) {
        for (var j = 0; j < bounds.length - 1; j++) {
          var a = mx(bounds[j]);
          var b = mx(bounds[j + 1]);
          var mid = (a + b) / 2;
          dyn.appendChild(S('path', { class: 'fom-jump', d: 'M' + (a + 3) + ' ' + (MY - 4) + ' Q' + mid + ' ' + (MY - 50) + ' ' + (b - 3) + ' ' + (MY - 4), fill: 'none', stroke: '#0b6e66', 'stroke-width': 2.5 }));
          dyn.appendChild(S('text', { x: mid, y: MY - 30, class: 'fom-jump-lbl', 'text-anchor': 'middle' }, '+' + (bounds[j + 1] - bounds[j])));
        }
      }
      if (state.hover != null) {
        dyn.appendChild(S('line', { x1: mx(state.hover), x2: mx(state.hover), y1: MY - 10, y2: MY + MH + 4, stroke: '#555', 'stroke-width': 2 }));
        dyn.appendChild(S('text', { x: mx(state.hover), y: MY - 14, class: 'fom-hover-lbl', 'text-anchor': 'middle' }, state.hover + ' cm'));
      }
    }
    redraw();
    return { svg: svg, redraw: redraw, state: state };
  }

  /* ------------------------------------------------------------------ *
   * Clock face (60 minutes). Minute m sits at angle m × 6° from 12.
   * state: { parts, fill (minutes shaded), hi, fives (count labels up to), dots, sectorLabels }
   * ------------------------------------------------------------------ */
  var CC = 160;
  var CR = 112;
  function cpt(m, r) {
    var a = (m * 6 * Math.PI) / 180;
    return [CC + r * Math.sin(a), CC - r * Math.cos(a)];
  }
  function r2(v) {
    return Math.round(v * 100) / 100;
  }
  function sectorPath(a, b, r) {
    if (b - a >= 60) return null;
    var p = cpt(a, r);
    var q = cpt(b, r);
    return 'M' + CC + ' ' + CC + ' L' + r2(p[0]) + ' ' + r2(p[1]) + ' A' + r + ' ' + r + ' 0 ' + (b - a > 30 ? 1 : 0) + ' 1 ' + r2(q[0]) + ' ' + r2(q[1]) + ' Z';
  }

  function makeClock(state, onDot) {
    var svg = S('svg', { class: 'fom-svg fom-clock', viewBox: '0 0 320 320', role: 'img', 'aria-label': 'A clock face showing 60 minutes' });
    var g = S('g');
    svg.appendChild(g);
    function redraw() {
      MQ.clear(g);
      var n = state.parts;
      var size = 60 / n;
      g.appendChild(S('circle', { cx: CC, cy: CC, r: CR, fill: '#fff', stroke: '#33415c', 'stroke-width': 4 }));
      for (var i = 0; i < n; i++) {
        var a = i * size;
        var b = Math.min((i + 1) * size, state.fill);
        if (b <= a) continue;
        var fillCol = state.hi >= 0 && state.hi !== i ? PALE[i % COLORS.length] : COLORS[i % COLORS.length];
        var d = sectorPath(a, b, CR - 2);
        if (d) g.appendChild(S('path', { class: 'fom-sector', 'data-idx': i, d: d, fill: fillCol }));
        else g.appendChild(S('circle', { class: 'fom-sector', 'data-idx': i, cx: CC, cy: CC, r: CR - 2, fill: fillCol }));
      }
      // minute ticks
      for (var m = 0; m < 60; m++) {
        var five = m % 5 === 0;
        var p1 = cpt(m, CR - 2);
        var p2 = cpt(m, CR - (five ? 13 : 7));
        g.appendChild(S('line', { x1: r2(p1[0]), y1: r2(p1[1]), x2: r2(p2[0]), y2: r2(p2[1]), stroke: '#33415c', 'stroke-width': five ? 2.5 : 1 }));
      }
      // hour numbers
      for (var h = 1; h <= 12; h++) {
        var hp = cpt(h * 5, CR - 24);
        g.appendChild(S('text', { x: r2(hp[0]), y: r2(hp[1]) + 6, class: 'fom-hour', 'text-anchor': 'middle' }, String(h)));
      }
      // dividing lines (equal parts)
      for (var k = 0; k < n; k++) {
        var e = cpt(k * size, CR);
        g.appendChild(S('line', { class: 'fom-divider', x1: CC, y1: CC, x2: r2(e[0]), y2: r2(e[1]), stroke: '#1d2b44', 'stroke-width': 3.5 }));
      }
      if (state.hi >= 0) {
        var hd = sectorPath(state.hi * size, (state.hi + 1) * size, CR - 2);
        if (hd) g.appendChild(S('path', { d: hd, fill: 'none', stroke: '#e07a00', 'stroke-width': 4, 'stroke-linejoin': 'round' }));
      }
      if (state.sectorLabels) {
        for (var s = 0; s < n; s++) {
          var lp = cpt((s + 0.5) * size, CR * 0.38);
          g.appendChild(S('rect', { x: r2(lp[0]) - 25, y: r2(lp[1]) - 12, width: 50, height: 22, rx: 8, fill: '#fff', stroke: '#0b6e66', 'stroke-width': 2 }));
          g.appendChild(S('text', { x: r2(lp[0]), y: r2(lp[1]) + 4, class: 'fom-sec-lbl', 'text-anchor': 'middle' }, size + ' min'));
        }
      }
      g.appendChild(S('circle', { cx: CC, cy: CC, r: 5, fill: '#1d2b44' }));
      // the 5-minute count dots round the outside
      for (var f = 5; f <= 60; f += 5) {
        var shown = f <= state.fives;
        var isNext = state.dots && f === state.fill + 5;
        if (!shown && !isNext && !state.dots) continue;
        var dp = cpt(f, CR + 24);
        var dot = S(
          'g',
          { class: 'fom-dot' + (shown ? ' fom-dot-on' : '') + (isNext ? ' fom-dot-next' : ''), 'data-value': f },
          S('circle', { cx: r2(dp[0]), cy: r2(dp[1]), r: 15 }),
          S('text', { x: r2(dp[0]), y: r2(dp[1]) + 5, 'text-anchor': 'middle' }, shown ? String(f) : '')
        );
        if (state.dots && onDot) {
          (function (val) {
            dot.addEventListener('click', function () {
              onDot(val);
            });
          })(f);
        }
        g.appendChild(dot);
      }
    }
    redraw();
    return { svg: svg, redraw: redraw, state: state };
  }

  /* ------------------------------------------------------------------ *
   * 1 litre jug: 10 marks of 100 ml, 25 px per 100 ml (0 ml at y=300).
   * state: { ml, labelsTo, bands, half }
   * ------------------------------------------------------------------ */
  var JB = 300;
  var JPX = 0.25;
  function makeJug(state) {
    var svg = S('svg', { class: 'fom-svg fom-jug', viewBox: '0 0 320 330', role: 'img', 'aria-label': 'A 1 litre jug with 10 marks of 100 ml' });
    var g = S('g');
    svg.appendChild(g);
    function redraw() {
      MQ.clear(g);
      // handle and spout
      g.appendChild(S('path', { d: 'M200 80 C252 86 252 214 200 222', fill: 'none', stroke: '#6c7a89', 'stroke-width': 10, 'stroke-linecap': 'round' }));
      g.appendChild(S('path', { d: 'M86 34 L70 20 L96 30 Z', fill: '#eef6fb', stroke: '#6c7a89', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
      g.appendChild(S('rect', { x: 84, y: 30, width: 116, height: 274, rx: 10, fill: '#f4fafd', stroke: '#6c7a89', 'stroke-width': 4 }));
      if (state.ml > 0) {
        var h = state.ml * JPX;
        g.appendChild(S('rect', { class: 'fom-water', 'data-value': state.ml, x: 87, y: JB - h, width: 110, height: h + 1, fill: '#7cc6e6' }));
        g.appendChild(S('line', { x1: 87, x2: 197, y1: JB - h, y2: JB - h, stroke: '#3a9cc8', 'stroke-width': 2 }));
      }
      for (var k = 1; k <= 10; k++) {
        var y = JB - k * 100 * JPX;
        g.appendChild(S('line', { x1: 86, x2: k % 5 === 0 ? 124 : 110, y1: y, y2: y, stroke: '#33415c', 'stroke-width': k % 5 === 0 ? 3 : 2 }));
        if (k * 100 <= state.labelsTo || k === 10) {
          g.appendChild(S('text', { x: 78, y: y + 5, class: 'fom-jug-lbl', 'text-anchor': 'end' }, k * 100 + ' ml'));
        }
        if (state.bands && k * 100 <= state.ml) {
          g.appendChild(S('text', { x: 160, y: y + 18, class: 'fom-band', 'text-anchor': 'middle' }, String(k)));
        }
      }
      g.appendChild(S('text', { x: 78, y: JB + 5, class: 'fom-jug-lbl', 'text-anchor': 'end' }, '0'));
      if (state.half) {
        var hy = JB - 500 * JPX;
        g.appendChild(S('line', { x1: 80, x2: 204, y1: hy, y2: hy, stroke: '#c0392b', 'stroke-width': 3, 'stroke-dasharray': '7 4' }));
        g.appendChild(S('text', { x: 142, y: hy - 8, class: 'fom-half-lbl', 'text-anchor': 'middle' }, 'half'));
      }
      if (state.tenths) {
        // bracket showing "n out of 10 marks"
        var top = JB - state.ml * JPX;
        g.appendChild(S('path', { d: 'M250 ' + (JB - 2) + ' L258 ' + (JB - 2) + ' L258 ' + (top + 2) + ' L250 ' + (top + 2), fill: 'none', stroke: '#e07a00', 'stroke-width': 3 }));
        g.appendChild(S('text', { x: 264, y: (JB + top) / 2 - 4, class: 'fom-tenth-lbl', 'text-anchor': 'start' }, state.ml / 100 + ' of'));
        g.appendChild(S('text', { x: 264, y: (JB + top) / 2 + 16, class: 'fom-tenth-lbl', 'text-anchor': 'start' }, '10'));
      }
    }
    redraw();
    return { svg: svg, redraw: redraw, state: state };
  }

  /** A cup button that pours into the jug. */
  function cupBtn(ml, onPour) {
    var level = ml === 200 ? 30 : 15;
    var icon = S(
      'svg',
      { class: 'fom-cup-svg', viewBox: '0 0 60 60', 'aria-hidden': 'true' },
      S('path', { d: 'M10 8 L50 8 L45 54 L15 54 Z', fill: '#fff', stroke: '#6c7a89', 'stroke-width': 3, 'stroke-linejoin': 'round' }),
      S('path', { class: 'fom-cup-water', d: 'M' + (15 - 5 * (level / 46)) + ' ' + (54 - level) + ' L' + (45 + 5 * (level / 46)) + ' ' + (54 - level) + ' L45 54 L15 54 Z', fill: '#f4a259' })
    );
    var b = el('button', { class: 'fom-cup', type: 'button', 'data-ml': ml, 'aria-label': 'Pour ' + ml + ' ml' }, icon, el('span', { class: 'fom-cup-lbl' }, ml + ' ml'));
    b.addEventListener('click', function () {
      if (b.disabled) return;
      b.disabled = true;
      b.classList.add('fom-cup-empty');
      onPour(ml);
    });
    return b;
  }

  /** Pour into a jug in 100 ml steps. */
  function pourer(jug, api, onStep) {
    var target = jug.state.ml;
    var running = false;
    function tick() {
      if (jug.state.ml >= target) {
        running = false;
        if (onStep) onStep(jug.state.ml, true);
        return;
      }
      jug.state.ml += 100;
      if (jug.state.labelsTo < jug.state.ml && jug.state.autoLabel) jug.state.labelsTo = jug.state.ml;
      jug.redraw();
      if (onStep) onStep(jug.state.ml, false);
      api.later(tick, 230);
    }
    return {
      add: function (ml) {
        target += ml;
        if (!running) {
          running = true;
          tick();
        }
      },
      target: function () {
        return target;
      },
    };
  }

  /* ------------------------------------------------------------------ *
   * Fabric roll cut into 10 equal pieces (9 used, 1 left).
   * ------------------------------------------------------------------ */
  function makeFabric(state) {
    var svg = S('svg', { class: 'fom-svg fom-fabric', viewBox: '0 0 860 180', role: 'img', 'aria-label': 'A length of fabric cut into 10 equal pieces' });
    var g = S('g');
    svg.appendChild(g);
    var X0 = 40;
    var W = 780;
    var Y = 46;
    var H = 58;
    var pw = W / 10;
    function redraw() {
      MQ.clear(g);
      var each = state.total / 10;
      // whole length
      g.appendChild(S('line', { x1: X0, x2: X0 + W, y1: 26, y2: 26, stroke: '#33415c', 'stroke-width': 2 }));
      g.appendChild(S('line', { x1: X0, x2: X0, y1: 18, y2: 34, stroke: '#33415c', 'stroke-width': 2 }));
      g.appendChild(S('line', { x1: X0 + W, x2: X0 + W, y1: 18, y2: 34, stroke: '#33415c', 'stroke-width': 2 }));
      g.appendChild(S('rect', { x: X0 + W / 2 - 40, y: 12, width: 80, height: 26, rx: 8, fill: '#fff' }));
      g.appendChild(S('text', { x: X0 + W / 2, y: 32, class: 'fom-fab-total', 'text-anchor': 'middle' }, state.total + ' m'));
      for (var i = 0; i < 10; i++) {
        var used = i < state.used;
        var x = X0 + i * pw;
        g.appendChild(S('rect', { class: 'fom-fab-piece' + (used ? ' fom-fab-used' : ' fom-fab-left'), 'data-idx': i, x: x + 1, y: Y, width: pw - 2, height: H, rx: 3, fill: used ? '#d7d2e0' : '#ff9f68', stroke: used ? '#8e86a0' : '#c2410c', 'stroke-width': used ? 1.5 : 4 }));
        // fabric pattern: two small stripes
        g.appendChild(S('line', { x1: x + 8, x2: x + pw - 8, y1: Y + 12, y2: Y + 12, stroke: used ? '#bdb5cc' : '#ffd0b0', 'stroke-width': 3 }));
        g.appendChild(S('line', { x1: x + 8, x2: x + pw - 8, y1: Y + H - 12, y2: Y + H - 12, stroke: used ? '#bdb5cc' : '#ffd0b0', 'stroke-width': 3 }));
        g.appendChild(S('text', { x: x + pw / 2, y: Y + H / 2 + 6, class: used ? 'fom-fab-word' : 'fom-fab-word fom-fab-word-left', 'text-anchor': 'middle' }, used ? 'used' : 'left'));
        if (state.labels) g.appendChild(S('text', { x: x + pw / 2, y: Y + H + 24, class: 'fom-fab-each', 'text-anchor': 'middle' }, each + ' m'));
      }
      // brackets under used / left
      var by = Y + H + 36;
      var ux = X0 + state.used * pw;
      g.appendChild(S('path', { d: 'M' + (X0 + 2) + ' ' + by + ' L' + (X0 + 2) + ' ' + (by + 8) + ' L' + (ux - 4) + ' ' + (by + 8) + ' L' + (ux - 4) + ' ' + by, fill: 'none', stroke: '#8e86a0', 'stroke-width': 2.5 }));
      g.appendChild(S('text', { x: (X0 + ux) / 2, y: by + 30, class: 'fom-fab-br', 'text-anchor': 'middle' }, state.labels ? state.used + ' pieces used = ' + state.used * each + ' m' : state.used + ' pieces used'));
      g.appendChild(S('path', { d: 'M' + (ux + 4) + ' ' + by + ' L' + (ux + 4) + ' ' + (by + 8) + ' L' + (X0 + W - 2) + ' ' + (by + 8) + ' L' + (X0 + W - 2) + ' ' + by, fill: 'none', stroke: '#c2410c', 'stroke-width': 2.5 }));
      g.appendChild(S('text', { x: (ux + X0 + W) / 2, y: by + 30, class: 'fom-fab-br fom-fab-br-left', 'text-anchor': 'middle' }, state.labels ? 'left = ' + each + ' m' : '1 left'));
    }
    redraw();
    return { svg: svg, redraw: redraw, state: state };
  }

  /* ------------------------------------------------------------------ *
   * Two-box fraction answer (top / bottom).
   * ------------------------------------------------------------------ */
  function fracInput(onSubmit, after) {
    var n = el('input', { class: 'fom-fin fom-fin-n', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: 4, 'aria-label': 'Top number' });
    var d = el('input', { class: 'fom-fin fom-fin-d', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: 4, 'aria-label': 'Bottom number' });
    d.value = '10';
    var box = el('span', { class: 'fom-fbox' }, n, el('span', { class: 'fom-fbar' }), d);
    var btn = el('button', { class: 'btn btn-check fom-fcheck', type: 'button' }, 'Check');
    var row = el('div', { class: 'fom-frow' }, box, after ? el('span', { class: 'fom-after' }, after) : null, btn);
    function submit() {
      if (btn.disabled) return;
      onSubmit(n.value.trim(), d.value.trim());
    }
    btn.addEventListener('click', submit);
    [n, d].forEach(function (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });
      inp.addEventListener('input', function () {
        box.classList.remove('fom-bad');
      });
    });
    return {
      el: row,
      n: n,
      d: d,
      set: function (a, b) {
        n.value = a;
        d.value = b;
      },
      good: function () {
        box.classList.remove('fom-bad');
        box.classList.add('fom-good');
      },
      bad: function () {
        box.classList.add('fom-bad');
      },
      disable: function () {
        n.disabled = true;
        d.disabled = true;
        btn.disabled = true;
      },
      focus: function () {
        api_focus(n);
      },
    };
  }
  function api_focus(inp) {
    try {
      inp.focus({ preventScroll: true });
    } catch (e) {
      inp.focus();
    }
  }

  /* ------------------------------------------------------------------ *
   * Practice deck
   * ------------------------------------------------------------------ */
  var deck = null;

  function levelOf(i, count) {
    return i < count / 3 ? 1 : i < (2 * count) / 3 ? 2 : 3;
  }

  function cupsFor(ml) {
    var options = {
      300: [[200, 100], [100, 200], [100, 100, 100]],
      600: [[200, 200, 200], [200, 200, 100, 100]],
      800: [[200, 200, 200, 200], [200, 200, 200, 100, 100]],
    };
    return U.pick(options[ml]).slice();
  }

  function buildDeck() {
    var q = [];
    // Level 1: 1/2 and 1/4 of 1 m, 1/2 of an hour
    U.shuffle([
      { kind: 'metre', d: 2 },
      { kind: 'metre', d: 4 },
      { kind: 'hour', d: 2 },
    ]).forEach(function (x) {
      q.push(x);
    });
    // Level 2: 1/3 of an hour always (WB p.176 Q4), plus two of 1/4 hour, 1/10 m, 1/2 litre
    var l2 = [{ kind: 'hour', d: 3 }].concat(
      U.shuffle([
        { kind: 'hour', d: 4 },
        { kind: 'metre', d: 10 },
        { kind: 'litre', d: 2 },
      ]).slice(0, 2)
    );
    U.shuffle(l2).forEach(function (x) {
      q.push(x);
    });
    // Level 3: fraction of a litre from cups; fabric left over
    var ml = U.pick([300, 600, 800]);
    var total = U.pick([20, 30]);
    U.shuffle([
      { kind: 'litreFrac', ml: ml, cups: cupsFor(ml), who: U.pick(NAMES) },
      { kind: 'fabric', total: total, used: 9 },
    ]).forEach(function (x) {
      q.push(x);
    });
    // answers (computed from the same data that is drawn)
    q.forEach(function (x) {
      if (x.kind === 'metre') x.answer = 100 / x.d;
      else if (x.kind === 'hour') x.answer = 60 / x.d;
      else if (x.kind === 'litre') x.answer = 1000 / x.d;
      else if (x.kind === 'litreFrac') x.answer = { n: x.ml / 100, d: 10 };
      else if (x.kind === 'fabric') x.answer = x.total - (x.total / 10) * x.used;
      x.ctx = U.rand(0, 3);
    });
    return q;
  }

  var METRE_THINGS = ['ribbon', 'piece of string', 'paper strip', 'skipping rope'];
  var HOUR_THINGS = [
    ['A TV show lasts', ''],
    ['A swimming lesson lasts', ''],
    ['A bus ride takes', ''],
    ['A cake bakes for', ''],
  ];
  var LITRE_THINGS = ['juice', 'milk', 'water', 'lemonade'];

  function fracName(d) {
    return frac(1, d);
  }

  /* ------------------------------------------------------------------ *
   * Register
   * ------------------------------------------------------------------ */
  var def = {
    learn: [
      // 1. Metre stick into quarters
      function (stage, api) {
        api.say('A metre is 100 cm. Fold it into 4 equal pieces. Click where the folds go!');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('1 metre = 100 cm', 'Cut the metre stick into <b>4 equal pieces</b>. Click the 3 places to cut.'));
        var st = { cuts: [], colored: false, jumps: false, cutLabels: true, hi: -1, hover: null };
        var stick = makeStick(st);
        var hit = S('rect', { class: 'fom-hit', x: mx(0) - 10, y: MY - 30, width: 100 * MPX + 20, height: MH + 60, fill: 'transparent', style: 'cursor:pointer' });
        stick.svg.appendChild(hit);
        stage.appendChild(el('div', { class: 'fom-pic fom-pic-wide' }, stick.svg));
        var work = el('div', { class: 'fom-work' });
        stage.appendChild(work);
        var misses = 0;
        var done = false;
        function cmAt(evt) {
          var p = MQ.ui.svgPoint(stick.svg, evt);
          return U.clamp(Math.round((p.x - MX0) / MPX / 5) * 5, 0, 100);
        }
        hit.addEventListener('mousemove', function (e) {
          if (done) return;
          var v = cmAt(e);
          if (v !== st.hover) {
            st.hover = v;
            stick.redraw();
          }
        });
        hit.addEventListener('mouseleave', function () {
          st.hover = null;
          stick.redraw();
        });
        hit.addEventListener('click', function (e) {
          if (done) return;
          var v = cmAt(e);
          if (st.cuts.indexOf(v) !== -1) {
            api.feedback('You already cut at ' + v + ' cm. Find another fold.', 'info');
            return;
          }
          if (v === 0 || v === 100) {
            api.feedback('That is the end of the stick. Cut somewhere in the middle.', 'info');
            return;
          }
          if (v % 25 !== 0) {
            misses++;
            api.sound('wrong');
            api.feedback(
              misses >= 2 ? 'Fold it in half first: halfway is 50 cm. Then fold each half again.' : 'A cut at ' + v + ' cm would make pieces that are not equal. Try again.',
              'try'
            );
            return;
          }
          st.cuts.push(v);
          api.sound('pop');
          stick.redraw();
          if (st.cuts.length < 3) {
            api.feedback('Yes! ' + v + ' cm. ' + (3 - st.cuts.length) + ' more to go.', 'good');
            return;
          }
          done = true;
          st.hover = null;
          st.colored = true;
          st.jumps = true;
          stick.redraw();
          hit.style.cursor = 'default';
          api.say('4 equal pieces! Each one is 25 cm.', 'cheer');
          api.feedback('The cuts are at 25, 50 and 75 cm.', 'good');
          work.appendChild(MQ.ui.sum([25, 25, 25, 25], 100, 'cm'));
          api.later(function () {
            work.appendChild(sentence('100 ÷ 4 = 25 &nbsp;so&nbsp; ' + frac(1, 4) + ' of 1 m = <b>25 cm</b>'));
            api.unlockNext();
          }, 900);
        });
      },
      // 2. Clock in thirds, counted in 5s
      function (stage, api) {
        api.say('An hour is 60 minutes. Count round the clock in 5s!');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('1 hour = 60 minutes', 'The clock is cut into <b>3 equal parts</b>. Click the glowing dot to count on 5 minutes.'));
        var st = { parts: 3, fill: 0, hi: -1, fives: 0, dots: true, sectorLabels: false };
        var row = el('div', { class: 'fom-side' });
        var clock = makeClock(st, function (v) {
          if (v !== st.fill + 5) {
            api.feedback('Count in order. Click the glowing dot: ' + (st.fill + 5) + '.', 'info');
            return;
          }
          st.fill = v;
          st.fives = v;
          api.sound('click');
          if (v % 20 === 0) {
            var part = v / 20;
            tally.appendChild(el('div', { class: 'fom-tally-item', style: { background: COLORS[(part - 1) % COLORS.length] } }, 'Part ' + part + ': 20 min'));
            if (v < 60) api.feedback(v + ' minutes. That is ' + part + ' part' + (part > 1 ? 's' : '') + ' of 3.', 'good');
          } else {
            api.feedback(v + ' minutes', 'info');
          }
          if (v === 60) {
            st.dots = false;
            st.sectorLabels = true;
            clock.redraw();
            api.say('Each third is 20 minutes!', 'cheer');
            api.feedback('3 equal parts of 60 minutes: each part is 20 minutes.', 'good');
            work.appendChild(MQ.ui.sum([20, 20, 20], 60, 'min'));
            api.later(function () {
              work.appendChild(sentence('60 ÷ 3 = 20 &nbsp;so&nbsp; ' + frac(1, 3) + ' of an hour = <b>20 minutes</b>'));
              api.unlockNext();
            }, 900);
            return;
          }
          clock.redraw();
        });
        var tally = el('div', { class: 'fom-tally' });
        row.appendChild(el('div', { class: 'fom-pic fom-pic-clock' }, clock.svg));
        row.appendChild(tally);
        stage.appendChild(row);
        var work = el('div', { class: 'fom-work' });
        stage.appendChild(work);
      },
      // 3. Litre jug, three 200 ml cups
      function (stage, api) {
        api.say('A litre is 1000 ml. Each mark on the jug is 100 ml. Pour in the cups!');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('1 litre = 1000 ml', 'The jug has <b>10 marks</b> of 100 ml. Click each cup to pour it in.'));
        var st = { ml: 0, labelsTo: 0, bands: true, half: false, tenths: false, autoLabel: true };
        var jug = makeJug(st);
        var cups = el('div', { class: 'fom-cups' });
        var poured = 0;
        var work = el('div', { class: 'fom-work' });
        var p = pourer(jug, api, function (ml, settled) {
          if (!settled) return;
          if (p.target() === 600 && ml === 600) finish();
          else if (settled) api.feedback(ml + ' ml in the jug. That fills ' + ml / 100 + ' marks.', 'info');
        });
        var finished = false;
        function finish() {
          if (finished) return;
          finished = true;
          st.tenths = true;
          jug.redraw();
          api.say('600 ml fills 6 of the 10 marks!', 'cheer');
          api.feedback('6 marks out of 10 are full.', 'good');
          work.appendChild(MQ.ui.sum([200, 200, 200], 600, 'ml'));
          api.later(function () {
            work.appendChild(sentence('600 ml = 6 marks = ' + frac(6, 10, 'fom-frac-big') + ' of a litre'));
            api.unlockNext();
          }, 900);
        }
        for (var i = 0; i < 3; i++) {
          cups.appendChild(
            cupBtn(200, function (ml) {
              poured++;
              api.sound('pop');
              p.add(ml);
            })
          );
        }
        var row = el('div', { class: 'fom-side' }, el('div', { class: 'fom-pic fom-pic-jug' }, jug.svg), el('div', { class: 'fom-side-col' }, cups, work));
        stage.appendChild(row);
      },
    ],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0 || !deck[api.index]) deck = buildDeck();
        var q = deck[api.index];
        var work = el('div', { class: 'fom-work' });

        /* ---------- numeric questions: metre, hour, litre, fabric ---------- */
        if (q.kind !== 'litreFrac') {
          var pic;
          var unit;
          var promptHtml;
          var applyWorking;
          var judge;
          var ans = q.answer;

          if (q.kind === 'metre') {
            var d = q.d;
            var size = 100 / d; // cm in each piece
            var cuts = [];
            for (var c = 1; c < d; c++) cuts.push(c * size);
            var st = { cuts: cuts, colored: true, jumps: false, cutLabels: false, hi: -1, hover: null };
            pic = makeStick(st);
            unit = 'cm';
            promptHtml = 'This <b>1 m</b> ' + METRE_THINGS[q.ctx] + ' is cut into <b>' + d + ' equal pieces</b>.<br>How many cm is ' + fracName(d) + ' of 1 m?';
            api.say('1 metre is 100 cm. How long is one piece?', 'think');
            applyWorking = function () {
              st.jumps = true;
              st.cutLabels = d <= 4;
              st.hi = 0;
              pic.redraw();
              work.appendChild(MQ.ui.sum(repeat(size, d), 100, 'cm'));
              work.appendChild(sentence('100 ÷ ' + d + ' = ' + size + ' &nbsp;so&nbsp; ' + frac(1, d) + ' of 1 m = <b>' + size + ' cm</b>'));
            };
            judge = function (v, t) {
              if (U.same(v, ans)) return { ok: true, hint: 'Yes! ' + d + ' jumps of ' + size + ' cm make 100 cm.' };
              if (t >= 1) return { hint: d + ' equal pieces make 100 cm. Which number, added ' + d + ' times, makes 100?', tag: U.same(v, 10 / d) ? 'Used 1 m = 10 cm' : 'Found the wrong fraction of a metre' };
              if (U.same(v, 10 / d)) return { hint: 'A metre is 100 cm, not 10 cm. Look at the numbers on the stick.', tag: 'Used 1 m = 10 cm' };
              if (v === d) return { hint: d + ' is how many pieces. How many cm long is one piece? Look where the first cut is.', tag: 'Gave the number of pieces, not the length' };
              if (v === 100) return { hint: '100 cm is the whole stick. We want just one of the ' + d + ' pieces.', tag: 'Found the wrong fraction of a metre' };
              return { hint: 'Look at the first red cut. Which cm mark is it on?', tag: 'Found the wrong fraction of a metre' };
            };
          } else if (q.kind === 'hour') {
            var dh = q.d;
            var mins = 60 / dh;
            var cst = { parts: dh, fill: 60, hi: 0, fives: 0, dots: false, sectorLabels: false };
            pic = makeClock(cst);
            unit = 'minutes';
            var th = HOUR_THINGS[q.ctx];
            promptHtml = th[0] + ' ' + fracName(dh) + ' of an hour.<br>How many <b>minutes</b> is that?';
            api.say('The clock is cut into ' + dh + ' equal parts. Count the 5s in the orange part.', 'think');
            applyWorking = function () {
              cst.fives = mins;
              cst.sectorLabels = true;
              pic.redraw();
              work.appendChild(MQ.ui.sum(repeat(mins, dh), 60, 'min'));
              work.appendChild(sentence('60 ÷ ' + dh + ' = ' + mins + ' &nbsp;so&nbsp; ' + frac(1, dh) + ' of an hour = <b>' + mins + ' minutes</b>'));
            };
            judge = function (v, t) {
              var hundred = Math.abs(v - 100 / dh) < 1;
              if (v === mins) return { ok: true, hint: 'Yes! ' + dh + ' parts of ' + mins + ' minutes make 60 minutes.' };
              if (t >= 1) return { hint: dh + ' equal parts make 60 minutes. Which number, added ' + dh + ' times, makes 60?', tag: hundred ? 'Used 100 minutes in an hour' : 'Found the wrong fraction of an hour' };
              if (hundred) return { hint: 'An hour has 60 minutes, not 100. Count round the orange part in 5s.', tag: 'Used 100 minutes in an hour' };
              if (v === dh) return { hint: dh + ' is how many parts. How many minutes are in one part? Count in 5s.', tag: 'Gave the number of parts, not the minutes' };
              if (v === 60) return { hint: '60 minutes is the whole hour. We want just one of the ' + dh + ' parts.', tag: 'Found the wrong fraction of an hour' };
              return { hint: 'Count in 5s round the orange part: 5, 10, ... Each small gap between numbers is 5 minutes.', tag: 'Found the wrong fraction of an hour' };
            };
          } else if (q.kind === 'litre') {
            var jst = { ml: 500, labelsTo: 0, bands: false, half: true, tenths: false };
            pic = makeJug(jst);
            unit = 'ml';
            promptHtml = 'This 1 litre jug of ' + LITRE_THINGS[q.ctx] + ' is filled to <b>half</b>.<br>How many ml is ' + fracName(2) + ' of a litre?';
            api.say('Each mark is 100 ml. Count the full marks in 100s.', 'think');
            applyWorking = function () {
              jst.bands = true;
              jst.labelsTo = 500;
              pic.redraw();
              work.appendChild(MQ.ui.sum([500, 500], 1000, 'ml'));
              work.appendChild(sentence('1000 ÷ 2 = 500 &nbsp;so&nbsp; ' + frac(1, 2) + ' of a litre = <b>500 ml</b>'));
            };
            judge = function (v, t) {
              if (v === 500) return { ok: true, hint: 'Yes! 500 ml + 500 ml = 1000 ml, one whole litre.' };
              var small = v === 50 || v === 5;
              if (t >= 1) return { hint: 'Two equal halves make 1000 ml. Which number + the same number makes 1000?', tag: small ? 'Used the wrong number of ml in a litre' : 'Found the wrong fraction of a litre' };
              if (small) return { hint: '1 litre is 1000 ml. Each mark on the jug is 100 ml. Count the full marks: 100, 200, ...', tag: 'Used the wrong number of ml in a litre' };
              if (v === 1000) return { hint: '1000 ml is the whole litre. The jug is only half full.', tag: 'Found the wrong fraction of a litre' };
              return { hint: 'Count the full marks in 100s: 100, 200, 300 ...', tag: 'Found the wrong fraction of a litre' };
            };
          } else {
            // fabric
            var each = q.total / 10;
            var fst = { total: q.total, used: q.used, labels: false };
            pic = makeFabric(fst);
            unit = 'm';
            promptHtml = 'A shop has <b>' + q.total + ' m</b> of cloth. ' + frac(9, 10) + ' of it is used.<br>How many metres are <b>left</b>?';
            api.say('The cloth is cut into 10 equal pieces. 9 are used.', 'think');
            applyWorking = function () {
              fst.labels = true;
              pic.redraw();
              work.appendChild(MQ.ui.sum(repeat(each, 10), q.total, 'm'));
              work.appendChild(sentence(q.total + ' ÷ 10 = ' + each + '. &nbsp;9 pieces used, <b>1 piece left = ' + ans + ' m</b>'));
            };
            judge = function (v, t) {
              var usedM = each * q.used;
              if (U.same(v, ans)) return { ok: true, hint: 'Yes! Each piece is ' + each + ' m, and 1 piece is left.' };
              if (U.same(v, usedM)) return { hint: usedM + ' m is the cloth that was used. How much is left?', tag: 'Gave the amount used, not left' };
              if (t >= 1) return { hint: '10 equal pieces make ' + q.total + ' m. Which number, added 10 times, makes ' + q.total + '? That is one piece.', tag: 'Found the wrong fraction of the cloth' };
              if (v === 9) return { hint: '9 pieces were used. We want the cloth that is left, in metres.', tag: 'Gave the amount used, not left' };
              if (v === 1) return { hint: 'Yes, 1 piece is left. How many metres long is 1 piece?', tag: 'Gave the number of pieces, not metres' };
              if (v === q.total) return { hint: 'Not all of it is left. 9 of the 10 pieces were used.', tag: 'Found the wrong fraction of the cloth' };
              return { hint: 'Share ' + q.total + ' m into 10 equal pieces. How long is one piece?', tag: 'Found the wrong fraction of the cloth' };
            };
          }

          stage.appendChild(MQ.ui.prompt(promptHtml));
          var wide = q.kind === 'metre' || q.kind === 'fabric';
          stage.appendChild(el('div', { class: 'fom-pic ' + (wide ? 'fom-pic-wide' : q.kind === 'hour' ? 'fom-pic-clock' : 'fom-pic-jug') }, pic.svg));
          var inp = MQ.ui.numberInput({
            unit: unit,
            onSubmit: function (v) {
              if (api.isAnswered()) return;
              var r = judge(v, api.tries());
              if (r.ok) {
                inp.good();
                inp.disable();
                applyWorking();
                api.check(true, r.hint);
              } else {
                inp.bad();
                api.check(false, r.hint, r.tag);
              }
            },
          });
          stage.appendChild(inp.el);
          stage.appendChild(work);
          inp.focus();
          api.onReveal(function () {
            inp.setValue(String(ans));
            inp.good();
            inp.disable();
            MQ.clear(work);
            applyWorking();
            api.feedback('The answer is ' + ans + ' ' + unit + '. Look at the equal pieces and the working.', 'info');
          });
          return;
        }

        /* ---------- litreFrac: pour cups, answer as a fraction of a litre ---------- */
        var ml = q.ml;
        var tenths = ml / 100;
        var jstate = { ml: 0, labelsTo: 0, bands: true, half: false, tenths: false, autoLabel: false };
        var jug = makeJug(jstate);
        var cupList = q.cups;
        api.say('Pour the cups. How many of the 10 marks get filled?', 'think');
        stage.appendChild(
          MQ.ui.prompt(q.who + ' pours these cups into a <b>1 litre</b> jug.<br>What <b>fraction of a litre</b> is it?')
        );
        var cupsBox = el('div', { class: 'fom-cups' });
        var pq = pourer(jug, api, function (now, settled) {
          if (settled && now === ml) {
            jstate.tenths = true;
            jug.redraw();
          }
        });
        var cupBtns = cupList.map(function (c) {
          var b = cupBtn(c, function (m) {
            api.sound('pop');
            pq.add(m);
          });
          cupsBox.appendChild(b);
          return b;
        });
        var fin = fracInput(function (ns, ds) {
          if (api.isAnswered()) return;
          if (!/^\d+$/.test(ns) || !/^\d+$/.test(ds)) {
            api.feedback('Write a number in the top box and the bottom box.', 'info');
            return;
          }
          var n = parseInt(ns, 10);
          var dd = parseInt(ds, 10);
          if (dd === 0) {
            api.feedback('The bottom number cannot be 0. The jug has 10 marks.', 'info');
            return;
          }
          if (n * 1000 === ml * dd) {
            fin.good();
            fin.disable();
            showWorking();
            api.check(true, n === tenths && dd === 10 ? 'Yes! ' + ml + ' ml fills ' + tenths + ' of the 10 marks.' : 'Yes! ' + n + '/' + dd + ' is the same as ' + tenths + '/10.');
            return;
          }
          fin.bad();
          var t = api.tries();
          if (n === ml) {
            api.check(false, ml + ' ml is the amount. Now make a fraction: how many of the 10 marks does it fill?', 'Added the ml but forgot to make a fraction');
          } else if (t >= 1) {
            api.check(false, 'Each mark is 100 ml. Count in 100s up to ' + ml + ' ml: how many marks? Write that out of 10.', 'Found the wrong fraction of a litre');
          } else if (n === cupList.length && dd === 10) {
            api.check(false, 'Count marks, not cups. A 200 ml cup fills 2 marks.', 'Counted cups, not 100 ml marks');
          } else if (dd === 10) {
            api.check(false, 'Pour all the cups, then count the full marks on the jug.', 'Found the wrong fraction of a litre');
          } else {
            api.check(false, 'The jug has 10 marks, so try writing it out of 10.', 'Found the wrong fraction of a litre');
          }
        }, 'of a litre');
        var side = el('div', { class: 'fom-side-col' }, cupsBox, fin.el);
        stage.appendChild(el('div', { class: 'fom-side' }, el('div', { class: 'fom-pic fom-pic-jug fom-pic-jug-sm' }, jug.svg), side));
        stage.appendChild(work);
        fin.focus();

        function showWorking() {
          cupBtns.forEach(function (b) {
            b.disabled = true;
            b.classList.add('fom-cup-empty');
          });
          jstate.ml = ml;
          jstate.labelsTo = ml;
          jstate.tenths = true;
          jug.redraw();
          MQ.clear(work);
          work.appendChild(MQ.ui.sum(cupList, ml, 'ml'));
          work.appendChild(sentence(ml + ' ml = ' + tenths + ' marks = ' + frac(tenths, 10) + ' of a litre'));
        }
        api.onReveal(function () {
          fin.set(String(tenths), '10');
          fin.good();
          fin.disable();
          showWorking();
          api.feedback(ml + ' ml fills ' + tenths + ' of the 10 marks, so it is ' + tenths + '/10 of a litre.', 'info');
        });
      },
    },
  };
  def._buildDeck = buildDeck; // used by the deck test only
  def._levelOf = levelOf;
  MQ.register('fraction-of-measures', def);

  var css = [
    '.fom-svg{display:block;width:100%;height:auto;max-width:100%}',
    '.fom-pic{width:100%;display:flex;justify-content:center}',
    '.fom-pic-wide{max-width:780px}',
    '.fom-pic-clock{max-width:265px}',
    '.fom-pic-jug{max-width:300px;flex:0 1 300px}',
    '.fom-pic-jug-sm{max-width:250px;flex:0 1 250px}',
    '.fom-tick-lbl{font-size:17px;font-weight:700;fill:#33415c}',
    '.fom-small{font-size:15px;font-weight:700;fill:#5b4a2a}',
    '.fom-cut-lbl{font-size:16px;font-weight:800;fill:#c0392b}',
    '.fom-jump-lbl{font-size:19px;font-weight:800;fill:#0b6e66}',
    '.fom-hover-lbl{font-size:16px;font-weight:800;fill:#333}',
    '.fom-hour{font-size:16px;font-weight:700;fill:#33415c;stroke:#fff;stroke-width:4px;paint-order:stroke;stroke-linejoin:round}',
    '.fom-sec-lbl{font-size:13px;font-weight:800;fill:#0b6e66}',
    '.fom-dot circle{fill:#fff;stroke:#c7cfdb;stroke-width:2}',
    '.fom-dot text{font-size:13px;font-weight:800;fill:#0b6e66}',
    '.fom-dot-on circle{fill:#e6f7f5;stroke:#0b6e66}',
    '.fom-dot-next{cursor:pointer}',
    '.fom-dot-next circle{fill:#ffe08a;stroke:#e07a00;stroke-width:3;animation:fom-pulse 1s ease-in-out infinite}',
    '@keyframes fom-pulse{50%{fill:#ffb703;stroke-width:6}}',
    '.fom-jug-lbl{font-size:17px;font-weight:700;fill:#33415c}',
    '.fom-band{font-size:17px;font-weight:800;fill:#0d4f6c}',
    '.fom-half-lbl{font-size:15px;font-weight:800;fill:#c0392b}',
    '.fom-tenth-lbl{font-size:21px;font-weight:800;fill:#e07a00}',
    '.fom-fab-total{font-size:20px;font-weight:800;fill:#33415c}',
    '.fom-fab-word{font-size:15px;font-weight:700;fill:#5b5470}',
    '.fom-fab-word-left{fill:#7c2d12;font-weight:800}',
    '.fom-fab-each{font-size:16px;font-weight:800;fill:#0b6e66}',
    '.fom-fab-br{font-size:16px;font-weight:800;fill:#5b5470}',
    '.fom-fab-br-left{fill:#c2410c}',
    '.fom-work{display:flex;flex-direction:column;align-items:center;gap:8px;min-height:0}',
    '.fom-sent{font-size:1.35rem;font-weight:800;text-align:center;background:#fff;border:3px solid var(--gold);border-radius:14px;padding:6px 16px;animation:fom-in .4s ease}',
    '.fom-sent b{color:#0b6e66}',
    '@keyframes fom-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
    '.fom-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;margin:0 .12em;font-weight:800}',
    '.fom-fn{padding:0 .15em}',
    '.fom-fd{border-top:3px solid currentColor;padding:0 .15em}',
    '.fom-frac-big{font-size:1.25em;color:#0b6e66}',
    '.prompt .fom-frac{font-size:.9em}',
    '.fom-side{display:flex;align-items:center;justify-content:center;gap:24px;flex-wrap:wrap;width:100%}',
    '.fom-side-col{display:flex;flex-direction:column;align-items:center;gap:14px;min-width:0;max-width:480px}',
    '.fom-tally{display:flex;flex-direction:column;gap:8px;min-width:150px}',
    '.fom-tally-item{font-weight:800;font-size:1.1rem;border-radius:12px;padding:8px 14px;border:2px solid rgba(0,0,0,.15);animation:fom-in .4s ease}',
    '.fom-cups{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.fom-cup{display:flex;flex-direction:column;align-items:center;gap:2px;background:#fff;border:3px solid var(--line);border-radius:14px;padding:6px 8px;cursor:pointer;font-family:inherit;transition:transform .08s ease}',
    '.fom-cup:hover:not(:disabled){border-color:var(--accent);transform:translateY(-2px)}',
    '.fom-cup-svg{width:44px;height:44px}',
    '.fom-cup-lbl{font-weight:800;font-size:1.05rem;color:var(--ink)}',
    '.fom-cup-empty{opacity:.55;cursor:default}',
    '.fom-cup-empty .fom-cup-water{display:none}',
    '.fom-frow{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:center}',
    '.fom-fbox{display:inline-flex;flex-direction:column;align-items:center;gap:4px;padding:5px;border-radius:12px;border:3px solid transparent}',
    '.fom-fbox.fom-good{border-color:var(--good);background:var(--good-bg)}',
    '.fom-fbox.fom-bad{border-color:var(--try);background:var(--try-bg)}',
    '.fom-fbar{display:block;width:84px;height:4px;background:var(--ink);border-radius:2px}',
    '.fom-fin{width:84px;height:48px;font-size:1.5rem;font-weight:800;text-align:center;border-radius:12px;border:3px solid var(--line);color:var(--ink);font-family:inherit}',
    '.fom-after{font-size:1.3rem;font-weight:800}',
    '@media (max-width:640px){.fom-side{gap:12px}.fom-sent{font-size:1.15rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'fraction-of-measures' }, css));
})();

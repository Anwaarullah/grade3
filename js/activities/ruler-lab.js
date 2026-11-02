/* Ruler Lab — measure lengths with a ruler, including broken rulers that do not start at 0,
 * and round to the nearest centimetre (Unit 6.1). All drawings are original.
 * Objects are drawn at exactly the ruler's scale (CM units per centimetre), so what the
 * child reads from the picture is always the true answer.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  var CM = 40; // SVG units per centimetre: rulers and objects share this scale
  var VB_W = 720; // scene width (viewBox units)
  var RY = 70; // top edge of the ruler in the scene
  var GAP = 3; // space between the object and the ruler
  var LENS_K = 2; // magnifier zoom
  var LENS_R = 90; // magnifier radius (lens viewBox units)
  var uid = 0;

  function n2(v) {
    return Math.round(v * 100) / 100;
  }
  function pts(list) {
    return list
      .map(function (p) {
        return n2(p[0]) + ',' + n2(p[1]);
      })
      .join(' ');
  }

  /* ------------------------------------------------------------------ *
   * Everyday objects. Each draw(L, hue) returns a <g> whose leftmost point is
   * exactly x = 0 and rightmost point exactly x = L (no strokes on the ends).
   * top/bot = vertical extent; startY/endY = y of the left/right extreme point.
   * ------------------------------------------------------------------ */
  function drawPencil(L) {
    var e = 14;
    var f = 10;
    var tip = Math.min(36, L * 0.22);
    var bx = L - tip;
    var gl = tip * 0.32;
    var gy = (10 * gl) / tip;
    var b0 = e + f;
    return S(
      'g',
      null,
      S('path', { d: 'M' + e + ',-9 H4 Q0,-9 0,-5 V5 Q0,9 4,9 H' + e + ' Z', fill: '#f29bb0' }),
      S('rect', { x: b0, y: -10, width: n2(bx - b0), height: 7, fill: '#ffd75e' }),
      S('rect', { x: b0, y: -3, width: n2(bx - b0), height: 6, fill: '#fcc419' }),
      S('rect', { x: b0, y: 3, width: n2(bx - b0), height: 7, fill: '#eaa500' }),
      S('polygon', { points: pts([[bx, -10], [L, 0], [bx, 10]]), fill: '#f3d6a4' }),
      S('path', { d: 'M' + n2(bx) + ',-10 q5,3.33 0,6.67 q5,3.33 0,6.67 q5,3.33 0,6.67 Z', fill: '#fcc419' }),
      S('polygon', { points: pts([[L - gl, -gy], [L, 0], [L - gl, gy]]), fill: '#3f3f46' }),
      S('rect', { x: e - 1, y: -10, width: f + 2, height: 20, fill: '#aab4c3' }),
      S('line', { x1: e + 3, y1: -10, x2: e + 3, y2: 10, stroke: '#8a95a6', 'stroke-width': 1.2 }),
      S('line', { x1: e + 7, y1: -10, x2: e + 7, y2: 10, stroke: '#8a95a6', 'stroke-width': 1.2 })
    );
  }

  var CRAYON_COLORS = [
    ['#e63946', '#b92b37'],
    ['#3a86ff', '#2a66c9'],
    ['#2a9d55', '#1f7a42'],
    ['#8e5bd6', '#6c42ad'],
  ];
  function drawCrayon(L, hue) {
    var c = CRAYON_COLORS[hue % CRAYON_COLORS.length];
    var tip = Math.min(24, L * 0.2);
    var bx = L - tip;
    var w0 = 7;
    var w1 = bx - 7;
    return S(
      'g',
      null,
      S('path', { d: 'M3,-10 H' + n2(bx) + ' V10 H3 Q0,10 0,7 V-7 Q0,-10 3,-10 Z', fill: c[0] }),
      S('rect', { x: w0, y: -10, width: n2(w1 - w0), height: 20, fill: c[1] }),
      S('ellipse', { cx: n2((w0 + w1) / 2), cy: 0, rx: n2(Math.min(30, (w1 - w0) * 0.3)), ry: 5, fill: 'rgba(255,255,255,.35)' }),
      S('line', { x1: w0 + 4, y1: -10, x2: w0 + 4, y2: 10, stroke: 'rgba(0,0,0,.25)', 'stroke-width': 1.5 }),
      S('line', { x1: n2(w1 - 4), y1: -10, x2: n2(w1 - 4), y2: 10, stroke: 'rgba(0,0,0,.25)', 'stroke-width': 1.5 }),
      S('path', { d: 'M' + n2(bx) + ',-10 L' + n2(L - 5) + ',-3.5 Q' + L + ',-3 ' + L + ',0 Q' + L + ',3 ' + n2(L - 5) + ',3.5 L' + n2(bx) + ',10 Z', fill: c[0] })
    );
  }

  var KEY_COLORS = [
    ['#e0b23c', '#b8860b'],
    ['#b9c2cf', '#7d8a99'],
  ];
  function drawKey(L, hue) {
    var c = KEY_COLORS[hue % KEY_COLORS.length];
    var R = Math.min(15, L * 0.19);
    var hole = R * 0.42;
    var hc = R * 0.8;
    var bow =
      'M0,0 a' + R + ',' + R + ' 0 1,0 ' + 2 * R + ',0 a' + R + ',' + R + ' 0 1,0 ' + -2 * R + ',0 Z ' +
      'M' + n2(hc - hole) + ',0 a' + n2(hole) + ',' + n2(hole) + ' 0 1,0 ' + n2(2 * hole) + ',0 a' + n2(hole) + ',' + n2(hole) + ' 0 1,0 ' + n2(-2 * hole) + ',0 Z';
    var a = 2 * R + 10 + (L - 2 * R - 20) * 0.35;
    var b = L - 12;
    var n = U.clamp(Math.floor((b - a) / 10), 3, 6);
    var w = (b - a) / n;
    var teeth = [[a, 4]];
    var depths = [9, 6, 10, 7, 8, 5];
    for (var i = 0; i < n; i++) {
      var x1 = a + i * w;
      teeth.push([x1 + w * 0.15, 4 + depths[i]], [x1 + w * 0.65, 4 + depths[i]], [x1 + w, 6]);
    }
    teeth.push([b, 4]);
    return S(
      'g',
      null,
      S('polygon', { points: pts(teeth), fill: c[0] }),
      S('rect', { x: n2(2 * R + 2), y: -4, width: n2(L - 8 - (2 * R + 2)), height: 8, fill: c[0] }),
      S('polygon', { points: pts([[L - 8, -4], [L, 0], [L - 8, 4]]), fill: c[0] }),
      S('line', { x1: n2(2 * R + 8), y1: 0, x2: n2(L - 10), y2: 0, stroke: c[1], 'stroke-width': 1.5 }),
      S('rect', { x: n2(2 * R - 3), y: -6.5, width: 7, height: 13, rx: 1.5, fill: c[1] }),
      S('path', { d: bow, fill: c[0], 'fill-rule': 'evenodd' })
    );
  }

  var BRUSH_COLORS = ['#d62828', '#2f6fd6', '#2a9d55'];
  var PAINT_COLORS = ['#2f6fd6', '#e8590c', '#d62828'];
  function drawPaintbrush(L, hue) {
    var hEnd = L * 0.58;
    var fEnd = L * 0.72;
    var cx = fEnd + (L - fEnd) * 0.55;
    var id = 'rl-brush-' + ++uid;
    var px = fEnd + (L - fEnd) * 0.62; // where the wet paint starts
    var bristle = 'M' + n2(fEnd) + ',-6 Q' + n2(cx) + ',-8.5 ' + L + ',0 Q' + n2(cx) + ',8.5 ' + n2(fEnd) + ',6 Z';
    return S(
      'g',
      null,
      S('defs', null, S('clipPath', { id: id }, S('path', { d: bristle }))),
      S('path', { d: 'M4,-3.5 Q0,-3.5 0,0 Q0,3.5 4,3.5 L' + n2(hEnd) + ',6 L' + n2(hEnd) + ',-6 Z', fill: BRUSH_COLORS[hue % BRUSH_COLORS.length] }),
      S('path', { d: bristle, fill: '#a0703f' }),
      S('rect', { x: n2(px), y: -7, width: n2(L - px), height: 14, fill: PAINT_COLORS[hue % PAINT_COLORS.length], 'clip-path': 'url(#' + id + ')' }),
      S('rect', { x: n2(hEnd), y: -6.5, width: n2(fEnd - hEnd + 1), height: 13, fill: '#b9c2cf' }),
      S('line', { x1: n2(hEnd + 6), y1: -6.5, x2: n2(hEnd + 6), y2: 6.5, stroke: '#8a95a6', 'stroke-width': 1.2 }),
      S('line', { x1: n2(hEnd + 10), y1: -6.5, x2: n2(hEnd + 10), y2: 6.5, stroke: '#8a95a6', 'stroke-width': 1.2 })
    );
  }

  var BRUSH2_COLORS = [
    ['#4cb5e8', '#2b8fc4'],
    ['#f06595', '#c2255c'],
    ['#51cf66', '#2f9e44'],
  ];
  function drawToothbrush(L, hue) {
    var c = BRUSH2_COLORS[hue % BRUSH2_COLORS.length];
    var hx = L * 0.6;
    var nx = L * 0.72;
    var bx0 = L * 0.74;
    var bx1 = L * 0.96;
    var g = S(
      'g',
      null,
      S('rect', { x: 0, y: -6, width: n2(hx), height: 12, rx: 6, fill: c[0] }),
      S('ellipse', { cx: n2(L * 0.3), cy: 0, rx: n2(L * 0.12), ry: 3, fill: c[1] }),
      S('polygon', { points: pts([[hx - 4, -5], [nx, -3], [nx, 3], [hx - 4, 5]]), fill: c[0] }),
      S('rect', { x: n2(L * 0.71), y: -4, width: n2(L * 0.29), height: 8, rx: 4, fill: c[0] }),
      S('rect', { x: n2(bx0), y: -14, width: n2(bx1 - bx0), height: 10, fill: '#ffffff', stroke: '#9ccbe6', 'stroke-width': 1 })
    );
    for (var x = bx0 + 5; x < bx1 - 2; x += 5) g.appendChild(S('line', { x1: n2(x), y1: -13.5, x2: n2(x), y2: -4.5, stroke: '#bfe0f2', 'stroke-width': 1 }));
    return g;
  }

  function drawSpoon(L) {
    var bl = Math.min(L * 0.4, 64);
    var bcx = L - bl / 2;
    return S(
      'g',
      null,
      S('path', { d: 'M5,-5 Q0,-5 0,0 Q0,5 5,5 L' + n2(L - bl + 4) + ',2.2 L' + n2(L - bl + 4) + ',-2.2 Z', fill: '#9ba7b6' }),
      S('ellipse', { cx: n2(bcx), cy: 0, rx: n2(bl / 2), ry: 12, fill: '#9ba7b6' }),
      S('ellipse', { cx: n2(bcx + 2), cy: -2, rx: n2(bl / 2 - 7), ry: 7, fill: '#dfe5ec' }),
      S('ellipse', { cx: 9, cy: -1, rx: 4, ry: 1.6, fill: '#dfe5ec' })
    );
  }

  function drawEraser(L) {
    var xs = L * 0.38;
    return S(
      'g',
      null,
      S('rect', { x: 0, y: -12, width: L, height: 24, rx: 5, fill: '#f7a1b5' }),
      S('path', { d: 'M' + n2(xs) + ',-12 H' + (L - 3) + ' Q' + L + ',-12 ' + L + ',-9 V9 Q' + L + ',12 ' + (L - 3) + ',12 H' + n2(xs) + ' Z', fill: '#3d7be0' }),
      S('line', { x1: n2(xs + 7), y1: -3, x2: n2(L - 7), y2: -3, stroke: '#ffffff', 'stroke-width': 2, opacity: 0.8 }),
      S('line', { x1: n2(xs + 7), y1: 3, x2: n2(L - 12), y2: 3, stroke: '#ffffff', 'stroke-width': 2, opacity: 0.8 })
    );
  }

  function drawPaperClip(L) {
    var sw = 2.6;
    var a = sw / 2;
    var b = L - sw / 2;
    var d =
      'M' + n2(a + 12) + ',-7 L' + n2(b - 7) + ',-7 A7,7 0 0,1 ' + n2(b - 7) + ',7 L' + n2(a + 5.5) + ',7 A5.5,5.5 0 0,1 ' + n2(a + 5.5) + ',-4 ' +
      'L' + n2(b - 10.5) + ',-4 A3.5,3.5 0 0,1 ' + n2(b - 10.5) + ',3 L' + n2(a + 14) + ',3';
    return S('g', null, S('path', { d: d, fill: 'none', stroke: '#7d8a99', 'stroke-width': sw, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  }

  var COMB_COLORS = ['#7b4fc9', '#2f9e8f', '#e8590c'];
  function drawComb(L, hue) {
    var col = COMB_COLORS[hue % COMB_COLORS.length];
    var tw = 3;
    var n = Math.max(6, Math.floor(L / 8));
    var g = S('g', null, S('rect', { x: 0, y: -12, width: L, height: 9, rx: 2, fill: col }));
    for (var i = 0; i < n; i++) {
      var x = (i * (L - tw)) / (n - 1);
      g.appendChild(S('rect', { x: n2(x), y: -4, width: tw, height: 16, fill: col }));
    }
    return g;
  }

  var CHALK_COLORS = ['#ffd43b', '#74c0fc', '#f783ac'];
  function drawChalk(L, hue) {
    return S(
      'g',
      null,
      S('rect', { x: 0, y: -7, width: L, height: 14, rx: 6, fill: CHALK_COLORS[hue % CHALK_COLORS.length] }),
      S('line', { x1: 8, y1: -3, x2: n2(L - 8), y2: -3, stroke: 'rgba(255,255,255,.65)', 'stroke-width': 2, 'stroke-linecap': 'round' })
    );
  }

  // min/max = realistic lengths in cm for this object
  var OBJECTS = {
    pencil: { name: 'pencil', min: 6, max: 12, top: -10, bot: 10, draw: drawPencil },
    crayon: { name: 'crayon', min: 5, max: 10, top: -10, bot: 10, draw: drawCrayon },
    key: { name: 'key', min: 4, max: 8, top: -15, bot: 15, draw: drawKey },
    paintbrush: { name: 'paintbrush', min: 7, max: 12, top: -7, bot: 7, draw: drawPaintbrush },
    toothbrush: { name: 'toothbrush', min: 9, max: 12, top: -14.5, bot: 6, draw: drawToothbrush },
    spoon: { name: 'spoon', min: 8, max: 12, top: -12, bot: 12, draw: drawSpoon },
    eraser: { name: 'eraser', min: 2, max: 6, top: -12, bot: 12, startY: 6, endY: 6, draw: drawEraser },
    clip: { name: 'paper clip', min: 3, max: 5, top: -8.3, bot: 8.3, startY: 1.5, draw: drawPaperClip },
    comb: { name: 'comb', min: 6, max: 12, top: -12, bot: 12, startY: 4, endY: 4, draw: drawComb },
    chalk: { name: 'piece of chalk', min: 2, max: 8, top: -7, bot: 7, draw: drawChalk },
  };

  /* ------------------------------------------------------------------ *
   * Scene: a ruler with an object lying on it, drawn to scale.
   * ------------------------------------------------------------------ */
  function tornEdges(r) {
    var h = r.height;
    var w = r.width;
    var zig = [[6, -2], [2, 7], [7, 15], [2, 24], [8, 33], [3, 42], [7, 50], [4, h + 2]];
    var left = pts(zig);
    var right = pts(
      zig.map(function (p) {
        return [w - p[0], p[1]];
      })
    );
    r.g.appendChild(S('polygon', { points: '-4,-4 ' + left + ' -4,' + (h + 4), fill: '#fff' }));
    r.g.appendChild(S('polyline', { points: left, class: 'rl-torn' }));
    r.g.appendChild(S('polygon', { points: w + 4 + ',-4 ' + right + ' ' + (w + 4) + ',' + (h + 4), fill: '#fff' }));
    r.g.appendChild(S('polyline', { points: right, class: 'rl-torn' }));
  }

  /**
   * cfg: from, to, broken, lead, s (reading where the object starts), tenths (object length in
   * tenths of a cm), obj, hue, objX / rulerX (fixed positions, learn screen 1), bottom (space below ruler)
   */
  function makeScene(cfg) {
    var def = OBJECTS[cfg.obj];
    var r = MQ.ui.ruler({ from: cfg.from, to: cfg.to, cm: CM, broken: !!cfg.broken, lead: cfg.lead || (cfg.broken ? 20 : 14) });
    var rx = cfg.rulerX != null ? cfg.rulerX : Math.round((VB_W - r.width) / 2);
    r.moveTo(rx, RY);
    if (cfg.broken) tornEdges(r);
    var RB = RY + r.height;
    var H = RB + (cfg.bottom == null ? 58 : cfg.bottom);
    var root = S('svg', {
      viewBox: '0 0 ' + VB_W + ' ' + H,
      width: VB_W,
      height: H,
      class: 'rl-svg',
      role: 'img',
      'aria-label': 'A ' + def.name + ' lying along a ruler',
    });
    root.appendChild(S('rect', { x: 0, y: 0, width: VB_W, height: H, fill: '#fff' }));
    root.appendChild(r.g);

    var Lpx = (cfg.tenths * CM) / 10;
    var x0 = cfg.objX != null ? cfg.objX : rx + r.xOf(cfg.s);
    var xe = x0 + Lpx;
    var oy = RY - GAP - def.bot;
    var objG = def.draw(Lpx, cfg.hue || 0);
    objG.setAttribute('transform', 'translate(' + n2(x0) + ',' + oy + ')');
    objG.setAttribute('class', 'rl-obj');
    root.appendChild(objG);
    var guideG = S(
      'g',
      { class: 'rl-guides' },
      S('line', { x1: n2(x0), y1: oy + (def.startY || 0), x2: n2(x0), y2: RY + 22, class: 'rl-guide rl-guide-start' }),
      S('line', { x1: n2(xe), y1: oy + (def.endY || 0), x2: n2(xe), y2: RY + 22, class: 'rl-guide rl-guide-end' })
    );
    root.appendChild(guideG);
    var markG = S('g', { class: 'rl-marks' });
    var hopG = S('g', { class: 'rl-hops' });
    root.appendChild(markG);
    root.appendChild(hopG);
    var objTop = oy + def.top;

    var sc = {
      svg: root,
      ruler: r,
      def: def,
      objG: objG,
      guideG: guideG,
      x0: x0,
      xe: xe,
      RB: RB,
      /** x in the scene of ruler reading n (follows the ruler if it moves) */
      X: function (n) {
        return r.x + r.xOf(n);
      },
      pill: function (x, text, cls) {
        var w = text.length * 8.4 + 18;
        var h = 24;
        var px = U.clamp(x, w / 2 + 2, VB_W - w / 2 - 2);
        var y = objTop - 9 - h;
        var g = S(
          'g',
          { class: 'rl-pill ' + (cls || '') },
          S('line', { x1: n2(x), y1: y + h, x2: n2(x), y2: objTop - 2 }),
          S('rect', { x: n2(px - w / 2), y: y, width: n2(w), height: h, rx: 12 }),
          S('text', { x: n2(px), y: y + 17, 'text-anchor': 'middle' }, text)
        );
        markG.appendChild(g);
        return g;
      },
      /** one numbered jump of 1 cm under the ruler, from reading (from + i) to (from + i + 1) */
      hop: function (i, from) {
        var x1 = sc.X(from + i);
        var x2 = sc.X(from + i + 1);
        var mid = (x1 + x2) / 2;
        var y = RB + 3;
        hopG.appendChild(
          S(
            'g',
            { class: 'rl-hopg' },
            S('path', { d: 'M' + n2(x1) + ',' + y + ' Q' + n2(mid) + ',' + (y + 30) + ' ' + n2(x2) + ',' + y, pathLength: 1, class: 'rl-hop' }),
            S('circle', { cx: n2(mid), cy: y + 36, r: 11, class: 'rl-hop-dot' }),
            S('text', { x: n2(mid), y: y + 41, class: 'rl-hop-num', 'text-anchor': 'middle' }, String(i + 1))
          )
        );
      },
      clearHops: function () {
        MQ.clear(hopG);
      },
      /** purple halfway mark between reading n and n + 1 */
      half: function (n) {
        var hx = sc.X(n + 0.5);
        markG.appendChild(S('line', { x1: n2(hx), y1: RY - 1, x2: n2(hx), y2: RY + 15, class: 'rl-half-main' }));
      },
      /** dashed circle showing the part the magnifier shows */
      focusRing: function (n) {
        var ring = S('circle', { cx: n2(sc.X(n + 0.5)), cy: RY + 6, r: n2(LENS_R / LENS_K), class: 'rl-focus' });
        markG.appendChild(ring);
        return ring;
      },
    };
    return sc;
  }

  /** A magnifying glass (its own small SVG) showing the end of the object between reading n and n + 1. */
  function makeLens(sc, n) {
    var C = 100;
    var fx = sc.X(n + 0.5);
    var fy = RY + 6;
    var id = 'rl-lens-' + ++uid;
    var root = S('svg', { viewBox: '0 0 224 224', width: 196, height: 196, class: 'rl-lens-svg', role: 'img', 'aria-label': 'Close-up of the end, with the halfway mark' });
    root.appendChild(S('defs', null, S('clipPath', { id: id }, S('circle', { cx: C, cy: C, r: LENS_R }))));
    var inner = S('g', { transform: 'translate(' + C + ',' + C + ') scale(' + LENS_K + ') translate(' + n2(-fx) + ',' + -fy + ')' });
    [sc.ruler.g, sc.objG, sc.guideG].forEach(function (node) {
      var c = node.cloneNode(true);
      c.removeAttribute('style');
      inner.appendChild(c);
    });
    inner.appendChild(S('line', { x1: n2(fx), y1: RY - 1, x2: n2(fx), y2: RY + 15, class: 'rl-half' }));
    inner.appendChild(S('text', { x: n2(fx), y: RY + 25, class: 'rl-half-txt', 'text-anchor': 'middle' }, 'halfway'));
    root.appendChild(S('circle', { cx: C, cy: C, r: LENS_R, fill: '#fff' }));
    root.appendChild(S('g', { 'clip-path': 'url(#' + id + ')' }, inner));
    root.appendChild(S('line', { x1: n2(C + LENS_R * 0.72), y1: n2(C + LENS_R * 0.72), x2: 214, y2: 214, class: 'rl-lens-handle' }));
    root.appendChild(S('circle', { cx: C, cy: C, r: LENS_R, class: 'rl-lens-rim' }));
    return root;
  }

  function chip(text, cls) {
    return el('span', { class: 'chip' + (cls ? ' ' + cls : '') }, String(text));
  }
  function op(text) {
    return el('span', { class: 'sum-op' }, text);
  }
  /** "19 − 12 = 7 cm" as chips */
  function subtraction(e, s, len) {
    return el('div', { class: 'sum-row rl-sum' }, chip(e), op('−'), chip(s), op('='), chip(len + ' cm', 'chip-total'));
  }

  /** Run n jumps one after another, then call done. */
  function animateHops(api, sc, from, n, done) {
    var i = 0;
    sc.clearHops();
    (function step() {
      if (i >= n) {
        if (done) done();
        return;
      }
      sc.hop(i, from);
      api.sound('pop');
      i++;
      api.later(step, 300);
    })();
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */
  function learnZero(stage, api) {
    api.lockNext();
    var key = U.pick(['pencil', 'crayon', 'paintbrush', 'spoon']);
    var def = OBJECTS[key];
    var len = U.rand(Math.max(def.min, 6), Math.min(def.max, 10));
    var lead = 24;
    var objX = 150;
    stage.appendChild(MQ.ui.lesson('Start at zero', 'Slide the ruler so its <b>0 line</b> is at the start of the ' + def.name + '.'));
    var sc = makeScene({ from: 0, to: 12, lead: lead, objX: objX, rulerX: 10, tenths: len * 10, obj: key, hue: U.rand(0, 3), bottom: 30 });
    var r = sc.ruler;
    r.g.classList.add('rl-drag');
    r.g.appendChild(S('line', { x1: lead, y1: 0, x2: lead, y2: 22, class: 'rl-zero' }));
    r.g.appendChild(S('text', { x: lead, y: r.height + 20, class: 'rl-zero-txt', 'text-anchor': 'middle' }, '▲ 0 line'));
    sc.pill(objX, 'start', 'rl-pill-start');
    stage.appendChild(sc.svg);
    api.say('Drag the ruler. Put the 0 line at the start of the ' + def.name + '.');

    var minX = 6;
    var maxX = VB_W - r.width - 6;
    var startRX = 0;
    var done = false;
    var unbind = MQ.ui.drag(sc.svg, r.g, {
      start: function () {
        startRX = r.x;
      },
      move: function (p, dx) {
        if (done) return;
        r.moveTo(U.clamp(startRX + dx, minX, maxX), RY);
      },
      end: function () {
        if (done) return;
        var zeroX = r.x + r.xOf(0);
        if (Math.abs(zeroX - objX) <= 10) {
          done = true;
          r.moveTo(objX - lead, RY);
          r.g.style.cursor = 'default';
          r.g.appendChild(S('rect', { x: r.xOf(len) - 16, y: 25, width: 32, height: 21, rx: 8, class: 'rl-ring' }));
          sc.pill(sc.xe, len + ' cm', 'rl-pill-end');
          api.sound('correct');
          api.say('The 0 is at the start, and the end is at ' + len + '. The ' + def.name + ' is ' + len + ' cm long!', 'cheer');
          api.feedback('Start at 0, then read the number at the end.', 'good');
          api.unlockNext();
        } else if (Math.abs(r.x - objX) <= 10) {
          api.say('That is the edge of the ruler. Line up the 0 line instead!', 'oops');
          api.feedback('Look for the green 0 line. It is a little way in from the edge.', 'try');
        } else {
          api.feedback(zeroX < objX ? 'Keep sliding to the right ▶' : '◀ Too far! Slide back to the left.', 'info');
        }
      },
    });
    api.cleanup(unbind);
  }

  function learnBroken(stage, api) {
    api.lockNext();
    var s = 12;
    var e = 19;
    stage.appendChild(MQ.ui.lesson('Broken ruler', 'This ruler starts at <b>12</b>, not 0.'));
    var sc = makeScene({ from: 12, to: 21, broken: true, s: s, tenths: (e - s) * 10, obj: 'crayon', hue: 1 });
    sc.pill(sc.x0, 'start 12', 'rl-pill-start');
    sc.pill(sc.xe, 'end 19', 'rl-pill-end');
    stage.appendChild(sc.svg);
    var btn = el('button', { class: 'btn rl-jump', type: 'button' }, 'Jump ▶');
    var count = el('div', { class: 'rl-count' }, '0 jumps');
    var work = el('div', { class: 'rl-work' });
    stage.appendChild(el('div', { class: 'rl-row' }, btn, count));
    stage.appendChild(work);
    api.say('The crayon ends at 19. Is it 19 cm long? No! It starts at 12. Click Jump to count the centimetres.', 'think');
    var n = 0;
    btn.addEventListener('click', function () {
      if (n >= e - s) return;
      sc.hop(n, s);
      api.sound('pop');
      n++;
      count.textContent = n + (n === 1 ? ' jump' : ' jumps');
      if (n === e - s) {
        btn.disabled = true;
        work.appendChild(subtraction(e, s, e - s));
        api.say('7 jumps! 19 − 12 = 7. The crayon is 7 cm long, not 19 cm.', 'cheer');
        api.feedback('Count the jumps (the gaps), or work out end − start.', 'good');
        api.unlockNext();
      }
    });
  }

  function learnNearest(stage, api) {
    api.lockNext();
    var whole = U.pick([5, 6, 7, 8]);
    var t = U.pick([2, 3, 7, 8]);
    var near = t >= 6 ? whole + 1 : whole;
    stage.appendChild(MQ.ui.lesson('Nearest centimetre', 'This pencil ends <b>between</b> two numbers.'));
    var sc = makeScene({ from: 0, to: 10, s: 0, tenths: whole * 10 + t, obj: 'pencil', bottom: 14 });
    sc.focusRing(whole);
    stage.appendChild(sc.svg);
    var lens = makeLens(sc, whole);
    var ch = MQ.ui.choices(
      [
        { label: whole + ' cm', value: whole },
        { label: whole + 1 + ' cm', value: whole + 1 },
      ],
      function (v) {
        if (v === near) {
          ch.mark(v, 'good');
          ch.disable();
          sc.half(whole);
          sc.pill(sc.X(near), 'about ' + near + ' cm', 'rl-pill-end');
          api.sound('correct');
          api.say((near > whole ? 'It is past the halfway mark, so it is nearer ' : 'It is before the halfway mark, so it is nearer ') + near + '. The pencil is about ' + near + ' cm long.', 'cheer');
          api.feedback('Before halfway: round down. Past halfway: round up.', 'good');
          api.unlockNext();
        } else {
          ch.mark(v, 'bad');
          api.sound('wrong');
          api.say('Look in the magnifier. Is the end before the halfway mark, or past it?', 'oops');
          api.feedback('Find the purple halfway mark. Which side of it is the end?', 'try');
        }
      },
      { columns: 2 }
    );
    stage.appendChild(el('div', { class: 'rl-row' }, lens, el('div', { class: 'rl-col' }, MQ.ui.prompt('Is the end nearer <b>' + whole + '</b> or <b>' + (whole + 1) + '</b>?'), ch)));
    api.say('The end is between ' + whole + ' and ' + (whole + 1) + '. Look at the halfway mark. Which number is it nearer?', 'think');
  }

  /* ------------------------------------------------------------------ *
   * Practice deck
   * ------------------------------------------------------------------ */
  function levelOf(i, count) {
    return i < count / 3 ? 1 : i < (2 * count) / 3 ? 2 : 3;
  }

  function answerOf(tenths) {
    return Math.floor(tenths / 10) + (tenths % 10 >= 6 ? 1 : 0);
  }

  function buildDeck(count) {
    var usage = {};
    var last = null;
    var usedStarts = {};

    function pickObj(lenCm) {
      var cands = Object.keys(OBJECTS).filter(function (k) {
        return OBJECTS[k].min <= lenCm && lenCm <= OBJECTS[k].max && k !== last;
      });
      var low = Math.min.apply(
        null,
        cands.map(function (k) {
          return usage[k] || 0;
        })
      );
      var k = U.pick(
        cands.filter(function (c) {
          return (usage[c] || 0) === low;
        })
      );
      usage[k] = (usage[k] || 0) + 1;
      last = k;
      return k;
    }
    function pickStart(big) {
      for (var tries = 0; tries < 50; tries++) {
        var s = big ? U.rand(71, 80) : U.rand(3, 20);
        if (!usedStarts[s]) {
          usedStarts[s] = true;
          return s;
        }
      }
      return big ? 75 : 10;
    }

    var idx = { 1: [], 2: [], 3: [] };
    for (var i = 0; i < count; i++) idx[levelOf(i, count)].push(i);
    var deck = new Array(count);

    // Level 1: ruler from 0, already lined up, whole cm 3–12 (small, middle and long)
    var buckets = U.shuffle([U.range(3, 6), U.range(7, 9), U.range(10, 12)]);
    var used1 = {};
    idx[1].forEach(function (di, j) {
      var len;
      do {
        len = U.pick(buckets[j % 3]);
      } while (used1[len] && Object.keys(used1).length < 10);
      used1[len] = true;
      deck[di] = { level: 1, broken: false, from: 0, to: 15, s0: 0, s: 0, tenths: len * 10 };
    });

    // Level 2: broken ruler (small starts 3–20 and big starts 71–80), whole cm 2–9.
    // The last one starts a little way into the ruler piece.
    var lens2 = U.shuffle(U.range(2, 9));
    var bigs = U.shuffle([true, false, Math.random() < 0.5]);
    idx[2].forEach(function (di, j) {
      var len = lens2[j % lens2.length];
      var off = j === idx[2].length - 1 && idx[2].length > 1 ? U.rand(1, 2) : 0;
      var s = pickStart(bigs[j % bigs.length]);
      var s0 = s - off;
      deck[di] = { level: 2, broken: true, from: s0, to: s0 + Math.max(9, off + len + 1), s0: s0, s: s, tenths: len * 10 };
    });

    // Level 3: ends between marks (x.2–x.4 or x.6–x.8, never x.5): round to the nearest cm.
    // One rounds down and one rounds up; first on a 0 ruler, then on a broken ruler.
    var fracs = U.shuffle([U.pick([2, 3, 4]), U.pick([6, 7, 8])]);
    idx[3].forEach(function (di, j) {
      var t = j < 2 ? fracs[j] : U.pick([2, 3, 4, 6, 7, 8]);
      if (j % 2 === 0) {
        var w0 = U.rand(3, 11);
        deck[di] = { level: 3, broken: false, from: 0, to: 15, s0: 0, s: 0, tenths: w0 * 10 + t };
      } else {
        var w1 = U.rand(2, 8);
        var s = pickStart(Math.random() < 0.5);
        deck[di] = { level: 3, broken: true, from: s, to: s + Math.max(9, w1 + 2), s0: s, s: s, tenths: w1 * 10 + t };
      }
    });

    // No repeats: lengths are distinct within a level, level 1/2 lengths are whole cm and
    // level 3 lengths never are, so every question in a run is different.
    deck.forEach(function (q) {
      q.answer = answerOf(q.tenths);
      q.obj = pickObj(q.tenths / 10);
      q.hue = U.rand(0, 3);
    });
    return deck;
  }

  /** Pick a kind, specific hint and the mistake to log for a wrong answer. */
  function diagnose(q, num, second) {
    var name = OBJECTS[q.obj].name;
    var s = q.s;
    var ans = q.answer;
    var whole = Math.floor(q.tenths / 10);
    var t = q.tenths % 10;
    var e = s + whole; // end reading (whole cm questions)

    if (q.level === 3) {
      var rd = s + whole;
      var ru = rd + 1;
      var rr = s + ans;
      var up = t >= 6;
      var other = up ? ans - 1 : ans + 1;
      if (Math.floor(num) !== num) {
        return ['Give a whole number of cm. Is the end nearer ' + rd + ' or ' + ru + '?', 'Did not round to a whole cm'];
      }
      if (q.broken && (num === rr || num === rd || num === ru)) {
        return second
          ? ['The end is nearer ' + rr + '. The ' + name + ' starts at ' + s + ', so work out ' + rr + ' − ' + s + '.', 'Read the end number instead of end − start']
          : ['That is the number at the end. But the ' + name + ' starts at ' + s + ', not 0! Count the jumps from ' + s + '.', 'Read the end number instead of end − start'];
      }
      if (num === other) {
        return second
          ? ['The end is ' + (up ? 'past' : 'before') + ' the halfway mark, so it is nearer ' + rr + '.' + (q.broken ? ' Then count the jumps from ' + s + '.' : ''), 'Rounded to the wrong centimetre']
          : ['Look at the halfway mark between ' + rd + ' and ' + ru + '. Is the end before it or past it?', 'Rounded to the wrong centimetre'];
      }
      return second
        ? ['The end is between ' + rd + ' and ' + ru + '. Which one is it nearer?' + (q.broken ? ' Then count from ' + s + '.' : ''), 'Misread the ruler']
        : ['Find the end of the ' + name + '. Which two numbers is it between?', 'Misread the ruler'];
    }

    if (q.level === 1 || !q.broken) {
      var follow = 'Follow the dotted line at the end of the ' + name + ' down to the ruler. Which number is it on?';
      if (num === ans + 1) return [second ? follow : 'Count the gaps between the marks, not the marks. The 0 line is the start.', 'Counted the tick marks instead of the gaps'];
      if (num === ans - 1) return [second ? follow : 'So close! Look at the number right under the end of the ' + name + '.', 'Misread the ruler by 1 cm'];
      if (num === 0) return ['0 is where it starts. Now read the number at the other end.', 'Read the start number instead of the length'];
      return [second ? follow : 'The ' + name + ' starts at 0. Find the number under its other end.', 'Misread the ruler'];
    }

    // Level 2: broken ruler, whole cm
    var len = ans;
    var countOn = 'Count on from ' + s + ': ' + (s + 1) + ' is 1 jump, ' + (s + 2) + ' is 2 jumps… Or work out ' + e + ' − ' + s + '.';
    if (num === e) {
      return [second ? countOn : e + ' is the number at the end. But the ' + name + ' starts at ' + s + ', not 0! Count the jumps from ' + s + '.', 'Read the end number instead of end − start'];
    }
    if (q.s0 !== s && num === e - q.s0) {
      return [second ? countOn : 'Look where the ' + name + ' starts. It starts at ' + s + ', not at ' + q.s0 + '.', 'Counted from the end of the ruler piece, not the start of the object'];
    }
    if (num === len + 1) return [second ? countOn : 'Count the jumps between the marks, not the marks themselves.', 'Counted the tick marks instead of the gaps'];
    if (num === s) return [second ? countOn : s + ' is where it starts. How many jumps to the end?', 'Read the start number instead of the length'];
    if (Math.abs(num - len) === 1) return [second ? countOn : 'Nearly! Count the jumps again, from ' + s + ' to ' + e + '.', 'Miscounted the jumps'];
    return [second ? 'It starts at ' + s + ' and ends at ' + e + '. Count the jumps, or work out ' + e + ' − ' + s + '.' : 'Find where the ' + name + ' starts and where it ends. Then count the jumps.', 'Misread a broken ruler'];
  }

  var deck = null;

  function renderPractice(stage, api) {
    if (!deck || api.index === 0 || !deck[api.index] || deck.length !== api.count) deck = buildDeck(api.count);
    var q = deck[api.index];
    var def = OBJECTS[q.obj];
    var name = def.name;
    var whole = Math.floor(q.tenths / 10);
    var t = q.tenths % 10;
    var rd = q.s + whole; // reading just before the end (level 3)
    var rr = q.s + q.answer; // nearest whole reading to the end
    var level = api.level || q.level;

    if (level === 1) api.say('The ruler starts at 0. How long is the ' + name + '?');
    else if (level === 2) api.say(api.index === deck.findIndex(function (d) { return d.level === 2; }) ? 'This ruler is broken! It does not start at 0. Count the jumps.' : 'Where does the ' + name + ' start? Where does it end?', 'think');
    else api.say(q.broken ? 'A broken ruler, and the end is between two marks. Take care!' : 'The end is between two marks. Which one is it nearer?', 'think');

    stage.appendChild(MQ.ui.prompt('How long is the <b>' + name + '</b>' + (level === 3 ? ', to the nearest cm?' : '?')));
    var sc = makeScene({ from: q.from, to: q.to, broken: q.broken, s: q.s, tenths: q.tenths, obj: q.obj, hue: q.hue });
    stage.appendChild(sc.svg);

    var work = el('div', { class: 'rl-work' });
    var ni = MQ.ui.numberInput({ unit: 'cm', label: 'Length in centimetres', onSubmit: submit });
    var col = el('div', { class: 'rl-col' }, ni.el);
    var row = el('div', { class: 'rl-row' }, col);
    stage.appendChild(row);
    stage.appendChild(work);

    // Level 3: optional magnifier
    var lens = null;
    var ring = null;
    var zoomBtn = null;
    function showLens(on) {
      if (on && !lens) {
        lens = makeLens(sc, rd);
        ring = sc.focusRing(rd);
        row.insertBefore(lens, col);
      } else if (!on && lens) {
        row.removeChild(lens);
        ring.parentNode.removeChild(ring);
        lens = null;
        ring = null;
      }
      if (zoomBtn) zoomBtn.textContent = lens ? 'Hide close-up' : '🔍 Look closer';
    }
    if (level === 3) {
      zoomBtn = el('button', { class: 'btn btn-ghost rl-zoom-btn', type: 'button', onclick: function () { showLens(!lens); } }, '🔍 Look closer');
      col.appendChild(zoomBtn);
    }
    ni.focus();

    function showWorking() {
      MQ.clear(work);
      if (level === 3) {
        work.appendChild(el('div', { class: 'sum-row rl-sum' }, chip('between ' + rd + ' and ' + (rd + 1)), op('→'), chip(t >= 6 ? 'past halfway' : 'before halfway'), op('→'), chip(q.broken ? 'nearer ' + rr : 'about ' + rr + ' cm', q.broken ? '' : 'chip-total')));
        if (q.broken) work.appendChild(subtraction(rr, q.s, q.answer));
      } else {
        work.appendChild(subtraction(q.s + q.answer, q.s, q.answer));
      }
    }
    function markEnds() {
      sc.pill(sc.x0, 'start', 'rl-pill-start');
      if (level === 3) {
        sc.half(rd);
        sc.pill(sc.X(rr), 'nearer ' + rr, 'rl-pill-end');
      } else {
        sc.pill(sc.xe, 'end', 'rl-pill-end');
      }
    }

    function submit(num) {
      if (api.isAnswered()) return;
      if (U.same(num, q.answer)) {
        ni.good();
        ni.disable();
        markEnds();
        showWorking();
        var praise;
        if (level === 1) praise = 'Yes! The ' + name + ' is ' + q.answer + ' cm long.';
        else if (level === 2) praise = 'Yes! ' + (q.s + q.answer) + ' − ' + q.s + ' = ' + q.answer + ' cm.';
        else praise = q.broken ? 'Yes! It ends nearer ' + rr + ', and ' + rr + ' − ' + q.s + ' = ' + q.answer + ' cm.' : 'Yes! It is nearer ' + rr + ', so it is about ' + q.answer + ' cm.';
        api.check(true, praise);
        return;
      }
      var d = diagnose(q, num, api.tries() >= 1);
      ni.bad();
      if (level === 3 && d[1] === 'Rounded to the wrong centimetre') showLens(true);
      api.check(false, d[0], d[1]);
      try {
        ni.input.select();
      } catch (e) {}
    }

    api.onReveal(function () {
      ni.setValue(String(q.answer));
      ni.good();
      ni.disable();
      if (level === 3) showLens(true);
      if (zoomBtn) zoomBtn.disabled = true;
      markEnds();
      MQ.clear(work);
      api.feedback(
        level === 3
          ? 'The end is ' + (t >= 6 ? 'past' : 'before') + ' the halfway mark, so it is nearer ' + rr + '. ' + (q.broken ? 'Count the jumps from ' + q.s + ' to ' + rr + ': ' + q.answer + ' cm.' : 'About ' + q.answer + ' cm.')
          : 'Count the jumps from ' + q.s + ' to ' + (q.s + q.answer) + ': ' + q.answer + ' jumps, so ' + q.answer + ' cm.',
        'info'
      );
      animateHops(api, sc, q.s, q.answer, showWorking);
    });
  }

  MQ.register('ruler-lab', {
    learn: [learnZero, learnBroken, learnNearest],
    practice: {
      count: 8,
      render: renderPractice,
    },
  });

  var css = [
    '.rl-svg{display:block;width:720px;max-width:100%;height:auto;user-select:none;-webkit-user-select:none}',
    '.rl-lens-svg{display:block;width:196px;max-width:42vw;height:auto;flex:none}',
    '.rl-row{display:flex;align-items:center;justify-content:center;gap:22px;flex-wrap:wrap;width:100%}',
    '.rl-col{display:flex;flex-direction:column;align-items:center;gap:12px}',
    '.rl-col .choices{max-width:360px}',
    '.rl-col .prompt{font-size:1.25rem}',
    '.rl-work{display:flex;flex-direction:column;align-items:center;gap:8px}',
    '.rl-work .sum-row{font-size:1.15rem}',
    '.rl-count{font-size:1.4rem;font-weight:800;min-width:110px}',
    '.rl-zoom-btn{min-height:44px;font-size:1rem;padding:8px 16px}',
    '.rl-guide{stroke:#3b6fd8;stroke-width:1.6;stroke-dasharray:4 3}',
    '.rl-torn{fill:none;stroke:#d4a72c;stroke-width:2;stroke-linejoin:round}',
    '.rl-pill rect{fill:#eef3ff;stroke:#9fb3d9;stroke-width:1.5}',
    '.rl-pill text{font-size:15px;font-weight:800;fill:#1b2a4a}',
    '.rl-pill line{stroke:#9fb3d9;stroke-width:2}',
    '.rl-pill-start rect{fill:#e2f7ee;stroke:#1f9d6b}',
    '.rl-pill-start text{fill:#14724d}',
    '.rl-pill-start line{stroke:#1f9d6b}',
    '.rl-pill-end rect{fill:#fff1e6;stroke:#e8590c}',
    '.rl-pill-end text{fill:#b33f00}',
    '.rl-pill-end line{stroke:#e8590c}',
    '.rl-ring{fill:none;stroke:#e8590c;stroke-width:3}',
    '.rl-zero{stroke:#1f9d6b;stroke-width:4;stroke-linecap:round}',
    '.rl-zero-txt{font-size:14px;font-weight:800;fill:#1f9d6b}',
    '.rl-drag .ruler-body{filter:drop-shadow(0 2px 3px rgba(27,42,74,.25))}',
    '.rl-hop{fill:none;stroke:#e8590c;stroke-width:3;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:0;animation:rl-draw .28s ease-out both}',
    '.rl-hop-dot{fill:#fff4e6;stroke:#e8590c;stroke-width:2;animation:rl-fade .28s ease-out both}',
    '.rl-hop-num{font-size:13px;font-weight:800;fill:#b33f00;animation:rl-fade .28s ease-out both}',
    '@keyframes rl-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}',
    '@keyframes rl-fade{from{opacity:0}to{opacity:1}}',
    '.rl-half-main{stroke:#7048e8;stroke-width:3;stroke-linecap:round}',
    '.rl-half{stroke:#7048e8;stroke-width:1.3;stroke-linecap:round}',
    '.rl-half-txt{font-size:6px;font-weight:800;fill:#7048e8}',
    '.rl-focus{fill:none;stroke:#4a5a7d;stroke-width:2;stroke-dasharray:5 4}',
    '.rl-lens-rim{fill:none;stroke:#4a5a7d;stroke-width:7}',
    '.rl-lens-handle{stroke:#4a5a7d;stroke-width:13;stroke-linecap:round}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'ruler-lab' }, css));
})();

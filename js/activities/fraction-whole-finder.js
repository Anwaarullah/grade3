/* Find the Whole — work backwards from one equal part to the whole (Unit 12.1).
 * Building the whole is shown as repeated addition: copies of a tray of objects, or
 * equal jumps along a strip drawn to scale on a centimetre ruler.
 * All drawings are original. Every strip is drawn at PX pixels per cm, so what the
 * child sees and counts is the true answer.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  var W = 800; // scene width (viewBox units)

  function n2(v) {
    return Math.round(v * 100) / 100;
  }

  var WORDS = {
    '1/2': 'one half', '1/3': 'one third', '2/3': 'two thirds', '1/4': 'one quarter', '2/4': 'two quarters', '3/4': 'three quarters',
    '1/5': 'one fifth', '2/5': 'two fifths', '3/5': 'three fifths', '4/5': 'four fifths', '1/10': 'one tenth',
  };
  var PARTS = { 2: 'halves', 3: 'thirds', 4: 'quarters', 5: 'fifths', 10: 'tenths' };
  function words(n, d) {
    return WORDS[n + '/' + d] || n + ' out of ' + d;
  }
  /** Stacked fraction for HTML. */
  function fr(n, d) {
    return '<span class="fwf-frac"><span class="fwf-fn">' + n + '</span><span class="fwf-fd">' + d + '</span></span>';
  }
  /** Stacked fraction for SVG, centred on x; y = the fraction bar. */
  function svgFrac(x, y, n, d, size, cls) {
    size = size || 16;
    var w = size * 0.75 * Math.max(String(n).length, String(d).length) + 4;
    return S(
      'g',
      { class: 'fwf-sfrac ' + (cls || '') },
      S('text', { x: n2(x), y: n2(y - 3), 'text-anchor': 'middle', 'font-size': size }, String(n)),
      S('line', { x1: n2(x - w / 2), y1: y, x2: n2(x + w / 2), y2: y }),
      S('text', { x: n2(x), y: n2(y + size * 0.85 + 1), 'text-anchor': 'middle', 'font-size': size }, String(d))
    );
  }

  /* ------------------------------------------------------------------ *
   * Everyday objects (each drawn centred on 0,0)
   * ------------------------------------------------------------------ */
  var CAR_COLORS = ['#e63946', '#3a86ff', '#2a9d55', '#f4a261', '#8e5bd6'];
  var MARBLE_COLORS = ['#3a86ff', '#e63946', '#2a9d55', '#f4a261', '#8e5bd6', '#0fa3b1'];
  var BUTTON_COLORS = ['#f4a261', '#3a86ff', '#e76f51', '#2a9d8f'];

  var OBJ = {
    car: { one: 'toy car', many: 'toy cars', short: 'cars', cw: 44, ch: 32 },
    marble: { one: 'marble', many: 'marbles', short: 'marbles', cw: 26, ch: 26 },
    apple: { one: 'apple', many: 'apples', short: 'apples', cw: 28, ch: 30 },
    grape: { one: 'grape', many: 'grapes', short: 'grapes', cw: 24, ch: 24 },
    button: { one: 'button', many: 'buttons', short: 'buttons', cw: 26, ch: 26 },
  };

  function drawObj(type, x, y, i, scale) {
    var g = S('g', { transform: 'translate(' + n2(x) + ',' + n2(y) + ')' + (scale && scale !== 1 ? ' scale(' + n2(scale) + ')' : ''), class: 'fwf-obj' });
    if (type === 'car') {
      var c = CAR_COLORS[i % CAR_COLORS.length];
      g.appendChild(S('rect', { x: -9, y: -12, width: 18, height: 9, rx: 3, fill: c }));
      g.appendChild(S('rect', { x: -7, y: -10, width: 14, height: 5, rx: 1.5, fill: '#dff1ff' }));
      g.appendChild(S('rect', { x: -18, y: -5, width: 36, height: 11, rx: 4, fill: c }));
      g.appendChild(S('circle', { cx: -9, cy: 6, r: 5, fill: '#2b2d42' }));
      g.appendChild(S('circle', { cx: 9, cy: 6, r: 5, fill: '#2b2d42' }));
      g.appendChild(S('circle', { cx: -9, cy: 6, r: 2, fill: '#c9ced6' }));
      g.appendChild(S('circle', { cx: 9, cy: 6, r: 2, fill: '#c9ced6' }));
    } else if (type === 'marble') {
      var mc = MARBLE_COLORS[i % MARBLE_COLORS.length];
      g.appendChild(S('circle', { r: 10, fill: mc, stroke: 'rgba(0,0,0,.25)', 'stroke-width': 1.2 }));
      g.appendChild(S('circle', { cx: -3.5, cy: -4, r: 2.6, fill: '#fff', opacity: 0.8 }));
    } else if (type === 'apple') {
      g.appendChild(S('path', { d: 'M0,-6 C-4,-11 -12,-8 -11,1 C-10,9 -4,12 0,10 C4,12 10,9 11,1 C12,-8 4,-11 0,-6 Z', fill: '#d62828' }));
      g.appendChild(S('line', { x1: 0, y1: -6, x2: 1.5, y2: -12, stroke: '#6b4226', 'stroke-width': 2, 'stroke-linecap': 'round' }));
      g.appendChild(S('ellipse', { cx: 5, cy: -11, rx: 4, ry: 2, fill: '#2a9d55', transform: 'rotate(-25 5 -11)' }));
      g.appendChild(S('ellipse', { cx: -5, cy: -2, rx: 2, ry: 3, fill: '#fff', opacity: 0.45 }));
    } else if (type === 'grape') {
      g.appendChild(S('circle', { r: 9, fill: i % 2 ? '#7b3fa0' : '#8e4cb3', stroke: '#5a2a78', 'stroke-width': 1 }));
      g.appendChild(S('circle', { cx: -3, cy: -3, r: 2.4, fill: '#fff', opacity: 0.55 }));
    } else {
      var bc = BUTTON_COLORS[i % BUTTON_COLORS.length];
      g.appendChild(S('circle', { r: 10, fill: bc, stroke: 'rgba(0,0,0,.3)', 'stroke-width': 1.2 }));
      g.appendChild(S('circle', { r: 7, fill: 'none', stroke: 'rgba(0,0,0,.18)', 'stroke-width': 1 }));
      [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4]].forEach(function (h) {
        g.appendChild(S('circle', { cx: h[0], cy: h[1], r: 1.3, fill: 'rgba(0,0,0,.45)' }));
      });
    }
    return g;
  }

  /** cols x rows layout for k objects in one tray */
  function trayGrid(type, k) {
    var cols;
    if (type === 'car') cols = k <= 3 ? k : Math.ceil(k / 2);
    else cols = k <= 5 ? k : Math.ceil(k / 2);
    cols = Math.max(cols, 1);
    return { cols: cols, rows: Math.ceil(k / cols) };
  }

  /* ------------------------------------------------------------------ *
   * Tray scene: equal trays; copy a full tray into an empty one by dragging
   * (or clicking the empty tray); optionally share a pile into some trays first.
   * cfg: obj, k (objects per tray), trays: [{kind:'full'|'empty'|'known'|'eaten', n, num, den}],
   *      pile (objects to share into 'known' trays), pileText, onChange(sc)
   * ------------------------------------------------------------------ */
  function trayScene(api, cfg) {
    var base = OBJ[cfg.obj];
    var gr = trayGrid(cfg.obj, cfg.k);
    var nT = cfg.trays.length;
    var gap = nT > 3 ? 22 : 34;
    var OS = 1.45;
    var o, tw, th, rowW;
    for (;;) {
      o = { many: base.many, cw: base.cw * OS, ch: base.ch * OS };
      tw = Math.max(gr.cols * o.cw + 22, 110);
      th = gr.rows * o.ch + 20;
      rowW = nT * tw + (nT - 1) * gap;
      if (rowW <= 780 || OS <= 1) break;
      OS -= 0.05;
    }
    var tx0 = (W - rowW) / 2;
    var pileH = 0;
    var pg = null;
    if (cfg.pile) {
      var pc = Math.min(cfg.pile, 10);
      var pr = Math.ceil(cfg.pile / pc);
      pg = { cols: pc, rows: pr, w: pc * o.cw + 24, h: pr * o.ch + 18 };
      pileH = pg.h + 44;
    }
    var ty = 12 + pileH;
    var H = ty + th + 52;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'fwf-svg fwf-trays-svg', role: 'img', 'aria-label': 'Trays of ' + o.many });
    var main = S('g');
    var ghostG = S('g', { class: 'fwf-ghost' });
    root.appendChild(main);
    root.appendChild(ghostG);

    var sc = {
      svg: root,
      counts: cfg.trays.map(function (t) {
        return t.n || 0;
      }),
      pile: cfg.pile || 0,
      boxes: [],
      dealing: false,
    };
    for (var i = 0; i < nT; i++) sc.boxes.push({ x: tx0 + i * (tw + gap), y: ty, w: tw, h: th });

    function isTarget(i) {
      var kd = cfg.trays[i].kind;
      return (kd === 'empty' || kd === 'eaten') && sc.counts[i] === 0;
    }
    function hasFull() {
      for (var i = 0; i < nT; i++) if (sc.counts[i] === cfg.k) return true;
      return false;
    }
    sc.isTarget = isTarget;
    sc.done = function () {
      for (var i = 0; i < nT; i++) if (sc.counts[i] !== cfg.k) return false;
      return true;
    };
    sc.filled = function () {
      return sc.counts.filter(function (c) {
        return c === cfg.k;
      });
    };

    function drawTrayObjects(g, b, count, seed) {
      var cw = o.cw;
      var ch = o.ch;
      var ox = b.x + (b.w - gr.cols * cw) / 2 + cw / 2;
      var oy = b.y + 10 + ch / 2;
      for (var j = 0; j < count; j++) {
        var c = j % gr.cols;
        var r = Math.floor(j / gr.cols);
        g.appendChild(drawObj(cfg.obj, ox + c * cw, oy + r * ch, j + seed, OS));
      }
    }

    sc.render = function () {
      MQ.clear(main);
      if (pg) {
        var px = (W - pg.w) / 2;
        var pyy = 32;
        main.appendChild(S('text', { x: W / 2, y: 22, class: 'fwf-pile-label', 'text-anchor': 'middle' }, cfg.pileText || ''));
        main.appendChild(S('rect', { x: px, y: pyy, width: pg.w, height: pg.h, rx: 14, class: 'fwf-pile', 'data-count': sc.pile }));
        for (var p = 0; p < sc.pile; p++) {
          var c = p % pg.cols;
          var r = Math.floor(p / pg.cols);
          main.appendChild(drawObj(cfg.obj, px + 12 + o.cw / 2 + c * o.cw, pyy + 9 + o.ch / 2 + r * o.ch, p, OS));
        }
      }
      for (var i = 0; i < nT; i++) {
        var t = cfg.trays[i];
        var b = sc.boxes[i];
        var kind = t.kind;
        var full = sc.counts[i] === cfg.k;
        var cls = 'fwf-tray fwf-tray-' + kind + (full ? ' fwf-tray-full' : '') + (isTarget(i) ? ' fwf-tray-target' : '');
        var g = S('g', { class: cls, 'data-idx': i, 'data-kind': kind, 'data-count': sc.counts[i] });
        g.appendChild(S('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 14, class: 'fwf-tray-box' }));
        if (kind === 'eaten' && sc.counts[i] === 0) g.appendChild(S('text', { x: b.x + b.w / 2, y: b.y + b.h / 2 + 6, 'text-anchor': 'middle', class: 'fwf-tray-note' }, 'eaten'));
        else if (isTarget(i)) g.appendChild(S('text', { x: b.x + b.w / 2, y: b.y + b.h / 2 + 10, 'text-anchor': 'middle', class: 'fwf-tray-q' }, '?'));
        drawTrayObjects(g, b, sc.counts[i], i * 2);
        g.appendChild(svgFrac(b.x + b.w / 2, b.y + b.h + 22, t.num, t.den, 16));
        main.appendChild(g);
      }
    };

    function trayAt(p) {
      for (var i = 0; i < nT; i++) {
        var b = sc.boxes[i];
        if (p.x >= b.x - 8 && p.x <= b.x + b.w + 8 && p.y >= b.y - 8 && p.y <= b.y + b.h + 30) return i;
      }
      return -1;
    }

    sc.fill = function (i) {
      if (!isTarget(i)) return false;
      sc.counts[i] = cfg.k;
      api.sound('pop');
      sc.render();
      if (cfg.onChange) cfg.onChange(sc);
      return true;
    };

    function warnPile() {
      api.feedback('Share the ' + o.many + ' into the trays first. Press "Share them out".', 'info');
    }

    var drag = null;
    var unbind = MQ.ui.drag(root, root, {
      start: function (p) {
        drag = null;
        if (sc.dealing || cfg.locked) return;
        var i = trayAt(p);
        if (i < 0) return;
        if (sc.counts[i] === cfg.k) {
          var b = sc.boxes[i];
          var gh = S('g', { class: 'fwf-ghost-tray' });
          gh.appendChild(S('rect', { x: b.x, y: b.y, width: b.w, height: b.h, rx: 14, class: 'fwf-tray-box' }));
          drawTrayObjects(gh, b, cfg.k, i * 2);
          ghostG.appendChild(gh);
          drag = { from: i, ghost: gh, moved: false };
        } else if (isTarget(i)) {
          drag = { click: i };
        }
      },
      move: function (p, dx, dy) {
        if (!drag || !drag.ghost) return;
        if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true;
        drag.ghost.setAttribute('transform', 'translate(' + n2(dx) + ',' + n2(dy) + ')');
      },
      end: function (p) {
        if (!drag) return;
        var d = drag;
        drag = null;
        MQ.clear(ghostG);
        var i = trayAt(p);
        if (d.ghost) {
          if (i >= 0 && i !== d.from && isTarget(i)) sc.fill(i);
          else if (d.moved) api.feedback('Drop the copy on an empty tray.', 'info');
          return;
        }
        if (d.click === i) {
          if (sc.pile > 0) return warnPile();
          if (!hasFull()) return;
          sc.fill(i);
        }
      },
    });
    api.cleanup(unbind);

    /** Deal the pile into the 'known' trays, one round at a time. */
    sc.deal = function (done, fast) {
      if (sc.dealing || sc.pile <= 0) return;
      sc.dealing = true;
      var known = [];
      cfg.trays.forEach(function (t, i) {
        if (t.kind === 'known') known.push(i);
      });
      function round() {
        if (sc.finished) return;
        known.forEach(function (i) {
          if (sc.pile > 0) {
            sc.pile--;
            sc.counts[i]++;
          }
        });
        sc.render();
        if (sc.pile > 0) {
          if (fast) round();
          else {
            api.sound('click');
            api.later(round, 260);
          }
        } else {
          sc.dealing = false;
          if (cfg.onChange) cfg.onChange(sc);
          if (done) done();
        }
      }
      round();
    };
    /** Show everything finished (used by Show me). */
    sc.finish = function () {
      sc.finished = true;
      sc.pile = 0;
      sc.dealing = false;
      for (var i = 0; i < nT; i++) sc.counts[i] = cfg.k;
      cfg.locked = true;
      sc.render();
    };
    sc.render();
    return sc;
  }

  /* ------------------------------------------------------------------ *
   * Strip scene: a paper strip (or ribbon) drawn to scale, optionally on a ruler.
   * cfg: L (cm), color 'paper'|'ribbon', ruler (bool), step (snap cm for clicks), hits (bool),
   *      marks [cm], onHit(cm)
   * ------------------------------------------------------------------ */
  function stripScene(api, cfg) {
    var L = cfg.L;
    var PX = Math.min(40, 720 / L);
    var x0 = (W - L * PX) / 2;
    var SY = 84;
    var SH = 44;
    var RY = SY + SH + 2;
    var RH = cfg.ruler ? 46 : 0;
    var H = RY + RH + (cfg.bottom == null ? 34 : cfg.bottom);
    function X(cm) {
      return x0 + cm * PX;
    }
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'fwf-svg fwf-strip-svg', role: 'img', 'aria-label': 'A strip ' + L + ' cm long', 'data-l': L });
    var under = S('g');
    var stripG = S('g');
    var piecesG = S('g', { class: 'fwf-pieces' });
    var marksG = S('g', { class: 'fwf-marks' });
    var jumpG = S('g', { class: 'fwf-jumps' });
    var topG = S('g');
    var hitG = S('g', { class: 'fwf-hits' });
    root.appendChild(under);
    stripG.appendChild(S('rect', { x: n2(X(0)), y: SY, width: n2(L * PX), height: SH, class: 'fwf-strip fwf-strip-' + (cfg.color || 'paper') }));
    root.appendChild(stripG);
    root.appendChild(piecesG);
    root.appendChild(marksG);

    if (cfg.ruler) {
      var rg = S('g', { class: 'fwf-ruler' });
      rg.appendChild(S('rect', { x: n2(X(0) - 12), y: RY, width: n2(L * PX + 44), height: RH, rx: 6, class: 'ruler-body' }));
      var lab = PX >= 20 ? 1 : PX >= 9 ? 5 : 10;
      for (var c = 0; c <= L; c++) {
        var big = c % 5 === 0;
        var len = c % 10 === 0 ? 20 : big ? 16 : 9;
        if (PX < 9 && !big && PX < 5) continue;
        rg.appendChild(S('line', { x1: n2(X(c)), y1: RY, x2: n2(X(c)), y2: RY + len, class: 'ruler-tick' + (big ? '' : ' ruler-tick-half') }));
        if (c % lab === 0) rg.appendChild(S('text', { x: n2(X(c)), y: RY + 38, 'text-anchor': 'middle', class: 'ruler-num' }, String(c)));
      }
      rg.appendChild(S('text', { x: n2(X(L) + 28), y: RY + 38, 'text-anchor': 'end', class: 'ruler-cm' }, 'cm'));
      root.appendChild(rg);
    }
    root.appendChild(jumpG);
    root.appendChild(topG);
    root.appendChild(hitG);

    var sc = { svg: root, X: X, PX: PX, L: L, SY: SY, SH: SH, RY: RY, H: H, jumps: 0 };

    sc.mark = function (cm, cls) {
      var m = S('line', { x1: n2(X(cm)), y1: SY - 4, x2: n2(X(cm)), y2: SY + SH + 4, class: 'fwf-mark ' + (cls || ''), 'data-cm': cm });
      marksG.appendChild(m);
      return m;
    };
    sc.clearMarks = function () {
      MQ.clear(marksG);
    };
    sc.piece = function (a, b, cls, text) {
      var g = S('g', { class: 'fwf-piece ' + (cls || '') });
      g.appendChild(S('rect', { x: n2(X(a)), y: SY, width: n2((b - a) * PX), height: SH, class: 'fwf-piece-fill' }));
      if (text) g.appendChild(S('text', { x: n2((X(a) + X(b)) / 2), y: SY + SH / 2 + 6, 'text-anchor': 'middle', class: 'fwf-piece-text' }, text));
      piecesG.appendChild(g);
      return g;
    };
    sc.clearPieces = function () {
      MQ.clear(piecesG);
    };
    /** a jump arc above the strip from a to b, labelled with text */
    sc.jump = function (a, b, text, cls) {
      var x1 = X(a);
      var x2 = X(b);
      var mid = (x1 + x2) / 2;
      var hgt = Math.min(44, (x2 - x1) * 0.45 + 10);
      var y = SY - 2;
      var g = S('g', { class: 'fwf-jump ' + (cls || '') });
      g.appendChild(S('path', { d: 'M' + n2(x1) + ',' + y + ' Q' + n2(mid) + ',' + n2(y - hgt * 1.6) + ' ' + n2(x2) + ',' + y, class: 'fwf-arc' }));
      g.appendChild(S('polygon', { points: n2(x2) + ',' + y + ' ' + n2(x2 - 7) + ',' + (y - 9) + ' ' + n2(x2 + 3) + ',' + (y - 10), class: 'fwf-arrow' }));
      if (text != null) {
        var tw = String(text).length * 9 + 14;
        var ly = y - hgt * 0.8 - 26;
        g.appendChild(S('rect', { x: n2(mid - tw / 2), y: n2(ly), width: tw, height: 22, rx: 11, class: 'fwf-jump-pill' }));
        g.appendChild(S('text', { x: n2(mid), y: n2(ly + 16), 'text-anchor': 'middle', class: 'fwf-jump-text' }, String(text)));
      }
      jumpG.appendChild(g);
      sc.jumps++;
      return g;
    };
    sc.clearJumps = function () {
      MQ.clear(jumpG);
      sc.jumps = 0;
    };
    /** text label under the strip/ruler at cm */
    sc.below = function (cm, text, cls) {
      var y = RY + RH + 22;
      var t = S('text', { x: n2(U.clamp(X(cm), 30, W - 30)), y: y, 'text-anchor': 'middle', class: 'fwf-below ' + (cls || '') }, text);
      topG.appendChild(t);
      return t;
    };
    sc.top = topG;
    sc.clearTop = function () {
      MQ.clear(topG);
    };

    if (cfg.hits) {
      var step = cfg.step || 1;
      for (var h = step; h < L; h += step) {
        (function (cm) {
          var r = S('rect', { x: n2(X(cm - step / 2)), y: SY - 10, width: n2(step * PX), height: SH + RH + 16, class: 'fwf-hit', 'data-cm': cm });
          r.addEventListener('click', function () {
            if (cfg.onHit) cfg.onHit(cm);
          });
          r.addEventListener('mouseenter', function () {
            sc.hover(cm);
          });
          r.addEventListener('mouseleave', function () {
            sc.hover(null);
          });
          hitG.appendChild(r);
        })(h);
      }
      var hov = S('line', { class: 'fwf-hover', y1: SY - 6, y2: SY + SH + 6, x1: -10, x2: -10 });
      marksG.appendChild(hov);
      sc.hover = function (cm) {
        if (cm == null) {
          hov.setAttribute('x1', -10);
          hov.setAttribute('x2', -10);
          return;
        }
        hov.setAttribute('x1', n2(X(cm)));
        hov.setAttribute('x2', n2(X(cm)));
      };
      sc.disableHits = function () {
        hitG.style.display = 'none';
        sc.hover(null);
      };
    }
    return sc;
  }

  function lesson(titleHtml, bodyHtml) {
    return el('div', { class: 'lesson' }, el('h2', { class: 'lesson-title', html: titleHtml }), el('p', { class: 'lesson-text', html: bodyHtml }));
  }
  function sumRow(parts, total, unit) {
    return MQ.ui.sum(parts, total, unit);
  }
  function rep(v, n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(v);
    return a;
  }
  function sumBox() {
    return el('div', { class: 'fwf-sumbox' });
  }
  function setSum(box, parts, total, unit) {
    MQ.clear(box);
    if (parts.length) box.appendChild(sumRow(parts, total, unit));
  }
  function divRow(a, b, c) {
    return el('div', { class: 'sum-row fwf-div' }, el('span', { class: 'chip' }, String(a)), el('span', { class: 'sum-op' }, '÷'), el('span', { class: 'chip' }, String(b)), el('span', { class: 'sum-op' }, '='), el('span', { class: 'chip chip-total' }, String(c)));
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  var deck = null;

  function stripPick(dChoices, unitOnly, avoid) {
    for (var tries = 0; tries < 200; tries++) {
      var d = U.pick(dChoices);
      var Ls = U.range(6, 30).filter(function (L) {
        return L % d === 0 && L / d >= 2;
      });
      var L = U.pick(Ls);
      var n = unitOnly ? 1 : U.rand(2, d - 1);
      var key = L + ':' + d + ':' + n;
      if (avoid && avoid.indexOf(key) !== -1) continue;
      return { type: 'fold', L: L, d: d, n: n, ans: (L / d) * n, part: L / d, color: 'paper', key: key };
    }
  }

  function buildDeck() {
    var q = [];
    // Level 1: one tray is 1/2 or 1/3 of the set; copy the tray to build the whole.
    var objs = U.shuffle(['car', 'marble', 'apple', 'button', 'grape']);
    var ds = [2, 3, U.pick([2, 3])];
    var used = [];
    ds.forEach(function (d, i) {
      var k;
      do {
        k = U.rand(2, 5);
      } while (used.indexOf(k + ':' + d) !== -1);
      used.push(k + ':' + d);
      q.push({ type: 'copy', obj: objs[i], k: k, d: d, ans: k * d });
    });
    // Level 2: where does the fold go on a strip drawn on a ruler?
    var f1 = stripPick([2, 3, 4, 5], true);
    var f2 = stripPick([3, 4, 5], false, [f1.key]);
    q.push(f1, f2);
    var mn = U.rand(1, 3);
    q.push({ type: 'fold', L: 100, d: 4, n: mn, ans: 25 * mn, part: 25, color: 'ribbon', metre: true, step: 5 });
    // Level 3: work back from a non-unit part or from what is left; then a strip whole.
    if (Math.random() < 0.5) {
      var bagD = U.pick([4, 3]);
      var bk = bagD === 4 ? U.rand(5, 9) : U.rand(5, 10);
      var bn = bagD - 1;
      q.push({ type: 'bag', obj: 'marble', n: bn, d: bagD, k: bk, P: bn * bk, ans: bagD * bk });
    } else {
      var ld = U.pick([3, 4]);
      var lk = ld === 3 ? U.rand(5, 10) : U.rand(4, 8);
      q.push({ type: 'left', obj: 'grape', d: ld, k: lk, left: (ld - 1) * lk, ans: ld * lk });
    }
    if (Math.random() < 0.5) {
      var s = U.rand(2, 5);
      q.push({ type: 'tenths', s: s, L: 10 * s, ans: 10 * s });
    } else {
      var od = U.pick([3, 4, 5]);
      var op = U.rand(3, 9);
      q.push({ type: 'onepart', d: od, p: op, L: od * op, ans: od * op });
    }
    return q;
  }

  /* ------------------------------------------------------------------ *
   * Practice question renderers
   * ------------------------------------------------------------------ */
  function qWrap(stage, q) {
    var w = el('div', { class: 'fwf-q', 'data-type': q.type, 'data-answer': q.ans });
    stage.appendChild(w);
    return w;
  }

  function answerBox(unit, onSubmit) {
    return MQ.ui.numberInput({ unit: unit, onSubmit: onSubmit, label: 'The whole' });
  }

  // Level 1: copy the tray
  function renderCopy(stage, api, q) {
    var o = OBJ[q.obj];
    var w = qWrap(stage, q);
    api.say('One tray is ' + words(1, q.d) + '. Drag copies to build the whole!', 'think');
    w.appendChild(MQ.ui.prompt(q.k + ' ' + o.many + ' are ' + fr(1, q.d) + ' of the set. How many ' + o.many + ' in the <b>whole</b> set?'));
    var trays = [];
    for (var i = 0; i < q.d; i++) trays.push({ kind: i === 0 ? 'full' : 'empty', n: i === 0 ? q.k : 0, num: 1, den: q.d });
    var box = sumBox();
    var sc = trayScene(api, {
      obj: q.obj,
      k: q.k,
      trays: trays,
      onChange: function (s) {
        setSum(box, s.filled(), null);
        if (s.done()) api.feedback(q.d + ' ' + PARTS[q.d] + ' make the whole. Add them up!', 'info');
      },
    });
    w.appendChild(sc.svg);
    setSum(box, sc.filled(), null);
    w.appendChild(box);
    var inp = answerBox(o.short, function (v) {
      if (U.same(v, q.ans)) {
        inp.good();
        inp.disable();
        sc.finish();
        setSum(box, rep(q.k, q.d), q.ans, o.short);
        api.check(true, rep(q.k, q.d).join(' + ') + ' = ' + q.ans + '. That is the whole!');
        return;
      }
      inp.bad();
      var hint, tag;
      if (v === q.k) {
        tag = 'Gave the part as the whole';
        hint = q.k + ' is just one tray: ' + words(1, q.d) + '. The whole needs ' + q.d + ' trays like it.';
      } else if (v === q.k + q.d) {
        tag = 'Added instead of copying the part';
        hint = 'Do not add the ' + q.d + '. Add ' + q.k + ' again for each tray.';
      } else {
        tag = 'Did not add equal parts';
        hint = 'Fill every tray with ' + q.k + ', then add the trays up.';
      }
      if (api.tries() >= 1) hint = q.d + ' trays of ' + q.k + ': count on ' + U.range(1, q.d).map(function (j) { return j * q.k; }).join(', ') + '.';
      api.check(false, hint, tag);
    });
    w.appendChild(inp.el);
    inp.focus();
    api.onReveal(function () {
      sc.finish();
      setSum(box, rep(q.k, q.d), q.ans, o.short);
      inp.setValue(q.ans);
      inp.good();
      inp.disable();
      api.feedback(q.d + ' ' + PARTS[q.d] + ' make the whole: ' + rep(q.k, q.d).join(' + ') + ' = ' + q.ans + ' ' + o.short + '.', 'info');
    });
  }

  // Level 2: click where a fold goes
  function renderFold(stage, api, q) {
    var w = qWrap(stage, q);
    var what = q.metre ? 'ribbon' : 'strip';
    if (q.metre) {
      api.say('A metre is 100 centimetres. Fold the ribbon into quarters in your head.', 'think');
      w.appendChild(MQ.ui.prompt('This ribbon is <b>1 metre</b> long (100 cm). Click where ' + fr(q.n, q.d) + ' of the ribbon is.'));
    } else {
      api.say('Fold the strip into ' + q.d + ' equal parts. Where is ' + words(q.n, q.d) + '?', 'think');
      w.appendChild(MQ.ui.prompt('This strip is <b>' + q.L + ' cm</b> long. Fold it into ' + q.d + ' equal parts. Click where ' + fr(q.n, q.d) + ' goes.'));
    }
    var picked = null;
    var markEl = null;
    var labelEl = null;
    var sc = stripScene(api, {
      L: q.L,
      ruler: true,
      hits: true,
      step: q.step || 1,
      color: q.color,
      onHit: function (cm) {
        picked = cm;
        if (markEl) markEl.parentNode.removeChild(markEl);
        if (labelEl) labelEl.parentNode.removeChild(labelEl);
        markEl = sc.mark(cm, 'fwf-mark-pick');
        labelEl = sc.below(cm, cm + ' cm', 'fwf-below-pick');
        api.sound('click');
        checkBtn.disabled = false;
        w.setAttribute('data-picked', cm);
      },
    });
    w.appendChild(sc.svg);
    var box = sumBox();
    w.appendChild(box);
    var checkBtn = el('button', { class: 'btn btn-check fwf-check', type: 'button', disabled: true }, 'Check');
    w.appendChild(el('div', { class: 'fwf-row' }, checkBtn));

    function showWorking() {
      sc.clearJumps();
      sc.clearPieces();
      for (var i = 0; i < q.d; i++) {
        var a = i * q.part;
        sc.piece(a, a + q.part, i < q.n ? 'fwf-piece-on' : 'fwf-piece-off');
        if (i > 0) sc.mark(a, 'fwf-mark-fold');
        sc.jump(a, a + q.part, String(a + q.part), i < q.n ? 'fwf-jump-on' : 'fwf-jump-off');
      }
      setSum(box, rep(q.part, q.d), q.L, 'cm');
    }

    checkBtn.addEventListener('click', function () {
      if (picked == null || api.isAnswered()) return;
      if (picked === q.ans) {
        checkBtn.disabled = true;
        sc.disableHits();
        showWorking();
        if (markEl) markEl.setAttribute('class', 'fwf-mark fwf-mark-good');
        api.check(true, words(q.n, q.d).replace(/^./, function (c) { return c.toUpperCase(); }) + ' is at ' + q.ans + ' cm. ' + rep(q.part, q.n).join(' + ') + ' = ' + q.ans + '!');
        return;
      }
      var hint, tag;
      var pieceTxt = q.d + ' equal pieces must add up to ' + q.L + ' cm.';
      if (q.n > 1 && picked === q.part) {
        tag = 'Found one part only';
        hint = picked + ' cm is ' + words(1, q.d) + '. You need ' + q.n + ' of those pieces.';
      } else {
        tag = 'Wrong fold position';
        hint = pieceTxt + (q.metre ? ' Think of 100 cm.' : '') + ' Which number, added ' + q.d + ' times, makes ' + q.L + '?';
      }
      if (api.tries() >= 1) hint = 'Each piece is ' + q.part + ' cm: ' + U.range(1, q.d).map(function (j) { return j * q.part; }).join(', ') + '. ' + words(q.n, q.d).replace(/^./, function (c) { return c.toUpperCase(); }) + ' is ' + q.n + (q.n === 1 ? ' jump.' : ' jumps.');
      api.check(false, hint, tag);
    });
    api.onReveal(function () {
      checkBtn.disabled = true;
      sc.disableHits();
      if (markEl) markEl.parentNode.removeChild(markEl);
      if (labelEl) labelEl.parentNode.removeChild(labelEl);
      showWorking();
      sc.mark(q.ans, 'fwf-mark-good');
      sc.below(q.ans, q.ans + ' cm', 'fwf-below-good');
      api.feedback(q.d + ' equal pieces of ' + q.part + ' cm. ' + words(q.n, q.d).replace(/^./, function (c) { return c.toUpperCase(); }) + ' = ' + rep(q.part, q.n).join(' + ') + ' = ' + q.ans + ' cm.', 'info');
    });
  }

  // Level 3: share the known part into trays, then copy into the missing tray(s)
  function renderShare(stage, api, q) {
    var o = OBJ[q.obj];
    var w = qWrap(stage, q);
    var nKnown, total, trays = [], pileText;
    if (q.type === 'bag') {
      nKnown = q.n;
      total = q.P;
      api.say(q.P + ' marbles is ' + words(q.n, q.d) + ' of the bag. Share them into ' + q.n + ' trays first.', 'think');
      w.appendChild(MQ.ui.prompt(fr(q.n, q.d) + ' of a bag is <b>' + q.P + '</b> marbles. How many marbles fill the <b>whole</b> bag?'));
      pileText = q.P + ' marbles = ' + words(q.n, q.d) + ' of the bag';
      for (var i = 0; i < q.d; i++) trays.push({ kind: i < q.n ? 'known' : 'empty', n: 0, num: 1, den: q.d });
    } else {
      nKnown = q.d - 1;
      total = q.left;
      api.say(words(1, q.d).replace(/^./, function (c) { return c.toUpperCase(); }) + ' was eaten. The ' + q.left + ' grapes left are ' + words(q.d - 1, q.d) + '.', 'think');
      w.appendChild(MQ.ui.prompt('A bunch of grapes: ' + fr(1, q.d) + ' was eaten and <b>' + q.left + '</b> are left. How many grapes were there at the start?'));
      pileText = q.left + ' grapes left';
      for (var j = 0; j < q.d; j++) trays.push({ kind: j < q.d - 1 ? 'known' : 'eaten', n: 0, num: 1, den: q.d });
    }
    var box = sumBox();
    var divBox = el('div', { class: 'fwf-sumbox' });
    var sc = trayScene(api, {
      obj: q.obj,
      k: q.k,
      trays: trays,
      pile: total,
      pileText: pileText,
      onChange: function (s) {
        if (s.pile === 0) {
          MQ.clear(divBox);
          divBox.appendChild(divRow(total, nKnown, q.k));
          dealBtn.disabled = true;
          setSum(box, s.filled(), null);
          if (!s.done()) api.feedback('Each tray has ' + q.k + '. Now drag a copy into the empty tray.', 'info');
        }
      },
    });
    w.appendChild(sc.svg);
    var dealBtn = el('button', { class: 'btn fwf-deal', type: 'button' }, 'Share them out');
    dealBtn.addEventListener('click', function () {
      dealBtn.disabled = true;
      sc.deal();
    });
    w.appendChild(el('div', { class: 'fwf-row' }, dealBtn, divBox));
    w.appendChild(box);
    var inp = answerBox(o.short, function (v) {
      if (U.same(v, q.ans)) {
        inp.good();
        inp.disable();
        dealBtn.disabled = true;
        sc.finish();
        MQ.clear(divBox);
        divBox.appendChild(divRow(total, nKnown, q.k));
        setSum(box, rep(q.k, q.d), q.ans, o.short);
        api.check(true, rep(q.k, q.d).join(' + ') + ' = ' + q.ans + ' ' + o.short + ' in the whole!');
        return;
      }
      inp.bad();
      var hint, tag;
      if (q.type === 'bag') {
        if (v === q.P) {
          tag = 'Gave the part as the whole';
          hint = q.P + ' is only ' + words(q.n, q.d) + ' of the bag. One more tray is missing.';
        } else if (v === q.k) {
          tag = 'Found one part only';
          hint = q.k + ' is one tray, ' + words(1, q.d) + '. The whole bag is ' + q.d + ' trays.';
        } else if ((q.P % q.d === 0 && (v === q.P / q.d || v === q.P + q.P / q.d)) || v === q.P + q.d) {
          tag = q.d === 4 ? 'Shared by 4 instead of 3 for 3/4' : 'Shared by 3 instead of 2 for 2/3';
          hint = fr(q.n, q.d) + ' means ' + q.n + ' trays. Share ' + q.P + ' into ' + q.n + ' trays, then add one more tray.';
        } else {
          tag = 'Did not add equal parts';
          hint = 'Share the ' + q.P + ' marbles into ' + q.n + ' trays. Then add one more tray the same.';
        }
      } else {
        if (v === q.left) {
          tag = 'Answered with the part left';
          hint = q.left + ' is only what is left. Some grapes were eaten too!';
        } else if (v === q.left * q.d || v === q.left + q.left) {
          tag = 'Treated the part left as one part';
          hint = 'The ' + q.left + ' grapes left are ' + (q.d - 1) + ' parts, not 1. Share them into ' + (q.d - 1) + ' trays.';
        } else if (v === q.k) {
          tag = 'Found one part only';
          hint = q.k + ' is the part that was eaten. Add the grapes that are left too.';
        } else {
          tag = 'Did not add equal parts';
          hint = 'Share the ' + q.left + ' grapes into ' + (q.d - 1) + ' trays. The eaten tray had the same.';
        }
      }
      if (api.tries() >= 1) hint = total + ' shared into ' + nKnown + ' trays is ' + q.k + ' each. The whole is ' + q.d + ' trays: count on ' + U.range(1, q.d).map(function (x) { return x * q.k; }).join(', ') + '.';
      api.check(false, hint, tag);
    });
    w.appendChild(inp.el);
    api.onReveal(function () {
      dealBtn.disabled = true;
      sc.finish();
      MQ.clear(divBox);
      divBox.appendChild(divRow(total, nKnown, q.k));
      setSum(box, rep(q.k, q.d), q.ans, o.short);
      inp.setValue(q.ans);
      inp.good();
      inp.disable();
      api.feedback(total + ' shared into ' + nKnown + ' trays = ' + q.k + ' in each. ' + q.d + ' trays make the whole: ' + q.ans + ' ' + o.short + '.', 'info');
    });
  }

  // Level 3: whole strip from tenth marks or from one marked part
  function renderStripWhole(stage, api, q) {
    var w = qWrap(stage, q);
    var step, nSteps, sc;
    if (q.type === 'tenths') {
      step = q.s;
      nSteps = 10;
      api.say('The marks split the strip into tenths. Count the gaps, not the marks!', 'think');
      w.appendChild(MQ.ui.prompt('Marks split this strip into tenths. The first mark is at <b>' + q.s + ' cm</b>. How long is the whole strip?'));
      sc = stripScene(api, { L: q.L, ruler: false, bottom: 40 });
      for (var i = 1; i < 10; i++) sc.mark(i * q.s, 'fwf-mark-tenth');
      sc.piece(0, q.s, 'fwf-piece-on');
      sc.below(0, '0', 'fwf-below-soft');
      sc.below(q.s, q.s + ' cm', 'fwf-below-good');
      sc.below(q.L, '?', 'fwf-below-q');
    } else {
      step = q.p;
      nSteps = q.d;
      api.say('One piece is ' + words(1, q.d) + '. How many pieces like it make the whole strip?', 'think');
      w.appendChild(MQ.ui.prompt(fr(1, q.d) + ' of this strip is marked at <b>' + q.p + ' cm</b>. How long is the whole strip?'));
      sc = stripScene(api, { L: q.L, ruler: false, bottom: 40 });
      sc.piece(0, q.p, 'fwf-piece-on');
      sc.mark(q.p, 'fwf-mark-fold');
      var fx = sc.X(q.p / 2);
      sc.top.appendChild(svgFrac(fx, sc.SY + sc.SH / 2 + 2, 1, q.d, 15, 'fwf-sfrac-in'));
      sc.below(0, '0', 'fwf-below-soft');
      sc.below(q.p, q.p + ' cm', 'fwf-below-good');
      sc.below(q.L, '?', 'fwf-below-q');
    }
    w.appendChild(sc.svg);
    var box = sumBox();
    var made = 0;
    var jumpBtn = el('button', { class: 'btn fwf-jumpbtn', type: 'button' }, 'Jump ' + step + ' cm');
    function doJump() {
      if (made >= nSteps) return;
      sc.jump(made * step, (made + 1) * step, String((made + 1) * step));
      made++;
      api.sound('pop');
      setSum(box, rep(step, made), null);
      if (made >= nSteps) {
        jumpBtn.disabled = true;
        api.feedback('You reached the end of the strip. ' + made + ' jumps!', 'info');
      }
    }
    jumpBtn.addEventListener('click', doJump);
    w.appendChild(el('div', { class: 'fwf-row' }, jumpBtn));
    w.appendChild(box);
    function fullWorking() {
      sc.clearJumps();
      for (var m = 0; m < nSteps; m++) sc.jump(m * step, (m + 1) * step, String((m + 1) * step));
      made = nSteps;
      jumpBtn.disabled = true;
      setSum(box, rep(step, nSteps), q.ans, 'cm');
    }
    var inp = answerBox('cm', function (v) {
      if (U.same(v, q.ans)) {
        inp.good();
        inp.disable();
        fullWorking();
        api.check(true, nSteps + ' equal jumps of ' + step + ' cm make ' + q.ans + ' cm!');
        return;
      }
      inp.bad();
      var hint, tag;
      if (q.type === 'tenths') {
        if (v === 9 * q.s) {
          tag = 'Counted marks not spaces';
          hint = 'There are 9 marks but 10 gaps. Count the gaps!';
        } else if (v === 10 || v === 9) {
          tag = 'Gave the number of parts, not the length';
          hint = 'Yes, 10 tenths! But how many cm long? Each gap is ' + q.s + ' cm.';
        } else {
          tag = 'Did not count on in equal jumps';
          hint = 'Each tenth is ' + q.s + ' cm. Jump along the strip and count on.';
        }
        if (api.tries() >= 1) hint = '10 gaps of ' + q.s + ' cm: count on ' + q.s + ', ' + 2 * q.s + ', ' + 3 * q.s + ' ... to the end.';
      } else {
        if (v === q.p) {
          tag = 'Gave the part as the whole';
          hint = q.p + ' cm is just ' + words(1, q.d) + '. The whole strip is longer.';
        } else if (v === q.p + q.d) {
          tag = 'Added instead of copying the part';
          hint = 'Do not add ' + q.d + '. The whole is ' + q.d + ' pieces of ' + q.p + ' cm.';
        } else {
          tag = 'Did not count on in equal jumps';
          hint = q.d + ' pieces of ' + q.p + ' cm make the whole. Jump and count on.';
        }
        if (api.tries() >= 1) hint = q.d + ' jumps of ' + q.p + ' cm: ' + U.range(1, q.d).map(function (x) { return x * q.p; }).join(', ') + '.';
      }
      api.check(false, hint, tag);
    });
    w.appendChild(inp.el);
    api.onReveal(function () {
      fullWorking();
      inp.setValue(q.ans);
      inp.good();
      inp.disable();
      api.feedback(nSteps + ' equal pieces of ' + step + ' cm: ' + rep(step, nSteps).join(' + ') + ' = ' + q.ans + ' cm.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */
  function learnCars(stage, api) {
    api.say('These 4 toy cars are one third of my cars. Drag copies to fill the other trays!');
    api.lockNext();
    stage.appendChild(lesson('One tray is ' + fr(1, 3), 'The whole set is 3 trays the same. Drag the full tray onto each empty tray.'));
    var box = sumBox();
    var sc = trayScene(api, {
      obj: 'car',
      k: 4,
      trays: [
        { kind: 'full', n: 4, num: 1, den: 3 },
        { kind: 'empty', n: 0, num: 1, den: 3 },
        { kind: 'empty', n: 0, num: 1, den: 3 },
      ],
      onChange: function (s) {
        var f = s.filled();
        setSum(box, f, s.done() ? 12 : null, s.done() ? 'cars' : null);
        if (s.done()) {
          api.say('3 thirds make the whole. 4 + 4 + 4 = 12 cars!', 'cheer');
          api.feedback('One third is 4 cars, so the whole set is 12 cars.', 'good');
          api.unlockNext();
        }
      },
    });
    stage.appendChild(sc.svg);
    setSum(box, sc.filled(), null);
    stage.appendChild(box);
  }

  function learnFold(stage, api) {
    api.say('Fold this 15 cm strip into 3 equal parts. Click the strip to make a fold.');
    api.lockNext();
    stage.appendChild(lesson('Fold into thirds', 'Click on the strip to fold it. Click a fold again to undo it.'));
    var folds = [];
    var wrongCount = 0;
    var done = false;
    var box = sumBox();
    var sc = stripScene(api, {
      L: 15,
      ruler: true,
      hits: true,
      step: 1,
      onHit: function (cm) {
        if (done) return;
        var at = folds.indexOf(cm);
        if (at !== -1) folds.splice(at, 1);
        else if (folds.length < 2) folds.push(cm);
        else {
          api.feedback('Two folds make 3 parts. Click a fold to take it away first.', 'info');
          return;
        }
        api.sound('click');
        draw();
      },
    });
    function draw() {
      folds.sort(function (a, b) {
        return a - b;
      });
      sc.clearMarks();
      sc.clearPieces();
      sc.clearJumps();
      var edges = [0].concat(folds, [15]);
      var lens = [];
      for (var i = 0; i < edges.length - 1; i++) {
        var len = edges[i + 1] - edges[i];
        lens.push(len);
        sc.piece(edges[i], edges[i + 1], i % 2 ? 'fwf-piece-b' : 'fwf-piece-a', len + ' cm');
      }
      folds.forEach(function (f) {
        sc.mark(f, 'fwf-mark-fold');
      });
      if (wrongCount >= 2 && !done) {
        sc.mark(5, 'fwf-mark-ghost');
        sc.mark(10, 'fwf-mark-ghost');
      }
      setSum(box, folds.length ? lens : [], folds.length === 2 ? 15 : null, folds.length === 2 ? 'cm' : null);
      if (folds.length === 2) {
        if (lens[0] === lens[1] && lens[1] === lens[2]) {
          done = true;
          sc.disableHits();
          sc.jump(0, 5, '5');
          sc.jump(5, 10, '10');
          sc.jump(10, 15, '15');
          sc.below(5, fracText(1, 3) + ' at 5 cm');
          sc.below(10, fracText(2, 3) + ' at 10 cm');
          api.say('Three equal parts of 5 cm. One third is at 5 cm, two thirds at 10 cm!', 'cheer');
          api.feedback('5 + 5 + 5 = 15. The folds are at 5 cm and 10 cm.', 'good');
          api.unlockNext();
        } else {
          wrongCount++;
          api.feedback('The parts are ' + lens.join(' cm, ') + ' cm. Not equal yet! Click a fold to move it.' + (wrongCount >= 2 ? ' Try the dotted lines.' : ''), 'try');
          if (wrongCount === 2) draw();
        }
      } else api.feedback('', 'info');
    }
    stage.appendChild(sc.svg);
    stage.appendChild(box);
  }
  function fracText(n, d) {
    var map = { '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾', '1/2': '½' };
    return map[n + '/' + d] || n + '/' + d;
  }

  function learnTenths(stage, api) {
    api.say('Marks every 5 cm split this strip into tenths. Jump along and count the gaps!');
    api.lockNext();
    stage.appendChild(lesson('Tenths of a strip', 'Press Jump (or click the strip) to hop 5 cm at a time.'));
    var sc = stripScene(api, { L: 50, ruler: false, bottom: 40 });
    for (var i = 1; i < 10; i++) sc.mark(i * 5, 'fwf-mark-tenth');
    sc.below(0, '0');
    sc.below(5, '5 cm', 'fwf-below-good');
    var endLabel = sc.below(50, '?', 'fwf-below-q');
    var made = 0;
    var box = sumBox();
    var host = el('div', { class: 'fwf-col' });
    var jumpBtn = el('button', { class: 'btn fwf-jumpbtn', type: 'button' }, 'Jump 5 cm');
    function hop() {
      if (made >= 10) return;
      sc.piece(made * 5, made * 5 + 5, made % 2 ? 'fwf-piece-b' : 'fwf-piece-a', String(made + 1));
      sc.jump(made * 5, made * 5 + 5, String(made * 5 + 5));
      made++;
      api.sound('pop');
      setSum(box, rep(5, made), made === 10 ? 50 : null, made === 10 ? 'cm' : null);
      if (made === 10) {
        jumpBtn.disabled = true;
        endLabel.textContent = '50 cm';
        endLabel.setAttribute('class', 'fwf-below fwf-below-good');
        api.say('9 marks, but 10 gaps! 10 jumps of 5 cm make 50 cm.', 'cheer');
        api.feedback('Count the gaps, not the marks: 10 tenths of 5 cm = 50 cm.', 'good');
        var check = stripScene(api, { L: 50, ruler: true, bottom: 6 });
        check.svg.classList.add('fwf-check-ruler');
        for (var m = 1; m < 10; m++) check.mark(m * 5, 'fwf-mark-tenth');
        host.appendChild(el('div', { class: 'fwf-note' }, 'Check with a ruler:'));
        host.appendChild(check.svg);
        api.unlockNext();
      }
    }
    jumpBtn.addEventListener('click', hop);
    sc.svg.addEventListener('click', hop);
    stage.appendChild(sc.svg);
    stage.appendChild(el('div', { class: 'fwf-row' }, jumpBtn));
    stage.appendChild(box);
    stage.appendChild(host);
  }

  function learnBag(stage, api) {
    api.say('Three quarters of a bag is 15 marbles. Share them into 3 trays first.');
    api.lockNext();
    stage.appendChild(lesson(fr(3, 4) + ' is 15 marbles', fr(3, 4) + ' is 3 quarters. Share 15 into <b>3</b> trays, then add the missing quarter.'));
    var box = sumBox();
    var divBox = el('div', { class: 'fwf-sumbox' });
    var sc = trayScene(api, {
      obj: 'marble',
      k: 5,
      pile: 15,
      pileText: '15 marbles = three quarters of the bag',
      trays: [
        { kind: 'known', n: 0, num: 1, den: 4 },
        { kind: 'known', n: 0, num: 1, den: 4 },
        { kind: 'known', n: 0, num: 1, den: 4 },
        { kind: 'empty', n: 0, num: 1, den: 4 },
      ],
      onChange: function (s) {
        if (s.pile === 0 && !divBox.firstChild) {
          divBox.appendChild(divRow(15, 3, 5));
          api.say('5 in each quarter. Now drag a copy into the last tray!', 'happy');
        }
        if (s.done()) {
          setSum(box, rep(5, 4), 20, 'marbles');
          api.say('4 quarters make the whole bag: 20 marbles!', 'cheer');
          api.feedback('Share into 3 (the top number), then add one more tray: 5 + 5 + 5 + 5 = 20.', 'good');
          api.unlockNext();
        }
      },
    });
    stage.appendChild(sc.svg);
    var dealBtn = el('button', { class: 'btn fwf-deal', type: 'button' }, 'Share them out');
    dealBtn.addEventListener('click', function () {
      dealBtn.disabled = true;
      sc.deal();
    });
    stage.appendChild(el('div', { class: 'fwf-row' }, dealBtn, divBox));
    stage.appendChild(box);
  }

  MQ.register('fraction-whole-finder', {
    learn: [learnCars, learnFold, learnTenths, learnBag],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'copy') return renderCopy(stage, api, q);
        if (q.type === 'fold') return renderFold(stage, api, q);
        if (q.type === 'bag' || q.type === 'left') return renderShare(stage, api, q);
        return renderStripWhole(stage, api, q);
      },
    },
  });
  MQ.activities['fraction-whole-finder'].practice.buildDeck = buildDeck; // used by the deck test

  var css = [
    '.fwf-q{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.fwf-svg{width:100%;max-width:800px;height:auto;display:block;user-select:none;-webkit-user-select:none}',
    '.fwf-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1;margin:0 3px;font-weight:800}',
    '.fwf-fn{padding:0 3px 2px;border-bottom:3px solid currentColor}',
    '.fwf-fd{padding:2px 3px 0}',
    '.lesson-title .fwf-frac{font-size:.85em}',
    '.prompt .fwf-frac{font-size:.9em;color:#0b6e66}',
    '.fwf-sfrac text{font-weight:800;fill:var(--ink)}',
    '.fwf-sfrac line{stroke:var(--ink);stroke-width:2}',
    '.fwf-tray-box{fill:#f6efe2;stroke:#c8b08a;stroke-width:2.5}',
    '.fwf-tray-target .fwf-tray-box{fill:#f7f9ff;stroke:#8fa0cc;stroke-dasharray:7 5;cursor:pointer}',
    '.fwf-tray-target:hover .fwf-tray-box{fill:#eaf1ff}',
    '.fwf-tray-eaten.fwf-tray-target .fwf-tray-box{fill:#fbf3f3;stroke:#c99}',
    '.fwf-tray-full{cursor:grab}',
    '.fwf-tray-q{font-size:30px;font-weight:800;fill:#9aa7c7}',
    '.fwf-tray-note{font-size:17px;font-weight:800;fill:#b07070}',
    '.fwf-tray-count{font-size:13px;font-weight:800;fill:#8a6d3b}',
    '.fwf-ghost-tray{opacity:.6;pointer-events:none}',
    '.fwf-pile{fill:#fff8e6;stroke:#e0c27a;stroke-width:2}',
    '.fwf-pile-label{font-size:17px;font-weight:800;fill:var(--ink)}',
    '.fwf-sumbox{min-height:46px;display:flex;align-items:center;justify-content:center}',
    '.fwf-row{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap}',
    '.fwf-col{display:flex;flex-direction:column;align-items:center;gap:4px;width:100%}',
    '.fwf-note{font-weight:800;color:var(--ink-soft)}',
    '.fwf-div .chip{background:#fff}',
    '.fwf-strip{stroke-width:2}',
    '.fwf-strip-paper{fill:#fffdf5;stroke:#cdbb8f}',
    '.fwf-strip-ribbon{fill:#ffd6e2;stroke:#d9708f}',
    '.fwf-piece-fill{stroke:none}',
    '.fwf-piece-a .fwf-piece-fill{fill:#cfe6ff}',
    '.fwf-piece-b .fwf-piece-fill{fill:#a9d1ff}',
    '.fwf-piece-on .fwf-piece-fill{fill:#ffd166;opacity:.85}',
    '.fwf-piece-off .fwf-piece-fill{fill:#ffffff;opacity:0}',
    '.fwf-piece-text{font-size:15px;font-weight:800;fill:#1b3a6b}',
    '.fwf-sfrac-in text{fill:#5a3d00}',
    '.fwf-sfrac-in line{stroke:#5a3d00}',
    '.fwf-mark{stroke:#7a6a4a;stroke-width:2}',
    '.fwf-mark-tenth{stroke:#3d4f7a;stroke-width:3}',
    '.fwf-mark-fold{stroke:#1b2a4a;stroke-width:3;stroke-dasharray:6 4}',
    '.fwf-mark-pick{stroke:#c2410c;stroke-width:4}',
    '.fwf-mark-good{stroke:var(--good);stroke-width:5}',
    '.fwf-mark-ghost{stroke:#9aa7c7;stroke-width:3;stroke-dasharray:2 5}',
    '.fwf-hover{stroke:#c2410c;stroke-width:2;stroke-dasharray:4 4;opacity:.6}',
    '.fwf-hit{fill:transparent;cursor:pointer}',
    '.fwf-strip-svg{cursor:default}',
    '.fwf-arc{fill:none;stroke:#2b7a78;stroke-width:3}',
    '.fwf-arrow{fill:#2b7a78}',
    '.fwf-jump-pill{fill:#e3f6f4;stroke:#2b7a78;stroke-width:1.5}',
    '.fwf-jump-text{font-size:14px;font-weight:800;fill:#15514f}',
    '.fwf-jump-off .fwf-arc{stroke:#b9c3d9;stroke-dasharray:5 4}',
    '.fwf-jump-off .fwf-arrow{fill:#b9c3d9}',
    '.fwf-jump-off .fwf-jump-pill{fill:#f4f6fb;stroke:#b9c3d9}',
    '.fwf-jump-off .fwf-jump-text{fill:#7a86a3}',
    '.fwf-below{font-size:16px;font-weight:800;fill:var(--ink)}',
    '.fwf-below-pick{fill:#c2410c}',
    '.fwf-below-good{fill:var(--good)}',
    '.fwf-below-soft{fill:var(--ink-soft)}',
    '.fwf-below-q{fill:#c2410c;font-size:20px}',
    '.fwf-check-ruler{max-width:640px}',
    '.fwf-check:disabled{opacity:.5}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'fraction-whole-finder' }, css));
})();

/* Find the Fold — vertical and horizontal lines of symmetry (Unit 17.1).
 * Every picture is a list of simple parts (rect, poly, circle, ellipse, line) in its own
 * coordinates. Whether a picture is symmetrical about a line is COMPUTED from those parts
 * (each part's mirror image must match a part of the same shape and colour), and the
 * same parts are drawn and folded on screen, so the answers always match the drawings.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var INK = '#33415c';
  var TOL = 0.6;

  /* ------------------------------------------------------------------ *
   * Lines and reflection
   * ------------------------------------------------------------------ */
  function vLine(c) {
    return { x1: c, y1: 0, x2: c, y2: 1 };
  }
  function hLine(c) {
    return { x1: 0, y1: c, x2: 1, y2: c };
  }
  function axisOf(L) {
    if (Math.abs(L.x1 - L.x2) < 1e-9) return 'v';
    if (Math.abs(L.y1 - L.y2) < 1e-9) return 'h';
    return 'd';
  }
  // Unit normal of a line; for 'v' it points right, for 'h' it points down.
  function normalOf(L) {
    var ax = axisOf(L);
    if (ax === 'v') return [1, 0];
    if (ax === 'h') return [0, 1];
    var dx = L.x2 - L.x1, dy = L.y2 - L.y1;
    var len = Math.sqrt(dx * dx + dy * dy);
    return [dy / len, -dx / len];
  }
  function reflectPt(p, L) {
    var n = normalOf(L);
    var d = (p[0] - L.x1) * n[0] + (p[1] - L.y1) * n[1];
    return [p[0] - 2 * d * n[0], p[1] - 2 * d * n[1]];
  }
  function rectPts(r) {
    return [[r.x, r.y], [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], [r.x, r.y + r.h]];
  }
  function copy(o, extra) {
    var c = {};
    Object.keys(o).forEach(function (k) {
      c[k] = o[k];
    });
    Object.keys(extra || {}).forEach(function (k) {
      c[k] = extra[k];
    });
    return c;
  }

  function mirrorPart(p, L) {
    var ax = axisOf(L);
    if (p.t === 'rect') {
      if (ax === 'v') return copy(p, { x: 2 * L.x1 - p.x - p.w });
      if (ax === 'h') return copy(p, { y: 2 * L.y1 - p.y - p.h });
      var q = copy(p, { t: 'poly', p: rectPts(p).map(function (pt) { return reflectPt(pt, L); }) });
      delete q.x; delete q.y; delete q.w; delete q.h;
      return q;
    }
    if (p.t === 'poly') return copy(p, { p: p.p.map(function (pt) { return reflectPt(pt, L); }) });
    if (p.t === 'circle' || p.t === 'ellipse') {
      var c = reflectPt([p.cx, p.cy], L);
      return copy(p, { cx: c[0], cy: c[1] });
    }
    if (p.t === 'line') {
      var a = reflectPt([p.x1, p.y1], L), b = reflectPt([p.x2, p.y2], L);
      return copy(p, { x1: a[0], y1: a[1], x2: b[0], y2: b[1] });
    }
    return p;
  }

  // Plain rectangles compare as 4-point polygons, so a rectangle and a polygon with the
  // same corners are treated as the same part.
  function forCompare(p) {
    if (p.t === 'rect' && !p.rx) return { t: 'poly', p: rectPts(p), f: p.f, s: p.s, sw: p.sw };
    return p;
  }
  function near(a, b) {
    return Math.abs(a - b) < TOL;
  }
  function samePoly(A, B) {
    if (A.length !== B.length) return false;
    var n = A.length;
    for (var dir = 0; dir < 2; dir++) {
      for (var k = 0; k < n; k++) {
        var ok = true;
        for (var i = 0; i < n && ok; i++) {
          var j = dir === 0 ? (k + i) % n : (k - i + n) % n;
          if (!near(A[i][0], B[j][0]) || !near(A[i][1], B[j][1])) ok = false;
        }
        if (ok) return true;
      }
    }
    return false;
  }
  function samePart(a, b) {
    a = forCompare(a);
    b = forCompare(b);
    if (a.t !== b.t) return false;
    if ((a.f || 'none') !== (b.f || 'none') || (a.s || 'none') !== (b.s || 'none') || (a.sw || 0) !== (b.sw || 0) || (a.rx || 0) !== (b.rx || 0)) return false;
    if (a.t === 'poly') return samePoly(a.p, b.p);
    if (a.t === 'rect') return near(a.x, b.x) && near(a.y, b.y) && near(a.w, b.w) && near(a.h, b.h);
    if (a.t === 'circle') return near(a.cx, b.cx) && near(a.cy, b.cy) && near(a.r, b.r);
    if (a.t === 'ellipse') return near(a.cx, b.cx) && near(a.cy, b.cy) && near(a.rx, b.rx) && near(a.ry, b.ry);
    if (a.t === 'line') {
      return (near(a.x1, b.x1) && near(a.y1, b.y1) && near(a.x2, b.x2) && near(a.y2, b.y2)) || (near(a.x1, b.x2) && near(a.y1, b.y2) && near(a.x2, b.x1) && near(a.y2, b.y1));
    }
    return false;
  }

  /** Is the picture symmetrical about L? Also lists the parts whose mirror image has no partner. */
  function symInfo(pic, L) {
    var used = pic.parts.map(function () {
      return false;
    });
    var miss = [];
    pic.parts.forEach(function (part, j) {
      var m = mirrorPart(part, L);
      for (var i = 0; i < pic.parts.length; i++) {
        if (!used[i] && samePart(pic.parts[i], m)) {
          used[i] = true;
          return;
        }
      }
      miss.push(j);
    });
    return { match: miss.length === 0, miss: miss };
  }
  function isSym(pic, L) {
    return symInfo(pic, L).match;
  }

  function partBox(p) {
    var pad = p.s && p.s !== 'none' ? (p.sw || 0) / 2 : 0;
    var xs, ys;
    if (p.t === 'rect') { xs = [p.x, p.x + p.w]; ys = [p.y, p.y + p.h]; }
    else if (p.t === 'poly') { xs = p.p.map(function (q) { return q[0]; }); ys = p.p.map(function (q) { return q[1]; }); }
    else if (p.t === 'circle') { xs = [p.cx - p.r, p.cx + p.r]; ys = [p.cy - p.r, p.cy + p.r]; }
    else if (p.t === 'ellipse') { xs = [p.cx - p.rx, p.cx + p.rx]; ys = [p.cy - p.ry, p.cy + p.ry]; }
    else { xs = [p.x1, p.x2]; ys = [p.y1, p.y2]; }
    return { x1: Math.min.apply(null, xs) - pad, y1: Math.min.apply(null, ys) - pad, x2: Math.max.apply(null, xs) + pad, y2: Math.max.apply(null, ys) + pad };
  }
  function unionBox(boxes) {
    var b = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity };
    boxes.forEach(function (q) {
      b.x1 = Math.min(b.x1, q.x1);
      b.y1 = Math.min(b.y1, q.y1);
      b.x2 = Math.max(b.x2, q.x2);
      b.y2 = Math.max(b.y2, q.y2);
    });
    return b;
  }
  // Geometric box (no stroke) — the middle of this is where a mirror line must go.
  function picBox(pic) {
    return unionBox(
      pic.parts.map(function (p) {
        return partBox(copy(p, { s: null }));
      })
    );
  }
  function centreLines(pic) {
    var b = picBox(pic);
    return { v: vLine((b.x1 + b.x2) / 2), h: hLine((b.y1 + b.y2) / 2) };
  }
  /** Which centre lines (vertical / horizontal) are lines of symmetry. */
  function linesOf(pic) {
    var c = centreLines(pic);
    return { v: isSym(pic, c.v), h: isSym(pic, c.h) };
  }

  /* ------------------------------------------------------------------ *
   * Drawing
   * ------------------------------------------------------------------ */
  function drawPart(p, cls) {
    var a = { class: cls || null, fill: p.f || 'none', stroke: p.s || 'none', 'stroke-width': p.sw || 0, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' };
    if (cls) {
      a.fill = 'none';
      a.stroke = null;
      a['stroke-width'] = null;
    }
    if (p.t === 'rect') return svg('rect', copy(a, { x: p.x, y: p.y, width: p.w, height: p.h, rx: p.rx || null }));
    if (p.t === 'poly') return svg('polygon', copy(a, { points: p.p.map(function (q) { return q[0] + ',' + q[1]; }).join(' ') }));
    if (p.t === 'circle') return svg('circle', copy(a, { cx: p.cx, cy: p.cy, r: p.r }));
    if (p.t === 'ellipse') return svg('ellipse', copy(a, { cx: p.cx, cy: p.cy, rx: p.rx, ry: p.ry }));
    return svg('line', copy(a, { x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2 }));
  }
  function drawPic(pic, miss) {
    var g = svg('g', { class: 'mlf-pic' });
    pic.parts.forEach(function (p) {
      g.appendChild(drawPart(p));
    });
    (miss || []).forEach(function (i) {
      g.appendChild(drawPart(pic.parts[i], 'mlf-miss'));
    });
    return g;
  }
  function viewBoxOf(b, pad) {
    return [b.x1 - pad, b.y1 - pad, b.x2 - b.x1 + 2 * pad, b.y2 - b.y1 + 2 * pad].join(' ');
  }
  /** A plain picture (no line). */
  function picSvg(pic, width) {
    var b = unionBox(pic.parts.map(partBox));
    return svg('svg', { viewBox: viewBoxOf(b, 8), width: width, class: 'mlf-svg', style: { maxWidth: '100%', height: 'auto' } }, drawPic(pic));
  }
  function lineEls(L, b, cls) {
    var ax = axisOf(L);
    var x1, y1, x2, y2;
    if (ax === 'v') { x1 = x2 = L.x1; y1 = b.y1 - 4; y2 = b.y2 + 4; }
    else if (ax === 'h') { y1 = y2 = L.y1; x1 = b.x1 - 4; x2 = b.x2 + 4; }
    else {
      var dx = L.x2 - L.x1, dy = L.y2 - L.y1;
      x1 = L.x1 - dx * 0.08; y1 = L.y1 - dy * 0.08; x2 = L.x2 + dx * 0.08; y2 = L.y2 + dy * 0.08;
    }
    return svg('g', { class: cls || 'mlf-linegrp' }, svg('line', { x1: x1, y1: y1, x2: x2, y2: y2, class: 'mlf-line-under' }), svg('line', { x1: x1, y1: y1, x2: x2, y2: y2, class: 'mlf-line' }));
  }

  var uid = 0;

  /** Smooth animation using requestAnimationFrame, cancelled when the screen changes. */
  function animate(api, ms, step, done) {
    var start = null;
    var id = null;
    function f(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / ms);
      step(t);
      if (t < 1) id = window.requestAnimationFrame(f);
      else {
        id = null;
        if (done) done();
      }
    }
    id = window.requestAnimationFrame(f);
    api.cleanup(function () {
      if (id) window.cancelAnimationFrame(id);
    });
  }

  /**
   * A picture with a dashed mirror line that can fold along the line.
   * opts: { width, button (show a Fold button), caption, onFolded(info) }
   * Returns { el, svg, info, fold(cb), folded }
   */
  function foldCard(pic, L, api, opts) {
    opts = opts || {};
    var info = symInfo(pic, L);
    var mirrored = pic.parts.map(function (p) {
      return mirrorPart(p, L);
    });
    var box = unionBox(pic.parts.map(partBox).concat(mirrored.map(partBox)));
    var n = normalOf(L);
    var d = [L.x2 - L.x1, L.y2 - L.y1];
    var dl = Math.sqrt(d[0] * d[0] + d[1] * d[1]);
    d = [d[0] / dl, d[1] / dl];
    var K = 5000;
    function half(sign) {
      var a = [L.x1 - d[0] * K, L.y1 - d[1] * K], b = [L.x1 + d[0] * K, L.y1 + d[1] * K];
      var pts = [a, b, [b[0] + sign * n[0] * K, b[1] + sign * n[1] * K], [a[0] + sign * n[0] * K, a[1] + sign * n[1] * K]];
      return svg('polygon', { points: pts.map(function (q) { return q.join(','); }).join(' ') });
    }
    uid++;
    var stayId = 'mlf-stay-' + uid, flapId = 'mlf-flap-' + uid;
    var root = svg('svg', { viewBox: viewBoxOf(box, 10), width: opts.width || 300, class: 'mlf-svg mlf-fold', style: { maxWidth: '100%', height: 'auto' } });
    root.appendChild(svg('defs', null, svg('clipPath', { id: stayId, clipPathUnits: 'userSpaceOnUse' }, half(-1)), svg('clipPath', { id: flapId, clipPathUnits: 'userSpaceOnUse' }, half(1))));
    root.appendChild(svg('g', { 'clip-path': 'url(#' + stayId + ')' }, drawPic(pic, info.miss)));
    var flapMove = svg('g', { class: 'mlf-flap' }, svg('g', { 'clip-path': 'url(#' + flapId + ')' }, drawPic(pic, info.miss)));
    root.appendChild(flapMove);
    root.appendChild(lineEls(L, unionBox(pic.parts.map(partBox))));

    var badge = el('div', { class: 'mlf-badge' }, '');
    var card = el('div', { class: 'mlf-card' }, opts.caption ? el('div', { class: 'mlf-cap', html: opts.caption }) : null, root, badge);
    var btn = null;
    var obj = { el: card, svg: root, info: info, folded: false, busy: false };

    function setS(s) {
      var k = 1 - s;
      var an = L.x1 * n[0] + L.y1 * n[1];
      var m = [1 - k * n[0] * n[0], -k * n[0] * n[1], -k * n[0] * n[1], 1 - k * n[1] * n[1], k * an * n[0], k * an * n[1]];
      flapMove.setAttribute('transform', 'matrix(' + m.map(function (v) { return Math.round(v * 10000) / 10000; }).join(',') + ')');
      flapMove.setAttribute('opacity', s < 0 ? 0.78 : 1);
    }
    obj.fold = function (cb) {
      if (obj.busy) return;
      if (obj.folded) {
        obj.unfold();
        return;
      }
      obj.busy = true;
      api.sound('pop');
      animate(
        api,
        900,
        function (t) {
          var e = 0.5 - 0.5 * Math.cos(Math.PI * t);
          setS(Math.cos(Math.PI * e));
        },
        function () {
          obj.busy = false;
          obj.folded = true;
          root.classList.add(info.match ? 'mlf-ok' : 'mlf-showmiss');
          badge.className = 'mlf-badge ' + (info.match ? 'mlf-badge-good' : 'mlf-badge-bad');
          badge.textContent = info.match ? '✓ The halves match' : '✗ The halves do not match';
          if (btn) btn.textContent = '↺ Unfold';
          if (opts.onFolded) opts.onFolded(info);
          if (cb) cb(info);
        }
      );
    };
    obj.unfold = function () {
      setS(1);
      obj.folded = false;
      root.classList.remove('mlf-ok', 'mlf-showmiss');
      badge.className = 'mlf-badge';
      badge.textContent = '';
      if (btn) btn.textContent = opts.buttonLabel || '📄 Fold it';
    };
    if (opts.button) {
      btn = el('button', { class: 'btn mlf-foldbtn', type: 'button', onclick: function () { obj.fold(); } }, opts.buttonLabel || '📄 Fold it');
      card.appendChild(btn);
    }
    return obj;
  }

  /** Show folds on the up-down and side-to-side centre lines, one after the other. */
  function showBothFolds(host, pic, api, width) {
    var c = centreLines(pic);
    var a = foldCard(pic, c.v, api, { width: width || 240, caption: '<b>Up-down</b> fold' });
    var b = foldCard(pic, c.h, api, { width: width || 240, caption: '<b>Side-to-side</b> fold' });
    MQ.clear(host);
    host.appendChild(el('div', { class: 'mlf-row' }, a.el, b.el));
    api.later(function () {
      a.fold(function () {
        api.later(function () {
          b.fold();
        }, 250);
      });
    }, 300);
  }

  /* ------------------------------------------------------------------ *
   * Picture bank (all original drawings, coordinates centred near 0,0)
   * ------------------------------------------------------------------ */
  function R(x, y, w, h, f, s, sw, rx) {
    return { t: 'rect', x: x, y: y, w: w, h: h, f: f, s: s, sw: sw, rx: rx };
  }
  function P(pts, f, s, sw) {
    return { t: 'poly', p: pts, f: f, s: s, sw: sw };
  }
  function C(cx, cy, r, f, s, sw) {
    return { t: 'circle', cx: cx, cy: cy, r: r, f: f, s: s, sw: sw };
  }
  function E(cx, cy, rx, ry, f, s, sw) {
    return { t: 'ellipse', cx: cx, cy: cy, rx: rx, ry: ry, f: f, s: s, sw: sw };
  }
  function Ln(x1, y1, x2, y2, s, sw) {
    return { t: 'line', x1: x1, y1: y1, x2: x2, y2: y2, s: s, sw: sw };
  }
  function mx(pts) {
    return pts.map(function (q) {
      return [-q[0], q[1]];
    });
  }
  function pair(make) {
    // make(sign) builds the right-hand part (sign 1) or its mirror twin (sign -1)
    return [make(-1), make(1)];
  }
  function flat(arr) {
    var out = [];
    arr.forEach(function (a) {
      if (Array.isArray(a)) out = out.concat(a);
      else out.push(a);
    });
    return out;
  }

  var HOUSE = {
    name: 'house',
    parts: flat([
      R(-90, -20, 180, 110, '#f6d6a8', INK, 3),
      P([[-105, -20], [0, -95], [105, -20]], '#d1495b', INK, 3),
      C(0, -48, 12, '#bde0fe', INK, 3),
      R(-22, 30, 44, 60, '#3d7ea6', INK, 3),
      C(0, 56, 4, '#ffd166'),
      pair(function (s) { return R(s > 0 ? 36 : -72, 5, 36, 30, '#bde0fe', INK, 3); }),
      pair(function (s) { return Ln(54 * s, 5, 54 * s, 35, INK, 2); }),
      pair(function (s) { return Ln(s > 0 ? 36 : -72, 20, s > 0 ? 72 : -36, 20, INK, 2); }),
    ]),
  };
  var SIGN = {
    name: 'arrow sign',
    parts: [R(-110, -50, 220, 100, '#2a9d8f', INK, 3, 14), P([[-75, -12], [20, -12], [20, -36], [78, 0], [20, 36], [20, 12], [-75, 12]], '#ffffff', INK, 2)],
  };
  var PLAIN_RECT = { name: 'rectangle', parts: [R(-110, -65, 220, 130, '#ffd166', INK, 3)] };

  function leafPts() {
    var right = [], left = [];
    for (var i = 0; i <= 16; i++) {
      var y = -95 + (170 * i) / 16;
      var w = Math.round(55 * Math.sin((Math.PI * i) / 16) * 10) / 10;
      right.push([w, y]);
    }
    for (var j = 15; j >= 1; j--) left.push([-right[j][0], right[j][1]]);
    return right.concat(left);
  }
  var PETALS = [0, 60, 120, 180, 240, 300].map(function (deg) {
    var a = (deg * Math.PI) / 180;
    return C(Math.round(24 * Math.sin(a) * 100) / 100, Math.round((-62 - 24 * Math.cos(a)) * 100) / 100, 11, '#f28482', INK, 2);
  });

  // Level 1 everyday pictures. kind = the expected answer (checked against the geometry by tests).
  var EVERYDAY = [
    {
      key: 'butterfly', name: 'butterfly', kind: 'v', why: 'The left wing is just like the right wing.',
      parts: flat([
        pair(function (s) { return P(s > 0 ? [[5, -5], [55, -70], [95, -55], [90, -10]] : mx([[5, -5], [55, -70], [95, -55], [90, -10]]), '#f4a261', INK, 3); }),
        pair(function (s) { return P(s > 0 ? [[5, 5], [80, 20], [70, 65], [25, 60]] : mx([[5, 5], [80, 20], [70, 65], [25, 60]]), '#e9c46a', INK, 3); }),
        pair(function (s) { return C(62 * s, -40, 10, '#e76f51'); }),
        pair(function (s) { return C(50 * s, 38, 7, '#e76f51'); }),
        E(0, 5, 8, 52, INK),
        pair(function (s) { return Ln(0, -42, 20 * s, -80, INK, 3); }),
        pair(function (s) { return C(20 * s, -80, 4, INK); }),
      ]),
    },
    {
      key: 'flower', name: 'flower pot', kind: 'v', why: 'The left side is just like the right side.',
      parts: flat([
        R(-3, -45, 6, 80, '#2a9d8f'),
        pair(function (s) { return P(s > 0 ? [[3, 10], [30, -8], [55, -10], [35, 8]] : mx([[3, 10], [30, -8], [55, -10], [35, 8]]), '#52b788', INK, 2); }),
        P([[-45, 40], [45, 40], [35, 100], [-35, 100]], '#c8553d', INK, 3),
        R(-52, 30, 104, 16, '#d9734e', INK, 3),
        PETALS,
        C(0, -62, 12, '#ffd166', INK, 2),
      ]),
    },
    {
      key: 'tree', name: 'fir tree', kind: 'v', why: 'Each side of the tree is the same.',
      parts: flat([
        R(-12, 60, 24, 35, '#8d5524', INK, 2),
        P([[-85, 70], [85, 70], [0, 5]], '#2d6a4f', INK, 3),
        P([[-65, 30], [65, 30], [0, -40]], '#40916c', INK, 3),
        P([[-45, -10], [45, -10], [0, -80]], '#52b788', INK, 3),
        pair(function (s) { return C(35 * s, 52, 6, '#e63946'); }),
        C(0, -86, 8, '#ffd166', INK, 2),
      ]),
    },
    {
      key: 'backpack', name: 'school bag', kind: 'v', why: 'The left half is just like the right half.',
      parts: flat([
        R(-22, -92, 44, 30, 'none', '#1d3557', 7, 12),
        R(-70, -70, 140, 165, '#457b9d', INK, 3, 26),
        pair(function (s) { return C(35 * s, -30, 8, '#f1faee', INK, 2); }),
        R(-48, 20, 96, 60, '#1d3557', INK, 3, 14),
        Ln(-38, 32, 38, 32, '#f1faee', 3),
      ]),
    },
    {
      key: 'lamp', name: 'lamp', kind: 'v', why: 'The left side of the lamp is just like the right side.',
      parts: [R(-6, -12, 12, 80, '#6c757d'), P([[-45, -90], [45, -90], [75, -10], [-75, -10]], '#ffd166', INK, 3), E(0, 78, 55, 14, '#495057', INK, 3)],
    },
    {
      key: 'leaf', name: 'leaf', kind: 'v', why: 'The leaf is the same on both sides of its middle vein.',
      parts: flat([
        R(-3, 70, 6, 28, '#6a994e'),
        P(leafPts(), '#a7c957', '#386641', 3),
        Ln(0, -85, 0, 72, '#386641', 3),
        pair(function (s) { return Ln(0, -40, 26 * s, -62, '#386641', 2); }),
        pair(function (s) { return Ln(0, -5, 34 * s, -30, '#386641', 2); }),
        pair(function (s) { return Ln(0, 30, 30 * s, 8, '#386641', 2); }),
      ]),
    },
    {
      key: 'pencil', name: 'pencil', kind: 'h', why: 'The top half is just like the bottom half. The point is only at one end.',
      parts: [
        R(-110, -15, 22, 30, '#f4acb7', INK, 2),
        R(-88, -15, 14, 30, '#adb5bd', INK, 2),
        R(-74, -15, 124, 30, '#ffd166', INK, 2),
        Ln(-74, -5, 50, -5, '#e0a800', 2),
        Ln(-74, 5, 50, 5, '#e0a800', 2),
        P([[50, -15], [95, 0], [50, 15]], '#f6d6a8', INK, 2),
        P([[80, -5], [95, 0], [80, 5]], INK),
      ],
    },
    {
      key: 'spoon', name: 'spoon', kind: 'h', why: 'The top half is just like the bottom half. The bowl is only at one end.',
      parts: [P([[-105, -7], [8, -4], [8, 4], [-105, 7]], '#adb5bd', INK, 2), C(-105, 0, 10, '#adb5bd', INK, 2), E(50, 0, 48, 30, '#ced4da', INK, 2), E(54, 0, 32, 18, '#e9ecef')],
    },
    {
      key: 'fish', name: 'fish', kind: 'h', why: 'The top fin matches the bottom fin. The head is only at one end.',
      parts: [
        P([[-50, 0], [-95, -35], [-80, 0], [-95, 35]], '#f77f00', INK, 3),
        P([[-15, -32], [10, -56], [30, -34]], '#f77f00', INK, 3),
        P([[-15, 32], [10, 56], [30, 34]], '#f77f00', INK, 3),
        E(5, 0, 65, 38, '#fcbf49', INK, 3),
        Ln(-20, -30, -20, 30, '#f77f00', 4),
        C(42, 0, 9, '#ffffff', INK, 2),
        C(42, 0, 4, INK),
      ],
    },
    {
      key: 'brush', name: 'paintbrush', kind: 'h', why: 'The top half is just like the bottom half. The bristles are only at one end.',
      parts: [P([[-110, -8], [0, -12], [0, 12], [-110, 8]], '#9c6644', INK, 2), R(0, -14, 30, 28, '#adb5bd', INK, 2), P([[30, -14], [85, -10], [105, 0], [85, 10], [30, 14]], '#e63946', INK, 2)],
    },
    {
      key: 'mug', name: 'mug', kind: 'none', why: 'The handle is only on one side, and the mug is wider at the top than the bottom.',
      parts: [C(52, 0, 24, 'none', '#264653', 10), P([[-45, -50], [45, -50], [36, 55], [-36, 55]], '#2a9d8f', INK, 3), C(0, 5, 12, '#ffffff')],
    },
    {
      key: 'key', name: 'key', kind: 'none', why: 'The teeth stick out only at the bottom, and the ring is only at one end.',
      parts: [C(-72, 0, 28, 'none', '#d4a017', 12), R(-44, -7, 140, 14, '#e9c46a', '#d4a017', 2), R(60, 7, 12, 22, '#e9c46a', '#d4a017', 2), R(82, 7, 12, 14, '#e9c46a', '#d4a017', 2)],
    },
    {
      key: 'can', name: 'watering can', kind: 'none', why: 'The spout is only on one side, and the handle is on the other.',
      parts: [R(-95, -30, 34, 60, 'none', INK, 8, 14), P([[40, 20], [40, -2], [100, -55], [110, -45]], '#52b788', INK, 3), R(-65, -40, 105, 90, '#52b788', INK, 3)],
    },
    {
      key: 'sock', name: 'sock', kind: 'none', why: 'The toe points one way only.',
      parts: [P([[-45, -95], [15, -95], [15, 25], [70, 25], [90, 45], [90, 75], [70, 95], [-25, 95], [-45, 75]], '#e76f51', INK, 3), R(-45, -95, 60, 22, '#f4a261', INK, 3)],
    },
  ];

  /* ---------- Level 2 shapes (from the textbook's shape list) ---------- */
  var SHAPE_FILL = '#a8dadc';
  function regular(n, r, startDeg) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var a = ((startDeg + (360 * i) / n) * Math.PI) / 180;
      out.push([Math.round(r * Math.cos(a) * 1000) / 1000, Math.round(r * Math.sin(a) * 1000) / 1000]);
    }
    return out;
  }
  var SHAPES = {
    rectangle: function () {
      return { name: 'rectangle', parts: [R(-100, -60, 200, 120, SHAPE_FILL, INK, 3)], why: 'A rectangle has 2 mirror lines: one up-down and one side-to-side, both through the middle.' };
    },
    isosceles: function () {
      if (Math.random() < 0.5) return { name: 'triangle', parts: [P([[0, -85], [65, 80], [-65, 80]], SHAPE_FILL, INK, 3)], why: 'Two sides are the same length, so the up-down line through the top point works.' };
      return { name: 'triangle', parts: [P([[95, 0], [-80, -65], [-80, 65]], SHAPE_FILL, INK, 3)], why: 'Two sides are the same length, so the side-to-side line through the point works.' };
    },
    rightTri: function () {
      return { name: 'right-angled triangle', parts: [P([[-90, 70], [90, 70], [-90, -60]], SHAPE_FILL, INK, 3)], why: 'All three sides are different lengths. No fold makes the halves match.' };
    },
    parallelogram: function () {
      return { name: 'parallelogram', parts: [P([[-100, 55], [45, 55], [100, -55], [-45, -55]], SHAPE_FILL, INK, 3)], why: 'A line through the middle cuts it in half, but the halves are not mirror images. The slants go the wrong way.' };
    },
    circle: function () {
      return { name: 'circle', parts: [C(0, 0, 90, SHAPE_FILL, INK, 3)], why: 'Any line through the middle of a circle works. A circle has lots of mirror lines!' };
    },
    plus: function () {
      return { name: 'plus sign', parts: [P([[-30, -90], [30, -90], [30, -30], [90, -30], [90, 30], [30, 30], [30, 90], [-30, 90], [-30, 30], [-90, 30], [-90, -30], [-30, -30]], SHAPE_FILL, INK, 3)], why: 'The up-down line and the side-to-side line through the middle both work.' };
    },
    pentagon: function () {
      return { name: 'pentagon', parts: [P(regular(5, 95, -90), SHAPE_FILL, INK, 3)], why: 'The up-down line through the top point works. A side-to-side line does not.' };
    },
    arrow: function () {
      if (Math.random() < 0.5) return { name: 'arrow', parts: [P([[-90, -70], [15, -70], [95, 0], [15, 70], [-90, 70], [-20, 0]], SHAPE_FILL, INK, 3)], why: 'The arrow points one way, so only the side-to-side line through the point works.' };
      return { name: 'arrow', parts: [P([[-70, 90], [-70, -15], [0, -95], [70, -15], [70, 90], [0, 20]], SHAPE_FILL, INK, 3)], why: 'The arrow points up, so only the up-down line through the point works.' };
    },
  };
  var SHAPE_KEYS = Object.keys(SHAPES);

  /* ---------- Flags and count-the-lines pictures ---------- */
  function frame() {
    return R(-120, -80, 240, 160, 'none', INK, 3);
  }
  var TRAP = {
    colour: { hint: 'The shapes match, but do the colours match too? Colours must match as well.', tag: 'Forgot colours must match too' },
    offcentre: { hint: 'Look carefully: is that part really in the middle?', tag: 'Missed a part that is off-centre' },
    generic: { hint: 'Fold it in your head. Does every part land on a matching part?', tag: 'Counted a line that does not work' },
  };
  var FLAGS_EASY = [
    { key: 'crossC', name: 'flag', count: 2, trap: 'generic', why: 'The cross is right in the middle, so the up-down fold AND the side-to-side fold both work: 2 lines.', parts: [R(-120, -80, 240, 160, '#3a86ff'), R(-16, -80, 32, 160, '#ffffff'), R(-120, -16, 240, 32, '#ffffff'), frame()] },
    { key: 'twoH', name: 'flag', count: 1, trap: 'colour', why: 'Up-down works. Side-to-side puts green on yellow, so it does not work: 1 line.', parts: [R(-120, -80, 240, 80, '#2a9d8f'), R(-120, 0, 240, 80, '#ffd166'), frame()] },
    { key: 'bandC', name: 'flag', count: 2, trap: 'generic', why: 'The white band is right in the middle, so both folds work: 2 lines.', parts: [R(-120, -80, 80, 160, '#e63946'), R(-40, -80, 80, 160, '#ffffff'), R(40, -80, 80, 160, '#e63946'), frame()] },
    { key: 'diag', name: 'flag', count: 0, trap: 'generic', why: 'The stripe goes corner to corner. Fold either way and the stripe lands in the wrong place: 0 lines.', parts: [R(-120, -80, 240, 160, '#ffd166'), P([[-120, 50], [75, -80], [120, -80], [120, -50], [-75, 80], [-120, 80]], '#3a86ff'), frame()] },
    { key: 'circleC', name: 'flag', count: 2, trap: 'generic', why: 'The circle is right in the middle, so both folds work: 2 lines.', parts: [R(-120, -80, 240, 160, '#2a9d8f'), C(0, 0, 46, '#ffd166'), frame()] },
    { key: 'pennant', name: 'pennant flag', count: 1, trap: 'generic', why: 'The pennant points one way. Only the side-to-side line works: 1 line.', parts: [P([[-120, -70], [120, 0], [-120, 70]], '#f77f00', INK, 3), C(-60, 0, 16, '#ffffff')] },
  ];
  var COUNT_HARD = [
    { key: 'bandOff', name: 'flag', count: 1, trap: 'offcentre', why: 'The red band is to the left of the middle, so the up-down fold does not work. Only side-to-side works: 1 line.', parts: [R(-120, -80, 240, 160, '#ffffff'), R(-90, -80, 44, 160, '#e63946'), frame()] },
    { key: 'crossOff', name: 'flag', count: 1, trap: 'offcentre', why: 'The up-down bar of the cross is to the left, so the up-down fold does not work. Only side-to-side works: 1 line.', parts: [R(-120, -80, 240, 160, '#e63946'), R(-72, -80, 32, 160, '#ffffff'), R(-120, -16, 240, 32, '#ffffff'), frame()] },
    { key: 'stripes3', name: 'flag', count: 1, trap: 'colour', why: 'Up-down works. Side-to-side puts purple on teal, so it does not work: 1 line.', parts: [R(-120, -80, 240, 160 / 3, '#7b2cbf'), R(-120, -80 + 160 / 3, 240, 160 / 3, '#ffd166'), R(-120, 80 - 160 / 3, 240, 160 / 3, '#2a9d8f'), frame()] },
    { key: 'stripes3v', name: 'flag', count: 1, trap: 'colour', why: 'Side-to-side works. Up-down puts orange on blue, so it does not work: 1 line.', parts: [R(-120, -80, 80, 160, '#f77f00'), R(-40, -80, 80, 160, '#ffffff'), R(40, -80, 80, 160, '#3a86ff'), frame()] },
    { key: 'cornerTri', name: 'flag', count: 0, trap: 'offcentre', why: 'The triangle is in one corner. Neither fold puts it on a matching triangle: 0 lines.', parts: [R(-120, -80, 240, 160, '#3a86ff'), P([[-120, -80], [-25, -80], [-120, 0]], '#ffd166'), frame()] },
    { key: 'circleOff', name: 'flag', count: 1, trap: 'offcentre', why: 'The circle is to the left of the middle, so the up-down fold does not work. Only side-to-side works: 1 line.', parts: [R(-120, -80, 240, 160, '#2a9d8f'), C(-45, 0, 46, '#e63946'), frame()] },
    { key: 'hoistTri', name: 'flag', count: 1, trap: 'offcentre', why: 'The triangle is only on the left, so the up-down fold does not work. Only side-to-side works: 1 line.', parts: [R(-120, -80, 240, 160, '#ffffff'), P([[-120, -80], [0, 0], [-120, 80]], '#e63946'), frame()] },
    { key: 'label', name: 'label shape', count: 2, trap: 'generic', why: 'The cut corners are all the same, so the up-down AND side-to-side folds both work: 2 lines.', parts: [P([[-80, -70], [80, -70], [110, -40], [110, 40], [80, 70], [-80, 70], [-110, 40], [-110, -40]], '#cdb4db', INK, 3)] },
    { key: 'pot', name: 'flowerpot shape', count: 1, trap: 'generic', why: 'The top is wider than the bottom, so side-to-side does not work. Only up-down works: 1 line.', parts: [P([[-90, -70], [90, -70], [60, 70], [-60, 70]], '#e5989b', INK, 3)] },
  ];

  /* ---------- Square logos with a dashed line (17.1 Q9 idea) ---------- */
  function sq() {
    return R(-85, -85, 170, 170, '#ffffff', INK, 6);
  }
  var LOGOS_YES = [
    { key: 'diamond', parts: [sq(), P([[0, -62], [62, 0], [0, 62], [-62, 0]], '#2a9d8f'), R(-18, -18, 36, 36, '#ffffff')], axes: ['v', 'h'] },
    { key: 'house', parts: [sq(), P([[-45, 60], [45, 60], [45, 0], [0, -50], [-45, 0]], '#e76f51'), R(-12, 25, 24, 35, '#ffffff')], axes: ['v'] },
    { key: 'ring', parts: [sq(), C(0, 0, 45, 'none', '#3a86ff', 12), R(-70, -7, 140, 14, '#3a86ff')], axes: ['h', 'v'] },
    { key: 'dots', parts: [sq(), C(-35, -25, 16, '#f77f00'), C(35, -25, 16, '#f77f00'), R(-45, 25, 90, 16, '#f77f00')], axes: ['v'] },
  ];
  var LOGOS_NO = [
    { key: 'pinwheel', parts: [sq(), P([[0, 0], [0, -65], [45, -65]], '#8338ec'), P([[0, 0], [65, 0], [65, 45]], '#8338ec'), P([[0, 0], [0, 65], [-45, 65]], '#8338ec'), P([[0, 0], [-65, 0], [-65, -45]], '#8338ec')], axes: ['v', 'h'] },
    { key: 'dotCorner', parts: [sq(), C(-38, -38, 22, '#e63946'), R(-55, 25, 110, 18, '#e63946')], axes: ['v', 'h'] },
    { key: 'lShape', parts: [sq(), P([[-50, -55], [-20, -55], [-20, 30], [50, 30], [50, 60], [-50, 60]], '#2a9d8f')], axes: ['h', 'v'] },
  ];

  /* ---------- Tile pictures with a dashed line (17.1 Q4 idea) ---------- */
  var TN = 6, TC = 28, T0 = -84;
  var TILE_COLS = [['#3a86ff', '#ffbe0b'], ['#2a9d8f', '#e76f51'], ['#8338ec', '#ff006e'], ['#06d6a0', '#118ab2']];
  function tilesToPic(grid, cols) {
    var parts = [];
    for (var r = 0; r < TN; r++) {
      for (var c = 0; c < TN; c++) {
        if (grid[r][c]) parts.push(R(T0 + c * TC, T0 + r * TC, TC, TC, cols[grid[r][c] - 1], '#ffffff', 2));
      }
    }
    return { name: 'tile picture', parts: parts };
  }
  function symGridV() {
    // random left half mirrored onto the right; colour 1 or 2, 0 = empty
    var g = [];
    for (var r = 0; r < TN; r++) {
      var row = [];
      for (var c = 0; c < TN / 2; c++) row.push(Math.random() < 0.55 ? U.rand(1, 2) : 0);
      g.push(row.concat(row.slice().reverse()));
    }
    return g;
  }
  function transpose(g) {
    return g[0].map(function (_, c) {
      return g.map(function (row) {
        return row[c];
      });
    });
  }
  function filled(g) {
    var n = 0;
    g.forEach(function (row) {
      row.forEach(function (v) {
        if (v) n++;
      });
    });
    return n;
  }
  // A V-symmetric grid that is NOT H-symmetric, uses both edge columns, top and bottom rows.
  function goodSymGrid() {
    for (var k = 0; k < 400; k++) {
      var g = symGridV();
      var n = filled(g);
      if (n < 12 || n > 26) continue;
      var edgeCol = g.some(function (row) { return row[0]; });
      var top = g[0].some(Boolean), bottom = g[TN - 1].some(Boolean);
      if (!edgeCol || !top || !bottom) continue;
      var pic = tilesToPic(g, ['#000', '#fff']);
      if (isSym(pic, hLine(0))) continue;
      return g;
    }
    return [[1, 0, 2, 2, 0, 1], [1, 1, 0, 0, 1, 1], [0, 2, 2, 2, 2, 0], [0, 1, 0, 0, 1, 0], [2, 1, 1, 1, 1, 2], [2, 0, 0, 0, 0, 2]];
  }

  function makeTileCard(kind) {
    var cols = U.pick(TILE_COLS);
    var g = goodSymGrid();
    var turn = Math.random() < 0.5; // true = picture's mirror line is horizontal
    var meta = {};
    var line;
    if (kind === 'notSym') {
      // break the symmetry clearly: change 3 tiles on the right-hand side
      var cells = U.shuffle(
        U.range(0, TN - 1).reduce(function (acc, r) {
          return acc.concat([[r, 3], [r, 4], [r, 5]]);
        }, [])
      ).slice(0, 3);
      cells.forEach(function (rc) {
        var v = g[rc[0]][rc[1]];
        g[rc[0]][rc[1]] = v ? 0 : U.rand(1, 2);
      });
    }
    if (turn) g = transpose(g);
    var pic = tilesToPic(g, cols);
    if (kind === 'yes' || kind === 'notSym') line = turn ? hLine(0) : vLine(0);
    else if (kind === 'wrongDir') line = turn ? vLine(0) : hLine(0);
    else {
      // wrongPlace: the picture is symmetrical, but the line is 2 squares from one edge (2 | 4)
      var at = U.pick([2, 4]);
      line = turn ? hLine(T0 + at * TC) : vLine(T0 + at * TC);
      meta.a = Math.min(at, TN - at);
      meta.b = Math.max(at, TN - at);
      meta.rows = turn;
    }
    return { pic: pic, line: line, kind: kind, meta: meta };
  }
  function makeLogoCard(kind) {
    var src = kind === 'yes' ? U.pick(LOGOS_YES) : U.pick(LOGOS_NO);
    var ax = U.pick(src.axes);
    return { pic: { name: 'logo', parts: src.parts }, line: ax === 'v' ? vLine(0) : hLine(0), kind: kind === 'yes' ? 'yes' : 'outline', key: src.key };
  }

  /* ------------------------------------------------------------------ *
   * Practice deck
   * ------------------------------------------------------------------ */
  function buildDeck() {
    var q = [];
    var byKind = { v: [], h: [], none: [] };
    U.shuffle(EVERYDAY).forEach(function (p) {
      byKind[p.kind].push(p);
    });
    // Level 1 (questions 1–4): one up-down, one side-to-side, one with no line, one more with a line
    var l1 = [byKind.v[0], byKind.h[0], byKind.none[0], Math.random() < 0.5 ? byKind.v[1] : byKind.h[1]];
    U.shuffle(l1).forEach(function (p) {
      var L = linesOf(p);
      q.push({ type: 'pic', pic: p, answer: L.v ? 'v' : L.h ? 'h' : 'none', lines: L });
    });
    // Level 2 (questions 5–7): two shapes (drag a line on, or "No line") and a flag to count
    var symKeys = ['rectangle', 'isosceles', 'circle', 'plus', 'pentagon', 'arrow'];
    var k1 = U.pick(symKeys);
    var rest = SHAPE_KEYS.filter(function (k) {
      return k !== k1;
    });
    // make a no-line shape likely in the second slot
    var k2 = Math.random() < 0.5 ? U.pick(['rightTri', 'parallelogram']) : U.pick(rest);
    [k1, k2].forEach(function (k) {
      var s = SHAPES[k]();
      s.key = k;
      q.push({ type: 'drag', pic: s, lines: linesOf(s) });
    });
    var f = U.pick(FLAGS_EASY);
    q.push({ type: 'count', pic: f, count: countOf(f) });
    // Level 3 (questions 8–10): tiles with a dashed line, logos with a dashed line, a tricky count
    var tileKinds = ['yes', 'wrongPlace', U.pick(['yes', 'wrongDir', 'notSym'])];
    q.push({ type: 'multi', what: 'Picture', cards: U.shuffle(tileKinds).map(makeTileCard) });
    var logoCards = [makeLogoCard('no'), makeLogoCard('yes')];
    var third;
    do {
      third = makeLogoCard(Math.random() < 0.5 ? 'yes' : 'no');
    } while (logoCards.some(function (c) { return c.key === third.key; }));
    logoCards.push(third);
    q.push({ type: 'multi', what: 'Logo', cards: U.shuffle(logoCards) });
    var h = U.pick(COUNT_HARD);
    q.push({ type: 'count', pic: h, count: countOf(h), hard: true });
    // stored answers for multi cards come from the geometry
    q.forEach(function (it) {
      if (it.type === 'multi') {
        it.cards.forEach(function (c) {
          c.ok = isSym(c.pic, c.line);
        });
      }
    });
    return q;
  }
  function countOf(pic) {
    var L = linesOf(pic);
    return (L.v ? 1 : 0) + (L.h ? 1 : 0);
  }

  /* ------------------------------------------------------------------ *
   * Question screens
   * ------------------------------------------------------------------ */
  var CHOICE_LABEL = {
    v: '<span class="mlf-ico">│</span> Vertical<br><small>up and down</small>',
    h: '<span class="mlf-ico">―</span> Horizontal<br><small>side to side</small>',
    none: '<span class="mlf-ico">✗</span> No line<br><small>no fold works</small>',
  };
  var WORD = { v: 'up-down (vertical)', h: 'side-to-side (horizontal)' };

  function picQuestion(stage, api, q) {
    api.say('Imagine folding the ' + q.pic.name + '. Which line makes the halves match?', 'think');
    stage.appendChild(MQ.ui.prompt('Where is the mirror line on the <b>' + q.pic.name + '</b>?'));
    var holder = el('div', { class: 'mlf-hold' }, el('div', { class: 'mlf-card mlf-card-big' }, picSvg(q.pic, 300)));
    stage.appendChild(holder);
    var ch = MQ.ui.choices(
      ['v', 'h', 'none'].map(function (k) {
        return { label: CHOICE_LABEL[k], value: k };
      }),
      function (v) {
        var ans = q.answer;
        if (v === ans) {
          ch.mark(v, 'good');
          ch.disable();
          api.check(true, ans === 'none' ? 'Yes! No fold works. ' + q.pic.why : 'Yes! ' + q.pic.why);
          showBothFolds(holder, q.pic, api, 230);
          return;
        }
        ch.mark(v, 'bad');
        var strong = api.tries() >= 1;
        var hint, tag;
        if (ans === 'none') {
          hint = strong ? q.pic.why + ' So no line works.' : 'Fold it in your head on that line. Would every part land on a matching part?';
          tag = 'Saw a line where the halves do not match';
        } else if (v === 'none') {
          hint = strong ? 'Try the ' + WORD[ans] + ' line. ' + q.pic.why : 'Look again! There is a way to fold it so both halves match.';
          tag = 'Missed a line of symmetry';
        } else if (ans === 'v') {
          hint = strong ? 'A vertical line goes up and down. ' + q.pic.why : 'Fold the top onto the bottom: do they match? Now look at the left side and the right side.';
          tag = 'Mixed up vertical and horizontal';
        } else {
          hint = strong ? 'A horizontal line goes side to side, like the horizon. ' + q.pic.why : 'Fold the left onto the right: does the ' + q.pic.name + ' point the same way on both sides? Try the top and the bottom.';
          tag = 'Mixed up vertical and horizontal';
        }
        api.check(false, hint, tag);
      },
      { columns: 3 }
    );
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(q.answer, 'good');
      ch.disable();
      showBothFolds(holder, q.pic, api, 230);
      api.feedback((q.answer === 'none' ? 'No line. ' : 'The ' + WORD[q.answer] + ' line. ') + q.pic.why, 'info');
    });
  }

  function countQuestion(stage, api, q) {
    var isFlag = /flag/.test(q.pic.name);
    api.say(q.hard ? 'Be careful! Check every part, and the colours too.' : 'Fold it up-down, then side-to-side. How many folds work?', 'think');
    stage.appendChild(MQ.ui.prompt('How many mirror lines going <b>up-down</b> or <b>side-to-side</b> does this ' + q.pic.name + ' have?'));
    var holder = el('div', { class: 'mlf-hold' }, el('div', { class: 'mlf-card mlf-card-big' }, picSvg(q.pic, 320)));
    stage.appendChild(holder);
    var ch = MQ.ui.choices(
      [0, 1, 2].map(function (n) {
        return { label: String(n), value: n };
      }),
      function (v) {
        if (v === q.count) {
          ch.mark(v, 'good');
          ch.disable();
          api.check(true, 'Yes! ' + q.pic.why);
          showBothFolds(holder, q.pic, api, 230);
          return;
        }
        ch.mark(v, 'bad');
        var strong = api.tries() >= 1;
        if (v > q.count) {
          var t = TRAP[q.pic.trap] || TRAP.generic;
          api.check(false, strong ? q.pic.why : t.hint, t.tag);
        } else {
          api.check(false, strong ? q.pic.why : 'There are more! Try folding up-down AND side-to-side' + (isFlag ? ' across the whole flag.' : '.'), 'Missed a line of symmetry');
        }
      },
      { columns: 3 }
    );
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(q.count, 'good');
      ch.disable();
      showBothFolds(holder, q.pic, api, 230);
      api.feedback(q.pic.why, 'info');
    });
  }

  // Level 2: drag the up-down or side-to-side dashed line onto a shape, or say "No line".
  function dragQuestion(stage, api, q) {
    var pic = q.pic;
    var lines = q.lines;
    var hasAny = lines.v || lines.h;
    var b = picBox(pic);
    var cx = (b.x1 + b.x2) / 2, cy = (b.y1 + b.y2) / 2;
    api.say('Drag a dashed line onto the ' + pic.name + ' where it would fold into matching halves. If no line works, press No line.', 'think');
    stage.appendChild(MQ.ui.prompt('Put a mirror line on the <b>' + pic.name + '</b>, or press <b>No line</b>.'));

    var VX0 = -205, HY0 = 158;
    var st = { vx: VX0, hy: HY0, locked: false };
    var root = svg('svg', { viewBox: '-230 -168 460 350', width: 460, class: 'mlf-svg mlf-drag', style: { maxWidth: '100%', height: 'auto' } });
    root.appendChild(svg('rect', { x: -230, y: -168, width: 460, height: 350, rx: 14, fill: '#ffffff' }));
    root.appendChild(drawPic(pic));
    var good = svg('g', { class: 'mlf-goodlines' });
    root.appendChild(good);

    function handle(isV) {
      var g = svg('g', { class: 'mlf-handle ' + (isV ? 'mlf-hv' : 'mlf-hh') });
      if (isV) {
        g.appendChild(svg('line', { x1: 0, y1: -150, x2: 0, y2: 140, class: 'mlf-hit' }));
        g.appendChild(svg('line', { x1: 0, y1: -140, x2: 0, y2: 140, class: 'mlf-dline' }));
        g.appendChild(svg('circle', { cx: 0, cy: -146, r: 16, class: 'mlf-knob' }));
        g.appendChild(svg('text', { x: 0, y: -140, 'text-anchor': 'middle', class: 'mlf-knob-t' }, '↔'));
      } else {
        g.appendChild(svg('line', { x1: -190, y1: 0, x2: 200, y2: 0, class: 'mlf-hit' }));
        g.appendChild(svg('line', { x1: -190, y1: 0, x2: 190, y2: 0, class: 'mlf-dline' }));
        g.appendChild(svg('circle', { cx: 206, cy: 0, r: 16, class: 'mlf-knob' }));
        g.appendChild(svg('text', { x: 206, y: 6, 'text-anchor': 'middle', class: 'mlf-knob-t' }, '↕'));
      }
      root.appendChild(g);
      return g;
    }
    var hv = handle(true), hh = handle(false);
    function onV(x) {
      return x > b.x1 + 3 && x < b.x2 - 3;
    }
    function onH(y) {
      return y > b.y1 + 3 && y < b.y2 - 3;
    }
    function draw() {
      hv.setAttribute('transform', 'translate(' + st.vx + ',0)');
      hh.setAttribute('transform', 'translate(0,' + st.hy + ')');
      hv.classList.toggle('mlf-placed', onV(st.vx));
      hh.classList.toggle('mlf-placed', onH(st.hy));
    }
    function snap(v, c, inside, park) {
      if (!inside) return park;
      if (Math.abs(v - c) <= 14) return c;
      return Math.round(v / 10) * 10;
    }
    api.cleanup(
      MQ.ui.drag(root, hv, {
        move: function (p) {
          if (st.locked) return;
          st.vx = U.clamp(p.x, -215, 215);
          draw();
        },
        end: function () {
          if (st.locked) return;
          st.vx = snap(st.vx, cx, onV(st.vx), VX0);
          draw();
          api.sound('pop');
        },
      })
    );
    api.cleanup(
      MQ.ui.drag(root, hh, {
        move: function (p) {
          if (st.locked) return;
          st.hy = U.clamp(p.y, -150, 165);
          draw();
        },
        end: function () {
          if (st.locked) return;
          st.hy = snap(st.hy, cy, onH(st.hy), HY0);
          draw();
          api.sound('pop');
        },
      })
    );
    draw();
    var holder = el('div', { class: 'mlf-hold' }, el('div', { class: 'mlf-card mlf-card-drag' }, root, el('div', { class: 'mlf-help' }, 'Drag the ↔ or ↕ handle to move a dashed line.')));
    stage.appendChild(holder);

    function showGood() {
      MQ.clear(good);
      if (lines.v) good.appendChild(lineEls(vLine(cx), b, 'mlf-linegrp mlf-good'));
      if (lines.h) good.appendChild(lineEls(hLine(cy), b, 'mlf-linegrp mlf-good'));
    }
    function finish() {
      st.locked = true;
      hv.style.display = 'none';
      hh.style.display = 'none';
      checkBtn.disabled = true;
      noneBtn.disabled = true;
      showGood();
    }
    var checkBtn = el('button', { class: 'btn mlf-act', type: 'button' }, '✔ Check my line');
    var noneBtn = el('button', { class: 'btn mlf-act mlf-none', type: 'button' }, '✗ No line');
    stage.appendChild(el('div', { class: 'mlf-btnrow' }, checkBtn, noneBtn));

    checkBtn.addEventListener('click', function () {
      if (st.locked) return;
      var placed = [];
      if (onV(st.vx)) placed.push({ ax: 'v', L: vLine(st.vx), off: Math.abs(st.vx - cx) > 0.5 });
      if (onH(st.hy)) placed.push({ ax: 'h', L: hLine(st.hy), off: Math.abs(st.hy - cy) > 0.5 });
      if (!placed.length) {
        api.feedback('Drag a dashed line onto the ' + pic.name + ' first, or press No line.', 'info');
        return;
      }
      var bad = placed.filter(function (p) {
        return !isSym(pic, p.L);
      })[0];
      var strong = api.tries() >= 1;
      if (!bad) {
        var extra = '';
        if (pic.key === 'circle') extra = ' A circle has lots of mirror lines: any line through the middle works!';
        else if (pic.key === 'plus' && placed.length === 1) extra = ' The plus has other mirror lines too, even slanted ones! Look at the green lines.';
        else if (lines.v && lines.h && placed.length === 1) extra = ' This shape has another mirror line too. Look at the green lines.';
        api.check(true, 'Yes! Both halves match.' + extra);
        finish();
        return;
      }
      var other = bad.ax === 'v' ? 'h' : 'v';
      if (lines[bad.ax]) {
        api.check(false, strong ? 'Put the line exactly through the middle, so both sides are the same size.' : 'Your line is not in the middle. Slide it until both sides are the same size.', 'Mirror line not in the middle');
      } else if (lines[other]) {
        api.check(false, strong ? 'This ' + pic.name + ' needs a ' + WORD[other] + ' line.' : 'Fold it on your line in your head: the halves do not match. Try a line going the other way.', 'Mixed up vertical and horizontal');
      } else if (!bad.off) {
        api.check(false, strong ? pic.why : 'Your line cuts it in half, but are the two halves mirror images? Would they fit exactly on top of each other?', 'Thought any line that halves a shape works');
      } else {
        api.check(false, strong ? pic.why : 'The two sides of your line are not the same. Does any line work?', 'Saw a line where the halves do not match');
      }
    });
    noneBtn.addEventListener('click', function () {
      if (st.locked) return;
      MQ.sound('click');
      if (!hasAny) {
        api.check(true, 'Yes! No line works. ' + pic.why);
        finish();
        showBothFolds(holder, pic, api, 220);
        return;
      }
      var ax = lines.v ? 'v' : 'h';
      api.check(false, api.tries() >= 1 ? 'Try the ' + WORD[ax] + ' line through the middle.' : 'This ' + pic.name + ' does have a mirror line. Try sliding a dashed line onto it.', 'Missed a line of symmetry');
    });
    api.onReveal(function () {
      finish();
      showBothFolds(holder, pic, api, 220);
      api.feedback(pic.why, 'info');
    });
  }

  // Level 3: several pictures with a dashed line each; click every one that matches its line.
  function multiQuestion(stage, api, q) {
    var letters = ['A', 'B', 'C'];
    var what = q.what;
    if (what === 'Logo') {
      api.say('All these logos are squares on the outside. But look at the design inside!', 'think');
      stage.appendChild(MQ.ui.prompt('Which logos are symmetrical about <b>their dashed line</b>? Click every one.'));
    } else {
      api.say('Look at where each dashed line is. Would the picture fold into matching halves on THAT line?', 'think');
      stage.appendChild(MQ.ui.prompt('Which pictures are symmetrical about <b>their dashed line</b>? Click every one.'));
    }
    var sel = q.cards.map(function () {
      return false;
    });
    var locked = false;
    var cards = q.cards.map(function (c, i) {
      var fc = foldCard(c.pic, c.line, api, { width: 210, caption: what + ' <b>' + letters[i] + '</b>' });
      fc.el.classList.add('mlf-pick');
      fc.el.setAttribute('role', 'button');
      fc.el.setAttribute('tabindex', '0');
      function toggle() {
        if (locked) return;
        sel[i] = !sel[i];
        fc.el.classList.toggle('mlf-sel', sel[i]);
        MQ.sound('click');
      }
      fc.el.addEventListener('click', toggle);
      fc.el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
      return fc;
    });
    stage.appendChild(
      el(
        'div',
        { class: 'mlf-trio' },
        cards.map(function (c) {
          return c.el;
        })
      )
    );
    var checkBtn = el('button', { class: 'btn mlf-act', type: 'button' }, '✔ Check');
    stage.appendChild(el('div', { class: 'mlf-btnrow' }, checkBtn));

    function foldAll() {
      locked = true;
      checkBtn.disabled = true;
      cards.forEach(function (c, i) {
        c.el.classList.remove('mlf-sel');
        c.el.classList.add(q.cards[i].ok ? 'mlf-yes' : 'mlf-no');
        api.later(function () {
          c.fold();
        }, 200 + i * 450);
      });
    }
    function hintFor(c, i, strong) {
      var name = what + ' ' + letters[i];
      if (c.kind === 'wrongPlace') {
        var unit = c.meta.rows ? 'rows' : 'columns';
        return {
          hint: strong ? name + ': the line has ' + c.meta.a + ' ' + unit + ' on one side and ' + c.meta.b + ' on the other. The halves are not the same.' : name + ': is the dashed line really in the middle? Count the squares on each side of it.',
          tag: 'Did not check where the line is',
        };
      }
      if (c.kind === 'wrongDir') {
        var ax = axisOf(c.line);
        return {
          hint: strong ? name + ' would match on a ' + (ax === 'h' ? 'vertical' : 'horizontal') + ' line, but its dashed line goes ' + (ax === 'h' ? 'side to side' : 'up and down') + '.' : name + ': fold it on its dashed line. Does one half land exactly on the other?',
          tag: 'Mixed up vertical and horizontal',
        };
      }
      if (c.kind === 'notSym') {
        return { hint: strong ? name + ': some coloured squares have no partner on the other side of the line.' : name + ': look for squares that have no matching square across the line.', tag: 'Saw a line where the halves do not match' };
      }
      if (c.kind === 'outline') {
        return { hint: strong ? 'The outside of ' + name + ' is a square, but the design inside does not match across the line.' : name + ' has a square outside, but look at the design inside. Does it match on both sides of the line?', tag: 'Thought a square outline is enough' };
      }
      return { hint: strong ? name + ': every part has a matching part across the line. Click it too.' : name + ' does match its line! Fold it in your head and check.', tag: 'Missed a line of symmetry' };
    }
    checkBtn.addEventListener('click', function () {
      if (locked) return;
      if (!sel.some(Boolean)) {
        api.feedback('Click the ' + what.toLowerCase() + 's that match their line, then press Check.', 'info');
        return;
      }
      var wrong = -1;
      q.cards.forEach(function (c, i) {
        if (wrong === -1 && sel[i] && !c.ok) wrong = i;
      });
      if (wrong === -1) {
        q.cards.forEach(function (c, i) {
          if (wrong === -1 && !sel[i] && c.ok) wrong = i;
        });
      }
      if (wrong === -1) {
        api.check(true, 'Yes! Watch them fold.');
        foldAll();
        return;
      }
      var h = hintFor(q.cards[wrong], wrong, api.tries() >= 1);
      api.check(false, h.hint, h.tag);
    });
    api.onReveal(function () {
      foldAll();
      var yes = [];
      q.cards.forEach(function (c, i) {
        if (c.ok) yes.push(letters[i]);
      });
      api.feedback('Matching: ' + yes.join(' and ') + '. Green ones fold into matching halves; red outlines show parts with no partner.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Register
   * ------------------------------------------------------------------ */
  var deck = null;

  MQ.register('mirror-line-finder', {
    learn: [
      function (stage, api) {
        api.say('This dashed line goes up and down. Press Fold it and watch!');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('A vertical mirror line', 'A <b>vertical</b> line goes <b>up and down</b> │. Let\'s fold the house on it.'));
        var fc = foldCard(HOUSE, vLine(0), api, {
          width: 330,
          button: true,
          onFolded: function () {
            api.say('Both halves match! So this is a <b>line of symmetry</b>. We also call it a <b>mirror line</b>.', 'cheer');
            api.feedback('The two halves sit exactly on top of each other.', 'good');
            api.unlockNext();
          },
        });
        stage.appendChild(fc.el);
      },
      function (stage, api) {
        api.say('Which fold makes the two halves of the sign match? Try both!');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('A horizontal mirror line', 'A <b>horizontal</b> line goes <b>side to side</b> ―, like the horizon.'));
        var a = foldCard(SIGN, vLine(0), api, {
          width: 260,
          button: true,
          caption: '<b>Vertical</b> (up and down)',
          onFolded: function () {
            api.say('The arrow point is only on one side, so this fold does not match.', 'oops');
          },
        });
        var b = foldCard(SIGN, hLine(0), api, {
          width: 260,
          button: true,
          caption: '<b>Horizontal</b> (side to side)',
          onFolded: function () {
            api.say('The top half matches the bottom half! The sign has a horizontal mirror line.', 'cheer');
            api.feedback('Only the side-to-side fold works for this sign.', 'good');
            api.unlockNext();
          },
        });
        stage.appendChild(el('div', { class: 'mlf-row' }, a.el, b.el));
      },
      function (stage, api) {
        api.say('This slanted line cuts the rectangle in half. Fold it. Do the halves match?');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Half is not enough', 'Two halves must fit <b>exactly</b> on top of each other.'));
        var done = 0;
        var b = foldCard(PLAIN_RECT, vLine(0), api, {
          width: 250,
          button: true,
          caption: 'Up-down line',
          onFolded: function () {
            if (done) api.say('That fold matches! Up-down is a mirror line for the rectangle.', 'cheer');
          },
        });
        var a = foldCard(PLAIN_RECT, { x1: -110, y1: 65, x2: 110, y2: -65 }, api, {
          width: 250,
          button: true,
          caption: 'Slanted line',
          onFolded: function () {
            done = 1;
            api.say('The corners stick out! Two halves, but not mirror images. Now fold on the up-down line.', 'oops');
            api.feedback('Cutting in half is not enough. The halves must be mirror images.', 'info');
            api.unlockNext();
          },
        });
        stage.appendChild(el('div', { class: 'mlf-row' }, a.el, b.el));
      },
    ],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'pic') return picQuestion(stage, api, q);
        if (q.type === 'drag') return dragQuestion(stage, api, q);
        if (q.type === 'count') return countQuestion(stage, api, q);
        return multiQuestion(stage, api, q);
      },
    },
  });

  // Hooks for automated tests only (not used by the page).
  MQ.activities['mirror-line-finder']._test = {
    buildDeck: buildDeck,
    deck: function () {
      return deck;
    },
    pools: { EVERYDAY: EVERYDAY, SHAPES: SHAPES, FLAGS_EASY: FLAGS_EASY, COUNT_HARD: COUNT_HARD, LOGOS_YES: LOGOS_YES, LOGOS_NO: LOGOS_NO, HOUSE: HOUSE, SIGN: SIGN },
  };

  var css = [
    '.mlf-row{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;width:100%}',
    '.mlf-hold{display:flex;justify-content:center;width:100%}',
    '.mlf-card{background:#fff;border:3px solid var(--line);border-radius:16px;padding:10px 12px;display:flex;flex-direction:column;align-items:center;gap:6px;max-width:100%;box-sizing:border-box}',
    '.mlf-card-big{padding:14px 18px}',
    '.mlf-svg{display:block;max-width:100%;height:auto}',
    '.mlf-cap{font-weight:800;font-size:1.05rem}',
    '.mlf-badge{font-weight:800;min-height:1.4em;font-size:1rem}',
    '.mlf-badge-good{color:var(--good)}',
    '.mlf-badge-bad{color:var(--try)}',
    '.mlf-line{stroke:#1b2a4a;stroke-width:4;stroke-dasharray:11 7;stroke-linecap:round;fill:none}',
    '.mlf-line-under{stroke:#fff;stroke-width:8;stroke-linecap:round;opacity:.85}',
    '.mlf-good .mlf-line{stroke:#1f9d6b;stroke-width:5}',
    '.mlf-miss{display:none;fill:none;stroke:#d62828;stroke-width:5;stroke-dasharray:7 5}',
    '.mlf-showmiss .mlf-miss{display:inline}',
    '.mlf-foldbtn{min-width:150px}',
    '.mlf-ico{font-weight:900;color:#0b6e66;font-size:1.3rem}',
    '.choice small{font-weight:700;color:var(--ink-soft);font-size:.85rem}',
    '.mlf-btnrow{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}',
    '.mlf-act{font-size:1.15rem;min-height:54px;padding:10px 22px}',
    '.mlf-none{background:#fff;color:var(--ink);border:3px solid var(--line)}',
    '.mlf-card-drag{padding:8px}',
    '.mlf-help{color:var(--ink-soft);font-size:.95rem;font-weight:700}',
    '.mlf-hit{stroke:transparent;stroke-width:34;cursor:grab}',
    '.mlf-dline{stroke-width:5;stroke-dasharray:12 8;stroke-linecap:round}',
    '.mlf-hv .mlf-dline,.mlf-hv .mlf-knob{stroke:#2a7de1}',
    '.mlf-hh .mlf-dline,.mlf-hh .mlf-knob{stroke:#e85d04}',
    '.mlf-knob{fill:#fff;stroke-width:4;cursor:grab}',
    '.mlf-hv .mlf-knob-t{fill:#2a7de1}',
    '.mlf-hh .mlf-knob-t{fill:#e85d04}',
    '.mlf-knob-t{font-size:20px;font-weight:900;pointer-events:none}',
    '.mlf-handle.dragging .mlf-knob{fill:#fff3bf}',
    '.mlf-placed .mlf-dline{stroke-width:6}',
    '.mlf-trio{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;width:100%;max-width:760px}',
    '.mlf-pick{cursor:pointer;position:relative;transition:transform .08s ease,border-color .1s ease}',
    '.mlf-pick:hover{border-color:var(--accent);transform:translateY(-2px)}',
    '.mlf-pick.mlf-sel{border-color:#2a7de1;background:#eaf2ff;box-shadow:0 0 0 3px #2a7de1 inset}',
    '.mlf-pick.mlf-sel::after{content:"✓";position:absolute;top:6px;right:10px;font-weight:900;font-size:1.4rem;color:#2a7de1}',
    '.mlf-pick.mlf-yes{border-color:var(--good);background:var(--good-bg)}',
    '.mlf-pick.mlf-no{border-color:var(--try)}',
    '@media (max-width:640px){.mlf-trio{grid-template-columns:1fr 1fr}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'mirror-line-finder' }, css));
})();

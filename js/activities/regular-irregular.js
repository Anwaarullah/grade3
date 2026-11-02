/* Shape Sorter — regular or irregular? Check ALL sides and ALL angles (Unit 6.2). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  /* ------------------------------------------------------------------ *
   * Geometry (points are [x, y], y goes down)
   * ------------------------------------------------------------------ */
  function d2(a, b) {
    return (b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]);
  }
  function dist(a, b) {
    return Math.sqrt(d2(a, b));
  }
  function signedArea(pts) {
    var s = 0;
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      var q = pts[(i + 1) % pts.length];
      s += p[0] * q[1] - q[0] * p[1];
    }
    return s / 2;
  }
  function regularPolygon(n, startDeg) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var a = ((startDeg + (360 * i) / n) * Math.PI) / 180;
      pts.push([Math.cos(a), Math.sin(a)]);
    }
    return pts;
  }
  function rotate(pts, deg) {
    var a = (deg * Math.PI) / 180;
    var c = Math.cos(a);
    var s = Math.sin(a);
    return pts.map(function (p) {
      return [p[0] * c - p[1] * s, p[0] * s + p[1] * c];
    });
  }
  // Interior angle (degrees) at every corner.
  function angles(pts) {
    var A = signedArea(pts);
    return pts.map(function (v, i) {
      var p = pts[(i - 1 + pts.length) % pts.length];
      var n = pts[(i + 1) % pts.length];
      var ux = p[0] - v[0], uy = p[1] - v[1];
      var wx = n[0] - v[0], wy = n[1] - v[1];
      var cos = (ux * wx + uy * wy) / (Math.sqrt(ux * ux + uy * uy) * Math.sqrt(wx * wx + wy * wy));
      var phi = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
      var cross = (v[0] - p[0]) * (n[1] - v[1]) - (v[1] - p[1]) * (n[0] - v[0]);
      var convex = cross * A > 0;
      return convex ? phi : 360 - phi;
    });
  }
  function sides(pts) {
    return pts.map(function (p, i) {
      return dist(p, pts[(i + 1) % pts.length]);
    });
  }
  function allSame(arr, tol) {
    return arr.every(function (v) {
      return Math.abs(v - arr[0]) < tol;
    });
  }
  // Group equal values: returns an array giving a group number (1, 2, 3 …) for values
  // that appear at least twice, or 0 for values that are unique.
  function groups(arr, tol) {
    var ids = arr.map(function () {
      return 0;
    });
    var next = 1;
    arr.forEach(function (v, i) {
      if (ids[i]) return;
      var same = [];
      arr.forEach(function (w, j) {
        if (Math.abs(v - w) < tol) same.push(j);
      });
      if (same.length > 1) {
        same.forEach(function (j) {
          ids[j] = next;
        });
        next++;
      }
    });
    return ids;
  }

  /* ------------------------------------------------------------------ *
   * Shape bank (unit-sized outlines, roughly centred on 0,0)
   * ------------------------------------------------------------------ */
  var BANK = {
    equilateral: { name: 'regular triangle', sides: 3, pts: function () { return regularPolygon(3, -90); }, regular: true, why: 'All 3 sides are equal and all 3 angles are equal.' },
    isosceles: { name: 'isosceles triangle', sides: 3, pts: function () { return [[0, -1.25], [0.62, 1], [-0.62, 1]]; }, why: 'Two sides are equal, but the bottom side is shorter, and the angles are not all the same.' },
    rightTri: { name: 'right-angled triangle', sides: 3, pts: function () { return [[-1, 0.8], [1.1, 0.8], [-1, -0.8]]; }, why: 'The sides are all different lengths, and only one angle is a right angle.' },
    square: { name: 'square', sides: 4, pts: function () { return [[-0.9, -0.9], [0.9, -0.9], [0.9, 0.9], [-0.9, 0.9]]; }, regular: true, why: 'All 4 sides are equal and all 4 angles are right angles.' },
    tiltedSquare: { name: 'turned square', sides: 4, pts: function () { return rotate([[-0.9, -0.9], [0.9, -0.9], [0.9, 0.9], [-0.9, 0.9]], U.pick([20, 25, 30, 35, 55, 60, 65, 70])); }, regular: true, fixedTurn: true, why: 'It is a square that has been turned. All 4 sides are still equal and all 4 angles are still right angles.' },
    rectangle: { name: 'rectangle', sides: 4, pts: function () { return [[-1.35, -0.7], [1.35, -0.7], [1.35, 0.7], [-1.35, 0.7]]; }, why: 'All 4 angles are right angles, but the long sides and the short sides are different.' },
    rhombus: { name: 'rhombus', sides: 4, pts: function () { return [[0, -1.15], [0.68, 0], [0, 1.15], [-0.68, 0]]; }, why: 'All 4 sides are equal, but two angles are pointy and two are wide.' },
    parallelogram: { name: 'parallelogram', sides: 4, pts: function () { return [[-1.25, 0.65], [0.55, 0.65], [1.25, -0.65], [-0.55, -0.65]]; }, why: 'The long sides and the short sides are different, and the angles are not all the same.' },
    trapezium: { name: 'trapezium', sides: 4, pts: function () { return [[-1.3, 0.7], [1.3, 0.7], [0.65, -0.7], [-0.65, -0.7]]; }, why: 'The top is shorter than the bottom, and the angles are not all the same.' },
    kite: { name: 'kite', sides: 4, pts: function () { return [[0, -1.05], [0.8, -0.35], [0, 1.25], [-0.8, -0.35]]; }, why: 'Two short sides and two long sides, and the angles are not all the same.' },
    arrowhead: { name: 'arrowhead', sides: 4, pts: function () { return [[0, -1.2], [1, 1], [0, 0.3], [-1, 1]]; }, why: 'It dents inwards. The sides and the angles are not all the same.' },
    pentagon: { name: 'regular pentagon', sides: 5, pts: function () { return regularPolygon(5, -90); }, regular: true, why: 'All 5 sides are equal and all 5 angles are equal.' },
    irrPentagon: { name: 'pentagon', sides: 5, pts: function () { return [[-1, 1], [1, 1], [1, -0.2], [0, -1.1], [-1, -0.2]]; }, why: 'It has 5 sides, but they are not all the same length, and the angles are different.' },
    hexagon: { name: 'regular hexagon', sides: 6, pts: function () { return regularPolygon(6, 0); }, regular: true, why: 'All 6 sides are equal and all 6 angles are equal.' },
    irrHexagon: { name: 'hexagon', sides: 6, pts: function () { return [[-1.4, 0], [-0.7, -0.8], [0.7, -0.8], [1.4, 0], [0.7, 0.8], [-0.7, 0.8]]; }, why: 'It has 6 sides, but the top and bottom are longer than the slanted sides.' },
    octagon: { name: 'regular octagon', sides: 8, pts: function () { return regularPolygon(8, 22.5); }, regular: true, why: 'All 8 sides are equal and all 8 angles are equal.' },
    irrOctagon: { name: 'octagon', sides: 8, pts: function () { return [[-1.3, -0.5], [-0.9, -0.9], [0.9, -0.9], [1.3, -0.5], [1.3, 0.5], [0.9, 0.9], [-0.9, 0.9], [-1.3, 0.5]]; }, why: 'Its angles all match, but the sides are long, middle and short, so they are not all equal.' },
  };
  var POLY_NAMES = { 3: 'triangle', 4: 'quadrilateral', 5: 'pentagon', 6: 'hexagon', 8: 'octagon' };

  /* ------------------------------------------------------------------ *
   * Drawing a shape with optional side ticks and angle markers
   * ------------------------------------------------------------------ */
  // pts are in any units; size = px for the bounding box of the drawing
  function drawShape(pts, opts) {
    opts = opts || {};
    var size = opts.size || 260;
    var pad = opts.pad == null ? 26 : opts.pad;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(function (p) {
      minX = Math.min(minX, p[0]);
      minY = Math.min(minY, p[1]);
      maxX = Math.max(maxX, p[0]);
      maxY = Math.max(maxY, p[1]);
    });
    var s = (size - pad * 2) / Math.max(maxX - minX, maxY - minY);
    var offX = pad + (size - pad * 2 - (maxX - minX) * s) / 2;
    var offY = pad + (size - pad * 2 - (maxY - minY) * s) / 2;
    var P = pts.map(function (p) {
      return [offX + (p[0] - minX) * s, offY + (p[1] - minY) * s];
    });
    var root = svg('svg', { viewBox: '0 0 ' + size + ' ' + size, width: opts.width || size, height: opts.width || size, class: 'ri-svg', style: { maxWidth: '100%', height: 'auto' } });
    root.appendChild(svg('polygon', { points: P.map(function (p) { return p.join(','); }).join(' '), class: 'ri-poly' }));
    var marks = svg('g', { class: 'ri-marks' });
    root.appendChild(marks);
    var obj = { svg: root, P: P, marks: marks, shown: false };
    obj.show = function () {
      MQ.clear(marks);
      addMarks(marks, P, opts.markScale || 1);
      obj.shown = true;
    };
    obj.hide = function () {
      MQ.clear(marks);
      obj.shown = false;
    };
    obj.toggle = function () {
      if (obj.shown) obj.hide();
      else obj.show();
    };
    obj.numberSides = function () {
      MQ.clear(marks);
      var A = signedArea(P);
      P.forEach(function (a, i) {
        var b = P[(i + 1) % P.length];
        var dx = b[0] - a[0], dy = b[1] - a[1];
        var L = Math.sqrt(dx * dx + dy * dy);
        var n = A > 0 ? [dy / L, -dx / L] : [-dy / L, dx / L];
        var mx = (a[0] + b[0]) / 2 + n[0] * 16;
        var my = (a[1] + b[1]) / 2 + n[1] * 16;
        marks.appendChild(svg('circle', { cx: mx, cy: my, r: 13, class: 'ri-num-bg' }));
        marks.appendChild(svg('text', { x: mx, y: my + 5, 'text-anchor': 'middle', class: 'ri-num' }, String(i + 1)));
      });
    };
    if (opts.marks) obj.show();
    return obj;
  }

  var MARK_COLORS = ['#e85d04', '#2a7de1', '#1f9d6b'];

  function addMarks(g, P, k) {
    var A = signedArea(P);
    var L = sides(P);
    var ang = angles(P);
    var sg = groups(L, 0.5);
    var ag = groups(ang, 0.5);
    var avg = L.reduce(function (s, v) { return s + v; }, 0) / L.length;
    // side ticks: group 1 = one tick, group 2 = two ticks …
    P.forEach(function (a, i) {
      if (!sg[i]) return;
      var b = P[(i + 1) % P.length];
      var dx = b[0] - a[0], dy = b[1] - a[1];
      var len = Math.sqrt(dx * dx + dy * dy);
      var ux = dx / len, uy = dy / len;
      var nx = -uy, ny = ux;
      var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      var count = sg[i];
      var col = MARK_COLORS[(sg[i] - 1) % 3];
      for (var t = 0; t < count; t++) {
        var off = (t - (count - 1) / 2) * 7;
        var cx = mx + ux * off, cy = my + uy * off;
        g.appendChild(svg('line', { x1: cx - nx * 9 * k, y1: cy - ny * 9 * k, x2: cx + nx * 9 * k, y2: cy + ny * 9 * k, class: 'ri-tick', style: { stroke: col } }));
      }
    });
    // angle markers
    var r = Math.min(26, avg * 0.22) * k;
    P.forEach(function (v, i) {
      var p = P[(i - 1 + P.length) % P.length];
      var n = P[(i + 1) % P.length];
      var u = [p[0] - v[0], p[1] - v[1]];
      var w = [n[0] - v[0], n[1] - v[1]];
      var lu = Math.sqrt(u[0] * u[0] + u[1] * u[1]);
      var lw = Math.sqrt(w[0] * w[0] + w[1] * w[1]);
      u = [u[0] / lu, u[1] / lu];
      w = [w[0] / lw, w[1] / lw];
      var th = ang[i];
      var col = ag[i] ? MARK_COLORS[(ag[i] - 1) % 3] : '#8a94ad';
      if (Math.abs(th - 90) < 0.5) {
        var q = r * 0.7;
        var c1 = [v[0] + u[0] * q, v[1] + u[1] * q];
        var c2 = [v[0] + (u[0] + w[0]) * q, v[1] + (u[1] + w[1]) * q];
        var c3 = [v[0] + w[0] * q, v[1] + w[1] * q];
        g.appendChild(svg('polyline', { points: [c1, c2, c3].map(function (c) { return c.join(','); }).join(' '), class: 'ri-arc', style: { stroke: col } }));
        return;
      }
      // sweep direction: rotate u by +th; if it lands on w, sweep = 1
      var rad = (th * Math.PI) / 180;
      var ru = [u[0] * Math.cos(rad) - u[1] * Math.sin(rad), u[0] * Math.sin(rad) + u[1] * Math.cos(rad)];
      var sweep = Math.abs(ru[0] - w[0]) + Math.abs(ru[1] - w[1]) < 0.05 ? 1 : 0;
      var large = th > 180 ? 1 : 0;
      var count = ag[i] ? Math.min(ag[i], 3) : 1;
      for (var t = 0; t < count; t++) {
        var rr = r + t * 5;
        var s1 = [v[0] + u[0] * rr, v[1] + u[1] * rr];
        var s2 = [v[0] + w[0] * rr, v[1] + w[1] * rr];
        g.appendChild(svg('path', { d: 'M' + s1.join(',') + ' A' + rr + ',' + rr + ' 0 ' + large + ' ' + sweep + ' ' + s2.join(','), class: 'ri-arc', style: { stroke: col } }));
      }
    });
    void A;
  }

  /* ------------------------------------------------------------------ *
   * Practice deck
   * ------------------------------------------------------------------ */
  function makeQ(key, type) {
    var b = BANK[key];
    var pts = b.pts();
    var turned = false;
    if (key !== 'square' && !b.fixedTurn && Math.random() < 0.5) {
      pts = rotate(pts, U.rand(15, 345));
      turned = true;
    }
    if (b.fixedTurn) turned = true;
    return { key: key, type: type || 'ri', pts: pts, turned: turned };
  }

  var deck = null;
  function buildDeck() {
    var regs = U.shuffle(['equilateral', 'square', 'pentagon', 'hexagon', 'octagon']);
    var irrs = U.shuffle(['isosceles', 'rightTri', 'parallelogram', 'trapezium', 'kite', 'irrPentagon', 'irrHexagon', 'irrOctagon']);
    // Level 1 (questions 1-4): plain shapes
    var l1 = U.shuffle([regs[0], regs[1], irrs[0], irrs[1]]).map(function (k) { return makeQ(k); });
    // Level 2 (5-7): the tricky rectangle and rhombus, plus a regular shape
    var l2 = U.shuffle(['rectangle', 'rhombus', regs[2]]).map(function (k) { return makeQ(k); });
    // Level 3 (8-10): the turned square, another irregular shape, and a naming question
    var nameKey = U.pick(['arrowhead', irrs[3], irrs[4]].filter(function (k) { return BANK[k].sides !== 3; }).concat(['arrowhead']));
    var l3 = U.shuffle([makeQ('tiltedSquare'), makeQ(irrs[2])]);
    l3.splice(U.rand(1, 2), 0, makeQ(nameKey, 'name'));
    return l1.concat(l2, l3);
  }

  function regularHint(q, b) {
    // child said "Irregular" for a regular shape
    if (q.key === 'tiltedSquare') return { hint: 'Turn your head — it is still a square! Check the sides and the corners.', tag: 'Did not recognise a turned square' };
    if (q.turned) return { hint: 'This shape has been turned. Turning does not change its sides or angles. Are they all the same?', tag: 'Did not recognise a turned regular shape' };
    return { hint: 'Look again: are all the sides the same length? Are all the corners the same?', tag: 'Called a regular shape irregular' };
  }
  function irregularHint(q, b) {
    // child said "Regular" for an irregular shape
    if (q.key === 'rectangle') return { hint: 'Are ALL the sides the same length?', tag: 'Called a rectangle regular' };
    if (q.key === 'rhombus') return { hint: 'Look at the corners — are they all the same?', tag: 'Called a rhombus regular' };
    var L = sides(q.pts);
    if (allSame(L, 1e-6)) return { hint: 'The sides are equal, but look at the corners — are they all the same?', tag: 'Called an irregular shape regular' };
    if (allSame(angles(q.pts), 1e-6)) return { hint: 'The corners match, but are ALL the sides the same length?', tag: 'Called an irregular shape regular' };
    return { hint: 'Are ALL the sides the same length? Are ALL the corners the same?', tag: 'Called an irregular shape regular' };
  }

  /* ------------------------------------------------------------------ *
   * Styles
   * ------------------------------------------------------------------ */
  var css = [
    '.ri-svg{display:block}',
    '.ri-poly{fill:#e3ecff;stroke:var(--ink);stroke-width:3.5;stroke-linejoin:round}',
    '.ri-tick{stroke-width:3.5;stroke-linecap:round}',
    '.ri-arc{fill:none;stroke-width:3}',
    '.ri-num-bg{fill:#fff3cd;stroke:var(--gold);stroke-width:2}',
    '.ri-num{font-size:15px;font-weight:800;fill:#7a5200}',
    '.ri-rows{display:flex;flex-direction:column;gap:6px;width:100%;align-items:center}',
    '.ri-row-title{font-weight:800;font-size:1.05rem;color:var(--ink-soft)}',
    '.ri-row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.ri-card{background:#fff;border:3px solid var(--line);border-radius:14px;padding:4px 6px 6px;cursor:pointer;text-align:center;font-weight:800;font-size:.9rem;color:var(--ink);font-family:inherit}',
    '.ri-card:hover{border-color:var(--accent)}',
    '.ri-card.ri-on{border-color:var(--gold);background:#fffaf0}',
    '.ri-reg{border-color:#9fd8bf}',
    '.ri-irr{border-color:#f5c5a5}',
    '.ri-tag{display:block;font-size:.8rem}',
    '.ri-reg .ri-tag{color:var(--good)}',
    '.ri-irr .ri-tag{color:var(--try)}',
    '.ri-tricky{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}',
    '.ri-why{font-size:1.1rem;font-weight:700;text-align:center;max-width:620px}',
    '.ri-dots{cursor:crosshair}',
    '.ri-dot{fill:#9aa6c4;pointer-events:none}',
    '.ri-dot-hit{fill:transparent;cursor:pointer}',
    '.ri-dot-hit:hover + .ri-dot,.ri-dot.ri-picked{fill:#e85d04}',
    '.ri-draw-line{stroke:#2a7de1;stroke-width:4;stroke-linecap:round}',
    '.ri-draw-poly{fill:rgba(42,125,225,.15);stroke:#2a7de1;stroke-width:4;stroke-linejoin:round}',
    '.ri-draw-poly.ri-good{fill:rgba(31,157,107,.18);stroke:var(--good)}',
    '.ri-result{font-size:1.15rem;font-weight:800;text-align:center;min-height:30px}',
    '.ri-key{font-size:.95rem;color:var(--ink-soft);font-weight:700}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'regular-irregular' }, css));

  /* ------------------------------------------------------------------ *
   * Activity
   * ------------------------------------------------------------------ */
  MQ.register('regular-irregular', {
    learn: [
      // 1. Regular = all sides equal AND all angles equal
      function (stage, api) {
        api.say('A regular shape has ALL sides equal AND ALL angles equal. Click a shape to show or hide its marks.');
        stage.appendChild(MQ.ui.lesson('Regular or irregular?', 'Same ticks = same length. Same arcs = same angle.'));
        var wrap = el('div', { class: 'ri-rows' });
        function row(title, keys, cls) {
          var r = el('div', { class: 'ri-row' });
          keys.forEach(function (k) {
            var b = BANK[k];
            var d = drawShape(b.pts(), { size: 104, pad: 14, marks: true, markScale: 0.7 });
            var card = el('button', { class: 'ri-card ri-on ' + cls, type: 'button', title: 'Show or hide the marks' }, d.svg, el('span', null, b.name), el('span', { class: 'ri-tag' }, b.regular ? 'Regular' : 'Irregular'));
            card.addEventListener('click', function () {
              d.toggle();
              card.classList.toggle('ri-on', d.shown);
              api.sound('click');
              api.feedback(b.why, b.regular ? 'good' : 'info');
            });
            r.appendChild(card);
          });
          wrap.appendChild(el('div', { class: 'ri-row-title' }, title));
          wrap.appendChild(r);
        }
        row('Regular: all sides equal AND all angles equal', ['equilateral', 'square', 'pentagon', 'hexagon'], 'ri-reg');
        row('Irregular: some sides or angles are different', ['rectangle', 'rightTri', 'irrPentagon'], 'ri-irr');
        stage.appendChild(wrap);
      },

      // 2. Tricky shapes
      function (stage, api) {
        api.lockNext();
        api.say('These three are tricky! Is each one regular or irregular?', 'think');
        stage.appendChild(MQ.ui.lesson('Tricky shapes', 'Check the sides AND the corners.'));
        var items = [
          { key: 'rectangle', pts: BANK.rectangle.pts(), regular: false, why: 'Rectangle: the angles are all equal, but the sides are NOT. So it is irregular.' },
          { key: 'rhombus', pts: BANK.rhombus.pts(), regular: false, why: 'Rhombus: the sides are all equal, but the angles are NOT. So it is irregular.' },
          { key: 'tiltedSquare', pts: rotate(BANK.square.pts(), 30), regular: true, why: 'A turned square is still a square: all sides equal AND all angles equal. Regular!' },
        ];
        var holder = el('div', { class: 'ri-tricky' });
        stage.appendChild(holder);
        var n = 0;
        function show() {
          MQ.clear(holder);
          if (n >= items.length) {
            holder.appendChild(el('div', { class: 'ri-row' }, items.map(function (it) {
              return drawShape(it.pts, { size: 130, pad: 18, marks: true, markScale: 0.8 }).svg;
            })));
            api.say('Regular needs BOTH: all sides equal AND all angles equal.', 'cheer');
            api.feedback('Rectangle: irregular. Rhombus: irregular. Turned square: regular!', 'good');
            api.unlockNext();
            return;
          }
          var it = items[n];
          var d = drawShape(it.pts, { size: 210 });
          holder.appendChild(el('div', { class: 'ri-key' }, 'Shape ' + (n + 1) + ' of 3'));
          holder.appendChild(d.svg);
          var why = el('div', { class: 'ri-why' });
          var ch = MQ.ui.choices([{ label: 'Regular', value: true }, { label: 'Irregular', value: false }], function (v) {
            ch.disable();
            d.show();
            ch.mark(it.regular, 'good');
            if (v === it.regular) {
              api.sound('correct');
              api.say('Yes! ' + (it.regular ? 'Regular.' : 'Irregular.'), 'cheer');
            } else {
              ch.mark(v, 'bad');
              api.sound('wrong');
              api.say('Not this time. Look at the marks.', 'oops');
            }
            why.textContent = it.why;
            var nb = el('button', { class: 'btn', type: 'button' }, n < items.length - 1 ? 'Next shape ▶' : 'See all three ▶');
            nb.addEventListener('click', function () {
              n++;
              show();
            });
            holder.appendChild(nb);
          }, { columns: 2 });
          holder.appendChild(ch);
          holder.appendChild(why);
        }
        show();
      },

      // 3. Draw on dots
      function (stage, api) {
        api.lockNext();
        api.say('Click 4 dots to make a 4-sided shape. Can you make a square? Try a turned one!', 'think');
        stage.appendChild(MQ.ui.lesson('Draw on dots', 'Click 4 dots. The shape closes by itself.'));
        var N = 5;
        var gap = 52;
        var pad = 30;
        var size = pad * 2 + gap * (N - 1);
        var root = svg('svg', { viewBox: '0 0 ' + size + ' ' + size, width: size, height: size, class: 'ri-svg ri-dots', style: { maxWidth: '100%', height: 'auto' } });
        var shapeG = svg('g');
        var marksG = svg('g');
        var dotsG = svg('g');
        root.appendChild(shapeG);
        root.appendChild(marksG);
        root.appendChild(dotsG);
        var picked = [];
        var dotEls = {};
        var result = el('div', { class: 'ri-result' }, ' ');
        var clearBtn = el('button', { class: 'btn btn-ghost', type: 'button' }, '✖ Clear');
        var made = { square: false, tilted: false };
        function pos(c, r) {
          return [pad + c * gap, pad + r * gap];
        }
        function redraw(closed, ok) {
          MQ.clear(shapeG);
          MQ.clear(marksG);
          var P = picked.map(function (q) {
            return pos(q[0], q[1]);
          });
          if (closed) {
            shapeG.appendChild(svg('polygon', { points: P.map(function (p) { return p.join(','); }).join(' '), class: 'ri-draw-poly' + (ok ? ' ri-good' : '') }));
          } else {
            for (var i = 1; i < P.length; i++) shapeG.appendChild(svg('line', { x1: P[i - 1][0], y1: P[i - 1][1], x2: P[i][0], y2: P[i][1], class: 'ri-draw-line' }));
          }
          Object.keys(dotEls).forEach(function (k) {
            dotEls[k].classList.remove('ri-picked');
          });
          picked.forEach(function (q) {
            dotEls[q[0] + ',' + q[1]].classList.add('ri-picked');
          });
          return P;
        }
        function segsCross(a, b, c, d) {
          function orient(p, q, r) {
            var v = (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
            return v > 0 ? 1 : v < 0 ? -1 : 0;
          }
          return orient(a, b, c) * orient(a, b, d) < 0 && orient(c, d, a) * orient(c, d, b) < 0;
        }
        function judge() {
          var p = picked;
          // three corners in a straight line?
          for (var i = 0; i < 4; i++) {
            var a = p[(i + 3) % 4], b = p[i], c = p[(i + 1) % 4];
            if ((b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]) === 0) {
              redraw(true, false);
              result.textContent = 'Three corners are in a straight line, so that is really a triangle. Clear and try again.';
              api.say('Oops, that only has 3 real corners. Try again!', 'oops');
              return;
            }
          }
          if (segsCross(p[0], p[1], p[2], p[3]) || segsCross(p[1], p[2], p[3], p[0])) {
            redraw(true, false);
            result.textContent = 'The lines cross each other. Go round the corners in order. Clear and try again.';
            api.say('The lines cross! Click the corners in order, going round.', 'oops');
            return;
          }
          var s = [d2(p[0], p[1]), d2(p[1], p[2]), d2(p[2], p[3]), d2(p[3], p[0])];
          var equalSides = s[0] === s[1] && s[1] === s[2] && s[2] === s[3];
          var equalDiag = d2(p[0], p[2]) === d2(p[1], p[3]);
          var isSquare = equalSides && equalDiag;
          var tilted = isSquare && p[0][0] !== p[1][0] && p[0][1] !== p[1][1];
          var P = redraw(true, isSquare);
          addMarks(marksG, P, 0.9);
          api.unlockNext();
          if (isSquare) {
            made.square = true;
            if (tilted) made.tilted = true;
            api.sound('correct');
            result.textContent = tilted ? 'A turned square! 4 equal sides and 4 right angles: REGULAR.' : 'A square! 4 equal sides and 4 right angles: REGULAR.';
            api.say(tilted ? 'Brilliant! A turned square is still regular.' : 'A regular square! Now can you draw a turned square?', 'cheer');
          } else {
            api.sound('pop');
            var name = equalSides ? 'a rhombus (sides equal, angles not)' : s[0] === s[2] && s[1] === s[3] && equalDiag ? 'a rectangle (angles equal, sides not)' : 'a 4-sided shape';
            result.textContent = 'That is ' + name + '. It is IRREGULAR.';
            api.say(made.square ? 'Irregular. Try another one!' : 'Irregular. Can you make all 4 sides AND all 4 angles equal?', 'think');
          }
          api.feedback('Press Clear to draw another shape.', 'info');
        }
        for (var r = 0; r < N; r++) {
          for (var c = 0; c < N; c++) {
            (function (c, r) {
              var p = pos(c, r);
              var hit = svg('circle', { cx: p[0], cy: p[1], r: 22, class: 'ri-dot-hit', 'data-dot': c + ',' + r });
              var dot = svg('circle', { cx: p[0], cy: p[1], r: 7, class: 'ri-dot' });
              dotEls[c + ',' + r] = dot;
              hit.addEventListener('click', function () {
                if (picked.length >= 4) {
                  api.feedback('Press Clear to draw a new shape.', 'info');
                  return;
                }
                if (picked.some(function (q) { return q[0] === c && q[1] === r; })) {
                  api.feedback('You already used that dot. Pick a different one.', 'try');
                  return;
                }
                picked.push([c, r]);
                api.sound('click');
                if (picked.length === 4) judge();
                else {
                  redraw(false);
                  result.textContent = 'Corner ' + picked.length + ' of 4';
                }
              });
              dotsG.appendChild(hit);
              dotsG.appendChild(dot);
            })(c, r);
          }
        }
        clearBtn.addEventListener('click', function () {
          picked = [];
          redraw(false);
          result.textContent = ' ';
          api.feedback('', 'info');
        });
        stage.appendChild(root);
        stage.appendChild(result);
        stage.appendChild(clearBtn);
      },
    ],

    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        var b = BANK[q.key];
        var d = drawShape(q.pts, { size: 260 });

        if (q.type === 'name') {
          api.say('Count the sides. What kind of polygon is it?', 'think');
          stage.appendChild(MQ.ui.prompt('How many sides? What is this shape called?'));
          stage.appendChild(d.svg);
          var names = [3, 4, 5, 6, 8];
          var right = POLY_NAMES[b.sides];
          var ch = MQ.ui.choices(names.map(function (k) { return { label: POLY_NAMES[k], value: POLY_NAMES[k] }; }), function (v) {
            if (v === right) {
              ch.mark(v, 'good');
              ch.disable();
              d.numberSides();
              api.check(true, 'Yes! ' + b.sides + ' sides make a ' + right + '.');
            } else {
              ch.mark(v, 'bad');
              var second = api.tries() >= 1;
              var hint = q.key === 'arrowhead' ? 'Count again. The dent still has straight sides: put your finger on the top corner and go round.' : 'Count the sides carefully. Put your finger on one corner and go all the way round.';
              if (second) {
                d.numberSides();
                hint = 'Look at the numbers on the sides: ' + b.sides + ' sides. 3 = triangle, 4 = quadrilateral, 5 = pentagon, 6 = hexagon, 8 = octagon.';
              }
              api.check(false, hint, q.key === 'arrowhead' ? 'Did not count a dented shape as 4-sided' : 'Miscounted the sides');
            }
          }, { columns: 3 });
          stage.appendChild(ch);
          api.onReveal(function () {
            d.numberSides();
            ch.mark(right, 'good');
            ch.disable();
            api.feedback(b.sides + ' sides, so it is a ' + right + '.', 'info');
          });
          return;
        }

        api.say(q.turned && api.level > 1 ? 'This shape may have been turned. Check the sides and the corners.' : 'Regular or irregular? Check ALL the sides and ALL the corners.', 'think');
        stage.appendChild(MQ.ui.prompt('Is this shape <b>regular</b> or <b>irregular</b>?'));
        stage.appendChild(d.svg);
        var correct = !!b.regular;
        var ch2 = MQ.ui.choices([{ label: '✅ Regular', value: true }, { label: '✳️ Irregular', value: false }], function (v) {
          if (v === correct) {
            ch2.mark(v, 'good');
            ch2.disable();
            d.show();
            api.check(true, (correct ? 'Yes, regular! ' : 'Yes, irregular! ') + b.why);
          } else {
            ch2.mark(v, 'bad');
            var h = correct ? regularHint(q, b) : irregularHint(q, b);
            var hint = h.hint;
            if (api.tries() >= 1) {
              d.show();
              hint += ' Look at the marks: same ticks = same length, same arcs = same angle.';
            }
            api.check(false, hint, h.tag);
          }
        }, { columns: 2 });
        stage.appendChild(ch2);
        api.onReveal(function () {
          d.show();
          ch2.mark(correct, 'good');
          ch2.disable();
          api.feedback((correct ? 'Regular. ' : 'Irregular. ') + b.why, 'info');
        });
      },
    },
  });
})();

/* Walk the Edge — perimeter is the distance all the way round (Unit 6.2). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  /* ------------------------------------------------------------------ *
   * Geometry helpers (points are [x, y] arrays, y goes down)
   * ------------------------------------------------------------------ */
  function dist(a, b) {
    return Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1]));
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
  // Unit normal pointing out of the shape for side i (pts[i] -> pts[i+1]).
  function outward(pts, i, area) {
    var a = pts[i];
    var b = pts[(i + 1) % pts.length];
    var dx = b[0] - a[0];
    var dy = b[1] - a[1];
    var L = Math.sqrt(dx * dx + dy * dy) || 1;
    return area > 0 ? [dy / L, -dx / L] : [-dy / L, dx / L];
  }
  function regularPolygon(n, r, startDeg) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var a = ((startDeg + (360 * i) / n) * Math.PI) / 180;
      pts.push([r * Math.cos(a), r * Math.sin(a)]);
    }
    return pts;
  }
  function sumOf(arr) {
    return arr.reduce(function (s, v) {
      return s + v;
    }, 0);
  }

  /* ------------------------------------------------------------------ *
   * A drawn shape. pts are in "units" (grid squares or cm/m/km).
   * opts: grid (bool) – draw on squared paper, pts must be whole numbers
   *       cell – px per unit on a grid; maxW/maxH – size of a labelled drawing
   *       fill – CSS class for the inside
   * ------------------------------------------------------------------ */
  function makeFigure(pts, opts) {
    opts = opts || {};
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(function (p) {
      minX = Math.min(minX, p[0]);
      minY = Math.min(minY, p[1]);
      maxX = Math.max(maxX, p[0]);
      maxY = Math.max(maxY, p[1]);
    });
    var bw = maxX - minX;
    var bh = maxY - minY;
    var root, top, base, px;
    var fig = {};
    if (opts.grid) {
      var g = MQ.ui.grid({ cols: bw + 2, rows: bh + 2, cell: opts.cell || 44, pad: 12 });
      root = g.svg;
      base = g.under;
      top = g.layer;
      px = function (p) {
        return [g.x(p[0] - minX + 1), g.y(p[1] - minY + 1)];
      };
      fig.grid = g;
      fig.unitPx = g.cell;
    } else {
      var maxW = opts.maxW || 420;
      var maxH = opts.maxH || 250;
      var scale = Math.min(maxW / (bw || 1), maxH / (bh || 1), opts.maxScale || 70);
      var m = opts.margin || 56;
      var my = opts.marginY || m;
      var W = bw * scale + m * 2;
      var H = bh * scale + my * 2;
      root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'rp-svg', style: { maxWidth: '100%', height: 'auto' } });
      base = svg('g');
      top = svg('g');
      root.appendChild(base);
      root.appendChild(top);
      px = function (p) {
        return [m + (p[0] - minX) * scale, my + (p[1] - minY) * scale];
      };
      fig.unitPx = scale;
    }
    var P = pts.map(px);
    var area = signedArea(P);
    var poly = svg('polygon', {
      points: P.map(function (p) {
        return p[0] + ',' + p[1];
      }).join(' '),
      class: 'rp-shape ' + (opts.fill || 'rp-fill-garden'),
    });
    base.appendChild(poly);
    var outline = svg('polygon', {
      points: P.map(function (p) {
        return p[0] + ',' + p[1];
      }).join(' '),
      class: 'rp-outline',
    });
    top.appendChild(outline);
    var marks = svg('g');
    var trail = svg('g');
    var labels = svg('g');
    top.appendChild(marks);
    top.appendChild(trail);
    top.appendChild(labels);

    fig.svg = root;
    fig.top = top;
    fig.base = base;
    fig.marks = marks;
    fig.trail = trail;
    fig.labels = labels;
    fig.P = P;
    fig.pts = pts;
    fig.px = px;
    fig.lens = pts.map(function (p, i) {
      return dist(p, pts[(i + 1) % pts.length]);
    });
    fig.mid = function (i) {
      var a = P[i];
      var b = P[(i + 1) % P.length];
      return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    };
    fig.normal = function (i) {
      return outward(P, i, area);
    };
    /** Put a length label just outside side i. Returns the <text>. */
    fig.label = function (i, text, cls, off) {
      var mid = fig.mid(i);
      var n = fig.normal(i);
      // On a grid there is only one square of margin, so keep labels closer.
      off = off || (opts.grid ? 18 + 8 * Math.abs(n[0]) : 26 + 18 * Math.abs(n[0]));
      var t = svg('text', { x: mid[0] + n[0] * off, y: mid[1] + n[1] * off + 7, 'text-anchor': 'middle', class: 'rp-label ' + (cls || '') }, text);
      labels.appendChild(t);
      return t;
    };
    /** Small tick mark(s) across side i to show equal sides. */
    fig.tick = function (i) {
      var mid = fig.mid(i);
      var n = fig.normal(i);
      marks.appendChild(svg('line', { x1: mid[0] - n[0] * 9, y1: mid[1] - n[1] * 9, x2: mid[0] + n[0] * 9, y2: mid[1] + n[1] * 9, class: 'rp-tick' }));
    };
    fig.lightSide = function (i, cls) {
      var a = P[i];
      var b = P[(i + 1) % P.length];
      var ln = svg('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: cls || 'rp-side-lit' });
      trail.appendChild(ln);
      return ln;
    };
    fig.corner = function (i, text) {
      // label a corner (for routes): placed away from the centre
      var cx = 0, cy = 0;
      P.forEach(function (p) {
        cx += p[0] / P.length;
        cy += p[1] / P.length;
      });
      var dx = P[i][0] - cx;
      var dy = P[i][1] - cy;
      var L = Math.sqrt(dx * dx + dy * dy) || 1;
      labels.appendChild(svg('text', { x: P[i][0] + (dx / L) * 30, y: P[i][1] + (dy / L) * 26 + 6, 'text-anchor': 'middle', class: 'rp-corner' }, text));
    };
    return fig;
  }

  /**
   * Animate a walker all the way round a figure.
   * o.onSide(i) runs when side i is finished; o.done() at the end.
   * o.points – optional px points to walk instead of the figure corners.
   */
  function walk(fig, api, o) {
    o = o || {};
    var P = o.points || fig.P;
    MQ.clear(fig.trail);
    var path = svg('polyline', { class: 'rp-trail', points: P[0][0] + ',' + P[0][1] });
    var walker = svg('g', { class: 'rp-walker' }, svg('circle', { r: 13 }), svg('text', { y: 6, 'text-anchor': 'middle' }, '👣'));
    fig.trail.appendChild(path);
    fig.trail.appendChild(walker);
    var visited = [P[0]];
    function place(p) {
      walker.setAttribute('transform', 'translate(' + p[0] + ',' + p[1] + ')');
    }
    place(P[0]);
    function side(i) {
      if (i >= P.length) {
        if (o.done) o.done();
        return;
      }
      var a = P[i];
      var b = P[(i + 1) % P.length];
      var frames = Math.max(6, Math.round(dist(a, b) / (o.speed || 9)));
      var f = 0;
      function step() {
        f++;
        var t = f / frames;
        var p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        place(p);
        path.setAttribute('points', visited.concat([p]).map(function (q) {
          return q[0] + ',' + q[1];
        }).join(' '));
        if (f < frames) {
          api.later(step, 24);
        } else {
          visited.push(b);
          if (o.onSide) o.onSide(i);
          api.later(function () {
            side(i + 1);
          }, o.pause == null ? 260 : o.pause);
        }
      }
      step();
    }
    api.later(function () {
      side(0);
    }, 150);
  }

  /* ------------------------------------------------------------------ *
   * Practice questions
   * ------------------------------------------------------------------ */
  function rectPts(w, h) {
    return [[0, 0], [w, 0], [w, h], [0, h]];
  }
  // L-shape: w by h with a cw by ch notch cut from the top-right corner.
  function lPts(w, h, cw, ch) {
    return [[0, 0], [w - cw, 0], [w - cw, ch], [w, ch], [w, h], [0, h]];
  }
  var PLACES = [
    { name: 'flower bed', fill: 'rp-fill-garden' },
    { name: 'playground', fill: 'rp-fill-play' },
    { name: 'rug', fill: 'rp-fill-rug' },
    { name: 'vegetable patch', fill: 'rp-fill-garden' },
    { name: 'sandpit', fill: 'rp-fill-sand' },
  ];

  // Shapes where the squares inside equal the perimeter (e.g. 6 by 3: 18 and 18) are
  // skipped: counting the squares by mistake would give the right answer.
  function gridRect(unit) {
    var w, h;
    do {
      w = U.rand(3, 6);
      h = U.rand(2, 4);
      if (w === h) w++;
    } while (w * h === 2 * (w + h));
    return { kind: 'grid', pts: rectPts(w, h), unit: unit, area: w * h, edgeSquares: 2 * w + 2 * h - 4, key: 'r' + w + 'x' + h };
  }
  function gridL(unit) {
    var w, h, cw, ch;
    do {
      w = U.rand(4, 6);
      h = U.rand(3, 4);
      cw = U.rand(1, w - 2);
      ch = U.rand(1, h - 2);
    } while (w * h - cw * ch === 2 * (w + h));
    return { kind: 'grid', pts: lPts(w, h, cw, ch), unit: unit, area: w * h - cw * ch, key: 'L' + w + h + cw + ch };
  }

  function labelled(def) {
    def.kind = 'label';
    return def;
  }

  var LEVEL2 = {
    triangle: function () {
      // sides 6 (bottom), 5 and 4, drawn to scale
      var x = (16 - 25 + 36) / 12;
      var y = Math.sqrt(16 - x * x);
      return labelled({ key: 'tri456', pts: [[0, y], [6, y], [x, 0]], labels: ['6 cm', '5 cm', '4 cm'], unit: 'cm', thing: 'This triangle' });
    },
    pentagon: function () {
      var v = U.pick([
        { base: 6, wall: 3, half: 3, rise: 4 }, // roof 5
        { base: 6, wall: 4, half: 3, rise: 4 }, // roof 5
        { base: 8, wall: 2, half: 4, rise: 3 }, // roof 5
      ]);
      var top = v.wall + v.rise;
      var pts = [[0, top], [v.base, top], [v.base, v.rise], [v.half, 0], [0, v.rise]];
      var roof = Math.round(Math.sqrt(v.half * v.half + v.rise * v.rise));
      var ls = [v.base, v.wall, roof, roof, v.wall];
      return labelled({ key: 'pent', pts: pts, labels: ls.map(function (n) { return n + ' cm'; }), unit: 'cm', thing: 'This 5-sided shape' });
    },
    rectangle: function () {
      var w = U.rand(5, 9);
      var h = U.rand(2, 4);
      return labelled({ key: 'rect2', pts: rectPts(w, h), labels: [w + ' m', null, null, h + ' m'], unit: 'm', thing: 'This rectangular yard', note: 'Only two sides are labelled.' });
    },
    eqTriangle: function () {
      return labelled({ key: 'eqtri', pts: regularPolygon(3, 4 / Math.sqrt(3), -90), lens: [4, 4, 4], labels: ['4 cm', null, null], ticks: true, unit: 'cm', thing: 'This regular triangle', note: 'The tick marks show the sides are equal.' });
    },
    square: function () {
      return labelled({ key: 'sq5', pts: rectPts(5, 5), labels: ['5 cm', null, null, null], ticks: true, unit: 'cm', thing: 'This square', note: 'A square has 4 equal sides.' });
    },
    hexagon: function () {
      return labelled({ key: 'hex3', pts: regularPolygon(6, 3, 0), lens: [3, 3, 3, 3, 3, 3], labels: [null, '3 cm', null, null, null, null], ticks: true, unit: 'cm', thing: 'This regular hexagon', note: 'All 6 sides are equal.' });
    },
  };

  var LEVEL3 = {
    pentagon16: function () {
      return labelled({ key: 'pent16', pts: regularPolygon(5, 16 / (2 * Math.sin(Math.PI / 5)), -90), lens: [16, 16, 16, 16, 16], labels: [null, '16 m', null, null, null], ticks: true, unit: 'm', thing: 'This regular pentagon-shaped pond', note: 'All 5 sides are equal.', extra: 'Try doubling: 16 + 16 = 32. 32 + 32 = 64. Then add one more 16.' });
    },
    room: function () {
      return labelled({ key: 'room87', pts: rectPts(8, 7), labels: ['8 m', null, null, '7 m'], unit: 'm', thing: 'This classroom floor', note: 'Only two sides are labelled.' });
    },
    route: function () {
      // a 3-4-5 right-angled route, drawn to scale
      return labelled({ key: 'route', pts: [[0, 3], [4, 3], [0, 0]], labels: ['4 km', '5 km', '3 km'], unit: 'km', corners: ['🏠 Home', '🏫 School', '🛒 Shop'], thing: 'A bike ride goes Home → School → Shop → Home. The whole route', route: true });
    },
  };

  function finishQuestion(q) {
    if (!q.lens) q.lens = q.pts.map(function (p, i) { return Math.round(dist(p, q.pts[(i + 1) % q.pts.length]) * 1000) / 1000; });
    q.lens = q.lens.map(function (n) { return Math.round(n); });
    q.total = sumOf(q.lens);
    return q;
  }

  var deck = null;
  function buildDeck() {
    var q = [];
    var unitL = U.pick(['units', 'cm']);
    var a = gridRect('units');
    var b = gridL(unitL);
    var c = U.pick([gridRect('cm'), gridL('cm')]);
    var tries = 0;
    while ((c.key === a.key || c.key === b.key) && tries++ < 30) c = U.pick([gridRect('cm'), gridL('cm')]);
    var places = U.shuffle(PLACES);
    a.place = places[0];
    b.place = places[1];
    c.place = places[2];
    q.push(a, b, c);
    var l2 = U.shuffle(['triangle', 'pentagon', 'eqTriangle', 'square', 'hexagon']).slice(0, 2);
    U.shuffle(['rectangle'].concat(l2)).forEach(function (k) {
      q.push(LEVEL2[k]());
    });
    U.shuffle(['pentagon16', 'room', 'route']).slice(0, 2).forEach(function (k) {
      q.push(LEVEL3[k]());
    });
    return q.map(finishQuestion);
  }

  function askText(q) {
    if (q.kind === 'grid') {
      return 'Walk round the edge of this <b>' + q.place.name + '</b>. What is its <b>perimeter</b>?<br><span class="rp-note">' + (q.unit === 'cm' ? 'Each square is 1 cm along each side.' : 'Each square side is 1 unit.') + '</span>';
    }
    if (q.route) return 'A bike ride goes Home → School → Shop → back Home. How far is the <b>whole ride</b>?';
    return q.thing + ': what is its <b>perimeter</b>?' + (q.note ? '<br><span class="rp-note">' + q.note + '</span>' : '');
  }

  /* ------------------------------------------------------------------ *
   * Styles
   * ------------------------------------------------------------------ */
  var css = [
    '.rp-svg{display:block}',
    '.rp-shape{stroke:none}',
    '.rp-fill-garden{fill:#dff3d8}',
    '.rp-fill-play{fill:#ffe9c7}',
    '.rp-fill-rug{fill:#f3e1f7}',
    '.rp-fill-sand{fill:#fbefc4}',
    '.rp-fill-plain{fill:#eef3ff}',
    '.rp-outline{fill:none;stroke:var(--ink);stroke-width:4;stroke-linejoin:round}',
    '.rp-trail{fill:none;stroke:#e85d04;stroke-width:7;stroke-linejoin:round;stroke-linecap:round;opacity:.85}',
    '.rp-side-lit{stroke:#e85d04;stroke-width:7;stroke-linecap:round}',
    '.rp-side-b{stroke:#2a7de1;stroke-width:7;stroke-linecap:round}',
    '.rp-walker circle{fill:#fff;stroke:#e85d04;stroke-width:3}',
    '.rp-walker text{font-size:15px}',
    '.rp-label{font-size:21px;font-weight:800;fill:var(--ink);paint-order:stroke;stroke:#fff;stroke-width:5px}',
    '.rp-label.rp-new{fill:#e85d04}',
    '.rp-label.rp-blue{fill:#2a7de1}',
    '.rp-count{font-size:15px;font-weight:800;fill:#e85d04;paint-order:stroke;stroke:#fff;stroke-width:4px}',
    '.rp-cellnum{font-size:18px;font-weight:800;fill:#6a3fd1}',
    '.rp-cell-in{fill:#d9ccff}',
    '.rp-tick{stroke:var(--ink);stroke-width:3}',
    '.rp-corner{font-size:17px;font-weight:800;fill:var(--ink);paint-order:stroke;stroke:#fff;stroke-width:5px}',
    '.rp-ask{cursor:pointer}',
    '.rp-ask rect{fill:#fff3cd;stroke:var(--gold);stroke-width:3}',
    '.rp-ask:hover rect{fill:#ffe08a}',
    '.rp-ask text{font-size:22px;font-weight:800;fill:#7a5200}',
    '.rp-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.rp-sum{min-height:48px;display:flex;align-items:center;justify-content:center}',
    '.rp-note{font-size:1rem;font-weight:700;color:var(--ink-soft)}',
    '.rp-pair{display:flex;gap:14px;flex-wrap:wrap;justify-content:center}',
    '.rp-score{font-size:1.2rem;font-weight:800;padding:8px 14px;border-radius:12px;background:var(--paper-2);min-width:200px;text-align:center}',
    '.rp-score.rp-orange{background:#ffe8d6;color:#a63c00}',
    '.rp-score.rp-purple{background:#ece5ff;color:#4b2aa8}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'robot-patrol' }, css));

  /* ------------------------------------------------------------------ *
   * Activity
   * ------------------------------------------------------------------ */
  MQ.register('robot-patrol', {
    learn: [
      // 1. What is perimeter?
      function (stage, api) {
        api.say('Perimeter is the distance all the way round a shape. Press the button and walk round the garden with me!');
        stage.appendChild(MQ.ui.lesson('What is perimeter?', 'This garden is drawn on squared paper. Each square side is <b>1 unit</b>.'));
        var fig = makeFigure(rectPts(5, 3), { grid: true, cell: 46, fill: 'rp-fill-garden' });
        stage.appendChild(fig.svg);
        var sumBox = el('div', { class: 'rp-sum' });
        var btn = el('button', { class: 'btn', type: 'button' }, '👣 Walk the edge');
        stage.appendChild(btn);
        stage.appendChild(sumBox);
        var busy = false;
        btn.addEventListener('click', function () {
          if (busy) return;
          busy = true;
          btn.disabled = true;
          MQ.clear(fig.labels);
          MQ.clear(sumBox);
          var parts = [];
          walk(fig, api, {
            onSide: function (i) {
              fig.lightSide(i);
              fig.label(i, String(fig.lens[i]), 'rp-new');
              parts.push(fig.lens[i]);
              MQ.clear(sumBox);
              sumBox.appendChild(MQ.ui.sum(parts, null));
              api.sound('pop');
            },
            done: function () {
              MQ.clear(sumBox);
              sumBox.appendChild(MQ.ui.sum(parts, sumOf(parts), 'units'));
              api.say('5 + 3 + 5 + 3 = 16. The perimeter is 16 units: the distance all the way round!', 'cheer');
              api.feedback('Perimeter = the distance all the way round the edge.', 'good');
              btn.textContent = '👣 Walk again';
              btn.disabled = false;
              busy = false;
            },
          });
        });
      },

      // 2. Edges, not squares
      function (stage, api) {
        api.say('Perimeter counts the edges round the outside. Not the squares inside! Try both buttons.', 'think');
        stage.appendChild(MQ.ui.lesson('Edges, not squares', 'A square with 3 units on each side.'));
        var fig = makeFigure(rectPts(3, 3), { grid: true, cell: 46, fill: 'rp-fill-plain' });
        stage.appendChild(fig.svg);
        var walkScore = el('div', { class: 'rp-score rp-orange' }, 'Walk round: ?');
        var inScore = el('div', { class: 'rp-score rp-purple' }, 'Squares inside: ?');
        var bWalk = el('button', { class: 'btn', type: 'button' }, '👣 Walk the edge');
        var bIn = el('button', { class: 'btn btn-ghost', type: 'button' }, '🟪 Squares inside');
        stage.appendChild(el('div', { class: 'rp-btns' }, bWalk, bIn));
        stage.appendChild(el('div', { class: 'rp-pair' }, walkScore, inScore));
        var g = fig.grid;
        var cells = [];
        var busy = false;
        var did = { walk: false, inside: false };
        function both() {
          if (did.walk && did.inside) {
            api.say('The walk round is 12 units. The 9 is the squares inside. Perimeter = 12, not 9!', 'cheer');
            api.feedback('Perimeter is the walk round the edge: 3 + 3 + 3 + 3 = 12 units.', 'good');
          }
        }
        // unit points round the square, clockwise from the top-left corner
        var unitPts = [];
        var c;
        for (c = 0; c < 3; c++) unitPts.push([c, 0]);
        for (c = 0; c < 3; c++) unitPts.push([3, c]);
        for (c = 3; c > 0; c--) unitPts.push([c, 3]);
        for (c = 3; c > 0; c--) unitPts.push([0, c]);
        var unitPx = unitPts.map(fig.px);
        bWalk.addEventListener('click', function () {
          if (busy) return;
          busy = true;
          bWalk.disabled = bIn.disabled = true;
          MQ.clear(fig.labels);
          var area = signedArea(unitPx);
          walk(fig, api, {
            points: unitPx,
            pause: 120,
            onSide: function (i) {
              var a = unitPx[i];
              var b = unitPx[(i + 1) % unitPx.length];
              var n = outward(unitPx, i, area);
              fig.labels.appendChild(svg('text', { x: (a[0] + b[0]) / 2 + n[0] * 18, y: (a[1] + b[1]) / 2 + n[1] * 18 + 5, 'text-anchor': 'middle', class: 'rp-count' }, String(i + 1)));
              walkScore.textContent = 'Walk round: ' + (i + 1) + ' units';
              api.sound('click');
            },
            done: function () {
              did.walk = true;
              busy = false;
              bWalk.disabled = bIn.disabled = false;
              api.say('12 edges all the way round. The perimeter is 12 units.', 'happy');
              both();
            },
          });
        });
        bIn.addEventListener('click', function () {
          if (busy) return;
          busy = true;
          bWalk.disabled = bIn.disabled = true;
          cells.forEach(function (n) {
            if (n.parentNode) n.parentNode.removeChild(n);
          });
          cells = [];
          var k = 0;
          function next() {
            if (k >= 9) {
              did.inside = true;
              busy = false;
              bWalk.disabled = bIn.disabled = false;
              api.say('9 squares inside. That is NOT the perimeter. It is the space inside.', 'think');
              both();
              return;
            }
            var cc = k % 3;
            var rr = Math.floor(k / 3);
            cells.push(g.fill(cc + 1, rr + 1, 'rp-cell-in'));
            var t = svg('text', { x: g.x(cc + 1) + g.cell / 2, y: g.y(rr + 1) + g.cell / 2 + 6, 'text-anchor': 'middle', class: 'rp-cellnum' }, String(k + 1));
            fig.base.parentNode.appendChild(t);
            cells.push(t);
            inScore.textContent = 'Squares inside: ' + (k + 1);
            api.sound('click');
            k++;
            api.later(next, 260);
          }
          next();
        });
      },

      // 3. Missing labels
      function (stage, api) {
        api.say('Only two sides have numbers. Opposite sides of a rectangle are the same length. Click each ? to fill it in.', 'think');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Missing labels', 'Click each <b>?</b> side.'));
        var fig = makeFigure(rectPts(4, 3), { maxW: 300, maxH: 190, maxScale: 64, fill: 'rp-fill-rug', margin: 72, marginY: 58 });
        stage.appendChild(fig.svg);
        var sumBox = el('div', { class: 'rp-sum' });
        stage.appendChild(sumBox);
        fig.label(0, '4 cm');
        fig.label(3, '3 cm');
        var filled = 0;
        var opposite = { 2: 0, 1: 3 };
        [2, 1].forEach(function (i) {
          var mid = fig.mid(i);
          var n = fig.normal(i);
          var cx = mid[0] + n[0] * 30;
          var cy = mid[1] + n[1] * 30;
          var btn = svg('g', { class: 'rp-ask', role: 'button', tabindex: '0' }, svg('rect', { x: cx - 24, y: cy - 20, width: 48, height: 40, rx: 10 }), svg('text', { x: cx, y: cy + 8, 'text-anchor': 'middle' }, '?'));
          fig.labels.appendChild(btn);
          function reveal() {
            if (!btn.parentNode) return;
            btn.parentNode.removeChild(btn);
            var len = fig.lens[i];
            fig.lightSide(i, i === 2 ? 'rp-side-lit' : 'rp-side-b');
            fig.lightSide(opposite[i], i === 2 ? 'rp-side-lit' : 'rp-side-b');
            fig.label(i, len + ' cm', i === 2 ? 'rp-new' : 'rp-blue');
            api.sound('pop');
            filled++;
            if (i === 2) api.say('The bottom matches the top: 4 cm.', 'happy');
            else api.say('The right side matches the left side: 3 cm.', 'happy');
            if (filled === 2) {
              sumBox.appendChild(MQ.ui.sum([4, 3, 4, 3], 14, 'cm'));
              api.say('Now every side has a number. 4 + 3 + 4 + 3 = 14 cm. Not 7!', 'cheer');
              api.feedback('Add ALL the sides, even the ones without a label.', 'good');
              api.unlockNext();
            }
          }
          btn.addEventListener('click', reveal);
          btn.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              reveal();
            }
          });
        });
      },
    ],

    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.kind === 'grid' && !q.place) q.place = U.pick(PLACES);
        var unitWord = q.unit === 'units' ? 'units' : q.unit;
        stage.appendChild(MQ.ui.prompt(askText(q)));

        var fig;
        if (q.kind === 'grid') {
          var bw = 0, bh = 0;
          q.pts.forEach(function (p) {
            bw = Math.max(bw, p[0]);
            bh = Math.max(bh, p[1]);
          });
          var cell = Math.min(48, Math.floor(400 / (bw + 2)), Math.floor(190 / (bh + 2)));
          fig = makeFigure(q.pts, { grid: true, cell: cell, fill: q.place.fill });
          stage.appendChild(fig.svg);
          api.say('Count the edges round the outside, not the squares inside.', 'think');
        } else {
          fig = makeFigure(q.pts, { maxW: 400, maxH: q.route ? 170 : 175, marginY: q.route ? 44 : 40, maxScale: q.pts.length > 4 ? 60 : 70, fill: q.route ? 'rp-fill-plain' : q.unit === 'm' ? 'rp-fill-play' : 'rp-fill-rug', margin: q.route ? 76 : 70 });
          stage.appendChild(fig.svg);
          q.labels.forEach(function (t, i) {
            if (t) fig.label(i, t);
          });
          if (q.ticks) q.pts.forEach(function (p, i) { fig.tick(i); });
          if (q.corners) q.corners.forEach(function (t, i) { fig.corner(i, t); });
          var hidden = q.labels.filter(function (t) { return !t; }).length;
          api.say(hidden ? 'Some sides have no number. Work them out, then add every side.' : 'Add up every side. Do not forget the unit!', 'think');
        }
        var sumBox = el('div', { class: 'rp-sum' });

        // Likely mistakes for this question
        var labelledOnly = null;
        if (q.labels) {
          var ls = [];
          q.labels.forEach(function (t, i) {
            if (t) ls.push(q.lens[i]);
          });
          if (ls.length < q.lens.length) labelledOnly = sumOf(ls);
        }
        var n = q.lens.length;
        function fullSum() {
          return q.lens.join(' + ');
        }

        var input = MQ.ui.numberInput({
          unit: unitWord,
          onSubmit: function (v) {
            if (v === q.total) {
              input.good();
              input.disable();
              MQ.clear(sumBox);
              sumBox.appendChild(MQ.ui.sum(q.lens, q.total, unitWord));
              api.check(true, 'Yes! ' + fullSum() + ' = ' + q.total + ' ' + unitWord + '.');
              return;
            }
            input.bad();
            var second = api.tries() >= 1;
            var hint;
            var tag;
            var missed = q.lens.some(function (L) {
              return v === q.total - L;
            });
            if (labelledOnly != null && v === labelledOnly) {
              tag = 'Added only the labelled sides';
              hint = 'You added only the sides with numbers. The shape has ' + n + ' sides. Which sides are the same length?';
            } else if (q.kind === 'grid' && v === q.area) {
              tag = 'Counted squares inside instead of edges';
              hint = 'That is the number of squares inside! Perimeter is the walk round: count the edges on the outside.';
            } else if (q.kind === 'grid' && q.edgeSquares && v === q.edgeSquares) {
              tag = 'Counted squares round the edge instead of edges';
              hint = 'You counted the squares along the edge. Count the lines instead: a corner square has 2 edges on the outside.';
            } else if (missed) {
              tag = 'Missed a side';
              hint = 'So close! It looks like one side was missed. This shape has ' + n + ' sides.';
            } else if (v > q.total) {
              tag = 'Added too much';
              hint = 'That is too many. Go round once and add each side only one time.';
            } else {
              tag = 'Added the sides wrongly';
              hint = 'Not quite. Put your finger on a corner and add each side as you go round.';
            }
            if (second) {
              hint += ' Add all ' + n + ' sides: ' + fullSum() + ' = ?';
              if (q.extra) hint += ' ' + q.extra;
            }
            api.check(false, hint, tag);
            input.focus();
          },
        });
        stage.appendChild(input.el);
        stage.appendChild(sumBox);
        input.focus();

        api.onReveal(function () {
          input.setValue(String(q.total));
          input.good();
          input.disable();
          MQ.clear(sumBox);
          api.feedback('Watch: we walk all the way round and add every side.', 'info');
          var parts = [];
          var shown = {};
          if (q.labels) q.labels.forEach(function (t, i) { if (t) shown[i] = true; });
          walk(fig, api, {
            onSide: function (i) {
              fig.lightSide(i);
              if (!shown[i]) fig.label(i, q.lens[i] + (q.kind === 'grid' ? '' : ' ' + q.unit), 'rp-new');
              parts.push(q.lens[i]);
              MQ.clear(sumBox);
              sumBox.appendChild(MQ.ui.sum(parts, null));
            },
            done: function () {
              MQ.clear(sumBox);
              sumBox.appendChild(MQ.ui.sum(q.lens, q.total, unitWord));
              api.feedback('All the way round: ' + fullSum() + ' = ' + q.total + ' ' + unitWord + '.', 'info');
            },
          });
        });
      },
    },
  });
})();

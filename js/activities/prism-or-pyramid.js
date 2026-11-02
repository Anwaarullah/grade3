/* Prism or Pyramid? — two matching ends + flat faces = prism; one base + triangles meeting at a point = pyramid;
 * anything with a curved surface is neither (Unit 4.1). Shapes are small 3D models drawn in SVG that can be turned.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;
  var ID = 'prism-or-pyramid';
  var D = Math.PI / 180;

  var HL = {
    gold: { fill: '#ffd166', stroke: '#b7791f' },
    orange: { fill: '#ffab76', stroke: '#c2410c' },
  };

  /* ---------------------------------------------------------------- *
   * Tiny 3D helper: vertex + face lists, rotate, project, shade.
   * ---------------------------------------------------------------- */
  function rx(a) {
    var c = Math.cos(a), s = Math.sin(a);
    return [[1, 0, 0], [0, c, -s], [0, s, c]];
  }
  function ry(a) {
    var c = Math.cos(a), s = Math.sin(a);
    return [[c, 0, s], [0, 1, 0], [-s, 0, c]];
  }
  function rz(a) {
    var c = Math.cos(a), s = Math.sin(a);
    return [[c, -s, 0], [s, c, 0], [0, 0, 1]];
  }
  function mm(A, B) {
    var R = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
    for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) for (var k = 0; k < 3; k++) R[i][j] += A[i][k] * B[k][j];
    return R;
  }
  function mv(M, v) {
    return [M[0][0] * v[0] + M[0][1] * v[1] + M[0][2] * v[2], M[1][0] * v[0] + M[1][1] * v[1] + M[1][2] * v[2], M[2][0] * v[0] + M[2][1] * v[1] + M[2][2] * v[2]];
  }
  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  var I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  var POSES = { stand: I3, lying: rz(90 * D), upside: rx(180 * D), tipped: rz(90 * D) };
  var POSE_WORD = { lying: 'lying down', upside: 'upside down', tipped: 'tipped over' };
  var LIGHT = (function () {
    var v = [-0.35, 0.75, 0.55];
    var l = Math.sqrt(dot(v, v));
    return [v[0] / l, v[1] / l, v[2] / l];
  })();

  /** Regular polygon in the x–z plane, one flat side facing the viewer. */
  function regPoly(n, r) {
    var a0 = Math.PI / 2 + Math.PI / n;
    var out = [];
    for (var i = 0; i < n; i++) out.push([r * Math.cos(a0 + (2 * Math.PI * i) / n), r * Math.sin(a0 + (2 * Math.PI * i) / n)]);
    return out;
  }
  function rectPoly(w, d) {
    return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];
  }

  /** Normals (pointing away from `inside`), edge list with the faces on each side, bounding radius. */
  function finish(m, inside) {
    m.faces.forEach(function (f) {
      var n = [0, 0, 0], c = [0, 0, 0], len = f.v.length;
      for (var i = 0; i < len; i++) {
        var a = m.verts[f.v[i]], b = m.verts[f.v[(i + 1) % len]];
        n[0] += (a[1] - b[1]) * (a[2] + b[2]);
        n[1] += (a[2] - b[2]) * (a[0] + b[0]);
        n[2] += (a[0] - b[0]) * (a[1] + b[1]);
        c[0] += a[0] / len;
        c[1] += a[1] / len;
        c[2] += a[2] / len;
      }
      var l = Math.sqrt(dot(n, n)) || 1;
      n = [n[0] / l, n[1] / l, n[2] / l];
      if (dot(n, [c[0] - inside[0], c[1] - inside[1], c[2] - inside[2]]) < 0) n = [-n[0], -n[1], -n[2]];
      f.n = n;
    });
    var map = {};
    m.edges = [];
    m.faces.forEach(function (f, fi) {
      for (var i = 0; i < f.v.length; i++) {
        var a = f.v[i], b = f.v[(i + 1) % f.v.length];
        var key = Math.min(a, b) + '-' + Math.max(a, b);
        if (!map[key]) {
          map[key] = { a: a, b: b, f: [] };
          m.edges.push(map[key]);
        }
        map[key].f.push(fi);
      }
    });
    m.R = 0;
    m.verts.forEach(function (v) {
      m.R = Math.max(m.R, Math.sqrt(dot(v, v)));
    });
    return m;
  }

  /** Prism: polygon end at the bottom and top, joined by side faces. Smooth = cylinder. */
  function prism(poly, h, smooth) {
    var n = poly.length, verts = [], faces = [];
    poly.forEach(function (p) {
      verts.push([p[0], -h / 2, p[1]]);
    });
    poly.forEach(function (p) {
      verts.push([p[0], h / 2, p[1]]);
    });
    faces.push({ v: U.range(0, n - 1), role: 'end' });
    faces.push({ v: U.range(n, 2 * n - 1), role: 'end' });
    for (var i = 0; i < n; i++) {
      var j = (i + 1) % n;
      faces.push({ v: [i, j, n + j, n + i], role: smooth ? 'curved' : 'side', smooth: !!smooth });
    }
    return finish({ verts: verts, faces: faces, n: n, kindOf: 'prism' }, [0, 0, 0]);
  }

  /** Pyramid: polygon base and one apex. Smooth = cone. */
  function pyramid(poly, h, smooth, yb) {
    if (yb == null) yb = -h / 2;
    var n = poly.length, verts = [], faces = [];
    poly.forEach(function (p) {
      verts.push([p[0], yb, p[1]]);
    });
    verts.push([0, yb + h, 0]);
    faces.push({ v: U.range(0, n - 1), role: 'base' });
    for (var i = 0; i < n; i++) faces.push({ v: [i, (i + 1) % n, n], role: smooth ? 'curved' : 'tri', smooth: !!smooth });
    var m = finish({ verts: verts, faces: faces, n: n, apex: n, kindOf: 'pyramid' }, [0, yb + h / 4, 0]);
    return m;
  }

  /* ---------------------------------------------------------------- *
   * The shapes. cat = the answer; everything else is computed from it.
   * ---------------------------------------------------------------- */
  var KINDS = {
    cube: { cat: 'prism', sides: 4, endName: 'square', name: 'Cube (square prism)', obj: 'a dice', fill: '#fff4cc', poly: rectPoly(1.4, 1.4), h: 1.4 },
    cuboid: { cat: 'prism', sides: 4, endName: 'rectangle', name: 'Cuboid (rectangular prism)', obj: 'a cereal box', fill: '#ffd9ab', poly: rectPoly(1.3, 0.55), h: 1.9 },
    triPrism: { cat: 'prism', sides: 3, endName: 'triangle', name: 'Triangular prism', obj: 'a chocolate-bar box', fill: '#f7ddb5', poly: regPoly(3, 0.62), h: 2.2, pose: 'lying' },
    pentPrism: { cat: 'prism', sides: 5, endName: 'pentagon', name: 'Pentagonal prism', obj: 'a gift box', fill: '#d6efc9', poly: regPoly(5, 0.8), h: 1.2 },
    hexPrism: { cat: 'prism', sides: 6, endName: 'hexagon', name: 'Hexagonal prism', obj: 'a pencil tin', fill: '#cfe5ff', poly: regPoly(6, 0.75), h: 1.5 },
    octPrism: { cat: 'prism', sides: 8, endName: 'octagon', name: 'Octagonal prism', obj: 'a cheese box', fill: '#e5d6ff', poly: regPoly(8, 0.85), h: 0.95 },
    triPyramid: { cat: 'pyramid', sides: 3, endName: 'triangle', name: 'Triangle-based pyramid', fill: '#fde6a8', poly: regPoly(3, 1), h: 1.35, pyr: true },
    sqPyramid: { cat: 'pyramid', sides: 4, endName: 'square', name: 'Square-based pyramid', obj: 'a glass paperweight', fill: '#d3ebff', poly: rectPoly(1.5, 1.5), h: 1.4, pyr: true },
    pentPyramid: { cat: 'pyramid', sides: 5, endName: 'pentagon', name: 'Pentagonal pyramid', fill: '#d8f3dc', poly: regPoly(5, 0.95), h: 1.4, pyr: true },
    hexPyramid: { cat: 'pyramid', sides: 6, endName: 'hexagon', name: 'Hexagonal pyramid', fill: '#ffdcc2', poly: regPoly(6, 0.95), h: 1.4, pyr: true },
    octPyramid: { cat: 'pyramid', sides: 8, endName: 'octagon', name: 'Octagonal pyramid', fill: '#f4d3e7', poly: regPoly(8, 0.95), h: 1.3, pyr: true },
    cylinder: { cat: 'neither', name: 'Cylinder', obj: 'a tin', fill: '#dde3ec', poly: regPoly(40, 0.7), h: 1.5, smooth: true },
    cone: { cat: 'neither', name: 'Cone', obj: 'a party hat', fill: '#ffc9d6', poly: regPoly(40, 0.75), h: 1.7, smooth: true, pyr: true },
    sphere: { cat: 'neither', name: 'Sphere', obj: 'a ball', fill: '#ffd59e', sphere: true },
  };
  var PRISMS = ['cube', 'cuboid', 'triPrism', 'pentPrism', 'hexPrism', 'octPrism'];
  var PYRAMIDS = ['triPyramid', 'sqPyramid', 'pentPyramid', 'hexPyramid', 'octPyramid'];
  var NAMED = PRISMS.slice();

  var models = {};
  function model(kind) {
    if (models[kind]) return models[kind];
    var K = KINDS[kind];
    var m;
    if (K.sphere) m = { sphere: true, R: 1, faces: [], edges: [], verts: [] };
    else if (K.pyr) m = pyramid(K.poly, K.h, K.smooth);
    else m = prism(K.poly, K.h, K.smooth);
    models[kind] = m;
    return m;
  }

  /** The three tests, worked out from the shape itself. */
  function props(kind) {
    var K = KINDS[kind];
    var curved = !!(K.smooth || K.sphere);
    return {
      ends: !K.sphere && !K.pyr, // a prism or a cylinder: two matching ends
      flat: !curved,
      apex: !!K.pyr, // a pyramid or a cone comes to one point
    };
  }
  function verdict(p) {
    if (p.ends && p.flat) return 'prism';
    if (p.flat && p.apex) return 'pyramid';
    return 'neither';
  }
  Object.keys(KINDS).forEach(function (k) {
    if (verdict(props(k)) !== KINDS[k].cat) console.error(ID + ': property mismatch for ' + k);
  });

  function shade(hex, k) {
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    function c(v) {
      return Math.max(0, Math.min(255, Math.round(v * k)));
    }
    return 'rgb(' + c(r) + ',' + c(g) + ',' + c(b) + ')';
  }

  function viewMatrix(st) {
    return mm(rx(st.pitch * D), mm(ry(st.yaw * D), POSES[st.pose] || I3));
  }
  function project(st, p, M) {
    var q = mv(M || viewMatrix(st), p);
    return [st.cx + st.s * q[0], st.cy - st.s * q[1]];
  }

  var PIPS = {
    1: [[0.5, 0.5]],
    2: [[0.27, 0.27], [0.73, 0.73]],
    3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
    4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
    5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
    6: [[0.27, 0.22], [0.27, 0.5], [0.27, 0.78], [0.73, 0.22], [0.73, 0.5], [0.73, 0.78]],
  };
  var DICE_FACES = [6, 1, 2, 3, 5, 4]; // bottom, top, then the four sides (opposite faces add to 7)

  function drawModel(g, kind, st) {
    MQ.clear(g);
    var K = KINDS[kind];
    var m = st.model || model(kind);
    var hl = st.hl || {};
    var hlF = st.hlFaces || {};
    var baseFill = st.fill || K.fill;
    if (m.sphere) {
      var r = st.s * m.R;
      var col = hl.curved ? HL[hl.curved].fill : baseFill;
      g.appendChild(S('circle', { cx: st.cx, cy: st.cy, r: r, fill: col, stroke: '#1b2a4a', 'stroke-width': 2.6, 'data-role': 'curved', 'data-fi': 0 }));
      var ery = Math.max(4, r * Math.abs(Math.sin(st.pitch * D)));
      g.appendChild(S('path', { d: 'M' + (st.cx - r) + ',' + st.cy + ' A' + r + ',' + ery + ' 0 0 0 ' + (st.cx + r) + ',' + st.cy, fill: 'none', stroke: '#1b2a4a', 'stroke-width': 1.8, 'pointer-events': 'none' }));
      g.appendChild(S('path', { d: 'M' + (st.cx - r) + ',' + st.cy + ' A' + r + ',' + ery + ' 0 0 1 ' + (st.cx + r) + ',' + st.cy, fill: 'none', stroke: '#7a869f', 'stroke-width': 1.6, 'stroke-dasharray': '5 5', 'pointer-events': 'none' }));
      g.appendChild(S('ellipse', { cx: st.cx - r * 0.38, cy: st.cy - r * 0.42, rx: r * 0.2, ry: r * 0.12, fill: 'rgba(255,255,255,.75)', transform: 'rotate(-35 ' + (st.cx - r * 0.38) + ' ' + (st.cy - r * 0.42) + ')', 'pointer-events': 'none' }));
      return;
    }
    var M = viewMatrix(st);
    var pts = m.verts.map(function (v) {
      return project(st, v, M);
    });
    var nz = m.faces.map(function (f) {
      return mv(M, f.n);
    });
    var front = nz.map(function (n) {
      return n[2] > 1e-4;
    });
    function ptsOf(f) {
      return f.v
        .map(function (i) {
          return pts[i][0].toFixed(1) + ',' + pts[i][1].toFixed(1);
        })
        .join(' ');
    }
    // visible faces (a convex solid: front faces never overlap)
    m.faces.forEach(function (f, fi) {
      if (!front[fi]) return;
      var k = 0.8 + 0.24 * Math.max(0, dot(nz[fi], LIGHT));
      var key = hlF[fi] || hl[f.role];
      var c = shade(key ? HL[key].fill : baseFill, key ? 0.93 + 0.08 * (k - 0.8) / 0.24 : k);
      g.appendChild(S('polygon', { points: ptsOf(f), fill: c, stroke: c, 'stroke-width': 0.8, 'stroke-linejoin': 'round', 'data-role': f.role, 'data-fi': fi, class: 'pyr-face' }));
    });
    // hidden faces that are highlighted: dashed coloured outline
    m.faces.forEach(function (f, fi) {
      var key = hlF[fi] || hl[f.role];
      if (front[fi] || !key || f.smooth) return;
      g.appendChild(S('polygon', { points: ptsOf(f), fill: 'none', stroke: HL[key].stroke, 'stroke-width': 2.6, 'stroke-dasharray': '6 5', 'pointer-events': 'none' }));
    });
    // edges: hidden ones dashed, visible ones solid; smooth seams only at the outline
    var hidden = [], vis = [];
    m.edges.forEach(function (e) {
      var f1 = m.faces[e.f[0]], f2 = m.faces[e.f[1]];
      var fr = (front[e.f[0]] ? 1 : 0) + (front[e.f[1]] ? 1 : 0);
      if (f1.smooth && f2.smooth) {
        if (fr === 1) vis.push(e);
      } else if (fr > 0) vis.push(e);
      else hidden.push(e);
    });
    hidden.forEach(function (e) {
      g.appendChild(S('line', { x1: pts[e.a][0], y1: pts[e.a][1], x2: pts[e.b][0], y2: pts[e.b][1], stroke: '#7a869f', 'stroke-width': 1.7, 'stroke-dasharray': '5 5', 'pointer-events': 'none' }));
    });
    vis.forEach(function (e) {
      g.appendChild(S('line', { x1: pts[e.a][0], y1: pts[e.a][1], x2: pts[e.b][0], y2: pts[e.b][1], stroke: '#1b2a4a', 'stroke-width': 2.6, 'stroke-linecap': 'round', 'pointer-events': 'none' }));
    });
    if (st.pips && kind === 'cube') {
      m.faces.forEach(function (f, fi) {
        if (!front[fi] || nz[fi][2] < 0.12) return;
        var p0 = pts[f.v[0]], p1 = pts[f.v[1]], p3 = pts[f.v[3]];
        PIPS[DICE_FACES[fi]].forEach(function (uv) {
          var x = p0[0] + uv[0] * (p1[0] - p0[0]) + uv[1] * (p3[0] - p0[0]);
          var y = p0[1] + uv[0] * (p1[1] - p0[1]) + uv[1] * (p3[1] - p0[1]);
          g.appendChild(S('circle', { cx: x, cy: y, r: st.s * 0.085 * Math.max(0.45, nz[fi][2]), fill: '#1b2a4a', 'pointer-events': 'none' }));
        });
      });
    }
    if (st.slice != null && m.kindOf === 'prism') {
      var n = m.n, t = st.slice;
      var sp = [];
      for (var i = 0; i < n; i++) {
        var a = m.verts[i], b = m.verts[n + i];
        sp.push(project(st, [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])], M));
      }
      g.appendChild(S('polygon', { points: sp.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '), fill: 'rgba(255,159,28,.55)', stroke: '#e76f00', 'stroke-width': 3, 'stroke-linejoin': 'round', 'pointer-events': 'none', class: 'pyr-slice' }));
    }
    if (st.apexDot && m.apex != null) {
      var ap = pts[m.apex];
      g.appendChild(S('circle', { cx: ap[0], cy: ap[1], r: 7, fill: HL.orange.stroke, stroke: '#fff', 'stroke-width': 2, 'pointer-events': 'none' }));
    }
  }

  /**
   * An SVG picture of one shape. o: { pose, W, H, pad, yaw, pitch, hl, drag, onFace, onTurn, pips, cls }.
   * Returns { svg, st, redraw() }.
   */
  function viewer(api, kind, o) {
    o = o || {};
    var W = o.W || 360, H = o.H || 250;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'pyr-svg' + (o.cls ? ' ' + o.cls : '') + (o.drag ? ' pyr-turnable' : ''), style: { width: W + 'px' }, role: 'img', 'aria-label': KINDS[kind].name });
    var g = S('g');
    root.appendChild(g);
    var m = o.model || model(kind);
    var st = {
      yaw: o.yaw != null ? o.yaw : -32,
      pitch: o.pitch != null ? o.pitch : 22,
      pose: o.pose || 'stand',
      hl: o.hl || {},
      hlFaces: {},
      cx: W / 2,
      cy: H / 2,
      s: o.s || (Math.min(W, H) / 2 - (o.pad != null ? o.pad : 14)) / m.R,
      fill: o.fill,
      pips: o.pips,
      apexDot: o.apexDot,
      slice: null,
      model: o.model,
    };
    var v = {
      svg: root,
      g: g,
      st: st,
      kind: kind,
      redraw: function () {
        drawModel(g, kind, st);
      },
    };
    if (o.drag) {
      var y0, p0, tgt, moved;
      var un = MQ.ui.drag(root, root, {
        start: function (p, e) {
          y0 = st.yaw;
          p0 = st.pitch;
          tgt = e && e.target;
          moved = false;
        },
        move: function (p, dx, dy) {
          if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
          if (!moved) return;
          st.yaw = y0 + dx * 0.9;
          st.pitch = U.clamp(p0 + dy * 0.4, -30, 70);
          v.redraw();
          if (o.onTurn) o.onTurn(st);
        },
        end: function () {
          if (!moved && o.onFace && tgt && tgt.getAttribute && tgt.getAttribute('data-role')) o.onFace(tgt.getAttribute('data-role'), +tgt.getAttribute('data-fi'));
        },
      });
      api.cleanup(un);
    } else if (o.onFace) {
      root.addEventListener('click', function (e) {
        var t = e.target;
        if (t && t.getAttribute && t.getAttribute('data-role')) o.onFace(t.getAttribute('data-role'), +t.getAttribute('data-fi'));
      });
    }
    v.redraw();
    return v;
  }

  /** Turn a viewer smoothly by `delta` degrees (uses api.later so it stops when the screen changes). */
  function spin(api, v, delta, done) {
    var steps = 14, y0 = v.st.yaw;
    function step(i) {
      return function () {
        v.st.yaw = y0 + (delta * i) / steps;
        v.redraw();
        if (i === steps && done) done();
      };
    }
    for (var i = 1; i <= steps; i++) api.later(step(i), i * 40);
  }

  function evidence(kind) {
    var K = KINDS[kind];
    if (K.cat === 'prism') return { hl: { end: 'gold' } };
    if (K.cat === 'pyramid') return { hl: { base: 'gold' }, apexDot: true };
    if (kind === 'cylinder') return { hl: { end: 'gold', curved: 'orange' } };
    if (kind === 'cone') return { hl: { curved: 'orange' }, apexDot: true };
    return { hl: { curved: 'orange' } };
  }
  function showEvidence(v) {
    var ev = evidence(v.kind);
    v.st.hl = ev.hl;
    v.st.apexDot = !!ev.apexDot;
    v.redraw();
  }

  var CAT_WORD = { prism: 'Prism', pyramid: 'Pyramid', neither: 'Neither' };
  function catPhrase(cat) {
    return cat === 'neither' ? 'neither a prism nor a pyramid' : 'a ' + cat;
  }

  /** ✓/✗ card for the three tests. focus = the row to point at. */
  function checklist(kind, focus) {
    var p = props(kind);
    var rows = [
      ['ends', 'Two matching ends'],
      ['flat', 'All faces flat'],
      ['apex', 'Sides meet at one point'],
    ];
    var cat = KINDS[kind].cat;
    var why = cat === 'prism' ? 'Matching ends + flat faces' : cat === 'pyramid' ? 'Flat faces + one point' : kind === 'cylinder' ? 'Matching ends, but a curved side' : kind === 'cone' ? 'A point, but a curved side' : 'Curved all over';
    return el(
      'div',
      { class: 'pyr-card pyr-check' },
      rows.map(function (r) {
        return el('div', { class: 'pyr-ck-row ' + (p[r[0]] ? 'pyr-yes' : 'pyr-no') + (focus === r[0] ? ' pyr-focus' : '') }, el('span', { class: 'pyr-ck-ic' }, p[r[0]] ? '✓' : '✗'), el('span', null, r[1]));
      }),
      el('div', { class: 'pyr-ck-why' }, why + ':'),
      el('div', { class: 'pyr-ck-verdict pyr-v-' + cat }, CAT_WORD[cat] === 'Neither' ? 'Neither!' : CAT_WORD[cat] + '!')
    );
  }

  /** Flat drawing of a prism's end with its sides numbered (for naming). */
  function endPicture(kind) {
    var K = KINDS[kind];
    var W = 190, H = 170, cx = W / 2, cy = H / 2;
    var poly = K.poly;
    var R = 0;
    poly.forEach(function (p) {
      R = Math.max(R, Math.abs(p[0]), Math.abs(p[1]));
    });
    var s = 58 / R;
    var pts = poly.map(function (p) {
      return [cx + p[0] * s, cy - p[1] * s];
    });
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'pyr-svg pyr-endpic', style: { width: W + 'px' } });
    root.appendChild(S('polygon', { points: pts.map(function (p) { return p.join(','); }).join(' '), fill: HL.gold.fill, stroke: '#1b2a4a', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    pts.forEach(function (p, i) {
      var q = pts[(i + 1) % pts.length];
      var mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      var dx = mx - cx, dy = my - cy, l = Math.sqrt(dx * dx + dy * dy) || 1;
      var lx = mx + (dx / l) * 16, ly = my + (dy / l) * 16;
      root.appendChild(S('circle', { cx: lx, cy: ly, r: 11, fill: '#fff', stroke: '#c2410c', 'stroke-width': 2 }));
      root.appendChild(S('text', { x: lx, y: ly + 5, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 800, fill: '#c2410c' }, String(i + 1)));
    });
    return root;
  }

  /* ---------------------------------------------------------------- *
   * Hints and mistake tags
   * ---------------------------------------------------------------- */
  var T = {
    cyl: 'Called a cylinder (tin) a prism',
    cone: 'Called a cone a pyramid',
    turn: 'Missed a shape that was lying down or upside down',
    cube: 'Did not count a cube or cuboid as a prism',
    onlyTri: 'Missed prisms with 5, 6 or 8-sided ends',
    mix: 'Mixed up prisms and pyramids',
    curved: 'Gave a curved shape a prism or pyramid name',
    name: 'Named a prism by the wrong end shape',
  };

  function tagFor(kind, pose, chosen) {
    var K = KINDS[kind];
    var turned = pose && pose !== 'stand' && !(kind === 'triPrism' && pose === 'lying');
    if (kind === 'cylinder') return chosen === 'prism' ? T.cyl : T.curved;
    if (kind === 'cone') return chosen === 'pyramid' ? T.cone : T.curved;
    if (kind === 'sphere') return T.curved;
    if (K.cat === 'prism') {
      if (kind === 'cube' || kind === 'cuboid') return T.cube;
      if (turned) return T.turn;
      if (chosen === 'neither' && K.sides >= 5) return T.onlyTri;
      return T.mix;
    }
    return turned ? T.turn : T.mix;
  }

  function hintSingle(kind, pose, chosen, t) {
    var K = KINDS[kind];
    var turned = pose && pose !== 'stand' && kind !== 'triPrism';
    if (kind === 'cylinder') {
      if (chosen === 'prism') return t ? 'A tin has matching ends, but its side is curved: it rolls! A prism has only flat faces, so it is neither.' : 'Yes, the two circle ends match. But are ALL its faces flat? Look at the side.';
      return t ? 'A pyramid has flat triangle faces that meet at a point. A tin has no point and a curved side.' : 'Does it come to a point? Look at the ends.';
    }
    if (kind === 'cone') {
      if (chosen === 'pyramid') return t ? 'A pyramid has flat triangle faces. This has a circle base and a curved side, so it is neither.' : 'It does have a point! But is its side flat or curved?';
      return t ? 'A prism needs two matching ends. This has one circle and a point. Its side is curved too.' : 'Does it have two matching ends?';
    }
    if (kind === 'sphere') return t ? 'A ball has no flat faces, no ends and no point. It is curved all over: neither.' : 'Does a ball have any flat faces?';
    if (K.cat === 'prism') {
      if (chosen === 'pyramid') return t ? 'There is no point where the faces meet. The two ' + K.endName + ' ends match: it is a prism.' : turned ? 'It is ' + POSE_WORD[pose] + '. Drag to turn it. Does it come to a point?' : 'Look for a point where the faces meet. Is there one?';
      if (kind === 'cube' || kind === 'cuboid') return t ? 'Boxes count! Opposite ends match and every face is flat, so it is a prism.' : 'Are any faces curved? Do the opposite ends match?';
      return t ? 'All its faces are flat and its two ' + K.endName + ' ends match. So it is a prism.' : 'Are any faces curved? Look for two ends that match.';
    }
    // pyramid
    if (chosen === 'prism') return t ? 'Its triangle faces meet at one point, the apex. That makes it a pyramid.' : turned ? 'It is ' + POSE_WORD[pose] + '. Find the ' + K.endName + ' base. Is the other end a matching ' + K.endName + ', or a point?' : 'Do the top and bottom match? Look at the top.';
    return t ? 'All its faces are flat, and the triangles meet at one point. It is a pyramid.' : 'Are any of its faces curved? Look for one point where the triangles meet.';
  }

  function praiseSingle(kind, pose) {
    var K = KINDS[kind];
    var lead = pose && pose !== 'stand' && kind !== 'triPrism' ? 'Even ' + POSE_WORD[pose] + ', ' : '';
    if (kind === 'cube' || kind === 'cuboid') return 'Yes! Matching ends and all flat faces: a box is a prism.';
    if (K.cat === 'prism') return 'Yes! ' + (lead ? lead + 'it' : 'It') + ' has two matching ' + K.endName + ' ends: a prism.';
    if (K.cat === 'pyramid') return 'Yes! ' + (lead ? lead + 'its' : 'Its') + ' triangles meet at one point: a pyramid.';
    if (kind === 'cylinder') return 'Yes! Matching ends, but a curved side: neither.';
    if (kind === 'cone') return 'Yes! It has a point, but its side is curved: neither.';
    return 'Yes! Curved all over: neither.';
  }

  /* ---------------------------------------------------------------- *
   * Deck
   * ---------------------------------------------------------------- */
  function prismPose(k) {
    if (k === 'triPrism') return U.pick(['lying', 'stand']);
    if (k === 'cube') return 'stand';
    return U.pick(['stand', 'lying']);
  }
  function pyramidPose() {
    return U.pick(['stand', 'upside', 'tipped']);
  }
  function anyPose(k) {
    var K = KINDS[k];
    if (K.cat === 'prism') return prismPose(k);
    if (K.cat === 'pyramid') return pyramidPose();
    if (k === 'cylinder') return U.pick(['stand', 'lying']);
    if (k === 'cone') return U.pick(['stand', 'upside']);
    return 'stand';
  }
  // Board tiles are small and cannot be turned, so only use poses that read clearly at that size:
  // a triangular prism lying down (triangle end showing), pyramids standing or upside down.
  function boardPose(k) {
    var K = KINDS[k];
    if (k === 'triPrism') return 'lying';
    if (K.cat === 'pyramid') return k === 'triPyramid' ? 'upside' : U.pick(['stand', 'upside']);
    if (K.cat === 'prism') return prismPose(k);
    return anyPose(k);
  }
  function isTurned(it) {
    return it.pose !== 'stand' && it.kind !== 'triPrism' && it.kind !== 'cube';
  }

  var TURNED = [
    { kind: 'sqPyramid', pose: 'tipped' },
    { kind: 'pentPyramid', pose: 'upside' },
    { kind: 'hexPyramid', pose: 'upside' },
    { kind: 'triPyramid', pose: 'upside' },
    { kind: 'cylinder', pose: 'lying' },
    { kind: 'hexPrism', pose: 'lying' },
    { kind: 'pentPrism', pose: 'lying' },
    { kind: 'octPrism', pose: 'lying' },
    { kind: 'cuboid', pose: 'lying' },
    { kind: 'cone', pose: 'upside' },
  ];

  function board8() {
    var pr = [U.pick(['cube', 'cuboid']), U.pick(['pentPrism', 'hexPrism', 'octPrism'])];
    U.shuffle(PRISMS.filter(function (k) {
      return pr.indexOf(k) < 0;
    }))
      .slice(0, 2)
      .forEach(function (k) {
        pr.push(k);
      });
    var items = pr.map(function (k) {
      return { kind: k, pose: boardPose(k) };
    });
    items[1].pose = 'lying'; // at least one prism lying on its side
    var non = ['cylinder'].concat(U.shuffle(['triPyramid', 'sqPyramid', 'pentPyramid', 'hexPyramid', 'octPyramid', 'cone', 'sphere']).slice(0, 3));
    non.forEach(function (k) {
      items.push({ kind: k, pose: boardPose(k) });
    });
    return { type: 'board', target: 'prism', items: U.shuffle(items) };
  }

  function board12() {
    var npy = U.pick([4, 5]);
    var py = U.shuffle(PYRAMIDS).slice(0, npy).map(function (k, i) {
      return { kind: k, pose: i < 2 || k === 'triPyramid' ? 'upside' : U.pick(['stand', 'stand', 'upside']) };
    });
    var items = py.concat([
      { kind: 'cone', pose: anyPose('cone') },
      { kind: 'cylinder', pose: anyPose('cylinder') },
      { kind: 'sphere', pose: 'stand' },
    ]);
    U.shuffle(PRISMS)
      .slice(0, 12 - items.length)
      .forEach(function (k) {
        items.push({ kind: k, pose: boardPose(k) });
      });
    return { type: 'board', target: 'pyramid', items: U.shuffle(items) };
  }

  function nameQ() {
    var k = U.pick(NAMED);
    var others = U.shuffle(NAMED.filter(function (x) {
      return x !== k && !(k === 'cube' && x === 'cuboid'); // a cube is also a cuboid, so never offer that as a wrong answer
    })).slice(0, 3);
    return { type: 'name', kind: k, pose: k === 'cube' ? 'stand' : U.pick(['stand', 'lying']), options: U.shuffle([k].concat(others)) };
  }

  var WHY = [
    {
      kind: 'cylinder',
      pose: 'stand',
      q: 'Why is this tin <b>not</b> a prism?',
      focus: 'flat',
      tag: 'Unsure why a cylinder is not a prism',
      opts: [
        { t: 'Its side is curved', ok: true },
        { t: 'Its two ends do not match', why: 'Look at the two circle ends. They DO match. Now look at the side.' },
        { t: 'It comes to a point', why: 'Does a tin have a point? Look at its side instead.' },
      ],
      explain: 'A prism must have only flat faces. A tin\'s side is curved (it rolls), so it is not a prism.',
    },
    {
      kind: 'cylinder',
      pose: 'lying',
      q: 'This tin is lying down. Why is it <b>not</b> a prism?',
      focus: 'flat',
      tag: 'Unsure why a cylinder is not a prism',
      opts: [
        { t: 'It has a curved surface', ok: true },
        { t: 'It is lying down', why: 'Lying down does not change a shape. Look at its faces.' },
        { t: 'Its ends do not match', why: 'Both ends are the same circle. Look at the side.' },
      ],
      explain: 'The ends match, but the side is curved. A prism has only flat faces.',
    },
    {
      kind: 'cone',
      pose: 'stand',
      q: 'Why is this party hat <b>not</b> a pyramid?',
      focus: 'flat',
      tag: T.cone,
      opts: [
        { t: 'Its side is curved', ok: true },
        { t: 'It has a point at the top', why: 'Pyramids have a point too! So that is not the reason. Look at its side.' },
        { t: 'It has a flat base', why: 'Pyramids have a flat base too. What is different about its side?' },
      ],
      explain: 'A pyramid has flat triangle faces. A cone has a curved side and a circle base.',
    },
    {
      kind: 'pyr',
      q: 'Why is this shape <b>not</b> a prism?',
      focus: 'ends',
      tag: T.mix,
      opts: [
        { t: 'It has a point, not two matching ends', ok: true },
        { t: 'It has a curved surface', why: 'Look closely: all its faces are flat.' },
        { t: 'A prism cannot have triangle faces', why: 'A triangular prism has triangle faces too! Look for two matching ends: are there two?' },
      ],
      explain: 'A prism needs two matching ends. This shape has one base, and its triangles meet at a point. It is a pyramid.',
    },
    {
      kind: 'sphere',
      pose: 'stand',
      q: 'Why is a ball <b>not</b> a prism or a pyramid?',
      focus: 'flat',
      tag: T.curved,
      opts: [
        { t: 'It is curved all over', ok: true },
        { t: 'It is too small', why: 'Size does not matter for a shape. Does it have any flat faces?' },
        { t: 'It has two matching ends', why: 'A ball has no ends at all. What is its surface like?' },
      ],
      explain: 'Prisms and pyramids have flat faces. A ball has no flat faces at all.',
    },
  ];

  function whyQ() {
    var w = U.pick(WHY);
    var q = { type: 'why', w: w, kind: w.kind, pose: w.pose, opts: U.shuffle(w.opts) };
    if (w.kind === 'pyr') {
      q.kind = U.pick(['sqPyramid', 'pentPyramid', 'hexPyramid', 'triPyramid']);
      q.pose = U.pick(['stand', 'upside']);
    }
    return q;
  }

  function oddQ() {
    var type = U.pick(['A', 'B', 'C', 'D']);
    var three, odd;
    if (type === 'A' || type === 'C') {
      three = U.shuffle(PRISMS).slice(0, 3).map(function (k) {
        return { kind: k, pose: prismPose(k) };
      });
      odd = type === 'A' ? { kind: U.pick(PYRAMIDS), pose: pyramidPose() } : { kind: 'cylinder', pose: anyPose('cylinder') };
    } else {
      three = U.shuffle(PYRAMIDS).slice(0, 3).map(function (k) {
        return { kind: k, pose: pyramidPose() };
      });
      odd = type === 'B' ? { kind: U.pick(PRISMS), pose: 'stand' } : { kind: 'cone', pose: 'stand' };
    }
    var items = U.shuffle(three.concat([odd]));
    return { type: 'odd', items: items, odd: items.indexOf(odd), group: KINDS[three[0].kind].cat };
  }

  function buildDeck() {
    var q = [];
    // Level 1: everyday objects, one at a time
    var l1 = [U.pick(['cube', 'cuboid']), U.pick(['cylinder', 'cone']), 'sqPyramid'];
    l1.push(U.pick(['cube', 'cuboid', 'triPrism', 'cylinder', 'cone', 'sphere'].filter(function (k) {
      return l1.indexOf(k) < 0;
    })));
    U.shuffle(l1).forEach(function (k) {
      q.push({ type: 'single', kind: k, pose: KINDS[k].pose || 'stand', caption: KINDS[k].obj });
    });
    // Level 2: turned shapes, a board of prisms, naming
    var tu = U.pick(TURNED);
    q.push({ type: 'single', kind: tu.kind, pose: tu.pose });
    q.push(board8());
    q.push(nameQ());
    // Level 3: why not?, odd one out, a big board of pyramids
    q.push(whyQ());
    q.push(oddQ());
    q.push(board12());
    return q;
  }

  /* ---------------------------------------------------------------- *
   * Practice renderers
   * ---------------------------------------------------------------- */
  function catChoices(onPick) {
    return MQ.ui.choices(
      [
        { label: 'Prism', value: 'prism' },
        { label: 'Pyramid', value: 'pyramid' },
        { label: 'Neither', value: 'neither' },
      ],
      onPick,
      { columns: 3 }
    );
  }

  function renderSingle(stage, api, q) {
    var K = KINDS[q.kind];
    var turnedWord = q.caption ? null : POSE_WORD[q.pose];
    api.say(q.caption ? 'Two matching ends? A point? Curved?' : 'Drag it to turn it. Is it a prism, a pyramid or neither?', 'think');
    var wrap = el('div', { class: 'pyr-q', 'data-type': 'single', 'data-ans': K.cat });
    wrap.appendChild(MQ.ui.prompt(q.caption ? 'Is ' + q.caption + ' a <b>prism</b>, a <b>pyramid</b> or <b>neither</b>?' : (turnedWord ? 'This shape is <b>' + turnedWord + '</b>. ' : '') + 'Prism, pyramid or neither?'));
    var v = viewer(api, q.kind, { pose: q.pose, drag: true, pips: !!q.caption, W: 360, H: 240 });
    var side = el('div', { class: 'pyr-side' });
    wrap.appendChild(el('div', { class: 'pyr-row' }, el('div', { class: 'pyr-viewbox' }, v.svg, el('div', { class: 'pyr-dragnote' }, '↔ drag to turn')), side));
    var ch = catChoices(function (val) {
      if (val === K.cat) {
        ch.mark(val, 'good');
        ch.disable();
        showEvidence(v);
        side.appendChild(checklist(q.kind));
        api.check(true, praiseSingle(q.kind, q.pose));
      } else {
        ch.mark(val, 'bad');
        api.check(false, hintSingle(q.kind, q.pose, val, api.tries()), tagFor(q.kind, q.pose, val));
      }
    });
    wrap.appendChild(ch);
    stage.appendChild(wrap);
    api.onReveal(function () {
      ch.mark(K.cat, 'good');
      ch.disable();
      showEvidence(v);
      MQ.clear(side).appendChild(checklist(q.kind, K.cat === 'prism' ? 'ends' : K.cat === 'pyramid' ? 'apex' : 'flat'));
      api.feedback(K.name + ': ' + catPhrase(K.cat) + '. ' + (K.cat === 'prism' ? 'Gold = the two matching ends.' : K.cat === 'pyramid' ? 'Gold = the base, orange dot = the point (apex).' : 'Orange = the curved surface.'), 'info');
    });
  }

  function renderBoard(stage, api, q) {
    var target = q.target;
    var want = q.items.filter(function (it) {
      return KINDS[it.kind].cat === target;
    }).length;
    api.say(target === 'prism' ? 'Find every prism, even ones lying down!' : 'Find every pyramid, even upside-down ones!', 'think');
    var wrap = el('div', { class: 'pyr-q', 'data-type': 'board', 'data-ans': target });
    wrap.appendChild(MQ.ui.prompt('Click <b>all the ' + target + 's</b>. Then press Check.'));
    var finished = false;
    var board = el('div', { class: 'pyr-board' + (q.items.length > 8 ? ' pyr-board-big' : '') });
    var tiles = q.items.map(function (it) {
      var t = el('button', { class: 'pyr-tile', type: 'button', 'data-cat': KINDS[it.kind].cat, 'data-kind': it.kind, 'aria-pressed': 'false' });
      var v = viewer(api, it.kind, { pose: it.pose, W: 150, H: 116, pad: 9 });
      t.appendChild(v.svg);
      t.appendChild(el('span', { class: 'pyr-tag' }));
      t.view = v;
      t.item = it;
      t.addEventListener('click', function () {
        if (finished) return;
        var on = !t.classList.contains('pyr-on');
        t.classList.toggle('pyr-on', on);
        t.classList.remove('pyr-bad');
        t.setAttribute('aria-pressed', on ? 'true' : 'false');
        MQ.sound('click');
      });
      board.appendChild(t);
      return t;
    });
    wrap.appendChild(board);
    var btn = el('button', { class: 'btn pyr-checkbtn', type: 'button' }, 'Check ✓');
    wrap.appendChild(btn);
    stage.appendChild(wrap);

    function label(t) {
      var cat = KINDS[t.item.kind].cat;
      t.querySelector('.pyr-tag').textContent = cat;
      t.classList.add('pyr-labelled', 'pyr-c-' + cat);
    }
    function lock() {
      finished = true;
      btn.disabled = true;
      tiles.forEach(function (t) {
        t.disabled = true;
      });
    }

    btn.addEventListener('click', function () {
      if (finished) return;
      var missed = [], extra = [], found = 0;
      tiles.forEach(function (t) {
        var isT = KINDS[t.item.kind].cat === target;
        var on = t.classList.contains('pyr-on');
        if (isT && on) found++;
        if (isT && !on) missed.push(t.item);
        if (!isT && on) extra.push(t.item);
      });
      if (!missed.length && !extra.length) {
        tiles.forEach(function (t) {
          if (KINDS[t.item.kind].cat === target) {
            t.classList.add('pyr-good');
            showEvidence(t.view);
          }
          label(t);
        });
        lock();
        api.check(true, 'All ' + want + ' ' + target + 's found!');
        return;
      }
      var tr = api.tries();
      var hint, tag;
      function has(list, fn) {
        return list.some(fn);
      }
      if (target === 'prism') {
        if (has(extra, function (i) { return i.kind === 'cylinder'; })) {
          hint = 'One you picked has a curved side. Prisms have only flat faces.';
          tag = T.cyl;
        } else if (has(missed, function (i) { return i.kind === 'cube' || i.kind === 'cuboid'; })) {
          hint = 'Boxes count too! A cube and a cuboid are prisms.';
          tag = T.cube;
        } else if (has(missed, isTurned)) {
          hint = 'Some prisms are lying down. Look for two matching ends.';
          tag = T.turn;
        } else if (has(missed, function (i) { return KINDS[i.kind].sides >= 5; })) {
          hint = 'Prisms can have ends with 5, 6 or 8 sides too.';
          tag = T.onlyTri;
        } else if (has(extra, function (i) { return i.kind === 'sphere' || i.kind === 'cone'; })) {
          hint = 'One you picked is curved. Prisms have only flat faces.';
          tag = T.curved;
        } else {
          hint = missed.length ? 'You missed a prism. Look for two matching ends.' : 'One you picked comes to a point. That is a pyramid.';
          tag = T.mix;
        }
      } else {
        if (has(extra, function (i) { return i.kind === 'cone'; })) {
          hint = 'One you picked has a curved side and a circle base. Pyramids have flat triangle faces.';
          tag = T.cone;
        } else if (has(missed, isTurned)) {
          hint = 'Some pyramids are upside down or tipped over. Look for the point.';
          tag = T.turn;
        } else if (has(extra, function (i) { return i.kind === 'cylinder' || i.kind === 'sphere'; })) {
          hint = 'One you picked is curved. Pyramids have only flat faces.';
          tag = T.curved;
        } else {
          hint = missed.length ? 'You missed a pyramid. Look for triangles meeting at a point.' : 'One you picked has two matching ends. That is a prism.';
          tag = T.mix;
        }
      }
      if (tr >= 1) {
        hint += ' There are ' + want + ' ' + target + 's. You have ' + found + (extra.length ? ' and ' + extra.length + ' wrong (marked).' : '.');
        tiles.forEach(function (t) {
          if (t.classList.contains('pyr-on') && KINDS[t.item.kind].cat !== target) t.classList.add('pyr-bad');
        });
      }
      api.check(false, hint, tag);
    });

    api.onReveal(function () {
      tiles.forEach(function (t) {
        var isT = KINDS[t.item.kind].cat === target;
        t.classList.toggle('pyr-on', isT);
        t.classList.remove('pyr-bad');
        if (isT) {
          t.classList.add('pyr-good');
          showEvidence(t.view);
        }
        label(t);
      });
      lock();
      api.feedback(
        target === 'prism' ? 'The ' + want + ' prisms have two matching ends (gold) and only flat faces. Pyramids come to a point; tins, cones and balls are curved.' : 'The ' + want + ' pyramids have a flat base (gold) and triangles meeting at one point (orange dot). A cone is curved, so it is not one.',
        'info'
      );
    });
  }

  function renderName(stage, api, q) {
    var K = KINDS[q.kind];
    api.say('Prisms are named after their ends. Count the sides of the gold end.', 'think');
    var wrap = el('div', { class: 'pyr-q', 'data-type': 'name', 'data-ans': K.name });
    wrap.appendChild(MQ.ui.prompt('What is this prism called?'));
    var v = viewer(api, q.kind, { pose: q.pose, drag: true, W: 340, H: 230, pitch: q.pose === 'stand' ? 34 : 22, hl: { end: 'gold' } });
    var side = el('div', { class: 'pyr-side' });
    wrap.appendChild(el('div', { class: 'pyr-row' }, el('div', { class: 'pyr-viewbox' }, v.svg, el('div', { class: 'pyr-dragnote' }, '↔ drag to turn')), side));
    var ch = MQ.ui.choices(
      q.options.map(function (k) {
        return { label: KINDS[k].name, value: k };
      }),
      function (val) {
        if (val === q.kind) {
          ch.mark(val, 'good');
          ch.disable();
          side.appendChild(endPicture(q.kind));
          api.check(true, 'Yes! ' + K.sides + ' sides: a ' + K.endName + ' end. ' + K.name + '.');
        } else {
          ch.mark(val, 'bad');
          var P = KINDS[val];
          var hint;
          var boxMix = (q.kind === 'cube' && val === 'cuboid') || (q.kind === 'cuboid' && val === 'cube');
          if (boxMix) hint = api.tries() >= 1
            ? (q.kind === 'cube' ? 'Every side of the gold end is the same length, and every face is a square. That is a cube.' : 'The gold end has two long sides and two short sides. Not all squares, so it is a cuboid.')
            : 'Look at the gold end. Are all 4 sides the same length?';
          else if (api.tries() >= 1) hint = 'The gold end has ' + K.sides + ' sides. ' + K.sides + ' sides make a ' + K.endName + '.';
          else hint = 'Count the sides of the gold end. A ' + P.endName + ' has ' + P.sides + ' sides. Does the gold end?';
          api.check(false, hint, T.name);
        }
      },
      { columns: 2 }
    );
    wrap.appendChild(ch);
    stage.appendChild(wrap);
    api.onReveal(function () {
      ch.mark(q.kind, 'good');
      ch.disable();
      MQ.clear(side).appendChild(endPicture(q.kind));
      api.feedback('Count the sides of the end: ' + U.range(1, K.sides).join(', ') + '. A ' + K.endName + ' end, so it is a ' + K.name.toLowerCase() + '.', 'info');
    });
  }

  function renderWhy(stage, api, q) {
    var w = q.w;
    api.say('Which reason is true?', 'think');
    var correct = w.opts.filter(function (o) {
      return o.ok;
    })[0];
    var wrap = el('div', { class: 'pyr-q', 'data-type': 'why', 'data-ans': correct.t });
    wrap.appendChild(MQ.ui.prompt(w.q));
    var v = viewer(api, q.kind, { pose: q.pose, drag: true, W: 330, H: 220 });
    var side = el('div', { class: 'pyr-side' });
    wrap.appendChild(el('div', { class: 'pyr-row' }, el('div', { class: 'pyr-viewbox' }, v.svg, el('div', { class: 'pyr-dragnote' }, '↔ drag to turn')), side));
    var ch = MQ.ui.choices(
      q.opts.map(function (o) {
        return { label: o.t, value: o.t };
      }),
      function (val) {
        var o = q.opts.filter(function (x) {
          return x.t === val;
        })[0];
        if (o.ok) {
          ch.mark(val, 'good');
          ch.disable();
          showEvidence(v);
          side.appendChild(checklist(q.kind, w.focus));
          api.check(true, 'Yes! ' + w.explain);
        } else {
          ch.mark(val, 'bad');
          api.check(false, api.tries() >= 1 ? w.explain : o.why, w.tag);
        }
      },
      { columns: 1 }
    );
    wrap.appendChild(ch);
    stage.appendChild(wrap);
    api.onReveal(function () {
      ch.mark(correct.t, 'good');
      ch.disable();
      showEvidence(v);
      MQ.clear(side).appendChild(checklist(q.kind, w.focus));
      api.feedback(w.explain, 'info');
    });
  }

  function renderOdd(stage, api, q) {
    var group = q.group;
    api.say('Three are the same kind. One is different!', 'think');
    var wrap = el('div', { class: 'pyr-q', 'data-type': 'odd', 'data-ans': String(q.odd) });
    wrap.appendChild(MQ.ui.prompt('Which one is the <b>odd one out</b>?'));
    var views = [];
    var tags = [];
    var ch = MQ.ui.choices(
      q.items.map(function (it, i) {
        var v = viewer(api, it.kind, { pose: it.pose, W: 150, H: 120, pad: 10 });
        views.push(v);
        var tag = el('span', { class: 'pyr-tag' });
        tags.push(tag);
        return { label: el('span', { class: 'pyr-oo', 'data-i': i, 'data-cat': KINDS[it.kind].cat }, v.svg, tag), value: i };
      }),
      function (val) {
        if (val === q.odd) {
          ch.mark(val, 'good');
          ch.disable();
          labelAll();
          api.check(true, 'Yes! The others are ' + group + 's. This one is ' + catPhrase(KINDS[q.items[q.odd].kind].cat) + '.');
        } else {
          ch.mark(val, 'bad');
          var it = q.items[val];
          var oddK = q.items[q.odd].kind;
          var tag = isTurned(it) ? T.turn : oddK === 'cylinder' ? T.cyl : oddK === 'cone' ? T.cone : T.mix;
          var hint = api.tries() >= 1 ? 'Three of them are ' + group + 's. Which one is not a ' + group + '?' + (oddK === 'cylinder' ? ' Look for a curved side.' : oddK === 'cone' ? ' Look for a curved side.' : '') : 'That one is ' + catPhrase(group) + (isTurned(it) ? ', just turned round' : '') + '. Find one that is different from the rest.';
          api.check(false, hint, tag);
        }
      },
      { columns: 4 }
    );
    ch.classList.add('pyr-oochoices');
    function labelAll() {
      q.items.forEach(function (it, i) {
        tags[i].textContent = KINDS[it.kind].cat;
        tags[i].className = 'pyr-tag pyr-c-' + KINDS[it.kind].cat;
        showEvidence(views[i]);
      });
    }
    wrap.appendChild(ch);
    stage.appendChild(wrap);
    api.onReveal(function () {
      ch.mark(q.odd, 'good');
      ch.disable();
      labelAll();
      var oddCat = KINDS[q.items[q.odd].kind].cat;
      api.feedback('Three are ' + group + 's. The odd one out is ' + catPhrase(oddCat) + (q.items[q.odd].kind === 'cylinder' || q.items[q.odd].kind === 'cone' ? ': it has a curved side.' : '.'), 'info');
    });
  }

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */
  function learnPrism(stage, api) {
    api.say('This chocolate box is a prism. Slide the knife along it!', 'happy');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('The prism test', 'A prism has <b>two matching ends</b> and <b>only flat faces</b>.'));
    var W = 420;
    var ends = {};
    var sliceDone = false, seenA = false, seenB = false, unlocked = false;
    var v = viewer(api, 'triPrism', { pose: 'lying', W: W, H: 230, yaw: -28, pitch: 20, pad: 8, onFace: onFace });
    v.st.slice = 0.5;
    v.redraw();
    var sliceEnd = function (t) {
      var m = model('triPrism');
      var c = [0, 0, 0];
      for (var i = 0; i < m.n; i++) {
        var a = m.verts[i], b = m.verts[m.n + i];
        c[0] += (a[0] + t * (b[0] - a[0])) / m.n;
        c[1] += (a[1] + t * (b[1] - a[1])) / m.n;
        c[2] += (a[2] + t * (b[2] - a[2])) / m.n;
      }
      return project(v.st, c)[0];
    };
    var x0 = sliceEnd(0), x1 = sliceEnd(1);
    var lo = Math.min(x0, x1), hi = Math.max(x0, x1);
    // knife track lined up with the box
    var ks = S('svg', { viewBox: '0 0 ' + W + ' 60', class: 'pyr-svg pyr-knife', style: { width: W + 'px' } });
    ks.appendChild(S('line', { x1: lo, y1: 30, x2: hi, y2: 30, stroke: '#c9d3ee', 'stroke-width': 8, 'stroke-linecap': 'round' }));
    var knob = S('g', { class: 'pyr-knob' });
    knob.appendChild(S('rect', { x: -26, y: 6, width: 52, height: 48, rx: 14, fill: 'transparent' }));
    knob.appendChild(S('path', { d: 'M0,6 L9,22 L9,40 L-9,40 L-9,22 Z', fill: '#e9eef5', stroke: '#4a5a7d', 'stroke-width': 2 }));
    knob.appendChild(S('rect', { x: -7, y: 40, width: 14, height: 16, rx: 4, fill: '#8d5a2b' }));
    ks.appendChild(knob);
    var kx = (lo + hi) / 2;
    function placeKnob() {
      knob.setAttribute('transform', 'translate(' + kx.toFixed(1) + ',0)');
    }
    placeKnob();
    var sliceCap = el('div', { class: 'pyr-slicecap' }, 'Slice');
    var tri = S('svg', { viewBox: '0 0 120 110', class: 'pyr-svg', style: { width: '120px' } }, S('polygon', { points: '60,10 112,100 8,100', fill: 'rgba(255,159,28,.55)', stroke: '#e76f00', 'stroke-width': 4, 'stroke-linejoin': 'round' }));
    var card = el('div', { class: 'pyr-card pyr-slicecard' }, tri, sliceCap, el('div', { class: 'pyr-small' }, 'Same triangle every time!'));
    var turnBtn = el('button', { class: 'btn btn-ghost pyr-turn', type: 'button' }, 'Turn it round ↻');
    turnBtn.addEventListener('click', function () {
      turnBtn.disabled = true;
      spin(api, v, 180, function () {
        turnBtn.disabled = false;
      });
    });
    stage.appendChild(el('div', { class: 'pyr-row' }, el('div', { class: 'pyr-viewbox' }, v.svg, ks), card));
    stage.appendChild(turnBtn);
    api.cleanup(
      MQ.ui.drag(ks, knob, {
        move: function (p) {
          kx = U.clamp(p.x, lo, hi);
          placeKnob();
          var t = (kx - x0) / (x1 - x0);
          v.st.slice = t;
          v.redraw();
          if (t < 0.06 || t > 0.94) sliceCap.textContent = 'An end!';
          else sliceCap.textContent = 'A slice in the middle';
          if (kx <= lo + 4) seenA = true;
          if (kx >= hi - 4) seenB = true;
          if (seenA && seenB && !sliceDone) {
            sliceDone = true;
            api.say('Every slice is the same triangle! Now click both ends.', 'cheer');
            api.feedback('Click the two triangle ends. Press "Turn it round" to see the back end.', 'info');
            maybeDone();
          }
        },
      })
    );
    api.feedback('Drag the knife from one end of the box to the other.', 'info');
    function onFace(role, fi) {
      if (role === 'end') {
        if (!ends[fi]) {
          ends[fi] = true;
          v.st.hlFaces[fi] = 'gold';
          v.redraw();
          MQ.sound('pop');
        }
        var n = Object.keys(ends).length;
        if (n === 1) api.feedback('One end! Press "Turn it round" to find the other end.', 'info');
        maybeDone();
      } else {
        api.feedback('That is a side face: a rectangle. Click an end: a triangle.', 'try');
      }
    }
    function maybeDone() {
      if (unlocked) return;
      if (Object.keys(ends).length === 2 && sliceDone) {
        unlocked = true;
        v.st.slice = null;
        v.redraw();
        api.say('Two matching triangle ends, all faces flat. A prism!', 'cheer');
        api.feedback('Both ends are the same triangle and every face is flat, so it is a triangular prism.', 'good');
        api.unlockNext();
      } else if (Object.keys(ends).length === 2) {
        api.feedback('Both ends found! Now slide the knife all the way along.', 'info');
      }
    }
  }

  function learnPyramid(stage, api) {
    api.say('Pull the point up from the square base!', 'happy');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('The pyramid test', 'A pyramid has <b>one base</b> and <b>triangle faces</b> that meet at <b>one point</b>: the apex.'));
    var W = 400, H = 260, YB = -0.75, HMAX = 1.6, DONE_H = 1.25;
    var h = 0.02;
    var poly = rectPoly(1.7, 1.7);
    var v = viewer(api, 'sqPyramid', { W: W, H: H, yaw: -30, pitch: 22, model: pyramid(poly, h, false, YB), s: 105 });
    v.st.cy = H / 2 + 6;
    var root = v.svg;
    var handle = S('g', { class: 'pyr-handle' });
    var ring = S('circle', { r: 22, fill: 'rgba(194,65,12,.12)', stroke: '#c2410c', 'stroke-width': 2, 'stroke-dasharray': '4 3' });
    var dotC = S('circle', { r: 9, fill: '#c2410c', stroke: '#fff', 'stroke-width': 2.5 });
    var arrow = S('text', { x: 30, y: 6, 'font-size': 22, 'font-weight': 800, fill: '#c2410c' }, '↑ pull');
    var apexLbl = S('text', { x: 30, y: 6, 'font-size': 20, 'font-weight': 800, fill: '#c2410c', visibility: 'hidden' }, 'apex');
    handle.appendChild(ring);
    handle.appendChild(dotC);
    handle.appendChild(arrow);
    handle.appendChild(apexLbl);
    root.appendChild(handle);
    var done = false;
    function update() {
      v.st.model = pyramid(poly, h, false, YB);
      if (done) v.st.hl = { tri: 'gold' };
      v.redraw();
      var ap = project(v.st, [0, YB + h, 0]);
      handle.setAttribute('transform', 'translate(' + ap[0].toFixed(1) + ',' + ap[1].toFixed(1) + ')');
    }
    update();
    var facts = el('div', { class: 'pyr-facts' });
    stage.appendChild(el('div', { class: 'pyr-row' }, root, facts));
    var h0;
    api.cleanup(
      MQ.ui.drag(root, handle, {
        start: function () {
          h0 = h;
        },
        move: function (p, dx, dy) {
          h = U.clamp(h0 - dy / v.st.s, 0.02, HMAX);
          update();
          if (h >= DONE_H && !done) finishIt();
        },
      })
    );
    api.feedback('Drag the orange dot up.', 'info');
    function finishIt() {
      done = true;
      arrow.setAttribute('visibility', 'hidden');
      apexLbl.setAttribute('visibility', 'visible');
      update();
      facts.appendChild(el('div', { class: 'pyr-card pyr-factcard' }, el('div', null, el('b', null, '1'), ' square base'), el('div', null, el('b', null, '4'), ' triangle faces'), el('div', null, el('b', null, '1'), ' point: the apex')));
      api.say('The triangles meet at the apex. A square-based pyramid!', 'cheer');
      api.feedback('One square base. Four triangle faces meet at one point, the apex.', 'good');
      api.unlockNext();
    }
  }

  function learnNeither(stage, api) {
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Neither!', 'A <b>curved surface</b> means it is <b>not</b> a prism and <b>not</b> a pyramid.'));
    var STEPS = [
      {
        kind: 'cylinder',
        say: 'A tin has two matching ends. But is it a prism?',
        q: 'Which prism rule does the tin break?',
        opts: [
          { t: 'Two matching ends', why: 'Look: the two circle ends DO match. Look at its side.' },
          { t: 'All faces flat', ok: true },
        ],
        after: 'Its side is curved, so a tin is NOT a prism.',
      },
      {
        kind: 'cone',
        say: 'A party hat has a point. Is it a pyramid?',
        q: 'Why is the party hat NOT a pyramid?',
        opts: [
          { t: 'It has a point', why: 'Pyramids have a point too! Look at its side.' },
          { t: 'Its side is curved', ok: true },
        ],
        after: 'A curved side and a circle base: NOT a pyramid.',
      },
      {
        kind: 'sphere',
        say: 'A ball has no ends and no point.',
        q: 'So what is a ball?',
        opts: [
          { t: 'Prism', why: 'A prism needs two matching ends. A ball has none.' },
          { t: 'Pyramid', why: 'A pyramid needs a point. Does a ball have one?' },
          { t: 'Neither', ok: true },
        ],
        after: 'Curved all over: neither!',
      },
    ];
    var minis = STEPS.map(function (s) {
      var t = el('div', { class: 'pyr-mini' });
      t.appendChild(viewer(api, s.kind, { W: 96, H: 80, pad: 6 }).svg);
      t.appendChild(el('span', { class: 'pyr-tag' }, KINDS[s.kind].obj.replace('a ', '')));
      return t;
    });
    stage.appendChild(el('div', { class: 'pyr-minis' }, minis));
    var area = el('div', { class: 'pyr-q pyr-neither' });
    stage.appendChild(area);
    var n = 0;
    function show() {
      MQ.clear(area);
      minis.forEach(function (m, i) {
        m.classList.toggle('pyr-cur', i === n);
      });
      if (n >= STEPS.length) {
        api.say('Tin, party hat, ball: all curved, so all neither!', 'cheer');
        api.feedback('Curved surface = neither a prism nor a pyramid.', 'good');
        area.appendChild(el('div', { class: 'pyr-card pyr-sumcard' }, 'Has a curved surface? → ', el('b', null, 'Neither')));
        api.unlockNext();
        return;
      }
      var s = STEPS[n];
      api.say(s.say, 'think');
      var v = viewer(api, s.kind, { W: 250, H: 180, drag: true });
      var side = el('div', { class: 'pyr-side' });
      area.appendChild(el('div', { class: 'pyr-row' }, v.svg, side));
      area.appendChild(MQ.ui.prompt(s.q));
      var ch = MQ.ui.choices(
        s.opts.map(function (o) {
          return { label: o.t, value: o.t };
        }),
        function (val) {
          var o = s.opts.filter(function (x) {
            return x.t === val;
          })[0];
          if (o.ok) {
            ch.mark(val, 'good');
            ch.disable();
            api.sound('correct');
            showEvidence(v);
            side.appendChild(checklist(s.kind, 'flat'));
            api.feedback(s.after, 'good');
            minis[n].classList.add('pyr-done');
            n++;
            api.later(show, 2200);
          } else {
            ch.mark(val, 'bad');
            api.sound('wrong');
            api.feedback(o.why, 'try');
          }
        },
        { columns: s.opts.length }
      );
      area.appendChild(ch);
    }
    show();
  }

  function learnTurned(stage, api) {
    api.say('This pencil tin is lying down. Drag it round until an end faces you.', 'happy');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Turned around', 'A prism is still a prism lying down. A pyramid is still a pyramid upside down.'));
    var done = false;
    var v = viewer(api, 'hexPrism', { pose: 'lying', W: 380, H: 230, yaw: 14, pitch: 18, drag: true, onTurn: check });
    // make it long like a pencil tin
    v.st.model = prism(regPoly(6, 0.62), 2.3);
    v.st.s = (115 - 8) / v.st.model.R;
    v.redraw();
    var btnL = el('button', { class: 'btn btn-ghost', type: 'button', 'aria-label': 'Turn left' }, '◀ Turn');
    var btnR = el('button', { class: 'btn btn-ghost', type: 'button', 'aria-label': 'Turn right' }, 'Turn ▶');
    btnL.addEventListener('click', function () {
      spin(api, v, -15, check);
    });
    btnR.addEventListener('click', function () {
      spin(api, v, 15, check);
    });
    var after = el('div', { class: 'pyr-after' });
    stage.appendChild(el('div', { class: 'pyr-row' }, el('div', { class: 'pyr-viewbox' }, v.svg, el('div', { class: 'pyr-btnrow' }, btnL, el('span', { class: 'pyr-dragnote' }, 'or drag it'), btnR)), after));
    api.feedback('Turn the tin until you can see a whole end.', 'info');
    function endFacing() {
      var M = viewMatrix(v.st);
      var best = 0;
      v.st.model.faces.forEach(function (f) {
        if (f.role === 'end') best = Math.max(best, mv(M, f.n)[2]);
      });
      return best;
    }
    function check() {
      if (done || endFacing() < 0.85) return;
      done = true;
      v.st.hl = { end: 'gold' };
      v.redraw();
      api.sound('pop');
      api.say('A hexagon end! It is a hexagonal prism, even lying down.', 'cheer');
      api.feedback('Both ends are matching hexagons (the back one is dashed). Turning a shape does not change what it is.', 'good');
      [
        { kind: 'sqPyramid', pose: 'tipped', t: 'Tipped over: still a pyramid' },
        { kind: 'pentPyramid', pose: 'upside', t: 'Upside down: still a pyramid' },
        { kind: 'cylinder', pose: 'lying', t: 'Lying down: still neither' },
      ].forEach(function (x) {
        var m = el('div', { class: 'pyr-mini pyr-mini-wide' });
        m.appendChild(viewer(api, x.kind, { pose: x.pose, W: 110, H: 84, pad: 6 }).svg);
        m.appendChild(el('span', { class: 'pyr-tag' }, x.t));
        after.appendChild(m);
      });
      api.unlockNext();
    }
  }

  /* ---------------------------------------------------------------- *
   * Register
   * ---------------------------------------------------------------- */
  var deck = null;
  MQ.register(ID, {
    learn: [learnPrism, learnPyramid, learnNeither, learnTurned],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'single') return renderSingle(stage, api, q);
        if (q.type === 'board') return renderBoard(stage, api, q);
        if (q.type === 'name') return renderName(stage, api, q);
        if (q.type === 'why') return renderWhy(stage, api, q);
        return renderOdd(stage, api, q);
      },
    },
  });
  // Read-only hooks for automated tests (not used by the page).
  Object.defineProperty(MQ.activities[ID], '_test', {
    value: {
      buildDeck: buildDeck,
      KINDS: KINDS,
      model: model,
      props: props,
      deck: function () {
        return deck;
      },
    },
  });

  var css = [
    '.pyr-q{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.pyr-row{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;align-items:center;width:100%}',
    '.pyr-row>*{min-width:0;max-width:100%}',
    '.pyr-viewbox{display:flex;flex-direction:column;align-items:center;gap:2px;max-width:100%}',
    '.pyr-svg{max-width:100%;height:auto;display:block;overflow:visible}',
    '.pyr-turnable{cursor:grab;background:#fbfcff;border:2px solid var(--paper-2);border-radius:16px}',
    '.pyr-turnable.dragging{cursor:grabbing}',
    '.pyr-face{cursor:inherit}',
    '.pyr-dragnote{font-size:.85rem;color:var(--ink-soft);font-weight:700}',
    '.pyr-side:empty{display:none}',
    '.pyr-card{background:#fff;border:3px solid var(--line);border-radius:16px;padding:10px 14px}',
    '.pyr-check{display:flex;flex-direction:column;gap:4px;min-width:220px;font-weight:700}',
    '.pyr-ck-row{display:flex;align-items:center;gap:8px;font-size:1.02rem;padding:2px 6px;border-radius:8px}',
    '.pyr-ck-ic{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;font-weight:900;color:#fff;flex:none}',
    '.pyr-yes .pyr-ck-ic{background:var(--good)}',
    '.pyr-no .pyr-ck-ic{background:#c2410c}',
    '.pyr-focus{background:var(--try-bg);outline:2px solid #ffab76}',
    '.pyr-ck-why{margin-top:4px;color:var(--ink-soft);font-size:.92rem}',
    '.pyr-ck-verdict{font-size:1.35rem;font-weight:900}',
    '.pyr-v-prism{color:#0b6e66}.pyr-v-pyramid{color:#9a5b00}.pyr-v-neither{color:#c2410c}',
    '.pyr-board{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;width:100%;max-width:700px}',
    '.pyr-board-big{max-width:660px;gap:8px}',
    '.pyr-tile{position:relative;background:#fff;border:3px solid var(--line);border-radius:14px;padding:4px;cursor:pointer;display:flex;flex-direction:column;align-items:center;font-family:inherit;color:var(--ink);transition:transform .08s ease,border-color .1s ease}',
    '.pyr-tile:hover:not(:disabled){border-color:var(--accent);transform:translateY(-2px)}',
    '.pyr-tile:disabled{cursor:default}',
    '.pyr-tile .pyr-svg{width:100%!important}',
    '.pyr-board-big .pyr-tile .pyr-svg{max-height:96px}',
    '.pyr-tile.pyr-on{border-color:#2563eb;background:#eaf1ff;box-shadow:0 0 0 2px #2563eb inset}',
    '.pyr-tile.pyr-on::after{content:"✓";position:absolute;top:4px;right:6px;width:24px;height:24px;border-radius:50%;background:#2563eb;color:#fff;font-weight:900;font-size:.9rem;display:flex;align-items:center;justify-content:center}',
    '.pyr-tile.pyr-good{border-color:var(--good);background:var(--good-bg);box-shadow:none}',
    '.pyr-tile.pyr-good::after{background:var(--good)}',
    '.pyr-tile.pyr-bad{border-color:#c2410c;background:var(--try-bg);box-shadow:0 0 0 2px #c2410c inset}',
    '.pyr-tile.pyr-bad::after{content:"✗";background:#c2410c}',
    '.pyr-tag{font-size:.85rem;font-weight:800;color:var(--ink-soft);min-height:1.1em;text-align:center;line-height:1.15}',
    '.pyr-c-prism{color:#0b6e66}.pyr-c-pyramid{color:#9a5b00}.pyr-c-neither{color:#c2410c}',
    '.pyr-checkbtn{min-width:160px}',
    '.pyr-oochoices{max-width:680px}',
    '.pyr-oochoices .choice{padding:6px;display:flex;justify-content:center}',
    '.pyr-oo{display:flex;flex-direction:column;align-items:center;width:100%}',
    '.pyr-oo .pyr-svg{width:100%!important}',
    '.pyr-endpic{margin:0 auto}',
    '.pyr-slicecard{display:flex;flex-direction:column;align-items:center;gap:4px;width:170px;text-align:center}',
    '.pyr-slicecap{font-weight:900;color:#c2410c;font-size:1.05rem}',
    '.pyr-small{font-size:.9rem;color:var(--ink-soft);font-weight:700}',
    '.pyr-knob{cursor:grab}',
    '.pyr-handle{cursor:grab}',
    '.pyr-facts:empty{display:none}',
    '.pyr-factcard{display:flex;flex-direction:column;gap:6px;font-size:1.15rem;font-weight:700}',
    '.pyr-factcard b{display:inline-block;min-width:30px;text-align:center;background:var(--gold);border-radius:8px;margin-right:6px}',
    '.pyr-minis{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}',
    '.pyr-mini{display:flex;flex-direction:column;align-items:center;background:#fff;border:3px solid var(--line);border-radius:14px;padding:4px 8px}',
    '.pyr-mini.pyr-cur{border-color:var(--accent)}',
    '.pyr-mini.pyr-done{border-color:var(--good);background:var(--good-bg)}',
    '.pyr-mini-wide .pyr-tag{max-width:120px}',
    '.pyr-after{display:flex;flex-direction:column;gap:6px}',
    '.pyr-after:empty{display:none}',
    '.pyr-after .pyr-mini{flex-direction:row;gap:8px;padding:2px 8px}',
    '.pyr-after .pyr-tag{font-size:.95rem;color:var(--ink);text-align:left}',
    '.pyr-btnrow{display:flex;gap:10px;align-items:center;justify-content:center;margin-top:6px}',
    '.pyr-sumcard{font-size:1.3rem;font-weight:800}',
    '.pyr-neither .choices{max-width:520px}',
    '@media (max-width:640px){.pyr-board{grid-template-columns:repeat(3,minmax(0,1fr))}.pyr-oochoices{grid-template-columns:repeat(2,minmax(0,1fr))!important}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

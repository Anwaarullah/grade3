/* Faces, Edges, Corners (Unit 4.1): count the faces, edges and vertices of 3D shapes by clicking
 * them on a small turnable 3D model. Every count is computed from the same vertex / face lists
 * that draw the shape, so what the child counts always matches the answer.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;
  var ID = 'face-edge-vertex-count';
  var INK = '#1b2a4a';
  var D = Math.PI / 180;

  /* ---------------------------------------------------------------- *
   * Tiny 3D toolkit (same approach as prism-or-pyramid / shape-sorter-3d)
   * ---------------------------------------------------------------- */
  function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  function addv(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function mul(a, k) { return [a[0] * k, a[1] * k, a[2] * k]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function len(a) { return Math.sqrt(dot(a, a)); }
  function unit(a) { return mul(a, 1 / len(a)); }
  function avg(pts) {
    var s = [0, 0, 0];
    pts.forEach(function (p) { s = addv(s, p); });
    return mul(s, 1 / pts.length);
  }
  function rot(v, yaw, pitch) {
    var cy = Math.cos(yaw), sy = Math.sin(yaw);
    var x1 = v[0] * cy + v[2] * sy;
    var z1 = -v[0] * sy + v[2] * cy;
    var cp = Math.cos(pitch), sp = Math.sin(pitch);
    return [x1, v[1] * cp - z1 * sp, v[1] * sp + z1 * cp];
  }
  function shade(hex, f) {
    var n = parseInt(hex.slice(1), 16);
    var r = Math.min(255, Math.round(((n >> 16) & 255) * f));
    var g = Math.min(255, Math.round(((n >> 8) & 255) * f));
    var b = Math.min(255, Math.round((n & 255) * f));
    return 'rgb(' + r + ',' + g + ',' + b + ')';
  }
  var LIGHT = unit([-0.45, 0.75, 0.6]);

  function regPoly(n, r) {
    var a0 = Math.PI / 2 + Math.PI / n, out = [];
    for (var i = 0; i < n; i++) out.push([r * Math.cos(a0 + (2 * Math.PI * i) / n), r * Math.sin(a0 + (2 * Math.PI * i) / n)]);
    return out;
  }
  function rectPoly(w, d) {
    return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];
  }

  /** Centre a solid, find its edges, outward normals and which faces meet at each edge / vertex. */
  function core(verts, faces) {
    var lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    verts.forEach(function (v) {
      for (var k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], v[k]); hi[k] = Math.max(hi[k], v[k]); }
    });
    var c = mul(addv(lo, hi), 0.5);
    verts = verts.map(function (v) { return sub(v, c); });
    var inside = avg(verts);
    var edges = [], edgeFaces = [], seen = {};
    var vertFaces = verts.map(function () { return []; });
    faces.forEach(function (f, fi) {
      f.forEach(function (a, i) {
        var b = f[(i + 1) % f.length];
        var k = Math.min(a, b) + '-' + Math.max(a, b);
        if (seen[k] == null) {
          seen[k] = edges.length;
          edges.push([Math.min(a, b), Math.max(a, b)]);
          edgeFaces.push([]);
        }
        edgeFaces[seen[k]].push(fi);
        vertFaces[a].push(fi);
      });
    });
    var normals = faces.map(function (f) {
      var p = f.map(function (i) { return verts[i]; });
      var n = cross(sub(p[1], p[0]), sub(p[2], p[0]));
      if (dot(n, sub(avg(p), inside)) < 0) n = mul(n, -1);
      return unit(n);
    });
    var R = 0;
    verts.forEach(function (v) { R = Math.max(R, len(v)); });
    return { verts: verts, faces: faces, edges: edges, edgeFaces: edgeFaces, vertFaces: vertFaces, normals: normals, R: R, smooth: faces.map(function () { return false; }) };
  }

  function polyShape(p) {
    if (p.length === 3) return 'triangle';
    if (p.length === 4) {
      var a = len(sub(p[1], p[0])), b = len(sub(p[2], p[1]));
      return Math.abs(a - b) / Math.max(a, b) < 0.01 ? 'square' : 'rectangle';
    }
    return { 5: 'pentagon', 6: 'hexagon', 8: 'octagon' }[p.length] || 'circle';
  }

  /** Lookup tables from parts (faces / edges / vertices) to the things the child counts ("groups"). */
  function indexGroups(m) {
    m.fG = m.faces.map(function () { return -1; });
    m.eG = m.edges.map(function () { return -1; });
    m.vG = m.verts.map(function () { return -1; });
    m.F.forEach(function (g, gi) { g.fs.forEach(function (fi) { m.fG[fi] = gi; }); });
    m.E.forEach(function (g, gi) { g.es.forEach(function (ei) { m.eG[ei] = gi; }); });
    m.V.forEach(function (g, gi) { m.vG[g.v] = gi; });
    return m;
  }

  /** Prism with its end polygon at the bottom and top. smooth = cylinder. Faces: 0 bottom, 1 top, then sides. */
  function prismM(poly, h, smooth) {
    var n = poly.length, verts = [];
    poly.forEach(function (p) { verts.push([p[0], -h / 2, p[1]]); });
    poly.forEach(function (p) { verts.push([p[0], h / 2, p[1]]); });
    var faces = [U.range(0, n - 1), U.range(n, 2 * n - 1)];
    for (var i = 0; i < n; i++) faces.push([i, (i + 1) % n, n + ((i + 1) % n), n + i]);
    var m = core(verts, faces);
    m.n = n;
    function ringCat(e) { return e[0] < n && e[1] < n ? 'bottom' : e[0] >= n && e[1] >= n ? 'top' : 'upright'; }
    if (smooth) {
      m.type = 'cylinder';
      for (var k = 2; k < faces.length; k++) m.smooth[k] = true;
      m.F = [{ fs: [1], cat: 'top' }, { fs: [0], cat: 'bottom' }, { fs: U.range(2, n + 1), cat: 'curved', curved: true }];
      var top = [], bottom = [];
      m.edges.forEach(function (e, ei) {
        var c = ringCat(e);
        if (c === 'top') top.push(ei);
        else if (c === 'bottom') bottom.push(ei);
      });
      m.E = [{ es: top, cat: 'top', curved: true }, { es: bottom, cat: 'bottom', curved: true }];
      m.V = [];
    } else {
      m.type = 'prism';
      m.F = faces.map(function (f, fi) { return { fs: [fi], cat: fi === 0 ? 'bottom' : fi === 1 ? 'top' : 'side' }; });
      m.E = m.edges.map(function (e, ei) { return { es: [ei], cat: ringCat(e) }; });
      m.V = m.verts.map(function (v, vi) { return { v: vi, cat: vi < n ? 'bottom' : 'top' }; });
    }
    return indexGroups(m);
  }

  /** Pyramid: base polygon and one apex. smooth = cone. Face 0 = base. */
  function pyrM(poly, h, smooth) {
    var n = poly.length;
    var verts = poly.map(function (p) { return [p[0], 0, p[1]]; });
    verts.push([0, h, 0]);
    var faces = [U.range(0, n - 1)];
    for (var i = 0; i < n; i++) faces.push([i, (i + 1) % n, n]);
    var m = core(verts, faces);
    m.n = n;
    m.apex = n;
    if (smooth) {
      m.type = 'cone';
      for (var k = 1; k < faces.length; k++) m.smooth[k] = true;
      m.F = [{ fs: [0], cat: 'base' }, { fs: U.range(1, n), cat: 'curved', curved: true }];
      var ring = [];
      m.edges.forEach(function (e, ei) { if (e[0] < n && e[1] < n) ring.push(ei); });
      m.E = [{ es: ring, cat: 'base', curved: true }];
      m.V = [{ v: n, cat: 'apex' }];
    } else {
      m.type = 'pyramid';
      m.F = faces.map(function (f, fi) { return { fs: [fi], cat: fi === 0 ? 'base' : 'tri' }; });
      m.E = m.edges.map(function (e, ei) { return { es: [ei], cat: e[1] === n ? 'slant' : 'base' }; });
      m.V = m.verts.map(function (v, vi) { return { v: vi, cat: vi === n ? 'apex' : 'base' }; });
    }
    return indexGroups(m);
  }

  function sphereM() {
    var m = { sphere: true, type: 'sphere', R: 1, verts: [], faces: [], edges: [], normals: [], smooth: [], F: [{ fs: [], cat: 'curved', curved: true }], E: [], V: [] };
    m.fG = [];
    m.eG = [];
    m.vG = [];
    return m;
  }

  /* ---------------------------------------------------------------- *
   * The shapes (everyday objects). All counts come from the models.
   * ---------------------------------------------------------------- */
  var KINDS = {
    cube: { name: 'Cube', obj: 'dice', fill: '#ffffff', make: function () { return prismM(rectPoly(1.4, 1.4), 1.4); } },
    cuboid: { name: 'Cuboid', obj: 'gift box', fill: '#ffc2d1', make: function () { return prismM(rectPoly(2.0, 1.1), 1.2); } },
    triPrism: { name: 'Triangular prism', obj: 'chocolate box', fill: '#f7ddb5', view: [200, 36], make: function () { return prismM(regPoly(3, 1.0), 1.35); } },
    pentPrism: { name: 'Pentagonal prism', obj: 'gift box', fill: '#d6efc9', make: function () { return prismM(regPoly(5, 0.85), 1.2); } },
    hexPrism: { name: 'Hexagonal prism', obj: 'pencil tin', fill: '#cfe5ff', view: [-15, 26], make: function () { return prismM(regPoly(6, 0.8), 1.4); } },
    octPrism: { name: 'Octagonal prism', obj: 'cheese box', fill: '#e5d6ff', make: function () { return prismM(regPoly(8, 0.95), 0.9); } },
    triPyramid: { name: 'Triangle-based pyramid', obj: 'paper pyramid', fill: '#fde6a8', view: [196, 22], make: function () { return pyrM(regPoly(3, 1.0), 1.3); } },
    sqPyramid: { name: 'Square-based pyramid', obj: 'paperweight', fill: '#d3ebff', make: function () { return pyrM(rectPoly(1.5, 1.5), 1.4); } },
    pentPyramid: { name: 'Pentagonal pyramid', obj: 'tent', fill: '#d8f3dc', make: function () { return pyrM(regPoly(5, 0.95), 1.4); } },
    hexPyramid: { name: 'Hexagonal pyramid', obj: 'roof', fill: '#ffdcc2', make: function () { return pyrM(regPoly(6, 0.95), 1.4); } },
    cylinder: { name: 'Cylinder', obj: 'tin', fill: '#dde3ec', make: function () { return prismM(regPoly(36, 0.75), 1.5, true); } },
    cone: { name: 'Cone', obj: 'party hat', fill: '#ffc9d6', make: function () { return pyrM(regPoly(36, 0.8), 1.7, true); } },
    sphere: { name: 'Sphere', obj: 'ball', fill: '#ffd59e', make: sphereM },
  };
  var models = {};
  function model(kind) {
    if (!models[kind]) models[kind] = KINDS[kind].make();
    return models[kind];
  }
  function nameOf(kind) { return KINDS[kind].name; }
  function lower(kind) { var n = nameOf(kind); return n.charAt(0).toLowerCase() + n.slice(1); }

  /** Properties of a shape, worked out from the model. */
  var propCache = {};
  function props(kind) {
    if (propCache[kind]) return propCache[kind];
    var m = model(kind);
    var shapes = { triangle: 0, square: 0, rectangle: 0, pentagon: 0, hexagon: 0, octagon: 0, circle: 0 };
    var flat = 0, curvedS = 0;
    m.F.forEach(function (g) {
      if (g.curved) { curvedS++; return; }
      flat++;
      var fi = g.fs[0];
      var s = m.smooth.some(function (x) { return x; }) ? 'circle' : polyShape(m.faces[fi].map(function (i) { return m.verts[i]; }));
      shapes[s]++;
    });
    var type = m.type === 'prism' ? 'prism' : m.type === 'pyramid' ? 'pyramid' : 'neither';
    var P = { kind: kind, F: m.F.length, flat: flat, curvedS: curvedS, curved: curvedS > 0, E: m.E.length, V: m.V.length, shapes: shapes, type: type, n: m.n };
    propCache[kind] = P;
    return P;
  }

  /* ---------------------------------------------------------------- *
   * Colours and words for the parts ("top ring", "uprights", ...)
   * ---------------------------------------------------------------- */
  var CAT_ORDER = ['top', 'bottom', 'base', 'side', 'tri', 'upright', 'slant', 'apex', 'curved'];
  var FACE_COL = {
    top: { fill: '#ffd166', ink: '#a86b00' },
    bottom: { fill: '#ffd166', ink: '#a86b00' },
    base: { fill: '#ffd166', ink: '#a86b00' },
    side: { fill: '#9be7b4', ink: '#1f7a45' },
    tri: { fill: '#9be7b4', ink: '#1f7a45' },
    curved: { fill: '#a5d8ff', ink: '#1864ab' },
  };
  var LINE_COL = { top: '#e8590c', bottom: '#7048e8', base: '#7048e8', upright: '#0c8599', slant: '#0c8599', apex: '#e8590c' };
  var WORDS = {
    face: { top: 'top', bottom: 'bottom', base: 'base', side: 'sides', tri: 'triangles', curved: 'curved surface' },
    edge: { top: 'in the top ring', bottom: 'in the bottom ring', base: 'in the base ring', upright: 'uprights', slant: 'going up to the point' },
    vertex: { top: 'on top', bottom: 'on the bottom', base: 'round the base', apex: 'at the point' },
  };
  var PART = { face: 'faces', edge: 'edges', vertex: 'vertices' };
  var PART1 = { face: 'face', edge: 'edge', vertex: 'vertex' };
  var ASK = { faces: 'face', edges: 'edge', vertices: 'vertex' };

  function groupsOf(m, k) { return k === 'face' ? m.F : k === 'edge' ? m.E : m.V; }
  function colOf(k, cat) { return k === 'face' ? FACE_COL[cat].fill : LINE_COL[cat] || '#e8590c'; }
  function inkOf(k, cat) { return k === 'face' ? FACE_COL[cat].ink : LINE_COL[cat] || '#e8590c'; }

  /** The structured count for one kind of part: [{cat, n, label, col}] in a sensible order. */
  function parts(kind, k) {
    var m = model(kind), by = {};
    groupsOf(m, k).forEach(function (g) { by[g.cat] = (by[g.cat] || 0) + 1; });
    return CAT_ORDER.filter(function (c) { return by[c]; }).map(function (c) {
      return { cat: c, n: by[c], label: WORDS[k][c], col: inkOf(k, c) };
    });
  }

  /** "4 + 4 + 4 = 12 edges" with a small label under each number. */
  function labelledSum(kind, k, opts) {
    opts = opts || {};
    var ps = parts(kind, k);
    var row = el('div', { class: 'fev-sum' });
    var total = 0;
    ps.forEach(function (p, i) {
      total += p.n;
      if (i) row.appendChild(el('span', { class: 'fev-op' }, '+'));
      row.appendChild(el('span', { class: 'fev-term' }, el('span', { class: 'fev-num', style: { borderColor: p.col, color: p.col } }, String(p.n)), el('span', { class: 'fev-lab' }, p.label)));
    });
    var word = opts.word || PART[k];
    if (ps.length > 1) row.appendChild(el('span', { class: 'fev-op' }, '='));
    row.appendChild(el('span', { class: 'fev-term' }, el('span', { class: 'fev-num fev-total' }, String(total)), el('span', { class: 'fev-lab' }, word)));
    return row;
  }

  /* ---------------------------------------------------------------- *
   * Drawing one shape. st: {yaw, pitch (degrees), W, H, mode, wire, pips, fill}; marks: {face:{gi:n}, ...}
   * ---------------------------------------------------------------- */
  var PIPS = {
    1: [[0.5, 0.5]],
    2: [[0.27, 0.27], [0.73, 0.73]],
    3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
    4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
    5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
    6: [[0.27, 0.22], [0.27, 0.5], [0.27, 0.78], [0.73, 0.22], [0.73, 0.5], [0.73, 0.78]],
  };
  var DICE = [6, 1, 2, 3, 5, 4]; // bottom, top, then the sides (opposite faces add to 7)
  var BALL_SPOTS = (function () {
    var out = [];
    for (var i = 0; i < 10; i++) {
      var y = 1 - (2 * (i + 0.5)) / 10, r = Math.sqrt(1 - y * y), a = i * 2.39996;
      out.push([r * Math.cos(a), y, r * Math.sin(a)]);
    }
    return out;
  })();

  function badge(g, x, y, num, ring, hidden) {
    g.appendChild(S('circle', { cx: x, cy: y, r: 12.5, fill: hidden ? 'rgba(255,255,255,.8)' : '#fff', stroke: ring, 'stroke-width': 2.5, 'stroke-dasharray': hidden ? '4 3' : null, 'pointer-events': 'none' }));
    g.appendChild(S('text', { x: x, y: y + 5, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 800, fill: hidden ? '#7a869f' : INK, 'pointer-events': 'none', class: 'fev-badge' }, String(num)));
  }

  function draw(g, kind, st, marks) {
    MQ.clear(g);
    var m = model(kind);
    var W = st.W, H = st.H, cx = W / 2, cy = H / 2;
    var s = (Math.min(W, H) / 2 - (st.pad != null ? st.pad : 18)) / m.R;
    var yaw = st.yaw * D, pitch = st.pitch * D;
    var vis = { face: {}, edge: {}, vertex: {} };
    var baseFill = st.fill || KINDS[kind].fill;

    if (m.sphere) {
      var r = s;
      var mk = marks.face[0];
      var body = S('circle', { cx: cx, cy: cy, r: r, fill: mk ? FACE_COL.curved.fill : baseFill, stroke: INK, 'stroke-width': 2.6 });
      if (st.mode === 'face') { body.setAttribute('data-kind', 'face'); body.setAttribute('data-g', 0); body.setAttribute('class', 'fev-hit'); }
      g.appendChild(body);
      BALL_SPOTS.forEach(function (p) {
        var q = rot(p, yaw, pitch);
        if (q[2] <= 0.05) return;
        g.appendChild(S('ellipse', { cx: cx + q[0] * r * 0.8, cy: cy - q[1] * r * 0.8, rx: r * 0.09 * q[2] + 1, ry: r * 0.09 * q[2] + 1, fill: mk ? '#74c0fc' : '#f4a259', opacity: 0.8, 'pointer-events': 'none' }));
      });
      g.appendChild(S('ellipse', { cx: cx - r * 0.38, cy: cy - r * 0.42, rx: r * 0.2, ry: r * 0.12, fill: 'rgba(255,255,255,.75)', transform: 'rotate(-35 ' + (cx - r * 0.38) + ' ' + (cy - r * 0.42) + ')', 'pointer-events': 'none' }));
      if (mk) badge(g, cx, cy, mk, FACE_COL.curved.ink);
      vis.face[0] = true;
      return vis;
    }

    var R3 = m.verts.map(function (v) { return rot(v, yaw, pitch); });
    var N3 = m.normals.map(function (n) { return rot(n, yaw, pitch); });
    var scr = R3.map(function (p) { return [cx + p[0] * s, cy - p[1] * s]; });
    var front = N3.map(function (n) { return n[2] > 1e-6; });
    function ptsStr(f) { return f.map(function (i) { return scr[i][0].toFixed(1) + ',' + scr[i][1].toFixed(1); }).join(' '); }

    // faces you can see
    m.faces.forEach(function (f, fi) {
      if (!front[fi]) return;
      var gi = m.fG[fi], grp = m.F[gi];
      vis.face[gi] = true;
      var on = marks.face[gi] != null;
      var k = 0.8 + 0.2 * Math.max(0, dot(N3[fi], LIGHT));
      var fill = shade(on ? FACE_COL[grp.cat].fill : baseFill, on ? 0.92 + 0.08 * (k - 0.8) / 0.2 : k);
      var a = { points: ptsStr(f), fill: fill, stroke: m.smooth[fi] ? fill : 'none', 'stroke-width': m.smooth[fi] ? 0.8 : 0, 'stroke-linejoin': 'round' };
      if (st.wire) a['fill-opacity'] = 0.35;
      if (st.mode === 'face') { a['data-kind'] = 'face'; a['data-g'] = gi; a.class = 'fev-hit'; } else a['pointer-events'] = 'none';
      g.appendChild(S('polygon', a));
    });
    // dice pips
    if (st.pips && kind === 'cube') {
      m.faces.forEach(function (f, fi) {
        if (!front[fi] || N3[fi][2] < 0.1) return;
        var p0 = scr[f[0]], p1 = scr[f[1]], p3 = scr[f[3]];
        PIPS[DICE[fi]].forEach(function (uv) {
          g.appendChild(S('circle', { cx: p0[0] + uv[0] * (p1[0] - p0[0]) + uv[1] * (p3[0] - p0[0]), cy: p0[1] + uv[0] * (p1[1] - p0[1]) + uv[1] * (p3[1] - p0[1]), r: s * 0.085 * Math.max(0.45, N3[fi][2]), fill: INK, opacity: 0.85, 'pointer-events': 'none' }));
        });
      });
    }
    // marked faces at the back: dashed outline so the child can see they are already counted
    m.F.forEach(function (grp, gi) {
      if (marks.face[gi] == null || grp.curved) return;
      grp.fs.forEach(function (fi) {
        if (front[fi]) return;
        g.appendChild(S('polygon', { points: ptsStr(m.faces[fi]), fill: 'none', stroke: FACE_COL[grp.cat].ink, 'stroke-width': 2.6, 'stroke-dasharray': '7 5', 'pointer-events': 'none' }));
      });
    });

    // edges
    var hidden = [], shown = [], outline = [];
    m.edges.forEach(function (e, ei) {
      var fs = m.edgeFaces[ei];
      var nf = (front[fs[0]] ? 1 : 0) + (front[fs[1]] ? 1 : 0);
      if (m.smooth[fs[0]] && m.smooth[fs[1]]) {
        if (nf === 1) outline.push(e);
        return;
      }
      if (nf > 0) { shown.push(ei); vis.edge[m.eG[ei]] = true; } else hidden.push(ei);
    });
    function line(e, a) {
      a.x1 = scr[e[0]][0]; a.y1 = scr[e[0]][1]; a.x2 = scr[e[1]][0]; a.y2 = scr[e[1]][1];
      a['pointer-events'] = 'none';
      return S('line', a);
    }
    hidden.forEach(function (ei) {
      var gi = m.eG[ei], on = marks.edge[gi] != null;
      g.appendChild(line(m.edges[ei], { stroke: on ? LINE_COL[m.E[gi].cat] : '#7a869f', 'stroke-width': on ? 4 : st.wire ? 2.2 : 1.7, 'stroke-dasharray': '6 5', 'stroke-linecap': 'round' }));
    });
    outline.forEach(function (e) { g.appendChild(line(e, { stroke: INK, 'stroke-width': 2.6, 'stroke-linecap': 'round' })); });
    shown.forEach(function (ei) {
      var gi = m.eG[ei], on = marks.edge[gi] != null;
      g.appendChild(line(m.edges[ei], { stroke: on ? LINE_COL[m.E[gi].cat] : INK, 'stroke-width': on ? 6 : 2.6, 'stroke-linecap': 'round' }));
    });

    // face number badges
    m.F.forEach(function (grp, gi) {
      var num = marks.face[gi];
      if (num == null) return;
      var cs = grp.fs.filter(function (fi) { return front[fi]; });
      if (!cs.length) return;
      var pts = [];
      cs.forEach(function (fi) { m.faces[fi].forEach(function (i) { pts.push(scr[i]); }); });
      var bx = 0, by = 0;
      pts.forEach(function (p) { bx += p[0]; by += p[1]; });
      badge(g, bx / pts.length, by / pts.length, num, FACE_COL[grp.cat].ink);
    });

    // vertices
    m.V.forEach(function (grp, gi) {
      var vi = grp.v, p = scr[vi];
      var isVis = m.vertFaces[vi].some(function (fi) { return front[fi]; });
      if (isVis) vis.vertex[gi] = true;
      var num = marks.vertex[gi], col = LINE_COL[grp.cat];
      if (num != null) {
        if (isVis) {
          g.appendChild(S('circle', { cx: p[0], cy: p[1], r: 11, fill: col, stroke: '#fff', 'stroke-width': 2, 'pointer-events': 'none' }));
          g.appendChild(S('text', { x: p[0], y: p[1] + 4.5, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 800, fill: '#fff', 'pointer-events': 'none', class: 'fev-badge' }, String(num)));
        } else {
          g.appendChild(S('circle', { cx: p[0], cy: p[1], r: 9, fill: 'rgba(255,255,255,.85)', stroke: col, 'stroke-width': 2.4, 'stroke-dasharray': '3 3', 'pointer-events': 'none' }));
        }
      } else if (st.mode === 'vertex' && (isVis || st.wire)) {
        g.appendChild(S('circle', { cx: p[0], cy: p[1], r: isVis ? 4.5 : 3.5, fill: isVis ? INK : '#7a869f', 'pointer-events': 'none' }));
      }
    });

    // click targets on top
    if (st.mode === 'edge') {
      m.edges.forEach(function (e, ei) {
        var gi = m.eG[ei];
        if (gi < 0) return;
        if (!vis.edge[gi] && !st.wire) return;
        var fs = m.edgeFaces[ei];
        if (!st.wire && !front[fs[0]] && !front[fs[1]]) return;
        g.appendChild(S('line', { x1: scr[e[0]][0], y1: scr[e[0]][1], x2: scr[e[1]][0], y2: scr[e[1]][1], stroke: 'transparent', 'stroke-width': 18, 'stroke-linecap': 'round', 'data-kind': 'edge', 'data-g': gi, class: 'fev-hit' }));
      });
    }
    if (st.mode === 'vertex') {
      m.V.forEach(function (grp, gi) {
        if (!vis.vertex[gi] && !st.wire) return;
        var p = scr[grp.v];
        g.appendChild(S('circle', { cx: p[0], cy: p[1], r: 15, fill: 'transparent', 'data-kind': 'vertex', 'data-g': gi, class: 'fev-hit' }));
      });
    }
    return vis;
  }

  /**
   * A turnable, clickable shape. o: {W, H, yaw, pitch, mode, wire, pips, fill, turn (default true),
   *   onMark(kind, gi, n), onRepeat(kind, gi), buttons (default true)}
   */
  function viewer(api, kind, o) {
    o = o || {};
    var W = o.W || 380, H = o.H || 300;
    var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'fev-svg' + (o.turn === false ? '' : ' fev-turnable'), style: { width: W + 'px' }, role: 'img', 'aria-label': nameOf(kind) });
    var g = S('g');
    svg.appendChild(g);
    var view = KINDS[kind].view || [-32, 24];
    var st = { W: W, H: H, yaw: o.yaw != null ? o.yaw : view[0], pitch: o.pitch != null ? o.pitch : view[1], mode: o.mode || null, wire: !!o.wire, pips: !!o.pips, fill: o.fill, pad: o.pad };
    var marks = { face: {}, edge: {}, vertex: {} };
    var cnt = { face: 0, edge: 0, vertex: 0 };
    var v = {
      kind: kind,
      svg: svg,
      st: st,
      marks: marks,
      vis: null,
      count: function (k) { return cnt[k]; },
      total: function (k) { return groupsOf(model(kind), k).length; },
      redraw: function () {
        v.vis = draw(g, kind, st, marks);
        svg.setAttribute('data-mode', st.mode || '');
      },
      setMode: function (md) { st.mode = md; v.redraw(); },
      mark: function (k, gi) {
        if (marks[k][gi] != null) {
          if (o.onRepeat) o.onRepeat(k, gi);
          return false;
        }
        marks[k][gi] = ++cnt[k];
        api.sound('pop');
        v.redraw();
        if (o.onMark) o.onMark(k, gi, cnt[k]);
        return true;
      },
      /** Mark everything (for "Show me"), numbering in the structured order. */
      markAll: function (k) {
        var gs = groupsOf(model(kind), k);
        var order = gs.map(function (gg, i) { return i; });
        order.sort(function (a, b) { return CAT_ORDER.indexOf(gs[a].cat) - CAT_ORDER.indexOf(gs[b].cat) || a - b; });
        marks[k] = {};
        v.marks = marks;
        order.forEach(function (gi, j) { marks[k][gi] = j + 1; });
        cnt[k] = gs.length;
        v.redraw();
      },
      /** Groups of this kind you can see now that are not yet marked. */
      seenUnmarked: function (k) {
        var n = 0;
        Object.keys(v.vis[k] || {}).forEach(function (gi) { if (marks[k][gi] == null) n++; });
        return n;
      },
      turnTo: function (yaw, pitch, ms, done) {
        var steps = Math.max(1, Math.round((ms || 500) / 40)), y0 = st.yaw, p0 = st.pitch;
        for (var i = 1; i <= steps; i++) {
          (function (i) {
            api.later(function () {
              st.yaw = y0 + ((yaw - y0) * i) / steps;
              st.pitch = p0 + ((pitch - p0) * i) / steps;
              v.redraw();
              if (i === steps && done) done();
            }, i * 40);
          })(i);
        }
      },
    };
    function clickTarget(t) {
      if (!t || !t.getAttribute) return;
      var k = t.getAttribute('data-kind');
      if (!k || k !== st.mode) return;
      v.mark(k, +t.getAttribute('data-g'));
    }
    if (o.turn !== false) {
      var y0, p0, tgt, moved;
      var un = MQ.ui.drag(svg, svg, {
        start: function (p, e) { y0 = st.yaw; p0 = st.pitch; tgt = e && e.target; moved = false; },
        move: function (p, dx, dy) {
          if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
          if (!moved) return;
          st.yaw = y0 + dx * 0.9;
          st.pitch = U.clamp(p0 + dy * 0.6, -70, 70);
          v.redraw();
        },
        end: function () { if (!moved) clickTarget(tgt); },
      });
      api.cleanup(un);
    } else if (st.mode) {
      svg.addEventListener('click', function (e) { clickTarget(e.target); });
    }
    v.redraw();
    v.el = el('div', { class: 'fev-view' }, svg);
    if (o.turn !== false && o.buttons !== false) {
      var flip = el('button', { class: 'btn btn-ghost fev-tbtn', type: 'button', 'data-turn': 'flip' }, 'Look underneath ↕');
      function setFlip() { flip.textContent = st.pitch > 0 ? 'Look underneath ↕' : 'Look on top ↕'; }
      v.el.appendChild(el('div', { class: 'fev-turnbtns' },
        el('button', { class: 'btn btn-ghost fev-tbtn', type: 'button', 'data-turn': 'left', 'aria-label': 'Turn left', onclick: function () { v.turnTo(st.yaw - 45, st.pitch, 360); } }, '↶ Turn'),
        el('button', { class: 'btn btn-ghost fev-tbtn', type: 'button', 'data-turn': 'right', 'aria-label': 'Turn right', onclick: function () { v.turnTo(st.yaw + 45, st.pitch, 360); } }, 'Turn ↷'),
        flip));
      flip.addEventListener('click', function () {
        v.turnTo(st.yaw, st.pitch > 0 ? -38 : 24, 420, setFlip);
      });
      v.el.appendChild(el('div', { class: 'fev-dragnote' }, 'Drag the shape to turn it.'));
    }
    return v;
  }

  /** One full slow turn (used by "Show me" so the hidden parts come into view). */
  function spinRound(v, ms) {
    v.turnTo(v.st.yaw + 360, Math.abs(v.st.pitch) < 10 ? 24 : v.st.pitch, ms || 2400);
  }

  /** Static small picture of a shape. */
  function picture(api, kind, W, H) {
    var v = viewer(api, kind, { W: W, H: H, turn: false, pips: kind === 'cube', pad: 10 });
    return v.svg;
  }

  /* ---------------------------------------------------------------- *
   * Hints and mistake tags
   * ---------------------------------------------------------------- */
  var T = {
    twice: 'Counted a part twice',
    hidden: 'Missed hidden faces, edges or corners at the back',
    ev: 'Mixed up edges and vertices (corners)',
    fe: 'Mixed up faces with edges or corners',
    curvedFace: 'Counted the curved surface as a flat face',
    curvedCorner: 'Thought a curved shape has corners',
    name: 'Wrong shape name',
    type: 'Mixed up prism, pyramid and neither',
    riddle: 'Matched a clue to the wrong shape',
    falseClue: 'Chose a clue that is not true for the shape',
  };

  /** How to count this part of this shape, in words, for the stronger hint. */
  function workText(kind, k) {
    return parts(kind, k).map(function (p) { return p.n + ' ' + p.label; }).join(' + ');
  }
  function howTo(kind, k) {
    return 'Try: ' + workText(kind, k) + '.';
  }

  /** Judge a typed count. Returns {ok, hint, tag}. */
  function judgeCount(kind, k, ans, marked, tries) {
    var P = props(kind);
    var total = k === 'face' ? P.F : k === 'edge' ? P.E : P.V;
    if (ans === total) return { ok: true };
    var r;
    if (k === 'vertex' && ans === P.E) r = { hint: 'That is the number of edges. Vertices are the corners, where the edges meet.', tag: T.ev };
    else if (k === 'edge' && ans === P.V) r = { hint: 'That is the number of corners. Edges are the lines where two faces meet.', tag: T.ev };
    else if (k === 'face' && (ans === P.E || ans === P.V)) r = { hint: 'Faces are the flat sides, not the lines or the corners.', tag: T.fe };
    else if (ans > total) r = { hint: 'Too many. Did you count one twice? Click each one once: the marks keep track.', tag: T.twice };
    else if (marked < total) r = { hint: 'Some are hiding. Turn the shape and look underneath, then mark the rest.', tag: T.hidden };
    else r = { hint: 'You marked them all. Count your marks again.', tag: T.hidden };
    if (tries >= 1) r.hint += ' ' + howTo(kind, k);
    r.ok = false;
    return r;
  }

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */
  function tallyChips(v, kind, k) {
    var box = el('div', { class: 'fev-chips' });
    function upd() {
      MQ.clear(box);
      var m = model(kind), by = {};
      Object.keys(v.marks[k]).forEach(function (gi) { var c = groupsOf(m, k)[gi].cat; by[c] = (by[c] || 0) + 1; });
      parts(kind, k).forEach(function (p) {
        box.appendChild(el('span', { class: 'fev-chip', style: { borderColor: p.col } }, el('b', { style: { color: p.col } }, String(by[p.cat] || 0)), ' ' + p.label));
      });
    }
    upd();
    box.update = upd;
    return box;
  }

  function learnScreen(stage, api, cfg) {
    // cfg: {kind, k, title, text, say, wire, pips, done(v, side), nudge}
    api.say(cfg.say);
    api.lockNext();
    stage.appendChild(MQ.ui.lesson(cfg.title, cfg.text));
    var total = groupsOf(model(cfg.kind), cfg.k).length;
    var counter = el('div', { class: 'fev-tally', 'data-total': total }, PART[cfg.k].charAt(0).toUpperCase() + PART[cfg.k].slice(1) + ' counted: ', el('b', { class: 'fev-n' }, '0'));
    var chips = null;
    var after = el('div', { class: 'fev-after' });
    var v = viewer(api, cfg.kind, {
      mode: cfg.k,
      wire: cfg.wire,
      pips: cfg.pips,
      W: 380,
      H: 290,
      onRepeat: function (k) { if (v.count(k) < total) api.feedback('Already counted! That one has a mark.', 'info'); },
      onMark: function (k, gi, n) {
        counter.querySelector('.fev-n').textContent = String(n);
        if (chips) chips.update();
        if (n >= total) {
          api.sound('correct');
          api.unlockNext();
          after.appendChild(labelledSum(cfg.kind, cfg.k, { word: cfg.word }));
          api.say(cfg.doneSay, 'cheer');
          api.feedback(cfg.doneSay, 'good');
        } else if (v.seenUnmarked(k) === 0) {
          api.say(cfg.nudge || 'All the ones you can see are done. Turn it to find more!', 'think');
          api.feedback(cfg.nudge || 'Turn the shape to find the hidden ones.', 'info');
        } else api.feedback('', 'info');
      },
    });
    if (cfg.chips) chips = tallyChips(v, cfg.kind, cfg.k);
    stage.appendChild(el('div', { class: 'fev-row' }, v.el, el('div', { class: 'fev-side' }, counter, chips, after)));
    return v;
  }

  function learnFaces(stage, api) {
    learnScreen(stage, api, {
      kind: 'cube',
      k: 'face',
      pips: true,
      title: 'Faces',
      text: 'A <b>face</b> is a flat side. Click every face of the dice. Drag it to turn it.',
      say: 'Click each face of the dice. Turn it to find the hidden ones!',
      nudge: 'All the faces you can see are counted. Look underneath!',
      doneSay: '6 faces! Top, bottom and 4 round the sides.',
    });
  }
  function learnEdges(stage, api) {
    learnScreen(stage, api, {
      kind: 'cube',
      k: 'edge',
      wire: true,
      chips: true,
      title: 'Edges',
      text: 'An <b>edge</b> is a line where two faces meet. Click every edge. The dashed ones are at the back.',
      say: 'Tip: click the top ring, then the bottom ring, then the uprights.',
      doneSay: '4 + 4 + 4 = 12 edges. Top ring, bottom ring, uprights!',
    });
  }
  function learnVertices(stage, api) {
    learnScreen(stage, api, {
      kind: 'cube',
      k: 'vertex',
      pips: true,
      chips: true,
      title: 'Vertices (corners)',
      text: 'A <b>vertex</b> is a corner. Two or more are <b>vertices</b>. Click every corner.',
      say: 'Count the top 4 corners, then the bottom 4.',
      nudge: 'One corner is hiding. Turn the dice or look underneath!',
      doneSay: '4 + 4 = 8 vertices. 4 on top, 4 on the bottom.',
    });
  }
  function learnCurved(stage, api) {
    api.say('A tin has flat faces and a curved surface. Click them all.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Flat or curved?', 'Click the <b>flat faces</b> and the <b>curved surface</b> of the tin. Turn it to see underneath.'));
    var facts = el('div', { class: 'fev-after' });
    var flatN = el('b', null, '0'), curvN = el('b', null, '0');
    var tally = el('div', { class: 'fev-chips' },
      el('span', { class: 'fev-chip', style: { borderColor: FACE_COL.top.ink } }, flatN, ' flat faces'),
      el('span', { class: 'fev-chip', style: { borderColor: FACE_COL.curved.ink } }, curvN, ' curved surface'));
    var v = viewer(api, 'cylinder', {
      mode: 'face',
      W: 380,
      H: 290,
      onRepeat: function () { api.feedback('Already counted! That one has a mark.', 'info'); },
      onMark: function (k, gi, n) {
        var m = model('cylinder'), f = 0, c = 0;
        Object.keys(v.marks.face).forEach(function (g) { if (m.F[g].curved) c++; else f++; });
        flatN.textContent = String(f);
        curvN.textContent = String(c);
        if (n >= m.F.length) {
          api.sound('correct');
          api.unlockNext();
          facts.appendChild(el('div', { class: 'fev-facts' },
            el('div', null, el('b', null, '2'), ' flat faces (circles)'),
            el('div', null, el('b', null, '1'), ' curved surface'),
            el('div', null, el('b', null, '2'), ' curved edges'),
            el('div', null, el('b', null, '0'), ' vertices: no corners!')));
          api.say('2 flat faces, 1 curved surface, and no corners at all!', 'cheer');
          api.feedback('A tin: 2 flat circle faces + 1 curved surface. Some books call all 3 "faces".', 'good');
        } else if (v.seenUnmarked('face') === 0) {
          api.say('Look underneath. Is there another flat face?', 'think');
        }
      },
    });
    stage.appendChild(el('div', { class: 'fev-row' }, v.el, el('div', { class: 'fev-side' }, tally, facts)));
  }

  /* ---------------------------------------------------------------- *
   * Practice: the deck
   * ---------------------------------------------------------------- */
  var RIDDLE_POOL = ['cube', 'cuboid', 'triPrism', 'hexPrism', 'triPyramid', 'sqPyramid', 'cylinder', 'cone', 'sphere'];
  var RIDDLES = [
    { text: 'I have 8 faces.', about: 'F', near: ['cuboid', 'triPrism'], test: function (P) { return !P.curved && P.F === 8; } },
    { text: 'I have no corners and no edges.', about: 'VE', near: ['cylinder'], test: function (P) { return P.V === 0 && P.E === 0; } },
    { text: 'My faces are triangles and one square.', about: 'shapes', near: ['triPyramid', 'cube'], test: function (P) { return !P.curved && P.shapes.square === 1 && P.shapes.triangle === P.F - 1; } },
    { text: 'I have a curved surface and just one flat face: a circle.', about: 'curved', near: ['cylinder'], test: function (P) { return P.curved && P.flat === 1 && P.shapes.circle === 1; } },
    { text: 'I have 6 faces. They are all squares.', about: 'shapes', near: ['cuboid'], test: function (P) { return !P.curved && P.F === 6 && P.shapes.square === 6; } },
    { text: 'I have 9 edges and 6 vertices.', about: 'EV', near: ['triPyramid', 'cuboid'], test: function (P) { return P.E === 9 && P.V === 6; } },
    { text: 'I have 4 faces. They are all triangles.', about: 'shapes', near: ['sqPyramid'], test: function (P) { return !P.curved && P.F === 4 && P.shapes.triangle === 4; } },
    { text: 'I have 2 flat circle faces and a curved surface.', about: 'curved', near: ['cone'], test: function (P) { return P.curved && P.shapes.circle === 2; } },
    { text: 'I have 6 faces, but they are not all squares.', about: 'shapes', near: ['cube'], test: function (P) { return !P.curved && P.F === 6 && P.shapes.square < 6; } },
    { text: 'I have 5 vertices.', about: 'V', near: ['triPyramid', 'triPrism'], test: function (P) { return P.V === 5; } },
    { text: 'I have 12 vertices.', about: 'V', near: ['cube', 'triPrism'], test: function (P) { return P.V === 12; } },
    { text: 'I have just 1 vertex: a point at the top.', about: 'V', near: ['sphere', 'sqPyramid'], test: function (P) { return P.V === 1; } },
  ];
  RIDDLES.forEach(function (r, i) {
    var hits = RIDDLE_POOL.filter(function (k) { return r.test(props(k)); });
    if (hits.length !== 1) console.error(ID + ': riddle ' + i + ' fits ' + hits.join(','));
    r.answer = hits[0];
  });

  /** A short true fact about a shape, about the thing a clue is asking. */
  function fact(kind, about) {
    var P = props(kind), N = nameOf(kind);
    function shapesText() {
      if (P.curved) return P.flat ? P.flat + ' flat circle face' + (P.flat > 1 ? 's' : '') + ' and a curved surface' : 'one curved surface and no flat faces';
      var bits = [];
      ['square', 'rectangle', 'triangle', 'pentagon', 'hexagon', 'octagon'].forEach(function (s) {
        var n = P.shapes[s];
        if (n) bits.push(n + ' ' + s + (n > 1 ? 's' : ''));
      });
      return 'faces: ' + bits.join(' and ');
    }
    function vText() { return P.V === 0 ? 'no corners' : P.V === 1 ? '1 vertex' : P.V + ' vertices'; }
    function eText() { return P.E === 0 ? 'no edges' : P.E + ' edge' + (P.E > 1 ? 's' : ''); }
    var t;
    if (about === 'F') t = P.curved ? 'has a curved surface' : 'has ' + P.F + ' faces';
    else if (about === 'V') t = 'has ' + vText();
    else if (about === 'VE' || about === 'EV') t = 'has ' + eText() + ' and ' + vText();
    else if (about === 'curved') t = 'has ' + (P.curved ? shapesText() : 'only flat faces');
    else t = 'has ' + shapesText();
    return 'The ' + N.toLowerCase() + ' ' + t + '.';
  }

  /* Clue tiles for "make your own riddle". */
  function tileSet(kind) {
    var P = props(kind);
    var c = [];
    function add(text, test, tagFn) { c.push({ text: text, test: test, tag: tagFn }); }
    function facesTile(n) { add('I have ' + n + ' faces', function (Q) { return !Q.curved && Q.F === n; }, function (Q) { return n === Q.E || n === Q.V ? T.fe : T.falseClue; }); }
    function edgesTile(n) { add(n === 0 ? 'I have no edges' : 'I have ' + n + ' edge' + (n > 1 ? 's' : ''), function (Q) { return Q.E === n; }, function (Q) { return n === Q.V ? T.ev : T.falseClue; }); }
    function vertsTile(n) { add(n === 0 ? 'I have no corners' : 'I have ' + n + (n > 1 ? ' vertices' : ' vertex'), function (Q) { return Q.V === n; }, function (Q) { return n === Q.E ? T.ev : T.falseClue; }); }
    function shapeTile(s) { add('I have a ' + s + ' face', function (Q) { return Q.shapes[s] > 0; }, function () { return T.falseClue; }); }
    if (!P.curved) { facesTile(P.F); if (P.E !== P.F) facesTile(P.E); facesTile(P.F + 1); }
    edgesTile(P.E);
    if (P.V !== P.E) edgesTile(P.V);
    vertsTile(P.V);
    if (P.E !== P.V) vertsTile(P.E);
    if (P.V === 0) vertsTile(1);
    add('I have a curved surface', function (Q) { return Q.curved; }, function () { return T.curvedFace; });
    add('All my faces are flat', function (Q) { return !Q.curved; }, function () { return T.curvedFace; });
    ['triangle', 'square', 'circle', 'hexagon'].forEach(shapeTile);
    add('I am a prism', function (Q) { return Q.type === 'prism'; }, function () { return T.type; });
    add('I am a pyramid', function (Q) { return Q.type === 'pyramid'; }, function () { return T.type; });
    var seen = {};
    c = c.filter(function (t) { if (seen[t.text]) return false; seen[t.text] = 1; return true; });
    var yes = U.shuffle(c.filter(function (t) { return t.test(P); })).slice(0, 4);
    var no = U.shuffle(c.filter(function (t) { return !t.test(P); }));
    // keep the "edges vs vertices" trap tiles if there are any
    no.sort(function (a, b) { return (b.tag(P) === T.ev ? 1 : 0) - (a.tag(P) === T.ev ? 1 : 0); });
    no = no.slice(0, 8 - yes.length);
    return U.shuffle(yes.concat(no));
  }
  function fits(tiles) {
    return RIDDLE_POOL.filter(function (k) { return tiles.every(function (t) { return t.test(props(k)); }); });
  }

  var NAME_FAMILY = ['triPrism', 'cube', 'cuboid', 'pentPrism', 'hexPrism', 'octPrism', 'triPyramid', 'sqPyramid', 'pentPyramid', 'hexPyramid'];
  function nameOptions(kind) {
    var m = model(kind);
    var same = NAME_FAMILY.filter(function (k) { return k !== kind && model(k).n === m.n; });
    var sameType = NAME_FAMILY.filter(function (k) { return k !== kind && model(k).type === m.type && same.indexOf(k) < 0; });
    var other = NAME_FAMILY.filter(function (k) { return k !== kind && same.indexOf(k) < 0 && sameType.indexOf(k) < 0; });
    var pick = U.shuffle(same).slice(0, 1).concat(U.shuffle(sameType).slice(0, 1));
    U.shuffle(other.concat(sameType, same)).forEach(function (k) { if (pick.length < 3 && pick.indexOf(k) < 0) pick.push(k); });
    return U.shuffle([kind].concat(pick));
  }

  var deck = null;
  function buildDeck() {
    var q = [];
    // Level 1: cube, cuboid, square-based pyramid — faces and vertices, counted by clicking.
    var l1;
    do {
      var combos = [];
      ['cube', 'cuboid', 'sqPyramid'].forEach(function (k) { ['faces', 'vertices'].forEach(function (a) { combos.push({ kind: k, ask: a }); }); });
      combos = U.shuffle(combos);
      l1 = [];
      ['cube', 'cuboid', 'sqPyramid'].forEach(function (k) { l1.push(combos.filter(function (c) { return c.kind === k; })[0]); });
      l1.push(combos.filter(function (c) { return l1.indexOf(c) < 0; })[0]);
      l1 = U.shuffle(l1);
    } while (!l1.some(function (c) { return c.ask === 'faces'; }) || !l1.some(function (c) { return c.ask === 'vertices'; }));
    l1.forEach(function (c) { q.push({ type: 'count', kind: c.kind, ask: c.ask }); });
    // Level 2: edges on a new shape, a curved shape card, a properties card.
    var edgeKind = U.pick(['triPrism', 'triPyramid', 'hexPrism']);
    q.push({ type: 'count', kind: edgeKind, ask: 'edges' });
    q.push({ type: 'curved', kind: U.pick(['cylinder', 'cone', 'sphere']) });
    q.push({ type: 'card', kind: U.pick(['triPrism', 'hexPrism', 'triPyramid', 'octPrism'].filter(function (k) { return k !== edgeKind; })) });
    // Level 3: two riddles (different answers), then make your own riddle.
    var rs = U.shuffle(RIDDLES.slice());
    var r1 = rs[0], r2 = rs.filter(function (r) { return r.answer !== r1.answer; })[0];
    [r1, r2].forEach(function (r) {
      var near = r.near.filter(function (k) { return !r.test(props(k)); });
      var rest = U.shuffle(RIDDLE_POOL.filter(function (k) { return k !== r.answer && near.indexOf(k) < 0 && !r.test(props(k)); }));
      var opts = U.shuffle([r.answer].concat(near.concat(rest).slice(0, 4)));
      q.push({ type: 'riddle', riddle: r, options: opts });
    });
    var secret = U.pick(['cube', 'cuboid', 'triPrism', 'hexPrism', 'triPyramid', 'sqPyramid', 'cylinder', 'cone'].filter(function (k) { return k !== r1.answer && k !== r2.answer; }));
    q.push({ type: 'build', kind: secret, tiles: tileSet(secret) });
    return q;
  }

  function answerOf(q) {
    var P = props(q.kind || 'cube');
    if (q.type === 'count') return { faces: P.F, edges: P.E, vertices: P.V }[q.ask];
    if (q.type === 'curved') return [P.flat, P.curvedS, P.V].join(',');
    if (q.type === 'card') return [q.kind, P.type, P.F, P.E, P.V].join(',');
    if (q.type === 'riddle') return q.riddle.answer;
    return q.kind;
  }

  /* ---------------------------------------------------------------- *
   * Practice renderers
   * ---------------------------------------------------------------- */
  function renderCount(stage, api, q) {
    var k = ASK[q.ask];
    var obj = KINDS[q.kind].obj;
    api.say('Click each ' + PART1[k] + ' once. Then type how many.', 'think');
    stage.appendChild(MQ.ui.prompt('How many <b>' + q.ask + '</b> does this ' + obj + ' have?'));
    var total = groupsOf(model(q.kind), k).length;
    var tally = el('div', { class: 'fev-tally' }, 'Marked: ', el('b', { class: 'fev-n' }, '0'));
    var after = el('div', { class: 'fev-after' });
    var v = viewer(api, q.kind, {
      mode: k,
      pips: q.kind === 'cube',
      onRepeat: function () { api.feedback('Already counted. Find one without a mark.', 'info'); },
      onMark: function (kk, gi, n) { tally.querySelector('.fev-n').textContent = String(n); },
    });
    var input = MQ.ui.numberInput({
      onSubmit: function (num) {
        if (api.isAnswered()) return;
        var r = judgeCount(q.kind, k, num, v.count(k), api.tries());
        if (r.ok) {
          input.good();
          input.disable();
          api.check(true, total + ' ' + q.ask + '! ' + (q.ask === 'edges' ? 'Ring by ring is the way.' : 'Careful counting.'));
          after.appendChild(labelledSum(q.kind, k));
        } else {
          input.bad();
          api.check(false, r.hint, r.tag);
        }
      },
    });
    var side = el('div', { class: 'fev-side' },
      el('div', { class: 'fev-what' }, k === 'face' ? 'Faces are the flat sides.' : k === 'edge' ? 'Edges are the lines where faces meet.' : 'Vertices are the corners.'),
      tally, input.el, after);
    stage.appendChild(el('div', { class: 'fev-row', 'data-answer': total, 'data-q': JSON.stringify({ type: 'count', kind: q.kind, ask: q.ask }) }, v.el, side));
    api.onReveal(function () {
      v.markAll(k);
      tally.querySelector('.fev-n').textContent = String(total);
      input.setValue(total);
      input.good();
      input.disable();
      MQ.clear(after);
      after.appendChild(labelledSum(q.kind, k));
      spinRound(v);
      api.feedback(workText(q.kind, k) + ' = ' + total + ' ' + q.ask + '.', 'info');
    });
    input.focus();
  }

  /** Small row of number buttons (0–3). */
  function seg(values, onPick) {
    var row = el('div', { class: 'fev-seg' });
    row.buttons = values.map(function (val) {
      var b = el('button', { class: 'fev-segb', type: 'button', 'data-v': val }, String(val));
      b.addEventListener('click', function () {
        if (row.locked) return;
        row.value = val;
        row.buttons.forEach(function (x) { x.classList.toggle('on', x === b); x.classList.remove('bad'); });
        if (onPick) onPick(val);
      });
      row.appendChild(b);
      return b;
    });
    row.set = function (val, cls) {
      row.value = val;
      row.buttons.forEach(function (x) { x.classList.toggle('on', +x.getAttribute('data-v') === val); x.classList.toggle(cls || 'on', +x.getAttribute('data-v') === val); });
    };
    row.mark = function (cls) {
      row.buttons.forEach(function (x) { x.classList.remove('good', 'bad'); if (x.classList.contains('on')) x.classList.add(cls); });
    };
    return row;
  }

  function renderCurved(stage, api, q) {
    var P = props(q.kind);
    var obj = KINDS[q.kind].obj;
    api.say('Click to check: which parts are flat, which are curved?', 'think');
    stage.appendChild(MQ.ui.prompt('Look at the ' + obj + '. Fill in the card.'));
    var v = viewer(api, q.kind, {
      mode: 'face',
      W: 340,
      H: 270,
      onRepeat: function () { api.feedback('Already marked.', 'info'); },
    });
    var rows = [
      { key: 'flat', label: 'Flat faces', want: P.flat },
      { key: 'curved', label: 'Curved surfaces', want: P.curvedS },
      { key: 'vert', label: 'Vertices (corners)', want: P.V },
    ];
    var card = el('div', { class: 'fev-card' });
    rows.forEach(function (r) {
      r.seg = seg([0, 1, 2, 3]);
      r.line = el('div', { class: 'fev-crow', 'data-key': r.key, 'data-want': r.want }, el('span', { class: 'fev-clab' }, r.label), r.seg);
      card.appendChild(r.line);
    });
    var after = el('div', { class: 'fev-after' });
    var btn = el('button', { class: 'btn fev-checkbtn', type: 'button' }, 'Check ✓');
    function hintFor(r, val) {
      var t = api.tries();
      if (r.key === 'flat') {
        if (q.kind === 'cylinder' && val === 3) return { h: 'The curved side is not flat. Count only the flat circles.', tag: T.curvedFace };
        if (q.kind === 'cone' && val === 2) return { h: 'The curved part is not flat. Only the circle at the bottom is flat.', tag: T.curvedFace };
        if (q.kind === 'sphere') return { h: 'A ball is curved all over. Can you find anything flat?', tag: T.curvedFace };
        if (val < r.want) return { h: 'Turn it and look underneath. Is there another flat face?' + (t >= 1 ? ' A tin has a flat circle on top AND on the bottom.' : ''), tag: T.hidden };
        return { h: 'Click the flat parts on the picture and count them.', tag: T.curvedFace };
      }
      if (r.key === 'curved') return { h: 'The curved surface is the part that rolls. It goes all the way round as one piece. How many?', tag: T.curvedFace };
      if (q.kind === 'cone') return val === 0 ? { h: 'Look at the very top of the party hat. That sharp point is a vertex.', tag: T.curvedCorner } : { h: 'Only one sharp point: the tip at the top.', tag: T.curvedCorner };
      if (q.kind === 'cylinder' && val === 2) return { h: 'A tin has 2 curved edges, but no corners. Edges are lines; vertices are sharp points.', tag: T.ev };
      return { h: 'Is there any sharp point? ' + (q.kind === 'sphere' ? 'A ball is smooth all over.' : 'The edges of a tin are round circles.'), tag: T.curvedCorner };
    }
    btn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      if (rows.some(function (r) { return r.seg.value == null; })) { api.feedback('Pick a number on every line first.', 'info'); return; }
      var bad = null;
      rows.forEach(function (r) {
        var ok = r.seg.value === r.want;
        r.seg.mark(ok ? 'good' : 'bad');
        if (ok) r.seg.locked = true;
        if (!ok && !bad) bad = r;
      });
      if (!bad) {
        btn.disabled = true;
        after.appendChild(el('div', { class: 'fev-small' }, fact(q.kind, 'curved')));
        api.check(true, 'Yes! ' + fact(q.kind, 'curved').replace('The ', 'A ').replace(/\.$/, '') + (P.V === 1 ? ', and 1 point at the top.' : ', and no corners.'));
      } else {
        var h = hintFor(bad, bad.seg.value);
        api.check(false, h.h, h.tag);
      }
    });
    stage.appendChild(el('div', { class: 'fev-row', 'data-answer': answerOf(q), 'data-q': JSON.stringify({ type: 'curved', kind: q.kind }) }, v.el, el('div', { class: 'fev-side' }, card, btn, after)));
    api.onReveal(function () {
      v.markAll('face');
      rows.forEach(function (r) { r.seg.set(r.want); r.seg.mark('good'); r.seg.locked = true; });
      btn.disabled = true;
      MQ.clear(after);
      after.appendChild(el('div', { class: 'fev-facts' },
        el('div', null, el('b', null, String(P.flat)), ' flat face' + (P.flat === 1 ? '' : 's') + (P.flat ? ' (gold)' : '')),
        el('div', null, el('b', null, String(P.curvedS)), ' curved surface (blue)'),
        el('div', null, el('b', null, String(P.V)), P.V === 1 ? ' vertex: the point at the top' : ' vertices: no sharp corners')));
      spinRound(v);
      api.feedback(fact(q.kind, 'curved') + (P.V === 1 ? ' It has 1 vertex: the point.' : ' No corners.'), 'info');
    });
  }

  /** Faces / Edges / Corners switch for a shape on a card. */
  function modeSwitch(v, onChange) {
    var row = el('div', { class: 'fev-modes' });
    [['face', 'Faces'], ['edge', 'Edges'], ['vertex', 'Corners']].forEach(function (p) {
      var b = el('button', { class: 'fev-modeb' + (v.st.mode === p[0] ? ' on' : ''), type: 'button', 'data-mode': p[0] }, p[1]);
      b.addEventListener('click', function () {
        v.setMode(p[0]);
        Array.prototype.forEach.call(row.children, function (x) { x.classList.toggle('on', x === b); });
        if (onChange) onChange(p[0]);
      });
      row.appendChild(b);
    });
    return row;
  }

  function renderCard(stage, api, q) {
    var P = props(q.kind);
    api.say('Fill in the card. Click the shape to help you count.', 'think');
    stage.appendChild(MQ.ui.prompt('Fill in the <b>properties card</b> for this ' + KINDS[q.kind].obj + '.'));
    var tallies = {};
    var v = viewer(api, q.kind, {
      mode: 'face',
      W: 320,
      H: 260,
      onRepeat: function () { api.feedback('Already marked.', 'info'); },
      onMark: function (k, gi, n) { tallies[k].textContent = String(n); },
    });
    var tallyRow = el('div', { class: 'fev-chips fev-chips-sm' });
    ['face', 'edge', 'vertex'].forEach(function (k) {
      tallies[k] = el('b', null, '0');
      tallyRow.appendChild(el('span', { class: 'fev-chip' }, tallies[k], ' ' + (k === 'vertex' ? 'corners' : PART[k]) + ' marked'));
    });
    var viewCol = el('div', { class: 'fev-view' }, el('div', { class: 'fev-small' }, 'Click to mark:'), modeSwitch(v), v.el, tallyRow);

    var names = nameOptions(q.kind);
    var nameCh = el('div', { class: 'fev-names' });
    var chosen = { name: null, type: null };
    function pickGroup(container, opts, key) {
      opts.forEach(function (o) {
        var b = el('button', { class: 'fev-opt', type: 'button', 'data-v': o.value }, o.label);
        b.addEventListener('click', function () {
          if (container.locked) return;
          chosen[key] = o.value;
          Array.prototype.forEach.call(container.children, function (x) { x.classList.toggle('on', x === b); x.classList.remove('bad'); });
        });
        container.appendChild(b);
      });
    }
    pickGroup(nameCh, names.map(function (k) { return { label: nameOf(k), value: k }; }), 'name');
    var typeCh = el('div', { class: 'fev-types' });
    pickGroup(typeCh, [{ label: 'Prism', value: 'prism' }, { label: 'Pyramid', value: 'pyramid' }, { label: 'Neither', value: 'neither' }], 'type');
    function numIn(key) {
      return el('input', { class: 'fev-in', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'data-key': key, 'aria-label': key, placeholder: '?' });
    }
    var ins = { F: numIn('faces'), E: numIn('edges'), V: numIn('vertices') };
    var card = el('div', { class: 'fev-card fev-pcard' },
      el('div', { class: 'fev-clab' }, 'Name'), nameCh,
      el('div', { class: 'fev-clab' }, 'Prism, pyramid or neither?'), typeCh,
      el('div', { class: 'fev-nums' },
        el('label', null, el('span', null, 'Faces'), ins.F),
        el('label', null, el('span', null, 'Edges'), ins.E),
        el('label', null, el('span', null, 'Vertices'), ins.V)));
    var btn = el('button', { class: 'btn fev-checkbtn', type: 'button' }, 'Check ✓');
    var after = el('div', { class: 'fev-after' });
    function markBtn(container, val, cls) {
      Array.prototype.forEach.call(container.children, function (x) {
        x.classList.remove('good', 'bad');
        if (x.getAttribute('data-v') === val) x.classList.add(cls);
      });
    }
    function check() {
      if (api.isAnswered()) return;
      var vals = {};
      var missing = !chosen.name || !chosen.type;
      ['F', 'E', 'V'].forEach(function (k) {
        var n = U.parseNum(ins[k].value);
        vals[k] = n;
        if (isNaN(n)) missing = true;
      });
      if (missing) { api.feedback('Fill in every part of the card first.', 'info'); return; }
      var fails = [];
      var nameOk = chosen.name === q.kind;
      markBtn(nameCh, chosen.name, nameOk ? 'good' : 'bad');
      if (nameOk) nameCh.locked = true; else fails.push('name');
      var typeOk = chosen.type === P.type;
      markBtn(typeCh, chosen.type, typeOk ? 'good' : 'bad');
      if (typeOk) typeCh.locked = true; else fails.push('type');
      [['F', 'face'], ['E', 'edge'], ['V', 'vertex']].forEach(function (p) {
        var ok = vals[p[0]] === P[p[0]];
        ins[p[0]].classList.toggle('good', ok);
        ins[p[0]].classList.toggle('bad', !ok);
        ins[p[0]].disabled = ok;
        if (!ok) fails.push(p[1]);
      });
      if (!fails.length) {
        btn.disabled = true;
        after.appendChild(labelledSum(q.kind, 'edge'));
        after.appendChild(labelledSum(q.kind, 'vertex'));
        api.check(true, 'Perfect card! ' + P.F + ' faces, ' + P.E + ' edges, ' + P.V + ' vertices.');
        return;
      }
      var f = fails[0], t = api.tries(), h, tag;
      if (f === 'name') {
        tag = T.name;
        h = P.type === 'prism' ? 'Look at the two matching ends. What shape are they? A prism is named after its ends.' : 'Look at the base. What shape is it? A pyramid is named after its base.';
        if (t >= 1) h += ' Here the ' + (P.type === 'prism' ? 'ends are ' : 'base is a ') + (P.type === 'prism' ? P.n + '-sided.' : P.n + '-sided shape.');
      } else if (f === 'type') {
        tag = T.type;
        h = 'Does it have two matching ends, or does it come up to one point?';
        if (t >= 1) h += P.type === 'prism' ? ' Two matching ends and flat faces: a prism.' : ' Triangles meeting at one point: a pyramid.';
      } else {
        var r = judgeCount(q.kind, f, vals[f === 'face' ? 'F' : f === 'edge' ? 'E' : 'V'], v.count(f), t);
        h = (f === 'face' ? 'Faces box: ' : f === 'edge' ? 'Edges box: ' : 'Vertices box: ') + r.hint;
        tag = r.tag;
      }
      api.check(false, h, tag);
    }
    btn.addEventListener('click', check);
    stage.appendChild(el('div', { class: 'fev-row fev-row-top', 'data-answer': answerOf(q), 'data-q': JSON.stringify({ type: 'card', kind: q.kind, names: names }) }, viewCol, el('div', { class: 'fev-side' }, card, btn, after)));
    api.onReveal(function () {
      markBtn(nameCh, q.kind, 'good');
      markBtn(typeCh, P.type, 'good');
      nameCh.locked = typeCh.locked = true;
      ins.F.value = P.F; ins.E.value = P.E; ins.V.value = P.V;
      ['F', 'E', 'V'].forEach(function (k) { ins[k].classList.remove('bad'); ins[k].classList.add('good'); ins[k].disabled = true; });
      btn.disabled = true;
      v.markAll('edge');
      v.setMode('edge');
      tallies.edge.textContent = String(P.E);
      api.feedback(nameOf(q.kind) + ': ' + P.F + ' faces, ' + P.E + ' edges, ' + P.V + ' vertices. It is a ' + P.type + '.', 'info');
      MQ.clear(after);
      after.appendChild(labelledSum(q.kind, 'face'));
      after.appendChild(labelledSum(q.kind, 'edge'));
      after.appendChild(labelledSum(q.kind, 'vertex'));
      spinRound(v);
    });
  }

  function renderRiddle(stage, api, q) {
    var r = q.riddle;
    api.say('Read my riddle. Which shape am I?', 'think');
    stage.appendChild(el('div', { class: 'fev-riddle' }, el('span', { class: 'fev-rq' }, '?'), el('span', null, r.text)));
    var grid = el('div', { class: 'fev-tiles', 'data-answer': r.answer, 'data-q': JSON.stringify({ type: 'riddle', text: r.text, options: q.options }) });
    var after = el('div', { class: 'fev-after' });
    var btns = {};
    q.options.forEach(function (k) {
      var b = el('button', { class: 'fev-tile', type: 'button', 'data-v': k }, picture(api, k, 130, 110), el('span', { class: 'fev-tname' }, nameOf(k)));
      btns[k] = b;
      b.addEventListener('click', function () {
        if (api.isAnswered() || b.disabled) return;
        if (k === r.answer) {
          b.classList.add('good');
          Object.keys(btns).forEach(function (x) { btns[x].disabled = true; });
          after.appendChild(el('div', { class: 'fev-small' }, fact(k, r.about)));
          api.check(true, 'Yes! I am a ' + lower(k) + '.');
        } else {
          b.classList.add('bad');
          b.disabled = true;
          var h = 'Not that one. ' + fact(k, r.about);
          if (api.tries() >= 1) h += ' Read the clue again and check each picture.';
          api.check(false, h, T.riddle);
        }
      });
      grid.appendChild(b);
    });
    stage.appendChild(grid);
    stage.appendChild(after);
    api.onReveal(function () {
      Object.keys(btns).forEach(function (x) { btns[x].disabled = true; });
      btns[r.answer].classList.add('good');
      MQ.clear(after);
      after.appendChild(el('div', { class: 'fev-facts' }, el('div', null, fact(r.answer, r.about))));
      var P = props(r.answer);
      if (!P.curved) after.appendChild(labelledSum(r.answer, r.about === 'V' ? 'vertex' : r.about === 'EV' ? 'edge' : 'face'));
      api.feedback('The answer is the ' + lower(r.answer) + '. Check it against the clue.', 'info');
    });
  }

  function renderBuild(stage, api, q) {
    var P = props(q.kind);
    api.say('Make a riddle for me! Pick 3 clues that are true.', 'happy');
    stage.appendChild(MQ.ui.prompt('Your secret shape is a <b>' + lower(q.kind) + '</b>. Pick <b>3 true clues</b> so Bolt can guess it.'));
    var v = viewer(api, q.kind, { mode: 'face', W: 300, H: 250, onRepeat: function () { api.feedback('Already marked.', 'info'); } });
    var viewCol = el('div', { class: 'fev-view' }, el('div', { class: 'fev-small' }, 'Click to count:'), modeSwitch(v), v.el);
    var sel = [];
    var grid = el('div', { class: 'fev-clues', 'data-answer': q.kind, 'data-q': JSON.stringify({ type: 'build', kind: q.kind, tiles: q.tiles.map(function (t) { return t.text; }), truth: q.tiles.map(function (t) { return t.test(P); }) }) });
    var picked = el('div', { class: 'fev-small' }, '0 of 3 clues picked');
    var btn = el('button', { class: 'btn fev-checkbtn', type: 'button' }, 'Bolt, guess my shape!');
    var after = el('div', { class: 'fev-after' });
    var tb = q.tiles.map(function (t, i) {
      var b = el('button', { class: 'fev-clue', type: 'button', 'data-i': i }, t.text);
      b.addEventListener('click', function () {
        if (api.isAnswered()) return;
        var at = sel.indexOf(i);
        if (at >= 0) sel.splice(at, 1);
        else {
          if (sel.length >= 3) { api.feedback('You have 3 clues. Click one to take it away first.', 'info'); return; }
          sel.push(i);
        }
        tb.forEach(function (x, j) { x.classList.toggle('on', sel.indexOf(j) >= 0); x.classList.remove('bad'); });
        picked.textContent = sel.length + ' of 3 clues picked';
      });
      grid.appendChild(b);
      return b;
    });
    function guessLine(idx) {
      var f = fits(idx.map(function (i) { return q.tiles[i]; }));
      if (f.length === 1) return 'Bolt guesses: a ' + lower(f[0]) + '! Your riddle worked.';
      var others = f.filter(function (k) { return k !== q.kind; }).map(lower);
      return 'All true! But a ' + others.join(' or a ') + ' fits too, so Bolt had to guess. A sharper clue helps.';
    }
    btn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      if (sel.length !== 3) { api.feedback('Pick exactly 3 clues.', 'info'); return; }
      var wrong = sel.filter(function (i) { return !q.tiles[i].test(P); });
      if (!wrong.length) {
        btn.disabled = true;
        tb.forEach(function (x) { x.disabled = true; });
        sel.forEach(function (i) { tb[i].classList.add('good'); });
        var line = guessLine(sel);
        after.appendChild(el('div', { class: 'fev-facts' }, el('div', null, line)));
        api.check(true, line);
        return;
      }
      var t = q.tiles[wrong[0]];
      tb[wrong[0]].classList.add('bad');
      var h = '"' + t.text + '" is not true for a ' + lower(q.kind) + '.';
      if (api.tries() >= 1) h += ' ' + fact(q.kind, /face/.test(t.text) && /\d/.test(t.text) ? 'F' : /edge|corner|vert/.test(t.text) ? 'EV' : 'shapes');
      else h += ' Click the shape to check.';
      api.check(false, h, t.tag(P));
    });
    stage.appendChild(el('div', { class: 'fev-row fev-row-top' }, viewCol, el('div', { class: 'fev-side' }, grid, picked, btn, after)));
    api.onReveal(function () {
      var trueIdx = q.tiles.map(function (t, i) { return i; }).filter(function (i) { return q.tiles[i].test(P); });
      var best = null;
      for (var a = 0; a < trueIdx.length && !best; a++)
        for (var b = a + 1; b < trueIdx.length && !best; b++)
          for (var c = b + 1; c < trueIdx.length && !best; c++) {
            var combo = [trueIdx[a], trueIdx[b], trueIdx[c]];
            if (fits(combo.map(function (i) { return q.tiles[i]; })).length === 1) best = combo;
          }
      if (!best) best = trueIdx.slice(0, 3);
      sel = best;
      tb.forEach(function (x, j) { x.classList.remove('bad', 'on'); x.disabled = true; x.classList.toggle('good', best.indexOf(j) >= 0); });
      btn.disabled = true;
      picked.textContent = '3 of 3 clues picked';
      MQ.clear(after);
      after.appendChild(el('div', { class: 'fev-facts' }, el('div', null, 'These 3 clues are all true for a ' + lower(q.kind) + '.'), el('div', null, guessLine(best))));
      api.feedback('True clues for a ' + lower(q.kind) + ': ' + best.map(function (i) { return '"' + q.tiles[i].text + '"'; }).join(', ') + '.', 'info');
    });
  }

  MQ.register(ID, {
    // read-only hooks for the test scripts (not used by the site)
    _test: { props: props, buildDeck: buildDeck, answerOf: answerOf, parts: parts, picture: picture, kinds: Object.keys(KINDS), riddles: RIDDLES, fits: fits },
    learn: [learnFaces, learnEdges, learnVertices, learnCurved],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        var wrap = el('div', { class: 'fev-q', 'data-type': q.type });
        stage.appendChild(wrap);
        if (q.type === 'count') renderCount(wrap, api, q);
        else if (q.type === 'curved') renderCurved(wrap, api, q);
        else if (q.type === 'card') renderCard(wrap, api, q);
        else if (q.type === 'riddle') renderRiddle(wrap, api, q);
        else renderBuild(wrap, api, q);
      },
    },
  });

  var css = [
    '.fev-q{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}',
    '.fev-row{display:flex;flex-wrap:wrap;gap:18px;justify-content:center;align-items:center;width:100%}',
    '.fev-row-top{align-items:flex-start}',
    '.fev-row-top>.fev-side{flex:1 1 330px;max-width:420px}',
    '.fev-row-top>.fev-view{flex:0 1 auto}',
    '.fev-row>*{min-width:0;max-width:100%}',
    '.fev-view{display:flex;flex-direction:column;align-items:center;gap:6px;max-width:100%}',
    '.fev-svg{max-width:100%;height:auto;display:block;user-select:none}',
    '.fev-turnable{background:#fbfcff;border:2px solid var(--paper-2);border-radius:16px;cursor:grab}',
    '.fev-turnable.dragging{cursor:grabbing}',
    '.fev-hit{cursor:pointer}',
    '.fev-badge{font-family:inherit}',
    '.fev-turnbtns{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.fev-tbtn{padding:6px 12px;font-size:.95rem;min-height:0}',
    '.fev-dragnote{font-size:.85rem;color:var(--ink-soft);font-weight:700}',
    '.fev-side{display:flex;flex-direction:column;gap:12px;align-items:center;max-width:440px}',
    '.fev-what{font-size:1.1rem;font-weight:700;color:var(--ink-soft);text-align:center}',
    '.fev-tally{font-size:1.4rem;font-weight:800}',
    '.fev-tally b{display:inline-block;min-width:44px;text-align:center;background:var(--gold);border-radius:10px;padding:0 6px}',
    '.fev-chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}',
    '.fev-chip{border:3px solid var(--line);border-radius:999px;padding:3px 12px;font-weight:800;background:#fff;font-size:1.02rem}',
    '.fev-chips-sm .fev-chip{font-size:.85rem;padding:2px 9px;border-width:2px}',
    '.fev-after{display:flex;flex-direction:column;gap:8px;align-items:center}',
    '.fev-after:empty{display:none}',
    '.fev-sum{display:flex;align-items:flex-start;gap:6px;flex-wrap:wrap;justify-content:center}',
    '.fev-term{display:flex;flex-direction:column;align-items:center;gap:2px}',
    '.fev-num{min-width:48px;height:46px;display:flex;align-items:center;justify-content:center;border:3px solid var(--line);border-radius:12px;background:#fff;font-size:1.5rem;font-weight:900}',
    '.fev-total{background:var(--gold);border-color:#b7791f;color:var(--ink)}',
    '.fev-lab{font-size:.78rem;font-weight:800;color:var(--ink-soft);max-width:84px;text-align:center;line-height:1.1}',
    '.fev-op{font-size:1.5rem;font-weight:900;line-height:46px}',
    '.fev-facts{display:flex;flex-direction:column;gap:4px;font-size:1.1rem;font-weight:700;background:#fff;border:3px solid var(--line);border-radius:14px;padding:8px 14px}',
    '.fev-facts b{display:inline-block;min-width:28px;text-align:center;background:var(--gold);border-radius:8px;margin-right:6px}',
    '.fev-small{font-size:.95rem;color:var(--ink-soft);font-weight:700;text-align:center}',
    '.fev-card{background:#fff;border:3px solid var(--line);border-radius:16px;padding:10px 14px;display:flex;flex-direction:column;gap:8px;max-width:100%}',
    '.fev-crow{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}',
    '.fev-clab{font-weight:800;font-size:1.05rem}',
    '.fev-seg{display:flex;gap:6px}',
    '.fev-segb,.fev-opt,.fev-modeb{border:3px solid var(--line);background:#fff;border-radius:12px;font:inherit;font-weight:800;color:var(--ink);cursor:pointer}',
    '.fev-segb{width:46px;height:44px;font-size:1.2rem}',
    '.fev-segb.on,.fev-opt.on,.fev-modeb.on,.fev-clue.on{border-color:#2563eb;background:#eaf1ff}',
    '.fev-segb.good,.fev-opt.good,.fev-in.good,.fev-tile.good,.fev-clue.good{border-color:var(--good);background:var(--good-bg)}',
    '.fev-segb.bad,.fev-opt.bad,.fev-in.bad,.fev-tile.bad,.fev-clue.bad{border-color:var(--try);background:var(--try-bg)}',
    '.fev-names{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}',
    '.fev-types{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}',
    '.fev-opt{padding:7px 8px;font-size:.98rem;line-height:1.15}',
    '.fev-nums{display:flex;gap:10px;justify-content:space-between;flex-wrap:wrap}',
    '.fev-nums label{display:flex;flex-direction:column;align-items:center;gap:2px;font-weight:800}',
    '.fev-in{width:76px;height:50px;font-size:1.5rem;font-weight:800;text-align:center;border-radius:12px;border:3px solid var(--line);color:var(--ink);font-family:inherit}',
    '.fev-modes{display:flex;gap:6px}',
    '.fev-modeb{padding:5px 12px;font-size:.95rem}',
    '.fev-checkbtn{min-width:170px}',
    '.fev-riddle{display:flex;align-items:center;gap:12px;background:#fffbea;border:3px dashed #e0b84c;border-radius:16px;padding:10px 18px;font-size:1.4rem;font-weight:800;max-width:720px}',
    '.fev-rq{flex:none;width:40px;height:40px;border-radius:50%;background:var(--gold);display:flex;align-items:center;justify-content:center;font-weight:900}',
    '.fev-tiles{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;width:100%;max-width:760px}',
    '.fev-tile{background:#fff;border:3px solid var(--line);border-radius:14px;padding:4px;cursor:pointer;display:flex;flex-direction:column;align-items:center;font:inherit;color:var(--ink)}',
    '.fev-tile:hover:not(:disabled){border-color:var(--accent);transform:translateY(-2px)}',
    '.fev-tile:disabled{cursor:default}',
    '.fev-tile .fev-svg{width:100%!important}',
    '.fev-tname{font-size:.85rem;font-weight:800;text-align:center;line-height:1.1;min-height:2.2em}',
    '.fev-clues{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;width:100%}',
    '.fev-clue{border:3px solid var(--line);background:#fff;border-radius:12px;padding:8px 10px;font:inherit;font-weight:800;font-size:1rem;color:var(--ink);cursor:pointer;text-align:center}',
    '.fev-clue:disabled{cursor:default}',
    '@media (max-width:700px){.fev-tiles{grid-template-columns:repeat(3,minmax(0,1fr))}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

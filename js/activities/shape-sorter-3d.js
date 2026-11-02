/* 3D Shape Sorter (Unit 4.1): sort everyday 3D objects by their edges, surfaces,
 * face shapes and number of corners, in boxes and in a 2-circle Venn diagram.
 * Polyhedra are drawn from a small 3D model (vertex + face lists), so every count the
 * child makes from a picture is computed from the same data that draws it.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;
  var ID = 'shape-sorter-3d';
  var INK = '#1b2a4a';
  var uid = 0;

  /* ---------------------------------------------------------------- *
   * Tiny 3D toolkit
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

  /** Build a convex polyhedron: centres it, finds edges, outward normals and adjacency. */
  function model(verts, faces, info) {
    var c = avg(verts);
    verts = verts.map(function (v) { return sub(v, c); });
    var edges = [];
    var edgeFaces = [];
    var seen = {};
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
      if (dot(n, avg(p)) < 0) n = mul(n, -1);
      return unit(n);
    });
    var radius = 0;
    verts.forEach(function (v) { radius = Math.max(radius, len(v)); });
    var shapes = faces.map(function (f) { return faceShape(f.map(function (i) { return verts[i]; })); });
    return { verts: verts, faces: faces, edges: edges, edgeFaces: edgeFaces, vertFaces: vertFaces, normals: normals, radius: radius, shapes: shapes, info: info || {} };
  }

  function faceShape(p) {
    if (p.length === 3) return 'triangle';
    if (p.length === 4) {
      var a = len(sub(p[1], p[0]));
      var b = len(sub(p[2], p[1]));
      return Math.abs(a - b) / Math.max(a, b) < 0.01 ? 'square' : 'rectangle';
    }
    return { 5: 'pentagon', 6: 'hexagon', 8: 'octagon' }[p.length] || 'polygon';
  }

  function regular(n, r, start) {
    var out = [];
    for (var k = 0; k < n; k++) {
      var a = start + (2 * Math.PI * k) / n;
      out.push([r * Math.cos(a), r * Math.sin(a)]);
    }
    return out;
  }

  /** Prism: a 2D end polygon pushed out along an axis. Faces: 0 = first end, 1 = other end, then the sides. */
  function prism(poly, depth, axis, ends) {
    var n = poly.length;
    function map(p, w) {
      if (axis === 'y') return [p[0], w, p[1]];
      if (axis === 'x') return [w, p[1], p[0]];
      return [p[0], p[1], w];
    }
    var verts = [];
    poly.forEach(function (p) { verts.push(map(p, -depth / 2)); });
    poly.forEach(function (p) { verts.push(map(p, depth / 2)); });
    var faces = [U.range(0, n - 1), U.range(n, 2 * n - 1)];
    for (var i = 0; i < n; i++) faces.push([i, (i + 1) % n, n + ((i + 1) % n), n + i]);
    return model(verts, faces, { kind: 'prism', n: n, ends: ends || ['top', 'bottom'] });
  }

  /** Pyramid: base polygon in the floor plane and one apex above. Face 0 = base. */
  function pyramid(poly, h) {
    var n = poly.length;
    var verts = poly.map(function (p) { return [p[0], 0, p[1]]; });
    verts.push([0, h, 0]);
    var faces = [U.range(0, n - 1)];
    for (var i = 0; i < n; i++) faces.push([i, (i + 1) % n, n]);
    return model(verts, faces, { kind: 'pyramid', n: n });
  }

  function box(w, h, d) {
    // faces: 0 back, 1 front, 2 bottom, 3 right, 4 top, 5 left
    return prism([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], d, 'z', ['front', 'back']);
  }

  /* Decoration helpers: points on a face in model space. */
  function fpts(m, fi) { return m.faces[fi].map(function (i) { return m.verts[i]; }); }
  function onQuad(P, s, t) { return addv(addv(P[0], mul(sub(P[1], P[0]), s)), mul(sub(P[3], P[0]), t)); }
  function quadRect(m, fi, s0, t0, s1, t1, fill) {
    var P = fpts(m, fi);
    return { face: fi, fill: fill, pts: [onQuad(P, s0, t0), onQuad(P, s1, t0), onQuad(P, s1, t1), onQuad(P, s0, t1)] };
  }
  function quadDot(m, fi, s, t, r, fill) {
    var P = fpts(m, fi);
    var c = onQuad(P, s, t);
    var u = unit(sub(P[1], P[0]));
    var v = unit(sub(P[3], P[0]));
    var pts = [];
    for (var k = 0; k < 10; k++) {
      var a = (2 * Math.PI * k) / 10;
      pts.push(addv(c, addv(mul(u, r * Math.cos(a)), mul(v, r * Math.sin(a)))));
    }
    return { face: fi, fill: fill, pts: pts };
  }
  function weighted(m, fi, ws, fill) {
    var P = fpts(m, fi);
    return {
      face: fi,
      fill: fill,
      pts: ws.map(function (w) {
        var s = [0, 0, 0];
        w.forEach(function (k, i) { s = addv(s, mul(P[i], k)); });
        return s;
      }),
    };
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

  /**
   * Draw a polyhedron model into a box. o: {x, y, w, h, yaw, pitch, fit:'bbox'|'radius', look, dots, hit, sel, sw}
   * Visible faces are filled; hidden edges are dashed on top; visible edges solid.
   */
  function renderModel(m, o) {
    var R = m.verts.map(function (v) { return rot(v, o.yaw, o.pitch); });
    var N = m.normals.map(function (n) { return rot(n, o.yaw, o.pitch); });
    var s, mx, my;
    if (o.fit === 'radius') {
      s = (Math.min(o.w, o.h) / (2 * m.radius)) * 0.96;
      mx = 0;
      my = 0;
    } else {
      var x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      R.forEach(function (p) {
        x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]);
        y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
      });
      s = Math.min(o.w / (x1 - x0), o.h / (y1 - y0)) * 0.94;
      mx = (x0 + x1) / 2;
      my = (y0 + y1) / 2;
    }
    var cx = o.x + o.w / 2, cy = o.y + o.h / 2;
    function P2(p) { return [cx + (p[0] - mx) * s, cy - (p[1] - my) * s]; }
    var scr = R.map(P2);
    var look = o.look || {};
    var sw = o.sw || 2;
    var faceVis = N.map(function (n) { return n[2] > 1e-6; });
    var sel = o.sel || {};
    var g = S('g', { class: 'ss-model' });
    function ptsStr(arr) { return arr.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '); }

    m.faces.forEach(function (f, fi) {
      if (!faceVis[fi]) return;
      var base = (look.faceFill && look.faceFill[fi]) || look.fill || '#dde6ff';
      var k = Math.max(0, dot(N[fi], LIGHT));
      var fill = sel.face === fi ? '#ffe066' : shade(base, 0.8 + 0.2 * k);
      var attrs = { points: ptsStr(f.map(function (i) { return scr[i]; })), fill: fill, stroke: 'none' };
      if (o.hit) { attrs['data-kind'] = 'face'; attrs['data-i'] = fi; attrs.class = 'ss-hit-face'; }
      g.appendChild(S('polygon', attrs));
      (look.decor || []).forEach(function (d) {
        if (d.face !== fi || sel.face === fi) return;
        var dp = { points: ptsStr(d.pts.map(function (p) { return P2(rot(p, o.yaw, o.pitch)); })), fill: d.fill, stroke: 'none', 'pointer-events': 'none' };
        g.appendChild(S('polygon', dp));
      });
    });
    var edgeVis = m.edgeFaces.map(function (fs) { return fs.some(function (fi) { return faceVis[fi]; }); });
    m.edges.forEach(function (e, ei) {
      if (edgeVis[ei]) return;
      g.appendChild(S('line', { x1: scr[e[0]][0], y1: scr[e[0]][1], x2: scr[e[1]][0], y2: scr[e[1]][1], stroke: INK, 'stroke-width': sw * 0.75, 'stroke-dasharray': sw * 2.4 + ' ' + sw * 2, opacity: 0.7, 'pointer-events': 'none', class: 'ss-hidden-edge' }));
    });
    m.edges.forEach(function (e, ei) {
      if (!edgeVis[ei]) return;
      var on = sel.edge === ei;
      g.appendChild(S('line', { x1: scr[e[0]][0], y1: scr[e[0]][1], x2: scr[e[1]][0], y2: scr[e[1]][1], stroke: on ? '#ff7b00' : INK, 'stroke-width': on ? sw * 3.2 : sw, 'stroke-linecap': 'round', 'pointer-events': 'none' }));
      if (o.hit) g.appendChild(S('line', { x1: scr[e[0]][0], y1: scr[e[0]][1], x2: scr[e[1]][0], y2: scr[e[1]][1], stroke: 'transparent', 'stroke-width': 16, 'data-kind': 'edge', 'data-i': ei, class: 'ss-hit-edge' }));
    });
    var vertVis = m.vertFaces.map(function (fs) { return fs.some(function (fi) { return faceVis[fi]; }); });
    if (o.dots) {
      scr.forEach(function (p, vi) {
        if (vertVis[vi]) g.appendChild(S('circle', { cx: p[0], cy: p[1], r: sw * 1.7, fill: INK, 'pointer-events': 'none' }));
        else g.appendChild(S('circle', { cx: p[0], cy: p[1], r: sw * 1.3, fill: '#fff', stroke: INK, 'stroke-width': sw * 0.6, opacity: 0.8, 'pointer-events': 'none' }));
      });
    }
    if (sel.vertex != null && vertVis[sel.vertex]) {
      g.appendChild(S('circle', { cx: scr[sel.vertex][0], cy: scr[sel.vertex][1], r: 9, fill: '#e63946', stroke: '#fff', 'stroke-width': 2.5, class: 'ss-vpop', 'pointer-events': 'none' }));
    }
    if (o.hit) {
      scr.forEach(function (p, vi) {
        if (!vertVis[vi]) return;
        g.appendChild(S('circle', { cx: p[0], cy: p[1], r: 13, fill: 'transparent', 'data-kind': 'vertex', 'data-i': vi, class: 'ss-hit-vertex' }));
      });
    }
    return { g: g, scr: scr, faceVis: faceVis, edgeVis: edgeVis, vertVis: vertVis };
  }

  /* ---------------------------------------------------------------- *
   * Curved shapes, drawn by hand (no faces/edges to count except circles)
   * ---------------------------------------------------------------- */
  function dashed(sw) { return { fill: 'none', stroke: INK, 'stroke-width': sw * 0.75, 'stroke-dasharray': sw * 2.4 + ' ' + sw * 2, opacity: 0.7 }; }

  function drawCylinder(g, x, y, w, h, look, sw) {
    var bw = Math.min(w, h * look.aspect);
    var bh = bw / look.aspect;
    var cx = x + w / 2, top = y + (h - bh) / 2;
    var rx = bw / 2, ry = rx * 0.3;
    var yT = top + ry, yB = top + bh - ry, L = cx - rx, R = cx + rx;
    g.appendChild(S('path', { d: 'M' + L + ',' + yT + ' L' + L + ',' + yB + ' A' + rx + ',' + ry + ' 0 0 0 ' + R + ',' + yB + ' L' + R + ',' + yT + ' Z', fill: look.body, stroke: 'none' }));
    (look.bands || []).forEach(function (b) {
      var y1 = yT + (yB - yT) * b[0], y2 = yT + (yB - yT) * b[1];
      g.appendChild(S('path', { d: 'M' + L + ',' + y1 + ' L' + L + ',' + y2 + ' A' + rx + ',' + ry + ' 0 0 0 ' + R + ',' + y2 + ' L' + R + ',' + y1 + ' A' + rx + ',' + ry + ' 0 0 1 ' + L + ',' + y1 + ' Z', fill: b[2], stroke: 'none' }));
    });
    g.appendChild(S('path', Object.assign({ d: 'M' + L + ',' + yB + ' A' + rx + ',' + ry + ' 0 0 1 ' + R + ',' + yB }, dashed(sw))));
    g.appendChild(S('path', { d: 'M' + L + ',' + yT + ' L' + L + ',' + yB + ' A' + rx + ',' + ry + ' 0 0 0 ' + R + ',' + yB + ' L' + R + ',' + yT, fill: 'none', stroke: INK, 'stroke-width': sw }));
    g.appendChild(S('ellipse', { cx: cx, cy: yT, rx: rx, ry: ry, fill: look.top, stroke: INK, 'stroke-width': sw }));
    if (look.wick) g.appendChild(S('line', { x1: cx, y1: yT, x2: cx, y2: yT - ry * 1.4, stroke: INK, 'stroke-width': sw, 'stroke-linecap': 'round' }));
    if (look.ring) g.appendChild(S('ellipse', { cx: cx, cy: yT, rx: rx * 0.8, ry: ry * 0.8, fill: 'none', stroke: '#9aa5b8', 'stroke-width': sw * 0.6 }));
    return { rimTop: [cx, yT, rx, ry], rimBottom: [cx, yB, rx, ry] };
  }

  function drawCone(g, x, y, w, h, look, sw, dots) {
    var bw = Math.min(w, h * look.aspect);
    var bh = bw / look.aspect;
    var cx = x + w / 2, top = y + (h - bh) / 2;
    var rx = bw / 2, ry = rx * 0.3;
    var yB = top + bh - ry, L = cx - rx, R = cx + rx;
    var d = 'M' + cx + ',' + top + ' L' + L + ',' + yB + ' A' + rx + ',' + ry + ' 0 0 0 ' + R + ',' + yB + ' Z';
    var id = 'ss3d-c' + ++uid;
    g.appendChild(S('clipPath', { id: id }, S('path', { d: d })));
    g.appendChild(S('path', { d: d, fill: look.body, stroke: 'none' }));
    var deco = S('g', { 'clip-path': 'url(#' + id + ')' });
    if (look.stripes) {
      for (var k = -3; k <= 3; k++) {
        var xx = cx + k * rx * 0.55;
        deco.appendChild(S('path', { d: 'M' + cx + ',' + top + ' L' + (xx - rx * 0.12) + ',' + (yB + ry) + ' L' + (xx + rx * 0.12) + ',' + (yB + ry) + ' Z', fill: look.stripes }));
      }
    }
    if (look.spots) {
      [[-0.35, 0.75], [0.3, 0.6], [0, 0.42], [0.45, 0.88], [-0.1, 0.9]].forEach(function (q) {
        deco.appendChild(S('circle', { cx: cx + q[0] * rx, cy: top + q[1] * bh, r: rx * 0.09, fill: look.spots }));
      });
    }
    g.appendChild(deco);
    g.appendChild(S('path', Object.assign({ d: 'M' + L + ',' + yB + ' A' + rx + ',' + ry + ' 0 0 1 ' + R + ',' + yB }, dashed(sw))));
    g.appendChild(S('path', { d: d, fill: 'none', stroke: INK, 'stroke-width': sw, 'stroke-linejoin': 'round' }));
    if (dots) g.appendChild(S('circle', { cx: cx, cy: top, r: sw * 1.7, fill: INK }));
    return { apex: [cx, top], rim: [cx, yB, rx, ry] };
  }

  function drawSphere(g, x, y, w, h, look, sw) {
    var r = Math.min(w, h) / 2 * 0.92;
    var cx = x + w / 2, cy = y + h / 2;
    var id = 'ss3d-c' + ++uid;
    g.appendChild(S('clipPath', { id: id }, S('circle', { cx: cx, cy: cy, r: r })));
    g.appendChild(S('circle', { cx: cx, cy: cy, r: r, fill: look.body }));
    var deco = S('g', { 'clip-path': 'url(#' + id + ')' });
    if (look.segments) {
      deco.appendChild(S('path', { d: 'M' + cx + ',' + (cy - r) + ' Q' + (cx - r * 1.1) + ',' + cy + ' ' + cx + ',' + (cy + r) + ' Q' + (cx - r * 0.35) + ',' + cy + ' ' + cx + ',' + (cy - r) + ' Z', fill: look.segments[0] }));
      deco.appendChild(S('path', { d: 'M' + cx + ',' + (cy - r) + ' Q' + (cx + r * 1.1) + ',' + cy + ' ' + cx + ',' + (cy + r) + ' Q' + (cx + r * 0.35) + ',' + cy + ' ' + cx + ',' + (cy - r) + ' Z', fill: look.segments[1] }));
      deco.appendChild(S('circle', { cx: cx, cy: cy - r * 0.92, r: r * 0.16, fill: '#fff', stroke: INK, 'stroke-width': sw * 0.5 }));
    }
    if (look.swirl) deco.appendChild(S('path', { d: 'M' + (cx - r * 0.7) + ',' + (cy + r * 0.2) + ' Q' + cx + ',' + (cy - r * 0.6) + ' ' + (cx + r * 0.7) + ',' + (cy + r * 0.1), fill: 'none', stroke: look.swirl, 'stroke-width': r * 0.22, 'stroke-linecap': 'round' }));
    if (look.pores) {
      [[-0.4, 0.1], [0.3, 0.35], [0.1, -0.2], [-0.15, 0.5], [0.5, -0.1]].forEach(function (q) {
        deco.appendChild(S('circle', { cx: cx + q[0] * r, cy: cy + q[1] * r, r: r * 0.04, fill: shade(look.body, 0.85) }));
      });
    }
    deco.appendChild(S('ellipse', { cx: cx - r * 0.38, cy: cy - r * 0.42, rx: r * 0.22, ry: r * 0.13, fill: '#fff', opacity: 0.6, transform: 'rotate(-35 ' + (cx - r * 0.38) + ' ' + (cy - r * 0.42) + ')' }));
    g.appendChild(deco);
    g.appendChild(S('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: INK, 'stroke-width': sw }));
    if (look.leaf) g.appendChild(S('path', { d: 'M' + cx + ',' + (cy - r) + ' q' + r * 0.25 + ',' + -r * 0.3 + ' ' + r * 0.5 + ',' + -r * 0.1 + ' q' + -r * 0.25 + ',' + r * 0.25 + ' ' + -r * 0.5 + ',' + r * 0.1 + ' Z', fill: '#52b788', stroke: INK, 'stroke-width': sw * 0.6 }));
  }

  /* ---------------------------------------------------------------- *
   * Everyday objects
   * ---------------------------------------------------------------- */
  var OBJ = {};
  var VIEW = { yaw: -0.62, pitch: 0.42 };

  function addPoly(id, name, shape, m, look, view) {
    OBJ[id] = { id: id, name: name, shape: shape, kind: 'poly', model: m, look: look, view: view || VIEW };
  }
  function addCurved(id, name, shape, look) {
    OBJ[id] = { id: id, name: name, shape: shape, kind: shape, look: look };
  }

  (function () {
    var m = box(2, 2, 2);
    var pipPos = {
      1: [[0.5, 0.5]],
      2: [[0.27, 0.27], [0.73, 0.73]],
      3: [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
      4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
      5: [[0.27, 0.27], [0.73, 0.27], [0.5, 0.5], [0.27, 0.73], [0.73, 0.73]],
      6: [[0.27, 0.22], [0.27, 0.5], [0.27, 0.78], [0.73, 0.22], [0.73, 0.5], [0.73, 0.78]],
    };
    var pips = [];
    [[1, 1], [0, 6], [4, 2], [2, 5], [3, 3], [5, 4]].forEach(function (fp) {
      pipPos[fp[1]].forEach(function (st) { pips.push(quadDot(m, fp[0], st[0], st[1], 0.17, INK)); });
    });
    addPoly('dice', 'dice', 'cube', m, { fill: '#ffffff', decor: pips });

    var gift = box(3.0, 1.5, 2.2);
    var rib = '#d6336c';
    addPoly('gift', 'gift box', 'cuboid', gift, {
      fill: '#ffc2d1',
      decor: [quadRect(gift, 1, 0.45, 0, 0.55, 1, rib), quadRect(gift, 0, 0.45, 0, 0.55, 1, rib), quadRect(gift, 4, 0.45, 0, 0.55, 1, rib), quadRect(gift, 4, 0, 0.45, 1, 0.55, rib), quadRect(gift, 3, 0, 0.45, 1, 0.55, rib), quadRect(gift, 5, 0, 0.45, 1, 0.55, rib)],
    });

    var cer = box(2.2, 3.4, 0.9);
    addPoly('cereal', 'cereal box', 'cuboid', cer, {
      fill: '#ffd166',
      decor: [quadRect(cer, 1, 0.12, 0.12, 0.88, 0.5, '#ef476f'), quadDot(cer, 1, 0.5, 0.72, 0.42, '#ffffff'), quadRect(cer, 0, 0.12, 0.12, 0.88, 0.5, '#ef476f')],
    }, { yaw: -0.55, pitch: 0.3 });

    var shoe = box(3.2, 1.3, 1.9);
    var lid = '#b08968';
    addPoly('shoe', 'shoe box', 'cuboid', shoe, {
      fill: '#e6ccb2',
      faceFill: { 4: '#d5b69a' },
      decor: [quadRect(shoe, 1, 0, 0.7, 1, 1, lid), quadRect(shoe, 0, 0, 0.7, 1, 1, lid), quadRect(shoe, 3, 0.7, 0, 1, 1, lid), quadRect(shoe, 5, 0, 0, 0.3, 1, lid)],
    });

    var choc = prism([[-0.8, -0.6], [0.8, -0.6], [0, 0.786]], 3.6, 'x', ['left end', 'right end']);
    addPoly('choc', 'chocolate box', 'triangular prism', choc, {
      fill: '#e0b084',
      faceFill: { 0: '#c98d5a', 1: '#c98d5a' },
      decor: [quadRect(choc, 3, 0.25, 0.2, 0.7, 0.8, '#f4d35e'), quadRect(choc, 4, 0.25, 0.2, 0.7, 0.8, '#f4d35e')],
    }, { yaw: -0.45, pitch: 0.38 });

    var tent = prism([[-1.5, -1.0], [1.5, -1.0], [0, 1.1]], 3.2, 'z', ['front', 'back']);
    addPoly('tent', 'tent', 'triangular prism', tent, {
      fill: '#b5e48c',
      decor: [weighted(tent, 1, [[0.62, 0.38, 0], [0.38, 0.62, 0], [0.25, 0.25, 0.5]], '#52796f')],
    }, { yaw: -0.6, pitch: 0.32 });

    var pw = pyramid(regular(4, 1.4, Math.PI / 4), 1.8);
    addPoly('paperweight', 'paperweight', 'square-based pyramid', pw, { fill: '#bde0fe' }, { yaw: -0.5, pitch: 0.4 });

    var tea = pyramid(regular(3, 1.25, Math.PI / 2), 1.7);
    addPoly('teabag', 'tea bag', 'triangle-based pyramid', tea, { fill: '#f2e2c4' }, { yaw: 0.25, pitch: 0.42 });

    var hex = prism(regular(6, 1.3, 0), 2.0, 'y', ['top', 'bottom']);
    addPoly('hexbox', 'hexagon box', 'hexagonal prism', hex, { fill: '#d8c4f0', faceFill: { 1: '#c3a6e6' } }, { yaw: -0.3, pitch: 0.45 });

    addCurved('tin', 'tin', 'cylinder', { aspect: 0.78, body: '#e63946', top: '#d9dde4', ring: true, bands: [[0.25, 0.75, '#f1faee'], [0.42, 0.58, '#e63946']] });
    addCurved('glue', 'glue stick', 'cylinder', { aspect: 0.36, body: '#ffffff', top: '#9b5de5', bands: [[0, 0.32, '#9b5de5'], [0.5, 0.8, '#fee440']] });
    addCurved('candle', 'candle', 'cylinder', { aspect: 0.5, body: '#fff3c4', top: '#fff8dc', wick: true });
    addCurved('partyhat', 'party hat', 'cone', { aspect: 0.72, body: '#4cc9f0', stripes: '#f72585', spots: '#fee440' });
    addCurved('coneblock', 'cone block', 'cone', { aspect: 0.9, body: '#ffb703' });
    addCurved('ball', 'ball', 'sphere', { body: '#ffffff', segments: ['#ff595e', '#1982c4'] });
    addCurved('orange', 'orange', 'sphere', { body: '#fb8b24', pores: true, leaf: true });
    addCurved('marble', 'marble', 'sphere', { body: '#a8dadc', swirl: '#457b9d' });
  })();

  /* Properties, computed from the same data that draws the shapes. */
  Object.keys(OBJ).forEach(function (id) {
    var o = OBJ[id];
    var fs = { square: 0, rectangle: 0, triangle: 0, circle: 0, hexagon: 0, pentagon: 0 };
    if (o.kind === 'poly') {
      var m = o.model;
      o.V = m.verts.length;
      o.E = m.edges.length;
      o.F = m.faces.length;
      o.straightE = o.E;
      o.curvedE = 0;
      o.curved = false;
      m.shapes.forEach(function (s) { fs[s] = (fs[s] || 0) + 1; });
      var inf = m.info;
      if (inf.kind === 'prism') o.working = inf.n + ' on the ' + inf.ends[0] + ' + ' + inf.n + ' on the ' + inf.ends[1] + ' = ' + o.V;
      else o.working = inf.n + ' round the base + 1 at the top = ' + o.V;
      o.edgeWorking = o.E + ' straight edges';
    } else if (o.kind === 'cylinder') {
      o.V = 0; o.E = 2; o.straightE = 0; o.curvedE = 2; o.curved = true; fs.circle = 2;
      o.working = 'no corners at all';
      o.edgeWorking = '2 curved edges (circles round the top and bottom)';
    } else if (o.kind === 'cone') {
      o.V = 1; o.E = 1; o.straightE = 0; o.curvedE = 1; o.curved = true; fs.circle = 1;
      o.working = 'just 1 point at the top';
      o.edgeWorking = '1 curved edge (the circle round the bottom)';
    } else {
      o.V = 0; o.E = 0; o.straightE = 0; o.curvedE = 0; o.curved = true;
      o.working = 'no corners at all';
      o.edgeWorking = 'no edges at all';
    }
    o.faceShapes = fs;
    o.edgeType = o.E === 0 ? 'none' : o.curvedE > 0 ? 'curved' : 'straight';
    o.allRect = !o.curved && o.model.shapes.every(function (s) { return s === 'square' || s === 'rectangle'; });
  });

  function cornersPhrase(o) {
    if (o.kind === 'cone') return '1 point (corner)';
    return o.V === 0 ? 'no corners' : o.V + ' corners';
  }

  /** Draw an everyday object into a box. */
  function drawObj(id, x, y, w, h, opt) {
    opt = opt || {};
    var o = OBJ[id];
    var g = S('g', { class: 'ss-obj' });
    var sw = opt.sw || Math.max(1.4, Math.min(w, h) / 40);
    if (o.kind === 'poly') {
      g.appendChild(renderModel(o.model, { x: x, y: y, w: w, h: h, yaw: o.view.yaw, pitch: o.view.pitch, look: o.look, dots: opt.dots, sw: sw }).g);
    } else if (o.kind === 'cylinder') drawCylinder(g, x, y, w, h, o.look, sw);
    else if (o.kind === 'cone') drawCone(g, x, y, w, h, o.look, sw, opt.dots);
    else drawSphere(g, x, y, w, h, o.look, sw);
    return g;
  }
  function objSvg(id, size, opt) {
    return S('svg', { viewBox: '0 0 100 100', width: size, height: size, class: 'ss-pic', 'aria-label': OBJ[id].name, role: 'img' }, drawObj(id, 6, 6, 88, 88, opt));
  }

  /* ---------------------------------------------------------------- *
   * Sorting labels
   * ---------------------------------------------------------------- */
  var LABELS = {
    curved: { key: 'curved', text: 'has a curved surface', test: function (o) { return o.curved; } },
    rect: { key: 'rect', text: 'all faces are rectangles', test: function (o) { return o.allRect; } },
    more5: { key: 'more5', text: 'has more than 5 corners', test: function (o) { return o.V > 5; } },
    fewer6: { key: 'fewer6', text: 'has fewer than 6 corners', test: function (o) { return o.V < 6; } },
    square: { key: 'square', face: 'square', text: 'has a square face', test: function (o) { return o.faceShapes.square > 0; } },
    triangle: { key: 'triangle', face: 'triangle', text: 'has a triangle face', test: function (o) { return o.faceShapes.triangle > 0; } },
    circle: { key: 'circle', face: 'circle', text: 'has a circle face', test: function (o) { return o.faceShapes.circle > 0; } },
  };

  function regionFor(o, A, B) {
    var a = A.test(o), b = B.test(o);
    return a && b ? 'AB' : a ? 'A' : b ? 'B' : 'out';
  }

  /* ---------------------------------------------------------------- *
   * Venn geometry (shared by learn screen 3 and level 3)
   * ---------------------------------------------------------------- */
  var VW = 820, VH = 480;
  var CA = [315, 205], CB = [505, 205], CR = 150;
  var UNI = { x: 10, y: 4, w: 800, h: 368 };
  var TRAY_Y = 428;
  var SLOTS = {
    A: [[212, 205], [268, 118], [268, 292]],
    B: [[608, 205], [552, 118], [552, 292]],
    AB: [[410, 155], [410, 262]],
    out: [[60, 66], [60, 205], [60, 318], [760, 66], [760, 205], [760, 318]],
  };
  function regionAt(p) {
    if (p.x < UNI.x || p.x > UNI.x + UNI.w || p.y < UNI.y || p.y > UNI.y + UNI.h) return null;
    var a = Math.hypot(p.x - CA[0], p.y - CA[1]) <= CR;
    var b = Math.hypot(p.x - CB[0], p.y - CB[1]) <= CR;
    return a && b ? 'AB' : a ? 'A' : b ? 'B' : 'out';
  }
  function vennBoard(A, B, opts) {
    opts = opts || {};
    var svg = S('svg', { viewBox: '0 0 ' + VW + ' ' + VH, class: 'ss-board ss-venn' });
    var uni = S('rect', { x: UNI.x, y: UNI.y, width: UNI.w, height: UNI.h, rx: 14, class: 'ss-uni' });
    var ca = S('circle', { cx: CA[0], cy: CA[1], r: CR, class: 'ss-circ ss-circ-a' });
    var cb = S('circle', { cx: CB[0], cy: CB[1], r: CR, class: 'ss-circ ss-circ-b' });
    svg.appendChild(uni);
    svg.appendChild(ca);
    svg.appendChild(cb);
    svg.appendChild(S('text', { x: CA[0] - 50, y: 40, 'text-anchor': 'middle', class: 'ss-vlabel ss-vlabel-a' }, A.text));
    svg.appendChild(S('text', { x: CB[0] + 50, y: 40, 'text-anchor': 'middle', class: 'ss-vlabel ss-vlabel-b' }, B.text));
    if (opts.outsideHint) svg.appendChild(S('text', { x: UNI.x + 14, y: UNI.y + UNI.h - 12, class: 'ss-vsmall' }, 'fits neither → outside'));
    svg.appendChild(S('rect', { x: 10, y: 386, width: 800, height: 88, rx: 14, class: 'ss-tray' }));
    var layer = S('g');
    svg.appendChild(layer);
    return {
      svg: svg,
      layer: layer,
      highlight: function (reg) {
        ca.classList.toggle('ss-hot', reg === 'A' || reg === 'AB');
        cb.classList.toggle('ss-hot', reg === 'B' || reg === 'AB');
        uni.classList.toggle('ss-hot', reg === 'out');
      },
    };
  }

  /** A token (picture + name) in an SVG board, positioned by its centre. */
  function makeToken(id, size, opts) {
    opts = opts || {};
    var half = size / 2;
    var g = S('g', { class: 'ss-tok', 'data-obj': id });
    g.appendChild(S('rect', { x: -half - 4, y: -half - 4, width: size + 8, height: size + 26, rx: 10, class: 'ss-tok-bg' }));
    g.appendChild(drawObj(id, -half + 2, -half, size - 4, size - 4, { dots: opts.dots }));
    g.appendChild(S('text', { x: 0, y: half + 15, 'text-anchor': 'middle', class: 'ss-tok-name' }, OBJ[id].name));
    g.pos = { x: 0, y: 0 };
    g.moveTo = function (x, y) {
      g.pos = { x: x, y: y };
      g.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    };
    // bring to the front before the drag helper captures the pointer
    g.addEventListener('pointerdown', function () {
      if (g.parentNode && g.parentNode.lastChild !== g) g.parentNode.appendChild(g);
    });
    return g;
  }

  function lessonCheck(text) {
    return el('button', { class: 'btn ss-check', type: 'button' }, text || 'Check ✓');
  }

  /* ---------------------------------------------------------------- *
   * Practice deck
   * ---------------------------------------------------------------- */
  var CURVED_EDGE = ['tin', 'glue', 'candle', 'partyhat', 'coneblock'];
  var SPHERES = ['ball', 'orange', 'marble'];
  var STRAIGHT = ['dice', 'gift', 'cereal', 'shoe', 'choc', 'tent', 'paperweight', 'teabag', 'hexbox'];
  var RECT_G = ['dice', 'gift', 'cereal', 'shoe'];
  var MORE_G = ['tent', 'choc', 'hexbox'];
  var ALL_IDS = Object.keys(OBJ);

  function pickVenn(pair) {
    var A = LABELS[pair[0]], B = LABELS[pair[1]];
    var groups = { A: [], B: [], AB: [], out: [] };
    U.shuffle(ALL_IDS).forEach(function (id) { groups[regionFor(OBJ[id], A, B)].push(id); });
    var caps = { A: 3, B: 3, AB: 2, out: 4 };
    var count = { A: 0, B: 0, AB: 0, out: 0 };
    var chosen = [];
    function take(r) { chosen.push(groups[r].shift()); count[r]++; }
    ['AB', 'out', 'A', 'B'].forEach(function (r) { if (groups[r].length) take(r); });
    while (chosen.length < 6) {
      var open = ['A', 'B', 'AB', 'out'].filter(function (r) { return groups[r].length && count[r] < caps[r]; });
      take(U.pick(open));
    }
    return { type: 'venn', pair: pair, items: U.shuffle(chosen) };
  }

  function buildDeck() {
    var q = [];
    // Level 1: curved edges / straight edges / no edges, with 4, 5 and 6 things.
    var spheres = U.shuffle(SPHERES);
    var straight = U.shuffle(STRAIGHT);
    var curvedRest = U.shuffle(['glue', 'candle']);
    var cones = U.shuffle(['partyhat', 'coneblock']);
    q.push({ type: 'edges', items: U.shuffle(['tin', spheres[0], straight[0], straight[1]]) });
    q.push({ type: 'edges', items: U.shuffle([cones[0], spheres[1], straight[2], straight[3], straight[4]]) });
    q.push({ type: 'edges', items: U.shuffle([curvedRest[0], cones[1], spheres[2], straight[5], straight[6], straight[7]]) });
    // Level 2: tick every label that fits (curved surface / all rectangles / more than 5 corners).
    var curvedAll = U.shuffle(CURVED_EDGE.concat(SPHERES));
    var rects = U.shuffle(RECT_G);
    var mores = U.shuffle(MORE_G);
    var fews = ['paperweight', 'teabag', 'paperweight'];
    for (var i = 0; i < 3; i++) q.push({ type: 'labels', items: U.shuffle([curvedAll[i], rects[i], mores[i], fews[i]]) });
    // Level 3: two Venn diagrams, then "a shape with fewer than 6 corners".
    var pairs = U.shuffle([['square', 'triangle'], ['circle', 'curved'], ['fewer6', 'triangle']]).slice(0, 2);
    q.push(pickVenn(pairs[0]));
    q.push(pickVenn(pairs[1]));
    var right = U.pick(['paperweight', 'paperweight', 'teabag']);
    var dist = [U.pick(['tent', 'choc']), U.pick(RECT_G), U.pick(['hexbox', 'tent', 'choc'].filter(function () { return true; }))];
    if (dist[2] === dist[0]) dist[2] = 'hexbox';
    q.push({ type: 'fewer', right: right, items: U.shuffle([right].concat(dist)) });
    return q;
  }

  var deck = null;

  /* ---------------------------------------------------------------- *
   * Level 1: drag into curved / straight / no edges
   * ---------------------------------------------------------------- */
  var BINS = [
    { key: 'curved', title: 'Curved edges' },
    { key: 'straight', title: 'Straight edges' },
    { key: 'none', title: 'No edges' },
  ];
  function edgeHint(o, put, strong) {
    if (o.edgeType === 'none') return { tag: 'Gave a ball an edge', text: strong ? 'A ' + o.name + ' is smooth all over. It has no edges at all, so it goes in "No edges".' : 'Run your finger over a ' + o.name + '. Can you find an edge?' };
    if (o.kind === 'cylinder') {
      if (put === 'none') return { tag: 'Thought a tin has no edges', text: strong ? 'The ' + o.name + ' has 2 edges: circles round the top and the bottom. Circles are curved.' : 'Where the flat top of the ' + o.name + ' meets its side, there is an edge.' };
      return { tag: 'Said a tin has straight edges', text: strong ? 'The ' + o.name + ' has 2 edges: circles round the top and the bottom. Circles are curved, not straight.' : 'Look at the top of the ' + o.name + '. Its edge goes round in a circle.' };
    }
    if (o.kind === 'cone') {
      if (put === 'none') return { tag: 'Thought a cone has no edges', text: 'The ' + o.name + ' has 1 edge: the circle round the bottom.' };
      return { tag: 'Thought the sloping side of a cone is an edge', text: strong ? 'The sloping side of the ' + o.name + ' is not an edge, it is the curved surface. Its only edge is the circle at the bottom: curved.' : 'Look at the bottom of the ' + o.name + '. What shape is its edge?' };
    }
    if (put === 'none') return { tag: 'Missed the edges of a box shape', text: 'Where two flat faces of the ' + o.name + ' meet, there is an edge. It has ' + o.E + ' straight edges.' };
    return { tag: 'Said a flat-faced shape has curved edges', text: strong ? 'The ' + o.name + ' has ' + o.E + ' edges, and every one is a straight line where two flat faces meet.' : 'Are the edges of the ' + o.name + ' straight lines or curves?' };
  }

  function renderEdges(stage, api, q) {
    api.say('Look at the edges. Curved, straight, or none at all?', 'think');
    stage.appendChild(MQ.ui.prompt('Drag each thing into the right box.'));
    var W = 820, H = 450;
    var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'ss-board ss-bins' });
    svg.appendChild(S('rect', { x: 10, y: 4, width: 800, height: 128, rx: 14, class: 'ss-tray' }));
    var binRects = BINS.map(function (b, i) {
      var x0 = 10 + i * 270;
      var r = S('rect', { x: x0, y: 150, width: 260, height: 292, rx: 14, class: 'ss-bin', 'data-bin': b.key });
      svg.appendChild(r);
      var icon;
      if (b.key === 'curved') icon = S('path', { d: 'M' + (x0 + 20) + ',190 q16,-22 32,0', class: 'ss-bin-icon' });
      else if (b.key === 'straight') icon = S('path', { d: 'M' + (x0 + 20) + ',184 h32', class: 'ss-bin-icon' });
      else icon = S('circle', { cx: x0 + 36, cy: 182, r: 11, class: 'ss-bin-icon' });
      svg.appendChild(icon);
      svg.appendChild(S('text', { x: x0 + 62, y: 190, class: 'ss-bin-title' }, b.title));
      return r;
    });
    var layer = S('g');
    svg.appendChild(layer);
    var state = { place: {}, order: [], locked: false, sel: null };
    var toks = {};
    q.items.forEach(function (id) {
      var t = makeToken(id, 76);
      t.setAttribute('data-answer', OBJ[id].edgeType);
      toks[id] = t;
      state.place[id] = 'tray';
      layer.appendChild(t);
    });
    function layout() {
      var tray = q.items.filter(function (id) { return state.place[id] === 'tray'; });
      tray.forEach(function (id) {
        var i = q.items.indexOf(id);
        toks[id].moveTo(410 + (i - (q.items.length - 1) / 2) * 134, 62);
      });
      BINS.forEach(function (b, bi) {
        var inBin = state.order.filter(function (id) { return state.place[id] === b.key; });
        inBin.forEach(function (id, j) {
          toks[id].moveTo(10 + bi * 270 + 45 + (j % 3) * 85, 255 + Math.floor(j / 3) * 98);
        });
      });
      checkBtn.disabled = state.locked || tray.length > 0;
      help.textContent = tray.length ? 'Put every thing in a box, then press Check.' : 'All sorted? Press Check.';
    }
    function placeIn(id, key) {
      state.place[id] = key;
      state.order = state.order.filter(function (x) { return x !== id; });
      if (key !== 'tray') state.order.push(id);
      toks[id].classList.remove('ss-bad');
      api.sound('pop');
      layout();
    }
    function select(id) {
      Object.keys(toks).forEach(function (k) { toks[k].classList.toggle('ss-sel', k === id); });
      state.sel = id;
    }
    function binAt(p) {
      if (p.y < 150 || p.y > 442) return null;
      for (var i = 0; i < 3; i++) if (p.x >= 10 + i * 270 && p.x <= 270 + i * 270) return BINS[i].key;
      return null;
    }
    q.items.forEach(function (id) {
      var t = toks[id];
      var start = null;
      api.cleanup(
        MQ.ui.drag(svg, t, {
          start: function () { start = { x: t.pos.x, y: t.pos.y }; },
          move: function (p, dx, dy) {
            if (state.locked) return;
            t.moveTo(start.x + dx, start.y + dy);
            var b = binAt(p);
            binRects.forEach(function (r) { r.classList.toggle('ss-hot', r.getAttribute('data-bin') === b); });
          },
          end: function (p) {
            binRects.forEach(function (r) { r.classList.remove('ss-hot'); });
            if (state.locked) return;
            var moved = Math.hypot(t.pos.x - start.x, t.pos.y - start.y);
            if (moved < 6) {
              t.moveTo(start.x, start.y);
              select(state.sel === id ? null : id);
              return;
            }
            select(null);
            var b = binAt(p);
            placeIn(id, b || 'tray');
          },
        })
      );
    });
    binRects.forEach(function (r) {
      r.addEventListener('click', function () {
        if (state.locked || !state.sel) return;
        var id = state.sel;
        select(null);
        placeIn(id, r.getAttribute('data-bin'));
      });
    });
    var help = el('p', { class: 'ss-help' });
    var checkBtn = lessonCheck();
    var explain = el('div', { class: 'ss-explain' });
    checkBtn.addEventListener('click', function () {
      if (state.locked) return;
      var wrong = q.items.filter(function (id) { return state.place[id] !== OBJ[id].edgeType; });
      if (!wrong.length) {
        state.locked = true;
        q.items.forEach(function (id) { toks[id].classList.add('ss-good'); });
        layout();
        api.check(true, 'All sorted! Curved, straight or no edges.');
        return;
      }
      wrong.forEach(function (id) { toks[id].classList.add('ss-bad'); });
      // the most important mistake first: tins and cones, then balls, then boxes
      var rank = { cylinder: 0, cone: 1, sphere: 2, poly: 3 };
      wrong.sort(function (a, b) { return rank[OBJ[a].kind] - rank[OBJ[b].kind]; });
      var h = edgeHint(OBJ[wrong[0]], state.place[wrong[0]], api.tries() >= 1);
      var more = wrong.length > 1 ? ' (' + wrong.length + ' things are in the wrong box.)' : '';
      api.check(false, h.text + more, h.tag);
    });
    api.onReveal(function () {
      state.locked = true;
      state.order = [];
      q.items.forEach(function (id) {
        state.place[id] = OBJ[id].edgeType;
        state.order.push(id);
        toks[id].classList.remove('ss-bad');
        toks[id].classList.add('ss-good');
      });
      layout();
      MQ.clear(explain);
      q.items.forEach(function (id) {
        explain.appendChild(el('span', { class: 'chip ss-why' }, el('b', null, OBJ[id].name), ': ' + OBJ[id].edgeWorking));
      });
      api.feedback('Circles round a tin or a cone are curved edges. Boxes have straight edges. A ball has none.', 'info');
    });
    stage.appendChild(svg);
    stage.appendChild(el('div', { class: 'ss-row' }, help, checkBtn));
    stage.appendChild(explain);
    layout();
  }

  /* ---------------------------------------------------------------- *
   * Level 2: tick every label that fits
   * ---------------------------------------------------------------- */
  var L2_LABELS = ['curved', 'rect', 'more5'];
  function renderLabels(stage, api, q) {
    api.say('Tick every label that fits. Some things fit two labels!', 'think');
    stage.appendChild(MQ.ui.prompt('Tick <b>every</b> label that fits each thing.'));
    var table = el('div', { class: 'ss-table' });
    table.appendChild(el('div', { class: 'ss-th ss-th-first' }, 'Thing'));
    L2_LABELS.forEach(function (k) { table.appendChild(el('div', { class: 'ss-th' }, LABELS[k].text)); });
    var cells = {};
    var notes = {};
    var locked = false;
    q.items.forEach(function (id) {
      var o = OBJ[id];
      notes[id] = el('span', { class: 'ss-note' });
      table.appendChild(el('div', { class: 'ss-td ss-td-first' }, objSvg(id, 74, { dots: true }), el('span', { class: 'ss-name' }, o.name, notes[id])));
      cells[id] = {};
      L2_LABELS.forEach(function (k) {
        var b = el('button', { class: 'ss-tick', type: 'button', 'aria-pressed': 'false', 'data-obj': id, 'data-label': k, 'data-correct': LABELS[k].test(o) ? '1' : '0', 'aria-label': o.name + ': ' + LABELS[k].text });
        b.on = false;
        b.addEventListener('click', function () {
          if (locked) return;
          b.on = !b.on;
          b.setAttribute('aria-pressed', b.on ? 'true' : 'false');
          b.textContent = b.on ? '✓' : '';
          b.classList.remove('ss-bad');
          api.sound('click');
        });
        cells[id][k] = b;
        table.appendChild(el('div', { class: 'ss-td' }, b));
      });
    });
    var checkBtn = lessonCheck();
    function wrongCells() {
      var out = [];
      q.items.forEach(function (id) {
        L2_LABELS.forEach(function (k) {
          var should = LABELS[k].test(OBJ[id]);
          if (cells[id][k].on !== should) out.push({ id: id, k: k, should: should });
        });
      });
      return out;
    }
    function hintFor(w, strong) {
      var o = OBJ[w.id];
      var rowTicked = L2_LABELS.some(function (k) { return k !== w.k && cells[w.id][k].on && LABELS[k].test(o); });
      if (w.k === 'more5' && !w.should && o.V === 5) return { tag: 'Thought 5 corners is more than five', text: strong ? 'The ' + o.name + ' has 5 corners. 5 is not more than 5: it needs 6 or more.' : 'Count the ' + o.name + "'s corners: " + o.working + '. Is 5 more than 5?' };
      if (w.should && rowTicked) return { tag: 'Missed that a thing can fit two labels', text: 'The ' + o.name + ' fits two labels! Check "' + LABELS[w.k].text + '" again.' + (strong ? ' ' + reason(o, w.k) : '') };
      if (w.k === 'rect' && w.should) return { tag: 'Did not count squares as rectangles', text: strong ? 'A square is a special rectangle. The ' + o.name + ' has only square or rectangle faces, so tick it.' : 'Look at every face of the ' + o.name + '. Are they all rectangles (or squares)?' };
      if (w.k === 'curved') return w.should
        ? { tag: 'Missed a curved surface', text: strong ? 'The ' + o.name + ' would roll, so it has a curved surface.' : 'Would the ' + o.name + ' roll? Then it has a curved surface.' }
        : { tag: 'Called a flat-faced shape curved', text: 'The ' + o.name + ' has only flat faces. It would not roll.' };
      if (w.k === 'rect') return { tag: 'Ticked "all rectangles" for a shape with other faces', text: strong ? reason(o, 'rect') : 'Look at every face of the ' + o.name + ', even the ends. Are they all rectangles?' };
      return { tag: 'Miscounted the corners', text: strong ? 'The ' + o.name + ' has ' + cornersPhrase(o) + ': ' + o.working + '.' : 'Count the corners of the ' + o.name + ' again. Dots show the corners; the hollow ones are at the back.' };
    }
    function reason(o, k) {
      if (k === 'curved') return o.curved ? 'It has a curved surface.' : 'It has only flat faces.';
      if (k === 'rect') {
        if (o.curved) return 'The ' + o.name + ' has a curved surface, so not all its faces are rectangles.';
        if (o.allRect) return 'All the faces of the ' + o.name + ' are rectangles' + (o.faceShapes.square ? ' (squares count as rectangles).' : '.');
        var other = o.faceShapes.triangle ? 'triangle' : 'hexagon';
        return 'The ' + o.name + ' has ' + other + ' faces, so not all its faces are rectangles.';
      }
      return 'It has ' + cornersPhrase(o) + ': ' + o.working + '.';
    }
    checkBtn.addEventListener('click', function () {
      if (locked) return;
      var wr = wrongCells();
      if (!wr.length) {
        locked = true;
        q.items.forEach(function (id) { L2_LABELS.forEach(function (k) { cells[id][k].classList.add('ss-good'); }); });
        api.check(true, 'Every tick is right!');
        return;
      }
      wr.forEach(function (w) { cells[w.id][w.k].classList.add('ss-bad'); });
      var order = function (w) {
        var o = OBJ[w.id];
        if (w.k === 'more5' && !w.should && o.V === 5) return 0;
        return w.should ? 1 : 2;
      };
      wr.sort(function (a, b) { return order(a) - order(b); });
      var h = hintFor(wr[0], api.tries() >= 1);
      api.check(false, h.text + (wr.length > 1 ? ' (' + wr.length + ' boxes need changing.)' : ''), h.tag);
    });
    api.onReveal(function () {
      locked = true;
      q.items.forEach(function (id) {
        var o = OBJ[id];
        L2_LABELS.forEach(function (k) {
          var b = cells[id][k];
          b.on = LABELS[k].test(o);
          b.textContent = b.on ? '✓' : '';
          b.classList.remove('ss-bad');
          if (b.on) b.classList.add('ss-good');
        });
        notes[id].textContent = (o.curved ? 'curved surface · ' : 'flat faces · ') + cornersPhrase(o) + (o.V > 1 ? ' (' + o.working + ')' : '');
      });
      api.feedback('A square is a rectangle too. "More than 5" means 6 or more, so 5 corners does not fit.', 'info');
    });
    stage.appendChild(table);
    stage.appendChild(el('div', { class: 'ss-row' }, el('p', { class: 'ss-help' }, 'Dots show corners. Hollow dots are at the back.'), checkBtn));
  }

  /* ---------------------------------------------------------------- *
   * Level 3: Venn diagram
   * ---------------------------------------------------------------- */
  function vennHint(o, A, B, put, strong) {
    var right = regionFor(o, A, B);
    function fact(L) {
      var yes = L.test(o);
      if (L.face) return yes ? 'has ' + (L.face === 'triangle' ? 'a triangle' : 'a ' + L.face) + ' face' : 'has no ' + L.face + ' face';
      if (L.key === 'curved') return yes ? 'has a curved surface' : 'has only flat faces';
      return 'has ' + cornersPhrase(o);
    }
    var both = 'The ' + o.name + ' ' + fact(A) + ' and ' + fact(B);
    if (right === 'AB') return { tag: 'Missed a shape that fits both labels', text: strong ? both + ', so it goes in the middle where the circles overlap.' : 'The ' + o.name + ' fits both labels. Where do the circles overlap?' };
    if (right === 'out' && put !== 'out') return { tag: 'Put a shape in a circle when it fits neither label', text: strong ? both + '. It fits neither label, so it goes outside both circles (but inside the box).' : 'Does the ' + o.name + ' really fit "' + (put === 'B' ? B.text : A.text) + '"? A shape that fits neither label goes outside the circles.' };
    // which label was misjudged?
    var inA = put === 'A' || put === 'AB', inB = put === 'B' || put === 'AB';
    var L = inA !== A.test(o) ? A : B;
    var yes = L.test(o);
    if (L.face) {
      if (yes) return { tag: 'Missed a face shape (look at every face)', text: strong ? 'The ' + o.name + ' has ' + o.faceShapes[L.face] + ' ' + L.face + ' face' + (o.faceShapes[L.face] > 1 ? 's' : '') + '. Look at the bottom and the ends too.' : 'Look at every face of the ' + o.name + ', even the bottom and the back. Is one a ' + L.face + '?' };
      var extra = L.face === 'square' && o.faceShapes.rectangle ? ' Its faces are rectangles, but their sides are not all the same length.' : '';
      return { tag: 'Saw a face shape that is not there', text: 'Check the faces of the ' + o.name + ': none of them is a ' + L.face + '.' + extra };
    }
    if (L.key === 'curved') return yes ? { tag: 'Missed a curved surface', text: 'Would the ' + o.name + ' roll? Then it has a curved surface.' } : { tag: 'Called a flat-faced shape curved', text: 'The ' + o.name + ' has only flat faces, so it has no curved surface.' };
    if (L.key === 'fewer6' && !yes && o.V === 6) return { tag: 'Thought 6 is fewer than 6', text: strong ? 'The ' + o.name + ' has 6 corners: ' + o.working + '. 6 is not fewer than 6.' : 'Count the ' + o.name + "'s corners. Is that fewer than 6?" };
    return { tag: 'Miscounted the corners', text: 'Count the corners of the ' + o.name + ': ' + (strong ? o.working + '.' : 'top ones, then bottom ones.') };
  }

  function renderVenn(stage, api, q) {
    var A = LABELS[q.pair[0]], B = LABELS[q.pair[1]];
    api.say('Drag each shape into the right part. Fits both? The middle. Neither? Outside.', 'think');
    stage.appendChild(MQ.ui.prompt('Sort the shapes into the diagram.'));
    var board = vennBoard(A, B);
    var svg = board.svg;
    var state = { place: {}, locked: false, sel: null };
    var toks = {};
    function trayPos(id) {
      var i = q.items.indexOf(id);
      return [410 + (i - (q.items.length - 1) / 2) * 132, TRAY_Y];
    }
    q.items.forEach(function (id) {
      var t = makeToken(id, 64, { dots: true });
      t.setAttribute('data-answer', regionFor(OBJ[id], A, B));
      toks[id] = t;
      state.place[id] = null;
      var tp = trayPos(id);
      t.moveTo(tp[0], tp[1]);
      board.layer.appendChild(t);
    });
    function clampIn(x, y) {
      return [U.clamp(x, UNI.x + 40, UNI.x + UNI.w - 40), U.clamp(y, UNI.y + 38, UNI.y + UNI.h - 54)];
    }
    function drop(id, x, y) {
      var t = toks[id];
      var reg = regionAt({ x: x, y: y });
      t.classList.remove('ss-bad');
      if (!reg) {
        state.place[id] = null;
        t.setAttribute('data-placed', '');
        var tp = trayPos(id);
        t.moveTo(tp[0], tp[1]);
      } else {
        var c = clampIn(x, y);
        // keep the region of the drop point even after nudging inside the box
        if (regionAt({ x: c[0], y: c[1] }) !== reg) c = [x, y];
        t.moveTo(c[0], c[1]);
        state.place[id] = reg;
        t.setAttribute('data-placed', reg);
        api.sound('pop');
      }
      update();
    }
    function select(id) {
      Object.keys(toks).forEach(function (k) { toks[k].classList.toggle('ss-sel', k === id); });
      state.sel = id;
    }
    q.items.forEach(function (id) {
      var t = toks[id];
      var start = null;
      api.cleanup(
        MQ.ui.drag(svg, t, {
          start: function () { start = { x: t.pos.x, y: t.pos.y }; },
          move: function (p, dx, dy) {
            if (state.locked) return;
            t.moveTo(start.x + dx, start.y + dy);
            board.highlight(regionAt(t.pos));
          },
          end: function () {
            board.highlight(null);
            if (state.locked) return;
            if (Math.hypot(t.pos.x - start.x, t.pos.y - start.y) < 6) {
              t.moveTo(start.x, start.y);
              select(state.sel === id ? null : id);
              return;
            }
            select(null);
            drop(id, t.pos.x, t.pos.y);
          },
        })
      );
    });
    function onClick(e) {
      if (state.locked || !state.sel) return;
      if (e.target.closest && e.target.closest('.ss-tok')) return;
      var p = MQ.ui.svgPoint(svg, e);
      if (!regionAt(p)) return;
      var id = state.sel;
      select(null);
      drop(id, p.x, p.y);
    }
    svg.addEventListener('click', onClick);
    var help = el('p', { class: 'ss-help' });
    var checkBtn = lessonCheck();
    var explain = el('div', { class: 'ss-explain' });
    function update() {
      var left = q.items.filter(function (id) { return !state.place[id]; }).length;
      checkBtn.disabled = state.locked || left > 0;
      help.textContent = left ? 'Place all ' + q.items.length + ' shapes, then press Check.' : 'All placed? Press Check.';
    }
    checkBtn.addEventListener('click', function () {
      if (state.locked) return;
      var wrong = q.items.filter(function (id) { return state.place[id] !== regionFor(OBJ[id], A, B); });
      if (!wrong.length) {
        state.locked = true;
        q.items.forEach(function (id) { toks[id].classList.add('ss-good'); });
        update();
        api.check(true, 'Perfect sorting!');
        return;
      }
      wrong.forEach(function (id) { toks[id].classList.add('ss-bad'); });
      var rank = { AB: 0, out: 1, A: 2, B: 2 };
      wrong.sort(function (a, b) { return rank[regionFor(OBJ[a], A, B)] - rank[regionFor(OBJ[b], A, B)]; });
      var h = vennHint(OBJ[wrong[0]], A, B, state.place[wrong[0]], api.tries() >= 1);
      api.check(false, h.text + (wrong.length > 1 ? ' (' + wrong.length + ' shapes need moving.)' : ''), h.tag);
    });
    api.onReveal(function () {
      state.locked = true;
      var used = { A: 0, B: 0, AB: 0, out: 0 };
      q.items.forEach(function (id) {
        var r = regionFor(OBJ[id], A, B);
        var s = SLOTS[r][used[r]++ % SLOTS[r].length];
        toks[id].moveTo(s[0], s[1]);
        state.place[id] = r;
        toks[id].setAttribute('data-placed', r);
        toks[id].classList.remove('ss-bad');
        toks[id].classList.add('ss-good');
      });
      update();
      MQ.clear(explain);
      q.items.forEach(function (id) {
        var o = OBJ[id];
        explain.appendChild(el('span', { class: 'chip ss-why' }, el('b', null, o.name), ' ', el('span', { class: A.test(o) ? 'ss-yes' : 'ss-no' }, (A.test(o) ? '✓ ' : '✗ ') + A.text.replace(/^has (a )?/, '')), ' ', el('span', { class: B.test(o) ? 'ss-yes' : 'ss-no' }, (B.test(o) ? '✓ ' : '✗ ') + B.text.replace(/^has (a )?/, ''))));
      });
      api.feedback('Both labels → the middle. One label → its own circle. Neither → outside.', 'info');
    });
    stage.appendChild(svg);
    stage.appendChild(el('div', { class: 'ss-row' }, help, checkBtn));
    stage.appendChild(explain);
    update();
  }

  /* ---------------------------------------------------------------- *
   * Level 3 finale: pick a shape with fewer than 6 corners
   * ---------------------------------------------------------------- */
  function renderFewer(stage, api, q) {
    api.say('Count the corners. Which one has fewer than 6?', 'think');
    stage.appendChild(MQ.ui.prompt('Click the shape with <b>fewer than 6</b> corners.'));
    var labels = {};
    var ch = MQ.ui.choices(
      q.items.map(function (id) {
        labels[id] = el('span', { class: 'ss-count' });
        return { label: el('span', { class: 'ss-choice' }, objSvg(id, 110, { dots: true }), el('span', { class: 'ss-name' }, OBJ[id].name), labels[id]), value: id };
      }),
      function (id) {
        var o = OBJ[id];
        if (o.V < 6) {
          ch.mark(id, 'good');
          ch.disable();
          labels[id].textContent = cornersPhrase(o);
          api.check(true, 'Yes! The ' + o.name + ' is a ' + o.shape + ' with ' + o.V + ' corners. ' + o.V + ' is fewer than 6.');
          return;
        }
        ch.mark(id, 'bad');
        var strong = api.tries() >= 1;
        if (o.V === 6) api.check(false, strong ? 'The ' + o.name + ' has 6 corners: ' + o.working + '. 6 is not fewer than 6.' : 'Count the ' + o.name + "'s corners carefully. Is that fewer than 6?", 'Thought 6 is fewer than 6');
        else api.check(false, strong ? 'The ' + o.name + ' has ' + o.V + ' corners: ' + o.working + '. That is more than 6.' : 'The ' + o.name + ' has lots of corners. Count them: top ones, then bottom ones.', 'Miscounted the corners');
      },
      { columns: 4 }
    );
    ch.classList.add('ss-choices');
    ch.buttons.forEach(function (b) { b.setAttribute('data-ok', OBJ[b.value_].V < 6 ? '1' : '0'); b.setAttribute('data-obj', b.value_); });
    stage.appendChild(ch);
    stage.appendChild(el('p', { class: 'ss-help' }, 'Dots show corners. Hollow dots are at the back.'));
    api.onReveal(function () {
      ch.mark(q.right, 'good');
      ch.disable();
      q.items.forEach(function (id) { labels[id].textContent = cornersPhrase(OBJ[id]) + ': ' + OBJ[id].working; });
      var o = OBJ[q.right];
      api.feedback('The ' + o.name + ' (' + o.shape + ') has ' + o.working + ' corners. ' + o.V + ' is fewer than 6.', 'info');
    });
  }

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */
  function learnParts(stage, api) {
    api.say('A cereal box is a 3D shape. Click a face, an edge and a corner.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('What makes a 3D shape?', 'Click a <b>face</b>, an <b>edge</b> and a <b>vertex</b> (corner). Drag to turn the box.'));
    var o = OBJ.cereal;
    var m = o.model;
    var W = 560, H = 330;
    var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'ss-turn' });
    var st = { yaw: -0.55, pitch: 0.32, hover: false, down: null, sel: {}, last: null };
    var found = { face: false, edge: false, vertex: false };
    var chips = {};
    var chipRow = el('div', { class: 'ss-chips' });
    [['face', 'Face'], ['edge', 'Edge'], ['vertex', 'Vertex (corner)']].forEach(function (c) {
      chips[c[0]] = el('span', { class: 'chip ss-find' }, '○ ' + c[1]);
      chips[c[0]].label = c[1];
      chipRow.appendChild(chips[c[0]]);
    });
    var dirty = true;
    function draw() {
      MQ.clear(svg);
      var r = renderModel(m, { x: 130, y: 10, w: 300, h: 310, yaw: st.yaw, pitch: st.pitch, fit: 'radius', look: o.look, hit: true, sel: st.sel, sw: 3 });
      svg.appendChild(r.g);
      if (st.last) {
        var p = null;
        if (st.last === 'face' && r.faceVis[st.sel.face]) {
          var fpts2 = m.faces[st.sel.face].map(function (i) { return r.scr[i]; });
          p = [fpts2.reduce(function (s, q) { return s + q[0]; }, 0) / fpts2.length, fpts2.reduce(function (s, q) { return s + q[1]; }, 0) / fpts2.length];
        } else if (st.last === 'edge' && r.edgeVis[st.sel.edge]) {
          var e = m.edges[st.sel.edge];
          p = [(r.scr[e[0]][0] + r.scr[e[1]][0]) / 2, (r.scr[e[0]][1] + r.scr[e[1]][1]) / 2];
        } else if (st.last === 'vertex' && r.vertVis[st.sel.vertex]) {
          p = r.scr[st.sel.vertex];
        }
        if (p) {
          var txt = st.last === 'face' ? 'face' : st.last === 'edge' ? 'edge' : 'vertex';
          var lx = p[0] < W / 2 ? p[0] - 70 : p[0] + 70;
          lx = U.clamp(lx, 50, W - 50);
          svg.appendChild(S('line', { x1: p[0], y1: p[1], x2: lx, y2: p[1] - 30, class: 'ss-tagline' }));
          svg.appendChild(S('rect', { x: lx - 44, y: p[1] - 48, width: 88, height: 30, rx: 8, class: 'ss-tagbox' }));
          svg.appendChild(S('text', { x: lx, y: p[1] - 27, 'text-anchor': 'middle', class: 'ss-tagtext' }, txt));
        }
      }
      dirty = false;
    }
    var raf = 0;
    var lastT = 0;
    function loop(t) {
      if (!st.hover && !st.down) {
        st.yaw += lastT ? Math.min(50, t - lastT) * 0.00035 : 0;
        dirty = true;
      }
      lastT = t;
      if (dirty) draw();
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    api.cleanup(function () { cancelAnimationFrame(raf); });
    svg.addEventListener('pointerenter', function () { st.hover = true; });
    svg.addEventListener('pointerleave', function () { st.hover = false; });
    svg.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      var t = e.target;
      st.down = { x: e.clientX, y: e.clientY, yaw: st.yaw, pitch: st.pitch, kind: t.getAttribute && t.getAttribute('data-kind'), i: t.getAttribute && +t.getAttribute('data-i'), drag: false };
      try { svg.setPointerCapture(e.pointerId); } catch (err) {}
    });
    svg.addEventListener('pointermove', function (e) {
      var d = st.down;
      if (!d) return;
      var dx = e.clientX - d.x, dy = e.clientY - d.y;
      if (!d.drag && Math.hypot(dx, dy) > 6) d.drag = true;
      if (d.drag) {
        st.yaw = d.yaw + dx * 0.012;
        st.pitch = U.clamp(d.pitch + dy * 0.01, -1.2, 1.2);
        dirty = true;
      }
    });
    function up() {
      var d = st.down;
      st.down = null;
      if (!d || d.drag || !d.kind) return;
      pick(d.kind, d.i);
    }
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', function () { st.down = null; });
    var LINES = {
      face: 'That is a face: a flat surface. This box has ' + m.faces.length + ' faces.',
      edge: 'That is an edge: where two faces meet. This box has ' + m.edges.length + ' edges.',
      vertex: 'That is a vertex, or corner: where edges meet. This box has ' + m.verts.length + '.',
    };
    function pick(kind, i) {
      st.sel = {};
      st.sel[kind] = i;
      st.last = kind;
      dirty = true;
      api.sound('pop');
      found[kind] = true;
      chips[kind].textContent = '✓ ' + chips[kind].label;
      chips[kind].classList.add('ss-found');
      var left = Object.keys(found).filter(function (k) { return !found[k]; });
      if (!left.length) {
        api.say(LINES[kind] + ' You found all three parts!', 'cheer');
        api.feedback('Faces, edges and vertices: the parts of a 3D shape.', 'good');
        api.unlockNext();
      } else {
        api.say(LINES[kind], 'happy');
        api.feedback('Now find ' + left.map(function (k) { return k === 'vertex' ? 'a vertex (corner)' : 'an ' + k; }).join(' and ').replace('an face', 'a face') + '.', 'info');
      }
    }
    draw();
    stage.appendChild(svg);
    stage.appendChild(chipRow);
  }

  function learnRoll(stage, api) {
    api.say('Drag the tin and the dice along the shelves. Which one rolls?');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Flat or curved?', 'Drag each one to the right along its shelf.'));
    var W = 800, H = 330;
    var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'ss-board ss-shelves' });
    [150, 310].forEach(function (y) {
      svg.appendChild(S('rect', { x: 20, y: y, width: 760, height: 12, rx: 3, class: 'ss-shelf' }));
    });
    svg.appendChild(S('text', { x: 24, y: 24, class: 'ss-shelf-label' }, 'tin'));
    svg.appendChild(S('text', { x: 24, y: 184, class: 'ss-shelf-label' }, 'dice'));
    var tinSay = S('text', { x: 780, y: 30, 'text-anchor': 'end', class: 'ss-say' });
    var diceSay = S('text', { x: 780, y: 190, 'text-anchor': 'end', class: 'ss-say' });
    svg.appendChild(tinSay);
    svg.appendChild(diceSay);
    // tin lying on its side: the round end faces us
    var R = 50;
    var tin = S('g', { class: 'ss-roller', 'data-name': 'tin' });
    var off = [24, -15];
    var ol = Math.hypot(off[0], off[1]);
    var pp = [(-off[1] / ol) * R, (off[0] / ol) * R];
    tin.appendChild(S('circle', { cx: off[0], cy: off[1], r: R, fill: '#d9dde4', stroke: INK, 'stroke-width': 3 }));
    tin.appendChild(S('polygon', { points: [pp[0], pp[1], -pp[0], -pp[1], off[0] - pp[0], off[1] - pp[1], off[0] + pp[0], off[1] + pp[1]].join(' '), fill: '#e63946', stroke: INK, 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    tin.appendChild(S('circle', { cx: 0, cy: 0, r: R, fill: '#d9dde4', stroke: INK, 'stroke-width': 3 }));
    var spin = S('g');
    spin.appendChild(S('circle', { cx: 0, cy: 0, r: R * 0.78, fill: 'none', stroke: '#9aa5b8', 'stroke-width': 2.5 }));
    spin.appendChild(S('line', { x1: 0, y1: 0, x2: 0, y2: -R * 0.62, stroke: '#7b8599', 'stroke-width': 3 }));
    spin.appendChild(S('rect', { x: -9, y: -R * 0.7, width: 18, height: 12, rx: 5, fill: '#aab3c5', stroke: INK, 'stroke-width': 2 }));
    tin.appendChild(spin);
    svg.appendChild(tin);
    var dice = S('g', { class: 'ss-roller', 'data-name': 'dice' });
    dice.appendChild(renderModel(OBJ.dice.model, { x: -60, y: -112, w: 120, h: 112, yaw: -0.35, pitch: 0.28, look: OBJ.dice.look, sw: 3 }).g);
    svg.appendChild(dice);
    var tinX = 90, diceX = 90, tinStart = 90, diceStart = 90;
    var done = { tin: false, dice: false };
    function placeTin() {
      tin.setAttribute('transform', 'translate(' + tinX + ',' + (150 - R) + ')');
      spin.setAttribute('transform', 'rotate(' + (((tinX - tinStart) / R) * 180) / Math.PI + ')');
    }
    function placeDice() { dice.setAttribute('transform', 'translate(' + diceX + ',310)'); }
    placeTin();
    placeDice();
    var raf = 0;
    api.cleanup(function () { cancelAnimationFrame(raf); });
    function finish() {
      if (done.tin && done.dice) {
        api.say('The tin rolls: it has a curved surface. The dice has only flat faces, so it slides.', 'cheer');
        api.unlockNext();
        facts.hidden = false;
      }
    }
    var t0x = 0, d0x = 0;
    api.cleanup(
      MQ.ui.drag(svg, tin, {
        start: function () { cancelAnimationFrame(raf); t0x = tinX; },
        move: function (p, dx) { tinX = U.clamp(t0x + dx, 90, 720); placeTin(); },
        end: function () {
          if (tinX - tinStart < 60) return;
          // keep rolling a little: round things roll on their own
          var from = tinX, to = Math.min(720, tinX + 150), t0 = null;
          function step(t) {
            if (t0 == null) t0 = t;
            var k = Math.min(1, (t - t0) / 700);
            tinX = from + (to - from) * (1 - Math.pow(1 - k, 2));
            placeTin();
            if (k < 1) raf = requestAnimationFrame(step);
          }
          raf = requestAnimationFrame(step);
          tinSay.textContent = 'It rolls! Curved surface.';
          if (!done.tin) { done.tin = true; api.sound('pop'); api.feedback('The tin rolled! Now push the dice.', 'info'); }
          finish();
        },
      })
    );
    api.cleanup(
      MQ.ui.drag(svg, dice, {
        start: function () { d0x = diceX; },
        move: function (p, dx) { diceX = U.clamp(d0x + dx, 90, 720); placeDice(); },
        end: function () {
          if (diceX - diceStart < 60) return;
          diceSay.textContent = 'No rolling. It just slides.';
          if (!done.dice) { done.dice = true; api.sound('pop'); api.feedback('The dice only slides. Now try the tin.', 'info'); }
          finish();
        },
      })
    );
    var facts = el('div', { class: 'ss-facts', hidden: true },
      el('div', { class: 'ss-fact' }, objSvg('tin', 60), el('div', null, el('b', null, 'Tin'), el('br'), '1 curved surface + 2 flat circle faces', el('br'), 'Edges: 2, both curved')),
      el('div', { class: 'ss-fact' }, objSvg('dice', 60), el('div', null, el('b', null, 'Dice'), el('br'), OBJ.dice.F + ' flat faces, no curved surface', el('br'), 'Edges: ' + OBJ.dice.E + ', all straight'))
    );
    stage.appendChild(svg);
    stage.appendChild(facts);
  }

  function learnVenn(stage, api) {
    api.lockNext();
    var A = LABELS.curved, B = LABELS.more5;
    stage.appendChild(MQ.ui.lesson('Two rules at once', 'Click the part of the diagram where each thing belongs.'));
    var board = vennBoard(A, B, { outsideHint: true });
    var svg = board.svg;
    var items = ['ball', 'cereal', 'tin', 'partyhat', 'paperweight'];
    var n = 0;
    var used = { A: 0, B: 0, AB: 0, out: 0 };
    var cur = null;
    var emptyNote = S('text', { x: 410, y: 212, 'text-anchor': 'middle', class: 'ss-empty', opacity: 0 }, 'empty!');
    svg.appendChild(emptyNote);
    var WHY = {
      A: 'it has a curved surface, but not more than 5 corners',
      B: 'it has more than 5 corners, but no curved surface',
      out: 'it fits neither label',
      AB: 'it fits both labels',
    };
    function next() {
      if (n >= items.length) {
        emptyNote.setAttribute('opacity', 1);
        svg.querySelector('.ss-circ-a').classList.add('ss-pulse');
        api.say('Nothing fits both labels, so the middle stays empty. That is OK!', 'cheer');
        api.feedback('Middle = both labels. Outside = neither label. The middle can be empty.', 'good');
        api.unlockNext();
        return;
      }
      var id = items[n];
      cur = makeToken(id, 64, { dots: true });
      cur.setAttribute('data-answer', regionFor(OBJ[id], A, B));
      cur.moveTo(410, TRAY_Y);
      cur.classList.add('ss-current');
      board.layer.appendChild(cur);
      api.say('Where does the ' + OBJ[id].name + ' go? It has ' + cornersPhrase(OBJ[id]) + '.', 'think');
    }
    function onClick(e) {
      if (n >= items.length || !cur) return;
      var p = MQ.ui.svgPoint(svg, e);
      var reg = regionAt(p);
      if (!reg) return;
      var o = OBJ[items[n]];
      var right = regionFor(o, A, B);
      if (reg !== right) {
        api.sound('wrong');
        var msg = right === 'out'
          ? 'Not there. The ' + o.name + ' has ' + cornersPhrase(o) + (o.V === 5 ? ' (5 is not more than 5)' : '') + ' and no curved surface. Try outside the circles.'
          : 'Not quite. The ' + o.name + ' ' + (o.curved ? 'has a curved surface' : 'has no curved surface') + ' and ' + cornersPhrase(o) + '. Try again.';
        api.say(msg, 'oops');
        return;
      }
      api.sound('correct');
      var s = SLOTS[reg][used[reg]++];
      cur.moveTo(s[0], s[1]);
      cur.classList.remove('ss-current');
      cur.setAttribute('data-placed', reg);
      api.feedback('Yes! The ' + o.name + ' goes there: ' + WHY[reg] + '.', 'good');
      n++;
      cur = null;
      api.later(next, 900);
    }
    svg.addEventListener('click', onClick);
    stage.appendChild(svg);
    next();
  }

  /* ---------------------------------------------------------------- *
   * Register
   * ---------------------------------------------------------------- */
  MQ.register(ID, {
    learn: [learnParts, learnRoll, learnVenn],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'edges') renderEdges(stage, api, q);
        else if (q.type === 'labels') renderLabels(stage, api, q);
        else if (q.type === 'venn') renderVenn(stage, api, q);
        else renderFewer(stage, api, q);
      },
    },
    // read-only hooks for automated tests
    test: {
      buildDeck: buildDeck,
      deck: function () { return deck; },
      objects: OBJ,
      labels: LABELS,
      regionFor: regionFor,
      regionAt: regionAt,
    },
  });

  var css = [
    '.ss-board{width:100%;max-width:820px;height:auto;display:block;touch-action:none;user-select:none}',
    '.ss-turn{width:100%;max-width:560px;height:auto;display:block;touch-action:none;user-select:none;cursor:grab;background:#fbfcff;border:2px solid var(--line);border-radius:16px}',
    '.ss-hit-face,.ss-hit-edge,.ss-hit-vertex{cursor:pointer}',
    '.ss-hit-face:hover{filter:brightness(1.06)}',
    '.ss-vpop{animation:ss-pop .3s ease}',
    '@keyframes ss-pop{0%{r:2}70%{r:12}100%{r:9}}',
    '.ss-tagline{stroke:#ff7b00;stroke-width:2.5}',
    '.ss-tagbox{fill:#fff3cd;stroke:#ff9f1c;stroke-width:2.5}',
    '.ss-tagtext{font-weight:800;font-size:20px;fill:var(--ink)}',
    '.ss-chips{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.ss-find{font-size:1.1rem;font-weight:800}',
    '.ss-found{background:var(--good-bg);border-color:var(--good);color:var(--good)}',
    '.ss-tray{fill:#f3f6fd;stroke:var(--line);stroke-width:2;stroke-dasharray:8 6}',
    '.ss-bin{fill:#fffdf6;stroke:#e3c98d;stroke-width:3;cursor:pointer}',
    '.ss-bin.ss-hot{fill:#fff1cc;stroke:var(--accent)}',
    '.ss-bin-icon{fill:none;stroke:var(--ink);stroke-width:4;stroke-linecap:round}',
    '.ss-bin-title{font-weight:800;font-size:22px;fill:var(--ink)}',
    '.ss-tok{cursor:grab;transition:transform .25s ease}',
    '.ss-tok.dragging{transition:none;cursor:grabbing}',
    '.ss-tok-bg{fill:#fff;stroke:var(--line);stroke-width:2}',
    '.ss-tok:hover .ss-tok-bg{stroke:var(--accent)}',
    '.ss-tok.ss-sel .ss-tok-bg{stroke:var(--accent);stroke-width:4;fill:#fff8e6}',
    '.ss-tok.ss-bad .ss-tok-bg{stroke:var(--try);stroke-width:4;fill:var(--try-bg)}',
    '.ss-tok.ss-good .ss-tok-bg{stroke:var(--good);stroke-width:3;fill:var(--good-bg)}',
    '.ss-tok.ss-current .ss-tok-bg{stroke:var(--gold);stroke-width:4;fill:#fffbea}',
    '.ss-tok-name{font-size:14px;font-weight:800;fill:var(--ink);pointer-events:none}',
    '.ss-uni{fill:#fbfcff;stroke:#9fb0d6;stroke-width:2.5}',
    '.ss-uni.ss-hot{fill:#f1f5ff}',
    '.ss-circ{stroke-width:4}',
    '.ss-circ-a{fill:rgba(58,134,255,.08);stroke:#3a86ff}',
    '.ss-circ-b{fill:rgba(255,0,110,.07);stroke:#e5007a}',
    '.ss-circ-a.ss-hot{fill:rgba(58,134,255,.2)}',
    '.ss-circ-b.ss-hot{fill:rgba(255,0,110,.17)}',
    '.ss-vlabel{font-weight:800;font-size:20px}',
    '.ss-vlabel-a{fill:#1f5fd1}',
    '.ss-vlabel-b{fill:#c0006a}',
    '.ss-vsmall{font-size:15px;font-weight:700;fill:var(--ink-soft)}',
    '.ss-empty{font-size:20px;font-weight:800;fill:var(--good);transition:opacity .4s}',
    '.ss-pulse{animation:ss-pulse 1s ease 2}',
    '@keyframes ss-pulse{50%{stroke-width:7}}',
    '.ss-row{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap}',
    '.ss-help{margin:0;color:var(--ink-soft);font-weight:700}',
    '.ss-check:disabled{opacity:.45}',
    '.ss-explain{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:820px}',
    '.ss-explain:empty{display:none}',
    '.ss-why{font-size:.95rem}',
    '.ss-yes{color:var(--good);font-weight:800}',
    '.ss-no{color:var(--ink-soft)}',
    '.ss-table{display:grid;grid-template-columns:minmax(150px,1.3fr) repeat(3,minmax(84px,1fr));gap:6px 8px;width:100%;max-width:760px;align-items:center}',
    '.ss-th{font-weight:800;text-align:center;font-size:1rem;line-height:1.2;padding:6px;border-radius:10px;background:var(--info-bg)}',
    '.ss-th-first{background:none}',
    '.ss-td{display:flex;justify-content:center;align-items:center}',
    '.ss-td-first{justify-content:flex-start;gap:8px;border-top:2px solid var(--paper-2);padding-top:4px}',
    '.ss-name{font-weight:800;font-size:1.1rem;display:flex;flex-direction:column}',
    '.ss-note{font-size:.8rem;font-weight:700;color:var(--good);max-width:170px}',
    '.ss-tick{width:58px;height:52px;border-radius:12px;border:3px solid var(--line);background:#fff;font-size:1.8rem;font-weight:900;color:var(--good);cursor:pointer;font-family:inherit}',
    '.ss-tick:hover:not(:disabled){border-color:var(--accent)}',
    '.ss-tick[aria-pressed="true"]{background:#f0fbf6;border-color:#7fc8a9}',
    '.ss-tick.ss-bad{border-color:var(--try);background:var(--try-bg)}',
    '.ss-tick.ss-good{border-color:var(--good);background:var(--good-bg)}',
    '.ss-choices{max-width:760px}',
    '.ss-choice{display:flex;flex-direction:column;align-items:center;gap:2px}',
    '.ss-choice svg{max-width:100%;height:auto}',
    '.ss-count{font-size:.85rem;color:var(--good);min-height:1em}',
    '.ss-shelf{fill:#c8a27a;stroke:#8d6a46;stroke-width:2}',
    '.ss-shelf-label{font-weight:800;font-size:20px;fill:var(--ink-soft)}',
    '.ss-say{font-weight:800;font-size:22px;fill:var(--good)}',
    '.ss-roller{cursor:grab}',
    '.ss-facts{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}',
    '.ss-facts[hidden]{display:none}',
    '.ss-fact{display:flex;align-items:center;gap:10px;background:#fff;border:2px solid var(--line);border-radius:14px;padding:8px 14px;font-size:1rem}',
    '@media (max-width:700px){.ss-table{grid-template-columns:minmax(110px,1fr) repeat(3,minmax(64px,1fr))}.ss-th{font-size:.85rem}.ss-tick{width:50px}.ss-td-first .ss-pic{width:56px;height:56px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

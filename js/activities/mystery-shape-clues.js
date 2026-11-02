/* Mystery Shape — Bolt hides a 3D shape and gives clues one at a time; the child crosses out shapes that do not
 * fit, then picks the mystery shape. Level 3 is the dice-key game against Bolt (Unit 4.1 end-of-unit review).
 * Every clue is worked out from a property table that is computed from the same 3D models that are drawn.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;
  var ID = 'mystery-shape-clues';
  var D = Math.PI / 180;

  /* ---------------------------------------------------------------- *
   * Tiny 3D helper (same look as prism-or-pyramid): vertex + face lists,
   * rotate, project, shade; hidden edges dashed.
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
  function sub(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }
  function dist(a, b) {
    var d = sub(a, b);
    return Math.sqrt(dot(d, d));
  }
  var I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  var POSES = { stand: I3, lying: rz(90 * D) };
  var LIGHT = (function () {
    var v = [-0.35, 0.75, 0.55];
    var l = Math.sqrt(dot(v, v));
    return [v[0] / l, v[1] / l, v[2] / l];
  })();

  function regPoly(n, r) {
    var a0 = Math.PI / 2 + Math.PI / n;
    var out = [];
    for (var i = 0; i < n; i++) out.push([r * Math.cos(a0 + (2 * Math.PI * i) / n), r * Math.sin(a0 + (2 * Math.PI * i) / n)]);
    return out;
  }
  function rectPoly(w, d) {
    return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];
  }

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
      if (dot(n, sub(c, inside)) < 0) n = [-n[0], -n[1], -n[2]];
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

  function prism(poly, h, smooth) {
    var n = poly.length, verts = [], faces = [];
    poly.forEach(function (p) {
      verts.push([p[0], -h / 2, p[1]]);
    });
    poly.forEach(function (p) {
      verts.push([p[0], h / 2, p[1]]);
    });
    faces.push({ v: U.range(0, n - 1) });
    faces.push({ v: U.range(n, 2 * n - 1) });
    for (var i = 0; i < n; i++) {
      var j = (i + 1) % n;
      faces.push({ v: [i, j, n + j, n + i], smooth: !!smooth });
    }
    return finish({ verts: verts, faces: faces }, [0, 0, 0]);
  }

  function pyramid(poly, h, smooth) {
    var yb = -h / 2;
    var n = poly.length, verts = [], faces = [];
    poly.forEach(function (p) {
      verts.push([p[0], yb, p[1]]);
    });
    verts.push([0, yb + h, 0]);
    faces.push({ v: U.range(0, n - 1) });
    for (var i = 0; i < n; i++) faces.push({ v: [i, (i + 1) % n, n], smooth: !!smooth });
    return finish({ verts: verts, faces: faces }, [0, yb + h / 4, 0]);
  }

  /* ---------------------------------------------------------------- *
   * The shapes. Only the geometry is given here; every property used in a
   * clue is computed from these models below.
   * ---------------------------------------------------------------- */
  var TET_R = 0.9; // regular triangle-based pyramid: all 4 faces are the same triangle
  var TET_H = TET_R * Math.sqrt(3) * Math.sqrt(2 / 3);
  var KINDS = {
    cube: { name: 'cube', obj: 'dice', fill: '#fff4cc', poly: rectPoly(1.4, 1.4), h: 1.4 },
    cuboid: { name: 'cuboid', obj: 'cereal box', fill: '#ffd9ab', poly: rectPoly(1.3, 0.55), h: 1.9 },
    triPrism: { name: 'triangular prism', obj: 'chocolate box', fill: '#f7ddb5', poly: regPoly(3, 0.62), h: 2.2, pose: 'lying', yaw: -52, pitch: 20 },
    pentPrism: { name: 'pentagonal prism', obj: 'gift box', fill: '#d6efc9', poly: regPoly(5, 0.8), h: 1.2 },
    hexPrism: { name: 'hexagonal prism', obj: 'pencil tin', fill: '#cfe5ff', poly: regPoly(6, 0.75), h: 1.5 },
    octPrism: { name: 'octagonal prism', obj: 'cheese box', fill: '#e5d6ff', poly: regPoly(8, 0.85), h: 0.95 },
    triPyramid: { name: 'triangle-based pyramid', obj: 'paper pyramid', fill: '#fde6a8', poly: regPoly(3, TET_R), h: TET_H, pyr: true, yaw: 40, pitch: 24 },
    sqPyramid: { name: 'square-based pyramid', obj: 'paperweight', fill: '#d3ebff', poly: rectPoly(1.5, 1.5), h: 1.4, pyr: true },
    pentPyramid: { name: 'pentagonal pyramid', obj: 'tent', fill: '#d8f3dc', poly: regPoly(5, 0.95), h: 1.4, pyr: true },
    hexPyramid: { name: 'hexagonal pyramid', obj: 'roof', fill: '#ffdcc2', poly: regPoly(6, 0.95), h: 1.4, pyr: true },
    cylinder: { name: 'cylinder', obj: 'tin', fill: '#dde3ec', poly: regPoly(40, 0.7), h: 1.5, smooth: true },
    cone: { name: 'cone', obj: 'party hat', fill: '#ffc9d6', poly: regPoly(40, 0.75), h: 1.7, smooth: true, pyr: true },
    sphere: { name: 'sphere', obj: 'ball', fill: '#ffd59e', sphere: true },
  };
  var ALL = Object.keys(KINDS);
  var BASIC = ['cube', 'cuboid', 'triPrism', 'hexPrism', 'triPyramid', 'sqPyramid', 'cylinder', 'cone', 'sphere'];

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

  /* ---------------- property table, computed from the models ---------------- */
  var POLY_NAME = { 3: 'triangle', 5: 'pentagon', 6: 'hexagon', 8: 'octagon' };
  function facePts(m, f) {
    return f.v.map(function (i) {
      return m.verts[i];
    });
  }
  function faceShape(m, f) {
    var p = facePts(m, f), n = p.length;
    if (n >= 12) return 'circle';
    if (n === 4) {
      var right = true, sides = [];
      for (var i = 0; i < 4; i++) {
        var a = p[i], b = p[(i + 1) % 4], c = p[(i + 3) % 4];
        if (Math.abs(dot(sub(b, a), sub(c, a))) > 1e-6) right = false;
        sides.push(dist(a, b));
      }
      if (!right) return 'quadrilateral';
      return Math.abs(sides[0] - sides[1]) < 1e-6 ? 'square' : 'rectangle';
    }
    return POLY_NAME[n] || n + '-gon';
  }
  function faceSig(m, f) {
    var p = facePts(m, f);
    return p
      .map(function (a, i) {
        return dist(a, p[(i + 1) % p.length]).toFixed(4);
      })
      .sort()
      .join('|');
  }

  function buildRow(kind) {
    var K = KINDS[kind], m = model(kind);
    if (m.sphere) {
      return { kind: kind, curved: true, flat: 0, shapes: {}, shapeList: [], faces: null, edges: 0, vertices: 0, cat: 'neither', allSame: null, allSquares: null, n: 0 };
    }
    var flat = m.faces.filter(function (f) {
      return !f.smooth;
    });
    var curved = flat.length < m.faces.length;
    var shapes = {}, shapeList = [];
    flat.forEach(function (f) {
      var s = faceShape(m, f);
      if (!shapes[s]) shapeList.push(s);
      shapes[s] = (shapes[s] || 0) + 1;
    });
    // edges: lines where two flat faces meet, plus one curved edge round each flat face that meets a curved surface
    var e = 0, rim = {};
    m.edges.forEach(function (ed) {
      var a = m.faces[ed.f[0]], b = m.faces[ed.f[1]];
      if (!a.smooth && !b.smooth) e++;
      else if (!a.smooth !== !b.smooth) rim[a.smooth ? ed.f[1] : ed.f[0]] = true;
    });
    // vertices: corners where 3 or more flat faces meet, or a point where only the curved surface meets (cone apex)
    var v = 0;
    m.verts.forEach(function (p, vi) {
      var inc = m.faces.filter(function (f) {
        return f.v.indexOf(vi) >= 0;
      });
      var nFlat = inc.filter(function (f) {
        return !f.smooth;
      }).length;
      if (nFlat >= 3 || nFlat === 0) v++;
    });
    var cat = 'neither';
    if (!curved) {
      // pyramid: one vertex is on every face but one (the base), and those faces are triangles
      m.verts.forEach(function (p, vi) {
        var on = flat.filter(function (f) {
          return f.v.indexOf(vi) >= 0;
        });
        if (on.length === flat.length - 1 && on.every(function (f) { return f.v.length === 3; })) cat = 'pyramid';
      });
      // prism: two matching ends, every other face a rectangle, and n + 2 faces
      if (cat === 'neither') {
        for (var i = 0; i < flat.length && cat === 'neither'; i++) {
          for (var j = i + 1; j < flat.length; j++) {
            var n = flat[i].v.length;
            if (flat[j].v.length !== n || faceSig(m, flat[i]) !== faceSig(m, flat[j]) || flat.length !== n + 2) continue;
            var others = flat.filter(function (f, k) {
              return k !== i && k !== j;
            });
            if (others.every(function (f) { var s = faceShape(m, f); return s === 'rectangle' || s === 'square'; })) {
              cat = 'prism';
              break;
            }
          }
        }
      }
    }
    var sigs = flat.map(function (f) {
      return faceSig(m, f);
    });
    return {
      kind: kind,
      curved: curved,
      flat: flat.length,
      shapes: shapes,
      shapeList: shapeList,
      faces: curved ? null : flat.length, // a curved shape's face total depends on a convention: never asked
      edges: e + Object.keys(rim).length,
      vertices: v,
      cat: cat,
      allSame: curved ? null : sigs.every(function (s) { return s === sigs[0]; }),
      allSquares: curved ? false : shapeList.length === 1 && shapeList[0] === 'square',
      n: K.poly && !K.smooth ? K.poly.length : 0,
    };
  }

  var TABLE = {};
  ALL.forEach(function (k) {
    TABLE[k] = buildRow(k);
  });

  // Self-check against the textbook facts (prism n: n+2, 3n, 2n; pyramid n: n+1, 2n, n+1; curved shapes).
  (function () {
    var bad = [];
    ALL.forEach(function (k) {
      var r = TABLE[k], n = r.n;
      if (r.cat === 'prism' && !(r.faces === n + 2 && r.edges === 3 * n && r.vertices === 2 * n)) bad.push(k);
      if (r.cat === 'pyramid' && !(r.faces === n + 1 && r.edges === 2 * n && r.vertices === n + 1)) bad.push(k);
      if (r.cat !== 'neither' && r.faces - r.edges + r.vertices !== 2) bad.push(k);
    });
    var want = { cylinder: [2, 0, 2], cone: [1, 1, 1], sphere: [0, 0, 0] }; // edges, vertices, flat faces
    Object.keys(want).forEach(function (k) {
      var r = TABLE[k];
      if (r.edges !== want[k][0] || r.vertices !== want[k][1] || r.flat !== want[k][2] || r.cat !== 'neither' || !r.curved) bad.push(k);
    });
    if (TABLE.cuboid.shapes.square || TABLE.cube.cat !== 'prism' || TABLE.cuboid.cat !== 'prism' || !TABLE.triPyramid.allSame || !TABLE.cube.allSquares) bad.push('special');
    if (bad.length) console.error(ID + ': property table does not match the shape facts: ' + bad.join(', '));
  })();

  /* ---------------- clues ---------------- */
  // A clue is { key, arg, want }. value() is true/false/number/word, or null when the property is not clear-cut
  // for that shape (then the clue is never used on a board that shows it).
  var AMBIG = { cylinder: { edges: 1 }, cone: { edges: 1, vertices: 1 } };
  function value(kind, key, arg) {
    var r = TABLE[kind];
    if (AMBIG[kind] && AMBIG[kind][key]) return null;
    switch (key) {
      case 'curved': return r.curved;
      case 'cat': return r.cat;
      case 'shape': return !!r.shapes[arg];
      case 'noFlat': return r.flat === 0;
      case 'faces': return r.faces;
      case 'edges': return r.edges;
      case 'vertices': return r.vertices;
      case 'allSame': return r.allSame;
      case 'allSquares': return kind === 'sphere' ? null : r.allSquares;
    }
    return null;
  }
  function fits(kind, c) {
    return value(kind, c.key, c.arg) === c.want;
  }
  function fitsAll(kind, clues, upto) {
    for (var i = 0; i <= (upto == null ? clues.length - 1 : upto); i++) if (!fits(kind, clues[i])) return false;
    return true;
  }
  var RANK = { curved: 0, cat: 1, shape: 2, noFlat: 2, allSame: 2, allSquares: 2, faces: 3, edges: 3, vertices: 3 };
  var COUNT_KEYS = { faces: 1, edges: 1, vertices: 1 };
  var COUNT_RANGE = { faces: [4, 8], edges: [0, 12], vertices: [0, 8] }; // the book's ranges for clue numbers
  var A_AN = { triangle: 'a triangle', square: 'a square', rectangle: 'a rectangle', circle: 'a circle', pentagon: 'a pentagon', hexagon: 'a hexagon', octagon: 'an octagon' };

  function clueText(c) {
    switch (c.key) {
      case 'curved': return c.want ? 'I have a curved surface.' : 'I have no curved surfaces.';
      case 'cat': return c.want === 'prism' ? 'I am a prism.' : c.want === 'pyramid' ? 'I am a pyramid.' : 'I am not a prism or a pyramid.';
      case 'shape': return c.arg === 'rectangle' ? 'I have a rectangle face (not a square).' : 'I have ' + A_AN[c.arg] + ' face.';
      case 'noFlat': return 'I have no flat faces at all.';
      case 'faces': return 'I have ' + c.want + ' faces.';
      case 'edges': return 'I have ' + c.want + ' edges.';
      case 'vertices': return c.want === 0 ? 'I have no corners.' : 'I have ' + c.want + ' corners (vertices).';
      case 'allSame': return 'All my faces are the same.';
      case 'allSquares': return 'All my faces are squares.';
    }
    return '';
  }

  /** Candidate true clues about `kind` for a level. */
  function candidates(kind, level) {
    var r = TABLE[kind], out = [];
    out.push({ key: 'curved', want: r.curved });
    r.shapeList.forEach(function (s) {
      out.push({ key: 'shape', arg: s, want: true });
    });
    if (r.flat === 0) out.push({ key: 'noFlat', want: true });
    if (r.allSquares) out.push({ key: 'allSquares', want: true });
    if (level >= 2) {
      out.push({ key: 'cat', want: r.cat });
      if (r.allSame) out.push({ key: 'allSame', want: true });
      ['faces', 'edges', 'vertices'].forEach(function (k) {
        var v = value(kind, k);
        if (v != null && v >= COUNT_RANGE[k][0] && v <= COUNT_RANGE[k][1]) out.push({ key: k, want: v });
      });
    }
    return out.filter(function (c) {
      return fits(kind, c);
    });
  }

  /** Every ordered clue list (general clues first) where each clue crosses out something and only `answer` is left at the end. */
  function clueSequences(board, answer, level, len) {
    var cands = candidates(answer, level).filter(function (c) {
      return board.every(function (k) {
        return value(k, c.key, c.arg) !== null;
      });
    });
    var out = [];
    function rec(seq, left) {
      if (seq.length === len) {
        if (left.length === 1 && left[0] === answer) out.push(seq.slice());
        return;
      }
      cands.forEach(function (c) {
        if (seq.indexOf(c) >= 0) return;
        if (seq.length && RANK[c.key] < RANK[seq[seq.length - 1].key]) return;
        var next = left.filter(function (k) {
          return fits(k, c);
        });
        if (next.length === left.length) return; // a clue must cross something out
        if (seq.length < len - 1 && next.length === 1) return; // and the last clue must be needed
        rec(seq.concat([c]), next);
      });
    }
    rec([], board.slice());
    return out;
  }

  function makeRiddle(answer, level) {
    var pool = level === 1 ? BASIC : ALL;
    var len = level === 1 ? 2 : 3;
    for (var t = 0; t < 120; t++) {
      var size = level === 1 ? U.rand(4, 6) : 8;
      var others = U.shuffle(pool.filter(function (k) { return k !== answer; })).slice(0, size - 1);
      var board = U.shuffle(others.concat([answer]));
      var seqs = clueSequences(board, answer, level, len);
      if (level >= 2) {
        seqs = seqs.filter(function (s) {
          return s.some(function (c) { return COUNT_KEYS[c.key]; });
        });
        var withCat = seqs.filter(function (s) {
          return s.some(function (c) { return c.key === 'cat'; });
        });
        if (withCat.length && Math.random() < 0.7) seqs = withCat;
      }
      if (!seqs.length) continue;
      var clues = U.pick(seqs);
      var q = { type: 'riddle', level: level, board: board, clues: clues, answer: answer };
      if (riddleOk(q)) return q;
    }
    return null;
  }

  /** Build-time check: exactly one shape on the board fits all the clues, and every clue crosses something out. */
  function riddleOk(q) {
    var left = q.board.filter(function (k) {
      return fitsAll(k, q.clues);
    });
    if (left.length !== 1 || left[0] !== q.answer) return false;
    var prev = q.board.length;
    for (var i = 0; i < q.clues.length; i++) {
      var n = q.board.filter(function (k) {
        return fitsAll(k, q.clues, i);
      }).length;
      if (n >= prev) return false;
      if (i < q.clues.length - 1 && n < 2) return false;
      prev = n;
      if (q.board.some(function (k) { return value(k, q.clues[i].key, q.clues[i].arg) === null; })) return false;
    }
    return true;
  }

  /* ---------------- words and working ---------------- */
  function the(kind) {
    return 'the ' + KINDS[kind].name;
  }
  function The(kind) {
    var s = the(kind);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function list(words) {
    if (words.length <= 1) return words.join('');
    return words.slice(0, -1).join(', ') + ' and ' + words[words.length - 1];
  }
  function faceWords(kind) {
    var r = TABLE[kind];
    return list(
      r.shapeList.map(function (s) {
        return r.shapes[s] + ' ' + s + (r.shapes[s] > 1 ? 's' : '');
      })
    );
  }
  function flatPhrase(kind) {
    var r = TABLE[kind];
    if (r.flat === 0) return 'it has no flat faces at all';
    if (r.flat === 1) return 'its only flat face is ' + A_AN[r.shapeList[0]];
    return 'its flat faces are ' + faceWords(kind);
  }
  function facesWorking(kind) {
    var r = TABLE[kind];
    if (r.cat === 'prism') return '2 ends + ' + r.n + ' sides = ' + r.faces + ' faces';
    if (r.cat === 'pyramid') return '1 base + ' + r.n + ' triangles = ' + r.faces + ' faces';
    return '';
  }
  function edgesWorking(kind) {
    var r = TABLE[kind], n = r.n;
    if (r.cat === 'prism') return n + ' + ' + n + ' + ' + n + ' = ' + r.edges + ' edges';
    if (r.cat === 'pyramid') return n + ' + ' + n + ' = ' + r.edges + ' edges';
    if (kind === 'sphere') return 'no edges';
    return r.edges + ' curved edge' + (r.edges === 1 ? '' : 's');
  }
  function vertsWorking(kind) {
    var r = TABLE[kind], n = r.n;
    if (r.cat === 'prism') return n + ' + ' + n + ' = ' + r.vertices + ' corners';
    if (r.cat === 'pyramid') return n + ' + 1 = ' + r.vertices + ' corners';
    if (kind === 'cone') return '1 point at the top';
    return 'no corners';
  }
  var CAT_WHY = {
    prism: 'it is a prism: two matching ends and flat faces',
    pyramid: 'it is a pyramid: a base, with triangles meeting at a point',
  };

  /** Why `kind` does (or does not) fit clue c, with the working. */
  function reason(kind, c) {
    var r = TABLE[kind];
    switch (c.key) {
      case 'curved':
        return r.curved ? 'it has a curved surface, so it would roll' : 'all its faces are flat';
      case 'cat':
        if (r.cat !== 'neither') return CAT_WHY[r.cat];
        return r.curved ? 'it has a curved surface, so it is not a prism or a pyramid' : 'it is not a prism or a pyramid';
      case 'shape':
      case 'allSquares':
      case 'noFlat':
        if (r.flat === 0) return 'it has no flat faces at all';
        if (c.key === 'allSquares' && r.curved) return 'it has a curved surface and ' + faceWords(kind);
        return flatPhrase(kind);
      case 'allSame':
        if (r.allSame) return 'its faces are ' + r.flat + ' matching ' + r.shapeList[0] + 's';
        if (r.shapeList.length > 1) return 'it has ' + faceWords(kind);
        return 'its ' + r.shapeList[0] + 's are not all the same size';
      case 'faces':
        return 'it has ' + facesWorking(kind);
      case 'edges':
        return 'it has ' + edgesWorking(kind);
      case 'vertices':
        return 'it has ' + vertsWorking(kind);
    }
    return '';
  }

  function factLine(kind) {
    var r = TABLE[kind];
    if (kind === 'sphere') return '1 curved surface · no edges · no corners';
    if (kind === 'cylinder') return '2 flat circle faces + 1 curved surface · 2 curved edges · no corners';
    if (kind === 'cone') return '1 flat circle face + 1 curved surface · 1 curved edge · 1 point (vertex)';
    return r.faces + ' faces · ' + r.edges + ' edges · ' + r.vertices + ' corners · a ' + r.cat;
  }

  var LOOK_FOR = {
    curved: 'Would it roll? Shapes that roll have a curved surface.',
    cat: 'A prism has two matching ends. A pyramid has triangles that meet at one point.',
    shape: 'Look at the shape of each flat face, including the hidden ones (dashed lines).',
    noFlat: 'A flat face could sit flat on a table.',
    allSame: 'Are all the faces the same shape AND the same size?',
    allSquares: 'Squares have 4 equal sides.',
    faces: 'Count the flat faces. Dashed lines show faces at the back.',
    edges: 'Edges are the lines where two faces meet. Count the dashed ones too.',
    vertices: 'Corners are the points where edges meet. Count the dashed ones too.',
  };
  var PICK_TAG = {
    curved: 'Mixed up curved and flat surfaces',
    cat: 'Mixed up prisms and pyramids',
    shape: 'Mixed up the shapes of the faces',
    noFlat: 'Mixed up curved and flat surfaces',
    allSame: 'Mixed up the shapes of the faces',
    allSquares: 'Mixed up the shapes of the faces',
    faces: 'Miscounted faces',
    edges: 'Miscounted edges',
    vertices: 'Miscounted corners (vertices)',
  };
  var TAG_CROSSED = 'Crossed out a shape that fits the clue';
  var TAG_DICE_WRONG = 'Claimed a shape without the rolled property';
  var TAG_DICE_MISSED = 'Said no shape fits when one did';

  /* ---------------- dice key game ---------------- */
  var DICE_KEY = {
    1: { text: 'has a curved surface', sent: 'has a curved surface', test: function (k) { return TABLE[k].curved; } },
    2: { text: 'all faces the same', sent: 'has all its faces the same', test: function (k) { return TABLE[k].allSame === true; } },
    3: { text: 'has a triangle face', sent: 'has a triangle face', test: function (k) { return !!TABLE[k].shapes.triangle; } },
    4: { text: 'has a circle face', sent: 'has a circle face', test: function (k) { return !!TABLE[k].shapes.circle; } },
    5: { text: 'has a rectangle face (not a square)', sent: 'has a rectangle face (not a square)', test: function (k) { return !!TABLE[k].shapes.rectangle; } },
    6: { text: 'all faces are squares', sent: 'has only square faces', test: function (k) { return TABLE[k].allSquares === true; } },
  };
  function diceWhy(kind, face) {
    var r = TABLE[kind];
    var has = DICE_KEY[face].test(kind);
    if (face === 1) return r.curved ? 'it has a curved surface' : 'all its faces are flat';
    if (face === 2) {
      if (r.flat === 0) return 'it has no flat faces at all';
      if (r.curved) return 'it has a curved surface as well as ' + faceWords(kind);
      return reason(kind, { key: 'allSame' });
    }
    if (face === 6) {
      if (has) return 'all 6 faces are squares';
      if (r.flat === 0) return 'it has no flat faces at all';
      return 'it has ' + faceWords(kind) + (r.curved ? ' and a curved surface' : '');
    }
    if (r.flat === 0) return 'it has no flat faces at all';
    return flatPhrase(kind);
  }
  var GAME_BOARD = [
    ['cube', '#fff4cc'], ['cube', '#ffe3e3'],
    ['cuboid', '#ffd9ab'], ['cuboid', '#d3f9d8'], ['cuboid', '#e7f5ff'],
    ['cone', '#ffc9d6'], ['cone', '#fff3bf'],
    ['cylinder', '#dde3ec'], ['cylinder', '#ffe8cc'],
    ['triPrism', '#f7ddb5'], ['triPrism', '#e5dbff'],
    ['triPyramid', '#fde6a8'], ['triPyramid', '#c5f6fa'],
    ['sqPyramid', '#d3ebff'], ['sqPyramid', '#ffdeeb'],
    ['sphere', '#ffd59e'],
  ];
  var ROUNDS = 3;

  function newGame() {
    var tiles = U.shuffle(GAME_BOARD).map(function (t, i) {
      return { i: i, kind: t[0], fill: t[1], owner: null };
    });
    return {
      tiles: tiles,
      rolls: U.shuffle([1, 2, 3, 4, 5, 6]).slice(0, ROUNDS), // the child's rolls: all different
      bolt: [U.rand(1, 6), U.rand(1, 6), U.rand(1, 6)],
      childDone: 0,
      boltDone: 0,
      you: 0,
      bot: 0,
      log: [],
    };
  }
  function freeFits(game, face) {
    return game.tiles.filter(function (t) {
      return !t.owner && DICE_KEY[face].test(t.kind);
    });
  }
  function boltMove(game) {
    var face = game.bolt[game.boltDone];
    var opts = freeFits(game, face);
    var t = opts.length ? U.pick(opts) : null;
    if (t) {
      t.owner = 'bolt';
      game.bot++;
    }
    game.boltDone++;
    return { face: face, tile: t };
  }
  function childAuto(game) {
    var face = game.rolls[game.childDone];
    var opts = freeFits(game, face);
    if (opts.length) {
      opts[0].owner = 'you';
      game.you++;
    }
    game.childDone++;
  }

  /* ---------------- deck ---------------- */
  var COUNT = 9;
  function levelOf(i) {
    return i < COUNT / 3 ? 1 : i < (2 * COUNT) / 3 ? 2 : 3;
  }
  var deck = null;
  function buildDeck() {
    var q = [];
    var used = {};
    for (var i = 0; i < COUNT; i++) {
      var lv = levelOf(i);
      if (lv === 3) {
        q.push({ type: 'dice', level: 3, round: q.filter(function (x) { return x.type === 'dice'; }).length });
        continue;
      }
      var pool = U.shuffle((lv === 1 ? BASIC : ALL).filter(function (k) { return !used[k]; }));
      var made = null;
      for (var j = 0; j < pool.length && !made; j++) made = makeRiddle(pool[j], lv);
      if (!made) {
        console.error(ID + ': could not build a riddle for level ' + lv);
        continue;
      }
      used[made.answer] = true;
      q.push(made);
    }
    q.game = newGame();
    return q;
  }

  /* ---------------- drawing ---------------- */
  function shade(hex, k) {
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    function c(v) {
      return Math.max(0, Math.min(255, Math.round(v * k)));
    }
    return 'rgb(' + c(r) + ',' + c(g) + ',' + c(b) + ')';
  }

  /** Draw a shape into <g>. st: { cx, cy, s, yaw, pitch, pose, fill } */
  function drawModel(g, kind, st) {
    var K = KINDS[kind];
    var m = model(kind);
    var fill = st.fill || K.fill;
    if (m.sphere) {
      var r = st.s * m.R;
      g.appendChild(S('circle', { cx: st.cx, cy: st.cy, r: r, fill: fill, stroke: '#1b2a4a', 'stroke-width': 2.4 }));
      var ery = Math.max(4, r * Math.abs(Math.sin(st.pitch * D)));
      g.appendChild(S('path', { d: 'M' + (st.cx - r) + ',' + st.cy + ' A' + r + ',' + ery + ' 0 0 0 ' + (st.cx + r) + ',' + st.cy, fill: 'none', stroke: '#1b2a4a', 'stroke-width': 1.6 }));
      g.appendChild(S('path', { d: 'M' + (st.cx - r) + ',' + st.cy + ' A' + r + ',' + ery + ' 0 0 1 ' + (st.cx + r) + ',' + st.cy, fill: 'none', stroke: '#7a869f', 'stroke-width': 1.4, 'stroke-dasharray': '4 4' }));
      g.appendChild(S('ellipse', { cx: st.cx - r * 0.38, cy: st.cy - r * 0.42, rx: r * 0.2, ry: r * 0.12, fill: 'rgba(255,255,255,.75)', transform: 'rotate(-35 ' + (st.cx - r * 0.38) + ' ' + (st.cy - r * 0.42) + ')' }));
      return;
    }
    var M = mm(rx(st.pitch * D), mm(ry(st.yaw * D), POSES[st.pose] || I3));
    var pts = m.verts.map(function (v) {
      var q = mv(M, v);
      return [st.cx + st.s * q[0], st.cy - st.s * q[1]];
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
    m.faces.forEach(function (f, fi) {
      if (!front[fi]) return;
      var c = shade(fill, 0.8 + 0.24 * Math.max(0, dot(nz[fi], LIGHT)));
      g.appendChild(S('polygon', { points: ptsOf(f), fill: c, stroke: c, 'stroke-width': 0.8, 'stroke-linejoin': 'round' }));
    });
    var hidden = [], vis = [];
    m.edges.forEach(function (e) {
      var f1 = m.faces[e.f[0]], f2 = m.faces[e.f[1]];
      var fr = (front[e.f[0]] ? 1 : 0) + (front[e.f[1]] ? 1 : 0);
      if (f1.smooth && f2.smooth) {
        if (fr === 1) vis.push(e); // outline of the curved surface only
      } else if (fr > 0) vis.push(e);
      else hidden.push(e);
    });
    hidden.forEach(function (e) {
      g.appendChild(S('line', { x1: pts[e.a][0], y1: pts[e.a][1], x2: pts[e.b][0], y2: pts[e.b][1], stroke: '#7a869f', 'stroke-width': 1.5, 'stroke-dasharray': '4 4' }));
    });
    vis.forEach(function (e) {
      g.appendChild(S('line', { x1: pts[e.a][0], y1: pts[e.a][1], x2: pts[e.b][0], y2: pts[e.b][1], stroke: '#1b2a4a', 'stroke-width': 2.3, 'stroke-linecap': 'round' }));
    });
  }

  function shapeSvg(kind, o) {
    o = o || {};
    var K = KINDS[kind];
    var W = o.W || 150, H = o.H || 120;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'ms-pic', role: 'img', 'aria-label': K.name });
    var g = S('g');
    root.appendChild(g);
    var m = model(kind);
    drawModel(g, kind, {
      cx: W / 2,
      cy: H / 2,
      s: (Math.min(W, H) / 2 - (o.pad != null ? o.pad : 10)) / m.R,
      yaw: K.yaw != null ? K.yaw : -32,
      pitch: K.pitch != null ? K.pitch : 22,
      pose: K.pose || 'stand',
      fill: o.fill,
    });
    return root;
  }

  /** A cardboard box with a ? on it. box.open(kind) lifts the lid and shows the shape. */
  function mysteryBox() {
    var root = S('svg', { viewBox: '0 0 130 120', class: 'ms-box', role: 'img', 'aria-label': 'Mystery box' });
    var inside = S('g');
    var body = S(
      'g',
      null,
      S('polygon', { points: '18,58 112,58 104,112 26,112', fill: '#e9b77c', stroke: '#8a5a2b', 'stroke-width': 3, 'stroke-linejoin': 'round' }),
      S('line', { x1: 65, y1: 58, x2: 65, y2: 112, stroke: '#c98f52', 'stroke-width': 3 })
    );
    var qm = S('text', { x: 65, y: 100, 'text-anchor': 'middle', 'font-size': 34, 'font-weight': 900, fill: '#8a5a2b' }, '?');
    var lid = S('g', { class: 'ms-lid' }, S('polygon', { points: '12,44 118,44 114,60 16,60', fill: '#f2c793', stroke: '#8a5a2b', 'stroke-width': 3, 'stroke-linejoin': 'round' }));
    root.appendChild(inside);
    root.appendChild(body);
    root.appendChild(qm);
    root.appendChild(lid);
    root.open = function (kind) {
      MQ.clear(inside);
      var m = model(kind), K = KINDS[kind];
      drawModel(inside, kind, { cx: 65, cy: 40, s: 30 / m.R, yaw: K.yaw != null ? K.yaw : -32, pitch: K.pitch != null ? K.pitch : 22, pose: K.pose || 'stand' });
      lid.setAttribute('transform', 'rotate(-38 12 50) translate(-10 -6)');
      qm.textContent = '';
      root.classList.add('ms-open');
    };
    return root;
  }

  function tile(kind, o) {
    o = o || {};
    var b = el('button', { class: 'ms-tile' + (o.cls ? ' ' + o.cls : ''), type: 'button', 'data-kind': kind, 'aria-label': KINDS[kind].name });
    b.appendChild(shapeSvg(kind, { fill: o.fill, W: o.W, H: o.H, pad: o.pad }));
    if (!o.noName) b.appendChild(el('span', { class: 'ms-name' }, KINDS[kind].name));
    b.appendChild(el('span', { class: 'ms-mark' }));
    return b;
  }
  function setMark(b, text) {
    b.querySelector('.ms-mark').textContent = text || '';
  }
  function shake(api, b) {
    b.classList.remove('ms-shake');
    void b.offsetWidth;
    b.classList.add('ms-shake');
    api.later(function () {
      b.classList.remove('ms-shake');
    }, 450);
  }
  function boardEl(n, cls) {
    var cols = n <= 5 ? n : Math.ceil(n / 2);
    return el('div', { class: 'ms-board' + (cls ? ' ' + cls : ''), style: { '--cols': cols } });
  }

  function clueCard(c, i, state) {
    var card = el('div', { class: 'ms-clue ms-' + state, 'data-key': c.key, 'data-want': String(c.want), 'data-arg': c.arg || '' });
    card.appendChild(el('span', { class: 'ms-clue-n' }, 'Clue ' + (i + 1)));
    card.appendChild(el('span', { class: 'ms-clue-t' }, state === 'locked' ? '🔒' : clueText(c)));
    return card;
  }

  /* ---------------- dice picture ---------------- */
  var PIPS = {
    1: [[0.5, 0.5]],
    2: [[0.27, 0.27], [0.73, 0.73]],
    3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
    4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
    5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
    6: [[0.27, 0.22], [0.27, 0.5], [0.27, 0.78], [0.73, 0.22], [0.73, 0.5], [0.73, 0.78]],
  };
  function diceSvg(n, size) {
    size = size || 70;
    var root = S('svg', { viewBox: '0 0 100 100', class: 'ms-dice', style: { width: size + 'px', height: size + 'px' }, role: 'img', 'aria-label': n ? 'Dice showing ' + n : 'Dice' });
    root.appendChild(S('rect', { x: 6, y: 6, width: 88, height: 88, rx: 16, fill: '#fff', stroke: '#1b2a4a', 'stroke-width': 4 }));
    if (n) {
      PIPS[n].forEach(function (p) {
        root.appendChild(S('circle', { cx: 10 + p[0] * 80, cy: 10 + p[1] * 80, r: 8, fill: '#1b2a4a' }));
      });
    } else {
      root.appendChild(S('text', { x: 50, y: 66, 'text-anchor': 'middle', 'font-size': 46, 'font-weight': 900, fill: '#9aa5b8' }, '?'));
    }
    return root;
  }
  function diceKey(active) {
    var box = el('div', { class: 'ms-key' }, el('div', { class: 'ms-key-title' }, 'Dice key'));
    [1, 2, 3, 4, 5, 6].forEach(function (n) {
      box.appendChild(el('div', { class: 'ms-key-row' + (n === active ? ' ms-on' : ''), 'data-face': n }, el('b', null, String(n)), el('span', null, DICE_KEY[n].text)));
    });
    box.setActive = function (a) {
      Array.prototype.forEach.call(box.querySelectorAll('.ms-key-row'), function (r) {
        r.classList.toggle('ms-on', +r.getAttribute('data-face') === a);
      });
    };
    return box;
  }
  /** Rolls the dice picture to `face` with a short tumble, then calls done. */
  function rollTo(api, holder, face, done) {
    var seq = [U.rand(1, 6), U.rand(1, 6), U.rand(1, 6), U.rand(1, 6), face];
    seq.forEach(function (n, i) {
      api.later(function () {
        MQ.clear(holder);
        var d = diceSvg(n, 76);
        if (i < seq.length - 1) d.classList.add('ms-tumble');
        holder.appendChild(d);
        if (i === seq.length - 1) done();
      }, 90 + i * 110);
    });
  }

  /* ---------------- learn screens ---------------- */
  var LEARN_BOARD = ['sphere', 'cube', 'cylinder', 'triPrism', 'cone', 'sqPyramid', 'cuboid', 'triPyramid'];
  var LEARN_CLUES = [{ key: 'curved', want: false }, { key: 'shape', arg: 'triangle', want: true }, { key: 'vertices', want: 5 }];
  var learnCrossed = null;

  function learnBoard(stage, crossed, onClick) {
    var board = boardEl(LEARN_BOARD.length);
    var tiles = LEARN_BOARD.map(function (k, i) {
      var b = tile(k);
      if (crossed[k]) b.classList.add('ms-crossed');
      setMark(b, crossed[k] ? '✗' : '');
      b.addEventListener('click', function () {
        onClick(k, b, i);
      });
      board.appendChild(b);
      return b;
    });
    stage.appendChild(board);
    return tiles;
  }

  function learnCrossOut(stage, api) {
    api.lockNext();
    api.say('I hid a shape in this box! Clue 1: I have no curved surfaces. Cross out every shape that has one.');
    learnCrossed = {};
    var box = mysteryBox();
    var clues = el('div', { class: 'ms-clues' }, clueCard(LEARN_CLUES[0], 0, 'now'));
    stage.appendChild(el('div', { class: 'ms-top' }, box, clues));
    stage.appendChild(el('div', { class: 'ms-mode' }, '✗ Click the shapes that do NOT fit the clue.'));
    var left = 3;
    learnBoard(stage, learnCrossed, function (k, b) {
      if (learnCrossed[k]) return;
      if (TABLE[k].curved) {
        learnCrossed[k] = true;
        b.classList.add('ms-crossed');
        setMark(b, '✗');
        api.sound('pop');
        left--;
        api.feedback('The ' + KINDS[k].name + ' (like a ' + KINDS[k].obj + ') has a curved surface. Crossed out!', 'good');
        if (left === 0) {
          api.say('Yes! The ball, the tin and the party hat would roll. They are out.', 'cheer');
          api.feedback('5 shapes are left. Press Next for clue 2.', 'good');
          api.unlockNext();
        }
      } else {
        api.sound('wrong');
        shake(api, b);
        api.feedback('The ' + KINDS[k].name + ' has only flat faces, so it fits the clue. Keep it!', 'try');
      }
    });
  }

  function learnKeepGoing(stage, api) {
    api.lockNext();
    if (!learnCrossed) learnCrossed = { sphere: true, cylinder: true, cone: true };
    var crossed = learnCrossed;
    var step = 1;
    var box = mysteryBox();
    var clues = el('div', { class: 'ms-clues' });
    var mode = el('div', { class: 'ms-mode' });
    stage.appendChild(el('div', { class: 'ms-top' }, box, clues));
    stage.appendChild(mode);
    function showClues() {
      MQ.clear(clues);
      LEARN_CLUES.forEach(function (c, i) {
        if (i <= step) clues.appendChild(clueCard(c, i, i < step ? 'done' : 'now'));
      });
    }
    function remaining() {
      return LEARN_BOARD.filter(function (k) {
        return !crossed[k];
      });
    }
    function setMode() {
      if (step === 1) {
        mode.textContent = '✗ Cross out the shapes with no triangle face.';
        api.say('Clue 2: I have a triangle face. Which shapes have none?');
      } else if (step === 2) {
        mode.textContent = '✗ Count the corners. Cross out the shapes without 5.';
        api.say('Clue 3: I have 5 corners. Count carefully!');
      } else {
        mode.textContent = '🔍 One shape is left. Click it to open the box!';
        api.say('Only one shape is left. Click it to open the box!', 'cheer');
      }
    }
    showClues();
    setMode();
    var opened = false;
    learnBoard(stage, crossed, function (k, b) {
      if (crossed[k] || opened) return;
      if (step === 3) {
        opened = true;
        box.open(k);
        b.classList.add('ms-answer');
        api.sound('correct');
        api.say('It is the square-based pyramid! 3 clues found it.', 'cheer');
        api.feedback('Square-based pyramid: ' + factLine(k) + '.', 'good');
        api.unlockNext();
        return;
      }
      var c = LEARN_CLUES[step];
      if (!fits(k, c)) {
        crossed[k] = true;
        b.classList.add('ms-crossed');
        setMark(b, '✗');
        api.sound('pop');
        api.feedback(The(k) + ': ' + reason(k, c) + '. Crossed out!', 'good');
        var rest = remaining().filter(function (x) {
          return !fits(x, c);
        });
        if (!rest.length) {
          step++;
          api.later(function () {
            showClues();
            setMode();
          }, 700);
        }
      } else {
        api.sound('wrong');
        shake(api, b);
        api.feedback(The(k) + ' fits: ' + reason(k, c) + '. Keep it!', 'try');
      }
    });
  }

  function learnDice(stage, api) {
    api.lockNext();
    api.say('At the end we play a game. Roll the dice, then claim a shape that matches the dice key!');
    var face = 3;
    var kinds = ['cube', 'cylinder', 'triPrism', 'sphere', 'sqPyramid', 'cuboid'];
    var holder = el('div', { class: 'ms-dicebox' }, diceSvg(0, 76));
    var key = diceKey(0);
    var rolled = false, done = false;
    var rollBtn = el('button', { class: 'btn ms-roll', type: 'button' }, '🎲 Roll');
    rollBtn.addEventListener('click', function () {
      if (rolled) return;
      rolled = true;
      rollBtn.disabled = true;
      api.sound('click');
      rollTo(api, holder, face, function () {
        key.setActive(face);
        api.say('You rolled 3: has a triangle face. Click a shape with a triangle face.');
        mode.textContent = 'Claim a shape that ' + DICE_KEY[face].sent + '.';
      });
    });
    stage.appendChild(el('div', { class: 'ms-top' }, el('div', { class: 'ms-dicecol' }, holder, rollBtn), key));
    var mode = el('div', { class: 'ms-mode' }, 'Press Roll.');
    stage.appendChild(mode);
    var board = boardEl(kinds.length);
    kinds.forEach(function (k) {
      var b = tile(k);
      b.addEventListener('click', function () {
        if (done) return;
        if (!rolled) {
          api.feedback('Roll the dice first.', 'info');
          return;
        }
        if (DICE_KEY[face].test(k)) {
          done = true;
          b.classList.add('ms-you');
          setMark(b, '★');
          api.sound('correct');
          api.say('Yes! It is yours. Then I roll and take a shape too. Most shapes wins!', 'cheer');
          api.feedback(The(k) + ' has a triangle face: ' + diceWhy(k, face) + '.', 'good');
          api.unlockNext();
        } else {
          api.sound('wrong');
          shake(api, b);
          api.feedback(The(k) + ' has no triangle face: ' + diceWhy(k, face) + '.', 'try');
        }
      });
      board.appendChild(b);
    });
    stage.appendChild(board);
  }

  /* ---------------- practice: riddles ---------------- */
  function renderRiddle(stage, api, q) {
    var last = q.clues.length - 1;
    var k = 0; // the clue the child is working on
    var crossed = {}; // board index -> clue number that removed it
    var box = mysteryBox();
    var clues = el('div', { class: 'ms-clues' });
    var mode = el('div', { class: 'ms-mode' });
    var work = el('div', { class: 'ms-work' });
    stage.appendChild(el('div', { class: 'ms-top' }, box, clues));
    stage.appendChild(mode);
    var board = boardEl(q.board.length);
    stage.appendChild(board);
    stage.appendChild(work);

    function drawClues() {
      MQ.clear(clues);
      q.clues.forEach(function (c, i) {
        clues.appendChild(clueCard(c, i, i < k ? 'done' : i === k ? 'now' : 'locked'));
      });
    }
    function setMode() {
      mode.className = 'ms-mode' + (k === last ? ' ms-pick' : '');
      mode.textContent = k === last ? '🔍 Clue ' + (k + 1) + ': click the mystery shape.' : '✗ Cross out every shape that does NOT fit clue ' + (k + 1) + '.';
    }
    drawClues();
    setMode();
    api.say(k === last ? 'Read the clue and find my shape!' : 'Clue 1: ' + clueText(q.clues[0]) + ' Cross out the shapes that do not fit.', 'think');

    var tiles = q.board.map(function (kind, i) {
      var b = tile(kind);
      b.setAttribute('data-i', i);
      b.addEventListener('click', function () {
        onTile(i, b);
      });
      board.appendChild(b);
      return b;
    });

    function cross(i, n) {
      crossed[i] = n;
      tiles[i].classList.add('ms-crossed');
      setMark(tiles[i], '✗');
    }
    function stillIn(i) {
      return crossed[i] == null;
    }
    function solved(i) {
      tiles[i].classList.add('ms-answer');
      box.open(q.answer);
    }

    function onTile(i, b) {
      if (api.isAnswered() || !stillIn(i)) return;
      var kind = q.board[i];
      var c = q.clues[k];
      if (k < last) {
        if (!fits(kind, c)) {
          cross(i, k);
          api.sound('pop');
          var rest = q.board.filter(function (x, j) {
            return stillIn(j) && !fits(x, c);
          });
          if (!rest.length) {
            k++;
            drawClues();
            setMode();
            api.say('Clue ' + (k + 1) + ': ' + clueText(q.clues[k]), 'think');
            api.feedback(k === last ? 'Well crossed! Last clue: now pick the mystery shape.' : 'Well crossed! Here is clue ' + (k + 1) + '.', 'info');
          } else {
            api.feedback(The(kind) + ': ' + reason(kind, c) + '. Out!', 'info');
          }
          return;
        }
        shake(api, b);
        var hint = The(kind) + ' fits clue ' + (k + 1) + ': ' + reason(kind, c) + '. Only cross out shapes that do NOT fit.';
        if (api.tries() >= 1) {
          var notFit = q.board.filter(function (x, j) {
            return stillIn(j) && !fits(x, c);
          });
          hint += ' ' + LOOK_FOR[c.key] + (notFit.length ? ' Try ' + the(notFit[0]) + '.' : '');
        }
        api.check(false, hint, TAG_CROSSED);
        return;
      }
      // last clue: pick the mystery shape
      if (fitsAll(kind, q.clues)) {
        solved(i);
        api.check(true, 'Yes! It is ' + the(kind) + ': ' + reason(kind, c) + '.');
        work.appendChild(el('div', { class: 'ms-fact' }, '✓ ' + KINDS[kind].name + ': ' + factLine(kind)));
        return;
      }
      cross(i, k);
      shake(api, b);
      var h = The(kind) + ' does not fit clue ' + (k + 1) + ': ' + reason(kind, c) + '.';
      if (api.tries() >= 1) h += ' ' + LOOK_FOR[c.key] + ' Check each shape that is left against clue ' + (k + 1) + '.';
      api.check(false, h, PICK_TAG[c.key]);
    }

    api.onReveal(function () {
      // cross out by the first clue each shape fails, then show the answer and the working
      q.board.forEach(function (kind, i) {
        if (kind === q.answer) return;
        for (var n = 0; n < q.clues.length; n++) {
          if (!fits(kind, q.clues[n])) {
            if (stillIn(i)) cross(i, n);
            break;
          }
        }
      });
      tiles.forEach(function (b, i) {
        if (crossed[i] != null) setMark(b, '✗' + (crossed[i] + 1));
      });
      k = last;
      MQ.clear(clues);
      q.clues.forEach(function (c, i) {
        clues.appendChild(clueCard(c, i, 'done'));
      });
      mode.className = 'ms-mode ms-pick';
      mode.textContent = '✗1 = crossed out by clue 1, ✗2 = by clue 2, and so on.';
      solved(q.board.indexOf(q.answer));
      MQ.clear(work);
      q.clues.forEach(function (c, n) {
        var out = q.board.filter(function (kind, i) {
          return crossed[i] === n;
        });
        work.appendChild(
          el('div', { class: 'ms-workrow' }, el('b', null, 'Clue ' + (n + 1) + ': '), clueText(c) + ' ', out.length ? '✗ ' + list(out.map(function (x) { return KINDS[x].name; })) : '')
        );
      });
      work.appendChild(el('div', { class: 'ms-fact' }, '✓ ' + KINDS[q.answer].name + ': ' + q.clues.map(function (c) { return reason(q.answer, c); }).join('; ') + '.'));
      api.feedback('The mystery shape is ' + the(q.answer) + '.', 'info');
    });
  }

  /* ---------------- practice: dice game ---------------- */
  function renderDice(stage, api, q) {
    var game = deck.game;
    var r = q.round;
    // If the screen was reached directly (test tool), play the missing turns automatically.
    while (game.childDone < r) {
      childAuto(game);
      if (game.boltDone < game.childDone - 1) game.lastBolt = boltMove(game);
    }
    if (game.boltDone < r) game.lastBolt = boltMove(game);
    var boltNow = r > 0 ? game.lastBolt : null;
    var face = game.rolls[r];
    var rolled = false;

    var score = el('div', { class: 'ms-score' });
    function drawScore() {
      MQ.clear(score);
      score.appendChild(el('div', { class: 'ms-sc ms-sc-you' }, el('span', null, '★ You'), el('b', null, String(game.you))));
      score.appendChild(el('div', { class: 'ms-sc ms-sc-bolt' }, el('span', null, '🤖 Bolt'), el('b', null, String(game.bot))));
      score.appendChild(el('div', { class: 'ms-round' }, 'Round ' + (r + 1) + ' of ' + ROUNDS));
    }
    drawScore();
    var holder = el('div', { class: 'ms-dicebox' }, diceSvg(0, 76));
    var rollBtn = el('button', { class: 'btn ms-roll', type: 'button' }, '🎲 Roll');
    var key = diceKey(0);
    stage.appendChild(el('div', { class: 'ms-top ms-gametop' }, el('div', { class: 'ms-dicecol' }, holder, rollBtn), key, score));
    var mode = el('div', { class: 'ms-mode' }, 'Your turn: press Roll.');
    var passBtn = el('button', { class: 'btn btn-ghost ms-pass', type: 'button', disabled: true }, 'No free shape fits: miss a go');
    stage.appendChild(el('div', { class: 'ms-moderow' }, mode, passBtn));
    var board = el('div', { class: 'ms-board ms-gameboard' });
    var tiles = game.tiles.map(function (t) {
      var b = tile(t.kind, { fill: t.fill, W: 120, H: 84, pad: 6, cls: 'ms-gtile' });
      b.setAttribute('data-i', t.i);
      b.setAttribute('title', KINDS[t.kind].name);
      b.addEventListener('click', function () {
        onTile(t, b);
      });
      board.appendChild(b);
      return b;
    });
    function paint() {
      game.tiles.forEach(function (t, i) {
        var b = tiles[i];
        b.classList.toggle('ms-you', t.owner === 'you');
        b.classList.toggle('ms-bolt', t.owner === 'bolt');
        b.setAttribute('data-owner', t.owner || '');
        setMark(b, t.owner === 'you' ? '★' : t.owner === 'bolt' ? '🤖' : '');
      });
    }
    paint();
    stage.appendChild(board);

    if (boltNow) {
      if (boltNow.tile) {
        tiles[boltNow.tile.i].classList.add('ms-flash');
        api.say('My turn: I rolled ' + boltNow.face + ' (' + DICE_KEY[boltNow.face].text + '). I take ' + the(boltNow.tile.kind) + '! Your roll.');
      } else {
        api.say('I rolled ' + boltNow.face + ' (' + DICE_KEY[boltNow.face].text + '), but no free shape fits. I miss a go! Your roll.');
      }
    } else {
      api.say('You go first! Roll the dice, then claim a shape that matches the key.');
    }

    rollBtn.addEventListener('click', function () {
      if (rolled) return;
      rolled = true;
      rollBtn.disabled = true;
      api.sound('click');
      rollTo(api, holder, face, function () {
        key.setActive(face);
        stage.setAttribute('data-roll', face);
        passBtn.disabled = false;
        mode.textContent = 'You rolled ' + face + ': claim a free shape that ' + DICE_KEY[face].sent + '.';
        api.say('You rolled ' + face + '. Find a free shape that ' + DICE_KEY[face].sent + '.', 'think');
      });
    });

    function finishTurn(msg) {
      passBtn.disabled = true;
      paint();
      drawScore();
      if (r === ROUNDS - 1) {
        api.later(function () {
          var mv2 = game.boltDone < ROUNDS ? boltMove(game) : null;
          paint();
          drawScore();
          if (mv2 && mv2.tile) tiles[mv2.tile.i].classList.add('ms-flash');
          var line = mv2 ? (mv2.tile ? 'My last roll: ' + mv2.face + '. I take ' + the(mv2.tile.kind) + '.' : 'My last roll: ' + mv2.face + '. Nothing fits!') : '';
          var res = game.you > game.bot ? 'You win ' + game.you + ' to ' + game.bot + '! 🏆' : game.you === game.bot ? 'A draw, ' + game.you + ' each! Well played.' : 'I win ' + game.bot + ' to ' + game.you + '. Good game!';
          api.say(line + ' ' + res, 'cheer');
          mode.className = 'ms-mode ms-result';
          mode.textContent = res;
        }, 900);
      } else if (msg) {
        mode.className = 'ms-mode ms-pick';
        mode.textContent = msg + ' Next: Bolt\'s turn.';
      }
    }

    function onTile(t, b) {
      if (api.isAnswered()) return;
      if (!rolled) {
        api.feedback('Roll the dice first.', 'info');
        return;
      }
      if (t.owner) {
        api.feedback('That shape is already taken. Choose a free one.', 'info');
        shake(api, b);
        return;
      }
      if (DICE_KEY[face].test(t.kind)) {
        t.owner = 'you';
        game.you++;
        game.childDone = r + 1;
        api.check(true, 'Yours! ' + The(t.kind) + ': ' + diceWhy(t.kind, face) + '.');
        finishTurn('★ ' + KINDS[t.kind].name + ': ' + diceWhy(t.kind, face) + '.');
        return;
      }
      shake(api, b);
      var opts = freeFits(game, face);
      var hint = The(t.kind) + ' does not match: ' + diceWhy(t.kind, face) + '.';
      if (api.tries() >= 1) hint += opts.length ? ' Look for a free shape that ' + DICE_KEY[face].sent + '. Try ' + the(opts[0].kind) + '.' : ' Is there any free shape that fits?';
      api.check(false, hint, TAG_DICE_WRONG);
    }

    passBtn.addEventListener('click', function () {
      if (api.isAnswered() || !rolled) return;
      var opts = freeFits(game, face);
      if (!opts.length) {
        game.childDone = r + 1;
        passBtn.classList.add('ms-passok');
        api.check(true, 'Right! No free shape ' + DICE_KEY[face].sent + ', so you miss a go.');
        finishTurn('No free shape ' + DICE_KEY[face].sent + '.');
        return;
      }
      var h = 'Look again: a free shape ' + DICE_KEY[face].sent + '.';
      if (api.tries() >= 1) h += ' Try ' + the(opts[0].kind) + '.';
      api.check(false, h, TAG_DICE_MISSED);
    });

    api.onReveal(function () {
      if (!rolled) {
        rolled = true;
        MQ.clear(holder);
        holder.appendChild(diceSvg(face, 76));
        key.setActive(face);
        stage.setAttribute('data-roll', face);
      }
      rollBtn.disabled = true;
      passBtn.disabled = true;
      var opts = freeFits(game, face);
      game.childDone = r + 1;
      if (!opts.length) {
        passBtn.classList.add('ms-passok');
        finishTurn('No free shape ' + DICE_KEY[face].sent + ', so you miss a go.');
        return;
      }
      opts.forEach(function (t) {
        tiles[t.i].classList.add('ms-hint');
      });
      var t0 = opts[0];
      t0.owner = 'you';
      game.you++;
      finishTurn('Every gold shape ' + DICE_KEY[face].sent + '. You get ' + the(t0.kind) + ': ' + diceWhy(t0.kind, face) + '.');
    });
  }

  /* ---------------- register ---------------- */
  MQ.register(ID, {
    learn: [learnCrossOut, learnKeepGoing, learnDice],
    practice: {
      count: COUNT,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (!q) {
          deck = buildDeck();
          q = deck[api.index];
        }
        stage.setAttribute('data-qtype', q.type);
        if (q.type === 'riddle') renderRiddle(stage, api, q);
        else renderDice(stage, api, q);
      },
    },
    // Read-only hooks for tests (not used by the app).
    _test: { buildDeck: buildDeck, table: TABLE, value: value, fits: fits, clueText: clueText, diceKey: DICE_KEY, riddleOk: riddleOk, deck: function () { return deck; } },
  });

  var css = [
    '.ms-top{display:flex;gap:16px;align-items:center;justify-content:center;flex-wrap:wrap;width:100%}',
    '.ms-box{width:120px;height:auto;flex:0 0 auto}',
    '.ms-lid{transition:transform .5s ease}',
    '.ms-clues{display:flex;flex-direction:column;gap:6px;min-width:0;flex:1 1 300px;max-width:520px}',
    '.ms-clue{display:flex;gap:10px;align-items:baseline;background:#fff;border:3px solid var(--line);border-radius:14px;padding:6px 12px;font-size:1.2rem;font-weight:800;line-height:1.25}',
    '.ms-clue-n{flex:0 0 auto;font-size:.9rem;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.03em}',
    '.ms-clue.ms-now{border-color:var(--accent);background:var(--info-bg)}',
    '.ms-clue.ms-done{color:var(--ink-soft);font-weight:700}',
    '.ms-clue.ms-locked{color:#9aa5b8;background:var(--paper-2)}',
    '.ms-mode{font-size:1.15rem;font-weight:800;text-align:center;color:#c2410c}',
    '.ms-mode.ms-pick{color:#0b6e66}',
    '.ms-board{display:grid;grid-template-columns:repeat(var(--cols,4),minmax(0,1fr));gap:10px;width:100%;max-width:min(100%,calc(var(--cols,4) * 160px))}',
    '.ms-tile{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;background:#fff;border:3px solid var(--line);border-radius:14px;padding:4px 4px 6px;cursor:pointer;font:inherit;color:var(--ink);transition:transform .08s ease,border-color .1s ease,opacity .2s}',
    '.ms-tile:hover:not(.ms-crossed){border-color:var(--accent);transform:translateY(-2px)}',
    '.ms-pic{width:100%;max-width:150px;height:auto;display:block}',
    '.ms-name{font-size:.92rem;font-weight:800;line-height:1.1;text-align:center;min-height:2.2em;display:flex;align-items:center}',
    '.ms-mark{position:absolute;top:2px;right:6px;font-size:1.6rem;font-weight:900;line-height:1;pointer-events:none}',
    '.ms-crossed{cursor:default;background:var(--paper-2)}',
    '.ms-crossed .ms-pic,.ms-crossed .ms-name{opacity:.3}',
    '.ms-crossed .ms-mark{color:#c2410c;top:50%;left:50%;right:auto;transform:translate(-50%,-62%);font-size:3.6rem}',
    '.ms-answer{border-color:var(--good);background:var(--good-bg);box-shadow:0 0 0 4px rgba(46,196,182,.25)}',
    '.ms-shake{animation:ms-shake .4s}',
    '@keyframes ms-shake{20%{transform:translateX(-6px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}',
    '.ms-work{display:flex;flex-direction:column;gap:4px;align-items:center;text-align:center;font-size:1.05rem;max-width:760px}',
    '.ms-work:empty{display:none}',
    '.ms-workrow b{color:#0b6e66}',
    '.ms-fact{font-weight:800;background:var(--good-bg);border-radius:12px;padding:4px 12px}',
    '.ms-mode.ms-result{font-size:1.3rem;font-weight:900;color:var(--ink);background:#fff3bf;border:3px solid var(--gold);border-radius:14px;padding:4px 16px}',
    '.ms-dicecol{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.ms-dicebox{width:76px;height:76px}',
    '.ms-tumble{animation:ms-tumble .11s linear}',
    '@keyframes ms-tumble{from{transform:rotate(-25deg)}to{transform:rotate(25deg)}}',
    '.ms-roll{min-width:110px}',
    '.ms-key{background:#fff;border:3px solid var(--line);border-radius:14px;padding:6px 10px;display:flex;flex-direction:column;gap:2px;min-width:0;max-width:400px}',
    '.ms-key-title{font-weight:900;font-size:.9rem;color:var(--ink-soft);text-transform:uppercase}',
    '.ms-key-row{display:flex;gap:8px;align-items:center;font-size:1rem;font-weight:700;border-radius:8px;padding:0 6px;line-height:1.35}',
    '.ms-key-row b{display:inline-flex;justify-content:center;align-items:center;width:22px;height:22px;border-radius:6px;background:var(--paper-2)}',
    '.ms-key-row.ms-on{background:#ffd166;font-weight:900}',
    '.ms-key-row.ms-on b{background:#fff}',
    '.ms-score{display:flex;flex-direction:column;gap:6px;align-items:stretch}',
    '.ms-sc{display:flex;justify-content:space-between;gap:12px;font-weight:800;border-radius:12px;padding:4px 12px;font-size:1.1rem}',
    '.ms-sc b{font-size:1.4rem}',
    '.ms-sc-you{background:var(--good-bg);color:#0b6e66}',
    '.ms-sc-bolt{background:#e7efff;color:#3b5bdb}',
    '.ms-round{font-size:.95rem;font-weight:700;color:var(--ink-soft);text-align:center}',
    '.ms-gameboard{grid-template-columns:repeat(8,minmax(0,1fr));max-width:920px;gap:6px}',
    '.ms-gtile{padding:2px}',
    '.ms-gtile .ms-pic{max-width:110px}',
    '.ms-gtile .ms-name{font-size:.72rem;min-height:2.3em;font-weight:700}',
    '.ms-you{border-color:var(--good);background:var(--good-bg)}',
    '.ms-you .ms-mark{color:#0b6e66}',
    '.ms-bolt{border-color:#748ffc;background:#e7efff}',
    '.ms-flash{animation:ms-flash 1s 2}',
    '@keyframes ms-flash{50%{box-shadow:0 0 0 6px rgba(116,143,252,.55)}}',
    '.ms-hint{box-shadow:0 0 0 4px #ffd166}',
    '.ms-pass{font-size:1rem;padding:8px 14px}',
    '.ms-moderow{display:flex;gap:14px;align-items:center;justify-content:center;flex-wrap:wrap;width:100%}',
    '.ms-passok{border-color:var(--good)!important;background:var(--good-bg)!important}',
    '@media (max-width:760px){.ms-gameboard{grid-template-columns:repeat(4,minmax(0,1fr))}.ms-gtile .ms-pic{max-width:90px}}',
    '@media (max-width:640px){.ms-board:not(.ms-gameboard){grid-template-columns:repeat(3,minmax(0,1fr))}.ms-clue{font-size:1.05rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

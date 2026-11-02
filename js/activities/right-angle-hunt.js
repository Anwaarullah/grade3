/* Right Angle Hunt (Unit 15.1). Make a paper right-angle checker, use it to sort angles
 * (right angle / greater / less), and find right angles inside shapes.
 * Every angle is drawn from real angle values, and every answer is computed from the same
 * geometry that is drawn (shape corners are measured from the polygon points).
 * All drawings are original.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  var M = 84; // size of the paper checker (viewBox units)
  var SNAP = 36; // how close the checker corner must be to a vertex to snap
  var RAD = Math.PI / 180;

  var TAG = {
    tilt: 'Missed a tilted right angle',
    missR: 'Did not spot a right angle',
    len: 'Judged by line length',
    gl: 'Mixed up greater and less',
    notR: 'Called an angle a right angle when it is not',
    line: 'Did not see a straight line = 2 right angles',
    L: 'Counted the outside corner of an L',
    inward: 'Counted an inward corner as a right angle',
    miss: 'Missed a right angle in a shape',
    extra: 'Marked a corner that is not a right angle',
    ringR: 'Ringed a corner that is a right angle',
    missN: 'Missed an angle that is not a right angle',
  };

  /* ---------------- geometry helpers (SVG coords, angles in maths degrees, CCW) ---------------- */
  function n2(v) {
    return Math.round(v * 100) / 100;
  }
  function norm(a) {
    a = a % 360;
    return a < 0 ? a + 360 : a;
  }
  function angDist(a, b) {
    var d = Math.abs(norm(a) - norm(b));
    return Math.min(d, 360 - d);
  }
  function pt(V, a, r) {
    return [V[0] + Math.cos(a * RAD) * r, V[1] - Math.sin(a * RAD) * r];
  }
  function dist(p, q) {
    return Math.sqrt((p[0] - q[0]) * (p[0] - q[0]) + (p[1] - q[1]) * (p[1] - q[1]));
  }
  function dirOf(from, to) {
    return norm(Math.atan2(-(to[1] - from[1]), to[0] - from[0]) / RAD);
  }
  // rotate an SVG point about the origin by a maths angle (anticlockwise on screen)
  function rotS(p, deg) {
    var c = Math.cos(deg * RAD);
    var s = Math.sin(deg * RAD);
    return [p[0] * c + p[1] * s, -p[0] * s + p[1] * c];
  }
  function pts(list) {
    return list
      .map(function (p) {
        return n2(p[0]) + ',' + n2(p[1]);
      })
      .join(' ');
  }
  function isRight(th) {
    return Math.abs(th - 90) < 0.5;
  }
  function catOf(th) {
    return isRight(th) ? 'right' : th > 90 ? 'greater' : 'less';
  }
  function bbox(list) {
    var b = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
    list.forEach(function (p) {
      b.x0 = Math.min(b.x0, p[0]);
      b.y0 = Math.min(b.y0, p[1]);
      b.x1 = Math.max(b.x1, p[0]);
      b.y1 = Math.max(b.y1, p[1]);
    });
    return b;
  }
  function arcPts(V, start, sweep, r) {
    var out = [];
    for (var i = 0; i <= 12; i++) out.push(pt(V, start + (sweep * i) / 12, r));
    return out;
  }
  function arcD(V, start, sweep, r) {
    var p1 = pt(V, start, r);
    var p2 = pt(V, start + sweep, r);
    return 'M' + n2(p1[0]) + ',' + n2(p1[1]) + ' A' + r + ',' + r + ' 0 ' + (sweep > 180 ? 1 : 0) + ',0 ' + n2(p2[0]) + ',' + n2(p2[1]);
  }
  function wedgeD(V, start, sweep, r) {
    return 'M' + n2(V[0]) + ',' + n2(V[1]) + ' L' + arcD(V, start, sweep, r).slice(1) + ' Z';
  }
  function squareD(V, a1, s) {
    var p1 = pt(V, a1, s);
    var p3 = pt(V, a1 + 90, s);
    return 'M' + pts([p1, [p1[0] + p3[0] - V[0], p1[1] + p3[1] - V[1]], p3]).replace(/ /g, ' L');
  }
  /** Interior angle at every corner of a polygon (SVG points). */
  function corners(poly) {
    var n = poly.length;
    var area = 0;
    for (var i = 0; i < n; i++) {
      var a = poly[i];
      var b = poly[(i + 1) % n];
      area += a[0] * -b[1] - b[0] * -a[1];
    }
    var ccw = area > 0;
    return poly.map(function (p, i) {
      var nx = poly[(i + 1) % n];
      var pv = poly[(i - 1 + n) % n];
      if (!ccw) {
        var tmp = nx;
        nx = pv;
        pv = tmp;
      }
      var dn = dirOf(p, nx);
      var dp = dirOf(p, pv);
      return { V: p, a1: dn, theta: norm(dp - dn), L1: dist(p, nx), L2: dist(p, pv) };
    });
  }

  /* ---------------- scene, tray and the draggable paper checker ---------------- */
  function makeScene(W, H) {
    var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'rah-svg', style: { width: W + 'px' } });
    var sc = { svg: svg, W: W, H: H, targets: [] };
    ['art', 'marks', 'chk', 'wedge', 'top', 'dots', 'ui'].forEach(function (k) {
      sc[k] = S('g', { class: 'rah-l-' + k });
      svg.appendChild(sc[k]);
    });
    sc.setVerdict = function () {};
    return sc;
  }

  function addTray(sc, x, y, w, h) {
    sc.art.appendChild(S('rect', { x: x, y: y, width: w, height: h, rx: 14, class: 'rah-tray' }));
    sc.art.appendChild(S('text', { x: x + w / 2, y: y + 24, class: 'rah-tray-lab', 'text-anchor': 'middle' }, 'Checker'));
    var t1 = S('text', { x: x + w / 2, y: y + 70, class: 'rah-verdict', 'text-anchor': 'middle' });
    var t2 = S('text', { x: x + w / 2, y: y + 94, class: 'rah-verdict', 'text-anchor': 'middle' });
    sc.art.appendChild(t1);
    sc.art.appendChild(t2);
    sc.setVerdict = function (t) {
      var lines = t ? verdictLines(t) : ['', ''];
      t1.textContent = lines[0];
      t2.textContent = lines[1];
      var cls = 'rah-verdict' + (t ? ' rah-vt-' + (t.theta > 179 ? 'greater' : catOf(t.theta)) : '');
      t1.setAttribute('class', cls);
      t2.setAttribute('class', cls);
    };
    return [x + (w - M) / 2, y + h - 14];
  }

  function verdictLines(t) {
    if (Math.abs(t.theta - 180) < 0.5) return ['Room for', 'one more!'];
    if (t.theta > 180) return ['A very', 'big gap.'];
    var c = catOf(t.theta);
    if (c === 'right') return ['Fits', 'exactly!'];
    if (c === 'greater') return ['There is', 'a gap.'];
    return ['It sticks', 'out.'];
  }

  var CHK_D = 'M0,0 H' + M + ' V' + n2(M * 0.55) + ' Q' + M + ',' + M + ' ' + n2(M * 0.55) + ',' + M + ' H0 Z';
  function checkerShape(cls) {
    return S(
      'g',
      { class: 'rah-chk ' + (cls || '') },
      S('path', { d: CHK_D, class: 'rah-chk-paper' }),
      S('path', { d: 'M5,5 H' + (M - 10) + ' M5,5 V' + (M - 10), class: 'rah-chk-fold' }),
      S('path', { d: 'M0,16 H16 V0', class: 'rah-chk-sq' })
    );
  }
  function placeChecker(g, x, y, r) {
    g.setAttribute('transform', 'translate(' + n2(x) + ',' + n2(y) + ') rotate(' + n2(-r) + ') scale(1,-1)');
  }
  function alignR(t, align) {
    return align === 'B' ? t.a1 + t.theta - 90 : t.a1;
  }
  /** Gap (greater) or overlap (less) between the checker and the other arm. */
  function drawVerdict(layer, t, align) {
    var c = catOf(t.theta);
    var R = M * 0.92;
    if (c === 'right') {
      layer.appendChild(S('path', { d: squareD(t.V, t.a1, 22), class: 'rah-v-right' }));
    } else if (c === 'greater') {
      var st = align === 'B' ? t.a1 : t.a1 + 90;
      layer.appendChild(S('path', { d: wedgeD(t.V, st, t.theta - 90, R), class: 'rah-v-gap' }));
    } else {
      var s2 = align === 'B' ? t.a1 + t.theta - 90 : t.a1 + t.theta;
      layer.appendChild(S('path', { d: wedgeD(t.V, s2, 90 - t.theta, R), class: 'rah-v-over' }));
    }
  }
  function ghost(sc, t, align, withVerdict) {
    var g = checkerShape('rah-ghost');
    placeChecker(g, t.V[0], t.V[1], alignR(t, align || 'A'));
    sc.chk.appendChild(g);
    if (withVerdict !== false) drawVerdict(sc.wedge, t, align || 'A');
    return g;
  }

  function addChecker(sc, api, home, onSnap) {
    var st = { x: home[0], y: home[1], r: 0, snapped: -1, align: 'A' };
    var body = checkerShape('rah-drag');
    var handle = S(
      'g',
      { class: 'rah-rot' },
      S('circle', { r: 13 }),
      S('path', { d: 'M-6,2 A6.5,6.5 0 1,0 -2,-6', class: 'rah-rot-ar' }),
      S('path', { d: 'M-6,-9 L-1.5,-6.3 L-6,-2.5', class: 'rah-rot-ar' })
    );
    sc.chk.appendChild(body);
    sc.ui.appendChild(handle);
    var off = [0, 0];
    function draw() {
      placeChecker(body, st.x, st.y, st.r);
      var lp = rotS([M * 0.8, -M * 0.8], st.r);
      handle.setAttribute('transform', 'translate(' + n2(st.x + lp[0]) + ',' + n2(st.y + lp[1]) + ')');
      MQ.clear(sc.wedge);
      if (st.snapped >= 0) drawVerdict(sc.wedge, sc.targets[st.snapped], st.align);
    }
    function report(changed) {
      draw();
      if (changed) {
        var t = st.snapped >= 0 ? sc.targets[st.snapped] : null;
        sc.setVerdict(t);
        if (onSnap) onSnap(st.snapped, t);
      }
    }
    function snap() {
      var best = -1;
      var bd = SNAP;
      sc.targets.forEach(function (t, i) {
        var d = dist([st.x, st.y], t.V);
        if (d < bd) {
          bd = d;
          best = i;
        }
      });
      if (best >= 0) {
        var t = sc.targets[best];
        st.x = t.V[0];
        st.y = t.V[1];
        var rA = alignR(t, 'A');
        var rB = alignR(t, 'B');
        if (angDist(st.r, rA) <= angDist(st.r, rB)) {
          st.r = norm(rA);
          st.align = 'A';
        } else {
          st.r = norm(rB);
          st.align = 'B';
        }
      }
      var changed = best !== st.snapped;
      st.snapped = best;
      report(changed);
    }
    api.cleanup(
      MQ.ui.drag(sc.svg, body, {
        start: function (p) {
          off = [st.x - p.x, st.y - p.y];
        },
        move: function (p) {
          st.x = U.clamp(p.x + off[0], 4, sc.W - 4);
          st.y = U.clamp(p.y + off[1], 4, sc.H - 4);
          snap();
        },
        end: snap,
      })
    );
    api.cleanup(
      MQ.ui.drag(sc.svg, handle, {
        move: function (p) {
          st.r = norm(Math.atan2(-(p.y - st.y), p.x - st.x) / RAD - 45);
          snap();
        },
      })
    );
    draw();
    return {
      st: st,
      snapTo: function (i, align) {
        var t = sc.targets[i];
        st.x = t.V[0];
        st.y = t.V[1];
        st.align = align || 'A';
        st.r = norm(alignR(t, st.align));
        var changed = st.snapped !== i;
        st.snapped = i;
        report(changed);
      },
      hide: function () {
        body.style.display = 'none';
        handle.style.display = 'none';
        MQ.clear(sc.wedge);
        sc.setVerdict(null);
      },
      pulse: function () {
        body.classList.remove('rah-pulse');
        void body.getBoundingClientRect();
        body.classList.add('rah-pulse');
      },
    };
  }

  /** Orange arms + arc + vertex dot for an angle the child must judge. */
  function drawArms(layer, t, noArc) {
    var p1 = pt(t.V, t.a1, t.L1);
    var p2 = pt(t.V, t.a1 + t.theta, t.L2);
    var g = S('g', { class: 'rah-arms' });
    g.appendChild(S('line', { x1: n2(t.V[0]), y1: n2(t.V[1]), x2: n2(p1[0]), y2: n2(p1[1]), class: 'rah-arm' }));
    g.appendChild(S('line', { x1: n2(t.V[0]), y1: n2(t.V[1]), x2: n2(p2[0]), y2: n2(p2[1]), class: 'rah-arm' }));
    if (!noArc) g.appendChild(S('path', { d: arcD(t.V, t.a1, t.theta, 26), class: 'rah-arc' }));
    g.appendChild(S('circle', { cx: n2(t.V[0]), cy: n2(t.V[1]), r: 6, class: 'rah-vdot' }));
    layer.appendChild(g);
    return g;
  }

  /* ---------------- everyday pictures (vertex at 0,0; return geometry of the angle) ---------------- */
  var BOOK_COLS = [
    ['#3a86ff', '#2a66c9'],
    ['#2a9d55', '#1f7a42'],
    ['#e63946', '#b92b37'],
    ['#8e5bd6', '#6c42ad'],
  ];
  var PICS = {
    book: function (p) {
      var w = 210;
      var h = 150;
      var c = BOOK_COLS[p.col % BOOK_COLS.length];
      var g = S(
        'g',
        { transform: 'rotate(' + n2(-p.t) + ')' },
        S('rect', { x: 0, y: -h, width: w, height: h, fill: c[0], class: 'rah-ink' }),
        S('rect', { x: 0, y: -h, width: 24, height: h, fill: c[1] }),
        S('rect', { x: 56, y: -h + 32, width: 124, height: 18, rx: 5, fill: '#fff', opacity: 0.85 }),
        S('rect', { x: 74, y: -h + 60, width: 88, height: 10, rx: 5, fill: '#fff', opacity: 0.6 })
      );
      var box = bbox([[0, 0], [w, 0], [w, -h], [0, -h]].map(function (q) {
        return rotS(q, p.t);
      }));
      return { g: g, box: box, a1: p.t, theta: 90, L1: w * 0.8, L2: h * 0.8, name: 'the corner of a book', tilted: Math.abs(p.t) >= 5 };
    },
    frame: function (p) {
      var w = 190;
      var h = 140;
      var inner = S(
        'g',
        { transform: 'rotate(' + n2(-p.t) + ')' },
        S('rect', { x: 0, y: -h, width: w, height: h, fill: '#a0703f', class: 'rah-ink' }),
        S('rect', { x: 14, y: -h + 14, width: w - 28, height: h - 28, fill: '#cfe8ff' }),
        S('path', { d: 'M14,-14 V-52 Q60,-92 108,-62 T176,-72 V-14 Z', fill: '#69b36a' }),
        S('circle', { cx: 142, cy: -98, r: 13, fill: '#ffc93c' })
      );
      var c = rotS([w / 2, -h / 2], p.t);
      var tl = rotS([0, -h], p.t);
      var tr = rotS([w, -h], p.t);
      var nail = [c[0], Math.min(tl[1], tr[1]) - 48];
      var g = S(
        'g',
        null,
        S('polyline', { points: pts([tl, nail, tr]), class: 'rah-string' }),
        S('circle', { cx: n2(nail[0]), cy: n2(nail[1]), r: 5, fill: '#4a5a7d' }),
        inner
      );
      var box = bbox([[0, 0], tl, tr, rotS([w, 0], p.t), nail]);
      return { g: g, box: box, a1: p.t, theta: 90, L1: w * 0.75, L2: h * 0.75, name: 'the corner of a picture frame', tilted: true };
    },
    door: function () {
      var g = S(
        'g',
        null,
        S('rect', { x: -55, y: -35, width: 230, height: 270, fill: '#f1ece3' }),
        S('rect', { x: -12, y: -12, width: 144, height: 242, fill: '#d8c8ab' }),
        S('rect', { x: 0, y: 0, width: 120, height: 230, fill: '#b5835a', class: 'rah-ink' }),
        S('rect', { x: 16, y: 18, width: 88, height: 82, rx: 4, fill: '#a67650' }),
        S('rect', { x: 16, y: 120, width: 88, height: 94, rx: 4, fill: '#a67650' }),
        S('circle', { cx: 104, cy: 118, r: 6, fill: '#ffd166', stroke: '#9a6b00', 'stroke-width': 2 }),
        S('line', { x1: -55, y1: 232, x2: 175, y2: 232, stroke: '#8d7b62', 'stroke-width': 5 })
      );
      return { g: g, box: { x0: -55, y0: -35, x1: 175, y1: 235 }, a1: 270, theta: 90, L1: 150, L2: 90, name: 'the corner of a door', tilted: false };
    },
    clock: function (p) {
      var R = 125;
      var h = p.h;
      var g = S('g', null, S('circle', { cx: 0, cy: 0, r: R, fill: '#fff', stroke: '#4a5a7d', 'stroke-width': 6 }));
      for (var i = 0; i < 12; i++) {
        var a = 90 - 30 * i;
        var q1 = pt([0, 0], a, R * 0.86);
        var q2 = pt([0, 0], a, R * 0.95);
        g.appendChild(S('line', { x1: n2(q1[0]), y1: n2(q1[1]), x2: n2(q2[0]), y2: n2(q2[1]), stroke: '#4a5a7d', 'stroke-width': i % 3 ? 2 : 4 }));
      }
      [12, 3, 6, 9].forEach(function (num) {
        var q = pt([0, 0], 90 - 30 * (num % 12), R * 0.7);
        g.appendChild(S('text', { x: n2(q[0]), y: n2(q[1]) + 8, 'text-anchor': 'middle', class: 'rah-clocknum' }, String(num)));
      });
      var hourA = 90 - 30 * h;
      var hp = pt([0, 0], hourA, 70);
      var mp = pt([0, 0], 90, 105);
      g.appendChild(S('line', { x1: 0, y1: 0, x2: n2(hp[0]), y2: n2(hp[1]), stroke: '#1b2a4a', 'stroke-width': 10, 'stroke-linecap': 'round' }));
      g.appendChild(S('line', { x1: 0, y1: 0, x2: n2(mp[0]), y2: n2(mp[1]), stroke: '#1b2a4a', 'stroke-width': 6, 'stroke-linecap': 'round' }));
      var geo = h <= 6 ? { a1: norm(hourA), theta: 30 * h, L1: 70, L2: 105 } : { a1: 90, theta: 360 - 30 * h, L1: 105, L2: 70 };
      return { g: g, box: { x0: -R - 3, y0: -R - 3, x1: R + 3, y1: R + 3 }, a1: geo.a1, theta: geo.theta, L1: geo.L1, L2: geo.L2, name: "the clock hands at " + h + " o'clock", tilted: false };
    },
    pizza: function (p) {
      var R = 190;
      var a1 = p.mid - p.theta / 2;
      var O = [0, 0];
      var g = S(
        'g',
        null,
        S('path', { d: wedgeD(O, a1, p.theta, R), fill: '#f6c453', class: 'rah-ink' }),
        S('path', { d: arcD(O, a1, p.theta, R - 7), fill: 'none', stroke: '#c98a3d', 'stroke-width': 14, 'stroke-linecap': 'round' })
      );
      [[0.5, 0.5], [0.76, 0.3], [0.76, 0.7]].forEach(function (f) {
        var c = pt(O, a1 + p.theta * f[1], R * f[0]);
        g.appendChild(S('circle', { cx: n2(c[0]), cy: n2(c[1]), r: 12, fill: '#c0392b' }));
      });
      var box = bbox([O].concat(arcPts(O, a1, p.theta, R)));
      return { g: g, box: box, a1: a1, theta: p.theta, L1: R * 0.86, L2: R * 0.86, name: 'a slice of pizza', tilted: false };
    },
    scissors: function (p) {
      var O = [0, 0];
      var a1 = p.mid - p.theta / 2;
      var g = S('g');
      var list = [O];
      [[a1, '#e63946'], [a1 + p.theta, '#3a86ff']].forEach(function (b) {
        var back = b[0] + 180;
        var ring = pt(O, back, 82);
        g.appendChild(S('line', { x1: 0, y1: 0, x2: n2(pt(O, back, 58)[0]), y2: n2(pt(O, back, 58)[1]), stroke: b[1], 'stroke-width': 11, 'stroke-linecap': 'round' }));
        g.appendChild(S('circle', { cx: n2(ring[0]), cy: n2(ring[1]), r: 24, fill: 'none', stroke: b[1], 'stroke-width': 10 }));
        list.push(pt(O, back, 112), pt(O, b[0], 170));
      });
      [a1, a1 + p.theta].forEach(function (a) {
        g.appendChild(S('polygon', { points: pts([pt(O, a + 90, 9), pt(O, a, 170), pt(O, a - 90, 9)]), fill: '#c3ccd8', class: 'rah-ink' }));
      });
      g.appendChild(S('circle', { cx: 0, cy: 0, r: 8, fill: '#6b778a' }));
      var box = bbox(list);
      box.x0 -= 30; box.x1 += 30; box.y0 -= 30; box.y1 += 30;
      return { g: g, box: box, a1: a1, theta: p.theta, L1: 150, L2: 150, name: 'the blades of open scissors', tilted: false };
    },
    laptop: function (p) {
      var O = [0, 0];
      var d = p.theta;
      var s1 = pt(O, d, 170);
      var nrm = pt([0, 0], d + 90, 11);
      var g = S(
        'g',
        null,
        S('line', { x1: -40, y1: 16, x2: 270, y2: 16, stroke: '#c9b79c', 'stroke-width': 4 }),
        S('polygon', { points: pts([O, [220, 0], [220, 14], [0, 14]]), fill: '#9aa5b5', class: 'rah-ink' }),
        S('polygon', { points: pts([O, s1, [s1[0] + nrm[0], s1[1] + nrm[1]], nrm]), fill: '#5b6b82', class: 'rah-ink' }),
        S('circle', { cx: 0, cy: 7, r: 6, fill: '#4a5a7d' })
      );
      var box = bbox([[-40, 16], [270, 16], O, s1, [s1[0] + nrm[0], s1[1] + nrm[1]]]);
      return { g: g, box: box, a1: 0, theta: d, L1: 200, L2: 150, name: 'an open laptop', tilted: false };
    },
    fan: function (p) {
      var O = [0, 0];
      var a1 = p.mid - p.theta / 2;
      var R = 175;
      var r0 = 45;
      var n = 10;
      var g = S('g');
      for (var i = 0; i < n; i++) {
        var s = a1 + (p.theta * i) / n;
        var e = a1 + (p.theta * (i + 1)) / n;
        g.appendChild(S('polygon', { points: pts([pt(O, s, r0), pt(O, s, R), pt(O, e, R), pt(O, e, r0)]), fill: i % 2 ? '#ff8fa3' : '#ffc2cd' }));
      }
      for (var j = 0; j <= n; j++) {
        var b = pt(O, a1 + (p.theta * j) / n, R);
        g.appendChild(S('line', { x1: 0, y1: 0, x2: n2(b[0]), y2: n2(b[1]), stroke: '#8a5a2b', 'stroke-width': j === 0 || j === n ? 6 : 2.5 }));
      }
      g.appendChild(S('circle', { cx: 0, cy: 0, r: 8, fill: '#8a5a2b' }));
      var box = bbox([O].concat(arcPts(O, a1, p.theta, R)));
      return { g: g, box: box, a1: a1, theta: p.theta, L1: R, L2: R, name: 'an open fan', tilted: false };
    },
    roof: function (p) {
      var O = [0, 0];
      var th = p.theta;
      var hw = th < 90 ? 95 : 150;
      var s = hw / Math.sin((th / 2) * RAD);
      var rh = s * Math.cos((th / 2) * RAD);
      var a1 = 270 - th / 2;
      var eL = pt(O, a1, s);
      var eR = pt(O, a1 + th, s);
      var bw = 2 * hw - 44;
      var g = S(
        'g',
        null,
        S('rect', { x: n2(-hw + 22), y: n2(rh), width: n2(bw), height: 105, fill: '#f4e1c1', class: 'rah-ink' }),
        S('rect', { x: -18, y: n2(rh + 45), width: 36, height: 60, fill: '#8d5a3b' }),
        S('rect', { x: n2(-hw + 36), y: n2(rh + 22), width: 34, height: 30, fill: '#bfe3ff', class: 'rah-ink' }),
        S('rect', { x: n2(hw - 70), y: n2(rh + 22), width: 34, height: 30, fill: '#bfe3ff', class: 'rah-ink' }),
        S('polygon', { points: pts([O, eR, eL]), fill: '#c0504d', class: 'rah-ink' })
      );
      var box = bbox([O, eL, eR, [-hw, rh + 105], [hw, rh + 105]]);
      return { g: g, box: box, a1: a1, theta: th, L1: s * 0.9, L2: s * 0.9, name: 'the top of a roof', tilted: false };
    },
  };

  function fitPicture(sc, pic, region) {
    var b = pic.box;
    var k = Math.round(Math.min(1.1, region.w / (b.x1 - b.x0), region.h / (b.y1 - b.y0)) * 1000) / 1000;
    var tx = n2(region.x + region.w / 2 - (k * (b.x0 + b.x1)) / 2);
    var ty = n2(region.y + region.h / 2 - (k * (b.y0 + b.y1)) / 2);
    sc.art.appendChild(S('g', { transform: 'translate(' + tx + ',' + ty + ') scale(' + k + ')' }, pic.g));
    return { V: [tx, ty], a1: pic.a1, theta: pic.theta, L1: pic.L1 * k, L2: pic.L2 * k };
  }

  /** Place a plain line angle (V at origin) centred in a region. */
  function fitAngle(it, region) {
    var O = [0, 0];
    var list = [O, pt(O, it.a1, it.L1), pt(O, it.a1 + it.theta, it.L2)].concat(arcPts(O, it.a1, it.theta, 26));
    var b = bbox(list);
    var k = Math.min(1, region.w / (b.x1 - b.x0), region.h / (b.y1 - b.y0));
    var V = [n2(region.x + region.w / 2 - (k * (b.x0 + b.x1)) / 2), n2(region.y + region.h / 2 - (k * (b.y0 + b.y1)) / 2)];
    return { V: V, a1: it.a1, theta: it.theta, L1: it.L1 * k, L2: it.L2 * k };
  }

  /* ---------------- shapes (defined with y up) ---------------- */
  function regular(n, R, start) {
    return U.range(0, n - 1).map(function (i) {
      var a = (start + (360 * i) / n) * RAD;
      return [R * Math.cos(a), R * Math.sin(a)];
    });
  }
  function star(R) {
    return U.range(0, 9).map(function (i) {
      var r = i % 2 ? R * 0.382 : R;
      var a = (90 + 36 * i) * RAD;
      return [r * Math.cos(a), r * Math.sin(a)];
    });
  }
  var SHAPES = {
    square: { pts: [[0, 0], [180, 0], [180, 180], [0, 180]], name: 'square' },
    rectangle: { pts: [[0, 0], [260, 0], [260, 150], [0, 150]], name: 'rectangle' },
    rightTri: { pts: [[0, 0], [230, 0], [0, 160]], name: 'right-angled triangle' },
    equiTri: { pts: regular(3, 150, 90), name: 'triangle' },
    pentagon: { pts: regular(5, 140, 90), name: 'pentagon' },
    hexagon2: { pts: [[0, 0], [220, 0], [220, 90], [160, 170], [40, 170], [0, 110]], name: 'hexagon' },
    cutTop: { pts: [[0, 0], [220, 0], [220, 120], [170, 170], [50, 170], [0, 120]], name: 'shape with two cut corners' },
    arrow: { pts: [[90, 0], [150, 0], [150, 120], [210, 120], [120, 260], [30, 120], [90, 120]], name: 'arrow' },
    rightTrap: { pts: [[0, 0], [240, 0], [170, 140], [0, 140]], name: 'trapezium' },
    star: { pts: star(140), name: 'star' },
    circle: { pts: null, name: 'circle' },
    Lshape: { pts: [[0, 0], [200, 0], [200, 80], [80, 80], [80, 230], [0, 230]], name: 'L-shape' },
    houseTall: { pts: [[0, 0], [200, 0], [200, 130], [100, 272.82], [0, 130]], name: 'house shape' },
    houseFlat: { pts: [[0, 0], [200, 0], [200, 130], [100, 200.02], [0, 130]], name: 'house shape' },
    cutCorner: { pts: [[0, 0], [200, 0], [200, 130], [130, 200], [0, 200]], name: 'square with a cut corner' },
    isoTrap: { pts: [[0, 0], [260, 0], [195, 130], [65, 130]], name: 'trapezium' },
    para: { pts: [[0, 0], [220, 0], [290, 130], [70, 130]], name: 'parallelogram' },
  };

  function buildPoly(def, tilt, mirror, region, maxK) {
    var c = Math.cos(tilt * RAD);
    var s = Math.sin(tilt * RAD);
    var p = def.map(function (q) {
      var x = mirror ? -q[0] : q[0];
      var y = q[1];
      return [x * c - y * s, -(x * s + y * c)];
    });
    var b = bbox(p);
    var k = Math.min(maxK || 1.1, region.w / (b.x1 - b.x0), region.h / (b.y1 - b.y0));
    var cx = region.x + region.w / 2;
    var cy = region.y + region.h / 2;
    var mx = (b.x0 + b.x1) / 2;
    var my = (b.y0 + b.y1) / 2;
    return p.map(function (q) {
      return [n2(cx + (q[0] - mx) * k), n2(cy + (q[1] - my) * k)];
    });
  }
  function tiltedNum(t) {
    return Math.abs(t % 90) > 0.1;
  }

  /* ---------------- shared bits ---------------- */
  var ICONS = {
    right: '<svg class="rah-ico" viewBox="0 0 40 32"><path d="M7,27 H37 M7,27 V3" /><path d="M7,19 H15 V27" class="rah-ico-sq"/></svg>',
    greater: '<svg class="rah-ico" viewBox="0 0 40 32"><path d="M15,27 H39 M15,27 L1,7" /></svg>',
    less: '<svg class="rah-ico" viewBox="0 0 40 32"><path d="M5,27 H37 M5,27 L29,5" /></svg>',
  };
  var WORDS = { right: 'Right angle', greater: 'Greater than a right angle', less: 'Less than a right angle' };
  var SHORT = { right: 'Right', greater: 'Greater', less: 'Less' };

  function sortChoices(onPick) {
    var ch = MQ.ui.choices(
      ['right', 'greater', 'less'].map(function (k) {
        return { label: ICONS[k] + '<span>' + WORDS[k] + '</span>', value: k };
      }),
      onPick,
      { columns: 3 }
    );
    ch.classList.add('rah-choices');
    return ch;
  }
  function meaning(c) {
    if (c === 'right') return 'The checker fits exactly, so it is a right angle.';
    if (c === 'greater') return 'There is a gap next to the checker, so it is greater than a right angle.';
    return 'The checker sticks out past the line, so it is less than a right angle.';
  }
  var USE_CHECKER = 'Drag the checker so its corner sits on the orange dot. Fits exactly = right angle. A gap = greater. Sticks out = less.';

  /** Hint + mistake tag for a wrong sort answer. info: {cat, tilted, L1, L2} */
  function sortHint(info, chosen, second) {
    var c = info.cat;
    var avg = (info.L1 + info.L2) / 2;
    var tag;
    var hint;
    if (c === 'right') {
      tag = info.tilted ? TAG.tilt : TAG.missR;
      hint = info.tilted ? 'It is tilted, but look closely. Could it be a square corner? Try the checker.' : 'Look at the corner. Is it a square corner, like the corner of this page?';
    } else if (chosen === 'right') {
      tag = TAG.notR;
      hint = 'Is it exactly square? Put the checker on it and look for a gap, or for paper sticking out.';
    } else if (c === 'less' && avg >= 115) {
      tag = TAG.len;
      hint = 'The lines are long, but long lines do not make a big angle. Look at how much it turns.';
    } else if (c === 'greater' && avg <= 80) {
      tag = TAG.len;
      hint = 'The lines are short, but short lines do not make a small angle. Look how wide it opens.';
    } else {
      tag = TAG.gl;
      hint = c === 'greater' ? 'Look again. Does it open wider than a square corner, or less wide?' : 'Look again. Is it narrower than a square corner, or wider?';
    }
    return [second ? USE_CHECKER : hint, tag];
  }

  /* ================= LEARN SCREENS ================= */

  // 1. Fold paper twice to make the checker.
  function learnFold(stage, api) {
    api.say('Let us make a right-angle checker. Fold a sheet of paper in half, then in half again.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Make a right-angle checker', 'Fold the paper in half, then in half again.'));
    var x0 = 150;
    var y0 = 36;
    var w = 260;
    var h = 200;
    var svg = S('svg', { viewBox: '0 0 560 280', class: 'rah-svg', style: { width: '560px' } });
    var g = S('g');
    svg.appendChild(g);
    stage.appendChild(svg);
    function paper(x, y, ww, hh, cls) {
      return S('rect', { x: x, y: y, width: ww, height: hh, class: 'rah-paper' + (cls ? ' ' + cls : '') });
    }
    function flip(node, origin, how) {
      node.style.transformBox = 'view-box';
      node.style.transformOrigin = origin;
      node.style.transition = 'transform .7s ease-in-out';
      api.later(function () {
        node.style.transform = how;
      }, 40);
    }
    g.appendChild(paper(x0, y0, w / 2, h));
    var right = paper(x0 + w / 2, y0, w / 2, h);
    g.appendChild(right);
    g.appendChild(S('line', { x1: x0 + w / 2, y1: y0, x2: x0 + w / 2, y2: y0 + h, class: 'rah-foldline' }));
    var step = 0;
    var btn = el('button', { class: 'btn', type: 'button' }, 'Fold in half');
    stage.appendChild(btn);
    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      btn.disabled = true;
      api.sound('pop');
      if (step === 0) {
        flip(right, x0 + w / 2 + 'px 0px', 'scaleX(-1)');
        api.later(function () {
          MQ.clear(g);
          g.appendChild(paper(x0 + 4, y0 + 4, w / 2, h, 'rah-paper-back'));
          g.appendChild(paper(x0, y0 + h / 2, w / 2, h / 2));
          var top = paper(x0, y0, w / 2, h / 2);
          g.appendChild(top);
          g.appendChild(S('line', { x1: x0, y1: y0 + h / 2, x2: x0 + w / 2, y2: y0 + h / 2, class: 'rah-foldline' }));
          g.appendChild(S('line', { x1: x0 + w / 2, y1: y0, x2: x0 + w / 2, y2: y0 + h, class: 'rah-fold-edge' }));
          right = top;
          step = 1;
          btn.textContent = 'Fold again';
          btn.disabled = false;
          api.say('Now fold it in half again, top to bottom.');
        }, 850);
      } else if (step === 1) {
        flip(right, '0px ' + (y0 + h / 2) + 'px', 'scaleY(-1)');
        api.later(function () {
          MQ.clear(g);
          var C = [x0 + w / 2, y0 + h / 2];
          g.appendChild(paper(x0 + 6, y0 + h / 2 + 6, w / 2, h / 2, 'rah-paper-back'));
          g.appendChild(paper(x0 + 3, y0 + h / 2 + 3, w / 2, h / 2, 'rah-paper-back'));
          g.appendChild(paper(x0, y0 + h / 2, w / 2, h / 2));
          g.appendChild(S('path', { d: 'M' + x0 + ',' + C[1] + ' H' + C[0] + ' V' + (y0 + h), class: 'rah-fold-edge' }));
          g.appendChild(S('path', { d: squareD(C, 180, 24), class: 'rah-v-right' }));
          g.appendChild(S('circle', { cx: C[0], cy: C[1], r: 7, class: 'rah-vdot' }));
          g.appendChild(S('path', { d: 'M' + (C[0] + 96) + ',' + (C[1] - 34) + ' Q' + (C[0] + 40) + ',' + (C[1] - 44) + ' ' + (C[0] + 12) + ',' + (C[1] - 8), class: 'rah-pointer' }));
          g.appendChild(S('text', { x: C[0] + 100, y: C[1] - 40, class: 'rah-note' }, 'a right angle!'));
          g.appendChild(S('text', { x: C[0] + 100, y: C[1] - 16, class: 'rah-note-small' }, 'the two folds meet here'));
          step = 2;
          btn.textContent = 'Done ✓';
          api.say('The two folds meet in a perfect square corner. That is a right angle: a quarter turn!', 'cheer');
          api.feedback('This square corner is your right-angle checker.', 'good');
          api.unlockNext();
        }, 850);
      }
    });
  }

  // Three-panel layout used by learn 2 and the A/B/C sorting question.
  var PANEL_W = 200;
  function panelRegion(i, H) {
    return { x: 18 + PANEL_W * i, y: 40, w: PANEL_W - 26, h: H - 52 };
  }
  function panelLabels(sc, H, letters) {
    for (var i = 0; i < 3; i++) {
      sc.art.appendChild(S('rect', { x: 10 + PANEL_W * i, y: 6, width: PANEL_W - 10, height: H - 12, rx: 12, class: 'rah-panel' }));
      if (letters) sc.art.appendChild(S('text', { x: 10 + PANEL_W * i + (PANEL_W - 10) / 2, y: 30, 'text-anchor': 'middle', class: 'rah-letter' }, letters[i]));
    }
  }

  // 2. Check three everyday corners with the checker.
  function learnCheck(stage, api) {
    api.say('Drag the checker onto each orange corner. Does it fit exactly?');
    api.lockNext();
    stage.appendChild(MQ.ui.prompt('Drag the <b>checker</b> onto each orange corner.'));
    var H = 300;
    var sc = makeScene(740, H);
    panelLabels(sc, H, null);
    var home = addTray(sc, 606, 40, 128, 250);
    var pics = [PICS.book({ t: 12, col: 0 }), PICS.laptop({ theta: 125 }), PICS.scissors({ theta: 45, mid: 15 })];
    pics.forEach(function (pic, i) {
      var reg = panelRegion(i, H);
      reg.y = 16;
      reg.h = H - 30;
      var t = fitPicture(sc, pic, reg);
      sc.targets.push(t);
      drawArms(sc.top, t);
    });
    var wrap = el('div', { class: 'rah-wide' }, sc.svg);
    var caps = el('div', { class: 'rah-caps' });
    var capEls = ['book', 'laptop', 'scissors'].map(function (n) {
      var c = el('div', { class: 'rah-cap' }, n + ': ?');
      caps.appendChild(c);
      return c;
    });
    caps.appendChild(el('div'));
    wrap.appendChild(caps);
    stage.appendChild(wrap);
    var done = {};
    var names = ['book', 'laptop', 'scissors'];
    var SAY = {
      right: 'It fits exactly. A right angle!',
      greater: 'There is a gap. Greater than a right angle!',
      less: 'The checker sticks out. Less than a right angle!',
    };
    addChecker(sc, api, home, function (i, t) {
      if (i < 0) return;
      var c = catOf(t.theta);
      capEls[i].textContent = names[i] + ': ' + WORDS[c].toLowerCase();
      capEls[i].className = 'rah-cap rah-cap-' + c;
      api.say(SAY[c], 'happy');
      done[i] = true;
      if (Object.keys(done).length === 3) {
        api.feedback('Fits exactly = right angle. Gap = greater. Sticks out = less.', 'good');
        api.unlockNext();
      }
    });
  }

  function cornerDots(sc, cs, onClick) {
    return cs.map(function (c, i) {
      var g = S('g', { class: 'rah-dot', 'data-i': i }, S('circle', { cx: c.V[0], cy: c.V[1], r: 19, class: 'rah-dot-hit' }), S('circle', { cx: c.V[0], cy: c.V[1], r: 15, class: 'rah-dot-ring' }), S('circle', { cx: c.V[0], cy: c.V[1], r: 7, class: 'rah-dot-c' }));
      g.addEventListener('click', function () {
        onClick(i, g);
      });
      sc.dots.appendChild(g);
      return g;
    });
  }
  function labelAt(layer, c, text, cls) {
    var r = c.theta < 50 ? 44 : 32;
    var p = pt(c.V, c.a1 + c.theta / 2, r);
    layer.appendChild(S('text', { x: n2(p[0]), y: n2(p[1]) + 6, 'text-anchor': 'middle', class: cls || 'rah-num' }, text));
  }
  function markRight(layer, c, num) {
    layer.appendChild(S('path', { d: squareD(c.V, c.a1, 17), class: 'rah-sq' }));
    if (num) labelAt(layer, c, String(num));
  }
  function markOther(layer, c, num) {
    layer.appendChild(S('path', { d: arcD(c.V, c.a1, c.theta, 20), class: 'rah-arc-bad' }));
    if (num) labelAt(layer, c, String(num), 'rah-num rah-num-bad');
  }
  function drawPolygon(sc, poly) {
    sc.art.appendChild(S('polygon', { points: pts(poly), class: 'rah-shape' }));
    sc.top.appendChild(S('polygon', { points: pts(poly), class: 'rah-shape-line' }));
  }

  // 3. Right angles inside shapes: rectangle (4), then a right-angled triangle (1).
  function learnShapes(stage, api) {
    api.say('A rectangle has square corners. Click each corner to mark its right angle.');
    api.lockNext();
    var prompt = MQ.ui.prompt('Click every <b>right angle</b> in the rectangle.');
    stage.appendChild(prompt);
    var sc = makeScene(600, 300);
    stage.appendChild(sc.svg);
    var region = { x: 30, y: 25, w: 540, h: 250 };
    function phase(def, onDone) {
      MQ.clear(sc.art);
      MQ.clear(sc.marks);
      MQ.clear(sc.top);
      MQ.clear(sc.dots);
      var poly = buildPoly(def, 0, false, region, 1);
      drawPolygon(sc, poly);
      var cs = corners(poly);
      var found = 0;
      var need = cs.filter(function (c) {
        return isRight(c.theta);
      }).length;
      var used = {};
      cornerDots(sc, cs, function (i, g) {
        if (used[i]) return;
        var c = cs[i];
        if (isRight(c.theta)) {
          used[i] = true;
          found++;
          g.classList.add('rah-dot-on');
          markRight(sc.marks, c, need > 1 ? found : 0);
          api.sound('pop');
          if (found === need) onDone();
        } else {
          markOther(sc.marks, c);
          api.sound('wrong');
          api.feedback('That corner is pointy: less than a right angle. Find the square corner.', 'try');
        }
      });
    }
    phase(SHAPES.rectangle.pts, function () {
      api.say('4 right angles! Every corner of a rectangle is a right angle.', 'cheer');
      api.feedback('A rectangle has 4 right angles.', 'good');
      api.later(function () {
        prompt.innerHTML = 'Now find the <b>right angle</b> in this triangle.';
        api.say('This triangle has only one right angle. Can you find it?', 'think');
        api.feedback('', 'info');
        phase(SHAPES.rightTri.pts, function () {
          api.say('Yes! A right-angled triangle has 1 right angle. The other two are smaller.', 'cheer');
          api.feedback('A right-angled triangle has 1 right angle.', 'good');
          api.unlockNext();
        });
      }, 1600);
    });
  }

  // 4. Turning does not change angles; the inward corner of an L is not a right angle.
  function learnTricky(stage, api) {
    api.say('If we turn a square, are its corners still right angles? Press Turn it.');
    api.lockNext();
    var prompt = MQ.ui.prompt('Turn the square. Watch the corners.');
    stage.appendChild(prompt);
    var sc = makeScene(600, 300);
    stage.appendChild(sc.svg);
    var poly = buildPoly(SHAPES.square.pts, 0, false, { x: 200, y: 50, w: 200, h: 200 }, 1);
    var cs = corners(poly);
    var sq = S('g', { class: 'rah-turnable' }, S('polygon', { points: pts(poly), class: 'rah-shape' }), S('polygon', { points: pts(poly), class: 'rah-shape-line' }));
    cs.forEach(function (c) {
      sq.appendChild(S('path', { d: squareD(c.V, c.a1, 17), class: 'rah-sq' }));
    });
    sq.style.transformBox = 'view-box';
    sq.style.transformOrigin = '300px 150px';
    sc.art.appendChild(sq);
    var turns = 0;
    var btn = el('button', { class: 'btn', type: 'button' }, 'Turn it ↺');
    stage.appendChild(btn);
    btn.addEventListener('click', function () {
      if (turns >= 3) return;
      turns++;
      api.sound('click');
      sq.style.transform = 'rotate(' + -15 * turns + 'deg)';
      if (turns === 3) {
        btn.disabled = true;
        api.say('Still 4 right angles! Turning a shape does not change its angles.', 'cheer');
        api.later(showL, 1700);
      }
    });
    function showL() {
      btn.style.display = 'none';
      MQ.clear(sc.art);
      prompt.innerHTML = 'An L-shape has one corner that points <b>in</b>. Click it.';
      api.say('Careful! One corner of this L points inwards. Click that corner.', 'think');
      var L = buildPoly(SHAPES.Lshape.pts, 0, false, { x: 160, y: 25, w: 280, h: 250 }, 1);
      drawPolygon(sc, L);
      var lc = corners(L);
      var over = false;
      cornerDots(sc, lc, function (i) {
        if (over) return;
        if (lc[i].theta > 180) {
          over = true;
          var n = 0;
          lc.forEach(function (c) {
            if (isRight(c.theta)) markRight(sc.marks, c, ++n);
            else markOther(sc.marks, c);
          });
          api.sound('correct');
          api.say('Inside the shape, that corner is bigger than a right angle. So an L has 5 right angles, not 6.', 'cheer');
          api.feedback('6 corners, but only 5 right angles. The inward corner is greater than a right angle.', 'good');
          api.unlockNext();
        } else {
          api.feedback('That one is a square corner. Find the corner that points into the shape.', 'try');
        }
      });
    }
  }

  /* ================= PRACTICE ================= */
  function levelOf(i, count) {
    return i < count / 3 ? 1 : i < (2 * count) / 3 ? 2 : 3;
  }
  var PIC_KINDS = {
    right: ['book', 'door', 'frame', 'clock3', 'clock9'],
    greater: ['laptop', 'fan', 'roofFlat', 'clock4', 'clock5'],
    less: ['pizza', 'scissors', 'roofSteep', 'clock1', 'clock2'],
  };
  function sign() {
    return Math.random() < 0.5 ? -1 : 1;
  }
  function picParams(kind) {
    if (kind === 'book') return { fn: 'book', p: { t: sign() * U.rand(8, 24), col: U.rand(0, 3) } };
    if (kind === 'frame') return { fn: 'frame', p: { t: sign() * U.rand(10, 22) } };
    if (kind === 'door') return { fn: 'door', p: {} };
    if (kind.indexOf('clock') === 0) return { fn: 'clock', p: { h: parseInt(kind.slice(5), 10) } };
    if (kind === 'laptop') return { fn: 'laptop', p: { theta: U.rand(115, 135) } };
    if (kind === 'fan') return { fn: 'fan', p: { theta: U.rand(120, 150), mid: 90 + U.rand(-15, 15) } };
    if (kind === 'roofFlat') return { fn: 'roof', p: { theta: U.rand(115, 130) } };
    if (kind === 'roofSteep') return { fn: 'roof', p: { theta: U.rand(50, 65) } };
    if (kind === 'pizza') return { fn: 'pizza', p: { theta: U.rand(40, 60), mid: U.rand(0, 359) } };
    return { fn: 'scissors', p: { theta: U.rand(40, 55), mid: U.rand(0, 359) } };
  }
  function family(kind) {
    return kind.replace(/[0-9]+$/, '').replace(/Flat|Steep/, '');
  }

  function buildDeck(count) {
    var idx = { 1: [], 2: [], 3: [] };
    for (var i = 0; i < count; i++) idx[levelOf(i, count)].push(i);
    var deck = new Array(count);
    var usedFam = {};

    // Level 1: everyday pictures, at least one of each kind of angle.
    var cats = U.shuffle(['right', 'greater', 'less']);
    while (cats.length < idx[1].length) cats.push(U.pick(['right', 'greater', 'less']));
    idx[1].forEach(function (di, j) {
      var c = cats[j];
      var cands = PIC_KINDS[c].filter(function (k) {
        return !usedFam[family(k)];
      });
      if (!cands.length) cands = PIC_KINDS[c];
      var kind = U.pick(cands);
      usedFam[family(kind)] = true;
      var pp = picParams(kind);
      deck[di] = { type: 'pic', kind: kind, fn: pp.fn, p: pp.p, cat: c };
    });

    // Level 2: A/B/C line angles, a marked corner of a tilted shape, a straight line.
    var tKinds = U.shuffle(['square45', 'para', 'isoTrap', 'rightTri']);
    var types2 = ['tri', 'tshape', 'line'];
    idx[2].forEach(function (di, j) {
      var ty = types2[j % 3];
      if (ty === 'tri') {
        var items = U.shuffle([
          { cat: 'right', theta: 90, a1: U.rand(15, 75) + 90 * U.rand(0, 3), L: U.shuffle([U.rand(65, 90), U.rand(120, 150)]) },
          { cat: 'greater', theta: U.rand(115, 150), a1: U.rand(0, 359), L: [U.rand(48, 62), U.rand(48, 62)] },
          { cat: 'less', theta: U.rand(40, 65), a1: U.rand(0, 359), L: [U.rand(135, 160), U.rand(135, 160)] },
        ]).map(function (it) {
          return { cat: it.cat, theta: it.theta, a1: it.a1, L1: it.L[0], L2: it.L[1], tilted: true };
        });
        deck[di] = { type: 'tri', items: items };
      } else if (ty === 'tshape') {
        var k = tKinds[Math.floor(j / 3) % tKinds.length];
        deck[di] = { type: 'tshape', kind: k, tilt: k === 'square45' ? 45 : sign() * U.rand(15, 30), pick: Math.random() };
      } else {
        deck[di] = { type: 'line', a1: U.rand(-30, 30), L1: U.rand(110, 200), L2: U.rand(110, 200) };
      }
    });

    // Level 3: count right angles, the L-shape, and "ring the angles that are NOT right angles".
    var countPool = U.shuffle(Math.random() < 0.3 ? ['equiTri', 'pentagon', 'star', 'circle'] : ['rectangle', 'square45', 'rightTri', 'hexagon2', 'cutTop', 'arrow', 'rightTrap']);
    var usedTK = deck
      .filter(function (d) {
        return d && d.type === 'tshape';
      })
      .map(function (d) {
        return d.kind === 'square45' ? 'square45' : d.kind;
      });
    countPool = countPool.filter(function (k) {
      return usedTK.indexOf(k) === -1;
    });
    var notPool = U.shuffle(['house', 'cutCorner', 'isoTrap', 'para']).filter(function (k) {
      return usedTK.indexOf(k) === -1;
    });
    var types3 = ['count', 'lshape', 'not'];
    idx[3].forEach(function (di, j) {
      var ty = types3[j % 3];
      var rep = Math.floor(j / 3);
      if (ty === 'count') {
        var kind = countPool[rep % countPool.length];
        var tilt = 0;
        if (kind === 'square45') tilt = 45;
        else if (kind === 'rectangle') tilt = Math.random() < 0.5 ? 0 : sign() * U.rand(15, 35);
        else if (kind === 'rightTri') tilt = U.rand(15, 40) + 90 * U.rand(0, 3);
        else if (kind === 'hexagon2' || kind === 'rightTrap') tilt = 90 * U.rand(0, 3);
        else if (kind === 'arrow') tilt = U.pick([0, 90, 180, 270]);
        deck[di] = { type: 'shape', mode: 'count', kind: kind, tilt: tilt, mirror: Math.random() < 0.5 };
      } else if (ty === 'lshape') {
        deck[di] = { type: 'shape', mode: 'count', kind: 'Lshape', tilt: 90 * U.rand(0, 3), mirror: Math.random() < 0.5 };
      } else {
        var nk = notPool[rep % notPool.length];
        if (nk === 'house') nk = U.pick(['houseTall', 'houseFlat']);
        deck[di] = { type: 'shape', mode: 'not', kind: nk, tilt: nk === 'para' || nk === 'isoTrap' ? sign() * U.rand(0, 15) : 0, mirror: false };
      }
    });
    return deck;
  }

  var SCN = { W: 680, H: 340, region: { x: 15, y: 12, w: 505, h: 316 } };
  function standardScene() {
    var sc = makeScene(SCN.W, SCN.H);
    var home = addTray(sc, 540, 70, 130, 250);
    return { sc: sc, home: home };
  }

  /** One angle to sort with the three big buttons. */
  function singleSort(stage, api, sc, home, info) {
    var t = sc.targets[0];
    sc.svg.setAttribute('data-answer', info.cat);
    var chk = addChecker(sc, api, home, null);
    var ch = sortChoices(function (v) {
      if (api.isAnswered()) return;
      if (v === info.cat) {
        ch.mark(v, 'good');
        ch.disable();
        if (chk.st.snapped < 0) chk.snapTo(0, 'A');
        api.check(true, 'Yes! ' + meaning(info.cat));
      } else {
        ch.mark(v, 'bad');
        var second = api.tries() >= 1;
        var h = sortHint(info, v, second);
        if (second) chk.pulse();
        api.check(false, h[0], h[1]);
      }
    });
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.buttons.forEach(function (b) {
        b.classList.remove('bad');
      });
      ch.mark(info.cat, 'good');
      ch.disable();
      chk.snapTo(0, 'A');
      api.feedback(meaning(info.cat) + (info.cat === 'right' && info.tilted ? ' Tilted corners can still be right angles.' : ''), 'info');
    });
    return t;
  }

  function renderPic(stage, api, q) {
    var pic = PICS[q.fn](q.p);
    api.say(api.index === 0 ? 'Is the orange angle a right angle, greater or less? Use the checker!' : 'Look at ' + pic.name + '. What kind of angle is it?', 'think');
    stage.appendChild(MQ.ui.prompt('Look at <b>' + pic.name + '</b>. What kind of angle is it?'));
    var s = standardScene();
    var t = fitPicture(s.sc, pic, SCN.region);
    s.sc.targets.push(t);
    drawArms(s.sc.top, t);
    stage.appendChild(s.sc.svg);
    singleSort(stage, api, s.sc, s.home, { cat: catOf(t.theta), tilted: pic.tilted, L1: t.L1, L2: t.L2 });
  }

  function renderTShape(stage, api, q) {
    var def = q.kind === 'square45' ? SHAPES.square : SHAPES[q.kind];
    var s = standardScene();
    var poly = buildPoly(def.pts, q.tilt, false, SCN.region, 1.1);
    drawPolygon(s.sc, poly);
    var cs = corners(poly);
    // choose the marked corner: for shapes with mixed corners, q.pick decides which sort
    var rightOnes = cs.filter(function (c) { return isRight(c.theta); });
    var others = cs.filter(function (c) { return !isRight(c.theta); });
    var pool = !others.length ? rightOnes : !rightOnes.length ? (q.pick < 0.5 ? others.filter(function (c) { return c.theta < 90; }) : others.filter(function (c) { return c.theta > 90; })) : q.pick < 0.5 ? rightOnes : others;
    var c = pool[Math.floor(q.pick * 1000) % pool.length];
    var t = { V: c.V, a1: c.a1, theta: c.theta, L1: Math.min(c.L1, 95), L2: Math.min(c.L2, 95) };
    s.sc.targets.push(t);
    drawArms(s.sc.top, t);
    api.say('This ' + def.name + ' is tilted. What kind of angle is the orange corner?', 'think');
    stage.appendChild(MQ.ui.prompt('The <b>' + def.name + '</b> is tilted. What is the orange angle?'));
    stage.appendChild(s.sc.svg);
    singleSort(stage, api, s.sc, s.home, { cat: catOf(t.theta), tilted: true, L1: 95, L2: 95 });
  }

  function renderTri(stage, api, q) {
    api.say('Sort all three angles. Careful: long lines do not mean a big angle!', 'think');
    stage.appendChild(MQ.ui.prompt('Is each angle a <b>right angle</b>, <b>greater</b> or <b>less</b>?'));
    var H = 300;
    var sc = makeScene(740, H);
    var letters = ['A', 'B', 'C'];
    panelLabels(sc, H, letters);
    var home = addTray(sc, 606, 40, 128, 250);
    q.items.forEach(function (it, i) {
      var t = fitAngle(it, panelRegion(i, H));
      sc.targets.push(t);
      drawArms(sc.top, t);
    });
    sc.svg.setAttribute(
      'data-answer',
      q.items
        .map(function (it) {
          return it.cat;
        })
        .join(',')
    );
    var chk = addChecker(sc, api, home, null);
    var answers = [null, null, null];
    var cols = [];
    var grid = el('div', { class: 'rah-caps rah-tri-grid' });
    q.items.forEach(function (it, i) {
      var btns = {};
      var row = el('div', { class: 'rah-mini-row' });
      ['right', 'greater', 'less'].forEach(function (k) {
        var b = el('button', { class: 'rah-mini', type: 'button', 'data-v': k, html: ICONS[k] + '<span>' + SHORT[k] + '</span>' });
        b.addEventListener('click', function () {
          if (api.isAnswered()) return;
          answers[i] = k;
          col.classList.remove('rah-col-bad');
          Object.keys(btns).forEach(function (kk) {
            btns[kk].classList.toggle('on', kk === k);
          });
          api.sound('click');
        });
        btns[k] = b;
        row.appendChild(b);
      });
      var col = el('div', { class: 'rah-col', 'data-i': i }, el('div', { class: 'rah-col-lab' }, letters[i]), row);
      col.btns = btns;
      cols.push(col);
      grid.appendChild(col);
    });
    var checkBtn = el('button', { class: 'btn btn-check rah-tri-check', type: 'button' }, 'Check');
    grid.appendChild(el('div', { class: 'rah-col rah-col-check' }, checkBtn));
    stage.appendChild(el('div', { class: 'rah-wide' }, sc.svg, grid));

    function showAll() {
      chk.hide();
      sc.targets.forEach(function (t) {
        ghost(sc, t, 'A');
      });
    }
    function lockAll() {
      cols.forEach(function (col) {
        Object.keys(col.btns).forEach(function (k) {
          col.btns[k].disabled = true;
        });
      });
      checkBtn.disabled = true;
    }
    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      if (answers.indexOf(null) !== -1) {
        api.feedback('Choose an answer for A, B and C first.', 'info');
        return;
      }
      var wrong = [];
      q.items.forEach(function (it, i) {
        var ok = answers[i] === it.cat;
        cols[i].classList.toggle('rah-col-good', ok);
        cols[i].classList.toggle('rah-col-bad', !ok);
        if (!ok) wrong.push(i);
      });
      if (!wrong.length) {
        lockAll();
        showAll();
        api.check(true, 'Yes! Line length does not matter. Only the amount of turn counts.');
        return;
      }
      var w = wrong[0];
      var it = q.items[w];
      var L = letters[w];
      var chosen = answers[w];
      var hint;
      var tag;
      if (it.cat === 'right') {
        hint = 'Look at angle ' + L + ' again. It is tilted, but is it a square corner?';
        tag = TAG.tilt;
      } else if (chosen === 'right') {
        hint = 'Angle ' + L + ' is not exactly square. Try the checker on it.';
        tag = TAG.notR;
      } else if (it.cat === 'greater') {
        hint = 'Angle ' + L + ' has short lines, but look how wide it opens.';
        tag = TAG.len;
      } else {
        hint = 'Angle ' + L + ' has long lines, but it only turns a little.';
        tag = TAG.len;
      }
      var second = api.tries() >= 1;
      if (second) {
        hint = 'Drag the checker onto angle ' + L + '. Fits exactly = right angle. A gap = greater. Sticks out = less.';
        chk.pulse();
      }
      api.check(false, hint, tag);
    });
    api.onReveal(function () {
      q.items.forEach(function (it, i) {
        answers[i] = it.cat;
        Object.keys(cols[i].btns).forEach(function (k) {
          cols[i].btns[k].classList.toggle('on', k === it.cat);
        });
        cols[i].classList.remove('rah-col-bad');
        cols[i].classList.add('rah-col-good');
      });
      lockAll();
      showAll();
      api.feedback(
        q.items
          .map(function (it, i) {
            return letters[i] + ': ' + WORDS[it.cat].toLowerCase();
          })
          .join('. ') + '. The checker shows it: fits, gap, or sticks out.',
        'info'
      );
    });
  }

  function renderLine(stage, api, q) {
    api.say('A straight line is a half turn. How many right angles fit in it?', 'think');
    stage.appendChild(MQ.ui.prompt('A straight line is a <b>half turn</b>. How many <b>right angles</b> make it?'));
    var s = standardScene();
    var sc = s.sc;
    var t = fitAngle({ a1: q.a1, theta: 180, L1: q.L1, L2: q.L2 }, SCN.region);
    sc.targets.push(t);
    drawArms(sc.top, t, true);
    sc.top.appendChild(S('path', { d: arcD(t.V, t.a1, 180, 50), class: 'rah-turn' }));
    var aE = t.a1 + 180;
    var E = pt(t.V, aE, 50);
    var B = pt(E, aE - 90, 4);
    sc.top.appendChild(S('polygon', { points: pts([pt(E, aE + 90, 9), pt(B, aE, 8), pt(B, aE + 180, 8)]), class: 'rah-turn-head' }));
    sc.svg.setAttribute('data-answer', '2');
    stage.appendChild(sc.svg);
    var chk = addChecker(sc, api, s.home, null);
    var ch = MQ.ui.choices([1, 2, 3, 4], function (v) {
      if (api.isAnswered()) return;
      if (v === 2) {
        ch.mark(v, 'good');
        ch.disable();
        chk.hide();
        twoGhosts();
        api.check(true, 'Yes! 2 right angles make a straight line: a half turn.');
        return;
      }
      ch.mark(v, 'bad');
      var second = api.tries() >= 1;
      var hint;
      if (second) {
        hint = 'Put the checker on the dot. The gap left over is exactly the same size as the checker. 1 + 1 = ?';
        chk.pulse();
      } else if (v === 1) hint = 'One checker only fills part of it. Is there room for another one?';
      else if (v === 4) hint = '4 right angles go all the way round: a full turn. A straight line is only half a turn.';
      else hint = 'Too many. Imagine fitting checkers along the top of the line, side by side.';
      api.check(false, hint, TAG.line);
    }, { columns: 4 });
    stage.appendChild(ch);
    function twoGhosts() {
      ghost(sc, t, 'A', false);
      ghost(sc, t, 'B', false);
      labelAt(sc.top, { V: t.V, a1: t.a1, theta: 90 }, '1', 'rah-num rah-num-big');
      labelAt(sc.top, { V: t.V, a1: t.a1 + 90, theta: 90 }, '2', 'rah-num rah-num-big');
    }
    api.onReveal(function () {
      ch.buttons.forEach(function (b) {
        b.classList.remove('bad');
      });
      ch.mark(2, 'good');
      ch.disable();
      chk.hide();
      twoGhosts();
      api.feedback('Two checkers fit side by side on the line. 2 right angles = a half turn = a straight line.', 'info');
    });
  }

  function renderShape(stage, api, q) {
    var def = q.kind === 'square45' ? SHAPES.square : SHAPES[q.kind];
    var notMode = q.mode === 'not';
    var s = standardScene();
    var sc = s.sc;
    var cs = [];
    if (def.pts) {
      var poly = buildPoly(def.pts, q.tilt, q.mirror, SCN.region, 1.1);
      drawPolygon(sc, poly);
      cs = corners(poly);
      sc.targets = cs;
    } else {
      sc.art.appendChild(S('circle', { cx: 267, cy: 170, r: 135, class: 'rah-shape' }));
      sc.top.appendChild(S('circle', { cx: 267, cy: 170, r: 135, class: 'rah-shape-line' }));
    }
    var want = cs.map(function (c) {
      return notMode ? !isRight(c.theta) : isRight(c.theta);
    });
    var nWant = want.filter(Boolean).length;
    var tilted = tiltedNum(q.tilt);
    sc.svg.setAttribute('data-answer', String(nWant));
    var marked = cs.map(function () {
      return false;
    });
    var dots;
    var counter = el('span', { class: 'rah-counter' });
    function updCounter() {
      var n = marked.filter(Boolean).length;
      counter.textContent = (notMode ? 'Ringed: ' : 'Marked: ') + n;
    }
    if (notMode) {
      api.say('Ring every corner that is NOT a right angle.', 'think');
      stage.appendChild(MQ.ui.prompt('Click every angle that is <b>not</b> a right angle.'));
    } else {
      api.say(q.kind === 'Lshape' ? 'How many right angles does this L-shape have? Mark them all.' : 'Mark every right angle inside the ' + def.name + '.', 'think');
      stage.appendChild(MQ.ui.prompt('Click every <b>right angle</b> inside the ' + def.name + '.'));
    }
    stage.appendChild(sc.svg);
    var chk = addChecker(sc, api, s.home, null);
    dots = cornerDots(sc, cs, function (i, g) {
      if (api.isAnswered()) return;
      marked[i] = !marked[i];
      g.classList.toggle('rah-dot-on', marked[i]);
      g.classList.remove('rah-dot-bad');
      api.sound('pop');
      updCounter();
    });
    dots.forEach(function (d, i) {
      d.setAttribute('data-want', want[i] ? '1' : '0');
    });
    var checkBtn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    var row = el('div', { class: 'rah-row' }, counter, checkBtn);
    stage.appendChild(row);
    if (!notMode) stage.appendChild(el('div', { class: 'rah-small' }, 'If there are none, press Check with nothing marked.'));
    updCounter();

    function working() {
      chk.hide();
      MQ.clear(sc.marks);
      var n = 0;
      cs.forEach(function (c, i) {
        marked[i] = want[i];
        dots[i].classList.toggle('rah-dot-on', want[i]);
        dots[i].classList.remove('rah-dot-bad');
        if (isRight(c.theta)) markRight(sc.marks, c, notMode ? 0 : ++n);
        else markOther(sc.marks, c, notMode ? ++n : 0);
      });
      updCounter();
      checkBtn.disabled = true;
      if (!cs.length) return 'A circle has no corners at all, so it has 0 right angles.';
      if (notMode) return (cs.length - nWant > 0 ? 'The green squares are right angles. ' : 'None of these corners is a right angle. ') + 'The ' + nWant + ' orange corners are not right angles.';
      var reflex = cs.filter(function (c) {
        return c.theta > 180;
      }).length;
      return (
        'The ' + def.name + ' has ' + nWant + ' right angle' + (nWant === 1 ? '' : 's') + '.' +
        (reflex ? (reflex === 1 ? ' The corner that points in is bigger than a right angle.' : ' The ' + reflex + ' corners that point in are bigger than a right angle.') : nWant === 0 ? ' None of the corners is a square corner.' : '')
      );
    }

    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var missed = [];
      var extra = [];
      cs.forEach(function (c, i) {
        if (want[i] && !marked[i]) missed.push(i);
        if (!want[i] && marked[i]) extra.push(i);
      });
      if (!missed.length && !extra.length) {
        var msg = working();
        api.check(true, 'Yes! ' + msg);
        return;
      }
      var second = api.tries() >= 1;
      var hint;
      var tag;
      if (notMode) {
        if (extra.length) {
          tag = TAG.ringR;
          hint = second ? 'A corner you ringed is a square corner: the checker fits it exactly, so it IS a right angle. Unring it.' : 'Ring only the corners that are NOT right angles. One of yours is a square corner.';
        } else {
          tag = TAG.missN;
          hint = second ? 'There are ' + nWant + ' angles that are not right angles. Look for pointy corners and wide-open corners.' : 'Some corners that are not right angles still need a ring.';
        }
      } else if (extra.length) {
        var reflexMarked = extra.some(function (i) {
          return cs[i].theta > 180;
        });
        if (reflexMarked) {
          tag = q.kind === 'Lshape' ? TAG.L : TAG.inward;
          hint = second ? 'The corner that points into the shape is bigger than a right angle. The checker leaves a big gap there. Unmark it.' : 'Look at the corner that points inwards. Inside the shape, is it really a square corner?';
        } else {
          tag = TAG.extra;
          hint = second ? 'The corners now shown in red are not right angles. Try the checker on them.' : 'One corner you marked is not a right angle. Is it pointy, or wide open?';
        }
        if (second) {
          extra.forEach(function (i) {
            dots[i].classList.add('rah-dot-bad');
          });
        }
      } else {
        tag = tilted ? TAG.tilt : TAG.miss;
        hint = second ? 'There are ' + nWant + ' right angles. Check every corner with the checker.' : tilted ? 'You missed one. A tilted corner can still be a right angle!' : 'There are more right angles. Check every corner.';
      }
      if (second) chk.pulse();
      api.check(false, hint, tag);
    });
    api.onReveal(function () {
      api.feedback(working(), 'info');
    });
  }

  var deck = null;
  function renderPractice(stage, api) {
    if (!deck || api.index === 0 || deck.length !== api.count || !deck[api.index]) deck = buildDeck(api.count);
    var q = deck[api.index];
    if (q.type === 'pic') renderPic(stage, api, q);
    else if (q.type === 'tri') renderTri(stage, api, q);
    else if (q.type === 'tshape') renderTShape(stage, api, q);
    else if (q.type === 'line') renderLine(stage, api, q);
    else renderShape(stage, api, q);
  }

  MQ.register('right-angle-hunt', {
    learn: [learnFold, learnCheck, learnShapes, learnTricky],
    practice: { count: 10, render: renderPractice },
  });

  var css = [
    '.rah-svg{display:block;max-width:100%;height:auto;user-select:none;-webkit-user-select:none}',
    '.rah-wide{width:740px;max-width:100%;display:flex;flex-direction:column;gap:8px}',
    '.rah-wide .rah-svg{width:100%!important}',
    '.rah-caps{display:grid;grid-template-columns:200fr 200fr 200fr 140fr;gap:6px;width:100%}',
    '.rah-cap{text-align:center;font-weight:800;font-size:1rem;color:var(--ink-soft);background:#fff;border:2px solid var(--line);border-radius:12px;padding:6px 4px}',
    '.rah-cap-right{color:var(--good);border-color:var(--good);background:var(--good-bg)}',
    '.rah-cap-greater{color:#b33f00;border-color:#ffa94d;background:#fff4e6}',
    '.rah-cap-less{color:#c92a2a;border-color:#ff8787;background:#fff0f0}',
    '.rah-col{display:flex;flex-direction:column;align-items:center;gap:4px;border-radius:12px;padding:4px;border:2px solid transparent}',
    '.rah-col-lab{font-weight:800;font-size:1.1rem}',
    '.rah-col-good{border-color:var(--good);background:var(--good-bg)}',
    '.rah-col-bad{border-color:var(--try);background:var(--try-bg)}',
    '.rah-col-check{justify-content:center}',
    '.rah-mini-row{display:flex;gap:4px;width:100%}',
    '.rah-mini{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;gap:0;padding:4px 2px;border-radius:10px;border:2px solid var(--line);background:#fff;color:var(--ink);font-weight:800;font-size:.8rem;cursor:pointer}',
    '.rah-mini .rah-ico{width:30px;height:24px}',
    '.rah-mini.on{border-color:#3b6fd8;background:#eef3ff}',
    '.rah-mini:disabled{cursor:default}',
    '.rah-choices .choice{display:flex;align-items:center;justify-content:center;gap:8px;font-size:1.05rem;line-height:1.2}',
    '.rah-ico{width:40px;height:32px;flex:none}',
    '.rah-ico path{fill:none;stroke:#e8590c;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}',
    '.rah-ico path.rah-ico-sq{stroke:#1f9d6b;stroke-width:2.5}',
    '.rah-row{display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:center}',
    '.rah-counter{font-size:1.25rem;font-weight:800;min-width:120px;text-align:center}',
    '.rah-small{font-size:.9rem;color:var(--ink-soft);margin-top:-6px}',
    '.rah-l-art,.rah-l-marks,.rah-l-wedge,.rah-l-top{pointer-events:none}',
    '.rah-ink{stroke:#3d4b66;stroke-width:2}',
    '.rah-string{fill:none;stroke:#6b778a;stroke-width:2}',
    '.rah-clocknum{font-size:24px;font-weight:800;fill:#1b2a4a}',
    '.rah-panel{fill:#fff;stroke:#e1e7f5;stroke-width:2}',
    '.rah-letter{font-size:22px;font-weight:800;fill:#1b2a4a}',
    '.rah-tray{fill:#f7f9ff;stroke:#c9d3ee;stroke-width:2;stroke-dasharray:6 5}',
    '.rah-tray-lab{font-size:17px;font-weight:800;fill:#4a5a7d}',
    '.rah-verdict{font-size:19px;font-weight:800;fill:#4a5a7d}',
    '.rah-vt-right{fill:#1f9d6b}.rah-vt-greater{fill:#c25400}.rah-vt-less{fill:#c92a2a}',
    '.rah-chk-paper{fill:#fff3bf;stroke:#d9a400;stroke-width:2;fill-opacity:.9}',
    '.rah-chk-fold{fill:none;stroke:#ecc94b;stroke-width:1.5}',
    '.rah-chk-sq{fill:none;stroke:#b07d00;stroke-width:2}',
    '.rah-drag{filter:drop-shadow(0 2px 3px rgba(27,42,74,.3))}',
    '.rah-drag.dragging{cursor:grabbing}',
    '.rah-ghost .rah-chk-paper{fill-opacity:.8}',
    '.rah-pulse .rah-chk-paper{animation:rah-pulse .5s ease 3}',
    '@keyframes rah-pulse{50%{fill:#ffd43b;stroke-width:5}}',
    '.rah-rot circle{fill:#fff;stroke:#b07d00;stroke-width:2}',
    '.rah-rot-ar{fill:none;stroke:#b07d00;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}',
    '.rah-arm{stroke:#e8590c;stroke-width:6;stroke-linecap:round;opacity:.9}',
    '.rah-arc{fill:none;stroke:#e8590c;stroke-width:3}',
    '.rah-vdot{fill:#e8590c;stroke:#fff;stroke-width:2}',
    '.rah-v-right{fill:none;stroke:#1f9d6b;stroke-width:4}',
    '.rah-v-gap{fill:#ffa94d;fill-opacity:.45;stroke:#e8590c;stroke-width:2;stroke-dasharray:5 4}',
    '.rah-v-over{fill:#ff6b6b;fill-opacity:.4;stroke:#c92a2a;stroke-width:2;stroke-dasharray:5 4}',
    '.rah-turn{fill:none;stroke:#3b6fd8;stroke-width:3;stroke-dasharray:7 5}',
    '.rah-turn-head{fill:#3b6fd8}',
    '.rah-shape{fill:#e7f0ff}',
    '.rah-shape-line{fill:none;stroke:#1b2a4a;stroke-width:4;stroke-linejoin:miter}',
    '.rah-sq{fill:none;stroke:#1f9d6b;stroke-width:3.5}',
    '.rah-arc-bad{fill:none;stroke:#e8590c;stroke-width:3.5}',
    '.rah-num{font-size:17px;font-weight:800;fill:#1f9d6b}',
    '.rah-num-bad{fill:#c25400}',
    '.rah-num-big{font-size:26px;fill:#1b2a4a}',
    '.rah-dot{cursor:pointer}',
    '.rah-dot-hit{fill:transparent}',
    '.rah-dot-ring{fill:none;stroke:transparent;stroke-width:4}',
    '.rah-dot-c{fill:#fff;stroke:#3b6fd8;stroke-width:3}',
    '.rah-dot:hover .rah-dot-ring{stroke:#a5c0f5}',
    '.rah-dot-on .rah-dot-ring{stroke:#3b6fd8}',
    '.rah-dot-on .rah-dot-c{fill:#3b6fd8}',
    '.rah-dot-bad .rah-dot-ring{stroke:#c92a2a}',
    '.rah-dot-bad .rah-dot-c{fill:#c92a2a;stroke:#c92a2a}',
    '.rah-paper{fill:#fffdf3;stroke:#c9b56b;stroke-width:2}',
    '.rah-paper-back{fill:#f3ecd0}',
    '.rah-foldline{stroke:#9fb3d9;stroke-width:2;stroke-dasharray:6 5}',
    '.rah-fold-edge{fill:none;stroke:#b07d00;stroke-width:3}',
    '.rah-pointer{fill:none;stroke:#1f9d6b;stroke-width:2.5}',
    '.rah-note{font-size:22px;font-weight:800;fill:#1f9d6b}',
    '.rah-note-small{font-size:15px;font-weight:700;fill:#4a5a7d}',
    '@media (max-width:640px){.rah-choices .choice{font-size:.9rem}.rah-mini span{font-size:.7rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'right-angle-hunt' }, css));
})();

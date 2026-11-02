/* Straws and Clay (Unit 4 Project 2 "Prism to pyramid", also 4.1 Q9).
 * Skeleton models: every straw is an edge, every clay ball is a vertex. The child drags straws
 * from a tray onto dotted gaps between balls, turns a prism into a pyramid by taking the top off
 * and leaning the upright straws in to one ball, and finds the counting-on pattern in a table.
 * All counts are computed from the same point / straw / ball lists that draw the models.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;
  var ID = 'straw-shape-builder';
  var D = Math.PI / 180;
  var INK = '#1b2a4a';

  // Straw colours: by group (bottom ring, top ring, uprights / sloping), or one plain colour.
  var COL = { bottom: '#1c7ed6', top: '#2f9e44', side: '#f08c00', plain: '#e8590c', apex: '#c2255c' };
  var CLAY = '#9c36b5';
  var CLAY_DARK = '#5f1f73';
  var BASE_NAME = { 3: 'triangle', 4: 'square', 5: 'pentagon', 6: 'hexagon' };

  /* ---------------------------------------------------------------- *
   * 3D maths (same rotate / project approach as the other Unit 4 activities)
   * ---------------------------------------------------------------- */
  function rot(v, yaw, pitch) {
    var cy = Math.cos(yaw), sy = Math.sin(yaw);
    var x1 = v[0] * cy + v[2] * sy;
    var z1 = -v[0] * sy + v[2] * cy;
    var cp = Math.cos(pitch), sp = Math.sin(pitch);
    return [x1, v[1] * cp - z1 * sp, v[1] * sp + z1 * cp];
  }
  function regPoly(n, r) {
    var a0 = Math.PI / 2 + Math.PI / n, out = [];
    for (var i = 0; i < n; i++) out.push([r * Math.cos(a0 + (2 * Math.PI * i) / n), r * Math.sin(a0 + (2 * Math.PI * i) / n)]);
    return out;
  }

  /**
   * A skeleton model. kind 'prism' or 'pyramid', n = sides of the base.
   * P: 3D points. balls: {p, cat, st:'on'|'ghost'|'removing'|'gone'}.
   * straws: {a, b, cat, st:'placed'|'ghost'|'loose'|'removing'|'gone'} (b is the top end of an upright).
   * Prism points: 0..n-1 bottom ring, n..2n-1 top ring, 2n = spare point used for the apex.
   */
  function makeScene(kind, n, cube) {
    var r = { 3: 1.0, 4: 0.92, 5: 0.95, 6: 0.95 }[n];
    var poly = regPoly(n, r);
    var h = cube ? r * Math.SQRT2 : 1.35;
    var P = [], balls = [], straws = [], i;
    poly.forEach(function (p) { P.push([p[0], -h / 2, p[1]]); });
    if (kind === 'prism') {
      poly.forEach(function (p) { P.push([p[0], h / 2, p[1]]); });
      P.push([0, h / 2, 0]);
      for (i = 0; i < n; i++) balls.push({ p: i, cat: 'bottom', st: 'on' });
      for (i = 0; i < n; i++) balls.push({ p: n + i, cat: 'top', st: 'on' });
      for (i = 0; i < n; i++) straws.push({ a: i, b: (i + 1) % n, cat: 'bottom', st: 'placed' });
      for (i = 0; i < n; i++) straws.push({ a: n + i, b: n + ((i + 1) % n), cat: 'top', st: 'placed' });
      for (i = 0; i < n; i++) straws.push({ a: i, b: n + i, cat: 'side', st: 'placed' });
    } else {
      P.push([0, h / 2, 0]);
      for (i = 0; i < n; i++) balls.push({ p: i, cat: 'bottom', st: 'on' });
      balls.push({ p: n, cat: 'apex', st: 'on' });
      for (i = 0; i < n; i++) straws.push({ a: i, b: (i + 1) % n, cat: 'bottom', st: 'placed' });
      for (i = 0; i < n; i++) straws.push({ a: i, b: n, cat: 'side', st: 'placed', slant: true });
    }
    var R = 0;
    P.forEach(function (p) { R = Math.max(R, Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2])); });
    return { kind: kind, n: n, h: h, P: P, balls: balls, straws: straws, R: R, apex: kind === 'prism' ? 2 * n : n, cube: !!cube };
  }

  /** Straws and balls that are there now, in groups. Loose straws still count (they are still straws). */
  function counts(sc) {
    var c = { straws: 0, balls: 0, sg: { bottom: 0, top: 0, side: 0 }, bg: { bottom: 0, top: 0, apex: 0 } };
    sc.straws.forEach(function (t) {
      if (t.st === 'placed' || t.st === 'loose') { c.straws++; c.sg[t.cat]++; }
    });
    sc.balls.forEach(function (b) {
      if (b.st === 'on') { c.balls++; c.bg[b.cat]++; }
    });
    return c;
  }
  /** Is the model now a pyramid (built as one, or a prism that has been changed)? */
  function isPyramidNow(sc) {
    return sc.kind === 'pyramid' || sc.balls.some(function (b) { return b.cat === 'apex' && b.st === 'on'; });
  }
  /** Table numbers for an n-sided base, counted from freshly built models. */
  function rowFor(n) {
    var a = counts(makeScene('prism', n)), b = counts(makeScene('pyramid', n));
    return { n: n, ps: a.straws, pb: a.balls, ys: b.straws, yb: b.balls };
  }
  function prismName(n, cube) {
    if (cube) return 'cube';
    return { 3: 'triangular prism', 4: 'prism with a square base', 5: 'pentagonal prism', 6: 'hexagonal prism' }[n];
  }
  function pyrName(n) {
    return { 3: 'triangle-based pyramid', 4: 'square-based pyramid', 5: 'pentagon-based pyramid', 6: 'hexagon-based pyramid' }[n];
  }

  /* ---------------------------------------------------------------- *
   * The skeleton view: draws a scene, a straw tray to drag from, loose straws to lean in,
   * click-to-mark or click-to-remove, and turn buttons.
   * o: {W, H, tray, mode:'mark'|'remove'|null, plain, hideGhosts, turn (default true), yaw, pitch,
   *     onChange(), onBuilt(), onTopOff(), onLeaned(), onMiss(what), onWrongRemove(t), onClickSvg()}
   * ---------------------------------------------------------------- */
  function skelView(api, sc, o) {
    o = o || {};
    var W = o.W || 520, H = o.H || 320, TH = o.tray ? 84 : 0;
    var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + (H + TH), class: 'ssb-svg', style: { maxWidth: W + 'px' }, role: 'img', 'aria-label': 'Straw and clay model' });
    var g = S('g'), gripLayer = S('g'), topLayer = S('g', { 'pointer-events': 'none' });
    var st = { yaw: o.yaw != null ? o.yaw : 18, pitch: o.pitch != null ? o.pitch : 24 };
    var scale = (Math.min(W, H) / 2 - (o.pad != null ? o.pad : 26)) / sc.R;
    var cx = W / 2, cy = H / 2 + 4;
    var marks = { s: {}, b: {} };
    var drag = null;
    var gripEls = {};
    var trayG = null;
    var busy = false;
    var v = { svg: svg, sc: sc, st: st, marks: marks, Q: [], plain: !!o.plain, showGone: false, keepIdx: -1 };

    svg.appendChild(g);
    if (o.tray) {
      trayG = S('g', { class: 'ssb-tray' });
      trayG.appendChild(S('rect', { x: 14, y: H + 8, width: W - 28, height: TH - 16, rx: 16, fill: '#fff4e6', stroke: '#f2c48d', 'stroke-width': 2.5 }));
      for (var k = 0; k < 6; k++) {
        var x0 = 40 + k * 13;
        trayG.appendChild(S('line', { x1: x0, y1: H + TH - 20, x2: x0 + 38, y2: H + 20, stroke: k % 2 ? '#ff8787' : '#ffa94d', 'stroke-width': 8, 'stroke-linecap': 'round' }));
        trayG.appendChild(S('line', { x1: x0, y1: H + TH - 20, x2: x0 + 38, y2: H + 20, stroke: '#fff', 'stroke-width': 2, opacity: 0.5, 'stroke-linecap': 'round' }));
      }
      trayG.appendChild(S('text', { x: 138, y: H + TH / 2 + 7, 'font-size': 20, 'font-weight': 800, fill: '#9a5b13', class: 'ssb-tray-text' }, 'Drag a straw up to a gap ↑'));
      svg.appendChild(trayG);
    }
    svg.appendChild(gripLayer);
    svg.appendChild(topLayer);

    function project() {
      v.Q = sc.P.map(function (p) {
        var r = rot(p, st.yaw * D, st.pitch * D);
        return [cx + r[0] * scale, cy - r[1] * scale, r[2] / sc.R];
      });
    }
    function strawCol(t) { return v.plain ? COL.plain : COL[t.cat]; }
    function drawStraw(parent, a, b, col, opts) {
      opts = opts || {};
      var base = { x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'stroke-linecap': 'round', 'pointer-events': 'none' };
      if (opts.mark) parent.appendChild(S('line', Object.assign({}, base, { stroke: '#ffd43b', 'stroke-width': 17 })));
      parent.appendChild(S('line', Object.assign({}, base, { stroke: col, 'stroke-width': opts.w || 9, opacity: opts.op != null ? opts.op : 1, 'stroke-dasharray': opts.dash || null })));
      if (!opts.dash) parent.appendChild(S('line', Object.assign({}, base, { stroke: '#fff', 'stroke-width': 2.4, opacity: 0.45 * (opts.op != null ? opts.op : 1) })));
    }
    function drawBall(parent, q, opts) {
      opts = opts || {};
      var r = opts.r || 11.5;
      if (opts.mark) parent.appendChild(S('circle', { cx: q[0], cy: q[1], r: r + 5, fill: '#ffd43b', 'pointer-events': 'none' }));
      if (opts.removing) {
        parent.appendChild(S('circle', { cx: q[0], cy: q[1], r: r, fill: 'rgba(255,255,255,.7)', stroke: '#e03131', 'stroke-width': 2.5, 'stroke-dasharray': '4 3', 'pointer-events': 'none' }));
        return;
      }
      parent.appendChild(S('circle', { cx: q[0], cy: q[1], r: r, fill: opts.fill || CLAY, stroke: CLAY_DARK, 'stroke-width': 2, 'pointer-events': 'none', class: opts.cls || null, opacity: opts.op != null ? opts.op : 1 }));
      parent.appendChild(S('circle', { cx: q[0] - r * 0.32, cy: q[1] - r * 0.32, r: r * 0.3, fill: '#fff', opacity: 0.55, 'pointer-events': 'none' }));
      if (opts.keep) parent.appendChild(S('circle', { cx: q[0], cy: q[1], r: r + 5, fill: 'none', stroke: '#2f9e44', 'stroke-width': 3.5, 'pointer-events': 'none' }));
    }
    function fade(z) { return z < -0.35 ? 0.62 : 1; }

    function redraw() {
      project();
      var Q = v.Q;
      MQ.clear(g);
      MQ.clear(topLayer);
      // dotted gaps where a straw can go
      if (!o.hideGhosts) {
        sc.straws.forEach(function (t, k) {
          if (t.st !== 'ghost') return;
          var a = Q[t.a], b = Q[t.b], hot = drag && drag.kind === 'tray' && drag.near === k;
          g.appendChild(S('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'ssb-gap', 'data-k': k, stroke: hot ? '#2b8a3e' : '#8c96aa', 'stroke-width': hot ? 7 : 3.4, 'stroke-dasharray': hot ? null : '2 8', 'stroke-linecap': 'round', 'pointer-events': 'none' }));
        });
      }
      // removed parts shown as red dashed (for "Show me" on the take-away question)
      if (v.showGone) {
        sc.straws.forEach(function (t) {
          if (t.st !== 'gone') return;
          drawStraw(g, Q[t.a], Q[t.b], '#e03131', { w: 5, dash: '8 6', op: 0.9 });
        });
      }
      var items = [];
      sc.straws.forEach(function (t, k) {
        if (t.st === 'placed' || t.st === 'removing' || (t.st === 'loose' && !(drag && drag.kind === 'grip' && drag.k === k))) {
          var a = Q[t.a], b = Q[t.b];
          items.push({
            z: (a[2] + b[2]) / 2,
            f: function () {
              if (t.st === 'removing') drawStraw(g, a, b, '#e03131', { w: 7, dash: '8 6', op: 0.8 });
              else drawStraw(g, a, b, strawCol(t), { mark: marks.s[k], op: fade((a[2] + b[2]) / 2) });
            },
          });
        }
      });
      sc.balls.forEach(function (bl, k) {
        if (bl.st === 'on' || bl.st === 'removing' || (bl.st === 'gone' && v.showGone)) {
          var q = Q[bl.p];
          items.push({
            z: q[2] + 0.02,
            f: function () {
              drawBall(g, q, { mark: marks.b[k], removing: bl.st !== 'on', op: fade(q[2]), keep: v.keepIdx === k, cls: bl.cat === 'apex' ? 'ssb-apex' : null });
            },
          });
        }
      });
      items.sort(function (p, q) { return p.z - q.z; });
      items.forEach(function (it) { it.f(); });

      // click targets
      if (o.mode === 'mark' || o.mode === 'remove') {
        sc.straws.forEach(function (t, k) {
          if (t.st !== 'placed') return;
          var a = Q[t.a], b = Q[t.b];
          g.appendChild(S('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: 'transparent', 'stroke-width': 20, 'stroke-linecap': 'butt', class: 'ssb-hit', 'data-t': 's', 'data-k': k, 'data-cat': t.cat }));
        });
      }
      if (o.mode === 'mark') {
        sc.balls.forEach(function (bl, k) {
          if (bl.st !== 'on') return;
          var q = Q[bl.p];
          g.appendChild(S('circle', { cx: q[0], cy: q[1], r: 15, fill: 'transparent', class: 'ssb-hit', 'data-t': 'b', 'data-k': k }));
        });
      }

      // loose straws: a target ring round the top ball, and grips to pull
      var loose = sc.straws.filter(function (t) { return t.st === 'loose'; }).length;
      if (loose) {
        var A = Q[sc.apex];
        topLayer.appendChild(S('circle', { cx: A[0], cy: A[1], r: 24, fill: 'none', stroke: '#2b8a3e', 'stroke-width': 3, 'stroke-dasharray': '5 5', class: 'ssb-apex-target' }));
      }
      if (drag && drag.kind === 'grip') {
        var t0 = sc.straws[drag.k];
        drawStraw(topLayer, Q[t0.a], [drag.x, drag.y], strawCol(t0), {});
      }
      if (drag && drag.kind === 'tray') {
        if (drag.near >= 0) {
          var tn = sc.straws[drag.near];
          drawStraw(topLayer, Q[tn.a], Q[tn.b], v.plain ? COL.plain : COL[tn.cat], { op: 0.45 });
        }
        drawStraw(topLayer, [drag.x - 26, drag.y + 15], [drag.x + 26, drag.y - 15], '#ff8787', {});
      }
      syncGrips();
      var c = counts(sc);
      svg.setAttribute('data-straws', c.straws);
      svg.setAttribute('data-balls', c.balls);
    }

    function syncGrips() {
      sc.straws.forEach(function (t, k) {
        var ge = gripEls[k];
        if (t.st !== 'loose') {
          if (ge) { ge.el.parentNode && ge.el.parentNode.removeChild(ge.el); ge.un(); delete gripEls[k]; }
          return;
        }
        if (!ge) ge = makeGrip(k);
        var q = drag && drag.kind === 'grip' && drag.k === k ? [drag.x, drag.y] : v.Q[t.b];
        ge.el.setAttribute('transform', 'translate(' + q[0].toFixed(1) + ',' + q[1].toFixed(1) + ')');
      });
    }
    function makeGrip(k) {
      var ge = S('g', { class: 'ssb-grip', 'data-k': k });
      ge.appendChild(S('circle', { r: 19, fill: 'rgba(255,255,255,.35)', stroke: '#2b8a3e', 'stroke-width': 3, 'stroke-dasharray': '4 4' }));
      ge.appendChild(S('circle', { r: 5, fill: '#2b8a3e' }));
      gripLayer.appendChild(ge);
      var un = MQ.ui.drag(svg, ge, {
        start: function (p) { if (busy) return; drag = { kind: 'grip', k: k, x: p.x, y: p.y }; redraw(); },
        move: function (p) { if (!drag || drag.kind !== 'grip') return; drag.x = p.x; drag.y = p.y; redraw(); },
        end: function (p) {
          if (!drag || drag.kind !== 'grip') return;
          drag = null;
          var A = v.Q[sc.apex];
          if (Math.hypot(p.x - A[0], p.y - A[1]) < 46) attach(k);
          else { redraw(); if (o.onMiss) o.onMiss('grip'); }
        },
      });
      gripEls[k] = { el: ge, un: un };
      return gripEls[k];
    }
    api.cleanup(function () {
      Object.keys(gripEls).forEach(function (k) { gripEls[k].un(); });
    });

    function segDist(p, a, b) {
      var dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy;
      var t = L ? ((p.x - a[0]) * dx + (p.y - a[1]) * dy) / L : 0;
      t = U.clamp(t, 0.12, 0.88);
      return Math.hypot(p.x - (a[0] + t * dx), p.y - (a[1] + t * dy));
    }
    function nearestGap(p) {
      var best = -1, bd = 34;
      sc.straws.forEach(function (t, k) {
        if (t.st !== 'ghost') return;
        var d = segDist(p, v.Q[t.a], v.Q[t.b]);
        if (d < bd) { bd = d; best = k; }
      });
      return best;
    }
    function ghostsLeft() { return sc.straws.filter(function (t) { return t.st === 'ghost'; }).length; }
    function changed() { if (o.onChange) o.onChange(); }

    function place(k) {
      sc.straws[k].st = 'placed';
      api.sound('pop');
      redraw();
      changed();
      if (!ghostsLeft() && o.onBuilt) o.onBuilt();
    }
    function attach(k) {
      var t = sc.straws[k];
      t.b = sc.apex;
      t.st = 'placed';
      t.slant = true;
      api.sound('pop');
      redraw();
      changed();
      if (!sc.straws.some(function (s) { return s.st === 'loose'; }) && o.onLeaned) o.onLeaned();
    }

    if (trayG) {
      var unTray = MQ.ui.drag(svg, trayG, {
        start: function (p) {
          if (busy || !ghostsLeft()) return;
          drag = { kind: 'tray', x: p.x, y: p.y, near: -1 };
          redraw();
        },
        move: function (p) {
          if (!drag || drag.kind !== 'tray') return;
          drag.x = p.x; drag.y = p.y; drag.near = nearestGap(p);
          redraw();
        },
        end: function (p) {
          if (!drag || drag.kind !== 'tray') return;
          drag = null;
          var k = nearestGap(p);
          if (k >= 0) place(k);
          else { redraw(); if (o.onMiss && p.y < H) o.onMiss('tray'); }
        },
      });
      api.cleanup(unTray);
    }

    svg.addEventListener('click', function (e) {
      if (o.onClickSvg) o.onClickSvg();
      var t = e.target;
      if (busy || !t || !t.getAttribute || !t.getAttribute('data-t')) return;
      var k = +t.getAttribute('data-k');
      if (o.mode === 'mark') {
        var bag = t.getAttribute('data-t') === 's' ? marks.s : marks.b;
        if (bag[k]) delete bag[k];
        else { bag[k] = true; api.sound('click'); }
        redraw();
      } else if (o.mode === 'remove' && t.getAttribute('data-t') === 's') {
        var s0 = sc.straws[k];
        if (s0.cat === 'top') {
          v.removeStraw(k);
          if (!sc.straws.some(function (s) { return s.cat === 'top' && s.st !== 'gone' && s.st !== 'removing'; })) {
            o.mode = null;
            if (o.onTopOff) o.onTopOff();
          }
        } else if (o.onWrongRemove) o.onWrongRemove(s0);
      }
    });

    v.redraw = redraw;
    v.setMode = function (m) { o.mode = m; redraw(); };
    v.setPlain = function (b) { v.plain = b; redraw(); };
    v.clearMarks = function () { marks.s = {}; marks.b = {}; v.marks = marks; redraw(); };
    v.isBusy = function () { return busy; };
    v.removeStraw = function (k) {
      sc.straws[k].st = 'removing';
      api.sound('click');
      redraw();
      changed();
      api.later(function () {
        if (sc.straws[k].st === 'removing') sc.straws[k].st = 'gone';
        redraw();
      }, 450);
    };
    v.turnBy = function (d) {
      if (busy) return;
      var steps = 10, y0 = st.yaw;
      for (var i = 1; i <= steps; i++) {
        (function (i) {
          api.later(function () { st.yaw = y0 + (d * i) / steps; redraw(); }, i * 30);
        })(i);
      }
    };
    /** Take the top off: n - 1 top balls go, one top ball is kept and moved to the middle (the apex). */
    v.liftTop = function (done) {
      busy = true;
      var tops = sc.balls.filter(function (b) { return b.cat === 'top' && b.st === 'on'; });
      var keep = tops[0];
      sc.straws.forEach(function (t) { if (t.cat === 'top' && t.st !== 'gone') t.st = 'gone'; });
      tops.slice(1).forEach(function (b) { b.st = 'removing'; });
      sc.straws.forEach(function (t) { if (t.cat === 'side' && t.st === 'placed') t.st = 'loose'; });
      v.keepIdx = sc.balls.indexOf(keep);
      api.sound('click');
      redraw();
      changed();
      api.later(function () {
        tops.slice(1).forEach(function (b) { b.st = 'gone'; });
        var from = sc.P[keep.p].slice(), to = [0, sc.h / 2, 0];
        keep.p = sc.apex;
        keep.cat = 'apex';
        var steps = 14;
        for (var i = 0; i <= steps; i++) {
          (function (i) {
            api.later(function () {
              var f = i / steps;
              sc.P[sc.apex] = [from[0] + (to[0] - from[0]) * f, from[1] + (to[1] - from[1]) * f, from[2] + (to[2] - from[2]) * f];
              redraw();
              if (i === steps) {
                busy = false;
                v.keepIdx = -1;
                redraw();
                changed();
                if (done) done();
              }
            }, i * 40);
          })(i);
        }
      }, 650);
    };
    /** Build every missing piece, one at a time (for "Show me" and "check by building"). */
    v.autoBuild = function (done, ms) {
      ms = ms || 160;
      busy = true;
      var order = [];
      ['bottom', 'side', 'top'].forEach(function (c) {
        sc.straws.forEach(function (t, k) { if (t.cat === c && t.st === 'ghost') order.push(k); });
      });
      var newBalls = sc.balls.filter(function (b) { return b.st === 'ghost'; });
      var step = 0;
      if (newBalls.length) {
        api.later(function () { newBalls.forEach(function (b) { b.st = 'on'; }); api.sound('pop'); redraw(); changed(); }, ms);
        step = 2;
      }
      order.forEach(function (k, i) {
        api.later(function () { sc.straws[k].st = 'placed'; api.sound('pop'); redraw(); changed(); }, (step + i + 1) * ms);
      });
      api.later(function () { busy = false; redraw(); changed(); if (done) done(); }, (step + order.length + 2) * ms);
    };
    /** Prism to pyramid, all steps (take the top straws off, keep one ball, lean the uprights in). */
    v.autoTransform = function (done, ms) {
      ms = ms || 220;
      busy = true;
      var tops = [];
      sc.straws.forEach(function (t, k) { if (t.cat === 'top' && t.st === 'placed') tops.push(k); });
      tops.forEach(function (k, i) {
        api.later(function () { sc.straws[k].st = 'removing'; api.sound('click'); redraw(); changed(); }, (i + 1) * ms);
      });
      api.later(function () {
        busy = false;
        var after = function () {
          busy = true;
          var loose = [];
          sc.straws.forEach(function (t, k) { if (t.st === 'loose') loose.push(k); });
          loose.forEach(function (k, i) {
            api.later(function () {
              var t = sc.straws[k];
              t.b = sc.apex; t.st = 'placed'; t.slant = true;
              api.sound('pop'); redraw(); changed();
            }, (i + 1) * ms);
          });
          api.later(function () { busy = false; redraw(); changed(); if (done) done(); }, (loose.length + 2) * ms);
        };
        if (sc.balls.some(function (b) { return b.cat === 'top' && b.st === 'on'; })) v.liftTop(after);
        else after();
      }, (tops.length + 2) * ms);
    };

    // turn buttons
    var wrap = el('div', { class: 'ssb-view' }, svg);
    if (o.turn !== false) {
      wrap.appendChild(el('div', { class: 'ssb-turn' },
        el('button', { class: 'btn btn-ghost ssb-turn-btn', type: 'button', onclick: function () { v.turnBy(-40); } }, '↺ Turn'),
        el('button', { class: 'btn btn-ghost ssb-turn-btn', type: 'button', onclick: function () { v.turnBy(40); } }, 'Turn ↻')));
    }
    v.el = wrap;
    redraw();
    return v;
  }

  /* ---------------------------------------------------------------- *
   * Count cards: "Straws: 3 + 3 + 3 = 9" with coloured, labelled parts
   * ---------------------------------------------------------------- */
  function sumCard(title, parts, total, cls) {
    var row = el('div', { class: 'ssb-sum' });
    parts.forEach(function (p, i) {
      if (i) row.appendChild(el('span', { class: 'ssb-op' }, '+'));
      row.appendChild(el('span', { class: 'ssb-part', style: { '--c': p.col } }, el('b', null, String(p.v)), el('small', null, p.name)));
    });
    row.appendChild(el('span', { class: 'ssb-op' }, '='));
    row.appendChild(el('span', { class: 'ssb-total' }, String(total)));
    return el('div', { class: 'ssb-card' + (cls ? ' ' + cls : '') }, el('div', { class: 'ssb-card-h' }, title), row);
  }
  /** Straw and ball sums for the scene as it is now. */
  function countCards(sc) {
    var c = counts(sc);
    var pyr = isPyramidNow(sc);
    var sp = [{ v: c.sg.bottom, col: COL.bottom, name: 'bottom' }];
    var anyTop = sc.straws.some(function (t) { return t.cat === 'top' && t.st !== 'gone'; });
    if (anyTop) sp.push({ v: c.sg.top, col: COL.top, name: 'top' });
    var sloping = sc.straws.some(function (t) { return t.cat === 'side' && t.slant; });
    sp.push({ v: c.sg.side, col: COL.side, name: sloping ? 'sloping' : 'upright' });
    var bp = [{ v: c.bg.bottom, col: CLAY, name: 'bottom' }];
    if (pyr) bp.push({ v: c.bg.apex, col: COL.apex, name: 'top point' });
    else bp.push({ v: c.bg.top, col: CLAY, name: 'top' });
    return el('div', { class: 'ssb-cards' }, sumCard('Straws (edges)', sp, c.straws, 'ssb-card-straw'), sumCard('Clay balls (vertices)', bp, c.balls, 'ssb-card-ball'));
  }
  function liveCards(sc) {
    var box = el('div', { class: 'ssb-live' });
    box.update = function () { MQ.clear(box); box.appendChild(countCards(sc)); };
    box.update();
    return box;
  }

  /** Model on the left, controls / counts on the right (stacks on narrow screens). */
  function split(left) {
    var side = el('div', { class: 'ssb-side' });
    for (var i = 1; i < arguments.length; i++) if (arguments[i]) side.appendChild(arguments[i]);
    return el('div', { class: 'ssb-split' }, el('div', { class: 'ssb-left' }, left), side);
  }

  /* ---------------------------------------------------------------- *
   * Answer boxes: several labelled number boxes and one Check button
   * ---------------------------------------------------------------- */
  function answerRow(fields, onCheck, label) {
    var inputs = {};
    var row = el('div', { class: 'ssb-answers' });
    fields.forEach(function (f) {
      var inp = el('input', { class: 'num-input ssb-in', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': f.label, placeholder: '?', 'data-key': f.key });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
      inp.addEventListener('input', function () { inp.classList.remove('bad'); });
      inputs[f.key] = inp;
      row.appendChild(el('label', { class: 'ssb-field' }, el('span', { class: 'ssb-field-l' }, f.label), inp));
    });
    var btn = el('button', { class: 'btn btn-check ssb-check', type: 'button' }, label || 'Check');
    btn.addEventListener('click', submit);
    row.appendChild(btn);
    function submit() {
      if (btn.disabled) return;
      var vals = {}, bad = false;
      Object.keys(inputs).forEach(function (k) {
        var n = U.parseNum(inputs[k].value);
        if (isNaN(n)) bad = true;
        vals[k] = n;
      });
      if (bad) {
        if (row.onEmpty) row.onEmpty();
        return;
      }
      onCheck(vals);
    }
    var api = {
      el: row,
      inputs: inputs,
      mark: function (k, ok) { inputs[k].classList.remove('good', 'bad', 'shake'); inputs[k].classList.add(ok ? 'good' : 'bad'); },
      set: function (k, v) { inputs[k].value = v; },
      disable: function () { Object.keys(inputs).forEach(function (k) { inputs[k].disabled = true; }); btn.disabled = true; },
      focus: function (api2) {
        var first = inputs[fields[0].key];
        api2.later(function () { try { first.focus({ preventScroll: true }); } catch (e) { first.focus(); } }, 40);
      },
    };
    return api;
  }

  /* ---------------------------------------------------------------- *
   * Table of straws and balls, and the counting-on jump lines
   * ---------------------------------------------------------------- */
  var TCOLS = [
    { key: 'ps', head: 'Prism straws', step: 3, parts: function (n) { return n + ' + ' + n + ' + ' + n; } },
    { key: 'pb', head: 'Prism balls', step: 2, parts: function (n) { return n + ' + ' + n; } },
    { key: 'ys', head: 'Pyramid straws', step: 2, parts: function (n) { return n + ' + ' + n; } },
    { key: 'yb', head: 'Pyramid balls', step: 1, parts: function (n) { return n + ' + 1'; } },
  ];
  function tableEl() {
    var t = el('table', { class: 'ssb-table' });
    var hr = el('tr', null, el('th', { html: 'Sides on<br>the base' }));
    TCOLS.forEach(function (c, i) { hr.appendChild(el('th', { class: i < 2 ? 'ssb-th-prism' : 'ssb-th-pyr', html: c.head.replace(' ', '<br>') })); });
    t.appendChild(el('thead', null, hr));
    var body = el('tbody');
    t.appendChild(body);
    t.body = body;
    return t;
  }
  function cellContent(td, row, c, first, working) {
    MQ.clear(td);
    if (!first) td.appendChild(el('span', { class: 'ssb-step' }, '+' + c.step));
    td.appendChild(el('span', { class: 'ssb-num' }, String(row[c.key])));
    if (working) td.appendChild(el('small', { class: 'ssb-work' }, c.parts(row.n)));
  }
  /** Add a filled row (or empty cells if blank). Returns the <tr> with .cells[key]. */
  function addRow(t, row, opts) {
    opts = opts || {};
    var tr = el('tr', { class: 'ssb-row' + (opts.cls ? ' ' + opts.cls : '') }, el('td', { class: 'ssb-sides' }, row.n + ' ', el('small', null, BASE_NAME[row.n])));
    tr.cells2 = {};
    TCOLS.forEach(function (c) {
      var td = el('td', { class: 'ssb-td' });
      if (!opts.blank) cellContent(td, row, c, opts.first, opts.working);
      tr.cells2[c.key] = td;
      tr.appendChild(td);
    });
    t.body.appendChild(tr);
    return tr;
  }

  /** A number line with jumps: e.g. 9 → 12 → 15 → 18 in jumps of 3. */
  function jumpLine(values, step, col, title) {
    var W = 600, H = 92, lo = 0, hi = values[values.length - 1] + 1;
    var x = function (v) { return 24 + ((v - lo) * (W - 48)) / (hi - lo); };
    var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'ssb-jumps', role: 'img', 'aria-label': title });
    var y = 66;
    svg.appendChild(S('line', { x1: x(lo), y1: y, x2: x(hi), y2: y, stroke: '#8c96aa', 'stroke-width': 2.5 }));
    for (var i = lo; i <= hi; i++) svg.appendChild(S('line', { x1: x(i), y1: y - 5, x2: x(i), y2: y + 5, stroke: '#8c96aa', 'stroke-width': 1.5 }));
    svg.appendChild(S('text', { x: x(0), y: y + 22, 'text-anchor': 'middle', 'font-size': 14, fill: '#4a5a7d' }, '0'));
    values.forEach(function (v, i) {
      if (i) {
        var a = x(values[i - 1]), b = x(v), m = (a + b) / 2;
        svg.appendChild(S('path', { d: 'M' + a + ' ' + (y - 4) + ' Q' + m + ' ' + (y - 46) + ' ' + b + ' ' + (y - 4), fill: 'none', stroke: col, 'stroke-width': 3 }));
        svg.appendChild(S('text', { x: m, y: y - 30, 'text-anchor': 'middle', 'font-size': 15, 'font-weight': 800, fill: col }, '+' + step));
      }
      svg.appendChild(S('circle', { cx: x(v), cy: y, r: 6, fill: col }));
      svg.appendChild(S('text', { x: x(v), y: y + 24, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 800, fill: INK }, String(v)));
    });
    return el('div', { class: 'ssb-jumpbox' }, el('div', { class: 'ssb-jump-h' }, title), svg);
  }
  function jumpLines(upTo) {
    var ps = [], ys = [];
    for (var n = 3; n <= upTo; n++) { var r = rowFor(n); ps.push(r.ps); ys.push(r.ys); }
    return el('div', { class: 'ssb-jumpwrap' },
      jumpLine(ps, 3, COL.bottom, 'Prism straws: count on in 3s'),
      jumpLine(ys, 2, COL.side, 'Pyramid straws: count on in 2s'));
  }

  /* ---------------------------------------------------------------- *
   * Hints for "how many straws / balls?"
   * ---------------------------------------------------------------- */
  function countHint(sc, s, b, strong) {
    var c = counts(sc), n = sc.n, pyr = isPyramidNow(sc);
    if (s === c.straws && b === c.balls) return null;
    if (s === c.balls && b === c.straws && s !== b) {
      return { h: 'Swap them round! Straws are the long sticks. Balls are the round lumps of clay.', tag: 'Mixed up straws and balls' };
    }
    if (s !== c.straws) {
      var groups = pyr
        ? 'Count the ' + n + ' straws round the bottom, then the ' + n + ' sloping up to the top: ' + n + ' + ' + n + '.'
        : 'Count in rings: ' + n + ' on the bottom, ' + n + ' on the top and ' + n + ' standing up: ' + n + ' + ' + n + ' + ' + n + '.';
      if (s < c.straws) return { h: strong ? groups : 'Not enough straws. Some are at the back. Turn the shape and click each straw as you count it.', tag: 'Missed a straw at the back' };
      return { h: strong ? groups : 'Too many straws. Click each straw as you count it, so you do not count one twice.', tag: 'Counted a straw twice' };
    }
    var bgroups = pyr ? n + ' balls round the bottom, plus 1 at the top: ' + n + ' + 1.' : n + ' balls on the bottom and ' + n + ' on the top: ' + n + ' + ' + n + '.';
    if (pyr && b === c.balls - 1) return { h: strong ? bgroups : 'Look right at the top. Did you count the ball where the straws meet?', tag: 'Forgot the ball at the top (apex)' };
    if (b < c.balls) return { h: strong ? bgroups : 'Not enough balls. Turn the shape: some balls are at the back.', tag: 'Missed a ball at the back' };
    return { h: strong ? bgroups : 'Too many balls. Lots of straws meet at one ball, but it is still just 1 ball.', tag: 'Counted a ball twice where straws meet' };
  }

  function strawBallFields(prefix) {
    return [
      { key: 's', label: (prefix || '') + 'Straws' },
      { key: 'b', label: (prefix || '') + 'Clay balls' },
    ];
  }

  /* ---------------------------------------------------------------- *
   * Practice deck
   * ---------------------------------------------------------------- */
  var deck = null;
  function buildDeck() {
    var q = [];
    // Level 1: count a finished skeleton (cube 12/8, triangular prism 9/6, square-based pyramid 8/5)
    U.shuffle([
      { type: 'count', kind: 'prism', n: 4, cube: true },
      { type: 'count', kind: 'prism', n: 3 },
      { type: 'count', kind: 'pyramid', n: 4 },
    ]).forEach(function (x) { q.push(x); });
    // Level 2: the square-based prism and pyramid (12/8 -> 8/5)
    q.push({ type: 'build', n: 4 });
    q.push({ type: 'transform', n: 4 });
    q.push({ type: 'takeaway', n: 4 });
    // Level 3: predict for 5- and 6-sided bases, then check by building
    q.push({ type: 'predict', n: 5 });
    q.push({ type: 'predict', n: 6 });
    return q;
  }
  /** Correct answers (for the tests). */
  function answerOf(q) {
    if (q.type === 'count') { var c = counts(makeScene(q.kind, q.n, q.cube)); return { s: c.straws, b: c.balls }; }
    var r = rowFor(q.n);
    if (q.type === 'build') return { s: r.ps, b: r.pb };
    if (q.type === 'transform') return { s: r.ys, b: r.yb };
    if (q.type === 'takeaway') return { s: r.ps - r.ys, b: r.pb - r.yb };
    return { ps: r.ps, pb: r.pb, ys: r.ys, yb: r.yb };
  }

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */
  function learnBuild(stage, api) {
    api.say('Each straw is one <b>edge</b>. Each clay ball is one <b>vertex</b> (corner). Let\'s build!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Straws are edges, balls are corners', 'Drag a straw from the tray onto a dotted gap between two balls.'));
    var sc = makeScene('prism', 3);
    sc.straws.forEach(function (t) { t.st = 'ghost'; });
    var live;
    var view = skelView(api, sc, {
      tray: true, W: 520, H: 300,
      onChange: function () { live.update(); },
      onMiss: function () { api.feedback('Drop the straw right on a dotted gap.', 'try'); },
      onBuilt: function () {
        api.say('A triangular prism! 3 + 3 + 3 = 9 straws and 3 + 3 = 6 balls.', 'cheer');
        api.feedback('Built! 9 straws (edges) and 6 clay balls (vertices).', 'good');
        api.sound('correct');
        api.unlockNext();
      },
    });
    live = liveCards(sc);
    stage.appendChild(el('div', { class: 'ssb-q', 'data-answer': '9,6' }, split(view.el, live)));
  }

  function learnTransform(stage, api) {
    api.say('Let\'s change this prism into a pyramid with the same base.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Prism to pyramid', 'Take the top off, keep one ball, and lean the straws in to meet it.'));
    var sc = makeScene('prism', 3);
    var live, btn;
    var before = counts(sc);
    var view = skelView(api, sc, {
      W: 520, H: 300,
      onChange: function () { live.update(); },
      onMiss: function () { api.feedback('Pull the green circle right onto the top ball.', 'try'); },
      onLeaned: function () {
        var c = counts(sc);
        api.say('A triangle-based pyramid! We took away 3 straws and 2 balls.', 'cheer');
        api.feedback('Prism ' + before.straws + ' straws, ' + before.balls + ' balls → pyramid ' + c.straws + ' straws, ' + c.balls + ' balls.', 'good');
        api.sound('correct');
        stage.querySelector('.ssb-took').hidden = false;
        api.unlockNext();
      },
    });
    live = liveCards(sc);
    btn = el('button', {
      class: 'btn ssb-big', type: 'button',
      onclick: function () {
        btn.disabled = true;
        api.say('Off come the 3 top straws...');
        var tops = [];
        sc.straws.forEach(function (t, k) { if (t.cat === 'top') tops.push(k); });
        tops.forEach(function (k, i) { api.later(function () { view.removeStraw(k); }, i * 350); });
        api.later(function () {
          api.say('Keep <b>one</b> ball for the top. The other 2 balls go.');
          view.liftTop(function () {
            api.say('Now drag each loose straw (green circle) up to the top ball.', 'think');
            btn.hidden = true;
          });
        }, tops.length * 350 + 400);
      },
    }, '✂️ Take the top off');
    var took = el('div', { class: 'ssb-took', hidden: true },
      el('span', { class: 'ssb-pill ssb-pill-minus' }, '− 3 straws (the top triangle)'),
      el('span', { class: 'ssb-pill ssb-pill-minus' }, '− 2 balls (1 ball kept for the top)'));
    stage.appendChild(el('div', { class: 'ssb-q', 'data-answer': '6,4' }, split(view.el, btn, live, took)));
  }

  function learnTable(stage, api) {
    api.say('Let\'s write our counts in a table. Click each model to drop its numbers in.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Fill the table', 'Then add one more side to the base each time.'));
    var t = tableEl();
    var n = 3;
    var tr = addRow(t, rowFor(3), { blank: true });
    var dropped = { prism: false, pyr: false };
    var minis = el('div', { class: 'ssb-minis' });
    var addBtn = el('button', { class: 'btn ssb-big', type: 'button', hidden: true }, '➕ Add one more side');
    var jumps = el('div', { class: 'ssb-jumpslot' });

    function mini(kind) {
      var sc = makeScene(kind, n);
      var key = kind === 'prism' ? 'prism' : 'pyr';
      var c = counts(sc);
      var box = el('button', { class: 'ssb-mini' + (dropped[key] ? ' ssb-mini-done' : ''), type: 'button', 'data-kind': kind });
      var view = skelView(api, sc, { W: 230, H: 170, turn: false, pad: 18 });
      box.appendChild(view.el);
      box.appendChild(el('div', { class: 'ssb-mini-cap' }, el('b', null, kind === 'prism' ? 'Prism' : 'Pyramid'), ' ' + c.straws + ' straws · ' + c.balls + ' balls'));
      box.addEventListener('click', function () {
        if (dropped[key]) return;
        dropped[key] = true;
        box.classList.add('ssb-mini-done');
        api.sound('pop');
        var row = rowFor(n);
        TCOLS.forEach(function (col) {
          if ((key === 'prism') === (col.key.charAt(0) === 'p')) {
            cellContent(tr.cells2[col.key], row, col, n === 3, true);
            tr.cells2[col.key].classList.add('ssb-pop');
          }
        });
        if (dropped.prism && dropped.pyr) rowDone();
      });
      return box;
    }
    function showMinis() {
      MQ.clear(minis);
      minis.appendChild(mini('prism'));
      minis.appendChild(el('div', { class: 'ssb-arrow' }, '→'));
      minis.appendChild(mini('pyramid'));
    }
    function rowDone() {
      if (n === 3) {
        api.say('Now give the base one more side. What happens?', 'think');
        addBtn.hidden = false;
        return;
      }
      if (n < 6) {
        api.say(n === 4 ? 'Prism straws: 9, then 12. That is 3 more!' : 'Count on: ' + rowFor(n - 1).ps + ', ' + rowFor(n).ps + '... One more side?', 'cheer');
        addBtn.hidden = false;
        return;
      }
      addBtn.hidden = true;
      minis.hidden = true;
      jumps.appendChild(jumpLines(6));
      api.say('Prism straws count on in 3s: 9, 12, 15, 18. Pyramid straws count on in 2s: 6, 8, 10, 12!', 'cheer');
      api.feedback('Each extra side adds 3 straws to the prism (one on the bottom, one on the top, one standing up) and 2 to the pyramid.', 'good');
      api.unlockNext();
    }
    addBtn.addEventListener('click', function () {
      if (n >= 6) return;
      n++;
      addBtn.hidden = true;
      tr = addRow(t, rowFor(n), { working: true });
      tr.classList.add('ssb-pop');
      api.sound('pop');
      showMinis();
      dropped.prism = dropped.pyr = true;
      Array.prototype.forEach.call(minis.querySelectorAll('.ssb-mini'), function (m) { m.classList.add('ssb-mini-done'); });
      rowDone();
    });
    showMinis();
    stage.appendChild(el('div', { class: 'ssb-q ssb-tablewrap' }, minis, t, addBtn, jumps));
  }

  /* ---------------------------------------------------------------- *
   * Practice question renderers
   * ---------------------------------------------------------------- */
  function qCount(stage, api, q) {
    var sc = makeScene(q.kind, q.n, q.cube);
    var name = q.kind === 'prism' ? prismName(q.n, q.cube) : pyrName(q.n);
    api.say('How many straws and how many clay balls? Click each one as you count.', 'think');
    stage.appendChild(MQ.ui.prompt('This <b>' + name + '</b> is made of straws and clay. Count them!'));
    var view = skelView(api, sc, { W: 480, H: 300, mode: 'mark', plain: true });
    var cards = el('div', { class: 'ssb-reveal' });
    var ans = counts(sc);
    var row = answerRow(strawBallFields(), function (vals) {
      var h = countHint(sc, vals.s, vals.b, api.tries() >= 1);
      row.mark('s', vals.s === ans.straws);
      row.mark('b', vals.b === ans.balls);
      if (!h) {
        row.disable();
        view.setPlain(false);
        cards.appendChild(countCards(sc));
        api.check(true, ans.straws + ' straws and ' + ans.balls + ' balls. Brilliant counting!');
      } else api.check(false, h.h, h.tag);
    });
    row.el.onEmpty = function () { api.feedback('Write a number in both boxes.', 'info'); };
    stage.appendChild(el('div', { class: 'ssb-q', 'data-answer': ans.straws + ',' + ans.balls }, split(view.el, row.el, cards)));
    api.onReveal(function () {
      row.set('s', ans.straws); row.set('b', ans.balls);
      row.mark('s', true); row.mark('b', true);
      row.disable();
      view.clearMarks();
      view.setPlain(false);
      cards.appendChild(countCards(sc));
      api.feedback('Count in groups by colour. Straws: ' + ans.straws + '. Balls: ' + ans.balls + '.', 'info');
    });
  }

  function qBuild(stage, api, q) {
    var n = q.n;
    var sc = makeScene('prism', n);
    sc.straws.forEach(function (t) { if (t.cat !== 'bottom') t.st = 'ghost'; });
    api.say('Bolt made the ' + BASE_NAME[n] + ' at the bottom. Drag straws to finish the prism!', 'think');
    stage.appendChild(MQ.ui.prompt('Build a <b>prism with a ' + BASE_NAME[n] + ' base</b>. Then count it.'));
    var ans = { straws: 3 * n, balls: 2 * n };
    var cards = el('div', { class: 'ssb-reveal' });
    var row;
    var built = false;
    var view = skelView(api, sc, {
      tray: true, W: 500, H: 290,
      onMiss: function () { api.feedback('Drop the straw right on a dotted gap.', 'try'); },
      onBuilt: function () { if (!built) showAsk(); },
    });
    var holder = el('div', { class: 'ssb-askslot' });
    function showAsk() {
      built = true;
      var c = counts(sc);
      ans = { straws: c.straws, balls: c.balls };
      api.say('Finished! How many straws and balls does your prism use?', 'think');
      row = answerRow(strawBallFields(), function (vals) {
        var h = countHint(sc, vals.s, vals.b, api.tries() >= 1);
        row.mark('s', vals.s === ans.straws);
        row.mark('b', vals.b === ans.balls);
        if (!h) {
          row.disable();
          cards.appendChild(countCards(sc));
          api.check(true, n + ' + ' + n + ' + ' + n + ' = ' + ans.straws + ' straws, ' + n + ' + ' + n + ' = ' + ans.balls + ' balls!');
        } else api.check(false, h.h, h.tag);
      });
      row.el.onEmpty = function () { api.feedback('Write a number in both boxes.', 'info'); };
      holder.appendChild(row.el);
      row.focus(api);
    }
    stage.appendChild(el('div', { class: 'ssb-q', 'data-answer': 3 * n + ',' + 2 * n }, split(view.el, holder, cards)));
    api.onReveal(function () {
      function fin() {
        if (!row) showAsk();
        row.set('s', ans.straws); row.set('b', ans.balls);
        row.mark('s', true); row.mark('b', true);
        row.disable();
        cards.appendChild(countCards(sc));
        api.feedback('Prism: ' + n + ' + ' + n + ' + ' + n + ' = ' + ans.straws + ' straws, ' + n + ' + ' + n + ' = ' + ans.balls + ' balls.', 'info');
      }
      if (!built) { built = true; view.autoBuild(fin, 120); } else fin();
    });
  }

  function qTransform(stage, api, q) {
    var n = q.n;
    var sc = makeScene('prism', n);
    api.say('Turn this prism into a pyramid. First click each straw on the top to take it off.', 'think');
    stage.appendChild(MQ.ui.prompt('Change the prism into a <b>' + pyrName(n) + '</b>.'));
    var cards = el('div', { class: 'ssb-reveal' });
    var holder = el('div', { class: 'ssb-askslot' });
    var row = null, leaned = false;
    var view = skelView(api, sc, {
      W: 500, H: 300, mode: 'remove',
      onWrongRemove: function (t) {
        api.feedback(t.cat === 'bottom' ? 'That straw is on the bottom. We keep the base!' : 'That straw stands up. It stays: it will lean in later. Click a straw on the top (green).', 'try');
      },
      onTopOff: function () {
        api.say('Keep one ball for the top. The other balls go.');
        view.liftTop(function () {
          api.say('Now drag each loose straw (green circle) to the top ball.', 'think');
        });
      },
      onMiss: function () { api.feedback('Pull the green circle right onto the top ball.', 'try'); },
      onLeaned: function () { if (!leaned) showAsk(); },
    });
    function showAsk() {
      leaned = true;
      api.say('A pyramid! How many straws and clay balls does it have now?', 'think');
      var ans = counts(sc);
      row = answerRow(strawBallFields(), function (vals) {
        row.mark('s', vals.s === ans.straws);
        row.mark('b', vals.b === ans.balls);
        if (vals.s === ans.straws && vals.b === ans.balls) {
          row.disable();
          cards.appendChild(countCards(sc));
          api.check(true, n + ' + ' + n + ' = ' + ans.straws + ' straws and ' + n + ' + 1 = ' + ans.balls + ' balls!');
          return;
        }
        if (vals.s === 3 * n && vals.s !== ans.straws) return api.check(false, 'That is the prism\'s number. We took the ' + n + ' top straws away. Count again.', 'Counted the straws we took away');
        if (vals.s === ans.straws && vals.b === 2 * n) return api.check(false, 'That is the prism\'s number. Only one ball is left at the top. Count again.', 'Counted the balls we took away');
        if (vals.s === ans.straws && vals.b === n) return api.check(false, 'Count the ball right at the top too: the apex!', 'Forgot the ball at the top (apex)');
        var h = countHint(sc, vals.s, vals.b, api.tries() >= 1);
        api.check(false, h.h, h.tag);
      });
      row.el.onEmpty = function () { api.feedback('Write a number in both boxes.', 'info'); };
      holder.appendChild(row.el);
      row.focus(api);
    }
    stage.appendChild(el('div', { class: 'ssb-q', 'data-answer': 2 * n + ',' + (n + 1) }, split(view.el, holder, cards)));
    api.onReveal(function () {
      // only reachable after the shape was changed and two wrong answers
      var ans = counts(sc);
      row.set('s', ans.straws); row.set('b', ans.balls);
      row.mark('s', true); row.mark('b', true);
      row.disable();
      cards.appendChild(countCards(sc));
      api.feedback('Pyramid: ' + n + ' + ' + n + ' = ' + ans.straws + ' straws, ' + n + ' + 1 = ' + ans.balls + ' balls (do not forget the top ball).', 'info');
    });
  }

  function qTakeaway(stage, api, q) {
    var n = q.n;
    var a = makeScene('prism', n);
    var b = makeScene('pyramid', n);
    var ca = counts(a), cb = counts(b);
    var ans = { s: ca.straws - cb.straws, b: ca.balls - cb.balls };
    api.say('Bolt changed the prism into the pyramid. What did he take away?', 'think');
    stage.appendChild(MQ.ui.prompt('How many <b>straws</b> and how many <b>balls</b> were taken away?'));
    var va = skelView(api, a, { W: 300, H: 230, mode: 'mark', pad: 22, turn: false });
    var vb = skelView(api, b, { W: 300, H: 230, mode: 'mark', pad: 22, turn: false });
    var pair = el('div', { class: 'ssb-pair' },
      el('div', { class: 'ssb-pair-item' }, va.el, el('div', { class: 'ssb-mini-cap' }, el('b', null, 'Prism'))),
      el('div', { class: 'ssb-arrow' }, '→'),
      el('div', { class: 'ssb-pair-item' }, vb.el, el('div', { class: 'ssb-mini-cap' }, el('b', null, 'Pyramid'))));
    var work = el('div', { class: 'ssb-reveal' });
    function showWork() {
      MQ.clear(work);
      // show the taken-away parts on the prism in red; the kept ball gets a green ring
      a.straws.forEach(function (t) { if (t.cat === 'top') t.st = 'gone'; });
      var tops = a.balls.filter(function (x) { return x.cat === 'top'; });
      tops.slice(1).forEach(function (x) { x.st = 'gone'; });
      va.keepIdx = a.balls.indexOf(tops[0]);
      va.showGone = true;
      va.clearMarks();
      work.appendChild(el('div', { class: 'ssb-took' },
        el('span', { class: 'ssb-pill ssb-pill-minus' }, '− ' + ans.s + ' straws: the top ' + BASE_NAME[n]),
        el('span', { class: 'ssb-pill ssb-pill-minus' }, '− ' + ans.b + ' balls'),
        el('span', { class: 'ssb-pill ssb-pill-keep' }, '1 top ball is kept: it becomes the apex')));
      work.appendChild(el('div', { class: 'ssb-cards' },
        el('div', { class: 'ssb-card' }, el('div', { class: 'ssb-card-h' }, 'Straws'), el('div', { class: 'ssb-sum' }, ca.straws + ' − ' + ans.s + ' = ' + cb.straws)),
        el('div', { class: 'ssb-card' }, el('div', { class: 'ssb-card-h' }, 'Clay balls'), el('div', { class: 'ssb-sum' }, ca.balls + ' − ' + ans.b + ' = ' + cb.balls))));
    }
    var row = answerRow([{ key: 's', label: 'Straws taken away' }, { key: 'b', label: 'Balls taken away' }], function (vals) {
      row.mark('s', vals.s === ans.s);
      row.mark('b', vals.b === ans.b);
      if (vals.s === ans.s && vals.b === ans.b) {
        row.disable();
        showWork();
        api.check(true, 'Yes! The ' + n + ' top straws went, and ' + ans.b + ' balls. One ball stayed to be the top.');
        return;
      }
      var strong = api.tries() >= 1;
      if (vals.s === ans.s && vals.b === n) return api.check(false, 'Nearly! One of the top balls was kept: it is the point at the top of the pyramid.', 'Forgot we keep one ball for the apex');
      if (vals.s === cb.straws || vals.b === cb.balls) return api.check(false, 'That is how many the pyramid has. How many were taken <b>away</b>? Count up from the pyramid to the prism.', 'Gave the pyramid count, not how many were taken away');
      if (vals.s !== ans.s) return api.check(false, strong ? 'The prism has ' + ca.straws + ' straws, the pyramid has ' + cb.straws + '. Count on from ' + cb.straws + ' to ' + ca.straws + '.' : 'Which straws are missing from the pyramid? Look at the top of the prism.', 'Could not find how many straws were taken away');
      api.check(false, strong ? 'The prism has ' + ca.balls + ' balls, the pyramid has ' + cb.balls + '. Count on from ' + cb.balls + ' to ' + ca.balls + '.' : 'Count the balls on each model, then find the difference.', 'Could not find how many balls were taken away');
    });
    row.el.onEmpty = function () { api.feedback('Write a number in both boxes.', 'info'); };
    stage.appendChild(el('div', { class: 'ssb-q', 'data-answer': ans.s + ',' + ans.b }, pair, row.el, work));
    api.onReveal(function () {
      row.set('s', ans.s); row.set('b', ans.b);
      row.mark('s', true); row.mark('b', true);
      row.disable();
      showWork();
      api.feedback('The top ' + BASE_NAME[n] + ' (' + ans.s + ' straws) and ' + ans.b + ' balls were taken away. One top ball stayed as the apex.', 'info');
    });
  }

  function qPredict(stage, api, q) {
    var n = q.n;
    var row = rowFor(n);
    api.say('Predict first! Use the pattern in the table. Then Bolt builds it to check.', 'think');
    stage.appendChild(MQ.ui.prompt('A base with <b>' + n + ' sides</b> (a ' + BASE_NAME[n] + '). Fill in the new row.'));
    var t = tableEl();
    for (var k = 3; k < n; k++) addRow(t, rowFor(k), { first: k === 3, working: true });
    var tr = addRow(t, row, { blank: true, cls: 'ssb-row-new' });
    var fields = {};
    TCOLS.forEach(function (c) {
      var inp = el('input', { class: 'num-input ssb-in ssb-cell', type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': c.head, placeholder: '?', 'data-key': c.key });
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
      inp.addEventListener('input', function () { inp.classList.remove('bad'); });
      fields[c.key] = inp;
      tr.cells2[c.key].appendChild(inp);
    });
    var btn = el('button', { class: 'btn btn-check ssb-check', type: 'button', onclick: function () { submit(); } }, 'Check by building');
    var sc = makeScene('prism', n);
    sc.straws.forEach(function (t) { if (t.cat !== 'bottom') t.st = 'ghost'; });
    sc.balls.forEach(function (b) { if (b.cat === 'top') b.st = 'ghost'; });
    var live = liveCards(sc);
    live.hidden = true;
    var view = skelView(api, sc, { W: 300, H: 230, hideGhosts: true, turn: false, pad: 20, onChange: function () { live.update(); } });
    var jumps = el('div', { class: 'ssb-jumpslot' });
    var shown = false;
    function finish() {
      TCOLS.forEach(function (c) {
        fields[c.key].value = row[c.key];
        fields[c.key].classList.remove('bad');
        fields[c.key].classList.add('good');
        fields[c.key].disabled = true;
        tr.cells2[c.key].appendChild(el('small', { class: 'ssb-work' }, c.parts(n)));
      });
      btn.disabled = true;
      if (shown) return;
      shown = true;
      live.hidden = false;
      cap.hidden = true;
      api.feedback('Bolt is building the ' + prismName(n) + '...', 'info');
      view.autoBuild(function () {
        api.feedback('Prism: ' + n + ' + ' + n + ' + ' + n + ' = ' + row.ps + ' straws. Now Bolt changes it into a pyramid...', 'info');
        api.later(function () {
          view.autoTransform(function () {
            api.feedback('Pyramid: ' + n + ' + ' + n + ' = ' + row.ys + ' straws and ' + n + ' + 1 = ' + row.yb + ' balls. Just as the table said!', 'good');
            jumps.appendChild(jumpLines(n));
          }, 160);
        }, 700);
      }, 110);
    }
    function submit() {
      if (btn.disabled) return;
      var vals = {}, empty = false;
      TCOLS.forEach(function (c) {
        vals[c.key] = U.parseNum(fields[c.key].value);
        if (isNaN(vals[c.key])) empty = true;
      });
      if (empty) { api.feedback('Write a number in every box of the new row.', 'info'); return; }
      var wrong = TCOLS.filter(function (c) { return vals[c.key] !== row[c.key]; });
      TCOLS.forEach(function (c) {
        fields[c.key].classList.remove('good', 'bad');
        fields[c.key].classList.add(vals[c.key] === row[c.key] ? 'good' : 'bad');
      });
      if (!wrong.length) {
        api.check(true, 'Great prediction! Let\'s build it to check.');
        finish();
        return;
      }
      var strong = api.tries() >= 1;
      var prev = rowFor(n - 1);
      if (vals.yb !== row.yb && vals.yb === n) return api.check(false, 'Pyramid balls: ' + n + ' round the base, and don\'t forget the ball at the top!', 'Forgot the ball at the top (apex)');
      var c0 = wrong[0];
      var what = c0.head.toLowerCase();
      var tag = c0.key === 'ps' ? 'Did not count on in 3s (prism straws)' : c0.key === 'yb' ? 'Did not add 1 more ball (pyramid)' : 'Did not count on in 2s (' + what + ')';
      var countOn = [];
      for (var i = 1; i <= c0.step; i++) countOn.push(prev[c0.key] + i);
      var h = strong
        ? what.charAt(0).toUpperCase() + what.slice(1) + ': ' + prev[c0.key] + ' + ' + c0.step + '. Count on ' + c0.step + ': ' + countOn.join(', ') + '.'
        : what.charAt(0).toUpperCase() + what.slice(1) + ' go up by ' + c0.step + ' each row. Look at the row above: ' + prev[c0.key] + '.';
      api.check(false, h, tag);
    }
    var left = el('div', { class: 'ssb-predict-l' }, t, btn);
    var cap = el('div', { class: 'ssb-mini-cap' }, 'Bolt\'s ' + BASE_NAME[n] + ' base: ' + n + ' straws, ' + n + ' balls');
    var right = el('div', { class: 'ssb-predict-r' }, view.el, cap, live);
    stage.appendChild(el('div', { class: 'ssb-q', 'data-answer': [row.ps, row.pb, row.ys, row.yb].join(',') }, el('div', { class: 'ssb-predict' }, left, right), jumps));
    api.onReveal(function () {
      api.feedback('Count on from the row above: +3, +2, +2, +1.', 'info');
      finish();
    });
    api.later(function () { try { fields.ps.focus({ preventScroll: true }); } catch (e) {} }, 60);
  }

  MQ.register(ID, {
    learn: [learnBuild, learnTransform, learnTable],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'count') return qCount(stage, api, q);
        if (q.type === 'build') return qBuild(stage, api, q);
        if (q.type === 'transform') return qTransform(stage, api, q);
        if (q.type === 'takeaway') return qTakeaway(stage, api, q);
        return qPredict(stage, api, q);
      },
    },
  });
  // test hooks (read-only)
  MQ.ssbTest = { buildDeck: buildDeck, answerOf: answerOf, rowFor: rowFor, counts: counts, makeScene: makeScene, deck: function () { return deck; } };

  var css = [
    '.ssb-q{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}',
    '.ssb-view{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%}',
    '.ssb-svg{width:100%;height:auto;display:block;background:#fbfcfe;border:2px solid var(--line);border-radius:16px;user-select:none;-webkit-user-select:none}',
    '.ssb-tray{cursor:grab}',
    '.ssb-tray-text{pointer-events:none}',
    '.ssb-grip{cursor:grab}',
    '.ssb-hit{cursor:pointer}',
    '.ssb-apex-target{animation:ssbPulse 1.2s ease-in-out infinite}',
    '@keyframes ssbPulse{50%{opacity:.35}}',
    '.ssb-turn{display:flex;gap:8px;justify-content:center}',
    '.ssb-turn-btn{padding:6px 14px;font-size:1rem;min-height:0}',
    '.ssb-big{font-size:1.15rem}',
    '.ssb-cards{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.ssb-card{background:#fff;border:2px solid var(--line);border-radius:14px;padding:6px 12px;text-align:center}',
    '.ssb-card-h{font-weight:800;color:var(--ink-soft);font-size:.9rem}',
    '.ssb-sum{display:flex;align-items:center;gap:6px;justify-content:center;font-size:1.25rem;font-weight:800;flex-wrap:wrap}',
    '.ssb-part{display:inline-flex;flex-direction:column;align-items:center;min-width:44px;padding:2px 8px;border-radius:10px;border:3px solid var(--c);background:#fff;line-height:1.1}',
    '.ssb-part b{font-size:1.3rem;color:var(--c)}',
    '.ssb-part small{font-size:.7rem;color:var(--ink-soft);font-weight:700}',
    '.ssb-op{color:var(--ink-soft)}',
    '.ssb-total{background:#fff3cd;border:2px solid var(--gold);border-radius:10px;padding:4px 12px;font-size:1.4rem}',
    '.ssb-answers{display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap;justify-content:center}',
    '.ssb-field{display:flex;flex-direction:column;align-items:center;gap:2px;font-weight:800}',
    '.ssb-field-l{font-size:1rem}',
    '.ssb-in{width:96px;height:54px}',
    '.ssb-check{height:54px}',
    '.ssb-askslot:empty,.ssb-reveal:empty,.ssb-jumpslot:empty{display:none}',
    '.ssb-took{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.ssb-took[hidden]{display:none}',
    '.ssb-pill{border-radius:999px;padding:5px 14px;font-weight:800;font-size:1rem}',
    '.ssb-pill-minus{background:#fff0f0;border:2px solid #ffa8a8;color:#c92a2a}',
    '.ssb-pill-keep{background:#ebfbee;border:2px solid #8ce99a;color:#2b8a3e}',
    '.ssb-table{border-collapse:separate;border-spacing:0;background:#fff;border:2px solid var(--line);border-radius:14px;overflow:hidden;font-size:1.05rem}',
    '.ssb-table th{background:var(--paper-2);padding:6px 8px;font-size:.85rem;line-height:1.15}',
    '.ssb-table th.ssb-th-prism{background:#e7f1ff}',
    '.ssb-table th.ssb-th-pyr{background:#fff1e0}',
    '.ssb-table td{border-top:2px solid var(--paper-2);padding:6px 8px;text-align:center;min-width:68px;vertical-align:middle}',
    '.ssb-sides{font-weight:800;font-size:1.25rem}',
    '.ssb-sides small{display:block;font-size:.7rem;color:var(--ink-soft);font-weight:700}',
    '.ssb-num{font-size:1.4rem;font-weight:800}',
    '.ssb-step{display:inline-block;font-size:.72rem;font-weight:800;color:#2b8a3e;background:#ebfbee;border-radius:8px;padding:1px 5px;margin-right:4px;vertical-align:middle}',
    '.ssb-work{display:block;font-size:.72rem;color:var(--ink-soft);font-weight:700}',
    '.ssb-cell{width:70px;height:48px;font-size:1.35rem}',
    '.ssb-row-new td{background:#fffbe6}',
    '.ssb-pop{animation:ssbPop .35s ease}',
    '@keyframes ssbPop{0%{transform:scale(.8);opacity:.2}100%{transform:scale(1);opacity:1}}',
    '.ssb-minis,.ssb-pair{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.ssb-minis[hidden]{display:none}',
    '.ssb-mini{border:3px solid var(--line);border-radius:16px;background:#fff;padding:6px;cursor:pointer;font:inherit;color:inherit;width:230px;max-width:42vw}',
    '.ssb-mini:hover{border-color:var(--accent)}',
    '.ssb-mini .ssb-svg{border:0}',
    '.ssb-mini-done{border-color:var(--good);background:var(--good-bg);cursor:default}',
    '.ssb-mini-cap{font-size:.95rem;text-align:center}',
    '.ssb-pair-item{width:300px;max-width:44vw}',
    '.ssb-arrow{font-size:2rem;font-weight:800;color:var(--ink-soft)}',
    '.ssb-predict{display:flex;gap:14px;align-items:flex-start;justify-content:center;flex-wrap:wrap;width:100%}',
    '.ssb-predict-l{display:flex;flex-direction:column;align-items:center;gap:10px;max-width:100%}',
    '.ssb-predict-r{display:flex;flex-direction:column;align-items:center;gap:8px;width:300px;max-width:100%}',
    '.ssb-split{display:flex;gap:16px;align-items:center;justify-content:center;flex-wrap:wrap;width:100%}',
    '.ssb-left{flex:1 1 380px;max-width:480px;min-width:0}',
    '.ssb-side{flex:0 1 350px;display:flex;flex-direction:column;align-items:center;gap:10px;min-width:0}',
    '.ssb-side .ssb-cards{flex-direction:column;align-items:center}',
    '.ssb-side .ssb-answers{gap:8px}',
    '.ssb-side .ssb-sum{flex-wrap:nowrap;gap:4px}',
    '.ssb-side .ssb-part{padding:2px 5px;min-width:40px}',
    '.ssb-jumpwrap{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;width:100%}',
    '.ssb-jumpbox{background:#fff;border:2px solid var(--line);border-radius:14px;padding:4px 10px;width:100%;max-width:420px}',
    '.ssb-jump-h{font-weight:800;font-size:.95rem;text-align:center}',
    '.ssb-jumps{width:100%;height:auto;display:block}',
    '@media (max-width:640px){.ssb-table td{min-width:0;padding:4px}.ssb-cell{width:54px}.ssb-in{width:80px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

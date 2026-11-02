/* Balance It! — pan balance puzzles and sensible mass estimates (Unit 13.1 Mass).
 * A level balance means both sides have the same mass. Halving is shown as a bar cut in
 * half (and in half again), never with a division sign. "Take the same off both sides"
 * is done by clicking one matching item on each side; the beam stays level.
 * Every puzzle is generated so that one item is a whole number of grams, and the
 * numbers on screen come from the same data that is drawn on the balance.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  /* ------------------------------------------------------------------ *
   * Everyday things that sit on the pans. draw() returns a <g> whose bottom
   * centre is (0, 0). w/h = footprint used for stacking on a pan.
   * ------------------------------------------------------------------ */
  function leaf(x, y) {
    return S('path', { d: 'M' + x + ',' + y + ' q9,-8 14,-2 q-8,6 -14,2z', fill: '#4caf50' });
  }
  function stem(x, y, h) {
    return S('rect', { x: x - 1.5, y: y, width: 3, height: h, rx: 1.5, fill: '#6b4423' });
  }
  var KINDS = {
    apple: {
      one: 'apple', many: 'apples', w: 40, h: 44, min: 70, max: 100,
      draw: function () {
        return S('g', null, stem(0, -44, 9), leaf(2, -39),
          S('circle', { cx: 0, cy: -19, r: 18, fill: '#e5484d' }),
          S('ellipse', { cx: -7, cy: -25, rx: 4, ry: 6, fill: 'rgba(255,255,255,.35)' }));
      },
    },
    pear: {
      one: 'pear', many: 'pears', w: 38, h: 48, min: 70, max: 100,
      draw: function () {
        return S('g', null, stem(0, -48, 8), leaf(2, -43),
          S('path', { d: 'M0,-42 C7,-42 8,-33 10,-27 C19,-21 20,0 0,0 C-20,0 -19,-21 -10,-27 C-8,-33 -7,-42 0,-42Z', fill: '#a9cf54' }),
          S('ellipse', { cx: -7, cy: -14, rx: 3.5, ry: 6, fill: 'rgba(255,255,255,.35)' }));
      },
    },
    peach: {
      one: 'peach', many: 'peaches', w: 40, h: 42, min: 70, max: 100,
      draw: function () {
        return S('g', null, leaf(1, -37),
          S('circle', { cx: 0, cy: -19, r: 18, fill: '#ffa36c' }),
          S('path', { d: 'M1,-36 q-7,17 0,34', stroke: '#e07a45', 'stroke-width': 2, fill: 'none' }),
          S('ellipse', { cx: -8, cy: -24, rx: 3.5, ry: 5.5, fill: 'rgba(255,255,255,.35)' }));
      },
    },
    orange: {
      one: 'orange', many: 'oranges', w: 40, h: 42, min: 70, max: 100,
      draw: function () {
        return S('g', null, leaf(1, -37),
          S('circle', { cx: 0, cy: -19, r: 18, fill: '#ff9f1c' }),
          S('circle', { cx: 6, cy: -14, r: 1.4, fill: '#e08600' }),
          S('circle', { cx: -4, cy: -9, r: 1.4, fill: '#e08600' }),
          S('circle', { cx: 8, cy: -26, r: 1.4, fill: '#e08600' }),
          S('ellipse', { cx: -7, cy: -25, rx: 3.5, ry: 5.5, fill: 'rgba(255,255,255,.35)' }));
      },
    },
    plum: {
      one: 'plum', many: 'plums', w: 34, h: 42, min: 40, max: 70,
      draw: function () {
        return S('g', null, stem(0, -42, 7),
          S('ellipse', { cx: 0, cy: -18, rx: 15, ry: 18, fill: '#7b4fa0' }),
          S('path', { d: 'M2,-35 q-5,16 0,32', stroke: '#5e3a7d', 'stroke-width': 1.6, fill: 'none' }),
          S('ellipse', { cx: -6, cy: -24, rx: 3, ry: 5, fill: 'rgba(255,255,255,.3)' }));
      },
    },
    muffin: {
      one: 'muffin', many: 'muffins', w: 42, h: 38, min: 40, max: 70,
      draw: function () {
        return S('g', null,
          S('path', { d: 'M-17,-20 L17,-20 L13,0 L-13,0Z', fill: '#74b3e8' }),
          S('path', { d: 'M-9,-20 L-7,0 M0,-20 L0,0 M9,-20 L7,0', stroke: '#4f93cf', 'stroke-width': 1.6 }),
          S('path', { d: 'M-20,-18 C-23,-40 23,-40 20,-18 Z', fill: '#b5703a' }),
          S('circle', { cx: -7, cy: -27, r: 2, fill: '#5a3418' }),
          S('circle', { cx: 5, cy: -31, r: 2, fill: '#5a3418' }),
          S('circle', { cx: 9, cy: -23, r: 2, fill: '#5a3418' }));
      },
    },
    egg: {
      one: 'egg', many: 'eggs', w: 32, h: 38, min: 40, max: 60,
      draw: function () {
        return S('g', null,
          S('path', { d: 'M0,-38 C10,-38 15,-18 14,-11 C13,-3 7,0 0,0 C-7,0 -13,-3 -14,-11 C-15,-18 -10,-38 0,-38Z', fill: '#fdf3e1', stroke: '#d9c7a5', 'stroke-width': 1.5 }),
          S('ellipse', { cx: -5, cy: -24, rx: 3, ry: 5, fill: '#fff' }));
      },
    },
    strawberry: {
      one: 'strawberry', many: 'strawberries', w: 34, h: 38, min: 10, max: 30,
      draw: function () {
        var g = S('g', null,
          S('path', { d: 'M0,0 C-16,-8 -17,-26 -12,-30 C-6,-34 6,-34 12,-30 C17,-26 16,-8 0,0Z', fill: '#e63946' }),
          S('path', { d: 'M-11,-31 L-4,-34 L0,-38 L4,-34 L11,-31 L3,-30 L0,-27 L-3,-30Z', fill: '#2f9e44' }));
        [[-6, -22], [4, -24], [-2, -14], [7, -15], [-8, -12], [1, -6]].forEach(function (p) {
          g.appendChild(S('circle', { cx: p[0], cy: p[1], r: 1.2, fill: '#ffd166' }));
        });
        return g;
      },
    },
    biscuit: {
      one: 'biscuit', many: 'biscuits', w: 36, h: 34, min: 10, max: 30,
      draw: function () {
        var g = S('g', null, S('circle', { cx: 0, cy: -16, r: 16, fill: '#e0b46c', stroke: '#c9934a', 'stroke-width': 2 }));
        [[-6, -21], [5, -24], [-1, -13], [7, -11], [-8, -10]].forEach(function (p) {
          g.appendChild(S('circle', { cx: p[0], cy: p[1], r: 2, fill: '#6b3e26' }));
        });
        return g;
      },
    },
    book: {
      one: 'book', many: 'books', w: 88, h: 28,
      draw: function () {
        return S('g', null,
          S('rect', { x: -44, y: -28, width: 88, height: 28, rx: 4, fill: '#d64545' }),
          S('rect', { x: -40, y: -10, width: 82, height: 7, fill: '#fffaf0' }),
          S('rect', { x: -44, y: -28, width: 8, height: 28, rx: 3, fill: '#a83232' }),
          S('rect', { x: -22, y: -23, width: 44, height: 8, rx: 2, fill: '#f6c3c3' }));
      },
    },
    sock: {
      one: 'sock', many: 'socks', w: 52, h: 50,
      draw: function () {
        return S('g', null,
          S('path', { d: 'M-14,-50 H8 V-22 C8,-14 12,-12 20,-11 C30,-10 30,0 20,0 H-6 C-18,0 -18,-10 -14,-18Z', fill: '#4dabf7' }),
          S('rect', { x: -14, y: -50, width: 22, height: 8, fill: '#1c7ed6' }),
          S('rect', { x: -14, y: -36, width: 22, height: 4, fill: '#a5d8ff' }));
      },
    },
    choc: {
      one: 'chocolate bar', many: 'chocolate bars', w: 80, h: 26, weight: true,
      draw: function (mass) {
        return S('g', null,
          S('rect', { x: -40, y: -26, width: 80, height: 26, rx: 4, fill: '#6b3e26' }),
          S('rect', { x: -25, y: -26, width: 50, height: 26, fill: '#7b2cbf' }),
          S('text', { x: 0, y: -8, class: 'bp-wtext' }, mass + ' g'));
      },
    },
    weight: {
      one: 'weight', many: 'weights', h: 42, weight: true,
      width: function (mass) {
        return 50 + Math.round((mass / 200) * 22);
      },
      draw: function (mass) {
        var w = this.width(mass);
        var h = 32;
        return S('g', null,
          S('rect', { x: -9, y: -h - 9, width: 18, height: 12, rx: 4, fill: '#56637a' }),
          S('polygon', { points: [-w / 2, 0, w / 2, 0, w / 2 - 7, -h, -w / 2 + 7, -h].join(' '), fill: '#6c7a91' }),
          S('text', { x: 0, y: -10, class: 'bp-wtext' }, mass + ' g'));
      },
    },
  };
  var FOOD = ['apple', 'pear', 'peach', 'orange', 'plum', 'muffin', 'egg', 'strawberry', 'biscuit'];

  function widthOf(kind, mass) {
    var k = KINDS[kind];
    return k.width ? k.width(mass) : k.w;
  }
  function word(kind, n) {
    return n === 1 ? KINDS[kind].one : KINDS[kind].many;
  }

  /* ------------------------------------------------------------------ *
   * Pan balance. Pans sit on posts at the beam ends; the beam tilts towards
   * the heavier side and is level when both sides have the same mass.
   * ------------------------------------------------------------------ */
  var PX = 340; // pivot x
  var PY = 236; // pivot y
  var LB = 220; // half beam length
  var POST = 26; // post from beam to pan
  var PAN_W = 200;

  function makeBalance(opts) {
    opts = opts || {};
    var H = opts.height || 300;
    var later = opts.later;
    var root = S('svg', { viewBox: '0 0 680 ' + H, class: 'bp-svg', role: 'img', 'aria-label': 'A pan balance' });
    // stand
    root.appendChild(S('rect', { x: PX - 90, y: 282, width: 180, height: 14, rx: 7, fill: '#9aa6bb' }));
    root.appendChild(S('polygon', { points: [PX - 14, 284, PX + 14, 284, PX + 7, PY, PX - 7, PY].join(' '), fill: '#b3bdd0' }));
    root.appendChild(S('rect', { x: PX - 30, y: PY + 16, width: 60, height: 26, rx: 6, fill: '#ffffff', stroke: '#b3bdd0', 'stroke-width': 2 }));
    root.appendChild(S('line', { x1: PX, y1: PY + 16, x2: PX, y2: PY + 28, stroke: '#2f9e44', 'stroke-width': 3 }));
    root.appendChild(S('line', { x1: PX - 20, y1: PY + 18, x2: PX - 17, y2: PY + 25, stroke: '#b3bdd0', 'stroke-width': 2 }));
    root.appendChild(S('line', { x1: PX + 20, y1: PY + 18, x2: PX + 17, y2: PY + 25, stroke: '#b3bdd0', 'stroke-width': 2 }));
    var beam = S('g', { class: 'bp-beam' });
    beam.style.transformOrigin = PX + 'px ' + PY + 'px';
    beam.appendChild(S('line', { x1: PX, y1: PY, x2: PX, y2: PY + 38, stroke: '#e8590c', 'stroke-width': 4, 'stroke-linecap': 'round' }));
    beam.appendChild(S('rect', { x: PX - LB - 12, y: PY - 7, width: 2 * LB + 24, height: 14, rx: 7, fill: '#8d99ae' }));
    beam.appendChild(S('circle', { cx: PX, cy: PY, r: 10, fill: '#56637a' }));
    root.appendChild(beam);

    function makePan(x) {
      var outer = S('g', { transform: 'translate(' + x + ',' + PY + ')' });
      var inner = S('g', { class: 'bp-pan' });
      inner.appendChild(S('rect', { x: -6, y: -POST - 2, width: 12, height: POST + 4, fill: '#8d99ae' }));
      inner.appendChild(S('circle', { cx: 0, cy: 0, r: 6, fill: '#56637a' }));
      inner.appendChild(S('path', { d: 'M' + -PAN_W / 2 + ',' + (-POST - 12) + ' H' + PAN_W / 2 + ' L' + (PAN_W / 2 - 14) + ',' + -POST + ' H' + (-PAN_W / 2 + 14) + ' Z', fill: '#c9d3e3', stroke: '#9aa6bb', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
      var itemsG = S('g', { transform: 'translate(0,' + (-POST - 12) + ')' });
      inner.appendChild(itemsG);
      outer.appendChild(inner);
      root.appendChild(outer);
      return { outer: outer, inner: inner, itemsG: itemsG, list: [] };
    }
    var sides = { L: makePan(PX - LB), R: makePan(PX + LB) };

    var b = {
      svg: root,
      sides: sides,
      onClickItem: null,
      makeItem: function (kind, mass, tag) {
        var k = KINDS[kind];
        var node = S('g', { class: 'bp-item' + (k.weight ? ' bp-weight' : '') });
        var lift = S('g', { class: 'bp-lift' });
        lift.appendChild(k.draw.call(k, mass));
        node.appendChild(lift);
        var it = { kind: kind, mass: mass, node: node, lift: lift, w: widthOf(kind, mass), h: k.h, weight: !!k.weight, lifted: false, gone: false, side: null, tagG: null };
        if (tag != null) b.tag(it, tag);
        node.addEventListener('click', function () {
          if (b.onClickItem && it.side) b.onClickItem(it);
        });
        return it;
      },
      tag: function (it, text) {
        if (it.weight) return;
        if (it.tagG) it.lift.removeChild(it.tagG);
        var w = Math.max(30, String(text).length * 8 + 10);
        it.tagG = S('g', { class: 'bp-tag' },
          S('rect', { x: -w / 2, y: -it.h / 2 - 10, width: w, height: 20, rx: 10 }),
          S('text', { x: 0, y: -it.h / 2 + 5 }, String(text)));
        it.lift.appendChild(it.tagG);
      },
      add: function (side, it) {
        it.side = side;
        sides[side].list.push(it);
        sides[side].itemsG.appendChild(it.node);
        b.layout(side);
        return it;
      },
      fill: function (side, kind, n, mass, tag) {
        var out = [];
        for (var i = 0; i < n; i++) out.push(b.add(side, b.makeItem(kind, mass, typeof tag === 'function' ? tag(i) : tag)));
        return out;
      },
      live: function (side) {
        return sides[side].list.filter(function (it) {
          return !it.gone;
        });
      },
      mass: function (side) {
        return b.live(side).reduce(function (s, it) {
          return s + (it.lifted ? 0 : it.mass);
        }, 0);
      },
      layout: function (side) {
        var list = b.live(side);
        var rows = [[]];
        var used = 0;
        list.forEach(function (it) {
          var w = it.w + 6;
          if (rows[rows.length - 1].length && used + w > PAN_W - 4) {
            rows.push([]);
            used = 0;
          }
          rows[rows.length - 1].push(it);
          used += w;
        });
        var y = 0;
        rows.forEach(function (row) {
          var tot = row.reduce(function (s, it) {
            return s + it.w + 6;
          }, 0);
          var x = -tot / 2;
          var rh = 0;
          row.forEach(function (it) {
            it.node.setAttribute('transform', 'translate(' + (x + (it.w + 6) / 2) + ',' + y + ')');
            x += it.w + 6;
            rh = Math.max(rh, it.h);
          });
          y -= rh + 1;
        });
      },
      angle: function () {
        var l = b.mass('L');
        var r = b.mass('R');
        if (l === r) return 0;
        var d = r - l;
        return (d > 0 ? 1 : -1) * Math.min(9, 3 + (8 * Math.abs(d)) / Math.max(l, r));
      },
      update: function () {
        var a = b.angle();
        var rad = (a * Math.PI) / 180;
        var dx = LB * (1 - Math.cos(rad));
        var dy = LB * Math.sin(rad);
        beam.style.transform = 'rotate(' + a + 'deg)';
        sides.L.inner.style.transform = 'translate(' + dx + 'px,' + -dy + 'px)';
        sides.R.inner.style.transform = 'translate(' + -dx + 'px,' + dy + 'px)';
        root.setAttribute('data-tilt', a === 0 ? 'level' : a < 0 ? 'left' : 'right');
        return a;
      },
      setLifted: function (it, on) {
        it.lifted = on;
        it.lift.classList.toggle('bp-lifted', on);
      },
      /** Take one item off each side (they float away); the beam stays level. */
      removePair: function (a, c) {
        [a, c].forEach(function (it) {
          it.gone = true;
          it.lifted = false;
          it.lift.classList.remove('bp-lifted');
          it.lift.classList.add('bp-gone');
        });
        b.update();
        later(function () {
          [a, c].forEach(function (it) {
            if (it.node.parentNode) it.node.parentNode.removeChild(it.node);
          });
          b.layout('L');
          b.layout('R');
        }, 450);
      },
      /** Matching non-weight items still on both sides: [[left, right], ...] */
      pairs: function () {
        var out = [];
        var rightLeft = b.live('R').filter(function (it) {
          return !it.weight;
        });
        b.live('L').forEach(function (it) {
          if (it.weight) return;
          for (var i = 0; i < rightLeft.length; i++) {
            if (rightLeft[i].kind === it.kind) {
              out.push([it, rightLeft[i]]);
              rightLeft.splice(i, 1);
              return;
            }
          }
        });
        return out;
      },
    };
    return b;
  }

  /**
   * Click-to-remove: click an item on one side (it lifts and the scale tips), then the same
   * kind of item on the other side: both come off and the scale is level again.
   * cb: { pair(), lift(it), noMatch(it), weight(it), put(it) }
   */
  function enablePairs(b, cb) {
    var on = true;
    b.svg.classList.add('bp-clickable');
    b.onClickItem = function (it) {
      if (!on || it.gone) return;
      if (it.weight) {
        if (cb.weight) cb.weight(it);
        return;
      }
      if (it.lifted) {
        b.setLifted(it, false);
        b.update();
        if (cb.put) cb.put(it);
        return;
      }
      var other = it.side === 'L' ? 'R' : 'L';
      b.live(it.side).forEach(function (o) {
        if (o.lifted) b.setLifted(o, false);
      });
      var partner = b.live(other).filter(function (o) {
        return o.lifted && o.kind === it.kind;
      })[0];
      if (partner) {
        MQ.sound('pop');
        b.removePair(partner, it);
        if (cb.pair) cb.pair();
        return;
      }
      var any = b.live(other).some(function (o) {
        return o.kind === it.kind;
      });
      if (!any) {
        b.update();
        if (cb.noMatch) cb.noMatch(it);
        return;
      }
      b.live(other).forEach(function (o) {
        if (o.lifted) b.setLifted(o, false);
      });
      b.setLifted(it, true);
      MQ.sound('click');
      b.update();
      if (cb.lift) cb.lift(it);
    };
    return {
      off: function () {
        on = false;
        b.svg.classList.remove('bp-clickable');
        b.live('L').concat(b.live('R')).forEach(function (o) {
          if (o.lifted) b.setLifted(o, false);
        });
        b.update();
      },
    };
  }

  /** Remove every matching pair, one pair at a time (for hints and "Show me"). */
  function autoRemove(b, later, done) {
    b.live('L').concat(b.live('R')).forEach(function (o) {
      if (o.lifted) b.setLifted(o, false);
    });
    b.update();
    var pairs = b.pairs();
    var i = 0;
    function step() {
      if (i >= pairs.length) {
        if (done) later(done, pairs.length ? 500 : 0);
        return;
      }
      var p = pairs[i++];
      b.setLifted(p[0], true);
      b.setLifted(p[1], true);
      later(function () {
        b.removePair(p[0], p[1]);
        later(step, 550);
      }, 350);
    }
    step();
  }

  /* ------------------------------------------------------------------ *
   * Halving bar: a bar for the whole mass, cut in half, then in half again.
   * rows[k] has 2^k equal pieces. Each row can be hidden, shown with "?" or with values.
   * ------------------------------------------------------------------ */
  function makeHalver(total, parts, kind) {
    var steps = parts === 4 ? 2 : parts === 2 ? 1 : 0;
    var BW = 400;
    var RH = 34;
    var GAP = 12;
    var ICON = kind ? 50 : 0;
    var H = (steps + 1) * (RH + GAP) + ICON;
    var root = S('svg', { viewBox: '0 0 420 ' + H, class: 'bp-halver', role: 'img', 'aria-label': 'Halving bar' });
    var rows = [];
    for (var k = 0; k <= steps; k++) {
      var n = 1 << k;
      var g = S('g', { class: 'bp-hrow' + (k ? ' bp-hide' : '') });
      var pw = (BW - (n - 1) * 6) / n;
      var labels = [];
      for (var i = 0; i < n; i++) {
        var x = 10 + i * (pw + 6);
        var y = k * (RH + GAP);
        g.appendChild(S('rect', { x: x, y: y, width: pw, height: RH, rx: 8, class: 'bp-hbar bp-hbar' + k }));
        var t = S('text', { x: x + pw / 2, y: y + RH / 2 + 7, class: 'bp-htext' }, total / n + ' g');
        labels.push(t);
        g.appendChild(t);
      }
      root.appendChild(g);
      rows.push({ g: g, labels: labels, value: total / n });
    }
    var icons = S('g', { class: 'bp-hide' });
    if (kind) {
      var last = 1 << steps;
      var pw2 = (BW - (last - 1) * 6) / last;
      for (var j = 0; j < last; j++) {
        var cx = 10 + j * (pw2 + 6) + pw2 / 2;
        var ic = S('g', { transform: 'translate(' + cx + ',' + (H - 2) + ') scale(0.9)' });
        ic.appendChild(KINDS[kind].draw());
        icons.appendChild(ic);
      }
      root.appendChild(icons);
    }
    var hv = {
      el: root,
      steps: steps,
      shown: 0,
      /** mode: 'hide' | 'q' | 'val' */
      setRow: function (k, mode) {
        var r = rows[k];
        r.g.classList.toggle('bp-hide', mode === 'hide');
        r.labels.forEach(function (t) {
          t.textContent = mode === 'q' ? '?' : r.value + ' g';
        });
        if (mode !== 'hide') hv.shown = Math.max(hv.shown, k);
        if (k === steps) icons.classList.toggle('bp-hide', mode === 'hide');
      },
      /** Show the next row with values. Returns true when the last row is showing. */
      cut: function () {
        if (hv.shown < steps) hv.setRow(hv.shown + 1, 'val');
        else hv.setRow(steps, 'val');
        return hv.shown >= steps;
      },
      /** Animate every row with values, one after another. */
      playAll: function (later, done) {
        var k = 0;
        function step() {
          hv.setRow(k, 'val');
          k++;
          if (k <= steps) later(step, 650);
          else if (done) later(done, 300);
        }
        step();
      },
    };
    if (steps === 0 && kind) icons.classList.remove('bp-hide');
    return hv;
  }

  /** Bar model for "total minus the known part". */
  function makePartBar(total, known, unknown, kindA, kindB) {
    var BW = 400;
    var root = S('svg', { viewBox: '0 0 420 136', class: 'bp-halver', role: 'img', 'aria-label': 'Bar model' });
    root.appendChild(S('rect', { x: 10, y: 0, width: BW, height: 34, rx: 8, class: 'bp-hbar bp-hbar0' }));
    root.appendChild(S('text', { x: 10 + BW / 2, y: 24, class: 'bp-htext' }, total + ' g'));
    var wa = (BW * known) / total;
    root.appendChild(S('rect', { x: 10, y: 46, width: wa - 3, height: 34, rx: 8, class: 'bp-hbar bp-hbar1' }));
    root.appendChild(S('text', { x: 10 + wa / 2, y: 70, class: 'bp-htext' }, known + ' g'));
    root.appendChild(S('rect', { x: 10 + wa + 3, y: 46, width: BW - wa - 3, height: 34, rx: 8, class: 'bp-hbar bp-hbar2' }));
    var q = S('text', { x: 10 + wa + (BW - wa) / 2, y: 70, class: 'bp-htext' }, '?');
    root.appendChild(q);
    var ia = S('g', { transform: 'translate(' + (10 + wa / 2) + ',132) scale(0.9)' });
    ia.appendChild(KINDS[kindA].draw());
    var ib = S('g', { transform: 'translate(' + (10 + wa + (BW - wa) / 2) + ',132) scale(0.9)' });
    ib.appendChild(KINDS[kindB].draw());
    root.appendChild(ia);
    root.appendChild(ib);
    return {
      el: root,
      show: function () {
        q.textContent = unknown + ' g';
      },
    };
  }

  /* ------------------------------------------------------------------ *
   * Sensible-estimate items: three options that differ by a unit or by ×10;
   * only one is sensible. (No carrot 18 g or pumpkin 3 kg vs 13 kg: the
   * workbook versions of those are doubtful, so the options here are clear.)
   * ------------------------------------------------------------------ */
  var SENSE = [
    { id: 'sweet', name: 'a wrapped sweet', icon: '🍬', opts: [[4, 'g'], [400, 'g'], [4, 'kg']], ans: 0, why: 'A sweet is tiny. It is about as heavy as 4 paper clips: 4 g.' },
    { id: 'cupcake', name: 'a cupcake', icon: '🧁', opts: [[70, 'g'], [700, 'g'], [7, 'kg']], ans: 0, why: 'A cupcake is a bit lighter than an apple: about 70 g.' },
    { id: 'tin', name: 'a tin of beans', icon: '🥫', opts: [[5, 'g'], [500, 'g'], [5, 'kg']], ans: 1, why: 'A tin of beans is about as heavy as 5 apples: about 500 g.' },
    { id: 'carrot', name: 'a carrot', icon: '🥕', opts: [[8, 'g'], [80, 'g'], [8, 'kg']], ans: 1, why: 'A carrot is a bit lighter than an apple: about 80 g.' },
    { id: 'sheep', name: 'a sheep', icon: '🐑', opts: [[9, 'g'], [90, 'g'], [90, 'kg']], ans: 2, why: 'A sheep is heavier than you! About 90 kg.' },
    { id: 'feather', name: 'a feather', icon: '🪶', opts: [[1, 'g'], [1, 'kg'], [10, 'kg']], ans: 0, sizeTrap: true, why: 'A feather floats in the air. It is as light as a paper clip: about 1 g.' },
    { id: 'frog', name: 'a frog', icon: '🐸', opts: [[30, 'g'], [3, 'kg'], [30, 'kg']], ans: 0, why: 'A frog sits in your hand. It is lighter than an apple: about 30 g.' },
    { id: 'rabbit', name: 'a pet rabbit', icon: '🐇', opts: [[2, 'g'], [20, 'g'], [2, 'kg']], ans: 2, why: 'A pet rabbit is about as heavy as 2 bags of sugar: about 2 kg.' },
    { id: 'pumpkin', name: 'a big pumpkin', icon: '🎃', opts: [[4, 'g'], [40, 'g'], [4, 'kg']], ans: 2, why: 'You need two hands to lift a pumpkin. About 4 kg.' },
    { id: 'phone', name: 'a mobile phone', icon: '📱', opts: [[1, 'g'], [150, 'g'], [15, 'kg']], ans: 1, why: 'A phone is a bit heavier than an apple: about 150 g.' },
    { id: 'bag', name: 'a full school bag', icon: '🎒', opts: [[3, 'g'], [30, 'g'], [3, 'kg']], ans: 2, why: 'A full school bag is like 3 bags of sugar: about 3 kg.' },
    { id: 'melon', name: 'a watermelon', icon: '🍉', opts: [[5, 'g'], [50, 'g'], [5, 'kg']], ans: 2, why: 'A watermelon is very heavy for its size. About 5 kg.' },
  ];
  function grams(o) {
    return o[1] === 'kg' ? o[0] * 1000 : o[0];
  }
  function label(o) {
    return o[0] + ' ' + o[1];
  }
  function describe(o) {
    var g = grams(o);
    if (g < 10) return label(o) + ' is as light as ' + g + (g === 1 ? ' paper clip.' : ' paper clips.');
    if (g < 100) return label(o) + ' is lighter than an apple.';
    if (g < 200) return label(o) + ' is about as heavy as an apple.';
    if (g < 1000) return label(o) + ' is like ' + Math.round(g / 100) + ' apples.';
    var kg = g / 1000;
    return label(o) + ' is like ' + kg + (kg === 1 ? ' bag of sugar!' : ' bags of sugar!');
  }
  function senseMistake(item, chosen) {
    var right = item.opts[item.ans];
    if (chosen[0] === right[0] && chosen[1] !== right[1]) return 'Mixed up g and kg';
    var heavier = grams(chosen) > grams(right);
    if (item.sizeTrap && heavier) return 'Picked by size not weight';
    return heavier ? 'Picked a mass far too heavy' : 'Picked a mass far too light';
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  function kindFor(mass, used) {
    var fits = FOOD.filter(function (k) {
      return mass >= KINDS[k].min && mass <= KINDS[k].max;
    });
    var fresh = fits.filter(function (k) {
      return used.indexOf(k) === -1;
    });
    var k = U.pick(fresh.length ? fresh : fits);
    used.push(k);
    return k;
  }
  function makeShare(n, used) {
    // n identical items balance one known weight (20–200 g in tens); one item is a whole number of grams.
    var item = n === 2 ? 10 * U.rand(1, 10) : 10 * U.rand(1, 5);
    return { type: 'share', n: n, known: item * n, item: item, kind: kindFor(item, used) };
  }
  function makePart(used) {
    // Two different things balance a known total; one of them is labelled.
    var known = 10 * U.rand(5, 10);
    var unknown = 10 * U.rand(4, 10);
    while (unknown === known) unknown = 10 * U.rand(4, 10);
    var ka = kindFor(known, used);
    var kb = kindFor(unknown, used);
    if (kb === ka) {
      var alt = FOOD.filter(function (k) {
        return k !== ka && unknown >= KINDS[k].min && unknown <= KINDS[k].max;
      });
      kb = U.pick(alt);
    }
    return { type: 'part', known: known, unknown: unknown, total: known + unknown, kindA: ka, kindB: kb };
  }
  function makeRemove(combo, used) {
    // a items balance b items + K grams. Taking b items off each side leaves (a − b) items = K.
    var a = combo[0];
    var b = combo[1];
    var diff = a - b;
    var item = diff === 4 ? 10 * U.rand(1, 5) : 10 * U.rand(1, 10);
    return { type: 'remove', a: a, b: b, diff: diff, item: item, K: item * diff, kind: kindFor(item, used) };
  }

  function buildDeck() {
    var q = [];
    // Level 1: sensible estimates (one gram answer, one kilogram answer, one more)
    var items = U.shuffle(SENSE);
    var gItem = items.filter(function (i) {
      return grams(i.opts[i.ans]) < 1000;
    })[0];
    var kgItem = items.filter(function (i) {
      return grams(i.opts[i.ans]) >= 1000;
    })[0];
    var third = items.filter(function (i) {
      return i !== gItem && i !== kgItem;
    })[0];
    U.shuffle([gItem, kgItem, third]).forEach(function (it) {
      q.push({ type: 'sense', item: it });
    });
    // Level 2: halve once, total minus a known part, halve twice
    var used = [];
    var two = makeShare(2, used);
    var part = makePart(used);
    U.shuffle([two, part]).forEach(function (x) {
      q.push(x);
    });
    q.push(makeShare(4, used));
    // Level 3: take the same off both sides
    var combos = [[3, 1], [4, 2]];
    var c1 = U.pick(combos);
    var c2 = U.pick([[3, 1], [4, 2], [5, 1]].filter(function (c) {
      return c[0] !== c1[0];
    }));
    q.push(makeRemove(c1, used));
    q.push(makeRemove(c2, used));
    return q;
  }

  /* ------------------------------------------------------------------ *
   * Small helpers
   * ------------------------------------------------------------------ */
  function twoCol(left, right) {
    return el('div', { class: 'bp-play' }, el('div', { class: 'bp-pic' }, left), el('div', { class: 'bp-side' }, right));
  }
  function answerBox(onSubmit) {
    var inp = MQ.ui.numberInput({ unit: 'g', label: 'Mass in grams', onSubmit: onSubmit });
    inp.input.addEventListener('input', function () {
      var v = inp.input.value.replace(/[^0-9]/g, '');
      if (v !== inp.input.value) inp.input.value = v;
    });
    return inp;
  }
  function retry(inp) {
    inp.bad();
    try {
      inp.input.select();
    } catch (e) {}
  }
  function sides(parts, total) {
    return MQ.ui.sum(parts, total, 'g');
  }

  /* ------------------------------------------------------------------ *
   * Activity
   * ------------------------------------------------------------------ */
  var deck = null;

  var def = {
    learn: [
      // 1. Heavier goes down
      function (stage, api) {
        api.say('This is a pan balance. Which is heavier, the book or the sock? Guess first!', 'think');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Heavier goes down', 'The heavier side of a balance goes <b>down</b>.'));
        var b = makeBalance({ height: 380, later: api.later });
        var shelf = S('g', { class: 'bp-shelf' });
        shelf.appendChild(S('rect', { x: 60, y: 362, width: 560, height: 12, rx: 6, fill: '#e3d5c0' }));
        b.svg.appendChild(shelf);
        var things = [
          { it: b.makeItem('book', 300), home: [230, 362] },
          { it: b.makeItem('sock', 40), home: [450, 362] },
        ];
        var predicted = null;
        var placed = 0;
        var wrap = el('div', { class: 'bp-pic bp-wide' }, b.svg);
        stage.appendChild(wrap);
        var picker = MQ.ui.choices([{ label: '📕 The book', value: 'book' }, { label: '🧦 The sock', value: 'sock' }], function (v) {
          predicted = v;
          picker.mark(v, 'good');
          picker.disable();
          b.svg.classList.add('bp-ready');
          api.say('Now test it. Drag the book and the sock onto the pans.', 'happy');
          api.feedback('Drag each one onto a different pan.', 'info');
        }, { columns: 2 });
        stage.appendChild(picker);
        things.forEach(function (t) {
          var it = t.it;
          it.node.classList.add('bp-drag');
          it.node.setAttribute('transform', 'translate(' + t.home[0] + ',' + t.home[1] + ')');
          shelf.appendChild(it.node);
          var unbind = MQ.ui.drag(b.svg, it.node, {
            move: function (p, dx, dy) {
              if (!predicted || it.side) return;
              it.node.setAttribute('transform', 'translate(' + (t.home[0] + dx) + ',' + (t.home[1] + dy) + ')');
            },
            end: function (p) {
              if (it.side) return;
              if (!predicted) {
                api.say('Make a guess first! Click the book or the sock.', 'think');
                return;
              }
              var side = null;
              if (p.y < PY + 20) {
                if (Math.abs(p.x - (PX - LB)) < 125) side = 'L';
                else if (Math.abs(p.x - (PX + LB)) < 125) side = 'R';
              }
              if (!side || b.live(side).length) {
                it.node.setAttribute('transform', 'translate(' + t.home[0] + ',' + t.home[1] + ')');
                if (side) api.feedback('That pan is full. Use the other pan.', 'try');
                return;
              }
              MQ.sound('pop');
              it.node.classList.remove('bp-drag');
              b.add(side, it);
              unbind();
              placed++;
              b.update();
              if (placed === 1) {
                api.feedback('That pan went down: nothing is on the other side yet. Now drag the other one.', 'info');
                return;
              }
              var right = predicted === 'book';
              api.say(right ? 'You were right! The book side went down. The book is heavier.' : 'The book side went down, so the book is heavier.', right ? 'cheer' : 'happy');
              api.feedback('The heavier side goes down. The lighter side goes up.', 'good');
              api.unlockNext();
            },
          });
          api.cleanup(unbind);
        });
        b.update();
      },

      // 2. Balanced means equal; halve and halve again
      function (stage, api) {
        api.say('Two peaches. Each one is 80 g. Click the button to add pears until it is level.', 'happy');
        api.lockNext();
        var b = makeBalance({ later: api.later });
        b.fill('L', 'peach', 2, 80, '80 g');
        b.update();
        var count = el('div', { class: 'bp-note' }, '0 pears');
        var halver = makeHalver(160, 4, 'pear');
        var halverBox = el('div', { class: 'bp-hbox bp-hidden' }, el('div', { class: 'bp-note' }, '80 + 80 = 160 g. Share it between 4 pears:'), halver.el);
        var cutBtn = el('button', { class: 'btn', type: 'button' }, '✂ Cut in half');
        var addBtn = el('button', { class: 'btn', type: 'button' }, '🍐 Put a pear on');
        var pears = [];
        addBtn.addEventListener('click', function () {
          if (pears.length >= 4) return;
          MQ.sound('pop');
          pears.push(b.add('R', b.makeItem('pear', 40)));
          b.update();
          count.textContent = pears.length + (pears.length === 1 ? ' pear' : ' pears');
          if (pears.length < 4) {
            api.feedback('Still tipping down on the peach side. Add another pear.', 'info');
            return;
          }
          addBtn.disabled = true;
          api.say('Level! 4 pears balance 2 peaches. So 4 pears are 160 g.', 'cheer');
          api.feedback('Level means both sides are the same: 160 g. Now cut the bar to find 1 pear.', 'good');
          halverBox.classList.remove('bp-hidden');
          cutBtn.hidden = false;
        });
        cutBtn.hidden = true;
        cutBtn.addEventListener('click', function () {
          MQ.sound('click');
          var done = halver.cut();
          if (!done) {
            api.say('Half of 160 is 80. That is 2 pears. Cut again!', 'think');
            return;
          }
          cutBtn.disabled = true;
          pears.forEach(function (p) {
            b.tag(p, '40 g');
          });
          api.say('Half of 80 is 40. One pear is 40 g!', 'cheer');
          api.feedback('160 → 80 → 40. Half, then half again. One pear = 40 g.', 'good');
          api.unlockNext();
        });
        stage.appendChild(MQ.ui.lesson('Level means the same', null));
        stage.appendChild(twoCol(b.svg, [el('div', { class: 'bp-btns' }, addBtn, count), halverBox, cutBtn]));
      },

      // 3. Take the same off both sides
      function (stage, api) {
        api.say('3 muffins balance 1 muffin and a 100 g chocolate bar. Click a muffin on each side to take them off.', 'think');
        api.lockNext();
        var b = makeBalance({ later: api.later });
        b.fill('L', 'muffin', 3, 50);
        b.fill('R', 'muffin', 1, 50);
        b.add('R', b.makeItem('choc', 100));
        b.update();
        var halver = makeHalver(100, 2, 'muffin');
        var cutBtn = el('button', { class: 'btn', type: 'button', hidden: true }, '✂ Cut in half');
        var halverBox = el('div', { class: 'bp-hbox bp-hidden' }, el('div', { class: 'bp-note' }, '2 muffins = 100 g'), halver.el);
        var pairs = enablePairs(b, {
          lift: function (it) {
            api.feedback('Tipped! Now take a muffin off the ' + (it.side === 'L' ? 'right' : 'left') + ' side too.', 'info');
          },
          put: function () {
            api.feedback('Put back. It is level again.', 'info');
          },
          weight: function () {
            api.feedback('The other side has no chocolate bar. Take off the same thing from both sides: a muffin.', 'try');
          },
          pair: function () {
            pairs.off();
            api.say('Still level! Now 2 muffins balance 100 g.', 'cheer');
            api.feedback('Same off both sides → it stays level. 2 muffins = 100 g.', 'good');
            halverBox.classList.remove('bp-hidden');
            cutBtn.hidden = false;
          },
        });
        cutBtn.addEventListener('click', function () {
          MQ.sound('click');
          halver.cut();
          cutBtn.disabled = true;
          b.live('L').forEach(function (it) {
            b.tag(it, '50 g');
          });
          api.say('Half of 100 is 50. One muffin is 50 g!', 'cheer');
          api.feedback('Check: 50 + 50 + 50 = 150 g, and 50 + 100 = 150 g. Both sides match!', 'good');
          api.unlockNext();
        });
        stage.appendChild(MQ.ui.lesson('Take the same off both sides', 'Take one muffin off <b>each</b> side. It stays level.'));
        stage.appendChild(twoCol(b.svg, [halverBox, cutBtn]));
      },
    ],

    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'sense') return renderSense(stage, api, q);
        if (q.type === 'share') return renderShare(stage, api, q);
        if (q.type === 'part') return renderPart(stage, api, q);
        return renderRemove(stage, api, q);
      },
    },
  };

  /* ---------- Level 1: which mass is sensible? ---------- */
  function renderSense(stage, api, q) {
    var it = q.item;
    api.say('Which mass makes sense? Think about holding it.', 'think');
    stage.appendChild(el('div', { class: 'bp-thing' }, el('span', { class: 'bp-thing-icon' }, it.icon), el('span', null, it.name)));
    stage.appendChild(MQ.ui.prompt('About how heavy is <b>' + it.name + '</b>?'));
    var ch = MQ.ui.choices(it.opts.map(function (o, i) {
      return { label: label(o), value: i };
    }), function (v) {
      if (v === it.ans) {
        ch.mark(v, 'good');
        ch.disable();
        api.check(true, 'Yes! ' + it.why);
        return;
      }
      ch.mark(v, 'bad');
      var o = it.opts[v];
      var heavier = grams(o) > grams(it.opts[it.ans]);
      var hint = describe(o) + ' Is ' + it.name + ' that ' + (heavier ? 'heavy' : 'light') + '?';
      if (api.tries() >= 1) hint = describe(o) + ' ' + it.why.split('.')[0] + '.';
      if (o[0] === it.opts[it.ans][0] && api.tries() === 0) hint = 'Look at the unit: g or kg? ' + describe(o);
      api.check(false, hint, senseMistake(it, o));
    }, { columns: 3 });
    stage.appendChild(ch);
    stage.appendChild(el('div', { class: 'bp-ref' }, el('span', null, '📎 paper clip ≈ 1 g'), el('span', null, '🍎 apple ≈ 100 g'), el('span', null, '🛍️ bag of sugar = 1 kg')));
    api.onReveal(function () {
      ch.mark(it.ans, 'good');
      ch.disable();
      api.feedback(it.why, 'info');
    });
  }

  /* ---------- Level 2: n identical items balance a known weight ---------- */
  function renderShare(stage, api, q) {
    var K = KINDS[q.kind];
    var b = makeBalance({ later: api.later });
    var items = b.fill('L', q.kind, q.n, q.item, function (i) {
      return i === 0 ? '?' : null;
    });
    b.add('R', b.makeItem('weight', q.known));
    b.update();
    var halver = makeHalver(q.known, q.n, q.kind);
    var hbox = el('div', { class: 'bp-hbox bp-hidden' }, halver.el);
    api.say('It is level. ' + q.n + ' ' + K.many + ' balance ' + q.known + ' g.', 'think');
    var inp = answerBox(function (v) {
      if (v === q.item) {
        inp.good();
        inp.disable();
        items.forEach(function (x) {
          b.tag(x, q.item + ' g');
        });
        hbox.classList.remove('bp-hidden');
        halver.playAll(api.later);
        api.check(true, 'Yes! ' + chain(q.known, q.n) + ' One ' + K.one + ' is ' + q.item + ' g.');
        return;
      }
      retry(inp);
      var t = api.tries();
      var hint;
      var tag;
      if (v === q.known) {
        hint = q.known + ' g is all ' + q.n + ' ' + K.many + ' together. One ' + K.one + ' is lighter.';
        tag = 'Gave the total, not one item';
      } else if (q.n === 4 && v === q.known / 2) {
        hint = 'That is 2 ' + K.many + '. Halve again to get 1 ' + K.one + '!';
        tag = 'Halved only once';
      } else if (q.n === 2 && v === q.known / 4) {
        hint = 'Only 2 ' + K.many + ', so cut just once. What is half of ' + q.known + '?';
        tag = 'Halved too many times';
      } else if (v * q.n > q.known) {
        hint = q.n + ' of those would be more than ' + q.known + ' g. Try a smaller number.';
        tag = 'Did not share the mass equally';
      } else {
        hint = q.n + ' ' + K.many + ' share ' + q.known + ' g equally. ' + (q.n === 2 ? 'What is half of ' + q.known + '?' : 'Halve ' + q.known + ', then halve again.');
        tag = 'Did not share the mass equally';
      }
      if (t >= 1) {
        hbox.classList.remove('bp-hidden');
        if (q.n === 4) {
          halver.setRow(1, 'val');
          hint += ' Look: half of ' + q.known + ' is ' + q.known / 2 + '. Now halve ' + q.known / 2 + '.';
        } else {
          halver.setRow(1, 'q');
          hint += ' Which number added to itself makes ' + q.known + '?';
        }
      }
      api.check(false, hint, tag);
    });
    var prompt = MQ.ui.prompt('<b>' + q.n + ' ' + K.many + '</b> balance <b>' + q.known + '&nbsp;g</b>.<br>How heavy is <b>1 ' + K.one + '</b>?');
    stage.appendChild(twoCol(b.svg, [prompt, inp.el, hbox]));
    inp.focus();
    api.onReveal(function () {
      inp.setValue(q.item);
      inp.good();
      inp.disable();
      hbox.classList.remove('bp-hidden');
      halver.playAll(api.later, function () {
        items.forEach(function (x) {
          b.tag(x, q.item + ' g');
        });
      });
      api.feedback(chain(q.known, q.n) + ' One ' + K.one + ' is ' + q.item + ' g.', 'info');
    });
  }
  function chain(total, n) {
    if (n === 1) return total + ' g.';
    if (n === 2) return 'Half of ' + total + ' is ' + total / 2 + '.';
    return total + ' → ' + total / 2 + ' → ' + total / 4 + ' (half, then half again).';
  }

  /* ---------- Level 2: total minus the known part ---------- */
  function renderPart(stage, api, q) {
    var A = KINDS[q.kindA];
    var B = KINDS[q.kindB];
    var b = makeBalance({ later: api.later });
    b.add('L', b.makeItem(q.kindA, q.known, q.known + ' g'));
    var unk = b.add('L', b.makeItem(q.kindB, q.unknown, '?'));
    b.add('R', b.makeItem('weight', q.total));
    b.update();
    var bar = makePartBar(q.total, q.known, q.unknown, q.kindA, q.kindB);
    var sentence = el('div', { class: 'bp-note' });
    var hbox = el('div', { class: 'bp-hbox bp-hidden' }, bar.el, sentence);
    api.say('The ' + A.one + ' and the ' + B.one + ' balance ' + q.total + ' g.', 'think');
    function finish() {
      unk && b.tag(unk, q.unknown + ' g');
      hbox.classList.remove('bp-hidden');
      bar.show();
      sentence.textContent = q.total + ' − ' + q.known + ' = ' + q.unknown + ' g';
    }
    var inp = answerBox(function (v) {
      if (v === q.unknown) {
        inp.good();
        inp.disable();
        finish();
        api.check(true, 'Yes! ' + q.total + ' − ' + q.known + ' = ' + q.unknown + '. The ' + B.one + ' is ' + q.unknown + ' g.');
        return;
      }
      retry(inp);
      var hint;
      var tag;
      if (v === q.total) {
        hint = q.total + ' g is the ' + A.one + ' and the ' + B.one + ' together. Take the ' + A.one + ' away.';
        tag = 'Forgot to take away the known part';
      } else if (v === q.total + q.known) {
        hint = 'Did you add? The ' + B.one + ' must be lighter than ' + q.total + ' g. Take ' + q.known + ' away from ' + q.total + '.';
        tag = 'Added instead of taking away';
      } else if (v === q.known) {
        hint = q.known + ' g is the ' + A.one + '. We need the ' + B.one + '.';
        tag = 'Gave the known part';
      } else {
        hint = A.one.charAt(0).toUpperCase() + A.one.slice(1) + ' + ' + B.one + ' = ' + q.total + ' g. So the ' + B.one + ' is ' + q.total + ' − ' + q.known + '.';
        tag = 'Take-away slip';
      }
      if (api.tries() >= 1) {
        hbox.classList.remove('bp-hidden');
        var to100 = Math.ceil(q.known / 100) * 100;
        if (to100 > q.known && to100 < q.total) {
          sentence.textContent = 'Count on: ' + q.known + ' → ' + to100 + ' is ' + (to100 - q.known) + ', then ' + to100 + ' → ' + q.total + ' is ' + (q.total - to100) + '.';
        } else {
          sentence.textContent = 'Count on from ' + q.known + ' to ' + q.total + ' in tens.';
        }
        hint += ' Look at the bar.';
      }
      api.check(false, hint, tag);
    });
    var prompt = MQ.ui.prompt('The ' + A.one + ' is <b>' + q.known + '&nbsp;g</b>.<br>How heavy is the <b>' + B.one + '</b>?');
    stage.appendChild(twoCol(b.svg, [prompt, inp.el, hbox]));
    inp.focus();
    api.onReveal(function () {
      inp.setValue(q.unknown);
      inp.good();
      inp.disable();
      finish();
      api.feedback(A.one.charAt(0).toUpperCase() + A.one.slice(1) + ' + ' + B.one + ' = ' + q.total + ' g. ' + q.total + ' − ' + q.known + ' = ' + q.unknown + ' g.', 'info');
    });
  }

  /* ---------- Level 3: take the same off both sides ---------- */
  function renderRemove(stage, api, q) {
    var K = KINDS[q.kind];
    var b = makeBalance({ later: api.later });
    b.fill('L', q.kind, q.a, q.item);
    b.fill('R', q.kind, q.b, q.item);
    b.add('R', b.makeItem('weight', q.K));
    b.update();
    var halver = makeHalver(q.K, q.diff, q.kind);
    var sums = el('div', { class: 'bp-sums' });
    var hbox = el('div', { class: 'bp-hbox bp-hidden' }, el('div', { class: 'bp-note' }, q.diff + ' ' + word(q.kind, q.diff) + ' = ' + q.K + ' g'), halver.el);
    api.say('It is level. Take the same off both sides to make it easier.', 'think');
    var removed = 0;
    var pairsCtl = enablePairs(b, {
      lift: function () {
        api.feedback('It tipped! Take a ' + K.one + ' off the other side too.', 'info');
      },
      put: function () {
        api.feedback('Put back. Level again.', 'info');
      },
      noMatch: function () {
        api.feedback('The other side has no ' + K.many + ' left. Now find 1 ' + K.one + '.', 'info');
      },
      weight: function () {
        api.feedback('Only take off things that are on both sides.', 'try');
      },
      pair: function () {
        removed++;
        var left = q.a - removed;
        api.feedback('Still level! ' + left + ' ' + word(q.kind, left) + ' on the left' + (removed === q.b ? ' balance ' + q.K + ' g.' : '.'), 'good');
      },
    });
    function showSides() {
      var leftParts = [];
      for (var i = 0; i < q.a; i++) leftParts.push(q.item);
      var rightParts = [];
      for (var j = 0; j < q.b; j++) rightParts.push(q.item);
      rightParts.push(q.K);
      MQ.clear(sums);
      sums.appendChild(el('div', { class: 'bp-note' }, 'Each side:'));
      sums.appendChild(sides(leftParts, q.a * q.item));
      sums.appendChild(sides(rightParts, q.b * q.item + q.K));
    }
    function tagAll() {
      b.live('L').concat(b.live('R')).forEach(function (x) {
        if (!x.weight) b.tag(x, q.item + ' g');
      });
    }
    var inp = answerBox(function (v) {
      if (v === q.item) {
        inp.good();
        inp.disable();
        pairsCtl.off();
        tagAll();
        showSides();
        api.check(true, 'Yes! 1 ' + K.one + ' = ' + q.item + ' g. Each side is ' + q.a * q.item + ' g.');
        return;
      }
      retry(inp);
      var t = api.tries();
      var hint;
      var tag;
      var allOff = removed >= q.b;
      if (v === q.K && q.diff > 1) {
        hint = q.K + ' g balances ' + q.diff + ' ' + K.many + ', not 1. ' + (allOff ? 'Share it between them.' : 'Take the same off both sides first.');
        tag = allOff ? 'Gave the total, not one item' : 'Did not remove the same from both sides';
      } else if (q.diff === 4 && v === q.K / 2) {
        hint = 'That is 2 ' + K.many + '. There are 4, so halve again!';
        tag = 'Halved only once';
      } else if (q.diff === 2 && v === q.K / 4) {
        hint = 'Only 2 ' + K.many + ' are left, so cut just once.';
        tag = 'Halved too many times';
      } else if (v === q.a * q.item) {
        hint = 'That is the whole side. We want 1 ' + K.one + '.';
        tag = 'Gave the whole side, not one item';
      } else {
        hint = 'Take ' + q.b + ' ' + word(q.kind, q.b) + ' off each side. Then ' + q.diff + ' ' + K.many + ' balance ' + q.K + ' g.';
        tag = 'Did not remove the same from both sides';
      }
      if (t >= 1) {
        pairsCtl.off();
        autoRemove(b, api.later);
        removed = q.b;
        hbox.classList.remove('bp-hidden');
        if (q.diff === 4) {
          halver.setRow(1, 'val');
          hint = 'I took ' + q.b + ' off each side. ' + q.diff + ' ' + K.many + ' = ' + q.K + ' g. Half is ' + q.K / 2 + '. Now halve again.';
        } else {
          halver.setRow(1, 'q');
          hint = 'I took ' + q.b + ' off each side. 2 ' + K.many + ' = ' + q.K + ' g. Which number added to itself makes ' + q.K + '?';
        }
      }
      api.check(false, hint, tag);
    });
    var prompt = MQ.ui.prompt('<b>' + q.a + ' ' + K.many + '</b> balance <b>' + q.b + ' ' + word(q.kind, q.b) + '</b> and <b>' + q.K + '&nbsp;g</b>.<br>How heavy is <b>1 ' + K.one + '</b>?');
    var tip = el('div', { class: 'bp-tip' }, 'Tip: click a ' + K.one + ' on each side to take them off.');
    stage.appendChild(twoCol(b.svg, [prompt, tip, inp.el, hbox, sums]));
    inp.focus();
    api.onReveal(function () {
      inp.setValue(q.item);
      inp.good();
      inp.disable();
      pairsCtl.off();
      api.feedback('Take ' + q.b + ' ' + word(q.kind, q.b) + ' off each side. ' + q.diff + ' ' + K.many + ' = ' + q.K + ' g. ' + chain(q.K, q.diff) + ' 1 ' + K.one + ' = ' + q.item + ' g.', 'info');
      autoRemove(b, api.later, function () {
        hbox.classList.remove('bp-hidden');
        halver.playAll(api.later, function () {
          tagAll();
          showSides();
        });
      });
    });
  }

  def._test = { buildDeck: buildDeck, SENSE: SENSE, KINDS: KINDS, grams: grams };
  MQ.register('balance-puzzle', def);

  var css = [
    '.bp-play{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:12px 20px;align-items:center;width:100%;max-width:960px}',
    '.bp-pic{display:flex;justify-content:center;min-width:0}',
    '.bp-wide{width:100%}',
    '.bp-side{display:flex;flex-direction:column;align-items:center;gap:12px;min-width:0}',
    '.bp-side .prompt{font-size:1.3rem}',
    '.bp-svg{width:100%;max-width:560px;height:auto;display:block;user-select:none;-webkit-user-select:none;touch-action:none}',
    '.bp-wide .bp-svg{max-width:540px}',
    '.bp-beam,.bp-pan{transition:transform .7s cubic-bezier(.34,1.3,.64,1)}',
    '.bp-lift{transition:transform .3s ease,opacity .4s ease}',
    '.bp-lifted{transform:translateY(-30px)}',
    '.bp-gone{transform:translateY(-80px);opacity:0}',
    '.bp-clickable .bp-item:not(.bp-weight){cursor:pointer}',
    '.bp-clickable .bp-item:not(.bp-weight):hover .bp-lift{filter:drop-shadow(0 0 4px rgba(46,196,182,.9))}',
    '.bp-lifted{filter:drop-shadow(0 6px 4px rgba(0,0,0,.25))}',
    '.bp-shelf .bp-item{pointer-events:none;opacity:.85}',
    '.bp-ready .bp-shelf .bp-item{pointer-events:auto;opacity:1}',
    '.bp-ready .bp-shelf .bp-item:hover .bp-lift{filter:drop-shadow(0 0 5px rgba(46,196,182,.9))}',
    '.bp-wtext{fill:#fff;font-weight:800;font-size:14px;text-anchor:middle;font-family:inherit}',
    '.bp-tag rect{fill:#fff;stroke:#1b2a4a;stroke-width:1.5}',
    '.bp-tag text{fill:#1b2a4a;font-weight:800;font-size:13px;text-anchor:middle;font-family:inherit}',
    '.bp-halver{width:100%;max-width:400px;height:auto;display:block}',
    '.bp-hrow{transition:opacity .4s ease}',
    '.bp-hide{opacity:0}',
    '.bp-hbar{stroke:#1b2a4a;stroke-width:1.5}',
    '.bp-hbar0{fill:#ffe8a3}',
    '.bp-hbar1{fill:#c5f0d0}',
    '.bp-hbar2{fill:#cfe3ff}',
    '.bp-htext{font-weight:800;font-size:17px;text-anchor:middle;fill:#1b2a4a;font-family:inherit}',
    '.bp-hbox{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%}',
    '.bp-hidden{display:none}',
    '.bp-note{font-weight:800;font-size:1.05rem;text-align:center}',
    '.bp-tip{color:var(--ink-soft);font-size:.95rem;text-align:center}',
    '.bp-btns{display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:center}',
    '.bp-sums{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.bp-sums .sum-row{font-size:1.05rem}',
    '.bp-sums .chip{padding:3px 8px}',
    '.bp-thing{display:flex;align-items:center;gap:14px;font-size:1.5rem;font-weight:800;background:#fff;border:3px dashed var(--line);border-radius:16px;padding:12px 24px}',
    '.bp-thing-icon{font-size:3.4rem;line-height:1}',
    '.bp-ref{display:flex;gap:8px 18px;flex-wrap:wrap;justify-content:center;color:var(--ink-soft);font-size:.95rem;font-weight:700}',
    '@media (max-width:900px){.bp-play{grid-template-columns:1fr}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'balance-puzzle' }, css));
})();

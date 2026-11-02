/* Bolt's Route (Unit 15.1) — give and follow route instructions on a grid map:
 * forward / turn left / turn right (Bolt's own left and right), and compass moves
 * (north, south, east, west) counted in jumps between squares, never counting the start square.
 * North is always up. Directions are numbers going clockwise: 0 = north, 1 = east, 2 = south, 3 = west.
 * Cells are {c, r}: c = column from the left, r = row from the top.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var DC = [0, 1, 0, -1];
  var DR = [-1, 0, 1, 0];
  var DN = ['north', 'east', 'south', 'west'];
  var LET = ['N', 'E', 'S', 'W'];
  var ARW = ['↑', '→', '↓', '←'];
  var MAXCARDS = 14;
  var uid = 0;

  function m4(n) {
    return ((n % 4) + 4) % 4;
  }
  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function plural(n, word) {
    return n + ' ' + word + (n === 1 ? '' : 's');
  }
  function key(p) {
    return p.c + ',' + p.r;
  }
  function same(a, b) {
    return a.c === b.c && a.r === b.r;
  }
  function cellsKey(cells) {
    return cells.map(key).join(' ');
  }

  /* ---------------------------------------------------------------- *
   * Places
   * ---------------------------------------------------------------- */
  var PLACES = {
    home: { e: '🏠', n: 'home' },
    shop: { e: '🏪', n: 'shop' },
    park: { e: '🌳', n: 'park' },
    school: { e: '🏫', n: 'school' },
    bus: { e: '🚏', n: 'bus stop' },
    library: { e: '📚', n: 'library' },
    hospital: { e: '🏥', n: 'hospital' },
    cafe: { e: '☕', n: 'café' },
    post: { e: '📮', n: 'post box' },
    bakery: { e: '🍞', n: 'bakery' },
    fountain: { e: '⛲', n: 'fountain' },
    pool: { e: '🏊', n: 'pool' },
  };
  var BLOCKS = {
    pond: { e: '🦆', n: 'pond', cls: 'brt-pond' },
    works: { e: '🚧', n: 'roadworks', cls: 'brt-works' },
  };
  var GOALS = ['shop', 'park', 'school', 'bus', 'library', 'hospital', 'cafe', 'post', 'bakery', 'fountain', 'pool'];

  function the(k) {
    return k === 'home' ? 'home' : 'the ' + PLACES[k].n;
  }
  function placeHtml(k) {
    return '<b>' + the(k) + '</b> ' + PLACES[k].e;
  }

  /* ---------------------------------------------------------------- *
   * Pure grid logic (used for drawing, checking and reveals alike)
   * ---------------------------------------------------------------- */
  function inGrid(g, c, r) {
    return c >= 0 && r >= 0 && c < g.cols && r < g.rows;
  }
  function blockAt(g, c, r) {
    var b = (g.blocked || []).filter(function (x) {
      return x.c === c && x.r === r;
    });
    return b.length ? b[0] : null;
  }

  /** Run a forward/left/right program. prog: [{t:'F', n}, {t:'L'}, {t:'R'}]. */
  function simulate(g, start, facing, prog) {
    var c = start.c;
    var r = start.r;
    var f = facing;
    var cells = [{ c: c, r: r }];
    var steps = [];
    for (var i = 0; i < prog.length; i++) {
      var p = prog[i];
      if (p.t === 'L' || p.t === 'R') {
        f = m4(f + (p.t === 'R' ? 1 : -1));
        steps.push({ t: p.t });
        continue;
      }
      for (var k = 0; k < p.n; k++) {
        var nc = c + DC[f];
        var nr = r + DR[f];
        if (!inGrid(g, nc, nr)) return { c: c, r: r, f: f, cells: cells, steps: steps, stop: 'off', card: i };
        var b = blockAt(g, nc, nr);
        if (b) return { c: c, r: r, f: f, cells: cells, steps: steps, stop: 'blocked', block: b, card: i };
        c = nc;
        r = nr;
        cells.push({ c: c, r: r });
        steps.push({ t: 'F' });
      }
    }
    return { c: c, r: r, f: f, cells: cells, steps: steps, stop: null };
  }

  /** Compass legs [{d, n}] -> list of cells, start included. */
  function legCells(start, legs) {
    var c = start.c;
    var r = start.r;
    var out = [{ c: c, r: r }];
    legs.forEach(function (l) {
      for (var k = 0; k < l.n; k++) {
        c += DC[l.d];
        r += DR[l.d];
        out.push({ c: c, r: r });
      }
    });
    return out;
  }
  function legsEnd(start, legs) {
    var cs = legCells(start, legs);
    return cs[cs.length - 1];
  }
  /** Moves (list of dirs) -> legs. */
  function compress(dirs) {
    var legs = [];
    dirs.forEach(function (d) {
      if (legs.length && legs[legs.length - 1].d === d) legs[legs.length - 1].n++;
      else legs.push({ d: d, n: 1 });
    });
    return legs;
  }
  function cellsToDirs(cells) {
    var out = [];
    for (var i = 1; i < cells.length; i++) {
      var dc = cells[i].c - cells[i - 1].c;
      var dr = cells[i].r - cells[i - 1].r;
      for (var d = 0; d < 4; d++) if (DC[d] === dc && DR[d] === dr) out.push(d);
    }
    return out;
  }
  function legsText(legs, word) {
    return legs
      .map(function (l) {
        return l.n + (word ? ' ' + (l.n === 1 ? word : word + 's') : '') + ' ' + DN[l.d];
      })
      .join(', ');
  }
  /** Cell path -> forward/left/right program for a robot starting with `facing`. */
  function pathToProgram(facing, cells) {
    var prog = [];
    var f = facing;
    compress(cellsToDirs(cells)).forEach(function (l) {
      var diff = m4(l.d - f);
      if (diff === 1) prog.push({ t: 'R' });
      else if (diff === 3) prog.push({ t: 'L' });
      else if (diff === 2) prog.push({ t: 'R' }, { t: 'R' });
      f = l.d;
      prog.push({ t: 'F', n: l.n });
    });
    return prog;
  }
  function cardText(p) {
    if (p.t === 'F') return 'forward ' + p.n;
    return p.t === 'L' ? 'turn left' : 'turn right';
  }
  function progText(prog) {
    return prog.map(cardText).join(', ');
  }
  /** "1 square north and 2 squares west" of b, said about a. */
  function relText(a, b) {
    var parts = [];
    var dr = a.r - b.r;
    var dc = a.c - b.c;
    if (dr) parts.push(plural(Math.abs(dr), 'square') + ' ' + (dr < 0 ? 'north' : 'south'));
    if (dc) parts.push(plural(Math.abs(dc), 'square') + ' ' + (dc > 0 ? 'east' : 'west'));
    return parts.join(' and ');
  }
  /** Shortest path avoiding blocked squares and the cells in `avoid` (a key set). */
  function bfs(g, s, t, avoid) {
    var prev = {};
    var seen = {};
    seen[key(s)] = true;
    var q = [s];
    while (q.length) {
      var p = q.shift();
      if (same(p, t)) {
        var out = [p];
        while (prev[key(out[0])]) out.unshift(prev[key(out[0])]);
        return out;
      }
      for (var d = 0; d < 4; d++) {
        var n = { c: p.c + DC[d], r: p.r + DR[d] };
        var k = key(n);
        if (!inGrid(g, n.c, n.r) || seen[k] || blockAt(g, n.c, n.r) || (avoid && avoid[k])) continue;
        seen[k] = true;
        prev[k] = p;
        q.push(n);
      }
    }
    return null;
  }
  /** All routes from s to t using only directions dh and dv (quick routes), avoiding blocks. */
  function monotoneRoutes(g, s, t, dh, dv) {
    var out = [];
    (function walk(p, path) {
      if (out.length > 60) return;
      if (same(p, t)) {
        out.push(path.slice());
        return;
      }
      [dh, dv].forEach(function (d) {
        var n = { c: p.c + DC[d], r: p.r + DR[d] };
        var okH = d === dh ? Math.abs(t.c - n.c) < Math.abs(t.c - p.c) : true;
        var okV = d === dv ? Math.abs(t.r - n.r) < Math.abs(t.r - p.r) : true;
        if (!okH || !okV || !inGrid(g, n.c, n.r) || blockAt(g, n.c, n.r)) return;
        path.push(n);
        walk(n, path);
        path.pop();
      });
    })(s, [s]);
    return out;
  }

  /* ---------------------------------------------------------------- *
   * The map: grid (or dot grid), places, compass rose, Bolt and his trail
   * ---------------------------------------------------------------- */
  function makeMap(api, o) {
    var cols = o.cols;
    var rows = o.rows;
    var cell = o.cell || 52;
    var pad = 14;
    var side = 76;
    var W = pad * 2 + cols * cell + side;
    var H = Math.max(pad * 2 + rows * cell, 130);
    var ms = o.ms || 380;
    var mid = 'brt-head-' + ++uid;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'brt-map', role: 'img', 'aria-label': 'A grid map with Bolt the robot. North is up.' });
    root.appendChild(svg('defs', null, svg('marker', { id: mid, viewBox: '0 0 10 10', refX: 5, refY: 5, markerWidth: 3.2, markerHeight: 3.2, orient: 'auto' }, svg('path', { d: 'M0,0 L10,5 L0,10 z', class: 'brt-plan-head' }))));
    var gBg = svg('g');
    var gPlace = svg('g');
    var gLines = svg('g');
    var gPlan = svg('g');
    var gTrail = svg('g');
    var gMarks = svg('g');
    var gHit = svg('g');
    var gTop = svg('g');
    [gBg, gPlace, gLines, gPlan, gTrail, gMarks, gHit, gTop].forEach(function (g) {
      root.appendChild(g);
    });
    function cx(c) {
      return pad + c * cell + cell / 2;
    }
    function cy(r) {
      return pad + r * cell + cell / 2;
    }

    gBg.appendChild(svg('rect', { x: pad, y: pad, width: cols * cell, height: rows * cell, rx: 4, class: o.dots ? 'brt-bg brt-bg-dots' : 'brt-bg' }));
    if (o.dots) {
      for (var dc = 0; dc < cols; dc++) for (var dr = 0; dr < rows; dr++) gLines.appendChild(svg('circle', { cx: cx(dc), cy: cy(dr), r: 4.5, class: 'brt-dot' }));
    } else {
      for (var c = 0; c <= cols; c++) gLines.appendChild(svg('line', { x1: pad + c * cell, y1: pad, x2: pad + c * cell, y2: pad + rows * cell, class: 'brt-line' }));
      for (var r = 0; r <= rows; r++) gLines.appendChild(svg('line', { x1: pad, y1: pad + r * cell, x2: pad + cols * cell, y2: pad + r * cell, class: 'brt-line' }));
    }

    function drawPlace(p) {
      var x0 = pad + p.c * cell;
      var y0 = pad + p.r * cell;
      var b = BLOCKS[p.k];
      if (p.k === 'start') {
        gBg.appendChild(svg('rect', { x: x0 + 1.5, y: y0 + 1.5, width: cell - 3, height: cell - 3, rx: 6, class: 'brt-startcell' }));
        return;
      }
      var info = b || PLACES[p.k];
      if (!info) return;
      if (b) gBg.appendChild(svg('rect', { x: x0 + 1.5, y: y0 + 1.5, width: cell - 3, height: cell - 3, rx: 6, class: b.cls }));
      else if (p.goal) gBg.appendChild(svg('rect', { x: x0 + 1.5, y: y0 + 1.5, width: cell - 3, height: cell - 3, rx: 6, class: 'brt-goal' }));
      gPlace.appendChild(svg('text', { x: cx(p.c), y: cy(p.r) - cell * 0.1, class: 'brt-emoji', 'font-size': Math.round(cell * 0.4), text: info.e }));
      var fs = Math.min(cell >= 50 ? 10.5 : 9.5, (cell - 5) / (info.n.length * 0.58));
      gPlace.appendChild(svg('text', { x: cx(p.c), y: y0 + cell - 4, class: 'brt-label', 'font-size': fs.toFixed(1), text: info.n }));
    }
    (o.places || []).forEach(drawPlace);
    (o.blocked || []).forEach(drawPlace);
    if (o.star) {
      var sx = cx(o.star.c);
      var sy = cy(o.star.r);
      var pts = [];
      for (var i = 0; i < 10; i++) {
        var rad = i % 2 ? cell * 0.17 : cell * 0.38;
        var a = (Math.PI / 5) * i - Math.PI / 2;
        pts.push((sx + rad * Math.cos(a)).toFixed(1) + ',' + (sy + rad * Math.sin(a)).toFixed(1));
      }
      gPlace.appendChild(svg('polygon', { points: pts.join(' '), class: 'brt-star' }));
    }

    // Compass rose (north is always up)
    var RX = pad + cols * cell + side / 2 + 1;
    var RY = pad + 50;
    var rose = svg('g', { class: 'brt-rose' });
    rose.appendChild(svg('circle', { cx: RX, cy: RY, r: 21, class: 'brt-rose-ring' }));
    rose.appendChild(svg('polygon', { points: [RX, RY - 19, RX - 6, RY, RX + 6, RY].join(' '), class: 'brt-rose-n' }));
    rose.appendChild(svg('polygon', { points: [RX, RY + 19, RX - 6, RY, RX + 6, RY].join(' '), class: 'brt-rose-s' }));
    rose.appendChild(svg('polygon', { points: [RX + 19, RY, RX, RY - 5, RX, RY + 5].join(' '), class: 'brt-rose-s' }));
    rose.appendChild(svg('polygon', { points: [RX - 19, RY, RX, RY - 5, RX, RY + 5].join(' '), class: 'brt-rose-s' }));
    [
      ['N', RX, RY - 30],
      ['E', RX + 31, RY],
      ['S', RX, RY + 31],
      ['W', RX - 31, RY],
    ].forEach(function (t) {
      rose.appendChild(svg('text', { x: t[1], y: t[2], class: 'brt-rose-t' + (t[0] === 'N' ? ' brt-rose-tn' : ''), text: t[0] }));
    });
    gTop.appendChild(rose);

    // Bolt (same look as in Compass Garden: round body, wheels, blue nose arrow = facing)
    var bolt = svg('g', { class: 'brt-bolt brt-instant' });
    var inner = svg('g', { transform: 'scale(' + (cell / 100).toFixed(3) + ')' });
    var body = svg('g', { class: 'brt-bolt-body' });
    body.appendChild(svg('rect', { x: -9, y: -42, width: 18, height: 16, class: 'brt-nose' }));
    body.appendChild(svg('polygon', { points: '0,-62 -14,-38 14,-38', class: 'brt-nose' }));
    body.appendChild(svg('rect', { x: -36, y: -16, width: 10, height: 32, rx: 3, class: 'brt-wheel' }));
    body.appendChild(svg('rect', { x: 26, y: -16, width: 10, height: 32, rx: 3, class: 'brt-wheel' }));
    body.appendChild(svg('circle', { cx: 0, cy: 0, r: 28, class: 'brt-body' }));
    body.appendChild(svg('rect', { x: -17, y: -22, width: 34, height: 14, rx: 7, class: 'brt-visor' }));
    body.appendChild(svg('circle', { cx: -8, cy: -15, r: 3.6, class: 'brt-eye' }));
    body.appendChild(svg('circle', { cx: 8, cy: -15, r: 3.6, class: 'brt-eye' }));
    body.appendChild(svg('circle', { cx: 0, cy: 8, r: 6, class: 'brt-knob' }));
    inner.appendChild(body);
    bolt.appendChild(inner);
    if (o.noBolt) bolt.style.display = 'none';
    gTop.appendChild(bolt);

    var vis = { c: 0, r: 0, f: 0, deg: 0 };
    var queue = [];
    var running = false;
    var token = 0;
    var legN = 0;
    var lastDir = null;
    var faceFn = null;

    function setT() {
      bolt.style.transform = 'translate(' + cx(vis.c) + 'px,' + cy(vis.r) + 'px) rotate(' + vis.deg + 'deg)';
    }
    function place(c, r, f) {
      vis.c = c;
      vis.r = r;
      vis.f = f;
      vis.deg = f * 90;
      bolt.classList.add('brt-instant');
      setT();
      void root.getBoundingClientRect();
      api.later(function () {
        bolt.classList.remove('brt-instant');
      }, 30);
      if (faceFn) faceFn(vis.f);
    }
    function trailStep(p, n, cls) {
      gTrail.appendChild(svg('line', { x1: cx(p.c), y1: cy(p.r), x2: cx(vis.c), y2: cy(vis.r), class: 'brt-trail' + (cls ? ' ' + cls : '') }));
      var nx = cx(vis.c) + cell / 2 - 10;
      var ny = cy(vis.r) - cell / 2 + 10;
      gMarks.appendChild(svg('g', { class: 'brt-num' }, svg('circle', { cx: nx, cy: ny, r: 8.5 }), svg('text', { x: nx, y: ny + 0.5, text: String(n) })));
    }
    function stepOn(cls) {
      var p = { c: vis.c, r: vis.r };
      vis.c += DC[vis.f];
      vis.r += DR[vis.f];
      legN++;
      trailStep(p, legN, cls);
      setT();
    }
    function doAction(a) {
      if (a.t === 'M') {
        var diff = m4(a.d - vis.f);
        vis.deg += diff === 3 ? -90 : diff * 90;
        vis.f = a.d;
        if (lastDir !== a.d) legN = 0;
        lastDir = a.d;
        stepOn(a.cls);
      } else if (a.t === 'F') {
        lastDir = vis.f;
        stepOn(a.cls);
      } else if (a.t === 'L' || a.t === 'R') {
        vis.f = m4(vis.f + (a.t === 'R' ? 1 : -1));
        vis.deg += a.t === 'R' ? 90 : -90;
        legN = 0;
        lastDir = null;
        setT();
      } else if (a.t === 'bump') {
        body.classList.add('brt-bump');
        api.later(function () {
          body.classList.remove('brt-bump');
        }, 450);
        return 500;
      } else if (a.t === 'fn') {
        a.fn();
        return 0;
      } else if (a.t === 'wait') {
        return a.ms;
      }
      if (faceFn) faceFn(vis.f);
      return a.ms || ms;
    }
    function pump() {
      if (!queue.length) {
        running = false;
        return;
      }
      running = true;
      var a = queue.shift();
      var my = token;
      var wait = doAction(a);
      if (my !== token) return;
      if (wait) {
        api.later(function () {
          if (my === token) pump();
        }, wait);
      } else pump();
    }
    function act(list) {
      queue = queue.concat(list);
      if (!running) pump();
    }
    function clearTrail() {
      MQ.clear(gTrail);
      MQ.clear(gMarks);
    }
    function reset(c, r, f) {
      token++;
      queue = [];
      running = false;
      legN = 0;
      lastDir = null;
      clearTrail();
      place(c, r, f);
    }
    function plan(cells, cls) {
      var line = svg('polyline', {
        points: cells
          .map(function (p) {
            return cx(p.c) + ',' + cy(p.r);
          })
          .join(' '),
        class: 'brt-plan' + (cls ? ' ' + cls : ''),
        'marker-end': 'url(#' + mid + ')',
      });
      gPlan.appendChild(line);
      return line;
    }
    function mark(c, r, kind) {
      var m = o.dots ? svg('circle', { cx: cx(c), cy: cy(r), r: cell * 0.32, class: 'brt-mark brt-mark-' + kind }) : svg('rect', { x: pad + c * cell + 3, y: pad + r * cell + 3, width: cell - 6, height: cell - 6, rx: 6, class: 'brt-mark brt-mark-' + kind });
      gHit.parentNode.insertBefore(m, gHit);
      return m;
    }
    function counter(c, r, label, cls) {
      var g = svg('g', { class: 'brt-counter' + (cls ? ' ' + cls : '') }, svg('circle', { cx: cx(c), cy: cy(r), r: cell * 0.3 }), svg('text', { x: cx(c), y: cy(r) + 1, text: label }));
      gTop.insertBefore(g, bolt);
      return g;
    }
    if (o.onCell) {
      for (var hc = 0; hc < cols; hc++) {
        for (var hr = 0; hr < rows; hr++) {
          (function (cc, rr) {
            gHit.appendChild(
              svg('rect', {
                x: pad + cc * cell,
                y: pad + rr * cell,
                width: cell,
                height: cell,
                class: 'brt-hit',
                onclick: function () {
                  o.onCell(cc, rr);
                },
              })
            );
          })(hc, hr);
        }
      }
    }
    if (o.start) place(o.start.c, o.start.r, o.facing || 0);
    else bolt.style.display = 'none';

    return {
      svg: root,
      cell: cell,
      vis: vis,
      act: act,
      reset: reset,
      place: place,
      plan: plan,
      clearPlan: function () {
        MQ.clear(gPlan);
      },
      clearTrail: clearTrail,
      mark: mark,
      counter: counter,
      busy: function () {
        return running;
      },
      onFace: function (fn) {
        faceFn = fn;
        fn(vis.f);
      },
      showBolt: function (on) {
        bolt.style.display = on ? '' : 'none';
      },
    };
  }

  /* ---------------------------------------------------------------- *
   * Small UI pieces
   * ---------------------------------------------------------------- */
  function row(map, side) {
    return el('div', { class: 'brt-row' }, el('div', { class: 'brt-mapbox' }, map.svg), side);
  }
  function faceBadge(map) {
    var b = el('div', { class: 'brt-face' });
    map.onFace(function (f) {
      b.innerHTML = 'Bolt faces <b>' + DN[f] + '</b> ' + ARW[f];
    });
    return b;
  }
  /** Compass arrow pad. allowed: list of directions to show. */
  function arrowPad(onMove, allowed) {
    var pad = el('div', { class: 'brt-pad' });
    var at = { 0: 2, 3: 4, 1: 6, 2: 8 };
    for (var i = 1; i <= 9; i++) {
      var d = null;
      [0, 1, 2, 3].forEach(function (k) {
        if (at[k] === i) d = k;
      });
      if (d !== null && (!allowed || allowed.indexOf(d) >= 0)) {
        pad.appendChild(
          el(
            'button',
            {
              class: 'btn brt-arrow',
              type: 'button',
              'aria-label': 'Move ' + DN[d],
              onclick: (function (dd) {
                return function () {
                  onMove(dd);
                };
              })(d),
            },
            el('span', { class: 'brt-arrow-a' }, ARW[d]),
            el('span', { class: 'brt-arrow-l' }, DN[d])
          )
        );
      } else if (i === 5) pad.appendChild(el('div', { class: 'brt-pad-mid' }, '🤖'));
      else pad.appendChild(el('div'));
    }
    return pad;
  }
  function card(p, extra, still) {
    var turn = p.t !== 'F';
    var label = p.t === 'F' ? 'Forward ' + p.n : p.t === 'L' ? '↺ Turn left' : '↻ Turn right';
    var cls = 'brt-card' + (turn ? ' brt-card-turn' : '') + (extra ? ' ' + extra : '') + (still ? ' brt-card-still' : '');
    return still ? el('span', { class: cls }, label) : el('button', { class: cls, type: 'button' }, label);
  }
  function btn(label, onclick, cls) {
    return el('button', { class: 'btn ' + (cls || ''), type: 'button', onclick: onclick }, label);
  }
  function numBox() {
    return el('input', { class: 'brt-in', type: 'text', inputmode: 'numeric', maxlength: 2, autocomplete: 'off', 'aria-label': 'number of squares' });
  }
  function readNum(inp) {
    var v = inp.value.trim();
    if (!/^\d{1,2}$/.test(v)) return null;
    return parseInt(v, 10);
  }

  /** Program builder: Forward 1–4, turn left/right, undo, clear, Go. */
  function programBuilder(onGo) {
    var prog = [];
    var strip = el('div', { class: 'brt-prog' });
    var enabled = true;
    function draw() {
      MQ.clear(strip);
      if (!prog.length) strip.appendChild(el('span', { class: 'brt-prog-empty' }, 'Add cards to make the program'));
      prog.forEach(function (p, i) {
        var c = card(p, 'brt-card-in');
        c.addEventListener('click', function () {
          if (!enabled) return;
          prog.splice(i, 1);
          draw();
        });
        c.title = 'Click to remove';
        strip.appendChild(c);
      });
    }
    function add(p) {
      if (!enabled) return;
      if (prog.length >= MAXCARDS) return;
      // Join "forward" cards that follow each other? No: keep exactly what he chose.
      prog.push(p);
      draw();
    }
    var fwd = el('div', { class: 'brt-btns brt-fwd' }, el('span', { class: 'brt-fwd-l' }, 'Forward'));
    [1, 2, 3, 4].forEach(function (n) {
      var b = btn(String(n), function () {
        add({ t: 'F', n: n });
      }, 'brt-b-f brt-b-n');
      b.setAttribute('aria-label', 'Forward ' + n);
      fwd.appendChild(b);
    });
    var turns = el(
      'div',
      { class: 'brt-btns' },
      btn('↺ Turn left', function () {
        add({ t: 'L' });
      }, 'brt-b-t'),
      btn('↻ Turn right', function () {
        add({ t: 'R' });
      }, 'brt-b-t')
    );
    var goBtn = btn('Go ▶', function () {
      if (enabled) onGo(prog.slice());
    }, 'brt-go');
    var tools = el(
      'div',
      { class: 'brt-btns' },
      btn('↩ Undo', function () {
        if (!enabled) return;
        prog.pop();
        draw();
      }, 'btn-ghost'),
      btn('Clear', function () {
        if (!enabled) return;
        prog = [];
        draw();
      }, 'btn-ghost'),
      goBtn
    );
    draw();
    return {
      el: el('div', { class: 'brt-builder' }, strip, fwd, turns, tools),
      set: function (p) {
        prog = p.slice();
        draw();
      },
      get: function () {
        return prog.slice();
      },
      enable: function (on) {
        enabled = on;
        goBtn.disabled = !on;
      },
    };
  }

  /* ---------------------------------------------------------------- *
   * Question generators
   * ---------------------------------------------------------------- */
  function randCell(g) {
    return { c: U.rand(0, g.cols - 1), r: U.rand(0, g.rows - 1) };
  }
  /** Put `n` decoration places on free cells (not in `used`). */
  function decorate(g, n, used, keysUsed) {
    var out = [];
    var keys = U.shuffle(GOALS.filter(function (k) {
      return keysUsed.indexOf(k) < 0;
    }));
    var tries = 0;
    while (out.length < n && tries++ < 200) {
      var p = randCell(g);
      if (used[key(p)]) continue;
      used[key(p)] = true;
      out.push({ c: p.c, r: p.r, k: keys[out.length] });
    }
    return out;
  }
  function addBlocks(g, n, used) {
    var out = [];
    var tries = 0;
    while (out.length < n && tries++ < 300) {
      var p = randCell(g);
      if (used[key(p)]) continue;
      used[key(p)] = true;
      out.push({ c: p.c, r: p.r, k: U.pick(['pond', 'works']) });
    }
    return out;
  }
  function usedSet(cells) {
    var u = {};
    cells.forEach(function (p) {
      u[key(p)] = true;
    });
    return u;
  }
  /** Compass legs that stay on the grid, turning a right angle between legs. */
  function genLegs(g, start, nLegs, lenFor, firstAxis) {
    for (var t = 0; t < 400; t++) {
      var legs = [];
      var d = firstAxis === 'h' ? U.pick([1, 3]) : firstAxis === 'v' ? U.pick([0, 2]) : U.rand(0, 3);
      for (var i = 0; i < nLegs; i++) {
        if (i > 0) d = m4(d + U.pick([1, -1]));
        legs.push({ d: d, n: lenFor(d) });
      }
      var cs = legCells(start, legs);
      if (
        cs.every(function (p) {
          return inGrid(g, p.c, p.r);
        }) &&
        !same(cs[cs.length - 1], start)
      )
        return legs;
    }
    return null;
  }
  function noRepeat(cells) {
    var s = {};
    for (var i = 0; i < cells.length; i++) {
      if (s[key(cells[i])]) return false;
      s[key(cells[i])] = true;
    }
    return true;
  }

  // L1: drive Bolt with compass arrows from a start place to a goal (1 or 2 legs of 1–4).
  function genDrive() {
    var g = { cols: 5, rows: 4 };
    for (;;) {
      var start = randCell(g);
      var legs = genLegs(g, start, U.pick([1, 2, 2]), function () {
        return U.rand(1, 4);
      });
      if (!legs) continue;
      var target = legsEnd(start, legs);
      var tk = U.pick(GOALS);
      var used = usedSet([start, target]);
      return {
        type: 'drive',
        g: g,
        start: start,
        target: target,
        legs: legs,
        startKey: 'home',
        targetKey: tk,
        places: [{ c: start.c, r: start.r, k: 'home' }, { c: target.c, r: target.r, k: tk, goal: true }].concat(decorate(g, 2, used, ['home', tk])),
        sig: 'drive ' + key(start) + ' ' + key(target),
      };
    }
  }
  // L1: count the squares along a drawn route with 2 legs.
  function genCount() {
    var g = { cols: 6, rows: 5 };
    for (;;) {
      var start = randCell(g);
      var legs = genLegs(g, start, 2, function () {
        return U.rand(1, 4);
      });
      if (!legs || legs[0].n + legs[1].n < 3) continue;
      var target = legsEnd(start, legs);
      var sk = U.pick(['home', 'school', 'bus']);
      var tk = U.pick(GOALS.filter(function (k) {
        return k !== sk;
      }));
      var used = usedSet(legCells(start, legs));
      return {
        type: 'count',
        g: g,
        start: start,
        target: target,
        legs: legs,
        startKey: sk,
        targetKey: tk,
        places: [{ c: start.c, r: start.r, k: sk }, { c: target.c, r: target.r, k: tk, goal: true }].concat(decorate(g, 2, used, [sk, tk])),
        sig: 'count ' + key(start) + ' ' + legsText(legs),
      };
    }
  }
  // L1: workbook-style counters: from a star, place counters N, S, W, E (1–4 squares each).
  function genCounters() {
    var g = { cols: 9, rows: 7 };
    for (;;) {
      var n = { 0: U.rand(1, 4), 2: U.rand(1, 4), 3: U.rand(1, 4), 1: U.rand(1, 4) };
      if (n[0] + n[2] > g.rows - 1 || n[1] + n[3] > g.cols - 1) continue;
      if (n[0] === n[2] && n[1] === n[3]) continue;
      var star = { c: U.rand(n[3], g.cols - 1 - n[1]), r: U.rand(n[0], g.rows - 1 - n[2]) };
      var order = U.shuffle([0, 2, 3, 1]);
      var moves = order.map(function (d) {
        return { d: d, n: n[d], at: { c: star.c + DC[d] * n[d], r: star.r + DR[d] * n[d] } };
      });
      return {
        type: 'counters',
        g: g,
        star: star,
        moves: moves,
        sig:
          'counters ' +
          moves
            .map(function (m) {
              return m.n + LET[m.d];
            })
            .join(''),
      };
    }
  }
  // L2: follow written compass moves (square grid or dot grid) and click where Bolt finishes.
  function genFollow(dots) {
    var g = dots ? { cols: 11, rows: 5 } : { cols: 8, rows: 6 };
    for (;;) {
      var start = randCell(g);
      var legs = dots
        ? genLegs(g, start, 4, function (d) {
            return d % 2 ? U.rand(2, 7) : U.rand(1, 2);
          }, 'h')
        : genLegs(g, start, 3, function () {
            return U.rand(1, 4);
          });
      if (!legs) continue;
      var end = legsEnd(start, legs);
      if (Math.abs(end.c - start.c) + Math.abs(end.r - start.r) < 2) continue;
      var sk = U.pick(['home', 'school', 'bus', 'park']);
      return {
        type: 'follow',
        dots: !!dots,
        g: g,
        start: start,
        legs: legs,
        end: end,
        startKey: sk,
        places: dots ? [] : [{ c: start.c, r: start.r, k: sk }],
        sig: 'follow ' + (dots ? 'd ' : 's ') + key(start) + ' ' + legsText(legs),
      };
    }
  }
  // L2: two different quick routes, same totals (workbook: school to hospital, 3 east and 3 north).
  function genTwoRoutes() {
    var g = { cols: 7, rows: 6 };
    var pairs = [
      ['school', 'hospital'],
      ['home', 'library'],
      ['bus', 'park'],
      ['home', 'pool'],
    ];
    for (;;) {
      var nx = U.rand(2, 3);
      var ny = U.rand(2, 3);
      var dh = U.pick([1, 3]);
      var dv = U.pick([0, 2]);
      var start = randCell(g);
      var target = { c: start.c + DC[dh] * nx, r: start.r + DR[dv] * ny };
      if (!inGrid(g, target.c, target.r)) continue;
      var pr = U.pick(pairs);
      // one blocked square inside the rectangle (not at a corner of the route)
      var bc = { c: U.rand(Math.min(start.c, target.c), Math.max(start.c, target.c)), r: U.rand(Math.min(start.r, target.r), Math.max(start.r, target.r)) };
      if (same(bc, start) || same(bc, target)) continue;
      var blocked = [{ c: bc.c, r: bc.r, k: U.pick(['pond', 'works']) }];
      var gg = { cols: g.cols, rows: g.rows, blocked: blocked };
      var routes = monotoneRoutes(gg, start, target, dh, dv);
      if (routes.length < 3) continue;
      var used = usedSet([start, target, bc]);
      // decorations outside the route rectangle
      for (var c = Math.min(start.c, target.c); c <= Math.max(start.c, target.c); c++) for (var r = Math.min(start.r, target.r); r <= Math.max(start.r, target.r); r++) used[c + ',' + r] = true;
      return {
        type: 'two',
        g: gg,
        start: start,
        target: target,
        nx: nx,
        ny: ny,
        dh: dh,
        dv: dv,
        startKey: pr[0],
        targetKey: pr[1],
        routes: [routes[0], routes[routes.length - 1]],
        places: [{ c: start.c, r: start.r, k: pr[0] }, { c: target.c, r: target.r, k: pr[1], goal: true }].concat(decorate(g, 2, used, pr)),
        sig: 'two ' + key(start) + ' ' + key(target) + ' ' + key(bc),
      };
    }
  }
  /** L3: a drawn route for a forward/left/right program. */
  function genProgram(facing, tMin, tMax, kind) {
    var g = kind === 'diff' ? { cols: 7, rows: 6 } : { cols: 8, rows: 6 };
    for (;;) {
      var start = randCell(g);
      var turns = U.rand(tMin, tMax);
      var legs = [];
      var d = facing;
      for (var i = 0; i <= turns; i++) {
        if (i > 0) d = m4(d + U.pick([1, -1]));
        legs.push({ d: d, n: U.rand(1, 4) });
      }
      var cells = legCells(start, legs);
      if (
        !cells.every(function (p) {
          return inGrid(g, p.c, p.r);
        }) ||
        !noRepeat(cells)
      )
        continue;
      var target = cells[cells.length - 1];
      if (Math.abs(target.c - start.c) + Math.abs(target.r - start.r) < 2) continue;
      var used = usedSet(cells);
      var blocked = addBlocks(g, kind === 'diff' ? U.rand(1, 2) : U.rand(2, 3), used);
      var gg = { cols: g.cols, rows: g.rows, blocked: blocked };
      var prog = pathToProgram(facing, cells);
      var tk = U.pick(GOALS);
      var q = {
        type: kind,
        g: gg,
        start: start,
        facing: facing,
        target: target,
        cells: cells,
        prog: prog,
        targetKey: tk,
        places: [{ c: start.c, r: start.r, k: 'start' }, { c: target.c, r: target.r, k: tk, goal: true }].concat(decorate(g, 2, used, [tk])),
        sig: kind + ' ' + key(start) + ' ' + progText(prog),
      };
      if (kind === 'diff') {
        // A different route must exist: avoid one middle square of the drawn route.
        var alt = null;
        for (var k = 1; k < cells.length - 1 && !alt; k++) {
          var av = {};
          av[key(cells[k])] = true;
          alt = bfs(gg, start, target, av);
        }
        if (!alt) continue;
        q.alt = alt;
        q.altProg = pathToProgram(facing, alt);
      }
      return q;
    }
  }

  function buildDeck() {
    var seen = {};
    function uniq(fn) {
      for (var t = 0; t < 100; t++) {
        var q = fn();
        if (!seen[q.sig]) {
          seen[q.sig] = true;
          return q;
        }
      }
      return fn();
    }
    var faces = U.shuffle([0, 2]);
    return [
      uniq(genDrive),
      uniq(genCount),
      uniq(genCounters),
      uniq(function () {
        return genFollow(false);
      }),
      uniq(function () {
        return genFollow(true);
      }),
      uniq(genTwoRoutes),
      uniq(function () {
        return genProgram(faces[0], 2, 3, 'prog');
      }),
      uniq(function () {
        return genProgram(faces[1], 3, 4, 'prog');
      }),
      uniq(function () {
        return genProgram(U.pick([0, 2]), 1, 2, 'diff');
      }),
    ];
  }

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */
  function learnForward(stage, api) {
    api.say('I am facing south. Press the buttons in the order of the cards.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Forward and turns', 'Bolt turns <b>left</b> or <b>right</b> his own way. Count the jumps, not the square he starts on.'));
    var map = makeMap(api, { cols: 6, rows: 5, cell: 54, start: { c: 3, r: 0 }, facing: 2, places: [{ c: 1, r: 1, k: 'park', goal: true }, { c: 4, r: 3, k: 'shop' }, { c: 0, r: 4, k: 'bus' }] });
    var steps = [{ t: 'F', n: 1 }, { t: 'R' }, { t: 'F', n: 2 }];
    var at = 0;
    var cards = el('div', { class: 'brt-prog brt-prog-fixed' });
    var note = el('div', { class: 'brt-note' });
    function drawCards() {
      MQ.clear(cards);
      steps.forEach(function (p, i) {
        cards.appendChild(card(p, i < at ? 'brt-card-done' : i === at ? 'brt-card-now' : '', true));
      });
    }
    function press(p) {
      if (at >= steps.length || map.busy()) return;
      var want = steps[at];
      if (p.t !== want.t || p.n !== want.n) {
        api.feedback('The glowing card says “' + cardText(want) + '”.', 'info');
        return;
      }
      api.feedback('', 'info');
      at++;
      drawCards();
      var acts = [];
      if (p.t === 'F') for (var k = 0; k < p.n; k++) acts.push({ t: 'F' });
      else acts.push({ t: p.t });
      acts.push({
        t: 'fn',
        fn: function () {
          if (p.t === 'R') {
            api.say('I turned to MY right. I was facing south, so now I face west!', 'happy');
            note.innerHTML = '<b>Facing south:</b> Bolt’s right hand points <b>west</b> ←, his left hand points <b>east</b> →.';
            note.classList.add('brt-note-on');
          }
          if (at === steps.length) {
            api.say('Forward 2 means 2 jumps: 1, 2. The square I started on does not count.', 'cheer');
            api.feedback('Bolt reached the park! Look at the numbers: they count the jumps.', 'good');
            api.unlockNext();
          }
        },
      });
      map.act(acts);
    }
    drawCards();
    var btns = el(
      'div',
      { class: 'brt-btns' },
      btn('Forward 1', function () {
        press({ t: 'F', n: 1 });
      }, 'brt-b-f'),
      btn('Forward 2', function () {
        press({ t: 'F', n: 2 });
      }, 'brt-b-f'),
      btn('↺ Turn left', function () {
        press({ t: 'L' });
      }, 'brt-b-t'),
      btn('↻ Turn right', function () {
        press({ t: 'R' });
      }, 'brt-b-t')
    );
    var side = el('div', { class: 'brt-side' }, faceBadge(map), cards, btns, note);
    stage.appendChild(row(map, side));
  }

  function learnRead(stage, api) {
    api.say('Put the cards in order so I follow the dotted path to the shop. Then press Go.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Read a route', 'Click the cards in order. Click a card in the program to take it back.'));
    var g = { cols: 7, rows: 5 };
    var start = { c: 5, r: 0 };
    var path = legCells(start, [
      { d: 2, n: 1 },
      { d: 3, n: 3 },
      { d: 2, n: 3 },
    ]);
    var target = path[path.length - 1];
    var map = makeMap(api, { cols: 7, rows: 5, cell: 52, start: start, facing: 2, places: [{ c: 5, r: 0, k: 'start' }, { c: target.c, r: target.r, k: 'shop', goal: true }, { c: 0, r: 1, k: 'school' }, { c: 4, r: 3, k: 'cafe' }] });
    map.plan(path);
    var all = [{ t: 'F', n: 1 }, { t: 'R' }, { t: 'F', n: 3 }, { t: 'L' }, { t: 'F', n: 3 }];
    var tray = U.shuffle(
      all.map(function (p, i) {
        return { p: p, id: i };
      })
    );
    var prog = [];
    var trayEl = el('div', { class: 'brt-tray' });
    var progEl = el('div', { class: 'brt-prog' });
    var done = false;
    function draw() {
      MQ.clear(trayEl);
      MQ.clear(progEl);
      tray.forEach(function (it, i) {
        var c = card(it.p);
        c.addEventListener('click', function () {
          if (done || map.busy()) return;
          prog.push(tray.splice(i, 1)[0]);
          draw();
        });
        trayEl.appendChild(c);
      });
      if (!prog.length) progEl.appendChild(el('span', { class: 'brt-prog-empty' }, 'Program: click cards to add them'));
      prog.forEach(function (it, i) {
        var c = card(it.p, 'brt-card-in');
        c.addEventListener('click', function () {
          if (done || map.busy()) return;
          tray.push(prog.splice(i, 1)[0]);
          draw();
        });
        progEl.appendChild(c);
      });
    }
    var go = btn('Go ▶', function () {
      if (done || map.busy()) return;
      if (prog.length < all.length) {
        api.feedback('Use all five cards first.', 'info');
        return;
      }
      var p = prog.map(function (it) {
        return it.p;
      });
      var res = simulate(g, start, 2, p);
      map.reset(start.c, start.r, 2);
      var acts = res.steps.slice();
      if (res.stop) acts.push({ t: 'bump' });
      acts.push({
        t: 'fn',
        fn: function () {
          if (!res.stop && cellsKey(res.cells) === cellsKey(path)) {
            done = true;
            api.say('Forward 1, turn right, forward 3, turn left, forward 3. I followed the path!', 'cheer');
            api.feedback('Bolt is at the shop. Facing south, “turn right” made him face west.', 'good');
            api.unlockNext();
          } else if (!res.stop && same(res, target)) {
            api.say('I got to the shop, but not along the dotted path. Try again!', 'think');
            api.feedback('A different route! Now make Bolt follow the dotted path.', 'info');
          } else {
            api.say('Oops, that is not the path. Which way do I face after each turn?', 'oops');
            api.feedback(res.stop === 'off' ? 'Bolt would walk off the map. I face south first: my right is west.' : 'Bolt left the dotted path. Start with forward 1, then think about my right.', 'try');
          }
        },
      });
      map.act(acts);
    }, 'brt-go');
    var reset = btn('Start again', function () {
      if (done) return;
      tray = U.shuffle(tray.concat(prog));
      prog = [];
      map.reset(start.c, start.r, 2);
      draw();
    }, 'btn-ghost');
    draw();
    var side = el('div', { class: 'brt-side' }, el('div', { class: 'brt-face' }, 'Bolt starts facing ', el('b', null, 'south'), ' ↓'), el('div', { class: 'brt-small' }, 'Cards'), trayEl, progEl, el('div', { class: 'brt-btns' }, reset, go));
    stage.appendChild(row(map, side));
  }

  function learnCompass(stage, api) {
    api.say('Compass moves are easier: no turning words. Take me from home to the shop.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Compass moves', 'North is up. Press the arrows. Each press is one jump to the next square.'));
    var g = { cols: 6, rows: 5 };
    var home = { c: 0, r: 4 };
    var shop = { c: 4, r: 1 };
    var map = makeMap(api, { cols: 6, rows: 5, cell: 54, start: home, facing: 0, places: [{ c: 0, r: 4, k: 'home' }, { c: 4, r: 1, k: 'shop', goal: true }, { c: 2, r: 0, k: 'school' }, { c: 5, r: 4, k: 'park' }, { c: 2, r: 3, k: 'bus' }, { c: 0, r: 1, k: 'library' }] });
    var pos = { c: home.c, r: home.r };
    var moves = [];
    var done = false;
    var sentence = el('div', { class: 'brt-sentence' }, '…');
    function upd() {
      sentence.textContent = moves.length ? legsText(compress(moves)) : 'No moves yet';
    }
    var pad = arrowPad(function (d) {
      if (done) return;
      var n = { c: pos.c + DC[d], r: pos.r + DR[d] };
      if (!inGrid(g, n.c, n.r)) {
        api.feedback('That would take Bolt off the map.', 'info');
        return;
      }
      api.feedback('', 'info');
      pos = n;
      moves.push(d);
      upd();
      map.act([{ t: 'M', d: d }]);
      if (same(pos, shop)) {
        done = true;
        map.act([
          {
            t: 'fn',
            fn: function () {
              api.say('We got to the shop! The moves say how many squares and which way.', 'cheer');
              api.feedback('Your route: ' + legsText(compress(moves), 'square') + '.', 'good');
              api.unlockNext();
            },
          },
        ]);
      }
    });
    var reset = btn('Start again', function () {
      if (done) return;
      pos = { c: home.c, r: home.r };
      moves = [];
      upd();
      map.reset(home.c, home.r, 0);
    }, 'btn-ghost');
    upd();
    var side = el('div', { class: 'brt-side' }, el('div', { class: 'brt-small' }, 'Moves so far'), sentence, pad, reset);
    stage.appendChild(row(map, side));
  }

  /* ---------------------------------------------------------------- *
   * Practice questions
   * ---------------------------------------------------------------- */
  function legActs(legs, cls) {
    var out = [];
    legs.forEach(function (l) {
      for (var k = 0; k < l.n; k++) out.push({ t: 'M', d: l.d, cls: cls });
    });
    return out;
  }
  function progActs(prog, start, facing, g) {
    return simulate(g, start, facing, prog).steps;
  }

  /** Mistake tag + hint when a compass-move answer lands on `got` instead of `end`. */
  function compassMistake(start, legs, got) {
    var minus = legsEnd(
      start,
      legs.map(function (l) {
        return { d: l.d, n: l.n - 1 };
      })
    );
    var swapEW = legsEnd(
      start,
      legs.map(function (l) {
        return { d: l.d % 2 ? m4(l.d + 2) : l.d, n: l.n };
      })
    );
    var swapNS = legsEnd(
      start,
      legs.map(function (l) {
        return { d: l.d % 2 ? l.d : m4(l.d + 2), n: l.n };
      })
    );
    if (same(got, minus)) return { tag: 'Counted the starting square', hint: 'Do not count the square Bolt starts on. Count the jumps.' };
    if (same(got, swapEW)) return { tag: 'Swapped east and west', hint: 'Check east and west on the compass: east is to the right of the map.' };
    if (same(got, swapNS)) return { tag: 'Swapped north and south', hint: 'North is up on the map. South is down.' };
    for (var k = 1; k < legs.length; k++) {
      if (same(got, legsEnd(start, legs.slice(0, k)))) return { tag: 'Missed a move', hint: 'That is where Bolt is after ' + plural(k, 'move') + '. Do every move in the list.' };
    }
    return { tag: 'Lost count of squares', hint: 'Follow the moves one at a time and count each jump.' };
  }

  function qDrive(stage, api, q) {
    api.say('Drive me from home to ' + the(q.targetKey) + '. Press the compass arrows.', 'think');
    stage.appendChild(MQ.ui.prompt('Move Bolt to ' + placeHtml(q.targetKey) + ', then press <b>Bolt is there</b>.'));
    var map = makeMap(api, { cols: q.g.cols, rows: q.g.rows, cell: 60, start: q.start, facing: 0, places: q.places });
    var pos = { c: q.start.c, r: q.start.r };
    var moves = [];
    var sentence = el('div', { class: 'brt-sentence' });
    function upd() {
      sentence.textContent = moves.length ? legsText(compress(moves)) : 'No moves yet';
    }
    var pad = arrowPad(function (d) {
      if (api.isAnswered()) return;
      var n = { c: pos.c + DC[d], r: pos.r + DR[d] };
      if (!inGrid(q.g, n.c, n.r)) {
        api.feedback('That would take Bolt off the map.', 'info');
        return;
      }
      pos = n;
      moves.push(d);
      upd();
      map.act([{ t: 'M', d: d }]);
    });
    var reset = btn('Start again', function () {
      if (api.isAnswered()) return;
      pos = { c: q.start.c, r: q.start.r };
      moves = [];
      upd();
      map.reset(q.start.c, q.start.r, 0);
    }, 'btn-ghost');
    var there = btn('Bolt is there ✓', function () {
      if (api.isAnswered()) return;
      if (!moves.length) {
        api.feedback('Move Bolt with the arrows first.', 'info');
        return;
      }
      if (same(pos, q.target)) {
        api.check(true, 'Yes! ' + cap(legsText(compress(moves), 'square')) + '.');
        return;
      }
      var m = compassMistake(q.start, q.legs, pos);
      var tag = m.tag === 'Swapped east and west' || m.tag === 'Swapped north and south' ? m.tag : 'Lost count of squares';
      var hint = 'Bolt is ' + relText(pos, q.target) + ' of ' + the(q.targetKey) + '.';
      if (api.tries() >= 1) hint += ' Press Start again. Count the squares from home to ' + the(q.targetKey) + ' with your finger first.';
      api.check(false, hint, tag);
    }, 'brt-go');
    upd();
    stage.appendChild(row(map, el('div', { class: 'brt-side' }, el('div', { class: 'brt-small' }, 'Moves so far'), sentence, pad, el('div', { class: 'brt-btns' }, reset, there))));
    api.onReveal(function () {
      map.reset(q.start.c, q.start.r, 0);
      map.act(legActs(q.legs));
      sentence.textContent = legsText(q.legs);
      api.feedback('From home: ' + legsText(q.legs, 'square') + '. Count the jumps, not the start square.', 'info');
    });
  }

  function qCount(stage, api, q) {
    api.say('Look at the dotted path. How many squares does Bolt go each way?', 'think');
    stage.appendChild(MQ.ui.prompt('Bolt goes from ' + placeHtml(q.startKey) + ' to ' + placeHtml(q.targetKey) + '.'));
    var map = makeMap(api, { cols: q.g.cols, rows: q.g.rows, cell: 56, start: q.start, facing: q.legs[0].d, places: q.places });
    map.plan(legCells(q.start, q.legs));
    var boxes = q.legs.map(function () {
      return numBox();
    });
    var line = el('div', { class: 'brt-fill' });
    q.legs.forEach(function (l, i) {
      line.appendChild(el('div', { class: 'brt-fill-row' }, boxes[i], el('span', null, ' squares '), el('b', null, DN[l.d] + ' ' + ARW[l.d]), i === 0 ? el('span', null, ', then') : null));
    });
    var chk = btn('Check', submit, 'brt-go');
    boxes.forEach(function (b) {
      b.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') submit();
      });
    });
    function submit() {
      if (api.isAnswered()) return;
      var vals = boxes.map(readNum);
      if (vals.indexOf(null) >= 0) {
        api.feedback('Type a number in each box.', 'info');
        return;
      }
      var wrong = -1;
      q.legs.forEach(function (l, i) {
        boxes[i].classList.remove('brt-in-bad');
        if (vals[i] !== l.n && wrong < 0) wrong = i;
      });
      if (wrong < 0) {
        api.check(true, cap(legsText(q.legs, 'square')) + '. Well counted!');
        return;
      }
      boxes[wrong].classList.add('brt-in-bad');
      var l = q.legs[wrong];
      var hint;
      var tag;
      if (vals[wrong] === l.n + 1) {
        tag = 'Counted the starting square';
        hint = 'Check the ' + DN[l.d] + ' part. Do not count the square Bolt starts on: count the jumps.';
      } else {
        tag = 'Lost count of squares';
        hint = 'Count the ' + DN[l.d] + ' part of the path again, one jump at a time.';
      }
      if (api.tries() >= 1) hint += ' Put your finger where the ' + DN[l.d] + ' part starts and say “1” on the first new square.';
      api.check(false, hint, tag);
    }
    stage.appendChild(row(map, el('div', { class: 'brt-side' }, line, chk)));
    boxes[0].focus();
    api.onReveal(function () {
      q.legs.forEach(function (l, i) {
        boxes[i].value = l.n;
        boxes[i].classList.remove('brt-in-bad');
      });
      map.reset(q.start.c, q.start.r, q.legs[0].d);
      map.act(legActs(q.legs));
      api.feedback('Watch the numbers: ' + legsText(q.legs, 'square') + '.', 'info');
    });
  }

  function qCounters(stage, api, q) {
    api.say('Start at the star every time. Count the jumps, not the star square.', 'think');
    stage.appendChild(MQ.ui.prompt('Click where each counter goes. Always start from the <b>star</b> ★.'));
    var at = 0;
    var placed = {};
    var lastBad = null;
    var list = el('div', { class: 'brt-list' });
    var map = makeMap(api, { cols: q.g.cols, rows: q.g.rows, cell: 46, star: q.star, onCell: onCell });
    function drawList() {
      MQ.clear(list);
      q.moves.forEach(function (m, i) {
        list.appendChild(el('div', { class: 'brt-li' + (i < at ? ' brt-li-done' : i === at ? ' brt-li-now' : '') }, el('span', { class: 'brt-counter-chip' }, String(i + 1)), plural(m.n, 'square') + ' ' + DN[m.d] + ' ' + ARW[m.d]));
      });
    }
    function showMove(i, cls) {
      var m = q.moves[i];
      map.counter(m.at.c, m.at.r, String(i + 1), cls);
      placed[key(m.at)] = true;
    }
    function onCell(c, r) {
      if (api.isAnswered() || at >= q.moves.length) return;
      var p = { c: c, r: r };
      if (same(p, q.star)) {
        api.feedback('That is the star. Count jumps away from it.', 'info');
        return;
      }
      if (placed[key(p)]) {
        api.feedback('A counter is already there.', 'info');
        return;
      }
      var m = q.moves[at];
      if (lastBad) {
        lastBad.remove();
        lastBad = null;
      }
      if (same(p, m.at)) {
        showMove(at, '');
        map.reset(q.star.c, q.star.r, m.d);
        map.showBolt(false);
        map.act(legActs([{ d: m.d, n: m.n }]));
        at++;
        drawList();
        if (at === q.moves.length) api.check(true, 'All four counters are in the right place!');
        else {
          api.sound('pop');
          api.feedback('Counter ' + at + ' is right. Now counter ' + (at + 1) + '.', 'good');
        }
        return;
      }
      lastBad = map.mark(c, r, 'bad');
      var opp = { c: q.star.c - DC[m.d] * m.n, r: q.star.r - DR[m.d] * m.n };
      var short = { c: q.star.c + DC[m.d] * (m.n - 1), r: q.star.r + DR[m.d] * (m.n - 1) };
      var tag;
      var hint;
      if (same(p, short)) {
        tag = 'Counted the starting square';
        hint = 'One more jump! The star square is not 1. The first square after the star is 1.';
      } else if (same(p, opp)) {
        tag = m.d % 2 ? 'Swapped east and west' : 'Swapped north and south';
        hint = 'Right number, wrong way. ' + cap(DN[m.d]) + ' is ' + ARW[m.d] + ' on the compass.';
      } else {
        var onLine = (p.c === q.star.c && DC[m.d] === 0 && Math.sign(p.r - q.star.r) === DR[m.d]) || (p.r === q.star.r && DR[m.d] === 0 && Math.sign(p.c - q.star.c) === DC[m.d]);
        tag = onLine ? 'Lost count of squares' : 'Mixed up the compass directions';
        hint = onLine ? 'Right way, but count the jumps from the star again.' : 'Go ' + DN[m.d] + ' ' + ARW[m.d] + ' from the star, in a straight line.';
      }
      if (api.tries() >= 1) hint += ' Put your finger on the star and jump ' + DN[m.d] + ': 1, 2' + (m.n > 2 ? ', 3…' : '…');
      api.check(false, hint, tag);
    }
    drawList();
    stage.appendChild(row(map, el('div', { class: 'brt-side' }, el('div', { class: 'brt-small' }, 'Counters'), list)));
    api.onReveal(function () {
      if (lastBad) lastBad.remove();
      for (var i = at; i < q.moves.length; i++) showMove(i, 'brt-counter-show');
      at = q.moves.length;
      drawList();
      map.reset(q.star.c, q.star.r, 0);
      map.showBolt(false);
      var acts = [];
      q.moves.forEach(function (m) {
        acts.push({
          t: 'fn',
          fn: function () {
            map.place(q.star.c, q.star.r, m.d);
          },
        });
        acts = acts.concat(legActs([{ d: m.d, n: m.n }]));
      });
      map.act(acts);
      api.feedback(
        'From the star: ' +
          q.moves
            .map(function (m) {
              return m.n + ' ' + DN[m.d];
            })
            .join(', ') +
          '. The numbers count the jumps.',
        'info'
      );
    });
  }

  function qFollow(stage, api, q) {
    var word = q.dots ? 'dot' : 'square';
    api.say(q.dots ? 'Move along the dots. Count the jumps from dot to dot.' : 'Follow the moves in order. Where do I finish?', 'think');
    stage.appendChild(MQ.ui.prompt('Bolt starts ' + (q.dots ? 'at the green dot' : 'at ' + placeHtml(q.startKey)) + '. Do the moves, then <b>click where he finishes</b>.'));
    var lastBad = null;
    var map = makeMap(api, { cols: q.g.cols, rows: q.g.rows, cell: q.dots ? 46 : 52, start: q.start, facing: q.legs[0].d, places: q.places, dots: q.dots, onCell: onCell });
    if (q.dots) map.mark(q.start.c, q.start.r, 'start');
    var list = el('div', { class: 'brt-list' });
    q.legs.forEach(function (l, i) {
      list.appendChild(el('div', { class: 'brt-li' }, el('span', { class: 'brt-counter-chip' }, String(i + 1)), plural(l.n, word) + ' ' + DN[l.d] + ' ' + ARW[l.d]));
    });
    function onCell(c, r) {
      if (api.isAnswered()) return;
      var p = { c: c, r: r };
      if (same(p, q.start)) {
        api.feedback('That is where Bolt starts. Do the moves first.', 'info');
        return;
      }
      if (lastBad) {
        lastBad.remove();
        lastBad = null;
      }
      if (same(p, q.end)) {
        map.mark(c, r, 'good');
        map.act(legActs(q.legs));
        api.check(true, 'Yes! Bolt finishes there.');
        return;
      }
      lastBad = map.mark(c, r, 'bad');
      var m = compassMistake(q.start, q.legs, p);
      var hint = m.hint;
      if (q.dots && m.tag === 'Counted the starting square') hint = 'Count jumps between dots. The dot Bolt is on is not 1.';
      if (api.tries() >= 1) hint += ' Use your finger: do move 1, stop, then move 2 from there…';
      api.check(false, hint, m.tag);
    }
    stage.appendChild(row(map, el('div', { class: 'brt-side' }, el('div', { class: 'brt-small' }, 'Moves'), list)));
    api.onReveal(function () {
      if (lastBad) lastBad.remove();
      map.mark(q.end.c, q.end.r, 'good');
      map.reset(q.start.c, q.start.r, q.legs[0].d);
      map.act(legActs(q.legs));
      api.feedback('Do each move from where the last one stopped: ' + legsText(q.legs, word) + '.', 'info');
    });
  }

  function qTwo(stage, api, q) {
    var hName = DN[q.dh];
    var vName = DN[q.dv];
    api.say('Find two different routes. Quick routes only go ' + hName + ' and ' + vName + '.', 'think');
    stage.appendChild(MQ.ui.prompt('Find <b>two different routes</b> from ' + placeHtml(q.startKey) + ' to ' + placeHtml(q.targetKey) + '.'));
    var map = makeMap(api, { cols: q.g.cols, rows: q.g.rows, cell: 52, start: q.start, facing: q.dv, places: q.places, blocked: q.g.blocked });
    var phase = 1;
    var pos = { c: q.start.c, r: q.start.r };
    var moves = [];
    var routes = [];
    var lines = [el('div', { class: 'brt-route brt-route-1' }, 'Route 1: …'), el('div', { class: 'brt-route brt-route-2' }, 'Route 2: …')];
    var sum = el('div', { class: 'brt-fill brt-hide' });
    var boxH = numBox();
    var boxV = numBox();
    sum.appendChild(el('div', { class: 'brt-fill-row' }, el('span', null, 'Each route goes '), boxH, el('b', null, ' ' + hName)));
    sum.appendChild(el('div', { class: 'brt-fill-row' }, el('span', null, 'and '), boxV, el('b', null, ' ' + vName), el('span', null, ' in total.')));
    var chk = btn('Check', submit, 'brt-go brt-hide');
    function txt(ms) {
      return ms.length ? legsText(compress(ms)) : '…';
    }
    function upd() {
      lines[phase - 1].textContent = 'Route ' + phase + ': ' + txt(moves);
    }
    function canMove(p, d) {
      var n = { c: p.c + DC[d], r: p.r + DR[d] };
      if (!inGrid(q.g, n.c, n.r) || blockAt(q.g, n.c, n.r)) return false;
      if (d === q.dh && Math.abs(q.target.c - n.c) >= Math.abs(q.target.c - p.c)) return false;
      if (d === q.dv && Math.abs(q.target.r - n.r) >= Math.abs(q.target.r - p.r)) return false;
      return true;
    }
    var pad = arrowPad(function (d) {
      if (api.isAnswered() || phase > 2) return;
      var n = { c: pos.c + DC[d], r: pos.r + DR[d] };
      if (!canMove(pos, d)) {
        var b = blockAt(q.g, n.c, n.r);
        api.feedback(b ? 'The ' + BLOCKS[b.k].n + ' is in the way.' : 'That goes past ' + the(q.targetKey) + '.', 'info');
        return;
      }
      api.feedback('', 'info');
      pos = n;
      moves.push(d);
      upd();
      map.act([{ t: 'M', d: d, cls: phase === 2 ? 'brt-trail-2' : '' }]);
      if (same(pos, q.target)) {
        var cells = legCells(q.start, compress(moves));
        if (phase === 2 && cellsKey(cells) === cellsKey(routes[0])) {
          api.feedback('That is the same as route 1. Press Start again and try another way.', 'info');
          api.say('Same route! Change where you turn.', 'think');
          return;
        }
        routes.push(cells);
        var done = moves.slice();
        map.act([
          {
            t: 'fn',
            fn: function () {
              map.plan(routes[routes.length - 1], routes.length === 1 ? 'brt-plan-1' : 'brt-plan-2');
              if (routes.length === 1) {
                phase = 2;
                pos = { c: q.start.c, r: q.start.r };
                moves = [];
                map.reset(q.start.c, q.start.r, q.dv);
                api.say('Route 1 is done. Now find a different route!', 'happy');
                lines[0].textContent = 'Route 1: ' + txt(done) + ' ✓';
              } else {
                phase = 3;
                lines[1].textContent = 'Route 2: ' + txt(done) + ' ✓';
                sum.classList.remove('brt-hide');
                chk.classList.remove('brt-hide');
                padWrap.classList.add('brt-hide');
                boxH.focus();
                api.say('Two routes! Now add up the moves in each route.', 'happy');
              }
            },
          },
        ]);
      } else {
        var stuck = !canMove(pos, q.dh) && !canMove(pos, q.dv);
        if (stuck) api.feedback('Bolt is stuck! Press Start again.', 'info');
      }
    }, [q.dh, q.dv]);
    var reset = btn('Start again', function () {
      if (api.isAnswered() || phase > 2) return;
      pos = { c: q.start.c, r: q.start.r };
      moves = [];
      upd();
      map.reset(q.start.c, q.start.r, q.dv);
      lines[phase - 1].textContent = 'Route ' + phase + ': …';
    }, 'btn-ghost');
    var padWrap = el('div', { class: 'brt-padwrap' }, pad, reset);
    [boxH, boxV].forEach(function (b) {
      b.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') submit();
      });
    });
    function submit() {
      if (api.isAnswered()) return;
      var h = readNum(boxH);
      var v = readNum(boxV);
      if (h === null || v === null) {
        api.feedback('Type a number in each box.', 'info');
        return;
      }
      boxH.classList.toggle('brt-in-bad', h !== q.nx);
      boxV.classList.toggle('brt-in-bad', v !== q.ny);
      if (h === q.nx && v === q.ny) {
        api.check(true, 'Yes! Different order, same totals: ' + q.nx + ' ' + hName + ' and ' + q.ny + ' ' + vName + '.');
        return;
      }
      var plus1 = (h !== q.nx && h === q.nx + 1) || (v !== q.ny && v === q.ny + 1);
      var tag = plus1 ? 'Counted the starting square' : 'Lost count of squares';
      var hint = plus1 ? 'Count jumps, not squares: ' + the(q.startKey) + ' itself does not count.' : 'Add up the ' + (h !== q.nx ? hName : vName) + ' moves in route 1.';
      if (api.tries() >= 1) hint += ' Route 1 says: ' + txt(cellsToDirs(routes[0])) + '.';
      api.check(false, hint, tag);
    }
    function addWorking(cells) {
      var legs = compress(cellsToDirs(cells));
      var hs = legs.filter(function (l) {
        return l.d === q.dh;
      });
      var vs = legs.filter(function (l) {
        return l.d === q.dv;
      });
      function s(arr) {
        return arr
          .map(function (l) {
            return l.n;
          })
          .join(' + ');
      }
      return hName + ': ' + s(hs) + ' = ' + q.nx + ' · ' + vName + ': ' + s(vs) + ' = ' + q.ny;
    }
    stage.appendChild(row(map, el('div', { class: 'brt-side' }, lines[0], lines[1], padWrap, sum, chk)));
    api.onReveal(function () {
      var rs = routes.length === 2 ? routes : q.routes;
      map.clearPlan();
      map.plan(rs[0], 'brt-plan-1');
      map.plan(rs[1], 'brt-plan-2');
      lines[0].innerHTML = 'Route 1: ' + txt(cellsToDirs(rs[0])) + '<br><small>' + addWorking(rs[0]) + '</small>';
      lines[1].innerHTML = 'Route 2: ' + txt(cellsToDirs(rs[1])) + '<br><small>' + addWorking(rs[1]) + '</small>';
      boxH.value = q.nx;
      boxV.value = q.ny;
      boxH.classList.remove('brt-in-bad');
      boxV.classList.remove('brt-in-bad');
      sum.classList.remove('brt-hide');
      padWrap.classList.add('brt-hide');
      chk.classList.add('brt-hide');
      phase = 3;
      map.reset(q.start.c, q.start.r, q.dv);
      map.act(legActs(compress(cellsToDirs(rs[1])), 'brt-trail-2'));
      api.feedback('Both routes: ' + q.nx + ' ' + hName + ' and ' + q.ny + ' ' + vName + '. Only the order changes.', 'info');
    });
  }

  function blockWords(bl) {
    var ks = [];
    bl.forEach(function (b) {
      if (ks.indexOf(b.k) < 0) ks.push(b.k);
    });
    return ks
      .map(function (k) {
        return k === 'pond' ? 'pond' : 'roadworks';
      })
      .join(' and ');
  }

  function qProgram(stage, api, q) {
    var diff = q.type === 'diff';
    var faceWord = DN[q.facing];
    if (diff) {
      api.say('Route 1 works. Can you make a different program that still gets me to ' + the(q.targetKey) + '?', 'think');
      stage.appendChild(MQ.ui.prompt('Make a <b>different route</b> to ' + placeHtml(q.targetKey) + '. Keep off the ' + blockWords(q.g.blocked) + '.'));
    } else {
      api.say('I start facing ' + faceWord + '. Remember: left and right are MY left and right.', 'think');
      stage.appendChild(MQ.ui.prompt('Make a program to get Bolt to ' + placeHtml(q.targetKey) + '. The dotted path shows one way.'));
    }
    var map = makeMap(api, { cols: q.g.cols, rows: q.g.rows, cell: 46, start: q.start, facing: q.facing, places: q.places, blocked: q.g.blocked });
    map.plan(q.cells, diff ? 'brt-plan-1' : '');
    var running = false;
    var builder = programBuilder(function (prog) {
      if (api.isAnswered() || running) return;
      if (!prog.length) {
        api.feedback('Add some cards first.', 'info');
        return;
      }
      var res = simulate(q.g, q.start, q.facing, prog);
      var ok = !res.stop && same(res, q.target);
      if (ok && diff && cellsKey(res.cells) === cellsKey(q.cells)) {
        api.feedback('That is the same path as route 1. Try going round a different way.', 'info');
        return;
      }
      running = true;
      builder.enable(false);
      map.reset(q.start.c, q.start.r, q.facing);
      var acts = res.steps.slice();
      if (res.stop) acts.push({ t: 'bump' });
      acts.push({
        t: 'fn',
        fn: function () {
          running = false;
          builder.enable(true);
          if (ok) {
            api.check(true, diff ? 'A different route that works! ' + cap(progText(prog)) + '.' : 'Bolt is at ' + the(q.targetKey) + '! Great program.');
            builder.enable(false);
            return;
          }
          judge(prog, res);
        },
      });
      map.act(acts);
    });
    function reaches(p) {
      var r = simulate(q.g, q.start, q.facing, p);
      return !r.stop && same(r, q.target);
    }
    function judge(prog, res) {
      var swapped = prog.map(function (p) {
        return p.t === 'L' ? { t: 'R' } : p.t === 'R' ? { t: 'L' } : p;
      });
      var minus = prog
        .map(function (p) {
          return p.t === 'F' ? { t: 'F', n: p.n - 1 } : p;
        })
        .filter(function (p) {
          return p.t !== 'F' || p.n > 0;
        });
      var where = res.stop === 'off' ? 'Bolt would walk off the map.' : res.stop === 'blocked' ? 'Bolt bumped into the ' + BLOCKS[res.block.k].n + '.' : 'Bolt stopped ' + relText(res, q.target) + ' of ' + the(q.targetKey) + '.';
      var tag;
      var hint;
      var hasTurn = prog.some(function (p) {
        return p.t !== 'F';
      });
      if (hasTurn && reaches(swapped)) {
        // Which way was Bolt facing at the first turn?
        var f = q.facing;
        tag = f === 2 ? 'Left and right swapped when facing south' : 'Mixed up Bolt’s left and right';
        hint = where + ' Your turns go the wrong way. Bolt faces ' + DN[f] + ' at the start: his right is ' + DN[m4(f + 1)] + ' on the map.';
        if (api.tries() >= 1) hint += ' Turn your own body to face the way Bolt faces, then turn.';
      } else if (reaches(minus)) {
        tag = 'Counted the starting square';
        hint = where + ' Your forward numbers are 1 too big. Do not count the square Bolt is on.';
      } else {
        tag = 'Lost count of squares';
        hint = where + ' Check each forward number and each turn.';
        if (api.tries() >= 1) hint += diff ? ' Plan a new way with your finger first: count the jumps, then say which way Bolt turns.' : ' Follow the dotted path with your finger: count the jumps, then say which way Bolt turns.';
      }
      api.check(false, hint, tag);
    }
    var side = el('div', { class: 'brt-side brt-side-wide' }, el('div', { class: 'brt-face' }, 'Bolt starts facing ', el('b', null, faceWord), ' ' + ARW[q.facing]));
    if (diff) side.appendChild(el('div', { class: 'brt-route brt-route-1' }, 'Route 1: ' + progText(q.prog)));
    side.appendChild(builder.el);
    stage.appendChild(row(map, side));
    api.onReveal(function () {
      var prog = diff ? q.altProg : q.prog;
      var cells = diff ? q.alt : q.cells;
      builder.set(prog);
      builder.enable(false);
      running = true;
      if (diff) map.plan(cells, 'brt-plan-2');
      map.reset(q.start.c, q.start.r, q.facing);
      map.act(progActs(prog, q.start, q.facing, q.g));
      api.feedback((diff ? 'Route 2: ' : 'One program: ') + progText(prog) + '. The numbers count Bolt’s jumps.', 'info');
    });
  }

  var deck = null;

  MQ.register('robot-route', {
    learn: [learnForward, learnRead, learnCompass],
    practice: {
      count: 9,
      buildDeck: buildDeck,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'drive') qDrive(stage, api, q);
        else if (q.type === 'count') qCount(stage, api, q);
        else if (q.type === 'counters') qCounters(stage, api, q);
        else if (q.type === 'follow') qFollow(stage, api, q);
        else if (q.type === 'two') qTwo(stage, api, q);
        else qProgram(stage, api, q);
      },
    },
  });

  document.head.appendChild(
    el(
      'style',
      { 'data-activity': 'robot-route' },
      [
        '.brt-row{display:flex;gap:20px;align-items:center;justify-content:center;flex-wrap:wrap;width:100%}',
        '.brt-mapbox{flex:0 1 auto;max-width:100%;min-width:0}',
        '.brt-map{display:block;max-width:100%;height:auto;user-select:none}',
        '.brt-side{display:flex;flex-direction:column;gap:10px;align-items:stretch;flex:0 1 300px;min-width:240px;max-width:340px}',
        '.brt-side-wide{flex-basis:320px;max-width:340px}',
        '.brt-startcell{fill:#d8f5e0;stroke:#2a9d4f;stroke-width:2}',
        '.brt-bg{fill:#fff;stroke:#9fb0c4;stroke-width:2}',
        '.brt-bg-dots{fill:#fbfcfe}',
        '.brt-line{stroke:#cfd9e5;stroke-width:1.5}',
        '.brt-dot{fill:#4a5a70}',
        '.brt-emoji{text-anchor:middle;dominant-baseline:central}',
        '.brt-label{text-anchor:middle;font-weight:700;fill:#4a5568}',
        '.brt-goal{fill:#fff3c4;stroke:#e9b949;stroke-width:2}',
        '.brt-pond{fill:#bfe3fa;stroke:#7cb9e0;stroke-width:1.5}',
        '.brt-works{fill:#ffe2bf;stroke:#f0a35e;stroke-width:1.5;stroke-dasharray:4 3}',
        '.brt-star{fill:#ffcf33;stroke:#c48a00;stroke-width:2}',
        '.brt-rose-ring{fill:#fff;stroke:#9fb0c4;stroke-width:2}',
        '.brt-rose-n{fill:#d62828}.brt-rose-s{fill:#8796a8}',
        '.brt-rose-t{font-size:14px;font-weight:800;text-anchor:middle;dominant-baseline:central;fill:#3d4a5c}',
        '.brt-rose-tn{fill:#d62828;font-size:16px}',
        '.brt-plan{fill:none;stroke:#2a9d8f;stroke-width:5;stroke-dasharray:1 10;stroke-linecap:round;stroke-linejoin:round}',
        '.brt-plan-head{fill:#2a9d8f}',
        '.brt-plan-1{stroke:#3a86ff}.brt-plan-2{stroke:#9b5de5}',
        '.brt-trail{stroke:#f4a261;stroke-width:6;stroke-linecap:round;opacity:.85}',
        '.brt-trail-2{stroke:#9b5de5}',
        '.brt-num circle{fill:#fff;stroke:#e07a1f;stroke-width:2}',
        '.brt-num text{font-size:11px;font-weight:800;text-anchor:middle;dominant-baseline:central;fill:#b45309}',
        '.brt-hit{fill:transparent;cursor:pointer}.brt-hit:hover{fill:rgba(58,134,255,.12)}',
        '.brt-mark{stroke-width:3}.brt-mark-bad{fill:#ffe0e0;stroke:#e63946}.brt-mark-good{fill:#d8f5e0;stroke:#2a9d4f}.brt-mark-start{fill:#d8f5e0;stroke:#2a9d4f}',
        '.brt-counter circle{fill:#e63946;stroke:#fff;stroke-width:2}.brt-counter text{fill:#fff;font-weight:800;font-size:13px;text-anchor:middle;dominant-baseline:central}',
        '.brt-counter-show circle{fill:#2a9d4f}',
        '.brt-bolt{transition:transform .32s ease}.brt-instant{transition:none!important}',
        '.brt-nose{fill:#2563eb}.brt-wheel{fill:#3d4a5c}.brt-body{fill:#dfe7f1;stroke:#3d4a5c;stroke-width:4}.brt-visor{fill:#1d3557}.brt-eye{fill:#7df9ff}.brt-knob{fill:#ffb703;stroke:#3d4a5c;stroke-width:2}',
        '.brt-bump{animation:brtBump .45s ease}',
        '@keyframes brtBump{25%{transform:translateY(-8px)}50%{transform:translateY(4px)}75%{transform:translateY(-3px)}}',
        '.brt-face{font-size:1.1rem;font-weight:700;padding:6px 12px;border-radius:12px;background:var(--info-bg,#eef4ff);text-align:center}',
        '.brt-small{font-size:.95rem;font-weight:700;color:var(--ink-soft)}',
        '.brt-sentence{font-size:1.3rem;font-weight:800;min-height:1.6em;text-align:center}',
        '.brt-pad{display:grid;grid-template-columns:repeat(3,72px);gap:6px;justify-content:center}',
        '.brt-arrow{display:flex;flex-direction:column;align-items:center;padding:6px 0;min-width:0;line-height:1.1}',
        '.brt-arrow-a{font-size:1.4rem}.brt-arrow-l{font-size:.8rem}',
        '.brt-pad-mid{display:flex;align-items:center;justify-content:center;font-size:1.6rem}',
        '.brt-padwrap{display:flex;flex-direction:column;gap:8px;align-items:center}',
        '.brt-btns{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}',
        '.brt-side .btn{padding:7px 11px;font-size:.98rem}',
        '.brt-side .brt-arrow{padding:5px 0}',
        '.brt-b-t{background:#fff4e0}',
        '.brt-go{font-weight:800}',
        '.brt-card{display:inline-flex;align-items:center;padding:4px 8px;border-radius:9px;border:2px solid #9fb0c4;background:#fff;font:inherit;font-weight:800;font-size:.9rem;cursor:pointer;color:var(--ink)}',
        '.brt-fwd{align-items:center}.brt-fwd-l{font-weight:800;margin-right:2px}.brt-side .brt-b-n{min-width:44px;padding:7px 0}',
        '.brt-card-still{cursor:default}',
        '.brt-card-turn{background:#fff4e0;border-color:#f0a35e}',
        '.brt-card-now{box-shadow:0 0 0 4px #ffd166}',
        '.brt-card-done{opacity:.5}',
        '.brt-prog{display:flex;flex-wrap:wrap;gap:5px;min-height:44px;padding:6px;border:2px dashed #9fb0c4;border-radius:12px;background:var(--paper-2);align-items:center}',
        '.brt-prog-fixed{justify-content:center}',
        '.brt-prog-empty{color:var(--ink-soft);font-size:.95rem}',
        '.brt-tray{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;min-height:38px}',
        '.brt-note{font-size:1rem;padding:8px 10px;border-radius:10px;background:var(--paper-2);opacity:0;transition:opacity .3s}',
        '.brt-note-on{opacity:1}',
        '.brt-list{display:flex;flex-direction:column;gap:6px}',
        '.brt-li{display:flex;align-items:center;gap:10px;font-size:1.2rem;font-weight:800;padding:4px 8px;border-radius:10px}',
        '.brt-li-now{background:#fff3c4}.brt-li-done{opacity:.55}',
        '.brt-counter-chip{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#e63946;color:#fff;font-size:.9rem}',
        '.brt-fill{display:flex;flex-direction:column;gap:8px;font-size:1.2rem}',
        '.brt-fill-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap}',
        '.brt-in{width:58px;font:inherit;font-size:1.3rem;font-weight:800;text-align:center;padding:6px;border:2px solid #9fb0c4;border-radius:10px}',
        '.brt-in-bad{border-color:#e63946;background:#fff0f0}',
        '.brt-route{font-size:1.05rem;font-weight:800;padding:6px 10px;border-radius:10px;border-left:6px solid #3a86ff;background:var(--paper-2)}',
        '.brt-route-2{border-left-color:#9b5de5}',
        '.brt-route small{font-weight:600;font-size:.9rem}',
        '.brt-hide{display:none!important}',
        '.brt-builder{display:flex;flex-direction:column;gap:8px}',
        '@media (max-width:900px){.brt-side,.brt-side-wide{max-width:100%;flex-basis:100%}}',
      ].join('\n')
    )
  );
})();

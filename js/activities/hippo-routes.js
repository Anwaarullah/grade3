/* Hippo to the River — find routes on a block grid, moving only east or south (Unit 15.1, Think like a mathematician). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  var ARROW = { E: '→', S: '↓', W: '←', N: '↑' };
  var WORD = { E: 'east', S: 'south', W: 'west', N: 'north' };
  var DX = { E: 1, S: 0, W: -1, N: 0 };
  var DY = { E: 0, S: 1, W: 0, N: -1 };

  /* ---------------- route maths ---------------- */

  // Every east/south route on a cols x rows block grid, in "all east first" order.
  function allRoutes(cols, rows) {
    var out = [];
    (function walk(x, y, path) {
      if (x === cols && y === rows) {
        out.push(path);
        return;
      }
      if (x < cols) walk(x + 1, y, path + 'E');
      if (y < rows) walk(x, y + 1, path + 'S');
    })(0, 0, '');
    return out;
  }

  function points(moves) {
    var x = 0,
      y = 0,
      pts = [[0, 0]];
    for (var i = 0; i < moves.length; i++) {
      x += DX[moves[i]];
      y += DY[moves[i]];
      pts.push([x, y]);
    }
    return pts;
  }

  function countOf(moves, m) {
    return moves.split('').filter(function (c) {
      return c === m;
    }).length;
  }

  function randomRoute(cols, rows) {
    return U.shuffle(U.range(0, cols + rows - 1).map(function (i) {
      return i < cols ? 'E' : 'S';
    })).join('');
  }

  // A route from corner to corner that uses exactly one north or west step, never reuses a crossing.
  function brokenRoute(cols, rows) {
    for (var attempt = 0; attempt < 200; attempt++) {
      var res = null;
      var seen = {};
      seen['0,0'] = true;
      var walk = function (x, y, path, back) {
        if (res) return;
        if (x === cols && y === rows) {
          if (back === 1) res = path;
          return;
        }
        if (path.length > cols + rows + 2) return;
        U.shuffle(['E', 'S', 'W', 'N']).forEach(function (m) {
          if (res) return;
          var isBack = m === 'W' || m === 'N';
          if (isBack && back) return;
          var nx = x + DX[m],
            ny = y + DY[m];
          if (nx < 0 || ny < 0 || nx > cols || ny > rows) return;
          var k = nx + ',' + ny;
          if (seen[k]) return;
          seen[k] = true;
          walk(nx, ny, path + m, back + (isBack ? 1 : 0));
          seen[k] = false;
        });
      };
      walk(0, 0, '', 0);
      if (res && res.length === cols + rows + 2) return res;
    }
    return null;
  }

  /* ---------------- drawing ---------------- */

  // Small picture of a route.
  function thumb(cols, rows, moves, extraClass) {
    var b = 15,
      p = 7;
    var w = p * 2 + cols * b,
      h = p * 2 + rows * b;
    var g = S('svg', { viewBox: '0 0 ' + w + ' ' + h, class: 'hpr-thumb' + (extraClass ? ' ' + extraClass : ''), 'aria-hidden': 'true' });
    g.style.width = (w / 17).toFixed(2) + 'rem';
    var i;
    for (i = 0; i <= cols; i++) g.appendChild(S('line', { x1: p + i * b, y1: p, x2: p + i * b, y2: p + rows * b, class: 'hpr-tgrid' }));
    for (i = 0; i <= rows; i++) g.appendChild(S('line', { x1: p, y1: p + i * b, x2: p + cols * b, y2: p + i * b, class: 'hpr-tgrid' }));
    var pts = points(moves)
      .map(function (q) {
        return p + q[0] * b + ',' + (p + q[1] * b);
      })
      .join(' ');
    g.appendChild(S('polyline', { points: pts, class: 'hpr-troute' }));
    g.appendChild(S('circle', { cx: p, cy: p, r: 2.6, class: 'hpr-tstart' }));
    g.appendChild(S('circle', { cx: p + cols * b, cy: p + rows * b, r: 2.6, class: 'hpr-tend' }));
    return g;
  }

  function arrowsText(moves) {
    return moves
      .split('')
      .map(function (m) {
        return ARROW[m];
      })
      .join(' ');
  }

  /*
   * The garden map. opts: cols, rows, b (block size), build (child may click paths),
   * onStep(moves), onComplete(moves), onBack(dir), canStep(move, moves) -> bool, say(text, kind)
   */
  function makeMap(opts) {
    var cols = opts.cols,
      rows = opts.rows,
      b = opts.b || 90;
    var padL = 34,
      padT = 34;
    var W = padL + cols * b + 70,
      H = padT + rows * b + 58;
    function X(i) {
      return padL + i * b;
    }
    function Y(j) {
      return padT + j * b;
    }
    var svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'hpr-map', role: 'img', 'aria-label': 'Garden paths from the hippo to the river' });
    svg.style.width = (W * 1.2) / 18 + 'rem';

    // river at the bottom-right corner
    var rx = X(cols) - b * 0.55,
      ry = Y(rows) + 10;
    svg.appendChild(S('rect', { x: rx, y: ry, width: W - rx - 4, height: H - ry - 4, rx: 14, class: 'hpr-river' }));
    svg.appendChild(S('path', { d: 'M' + (rx + 12) + ' ' + (ry + 22) + ' q 10 -7 20 0 t 20 0 t 20 0', class: 'hpr-wave' }));
    svg.appendChild(S('text', { x: W - 10, y: H - 12, class: 'hpr-rivertext', 'text-anchor': 'end' }, 'river'));

    // blocks (flower beds) and paths
    var c, r;
    for (c = 0; c < cols; c++)
      for (r = 0; r < rows; r++) {
        svg.appendChild(S('rect', { x: X(c) + 11, y: Y(r) + 11, width: b - 22, height: b - 22, rx: 8, class: 'hpr-block' }));
        if (b >= 70) svg.appendChild(S('text', { x: X(c) + b / 2, y: Y(r) + b / 2 + b * 0.12, 'text-anchor': 'middle', class: 'hpr-tree', style: { fontSize: Math.round(b * 0.32) + 'px' } }, (c + r) % 2 ? '🌷' : '🌳'));
      }
    var segs = [];
    function addSeg(x1, y1, x2, y2) {
      segs.push({ x1: x1, y1: y1, x2: x2, y2: y2 });
    }
    for (r = 0; r <= rows; r++) for (c = 0; c < cols; c++) addSeg(c, r, c + 1, r);
    for (c = 0; c <= cols; c++) for (r = 0; r < rows; r++) addSeg(c, r, c, r + 1);
    segs.forEach(function (s) {
      svg.appendChild(S('line', { x1: X(s.x1), y1: Y(s.y1), x2: X(s.x2), y2: Y(s.y2), class: 'hpr-path' }));
    });

    // compass
    var cx = W - 30,
      cy = 26;
    svg.appendChild(S('g', { class: 'hpr-compass' }, S('line', { x1: cx, y1: cy + 10, x2: cx, y2: cy - 8 }), S('path', { d: 'M' + (cx - 5) + ' ' + (cy - 4) + ' L' + cx + ' ' + (cy - 12) + ' L' + (cx + 5) + ' ' + (cy - 4) + ' Z' }), S('text', { x: cx, y: cy + 24, 'text-anchor': 'middle' }, 'N')));

    var nextLayer = S('g');
    var routeLayer = S('g');
    var markLayer = S('g');
    var hitLayer = S('g');
    svg.appendChild(nextLayer);
    svg.appendChild(routeLayer);
    svg.appendChild(markLayer);
    var startDot = S('circle', { cx: X(0), cy: Y(0), r: 8, class: 'hpr-startdot' });
    svg.appendChild(startDot);
    var hippoSize = Math.min(40, Math.max(28, b * 0.38));
    var hippo = S('text', { class: 'hpr-hippo', 'text-anchor': 'middle', style: { fontSize: hippoSize + 'px' } }, '🦛');
    svg.appendChild(hitLayer);
    svg.appendChild(hippo);

    var moves = '';
    var enabled = !!opts.build;
    var done = false;

    function pos() {
      var p = points(moves);
      return p[p.length - 1];
    }
    function placeHippo() {
      var p = pos();
      hippo.setAttribute('x', X(p[0]));
      hippo.setAttribute('y', Y(p[1]) + hippoSize * 0.35);
    }
    function drawRoute(ms, cls) {
      MQ.clear(routeLayer);
      var p = points(ms);
      for (var i = 1; i < p.length; i++) {
        routeLayer.appendChild(S('line', { x1: X(p[i - 1][0]), y1: Y(p[i - 1][1]), x2: X(p[i][0]), y2: Y(p[i][1]), class: 'hpr-step ' + (cls || '') }));
      }
    }
    function drawNext() {
      MQ.clear(nextLayer);
      if (!enabled || done) return;
      var p = pos();
      if (p[0] < cols) nextLayer.appendChild(S('line', { x1: X(p[0]), y1: Y(p[1]), x2: X(p[0] + 1), y2: Y(p[1]), class: 'hpr-next' }));
      if (p[1] < rows) nextLayer.appendChild(S('line', { x1: X(p[0]), y1: Y(p[1]), x2: X(p[0]), y2: Y(p[1] + 1), class: 'hpr-next' }));
    }
    function refresh() {
      drawRoute(moves);
      placeHippo();
      drawNext();
      svg.classList.toggle('hpr-live', enabled && !done);
      if (opts.onStep) opts.onStep(moves);
    }

    function clickSeg(s) {
      if (!enabled || done) return;
      var p = pos();
      var m = null;
      if (s.x1 === p[0] && s.y1 === p[1]) m = s.x2 > s.x1 ? 'E' : 'S';
      if (m) {
        if (opts.canStep && !opts.canStep(m, moves)) return;
        MQ.sound('click');
        moves += m;
        if (pos()[0] === cols && pos()[1] === rows) done = true;
        refresh();
        if (done && opts.onComplete) opts.onComplete(moves);
        return;
      }
      if (s.x2 === p[0] && s.y2 === p[1]) {
        var last = points(moves);
        var prev = last.length > 1 ? last[last.length - 2] : null;
        if (prev && prev[0] === s.x1 && prev[1] === s.y1) {
          // clicked the step it just walked: take it back
          moves = moves.slice(0, -1);
          refresh();
          return;
        }
        var dir = s.x2 > s.x1 ? 'W' : 'N';
        if (opts.onBack) opts.onBack(dir);
        return;
      }
      if (opts.say) opts.say('Click a path that starts where the hippo is standing.', 'info');
    }
    segs.forEach(function (s) {
      var hit = S('line', { x1: X(s.x1), y1: Y(s.y1), x2: X(s.x2), y2: Y(s.y2), class: 'hpr-hit' });
      hit.addEventListener('click', function () {
        clickSeg(s);
      });
      hitLayer.appendChild(hit);
    });

    var api = {
      svg: svg,
      cols: cols,
      rows: rows,
      moves: function () {
        return moves;
      },
      reset: function () {
        moves = '';
        done = false;
        MQ.clear(markLayer);
        refresh();
      },
      undo: function () {
        if (!moves.length || !enabled) return;
        moves = moves.slice(0, -1);
        done = false;
        refresh();
      },
      enable: function (on) {
        enabled = on;
        refresh();
      },
      // show a fixed route (no building), optional class and arrowheads
      show: function (ms, cls, arrows) {
        moves = ms;
        done = true;
        drawRoute(ms, cls);
        placeHippo();
        drawNext();
        svg.classList.remove('hpr-live');
        MQ.clear(markLayer);
        if (arrows) api.arrows(ms);
      },
      // arrow on each step; bad steps (N/W) in red; optional numbers for one direction
      arrows: function (ms, numberDir, flagBad) {
        MQ.clear(markLayer);
        var p = points(ms);
        var n = 0;
        for (var i = 1; i < p.length; i++) {
          var m = ms[i - 1];
          var mx = (X(p[i - 1][0]) + X(p[i][0])) / 2,
            my = (Y(p[i - 1][1]) + Y(p[i][1])) / 2;
          var bad = flagBad && (m === 'N' || m === 'W');
          if (bad) {
            markLayer.appendChild(S('line', { x1: X(p[i - 1][0]), y1: Y(p[i - 1][1]), x2: X(p[i][0]), y2: Y(p[i][1]), class: 'hpr-step hpr-bad' }));
          }
          var label = ARROW[m];
          if (numberDir && m === numberDir) label = String(++n);
          var big = numberDir && m === numberDir;
          markLayer.appendChild(S('circle', { cx: mx, cy: my, r: big ? 15 : 13, class: 'hpr-arrowbg' + (bad ? ' hpr-arrowbad' : '') + (big ? ' hpr-arrownum' : '') }));
          markLayer.appendChild(S('text', { x: mx, y: my + 6, 'text-anchor': 'middle', class: 'hpr-arrow' + (bad ? ' hpr-arrowbadt' : '') }, label));
        }
      },
      // highlight the top row path (for "how far east before turning")
      markEdge: function (dir) {
        MQ.clear(markLayer);
        var n = dir === 'E' ? cols : rows;
        for (var i = 0; i < n; i++) {
          var x1 = dir === 'E' ? i : 0,
            y1 = dir === 'E' ? 0 : i;
          var x2 = x1 + DX[dir],
            y2 = y1 + DY[dir];
          markLayer.appendChild(S('line', { x1: X(x1), y1: Y(y1), x2: X(x2), y2: Y(y2), class: 'hpr-step' }));
          var mx = (X(x1) + X(x2)) / 2,
            my = (Y(y1) + Y(y2)) / 2;
          markLayer.appendChild(S('circle', { cx: mx, cy: my, r: 15, class: 'hpr-arrowbg hpr-arrownum' }));
          markLayer.appendChild(S('text', { x: mx, y: my + 6, 'text-anchor': 'middle', class: 'hpr-arrow' }, String(i + 1)));
        }
        var ex = dir === 'E' ? cols : 0,
          ey = dir === 'E' ? 0 : rows;
        markLayer.appendChild(S('text', { x: X(ex) + (dir === 'E' ? -8 : 14), y: Y(ey) + (dir === 'E' ? -12 : 6), 'text-anchor': dir === 'E' ? 'end' : 'start', class: 'hpr-edgetext' }, dir === 'E' ? 'edge: turn ↓' : 'river side: turn →'));
      },
    };
    refresh();
    return api;
  }

  // Row of arrow chips for the current route.
  function stepChips(holder, moves, showTally, currentIndex) {
    MQ.clear(holder);
    if (!moves.length && currentIndex == null) {
      holder.appendChild(el('span', { class: 'hpr-empty' }, 'Click a glowing path next to the hippo.'));
      return;
    }
    moves.split('').forEach(function (m) {
      holder.appendChild(el('span', { class: 'hpr-chip' }, ARROW[m]));
    });
    if (showTally && moves.length) {
      holder.appendChild(el('span', { class: 'hpr-tally' }, 'East: ' + countOf(moves, 'E') + ' · South: ' + countOf(moves, 'S')));
    }
  }

  function backMsg(dir) {
    return 'The hippo never walks ' + WORD[dir] + ' ' + ARROW[dir] + '. That is away from the river. Only east → or south ↓.';
  }

  /*
   * A "route collector": map + controls + saved thumbnails. Used in learn screens and level 3.
   * opts: cols, rows, b, api, tally, target, onNew(found), onRepeat(), maxThumbsPerRow
   */
  function collector(stage, api, opts) {
    var found = [];
    var thumbs = {};
    var chips = el('div', { class: 'hpr-chips' });
    var counter = el('div', { class: 'hpr-count' });
    var shelf = el('div', { class: 'hpr-shelf' });
    var busy = false;
    var map = makeMap({
      cols: opts.cols,
      rows: opts.rows,
      b: opts.b,
      build: true,
      onStep: function (ms) {
        stepChips(chips, ms, opts.tally);
      },
      onBack: function (dir) {
        api.feedback(backMsg(dir), 'info');
      },
      say: function (t, k) {
        api.feedback(t, k);
      },
      onComplete: function (ms) {
        busy = true;
        if (thumbs[ms]) {
          thumbs[ms].classList.add('hpr-flash');
          api.sound('pop');
          api.feedback('We already have that route! Look at the flashing picture. Try a different way.', 'info');
          if (opts.onRepeat) opts.onRepeat();
        } else {
          found.push(ms);
          var t = el('div', { class: 'hpr-saved' }, thumb(opts.cols, opts.rows, ms), el('div', { class: 'hpr-tlabel' }, arrowsText(ms)));
          thumbs[ms] = t;
          shelf.appendChild(t);
          api.sound('pop');
          updateCount();
          if (opts.onNew) opts.onNew(found, ms);
        }
        api.later(function () {
          if (thumbs[ms]) thumbs[ms].classList.remove('hpr-flash');
          if (!stopped) map.reset();
          busy = false;
        }, 1300);
      },
    });
    var stopped = false;
    function updateCount() {
      counter.textContent = 'Routes found: ' + found.length + (opts.target ? ' of ' + opts.target : '');
    }
    updateCount();
    var undoBtn = el('button', { class: 'btn btn-ghost hpr-small', type: 'button', onclick: function () { if (!busy) map.undo(); } }, '↶ Undo step');
    var clearBtn = el('button', { class: 'btn btn-ghost hpr-small', type: 'button', onclick: function () { if (!busy) map.reset(); } }, 'Start again');
    var tools = el('div', { class: 'hpr-tools' }, undoBtn, clearBtn);
    var side = el('div', { class: 'hpr-side' }, counter, shelf);
    var left = el('div', { class: 'hpr-left' }, map.svg, chips, tools);
    var wrap = el('div', { class: 'hpr-wrap' }, left, side);
    stage.appendChild(wrap);
    return {
      map: map,
      found: found,
      side: side,
      shelf: shelf,
      tools: tools,
      chips: chips,
      wrap: wrap,
      counter: counter,
      stop: function () {
        stopped = true;
        map.enable(false);
        undoBtn.disabled = true;
        clearBtn.disabled = true;
      },
      // show every route in order, ticking those found
      showAll: function (perRow) {
        var all = allRoutes(opts.cols, opts.rows);
        MQ.clear(shelf);
        shelf.classList.add('hpr-shelf-all');
        if (perRow) shelf.style.gridTemplateColumns = 'repeat(' + perRow + ', auto)';
        all.forEach(function (ms) {
          var had = found.indexOf(ms) !== -1;
          shelf.appendChild(el('div', { class: 'hpr-saved' + (had ? ' hpr-had' : ' hpr-new') }, thumb(opts.cols, opts.rows, ms), el('div', { class: 'hpr-tlabel' }, (had ? '✓ ' : '') + arrowsText(ms))));
        });
        counter.textContent = 'All ' + all.length + ' routes, in order (all east first)';
        return all;
      },
    };
  }

  /* ---------------- practice deck ---------------- */

  var GRIDS = [
    [2, 2],
    [3, 3],
    [3, 2],
    [2, 3],
  ];
  function bFor(cols, rows) {
    var big = Math.max(cols, rows);
    return big <= 1 ? 130 : big === 2 ? 108 : 88;
  }

  var deck = null;

  function buildDeck() {
    var used = {};
    function key(q) {
      return [q.type, q.dir || '', q.cols, q.rows, q.route || ''].join('|');
    }
    function add(list, q) {
      var k = key(q);
      if (used[k]) return false;
      used[k] = true;
      list.push(q);
      return true;
    }
    var q = [];
    // Level 1: three different kinds of rule/count question, on different grids
    var grids = U.shuffle(GRIDS.slice());
    var l1 = [];
    var totDir = U.pick(['E', 'S']);
    add(l1, { type: 'total', dir: totDir, cols: grids[0][0], rows: grids[0][1] });
    add(l1, { type: 'never', dir: U.pick(['N', 'W']), cols: grids[1][0], rows: grids[1][1] });
    add(l1, { type: 'edge', dir: U.pick(['E', 'S']), cols: grids[2][0], rows: grids[2][1] });
    U.shuffle(l1).forEach(function (x) {
      q.push(x);
    });
    // Level 2: follow two worded routes, judge one drawn route
    var l2 = [];
    var fg = U.shuffle([[2, 2], [3, 2], [2, 3]]);
    var g1 = fg[0],
      g2 = [3, 3];
    var r1, r2, guard = 0;
    do {
      r1 = randomRoute(g1[0], g1[1]);
    } while ((r1 === allRoutes(g1[0], g1[1])[0] || r1 === allRoutes(g1[0], g1[1]).slice(-1)[0]) && ++guard < 50);
    guard = 0;
    do {
      r2 = randomRoute(3, 3);
    } while ((r2 === 'EEESSS' || r2 === 'SSSEEE') && ++guard < 50);
    add(l2, { type: 'follow', cols: g1[0], rows: g1[1], route: r1 });
    add(l2, { type: 'follow', cols: g2[0], rows: g2[1], route: r2 });
    var jg = U.pick(GRIDS);
    var bad = Math.random() < 0.65;
    var jr = bad ? brokenRoute(jg[0], jg[1]) : randomRoute(jg[0], jg[1]);
    if (!jr) {
      bad = false;
      jr = randomRoute(jg[0], jg[1]);
    }
    add(l2, { type: 'judge', cols: jg[0], rows: jg[1], route: jr, ok: !bad });
    // keep the judge question in the middle so follow questions are split
    q.push(l2[0], l2[2], l2[1]);
    // Level 3: find all on 2 by 3 (10), then 3 by 3 with Bolt's list (20)
    var ori = U.pick([[3, 2], [2, 3]]);
    q.push({ type: 'findall', cols: ori[0], rows: ori[1] });
    q.push({ type: 'big', cols: 3, rows: 3, target: 6 });
    return q;
  }

  function dataFor(holder, q, answer) {
    holder.setAttribute('data-qtype', q.type);
    holder.setAttribute('data-cols', q.cols);
    holder.setAttribute('data-rows', q.rows);
    if (q.dir) holder.setAttribute('data-dir', q.dir);
    if (q.route) holder.setAttribute('data-route', q.route);
    holder.setAttribute('data-answer', String(answer));
  }

  function gridName(q) {
    return q.cols + ' by ' + q.rows;
  }

  /* ---------------- register ---------------- */

  MQ.register('hippo-routes', {
    learn: [
      // 1. The rules on a 1 by 1 grid
      function (stage, api) {
        api.say('The hippo wants to get to the river! It only walks east → or south ↓. Click a glowing path next to the hippo.');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Hippo to the river', 'The hippo walks along the paths. It only goes <b>east →</b> or <b>south ↓</b>. Find 2 routes.'));
        var col = collector(stage, api, {
          cols: 1,
          rows: 1,
          b: 130,
          target: 2,
          onNew: function (found) {
            if (found.length === 1) {
              api.say('Splash! Now find a different way.', 'happy');
              api.feedback('Route saved as a picture. Now try another way.', 'good');
            } else {
              col.stop();
              api.say('Two routes! On this small garden there are only 2.', 'cheer');
              api.feedback('Both routes found. Press Next.', 'good');
              api.unlockNext();
            }
          },
        });
      },
      // 2. 2 by 2: steps east and south, repeats not counted
      function (stage, api) {
        api.say('A bigger garden! Draw a route. Count the steps east and south.');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('A 2 by 2 garden', 'A <b>step</b> is one path between two crossings. Find 3 different routes.'));
        var showBtn = el('button', { class: 'btn btn-ghost hpr-small', type: 'button', hidden: true }, 'Show all routes');
        var col = collector(stage, api, {
          cols: 2,
          rows: 2,
          b: 108,
          tally: true,
          onNew: function (found) {
            api.feedback('2 steps east and 2 steps south — every time!', 'good');
            if (found.length >= 3) {
              showBtn.hidden = false;
              api.unlockNext();
              api.say('Every route has 2 east and 2 south. Find more, or press Show all routes.', 'cheer');
            }
          },
          onRepeat: function () {
            api.say('Same route! We only count it once.', 'think');
          },
        });
        col.side.appendChild(showBtn);
        showBtn.addEventListener('click', function () {
          col.stop();
          col.showAll(3);
          showBtn.hidden = true;
          api.say('There are 6 routes. Each one has 2 east and 2 south.', 'cheer');
          api.feedback('6 routes on a 2 by 2 garden. The ticks are the ones you found.', 'good');
          api.unlockNext();
        });
      },
      // 3. Be organised: all east first
      function (stage, api) {
        api.say('Be organised! Start with all east first. Then move one south step earlier each time. Click each route.');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Be organised', 'Click each picture to see the hippo walk it. Click at least 3.'));
        var map = makeMap({ cols: 2, rows: 2, b: 108 });
        var list = el('div', { class: 'hpr-shelf hpr-shelf-all', style: { gridTemplateColumns: 'repeat(3, auto)' } });
        var seen = {};
        var nSeen = 0;
        var info = el('div', { class: 'hpr-chips' });
        info.textContent = 'Click a picture →';
        allRoutes(2, 2).forEach(function (ms, i) {
          var card = el('button', { class: 'hpr-saved hpr-pick', type: 'button' }, thumb(2, 2, ms), el('div', { class: 'hpr-tlabel' }, arrowsText(ms)));
          card.addEventListener('click', function () {
            Array.prototype.forEach.call(list.children, function (c) {
              c.classList.remove('hpr-on');
            });
            card.classList.add('hpr-on');
            map.show(ms, '', true);
            stepChips(info, ms, true);
            api.sound('click');
            if (!seen[ms]) {
              seen[ms] = true;
              nSeen++;
            }
            var notes = ['All east first.', 'The last east step moved after a south step.', 'East, south, south, east.', 'Now the first step is south.', 'South, east, south, east.', 'All south first — the last one.'];
            api.feedback('Route ' + (i + 1) + ': ' + notes[i], 'info');
            if (nSeen >= 3) {
              api.unlockNext();
              if (nSeen === 3) api.say('In order, we cannot miss a route. Ready to practise!', 'cheer');
            }
          });
          list.appendChild(card);
        });
        stage.appendChild(el('div', { class: 'hpr-wrap' }, el('div', { class: 'hpr-left' }, map.svg, info), el('div', { class: 'hpr-side' }, el('div', { class: 'hpr-count' }, 'Bolt’s list: 6 routes'), list)));
      },
    ],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        var holder = el('div', { class: 'hpr-q' });
        stage.appendChild(holder);
        var b = bFor(q.cols, q.rows);

        /* ---- total steps east / south ---- */
        if (q.type === 'total') {
          var ans = q.dir === 'E' ? q.cols : q.rows;
          dataFor(holder, q, ans);
          api.say('Draw any route if it helps. Count the ' + WORD[q.dir] + ' steps.', 'think');
          holder.appendChild(MQ.ui.prompt('On this ' + gridName(q) + ' garden, how many steps <b>' + WORD[q.dir] + ' ' + ARROW[q.dir] + '</b> does the hippo take in total?'));
          var chips = el('div', { class: 'hpr-chips' });
          var map = makeMap({
            cols: q.cols,
            rows: q.rows,
            b: b,
            build: true,
            onStep: function (ms) {
              stepChips(chips, ms, false);
            },
            onBack: function (dir) {
              api.feedback(backMsg(dir), 'info');
            },
            say: api.feedback,
          });
          var input = MQ.ui.numberInput({
            unit: 'steps',
            onSubmit: function (n) {
              if (n === ans) {
                input.good();
                input.disable();
                map.enable(false);
                api.check(true, 'Yes! Every route has ' + ans + ' steps ' + WORD[q.dir] + '.');
              } else {
                input.bad();
                var hint, tag = 'Miscounted steps';
                if (n === ans + 1) hint = 'You counted the crossings. Count the paths between them: one path = one step.';
                else if (n === (q.dir === 'E' ? q.rows : q.cols)) hint = 'That is the number of ' + (q.dir === 'E' ? 'south' : 'east') + ' steps. Count the ' + ARROW[q.dir] + ' steps.';
                else if (n === q.cols + q.rows) hint = 'That is all the steps. Count only the ' + WORD[q.dir] + ' ' + ARROW[q.dir] + ' ones.';
                else hint = 'Draw a route to the river. Then count the ' + ARROW[q.dir] + ' chips under the map.';
                if (api.tries() >= 1) hint += ' Count the blocks ' + (q.dir === 'E' ? 'along the top' : 'down the side') + ': one step for each block.';
                api.check(false, hint, tag);
              }
            },
          });
          holder.appendChild(el('div', { class: 'hpr-wrap' }, el('div', { class: 'hpr-left' }, map.svg, chips), el('div', { class: 'hpr-side hpr-ask' }, input.el)));
          stepChips(chips, '', false);
          input.focus();
          api.onReveal(function () {
            var route = allRoutes(q.cols, q.rows)[0];
            map.enable(false);
            map.show(route);
            map.arrows(route, q.dir);
            input.setValue(ans);
            input.good();
            input.disable();
            stepChips(chips, route, true);
            api.feedback('Count the numbered ' + WORD[q.dir] + ' steps: ' + U.range(1, ans).join(', ') + '. So ' + ans + ' steps ' + WORD[q.dir] + ' on every route.', 'info');
          });
          return;
        }

        /* ---- can it ever walk north / west? ---- */
        if (q.type === 'never') {
          dataFor(holder, q, 'no');
          api.say('Think about the rule. Try clicking paths if it helps.', 'think');
          holder.appendChild(MQ.ui.prompt('Can the hippo ever walk <b>' + WORD[q.dir] + ' ' + ARROW[q.dir] + '</b>?'));
          var chips2 = el('div', { class: 'hpr-chips' });
          var map2 = makeMap({
            cols: q.cols,
            rows: q.rows,
            b: b,
            build: true,
            onStep: function (ms) {
              stepChips(chips2, ms, false);
            },
            onBack: function (dir) {
              api.feedback(backMsg(dir), 'info');
            },
            say: api.feedback,
          });
          var ch = MQ.ui.choices(
            [
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ],
            function (v) {
              if (v === 'no') {
                ch.mark('no', 'good');
                ch.disable();
                map2.enable(false);
                api.check(true, 'Right! ' + WORD[q.dir][0].toUpperCase() + WORD[q.dir].slice(1) + ' is away from the river, so the hippo never goes that way.');
              } else {
                ch.mark('yes', 'bad');
                var h = WORD[q.dir][0].toUpperCase() + WORD[q.dir].slice(1) + ' ' + ARROW[q.dir] + ' goes away from the river. The rule is east or south only.';
                if (api.tries() >= 1) h += ' Look: the river is ' + (q.dir === 'N' ? 'at the bottom' : 'on the right') + '.';
                api.check(false, h, 'Went north or west');
              }
            },
            { columns: 2 }
          );
          holder.appendChild(el('div', { class: 'hpr-wrap' }, el('div', { class: 'hpr-left' }, map2.svg, chips2), el('div', { class: 'hpr-side hpr-ask' }, ch)));
          stepChips(chips2, '', false);
          api.onReveal(function () {
            ch.mark('no', 'good');
            ch.disable();
            map2.enable(false);
            var route = randomRoute(q.cols, q.rows);
            map2.show(route, '', true);
            stepChips(chips2, route, true);
            api.feedback('No. Every route uses only → and ↓. ' + WORD[q.dir][0].toUpperCase() + WORD[q.dir].slice(1) + ' ' + ARROW[q.dir] + ' would take the hippo away from the river.', 'info');
          });
          return;
        }

        /* ---- how far east (south) before it must turn ---- */
        if (q.type === 'edge') {
          var ans3 = q.dir === 'E' ? q.cols : q.rows;
          dataFor(holder, q, ans3);
          var turn = q.dir === 'E' ? 'south' : 'east';
          api.say('Walk the hippo ' + WORD[q.dir] + ' as far as it can go.', 'think');
          holder.appendChild(MQ.ui.prompt('The hippo walks <b>' + WORD[q.dir] + ' ' + ARROW[q.dir] + '</b> first. At most, how many steps ' + WORD[q.dir] + ' before it has to turn ' + turn + '?'));
          var chips3 = el('div', { class: 'hpr-chips' });
          var map3 = makeMap({
            cols: q.cols,
            rows: q.rows,
            b: b,
            build: true,
            onStep: function (ms) {
              stepChips(chips3, ms, false);
            },
            onBack: function (dir) {
              api.feedback(backMsg(dir), 'info');
            },
            say: api.feedback,
          });
          var input3 = MQ.ui.numberInput({
            unit: 'steps',
            onSubmit: function (n) {
              if (n === ans3) {
                input3.good();
                input3.disable();
                map3.enable(false);
                api.check(true, 'Yes! After ' + ans3 + ' steps ' + WORD[q.dir] + ' it reaches the edge and must turn ' + turn + '.');
              } else {
                input3.bad();
                var h = n === ans3 + 1 ? 'You counted the crossings. Count the paths between them.' : n < ans3 ? 'It can keep going ' + WORD[q.dir] + ' a bit further. Walk it to the edge.' : 'Too many: it reaches the edge of the garden. Walk it and count.';
                if (api.tries() >= 1) h += ' Click ' + ARROW[q.dir] + ' paths until no ' + ARROW[q.dir] + ' path glows, then count the chips.';
                api.check(false, h, 'Miscounted steps');
              }
            },
          });
          holder.appendChild(el('div', { class: 'hpr-wrap' }, el('div', { class: 'hpr-left' }, map3.svg, chips3), el('div', { class: 'hpr-side hpr-ask' }, input3.el)));
          stepChips(chips3, '', false);
          input3.focus();
          api.onReveal(function () {
            map3.enable(false);
            var straight = new Array(ans3 + 1).join(q.dir);
            map3.show(straight);
            map3.markEdge(q.dir);
            stepChips(chips3, straight, false);
            input3.setValue(ans3);
            input3.good();
            input3.disable();
            api.feedback(U.range(1, ans3).join(', ') + ': after ' + ans3 + ' steps ' + WORD[q.dir] + ' the hippo is at the edge, so it must turn ' + turn + '.', 'info');
          });
          return;
        }

        /* ---- follow a route given in words ---- */
        if (q.type === 'follow') {
          dataFor(holder, q, q.route);
          api.say('Follow the directions. Click one path for each step.', 'think');
          holder.appendChild(MQ.ui.prompt('Draw this route for the hippo:'));
          var list = el('div', { class: 'hpr-steps' });
          var stepEls = q.route.split('').map(function (m) {
            var s = el('span', { class: 'hpr-word' }, WORD[m] + ' ' + ARROW[m]);
            list.appendChild(s);
            return s;
          });
          function markSteps(ms) {
            stepEls.forEach(function (s, i) {
              s.classList.toggle('hpr-wdone', i < ms.length);
              s.classList.toggle('hpr-wnow', i === ms.length);
            });
          }
          var map4 = makeMap({
            cols: q.cols,
            rows: q.rows,
            b: b,
            build: true,
            canStep: function (m, ms) {
              if (api.isAnswered()) return false;
              var want = q.route[ms.length];
              if (m === want) return true;
              var h = 'Step ' + (ms.length + 1) + ' says ' + WORD[want] + ' ' + ARROW[want] + '. ';
              h += want === 'E' ? 'Find the path going right from the hippo.' : 'Find the path going down from the hippo.';
              if (api.tries() >= 1) h += ' Point at the yellow word, then at the matching arrow.';
              api.check(false, h, 'Miscounted steps');
              return false;
            },
            onStep: function (ms) {
              markSteps(ms);
            },
            onBack: function (dir) {
              api.feedback(backMsg(dir), 'info');
            },
            say: api.feedback,
            onComplete: function (ms) {
              if (ms === q.route) api.check(true, 'You followed every step to the river!');
            },
          });
          holder.appendChild(list);
          holder.appendChild(el('div', { class: 'hpr-wrap' }, el('div', { class: 'hpr-left' }, map4.svg, el('div', { class: 'hpr-tools' }, el('button', { class: 'btn btn-ghost hpr-small', type: 'button', onclick: function () { if (!api.isAnswered()) map4.undo(); } }, '↶ Undo step')))));
          markSteps('');
          api.onReveal(function () {
            map4.enable(false);
            map4.show(q.route, '', true);
            markSteps(q.route);
            api.feedback('Here it is: ' + q.route.split('').map(function (m) { return WORD[m]; }).join(', ') + '. One path for each word.', 'info');
          });
          return;
        }

        /* ---- is this drawn route allowed? ---- */
        if (q.type === 'judge') {
          dataFor(holder, q, q.ok ? 'yes' : 'no');
          api.say('Follow the arrows. Does the hippo keep the rule?', 'think');
          holder.appendChild(MQ.ui.prompt('Is this route allowed? <span class="hpr-rule">(only east → or south ↓)</span>'));
          var map5 = makeMap({ cols: q.cols, rows: q.rows, b: b });
          map5.show(q.route, '', true);
          var badIdx = -1;
          q.route.split('').forEach(function (m, i) {
            if ((m === 'N' || m === 'W') && badIdx < 0) badIdx = i;
          });
          var ch5 = MQ.ui.choices(
            [
              { label: 'Yes, allowed', value: 'yes' },
              { label: 'No, it breaks the rule', value: 'no' },
            ],
            function (v) {
              var right = q.ok ? 'yes' : 'no';
              if (v === right) {
                ch5.mark(v, 'good');
                ch5.disable();
                if (!q.ok) map5.arrows(q.route, null, true);
                api.check(true, q.ok ? 'Yes! Every step is → or ↓.' : 'Well spotted! It walks ' + WORD[q.route[badIdx]] + ' ' + ARROW[q.route[badIdx]] + ', away from the river.');
              } else {
                ch5.mark(v, 'bad');
                var h;
                if (q.ok) {
                  h = 'Check each arrow on the path. Is any of them ← or ↑?';
                  if (api.tries() >= 1) h += ' Every arrow here is → or ↓.';
                  api.check(false, h, 'Thought a good route went backwards');
                } else {
                  h = 'Follow the arrows one by one. Does the hippo ever walk away from the river?';
                  if (api.tries() >= 1) h += ' Look for a ' + ARROW[q.route[badIdx]] + ' arrow.';
                  api.check(false, h, 'Went north or west');
                }
              }
            },
            { columns: 1 }
          );
          holder.appendChild(el('div', { class: 'hpr-wrap' }, el('div', { class: 'hpr-left' }, map5.svg, el('div', { class: 'hpr-chips' }, q.route.split('').map(function (m) {
            return el('span', { class: 'hpr-chip', 'data-bad': m === 'N' || m === 'W' ? '1' : null }, ARROW[m]);
          }))), el('div', { class: 'hpr-side hpr-ask' }, ch5)));
          api.onReveal(function () {
            ch5.mark(q.ok ? 'yes' : 'no', 'good');
            ch5.disable();
            map5.arrows(q.route, null, true);
            Array.prototype.forEach.call(holder.querySelectorAll('[data-bad]'), function (c) {
              c.classList.add('hpr-chipx');
            });
            api.feedback(q.ok ? 'Allowed: every step is east → or south ↓.' : 'Not allowed: the red step goes ' + WORD[q.route[badIdx]] + ' ' + ARROW[q.route[badIdx]] + ', away from the river.', 'info');
          });
          return;
        }

        /* ---- find all routes (2 by 3: 10) ---- */
        if (q.type === 'findall') {
          var total = allRoutes(q.cols, q.rows).length;
          dataFor(holder, q, total);
          api.say('Find every route! Be organised: start with all east first.', 'think');
          holder.appendChild(MQ.ui.prompt('Find <b>all</b> the routes on this ' + gridName(q) + ' garden.'));
          var col = collector(holder, api, {
            cols: q.cols,
            rows: q.rows,
            b: 92,
            onNew: function (found) {
              if (api.isAnswered()) return;
              if (found.length === total) {
                col.stop();
                doneBtn.disabled = true;
                api.check(true, 'All ' + total + ' routes found! No repeats, none missed.');
              } else {
                api.feedback('New route saved! That makes ' + found.length + '.', 'good');
              }
            },
          });
          var doneBtn = el('button', { class: 'btn hpr-done', type: 'button' }, 'I found them all!');
          doneBtn.addEventListener('click', function () {
            if (api.isAnswered()) return;
            var n = col.found.length;
            if (n === 0) {
              api.feedback('Draw some routes first. Click a glowing path next to the hippo.', 'info');
              return;
            }
            var h = 'Not yet! There are more routes. Try one that starts a different way.';
            if (api.tries() >= 1) h = 'Still more! Go in order: ' + arrowsText(allRoutes(q.cols, q.rows)[0]) + ' first, then move one ↓ earlier each time.';
            api.check(false, h, 'Stopped before finding all routes');
          });
          col.side.appendChild(doneBtn);
          col.shelf.style.gridTemplateColumns = 'repeat(' + (q.cols === 3 ? 4 : 5) + ', auto)';
          api.onReveal(function () {
            col.stop();
            doneBtn.disabled = true;
            col.showAll(q.cols === 3 ? 4 : 5);
            api.feedback('Here are all ' + total + ' in order, all east first. ✓ = you found it. The others are new.', 'info');
          });
          return;
        }

        /* ---- 3 by 3: find 6, then count Bolt's systematic list (20) ---- */
        var all = allRoutes(3, 3);
        dataFor(holder, q, all.length);
        api.say('The big garden! Find ' + q.target + ' different routes.', 'think');
        var promptEl = MQ.ui.prompt('On the 3 by 3 garden, find <b>' + q.target + '</b> different routes.');
        holder.appendChild(promptEl);
        var phaseB = false;
        var skip = el('button', { class: 'btn btn-ghost hpr-small', type: 'button', hidden: true }, 'Show Bolt’s list');
        var col6 = collector(holder, api, {
          cols: 3,
          rows: 3,
          b: 84,
          target: q.target,
          onNew: function (found) {
            if (found.length >= 3) skip.hidden = false;
            if (found.length >= q.target) api.later(toList, 900);
            else api.feedback('New route! ' + found.length + ' of ' + q.target + '.', 'good');
          },
        });
        col6.shelf.style.gridTemplateColumns = 'repeat(3, auto)';
        col6.side.appendChild(skip);
        skip.addEventListener('click', toList);
        var input7 = null;
        function toList() {
          if (phaseB) return;
          phaseB = true;
          col6.stop();
          MQ.clear(holder);
          api.say('Bolt listed every route in order. Your routes have a tick. How many are there?', 'think');
          holder.appendChild(MQ.ui.prompt('Bolt’s list, all east first. How many routes are there <b>altogether</b>?'));
          var grid = el('div', { class: 'hpr-biglist' });
          var found = col6.found;
          for (var r = 0; r < 4; r++) {
            var row = el('div', { class: 'hpr-row' });
            for (var c = 0; c < 5; c++) {
              var ms = all[r * 5 + c];
              var had = found.indexOf(ms) !== -1;
              row.appendChild(el('div', { class: 'hpr-saved hpr-mini' + (had ? ' hpr-had' : '') }, thumb(3, 3, ms), el('div', { class: 'hpr-tlabel' }, had ? '✓' : ' ')));
            }
            row.appendChild(el('div', { class: 'hpr-rowsum', hidden: true }, String((r + 1) * 5)));
            grid.appendChild(row);
          }
          input7 = MQ.ui.numberInput({
            unit: 'routes',
            onSubmit: function (n) {
              if (n === all.length) {
                input7.good();
                input7.disable();
                api.check(true, 'Yes! 20 routes on the 3 by 3 garden. Being organised found them all.');
              } else {
                input7.bad();
                var h, tag;
                if (n === found.length) {
                  h = 'That is how many you found. Bolt’s list has more. Count every picture.';
                  tag = 'Stopped before finding all routes';
                } else if (n < all.length) {
                  h = 'Count again, one picture at a time.';
                  tag = 'Stopped before finding all routes';
                } else {
                  h = 'Too many. Each picture is a different route: count each one once.';
                  tag = 'Counted the same route twice';
                }
                if (api.tries() >= 1) h += ' Each row has 5 pictures. Count in fives down the rows.';
                api.check(false, h, tag);
              }
            },
          });
          holder.appendChild(el('div', { class: 'hpr-wrap' }, grid, el('div', { class: 'hpr-side hpr-ask' }, input7.el)));
          input7.focus();
        }
        api.onReveal(function () {
          if (!phaseB) toList();
          Array.prototype.forEach.call(holder.querySelectorAll('.hpr-rowsum'), function (s) {
            s.hidden = false;
          });
          input7.setValue(all.length);
          input7.good();
          input7.disable();
          holder.appendChild(MQ.ui.sum([5, 5, 5, 5], 20, 'routes'));
          api.feedback('4 rows of 5 pictures: 5, 10, 15, 20. There are 20 routes. 10 start east →, 10 start south ↓.', 'info');
        });
      },
    },
  });

  var css = [
    '.hpr-q{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}',
    '.hpr-wrap{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;gap:14px 24px;width:100%;max-width:1000px}',
    '.hpr-left{display:flex;flex-direction:column;align-items:center;gap:6px;max-width:100%}',
    '.hpr-side{display:flex;flex-direction:column;align-items:center;gap:10px;min-width:200px;max-width:100%}',
    '.hpr-ask{align-self:center}',
    '.hpr-map{max-width:100%;height:auto;max-height:46vh;display:block;user-select:none}',
    '.hpr-river{fill:#9fd3f2;stroke:#5aa9d6;stroke-width:2}',
    '.hpr-wave{fill:none;stroke:#fff;stroke-width:3;stroke-linecap:round;opacity:.8}',
    '.hpr-rivertext{font-size:15px;font-weight:800;fill:#22648f}',
    '.hpr-block{fill:#cfe9c0;stroke:#92c77d;stroke-width:2}',
    '.hpr-tree{opacity:.85;pointer-events:none}',
    '.hpr-path{stroke:#e9d8b4;stroke-width:16;stroke-linecap:round}',
    '.hpr-compass line{stroke:#4a5a7d;stroke-width:3}',
    '.hpr-compass path{fill:#4a5a7d}',
    '.hpr-compass text{font-size:15px;font-weight:800;fill:#4a5a7d}',
    '.hpr-startdot{fill:#fff;stroke:#7a5a3a;stroke-width:3}',
    '.hpr-hippo{pointer-events:none}',
    '.hpr-step{stroke:#f08a24;stroke-width:9;stroke-linecap:round}',
    '.hpr-step.hpr-bad{stroke:#d62828}',
    '.hpr-next{stroke:#2a9d8f;stroke-width:8;stroke-linecap:round;stroke-dasharray:10 8;animation:hpr-glow 1.1s ease-in-out infinite alternate}',
    '@keyframes hpr-glow{from{opacity:.35}to{opacity:1}}',
    '.hpr-hit{stroke:transparent;stroke-width:28;cursor:default}',
    '.hpr-live .hpr-hit{cursor:pointer}',
    '.hpr-arrowbg{fill:#fff;stroke:#f08a24;stroke-width:2.5}',
    '.hpr-arrownum{fill:#fff4e6}',
    '.hpr-arrowbad{stroke:#d62828;fill:#ffe5e5}',
    '.hpr-arrow{font-size:17px;font-weight:800;fill:#1b2a4a;pointer-events:none}',
    '.hpr-arrowbadt{fill:#d62828}',
    '.hpr-edgetext{font-size:14px;font-weight:800;fill:#c2410c}',
    '.hpr-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:center;min-height:38px;font-weight:700;color:var(--ink-soft)}',
    '.hpr-chip{display:inline-block;min-width:34px;text-align:center;padding:2px 8px;border-radius:10px;background:#fff4e6;border:2px solid #f3b77a;font-size:1.3rem;font-weight:800;color:var(--ink)}',
    '.hpr-chip.hpr-chipx{background:#ffe5e5;border-color:#d62828;color:#d62828}',
    '.hpr-tally{margin-left:8px;font-size:1.05rem;color:var(--ink)}',
    '.hpr-empty{font-size:1rem}',
    '.hpr-tools{display:flex;gap:8px;justify-content:center}',
    '.hpr-small{padding:6px 12px;font-size:.95rem}',
    '.hpr-count{font-size:1.2rem;font-weight:800}',
    '.hpr-shelf{display:grid;grid-template-columns:repeat(3,auto);gap:8px;justify-content:center}',
    '.hpr-saved{display:flex;flex-direction:column;align-items:center;background:#fff;border:2px solid var(--line);border-radius:10px;padding:4px;font:inherit;color:inherit}',
    '.hpr-saved.hpr-had{border-color:var(--good);background:var(--good-bg)}',
    '.hpr-saved.hpr-new{border-style:dashed;border-color:#f08a24}',
    '.hpr-pick{cursor:pointer}',
    '.hpr-pick:hover,.hpr-pick.hpr-on{border-color:#f08a24;background:#fff4e6}',
    '.hpr-flash{animation:hpr-flash .35s ease-in-out 3;border-color:#f08a24}',
    '@keyframes hpr-flash{50%{transform:scale(1.15);background:#ffe8cc}}',
    '.hpr-thumb{display:block;max-width:100%;height:auto}',
    '.hpr-tgrid{stroke:#c9d3ee;stroke-width:1.2}',
    '.hpr-troute{fill:none;stroke:#f08a24;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}',
    '.hpr-tstart{fill:#7a5a3a}',
    '.hpr-tend{fill:#3a8fc2}',
    '.hpr-tlabel{font-size:.72rem;font-weight:700;color:var(--ink-soft);white-space:nowrap}',
    '.hpr-steps{display:flex;flex-wrap:wrap;gap:6px;justify-content:center}',
    '.hpr-word{padding:4px 10px;border-radius:10px;border:2px solid var(--line);background:#fff;font-weight:800;font-size:1.1rem}',
    '.hpr-word.hpr-wdone{background:var(--good-bg);border-color:var(--good);color:var(--good)}',
    '.hpr-word.hpr-wnow{background:#fff3c4;border-color:var(--gold)}',
    '.hpr-rule{font-size:.85em;color:var(--ink-soft)}',
    '.hpr-done{font-size:1.05rem}',
    '.hpr-biglist{display:flex;flex-direction:column;gap:6px}',
    '.hpr-row{display:flex;gap:6px;align-items:center}',
        '.hpr-mini .hpr-tlabel{color:var(--good);font-size:.8rem;line-height:1}',
    '.hpr-mini .hpr-thumb{width:2.7rem !important}',
    '.hpr-mini{padding:3px}',
    '.hpr-rowsum{font-weight:800;font-size:1.2rem;color:#c2410c;min-width:30px}',
    '@media (max-width:700px){.hpr-side{min-width:0}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'hippo-routes' }, css));
})();

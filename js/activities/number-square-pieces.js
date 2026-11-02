/* Number grid jigsaw (Unit 1.1): fill pieces cut from a rows-of-ten number grid.
 * Grid rule (textbook layout): rows of ten, each row runs ...1 to ...0 (301-310, 311-320, ...).
 * A number n sits at row r = floor((n - 1) / 10), column c = (n - 1) % 10 (c = 0..9), and the
 * number in row r, column c is 10r + c + 1. Every piece is placed by row/column, so a square to
 * the left of a number ending in 1 (or to the right of one ending in 0) can never be drawn.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var ID = 'number-square-pieces';
  var S = 84; // practice piece cell size (px)

  /* ---------------- grid maths ---------------- */
  function rowOf(n) {
    return Math.floor((n - 1) / 10);
  }
  function colOf(n) {
    return (n - 1) % 10;
  }
  function valAt(r, c) {
    return r * 10 + c + 1;
  }
  function hund(n) {
    return Math.floor(n / 100);
  }
  function minus(n) {
    return '−' + n;
  }

  var DIRS = {
    up: { dr: -1, dc: 0, arrow: '↑', label: '−10', word: 'above' },
    down: { dr: 1, dc: 0, arrow: '↓', label: '+10', word: 'below' },
    left: { dr: 0, dc: -1, arrow: '←', label: '−1', word: 'to the left of' },
    right: { dr: 0, dc: 1, arrow: '→', label: '+1', word: 'to the right of' },
  };
  function dirOf(dr, dc) {
    if (dr === 1) return DIRS.down;
    if (dr === -1) return DIRS.up;
    if (dc === -1) return DIRS.left;
    return DIRS.right;
  }

  /* ---------------- shapes ---------------- */
  // Offsets [row, col]. Variants are made by rotating and mirroring.
  var BASE = {
    cross: [[[-1, 0], [0, -1], [0, 0], [0, 1], [1, 0]]],
    L: [
      [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]],
      [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [2, 3]],
    ],
    T: [
      [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]],
      [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1], [3, 1]],
    ],
    U: [
      [[0, 0], [1, 0], [1, 1], [1, 2], [0, 2]],
      [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2]],
    ],
    H: [[[0, 0], [1, 0], [2, 0], [1, 1], [0, 2], [1, 2], [2, 2]]],
  };

  function normalise(cells) {
    var r0 = Math.min.apply(null, cells.map(function (p) { return p[0]; }));
    var c0 = Math.min.apply(null, cells.map(function (p) { return p[1]; }));
    return cells
      .map(function (p) { return [p[0] - r0, p[1] - c0]; })
      .sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
  }
  function variants(cells) {
    var out = {};
    var cur = cells;
    for (var m = 0; m < 2; m++) {
      for (var k = 0; k < 4; k++) {
        var n = normalise(cur);
        out[JSON.stringify(n)] = n;
        cur = cur.map(function (p) { return [p[1], -p[0]]; });
      }
      cur = cells.map(function (p) { return [p[0], -p[1]]; });
    }
    return Object.keys(out).map(function (k) { return out[k]; });
  }
  function shapeVariants(type) {
    var all = [];
    BASE[type].forEach(function (b) {
      all = all.concat(variants(b));
    });
    return all;
  }
  function hasCell(cells, r, c) {
    return cells.some(function (p) { return p[0] === r && p[1] === c; });
  }
  function degree(cells, p) {
    var d = 0;
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (o) {
      if (hasCell(cells, p[0] + o[0], p[1] + o[1])) d++;
    });
    return d;
  }

  /** Place a shape so that its cell `gi` holds number g. Returns null if it would leave the grid. */
  function place(shape, gi, g) {
    var gr = rowOf(g);
    var gc = colOf(g);
    var r0 = gr - shape[gi][0];
    var c0 = gc - shape[gi][1];
    var cells = [];
    for (var i = 0; i < shape.length; i++) {
      var r = r0 + shape[i][0];
      var c = c0 + shape[i][1];
      if (c < 0 || c > 9 || r < 0) return null;
      cells.push({ dr: shape[i][0], dc: shape[i][1], r: r, c: c, v: valAt(r, c), given: i === gi });
    }
    return { r0: r0, c0: c0, cells: cells, given: g };
  }

  function crossesHundred(cells) {
    var h = hund(cells[0].v);
    return cells.some(function (x) { return hund(x.v) !== h; });
  }
  function crossesTen(cells) {
    // a row step from ...9 to ...0 inside the piece (e.g. 389 next to 390)
    return cells.some(function (x) {
      return x.v % 10 === 0 && cells.some(function (y) { return y.r === x.r && y.c === x.c - 1; });
    });
  }

  /** BFS order from the given cell; each cell gets a parent (a neighbour nearer the given). */
  function bfs(piece) {
    var cells = piece.cells;
    var start = cells.filter(function (x) { return x.given; })[0];
    var order = [start];
    start.parent = null;
    var seen = {};
    seen[start.r + ',' + start.c] = true;
    for (var i = 0; i < order.length; i++) {
      var cur = order[i];
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (o) {
        cells.forEach(function (y) {
          var k = y.r + ',' + y.c;
          if (!seen[k] && y.r === cur.r + o[0] && y.c === cur.c + o[1]) {
            seen[k] = true;
            y.parent = cur;
            order.push(y);
          }
        });
      });
    }
    return order;
  }

  /* ---------------- deck ---------------- */
  var deck = null;

  function makeCross(used) {
    for (var t = 0; t < 5000; t++) {
      // 100-500, no crossing of tens or hundreds: tens 1-8, ones 2-8
      var g = U.rand(1, 4) * 100 + U.rand(1, 8) * 10 + U.rand(2, 8);
      if (used['p' + g]) continue;
      var p = place(BASE.cross[0], 2, g);
      if (!p) continue;
      if (crossesHundred(p.cells) || crossesTen(p.cells)) continue;
      used['p' + g] = true;
      p.kind = 'piece';
      p.shape = 'cross';
      return p;
    }
    throw new Error('cross');
  }

  function makePiece(type, level, wantTen, used) {
    var vs = shapeVariants(type);
    for (var t = 0; t < 20000; t++) {
      var shape = U.pick(vs);
      var gi;
      if (type === 'H') {
        // the middle of the bar
        gi = U.range(0, shape.length - 1).filter(function (i) { return degree(shape, shape[i]) === 2; })[0];
      } else if (type === 'U' && level === 3) {
        gi = U.pick(U.range(0, shape.length - 1).filter(function (i) { return degree(shape, shape[i]) === 1; }));
      } else {
        gi = U.pick(U.range(0, shape.length - 1).filter(function (i) { return degree(shape, shape[i]) >= 2; }));
      }
      var g;
      if (level === 3) g = U.rand(2, 9) * 100 + U.rand(-25, 14);
      else if (wantTen) g = U.rand(10, 99) * 10 + U.rand(-2, 1);
      else g = U.rand(110, 989);
      if (g < 100 || g > 999 || used['p' + g]) continue;
      var p = place(shape, gi, g);
      if (!p) continue;
      var ok = p.cells.every(function (x) { return x.v >= 100 && x.v <= 999; });
      if (!ok) continue;
      if (level === 2) {
        if (crossesHundred(p.cells)) continue;
        if (crossesTen(p.cells) !== !!wantTen) continue;
      } else if (!crossesHundred(p.cells)) continue;
      used['p' + g] = true;
      p.kind = 'piece';
      p.shape = type;
      return p;
    }
    throw new Error('piece ' + type);
  }

  function makeWorm(back, used) {
    var LEN = 8;
    for (var t = 0; t < 5000; t++) {
      var H = U.rand(2, 9); // the hundred that is crossed into
      var k = U.rand(2, 5); // steps before the crossing
      var start = H * 100 - k * 10 + U.rand(0, 9);
      var vals = [];
      for (var i = 0; i < LEN; i++) vals.push(start + 10 * i);
      if (vals[0] < 100 || vals[LEN - 1] > 999) continue;
      if (hund(vals[0]) === hund(vals[LEN - 1])) continue;
      if (back) vals.reverse();
      var key = 'w' + vals[0] + (back ? 'b' : 'f');
      if (used[key]) continue;
      // which segments are blank: always blank the first number in the new hundred
      var crossIdx = 0;
      for (var j = 1; j < LEN; j++) if (hund(vals[j]) !== hund(vals[j - 1])) crossIdx = j;
      var blanks = {};
      blanks[crossIdx] = true;
      var others = U.shuffle(U.range(1, LEN - 1).filter(function (j) { return j !== crossIdx; }));
      var nBlank = 4 + U.rand(0, 1);
      for (var b = 0; Object.keys(blanks).length < nBlank; b++) blanks[others[b]] = true;
      used[key] = true;
      return {
        kind: 'worm',
        back: back,
        cells: vals.map(function (v, idx) { return { v: v, given: !blanks[idx], idx: idx }; }),
        crossIdx: crossIdx,
      };
    }
    throw new Error('worm');
  }

  function buildDeck() {
    var used = {};
    var q = [];
    q.push(makeCross(used), makeCross(used), makeCross(used));
    var types = U.shuffle(['L', 'T', 'U']);
    var tens = U.shuffle([true, false, true]);
    q.push(makePiece(types[0], 2, tens[0], used), makePiece(types[1], 2, tens[1], used), makePiece(types[2], 2, tens[2], used));
    q.push(makePiece(U.pick(['H', 'U']), 3, false, used));
    q.push(makeWorm(false, used), makeWorm(true, used));
    q.forEach(function (x, i) {
      x.level = i < 3 ? 1 : i < 6 ? 2 : 3;
    });
    return q;
  }

  /* ---------------- mistake analysis ---------------- */
  var TAG = {
    below1: 'Used +1 for the square below',
    above1: 'Used -1 for the square above',
    hundreds: 'Lost the hundreds when crossing',
    onBack: 'Counted on instead of back',
    downBack: 'Counted back when going down',
    leftRight: 'Mixed up left and right',
    ones: 'Counted in 1s instead of 10s',
    slip: 'Counting slip',
  };

  function lostHundreds(v, e, p) {
    if (hund(e) === hund(p) || v === e) return false;
    if (v % 100 === e % 100) return true;
    // e.g. 790 + 10 written as 7100
    return String(v) === String(hund(p)) + String(100 + (e % 100));
  }

  /** Piece: step from parent p to the wrong cell. Returns {tag, hint}. */
  function pieceMistake(cell, v, strong) {
    var p = cell.parent.v;
    var dr = cell.r - cell.parent.r;
    var dc = cell.c - cell.parent.c;
    var e = cell.v;
    var where = 'The square ' + dirOf(dr, dc).word + ' ' + p;
    if (dr === 1 && v === p + 1) {
      return { tag: TAG.below1, hint: where + ' is not one more. Going down skips a whole row of ten, so it is 10 more.' + (strong ? ' Only the tens digit goes up.' : '') };
    }
    if (dr === -1 && v === p - 1) {
      return { tag: TAG.above1, hint: where + ' is not one less. Going up jumps back a whole row of ten, so it is 10 less.' + (strong ? ' Only the tens digit goes down.' : '') };
    }
    if (dr === -1 && (v === p + 10 || v === p + 1)) {
      return { tag: TAG.onBack, hint: where + ': up means smaller! Count back 10.' };
    }
    if (dr === 1 && (v === p - 10 || v === p - 1)) {
      return { tag: TAG.downBack, hint: where + ': down means bigger! Count on 10.' };
    }
    if (dc !== 0 && v === p - dc) {
      return { tag: TAG.leftRight, hint: where + ': numbers get bigger as you go right →. Left is one less, right is one more.' };
    }
    if (lostHundreds(v, e, p)) {
      return { tag: TAG.hundreds, hint: where + ' is in a different hundred! Check the hundreds digit.' + (strong ? ' 9 tens and 1 more ten make a new hundred.' : '') };
    }
    var how = dr === 1 ? 'count on 10' : dr === -1 ? 'count back 10' : dc === 1 ? 'count on 1' : 'count back 1';
    var extra = dc === 1 && e % 10 === 0 ? ' After ' + p + ' comes a new ten.' : dc === -1 && p % 10 === 0 ? ' Before ' + p + ' the ones digit is 9.' : '';
    return { tag: TAG.slip, hint: where + ' needs another look: ' + how + ' from ' + p + '.' + extra };
  }

  function wormMistake(back, p, v, e, strong) {
    var where = 'The box after ' + p;
    if (v === p + 1 || v === p - 1) {
      return { tag: TAG.ones, hint: where + ': this worm counts in tens, not ones. ' + (back ? 'Count back 10.' : 'Count on 10.') };
    }
    if (back && v === p + 10) {
      return { tag: TAG.onBack, hint: where + ': the numbers are getting smaller. Count back 10.' };
    }
    if (lostHundreds(v, e, p)) {
      return { tag: TAG.hundreds, hint: where + ' crosses into a new hundred! Check the hundreds digit.' + (strong ? (back ? ' Count back 10 past the hundred.' : ' 9 tens and 1 more ten make a new hundred.') : '') };
    }
    return { tag: TAG.slip, hint: where + ' needs another look: ' + (back ? 'count back 10' : 'count on 10') + ' from ' + p + '.' + (strong ? ' Only the tens digit changes, unless you cross a hundred.' : '') };
  }

  /* ---------------- small UI parts ---------------- */
  function compass(n) {
    var c = el('div', { class: 'nsp-compass', 'aria-label': 'Moving on the grid' });
    var spots = [null, '↑ −10', null, '← −1', n == null ? 'n' : String(n), '→ +1', null, '↓ +10', null];
    spots.forEach(function (s, i) {
      c.appendChild(el('div', { class: s == null ? 'nsp-cmp-x' : i === 4 ? 'nsp-cmp-mid' : i === 1 || i === 7 ? 'nsp-cmp-ten' : 'nsp-cmp-one' }, s || ''));
    });
    return c;
  }

  /** Faint view of the full grid rows around some cells. cells: [{v, show}] */
  function peekGrid(cells) {
    var rows = cells.map(function (x) { return rowOf(x.v); });
    var r1 = Math.max(0, Math.min.apply(null, rows) - 1);
    var r2 = Math.min(99, Math.max.apply(null, rows) + 1);
    var cs = 38;
    var pad = 4;
    var W = 10 * cs + pad * 2;
    var H = (r2 - r1 + 1) * cs + pad * 2;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'nsp-peek-svg', width: W, height: H });
    var map = {};
    cells.forEach(function (x) { map[x.v] = x; });
    for (var r = r1; r <= r2; r++) {
      for (var c = 0; c < 10; c++) {
        var v = valAt(r, c);
        var x = pad + c * cs;
        var y = pad + (r - r1) * cs;
        var inP = map[v];
        root.appendChild(svg('rect', { x: x, y: y, width: cs, height: cs, class: inP ? (inP.show ? 'nsp-pk-given' : 'nsp-pk-hole') : 'nsp-pk-cell' }));
        root.appendChild(svg('text', { x: x + cs / 2, y: y + cs / 2 + 5, 'text-anchor': 'middle', class: inP ? 'nsp-pk-num-on' : 'nsp-pk-num' }, inP && !inP.show ? '?' : String(v)));
      }
    }
    return root;
  }

  /* ---------------- learn 1: full grid, Bolt moves ---------------- */
  function learnMove(stage, api) {
    api.lockNext();
    api.say('This grid has rows of ten. Click → to move me one square right.');
    var base = 300; // 301-400
    var cs = 46;
    var pad = 6;
    var W = 10 * cs + pad * 2;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + W, class: 'nsp-full', width: W, height: W });
    var flashL = svg('g');
    var cellsG = svg('g');
    var arrowsG = svg('g');
    root.appendChild(flashL);
    root.appendChild(cellsG);
    var rects = {};
    for (var r = 0; r < 10; r++) {
      for (var c = 0; c < 10; c++) {
        var v = base + r * 10 + c + 1;
        var rect = svg('rect', { x: pad + c * cs, y: pad + r * cs, width: cs, height: cs, class: 'nsp-fcell' });
        rects[v] = rect;
        cellsG.appendChild(rect);
        cellsG.appendChild(svg('text', { x: pad + c * cs + cs / 2, y: pad + r * cs + cs / 2 + 6, 'text-anchor': 'middle', class: 'nsp-fnum' }, String(v)));
      }
    }
    var bolt = svg('rect', { width: cs, height: cs, rx: 6, class: 'nsp-bolt' });
    root.appendChild(bolt);
    root.appendChild(arrowsG);
    var pos = 344;
    function cx(n) { return pad + colOf(n) * cs + cs / 2; }
    function cy(n) { return pad + (rowOf(n) - rowOf(base + 1)) * cs + cs / 2; }
    function drawBolt() {
      bolt.setAttribute('x', cx(pos) - cs / 2);
      bolt.setAttribute('y', cy(pos) - cs / 2);
    }
    drawBolt();

    var readout = el('div', { class: 'nsp-readout' }, el('div', { class: 'nsp-ro-big' }, String(pos)), el('div', { class: 'nsp-ro-small' }, 'Bolt is on ' + pos + '.'));
    var used = { up: 0, down: 0, left: 0, right: 0 };
    var busy = false;
    var arrows = [];

    function digitsHtml(a, b) {
      var sa = String(a);
      var sb = String(b);
      var out = '';
      for (var i = 0; i < sb.length; i++) out += '<span class="' + (sa[i] !== sb[i] ? 'nsp-chg' : '') + '">' + sb[i] + '</span>';
      return out;
    }
    var placeName = ['hundreds', 'tens', 'ones'];
    function explain(name, a, b) {
      var sa = String(a);
      var sb = String(b);
      var changed = [];
      for (var i = 0; i < 3; i++) if (sa[i] !== sb[i]) changed.push(i);
      var d = DIRS[name];
      var big = a + ' ' + d.arrow + ' <b>' + d.label + '</b> = ' + digitsHtml(a, b);
      var small;
      if (changed.length === 1) {
        small = 'The <b>' + placeName[changed[0]] + '</b> digit changed: ' + sa[changed[0]] + ' → ' + sb[changed[0]] + '.';
        if (name === 'down' || name === 'up') small += ' The ones stayed ' + sb[2] + '.';
      } else {
        small = 'We crossed into a new ' + (changed[0] === 0 ? 'hundred' : 'ten') + '.';
      }
      if (name === 'down') small = 'Down one row: you skip a whole row of ten. ' + small;
      if (name === 'up') small = 'Up one row: back a whole row of ten. ' + small;
      readout.innerHTML = '<div class="nsp-ro-big">' + big + '</div><div class="nsp-ro-small">' + small + '</div>';
    }

    function addArrow(a, b, d) {
      // a small label on the edge between the two squares (kept clear of the numbers)
      var key = Math.min(a, b) + '-' + Math.max(a, b);
      arrows = arrows.filter(function (g) {
        if (g.getAttribute('data-edge') !== key) return true;
        arrowsG.removeChild(g);
        return false;
      });
      var mx = (cx(a) + cx(b)) / 2;
      var my = d.dr ? (cy(a) + cy(b)) / 2 : cy(a) - cs / 2 + 9;
      var g = svg('g', { class: 'nsp-arr ' + (d.dr ? 'nsp-arr-ten' : 'nsp-arr-one'), 'data-edge': key });
      g.appendChild(svg('rect', { x: mx - 20, y: my - 8, width: 40, height: 16, rx: 7, class: 'nsp-arr-pill' }));
      g.appendChild(svg('text', { x: mx, y: my + 4.5, 'text-anchor': 'middle', class: 'nsp-arr-txt nsp-arr-txt-sm' }, d.arrow + d.label));
      arrowsG.appendChild(g);
      arrows.push(g);
      if (arrows.length > 8) arrowsG.removeChild(arrows.shift());
    }

    function move(name) {
      if (busy) return;
      var d = DIRS[name];
      var c = colOf(pos) + d.dc;
      var r = rowOf(pos) - rowOf(base + 1) + d.dr;
      if (c < 0 || c > 9 || r < 0 || r > 9) {
        api.sound('wrong');
        api.feedback(c > 9 ? pos + ' is at the END of its row. The next row starts with ' + (pos + 1) + '.' : c < 0 ? pos + ' is at the START of its row. ' + (pos - 1) + ' is at the end of the row above.' : 'That is the edge of this grid. Try another way.', 'try');
        return;
      }
      var from = pos;
      var to = pos + d.dr * 10 + d.dc;
      used[name]++;
      api.sound('pop');
      function finish() {
        pos = to;
        drawBolt();
        addArrow(from, to, d);
        explain(name, from, to);
        next();
      }
      if (d.dr) {
        // show the whole row of ten being skipped
        busy = true;
        var step = 0;
        var tick = function () {
          step++;
          var n = d.dr > 0 ? from + step : from - step;
          var fr = rects[n];
          var x = +fr.getAttribute('x');
          var y = +fr.getAttribute('y');
          flashL.appendChild(svg('rect', { x: x, y: y, width: cs, height: cs, class: 'nsp-flash' }));
          if (step < 10) api.later(tick, 110);
          else
            api.later(function () {
              MQ.clear(flashL);
              busy = false;
              finish();
            }, 350);
        };
        tick();
      } else finish();
    }

    function next() {
      var all = used.up && used.down && used.left && used.right;
      if (all && used.down >= 2) {
        api.say('Down is +10 and up is −10 because a row has ten squares!', 'cheer');
        api.feedback('Right +1 · Left −1 · Down +10 · Up −10', 'good');
        api.unlockNext();
      } else if (!used.down) {
        api.say('Now click ↓ down. Watch which digit changes!', 'think');
      } else if (used.down < 2) {
        api.say('Did you see? Only the tens digit changed. Go down once more.', 'happy');
      } else {
        var left = ['up', 'left', 'right'].filter(function (k) { return !used[k]; });
        api.say('Now try ' + left.map(function (k) { return DIRS[k].arrow + ' ' + k; }).join(' and ') + '.', 'think');
      }
    }

    var pad4 = el('div', { class: 'nsp-pad' });
    [['up', 'nsp-pad-up'], ['left', 'nsp-pad-left'], ['right', 'nsp-pad-right'], ['down', 'nsp-pad-down']].forEach(function (x) {
      var d = DIRS[x[0]];
      pad4.appendChild(el('button', { class: 'btn nsp-move ' + x[1] + (d.dr ? ' nsp-move-ten' : ''), type: 'button', 'data-dir': x[0], onclick: function () { move(x[0]); } }, el('span', { class: 'nsp-move-ar' }, d.arrow), el('span', { class: 'nsp-move-lb' }, x[0] + ' ' + d.label)));
    });
    pad4.appendChild(el('div', { class: 'nsp-pad-mid' }, '🤖'));

    stage.appendChild(el('div', { class: 'nsp-learn1' }, el('div', { class: 'nsp-full-wrap' }, root), el('div', { class: 'nsp-side' }, el('div', { class: 'nsp-side-title' }, 'Move Bolt'), pad4, readout)));
  }

  /* ---------------- learn 2: put the piece back ---------------- */
  function learnPiece(stage, api) {
    api.lockNext();
    api.say('A piece fell out of the grid! Drag it back into its hole.');
    var cs = 52;
    var pad = 6;
    var firstRow = rowOf(341); // rows 341-350 ... 371-380
    var centre = 356;
    var shape = BASE.cross[0];
    var holes = {};
    shape.forEach(function (o) {
      holes[centre + o[0] * 10 + o[1]] = { dr: o[0], dc: o[1] };
    });
    var GW = 10 * cs + pad * 2;
    var W = GW + 3 * cs + 30;
    var H = 4 * cs + pad * 2;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'nsp-l2-svg', width: W, height: H });
    var under = svg('g');
    root.appendChild(under);
    for (var r = 0; r < 4; r++) {
      for (var c = 0; c < 10; c++) {
        var v = valAt(firstRow + r, c);
        var x = pad + c * cs;
        var y = pad + r * cs;
        if (holes[v]) {
          root.appendChild(svg('rect', { x: x + 2, y: y + 2, width: cs - 4, height: cs - 4, rx: 4, class: 'nsp-hole' }));
        } else {
          root.appendChild(svg('rect', { x: x, y: y, width: cs, height: cs, class: 'nsp-fcell', 'data-v': v }));
          root.appendChild(svg('text', { x: x + cs / 2, y: y + cs / 2 + 7, 'text-anchor': 'middle', class: 'nsp-fnum nsp-fnum-l2' }, String(v)));
        }
      }
    }
    // piece: top-left of its 3x3 box in grid coords
    var homeX = pad + (colOf(centre) - 1) * cs;
    var homeY = pad + (rowOf(centre) - firstRow - 1) * cs;
    var startX = GW + 15;
    var startY = (H - 3 * cs) / 2;
    var piece = svg('g', { class: 'nsp-drag-piece' });
    var labels = {};
    shape.forEach(function (o) {
      var v = centre + o[0] * 10 + o[1];
      var x = (o[1] + 1) * cs;
      var y = (o[0] + 1) * cs;
      piece.appendChild(svg('rect', { x: x, y: y, width: cs, height: cs, class: v === centre ? 'nsp-pc-given' : 'nsp-pc-cell' }));
      labels[v] = svg('text', { x: x + cs / 2, y: y + cs / 2 + 8, 'text-anchor': 'middle', class: 'nsp-pc-num' }, v === centre ? String(v) : '?');
      piece.appendChild(labels[v]);
    });
    var arrowsG = svg('g');
    root.appendChild(piece);
    root.appendChild(arrowsG);
    var px = startX;
    var py = startY;
    var placed = false;
    function setPos(x, y) {
      px = x;
      py = y;
      piece.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    }
    setPos(startX, startY);
    root.setAttribute('data-home', homeX + ',' + homeY);
    root.setAttribute('data-start', startX + ',' + startY);
    var ox = 0;
    var oy = 0;
    var moved = 0;

    function snap() {
      placed = true;
      setPos(homeX, homeY);
      piece.classList.add('nsp-placed');
      api.sound('correct');
      api.say('It fits! Now watch the numbers around ' + centre + '.', 'cheer');
      var steps = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      var i = 0;
      function showNext() {
        if (i >= steps.length) {
          api.feedback('Below ' + centre + ' is ' + (centre + 10) + ': you skip the rest of the row (' + (centre + 1) + ' to ' + (centre + 9) + ').', 'good');
          api.say('Down is ten more, because you skip a whole row of ten!', 'cheer');
          api.unlockNext();
          return;
        }
        var o = steps[i++];
        var v = centre + o[0] * 10 + o[1];
        var d = dirOf(o[0], o[1]);
        labels[v].textContent = String(v);
        labels[v].classList.add('nsp-pc-num-new');
        var cx1 = homeX + 1.5 * cs;
        var cy1 = homeY + 1.5 * cs;
        var cx2 = cx1 + o[1] * cs;
        var cy2 = cy1 + o[0] * cs;
        // label sits inside the neighbour square, above its number
        var mx = cx2;
        var my = cy2 - cs / 2 + 12;
        labels[v].setAttribute('y', +labels[v].getAttribute('y') + 7);
        if (o[0] === 1) {
          // highlight the squares skipped: the rest of the row and the start of the next
          for (var k = 1; k <= 9; k++) {
            var n = centre + k;
            arrowsG.appendChild(svg('rect', { x: pad + colOf(n) * cs + 3, y: pad + (rowOf(n) - firstRow) * cs + 3, width: cs - 6, height: cs - 6, rx: 6, class: 'nsp-skip' }));
          }
        }
        var g = svg('g', { class: 'nsp-arr ' + (o[0] ? 'nsp-arr-ten' : 'nsp-arr-one') });
        g.appendChild(svg('rect', { x: mx - 22, y: my - 9, width: 44, height: 18, rx: 8, class: 'nsp-arr-pill' }));
        g.appendChild(svg('text', { x: mx, y: my + 5, 'text-anchor': 'middle', class: 'nsp-arr-txt' }, d.arrow + d.label));
        arrowsG.appendChild(g);
        api.sound('pop');
        api.later(showNext, 900);
      }
      api.later(showNext, 500);
    }

    api.cleanup(
      MQ.ui.drag(root, piece, {
        start: function (p) {
          if (placed) return;
          ox = p.x - px;
          oy = p.y - py;
          moved = 0;
        },
        move: function (p, dx, dy) {
          if (placed) return;
          moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
          setPos(p.x - ox, p.y - oy);
        },
        end: function () {
          if (placed) return;
          if (Math.abs(px - homeX) < cs * 0.6 && Math.abs(py - homeY) < cs * 0.6) snap();
          else if (moved < 6) {
            api.feedback('Hold the mouse button down on the piece and drag it into the hole.', 'info');
          } else {
            api.sound('wrong');
            api.feedback('Not there. Find the hole where ' + centre + ' belongs: it comes after ' + (centre - 1) + '.', 'try');
            setPos(startX, startY);
          }
        },
      })
    );
    stage.appendChild(MQ.ui.prompt('Drag the piece into the hole where it belongs.'));
    stage.appendChild(el('div', { class: 'nsp-l2-wrap' }, root));
  }

  /* ---------------- learn 3: count in tens across a hundred ---------------- */
  function learnTens(stage, api) {
    api.lockNext();
    var vals = [370, 380, 390, 400, 410, 420, 430];
    var at = 0;
    var reachedEnd = false;
    api.say('Each step down the grid is +10. Click +10 to count on in tens.');
    var strip = el('div', { class: 'nsp-strip' });
    var segs = vals.map(function (v, i) {
      var s = el('div', { class: 'nsp-sseg' + (i === 0 ? ' nsp-sseg-on' : ' nsp-sseg-hid') }, el('span', { class: 'nsp-h' }, String(v)[0]), String(v).slice(1));
      var wrap = el('div', { class: 'nsp-sstep' }, i ? el('div', { class: 'nsp-sjoint' }) : null, s);
      strip.appendChild(wrap);
      return { s: s, w: wrap };
    });
    var note = el('div', { class: 'nsp-strip-note' }, 'Start at 370.');
    var onB = el('button', { class: 'btn nsp-step-on', type: 'button' }, '+10 →');
    var backB = el('button', { class: 'btn nsp-step-back', type: 'button', disabled: true }, '← −10');
    function joint(i, txt) {
      var j = segs[i].w.querySelector('.nsp-sjoint');
      if (j) j.textContent = txt;
    }
    function paint() {
      segs.forEach(function (x, i) {
        x.s.classList.toggle('nsp-sseg-on', i === at);
      });
    }
    onB.addEventListener('click', function () {
      if (at >= vals.length - 1) return;
      at++;
      segs[at].s.classList.remove('nsp-sseg-hid');
      joint(at, '+10');
      paint();
      api.sound('pop');
      if (vals[at] === 400) {
        segs[at].s.classList.add('nsp-sseg-new');
        note.innerHTML = '390 + 10 = <b>400</b>. Ten tens make a new hundred, so the hundreds digit changes!';
        api.say('390 and 10 more is 400. A new hundred!', 'cheer');
      } else note.innerHTML = vals[at - 1] + ' + 10 = <b>' + vals[at] + '</b>. The tens digit goes up by one.';
      if (at === vals.length - 1) {
        reachedEnd = true;
        onB.disabled = true;
        backB.disabled = false;
        api.say('Now count back in tens. Click −10.', 'think');
      }
    });
    backB.addEventListener('click', function () {
      if (at <= 0) return;
      at--;
      joint(at + 1, '−10');
      paint();
      api.sound('pop');
      if (vals[at] === 390) {
        note.innerHTML = '400 − 10 = <b>390</b>. Going back over the hundred, the hundreds digit goes down.';
        api.say('400 take away 10 is 390!', 'cheer');
      } else note.innerHTML = vals[at + 1] + ' − 10 = <b>' + vals[at] + '</b>.';
      if (at === 0 && reachedEnd) {
        backB.disabled = true;
        api.feedback('On: 370, 380, 390, 400, 410 · Back: 410, 400, 390, 380, 370', 'good');
        api.say('Counting in tens across a hundred. Well done!', 'cheer');
        api.unlockNext();
      }
    });
    stage.appendChild(MQ.ui.lesson('Count in tens across a hundred', 'One square <b>down</b> the grid = <b>+10</b>. One square <b>up</b> = <b>−10</b>.'));
    stage.appendChild(strip);
    stage.appendChild(note);
    stage.appendChild(el('div', { class: 'nsp-step-btns' }, backB, onB));
  }

  /* ---------------- practice ---------------- */
  function renderPiece(stage, api, q) {
    var order = bfs(q);
    var minR = Math.min.apply(null, q.cells.map(function (x) { return x.r; }));
    var maxR = Math.max.apply(null, q.cells.map(function (x) { return x.r; }));
    var minC = Math.min.apply(null, q.cells.map(function (x) { return x.c; }));
    var maxC = Math.max.apply(null, q.cells.map(function (x) { return x.c; }));
    var box = el('div', { class: 'nsp-piece', 'data-r0': minR, 'data-c0': minC, 'data-size': S, style: { width: (maxC - minC + 1) * S + 'px', height: (maxR - minR + 1) * S + 'px' } });
    var blanks = [];
    var cellsSorted = q.cells.slice().sort(function (a, b) { return a.r - b.r || a.c - b.c; });
    cellsSorted.forEach(function (x) {
      var st = { left: (x.c - minC) * S + 'px', top: (x.r - minR) * S + 'px', width: S + 'px', height: S + 'px' };
      var edges = [];
      if (!q.cells.some(function (y) { return y.r === x.r - 1 && y.c === x.c; })) edges.push('nsp-et');
      if (!q.cells.some(function (y) { return y.r === x.r + 1 && y.c === x.c; })) edges.push('nsp-eb');
      if (!q.cells.some(function (y) { return y.r === x.r && y.c === x.c - 1; })) edges.push('nsp-el');
      if (!q.cells.some(function (y) { return y.r === x.r && y.c === x.c + 1; })) edges.push('nsp-er');
      var cellEl;
      if (x.given) {
        cellEl = el('div', { class: 'nsp-cell nsp-given ' + edges.join(' '), style: st, 'data-r': x.r, 'data-c': x.c, 'data-v': x.v }, String(x.v));
      } else {
        var inp = el('input', { class: 'nsp-in', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: 4, 'aria-label': 'Number ' + dirOf(x.r - x.parent.r, x.c - x.parent.c).word + ' a neighbour', 'data-answer': x.v });
        cellEl = el('div', { class: 'nsp-cell nsp-blank ' + edges.join(' '), style: st, 'data-r': x.r, 'data-c': x.c, 'data-answer': x.v }, inp);
        x.input = inp;
        blanks.push(x);
      }
      x.el = cellEl;
      box.appendChild(cellEl);
    });
    var badges = el('div', { class: 'nsp-badges' });
    box.appendChild(badges);

    function showArrows() {
      MQ.clear(badges);
      order.forEach(function (x) {
        if (!x.parent) return;
        var dr = x.r - x.parent.r;
        var dc = x.c - x.parent.c;
        var d = dirOf(dr, dc);
        var px = (x.parent.c - minC + 0.5) * S;
        var py = (x.parent.r - minR + 0.5) * S;
        var bx = px + dc * S * 0.5;
        var by = py + dr * S * 0.5;
        if (dc) by = (x.r - minR) * S + 13;
        badges.appendChild(el('div', { class: 'nsp-badge ' + (dr ? 'nsp-badge-ten' : 'nsp-badge-one'), style: { left: bx + 'px', top: by + 'px' } }, d.arrow + d.label));
      });
    }

    return { box: box, blanks: blanks, order: order, showArrows: showArrows };
  }

  function renderWorm(stage, api, q) {
    var worm = el('div', { class: 'nsp-worm' + (q.back ? ' nsp-worm-back' : '') });
    var blanks = [];
    q.cells.forEach(function (x, i) {
      if (i) {
        x.joint = el('div', { class: 'nsp-wjoint' });
        worm.appendChild(x.joint);
      }
      if (x.given) x.el = el('div', { class: 'nsp-wseg nsp-given', 'data-v': x.v }, String(x.v));
      else {
        x.input = el('input', { class: 'nsp-in', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: 4, 'aria-label': 'Missing number ' + (i + 1), 'data-answer': x.v });
        x.el = el('div', { class: 'nsp-wseg nsp-blank', 'data-answer': x.v }, x.input);
        blanks.push(x);
      }
      x.parent = i ? q.cells[i - 1] : null;
      worm.appendChild(x.el);
    });
    worm.appendChild(el('div', { class: 'nsp-whead' }, el('i'), el('i')));
    function showArrows() {
      q.cells.forEach(function (x, i) {
        if (!i) return;
        x.joint.textContent = q.back ? '−10' : '+10';
        x.joint.classList.add('nsp-wjoint-on');
      });
      q.cells[q.crossIdx].el.classList.add('nsp-new100');
    }
    return { box: worm, blanks: blanks, order: q.cells, showArrows: showArrows };
  }

  function renderPractice(stage, api) {
    if (!deck || api.index === 0) deck = buildDeck();
    var q = deck[api.index];
    // fresh copies so parents/inputs from an earlier visit are not reused
    q = JSON.parse(JSON.stringify(q, function (k, v) { return k === 'parent' || k === 'el' || k === 'input' || k === 'joint' ? undefined : v; }));
    var isWorm = q.kind === 'worm';
    var root = el('div', { class: 'nsp-q', 'data-level': api.level, 'data-kind': isWorm ? 'worm' : 'piece', 'data-shape': q.shape || (q.back ? 'back' : 'on') });
    var view = isWorm ? renderWorm(stage, api, q) : renderPiece(stage, api, q);
    root.setAttribute('data-answers', JSON.stringify(view.blanks.map(function (b) { return b.v; })));
    if (!isWorm) root.setAttribute('data-cells', JSON.stringify(q.cells.map(function (x) { return { r: x.r, c: x.c, v: x.v, given: x.given }; })));
    else root.setAttribute('data-cells', JSON.stringify(q.cells.map(function (x) { return { v: x.v, given: x.given }; })));

    var given = q.cells.filter(function (x) { return x.given; })[0];
    if (isWorm) {
      api.say(q.back ? 'This worm counts back in tens. Fill the gaps.' : 'This worm counts on in tens. Fill the gaps.', 'think');
      root.appendChild(MQ.ui.prompt(q.back ? 'Count <b>back</b> in tens: −10 each time.' : 'Count <b>on</b> in tens: +10 each time.'));
    } else if (api.level === 1) {
      api.say(api.index === 0 ? 'Fill the four squares around ' + given.v + '. Remember: down skips a whole row of ten!' : 'Fill the squares around ' + given.v + '.', 'think');
      root.appendChild(MQ.ui.prompt('Fill the empty squares of this piece.'));
    } else {
      api.say('This piece came from a grid with rows of ten. Fill every empty square.', 'think');
      root.appendChild(MQ.ui.prompt('Fill the empty squares of this piece.'));
    }

    var side = el('div', { class: 'nsp-help' });
    var cmp = isWorm ? null : compass(given.v);
    if (cmp) {
      if (api.level > 1) cmp.classList.add('nsp-hidden');
      side.appendChild(cmp);
    }
    var peekBox = el('div', { class: 'nsp-peek nsp-hidden' });
    var peekBtn = el('button', { class: 'btn btn-ghost nsp-peek-btn nsp-hidden', type: 'button' }, '👀 Peek at the grid');
    peekBtn.addEventListener('click', function () {
      var open = peekBox.classList.contains('nsp-hidden');
      if (open) {
        MQ.clear(peekBox);
        peekBox.appendChild(peekGrid(q.cells.map(function (x) { return { v: x.v, show: x.given || x.done }; })));
        peekBox.appendChild(el('div', { class: 'nsp-peek-cap' }, 'The grid has rows of ten. Find the ? squares.'));
      }
      peekBox.classList.toggle('nsp-hidden', !open);
      peekBtn.textContent = open ? 'Hide the grid' : '👀 Peek at the grid';
    });
    side.appendChild(peekBtn);
    side.appendChild(peekBox);

    var checkBtn = el('button', { class: 'btn nsp-check', type: 'button' }, 'Check ✓');
    root.appendChild(el('div', { class: 'nsp-row' + (isWorm ? ' nsp-row-worm' : '') }, el('div', { class: 'nsp-piece-wrap' }, view.box), side));
    root.appendChild(el('div', { class: 'nsp-check-row' }, checkBtn));
    stage.appendChild(root);

    var finished = false;
    function lockAll() {
      finished = true;
      checkBtn.disabled = true;
      view.blanks.forEach(function (b) { b.input.disabled = true; });
    }

    function submit() {
      if (finished || api.isAnswered()) return;
      var empty = view.blanks.filter(function (b) { return !b.done && !/^\d+$/.test(b.input.value.trim()); });
      if (empty.length) {
        empty[0].input.focus();
        empty.forEach(function (b) {
          b.input.classList.add('shake');
          api.later(function () { b.input.classList.remove('shake'); }, 400);
        });
        api.feedback('Put a number in every empty square, then press Check.', 'info');
        return;
      }
      var wrong = [];
      view.blanks.forEach(function (b) {
        var v = parseInt(b.input.value.trim(), 10);
        b.got = v;
        if (v === b.v) {
          b.done = true;
          b.el.classList.remove('nsp-bad');
          b.el.classList.add('nsp-good');
          b.input.disabled = true;
        } else {
          b.el.classList.remove('nsp-good');
          b.el.classList.add('nsp-bad');
        }
      });
      // first wrong square in order from the given number: its parent is given or already right
      view.order.forEach(function (x) {
        if (!x.given && !x.done) wrong.push(x);
      });
      if (!wrong.length) {
        lockAll();
        view.showArrows();
        api.check(true, isWorm ? 'Every number is right! ' + (q.back ? '−10' : '+10') + ' each time.' : 'Every square is right! Down +10, up −10.');
        return;
      }
      var strong = api.tries() >= 1;
      // only squares next to a known number can be explained; prefer the up/down mistakes
      var known = wrong.filter(function (x) { return x.parent && (x.parent.given || x.parent.done); });
      var ms = known.map(function (x) {
        return { w: x, m: isWorm ? wormMistake(q.back, x.parent.v, x.got, x.v, strong) : pieceMistake(x, x.got, strong) };
      });
      var rank = [TAG.below1, TAG.above1];
      var best = ms[0];
      ms.forEach(function (o) {
        var a = rank.indexOf(o.m.tag);
        var b = rank.indexOf(best.m.tag);
        if (a !== -1 && (b === -1 || a < b)) best = o;
        else if (best.m.tag === TAG.slip && o.m.tag !== TAG.slip && b === -1) best = o;
      });
      var w = best.w;
      var m = best.m;
      var more = wrong.length > 1 ? ' (' + wrong.length + ' red squares to fix.)' : '';
      api.check(false, m.hint + more, m.tag);
      peekBtn.classList.remove('nsp-hidden');
      if (cmp) cmp.classList.remove('nsp-hidden');
      try {
        w.input.focus({ preventScroll: true });
        w.input.select();
      } catch (e) {}
    }

    checkBtn.addEventListener('click', submit);
    view.blanks.forEach(function (b) {
      b.input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });
      b.input.addEventListener('input', function () {
        var clean = b.input.value.replace(/[^0-9]/g, '');
        if (clean !== b.input.value) b.input.value = clean;
        b.el.classList.remove('nsp-bad');
      });
    });
    api.later(function () {
      if (view.blanks[0]) {
        try {
          view.blanks[0].input.focus({ preventScroll: true });
        } catch (e) {}
      }
    }, 60);

    api.onReveal(function () {
      view.blanks.forEach(function (b) {
        b.input.value = String(b.v);
        b.el.classList.remove('nsp-bad');
        if (!b.done) b.el.classList.add('nsp-rev');
      });
      lockAll();
      view.showArrows();
      if (isWorm) api.feedback((q.back ? 'Count back 10 each time: ' : 'Count on 10 each time: ') + q.cells.map(function (x) { return x.v; }).join(', ') + '. The gold box starts a new hundred.', 'info');
      else api.feedback('Right +1 · Left −1 · Down +10 · Up −10. Follow the arrows from ' + given.v + '.', 'info');
    });
  }

  MQ.register(ID, {
    learn: [learnMove, learnPiece, learnTens],
    practice: {
      count: 9,
      render: renderPractice,
    },
  });

  var css = [
    '.nsp-learn1{display:flex;gap:18px;align-items:center;justify-content:center;flex-wrap:wrap;width:100%}',
    '.nsp-full-wrap{flex:0 1 470px;min-width:0}',
    '.nsp-full{display:block;width:100%;max-width:470px;height:auto}',
    '.nsp-fcell{fill:#fff;stroke:#c9d3ee;stroke-width:1.5}',
    '.nsp-fnum{font-size:15px;font-weight:700;fill:#1b2a4a;font-family:var(--font)}',
    '.nsp-fnum-l2{font-size:18px}',
    '.nsp-bolt{fill:rgba(255,183,3,.35);stroke:#e09c00;stroke-width:4;transition:x .25s ease,y .25s ease}',
    '.nsp-flash{fill:rgba(255,140,60,.28)}',
    '.nsp-arr line{stroke-width:4;stroke-linecap:round}',
    '.nsp-arr-one line{stroke:#2563eb}.nsp-arr-ten line{stroke:#d9480f}',
    '.nsp-arr-pill{fill:#fff;stroke-width:2}',
    '.nsp-arr-one .nsp-arr-pill{stroke:#2563eb}.nsp-arr-ten .nsp-arr-pill{stroke:#d9480f}',
    '.nsp-arr-txt{font-size:13px;font-weight:800;font-family:var(--font)}',
    '.nsp-arr-txt-sm{font-size:12px}',
    '.nsp-arr-one .nsp-arr-txt{fill:#1d4ed8}.nsp-arr-ten .nsp-arr-txt{fill:#c2410c}',
    '.nsp-side{flex:0 1 300px;display:flex;flex-direction:column;align-items:center;gap:10px}',
    '.nsp-side-title{font-weight:800;font-size:1.1rem}',
    '.nsp-pad{display:grid;grid-template-columns:repeat(3,86px);grid-template-rows:repeat(3,62px);gap:6px}',
    '.nsp-move{flex-direction:column;gap:0;min-height:0;padding:4px;font-size:.85rem;background:#dbe8ff;color:#1d4ed8;line-height:1.1}',
    '.nsp-move-ten{background:#ffe3d1;color:#b23c0a}',
    '.nsp-move-ar{font-size:1.5rem}',
    '.nsp-pad-up{grid-column:2;grid-row:1}.nsp-pad-left{grid-column:1;grid-row:2}.nsp-pad-right{grid-column:3;grid-row:2}.nsp-pad-down{grid-column:2;grid-row:3}',
    '.nsp-pad-mid{grid-column:2;grid-row:2;display:flex;align-items:center;justify-content:center;font-size:2rem}',
    '.nsp-readout{background:var(--info-bg);border-radius:14px;padding:10px 12px;min-height:110px;width:100%;max-width:300px}',
    '.nsp-ro-big{font-size:1.5rem;font-weight:800}',
    '.nsp-ro-big b{color:#c2410c}',
    '.nsp-ro-small{font-size:.95rem;margin-top:4px}',
    '.nsp-chg{color:#c2410c;background:#fff3cd;border-radius:4px;padding:0 2px}',
    '.nsp-l2-wrap{width:100%;display:flex;justify-content:center}',
    '.nsp-l2-svg{width:100%;max-width:760px;height:auto;touch-action:none}',
    '.nsp-hole{fill:#f1f3f8;stroke:#8a96b8;stroke-width:2;stroke-dasharray:6 4}',
    '.nsp-pc-cell{fill:#fffbea;stroke:#1b2a4a;stroke-width:2.5}',
    '.nsp-pc-given{fill:#ffe9a8;stroke:#1b2a4a;stroke-width:2.5}',
    '.nsp-pc-num{font-size:20px;font-weight:800;fill:#1b2a4a;font-family:var(--font)}',
    '.nsp-pc-num-new{fill:#0b6e66}',
    '.nsp-drag-piece{filter:drop-shadow(0 4px 6px rgba(0,0,0,.2))}',
    '.nsp-drag-piece.nsp-placed{filter:none;cursor:default}',
    '.nsp-skip{fill:rgba(255,140,60,.18);stroke:#f08c4a;stroke-width:1.5;stroke-dasharray:4 3}',
    '.nsp-strip{display:flex;flex-wrap:wrap;justify-content:center;gap:0;row-gap:10px}',
    '.nsp-sstep{display:flex;align-items:center}',
    '.nsp-sjoint{width:44px;text-align:center;font-weight:800;color:#c2410c;font-size:1rem}',
    '.nsp-sseg{width:78px;height:64px;border:3px solid var(--line);border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:800;transition:all .2s}',
    '.nsp-sseg-hid{color:transparent;background:#f1f3f8;border-style:dashed}.nsp-sseg-hid .nsp-h{color:transparent}',
    '.nsp-sseg-on{border-color:#e09c00;box-shadow:0 0 0 4px rgba(255,183,3,.4)}',
    '.nsp-sseg-new{background:#fff3cd}',
    '.nsp-h{color:#7c3aed}',
    '.nsp-strip-note{font-size:1.15rem;min-height:2.6em;max-width:640px}',
    '.nsp-step-btns{display:flex;gap:14px}',
    '.nsp-step-on,.nsp-step-back{font-size:1.25rem;min-width:130px}',
    '.nsp-q{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.nsp-row{display:flex;gap:24px;align-items:flex-start;justify-content:center;flex-wrap:wrap;width:100%}',
    '.nsp-row-worm{flex-direction:column;align-items:center}',
    '.nsp-piece-wrap{padding:6px}',
    '.nsp-piece{position:relative;margin:0 auto}',
    '.nsp-cell{position:absolute;box-sizing:border-box;border:1.5px solid #9aa6c6;background:#fffbea;display:flex;align-items:center;justify-content:center;font-size:1.7rem;font-weight:800}',
    '.nsp-cell.nsp-et{border-top:3px solid var(--ink)}.nsp-cell.nsp-eb{border-bottom:3px solid var(--ink)}.nsp-cell.nsp-el{border-left:3px solid var(--ink)}.nsp-cell.nsp-er{border-right:3px solid var(--ink)}',
    '.nsp-given{background:#ffe9a8}',
    '.nsp-in{width:100%;height:100%;border:none;background:transparent;text-align:center;font:inherit;font-size:1.6rem;font-weight:800;color:var(--ink);padding:0;outline:none}',
    '.nsp-in:focus{background:#eef6ff;box-shadow:inset 0 0 0 3px var(--gold)}',
    '.nsp-in:disabled{color:var(--ink);opacity:1;-webkit-text-fill-color:currentColor}',
    '.nsp-good{background:var(--good-bg)}.nsp-good .nsp-in{color:var(--good)}',
    '.nsp-bad{background:var(--try-bg)}.nsp-bad .nsp-in{color:var(--try)}',
    '.nsp-cell.nsp-bad{box-shadow:inset 0 0 0 3px var(--try)}',
    '.nsp-rev{background:#eef3ff}.nsp-rev .nsp-in{color:#1d4ed8}',
    '.nsp-badges{position:absolute;inset:0;pointer-events:none}',
    '.nsp-badge{position:absolute;transform:translate(-50%,-50%);background:#fff;border:2px solid;border-radius:10px;padding:0 5px;font-size:.78rem;font-weight:800;white-space:nowrap;line-height:1.45}',
    '.nsp-badge-one{border-color:#2563eb;color:#1d4ed8}.nsp-badge-ten{border-color:#d9480f;color:#c2410c}',
    '.nsp-help{display:flex;flex-direction:column;align-items:center;gap:10px;max-width:440px}',
    '.nsp-hidden{display:none !important}',
    '.nsp-compass{display:grid;grid-template-columns:repeat(3,64px);grid-template-rows:repeat(3,40px);gap:3px;font-weight:800;font-size:.9rem}',
    '.nsp-compass>div{display:flex;align-items:center;justify-content:center;border-radius:8px}',
    '.nsp-cmp-mid{background:#ffe9a8;border:2px solid var(--ink)}',
    '.nsp-cmp-one{background:#dbe8ff;color:#1d4ed8}.nsp-cmp-ten{background:#ffe3d1;color:#b23c0a}',
    '.nsp-peek-btn{min-height:44px;font-size:.95rem}',
    '.nsp-peek{display:flex;flex-direction:column;align-items:center;gap:4px;width:100%}',
    '.nsp-peek-svg{width:100%;max-width:400px;height:auto}',
    '.nsp-pk-cell{fill:#fafbfe;stroke:#dfe5f3;stroke-width:1}',
    '.nsp-pk-num{font-size:13px;fill:#9aa6c6;font-family:var(--font);font-weight:700}',
    '.nsp-pk-given{fill:#ffe9a8;stroke:#1b2a4a;stroke-width:2}',
    '.nsp-pk-hole{fill:#fffbea;stroke:#1b2a4a;stroke-width:2}',
    '.nsp-pk-num-on{font-size:14px;fill:#1b2a4a;font-weight:800;font-family:var(--font)}',
    '.nsp-peek-cap{font-size:.85rem;color:var(--ink-soft)}',
    '.nsp-check-row{display:flex;justify-content:center}',
    '.nsp-check{font-size:1.2rem;min-width:150px}',
    '.nsp-worm{display:flex;align-items:center;flex-wrap:wrap;justify-content:center;row-gap:12px;padding:8px 0}',
    '.nsp-wseg{width:76px;height:66px;border-radius:30px;border:3px solid #4d7c0f;background:#ecfccb;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:800;overflow:hidden}',
    '.nsp-wseg.nsp-given{background:#d9f99d}',
    '.nsp-wseg .nsp-in{font-size:1.45rem}',
    '.nsp-wseg.nsp-bad{box-shadow:inset 0 0 0 3px var(--try)}',
    '.nsp-wseg.nsp-new100{background:#fff3cd;border-color:#e09c00}',
    '.nsp-wjoint{width:10px;height:14px;background:#4d7c0f;position:relative;font-size:.78rem;font-weight:800;color:#c2410c}',
    '.nsp-wjoint-on{width:40px;height:auto;background:none;text-align:center}',
    '.nsp-whead{width:40px;height:40px;border-radius:50%;background:#84cc16;border:3px solid #4d7c0f;margin:0 4px;position:relative}',
    '.nsp-whead i{position:absolute;top:10px;width:7px;height:7px;border-radius:50%;background:#1b2a4a}.nsp-whead i:first-child{left:9px}.nsp-whead i:last-child{right:9px}',
    '@media (max-width:900px){.nsp-full-wrap{flex-basis:400px}.nsp-full{max-width:400px}.nsp-side{flex-basis:280px}.nsp-pad{grid-template-columns:repeat(3,80px)}}',
    '@media (max-width:640px){.nsp-pad{grid-template-columns:repeat(3,76px)}.nsp-sseg{width:66px;font-size:1.35rem}.nsp-sjoint{width:34px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

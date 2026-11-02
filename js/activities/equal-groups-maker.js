/* Equal Groups (Unit 5.1 introduction): equal groups -> counting in jumps -> repeated addition
 * -> group size × number of groups, and division as "how many groups?".
 * Every object the child counts is drawn so it can be counted.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;
  var ID = 'equal-groups-maker';

  /* ---------------------------------------------------------------- *
   * Mistake tags (parent-readable)
   * ---------------------------------------------------------------- */
  var TAG = {
    unequal: 'Made groups that were not equal',
    ones: 'Counted in ones and lost track',
    swap: 'Mixed up group size and number of groups',
    added: 'Added the two numbers instead of multiplying',
    lost: 'Lost count of the groups',
    picture: 'Picked a × fact with the same total that does not match the picture',
  };

  /* ---------------------------------------------------------------- *
   * Kinds of groups. size = items in one group.
   * ---------------------------------------------------------------- */
  var KINDS = {
    apples: { size: 3, group: 'plate', groups: 'plates', item: 'apples' },
    socks: { size: 2, group: 'pair', groups: 'pairs', item: 'socks', say: 'Socks come in pairs. Count in 2s!' },
    hands: { size: 5, group: 'hand', groups: 'hands', item: 'fingers', say: 'Count the thumb as a finger. Count in 5s!' },
    pencils: { size: 10, group: 'box', groups: 'boxes', item: 'pencils', say: 'Each box has 10 pencils. Count in 10s!' },
    trikes: { size: 3, group: 'tricycle', groups: 'tricycles', item: 'wheels', say: 'A tricycle has 3 wheels. Count in 3s!' },
    yoghurt: { size: 3, group: 'pack', groups: 'packs', item: 'yoghurt pots', say: 'Each pack has 3 pots. Count in 3s!' },
    chairs: { size: 4, group: 'chair', groups: 'chairs', item: 'chair legs', say: 'A chair has 4 legs. Count in 4s!' },
    eggs: { size: 4, group: 'box', groups: 'boxes', item: 'eggs', say: 'Each box holds 4 eggs. Count in 4s!' },
    team: { size: 6, group: 'team', groups: 'teams', item: 'players', say: 'Each team has 6 players. Count in 6s!' },
    spiders: { size: 8, group: 'spider', groups: 'spiders', item: 'spider legs', say: 'A spider has 8 legs. Count in 8s!' },
    cupcakes: { size: 9, group: 'tray', groups: 'trays', item: 'cupcakes', say: 'Each tray holds 9 cupcakes. Count in 9s!' },
    boxes10: { size: 10, group: 'box', groups: 'boxes', item: 'pencils', compact: true, say: 'Every box has 10 pencils. Count in 10s!' },
  };

  // Price and length stories, drawn as equal bars.
  var STORIES = {
    pears: { group: 'pear', groups: 'pears', item: 'cents', pre: '', post: 'c', text: function (s, g) { return 'One pear costs <b>' + s + 'c</b>. How much do <b>' + g + ' pears</b> cost?'; } },
    tshirts: { group: 'T-shirt', groups: 'T-shirts', item: 'dollars', pre: '$', post: '', text: function (s, g) { return 'One T-shirt costs <b>$' + s + '</b>. How much do <b>' + g + ' T-shirts</b> cost?'; } },
    planks: { group: 'plank', groups: 'planks', item: 'metres', pre: '', post: ' m', text: function (s, g) { return '<b>' + g + ' planks</b> are laid end to end. Each plank is <b>' + s + ' m</b> long. How long is the line?'; } },
    jumps: { group: 'jump', groups: 'jumps', item: 'metres', pre: '', post: ' m', text: function (s, g) { return 'A kangaroo jumps <b>' + s + ' m</b> each jump. How far does it go in <b>' + g + ' jumps</b>?'; } },
  };

  var TEAM_COLORS = ['#e63946', '#2a9d8f', '#3a86ff', '#f4a261', '#8338ec', '#06a77d', '#ef476f', '#118ab2'];
  var SOCK_COLORS = ['#3a86ff', '#ef476f', '#06a77d', '#f4a261', '#8338ec', '#118ab2'];

  function amt(q, v) {
    return (q.pre || '') + v + (q.post || '');
  }

  function multiples(size, n) {
    var a = [];
    for (var i = 1; i <= n; i++) a.push(size * i);
    return a;
  }

  /* ---------------------------------------------------------------- *
   * Drawings of one group, inside a 96 × 96 card (origin top-left).
   * ---------------------------------------------------------------- */
  function apple(x, y, r) {
    r = r || 13;
    return svg('g', { class: 'eg-apple' },
      svg('circle', { cx: x, cy: y, r: r, fill: '#e63946', stroke: '#a4161a', 'stroke-width': 1.5 }),
      svg('circle', { cx: x - r * 0.35, cy: y - r * 0.35, r: r * 0.25, fill: '#ff8fa3' }),
      svg('line', { x1: x, y1: y - r, x2: x + 2, y2: y - r - 6, stroke: '#6b4226', 'stroke-width': 2.5, 'stroke-linecap': 'round' }),
      svg('ellipse', { cx: x + 6, cy: y - r - 4, rx: 5, ry: 2.6, fill: '#55a630', transform: 'rotate(-25 ' + (x + 6) + ' ' + (y - r - 4) + ')' }));
  }

  function plateShape(cx, cy, rx, ry) {
    return svg('g', null,
      svg('ellipse', { cx: cx, cy: cy, rx: rx, ry: ry, fill: '#ffffff', stroke: '#9fb3d9', 'stroke-width': 3 }),
      svg('ellipse', { cx: cx, cy: cy, rx: rx * 0.72, ry: ry * 0.68, fill: 'none', stroke: '#dbe6ff', 'stroke-width': 2 }));
  }

  var DRAW = {
    apples: function (g, size) {
      g.appendChild(plateShape(48, 58, 46, 30));
      var pos = size === 3 ? [[30, 54], [66, 54], [48, 70]] : [];
      for (var i = 0; i < size; i++) {
        var p = pos[i] || [22 + (i % 4) * 17, 50 + Math.floor(i / 4) * 18];
        g.appendChild(apple(p[0], p[1], 12));
      }
    },
    socks: function (g, size, idx) {
      var col = SOCK_COLORS[idx % SOCK_COLORS.length];
      [10, 50].forEach(function (x, k) {
        var sock = svg('g', { transform: 'translate(' + x + ',14)' },
          svg('path', { d: 'M0 0 H18 V38 L34 48 Q40 54 34 60 Q30 64 24 61 L4 50 Q0 47 0 42 Z', fill: col, stroke: '#1b2a4a', 'stroke-width': 1.5, 'stroke-linejoin': 'round' }),
          svg('rect', { x: 0, y: 0, width: 18, height: 7, fill: '#ffffff', stroke: '#1b2a4a', 'stroke-width': 1.5 }),
          svg('line', { x1: 2, y1: 22, x2: 16, y2: 22, stroke: '#ffffff', 'stroke-width': 3, opacity: 0.6 }));
        sock.setAttribute('data-n', k);
        g.appendChild(sock);
      });
    },
    hands: function (g) {
      var skin = '#f4c7a1';
      var line = '#b9825a';
      var fingers = [[28, 16, 34], [39, 10, 40], [50, 12, 38], [61, 20, 30]];
      fingers.forEach(function (f) {
        g.appendChild(svg('rect', { x: f[0], y: f[1], width: 10, height: f[2] + 10, rx: 5, fill: skin, stroke: line, 'stroke-width': 1.5 }));
        g.appendChild(svg('rect', { x: f[0] + 2.5, y: f[1] + 2, width: 5, height: 6, rx: 2.5, fill: '#fde4d0' }));
      });
      g.appendChild(svg('rect', { x: 27, y: 46, width: 45, height: 44, rx: 12, fill: skin, stroke: line, 'stroke-width': 1.5 }));
      // thumb
      g.appendChild(svg('rect', { x: 70, y: 46, width: 10, height: 30, rx: 5, fill: skin, stroke: line, 'stroke-width': 1.5, transform: 'rotate(40 75 72)' }));
      g.appendChild(svg('rect', { x: 27.8, y: 47, width: 43, height: 8, fill: skin }));
    },
    pencils: function (g) {
      var cols = ['#ffb703', '#e63946', '#3a86ff', '#06a77d', '#8338ec'];
      for (var i = 0; i < 10; i++) {
        var x = 9 + i * 8.2;
        var c = cols[i % cols.length];
        g.appendChild(svg('rect', { x: x, y: 14, width: 7, height: 56, fill: c, stroke: '#1b2a4a', 'stroke-width': 0.8 }));
        g.appendChild(svg('path', { d: 'M' + x + ' 14 L' + (x + 3.5) + ' 4 L' + (x + 7) + ' 14 Z', fill: '#f6d7a7', stroke: '#1b2a4a', 'stroke-width': 0.8 }));
        g.appendChild(svg('circle', { cx: x + 3.5, cy: 5.5, r: 1.3, fill: '#1b2a4a' }));
      }
      g.appendChild(svg('rect', { x: 4, y: 44, width: 88, height: 46, rx: 6, fill: '#e9c46a', stroke: '#9c6b1f', 'stroke-width': 2 }));
      g.appendChild(svg('text', { x: 48, y: 74, 'text-anchor': 'middle', class: 'eg-boxlab' }, 'PENCILS'));
    },
    trikes: function (g) {
      var wheel = function (cx, cy, r) {
        return svg('g', null, svg('circle', { cx: cx, cy: cy, r: r, fill: '#ffffff', stroke: '#1b2a4a', 'stroke-width': 4 }), svg('circle', { cx: cx, cy: cy, r: 2.5, fill: '#1b2a4a' }));
      };
      g.appendChild(svg('path', { d: 'M20 70 L64 70 L70 34 M36 70 L50 46 L64 70 M24 76 L40 80', fill: 'none', stroke: '#e63946', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
      g.appendChild(svg('path', { d: 'M62 30 L78 30', stroke: '#1b2a4a', 'stroke-width': 4, 'stroke-linecap': 'round' }));
      g.appendChild(svg('rect', { x: 40, y: 40, width: 18, height: 6, rx: 3, fill: '#1b2a4a' }));
      g.appendChild(wheel(18, 72, 11));
      g.appendChild(wheel(38, 80, 11));
      g.appendChild(wheel(72, 70, 16));
    },
    yoghurt: function (g) {
      [8, 36, 64].forEach(function (x) {
        g.appendChild(svg('path', { d: 'M' + x + ' 28 L' + (x + 24) + ' 28 L' + (x + 21) + ' 84 L' + (x + 3) + ' 84 Z', fill: '#ffffff', stroke: '#4a5a7d', 'stroke-width': 1.8 }));
        g.appendChild(svg('rect', { x: x - 1, y: 22, width: 26, height: 7, rx: 2, fill: '#8ecae6', stroke: '#4a5a7d', 'stroke-width': 1.5 }));
        g.appendChild(svg('circle', { cx: x + 12, cy: 46, r: 5, fill: '#ef476f' }));
      });
      g.appendChild(svg('rect', { x: 4, y: 60, width: 88, height: 12, fill: '#e9c46a', stroke: '#9c6b1f', 'stroke-width': 1.5 }));
    },
    chairs: function (g) {
      var wood = '#9c6644';
      [[22, 50, 82], [72, 50, 82], [32, 62, 92], [82, 62, 92]].forEach(function (l) {
        g.appendChild(svg('line', { x1: l[0], y1: l[1], x2: l[0], y2: l[2], stroke: '#6f4518', 'stroke-width': 5, 'stroke-linecap': 'round' }));
      });
      g.appendChild(svg('rect', { x: 20, y: 8, width: 54, height: 40, rx: 6, fill: '#ddb892', stroke: '#6f4518', 'stroke-width': 2 }));
      g.appendChild(svg('path', { d: 'M18 48 L74 48 L86 62 L30 62 Z', fill: wood, stroke: '#6f4518', 'stroke-width': 2, 'stroke-linejoin': 'round' }));
    },
    eggs: function (g, size) {
      var cols = size === 6 ? 3 : 2;
      var rows = size / cols;
      g.appendChild(svg('rect', { x: 6, y: 18, width: 84, height: 70, rx: 10, fill: '#d8c3a5', stroke: '#8d6e4f', 'stroke-width': 2 }));
      for (var i = 0; i < size; i++) {
        var c = i % cols;
        var r = Math.floor(i / cols);
        var cx = 48 + (c - (cols - 1) / 2) * 26;
        var cy = 53 + (r - (rows - 1) / 2) * 30;
        g.appendChild(svg('ellipse', { cx: cx, cy: cy, rx: 10, ry: 13, fill: '#fffaf0', stroke: '#8d6e4f', 'stroke-width': 1.5 }));
      }
    },
    team: function (g, size, idx) {
      var col = TEAM_COLORS[idx % TEAM_COLORS.length];
      g.appendChild(svg('rect', { x: 4, y: 6, width: 88, height: 86, rx: 12, fill: '#f7f9ff', stroke: col, 'stroke-width': 3 }));
      for (var i = 0; i < size; i++) {
        var cx = 22 + (i % 3) * 26;
        var cy = 14 + Math.floor(i / 3) * 40;
        g.appendChild(svg('circle', { cx: cx, cy: cy + 7, r: 6.5, fill: '#f4c7a1', stroke: '#8d5b3a', 'stroke-width': 1 }));
        g.appendChild(svg('path', { d: 'M' + (cx - 9) + ' ' + (cy + 32) + ' L' + (cx - 9) + ' ' + (cy + 20) + ' Q' + cx + ' ' + (cy + 11) + ' ' + (cx + 9) + ' ' + (cy + 20) + ' L' + (cx + 9) + ' ' + (cy + 32) + ' Z', fill: col }));
      }
    },
    spiders: function (g) {
      var ink = '#1b2a4a';
      var ys = [42, 50, 58, 66];
      var kx = [30, 33, 33, 30];
      var fy = [[24, 30], [40, 44], [60, 62], [80, 86]];
      for (var i = 0; i < 4; i++) {
        [-1, 1].forEach(function (s) {
          var x0 = 48 + s * 8;
          var kneeX = 48 + s * kx[i];
          var footX = 48 + s * 44;
          g.appendChild(svg('polyline', { points: x0 + ',' + ys[i] + ' ' + kneeX + ',' + fy[i][0] + ' ' + footX + ',' + fy[i][1], fill: 'none', stroke: ink, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
        });
      }
      g.appendChild(svg('ellipse', { cx: 48, cy: 58, rx: 13, ry: 17, fill: '#4a4e69' }));
      g.appendChild(svg('circle', { cx: 48, cy: 36, r: 9, fill: '#22223b' }));
      g.appendChild(svg('circle', { cx: 45, cy: 34, r: 2, fill: '#ffffff' }));
      g.appendChild(svg('circle', { cx: 51, cy: 34, r: 2, fill: '#ffffff' }));
    },
    cupcakes: function (g) {
      g.appendChild(svg('rect', { x: 4, y: 6, width: 88, height: 86, rx: 8, fill: '#cfd8e8', stroke: '#7b8ba8', 'stroke-width': 2 }));
      for (var i = 0; i < 9; i++) {
        var cx = 20 + (i % 3) * 28;
        var cy = 20 + Math.floor(i / 3) * 28;
        g.appendChild(svg('path', { d: 'M' + (cx - 9) + ' ' + (cy + 2) + ' L' + (cx + 9) + ' ' + (cy + 2) + ' L' + (cx + 6) + ' ' + (cy + 12) + ' L' + (cx - 6) + ' ' + (cy + 12) + ' Z', fill: '#f4a261' }));
        g.appendChild(svg('circle', { cx: cx, cy: cy - 1, r: 9, fill: '#ffc8dd', stroke: '#e5989b', 'stroke-width': 1 }));
        g.appendChild(svg('circle', { cx: cx, cy: cy - 7, r: 2.5, fill: '#e63946' }));
      }
    },
    boxes10: function (g) {
      g.appendChild(svg('rect', { x: 2, y: 4, width: 60, height: 40, rx: 6, fill: '#e9c46a', stroke: '#9c6b1f', 'stroke-width': 2 }));
      for (var i = 0; i < 5; i++) g.appendChild(svg('rect', { x: 9 + i * 10, y: 0, width: 6, height: 7, fill: ['#e63946', '#3a86ff', '#06a77d', '#8338ec', '#ffb703'][i] }));
      g.appendChild(svg('text', { x: 32, y: 32, 'text-anchor': 'middle', class: 'eg-ten' }, '10'));
    },
  };

  /* ---------------------------------------------------------------- *
   * Picture of equal groups. Clicking a group lights it and shows the
   * running total (counting in jumps).
   * ---------------------------------------------------------------- */
  function groupsPic(q, opts) {
    opts = opts || {};
    var kind = KINDS[q.kind];
    var compact = !!kind.compact;
    var cw = compact ? 64 : 96;
    var ch = compact ? 46 : 96;
    var gap = compact ? 12 : 14;
    var pill = 24;
    var perRow = compact ? 10 : Math.min(q.groups, 8);
    var rows = Math.ceil(q.groups / perRow);
    var rowW = perRow * cw + (perRow - 1) * gap;
    var W = Math.max(rowW + 20, opts.minW || 0);
    var H = rows * (ch + pill + 8) + 4;
    var sc = opts.scale || Math.min(1.25, 860 / W);
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: Math.round(W * sc), height: Math.round(H * sc), class: 'eg-svg eg-groups' + (compact ? ' eg-compact' : ''), style: { maxWidth: '100%', height: 'auto' } });
    var cards = [];
    var pills = [];
    var lit = 0;
    var clickable = opts.clickable !== false;
    var locked = false;
    for (var i = 0; i < q.groups; i++) {
      var r = Math.floor(i / perRow);
      var inRow = Math.min(perRow, q.groups - r * perRow);
      var x0 = (W - (inRow * cw + (inRow - 1) * gap)) / 2;
      var x = x0 + (i % perRow) * (cw + gap);
      var y = r * (ch + pill + 8) + pill;
      var g = svg('g', { class: 'eg-grp' + (clickable ? ' eg-click' : ''), transform: 'translate(' + x + ',' + y + ')', 'data-group': i });
      g.appendChild(svg('rect', { x: -3, y: -3, width: cw + 6, height: ch + 6, rx: 12, class: 'eg-card' }));
      DRAW[q.kind](g, kind.size, i);
      var t = svg('text', { x: x + cw / 2, y: y - 7, 'text-anchor': 'middle', class: 'eg-pill' }, '');
      root.appendChild(g);
      root.appendChild(t);
      cards.push(g);
      pills.push(t);
    }
    var api = {
      el: el('div', { class: 'eg-pic' }, root),
      svg: root,
      cards: cards,
      lit: function () {
        return lit;
      },
      lightNext: function (which) {
        if (lit >= q.groups) return false;
        var idx = which;
        if (idx == null || cards[idx].classList.contains('eg-lit')) {
          for (var k = 0; k < cards.length; k++) {
            if (!cards[k].classList.contains('eg-lit')) {
              idx = k;
              break;
            }
          }
        }
        lit++;
        cards[idx].classList.add('eg-lit');
        pills[idx].textContent = amt(q, lit * kind.size);
        if (opts.onLight) opts.onLight(lit, idx);
        return true;
      },
      lightAll: function () {
        while (lit < q.groups) api.lightNext();
      },
      lock: function () {
        locked = true;
      },
    };
    if (clickable) {
      cards.forEach(function (c, idx) {
        c.addEventListener('click', function () {
          if (locked || c.classList.contains('eg-lit')) return;
          MQ.sound('pop');
          api.lightNext(idx);
        });
      });
    }
    return api;
  }

  /* ---------------------------------------------------------------- *
   * Equal bars for price and length stories (segments drawn to scale).
   * ---------------------------------------------------------------- */
  function pearIcon(cx, cy) {
    return svg('g', null,
      svg('path', { d: 'M' + cx + ' ' + (cy - 14) + ' C' + (cx - 6) + ' ' + (cy - 14) + ' ' + (cx - 5) + ' ' + (cy - 4) + ' ' + (cx - 9) + ' ' + (cy + 2) + ' C' + (cx - 14) + ' ' + (cy + 10) + ' ' + (cx - 6) + ' ' + (cy + 16) + ' ' + cx + ' ' + (cy + 16) + ' C' + (cx + 6) + ' ' + (cy + 16) + ' ' + (cx + 14) + ' ' + (cy + 10) + ' ' + (cx + 9) + ' ' + (cy + 2) + ' C' + (cx + 5) + ' ' + (cy - 4) + ' ' + (cx + 6) + ' ' + (cy - 14) + ' ' + cx + ' ' + (cy - 14) + ' Z', fill: '#b5d334', stroke: '#6a8a1a', 'stroke-width': 1.5 }),
      svg('line', { x1: cx, y1: cy - 14, x2: cx + 2, y2: cy - 20, stroke: '#6b4226', 'stroke-width': 2 }));
  }
  function shirtIcon(cx, cy) {
    return svg('path', { d: 'M' + (cx - 6) + ' ' + (cy - 14) + ' L' + (cx - 16) + ' ' + (cy - 9) + ' L' + (cx - 12) + ' ' + (cy - 1) + ' L' + (cx - 9) + ' ' + (cy - 3) + ' L' + (cx - 9) + ' ' + (cy + 15) + ' L' + (cx + 9) + ' ' + (cy + 15) + ' L' + (cx + 9) + ' ' + (cy - 3) + ' L' + (cx + 12) + ' ' + (cy - 1) + ' L' + (cx + 16) + ' ' + (cy - 9) + ' L' + (cx + 6) + ' ' + (cy - 14) + ' Q' + cx + ' ' + (cy - 8) + ' ' + (cx - 6) + ' ' + (cy - 14) + ' Z', fill: '#3a86ff', stroke: '#1d4e89', 'stroke-width': 1.5, 'stroke-linejoin': 'round' });
  }

  function barsPic(q) {
    var W = 900;
    var x0 = 40;
    var x1 = 860;
    var w = (x1 - x0) / q.groups;
    var top = q.kind === 'planks' ? 30 : 52;
    var bh = 44;
    var H = top + bh + 40;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'eg-svg eg-bars', style: { maxWidth: '100%', height: 'auto' } });
    var fills = { pears: '#e9f5c9', tshirts: '#dbe9ff', planks: '#ddb892', jumps: '#fff3cd' };
    var cards = [];
    var pills = [];
    var lit = 0;
    var locked = false;
    for (var i = 0; i < q.groups; i++) {
      var x = x0 + i * w;
      var g = svg('g', { class: 'eg-grp eg-click eg-seg', 'data-group': i });
      if (q.kind === 'pears') g.appendChild(pearIcon(x + w / 2, 24));
      if (q.kind === 'tshirts') g.appendChild(shirtIcon(x + w / 2, 26));
      if (q.kind === 'jumps') g.appendChild(svg('path', { d: 'M' + (x + 3) + ' ' + (top - 2) + ' Q' + (x + w / 2) + ' ' + (top - 50) + ' ' + (x + w - 3) + ' ' + (top - 2), fill: 'none', stroke: '#c2410c', 'stroke-width': 3, 'stroke-dasharray': '6 4', 'marker-end': '' }));
      g.appendChild(svg('rect', { x: x, y: top, width: w, height: bh, class: 'eg-segrect', fill: fills[q.kind], stroke: q.kind === 'planks' ? '#7f5539' : '#4a5a7d', 'stroke-width': 2 }));
      g.appendChild(svg('text', { x: x + w / 2, y: top + bh / 2 + 7, 'text-anchor': 'middle', class: 'eg-seglab' }, amt(q, q.size)));
      root.appendChild(g);
      cards.push(g);
      var t = svg('text', { x: x + w, y: top + bh + 26, 'text-anchor': 'middle', class: 'eg-pill' }, '');
      root.appendChild(svg('line', { x1: x + w, y1: top + bh, x2: x + w, y2: top + bh + 8, stroke: '#4a5a7d', 'stroke-width': 2 }));
      root.appendChild(t);
      pills.push(t);
    }
    root.appendChild(svg('line', { x1: x0, y1: top + bh, x2: x0, y2: top + bh + 8, stroke: '#4a5a7d', 'stroke-width': 2 }));
    root.appendChild(svg('text', { x: x0, y: top + bh + 26, 'text-anchor': 'middle', class: 'eg-pill eg-zero' }, amt(q, 0)));
    var api = {
      el: el('div', { class: 'eg-pic' }, root),
      svg: root,
      cards: cards,
      lit: function () {
        return lit;
      },
      lightNext: function () {
        if (lit >= q.groups) return false;
        cards[lit].classList.add('eg-lit');
        pills[lit].textContent = amt(q, (lit + 1) * q.size);
        lit++;
        return true;
      },
      lightAll: function () {
        while (lit < q.groups) api.lightNext();
      },
      lock: function () {
        locked = true;
      },
    };
    cards.forEach(function (c) {
      c.addEventListener('click', function () {
        if (locked) return;
        MQ.sound('pop');
        api.lightNext();
      });
    });
    return api;
  }

  /* ---------------------------------------------------------------- *
   * Number line with equal jumps.
   * ---------------------------------------------------------------- */
  function jumpLine(size, groups, o) {
    o = o || {};
    var total = size * groups;
    var W = 900;
    var H = o.h || 92;
    var x0 = 30;
    var x1 = 870;
    var base = H - 28;
    var sp = (x1 - x0) / groups;
    function X(v) {
      return x0 + ((x1 - x0) * v) / total;
    }
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'eg-svg eg-nl', style: { maxWidth: '100%', height: 'auto' } });
    root.appendChild(svg('line', { x1: x0 - 10, y1: base, x2: x1 + 10, y2: base, class: 'eg-nl-axis' }));
    if (total <= 40) {
      for (var v = 0; v <= total; v++) root.appendChild(svg('line', { x1: X(v), y1: base - 5, x2: X(v), y2: base + 5, class: 'eg-nl-minor' }));
    }
    var every = Math.max(1, Math.ceil(40 / sp));
    var labels = [];
    for (var k = 0; k <= groups; k++) {
      root.appendChild(svg('line', { x1: X(k * size), y1: base - 9, x2: X(k * size), y2: base + 9, class: 'eg-nl-tick' }));
      var show = k % every === 0 || k === groups;
      if (k === groups - 1 && every > 1 && k % every !== 0) show = false;
      var t = svg('text', { x: X(k * size), y: base + 26, 'text-anchor': 'middle', class: 'eg-nl-num' + (k === 0 ? ' eg-nl-hit' : '') }, show ? String(k * size) : '');
      root.appendChild(t);
      labels.push(t);
    }
    var jumps = svg('g');
    root.appendChild(jumps);
    var n = 0;
    var hh = Math.min(base - 30, Math.max(14, sp * 0.5));
    var api = {
      el: root,
      n: function () {
        return n;
      },
      step: function () {
        if (n >= groups) return false;
        var a = X(n * size);
        var b = X((n + 1) * size);
        jumps.appendChild(svg('path', { d: 'M' + a + ' ' + base + ' Q' + (a + b) / 2 + ' ' + (base - 2 * hh) + ' ' + b + ' ' + base, class: 'eg-nl-jump' }));
        if (sp >= 44) jumps.appendChild(svg('text', { x: (a + b) / 2, y: base - hh - 4, 'text-anchor': 'middle', class: 'eg-nl-plus' }, '+' + size));
        n++;
        labels[n].classList.add('eg-nl-hit');
        if (!labels[n].textContent) labels[n].textContent = '';
        return true;
      },
      all: function () {
        while (api.step()) {}
      },
    };
    return api;
  }

  /* ---------------------------------------------------------------- *
   * Repeated addition row and the × fact card.
   * ---------------------------------------------------------------- */
  function sumRow(q, parts, totalText) {
    var row = el('div', { class: 'sum-row eg-sum' });
    if (parts.length > 12) {
      row.appendChild(el('span', { class: 'chip' }, amt(q, q.size)));
      row.appendChild(el('span', { class: 'sum-op' }, '+'));
      row.appendChild(el('span', { class: 'chip' }, amt(q, q.size)));
      row.appendChild(el('span', { class: 'sum-op' }, '+ … +'));
      row.appendChild(el('span', { class: 'chip' }, amt(q, q.size)));
      row.appendChild(el('span', { class: 'eg-times-note' }, '(' + parts.length + ' times)'));
    } else {
      parts.forEach(function (p, i) {
        if (i) row.appendChild(el('span', { class: 'sum-op' }, '+'));
        row.appendChild(el('span', { class: 'chip' }, p));
      });
    }
    if (totalText != null) {
      row.appendChild(el('span', { class: 'sum-op' }, '='));
      row.appendChild(el('span', { class: 'chip chip-total' }, totalText));
    }
    return row;
  }
  function fullSum(q) {
    var parts = [];
    for (var i = 0; i < q.groups; i++) parts.push(amt(q, q.size));
    return sumRow(q, parts, amt(q, q.total));
  }
  function factCard(a, b, c, la, lb) {
    return el('div', { class: 'eg-fact' },
      el('div', { class: 'eg-col' }, el('span', { class: 'eg-big' }, a), el('span', { class: 'eg-lab' }, la || 'group size')),
      el('span', { class: 'eg-big eg-op' }, '×'),
      el('div', { class: 'eg-col' }, el('span', { class: 'eg-big' }, b), el('span', { class: 'eg-lab' }, lb || 'number of groups')),
      el('span', { class: 'eg-big eg-op' }, '='),
      el('div', { class: 'eg-col' }, el('span', { class: 'eg-big eg-total' }, c), el('span', { class: 'eg-lab' }, 'altogether')));
  }

  /* ---------------------------------------------------------------- *
   * Answer boxes
   * ---------------------------------------------------------------- */
  function box(slot, onEnter, wide) {
    var b = el('input', { class: 'eg-box' + (wide ? ' eg-box-wide' : ''), type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: 4, 'data-slot': slot, 'aria-label': slot });
    b.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onEnter();
      }
    });
    return b;
  }
  function val(b) {
    var s = String(b.value).replace(/[^\d]/g, '');
    return s === '' ? NaN : parseInt(s, 10);
  }
  function labelled(node, text) {
    return el('div', { class: 'eg-col' }, node, el('span', { class: 'eg-lab' }, text));
  }
  function op(t) {
    return el('span', { class: 'eg-op' }, t);
  }
  function unitBits(q) {
    return { pre: q.pre ? op(q.pre) : null, post: q.post ? op(q.post.trim()) : null };
  }
  function markBox(b, good) {
    b.classList.remove('good', 'bad');
    b.classList.add(good ? 'good' : 'bad');
  }
  function lockBoxes(list) {
    list.forEach(function (b) {
      b.disabled = true;
    });
  }
  function checkBtn(onClick, text) {
    return el('button', { class: 'btn eg-check', type: 'button', onclick: onClick }, text || 'Check');
  }
  function choicesWithData(options, onPick) {
    var ch = MQ.ui.choices(options, onPick, { columns: options.length });
    ch.classList.add('eg-choices');
    ch.buttons.forEach(function (b) {
      b.setAttribute('data-value', String(b.value_));
    });
    return ch;
  }

  /* ---------------------------------------------------------------- *
   * Drag-onto-plates engine (learn screens 1 and 4, practice "make").
   * ---------------------------------------------------------------- */
  function plateEngine(api, cfg) {
    var W = cfg.W;
    var H = cfg.H;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'eg-svg eg-drag', style: { maxWidth: '100%', height: 'auto' } });
    var pile = cfg.pile;
    // pile container
    if (pile.shape === 'bowl') {
      root.appendChild(svg('path', { d: 'M' + (pile.cx - pile.rx) + ' ' + (pile.cy - 10) + ' Q' + (pile.cx - pile.rx + 20) + ' ' + (pile.cy + pile.ry + 18) + ' ' + pile.cx + ' ' + (pile.cy + pile.ry + 16) + ' Q' + (pile.cx + pile.rx - 20) + ' ' + (pile.cy + pile.ry + 18) + ' ' + (pile.cx + pile.rx) + ' ' + (pile.cy - 10) + ' Z', class: 'eg-bowl' }));
    } else {
      root.appendChild(svg('rect', { x: pile.cx - pile.rx, y: pile.cy - pile.ry, width: pile.rx * 2, height: pile.ry * 2, rx: 14, class: 'eg-tray' }));
    }
    if (pile.label) root.appendChild(svg('text', { x: pile.cx + pile.rx + 12, y: pile.cy + 6, class: 'eg-pilelab' }, pile.label));
    var plates = [];
    var lists = [];
    cfg.plates.forEach(function (p, k) {
      var g = svg('g', { class: 'eg-plate', 'data-plate': k });
      g.appendChild(svg('ellipse', { cx: p.x, cy: p.y, rx: cfg.prx, ry: cfg.pry, class: 'eg-plate-rim' }));
      g.appendChild(svg('ellipse', { cx: p.x, cy: p.y, rx: cfg.prx * 0.72, ry: cfg.pry * 0.66, class: 'eg-plate-in' }));
      var t = svg('text', { x: p.x, y: p.y + cfg.pry + 26, 'text-anchor': 'middle', class: 'eg-plate-count' }, '0');
      g.appendChild(t);
      root.appendChild(g);
      plates.push({ g: g, t: t, x: p.x, y: p.y });
      lists.push([]);
      g.addEventListener('click', function () {
        if (state.locked) return;
        if (!pileList.length) {
          api.feedback('The ' + (cfg.pileName || 'bowl') + ' is empty. Click a ' + cfg.itemWord + ' on a plate to put it back.', 'info');
          return;
        }
        move(pileList[pileList.length - 1], k);
      });
    });
    var layer = svg('g');
    root.appendChild(layer);
    var items = [];
    var where = [];
    var pileList = [];
    var state = { locked: false, dealt: 0 };
    var cap = cfg.cap || cfg.slotCols * cfg.slotRows;

    function pileSlot(j) {
      var cols = pile.cols;
      var rows = Math.ceil(cfg.count / cols);
      var c = j % cols;
      var r = Math.floor(j / cols);
      return { x: pile.cx + (c - (cols - 1) / 2) * pile.dx, y: pile.cy + (r - (rows - 1) / 2) * pile.dy };
    }
    function plateSlot(k, j) {
      var C = cfg.slotCols;
      var R = cfg.slotRows;
      var c = j % C;
      var r = Math.floor(j / C);
      return { x: plates[k].x + (c - (C - 1) / 2) * cfg.sdx, y: plates[k].y + (r - (R - 1) / 2) * cfg.sdy };
    }
    function setPos(i, p) {
      items[i].pos = p;
      items[i].g.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px)';
    }
    function layout() {
      pileList.forEach(function (i, j) {
        setPos(i, pileSlot(j));
      });
      lists.forEach(function (list, k) {
        list.forEach(function (i, j) {
          setPos(i, plateSlot(k, j));
        });
        plates[k].t.textContent = String(list.length);
        plates[k].g.classList.toggle('eg-full', list.length > 0);
      });
    }
    function counts() {
      return lists.map(function (l) {
        return l.length;
      });
    }
    function changed() {
      layout();
      if (cfg.onChange) cfg.onChange(counts(), pileList.length);
    }
    function remove(i) {
      var w = where[i];
      var list = w < 0 ? pileList : lists[w];
      list.splice(list.indexOf(i), 1);
    }
    function move(i, target) {
      if (target >= 0 && lists[target].length >= cap && where[i] !== target) {
        if (cfg.onFull) cfg.onFull(target);
        layout();
        return false;
      }
      if (where[i] === target) {
        layout();
        return false;
      }
      remove(i);
      where[i] = target;
      if (target < 0) pileList.push(i);
      else lists[target].push(i);
      MQ.sound('pop');
      changed();
      return true;
    }
    function hit(p) {
      for (var k = 0; k < plates.length; k++) {
        var dx = (p.x - plates[k].x) / (cfg.prx * 1.15);
        var dy = (p.y - plates[k].y) / (cfg.pry * 1.5);
        if (dx * dx + dy * dy <= 1) return k;
      }
      if (Math.abs(p.x - pile.cx) <= pile.rx + 20 && Math.abs(p.y - pile.cy) <= pile.ry + 30) return -1;
      return null;
    }
    function clickItem(i) {
      if (where[i] >= 0) {
        move(i, -1);
        return;
      }
      // click in the pile: deal it out
      var k;
      if (cfg.clickMode === 'fill') {
        k = -1;
        for (var a = 0; a < lists.length; a++) {
          if (lists[a].length < (cfg.fillTo || cap)) {
            k = a;
            break;
          }
        }
        if (k < 0) {
          for (var b = 0; b < lists.length; b++) {
            if (lists[b].length < cap) {
              k = b;
              break;
            }
          }
        }
        if (k < 0) {
          if (cfg.onFull) cfg.onFull(0);
          return;
        }
      } else {
        k = state.dealt % lists.length;
        var tries = 0;
        while (lists[k].length >= cap && tries < lists.length) {
          k = (k + 1) % lists.length;
          tries++;
        }
        state.dealt = k + 1;
      }
      move(i, k);
    }

    for (var i = 0; i < cfg.count; i++) {
      var g = cfg.item(i);
      g.classList.add('eg-item');
      g.setAttribute('data-item', i);
      layer.appendChild(g);
      items.push({ g: g, pos: { x: 0, y: 0 } });
      where.push(-1);
      pileList.push(i);
    }
    items.forEach(function (it, idx) {
      var startP = null;
      var base = null;
      api.cleanup(
        MQ.ui.drag(root, it.g, {
          start: function (p) {
            if (state.locked) return;
            startP = p;
            base = { x: it.pos.x, y: it.pos.y };
          },
          move: function (p, dx, dy) {
            if (!startP) return;
            it.g.style.transform = 'translate(' + (base.x + dx) + 'px,' + (base.y + dy) + 'px)';
          },
          end: function (p) {
            if (!startP) return;
            layer.appendChild(it.g); // bring to front (after the drag, so pointer capture is kept)
            var d = Math.abs(p.x - startP.x) + Math.abs(p.y - startP.y);
            startP = null;
            if (d < 6) {
              clickItem(idx);
              return;
            }
            var t = hit(p);
            if (t === null) layout();
            else move(idx, t);
          },
        })
      );
    });
    layout();
    return {
      el: el('div', { class: 'eg-pic' }, root),
      svg: root,
      counts: counts,
      pileCount: function () {
        return pileList.length;
      },
      lock: function () {
        state.locked = true;
        root.classList.add('eg-locked');
      },
      /** Put exactly n items on each plate (used by "Show me"). */
      arrange: function (n, plateCount) {
        var all = [];
        for (var a = 0; a < cfg.count; a++) all.push(a);
        pileList.length = 0;
        lists.forEach(function (l) {
          l.length = 0;
        });
        all.forEach(function (it2, j) {
          var k = Math.floor(j / n);
          if (k < (plateCount || lists.length)) {
            lists[k].push(it2);
            where[it2] = k;
          } else {
            pileList.push(it2);
            where[it2] = -1;
          }
        });
        layout();
      },
      plates: plates,
    };
  }

  function appleItem() {
    return svg('g', null, apple(0, 0, 13));
  }
  function cookieItem() {
    return svg('g', { class: 'eg-cookie' },
      svg('circle', { cx: 0, cy: 0, r: 13, fill: '#d4a373', stroke: '#8d5b3a', 'stroke-width': 1.5 }),
      svg('circle', { cx: -4, cy: -4, r: 2.2, fill: '#5c3317' }),
      svg('circle', { cx: 5, cy: -2, r: 2.2, fill: '#5c3317' }),
      svg('circle', { cx: -1, cy: 5, r: 2.2, fill: '#5c3317' }));
  }
  function cakeShape(x, y) {
    return svg('g', null,
      svg('rect', { x: x - 10, y: y - 5, width: 20, height: 13, rx: 2, fill: '#f4a261', stroke: '#9c6b1f', 'stroke-width': 1.2 }),
      svg('rect', { x: x - 10, y: y - 8, width: 20, height: 5, rx: 2, fill: '#ffffff', stroke: '#9c6b1f', 'stroke-width': 1.2 }),
      svg('circle', { cx: x, cy: y - 10, r: 3, fill: '#e63946' }));
  }

  /* ---------------------------------------------------------------- *
   * Deck
   * ---------------------------------------------------------------- */
  function factorPairs(total) {
    var out = [];
    for (var a = 2; a <= 10; a++) if (total % a === 0 && total / a >= 2 && total / a <= 10) out.push([a, total / a]);
    return out;
  }
  function makeChoices(size, groups, mode) {
    var total = size * groups;
    var right = size + ' × ' + groups + ' = ' + total;
    var wrong = null;
    var tag = TAG.lost;
    if (mode === 'pair') {
      var others = factorPairs(total).filter(function (p) {
        return !((p[0] === size && p[1] === groups) || (p[0] === groups && p[1] === size));
      });
      if (others.length) {
        var p = U.pick(others);
        wrong = p[0] + ' × ' + p[1] + ' = ' + total;
        tag = TAG.picture;
      } else mode = 'off';
    }
    if (mode === 'plus') {
      wrong = size + ' + ' + groups + ' = ' + (size + groups);
      tag = TAG.added;
    }
    if (!wrong) {
      var g2 = groups >= 3 && Math.random() < 0.5 ? groups - 1 : groups + 1;
      wrong = size + ' × ' + g2 + ' = ' + size * g2;
      tag = TAG.lost;
    }
    return { right: right, wrong: wrong, wrongTag: tag, options: U.shuffle([right, wrong]) };
  }

  function buildDeck() {
    var deck = [];
    // Level 1: groups of 2, 5, 10 (up to 6 groups)
    var cKinds = U.shuffle(['socks', 'hands', 'pencils']);
    var modes = U.shuffle(['pair', 'plus', 'off']);
    var countQ = cKinds.map(function (k, i) {
      var size = KINDS[k].size;
      var groups = k === 'socks' ? U.rand(3, 6) : U.rand(2, 6);
      return { type: 'count', level: 1, kind: k, size: size, groups: groups, total: size * groups, choice: makeChoices(size, groups, modes[i]) };
    });
    var mSize = U.pick([2, 5]);
    var mGroups = mSize === 2 ? U.rand(3, 4) : U.rand(2, 4);
    var makeQ = { type: 'make', level: 1, kind: 'cookies', size: mSize, groups: mGroups, total: mSize * mGroups, choice: makeChoices(mSize, mGroups, 'plus') };
    deck.push(countQ[0], countQ[1], makeQ, countQ[2]);
    // Level 2: groups of 3 or 4 (up to 8 groups) + division as grouping (total up to 40)
    var k3 = U.pick(['trikes', 'yoghurt']);
    var k4 = U.pick(['chairs', 'eggs']);
    var w = U.shuffle([k3, k4]).map(function (k) {
      var groups = U.rand(3, 8);
      return { type: 'write', level: 2, kind: k, size: KINDS[k].size, groups: groups, total: KINDS[k].size * groups };
    });
    var dSize = U.pick([3, 4]);
    var dGroups = U.rand(3, Math.min(10, Math.floor(40 / dSize)));
    deck.push(w[0], { type: 'divide', level: 2, kind: 'cakes', size: dSize, groups: dGroups, total: dSize * dGroups }, w[1]);
    // Level 3: groups of 6, 8 or 9 (pictures and stories), boxes of 10 with 2-digit numbers of boxes
    var pk = U.pick(['team', 'spiders', 'cupcakes']);
    var pg = U.rand(3, 8);
    var picQ = { type: 'times', level: 3, kind: pk, size: KINDS[pk].size, groups: pg, total: KINDS[pk].size * pg };
    var sk = U.pick(Object.keys(STORIES));
    var ss = U.pick([6, 8, 9]);
    var sg = U.rand(3, 8);
    var storyQ = { type: 'times', level: 3, kind: sk, story: true, size: ss, groups: sg, total: ss * sg, pre: STORIES[sk].pre, post: STORIES[sk].post };
    var bg = U.rand(11, 25);
    var boxQ = { type: 'times', level: 3, kind: 'boxes10', size: 10, groups: bg, total: 10 * bg };
    U.shuffle([picQ, storyQ, boxQ]).forEach(function (q) {
      deck.push(q);
    });
    return deck;
  }

  var deck = null;

  /* ---------------------------------------------------------------- *
   * Shared hint logic for a wrong total
   * ---------------------------------------------------------------- */
  function totalHint(api, q, ans) {
    var k = KINDS[q.kind] || STORIES[q.kind] || { group: 'group', groups: 'groups', item: 'things' };
    var first = multiples(q.size, Math.min(3, q.groups)).map(function (v) { return amt(q, v); }).join(', ');
    var second = api.tries() >= 1;
    if (ans === q.size + q.groups) {
      return { hint: second ? 'Adding ' + q.size + ' and ' + q.groups + ' only counts one ' + k.group + '. Count in ' + q.size + 's for every ' + k.group + ': ' + first + ' …' : 'That is ' + q.size + ' + ' + q.groups + '. We need ' + q.size + ' for every ' + k.group + '. Count in ' + q.size + 's!', tag: TAG.added };
    }
    if (ans > 0 && ans % q.size === 0) {
      return { hint: second ? 'Click each ' + k.group + ' once and count: ' + first + ' … How many ' + k.groups + ' are there?' : 'Close! You counted in ' + q.size + 's, but check how many ' + k.groups + ' there are.', tag: TAG.lost };
    }
    return { hint: second ? 'Count in ' + q.size + 's, not in ones: ' + first + ' … Click each ' + k.group + ' as you say a number.' : 'Try counting in ' + q.size + 's, not in ones. Click each ' + k.group + ' to count.', tag: TAG.ones };
  }

  /* ---------------------------------------------------------------- *
   * Practice renderers
   * ---------------------------------------------------------------- */
  function renderCount(stage, api, q) {
    var k = KINDS[q.kind];
    api.say(k.say, 'think');
    stage.appendChild(MQ.ui.prompt('How many <b>' + k.item + '</b> are there altogether?'));
    var pic = groupsPic(q);
    stage.appendChild(pic.el);
    stage.appendChild(el('p', { class: 'eg-help' }, 'Click each ' + k.group + ' to count in ' + q.size + 's.'));
    var stepA = true;
    var tBox = box('total', submit);
    var btn = checkBtn(submit);
    var row = el('div', { class: 'eg-eq' }, tBox, op(k.item), btn);
    stage.appendChild(row);
    var work = el('div', { class: 'eg-work' });
    stage.appendChild(work);
    var ch = null;

    function showB() {
      stepA = false;
      tBox.value = String(q.total);
      markBox(tBox, true);
      lockBoxes([tBox]);
      btn.disabled = true;
      pic.lightAll();
      pic.lock();
      work.appendChild(fullSum(q));
      work.appendChild(el('div', { class: 'eg-ask' }, 'Which × sentence matches?'));
      ch = choicesWithData(q.choice.options, function (v) {
        if (v === q.choice.right) {
          ch.mark(v, 'good');
          ch.disable();
          api.check(true, q.size + ' × ' + q.groups + ' = ' + q.total + ': ' + q.groups + ' ' + k.groups + ' of ' + q.size + '!');
        } else {
          ch.mark(v, 'bad');
          var hint = q.choice.wrongTag === TAG.added ? 'That one adds just two numbers. We have ' + q.groups + ' groups of ' + q.size + ', so we multiply.' : q.choice.wrongTag === TAG.picture ? 'That fact is true too, but it is not this picture. Look: ' + q.size + ' in each ' + k.group + ', and ' + q.groups + ' ' + k.groups + '.' : 'Look at the picture: ' + q.size + ' in each ' + k.group + ', and ' + q.groups + ' ' + k.groups + '.';
          api.check(false, hint, q.choice.wrongTag);
        }
      });
      work.appendChild(ch);
    }
    function submit() {
      if (!stepA || api.isAnswered()) return;
      var a = val(tBox);
      if (isNaN(a)) {
        api.feedback('Type how many ' + k.item + ' there are.', 'info');
        return;
      }
      if (a === q.total) {
        api.sound('correct');
        api.say('Yes, ' + q.total + '! Now pick the × sentence.', 'happy');
        api.feedback(q.total + ' ' + k.item + '. Now choose the × sentence that matches.', 'good');
        showB();
        return;
      }
      markBox(tBox, false);
      var h = totalHint(api, q, a);
      api.check(false, h.hint, h.tag);
    }
    api.onReveal(function () {
      if (stepA) showB();
      ch.mark(q.choice.right, 'good');
      ch.disable();
      var nl = jumpLine(q.size, q.groups, { h: 74 });
      work.insertBefore(nl.el, work.firstChild);
      nl.all();
      api.feedback('Count in ' + q.size + 's: ' + multiples(q.size, q.groups).join(', ') + '. So ' + q.size + ' × ' + q.groups + ' = ' + q.total + '.', 'info');
    });
    api.later(function () {
      try {
        tBox.focus({ preventScroll: true });
      } catch (e) {}
    }, 50);
  }

  function renderMake(stage, api, q) {
    var word = 'cookie';
    api.say('Put ' + q.size + ' cookies on each plate. Drag them, or click a plate.', 'think');
    stage.appendChild(MQ.ui.prompt('Put <b>' + q.size + ' cookies</b> on each plate.'));
    var W = 900;
    var plates = [];
    var spacing = Math.min(220, 860 / q.groups);
    for (var i = 0; i < q.groups; i++) plates.push({ x: W / 2 + (i - (q.groups - 1) / 2) * spacing, y: 178 });
    var stage2 = el('div', { class: 'eg-work' });
    var done = false;
    var eng = plateEngine(api, {
      W: W, H: 256, count: q.total,
      pile: { shape: 'tray', cx: W / 2, cy: 52, rx: Math.min(10, q.total) * 18 + 14, ry: Math.ceil(q.total / 10) * 17 + 14, cols: 10, dx: 34, dy: 32, label: '' },
      pileName: 'tray', itemWord: word,
      plates: plates, prx: 92, pry: 48, slotCols: 4, slotRows: 3, sdx: 30, sdy: 25,
      clickMode: 'fill', fillTo: q.size,
      item: cookieItem,
      onFull: function () {
        api.feedback('That plate is full. Try another plate.', 'info');
      },
      onChange: function (counts, left) {
        if (left === 0) api.feedback('All the cookies are on plates. Press "Check my plates".', 'info');
      },
    });
    stage.appendChild(eng.el);
    var btn = checkBtn(checkPlates, 'Check my plates');
    btn.classList.add('eg-done');
    stage.appendChild(btn);
    stage.appendChild(stage2);
    var ch = null;
    function stepB() {
      done = true;
      eng.lock();
      btn.disabled = true;
      var nl = jumpLine(q.size, q.groups, { h: 74 });
      stage2.appendChild(nl.el);
      nl.all();
      stage2.appendChild(el('div', { class: 'eg-ask' }, q.groups + ' plates of ' + q.size + '. Which × sentence matches?'));
      ch = choicesWithData(q.choice.options, function (v) {
        if (v === q.choice.right) {
          ch.mark(v, 'good');
          ch.disable();
          api.check(true, q.groups + ' groups of ' + q.size + ' is ' + q.size + ' × ' + q.groups + ' = ' + q.total + '!');
        } else {
          ch.mark(v, 'bad');
          api.check(false, api.tries() >= 1 ? 'Count in ' + q.size + 's along the jumps: ' + multiples(q.size, q.groups).join(', ') + '. We multiply, we don\'t just add two numbers.' : 'That just adds ' + q.size + ' and ' + q.groups + '. Look at the jumps: ' + q.groups + ' jumps of ' + q.size + '.', TAG.added);
        }
      });
      stage2.appendChild(ch);
    }
    function checkPlates() {
      if (done || api.isAnswered()) return;
      var c = eng.counts();
      if (eng.pileCount() > 0) {
        api.feedback('Use all the cookies first: ' + eng.pileCount() + ' still on the tray.', 'info');
        return;
      }
      var equal = c.every(function (n) {
        return n === q.size;
      });
      if (!equal) {
        api.check(false, api.tries() >= 1 ? 'Each plate needs exactly ' + q.size + '. Click a cookie to put it back on the tray, then move it to a plate with fewer.' : 'The plates are not equal yet: ' + c.join(', ') + '. Every plate needs ' + q.size + '.', TAG.unequal);
        return;
      }
      api.sound('correct');
      api.say('Every plate has ' + q.size + '. The groups are equal!', 'happy');
      api.feedback('Equal groups! Now choose the × sentence.', 'good');
      stepB();
    }
    api.onReveal(function () {
      eng.arrange(q.size);
      if (!done) stepB();
      ch.mark(q.choice.right, 'good');
      ch.disable();
      api.feedback(q.groups + ' plates with ' + q.size + ' on each: ' + q.size + ' × ' + q.groups + ' = ' + q.total + '.', 'info');
    });
  }

  function renderWrite(stage, api, q) {
    var k = KINDS[q.kind];
    api.say(k.say, 'think');
    stage.appendChild(MQ.ui.prompt('Write the adding and the × sentence for the <b>' + k.item + '</b>.'));
    var pic = groupsPic(q);
    stage.appendChild(pic.el);
    var adds = [];
    var row1 = el('div', { class: 'eg-eq eg-eq-add' });
    for (var i = 0; i < q.groups; i++) {
      if (i) row1.appendChild(op('+'));
      var b = box('add' + i, submit);
      adds.push(b);
      row1.appendChild(b);
    }
    row1.appendChild(op('='));
    var sumB = box('sum', submit);
    row1.appendChild(sumB);
    var aB = box('a', submit);
    var bB = box('b', submit);
    var pB = box('prod', submit);
    var row2 = el('div', { class: 'eg-eq' }, labelled(aB, 'group size'), op('×'), labelled(bB, 'number of groups'), op('='), labelled(pB, 'altogether'), checkBtn(submit));
    stage.appendChild(row1);
    stage.appendChild(row2);
    var all = adds.concat([sumB, aB, bB, pB]);
    var work = el('div', { class: 'eg-work' });
    stage.appendChild(work);

    function finishUI() {
      lockBoxes(all);
      stage.querySelectorAll('.eg-check').forEach(function (b2) {
        b2.disabled = true;
      });
      pic.lightAll();
      pic.lock();
    }
    function submit() {
      if (api.isAnswered()) return;
      var vals = all.map(val);
      if (vals.some(isNaN)) {
        api.feedback('Fill in every box first.', 'info');
        return;
      }
      var second = api.tries() >= 1;
      var av = adds.map(val);
      all.forEach(function (b3) {
        b3.classList.remove('good', 'bad');
      });
      // 1. the adding row
      var badAdd = av.filter(function (v) {
        return v !== q.size;
      }).length;
      if (badAdd) {
        adds.forEach(function (b3) {
          markBox(b3, val(b3) === q.size);
        });
        if (q.groups !== q.size && av.every(function (v) { return v === q.groups; })) {
          api.check(false, second ? 'Each box in the adding row is one ' + k.group + '. Count the ' + k.item + ' on ONE ' + k.group + ': that number goes in every box.' : 'You wrote the number of ' + k.groups + '. Each box needs how many ' + k.item + ' are in one ' + k.group + '.', TAG.swap);
        } else {
          api.check(false, second ? 'Every ' + k.group + ' has ' + q.size + ' ' + k.item + '. Write ' + q.size + ' in every box of the adding row.' : 'Each box in the adding row is one ' + k.group + '. How many ' + k.item + ' are on one ' + k.group + '?', TAG.ones);
        }
        return;
      }
      adds.forEach(function (b3) {
        markBox(b3, true);
      });
      // 2. the total of the adding row
      var s = val(sumB);
      if (s !== q.total) {
        markBox(sumB, false);
        var h = totalHint(api, q, s);
        api.check(false, h.hint, h.tag);
        return;
      }
      markBox(sumB, true);
      // 3. the × sentence (either order accepted)
      var a = val(aB);
      var b4 = val(bB);
      var p = val(pB);
      var factorsOk = (a === q.size && b4 === q.groups) || (a === q.groups && b4 === q.size);
      if (!factorsOk || p !== q.total) {
        markBox(aB, factorsOk);
        markBox(bB, factorsOk);
        markBox(pB, p === q.total);
        if (factorsOk) {
          api.check(false, a + ' × ' + b4 + ' is the same as your adding row. What did the adding row make?', p === q.size + q.groups ? TAG.added : TAG.lost);
        } else if (p === q.total) {
          api.check(false, second ? 'Group size: ' + q.size + ' ' + k.item + ' in each ' + k.group + '. Number of groups: count the ' + k.groups + '.' : 'Use the two numbers from the picture: how many in one ' + k.group + ', and how many ' + k.groups + '.', TAG.swap);
        } else {
          api.check(false, second ? 'The × sentence says the same as the adding row: ' + q.size + ' added ' + q.groups + ' times.' : 'Look at your adding row: what number did you add, and how many times?', TAG.swap);
        }
        return;
      }
      [aB, bB, pB].forEach(function (b5) {
        markBox(b5, true);
      });
      finishUI();
      work.appendChild(factCard(String(q.size), String(q.groups), String(q.total)));
      api.check(true, a === q.size ? 'Yes! ' + q.size + ' × ' + q.groups + ' = ' + q.total + '.' : 'Yes! The book writes the group size first: ' + q.size + ' × ' + q.groups + ' = ' + q.total + '.');
    }
    api.onReveal(function () {
      adds.forEach(function (b6) {
        b6.value = String(q.size);
      });
      sumB.value = String(q.total);
      aB.value = String(q.size);
      bB.value = String(q.groups);
      pB.value = String(q.total);
      all.forEach(function (b7) {
        markBox(b7, true);
      });
      finishUI();
      var nl = jumpLine(q.size, q.groups, { h: 74 });
      work.appendChild(nl.el);
      nl.all();
      api.feedback(q.groups + ' ' + k.groups + ' with ' + q.size + ' in each: add ' + q.size + ' again and again, ' + q.groups + ' times. That is ' + q.size + ' × ' + q.groups + ' = ' + q.total + '.', 'info');
    });
  }

  function renderDivide(stage, api, q) {
    api.say('How many plates can we fill? Press the button to fill a plate.', 'think');
    stage.appendChild(MQ.ui.prompt('<b>' + q.total + ' cakes</b>. Put <b>' + q.size + '</b> on each plate. How many plates?'));
    var W = 900;
    var cols = 10;
    var rows = Math.ceil(q.total / cols);
    var tray = { x: W / 2 - 180, y: 8, w: 360, h: rows * 28 + 18 };
    var plateY = tray.y + tray.h + 52;
    var H = plateY + 66;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'eg-svg eg-divide', style: { maxWidth: '100%', height: 'auto' } });
    root.appendChild(svg('rect', { x: tray.x, y: tray.y, width: tray.w, height: tray.h, rx: 14, class: 'eg-tray' }));
    var spacing = 86;
    var maxPlates = Math.floor(40 / 3) + 1;
    var plateXs = [];
    var platesOnRow = Math.min(10, q.groups + 0);
    // plates are placed as they are filled, centred on the widest possible row of 10
    for (var i = 0; i < 10; i++) plateXs.push(W / 2 + (i - 4.5) * spacing);
    var plateLayer = svg('g');
    root.appendChild(plateLayer);
    var placeholder = svg('text', { x: W / 2, y: plateY + 6, 'text-anchor': 'middle', class: 'eg-placeholder' }, 'Your plates go here');
    plateLayer.appendChild(placeholder);
    var cakeLayer = svg('g');
    root.appendChild(cakeLayer);
    var cakes = [];
    for (var c = 0; c < q.total; c++) {
      var cx = tray.x + 36 + (c % cols) * 32;
      var cy = tray.y + 22 + Math.floor(c / cols) * 28;
      var g = svg('g', { class: 'eg-item eg-cake' }, cakeShape(0, 0));
      g.style.transform = 'translate(' + cx + 'px,' + cy + 'px)';
      cakeLayer.appendChild(g);
      cakes.push(g);
    }
    var filled = 0;
    var left = q.total;
    var lab = svg('text', { x: tray.x + tray.w + 14, y: tray.y + 28, class: 'eg-pilelab' }, left + ' left');
    root.appendChild(lab);
    var done = false;
    function fillOne() {
      if (left < q.size || filled >= 10) return false;
      var px = plateXs[filled];
      if (placeholder.parentNode) placeholder.parentNode.removeChild(placeholder);
      plateLayer.appendChild(svg('ellipse', { cx: px, cy: plateY, rx: 38, ry: 24, class: 'eg-plate-rim' }));
      plateLayer.appendChild(svg('text', { x: px, y: plateY + 50, 'text-anchor': 'middle', class: 'eg-pill' }, String((filled + 1) * q.size)));
      for (var j = 0; j < q.size; j++) {
        var cake = cakes[left - 1 - j];
        var ox = j % 2 === 0 ? -12 : 12;
        var oy = j < 2 ? -7 : 9;
        if (q.size === 3 && j === 2) ox = 0;
        cake.style.transform = 'translate(' + (px + ox) + 'px,' + (plateY + oy) + 'px)';
      }
      left -= q.size;
      filled++;
      lab.textContent = left + ' left';
      return true;
    }
    stage.appendChild(el('div', { class: 'eg-pic' }, root));
    var fillBtn = el('button', { class: 'btn eg-fill', type: 'button' }, 'Fill a plate with ' + q.size);
    fillBtn.addEventListener('click', function () {
      if (done) return;
      if (fillOne()) {
        MQ.sound('pop');
        if (left === 0) {
          fillBtn.disabled = true;
          api.say('All the cakes are on plates. How many plates?', 'happy');
        }
      }
    });
    var ans = box('plates', submit);
    var row = el('div', { class: 'eg-eq' }, fillBtn, el('span', { class: 'eg-gap' }), op(String(q.total)), op('÷'), op(String(q.size)), op('='), ans, op('plates'), checkBtn(submit));
    stage.appendChild(row);
    var work = el('div', { class: 'eg-work' });
    stage.appendChild(work);
    function finishUI() {
      done = true;
      ans.disabled = true;
      fillBtn.disabled = true;
      stage.querySelectorAll('.eg-check').forEach(function (b) {
        b.disabled = true;
      });
    }
    function submit() {
      if (api.isAnswered()) return;
      var a = val(ans);
      if (isNaN(a)) {
        api.feedback('Type how many plates.', 'info');
        return;
      }
      if (a === q.groups) {
        markBox(ans, true);
        finishUI();
        while (fillOne()) {}
        var parts = [];
        for (var i2 = 0; i2 < q.groups; i2++) parts.push(String(q.size));
        work.appendChild(sumRow(q, parts, String(q.total)));
        api.check(true, q.groups + ' plates of ' + q.size + ' make ' + q.total + '. So ' + q.total + ' ÷ ' + q.size + ' = ' + q.groups + '!');
        return;
      }
      markBox(ans, false);
      var second = api.tries() >= 1;
      if (a === q.size) {
        api.check(false, second ? q.size + ' is how many cakes go on ONE plate. Fill plates until the tray is empty, then count the plates.' : 'That is the number on each plate. We want how many plates.', TAG.swap);
      } else if (a === q.total - q.size || a === q.total + q.size) {
        api.check(false, 'We are not taking away just once. Fill plates of ' + q.size + ' until the cakes run out, then count the plates.', TAG.added);
      } else {
        api.check(false, second ? 'Count in ' + q.size + 's up to ' + q.total + ': ' + multiples(q.size, 3).join(', ') + ' … Each number is one plate.' : 'Fill plates until the tray is empty. Then count the plates.', TAG.lost);
      }
    }
    api.onReveal(function () {
      while (fillOne()) {}
      ans.value = String(q.groups);
      markBox(ans, true);
      finishUI();
      var parts = [];
      for (var i3 = 0; i3 < q.groups; i3++) parts.push(String(q.size));
      work.appendChild(sumRow(q, parts, String(q.total)));
      work.appendChild(el('div', { class: 'eg-fact eg-fact-small' }, q.total + ' ÷ ' + q.size + ' = ' + q.groups + '  ·  ' + q.size + ' × ' + q.groups + ' = ' + q.total));
      api.feedback(q.groups + ' plates of ' + q.size + ' use up all ' + q.total + ' cakes.', 'info');
    });
    void maxPlates;
    void platesOnRow;
  }

  function renderTimes(stage, api, q) {
    var k = q.story ? STORIES[q.kind] : KINDS[q.kind];
    var pic;
    if (q.story) {
      api.say('Each part of the bar is the same. Click the parts to count in ' + q.size + 's.', 'think');
      stage.appendChild(MQ.ui.prompt(k.text(q.size, q.groups)));
      pic = barsPic(q);
      stage.appendChild(pic.el);
    } else if (q.kind === 'boxes10') {
      api.say(k.say, 'think');
      stage.appendChild(MQ.ui.prompt('<b>' + q.groups + ' boxes</b> with <b>10 pencils</b> in each. How many pencils?'));
      pic = groupsPic(q);
      stage.appendChild(pic.el);
    } else {
      api.say(k.say, 'think');
      stage.appendChild(MQ.ui.prompt('How many <b>' + k.item + '</b> altogether? Write the × sentence.'));
      pic = groupsPic(q);
      stage.appendChild(pic.el);
    }
    var aB = box('a', submit);
    var bB = box('b', submit);
    var pB = box('prod', submit, true);
    var u = unitBits(q);
    var row = el('div', { class: 'eg-eq' }, labelled(aB, q.story ? 'each ' + k.group : 'group size'), op('×'), labelled(bB, 'number of ' + k.groups), op('='), u.pre, labelled(pB, 'altogether'), u.post, checkBtn(submit));
    stage.appendChild(row);
    var work = el('div', { class: 'eg-work' });
    stage.appendChild(work);
    var all = [aB, bB, pB];
    function finishUI() {
      lockBoxes(all);
      stage.querySelectorAll('.eg-check').forEach(function (b) {
        b.disabled = true;
      });
      pic.lightAll();
      pic.lock();
    }
    function submit() {
      if (api.isAnswered()) return;
      var a = val(aB);
      var b = val(bB);
      var p = val(pB);
      if (isNaN(a) || isNaN(b) || isNaN(p)) {
        api.feedback('Fill in all three boxes.', 'info');
        return;
      }
      var second = api.tries() >= 1;
      var factorsOk = (a === q.size && b === q.groups) || (a === q.groups && b === q.size);
      markBox(aB, factorsOk);
      markBox(bB, factorsOk);
      markBox(pB, p === q.total);
      if (!factorsOk) {
        if (a + b === p || p === q.size + q.groups) {
          api.check(false, 'Multiply, don\'t add: there are ' + (second ? q.groups + ' ' + k.groups + ' of ' + amt(q, q.size) : 'lots of equal ' + k.groups) + '.', TAG.added);
        } else if (a === q.groups || b === q.size) {
          api.check(false, second ? 'Group size is ' + amt(q, q.size) + ' (one ' + k.group + '). Number of groups is ' + q.groups + '.' : 'Check the two numbers: how much is in ONE ' + k.group + ', and how many ' + k.groups + ' are there?', TAG.swap);
        } else {
          api.check(false, second ? 'One ' + k.group + ' is ' + amt(q, q.size) + '. Count the ' + k.groups + ': there are ' + q.groups + '.' : 'Look again: how much is one ' + k.group + '? How many ' + k.groups + ' can you count?', TAG.lost);
        }
        return;
      }
      if (p !== q.total) {
        if (q.kind === 'boxes10') {
          api.check(false, second ? '10 boxes make 100 pencils. Then count on in tens for the other ' + (q.groups - 10) + ' boxes.' : 'Count the boxes in 10s: 10, 20, 30 … ' + q.groups + ' tens make how many?', p === q.size + q.groups ? TAG.added : TAG.lost);
          return;
        }
        var h = totalHint(api, q, p);
        api.check(false, h.hint, h.tag);
        return;
      }
      finishUI();
      work.appendChild(fullSum(q));
      api.check(true, a === q.size ? 'Yes! ' + q.size + ' × ' + q.groups + ' = ' + amt(q, q.total) + '.' : 'Yes! The book writes the group size first: ' + q.size + ' × ' + q.groups + ' = ' + amt(q, q.total) + '.');
    }
    api.onReveal(function () {
      aB.value = String(q.size);
      bB.value = String(q.groups);
      pB.value = String(q.total);
      all.forEach(function (b) {
        markBox(b, true);
      });
      finishUI();
      if (!q.story) {
        var nl = jumpLine(q.size, q.groups, { h: 74 });
        work.appendChild(nl.el);
        nl.all();
      }
      work.appendChild(fullSum(q));
      api.feedback(q.groups + ' ' + k.groups + ' of ' + amt(q, q.size) + ': ' + q.size + ' × ' + q.groups + ' = ' + amt(q, q.total) + '.', 'info');
    });
  }

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */
  function learnSame(stage, api) {
    api.lockNext();
    api.say('Share the apples so every plate has the same number.', 'happy');
    stage.appendChild(MQ.ui.lesson('Same in every group', 'Put <b>3 apples</b> on each plate. Drag them, or click the apples.'));
    var W = 900;
    var plates = [];
    for (var i = 0; i < 4; i++) plates.push({ x: W / 2 + (i - 1.5) * 215, y: 216 });
    var msg = el('div', { class: 'eg-banner' }, ' ');
    var unlocked = false;
    var eng = plateEngine(api, {
      W: W, H: 300, count: 12,
      pile: { shape: 'bowl', cx: W / 2, cy: 58, rx: 150, ry: 34, cols: 6, dx: 38, dy: 32 },
      pileName: 'bowl', itemWord: 'apple',
      plates: plates, prx: 92, pry: 48, slotCols: 4, slotRows: 3, sdx: 30, sdy: 25,
      clickMode: 'deal',
      item: appleItem,
      onChange: function (counts, left) {
        if (left > 0) {
          msg.textContent = left + ' apples still in the bowl';
          msg.className = 'eg-banner';
          return;
        }
        var equal = counts.every(function (n) {
          return n === 3;
        });
        if (equal) {
          msg.textContent = '4 groups of 3';
          msg.className = 'eg-banner eg-banner-good';
          api.say('4 groups of 3! Every group is the same.', 'cheer');
          api.feedback('Equal groups: 3 on every plate.', 'good');
          if (!unlocked) {
            unlocked = true;
            api.unlockNext();
          }
        } else {
          msg.textContent = 'Not equal yet: ' + counts.join(', ');
          msg.className = 'eg-banner eg-banner-try';
          api.say('The groups are not equal yet. Move some apples.', 'oops');
        }
      },
    });
    stage.appendChild(eng.el);
    stage.appendChild(msg);
  }

  function learnJumps(stage, api) {
    api.lockNext();
    api.say('Count in 3s! Click each plate to jump along the line.', 'happy');
    stage.appendChild(MQ.ui.lesson('Count by groups', 'Each plate is one jump of 3.'));
    var q = { kind: 'apples', size: 3, groups: 4, total: 12 };
    var nl = jumpLine(3, 4, { h: 96 });
    var sum = el('div', { class: 'sum-row eg-sum eg-sum-build' });
    var n = 0;
    var jumpBtn;
    var pic = groupsPic(q, {
      scale: 1.25,
      onLight: function (lit) {
        nl.step();
        if (n) sum.appendChild(el('span', { class: 'sum-op' }, '+'));
        sum.appendChild(el('span', { class: 'chip' }, '3'));
        n = lit;
        if (lit === 4) {
          sum.appendChild(el('span', { class: 'sum-op' }, '='));
          sum.appendChild(el('span', { class: 'chip chip-total' }, '12'));
          api.say('3, 6, 9, 12. Four jumps of 3 make 12!', 'cheer');
          api.feedback('3 + 3 + 3 + 3 = 12', 'good');
          jumpBtn.disabled = true;
          api.unlockNext();
        } else {
          api.say(String(lit * 3) + '!', 'happy');
        }
      },
    });
    jumpBtn = el('button', { class: 'btn eg-jump', type: 'button' }, 'Jump 3 ▶');
    jumpBtn.addEventListener('click', function () {
      MQ.sound('pop');
      pic.lightNext();
    });
    stage.appendChild(nl.el);
    stage.appendChild(pic.el);
    stage.appendChild(el('div', { class: 'eg-eq' }, jumpBtn));
    stage.appendChild(sum);
  }

  function learnTimes(stage, api) {
    api.lockNext();
    api.say('Adding 3 four times has a shortcut: ×. Which number goes where?', 'think');
    stage.appendChild(MQ.ui.lesson('The × shortcut', '3 + 3 + 3 + 3 = 12'));
    var q = { kind: 'apples', size: 3, groups: 4, total: 12 };
    var pic = groupsPic(q, { clickable: false, scale: 1.25 });
    pic.lightAll();
    stage.appendChild(pic.el);
    var sA = el('span', { class: 'eg-slot', 'data-slot': 'size' }, '?');
    var sB = el('span', { class: 'eg-slot', 'data-slot': 'groups' }, '?');
    var labA = el('span', { class: 'eg-lab' }, 'group size');
    var labB = el('span', { class: 'eg-lab' }, 'number of groups');
    stage.appendChild(el('div', { class: 'eg-fact' }, el('div', { class: 'eg-col' }, sA, labA), el('span', { class: 'eg-big eg-op' }, '×'), el('div', { class: 'eg-col' }, sB, labB), el('span', { class: 'eg-big eg-op' }, '='), el('div', { class: 'eg-col' }, el('span', { class: 'eg-big eg-total' }, '12'), el('span', { class: 'eg-lab' }, 'altogether'))));
    var ask = el('div', { class: 'eg-ask' }, 'How many apples on each plate?');
    stage.appendChild(ask);
    var holder = el('div', { class: 'eg-hold' });
    stage.appendChild(holder);
    var step = 0;
    function show() {
      MQ.clear(holder);
      var ch = choicesWithData([3, 4, 12], function (v) {
        var want = step === 0 ? 3 : 4;
        if (v === want) {
          ch.mark(v, 'good');
          ch.disable();
          api.sound('correct');
          if (step === 0) {
            sA.textContent = '3';
            sA.classList.add('eg-slot-on');
            api.say('Yes, 3 in each group. That is the group size.', 'happy');
            step = 1;
            ask.textContent = 'How many plates are there?';
            api.later(show, 700);
          } else {
            sB.textContent = '4';
            sB.classList.add('eg-slot-on');
            ask.textContent = '3 + 3 + 3 + 3 is four 3s, so 3 × 4 = 12.';
            api.say('3 × 4 = 12. Group size first, then the number of groups.', 'cheer');
            api.feedback('3 + 3 + 3 + 3 = 12 is the same as 3 × 4 = 12.', 'good');
            MQ.clear(holder);
            api.unlockNext();
          }
        } else {
          ch.mark(v, 'bad');
          api.sound('wrong');
          if (v === 12) api.feedback('12 is all the apples together. Look at just ' + (step === 0 ? 'one plate.' : 'the plates.'), 'try');
          else api.feedback(step === 0 ? 'That is how many plates. How many apples are on ONE plate?' : 'That is how many on each plate. Count the plates.', 'try');
        }
      });
      holder.appendChild(ch);
    }
    show();
  }

  function learnDivide(stage, api) {
    api.lockNext();
    api.say('12 apples. Put 3 on each plate. How many plates do we need?', 'think');
    stage.appendChild(MQ.ui.lesson('Back the other way', 'Put <b>3 apples</b> on each plate until the bowl is empty.'));
    var W = 900;
    var plates = [];
    for (var i = 0; i < 6; i++) plates.push({ x: W / 2 + (i - 2.5) * 146, y: 206 });
    var msg = el('div', { class: 'eg-banner' }, ' ');
    var done = false;
    var eng = plateEngine(api, {
      W: W, H: 280, count: 12,
      pile: { shape: 'bowl', cx: W / 2, cy: 58, rx: 150, ry: 34, cols: 6, dx: 38, dy: 32 },
      pileName: 'bowl', itemWord: 'apple',
      plates: plates, prx: 64, pry: 38, slotCols: 3, slotRows: 1, sdx: 34, sdy: 26, cap: 3,
      clickMode: 'fill', fillTo: 3,
      item: appleItem,
      onFull: function () {
        api.feedback('That plate already has 3. Use a new plate.', 'info');
      },
      onChange: function (counts, left) {
        if (done) return;
        if (left > 0) {
          msg.textContent = left + ' apples still in the bowl';
          msg.className = 'eg-banner';
          return;
        }
        var used = counts.filter(function (n) {
          return n > 0;
        });
        if (used.every(function (n) { return n === 3; })) {
          done = true;
          eng.lock();
          msg.className = 'eg-banner eg-banner-good';
          msg.textContent = '';
          msg.appendChild(el('div', null, '12 ÷ 3 = ' + used.length));
          msg.appendChild(el('div', { class: 'eg-banner-sub' }, '3 + 3 + 3 + 3 = 12, so we need ' + used.length + ' plates.'));
          api.say('12 ÷ 3 = 4. Four groups of 3!', 'cheer');
          api.feedback('Division asks: how many groups?', 'good');
          api.unlockNext();
        } else {
          msg.className = 'eg-banner eg-banner-try';
          msg.textContent = 'Some plates have fewer than 3: ' + used.join(', ');
          api.say('Every plate needs 3. Move some apples.', 'oops');
        }
      },
    });
    stage.appendChild(eng.el);
    stage.appendChild(msg);
  }

  /* ---------------------------------------------------------------- *
   * Register
   * ---------------------------------------------------------------- */
  MQ.register(ID, {
    learn: [learnSame, learnJumps, learnTimes, learnDivide],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        stage.classList.add('eg-stage');
        if (q.type === 'count') renderCount(stage, api, q);
        else if (q.type === 'make') renderMake(stage, api, q);
        else if (q.type === 'write') renderWrite(stage, api, q);
        else if (q.type === 'divide') renderDivide(stage, api, q);
        else renderTimes(stage, api, q);
      },
    },
  });

  MQ._test = MQ._test || {};
  MQ._test[ID] = {
    buildDeck: buildDeck,
    deck: function () {
      return deck;
    },
  };

  var css = [
    '.eg-stage{gap:10px}',
    '.eg-pic{width:100%;display:flex;justify-content:center}',
    '.eg-svg{display:block;max-width:100%;height:auto;user-select:none;-webkit-user-select:none}',
    '.eg-groups{max-height:300px}',
    '.eg-card{fill:#ffffff;stroke:#dbe3f3;stroke-width:2;transition:fill .2s,stroke .2s}',
    '.eg-click{cursor:pointer}',
    '.eg-click:hover .eg-card{stroke:var(--accent)}',
    '.eg-lit .eg-card{fill:#fff6d6;stroke:#ffb703;stroke-width:3}',
    '.eg-seg.eg-lit .eg-segrect{stroke:#ffb703;stroke-width:4}',
    '.eg-pill{font-size:19px;font-weight:800;fill:#c2410c}',
    '.eg-zero{fill:#4a5a7d}',
    '.eg-seglab{font-size:20px;font-weight:800;fill:#1b2a4a;pointer-events:none}',
    '.eg-boxlab{font-size:12px;font-weight:800;fill:#7a4f12;letter-spacing:1px}',
    '.eg-ten{font-size:22px;font-weight:800;fill:#5a3a0a}',
    '.eg-help{margin:-4px 0 0;color:var(--ink-soft);font-weight:700}',
    '.eg-nl-axis{stroke:#1b2a4a;stroke-width:3}',
    '.eg-nl-minor{stroke:#9fb3d9;stroke-width:1.5}',
    '.eg-nl-tick{stroke:#1b2a4a;stroke-width:2.5}',
    '.eg-nl-num{font-size:17px;font-weight:700;fill:#4a5a7d}',
    '.eg-nl-hit{fill:#c2410c;font-weight:800}',
    '.eg-nl-jump{fill:none;stroke:#c2410c;stroke-width:3.5;stroke-linecap:round}',
    '.eg-nl-plus{font-size:16px;font-weight:800;fill:#c2410c}',
    '.eg-eq{display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:wrap;font-size:1.5rem;font-weight:800}',
    '.eg-eq-add{gap:5px}',
    '.eg-op{font-size:1.5rem;font-weight:800;color:var(--ink)}',
    '.eg-gap{width:18px}',
    '.eg-col{display:flex;flex-direction:column;align-items:center;gap:2px}',
    '.eg-lab{font-size:.78rem;font-weight:800;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.3px;white-space:nowrap}',
    '.eg-box{width:58px;height:54px;font:inherit;font-size:1.5rem;font-weight:800;text-align:center;border:3px solid var(--line);border-radius:12px;background:#fff;color:var(--ink)}',
    '.eg-box-wide{width:84px}',
    '.eg-box:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px rgba(46,196,182,.25)}',
    '.eg-box.good{border-color:var(--good);background:var(--good-bg);color:var(--good)}',
    '.eg-box.bad{border-color:var(--try);background:var(--try-bg)}',
    '.eg-box:disabled{opacity:1}',
    '.eg-check{background:var(--accent);margin-left:6px}',
    '.eg-fill{background:#f4a261;color:#2b1d00}',
    '.eg-jump{background:#f4a261;color:#2b1d00}',
    '.eg-work{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.eg-work:empty{display:none}',
    '.eg-ask{font-size:1.2rem;font-weight:800;text-align:center}',
    '.eg-choices{max-width:520px}',
    '.eg-hold{width:100%;display:flex;justify-content:center}',
    '.eg-fact{display:flex;align-items:flex-start;justify-content:center;gap:12px;flex-wrap:wrap}',
    '.eg-fact-small{font-size:1.4rem;font-weight:800;color:#0b6e66}',
    '.eg-big{font-size:2.2rem;font-weight:800;line-height:1.2;min-width:1.2em;text-align:center}',
    '.eg-fact .eg-op{font-size:2.2rem;line-height:1.2}',
    '.eg-total{color:#0b6e66}',
    '.eg-slot{display:inline-block;min-width:64px;padding:2px 10px;font-size:2.2rem;font-weight:800;line-height:1.2;text-align:center;border:3px dashed var(--line);border-radius:12px;color:var(--ink-soft)}',
    '.eg-slot-on{border:3px solid var(--good);background:var(--good-bg);color:var(--good)}',
    '.eg-sum .chip{font-size:1.2rem}',
    '.eg-sum-build{min-height:48px}',
    '.eg-times-note{font-size:1rem;color:var(--ink-soft);margin-left:4px}',
    '.eg-banner{font-size:1.3rem;font-weight:800;text-align:center;padding:6px 16px;border-radius:14px;min-height:44px;color:var(--ink-soft)}',
    '.eg-banner-good{background:var(--good-bg);color:var(--good)}',
    '.eg-banner-try{background:var(--try-bg);color:var(--try)}',
    '.eg-banner-sub{font-size:1rem;font-weight:700}',
    '.eg-bowl{fill:#e0f2fe;stroke:#5fa8d3;stroke-width:3}',
    '.eg-tray{fill:#f1f5fb;stroke:#9fb3d9;stroke-width:3}',
    '.eg-placeholder{font-size:20px;font-weight:700;fill:#b8c4e3}',
    '.eg-pilelab{font-size:18px;font-weight:800;fill:#4a5a7d}',
    '.eg-plate{cursor:pointer}',
    '.eg-plate-rim{fill:#ffffff;stroke:#9fb3d9;stroke-width:3}',
    '.eg-plate-in{fill:none;stroke:#dbe6ff;stroke-width:2}',
    '.eg-plate:hover .eg-plate-rim{stroke:var(--accent)}',
    '.eg-plate-count{font-size:22px;font-weight:800;fill:#4a5a7d}',
    '.eg-item{cursor:grab;transition:transform .3s ease}',
    '.eg-item.dragging{transition:none;cursor:grabbing}',
    '.eg-locked .eg-item,.eg-locked .eg-plate{cursor:default}',
    '.eg-divide .eg-item{cursor:default}',
    '@media (max-width:640px){.eg-box{width:48px;height:48px;font-size:1.3rem}.eg-box-wide{width:70px}.eg-eq,.eg-op{font-size:1.25rem}.eg-big,.eg-slot,.eg-fact .eg-op{font-size:1.7rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

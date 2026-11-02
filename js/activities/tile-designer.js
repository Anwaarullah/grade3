/* Tile Designer — read and make square tile designs that show a fraction (Unit 7.1,
 * Textbook p.122–123 Think like a mathematician: Designing tiles). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var S = 400; // tile side in SVG units
  var H = S / 2;
  var SHADE = '#2ec4b6';

  /* ---------------- geometry ---------------- */

  function P(x, y) {
    return [x, y];
  }
  function rect(x, y, w, h) {
    return [P(x, y), P(x + w, y), P(x + w, y + h), P(x, y + h)];
  }
  function area(poly) {
    var a = 0;
    for (var i = 0; i < poly.length; i++) {
      var p = poly[i];
      var q = poly[(i + 1) % poly.length];
      a += p[0] * q[1] - q[0] * p[1];
    }
    return Math.abs(a) / 2;
  }
  function centroid(poly) {
    var x = 0;
    var y = 0;
    poly.forEach(function (p) {
      x += p[0];
      y += p[1];
    });
    return [x / poly.length, y / poly.length];
  }

  var C = P(H, H);
  var TL = P(0, 0);
  var TR = P(S, 0);
  var BR = P(S, S);
  var BL = P(0, S);
  var MT = P(H, 0);
  var MR = P(S, H);
  var MB = P(H, S);
  var ML = P(0, H);

  // The 16 small triangles made by all the dotted guide lines (diagonals, middle lines, diamond).
  function atoms() {
    var out = [];
    [0, 1].forEach(function (qy) {
      [0, 1].forEach(function (qx) {
        var a = P(qx * H, qy * H);
        var b = P((qx + 1) * H, qy * H);
        var c = P((qx + 1) * H, (qy + 1) * H);
        var d = P(qx * H, (qy + 1) * H);
        var m = P(qx * H + H / 2, qy * H + H / 2);
        out.push([a, b, m], [b, c, m], [c, d, m], [d, a, m]);
      });
    });
    return out;
  }

  // Tile cuts. equal:false ones are only used for "Is Bolt right?".
  var CUTS = {
    halvesV: { name: 'halves', pieces: [rect(0, 0, H, S), rect(H, 0, H, S)] },
    halvesH: { name: 'halves', pieces: [rect(0, 0, S, H), rect(0, H, S, H)] },
    halvesD: { name: 'halves', pieces: [[TL, TR, BR], [TL, BR, BL]] },
    quartersGrid: { name: 'quarters', pieces: [rect(0, 0, H, H), rect(H, 0, H, H), rect(H, H, H, H), rect(0, H, H, H)] },
    quartersX: { name: 'quarters', pieces: [[TL, TR, C], [TR, BR, C], [BR, BL, C], [BL, TL, C]] },
    eighths: { name: 'eighths', pieces: [[TL, MT, C], [MT, TR, C], [TR, MR, C], [MR, BR, C], [BR, MB, C], [MB, BL, C], [BL, ML, C], [ML, TL, C]] },
    thirdsV: { name: 'thirds', pieces: [rect(0, 0, S / 3, S), rect(S / 3, 0, S / 3, S), rect((2 * S) / 3, 0, S / 3, S)] },
    thirdsH: { name: 'thirds', pieces: [rect(0, 0, S, S / 3), rect(0, S / 3, S, S / 3), rect(0, (2 * S) / 3, S, S / 3)] },
    tenths: {
      name: 'tenths',
      pieces: U.range(0, 9).map(function (i) {
        return rect((i % 5) * (S / 5), Math.floor(i / 5) * H, S / 5, H);
      }),
    },
    sixteenths: { name: 'sixteenths', pieces: atoms() },
    // unequal cuts
    halfAndQuarters: { equal: false, pieces: [rect(0, 0, H, S), rect(H, 0, H, H), rect(H, H, H, H)] },
    unevenStrips: { equal: false, pieces: [rect(0, 0, S / 4, S), rect(S / 4, 0, S / 4, S), rect(H, 0, H, S)] },
    diamondCorners: { equal: false, pieces: [[MT, MR, MB, ML], [TL, MT, ML], [MT, TR, MR], [MR, BR, MB], [MB, BL, ML]] },
  };

  /* ---------------- drawing ---------------- */

  function fracHtml(n, d, cls) {
    return '<span class="td-frac' + (cls ? ' ' + cls : '') + '"><span>' + n + '</span><span>' + d + '</span></span>';
  }
  function fracEl(n, d, cls) {
    return el('span', { html: fracHtml(n, d, cls) });
  }

  /**
   * A square tile made of pieces. opts: { size, guides (draw dotted guide lines), onClick(i) }
   * Returns { svg, shaded[], set(i, on), label(i, text), clearLabels(), over (overlay <g>) }
   */
  function tile(pieces, opts) {
    opts = opts || {};
    var root = svg('svg', { viewBox: '-8 -8 ' + (S + 16) + ' ' + (S + 16), class: 'td-tile' + (opts.onClick ? ' td-click' : '') });
    root.style.width = (opts.size || 340) + 'px';
    root.appendChild(svg('rect', { x: -6, y: -6, width: S + 12, height: S + 12, rx: 10, fill: '#f4efe6', stroke: '#c9bba3', 'stroke-width': 4 }));
    var polys = [];
    var shaded = pieces.map(function () {
      return false;
    });
    var gPieces = svg('g');
    pieces.forEach(function (poly, i) {
      var pg = svg('polygon', {
        points: poly
          .map(function (p) {
            return p[0] + ',' + p[1];
          })
          .join(' '),
        fill: '#fff',
        stroke: '#33415c',
        'stroke-width': 4,
        'stroke-linejoin': 'round',
        class: 'td-piece',
        'data-i': i,
      });
      if (opts.onClick) {
        pg.addEventListener('click', function () {
          opts.onClick(i);
        });
      }
      polys.push(pg);
      gPieces.appendChild(pg);
    });
    root.appendChild(gPieces);
    var over = svg('g', { 'pointer-events': 'none' });
    var labels = svg('g', { 'pointer-events': 'none' });
    root.appendChild(over);
    root.appendChild(labels);
    var t = {
      svg: root,
      shaded: shaded,
      polys: polys,
      over: over,
      set: function (i, on) {
        shaded[i] = !!on;
        polys[i].setAttribute('fill', on ? SHADE : '#fff');
        polys[i].classList.toggle('td-on', !!on);
      },
      count: function () {
        return shaded.filter(Boolean).length;
      },
      label: function (i, text, color) {
        var c = centroid(pieces[i]);
        var small = area(pieces[i]) < 6000;
        labels.appendChild(svg('circle', { cx: c[0], cy: c[1], r: small ? 15 : 22, fill: '#fff', stroke: color || '#33415c', 'stroke-width': 3 }));
        labels.appendChild(
          svg('text', { x: c[0], y: c[1] + (small ? 7 : 9), 'text-anchor': 'middle', 'font-size': small ? 20 : 26, 'font-weight': 800, fill: color || '#33415c' }, String(text))
        );
      },
      clearLabels: function () {
        MQ.clear(labels);
      },
    };
    return t;
  }

  function dashLine(g, a, b, color) {
    g.appendChild(svg('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: color || '#e4572e', 'stroke-width': 5, 'stroke-dasharray': '14 10', 'stroke-linecap': 'round' }));
  }

  /* ---------------- answer options ---------------- */

  // Options for "what fraction is (not) shaded": k of n is right.
  function fracOptions(k, n) {
    var val = k / n;
    var seen = {};
    var out = [];
    function add(a, b, mistake) {
      if (b <= 0 || a <= 0) return;
      var key = a + '/' + b;
      if (seen[key]) return;
      if (out.length && Math.abs(a / b - val) < 1e-9) return; // no second option equal to the answer
      seen[key] = true;
      out.push({ n: a, d: b, mistake: mistake });
    }
    add(k, n, null);
    add(n - k, n, 'Named the other part (shaded and not shaded mixed up)');
    add(k, n - k, 'Bottom number was the other part, not all the pieces');
    add(n, k, 'Swapped the top and bottom numbers');
    add(k + 1, n, 'Miscounted the pieces');
    add(k, n + 1, 'Miscounted the pieces');
    return out.slice(0, 4);
  }

  function fracChoices(opts, onPick) {
    var ch = MQ.ui.choices(
      U.shuffle(opts).map(function (o) {
        return { label: fracHtml(o.n, o.d), value: o.n + '/' + o.d };
      }),
      function (v) {
        var o = opts.filter(function (x) {
          return x.n + '/' + x.d === v;
        })[0];
        onPick(o, v);
      },
      { columns: opts.length }
    );
    ch.classList.add('td-choices');
    return ch;
  }

  /* ---------------- deck ---------------- */

  function pickN(arr, n) {
    return U.shuffle(arr).slice(0, n);
  }

  var deck = null;

  function buildDeck() {
    var q = [];
    // Level 1: read Bolt's tiles (halves and quarters)
    var half = U.pick(['halvesV', 'halvesH', 'halvesD']);
    q.push({ type: 'read', cut: half, shaded: [U.rand(0, 1)], ask: 'shaded' });
    var quarterCuts = U.shuffle(['quartersGrid', 'quartersX']);
    q.push({ type: 'read', cut: quarterCuts[0], shaded: pickN([0, 1, 2, 3], 3), ask: 'not' });
    q.push({ type: 'read', cut: quarterCuts[1], shaded: U.pick([[0, 2], [1, 3], [0, 1], [2, 3]]), ask: 'shaded', equiv: true });
    // Level 2: make a tile
    var qc2 = U.shuffle(['quartersGrid', 'quartersX']);
    q.push({ type: 'make', cut: qc2[0], k: 1 });
    q.push({ type: 'make', cut: qc2[1], k: 3 });
    var boltHalf = U.pick([[0, 1, 2, 3], [2, 3, 4, 5], [0, 2, 4, 6], [1, 2, 5, 6]]);
    q.push({ type: 'make', cut: 'eighths', k: 4, different: boltHalf });
    // Level 3: thirds and tenths with the unshaded part, then check Bolt
    q.push({ type: 'make', cut: U.pick(['thirdsV', 'thirdsH']), k: 2, thenNot: true });
    q.push({ type: 'make', cut: 'tenths', k: U.pick([3, 4]), thenNot: true });
    q.push(
      U.pick([
        { type: 'judge', cut: 'halfAndQuarters', shaded: [U.pick([1, 2])], claim: [1, 3], right: false, truth: [1, 4] },
        { type: 'judge', cut: 'unevenStrips', shaded: [U.pick([0, 1])], claim: [1, 3], right: false, truth: [1, 4] },
        { type: 'judge', cut: 'diamondCorners', shaded: [U.rand(1, 4)], claim: [1, 5], right: false, truth: [1, 8] },
        { type: 'judge', cut: U.pick(['thirdsV', 'thirdsH']), shaded: [U.rand(0, 2)], claim: [1, 3], right: true, truth: [1, 3] },
        { type: 'judge', cut: 'eighths', shaded: U.pick([[0, 4], [2, 6], [1, 5]]), claim: [2, 8], right: true, truth: [2, 8] },
      ])
    );
    return q;
  }

  /* ---------------- learn screens ---------------- */

  function learnRead(stage, api) {
    api.say('Here is a tile. Click each piece to count the pieces.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Read a tile', 'The tile is cut into <b>equal</b> pieces. Click every piece to count them.'));
    var counted = [];
    var shaded = [1, 3];
    var row = el('div', { class: 'td-row' });
    var out = el('div', { class: 'td-side' });
    var t = tile(CUTS.quartersX.pieces, {
      size: 300,
      onClick: function (i) {
        if (counted.indexOf(i) !== -1) return;
        counted.push(i);
        api.sound('pop');
        t.label(i, counted.length);
        if (counted.length === 4) done();
      },
    });
    shaded.forEach(function (i) {
      t.set(i, true);
    });
    row.appendChild(t.svg);
    row.appendChild(out);
    stage.appendChild(row);
    out.appendChild(el('div', { class: 'td-note' }, 'Pieces counted: ', el('b', { class: 'td-count' }, '0')));
    t.svg.addEventListener('click', function () {
      var ce = out.querySelector('.td-count');
      if (ce) ce.textContent = counted.length;
    });
    function done() {
      MQ.clear(out);
      out.appendChild(el('div', { class: 'td-line' }, el('span', { class: 'td-sw td-sw-on' }), ' shaded: 2 of 4 = ', fracEl(2, 4), ' = ', fracEl(1, 2)));
      out.appendChild(el('div', { class: 'td-line' }, el('span', { class: 'td-sw' }), ' not shaded: 2 of 4 = ', fracEl(2, 4), ' = ', fracEl(1, 2)));
      api.say('4 equal pieces, 2 shaded. That is 2/4, the same as one half!', 'cheer');
      api.feedback('The bottom number is how many equal pieces. The top number is how many we mean.', 'good');
      api.unlockNext();
    }
  }

  function learnCut(stage, api) {
    api.say('Click a dotted line to cut along it. Can you make 2, 4 and 8 equal pieces?');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Fold lines', 'Click dotted lines to cut. Click again to undo a cut.'));
    var A = atoms();
    var LINES = {
      V: [[MT, MB]],
      H: [[ML, MR]],
      D1: [[TL, BR]],
      D2: [[TR, BL]],
      Dm: [[MT, MR], [MR, MB], [MB, ML], [ML, MT]],
    };
    function on(p, f) {
      return Math.abs(f(p)) < 1e-6;
    }
    function edgeLine(p, q) {
      if (p[0] === H && q[0] === H) return 'V';
      if (p[1] === H && q[1] === H) return 'H';
      var d1 = function (r) {
        return r[0] - r[1];
      };
      var d2 = function (r) {
        return r[0] + r[1] - S;
      };
      var dm = function (r) {
        return Math.abs(r[0] - H) + Math.abs(r[1] - H) - H;
      };
      if (on(p, d1) && on(q, d1)) return 'D1';
      if (on(p, d2) && on(q, d2)) return 'D2';
      if (on(p, dm) && on(q, dm)) return 'Dm';
      return 'edge';
    }
    // shared edges between atoms
    var links = [];
    var map = {};
    A.forEach(function (tri, i) {
      for (var e = 0; e < 3; e++) {
        var p = tri[e];
        var q = tri[(e + 1) % 3];
        var key = [p.join(','), q.join(',')].sort().join('|');
        if (map[key] !== undefined) links.push({ a: map[key], b: i, line: edgeLine(p, q) });
        else map[key] = i;
      }
    });
    var cut = {};
    var seen = {};
    var PALE = ['#ffe1a8', '#cde7ff', '#d8f3dc', '#ffd6e0', '#e9d8fd', '#fff3b0', '#c8f1ec', '#ffd8be'];

    var root = svg('svg', { viewBox: '-14 -14 ' + (S + 28) + ' ' + (S + 28), class: 'td-tile td-cutter' });
    root.style.width = '340px';
    root.appendChild(svg('rect', { x: -10, y: -10, width: S + 20, height: S + 20, rx: 12, fill: '#f4efe6', stroke: '#c9bba3', 'stroke-width': 4 }));
    var gA = svg('g');
    var polys = A.map(function (tri) {
      var pg = svg('polygon', {
        points: tri
          .map(function (p) {
            return p.join(',');
          })
          .join(' '),
        fill: '#fff',
        stroke: 'none',
      });
      gA.appendChild(pg);
      return pg;
    });
    root.appendChild(gA);
    root.appendChild(svg('rect', { x: 0, y: 0, width: S, height: S, fill: 'none', stroke: '#33415c', 'stroke-width': 5 }));
    var lineEls = {};
    Object.keys(LINES).forEach(function (k) {
      var g = svg('g', { class: 'td-cutline', 'data-line': k });
      LINES[k].forEach(function (seg) {
        g.appendChild(svg('line', { x1: seg[0][0], y1: seg[0][1], x2: seg[1][0], y2: seg[1][1], class: 'td-vis', stroke: '#8a94a6', 'stroke-width': 4, 'stroke-dasharray': '10 9', 'stroke-linecap': 'round' }));
        g.appendChild(svg('line', { x1: seg[0][0], y1: seg[0][1], x2: seg[1][0], y2: seg[1][1], stroke: 'transparent', 'stroke-width': 30, class: 'td-hit' }));
      });
      g.addEventListener('click', function () {
        cut[k] = !cut[k];
        api.sound('click');
        update();
      });
      lineEls[k] = g;
      root.appendChild(g);
    });

    var info = el('div', { class: 'td-side' });
    var status = el('div', { class: 'td-status' });
    var goals = el('div', { class: 'td-goals' });
    info.appendChild(status);
    info.appendChild(goals);
    var row = el('div', { class: 'td-row' }, root, info);
    stage.appendChild(row);

    function update() {
      var parent = A.map(function (_, i) {
        return i;
      });
      function find(i) {
        while (parent[i] !== i) i = parent[i] = parent[parent[i]];
        return i;
      }
      links.forEach(function (l) {
        if (!cut[l.line]) parent[find(l.a)] = find(l.b);
      });
      var comp = {};
      var order = [];
      A.forEach(function (_, i) {
        var r = find(i);
        if (!comp[r]) {
          comp[r] = [];
          order.push(r);
        }
        comp[r].push(i);
      });
      order.forEach(function (r, ci) {
        comp[r].forEach(function (i) {
          polys[i].setAttribute('fill', PALE[ci % PALE.length]);
        });
      });
      var sizes = order.map(function (r) {
        return comp[r].length;
      });
      var equal = sizes.every(function (s) {
        return s === sizes[0];
      });
      Object.keys(lineEls).forEach(function (k) {
        var vis = lineEls[k].querySelectorAll('.td-vis');
        Array.prototype.forEach.call(vis, function (v) {
          v.setAttribute('stroke', cut[k] ? '#33415c' : '#8a94a6');
          v.setAttribute('stroke-width', cut[k] ? 5 : 4);
          v.setAttribute('stroke-dasharray', cut[k] ? 'none' : '10 9');
        });
      });
      var n = order.length;
      MQ.clear(status);
      if (n === 1) {
        status.appendChild(el('div', { class: 'td-big' }, '1 whole tile'));
      } else {
        status.appendChild(el('div', { class: 'td-big' }, n + ' pieces'));
        status.appendChild(el('div', { class: equal ? 'td-ok' : 'td-bad' }, equal ? '✓ all the same size' : '✗ not all the same size'));
        if (equal) seen[n] = true;
      }
      MQ.clear(goals);
      [2, 4, 8].forEach(function (g) {
        goals.appendChild(el('span', { class: 'chip td-goal' + (seen[g] ? ' td-goal-done' : '') }, (seen[g] ? '✓ ' : '') + g + ' equal pieces'));
      });
      if (n > 1 && !equal) {
        api.say('Careful! Those pieces are different sizes. We cannot name a fraction with them.', 'oops');
      } else if (seen[2] && seen[4] && seen[8]) {
        api.say('Brilliant! Every cut makes equal pieces you can name: halves, quarters, eighths.', 'cheer');
        api.feedback('Equal pieces only! Try all the lines for 16 tiny pieces.', 'good');
        api.unlockNext();
      } else if (n > 1) {
        api.say(n + ' equal pieces. Keep cutting!', 'happy');
      }
    }
    update();
  }

  function learnMany(stage, api) {
    api.say('Bolt coloured half of each tile. Click each tile to check.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Many designs, one fraction', 'Click a tile to count its pieces.'));
    var designs = [
      { cut: 'halvesD', shaded: [0] },
      { cut: 'quartersGrid', shaded: [0, 2] },
      { cut: 'sixteenths', shaded: [0, 2, 5, 7, 8, 10, 13, 15] },
    ];
    var checked = 0;
    var row = el('div', { class: 'td-three' });
    designs.forEach(function (d) {
      var pieces = CUTS[d.cut].pieces;
      var done = false;
      var cap = el('div', { class: 'td-cap' }, 'Click me');
      var t = tile(pieces, {
        size: 220,
        onClick: function () {
          if (done) return;
          done = true;
          checked++;
          api.sound('pop');
          var k = 0;
          d.shaded.forEach(function (i) {
            t.label(i, ++k);
          });
          cap.innerHTML = d.shaded.length + ' of ' + pieces.length + ' = ' + fracHtml(d.shaded.length, pieces.length) + ' = ' + fracHtml(1, 2);
          if (checked === designs.length) {
            api.say('Three different designs. Every one is one half!', 'cheer');
            api.feedback('Half the pieces shaded means half the tile, whatever the pattern.', 'good');
            api.unlockNext();
          }
        },
      });
      d.shaded.forEach(function (i) {
        t.set(i, true);
      });
      row.appendChild(el('div', { class: 'td-card' }, t.svg, cap));
    });
    stage.appendChild(row);
  }

  /* ---------------- practice ---------------- */

  function renderRead(stage, api, q) {
    var pieces = CUTS[q.cut].pieces;
    var n = pieces.length;
    var k = q.ask === 'shaded' ? q.shaded.length : n - q.shaded.length;
    var word = q.ask === 'shaded' ? 'shaded' : '<b>not</b> shaded';
    api.say(q.ask === 'shaded' ? 'What fraction of the tile is shaded?' : 'What fraction of the tile is NOT shaded?', 'think');
    stage.appendChild(MQ.ui.prompt('What fraction of this tile is ' + word + '?'));
    var t = tile(pieces, { size: 280 });
    q.shaded.forEach(function (i) {
      t.set(i, true);
    });
    stage.appendChild(el('div', { class: 'td-row' }, t.svg));
    stage.setAttribute('data-answer', k + '/' + n);
    var opts = fracOptions(k, n);
    var ch = fracChoices(opts, function (o, v) {
      if (o.n === k && o.d === n) {
        ch.mark(v, 'good');
        ch.disable();
        api.check(true, q.equiv ? k + ' of ' + n + ' pieces: ' + k + '/' + n + '. That is the same as one half!' : null);
      } else {
        ch.mark(v, 'bad');
        var hint;
        if (api.tries() >= 1) hint = 'Count all the pieces: there are ' + n + '. Now count the ' + (q.ask === 'shaded' ? 'coloured' : 'white') + ' ones. Put that number on top.';
        else if (o.mistake && o.mistake.indexOf('other part') !== -1) hint = q.ask === 'shaded' ? 'That is the white part. Count the coloured pieces.' : 'That is the coloured part. Count the white pieces.';
        else if (o.mistake && o.mistake.indexOf('other part, not all') !== -1) hint = 'The bottom number counts ALL the pieces, coloured and white.';
        else if (o.mistake && o.mistake.indexOf('Swapped') !== -1) hint = 'The number of pieces in the whole tile goes on the bottom.';
        else hint = 'Count the pieces again, touching each one.';
        api.check(false, hint, o.mistake || 'Miscounted the pieces');
      }
    });
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(k + '/' + n, 'good');
      ch.disable();
      var c = 0;
      pieces.forEach(function (_, i) {
        var isShaded = q.shaded.indexOf(i) !== -1;
        if ((q.ask === 'shaded') === isShaded) t.label(i, ++c, '#e4572e');
      });
      api.feedback(n + ' equal pieces. ' + k + ' ' + (q.ask === 'shaded' ? 'shaded' : 'not shaded') + '. So it is ' + k + '/' + n + '.', 'info');
    });
  }

  function renderMake(stage, api, q) {
    var pieces = CUTS[q.cut].pieces;
    var n = pieces.length;
    var k = q.k;
    var step = 1;
    stage.setAttribute('data-answer', k + '/' + n);
    if (q.different) stage.setAttribute('data-bolt', q.different.join(','));
    if (q.different) {
      api.say('Bolt shaded half like this. Make half in a different way!', 'think');
      stage.appendChild(MQ.ui.prompt('Shade ' + fracHtml(1, 2) + ' of your tile, but not like Bolt\'s.'));
    } else {
      api.say('Click pieces to shade ' + k + '/' + n + ' of the tile.', 'think');
      stage.appendChild(MQ.ui.prompt('Shade ' + fracHtml(k, n) + ' of the tile.'));
    }
    var t = tile(pieces, {
      size: 300,
      onClick: function (i) {
        if (step !== 1 || api.isAnswered()) return;
        t.set(i, !t.shaded[i]);
        api.sound('click');
        countEl.textContent = t.count();
      },
    });
    var countEl = el('b', null, '0');
    var row = el('div', { class: 'td-row' });
    if (q.different) {
      var bt = tile(pieces, { size: 170 });
      q.different.forEach(function (i) {
        bt.set(i, true);
      });
      row.appendChild(el('div', { class: 'td-card td-bolt' }, el('div', { class: 'td-cap' }, "Bolt's tile"), bt.svg));
    }
    row.appendChild(el('div', { class: 'td-card' }, t.svg, el('div', { class: 'td-cap' }, 'Shaded: ', countEl, ' of ' + n)));
    stage.appendChild(row);
    var area2 = el('div', { class: 'td-step2' });
    var checkBtn = el('button', { class: 'btn td-check', type: 'button' }, 'Check my tile');
    stage.appendChild(checkBtn);
    stage.appendChild(area2);

    function sameAsBolt() {
      if (!q.different) return false;
      for (var i = 0; i < n; i++) if (t.shaded[i] !== (q.different.indexOf(i) !== -1)) return false;
      return true;
    }

    checkBtn.addEventListener('click', function () {
      if (step !== 1 || api.isAnswered()) return;
      var c = t.count();
      if (c === 0) {
        api.feedback('Click some pieces to shade them first, then press Check.', 'info');
        return;
      }
      if (c === k && !sameAsBolt()) {
        if (q.thenNot) {
          step = 2;
          checkBtn.disabled = true;
          api.sound('correct');
          api.feedback('Yes! ' + k + ' of ' + n + ' pieces shaded is ' + k + '/' + n + '. Now the white part…', 'good');
          askNot();
        } else {
          checkBtn.disabled = true;
          api.check(true, q.different ? '4 of 8 pieces = 4/8 = one half. A new design!' : k + ' of ' + n + ' equal pieces: ' + k + '/' + n + '!');
        }
        return;
      }
      var hint;
      var tag;
      if (c === k && sameAsBolt()) {
        hint = 'That is exactly Bolt\'s design! Shade 4 pieces in a different pattern.';
        tag = 'Copied the example instead of a new design';
      } else if (c === n - k && c !== k) {
        hint = 'You shaded ' + c + '. That is how many should stay white. Shade ' + k + ' pieces.';
        tag = 'Shaded the part that should stay white';
      } else if (api.tries() >= 1) {
        hint = 'The top number says how many to shade: ' + k + '. You have ' + c + '. ' + (c > k ? 'Click ' + (c - k) + ' to make them white.' : 'Shade ' + (k - c) + ' more.');
        tag = 'Shaded the wrong number of pieces';
      } else {
        hint = 'You shaded ' + c + ' of ' + n + ' pieces. Look at the top number again.';
        tag = 'Shaded the wrong number of pieces';
      }
      api.check(false, hint, tag);
    });

    var notChoices = null;
    function askNot() {
      MQ.clear(area2);
      area2.appendChild(MQ.ui.prompt('What fraction is <b>not</b> shaded?'));
      var opts = fracOptions(n - k, n);
      notChoices = fracChoices(opts, function (o, v) {
        if (o.n === n - k && o.d === n) {
          notChoices.mark(v, 'good');
          notChoices.disable();
          api.check(true, k + '/' + n + ' shaded and ' + (n - k) + '/' + n + ' white. Together ' + n + '/' + n + ', the whole tile!');
        } else {
          notChoices.mark(v, 'bad');
          var hint = api.tries() >= 1 ? 'Count the white pieces: ' + (n - k) + '. The whole tile has ' + n + ' pieces.' : o.mistake && o.mistake.indexOf('other part') !== -1 ? 'That is the shaded part. Count the white pieces.' : 'The bottom number is all the pieces in the tile.';
          api.check(false, hint, o.mistake === 'Named the other part (shaded and not shaded mixed up)' ? 'Forgot to name the part not shaded' : o.mistake || 'Miscounted the pieces');
        }
      });
      area2.appendChild(notChoices);
    }

    api.onReveal(function () {
      checkBtn.disabled = true;
      var target;
      if (q.different) {
        target = U.shuffle([[0, 2, 4, 6], [1, 3, 5, 7], [0, 1, 2, 3], [4, 5, 6, 7], [2, 3, 4, 5], [6, 7, 0, 1], [0, 1, 4, 5]]).filter(function (s) {
          return s.join() !== q.different.slice().sort().join();
        })[0];
      } else {
        target = U.range(0, k - 1);
      }
      pieces.forEach(function (_, i) {
        t.set(i, target.indexOf(i) !== -1);
      });
      countEl.textContent = t.count();
      t.clearLabels();
      target.forEach(function (i, j) {
        t.label(i, j + 1, '#e4572e');
      });
      if (q.thenNot) {
        if (!notChoices) askNot();
        notChoices.mark(n - k + '/' + n, 'good');
        notChoices.disable();
        api.feedback(k + ' shaded of ' + n + ' = ' + k + '/' + n + '. ' + (n - k) + ' white of ' + n + ' = ' + (n - k) + '/' + n + '.', 'info');
      } else {
        api.feedback('Shade ' + k + ' of the ' + n + ' equal pieces: ' + k + '/' + n + (q.different ? ' = one half.' : '.'), 'info');
      }
    });
  }

  function renderJudge(stage, api, q) {
    var pieces = CUTS[q.cut].pieces;
    api.say('Bolt says this tile is ' + q.claim[0] + '/' + q.claim[1] + ' shaded. Is Bolt right?', 'think');
    stage.appendChild(MQ.ui.prompt('Bolt says: "My tile is ' + fracHtml(q.claim[0], q.claim[1]) + ' shaded." Is Bolt right?'));
    stage.setAttribute('data-answer', q.right ? 'yes' : 'no');
    var t = tile(pieces, { size: 280 });
    q.shaded.forEach(function (i) {
      t.set(i, true);
    });
    stage.appendChild(el('div', { class: 'td-row' }, t.svg));
    var ch = MQ.ui.choices(
      [
        { label: '✓ Yes, Bolt is right', value: 'yes' },
        { label: '✗ No, Bolt is wrong', value: 'no' },
      ],
      function (v) {
        if ((v === 'yes') === q.right) {
          ch.mark(v, 'good');
          ch.disable();
          showWhy();
          api.check(true, q.right ? 'Yes! The pieces are all equal, so ' + q.claim[0] + '/' + q.claim[1] + ' is right.' : 'Well checked! The pieces are not equal, so it is not ' + q.claim[0] + '/' + q.claim[1] + '.');
        } else {
          ch.mark(v, 'bad');
          var hint;
          if (q.right) hint = api.tries() >= 1 ? 'Count the pieces: ' + pieces.length + '. Are they all the same size? Yes! Count the shaded ones.' : 'Check: are all the pieces the same size?';
          else hint = api.tries() >= 1 ? 'Look closely: is the shaded piece as big as the others? Some pieces are bigger.' : 'Before naming a fraction, check: are all the pieces the same size?';
          api.check(false, hint, q.right ? 'Did not trust equal parts' : 'Named a fraction from unequal parts');
        }
      },
      { columns: 2 }
    );
    stage.appendChild(ch);
    var whyShown = false;
    function showWhy() {
      if (whyShown) return;
      whyShown = true;
      // dashed lines cut the tile into equal pieces the same size as the shaded one
      if (q.cut === 'halfAndQuarters') dashLine(t.over, ML, C);
      if (q.cut === 'unevenStrips') dashLine(t.over, P((3 * S) / 4, 0), P((3 * S) / 4, S));
      if (q.cut === 'diamondCorners') {
        dashLine(t.over, MT, MB);
        dashLine(t.over, ML, MR);
      }
      api.feedback(
        q.right
          ? pieces.length + ' equal pieces, ' + q.shaded.length + ' shaded: ' + q.claim[0] + '/' + q.claim[1] + '. Bolt is right.'
          : 'The red dashed lines cut the tile into ' + q.truth[1] + ' equal pieces. The shaded piece is 1 of them: ' + q.truth[0] + '/' + q.truth[1] + ', not ' + q.claim[0] + '/' + q.claim[1] + '.',
        'info'
      );
    }
    api.onReveal(function () {
      ch.mark(q.right ? 'yes' : 'no', 'good');
      ch.disable();
      showWhy();
    });
  }

  MQ.register('tile-designer', {
    learn: [learnRead, learnCut, learnMany],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        stage.setAttribute('data-td-type', q.type);
        stage.removeAttribute('data-bolt');
        api.cleanup(function () {
          ['data-td-type', 'data-answer', 'data-bolt'].forEach(function (a) {
            stage.removeAttribute(a);
          });
        });
        if (q.type === 'read') renderRead(stage, api, q);
        else if (q.type === 'make') renderMake(stage, api, q);
        else renderJudge(stage, api, q);
      },
    },
  });

  var css = [
    '.td-row{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:18px;width:100%}',
    '.td-tile{max-width:100%;height:auto;display:block;flex:0 1 auto}',
    '.td-click .td-piece{cursor:pointer}',
    '.td-click .td-piece:hover{fill-opacity:.85;stroke:#e4572e}',
    '.td-cutline{cursor:pointer}',
    '.td-cutline:hover .td-vis{stroke:#e4572e}',
    '.td-side{display:flex;flex-direction:column;gap:12px;align-items:flex-start;min-width:240px;font-size:1.25rem}',
    '.td-line{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-weight:700}',
    '.td-sw{display:inline-block;width:26px;height:26px;border:3px solid #33415c;border-radius:6px;background:#fff}',
    '.td-sw-on{background:' + SHADE + '}',
    '.td-note{font-size:1.2rem}',
    '.td-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;font-weight:800;margin:0 3px}',
    '.td-frac>span{padding:0 4px}',
    '.td-frac>span+span{border-top:3px solid currentColor}',
    '.td-choices .choice .td-frac{font-size:1.6rem}',
    '.td-big{font-size:1.8rem;font-weight:800}',
    '.td-ok{color:var(--good);font-weight:800;font-size:1.2rem}',
    '.td-bad{color:#c0392b;font-weight:800;font-size:1.2rem}',
    '.td-goals{display:flex;flex-wrap:wrap;gap:8px}',
    '.td-goal-done{background:var(--good-bg);color:var(--good)}',
    '.td-three{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;width:100%;max-width:780px}',
    '.td-card{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;max-width:320px}',
    '.td-bolt{max-width:190px;opacity:.95}',
    '.td-cap{font-size:1.15rem;font-weight:700;text-align:center;min-height:2.6em;display:flex;align-items:center;justify-content:center;gap:4px;flex-wrap:wrap}',
    '.td-check{margin-top:4px}',
    '.td-step2{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}',
    '@media (max-width:700px){.td-three{grid-template-columns:1fr 1fr}.td-side{min-width:0}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'tile-designer' }, css));
})();

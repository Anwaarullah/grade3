/* Compass Garden (Unit 15.1) — north, south, east and west in a garden; Bolt turns by right
 * angles; a turned compass where only one letter is given; two-clue position sentences on a
 * 3 by 3 picture grid.
 * Directions are numbers going clockwise: 0 = north (up), 1 = east, 2 = south, 3 = west.
 * Bolt's facing is in degrees clockwise from north (direction d = d × 90°).
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var LET = ['N', 'E', 'S', 'W'];
  var DN = ['north', 'east', 'south', 'west'];
  var CW = '↻';
  var ACW = '↺';

  function m4(n) {
    return ((n % 4) + 4) % 4;
  }
  function m360(d) {
    return ((Math.round(d) % 360) + 360) % 360;
  }
  function r2(n) {
    return Math.round(n * 100) / 100;
  }
  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function ease(p) {
    return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
  }
  function raText(n) {
    return n + ' right angle' + (n > 1 ? 's' : '');
  }
  function dirText(dir) {
    return dir > 0 ? 'clockwise ' + CW : 'anticlockwise ' + ACW;
  }
  function stepText(st) {
    return raText(st.n) + ' ' + dirText(st.dir);
  }
  /** "west → north → east" going round from `start` for n right angles. */
  function pathText(start, dir, n) {
    var out = [DN[m4(start)]];
    for (var k = 1; k <= n; k++) out.push(DN[m4(start + dir * k)]);
    return out.join(' → ');
  }
  function orderText(dir) {
    return dir > 0 ? 'N → E → S → W → N' : 'N → W → S → E → N';
  }
  /** Mistake tag when `picked` was chosen instead of `right` (both directions). */
  function dirTag(right, picked) {
    if (m4(right - picked) === 2) return right % 2 ? 'Swapped east and west' : 'Swapped north and south';
    return 'Mixed up the compass points';
  }

  /* ---------------------------------------------------------------- *
   * Garden places
   * ---------------------------------------------------------------- */

  var PLACES = [
    { k: 'shed', name: 'shed', icon: '🛖' },
    { k: 'pond', name: 'pond', draw: 'pond' },
    { k: 'gate', name: 'gate', draw: 'gate' },
    { k: 'house', name: 'house', icon: '🏠' },
    { k: 'tree', name: 'tree', icon: '🌳' },
    { k: 'bench', name: 'bench', draw: 'bench' },
    { k: 'swing', name: 'swing', draw: 'swing' },
    { k: 'flowers', name: 'flower bed', icon: '🌷' },
    { k: 'kennel', name: 'kennel', icon: '🐕' },
    { k: 'carrots', name: 'carrot patch', icon: '🥕' },
    { k: 'birds', name: 'bird table', icon: '🐦' },
  ];
  function placeByKey(k) {
    return PLACES.filter(function (p) {
      return p.k === k;
    })[0];
  }
  var LEARN_PLACES = [placeByKey('shed'), placeByKey('gate'), placeByKey('pond'), placeByKey('house')];

  /** Icon for a place, centred on (x, y), about s units tall. */
  function placeIcon(p, x, y, s) {
    if (p.icon) {
      return svg('text', { x: x, y: y, 'font-size': s, 'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'cgd-emoji' }, p.icon);
    }
    var g = svg('g', { transform: 'translate(' + x + ',' + y + ') scale(' + r2(s / 40) + ')' });
    if (p.draw === 'pond') {
      g.appendChild(svg('ellipse', { cx: 0, cy: 3, rx: 20, ry: 12, fill: '#8fd0f5', stroke: '#2b7bb9', 'stroke-width': 2.5 }));
      g.appendChild(svg('path', { d: 'M-10,2 q4,-3 8,0 M2,7 q4,-3 8,0', fill: 'none', stroke: '#2b7bb9', 'stroke-width': 1.6 }));
      g.appendChild(svg('path', { d: 'M15,-6 v-12 M18,-5 v-9', stroke: '#3c8d3c', 'stroke-width': 2.2, 'stroke-linecap': 'round' }));
    } else if (p.draw === 'gate') {
      g.appendChild(svg('rect', { x: -20, y: -16, width: 6, height: 34, rx: 1.5, fill: '#7a4d22' }));
      g.appendChild(svg('rect', { x: 14, y: -16, width: 6, height: 34, rx: 1.5, fill: '#7a4d22' }));
      for (var i = 0; i < 5; i++) g.appendChild(svg('rect', { x: -12 + i * 5.4, y: -11, width: 3.6, height: 26, fill: '#c68b4e' }));
      g.appendChild(svg('rect', { x: -14, y: -6, width: 28, height: 4, fill: '#a86d33' }));
      g.appendChild(svg('rect', { x: -14, y: 7, width: 28, height: 4, fill: '#a86d33' }));
    } else if (p.draw === 'bench') {
      g.appendChild(svg('rect', { x: -20, y: -13, width: 40, height: 6, rx: 2, fill: '#b07a45' }));
      g.appendChild(svg('rect', { x: -15, y: -8, width: 3, height: 9, fill: '#7a4d22' }));
      g.appendChild(svg('rect', { x: 12, y: -8, width: 3, height: 9, fill: '#7a4d22' }));
      g.appendChild(svg('rect', { x: -21, y: 0, width: 42, height: 6, rx: 2, fill: '#c68b4e' }));
      g.appendChild(svg('rect', { x: -17, y: 6, width: 4, height: 11, fill: '#5d6b7a' }));
      g.appendChild(svg('rect', { x: 13, y: 6, width: 4, height: 11, fill: '#5d6b7a' }));
    } else if (p.draw === 'swing') {
      g.appendChild(svg('path', { d: 'M-20,18 L-13,-16 M20,18 L13,-16 M-15,-16 H15', stroke: '#5d6b7a', 'stroke-width': 4, 'stroke-linecap': 'round', fill: 'none' }));
      g.appendChild(svg('path', { d: 'M-6,-15 V7 M6,-15 V7', stroke: '#7a4d22', 'stroke-width': 2 }));
      g.appendChild(svg('rect', { x: -10, y: 6, width: 20, height: 5, rx: 2, fill: '#e76f51' }));
    }
    return g;
  }

  /* ---------------------------------------------------------------- *
   * Garden with Bolt in the middle
   * ---------------------------------------------------------------- */

  var C = 210; // centre (viewBox 0 0 420 420)
  var R_CARD = 152;
  var R_LET = 90;
  var R_SEC = 64;
  var R_BADGE = 45;

  function pt(deg, r) {
    var a = (deg * Math.PI) / 180;
    return { x: r2(C + r * Math.sin(a)), y: r2(C - r * Math.cos(a)) };
  }
  function sectorPath(start, s) {
    if (Math.abs(s) < 0.5) return '';
    if (Math.abs(s) >= 359.5) {
      return 'M' + (C - R_SEC) + ',' + C + ' a' + R_SEC + ',' + R_SEC + ' 0 1 0 ' + 2 * R_SEC + ',0 a' + R_SEC + ',' + R_SEC + ' 0 1 0 ' + -2 * R_SEC + ',0Z';
    }
    var a = pt(start, R_SEC);
    var b = pt(start + s, R_SEC);
    return 'M' + C + ',' + C + ' L' + a.x + ',' + a.y + ' A' + R_SEC + ',' + R_SEC + ' 0 ' + (Math.abs(s) > 180 ? 1 : 0) + ' ' + (s > 0 ? 1 : 0) + ' ' + b.x + ',' + b.y + ' Z';
  }

  function makeGarden(api, places, opts) {
    opts = opts || {};
    var root = svg('svg', { viewBox: '0 0 420 420', class: 'cgd-garden' + (opts.small ? ' cgd-garden-sm' : ''), role: 'img', 'aria-label': 'A garden with Bolt the robot in the middle' });
    root.appendChild(svg('rect', { x: 2, y: 2, width: 416, height: 416, rx: 26, class: 'cgd-lawn' }));
    var paths = [
      svg('rect', { x: C - 13, y: 94, width: 26, height: C - 94, class: 'cgd-path' }),
      svg('rect', { x: C, y: C - 13, width: 310 - C, height: 26, class: 'cgd-path' }),
      svg('rect', { x: C - 13, y: C, width: 26, height: 326 - C, class: 'cgd-path' }),
      svg('rect', { x: 110, y: C - 13, width: C - 110, height: 26, class: 'cgd-path' }),
    ];
    paths.forEach(function (p) {
      root.appendChild(p);
    });
    var cards = [];
    var placePicker = null;
    var dirPicker = null;
    var locked = false;
    var busy = false;
    [0, 1, 2, 3].forEach(function (d) {
      var c = pt(d * 90, R_CARD);
      var g = svg('g', { class: 'cgd-place', 'data-dir': LET[d] });
      g.appendChild(svg('rect', { x: c.x - 52, y: c.y - 42, width: 104, height: 84, rx: 14, class: 'cgd-card' }));
      g.appendChild(placeIcon(places[d], c.x, c.y - 10, 38));
      g.appendChild(svg('text', { x: c.x, y: c.y + 28, class: 'cgd-plabel' }, places[d].name));
      g.addEventListener('click', function () {
        if (!placePicker || locked || busy) return;
        placePicker(d);
      });
      cards.push(g);
      root.appendChild(g);
    });
    var secLayer = svg('g');
    var ghost = svg('g', { class: 'cgd-ghost' });
    ghost.appendChild(svg('line', { x1: C, y1: C, x2: C, y2: C - 44 }));
    ghost.appendChild(svg('polygon', { points: [C, C - 60, C - 11, C - 40, C + 11, C - 40].join(' ') }));
    ghost.style.display = 'none';
    var bolt = svg('g', { class: 'cgd-bolt' });
    bolt.appendChild(svg('rect', { x: C - 9, y: C - 42, width: 18, height: 16, class: 'cgd-nose' }));
    bolt.appendChild(svg('polygon', { points: [C, C - 62, C - 14, C - 38, C + 14, C - 38].join(' '), class: 'cgd-nose' }));
    bolt.appendChild(svg('rect', { x: C - 36, y: C - 16, width: 10, height: 32, rx: 3, class: 'cgd-wheel' }));
    bolt.appendChild(svg('rect', { x: C + 26, y: C - 16, width: 10, height: 32, rx: 3, class: 'cgd-wheel' }));
    bolt.appendChild(svg('circle', { cx: C, cy: C, r: 28, class: 'cgd-body' }));
    bolt.appendChild(svg('rect', { x: C - 17, y: C - 22, width: 34, height: 14, rx: 7, class: 'cgd-visor' }));
    bolt.appendChild(svg('circle', { cx: C - 8, cy: C - 15, r: 3.6, class: 'cgd-eye' }));
    bolt.appendChild(svg('circle', { cx: C + 8, cy: C - 15, r: 3.6, class: 'cgd-eye' }));
    bolt.appendChild(svg('circle', { cx: C, cy: C + 8, r: 6, class: 'cgd-knob' }));
    var badgeLayer = svg('g');
    var letterLayer = svg('g');
    root.appendChild(secLayer);
    root.appendChild(ghost);
    root.appendChild(bolt);
    root.appendChild(badgeLayer);
    root.appendChild(letterLayer);
    var letters = [];
    [0, 1, 2, 3].forEach(function (d) {
      var p = pt(d * 90, R_LET);
      var g = svg('g', { class: 'cgd-tgt', 'data-dir': LET[d] });
      g.appendChild(svg('circle', { cx: p.x, cy: p.y, r: 21 }));
      g.appendChild(svg('text', { x: p.x, y: p.y + 1 }, LET[d]));
      g.addEventListener('click', function () {
        if (!dirPicker || locked || busy) return;
        dirPicker(d);
      });
      letters.push(g);
      letterLayer.appendChild(g);
    });

    var capEl = el('div', { class: 'cgd-cap' }, '');
    var box = el('div', { class: 'cgd-gbox' }, root, capEl);
    var token = 0;
    var facing = 0;

    function setFacing(deg) {
      facing = deg;
      bolt.setAttribute('transform', 'rotate(' + r2(deg) + ' ' + C + ' ' + C + ')');
    }
    function setGhost(deg) {
      if (deg == null) {
        ghost.style.display = 'none';
        return;
      }
      ghost.style.display = '';
      ghost.setAttribute('transform', 'rotate(' + r2(deg) + ' ' + C + ' ' + C + ')');
    }
    function clearMarks() {
      token++;
      busy = false;
      MQ.clear(secLayer);
      MQ.clear(badgeLayer);
      capEl.textContent = '';
      paths.forEach(function (p) {
        p.classList.remove('on');
      });
    }
    function addBadge(start, dir, k, cls) {
      var p = pt(start + dir * 90 * (k - 0.5), R_BADGE);
      var g = svg('g', { class: cls || 'cgd-badge' });
      g.appendChild(svg('circle', { cx: p.x, cy: p.y, r: 11 }));
      g.appendChild(svg('text', { x: p.x, y: p.y + 1 }, String(k)));
      badgeLayer.appendChild(g);
      var e = pt(start + dir * 90 * k, R_SEC);
      secLayer.appendChild(svg('line', { class: 'cgd-div', x1: C, y1: C, x2: e.x, y2: e.y }));
    }
    /** Turn Bolt from `start` degrees by `signed` degrees, one right angle at a time. */
    function animateTurn(start, signed, o, done) {
      o = o || {};
      var my = ++token;
      var n = Math.round(Math.abs(signed) / 90);
      var dir = signed > 0 ? 1 : -1;
      var qms = o.quarterMs || 650;
      var pause = o.pause == null ? 300 : o.pause;
      var k = 0;
      var sec = svg('path', { class: o.cls || 'cgd-sec' });
      if (o.counts !== false) secLayer.appendChild(sec);
      if (o.ghost !== false) setGhost(start);
      busy = true;
      var said = [];
      function step() {
        if (my !== token) return;
        if (k >= n) {
          busy = false;
          setFacing(m360(start + signed));
          if (done) done();
          return;
        }
        var from = start + dir * 90 * k;
        var t0 = Date.now();
        (function frame() {
          if (my !== token) return;
          var p = Math.min(1, (Date.now() - t0) / qms);
          var cur = from + dir * 90 * ease(p);
          setFacing(cur);
          sec.setAttribute('d', sectorPath(start, cur - start));
          if (p < 1) {
            api.later(frame, 16);
            return;
          }
          k++;
          if (o.counts !== false) {
            addBadge(start, dir, k, o.badgeCls);
            api.sound('pop');
            said.push(k);
            if (o.talk) api.feedback((o.talkPrefix || '') + 'Count the right angles: ' + said.join(', ') + (k === n ? '.' : '…'), 'info');
          }
          api.later(step, k >= n ? 0 : pause);
        })();
      }
      step();
    }

    return {
      el: box,
      svg: root,
      cap: function (t) {
        capEl.textContent = t || '';
      },
      setFacing: setFacing,
      facing: function () {
        return facing;
      },
      setGhost: setGhost,
      clearMarks: clearMarks,
      animateTurn: animateTurn,
      busy: function () {
        return busy;
      },
      onPickDir: function (fn) {
        dirPicker = fn;
        root.classList.add('cgd-pick-dir');
      },
      onPickPlace: function (fn) {
        placePicker = fn;
        root.classList.add('cgd-pick-place');
      },
      lock: function () {
        locked = true;
        root.classList.remove('cgd-pick-dir', 'cgd-pick-place');
      },
      markDir: function (d, kind) {
        letters[d].classList.remove('good', 'bad');
        if (kind) letters[d].classList.add(kind);
      },
      markPlace: function (d, kind) {
        cards[d].classList.remove('good', 'bad');
        if (kind) cards[d].classList.add(kind);
      },
      unmarkAll: function () {
        letters.concat(cards).forEach(function (g) {
          g.classList.remove('good', 'bad');
        });
      },
      lightPath: function (d) {
        paths[d].classList.add('on');
      },
    };
  }

  /** Play one or two turns one after the other (second turn in gold). */
  function playSteps(api, g, start, steps, talk, done) {
    var at = start;
    var i = 0;
    var multi = steps.length > 1;
    function next() {
      if (i >= steps.length) {
        if (done) done();
        return;
      }
      var st = steps[i];
      var from = at;
      at = from + st.dir * st.n;
      var idx = i;
      i++;
      if (idx > 0) g.clearMarks();
      if (multi) g.cap((idx ? 'Then: ' : 'First: ') + stepText(st));
      g.animateTurn(
        from * 90,
        st.dir * 90 * st.n,
        { cls: idx ? 'cgd-sec2' : 'cgd-sec', badgeCls: idx ? 'cgd-badge2' : 'cgd-badge', talk: talk, talkPrefix: multi ? (idx ? 'Second turn. ' : 'First turn. ') : '' },
        function () {
          g.cap(pathText(from, st.dir, st.n));
          api.later(next, multi && idx < steps.length - 1 ? 1100 : 0);
        }
      );
    }
    next();
  }

  /* ---------------------------------------------------------------- *
   * Compass rose with letters to drag
   * ---------------------------------------------------------------- */

  var RX = 180;
  var RY = 128;
  var R_SPOT = 96;
  var uid = 0;

  function spotPt(q, r) {
    var a = (q * Math.PI) / 2;
    return { x: r2(RX + (r || R_SPOT) * Math.sin(a)), y: r2(RY - (r || R_SPOT) * Math.cos(a)) };
  }

  /**
   * cfg: { given: {letter, pos} or null, tiles: [letter numbers], strict: bool,
   *        onWrong(letter, spot), onDone() }  (strict = wrong drops bounce back)
   */
  function makeRose(api, cfg) {
    var given = cfg.given;
    var root = svg('svg', { viewBox: '0 0 360 322', class: 'cgd-rose', role: 'img', 'aria-label': 'A compass with letters to place' });
    var mid = 'cgd-ah' + ++uid;
    var defs = svg('defs');
    var mk = svg('marker', { id: mid, viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 5, markerHeight: 5, orient: 'auto' });
    mk.appendChild(svg('path', { d: 'M0,0 L10,5 L0,10 Z', fill: '#c98a00' }));
    defs.appendChild(mk);
    root.appendChild(defs);
    var s = 15;
    root.appendChild(
      svg('polygon', {
        class: 'cgd-star',
        points: [RX, RY - 70, RX + s, RY - s, RX + 70, RY, RX + s, RY + s, RX, RY + 70, RX - s, RY + s, RX - 70, RY, RX - s, RY - s].join(' '),
      })
    );
    root.appendChild(svg('circle', { cx: RX, cy: RY, r: 9, class: 'cgd-star-hub' }));
    var arcLayer = svg('g');
    root.appendChild(arcLayer);
    var spots = [];
    for (var q = 0; q < 4; q++) {
      var p = spotPt(q);
      var c = svg('circle', { cx: p.x, cy: p.y, r: 23, class: 'cgd-spot' });
      spots.push(c);
      root.appendChild(c);
    }
    function correctAt(q) {
      return given ? m4(given.letter + q - given.pos) : q;
    }
    var at = [null, null, null, null];
    if (given) {
      var gp = spotPt(given.pos);
      var gg = svg('g', { class: 'cgd-tile cgd-given', transform: 'translate(' + gp.x + ',' + gp.y + ')' });
      gg.appendChild(svg('rect', { x: -24, y: -24, width: 48, height: 48, rx: 11 }));
      gg.appendChild(svg('text', { x: 0, y: 1 }, LET[given.letter]));
      root.appendChild(gg);
      at[given.pos] = { letter: given.letter, fixed: true };
    }
    var tiles = [];
    var nT = cfg.tiles.length;
    cfg.tiles.forEach(function (letter, i) {
      var hx = r2(RX + (i - (nT - 1) / 2) * 70);
      var t = { letter: letter, hx: hx, hy: 288, x: hx, y: 288, spot: -1, locked: false };
      t.g = svg('g', { class: 'cgd-tile cgd-drag', 'data-letter': LET[letter] });
      t.g.appendChild(svg('rect', { x: -24, y: -24, width: 48, height: 48, rx: 11 }));
      t.g.appendChild(svg('text', { x: 0, y: 1 }, LET[letter]));
      root.appendChild(t.g);
      tiles.push(t);
      moveTile(t, hx, 288);
      var bx = 0;
      var by = 0;
      var unbind = MQ.ui.drag(root, t.g, {
        start: function () {
          if (t.locked) return;
          bx = t.x;
          by = t.y; // (re-appending the tile here would cancel the pointer capture)
          t.g.classList.remove('bad');
        },
        move: function (pp, dx, dy) {
          if (t.locked) return;
          moveTile(t, bx + dx, by + dy);
        },
        end: function () {
          if (t.locked) return;
          drop(t);
        },
      });
      api.cleanup(unbind);
    });
    function moveTile(t, x, y) {
      t.x = r2(x);
      t.y = r2(y);
      t.g.setAttribute('transform', 'translate(' + t.x + ',' + t.y + ')');
    }
    function sendHome(t) {
      if (t.spot >= 0 && at[t.spot] === t) at[t.spot] = null;
      t.spot = -1;
      moveTile(t, t.hx, t.hy);
    }
    function putAt(t, q) {
      if (t.spot >= 0 && at[t.spot] === t) at[t.spot] = null;
      t.spot = q;
      at[q] = t;
      var p = spotPt(q);
      moveTile(t, p.x, p.y);
    }
    function nearestSpot(t) {
      var best = -1;
      var bd = 46;
      for (var q = 0; q < 4; q++) {
        if (given && q === given.pos) continue;
        var p = spotPt(q);
        var d = Math.sqrt((p.x - t.x) * (p.x - t.x) + (p.y - t.y) * (p.y - t.y));
        if (d < bd) {
          bd = d;
          best = q;
        }
      }
      return best;
    }
    function drop(t) {
      var q = nearestSpot(t);
      if (q < 0) {
        sendHome(t);
        return;
      }
      if (cfg.strict) {
        if (correctAt(q) !== t.letter) {
          sendHome(t);
          api.sound('wrong');
          if (cfg.onWrong) cfg.onWrong(t.letter, q);
          return;
        }
        putAt(t, q);
        t.locked = true;
        t.g.classList.add('good');
        t.g.classList.remove('cgd-drag');
        api.sound('pop');
        if (tiles.every(function (x) {
          return x.locked;
        }) && cfg.onDone) cfg.onDone();
        return;
      }
      var other = at[q];
      if (other && other !== t) {
        if (t.spot >= 0) putAt(other, t.spot);
        else sendHome(other);
      }
      putAt(t, q);
      api.sound('pop');
    }
    /** Curved arrow going clockwise from spot q to spot q+1. */
    function arc(q) {
      var a0 = q * 90 + 22;
      var a1 = q * 90 + 68;
      var r = R_SPOT;
      function P(a) {
        var rad = (a * Math.PI) / 180;
        return r2(RX + r * Math.sin(rad)) + ',' + r2(RY - r * Math.cos(rad));
      }
      arcLayer.appendChild(svg('path', { d: 'M' + P(a0) + ' A' + r + ',' + r + ' 0 0 1 ' + P(a1), class: 'cgd-arc', 'marker-end': 'url(#' + mid + ')' }));
    }
    return {
      el: root,
      correctAt: correctAt,
      allPlaced: function () {
        return at.every(function (x) {
          return !!x;
        });
      },
      readout: function () {
        return at.map(function (x) {
          return x ? x.letter : -1;
        });
      },
      markWrong: function () {
        tiles.forEach(function (t) {
          if (t.spot >= 0 && correctAt(t.spot) !== t.letter) t.g.classList.add('bad');
        });
      },
      lockAll: function () {
        tiles.forEach(function (t) {
          t.locked = true;
          t.g.classList.remove('cgd-drag');
        });
      },
      arcsFrom: function (startPos, done) {
        var k = 0;
        MQ.clear(arcLayer);
        (function go() {
          if (k >= 4) {
            if (done) done();
            return;
          }
          arc(m4(startPos + k));
          k++;
          api.later(go, 350);
        })();
      },
      /** Move every tile to its right place, going clockwise from the given letter. */
      showAnswer: function (done) {
        var start = given ? given.pos : 0;
        tiles.forEach(function (t) {
          t.locked = true;
          t.g.classList.remove('bad', 'cgd-drag');
          sendHome(t);
        });
        MQ.clear(arcLayer);
        var k = 1;
        (function go() {
          if (k > 3) {
            arc(m4(start + 3));
            if (done) done();
            return;
          }
          var q = m4(start + k);
          arc(m4(q - 1));
          var t = tiles.filter(function (x) {
            return x.letter === correctAt(q);
          })[0];
          if (t) {
            putAt(t, q);
            t.g.classList.add('good');
            root.appendChild(t.g);
          }
          api.sound('pop');
          k++;
          api.later(go, 700);
        })();
      },
    };
  }

  /* ---------------------------------------------------------------- *
   * 3 by 3 picture grid + small compass
   * ---------------------------------------------------------------- */

  var GP = 10;
  var GS = 104;

  function cellXY(i) {
    return { x: GP + (i % 3) * GS + GS / 2, y: GP + Math.floor(i / 3) * GS + GS / 2 };
  }
  /** Direction of cell `to` as seen from cell `from` (same row or same column only). */
  function dirFromTo(from, to) {
    var fc = from % 3;
    var fr = Math.floor(from / 3);
    var tc = to % 3;
    var tr = Math.floor(to / 3);
    if (fc === tc && tr < fr) return 0;
    if (fr === tr && tc > fc) return 1;
    if (fc === tc && tr > fr) return 2;
    if (fr === tr && tc < fc) return 3;
    return -1;
  }

  function makePicGrid(api, cells) {
    var W = GP * 2 + GS * 3;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + W, class: 'cgd-pgrid', role: 'img', 'aria-label': 'A garden map with 9 places' });
    root.appendChild(svg('rect', { x: 1, y: 1, width: W - 2, height: W - 2, rx: 18, class: 'cgd-lawn' }));
    var id = 'cgd-gh' + ++uid;
    var defs = svg('defs');
    [['b', '#2563eb'], ['g', '#c98a00']].forEach(function (m) {
      var mk = svg('marker', { id: id + m[0], viewBox: '0 0 10 10', refX: 6, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto' });
      mk.appendChild(svg('path', { d: 'M0,0 L10,5 L0,10 Z', fill: m[1] }));
      defs.appendChild(mk);
    });
    root.appendChild(defs);
    var picker = null;
    var locked = false;
    var cellEls = [];
    cells.forEach(function (p, i) {
      var c = cellXY(i);
      var g = svg('g', { class: 'cgd-cell', 'data-place': p.k });
      g.appendChild(svg('rect', { x: c.x - GS / 2 + 4, y: c.y - GS / 2 + 4, width: GS - 8, height: GS - 8, rx: 12, class: 'cgd-card' }));
      g.appendChild(placeIcon(p, c.x, c.y - 11, 40));
      g.appendChild(svg('text', { x: c.x, y: c.y + 32, class: 'cgd-plabel' }, p.name));
      g.addEventListener('click', function () {
        if (!picker || locked) return;
        picker(i);
      });
      cellEls.push(g);
      root.appendChild(g);
    });
    var over = svg('g');
    root.appendChild(over);
    return {
      el: root,
      onPick: function (fn) {
        picker = fn;
        root.classList.add('cgd-pick-cell');
      },
      lock: function () {
        locked = true;
        root.classList.remove('cgd-pick-cell');
      },
      mark: function (i, kind) {
        cellEls[i].classList.remove('good', 'bad', 'ref');
        if (kind) cellEls[i].classList.add(kind);
      },
      /** Arrow from cell a to cell b; colour 'b' (blue) or 'g' (gold). */
      arrow: function (a, b, col) {
        var p = cellXY(a);
        var q = cellXY(b);
        var dx = q.x - p.x;
        var dy = q.y - p.y;
        var L = Math.sqrt(dx * dx + dy * dy);
        var ux = dx / L;
        var uy = dy / L;
        var off = col === 'g' ? 7 : -7; // keep two arrows apart
        over.appendChild(
          svg('line', {
            x1: r2(p.x + ux * 30 + uy * off),
            y1: r2(p.y + uy * 30 - ux * off),
            x2: r2(q.x - ux * 34 + uy * off),
            y2: r2(q.y - uy * 34 - ux * off),
            class: 'cgd-garrow cgd-garrow-' + col,
            'marker-end': 'url(#' + id + col + ')',
          })
        );
      },
    };
  }

  /** Small compass. onlyS: only the S at the bottom is shown. */
  function makeMiniRose(onlyS) {
    var root = svg('svg', { viewBox: '0 0 130 130', class: 'cgd-mini', role: 'img', 'aria-label': 'Compass' });
    var c = 65;
    root.appendChild(svg('polygon', { class: 'cgd-star', points: [c, c - 36, c + 8, c - 8, c + 36, c, c + 8, c + 8, c, c + 36, c - 8, c + 8, c - 36, c, c - 8, c - 8].join(' ') }));
    var texts = [];
    [0, 1, 2, 3].forEach(function (d) {
      var a = (d * Math.PI) / 2;
      var x = r2(c + 50 * Math.sin(a));
      var y = r2(c - 50 * Math.cos(a));
      var t = svg('text', { x: x, y: y + 1, class: 'cgd-mini-let' }, LET[d]);
      if (onlyS && d !== 2) {
        t.textContent = '?';
        t.classList.add('cgd-mini-q');
      }
      texts.push(t);
      root.appendChild(t);
    });
    return {
      el: root,
      fillAll: function () {
        texts.forEach(function (t, d) {
          if (t.textContent !== LET[d]) {
            t.textContent = LET[d];
            t.classList.remove('cgd-mini-q');
            t.classList.add('cgd-mini-new');
          }
        });
      },
    };
  }

  /* ---------------------------------------------------------------- *
   * Practice deck
   * ---------------------------------------------------------------- */

  function pick4() {
    return U.shuffle(PLACES.slice()).slice(0, 4);
  }
  function pick9() {
    return U.shuffle(PLACES.slice()).slice(0, 9);
  }
  function endOf(start, steps) {
    var e = start;
    steps.forEach(function (s) {
      e += s.dir * s.n;
    });
    return m4(e);
  }
  function turnQ(start, steps, ask) {
    return { type: 'turn', start: start, steps: steps, ask: ask, places: pick4(), answer: endOf(start, steps) };
  }
  function grid1Q() {
    for (;;) {
      var a = U.rand(0, 8);
      var b = U.rand(0, 8);
      if (a === b || dirFromTo(b, a) < 0) continue;
      return { type: 'grid1', cells: pick9(), a: a, b: b, answer: dirFromTo(b, a) };
    }
  }
  function grid2Q() {
    var t = U.rand(0, 8);
    var c = t % 3;
    var r = Math.floor(t / 3);
    var pr = U.pick([0, 1, 2].filter(function (x) {
      return x !== r;
    }));
    var gc = U.pick([0, 1, 2].filter(function (x) {
      return x !== c;
    }));
    var p = pr * 3 + c;
    var g = r * 3 + gc;
    return { type: 'grid2', form: U.pick(['click', 'blanks']), cells: pick9(), t: t, p: p, g: g, d1: dirFromTo(p, t), d2: dirFromTo(g, t) };
  }
  function roseQ() {
    var opts = [
      { letter: 0, pos: 1 },
      { letter: 0, pos: 3 },
      { letter: 2, pos: 0 },
      { letter: 1, pos: 0 },
      { letter: 3, pos: 0 },
      { letter: 1, pos: 2 },
    ];
    var gv = Math.random() < 0.5 ? { letter: 2, pos: 3 } : U.pick(opts); // S on the left is the workbook case
    var ans = [0, 1, 2, 3].map(function (q) {
      return m4(gv.letter + q - gv.pos);
    });
    return { type: 'rose', given: gv, answer: ans };
  }

  function buildDeck() {
    var d = [];
    // Level 1: what is in each direction; one-clue grid sentence.
    var dirs = U.shuffle([0, 1, 2, 3]);
    d.push({ type: 'what', ask: dirs[0], places: pick4(), answer: dirs[0] });
    d.push({ type: 'where', ask: dirs[1], places: pick4(), answer: dirs[1] });
    d.push(grid1Q());
    // Level 2: turns of 1 and 2 right angles; two-clue grid sentence.
    var starts = U.shuffle([0, 1, 2, 3]);
    d.push(turnQ(starts[0], [{ n: 1, dir: U.pick([1, -1]) }], 'dir'));
    d.push(turnQ(starts[1], [{ n: 2, dir: U.pick([1, -1]) }], 'place'));
    d.push(grid2Q());
    // Level 3: 3 right angles or two turns; reverse question; turned compass.
    if (Math.random() < 0.5) {
      d.push(turnQ(starts[2], [{ n: 3, dir: U.pick([1, -1]) }], 'dir'));
    } else {
      for (;;) {
        var d1 = U.pick([1, -1]);
        var st = [
          { n: U.pick([1, 2]), dir: d1 },
          { n: U.pick([1, 2]), dir: U.pick([1, -1]) },
        ];
        var net = st[0].dir * st[0].n + st[1].dir * st[1].n;
        if (m4(net) === 0) continue; // would come back to the start
        if (st[0].n === 2 && st[1].n === 2) continue;
        d.push(turnQ(starts[2], st, 'dir'));
        break;
      }
    }
    var rs = starts[3];
    var diff = U.pick([1, 3]);
    d.push({ type: 'reverse', start: rs, end: m4(rs + diff), places: pick4() });
    d.push(roseQ());
    return d;
  }

  var deck = null;

  var REV = [
    { v: 'cw1', n: 1, dir: 1 },
    { v: 'acw1', n: 1, dir: -1 },
    { v: 'cw2', n: 2, dir: 1 },
    { v: 'acw2', n: 2, dir: -1 },
    { v: 'cw3', n: 3, dir: 1 },
    { v: 'acw3', n: 3, dir: -1 },
  ];
  function revWorks(q, o) {
    return m4(q.start + o.dir * o.n) === q.end;
  }

  /* ---------------------------------------------------------------- *
   * Mistakes for turn questions
   * ---------------------------------------------------------------- */

  function turnMistake(q, picked, strong, asPlace) {
    var where = asPlace ? 'That place is ' + DN[picked] + ' of Bolt. ' : '';
    if (q.steps.length === 1) {
      var st = q.steps[0];
      var tail = strong ? ' Go ' + (st.dir > 0 ? 'clockwise' : 'anticlockwise') + ' (' + orderText(st.dir) + '): ' + pathText(q.start, st.dir, st.n) + '.' : '';
      if (picked === q.start) return { tag: 'Picked where Bolt started', hint: where + 'That is where Bolt starts. He has to turn ' + raText(st.n) + '.' + tail };
      if (st.n === 1) {
        if (picked === m4(q.start - st.dir)) {
          return { tag: 'Turned the wrong way', hint: where + (st.dir > 0 ? 'Clockwise goes the way clock hands go: N → E → S → W.' : 'Anticlockwise goes against the clock hands: N → W → S → E.') + tail };
        }
        return { tag: 'Counted right angles wrongly', hint: where + 'That is 2 right angles (a half turn). Turn only 1 right angle: the next letter round.' + tail };
      }
      if (st.n === 2) {
        return { tag: 'Counted right angles wrongly', hint: where + 'That is only 1 right angle. 2 right angles make a half turn: Bolt ends up facing the opposite way.' + tail };
      }
      // n === 3
      if (picked === m4(q.start + st.dir)) {
        return { tag: 'Did not see 3 clockwise = 1 anticlockwise', hint: 'That is only 1 right angle ' + (st.dir > 0 ? 'clockwise' : 'anticlockwise') + '. Keep going: 3 right angles. It ends where 1 right angle ' + (st.dir > 0 ? 'anticlockwise' : 'clockwise') + ' ends.' + tail };
      }
      return { tag: 'Counted right angles wrongly', hint: 'That is 2 right angles. You need 3: count them one at a time.' + tail };
    }
    var s1 = q.steps[0];
    var s2 = q.steps[1];
    var mid = m4(q.start + s1.dir * s1.n);
    var tail2 = strong ? ' First turn: ' + pathText(q.start, s1.dir, s1.n) + '. Then turn again from ' + DN[mid] + '.' : '';
    if (picked === q.start) return { tag: 'Picked where Bolt started', hint: 'That is where Bolt starts. Do the first turn, then the second turn.' + tail2 };
    if (picked === mid) return { tag: 'Forgot the second turn', hint: 'That is where the first turn ends. Now do the second turn.' + tail2 };
    var flip2 = m4(mid - s2.dir * s2.n);
    var flip1 = m4(q.start - s1.dir * s1.n + s2.dir * s2.n);
    if (picked === flip1 || picked === flip2) {
      return { tag: 'Turned the wrong way', hint: 'Do one turn at a time and check which way each one goes. Clockwise: N → E → S → W.' + tail2 };
    }
    return { tag: 'Counted right angles wrongly', hint: 'Do one turn at a time and count the right angles.' + tail2 };
  }

  /* ---------------------------------------------------------------- *
   * Register
   * ---------------------------------------------------------------- */

  MQ.register('compass-garden', {
    buildDeck: buildDeck, // used only by development tests
    learn: [
      // 1. The four points
      function (stage, api) {
        api.say('N goes at the top. Then go clockwise: Never Eat Shredded Wheat!');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('North, east, south, west', 'Drag each letter onto the compass. <b>N</b> (north) is at the top.'));
        var rhyme = el(
          'div',
          { class: 'cgd-rhyme' },
          ['Never', 'Eat', 'Shredded', 'Wheat'].map(function (w, i) {
            return el('span', { class: 'cgd-rw' }, el('b', null, w.charAt(0)), w.slice(1), i < 3 ? el('i', null, ' ' + CW) : null);
          })
        );
        var rose = makeRose(api, {
          given: null,
          tiles: [0, 1, 2, 3],
          strict: true,
          onWrong: function (letter, q) {
            api.feedback(LET[letter] + ' does not go there. Start with N at the top, then go clockwise: N, E, S, W.', 'try');
          },
          onDone: function () {
            api.say('Never Eat Shredded Wheat: N, E, S, W, going clockwise.', 'cheer');
            api.feedback('Clockwise from the top: north, east, south, west.', 'good');
            rose.arcsFrom(0);
            api.unlockNext();
          },
        });
        stage.appendChild(el('div', { class: 'cgd-row' }, rose.el, rhyme));
      },
      // 2. What can you see?
      function (stage, api) {
        api.say('I am in the middle of the garden. Make me face each way.');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('What can Bolt see?', 'Press a button. Bolt turns to face that way.'));
        var g = makeGarden(api, LEARN_PLACES);
        var at = 0;
        var seen = {};
        var btns = el('div', { class: 'cgd-btns' });
        [0, 1, 2, 3].forEach(function (d) {
          btns.appendChild(
            el(
              'button',
              {
                class: 'btn cgd-btn',
                type: 'button',
                onclick: function () {
                  if (g.busy()) return;
                  var diff = m4(d - at);
                  var from = at;
                  at = d;
                  function said() {
                    seen[d] = true;
                    g.unmarkAll();
                    g.markDir(d, 'good');
                    g.clearMarks();
                    g.lightPath(d);
                    g.cap('Facing ' + DN[d] + ', Bolt sees the ' + LEARN_PLACES[d].name + '.');
                    api.say('The ' + LEARN_PLACES[d].name + ' is to the ' + DN[d] + '.', 'happy');
                    if (Object.keys(seen).length === 4) {
                      api.feedback('Shed to the north, gate to the east, pond to the south, house to the west.', 'good');
                      api.unlockNext();
                    }
                  }
                  if (diff === 0) {
                    said();
                    return;
                  }
                  g.clearMarks();
                  g.animateTurn(from * 90, (diff === 3 ? -1 : diff) * 90, { counts: false, ghost: false, quarterMs: 500, pause: 0 }, said);
                },
              },
              'Face ' + DN[d]
            )
          );
        });
        stage.appendChild(g.el);
        stage.appendChild(btns);
      },
      // 3. Turning by right angles
      function (stage, api) {
        api.say('I face west. Try all three turns and watch where I end up.');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Turning by right angles', 'A quarter turn is <b>1 right angle</b>. Bolt starts facing <b>west</b> each time.'));
        var g = makeGarden(api, LEARN_PLACES);
        g.setFacing(270);
        var done = {};
        var TURNS = [
          { key: 'c1', n: 1, dir: 1 },
          { key: 'a1', n: 1, dir: -1 },
          { key: 'c3', n: 3, dir: 1 },
        ];
        var btns = el('div', { class: 'cgd-btns' });
        TURNS.forEach(function (t) {
          btns.appendChild(
            el(
              'button',
              {
                class: 'btn cgd-btn' + (t.dir < 0 ? ' cgd-btn-alt' : ''),
                type: 'button',
                onclick: function () {
                  if (g.busy()) return;
                  g.clearMarks();
                  g.unmarkAll();
                  g.setFacing(270);
                  g.animateTurn(270, t.dir * 90 * t.n, { quarterMs: 700, talk: true }, function () {
                    done[t.key] = true;
                    var end = m4(3 + t.dir * t.n);
                    g.markDir(end, 'good');
                    g.cap(pathText(3, t.dir, t.n));
                    if (t.n === 3) api.say('3 right angles clockwise ends at south. That is the same as 1 right angle anticlockwise!', 'happy');
                    else api.say((t.dir > 0 ? 'Clockwise' : 'Anticlockwise') + ' from west goes to ' + DN[end] + '.', 'happy');
                    if (done.c1 && done.a1 && done.c3) {
                      api.feedback('3 right angles clockwise = 1 right angle anticlockwise. Both end at south.', 'good');
                      api.unlockNext();
                    }
                  });
                },
              },
              (t.dir > 0 ? CW : ACW) + ' ' + stepText(t).replace(/ [↻↺]$/, '')
            )
          );
        });
        stage.appendChild(g.el);
        stage.appendChild(btns);
      },
      // 4. A turned compass
      function (stage, api) {
        api.say('A compass can be turned round. The letters still go clockwise: N, E, S, W.');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('A turned compass', 'Here only <b>S</b> is shown, and it is on the left. Start at S and go clockwise like clock hands.'));
        var rose = makeRose(api, {
          given: { letter: 2, pos: 3 },
          tiles: [1, 0, 3],
          strict: true,
          onWrong: function (letter) {
            api.feedback(LET[letter] + ' does not go there. Go clockwise from S: after S comes W, then N, then E.', 'try');
          },
          onDone: function () {
            api.say('S, W, N, E: still clockwise. Now N is on the right!', 'cheer');
            api.feedback('Clockwise from S: S → W → N → E. The order never changes.', 'good');
            rose.arcsFrom(3);
            api.unlockNext();
          },
        });
        stage.appendChild(el('div', { class: 'cgd-row' }, rose.el, el('div', { class: 'cgd-order' }, el('div', null, 'Clockwise order'), el('div', { class: 'cgd-order-big' }, 'N → E → S → W → N'))));
      },
    ],

    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0 || !deck[api.index]) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'what' || q.type === 'where') return renderLook(stage, api, q);
        if (q.type === 'turn') return renderTurn(stage, api, q);
        if (q.type === 'reverse') return renderReverse(stage, api, q);
        if (q.type === 'grid1') return renderGrid1(stage, api, q);
        if (q.type === 'grid2') return renderGrid2(stage, api, q);
        return renderRose(stage, api, q);
      },
    },
  });

  /* ---------------------------------------------------------------- *
   * Practice screens
   * ---------------------------------------------------------------- */

  function renderLook(stage, api, q) {
    var place = q.places[q.answer];
    var g = makeGarden(api, q.places);
    if (q.type === 'what') {
      stage.appendChild(MQ.ui.prompt('What is to the <b>' + DN[q.answer] + '</b> of Bolt? Click the picture.'));
      api.say('Find the letter ' + LET[q.answer] + ' first.', 'think');
    } else {
      stage.appendChild(MQ.ui.prompt('Which direction is the <b>' + place.name + '</b> from Bolt? Click the letter.'));
      api.say('Follow the path from me to the ' + place.name + '.', 'think');
    }
    stage.appendChild(g.el);
    function wrong(d) {
      var strong = api.tries() >= 1;
      var hint;
      if (q.type === 'what') {
        hint = 'That is the ' + q.places[d].name + '. It is to the ' + DN[d] + '.';
        hint += strong ? ' Find the letter ' + LET[q.answer] + ' and follow the path past it to a picture.' : ' Look for the letter ' + LET[q.answer] + '.';
      } else {
        hint = 'The letter ' + LET[d] + ' means ' + DN[d] + '. ' + (strong ? 'Which letter is on the path between Bolt and the ' + place.name + '?' : 'Follow the path from Bolt to the ' + place.name + '.');
      }
      if (m4(d - q.answer) === 2 && strong) hint += q.answer % 2 ? ' East and west are opposite each other.' : ' North and south are opposite each other.';
      api.check(false, hint, dirTag(q.answer, d));
    }
    function right() {
      g.lock();
      g.markDir(q.answer, 'good');
      g.markPlace(q.answer, 'good');
      g.lightPath(q.answer);
      api.check(true, 'Yes! The ' + place.name + ' is to the ' + DN[q.answer] + '.');
      turnTo();
    }
    function turnTo() {
      var diff = m4(q.answer - 0);
      if (!diff) return;
      g.animateTurn(0, (diff === 3 ? -1 : diff) * 90, { counts: false, ghost: false, quarterMs: 450, pause: 0 });
    }
    if (q.type === 'what') {
      g.onPickPlace(function (d) {
        if (api.isAnswered()) return;
        if (d === q.answer) right();
        else {
          g.markPlace(d, 'bad');
          wrong(d);
        }
      });
    } else {
      g.onPickDir(function (d) {
        if (api.isAnswered()) return;
        if (d === q.answer) right();
        else {
          g.markDir(d, 'bad');
          wrong(d);
        }
      });
    }
    api.onReveal(function () {
      g.lock();
      g.unmarkAll();
      g.markDir(q.answer, 'good');
      g.markPlace(q.answer, 'good');
      g.lightPath(q.answer);
      g.cap(LET[q.answer] + ' = ' + DN[q.answer] + ' → the ' + place.name);
      api.feedback('Follow the path from Bolt through the letter ' + LET[q.answer] + ': the ' + place.name + ' is to the ' + DN[q.answer] + '.', 'info');
      turnTo();
    });
  }

  function renderTurn(stage, api, q) {
    var two = q.steps.length > 1;
    var asPlace = q.ask === 'place';
    var g = makeGarden(api, q.places);
    g.setFacing(q.start * 90);
    var turnHtml = '<b>' + stepText(q.steps[0]) + '</b>' + (two ? ', then <b>' + stepText(q.steps[1]) + '</b>' : '');
    var html = asPlace
      ? 'Bolt faces the <b>' + q.places[q.start].name + '</b>. He turns ' + turnHtml + '.<br>What does he see now? Click the picture.'
      : 'Bolt faces <b>' + DN[q.start] + '</b>. He turns ' + turnHtml + '.<br>Which way does he face now? Click the letter.';
    stage.appendChild(MQ.ui.prompt(html));
    stage.appendChild(g.el);
    api.say(two ? 'Two turns! Do one at a time.' : 'Turn your finger round the compass first.', 'think');
    function pick(d) {
      if (api.isAnswered()) return;
      if (d === q.answer) {
        g.lock();
        if (asPlace) g.markPlace(d, 'good');
        g.markDir(d, 'good');
        api.check(true, asPlace ? 'Yes! Bolt now faces ' + DN[d] + ' and sees the ' + q.places[d].name + '.' : 'Yes! Bolt now faces ' + DN[d] + '.');
        playSteps(api, g, q.start, q.steps, false);
        return;
      }
      if (asPlace) g.markPlace(d, 'bad');
      else g.markDir(d, 'bad');
      var m = turnMistake(q, d, api.tries() >= 1, asPlace);
      api.check(false, m.hint, m.tag);
    }
    if (asPlace) g.onPickPlace(pick);
    else g.onPickDir(pick);
    api.onReveal(function () {
      g.lock();
      g.unmarkAll();
      g.clearMarks();
      g.setFacing(q.start * 90);
      g.markDir(q.answer, 'good');
      if (asPlace) g.markPlace(q.answer, 'good');
      api.feedback('Watch Bolt turn one right angle at a time.', 'info');
      playSteps(api, g, q.start, q.steps, true, function () {
        var full = q.steps
          .map(function (st, i) {
            var from = i === 0 ? q.start : m4(q.start + q.steps[0].dir * q.steps[0].n);
            return pathText(from, st.dir, st.n);
          })
          .join(', then ');
        api.feedback(full + '. Bolt faces ' + DN[q.answer] + (asPlace ? ' and sees the ' + q.places[q.answer].name : '') + '.', 'info');
      });
    });
  }

  function renderReverse(stage, api, q) {
    stage.appendChild(MQ.ui.prompt('Bolt was facing <b>' + DN[q.start] + '</b>. Now he faces <b>' + DN[q.end] + '</b>.<br>Which turn could it be?'));
    var g = makeGarden(api, q.places, { small: true });
    g.setGhost(q.start * 90);
    g.setFacing(q.end * 90);
    g.cap('Dashed = before · Blue = now');
    api.say('Two different turns work here. Find one!', 'think');
    var good = REV.filter(function (o) {
      return revWorks(q, o);
    });
    var ch = MQ.ui.choices(
      REV.map(function (o) {
        return { label: raText(o.n) + '<br><span class="cgd-small">' + dirText(o.dir) + '</span>', value: o.v };
      }),
      function (v) {
        if (api.isAnswered()) return;
        var o = REV.filter(function (x) {
          return x.v === v;
        })[0];
        if (revWorks(q, o)) {
          ch.mark(v, 'good');
          ch.disable();
          var other = good.filter(function (x) {
            return x.v !== v;
          })[0];
          api.check(true, 'Yes! ' + cap(raText(other.n)) + ' ' + (other.dir > 0 ? 'clockwise' : 'anticlockwise') + ' works too.');
          g.clearMarks();
          g.setFacing(q.start * 90);
          g.animateTurn(q.start * 90, o.dir * 90 * o.n, { quarterMs: 450, pause: 150 }, function () {
            g.cap(pathText(q.start, o.dir, o.n));
          });
          return;
        }
        ch.mark(v, 'bad');
        var one = good.filter(function (x) {
          return x.n === 1;
        })[0];
        var tag;
        var hint;
        if (o.n === 2) {
          tag = 'Counted right angles wrongly';
          hint = '2 right angles is a half turn: Bolt would face the opposite way, ' + DN[m4(q.start + 2)] + '.';
        } else if (o.n === 1) {
          tag = 'Turned the wrong way';
          hint = '1 right angle ' + (o.dir > 0 ? 'clockwise' : 'anticlockwise') + ' from ' + DN[q.start] + ' goes to ' + DN[m4(q.start + o.dir)] + ', not ' + DN[q.end] + '.';
        } else {
          tag = 'Did not see 3 clockwise = 1 anticlockwise';
          hint = '3 right angles ' + (o.dir > 0 ? 'clockwise' : 'anticlockwise') + ' ends where 1 right angle ' + (o.dir > 0 ? 'anticlockwise' : 'clockwise') + ' ends: ' + DN[m4(q.start + o.dir * 3)] + '.';
        }
        if (api.tries() >= 1) hint += ' Try going round from ' + DN[q.start] + ': ' + pathText(q.start, one.dir, 1) + ' is 1 right angle ' + (one.dir > 0 ? 'clockwise' : 'anticlockwise') + '.';
        api.check(false, hint, tag);
      },
      { columns: 2 }
    );
    ch.classList.add('cgd-choices');
    stage.appendChild(el('div', { class: 'cgd-row' }, g.el, ch));
    api.onReveal(function () {
      ch.disable();
      good.forEach(function (o) {
        ch.mark(o.v, 'good');
      });
      var order = good.slice().sort(function (a, b) {
        return a.n - b.n;
      });
      var i = 0;
      function name(o) {
        return raText(o.n) + ' ' + (o.dir > 0 ? 'clockwise' : 'anticlockwise');
      }
      api.feedback('Two turns work. Watch both.', 'info');
      (function play() {
        if (i >= order.length) {
          api.feedback(cap(name(order[0])) + ' (' + pathText(q.start, order[0].dir, order[0].n) + ') and ' + name(order[1]) + ' (' + pathText(q.start, order[1].dir, order[1].n) + ') both work.', 'info');
          return;
        }
        var o = order[i];
        i++;
        g.clearMarks();
        g.setFacing(q.start * 90);
        g.animateTurn(q.start * 90, o.dir * 90 * o.n, { quarterMs: 550, pause: 200 }, function () {
          g.cap(cap(name(o)) + ': ' + pathText(q.start, o.dir, o.n));
          api.later(play, 1400);
        });
      })();
    });
  }

  var DIR_CHOICES = [0, 1, 2, 3].map(function (d) {
    return { label: cap(DN[d]), value: d };
  });

  function renderGrid1(stage, api, q) {
    var A = q.cells[q.a];
    var B = q.cells[q.b];
    var blank = el('span', { class: 'cgd-blank' }, '?');
    var pr = MQ.ui.prompt('');
    pr.appendChild(document.createTextNode('The '));
    pr.appendChild(el('b', null, A.name));
    pr.appendChild(document.createTextNode(' is '));
    pr.appendChild(blank);
    pr.appendChild(document.createTextNode(' of the '));
    pr.appendChild(el('b', null, B.name));
    pr.appendChild(document.createTextNode('.'));
    stage.appendChild(pr);
    var grid = makePicGrid(api, q.cells);
    var mini = makeMiniRose(false);
    stage.appendChild(el('div', { class: 'cgd-row' }, grid.el, mini.el));
    api.say('Start at the ' + B.name + '. Which way do you go to reach the ' + A.name + '?', 'think');
    var ch = MQ.ui.choices(
      DIR_CHOICES,
      function (d) {
        if (api.isAnswered()) return;
        if (d === q.answer) {
          ch.mark(d, 'good');
          ch.disable();
          blank.textContent = DN[d];
          blank.classList.add('good');
          grid.mark(q.b, 'ref');
          grid.mark(q.a, 'good');
          grid.arrow(q.b, q.a, 'b');
          api.check(true, 'Yes! From the ' + B.name + ', go ' + DN[d] + ' to reach the ' + A.name + '.');
          return;
        }
        ch.mark(d, 'bad');
        var hint;
        if (m4(d - q.answer) === 2) hint = 'Careful: we start at the ' + B.name + ' and look for the ' + A.name + '. Which way is that?';
        else hint = 'The ' + A.name + ' and the ' + B.name + ' are in the same ' + (q.answer % 2 ? 'row' : 'column') + '. So it must be ' + (q.answer % 2 ? 'east or west' : 'north or south') + '.';
        if (api.tries() >= 1) hint += ' On the compass, N is up, E is right, S is down, W is left.';
        api.check(false, hint, dirTag(q.answer, d));
      },
      { columns: 4 }
    );
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(q.answer, 'good');
      ch.disable();
      blank.textContent = DN[q.answer];
      blank.classList.add('good');
      grid.mark(q.b, 'ref');
      grid.mark(q.a, 'good');
      grid.arrow(q.b, q.a, 'b');
      api.feedback('Start at the ' + B.name + ' and follow the arrow to the ' + A.name + '. It goes ' + ['up', 'right', 'down', 'left'][q.answer] + ', which is ' + DN[q.answer] + '.', 'info');
    });
  }

  function renderGrid2(stage, api, q) {
    var T = q.cells[q.t];
    var P = q.cells[q.p];
    var G = q.cells[q.g];
    var grid = makePicGrid(api, q.cells);
    var mini = makeMiniRose(true);
    function revealArrows() {
      grid.mark(q.p, 'ref');
      grid.mark(q.g, 'ref');
      grid.mark(q.t, 'good');
      grid.arrow(q.p, q.t, 'b');
      grid.arrow(q.g, q.t, 'g');
      mini.fillAll();
    }
    var working = 'From the ' + P.name + ', go ' + DN[q.d1] + ' (blue arrow). From the ' + G.name + ', go ' + DN[q.d2] + ' (gold arrow). They meet at the ' + T.name + '.';
    var sHint = ' Only S is shown on the compass and it is at the bottom, so N is at the top, E on the right and W on the left.';

    if (q.form === 'click') {
      stage.appendChild(MQ.ui.prompt('Click the place that is <b>' + DN[q.d1] + ' of the ' + P.name + '</b><br>and <b>' + DN[q.d2] + ' of the ' + G.name + '</b>.'));
      stage.appendChild(el('div', { class: 'cgd-row' }, grid.el, mini.el));
      api.say('Two clues! The place must fit both of them.', 'think');
      grid.onPick(function (i) {
        if (api.isAnswered()) return;
        if (i === q.t) {
          grid.lock();
          revealArrows();
          api.check(true, 'Yes! The ' + T.name + ' is ' + DN[q.d1] + ' of the ' + P.name + ' and ' + DN[q.d2] + ' of the ' + G.name + '.');
          return;
        }
        grid.mark(i, 'bad');
        var strong = api.tries() >= 1;
        var ok1 = dirFromTo(q.p, i) === q.d1;
        var ok2 = dirFromTo(q.g, i) === q.d2;
        var hint;
        var tag;
        if (i === q.p || i === q.g) {
          hint = 'That is the ' + q.cells[i].name + ' itself. Look for a place in the clue direction, in the same row or column.';
          tag = 'Mixed up the compass points';
        } else if (ok1 || ok2) {
          hint = 'That fits one clue: it is ' + (ok1 ? DN[q.d1] + ' of the ' + P.name : DN[q.d2] + ' of the ' + G.name) + '. Does it fit the other clue too?';
          tag = 'Used only one clue';
        } else {
          hint = 'Check each clue. ' + cap(DN[q.d1]) + ' of the ' + P.name + ' means in the same column, ' + (q.d1 === 0 ? 'above' : 'below') + ' it.';
          var ri = dirFromTo(q.p, i);
          var rg = dirFromTo(q.g, i);
          tag = ri >= 0 && m4(ri - q.d1) === 2 ? dirTag(q.d1, ri) : rg >= 0 && m4(rg - q.d2) === 2 ? dirTag(q.d2, rg) : 'Mixed up the compass points';
        }
        if (strong) hint += ' Go ' + DN[q.d1] + ' from the ' + P.name + ' and ' + DN[q.d2] + ' from the ' + G.name + ': where do the two paths meet?' + sHint;
        api.check(false, hint, tag);
      });
      api.onReveal(function () {
        grid.lock();
        revealArrows();
        api.feedback(working, 'info');
      });
      return;
    }

    // blanks form: The T is ___ of the P and ___ of the G.
    var b1 = el('span', { class: 'cgd-blank' }, '1');
    var b2 = el('span', { class: 'cgd-blank' }, '2');
    var pr = MQ.ui.prompt('');
    pr.appendChild(document.createTextNode('The '));
    pr.appendChild(el('b', null, T.name));
    pr.appendChild(document.createTextNode(' is '));
    pr.appendChild(b1);
    pr.appendChild(document.createTextNode(' of the '));
    pr.appendChild(el('b', null, P.name));
    pr.appendChild(document.createTextNode(' and '));
    pr.appendChild(b2);
    pr.appendChild(document.createTextNode(' of the '));
    pr.appendChild(el('b', null, G.name));
    pr.appendChild(document.createTextNode('.'));
    stage.appendChild(pr);
    var sel = [-1, -1];
    var blanks = [b1, b2];
    function chooser(k) {
      var c = MQ.ui.choices(
        DIR_CHOICES,
        function (d) {
          if (api.isAnswered()) return;
          sel[k] = d;
          c.buttons.forEach(function (b) {
            b.classList.remove('good', 'bad');
            b.classList.toggle('cgd-sel', b.value_ === d);
          });
          blanks[k].textContent = DN[d];
          blanks[k].classList.remove('bad');
          blanks[k].classList.add('set');
        },
        { columns: 4 }
      );
      c.classList.add('cgd-mini-choices');
      return c;
    }
    var c1 = chooser(0);
    var c2 = chooser(1);
    var checkBtn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    var side = el('div', { class: 'cgd-side' }, mini.el, el('div', { class: 'cgd-gap-lbl' }, 'Gap 1'), c1, el('div', { class: 'cgd-gap-lbl' }, 'Gap 2'), c2, checkBtn);
    stage.appendChild(el('div', { class: 'cgd-row' }, grid.el, side));
    api.say('Find the ' + T.name + '. Then look at it from the ' + P.name + ' and from the ' + G.name + '.', 'think');
    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      if (sel[0] < 0 || sel[1] < 0) {
        api.feedback('Choose a word for both gaps first.', 'info');
        return;
      }
      var ok1 = sel[0] === q.d1;
      var ok2 = sel[1] === q.d2;
      if (ok1 && ok2) {
        b1.classList.add('good');
        b2.classList.add('good');
        c1.disable();
        c2.disable();
        checkBtn.disabled = true;
        revealArrows();
        api.check(true, 'Yes! The ' + T.name + ' is ' + DN[q.d1] + ' of the ' + P.name + ' and ' + DN[q.d2] + ' of the ' + G.name + '.');
        return;
      }
      if (!ok1) b1.classList.add('bad');
      if (!ok2) b2.classList.add('bad');
      var k = ok1 ? 1 : 0;
      var ref = k ? G : P;
      var right = k ? q.d2 : q.d1;
      var hint = 'Gap ' + (k + 1) + ': start at the ' + ref.name + ' and look for the ' + T.name + '. Which way do you go?';
      if (!ok1 && !ok2) hint = 'Both gaps need another look. Start at the ' + P.name + ' (gap 1) and at the ' + G.name + ' (gap 2), then look for the ' + T.name + '.';
      if (api.tries() >= 1) hint += sHint;
      api.check(false, hint, dirTag(right, sel[k]));
    });
    api.onReveal(function () {
      c1.disable();
      c2.disable();
      checkBtn.disabled = true;
      c1.buttons.forEach(function (b) {
        b.classList.remove('cgd-sel');
      });
      c2.buttons.forEach(function (b) {
        b.classList.remove('cgd-sel');
      });
      c1.mark(q.d1, 'good');
      c2.mark(q.d2, 'good');
      b1.textContent = DN[q.d1];
      b2.textContent = DN[q.d2];
      b1.className = 'cgd-blank good';
      b2.className = 'cgd-blank good';
      revealArrows();
      api.feedback(working, 'info');
    });
  }

  function renderRose(stage, api, q) {
    var gv = q.given;
    stage.appendChild(MQ.ui.prompt('This compass is turned. Only <b>' + LET[gv.letter] + '</b> is shown.<br>Drag the other letters to the right places.'));
    var others = U.shuffle([0, 1, 2, 3].filter(function (x) {
      return x !== gv.letter;
    }));
    var rose = makeRose(api, { given: gv, tiles: others, strict: false });
    var checkBtn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    stage.appendChild(el('div', { class: 'cgd-row' }, rose.el, el('div', { class: 'cgd-side' }, el('div', { class: 'cgd-order' }, el('div', null, 'Clockwise order'), el('div', { class: 'cgd-order-big' }, 'N → E → S → W → N')), checkBtn)));
    api.say('Start at ' + LET[gv.letter] + ' and go round clockwise, like clock hands.', 'think');
    var after = LET[m4(gv.letter + 1)];
    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      if (!rose.allPlaced()) {
        api.feedback('Put all three letters on the compass first.', 'info');
        return;
      }
      var arr = rose.readout();
      var ok = arr.every(function (l, p) {
        return l === q.answer[p];
      });
      if (ok) {
        rose.lockAll();
        checkBtn.disabled = true;
        rose.arcsFrom(gv.pos);
        api.check(true, 'Yes! Clockwise from ' + LET[gv.letter] + ': ' + [0, 1, 2, 3].map(function (k) {
          return LET[m4(gv.letter + k)];
        }).join(' → ') + '.');
        return;
      }
      rose.markWrong();
      var mirror = arr.every(function (l, p) {
        return l === m4(gv.letter - (p - gv.pos));
      });
      var tag;
      var hint;
      if (mirror) {
        tag = gv.letter % 2 === 0 ? 'Swapped east and west' : 'Swapped north and south';
        hint = 'Your letters go anticlockwise. Go the other way round: the way clock hands go.';
      } else if (arr[0] === 0 && q.answer[0] !== 0) {
        tag = 'Put N at the top out of habit';
        hint = 'On this compass N is not at the top. Start from ' + LET[gv.letter] + ' and go clockwise.';
      } else {
        tag = 'Mixed up the compass order';
        hint = 'Go round clockwise from ' + LET[gv.letter] + '. The order is always N, E, S, W.';
      }
      if (api.tries() >= 1) hint += ' After ' + LET[gv.letter] + ' comes ' + after + '. Put ' + after + ' on the next spot clockwise (top → right → bottom → left).';
      api.check(false, hint, tag);
    });
    api.onReveal(function () {
      checkBtn.disabled = true;
      api.feedback('Start at ' + LET[gv.letter] + ' and go clockwise round the compass.', 'info');
      rose.showAnswer(function () {
        api.feedback('Clockwise from ' + LET[gv.letter] + ': ' + [0, 1, 2, 3].map(function (k) {
          return LET[m4(gv.letter + k)];
        }).join(' → ') + '. N is ' + ['at the top', 'on the right', 'at the bottom', 'on the left'][q.answer.indexOf(0)] + ' here.', 'info');
      });
    });
  }

  /* ---------------------------------------------------------------- *
   * Styles
   * ---------------------------------------------------------------- */

  var css = [
    '.cgd-gbox{display:flex;flex-direction:column;align-items:center;gap:2px}',
    '.cgd-garden{width:330px;max-width:100%;height:auto;display:block;user-select:none}',
    '.cgd-garden-sm{width:300px}',
    '.cgd-lawn{fill:#eaf6e2;stroke:#b9dcae;stroke-width:3}',
    '.cgd-path{fill:#f3e6cc}',
    '.cgd-path.on{fill:#ffd166}',
    '.cgd-place .cgd-card{fill:#fff;stroke:#c8d1dc;stroke-width:2.5}',
    '.cgd-plabel{font-size:15px;font-weight:800;fill:#2b3440;text-anchor:middle;dominant-baseline:middle;pointer-events:none}',
    '.cgd-emoji{pointer-events:none}',
    '.cgd-pick-place .cgd-place{cursor:pointer}',
    '.cgd-pick-place .cgd-place .cgd-card{stroke-dasharray:7 4}',
    '.cgd-pick-place .cgd-place:hover .cgd-card{stroke:var(--accent);fill:#e6f9f7;stroke-dasharray:none;stroke-width:3.5}',
    '.cgd-place.good .cgd-card{fill:var(--good-bg);stroke:var(--good);stroke-dasharray:none;stroke-width:4}',
    '.cgd-place.bad .cgd-card{fill:var(--try-bg);stroke:var(--try);stroke-dasharray:none;stroke-width:4}',
    '.cgd-tgt circle{fill:#fff;stroke:#3d4a5c;stroke-width:2.5}',
    '.cgd-tgt text{font-size:22px;font-weight:900;fill:#1d3557;text-anchor:middle;dominant-baseline:middle;pointer-events:none}',
    '.cgd-pick-dir .cgd-tgt{cursor:pointer}',
    '.cgd-pick-dir .cgd-tgt circle{stroke-dasharray:5 3}',
    '.cgd-pick-dir .cgd-tgt:hover circle{stroke:var(--accent);fill:#e6f9f7;stroke-dasharray:none;stroke-width:3.5}',
    '.cgd-tgt.good circle{fill:var(--good-bg);stroke:var(--good);stroke-dasharray:none;stroke-width:4}',
    '.cgd-tgt.good text{fill:var(--good)}',
    '.cgd-tgt.bad circle{fill:var(--try-bg);stroke:var(--try);stroke-dasharray:none;stroke-width:4}',
    '.cgd-tgt.bad text{fill:var(--try)}',
    '.cgd-sec{fill:#2ec4b6;fill-opacity:.28;stroke:#1a9e92;stroke-width:2}',
    '.cgd-sec2{fill:#ffb703;fill-opacity:.32;stroke:#c98a00;stroke-width:2}',
    '.cgd-div{stroke:#1a9e92;stroke-width:1.5;stroke-dasharray:3 3}',
    '.cgd-ghost line{stroke:#8d99a6;stroke-width:6;stroke-dasharray:8 6;stroke-linecap:round}',
    '.cgd-ghost polygon{fill:#b6bfc9}',
    '.cgd-nose{fill:#2563eb}',
    '.cgd-wheel{fill:#3d4a5c}',
    '.cgd-body{fill:#dfe7f1;stroke:#3d4a5c;stroke-width:4}',
    '.cgd-visor{fill:#1d3557}',
    '.cgd-eye{fill:#7df9ff}',
    '.cgd-knob{fill:#ffb703;stroke:#3d4a5c;stroke-width:2}',
    '.cgd-badge circle{fill:#1d3557}',
    '.cgd-badge2 circle{fill:#b86e00}',
    '.cgd-badge text,.cgd-badge2 text{fill:#fff;font-size:14px;font-weight:800;text-anchor:middle;dominant-baseline:middle}',
    '.cgd-cap{font-size:1.1rem;font-weight:800;min-height:1.4em;text-align:center;color:#1d3557}',
    '.cgd-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.cgd-btn{font-size:1rem;padding:10px 14px;background:#2563eb;color:#fff}',
    '.cgd-btn-alt{background:#1d3557}',
    '.cgd-row{display:flex;flex-wrap:wrap;gap:18px;justify-content:center;align-items:center;width:100%}',
    '.cgd-choices{max-width:400px;flex:1 1 280px}',
    '.cgd-choices .choice{font-size:1.05rem;min-height:56px;padding:6px 10px;line-height:1.2}',
    '.cgd-small{font-size:.9rem;font-weight:700}',
    '.cgd-rose{width:340px;max-width:100%;height:auto;display:block;user-select:none}',
    '.cgd-star{fill:#fde9b8;stroke:#c98a00;stroke-width:2}',
    '.cgd-star-hub{fill:#c98a00}',
    '.cgd-spot{fill:#fff;stroke:#8d99a6;stroke-width:2.5;stroke-dasharray:6 4}',
    '.cgd-tile rect{fill:#fff;stroke:#2563eb;stroke-width:3}',
    '.cgd-tile text{font-size:28px;font-weight:900;fill:#1d3557;text-anchor:middle;dominant-baseline:middle;pointer-events:none}',
    '.cgd-drag rect{fill:#e8f0ff}',
    '.cgd-tile.dragging rect{stroke-width:4;fill:#d6e4ff}',
    '.cgd-given rect{fill:#1d3557;stroke:#1d3557}',
    '.cgd-given text{fill:#fff}',
    '.cgd-tile.good rect{fill:var(--good-bg);stroke:var(--good)}',
    '.cgd-tile.good text{fill:var(--good)}',
    '.cgd-tile.bad rect{fill:var(--try-bg);stroke:var(--try)}',
    '.cgd-tile.bad text{fill:var(--try)}',
    '.cgd-arc{fill:none;stroke:#c98a00;stroke-width:4;stroke-linecap:round}',
    '.cgd-rhyme{display:flex;flex-direction:column;gap:6px;font-size:1.35rem;font-weight:700}',
    '.cgd-rw b{font-size:1.7rem;color:#2563eb}',
    '.cgd-rw i{font-style:normal;color:#8d99a6}',
    '.cgd-order{text-align:center;font-weight:800;color:#3d4a5c}',
    '.cgd-order-big{font-size:1.5rem;color:#1d3557;background:#fff;border:3px dashed var(--line);border-radius:14px;padding:8px 14px;margin-top:4px}',
    '.cgd-side{display:flex;flex-direction:column;align-items:center;gap:10px;max-width:340px}',
    '.cgd-pgrid{width:320px;max-width:100%;height:auto;display:block;user-select:none}',
    '.cgd-cell .cgd-card{fill:#fff;stroke:#c8d1dc;stroke-width:2.5}',
    '.cgd-pick-cell .cgd-cell{cursor:pointer}',
    '.cgd-pick-cell .cgd-cell:hover .cgd-card{stroke:var(--accent);fill:#e6f9f7;stroke-width:3.5}',
    '.cgd-cell.good .cgd-card{fill:var(--good-bg);stroke:var(--good);stroke-width:4}',
    '.cgd-cell.bad .cgd-card{fill:var(--try-bg);stroke:var(--try);stroke-width:4}',
    '.cgd-cell.ref .cgd-card{fill:#eef3ff;stroke:#2563eb;stroke-width:3}',
    '.cgd-garrow{stroke-width:6;stroke-linecap:round}',
    '.cgd-garrow-b{stroke:#2563eb}',
    '.cgd-garrow-g{stroke:#c98a00}',
    '.cgd-mini{width:120px;height:auto;display:block}',
    '.cgd-mini-let{font-size:22px;font-weight:900;fill:#1d3557;text-anchor:middle;dominant-baseline:middle}',
    '.cgd-mini-q{fill:#a7b1bc}',
    '.cgd-mini-new{fill:var(--good)}',
    '.cgd-blank{display:inline-block;min-width:90px;padding:0 6px;border-bottom:4px solid var(--accent);color:var(--ink-soft);text-align:center}',
    '.cgd-blank.set{color:#2563eb}',
    '.cgd-blank.good{color:var(--good);border-color:var(--good)}',
    '.cgd-blank.bad{color:var(--try);border-color:var(--try)}',
    '.cgd-gap-lbl{font-weight:800;color:#3d4a5c;margin-bottom:-6px}',
    '.cgd-mini-choices{max-width:340px}',
    '.cgd-mini-choices .choice{font-size:.95rem;min-height:44px;padding:4px 6px}',
    '.cgd-mini-choices .choice.cgd-sel{border-color:#2563eb;background:#e8f0ff;color:#1d3557}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'compass-garden' }, css));
})();

/* Ink blot puzzles — find hidden ones digits in additions and subtractions,
 * and look for every answer (Unit 3.1 / 3.2 Think like a mathematician).
 * All solutions are computed from the visible numbers, never typed in by hand. */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;
  var ID = 'ink-blot-sums';
  var P = 'ibs-';

  /* ---------------- puzzle model ----------------
   * q = { op: '+'|'−', a: 24 (the visible tens part: number is 24?), bVis: null|5 (a visible single digit),
   *       b: 13 (visible part of the second number, when it also has a blot), r: 381 }
   * Hidden digits: x (ones of the first number) and, if b is set, y (ones of the second). */
  function value(q, x, y) {
    var A = q.a * 10 + x;
    var B = q.bVis != null ? q.bVis : q.b * 10 + y;
    return q.op === '+' ? A + B : A - B;
  }
  function solve(q) {
    var out = [];
    for (var x = 0; x <= 9; x++) {
      if (q.bVis != null) {
        if (value(q, x) === q.r) out.push([x]);
      } else {
        for (var y = 0; y <= 9; y++) if (value(q, x, y) === q.r) out.push([x, y]);
      }
    }
    return out;
  }
  function blots(q) {
    return q.bVis != null ? 1 : 2;
  }
  function eqText(q, vals) {
    vals = vals || [];
    var A = String(q.a) + (vals[0] != null ? vals[0] : '?');
    var B = q.bVis != null ? String(q.bVis) : String(q.b) + (vals[1] != null ? vals[1] : '?');
    return A + ' ' + q.op + ' ' + B + ' = ' + q.r;
  }
  function key(q) {
    return eqText(q);
  }
  // What must the hidden ones make? (addition: their total; subtraction: how much bigger y is than x)
  function need(q) {
    if (q.op === '+') return q.r - q.a * 10 - (q.bVis != null ? q.bVis : q.b * 10);
    return q.a * 10 - q.b * 10 - q.r; // y - x
  }

  /* ---------------- deck ---------------- */
  var deck = null;
  function buildDeck() {
    var used = {};
    var q = [];
    function add(p) {
      var k = key(p);
      if (used[k]) return false;
      p.sols = solve(p);
      used[k] = true;
      q.push(p);
      return true;
    }
    // Level 1: one blot, single-digit partner; the ones always need a swap
    var ops = U.shuffle(['+', '−', U.pick(['+', '−'])]);
    while (q.length < 3) {
      var op = ops[q.length];
      var h = U.rand(1, 9), t = U.rand(1, 8), x = U.rand(0, 9), b = U.rand(2, 9);
      var p = { op: op, a: h * 10 + t, bVis: b, level: 1 };
      if (op === '+') {
        if (x + b < 10) continue;
        p.r = p.a * 10 + x + b;
      } else {
        if (x >= b) continue;
        p.r = p.a * 10 + x - b;
      }
      p.hidden = [x];
      add(p);
    }
    // Level 2: two blots in an addition, ones make 10-14; find any 2
    while (q.length < 6) {
      var s = U.rand(10, 14);
      var ha = U.rand(1, 6), hb = U.rand(1, 9 - ha);
      var ta = U.rand(0, 7), tb = U.rand(1, 8 - ta);
      var p2 = { op: '+', a: ha * 10 + ta, b: hb * 10 + tb, level: 2, find: 2 };
      p2.r = (ha * 10 + ta) * 10 + (hb * 10 + tb) * 10 + s;
      if (p2.r > 999) continue;
      add(p2);
    }
    // Level 3: find them all — one addition (ones make 11-15) and one subtraction (y is 5-8 more than x)
    var l3 = U.shuffle(['+', '−']);
    l3.forEach(function (op3) {
      for (var g = 0; g < 500; g++) {
        var p3;
        if (op3 === '+') {
          var s3 = U.rand(11, 15);
          var h1 = U.rand(1, 6), h2 = U.rand(1, 9 - h1);
          var t1 = U.rand(0, 7), t2 = U.rand(1, 8 - t1);
          p3 = { op: '+', a: h1 * 10 + t1, b: h2 * 10 + t2, level: 3 };
          p3.r = p3.a * 10 + p3.b * 10 + s3;
          if (p3.r > 999) continue;
        } else {
          var d = U.rand(5, 8);
          var hA = U.rand(3, 9), hB = U.rand(1, hA - 1);
          var tA = U.rand(1, 9), tB = U.rand(0, tA - 1);
          p3 = { op: '−', a: hA * 10 + tA, b: hB * 10 + tB, level: 3 };
          p3.r = p3.a * 10 - p3.b * 10 - d;
        }
        p3.find = solve(p3).length;
        if (add(p3)) return;
      }
    });
    return q;
  }

  /* ---------------- the ink-blot equation (SVG) with digit tiles ---------------- */
  var CW = 44, SW = 68, OPW = 56;
  function cellW(c) {
    return c.op ? OPW : c.slot != null ? SW : CW;
  }
  function blotPath(cx, cy, r, seed) {
    var pts = [];
    for (var i = 0; i < 12; i++) {
      var ang = (i / 12) * Math.PI * 2;
      var rr = r * (0.82 + 0.28 * Math.abs(Math.sin(seed * 3.1 + i * 1.7)));
      pts.push([cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr]);
    }
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var k = 1; k <= 12; k++) {
      var a0 = pts[k - 1], a1 = pts[k % 12];
      var mx = (a0[0] + a1[0]) / 2, my = (a0[1] + a1[1]) / 2;
      d += ' Q' + a0[0].toFixed(1) + ' ' + a0[1].toFixed(1) + ' ' + mx.toFixed(1) + ' ' + my.toFixed(1);
    }
    return d + 'Z';
  }

  // Returns { el, values, set(vals), clear(), onChange }
  function puzzle(api, q, opts) {
    opts = opts || {};
    var n = blots(q);
    var vals = n === 1 ? [null] : [null, null];
    var selected = null;
    var cells = [];
    String(q.a).split('').forEach(function (c) { cells.push({ t: c }); });
    cells.push({ slot: 0 });
    cells.push({ op: q.op });
    if (q.bVis != null) cells.push({ t: String(q.bVis) });
    else {
      String(q.b).split('').forEach(function (c) { cells.push({ t: c }); });
      cells.push({ slot: 1 });
    }
    cells.push({ op: '=' });
    String(q.r).split('').forEach(function (c) { cells.push({ t: c, res: true }); });
    var eqW = cells.reduce(function (s, c) { return s + cellW(c); }, 0);
    var tilesW = 10 * 60 - 8;
    var W = Math.max(eqW, tilesW) + 40, H = 230;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: P + 'svg', width: W, height: H, style: { width: Math.min(W * 1.25, 820) + 'px' } });
    root.appendChild(svg('rect', { x: 4, y: 4, width: W - 8, height: 118, rx: 14, class: P + 'paper' }));
    var x = (W - eqW) / 2;
    var slotPos = [];
    var slotG = [];
    cells.forEach(function (c, i) {
      var w = cellW(c);
      var cx = x + w / 2;
      if (c.slot != null) {
        var g = svg('g', { class: P + 'slot', 'data-slot': c.slot });
        slotPos[c.slot] = { x: cx, y: 64 };
        slotG[c.slot] = g;
        g.addEventListener('click', function () {
          if (opts.locked && opts.locked()) return;
          if (vals[c.slot] != null) {
            vals[c.slot] = null;
            draw();
            if (opts.onChange) opts.onChange(vals.slice());
          } else {
            selected = selected === c.slot ? null : c.slot;
            draw();
          }
        });
        root.appendChild(g);
      } else {
        root.appendChild(svg('text', { x: cx, y: 82, 'text-anchor': 'middle', class: P + (c.op ? 'op' : 'digit') + (c.res ? ' ' + P + 'res' : '') }, c.op || c.t));
      }
      x += w;
    });
    // digit tiles
    var tiles = [];
    for (var d = 0; d <= 9; d++) {
      (function (dd) {
        var tx = (W - tilesW) / 2 + dd * 60, ty = 150;
        var g = svg('g', { class: P + 'tile', 'data-digit': dd });
        g.appendChild(svg('rect', { x: tx, y: ty, width: 52, height: 60, rx: 10 }));
        g.appendChild(svg('text', { x: tx + 26, y: ty + 43, 'text-anchor': 'middle' }, String(dd)));
        root.appendChild(g);
        tiles.push(g);
        var moved = false;
        api.cleanup(
          MQ.ui.drag(root, g, {
            start: function () {
              moved = false;
            },
            move: function (p, dx, dy) {
              if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
              g.setAttribute('transform', 'translate(' + dx + ',' + dy + ')');
            },
            end: function (p) {
              g.setAttribute('transform', '');
              if (opts.locked && opts.locked()) return;
              if (!moved) {
                place(dd, null);
                return;
              }
              var best = null, bd = 60;
              slotPos.forEach(function (sp, si) {
                var dist = Math.hypot(p.x - sp.x, p.y - sp.y);
                if (dist < bd) {
                  bd = dist;
                  best = si;
                }
              });
              if (best != null) place(dd, best);
            },
          })
        );
      })(d);
    }
    function place(dd, slot) {
      if (slot == null) slot = selected != null ? selected : vals.indexOf(null);
      if (slot < 0) slot = vals.length - 1;
      vals[slot] = dd;
      selected = null;
      api.sound('pop');
      draw();
      if (opts.onChange) opts.onChange(vals.slice());
    }
    function draw() {
      slotG.forEach(function (g, si) {
        MQ.clear(g);
        var sp = slotPos[si];
        g.appendChild(svg('path', { d: blotPath(sp.x, sp.y - 2, 30, si + q.a), class: P + 'blot' + (selected === si ? ' ' + P + 'sel' : '') }));
        if (vals[si] != null) {
          g.appendChild(svg('rect', { x: sp.x - 21, y: sp.y - 30, width: 42, height: 52, rx: 8, class: P + 'filled' }));
          g.appendChild(svg('text', { x: sp.x, y: 82, 'text-anchor': 'middle', class: P + 'digit ' + P + 'placed' }, String(vals[si])));
        } else {
          g.appendChild(svg('text', { x: sp.x, y: 76, 'text-anchor': 'middle', class: P + 'q' }, '?'));
        }
      });
    }
    draw();
    return {
      el: el('div', { class: P + 'box' }, root),
      values: function () {
        return vals.slice();
      },
      set: function (v) {
        vals = v.slice();
        draw();
      },
      clear: function () {
        vals = vals.map(function () { return null; });
        draw();
      },
    };
  }

  // A board of found answers with empty spaces still to fill.
  function board(q, total) {
    var b = el('div', { class: P + 'board' });
    var found = [];
    function draw() {
      MQ.clear(b);
      b.appendChild(el('div', { class: P + 'board-head' }, 'Found ' + found.length + ' of ' + total));
      var grid = el('div', { class: P + 'pins' });
      for (var i = 0; i < total; i++) {
        var f = found[i];
        grid.appendChild(el('div', { class: P + 'pin' + (f ? ' ' + P + 'pin-full' : '') }, f ? eqText(q, f).replace(' = ' + q.r, '') : '?'));
      }
      b.appendChild(grid);
    }
    draw();
    return {
      el: b,
      has: function (v) {
        return found.some(function (f) { return f.join() === v.join(); });
      },
      add: function (v) {
        found.push(v.slice());
        found.sort(function (p, r) { return p[0] - r[0]; });
        draw();
      },
      count: function () {
        return found.length;
      },
      fillAll: function (sols) {
        found = sols.map(function (s) { return s.slice(); });
        draw();
      },
    };
  }

  /* ---------------- hints ---------------- */
  function seenText(q) {
    if (q.bVis != null) {
      var base = q.op === '+' ? q.a * 10 + q.bVis : q.a * 10 - q.bVis;
      return q.a + '0 ' + q.op + ' ' + q.bVis + ' = ' + base + '. We need ' + q.r + ', so the hidden digit is ' + q.r + ' − ' + base + ' = ' + (q.r - base) + '.';
    }
    if (q.op === '+') return q.a + '0 + ' + q.b + '0 = ' + (q.a * 10 + q.b * 10) + '. ' + q.r + ' − ' + (q.a * 10 + q.b * 10) + ' = ' + need(q) + ', so the hidden ones must make ' + need(q) + '.';
    return q.a + '0 − ' + q.b + '0 = ' + (q.a * 10 - q.b * 10) + '. That is ' + need(q) + ' more than ' + q.r + ', so the bottom hidden digit is ' + need(q) + ' more than the top one.';
  }
  function pairHint(q, v, api) {
    var r = { hint: '', tag: 'Ones make the wrong total' };
    var made = value(q, v[0], v[1]);
    if (q.op === '+') {
      var s = need(q);
      if (v[0] + v[1] === s - 10) {
        r.hint = 'Your ones make ' + (v[0] + v[1]) + '. They need to make ' + s + ' (1 ten and ' + (s - 10) + ' ones), because of the regrouped ten.';
        r.tag = 'Forgot the regrouped ten';
      } else {
        r.hint = eqText(q, v).replace(' = ' + q.r, '') + ' makes ' + made + ', not ' + q.r + '. The two hidden digits must add to ' + s + '.';
      }
    } else {
      var d = need(q);
      if (v[0] - v[1] === d) {
        r.hint = 'Nearly! That pair is the wrong way round. The <b>bottom</b> hidden digit must be ' + d + ' more than the top one.';
        r.tag = 'Subtraction pair the wrong way round';
      } else {
        r.hint = eqText(q, v).replace(' = ' + q.r, '') + ' makes ' + made + ', not ' + q.r + '. The bottom hidden digit must be ' + d + ' more than the top one.';
      }
    }
    if (api.tries() >= 1) r.hint += ' ' + seenText(q);
    return r;
  }

  /* ---------------- learn screens ---------------- */
  var K = { op: '+', a: 24, b: 13, r: 381 };
  var F = { op: '−', a: 49, b: 14, r: 345 };

  function learnKiko(stage, api) {
    api.say('Ink spilled on this homework! Add the parts we can see: 240 + 130 = 370. So the hidden ones must make 11.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('What is under the ink?', '240 + 130 = <b>370</b> &nbsp;→&nbsp; 381 − 370 = <b>11</b>'));
    var readout = el('div', { class: P + 'readout' }, 'Drag a digit tile onto each blot (or click a tile).');
    var done = false;
    var pz = puzzle(api, K, {
      onChange: function (v) {
        if (v.indexOf(null) !== -1 || done) return;
        var made = value(K, v[0], v[1]);
        if (made === K.r) {
          done = true;
          readout.innerHTML = eqText(K, v) + ' ✓ &nbsp; ' + v[0] + ' + ' + v[1] + ' = 11';
          api.sound('correct');
          api.say('You found one! The ones make 11, so 1 ten moves over.', 'cheer');
          api.feedback('The hidden ones must add up to 11.', 'good');
          api.unlockNext();
        } else {
          readout.innerHTML = eqText(K, v).replace(' = 381', '') + ' = ' + made + ' ✗ &nbsp; Your ones make ' + (v[0] + v[1]) + '. We need 11.';
          api.sound('wrong');
          pz.clear();
        }
      },
      locked: function () {
        return done;
      },
    });
    stage.appendChild(pz.el);
    stage.appendChild(readout);
  }

  function learnBoard(stage, api) {
    api.say('There is more than one answer! Find two answers and pin them on the board.');
    api.lockNext();
    var sols = solve(K);
    stage.appendChild(MQ.ui.lesson('How many answers?', 'Two hidden digits that add to <b>11</b>.'));
    var bd = board(K, sols.length);
    var mine = 0;
    var pz = puzzle(api, K, {
      onChange: function (v) {
        if (v.indexOf(null) !== -1) return;
        if (value(K, v[0], v[1]) !== K.r) {
          api.sound('wrong');
          api.feedback(v[0] + ' + ' + v[1] + ' = ' + (v[0] + v[1]) + '. They must make 11.', 'try');
        } else if (bd.has(v)) {
          api.feedback('That one is already on the board. Try another!', 'info');
        } else {
          bd.add(v);
          mine++;
          api.sound('correct');
          api.feedback('Pinned! ' + (sols.length - bd.count()) + ' spaces left.', 'good');
          if (mine === 2) {
            api.say('See the pattern? The first digit goes up by 1, the second goes down by 1.', 'cheer');
            showBtn.hidden = false;
            api.unlockNext();
          }
        }
        api.later(pz.clear, 500);
      },
    });
    var showBtn = el('button', { class: 'btn btn-ghost', type: 'button', hidden: true }, 'Show all ' + sols.length + ' answers');
    showBtn.addEventListener('click', function () {
      bd.fillAll(sols);
      showBtn.hidden = true;
      api.feedback('All 8: the first hidden digit goes 2, 3, 4 … 9. It can\'t be 0 or 1 (11 − 1 = 10, too big for one digit).', 'good');
    });
    stage.appendChild(el('div', { class: P + 'row' }, pz.el, bd.el));
    stage.appendChild(showBtn);
  }

  function learnFaisal(stage, api) {
    api.say('Now a take-away! 490 − 140 = 350. The answer is 345, which is 5 less. So the bottom hidden digit is 5 more than the top one.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('A take-away blot', '490 − 140 = <b>350</b> &nbsp;→&nbsp; we need 345, so the bottom digit is <b>5 more</b>. A swap is always needed!'));
    var readout = el('div', { class: P + 'readout' }, 'Try a pair, like 1 on top and 6 underneath.');
    var done = false;
    var pz = puzzle(api, F, {
      onChange: function (v) {
        if (v.indexOf(null) !== -1 || done) return;
        var made = value(F, v[0], v[1]);
        if (made === F.r) {
          done = true;
          readout.innerHTML = eqText(F, v) + ' ✓ &nbsp; ' + v[1] + ' is 5 more than ' + v[0] + '.';
          api.sound('correct');
          api.say('Yes! There are 5 answers: 490 − 145 up to 494 − 149.', 'cheer');
          api.feedback('Adding: the ones make a total. Taking away: the ones make a difference.', 'good');
          api.unlockNext();
        } else {
          readout.innerHTML = eqText(F, v).replace(' = 345', '') + ' = ' + made + ' ✗ &nbsp; ' + (v[0] - v[1] === 5 ? 'Wrong way round: the bottom digit must be the bigger one.' : 'The bottom digit must be 5 more than the top.');
          api.sound('wrong');
          pz.clear();
        }
      },
      locked: function () {
        return done;
      },
    });
    stage.appendChild(pz.el);
    stage.appendChild(readout);
  }

  /* ---------------- practice ---------------- */
  function renderOne(stage, api, q) {
    api.say(q.op === '+' ? 'One blot. Which digit makes the sum right?' : 'One blot. Which digit makes the take-away right?', 'think');
    stage.appendChild(MQ.ui.prompt('Find the hidden digit.'));
    var locked = false;
    var pz = puzzle(api, q, { locked: function () { return locked; } });
    stage.appendChild(pz.el);
    var check = el('button', { class: 'btn btn-check ' + P + 'check', type: 'button' }, 'Check');
    stage.appendChild(check);
    check.addEventListener('click', function () {
      if (locked) return;
      var v = pz.values();
      if (v[0] == null) {
        api.feedback('Put a digit tile on the blot first.', 'info');
        return;
      }
      if (value(q, v[0]) === q.r) {
        locked = true;
        check.disabled = true;
        api.check(true, eqText(q, v) + ' ✓');
        return;
      }
      var base = q.op === '+' ? q.a * 10 + q.bVis : q.a * 10 - q.bVis;
      var hint = eqText(q, v).replace(' = ' + q.r, '') + ' makes ' + value(q, v[0]) + ', not ' + q.r + '. ';
      hint += q.op === '+' ? 'The ones must make ' + (10 + (q.r % 10)) + ': ? + ' + q.bVis + ' = ' + (10 + (q.r % 10)) + '.' : 'Open a ten: 1? − ' + q.bVis + ' must end in ' + (q.r % 10) + '.';
      if (api.tries() >= 1) hint = seenText(q);
      // One blot: any wrong digit gives the wrong ones total (it can never be off by exactly a ten).
      api.check(false, hint, 'Ones make the wrong total');
    });
    api.onReveal(function () {
      locked = true;
      check.disabled = true;
      pz.set(q.sols[0]);
      var base = q.op === '+' ? q.a * 10 + q.bVis : q.a * 10 - q.bVis;
      stage.appendChild(el('div', { class: P + 'work' }, el('div', null, q.a + '0 ' + q.op + ' ' + q.bVis + ' = ' + base), el('div', null, q.r + ' − ' + base + ' = ' + q.sols[0][0]), el('div', { class: P + 'work-ans' }, eqText(q, q.sols[0]))));
      api.feedback(q.a + '0 ' + q.op + ' ' + q.bVis + ' = ' + base + ', and ' + q.r + ' − ' + base + ' = ' + q.sols[0][0] + '. So ' + eqText(q, q.sols[0]) + '.', 'info');
    });
  }

  function renderPairs(stage, api, q) {
    var all = q.level === 3;
    var goal = all ? q.sols.length : q.find;
    api.say(all ? 'Find ALL the answers! The board shows how many there are.' : 'Find any 2 different answers.', 'think');
    stage.appendChild(MQ.ui.prompt(all ? 'Find <b>every</b> pair of hidden digits.' : 'Find <b>2</b> different pairs of hidden digits.'));
    var locked = false;
    var pz = puzzle(api, q, { locked: function () { return locked; } });
    var bd = board(q, goal);
    stage.appendChild(el('div', { class: P + 'row' }, pz.el, bd.el));
    var check = el('button', { class: 'btn btn-check ' + P + 'check', type: 'button' }, 'Check');
    var doneBtn = all ? el('button', { class: 'btn btn-ghost ' + P + 'done', type: 'button' }, 'I found them all!') : null;
    stage.appendChild(el('div', { class: P + 'btns' }, check, doneBtn));
    check.addEventListener('click', function () {
      if (locked) return;
      var v = pz.values();
      if (v.indexOf(null) !== -1) {
        api.feedback('Put a digit on both blots first.', 'info');
        return;
      }
      if (value(q, v[0], v[1]) === q.r) {
        if (bd.has(v)) {
          api.feedback('That pair is already on the board. Find a different one!', 'info');
          pz.clear();
          return;
        }
        bd.add(v);
        pz.clear();
        if (bd.count() >= goal) {
          locked = true;
          check.disabled = true;
          if (doneBtn) doneBtn.disabled = true;
          api.check(true, all ? 'All ' + goal + ' found! You were a real detective.' : 'Two answers found! ' + (q.sols.length - 2) + ' more are possible.');
        } else {
          api.sound('correct');
          api.feedback('Pinned! ' + (goal - bd.count()) + ' more to find.', 'good');
          api.say('Good! Try the next digit up for the first blot.', 'happy');
        }
        return;
      }
      var r = pairHint(q, v, api);
      pz.clear();
      api.check(false, r.hint, r.tag);
    });
    if (doneBtn) {
      doneBtn.addEventListener('click', function () {
        if (locked) return;
        var left = goal - bd.count();
        api.check(false, 'Look at the board: ' + left + ' empty space' + (left === 1 ? '' : 's') + ' left! Go through the first digit 0, 1, 2 … in order.', 'Stopped after one answer');
      });
    }
    api.onReveal(function () {
      locked = true;
      check.disabled = true;
      if (doneBtn) doneBtn.disabled = true;
      bd.fillAll(all ? q.sols : q.sols.slice(0, goal));
      pz.set(q.sols[0]);
      var list = q.sols.map(function (s) {
        return q.op === '+' ? s[0] + '+' + s[1] : s[1] + '−' + s[0];
      }).join(', ');
      stage.appendChild(el('div', { class: P + 'work' }, el('div', null, seenText(q)), el('div', { class: P + 'work-ans' }, (q.op === '+' ? 'Pairs that make ' + need(q) : 'Pairs ' + need(q) + ' apart') + ': ' + list)));
    });
  }

  MQ.register(ID, {
    learn: [learnKiko, learnBoard, learnFaisal],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.bVis != null) renderOne(stage, api, q);
        else renderPairs(stage, api, q);
      },
    },
    // for automated tests only
    _deck: function () {
      return deck;
    },
    _build: buildDeck,
    _solve: solve,
  });

  var css = [
    '.ibs-box{width:100%;display:flex;justify-content:center}',
    '.ibs-svg{max-width:100%;height:auto;display:block;touch-action:none}',
    '.ibs-paper{fill:#fffdf6;stroke:#e6dcc0;stroke-width:2}',
    '.ibs-digit{font-size:50px;font-weight:800;fill:#1b2a4a}',
    '.ibs-res{fill:#0b6e66}',
    '.ibs-op{font-size:46px;font-weight:800;fill:#4a5a7d}',
    '.ibs-blot{fill:#1d2b5c;opacity:.92}',
    '.ibs-blot.ibs-sel{stroke:#ffb703;stroke-width:5}',
    '.ibs-slot{cursor:pointer}',
    '.ibs-q{font-size:30px;font-weight:800;fill:#c9d3ee}',
    '.ibs-filled{fill:#fff;stroke:#2ec4b6;stroke-width:3}',
    '.ibs-placed{fill:#0b6e66}',
    '.ibs-tile rect{fill:#e8f4fb;stroke:#2a6f97;stroke-width:2.5}',
    '.ibs-tile text{font-size:34px;font-weight:800;fill:#1b2a4a;pointer-events:none}',
    '.ibs-tile:hover rect{fill:#d3ecf8}',
    '.ibs-tile.dragging rect{fill:#fff3cd;stroke:#e09a00}',
    '.ibs-readout{font-size:1.25rem;font-weight:700;text-align:center;min-height:1.6em}',
    '.ibs-row{display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:center;width:100%}',
    '.ibs-row .ibs-box{flex:1 1 440px;width:auto;min-width:0}',
    '.ibs-board{background:#fff8e6;border:3px solid #e9c46a;border-radius:16px;padding:10px 14px;flex:0 1 270px}',
    '.ibs-board-head{font-weight:800;text-align:center;margin-bottom:6px}',
    '.ibs-pins{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}',
    '.ibs-pin{border:2px dashed #d9b75a;border-radius:10px;text-align:center;font-weight:800;padding:4px 6px;color:#b08d2c;background:#fff;font-size:1rem;white-space:nowrap}',
    '.ibs-pin-full{border-style:solid;border-color:#1f9d6b;color:#0b6e66;background:#e2f7ee}',
    '.ibs-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.ibs-work{background:var(--info-bg);border-radius:14px;padding:10px 16px;font-size:1.15rem;font-weight:700;text-align:center;max-width:720px}',
    '.ibs-work-ans{color:#0b6e66;font-size:1.25rem;margin-top:4px}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

/* Split and Multiply — multiply in any order, and multiply teen numbers by splitting (Unit 11.2).
 * Three-number products: pick the easiest pair first (trays of pencils / counters).
 * Teen × 2–5: cut the array of stickers into two parts (10 and the rest, or any cut),
 * multiply each part and add: 16 × 4 = 10 × 4 + 6 × 4 = 40 + 24 = 64.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;
  var ID = 'split-and-multiply';

  /* ------------------------------------------------------------------ *
   * Small helpers
   * ------------------------------------------------------------------ */
  function times(a, b) {
    return a + ' × ' + b;
  }
  function repeatAdd(p, t) {
    var parts = [];
    for (var i = 0; i < t; i++) parts.push(p);
    return parts.join(' + ');
  }
  function jumpList(step, count) {
    var out = [];
    for (var i = 1; i <= count; i++) out.push(step * i);
    return out;
  }
  // "40 + 24": add the tens of 24 first, then the ones.
  function addHelp(a, b) {
    var t = b - (b % 10);
    if (t === 0 || b % 10 === 0) return 'Count on from ' + a + ' in tens.';
    return a + ' + ' + t + ' = ' + (a + t) + ', then add ' + (b % 10) + ' more.';
  }
  function box(label) {
    return el('input', { class: 'sam-box', type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: 5, 'aria-label': label });
  }
  // Digits only (spaces ignored, so "100 20" is read as 10020). NaN if empty or not a whole number.
  function readBox(b) {
    var s = String(b.value).replace(/\s+/g, '');
    if (!/^\d+$/.test(s)) return NaN;
    return parseInt(s, 10);
  }
  function mark(b, ok) {
    b.classList.toggle('good', ok);
    b.classList.toggle('bad', !ok);
  }
  function focusLater(api, b) {
    api.later(function () {
      try {
        b.focus({ preventScroll: true });
      } catch (e) {}
    }, 40);
  }
  function shake(api, b) {
    b.classList.add('shake');
    api.later(function () {
      b.classList.remove('shake');
    }, 400);
  }

  /* ------------------------------------------------------------------ *
   * Sticker array with a cut line: n columns × m rows.
   * opts: cut (k or null), drag (bool), fmt ('rows' → "4 × 10", 'part' → "10 × 4"),
   *       products (bool, show "= 40" in the labels), onCut(k)
   * ------------------------------------------------------------------ */
  var CELL = 30;
  var GAP5 = 8;
  var PADL = 26;
  var TOP = 46;

  function cutArray(n, m, opts) {
    opts = opts || {};
    var arrH = m * CELL;
    var W = PADL * 2 + n * CELL + Math.floor((n - 1) / 5) * GAP5;
    var H = TOP + arrH + 64;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'sam-arr', style: { maxWidth: '100%', height: 'auto' } });
    function left(c) {
      return PADL + c * CELL + Math.floor(c / 5) * GAP5;
    }
    function bx(k) {
      if (k <= 0) return left(0) - 5;
      if (k >= n) return left(n - 1) + CELL + 7;
      return (left(k - 1) + CELL + left(k)) / 2;
    }
    function nearest(x) {
      var best = 1;
      for (var k = 1; k < n; k++) if (Math.abs(bx(k) - x) < Math.abs(bx(best) - x)) best = k;
      return best;
    }
    var stickers = [];
    var gSt = svg('g', null);
    for (var c = 0; c < n; c++) {
      stickers.push([]);
      for (var r = 0; r < m; r++) {
        var cx = left(c) + CELL / 2;
        var cy = TOP + r * CELL + CELL / 2;
        var s = svg('g', { class: 'sam-st' }, svg('circle', { cx: cx, cy: cy, r: 11.5, class: 'sam-st-c' }), svg('circle', { cx: cx - 3.5, cy: cy - 3.5, r: 3, class: 'sam-st-shine' }));
        stickers[c].push(s);
        gSt.appendChild(s);
      }
    }
    var hit = svg('rect', { x: left(0) - 8, y: TOP - 8, width: bx(n) - left(0) + 12, height: arrH + 16, fill: 'transparent', 'pointer-events': 'all', class: 'sam-hit' });
    var labA = svg('text', { class: 'sam-lab sam-lab-a', y: TOP + arrH + 26, 'text-anchor': 'middle' });
    var labB = svg('text', { class: 'sam-lab sam-lab-b', y: TOP + arrH + 54, 'text-anchor': 'middle' });
    var line = svg('line', { x1: 0, x2: 0, y1: TOP - 8, y2: TOP + arrH + 8, class: 'sam-cut-line' });
    var handle = svg('g', { class: 'sam-handle' }, svg('circle', { cx: 0, cy: 18, r: 17, class: 'sam-handle-c' }), svg('text', { x: 0, y: 25, 'text-anchor': 'middle', class: 'sam-handle-t' }, '✂'));
    var cutG = svg('g', { class: 'sam-cut' + (opts.drag ? ' sam-cut-drag' : '') }, svg('rect', { x: -15, y: 0, width: 30, height: TOP + arrH + 8, fill: 'transparent', 'pointer-events': 'all' }), line, handle);
    root.appendChild(gSt);
    root.appendChild(hit);
    root.appendChild(labA);
    root.appendChild(labB);
    root.appendChild(cutG);

    var a = { el: root, k: null, products: !!opts.products, disabled: !opts.drag, unbind: null };

    function label(part) {
      var t = opts.fmt === 'rows' ? times(m, part) : times(part, m);
      if (a.products) t += ' = ' + part * m;
      return t;
    }
    function placeCut(x) {
      cutG.setAttribute('transform', 'translate(' + x + ',0)');
    }
    function draw() {
      var k = a.k;
      for (var c = 0; c < n; c++)
        for (var r = 0; r < m; r++) {
          var s = stickers[c][r];
          s.classList.toggle('sam-a', k != null && c < k);
          s.classList.toggle('sam-b', k != null && c >= k);
        }
      if (k == null) {
        placeCut(bx(n));
        cutG.classList.add('sam-park');
        cutG.style.display = opts.drag ? '' : 'none';
        labA.textContent = n + ' in each row';
        labA.setAttribute('x', W / 2);
        labB.textContent = '';
        return;
      }
      cutG.style.display = '';
      cutG.classList.remove('sam-park');
      placeCut(bx(k));
      labA.textContent = label(k);
      labB.textContent = label(n - k);
      labA.setAttribute('x', U.clamp((left(0) + bx(k)) / 2, 50, W - 50));
      labB.setAttribute('x', U.clamp((bx(k) + bx(n)) / 2, 50, W - 50));
    }
    a.set = function (k) {
      a.k = k;
      draw();
    };
    a.showProducts = function (on) {
      a.products = on;
      draw();
    };
    a.disable = function () {
      a.disabled = true;
      cutG.classList.remove('sam-cut-drag');
      handle.style.cursor = 'default';
    };
    // Light up one row of one part (side 'a' = left, 'b' = right).
    a.lightRow = function (side, r) {
      var k = a.k;
      for (var c = 0; c < n; c++) if ((side === 'a') === c < k) stickers[c][r].classList.add('sam-lit');
    };
    a.unlight = function () {
      for (var c = 0; c < n; c++) for (var r = 0; r < m; r++) stickers[c][r].classList.remove('sam-lit');
    };

    function choose(k) {
      if (a.disabled) return;
      a.set(k);
      MQ.sound('pop');
      if (opts.onCut) opts.onCut(k);
    }
    if (opts.drag) {
      var startK = null;
      var startX = 0;
      var moved = false;
      a.unbind = MQ.ui.drag(root, cutG, {
        start: function (p) {
          startK = a.k;
          startX = p.x;
          moved = false;
        },
        move: function (p) {
          if (a.disabled) return;
          if (Math.abs(p.x - startX) > 4) moved = true;
          if (!moved) return;
          var k = nearest(p.x);
          a.k = k;
          draw();
        },
        end: function (p) {
          if (a.disabled) return;
          if (!moved) {
            a.k = startK;
            draw();
            return;
          }
          choose(nearest(p.x));
        },
      });
      hit.style.cursor = 'pointer';
      hit.addEventListener('click', function (e) {
        if (a.disabled) return;
        choose(nearest(MQ.ui.svgPoint(root, e).x));
      });
    }
    a.set(opts.cut == null ? null : opts.cut);
    a.bx = bx; // used by tests to find drop points
    root.setAttribute('data-n', n);
    return a;
  }

  // "4 rows of 10: 10, 20, 30, 40" for each part, as coloured chips.
  function jumpRow(part, m, side) {
    var row = el('div', { class: 'sam-jrow sam-j' + side }, el('span', { class: 'sam-jlab' }, m + ' rows of ' + part + ':'));
    jumpList(part, m).forEach(function (v, i) {
      if (i) row.appendChild(el('span', { class: 'sam-arrow' }, '→'));
      row.appendChild(el('span', { class: 'chip sam-chip' }, String(v)));
    });
    return row;
  }
  function working(n, m, s1, s2) {
    return el(
      'div',
      { class: 'sam-work' },
      jumpRow(s1, m, 'a'),
      jumpRow(s2, m, 'b'),
      el('div', { class: 'sam-sentence' }, times(n, m) + ' = ' + s1 * m + ' + ' + s2 * m + ' = ' + n * m)
    );
  }

  /* ------------------------------------------------------------------ *
   * Recording layout:   10 × 4 = [  ]
   *                      6 × 4 = [  ]
   *                     16 × 4 = 40 + 24 = [  ]
   * ------------------------------------------------------------------ */
  function recorder(n, m, opts) {
    opts = opts || {};
    var edit = !!opts.editSplit;
    var s1 = edit ? box('First part of ' + n) : el('span', { class: 'sam-num sam-ta' });
    var s2 = edit ? box('Second part of ' + n) : el('span', { class: 'sam-num sam-tb' });
    if (edit) {
      s1.classList.add('sam-box-s', 'sam-bxa');
      s2.classList.add('sam-box-s', 'sam-bxb');
    }
    var p1 = box('First part times ' + m);
    var p2 = box('Second part times ' + m);
    var tot = box('Total');
    p1.classList.add('sam-bxa');
    p2.classList.add('sam-bxb');
    var mir1 = el('span', { class: 'sam-mir sam-ta' }, '?');
    var mir2 = el('span', { class: 'sam-mir sam-tb' }, '?');
    var checkBtn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    var grid = el(
      'div',
      { class: 'sam-rec' },
      el('div', { class: 'sam-cell sam-r' }, s1, el('span', { class: 'sam-op' }, '× ' + m)),
      el('div', { class: 'sam-cell sam-op' }, '='),
      el('div', { class: 'sam-cell' }, p1),
      el('div', { class: 'sam-cell sam-r' }, s2, el('span', { class: 'sam-op' }, '× ' + m)),
      el('div', { class: 'sam-cell sam-op' }, '='),
      el('div', { class: 'sam-cell' }, p2),
      el('div', { class: 'sam-cell sam-r sam-op sam-big' }, times(n, m)),
      el('div', { class: 'sam-cell sam-op' }, '='),
      el('div', { class: 'sam-cell sam-tot' }, mir1, el('span', { class: 'sam-op' }, '+'), mir2, el('span', { class: 'sam-op' }, '='), tot)
    );
    var wrapEl = el('div', { class: 'sam-recwrap' }, grid, opts.noCheck ? null : checkBtn);
    function mirror() {
      mir1.textContent = p1.value.trim() || '?';
      mir2.textContent = p2.value.trim() || '?';
    }
    p1.addEventListener('input', mirror);
    p2.addEventListener('input', mirror);
    var inputs = edit ? [s1, s2, p1, p2, tot] : [p1, p2, tot];
    var r = {
      el: wrapEl,
      inputs: inputs,
      checkBtn: checkBtn,
      s1: s1,
      s2: s2,
      p1: p1,
      p2: p2,
      tot: tot,
      setSplit: function (k) {
        if (edit) {
          s1.value = k;
          s2.value = n - k;
        } else {
          s1.textContent = String(k);
          s2.textContent = String(n - k);
        }
      },
      split: function () {
        if (edit) return [readBox(s1), readBox(s2)];
        return [parseInt(s1.textContent, 10), parseInt(s2.textContent, 10)];
      },
      clearMarks: function () {
        inputs.forEach(function (b) {
          b.classList.remove('good', 'bad');
        });
      },
      lock: function () {
        inputs.forEach(function (b) {
          b.disabled = true;
        });
        checkBtn.disabled = true;
      },
      fill: function (k) {
        r.setSplit(k);
        p1.value = k * m;
        p2.value = (n - k) * m;
        tot.value = n * m;
        mirror();
        inputs.forEach(function (b) {
          b.classList.remove('bad');
          b.classList.add('good');
        });
      },
      onSubmit: function (fn) {
        checkBtn.addEventListener('click', fn);
        inputs.forEach(function (b) {
          b.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
              e.preventDefault();
              fn();
            }
          });
        });
      },
    };
    return r;
  }

  /* ------------------------------------------------------------------ *
   * Number tiles for a three-number product. Drag one tile onto another,
   * or click two tiles. onPair(i, j) returns false to refuse the pair.
   * ------------------------------------------------------------------ */
  var TW = 76;
  var TGAP = 50;
  function tilePicker(api, nums, onPair) {
    var W = 3 * TW + 2 * TGAP + 24;
    var H = TW + 24;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'sam-tiles', style: { maxWidth: '100%', height: 'auto' } });
    var t = { el: root, nums: nums.slice(), pair: null, disabled: false };
    var unbinds = [];
    var sel = null;
    function tx(i) {
      return 12 + i * (TW + TGAP);
    }
    function unbindAll() {
      unbinds.forEach(function (f) {
        f();
      });
      unbinds = [];
    }
    api.cleanup(unbindAll);
    function tile(i, x, cls) {
      return svg(
        'g',
        { class: 'sam-tile ' + (cls || ''), transform: 'translate(' + x + ',12)', 'data-i': i },
        svg('rect', { x: 0, y: 0, width: TW, height: TW, rx: 16, class: 'sam-tile-r' }),
        svg('text', { x: TW / 2, y: TW / 2 + 15, 'text-anchor': 'middle', class: 'sam-tile-t' }, String(t.nums[i]))
      );
    }
    function times_(x) {
      return svg('text', { x: x, y: 12 + TW / 2 + 12, 'text-anchor': 'middle', class: 'sam-tile-x' }, '×');
    }
    function draw() {
      unbindAll();
      MQ.clear(root);
      sel = null;
      if (t.pair) {
        var i = t.pair[0];
        var j = t.pair[1];
        var o = 3 - i - j;
        root.appendChild(svg('rect', { x: 4, y: 4, width: 2 * TW + TGAP + 16, height: TW + 16, rx: 22, class: 'sam-pairbox' }));
        root.appendChild(tile(i, tx(0), 'sam-in'));
        root.appendChild(times_(tx(1) - TGAP / 2));
        root.appendChild(tile(j, tx(1), 'sam-in'));
        root.appendChild(times_(tx(2) - TGAP / 2));
        root.appendChild(tile(o, tx(2), 'sam-out'));
        return;
      }
      var gs = [];
      for (var k = 0; k < 3; k++) {
        if (k) root.appendChild(times_(tx(k) - TGAP / 2));
      }
      for (var q = 0; q < 3; q++) {
        var g = tile(q, tx(q), 'sam-live');
        gs.push(g);
        root.appendChild(g);
      }
      gs.forEach(function (g, i) {
        unbinds.push(
          MQ.ui.drag(root, g, {
            start: function (p) {
              g.startP = p;
              root.appendChild(g); // on top
            },
            move: function (p, dx, dy) {
              if (t.disabled) return;
              g.setAttribute('transform', 'translate(' + (tx(i) + dx) + ',' + (12 + dy) + ')');
            },
            end: function (p) {
              if (t.disabled) return;
              g.setAttribute('transform', 'translate(' + tx(i) + ',12)');
              var sp = g.startP || p;
              var moved = Math.abs(p.x - sp.x) + Math.abs(p.y - sp.y) > 8;
              // Which tile is under the pointer?
              var target = -1;
              if (moved) for (var k = 0; k < 3; k++) if (k !== i && Math.abs(p.x - (tx(k) + TW / 2)) < TW / 2 + 14 && Math.abs(p.y - (12 + TW / 2)) < TW / 2 + 20) target = k;
              if (target >= 0) {
                choose(i, target);
                return;
              }
              if (!moved) click(i);
            },
          })
        );
      });
      t.gs = gs;
    }
    function click(i) {
      if (t.disabled || t.pair) return;
      if (sel === null) {
        sel = i;
        t.gs[i].classList.add('sam-sel');
        MQ.sound('click');
        return;
      }
      if (sel === i) {
        t.gs[i].classList.remove('sam-sel');
        sel = null;
        return;
      }
      choose(sel, i);
    }
    function choose(i, j) {
      if (t.disabled || t.pair) return;
      if (onPair(i, j) === false) {
        if (sel !== null && t.gs[sel]) t.gs[sel].classList.remove('sam-sel');
        sel = null;
        return;
      }
      t.pair = [i, j];
      MQ.sound('pop');
      draw();
    }
    t.reset = function (newNums) {
      if (newNums) t.nums = newNums.slice();
      t.pair = null;
      draw();
    };
    t.force = function (i, j) {
      t.pair = [i, j];
      draw();
    };
    t.disable = function () {
      t.disabled = true;
      root.classList.add('sam-off');
    };
    draw();
    return t;
  }

  /* ------------------------------------------------------------------ *
   * Trays: count trays, each holding rows × cols pencils (or counters).
   * ------------------------------------------------------------------ */
  function trays(count, rows, cols, kind) {
    var pencil = kind === 'pencil';
    var px = pencil ? 12 : 13;
    var py = pencil ? 30 : 13;
    var trayW = cols * px + 14;
    var trayH = rows * py + (pencil ? 10 : 12);
    var gap = 12;
    var per = Math.max(1, Math.floor((700 + gap) / (trayW + gap)));
    var lines = Math.ceil(count / per);
    var inRow = Math.min(count, per);
    var W = inRow * (trayW + gap) - gap + 4;
    var lineH = trayH + 30;
    var H = lines * lineH;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'sam-trays', style: { maxWidth: '100%', height: 'auto' } });
    for (var t = 0; t < count; t++) {
      var lx = t % per;
      var ly = Math.floor(t / per);
      // centre the last line
      var onLine = ly === lines - 1 ? count - ly * per : per;
      var off = ((per - onLine) * (trayW + gap)) / 2;
      if (lines === 1) off = 0;
      var x0 = 2 + off + lx * (trayW + gap);
      var y0 = ly * lineH + 2;
      var g = svg('g', { class: 'sam-tray' });
      g.appendChild(svg('rect', { x: x0, y: y0, width: trayW, height: trayH, rx: 8, class: 'sam-tray-r' }));
      for (var r = 0; r < rows; r++)
        for (var c = 0; c < cols; c++) {
          var x = x0 + 7 + c * px;
          var y = y0 + 6 + r * py;
          if (pencil) {
            g.appendChild(
              svg(
                'g',
                { class: 'sam-pencil' },
                svg('rect', { x: x + 1, y: y, width: 7, height: 4, class: 'sam-pen-e' }),
                svg('rect', { x: x + 1, y: y + 4, width: 7, height: 15, class: 'sam-pen-b' }),
                svg('polygon', { points: x + 1 + ',' + (y + 19) + ' ' + (x + 8) + ',' + (y + 19) + ' ' + (x + 4.5) + ',' + (y + 25), class: 'sam-pen-t' })
              )
            );
          } else {
            g.appendChild(svg('circle', { cx: x + px / 2 - 1, cy: y + py / 2 - 1, r: 5, class: 'sam-dot' }));
          }
        }
      g.appendChild(svg('text', { x: x0 + trayW / 2, y: y0 + trayH + 20, 'text-anchor': 'middle', class: 'sam-tray-l' }, String(rows * cols)));
      root.appendChild(g);
    }
    root.setAttribute('data-items', count * rows * cols);
    return root;
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */
  // 1. Any order: 5 × 4 × 3.
  function learnOrder(stage, api) {
    api.say('5 × 4 × 3. Which two first? Drag the 5 onto the 4, or click them both.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Any order', 'Multiply <b>two</b> numbers first. Then multiply by the last one.'));
    var picHost = el('div', { class: 'sam-pic' });
    var out = el('div', { class: 'sam-out' });
    var done1 = el('div', { class: 'sam-done' });
    var stage2 = false;
    var tp = tilePicker(api, [5, 4, 3], function (i, j) {
      var a = tp.nums[i];
      var b = tp.nums[j];
      var want = stage2 ? [4, 3] : [5, 4];
      if (!((a === want[0] && b === want[1]) || (a === want[1] && b === want[0]))) {
        api.feedback('Let’s join ' + want[0] + ' and ' + want[1] + ' first.', 'info');
        api.say('Try ' + want[0] + ' and ' + want[1] + '.', 'think');
        return false;
      }
      api.later(function () {
        show(a, b, tp.nums[3 - i - j]);
      }, 50);
    });
    function show(a, b, c) {
      var rows = Math.min(a, b);
      var cols = Math.max(a, b);
      var p = a * b;
      MQ.clear(picHost);
      MQ.clear(out);
      picHost.appendChild(trays(1, rows, cols, 'pencil'));
      out.appendChild(el('div', { class: 'sam-sentence' }, times(a, b) + ' = ' + p));
      api.feedback('One tray: ' + rows + ' rows of ' + cols + ' pencils = ' + p + '.', 'info');
      api.say(rows + ' rows of ' + cols + ' pencils. That is ' + p + '.', 'happy');
      api.later(function () {
        MQ.clear(picHost);
        picHost.appendChild(trays(c, rows, cols, 'pencil'));
        out.appendChild(el('div', { class: 'sam-step' }, times(p, c) + ' means ' + c + ' trays of ' + p));
        out.appendChild(MQ.ui.sum(jumpList(p, c).map(function () {
          return p;
        }), p * c));
        api.sound('correct');
        if (!stage2) {
          done1.textContent = '5 × 4 = 20, then 20 × 3 = 60';
          api.say('3 trays of 20 is 60. Now let’s try a different order.', 'cheer');
          var again = el('button', { class: 'btn btn-big', type: 'button' }, 'Try another order');
          again.addEventListener('click', function () {
            again.remove();
            stage2 = true;
            MQ.clear(picHost);
            MQ.clear(out);
            tp.reset([4, 3, 5]);
            api.say('Same three numbers. This time join 4 and 3 first.');
            api.feedback('Drag the 4 onto the 3, or click them both.', 'info');
          });
          out.appendChild(again);
        } else {
          out.appendChild(el('div', { class: 'sam-step sam-same' }, 'Still 60! The order does not change the answer.'));
          api.say('Still 60! Any order works. Pick the easiest pair first.', 'cheer');
          api.feedback('5 × 4 = 20 was the easy pair: 20 + 20 + 20 is quick to add.', 'good');
          api.unlockNext();
        }
      }, 1300);
    }
    stage.appendChild(tp.el);
    stage.appendChild(done1);
    stage.appendChild(picHost);
    stage.appendChild(out);
  }

  // Count the two parts row by row, then add.
  function countParts(api, arr, n, m, k, out, fmt, done) {
    var jA = el('div', { class: 'sam-jrow sam-ja' }, el('span', { class: 'sam-jlab' }, m + ' rows of ' + k + ':'));
    var jB = el('div', { class: 'sam-jrow sam-jb' }, el('span', { class: 'sam-jlab' }, m + ' rows of ' + (n - k) + ':'));
    out.appendChild(jA);
    out.appendChild(jB);
    var steps = [];
    for (var r = 0; r < m; r++) steps.push(['a', r]);
    for (var r2 = 0; r2 < m; r2++) steps.push(['b', r2]);
    steps.forEach(function (s, i) {
      api.later(function () {
        arr.lightRow(s[0], s[1]);
        var part = s[0] === 'a' ? k : n - k;
        var row = s[0] === 'a' ? jA : jB;
        if (s[1]) row.appendChild(el('span', { class: 'sam-arrow' }, '→'));
        row.appendChild(el('span', { class: 'chip sam-chip' }, String(part * (s[1] + 1))));
        api.sound('pop');
      }, 380 * (i + 1));
    });
    api.later(function () {
      arr.unlight();
      arr.showProducts(true);
      out.appendChild(el('div', { class: 'sam-sentence' }, k * m + ' + ' + (n - k) * m + ' = ' + n * m));
      done();
    }, 380 * (steps.length + 1) + 200);
  }

  // 2. Cut 16 after 10.
  function learnCut10(stage, api) {
    api.say('4 rows of 16 stickers. 16 is big! Drag the scissors to cut after 10.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('4 × 16: cut it up', 'Drag the ✂ (or click the array) to cut <b>after 10</b> stickers.'));
    var out = el('div', { class: 'sam-work' });
    var finished = false;
    var arr = cutArray(16, 4, {
      drag: true,
      fmt: 'rows',
      onCut: function (k) {
        if (finished) return;
        if (k !== 10) {
          api.feedback('That cut makes ' + k + ' and ' + (16 - k) + '. Cut after 10: tens are easy!', 'info');
          api.say('Count 10 stickers along a row, then cut.', 'think');
          return;
        }
        finished = true;
        arr.disable();
        api.say('Two smaller arrays! Watch me count each part in jumps.', 'happy');
        countParts(api, arr, 16, 4, 10, out, 'rows', function () {
          api.say('4 × 10 = 40 and 4 × 6 = 24. Add them: 64!', 'cheer');
          api.feedback('So 4 × 16 = 40 + 24 = 64.', 'good');
          api.unlockNext();
        });
      },
    });
    if (arr.unbind) api.cleanup(arr.unbind);
    stage.appendChild(arr.el);
    stage.appendChild(out);
  }

  // 3. Cut 16 into 8 and 8.
  function learnCut8(stage, api) {
    api.say('Another way! Cut the 16 into two equal halves: 8 and 8.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Another way to cut', 'Cut 16 into <b>8 and 8</b>.'));
    var out = el('div', { class: 'sam-work' });
    var finished = false;
    var arr = cutArray(16, 4, {
      drag: true,
      fmt: 'rows',
      onCut: function (k) {
        if (finished) return;
        if (k !== 8) {
          api.feedback('That makes ' + k + ' and ' + (16 - k) + '. Find the middle: 8 on each side.', 'info');
          return;
        }
        finished = true;
        arr.disable();
        countParts(api, arr, 16, 4, 8, out, 'rows', function () {
          out.appendChild(el('div', { class: 'sam-step sam-same' }, 'Same answer: 64! (32 + 32 is double 32.)'));
          api.say('4 × 8 = 32, twice. 32 + 32 = 64. The same answer!', 'cheer');
          api.feedback('Any cut works. Pick the one that is easiest for you.', 'good');
          api.unlockNext();
        });
      },
    });
    if (arr.unbind) api.cleanup(arr.unbind);
    stage.appendChild(arr.el);
    stage.appendChild(out);
  }

  // 4. Write it down: 16 × 4.
  function learnRecord(stage, api) {
    api.say('Let’s write it down. 10 × 4 is the same as 4 × 10. Fill the boxes.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Write it down', '16 × 4: split 16 into <b>10</b> and <b>6</b>.'));
    var arr = cutArray(16, 4, { cut: 10, fmt: 'part' });
    var rec = recorder(16, 4);
    rec.setSplit(10);
    var out = el('div', { class: 'sam-out' });
    stage.appendChild(arr.el);
    stage.appendChild(rec.el);
    stage.appendChild(out);
    focusLater(api, rec.p1);
    var done = false;
    rec.onSubmit(function () {
      if (done) return;
      var a = readBox(rec.p1);
      var b = readBox(rec.p2);
      var t = readBox(rec.tot);
      if (isNaN(a) || isNaN(b) || isNaN(t)) {
        api.feedback('Fill in all three boxes.', 'info');
        return;
      }
      mark(rec.p1, a === 40);
      mark(rec.p2, b === 24);
      mark(rec.tot, t === 64);
      if (a === 40 && b === 24 && t === 64) {
        done = true;
        rec.lock();
        arr.showProducts(true);
        out.appendChild(el('div', { class: 'sam-sentence' }, '16 × 4 = 64'));
        api.sound('correct');
        api.say('Brilliant! Split, multiply each part, then add.', 'cheer');
        api.feedback('10 × 4 = 40, 6 × 4 = 24, 40 + 24 = 64.', 'good');
        api.unlockNext();
        return;
      }
      api.sound('wrong');
      if (a !== 40) api.feedback('10 × 4: count the blue part in tens: 10, 20, 30, 40.', 'try');
      else if (b === 6 || t === 46) api.feedback('The 6 needs × 4 too! Count the orange part: 6, 12, 18, 24.', 'try');
      else if (b !== 24) api.feedback('6 × 4: count the orange rows in 6s: 6, 12, 18, 24.', 'try');
      else api.feedback('Add 40 + 24: 40 + 20 = 60, then 4 more.', 'try');
      api.say('Nearly! Look at the hint.', 'think');
    });
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  // Three-number menu (textbook p.173 Q1, workbook p.155 Q1). best = the easy pair (indices).
  var TRIPLES = [
    { nums: [5, 4, 3], best: [0, 1] },
    { nums: [6, 5, 3], best: [0, 1] },
    { nums: [6, 4, 2], best: [0, 1] },
    { nums: [8, 3, 2], best: [0, 1] },
    { nums: [2, 3, 5], best: [0, 2] },
    { nums: [4, 5, 6], best: [0, 1] },
    { nums: [5, 5, 4], best: [1, 2] },
    { nums: [9, 3, 2], best: [0, 1] },
  ];
  var HIDDEN_TEENS = [
    [19, 2],
    [13, 3],
    [16, 4],
    [17, 5],
    [18, 3],
    [11, 5],
    [14, 4],
    [16, 3],
  ];

  // Indices of two different positions holding values va and vb.
  function pairIdx(nums, va, vb) {
    var i = nums.indexOf(va);
    for (var j = 0; j < 3; j++) if (j !== i && nums[j] === vb) return [i, j];
    return [i, (i + 1) % 3];
  }

  function buildDeck() {
    var out = [];
    var used = {};
    function teen(n, m, mode) {
      var key = n + 'x' + m;
      if (used[key]) return false;
      used[key] = true;
      out.push({ kind: 'teen', n: n, m: m, mode: mode, answer: n * m });
      return true;
    }
    function teenFrom(gen, mode) {
      for (var g = 0; g < 200; g++) {
        var p = gen();
        if (teen(p[0], p[1], mode)) return;
      }
    }
    // Level 1: 11–15 × 2 or × 3, cut fixed at 10 (book: 12 × 2, 15 × 3). Uses both × 2 and × 3.
    var first = U.pick([[12, 2], [15, 3], [14, 2], [13, 3]]);
    teen(first[0], first[1], 'fixed');
    U.shuffle([2, 3]).forEach(function (m) {
      teenFrom(function () {
        return [U.rand(11, 15), m];
      }, 'fixed');
    });
    // Level 2: 11–19 × 4 or × 5, child drags the cut (book: 13 × 4, 18 × 5, 15 × 4, 14 × 5).
    var books = U.shuffle([[13, 4], [18, 5], [15, 4], [14, 5]]);
    var l2start = out.length;
    teen(books[0][0], books[0][1], 'drag');
    if (Math.random() < 0.5) teen(books[1][0], books[1][1], 'drag');
    while (out.length < l2start + 3)
      teenFrom(function () {
        return [U.rand(11, 19), U.pick([4, 5])];
      }, 'drag');
    // Level 3: two three-number products and one teen × 2–5 with no picture.
    var l3 = [];
    U.shuffle(TRIPLES.slice())
      .slice(0, 2)
      .forEach(function (t) {
        var nums = U.shuffle(t.nums.slice());
        var best = pairIdx(nums, t.nums[t.best[0]], t.nums[t.best[1]]);
        l3.push({ kind: 'triple', nums: nums, best: best, answer: nums[0] * nums[1] * nums[2] });
      });
    var hid = U.shuffle(HIDDEN_TEENS.slice());
    for (var h = 0; h < hid.length; h++) {
      var key = hid[h][0] + 'x' + hid[h][1];
      if (!used[key]) {
        used[key] = true;
        l3.push({ kind: 'teen', n: hid[h][0], m: hid[h][1], mode: 'hidden', answer: hid[h][0] * hid[h][1] });
        break;
      }
    }
    U.shuffle(l3).forEach(function (q) {
      out.push(q);
    });
    return out;
  }

  /* ------------------------------------------------------------------ *
   * Practice: teen × 2–5
   * ------------------------------------------------------------------ */
  // Returns null if right, else { hint, tag, bad: [which boxes] }.
  function diagnoseTeen(n, m, s1, s2, a, b, t, strong) {
    var A = s1 * m;
    var B = s2 * m;
    var T = n * m;
    if (s1 + s2 !== n || s1 < 1 || s2 < 1) {
      return {
        tag: 'Split doesn’t add back to the number',
        hint: s1 + ' + ' + s2 + ' = ' + (s1 + s2) + ', not ' + n + '. Your two parts must add up to ' + n + '. Try 10 and ' + (n - 10) + '.',
      };
    }
    if (a === A && b === B && t === T) return null;
    var ones = s1 >= s2 ? s2 : s1; // the part that was "only added"
    var big = s1 >= s2 ? s1 : s2;
    if ((b === s2 && B !== s2) || (a === s1 && A !== s1) || t === A + s2 || t === s1 + B) {
      return {
        tag: 'Only multiplied the tens part',
        hint: 'You multiplied the ' + big + ' but only added the ' + ones + '. The ' + ones + ' needs × ' + m + ' too!' + (strong ? ' Count ' + m + ' rows of ' + ones + ': ' + jumpList(ones, m).slice(0, m - 1).join(', ') + ', …' : ''),
      };
    }
    if (a === s1 + m || b === s2 + m || t === n + m) {
      var part = a === s1 + m ? s1 : b === s2 + m ? s2 : n;
      return {
        tag: 'Added the numbers instead of multiplying',
        hint: part + ' + ' + m + ' is adding. ' + times(part, m) + ' means ' + m + ' lots of ' + part + ': ' + repeatAdd(part, m) + '.',
      };
    }
    if (b !== B) {
      return {
        tag: 'Multiplied the ones by the wrong number',
        hint: strong
          ? times(s2, m) + ': count the orange part in jumps of ' + s2 + ': ' + jumpList(s2, m).slice(0, m - 1).join(', ') + ', …'
          : 'Check ' + times(s2, m) + '. It is ' + m + ' rows of ' + s2 + ' (the orange part).',
      };
    }
    if (a !== A) {
      return {
        tag: 'Times fact slip',
        hint: strong
          ? times(s1, m) + ': count the blue part in jumps of ' + s1 + ': ' + jumpList(s1, m).slice(0, m - 1).join(', ') + ', …'
          : 'Check ' + times(s1, m) + '. It is ' + m + ' rows of ' + s1 + ' (the blue part).',
      };
    }
    return {
      tag: 'Split total added wrongly',
      hint: 'Both parts are right! Now add ' + A + ' + ' + B + '. ' + (strong ? addHelp(A, B) : 'Add the tens first, then the ones.'),
    };
  }

  function renderTeen(stage, api, q) {
    var n = q.n;
    var m = q.m;
    var mode = q.mode;
    var wrap = el('div', { class: 'sam-q', 'data-kind': 'teen', 'data-n': n, 'data-m': m, 'data-mode': mode, 'data-answer': n * m });
    stage.appendChild(wrap);
    wrap.appendChild(
      el('div', { class: 'prompt' }, 'Find ', el('b', null, times(n, m)), mode === 'hidden' ? '. Split ' + n + ' into two parts.' : '  (' + m + ' rows of ' + n + ' stickers)')
    );
    if (mode === 'fixed') api.say('The stickers are cut at 10. Work out each part, then add.');
    else if (mode === 'drag') api.say('Drag the scissors to cut the ' + n + '. Cutting after 10 makes it easy!');
    else api.say('No picture this time. Split ' + n + ' into two parts, like 10 and ' + (n - 10) + '.');

    var k = mode === 'fixed' ? 10 : null;
    var arr = null;
    var arrHost = el('div', { class: 'sam-pic' });
    var rec = recorder(n, m, { editSplit: mode === 'hidden' });
    var out = el('div', { class: 'sam-out' });
    wrap.appendChild(arrHost);
    wrap.appendChild(rec.el);
    wrap.appendChild(out);

    function makeArr(cut, drag) {
      MQ.clear(arrHost);
      arr = cutArray(n, m, { cut: cut, drag: drag, fmt: 'part', onCut: onCut });
      arrHost.appendChild(arr.el);
      if (arr.unbind) api.cleanup(arr.unbind);
    }
    function onCut(kk) {
      k = kk;
      rec.setSplit(kk);
      rec.clearMarks();
      rec.el.classList.remove('sam-hidden');
      var cn = wrap.querySelector('.sam-cutnote');
      if (cn) cn.remove();
      if (kk === 10) api.say('Cut at 10. Now work out ' + times(10, m) + ' and ' + times(n - 10, m) + '.', 'happy');
      else api.say('Cut into ' + kk + ' and ' + (n - kk) + '. That works too! (10 is often easiest.)', 'happy');
      focusLater(api, rec.p1);
    }
    if (mode !== 'hidden') makeArr(k, mode === 'drag');
    if (k != null) rec.setSplit(k);
    if (mode === 'drag') {
      rec.el.classList.add('sam-hidden');
      wrap.insertBefore(el('div', { class: 'sam-note sam-cutnote' }, 'Drag the ✂ (or click between two columns) to cut. Then the boxes appear.'), rec.el);
    }
    if (mode !== 'drag') focusLater(api, mode === 'hidden' ? rec.s1 : rec.p1);

    rec.onSubmit(function () {
      if (api.isAnswered()) return;
      if (mode === 'drag' && k == null) {
        api.feedback('Cut the stickers first: drag the ✂.', 'info');
        return;
      }
      var sp = rec.split();
      var vals = rec.inputs.map(readBox);
      var empty = rec.inputs.filter(function (b, i) {
        return isNaN(vals[i]);
      });
      if (empty.length) {
        shake(api, empty[0]);
        api.feedback('Fill in every box with a number.', 'info');
        return;
      }
      var a = readBox(rec.p1);
      var b = readBox(rec.p2);
      var t = readBox(rec.tot);
      var s1 = sp[0];
      var s2 = sp[1];
      var d = diagnoseTeen(n, m, s1, s2, a, b, t, api.tries() >= 1);
      var splitOk = s1 + s2 === n && s1 >= 1 && s2 >= 1;
      if (mode === 'hidden') {
        mark(rec.s1, splitOk);
        mark(rec.s2, splitOk);
      }
      mark(rec.p1, splitOk && a === s1 * m);
      mark(rec.p2, splitOk && b === s2 * m);
      mark(rec.tot, t === n * m);
      if (!d) {
        rec.lock();
        if (arr) {
          arr.set(s1);
          arr.disable();
          arr.showProducts(true);
        }
        MQ.clear(out);
        out.appendChild(el('div', { class: 'sam-sentence' }, times(n, m) + ' = ' + s1 * m + ' + ' + s2 * m + ' = ' + n * m));
        api.check(true, 'Yes! ' + times(s1, m) + ' = ' + s1 * m + ' and ' + times(s2, m) + ' = ' + s2 * m + '. Together ' + n * m + '.');
        return;
      }
      if (mode === 'hidden') {
        // After a wrong try, show the picture to help.
        var cut = splitOk ? s1 : 10;
        if (!arr) {
          makeArr(cut, false);
          api.later(function () {
            api.say('Here is the picture to help: ' + m + ' rows of ' + n + '.', 'think');
          }, 1800);
        } else arr.set(cut);
      }
      api.check(false, d.hint, d.tag);
    });

    api.onReveal(function () {
      var kk = mode === 'drag' && k != null ? k : 10;
      k = kk;
      if (!arr) makeArr(kk, false);
      arr.set(kk);
      arr.disable();
      arr.showProducts(true);
      rec.el.classList.remove('sam-hidden');
      rec.fill(kk);
      rec.lock();
      var note = wrap.querySelector('.sam-cutnote');
      if (note) note.remove();
      MQ.clear(out);
      out.appendChild(working(n, m, kk, n - kk));
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice: three-number product
   * ------------------------------------------------------------------ */
  function renderTriple(stage, api, q) {
    var nums = q.nums;
    var T = q.answer;
    var sum = nums[0] + nums[1] + nums[2];
    var wrap = el('div', { class: 'sam-q', 'data-kind': 'triple', 'data-nums': nums.join(','), 'data-answer': T });
    stage.appendChild(wrap);
    var title = nums.join(' × ');
    wrap.appendChild(el('div', { class: 'prompt' }, 'Find ', el('b', null, title), '. Which two numbers first?'));
    api.say('Pick the easiest pair. Drag one number onto another, or click two numbers.');
    var pair = null;
    var picHost = el('div', { class: 'sam-pic' });
    var steps = el('div', { class: 'sam-out' });
    var ans = box('Final answer');
    var checkBtn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    var again = el('button', { class: 'btn btn-ghost sam-again', type: 'button' }, '↺ Pick a different pair');
    var answerRow = el('div', { class: 'sam-answer sam-hidden' }, el('span', { class: 'sam-eq' }, title + ' ='), ans, checkBtn);
    var tp = tilePicker(api, nums, function (i, j) {
      if (api.isAnswered()) return false;
      api.later(function () {
        show(i, j);
      }, 30);
    });
    wrap.appendChild(tp.el);
    wrap.appendChild(picHost);
    wrap.appendChild(steps);
    wrap.appendChild(answerRow);
    wrap.appendChild(again);
    again.classList.add('sam-hidden');

    function show(i, j, reveal) {
      var a = nums[i];
      var b = nums[j];
      var c = nums[3 - i - j];
      var p = a * b;
      pair = { a: a, b: b, c: c, p: p, i: i, j: j };
      MQ.clear(picHost);
      MQ.clear(steps);
      picHost.appendChild(trays(c, Math.min(a, b), Math.max(a, b), 'dot'));
      steps.appendChild(el('div', { class: 'sam-sentence' }, times(a, b) + ' = ' + p));
      steps.appendChild(el('div', { class: 'sam-step' }, 'Then ' + times(p, c) + ' = ' + repeatAdd(p, c) + (reveal ? ' = ' + T : '')));
      steps.appendChild(el('div', { class: 'sam-note' }, c + ' trays with ' + p + ' in each.'));
      answerRow.classList.remove('sam-hidden');
      if (!reveal) {
        again.classList.remove('sam-hidden');
        var easy = p % 10 === 0;
        api.say(times(a, b) + ' = ' + p + '. ' + (easy ? 'Nice easy pair! ' : '') + 'Now ' + times(p, c) + '.', 'happy');
        focusLater(api, ans);
      }
    }
    again.addEventListener('click', function () {
      if (api.isAnswered()) return;
      pair = null;
      MQ.clear(picHost);
      MQ.clear(steps);
      answerRow.classList.add('sam-hidden');
      again.classList.add('sam-hidden');
      tp.reset();
      api.say('OK! Pick two numbers again.');
    });

    function submit() {
      if (api.isAnswered() || !pair) return;
      var raw = String(ans.value).replace(/\s+/g, '');
      var v = readBox(ans);
      if (isNaN(v)) {
        shake(api, ans);
        api.feedback('Type the answer as a number.', 'info');
        return;
      }
      mark(ans, v === T);
      if (v === T) {
        ans.disabled = true;
        checkBtn.disabled = true;
        tp.disable();
        again.classList.add('sam-hidden');
        api.check(true, 'Yes! ' + times(pair.a, pair.b) + ' = ' + pair.p + ', and ' + times(pair.p, pair.c) + ' = ' + T + '.');
        return;
      }
      var strong = api.tries() >= 1;
      var p = pair.p;
      var c = pair.c;
      var hint;
      var tag;
      if (v === sum) {
        tag = 'Added the numbers instead of multiplying';
        hint = nums.join(' + ') + ' = ' + sum + '. But we need ×, not +. Start with ' + times(pair.a, pair.b) + ' = ' + p + '.';
      } else if (v === p + c) {
        tag = 'Added the numbers instead of multiplying';
        hint = 'You added the ' + c + '. ' + times(p, c) + ' means ' + c + ' lots of ' + p + ': ' + repeatAdd(p, c) + '.';
      } else if (v === p) {
        tag = 'Stopped after the first pair';
        hint = 'That is just ' + times(pair.a, pair.b) + '. Now multiply by ' + c + ' too: ' + repeatAdd(p, c) + '.';
      } else if (T >= 100 && (v >= 1000 || v * 10 === T || raw.length > 3)) {
        tag = '3-digit product written wrongly';
        hint =
          v * 10 === T
            ? 'Too small! You missed a digit. Ten tens make 100, so the answer is more than 100.'
            : 'That has too many digits! The answer is between 100 and 199, so it has just 3 digits. Write the hundreds, tens and ones together.';
      } else {
        tag = 'Times fact slip';
        var jl = jumpList(p, c);
        hint = strong ? 'Count in ' + p + 's, one jump for each tray: ' + jl.slice(0, c - 1).join(', ') + ', …' : 'Add up the trays: ' + repeatAdd(p, c) + '. Count in ' + p + 's.';
      }
      api.check(false, hint, tag);
    }
    checkBtn.addEventListener('click', submit);
    ans.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    });

    api.onReveal(function () {
      if (!pair || pair.p % 10 !== 0) {
        tp.force(q.best[0], q.best[1]);
        show(q.best[0], q.best[1], true);
      } else show(pair.i, pair.j, true); // the child's pair was an easy one: finish its working
      tp.disable();
      again.classList.add('sam-hidden');
      ans.value = T;
      ans.classList.remove('bad');
      ans.classList.add('good');
      ans.disabled = true;
      checkBtn.disabled = true;
      steps.appendChild(MQ.ui.sum(jumpList(pair.p, pair.c).map(function () {
        return pair.p;
      }), T));
    });
  }

  /* ------------------------------------------------------------------ *
   * Register
   * ------------------------------------------------------------------ */
  var deck = null;
  MQ.register(ID, {
    _buildDeck: buildDeck, // used only by test scripts
    learn: [learnOrder, learnCut10, learnCut8, learnRecord],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (api.index === 0 || !deck) deck = buildDeck();
        var q = deck[api.index];
        if (q.kind === 'triple') renderTriple(stage, api, q);
        else renderTeen(stage, api, q);
      },
    },
  });

  document.head.appendChild(
    el(
      'style',
      { 'data-activity': ID },
      [
        '.sam-q{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;}',
        '.sam-pic{display:flex;justify-content:center;width:100%;}',
        '.sam-pic:empty{display:none;}',
        '.sam-arr{user-select:none;touch-action:none;}',
        '.sam-st-c{fill:#9fb0cc;stroke:#7d8fae;stroke-width:1.5;transition:fill .2s;}',
        '.sam-st-shine{fill:#fff;opacity:.55;pointer-events:none;}',
        '.sam-st{pointer-events:none;}',
        '.sam-st.sam-a .sam-st-c{fill:#5b9bf0;stroke:#2f6fc4;}',
        '.sam-st.sam-b .sam-st-c{fill:#f7a24b;stroke:#c86e14;}',
        '.sam-st.sam-lit .sam-st-c{stroke:#1f2937;stroke-width:3;}',
        '.sam-lab{font-size:20px;font-weight:800;fill:#1f2937;}',
        '.sam-lab-a{fill:#1d5fb4;}',
        '.sam-lab-b{fill:#b45309;}',
        '.sam-cut-line{stroke:#e63946;stroke-width:4;stroke-dasharray:8 5;stroke-linecap:round;}',
        '.sam-handle-c{fill:#fff;stroke:#e63946;stroke-width:3;}',
        '.sam-handle-t{font-size:20px;fill:#e63946;font-weight:800;}',
        '.sam-cut-drag{cursor:grab;}',
        '.sam-park .sam-handle{animation:sam-bob 1.2s ease-in-out infinite;}',
        '.sam-park .sam-cut-line{opacity:.35;}',
        '@keyframes sam-bob{50%{transform:translateX(-8px);}}',
        '.sam-tiles{user-select:none;touch-action:none;}',
        '.sam-tile-r{fill:#fff7e0;stroke:#e0b54a;stroke-width:3;}',
        '.sam-tile-t{font-size:44px;font-weight:800;fill:#1f2937;pointer-events:none;}',
        '.sam-tile-x{font-size:34px;font-weight:800;fill:#6b7280;}',
        '.sam-live{cursor:grab;}',
        '.sam-live:hover .sam-tile-r{stroke:var(--accent);}',
        '.sam-sel .sam-tile-r{fill:#d9f2ef;stroke:#0b6e66;stroke-width:4;}',
        '.sam-pairbox{fill:#e7f0ff;stroke:#5b9bf0;stroke-width:3;stroke-dasharray:6 4;}',
        '.sam-in .sam-tile-r{fill:#dbeafe;stroke:#2f6fc4;}',
        '.sam-off{opacity:.85;}',
        '.sam-tray-r{fill:#f3efe6;stroke:#b9a98a;stroke-width:2;}',
        '.sam-tray-l{font-size:16px;font-weight:800;fill:#4b5563;}',
        '.sam-pen-b{fill:#ffd166;stroke:#c99a2e;stroke-width:1;}',
        '.sam-pen-e{fill:#f4a4b8;}',
        '.sam-pen-t{fill:#f1d1a7;stroke:#a07a4a;stroke-width:.8;}',
        '.sam-dot{fill:#2a9d8f;}',
        '.sam-out,.sam-work{display:flex;flex-direction:column;align-items:center;gap:8px;}',
        '.sam-sentence{font-size:1.7rem;font-weight:800;background:#fff3cd;border:2px solid var(--gold);border-radius:14px;padding:4px 16px;text-align:center;}',
        '.sam-step{font-size:1.25rem;font-weight:800;text-align:center;}',
        '.sam-same{color:var(--good);}',
        '.sam-done{font-size:1.05rem;font-weight:700;color:var(--ink-soft);}',
        '.sam-done:empty{display:none;}',
        '.sam-note{font-size:1.05rem;font-weight:700;color:var(--ink-soft);text-align:center;}',
        '.sam-jrow{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:5px;font-weight:800;font-size:1.1rem;}',
        '.sam-jlab{margin-right:4px;}',
        '.sam-ja .sam-jlab{color:#1d5fb4;}',
        '.sam-jb .sam-jlab{color:#b45309;}',
        '.sam-ja .sam-chip{background:#e3efff;border-color:#9cc2f5;}',
        '.sam-jb .sam-chip{background:#fff0de;border-color:#f5c48e;}',
        '.sam-chip{padding:3px 10px;}',
        '.sam-arrow{color:var(--ink-soft);}',
        '.sam-recwrap{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:16px;}',
        '.sam-rec{display:grid;grid-template-columns:auto auto auto;align-items:center;gap:6px 10px;}',
        '.sam-cell{display:flex;align-items:center;gap:8px;}',
        '.sam-r{justify-content:flex-end;}',
        '.sam-op{font-size:1.6rem;font-weight:800;}',
        '.sam-big{color:#0b6e66;}',
        '.sam-num{font-size:1.6rem;font-weight:800;min-width:30px;text-align:right;}',
        '.sam-ta{color:#1d5fb4;}',
        '.sam-tb{color:#b45309;}',
        '.sam-mir{font-size:1.4rem;font-weight:800;min-width:28px;text-align:center;}',
        '.sam-box{width:84px;height:54px;font-size:1.6rem;font-weight:800;text-align:center;border-radius:12px;border:3px solid var(--line);font-family:inherit;color:var(--ink);background:#fff;}',
        '.sam-box-s{width:64px;}',
        '.sam-bxa{border-left:8px solid #5b9bf0;}',
        '.sam-bxb{border-left:8px solid #f7a24b;}',
        '.sam-box.good{border-color:var(--good);background:var(--good-bg);}',
        '.sam-box.bad{border-color:var(--try);background:var(--try-bg);}',
        '.sam-answer{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px;}',
        '.sam-eq{font-size:1.7rem;font-weight:800;}',
        '.sam-hidden{display:none!important;}',
        '@media (max-width:860px){.sam-box{width:70px;height:50px;font-size:1.4rem;}.sam-box-s{width:56px;}.sam-sentence{font-size:1.4rem;}.sam-op,.sam-num{font-size:1.35rem;}}',
      ].join('\n')
    )
  );
})();

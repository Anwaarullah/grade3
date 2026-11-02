/* Tens Make a Hundred — adding 2- and 3-digit numbers, regrouping 10 tens as 1 hundred (Unit 9.1).
 * Place value mat with tens sticks and ones cubes, "swap 10 tens for 1 hundred", estimate first,
 * and the workbook's written layout: ones, tens and hundreds written at full value, then added.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  /* ---------------------------------------------------------------- *
   * Number helpers
   * ---------------------------------------------------------------- */
  function digits(n) {
    return { h: Math.floor(n / 100), t: Math.floor(n / 10) % 10, o: n % 10 };
  }
  function total(nums) {
    return nums.reduce(function (s, n) { return s + n; }, 0);
  }
  function round10(n) {
    return Math.round(n / 10) * 10;
  }
  function estimateOf(nums) {
    return nums.reduce(function (s, n) { return s + round10(n); }, 0);
  }
  /** Partial sums at full value: ones, tens, hundreds. */
  function parts(nums) {
    var p = { o: 0, t: 0, h: 0, td: 0, hd: 0 };
    nums.forEach(function (n) {
      var d = digits(n);
      p.o += d.o;
      p.td += d.t;
      p.hd += d.h;
    });
    p.t = p.td * 10;
    p.h = p.hd * 100;
    return p;
  }
  /** Tens in the tens column after the ones have been regrouped. */
  function tensAfterCarry(nums) {
    var p = parts(nums);
    return p.td + Math.floor(p.o / 10);
  }
  /** What you get by writing each column total without regrouping (e.g. 245 + 83 → "2128"). */
  function noRegroupWrite(nums) {
    var p = parts(nums);
    return parseInt((p.hd ? String(p.hd) : '') + String(p.td) + String(p.o), 10);
  }
  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : many);
  }
  function terms(nums, k, mult) {
    return nums
      .map(function (n) { return digits(n)[k] * mult; })
      .filter(function (v) { return v > 0; });
  }
  function sumText(nums) {
    return nums.join(' + ');
  }

  /* ---------------------------------------------------------------- *
   * Mistake diagnosis for a typed total
   * ---------------------------------------------------------------- */
  function diagnose(nums, ans, tries) {
    var correct = total(nums);
    var p = parts(nums);
    var d = ans - correct;
    var tc = tensAfterCarry(nums);
    var walk = 'Ones: ' + terms(nums, 'o', 1).join(' + ') + ' = ' + p.o + '. Tens: ' + (terms(nums, 't', 10).join(' + ') || '0') + ' = ' + p.t + '.' + (p.h ? ' Hundreds: ' + p.h + '.' : '') + ' Now add those parts.';
    var out;
    var written = noRegroupWrite(nums);
    if (ans === written && written !== correct) {
      if (p.o >= 10) out = { tag: 'Wrote more than 9 ones in the ones place', hint: 'The ones make ' + p.o + '. That is 1 ten and ' + (p.o - 10) + ' ones. Swap 10 ones for a ten!' };
      else out = { tag: 'Wrote more than 9 tens in the tens place', hint: 'The tens make ' + p.td + ' tens. 10 tens make 1 hundred. Swap them!' };
    } else if (d === -100 && tc >= 10) {
      out = { tag: 'Forgot the regrouped hundred', hint: 'So close! The tens made ' + tc + ' tens. Did you add the new hundred?' };
    } else if (d === -10 && p.o >= 10) {
      out = { tag: 'Forgot the regrouped ten', hint: 'So close! The ones made ' + p.o + '. Did you add the new ten?' };
    } else if (Math.abs(d) === 10) {
      out = { tag: 'Tens added wrongly', hint: 'Nearly! Check the tens again.' };
    } else if (Math.abs(d) === 100) {
      out = { tag: 'Hundreds added wrongly', hint: 'Nearly! Check the hundreds again.' };
    } else if (Math.abs(d) <= 3) {
      out = { tag: 'Ones added wrongly', hint: 'Very close! Add the ones again.' };
    } else {
      out = { tag: 'Total not right', hint: 'Add the ones first. Then add the tens.' };
    }
    if (tries >= 1) out.hint = walk;
    return out;
  }

  /* ---------------------------------------------------------------- *
   * Place value mat (SVG). Rows: each number, then a Total row.
   * ---------------------------------------------------------------- */
  var VBW = 820;
  var HEAD = 34;
  var RH = 96;
  var GAP = 6;
  var CX = { h: 110, t: 350, o: 690 };
  var CW = { h: 240, t: 340, o: 120 };
  var NAMES = { h: 'Hundreds', t: 'Tens', o: 'Ones' };
  var SRC = ['a', 'b', 'c'];

  function flat(x, y, cls) {
    var g = svg('g', { class: 'tmh-piece tmh-flat ' + cls });
    g.appendChild(svg('rect', { x: x, y: y, width: 40, height: 40, rx: 2, class: 'tmh-body' }));
    var d = '';
    for (var i = 1; i < 10; i++) d += 'M' + (x + i * 4) + ' ' + y + 'v40M' + x + ' ' + (y + i * 4) + 'h40';
    g.appendChild(svg('path', { d: d, class: 'tmh-lines' }));
    return g;
  }
  function stick(x, y, cls) {
    var g = svg('g', { class: 'tmh-piece tmh-stick ' + cls });
    g.appendChild(svg('rect', { x: x, y: y, width: 12, height: 76, rx: 2, class: 'tmh-body' }));
    var d = '';
    for (var i = 1; i < 10; i++) d += 'M' + x + ' ' + (y + i * 7.6) + 'h12';
    g.appendChild(svg('path', { d: d, class: 'tmh-lines' }));
    return g;
  }
  function cube(x, y, cls) {
    return svg('rect', { x: x, y: y, width: 16, height: 16, rx: 2, class: 'tmh-piece tmh-cube tmh-body ' + cls });
  }
  function piecePos(k, i, top) {
    if (k === 'h') return { x: CX.h + 12 + (i % 5) * 46, y: top + 6 + Math.floor(i / 5) * 44 };
    if (k === 't') return { x: CX.t + 10 + i * 16 + Math.floor(i / 5) * 8, y: top + 10 };
    var f = Math.floor(i / 10);
    var j = i % 10;
    return { x: CX.o + 12 + (j % 5) * 19, y: top + 8 + f * 44 + Math.floor(j / 5) * 19 };
  }
  function makePiece(k, i, top, cls) {
    var p = piecePos(k, i, top);
    return k === 'h' ? flat(p.x, p.y, cls) : k === 't' ? stick(p.x, p.y, cls) : cube(p.x, p.y, cls);
  }

  /**
   * opts: nums, dragRows (drag/click a group into the Total row), swappable (show the 10-bundle
   * frames and let the child click or drag them to swap), onChange(what).
   */
  function makeMat(api, opts) {
    var nums = opts.nums;
    var nRows = nums.length + 1;
    var H = HEAD + nRows * RH + (nRows - 1) * GAP + 4;
    var root = svg('svg', { viewBox: '0 0 ' + VBW + ' ' + H, class: 'tmh-mat-svg', width: VBW, height: H, style: { maxWidth: '100%', height: 'auto' }, role: 'img', 'aria-label': 'Place value mat' });
    var tops = [];
    var r;
    ['h', 't', 'o'].forEach(function (k) {
      root.appendChild(svg('rect', { x: CX[k] + 2, y: 2, width: CW[k] - 4, height: HEAD - 6, rx: 8, class: 'tmh-head tmh-head-' + k }));
      root.appendChild(svg('text', { x: CX[k] + CW[k] / 2, y: HEAD - 11, 'text-anchor': 'middle', class: 'tmh-head-text' }, NAMES[k]));
    });
    for (r = 0; r < nRows; r++) {
      var top = HEAD + r * (RH + GAP);
      tops.push(top);
      var isTotal = r === nRows - 1;
      ['h', 't', 'o'].forEach(function (k) {
        root.appendChild(svg('rect', { x: CX[k] + 2, y: top, width: CW[k] - 4, height: RH, rx: 10, class: 'tmh-cell' + (isTotal ? ' tmh-cell-total' : '') }));
      });
      if (isTotal) {
        root.appendChild(svg('text', { x: 56, y: top + RH / 2 + 8, 'text-anchor': 'middle', class: 'tmh-rlabel tmh-rlabel-total' }, 'Total'));
      } else {
        root.appendChild(svg('text', { x: 56, y: top + RH / 2 + 11, 'text-anchor': 'middle', class: 'tmh-rlabel tmh-rl-' + SRC[r] }, (r > 0 ? '+ ' : '') + nums[r]));
      }
    }
    var totalTop = tops[nRows - 1];

    var groups = nums.map(function (n, ri) {
      var d = digits(n);
      var out = {};
      ['h', 't', 'o'].forEach(function (k) {
        var g = svg('g', { class: 'tmh-grp tmh-r' + ri + ' tmh-k-' + k });
        // Invisible grab area over the whole cell, so the gaps between pieces still catch the mouse.
        if (d[k]) g.appendChild(svg('rect', { x: CX[k] + 4, y: tops[ri] + 2, width: CW[k] - 8, height: RH - 4, class: 'tmh-hit' }));
        for (var i = 0; i < d[k]; i++) g.appendChild(makePiece(k, i, tops[ri], 'tmh-' + SRC[ri]));
        root.appendChild(g);
        out[k] = { g: g, n: d[k], moved: d[k] === 0, src: SRC[ri] };
      });
      return out;
    });

    var totalG = svg('g', { class: 'tmh-total' });
    var bundleT = svg('g', { class: 'tmh-bundle tmh-bundle-t' });
    var bundleO = svg('g', { class: 'tmh-bundle tmh-bundle-o' });
    root.appendChild(totalG);
    root.appendChild(bundleT);
    root.appendChild(bundleO);

    var state = { h: [], t: [], o: [] };
    var els = { h: [], t: [], o: [] };
    var busy = false;
    var swappable = opts.swappable !== false;

    function drawTotal() {
      MQ.clear(totalG);
      MQ.clear(bundleT);
      MQ.clear(bundleO);
      bundleT.removeAttribute('transform');
      bundleO.removeAttribute('transform');
      ['h', 't', 'o'].forEach(function (k) {
        els[k] = [];
        var n = state[k].length;
        var bundle = swappable && n >= 10 && k !== 'h' ? (k === 't' ? bundleT : bundleO) : null;
        if (bundle) {
          var fr;
          if (k === 't') fr = { x: CX.t + 5, y: totalTop + 4, width: 9 * 16 + 8 + 12 + 10, height: 88 };
          else fr = { x: CX.o + 7, y: totalTop + 3, width: 4 * 19 + 16 + 10, height: 45 };
          bundle.appendChild(svg('rect', Object.assign({ rx: 8, class: 'tmh-frame' }, fr)));
        }
        state[k].forEach(function (pc, i) {
          var node = makePiece(k, i, totalTop, 'tmh-' + pc.src + (pc.fresh ? ' tmh-new' : ''));
          pc.fresh = false;
          els[k].push(node);
          if (bundle && i < 10) bundle.appendChild(node);
          else totalG.appendChild(node);
        });
      });
    }

    var mat = {
      svg: root,
      groups: groups,
      tops: tops,
      onChange: opts.onChange || null,
      counts: function () {
        return { h: state.h.length, t: state.t.length, o: state.o.length };
      },
      value: function () {
        return state.h.length * 100 + state.t.length * 10 + state.o.length;
      },
      allMoved: function () {
        return groups.every(function (g) { return g.h.moved && g.t.moved && g.o.moved; });
      },
      isBusy: function () {
        return busy;
      },
      moveRow: function (ri, k) {
        var grp = groups[ri][k];
        if (grp.moved) return;
        grp.moved = true;
        grp.g.classList.add('tmh-gone');
        grp.g.removeAttribute('transform');
        for (var i = 0; i < grp.n; i++) state[k].push({ src: grp.src });
        drawTotal();
        api.sound('pop');
        if (mat.onChange) mat.onChange('move');
      },
      combine: function () {
        groups.forEach(function (g, ri) {
          ['h', 't', 'o'].forEach(function (k) {
            if (!g[k].moved) {
              g[k].moved = true;
              g[k].g.classList.add('tmh-gone');
              g[k].g.removeAttribute('transform');
              for (var i = 0; i < g[k].n; i++) state[k].push({ src: g[k].src });
            }
          });
        });
        drawTotal();
        if (mat.onChange) mat.onChange('move');
      },
      /** Swap 10 ones for a ten (k='o') or 10 tens for a hundred (k='t'). */
      swap: function (k, instant) {
        if (busy || state[k].length < 10) return false;
        var up = k === 'o' ? 't' : 'h';
        function done() {
          state[k].splice(0, 10);
          state[up].push({ src: 'n', fresh: !instant });
          busy = false;
          drawTotal();
          if (mat.onChange) mat.onChange('swap-' + k);
        }
        if (instant) {
          done();
          return true;
        }
        busy = true;
        api.sound('pop');
        for (var i = 0; i < 10; i++) els[k][i].classList.add('tmh-leave');
        var b = k === 't' ? bundleT : bundleO;
        if (b.firstChild) b.firstChild.classList.add('tmh-leave');
        api.later(done, 450);
        return true;
      },
      /** Put everything together and do every swap (for "Show me"). */
      finish: function () {
        busy = false;
        mat.combine();
        while (state.o.length >= 10) mat.swap('o', true);
        while (state.t.length >= 10) mat.swap('t', true);
      },
    };

    // Drag (or click) a row group into the Total row.
    if (opts.dragRows) {
      groups.forEach(function (g, ri) {
        ['h', 't', 'o'].forEach(function (k) {
          var grp = g[k];
          if (!grp.n) return;
          var last = { dx: 0, dy: 0 };
          api.cleanup(
            MQ.ui.drag(root, grp.g, {
              start: function () {
                last = { dx: 0, dy: 0 };
              },
              move: function (p, dx, dy) {
                if (grp.moved) return;
                last = { dx: dx, dy: dy };
                grp.g.setAttribute('transform', 'translate(' + dx + ',' + dy + ')');
              },
              end: function (p) {
                if (grp.moved) return;
                var click = Math.abs(last.dx) + Math.abs(last.dy) < 6;
                if (click || p.y > totalTop - 10) mat.moveRow(ri, k);
                else grp.g.removeAttribute('transform');
              },
            })
          );
        });
      });
    }

    // Click or drag the dashed 10-bundle into the next column to swap it.
    if (swappable) {
      [
        [bundleT, 't', CX.t + 6],
        [bundleO, 'o', CX.o + 4],
      ].forEach(function (b) {
        var last = { dx: 0, dy: 0 };
        api.cleanup(
          MQ.ui.drag(root, b[0], {
            start: function () {
              last = { dx: 0, dy: 0 };
            },
            move: function (p, dx, dy) {
              if (busy) return;
              last = { dx: dx, dy: dy };
              b[0].setAttribute('transform', 'translate(' + dx + ',' + dy + ')');
            },
            end: function (p) {
              if (busy) return;
              var click = Math.abs(last.dx) + Math.abs(last.dy) < 6;
              if (click || p.x < b[2]) {
                b[0].removeAttribute('transform');
                mat.swap(b[1]);
              } else b[0].removeAttribute('transform');
            },
          })
        );
      });
    }

    drawTotal();
    return mat;
  }

  /** "Put them together" and swap buttons that drive a mat. */
  function matTools(mat) {
    var put = el('button', { class: 'btn tmh-tool', type: 'button', onclick: function () { mat.combine(); } }, 'Put them together ⬇');
    var so = el('button', { class: 'btn tmh-tool tmh-tool-swap', type: 'button', onclick: function () { mat.swap('o'); } }, 'Swap 10 ones → 1 ten');
    var st = el('button', { class: 'btn tmh-tool tmh-tool-swap', type: 'button', onclick: function () { mat.swap('t'); } }, 'Swap 10 tens → 1 hundred');
    var box = el('div', { class: 'tmh-tools' }, put, so, st);
    box.refresh = function () {
      var c = mat.counts();
      put.hidden = mat.allMoved();
      so.hidden = !(mat.allMoved() && c.o >= 10);
      st.hidden = !(mat.allMoved() && c.t >= 10);
    };
    box.disable = function () {
      put.hidden = so.hidden = st.hidden = true;
    };
    box.refresh();
    return box;
  }

  /** Partial-sum working: Ones / Tens / Hundreds / Total, each at full value. */
  function workingEl(nums) {
    var p = parts(nums);
    var box = el('div', { class: 'tmh-work' });
    function line(name, list, value) {
      box.appendChild(el('div', { class: 'tmh-work-line' }, el('span', { class: 'tmh-work-name' }, name), el('span', null, list.length > 1 ? list.join(' + ') + ' = ' : ''), el('b', null, String(value))));
    }
    line('Ones', terms(nums, 'o', 1).length ? terms(nums, 'o', 1) : [0], p.o);
    if (p.t) line('Tens', terms(nums, 't', 10), p.t);
    if (p.h) line('Hundreds', terms(nums, 'h', 100), p.h);
    var ps = [p.o, p.t, p.h].filter(function (v) { return v > 0; });
    box.appendChild(el('div', { class: 'tmh-work-line tmh-work-total' }, el('span', { class: 'tmh-work-name' }, 'Total'), el('span', null, ps.length > 1 ? ps.join(' + ') + ' = ' : ''), el('b', null, String(total(nums)))));
    return box;
  }

  /* ---------------------------------------------------------------- *
   * Stacked (column) layout with partial sums at full value
   * ---------------------------------------------------------------- */
  var PART_NAME = { o: 'ones', t: 'tens', h: 'hundreds', total: 'total' };
  function stackView(nums) {
    var grid = el('div', { class: 'tmh-stack', role: 'table', 'aria-label': 'Column addition' });
    var addCells = [];
    var rowCells = {};
    function cell(txt, cls) {
      var c = el('div', { class: 'tmh-s ' + (cls || '') }, txt == null ? '' : String(txt));
      grid.appendChild(c);
      return c;
    }
    cell('');
    cell('H', 'tmh-s-head');
    cell('T', 'tmh-s-head');
    cell('O', 'tmh-s-head');
    cell('');
    nums.forEach(function (n, r) {
      var d = digits(n);
      cell(r === nums.length - 1 ? '+' : '', 'tmh-s-op');
      addCells.push({ h: cell(d.h || '', 'tmh-s-d tmh-col-h'), t: cell(n >= 10 ? d.t : '', 'tmh-s-d tmh-col-t'), o: cell(d.o, 'tmh-s-d tmh-col-o') });
      cell('');
    });
    grid.appendChild(el('div', { class: 'tmh-s-rule' }));
    ['o', 't', 'h', 'rule', 'total'].forEach(function (key) {
      if (key === 'rule') {
        grid.appendChild(el('div', { class: 'tmh-s-rule' }));
        return;
      }
      cell('');
      rowCells[key] = { cells: [cell('', 'tmh-s-d tmh-s-part'), cell('', 'tmh-s-d tmh-s-part'), cell('', 'tmh-s-d tmh-s-part')], label: cell(PART_NAME[key], 'tmh-s-label') };
    });
    var view = {
      el: el('div', { class: 'tmh-stack-wrap' }, grid),
      set: function (key, value) {
        var s = String(value);
        var cs = rowCells[key].cells;
        for (var i = 0; i < 3; i++) {
          var ch = s.length - 3 + i >= 0 ? s.charAt(s.length - 3 + i) : '';
          cs[i].textContent = ch;
          cs[i].classList.remove('tmh-ask');
          cs[i].classList.add('tmh-filled');
        }
      },
      ask: function (key) {
        Object.keys(rowCells).forEach(function (k) {
          rowCells[k].cells.forEach(function (c) { c.classList.toggle('tmh-ask', k === key); });
          rowCells[k].label.classList.toggle('tmh-s-label-on', k === key);
        });
      },
      col: function (k) {
        addCells.forEach(function (row) {
          ['h', 't', 'o'].forEach(function (kk) { row[kk].classList.toggle('tmh-col-on', kk === k); });
        });
      },
      fillAll: function () {
        var p = parts(nums);
        view.set('o', p.o);
        view.set('t', p.t);
        view.set('h', p.h);
        view.set('total', total(nums));
        view.ask(null);
        view.col(null);
      },
    };
    return view;
  }

  /** Steps for the stacked layout: ones, tens, hundreds, then the total. */
  function stackSteps(nums) {
    var p = parts(nums);
    var oT = terms(nums, 'o', 1);
    var tT = terms(nums, 't', 10);
    var hT = terms(nums, 'h', 100);
    return [
      { key: 'o', col: 'o', val: p.o, say: 'Ones first: ' + (oT.length ? oT.join(' + ') : '0') + '.', label: 'Ones' },
      { key: 't', col: 't', val: p.t, say: 'Now the tens: ' + tT.join(' + ') + '. Write the full value.', label: 'Tens' },
      { key: 'h', col: 'h', val: p.h, say: 'Now the hundreds: ' + hT.join(' + ') + '.', label: 'Hundreds' },
      { key: 'total', col: null, val: total(nums), say: 'Add the three parts: ' + [p.o, p.t, p.h].join(' + ') + '.', label: 'Total' },
    ];
  }
  /** Hint + tag for a wrong step in the stacked layout. */
  function stepMiss(nums, step, ans, tries) {
    var p = parts(nums);
    if (step.key === 'o') {
      return { tag: 'Ones added wrongly', hint: tries >= 1 ? 'Add only the ones digits: ' + terms(nums, 'o', 1).join(' + ') + '. Count on from the biggest.' : 'Add just the ones column: the last digit of each number.' };
    }
    if (step.key === 't') {
      if (ans === p.td) return { tag: 'Wrote a part at face value (14 not 140)', hint: p.td + ' tens is ' + p.t + '. Write the full value!' };
      return { tag: 'Tens added wrongly', hint: tries >= 1 ? 'Count the tens: ' + nums.map(function (n) { return digits(n).t; }).join(' + ') + ' = ' + p.td + ' tens. How much is ' + p.td + ' tens?' : 'Add the tens digits, then write the full value in tens.' };
    }
    if (step.key === 'h') {
      if (ans === p.hd) return { tag: 'Wrote a part at face value (14 not 140)', hint: p.hd + ' hundreds is ' + p.h + '. Write the full value!' };
      return { tag: 'Hundreds added wrongly', hint: tries >= 1 ? 'Count the hundreds: ' + nums.map(function (n) { return digits(n).h; }).join(' + ') + ' = ' + p.hd + ' hundreds.' : 'Add the hundreds digits, then write the full value.' };
    }
    var d = diagnose(nums, ans, tries);
    if (tries >= 1) d.hint = 'Add the three parts: ' + p.o + ' + ' + p.t + ' + ' + p.h + '. Ones, then tens, then hundreds.';
    else if (d.tag === 'Total not right') d.hint = 'Add the three parts you wrote: ' + p.o + ' + ' + p.t + ' + ' + p.h + '.';
    return d;
  }

  /* ---------------------------------------------------------------- *
   * Estimate: three options, the right one is "round each to the nearest 10, add"
   * ---------------------------------------------------------------- */
  function estimateOptions(nums) {
    var est = estimateOf(nums);
    var cands = [est - 200, est - 100, est + 100, est + 200].filter(function (v) { return v > 0 && v < 1000; });
    var two = U.shuffle(cands).slice(0, 2);
    return U.shuffle([est].concat(two));
  }
  function roundingText(nums) {
    return nums.map(function (n) { return n + ' → ' + round10(n); }).join(', ');
  }

  /* ---------------------------------------------------------------- *
   * Number line for the estimate learn screen
   * ---------------------------------------------------------------- */
  function numberLine(lo, hi) {
    var W = 800;
    var H = 140;
    var X0 = 40;
    var X1 = 760;
    var LY = 96;
    function x(v) {
      return X0 + ((v - lo) * (X1 - X0)) / (hi - lo);
    }
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'tmh-nl', style: { maxWidth: '100%', height: 'auto' } });
    root.appendChild(svg('line', { x1: X0 - 10, y1: LY, x2: X1 + 10, y2: LY, class: 'tmh-nl-line' }));
    for (var v = lo; v <= hi; v++) {
      var ten = v % 10 === 0;
      root.appendChild(svg('line', { x1: x(v), y1: LY - (ten ? 14 : 7), x2: x(v), y2: LY + (ten ? 14 : 7), class: ten ? 'tmh-nl-ten' : 'tmh-nl-tick' }));
      if (ten) root.appendChild(svg('text', { x: x(v), y: LY + 38, 'text-anchor': 'middle', class: 'tmh-nl-num' }, String(v)));
    }
    var arcs = svg('g');
    root.appendChild(arcs);
    return {
      svg: root,
      mark: function (v, cls) {
        root.appendChild(svg('circle', { cx: x(v), cy: LY, r: 9, class: 'tmh-nl-dot ' + cls }));
        root.appendChild(svg('text', { x: x(v), y: LY - 22, 'text-anchor': 'middle', class: 'tmh-nl-label ' + cls }, String(v)));
      },
      arc: function (from, to, cls) {
        var a = x(from);
        var b = x(to);
        var mid = (a + b) / 2;
        arcs.appendChild(svg('path', { d: 'M' + a + ' ' + (LY - 4) + ' Q' + mid + ' ' + (LY - 70) + ' ' + b + ' ' + (LY - 4), class: 'tmh-nl-arc ' + cls }));
        root.appendChild(svg('circle', { cx: b, cy: LY, r: 7, class: 'tmh-nl-ring ' + cls }));
      },
    };
  }

  /** A few tens sticks with a label underneath ("70 = 7 tens"). */
  function sticksPic(k) {
    var W = k * 20 + 16;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' 92', width: W, height: 92, class: 'tmh-sticks', style: { maxWidth: '100%', height: 'auto' } });
    for (var i = 0; i < k; i++) root.appendChild(stick(10 + i * 20, 6, 'tmh-b'));
    return el('div', { class: 'tmh-sticks-box' }, root, el('div', { class: 'tmh-sticks-cap' }, k * 10 + ' = ' + plural(k, 'ten', 'tens')));
  }

  /* ---------------------------------------------------------------- *
   * Question generators (number ranges from Workbook p.109–114)
   * ---------------------------------------------------------------- */
  function make2(aT, aO, bT, bO) {
    var a = aT * 10 + aO;
    var b = bT * 10 + bO;
    return Math.random() < 0.5 ? [a, b] : [b, a];
  }
  /** Two 2-digit numbers. cat: 'none' | 'ones' | 'tens' (exactly one kind of regrouping). */
  function gen2(cat) {
    var aT, bT, aO, bO;
    if (cat === 'none') {
      aT = U.rand(1, 7); bT = U.rand(1, 8 - aT);
      aO = U.rand(1, 7); bO = U.rand(1, 8 - aO);
    } else if (cat === 'ones') {
      aT = U.rand(1, 6); bT = U.rand(1, 7 - aT);
      aO = U.rand(3, 9); bO = U.rand(Math.max(1, 10 - aO), 9);
      if (aO + bO === 10 && Math.random() < 0.5) bO = Math.min(9, bO + 1);
    } else {
      aT = U.rand(3, 9); bT = U.rand(Math.max(1, 10 - aT), 9);
      aO = U.rand(1, 7); bO = U.rand(1, 8 - aO);
    }
    return make2(aT, aO, bT, bO);
  }
  function catOf(nums) {
    var p = parts(nums);
    if (p.o >= 10) return 'ones';
    if (p.td >= 10) return 'tens';
    return 'none';
  }
  /** 3-digit + 2-digit that regroups the tens (e.g. 245 + 83). */
  function gen3p2() {
    var aT = U.rand(2, 9);
    var bT = U.rand(Math.max(1, 10 - aT), 9);
    var a = U.rand(1, 8) * 100 + aT * 10 + U.rand(0, 9);
    var b = bT * 10 + U.rand(1, 9);
    return [a, b];
  }
  /** 3-digit + 3-digit, tens (and maybe ones) regroup, total under 1000. */
  function gen3p3() {
    for (;;) {
      var a = U.rand(112, 689);
      var b = U.rand(112, 689);
      if (a + b >= 1000 || a % 10 === 0 || b % 10 === 0) continue;
      if (tensAfterCarry([a, b]) < 10) continue;
      return [a, b];
    }
  }
  /** Three 3-digit numbers (stacked), tens digits make 10 or more, total under 1000. */
  function gen3x3() {
    for (;;) {
      var nums = [U.rand(1, 3) * 100 + U.rand(10, 99), U.rand(1, 3) * 100 + U.rand(10, 99), U.rand(1, 3) * 100 + U.rand(10, 99)];
      var p = parts(nums);
      if (total(nums) >= 1000 || p.td < 10 || p.td > 19) continue;
      if (nums.some(function (n) { return n % 10 === 0; })) continue;
      return nums;
    }
  }
  /** "? + some tens = N" (Workbook p.113 Q13 style). */
  function genMissing() {
    for (;;) {
      var N = U.rand(2, 8) * 100 + U.rand(1, 8) * 10 + U.rand(1, 9);
      var k = U.rand(2, 9);
      var m = N - 10 * k;
      if (m < 100) continue;
      return { N: N, k: k, m: m };
    }
  }

  /** A repeat of the same wrong answer is not a new mistake: just nudge, do not count a try. */
  function repeated(memo, v, api) {
    if (memo.last === v) {
      api.feedback('That is the same answer as before. Try a different one.', 'try');
      return true;
    }
    memo.last = v;
    return false;
  }

  var deck = null;

  function buildDeck() {
    var seen = {};
    function uniq(fn) {
      for (var i = 0; i < 200; i++) {
        var v = fn();
        var key = JSON.stringify(v);
        var rev = Array.isArray(v) ? JSON.stringify(v.slice().reverse()) : key;
        if (!seen[key] && !seen[rev]) {
          seen[key] = true;
          return v;
        }
      }
      return fn();
    }
    var cats = U.shuffle(['none', 'ones', 'tens']);
    return [
      // Level 1: 2-digit + 2-digit, no regrouping / regroup the ones (totals up to 99)
      { type: 'mat', nums: uniq(function () { return gen2('none'); }) },
      { type: 'mat', nums: uniq(function () { return gen2('ones'); }) },
      { type: 'sort', nums: uniq(function () { return gen2(cats[0]); }) },
      // Level 2: regroup the tens (totals 100–198), 3-digit + 2-digit
      { type: 'mat', nums: uniq(function () { return gen2('tens'); }) },
      { type: 'sort', nums: uniq(function () { return gen2(cats[1]); }) },
      { type: 'mat', nums: uniq(gen3p2) },
      // Level 3: estimate first, 3-digit + 3-digit; three 3-digit numbers stacked; missing number
      { type: 'est', nums: uniq(gen3p3) },
      { type: 'stack', nums: uniq(gen3x3) },
      { type: 'missing', m: uniq(genMissing) },
    ];
  }

  var SORT_LABEL = { none: 'No regrouping', ones: 'Regroup the ones', tens: 'Regroup the tens' };

  /* ---------------------------------------------------------------- *
   * Practice question builders
   * ---------------------------------------------------------------- */

  /** Mat + tools + typed total. Returns { finish() } for reveal. */
  function matQuestion(stage, api, nums, sayLine) {
    var correct = total(nums);
    var tools;
    var mat = makeMat(api, {
      nums: nums,
      dragRows: true,
      onChange: function () {
        if (tools) tools.refresh();
      },
    });
    tools = matTools(mat);
    var memo = {};
    var input = MQ.ui.numberInput({
      prefix: 'Total =',
      onSubmit: function (v) {
        if (v === correct) {
          input.good();
          input.disable();
          tools.disable();
          api.check(true, U.pick(['Yes! ', 'Correct! ', 'Brilliant! ']) + sumText(nums) + ' = ' + correct + '.');
        } else {
          if (repeated(memo, v, api)) return;
          input.bad();
          var d = diagnose(nums, v, api.tries());
          api.check(false, d.hint, d.tag);
        }
      },
    });
    var holder = el('div', { class: 'tmh-qwrap' });
    holder.appendChild(el('div', { class: 'tmh-mat' }, mat.svg));
    holder.appendChild(el('div', { class: 'tmh-row' }, tools, input.el));
    var workBox = el('div', { class: 'tmh-workbox' });
    holder.appendChild(workBox);
    stage.appendChild(holder);
    if (sayLine) api.say(sayLine, 'think');
    input.focus();
    return {
      input: input,
      reveal: function () {
        mat.finish();
        tools.disable();
        input.setValue(String(correct));
        input.good();
        input.disable();
        workBox.appendChild(workingEl(nums));
        api.feedback(sumText(nums) + ' = ' + correct, 'info');
      },
    };
  }

  function qPrompt(nums) {
    return MQ.ui.prompt('<span class="tmh-q">' + sumText(nums) + ' = ?</span>');
  }

  function renderMat(stage, api, q) {
    stage.appendChild(qPrompt(q.nums));
    var hasH = q.nums.some(function (n) { return n >= 100; });
    var line = tensAfterCarry(q.nums) >= 10 ? 'Add them. If you get 10 tens, swap them for a hundred!' : parts(q.nums).o >= 10 ? 'Add them. If you get 10 ones, swap them for a ten!' : 'Add them. Use the mat if it helps.';
    if (hasH) line = 'Add them. Watch the tens: 10 tens make a hundred!';
    var m = matQuestion(stage, api, q.nums, line);
    api.onReveal(m.reveal);
  }

  function renderSort(stage, api, q) {
    var cat = catOf(q.nums);
    var p = parts(q.nums);
    var dA = digits(q.nums[0]);
    var dB = digits(q.nums[1]);
    api.say('Before you add: does this need regrouping? Look at the ones, then the tens.', 'think');
    stage.appendChild(qPrompt(q.nums));
    var area = el('div', { class: 'tmh-qwrap' });
    var m = null;
    var ch = MQ.ui.choices(
      ['none', 'ones', 'tens'].map(function (k) { return { label: SORT_LABEL[k], value: k }; }),
      function (v, btn) {
        if (btn.classList.contains('bad')) {
          api.feedback('You tried that one. Pick another.', 'try');
          return;
        }
        if (v === cat) {
          ch.mark(v, 'good');
          ch.disable();
          api.sound('correct');
          showAdd();
          return;
        }
        ch.mark(v, 'bad');
        var hint;
        var tag;
        var onesLine = 'Ones: ' + dA.o + ' + ' + dB.o + ' = ' + p.o + '.';
        var tensLine = 'Tens: ' + dA.t + ' + ' + dB.t + ' = ' + p.td + ' tens.';
        if (cat === 'none') {
          tag = 'Thought it needed regrouping when it did not';
          hint = v === 'ones' ? onesLine + ' That is less than 10, so the ones stay.' : tensLine + ' That is less than 10, so the tens stay.';
        } else if (cat === 'ones') {
          tag = 'Did not spot that the ones need regrouping';
          hint = onesLine + ' That is 10 or more!';
          if (v === 'tens') hint = tensLine + ' Less than 10. Now look at the ones: ' + dA.o + ' + ' + dB.o + ' = ' + p.o + '.';
        } else {
          tag = 'Did not spot that the tens need regrouping';
          hint = tensLine + ' That is 10 or more!';
          if (v === 'ones') hint = onesLine + ' Less than 10. Now look at the tens: ' + dA.t + ' + ' + dB.t + ' = ' + p.td + ' tens.';
        }
        api.check(false, hint, tag);
      },
      { columns: 3 }
    );
    area.appendChild(ch);
    stage.appendChild(area);
    function showAdd() {
      MQ.clear(area);
      area.appendChild(el('div', { class: 'chip tmh-sorted' }, '✓ ' + SORT_LABEL[cat]));
      api.feedback('Yes: ' + SORT_LABEL[cat].toLowerCase() + '. Now find the total.', 'good');
      m = matQuestion(area, api, q.nums, 'Right! Now add them.');
    }
    api.onReveal(function () {
      if (!m) {
        ch.mark(cat, 'good');
        ch.disable();
        showAdd();
      }
      m.reveal();
      api.feedback(SORT_LABEL[cat] + '. ' + sumText(q.nums) + ' = ' + total(q.nums), 'info');
    });
  }

  /** Estimate choice, then either one total box ('est') or the four stacked steps ('stack'). */
  function renderStacked(stage, api, q, stepped) {
    var nums = q.nums;
    var est = estimateOf(nums);
    var correct = total(nums);
    api.say('Estimate first! Round each number to the nearest 10.', 'think');
    stage.appendChild(qPrompt(nums));
    var view = stackView(nums);
    var side = el('div', { class: 'tmh-side' });
    stage.appendChild(el('div', { class: 'tmh-split' }, view.el, side));
    var estDone = false;
    var input = null;
    var stepIdx = 0;
    var steps = stackSteps(nums);
    var estChip = el('div', { class: 'chip tmh-estchip' });
    var memo = {};

    side.appendChild(el('div', { class: 'tmh-side-title' }, 'Estimate:'));
    var ch = MQ.ui.choices(estimateOptions(nums).map(function (v) { return { label: 'about ' + v, value: v }; }), function (v, btn) {
      if (btn.classList.contains('bad')) {
        api.feedback('You tried that one. Pick another.', 'try');
        return;
      }
      if (v === est) {
        ch.mark(v, 'good');
        ch.disable();
        api.sound('correct');
        startCalc();
        return;
      }
      ch.mark(v, 'bad');
      api.check(false, api.tries() >= 1 ? 'Round each number: ' + roundingText(nums) + '. Add those.' : 'Round each number to the nearest 10 first, then add.', 'Estimate far from answer');
    }, { columns: 1 });
    ch.classList.add('tmh-estch');
    side.appendChild(ch);

    function praise() {
      return correct + ' is close to our estimate ' + est + '. Great!';
    }

    function startCalc() {
      estDone = true;
      MQ.clear(side);
      estChip.textContent = 'Estimate: about ' + est;
      side.appendChild(estChip);
      if (!stepped) {
        api.say('Now add. Ones, then tens, then hundreds.', 'think');
        view.ask('total');
        input = MQ.ui.numberInput({
          prefix: 'Total =',
          onSubmit: function (v) {
            if (v === correct) {
              input.good();
              input.disable();
              view.set('total', correct);
              api.check(true, praise());
            } else {
              if (repeated(memo, v, api)) return;
              input.bad();
              var d = diagnose(nums, v, api.tries());
              api.check(false, d.hint, d.tag);
            }
          },
        });
        side.appendChild(input.el);
        input.focus();
        return;
      }
      var label = el('div', { class: 'tmh-side-title tmh-step-label' });
      input = MQ.ui.numberInput({
        onSubmit: function (v) {
          var s = steps[stepIdx];
          if (v === s.val) {
            view.set(s.key, s.val);
            input.clear();
            input.input.classList.remove('bad');
            stepIdx++;
            if (stepIdx >= steps.length) {
              input.disable();
              view.col(null);
              api.check(true, praise());
              return;
            }
            api.sound('pop');
            api.feedback('Yes! ' + s.label + ': ' + s.val + '.', 'good');
            showStep();
          } else {
            if (repeated(memo, s.key + ':' + v, api)) return;
            input.bad();
            var d = stepMiss(nums, s, v, api.tries());
            api.check(false, d.hint, d.tag);
          }
        },
      });
      side.appendChild(label);
      side.appendChild(input.el);
      function showStep() {
        var s = steps[stepIdx];
        label.textContent = s.label + ' =';
        view.ask(s.key);
        view.col(s.col);
        api.say(s.say, 'think');
        input.focus();
      }
      showStep();
    }

    api.onReveal(function () {
      if (!estDone) {
        ch.mark(est, 'good');
        ch.disable();
      }
      MQ.clear(side);
      estChip.textContent = 'Estimate: ' + roundingText(nums) + ' → about ' + est;
      side.appendChild(estChip);
      view.fillAll();
      side.appendChild(workingEl(nums));
      api.feedback('Ones, then tens, then hundreds, each at full value. ' + sumText(nums) + ' = ' + correct, 'info');
    });
  }

  function renderMissing(stage, api, q) {
    var N = q.m.N;
    var k = q.m.k;
    var m = q.m.m;
    var add = 10 * k;
    api.say('Some tens were added to a number to make ' + N + '. What was the number?', 'think');
    stage.appendChild(MQ.ui.prompt('<span class="tmh-q"><span class="tmh-qbox">?</span> + ' + add + ' = ' + N + '</span>'));
    stage.appendChild(sticksPic(k));
    var chain = el('div', { class: 'tmh-chain' });
    var memo = {};
    var input = MQ.ui.numberInput({
      prefix: '? =',
      onSubmit: function (v) {
        if (v === m) {
          input.good();
          input.disable();
          var other = m + 10 <= N - 10 ? ' Another way: ' + (N - 10) + ' + 10 = ' + N + '.' : '';
          api.check(true, 'Yes! ' + m + ' + ' + add + ' = ' + N + '.' + other);
          return;
        }
        if (repeated(memo, v, api)) return;
        input.bad();
        var tag;
        var hint;
        if (v === N + add) {
          tag = 'Added the tens instead of taking them away';
          hint = v + ' is bigger than ' + N + '! We need a number that grows to ' + N + ' when we add ' + add + '.';
        } else if (v % 10 !== N % 10) {
          tag = 'Changed the ones digit when adding tens';
          hint = 'Adding tens never changes the ones. The missing number must end in ' + (N % 10) + '.';
        } else if (v === m + 100) {
          tag = 'Forgot the regrouped hundred';
          hint = 'Check: ' + v + ' + ' + add + ' = ' + (v + add) + ', not ' + N + '. Count back in tens past the hundred carefully.';
        } else {
          tag = 'Counted back in tens wrongly';
          hint = 'Check: ' + v + ' + ' + add + ' = ' + (v + add) + '. We need ' + N + '.';
        }
        if (api.tries() >= 1) {
          var seq = [];
          for (var i = 1; i <= Math.min(3, k); i++) seq.push(N - 10 * i);
          hint = 'Count back ' + plural(k, 'ten', 'tens') + ' from ' + N + ': ' + seq.join(', ') + (k > 3 ? ' …' : '') + ' Do ' + k + ' jumps.';
        }
        api.check(false, hint, tag);
      },
    });
    stage.appendChild(input.el);
    stage.appendChild(chain);
    input.focus();
    api.onReveal(function () {
      input.setValue(String(m));
      input.good();
      input.disable();
      chain.appendChild(el('span', { class: 'chip chip-total' }, String(N)));
      for (var i = 1; i <= k; i++) {
        chain.appendChild(el('span', { class: 'tmh-jump' }, '−10'));
        chain.appendChild(el('span', { class: 'chip' + (i === k ? ' tmh-chip-ans' : '') }, String(N - 10 * i)));
      }
      api.feedback('Count back ' + k + ' tens from ' + N + ': ' + m + '. Check: ' + m + ' + ' + add + ' = ' + N + '.', 'info');
    });
  }

  /* ---------------------------------------------------------------- *
   * Learn screens (64 + 53 = 117, then the stacked layout)
   * ---------------------------------------------------------------- */
  var L = [64, 53];

  MQ.register('tens-make-a-hundred', {
    learn: [
      // 1. Put the tens together: 11 tens
      function (stage, api) {
        api.say('Let\'s add 64 + 53. Drag each group of tens and ones down to the Total row.');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('64 + 53', 'Drag (or click) each group into the <b>Total</b> row.'));
        var readout = el('div', { class: 'tmh-readout' }, ' ');
        var mat = makeMat(api, {
          nums: L,
          dragRows: true,
          swappable: false,
          onChange: function () {
            var c = mat.counts();
            readout.innerHTML = 'Total row: <b>' + plural(c.t, 'ten', 'tens') + '</b> and <b>' + plural(c.o, 'one', 'ones') + '</b>';
            if (mat.allMoved()) {
              api.say('11 tens! That is more than 9 tens. Too many for the tens place!', 'cheer');
              api.feedback('6 tens + 5 tens = 11 tens. 4 ones + 3 ones = 7 ones.', 'good');
              api.unlockNext();
            }
          },
        });
        stage.appendChild(el('div', { class: 'tmh-mat' }, mat.svg));
        stage.appendChild(readout);
      },
      // 2. Swap 10 tens for 1 hundred
      function (stage, api) {
        api.say('10 tens make 1 hundred. Drag the 10 tens to the Hundreds, or click Swap.');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Swap 10 tens for 1 hundred', null));
        var place = el('div', { class: 'tmh-pv' });
        var swapBtn;
        var mat = makeMat(api, {
          nums: L,
          onChange: function (what) {
            if (what !== 'swap-t') return;
            swapBtn.hidden = true;
            MQ.clear(place);
            [['1', 'hundred'], ['1', 'ten'], ['7', 'ones']].forEach(function (b) {
              place.appendChild(el('div', { class: 'tmh-pv-box' }, el('b', null, b[0]), el('span', null, b[1])));
            });
            place.appendChild(el('div', { class: 'tmh-pv-eq' }, '= 117'));
            api.say('1 hundred, 1 ten and 7 ones. 64 + 53 = 117. Not 1117!', 'cheer');
            api.feedback('64 + 53 = 117', 'good');
            api.unlockNext();
          },
        });
        mat.combine();
        swapBtn = el('button', { class: 'btn tmh-tool tmh-tool-swap', type: 'button', onclick: function () { mat.swap('t'); } }, 'Swap 10 tens → 1 hundred');
        stage.appendChild(el('div', { class: 'tmh-mat' }, mat.svg));
        stage.appendChild(swapBtn);
        stage.appendChild(place);
      },
      // 3. Estimate first
      function (stage, api) {
        api.say('Before adding, estimate! Round each number to the nearest 10.');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Estimate first', 'Is each number nearer the ten below or the ten above?'));
        var nl = numberLine(40, 80);
        nl.mark(64, 'tmh-a');
        nl.mark(53, 'tmh-b');
        stage.appendChild(el('div', { class: 'tmh-nlbox' }, nl.svg));
        var holder = el('div', { class: 'tmh-qwrap' });
        stage.appendChild(holder);
        var asks = [
          { n: 64, opts: [60, 70], cls: 'tmh-a' },
          { n: 53, opts: [50, 60], cls: 'tmh-b' },
        ];
        var i = 0;
        function ask() {
          MQ.clear(holder);
          if (i >= asks.length) {
            holder.appendChild(el('div', { class: 'tmh-estline' }, el('span', { class: 'tmh-est-name' }, 'Estimate'), MQ.ui.sum([60, 50], 110)));
            holder.appendChild(el('div', { class: 'tmh-estline' }, el('span', { class: 'tmh-est-name' }, 'Exact'), MQ.ui.sum([64, 53], 117)));
            api.say('117 is close to our estimate of 110. Good!', 'cheer');
            api.feedback('An estimate tells you if your answer makes sense.', 'good');
            api.unlockNext();
            return;
          }
          var a = asks[i];
          holder.appendChild(MQ.ui.prompt('Is <b>' + a.n + '</b> nearer ' + a.opts[0] + ' or ' + a.opts[1] + '?'));
          var ch = MQ.ui.choices(a.opts, function (v) {
            var right = round10(a.n);
            if (v === right) {
              ch.mark(v, 'good');
              ch.disable();
              api.sound('correct');
              nl.arc(a.n, right, a.cls);
              api.feedback(a.n + ' is nearer ' + right + '.', 'good');
              i++;
              api.later(ask, 1000);
            } else {
              ch.mark(v, 'bad');
              api.sound('wrong');
              api.feedback('Count the steps on the line: ' + a.n + ' is ' + Math.abs(a.n - v) + ' away from ' + v + '. How far from the other ten?', 'try');
            }
          }, { columns: 2 });
          holder.appendChild(ch);
        }
        ask();
      },
      // 4. Stack it: partial sums at full value
      function (stage, api) {
        var nums = [162, 135, 241];
        var steps = stackSteps(nums);
        var idx = 0;
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Stack it', 'Add each column. Write each part at <b>full value</b>.'));
        var view = stackView(nums);
        var side = el('div', { class: 'tmh-side' });
        stage.appendChild(el('div', { class: 'tmh-split' }, view.el, side));
        var label = el('div', { class: 'tmh-side-title tmh-step-label' });
        var input = MQ.ui.numberInput({
          onSubmit: function (v) {
            var s = steps[idx];
            if (v === s.val) {
              view.set(s.key, s.val);
              input.clear();
              input.input.classList.remove('bad');
              api.sound('correct');
              idx++;
              if (idx >= steps.length) {
                input.disable();
                view.col(null);
                MQ.clear(side);
                side.appendChild(workingEl(nums));
                api.say('8 + 130 + 400 = 538. Ones first, each part at full value!', 'cheer');
                api.feedback('162 + 135 + 241 = 538', 'good');
                api.unlockNext();
                return;
              }
              api.feedback('Yes! ' + s.label + ': ' + s.val + '.', 'good');
              show();
            } else {
              input.bad();
              api.sound('wrong');
              api.feedback(stepMiss(nums, s, v, 1).hint, 'try');
            }
          },
        });
        side.appendChild(label);
        side.appendChild(input.el);
        function show() {
          var s = steps[idx];
          label.textContent = s.label + ' =';
          view.ask(s.key);
          view.col(s.col);
          api.say(s.say, 'think');
          input.focus();
        }
        show();
      },
    ],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'mat') return renderMat(stage, api, q);
        if (q.type === 'sort') return renderSort(stage, api, q);
        if (q.type === 'est') return renderStacked(stage, api, q, false);
        if (q.type === 'stack') return renderStacked(stage, api, q, true);
        return renderMissing(stage, api, q);
      },
    },
  });

  /* ---------------------------------------------------------------- *
   * Styles
   * ---------------------------------------------------------------- */
  var css = [
    '.tmh-mat{width:100%;max-width:820px;display:flex;justify-content:center}',
    '.tmh-mat-svg{display:block;width:100%;max-width:820px;height:auto;touch-action:none;user-select:none}',
    '.tmh-head{stroke:none}',
    '.tmh-head-h{fill:#e3f4e8}.tmh-head-t{fill:#e5efff}.tmh-head-o{fill:#fff1dc}',
    '.tmh-head-text{font-size:18px;font-weight:800;fill:var(--ink)}',
    '.tmh-cell{fill:#fff;stroke:var(--line);stroke-width:2}',
    '.tmh-cell-total{fill:#fffbea;stroke:#e9c46a}',
    '.tmh-rlabel{font-size:30px;font-weight:800;fill:var(--ink)}',
    '.tmh-rlabel-total{font-size:22px;fill:#9a6b00}',
    '.tmh-rl-a{fill:#2a64ad}.tmh-rl-b{fill:#b35f0e}',
    '.tmh-body{stroke-width:1.5}',
    '.tmh-lines{stroke-width:1;fill:none;opacity:.55}',
    '.tmh-a .tmh-body,.tmh-cube.tmh-a{fill:#9cc8ff;stroke:#2a64ad}.tmh-a .tmh-lines{stroke:#2a64ad}',
    '.tmh-b .tmh-body,.tmh-cube.tmh-b{fill:#ffc68f;stroke:#b35f0e}.tmh-b .tmh-lines{stroke:#b35f0e}',
    '.tmh-n .tmh-body,.tmh-cube.tmh-n{fill:#9fe0b4;stroke:#1f8a52}.tmh-n .tmh-lines{stroke:#1f8a52}',
    '.tmh-grp{transition:opacity .25s}',
    '.tmh-grp:not(.tmh-gone):hover{filter:brightness(1.06)}',
    '.tmh-gone{opacity:.13;pointer-events:none}',
    '.tmh-hit{fill:transparent;stroke:none;pointer-events:all}',
    '.tmh-frame{fill:rgba(255,183,3,.12);stroke:#e0a100;stroke-width:3;stroke-dasharray:8 5;animation:tmh-glow 1.4s ease-in-out infinite}',
    '@keyframes tmh-glow{50%{stroke:#ffcf4d;fill:rgba(255,183,3,.24)}}',
    '.tmh-piece{transform-box:fill-box;transform-origin:center;transition:opacity .4s,transform .4s}',
    '.tmh-leave{opacity:0;transform:scale(.4)}',
    '.tmh-new{animation:tmh-pop .6s ease}',
    '@keyframes tmh-pop{0%{transform:scale(.2);opacity:0}70%{transform:scale(1.15);opacity:1}100%{transform:scale(1)}}',
    '.tmh-readout{font-size:1.3rem;font-weight:700;min-height:1.6em;text-align:center}',
    '.tmh-qwrap{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.tmh-row{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:center}',
    '.tmh-tools{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}',
    '.tmh-tools:empty{display:none}',
    '.tmh-tool{background:#fff;color:var(--ink);border:3px solid var(--line);font-size:1rem}',
    '.tmh-tool:hover{border-color:var(--accent)}',
    '.tmh-tool-swap{border-color:#e0a100;background:#fff7dc}',
    '.tmh-tool[hidden]{display:none}',
    '.tmh-q{white-space:nowrap;font-size:1.7rem}',
    '.tmh-qbox{display:inline-block;min-width:1.8em;border:3px dashed var(--accent);border-radius:10px;padding:0 6px;color:var(--ink-soft)}',
    '.tmh-pv{display:flex;gap:10px;align-items:center;justify-content:center;flex-wrap:wrap;min-height:64px}',
    '.tmh-pv-box{display:flex;flex-direction:column;align-items:center;background:#fff;border:3px solid var(--line);border-radius:12px;padding:4px 14px;min-width:80px}',
    '.tmh-pv-box b{font-size:1.8rem;line-height:1.1}',
    '.tmh-pv-box span{font-size:.9rem;color:var(--ink-soft);font-weight:700}',
    '.tmh-pv-eq{font-size:2rem;font-weight:800;color:var(--good)}',
    '.tmh-nlbox{width:100%;max-width:800px}',
    '.tmh-nl{display:block;width:100%;height:auto}',
    '.tmh-nl-line{stroke:var(--ink);stroke-width:3}',
    '.tmh-nl-tick{stroke:var(--ink-soft);stroke-width:1.5}',
    '.tmh-nl-ten{stroke:var(--ink);stroke-width:3}',
    '.tmh-nl-num{font-size:22px;font-weight:800;fill:var(--ink)}',
    '.tmh-nl-dot.tmh-a{fill:#2a64ad}.tmh-nl-dot.tmh-b{fill:#b35f0e}',
    '.tmh-nl-label{font-size:22px;font-weight:800}',
    '.tmh-nl-label.tmh-a{fill:#2a64ad}.tmh-nl-label.tmh-b{fill:#b35f0e}',
    '.tmh-nl-arc{fill:none;stroke-width:3;stroke-dasharray:6 4}',
    '.tmh-nl-arc.tmh-a{stroke:#2a64ad}.tmh-nl-arc.tmh-b{stroke:#b35f0e}',
    '.tmh-nl-ring{fill:none;stroke-width:4}',
    '.tmh-nl-ring.tmh-a{stroke:#2a64ad}.tmh-nl-ring.tmh-b{stroke:#b35f0e}',
    '.tmh-estline{display:flex;align-items:center;gap:12px;flex-wrap:wrap;justify-content:center}',
    '.tmh-est-name{font-weight:800;color:var(--ink-soft);min-width:80px;text-align:right}',
    '.tmh-split{display:flex;flex-wrap:wrap;gap:22px;align-items:center;justify-content:center;width:100%}',
    '.tmh-side{display:flex;flex-direction:column;gap:10px;align-items:center;min-width:240px;max-width:100%}',
    '.tmh-side-title{font-size:1.25rem;font-weight:800}',
    '.tmh-estch{max-width:260px}',
    '.tmh-estchip{font-size:1.15rem;font-weight:800}',
    '.tmh-stack-wrap{background:#fff;border:3px solid var(--line);border-radius:16px;padding:8px 14px;max-width:100%}',
    '.tmh-stack{display:grid;grid-template-columns:36px repeat(3,48px) 104px;align-items:center;font-weight:800}',
    '.tmh-s{height:42px;line-height:42px;text-align:center;font-size:1.8rem}',
    '.tmh-s-head{font-size:1rem;color:var(--ink-soft);height:26px;line-height:26px}',
    '.tmh-s-op{color:var(--ink-soft)}',
    '.tmh-s-d{border-radius:8px}',
    '.tmh-col-on{background:#fff3cd}',
    '.tmh-s-rule{grid-column:1 / -1;border-top:3px solid var(--ink);margin:3px 104px 3px 0}',
    '.tmh-s-part{color:#1f8a52}',
    '.tmh-ask{outline:3px dashed var(--accent);outline-offset:-5px;background:#effbf9}',
    '.tmh-s-label{font-size:.95rem;text-align:left;padding-left:10px;color:var(--ink-soft);font-weight:700}',
    '.tmh-s-label-on{color:var(--ink);font-weight:800}',
    '.tmh-work{display:flex;flex-direction:column;gap:4px;background:var(--info-bg);border:2px solid var(--line);border-radius:12px;padding:8px 14px;font-size:1.15rem}',
    '.tmh-work-line{display:flex;gap:10px;align-items:baseline}',
    '.tmh-work-name{min-width:84px;color:var(--ink-soft);font-weight:800}',
    '.tmh-work-total{border-top:2px solid var(--line);padding-top:4px}',
    '.tmh-workbox:empty{display:none}',
    '.tmh-sorted{font-size:1.1rem;font-weight:800;background:var(--good-bg);border-color:var(--good);color:var(--good)}',
    '.tmh-sticks-box{display:flex;flex-direction:column;align-items:center}',
    '.tmh-sticks{display:block}',
    '.tmh-sticks-cap{font-weight:800;color:#b35f0e}',
    '.tmh-chain{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;max-width:760px;font-weight:800}',
    '.tmh-chain:empty{display:none}',
    '.tmh-jump{color:var(--ink-soft);font-size:.9rem}',
    '.tmh-chip-ans{background:var(--good-bg);border-color:var(--good);color:var(--good)}',
    '@media (max-width:640px){.tmh-q{font-size:1.4rem}.tmh-stack{grid-template-columns:30px repeat(3,42px) 90px}.tmh-s-rule{margin-right:90px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'tens-make-a-hundred' }, css));
})();

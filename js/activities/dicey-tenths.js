/* Dicey Tenths — Project 4 "Dicey fractions" (Unit 12, section 12.3).
 * A 3 x 3 grid where every box is ?/10. Roll a 1–6 dice, write the number as a numerator,
 * and win by finishing a straight line of three that adds to exactly 10/10 = 1 whole.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;
  var ID = 'dicey-tenths';

  /* ---------------- lines of the grid ---------------- */
  // Boxes are numbered 0..8, left to right, top to bottom.
  var LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
    [0, 4, 8], [2, 4, 6], // diagonals
  ];
  var LINE_NAMES = ['top row', 'middle row', 'bottom row', 'left column', 'middle column', 'right column', '↘ diagonal', '↙ diagonal'];
  var LINE_SHORT = ['Row 1', 'Row 2', 'Row 3', 'Column 1', 'Column 2', 'Column 3', 'Diagonal ↘', 'Diagonal ↙'];
  var PART_COLORS = ['#4d96ff', '#ff9f1c', '#2ec4b6'];
  // The learn-screen puzzle (original position). Rolling a 3: only the left column wins (3 + 3 + 4).
  var PUZZLE = { grid: [3, 0, 1, 0, 0, 5, 4, 0, 0], roll: 3 };

  function isRow(li) {
    return li < 3;
  }
  function lineSum(grid, li) {
    var s = 0;
    LINES[li].forEach(function (i) {
      s += grid[i] || 0;
    });
    return s;
  }
  function lineFull(grid, li) {
    return LINES[li].every(function (i) {
      return grid[i] > 0;
    });
  }
  function hasFullLine(grid) {
    for (var li = 0; li < LINES.length; li++) if (lineFull(grid, li)) return true;
    return false;
  }
  // Lines that putting a number in empty box idx would finish (the other two boxes are filled).
  function linesFinishedBy(grid, idx) {
    if (grid[idx]) return [];
    var out = [];
    LINES.forEach(function (line, li) {
      if (line.indexOf(idx) === -1) return;
      var others = line.filter(function (i) {
        return i !== idx;
      });
      if (grid[others[0]] > 0 && grid[others[1]] > 0) out.push(li);
    });
    return out;
  }
  // Winning lines if the roll goes in box idx.
  function winsAt(grid, idx, roll) {
    return linesFinishedBy(grid, idx).filter(function (li) {
      return lineSum(grid, li) + roll === 10;
    });
  }
  function winners(grid, roll) {
    var out = [];
    for (var i = 0; i < 9; i++) if (winsAt(grid, i, roll).length) out.push(i);
    return out;
  }
  // Number of (box, line) finishes that do NOT make 10 — the tempting wrong moves.
  function decoys(grid, roll) {
    var n = 0;
    for (var i = 0; i < 9; i++) {
      linesFinishedBy(grid, i).forEach(function (li) {
        if (lineSum(grid, li) + roll !== 10) n++;
      });
    }
    return n;
  }

  /* ---------------- deck ---------------- */
  function makeLineQ(li, partial, seen) {
    for (var t = 0; t < 200; t++) {
      var a = U.rand(Math.max(1, partial - 6), Math.min(6, partial - 1));
      var b = partial - a;
      var miss = U.rand(0, 2);
      var grid = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      var vals = [a, b];
      var k = 0;
      LINES[li].forEach(function (i, pos) {
        if (pos !== miss) grid[i] = vals[k++];
      });
      var key = 'L' + grid.join('');
      if (seen[key]) continue;
      seen[key] = 1;
      return { type: 'line', line: li, grid: grid, missing: LINES[li][miss], partial: partial, answer: 10 - partial };
    }
    return null;
  }

  function makeGridQ(kind, winType, seen) {
    for (var t = 0; t < 20000; t++) {
      var grid = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      var filled = U.shuffle(U.range(0, 8)).slice(0, U.rand(4, 6));
      filled.forEach(function (i) {
        grid[i] = U.rand(1, 6);
      });
      if (hasFullLine(grid)) continue;
      var roll = U.rand(1, 6);
      var w = winners(grid, roll);
      if (kind === 'one' && w.length !== 1) continue;
      if (kind === 'two' && w.length !== 2) continue;
      if (kind === 'none' && w.length !== 0) continue;
      if (decoys(grid, roll) < (kind === 'none' ? 2 : 1)) continue;
      if (kind === 'one' && winType) {
        var wl = winsAt(grid, w[0], roll);
        var type = wl[0] < 3 ? 'row' : wl[0] < 6 ? 'col' : 'diag';
        if (wl.length !== 1 || type !== winType) continue;
      }
      var key = 'G' + grid.join('') + '|' + roll;
      if (seen[key]) continue;
      seen[key] = 1;
      return { type: 'grid', kind: kind, grid: grid, roll: roll, winners: w };
    }
    return null;
  }

  function buildDeck() {
    var seen = {};
    var q = [];
    // Level 1: one box missing in a line; partial totals 4–9 tenths, all different.
    var partials = U.shuffle(U.range(4, 9));
    var lines = U.shuffle([U.rand(0, 2), U.rand(3, 5), U.rand(6, 7)]);
    for (var i = 0; i < 3; i++) q.push(makeLineQ(lines[i], partials[i], seen));
    // Level 2: one winning box (a row, a column and a diagonal in some order).
    U.shuffle(['row', 'col', 'diag']).forEach(function (wt) {
      q.push(makeGridQ('one', wt, seen));
    });
    // Level 3: two winning boxes, and no winning move.
    U.shuffle(['two', 'none']).forEach(function (k) {
      q.push(makeGridQ(k, null, seen));
    });
    return q;
  }

  /* ---------------- drawing helpers ---------------- */
  function frac(n, d, cls) {
    return '<span class="dct-frac' + (cls ? ' ' + cls : '') + '"><span class="dct-fn">' + n + '</span><span class="dct-fd">' + d + '</span></span>';
  }

  var PIPS = {
    1: [[30, 30]],
    2: [[17, 17], [43, 43]],
    3: [[17, 17], [30, 30], [43, 43]],
    4: [[17, 17], [43, 17], [17, 43], [43, 43]],
    5: [[17, 17], [43, 17], [30, 30], [17, 43], [43, 43]],
    6: [[17, 15], [43, 15], [17, 30], [43, 30], [17, 45], [43, 45]],
  };
  function dieSvg(n, size) {
    var s = svg('svg', { viewBox: '0 0 60 60', width: size || 60, height: size || 60, class: 'dct-die-svg', 'aria-label': n ? 'dice showing ' + n : 'dice' });
    s.appendChild(svg('rect', { x: 3, y: 3, width: 54, height: 54, rx: 11, class: 'dct-die-body' }));
    if (n) {
      PIPS[n].forEach(function (p) {
        s.appendChild(svg('circle', { cx: p[0], cy: p[1], r: 5.5, class: 'dct-pip' }));
      });
    } else {
      s.appendChild(svg('text', { x: 30, y: 41, 'text-anchor': 'middle', class: 'dct-die-q' }, '?'));
    }
    return s;
  }

  // The 3 x 3 board of ?/10 boxes.
  function makeBoard(grid, opts) {
    opts = opts || {};
    var wrap = el('div', { class: 'dct-board' + (opts.small ? ' dct-board-sm' : '') });
    var boxes = [];
    for (var i = 0; i < 9; i++) {
      var b = el('button', { class: 'dct-box', type: 'button', 'data-idx': i });
      boxes.push(b);
      wrap.appendChild(b);
    }
    var board = {
      el: wrap,
      boxes: boxes,
      set: function (i, v, cls) {
        var b = boxes[i];
        b.innerHTML = frac(v > 0 ? v : '?', 10);
        b.classList.toggle('dct-empty', !(v > 0));
        b.setAttribute('data-value', v > 0 ? v : 0);
        if (cls) b.classList.add(cls);
      },
      hl: function (idxs, cls) {
        idxs.forEach(function (i) {
          boxes[i].classList.add(cls);
        });
      },
      clear: function (cls) {
        boxes.forEach(function (b) {
          b.classList.remove(cls);
        });
      },
      onPick: function (fn) {
        boxes.forEach(function (b, i) {
          b.addEventListener('click', function () {
            fn(i);
          });
        });
      },
    };
    for (var j = 0; j < 9; j++) board.set(j, grid[j]);
    return board;
  }

  // A tenths bar: one coloured run per part; anything past 10 shows in red after the "1 whole" mark.
  function tenthsBar(parts) {
    var bar = el('div', { class: 'dct-bar' });
    var total = 0;
    parts.forEach(function (p) {
      total += p;
    });
    var segs = [];
    parts.forEach(function (p, k) {
      for (var j = 0; j < p; j++) segs.push(PART_COLORS[k % 3]);
    });
    for (var s = 0; s < Math.max(10, total); s++) {
      if (s === 10) bar.appendChild(el('span', { class: 'dct-bar-mark' }));
      var seg = el('span', { class: 'dct-seg' + (s >= 10 ? ' dct-seg-over' : '') });
      if (s < segs.length && s < 10) seg.style.background = segs[s];
      bar.appendChild(seg);
    }
    return bar;
  }

  // "3/10 + 2/10 + 5/10 = 10/10 = 1" as chips.
  function sumChips(parts) {
    var row = el('div', { class: 'sum-row dct-sum' });
    var total = 0;
    parts.forEach(function (p, k) {
      total += p;
      if (k) row.appendChild(el('span', { class: 'sum-op' }, '+'));
      var c = el('span', { class: 'chip dct-chip', html: frac(p, 10) });
      c.style.borderColor = PART_COLORS[k % 3];
      row.appendChild(c);
    });
    row.appendChild(el('span', { class: 'sum-op' }, '='));
    row.appendChild(el('span', { class: 'chip dct-chip' + (total === 10 ? ' chip-total' : ' dct-chip-no'), html: frac(total, 10) }));
    if (total === 10) {
      row.appendChild(el('span', { class: 'sum-op' }, '='));
      row.appendChild(el('span', { class: 'chip chip-total' }, '1 whole'));
    } else {
      row.appendChild(el('span', { class: 'dct-not' }, total > 10 ? 'more than 1 whole' : 'less than 1 whole'));
    }
    return row;
  }

  // Values of a line in order, using `extra` = {idx, v} for a box being tried.
  function lineValues(grid, li, extra) {
    return LINES[li].map(function (i) {
      return extra && extra.idx === i ? extra.v : grid[i];
    });
  }

  // Working for one line: name, chips and a bar.
  function lineWorking(grid, li, extra) {
    var vals = lineValues(grid, li, extra);
    return el('div', { class: 'dct-working' }, el('div', { class: 'dct-wname' }, 'The ' + LINE_NAMES[li]), sumChips(vals), tenthsBar(vals));
  }

  // Side panel: every line's total as a tenths bar filling towards 1.
  function makePanel(board) {
    var wrap = el('div', { class: 'dct-panel' });
    wrap.appendChild(el('div', { class: 'dct-panel-title' }, 'Line totals'));
    var rows = LINES.map(function (line, li) {
      var bar = el('div', { class: 'dct-pbar' });
      var tot = el('span', { class: 'dct-ptot' });
      var row = el('div', { class: 'dct-prow', 'data-line': li }, el('span', { class: 'dct-pname' }, LINE_SHORT[li]), bar, tot);
      row.addEventListener('mouseenter', function () {
        board.hl(line, 'dct-peek');
      });
      row.addEventListener('mouseleave', function () {
        board.clear('dct-peek');
      });
      wrap.appendChild(row);
      return { row: row, bar: bar, tot: tot };
    });
    return {
      el: wrap,
      update: function (grid) {
        rows.forEach(function (r, li) {
          MQ.clear(r.bar);
          var vals = lineValues(grid, li).filter(function (v) {
            return v > 0;
          });
          r.bar.appendChild(tenthsBar(vals));
          var s = lineSum(grid, li);
          var full = lineFull(grid, li);
          r.row.classList.toggle('dct-prow-win', full && s === 10);
          r.row.classList.toggle('dct-prow-over', s > 10);
          r.tot.innerHTML = frac(s, 10) + (full && s === 10 ? ' = 1 ✓' : s > 10 ? ' too much' : '');
        });
      },
    };
  }

  // Drag the die onto a box (as well as clicking a box). onDrop(idx).
  function makeDraggable(dieEl, api, canDrag, onDrop) {
    var ghost = null;
    var start = null;
    function move(e) {
      if (!start) return;
      if (!ghost && Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y) > 6) {
        ghost = el('div', { class: 'dct-ghost' }, dieSvg(+dieEl.getAttribute('data-value'), 56));
        document.body.appendChild(ghost);
      }
      if (ghost) {
        ghost.style.left = e.clientX - 28 + 'px';
        ghost.style.top = e.clientY - 28 + 'px';
      }
    }
    function up(e) {
      if (!start) return;
      start = null;
      dieEl.classList.remove('dragging');
      if (ghost) {
        ghost.parentNode.removeChild(ghost);
        ghost = null;
        var t = document.elementFromPoint(e.clientX, e.clientY);
        var box = t && t.closest ? t.closest('.dct-box') : null;
        if (box) onDrop(+box.getAttribute('data-idx'));
      }
    }
    function down(e) {
      if (!canDrag()) return;
      e.preventDefault();
      start = { x: e.clientX, y: e.clientY };
      dieEl.classList.add('dragging');
    }
    dieEl.style.touchAction = 'none';
    dieEl.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    api.cleanup(function () {
      dieEl.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
    });
  }

  function makeDie(api, value) {
    var d = el('div', { class: 'dct-die', 'data-value': value || 0 });
    d.appendChild(dieSvg(value || 0, 76));
    d.show = function (v) {
      d.setAttribute('data-value', v || 0);
      MQ.clear(d);
      d.appendChild(dieSvg(v || 0, 76));
      d.classList.toggle('dct-die-ready', !!v);
    };
    d.roll = function (done) {
      var n = 0;
      d.classList.add('dct-rolling');
      function spin() {
        n++;
        if (n < 7) {
          d.show(U.rand(1, 6));
          d.classList.remove('dct-die-ready');
          api.later(spin, 70);
          return;
        }
        var v = U.rand(1, 6);
        d.show(v);
        d.classList.remove('dct-rolling');
        api.sound('pop');
        done(v);
      }
      spin();
    };
    if (value) d.classList.add('dct-die-ready');
    return d;
  }

  /* ---------------- a playable game (learn screens 1 and 3) ---------------- */
  function makeGame(stage, api, opts) {
    var grid = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    var rolled = 0;
    var busy = false; // Bolt's turn or rolling
    var ended = false;
    var moves = 0;
    var board = makeBoard(grid);
    var panel = makePanel(board);
    var die = makeDie(api, 0);
    var rollBtn = el('button', { class: 'btn dct-roll', type: 'button' }, '🎲 Roll');
    var again = el('button', { class: 'btn btn-ghost dct-again', type: 'button', style: { display: 'none' } }, 'New game');
    var turnEl = el('div', { class: 'dct-turn' });
    var work = el('div', { class: 'dct-work' });
    var side = el('div', { class: 'dct-side' }, turnEl, die, rollBtn, again);
    stage.appendChild(el('div', { class: 'dct-play' }, board.el, side, panel.el));
    stage.appendChild(work);
    panel.update(grid);

    function setTurn(text) {
      turnEl.textContent = text;
    }

    function reset() {
      grid = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (var i = 0; i < 9; i++) {
        board.set(i, 0);
        board.boxes[i].classList.remove('dct-win', 'dct-new', 'dct-bolt');
      }
      rolled = 0;
      busy = false;
      ended = false;
      die.show(0);
      rollBtn.disabled = false;
      again.style.display = 'none';
      MQ.clear(work);
      panel.update(grid);
      setTurn(opts.vsBolt ? 'Your turn' : 'Roll the dice');
    }
    again.addEventListener('click', reset);

    rollBtn.addEventListener('click', function () {
      if (busy || ended) return;
      if (rolled) {
        api.feedback('You already rolled a ' + rolled + '. Put it in a box first.', 'info');
        return;
      }
      busy = true;
      rollBtn.disabled = true;
      die.roll(function (v) {
        rolled = v;
        busy = false;
        api.feedback('You rolled ' + v + '. Click an empty box, or drag the dice onto one.', 'info');
      });
    });

    function finishCheck(idx, who) {
      // Did this move finish a line?
      var done = LINES.map(function (l, li) {
        return li;
      }).filter(function (li) {
        return LINES[li].indexOf(idx) !== -1 && lineFull(grid, li);
      });
      var wins = done.filter(function (li) {
        return lineSum(grid, li) === 10;
      });
      MQ.clear(work);
      if (wins.length) {
        wins.forEach(function (li) {
          board.hl(LINES[li], 'dct-win');
        });
        work.appendChild(lineWorking(grid, wins[0]));
        ended = true;
        rollBtn.disabled = true;
        again.style.display = '';
        if (who === 'bolt') {
          api.say('Bolt wins this time! The ' + LINE_NAMES[wins[0]] + ' makes one whole.', 'happy');
          api.feedback('Bolt finished a line of 10/10. Press "New game" for another go!', 'info');
          setTurn('Bolt won');
        } else {
          api.sound('star');
          api.say('One whole! The ' + LINE_NAMES[wins[0]] + ' makes 10/10.', 'cheer');
          api.feedback('You win! 10 tenths make 1 whole.', 'good');
          setTurn('You won!');
        }
        return true;
      }
      var over = done.filter(function (li) {
        return lineSum(grid, li) > 10;
      });
      if (over.length && who === 'you') {
        work.appendChild(lineWorking(grid, over[0]));
        api.feedback('The ' + LINE_NAMES[over[0]] + ' is ' + lineSum(grid, over[0]) + '/10. That is more than one whole, so it does not win.', 'info');
      }
      if (grid.every(function (v) {
        return v > 0;
      })) {
        ended = true;
        rollBtn.disabled = true;
        again.style.display = '';
        api.say('The grid is full. Nobody made exactly one whole!', 'think');
        setTurn('Grid full');
        return true;
      }
      return false;
    }

    function place(idx) {
      if (ended) return;
      if (busy) {
        api.feedback('Wait for Bolt to finish his turn.', 'info');
        return;
      }
      if (!rolled) {
        api.feedback('Roll the dice first!', 'info');
        return;
      }
      if (grid[idx]) {
        api.feedback('That box already has a number. Pick an empty one.', 'info');
        return;
      }
      var missed = winners(grid, rolled).filter(function (i) {
        return i !== idx;
      });
      var v = rolled;
      grid[idx] = v;
      rolled = 0;
      board.boxes.forEach(function (b) {
        b.classList.remove('dct-new');
      });
      board.set(idx, v, 'dct-new');
      api.sound('click');
      panel.update(grid);
      moves++;
      if (opts.onMove) opts.onMove(moves);
      var over = finishCheck(idx, 'you');
      if (over) return;
      if (missed.length && winsAt(grid, idx, v).length === 0) {
        api.feedback('Tip: a different box would have made one whole with your ' + v + '!', 'info');
      } else if (!opts.vsBolt) {
        api.feedback('Roll again!', 'info');
      }
      die.show(0);
      if (opts.vsBolt) {
        busy = true;
        rollBtn.disabled = true;
        setTurn("Bolt's turn");
        api.later(boltTurn, 900);
      } else {
        rollBtn.disabled = false;
      }
    }

    function boltTurn() {
      die.roll(function (v) {
        // Bolt plays simply: take a winning box if there is one, otherwise any empty box.
        var w = winners(grid, v);
        var empty = [];
        for (var i = 0; i < 9; i++) if (!grid[i]) empty.push(i);
        var idx = w.length ? U.pick(w) : U.pick(empty);
        api.say('I rolled a ' + v + '.', 'think');
        api.later(function () {
          grid[idx] = v;
          board.boxes.forEach(function (b) {
            b.classList.remove('dct-new');
          });
          board.set(idx, v, 'dct-new');
          board.boxes[idx].classList.add('dct-bolt');
          api.sound('pop');
          panel.update(grid);
          if (finishCheck(idx, 'bolt')) {
            busy = false;
            return;
          }
          busy = false;
          die.show(0);
          rollBtn.disabled = false;
          setTurn('Your turn');
          api.say('Your turn! Roll the dice.', 'happy');
        }, 700);
      });
    }

    board.onPick(place);
    makeDraggable(die, api, function () {
      return rolled > 0 && !busy && !ended;
    }, place);
    reset();
    return { board: board };
  }

  /* ---------------- learn screens ---------------- */
  var learn = [
    function (stage, api) {
      api.say('Roll the dice and put your number in a box. Make a line add up to one whole!');
      api.lockNext();
      stage.appendChild(MQ.ui.lesson('Every box is tenths', 'Your dice number goes on top. A line of three that makes ' + frac(10, 10) + ' = <b>1 whole</b> wins.'));
      makeGame(stage, api, {
        vsBolt: false,
        onMove: function (n) {
          if (n === 3) {
            api.unlockNext();
            api.say('Watch the bars: each line fills towards one whole.', 'happy');
          }
        },
      });
    },
    function (stage, api) {
      api.say('I rolled a 3. Which box makes a line exactly one whole?', 'think');
      api.lockNext();
      stage.appendChild(MQ.ui.lesson('Find the winning box', 'Bolt rolled a <b>3</b>. Put it where a line makes exactly ' + frac(10, 10) + '.'));
      var grid = PUZZLE.grid.slice();
      var roll = PUZZLE.roll;
      var board = makeBoard(grid);
      var panel = makePanel(board);
      var die = makeDie(api, roll);
      var work = el('div', { class: 'dct-work' });
      var done = false;
      stage.appendChild(el('div', { class: 'dct-play' }, board.el, el('div', { class: 'dct-side' }, el('div', { class: 'dct-turn' }, 'Roll: ' + roll), die), panel.el));
      stage.appendChild(work);
      panel.update(grid);
      function pick(idx) {
        if (done) return;
        board.clear('dct-peek');
        board.clear('dct-bad');
        if (grid[idx]) {
          api.feedback('That box already has a number. Try an empty box.', 'info');
          return;
        }
        var wins = winsAt(grid, idx, roll);
        MQ.clear(work);
        if (wins.length) {
          done = true;
          grid[idx] = roll;
          board.set(idx, roll, 'dct-new');
          wins.forEach(function (li) {
            board.hl(LINES[li], 'dct-win');
          });
          panel.update(grid);
          work.appendChild(lineWorking(grid, wins[0]));
          api.sound('correct');
          api.say('Yes! The ' + LINE_NAMES[wins[0]] + ' makes one whole. Check columns and diagonals too!', 'cheer');
          api.feedback('3 + 3 + 4 = 10 tenths = 1 whole.', 'good');
          api.unlockNext();
          return;
        }
        var fin = linesFinishedBy(grid, idx);
        board.boxes[idx].classList.add('dct-bad');
        api.sound('wrong');
        if (!fin.length) {
          api.feedback('That box does not finish a line of three yet. Look for a line with two numbers already.', 'try');
          return;
        }
        fin.forEach(function (li) {
          board.hl(LINES[li], 'dct-peek');
        });
        work.appendChild(lineWorking(grid, fin[0], { idx: idx, v: roll }));
        var t = lineSum(grid, fin[0]) + roll;
        api.feedback('The ' + LINE_NAMES[fin[0]] + ' would be ' + t + '/10. ' + (t > 10 ? 'That is more than one whole.' : 'That is not one whole yet.') + ' Try another box.', 'try');
      }
      board.onPick(pick);
      makeDraggable(die, api, function () {
        return !done;
      }, pick);
    },
    function (stage, api) {
      api.say("Let's play! You go first. I'll take turns with you.", 'happy');
      api.lockNext();
      stage.appendChild(MQ.ui.lesson('Play against Bolt', 'Take turns. The first to finish a line of exactly ' + frac(10, 10) + ' wins.'));
      makeGame(stage, api, {
        vsBolt: true,
        onMove: function (n) {
          if (n === 2) api.unlockNext();
        },
      });
    },
  ];

  /* ---------------- practice ---------------- */
  var deck = null;

  function renderLine(stage, api, q) {
    var li = q.line;
    var name = LINE_NAMES[li];
    api.say('Which dice number makes the ' + name + ' one whole?', 'think');
    stage.appendChild(MQ.ui.prompt('Which dice number makes the <b>' + name + '</b> exactly one whole?'));
    var board = makeBoard(q.grid, { small: true });
    board.boxes.forEach(function (b, i) {
      b.disabled = true;
      if (LINES[li].indexOf(i) === -1) {
        b.classList.add('dct-off');
        b.innerHTML = '';
      } else b.classList.add('dct-line');
    });
    board.boxes[q.missing].classList.add('dct-target');
    var vals = LINES[li].map(function (i) {
      return i === q.missing ? '?' : q.grid[i];
    });
    var sentence = el('div', {
      class: 'sum-row dct-sentence',
      html: vals
        .map(function (v) {
          return '<span class="chip dct-chip">' + frac(v, 10) + '</span>';
        })
        .join('<span class="sum-op">+</span>') + '<span class="sum-op">=</span><span class="chip chip-total dct-chip">' + frac(10, 10) + '</span>',
    });
    var answered = false;
    var ch = MQ.ui.choices(
      U.range(1, 6).map(function (n) {
        return { label: dieSvg(n, 46), value: n };
      }),
      function (v) {
        answer(v, String(v));
      },
      { columns: 6 }
    );
    ch.classList.add('dct-faces');
    ch.buttons.forEach(function (b) {
      b.setAttribute('data-value', b.value_);
      b.classList.add('dct-face');
    });
    var input = MQ.ui.numberInput({
      prefix: 'or type it:',
      unit: '/10',
      label: 'Missing numerator',
      onSubmit: function (num, raw) {
        answer(num, raw);
      },
    });
    var work = el('div', { class: 'dct-work' });
    stage.appendChild(el('div', { class: 'dct-qrow' }, board.el, el('div', { class: 'dct-qside' }, sentence, ch, input.el)));
    stage.appendChild(work);

    function finish(n) {
      answered = true;
      ch.mark(q.answer, 'good');
      ch.disable();
      input.disable();
      board.set(q.missing, q.answer, 'dct-new');
      board.hl(LINES[li], 'dct-win');
      sentence.querySelectorAll('.dct-chip')[LINES[li].indexOf(q.missing)].innerHTML = frac(q.answer, 10);
      MQ.clear(work);
      work.appendChild(lineWorking(q.grid.map(function (v, i) {
        return i === q.missing ? q.answer : v;
      }), li));
    }

    function answer(n, raw) {
      if (answered) return;
      var m = String(raw).trim().match(/^(\d+)\s*\/\s*(\d+)$/);
      if (m) {
        if (+m[2] !== 10) {
          input.bad();
          api.check(false, 'Only the top numbers add up. The bottom number stays 10, because they are all tenths.', 'Added the denominators');
          return;
        }
        n = +m[1];
      }
      if (!(n >= 1 && n <= 10) || Math.round(n) !== n) {
        api.feedback('A dice shows a whole number from 1 to 6.', 'info');
        return;
      }
      var total = q.partial + n;
      if (total === 10) {
        input.setValue(String(n));
        input.good();
        finish(n);
        api.check(true, q.partial + ' tenths + ' + n + ' tenths = 10 tenths = 1 whole!');
        return;
      }
      if (n >= 1 && n <= 6) ch.mark(n, 'bad');
      var strong = api.tries() >= 1;
      if (total > 10) {
        api.check(false, strong ? 'Count on from ' + q.partial + ' to 10. How many jumps is that?' : 'That makes ' + total + '/10. That is more than one whole. Try a smaller number.', 'Line adds to more than one whole');
      } else {
        api.check(false, strong ? 'Count on from ' + q.partial + ' to 10. How many jumps is that?' : 'That makes ' + total + '/10. Not one whole yet. Try a bigger number.', 'Line adds to less than one whole');
      }
    }

    api.onReveal(function () {
      finish(q.answer);
      input.setValue(String(q.answer));
      api.feedback('The line has ' + q.partial + ' tenths. ' + q.partial + ' + ' + q.answer + ' = 10, so the dice needs to show ' + q.answer + '.', 'info');
    });
  }

  function renderGrid(stage, api, q) {
    var three = api.level === 3;
    api.say(three ? 'Is there a winning box? Check every line!' : 'Where does your ' + q.roll + ' win?', 'think');
    stage.appendChild(
      MQ.ui.prompt('You rolled a <b>' + q.roll + '</b>. ' + (three ? 'Click a winning box, or press <b>No winning move</b>.' : 'Click the box that makes a line exactly ' + frac(10, 10) + '.'))
    );
    var board = makeBoard(q.grid, { small: true });
    var die = makeDie(api, q.roll);
    var noWin = three ? el('button', { class: 'btn btn-ghost dct-nowin', type: 'button' }, 'No winning move') : null;
    var work = el('div', { class: 'dct-work' });
    stage.appendChild(el('div', { class: 'dct-qrow' }, board.el, el('div', { class: 'dct-side' }, el('div', { class: 'dct-turn' }, 'Your roll'), die, noWin)));
    stage.appendChild(work);
    var answered = false;
    var winLines = [];
    q.winners.forEach(function (i) {
      winsAt(q.grid, i, q.roll).forEach(function (li) {
        if (winLines.indexOf(li) === -1) winLines.push(li);
      });
    });
    var winsOnlyColDiag = winLines.length > 0 && winLines.every(function (li) {
      return !isRow(li);
    });

    function showWins(picked) {
      answered = true;
      if (noWin) noWin.disabled = true;
      board.boxes.forEach(function (b) {
        b.disabled = true;
        b.classList.remove('dct-bad', 'dct-peek');
      });
      MQ.clear(work);
      work.classList.toggle('dct-work-two', q.winners.length > 1);
      var order = q.winners.slice();
      if (picked != null) order.sort(function (a, b) {
        return (b === picked) - (a === picked);
      });
      order.forEach(function (i) {
        board.set(i, q.roll, 'dct-new');
        winsAt(q.grid, i, q.roll).forEach(function (li) {
          board.hl(LINES[li], 'dct-win');
          work.appendChild(lineWorking(q.grid, li, { idx: i, v: q.roll }));
        });
      });
    }

    function showNone() {
      answered = true;
      if (noWin) {
        noWin.disabled = true;
        noWin.classList.add('dct-nowin-good');
      }
      board.boxes.forEach(function (b) {
        b.disabled = true;
        b.classList.remove('dct-bad', 'dct-peek');
      });
      MQ.clear(work);
      var list = el('div', { class: 'dct-nonelist' });
      for (var i = 0; i < 9; i++) {
        linesFinishedBy(q.grid, i).forEach(function (li) {
          var vals = lineValues(q.grid, li, { idx: i, v: q.roll });
          var t = lineSum(q.grid, li) + q.roll;
          list.appendChild(
            el('div', {
              class: 'dct-noneitem',
              html: '<b>' + LINE_SHORT[li] + ':</b> ' + vals.join(' + ') + ' = ' + t + ' tenths ' + (t > 10 ? '(too much)' : '(not enough)'),
            })
          );
        });
      }
      work.appendChild(el('div', { class: 'dct-working' }, el('div', { class: 'dct-wname' }, 'Your ' + q.roll + ' could finish these lines. None makes exactly 10:'), list));
    }

    function pick(idx) {
      if (answered || api.isAnswered()) return;
      board.clear('dct-peek');
      if (q.grid[idx]) {
        api.feedback('That box already has a number. Pick an empty box.', 'info');
        return;
      }
      if (q.winners.indexOf(idx) !== -1) {
        var li0 = winsAt(q.grid, idx, q.roll)[0];
        showWins(idx);
        var other = q.winners.length > 1 ? ' Another box wins too!' : '';
        api.check(true, 'The ' + LINE_NAMES[li0] + ' makes 10/10 = 1 whole!' + other);
        return;
      }
      var fin = linesFinishedBy(q.grid, idx);
      var over = fin.filter(function (li) {
        return lineSum(q.grid, li) + q.roll > 10;
      });
      var under = fin.filter(function (li) {
        return lineSum(q.grid, li) + q.roll < 10;
      });
      board.boxes[idx].classList.add('dct-bad');
      api.later(function () {
        board.boxes[idx].classList.remove('dct-bad');
      }, 900);
      var hint;
      var tag;
      if (over.length) {
        hint = 'The ' + LINE_NAMES[over[0]] + ' would be ' + (lineSum(q.grid, over[0]) + q.roll) + '/10. That is more than one whole.';
        tag = 'Line adds to more than one whole';
      } else if (under.length) {
        hint = 'The ' + LINE_NAMES[under[0]] + ' would be ' + (lineSum(q.grid, under[0]) + q.roll) + '/10. It needs exactly 10/10.';
        tag = 'Line adds to less than one whole';
      } else {
        hint = 'That box does not finish a line of three yet.';
        tag = 'Chose a box that does not finish a line';
      }
      if (winsOnlyColDiag && !over.length && fin.every(isRow)) tag = 'Missed a column or diagonal';
      if (api.tries() >= 1) {
        if (q.kind === 'none') hint += ' Check every line the ' + q.roll + ' could finish. Does any make exactly 10?';
        else {
          var wl = winLines[0];
          hint += ' Look at the ' + LINE_NAMES[wl] + ': it has ' + lineSum(q.grid, wl) + '/10 so far.';
        }
      } else if (q.kind !== 'none' && winsOnlyColDiag) {
        hint += ' Check the columns and diagonals too.';
      }
      api.check(false, hint, tag);
    }

    board.onPick(pick);
    makeDraggable(die, api, function () {
      return !answered && !api.isAnswered();
    }, pick);

    if (noWin) {
      noWin.addEventListener('click', function () {
        if (answered || api.isAnswered()) return;
        if (q.kind === 'none') {
          showNone();
          api.check(true, 'Right! No box makes exactly 10/10 with a ' + q.roll + '.');
          return;
        }
        var h = api.tries() >= 1 ? 'There is a winning box! Look at the ' + LINE_NAMES[winLines[0]] + '.' : 'There is a winning box! Check the rows, the columns and the diagonals.';
        api.check(false, h, winsOnlyColDiag ? 'Missed a column or diagonal' : 'Missed a winning line');
      });
    }

    api.onReveal(function () {
      if (q.kind === 'none') {
        showNone();
        api.feedback('No line makes exactly 10 tenths with a ' + q.roll + ', so there is no winning move.', 'info');
      } else {
        showWins(null);
        api.feedback(q.winners.length > 1 ? 'Two boxes win! Each one finishes a line of 10/10 = 1 whole.' : 'The ' + LINE_NAMES[winLines[0]] + ' makes 10/10 = 1 whole.', 'info');
      }
    });
  }

  var def = {
    learn: learn,
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'line') renderLine(stage, api, q);
        else renderGrid(stage, api, q);
      },
    },
  };
  // Hooks for the deck test (not used by the app).
  def._test = { buildDeck: buildDeck, puzzle: PUZZLE, lines: LINES };
  MQ.register(ID, def);

  var css = [
    '.dct-play{display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start;justify-content:center;width:100%}',
    '.dct-board{display:grid;grid-template-columns:repeat(3,88px);grid-template-rows:repeat(3,88px);gap:8px;padding:10px;background:#eef2fb;border-radius:18px;border:3px solid var(--line)}',
    '.dct-board-sm{grid-template-columns:repeat(3,80px);grid-template-rows:repeat(3,80px)}',
    '.dct-box{border:3px solid var(--line);border-radius:14px;background:#fff;color:var(--ink);font-family:inherit;font-size:1.5rem;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;transition:background .15s,border-color .15s}',
    '.dct-box:hover:not(:disabled){border-color:var(--accent)}',
    '.dct-box:disabled{cursor:default}',
    '.dct-empty .dct-fn{color:#9aa5c0}',
    '.dct-new{background:#e8f1ff;border-color:#4d96ff}',
    '.dct-new .dct-fn{color:#1f6fe5}',
    '.dct-work-two .dct-sum{font-size:.95rem;gap:4px}',
    '.dct-work-two .dct-chip{padding:2px 7px}',
    '.dct-work-two .dct-seg{width:16px;height:16px}',
    '.dct-bolt{background:#f1ecff;border-color:#9b7bff}',
    '.dct-peek{background:#eaf7ff;border-color:#8ecae6}',
    '.dct-line{border-color:#8ecae6}',
    '.dct-target{border-style:dashed;border-color:var(--accent);background:#fffbea}',
    '.dct-win{background:#fff3cd!important;border-color:var(--gold)!important;box-shadow:0 0 0 3px #ffe08a}',
    '.dct-bad{background:var(--try-bg);border-color:var(--try)}',
    '.dct-off{background:transparent;border:2px dashed #d5dbea;opacity:.6}',
    '.dct-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;font-weight:800}',
    '.dct-fn{padding:0 .15em}',
    '.dct-fd{border-top:3px solid currentColor;padding:0 .15em}',
    '.dct-side{display:flex;flex-direction:column;align-items:center;gap:10px;min-width:120px}',
    '.dct-turn{font-weight:800;font-size:1.05rem;color:var(--ink-soft)}',
    '.dct-die{border-radius:14px;line-height:0;user-select:none}',
    '.dct-die-ready{cursor:grab;filter:drop-shadow(0 3px 0 rgba(0,0,0,.15))}',
    '.dct-die.dragging{opacity:.5}',
    '.dct-rolling{animation:dct-wob .14s linear infinite}',
    '@keyframes dct-wob{50%{transform:rotate(12deg)}}',
    '.dct-die-body{fill:#fff;stroke:#33415c;stroke-width:3}',
    '.dct-pip{fill:#33415c}',
    '.dct-die-q{font-size:28px;font-weight:800;fill:#9aa5c0}',
    '.dct-ghost{position:fixed;z-index:1000;pointer-events:none;line-height:0}',
    '.dct-panel{background:#fff;border:3px solid var(--line);border-radius:16px;padding:8px 12px;display:flex;flex-direction:column;gap:3px;min-width:0}',
    '.dct-panel-title{font-weight:800;color:var(--ink-soft);font-size:.95rem}',
    '.dct-prow{display:grid;grid-template-columns:88px auto 92px;align-items:center;gap:8px;font-size:.9rem;border-radius:8px;padding:1px 4px;cursor:default}',
    '.dct-prow:hover{background:#eaf7ff}',
    '.dct-pname{font-weight:700}',
    '.dct-ptot{font-weight:800;white-space:nowrap}',
    '.dct-ptot .dct-frac{font-size:.85rem}',
    '.dct-ptot .dct-fd{border-top-width:2px}',
    '.dct-prow-win{background:#fff3cd}',
    '.dct-prow-over .dct-ptot{color:var(--try)}',
    '.dct-pbar .dct-seg{width:11px;height:14px}',
    '.dct-bar{display:inline-flex;align-items:center;gap:2px}',
    '.dct-seg{display:inline-block;width:22px;height:22px;border:2px solid #b8c4e3;border-radius:4px;background:#fff;box-sizing:border-box}',
    '.dct-seg-over{background:var(--try)!important;border-color:var(--try)}',
    '.dct-pbar .dct-bar-mark{height:16px}',
    '.dct-bar-mark{display:inline-block;width:3px;height:26px;background:var(--ink);margin:0 2px;border-radius:2px}',
    '.dct-work{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;gap:8px 26px;min-height:10px;width:100%}',
    '.dct-working{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.dct-wname{font-weight:800;color:var(--ink-soft)}',
    '.dct-sum{font-size:1.15rem}',
    '.dct-chip{padding:4px 10px}',
    '.dct-chip-no{background:var(--try-bg);border-color:var(--try)}',
    '.dct-not{font-weight:800;color:var(--try);font-size:1rem}',
    '.dct-qrow{display:flex;flex-wrap:wrap;gap:22px;align-items:center;justify-content:center;width:100%}',
    '.dct-qside{display:flex;flex-direction:column;align-items:center;gap:14px;max-width:460px}',
    '.dct-sentence{font-size:1.35rem}',
    '.dct-faces{max-width:440px}',
    '.dct-face{padding:4px;min-height:56px;line-height:0}',
    '.dct-faces .choice.bad .dct-die-body{fill:var(--try-bg);stroke:var(--try)}',
    '.dct-faces .choice.good .dct-die-body{fill:var(--good-bg);stroke:var(--good)}',
    '.dct-nowin{font-size:1.05rem}',
    '.dct-nowin-good:disabled{opacity:1}',
    '.dct-nowin-good{border-color:var(--good)!important;color:var(--good)!important;background:var(--good-bg)!important}',
    '.dct-nonelist{display:grid;grid-template-columns:repeat(2,minmax(0,auto));gap:4px 8px;font-size:1rem}',
    '.dct-noneitem{background:#fff;border:2px solid var(--line);border-radius:10px;padding:4px 10px}',
    '@media (max-width:640px){.dct-nonelist{grid-template-columns:1fr}}',
    '@media (max-width:860px){.dct-board{grid-template-columns:repeat(3,76px);grid-template-rows:repeat(3,76px)}.dct-side{flex-direction:row;flex-wrap:wrap;justify-content:center}.dct-seg{width:18px;height:18px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

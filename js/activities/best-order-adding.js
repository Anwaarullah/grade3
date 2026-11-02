/* Best Order Adding — reorder single digits into pairs that make 10 or doubles, add 3-digit
 * numbers read from a digit grid, and write a grid number in words (Unit 9.1). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;
  var ID = 'best-order-adding';

  /* ---------------- data ---------------- */

  // The 3 by 3 digit grid (rows read 132, 253, 341; columns read 123, 354, 231).
  var GRID = [
    [1, 3, 2],
    [2, 5, 3],
    [3, 4, 1],
  ];
  function gridLines() {
    var out = [];
    var r, c;
    for (r = 0; r < 3; r++) {
      out.push({ key: 'r' + r, kind: 'row', name: 'row ' + (r + 1), value: GRID[r][0] * 100 + GRID[r][1] * 10 + GRID[r][2], cells: [[r, 0], [r, 1], [r, 2]] });
    }
    for (c = 0; c < 3; c++) {
      out.push({ key: 'c' + c, kind: 'col', name: 'column ' + (c + 1), value: GRID[0][c] * 100 + GRID[1][c] * 10 + GRID[2][c], cells: [[0, c], [1, c], [2, c]] });
    }
    return out;
  }

  var ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  var TEENS = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var TENS = ['', 'ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  /** British words for 1-999: 253 -> "two hundred and fifty-three". */
  function inWords(n) {
    var h = Math.floor(n / 100);
    var rest = n % 100;
    var t = Math.floor(rest / 10);
    var o = rest % 10;
    var s = h ? ONES[h] + ' hundred' : '';
    if (rest) {
      var tail = rest < 10 ? ONES[o] : rest < 20 ? TEENS[rest - 10] : TENS[t] + (o ? '-' + ONES[o] : '');
      s += (h ? ' and ' : '') + tail;
    }
    return s;
  }

  function friendly(a, b) {
    return a + b === 10 || a === b;
  }
  function pairText(a, b) {
    if (a + b === 10) return a + ' + ' + b + ' = 10';
    return a + ' + ' + b + ' = ' + (a + b) + ' (double ' + a + ')';
  }
  function sum(arr) {
    return arr.reduce(function (s, v) {
      return s + v;
    }, 0);
  }
  /** "10 + 10 = 20, 20 + 7 = 27" style chain. If `stopBefore` the last answer is a "?". */
  function chain(parts, stopBefore) {
    var acc = parts[0];
    var bits = [];
    for (var i = 1; i < parts.length; i++) {
      var next = acc + parts[i];
      var last = i === parts.length - 1;
      bits.push(acc + ' + ' + parts[i] + ' = ' + (last && stopBefore ? '?' : next));
      acc = next;
    }
    return bits.join(', ');
  }

  /* ---------------- shared widgets ---------------- */

  /** A big digit card (or balloon) as a button. */
  function cardEl(v, balloon, idx, onClick) {
    return el(
      'button',
      { class: 'boa-card' + (balloon ? ' boa-balloon boa-b' + (idx % 5) : ''), type: 'button', 'aria-label': 'Card ' + v, onclick: onClick },
      el('span', { class: 'boa-num' }, String(v))
    );
  }

  /**
   * Click two cards to join them as a friendly pair (makes 10, or a double).
   * opts: { api, balloon, onPair(group), onBad(a, b), onDone() }
   * onDone fires when no friendly pair is left among the unpaired cards.
   */
  function pairBoard(digits, opts) {
    var api = opts.api;
    var cards = digits.map(function (v, i) {
      return { v: v, i: i, group: null, btn: null };
    });
    var groups = [];
    var sel = null;
    var locked = !!opts.startLocked;
    var doneFired = false;
    var row = el('div', { class: 'boa-cards' });
    var tray = el('div', { class: 'boa-tray' });
    var wrap = el('div', { class: 'boa-board' + (locked ? ' boa-locked' : '') }, row, tray);

    cards.forEach(function (c) {
      c.btn = cardEl(c.v, opts.balloon, c.i, function () {
        click(c);
      });
      row.appendChild(c.btn);
    });

    function unpaired() {
      return cards.filter(function (c) {
        return !c.group;
      });
    }
    function findFriendly() {
      var u = unpaired();
      var i, j;
      for (i = 0; i < u.length; i++) for (j = i + 1; j < u.length; j++) if (u[i].v + u[j].v === 10) return [u[i], u[j]];
      for (i = 0; i < u.length; i++) for (j = i + 1; j < u.length; j++) if (u[i].v === u[j].v) return [u[i], u[j]];
      return null;
    }
    function click(c) {
      if (locked || c.group) return;
      MQ.sound('click');
      if (sel === c) {
        sel = null;
        c.btn.classList.remove('boa-sel');
        return;
      }
      if (!sel) {
        sel = c;
        c.btn.classList.add('boa-sel');
        return;
      }
      var a = sel;
      sel = null;
      a.btn.classList.remove('boa-sel');
      if (friendly(a.v, c.v)) {
        join(a, c, false);
      } else {
        [a, c].forEach(function (x) {
          x.btn.classList.add('boa-bad');
        });
        api.later(function () {
          a.btn.classList.remove('boa-bad');
          c.btn.classList.remove('boa-bad');
        }, 700);
        if (opts.onBad) opts.onBad(a.v, c.v);
      }
    }
    function join(a, b, silent) {
      var g = { a: a.v, b: b.v, sum: a.v + b.v, ten: a.v + b.v === 10 };
      groups.push(g);
      a.group = b.group = g;
      a.btn.classList.add('boa-gone');
      b.btn.classList.add('boa-gone');
      tray.appendChild(
        el(
          'div',
          { class: 'boa-group' + (g.ten ? '' : ' boa-group-double') },
          el('div', { class: 'boa-gcards' }, el('span', { class: 'boa-mini' }, String(a.v)), el('span', { class: 'boa-plus' }, '+'), el('span', { class: 'boa-mini' }, String(b.v))),
          el('div', { class: 'boa-glabel' }, '= ' + g.sum + (g.ten ? '' : ' double'))
        )
      );
      if (!silent) {
        MQ.sound('pop');
        if (opts.onPair) opts.onPair(g);
      }
      if (!unpaired().length) row.classList.add('boa-empty');
      if (!findFriendly() && !doneFired) {
        doneFired = true;
        if (!silent && opts.onDone) opts.onDone();
      }
    }
    return {
      el: wrap,
      cards: cards,
      groups: groups,
      unpaired: unpaired,
      findFriendly: findFriendly,
      /** Parts to add: each pair's total, then each loose card. */
      parts: function () {
        return groups
          .map(function (g) {
            return g.sum;
          })
          .concat(
            unpaired().map(function (c) {
              return c.v;
            })
          );
      },
      autoPair: function () {
        var p;
        while ((p = findFriendly())) join(p[0], p[1], true);
        doneFired = true;
      },
      lock: function () {
        locked = true;
        if (sel) sel.btn.classList.remove('boa-sel');
        sel = null;
        wrap.classList.add('boa-locked');
      },
      unlock: function () {
        locked = false;
        wrap.classList.remove('boa-locked');
      },
    };
  }

  /** "10 + 5 = ?" row of chips. fill(total) replaces the "?". */
  function working(parts) {
    var row = MQ.ui.sum(parts, null);
    row.classList.add('boa-work');
    var ans = el('span', { class: 'chip chip-total boa-q' }, '?');
    row.appendChild(el('span', { class: 'sum-op' }, '='));
    row.appendChild(ans);
    return {
      el: row,
      fill: function (t) {
        ans.textContent = String(t);
        ans.classList.add('boa-filled');
      },
    };
  }

  /** The 1-9 spinner picture. setTo(digit) turns the arrow (with a spin) to that number. */
  function spinner() {
    var S = 200;
    var root = svg('svg', { viewBox: '0 0 ' + S + ' ' + S, width: 190, height: 190, class: 'boa-spinner', role: 'img', 'aria-label': 'Spinner numbered 1 to 9' });
    root.appendChild(svg('circle', { cx: 100, cy: 100, r: 92, class: 'boa-sp-face' }));
    for (var k = 1; k <= 9; k++) {
      var a = ((k - 1) * 40 - 20) * (Math.PI / 180);
      root.appendChild(svg('line', { x1: 100, y1: 100, x2: 100 + 92 * Math.sin(a), y2: 100 - 92 * Math.cos(a), class: 'boa-sp-line' }));
      var m = (k - 1) * 40 * (Math.PI / 180);
      root.appendChild(svg('text', { x: 100 + 68 * Math.sin(m), y: 100 - 68 * Math.cos(m) + 9, 'text-anchor': 'middle', class: 'boa-sp-num' }, String(k)));
    }
    var arrow = svg('g', { class: 'boa-sp-arrow' }, svg('path', { d: 'M100 30 L111 62 L104 62 L104 112 L96 112 L96 62 L89 62 Z' }));
    root.appendChild(arrow);
    root.appendChild(svg('circle', { cx: 100, cy: 100, r: 9, class: 'boa-sp-hub' }));
    var cur = 0;
    return {
      el: root,
      setTo: function (d) {
        var target = (d - 1) * 40;
        cur = cur + 720 + ((((target - (cur % 360)) % 360) + 360) % 360);
        arrow.style.transform = 'rotate(' + cur + 'deg)';
      },
    };
  }

  /**
   * 3 by 3 digit grid with arrow buttons to pick rows (→) and columns (↓).
   * opts: { max, allow: 'row'|'col'|'any', onChange(picked) }
   */
  function gridWidget(opts) {
    var lines = gridLines();
    var picked = [];
    var locked = false;
    var allow = opts.allow || 'any';
    var cellEls = [[], [], []];
    var btns = {};
    var box = el('div', { class: 'boa-grid' });
    box.appendChild(el('span', { class: 'boa-corner' }));
    lines
      .filter(function (l) {
        return l.kind === 'col';
      })
      .forEach(function (l, c) {
        btns[l.key] = el('button', { class: 'boa-arrow boa-arrow-col', type: 'button', 'aria-label': 'Read column ' + (c + 1), onclick: function () { toggle(l); } }, '↓');
        box.appendChild(btns[l.key]);
      });
    for (var r = 0; r < 3; r++) {
      (function (l) {
        btns[l.key] = el('button', { class: 'boa-arrow boa-arrow-row', type: 'button', 'aria-label': 'Read row ' + (r + 1), onclick: function () { toggle(l); } }, '→');
        box.appendChild(btns[l.key]);
      })(lines[r]);
      for (var c = 0; c < 3; c++) {
        cellEls[r][c] = el('span', { class: 'boa-cell' }, String(GRID[r][c]));
        box.appendChild(cellEls[r][c]);
      }
    }
    var chips = el('div', { class: 'boa-picked' });
    var wrap = el('div', { class: 'boa-gridwrap' }, box, chips);

    function paint() {
      var r2, c2;
      for (r2 = 0; r2 < 3; r2++) for (c2 = 0; c2 < 3; c2++) cellEls[r2][c2].className = 'boa-cell';
      Object.keys(btns).forEach(function (k) {
        btns[k].className = btns[k].className.replace(/ boa-on\d/g, '');
        var kindOk = allow === 'any' || k.charAt(0) === (allow === 'row' ? 'r' : 'c');
        btns[k].disabled = locked || !kindOk;
      });
      MQ.clear(chips);
      picked.forEach(function (l, i) {
        l.cells.forEach(function (rc) {
          var ce = cellEls[rc[0]][rc[1]];
          if (/boa-on\d/.test(ce.className)) ce.classList.add('boa-both');
          ce.className = ce.className.replace(/ boa-on\d/g, '') + ' boa-on' + i;
        });
        btns[l.key].className += ' boa-on' + i;
        chips.appendChild(el('span', { class: 'boa-pchip boa-on' + i }, el('small', null, l.name), el('b', null, String(l.value))));
      });
    }
    function toggle(l) {
      if (locked) return;
      MQ.sound('click');
      var at = picked.indexOf(l);
      if (at >= 0) picked.splice(at, 1);
      else if (picked.length < opts.max) picked.push(l);
      else return;
      paint();
      if (opts.onChange) opts.onChange(picked.slice());
    }
    paint();
    return {
      el: wrap,
      picked: function () {
        return picked.slice();
      },
      setAllow: function (a) {
        allow = a;
        paint();
      },
      pickKeys: function (keys) {
        picked = keys.map(function (k) {
          return lines.filter(function (l) {
            return l.key === k;
          })[0];
        });
        paint();
      },
      lock: function () {
        locked = true;
        paint();
      },
    };
  }

  /**
   * Column addition in the workbook's expanded layout: numbers stacked, then the ones total,
   * the tens total and the hundreds total written at full value, then the total.
   */
  function stack(nums) {
    var digit = function (n, p) {
      return Math.floor(n / p) % 10;
    };
    var ones = sum(nums.map(function (n) { return digit(n, 1); }));
    var tens = sum(nums.map(function (n) { return digit(n, 10) * 10; }));
    var hund = sum(nums.map(function (n) { return digit(n, 100) * 100; }));
    var total = ones + tens + hund;
    var box = el('div', { class: 'boa-stack' });
    nums.forEach(function (n, i) {
      box.appendChild(el('span', { class: 'boa-st-op' }, i === nums.length - 1 ? '+' : ''));
      box.appendChild(el('span', { class: 'boa-st-val' }, String(n)));
      box.appendChild(el('span', { class: 'boa-st-note' }, ''));
    });
    box.appendChild(el('span', { class: 'boa-st-rule' }));
    var rows = [
      { label: 'ones', val: ones, note: nums.map(function (n) { return digit(n, 1); }).join(' + ') },
      { label: 'tens', val: tens, note: nums.map(function (n) { return digit(n, 10) * 10; }).join(' + ') },
      { label: 'hundreds', val: hund, note: nums.map(function (n) { return digit(n, 100) * 100; }).join(' + ') },
    ];
    var vals = [];
    rows.forEach(function (rw) {
      var v = el('span', { class: 'boa-st-val boa-st-part' }, '…');
      vals.push({ v: v, rw: rw, note: null });
      box.appendChild(el('span', { class: 'boa-st-op boa-st-lab' }, rw.label));
      box.appendChild(v);
      var note = el('span', { class: 'boa-st-note' }, '');
      vals[vals.length - 1].note = note;
      box.appendChild(note);
    });
    box.appendChild(el('span', { class: 'boa-st-rule' }));
    var tv = el('span', { class: 'boa-st-val boa-st-total' }, '?');
    box.appendChild(el('span', { class: 'boa-st-op boa-st-lab' }, 'total'));
    box.appendChild(tv);
    box.appendChild(el('span', { class: 'boa-st-note' }, ''));
    return {
      el: box,
      total: total,
      ones: ones,
      tens: tens,
      hund: hund,
      /** Show the first k partial lines (k = 1..3); k = 4 also shows the total. */
      show: function (k) {
        vals.forEach(function (x, i) {
          if (i < k) {
            x.v.textContent = String(x.rw.val);
            x.v.classList.add('boa-st-shown');
            x.note.textContent = '(' + x.rw.note + ')';
          }
        });
        if (k >= 4) {
          tv.textContent = String(total);
          tv.classList.add('boa-st-shown');
        }
      },
    };
  }

  /* ---------------- practice deck ---------------- */

  function hasBond(d) {
    for (var i = 0; i < d.length; i++) for (var j = i + 1; j < d.length; j++) if (d[i] + d[j] === 10) return true;
    return false;
  }
  function gen3(kind) {
    var a, b, c;
    if (kind === 'ten') {
      a = U.pick([1, 2, 3, 4, 6, 7, 8, 9]);
      b = 10 - a;
      c = U.rand(1, 9);
      return U.shuffle([a, b, c]);
    }
    // a double and a third card that does not pair with it, so the double is the friendly pair
    a = U.rand(2, 9);
    do {
      c = U.rand(1, 9);
    } while (c === a || c + a === 10);
    return U.shuffle([a, a, c]);
  }
  function genN(n, maxTotal) {
    var d;
    for (var guard = 0; guard < 500; guard++) {
      var a = U.rand(1, 9);
      d = [a, 10 - a];
      if (a === 5) continue;
      while (d.length < n) d.push(U.rand(1, 9));
      var counts = {};
      var tooMany = d.some(function (v) {
        counts[v] = (counts[v] || 0) + 1;
        return counts[v] > 2;
      });
      if (!tooMany && sum(d) <= maxTotal && hasBond(d)) return U.shuffle(d);
    }
    return U.shuffle([9, 5, 1, 4, 8]);
  }

  function buildDeck() {
    var used = {};
    function uniq(fn) {
      var d;
      for (var i = 0; i < 50; i++) {
        d = fn();
        var k = d.slice().sort().join(',');
        if (!used[k]) {
          used[k] = true;
          return d;
        }
      }
      return d;
    }
    var lines = gridLines();
    return [
      { type: 'cards', digits: uniq(function () { return gen3('ten'); }) },
      { type: 'cards', digits: uniq(function () { return gen3('double'); }) },
      { type: 'cards', digits: uniq(function () { return gen3('ten'); }) },
      { type: 'cards', digits: uniq(function () { return genN(4, 36); }), balloon: true },
      { type: 'cards', digits: uniq(function () { return genN(5, 36); }), balloon: true },
      { type: 'eighteen' },
      { type: 'grid', n: 3 },
      { type: 'words', value: U.pick(lines).value },
    ];
  }
  var deck = null;

  /* ---------------- practice: friendly pairs, then add ---------------- */

  function cardsQuestion(stage, api, q) {
    var digits = q.digits;
    var total = sum(digits);
    var phase = 'pair';
    var addArea = el('div', { class: 'boa-add' });
    var w = null;
    var inp = null;

    if (q.balloon) {
      api.say('Pop them into friendly pairs: make 10 or a double. Then add.', 'think');
      stage.appendChild(MQ.ui.prompt('Pair up balloons that make <b>10</b> (or a <b>double</b>). Then add.'));
    } else {
      api.say('Find two cards that make 10, or a double.', 'think');
      stage.appendChild(MQ.ui.prompt('The spinner landed on these. Click two cards that make <b>10</b> (or a <b>double</b>).'));
    }

    var board = pairBoard(digits, {
      api: api,
      balloon: q.balloon,
      onBad: function (a, b) {
        var p = board.findFriendly();
        var hint;
        if (api.tries() >= 1 && p) hint = 'Try ' + p[0].v + ' and ' + p[1].v + ': ' + pairText(p[0].v, p[1].v) + '.';
        else hint = a + ' + ' + b + ' = ' + (a + b) + '. That is not 10 and not a double. What goes with ' + a + ' to make 10?';
        api.check(false, hint, 'Pair did not make 10');
      },
      onPair: function (g) {
        api.feedback(pairText(g.a, g.b) + (board.findFriendly() ? '. Any more pairs?' : ''), 'good');
        api.sound('pop');
      },
      onDone: function () {
        api.later(startAdd, 500);
      },
    });
    stage.appendChild(board.el);
    stage.appendChild(addArea);

    function startAdd() {
      if (phase !== 'pair') return;
      phase = 'add';
      board.lock();
      var parts = board.parts();
      w = working(parts);
      addArea.appendChild(el('div', { class: 'boa-step' }, 'Now add the parts:'));
      addArea.appendChild(w.el);
      inp = MQ.ui.numberInput({
        onSubmit: function (n) {
          if (n === total) {
            inp.good();
            inp.disable();
            w.fill(total);
            api.check(true, chain(parts) + '. Pairs make it easy!');
            return;
          }
          inp.bad();
          var tag, hint;
          var lost = parts.concat(digits).filter(function (p) {
            return n === total - p;
          })[0];
          if (lost != null) {
            tag = 'Lost a number when regrouping';
            hint = 'Close! Did you add every part? Check you did not leave out the ' + lost + '.';
          } else if (Math.abs(n - total) === 10) {
            tag = 'Slip adding the tens';
            hint = 'Check the tens. Start with the 10s: ' + chain(parts, true);
          } else {
            tag = 'Adding slip';
            hint = api.tries() >= 1 ? 'Step by step: ' + chain(parts, true) : 'Start with the ' + parts[0] + ', then add the next part, then the next.';
          }
          api.check(false, hint, tag);
        },
      });
      addArea.appendChild(inp.el);
      inp.focus();
      api.say('Now add the parts. Start with the ' + parts[0] + '.', 'think');
    }

    api.onReveal(function () {
      if (phase === 'pair') {
        board.autoPair();
        board.lock();
        startAdd();
      }
      var parts = board.parts();
      inp.setValue(total);
      inp.disable();
      inp.good();
      w.fill(total);
      api.feedback('Pairs first, then add: ' + chain(parts) + '.', 'info');
    });
  }

  /* ---------------- practice: three different digits make 18 ---------------- */

  function eighteenQuestion(stage, api) {
    api.say('Pick three different digits that add to 18. Use two that make 10!', 'think');
    stage.appendChild(MQ.ui.prompt('Choose <b>three different</b> digits that add up to <b>18</b>.<br>Use a pair that makes 10.'));
    var slots = [null, null, null];
    var phase = 'pick';
    var slotEls = slots.map(function (s, i) {
      return el('button', { class: 'boa-slot', type: 'button', 'aria-label': 'Slot ' + (i + 1), onclick: function () { clearSlot(i); } }, '?');
    });
    var slotRow = el('div', { class: 'boa-slots' }, slotEls[0], el('span', { class: 'boa-op' }, '+'), slotEls[1], el('span', { class: 'boa-op' }, '+'), slotEls[2], el('span', { class: 'boa-op' }, '='), el('span', { class: 'boa-target' }, '18'));
    var pad = el('div', { class: 'boa-pad' });
    U.range(1, 9).forEach(function (d) {
      pad.appendChild(cardEl(d, false, d, function () { put(d); }));
    });
    var checkBtn = el('button', { class: 'btn btn-check', type: 'button', onclick: checkDigits }, 'Check');
    var clearBtn = el('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { for (var i = 0; i < 3; i++) clearSlot(i); } }, 'Clear');
    var actions = el('div', { class: 'boa-actions' }, clearBtn, checkBtn);
    var bondArea = el('div', { class: 'boa-add' });
    stage.appendChild(slotRow);
    stage.appendChild(pad);
    stage.appendChild(actions);
    stage.appendChild(bondArea);

    function paint() {
      slots.forEach(function (v, i) {
        slotEls[i].textContent = v == null ? '?' : String(v);
        slotEls[i].classList.toggle('boa-slot-full', v != null);
      });
    }
    function put(d) {
      if (phase !== 'pick') return;
      var i = slots.indexOf(null);
      if (i < 0) return;
      slots[i] = d;
      paint();
    }
    function clearSlot(i) {
      if (phase !== 'pick') return;
      slots[i] = null;
      paint();
    }
    function checkDigits() {
      if (phase !== 'pick') return;
      if (slots.indexOf(null) >= 0) {
        api.feedback('Pick three digits first.', 'info');
        return;
      }
      var a = slots[0], b = slots[1], c = slots[2];
      var s = a + b + c;
      if (a === b || b === c || a === c) {
        var dup = a === b || a === c ? a : b;
        api.check(false, 'You used ' + dup + ' twice. The three digits must all be different.', 'Used the same card twice');
        return;
      }
      if (s !== 18) {
        var h = a + ' + ' + b + ' + ' + c + ' = ' + s + ', not 18. ';
        h += api.tries() >= 1 ? 'Pick two that make 10, like 3 and 7. Then 10 + ? = 18.' : s < 18 ? 'Try bigger digits.' : 'Try smaller digits.';
        api.check(false, h, 'Total was not 18');
        return;
      }
      if (!hasBond([a, b, c])) {
        api.check(false, 'Yes, that makes 18! But no two of them make 10. Pick a pair that makes 10, then 10 + 8 = 18.', 'Did not use a bond to 10');
        return;
      }
      // Valid: now name the bond to 10.
      phase = 'bond';
      pad.classList.add('boa-locked');
      actions.hidden = true;
      api.say('Yes! Now show the bond to 10. Click the two that make 10.', 'happy');
      api.feedback(a + ' + ' + b + ' + ' + c + ' = 18. Now name the bond to 10.', 'good');
      var bb = pairBoard([a, b, c], {
        api: api,
        onBad: function (x, y) {
          api.check(false, x + ' + ' + y + ' = ' + (x + y) + '. Which two make exactly 10?', 'Could not name the bond to 10');
        },
        onPair: function (g) {
          if (!g.ten) return; // a double cannot happen: the three digits are different
          var other = [a, b, c].filter(function (v) {
            return v !== g.a && v !== g.b;
          })[0];
          bondArea.appendChild(working([10, other]).el);
          bondArea.lastChild.querySelector('.boa-q').textContent = '18';
          api.check(true, 'The bond is ' + g.a + ' + ' + g.b + ' = 10. Then 10 + ' + other + ' = 18!');
          bb.lock();
        },
      });
      bondArea.appendChild(el('div', { class: 'boa-step' }, 'Which two make 10?'));
      bondArea.appendChild(bb.el);
    }

    api.onReveal(function () {
      phase = 'shown';
      MQ.clear(bondArea);
      var answers = [[3, 7, 8], [4, 6, 8], [1, 9, 8]];
      var ans = answers[0];
      slots = ans.slice();
      paint();
      pad.classList.add('boa-locked');
      actions.hidden = true;
      bondArea.appendChild(el('div', { class: 'boa-step' }, 'Bond to 10 first, then add 8:'));
      var g = el('div', { class: 'boa-tray' });
      answers.forEach(function (t) {
        g.appendChild(
          el(
            'div',
            { class: 'boa-group' },
            el('div', { class: 'boa-gcards' }, el('span', { class: 'boa-mini' }, String(t[0])), el('span', { class: 'boa-plus' }, '+'), el('span', { class: 'boa-mini' }, String(t[1])), el('span', { class: 'boa-plus' }, '+'), el('span', { class: 'boa-mini boa-mini-plain' }, String(t[2]))),
            el('div', { class: 'boa-glabel' }, '10 + ' + t[2] + ' = 18')
          )
        );
      });
      bondArea.appendChild(g);
      api.feedback('Any bond to 10 works, then add 8: 3 + 7 + 8, 4 + 6 + 8 or 1 + 9 + 8.', 'info');
    });
  }

  /* ---------------- practice: add numbers read from the grid ---------------- */

  function gridQuestion(stage, api, q) {
    var n = q.n;
    api.say('Pick ' + n + ' numbers from the grid. Click the arrows to read a row or a column.', 'think');
    stage.appendChild(MQ.ui.prompt('Click <b>' + n + '</b> arrows to read ' + n + ' numbers from the grid. Then add them.'));
    var addArea = el('div', { class: 'boa-add' });
    var st = null;
    var inp = null;
    var gw = gridWidget({
      max: n,
      allow: 'any',
      onChange: function (picked) {
        if (picked.length === n) api.later(start, 400);
      },
    });
    var layout = el('div', { class: 'boa-split' }, gw.el, addArea);
    stage.appendChild(layout);

    function start() {
      if (st || gw.picked().length !== n) return;
      gw.lock();
      var nums = gw.picked().map(function (l) {
        return l.value;
      });
      st = stack(nums);
      addArea.appendChild(el('div', { class: 'boa-step' }, 'Ones first, then tens, then hundreds:'));
      addArea.appendChild(st.el);
      inp = MQ.ui.numberInput({
        prefix: 'Total',
        onSubmit: function (v) {
          if (v === st.total) {
            inp.good();
            inp.disable();
            st.show(4);
            api.check(true, st.ones + ' + ' + st.tens + ' + ' + st.hund + ' = ' + st.total + '. Great column adding!');
            return;
          }
          inp.bad();
          var tag, hint;
          var left = nums.filter(function (x) {
            return v === st.total - x;
          })[0];
          if (left != null) {
            tag = 'Left a number out';
            hint = 'Close! Did you add all ' + n + ' numbers? Check ' + left + '.';
          } else if (Math.abs(v - st.total) === 10 || Math.abs(v - st.total) === 100) {
            tag = Math.abs(v - st.total) === 10 ? 'Forgot the regrouped ten' : 'Forgot the regrouped hundred';
            hint = 'Nearly! Check the ' + (Math.abs(v - st.total) === 10 ? 'tens' : 'hundreds') + '. Write each part in full: ones, tens, hundreds.';
          } else {
            tag = 'Slip adding the columns';
            hint = 'Add the ones first: ' + st.ones + '. Then the tens. Then the hundreds.';
          }
          if (api.tries() >= 1) {
            st.show(3);
            hint = 'Look at the parts: ' + st.ones + ' + ' + st.tens + ' + ' + st.hund + ' = ?';
          } else if (tag === 'Slip adding the columns') {
            st.show(1);
          }
          api.check(false, hint, tag);
        },
      });
      addArea.appendChild(inp.el);
      inp.focus();
      api.say('Now add them. Ones first!', 'think');
    }

    api.onReveal(function () {
      if (!st) {
        var keys = gw.picked().map(function (l) {
          return l.key;
        });
        ['r0', 'c1', 'r2', 'c0', 'r1', 'c2'].forEach(function (k) {
          if (keys.length < n && keys.indexOf(k) < 0) keys.push(k);
        });
        gw.pickKeys(keys);
        start();
      }
      st.show(4);
      inp.setValue(st.total);
      inp.good();
      inp.disable();
      api.feedback('Ones ' + st.ones + ', tens ' + st.tens + ', hundreds ' + st.hund + '. ' + st.ones + ' + ' + st.tens + ' + ' + st.hund + ' = ' + st.total + '.', 'info');
    });
  }

  /* ---------------- practice: a grid number in words, from tiles ---------------- */

  function wordsQuestion(stage, api, q) {
    var n = q.value;
    var h = Math.floor(n / 100);
    var t = Math.floor(n / 10) % 10;
    var o = n % 10;
    var right = [ONES[h] + ' hundred', 'and', TENS[t], ONES[o]];
    var plural = function (d, w) {
      return d + ' ' + w + (d === 1 ? '' : 's');
    };
    var PH = plural(h, 'hundred');
    var PT = plural(t, 'ten');
    var PO = plural(o, 'one');
    api.say('Build ' + n + ' in words. Click the word tiles in order.', 'think');
    stage.appendChild(MQ.ui.prompt('Write <b>' + n + '</b> in words.'));

    var ph = el(
      'div',
      { class: 'boa-pv' },
      [['hundreds', h], ['tens', t], ['ones', o]].map(function (p) {
        return el('div', { class: 'boa-pv-col' }, el('div', { class: 'boa-pv-lab' }, p[0]), el('div', { class: 'boa-pv-dig' }, String(p[1])), el('div', { class: 'boa-pv-word' }, ''));
      })
    );
    stage.appendChild(ph);

    var seq = [];
    var done = false;
    var line = el('div', { class: 'boa-line' });
    stage.appendChild(line);

    function uniqDigits() {
      var ds = [];
      [h, t, o].forEach(function (d) {
        if (ds.indexOf(d) < 0) ds.push(d);
      });
      return U.shuffle(ds);
    }
    var tileGroups = [
      { lab: 'Hundreds', words: uniqDigits().map(function (d) { return ONES[d] + ' hundred'; }), kind: 'h' },
      { lab: '', words: ['and'], kind: 'and' },
      { lab: 'Tens', words: uniqDigits().map(function (d) { return TENS[d]; }), kind: 't' },
      { lab: 'Ones', words: uniqDigits().map(function (d) { return ONES[d]; }), kind: 'o' },
    ];
    var tiles = [];
    var bank = el('div', { class: 'boa-bank' });
    tileGroups.forEach(function (g) {
      var tilesEl = el('div', { class: 'boa-bank-row' });
      bank.appendChild(el('span', { class: 'boa-bank-lab' }, g.lab));
      bank.appendChild(tilesEl);
      g.words.forEach(function (w) {
        var tile = { w: w, kind: g.kind, used: false, btn: null };
        tile.btn = el('button', { class: 'boa-tile', type: 'button', onclick: function () { add(tile); } }, w);
        tiles.push(tile);
        tilesEl.appendChild(tile.btn);
      });
    });
    stage.appendChild(bank);
    var checkBtn = el('button', { class: 'btn btn-check', type: 'button', onclick: check }, 'Check');
    var clearBtn = el('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { seq.slice().forEach(remove); } }, 'Clear');
    var actions = el('div', { class: 'boa-actions' }, clearBtn, checkBtn);
    stage.appendChild(actions);

    function paint() {
      MQ.clear(line);
      if (!seq.length) line.appendChild(el('span', { class: 'boa-line-empty' }, 'Click the tiles below…'));
      seq.forEach(function (tile) {
        line.appendChild(el('button', { class: 'boa-tile boa-tile-in', type: 'button', onclick: function () { remove(tile); } }, tile.w));
      });
      tiles.forEach(function (tile) {
        tile.btn.disabled = tile.used || done;
      });
    }
    function add(tile) {
      if (done || tile.used) return;
      MQ.sound('click');
      tile.used = true;
      seq.push(tile);
      paint();
    }
    function remove(tile) {
      if (done) return;
      tile.used = false;
      seq.splice(seq.indexOf(tile), 1);
      paint();
    }
    function showWords() {
      var words = [right[0], TENS[t], ONES[o]];
      ph.querySelectorAll('.boa-pv-word').forEach(function (w, i) {
        w.textContent = words[i];
      });
    }
    function finishLine() {
      done = true;
      paint();
      MQ.clear(line);
      line.appendChild(el('span', { class: 'boa-line-final' }, inWords(n)));
      showWords();
      actions.hidden = true;
    }
    function check() {
      if (done) return;
      if (!seq.length) {
        api.feedback('Click the word tiles to build the number.', 'info');
        return;
      }
      var got = seq.map(function (x) {
        return x.w;
      });
      if (got.join('|') === right.join('|')) {
        finishLine();
        api.check(true, n + ' is "' + inWords(n) + '". Each digit gives one word!');
        return;
      }
      var byKind = function (k) {
        return seq.filter(function (x) {
          return x.kind === k;
        });
      };
      var hs = byKind('h'), ts = byKind('t'), os = byKind('o');
      var wrongPlace = (hs[0] && hs[0].w !== right[0]) || (ts[0] && ts[0].w !== right[2]) || (os[0] && os[0].w !== right[3]) || hs.length > 1 || ts.length > 1 || os.length > 1;
      if (wrongPlace) {
        api.check(
          false,
          api.tries() >= 1 ? PH + ' is "' + right[0] + '", ' + PT + ' is "' + right[2] + '", ' + PO + ' is "' + right[3] + '".' : 'Look at the place value chart: ' + PH + ', ' + PT + ', ' + PO + '. Use one word for each.',
          'Place value slip in words'
        );
        return;
      }
      if (!hs.length || !ts.length || !os.length) {
        api.check(false, 'You need a hundreds word, a tens word and a ones word.', 'Left out part of the number');
        return;
      }
      if (!byKind('and').length) {
        api.check(false, 'Nearly! We say "and" after the hundred: ' + right[0] + ' AND ' + TENS[t] + '-' + ONES[o] + '.', 'Left out "and"');
        return;
      }
      api.check(false, 'Say it the way you read it: hundreds first, then "and", then tens, then ones.', 'Words in the wrong order');
    }
    paint();

    api.onReveal(function () {
      tiles.forEach(function (x) {
        x.used = false;
      });
      seq = right.map(function (w, i) {
        var kind = ['h', 'and', 't', 'o'][i];
        return tiles.filter(function (x) {
          return x.kind === kind && x.w === w;
        })[0];
      });
      finishLine();
      api.feedback(PH + ' → "' + right[0] + '", then "and", ' + PT + ' → "' + TENS[t] + '", ' + PO + ' → "' + ONES[o] + '": ' + inWords(n) + '.', 'info');
    });
  }

  /* ---------------- register ---------------- */

  MQ.register(ID, {
    learn: [
      // 1. Spin 7, 5, 3: add in order, then reorder to make 10.
      function (stage, api) {
        api.lockNext();
        api.say('Let\'s spin three times. Press Spin!');
        var spins = [7, 5, 3];
        var got = 0;
        var sp = spinner();
        var spinBtn = el('button', { class: 'btn boa-spin-btn', type: 'button' }, 'Spin 🌀');
        var board;
        var orderLine = el('div', { class: 'boa-add' });
        var pairLine = el('div', { class: 'boa-add' });
        board = pairBoard(spins, {
          api: api,
          startLocked: true,
          onBad: function (a, b) {
            api.feedback(a + ' + ' + b + ' = ' + (a + b) + '. That is not 10. Which card goes with 7 to make 10?', 'try');
            api.say('Not 10. Look again!', 'oops');
          },
          onPair: function () {
            board.lock();
            pairLine.appendChild(el('div', { class: 'boa-step' }, 'Make 10 first:'));
            pairLine.appendChild(MQ.ui.sum([7, 3, 5], null));
            var w = working([10, 5]);
            w.fill(15);
            pairLine.appendChild(w.el);
            api.say('7 + 3 = 10, then 10 + 5 = 15. Same total, and much easier!', 'cheer');
            api.feedback('Changing the order does not change the total.', 'good');
            api.unlockNext();
          },
        });
        board.cards.forEach(function (c) {
          c.btn.classList.add('boa-hidden');
        });
        spinBtn.addEventListener('click', function () {
          if (got >= 3 || spinBtn.disabled) return;
          spinBtn.disabled = true;
          MQ.sound('click');
          var d = spins[got];
          var me = got;
          sp.setTo(d);
          api.later(function () {
            board.cards[me].btn.classList.remove('boa-hidden');
            MQ.sound('pop');
            got++;
            if (got < 3) {
              spinBtn.disabled = false;
              api.say('It landed on ' + d + '. Spin again!');
              return;
            }
            spinBtn.hidden = true;
            orderLine.appendChild(el('div', { class: 'boa-step' }, 'In order:'));
            orderLine.appendChild(el('div', { class: 'boa-chain' }, '7 + 5 = 12, then 12 + 3 = 15'));
            api.say('In order: 7 + 5 = 12, then 12 + 3 = 15. Now click two cards that make 10.', 'think');
            board.unlock();
          }, 1150);
        });
        stage.appendChild(el('div', { class: 'boa-split' }, el('div', { class: 'boa-spinbox' }, sp.el, spinBtn), el('div', { class: 'boa-col' }, board.el, orderLine, pairLine)));
      },
      // 2. Four cards: join both pairs that make 10.
      function (stage, api) {
        api.lockNext();
        api.say('Four cards! Click two that make 10. Then find another pair.');
        stage.appendChild(MQ.ui.lesson('Join the pairs that make 10', 'Click one card, then its partner.'));
        var result = el('div', { class: 'boa-add' });
        var board = pairBoard([6, 8, 4, 2], {
          api: api,
          onBad: function (a, b) {
            api.feedback(a + ' + ' + b + ' = ' + (a + b) + '. Not 10. What goes with ' + a + ' to make 10?', 'try');
            api.say('Not 10. Try another partner.', 'oops');
          },
          onPair: function (g) {
            api.feedback(pairText(g.a, g.b) + '!', 'good');
            if (board.findFriendly()) api.say('Good! Now find the other pair.', 'happy');
          },
          onDone: function () {
            var w = working([10, 10]);
            w.fill(20);
            result.appendChild(w.el);
            api.say('Two tens make 20. So 6 + 8 + 4 + 2 = 20. Easy!', 'cheer');
            api.unlockNext();
          },
        });
        stage.appendChild(board.el);
        stage.appendChild(result);
      },
      // 3. The digit grid: read a row and a column, then add in columns.
      function (stage, api) {
        api.lockNext();
        api.say('A digit grid! Click an arrow → to read a row as a number.');
        var addArea = el('div', { class: 'boa-add' });
        var gw = gridWidget({
          max: 2,
          allow: 'row',
          onChange: function (picked) {
            if (picked.length === 1) {
              gw.setAllow('col');
              api.say('That row reads ' + picked[0].value + '. Now click an arrow ↓ to read a column.', 'happy');
            } else if (picked.length === 0) {
              gw.setAllow('row');
            } else if (picked.length === 2) {
              gw.lock();
              var a = picked[0].value, b = picked[1].value;
              var st = stack([a, b]);
              addArea.appendChild(el('div', { class: 'boa-step' }, 'Add ' + a + ' + ' + b + ': ones, tens, hundreds.'));
              addArea.appendChild(st.el);
              api.say('Now we add them. Ones first, then tens, then hundreds.', 'think');
              [1, 2, 3, 4].forEach(function (k) {
                api.later(function () {
                  st.show(k);
                  MQ.sound('pop');
                  if (k === 4) {
                    api.say(st.ones + ' + ' + st.tens + ' + ' + st.hund + ' = ' + st.total + '. Each part is written in full!', 'cheer');
                    api.unlockNext();
                  }
                }, 900 * k);
              });
            }
          },
        });
        stage.appendChild(el('div', { class: 'boa-split' }, gw.el, addArea));
      },
    ],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'cards') return cardsQuestion(stage, api, q);
        if (q.type === 'eighteen') return eighteenQuestion(stage, api);
        if (q.type === 'grid') return gridQuestion(stage, api, q);
        return wordsQuestion(stage, api, q);
      },
    },
  });

  /* ---------------- styles ---------------- */
  var css = [
    '.boa-board{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.boa-cards{display:flex;flex-wrap:wrap;justify-content:center;gap:14px;min-height:96px;align-items:flex-start}',
    '.boa-cards.boa-empty{display:none}',
    '.boa-card{position:relative;width:72px;height:90px;border-radius:14px;border:3px solid var(--line);background:#fff;color:var(--ink);font:inherit;font-size:2.5rem;font-weight:800;cursor:pointer;box-shadow:0 4px 0 var(--line);transition:transform .12s ease,border-color .12s ease,background .12s ease;padding:0}',
    '.boa-card:hover{border-color:var(--accent)}',
    '.boa-card.boa-sel{border-color:var(--accent);background:#fff7d6;transform:translateY(-8px);box-shadow:0 8px 0 var(--accent)}',
    '.boa-card.boa-bad{border-color:var(--try);background:var(--try-bg);animation:shake .35s ease}',
    '.boa-card.boa-gone,.boa-card.boa-hidden{display:none}',
    '.boa-locked .boa-card{cursor:default}',
    '.boa-locked .boa-card:hover{border-color:var(--line)}',
    '.boa-balloon{border-radius:50% 50% 46% 46%;width:76px;height:88px;margin-bottom:28px;border-color:rgba(27,42,74,.25);box-shadow:none}',
    '.boa-balloon::after{content:"";position:absolute;left:50%;top:100%;width:2px;height:28px;background:#8a96b3;margin-left:-1px}',
    '.boa-balloon.boa-sel{box-shadow:0 0 0 4px var(--accent)}',
    '.boa-b0{background:#ffd6d6}.boa-b1{background:#d6ecff}.boa-b2{background:#fff0b3}.boa-b3{background:#d9f5e3}.boa-b4{background:#eadcff}',
    '.boa-tray{display:flex;flex-wrap:wrap;justify-content:center;gap:12px}',
    '.boa-tray:empty{display:none}',
    '.boa-group{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 14px;border:3px solid var(--good);border-radius:16px;background:var(--good-bg);animation:pop .25s ease}',
    '.boa-group-double{border-color:#7a5200;background:#fff3cd}',
    '.boa-gcards{display:flex;align-items:center;gap:6px}',
    '.boa-mini{display:inline-flex;align-items:center;justify-content:center;width:46px;height:56px;border-radius:10px;border:2px solid var(--line);background:#fff;font-size:1.7rem;font-weight:800}',
    '.boa-mini-plain{border-style:dashed}',
    '.boa-plus{font-size:1.4rem;font-weight:800;color:var(--ink-soft)}',
    '.boa-glabel{font-size:1.25rem;font-weight:800;color:var(--good)}',
    '.boa-group-double .boa-glabel{color:#7a5200}',
    '.boa-add{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}',
    '.boa-add:empty{display:none}',
    '.boa-step{font-weight:800;color:var(--ink-soft);font-size:1.05rem}',
    '.boa-work{font-size:1.6rem}',
    '.boa-q.boa-filled{background:var(--good-bg);border-color:var(--good);color:var(--good)}',
    '.boa-chain{font-size:1.4rem;font-weight:800;background:var(--info-bg);border-radius:12px;padding:6px 14px}',
    '.boa-split{display:flex;flex-wrap:wrap;justify-content:center;align-items:flex-start;gap:20px 34px;width:100%}',
    '.boa-split>.boa-add{width:auto;min-width:260px}',
    '.boa-col{display:flex;flex-direction:column;align-items:center;gap:12px;min-width:260px}',
    '.boa-spinbox{display:flex;flex-direction:column;align-items:center;gap:10px}',
    '.boa-spinner{max-width:100%;height:auto}',
    '.boa-sp-face{fill:#fff;stroke:var(--ink);stroke-width:4}',
    '.boa-sp-line{stroke:#b8c4e3;stroke-width:2}',
    '.boa-sp-num{font-size:26px;font-weight:800;fill:var(--ink)}',
    '.boa-sp-arrow{transform-origin:100px 100px;transition:transform 1.1s cubic-bezier(.2,.7,.2,1)}',
    '.boa-sp-arrow path{fill:#e85d4a;stroke:#9c2d1f;stroke-width:2}',
    '.boa-sp-hub{fill:var(--ink)}',
    '.boa-spin-btn{min-width:140px}',
    '.boa-gridwrap{display:flex;flex-direction:column;align-items:center;gap:10px}',
    '.boa-grid{display:grid;grid-template-columns:repeat(4,64px);grid-template-rows:repeat(4,64px);gap:6px}',
    '.boa-cell{display:flex;align-items:center;justify-content:center;border:3px solid var(--ink);border-radius:8px;background:#fff;font-size:2rem;font-weight:800;transition:background .15s ease}',
    '.boa-arrow{border:2px dashed var(--line);border-radius:12px;background:var(--paper);color:var(--ink);font:inherit;font-size:1.8rem;font-weight:800;cursor:pointer;padding:0}',
    '.boa-arrow:hover:not(:disabled){border-color:var(--accent);background:#fff7d6}',
    '.boa-arrow:disabled{opacity:.35;cursor:default}',
    '.boa-cell.boa-on0,.boa-arrow.boa-on0,.boa-pchip.boa-on0{background:#ffe08a}',
    '.boa-cell.boa-on1,.boa-arrow.boa-on1,.boa-pchip.boa-on1{background:#a8e6da}',
    '.boa-cell.boa-on2,.boa-arrow.boa-on2,.boa-pchip.boa-on2{background:#d6c6ff}',
    '.boa-arrow.boa-on0,.boa-arrow.boa-on1,.boa-arrow.boa-on2{opacity:1;border-style:solid;border-color:var(--ink)}',
    '.boa-cell.boa-both{box-shadow:inset 0 0 0 4px #fff}',
    '.boa-picked{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;min-height:52px}',
    '.boa-pchip{display:flex;flex-direction:column;align-items:center;border-radius:12px;padding:4px 12px;border:2px solid var(--ink)}',
    '.boa-pchip small{font-size:.75rem;font-weight:700}',
    '.boa-pchip b{font-size:1.4rem}',
    '.boa-stack{display:grid;grid-template-columns:auto auto auto;column-gap:12px;row-gap:2px;align-items:center;font-size:1.6rem;font-weight:800;font-variant-numeric:tabular-nums;background:#fff;border:2px solid var(--line);border-radius:14px;padding:10px 16px}',
    '.boa-st-op{text-align:right;color:var(--ink-soft);min-width:20px}',
    '.boa-st-lab{font-size:.85rem;font-weight:800}',
    '.boa-st-val{text-align:right;min-width:72px;letter-spacing:.06em}',
    '.boa-st-part{color:#b5bfd8}',
    '.boa-st-shown{color:#0b6e66}',
    '.boa-st-total{color:#b5bfd8}',
    '.boa-st-total.boa-st-shown{color:var(--good)}',
    '.boa-st-note{font-size:.85rem;color:var(--ink-soft);font-weight:700}',
    '.boa-st-rule{grid-column:1 / -1;border-top:3px solid var(--ink);margin:4px 0}',
    '.boa-slots{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.boa-slot{width:64px;height:76px;border-radius:12px;border:3px dashed var(--line);background:var(--paper);font:inherit;font-size:2.2rem;font-weight:800;color:var(--ink-soft);cursor:pointer;padding:0}',
    '.boa-slot-full{border-style:solid;border-color:var(--accent);background:#fff;color:var(--ink)}',
    '.boa-op{font-size:1.8rem;font-weight:800;color:var(--ink-soft)}',
    '.boa-target{font-size:2.2rem;font-weight:800;color:#0b6e66}',
    '.boa-pad{display:grid;grid-template-columns:repeat(9,58px);gap:8px;justify-content:center}',
    '.boa-pad .boa-card{width:58px;height:70px;font-size:2rem}',
    '.boa-pad.boa-locked{opacity:.45;pointer-events:none}',
    '.boa-actions{display:flex;gap:10px;justify-content:center}',
    '.boa-actions[hidden]{display:none}',
    '.boa-pv{display:flex;gap:10px;justify-content:center}',
    '.boa-pv-col{display:flex;flex-direction:column;align-items:center;min-width:110px;border:2px solid var(--line);border-radius:12px;background:#fff;padding:6px 8px}',
    '.boa-pv-lab{font-size:.8rem;font-weight:800;color:var(--ink-soft);text-transform:uppercase;letter-spacing:.05em}',
    '.boa-pv-dig{font-size:2.2rem;font-weight:800}',
    '.boa-pv-word{font-size:1rem;font-weight:800;color:var(--good);min-height:1.3em}',
    '.boa-line{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center;min-height:62px;width:100%;max-width:640px;border-bottom:4px solid var(--accent);padding:6px}',
    '.boa-line-empty{color:var(--ink-soft);font-weight:700}',
    '.boa-line-final{font-size:1.7rem;font-weight:800;color:var(--good)}',
    '.boa-bank{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px 10px;align-items:center;max-width:100%}',
    '.boa-bank-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}',
    '.boa-bank-lab{font-size:.85rem;font-weight:800;color:var(--ink-soft);text-align:right}',
    '.boa-tile{border:3px solid var(--line);border-radius:12px;background:#fff;color:var(--ink);font:inherit;font-size:1.2rem;font-weight:800;padding:8px 14px;cursor:pointer;box-shadow:0 3px 0 var(--line)}',
    '.boa-tile:hover:not(:disabled){border-color:var(--accent)}',
    '.boa-tile:disabled{opacity:.3;cursor:default}',
    '.boa-tile-in{background:#fff7d6;border-color:var(--accent)}',
    '@media (max-width:640px){.boa-pad{grid-template-columns:repeat(5,58px)}.boa-grid{grid-template-columns:repeat(4,54px);grid-template-rows:repeat(4,54px)}.boa-tile{font-size:1.05rem;padding:6px 10px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

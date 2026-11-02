/* What does the table tell us? — answer questions from tally charts and frequency tables (Unit 2.1).
 * Learn: link a tally chart to a frequency table, find most / least / the same,
 *        add frequency chips for a total, count on along a number line for "how many more".
 * Practice: most / least / same (frequency tables), read one tally, total of two rows,
 *           how many more, total of all rows + which two make N, word-clue chart,
 *           spot the mistakes + what the table does NOT tell us.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  /* ---------------------------------------------------------------- *
   * Data
   * ---------------------------------------------------------------- */
  var CTX = {
    sports: { title: 'Our favourite sports', head: 'Sport', noun: 'sport', cats: [
      { k: 'football', name: 'Football', icon: '⚽' }, { k: 'swimming', name: 'Swimming', icon: '🏊' },
      { k: 'tennis', name: 'Tennis', icon: '🎾' }, { k: 'basketball', name: 'Basketball', icon: '🏀' },
      { k: 'running', name: 'Running', icon: '🏃' }, { k: 'cricket', name: 'Cricket', icon: '🏏' } ] },
    fruit: { title: 'Our favourite fruit', head: 'Fruit', noun: 'fruit', cats: [
      { k: 'apple', name: 'Apple', icon: '🍎' }, { k: 'banana', name: 'Banana', icon: '🍌' },
      { k: 'mango', name: 'Mango', icon: '🥭' }, { k: 'grapes', name: 'Grapes', icon: '🍇' },
      { k: 'pear', name: 'Pear', icon: '🍐' }, { k: 'strawberry', name: 'Strawberry', icon: '🍓' } ] },
    pets: { title: 'Pets we would like', head: 'Pet', noun: 'pet', cats: [
      { k: 'cat', name: 'Cat', icon: '🐱' }, { k: 'dog', name: 'Dog', icon: '🐶' },
      { k: 'fish', name: 'Fish', icon: '🐟' }, { k: 'rabbit', name: 'Rabbit', icon: '🐰' },
      { k: 'hamster', name: 'Hamster', icon: '🐹' }, { k: 'tortoise', name: 'Tortoise', icon: '🐢' } ] },
    school: { title: 'How we get to school', head: 'Way', noun: 'way to school', plural: 'ways to school', cats: [
      { k: 'walk', name: 'Walk', icon: '🚶' }, { k: 'bike', name: 'Bike', icon: '🚲' },
      { k: 'bus', name: 'Bus', icon: '🚌' }, { k: 'car', name: 'Car', icon: '🚗' },
      { k: 'scooter', name: 'Scooter', icon: '🛴' }, { k: 'train', name: 'Train', icon: '🚆' } ] },
    snacks: { title: 'Our favourite snacks', head: 'Snack', noun: 'snack', cats: [
      { k: 'popcorn', name: 'Popcorn', icon: '🍿' }, { k: 'carrots', name: 'Carrot sticks', icon: '🥕' },
      { k: 'cheese', name: 'Cheese', icon: '🧀' }, { k: 'crackers', name: 'Crackers', icon: '🍘' },
      { k: 'yoghurt', name: 'Yoghurt', icon: '🥣' }, { k: 'raisins', name: 'Raisins', icon: '🍇' } ] },
    drinks: { title: 'Our favourite drinks', head: 'Drink', noun: 'drink', cats: [
      { k: 'water', name: 'Water', icon: '💧' }, { k: 'milk', name: 'Milk', icon: '🥛' },
      { k: 'juice', name: 'Juice', icon: '🧃' }, { k: 'milkshake', name: 'Milkshake', icon: '🥤' },
      { k: 'cocoa', name: 'Hot chocolate', icon: '☕' }, { k: 'lemonade', name: 'Lemonade', icon: '🍋' } ] },
  };
  // Categories that are numbers: sweets in a bag (workbook p.27 style). Frequency = number of bags.
  var SWEETS = { title: 'Sweets in each bag', head: 'Sweets in a bag', freqHead: 'Number of bags', noun: 'row', who: 'bags', sweets: true,
    cats: [20, 21, 22, 23, 24, 25].map(function (n) { return { k: 's' + n, name: n + ' sweets', icon: '🍬', label: n }; }) };

  // Learn-screen sports survey. Longest name (Basketball) is not the biggest.
  var SPORTS = [
    { k: 'football', name: 'Football', icon: '⚽', n: 13 },
    { k: 'swimming', name: 'Swimming', icon: '🏊', n: 10 },
    { k: 'tennis', name: 'Tennis', icon: '🎾', n: 5 },
    { k: 'basketball', name: 'Basketball', icon: '🏀', n: 10 },
    { k: 'running', name: 'Running', icon: '🏃', n: 8 },
  ];
  var LINK_COLORS = ['#ffd166', '#8ecae6', '#b8e0a8', '#f4a6c6', '#cdb4f5'];

  /* ---------------------------------------------------------------- *
   * Small helpers
   * ---------------------------------------------------------------- */
  function sum(a) { return a.reduce(function (s, v) { return s + v; }, 0); }
  function lab(r) { return r.icon + ' ' + r.name; }
  function byKey(rows, k) { return rows.filter(function (r) { return r.k === k; })[0]; }
  function maxOf(rows) { return Math.max.apply(null, rows.map(function (r) { return r.n; })); }
  function minOf(rows) { return Math.min.apply(null, rows.map(function (r) { return r.n; })); }
  function maxLen(rows) { return Math.max.apply(null, rows.map(function (r) { return r.name.length; })); }
  function isLongest(rows, r) { return r.name.length === maxLen(rows); }
  function rowsFrom(ctx, vals) {
    return U.shuffle(ctx.cats).slice(0, vals.length).map(function (c, i) {
      return { k: c.k, name: c.name, icon: c.icon, n: vals[i], label: c.label };
    });
  }
  function distinct(n, lo, hi) { return U.shuffle(U.range(lo, hi)).slice(0, n); }
  function people(ctx) { return ctx.who || 'people'; }

  /* ---------------------------------------------------------------- *
   * Tally drawing (same gate style as the other Unit 2 activities)
   * Each drawn <line> is exactly one thing: a gate is 4 upright + 1 crossing line.
   * ---------------------------------------------------------------- */
  function tallySvg(n, perLine) {
    perLine = perLine || 5;
    var S = 10, H = 32, STEP = 50, LINE = H + 10;
    var units = [];
    for (var g = 0; g < Math.floor(n / 5); g++) units.push(5);
    if (n % 5) units.push(n % 5);
    var lines = Math.max(1, Math.ceil(units.length / perLine));
    var cols = Math.max(1, Math.min(units.length, perLine));
    var W = (cols - 1) * STEP + 46;
    var Ht = lines * LINE - 6;
    var root = svg('svg', { class: 'rt-tally', viewBox: '0 0 ' + W + ' ' + Ht, width: W, height: Ht, role: 'img', 'aria-label': 'tally marks' });
    units.forEach(function (u, i) {
      var x0 = (i % perLine) * STEP + 8;
      var y0 = Math.floor(i / perLine) * LINE + 2;
      for (var s = 0; s < Math.min(u, 4); s++) root.appendChild(svg('line', { x1: x0 + s * S, y1: y0, x2: x0 + s * S, y2: y0 + H - 4, class: 'rt-stroke' }));
      if (u === 5) root.appendChild(svg('line', { x1: x0 - 6, y1: y0 + H - 8, x2: x0 + 3 * S + 6, y2: y0 + 4, class: 'rt-stroke rt-cross' }));
    });
    return root;
  }
  /** "5, 10, 15, 16, 17" */
  function countWords(n) {
    var out = [];
    for (var v = 5; v <= n; v += 5) out.push(v);
    for (var w = Math.floor(n / 5) * 5 + 1; w <= n; w++) out.push(w);
    return out.join(', ');
  }

  /* ---------------------------------------------------------------- *
   * Table: Label | Tally? | Frequency?
   * o: rows, head, tally, freq, freqHead, onRow(k, tr), caption
   * ---------------------------------------------------------------- */
  function makeTable(o) {
    var t = { tr: {}, fcell: {}, badges: {}, locked: false };
    var head = el('tr', null, el('th', null, o.head), o.tally ? el('th', null, 'Tally') : null, o.freq ? el('th', null, o.freqHead || 'Frequency') : null);
    var body = el('tbody');
    o.rows.forEach(function (r) {
      var badges = el('span', { class: 'rt-badges' });
      t.badges[r.k] = badges;
      var labCell = el('td', { class: 'rt-labcell' }, el('span', { class: 'rt-lab' }, el('span', { class: 'rt-ico' }, r.icon), el('span', { class: 'rt-name' }, r.name)), badges);
      var tc = o.tally ? el('td', { class: 'rt-tcell' }, tallySvg(r.n)) : null;
      var fc = null;
      if (o.freq) {
        fc = el('td', { class: 'rt-fcell' }, el('span', { class: 'rt-fnum' }, String(r.written != null ? r.written : r.n)));
        t.fcell[r.k] = fc;
      }
      var tr = el('tr', { 'data-key': r.k, 'data-n': String(r.n) }, labCell, tc, fc);
      if (o.onRow) {
        tr.classList.add('rt-click');
        tr.addEventListener('click', function () {
          if (!t.locked) o.onRow(r.k, tr);
        });
      }
      t.tr[r.k] = tr;
      body.appendChild(tr);
    });
    var table = el('table', { class: 'rt-table' + (o.cls ? ' ' + o.cls : '') }, el('thead', null, head), body);
    t.el = el('div', { class: 'rt-tablewrap' }, o.caption ? el('div', { class: 'rt-cap' }, o.caption) : null, el('div', { class: 'rt-tablescroll' }, table));
    t.table = table;
    t.badge = function (k, text, cls) {
      t.badges[k].appendChild(el('span', { class: 'rt-badge ' + (cls || '') }, text));
    };
    t.mark = function (k, cls, on) {
      if (t.tr[k]) t.tr[k].classList.toggle(cls, on !== false);
    };
    t.clear = function (cls) {
      Object.keys(t.tr).forEach(function (k) { t.tr[k].classList.remove(cls); });
    };
    t.lock = function () {
      t.locked = true;
      table.classList.add('rt-locked');
    };
    return t;
  }

  /* ---------------------------------------------------------------- *
   * Working-out pictures
   * ---------------------------------------------------------------- */
  function chip(text, cls) { return el('span', { class: 'chip ' + (cls || '') }, String(text)); }
  function line() {
    var row = el('div', { class: 'rt-wline' });
    for (var i = 0; i < arguments.length; i++) {
      var a = arguments[i];
      row.appendChild(typeof a === 'string' && /^[+=−>]$/.test(a) ? el('span', { class: 'sum-op' }, a) : a instanceof Node ? a : chip(a));
    }
    return row;
  }
  /** 17 + 15 shown with tens and ones. */
  function addWork(a, b) {
    var ta = Math.floor(a / 10) * 10, tb = Math.floor(b / 10) * 10, oa = a % 10, ob = b % 10;
    return el('div', { class: 'rt-work-box' },
      line(chip(a, 'rt-c1'), '+', chip(b, 'rt-c2'), '=', chip('?', 'rt-cq')),
      el('div', { class: 'rt-wsmall' }, 'Tens: ', ta + ' + ' + tb + ' = ' + (ta + tb), el('span', { class: 'rt-sep' }, '·'), 'Ones: ', oa + ' + ' + ob + ' = ' + (oa + ob)),
      line(chip(ta + tb), '+', chip(oa + ob), '=', chip(a + b, 'chip-total')));
  }
  /** 24 + 25 = 49, 49 + 17 = 66, ... */
  function chainWork(nums) {
    var box = el('div', { class: 'rt-work-box' });
    box.appendChild(MQ.ui.sum(nums, null));
    var run = nums[0];
    for (var i = 1; i < nums.length; i++) {
      box.appendChild(el('div', { class: 'rt-wsmall' }, run + ' + ' + nums[i] + ' = ' + (run + nums[i])));
      run += nums[i];
    }
    box.appendChild(line('Total', '=', chip(run, 'chip-total')));
    return box;
  }
  /** Number line lo..hi. Returns {svg, hop(a,b,label), dot(v), onTick(fn), mark(v,cls)} */
  function numLine(lo, hi) {
    var step = 46, L = 26, W = (hi - lo) * step + 2 * L, HH = 112, base = 78;
    var root = svg('svg', { class: 'rt-nl', viewBox: '0 0 ' + W + ' ' + HH, width: W, height: HH });
    root.appendChild(svg('line', { x1: L - 14, y1: base, x2: W - L + 14, y2: base, class: 'rt-nl-axis' }));
    var hops = svg('g');
    var ticks = {};
    var handler = null;
    function x(v) { return L + (v - lo) * step; }
    for (var v = lo; v <= hi; v++) {
      (function (v) {
        var g = svg('g', { class: 'rt-nl-tick', 'data-v': String(v) },
          svg('rect', { x: x(v) - step / 2, y: base - 22, width: step, height: 52, class: 'rt-nl-hit' }),
          svg('line', { x1: x(v), y1: base - 8, x2: x(v), y2: base + 8 }),
          svg('text', { x: x(v), y: base + 28, 'text-anchor': 'middle' }, String(v)));
        g.addEventListener('click', function () { if (handler) handler(v); });
        ticks[v] = g;
        root.appendChild(g);
      })(v);
    }
    root.appendChild(hops);
    var dotEl = svg('circle', { cx: x(lo), cy: base, r: 8, class: 'rt-nl-dot' });
    return {
      svg: root,
      hop: function (a, b, label) {
        var x1 = x(a), x2 = x(b), h = 30;
        hops.appendChild(svg('path', { d: 'M' + x1 + ' ' + base + ' Q' + (x1 + x2) / 2 + ' ' + (base - 2 * h) + ' ' + x2 + ' ' + base, class: 'rt-nl-jump' }));
        hops.appendChild(svg('text', { x: (x1 + x2) / 2, y: base - h - 6, 'text-anchor': 'middle', class: 'rt-nl-lab' }, String(label)));
      },
      dot: function (v) {
        dotEl.setAttribute('cx', x(v));
        if (!dotEl.parentNode) root.appendChild(dotEl);
      },
      mark: function (v, cls) { if (ticks[v]) ticks[v].classList.add(cls); },
      onTick: function (fn) { handler = fn; root.classList.add('rt-nl-click'); },
    };
  }
  /** Count on from small to big, one hop at a time, on a number line. */
  function diffWork(rowA, rowB) {
    var a = rowA.n, b = rowB.n, d = a - b;
    var nl = numLine(b - 1, a + 1);
    nl.mark(b, 'rt-nl-start');
    nl.mark(a, 'rt-nl-end');
    for (var i = 1; i <= d; i++) nl.hop(b + i - 1, b + i, i);
    nl.dot(a);
    return el('div', { class: 'rt-work-box' },
      el('div', { class: 'rt-wsmall' }, 'Start at ' + b + ' (' + rowB.name + '). Count on to ' + a + ' (' + rowA.name + ').'),
      el('div', { class: 'rt-nlwrap' }, nl.svg),
      line(chip(a), '−', chip(b), '=', chip(d, 'chip-total')),
      el('div', { class: 'rt-wsmall' }, d + ' jumps, so ' + d + ' more.'));
  }
  /** Dots in rows of five inside a box. */
  function dotBox(n, cls) {
    var box = el('div', { class: 'rt-dots ' + (cls || '') });
    for (var i = 0; i < n; i++) box.appendChild(el('i'));
    return box;
  }
  /** Double: two equal groups. Half: one group shared into two equal groups. */
  function groupsPic(kind, base, filled) {
    var q = filled ? null : '?';
    if (kind === 'double') {
      return el('div', { class: 'rt-gpic' }, dotBox(base), el('span', { class: 'sum-op' }, '+'), dotBox(base),
        el('div', { class: 'rt-gcap' }, 'Double ' + base + ' = ' + base + ' + ' + base + ' = ' + (q || 2 * base)));
    }
    return el('div', { class: 'rt-gpic' }, el('div', { class: 'rt-half' }, dotBox(base / 2, 'rt-dots-a'), dotBox(base / 2, 'rt-dots-b')),
      el('div', { class: 'rt-gcap' }, base + ' shared into 2 equal groups: ' + (q || base / 2) + ' in each'));
  }

  /* ---------------------------------------------------------------- *
   * Drag (or click) an HTML chip into a box. Returns an unbind function.
   * ---------------------------------------------------------------- */
  function dragInto(chipEl, box, onDrop) {
    var sx = 0, sy = 0, down = false, moved = false;
    function over(e) {
      var r = box.getBoundingClientRect();
      return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    }
    function pd(e) {
      if (chipEl.disabled) return;
      e.preventDefault();
      down = true;
      moved = false;
      sx = e.clientX;
      sy = e.clientY;
      try { chipEl.setPointerCapture(e.pointerId); } catch (err) {}
      chipEl.classList.add('rt-dragging');
    }
    function pm(e) {
      if (!down) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
      chipEl.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      box.classList.toggle('rt-over', over(e));
    }
    function pu(e) {
      if (!down) return;
      down = false;
      chipEl.style.transform = '';
      chipEl.classList.remove('rt-dragging');
      box.classList.remove('rt-over');
      if (!moved || over(e)) onDrop();
    }
    chipEl.style.touchAction = 'none';
    chipEl.addEventListener('pointerdown', pd);
    chipEl.addEventListener('pointermove', pm);
    chipEl.addEventListener('pointerup', pu);
    chipEl.addEventListener('pointercancel', pu);
    return function () {
      chipEl.removeEventListener('pointerdown', pd);
      chipEl.removeEventListener('pointermove', pm);
      chipEl.removeEventListener('pointerup', pu);
      chipEl.removeEventListener('pointercancel', pu);
    };
  }

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */
  function learnLink(stage, api) {
    api.say('Two ways to show one sports survey. Are they the same data?');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Same data, two ways', 'Click a sport in the tally chart, then the same sport in the frequency table.'));
    var sel = null;
    var linked = {};
    var nLinked = 0;
    var left = makeTable({ rows: SPORTS, head: 'Sport', tally: true, caption: 'Tally chart', onRow: function (k) { pick('L', k); } });
    var right = makeTable({ rows: U.shuffle(SPORTS), head: 'Sport', freq: true, caption: 'Frequency table', onRow: function (k) { pick('R', k); } });
    var sides = { L: left, R: right };
    function pick(side, k) {
      if (linked[k]) return;
      if (!sel || sel.side === side) {
        if (sel) sides[sel.side].mark(sel.k, 'rt-sel', false);
        sel = { side: side, k: k };
        sides[side].mark(k, 'rt-sel');
        api.sound('click');
        api.feedback('Now find ' + byKey(SPORTS, k).name + ' in the ' + (side === 'L' ? 'frequency table' : 'tally chart') + '.', 'info');
        return;
      }
      var first = sel;
      sel = null;
      sides[first.side].mark(first.k, 'rt-sel', false);
      if (first.k !== k) {
        api.sound('wrong');
        api.feedback('That is a different sport. Match ' + byKey(SPORTS, first.k).name + ' with ' + byKey(SPORTS, first.k).name + '.', 'try');
        return;
      }
      var r = byKey(SPORTS, k);
      var c = LINK_COLORS[nLinked % LINK_COLORS.length];
      linked[k] = true;
      nLinked++;
      [left, right].forEach(function (t) {
        t.tr[k].style.setProperty('--rt-lc', c);
        t.mark(k, 'rt-linked');
      });
      left.badge(k, '= ' + r.n, 'rt-badge-n');
      api.sound('pop');
      if (nLinked === SPORTS.length) {
        api.say('Every row matches. Same data! The numbers are quicker to read.', 'cheer');
        api.feedback('The tally chart and the table hold the same information.', 'good');
        api.unlockNext();
      } else {
        api.feedback(r.name + ': ' + countWords(r.n) + '. The table says ' + r.n + ' too!', 'good');
      }
    }
    stage.appendChild(el('div', { class: 'rt-pair' }, left.el, right.el));
  }

  function learnMostLeast(stage, api) {
    api.say('Which sport did most people choose? Look for the biggest number.');
    api.lockNext();
    var step = 0;
    var picked = [];
    var info = MQ.ui.lesson('Most and least', 'Click the row with the <b>biggest</b> number.');
    var t = makeTable({ rows: SPORTS, head: 'Sport', tally: true, freq: true, caption: 'Our favourite sports', onRow: click });
    function click(k) {
      var r = byKey(SPORTS, k);
      if (step === 0) {
        if (r.n === maxOf(SPORTS)) {
          t.mark(k, 'rt-good');
          t.badge(k, 'most popular', 'rt-badge-most');
          api.sound('correct');
          api.say(r.n + ' is the biggest number. ' + r.name + ' is the most popular!', 'cheer');
          step = 1;
          info.querySelector('.lesson-text').innerHTML = 'Now click the row with the <b>smallest</b> number.';
        } else {
          api.sound('wrong');
          api.feedback(r.n + ' is not the biggest. Look down the Frequency column for a bigger number.', 'try');
        }
      } else if (step === 1) {
        if (r.n === minOf(SPORTS)) {
          t.mark(k, 'rt-good');
          t.badge(k, 'least popular', 'rt-badge-least');
          api.sound('correct');
          api.say(r.n + ' is the smallest number. ' + r.name + ' is the least popular.', 'cheer');
          step = 2;
          info.querySelector('.lesson-text').innerHTML = 'Two sports have <b>the same</b> number. Click them both.';
        } else {
          api.sound('wrong');
          api.feedback(r.n + ' is not the smallest. Is there a smaller number?', 'try');
        }
      } else if (step === 2) {
        if (r.n !== 10) {
          api.sound('wrong');
          api.feedback('Find two rows with exactly the same number.', 'try');
          return;
        }
        if (picked.indexOf(k) !== -1) return;
        picked.push(k);
        t.mark(k, 'rt-same');
        api.sound('pop');
        if (picked.length === 2) {
          picked.forEach(function (p) { t.badge(p, 'the same', 'rt-badge-same'); });
          t.lock();
          step = 3;
          api.say('Swimming and Basketball both have 10. They are the same!', 'cheer');
          api.feedback('Biggest number = most popular. Smallest = least popular. Equal numbers = the same.', 'good');
          api.unlockNext();
        }
      }
    }
    stage.appendChild(info);
    stage.appendChild(t.el);
  }

  function learnTotalDiff(stage, api) {
    api.say('How many people took part? Drag each number into the adding box.');
    api.lockNext();
    var info = MQ.ui.lesson('Altogether and how many more', 'Drag (or click) every frequency into the box to find the total.');
    stage.appendChild(info);
    var pool = el('div', { class: 'rt-pool' });
    var box = el('div', { class: 'rt-addbox' }, el('span', { class: 'rt-addhint' }, 'Put the numbers here'));
    var runEl = el('div', { class: 'rt-run' });
    var used = [];
    var partB = el('div', { class: 'rt-partb' });
    SPORTS.forEach(function (r) {
      var c = el('button', { class: 'rt-fchip', type: 'button', 'data-key': r.k }, el('span', null, r.icon), el('b', null, String(r.n)));
      api.cleanup(dragInto(c, box, function () {
        if (c.disabled) return;
        c.disabled = true;
        c.classList.add('rt-used');
        used.push(r.n);
        api.sound('pop');
        MQ.clear(box);
        box.appendChild(MQ.ui.sum(used, used.length === SPORTS.length ? sum(used) : null));
        runEl.textContent = used.length < SPORTS.length ? 'So far: ' + sum(used) : '';
        if (used.length === SPORTS.length) {
          api.say(sum(used) + ' people took part altogether!', 'cheer');
          api.feedback('Total = add every frequency. There are 5 rows, but ' + sum(used) + ' people.', 'good');
          api.later(showB, 900);
        }
      }));
      pool.appendChild(c);
    });
    stage.appendChild(pool);
    stage.appendChild(box);
    stage.appendChild(runEl);
    stage.appendChild(partB);

    function showB() {
      var a = SPORTS[0], b = SPORTS[4];
      var d = a.n - b.n;
      var at = b.n;
      api.say('How many more chose football than running? Count on from 8.');
      partB.appendChild(MQ.ui.prompt('⚽ Football ' + a.n + ' · 🏃 Running ' + b.n + '<br>Click the numbers to count on from <b>' + b.n + '</b> to <b>' + a.n + '</b>.'));
      var nl = numLine(b.n - 2, a.n + 2);
      nl.mark(b.n, 'rt-nl-start');
      nl.dot(b.n);
      var count = el('div', { class: 'rt-run' }, '0 jumps');
      nl.onTick(function (v) {
        if (at === a.n) return;
        if (v !== at + 1) {
          api.sound('wrong');
          api.feedback('Count on one at a time. Click ' + (at + 1) + ' next.', 'try');
          return;
        }
        nl.hop(at, v, v - b.n);
        at = v;
        nl.dot(v);
        api.sound('pop');
        count.textContent = (at - b.n) + (at - b.n === 1 ? ' jump' : ' jumps');
        if (at === a.n) {
          nl.mark(a.n, 'rt-nl-end');
          api.say(d + ' jumps! ' + d + ' more people chose football than running.', 'cheer');
          api.feedback(a.n + ' − ' + b.n + ' = ' + d + '. Count on from the smaller number to find how many more.', 'good');
          api.unlockNext();
        }
      });
      partB.appendChild(el('div', { class: 'rt-nlwrap' }, nl.svg));
      partB.appendChild(count);
    }
  }

  /* ---------------------------------------------------------------- *
   * Question generators
   * ---------------------------------------------------------------- */
  function genPick(kind, ctx) {
    for (var t = 0; t < 200; t++) {
      var rows = rowsFrom(ctx, distinct(U.rand(4, 5), 1, 15));
      var target = kind === 'most' ? maxOf(rows) : minOf(rows);
      var bad = rows.some(function (r) { return isLongest(rows, r) && (r.n === maxOf(rows) || r.n === minOf(rows)); });
      if (!bad) return { type: kind, ctx: ctx, rows: rows, ans: rows.filter(function (r) { return r.n === target; })[0].k };
    }
    return null;
  }
  function genSame(ctx) {
    var d = distinct(U.rand(3, 4), 1, 15);
    var vals = U.shuffle(d.concat([d[0]]));
    var rows = rowsFrom(ctx, vals);
    return { type: 'same', ctx: ctx, rows: rows, ans: rows.filter(function (r) { return r.n === d[0]; }).map(function (r) { return r.k; }) };
  }
  function genCount(ctx) {
    var vals = distinct(4, 6, 22);
    var rows = rowsFrom(ctx, vals);
    var big = rows.filter(function (r) { return r.n >= 11; });
    var a = U.pick(big.length ? big : rows);
    return { type: 'count', ctx: ctx, rows: rows, a: a.k, ans: a.n };
  }
  function genTotal2(ctx) {
    for (var t = 0; t < 500; t++) {
      var rows = rowsFrom(ctx, distinct(4, 6, 22));
      var pairs = [];
      for (var i = 0; i < 4; i++) for (var j = i + 1; j < 4; j++) {
        var a = rows[i].n, b = rows[j].n;
        if (a + b <= 40 && (a % 10) + (b % 10) >= 10) pairs.push([rows[i], rows[j]]);
      }
      if (pairs.length) {
        var p = U.pick(pairs);
        return { type: 'total2', ctx: ctx, rows: rows, a: p[0].k, b: p[1].k, ans: p[0].n + p[1].n };
      }
    }
    return null;
  }
  function genDiff(ctx) {
    for (var t = 0; t < 500; t++) {
      var rows = rowsFrom(ctx, distinct(4, 6, 22));
      var pairs = [];
      for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
        var d = rows[i].n - rows[j].n;
        if (d >= 2 && d <= 10) pairs.push([rows[i], rows[j]]);
      }
      if (pairs.length) {
        var p = U.pick(pairs);
        return { type: 'diff', ctx: ctx, rows: rows, a: p[0].k, b: p[1].k, ans: p[0].n - p[1].n };
      }
    }
    return null;
  }
  function genTotalAll(ctx) {
    for (var t = 0; t < 1000; t++) {
      var n = U.rand(4, 5);
      var vals = ctx.sweets ? distinct(n, 2, 18) : distinct(n, 3, 25);
      var rows = ctx.sweets ? ctx.cats.slice(0, n).map(function (c, i) { return { k: c.k, name: c.name, icon: c.icon, label: c.label, n: vals[i] }; }) : rowsFrom(ctx, vals);
      var tot = sum(vals);
      if (tot < 35 || tot > 75) continue;
      var sums = {};
      var pairs = [];
      for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) {
        var s = rows[i].n + rows[j].n;
        sums[s] = (sums[s] || 0) + 1;
        pairs.push([rows[i], rows[j], s]);
      }
      var good = pairs.filter(function (p) { return sums[p[2]] === 1 && vals.indexOf(p[2]) === -1 && p[2] >= 15; });
      if (!good.length) continue;
      var p = U.pick(good);
      return { type: 'totalall', ctx: ctx, rows: rows, ans: tot, target: p[2], pair: [p[0].k, p[1].k] };
    }
    return null;
  }
  function genClue(ctx) {
    for (var t = 0; t < 200; t++) {
      var base = U.pick([6, 8, 10, 12, 14]);
      var stated = U.rand(3, 9);
      if (stated === base || stated === base / 2 || stated === 2 * base) continue;
      var cats = U.shuffle(ctx.cats).slice(0, 4);
      var vals = [base, 2 * base, base / 2, stated];
      var rows = cats.map(function (c, i) { return { k: c.k, name: c.name, icon: c.icon, n: vals[i], rule: ['given', 'double', 'half', 'stated'][i] }; });
      return { type: 'clue', ctx: ctx, rows: rows, base: base, stated: stated, ans: sum(vals) };
    }
    return null;
  }
  var NOT_TELL = [
    function (r) { return 'Why people chose ' + r.name; },
    function (r) { return 'Why ' + r.name + ' is liked'; },
    function () { return 'The names of the people asked'; },
    function (r) { return 'Whether boys or girls chose ' + r.name + ' more'; },
  ];
  function genSpot(ctx) {
    var rows = rowsFrom(ctx, distinct(5, 4, 22));
    var wrong = U.shuffle(rows).slice(0, 2);
    wrong.forEach(function (r) {
      var opts = [1, -1, 5, -5].filter(function (d) { return r.n + d >= 1 && r.n + d <= 25; });
      r.written = r.n + U.pick(opts);
    });
    var mx = rows.filter(function (r) { return r.n === maxOf(rows); })[0];
    var other = U.pick(rows.filter(function (r) { return r !== mx; }));
    var whyRow = U.pick(rows);
    var stmts = U.shuffle([
      { text: 'Which ' + ctx.noun + ' is the most popular', not: false },
      { text: 'How many people chose ' + other.name, not: false, row: other.k },
      { text: U.pick(NOT_TELL)(whyRow), not: true },
    ]);
    return { type: 'spot', ctx: ctx, rows: rows, wrong: wrong.map(function (r) { return r.k; }), stmts: stmts, most: mx.k, other: other.k };
  }

  function buildDeck() {
    var keys = U.shuffle(Object.keys(CTX));
    var i = 0;
    function nx() { return CTX[keys[i++ % keys.length]]; }
    var q = [genPick('most', nx()), genPick('least', nx()), genSame(nx()), genCount(nx()), genTotal2(nx()), genDiff(nx())];
    q.push(genTotalAll(Math.random() < 0.5 ? SWEETS : nx()));
    q.push(genClue(nx()));
    q.push(genSpot(nx()));
    return q;
  }

  /* ---------------------------------------------------------------- *
   * Practice renderers
   * ---------------------------------------------------------------- */
  function header(stage, q, html) {
    var wrap = el('div', { class: 'rt-q', 'data-type': q.type });
    stage.appendChild(wrap);
    if (html) wrap.appendChild(MQ.ui.prompt(html));
    return wrap;
  }

  // Level 1: most / least
  function renderPick(stage, api, q) {
    var most = q.type === 'most';
    api.say(most ? 'Find the biggest number.' : 'Find the smallest number.', 'think');
    var wrap = header(stage, q, 'Which ' + q.ctx.noun + ' is the <b>' + (most ? 'most' : 'least') + ' popular</b>? Click its row.');
    var work = el('div', { class: 'rt-work' });
    var t = makeTable({ rows: q.rows, head: q.ctx.head, freq: true, caption: q.ctx.title, onRow: function (k) {
      var r = byKey(q.rows, k);
      if (k === q.ans) {
        t.mark(k, 'rt-good');
        t.badge(k, most ? 'most popular' : 'least popular', most ? 'rt-badge-most' : 'rt-badge-least');
        t.lock();
        api.check(true, r.n + ' is the ' + (most ? 'biggest' : 'smallest') + ' number, so ' + r.name + ' is the ' + (most ? 'most' : 'least') + ' popular!');
        return;
      }
      t.mark(k, 'rt-bad');
      api.later(function () { t.mark(k, 'rt-bad', false); }, 900);
      var tag, hint;
      var opposite = most ? minOf(q.rows) : maxOf(q.rows);
      if (r.n === opposite) {
        tag = most ? 'Picked the smallest instead of the biggest' : 'Picked the biggest instead of the smallest';
        hint = r.n + ' is the ' + (most ? 'smallest' : 'biggest') + ' number. ' + (most ? 'Most' : 'Least') + ' popular means the ' + (most ? 'BIGGEST' : 'SMALLEST') + ' number.';
      } else if (isLongest(q.rows, r)) {
        tag = 'Picked the longest name not the biggest number';
        hint = r.name + ' is a long word, but look at the numbers, not the names.';
      } else {
        tag = 'Did not compare every number';
        hint = 'Is there a ' + (most ? 'bigger' : 'smaller') + ' number than ' + r.n + '? Check every row.';
      }
      if (api.tries() >= 1) hint += ' Point at each number in the Frequency column and say it out loud.';
      api.check(false, hint, tag);
    } });
    wrap.appendChild(t.el);
    wrap.appendChild(work);
    api.onReveal(function () {
      var r = byKey(q.rows, q.ans);
      t.mark(q.ans, 'rt-good');
      t.badge(q.ans, most ? 'most popular' : 'least popular', most ? 'rt-badge-most' : 'rt-badge-least');
      t.lock();
      var sorted = q.rows.map(function (x) { return x.n; }).sort(function (a, b) { return most ? b - a : a - b; });
      work.appendChild(el('div', { class: 'rt-work-box' }, el('div', { class: 'rt-wsmall' }, most ? 'Biggest to smallest:' : 'Smallest to biggest:'),
        el('div', { class: 'rt-wline' }, sorted.map(function (v, i) { return chip(v, i === 0 ? 'chip-total' : ''); })),
        el('div', { class: 'rt-wsmall' }, r.n + ' → ' + lab(r))));
    });
  }

  // Level 1: which two are the same
  function renderSame(stage, api, q) {
    api.say('Two rows have the same number. Can you find them?', 'think');
    var wrap = header(stage, q, 'Which two ' + (q.ctx.plural || q.ctx.noun + 's') + ' have <b>the same</b> number? Click both rows.');
    var sel = [];
    var t = makeTable({ rows: q.rows, head: q.ctx.head, freq: true, caption: q.ctx.title, onRow: function (k) {
      if (sel.indexOf(k) !== -1) {
        sel.splice(sel.indexOf(k), 1);
        t.mark(k, 'rt-sel', false);
        return;
      }
      sel.push(k);
      t.mark(k, 'rt-sel');
      if (sel.length < 2) return;
      var a = byKey(q.rows, sel[0]), b = byKey(q.rows, sel[1]);
      sel = [];
      t.clear('rt-sel');
      if (a.n === b.n) {
        [a, b].forEach(function (r) { t.mark(r.k, 'rt-same'); t.badge(r.k, 'the same', 'rt-badge-same'); });
        t.lock();
        api.check(true, a.name + ' and ' + b.name + ' both have ' + a.n + '. The same!');
        return;
      }
      [a, b].forEach(function (r) { t.mark(r.k, 'rt-bad'); });
      api.later(function () { t.clear('rt-bad'); }, 900);
      var hint = a.name + ' has ' + a.n + ' and ' + b.name + ' has ' + b.n + '. Those are different.';
      hint += api.tries() >= 1 ? ' Look for a number that appears twice in the Frequency column.' : ' Find two rows with exactly the same number.';
      api.check(false, hint, 'Picked two rows that are not the same');
    } });
    wrap.appendChild(t.el);
    api.onReveal(function () {
      q.ans.forEach(function (k) { t.mark(k, 'rt-same'); t.badge(k, 'the same', 'rt-badge-same'); });
      t.lock();
      var n = byKey(q.rows, q.ans[0]).n;
      wrap.appendChild(el('div', { class: 'rt-work-box' }, line(chip(n, 'chip-total'), '=', chip(n, 'chip-total')), el('div', { class: 'rt-wsmall' }, q.ans.map(function (k) { return byKey(q.rows, k).name; }).join(' and ') + ' both have ' + n + '.')));
    });
  }

  function numberAnswer(wrap, api, onNum) {
    var inp = MQ.ui.numberInput({ onSubmit: function (n) {
      if (api.isAnswered()) return;
      onNum(n, inp);
    } });
    wrap.appendChild(inp.el);
    inp.focus();
    return inp;
  }

  // Level 2: read one row's tally
  function renderCount(stage, api, q) {
    var r = byKey(q.rows, q.a);
    var g = Math.floor(r.n / 5), s = r.n % 5;
    api.say('Count the gates in 5s, then the sticks in 1s.', 'think');
    var wrap = header(stage, q, 'How many people chose <b>' + lab(r) + '</b>?');
    wrap.setAttribute('data-a', q.a);
    var t = makeTable({ rows: q.rows, head: q.ctx.head, tally: true, caption: q.ctx.title });
    t.mark(q.a, 'rt-ask');
    wrap.appendChild(t.el);
    var inp = numberAnswer(wrap, api, function (n) {
      if (n === r.n) {
        inp.good(); inp.disable();
        api.check(true, countWords(r.n) + '. ' + r.n + ' people chose ' + r.name + '!');
        return;
      }
      inp.bad();
      var tag = 'Miscounted the tally', hint;
      if (g && n === g + s) { tag = 'Counted a gate as 1'; hint = 'Each gate is worth 5, not 1. Count the gates in 5s.'; }
      else if (g && n === r.n + g) { tag = 'Counted the crossing line as extra'; hint = 'The crossing line is the 5th stick. A gate is 5, not 6.'; }
      else hint = n > r.n ? 'That is too many. Count the gates in 5s, then the sticks in 1s.' : 'That is too few. Count the gates in 5s, then the sticks in 1s.';
      if (api.tries() >= 1) hint += ' There ' + (g === 1 ? 'is 1 gate' : 'are ' + g + ' gates') + (s ? ' and ' + s + ' more stick' + (s > 1 ? 's' : '') : '') + '.';
      api.check(false, hint, tag);
    });
    api.onReveal(function () {
      inp.setValue(String(r.n)); inp.good(); inp.disable();
      t.mark(q.a, 'rt-good');
      t.badge(q.a, '= ' + r.n, 'rt-badge-n');
      wrap.appendChild(el('div', { class: 'rt-work-box' }, el('div', { class: 'rt-wsmall' }, 'Count: ' + countWords(r.n)), line(chip(r.n, 'chip-total'))));
    });
  }

  // Level 2: total of two rows
  function renderTotal2(stage, api, q) {
    var a = byKey(q.rows, q.a), b = byKey(q.rows, q.b);
    api.say('Count both tallies, then add them.', 'think');
    var wrap = header(stage, q, 'How many people chose <b>' + lab(a) + '</b> or <b>' + lab(b) + '</b> altogether?');
    wrap.setAttribute('data-a', q.a);
    wrap.setAttribute('data-b', q.b);
    var t = makeTable({ rows: q.rows, head: q.ctx.head, tally: true, caption: q.ctx.title });
    t.mark(q.a, 'rt-ask'); t.mark(q.b, 'rt-ask');
    wrap.appendChild(t.el);
    var work = el('div', { class: 'rt-work' });
    var inp = numberAnswer(wrap, api, function (n) {
      if (n === q.ans) {
        inp.good(); inp.disable();
        work.appendChild(addWork(a.n, b.n));
        api.check(true, a.n + ' + ' + b.n + ' = ' + q.ans + '. Well added!');
        return;
      }
      inp.bad();
      var tag = 'Added wrong', hint;
      if (n === q.ans - 10) hint = 'Careful with the ones: ' + (a.n % 10) + ' + ' + (b.n % 10) + ' = ' + ((a.n % 10) + (b.n % 10)) + '. That makes another ten!';
      else if (n === 2 || n === q.rows.length) { tag = 'Gave the number of rows as the total'; hint = 'That is how many rows, not how many people. Count each tally and add the two numbers.'; }
      else if (n === a.n || n === b.n) { tag = 'Gave one row, not both'; hint = 'That is just one row. Altogether means add both rows.'; }
      else if (n === Math.abs(a.n - b.n)) { tag = 'Took away instead of adding'; hint = 'Altogether means add, not take away.'; }
      else if ([1, 5].some(function (d) { return Math.abs(n - q.ans) === d; })) { tag = 'Miscounted a tally'; hint = 'Very close! Count each tally again: gates in 5s, then sticks in 1s.'; }
      else hint = 'Count each tally again, then add the two numbers.';
      if (api.tries() >= 1) hint += ' ' + a.name + ' has ' + a.n + ' and ' + b.name + ' has ' + b.n + '. Add the tens, then the ones.';
      api.check(false, hint, tag);
    });
    wrap.appendChild(work);
    api.onReveal(function () {
      inp.setValue(String(q.ans)); inp.good(); inp.disable();
      t.badge(q.a, '= ' + a.n, 'rt-badge-n'); t.badge(q.b, '= ' + b.n, 'rt-badge-n');
      work.appendChild(addWork(a.n, b.n));
    });
  }

  // Level 2: how many more
  function renderDiff(stage, api, q) {
    var a = byKey(q.rows, q.a), b = byKey(q.rows, q.b);
    api.say('Count both tallies. Then count on from the smaller number.', 'think');
    var wrap = header(stage, q, 'How many <b>more</b> people chose <b>' + lab(a) + '</b> than <b>' + lab(b) + '</b>?');
    wrap.setAttribute('data-a', q.a);
    wrap.setAttribute('data-b', q.b);
    var t = makeTable({ rows: q.rows, head: q.ctx.head, tally: true, caption: q.ctx.title });
    t.mark(q.a, 'rt-ask'); t.mark(q.b, 'rt-ask');
    wrap.appendChild(t.el);
    var work = el('div', { class: 'rt-work' });
    var inp = numberAnswer(wrap, api, function (n) {
      if (n === q.ans) {
        inp.good(); inp.disable();
        api.check(true, 'Count on from ' + b.n + ' to ' + a.n + ': ' + q.ans + ' more!');
        return;
      }
      inp.bad();
      var tag = 'Counted on wrong', hint;
      if (n === a.n + b.n) { tag = 'Added instead of finding how many more'; hint = 'How many more means the difference, not altogether. Count on from ' + (api.tries() >= 1 ? b.n : 'the smaller number') + '.'; }
      else if (n === a.n || n === b.n) { tag = 'Gave a row, not the difference'; hint = 'That is how many chose one thing. We want how many MORE: count on from the smaller to the bigger.'; }
      else if (Math.abs(n - q.ans) === 1) hint = 'Nearly! Count the jumps, not the starting number.';
      else hint = 'Count both tallies again, then count on from the smaller number to the bigger one.';
      if (api.tries() >= 1) hint += ' ' + a.name + ' has ' + a.n + ', ' + b.name + ' has ' + b.n + '. Start at ' + b.n + ' and count on to ' + a.n + '.';
      api.check(false, hint, tag);
    });
    wrap.appendChild(work);
    api.onReveal(function () {
      inp.setValue(String(q.ans)); inp.good(); inp.disable();
      t.badge(q.a, '= ' + a.n, 'rt-badge-n'); t.badge(q.b, '= ' + b.n, 'rt-badge-n');
      work.appendChild(diffWork(a, b));
    });
  }

  function partLabel(text) { return el('div', { class: 'rt-part' }, text); }

  // Level 3: total of all rows, then which two rows make N
  function renderTotalAll(stage, api, q) {
    var who = people(q.ctx);
    var nums = q.rows.map(function (r) { return r.n; });
    api.say(q.ctx.sweets ? 'Careful! Which column tells us how many bags?' : 'Add every row to find the total.', 'think');
    var wrap = header(stage, q, null);
    wrap.setAttribute('data-target', String(q.target));
    var part = partLabel('Part 1 of 2');
    var promptEl = MQ.ui.prompt('How many <b>' + who + '</b> were there <b>altogether</b>?');
    wrap.appendChild(part);
    wrap.appendChild(promptEl);
    var sel = [];
    var step = 1;
    var t = makeTable({ rows: q.rows, head: q.ctx.head, freq: true, freqHead: q.ctx.freqHead, caption: q.ctx.title, onRow: function (k) {
      if (step !== 2) return;
      if (sel.indexOf(k) !== -1) { sel.splice(sel.indexOf(k), 1); t.mark(k, 'rt-sel', false); return; }
      sel.push(k);
      t.mark(k, 'rt-sel');
      if (sel.length < 2) return;
      var a = byKey(q.rows, sel[0]), b = byKey(q.rows, sel[1]);
      sel = [];
      t.clear('rt-sel');
      if (a.n + b.n === q.target) {
        [a, b].forEach(function (r) { t.mark(r.k, 'rt-good'); });
        t.lock();
        work2.appendChild(line(chip(a.n), '+', chip(b.n), '=', chip(q.target, 'chip-total')));
        api.check(true, a.n + ' + ' + b.n + ' = ' + q.target + '. Great!');
        return;
      }
      [a, b].forEach(function (r) { t.mark(r.k, 'rt-bad'); });
      api.later(function () { t.clear('rt-bad'); }, 900);
      p2tries++;
      var hint = a.n + ' + ' + b.n + ' = ' + (a.n + b.n) + ', not ' + q.target + '.';
      hint += p2tries >= 2 ? ' Try the biggest number first: what do you add to it to make ' + q.target + '?' : ' Try another pair.';
      api.check(false, hint, 'Added wrong');
    } });
    t.table.classList.add('rt-wait');
    wrap.appendChild(t.el);
    var work1 = el('div', { class: 'rt-work' });
    var work2 = el('div', { class: 'rt-work' });
    var p1tries = 0, p2tries = 0;
    var inp = numberAnswer(wrap, api, function (n) {
      if (step !== 1) return;
      if (n === q.ans) {
        inp.good(); inp.disable();
        work1.appendChild(chainWork(nums));
        toPart2();
        return;
      }
      inp.bad();
      p1tries++;
      var tag = 'Added wrong', hint;
      if (n === q.rows.length) { tag = 'Gave the number of rows as the total'; hint = 'There are ' + q.rows.length + ' rows, but the total means how many ' + who + '. Add all the numbers.'; }
      else if (q.ctx.sweets && n === sum(q.rows.map(function (r) { return r.label; }))) { tag = 'Added the wrong column'; hint = 'Those are the sweet numbers! Add the Number of bags column.'; }
      else if (Math.abs(n - q.ans) === 10 || Math.abs(n - q.ans) === 20) hint = 'Check your tens. When the ones make 10 or more, carry a ten.';
      else hint = 'Add the numbers one at a time and write down each step.';
      if (p1tries >= 2) hint += ' Start like this: ' + nums[0] + ' + ' + nums[1] + ' = ' + (nums[0] + nums[1]) + '. Keep going.';
      api.check(false, hint, tag);
    });
    wrap.appendChild(work1);
    wrap.appendChild(work2);
    function toPart2() {
      step = 2;
      api.sound('pop');
      api.say(q.ans + ' altogether! Now part 2.', 'happy');
      api.feedback(q.ans + ' ' + who + ' altogether. Now part 2!', 'good');
      inp.el.style.display = 'none';
      part.textContent = 'Part 2 of 2';
      promptEl.innerHTML = 'Which <b>two rows</b> make <b>' + q.target + '</b> ' + who + ' together? Click both.';
      t.table.classList.remove('rt-wait');
    }
    api.onReveal(function () {
      if (step === 1) {
        inp.setValue(String(q.ans)); inp.good(); inp.disable();
        work1.appendChild(chainWork(nums));
        part.textContent = 'Part 2 of 2';
        promptEl.innerHTML = 'Which <b>two rows</b> make <b>' + q.target + '</b> ' + who + ' together?';
      }
      t.table.classList.remove('rt-wait');
      var a = byKey(q.rows, q.pair[0]), b = byKey(q.rows, q.pair[1]);
      t.mark(a.k, 'rt-good'); t.mark(b.k, 'rt-good');
      t.lock();
      work2.appendChild(el('div', { class: 'rt-work-box' }, el('div', { class: 'rt-wsmall' }, 'Part 2: ' + a.name + ' and ' + b.name), line(chip(a.n), '+', chip(b.n), '=', chip(q.target, 'chip-total'))));
    });
  }

  // Level 3: word-clue chart
  function clueText(q, r, base) {
    var g = q.rows[0];
    if (r.rule === 'given') return '<b>' + base + '</b> people like ' + lab(r) + '.';
    if (r.rule === 'double') return lab(r) + ': <b>double</b> the ' + g.name + ' number.';
    if (r.rule === 'half') return lab(r) + ': <b>half</b> the ' + g.name + ' number.';
    return '<b>' + r.n + ' people</b> like ' + lab(r) + '.';
  }
  function renderClue(stage, api, q) {
    var g = q.rows[0];
    api.say('Read each clue carefully. Fill in the numbers.', 'think');
    var wrap = header(stage, q, null);
    wrap.setAttribute('data-base', String(q.base));
    wrap.setAttribute('data-stated', String(q.stated));
    var part = partLabel('Part 1 of 2');
    var promptEl = MQ.ui.prompt('Use the clues to fill in the <b>Frequency</b> column.');
    wrap.appendChild(part);
    wrap.appendChild(promptEl);
    var clues = el('div', { class: 'rt-clues' });
    q.rows.forEach(function (r) { clues.appendChild(el('div', { class: 'rt-clue', html: clueText(q, r, q.base) })); });
    var pics = el('div', { class: 'rt-pics' }, groupsPic('double', q.base), groupsPic('half', q.base));
    var inputs = {};
    var tbody = el('tbody');
    q.rows.forEach(function (r) {
      var cell;
      if (r.rule === 'given') cell = el('span', { class: 'rt-fnum' }, String(r.n));
      else {
        cell = el('input', { class: 'rt-freq', type: 'text', inputmode: 'numeric', maxlength: 3, autocomplete: 'off', 'data-rule': r.rule, 'aria-label': 'Frequency for ' + r.name });
        inputs[r.k] = cell;
      }
      tbody.appendChild(el('tr', { 'data-key': r.k, 'data-rule': r.rule }, el('td', { class: 'rt-labcell' }, el('span', { class: 'rt-lab' }, el('span', { class: 'rt-ico' }, r.icon), el('span', { class: 'rt-name' }, r.name))), el('td', { class: 'rt-fcell' }, cell)));
    });
    var totIn = el('input', { class: 'rt-freq rt-totin', type: 'text', inputmode: 'numeric', maxlength: 3, autocomplete: 'off', 'aria-label': 'Total', disabled: true });
    var totRow = el('tr', { class: 'rt-totrow' }, el('th', null, 'Total'), el('td', { class: 'rt-fcell' }, totIn));
    tbody.appendChild(totRow);
    var table = el('table', { class: 'rt-table' }, el('thead', null, el('tr', null, el('th', null, q.ctx.head), el('th', null, 'Frequency'))), tbody);
    var checkBtn = el('button', { class: 'btn rt-checkbtn', type: 'button' }, 'Check ✓');
    var work = el('div', { class: 'rt-work' });
    wrap.appendChild(el('div', { class: 'rt-cluegrid' }, el('div', { class: 'rt-clueside' }, clues, pics), el('div', { class: 'rt-tablewrap' }, el('div', { class: 'rt-cap' }, q.ctx.title), table, checkBtn)));
    wrap.appendChild(work);
    var step = 1, p1 = 0, p2 = 0;
    var keys = Object.keys(inputs);
    keys.forEach(function (k, i) {
      inputs[k].addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (i < keys.length - 1) inputs[keys[i + 1]].focus(); else check();
      });
    });
    totIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    checkBtn.addEventListener('click', check);
    function readIn(inp) { var v = U.parseNum(inp.value); return isNaN(v) ? null : v; }
    function setState(inp, ok) { inp.classList.remove('rt-in-good', 'rt-in-bad'); inp.classList.add(ok ? 'rt-in-good' : 'rt-in-bad'); }
    function check() {
      if (api.isAnswered()) return;
      if (step === 1) {
        var firstBad = null;
        q.rows.forEach(function (r) {
          if (!inputs[r.k]) return;
          var v = readIn(inputs[r.k]);
          var ok = v === r.n;
          setState(inputs[r.k], ok);
          if (!ok && !firstBad) firstBad = { r: r, v: v };
        });
        if (!firstBad) {
          keys.forEach(function (k) { inputs[k].disabled = true; });
          step = 2;
          part.textContent = 'Part 2 of 2';
          promptEl.innerHTML = 'Now find the <b>total</b>: how many people altogether?';
          totIn.disabled = false;
          api.sound('pop');
          api.say('All the clues are right! Now add them up.', 'happy');
          api.feedback('Every number matches its clue. Now type the total.', 'good');
          try { totIn.focus({ preventScroll: true }); } catch (e) { totIn.focus(); }
          return;
        }
        p1++;
        var r = firstBad.r, v = firstBad.v, hint;
        if (v == null) hint = 'Fill in every empty box. Start with ' + r.name + '.';
        else if (r.rule === 'stated') hint = v === q.base + r.n ? 'The clue says ' + r.n + ' people like ' + r.name + '. That IS the number. There is nothing to add.' : 'Read the ' + r.name + ' clue again. It tells you the number straight away.';
        else if (r.rule === 'double') hint = 'Double means two lots of the same number. Look at the two equal groups: ' + q.base + ' + ' + q.base + '.';
        else hint = 'Half means share into 2 equal groups. Look at the picture: ' + q.base + ' shared into 2.';
        if (p1 >= 2) hint += r.rule === 'double' ? ' ' + q.base + ' + ' + q.base + ' = ?' : r.rule === 'half' ? ' What number + itself makes ' + q.base + '?' : '';
        api.check(false, hint, v != null ? 'Misread a word clue' : 'Left a box empty');
        return;
      }
      var tv = readIn(totIn);
      if (tv === q.ans) {
        setState(totIn, true);
        totIn.disabled = true;
        checkBtn.disabled = true;
        work.appendChild(chainWork(q.rows.map(function (x) { return x.n; })));
        api.check(true, q.ans + ' people altogether. You read every clue!');
        return;
      }
      setState(totIn, false);
      p2++;
      var tag = 'Added wrong', h;
      if (tv === q.rows.length) { tag = 'Gave the number of rows as the total'; h = 'There are ' + q.rows.length + ' rows, but we want how many people. Add all the numbers.'; }
      else h = 'Add the numbers one at a time. Check the tens and ones.';
      if (p2 >= 2) h += ' Start: ' + q.rows[0].n + ' + ' + q.rows[1].n + ' = ' + (q.rows[0].n + q.rows[1].n) + '.';
      api.check(false, tv == null ? 'Type the total in the yellow box.' : h, tv == null ? 'Left a box empty' : tag);
    }
    api.onReveal(function () {
      keys.forEach(function (k) { var r = byKey(q.rows, k); inputs[k].value = String(r.n); setState(inputs[k], true); inputs[k].disabled = true; });
      totIn.value = String(q.ans); setState(totIn, true); totIn.disabled = true; checkBtn.disabled = true;
      MQ.clear(pics);
      pics.appendChild(groupsPic('double', q.base, true));
      pics.appendChild(groupsPic('half', q.base, true));
      var st = q.rows[3];
      work.appendChild(el('div', { class: 'rt-work-box' }, el('div', { class: 'rt-wsmall' }, g.name + ' ' + q.base + ' · double → ' + 2 * q.base + ' · half → ' + q.base / 2 + ' · ' + st.name + ' is just ' + st.n + ' (nothing to add)')));
      work.appendChild(chainWork(q.rows.map(function (x) { return x.n; })));
    });
  }

  // Level 3: spot the mistakes, then what the table does NOT tell us
  function renderSpot(stage, api, q) {
    api.say('Two numbers do not match their tallies. Recount each one!', 'think');
    var wrap = header(stage, q, null);
    var part = partLabel('Part 1 of 2');
    var promptEl = MQ.ui.prompt('Someone made <b>2 mistakes</b> in the Frequency column. Click the 2 wrong rows, then Check.');
    wrap.appendChild(part);
    wrap.appendChild(promptEl);
    var picked = {};
    var t = makeTable({ rows: q.rows, head: q.ctx.head, tally: true, freq: true, caption: q.ctx.title, onRow: function (k) {
      picked[k] = !picked[k];
      t.mark(k, 'rt-pick', picked[k]);
      api.sound('click');
    } });
    wrap.appendChild(t.el);
    var checkBtn = el('button', { class: 'btn rt-checkbtn', type: 'button' }, 'Check ✓');
    wrap.appendChild(checkBtn);
    var part2 = el('div', { class: 'rt-work' });
    wrap.appendChild(part2);
    var p1 = 0, p2 = 0, step = 1, ch = null;
    function fix() {
      q.wrong.forEach(function (k) {
        var r = byKey(q.rows, k);
        var fc = t.fcell[k];
        MQ.clear(fc);
        fc.appendChild(el('s', { class: 'rt-strike' }, String(r.written)));
        fc.appendChild(el('span', { class: 'rt-fnum rt-fixed' }, String(r.n)));
        t.mark(k, 'rt-pick', false);
        t.mark(k, 'rt-good');
        t.badge(k, 'recount: ' + countWords(r.n), 'rt-badge-count');
      });
      t.lock();
      checkBtn.style.display = 'none';
    }
    checkBtn.addEventListener('click', function () {
      if (step !== 1 || api.isAnswered()) return;
      var sel = Object.keys(picked).filter(function (k) { return picked[k]; });
      var okSet = sel.length === 2 && q.wrong.every(function (k) { return picked[k]; });
      if (okSet) {
        fix();
        toPart2();
        return;
      }
      p1++;
      var falsePick = sel.filter(function (k) { return q.wrong.indexOf(k) === -1; })[0];
      var found = sel.filter(function (k) { return q.wrong.indexOf(k) !== -1; }).length;
      var hint;
      if (!sel.length) hint = 'Click the rows where the number does not match the tally.';
      else if (falsePick) { var fr = byKey(q.rows, falsePick); hint = 'Recount ' + fr.name + ': ' + (p1 >= 2 ? countWords(fr.n) + '. ' : '') + 'it matches its tally, so it is right.'; }
      else hint = 'You found ' + found + '. There are 2 mistakes. Count every tally in 5s and 1s.';
      if (p1 >= 2 && !falsePick) hint += ' Count each gate as 5, then add the single sticks.';
      api.check(false, hint, 'Did not recount the tallies');
    });
    function toPart2() {
      step = 2;
      api.sound('pop');
      api.say('You found both mistakes! Now part 2.', 'happy');
      api.feedback('Both mistakes found and fixed. Now part 2!', 'good');
      part.textContent = 'Part 2 of 2';
      promptEl.innerHTML = 'Which of these does the table <b>NOT</b> tell us?';
      ch = MQ.ui.choices(q.stmts.map(function (s, i) { return { label: s.text, value: i }; }), function (i) {
        var s = q.stmts[i];
        if (s.not) {
          ch.mark(i, 'good'); ch.disable();
          api.check(true, 'Right! A table shows how many, not why or who.');
          return;
        }
        ch.mark(i, 'bad');
        p2++;
        var ev = s.row ? 'Look: the ' + byKey(q.rows, s.row).name + ' row says ' + byKey(q.rows, s.row).n + '.' : 'Look: ' + byKey(q.rows, q.most).name + ' has the biggest number.';
        var hint = 'The table DOES tell us that. ' + ev + (p2 >= 2 ? ' A table only shows how many. Which one asks why or who?' : ' Find the one we cannot see in the numbers.');
        api.check(false, hint, 'Thought the data said why');
      }, { columns: 1 });
      ch.buttons.forEach(function (b, i) { b.setAttribute('data-not', q.stmts[i].not ? '1' : '0'); });
      part2.appendChild(ch);
    }
    api.onReveal(function () {
      if (step === 1) {
        fix();
        toPart2();
      }
      var ni = 0;
      q.stmts.forEach(function (s, i) { if (s.not) ni = i; });
      ch.mark(ni, 'good');
      ch.disable();
      part2.appendChild(el('div', { class: 'rt-work-box' }, el('div', { class: 'rt-wsmall' }, 'The table shows HOW MANY chose each ' + q.ctx.noun + '. It does not say why, or who.')));
    });
  }

  var deck = null;

  MQ.register('read-the-table', {
    learn: [learnLink, learnMostLeast, learnTotalDiff],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        var onReveal = api.onReveal;
        api.onReveal = function (show) {
          onReveal(function () {
            show();
            api.feedback('Here is how to work it out. Look at the working.', 'info');
          });
        };
        var fn = { most: renderPick, least: renderPick, same: renderSame, count: renderCount, total2: renderTotal2, diff: renderDiff, totalall: renderTotalAll, clue: renderClue, spot: renderSpot }[q.type];
        fn(stage, api, q);
      },
    },
  });

  var css = [
    '.rt-q{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.rt-pair{display:flex;flex-wrap:wrap;gap:22px;justify-content:center;align-items:flex-start;width:100%}',
    '.rt-tablewrap{display:flex;flex-direction:column;align-items:center;gap:6px;max-width:100%}',
    '.rt-tablescroll{max-width:100%;overflow-x:auto}',
    '.rt-cap{font-weight:800;font-size:1.1rem;color:var(--ink-soft)}',
    '.rt-table{border-collapse:collapse;background:#fff;font-size:1.15rem}',
    '.rt-table th,.rt-table td{border:2px solid #9fb0d6;padding:6px 10px;text-align:left;vertical-align:middle}',
    '.rt-table thead th{background:var(--paper-2);font-weight:800}',
    '.rt-labcell{min-width:150px}',
    '.rt-lab{display:inline-flex;align-items:center;gap:6px;font-weight:800;white-space:nowrap}',
    '.rt-ico{font-size:1.35rem}',
    '.rt-tcell{min-width:150px}',
    '.rt-fcell{text-align:center!important;min-width:70px;font-size:1.35rem;font-weight:800}',
    '.rt-tally{display:block;max-width:none}',
    '.rt-stroke{stroke:#1b2a4a;stroke-width:3;stroke-linecap:round}',
    '.rt-cross{stroke:#c2410c}',
    '.rt-click{cursor:pointer;transition:background .15s}',
    '.rt-click:hover td{background:#fff7e0}',
    '.rt-locked .rt-click,.rt-wait .rt-click{cursor:default}',
    '.rt-locked .rt-click:hover td,.rt-wait .rt-click:hover td{background:transparent}',
    '.rt-table tr.rt-sel td{background:#fff3cd!important;box-shadow:inset 0 0 0 2px var(--gold)}',
    '.rt-table tr.rt-pick td{background:#fff3cd!important}',
    '.rt-table tr.rt-pick .rt-fcell{box-shadow:inset 0 0 0 3px var(--try)}',
    '.rt-table tr.rt-linked td{background:var(--rt-lc)!important}',
    '.rt-table tr.rt-good td{background:var(--good-bg)!important}',
    '.rt-table tr.rt-bad td{background:var(--try-bg)!important}',
    '.rt-table tr.rt-same td{background:#e3ecff!important}',
    '.rt-table tr.rt-ask .rt-labcell{box-shadow:inset 5px 0 0 var(--gold);background:#fffaf0}',
    '.rt-badges{display:inline-flex;flex-wrap:wrap;gap:4px;margin-left:6px;vertical-align:middle}',
    '.rt-badges:empty{display:none}',
    '.rt-badge{display:inline-block;font-size:.8rem;font-weight:800;padding:2px 8px;border-radius:99px;background:#fff;border:2px solid var(--line)}',
    '.rt-badge-most{background:var(--good);color:#fff;border-color:var(--good)}',
    '.rt-badge-least{background:#7b6aa8;color:#fff;border-color:#7b6aa8}',
    '.rt-badge-same{background:#3a6fd8;color:#fff;border-color:#3a6fd8}',
    '.rt-badge-n{background:#fff3cd;border-color:var(--gold)}',
    '.rt-badge-count{background:#fff;border-color:var(--good);color:var(--good);white-space:normal}',
    '.rt-strike{color:var(--try);margin-right:8px;font-size:1.1rem}',
    '.rt-fixed{color:var(--good)}',
    '.rt-work{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.rt-work:empty{display:none}',
    '.rt-work-box{display:flex;flex-direction:column;align-items:center;gap:6px;background:#fffaf0;border:3px solid #ead9b8;border-radius:16px;padding:10px 14px;max-width:100%}',
    '.rt-wline{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;font-size:1.25rem;font-weight:800}',
    '.rt-wsmall{font-weight:700;color:var(--ink-soft);text-align:center;font-size:1.05rem}',
    '.rt-sep{margin:0 8px}',
    '.rt-c1{background:#e3ecff}.rt-c2{background:#ffe3ec}.rt-cq{background:#fff}',
    '.rt-part{font-weight:800;font-size:.9rem;padding:3px 12px;border-radius:99px;background:var(--paper-2);color:var(--ink-soft)}',
    '.rt-pool{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}',
    '.rt-fchip{display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:1.4rem;padding:8px 14px;border-radius:14px;border:3px solid var(--gold);background:#fff3cd;color:var(--ink);cursor:grab;user-select:none;position:relative;z-index:1}',
    '.rt-fchip.rt-dragging{cursor:grabbing;z-index:5;box-shadow:0 6px 14px rgba(0,0,0,.2)}',
    '.rt-fchip.rt-used{opacity:.3;cursor:default}',
    '.rt-addbox{display:flex;align-items:center;justify-content:center;min-height:70px;width:100%;max-width:620px;border:3px dashed var(--line);border-radius:16px;background:#fff;padding:8px}',
    '.rt-addbox.rt-over{border-color:var(--accent);background:#effcfa}',
    '.rt-addhint{color:var(--ink-soft);font-weight:700}',
    '.rt-run{font-weight:800;color:var(--ink-soft);min-height:1.2em}',
    '.rt-partb{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.rt-partb:empty{display:none}',
    '.rt-nlwrap{max-width:100%;overflow-x:auto}',
    '.rt-nl{display:block;max-width:100%;height:auto}',
    '.rt-nl-axis{stroke:#1b2a4a;stroke-width:3}',
    '.rt-nl-tick line{stroke:#1b2a4a;stroke-width:2.5}',
    '.rt-nl-tick text{font-size:18px;font-weight:800;fill:#1b2a4a}',
    '.rt-nl-hit{fill:transparent}',
    '.rt-nl-click .rt-nl-tick{cursor:pointer}',
    '.rt-nl-click .rt-nl-tick:hover .rt-nl-hit{fill:#fff3cd}',
    '.rt-nl-start text{fill:#3a6fd8}.rt-nl-end text{fill:var(--good)}',
    '.rt-nl-jump{fill:none;stroke:#c2410c;stroke-width:3}',
    '.rt-nl-lab{font-size:15px;font-weight:800;fill:#c2410c}',
    '.rt-nl-dot{fill:var(--gold);stroke:#1b2a4a;stroke-width:2}',
    '.rt-cluegrid{display:flex;flex-wrap:wrap;gap:18px;justify-content:center;align-items:flex-start;width:100%}',
    '.rt-clueside{display:flex;flex-direction:column;gap:8px;align-items:stretch;max-width:430px;min-width:0;flex:1 1 300px}',
    '.rt-clues{display:flex;flex-direction:column;gap:6px}',
    '.rt-clue{background:#fff;border:2px solid var(--line);border-radius:12px;padding:6px 12px;font-size:1.1rem}',
    '.rt-pics{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}',
    '.rt-gpic{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;background:#fffaf0;border:2px solid #ead9b8;border-radius:12px;padding:6px 8px;max-width:100%}',
    '.rt-gcap{flex-basis:100%;text-align:center;font-weight:800;font-size:.95rem}',
    '.rt-half{display:flex;gap:6px}',
    '.rt-dots{display:grid;grid-template-columns:repeat(5,12px);gap:3px;padding:5px;border:2px solid #9fb0d6;border-radius:8px;background:#fff}',
    '.rt-dots i{width:12px;height:12px;border-radius:50%;background:#3a6fd8}',
    '.rt-dots-b i{background:#e07a3f}',
    '.rt-freq{width:64px;height:44px;font:inherit;font-size:1.35rem;font-weight:800;text-align:center;border:3px solid var(--line);border-radius:10px;color:var(--ink);background:#fff}',
    '.rt-freq:focus{outline:3px solid var(--gold);outline-offset:1px}',
    '.rt-freq:disabled{color:var(--ink);background:#f3f5fa}',
    '.rt-totin:not(:disabled){background:#fff3cd;border-color:var(--gold)}',
    '.rt-freq.rt-in-good{border-color:var(--good);background:var(--good-bg)}',
    '.rt-freq.rt-in-bad{border-color:var(--try);background:var(--try-bg)}',
    '.rt-totrow th{background:#fff3cd}',
    '.rt-checkbtn{min-width:150px}',
    '@media (max-width:700px){.rt-table{font-size:1rem}.rt-table th,.rt-table td{padding:4px 6px}.rt-labcell{min-width:0}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'read-the-table' }, css));
})();

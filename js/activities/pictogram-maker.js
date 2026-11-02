/* Pictogram Maker — read and build pictograms with a key of 1 or 2 and half pictures (Unit 10.1). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;
  var fmt = U.fmt;

  /* ---------------------------------------------------------------- *
   * Contexts (everyday data)
   * ---------------------------------------------------------------- */
  var DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Things counted in whole items (used with keys of 1 and 2).
  var CTX = {
    birds: {
      title: 'Birds seen in the garden', one: 'bird', many: 'birds',
      rows: [{ name: 'Sparrows', icon: '🐦' }, { name: 'Pigeons', icon: '🕊️' }, { name: 'Ducks', icon: '🦆' }, { name: 'Parrots', icon: '🦜' }],
      howMany: function (r) { return 'How many <b>' + r.toLowerCase() + '</b> were seen?'; },
      most: 'Which bird was seen the <b>most</b>?', least: 'Which bird was seen the <b>least</b>?',
      fact: function (r, v) { return v + ' ' + r.toLowerCase() + ' were seen.'; },
    },
    fruit: {
      title: 'Fruit sold at the shop', one: 'piece of fruit', many: 'pieces of fruit',
      rows: [{ name: 'Apples', icon: '🍎' }, { name: 'Pears', icon: '🍐' }, { name: 'Bananas', icon: '🍌' }, { name: 'Oranges', icon: '🍊' }],
      howMany: function (r) { return 'How many <b>' + r.toLowerCase() + '</b> were sold?'; },
      most: 'Which fruit sold the <b>most</b>?', least: 'Which fruit sold the <b>least</b>?',
      fact: function (r, v) { return v + ' ' + r.toLowerCase() + ' were sold.'; },
    },
    vehicles: {
      title: 'Vehicles in the car park', one: 'vehicle', many: 'vehicles',
      rows: [{ name: 'Cars', icon: '🚗' }, { name: 'Vans', icon: '🚐' }, { name: 'Bikes', icon: '🚲' }, { name: 'Lorries', icon: '🚚' }],
      howMany: function (r) { return 'How many <b>' + r.toLowerCase() + '</b> were in the car park?'; },
      most: 'Which vehicle was there the <b>most</b> of?', least: 'Which vehicle was there the <b>fewest</b> of?',
      fact: function (r, v) { return 'There were ' + v + ' ' + r.toLowerCase() + '.'; },
    },
    minibeasts: {
      title: 'Minibeasts found in the garden', one: 'minibeast', many: 'minibeasts',
      rows: [{ name: 'Bees', icon: '🐝' }, { name: 'Ladybirds', icon: '🐞' }, { name: 'Snails', icon: '🐌' }, { name: 'Spiders', icon: '🕷️' }, { name: 'Butterflies', icon: '🦋' }],
      howMany: function (r) { return 'How many <b>' + r.toLowerCase() + '</b> were found?'; },
      most: 'Which minibeast was found the <b>most</b>?', least: 'Which minibeast was found the <b>least</b>?',
      fact: function (r, v) { return v + ' ' + r.toLowerCase() + ' were found.'; },
    },
    books: {
      title: 'Books sold at the school library', one: 'book', many: 'books', sym: '📕', days: true,
      howMany: function (r) { return 'How many books were sold on <b>' + r + '</b>?'; },
      most: 'On which day were the <b>most</b> books sold?', least: 'On which day were the <b>fewest</b> books sold?',
      fact: function (r, v) { return v + ' books were sold on ' + r + '.'; },
    },
    sandwiches: {
      title: 'Sandwiches sold at the café', one: 'sandwich', many: 'sandwiches', sym: '🥪',
      rows: [{ name: 'Cheese' }, { name: 'Egg' }, { name: 'Chicken' }, { name: 'Tuna' }],
      howMany: function (r) { return 'How many <b>' + r.toLowerCase() + '</b> sandwiches were sold?'; },
      most: 'Which sandwich sold the <b>most</b>?', least: 'Which sandwich sold the <b>least</b>?',
      fact: function (r, v) { return v + ' ' + r.toLowerCase() + ' sandwiches were sold.'; },
    },
    park: {
      title: 'Families visiting the park', one: 'family', many: 'families', sym: '👪', days: true,
      howMany: function (r) { return 'How many families visited the park on <b>' + r + '</b>?'; },
      most: 'On which day did the <b>most</b> families visit?', least: 'On which day did the <b>fewest</b> families visit?',
      fact: function (r, v) { return v + ' families visited on ' + r + '.'; },
    },
  };
  var WHOLE_POOL = ['birds', 'fruit', 'vehicles', 'minibeasts', 'books', 'sandwiches', 'park'];

  // Things that can come in halves with a key of 1 (hours, pizzas).
  var HCTX = {
    sunshine: {
      title: 'Hours of sunshine', one: 'hour', many: 'hours', sym: '☀️', days: true, what: 'hours of sunshine',
      howMany: function (r) { return 'How many hours of sunshine were there on <b>' + r + '</b>?'; },
    },
    rain: {
      title: 'Hours of rain', one: 'hour', many: 'hours', sym: '🌧️', days: true, what: 'hours of rain',
      howMany: function (r) { return 'How many hours of rain were there on <b>' + r + '</b>?'; },
    },
    pizza: {
      title: 'Pizzas eaten at the school fair', one: 'pizza', many: 'pizzas', sym: '🍕', what: 'pizzas',
      rows: [{ name: 'Cheese' }, { name: 'Tomato' }, { name: 'Chicken' }, { name: 'Veggie' }],
      howMany: function (r) { return 'How many <b>' + r.toLowerCase() + '</b> pizzas were eaten?'; },
    },
  };

  function rowsOf(ctx, n) {
    if (ctx.days) return DAYS.slice(0, n).map(function (d) { return { name: d, icon: ctx.sym }; });
    return ctx.rows.slice(0, n).map(function (r) { return { name: r.name, icon: r.icon || ctx.sym }; });
  }
  function keyWord(ctx, k) { return k === 1 ? ctx.one : ctx.many; }
  function lower(s) { return s.toLowerCase(); }

  /* ---------------------------------------------------------------- *
   * Pictogram drawing (horizontal rows or vertical columns)
   * All pictures are the same size and sit in equal cells with no gaps,
   * so the rows can be compared by length. A half picture is the left
   * (or top) half of a whole picture, clipped by overflow:hidden.
   * ---------------------------------------------------------------- */
  function cellOf(icon, half) {
    return el('span', { class: 'pm-cell' + (half ? ' pm-half' : '') }, el('span', { class: 'pm-pic' }, el('span', { class: 'pm-emo' }, icon)), el('span', { class: 'pm-tick' }));
  }

  /**
   * d = { title, ctx, keyN, keyHidden, rows:[{name, icon, value, edit, start}], maxCells, vertical, controls, clickRemove, onChange }
   */
  function picto(stage, api, d) {
    var n = d.maxCells;
    var w = Math.min(stage.clientWidth || 820, 900);
    var narrow = w < 700;
    var c, lw = narrow ? 92 : 120;
    if (d.vertical) {
      c = U.clamp(Math.floor(Math.min(300 / n, (w - 40) / d.rows.length - 34)), 26, 40);
    } else {
      var extra = lw + 64 + (d.controls ? (narrow ? 150 : 172) : 0) + 30;
      c = U.clamp(Math.floor((w - extra) / n), 24, 46);
    }
    var keyN = d.keyN;
    var ctx = d.ctx;
    var pics = d.rows.map(function (r) { return r.edit ? r.start || 0 : r.value / keyN; });
    var root = el('div', { class: 'pm-picto' + (d.vertical ? ' pm-v' : ' pm-h'), style: { '--pm-c': c + 'px', '--pm-lw': lw + 'px', '--pm-n': n } });
    var titleEl = el('div', { class: 'pm-title' + (d.title ? '' : ' pm-title-empty') }, d.title || 'Title: ?');
    root.appendChild(titleEl);
    var body = el('div', { class: d.vertical ? 'pm-vrows' : 'pm-rows' });
    root.appendChild(body);
    var rowEls = [], tracks = [], totals = [], ctrls = [];
    var locked = false;

    d.rows.forEach(function (r, i) {
      var track = el('div', { class: 'pm-track' + (r.edit ? ' pm-edit' : '') });
      var total = el('span', { class: 'pm-total' });
      var label = el('div', { class: 'pm-label' }, r.icon && !ctx.sym && !d.vertical ? el('span', { class: 'pm-licon' }, r.icon) : null, el('span', null, d.vertical ? r.name.slice(0, 3) : r.name));
      var ctrl = null;
      if (r.edit && d.controls) {
        ctrl = el(
          'div',
          { class: 'pm-ctrl' },
          el('button', { type: 'button', class: 'pm-btn pm-add', title: 'Add a picture', onclick: function () { change(i, 1); } }, '+ ', el('span', { class: 'pm-bicon' }, r.icon)),
          el('button', { type: 'button', class: 'pm-btn pm-addh', title: 'Add half a picture', onclick: function () { change(i, 0.5); } }, '+ ½'),
          el('button', { type: 'button', class: 'pm-btn pm-del', title: 'Take one away', onclick: function () { change(i, -1); } }, '−')
        );
      }
      var row = d.vertical ? el('div', { class: 'pm-vcol' }, total, track, label) : el('div', { class: 'pm-row' + (r.edit ? ' pm-row-edit' : '') }, label, track, total, ctrl);
      if (r.edit && d.clickRemove) {
        track.addEventListener('click', function (e) {
          if (locked || !e.target.closest('.pm-cell')) return;
          change(i, -1);
        });
      }
      body.appendChild(row);
      rowEls.push(row);
      tracks.push(track);
      totals.push(total);
      ctrls.push(ctrl);
      draw(i);
    });

    var keyEl = el('div', { class: 'pm-key' });
    root.appendChild(keyEl);
    function drawKey(hidden) {
      MQ.clear(keyEl);
      keyEl.appendChild(el('span', { class: 'pm-key-k' }, 'Key'));
      keyEl.appendChild(ctx.sym ? el('span', { class: 'pm-key-sym' }, ctx.sym) : el('span', null, '1 picture'));
      keyEl.appendChild(el('span', null, ' = '));
      keyEl.appendChild(hidden ? el('span', { class: 'pm-key-q' }, '?') : el('b', { class: 'pm-key-n' }, keyN + ' ' + keyWord(ctx, keyN)));
    }
    drawKey(d.keyHidden);

    function draw(i) {
      var t = tracks[i];
      MQ.clear(t);
      var p = pics[i];
      var whole = Math.floor(p + 1e-9);
      for (var k = 0; k < whole; k++) t.appendChild(cellOf(d.rows[i].icon, false));
      if (p - whole > 0.25) t.appendChild(cellOf(d.rows[i].icon, true));
      totals[i].textContent = '';
      rowEls[i].classList.remove('pm-lit');
    }
    function change(i, delta) {
      if (locked) return;
      var p = pics[i];
      if (delta === -1) p = p % 1 ? p - 0.5 : p - 1;
      else p += delta;
      p = U.clamp(p, 0, n);
      if (p === pics[i]) {
        api.sound('click');
        return;
      }
      pics[i] = p;
      api.sound(delta > 0 ? 'pop' : 'click');
      draw(i);
      if (d.onChange) d.onChange(i, p);
    }

    var P = {
      el: root,
      rows: rowEls,
      tracks: tracks,
      pics: pics,
      cell: c,
      keyEl: keyEl,
      value: function (i) { return pics[i] * keyN; },
      set: function (i, p) { pics[i] = p; draw(i); },
      add: function (i, delta) { change(i, delta); },
      setKey: function (k, hidden) { keyN = k; drawKey(hidden); },
      setTitle: function (t) { titleEl.textContent = t; titleEl.classList.remove('pm-title-empty'); },
      lock: function () {
        locked = true;
        ctrls.forEach(function (cl) {
          if (cl) Array.prototype.forEach.call(cl.querySelectorAll('button'), function (b) { b.disabled = true; });
        });
        root.classList.add('pm-locked');
      },
      lit: function (i, on) { rowEls[i].classList.toggle('pm-lit', on !== false); },
      total: function (i, txt) { totals[i].textContent = txt; },
      /** Count row i picture by picture, writing the running total under each one. */
      count: function (i, done, speed) {
        var cells = tracks[i].querySelectorAll('.pm-cell');
        var run = 0;
        var k = 0;
        totals[i].textContent = '';
        Array.prototype.forEach.call(cells, function (cl) { cl.querySelector('.pm-tick').textContent = ''; cl.classList.remove('pm-on'); });
        rowEls[i].classList.add('pm-lit');
        function step() {
          if (k >= cells.length) {
            totals[i].textContent = '= ' + fmt(run);
            if (done) done(run);
            return;
          }
          var cl = cells[k];
          var half = cl.classList.contains('pm-half');
          run += half ? keyN / 2 : keyN;
          cl.querySelector('.pm-tick').textContent = half ? '+' + fmt(keyN / 2) : String(run);
          cl.classList.add('pm-on');
          api.sound('pop');
          k++;
          api.later(step, speed || 380);
        }
        step();
      },
    };
    return P;
  }

  /** Skip-count strip: 2 → 4 → 6 → 8 → +1 = 9 (or 1, 2, 3 ... + ½ for a key of 1). */
  function strip(value, keyN, icon) {
    var whole = Math.floor(value / keyN + 1e-9);
    var half = value - whole * keyN > 1e-9;
    var row = el('div', { class: 'pm-strip' });
    if (icon) row.appendChild(el('span', { class: 'pm-strip-lab' }, 'Count in ' + keyN + 's:'));
    for (var k = 1; k <= whole; k++) {
      if (k > 1) row.appendChild(el('span', { class: 'pm-jump' }, '+' + keyN));
      row.appendChild(el('span', { class: 'pm-schip' }, String(k * keyN)));
    }
    if (half) {
      row.appendChild(el('span', { class: 'pm-jump pm-jump-h' }, 'half'));
      row.appendChild(el('span', { class: 'pm-schip pm-schip-h' }, '+' + fmt(keyN / 2)));
    }
    row.appendChild(el('span', { class: 'pm-jump' }, '='));
    row.appendChild(el('span', { class: 'pm-schip pm-schip-t' }, fmt(value)));
    return row;
  }

  /** Small horizontal bar chart (scale of 1) drawn exactly on the grid. */
  function barChart(ctx, rows, max) {
    var lab = 104, cw = 34, rh = 34, top = 8;
    var W = lab + max * cw + 24;
    var H = top + rows.length * rh + 46;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'pm-bars', style: { maxWidth: '100%', height: 'auto' } });
    for (var n = 0; n <= max; n++) {
      var x = lab + n * cw;
      root.appendChild(svg('line', { x1: x, y1: top, x2: x, y2: top + rows.length * rh, class: n === 0 ? 'pm-bax' : 'pm-bgrid' }));
      root.appendChild(svg('text', { x: x, y: top + rows.length * rh + 18, 'text-anchor': 'middle', class: 'pm-bnum' }, String(n)));
    }
    rows.forEach(function (r, i) {
      var y = top + i * rh;
      root.appendChild(svg('rect', { x: lab, y: y + 6, width: r.value * cw, height: rh - 12, rx: 3, class: 'pm-bar' }));
      root.appendChild(svg('text', { x: lab - 8, y: y + rh / 2 + 6, 'text-anchor': 'end', class: 'pm-blab' }, r.name));
    });
    root.appendChild(svg('line', { x1: lab, y1: top + rows.length * rh, x2: lab + max * cw, y2: top + rows.length * rh, class: 'pm-bax' }));
    root.appendChild(svg('text', { x: lab + (max * cw) / 2, y: H - 4, 'text-anchor': 'middle', class: 'pm-baxis' }, 'Number of ' + ctx.many));
    return el('div', { class: 'pm-barwrap' }, el('div', { class: 'pm-title' }, ctx.title), root);
  }

  /* ---------------------------------------------------------------- *
   * Mistake detection
   * ---------------------------------------------------------------- */
  /** For a number read from a row: value v drawn with key k. */
  function readMistake(ans, v, k, name) {
    var p = v / k;
    var hasHalf = p % 1 !== 0;
    if (k === 2 && (U.same(ans, p) || U.same(ans, Math.floor(p)) || U.same(ans, Math.ceil(p))))
      return { tag: 'Ignored the key', hint: 'Look at the key: each picture stands for 2, not 1.', strong: 'Each picture is 2. Count in 2s along the ' + name + ' row: 2, 4, 6 ... and a half picture is 1.' };
    if (hasHalf && U.same(ans, v + k / 2))
      return { tag: 'Counted a half picture as 1 whole', hint: 'Look at the last picture. Is it a whole one?', strong: 'The last picture is only half. Half of ' + k + ' is ' + fmt(k / 2) + ', so add ' + fmt(k / 2) + ', not ' + k + '.' };
    if (hasHalf && U.same(ans, v - k / 2))
      return { tag: 'Ignored the half picture', hint: 'Do not forget the half picture at the end of the row!', strong: 'There is a half picture at the end. It is worth ' + fmt(k / 2) + '. Add it on.' };
    return {
      tag: 'Miscounted the pictures',
      hint: 'Count the ' + name + ' pictures again, slowly.',
      strong: k === 2 ? 'Point at each picture and count in 2s: 2, 4, 6 ... A half picture is 1.' : 'Point at each picture and count: 1, 2, 3 ...' + (hasHalf ? ' Add ½ for the half picture.' : ''),
    };
  }

  /** For a row the child built: p pictures placed, should show `target` with key k. */
  function buildMistake(p, target, k, name, ctx) {
    var need = target / k;
    if (U.same(p, need)) return null;
    var hasHalf = need % 1 !== 0;
    if (k === 2 && U.same(p, target) && target > 1)
      return { tag: 'Ignored the key', hint: 'The ' + name + ' row has ' + fmt(p) + ' pictures. But each picture stands for 2!', strong: 'Each picture is 2. Count in 2s: 2, 4, 6 ... until you reach ' + target + '. If you need 1 more, use a half picture.' };
    if (hasHalf && U.same(p, Math.ceil(need)))
      return { tag: 'Counted a half picture as 1 whole', hint: 'The ' + name + ' row shows ' + fmt(p * k) + ', one too many. Try a half picture at the end.', strong: 'Use ' + Math.floor(need) + ' whole pictures and then a half picture. The half is worth ' + fmt(k / 2) + '.' };
    if (hasHalf && U.same(p, Math.floor(need)))
      return { tag: 'Ignored the half picture', hint: 'The ' + name + ' row shows ' + fmt(p * k) + '. It needs ' + fmt(target) + '. What is missing?', strong: 'Add a half picture to the ' + name + ' row. A half is worth ' + fmt(k / 2) + '.' };
    return {
      tag: 'Wrong number of pictures',
      hint: 'The ' + name + ' row shows ' + fmt(p * k) + ' ' + ctx.many + ', but it should show ' + fmt(target) + '.',
      strong: k === 2 ? 'Count in 2s as you add pictures to the ' + name + ' row: 2, 4, 6 ... stop at ' + target + '.' : 'The ' + name + ' row needs ' + fmt(target) + ' pictures: one for each.',
    };
  }

  /* ---------------------------------------------------------------- *
   * Deck
   * ---------------------------------------------------------------- */
  function distinct(n, lo, hi) { return U.shuffle(U.range(lo, hi)).slice(0, n); }
  function halves(lo, hi) { var a = []; for (var v = lo; v <= hi + 1e-9; v += 0.5) a.push(v); return a; }

  function buildDeck() {
    var used = {};
    function pickCtx(pool) {
      var free = U.shuffle(pool).filter(function (k) { return !used[k]; });
      var k = free.length ? free[0] : U.pick(pool);
      used[k] = 1;
      return k;
    }
    var q = [];
    // ---- Level 1: key 1, counts 1-8
    U.shuffle(['howMany', 'most', 'least']).forEach(function (t) {
      var ck = pickCtx(WHOLE_POOL);
      var ctx = CTX[ck];
      var n = ctx.days ? 5 : ctx.rows.length >= 5 ? U.pick([4, 5]) : 4;
      var vals = distinct(n, 1, 8);
      q.push({ type: t, ck: ck, keyN: 1, rows: rowsOf(ctx, n).map(function (r, i) { r.value = vals[i]; return r; }), ask: U.rand(0, n - 1) });
    });
    // ---- Level 2: key 1 with half pictures
    var hk = U.shuffle(['sunshine', 'rain', 'pizza']);
    (function () {
      var ctx = HCTX[hk[0]];
      var n = ctx.days ? 5 : 4;
      var ask = U.rand(0, n - 1);
      var vals;
      do { vals = U.shuffle(halves(1, 7.5)).slice(0, n); } while (vals[ask] % 1 === 0 || vals[ask] < 2);
      q.push({ type: 'readHalf', hk: hk[0], keyN: 1, rows: rowsOf(ctx, n).map(function (r, j) { r.value = vals[j]; return r; }), ask: ask });
    })();
    (function () {
      var ctx = HCTX[hk[1]];
      var n = ctx.days ? 4 : 4;
      var a, b, vals, tries = 0;
      do {
        vals = U.shuffle(halves(1, 7.5)).slice(0, n);
        a = U.rand(0, n - 1);
        b = U.rand(0, n - 1);
        tries++;
      } while ((a === b || vals[a] <= vals[b] || (vals[a] % 1 === 0) === (vals[b] % 1 === 0)) && tries < 500);
      q.push({ type: 'moreAlt', hk: hk[1], keyN: 1, op: U.pick(['more', 'alt']), rows: rowsOf(ctx, n).map(function (r, j) { r.value = vals[j]; return r; }), a: a, b: b });
    })();
    (function () {
      var ck = hk[0] === 'sunshine' || hk[1] === 'sunshine' ? (hk[0] === 'rain' || hk[1] === 'rain' ? 'sunshine' : 'rain') : 'sunshine';
      var a, d;
      do {
        a = U.pick([4.5, 5.5, 6.5, 7.5]);
        d = U.pick([1, 2, 3]);
      } while (a - d < 1.5 || a + (a - d) > 13);
      var start = U.pick([0, 2, 4]); // Mon-Wed, Wed-Fri, Fri-Sun
      q.push({ type: 'clues', hk: ck, keyN: 1, a: a, d: d, b: a - d, s: a + a - d, days: DAYS.slice(start, start + 3) });
    })();
    // ---- Level 3: key 1 picture = 2 (three of five kinds)
    U.shuffle(['read2', 'build2', 'vertical', 'writeKey', 'barToPicto']).slice(0, 3).forEach(function (t) {
      var ck, ctx, n, vals, ask;
      if (t === 'vertical') {
        ck = pickCtx(['park', 'books']);
        ctx = CTX[ck];
        n = ck === 'park' ? 7 : 5;
        vals = distinct(n, 2, 15);
        var odd = vals.map(function (v, i) { return v % 2 && v >= 5 ? i : -1; }).filter(function (i) { return i >= 0; });
        if (!odd.length) { vals[0] = U.pick([5, 7, 9, 11, 13, 15]); for (var j = 1; j < n; j++) if (vals[j] === vals[0]) vals[j] = vals[0] - 1; odd = [0]; }
        q.push({ type: t, ck: ck, keyN: 2, rows: rowsOf(ctx, n).map(function (r, i) { r.value = vals[i]; return r; }), ask: U.pick(odd) });
        return;
      }
      ck = pickCtx(WHOLE_POOL);
      ctx = CTX[ck];
      n = 4;
      if (t === 'read2') {
        vals = distinct(n, 2, 15);
        ask = U.rand(0, n - 1);
        vals[ask] = U.pick([5, 7, 9, 11, 13, 15].filter(function (v) { return vals.indexOf(v) === -1 || vals[ask] === v; }));
        q.push({ type: t, ck: ck, keyN: 2, rows: rowsOf(ctx, n).map(function (r, i) { r.value = vals[i]; return r; }), ask: ask });
      } else if (t === 'build2') {
        vals = distinct(n, 2, 14);
        ask = U.rand(0, n - 1);
        var target = Math.random() < 0.7 ? U.pick([5, 7, 9, 11, 13, 15]) : U.pick([6, 8, 10, 12, 14]);
        vals[ask] = target;
        q.push({ type: t, ck: ck, keyN: 2, rows: rowsOf(ctx, n).map(function (r, i) { r.value = vals[i]; return r; }), ask: ask });
      } else if (t === 'writeKey') {
        var k = Math.random() < 0.65 ? 2 : 1;
        vals = k === 2 ? distinct(n, 1, 7).map(function (v) { return v * 2; }) : distinct(n, 2, 8);
        ask = U.rand(0, n - 1);
        if (vals[ask] / k < 3) vals[ask] = k * U.pick([3, 4, 5, 6].filter(function (v) { return vals.indexOf(v * k) === -1; }));
        q.push({ type: t, ck: ck, keyN: k, rows: rowsOf(ctx, n).map(function (r, i) { r.value = vals[i]; return r; }), ask: ask });
      } else {
        do { vals = distinct(n, 2, 12); } while (!vals.some(function (v) { return v % 2; }) || !vals.some(function (v) { return v % 2 === 0; }));
        q.push({ type: t, ck: ck, keyN: 2, rows: rowsOf(ctx, n).map(function (r, i) { r.value = vals[i]; return r; }) });
      }
    });
    return q;
  }

  /* ---------------------------------------------------------------- *
   * Shared practice helpers
   * ---------------------------------------------------------------- */
  function numberQ(stage, api, ans, opts) {
    var tried = {};
    var wrongN = 0;
    var ni = MQ.ui.numberInput({
      half: opts.half,
      unit: opts.unit,
      onSubmit: function (num) {
        if (api.isAnswered()) return;
        if (U.same(num, ans)) {
          ni.good();
          ni.disable();
          if (opts.onRight) opts.onRight();
          api.check(true, opts.praise);
        } else {
          ni.bad();
          if (tried[num]) {
            api.feedback('You tried ' + fmt(num) + ' already. Look again and try a different number.', 'try');
            return;
          }
          tried[num] = true;
          var j = opts.judge(num);
          var strong = api.tries() >= 1;
          if (strong && opts.onStrong) opts.onStrong();
          api.check(false, strong ? j.strong : j.hint, j.tag);
        }
      },
    });
    stage.appendChild(ni.el);
    ni.focus();
    var checkBtn = ni.el.querySelector('.btn-check');
    window.MQ.__test = {
      solve: function () { ni.setValue(fmt(ans)); checkBtn.click(); },
      wrong: function () { ni.setValue(String(Math.floor(ans) + 4 + wrongN++)); checkBtn.click(); },
    };
    return ni;
  }

  function choiceHook(ch, right) {
    window.MQ.__test = {
      solve: function () { ch.buttons.filter(function (b) { return b.value_ === right; })[0].click(); },
      wrong: function () {
        var w = ch.buttons.filter(function (b) { return b.value_ !== right; });
        (w.filter(function (b) { return !b.classList.contains('bad'); })[0] || w[0]).click();
      },
    };
  }

  function clickTo(P, i, target) {
    var row = P.rows[i];
    var guard = 0;
    while (P.pics[i] > 0 && guard++ < 40) row.querySelector('.pm-del').click();
    for (var k = 0; k < Math.floor(target); k++) row.querySelector('.pm-add').click();
    if (target % 1) row.querySelector('.pm-addh').click();
  }

  /** Count rows one after another (used by reveals). */
  function countSeq(P, idx, done) {
    var k = 0;
    function nxt() {
      if (k >= idx.length) { if (done) done(); return; }
      P.count(idx[k++], nxt, 260);
    }
    nxt();
  }

  /* ---------------------------------------------------------------- *
   * Practice renderers
   * ---------------------------------------------------------------- */
  function renderRead(stage, api, q, ctx, opts) {
    // howMany (key 1 or 2), readHalf, read2, vertical
    var r = q.rows[q.ask];
    var v = r.value;
    stage.appendChild(MQ.ui.prompt(ctx.howMany(r.name)));
    var P = picto(stage, api, { title: ctx.title, ctx: ctx, keyN: q.keyN, rows: q.rows, maxCells: opts.maxCells, vertical: opts.vertical });
    stage.appendChild(P.el);
    var stripHost = el('div', { class: 'pm-strip-host' });
    stage.appendChild(stripHost);
    var ni = numberQ(stage, api, v, {
      half: opts.half,
      unit: ctx.many,
      judge: function (num) { return readMistake(num, v, q.keyN, opts.vertical ? r.name : lower(r.name)); },
      onStrong: function () { P.lit(q.ask); },
    });
    api.onReveal(function () {
      ni.setValue(fmt(v));
      ni.good();
      ni.disable();
      P.count(q.ask, function () {
        MQ.clear(stripHost);
        if (q.keyN === 2 || v % 1) stripHost.appendChild(strip(v, q.keyN, true));
      });
      api.feedback(q.keyN === 2 ? 'Each picture is 2, so count in 2s. A half picture is 1. ' + r.name + ': ' + fmt(v) + '.' : 'Count the pictures: ' + r.name + ' = ' + fmt(v) + '.', 'info');
    });
  }

  function renderMostLeast(stage, api, q, ctx) {
    var most = q.type === 'most';
    var vals = q.rows.map(function (r) { return r.value; });
    var target = most ? Math.max.apply(null, vals) : Math.min.apply(null, vals);
    var other = most ? Math.min.apply(null, vals) : Math.max.apply(null, vals);
    var right = q.rows.filter(function (r) { return r.value === target; })[0].name;
    var opposite = q.rows.filter(function (r) { return r.value === other; })[0].name;
    stage.appendChild(MQ.ui.prompt(most ? ctx.most : ctx.least));
    var P = picto(stage, api, { title: ctx.title, ctx: ctx, keyN: 1, rows: q.rows, maxCells: 8 });
    stage.appendChild(P.el);
    var ch = MQ.ui.choices(
      q.rows.map(function (r) { return { label: (!ctx.sym ? r.icon + ' ' : '') + r.name, value: r.name }; }),
      function (val, btn) {
        if (val === right) {
          ch.mark(val, 'good');
          ch.disable();
          api.check(true, right + ': ' + target + ' ' + keyWord(ctx, target) + '. ' + (most ? 'The longest row!' : 'The shortest row!'));
        } else {
          if (btn.classList.contains('bad')) {
            api.feedback('You tried that one. Pick a different answer.', 'try');
            return;
          }
          ch.mark(val, 'bad');
          var strong = api.tries() >= 1;
          if (val === opposite) api.check(false, most ? 'That is the shortest row. Most means the longest row.' : 'That is the longest row. Least means the shortest row.', 'Mixed up most and least');
          else api.check(false, strong ? 'Count each row. Which row has the ' + (most ? 'most' : 'fewest') + ' pictures?' : 'Compare the lengths of the rows. Which one is ' + (most ? 'longest' : 'shortest') + '?', 'Compared the rows wrongly');
        }
      },
      { columns: Math.min(q.rows.length, 5) }
    );
    ch.classList.add('pm-choices');
    stage.appendChild(ch);
    choiceHook(ch, right);
    api.onReveal(function () {
      ch.mark(right, 'good');
      ch.disable();
      var idx = q.rows.map(function (r, i) { return i; });
      countSeq(P, idx, function () {
        q.rows.forEach(function (r, i) { if (r.value === target) P.lit(i); else P.lit(i, false); });
      });
      api.feedback(right + ' has ' + (most ? 'the most' : 'the fewest') + ' pictures: ' + target + '.', 'info');
    });
  }

  function renderMoreAlt(stage, api, q, ctx) {
    var A = q.rows[q.a], B = q.rows[q.b];
    var more = q.op === 'more';
    var ans = more ? A.value - B.value : A.value + B.value;
    var oppo = more ? A.value + B.value : A.value - B.value;
    var flo = more ? Math.floor(A.value) - Math.floor(B.value) : Math.floor(A.value) + Math.floor(B.value);
    var cei = more ? Math.ceil(A.value) - Math.ceil(B.value) : Math.ceil(A.value) + Math.ceil(B.value);
    stage.appendChild(MQ.ui.prompt(more ? 'How many <b>more</b> ' + ctx.what + ' on <b>' + A.name + '</b> than on <b>' + B.name + '</b>?' : 'How many ' + ctx.what + ' on <b>' + A.name + '</b> and <b>' + B.name + '</b> <b>altogether</b>?'));
    var P = picto(stage, api, { title: ctx.title, ctx: ctx, keyN: 1, rows: q.rows, maxCells: 8 });
    stage.appendChild(P.el);
    var work = el('div', { class: 'pm-strip-host' });
    stage.appendChild(work);
    var opWord = more ? '−' : '+';
    var ni = numberQ(stage, api, ans, {
      half: true,
      unit: ctx.many,
      judge: function (num) {
        if (U.same(num, oppo)) return { tag: 'Mixed up more and altogether', hint: more ? '"How many more" means find the difference. Take the smaller from the bigger.' : '"Altogether" means add them together.', strong: (more ? 'Find the difference: ' : 'Add them: ') + fmt(A.value) + ' ' + opWord + ' ' + fmt(B.value) + ' = ?' };
        if (U.same(num, A.value) || U.same(num, B.value)) return { tag: 'Used only one row', hint: 'That is just one row. Use both ' + A.name + ' and ' + B.name + '.', strong: fmt(A.value) + ' ' + opWord + ' ' + fmt(B.value) + ' = ?' };
        if (U.same(num, cei) && !U.same(cei, ans)) return { tag: 'Counted a half picture as 1 whole', hint: 'Look carefully: one row ends with a half picture. It is worth ½.', strong: A.name + ' is ' + fmt(A.value) + ' and ' + B.name + ' is ' + fmt(B.value) + '. ' + fmt(A.value) + ' ' + opWord + ' ' + fmt(B.value) + ' = ?' };
        if (U.same(num, flo) && !U.same(flo, ans)) return { tag: 'Ignored the half picture', hint: 'Do not forget the half picture! It is worth ½.', strong: A.name + ' is ' + fmt(A.value) + ' and ' + B.name + ' is ' + fmt(B.value) + '. ' + fmt(A.value) + ' ' + opWord + ' ' + fmt(B.value) + ' = ?' };
        return { tag: 'Miscounted the pictures', hint: 'Count each row first: how many ' + ctx.many + ' on ' + A.name + '? On ' + B.name + '?', strong: A.name + ' is ' + fmt(A.value) + ' and ' + B.name + ' is ' + fmt(B.value) + '. ' + fmt(A.value) + ' ' + opWord + ' ' + fmt(B.value) + ' = ?' };
      },
      onStrong: function () { P.lit(q.a); P.lit(q.b); },
    });
    api.onReveal(function () {
      ni.setValue(fmt(ans));
      ni.good();
      ni.disable();
      countSeq(P, [q.a, q.b], function () {
        MQ.clear(work);
        work.appendChild(el('div', { class: 'sum-row' }, el('span', { class: 'chip' }, fmt(A.value)), el('span', { class: 'sum-op' }, opWord), el('span', { class: 'chip' }, fmt(B.value)), el('span', { class: 'sum-op' }, '='), el('span', { class: 'chip chip-total' }, fmt(ans) + ' ' + ctx.many)));
      });
      api.feedback(A.name + ' is ' + fmt(A.value) + ', ' + B.name + ' is ' + fmt(B.value) + '. ' + (more ? 'How many more means take away: ' : 'Altogether means add: ') + fmt(A.value) + ' ' + opWord + ' ' + fmt(B.value) + ' = ' + fmt(ans) + '.', 'info');
    });
  }

  /** Builder questions: clues, build2, barToPicto. */
  function renderBuild(stage, api, q, ctx, cfg) {
    // cfg: { rows (with edit flags), targets (per row, null if fixed), maxCells, titles (optional), titleRight, before (elements) }
    var P = picto(stage, api, { title: cfg.titles ? null : ctx.title, ctx: ctx, keyN: q.keyN, rows: cfg.rows, maxCells: cfg.maxCells, controls: true });
    var chosenTitle = null;
    var tch = null;
    if (cfg.titles) {
      tch = MQ.ui.choices(cfg.titles, function (t) {
        chosenTitle = t;
        tch.buttons.forEach(function (b) { b.classList.toggle('pm-picked', b.value_ === t); });
        P.setTitle(t);
      }, { columns: cfg.titles.length });
      tch.classList.add('pm-titles');
      stage.appendChild(el('div', { class: 'pm-title-pick' }, el('span', { class: 'pm-tp-lab' }, 'Title:'), tch));
    }
    stage.appendChild(P.el);
    var checkBtn = el('button', { type: 'button', class: 'btn btn-check pm-checkbtn' }, 'Check my pictogram');
    stage.appendChild(checkBtn);
    var editable = cfg.rows.map(function (r, i) { return r.edit ? i : -1; }).filter(function (i) { return i >= 0; });
    var lastWrong = null;
    var wrongN = 0;
    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      if (editable.every(function (i) { return P.pics[i] === 0; })) {
        api.feedback('Add some pictures first. Use the + buttons.', 'try');
        return;
      }
      var sig = P.pics.join(',') + '|' + chosenTitle;
      if (sig === lastWrong) {
        api.feedback('Nothing has changed yet. Change a row, then check again.', 'try');
        return;
      }
      var strong = api.tries() >= 1;
      for (var k = 0; k < editable.length; k++) {
        var i = editable[k];
        var m = cfg.mistake ? cfg.mistake(i, P.pics[i]) : null;
        if (!m) m = buildMistake(P.pics[i], cfg.targets[i], q.keyN, cfg.rows[i].name, ctx);
        if (m) {
          P.rows.forEach(function (r, j) { P.lit(j, j === i); });
          lastWrong = sig;
          api.check(false, strong ? m.strong : m.hint, m.tag);
          return;
        }
      }
      if (cfg.titles && !chosenTitle) {
        lastWrong = sig;
        api.check(false, strong ? 'Pick a title above the pictogram, so people know what it shows.' : 'The pictures are right! But a pictogram needs a title too.', 'Forgot the title or key');
        return;
      }
      if (cfg.titles && chosenTitle !== cfg.titleRight) {
        lastWrong = sig;
        api.check(false, 'Does that title tell us what the pictures show? Pick another.', 'Chose a title that does not fit');
        return;
      }
      P.lock();
      checkBtn.disabled = true;
      P.rows.forEach(function (r, j) { P.lit(j, false); });
      countSeq(P, editable);
      api.check(true, cfg.praise);
    });
    window.MQ.__test = {
      solve: function () {
        editable.forEach(function (i) { clickTo(P, i, cfg.targets[i] / q.keyN); });
        if (tch) tch.buttons.filter(function (b) { return b.value_ === cfg.titleRight; })[0].click();
        checkBtn.click();
      },
      wrong: function () {
        var w = wrongN++;
        var row = editable[w % editable.length];
        var need = cfg.targets[row] / q.keyN;
        var step = 1 + Math.floor(w / editable.length);
        editable.forEach(function (i) { clickTo(P, i, cfg.targets[i] / q.keyN); });
        clickTo(P, row, need + step <= cfg.maxCells ? need + step : need - 0.5 * step);
        checkBtn.click();
      },
    };
    api.onReveal(function () {
      editable.forEach(function (i) { P.set(i, cfg.targets[i] / q.keyN); });
      if (tch) {
        tch.buttons.forEach(function (b) { b.classList.toggle('pm-picked', b.value_ === cfg.titleRight); });
        tch.mark(cfg.titleRight, 'good');
        tch.disable();
        P.setTitle(cfg.titleRight);
      }
      P.lock();
      checkBtn.disabled = true;
      P.rows.forEach(function (r, j) { P.lit(j, false); });
      countSeq(P, editable, cfg.afterReveal);
      if (cfg.revealText) api.feedback(cfg.revealText, 'info');
    });
    return P;
  }

  function renderClues(stage, api, q) {
    var ctx = HCTX[q.hk];
    var d = q.days;
    var clues = el(
      'div',
      { class: 'pm-clues' },
      el('div', { class: 'pm-clue', html: '<b>' + d[1] + '</b>: ' + fmt(q.a) + ' hours' }),
      el('div', { class: 'pm-clue', html: '<b>' + d[2] + '</b>: ' + q.d + ' hour' + (q.d > 1 ? 's' : '') + ' <b>less</b> than ' + d[1] }),
      el('div', { class: 'pm-clue', html: '<b>' + d[0] + '</b>: ' + d[1] + ' and ' + d[2] + ' <b>added together</b>' })
    );
    stage.appendChild(el('div', { class: 'pm-top' }, el('div', { class: 'pm-ask' }, 'Make the pictogram from the clues.'), clues));
    var targets = [q.s, q.a, q.b];
    var rows = d.map(function (name) { return { name: name, icon: ctx.sym, edit: true }; });
    var titles = U.shuffle([ctx.title, 'Days of the week', 'Fruit sold at the shop']);
    renderBuild(stage, api, q, ctx, {
      rows: rows,
      targets: targets,
      maxCells: 14,
      titles: titles,
      titleRight: ctx.title,
      mistake: function (i, p) {
        if (i === 2 && U.same(p, q.a + q.d)) return { tag: 'Read a clue wrongly', hint: d[2] + ' had ' + q.d + ' <b>less</b>, so it is shorter than ' + d[1] + '.', strong: fmt(q.a) + ' − ' + q.d + ' = ' + fmt(q.b) + '. ' + d[2] + ' needs ' + fmt(q.b) + ' pictures.' };
        if (i === 0 && U.same(p, q.d)) return { tag: 'Mixed up more and altogether', hint: d[0] + ' is ' + d[1] + ' and ' + d[2] + ' <b>added together</b>.', strong: fmt(q.a) + ' + ' + fmt(q.b) + ' = ' + fmt(q.s) + '. Two halves make a whole!' };
        if (i === 0 && U.same(p, q.s + 1)) return { tag: 'Counted a half picture as 1 whole', hint: 'Two halves make one whole. ' + fmt(q.a) + ' + ' + fmt(q.b) + ' = ?', strong: fmt(q.a) + ' + ' + fmt(q.b) + ' = ' + fmt(q.s) + '. Two halves make a whole!' };
        return null;
      },
      praise: 'Brilliant! ' + fmt(q.a) + ' + ' + fmt(q.b) + ' = ' + fmt(q.s) + '. Two halves make a whole!',
      revealText: d[1] + ' = ' + fmt(q.a) + ', ' + d[2] + ' = ' + fmt(q.a) + ' − ' + q.d + ' = ' + fmt(q.b) + ', ' + d[0] + ' = ' + fmt(q.a) + ' + ' + fmt(q.b) + ' = ' + fmt(q.s) + '.',
    });
    api.say('Read each clue. Use + for a picture and + ½ for half a picture.', 'think');
  }

  function renderBuild2(stage, api, q) {
    var ctx = CTX[q.ck];
    var r = q.rows[q.ask];
    var v = r.value;
    stage.appendChild(MQ.ui.prompt('<b>' + r.name + '</b>: ' + v + ' ' + keyWord(ctx, v) + '. Show this on the pictogram.'));
    var rows = q.rows.map(function (x, i) { return i === q.ask ? { name: x.name, icon: x.icon, edit: true } : x; });
    var targets = q.rows.map(function (x, i) { return i === q.ask ? v : null; });
    var host = el('div', { class: 'pm-strip-host' });
    renderBuild(stage, api, q, ctx, {
      rows: rows,
      targets: targets,
      maxCells: 9,
      praise: 'Yes! ' + (v % 2 ? (v - 1) / 2 + ' pictures and a half picture make ' + v + '.' : v / 2 + ' pictures make ' + v + '.'),
      revealText: 'Each picture is 2. ' + Math.floor(v / 2) + ' pictures make ' + Math.floor(v / 2) * 2 + (v % 2 ? ', and a half picture adds 1: ' + v + '.' : '.'),
      afterReveal: function () { host.appendChild(strip(v, 2, true)); },
    });
    stage.appendChild(host);
    api.say('Look at the key! Each picture stands for 2.', 'think');
  }

  function renderBarToPicto(stage, api, q) {
    var ctx = CTX[q.ck];
    stage.appendChild(MQ.ui.prompt('Turn the bar chart into a pictogram. Each picture = <b>2</b>.'));
    stage.appendChild(barChart(ctx, q.rows, 12));
    var rows = q.rows.map(function (x) { return { name: x.name, icon: x.icon, edit: true }; });
    var targets = q.rows.map(function (x) { return x.value; });
    renderBuild(stage, api, q, ctx, {
      rows: rows,
      targets: targets,
      maxCells: 6,
      praise: 'Great! The pictogram shows the same numbers as the bars.',
      revealText: 'Read each bar, then count in 2s. An odd number needs a half picture at the end.',
    });
    api.say('Read each bar. Then count in 2s as you add pictures.', 'think');
  }

  function renderWriteKey(stage, api, q) {
    var ctx = CTX[q.ck];
    var r = q.rows[q.ask];
    var v = r.value;
    var k = q.keyN;
    var sym = ctx.sym ? '<span class="pm-bicon">' + ctx.sym + '</span>' : '1 picture';
    stage.appendChild(MQ.ui.prompt(ctx.fact(r.name, v) + ' What does <b>one picture</b> stand for?'));
    var P = picto(stage, api, { title: ctx.title, ctx: ctx, keyN: k, keyHidden: true, rows: q.rows, maxCells: 8 });
    stage.appendChild(P.el);
    var host = el('div', { class: 'pm-strip-host' });
    stage.appendChild(host);
    var ch = MQ.ui.choices(
      [1, 2, 4].map(function (n) { return { label: sym + ' = ' + n + ' ' + keyWord(ctx, n), value: n }; }),
      function (val, btn) {
        if (val === k) {
          ch.mark(val, 'good');
          ch.disable();
          P.setKey(k);
          P.count(q.ask);
          api.check(true, v + ' ' + ctx.many + ', ' + v / k + ' pictures, so each picture stands for ' + k + '.');
        } else {
          if (btn.classList.contains('bad')) {
            api.feedback('You tried that one. Pick a different answer.', 'try');
            return;
          }
          ch.mark(val, 'bad');
          var strong = api.tries() >= 1;
          P.lit(q.ask);
          if (val > k) api.check(false, strong ? 'Count along the ' + lower(r.name) + ' row in ' + k + 's. Do you reach ' + v + '?' : 'If each picture was ' + val + ', the ' + lower(r.name) + ' row would show ' + (v / k) * val + '. But there were only ' + v + '.', 'Could not work out the key');
          else if (k === 2) api.check(false, strong ? 'Count in 2s along the ' + lower(r.name) + ' row: 2, 4, 6 ... Do you reach ' + v + '?' : 'There are ' + v / k + ' pictures in the ' + lower(r.name) + ' row, but ' + v + ' ' + ctx.many + '. So one picture must stand for more than 1.', 'Could not work out the key');
          else api.check(false, strong ? 'Count the ' + lower(r.name) + ' pictures in 1s. Do you reach ' + v + '?' : 'Count the ' + lower(r.name) + ' pictures. There are ' + v + ' pictures and ' + v + ' ' + ctx.many + '.', 'Could not work out the key');
        }
      },
      { columns: 3 }
    );
    ch.classList.add('pm-choices');
    stage.appendChild(ch);
    choiceHook(ch, k);
    api.onReveal(function () {
      ch.mark(k, 'good');
      ch.disable();
      P.setKey(k);
      P.count(q.ask, function () { host.appendChild(strip(v, k, true)); });
      api.feedback(v / k + ' pictures show ' + v + ' ' + ctx.many + ', so 1 picture = ' + k + ' ' + keyWord(ctx, k) + '.', 'info');
    });
  }

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */
  var BIRDS = [
    { name: 'Sparrows', icon: '🐦', value: 5 },
    { name: 'Pigeons', icon: '🕊️', value: 3 },
    { name: 'Ducks', icon: '🦆', value: 2 },
    { name: 'Parrots', icon: '🦜', value: 6 },
  ];

  function learnRead(stage, api) {
    api.say('We watched the garden for one hour. Click each row to count the birds!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('A pictogram', 'Each picture stands for <b>1 bird</b>. Look at the key.'));
    var P = picto(stage, api, { title: 'Birds seen in the garden', ctx: CTX.birds, keyN: 1, rows: BIRDS, maxCells: 8 });
    stage.appendChild(P.el);
    var host = el('div', { class: 'pm-q-host' });
    stage.appendChild(host);
    var done = {};
    var busy = false;
    P.rows.forEach(function (row, i) {
      row.classList.add('pm-clickable');
      row.addEventListener('click', function () {
        if (busy || done[i]) return;
        busy = true;
        P.count(i, function () {
          busy = false;
          done[i] = true;
          row.classList.remove('pm-clickable');
          if (Object.keys(done).length === BIRDS.length) ask();
          else api.feedback(BIRDS[i].name + ': ' + BIRDS[i].value + '. Click another row.', 'info');
        });
      });
    });
    function ask() {
      api.say('Which bird was seen the most?', 'think');
      api.feedback('', 'info');
      var ch = MQ.ui.choices(BIRDS.map(function (b) { return { label: b.icon + ' ' + b.name, value: b.name }; }), function (v) {
        if (v === 'Parrots') {
          ch.mark(v, 'good');
          ch.disable();
          api.sound('correct');
          api.say('Yes! Parrots: 6. The longest row shows the most.', 'cheer');
          api.feedback('The longest row has the most pictures. Press Next.', 'good');
          api.unlockNext();
        } else {
          ch.mark(v, 'bad');
          api.sound('wrong');
          api.feedback('Look for the longest row.', 'try');
        }
      }, { columns: 4 });
      ch.classList.add('pm-choices');
      host.appendChild(ch);
    }
  }

  function learnKey2(stage, api) {
    api.say('Now the key changes. Watch what happens!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('When 1 picture = 2', 'The key tells you what <b>one picture</b> is worth.'));
    var rows = [{ name: 'Sparrows', icon: '🐦', value: 5 }];
    var P;
    var holder = el('div', { class: 'pm-l2' });
    var host = el('div', { class: 'pm-q-host' });
    stage.appendChild(holder);
    stage.appendChild(host);
    function draw(keyN, list) {
      MQ.clear(holder);
      P = picto(stage, api, { title: 'Birds seen in the park', ctx: CTX.birds, keyN: keyN, rows: list, maxCells: 8 });
      holder.appendChild(P.el);
      holder.appendChild(el('div', { class: 'pm-strip-host' }));
    }
    draw(1, rows);
    P.total(0, '= 5');
    var btn = el('button', { type: 'button', class: 'btn pm-keybtn' }, 'Change the key to 1 picture = 2');
    host.appendChild(btn);
    btn.addEventListener('click', function () {
      MQ.clear(host);
      rows = [{ name: 'Sparrows', icon: '🐦', value: 10 }];
      draw(2, rows);
      P.keyEl.classList.add('pm-flash');
      api.say('Same pictures, but each one is now 2 birds. Click the row to count in 2s.', 'think');
      armRow(0, function () {
        holder.querySelector('.pm-strip-host').appendChild(strip(10, 2, true));
        api.later(stepHalf, 900);
      });
    });
    function armRow(i, then) {
      var row = P.rows[i];
      row.classList.add('pm-clickable');
      var used = false;
      row.addEventListener('click', function () {
        if (used) return;
        used = true;
        row.classList.remove('pm-clickable');
        P.count(i, then, 480);
      });
    }
    function stepHalf() {
      rows = [{ name: 'Sparrows', icon: '🐦', value: 10 }, { name: 'Pigeons', icon: '🕊️', value: 7 }];
      draw(2, rows);
      P.total(0, '= 10');
      api.say('Look! The pigeon row ends with HALF a picture. Click it to count.', 'think');
      armRow(1, function () {
        holder.querySelector('.pm-strip-host').appendChild(strip(7, 2, true));
        api.say('2, 4, 6 ... and the half is 1 more. 7 pigeons!', 'happy');
        var ch = MQ.ui.choices([{ label: '½', value: 0.5 }, { label: '1', value: 1 }, { label: '2', value: 2 }], function (v) {
          if (v === 1) {
            ch.mark(v, 'good');
            ch.disable();
            api.sound('correct');
            api.say('Yes! Half of 2 is 1.', 'cheer');
            api.feedback('A whole picture = 2 birds. Half a picture = 1 bird.', 'good');
            api.unlockNext();
          } else {
            ch.mark(v, 'bad');
            api.sound('wrong');
            api.feedback(v === 2 ? 'That is a whole picture. A half picture is worth half of 2.' : 'A whole picture is 2 birds. What is half of 2?', 'try');
          }
        }, { columns: 3 });
        ch.classList.add('pm-choices');
        host.appendChild(el('div', { class: 'pm-ask' }, 'Half a picture stands for how many birds?'));
        host.appendChild(ch);
      });
    }
  }

  function learnBuild(stage, api) {
    api.say('Your turn to make one! Drag the fruit pictures into the right rows.');
    api.lockNext();
    var FR = [
      { name: 'Apples', icon: '🍎', value: 4 },
      { name: 'Pears', icon: '🍐', value: 6 },
      { name: 'Bananas', icon: '🍌', value: 3 },
    ];
    stage.appendChild(
      el(
        'div',
        { class: 'pm-top' },
        el('div', { class: 'pm-ask' }, 'The shop has:'),
        el('div', { class: 'pm-clues' }, FR.map(function (f) { return el('div', { class: 'pm-clue' }, f.icon + ' ' + f.name + ' ', el('b', null, String(f.value))); }))
      )
    );
    var tray = el('div', { class: 'pm-tray' }, el('span', { class: 'pm-tray-lab' }, 'Drag:'));
    stage.appendChild(tray);
    var finished = false;
    var P = picto(stage, api, {
      title: null,
      ctx: CTX.fruit,
      keyN: 1,
      rows: FR.map(function (f) { return { name: f.name, icon: f.icon, edit: true }; }),
      maxCells: 8,
      clickRemove: true,
      onChange: function (i, p) {
        P.total(i, String(p));
        var f = FR[i];
        if (p > f.value) api.feedback('Too many ' + lower(f.name) + '! Click a picture to take it away.', 'try');
        else if (p === f.value) api.feedback(f.name + ': ' + f.value + '. Done!', 'good');
        else api.feedback('', 'info');
        if (FR.every(function (x, j) { return P.pics[j] === x.value; })) askTitle();
      },
    });
    stage.appendChild(P.el);
    var host = el('div', { class: 'pm-q-host' });
    stage.appendChild(host);
    stage.appendChild(el('div', { class: 'pm-small' }, 'Click a picture in a row to take it away.'));

    var selected = null;
    FR.forEach(function (f) {
      var s = el('span', { class: 'pm-stamp', title: 'Drag a ' + f.name.slice(0, -1).toLowerCase() }, f.icon);
      s.dataset.icon = f.icon;
      tray.appendChild(s);
      var ghost = null, sx = 0, sy = 0, moved = false;
      function mv(e) {
        if (!ghost) return;
        if (Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy) > 6) moved = true;
        ghost.style.left = e.clientX + 'px';
        ghost.style.top = e.clientY + 'px';
      }
      function up(e) {
        window.removeEventListener('pointermove', mv);
        window.removeEventListener('pointerup', up);
        if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
        ghost = null;
        s.classList.remove('pm-dragging');
        if (!moved) {
          // click-to-select, then click a row
          selected = selected === f ? null : f;
          Array.prototype.forEach.call(tray.querySelectorAll('.pm-stamp'), function (x) { x.classList.toggle('pm-sel', selected && x.dataset.icon === selected.icon); });
          if (selected) api.feedback('Now click the ' + lower(f.name) + ' row.', 'info');
          return;
        }
        drop(f, e.clientX, e.clientY);
      }
      s.addEventListener('pointerdown', function (e) {
        if (finished) return;
        e.preventDefault();
        sx = e.clientX;
        sy = e.clientY;
        moved = false;
        ghost = el('span', { class: 'pm-ghost', style: { left: sx + 'px', top: sy + 'px' } }, f.icon);
        document.body.appendChild(ghost);
        s.classList.add('pm-dragging');
        window.addEventListener('pointermove', mv);
        window.addEventListener('pointerup', up);
      });
      api.cleanup(function () {
        window.removeEventListener('pointermove', mv);
        window.removeEventListener('pointerup', up);
        if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
      });
    });
    P.rows.forEach(function (row, i) {
      row.addEventListener('click', function (e) {
        if (!selected || finished || e.target.closest('.pm-cell')) return;
        put(selected, i);
      });
    });
    function rowAt(x, y) {
      for (var i = 0; i < P.rows.length; i++) {
        var b = P.rows[i].getBoundingClientRect();
        if (y >= b.top - 4 && y <= b.bottom + 4 && x >= b.left && x <= b.right + 40) return i;
      }
      return -1;
    }
    function drop(f, x, y) {
      var i = rowAt(x, y);
      if (i < 0) { api.feedback('Drop the picture onto a row.', 'info'); return; }
      put(f, i);
    }
    function put(f, i) {
      if (finished) return;
      if (FR[i].icon !== f.icon) {
        api.sound('wrong');
        api.feedback('That row is for ' + lower(FR[i].name) + '. Put the ' + f.icon + ' in the ' + lower(f.name) + ' row.', 'try');
        return;
      }
      P.add(i, 1);
    }
    var asked = false;
    function askTitle() {
      if (asked) return;
      asked = true;
      finished = true;
      P.lock();
      tray.classList.add('pm-tray-off');
      api.say('Every pictogram needs a title. Which title fits?', 'think');
      var ch = MQ.ui.choices(['Toys in my room', 'Fruit in the shop', 'Apples'], function (v) {
        if (v === 'Fruit in the shop') {
          ch.mark(v, 'good');
          ch.disable();
          P.setTitle(v);
          api.sound('correct');
          api.say('Perfect! Title, pictures and a key. A real pictogram!', 'cheer');
          api.feedback('A pictogram needs a title and a key. Press the button to practise.', 'good');
          api.unlockNext();
        } else {
          ch.mark(v, 'bad');
          api.sound('wrong');
          api.feedback(v === 'Apples' ? 'The pictogram shows pears and bananas too.' : 'Does that tell us what the pictures show?', 'try');
        }
      }, { columns: 3 });
      ch.classList.add('pm-choices');
      host.appendChild(ch);
    }
  }

  /* ---------------------------------------------------------------- *
   * Register
   * ---------------------------------------------------------------- */
  var deck = null;

  MQ.register('pictogram-maker', {
    learn: [learnRead, learnKey2, learnBuild],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        var ctx;
        switch (q.type) {
          case 'howMany':
            api.say('Count the pictures. Each picture is 1.', 'think');
            renderRead(stage, api, q, CTX[q.ck], { maxCells: 8 });
            break;
          case 'most':
          case 'least':
            api.say('Compare the rows. Which is ' + (q.type === 'most' ? 'longest' : 'shortest') + '?', 'think');
            renderMostLeast(stage, api, q, CTX[q.ck]);
            break;
          case 'readHalf':
            api.say('Look out for half pictures!', 'think');
            renderRead(stage, api, q, HCTX[q.hk], { maxCells: 8, half: true });
            break;
          case 'moreAlt':
            api.say(q.op === 'more' ? '"How many more" means find the difference.' : '"Altogether" means add them up.', 'think');
            renderMoreAlt(stage, api, q, HCTX[q.hk]);
            break;
          case 'clues':
            renderClues(stage, api, q);
            break;
          case 'read2':
            api.say('Check the key first! Each picture is 2.', 'think');
            renderRead(stage, api, q, CTX[q.ck], { maxCells: 8 });
            break;
          case 'vertical':
            ctx = CTX[q.ck];
            api.say('This pictogram goes up. Check the key!', 'think');
            renderRead(stage, api, q, ctx, { maxCells: 8, vertical: true });
            break;
          case 'build2':
            renderBuild2(stage, api, q);
            break;
          case 'writeKey':
            api.say('The key is missing! Use the number to work it out.', 'think');
            renderWriteKey(stage, api, q);
            break;
          default:
            renderBarToPicto(stage, api, q);
        }
        if (window.MQ.__test) window.MQ.__test.type = q.type;
      },
    },
  });

  // Exposed for tests only (pure data, no UI).
  MQ.__pmBuildDeck = buildDeck;

  /* ---------------------------------------------------------------- *
   * Styles
   * ---------------------------------------------------------------- */
  var css = [
    '.pm-picto{background:#fff;border:2px solid var(--line);border-radius:16px;padding:8px 14px 10px;display:flex;flex-direction:column;align-items:center;gap:4px;max-width:100%}',
    '.pm-title{font-weight:800;font-size:1.1rem;text-align:center}',
    '.pm-title-empty{color:var(--ink-soft);border:2px dashed var(--line);border-radius:10px;padding:0 14px}',
    '.pm-rows{display:flex;flex-direction:column;gap:2px}',
    '.pm-row{display:flex;align-items:center;gap:8px;border-radius:12px;padding:0 6px;transition:background .15s}',
    '.pm-label{width:var(--pm-lw);flex:none;font-weight:800;display:flex;align-items:center;gap:6px;font-size:1rem;line-height:1.1;overflow:hidden}',
    '.pm-licon{font-size:1.3rem}',
    '.pm-h .pm-track{flex:none;display:flex;align-items:flex-start;width:calc(var(--pm-c) * var(--pm-n));min-height:calc(var(--pm-c) + 16px);border-left:3px solid var(--ink-soft);background-image:linear-gradient(to right,#e3e9f6 1px,transparent 1px);background-size:var(--pm-c) 100%;background-position:-1px 0}',
    '.pm-cell{position:relative;flex:none;display:flex;flex-direction:column;align-items:center}',
    '.pm-h .pm-cell{width:var(--pm-c)}',
    '.pm-h .pm-half{width:calc(var(--pm-c) / 2)}',
    '.pm-pic{position:relative;overflow:hidden;width:100%;height:var(--pm-c)}',
    '.pm-emo{position:absolute;left:0;top:0;width:var(--pm-c);height:var(--pm-c);display:flex;align-items:center;justify-content:center;font-size:calc(var(--pm-c) * .7);line-height:1;user-select:none}',
    '.pm-h .pm-half .pm-pic{border-right:2px dashed #9aa8c7}',
    '.pm-tick{height:16px;font-size:.78rem;font-weight:800;color:#0b6e66;white-space:nowrap;line-height:16px}',
    '.pm-half .pm-tick{color:var(--try)}',
    '.pm-on .pm-pic{background:#fff6d6;border-radius:6px}',
    '.pm-total{min-width:54px;font-weight:800;font-size:1.15rem;color:#0b6e66;white-space:nowrap}',
    '.pm-lit{background:#fff3cd}',
    '.pm-clickable{cursor:pointer;outline:2px dashed var(--accent);outline-offset:-1px}',
    '.pm-clickable:hover{background:#f0fbfa}',
    '.pm-key{display:flex;align-items:center;gap:6px;font-size:1.05rem;border:2px solid var(--line);border-radius:10px;padding:2px 12px;margin-top:4px;background:var(--paper)}',
    '.pm-key-k{font-weight:800;color:var(--ink-soft);margin-right:4px}',
    '.pm-key-sym{font-size:1.4rem}',
    '.pm-key-q{font-weight:800;font-size:1.2rem;color:var(--try)}',
    '.pm-flash{animation:pmflash 1s ease 2}',
    '@keyframes pmflash{50%{background:#ffe08a;transform:scale(1.08)}}',
    /* vertical */
    '.pm-vrows{display:flex;align-items:flex-end;gap:30px;padding:0 10px}',
    '.pm-vcol{display:flex;flex-direction:column;align-items:center;gap:2px;border-radius:10px;padding:2px 4px}',
    '.pm-v .pm-track{display:flex;flex-direction:column-reverse;width:var(--pm-c);height:calc(var(--pm-c) * var(--pm-n));border-bottom:3px solid var(--ink-soft);background-image:linear-gradient(to top,#e3e9f6 1px,transparent 1px);background-size:100% var(--pm-c);background-position:0 1px}',
    '.pm-v .pm-cell{width:var(--pm-c)}',
    '.pm-v .pm-half .pm-pic{height:calc(var(--pm-c) / 2);border-bottom:2px dashed #9aa8c7}',
    '.pm-v .pm-tick{position:absolute;left:calc(100% + 2px);top:50%;transform:translateY(-50%);height:auto}',
    '.pm-v .pm-label{width:auto;justify-content:center}',
    '.pm-v .pm-total{min-width:0;min-height:1.5em;text-align:center}',
    /* builder */
    '.pm-ctrl{display:flex;gap:4px;flex:none}',
    '.pm-btn{min-width:44px;height:40px;border-radius:10px;border:2px solid var(--line);background:#fff;font-weight:800;font-size:1rem;cursor:pointer;font-family:inherit;color:var(--ink);padding:0 6px;white-space:nowrap}',
    '.pm-btn:hover:not(:disabled){border-color:var(--accent)}',
    '.pm-btn:disabled{opacity:.45;cursor:default}',
    '.pm-bicon{font-size:1.15rem}',
    '.pm-edit .pm-cell{cursor:pointer}',
    '.pm-locked .pm-edit .pm-cell{cursor:default}',
    '.pm-checkbtn{margin-top:2px}',
    '.pm-tray{display:flex;align-items:center;gap:12px;background:var(--paper-2);border-radius:14px;padding:6px 14px}',
    '.pm-tray-lab{font-weight:800;color:var(--ink-soft)}',
    '.pm-tray-off{opacity:.4;pointer-events:none}',
    '.pm-stamp{font-size:2rem;width:54px;height:54px;display:flex;align-items:center;justify-content:center;background:#fff;border:3px solid var(--line);border-radius:12px;cursor:grab;touch-action:none;user-select:none}',
    '.pm-stamp:hover,.pm-sel{border-color:var(--accent)}',
    '.pm-sel{background:#e6faf7}',
    '.pm-dragging{opacity:.5}',
    '.pm-ghost{position:fixed;z-index:50;font-size:2.1rem;transform:translate(-50%,-50%);pointer-events:none}',
    '.pm-small{font-size:.85rem;color:var(--ink-soft)}',
    /* text bits */
    '.pm-top{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px}',
    '.pm-ask{font-weight:800;font-size:1.15rem;text-align:center}',
    '.pm-clues{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}',
    '.pm-clue{background:var(--info-bg);border:2px solid var(--line);border-radius:12px;padding:4px 12px;font-size:1.05rem}',
    '.pm-title-pick{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.pm-tp-lab{font-weight:800}',
    '.pm-titles{max-width:600px}',
    '.pm-titles .choice{min-height:42px;font-size:.95rem;padding:4px 8px}',
    '.pm-picked{border-color:var(--accent);background:#e6faf7}',
    '.pm-choices{max-width:700px}',
    '.pm-choices .choice{min-height:50px}',
    '.pm-q-host{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.pm-l2{display:flex;flex-direction:column;align-items:center;gap:8px}',
    '.pm-strip-host{display:flex;justify-content:center;min-height:0}',
    '.pm-strip{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:4px;font-weight:800}',
    '.pm-strip-lab{color:var(--ink-soft);margin-right:4px}',
    '.pm-schip{background:#e6faf7;border:2px solid var(--accent);border-radius:10px;padding:2px 9px;font-size:1.1rem}',
    '.pm-schip-h{background:var(--try-bg);border-color:var(--try)}',
    '.pm-schip-t{background:#fff3cd;border-color:var(--gold)}',
    '.pm-jump{font-size:.75rem;color:var(--ink-soft)}',
    '.pm-jump-h{color:var(--try)}',
    /* bar chart */
    '.pm-barwrap{display:flex;flex-direction:column;align-items:center;background:#fff;border:2px solid var(--line);border-radius:16px;padding:6px 10px 2px;max-width:100%}',
    '.pm-bgrid{stroke:#d6deef;stroke-width:1}',
    '.pm-bax{stroke:var(--ink);stroke-width:2}',
    '.pm-bar{fill:var(--accent);opacity:.85}',
    '.pm-bnum{font-size:14px;font-weight:700;fill:var(--ink)}',
    '.pm-blab{font-size:15px;font-weight:800;fill:var(--ink)}',
    '.pm-baxis{font-size:13px;fill:var(--ink-soft);font-weight:700}',
    '.stage-practice .num-row{margin-top:2px}',
    '@media (max-width:700px){.pm-label{font-size:.9rem}.pm-btn{min-width:38px;height:38px;font-size:.9rem}.pm-vrows{gap:18px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'pictogram-maker' }, css));
})();

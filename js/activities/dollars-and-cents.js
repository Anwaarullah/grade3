/* Dollars and cents — read, write and total money amounts with a decimal point (Unit 3.3).
 * All money is held in whole cents (integers) so there are no rounding errors.
 * Notes and coins are simple original drawings labelled with their value.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  var NOTES = [2000, 1000, 500, 200, 100];
  var COINS = [50, 25, 10, 5, 1];
  var ALL = NOTES.concat(COINS);

  /* ---------------- money helpers (integer cents) ---------------- */
  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }
  /** 2405 -> "$24.05" (always two places for cents). */
  function money(c) {
    return '$' + Math.floor(c / 100) + '.' + pad2(c % 100);
  }
  /** Name of one note or coin: 500 -> "$5", 25 -> "25c". */
  function valName(v) {
    return v >= 100 ? '$' + v / 100 : v + 'c';
  }
  function words(c) {
    var d = Math.floor(c / 100);
    var r = c % 100;
    return d + (d === 1 ? ' dollar ' : ' dollars ') + r + (r === 1 ? ' cent' : ' cents');
  }
  function sum(list) {
    return list.reduce(function (a, b) {
      return a + b;
    }, 0);
  }
  function sortDesc(list) {
    return list.slice().sort(function (a, b) {
      return b - a;
    });
  }
  function key(list) {
    return sortDesc(list).join(',');
  }
  /** Fewest notes and coins that make c cents, from the given denominations. */
  function greedy(c, denoms) {
    var out = [];
    (denoms || ALL).forEach(function (v) {
      while (c >= v) {
        out.push(v);
        c -= v;
      }
    });
    return c === 0 ? out : null;
  }
  /** A different way to make c cents (not equal to avoidKey). */
  function otherWay(c, avoidKey) {
    var tries = [
      ALL,
      [1000, 500, 100, 25, 10, 5, 1],
      [500, 200, 100, 50, 10, 5, 1],
      [2000, 500, 200, 100, 25, 10, 5, 1],
      [1000, 200, 100, 50, 25, 5, 1],
      [500, 100, 25, 10, 1],
      [200, 100, 10, 5, 1],
    ];
    for (var i = 0; i < tries.length; i++) {
      var w = greedy(c, tries[i]);
      if (w && key(w) !== avoidKey && w.length <= 24) return w;
    }
    return greedy(c, [100, 10, 5, 1]);
  }

  /**
   * Read what the child typed. Returns
   * { value (cents), form: 'dd' | 'd1' | 'whole' | 'cents', dollar, cent } or { bad: true } / { empty: true }.
   * '2.9' is form 'd1' (only one place for cents) and is never taken as $2.09.
   */
  function parseMoney(raw) {
    var s = String(raw == null ? '' : raw).trim().toLowerCase().replace(/\s+/g, '').replace(/,/g, '');
    if (!s) return { empty: true };
    var dollar = false;
    var cent = false;
    if (s.charAt(0) === '$') {
      dollar = true;
      s = s.slice(1);
    }
    if (s.slice(-1) === '$') {
      dollar = true;
      s = s.slice(0, -1);
    }
    var m = s.match(/^(.*?)(cents|cent|c|¢)$/);
    if (m) {
      cent = true;
      s = m[1];
    }
    if (/^\d+$/.test(s)) {
      var n = parseInt(s, 10);
      if (cent && !dollar) return { value: n, form: 'cents', dollar: dollar, cent: cent };
      return { value: n * 100, form: 'whole', dollar: dollar, cent: cent };
    }
    m = s.match(/^(\d*)\.(\d+)$/);
    if (m) {
      var d = m[1] ? parseInt(m[1], 10) : 0;
      if (m[2].length === 2) return { value: d * 100 + parseInt(m[2], 10), form: 'dd', dollar: dollar, cent: cent };
      if (m[2].length === 1) return { value: d * 100 + parseInt(m[2], 10) * 10, form: 'd1', dollar: dollar, cent: cent };
    }
    return { bad: true };
  }

  /* ---------------- drawings ---------------- */
  var NOTE_COL = {
    100: ['#e3f2dc', '#2f6b2f'],
    200: ['#fde9c6', '#8a5300'],
    500: ['#d9eafb', '#1d4f8a'],
    1000: ['#f9dbe2', '#8a2342'],
    2000: ['#e8def8', '#4b2c86'],
  };
  var COIN_R = { 1: 19, 5: 21, 10: 18, 25: 24, 50: 28 };

  /** An original note or coin drawing. scale 1 = note 100 wide. */
  function tokenSvg(v, scale) {
    scale = scale || 1;
    if (v >= 100) {
      var c = NOTE_COL[v];
      var n = String(v / 100);
      return S(
        'svg',
        { viewBox: '0 0 100 52', width: Math.round(100 * scale), height: Math.round(52 * scale), class: 'dc-svg', 'aria-hidden': 'true' },
        S('rect', { x: 1, y: 1, width: 98, height: 50, rx: 6, fill: c[0], stroke: c[1], 'stroke-width': 2 }),
        S('rect', { x: 6, y: 6, width: 88, height: 40, rx: 4, fill: 'none', stroke: c[1], 'stroke-width': 1, 'stroke-dasharray': '3 3', opacity: 0.55 }),
        S('ellipse', { cx: 50, cy: 26, rx: 25, ry: 16, fill: '#fff', opacity: 0.9 }),
        S('text', { x: 50, y: 34, 'text-anchor': 'middle', class: 'dc-note-t', fill: c[1] }, '$' + n),
        S('text', { x: 13, y: 19, 'text-anchor': 'middle', class: 'dc-note-s', fill: c[1] }, n),
        S('text', { x: 87, y: 42, 'text-anchor': 'middle', class: 'dc-note-s', fill: c[1] }, n)
      );
    }
    scale *= 1.25; // coins drawn a little larger so the labels are easy to read
    var r = COIN_R[v];
    var copper = v === 1;
    var size = 2 * r + 4;
    return S(
      'svg',
      { viewBox: '0 0 ' + size + ' ' + size, width: Math.round(size * scale), height: Math.round(size * scale), class: 'dc-svg', 'aria-hidden': 'true' },
      S('circle', { cx: r + 2, cy: r + 2, r: r, fill: copper ? '#eeb07a' : '#e6ebf1', stroke: copper ? '#a35f2b' : '#7d8a99', 'stroke-width': 2 }),
      S('circle', { cx: r + 2, cy: r + 2, r: r - 4, fill: 'none', stroke: copper ? '#a35f2b' : '#7d8a99', 'stroke-width': 1, opacity: 0.45 }),
      S('text', { x: r + 2, y: r + 2 + Math.max(12, r * 0.62) * 0.36, 'text-anchor': 'middle', class: 'dc-coin-t', 'font-size': Math.max(12, Math.round(r * 0.62)), fill: copper ? '#5a2e0c' : '#2f3b4a' }, v + 'c')
    );
  }
  function token(v, opts) {
    opts = opts || {};
    var t = el(opts.button ? 'button' : 'span', { class: 'dc-tok ' + (v >= 100 ? 'dc-note' : 'dc-coin') + (opts.cls ? ' ' + opts.cls : ''), 'data-v': v, type: opts.button ? 'button' : null, 'aria-label': valName(v) }, tokenSvg(v, opts.scale));
    return t;
  }

  /** Items in a row, biggest first, with the running count under each (notes in $, coins in c). */
  function countRow(items) {
    var row = el('div', { class: 'dc-count-row' });
    var dol = 0;
    var cen = 0;
    sortDesc(items).forEach(function (v) {
      var lab;
      if (v >= 100) {
        dol += v / 100;
        lab = '$' + dol;
      } else {
        cen += v;
        lab = cen + 'c';
      }
      row.appendChild(el('div', { class: 'dc-count-cell' }, token(v, { scale: 0.75 }), el('div', { class: 'dc-count-lab' + (v >= 100 ? ' dc-dol' : ' dc-cen') }, lab)));
    });
    return row;
  }
  /** "$8 and 91c = $8.91" */
  function joinLine(c) {
    var d = Math.floor(c / 100);
    var r = c % 100;
    return el('div', { class: 'dc-join-line' }, el('span', { class: 'dc-dol' }, '$' + d), ' and ', el('span', { class: 'dc-cen' }, r + 'c'), ' = ', el('b', null, money(c)));
  }

  /**
   * Drag an HTML element onto target elements (mouse or touch). Click also works.
   * With opts.delegate (a selector), src is a container bound once: any matching child can be
   * dragged or clicked, and onDrop(target, item) / onClick(item) receive that child.
   */
  function htmlDrag(api, src, opts) {
    var cur = src;
    var start = null;
    var ghost = null;
    var offX = 0;
    var offY = 0;
    var dragged = false;
    function hit(x, y) {
      var list = opts.targets();
      for (var i = 0; i < list.length; i++) {
        var r = list[i].getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return list[i];
      }
      return null;
    }
    function clearHover() {
      opts.targets().forEach(function (t) {
        t.classList.remove('dc-over');
      });
    }
    function unbind() {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
    }
    function dropGhost() {
      if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
      ghost = null;
      clearHover();
    }
    function down(e) {
      if (e.button) return;
      if (opts.enabled && !opts.enabled()) return;
      if (opts.delegate) {
        var it = e.target.closest ? e.target.closest(opts.delegate) : null;
        if (!it || !src.contains(it)) return;
        cur = it;
      }
      e.preventDefault();
      start = { x: e.clientX, y: e.clientY };
      dragged = false;
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', cancel);
    }
    function move(e) {
      if (!start) return;
      var dx = e.clientX - start.x;
      var dy = e.clientY - start.y;
      if (!ghost) {
        if (dx * dx + dy * dy < 36) return;
        var r = cur.getBoundingClientRect();
        offX = start.x - r.left;
        offY = start.y - r.top;
        ghost = cur.cloneNode(true);
        ghost.classList.add('dc-ghost');
        ghost.style.width = r.width + 'px';
        ghost.style.height = r.height + 'px';
        document.body.appendChild(ghost);
        cur.classList.add('dc-lifted');
      }
      ghost.style.left = e.clientX - offX + 'px';
      ghost.style.top = e.clientY - offY + 'px';
      clearHover();
      var t = hit(e.clientX, e.clientY);
      if (t) t.classList.add('dc-over');
    }
    function up(e) {
      unbind();
      var wasDrag = !!ghost;
      dropGhost();
      cur.classList.remove('dc-lifted');
      start = null;
      if (!wasDrag) return; // a plain click is handled by the click listener
      dragged = true;
      var t = hit(e.clientX, e.clientY);
      if (t && opts.onDrop) opts.onDrop(t, cur);
    }
    function cancel() {
      unbind();
      dropGhost();
      cur.classList.remove('dc-lifted');
      start = null;
    }
    function click(e) {
      if (dragged) {
        dragged = false;
        return;
      }
      if (opts.enabled && !opts.enabled()) return;
      var item = src;
      if (opts.delegate) {
        item = e.target.closest ? e.target.closest(opts.delegate) : null;
        if (!item || !src.contains(item)) return;
      }
      if (opts.onClick) opts.onClick(item);
    }
    if (!opts.delegate) src.style.touchAction = 'none';
    src.addEventListener('pointerdown', down);
    src.addEventListener('click', click);
    api.cleanup(function () {
      src.removeEventListener('pointerdown', down);
      src.removeEventListener('click', click);
      unbind();
      dropGhost();
    });
  }

  /** A $ answer box with a Check button. onSubmit(parsed, raw). */
  function moneyInput(onSubmit, opts) {
    opts = opts || {};
    var input = el('input', { class: 'num-input dc-in', type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-label': opts.label || 'Amount in dollars and cents', placeholder: '0.00' });
    var btn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    function go() {
      if (input.disabled) return;
      var p = parseMoney(input.value);
      if (p.empty || p.bad) {
        input.classList.add('shake');
        if (opts.api)
          opts.api.later(function () {
            input.classList.remove('shake');
          }, 400);
        if (opts.api) opts.api.feedback('Type an amount like 4.25', 'info');
        input.focus();
        return;
      }
      onSubmit(p, input.value);
    }
    btn.addEventListener('click', go);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        go();
      }
    });
    var row = el('div', { class: 'num-row' }, el('span', { class: 'num-prefix' }, '$'), input, btn);
    return {
      el: row,
      input: input,
      done: function (c) {
        input.value = Math.floor(c / 100) + '.' + pad2(c % 100);
        input.disabled = true;
        btn.disabled = true;
        input.classList.remove('bad');
        input.classList.add('good');
      },
      bad: function () {
        input.classList.add('bad');
      },
      focus: function () {
        try {
          input.focus({ preventScroll: true });
        } catch (e) {
          input.focus();
        }
      },
    };
  }

  /* ---------------- deck ---------------- */
  var deck = null;

  function buildDeck() {
    var used = {};
    function fresh(fn) {
      for (var i = 0; i < 200; i++) {
        var q = fn();
        var k = q.type + ':' + q.c + ':' + (q.items ? key(q.items) : '');
        if (!used[k]) {
          used[k] = true;
          return q;
        }
      }
      return fn();
    }
    function l1Cents(tens) {
      return tens ? U.rand(1, 9) * 10 : U.pick(U.range(11, 99).filter(function (n) { return n % 10 !== 0 && n % 11 !== 0; }));
    }
    var q = [];
    // Level 1: choose from 3 options (whole dollars 1-25, cents 10-99)
    var l1 = U.shuffle([
      { type: 'toDec', tens: false },
      { type: 'toWords', tens: true },
      { type: U.pick(['toDec', 'toWords']), tens: U.pick([true, false]) },
    ]);
    l1.forEach(function (s) {
      q.push(
        fresh(function () {
          var d = U.rand(1, 25);
          var r = l1Cents(s.tens);
          while (r === d) r = l1Cents(s.tens);
          return { type: s.type, c: d * 100 + r };
        })
      );
    });
    // Level 2: type the decimal form (tricky zeros) and total a purse
    var kinds = U.shuffle(['single', 'zero', 'nodollar']).slice(0, 2);
    function typed(kind) {
      return fresh(function () {
        if (kind === 'single') return { type: 'typeDec', kind: kind, c: U.rand(1, 25) * 100 + U.rand(1, 9) };
        if (kind === 'zero') return { type: 'typeDec', kind: kind, c: U.rand(2, 25) * 100 };
        return { type: 'typeDec', kind: kind, c: Math.random() < 0.7 ? U.rand(1, 9) * 10 : U.rand(11, 99) };
      });
    }
    q.push(typed(kinds[0]));
    q.push(fresh(makePurse));
    q.push(typed(kinds[1]));
    // Level 3: make a price two ways, then spot a mistake
    var price = U.rand(6, 29) * 100 + (Math.random() < 0.75 ? U.rand(1, 19) * 5 : U.rand(11, 99));
    var thing = U.pick(['school bag', 'lunch box', 'T-shirt', 'football', 'paint set', 'storybook']);
    q.push({ type: 'make', c: price, thing: thing });
    q.push({ type: 'make2', c: price, thing: thing });
    var dd = U.rand(2, 9);
    var cc = U.pick(U.range(1, 9).filter(function (n) { return n !== dd; }));
    q.push({ type: 'spot', c: dd * 100 + cc, d: dd, cc: cc });
    return q;
  }

  /** A purse worth under $10 with at least one run of equal coins to skip count. */
  function makePurse() {
    var items = [];
    var dollars = U.rand(1, 9);
    var left = dollars;
    while (left > 0) {
      var opts = [500, 200, 100].filter(function (v) {
        return v / 100 <= left;
      });
      var v = U.pick(opts);
      items.push(v);
      left -= v / 100;
    }
    var types = U.shuffle([50, 25, 10, 5, 1]).slice(0, U.rand(2, 3));
    var cents = 0;
    var gotRun = false;
    sortDesc(types).forEach(function (t) {
      var maxN = Math.floor((99 - cents) / t);
      if (maxN < 1) return;
      var n = Math.min(maxN, U.rand(gotRun ? 1 : 2, t === 50 ? 1 : 3));
      if (n >= 2) gotRun = true;
      for (var i = 0; i < n; i++) items.push(t);
      cents += n * t;
    });
    if (!gotRun) {
      // make sure there is something to skip count
      items = items.filter(function (x) {
        return x >= 100;
      });
      items.push(10, 10, 10, 5);
    }
    return { type: 'purse', items: U.shuffle(items), c: sum(items) };
  }

  /* ---------------- learn screens ---------------- */
  function learnJoin(stage, api) {
    api.say('This purse has 4 dollars and 24 cents. Let\'s write it the money way.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Dollars and cents', 'Notes are dollars ($). Coins are cents (c). 100c = $1.'));
    var purse = el('div', { class: 'dc-purse' });
    [200, 200, 10, 10, 1, 1, 1, 1].forEach(function (v) {
      purse.appendChild(token(v, { scale: 0.85 }));
    });
    stage.appendChild(purse);
    var line = el(
      'div',
      { class: 'dc-joiner' },
      el('span', { class: 'dc-j-dol dc-dol' }, '$4'),
      el('span', { class: 'dc-j-and' }, ' and '),
      el('span', { class: 'dc-j-pt' }, '.'),
      el('span', { class: 'dc-j-cen dc-cen' }, '24'),
      el('span', { class: 'dc-j-c dc-cen' }, 'c')
    );
    var labels = el('div', { class: 'dc-j-labels' }, el('span', { class: 'dc-dol' }, '◀ dollars'), el('span', null, 'point'), el('span', { class: 'dc-cen' }, 'cents ▶'));
    var btn = el('button', { class: 'btn', type: 'button' }, 'Join them with a point');
    stage.appendChild(line);
    stage.appendChild(labels);
    stage.appendChild(btn);
    btn.addEventListener('click', function () {
      btn.disabled = true;
      line.classList.add('dc-joined');
      api.sound('pop');
      api.later(function () {
        labels.classList.add('dc-show');
        api.say('$4.24! Dollars before the point, cents after it. No c needed.', 'cheer');
        api.feedback('$4 and 24c = $4.24', 'good');
        api.unlockNext();
      }, 700);
    });
  }

  function learnZero(stage, api) {
    api.say('Drag the 5c coin into the purse. Watch the cents!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Cents take two places', 'There are always two digits after the point.'));
    var purse = el('div', { class: 'dc-purse dc-drop' });
    [2000, 200, 200].forEach(function (v) {
      purse.appendChild(token(v, { scale: 0.85 }));
    });
    var coin = token(5, { button: true, cls: 'dc-grab', scale: 1.3 });
    var side = el('div', { class: 'dc-side' }, coin, el('div', { class: 'dc-small' }, 'drag me'));
    stage.appendChild(el('div', { class: 'dc-row' }, purse, side));
    var amount = el('div', { class: 'dc-amount' }, '$24.', el('span', { class: 'dc-cen' }, '00'));
    stage.appendChild(amount);
    var note = el('div', { class: 'dc-note-box', hidden: true });
    stage.appendChild(note);
    var done = false;
    function drop() {
      if (done) return;
      done = true;
      purse.appendChild(token(5, { scale: 0.85 }));
      side.style.visibility = 'hidden';
      api.sound('pop');
      MQ.clear(amount);
      amount.appendChild(document.createTextNode('$24.'));
      amount.appendChild(el('span', { class: 'dc-cen' }, el('span', { class: 'dc-flash' }, '0'), '5'));
      note.hidden = false;
      note.appendChild(el('div', null, '✓ ', el('b', null, '$24.05'), ' = 24 dollars and 5 cents. The 0 keeps the place.'));
      note.appendChild(el('div', { class: 'dc-wrong' }, '✗ $24.5 would mean 24 dollars and 50 cents!'));
      api.say('5 cents is .05 — the 0 holds the place. $24.05!', 'cheer');
      api.unlockNext();
    }
    htmlDrag(api, coin, {
      targets: function () {
        return [purse];
      },
      onDrop: drop,
      onClick: drop,
      enabled: function () {
        return !done;
      },
    });
  }

  function learnCount(stage, api) {
    api.say('Count coins by their value, not how many. Click the coins, biggest first.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Count on from the biggest coin', 'Click each coin to jump along the line.'));
    var coins = [25, 25, 25, 1];
    var row = el('div', { class: 'dc-purse dc-coins-click' });
    var btns = coins.map(function (v) {
      var b = token(v, { button: true, scale: 1.2 });
      row.appendChild(b);
      return b;
    });
    stage.appendChild(row);
    // number line 0..100 cents, to scale
    var W = 700;
    var X0 = 30;
    var K = 6.4;
    var LY = 120;
    function X(v) {
      return X0 + v * K;
    }
    var root = S('svg', { viewBox: '0 0 ' + W + ' 175', width: W, height: 175, class: 'dc-line' });
    root.appendChild(S('line', { x1: X(0), y1: LY, x2: X(100), y2: LY, class: 'dc-axis' }));
    var tickT = {};
    for (var t = 0; t <= 100; t += 5) {
      root.appendChild(S('line', { x1: X(t), y1: LY - (t % 25 ? 5 : 9), x2: X(t), y2: LY + (t % 25 ? 5 : 9), class: 'dc-tick' }));
      if (t % 25 === 0) {
        tickT[t] = S('text', { x: X(t), y: LY + 28, 'text-anchor': 'middle', class: 'dc-tick-t' }, t + 'c');
        root.appendChild(tickT[t]);
      }
    }
    var hopLayer = S('g');
    root.appendChild(hopLayer);
    stage.appendChild(el('div', { class: 'dc-line-wrap' }, root));
    var total = el('div', { class: 'dc-amount dc-amount-s' }, '0c');
    stage.appendChild(total);
    var at = 0;
    var n = 0;
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () {
        if (i !== n) {
          api.feedback(i < n ? 'Already counted that one.' : 'Start with the biggest coin on the left.', 'info');
          return;
        }
        var v = coins[i];
        var from = at;
        at += v;
        n++;
        b.disabled = true;
        b.classList.add('dc-used');
        api.sound('pop');
        var h = Math.min(70, 18 + (at - from) * 2);
        var mid = (X(from) + X(at)) / 2;
        hopLayer.appendChild(S('path', { d: 'M' + X(from) + ',' + LY + ' Q' + mid + ',' + (LY - h * 2) + ' ' + X(at) + ',' + LY, class: 'dc-hop' }));
        hopLayer.appendChild(S('text', { x: v < 5 ? X(at) + 14 : mid, y: v < 5 ? LY - 30 : LY - h - 6, 'text-anchor': 'middle', class: 'dc-hop-t' }, '+' + v + 'c'));
        hopLayer.appendChild(S('circle', { cx: X(at), cy: LY, r: 6, class: 'dc-dot' }));
        // Landing number: light up the tick label when we land on one; otherwise write it below the
        // tick labels so it never sits on the hops.
        if (tickT[at]) tickT[at].setAttribute('class', 'dc-tick-t dc-land-t');
        else hopLayer.appendChild(S('text', { x: X(at), y: LY + 52, 'text-anchor': 'middle', class: 'dc-land-t' }, at + 'c'));
        total.textContent = at + 'c';
        if (n === coins.length) {
          api.say('25, 50, 75, then 76. Three 25c coins are 75c, not 3c!', 'cheer');
          api.feedback('76c = $0.76', 'good');
          api.unlockNext();
        }
      });
    });
  }

  /* ---------------- practice ---------------- */
  function choiceQ(stage, api, q, prompt, options, correct, why) {
    stage.appendChild(MQ.ui.prompt(prompt));
    var cols = options.length === 4 ? 2 : 3;
    var ch = MQ.ui.choices(
      options.map(function (o) {
        return { label: o.label, value: o.label };
      }),
      function (v) {
        var o = options.filter(function (x) {
          return x.label === v;
        })[0];
        if (o.label === correct) {
          ch.mark(v, 'good');
          ch.disable();
          api.check(true, why);
        } else {
          ch.mark(v, 'bad');
          api.check(false, api.tries() >= 1 ? o.hint2 || o.hint : o.hint, o.tag);
        }
      },
      { columns: cols }
    );
    stage.appendChild(ch);
    var show = el('div', { class: 'dc-show-box', hidden: true });
    stage.appendChild(show);
    api.onReveal(function () {
      ch.mark(correct, 'good');
      ch.disable();
      show.hidden = false;
      show.appendChild(placeChart(q.c));
      api.feedback('The answer is ' + correct + '.', 'info');
    });
  }

  /** Dollars | point | cents chart for an amount. */
  function placeChart(c) {
    var d = Math.floor(c / 100);
    var r = c % 100;
    return el(
      'div',
      { class: 'dc-chart' },
      el('div', { class: 'dc-ch-col dc-ch-dol' }, el('div', { class: 'dc-ch-h' }, 'dollars'), el('div', { class: 'dc-ch-v' }, '$' + d)),
      el('div', { class: 'dc-ch-col' }, el('div', { class: 'dc-ch-h' }, ' '), el('div', { class: 'dc-ch-v' }, '.')),
      el('div', { class: 'dc-ch-col dc-ch-cen' }, el('div', { class: 'dc-ch-h' }, 'cents'), el('div', { class: 'dc-ch-v' }, pad2(r))),
      el('div', { class: 'dc-ch-words' }, words(c), ' = ', el('b', null, money(c)))
    );
  }

  function renderToDec(stage, api, q) {
    var d = Math.floor(q.c / 100);
    var r = q.c % 100;
    api.say('Which is the right way to write it?', 'think');
    var swapped = r * 100 + d;
    var opts = [{ label: money(q.c) }];
    opts.push({ label: money(swapped), hint: 'Dollars go first, before the point. Cents go after it.', hint2: 'The ' + d + ' is dollars, so it goes before the point: $' + d + '.', tag: 'Mixed up dollars and cents' });
    if (r % 10 === 0) opts.push({ label: '$' + d + '.0' + r / 10, hint: '.0' + r / 10 + ' means only ' + r / 10 + ' cents. We have ' + r + ' cents.', hint2: r + ' cents is .' + r + ' — two places after the point.', tag: 'Read .30 as 3 cents' });
    else opts.push({ label: money(q.c) + 'c', hint: 'With a $ sign we do not write c as well.', hint2: 'Use $ or c, never both. Pick the one with no c.', tag: 'Wrote both $ and c' });
    choiceQ(stage, api, q, 'Write <b>' + d + ' dollars and ' + r + ' cents</b> with a decimal point.', U.shuffle(opts), money(q.c), money(q.c) + '. Dollars before the point, cents after!');
  }

  function renderToWords(stage, api, q) {
    var d = Math.floor(q.c / 100);
    var r = q.c % 100;
    api.say('How many dollars and how many cents?', 'think');
    // Distractors in order of preference; the first two that differ from the answer (and each other) are used.
    var cands = [];
    if (r > 0) cands.push({ label: words(r * 100 + d), hint: 'The number before the point is the dollars.', hint2: 'Before the point: ' + d + '. So it is ' + d + (d === 1 ? ' dollar.' : ' dollars.'), tag: 'Mixed up dollars and cents' });
    if (r % 10 === 0) cands.push({ label: words(d * 100 + r / 10), hint: 'Look at both digits after the point: .' + pad2(r) + '.', hint2: '.' + pad2(r) + ' is ' + r + ' cents, not ' + r / 10 + '.', tag: 'Read .30 as 3 cents' });
    else {
      var swapped = (r % 10) * 10 + Math.floor(r / 10);
      cands.push({ label: words(d * 100 + swapped), hint: 'Read the two cent digits in order.', hint2: 'After the point it says ' + pad2(r) + ', so ' + r + ' cents.', tag: 'Mixed up dollars and cents' });
      cands.push({ label: words(d * 100 + (r % 10)), hint: 'Look at both digits after the point: .' + pad2(r) + '.', hint2: '.' + pad2(r) + ' is ' + r + ' cents, not ' + (r % 10) + '.', tag: 'Mixed up dollars and cents' });
    }
    cands.push({ label: words((d * 10 + Math.floor(r / 10)) * 100 + (r % 10)), hint: 'Only the number before the point is dollars.', hint2: 'Before the point: ' + d + '. After it: ' + pad2(r) + ' cents.', tag: 'Mixed up dollars and cents' });
    cands.push({ label: words(r), hint: 'There are dollars too! The number before the point is the dollars.', hint2: 'Before the point: ' + d + ' dollars. After it: ' + r + ' cents.', tag: 'Mixed up dollars and cents' });
    var opts = [{ label: words(q.c) }];
    var seen = {};
    seen[opts[0].label] = true;
    cands.forEach(function (o) {
      if (opts.length >= 3 || seen[o.label]) return;
      seen[o.label] = true;
      opts.push(o);
    });
    choiceQ(stage, api, q, 'What does <b>' + money(q.c) + '</b> mean?', U.shuffle(opts), words(q.c), money(q.c) + ' is ' + words(q.c) + '.');
  }

  function typedHint(q, p, strong) {
    var d = Math.floor(q.c / 100);
    var r = q.c % 100;
    if (p.dollar && p.cent) return ['With a $ sign we do not also write c. Just the $ and the number.', 'Wrote both $ and c'];
    if (p.form === 'd1') return [strong ? r + ' cents is .' + pad2(r) + '. Type ' + money(q.c).slice(1) + '.' : 'Cents always take two places after the point.', 'Missed the 0 in cents'];
    if (p.form === 'whole' || p.form === 'cents') {
      if (q.kind === 'zero' && p.value === q.c) return ['Nearly! Write the cents too: two zeros after the point.', 'Missed the 0 in cents'];
      return [strong ? 'Type ' + d + ', then a point, then two digits for the cents.' : 'Use a decimal point: dollars, then a point, then two digits for cents.', 'Did not use a decimal point'];
    }
    if (q.kind === 'single' && p.value === d * 100 + r * 10) return [strong ? r + ' cents is .0' + r + '. The 0 holds the place.' : 'That says ' + words(p.value) + '. We only have ' + r + ' cents.', 'Missed the 0 in cents'];
    if (q.kind === 'nodollar' && r % 10 === 0 && p.value === r / 10) return ['That says ' + r / 10 + ' cents. We have ' + r + ' cents.', 'Read .30 as 3 cents'];
    if (p.value === r * 100 + d) return ['Dollars go before the point, cents after it.', 'Mixed up dollars and cents'];
    if (q.kind === 'nodollar') return [strong ? 'No dollars, so start with 0, then the point: 0.' + pad2(r) : 'There are no dollars. What goes before the point?', 'Mixed up dollars and cents'];
    return [strong ? 'Start with ' + d + ', then the point, then ' + pad2(r) + '.' : 'Check: dollars before the point, two digits of cents after it.', 'Mixed up dollars and cents'];
  }

  function renderTypeDec(stage, api, q) {
    var d = Math.floor(q.c / 100);
    var r = q.c % 100;
    api.say(q.kind === 'zero' ? 'No cents at all! How do we write that?' : 'Careful with the cents!', 'think');
    var said = q.kind === 'zero' ? d + ' dollars and 0 cents' : q.kind === 'nodollar' ? '0 dollars and ' + r + ' cents' : d + ' dollars and ' + r + (r === 1 ? ' cent' : ' cents');
    stage.appendChild(MQ.ui.prompt('Write <b>' + said + '</b> with a decimal point.'));
    var show = el('div', { class: 'dc-show-box', hidden: true });
    var box = moneyInput(
      function (p) {
        if (p.value === q.c && p.form === 'dd' && !p.cent) {
          box.done(q.c);
          api.check(true, money(q.c) + ' — two places for cents!');
          return;
        }
        box.bad();
        var h = typedHint(q, p, api.tries() >= 1);
        api.check(false, h[0], h[1]);
      },
      { api: api }
    );
    stage.appendChild(box.el);
    stage.appendChild(show);
    box.focus();
    api.onReveal(function () {
      box.done(q.c);
      show.hidden = false;
      show.appendChild(placeChart(q.c));
      api.feedback('Dollars, then the point, then two places for cents: ' + money(q.c) + '.', 'info');
    });
  }

  function renderPurse(stage, api, q) {
    api.say('How much money is in the purse?', 'think');
    stage.appendChild(MQ.ui.prompt('How much money? Click each one as you count it.'));
    var purse = el('div', { class: 'dc-purse' });
    var counted = el('div', { class: 'dc-purse dc-counted' }, el('span', { class: 'dc-small dc-ph' }, 'counted'));
    q.items.forEach(function (v) {
      var t = token(v, { button: true, scale: 0.8 });
      t.addEventListener('click', function () {
        if (api.isAnswered()) return;
        var ph = counted.querySelector('.dc-ph');
        if (ph) ph.parentNode.removeChild(ph);
        counted.appendChild(t);
        t.disabled = true;
        api.sound('pop');
      });
      purse.appendChild(t);
    });
    stage.appendChild(el('div', { class: 'dc-two' }, purse, counted));
    var show = el('div', { class: 'dc-show-box', hidden: true });
    var coinsOnly = q.items.filter(function (v) {
      return v < 100;
    });
    var noteSum = sum(q.items) - sum(coinsOnly);
    var box = moneyInput(
      function (p) {
        if (p.cent && !p.dollar && (p.form === 'dd' || p.form === 'd1' || p.value >= 100)) {
          box.bad();
          api.feedback('With a $ amount we don\'t write c. Type it like ' + money(q.c).slice(1) + '.', 'info');
          return;
        }
        if (p.form === 'd1') {
          api.feedback('Cents take two places after the point, like 4.05 or 4.50.', 'info');
          return;
        }
        if (p.value === q.c && !(p.dollar && p.cent)) {
          box.done(q.c);
          api.check(true, money(q.c) + '. Great counting!');
          return;
        }
        box.bad();
        var strong = api.tries() >= 1;
        var gotD = Math.floor(p.value / 100) === noteSum / 100;
        var gotC = p.value % 100 === sum(coinsOnly);
        if (p.dollar && p.cent) api.check(false, 'With a $ sign we do not also write c.', 'Wrote both $ and c');
        else if (sum(coinsOnly) !== coinsOnly.length && (p.value % 100 === coinsOnly.length || p.value === q.items.length)) api.check(false, 'Count what each coin is worth, not how many coins. A 25c coin is 25c!', 'Counted coins not their value');
        else if (gotD && !gotC) api.check(false, strong ? 'Coins, biggest first: ' + sortDesc(coinsOnly).map(valName).join(' + ') + '. Count on.' : 'The dollars are right. Count the coins again, biggest first.', 'Miscounted the coins');
        else if (!gotD && gotC) api.check(false, strong ? 'Notes: ' + sortDesc(q.items.filter(function (v) { return v >= 100; })).map(valName).join(' + ') + '.' : 'The cents are right. Add up the notes again.', 'Miscounted the notes');
        else api.check(false, strong ? 'Notes first: $' + noteSum / 100 + '. Then coins: ' + sum(coinsOnly) + 'c.' : 'Add the notes for the dollars, then count on the coins for the cents.', 'Miscounted notes and coins');
      },
      { api: api }
    );
    stage.appendChild(box.el);
    stage.appendChild(show);
    api.onReveal(function () {
      box.done(q.c);
      show.hidden = false;
      show.appendChild(countRow(q.items));
      show.appendChild(joinLine(q.c));
      api.feedback('Notes first, then count on the coins from the biggest: ' + money(q.c) + '.', 'info');
    });
  }

  function renderMake(stage, api, q, second) {
    var first = second && deck[api.index - 1] && deck[api.index - 1].made ? deck[api.index - 1].made : null;
    if (second) {
      api.say(first ? 'Now pay the same price a different way!' : 'Pay this price a different way from before.', 'think');
      stage.appendChild(MQ.ui.prompt('Pay <b>' + money(q.c) + '</b> another way. Use different notes or coins.'));
    } else {
      api.say('Drag notes and coins to the tray to pay exactly. Click one in the tray to take it back.', 'think');
      stage.appendChild(MQ.ui.prompt('A ' + q.thing + ' costs <b>' + money(q.c) + '</b>. Pay exactly.'));
    }
    if (first) stage.appendChild(el('div', { class: 'dc-first' }, el('span', { class: 'dc-small' }, 'First way:'), first.map(function (v) { return token(v, { scale: 0.5 }); })));
    var bank = el('div', { class: 'dc-bank' });
    var tray = el('div', { class: 'dc-tray dc-drop' });
    var trayItems = el('div', { class: 'dc-tray-items' });
    var trayTotal = el('div', { class: 'dc-tray-total' });
    tray.appendChild(el('div', { class: 'dc-tray-head' }, el('span', null, 'Tray'), trayTotal));
    tray.appendChild(trayItems);
    var inTray = [];
    var locked = false;
    // One delegated drag/click binding for every token in the tray (tokens are redrawn often).
    function trayIndex(item) {
      return parseInt(item.getAttribute('data-i'), 10);
    }
    htmlDrag(api, trayItems, {
      delegate: '.dc-in-tray',
      targets: function () {
        return [bank];
      },
      enabled: function () {
        return !locked;
      },
      onDrop: function (t, item) {
        remove(trayIndex(item));
      },
      onClick: function (item) {
        remove(trayIndex(item));
      },
    });
    function draw() {
      MQ.clear(trayItems);
      if (!inTray.length) trayItems.appendChild(el('span', { class: 'dc-small dc-ph' }, 'Drag notes and coins here'));
      inTray = sortDesc(inTray);
      inTray.forEach(function (v, i) {
        var t = token(v, { button: true, scale: 0.72, cls: 'dc-in-tray' });
        t.setAttribute('data-i', String(i));
        t.style.touchAction = 'none';
        trayItems.appendChild(t);
      });
      trayTotal.textContent = money(sum(inTray));
    }
    function remove(i) {
      inTray.splice(i, 1);
      api.sound('click');
      draw();
    }
    function add(v) {
      if (inTray.length >= 30) {
        api.feedback('The tray is full. Take some out, or use bigger notes.', 'info');
        return;
      }
      inTray.push(v);
      api.sound('pop');
      draw();
    }
    var noteRow = el('div', { class: 'dc-bank-row' });
    var coinRow = el('div', { class: 'dc-bank-row' });
    ALL.forEach(function (v) {
      var t = token(v, { button: true, scale: v >= 100 ? 0.8 : 1, cls: 'dc-grab' });
      htmlDrag(api, t, {
        targets: function () {
          return [tray];
        },
        enabled: function () {
          return !locked;
        },
        onDrop: function () {
          add(v);
        },
        onClick: function () {
          add(v);
        },
      });
      (v >= 100 ? noteRow : coinRow).appendChild(t);
    });
    bank.appendChild(noteRow);
    bank.appendChild(coinRow);
    stage.appendChild(bank);
    stage.appendChild(tray);
    var payBtn = el('button', { class: 'btn btn-check', type: 'button' }, 'Pay');
    var clearBtn = el('button', { class: 'btn btn-ghost', type: 'button' }, 'Empty tray');
    stage.appendChild(el('div', { class: 'num-row' }, clearBtn, payBtn));
    var show = el('div', { class: 'dc-show-box', hidden: true });
    stage.appendChild(show);
    draw();
    clearBtn.addEventListener('click', function () {
      if (locked) return;
      inTray = [];
      draw();
    });
    function finish(list) {
      locked = true;
      payBtn.disabled = true;
      clearBtn.disabled = true;
      q.made = list.slice();
      tray.classList.add('dc-tray-ok');
    }
    payBtn.addEventListener('click', function () {
      if (locked) return;
      var t = sum(inTray);
      var strong = api.tries() >= 1;
      var d = Math.floor(q.c / 100);
      if (!inTray.length) {
        api.feedback('Drag some notes and coins into the tray first.', 'info');
        return;
      }
      if (t === q.c) {
        if (first && key(inTray) === key(first)) {
          api.check(false, strong ? 'Swap something: a $10 note is the same as two $5 notes, and 25c is 10c + 10c + 5c.' : 'That is the same way as before. Change at least one note or coin.', 'Used the same way twice');
          return;
        }
        finish(inTray);
        api.check(true, 'Exactly ' + money(q.c) + '!');
        return;
      }
      var listed = inTray.length === ALL.length && key(inTray) === key(ALL);
      var diff = Math.abs(t - q.c);
      var msg = t > q.c ? 'That is ' + money(t) + ' — ' + money(diff) + ' too much. Take something out.' : 'That is ' + money(t) + ' — ' + money(diff) + ' too little. Add some more.';
      if (strong) msg += ' Notes for the $' + d + ' first, then coins for the ' + (q.c % 100) + 'c.';
      api.check(false, listed ? 'One of each is not the price! Pick notes that make $' + d + ', then coins for ' + (q.c % 100) + 'c.' : msg, listed ? 'Listed note and coin values instead of making the price' : 'Made the wrong amount');
    });
    api.onReveal(function () {
      var way = first ? otherWay(q.c, key(first)) : greedy(q.c);
      inTray = way.slice();
      draw();
      finish(way);
      show.hidden = false;
      show.appendChild(countRow(way));
      show.appendChild(joinLine(q.c));
      api.feedback('Notes make the dollars, coins make the cents: ' + money(q.c) + '.', 'info');
    });
    stage.__q = q;
  }

  function renderSpot(stage, api, q) {
    api.say('Someone made a mistake. Can you fix it?', 'think');
    var wrongWritten = '$' + q.cc + '.' + q.d;
    var opts = [
      { label: money(q.c) },
      { label: '$' + q.d + '.' + q.cc, hint: '.' + q.cc + ' would mean ' + q.cc + '0 cents. We only have ' + q.cc + ' cents.', hint2: q.cc + ' cents needs a 0 in front: .0' + q.cc + '.', tag: 'Missed the 0 in cents' },
      { label: '$' + q.cc + '.0' + q.d, hint: 'There are ' + q.d + ' dollars. Dollars go before the point.', hint2: 'Start with $' + q.d + ', then the point.', tag: 'Mixed up dollars and cents' },
      { label: '$' + q.d + '.' + q.cc + '0', hint: 'That says ' + q.cc + '0 cents. We have ' + q.cc + ' cents.', hint2: q.cc + ' cents is .0' + q.cc + '.', tag: 'Missed the 0 in cents' },
    ];
    var wrap = el('div', { class: 'dc-spot' }, el('div', { class: 'dc-slate' }, el('div', null, q.d + ' dollars and ' + q.cc + (q.cc === 1 ? ' cent' : ' cents')), el('div', { class: 'dc-slate-w' }, '= ' + wrongWritten, el('span', { class: 'dc-x' }, ' ✗'))));
    stage.appendChild(wrap);
    choiceQ(stage, api, q, 'Sam wrote it like this. What should it be?', U.shuffle(opts), money(q.c), 'Yes! ' + money(q.c) + '. Sam swapped them and missed the 0.');
  }

  MQ.register('dollars-and-cents', {
    learn: [learnJoin, learnZero, learnCount],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0 || deck.length !== 9) deck = buildDeck();
        var q = deck[api.index];
        stage.__q = q;
        if (q.type === 'toDec') renderToDec(stage, api, q);
        else if (q.type === 'toWords') renderToWords(stage, api, q);
        else if (q.type === 'typeDec') renderTypeDec(stage, api, q);
        else if (q.type === 'purse') renderPurse(stage, api, q);
        else if (q.type === 'make') renderMake(stage, api, q, false);
        else if (q.type === 'make2') renderMake(stage, api, q, true);
        else renderSpot(stage, api, q);
      },
    },
  });

  // Used only by the test scripts (deck checks); not used by the page.
  MQ.activities['dollars-and-cents']._test = { parseMoney: parseMoney, money: money, greedy: greedy, otherWay: otherWay, buildDeck: buildDeck };

  var css = [
    '.dc-tok{display:inline-flex;align-items:center;justify-content:center;background:none;border:0;padding:2px;margin:0;line-height:0;border-radius:10px;user-select:none;-webkit-user-select:none}',
    'button.dc-tok{cursor:pointer}',
    'button.dc-tok:hover:not(:disabled){transform:translateY(-2px)}',
    'button.dc-tok:focus-visible{outline:3px solid var(--gold)}',
    'button.dc-tok:disabled{cursor:default}',
    '.dc-svg{display:block;max-width:100%;height:auto}',
    '.dc-note-t{font-size:22px;font-weight:800;font-family:var(--font)}',
    '.dc-note-s{font-size:11px;font-weight:800;font-family:var(--font)}',
    '.dc-coin-t{font-weight:800;font-family:var(--font)}',
    '.dc-ghost{position:fixed;z-index:1000;pointer-events:none;opacity:.9;filter:drop-shadow(0 6px 8px rgba(0,0,0,.25))}',
    '.dc-lifted{opacity:.45}',
    '.dc-dol{color:#1d4f8a}',
    '.dc-cen{color:#b4540a}',
    '.dc-purse{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;min-height:84px;padding:10px 14px;background:#fff8ec;border:3px solid #e8c48f;border-radius:22px;max-width:100%}',
    '.dc-drop.dc-over,.dc-tray.dc-over{border-color:var(--good);background:var(--good-bg)}',
    '.dc-row{display:flex;gap:18px;align-items:center;justify-content:center;flex-wrap:wrap}',
    '.dc-side{display:flex;flex-direction:column;align-items:center;gap:2px}',
    '.dc-grab{cursor:grab}',
    '.dc-small{font-size:.85rem;color:var(--ink-soft);font-weight:700}',
    '.dc-joiner{display:flex;align-items:baseline;font-size:3rem;font-weight:800;line-height:1.1}',
    '.dc-joiner span{display:inline-block;overflow:hidden;white-space:nowrap;transition:max-width .6s ease,opacity .6s ease}',
    '.dc-j-and,.dc-j-c{max-width:5em;color:var(--ink-soft)}',
    '.dc-j-pt{max-width:0;opacity:0;color:var(--ink)}',
    '.dc-joined .dc-j-and,.dc-joined .dc-j-c{max-width:0;opacity:0}',
    '.dc-joined .dc-j-pt{max-width:1em;opacity:1}',
    '.dc-j-labels{display:flex;gap:16px;font-weight:800;opacity:0;transition:opacity .4s}',
    '.dc-j-labels.dc-show{opacity:1}',
    '.dc-amount{font-size:2.6rem;font-weight:800}',
    '.dc-amount-s{font-size:1.8rem}',
    '.dc-flash{display:inline-block;background:#fff3cd;border-radius:8px;padding:0 4px;animation:dcPulse 1s ease 3}',
    '@keyframes dcPulse{50%{transform:scale(1.3)}}',
    '.dc-note-box{font-size:1.15rem;font-weight:700;text-align:center;display:flex;flex-direction:column;gap:4px}',
    '.dc-wrong{color:var(--try)}',
    '.dc-coins-click{gap:14px}',
    '.dc-used{opacity:.4}',
    '.dc-line-wrap{width:100%;display:flex;justify-content:center}',
    '.dc-line{max-width:100%;height:auto}',
    '.dc-axis{stroke:var(--ink);stroke-width:3}',
    '.dc-tick{stroke:var(--ink-soft);stroke-width:2}',
    '.dc-tick-t{font-size:15px;fill:var(--ink-soft);font-weight:700;font-family:var(--font)}',
    '.dc-hop{fill:none;stroke:#e07a1f;stroke-width:3}',
    '.dc-hop-t{font-size:15px;font-weight:800;fill:#b4540a;font-family:var(--font)}',
    '.dc-dot{fill:#e07a1f}',
    '.dc-land-t{font-size:18px;font-weight:800;fill:var(--ink);font-family:var(--font)}',
    '.dc-show-box{display:flex;flex-direction:column;align-items:center;gap:8px;max-width:100%}',
    '.dc-chart{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:center;gap:4px;background:var(--info-bg);border-radius:14px;padding:8px 14px}',
    '.dc-ch-col{text-align:center}',
    '.dc-ch-h{font-size:.85rem;font-weight:800;color:var(--ink-soft)}',
    '.dc-ch-v{font-size:2rem;font-weight:800;background:#fff;border-radius:10px;padding:0 10px;min-width:1em}',
    '.dc-ch-dol .dc-ch-v{color:#1d4f8a}',
    '.dc-ch-cen .dc-ch-v{color:#b4540a}',
    '.dc-ch-words{flex-basis:100%;text-align:center;font-weight:700;font-size:1.1rem}',
    '.dc-two{display:flex;gap:14px;align-items:stretch;justify-content:center;flex-wrap:wrap;width:100%}',
    '.dc-two .dc-purse{flex:1 1 300px}',
    '.dc-counted{background:#f3f8ff;border-color:var(--line);border-style:dashed}',
    '.dc-count-row{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-items:flex-end}',
    '.dc-count-cell{display:flex;flex-direction:column;align-items:center}',
    '.dc-count-lab{font-weight:800;font-size:1rem}',
    '.dc-join-line{font-size:1.4rem;font-weight:800}',
    '.dc-join-line b{color:#0b6e66}',
    '.dc-in{width:150px}',
    '.dc-bank{display:flex;flex-direction:column;gap:6px;align-items:center;max-width:100%}',
    '.dc-bank-row{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center}',
    '.dc-tray{width:100%;max-width:720px;border:3px dashed var(--line);border-radius:18px;padding:8px 12px;background:#fbfcff}',
    '.dc-tray-ok{border-style:solid;border-color:var(--good);background:var(--good-bg)}',
    '.dc-tray-head{display:flex;justify-content:space-between;font-weight:800;color:var(--ink-soft)}',
    '.dc-tray-total{font-size:1.4rem;color:var(--ink)}',
    '.dc-tray-items{display:flex;flex-wrap:wrap;gap:4px;align-items:center;min-height:64px}',
    '.dc-first{display:flex;flex-wrap:wrap;gap:3px;align-items:center;justify-content:center;opacity:.8}',
    '.dc-spot{display:flex;justify-content:center}',
    '.dc-slate{background:#2f4f46;color:#fff;border-radius:14px;padding:12px 24px;font-size:1.4rem;font-weight:800;text-align:center;border:6px solid #a77b4f}',
    '.dc-slate-w{font-size:2rem}',
    '.dc-x{color:#ffb4a2}',
    '@media (max-width:700px){.dc-joiner{font-size:2.3rem}.dc-amount{font-size:2rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'dollars-and-cents' }, css));
})();

/* School shop — add prices, find change by counting up, work backwards to a missing price,
 * and halve a price by sharing into two equal piles (Unit 3.3).
 * All money is held in whole cents (integers). Notes and coins are simple original drawings.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;

  /* ---------------- data ---------------- */
  var ITEMS = [
    { id: 'pencil', name: 'pencil', price: 18 },
    { id: 'eraser', name: 'eraser', price: 26 },
    { id: 'sharpener', name: 'sharpener', price: 30 },
    { id: 'felt', name: 'felt pen', price: 45 },
    { id: 'pen', name: 'pen', price: 65 },
    { id: 'highlighter', name: 'highlighter', price: 37 },
  ];
  var DRINKS = [
    { id: 'coffee', name: 'coffee', icon: '☕', price: 300 },
    { id: 'shake', name: 'milkshake', icon: '🥤', price: 325 },
    { id: 'tea', name: 'tea', icon: '🍵', price: 200 },
    { id: 'soda', name: 'soda', icon: '🥫', price: 110 },
    { id: 'oj', name: 'orange juice', icon: '🧃', price: 220 },
  ];
  var PAIRS = [
    { one: 'ice cream', many: 'ice creams', icon: '🍦' },
    { one: 'plant', many: 'plants', icon: '🪴' },
    { one: 'lunch box', many: 'lunch boxes', icon: '🍱' },
    { one: 'football', many: 'footballs', icon: '⚽' },
    { one: 'storybook', many: 'storybooks', icon: '📚' },
  ];
  var NAMES = ['Ali', 'Mia', 'Sam', 'Lily', 'Omar', 'Zara', 'Ben', 'Nina'];

  /* ---------------- money helpers (integer cents) ---------------- */
  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }
  function money(c) {
    return '$' + Math.floor(c / 100) + '.' + pad2(c % 100);
  }
  /** Cents-only amounts in the school shop are written 44c; anything else as $x.yy. */
  function amt(c, centsMode) {
    return centsMode ? c + 'c' : money(c);
  }
  function an(word) {
    return (/^[aeiou]/.test(word) ? 'an ' : 'a ') + word;
  }
  function sum(list) {
    return list.reduce(function (a, b) {
      return a + b;
    }, 0);
  }
  /** Column subtraction done wrongly: take the smaller digit from the bigger in each column. */
  function smallFromBig(a, b) {
    var out = 0;
    var p = 1;
    while (a > 0 || b > 0) {
      out += Math.abs((a % 10) - (b % 10)) * p;
      a = Math.floor(a / 10);
      b = Math.floor(b / 10);
      p *= 10;
    }
    return out;
  }
  /** Read a typed amount. centsMode: a plain number means cents. '2.9' (one place) is form 'd1'. */
  function parseMoney(raw, centsMode) {
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
      if ((cent || centsMode) && !dollar) return { value: n, form: 'cents' };
      return { value: n * 100, form: 'whole' };
    }
    m = s.match(/^(\d*)\.(\d+)$/);
    if (m) {
      var d = m[1] ? parseInt(m[1], 10) : 0;
      if (m[2].length === 2) return { value: d * 100 + parseInt(m[2], 10), form: 'dd' };
      if (m[2].length === 1) return { value: d * 100 + parseInt(m[2], 10) * 10, form: 'd1' };
    }
    return { bad: true };
  }
  /** Hops for counting up from a to b: to the next 10c, the next dollar, then whole dollars, tens, ones. */
  function countUpHops(a, b) {
    var hops = [];
    var at = a;
    function to(x) {
      if (x > at && x <= b) {
        hops.push([at, x]);
        at = x;
      }
    }
    to(Math.ceil(at / 10) * 10);
    if (b - at >= 100) to(Math.ceil(at / 100) * 100);
    to(Math.floor(b / 100) * 100);
    to(Math.floor(b / 10) * 10);
    to(b);
    return hops;
  }

  /* ---------------- drawings ---------------- */
  function itemIcon(id) {
    var parts;
    if (id === 'pencil')
      parts = [
        S('rect', { x: 10, y: 14, width: 50, height: 12, fill: '#fcc419' }),
        S('rect', { x: 3, y: 14, width: 9, height: 12, rx: 2, fill: '#f29bb0' }),
        S('rect', { x: 11, y: 14, width: 4, height: 12, fill: '#aab4c3' }),
        S('polygon', { points: '60,14 75,20 60,26', fill: '#f3d6a4' }),
        S('polygon', { points: '71,18.4 75,20 71,21.6', fill: '#333' }),
      ];
    else if (id === 'eraser')
      parts = [S('rect', { x: 14, y: 10, width: 52, height: 20, rx: 4, fill: '#ff8fab', stroke: '#c9406a', 'stroke-width': 1.5 }), S('rect', { x: 14, y: 10, width: 22, height: 20, rx: 3, fill: '#4dabf7', stroke: '#1d6fb8', 'stroke-width': 1.5 })];
    else if (id === 'sharpener')
      parts = [S('rect', { x: 24, y: 7, width: 32, height: 26, rx: 5, fill: '#b8c2cc', stroke: '#6b7785', 'stroke-width': 1.5 }), S('circle', { cx: 40, cy: 20, r: 7, fill: '#495057' }), S('rect', { x: 28, y: 9, width: 24, height: 4, rx: 2, fill: '#dee2e6' })];
    else if (id === 'felt')
      parts = [S('rect', { x: 8, y: 12, width: 48, height: 16, rx: 5, fill: '#2a9d55' }), S('rect', { x: 46, y: 10, width: 20, height: 20, rx: 5, fill: '#1f7a42' }), S('rect', { x: 10, y: 16, width: 30, height: 3, rx: 1.5, fill: '#8ce0ad' })];
    else if (id === 'pen')
      parts = [S('rect', { x: 6, y: 16, width: 56, height: 8, rx: 3, fill: '#3a86ff' }), S('rect', { x: 6, y: 13, width: 20, height: 14, rx: 4, fill: '#1d4f8a' }), S('rect', { x: 12, y: 10, width: 16, height: 3, rx: 1.5, fill: '#1d4f8a' }), S('polygon', { points: '62,16.5 74,20 62,23.5', fill: '#c9d1da' })];
    else parts = [S('rect', { x: 6, y: 11, width: 50, height: 18, rx: 5, fill: '#ffe066', stroke: '#c9a400', 'stroke-width': 1.5 }), S('polygon', { points: '56,14 70,17 70,23 56,26', fill: '#ffd43b', stroke: '#c9a400', 'stroke-width': 1.5 })];
    return S.apply(null, ['svg', { viewBox: '0 0 80 40', width: 80, height: 40, class: 'sc-icon', 'aria-hidden': 'true' }].concat(parts));
  }
  function itemCard(it, button) {
    return el(button ? 'button' : 'div', { class: 'sc-item', type: button ? 'button' : null, 'data-id': it.id }, itemIcon(it.id), el('span', { class: 'sc-item-name' }, it.name), el('span', { class: 'sc-tag' }, it.price + 'c'));
  }
  function drinkCard(d, button) {
    return el(button ? 'button' : 'div', { class: 'sc-item sc-drink', type: button ? 'button' : null, 'data-id': d.id }, el('span', { class: 'sc-emoji' }, d.icon), el('span', { class: 'sc-item-name' }, d.name), el('span', { class: 'sc-tag' }, money(d.price)));
  }
  function noteSvg(v, w) {
    var col = v >= 100 ? ['#e3f2dc', '#2f6b2f'] : null;
    if (col) {
      return S(
        'svg',
        { viewBox: '0 0 100 52', width: w, height: Math.round((w * 52) / 100), class: 'sc-svg', 'aria-hidden': 'true' },
        S('rect', { x: 1, y: 1, width: 98, height: 50, rx: 6, fill: col[0], stroke: col[1], 'stroke-width': 2 }),
        S('ellipse', { cx: 50, cy: 26, rx: 25, ry: 16, fill: '#fff' }),
        S('text', { x: 50, y: 34, 'text-anchor': 'middle', class: 'sc-note-t', fill: col[1] }, '$' + v / 100)
      );
    }
    return S(
      'svg',
      { viewBox: '0 0 44 44', width: w, height: w, class: 'sc-svg', 'aria-hidden': 'true' },
      S('circle', { cx: 22, cy: 22, r: 20, fill: '#e6ebf1', stroke: '#7d8a99', 'stroke-width': 2 }),
      S('text', { x: 22, y: 27, 'text-anchor': 'middle', class: 'sc-coin-t' }, v + 'c')
    );
  }

  /** Empty number line counting up from a to b (hops are labelled; not to scale). */
  function countUpLine(a, b, centsMode) {
    var hops = countUpHops(a, b);
    var W = 680;
    var X0 = 50;
    var avail = W - 2 * X0;
    var minW = 110;
    var n = hops.length;
    var spare = Math.max(0, avail - minW * n);
    var xs = [X0];
    hops.forEach(function (h) {
      xs.push(xs[xs.length - 1] + minW + (spare * (h[1] - h[0])) / (b - a));
    });
    var LY = 96;
    var root = S('svg', { viewBox: '0 0 ' + W + ' 140', width: W, height: 140, class: 'sc-line' });
    root.appendChild(S('line', { x1: X0 - 20, y1: LY, x2: xs[n] + 20, y2: LY, class: 'sc-axis' }));
    function tick(x, v, start) {
      root.appendChild(S('line', { x1: x, y1: LY - 8, x2: x, y2: LY + 8, class: 'sc-tick' }));
      root.appendChild(S('text', { x: x, y: LY + 30, 'text-anchor': 'middle', class: 'sc-tick-t' + (start ? ' sc-start' : '') }, amt(v, centsMode)));
    }
    tick(xs[0], a, true);
    hops.forEach(function (h, i) {
      var x1 = xs[i];
      var x2 = xs[i + 1];
      var mid = (x1 + x2) / 2;
      root.appendChild(S('path', { d: 'M' + x1 + ',' + LY + ' Q' + mid + ',' + (LY - 90) + ' ' + x2 + ',' + LY, class: 'sc-hop' }));
      var d = h[1] - h[0];
      root.appendChild(S('text', { x: mid, y: LY - 52, 'text-anchor': 'middle', class: 'sc-hop-t' }, '+' + (d < 100 ? d + 'c' : money(d))));
      tick(x2, h[1], false);
    });
    var parts = hops.map(function (h) {
      return h[1] - h[0];
    });
    var line = el('div', { class: 'sc-line-wrap' }, root);
    var words = el(
      'div',
      { class: 'sc-sumline' },
      parts
        .map(function (p) {
          return p < 100 ? p + 'c' : money(p);
        })
        .join(' + ') + ' = ',
      el('b', null, amt(b - a, centsMode && b - a < 100))
    );
    return el('div', { class: 'sc-countup' }, line, words);
  }

  /** "18c + 26c = 44c" as chips. */
  function chips(parts, total, centsMode, op) {
    var row = el('div', { class: 'sum-row' });
    parts.forEach(function (p, i) {
      if (i) row.appendChild(el('span', { class: 'sum-op' }, op || '+'));
      row.appendChild(el('span', { class: 'chip' }, amt(p, centsMode)));
    });
    row.appendChild(el('span', { class: 'sum-op' }, '='));
    row.appendChild(el('span', { class: 'chip chip-total' }, amt(total, centsMode)));
    return row;
  }

  /** Bar model. whole = {label, value|null}; parts = [{label, value|null}]. */
  function barModel(whole, parts) {
    var total = whole.value != null ? whole.value : sum(parts.map(function (p) { return p.value || 0; }));
    function txt(p) {
      return el('span', { class: 'sc-bar-txt' }, el('small', null, p.label), p.value == null ? el('b', { class: 'sc-q' }, '?') : el('b', null, money(p.value)));
    }
    var top = el('div', { class: 'sc-bar sc-bar-whole' }, txt(whole));
    var bottom = el('div', { class: 'sc-bar sc-bar-parts' });
    var segs = parts.map(function (p, i) {
      var share = p.value != null ? p.value / total : 1 - parts.reduce(function (a, q) { return a + (q.value != null ? q.value / total : 0); }, 0);
      share = Math.max(0.28, Math.min(0.72, share));
      var s = el('div', { class: 'sc-seg sc-seg-' + i, style: { flex: share + ' 1 0' } }, txt(p));
      bottom.appendChild(s);
      return s;
    });
    var box = el('div', { class: 'sc-barbox' }, top, bottom);
    box.fill = function (i, value) {
      var p = parts[i] || whole;
      p.value = value;
      var target = i === -1 ? top : segs[i];
      MQ.clear(target);
      target.appendChild(txt(p));
      target.classList.add('sc-filled');
    };
    return box;
  }

  /** A row of money answer fields plus one Check button. fields: [{label, centsMode}] */
  function answerRows(fields, onCheck) {
    var wrap = el('div', { class: 'sc-answers' });
    var inputs = fields.map(function (f) {
      var input = el('input', { class: 'num-input sc-in', type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-label': f.label, placeholder: f.centsMode ? '?' : '0.00' });
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          go();
        }
      });
      wrap.appendChild(el('label', { class: 'sc-field' }, el('span', { class: 'sc-field-l' }, f.label), f.centsMode ? null : el('span', { class: 'num-prefix' }, '$'), input, f.centsMode ? el('span', { class: 'num-unit' }, 'c') : null));
      return input;
    });
    var btn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    wrap.appendChild(btn);
    function go() {
      if (btn.disabled) return;
      onCheck(
        inputs.map(function (inp, i) {
          return parseMoney(inp.value, fields[i].centsMode);
        })
      );
    }
    btn.addEventListener('click', go);
    wrap.inputs = inputs;
    wrap.set = function (vals) {
      vals.forEach(function (v, i) {
        inputs[i].value = fields[i].centsMode ? String(v) : Math.floor(v / 100) + '.' + pad2(v % 100);
        inputs[i].classList.remove('bad');
        inputs[i].classList.add('good');
      });
    };
    wrap.mark = function (i, ok) {
      inputs[i].classList.remove('good', 'bad');
      inputs[i].classList.add(ok ? 'good' : 'bad');
    };
    wrap.lock = function () {
      inputs.forEach(function (inp) {
        inp.disabled = true;
      });
      btn.disabled = true;
    };
    wrap.focus = function () {
      try {
        inputs[0].focus({ preventScroll: true });
      } catch (e) {
        inputs[0].focus();
      }
    };
    return wrap;
  }

  /**
   * Share $N into two equal piles. $1 notes are dealt one at a time; an odd last $1
   * is changed into ten 10c coins, which are shared too.
   */
  function shareWidget(api, dollars, onDone) {
    var source = [];
    for (var i = 0; i < dollars; i++) source.push(100);
    var piles = [[], []];
    var finished = false;
    var srcEl = el('div', { class: 'sc-src' });
    var pileEls = [0, 1].map(function (k) {
      var items = el('div', { class: 'sc-pile-items' });
      var tot = el('div', { class: 'sc-pile-tot' }, '$0.00');
      var p = el('div', { class: 'sc-pile' }, el('div', { class: 'sc-pile-h' }, 'Pile ' + (k + 1)), items, tot);
      p.items = items;
      p.tot = tot;
      return p;
    });
    var swapBtn = el('button', { class: 'btn btn-ghost sc-swap', type: 'button', hidden: true }, 'Change $1 into ten 10c coins');
    var dealBtn = el('button', { class: 'btn sc-deal', type: 'button' }, 'Share one ▶');
    var box = el('div', { class: 'sc-share' }, el('div', { class: 'sc-src-wrap' }, srcEl, el('div', { class: 'sc-share-btns' }, dealBtn, swapBtn)), el('div', { class: 'sc-piles' }, pileEls[0], pileEls[1]));
    function draw() {
      MQ.clear(srcEl);
      if (!source.length) srcEl.appendChild(el('span', { class: 'sc-small' }, 'All shared!'));
      source.forEach(function (v) {
        var b = el('button', { class: 'sc-money', type: 'button', 'data-v': v, 'aria-label': v >= 100 ? '$1' : v + 'c' }, noteSvg(v, v >= 100 ? 64 : 34));
        b.addEventListener('click', deal);
        srcEl.appendChild(b);
      });
      pileEls.forEach(function (p, k) {
        MQ.clear(p.items);
        piles[k].forEach(function (v) {
          p.items.appendChild(el('span', { class: 'sc-money' }, noteSvg(v, v >= 100 ? 52 : 28)));
        });
        p.tot.textContent = money(sum(piles[k]));
      });
      var oneLeft = source.length === 1 && source[0] === 100;
      swapBtn.hidden = !oneLeft;
      dealBtn.disabled = !source.length || oneLeft;
    }
    function deal() {
      if (finished || !source.length) return;
      if (source.length === 1 && source[0] === 100) {
        api.feedback('Only one $1 left. We can\'t tear it! Change it into coins.', 'info');
        swapBtn.classList.add('sc-pulse');
        return;
      }
      var v = source.shift();
      var k = sum(piles[0]) <= sum(piles[1]) ? 0 : 1;
      piles[k].push(v);
      api.sound('pop');
      draw();
      if (!source.length) {
        finished = true;
        dealBtn.disabled = true;
        if (onDone) onDone(sum(piles[0]));
      }
    }
    function swap() {
      if (!(source.length === 1 && source[0] === 100)) return;
      source = [10, 10, 10, 10, 10, 10, 10, 10, 10, 10];
      api.sound('click');
      draw();
    }
    dealBtn.addEventListener('click', deal);
    swapBtn.addEventListener('click', swap);
    draw();
    box.dealAll = function () {
      while (source.length) {
        if (source.length === 1 && source[0] === 100) swap();
        deal();
      }
    };
    return box;
  }

  /* ---------------- learn screens ---------------- */
  function learnBasket(stage, api) {
    api.say('Welcome to the school shop! Click two things to put in your basket.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Adding prices', 'The till adds the prices together.'));
    var shelf = el('div', { class: 'sc-shelf' });
    var basket = el('div', { class: 'sc-basket' }, el('span', { class: 'sc-small' }, '🧺 Basket'));
    var till = el('div', { class: 'sc-till' });
    var picked = [];
    ITEMS.forEach(function (it) {
      var c = itemCard(it, true);
      c.addEventListener('click', function () {
        if (picked.length >= 2 || c.disabled) return;
        picked.push(it);
        c.disabled = true;
        c.classList.add('sc-picked');
        basket.appendChild(itemCard(it, false));
        api.sound('pop');
        if (picked.length === 2) {
          var a = picked[0].price;
          var b = picked[1].price;
          till.appendChild(chips([a, b], a + b, true));
          api.say('The till says ' + a + 'c + ' + b + 'c = ' + (a + b) + 'c. That is what you spend.', 'cheer');
          api.unlockNext();
        }
      });
      shelf.appendChild(c);
    });
    stage.appendChild(shelf);
    stage.appendChild(basket);
    stage.appendChild(till);
  }

  function learnCountUp(stage, api) {
    api.say('A pencil and an eraser cost 44c. You pay 50c. Count up to find the change.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Change: count up', 'From the price, count up to the money you paid.'));
    stage.appendChild(el('div', { class: 'sc-row' }, itemCard(ITEMS[0]), itemCard(ITEMS[1]), el('span', { class: 'sc-big' }, '= 44c'), el('span', { class: 'sc-paid' }, 'Paid ', noteSvg(50, 46))));
    var A = 44;
    var B = 50;
    var W = 640;
    var X0 = 40;
    var K = (W - 2 * X0) / (B - A + 2);
    function X(v) {
      return X0 + (v - A + 1) * K;
    }
    var LY = 90;
    var root = S('svg', { viewBox: '0 0 ' + W + ' 130', width: W, height: 130, class: 'sc-line' });
    root.appendChild(S('line', { x1: X0, y1: LY, x2: W - X0, y2: LY, class: 'sc-axis' }));
    for (var v = A; v <= B; v++) {
      root.appendChild(S('line', { x1: X(v), y1: LY - 8, x2: X(v), y2: LY + 8, class: 'sc-tick' }));
      root.appendChild(S('text', { x: X(v), y: LY + 30, 'text-anchor': 'middle', class: 'sc-tick-t' + (v === A || v === B ? ' sc-start' : '') }, v + 'c'));
    }
    var hops = S('g');
    root.appendChild(hops);
    stage.appendChild(el('div', { class: 'sc-line-wrap' }, root));
    var counter = el('div', { class: 'sc-big' }, 'Change: 0c');
    var btn = el('button', { class: 'btn', type: 'button' }, 'Jump +1c');
    stage.appendChild(el('div', { class: 'sc-row' }, btn, counter));
    var at = A;
    btn.addEventListener('click', function () {
      if (at >= B) return;
      var mid = (X(at) + X(at + 1)) / 2;
      hops.appendChild(S('path', { d: 'M' + X(at) + ',' + LY + ' Q' + mid + ',' + (LY - 60) + ' ' + X(at + 1) + ',' + LY, class: 'sc-hop' }));
      at++;
      api.sound('pop');
      counter.textContent = 'Change: ' + (at - A) + 'c';
      if (at === B) {
        btn.disabled = true;
        stage.appendChild(chips([50, 44], 6, true, '−'));
        api.say('6 jumps! 44c + 6c = 50c, so the change is 6c. And 50c − 44c = 6c.', 'cheer');
        api.unlockNext();
      }
    });
  }

  function learnBar(stage, api) {
    api.say('Ben paid with $50. He got $17 change. What did the trainers cost?');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Find the missing price', 'Money paid = cost + change.'));
    var bar = barModel({ label: 'Paid', value: 5000 }, [{ label: 'Cost', value: null }, { label: 'Change', value: 1700 }]);
    stage.appendChild(bar);
    var show = el('div', { class: 'sc-show' });
    var rows = answerRows([{ label: 'Cost' }], function (ps) {
      var p = ps[0];
      if (p.empty || p.bad) return api.feedback('Type an amount, like 25 or 25.00', 'info');
      if (p.value === 3300) {
        rows.set([3300]);
        rows.lock();
        bar.fill(0, 3300);
        show.appendChild(countUpLine(1700, 5000, false));
        api.say('Yes! Count up from $17 to $50: $3, then $30. The trainers cost $33.00.', 'cheer');
        api.feedback('$50.00 − $17.00 = $33.00', 'good');
        api.unlockNext();
      } else if (p.value === 6700) {
        rows.mark(0, false);
        api.feedback('That adds them. The cost is a part of the $50, so it must be less than $50.', 'try');
      } else {
        rows.mark(0, false);
        api.feedback('Count up from $17 to $50. $17 → $20 → $50.', 'try');
      }
    });
    stage.appendChild(rows);
    stage.appendChild(show);
  }

  function learnShare(stage, api) {
    api.say('Two lunch boxes cost $7. Share the $7 into two equal piles to find one.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Half: share into two piles', 'Click <b>Share one</b> again and again. What about the last $1?'));
    var w = shareWidget(api, 7, function (each) {
      api.say('Each pile has $3 and 50c. One lunch box costs ' + money(each) + '!', 'cheer');
      api.feedback('$3.50 + $3.50 = $7.00', 'good');
      api.unlockNext();
    });
    stage.appendChild(w);
  }

  /* ---------------- deck ---------------- */
  var deck = null;

  function buildDeck() {
    var q = [];
    // Level 1: two shop items, find spend and change (cents only)
    var pairs = [];
    for (var i = 0; i < ITEMS.length; i++) {
      for (var j = i; j < ITEMS.length; j++) {
        var t = ITEMS[i].price + ITEMS[j].price;
        var monies = [50, 75, 90].filter(function (m) {
          return m > t;
        });
        if (monies.length) pairs.push({ a: ITEMS[i], b: ITEMS[j], total: t, monies: monies });
      }
    }
    U.shuffle(pairs)
      .slice(0, 4)
      .forEach(function (p) {
        var m = U.pick(p.monies);
        q.push({ type: 'spend', items: [p.a.id, p.b.id], prices: [p.a.price, p.b.price], total: p.total, paid: m, change: m - p.total, cents: true });
      });
    // Level 2: drinks menu
    var three = U.shuffle(DRINKS).slice(0, 3);
    var t3 = sum(three.map(function (d) { return d.price; }));
    q.push({ type: 'spend', drinks: three.map(function (d) { return d.id; }), prices: three.map(function (d) { return d.price; }), total: t3, paid: 1000, change: 1000 - t3 });
    var two;
    do {
      two = U.shuffle(DRINKS).slice(0, 2);
    } while (sum(two.map(function (d) { return d.price; })) >= 500);
    var t2 = sum(two.map(function (d) { return d.price; }));
    q.push({ type: 'spend', drinks: two.map(function (d) { return d.id; }), prices: two.map(function (d) { return d.price; }), total: t2, paid: 500, change: 500 - t2 });
    q.push({ type: 'choose', budget: U.pick([400, 500]) });
    // Level 3: missing price, halving, then work backwards
    q.push(makeMissing());
    var odd = Math.random() < 0.6;
    var dollars = odd ? U.pick([5, 7, 9, 11]) : U.pick([6, 8, 10, 12]);
    q.push({ type: 'half', total: dollars * 100, each: dollars * 50, thing: U.pick(PAIRS), who: U.pick(NAMES) });
    if (Math.random() < 0.5) {
      var spent = U.rand(10, 70) * 100 + U.rand(1, 19) * 5;
      var left = U.rand(0, 9) * 100 + U.rand(1, 19) * 5;
      q.push({ type: 'before', spent: spent, left: left, start: spent + left, who: U.pick(NAMES) });
    } else {
      var had = U.pick([70, 75, 80, 90]);
      q.push({ type: 'which', had: had, change: had - 63, total: 63, who: U.pick(NAMES) });
    }
    return q;
  }

  function makeMissing() {
    var kind = U.pick(['whole', 'cents', 'zero']);
    var paid;
    var cost;
    var thing;
    if (kind === 'whole') {
      paid = U.pick([2000, 5000]);
      cost = paid === 2000 ? U.rand(6, 18) * 100 : U.rand(12, 45) * 100;
      thing = U.pick(['trainers', 'a jacket', 'a school bag', 'a bike helmet']);
    } else if (kind === 'cents') {
      paid = U.rand(4, 9) * 100 + U.rand(1, 9) * 10;
      cost = U.rand(2, Math.floor(paid / 100) - 1) * 100 + U.rand(1, 19) * 5;
      thing = U.pick(['a comic', 'a puzzle', 'a sandwich', 'a pack of stickers']);
    } else {
      paid = U.pick([1000, 2000, 3000]);
      cost = paid - (U.rand(1, 3) * 100 + U.rand(1, 9));
      thing = U.pick(['a toy car', 'a board game', 'a kite']);
    }
    return { type: 'missing', kind: kind, paid: paid, cost: cost, change: paid - cost, thing: thing, who: U.pick(NAMES) };
  }

  /* ---------------- practice ---------------- */
  function changeHint(q, got, strong, cm) {
    if (got === q.total) return ['That is what was spent. Now find the change: count up from ' + amt(q.total, cm) + ' to ' + amt(q.paid, cm) + '.', 'Found the total but not the change'];
    var wrongWay = smallFromBig(q.paid, q.total);
    if (got === wrongWay && wrongWay !== q.change) return ['Careful: you can\'t take a bigger digit from a smaller one. Count up from ' + amt(q.total, cm) + ' to ' + amt(q.paid, cm) + ' instead.', 'Subtracted the wrong way round'];
    if (got === q.paid + q.total) return ['Change is what comes back, so take away: ' + amt(q.paid, cm) + ' − ' + amt(q.total, cm) + '.', 'Added instead of subtracting'];
    if (strong) {
      var h = countUpHops(q.total, q.paid)
        .map(function (x) {
          return amt(x[1], cm && x[1] < 100);
        })
        .join(' → ');
      return ['Count up: ' + amt(q.total, cm) + ' → ' + h + '. Add the jumps.', 'Found the change wrongly'];
    }
    return ['Count up from ' + amt(q.total, cm) + ' to ' + amt(q.paid, cm) + '.', 'Found the change wrongly'];
  }

  function renderSpend(stage, api, q) {
    var cm = !!q.cents;
    var names;
    if (q.items) {
      var its = q.items.map(function (id) {
        return ITEMS.filter(function (x) { return x.id === id; })[0];
      });
      names = its.map(function (x) { return x.name; });
      api.say('Find what you spend, then the change.', 'think');
      stage.appendChild(MQ.ui.prompt('You buy ' + (names[0] === names[1] ? 'two ' + names[0] + 's' : an(names[0]) + ' and ' + an(names[1])) + '. You pay <b>' + q.paid + 'c</b>.'));
      stage.appendChild(el('div', { class: 'sc-row' }, its.map(function (x) { return itemCard(x); }), el('span', { class: 'sc-paid' }, 'Paid ', el('b', null, q.paid + 'c'))));
    } else {
      var ds = q.drinks.map(function (id) {
        return DRINKS.filter(function (x) { return x.id === id; })[0];
      });
      names = ds.map(function (x) { return x.name; });
      api.say('Add the drinks, then find the change.', 'think');
      stage.appendChild(MQ.ui.prompt('Buy ' + names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] + '. Pay with <b>' + money(q.paid) + '</b>.'));
      stage.appendChild(el('div', { class: 'sc-row' }, ds.map(function (x) { return drinkCard(x); }), el('span', { class: 'sc-paid' }, 'Paid ', noteSvg(q.paid, 70))));
    }
    var show = el('div', { class: 'sc-show' });
    var rows = answerRows([{ label: 'Spent', centsMode: cm }, { label: 'Change', centsMode: cm }], function (ps) {
      if (ps[0].empty) return api.feedback('First find what you spend: add the prices.', 'info');
      if (ps.some(function (p) { return p.form === 'd1'; })) return api.feedback('Cents take two places after the point, like 2.65 or 2.05.', 'info');
      if (ps.some(function (p) { return p.bad; })) return api.feedback('Type amounts like ' + (cm ? '44' : '4.35') + '.', 'info');
      var strong = api.tries() >= 1;
      var s = ps[0].value;
      if (s !== q.total) {
        rows.mark(0, false);
        var h = strong ? 'Add the prices: ' + q.prices.map(function (p) { return amt(p, cm); }).join(' + ') + '. ' + (cm ? 'Tens first, then ones.' : 'Dollars first, then cents.') : 'Check what you spend: add all the prices.';
        if (!cm && ps[0].form === 'cents') h = 'Mixed up dollars and cents? Write it like 4.35.';
        api.check(false, h, !cm && ps[0].form === 'cents' ? 'Mixed dollars and cents' : 'Added the prices wrongly');
        return;
      }
      rows.mark(0, true);
      if (ps[1].empty) {
        rows.mark(1, false);
        api.check(false, 'Good adding! Now the change: count up from ' + amt(q.total, cm) + ' to ' + amt(q.paid, cm) + '.', 'Found the total but not the change');
        return;
      }
      if (ps[1].bad) return api.feedback('Type the change.', 'info');
      if (ps[1].value !== q.change) {
        rows.mark(1, false);
        var hc = changeHint(q, ps[1].value, strong, cm);
        api.check(false, hc[0], hc[1]);
        return;
      }
      rows.set([q.total, q.change]);
      rows.lock();
      show.appendChild(countUpLine(q.total, q.paid, cm));
      api.check(true, 'Spent ' + amt(q.total, cm) + ', change ' + amt(q.change, cm) + '!');
    });
    stage.appendChild(rows);
    stage.appendChild(show);
    rows.focus();
    api.onReveal(function () {
      rows.set([q.total, q.change]);
      rows.lock();
      show.appendChild(chips(q.prices, q.total, cm));
      show.appendChild(countUpLine(q.total, q.paid, cm));
      api.feedback('Add to find what you spend, then count up to what you paid for the change.', 'info');
    });
  }

  function renderChoose(stage, api, q) {
    api.say('Pick two different drinks. Don\'t spend more than you have!', 'think');
    stage.appendChild(MQ.ui.prompt('You have <b>' + money(q.budget) + '</b>. Pick two different drinks you can buy. Then find your change.'));
    var menu = el('div', { class: 'sc-shelf' });
    var chosen = [];
    var locked = false;
    var cards = DRINKS.map(function (d) {
      var c = drinkCard(d, true);
      c.addEventListener('click', function () {
        if (locked) return;
        var i = chosen.indexOf(d);
        if (i >= 0) chosen.splice(i, 1);
        else {
          if (chosen.length >= 2) chosen.shift();
          chosen.push(d);
        }
        api.sound('click');
        drawSel();
      });
      menu.appendChild(c);
      return c;
    });
    var sel = el('div', { class: 'sc-sel' });
    function drawSel() {
      cards.forEach(function (c, k) {
        c.classList.toggle('sc-picked', chosen.indexOf(DRINKS[k]) >= 0);
      });
      sel.textContent = chosen.length ? 'You picked: ' + chosen.map(function (d) { return d.name + ' ' + money(d.price); }).join(' + ') : 'Click two drinks.';
    }
    drawSel();
    stage.appendChild(menu);
    stage.appendChild(sel);
    var show = el('div', { class: 'sc-show' });
    var rows = answerRows([{ label: 'Change' }], function (ps) {
      if (chosen.length !== 2) return api.feedback('Pick two drinks first.', 'info');
      var p = ps[0];
      if (p.empty || p.bad) return api.feedback('Type your change, like 1.90', 'info');
      if (p.form === 'd1') return api.feedback('Cents take two places after the point, like 1.90 or 1.09.', 'info');
      var t = chosen[0].price + chosen[1].price;
      var qq = { total: t, paid: q.budget, change: q.budget - t };
      if (t > q.budget) {
        api.check(false, 'Those cost ' + money(t) + ' together. That is more than ' + money(q.budget) + '. Swap one for a cheaper drink.', 'Spent more than the money');
        return;
      }
      if (p.value !== qq.change) {
        rows.mark(0, false);
        var h = changeHint(qq, p.value, api.tries() >= 1, false);
        if (p.value !== t) h[0] = 'Your drinks cost ' + money(t) + '. ' + h[0];
        api.check(false, h[0], h[1]);
        return;
      }
      locked = true;
      rows.set([qq.change]);
      rows.lock();
      show.appendChild(chips([chosen[0].price, chosen[1].price], t, false));
      show.appendChild(countUpLine(t, q.budget, false));
      api.check(true, money(t) + ' spent, ' + money(qq.change) + ' change!');
    });
    stage.appendChild(rows);
    stage.appendChild(show);
    api.onReveal(function () {
      locked = true;
      var best = null;
      for (var i = 0; i < DRINKS.length; i++)
        for (var j = i + 1; j < DRINKS.length; j++) {
          var t = DRINKS[i].price + DRINKS[j].price;
          if (t <= q.budget && (!best || t > best.t)) best = { a: DRINKS[i], b: DRINKS[j], t: t };
        }
      chosen = [best.a, best.b];
      drawSel();
      rows.set([q.budget - best.t]);
      rows.lock();
      show.appendChild(chips([best.a.price, best.b.price], best.t, false));
      show.appendChild(countUpLine(best.t, q.budget, false));
      api.feedback('One way: ' + best.a.name + ' + ' + best.b.name + ' = ' + money(best.t) + '. Change from ' + money(q.budget) + ' is ' + money(q.budget - best.t) + '.', 'info');
    });
  }

  function renderMissing(stage, api, q) {
    api.say('Work backwards! What did it cost?', 'think');
    stage.appendChild(MQ.ui.prompt(q.who + ' paid <b>' + money(q.paid) + '</b> for ' + q.thing + ' and got <b>' + money(q.change) + '</b> change. What did it cost?'));
    var bar = barModel({ label: 'Paid', value: q.paid }, [{ label: 'Cost', value: null }, { label: 'Change', value: q.change }]);
    stage.appendChild(bar);
    var show = el('div', { class: 'sc-show' });
    var rows = answerRows([{ label: 'Cost' }], function (ps) {
      var p = ps[0];
      if (p.empty || p.bad) return api.feedback('Type the cost, like 5.30', 'info');
      if (p.form === 'd1') return api.feedback('Cents take two places after the point, like 5.30 or 5.03.', 'info');
      if (p.value === q.cost) {
        rows.set([q.cost]);
        rows.lock();
        bar.fill(0, q.cost);
        show.appendChild(countUpLine(q.change, q.paid, false));
        api.check(true, money(q.paid) + ' − ' + money(q.change) + ' = ' + money(q.cost) + '!');
        return;
      }
      rows.mark(0, false);
      var strong = api.tries() >= 1;
      if (p.value === q.paid + q.change) api.check(false, 'That adds them. The cost is part of the ' + money(q.paid) + ', so it is less. Take the change away.', 'Added the change instead of subtracting');
      else if (p.value === q.change) api.check(false, 'That is the change. The cost is the other part of the bar.', 'Found the change, not the cost');
      else if (p.form === 'cents' || (p.value < 100 && q.cost >= 100)) api.check(false, 'The answer is in dollars and cents, like 5.30.', 'Mixed dollars and cents');
      else if (p.value === smallFromBig(q.paid, q.change) && p.value !== q.cost) api.check(false, 'Careful with the zeros! Count up from ' + money(q.change) + ' to ' + money(q.paid) + ' instead.', 'Subtracted the wrong way round');
      else
        api.check(
          false,
          strong
            ? 'Count up from ' + money(q.change) + ': ' + countUpHops(q.change, q.paid).map(function (h) { return money(h[1]); }).join(' → ') + '. Add the jumps.'
            : 'Paid = cost + change. Count up from the change to ' + money(q.paid) + '.',
          'Subtracted wrongly'
        );
    });
    stage.appendChild(rows);
    stage.appendChild(show);
    rows.focus();
    api.onReveal(function () {
      rows.set([q.cost]);
      rows.lock();
      bar.fill(0, q.cost);
      show.appendChild(countUpLine(q.change, q.paid, false));
      show.appendChild(chips([q.paid, q.change], q.cost, false, '−'));
      api.feedback('Count up from the change to the money paid. The jumps make the cost: ' + money(q.cost) + '.', 'info');
    });
  }

  function renderHalf(stage, api, q) {
    var d = q.total / 100;
    api.say('Two the same, so share the money into two equal piles.', 'think');
    stage.appendChild(MQ.ui.prompt(q.who + ' bought two ' + q.thing.many + ' ' + q.thing.icon + q.thing.icon + ' for <b>' + money(q.total) + '</b>. What does one cost?'));
    var w = shareWidget(api, d, null);
    stage.appendChild(w);
    var show = el('div', { class: 'sc-show' });
    var rows = answerRows([{ label: 'One costs' }], function (ps) {
      var p = ps[0];
      if (p.empty || p.bad) return api.feedback('Type the price of one, like 3.50', 'info');
      if (p.form === 'd1') return api.feedback('Cents take two places after the point, like 3.50 or 3.05.', 'info');
      if (p.value === q.each) {
        rows.set([q.each]);
        rows.lock();
        api.check(true, money(q.each) + ' + ' + money(q.each) + ' = ' + money(q.total) + '. Equal piles!');
        return;
      }
      rows.mark(0, false);
      var strong = api.tries() >= 1;
      var lowHalf = Math.floor(d / 2) * 100;
      if (p.value === q.total) api.check(false, 'That is the price of both. Share ' + money(q.total) + ' into two equal piles.', 'Halved wrongly');
      else if (d % 2 === 1 && p.value === lowHalf) api.check(false, 'What about the last $1? Change it into 100c and share that too.', 'Halved wrongly');
      else if (d % 2 === 1 && (p.value === lowHalf + 5 || p.value === lowHalf + 1)) api.check(false, 'Half of $1 is 50c, not 5c. So add 50c.', 'Halved wrongly');
      else api.check(false, strong ? 'Click "Share one" until all the money is shared. How much is in one pile?' : 'Check: two of your price should make ' + money(q.total) + '. ' + money(p.value) + ' + ' + money(p.value) + ' = ' + money(p.value * 2) + '.', 'Halved wrongly');
    });
    stage.appendChild(rows);
    stage.appendChild(show);
    api.onReveal(function () {
      w.dealAll();
      rows.set([q.each]);
      rows.lock();
      show.appendChild(chips([q.each, q.each], q.total, false));
      api.feedback(d % 2 ? 'Share the dollars, then change the last $1 into 100c: 50c each. One costs ' + money(q.each) + '.' : 'Share the $1 notes into two piles. One costs ' + money(q.each) + '.', 'info');
    });
  }

  function renderBefore(stage, api, q) {
    api.say('Work backwards. What did they have at the start?', 'think');
    stage.appendChild(MQ.ui.prompt(q.who + ' spent <b>' + money(q.spent) + '</b> and had <b>' + money(q.left) + '</b> left. How much money was there at the start?'));
    var bar = barModel({ label: 'At the start', value: null }, [{ label: 'Spent', value: q.spent }, { label: 'Left', value: q.left }]);
    stage.appendChild(bar);
    var show = el('div', { class: 'sc-show' });
    var rows = answerRows([{ label: 'At the start' }], function (ps) {
      var p = ps[0];
      if (p.empty || p.bad) return api.feedback('Type an amount, like 66.00', 'info');
      if (p.form === 'd1') return api.feedback('Cents take two places after the point.', 'info');
      if (p.value === q.start) {
        rows.set([q.start]);
        rows.lock();
        bar.fill(-1, q.start);
        api.check(true, money(q.spent) + ' + ' + money(q.left) + ' = ' + money(q.start) + '!');
        return;
      }
      rows.mark(0, false);
      if (p.value === q.spent - q.left) api.check(false, 'This time we add! The start money is the whole bar: spent + left.', 'Subtracted instead of adding');
      else if (api.tries() >= 1) api.check(false, 'Add the dollars: $' + Math.floor(q.spent / 100) + ' + $' + Math.floor(q.left / 100) + '. Add the cents: ' + (q.spent % 100) + 'c + ' + (q.left % 100) + 'c. 100c makes $1.', 'Added the amounts wrongly');
      else api.check(false, 'The whole bar is spent + left. Add them.', 'Added the amounts wrongly');
    });
    stage.appendChild(rows);
    stage.appendChild(show);
    rows.focus();
    api.onReveal(function () {
      rows.set([q.start]);
      rows.lock();
      bar.fill(-1, q.start);
      show.appendChild(chips([q.spent, q.left], q.start, false));
      var cents = (q.spent % 100) + (q.left % 100);
      api.feedback('Dollars: $' + (Math.floor(q.spent / 100) + Math.floor(q.left / 100)) + '. Cents: ' + cents + 'c' + (cents >= 100 ? ' = $1 and ' + (cents - 100) + 'c' : '') + '. Total ' + money(q.start) + '.', 'info');
    });
  }

  function renderWhich(stage, api, q) {
    api.say('First find what was spent. Then find two things that cost that much.', 'think');
    stage.appendChild(MQ.ui.prompt(q.who + ' had <b>' + q.had + 'c</b>, bought two different things and got <b>' + q.change + 'c</b> change. Which two? Find <b>both</b> answers.'));
    var shelf = el('div', { class: 'sc-shelf' });
    var chosen = [];
    var found = [];
    var locked = false;
    var cards = ITEMS.map(function (it) {
      var c = itemCard(it, true);
      c.addEventListener('click', function () {
        if (locked) return;
        var i = chosen.indexOf(it);
        if (i >= 0) chosen.splice(i, 1);
        else {
          if (chosen.length >= 2) chosen.shift();
          chosen.push(it);
        }
        api.sound('click');
        draw();
      });
      shelf.appendChild(c);
      return c;
    });
    var board = el('div', { class: 'sc-board' });
    function draw() {
      cards.forEach(function (c, k) {
        c.classList.toggle('sc-picked', chosen.indexOf(ITEMS[k]) >= 0);
      });
      MQ.clear(board);
      for (var k = 0; k < 2; k++) {
        var f = found[k];
        board.appendChild(el('div', { class: 'sc-slot' + (f ? ' sc-slot-ok' : '') }, f ? f[0].name + ' + ' + f[1].name + ' = 63c ✓' : 'Answer ' + (k + 1) + ': ?'));
      }
    }
    draw();
    stage.appendChild(shelf);
    var btn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check these two');
    stage.appendChild(btn);
    stage.appendChild(board);
    var show = el('div', { class: 'sc-show' });
    stage.appendChild(show);
    function pairKey(p) {
      return [p[0].id, p[1].id].sort().join('+');
    }
    btn.addEventListener('click', function () {
      if (locked) return;
      if (chosen.length !== 2) return api.feedback('Click two different things first.', 'info');
      var t = chosen[0].price + chosen[1].price;
      if (t !== q.total) {
        api.check(false, api.tries() >= 1 ? 'Those make ' + t + 'c. First: ' + q.had + 'c − ' + q.change + 'c = ? Then find two prices that add to that.' : 'Those cost ' + t + 'c. How much was spent? ' + q.had + 'c − ' + q.change + 'c.', 'Picked items that do not make the total');
        return;
      }
      if (found.some(function (f) { return pairKey(f) === pairKey(chosen); })) {
        api.check(false, 'You found that one already! Look for a different pair.', 'Missed a second answer');
        return;
      }
      found.push(chosen.slice());
      chosen = [];
      api.sound('correct');
      draw();
      if (found.length === 2) {
        locked = true;
        btn.disabled = true;
        show.appendChild(chips([q.had, q.change], q.total, true, '−'));
        api.check(true, 'Both answers found! Each pair costs 63c.');
      } else {
        api.say('Yes! That makes 63c. Is there another pair?', 'happy');
        api.feedback('One found! There is one more pair to find.', 'good');
      }
    });
    api.onReveal(function () {
      locked = true;
      btn.disabled = true;
      found = [
        [ITEMS[0], ITEMS[3]],
        [ITEMS[1], ITEMS[5]],
      ];
      chosen = [];
      draw();
      show.appendChild(chips([q.had, q.change], q.total, true, '−'));
      show.appendChild(chips([18, 45], 63, true));
      show.appendChild(chips([26, 37], 63, true));
      api.feedback('Spent ' + q.had + 'c − ' + q.change + 'c = 63c. Pencil + felt pen = 63c, and eraser + highlighter = 63c.', 'info');
    });
  }

  MQ.register('shop-and-change', {
    learn: [learnBasket, learnCountUp, learnBar, learnShare],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0 || deck.length !== 10) deck = buildDeck();
        var q = deck[api.index];
        stage.__q = q;
        if (q.type === 'spend') renderSpend(stage, api, q);
        else if (q.type === 'choose') renderChoose(stage, api, q);
        else if (q.type === 'missing') renderMissing(stage, api, q);
        else if (q.type === 'half') renderHalf(stage, api, q);
        else if (q.type === 'before') renderBefore(stage, api, q);
        else renderWhich(stage, api, q);
      },
    },
  });
  // Used only by the test scripts (deck checks); not used by the page.
  MQ.activities['shop-and-change']._test = { buildDeck: buildDeck, parseMoney: parseMoney, countUpHops: countUpHops, ITEMS: ITEMS, DRINKS: DRINKS };

  var css = [
    '.sc-shelf{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:100%}',
    '.sc-item{display:flex;flex-direction:column;align-items:center;gap:2px;background:#fff;border:3px solid var(--line);border-radius:14px;padding:6px 10px;min-width:104px;font-family:inherit;color:var(--ink)}',
    'button.sc-item{cursor:pointer}',
    'button.sc-item:hover:not(:disabled){border-color:var(--accent);transform:translateY(-2px)}',
    '.sc-item.sc-picked{border-color:var(--good);background:var(--good-bg)}',
    '.sc-item:disabled{opacity:.6;cursor:default}',
    '.sc-item.sc-picked:disabled{opacity:1}',
    '.sc-icon{display:block}',
    '.sc-emoji{font-size:2rem;line-height:1.2}',
    '.sc-item-name{font-weight:800;font-size:1rem}',
    '.sc-tag{background:#fff3cd;border:2px solid var(--gold);border-radius:8px;padding:0 8px;font-weight:800}',
    '.sc-basket{display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center;min-height:70px;min-width:280px;padding:6px 14px;border:3px dashed #e8c48f;border-radius:18px;background:#fff8ec}',
    '.sc-basket .sc-item{min-width:90px;padding:4px 8px}',
    '.sc-till{min-height:10px}',
    '.sc-row{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:center}',
    '.sc-big{font-size:1.6rem;font-weight:800}',
    '.sc-paid{display:inline-flex;align-items:center;gap:6px;font-size:1.3rem;font-weight:800;background:var(--info-bg);border-radius:12px;padding:6px 12px}',
    '.sc-svg{display:block}',
    '.sc-note-t{font-size:22px;font-weight:800;font-family:var(--font)}',
    '.sc-coin-t{font-size:13px;font-weight:800;font-family:var(--font);fill:#2f3b4a}',
    '.sc-line-wrap{width:100%;display:flex;justify-content:center}',
    '.sc-line{max-width:100%;height:auto}',
    '.sc-axis{stroke:var(--ink);stroke-width:3}',
    '.sc-tick{stroke:var(--ink);stroke-width:2}',
    '.sc-tick-t{font-size:16px;font-weight:700;fill:var(--ink-soft);font-family:var(--font)}',
    '.sc-start{fill:var(--ink);font-weight:800}',
    '.sc-hop{fill:none;stroke:#e07a1f;stroke-width:3}',
    '.sc-hop-t{font-size:17px;font-weight:800;fill:#b4540a;font-family:var(--font)}',
    '.sc-countup{display:flex;flex-direction:column;align-items:center;width:100%}',
    '.sc-sumline{font-size:1.25rem;font-weight:800}',
    '.sc-sumline b{color:#0b6e66}',
    '.sc-show{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.sc-answers{display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:center}',
    '.sc-field{display:flex;align-items:center;gap:6px}',
    '.sc-field-l{font-weight:800;font-size:1.15rem}',
    '.sc-in{width:130px}',
    '.sc-barbox{width:100%;max-width:620px;display:flex;flex-direction:column;gap:4px}',
    '.sc-bar{display:flex;border-radius:10px;min-height:58px}',
    '.sc-bar-whole{background:#d9eafb;border:3px solid #1d4f8a;justify-content:center;align-items:center}',
    '.sc-bar-parts{gap:4px}',
    '.sc-seg{display:flex;justify-content:center;align-items:center;border-radius:10px;border:3px solid #b4540a;background:#fde9c6;min-width:0}',
    '.sc-seg-1{background:#e3f2dc;border-color:#2f6b2f}',
    '.sc-filled{box-shadow:0 0 0 4px var(--good-bg)}',
    '.sc-bar-txt{display:flex;flex-direction:column;align-items:center;line-height:1.1;font-size:1.25rem}',
    '.sc-bar-txt small{font-size:.85rem;font-weight:800;color:var(--ink-soft)}',
    '.sc-q{color:var(--try);font-size:1.5rem}',
    '.sc-share{display:flex;flex-direction:column;gap:10px;align-items:center;width:100%}',
    '.sc-src-wrap{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.sc-src{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;min-height:40px;max-width:640px}',
    '.sc-share-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.sc-money{background:none;border:0;padding:1px;line-height:0;cursor:pointer;font-family:inherit}',
    'span.sc-money{cursor:default}',
    '.sc-piles{display:flex;gap:14px;justify-content:center;width:100%;flex-wrap:wrap}',
    '.sc-pile{flex:1 1 220px;max-width:320px;border:3px solid var(--line);border-radius:50% / 30%;background:#fbfcff;padding:8px 16px;display:flex;flex-direction:column;align-items:center;min-height:120px}',
    '.sc-pile-h{font-weight:800;color:var(--ink-soft)}',
    '.sc-pile-items{display:flex;flex-wrap:wrap;gap:2px;justify-content:center;flex:1;align-items:center}',
    '.sc-pile-tot{font-size:1.4rem;font-weight:800;color:#0b6e66}',
    '.sc-pulse{animation:scPulse 1s ease 2}',
    '@keyframes scPulse{50%{transform:scale(1.08)}}',
    '.sc-small{font-size:.9rem;color:var(--ink-soft);font-weight:700}',
    '.sc-sel{font-weight:800;font-size:1.1rem;min-height:1.5em;text-align:center}',
    '.sc-board{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.sc-slot{border:3px dashed var(--line);border-radius:12px;padding:6px 14px;font-weight:800;min-width:200px;text-align:center}',
    '.sc-slot-ok{border-style:solid;border-color:var(--good);background:var(--good-bg);color:var(--good)}',
    '@media (max-width:700px){.sc-item{min-width:88px;padding:4px 6px}.sc-icon{width:64px;height:32px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'shop-and-change' }, css));
})();

/* Fraction Line-Up — compare and order fractions with a fraction wall, a 0–1 number line
 * and the signs <, > and = (Unit 12.2). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;
  var ID = 'fraction-line-up';

  var DEN_COL = { 1: '#dfe4ea', 2: '#ffd6a5', 3: '#caffbf', 4: '#a0e7f0', 5: '#d4ccff', 10: '#ffc8ec' };
  var DEN_NAME = { 2: 'halves', 3: 'thirds', 4: 'quarters', 5: 'fifths', 10: 'tenths' };
  var DENS = [2, 3, 4, 5, 10];

  /* ---------------- fraction helpers ---------------- */
  function F(n, d) {
    return { n: n, d: d };
  }
  // exact comparison with whole numbers only (cross-multiplying)
  function cmp(a, b) {
    var l = a.n * b.d;
    var r = b.n * a.d;
    return l < r ? -1 : l > r ? 1 : 0;
  }
  function key(f) {
    return f.n + '/' + f.d;
  }
  function signOf(c) {
    return c < 0 ? '<' : c > 0 ? '>' : '=';
  }
  function fracHTML(f) {
    if (f.d === 1) return '<span class="flu-whole">' + f.n + '</span>';
    return '<span class="flu-frac"><span class="flu-fn">' + f.n + '</span><span class="flu-fd">' + f.d + '</span></span>';
  }
  function fracText(f) {
    return f.d === 1 ? String(f.n) : f.n + '/' + f.d;
  }
  function big(f) {
    return el('span', { class: 'flu-big', html: fracHTML(f) });
  }
  // stacked fraction drawn inside an SVG
  function svgFrac(x, cy, f, size, cls) {
    size = size || 18;
    var g = S('g', { class: 'flu-sfrac' + (cls ? ' ' + cls : '') });
    if (f.d === 1) {
      g.appendChild(S('text', { x: x, y: cy + size * 0.35, 'text-anchor': 'middle', 'font-size': size }, String(f.n)));
      return g;
    }
    var w = Math.max(String(f.n).length, String(f.d).length) * size * 0.62 + 6;
    g.appendChild(S('text', { x: x, y: cy - size * 0.2, 'text-anchor': 'middle', 'font-size': size }, String(f.n)));
    g.appendChild(S('line', { x1: x - w / 2, y1: cy, x2: x + w / 2, y2: cy }));
    g.appendChild(S('text', { x: x, y: cy + size * 0.88, 'text-anchor': 'middle', 'font-size': size }, String(f.d)));
    return g;
  }
  // MQ.ui.choices with data-value on each button (for tests)
  function choices(options, onPick, opts) {
    var ch = MQ.ui.choices(options, onPick, opts);
    ch.classList.add('flu-choices');
    ch.buttons.forEach(function (b) {
      b.setAttribute('data-value', String(b.value_));
    });
    return ch;
  }
  function signChoices(signs, onPick) {
    var words = { '<': 'is less than', '>': 'is greater than', '=': 'equals' };
    return choices(
      signs.map(function (s) {
        return { label: '<span class="flu-signsym">' + s.replace('<', '&lt;').replace('>', '&gt;') + '</span><span class="flu-signword">' + words[s] + '</span>', value: s };
      }),
      onPick,
      { columns: signs.length }
    );
  }

  /* ---------------- fraction wall (pieces labelled with unit fractions) ---------------- */
  function wall(dens, o) {
    o = o || {};
    var W = o.W || 600;
    var pad = 20;
    var rowH = o.rowH || 42;
    var gap = 4;
    var top = 12;
    var bottom = top + dens.length * (rowH + gap) - gap;
    var H = bottom + 14;
    var root = S('svg', { viewBox: '0 0 ' + (W + 2 * pad) + ' ' + H, width: W + 2 * pad, height: H, class: 'flu-svg flu-wall' });
    var pieceG = S('g');
    var over = S('g', { class: 'flu-over' });
    root.appendChild(pieceG);
    root.appendChild(over);
    var rows = [];
    dens.forEach(function (d) {
      var y = top + rows.length * (rowH + gap);
      var row = { d: d, y: y, pieces: [] };
      for (var i = 0; i < d; i++) {
        var x = pad + (W * i) / d;
        var w = W / d;
        var g = S('g', { class: 'flu-piece', 'data-d': d, 'data-i': i });
        g.appendChild(S('rect', { x: x, y: y, width: w, height: rowH, fill: DEN_COL[d], class: 'flu-prect' }));
        if (d === 1) g.appendChild(S('text', { x: x + w / 2, y: y + rowH / 2 + 7, 'text-anchor': 'middle', class: 'flu-ptext' }, '1 whole'));
        else g.appendChild(svgFrac(x + w / 2, y + rowH / 2 - 2, F(1, d), d === 10 ? 15 : 17));
        row.pieces.push(g);
        pieceG.appendChild(g);
      }
      rows.push(row);
    });
    function xOf(v) {
      return pad + W * v;
    }
    return {
      svg: root,
      rows: rows,
      over: over,
      xOf: xOf,
      row: function (d) {
        return rows.filter(function (r) {
          return r.d === d;
        })[0];
      },
      shade: function (f) {
        var r = this.row(f.d);
        for (var i = 0; i < r.pieces.length; i++) r.pieces[i].classList.toggle('flu-on', i < f.n);
      },
      drop: function (v, fromY, cls) {
        var x = xOf(v);
        var ln = S('line', { x1: x, y1: fromY == null ? top - 8 : fromY, x2: x, y2: bottom + 10, class: 'flu-drop' + (cls ? ' ' + cls : '') });
        over.appendChild(ln);
        return ln;
      },
      zone: function (a, b) {
        over.appendChild(S('rect', { x: xOf(a), y: top - 8, width: xOf(b) - xOf(a), height: bottom - top + 18, class: 'flu-zone' }));
      },
    };
  }

  /* ---------------- strips: each row one whole, cut into d pieces, n shaded ---------------- */
  // rows: [{ f: F, shade: count (default f.n), color, whole: bool }]
  function strips(rows, o) {
    o = o || {};
    var W = o.W || 520;
    var L = 78;
    var R = 16;
    var rowH = o.rowH || 38;
    var gap = o.gap || 8;
    var top = 12;
    var bottom = top + rows.length * (rowH + gap) - gap;
    var H = bottom + 14;
    var root = S('svg', { viewBox: '0 0 ' + (L + W + R) + ' ' + H, width: L + W + R, height: H, class: 'flu-svg flu-strips' });
    var base = S('g');
    var over = S('g', { class: 'flu-over' });
    root.appendChild(base);
    root.appendChild(over);
    rows.forEach(function (row, r) {
      var f = row.f;
      var y = top + r * (rowH + gap);
      var count = row.shade == null ? f.n : row.shade;
      if (row.whole) base.appendChild(svgFrac(L - 30, y + rowH / 2, F(1, 1), 20));
      else base.appendChild(svgFrac(L - 30, y + rowH / 2 - 1, f, Math.min(19, rowH * 0.5)));
      for (var i = 0; i < f.d; i++) {
        var on = i < count;
        base.appendChild(
          S('rect', {
            x: L + (W * i) / f.d,
            y: y,
            width: W / f.d,
            height: rowH,
            class: 'flu-srect' + (on ? ' flu-son' : ''),
            fill: on ? row.color || DEN_COL[row.whole ? 1 : f.d] : '#ffffff',
          })
        );
      }
    });
    return {
      svg: root,
      xOf: function (v) {
        return L + W * v;
      },
      drop: function (v, cls) {
        var x = L + W * v;
        over.appendChild(S('line', { x1: x, y1: top - 8, x2: x, y2: bottom + 10, class: 'flu-drop' + (cls ? ' ' + cls : '') }));
      },
    };
  }

  // whole + the two fractions, with drop lines at their ends
  function compareStrips(a, b, withDrops) {
    var s = strips([{ f: F(1, 1), whole: true }, { f: a }, { f: b }], { W: 520, rowH: 40 });
    if (withDrops) {
      s.drop(a.n / a.d);
      if (cmp(a, b) !== 0) s.drop(b.n / b.d, 'flu-drop2');
    }
    return s.svg;
  }

  /* ---------------- 0–1 number line with draggable fraction cards ---------------- */
  // o: { cards: [F], half: bool, onDrop(idx, k, d) -> bool, onAll(), locked() }
  function lineBoard(api, o) {
    var X0 = 50;
    var LW = 600;
    var LY = 116;
    var VW = 700;
    var VH = 250;
    var CW = 56;
    var CH = 66;
    var TRAY = 176;
    var PLACED_Y = LY - CH - 24;
    var root = S('svg', { viewBox: '0 0 ' + VW + ' ' + VH, width: VW, height: VH, class: 'flu-svg flu-line' });
    var base = S('g');
    var revG = S('g');
    var tickG = S('g');
    var hitG = S('g');
    var cardG = S('g');
    [base, revG, tickG, hitG, cardG].forEach(function (g) {
      root.appendChild(g);
    });
    base.appendChild(S('line', { x1: X0, y1: LY, x2: X0 + LW, y2: LY, class: 'flu-axis' }));
    base.appendChild(S('line', { x1: X0, y1: LY - 18, x2: X0, y2: LY + 18, class: 'flu-endtick' }));
    base.appendChild(S('line', { x1: X0 + LW, y1: LY - 18, x2: X0 + LW, y2: LY + 18, class: 'flu-endtick' }));
    base.appendChild(S('text', { x: X0, y: LY + 46, 'text-anchor': 'middle', class: 'flu-num-label' }, '0'));
    base.appendChild(S('text', { x: X0 + LW, y: LY + 46, 'text-anchor': 'middle', class: 'flu-num-label' }, '1'));
    if (o.half) {
      base.appendChild(S('line', { x1: X0 + LW / 2, y1: LY - 26, x2: X0 + LW / 2, y2: LY + 26, class: 'flu-halftick' }));
      base.appendChild(svgFrac(X0 + LW / 2, LY + 40, F(1, 2), 15, 'flu-muted'));
    }
    var cur = 0;
    var sel = -1;
    var placedCount = 0;
    var densRow = el('div', { class: 'flu-dens' });
    var denBtns = {};
    DENS.forEach(function (d) {
      var b = el('button', { class: 'flu-den', type: 'button', 'data-d': d, onclick: function () {
        if (o.locked && o.locked()) return;
        MQ.sound('click');
        showTicks(d);
      } }, el('b', null, d + ' parts'), el('small', null, DEN_NAME[d]));
      denBtns[d] = b;
      densRow.appendChild(b);
    });

    function setPos(g, x, y) {
      g._x = x;
      g._y = y;
      g.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    }
    var homes = [];
    var cards = o.cards.map(function (f, i) {
      var hx = VW / 2 + (i - (o.cards.length - 1) / 2) * 86;
      homes.push(hx);
      var g = S('g', { class: 'flu-lcard', 'data-idx': i, 'data-n': f.n, 'data-d': f.d });
      g.appendChild(S('line', { x1: 0, y1: CH, x2: 0, y2: CH + 24, class: 'flu-lcard-ptr' }));
      g.appendChild(S('rect', { x: -CW / 2, y: 0, width: CW, height: CH, rx: 10, class: 'flu-lcard-bg' }));
      g.appendChild(svgFrac(0, CH / 2 - 1, f, 22));
      setPos(g, hx, TRAY);
      cardG.appendChild(g);
      var sx = 0;
      var sy = 0;
      var moved = 0;
      var active = false;
      var unbind = MQ.ui.drag(root, g, {
        start: function () {
          active = !g._placed && !(o.locked && o.locked());
          sx = g._x;
          sy = g._y;
          moved = 0;
        },
        move: function (p, dx, dy) {
          if (!active) return;
          moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
          setPos(g, sx + dx, sy + dy);
        },
        end: function (p) {
          if (!active) return;
          active = false;
          if (moved < 6) {
            setPos(g, sx, sy);
            select(i);
            return;
          }
          if (Math.abs(p.y - LY) < 75 && p.x > X0 - 40 && p.x < X0 + LW + 40) {
            if (!cur) {
              api.feedback('First choose how many equal parts to cut the line into (the buttons above).', 'info');
              home(i);
              return;
            }
            var k = U.clamp(Math.round(((p.x - X0) / LW) * cur), 0, cur);
            attempt(i, k, cur);
          } else home(i);
        },
      });
      api.cleanup(unbind);
      return g;
    });

    function home(i) {
      setPos(cards[i], homes[i], TRAY);
    }
    function select(i) {
      sel = sel === i ? -1 : i;
      cards.forEach(function (c, j) {
        c.classList.toggle('flu-sel', j === sel);
      });
      if (sel >= 0) api.feedback(cur ? 'Now click a mark on the line.' : 'Now choose how many equal parts to cut the line into.', 'info');
    }
    function showTicks(d) {
      cur = d;
      MQ.clear(tickG);
      MQ.clear(hitG);
      Object.keys(denBtns).forEach(function (k) {
        denBtns[k].classList.toggle('flu-den-on', +k === d);
      });
      for (var k = 1; k < d; k++) {
        var x = X0 + (LW * k) / d;
        tickG.appendChild(S('line', { x1: x, y1: LY - 14, x2: x, y2: LY + 14, class: 'flu-tickline' }));
      }
      for (var k2 = 0; k2 <= d; k2++) {
        (function (kk) {
          var x2 = X0 + (LW * kk) / d;
          hitG.appendChild(
            S('rect', {
              x: x2 - 15,
              y: LY - 50,
              width: 30,
              height: 76,
              class: 'flu-tick',
              'data-k': kk,
              'data-d': d,
              onclick: function () {
                if (o.locked && o.locked()) return;
                if (sel < 0) {
                  api.feedback('Click a fraction card first, or drag a card onto the line.', 'info');
                  return;
                }
                attempt(sel, kk, d);
              },
            })
          );
        })(k2);
      }
    }
    function place(i, v) {
      var g = cards[i];
      if (g._placed) return;
      g._placed = true;
      g.classList.add('flu-placed');
      g.classList.remove('flu-sel');
      setPos(g, X0 + LW * v, PLACED_Y);
      placedCount++;
    }
    function attempt(i, k, d) {
      if (cards[i]._placed) return;
      sel = -1;
      cards.forEach(function (c) {
        c.classList.remove('flu-sel');
      });
      if (o.onDrop(i, k, d)) {
        place(i, k / d);
        MQ.sound('pop');
        if (placedCount === cards.length && o.onAll) o.onAll();
      } else home(i);
    }
    return {
      el: el('div', { class: 'flu-lineboard' }, densRow, root),
      showTicks: showTicks,
      // reveal: draw the ticks each card needs (labelled) and place every card
      reveal: function () {
        var seen = {};
        o.cards.forEach(function (f) {
          if (seen[f.d]) return;
          seen[f.d] = true;
          for (var k = 1; k < f.d; k++) {
            var x = X0 + (LW * k) / f.d;
            revG.appendChild(S('line', { x1: x, y1: LY - 14, x2: x, y2: LY + 14, class: 'flu-revtick flu-rev-' + f.d }));
          }
        });
        o.cards.forEach(function (f, i) {
          revG.appendChild(svgFrac(X0 + (LW * f.n) / f.d, LY + 40, f, 14, 'flu-revlabel'));
          place(i, f.n / f.d);
        });
      },
    };
  }

  /* ---------------- question data ---------------- */
  var SAME = [
    [F(2, 5), F(1, 5)],
    [F(7, 10), F(9, 10)],
    [F(1, 3), F(2, 3)],
    [F(3, 4), F(1, 4)],
    [F(3, 10), F(6, 10)],
    [F(4, 5), F(2, 5)],
  ];
  var EQUIV = [
    [F(2, 4), F(1, 2)],
    [F(5, 10), F(1, 2)],
    [F(4, 4), F(10, 10)],
    [F(2, 10), F(1, 5)],
    [F(3, 3), F(5, 5)],
    [F(4, 10), F(2, 5)],
  ];
  var CONTEXTS = [
    { thing: 'cake', many: 'cakes', icon: '🍰', a: 3, b: 10, color: '#f6d7a7' },
    { thing: 'chocolate bar', many: 'chocolate bars', icon: '🍫', a: 4, b: 2, color: '#c08a64' },
    { thing: 'loaf of bread', many: 'loaves of bread', icon: '🍞', a: 5, b: 3, color: '#ecc77c' },
    { thing: 'ribbon', many: 'ribbons', icon: '🎀', a: 10, b: 4, color: '#ff9ebb' },
    { thing: 'tray of flapjack', many: 'trays of flapjack', icon: '🥮', a: 2, b: 5, color: '#e0b973' },
  ];
  var BETWEEN = [
    { lo: F(0, 1), hi: F(1, 4), pool: [F(1, 5), F(1, 10), F(2, 10), F(1, 3), F(1, 2), F(3, 10), F(2, 5), F(1, 4)] },
    { lo: F(1, 4), hi: F(1, 2), pool: [F(1, 3), F(2, 5), F(3, 10), F(4, 10), F(1, 5), F(1, 10), F(2, 4), F(3, 5), F(2, 3)] },
    { lo: F(3, 4), hi: F(1, 1), pool: [F(4, 5), F(9, 10), F(7, 10), F(2, 3), F(1, 2), F(3, 4), F(3, 5)] },
  ];
  var LINE_SETS = [
    [F(1, 3), F(2, 3), F(2, 10)],
    [F(5, 10), F(7, 10), F(9, 10)],
  ];

  function inside(f, lo, hi) {
    return cmp(f, lo) > 0 && cmp(f, hi) < 0;
  }
  function pairKey(a, b) {
    return [key(a), key(b)].sort().join('|');
  }

  function cmpQ(a, b, kind, level) {
    return { type: 'cmp', kind: kind, a: a, b: b, level: level, sign: signOf(cmp(a, b)), id: 'cmp:' + pairKey(a, b) };
  }

  function buildDeck() {
    var q = [];
    // Level 1: two unit-fraction comparisons (wall visible) + one "which gives more?"
    var pairs = [];
    for (var i = 0; i < DENS.length; i++) for (var j = i + 1; j < DENS.length; j++) pairs.push([DENS[i], DENS[j]]);
    pairs = U.shuffle(pairs);
    var flip = Math.random() < 0.5; // one question has the bigger fraction on the left, one on the right
    var p1 = pairs[0];
    var p2 = pairs[1];
    q.push(cmpQ(F(1, flip ? p1[0] : p1[1]), F(1, flip ? p1[1] : p1[0]), 'unit', 1));
    q.push(cmpQ(F(1, flip ? p2[1] : p2[0]), F(1, flip ? p2[0] : p2[1]), 'unit', 1));
    var used = {};
    used[pairKey(q[0].a, q[0].b)] = true;
    used[pairKey(q[1].a, q[1].b)] = true;
    var ctx = U.shuffle(CONTEXTS).filter(function (c) {
      return !used[pairKey(F(1, c.a), F(1, c.b))];
    })[0];
    var ca = F(1, ctx.a);
    var cb = F(1, ctx.b);
    q.push({ type: 'context', ctx: ctx, a: ca, b: cb, answer: cmp(ca, cb) > 0 ? 'a' : 'b', id: 'ctx:' + ctx.thing });

    // Level 2: same denominator, equivalence (=), and "pick a fraction between"
    var s = U.pick(SAME);
    var e = U.pick(EQUIV);
    if (Math.random() < 0.5) s = [s[1], s[0]];
    if (Math.random() < 0.5) e = [e[1], e[0]];
    var bt = U.pick(BETWEEN);
    var valid = U.shuffle(bt.pool.filter(function (f) { return inside(f, bt.lo, bt.hi); })).slice(0, 2);
    var wrong = U.shuffle(bt.pool.filter(function (f) { return !inside(f, bt.lo, bt.hi); })).slice(0, 3);
    var opts = U.shuffle(valid.concat(wrong));
    q = q.concat(
      U.shuffle([
        cmpQ(s[0], s[1], 'same', 2),
        cmpQ(e[0], e[1], 'equiv', 2),
        {
          type: 'between',
          lo: bt.lo,
          hi: bt.hi,
          options: opts,
          valid: opts.filter(function (f) { return inside(f, bt.lo, bt.hi); }).map(key),
          id: 'between:' + key(bt.lo) + '-' + key(bt.hi),
        },
      ])
    );

    // Level 3: order five fractions, place on a 0–1 line, 1/3 or 1/4 of $100
    var items;
    if (Math.random() < 0.5) items = [F(1, 2), F(1, 3), F(1, 4), F(1, 5), F(1, 10)];
    else items = U.shuffle(U.range(1, 10)).slice(0, 5).map(function (n) { return F(n, 10); });
    var dir = Math.random() < 0.5 ? 'up' : 'down';
    var sorted = items.slice().sort(function (x, y) { return dir === 'up' ? cmp(x, y) : cmp(y, x); });
    var shown;
    do {
      shown = U.shuffle(items);
    } while (shown.map(key).join() === sorted.map(key).join() || shown.map(key).join() === sorted.slice().reverse().map(key).join());
    q.push({ type: 'order', items: shown, dir: dir, answer: sorted.map(key), unit: items[0].n === 1 && items[1].n === 1, id: 'order' });
    var set = U.pick(LINE_SETS);
    q.push({ type: 'line', cards: U.shuffle(set), id: 'line' });
    q.push({ type: 'money', total: 100, a: F(1, 3), b: F(1, 4), answer: 'a', id: 'money' });
    return q;
  }

  var deck = null;

  /* ---------------- learn screens ---------------- */
  function learnWall(stage, api) {
    api.say('This is a fraction wall. Each row is one whole, cut into equal pieces.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('The fraction wall', 'Click ' + fracHTML(F(1, 4)) + ', then click ' + fracHTML(F(1, 5)) + '.'));
    var w = wall([1, 2, 3, 4, 5, 10]);
    stage.appendChild(w.svg);
    var res = el('div', { class: 'flu-result' });
    stage.appendChild(res);
    var got = {};
    w.rows.forEach(function (row) {
      if (row.d === 1) return;
      row.pieces.forEach(function (p) {
        p.classList.add('flu-click');
        p.addEventListener('click', function () {
          if (got[row.d]) return;
          got[row.d] = true;
          row.pieces[0].classList.add('flu-on');
          w.drop(1 / row.d, row.y - 4, row.d === 4 ? 'flu-drop2' : '');
          api.sound('pop');
          if (got[4] && got[5]) {
            res.innerHTML = fracHTML(F(1, 5)) + '<span class="flu-sign">&lt;</span>' + fracHTML(F(1, 4));
            api.say('More pieces means smaller pieces. A fifth is shorter than a quarter!', 'cheer');
            api.feedback('One fifth is less than one quarter: the fifths line comes first.', 'good');
            api.unlockNext();
          } else if (row.d === 4 || row.d === 5) {
            api.feedback('Good! Now click ' + (row.d === 4 ? 'one fifth (1/5).' : 'one quarter (1/4).'), 'info');
          } else {
            api.feedback('That row is ' + DEN_NAME[row.d] + '. Now find 1/4 and 1/5.', 'info');
          }
        });
      });
    });
  }

  function learnLine(stage, api) {
    api.say('A number line from 0 to 1 is one whole. Cut it into 4 equal parts.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Fractions on a line', 'Press <b>4 parts</b>. Then drag ' + fracHTML(F(1, 4)) + ' ' + fracHTML(F(2, 4)) + ' ' + fracHTML(F(3, 4)) + ' to their marks.'));
    var cards = U.shuffle([F(1, 4), F(2, 4), F(3, 4)]);
    var done = false;
    var board = lineBoard(api, {
      cards: cards,
      half: true,
      onDrop: function (i, k, d) {
        var f = cards[i];
        if (cmp(F(k, d), f) === 0) {
          if (f.n === 2) {
            api.say('Look! 2/4 sits right on the half mark. 2/4 is the same as 1/2.', 'cheer');
            api.feedback('2 quarters = 1 half.', 'good');
          } else api.feedback(fracText(f) + ' is ' + f.n + (f.n === 1 ? ' gap' : ' gaps') + ' from 0.', 'good');
          return true;
        }
        if (d !== 4) api.feedback('Quarters need 4 equal parts. Press the "4 parts" button.', 'try');
        else api.feedback('Count the gaps from 0. ' + fracText(f) + ' is ' + f.n + (f.n === 1 ? ' gap' : ' gaps') + ' along.', 'try');
        api.sound('wrong');
        return false;
      },
      onAll: function () {
        if (done) return;
        done = true;
        api.unlockNext();
        api.later(function () {
          api.say('1/4, 2/4, 3/4: equal steps along the line.', 'happy');
        }, 1600);
      },
    });
    stage.appendChild(board.el);
  }

  function learnSigns(stage, api) {
    api.say('The open mouth always faces the bigger amount.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Less than, greater than, equals', '<b>&lt;</b> less than &nbsp; <b>&gt;</b> greater than &nbsp; <b>=</b> equals. The open side faces the bigger one.'));
    var rounds = [
      [F(1, 2), F(1, 3)],
      [F(1, 5), F(1, 4)],
      [F(2, 4), F(1, 2)],
    ];
    var holder = el('div', { class: 'flu-col' });
    stage.appendChild(holder);
    var n = 0;
    function show() {
      MQ.clear(holder);
      if (n >= rounds.length) {
        holder.appendChild(el('div', { class: 'flu-result', html: fracHTML(F(1, 3)) + '<span class="flu-sign">&lt;</span>' + fracHTML(F(1, 2)) + '<span class="flu-or">is the same as</span>' + fracHTML(F(1, 2)) + '<span class="flu-sign">&gt;</span>' + fracHTML(F(1, 3)) }));
        api.say('Brilliant! The mouth eats the bigger fraction.', 'cheer');
        api.feedback('You can read it both ways: 1/3 < 1/2 and 1/2 > 1/3.', 'good');
        api.unlockNext();
        return;
      }
      var a = rounds[n][0];
      var b = rounds[n][1];
      var right = signOf(cmp(a, b));
      var box = el('span', { class: 'flu-signbox' }, '?');
      holder.appendChild(el('div', { class: 'flu-cmp' }, big(a), box, big(b)));
      holder.appendChild(compareStrips(a, b, true));
      var ch = signChoices(['<', '>', '='], function (v) {
        if (v === right) {
          ch.mark(v, 'good');
          ch.disable();
          box.textContent = v;
          box.classList.add('flu-filled');
          api.sound('correct');
          api.feedback(right === '=' ? 'They end in the same place, so they are equal.' : 'Yes! The open mouth faces ' + fracText(cmp(a, b) > 0 ? a : b) + ', the longer strip.', 'good');
          n++;
          api.later(show, 1600);
        } else {
          ch.mark(v, 'bad');
          api.sound('wrong');
          api.feedback(right === '=' ? 'Look at the red lines: the two strips end in the same place.' : 'Which strip is longer? The open mouth faces that one.', 'try');
        }
      });
      holder.appendChild(ch);
    }
    show();
  }

  // 12 squares in one row; groups of size g; first group shaded
  function chocBar(group, label, shaded) {
    var SQ = 44;
    var L = 70;
    var root = S('svg', { viewBox: '0 0 ' + (L + 12 * SQ + 10) + ' 64', width: L + 12 * SQ + 10, height: 64, class: 'flu-svg flu-choc' });
    root.appendChild(label ? svgFrac(L - 30, 32, label, 19) : S('g'));
    for (var i = 0; i < 12; i++) {
      var on = shaded && i < group;
      root.appendChild(S('rect', { x: L + i * SQ, y: 10, width: SQ, height: SQ, rx: 4, class: 'flu-choc-sq' + (on ? ' flu-choc-on' : ''), 'data-sq': i }));
    }
    if (group) {
      for (var g = group; g < 12; g += group) root.appendChild(S('line', { x1: L + g * SQ, y1: 2, x2: L + g * SQ, y2: 62, class: 'flu-choc-cut' }));
    }
    return root;
  }

  function learnChoc(stage, api) {
    api.say('Would you rather have one third or one quarter of this chocolate bar?', 'think');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Which share is bigger?', 'The bar has 12 squares. Pick ' + fracHTML(F(1, 3)) + ' or ' + fracHTML(F(1, 4)) + ' of it.'));
    var pic = el('div', { class: 'flu-col' }, chocBar(0, null, false));
    stage.appendChild(pic);
    var ch = choices(
      [
        { label: fracHTML(F(1, 3)) + ' of the bar', value: 'third' },
        { label: fracHTML(F(1, 4)) + ' of the bar', value: 'quarter' },
      ],
      function (v) {
        ch.disable();
        ch.mark('third', 'good');
        if (v === 'quarter') ch.mark('quarter', 'bad');
        MQ.clear(pic);
        pic.appendChild(chocBar(4, F(1, 3), true));
        pic.appendChild(MQ.ui.sum([4, 4, 4], 12, 'squares'));
        pic.appendChild(chocBar(3, F(1, 4), true));
        pic.appendChild(MQ.ui.sum([3, 3, 3, 3], 12, 'squares'));
        api.say(v === 'third' ? 'Yes! A third is 4 squares. A quarter is only 3.' : 'Look: a third is 4 squares, a quarter is only 3. The third is more!', v === 'third' ? 'cheer' : 'happy');
        api.feedback('Share into 3 → 4 squares each. Share into 4 → 3 squares each. So 1/3 > 1/4.', 'good');
        api.unlockNext();
      },
      { columns: 2 }
    );
    stage.appendChild(ch);
  }

  /* ---------------- practice renderers ---------------- */
  function renderCmp(stage, api, q) {
    var a = q.a;
    var b = q.b;
    var c = cmp(a, b);
    var bigger = c > 0 ? 'a' : c < 0 ? 'b' : 'same';
    var bigF = c > 0 ? a : b;
    var smallF = c > 0 ? b : a;
    var signs = q.level === 1 ? ['<', '>'] : ['<', '>', '='];
    api.say(q.level === 1 ? 'Use the wall. Which piece is longer?' : 'Which fraction is bigger, or are they the same?', 'think');
    var prompt = MQ.ui.prompt('Which is bigger?');
    stage.appendChild(prompt);
    var box = el('span', { class: 'flu-signbox' }, '?');
    stage.appendChild(el('div', { class: 'flu-cmp' }, big(a), box, big(b)));
    var pic = el('div', { class: 'flu-col' });
    stage.appendChild(pic);
    function showStrips(drops) {
      MQ.clear(pic);
      pic.appendChild(compareStrips(a, b, drops));
    }
    if (q.level === 1) showStrips(false);
    var area = el('div', { class: 'flu-col' });
    stage.appendChild(area);

    function finalState() {
      box.textContent = q.sign;
      box.classList.add('flu-filled');
      showStrips(true);
      MQ.clear(area);
      var words = { '<': 'is less than', '>': 'is greater than', '=': 'is equal to' };
      area.appendChild(el('div', { class: 'flu-say', html: fracHTML(a) + ' ' + words[q.sign] + ' ' + fracHTML(b) }));
    }

    function step1() {
      var opts = [
        { label: fracHTML(a), value: 'a' },
        { label: fracHTML(b), value: 'b' },
      ];
      if (q.level > 1) opts.push({ label: 'The same', value: 'same' });
      var ch = choices(opts, function (v) {
        if (v === bigger) {
          ch.mark(v, 'good');
          ch.disable();
          api.sound('pop');
          api.feedback(bigger === 'same' ? 'Yes, they are the same size!' : 'Yes! ' + fracText(bigF) + ' is bigger.', 'good');
          if (q.level > 1) showStrips(false);
          api.later(step2, 700);
          return;
        }
        ch.mark(v, 'bad');
        var second = api.tries() >= 1;
        if (q.level > 1) showStrips(second);
        if (bigger === 'same') {
          api.check(false, second ? 'Look at the red line: both strips end in the same place. ' + fracText(a) + ' and ' + fracText(b) + ' are the same amount.' : 'The numbers look different, but check the size. Do they cover the same amount?', 'Equal fractions marked as different');
        } else if (v === 'same') {
          api.check(false, 'Look closely: one strip is longer. They are not the same size.', 'Thought different fractions were equal');
        } else if (q.kind === 'unit') {
          api.check(
            false,
            second ? fracText(F(1, bigF.d)) + ' is 1 of ' + bigF.d + ' pieces. ' + fracText(F(1, smallF.d)) + ' is 1 of ' + smallF.d + ' smaller pieces. Which strip is longer?' : 'More pieces in the whole means each piece is smaller. Look at the strips.',
            'Thinks bigger bottom number is bigger'
          );
        } else {
          api.check(false, second ? 'Both are cut into ' + a.d + ' equal pieces. ' + fracText(bigF) + ' has ' + bigF.n + ' pieces, ' + fracText(smallF) + ' has only ' + smallF.n + '.' : 'The bottom numbers are the same, so the pieces are the same size. Who has more pieces?', 'Compared the wrong numbers');
        }
      }, { columns: opts.length });
      area.appendChild(ch);
    }
    function step2() {
      if (api.isAnswered()) return;
      MQ.clear(area);
      prompt.innerHTML = 'Now choose the sign.';
      api.say('The open mouth faces the bigger amount.', 'think');
      var ch = signChoices(signs, function (v) {
        if (v === q.sign) {
          ch.mark(v, 'good');
          ch.disable();
          finalState();
          api.check(true, 'Yes! ' + fracText(a) + ' ' + q.sign + ' ' + fracText(b));
          return;
        }
        ch.mark(v, 'bad');
        if (q.sign === '=') api.check(false, 'They are the same size, so use =.', 'Equal fractions marked as different');
        else if (v === '=') api.check(false, 'They are not the same size, so it is not =. Which way does the mouth open?', 'Thought different fractions were equal');
        else api.check(false, api.tries() >= 1 ? 'The open side must face ' + fracText(bigF) + ', the bigger one. ' + (q.sign === '<' ? 'Open on the right: <' : 'Open on the left: >') : 'The open mouth faces the bigger amount. ' + fracText(bigF) + ' is bigger.', 'Sign the wrong way round');
      }, { columns: signs.length });
      area.appendChild(ch);
    }
    step1();
    api.onReveal(function () {
      prompt.innerHTML = 'Which is bigger?';
      finalState();
      api.feedback(q.sign === '=' ? 'Both strips end at the same red line, so ' + fracText(a) + ' = ' + fracText(b) + '.' : fracText(bigF) + ' is the longer strip. The open mouth faces it: ' + fracText(a) + ' ' + q.sign + ' ' + fracText(b) + '.', 'info');
    });
  }

  function renderContext(stage, api, q) {
    var ctx = q.ctx;
    api.say('Which share gives you more ' + ctx.thing + '?', 'think');
    stage.appendChild(MQ.ui.prompt(ctx.icon + ' Which gives you more ' + ctx.thing + ': ' + fracHTML(q.a) + ' of it or ' + fracHTML(q.b) + ' of it?'));
    var pic = el('div', { class: 'flu-col' });
    stage.appendChild(pic);
    function draw(shaded) {
      MQ.clear(pic);
      var s = strips([{ f: q.a, shade: shaded ? 1 : 0, color: ctx.color }, { f: q.b, shade: shaded ? 1 : 0, color: ctx.color }], { W: 520, rowH: 46, gap: 14 });
      if (shaded) {
        s.drop(1 / q.a.d, cmp(q.a, q.b) > 0 ? '' : 'flu-drop2');
        s.drop(1 / q.b.d, cmp(q.b, q.a) > 0 ? '' : 'flu-drop2');
      }
      pic.appendChild(s.svg);
      pic.appendChild(el('div', { class: 'flu-caption' }, 'Two ' + ctx.many + ', the same size, cut in two ways.'));
    }
    draw(false);
    var bigF = q.answer === 'a' ? q.a : q.b;
    var smallF = q.answer === 'a' ? q.b : q.a;
    var ch = choices(
      [
        { label: fracHTML(q.a) + ' of the ' + ctx.thing, value: 'a' },
        { label: fracHTML(q.b) + ' of the ' + ctx.thing, value: 'b' },
      ],
      function (v) {
        if (v === q.answer) {
          ch.mark(v, 'good');
          ch.disable();
          draw(true);
          api.check(true, 'Yes! ' + fracText(bigF) + ' > ' + fracText(smallF) + '. Fewer pieces means bigger pieces.');
        } else {
          ch.mark(v, 'bad');
          api.check(false, api.tries() >= 1 ? 'Look at ONE piece in each picture. Cut into ' + bigF.d + ' or into ' + smallF.d + ': which piece is longer?' : 'Cutting into more pieces makes each piece smaller.', 'Thinks bigger bottom number is bigger');
        }
      },
      { columns: 2 }
    );
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(q.answer, 'good');
      ch.disable();
      draw(true);
      api.feedback(fracText(bigF) + ' is cut into ' + bigF.d + ' pieces, so each piece is bigger than ' + fracText(smallF) + ' (' + smallF.d + ' pieces). ' + fracText(bigF) + ' > ' + fracText(smallF) + '.', 'info');
    });
  }

  function renderBetween(stage, api, q) {
    var loTxt = fracHTML(q.lo);
    var hiTxt = fracHTML(q.hi);
    api.say('Find a fraction that ends inside the yellow part of the wall.', 'think');
    stage.appendChild(MQ.ui.prompt('Pick a fraction that is <b>between</b> ' + loTxt + ' and ' + hiTxt + '.'));
    var w = wall([1, 2, 3, 4, 5, 10], { rowH: 36 });
    w.zone(q.lo.n / q.lo.d, q.hi.n / q.hi.d);
    w.drop(q.lo.n / q.lo.d);
    w.drop(q.hi.n / q.hi.d);
    stage.appendChild(w.svg);
    var shownRow = null;
    function shadeOnly(f) {
      w.rows.forEach(function (r) {
        r.pieces.forEach(function (p) {
          p.classList.remove('flu-on', 'flu-off');
        });
      });
      shownRow = f;
      if (f) {
        var r = w.row(f.d);
        r.pieces.forEach(function (p, i) {
          if (i < f.n) p.classList.add(inside(f, q.lo, q.hi) ? 'flu-on' : 'flu-off');
        });
      }
    }
    var ch = choices(
      q.options.map(function (f) {
        return { label: fracHTML(f), value: key(f) };
      }),
      function (v) {
        var f = q.options.filter(function (o) { return key(o) === v; })[0];
        if (q.valid.indexOf(v) !== -1) {
          ch.mark(v, 'good');
          ch.disable();
          shadeOnly(f);
          api.check(true, 'Yes! ' + fracText(f) + ' ends inside the yellow part.');
          return;
        }
        ch.mark(v, 'bad');
        var onEdge = cmp(f, q.lo) === 0 || cmp(f, q.hi) === 0;
        if (api.tries() >= 1) shadeOnly(f);
        var hint;
        if (onEdge) hint = fracText(f) + ' is exactly the same size as ' + fracText(cmp(f, q.lo) === 0 ? q.lo : q.hi) + '. It sits on the red line, not between.';
        else if (api.tries() >= 1) hint = 'See where ' + fracText(f) + ' ends on the wall: it is outside the yellow part. Try another.';
        else hint = 'Find ' + fracText(f) + ' on the wall. Where does it end? It must end inside the yellow part.';
        api.check(false, hint, 'Fraction outside the range');
      },
      { columns: q.options.length }
    );
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.disable();
      q.valid.forEach(function (v) {
        ch.mark(v, 'good');
      });
      var f = q.options.filter(function (o) { return q.valid.indexOf(key(o)) !== -1; })[0];
      shadeOnly(f);
      api.feedback(q.valid.map(function (v) { return v; }).join(' and ') + ' end inside the yellow part, between ' + fracText(q.lo) + ' and ' + fracText(q.hi) + '.', 'info');
    });
  }

  function renderOrder(stage, api, q) {
    var up = q.dir === 'up';
    api.say(up ? 'Smallest first! Follow the arrow.' : 'Largest first this time! Follow the arrow.', 'think');
    stage.appendChild(MQ.ui.prompt('Put them in order. Start with the <b>' + (up ? 'smallest' : 'largest') + '</b>.'));
    stage.appendChild(el('div', { class: 'flu-arrow', 'data-dir': q.dir }, el('span', { class: 'flu-arrow-end' }, up ? 'smallest' : 'largest'), el('span', { class: 'flu-arrow-bar' }), el('span', { class: 'flu-arrow-end' }, up ? 'largest' : 'smallest')));
    var slotsRow = el('div', { class: 'flu-slots' });
    var pool = el('div', { class: 'flu-pool' });
    var pic = el('div', { class: 'flu-col' });
    var order = [];
    var locked = false;
    var checkBtn = el('button', { class: 'btn flu-check', type: 'button', onclick: check }, 'Check');
    stage.appendChild(slotsRow);
    stage.appendChild(pool);
    stage.appendChild(checkBtn);
    stage.appendChild(pic);

    function card(i) {
      return el('button', { class: 'flu-ocard', type: 'button', 'data-idx': i, 'data-key': key(q.items[i]), html: fracHTML(q.items[i]) });
    }
    function draw() {
      MQ.clear(slotsRow);
      MQ.clear(pool);
      for (var s = 0; s < q.items.length; s++) {
        var slot = el('div', { class: 'flu-slot', 'data-slot': s });
        if (s < order.length) {
          (function (pos) {
            var c = card(order[pos]);
            c.addEventListener('click', function () {
              if (locked) return;
              MQ.sound('click');
              order.splice(pos, 1);
              draw();
            });
            slot.appendChild(c);
          })(s);
        }
        slotsRow.appendChild(slot);
      }
      q.items.forEach(function (f, i) {
        if (order.indexOf(i) !== -1) return;
        var c = card(i);
        c.addEventListener('click', function () {
          if (locked) return;
          MQ.sound('click');
          order.push(i);
          draw();
        });
        pool.appendChild(c);
      });
      pool.style.display = order.length === q.items.length ? 'none' : '';
    }
    function showStrips() {
      MQ.clear(pic);
      var items = q.answer.map(function (k) {
        return q.items.filter(function (f) { return key(f) === k; })[0];
      });
      pic.appendChild(strips(items.map(function (f) { return { f: f }; }), { W: 440, rowH: 24, gap: 5 }).svg);
    }
    function finish() {
      locked = true;
      checkBtn.style.display = 'none';
      order = q.answer.map(function (k) {
        for (var i = 0; i < q.items.length; i++) if (key(q.items[i]) === k) return i;
      });
      draw();
      Array.prototype.forEach.call(slotsRow.querySelectorAll('.flu-ocard'), function (c) {
        c.classList.add('flu-good');
      });
      showStrips();
    }
    function check() {
      if (locked) return;
      if (order.length < q.items.length) {
        api.feedback('Put all ' + q.items.length + ' cards in the row first.', 'info');
        return;
      }
      var got = order.map(function (i) { return key(q.items[i]); });
      if (got.join() === q.answer.join()) {
        finish();
        api.check(true, 'Perfect order! Look how the strips ' + (up ? 'grow' : 'shrink') + '.');
        return;
      }
      var second = api.tries() >= 1;
      if (got.join() === q.answer.slice().reverse().join()) {
        api.check(false, 'Look at the arrow! This row starts with the ' + (up ? 'smallest' : 'largest') + '. Your order is back to front.', 'Ordered in the wrong direction');
      } else if (q.unit) {
        if (second) showStrips();
        api.check(false, second ? 'Use the strips below: the shortest is 1/10, the longest is 1/2.' : 'Remember: more pieces means smaller pieces. Which is the ' + (up ? 'smallest' : 'largest') + '?', 'Thinks bigger bottom number is bigger');
      } else {
        if (second) showStrips();
        api.check(false, second ? 'Use the strips below to check each one.' : 'They are all tenths, so compare the top numbers.', 'Mixed up the order');
      }
    }
    draw();
    api.onReveal(function () {
      finish();
      api.feedback('The strips show the order: ' + q.answer.join(', ') + ' (' + (up ? 'smallest to largest' : 'largest to smallest') + ').', 'info');
    });
  }

  function renderLine(stage, api, q) {
    api.say('Choose how many equal parts, then put each fraction on its mark.', 'think');
    stage.appendChild(MQ.ui.prompt('Put ' + q.cards.map(fracHTML).join(' ') + ' on the line.'));
    var done = false;
    var board = lineBoard(api, {
      cards: q.cards,
      half: false,
      locked: function () {
        return api.isAnswered();
      },
      onDrop: function (i, k, d) {
        var f = q.cards[i];
        if (cmp(F(k, d), f) === 0) {
          api.feedback(fracText(f) + ' is in the right place.', 'good');
          return true;
        }
        var second = api.tries() >= 1;
        if (d !== f.d) {
          api.check(false, second ? fracText(f) + ' needs the line cut into ' + f.d + ' equal parts. Press "' + f.d + ' parts", then count ' + f.n + ' gaps from 0.' : 'Those marks are ' + DEN_NAME[d] + '. ' + fracText(f) + ' needs ' + DEN_NAME[f.d] + '.', 'Uneven spacing on the line');
        } else {
          api.check(false, second ? 'Start at 0 and count ' + f.n + ' gaps (jumps), not the marks.' : 'Count the gaps from 0. ' + fracText(f) + ' is ' + f.n + ' gaps along.', 'Counted the marks, not the gaps');
        }
        return false;
      },
      onAll: function () {
        if (done || api.isAnswered()) return;
        done = true;
        api.check(true, 'All in the right places!');
      },
    });
    stage.appendChild(board.el);
    api.onReveal(function () {
      done = true;
      board.reveal();
      var sorted = q.cards.slice().sort(cmp);
      var dn = { 2: 'Halves', 3: 'Thirds', 4: 'Quarters', 5: 'Fifths', 10: 'Tenths' };
      var ds = [];
      q.cards.forEach(function (c) { var nm = dn[c.d] || c.d + 'ths'; if (ds.indexOf(nm) === -1) ds.push(nm); });
      api.feedback(ds.join(' and ') + ' are drawn on the line. In order: ' + sorted.map(fracText).join(', ') + '.', 'info');
    });
  }

  function renderMoney(stage, api, q) {
    api.say('Which share of the money is bigger?', 'think');
    stage.appendChild(MQ.ui.prompt('You can have ' + fracHTML(q.a) + ' of $100 or ' + fracHTML(q.b) + ' of $100. Which gives you more?'));
    var pic = el('div', { class: 'flu-col' });
    stage.appendChild(pic);
    var NW = 120;
    var L = 80;
    function notes(svg, y) {
      for (var i = 0; i < 5; i++) {
        var g = S('g', { class: 'flu-note' });
        g.appendChild(S('rect', { x: L + i * NW + 3, y: y, width: NW - 6, height: 52, rx: 6 }));
        g.appendChild(S('text', { x: L + i * NW + NW / 2, y: y + 34, 'text-anchor': 'middle' }, '$20'));
        svg.appendChild(g);
      }
    }
    function draw(full) {
      MQ.clear(pic);
      var H = full ? 200 : 66;
      var svg = S('svg', { viewBox: '0 0 ' + (L + 5 * NW + 16) + ' ' + H, width: L + 5 * NW + 16, height: H, class: 'flu-svg flu-money' });
      svg.appendChild(S('text', { x: L - 12, y: 40, 'text-anchor': 'end', class: 'flu-mlabel' }, '$100'));
      notes(svg, 6);
      pic.appendChild(svg);
      if (!full) return;
      // to scale: the $100 strip is 5 × 120 = 600 px, so $1 = 6 px
      [[q.a, 76, 'about $33'], [q.b, 136, '$25']].forEach(function (row) {
        var f = row[0];
        svg.appendChild(svgFrac(L - 30, row[1] + 24, f, 18));
        for (var i = 0; i < f.d; i++) {
          svg.appendChild(S('rect', { x: L + (600 * i) / f.d, y: row[1], width: 600 / f.d, height: 48, class: 'flu-srect' + (i === 0 ? ' flu-son' : ''), fill: i === 0 ? DEN_COL[f.d] : '#fff' }));
          svg.appendChild(S('text', { x: L + (600 * (i + 0.5)) / f.d, y: row[1] + 31, 'text-anchor': 'middle', class: 'flu-mtext' }, row[2]));
        }
      });
      pic.appendChild(el('div', { class: 'flu-chips' }, chip('$33'), '+', chip('$33'), '+', chip('$33'), '=', chip('$99'), el('span', { class: 'flu-small' }, '(and $1 left over)')));
      pic.appendChild(el('div', { class: 'flu-chips' }, chip('$25'), '+', chip('$25'), '+', chip('$25'), '+', chip('$25'), '=', chip('$100')));
    }
    function chip(t) {
      return el('span', { class: 'chip' }, t);
    }
    draw(false);
    var ch = choices(
      [
        { label: fracHTML(q.a) + ' of $100', value: 'a' },
        { label: fracHTML(q.b) + ' of $100', value: 'b' },
      ],
      function (v) {
        if (v === q.answer) {
          ch.mark(v, 'good');
          ch.disable();
          draw(true);
          api.check(true, 'Yes! 1/3 of $100 is about $33. 1/4 is only $25.');
        } else {
          ch.mark(v, 'bad');
          api.check(false, api.tries() >= 1 ? 'Share $100 between 3 people, or between 4 people. When does each person get more?' : 'The 4 in 1/4 means sharing between 4. More shares means smaller shares.', 'Thinks bigger bottom number is bigger');
        }
      },
      { columns: 2 }
    );
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(q.answer, 'good');
      ch.disable();
      draw(true);
      api.feedback('Share $100 into 4: $25 each. Share into 3: about $33 each. So 1/3 of $100 is more.', 'info');
    });
  }

  MQ.register(ID, {
    learn: [learnWall, learnLine, learnSigns, learnChoc],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'cmp') renderCmp(stage, api, q);
        else if (q.type === 'context') renderContext(stage, api, q);
        else if (q.type === 'between') renderBetween(stage, api, q);
        else if (q.type === 'order') renderOrder(stage, api, q);
        else if (q.type === 'line') renderLine(stage, api, q);
        else renderMoney(stage, api, q);
      },
    },
    _buildDeck: buildDeck, // used by the deck test only
  });

  var css = [
    '.flu-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;margin:0 .12em;font-weight:800}',
    '.flu-fn{padding:0 .14em}',
    '.flu-fd{border-top:.09em solid currentColor;padding:0 .14em}',
    '.flu-whole{font-weight:800}',
    '.flu-svg{display:block;max-width:100%;height:auto;margin:0 auto}',
    '.flu-col{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;max-width:760px}',
    '.flu-big{font-size:2.5rem;color:var(--ink)}',
    '.flu-cmp{display:flex;align-items:center;justify-content:center;gap:18px}',
    '.flu-signbox{min-width:72px;height:72px;border:4px dashed var(--line);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:2.6rem;font-weight:900;color:var(--ink-soft);background:#fff}',
    '.flu-signbox.flu-filled{border-style:solid;border-color:var(--good);color:var(--good);background:var(--good-bg)}',
    '.flu-choices .choice .flu-frac{font-size:1.25em}',
    '.flu-choices{max-width:720px}',
    '.flu-signsym{display:block;font-size:2rem;line-height:1}',
    '.flu-signword{display:block;font-size:.8rem;font-weight:700;opacity:.75}',
    '.flu-result{display:flex;align-items:center;justify-content:center;gap:10px;font-size:2rem;font-weight:800;min-height:64px;flex-wrap:wrap}',
    '.flu-sign{font-size:2.4rem;font-weight:900;color:var(--good);margin:0 6px}',
    '.flu-or{font-size:1rem;font-weight:700;color:var(--ink-soft);margin:0 12px}',
    '.flu-say{font-size:1.4rem;font-weight:800;color:var(--good)}',
    '.flu-caption{font-size:.95rem;color:var(--ink-soft)}',
    '.flu-prect,.flu-srect{stroke:#33415c;stroke-width:1.5}',
    '.flu-piece.flu-on .flu-prect{fill:#ffb703}',
    '.flu-piece.flu-off .flu-prect{fill:#f4a6a6}',
    '.flu-click{cursor:pointer}',
    '.flu-click:hover .flu-prect{stroke-width:3}',
    '.flu-ptext{font-size:17px;font-weight:800;fill:#1d2b3a}',
    '.flu-sfrac text{font-weight:800;fill:#1d2b3a}',
    '.flu-sfrac line{stroke:#1d2b3a;stroke-width:2}',
    '.flu-muted text{fill:#6c7a89}.flu-muted line{stroke:#6c7a89}',
    '.flu-over{pointer-events:none}',
    '.flu-drop{stroke:#d62828;stroke-width:3;stroke-dasharray:7 5}',
    '.flu-drop2{stroke:#1d4ed8}',
    '.flu-zone{fill:rgba(255,200,40,.32);stroke:none}',
    '.flu-axis{stroke:#1d2b3a;stroke-width:4;stroke-linecap:round}',
    '.flu-endtick{stroke:#1d2b3a;stroke-width:4}',
    '.flu-tickline{stroke:#1d2b3a;stroke-width:3}',
    '.flu-halftick{stroke:#8d99ae;stroke-width:3;stroke-dasharray:4 4}',
    '.flu-revtick{stroke-width:4}.flu-rev-3{stroke:#2d6a4f}.flu-rev-10{stroke:#b5179e}.flu-rev-4{stroke:#0077b6}.flu-rev-5{stroke:#5a189a}.flu-rev-2{stroke:#e85d04}',
    '.flu-revlabel text{fill:#0b6e66}.flu-revlabel line{stroke:#0b6e66}',
    '.flu-num-label{font-size:24px;font-weight:800;fill:#1d2b3a}',
    '.flu-tick{fill:transparent;cursor:pointer}',
    '.flu-tick:hover{fill:rgba(46,196,182,.18)}',
    '.flu-lcard-bg{fill:#fff;stroke:#33415c;stroke-width:2.5}',
    '.flu-lcard.flu-sel .flu-lcard-bg{stroke:var(--accent);stroke-width:5;fill:#e8fbf9}',
    '.flu-lcard.flu-placed .flu-lcard-bg{fill:var(--good-bg);stroke:var(--good)}',
    '.flu-lcard-ptr{stroke:var(--good);stroke-width:3;display:none}',
    '.flu-lcard.flu-placed .flu-lcard-ptr{display:inline}',
    '.flu-lineboard{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;max-width:760px}',
    '.flu-dens{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.flu-den{border:3px solid var(--line);background:#fff;border-radius:12px;padding:6px 14px;font:inherit;font-weight:800;font-size:1.05rem;cursor:pointer;color:var(--ink);line-height:1.15}',
    '.flu-den small{display:block;font-weight:600;color:var(--ink-soft);font-size:.75rem}',
    '.flu-den:hover{border-color:var(--accent)}',
    '.flu-den-on{border-color:var(--accent);background:#e8fbf9}',
    '.flu-arrow{display:flex;align-items:center;gap:12px;width:100%;max-width:600px;font-weight:800;font-size:1.1rem}',
    '.flu-arrow-bar{flex:1;height:8px;background:var(--accent);border-radius:4px;position:relative;margin-right:16px}',
    '.flu-arrow-bar:after{content:"";position:absolute;right:-16px;top:-10px;border-left:20px solid var(--accent);border-top:14px solid transparent;border-bottom:14px solid transparent}',
    '.flu-slots,.flu-pool{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}',
    '.flu-slot{width:88px;height:100px;border:3px dashed var(--line);border-radius:14px;display:flex;align-items:center;justify-content:center;background:#fafafa}',
    '.flu-ocard{width:80px;height:92px;border:3px solid #33415c;border-radius:12px;background:#fff;font-size:1.8rem;cursor:pointer;font-family:inherit;color:var(--ink);padding:0}',
    '.flu-ocard:hover{border-color:var(--accent)}',
    '.flu-slot .flu-ocard{border-color:var(--accent)}',
    '.flu-slot .flu-ocard.flu-good{border-color:var(--good);background:var(--good-bg)}',
    '.flu-choc-sq{fill:#a8724d;stroke:#5c3b22;stroke-width:2}',
    '.flu-choc-on{fill:#ffb703;stroke:#9a6b00}',
    '.flu-choc-cut{stroke:#d62828;stroke-width:4}',
    '.flu-note rect{fill:#b7e4c7;stroke:#2d6a4f;stroke-width:2}',
    '.flu-note text{fill:#1b4332;font-weight:800;font-size:22px}',
    '.flu-mlabel{font-size:22px;font-weight:800;fill:#1d2b3a}',
    '.flu-mtext{font-size:18px;font-weight:800;fill:#1d2b3a}',
    '.flu-chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;font-weight:800;font-size:1.1rem}',
    '.flu-small{font-size:.9rem;color:var(--ink-soft);font-weight:600}',
    '@media (max-width:700px){.flu-big{font-size:2rem}.flu-slot{width:70px;height:86px}.flu-ocard{width:62px;height:78px;font-size:1.5rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

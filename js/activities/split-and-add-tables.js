/* Split and Add (3s, 6s, 9s) (Unit 5.3): build the 6s from the 3s, the 9s from the 6s and 3s, and
 * split a hard fact into two easy parts and add them. Arrays: rows = number of groups, columns =
 * group size; written "group size × number of groups". CSS prefix: sa- */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;
  var ID = 'split-and-add-tables';

  // Readable mistake tags for the parent dashboard
  var TAG = {
    doubled6: 'Doubled the 6s to get the 9s (6 + 6 = 12, not 9)',
    notAdded: 'Split the fact but forgot to add the two parts',
    splitBoth: 'Split both numbers (only the group size splits; the number of groups stays)',
    wallAdd: 'Added the bricks in the wall instead of multiplying',
    mix: 'Mixed up 6 × 7 = 42 and 6 × 8 = 48',
    count: 'Counting-on error in 3s or 6s',
    sameGroups: 'Kept the same number of groups when matching a 3× and a 6× fact',
    match: 'Matched two facts that do not have the same answer',
    parts: 'The two parts did not add up to the group size',
    fact: 'Multiplication fact error in one part',
    addErr: 'Added the two parts wrongly',
    dbl: 'Doubling error (3× answer → 6× answer)',
    zero: 'Thought × 0 keeps the number (anything × 0 is 0)',
    tenOne: 'Took away 1 instead of one for EACH group (10 × n − n)',
    tens: 'Times-10 error',
    sub: 'Subtraction error (10 lots − 1 lot)',
    webFalse: 'Picked a fact that is not true',
    webMiss: 'Missed some connected facts',
  };

  var COL = { a: '#3a86ff', b: '#f4a261', c: '#06a77d', grey: '#9aa8c7', red: '#e63946' };

  function rep(x, n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(x);
    return a;
  }
  function mixup(x, y, v) {
    var lo = Math.min(x, y);
    var hi = Math.max(x, y);
    return (lo === 6 && hi === 7 && v === 48) || (lo === 6 && hi === 8 && v === 42);
  }
  function addText(x, y) {
    // "15 + 12 = 27" as tens and ones help: 15 + 12 = 10 + 10 + 5 + 2
    var t = Math.floor(x / 10) * 10 + Math.floor(y / 10) * 10;
    var o = (x % 10) + (y % 10);
    if (x < 10 || y < 10) return x + ' + ' + y + ' = ?';
    return x + ' + ' + y + ': tens ' + t + ', ones ' + (x % 10) + ' + ' + (y % 10) + ' = ' + o + '. So ' + t + ' + ' + o + ' = ?';
  }
  function sumRow(x, n) {
    var r = MQ.ui.sum(rep(x, n), x * n);
    r.classList.add('sa-sum');
    return r;
  }
  function say(html, cls) {
    return el('div', { class: 'sa-say' + (cls ? ' ' + cls : ''), html: html });
  }
  function note(t) {
    return el('div', { class: 'sa-note' }, t);
  }

  /* ------------------------------------------------------------------ *
   * Array SVG. rows = number of groups, columns = group size.
   * ------------------------------------------------------------------ */
  function makeArr(cfg) {
    var P = cfg.pad == null ? 16 : cfg.pad;
    var TOP = cfg.top == null ? 34 : cfg.top;
    var cell = cfg.cell;
    var W = 2 * P + cfg.cols * cell;
    var H = TOP + cfg.rows * cell + P;
    var svgEl = S('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'sa-arr', style: { maxWidth: '100%', height: 'auto' } });
    svgEl.appendChild(S('rect', { x: 2, y: TOP - 6, width: W - 4, height: cfg.rows * cell + 12, rx: 12, class: 'sa-tray' }));
    for (var r = 0; r < cfg.rows; r++) {
      svgEl.appendChild(S('rect', { x: 6, y: TOP + r * cell + 1, width: W - 12, height: cell - 2, rx: cell / 2 - 1, class: 'sa-band' }));
    }
    var o = { svg: svgEl, cell: cell, P: P, top: TOP, bot: TOP + cfg.rows * cell, W: W, H: H, rows: cfg.rows, cols: cfg.cols, dots: [] };
    o.x = function (c) {
      return P + c * cell + cell / 2;
    };
    o.y = function (rr) {
      return TOP + rr * cell + cell / 2;
    };
    o.bx = function (k) {
      return P + k * cell;
    };
    var dotsG = S('g');
    svgEl.appendChild(dotsG);
    for (r = 0; r < cfg.rows; r++) {
      o.dots.push([]);
      for (var c = 0; c < cfg.cols; c++) {
        var d = S('circle', { cx: o.x(c), cy: o.y(r), r: cell * 0.33, class: 'sa-dot', fill: cfg.colorOf ? cfg.colorOf(r, c) : COL.a });
        dotsG.appendChild(d);
        o.dots[r].push(d);
      }
    }
    o.over = S('g');
    svgEl.appendChild(o.over);
    o.recolor = function (fn) {
      for (var rr = 0; rr < o.rows; rr++) {
        for (var cc = 0; cc < o.cols; cc++) o.dots[rr][cc].setAttribute('fill', fn(rr, cc));
      }
    };
    // brace + number over columns [c0, c1)
    o.brace = function (g, c0, c1, color, text) {
      var x0 = o.bx(c0) + 3;
      var x1 = o.bx(c1) - 3;
      g.appendChild(S('path', { d: 'M' + x0 + ' ' + (TOP - 9) + ' v-5 H' + x1 + ' v5', class: 'sa-brace', stroke: color }));
      g.appendChild(S('text', { x: (x0 + x1) / 2, y: TOP - 18, 'text-anchor': 'middle', class: 'sa-blab', fill: color }, text));
    };
    return o;
  }

  function cellFor(rows, cols, maxW, maxH, big) {
    return Math.max(14, Math.min(big || 34, Math.floor(maxW / cols), Math.floor(maxH / Math.max(rows, 1))));
  }

  /* Array with a draggable / clickable vertical split line between columns. */
  function makeSplitArr(cfg) {
    var n = cfg.rows;
    var s = cfg.cols;
    var A = makeArr({ rows: n, cols: s, cell: cfg.cell, top: 52, pad: 20, colorOf: function () {
      return COL.grey;
    } });
    var o = { pos: s, locked: false, arr: A };
    var labels = S('g');
    A.svg.appendChild(labels);
    var lineG = S('g', { class: 'sa-cut', 'data-pos': s });
    var y1 = A.top - 30;
    var y2 = A.bot + 10;
    var hit = S('rect', { x: -16, y: y1 - 14, width: 32, height: y2 - y1 + 18, fill: 'transparent' });
    var line = S('line', { x1: 0, y1: y1, x2: 0, y2: y2, class: 'sa-cutline' });
    var knob = S('circle', { cx: 0, cy: y1, r: 13, class: 'sa-knob' });
    var arrows = S('text', { x: 0, y: y1 + 6, 'text-anchor': 'middle', class: 'sa-knobt' }, '↔');
    lineG.appendChild(hit);
    lineG.appendChild(line);
    lineG.appendChild(knob);
    lineG.appendChild(arrows);
    A.svg.appendChild(lineG);
    var curX = A.bx(s);
    function place(x) {
      curX = x;
      lineG.setAttribute('transform', 'translate(' + x + ',0)');
    }
    function paint() {
      MQ.clear(labels);
      var k = o.pos;
      lineG.setAttribute('data-pos', k);
      if (k > 0 && k < s) {
        A.recolor(function (r, c) {
          return c < k ? COL.a : COL.b;
        });
        A.brace(labels, 0, k, COL.a, String(k));
        A.brace(labels, k, s, COL.b, String(s - k));
        lineG.classList.remove('sa-parked');
      } else {
        A.recolor(function () {
          return COL.grey;
        });
        A.brace(labels, 0, s, '#5b6b8c', String(s));
        lineG.classList.add('sa-parked');
      }
    }
    o.setPos = function (k, quiet) {
      o.pos = k;
      place(A.bx(k));
      paint();
      if (!quiet && cfg.onChange) cfg.onChange(k);
    };
    var base = 0;
    var unbind = MQ.ui.drag(A.svg, lineG, {
      start: function () {
        base = curX;
      },
      move: function (p, dx) {
        if (o.locked) return;
        place(U.clamp(base + dx, A.bx(0), A.bx(s)));
      },
      end: function () {
        if (o.locked) return;
        var k = U.clamp(Math.round((curX - A.P) / A.cell), 1, s - 1);
        MQ.sound('pop');
        o.setPos(k);
      },
    });
    A.svg.addEventListener('click', function (e) {
      if (o.locked) return;
      var p = MQ.ui.svgPoint(A.svg, e);
      if (p.y < A.top - 8 || p.y > A.bot + 6) return;
      var k = Math.round((p.x - A.P) / A.cell);
      if (k < 1 || k > s - 1 || k === o.pos) return;
      MQ.sound('pop');
      o.setPos(k);
    });
    o.unbind = unbind;
    o.lock = function () {
      o.locked = true;
      lineG.classList.add('sa-locked');
    };
    o.el = el('div', { class: 'sa-arrwrap' }, A.svg);
    o.setPos(cfg.start == null ? s : cfg.start, true);
    return o;
  }

  /* ------------------------------------------------------------------ *
   * Number boxes
   * ------------------------------------------------------------------ */
  function Boxes(onEnter) {
    var map = {};
    var b = { map: map };
    b.make = function (k, cap, extra) {
      var inp = el('input', { class: 'sa-box' + (extra ? ' ' + extra : ''), type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: '3', 'data-slot': k, 'aria-label': cap || 'answer', placeholder: '?' });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          onEnter();
        }
      });
      inp.addEventListener('input', function () {
        inp.classList.remove('sa-good', 'sa-bad');
      });
      map[k] = inp;
      return inp;
    };
    b.val = function (k) {
      var raw = map[k].value.trim();
      if (raw === '') return null;
      var n = U.parseNum(raw);
      return isNaN(n) ? null : n;
    };
    b.empty = function () {
      return Object.keys(map).some(function (k) {
        return b.val(k) === null;
      });
    };
    b.mark = function (k, ok) {
      map[k].classList.remove('sa-good', 'sa-bad');
      map[k].classList.add(ok ? 'sa-good' : 'sa-bad');
    };
    b.set = function (k, v) {
      map[k].value = String(v);
      map[k].classList.remove('sa-bad');
      map[k].classList.add('sa-good');
    };
    b.lock = function () {
      Object.keys(map).forEach(function (k) {
        map[k].disabled = true;
      });
    };
    b.focus = function (k) {
      var key = k || Object.keys(map)[0];
      if (key && map[key]) {
        try {
          map[key].focus({ preventScroll: true });
        } catch (e) {}
      }
    };
    return b;
  }
  function checkBtn(fn) {
    return el('button', { class: 'btn sa-check', type: 'button', onclick: fn }, 'Check');
  }
  function op(t) {
    return el('span', { class: 'sa-op' }, t);
  }
  function num(v, cls) {
    return el('span', { class: 'sa-num' + (cls ? ' ' + cls : '') }, String(v));
  }

  /* Tap a card, or drag it onto a zone. */
  function cardDrag(api, card, zone, onDrop) {
    var start = null;
    var ghost = null;
    function move(e) {
      if (!start) return;
      if (!ghost && Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y) > 6) {
        ghost = el('div', { class: 'sa-ghost' }, card.textContent);
        document.body.appendChild(ghost);
      }
      if (ghost) {
        ghost.style.left = e.clientX + 'px';
        ghost.style.top = e.clientY + 'px';
      }
    }
    function up(e) {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (!start) return;
      start = null;
      if (ghost) {
        ghost.parentNode.removeChild(ghost);
        ghost = null;
        var under = document.elementFromPoint(e.clientX, e.clientY);
        if (under && zone.contains(under)) onDrop();
      } else onDrop();
    }
    card.addEventListener('pointerdown', function (e) {
      if (card.disabled) return;
      e.preventDefault();
      start = { x: e.clientX, y: e.clientY };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
    card.addEventListener('click', function (e) {
      if (e.detail === 0 && !card.disabled) onDrop();
    });
    api.cleanup(function () {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
    });
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  var deck = null;

  function webOptions(b) {
    var P = 6 * b;
    var other = b === 7 ? 8 : b === 8 ? 7 : b === 9 ? 8 : b + 1;
    var opts = [
      { text: b + ' × 6 = ' + P, ok: true, why: 'Turn the array: ' + b + ' × 6 is the same as 6 × ' + b + '.' },
      { text: P + ' ÷ 6 = ' + b, ok: true, why: P + ' shared into groups of 6 makes ' + b + ' groups.' },
      { text: P + ' ÷ ' + b + ' = 6', ok: true, why: P + ' shared into ' + b + ' equal groups gives 6 in each.' },
      { text: '3 × ' + b + ' = ' + P / 2, ok: true, why: 'Half the group size (6 → 3), half the answer (' + P + ' → ' + P / 2 + ').' },
      { text: '12 × ' + b + ' = ' + 2 * P, ok: true, why: 'Double the group size (6 → 12), double the answer (' + P + ' → ' + 2 * P + ').' },
      { text: '6 × ' + other + ' = ' + P, ok: false, kind: 'mix', why: '6 × ' + other + ' = ' + 6 * other + ', not ' + P + '.' },
      { text: '3 × ' + b + ' = ' + P, ok: false, kind: 'half', why: 'The group size halved (6 → 3), so the answer halves too: 3 × ' + b + ' = ' + P / 2 + '.' },
      { text: P + ' ÷ 3 = ' + b, ok: false, kind: 'div', why: P + ' in groups of 3 makes ' + P / 3 + ' groups, not ' + b + '.' },
    ];
    return U.shuffle(opts);
  }

  function buildDeck() {
    var q = [];
    // Level 1 (4): counting stick 3s and 6s, then match 3× and 6× facts with the same answer.
    var hide3 = U.shuffle(U.range(2, 10)).slice(0, 3).sort(function (a, b) {
      return a - b;
    });
    var k78 = U.pick([7, 8]);
    var hide6 = [k78].concat(U.shuffle(U.range(2, 10).filter(function (k) {
      return k !== 7 && k !== 8;
    })).slice(0, 2)).sort(function (a, b) {
      return a - b;
    });
    q.push({ type: 'stick', level: 1, s: 3, hide: hide3, vals: U.range(1, 10).map(function (k) {
      return 3 * k;
    }) });
    q.push({ type: 'stick', level: 1, s: 6, hide: hide6, vals: U.range(1, 10).map(function (k) {
      return 6 * k;
    }) });
    // pairs: 3 × 2n = 6 × n, n = 1..5
    var ns = U.shuffle([2, 3, 4, 5]).slice(0, 2);
    var dirs = U.shuffle(['6to3', '3to6']);
    ns.forEach(function (n, i) {
      var six = { s: 6, n: n, p: 6 * n };
      var three = { s: 3, n: 2 * n, p: 6 * n };
      var from = dirs[i] === '6to3' ? six : three;
      var to = dirs[i] === '6to3' ? three : six;
      var same = { s: to.s, n: from.n, p: to.s * from.n }; // kept the same number of groups
      var used = [to.n, same.n];
      var others = U.shuffle(U.range(1, 10).filter(function (k) {
        return used.indexOf(k) === -1;
      })).slice(0, 2).map(function (k) {
        return { s: to.s, n: k, p: to.s * k };
      });
      q.push({ type: 'same', level: 1, from: from, to: to, options: U.shuffle([to, same].concat(others)) });
    });

    // Level 2 (3): split arrays (two), then a multiplication wall.
    var s1 = U.pick([9, 8, 7]);
    var n1 = U.rand(3, 5);
    var s2 = s1 === 9 ? U.pick([6, 7, 8]) : 9;
    var n2 = U.rand(6, 9);
    [[s1, n1], [s2, n2]].forEach(function (p) {
      var s = p[0];
      var n = p[1];
      var a = s === 9 && U.pick([true, false]) ? 6 : s === 6 ? 3 : 5;
      q.push({ type: 'split', level: 2, s: s, n: n, T: s * n, sugg: [a, s - a] });
    });
    var walls = [[1, 3, 1], [9, 1, 2], [1, 6, 1], [3, 1, 9], [1, 9, 1], [3, 3, 3]];
    var wb = U.pick(walls);
    var mid = [wb[0] * wb[1], wb[1] * wb[2]];
    q.push({ type: 'wall', level: 2, bottom: wb, mid: mid, top: mid[0] * mid[1] });

    // Level 3 (3): 3× + 6× = 9× table (with × 0), 10 lots − 1 lot, connected facts.
    var used9 = [s1 === 9 ? n1 : n2];
    var tn = U.shuffle([3, 4, 6, 7, 8, 9, 10].filter(function (n) {
      return used9.indexOf(n) === -1;
    })).slice(0, 2);
    var rows = tn.map(function (n, i) {
      return { n: n, p3: 3 * n, p6: 6 * n, p9: 9 * n, hide: i === 0 ? ['p9'] : ['p6', 'p9'] };
    });
    rows.push({ n: 0, p3: 0, p6: 0, p9: 0, hide: ['p6', 'p9'] });
    q.push({ type: 'table', level: 3, rows: rows });
    var tenN = U.pick(U.range(3, 9).filter(function (n) {
      return used9.indexOf(n) === -1 && tn.indexOf(n) === -1;
    }));
    q.push({ type: 'ten', level: 3, n: tenN, ten: 10 * tenN, take: tenN, nine: 9 * tenN });
    var wbase = U.pick([4, 7, 8, 9]);
    q.push({ type: 'web', level: 3, a: 6, b: wbase, P: 6 * wbase, options: webOptions(wbase) });
    return q;
  }

  /* ------------------------------------------------------------------ *
   * Practice L1: counting stick
   * ------------------------------------------------------------------ */
  function renderStick(stage, api, q) {
    var s = q.s;
    api.say('Count in ' + s + 's along the stick. Tap it to make each jump!', 'think');
    stage.appendChild(MQ.ui.prompt('Fill in the missing numbers when you count in <b>' + s + 's</b>.'));
    var bx = Boxes(check);
    var stick = el('div', { class: 'sa-stick', 'data-step': s });
    var segs = [];
    stick.appendChild(el('div', { class: 'sa-zero' }, el('div', { class: 'sa-lab' }, num(0))));
    for (var k = 1; k <= 10; k++) {
      var hidden = q.hide.indexOf(k) !== -1;
      var lab = el('div', { class: 'sa-lab' }, hidden ? bx.make('k' + k, s + ' × ' + k) : num(q.vals[k - 1]));
      var seg = el('div', { class: 'sa-seg' + (k % 2 ? ' sa-odd' : ''), 'data-k': k }, el('div', { class: 'sa-hop' }, '+' + s), el('div', { class: 'sa-bar' }), lab, el('div', { class: 'sa-scap' }, s + ' × ' + k));
      segs.push(seg);
      stick.appendChild(seg);
    }
    var hops = 0;
    function hop() {
      if (hops >= 10) return;
      segs[hops].classList.add('sa-hopped');
      hops++;
      MQ.sound('pop');
    }
    stick.addEventListener('click', function (e) {
      if (e.target.tagName === 'INPUT') return;
      hop();
    });
    var jumpBtn = el('button', { class: 'btn btn-ghost sa-jump', type: 'button', onclick: hop }, 'Jump +' + s);
    var btn = checkBtn(check);
    var work = el('div', { class: 'sa-work' });
    stage.appendChild(el('div', { class: 'sa-stickwrap' }, stick));
    stage.appendChild(el('div', { class: 'sa-btnrow' }, jumpBtn, btn));
    stage.appendChild(work);
    bx.focus();

    function finish() {
      bx.lock();
      btn.disabled = true;
      jumpBtn.disabled = true;
      while (hops < 10) {
        segs[hops].classList.add('sa-hopped');
        hops++;
      }
      MQ.clear(work);
      work.appendChild(say('Count in ' + s + 's: ' + q.vals.join(', ')));
      if (s === 6) work.appendChild(note('Each 6 jump is two 3 jumps: the 6s are double the 3s.'));
    }
    function check() {
      if (api.isAnswered()) return;
      if (bx.empty()) {
        api.feedback('Write a number in every empty box, then press Check.', 'info');
        return;
      }
      var wrong = [];
      q.hide.forEach(function (kk) {
        var ok = bx.val('k' + kk) === s * kk;
        bx.mark('k' + kk, ok);
        if (!ok) wrong.push(kk);
      });
      if (!wrong.length) {
        finish();
        api.check(true, 'Yes! You counted in ' + s + 's all the way to ' + 10 * s + '.');
        return;
      }
      var kw = wrong[0];
      var v = bx.val('k' + kw);
      var prev = s * (kw - 1);
      if (s === 6 && mixup(6, kw, v)) {
        api.check(false, '6 × 7 = 42 and 6 × 8 = 48. They are easy to mix up! Start at ' + prev + ' and jump +6.', TAG.mix);
        return;
      }
      var second = api.tries() >= 1;
      api.check(false, second ? s + ' × ' + kw + ': start at ' + prev + ' and jump +' + s + '. ' + prev + ' + ' + s + ' = ?' : 'Check the box under ' + s + ' × ' + kw + '. What comes ' + s + ' after ' + prev + '?', TAG.count);
    }
    api.onReveal(function () {
      q.hide.forEach(function (kk) {
        bx.set('k' + kk, s * kk);
      });
      finish();
      api.feedback('Each jump adds ' + s + '. ' + q.hide.map(function (kk) {
        return s * (kk - 1) + ' + ' + s + ' = ' + s * kk;
      }).join(' · '), 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice L1: 3× and 6× facts with the same answer
   * ------------------------------------------------------------------ */
  function sameArr(f, cut) {
    // f.s is 3 or 6; colours show how the rows of 6 become rows of 3
    var cell = cellFor(f.n, f.s, 200, 250, 28);
    var A = makeArr({ rows: f.n, cols: f.s, cell: cell, colorOf: function (r, c) {
      if (f.s === 6) return c < 3 ? COL.a : COL.b;
      return r % 2 ? COL.b : COL.a;
    } });
    if (f.s === 6) {
      A.brace(A.over, 0, 6, '#5b6b8c', '6');
      if (cut) A.over.appendChild(S('line', { x1: A.bx(3), y1: A.top - 8, x2: A.bx(3), y2: A.bot + 8, class: 'sa-cutdash' }));
    } else {
      A.brace(A.over, 0, 3, '#5b6b8c', '3');
      if (cut) {
        for (var r = 0; r + 1 < f.n; r += 2) {
          A.over.appendChild(S('rect', { x: 6, y: A.top + r * A.cell + 2, width: A.W - 12, height: 2 * A.cell - 4, rx: 10, class: 'sa-pair' }));
        }
      }
    }
    return A;
  }
  function renderSame(stage, api, q) {
    var f = q.from;
    var t = q.to;
    api.say(f.s === 6 ? 'Cut each row of 6 into two rows of 3!' : 'Join the rows of 3 in pairs to make rows of 6!', 'think');
    stage.appendChild(MQ.ui.prompt('<b>' + f.s + ' × ' + f.n + ' = ' + f.p + '</b>. Which <b>' + t.s + '×</b> fact has the same answer?'));
    var left = el('div', { class: 'sa-left' });
    var A = sameArr(f, false);
    var arrBox = el('div', { class: 'sa-arrwrap' }, A.svg);
    var cap = note(f.n + ' rows of ' + f.s + ' = ' + f.p);
    var helpBtn = el('button', { class: 'btn btn-ghost sa-help', type: 'button', 'data-act': 'cut' }, f.s === 6 ? '✂ Cut each row in half' : '🔗 Join rows in pairs');
    helpBtn.addEventListener('click', function () {
      helpBtn.disabled = true;
      MQ.sound('pop');
      MQ.clear(arrBox);
      A = sameArr(f, true);
      arrBox.appendChild(A.svg);
      cap.textContent = f.s === 6 ? 'Each row of 6 is 2 rows of 3' : 'Each pair of rows of 3 is 1 row of 6';
    });
    left.appendChild(arrBox);
    left.appendChild(cap);
    left.appendChild(helpBtn);
    var right = el('div', { class: 'sa-right' });
    var ch = MQ.ui.choices(q.options.map(function (o) {
      return { label: o.s + ' × ' + o.n, value: o.n };
    }), pick, { columns: 2 });
    ch.classList.add('sa-choices');
    ch.buttons.forEach(function (b) {
      b.setAttribute('data-value', b.value_);
    });
    var work = el('div', { class: 'sa-work' });
    right.appendChild(ch);
    right.appendChild(work);
    stage.appendChild(el('div', { class: 'sa-row' }, left, right));

    function finish() {
      ch.disable();
      helpBtn.disabled = true;
      ch.mark(t.n, 'good');
      MQ.clear(arrBox);
      arrBox.appendChild(sameArr(f, true).svg);
      MQ.clear(work);
      var B = sameArr(t, true);
      work.appendChild(el('div', { class: 'sa-arrwrap' }, B.svg));
      work.appendChild(note(t.n + ' rows of ' + t.s));
      work.appendChild(sumRow(f.s, f.n));
      work.appendChild(sumRow(t.s, t.n));
      work.appendChild(say(f.s + ' × ' + f.n + ' = <span class="sa-T">' + f.p + '</span> and ' + t.s + ' × ' + t.n + ' = <span class="sa-T">' + t.p + '</span>'));
    }
    function pick(v) {
      if (api.isAnswered()) return;
      if (v === t.n) {
        finish();
        api.check(true, 'Yes! ' + f.s + ' × ' + f.n + ' = ' + t.s + ' × ' + t.n + ' = ' + t.p + '.');
        return;
      }
      ch.mark(v, 'bad');
      var second = api.tries() >= 1;
      if (v === f.n) {
        api.check(false, t.s + ' × ' + v + ' = ' + t.s * v + ', not ' + f.p + '. ' + (f.s === 6 ? 'Rows of 3 are half as long, so you need twice as many rows: ' + f.n + ' + ' + f.n + '.' : 'Rows of 6 are twice as long, so you need half as many rows.'), TAG.sameGroups);
        return;
      }
      api.check(false, (second ? 'Press the ' + (f.s === 6 ? 'cut' : 'join') + ' button and count the rows of ' + t.s + '. ' : '') + t.s + ' × ' + v + ' = ' + t.s * v + '. We need ' + f.p + '.', TAG.match);
    }
    api.onReveal(function () {
      finish();
      api.feedback(f.s === 6 ? 'Cut each row of 6 into two rows of 3: ' + f.n + ' rows become ' + t.n + ' rows. ' + t.s + ' × ' + t.n + ' = ' + t.p + '.' : 'Join the rows of 3 in pairs: ' + f.n + ' rows become ' + t.n + ' rows of 6. 6 × ' + t.n + ' = ' + t.p + '.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice L2: split an array and add
   * ------------------------------------------------------------------ */
  function splitWork(s, n, a) {
    var b = s - a;
    var w = el('div', { class: 'sa-work' });
    w.appendChild(el('div', { class: 'sa-partrow' }, el('span', { class: 'sa-pa' }, a + ' × ' + n + ' = ' + a * n), sumRow(a, n)));
    w.appendChild(el('div', { class: 'sa-partrow' }, el('span', { class: 'sa-pb' }, b + ' × ' + n + ' = ' + b * n), sumRow(b, n)));
    w.appendChild(say(s + ' × ' + n + ' = <span class="sa-pa">' + a + ' × ' + n + '</span> + <span class="sa-pb">' + b + ' × ' + n + '</span> = ' + a * n + ' + ' + b * n + ' = <span class="sa-T">' + s * n + '</span>', 'sa-big'));
    return w;
  }
  function renderSplit(stage, api, q) {
    var s = q.s;
    var n = q.n;
    var T = q.T;
    api.say(n + ' rows of ' + s + '. Split the ' + s + ' into two easy parts, like ' + q.sugg[0] + ' and ' + q.sugg[1] + '!', 'think');
    stage.appendChild(MQ.ui.prompt('Split <b>' + s + ' × ' + n + '</b> into two easy parts. Drag the line, then fill the boxes.'));
    var cap = note(n + ' rows of ' + s + '. Drag the ↔ line (or click between two columns).');
    var sp = makeSplitArr({ rows: n, cols: s, cell: cellFor(n, s, 320, 270, 32), onChange: function (k) {
      cap.textContent = n + ' rows of ' + k + ' and ' + n + ' rows of ' + (s - k);
      if (!api.isAnswered()) api.feedback('Now write ' + k + ' × ' + n + ' and ' + (s - k) + ' × ' + n + ' in the boxes.', 'info');
    } });
    api.cleanup(sp.unbind);
    var bx = Boxes(check);
    var l1 = el('div', { class: 'sa-eq' }, num(s + ' × ' + n), op('='), bx.make('a', 'first part', 'sa-ba'), op('×'), bx.make('n1', 'rows', 'sa-ba'), op('+'), bx.make('b', 'second part', 'sa-bb'), op('×'), bx.make('n2', 'rows', 'sa-bb'));
    var l2 = el('div', { class: 'sa-eq' }, op('='), bx.make('p1', 'first answer', 'sa-ba'), op('+'), bx.make('p2', 'second answer', 'sa-bb'), op('='), bx.make('T', 'total', 'sa-bt'));
    var btn = checkBtn(check);
    var work = el('div', { class: 'sa-workbox' });
    stage.appendChild(el('div', { class: 'sa-row' }, el('div', { class: 'sa-left' }, sp.el, cap), el('div', { class: 'sa-right sa-right-wide' }, el('div', { class: 'sa-eqs' }, l1, l2), btn, work)));

    function finish(a) {
      bx.lock();
      btn.disabled = true;
      if (sp.pos !== a) sp.setPos(a, true);
      sp.lock();
      MQ.clear(work);
      work.appendChild(splitWork(s, n, a));
    }
    function part(x, y) {
      if (y === n) return x;
      if (x === n) return y;
      return null;
    }
    function check() {
      if (api.isAnswered()) return;
      if (bx.empty()) {
        api.feedback('Write a number in every box, then press Check.', 'info');
        return;
      }
      var v = {};
      ['a', 'n1', 'b', 'n2', 'p1', 'p2', 'T'].forEach(function (k) {
        v[k] = bx.val(k);
      });
      var pa = part(v.a, v.n1);
      var pb = part(v.b, v.n2);
      var second = api.tries() >= 1;
      if (pa === null || pb === null) {
        if (pa === null) {
          bx.mark('a', false);
          bx.mark('n1', false);
        }
        if (pb === null) {
          bx.mark('b', false);
          bx.mark('n2', false);
        }
        api.check(false, 'Only split the group size (' + s + '). There are still ' + n + ' rows in each part: __ × ' + n + ' + __ × ' + n + '.', TAG.splitBoth);
        return;
      }
      ['a', 'n1', 'b', 'n2'].forEach(function (k) {
        bx.mark(k, pa >= 1 && pb >= 1 && pa + pb === s);
      });
      if (pa < 1 || pb < 1 || pa + pb !== s) {
        api.check(false, 'The two parts must make ' + s + '. ' + pa + ' + ' + pb + ' = ' + (pa + pb) + '. ' + (second ? 'Try ' + q.sugg[0] + ' and ' + q.sugg[1] + ': drag the line after ' + q.sugg[0] + ' columns.' : 'Look at the numbers over the line.'), TAG.parts);
        return;
      }
      var okA = v.p1 === pa * n;
      var okB = v.p2 === pb * n;
      bx.mark('p1', okA);
      bx.mark('p2', okB);
      if (!okA || !okB) {
        var x = okA ? pb : pa;
        var got = okA ? v.p2 : v.p1;
        if (mixup(x, n, got)) {
          api.check(false, '6 × 7 = 42 and 6 × 8 = 48. Count the ' + x + 's in the picture: ' + U.range(1, n).map(function (i) {
            return i * x;
          }).slice(0, 4).join(', ') + ', …', TAG.mix);
          return;
        }
        api.check(false, second ? x + ' × ' + n + ' = ' + rep(x, n).join(' + ') + ' = ?' : 'Check ' + x + ' × ' + n + '. That part has ' + n + ' rows of ' + x + '. Count in ' + x + 's.', TAG.fact);
        return;
      }
      var sum = pa * n + pb * n;
      bx.mark('T', v.T === sum);
      if (v.T !== sum) {
        if (v.T === v.p1 || v.T === v.p2) {
          api.check(false, 'You found both parts. Now add them together: ' + v.p1 + ' + ' + v.p2 + '.', TAG.notAdded);
          return;
        }
        api.check(false, second ? addText(v.p1, v.p2) : 'Nearly! Add the two parts again: ' + v.p1 + ' + ' + v.p2 + '.', TAG.addErr);
        return;
      }
      finish(pa);
      api.check(true, s + ' × ' + n + ' = ' + pa + ' × ' + n + ' + ' + pb + ' × ' + n + ' = ' + pa * n + ' + ' + pb * n + ' = ' + T + '. Brilliant splitting!');
    }
    api.onReveal(function () {
      var a = sp.pos > 0 && sp.pos < s ? sp.pos : q.sugg[0];
      bx.set('a', a);
      bx.set('n1', n);
      bx.set('b', s - a);
      bx.set('n2', n);
      bx.set('p1', a * n);
      bx.set('p2', (s - a) * n);
      bx.set('T', T);
      finish(a);
      api.feedback('Split ' + s + ' into ' + a + ' and ' + (s - a) + '. Both parts keep all ' + n + ' rows. Work out each part, then add.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice L2: multiplication wall
   * ------------------------------------------------------------------ */
  function renderWall(stage, api, q) {
    var B = q.bottom;
    api.say('In a multiplication wall, multiply the two bricks underneath!', 'think');
    stage.appendChild(MQ.ui.prompt('Fill the wall. Each brick = the two bricks under it <b>multiplied</b>.'));
    var bx = Boxes(check);
    function brick(content, k) {
      return el('div', { class: 'sa-brick', 'data-brick': k }, content);
    }
    var top = brick(bx.make('top', 'top brick'), 'top');
    var m0 = brick(bx.make('m0', 'middle brick 1'), 'm0');
    var m1 = brick(bx.make('m1', 'middle brick 2'), 'm1');
    var wall = el('div', { class: 'sa-wall' }, el('div', { class: 'sa-wrow' }, top), el('div', { class: 'sa-wrow' }, m0, m1), el('div', { class: 'sa-wrow' }, B.map(function (v, i) {
      return brick(num(v), 'b' + i);
    })));
    var helpBox = el('div', { class: 'sa-wallhelp' });
    var btn = checkBtn(check);
    var work = el('div', { class: 'sa-work' });
    stage.appendChild(el('div', { class: 'sa-row' }, el('div', { class: 'sa-left' }, wall, btn), el('div', { class: 'sa-right' }, helpBox, work)));

    // Picture of x × y: rows of the bigger number, one row for each of the smaller
    function factPic(x, y, showAns) {
      var big = Math.max(x, y);
      var small = Math.min(x, y);
      var A = makeArr({ rows: small, cols: big, cell: cellFor(small, big, 230, 190, 26), top: 10, colorOf: function () {
        return COL.a;
      } });
      var box = el('div', { class: 'sa-wpic' }, el('div', { class: 'sa-note' }, x + ' × ' + y + ': ' + small + (small === 1 ? ' row' : ' rows') + ' of ' + big), el('div', { class: 'sa-arrwrap' }, A.svg));
      box.appendChild(small === 1 ? say('1 group of ' + big + ' = ' + (showAns ? big : '?')) : say(rep(big, small).join(' + ') + ' = ' + (showAns ? big * small : '?')));
      return box;
    }
    function show(k) {
      if (api.isAnswered()) return;
      MQ.clear(helpBox);
      var x;
      var y;
      if (k === 'm0') {
        x = B[0];
        y = B[1];
      } else if (k === 'm1') {
        x = B[1];
        y = B[2];
      } else {
        var a = bx.val('m0');
        var b = bx.val('m1');
        if (a !== q.mid[0] || b !== q.mid[1]) {
          helpBox.appendChild(note('Fill the two middle bricks first.'));
          return;
        }
        x = a;
        y = b;
      }
      helpBox.appendChild(factPic(x, y, false));
    }
    ['m0', 'm1', 'top'].forEach(function (k) {
      bx.map[k].addEventListener('focus', function () {
        show(k);
      });
    });
    bx.focus('m0');
    show('m0');

    function finish() {
      bx.lock();
      btn.disabled = true;
      MQ.clear(helpBox);
      MQ.clear(work);
      work.appendChild(say(B[0] + ' × ' + B[1] + ' = ' + q.mid[0] + ' · ' + B[1] + ' × ' + B[2] + ' = ' + q.mid[1]));
      work.appendChild(factPic(q.mid[0], q.mid[1], true));
      work.appendChild(say('Top: ' + q.mid[0] + ' × ' + q.mid[1] + ' = <span class="sa-T">' + q.top + '</span>'));
    }
    function check() {
      if (api.isAnswered()) return;
      if (bx.empty()) {
        api.feedback('Write a number in every empty brick, then press Check.', 'info');
        return;
      }
      var v0 = bx.val('m0');
      var v1 = bx.val('m1');
      var vt = bx.val('top');
      var ok0 = v0 === q.mid[0];
      var ok1 = v1 === q.mid[1];
      bx.mark('m0', ok0);
      bx.mark('m1', ok1);
      bx.mark('top', ok0 && ok1 && vt === q.top);
      if (!ok0 || !ok1) {
        var x = ok0 ? B[1] : B[0];
        var y = ok0 ? B[2] : B[1];
        var got = ok0 ? v1 : v0;
        if (got === x + y) api.check(false, 'You added ' + x + ' + ' + y + '. In this wall we multiply: ' + x + ' × ' + y + '.', TAG.wallAdd);
        else api.check(false, 'Check ' + x + ' × ' + y + '. Click the brick to see the picture.', TAG.fact);
        return;
      }
      if (vt !== q.top) {
        if (vt === v0 + v1) api.check(false, 'You added ' + v0 + ' + ' + v1 + '. Multiply them: ' + v0 + ' × ' + v1 + '.', TAG.wallAdd);
        else api.check(false, api.tries() >= 1 ? v0 + ' × ' + v1 + ' = ' + rep(Math.max(v0, v1), Math.min(v0, v1)).join(' + ') + ' = ?' : 'Check the top brick: ' + v0 + ' × ' + v1 + '. Click it to see the picture.', TAG.fact);
        return;
      }
      finish();
      api.check(true, 'Great wall! ' + q.mid[0] + ' × ' + q.mid[1] + ' = ' + q.top + '.');
    }
    api.onReveal(function () {
      bx.set('m0', q.mid[0]);
      bx.set('m1', q.mid[1]);
      bx.set('top', q.top);
      finish();
      api.feedback('Multiply neighbours: ' + B[0] + ' × ' + B[1] + ' = ' + q.mid[0] + ', ' + B[1] + ' × ' + B[2] + ' = ' + q.mid[1] + ', then ' + q.mid[0] + ' × ' + q.mid[1] + ' = ' + q.top + '.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice L3: 3× + 6× = 9× table
   * ------------------------------------------------------------------ */
  function nineArr(n) {
    if (n === 0) {
      return el('div', { class: 'sa-zeroarr' }, el('div', { class: 'sa-emptytray' }, 'empty'), note('0 rows: 3 groups of nothing + 6 groups of nothing = nothing'));
    }
    var A = makeArr({ rows: n, cols: 9, cell: cellFor(n, 9, 300, 250, 30), colorOf: function (r, c) {
      return c < 3 ? COL.c : COL.b;
    } });
    A.brace(A.over, 0, 3, COL.c, '3');
    A.brace(A.over, 3, 9, COL.b, '6');
    A.over.appendChild(S('line', { x1: A.bx(3), y1: A.top - 8, x2: A.bx(3), y2: A.bot + 8, class: 'sa-cutdash' }));
    return el('div', { class: 'sa-arrwrap' }, A.svg);
  }
  function renderTable(stage, api, q) {
    api.say('3 lots plus 6 lots makes 9 lots. Add across!', 'think');
    stage.appendChild(MQ.ui.prompt('Fill the table. <b>3× answer + 6× answer = 9× answer</b>.'));
    var bx = Boxes(check);
    var grid = el('div', { class: 'sa-tbl' });
    ['3× table', '', '6× table', '', '9× table'].forEach(function (h) {
      grid.appendChild(el('div', { class: 'sa-th' }, h));
    });
    var rowEls = [];
    q.rows.forEach(function (r, i) {
      function cell(key, size) {
        var c = el('div', { class: 'sa-td', 'data-row': i }, num(size + ' × ' + r.n + ' ='));
        c.appendChild(r.hide.indexOf(key) !== -1 ? bx.make(key + '_' + i, size + ' × ' + r.n) : num(r[key], 'sa-given'));
        rowEls[i] = rowEls[i] || [];
        rowEls[i].push(c);
        c.addEventListener('click', function () {
          showRow(i);
        });
        return c;
      }
      grid.appendChild(cell('p3', 3));
      grid.appendChild(el('div', { class: 'sa-tdop' }, '+'));
      grid.appendChild(cell('p6', 6));
      grid.appendChild(el('div', { class: 'sa-tdop' }, '='));
      grid.appendChild(cell('p9', 9));
    });
    Object.keys(bx.map).forEach(function (k) {
      bx.map[k].addEventListener('focus', function () {
        showRow(+k.split('_')[1]);
      });
    });
    var pic = el('div', { class: 'sa-tpic' });
    var btn = checkBtn(check);
    var work = el('div', { class: 'sa-work' });
    stage.appendChild(el('div', { class: 'sa-row' }, el('div', { class: 'sa-right sa-right-wide' }, grid, btn, work), el('div', { class: 'sa-left' }, pic)));
    var shown = -1;
    function showRow(i) {
      if (shown === i) return;
      shown = i;
      rowEls.forEach(function (cs, j) {
        cs.forEach(function (c) {
          c.classList.toggle('sa-tdon', j === i);
        });
      });
      var r = q.rows[i];
      MQ.clear(pic);
      pic.appendChild(note(r.n === 0 ? '9 × 0' : '9 × ' + r.n + ': ' + r.n + ' rows of 9 = ' + r.n + ' rows of 3 + ' + r.n + ' rows of 6'));
      pic.appendChild(nineArr(r.n));
    }
    showRow(0);
    bx.focus('p9_0');

    function finish() {
      bx.lock();
      btn.disabled = true;
      MQ.clear(work);
      q.rows.forEach(function (r) {
        work.appendChild(say('3 × ' + r.n + ' + 6 × ' + r.n + ' = ' + r.p3 + ' + ' + r.p6 + ' = <span class="sa-T">' + r.p9 + '</span> = 9 × ' + r.n));
      });
    }
    function check() {
      if (api.isAnswered()) return;
      if (bx.empty()) {
        api.feedback('Write a number in every empty box, then press Check.', 'info');
        return;
      }
      var first = null;
      q.rows.forEach(function (r, i) {
        r.hide.forEach(function (key) {
          var v = bx.val(key + '_' + i);
          var ok = v === r[key];
          bx.mark(key + '_' + i, ok);
          if (!ok && !first) first = { r: r, i: i, key: key, v: v };
        });
      });
      if (!first) {
        finish();
        api.check(true, 'Yes! The 3s plus the 6s make the 9s.');
        return;
      }
      showRow(first.i);
      var r = first.r;
      var v = first.v;
      var second = api.tries() >= 1;
      if (r.n === 0) {
        api.check(false, r.n + ' groups means nothing to count. ' + (first.key === 'p6' ? '6' : '9') + ' × 0 = 0.', TAG.zero);
        return;
      }
      if (first.key === 'p6') {
        if (mixup(6, r.n, v)) api.check(false, '6 × 7 = 42 and 6 × 8 = 48. Double the 3× answer: double ' + r.p3 + '.', TAG.mix);
        else api.check(false, second ? '6 × ' + r.n + ' is double 3 × ' + r.n + ': ' + r.p3 + ' + ' + r.p3 + ' = ?' : '6 is double 3, so 6 × ' + r.n + ' is double ' + r.p3 + '.', TAG.dbl);
        return;
      }
      var p6v = r.hide.indexOf('p6') !== -1 ? bx.val('p6_' + first.i) : r.p6;
      if (v === 2 * r.p6) {
        api.check(false, 'You doubled the 6s. 6 + 6 = 12, not 9! Add the 3s and the 6s: ' + r.p3 + ' + ' + r.p6 + '.', TAG.doubled6);
        return;
      }
      if (v === r.p3 || v === p6v) {
        api.check(false, 'The 9× answer is the 3× answer and the 6× answer added: ' + r.p3 + ' + ' + r.p6 + '.', TAG.notAdded);
        return;
      }
      api.check(false, second ? addText(r.p3, r.p6) : 'Add across the row: ' + r.p3 + ' + ' + r.p6 + '.', TAG.addErr);
    }
    api.onReveal(function () {
      q.rows.forEach(function (r, i) {
        r.hide.forEach(function (key) {
          bx.set(key + '_' + i, r[key]);
        });
      });
      finish();
      api.feedback('Each row: 3 lots + 6 lots = 9 lots. And 0 groups of anything is 0.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice L3: 9 × n = 10 × n − n (one column crossed out)
   * ------------------------------------------------------------------ */
  function renderTen(stage, api, q) {
    var n = q.n;
    api.say('Make ' + n + ' rows of 10, then take ONE away from EVERY row!', 'think');
    stage.appendChild(MQ.ui.prompt('Find <b>9 × ' + n + '</b> from <b>10 × ' + n + '</b>. Click a column to cross it out, then fill the boxes.'));
    var A = makeArr({ rows: n, cols: 10, cell: cellFor(n, 10, 320, 260, 30) });
    A.brace(A.over, 0, 10, '#5b6b8c', '10');
    var crossG = S('g');
    A.svg.appendChild(crossG);
    var crossed = -1;
    var hits = [];
    for (var c = 0; c < 10; c++) {
      (function (cc) {
        var h = S('rect', { x: A.bx(cc), y: A.top - 6, width: A.cell, height: A.bot - A.top + 12, class: 'sa-colhit', 'data-col': cc });
        h.addEventListener('click', function () {
          cross(cc);
        });
        hits.push(h);
        A.svg.appendChild(h);
      })(c);
    }
    var cap = note(n + ' rows of 10');
    function cross(cc, quiet) {
      if (api.isAnswered() && !quiet) return;
      crossed = cc;
      MQ.clear(crossG);
      A.recolor(function (r, c2) {
        return c2 === cc ? '#cfd6e4' : COL.a;
      });
      crossG.appendChild(S('rect', { x: A.bx(cc) + 2, y: A.top - 4, width: A.cell - 4, height: A.bot - A.top + 8, rx: 8, class: 'sa-xcol' }));
      var d = A.cell * 0.3;
      for (var r = 0; r < n; r++) {
        var x = A.x(cc);
        var y = A.y(r);
        crossG.appendChild(S('path', { d: 'M' + (x - d) + ' ' + (y - d) + ' L' + (x + d) + ' ' + (y + d) + ' M' + (x + d) + ' ' + (y - d) + ' L' + (x - d) + ' ' + (y + d), class: 'sa-x' }));
      }
      cap.textContent = 'One crossed out in every row. Now 9 are left in each row.';
      if (!quiet) {
        MQ.sound('pop');
        api.feedback('You crossed out 1 in every row. How many is that?', 'info');
      }
    }
    var bx = Boxes(check);
    var eqs = el('div', { class: 'sa-eqs' },
      el('div', { class: 'sa-eq' }, num('10 × ' + n), op('='), bx.make('ten', '10 × ' + n)),
      el('div', { class: 'sa-eq' }, num('take away'), bx.make('take', 'how many crossed out'), el('span', { class: 'sa-small' }, '(one from each row)')),
      el('div', { class: 'sa-eq' }, num('9 × ' + n), op('='), bx.make('nine', '9 × ' + n, 'sa-bt')));
    var btn = checkBtn(check);
    var work = el('div', { class: 'sa-work' });
    stage.appendChild(el('div', { class: 'sa-row' }, el('div', { class: 'sa-left' }, el('div', { class: 'sa-arrwrap' }, A.svg), cap), el('div', { class: 'sa-right' }, eqs, btn, work)));

    function finish() {
      bx.lock();
      btn.disabled = true;
      if (crossed < 0) cross(9, true);
      hits.forEach(function (h) {
        h.style.pointerEvents = 'none';
      });
      MQ.clear(work);
      work.appendChild(say('10 × ' + n + ' = ' + q.ten));
      work.appendChild(say(q.ten + ' − ' + n + ' = <span class="sa-T">' + q.nine + '</span> = 9 × ' + n));
      work.appendChild(note('Take away one for EACH of the ' + n + ' groups: ' + n + ', not 1.'));
    }
    function check() {
      if (api.isAnswered()) return;
      if (crossed < 0) {
        api.feedback('First click a column of the array to cross out one in each row.', 'info');
        return;
      }
      if (bx.empty()) {
        api.feedback('Write a number in every box, then press Check.', 'info');
        return;
      }
      var vt = bx.val('ten');
      var vk = bx.val('take');
      var vn = bx.val('nine');
      bx.mark('ten', vt === q.ten);
      bx.mark('take', vk === n);
      bx.mark('nine', vn === q.nine);
      var second = api.tries() >= 1;
      if (vt !== q.ten) {
        api.check(false, n + ' rows of 10: count in 10s. ' + (second ? U.range(1, n).map(function (i) {
          return 10 * i;
        }).slice(0, 3).join(', ') + ', …' : ''), TAG.tens);
        return;
      }
      if (vk !== n || vn === q.ten - 1) {
        api.check(false, 'Look at the crosses: one in EACH of the ' + n + ' rows. That is ' + (second ? n : 'more than 1') + ' taken away.', TAG.tenOne);
        return;
      }
      if (vn !== q.nine) {
        api.check(false, second ? q.ten + ' − ' + n + ': ' + q.ten + ' − 10 = ' + (q.ten - 10) + ', then add back ' + (10 - n) + '.' : 'Check ' + q.ten + ' − ' + n + '.', TAG.sub);
        return;
      }
      finish();
      api.check(true, '10 × ' + n + ' − ' + n + ' = ' + q.nine + '. So 9 × ' + n + ' = ' + q.nine + '!');
    }
    api.onReveal(function () {
      bx.set('ten', q.ten);
      bx.set('take', n);
      bx.set('nine', q.nine);
      finish();
      api.feedback('Each row loses one, so ' + n + ' rows lose ' + n + '. ' + q.ten + ' − ' + n + ' = ' + q.nine + '.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Practice L3: connected facts web
   * ------------------------------------------------------------------ */
  function webArr(b, half) {
    var A = makeArr({ rows: b, cols: 6, cell: cellFor(b, 6, 180, 200, 24), colorOf: function (r, c) {
      return half && c >= 3 ? COL.b : COL.a;
    } });
    A.brace(A.over, 0, 6, '#5b6b8c', '6');
    if (half) A.over.appendChild(S('line', { x1: A.bx(3), y1: A.top - 8, x2: A.bx(3), y2: A.bot + 8, class: 'sa-cutdash' }));
    return A;
  }
  function renderWeb(stage, api, q) {
    var b = q.b;
    var P = q.P;
    api.say('You know 6 × ' + b + ' = ' + P + '. What else do you know now?', 'think');
    stage.appendChild(MQ.ui.prompt('Pick <b>all</b> the facts that are true. Use 6 × ' + b + ' = ' + P + ' to help.'));
    var A = webArr(b, true);
    var centre = el('div', { class: 'sa-centre' }, el('div', { class: 'sa-centrefact' }, '6 × ' + b + ' = ' + P), el('div', { class: 'sa-arrwrap' }, A.svg), note(b + ' rows of 6. Half of each row is 3.'));
    var picked = {};
    var opts = el('div', { class: 'sa-webopts' });
    var btns = q.options.map(function (o, i) {
      var bt = el('button', { class: 'sa-opt', type: 'button', 'data-i': i, 'aria-pressed': 'false' }, el('span', { class: 'sa-opttxt' }, o.text));
      bt.addEventListener('click', function () {
        if (api.isAnswered()) return;
        picked[i] = !picked[i];
        bt.classList.toggle('sa-on', !!picked[i]);
        bt.classList.remove('sa-optbad');
        bt.setAttribute('aria-pressed', picked[i] ? 'true' : 'false');
        MQ.sound('click');
      });
      opts.appendChild(bt);
      return bt;
    });
    var btn = checkBtn(check);
    var work = el('div', { class: 'sa-work' });
    stage.appendChild(el('div', { class: 'sa-row' }, el('div', { class: 'sa-left' }, centre), el('div', { class: 'sa-right sa-right-wide' }, opts, btn, work)));

    function finish() {
      btn.disabled = true;
      btns.forEach(function (bt, i) {
        var o = q.options[i];
        bt.disabled = true;
        bt.classList.toggle('sa-on', o.ok);
        bt.classList.toggle('sa-optgood', o.ok);
        bt.classList.toggle('sa-optno', !o.ok);
        bt.appendChild(el('span', { class: 'sa-why' }, o.why));
      });
    }
    function check() {
      if (api.isAnswered()) return;
      var sel = Object.keys(picked).filter(function (i) {
        return picked[i];
      }).map(Number);
      if (!sel.length) {
        api.feedback('Click the facts you think are true, then press Check.', 'info');
        return;
      }
      var bad = sel.filter(function (i) {
        return !q.options[i].ok;
      });
      if (bad.length) {
        bad.forEach(function (i) {
          btns[i].classList.add('sa-optbad');
        });
        var o = q.options[bad[0]];
        api.check(false, '“' + o.text + '” is not true. ' + o.why, o.kind === 'mix' ? TAG.mix : TAG.webFalse);
        return;
      }
      var need = q.options.filter(function (o) {
        return o.ok;
      }).length;
      if (sel.length < need) {
        api.check(false, 'All of those are true! There are ' + (need - sel.length) + ' more. ' + (api.tries() >= 1 ? 'Look for ÷ facts, the turned fact, and half or double the 6.' : ''), TAG.webMiss);
        return;
      }
      finish();
      api.check(true, 'Yes! One fact, ' + need + ' more facts for free.');
    }
    api.onReveal(function () {
      finish();
      api.feedback('True: turn it, the two ÷ facts, half (3 × ' + b + ') and double (12 × ' + b + ').', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */
  // Yoghurt pot
  function pot(g, cx, cy, r, color) {
    g.appendChild(S('path', { d: 'M' + (cx - r * 0.75) + ' ' + (cy - r * 0.55) + ' L' + (cx + r * 0.75) + ' ' + (cy - r * 0.55) + ' L' + (cx + r * 0.55) + ' ' + (cy + r * 0.85) + ' L' + (cx - r * 0.55) + ' ' + (cy + r * 0.85) + ' Z', fill: '#fff', stroke: color, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }));
    g.appendChild(S('rect', { x: cx - r * 0.9, y: cy - r * 0.85, width: r * 1.8, height: r * 0.35, rx: 2, fill: color }));
  }

  function learnCopy(stage, api) {
    api.lockNext();
    api.say('4 cartons with 3 yoghurts each. Drag the copy up beside them!');
    stage.appendChild(MQ.ui.lesson('3s to 6s', 'Rows = number of groups. Columns = group size. A copy beside each row makes rows of 6.'));
    var rows = 4;
    var size = 3;
    var cell = 42;
    var P = 14;
    var TOP = 40;
    var GAP = 16;
    var w = size * cell;
    var h = rows * cell;
    var W = 2 * P + 2 * w + GAP;
    var H = TOP + h + P;
    var DROP = h + 26;
    var svgEl = S('svg', { viewBox: '0 0 ' + W + ' ' + (H + DROP), width: W, height: H + DROP, class: 'sa-arr', style: { maxWidth: '100%', height: 'auto' } });
    svgEl.appendChild(S('rect', { x: 2, y: TOP - 6, width: W - 4, height: h + 12, rx: 12, class: 'sa-tray' }));
    function block(color, label, cls) {
      var g = S('g', { class: cls });
      g.appendChild(S('rect', { x: P - 4, y: TOP - 4, width: w + 8, height: h + 8, rx: 10, class: 'sa-outline' }));
      g.appendChild(S('path', { d: 'M' + (P + 3) + ' ' + (TOP - 9) + ' v-5 H' + (P + w - 3) + ' v5', class: 'sa-brace', stroke: color }));
      g.appendChild(S('text', { x: P + w / 2, y: TOP - 18, 'text-anchor': 'middle', class: 'sa-blab', fill: color }, label));
      for (var r = 0; r < rows; r++) {
        g.appendChild(S('rect', { x: P, y: TOP + r * cell + 3, width: w, height: cell - 6, rx: 8, class: 'sa-carton' }));
        for (var c = 0; c < size; c++) pot(g, P + c * cell + cell / 2, TOP + r * cell + cell / 2, cell * 0.36, color);
      }
      return g;
    }
    var g0 = block(COL.a, '3', 'sa-placed');
    var g1 = block(COL.b, '3', 'sa-pending');
    svgEl.appendChild(g0);
    svgEl.appendChild(g1);
    var hand = S('text', { x: P + w + 8, y: TOP + h / 2 + 10, class: 'sa-hand' }, '↗');
    g1.appendChild(hand);
    var target = w + GAP;
    var pos = 0;
    var done = false;
    function setT(x, y, anim) {
      g1.style.transition = anim ? 'transform .45s ease' : 'none';
      g1.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    }
    setT(0, DROP, false);
    var fact = say('4 rows of 3 = 3 × 4 = <span class="sa-T">12</span>');
    var right = el('div', { class: 'sa-right' }, sumRow(3, 4), fact);
    var slideBtn = el('button', { class: 'btn sa-slide', type: 'button', 'data-act': 'copy' }, 'Slide the copy ↗');
    right.appendChild(slideBtn);
    function slide() {
      if (done) return;
      done = true;
      slideBtn.disabled = true;
      if (hand.parentNode) g1.removeChild(hand);
      MQ.sound('pop');
      // along the bottom first, then straight up: the copy never covers the original
      setT(target, DROP, true);
      api.later(function () {
        setT(target, 0, true);
      }, 480);
      api.later(function () {
        g1.setAttribute('class', 'sa-placed');
        svgEl.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        svgEl.setAttribute('height', H);
        right.appendChild(sumRow(6, 4));
        right.appendChild(say('4 rows of 6 = 6 × 4 = <span class="sa-T">24</span>'));
        right.appendChild(el('div', { class: 'sa-strip' }, el('span', { class: 'sa-schip' }, '12'), el('span', { class: 'sa-sarrow' }, el('small', null, 'double'), '→'), el('span', { class: 'sa-schip sa-snew' }, '24')));
        api.say('3 × 4 = 12, so 6 × 4 = 24. Double the 3s to get the 6s!', 'cheer');
        api.feedback('Still 4 rows. Each row went from 3 to 6, so 12 doubled to 24.', 'good');
        api.unlockNext();
      }, 1000);
    }
    var base = 0;
    var unbind = MQ.ui.drag(svgEl, g1, {
      start: function () {
        base = pos;
      },
      move: function (p, dx) {
        if (done) return;
        pos = U.clamp(base + dx, 0, target);
        setT(pos, DROP, false);
      },
      end: function () {
        if (done) return;
        if (pos > target * 0.45) slide();
        else {
          pos = 0;
          setT(0, DROP, true);
        }
      },
    });
    api.cleanup(unbind);
    slideBtn.addEventListener('click', slide);
    stage.appendChild(el('div', { class: 'sa-row' }, el('div', { class: 'sa-left' }, el('div', { class: 'sa-arrwrap' }, svgEl), note('Drag the copy, or press the button.')), right));
  }

  function learnNine(stage, api) {
    api.lockNext();
    api.say('I want 9 in each row. I will double the 6!');
    stage.appendChild(MQ.ui.lesson('Doubling 6 is too many', 'We want <b>9 × 3</b>: 3 rows of 9. The dashed box holds 9 in each row.'));
    var rows = 3;
    var cell = 34;
    var P = 14;
    var TOP = 42;
    var GAP = 12;
    var W = 2 * P + 12 * cell + GAP;
    var H = TOP + rows * cell + P + 24;
    var svgEl = S('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'sa-arr', style: { maxWidth: '100%', height: 'auto' } });
    svgEl.appendChild(S('rect', { x: P - 6, y: TOP - 8, width: 9 * cell + GAP + 12, height: rows * cell + 16, rx: 12, class: 'sa-frame' }));
    svgEl.appendChild(S('text', { x: P + (9 * cell + GAP) / 2, y: TOP + rows * cell + 30, 'text-anchor': 'middle', class: 'sa-frametxt' }, 'room for 9 in each row'));
    var layer = S('g');
    svgEl.appendChild(layer);
    function blk(x0, cols, color, label) {
      var g = S('g');
      g.appendChild(S('path', { d: 'M' + (x0 + 3) + ' ' + (TOP - 12) + ' v-5 H' + (x0 + cols * cell - 3) + ' v5', class: 'sa-brace', stroke: color }));
      g.appendChild(S('text', { x: x0 + (cols * cell) / 2, y: TOP - 21, 'text-anchor': 'middle', class: 'sa-blab', fill: color }, label));
      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var x = x0 + c * cell + cell / 2;
          var over = x0 + c * cell > P + 9 * cell + GAP - 1;
          g.appendChild(S('circle', { cx: x, cy: TOP + r * cell + cell / 2, r: cell * 0.33, fill: color, class: 'sa-dot' + (over ? ' sa-over' : '') }));
        }
      }
      return g;
    }
    var x2 = P + 6 * cell + GAP;
    function draw(st) {
      MQ.clear(layer);
      layer.appendChild(blk(P, 6, COL.a, '6'));
      if (st === 1) layer.appendChild(blk(x2, 6, COL.red, '+6'));
      if (st === 2) layer.appendChild(blk(x2, 3, COL.c, '+3'));
    }
    draw(0);
    var info = el('div', { class: 'sa-right' }, say('3 rows of 6 = 6 × 3 = <span class="sa-T">18</span>'));
    var dblBtn = el('button', { class: 'btn sa-slide', type: 'button', 'data-act': 'double' }, 'Double the 6');
    var addBtn = el('button', { class: 'btn sa-slide', type: 'button', 'data-act': 'add3', disabled: 'disabled' }, 'Add 3 instead');
    dblBtn.addEventListener('click', function () {
      dblBtn.disabled = true;
      addBtn.disabled = false;
      MQ.sound('wrong');
      draw(1);
      info.appendChild(say('6 + 6 = <b>12</b>, not 9!', 'sa-oops'));
      api.say('Oops! Double 6 is 12. That spills out of the box. Try adding 3 instead!', 'oops');
    });
    addBtn.addEventListener('click', function () {
      addBtn.disabled = true;
      MQ.sound('pop');
      draw(2);
      info.appendChild(say('6 + 3 = <b>9</b> ✔'));
      info.appendChild(say('9 × 3 = 6 × 3 + 3 × 3 = 18 + 9 = <span class="sa-T">27</span>', 'sa-big'));
      api.say('6 lots plus 3 lots makes 9 lots. 18 + 9 = 27!', 'cheer');
      api.feedback('To get the 9s, add the 6s and the 3s. Do not double the 6s.', 'good');
      api.unlockNext();
    });
    stage.appendChild(el('div', { class: 'sa-row' }, el('div', { class: 'sa-left' }, el('div', { class: 'sa-arrwrap' }, svgEl), el('div', { class: 'sa-btnrow' }, dblBtn, addBtn)), info));
  }

  function learnDomino(stage, api) {
    api.lockNext();
    api.say('3 dominoes. Each has 5 spots and 4 spots. Drag the line onto the middle!');
    stage.appendChild(MQ.ui.lesson('Split the dominoes', '3 dominoes with 9 spots each: <b>9 × 3</b>. Split each one into 5 and 4.'));
    var HALF = 80;
    var GAPY = 14;
    var X0 = 20;
    var TOP = 56;
    var n = 3;
    var W = X0 * 2 + 2 * HALF + 60;
    var H = TOP + n * HALF + (n - 1) * GAPY + 24;
    var svgEl = S('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'sa-arr sa-dom', style: { maxWidth: '100%', height: 'auto' } });
    var spots = [];
    var pat = {
      5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
      4: [[0.27, 0.27], [0.73, 0.27], [0.27, 0.73], [0.73, 0.73]],
    };
    for (var i = 0; i < n; i++) {
      var y = TOP + i * (HALF + GAPY);
      var d = S('g', { class: 'sa-domino', 'data-domino': i });
      d.appendChild(S('rect', { x: X0, y: y, width: 2 * HALF, height: HALF, rx: 10, class: 'sa-dombody' }));
      d.appendChild(S('line', { x1: X0 + HALF, y1: y + 8, x2: X0 + HALF, y2: y + HALF - 8, class: 'sa-dommid' }));
      [5, 4].forEach(function (k, side) {
        pat[k].forEach(function (p) {
          var c = S('circle', { cx: X0 + side * HALF + p[0] * HALF, cy: y + p[1] * HALF, r: 8, class: 'sa-spot', 'data-side': side });
          spots.push(c);
          d.appendChild(c);
        });
      });
      svgEl.appendChild(d);
    }
    var labels = S('g');
    svgEl.appendChild(labels);
    var divX = X0 + HALF;
    var parkX = X0 + 2 * HALF + 34;
    var y1 = TOP - 30;
    var y2 = H - 10;
    var lineG = S('g', { class: 'sa-cut sa-parked' });
    lineG.appendChild(S('rect', { x: -16, y: y1 - 14, width: 32, height: y2 - y1 + 16, fill: 'transparent' }));
    lineG.appendChild(S('line', { x1: 0, y1: y1, x2: 0, y2: y2, class: 'sa-cutline' }));
    lineG.appendChild(S('circle', { cx: 0, cy: y1, r: 13, class: 'sa-knob' }));
    lineG.appendChild(S('text', { x: 0, y: y1 + 6, 'text-anchor': 'middle', class: 'sa-knobt' }, '↔'));
    svgEl.appendChild(lineG);
    var curX = parkX;
    var done = false;
    function place(x, anim) {
      curX = x;
      lineG.style.transition = anim ? 'transform .3s ease' : 'none';
      lineG.style.transform = 'translate(' + x + 'px,0)';
    }
    place(parkX);
    var right = el('div', { class: 'sa-right sa-right-wide' }, say('9 × 3 = ?'));
    function split() {
      if (done) return;
      done = true;
      place(divX, true);
      lineG.classList.remove('sa-parked');
      lineG.classList.add('sa-locked');
      MQ.sound('pop');
      spots.forEach(function (c) {
        c.setAttribute('fill', c.getAttribute('data-side') === '0' ? COL.a : COL.b);
      });
      labels.appendChild(S('text', { x: X0 + HALF / 2, y: TOP - 14, 'text-anchor': 'middle', class: 'sa-blab', fill: COL.a }, '5'));
      labels.appendChild(S('text', { x: X0 + HALF * 1.5, y: TOP - 14, 'text-anchor': 'middle', class: 'sa-blab', fill: COL.b }, '4'));
      MQ.clear(right);
      right.appendChild(el('div', { class: 'sa-partrow' }, el('span', { class: 'sa-pa' }, '5 × 3 = 15'), sumRow(5, 3)));
      right.appendChild(el('div', { class: 'sa-partrow' }, el('span', { class: 'sa-pb' }, '4 × 3 = 12'), sumRow(4, 3)));
      right.appendChild(say('9 × 3 = <span class="sa-pa">5 × 3</span> + <span class="sa-pb">4 × 3</span> = 15 + 12 = <span class="sa-T">27</span>', 'sa-big'));
      api.say('5 × 3 = 15 and 4 × 3 = 12. Add them: 27!', 'cheer');
      api.feedback('Split the group size into two easy parts. Work out each part, then ADD.', 'good');
      api.unlockNext();
    }
    var base = 0;
    var unbind = MQ.ui.drag(svgEl, lineG, {
      start: function () {
        base = curX;
      },
      move: function (p, dx) {
        if (done) return;
        place(U.clamp(base + dx, X0, parkX));
      },
      end: function () {
        if (done) return;
        if (Math.abs(curX - divX) < HALF * 0.6) split();
        else {
          place(parkX, true);
          api.feedback('Drop the line on the middle of the dominoes, between the 5 and the 4.', 'info');
        }
      },
    });
    api.cleanup(unbind);
    svgEl.querySelectorAll('.sa-domino').forEach(function (d) {
      d.addEventListener('click', split);
    });
    stage.appendChild(el('div', { class: 'sa-row' }, el('div', { class: 'sa-left' }, el('div', { class: 'sa-arrwrap' }, svgEl), note('Drag the ↔ line, or click a domino.')), right));
  }

  function learnWeb(stage, api) {
    api.lockNext();
    api.say('You know 6 × 9 = 54. Drag the true facts into the web!');
    stage.appendChild(MQ.ui.lesson('Connected facts', 'One fact you know gives you lots more. Drag (or click) each card.'));
    var cards = [
      { t: '9 × 6 = 54', ok: true, why: 'turn it' },
      { t: '54 ÷ 6 = 9', ok: true, why: '54 in 6s' },
      { t: '54 ÷ 9 = 6', ok: true, why: '54 in 9 groups' },
      { t: '3 × 9 = 27', ok: true, why: 'half' },
      { t: '12 × 9 = 108', ok: true, why: 'double' },
      { t: '6 × 8 = 54', ok: false, why: '6 × 8 = 48, not 54.' },
      { t: '3 × 9 = 54', ok: false, why: 'Half the group size, so half the answer: 3 × 9 = 27.' },
    ];
    var A = webArr(9, true);
    var slots = [];
    var web = el('div', { class: 'sa-web' });
    var spots = ['sa-w1', 'sa-w2', 'sa-w3', 'sa-w4', 'sa-w5'];
    spots.forEach(function (cls) {
      var s = el('div', { class: 'sa-wslot ' + cls }, '?');
      slots.push(s);
      web.appendChild(s);
    });
    web.appendChild(el('div', { class: 'sa-wcentre' }, '6 × 9 = 54'));
    var pool = el('div', { class: 'sa-pool' });
    var placed = 0;
    U.shuffle(cards).forEach(function (c) {
      var b = el('button', { class: 'sa-card', type: 'button', 'data-ok': c.ok ? '1' : '0' }, c.t);
      cardDrag(api, b, web, function () {
        if (b.disabled) return;
        if (!c.ok) {
          MQ.sound('wrong');
          b.classList.add('sa-shake');
          api.later(function () {
            b.classList.remove('sa-shake');
          }, 500);
          api.say('Not that one. ' + c.why, 'oops');
          return;
        }
        b.disabled = true;
        b.style.visibility = 'hidden';
        var s = slots[placed++];
        MQ.clear(s);
        s.classList.add('sa-wfull');
        s.appendChild(el('b', null, c.t));
        s.appendChild(el('small', null, c.why));
        MQ.sound('pop');
        if (placed === 5) {
          pool.querySelectorAll('.sa-card').forEach(function (x) {
            x.disabled = true;
          });
          api.say('5 more facts from one! Let\'s practise.', 'cheer');
          api.feedback('From 6 × 9 = 54: turn it, divide it, halve it, double it.', 'good');
          api.unlockNext();
        } else api.say(c.t + ': yes! ' + (5 - placed) + ' more to find.', 'happy');
      });
      pool.appendChild(b);
    });
    stage.appendChild(el('div', { class: 'sa-row' }, el('div', { class: 'sa-left' }, el('div', { class: 'sa-arrwrap' }, A.svg), note('9 rows of 6. Half of each row is 3.')), el('div', { class: 'sa-right sa-right-wide' }, web, pool)));
  }

  /* ------------------------------------------------------------------ */
  MQ.register(ID, {
    learn: [learnCopy, learnNine, learnDomino, learnWeb],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'stick') return renderStick(stage, api, q);
        if (q.type === 'same') return renderSame(stage, api, q);
        if (q.type === 'split') return renderSplit(stage, api, q);
        if (q.type === 'wall') return renderWall(stage, api, q);
        if (q.type === 'table') return renderTable(stage, api, q);
        if (q.type === 'ten') return renderTen(stage, api, q);
        return renderWeb(stage, api, q);
      },
    },
  });

  MQ._test = MQ._test || {};
  MQ._test[ID] = {
    buildDeck: buildDeck,
    deck: function () {
      return deck;
    },
  };

  var css = [
    '.sa-row{display:flex;gap:22px;align-items:flex-start;justify-content:center;flex-wrap:wrap;width:100%}',
    '.sa-left{display:flex;flex-direction:column;align-items:center;gap:8px;flex:0 1 auto;min-width:0;max-width:100%}',
    '.sa-right{display:flex;flex-direction:column;align-items:center;gap:10px;flex:1 1 280px;min-width:0;max-width:460px}',
    '.sa-right-wide{max-width:600px;flex-basis:400px}',
    '.sa-arrwrap{display:flex;justify-content:center;max-width:100%}',
    '.sa-arr{display:block;overflow:visible;user-select:none}',
    '.sa-tray{fill:#f4f7ff;stroke:#c3cde0;stroke-width:2}',
    '.sa-band{fill:rgba(27,42,74,.05)}',
    '.sa-dot{stroke:rgba(0,0,0,.18);stroke-width:1;transition:fill .25s}',
    '.sa-dot.sa-over{stroke:#9b1c25;stroke-width:3}',
    '.sa-brace{fill:none;stroke-width:2.5}',
    '.sa-blab{font-weight:800;font-size:18px}',
    '.sa-cut{cursor:grab}',
    '.sa-cutline{stroke:#1b2a4a;stroke-width:4;stroke-linecap:round}',
    '.sa-knob{fill:#ffd166;stroke:#1b2a4a;stroke-width:2.5}',
    '.sa-knobt{font-size:17px;font-weight:800;fill:#1b2a4a;pointer-events:none}',
    '.sa-parked .sa-cutline{stroke-dasharray:7 6;stroke:#5b6b8c}',
    '.sa-locked{cursor:default}',
    '.sa-cutdash{stroke:#1b2a4a;stroke-width:3;stroke-dasharray:6 5}',
    '.sa-pair{fill:none;stroke:#8d99ae;stroke-width:2;stroke-dasharray:4 4}',
    '.sa-colhit{fill:transparent;cursor:pointer}',
    '.sa-colhit:hover{fill:rgba(230,57,70,.08)}',
    '.sa-xcol{fill:rgba(230,57,70,.08);stroke:#e63946;stroke-width:2.5;stroke-dasharray:6 4}',
    '.sa-x{stroke:#e63946;stroke-width:3.5;stroke-linecap:round}',
    '.sa-outline{fill:none;stroke:transparent;stroke-width:2.5}',
    '.sa-pending{cursor:grab}',
    '.sa-pending .sa-outline{stroke:#e09f00;stroke-dasharray:6 4;fill:rgba(255,232,163,.35)}',
    '.sa-pending path,.sa-pending rect.sa-carton{opacity:.55}',
    '.sa-pending .sa-blab,.sa-pending .sa-brace{opacity:0}',
    '.sa-carton{fill:#fdf6e3;stroke:#e2d3a8;stroke-width:1.5}',
    '.sa-hand{font-size:30px;font-weight:800;fill:#e09f00;opacity:1 !important}',
    '.sa-frame{fill:none;stroke:#06a77d;stroke-width:3;stroke-dasharray:8 6}',
    '.sa-frametxt{font-size:15px;font-weight:700;fill:#06a77d}',
    '.sa-dombody{fill:#fffdf7;stroke:#1b2a4a;stroke-width:3}',
    '.sa-dommid{stroke:#1b2a4a;stroke-width:2.5}',
    '.sa-spot{fill:#1b2a4a;transition:fill .3s}',
    '.sa-domino{cursor:pointer}',
    '.sa-say{font-size:1.25rem;font-weight:800;text-align:center;background:#fff;border:2px solid var(--line);border-radius:14px;padding:6px 14px}',
    '.sa-say.sa-big{font-size:1.35rem;background:#fffbea;border-color:var(--gold)}',
    '.sa-say.sa-oops{background:var(--try-bg);border-color:var(--try)}',
    '.sa-note{font-size:1.02rem;font-weight:700;color:var(--ink-soft);text-align:center}',
    '.sa-small{font-size:.9rem;font-weight:700;color:var(--ink-soft)}',
    '.sa-T{color:#b45309;background:#fff3cd;border-radius:6px;padding:0 4px}',
    '.sa-pa{color:#1f5fc4;font-weight:800}',
    '.sa-pb{color:#c2621a;font-weight:800}',
    '.sa-partrow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;font-size:1.15rem}',
    '.sa-sum{flex-wrap:wrap;justify-content:center}',
    '.sa-sum .chip{font-size:1rem;padding:2px 8px}',
    '.sa-work,.sa-workbox{display:flex;flex-direction:column;align-items:center;gap:8px}',
    '.sa-eqs{display:flex;flex-direction:column;align-items:center;gap:10px;background:var(--paper);border:2px solid var(--line);border-radius:16px;padding:10px 12px}',
    '.sa-eq{display:flex;align-items:center;gap:6px;font-size:1.5rem;font-weight:800;flex-wrap:wrap;justify-content:center}',
    '.sa-num{display:inline-block;white-space:nowrap}',
    '.sa-op{color:var(--ink-soft);font-weight:800}',
    '.sa-box{width:60px;height:48px;border-radius:10px;border:3px solid #9aa8c7;background:#fff;font-size:1.45rem;font-weight:800;text-align:center;color:var(--ink);padding:0}',
    '.sa-box:focus{outline:4px solid var(--accent);outline-offset:1px}',
    '.sa-box.sa-ba{border-color:#3a86ff}',
    '.sa-box.sa-bb{border-color:#f4a261}',
    '.sa-box.sa-bt{border-color:var(--gold)}',
    '.sa-box.sa-good{border-color:var(--good);background:var(--good-bg)}',
    '.sa-box.sa-bad{border-color:var(--try);background:var(--try-bg)}',
    '.sa-box:disabled{color:var(--ink)}',
    '.sa-btnrow{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.sa-check,.sa-slide{font-size:1.15rem}',
    '.sa-help,.sa-jump{font-size:1rem}',
    '.sa-strip{display:flex;align-items:center;gap:6px}',
    '.sa-schip{min-width:54px;text-align:center;font-size:1.4rem;font-weight:800;padding:4px 10px;border-radius:12px;background:#fff3cd;border:2px solid var(--gold)}',
    '.sa-schip.sa-snew{background:var(--good-bg);border-color:var(--good)}',
    '.sa-sarrow{display:flex;flex-direction:column;align-items:center;font-weight:800;color:#b07800;line-height:1}',
    '.sa-sarrow small{font-size:.8rem}',
    // counting stick
    '.sa-stickwrap{width:100%;max-width:840px;padding:0 30px 0 22px;box-sizing:border-box}',
    '.sa-stick{display:flex;align-items:stretch;width:100%;cursor:pointer;user-select:none}',
    '.sa-zero{position:relative;width:0}',
    '.sa-zero .sa-lab{position:absolute;left:0;top:44px;transform:translateX(-50%)}',
    '.sa-seg{position:relative;flex:1 1 0;min-width:0;height:112px}',
    '.sa-bar{position:absolute;left:0;right:0;top:30px;height:14px;background:#cfe0ff;border:2px solid #1b2a4a;border-left-width:1px;border-right-width:1px}',
    '.sa-odd .sa-bar{background:#ffd166}',
    '.sa-hop{position:absolute;left:4%;right:4%;top:2px;height:24px;border:3px solid #e09f00;border-bottom:none;border-radius:50% 50% 0 0;text-align:center;font-weight:800;font-size:.85rem;color:#b07800;line-height:16px;visibility:hidden}',
    '.sa-hopped .sa-hop{visibility:visible}',
    '.sa-lab{position:absolute;right:0;top:50px;transform:translateX(50%);font-size:1.35rem;font-weight:800;z-index:1}',
    '.sa-lab .sa-box{width:50px;height:42px;font-size:1.25rem}',
    '.sa-scap{position:absolute;right:0;top:96px;transform:translateX(50%);font-size:.78rem;font-weight:700;color:var(--ink-soft);white-space:nowrap}',
    // choices
    '.sa-choices{max-width:380px;width:100%}',
    '.sa-choices .choice{font-size:1.5rem}',
    // wall
    '.sa-wall{display:flex;flex-direction:column;align-items:center;gap:4px}',
    '.sa-wrow{display:flex;gap:4px}',
    '.sa-brick{width:96px;height:62px;display:flex;align-items:center;justify-content:center;background:#f6d7c3;border:3px solid #b5653b;border-radius:6px;font-size:1.6rem;font-weight:800}',
    '.sa-wallhelp{display:flex;flex-direction:column;align-items:center;gap:6px;min-height:60px}',
    '.sa-wpic{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.sa-wpic .sa-say{font-size:1.05rem;max-width:440px}',
    // 9x table
    '.sa-tbl{display:grid;grid-template-columns:auto 22px auto 22px auto;gap:6px 4px;align-items:center;background:var(--paper);border:2px solid var(--line);border-radius:16px;padding:8px 10px}',
    '.sa-th{font-weight:800;color:var(--ink-soft);text-align:center;font-size:.95rem}',
    '.sa-td{display:flex;align-items:center;gap:5px;font-size:1.3rem;font-weight:800;padding:4px 6px;border-radius:10px;border:2px solid transparent;cursor:pointer;white-space:nowrap}',
    '.sa-td .sa-box{width:56px;height:44px;font-size:1.3rem}',
    '.sa-tdon{background:#eef4ff;border-color:#bcd0f5}',
    '.sa-tdop{text-align:center;font-weight:800;font-size:1.3rem;color:var(--ink-soft)}',
    '.sa-given{color:var(--ink)}',
    '.sa-tpic{display:flex;flex-direction:column;align-items:center;gap:6px;max-width:340px}',
    '.sa-zeroarr{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.sa-emptytray{width:240px;height:70px;border-radius:12px;border:2px dashed #c3cde0;background:#f4f7ff;display:flex;align-items:center;justify-content:center;color:var(--ink-soft);font-weight:800}',
    // web (practice)
    '.sa-centre{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.sa-centrefact{font-size:1.6rem;font-weight:800;background:#fff3cd;border:3px solid var(--gold);border-radius:16px;padding:6px 16px}',
    '.sa-webopts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;width:100%}',
    '.sa-opt{font:inherit;font-size:1.3rem;font-weight:800;padding:8px 10px;border-radius:14px;border:3px solid var(--line);background:#fff;color:var(--ink);cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px}',
    '.sa-opt.sa-on{border-color:#3a86ff;background:#e7f0ff}',
    '.sa-opt.sa-optbad{border-color:var(--try);background:var(--try-bg)}',
    '.sa-opt.sa-optgood{border-color:var(--good);background:var(--good-bg)}',
    '.sa-opt.sa-optno{opacity:.8}','.sa-optno .sa-opttxt{text-decoration:line-through}',
    '.sa-opt:disabled{cursor:default;color:var(--ink)}',
    '.sa-why{font-size:.8rem;font-weight:700;color:var(--ink-soft);text-decoration:none;display:block}',
    // web (learn)
    '.sa-web{position:relative;width:100%;max-width:520px;height:250px}',
    '.sa-wcentre{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);font-size:1.5rem;font-weight:800;background:#fff3cd;border:3px solid var(--gold);border-radius:16px;padding:6px 14px;white-space:nowrap}',
    '.sa-wslot{position:absolute;width:150px;min-height:54px;transform:translate(-50%,-50%);border:2px dashed #9aa8c7;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;font-weight:800;color:#9aa8c7;background:#fff}',
    '.sa-wslot b{font-size:1.2rem;color:var(--ink)}',
    '.sa-wslot small{font-size:.8rem;color:var(--ink-soft)}',
    '.sa-wfull{border-style:solid;border-color:var(--good);background:var(--good-bg)}',
    '.sa-w1{left:50%;top:13%}','.sa-w2{left:17%;top:35%}','.sa-w3{left:83%;top:35%}','.sa-w4{left:20%;top:85%}','.sa-w5{left:80%;top:85%}',
    '.sa-pool{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}',
    '.sa-card{font:inherit;font-size:1.2rem;font-weight:800;padding:8px 12px;border-radius:12px;border:2px solid #9aa8c7;background:#fff;color:var(--ink);cursor:grab;touch-action:none}',
    '.sa-shake{animation:sa-shake .4s}',
    '@keyframes sa-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}',
    '.sa-ghost{position:fixed;z-index:50;pointer-events:none;transform:translate(-50%,-50%);font-size:1.2rem;font-weight:800;padding:8px 12px;border-radius:12px;border:2px solid var(--gold);background:#fff8e1;box-shadow:0 6px 16px rgba(0,0,0,.15)}',
    '@media (max-width:700px){.sa-row{gap:12px}.sa-eq{font-size:1.25rem}.sa-box{width:50px}.sa-lab{font-size:1.05rem}.sa-lab .sa-box{width:42px;font-size:1.05rem}.sa-scap{font-size:.65rem}.sa-wslot{width:126px}.sa-td{font-size:1.1rem}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

/* Share It Out — find a fraction of a number by dealing things into equal groups (Unit 12.1).
 * Every fraction of a number is shown as sharing: objects are dealt one at a time onto
 * plates / into jars, the number in one group is the answer, and the division sentence
 * appears only after the sharing is done.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  /* ---------------------------------------------------------------- *
   * Things to share
   * ---------------------------------------------------------------- */
  var SETS = [
    { obj: 'cookie', many: 'cookies', box: 'plate', boxes: 'plates' },
    { obj: 'button', many: 'buttons', box: 'jar', boxes: 'jars' },
    { obj: 'marble', many: 'marbles', box: 'tray', boxes: 'trays' },
    { obj: 'sweet', many: 'sweets', box: 'bowl', boxes: 'bowls' },
  ];
  function setOf(name) {
    return SETS.filter(function (s) {
      return s.obj === name;
    })[0];
  }

  /** Stacked fraction as HTML. */
  function frac(n, d) {
    return '<span class="fso-frac"><span>' + n + '</span><span>' + d + '</span></span>';
  }

  /** "12 ÷ 3 = 4" card that slides in. */
  function sentence(n, d, a) {
    return el('div', { class: 'fso-sent', html: n + ' ÷ ' + d + ' = <b>' + a + '</b>' });
  }

  /** How many objects to put in one row inside a plate. */
  function colsFor(per) {
    if (per <= 3) return per;
    if (per === 4) return 2;
    if (per <= 6) return 3;
    if (per <= 8) return 4;
    return 5;
  }

  /** One object drawn at (0,0), about 24 units across. */
  function shape(kind) {
    var g = svg('g', { class: 'fso-obj fso-o-' + kind });
    g.appendChild(svg('circle', { r: 15, class: 'fso-halo' }));
    if (kind === 'cookie') {
      g.appendChild(svg('circle', { r: 12, fill: '#e3ab63', stroke: '#a8692b', 'stroke-width': 2 }));
      [[-4, -4], [4, -1], [-1, 5], [5, 6]].forEach(function (p) {
        g.appendChild(svg('circle', { cx: p[0], cy: p[1], r: 1.9, fill: '#5b3a1a' }));
      });
    } else if (kind === 'button') {
      g.appendChild(svg('circle', { r: 12, fill: '#4f8ef7', stroke: '#2c5fb8', 'stroke-width': 2 }));
      g.appendChild(svg('circle', { r: 7.5, fill: 'none', stroke: '#cfe0ff', 'stroke-width': 1.5 }));
      [[-2.8, -2.8], [2.8, -2.8], [-2.8, 2.8], [2.8, 2.8]].forEach(function (p) {
        g.appendChild(svg('circle', { cx: p[0], cy: p[1], r: 1.7, fill: '#fff' }));
      });
    } else if (kind === 'marble') {
      g.appendChild(svg('circle', { r: 12, fill: '#2ec4b6', stroke: '#178f84', 'stroke-width': 2 }));
      g.appendChild(svg('circle', { cx: -4, cy: -4, r: 3.5, fill: '#fff', opacity: 0.75 }));
    } else if (kind === 'sweet') {
      g.appendChild(svg('polygon', { points: '-8,0 -14,-6 -14,6', fill: '#ff8fab' }));
      g.appendChild(svg('polygon', { points: '8,0 14,-6 14,6', fill: '#ff8fab' }));
      g.appendChild(svg('circle', { r: 8.5, fill: '#ff4d79', stroke: '#c9184a', 'stroke-width': 2 }));
    } else {
      // cube
      g.appendChild(svg('rect', { x: -11, y: -11, width: 22, height: 22, rx: 4, fill: '#ffb703', stroke: '#c98a00', 'stroke-width': 2 }));
    }
    return g;
  }

  function place(node, x, y) {
    node.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  }

  /** A plate / jar / tray / bowl drawn into g, size w × h. */
  function drawBox(g, kind, w, h) {
    if (kind === 'jar') {
      g.appendChild(svg('rect', { x: 4, y: -11, width: w - 8, height: 11, rx: 3, class: 'fso-lid' }));
      g.appendChild(svg('rect', { x: 0, y: 0, width: w, height: h, rx: 10, class: 'fso-boxbody fso-b-jar' }));
    } else if (kind === 'tray') {
      g.appendChild(svg('rect', { x: 0, y: 0, width: w, height: h, rx: 6, class: 'fso-boxbody fso-b-tray' }));
    } else if (kind === 'bowl') {
      g.appendChild(svg('rect', { x: 0, y: 0, width: w, height: h, rx: Math.min(18, h / 2), class: 'fso-boxbody fso-b-bowl' }));
    } else {
      g.appendChild(svg('rect', { x: 0, y: 0, width: w, height: h, rx: Math.min(22, h / 2), class: 'fso-boxbody fso-b-plate' }));
      g.appendChild(svg('rect', { x: 5, y: 5, width: w - 10, height: h - 10, rx: Math.min(17, h / 2 - 5), class: 'fso-rim' }));
    }
  }

  /* ---------------------------------------------------------------- *
   * The share board: a tidy pile (rows of 10) above k empty boxes.
   * "Deal one each" deals one object into every box, one at a time.
   * ---------------------------------------------------------------- */
  function board(api, o) {
    var n = o.n;
    var k = o.k;
    var set = o.set;
    var per = Math.floor(n / k);
    var rem = n - per * k;
    var total = per * k;
    var PC = 32; // pile cell
    var S = 28; // cell inside a box
    var pileCols = Math.min(10, n);
    var pileRows = Math.ceil(n / pileCols);
    var cols = colsFor(per);
    var rowsIn = Math.ceil(per / cols);
    var bw = cols * S + 18;
    var bh = rowsIn * S + 16;
    var lid = set.box === 'jar' ? 11 : 0;
    var gap = k > 6 ? 10 : 18;
    var boxesW = k * bw + (k - 1) * gap;
    var pileW = pileCols * PC;
    var W = Math.max(boxesW, pileW, 420) + 40;
    var pileX0 = (W - pileW) / 2;
    var pileY0 = 34;
    var pileBottom = pileY0 + pileRows * PC;
    var boxY0 = pileBottom + 50 + lid;
    var bx0 = (W - boxesW) / 2;
    var H = boxY0 + bh + 34;

    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'fso-svg', style: { maxWidth: Math.min(760, Math.round(W * 1.15)) + 'px', height: 'auto' } });
    root.appendChild(svg('rect', { x: pileX0 - 8, y: pileY0 - 6, width: pileW + 16, height: pileRows * PC + 12, rx: 12, class: 'fso-pile' }));
    var pileLbl = svg('text', { x: W / 2, y: 22, class: 'fso-lbl', 'text-anchor': 'middle' }, n + ' ' + set.many);
    root.appendChild(pileLbl);
    var leftLbl = svg('text', { x: W / 2, y: pileBottom + 26, class: 'fso-leftlbl', 'text-anchor': 'middle' }, '');
    root.appendChild(leftLbl);

    var boxes = [];
    for (var p = 0; p < k; p++) {
      var bg = svg('g', { class: 'fso-box', 'data-idx': p, transform: 'translate(' + (bx0 + p * (bw + gap)) + ',' + boxY0 + ')' });
      drawBox(bg, set.box, bw, bh);
      var top = svg('text', { x: bw / 2, y: -lid - 9, class: 'fso-top', 'text-anchor': 'middle' }, '');
      var cnt = svg('text', { x: bw / 2, y: bh + 25, class: 'fso-cnt', 'text-anchor': 'middle' }, '');
      bg.appendChild(top);
      bg.appendChild(cnt);
      root.appendChild(bg);
      boxes.push({ g: bg, top: top, cnt: cnt });
    }

    var objs = [];
    function pilePos(i) {
      return [pileX0 + (i % pileCols) * PC + PC / 2, pileY0 + Math.floor(i / pileCols) * PC + PC / 2];
    }
    function slotPos(j) {
      var r = Math.floor(j / k);
      var bp = j % k;
      return [bx0 + bp * (bw + gap) + 9 + (r % cols) * S + S / 2, boxY0 + 8 + Math.floor(r / cols) * S + S / 2];
    }
    for (var i = 0; i < n; i++) {
      var ob = shape(set.obj);
      var pp = pilePos(i);
      place(ob, pp[0], pp[1]);
      root.appendChild(ob);
      objs.push(ob);
    }

    var dealt = 0;
    var busy = false;
    var done = false;
    var pending = [];
    var picking = null;

    var dealBtn = el('button', { class: 'btn fso-deal', type: 'button' }, 'Deal one each 🤲');
    var restBtn = el('button', { class: 'btn fso-dealall', type: 'button', hidden: true }, 'Deal the rest ⏩');
    var btnRow = el('div', { class: 'fso-btnrow' }, dealBtn, o.noRest ? null : restBtn);
    var wrap = el('div', { class: 'fso-board', 'data-done': '0', 'data-per': per, 'data-rem': rem }, root, btnRow);

    function updateBtns() {
      dealBtn.disabled = busy || done;
      restBtn.disabled = busy || done;
      restBtn.hidden = dealt === 0 || done;
      if (done) btnRow.style.display = 'none';
    }

    function moveOne() {
      if (dealt >= total) return;
      var j = dealt;
      var sp = slotPos(j);
      place(objs[n - 1 - j], sp[0], sp[1]);
      dealt++;
    }

    function finish() {
      done = true;
      wrap.setAttribute('data-done', '1');
      for (var q = 0; q < rem; q++) objs[q].classList.add('fso-left');
      if (rem) leftLbl.textContent = rem + ' left over';
      pileLbl.textContent = rem ? '' : 'All shared!';
      if (o.onDone) o.onDone();
    }

    function step(count, gapMs, cb) {
      busy = true;
      updateBtns();
      for (var c = 0; c < count; c++) api.later(moveOne, c * gapMs);
      api.later(function () {
        busy = false;
        if (dealt >= total && !done) finish();
        updateBtns();
        if (cb) cb();
        var list = pending;
        pending = [];
        list.forEach(function (f) {
          f();
        });
      }, Math.max(0, count - 1) * gapMs + 420);
    }

    function whenIdle(fn) {
      if (busy) pending.push(fn);
      else fn();
    }

    var b = {
      el: wrap,
      svg: root,
      n: n,
      k: k,
      per: per,
      rem: rem,
      isDone: function () {
        return done;
      },
      dealRound: function () {
        if (busy || done) return;
        api.sound('pop');
        step(Math.min(k, total - dealt), k > 5 ? 90 : 140);
      },
      dealRest: function (cb, fast) {
        whenIdle(function () {
          if (done) {
            if (cb) cb();
            return;
          }
          step(total - dealt, fast ? 35 : 70, cb);
        });
      },
      glow: function (idx) {
        boxes[idx].g.classList.add('fso-glow');
      },
      showCounts: function (idxs) {
        boxes.forEach(function (bx, ix) {
          if (!idxs || idxs.indexOf(ix) !== -1) bx.cnt.textContent = per;
        });
      },
      top: function (idx, text) {
        boxes[idx].top.textContent = text;
      },
      choose: function (idx) {
        boxes[idx].g.classList.add('fso-chosen');
      },
      chosen: function () {
        var out = [];
        boxes.forEach(function (bx, ix) {
          if (bx.g.classList.contains('fso-chosen')) out.push(ix);
        });
        return out;
      },
      /** Let the child click up to max boxes; onChange(listOfChosen). */
      pick: function (max, onChange) {
        picking = { max: max, onChange: onChange };
        root.classList.add('fso-picking');
      },
      stopPick: function () {
        picking = null;
        root.classList.remove('fso-picking');
      },
    };

    boxes.forEach(function (bx) {
      bx.g.addEventListener('click', function () {
        if (!picking) return;
        var on = bx.g.classList.contains('fso-chosen');
        if (!on && b.chosen().length >= picking.max) {
          api.feedback('You only need ' + picking.max + '. Click one again to swap.', 'info');
          return;
        }
        bx.g.classList.toggle('fso-chosen');
        api.sound('click');
        picking.onChange(b.chosen());
      });
    });

    dealBtn.addEventListener('click', b.dealRound);
    restBtn.addEventListener('click', function () {
      b.dealRest();
    });
    return b;
  }

  /* ---------------------------------------------------------------- *
   * Small input helpers
   * ---------------------------------------------------------------- */
  function smallInput(cls) {
    return el('input', { class: 'num-input fso-small ' + cls, type: 'text', inputmode: 'numeric', autocomplete: 'off', placeholder: '?' });
  }
  function readInt(input) {
    var s = String(input.value).trim();
    if (!/^\d+$/.test(s)) return NaN;
    return parseInt(s, 10);
  }
  function shake(input) {
    input.classList.add('shake');
    setTimeout(function () {
      input.classList.remove('shake');
    }, 400);
  }

  /** Numerator over denominator boxes + Check. */
  function fracInput(onSubmit) {
    var num = el('input', { class: 'num-input fso-fnum', type: 'text', inputmode: 'numeric', autocomplete: 'off', placeholder: '?', 'aria-label': 'Top number' });
    var den = el('input', { class: 'num-input fso-fden', type: 'text', inputmode: 'numeric', autocomplete: 'off', placeholder: '?', 'aria-label': 'Bottom number' });
    var btn = el('button', { class: 'btn btn-check fso-fcheck', type: 'button' }, 'Check');
    function submit() {
      if (num.disabled) return;
      onSubmit(readInt(num), readInt(den), num, den);
    }
    btn.addEventListener('click', submit);
    [num, den].forEach(function (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });
    });
    return {
      el: el('div', { class: 'fso-frow' }, el('div', { class: 'fso-fin' }, num, el('div', { class: 'fso-fbar' }), den), btn),
      num: num,
      den: den,
      set: function (a, c) {
        num.value = a;
        den.value = c;
      },
      disable: function () {
        num.disabled = den.disabled = btn.disabled = true;
      },
      good: function () {
        num.classList.add('good');
        den.classList.add('good');
      },
    };
  }

  /* ---------------------------------------------------------------- *
   * Practice deck
   * ---------------------------------------------------------------- */
  function multiples(d, lo, hi) {
    return U.range(lo, hi).filter(function (x) {
      return x % d === 0;
    });
  }

  var RING_SETS = [
    { total: 20, part: 2, obj: 'marble', many: 'marbles' },
    { total: 15, part: 5, obj: 'cube', many: 'cubes' },
    { total: 30, part: 3, obj: 'cube', many: 'cubes' },
  ];

  function makeDeck() {
    var q = [];
    // Level 1: 1/2, 1/4, 1/10 of 4-20
    U.shuffle([2, 4, 10]).forEach(function (d) {
      q.push({ type: 'unit', m: 1, d: d, n: U.pick(multiples(d, 4, 20)), set: U.pick(SETS), lvl: 1 });
    });
    // Level 2: 1/3, 1/5, 1/10 of numbers up to 40 (sometimes the book's 1/2 of 24 or 1/4 of 40)
    var dens = U.shuffle([3, 5, 10]);
    if (Math.random() < 0.5) dens[U.rand(0, 2)] = U.pick([2, 4]);
    dens.forEach(function (d) {
      var n = d === 2 ? 24 : d === 4 ? 40 : d === 10 ? U.pick([30, 40]) : U.pick(multiples(d, 12, 40));
      q.push({ type: 'unit', m: 1, d: d, n: n, set: U.pick(SETS), lvl: 2 });
    });
    // Level 3: a non-unit fraction, a "can it share?" and a ringed set
    U.shuffle(['nonunit', 'canshare', 'ring']).forEach(function (t) {
      if (t === 'nonunit') {
        var md = Math.random() < 0.6 ? [3, 4] : [2, 3];
        var nn = Math.random() < 0.3 && md[1] === 4 ? 20 : U.pick(multiples(md[1], 12, 40));
        q.push({ type: 'nonunit', m: md[0], d: md[1], n: nn, set: U.pick([setOf('button'), setOf('cookie'), setOf('sweet')]), lvl: 3 });
      } else if (t === 'canshare') {
        var d = U.pick([3, 4, 10]);
        var ok = Math.random() < 0.5;
        var pool = U.range(12, 30).filter(function (x) {
          return ok ? x % d === 0 : x % d !== 0;
        });
        var n2 = !ok && d === 3 && Math.random() < 0.4 ? 20 : U.pick(pool);
        q.push({ type: 'canshare', m: 1, d: d, n: n2, ok: ok, set: setOf('cookie'), lvl: 3 });
      } else {
        var rs = U.pick(RING_SETS);
        q.push({ type: 'ring', total: rs.total, part: rs.part, obj: rs.obj, many: rs.many, ask: Math.random() < 0.7 ? 'not' : 'ringed', lvl: 3 });
      }
    });
    return q;
  }

  function gcd(a, b) {
    return b ? gcd(b, a % b) : a;
  }

  /* ---------------------------------------------------------------- *
   * Practice: fraction of a number (unit and non-unit)
   * ---------------------------------------------------------------- */
  function renderShare(stage, api, q) {
    var per = q.n / q.d;
    var ans = per * q.m;
    var set = q.set;
    var two = q.lvl === 2; // also write the division sentence
    var wrap = el('div', { class: 'fso-q', 'data-type': q.type, 'data-answer': ans, 'data-n': q.n, 'data-d': q.d, 'data-m': q.m });
    stage.appendChild(wrap);
    wrap.appendChild(MQ.ui.prompt('What is ' + frac(q.m, q.d) + ' of <b>' + q.n + '</b>?'));
    wrap.appendChild(
      el('div', {
        class: 'fso-sub',
        html: 'The bottom number is <b>' + q.d + '</b>, so deal the ' + set.many + ' into <b>' + q.d + ' ' + set.boxes + '</b>.',
      })
    );
    api.say(q.m === 1 ? 'Press Deal to share them out.' : 'First share them into ' + q.d + ' ' + set.boxes + '.', 'think');

    var ni = MQ.ui.numberInput({ prefix: '', onSubmit: submit });
    ni.input.classList.add('fso-ans');
    var ansRow = el('div', { class: 'fso-ansrow' }, el('span', { html: frac(q.m, q.d) + ' of ' + q.n + ' =' }), ni.el);
    var after = el('div', { class: 'fso-after' });
    var sentRow = null;
    var s1, s2, s3;

    var bd = board(api, {
      n: q.n,
      k: q.d,
      set: set,
      onDone: function () {
        if (api.isAnswered()) return;
        if (q.m === 1) {
          api.say('How many ' + set.many + ' in one ' + set.box + '?', 'think');
          ni.enable();
          ni.focus();
        } else {
          api.say('Now click ' + q.m + ' ' + set.boxes + ' to take ' + q.m + ' parts.', 'think');
          api.feedback('The top number is ' + q.m + ': click ' + q.m + ' ' + set.boxes + '.', 'info');
          bd.pick(q.m, function (list) {
            if (list.length === q.m) {
              ni.enable();
              ni.focus();
              api.feedback('How many ' + set.many + ' are in your ' + q.m + ' ' + set.boxes + ' altogether?', 'info');
            } else ni.disable();
          });
        }
      },
    });
    wrap.appendChild(bd.el);
    wrap.appendChild(ansRow);
    wrap.appendChild(after);
    ni.disable();

    function showWorking() {
      MQ.clear(after);
      bd.showCounts();
      if (q.m === 1) {
        bd.glow(0);
        after.appendChild(sentence(q.n, q.d, per));
      } else {
        var ch = bd.chosen();
        ch.forEach(function (ix, j) {
          bd.top(ix, String(per * (j + 1)));
        });
        var parts = [];
        for (var i = 0; i < q.m; i++) parts.push(per);
        after.appendChild(sentence(q.n, q.d, per));
        after.appendChild(el('div', { class: 'fso-jumps' }, el('span', { class: 'fso-jlbl', text: q.m + ' ' + set.boxes + ':' }), MQ.ui.sum(parts, ans)));
      }
    }

    function wrongFirst(v) {
      var strong = api.tries() >= 1;
      if (v === q.n * q.d) return ['Sharing makes each group smaller, not bigger. Count one ' + set.box + '.', 'Multiplied instead of divided'];
      if (v === q.n) return ['That is all of the ' + set.many + '. ' + (q.m === 1 ? 'We want just one ' + set.box + '.' : 'We want ' + q.m + ' ' + set.boxes + '.'), q.m === 1 ? 'Divided by the top number' : 'Gave the whole amount'];
      if (q.m > 1 && v === per) return ['That is one ' + set.box + '. The top number says take ' + q.m + '. Count on: ' + per + ', ' + per * 2 + '…', 'Found one part only for 3/4'];
      if (q.m > 1 && q.n % q.m === 0 && v === q.n / q.m) return ['Share into the bottom number: ' + q.d + ' ' + set.boxes + ', not ' + q.m + '.', 'Divided by the top number'];
      if (q.m > 1 && v === q.m) return [q.m + ' is how many ' + set.boxes + ' we take. How many ' + set.many + ' are in them?', 'Divided by the top number'];
      if (strong) {
        if (q.m === 1) {
          bd.glow(0);
          return ['Point at each ' + set.obj + ' on the shining ' + set.box + ' and count: 1, 2, 3…', 'Miscounted one group'];
        }
        bd.chosen().forEach(function (ix) {
          bd.top(ix, String(per));
        });
        return ['Each ' + set.box + ' has ' + per + '. Count on in ' + per + 's for your ' + q.m + ' ' + set.boxes + '.', 'Miscounted one group'];
      }
      return [q.m === 1 ? 'Count the ' + set.many + ' in one ' + set.box + '. Every ' + set.box + ' has the same.' : 'Count one ' + set.box + ', then count on for each ' + set.box + ' you took.', 'Miscounted one group'];
    }

    function submit(v) {
      if (api.isAnswered()) return;
      if (v === ans) {
        ni.good();
        ni.disable();
        bd.stopPick();
        if (!two) {
          showWorking();
          api.check(true, 'Yes! ' + (q.m === 1 ? 'One ' + set.box + ' has ' + ans + '.' : q.m + ' ' + set.boxes + ' make ' + ans + '.'));
          return;
        }
        // Level 2: now write the sharing sentence
        bd.glow(0);
        bd.showCounts();
        api.say('Yes! Now write it as a sharing sentence.', 'happy');
        api.feedback('Write the sharing sentence: all of them ÷ number of ' + set.boxes + ' = one ' + set.box + '.', 'info');
        s1 = smallInput('fso-s1');
        s2 = smallInput('fso-s2');
        s3 = smallInput('fso-s3');
        var sb = el('button', { class: 'btn btn-check fso-scheck', type: 'button' }, 'Check');
        sentRow = el('div', { class: 'fso-sentrow' }, s1, el('span', null, '÷'), s2, el('span', null, '='), s3, sb);
        after.appendChild(sentRow);
        sb.addEventListener('click', submitSentence);
        [s1, s2, s3].forEach(function (inp) {
          inp.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
              e.preventDefault();
              submitSentence();
            }
          });
        });
        api.later(function () {
          try {
            s1.focus({ preventScroll: true });
          } catch (e) {
            s1.focus();
          }
        }, 30);
        return;
      }
      ni.bad();
      var w = wrongFirst(v);
      api.check(false, w[0], w[1]);
    }

    function submitSentence() {
      if (api.isAnswered()) return;
      var a = readInt(s1);
      var b = readInt(s2);
      var c = readInt(s3);
      if (isNaN(a) || isNaN(b) || isNaN(c)) {
        [s1, s2, s3].forEach(function (inp) {
          if (isNaN(readInt(inp))) shake(inp);
        });
        api.feedback('Fill all three boxes with numbers.', 'info');
        return;
      }
      if (a === q.n && b === q.d && c === per) {
        [s1, s2, s3].forEach(function (inp) {
          inp.classList.add('good');
          inp.disabled = true;
        });
        api.check(true, q.n + ' shared into ' + q.d + ' is ' + per + ' each. ' + q.n + ' ÷ ' + q.d + ' = ' + per + '!');
        return;
      }
      if (a === per && c === q.n) return api.check(false, 'Start with all of them: ' + q.n + ' ÷ …', 'Wrote the division back to front');
      if (a !== q.n) return api.check(false, 'The first number is how many we share out. How many ' + set.many + ' were there?', 'Wrong number in the division');
      if (b !== q.d) return api.check(false, 'We shared into ' + q.d + ' ' + set.boxes + ', so we divide by ' + q.d + '.', b === q.m ? 'Divided by the top number' : 'Wrong number in the division');
      api.check(false, 'The answer is how many in one ' + set.box + ': count the shining one.', 'Wrong number in the division');
    }

    api.onReveal(function () {
      ni.disable();
      bd.stopPick();
      if (sentRow) sentRow.parentNode.removeChild(sentRow);
      bd.dealRest(function () {
        if (q.m > 1) {
          var ch = bd.chosen();
          for (var i = 0; ch.length < q.m && i < q.d; i++) {
            if (ch.indexOf(i) === -1) {
              bd.choose(i);
              ch = bd.chosen();
            }
          }
        }
        ni.setValue(ans);
        ni.good();
        showWorking();
        api.feedback(
          q.m === 1
            ? 'Shared into ' + q.d + ' ' + set.boxes + ': each has ' + per + '. So ' + q.m + '/' + q.d + ' of ' + q.n + ' = ' + ans + '.'
            : 'Each ' + set.box + ' has ' + per + '. Take ' + q.m + ': ' + U.range(1, q.m).map(function (j) {
                return per * j;
              }).join(', ') + '. So ' + q.m + '/' + q.d + ' of ' + q.n + ' = ' + ans + '.',
          'info'
        );
      }, true);
    });
  }

  /* ---------------------------------------------------------------- *
   * Practice: can it share equally?
   * ---------------------------------------------------------------- */
  function renderCanShare(stage, api, q) {
    var set = q.set;
    var wrap = el('div', { class: 'fso-q', 'data-type': 'canshare', 'data-answer': q.ok ? 'yes' : 'no', 'data-n': q.n, 'data-d': q.d });
    stage.appendChild(wrap);
    wrap.appendChild(MQ.ui.prompt('Can we find ' + frac(1, q.d) + ' of <b>' + q.n + '</b> ' + set.many + '?'));
    wrap.appendChild(el('div', { class: 'fso-sub', html: 'Deal them onto <b>' + q.d + ' ' + set.boxes + '</b>. Does every ' + set.obj + ' fit equally?' }));
    api.say('Deal them out and see!', 'think');
    var result = el('div', { class: 'fso-after' });
    var ch = MQ.ui.choices(
      [
        { label: '✅ Yes, it shares equally', value: 'yes' },
        { label: '🚫 No, some are left over', value: 'no' },
      ],
      function (v) {
        if (v === (q.ok ? 'yes' : 'no')) {
          ch.mark(v, 'good');
          ch.disable();
          showResult();
          api.check(true, q.ok ? 'Yes! ' + q.n + ' shares into ' + q.d + ' equal groups.' : 'Yes! ' + bd.rem + ' left over, so it does not share equally.');
        } else {
          ch.mark(v, 'bad');
          if (q.ok) api.check(false, 'Look at the pile: is anything left? Every ' + set.box + ' has the same.', 'Thought it would not share equally');
          else api.check(false, 'Look at the pile: ' + bd.rem + ' ' + (bd.rem === 1 ? set.obj + ' is' : set.many + ' are') + ' left over. Can they go on the ' + set.boxes + ' equally?', 'Forced an answer that doesn\'t share');
        }
      },
      { columns: 2 }
    );
    ch.buttons.forEach(function (bt) {
      bt.setAttribute('data-value', bt.value_);
      bt.classList.add('fso-yn');
    });
    ch.disable();
    var bd = board(api, {
      n: q.n,
      k: q.d,
      set: set,
      onDone: function () {
        if (api.isAnswered()) return;
        ch.enable();
        api.say('Does it share equally?', 'think');
      },
    });
    wrap.appendChild(bd.el);
    wrap.appendChild(ch);
    wrap.appendChild(result);

    function showResult() {
      MQ.clear(result);
      bd.showCounts();
      if (q.ok) {
        bd.glow(0);
        result.appendChild(el('div', { class: 'fso-sent', html: frac(1, q.d) + ' of ' + q.n + ' = <b>' + bd.per + '</b>' }));
        result.appendChild(sentence(q.n, q.d, bd.per));
      } else {
        result.appendChild(el('div', { class: 'fso-stampbox' }, el('span', { html: frac(1, q.d) + ' of ' + q.n }), el('span', { class: 'fso-stamp' }, "can't share equally")));
      }
    }

    api.onReveal(function () {
      ch.disable();
      bd.dealRest(function () {
        ch.mark(q.ok ? 'yes' : 'no', 'good');
        showResult();
        api.feedback(q.ok ? 'Every ' + set.box + ' got ' + bd.per + ' and nothing is left. It shares equally.' : 'Each ' + set.box + ' got ' + bd.per + ', but ' + bd.rem + ' ' + (bd.rem === 1 ? 'is' : 'are') + ' left over. It does not share equally.', 'info');
      }, true);
    });
  }

  /* ---------------------------------------------------------------- *
   * Practice: what fraction is ringed / not ringed?
   * ---------------------------------------------------------------- */
  function ringPic(api, q) {
    var total = q.total;
    var part = q.part;
    var G = total / part;
    var rowLen = total === 15 ? 5 : 10;
    var PC = 36;
    var gpr = G <= 5 ? G : 5;
    var grows = Math.ceil(G / gpr);
    var gw = part * 30 + 14;
    var gh = 44;
    var ggap = 14;
    var groupedW = gpr * gw + (gpr - 1) * ggap;
    var W = Math.max(rowLen * PC, groupedW) + 40;
    var x0 = (W - rowLen * PC) / 2;
    var y0 = 14;
    var gx0 = (W - groupedW) / 2;
    var gy0 = 14;
    var rows = Math.ceil(total / rowLen);
    var H = Math.max(y0 + rows * PC, gy0 + grows * (gh + 26)) + 10;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'fso-svg fso-ringsvg', style: { maxWidth: '100%', height: 'auto' } });

    var gboxes = [];
    for (var gi = 0; gi < G; gi++) {
      var gxx = gx0 + (gi % gpr) * (gw + ggap);
      var gyy = gy0 + Math.floor(gi / gpr) * (gh + 26);
      var gb = svg('g', { class: 'fso-gbox' });
      gb.appendChild(svg('rect', { x: gxx, y: gyy, width: gw, height: gh, rx: 10 }));
      gb.appendChild(svg('text', { x: gxx + gw / 2, y: gyy + gh + 18, 'text-anchor': 'middle' }, String(gi + 1)));
      root.appendChild(gb);
      gboxes.push(gb);
    }
    var ring = svg('rect', { x: x0 - 3, y: y0 - 2, width: part * PC + 6, height: PC + 4, rx: 18, class: 'fso-ring' });
    root.appendChild(ring);
    var objs = [];
    for (var i = 0; i < total; i++) {
      var o = shape(q.obj);
      place(o, x0 + (i % rowLen) * PC + PC / 2, y0 + Math.floor(i / rowLen) * PC + PC / 2);
      root.appendChild(o);
      objs.push(o);
    }
    var grouped = false;
    return {
      svg: root,
      G: G,
      isGrouped: function () {
        return grouped;
      },
      group: function () {
        if (grouped) return;
        grouped = true;
        root.classList.add('fso-grouped');
        objs.forEach(function (ob, ix) {
          var g = Math.floor(ix / part);
          var w = ix % part;
          place(ob, gx0 + (g % gpr) * (gw + ggap) + 7 + w * 30 + 15, gy0 + Math.floor(g / gpr) * (gh + 26) + gh / 2);
        });
        ring.setAttribute('x', gx0 - 4);
        ring.setAttribute('y', gy0 - 4);
        ring.setAttribute('width', gw + 8);
        ring.setAttribute('height', gh + 8);
      },
    };
  }

  function renderRing(stage, api, q) {
    var not = q.total - q.part;
    var tn = q.ask === 'not' ? not : q.part;
    var g = gcd(tn, q.total);
    var sn = tn / g;
    var sd = q.total / g;
    var wrap = el('div', { class: 'fso-q', 'data-type': 'ring', 'data-answer': sn + '/' + sd, 'data-total': q.total, 'data-part': q.part });
    stage.appendChild(wrap);
    wrap.appendChild(MQ.ui.prompt('There are <b>' + q.total + '</b> ' + q.many + '. What fraction is <b>' + (q.ask === 'not' ? 'NOT ringed' : 'ringed') + '</b>?'));
    api.say('Count them. Then press Group them to help.', 'think');
    var pic = ringPic(api, q);
    var groupBtn = el('button', { class: 'btn fso-group-btn', type: 'button' }, 'Group them like the ring 🔁');
    var info = el('div', { class: 'fso-sub fso-ginfo' });
    var after = el('div', { class: 'fso-after' });
    function doGroup() {
      pic.group();
      groupBtn.disabled = true;
      info.innerHTML = '<b>' + pic.G + '</b> equal groups of ' + q.part + '. The ring holds <b>1</b> group.';
    }
    groupBtn.addEventListener('click', function () {
      api.sound('pop');
      doGroup();
    });
    var fi = fracInput(function (a, b, numEl, denEl) {
      if (api.isAnswered()) return;
      if (isNaN(a) && isNaN(b)) {
        shake(numEl);
        shake(denEl);
        return;
      }
      if (isNaN(b) || b === 0 || isNaN(a)) {
        api.check(false, 'Write a fraction: the top number AND the bottom number.', 'Gave a number instead of a fraction');
        return;
      }
      if (a * q.total === tn * b) {
        fi.good();
        fi.disable();
        showWorking();
        api.check(true, a === sn && b === sd ? 'Yes! ' + sn + '/' + sd + '.' : 'Yes! ' + a + '/' + b + ' is the same as ' + sn + '/' + sd + '.');
        return;
      }
      var other = q.total - tn;
      if (a * q.total === other * b) return api.check(false, 'That is the ' + (q.ask === 'not' ? 'ringed' : 'NOT ringed') + ' part. Look at the other ' + q.many + '.', 'Mixed up ringed and not ringed');
      if (api.tries() >= 1) {
        doGroup();
        return api.check(false, 'There are ' + pic.G + ' groups. ' + (q.ask === 'not' ? (pic.G - 1) + ' groups are not ringed' : '1 group is ringed') + ', so it is ? out of ' + pic.G + '.', b === q.total || b === pic.G ? 'Wrong fraction of a set' : 'Miscounted a scattered set');
      }
      api.check(false, 'Press Group them. The number of groups is the bottom number.', b !== q.total && b !== pic.G ? 'Miscounted a scattered set' : 'Wrong fraction of a set');
    });
    wrap.appendChild(pic.svg);
    wrap.appendChild(el('div', { class: 'fso-btnrow' }, groupBtn));
    wrap.appendChild(info);
    wrap.appendChild(el('div', { class: 'fso-ansrow' }, el('span', null, q.ask === 'not' ? 'Not ringed =' : 'Ringed ='), fi.el));
    wrap.appendChild(after);

    function showWorking() {
      doGroup();
      MQ.clear(after);
      var groupsTxt = q.ask === 'not' ? pic.G - 1 + ' of the ' + pic.G + ' groups' : '1 of the ' + pic.G + ' groups';
      after.appendChild(el('div', { class: 'fso-sent', html: tn + ' out of ' + q.total + ' = ' + frac(tn, q.total) + (g > 1 ? ' = ' + frac(sn, sd) : '') }));
      after.appendChild(el('div', { class: 'fso-sub', text: groupsTxt + ' → ' + sn + '/' + sd }));
    }
    api.onReveal(function () {
      fi.set(sn, sd);
      fi.good();
      fi.disable();
      showWorking();
    });
  }

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */
  function learnThird(stage, api) {
    api.say('A third means 3 equal groups. Press Deal until all the cookies are shared.');
    api.lockNext();
    stage.appendChild(MQ.ui.prompt('What is ' + frac(1, 3) + ' of <b>12</b>?'));
    stage.appendChild(el('div', { class: 'fso-sub', html: 'Bottom number <b>3</b> → <b>3 plates</b>. Deal one cookie to each plate, again and again.' }));
    var after = el('div', { class: 'fso-after' });
    var bd = board(api, {
      n: 12,
      k: 3,
      set: setOf('cookie'),
      noRest: true,
      onDone: function () {
        bd.glow(0);
        bd.showCounts();
        api.say('One plate has 4. So one third of 12 is 4!', 'cheer');
        after.appendChild(el('div', { class: 'fso-sent', html: frac(1, 3) + ' of 12 = <b>4</b>' }));
        api.later(function () {
          after.appendChild(sentence(12, 3, 4));
          api.feedback('Sharing 12 into 3 groups is 12 ÷ 3 = 4.', 'good');
          api.unlockNext();
        }, 900);
      },
    });
    stage.appendChild(bd.el);
    stage.appendChild(after);
  }

  function learnThreeQuarters(stage, api) {
    api.say('Three quarters of 20. First share into 4 jars.');
    api.lockNext();
    stage.appendChild(MQ.ui.prompt('What is ' + frac(3, 4) + ' of <b>20</b>?'));
    var sub = el('div', { class: 'fso-sub', html: 'Bottom number <b>4</b> → share into <b>4 jars</b>.' });
    stage.appendChild(sub);
    var after = el('div', { class: 'fso-after' });
    var bd = board(api, {
      n: 20,
      k: 4,
      set: setOf('button'),
      onDone: function () {
        bd.showCounts();
        sub.innerHTML = 'Each jar has <b>5</b>. Top number <b>3</b> → click <b>3 jars</b>.';
        api.say('Each jar has 5. Now click 3 jars.', 'think');
        bd.pick(3, function (list) {
          for (var i = 0; i < 4; i++) bd.top(i, '');
          list.forEach(function (ix, j) {
            bd.top(ix, String(5 * (j + 1)));
          });
          MQ.clear(after);
          if (list.length === 3) {
            bd.stopPick();
            after.appendChild(el('div', { class: 'fso-jumps' }, el('span', { class: 'fso-jlbl', text: 'Count on: ' }), MQ.ui.sum([5, 5, 5], 15)));
            after.appendChild(el('div', { class: 'fso-sent', html: frac(3, 4) + ' of 20 = <b>15</b>' }));
            api.say('5, 10, 15. Three quarters of 20 is 15!', 'cheer');
            api.feedback('Find one part (5), then take as many parts as the top number says (3).', 'good');
            api.unlockNext();
          }
        });
      },
    });
    stage.appendChild(bd.el);
    stage.appendChild(after);
  }

  function learnCantShare(stage, api) {
    api.say('Can we find a third of 20? Deal and see.');
    api.lockNext();
    stage.appendChild(MQ.ui.prompt('What is ' + frac(1, 3) + ' of <b>20</b>?'));
    stage.appendChild(el('div', { class: 'fso-sub', html: 'Deal 20 cookies onto <b>3 plates</b>.' }));
    var after = el('div', { class: 'fso-after' });
    var bd = board(api, {
      n: 20,
      k: 3,
      set: setOf('cookie'),
      onDone: function () {
        bd.showCounts();
        api.say('2 are left over. It does not share equally!', 'oops');
        after.appendChild(el('div', { class: 'fso-stampbox' }, el('span', { html: frac(1, 3) + ' of 20' }), el('span', { class: 'fso-stamp' }, "can't share equally")));
        api.feedback('Each plate has 6, but 2 are left. ⅓ of 20 is not a whole number of cookies.', 'info');
        api.unlockNext();
      },
    });
    stage.appendChild(bd.el);
    stage.appendChild(after);
  }

  function miniJars(per) {
    var cell = 13;
    var jw = Math.max(per, 1) * cell + 10;
    var gap = 8;
    var W = 4 * jw + 3 * gap;
    var H = 30;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'fso-mini', style: { maxWidth: '100%', height: 'auto' } });
    for (var j = 0; j < 4; j++) {
      var x = j * (jw + gap);
      root.appendChild(svg('rect', { x: x + 0.5, y: 4, width: jw - 1, height: H - 5, rx: 6, class: 'fso-minijar' + (j === 0 ? ' fso-minione' : '') }));
      for (var d = 0; d < per; d++) root.appendChild(svg('circle', { cx: x + 5 + d * cell + cell / 2, cy: 4 + (H - 5) / 2, r: 5, class: 'fso-minidot' }));
    }
    return root;
  }

  function learnPattern(stage, api) {
    api.say('Quarters of 4, 8, 12… Watch the jars fill up!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('A quarter pattern', 'Share into 4 jars. Add a row each time.'));
    var list = el('div', { class: 'fso-plist' });
    var btn = el('button', { class: 'btn fso-addrow', type: 'button' }, 'Next row ➕');
    var rows = 0;
    function addRow() {
      rows++;
      var n = rows * 4;
      list.appendChild(
        el(
          'div',
          { class: 'fso-prow' },
          el('span', { class: 'fso-pq', html: frac(1, 4) + ' of ' + n }),
          miniJars(rows),
          el('span', { class: 'fso-pa', text: '= ' + rows }),
          el('span', { class: 'fso-ps', text: n + ' ÷ 4 = ' + rows })
        )
      );
      if (rows >= 5) {
        btn.disabled = true;
        btn.hidden = true;
      }
      if (rows === 4) {
        api.say('1, 2, 3, 4… It is the 4 times table backwards!', 'cheer');
        api.feedback('Each time we add 4 more, every jar gets 1 more.', 'good');
        api.unlockNext();
      }
    }
    btn.addEventListener('click', function () {
      api.sound('pop');
      addRow();
    });
    addRow();
    stage.appendChild(list);
    stage.appendChild(btn);
  }

  /* ---------------------------------------------------------------- *
   * Register
   * ---------------------------------------------------------------- */
  var deck = null;

  MQ.register('fraction-share-out', {
    learn: [learnThird, learnThreeQuarters, learnCantShare, learnPattern],
    practice: {
      count: 9,
      makeDeck: makeDeck,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = makeDeck();
        var q = deck[api.index];
        if (q.type === 'unit' || q.type === 'nonunit') return renderShare(stage, api, q);
        if (q.type === 'canshare') return renderCanShare(stage, api, q);
        return renderRing(stage, api, q);
      },
    },
  });

  var css = [
    '.fso-q{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}',
    '.fso-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;margin:0 .12em;font-weight:800}',
    '.fso-frac>span:first-child{border-bottom:3px solid currentColor;padding:0 .18em 1px}',
    '.fso-frac>span:last-child{padding:1px .18em 0}',
    '.fso-sub{font-size:1.1rem;text-align:center;color:var(--ink-soft);max-width:720px}',
    '.fso-sub b{color:var(--ink)}',
    '.fso-board{width:100%;display:flex;flex-direction:column;align-items:center;gap:8px}',
    '.fso-svg{display:block;width:100%;max-width:760px;height:auto}',
    '.fso-ringsvg{max-width:640px}',
    '.fso-obj{transition:transform .35s ease;pointer-events:none}',
    '.fso-halo{fill:none;stroke:none}',
    '.fso-left .fso-halo{fill:#ffe0cc;stroke:#e8590c;stroke-width:2.5}',
    '.fso-pile{fill:#fafbfc;stroke:#cfd8e3;stroke-width:2;stroke-dasharray:6 5}',
    '.fso-lbl{font-size:17px;font-weight:800;fill:var(--ink-soft)}',
    '.fso-leftlbl{font-size:18px;font-weight:800;fill:#d9480f}',
    '.fso-boxbody{stroke-width:3;transition:fill .3s,stroke .3s}',
    '.fso-b-plate{fill:#fff;stroke:#c3cfdc}',
    '.fso-rim{fill:none;stroke:#e6ecf2;stroke-width:2}',
    '.fso-b-jar{fill:#eef6ff;stroke:#7aa7d9}',
    '.fso-lid{fill:#7aa7d9}',
    '.fso-b-tray{fill:#f6ecdc;stroke:#b08b57}',
    '.fso-b-bowl{fill:#fdf0f4;stroke:#e7a6bb}',
    '.fso-glow .fso-boxbody{stroke:#f4a100;stroke-width:5;fill:#fff4cc}',
    '.fso-chosen .fso-boxbody{stroke:#2a9d8f;stroke-width:5;fill:#dcf5ee}',
    '.fso-picking .fso-box{cursor:pointer}',
    '.fso-picking .fso-box:hover .fso-boxbody{stroke:#2a9d8f}',
    '.fso-top{font-size:20px;font-weight:800;fill:#1d7f74}',
    '.fso-cnt{font-size:18px;font-weight:800;fill:var(--ink)}',
    '.fso-btnrow{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.fso-after{display:flex;flex-direction:column;align-items:center;gap:8px;min-height:0}',
    '.fso-sent{font-size:1.5rem;font-weight:800;background:#fff3cd;border:2px solid var(--gold);border-radius:14px;padding:6px 18px;animation:fsoSlide .5s ease;text-align:center}',
    '.fso-sent b{color:#0b6e66}',
    '@keyframes fsoSlide{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}',
    '.fso-jumps{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;animation:fsoSlide .5s ease}',
    '.fso-jlbl{font-weight:800;font-size:1.15rem}',
    '.fso-ansrow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;font-size:1.4rem;font-weight:800}',
    '.fso-sentrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center;font-size:1.6rem;font-weight:800;animation:fsoSlide .5s ease}',
    '.fso-small{width:76px;height:54px}',
    '.fso-frow{display:flex;align-items:center;gap:12px}',
    '.fso-fin{display:inline-flex;flex-direction:column;align-items:center;gap:4px}',
    '.fso-fin .num-input{width:84px;height:48px}',
    '.fso-fbar{width:96px;height:4px;border-radius:2px;background:var(--ink)}',
    '.fso-stampbox{display:flex;align-items:center;gap:18px;background:#fff;border:3px solid var(--line);border-radius:14px;padding:8px 18px;font-size:1.4rem;font-weight:800}',
    '.fso-stamp{display:inline-block;border:4px solid #d9480f;color:#d9480f;border-radius:10px;padding:4px 12px;font-weight:900;font-size:1.05rem;text-transform:uppercase;letter-spacing:.04em;transform:rotate(-7deg);animation:fsoStamp .4s ease}',
    '@keyframes fsoStamp{from{opacity:0;transform:scale(1.8) rotate(-7deg)}to{opacity:1;transform:scale(1) rotate(-7deg)}}',
    '.fso-gbox rect{fill:#f3f8ff;stroke:#9bb3cf;stroke-width:2;stroke-dasharray:5 4}',
    '.fso-gbox text{font-size:15px;font-weight:800;fill:var(--ink-soft)}',
    '.fso-gbox{opacity:0;transition:opacity .4s}',
    '.fso-grouped .fso-gbox{opacity:1}',
    '.fso-ring{fill:none;stroke:#e85d75;stroke-width:4;transition:all .4s}',
    '.fso-plist{display:flex;flex-direction:column;gap:6px;width:100%;max-width:640px}',
    '.fso-prow{display:grid;grid-template-columns:110px 1fr 60px 120px;align-items:center;gap:10px;background:#fff;border:2px solid var(--line);border-radius:12px;padding:4px 12px;font-size:1.2rem;font-weight:800;animation:fsoSlide .4s ease}',
    '.fso-mini{justify-self:start}',
    '.fso-minijar{fill:#eef6ff;stroke:#7aa7d9;stroke-width:2}',
    '.fso-minione{fill:#fff4cc;stroke:#f4a100}',
    '.fso-minidot{fill:#4f8ef7}',
    '.fso-pa{color:#0b6e66}',
    '.fso-ps{color:var(--ink-soft);font-size:1.05rem}',
    '@media (max-width:640px){.fso-prow{grid-template-columns:90px 1fr 46px;font-size:1rem}.fso-ps{grid-column:1/-1}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'fraction-share-out' }, css));
})();

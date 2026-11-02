/* Chunk and Divide — division by taking away chunks of groups (Unit 11.3, workbook-led).
 * Workbook p.160 Q2 starts 86 ÷ 4 in a repeated-subtraction layout: take away 10 groups of 4
 * (86 − 40 = 46), again (46 − 40 = 6), then 1 group (6 − 4 = 2). Add up the groups:
 * 10 + 10 + 1 = 21, so 86 ÷ 4 = 21 r2. The textbook never teaches this layout, so every
 * step here is shown with real crayons: the tray always holds exactly the number left.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var U = MQ.util;

  var COLORS = ['#e63946', '#2a9d8f', '#f4a261', '#457b9d', '#8ab17d', '#e76f9a', '#9b5de5', '#f2c14e'];
  var CHUNK_COLORS = ['#2a9d8f', '#e07a1f', '#7b61c9', '#d64161', '#3a86c8', '#5c9e3a'];

  function crayon(i, cls) {
    return el('span', { class: 'cad-cr' + (cls ? ' ' + cls : ''), style: { background: COLORS[i % COLORS.length] } });
  }
  function groupsWord(g) {
    return g === 1 ? '1 group' : g + ' groups';
  }
  function sentence(n, d, q, r) {
    return n + ' ÷ ' + d + ' = ' + q + (r ? ' r' + r : '');
  }

  /* ------------------------------------------------------------------ *
   * The bench: a tray of crayons (rows of 10), the boxes the groups go
   * into, and the written layout that builds alongside.
   *   opts.chunks: groups already taken, e.g. [10, 10]
   *   opts.showTotal: show the running tally of groups (levels 1–2, learn)
   * ------------------------------------------------------------------ */
  function bench(n, d, opts) {
    opts = opts || {};
    var state = { left: n, chunks: [], pending: null, gen: 0 };
    (opts.chunks || []).forEach(function (g) {
      state.chunks.push({ g: g, before: state.left, take: g * d, after: state.left - g * d });
      state.left -= g * d;
    });

    var tray = el('div', { class: 'cad-tray' });
    var trayLabel = el('div', { class: 'cad-label' });
    var boxes = el('div', { class: 'cad-boxes' });
    var tally = el('div', { class: 'cad-tally' + (opts.showTotal ? '' : ' cad-hidden') });
    var lines = el('div', { class: 'cad-lines' });
    var total = el('div', { class: 'cad-total cad-hidden' });
    var layout = el(
      'div',
      { class: 'cad-layout' },
      el('div', { class: 'cad-line cad-head' }, el('span', { class: 'cad-calc' }, 'Take away'), el('span', { class: 'cad-gn' }, 'Groups')),
      el('div', { class: 'cad-line cad-start' }, el('span', { class: 'cad-calc' }, 'Start with ' + n), el('span', { class: 'cad-gn' })),
      lines,
      total
    );
    var root = el(
      'div',
      { class: 'cad-bench' },
      el('div', { class: 'cad-left' }, el('div', { class: 'cad-tray-wrap' }, tray, trayLabel), el('div', { class: 'cad-boxes-wrap' }, boxes, tally)),
      layout
    );

    function drawTray(going) {
      MQ.clear(tray);
      var rows = Math.ceil(state.left / 10);
      for (var r = 0; r < rows; r++) {
        var row = el('div', { class: 'cad-row' });
        for (var c = 0; c < 10 && r * 10 + c < state.left; c++) {
          var i = r * 10 + c;
          row.appendChild(crayon(i, going && i >= state.left - going ? 'cad-going' : opts.hl && i < opts.hl ? 'cad-hl' : ''));
        }
        tray.appendChild(row);
      }
      tray.classList.toggle('cad-empty', state.left === 0);
      trayLabel.textContent = state.left === 1 ? '1 crayon in the tray' : state.left + ' crayons in the tray';
    }

    function drawBoxes() {
      MQ.clear(boxes);
      if (!state.chunks.length) boxes.appendChild(el('div', { class: 'cad-boxes-empty' }, 'Boxes of ' + d + ' go here'));
      state.chunks.forEach(function (ch, k) {
        var color = CHUNK_COLORS[k % CHUNK_COLORS.length];
        var wrap = el('div', { class: 'cad-chunk', style: { borderColor: color } });
        var inner = el('div', { class: 'cad-chunk-in', style: { gridTemplateColumns: 'repeat(' + Math.min(ch.g, 5) + ', auto)' } });
        for (var b = 0; b < ch.g; b++) {
          var box = el('span', { class: 'cad-box' });
          for (var j = 0; j < d; j++) box.appendChild(crayon(j + b, 'cad-mini'));
          inner.appendChild(box);
        }
        wrap.appendChild(inner);
        wrap.appendChild(el('span', { class: 'cad-chunk-n', style: { color: color } }, groupsWord(ch.g)));
        boxes.appendChild(wrap);
      });
      var gs = state.chunks.map(function (c) {
        return c.g;
      });
      var sum = gs.reduce(function (a, b) {
        return a + b;
      }, 0);
      tally.textContent = 'Groups so far: ' + (gs.length > 1 ? gs.join(' + ') + ' = ' : '') + sum;
    }

    function lineEl(ch, k) {
      var color = CHUNK_COLORS[k % CHUNK_COLORS.length];
      return el(
        'div',
        { class: 'cad-line' },
        el('span', { class: 'cad-calc' }, ch.before + ' − ' + ch.take + ' = ', el('b', { class: 'cad-after' }, String(ch.after))),
        el('span', { class: 'cad-gn', style: { color: color } }, groupsWord(ch.g))
      );
    }

    function drawLines() {
      MQ.clear(lines);
      state.chunks.forEach(function (ch, k) {
        lines.appendChild(lineEl(ch, k));
      });
      if (state.pending) lines.appendChild(state.pending.row);
    }

    function draw(going) {
      drawTray(going);
      drawBoxes();
      drawLines();
    }

    var b = {
      el: root,
      state: state,
      layout: layout,
      lines: lines,
      draw: draw,
      groups: function () {
        return state.chunks.reduce(function (a, c) {
          return a + c.g;
        }, 0);
      },
      // Move g groups out of the tray. Animated unless api is null.
      commit: function (g, api, cb) {
        var take = g * d;
        var gen = ++state.gen;
        function done() {
          if (gen !== state.gen) return;
          state.chunks.push({ g: g, before: state.left, take: take, after: state.left - take });
          state.left -= take;
          state.pending = null;
          draw();
          if (cb) cb();
        }
        if (!api) return done();
        drawTray(take);
        MQ.sound('pop');
        api.later(done, 520);
      },
      // A typed line (level 3): "46 − 40 = [ ]  10 groups".
      startPending: function (g, input, btn) {
        var k = state.chunks.length;
        var color = CHUNK_COLORS[k % CHUNK_COLORS.length];
        var row = el(
          'div',
          { class: 'cad-line cad-pending' },
          el('span', { class: 'cad-calc' }, state.left + ' − ' + g * d + ' = ', input, btn),
          el('span', { class: 'cad-gn', style: { color: color } }, groupsWord(g))
        );
        state.pending = { g: g, row: row };
        lines.appendChild(row);
      },
      // Finish every step at once (for Show me), using the biggest chunk that fits.
      finishAll: function (sizes) {
        state.gen++;
        if (state.pending) {
          var pg = state.pending.g;
          state.pending = null;
          state.chunks.push({ g: pg, before: state.left, take: pg * d, after: state.left - pg * d });
          state.left -= pg * d;
        }
        while (state.left >= d) {
          var g = 1;
          for (var i = 0; i < sizes.length; i++)
            if (sizes[i] * d <= state.left) {
              g = sizes[i];
              break;
            }
          state.chunks.push({ g: g, before: state.left, take: g * d, after: state.left - g * d });
          state.left -= g * d;
        }
        draw();
      },
      showTotal: function () {
        var gs = state.chunks.map(function (c) {
          return c.g;
        });
        MQ.clear(total);
        total.appendChild(el('span', { class: 'cad-calc' }, 'Left: ', el('b', null, String(state.left))));
        total.appendChild(el('span', { class: 'cad-gn' }, (gs.length > 1 ? gs.join(' + ') + ' = ' : '') + b.groups()));
        total.classList.remove('cad-hidden');
        tally.classList.remove('cad-hidden');
      },
      highlightLine: function (k) {
        var rows = lines.querySelectorAll('.cad-line');
        if (rows[k]) rows[k].classList.add('cad-line-hl');
      },
    };
    draw();
    return b;
  }

  // "Check: 21 × 4 + 2 = 86" with the chunks as a bridge: 40 + 40 + 4 = 84, 84 + 2 = 86.
  function checkLine(n, d, chunks, r) {
    var takes = chunks.map(function (c) {
      return c.take;
    });
    var q = chunks.reduce(function (a, c) {
      return a + c.g;
    }, 0);
    var row = el('div', { class: 'cad-check' });
    row.appendChild(el('span', { class: 'chip' }, 'Check: ' + q + ' × ' + d + ' + ' + r + ' = ' + n));
    row.appendChild(el('span', { class: 'chip' }, (takes.length > 1 ? takes.join(' + ') + ' = ' : '') + q * d + (r ? ', and ' + q * d + ' + ' + r + ' = ' + n : '')));
    return row;
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */
  function learnEstimate(stage, api) {
    api.say('86 crayons. We want to pack them in boxes of 4. First, a quick estimate!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('86 ÷ 4: estimate first', '8 rows of 10, and 6 more. Press the button to count <b>10 groups of 4</b> at a time.'));
    var hl = 0;
    var bigTray = el('div', { class: 'cad-tray cad-tray-big' });
    var label = el('div', { class: 'cad-label' }, '86 crayons in the tray');
    var count = el('div', { class: 'cad-sentence cad-running' }, '0 groups of 4 = 0');
    function draw() {
      MQ.clear(bigTray);
      for (var r = 0; r < 9; r++) {
        var row = el('div', { class: 'cad-row' });
        for (var c = 0; c < 10 && r * 10 + c < 86; c++) row.appendChild(crayon(r * 10 + c, r * 10 + c < hl ? 'cad-hl' : ''));
        bigTray.appendChild(row);
      }
    }
    draw();
    var out = el('div', { class: 'cad-out' });
    var btn = el('button', { class: 'btn btn-big', type: 'button' }, 'Count 10 groups of 4');
    btn.addEventListener('click', function () {
      if (hl >= 80) return;
      hl += 40;
      draw();
      api.sound('pop');
      count.textContent = hl / 4 + ' groups of 4 = ' + hl;
      if (hl === 40) {
        api.say('10 groups of 4 is 40. That is 4 rows of 10! Again!', 'happy');
        return;
      }
      btn.disabled = true;
      out.appendChild(el('div', { class: 'cad-sentence' }, '80 ÷ 4 = 20'));
      out.appendChild(el('div', { class: 'cad-note' }, '20 groups of 4 = 80. 86 is a bit more than 80, so 86 ÷ 4 is a bit more than 20.'));
      api.say('20 groups of 4 make 80. 86 is a bit more, so the answer is a bit more than 20.', 'cheer');
      api.feedback('Estimate: 80 ÷ 4 = 20. The answer is a bit more than 20.', 'good');
      api.unlockNext();
    });
    stage.appendChild(el('div', { class: 'cad-tray-wrap' }, bigTray, label));
    stage.appendChild(count);
    stage.appendChild(btn);
    stage.appendChild(out);
  }

  function chunkButton(label) {
    return el('button', { class: 'btn cad-take', type: 'button' }, label);
  }

  function learnFirstChunk(stage, api) {
    api.say('Let\'s take 10 groups of 4 in one go. Press the button!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Take a big chunk', '10 boxes, 4 crayons in each. Watch the tray and the sum.'));
    var b = bench(86, 4, { showTotal: true });
    var btn = chunkButton('Take 10 groups of 4');
    btn.addEventListener('click', function () {
      btn.disabled = true;
      b.commit(10, api, function () {
        b.highlightLine(0);
        api.say('40 crayons went into 10 boxes. 86 − 40 = 46 left.', 'cheer');
        api.feedback('10 groups of 4 = 40. We write 86 − 40 = 46, and 10 groups.', 'good');
        api.unlockNext();
      });
    });
    stage.appendChild(b.el);
    stage.appendChild(el('div', { class: 'cad-btns' }, btn));
  }

  function learnMoreChunks(stage, api) {
    api.say('46 left. Is that enough for 10 more groups of 4? Yes, 46 is more than 40!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Keep going', 'Take 10 groups again. Then take single groups.'));
    var b = bench(86, 4, { chunks: [10], showTotal: true });
    var ten = chunkButton('Take 10 groups of 4');
    var one = chunkButton('Take 1 group of 4');
    one.disabled = true;
    ten.addEventListener('click', function () {
      ten.disabled = true;
      b.commit(10, api, function () {
        one.disabled = false;
        api.say('6 left. 10 groups would need 40, too many. But 1 group of 4 fits!', 'happy');
        api.feedback('46 − 40 = 6. That is 20 groups so far.', 'good');
      });
    });
    one.addEventListener('click', function () {
      one.disabled = true;
      b.commit(1, api, function () {
        api.say('6 − 4 = 2. That makes 21 groups.', 'cheer');
        api.feedback('Groups so far: 10 + 10 + 1 = 21. Only 2 crayons left.', 'good');
        api.unlockNext();
      });
    });
    stage.appendChild(b.el);
    stage.appendChild(el('div', { class: 'cad-btns' }, ten, one));
  }

  function learnTotal(stage, api) {
    api.say('Only 2 left. 2 is smaller than 4, so we stop. Now add up the groups!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Stop and add up', '2 is smaller than 4: no more groups. Press the button to add the <b>Groups</b> column.'));
    var b = bench(86, 4, { chunks: [10, 10, 1] });
    var run = el('div', { class: 'cad-sentence cad-running' }, 'Groups: ?');
    var parts = [];
    var out = el('div', { class: 'cad-out' });
    var btn = el('button', { class: 'btn btn-big', type: 'button' }, 'Add the next group');
    btn.addEventListener('click', function () {
      var k = parts.length;
      if (k >= 3) return;
      parts.push(b.state.chunks[k].g);
      b.highlightLine(k);
      api.sound('pop');
      run.textContent = 'Groups: ' + parts.join(' + ') + (parts.length > 1 ? ' = ' + parts.reduce(function (a, c) { return a + c; }, 0) : '');
      if (parts.length < 3) return;
      btn.disabled = true;
      b.showTotal();
      out.appendChild(el('div', { class: 'cad-sentence' }, '86 ÷ 4 = 21 ', el('span', { class: 'cad-r' }, 'r2')));
      out.appendChild(el('div', { class: 'cad-note' }, '21 is close to our estimate of 20.'));
      out.appendChild(checkLine(86, 4, b.state.chunks, 2));
      api.say('21 groups and 2 left over. 86 ÷ 4 = 21 r2. Close to 20!', 'cheer');
      api.feedback('Check: 21 × 4 + 2 = 86.', 'good');
      api.unlockNext();
    });
    stage.appendChild(b.el);
    stage.appendChild(run);
    stage.appendChild(btn);
    stage.appendChild(out);
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * Level 1: dividends 20–60, ÷ 2 or ÷ 5. Level 2: 40–99, ÷ 3 or ÷ 4.
   * Level 3: workbook items. Every quotient is at least 10 (one 10-groups chunk).
   * ------------------------------------------------------------------ */
  var BOOK = [
    { n: 53, d: 2, en: 50 },
    { n: 91, d: 4, en: 80 },
    { n: 97, d: 3, en: 90 },
    { n: 74, d: 5, en: 70 },
    { n: 86, d: 4, en: 80 },
  ];
  var deck = null;

  function mk(n, d, lvl, extra) {
    var q = { n: n, d: d, q: Math.floor(n / d), r: n % d, lvl: lvl };
    if (extra) for (var k in extra) q[k] = extra[k];
    return q;
  }

  function buildDeck() {
    var out = [];
    var used = {};
    BOOK.forEach(function (x) {
      used[x.n + '/' + x.d] = true; // keep the workbook items for level 3
    });
    function addFrom(gen) {
      for (var g = 0; g < 200; g++) {
        var q = gen();
        var key = q.n + '/' + q.d;
        if (!used[key]) {
          used[key] = true;
          out.push(q);
          return;
        }
      }
    }
    // Level 1: ÷ 2 keeps the single groups to at most 4 clicks (quotient ends in 0–4).
    U.shuffle([2, 5, U.pick([2, 5])]).forEach(function (d) {
      addFrom(function () {
        var n;
        if (d === 5) n = U.rand(50, 60);
        else
          do {
            n = U.rand(20, 60);
          } while (Math.floor(n / 2) % 10 > 4);
        return mk(n, d, 1);
      });
    });
    U.shuffle([3, 4, U.pick([3, 4])]).forEach(function (d) {
      addFrom(function () {
        return mk(U.rand(40, 99), d, 2);
      });
    });
    U.shuffle(BOOK.slice())
      .slice(0, 2)
      .forEach(function (x) {
        out.push(mk(x.n, x.d, 3, { en: x.en, eq: x.en / x.d }));
      });
    return out;
  }

  /* ------------------------------------------------------------------ *
   * Practice
   * ------------------------------------------------------------------ */
  function smallBox(label, cls) {
    return el('input', { class: 'cad-box-in' + (cls ? ' ' + cls : ''), type: 'text', inputmode: 'numeric', autocomplete: 'off', maxlength: 3, 'aria-label': label });
  }
  function focusLater(api, input) {
    api.later(function () {
      try {
        input.focus({ preventScroll: true });
      } catch (e) {}
    }, 30);
  }
  function onEnter(input, fn) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        fn();
      }
    });
  }

  function renderQ(stage, api, q) {
    var n = q.n;
    var d = q.d;
    var lvl = q.lvl;
    var typed = lvl === 3;
    var sizes = lvl === 1 ? [10, 1] : [10, 5, 1];
    var finished = false; // stopped correctly: answer boxes showing
    var busy = false;

    stage.appendChild(el('div', { class: 'prompt' }, 'Work out ', el('b', null, n + ' ÷ ' + d), ' by taking away groups of ', el('b', null, String(d)), '.'));
    if (q.en) {
      stage.appendChild(el('div', { class: 'cad-est' }, 'Estimate: ' + q.en + ' ÷ ' + d + ' = ' + q.eq + ', so the answer is a bit more than ' + q.eq + '.'));
      api.say('Take away groups. Type what is left each time. Then add up the groups.');
    } else if (api.index === 0) api.say('Take 10 groups while you can. Then take single groups. Stop when what is left is smaller than ' + d + '.');
    else api.say('Divide ' + n + ' by ' + d + '. Big chunks first!');

    var b = bench(n, d, { showTotal: !typed });
    stage.appendChild(b.el);

    // Chunk buttons
    var btnEls = sizes.map(function (g) {
      var bt = chunkButton('Take ' + groupsWord(g) + ' of ' + d);
      bt.addEventListener('click', function () {
        take(g);
      });
      return bt;
    });
    var stopBtn = el('button', { class: 'btn btn-ghost cad-stop', type: 'button' }, 'Stop: too few left');
    stopBtn.addEventListener('click', stop);
    var btnRow = el('div', { class: 'cad-btns' }, btnEls.concat([stopBtn]));
    stage.appendChild(btnRow);

    // Final answer row
    var bq = smallBox('How many groups');
    var br = smallBox('Remainder');
    var checkBtn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    var answer = el('div', { class: 'cad-answer cad-hidden' }, el('span', { class: 'cad-eq' }, n + ' ÷ ' + d + ' ='), bq, el('span', { class: 'cad-eq' }, 'r'), br, checkBtn);
    var key = el('div', { class: 'cad-key cad-hidden' }, typed ? 'Add up the Groups column. The remainder is what is left.' : 'Groups taken, then r and what is left in the tray.');
    var out = el('div', { class: 'cad-out' });
    stage.appendChild(answer);
    stage.appendChild(key);
    stage.appendChild(out);
    [bq, br].forEach(function (x) {
      onEnter(x, submit);
    });
    checkBtn.addEventListener('click', submit);

    // Level 3 typed line
    var lineIn = null;
    var lineBtn = null;

    function setButtons(on) {
      btnEls.forEach(function (x) {
        x.disabled = !on;
      });
      stopBtn.disabled = !on;
    }

    function take(g) {
      if (busy || finished || api.isAnswered() || b.state.pending) return;
      var left = b.state.left;
      if (g * d > left) {
        api.sound('click');
        var smaller = left >= d ? ' Try a smaller chunk.' : ' ' + left + ' is smaller than ' + d + ', so press Stop.';
        api.feedback('Only ' + left + ' left. ' + groupsWord(g) + ' of ' + d + ' would need ' + g * d + '.' + smaller, 'info');
        api.say(g === 1 ? 'Not enough for a whole group of ' + d + '.' : 'That chunk is too big. ' + groupsWord(g) + ' of ' + d + ' is ' + g * d + '.', 'think');
        return;
      }
      if (g === 1 && left >= 10 * d) api.feedback('Tip: ' + left + ' is enough for 10 groups of ' + d + '. Big chunks are quicker!', 'info');
      else api.feedback('', 'info');
      if (typed) {
        lineIn = smallBox('What is left', 'cad-line-in');
        lineBtn = el('button', { class: 'btn btn-check cad-line-btn', type: 'button' }, 'OK');
        b.startPending(g, lineIn, lineBtn);
        setButtons(false);
        onEnter(lineIn, checkLine3);
        lineBtn.addEventListener('click', checkLine3);
        focusLater(api, lineIn);
        api.say(b.state.left + ' take away ' + g * d + '. How many are left?', 'think');
        return;
      }
      busy = true;
      setButtons(false);
      b.commit(g, api, function () {
        busy = false;
        setButtons(true);
      });
    }

    function checkLine3() {
      if (api.isAnswered() || !b.state.pending || busy) return;
      var g = b.state.pending.g;
      var left = b.state.left;
      var want = left - g * d;
      var raw = lineIn.value.trim();
      var v = raw === '' ? NaN : U.parseNum(raw);
      if (isNaN(v)) {
        api.feedback('Type how many are left after taking away ' + g * d + '.', 'info');
        return;
      }
      if (v === want) {
        lineIn.classList.remove('bad');
        busy = true;
        b.commit(g, api, function () {
          busy = false;
          setButtons(true);
          api.say(b.state.left >= d ? b.state.left + ' left. Can you take another group?' : b.state.left + ' left. Is that smaller than ' + d + '?', 'happy');
        });
        lineIn.disabled = true;
        lineBtn.disabled = true;
        return;
      }
      lineIn.classList.add('bad');
      var strong = api.tries() >= 1;
      if (g > 1 && v === left - d) {
        api.check(false, groupsWord(g) + ' of ' + d + ' is ' + g * d + ', not ' + d + '. Take away ' + g * d + '.', 'Took away one group instead of 10 groups');
        return;
      }
      var hint;
      var t = g * d;
      if (strong) {
        if (t % 10 === 0 && t >= 10) hint = left + ' − ' + t + ': ' + Math.floor(left / 10) + ' tens take away ' + t / 10 + ' tens is ' + (Math.floor(left / 10) - t / 10) + ' tens. The ones (' + (left % 10) + ') stay the same.';
        else hint = 'Count back ' + t + ' from ' + left + '. Or think: what + ' + t + ' makes ' + left + '?';
      } else hint = 'Check the subtraction: ' + left + ' − ' + t + '. Then check it: your answer + ' + t + ' should make ' + left + '.';
      api.check(false, hint, 'Subtraction slip');
    }

    function stop() {
      if (busy || finished || api.isAnswered() || b.state.pending) return;
      var left = b.state.left;
      if (left >= d) {
        var h = left === d ? 'Can we take another group? What\'s left is ' + d + ', that is exactly 1 more group of ' + d + '!' : 'Can we take another group? What\'s left (' + left + ') is bigger than ' + d + '.';
        api.check(false, h, 'Stopped too early');
        return;
      }
      finished = true;
      setButtons(false);
      answer.classList.remove('cad-hidden');
      key.classList.remove('cad-hidden');
      api.say(left + ' is smaller than ' + d + ', so we stop. How many groups altogether? What is left?', 'happy');
      api.feedback('Now fill in the boxes.', 'info');
      focusLater(api, bq);
    }

    function lockAll() {
      setButtons(false);
      bq.disabled = true;
      br.disabled = true;
      checkBtn.disabled = true;
      if (lineIn) lineIn.disabled = true;
      if (lineBtn) lineBtn.disabled = true;
    }

    function groupsSum() {
      return b.state.chunks
        .map(function (c) {
          return c.g;
        })
        .join(' + ');
    }

    function submit() {
      if (api.isAnswered() || !finished) return;
      var a = bq.value.trim() === '' ? NaN : U.parseNum(bq.value);
      var r = br.value.trim() === '' ? 0 : U.parseNum(br.value);
      if (isNaN(a) || isNaN(r)) {
        api.feedback('Type how many groups, and how many are left over.', 'info');
        return;
      }
      if (br.value.trim() === '') br.value = '0';
      bq.classList.toggle('good', a === q.q);
      bq.classList.toggle('bad', a !== q.q);
      br.classList.toggle('good', r === q.r);
      br.classList.toggle('bad', r !== q.r);
      if (a === q.q && r === q.r) {
        lockAll();
        b.showTotal();
        MQ.clear(out);
        out.appendChild(el('div', { class: 'cad-sentence' }, sentence(n, d, q.q, q.r)));
        out.appendChild(checkLine(n, d, b.state.chunks, q.r));
        var praise = b.state.chunks.length > 1 ? groupsSum() + ' = ' + q.q + ' groups.' : q.q + ' groups.';
        api.check(true, 'Yes! ' + praise + ' ' + sentence(n, d, q.q, q.r) + '.');
        return;
      }
      var strong = api.tries() >= 1;
      if (r >= d) {
        api.check(false, r + ' is enough for another group of ' + d + '! The remainder must be smaller than ' + d + '. It is what is left in the tray.', 'Remainder not smaller than the divisor');
        return;
      }
      if (a !== q.q) {
        var gs = groupsSum();
        api.check(false, strong ? 'Add up the groups column: ' + gs + ' = ' + q.q + '.' : 'Add up the groups column: ' + gs + '.', 'Lost count of the groups');
        return;
      }
      api.check(false, 'The remainder is what is left at the end: look at the tray. ' + b.state.left + ' crayons.', 'Subtraction slip');
    }

    api.onReveal(function () {
      busy = false;
      finished = true;
      b.finishAll(sizes);
      lockAll();
      answer.classList.remove('cad-hidden');
      bq.value = q.q;
      br.value = q.r;
      bq.classList.remove('bad');
      br.classList.remove('bad');
      bq.classList.add('good');
      br.classList.add('good');
      b.showTotal();
      MQ.clear(out);
      out.appendChild(el('div', { class: 'cad-sentence' }, sentence(n, d, q.q, q.r)));
      out.appendChild(el('div', { class: 'cad-note' }, 'Groups: ' + groupsSum() + ' = ' + q.q + '. ' + q.r + ' is smaller than ' + d + ', so it is the remainder.'));
      out.appendChild(checkLine(n, d, b.state.chunks, q.r));
    });
  }

  MQ.register('chunk-and-divide', {
    _buildDeck: buildDeck, // used only by test scripts
    learn: [learnEstimate, learnFirstChunk, learnMoreChunks, learnTotal],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (api.index === 0 || !deck) deck = buildDeck();
        var q = deck[api.index];
        stage.setAttribute('data-cad', q.n + '/' + q.d);
        api.cleanup(function () {
          stage.removeAttribute('data-cad');
        });
        renderQ(stage, api, q);
      },
    },
  });

  document.head.appendChild(
    el(
      'style',
      { 'data-activity': 'chunk-and-divide' },
      [
        '.cad-bench{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:center;gap:18px;width:100%;max-width:960px;}',
        '.cad-left{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:center;gap:14px;flex:1 1 380px;min-width:0;}',
        '.cad-tray-wrap{display:flex;flex-direction:column;align-items:center;gap:4px;}',
        '.cad-tray{display:flex;flex-direction:column;gap:3px;padding:8px 10px;min-height:30px;min-width:118px;background:#fbf3e4;border:3px solid #d9b98a;border-radius:12px;box-sizing:border-box;}',
        '.cad-tray.cad-empty{background:#f6f1e8;}',
        '.cad-row{display:flex;gap:3px;}',
        '.cad-cr{display:inline-block;width:8px;height:20px;border-radius:1px 1px 2px 2px;clip-path:polygon(50% 0,100% 28%,100% 100%,0 100%,0 28%);box-shadow:inset 0 -6px 0 rgba(255,255,255,.35);transition:opacity .45s,transform .45s;}',
        '.cad-tray-big .cad-cr{width:11px;height:28px;}',
        '.cad-tray-big .cad-row{gap:5px;}',
        '.cad-hl{outline:2px solid #1d6fd1;outline-offset:1px;}',
        '.cad-going{opacity:.15;transform:translateY(-10px) scale(.7);}',
        '.cad-label{font-weight:700;color:var(--ink-soft);font-size:1rem;}',
        '.cad-boxes-wrap{display:flex;flex-direction:column;align-items:center;gap:6px;flex:1 1 220px;min-width:0;}',
        '.cad-boxes{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;align-content:flex-start;min-height:44px;width:100%;}',
        '.cad-boxes-empty{color:var(--ink-soft);border:2px dashed var(--line);border-radius:10px;padding:10px 14px;font-weight:700;}',
        '.cad-chunk{display:flex;flex-direction:column;align-items:center;gap:2px;border:2px solid;border-radius:10px;padding:4px;background:#fff;max-width:100%;box-sizing:border-box;}',
        '.cad-chunk-in{display:grid;gap:3px;justify-content:center;}',
        '.cad-chunk-n{font-size:.85rem;font-weight:800;}',
        '.cad-box{display:inline-flex;gap:1px;padding:2px 3px;background:#f3e2c7;border:2px solid #b5835a;border-radius:4px;align-items:flex-end;}',
        '.cad-mini{width:5px;height:14px;}',
        '.cad-tally{font-size:1.25rem;font-weight:800;background:#eef6ff;border:2px solid #9cc3ee;border-radius:12px;padding:4px 14px;}',
        '.cad-layout{display:flex;flex-direction:column;gap:2px;background:#fff;border:2px solid var(--line);border-radius:14px;padding:8px 14px;min-width:260px;box-sizing:border-box;}',
        '.cad-line{display:flex;justify-content:space-between;align-items:center;gap:16px;font-size:1.35rem;font-weight:700;padding:3px 6px;border-radius:8px;}',
        '.cad-head{font-size:.95rem;color:var(--ink-soft);border-bottom:2px solid var(--line);border-radius:0;}',
        '.cad-start{color:var(--ink-soft);font-size:1.15rem;}',
        '.cad-calc{display:inline-flex;align-items:center;gap:4px;white-space:nowrap;}',
        '.cad-gn{font-weight:800;white-space:nowrap;min-width:84px;text-align:right;}',
        '.cad-line-hl{background:#fff3cd;}',
        '.cad-pending{background:#f4f0ff;}',
        '.cad-total{display:flex;justify-content:space-between;gap:16px;font-size:1.3rem;font-weight:800;border-top:3px double var(--ink);padding:4px 6px 0;margin-top:2px;}',
        '.cad-total .cad-gn{color:var(--ink);}',
        '.cad-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;}',
        '.cad-btns .btn{font-size:1rem;padding-left:16px;padding-right:16px;}',
        '.cad-out{display:flex;flex-direction:column;align-items:center;gap:6px;}',
        '.cad-sentence{font-size:1.8rem;font-weight:800;background:#fff3cd;border:2px solid var(--gold);border-radius:14px;padding:6px 18px;}',
        '.cad-running{font-size:1.5rem;min-width:200px;text-align:center;}',
        '.cad-r{color:#c2410c;}',
        '.cad-note{font-size:1.1rem;font-weight:700;color:var(--ink-soft);text-align:center;}',
        '.cad-est{font-size:1.05rem;font-weight:700;color:var(--ink-soft);background:var(--info-bg);border-radius:10px;padding:4px 12px;text-align:center;}',
        '.cad-key{font-size:.95rem;color:var(--ink-soft);text-align:center;}',
        '.cad-check{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;font-size:1.1rem;font-weight:700;}',
        '.cad-answer{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px;}',
        '.cad-hidden{display:none!important;}',
        '.cad-eq{font-size:1.7rem;font-weight:800;}',
        '.cad-box-in{width:80px;height:54px;font-size:1.6rem;font-weight:800;text-align:center;border-radius:12px;border:3px solid var(--line);font-family:inherit;color:var(--ink);box-sizing:border-box;}',
        '.cad-box-in.cad-line-in{width:64px;height:40px;font-size:1.3rem;border-radius:9px;}',
        '.cad-line-btn{padding:6px 12px;font-size:1rem;min-height:0;}',
        '.cad-box-in.good{border-color:var(--good);background:var(--good-bg);}',
        '.cad-box-in.bad{border-color:var(--try);background:var(--try-bg);}',
        '@media (max-width:860px){.cad-line{font-size:1.15rem;gap:10px;}.cad-layout{min-width:0;width:100%;max-width:420px;}.cad-gn{min-width:70px;}.cad-tray-big .cad-cr{width:9px;height:24px;}.cad-tray-big .cad-row{gap:4px;}}',
      ].join('\n')
    )
  );
})();

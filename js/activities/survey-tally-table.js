/* Class survey — collect data, tally it, turn the tally chart into a frequency table (Unit 2.1).
 * Learn: plan a party question with four choices, ask 10 people, tally, add a Frequency
 * column, then say what the data shows. Practice: tally things in a picture (L1), faces
 * with answers plus a title (L2), and 20–24 raw cards / flat shapes with totals and 0 rows (L3).
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var NUM_WORDS = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve'];
  var CAT_COLORS = ['#ff9f1c', '#2ec4b6', '#e76f51', '#8e7dbe', '#3a86ff', '#90be6d', '#f15bb5'];
  var SKINS = ['#f6d3b3', '#e8b98f', '#c68c5d', '#8d5a3b', '#f1c27d'];
  var HAIRS = ['#2b2b2b', '#6b3e26', '#d9a441', '#a0522d', '#4a4a4a'];
  var PASTELS = ['#ffd6a5', '#caffbf', '#9bf6ff', '#bdb2ff', '#ffc6ff', '#fdffb6', '#a0c4ff'];

  /* ---------------------------------------------------------------- *
   * Drawing helpers
   * ---------------------------------------------------------------- */

  /** Tally marks as gates of five. perLine = how many groups before wrapping. */
  function tallySvg(n, perLine) {
    perLine = perLine || 3;
    var S = 9;
    var H = 30;
    var STEP = 46;
    var LINE = H + 8;
    var units = [];
    for (var g = 0; g < Math.floor(n / 5); g++) units.push(5);
    if (n % 5) units.push(n % 5);
    var lines = Math.max(1, Math.ceil(units.length / perLine));
    var cols = Math.max(1, Math.min(units.length, perLine));
    var W = (cols - 1) * STEP + 42;
    var Ht = lines * LINE - 6;
    var root = svg('svg', { class: 'st-tally', viewBox: '0 0 ' + W + ' ' + Ht, width: W, height: Ht, 'data-n': n, role: 'img', 'aria-label': n + ' tally marks' });
    units.forEach(function (u, i) {
      var x0 = (i % perLine) * STEP + 6;
      var y0 = Math.floor(i / perLine) * LINE + 2;
      for (var s = 0; s < Math.min(u, 4); s++) {
        root.appendChild(svg('line', { x1: x0 + s * S, y1: y0, x2: x0 + s * S, y2: y0 + H - 4, class: 'st-stroke' }));
      }
      if (u === 5) root.appendChild(svg('line', { x1: x0 - 6, y1: y0 + H - 8, x2: x0 + 3 * S + 6, y2: y0 + 4, class: 'st-stroke st-cross' }));
    });
    return root;
  }

  function faceSvg(seed, size) {
    var skin = SKINS[seed % SKINS.length];
    var hair = HAIRS[(seed * 3 + 1) % HAIRS.length];
    var style = seed % 3;
    return svg(
      'svg',
      { viewBox: '0 0 60 60', width: size, height: size, class: 'st-face', 'aria-hidden': 'true' },
      style === 1 ? svg('rect', { x: 9, y: 24, width: 42, height: 26, rx: 9, fill: hair }) : null,
      svg('circle', { cx: 30, cy: 27, r: style === 2 ? 19 : 21, fill: hair }),
      svg('circle', { cx: 30, cy: 33, r: 18, fill: skin }),
      style === 0 ? svg('path', { d: 'M13 28 Q30 12 47 28 Q40 20 30 20 Q20 20 13 28 Z', fill: hair }) : null,
      svg('circle', { cx: 24, cy: 32, r: 2.4, fill: '#1b2a4a' }),
      svg('circle', { cx: 36, cy: 32, r: 2.4, fill: '#1b2a4a' }),
      svg('path', { d: 'M23 39 q7 6 14 0', fill: 'none', stroke: '#1b2a4a', 'stroke-width': 2.4, 'stroke-linecap': 'round' })
    );
  }

  var CAR_COLOURS = {
    red: '#e63946',
    blue: '#2f6fdb',
    white: '#ffffff',
    black: '#2b2b2b',
    yellow: '#ffd23f',
    green: '#3aa655',
    silver: '#b8bec6',
  };

  function carSvg(colour) {
    return svg(
      'svg',
      { viewBox: '0 0 72 42', width: 64, height: 38, class: 'st-car', 'aria-hidden': 'true' },
      svg('path', { d: 'M5 30 L5 22 Q7 18 13 17 L21 8 Q23 6 27 6 L45 6 Q49 6 52 9 L59 17 Q65 18 67 22 L67 30 Z', fill: CAR_COLOURS[colour], stroke: '#333', 'stroke-width': 2, class: 'st-car-body', 'data-colour': colour }),
      svg('path', { d: 'M25 10 L20 17 L34 17 L34 10 Z', fill: '#d6ecff', stroke: '#333', 'stroke-width': 1 }),
      svg('path', { d: 'M38 10 L38 17 L54 17 L48 10 Z', fill: '#d6ecff', stroke: '#333', 'stroke-width': 1 }),
      svg('circle', { cx: 18, cy: 31, r: 6, fill: '#333' }),
      svg('circle', { cx: 54, cy: 31, r: 6, fill: '#333' }),
      svg('circle', { cx: 18, cy: 31, r: 2.2, fill: '#ccc' }),
      svg('circle', { cx: 54, cy: 31, r: 2.2, fill: '#ccc' })
    );
  }

  function regular(n, r, rot) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var a = rot + (i * 2 * Math.PI) / n - Math.PI / 2;
      pts.push([Math.round(32 + r * Math.cos(a)), Math.round(33 + r * Math.sin(a))]);
    }
    return pts;
  }

  var SHAPES = {
    0: [{ circle: 25 }, { circle: 19 }, { circle: 14 }],
    3: [
      { pts: [[32, 6], [58, 54], [6, 54]] },
      { pts: [[8, 8], [8, 56], [56, 56]] },
      { pts: [[32, 4], [46, 58], [18, 58]] },
      { pts: [[4, 46], [60, 46], [24, 12]] },
      { pts: [[16, 18], [48, 18], [32, 46]] },
    ],
    4: [
      { pts: [[10, 10], [54, 10], [54, 54], [10, 54]] },
      { pts: [[18, 18], [46, 18], [46, 46], [18, 46]] },
      { pts: [[4, 18], [60, 18], [60, 46], [4, 46]] },
      { pts: [[20, 4], [44, 4], [44, 60], [20, 60]] },
      { pts: [[32, 4], [60, 32], [32, 60], [4, 32]] },
    ],
    5: [{ pts: [[32, 4], [58, 26], [58, 58], [6, 58], [6, 26]] }, { pts: regular(5, 27, 0) }, { pts: regular(5, 22, Math.PI / 5) }, { pts: [[8, 8], [56, 8], [56, 40], [32, 58], [8, 40]] }],
  };

  function shapeSvg(shape, fill) {
    var root = svg('svg', { viewBox: '0 0 64 64', width: 60, height: 60, class: 'st-shape', 'aria-hidden': 'true' });
    if (shape.circle) root.appendChild(svg('circle', { cx: 32, cy: 32, r: shape.circle, fill: fill, class: 'st-shape-fig' }));
    else root.appendChild(svg('polygon', { points: shape.pts.map(function (p) { return p.join(','); }).join(' '), fill: fill, class: 'st-shape-fig' }));
    return root;
  }

  function cornerDots(svgEl, shape) {
    if (!shape.pts) return;
    shape.pts.forEach(function (p) {
      svgEl.appendChild(svg('circle', { cx: p[0], cy: p[1], r: 4.5, class: 'st-corner-dot' }));
    });
  }

  /* ---------------------------------------------------------------- *
   * Tally / frequency table
   * o: { cats:[{key,label,plain}], head, freq, freqHidden, total, sideways, perLine, onHit(key), caption }
   * ---------------------------------------------------------------- */
  function makeTable(o) {
    var t = { tallies: {}, inputs: {}, hits: {}, tcell: {}, labels: {}, totalInput: null };
    var table = el('table', { class: 'st-table' + (o.sideways ? ' st-side' : '') });
    function hitCell(tag, c, content, cls) {
      var cell = el(tag, { class: 'st-hit ' + (cls || ''), 'data-cat': c.key, title: 'Tally ' + c.plain, onclick: function () { if (o.onHit) o.onHit(c.key); } }, content);
      (t.hits[c.key] = t.hits[c.key] || []).push(cell);
      return cell;
    }
    function freqInput(c) {
      var inp = el('input', { class: 'st-freq', type: 'text', inputmode: 'numeric', maxlength: 3, autocomplete: 'off', 'data-cat': c.key, 'aria-label': 'Frequency for ' + c.plain });
      t.inputs[c.key] = inp;
      return inp;
    }
    var sideTotal = null;
    if (!o.sideways) {
      table.appendChild(el('thead', null, el('tr', null, el('th', null, o.head), el('th', null, 'Tally'), o.freq ? el('th', { class: 'st-fcol' }, 'Frequency') : null)));
      var body = el('tbody');
      o.cats.forEach(function (c) {
        var lab = el('span', { class: 'st-lab', html: c.label });
        t.labels[c.key] = lab;
        var tc = hitCell('td', c, null, 'st-tcell');
        t.tcell[c.key] = tc;
        body.appendChild(el('tr', { 'data-cat': c.key }, hitCell('td', c, lab, 'st-labcell'), tc, o.freq ? el('td', { class: 'st-fcol' }, freqInput(c)) : null));
      });
      if (o.total) {
        t.totalInput = el('input', { class: 'st-freq st-total', type: 'text', inputmode: 'numeric', maxlength: 3, autocomplete: 'off', 'aria-label': 'Total' });
        body.appendChild(el('tr', { class: 'st-totrow' }, el('th', null, 'Total'), el('td'), el('td', { class: 'st-fcol' }, t.totalInput)));
      }
      table.appendChild(body);
    } else {
      var r1 = el('tr', null, el('th', { class: 'st-rowhead' }, o.head));
      var r2 = el('tr', null, el('th', { class: 'st-rowhead' }, 'Tally'));
      var r3 = el('tr', { class: 'st-fcol' }, el('th', { class: 'st-rowhead' }, 'Frequency'));
      o.cats.forEach(function (c) {
        var lab = el('span', { class: 'st-lab', html: c.label });
        t.labels[c.key] = lab;
        r1.appendChild(hitCell('th', c, lab, 'st-labcell'));
        var tc = hitCell('td', c, null, 'st-tcell');
        t.tcell[c.key] = tc;
        r2.appendChild(tc);
        r3.appendChild(el('td', null, freqInput(c)));
      });
      table.appendChild(el('tbody', null, r1, r2, o.freq ? r3 : null));
      if (o.total) {
        t.totalInput = el('input', { class: 'st-freq st-total', type: 'text', inputmode: 'numeric', maxlength: 3, autocomplete: 'off', 'aria-label': 'Total' });
        sideTotal = el('div', { class: 'st-sidetotal st-fcol' }, el('b', null, 'Total'), t.totalInput);
      }
    }
    o.cats.forEach(function (c) {
      t.tallies[c.key] = 0;
    });
    t.setTally = function (k, n) {
      t.tallies[k] = n;
      MQ.clear(t.tcell[k]);
      t.tcell[k].setAttribute('data-tally', n);
      if (n) t.tcell[k].appendChild(tallySvg(n, o.perLine));
    };
    t.addTally = function (k) {
      t.setTally(k, t.tallies[k] + 1);
      var s = t.tcell[k].querySelector('svg');
      if (s) s.classList.add('st-pop');
    };
    t.flashRow = function (k, cls) {
      (t.hits[k] || []).forEach(function (c) {
        c.classList.remove('st-flash-good', 'st-flash-bad');
        void c.offsetWidth;
        c.classList.add(cls);
      });
    };
    t.colorRow = function (k, color) {
      t.labels[k].style.setProperty('--st-cc', color);
      t.labels[k].classList.add('st-lab-col');
    };
    t.wrap = el('div', { class: 'st-tablewrap' + (o.freqHidden ? ' st-nofreq' : '') + (o.sideways ? ' st-tablewrap-side' : '') }, o.caption || null, el('div', { class: 'st-tablescroll' }, table), sideTotal);
    t.el = t.wrap;
    t.showFreq = function () {
      t.wrap.classList.remove('st-nofreq');
      t.wrap.classList.add('st-grow');
    };
    t.allInputs = function () {
      var list = o.cats.map(function (c) {
        return t.inputs[c.key];
      });
      if (t.totalInput) list.push(t.totalInput);
      return list.filter(Boolean);
    };
    t.setHitEnabled = function (on) {
      t.wrap.classList.toggle('st-nohit', !on);
    };
    return t;
  }

  /** Enter in one box moves to the next; on the last box it calls done(). */
  function chainInputs(inputs, done) {
    inputs.forEach(function (inp, i) {
      inp.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        if (i < inputs.length - 1) inputs[i + 1].focus();
        else done();
      });
      inp.addEventListener('input', function () {
        inp.classList.remove('st-bad', 'st-good');
      });
    });
  }

  function readNum(inp) {
    var v = (inp.value || '').trim();
    if (v === '') return null;
    if (!/^\d+$/.test(v)) return NaN;
    return parseInt(v, 10);
  }

  function setInputState(inp, kind) {
    inp.classList.remove('st-good', 'st-bad');
    if (kind) inp.classList.add('st-' + kind);
  }

  /* ---------------------------------------------------------------- *
   * Learn screens: the party survey (shared across the three screens)
   * ---------------------------------------------------------------- */
  var PARTY_QS = [
    {
      key: 'drink',
      icon: '🥤',
      q: 'Which drink would you like?',
      head: 'Drink',
      noun: 'drink',
      opts: [
        { key: 'water', icon: '💧', name: 'water' },
        { key: 'milk', icon: '🥛', name: 'milk' },
        { key: 'juice', icon: '🧃', name: 'juice' },
        { key: 'milkshake', icon: '🥤', name: 'milkshake' },
        { key: 'lemonade', icon: '🍋', name: 'lemonade' },
        { key: 'cocoa', icon: '☕', name: 'hot chocolate' },
      ],
    },
    {
      key: 'food',
      icon: '🍕',
      q: 'Which party food would you like?',
      head: 'Food',
      noun: 'food',
      opts: [
        { key: 'pizza', icon: '🍕', name: 'pizza' },
        { key: 'sandwiches', icon: '🥪', name: 'sandwiches' },
        { key: 'watermelon', icon: '🍉', name: 'watermelon' },
        { key: 'cupcakes', icon: '🧁', name: 'cupcakes' },
        { key: 'biscuits', icon: '🍪', name: 'biscuits' },
        { key: 'popcorn', icon: '🍿', name: 'popcorn' },
      ],
    },
    {
      key: 'game',
      icon: '🎲',
      q: 'Which party game would you like?',
      head: 'Game',
      noun: 'game',
      opts: [
        { key: 'chairs', icon: '🪑', name: 'musical chairs' },
        { key: 'balloons', icon: '🎈', name: 'balloon pop' },
        { key: 'puzzles', icon: '🧩', name: 'puzzles' },
        { key: 'football', icon: '⚽', name: 'football' },
        { key: 'hide', icon: '🙈', name: 'hide and seek' },
        { key: 'dancing', icon: '💃', name: 'dancing' },
      ],
    },
  ];
  var PEOPLE = ['Mum', 'Dad', 'Gran', 'Grandad', 'Auntie', 'Uncle', 'Sister', 'Brother', 'Cousin Sam', 'Cousin Mia'];
  var SPLITS = [
    [5, 3, 1, 1],
    [6, 2, 1, 1],
    [5, 2, 2, 1],
    [7, 2, 1, 0],
    [6, 3, 1, 0],
    [5, 3, 2, 0],
  ].filter(function (s) {
    return s.indexOf(0) === -1;
  });

  var party = null;

  function makeParty(question, opts) {
    var split = U.pick(SPLITS);
    var order = U.shuffle(opts);
    var answers = [];
    order.forEach(function (o, i) {
      for (var n = 0; n < split[i]; n++) answers.push(o.key);
    });
    var counts = {};
    opts.forEach(function (o) {
      counts[o.key] = 0;
    });
    answers.forEach(function (a) {
      counts[a]++;
    });
    return { question: question, opts: opts, answers: U.shuffle(answers), counts: counts, done: false, freqDone: false };
  }

  function ensureParty() {
    if (party && party.done) return party;
    var q = PARTY_QS[0];
    party = makeParty(q, q.opts.slice(0, 4));
    party.done = true;
    return party;
  }

  function partyCats(p) {
    return p.opts.map(function (o) {
      return { key: o.key, label: '<span class="st-ico">' + o.icon + '</span> ' + o.name, plain: o.name };
    });
  }

  function optByKey(p, k) {
    return p.opts.filter(function (o) {
      return o.key === k;
    })[0];
  }

  function topOpt(p) {
    var best = p.opts[0];
    p.opts.forEach(function (o) {
      if (p.counts[o.key] > p.counts[best.key]) best = o;
    });
    return best;
  }

  // Learn 1: question, four choices, then ask 10 people and tally.
  function learnSurvey(stage, api) {
    api.lockNext();
    api.say('Let\'s plan a party! First we need ONE question. Pick one.', 'happy');
    var holder = el('div', { class: 'st-learn' });
    stage.appendChild(holder);

    function pickQuestion() {
      MQ.clear(holder);
      holder.appendChild(MQ.ui.lesson('Plan a party', 'A survey starts with <b>one question</b>.'));
      var row = el('div', { class: 'st-qcards' });
      PARTY_QS.forEach(function (q) {
        row.appendChild(
          el('button', { class: 'st-qcard', type: 'button', 'data-q': q.key, onclick: function () { MQ.sound('click'); pickOptions(q); } }, el('span', { class: 'st-qicon' }, q.icon), el('span', null, q.q))
        );
      });
      holder.appendChild(row);
    }

    function pickOptions(q) {
      MQ.clear(holder);
      api.say('Now pick exactly FOUR choices for people to choose from.', 'think');
      holder.appendChild(MQ.ui.prompt(q.q));
      var chosen = [];
      var count = el('div', { class: 'st-pickcount' }, '0 of 4 picked');
      var go = el('button', { class: 'btn st-go', type: 'button', disabled: true }, 'Ask 10 people ▶');
      var grid = el('div', { class: 'st-optcards' });
      q.opts.forEach(function (o) {
        var b = el('button', { class: 'st-optcard', type: 'button', 'data-opt': o.key }, el('span', { class: 'st-qicon' }, o.icon), el('span', null, o.name));
        b.addEventListener('click', function () {
          var i = chosen.indexOf(o);
          if (i >= 0) {
            chosen.splice(i, 1);
            b.classList.remove('st-on');
          } else if (chosen.length >= 4) {
            api.feedback('Only four choices! Click one to un-pick it first.', 'try');
            return;
          } else {
            chosen.push(o);
            b.classList.add('st-on');
          }
          MQ.sound('click');
          count.textContent = chosen.length + ' of 4 picked';
          go.disabled = chosen.length !== 4;
          api.feedback(chosen.length === 4 ? 'Four choices. Ready to ask!' : '', chosen.length === 4 ? 'good' : 'info');
        });
        grid.appendChild(b);
      });
      go.addEventListener('click', function () {
        if (chosen.length !== 4) return;
        var keep = q.opts.filter(function (o) {
          return chosen.indexOf(o) >= 0;
        });
        party = makeParty(q, keep);
        ask();
      });
      holder.appendChild(grid);
      holder.appendChild(el('div', { class: 'st-row' }, count, go));
    }

    function ask() {
      MQ.clear(holder);
      api.feedback('', 'info');
      api.say('We will ask 10 people. Click the row that matches each answer.', 'happy');
      var p = party;
      var n = 0;
      var busy = false;
      var strip = el('div', { class: 'st-people' });
      var faces = PEOPLE.map(function (name, i) {
        var f = el('div', { class: 'st-person' }, faceSvg(i + 2, 40), el('span', null, name));
        strip.appendChild(f);
        return f;
      });
      var speaker = el('div', { class: 'st-speaker' });
      var counter = el('div', { class: 'st-pickcount' });
      var table = makeTable({
        cats: partyCats(p),
        head: p.question.head,
        freq: false,
        perLine: 3,
        caption: el('div', { class: 'st-caption' }, p.question.q),
        onHit: function (k) {
          if (busy || n >= 10) return;
          var ans = p.answers[n];
          if (k !== ans) {
            api.sound('wrong');
            table.flashRow(k, 'st-flash-bad');
            api.feedback('Listen again: ' + PEOPLE[n] + ' said ' + optByKey(p, ans).name + '. Find the ' + optByKey(p, ans).name + ' row.', 'try');
            return;
          }
          api.sound('pop');
          table.addTally(k);
          table.flashRow(k, 'st-flash-good');
          faces[n].classList.remove('st-now');
          faces[n].classList.add('st-counted');
          api.feedback('', 'info');
          n++;
          busy = true;
          api.later(function () {
            busy = false;
            show();
          }, 450);
        },
      });
      function show() {
        counter.textContent = 'Asked: ' + n + ' of 10';
        MQ.clear(speaker);
        if (n >= 10) {
          p.done = true;
          table.setHitEnabled(false);
          speaker.appendChild(el('div', { class: 'st-bubble st-bubble-done' }, 'All 10 people asked! ✓'));
          api.say('All 10 asked! That is our tally chart. Each gate is 5.', 'cheer');
          api.feedback('Tally chart done. Press Next.', 'good');
          api.unlockNext();
          return;
        }
        faces[n].classList.add('st-now');
        var o = optByKey(p, p.answers[n]);
        speaker.appendChild(el('div', { class: 'st-speaker-face' }, faceSvg(n + 2, 64), el('b', null, PEOPLE[n])));
        speaker.appendChild(el('div', { class: 'st-bubble', 'data-answer': o.key }, o.icon + ' ' + o.name.charAt(0).toUpperCase() + o.name.slice(1) + ', please!'));
      }
      holder.appendChild(strip);
      holder.appendChild(el('div', { class: 'st-askrow' }, el('div', { class: 'st-askleft' }, speaker, counter), table.el));
      show();
    }

    pickQuestion();
  }

  // Learn 2: the tally chart grows a Frequency column.
  function learnFrequency(stage, api) {
    api.lockNext();
    var p = ensureParty();
    api.say('Our chart grows a new column: Frequency. It means HOW MANY.', 'happy');
    stage.appendChild(MQ.ui.lesson('Tally chart → frequency table', 'Count each tally. Type the number.'));
    var cats = partyCats(p);
    var table = makeTable({ cats: cats, head: p.question.head, freq: true, freqHidden: true, perLine: 3, caption: el('div', { class: 'st-caption' }, p.question.q) });
    cats.forEach(function (c) {
      table.setTally(c.key, p.counts[c.key]);
    });
    table.setHitEnabled(false);
    stage.appendChild(table.el);
    var btn = el('button', { class: 'btn st-check', type: 'button' }, 'Check ✓');
    var after = el('div', { class: 'st-after' });
    stage.appendChild(btn);
    stage.appendChild(after);
    api.later(function () {
      table.showFreq();
      try {
        table.inputs[cats[0].key].focus({ preventScroll: true });
      } catch (e) {}
    }, 500);
    function check() {
      var allOk = true;
      var firstBad = null;
      cats.forEach(function (c) {
        var v = readNum(table.inputs[c.key]);
        var ok = v === p.counts[c.key];
        setInputState(table.inputs[c.key], ok ? 'good' : 'bad');
        if (!ok) {
          allOk = false;
          if (!firstBad) firstBad = { c: c, v: v };
        }
      });
      if (!allOk) {
        api.sound('wrong');
        var msg = firstBad.v == null ? 'Fill in every Frequency box.' : 'Count the ' + firstBad.c.plain + ' tally again. A gate is 5, then count on the sticks.';
        api.feedback(msg, 'try');
        api.say(msg, 'oops');
        return;
      }
      api.sound('correct');
      btn.disabled = true;
      table.allInputs().forEach(function (i) {
        i.disabled = true;
      });
      p.freqDone = true;
      MQ.clear(after);
      after.appendChild(MQ.ui.sum(cats.map(function (c) { return p.counts[c.key]; }), 10, 'people'));
      api.say('Now the numbers tell us how many. No need to count the tally again!', 'cheer');
      api.feedback('The frequencies add up to 10, the number of people we asked. Press Next.', 'good');
      api.unlockNext();
    }
    btn.addEventListener('click', check);
    chainInputs(table.allInputs(), check);
  }

  // Learn 3: build a true sentence from the data and decide what to buy.
  function learnSentence(stage, api) {
    api.lockNext();
    var p = ensureParty();
    var top = topOpt(p);
    var topN = p.counts[top.key];
    api.say('Let\'s say what the table shows. Make a sentence about the MOST popular one.', 'happy');
    var cats = partyCats(p);
    var table = makeTable({ cats: cats, head: p.question.head, freq: true, perLine: 3 });
    cats.forEach(function (c) {
      table.setTally(c.key, p.counts[c.key]);
      table.inputs[c.key].value = p.counts[c.key];
      table.inputs[c.key].disabled = true;
    });
    table.setHitEnabled(false);

    var nums = [topN];
    p.opts.forEach(function (o) {
      var c = p.counts[o.key];
      if (c >= 2 && nums.indexOf(c) === -1) nums.push(c);
    });
    [topN + 1, topN - 1, 3, 4].forEach(function (c) {
      if (nums.length < 3 && c >= 2 && nums.indexOf(c) === -1) nums.push(c);
    });
    var words = nums.slice(0, 3).map(function (c) {
      return { text: NUM_WORDS[c], kind: 'num', n: c };
    });
    words.push({ text: 'people', kind: 'people' }, { text: 'chose', kind: 'chose' });
    p.opts.forEach(function (o) {
      words.push({ text: o.name, kind: 'opt', key: o.key });
    });
    words = U.shuffle(words);

    var slot = el('div', { class: 'st-slot', 'aria-label': 'Your sentence' });
    var pool = el('div', { class: 'st-pool' });
    var placed = [];
    var finished = false;
    var decide = el('div', { class: 'st-decide' });

    function chipEl(w) {
      var c = el('button', { class: 'st-word st-word-' + w.kind, type: 'button', draggable: 'true', 'data-word': w.text }, w.text);
      w.node = c;
      c.addEventListener('click', function () {
        if (finished) return;
        MQ.sound('click');
        var i = placed.indexOf(w);
        if (i >= 0) placed.splice(i, 1);
        else placed.push(w);
        render();
      });
      c.addEventListener('dragstart', function (e) {
        try {
          e.dataTransfer.setData('text/plain', w.text);
        } catch (err) {}
      });
      return c;
    }
    words.forEach(chipEl);
    function onDragOver(e) {
      e.preventDefault();
      slot.classList.add('st-slot-over');
    }
    function onDragLeave() {
      slot.classList.remove('st-slot-over');
    }
    function onDrop(e) {
      e.preventDefault();
      slot.classList.remove('st-slot-over');
      if (finished) return;
      var txt = '';
      try {
        txt = e.dataTransfer.getData('text/plain');
      } catch (err) {}
      var w = words.filter(function (x) {
        return x.text === txt;
      })[0];
      if (w && placed.indexOf(w) === -1) {
        placed.push(w);
        MQ.sound('click');
        render();
      }
    }
    slot.addEventListener('dragover', onDragOver);
    slot.addEventListener('dragleave', onDragLeave);
    slot.addEventListener('drop', onDrop);
    api.cleanup(function () {
      slot.removeEventListener('dragover', onDragOver);
      slot.removeEventListener('dragleave', onDragLeave);
      slot.removeEventListener('drop', onDrop);
    });

    function render() {
      MQ.clear(slot);
      MQ.clear(pool);
      if (!placed.length) slot.appendChild(el('span', { class: 'st-slot-hint' }, 'Drag or click words here'));
      placed.forEach(function (w) {
        slot.appendChild(w.node);
      });
      slot.appendChild(el('span', { class: 'st-dot' }, '.'));
      words.forEach(function (w) {
        if (placed.indexOf(w) === -1) pool.appendChild(w.node);
      });
      if (placed.length === 4) judge();
    }

    function judge() {
      var k = placed.map(function (w) {
        return w.kind;
      });
      if (k.join(' ') !== 'num people chose opt') {
        api.sound('wrong');
        api.feedback('A survey sentence goes: number word, people, chose, then the ' + p.question.noun + '. Click a word to take it back.', 'try');
        return;
      }
      var n = placed[0].n;
      var o = optByKey(p, placed[3].key);
      if (p.counts[o.key] !== n) {
        api.sound('wrong');
        api.feedback('Check the table: how many people chose ' + o.name + '? Click a word to swap it.', 'try');
        return;
      }
      if (o.key !== top.key) {
        api.sound('wrong');
        api.feedback('That is true! But which one has the BIGGEST number? Write about that one.', 'try');
        return;
      }
      finished = true;
      slot.classList.add('st-slot-good');
      api.sound('correct');
      api.feedback('Yes! ' + NUM_WORDS[n] + ' people chose ' + o.name + '.', 'good');
      api.say('A true sentence from our data. So what should we buy the most of?', 'think');
      var ch = MQ.ui.choices(
        p.opts.map(function (x) {
          return { label: x.icon + ' ' + x.name, value: x.key };
        }),
        function (v) {
          if (v === top.key) {
            ch.mark(v, 'good');
            ch.disable();
            api.sound('correct');
            api.say('Yes! Most people chose ' + top.name + '. Our survey helped us decide.', 'cheer');
            api.feedback('Great planning! Press the button to start practising.', 'good');
            api.unlockNext();
          } else {
            ch.mark(v, 'bad');
            api.sound('wrong');
            api.feedback('Only ' + p.counts[v] + ' people chose that. Look for the biggest frequency.', 'try');
          }
        },
        { columns: 4 }
      );
      ch.classList.add('st-buy');
      MQ.clear(decide);
      decide.appendChild(el('div', { class: 'st-caption' }, 'What should we buy the most of?'));
      decide.appendChild(ch);
    }

    stage.appendChild(el('div', { class: 'st-sentence-wrap' }, table.el, el('div', { class: 'st-sentence-side' }, slot, pool)));
    stage.appendChild(decide);
    render();
  }

  /* ---------------------------------------------------------------- *
   * Practice data
   * ---------------------------------------------------------------- */
  function cat(key, icon, name) {
    return { key: key, icon: icon, plain: name, label: '<span class="st-ico">' + icon + '</span> ' + name };
  }

  var L1_THEMES = [
    { id: 'fruit', caption: '🥣 A fruit bowl', title: 'Fruit in the bowl', head: 'Fruit', noun: 'pieces of fruit', cats: [cat('apple', '🍎', 'apple'), cat('banana', '🍌', 'banana'), cat('orange', '🍊', 'orange')] },
    { id: 'toys', caption: '🧸 A toy shelf', title: 'Toys on the shelf', head: 'Toy', noun: 'toys', cats: [cat('teddy', '🧸', 'teddy'), cat('ball', '⚽', 'ball'), cat('car', '🚗', 'toy car')] },
    { id: 'pencil', caption: '✏️ A pencil case', title: 'Things in the pencil case', head: 'Thing', noun: 'things', cats: [cat('pencil', '✏️', 'pencil'), cat('crayon', '🖍️', 'crayon'), cat('scissors', '✂️', 'scissors')] },
    { id: 'basket', caption: '🧺 A shopping basket', title: 'Food in the basket', head: 'Food', noun: 'things', cats: [cat('bread', '🍞', 'bread'), cat('milk', '🥛', 'milk'), cat('egg', '🥚', 'egg')] },
    { id: 'garden', caption: '🌱 A flower bed', title: 'Flowers in the flower bed', head: 'Flower', noun: 'flowers', cats: [cat('tulip', '🌷', 'tulip'), cat('sunflower', '🌻', 'sunflower'), cat('rose', '🌹', 'rose')] },
    { id: 'washing', caption: '👕 A washing line', title: 'Clothes on the line', head: 'Clothes', noun: 'clothes', cats: [cat('sock', '🧦', 'sock'), cat('tshirt', '👕', 'T-shirt'), cat('jeans', '👖', 'jeans')] },
  ];

  var L2_THEMES = [
    { id: 'hobby', head: 'Hobby', title: 'Our favourite hobbies', cats: [cat('painting', '🎨', 'painting'), cat('dancing', '💃', 'dancing'), cat('football', '⚽', 'football'), cat('reading', '📚', 'reading')] },
    { id: 'snack', head: 'Snack', title: 'Our favourite snacks', cats: [cat('apple', '🍎', 'apple'), cat('carrot', '🥕', 'carrots'), cat('cheese', '🧀', 'cheese'), cat('biscuit', '🍪', 'biscuit')] },
    { id: 'school', head: 'Way', title: 'How we get to school', cats: [cat('walk', '🚶', 'walk'), cat('bike', '🚲', 'bike'), cat('bus', '🚌', 'bus'), cat('car', '🚗', 'car')] },
    { id: 'pet', head: 'Pet', title: 'The pets we would like', cats: [cat('cat', '🐱', 'cat'), cat('dog', '🐶', 'dog'), cat('fish', '🐟', 'fish'), cat('rabbit', '🐰', 'rabbit')] },
    { id: 'sport', head: 'Sport', title: 'Our favourite sports', cats: [cat('swim', '🏊', 'swimming'), cat('run', '🏃', 'running'), cat('basket', '🏀', 'basketball'), cat('cricket', '🏏', 'cricket')] },
  ];
  var OTHER_TITLES = ['How old we are', 'Our favourite fruit', 'Colours of cars in the car park', 'Our favourite colours', 'How tall we are'];

  /** Random counts (each lo..hi) for `n` rows whose sum lies in [minSum, maxSum]. */
  function randomCounts(n, lo, hi, minSum, maxSum) {
    for (var guard = 0; guard < 500; guard++) {
      var c = [];
      var s = 0;
      for (var i = 0; i < n; i++) {
        c.push(U.rand(lo, hi));
        s += c[i];
      }
      if (s >= minSum && s <= maxSum) return c;
    }
    // Fallback: fill evenly
    var out = [];
    var each = Math.round(minSum / n);
    for (var j = 0; j < n; j++) out.push(each);
    return out;
  }

  function itemsFrom(cats, counts, extra) {
    var items = [];
    cats.forEach(function (c, i) {
      for (var n = 0; n < counts[i]; n++) items.push(extra ? extra(c, n) : { cat: c.key });
    });
    return U.shuffle(items);
  }

  function makeL1(theme) {
    var counts = randomCounts(3, 1, 6, 8, 12);
    return { level: 1, kind: 'emoji', theme: theme.id, caption: theme.caption, tableTitle: theme.title, head: theme.head, noun: theme.noun, cats: theme.cats, items: itemsFrom(theme.cats, counts), perLine: 3 };
  }

  function makeL2(theme) {
    var counts = randomCounts(4, 1, 6, 12, 16);
    var seed = U.rand(0, 20);
    var items = itemsFrom(theme.cats, counts).map(function (it, i) {
      it.face = seed + i;
      return it;
    });
    var others = U.shuffle(
      L2_THEMES.filter(function (t) {
        // Hobbies and sports overlap (football), so never offer one as a wrong title for the other.
        return t.id !== theme.id && !((theme.id === 'hobby' && t.id === 'sport') || (theme.id === 'sport' && t.id === 'hobby'));
      })
        .map(function (t) {
          return t.title;
        })
        .concat(
          OTHER_TITLES.filter(function (t) {
            return !(theme.id === 'snack' && t === 'Our favourite fruit');
          })
        )
    ).slice(0, 2);
    return {
      level: 2,
      kind: 'face',
      theme: theme.id,
      caption: '🏫 We asked ' + items.length + ' children',
      head: theme.head,
      noun: 'children',
      cats: theme.cats,
      items: items,
      perLine: 3,
      title: { correct: theme.title, options: U.shuffle([theme.title].concat(others)) },
    };
  }

  /** n rows, each 1..cap, summing to total (total must be ≤ n*cap). */
  function spread(n, total, cap, minEach) {
    var c = [];
    for (var i = 0; i < n; i++) c.push(minEach);
    var left = total - n * minEach;
    var guard = 0;
    while (left > 0 && guard < 1000) {
      var j = U.rand(0, n - 1);
      if (c[j] < cap) {
        c[j]++;
        left--;
      }
      guard++;
    }
    return c;
  }

  function makeScores() {
    var rows = U.rand(5, 7);
    var start = 100 - 10 * rows;
    var cats = U.range(0, rows - 1).map(function (i) {
      var v = start + 10 * i;
      return { key: String(v), plain: String(v), label: '<b>' + v + '</b>' };
    });
    var total = U.rand(20, 24);
    var counts = spread(rows, total, 8, 1);
    return { level: 3, kind: 'score', theme: 'scores', caption: '📝 Test scores out of 100', tableTitle: 'Test scores', head: 'Score', noun: 'cards', cats: cats, items: itemsFrom(cats, counts), perLine: 2, total: true, sideways: false };
  }

  function makeCars() {
    var rows = U.rand(5, 7);
    var names = U.shuffle(Object.keys(CAR_COLOURS)).slice(0, rows);
    var cats = names.map(function (n) {
      return { key: n, plain: n, label: '<span class="st-swatch" style="background:' + CAR_COLOURS[n] + '"></span>' + n };
    });
    var total = U.rand(20, 24);
    var counts = spread(rows, total, 6, 1);
    return { level: 3, kind: 'car', theme: 'cars', caption: '🅿️ Cars in the school car park', tableTitle: 'Colours of the cars', head: 'Colour', noun: 'cars', cats: cats, items: itemsFrom(cats, counts), perLine: 1, total: true, sideways: true };
  }

  function makeShapes(sideways) {
    var counts;
    for (var g = 0; g < 200; g++) {
      counts = [U.rand(2, 4), U.rand(3, 5), U.rand(3, 6), U.rand(2, 5)];
      var s = counts[0] + counts[1] + counts[2] + counts[3];
      if (s >= 14 && s <= 18) break;
    }
    var by = { 0: counts[0], 3: counts[1], 4: counts[2], 5: counts[3] };
    var cats = U.range(0, 5).map(function (n) {
      return { key: String(n), plain: n + (n === 1 ? ' corner' : ' corners'), label: '<b>' + n + '</b>' };
    });
    var items = [];
    [0, 3, 4, 5].forEach(function (k) {
      var templates = U.shuffle(SHAPES[k]);
      for (var i = 0; i < by[k]; i++) items.push({ cat: String(k), shape: templates[i % templates.length], fill: U.pick(PASTELS) });
    });
    return {
      level: 3,
      kind: 'shape',
      theme: 'shapes',
      caption: '🔷 Flat shapes: how many corners?',
      tableTitle: 'Corners on the shapes',
      head: 'Corners',
      noun: 'shapes',
      cats: cats,
      items: U.shuffle(items),
      perLine: sideways ? 1 : 2,
      total: true,
      sideways: sideways,
      zeroRows: true,
    };
  }

  var deck = null;
  function buildDeck() {
    var q = [];
    U.shuffle(L1_THEMES)
      .slice(0, 3)
      .forEach(function (t) {
        q.push(makeL1(t));
      });
    U.shuffle(L2_THEMES)
      .slice(0, 3)
      .forEach(function (t) {
        q.push(makeL2(t));
      });
    var first = U.pick(['scores', 'cars']);
    q.push(first === 'scores' ? makeScores() : makeCars());
    q.push(makeShapes(first === 'scores'));
    return q;
  }

  /* ---------------------------------------------------------------- *
   * Practice screen
   * ---------------------------------------------------------------- */
  function itemContent(q, it) {
    var c = q.cats.filter(function (x) {
      return x.key === it.cat;
    })[0];
    if (q.kind === 'emoji') return [el('span', { class: 'st-emo' }, c.icon)];
    if (q.kind === 'face') return [faceSvg(it.face, 52), el('span', { class: 'st-says' }, c.icon + ' ' + c.plain)];
    if (q.kind === 'score') return [el('span', { class: 'st-score' }, c.plain)];
    if (q.kind === 'car') return [carSvg(it.cat), el('span', { class: 'st-says' }, it.cat)];
    var s = shapeSvg(it.shape, it.fill);
    it.svgEl = s;
    return [s];
  }

  function wrongRowHint(q, it) {
    var c = q.cats.filter(function (x) {
      return x.key === it.cat;
    })[0];
    if (q.kind === 'emoji') return 'That is a ' + c.plain + '. Find the ' + c.plain + ' row.';
    if (q.kind === 'face') return 'This child chose ' + c.plain + '. Find the ' + c.plain + ' row.';
    if (q.kind === 'score') return 'That card says ' + c.plain + '. Find the ' + c.plain + ' row.';
    if (q.kind === 'car') return 'That car is ' + c.plain + '. Find the ' + c.plain + ' row.';
    return 'Count its corners again. Touch each pointy corner. A circle has none.';
  }

  function renderPractice(stage, api, q) {
    var t0 = api.tries;
    var cats = q.cats;
    var N = q.items.length;
    var counts = {};
    cats.forEach(function (c) {
      counts[c.key] = 0;
    });
    q.items.forEach(function (it) {
      counts[it.cat]++;
    });
    var ticked = q.items.map(function () {
      return false;
    });
    var picked = -1;
    var chosenTitle = null;
    var tallyDone = false;

    var intro = {
      1: 'Tally everything in the picture. Click a thing, then click its row.',
      2: 'Tally what each child chose. Click a child, then click the row. Then pick a title.',
      3: q.kind === 'shape' ? 'Sort the shapes by how many corners they have. Then fill in the table.' : 'Sort every card into the table. Then fill in the Frequency and the Total.',
    }[q.level];
    api.say(intro, 'think');

    var steps = el(
      'div',
      { class: 'st-steps' },
      el('span', { class: 'st-step st-step-on' }, '1 Tally'),
      el('span', { class: 'st-step' }, '2 Frequency'),
      q.total ? el('span', { class: 'st-step' }, '3 Total') : null,
      q.title ? el('span', { class: 'st-step' }, '3 Title') : null
    );
    stage.appendChild(steps);

    var pic = el('div', { class: 'st-pic st-pic-' + q.kind }, el('div', { class: 'st-pic-cap' }, q.caption));
    var picGrid = el('div', { class: 'st-pic-grid' });
    pic.appendChild(picGrid);
    var itemEls = q.items.map(function (it, i) {
      var b = el('button', { class: 'st-item st-item-' + q.kind, type: 'button', 'data-cat': it.cat, 'data-idx': i, 'aria-label': 'Item ' + (i + 1) }, itemContent(q, it), el('span', { class: 'st-tick' }, '✓'));
      if (q.kind === 'emoji') b.style.transform = 'rotate(' + U.rand(-10, 10) + 'deg)';
      b.addEventListener('click', function () {
        if (api.isAnswered()) return;
        MQ.sound('click');
        if (picked >= 0) itemEls[picked].classList.remove('st-picked');
        picked = i;
        b.classList.add('st-picked');
        if (ticked[i]) api.feedback('This one has a tick already. It is counted!', 'info');
        else api.feedback('', 'info');
      });
      picGrid.appendChild(b);
      return b;
    });

    var titleBox = null;
    var titleCh = null;
    var caption = el('div', { class: 'st-caption' }, q.title ? 'Title: ?' : q.tableTitle);
    if (q.title) {
      titleCh = MQ.ui.choices(q.title.options, function (v) {
        if (api.isAnswered()) return;
        chosenTitle = v;
        titleCh.buttons.forEach(function (b) {
          b.classList.remove('bad', 'good');
          b.classList.toggle('st-sel', b.value_ === v);
        });
        caption.textContent = v;
      }, { columns: 3 });
      titleCh.classList.add('st-titles');
      titleCh.buttons.forEach(function (b) {
        b.setAttribute('data-title', b.value_ === q.title.correct ? 'fits' : 'no');
      });
      titleBox = el('div', { class: 'st-titlebox' }, el('div', { class: 'st-titlelab' }, 'Pick a title for the chart:'), titleCh);
    }

    var table = makeTable({
      cats: cats,
      head: q.head,
      freq: true,
      total: !!q.total,
      sideways: !!q.sideways,
      perLine: q.perLine,
      caption: caption,
      onHit: onRow,
    });

    function onRow(k) {
      if (api.isAnswered()) return;
      if (picked < 0) {
        api.feedback(q.level === 2 ? 'First click a child, then click the row.' : 'First click a thing in the picture, then click its row.', 'info');
        return;
      }
      var i = picked;
      var it = q.items[i];
      if (ticked[i]) {
        itemEls[i].classList.remove('st-picked');
        picked = -1;
        api.sound('wrong');
        api.feedback('Oops! That one already has a tick. Count each thing only once.', 'try');
        return;
      }
      if (k !== it.cat) {
        api.sound('wrong');
        table.flashRow(k, 'st-flash-bad');
        api.feedback(wrongRowHint(q, it), 'try');
        return;
      }
      api.sound('pop');
      ticked[i] = true;
      itemEls[i].classList.remove('st-picked');
      itemEls[i].classList.add('st-done');
      picked = -1;
      table.addTally(k);
      table.flashRow(k, 'st-flash-good');
      api.feedback('', 'info');
      if (!tallyDone && ticked.every(Boolean)) {
        tallyDone = true;
        steps.children[0].classList.add('st-step-done');
        steps.children[1].classList.add('st-step-on');
        api.say(q.total ? 'All sorted! Now write each frequency, then the total.' : 'All tallied! Now write each tally as a number.', 'happy');
        try {
          table.inputs[cats[0].key].focus({ preventScroll: true });
        } catch (e) {}
      }
    }

    var checkBtn = el('button', { class: 'btn st-check', type: 'button' }, 'Check ✓');
    var working = el('div', { class: 'st-after' });
    var right = el('div', { class: 'st-right' }, titleBox, table.el);
    stage.appendChild(el('div', { class: 'st-work' + (q.sideways ? ' st-work-side' : '') }, pic, right));
    stage.appendChild(checkBtn);
    stage.appendChild(working);
    chainInputs(table.allInputs(), doCheck);
    checkBtn.addEventListener('click', doCheck);

    var earlyChecks = 0;
    function doCheck() {
      if (api.isAnswered()) return;
      var tries = t0();
      var left = [];
      ticked.forEach(function (d, i) {
        if (!d) left.push(i);
      });
      if (left.length) {
        left.forEach(function (i) {
          itemEls[i].classList.remove('st-flash-item');
          void itemEls[i].offsetWidth;
          itemEls[i].classList.add('st-flash-item');
        });
        earlyChecks++;
        api.sound('wrong');
        api.feedback(
          earlyChecks >= 2 ? 'Look for things with no tick ✓. There ' + (left.length === 1 ? 'is 1' : 'are ' + left.length) + ' still to tally. They are flashing.' : 'Some things have no tick yet. Tally every one before you check.',
          'try'
        );
        return;
      }
      var vals = {};
      var blanks = [];
      cats.forEach(function (c) {
        vals[c.key] = readNum(table.inputs[c.key]);
        if (vals[c.key] === null) blanks.push(c);
      });
      if (blanks.length === cats.length) {
        cats.forEach(function (c) {
          setInputState(table.inputs[c.key], 'bad');
        });
        api.check(false, tries >= 1 ? 'Count each tally and type the number in the Frequency box next to it.' : 'Great tally! Now write each tally as a number in the Frequency column.', 'Left out the frequency column');
        return;
      }
      if (blanks.length) {
        blanks.forEach(function (c) {
          setInputState(table.inputs[c.key], 'bad');
        });
        var zeroOnly = blanks.every(function (c) {
          return counts[c.key] === 0;
        });
        if (zeroOnly) {
          api.check(false, tries >= 1 ? 'The ' + blanks[0].plain + ' row has no tally marks. Type 0 there.' : 'Every row needs a number. A row with no tally marks gets 0.', 'Forgot a row with 0');
        } else {
          api.check(false, 'Fill in every Frequency box. Look at the ' + blanks[0].plain + ' row.', 'Left out the frequency column');
        }
        return;
      }
      var wrong = [];
      cats.forEach(function (c) {
        var ok = vals[c.key] === table.tallies[c.key];
        setInputState(table.inputs[c.key], ok ? 'good' : 'bad');
        if (!ok) wrong.push(c);
      });
      if (wrong.length) {
        var w = wrong[0];
        var tn = table.tallies[w.key];
        var hint;
        if (tries >= 1) {
          hint = tn >= 5 ? 'Point at the ' + w.plain + ' tally. Say 5 for each gate, then count on 1 for each stick.' : 'Point at each stick in the ' + w.plain + ' tally and count them in ones.';
        } else hint = 'Look at the ' + w.plain + ' row. Does the number match the tally?';
        api.check(false, hint, 'Frequency doesn\'t match the tally');
        return;
      }
      if (q.total) {
        var tv = readNum(table.totalInput);
        if (tv !== N) {
          setInputState(table.totalInput, 'bad');
          var parts = cats.map(function (c) {
            return counts[c.key];
          });
          api.check(
            false,
            tv === null ? 'Now add up the frequencies and write the Total.' : tries >= 1 ? 'Add them up: ' + parts.join(' + ') + '. The total should match the number of ' + q.noun + '.' : 'Add up the Frequency column again. The total should match the number of ' + q.noun + '.',
            'Total doesn\'t match the data'
          );
          return;
        }
        setInputState(table.totalInput, 'good');
      }
      if (q.title) {
        if (chosenTitle === null) {
          api.feedback('Nearly done! Now pick a title for the chart.', 'info');
          api.say('Now pick a title for the chart.', 'think');
          return;
        }
        if (chosenTitle !== q.title.correct) {
          titleCh.mark(chosenTitle, 'bad');
          api.check(false, tries >= 1 ? 'Look at the rows: ' + cats.map(function (c) { return c.plain; }).join(', ') + '. Which title fits?' : 'Does that title tell us what the children chose? Try another.', 'Chose a title that does not fit');
          return;
        }
        titleCh.mark(chosenTitle, 'good');
      }
      finish(false);
      api.check(true, q.total ? 'Total ' + N + ', and there are ' + N + ' ' + q.noun + '. It matches!' : null);
    }

    function finish(reveal) {
      table.setHitEnabled(false);
      checkBtn.disabled = true;
      table.allInputs().forEach(function (i) {
        i.disabled = true;
      });
      if (titleCh) titleCh.disable();
      itemEls.forEach(function (b) {
        b.disabled = true;
        b.classList.remove('st-picked');
      });
      if (reveal) {
        MQ.clear(working);
        working.appendChild(MQ.ui.sum(cats.map(function (c) { return counts[c.key]; }), N));
        working.appendChild(el('div', { class: 'st-note' }, N + ' ' + q.noun + ' in the picture. Each colour is one row.'));
      }
    }

    api.onReveal(function () {
      q.items.forEach(function (it, i) {
        ticked[i] = true;
        var ci = cats.map(function (c) { return c.key; }).indexOf(it.cat);
        itemEls[i].classList.add('st-done', 'st-col');
        itemEls[i].style.setProperty('--st-cc', CAT_COLORS[ci % CAT_COLORS.length]);
        if (q.kind === 'shape') cornerDots(it.svgEl, it.shape);
      });
      cats.forEach(function (c, ci) {
        table.setTally(c.key, counts[c.key]);
        table.inputs[c.key].value = counts[c.key];
        setInputState(table.inputs[c.key], 'good');
        table.colorRow(c.key, CAT_COLORS[ci % CAT_COLORS.length]);
      });
      if (table.totalInput) {
        table.totalInput.value = N;
        setInputState(table.totalInput, 'good');
      }
      if (q.title) {
        chosenTitle = q.title.correct;
        caption.textContent = q.title.correct;
        titleCh.buttons.forEach(function (b) {
          b.classList.remove('bad', 'good', 'st-sel');
        });
        titleCh.mark(q.title.correct, 'good');
      }
      finish(true);
      api.feedback(
        (q.kind === 'shape' ? 'The dots show the corners. ' : '') + 'Each gate is 5. Rows with no tally get 0. The frequencies add up to ' + N + '.',
        'info'
      );
    });
  }

  MQ.register('survey-tally-table', {
    learn: [learnSurvey, learnFrequency, learnSentence],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        renderPractice(stage, api, deck[api.index]);
      },
    },
  });

  var css = [
    '.st-learn{display:flex;flex-direction:column;align-items:center;gap:14px;width:100%}',
    '.st-qcards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;width:100%;max-width:760px}',
    '.st-qcard,.st-optcard{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 10px;border-radius:16px;border:3px solid var(--line);background:#fff;color:var(--ink);font:inherit;font-size:1.15rem;font-weight:800;cursor:pointer;transition:transform .08s}',
    '.st-qcard:hover,.st-optcard:hover{border-color:var(--accent);transform:translateY(-2px)}',
    '.st-qicon{font-size:2.2rem;line-height:1}',
    '.st-optcards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;width:100%;max-width:620px}',
    '.st-optcard.st-on{border-color:var(--good);background:var(--good-bg)}',
    '.st-optcard.st-on::after{content:"✓";color:var(--good);font-size:1.2rem}',
    '.st-row{display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center}',
    '.st-pickcount{font-weight:800;font-size:1.1rem;color:var(--ink-soft)}',
    '.st-people{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;max-width:100%}',
    '.st-person{display:flex;flex-direction:column;align-items:center;font-size:.72rem;font-weight:700;color:var(--ink-soft);width:62px;padding:3px;border-radius:10px;border:2px solid transparent;transition:opacity .4s}',
    '.st-person.st-now{border-color:var(--gold);background:#fff7e0;color:var(--ink)}',
    '.st-person.st-counted{opacity:.3}',
    '.st-askrow{display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:center;width:100%}',
    '.st-askleft{display:flex;flex-direction:column;align-items:center;gap:8px;min-width:220px}',
    '.st-speaker{display:flex;align-items:center;gap:10px;min-height:90px}',
    '.st-speaker-face{display:flex;flex-direction:column;align-items:center;font-size:.95rem}',
    '.st-bubble{position:relative;background:#fff;border:3px solid var(--gold);border-radius:16px;padding:10px 14px;font-size:1.3rem;font-weight:800;animation:st-in .3s ease}',
    '.st-bubble-done{border-color:var(--good);color:var(--good)}',
    '@keyframes st-in{from{transform:scale(.85);opacity:0}}',
    '.st-tablewrap{display:flex;flex-direction:column;align-items:center;gap:6px;max-width:100%}',
    '.st-tablescroll{max-width:100%;overflow-x:auto}',
    '.st-caption{font-weight:800;font-size:1.15rem;text-align:center}',
    '.st-table{border-collapse:collapse;background:#fff;font-size:1.1rem}',
    '.st-table th,.st-table td{border:2px solid #9fb0d6;padding:5px 8px;text-align:left;vertical-align:middle}',
    '.st-table thead th,.st-side .st-rowhead{background:var(--paper-2);font-weight:800}',
    '.st-table td.st-tcell{min-width:124px;height:48px}',
    '.st-side td.st-tcell{min-width:56px;text-align:center}',
    '.st-side th,.st-side td{text-align:center;padding:6px 6px}',
    '.st-side .st-rowhead{text-align:left}',
    '.st-side .st-lab{flex-direction:column;gap:2px;font-size:.95rem}',
    '.st-side th,.st-side td{padding:5px 4px;min-width:62px}',
    '.st-hit{cursor:pointer;transition:background .15s}',
    '.st-hit:hover{background:#fff7e0}',
    '.st-nohit .st-hit{cursor:default}',
    '.st-nohit .st-hit:hover{background:transparent}',
    '.st-flash-good{animation:st-fg .6s ease}',
    '.st-flash-bad{animation:st-fb .6s ease}',
    '@keyframes st-fg{0%,60%{background:var(--good-bg)}}',
    '@keyframes st-fb{0%,60%{background:var(--try-bg)}}',
    '.st-lab{display:inline-flex;align-items:center;gap:6px;font-weight:800;white-space:nowrap}',
    '.st-lab-col{padding:2px 8px;border-radius:10px;box-shadow:inset 0 0 0 3px var(--st-cc)}',
    '.st-ico{font-size:1.4rem}',
    '.st-swatch{display:inline-block;width:18px;height:18px;border-radius:5px;border:2px solid #333}',
    '.st-stroke{stroke:#1b2a4a;stroke-width:3;stroke-linecap:round}',
    '.st-cross{stroke:#c2410c}',
    '.st-tally{display:block;max-width:none}',
    '.st-pop line:last-child{animation:st-in .3s ease}',
    '.st-freq{width:70px;height:46px;font:inherit;font-size:1.4rem;font-weight:800;text-align:center;border:3px solid var(--line);border-radius:10px;color:var(--ink)}',
    '.st-side .st-freq{width:48px}',
    '.st-freq:focus{outline:3px solid var(--gold);outline-offset:1px}',
    '.st-freq.st-good{border-color:var(--good);background:var(--good-bg)}',
    '.st-freq.st-bad{border-color:var(--try);background:var(--try-bg)}',
    '.st-freq:disabled{color:var(--ink)}',
    '.st-totrow th{background:#fff3cd}',
    '.st-sidetotal{display:flex;align-items:center;gap:10px;font-size:1.2rem}',
    '.st-nofreq .st-fcol{display:none}',
    '.st-grow .st-fcol{animation:st-in .5s ease}',
    '.st-check{min-width:150px}',
    '.st-after{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.st-after:empty{display:none}',
    '.st-note{color:var(--ink-soft);font-weight:700}',
    // sentence screen
    '.st-sentence-wrap{display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:center;width:100%}',
    '.st-sentence-side{display:flex;flex-direction:column;gap:12px;align-items:center;flex:1;min-width:280px;max-width:460px}',
    '.st-slot{display:flex;flex-wrap:wrap;align-items:center;gap:6px;min-height:64px;width:100%;padding:8px 10px;border:3px dashed var(--line);border-radius:14px;background:#fff}',
    '.st-slot-over{border-color:var(--accent);background:#effcfa}',
    '.st-slot-good{border-style:solid;border-color:var(--good);background:var(--good-bg)}',
    '.st-slot-hint{color:var(--ink-soft);font-weight:700}',
    '.st-dot{font-size:1.6rem;font-weight:800}',
    '.st-pool{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}',
    '.st-word{font:inherit;font-size:1.2rem;font-weight:800;padding:8px 14px;border-radius:12px;border:2px solid var(--line);background:var(--info-bg);color:var(--ink);cursor:pointer}',
    '.st-word-num{background:#fff3cd;border-color:var(--gold)}',
    '.st-word-opt{background:#e2f7ee;border-color:#9ed9bf}',
    '.st-word:hover{transform:translateY(-2px)}',
    '.st-decide{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.st-decide:empty{display:none}',
    '.st-buy{max-width:720px}',
    // practice
    '.st-steps{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.st-step{padding:3px 12px;border-radius:99px;background:var(--paper-2);color:var(--ink-soft);font-weight:800;font-size:.9rem}',
    '.st-step-on{background:#fff3cd;color:var(--ink)}',
    '.st-step-done{background:var(--good-bg);color:var(--good)}',
    '.st-work{display:flex;flex-wrap:wrap;gap:16px;align-items:flex-start;justify-content:center;width:100%}',
    '.st-work-side{flex-direction:column;align-items:center}',
    '.st-right{display:flex;flex-direction:column;align-items:center;gap:10px;max-width:100%;min-width:0}',
    '.st-pic{background:#fffaf0;border:3px solid #ead9b8;border-radius:18px;padding:8px 10px 12px;max-width:100%}',
    '.st-pic-cap{font-weight:800;color:var(--ink-soft);text-align:center;margin-bottom:6px}',
    '.st-pic-grid{display:grid;gap:8px;justify-content:center}',
    '.st-pic-emoji .st-pic-grid{grid-template-columns:repeat(4,64px)}',
    '.st-pic-face .st-pic-grid{grid-template-columns:repeat(4,82px)}',
    '.st-pic-score .st-pic-grid{grid-template-columns:repeat(5,60px)}',
    '.st-pic-car .st-pic-grid{grid-template-columns:repeat(8,78px)}',
    '.st-pic-shape .st-pic-grid{grid-template-columns:repeat(5,68px)}',
    '.st-work-side .st-pic-shape .st-pic-grid{grid-template-columns:repeat(9,68px)}',
    '.st-item{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:4px;border-radius:14px;border:3px solid transparent;background:transparent;font:inherit;color:var(--ink);cursor:pointer;transition:opacity .3s}',
    '.st-item:hover:not(:disabled){border-color:var(--line);background:#fff}',
    '.st-item-emoji{width:64px;height:64px}',
    '.st-emo{font-size:2.5rem;line-height:1}',
    '.st-item-face{width:82px;background:#fff;border-color:#eee}',
    '.st-says{font-size:.78rem;font-weight:800;white-space:nowrap}',
    '.st-item-score{width:60px;height:54px;background:#fff;border:2px solid var(--line);border-radius:10px}',
    '.st-score{font-size:1.4rem;font-weight:800}',
    '.st-item-car{width:78px;background:#fff;border-color:#eee}',
    '.st-item-shape{width:68px;height:68px;background:#fff;border-color:#eee}',
    '.st-shape-fig{stroke:#1b2a4a;stroke-width:2.5;stroke-linejoin:miter}',
    '.st-corner-dot{fill:#c2410c}',
    '.st-item.st-picked{border-color:var(--gold)!important;background:#fff7e0;box-shadow:0 0 0 4px rgba(255,183,3,.35)}',
    '.st-item.st-done{opacity:.35}',
    '.st-item.st-done.st-picked{opacity:.7}',
    '.st-item.st-col{opacity:1;border-color:var(--st-cc)!important;box-shadow:inset 0 0 0 2px var(--st-cc)}',
    '.st-tick{position:absolute;top:-4px;right:-4px;display:none;width:22px;height:22px;border-radius:50%;background:var(--good);color:#fff;font-size:.8rem;font-weight:800;line-height:22px;text-align:center}',
    '.st-done .st-tick{display:block}',
    '.st-item:disabled{cursor:default}',
    '.st-flash-item{animation:st-fi 1.2s ease}',
    '@keyframes st-fi{0%,30%,60%{box-shadow:0 0 0 5px var(--try)}15%,45%,80%{box-shadow:none}}',
    '.st-titlebox{display:flex;flex-direction:column;align-items:center;gap:6px;width:100%;max-width:420px}',
    '.st-titlelab{font-weight:800}',
    '.st-titles .choice{font-size:.9rem;min-height:48px;padding:4px 6px}',
    '.st-titles .choice.st-sel{border-color:var(--gold);background:#fff7e0}',
    '@media (max-width:900px){.st-pic-car .st-pic-grid{grid-template-columns:repeat(6,78px)}.st-work-side .st-pic-shape .st-pic-grid{grid-template-columns:repeat(6,68px)}}',
    '@media (max-width:640px){.st-qcards,.st-optcards{grid-template-columns:repeat(2,minmax(0,1fr))}.st-pic-face .st-pic-grid{grid-template-columns:repeat(3,82px)}.st-pic-car .st-pic-grid,.st-pic-score .st-pic-grid,.st-pic-shape .st-pic-grid{grid-template-columns:repeat(4,68px)}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'survey-tally-table' }, css));
})();

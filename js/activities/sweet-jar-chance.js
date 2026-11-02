/* Sweet Jar Questions — will / might / will not happen when picking one sweet from a jar (Unit 16.1 Chance).
 * Every answer is computed from the sweets drawn in the jar:
 *   will happen = every sweet matches, will not happen = no sweet matches, might happen = some but not all.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  // Sweet colours. Each one also has a letter and its own rim pattern, so it never relies on colour alone.
  var COL = {
    red: { name: 'red', hex: '#e63946', dark: '#9b1c27', letter: 'R', ink: '#fff', dash: '' },
    blue: { name: 'blue', hex: '#2f6fd6', dark: '#1a4590', letter: 'B', ink: '#fff', dash: '5 3' },
    yellow: { name: 'yellow', hex: '#f7c948', dark: '#9a7608', letter: 'Y', ink: '#2b2b2b', dash: '1.5 3' },
    green: { name: 'green', hex: '#2e9e4f', dark: '#1a6331', letter: 'G', ink: '#fff', dash: '9 3' },
    purple: { name: 'purple', hex: '#8e44ad', dark: '#5b2771', letter: 'P', ink: '#fff', dash: '2 2 7 2' },
    orange: { name: 'orange', hex: '#f28c28', dark: '#9c5009', letter: 'O', ink: '#2b2b2b', dash: '6 2 1.5 2' },
  };
  var ALL = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];
  var TRAY4 = ['red', 'blue', 'yellow', 'green'];

  var ANS = {
    will: { label: 'will happen', icon: '✔' },
    might: { label: 'might happen', icon: '?' },
    wont: { label: 'will not happen', icon: '✖' },
  };
  var ORDER = ['will', 'might', 'wont'];

  var TAG = {
    missingAsMight: 'Said "might" for a colour that is not in the jar',
    allAsMight: 'Said "might" when every sweet matched',
    someAsWill: 'Said "will" when only some sweets matched',
    someAsWont: 'Said "will not" when some sweets matched',
    willWontMix: 'Mixed up "will" and "will not"',
    notQuestion: 'Got muddled by a "not" or "or" question',
    jarShare: 'Compared how many sweets, not the share in each jar',
    buildWrong: 'Built a jar that did not fit the sentence',
    questionWrongType: 'Made a question with the wrong answer',
  };

  // ---------- the maths (all answers come from here) ----------
  function matches(stmt, c) {
    if (stmt.kind === 'any') return true;
    if (stmt.kind === 'is') return c === stmt.c;
    if (stmt.kind === 'not') return c !== stmt.c;
    if (stmt.kind === 'either') return stmt.cs.indexOf(c) !== -1;
    return false;
  }
  function countMatch(stmt, jar) {
    var m = 0;
    jar.forEach(function (c) {
      if (matches(stmt, c)) m++;
    });
    return m;
  }
  function answerOf(stmt, jar) {
    var m = countMatch(stmt, jar);
    if (jar.length > 0 && m === jar.length) return 'will';
    if (m === 0) return 'wont';
    return 'might';
  }
  function colourCount(jar, c) {
    return jar.filter(function (x) {
      return x === c;
    }).length;
  }
  function coloursIn(jar) {
    var out = [];
    jar.forEach(function (c) {
      if (out.indexOf(c) === -1) out.push(c);
    });
    return out;
  }

  // ---------- words ----------
  function dotHtml(c) {
    var k = COL[c];
    return '<span class="sjc-dot" style="background:' + k.hex + ';color:' + k.ink + ';border-color:' + k.dark + '">' + k.letter + '</span>';
  }
  function cw(c) {
    return dotHtml(c) + '<b>' + COL[c].name + '</b>';
  }
  // "a red sweet", "a sweet that is not red", "a red or blue sweet"
  function phrase(stmt) {
    if (stmt.kind === 'any') return 'a sweet';
    if (stmt.kind === 'is') return 'a ' + cw(stmt.c) + ' sweet';
    if (stmt.kind === 'not') return 'a sweet that is <b>not</b> ' + cw(stmt.c);
    return 'a ' + cw(stmt.cs[0]) + ' <b>or</b> ' + cw(stmt.cs[1]) + ' sweet';
  }
  function phrasePlain(stmt) {
    if (stmt.kind === 'any') return 'a sweet';
    if (stmt.kind === 'is') return 'a ' + stmt.c + ' sweet';
    if (stmt.kind === 'not') return 'a sweet that is not ' + stmt.c;
    return 'a ' + stmt.cs[0] + ' or ' + stmt.cs[1] + ' sweet';
  }
  // plural description of matching sweets
  function desc(stmt) {
    if (stmt.kind === 'any') return 'sweets';
    if (stmt.kind === 'is') return stmt.c + ' sweets';
    if (stmt.kind === 'not') return 'sweets that are not ' + stmt.c;
    return stmt.cs[0] + ' or ' + stmt.cs[1] + ' sweets';
  }
  function short(stmt) {
    if (stmt.kind === 'any') return 'sweets';
    if (stmt.kind === 'is') return stmt.c;
    if (stmt.kind === 'not') return 'not ' + stmt.c;
    return stmt.cs[0] + ' or ' + stmt.cs[1];
  }
  function stmtKey(s) {
    return s.kind + ':' + (s.c || (s.cs ? s.cs.slice().sort().join('+') : ''));
  }
  function jarKey(jar) {
    return jar.slice().sort().join(',');
  }
  // "3 of the 5 sweets are red. Some, but not all → might happen."
  function working(stmt, jar) {
    var m = countMatch(stmt, jar);
    var n = jar.length;
    var a = answerOf(stmt, jar);
    var s = m + ' of the ' + n + ' sweets ' + (m === 1 ? 'is ' : 'are ') + short(stmt) + '. ';
    if (a === 'will') s += 'Every sweet matches → it will happen.';
    else if (a === 'wont') s += 'No sweet matches → it will not happen.';
    else s += 'Some match, some do not → it might happen.';
    return s;
  }

  // ---------- drawing ----------
  var COLS = 4;
  var GAPX = 60;
  var ROWH = 52;

  function sweetNode(c, x, y, scale) {
    var k = COL[c];
    var g = svg('g', { class: 'sjc-sweet', transform: 'translate(' + x + ',' + y + ')' + (scale ? ' scale(' + scale + ')' : '') });
    g.appendChild(svg('circle', { class: 'sjc-ring', cx: 0, cy: 0, r: 24 }));
    g.appendChild(svg('polygon', { points: '-15,0 -26,-10 -26,10', fill: k.hex, stroke: k.dark, 'stroke-width': 2, 'stroke-linejoin': 'round' }));
    g.appendChild(svg('polygon', { points: '15,0 26,-10 26,10', fill: k.hex, stroke: k.dark, 'stroke-width': 2, 'stroke-linejoin': 'round' }));
    var attrs = { cx: 0, cy: 0, r: 18, fill: k.hex, stroke: k.dark, 'stroke-width': 3 };
    if (k.dash) attrs['stroke-dasharray'] = k.dash;
    g.appendChild(svg('circle', attrs));
    g.appendChild(svg('text', { x: 0, y: 6, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 800, fill: k.ink }, k.letter));
    return g;
  }

  /**
   * Draw a jar holding exactly the sweets in `jar` (array of colour keys).
   * opts.cap: show empty dashed places up to this many. opts.rows: fixed number of rows.
   * opts.onSweet(i): click a sweet. Returns { svg, nodes }.
   */
  function drawJar(jar, opts) {
    opts = opts || {};
    var n = Math.max(jar.length, opts.cap || 0);
    var rows = opts.rows || Math.max(2, Math.ceil(n / COLS));
    var H = rows * ROWH + 16;
    var W = 284;
    var root = svg('svg', { class: 'sjc-jar', viewBox: '0 0 ' + W + ' ' + (44 + H + 8), role: 'img', 'aria-label': 'A jar with ' + jar.length + ' sweets' });
    root.appendChild(svg('rect', { x: 46, y: 14, width: 192, height: 24, rx: 7, fill: '#d8c29a', stroke: '#9c8458', 'stroke-width': 3 }));
    root.appendChild(svg('path', { d: 'M20,44 h244 v' + (H - 14) + ' q0,14 -14,14 h-216 q-14,0 -14,-14 Z', fill: '#eef7fb', stroke: '#8fb0c2', 'stroke-width': 4 }));
    root.appendChild(svg('path', { d: 'M34,58 v' + (H - 40), stroke: '#ffffff', 'stroke-width': 6, 'stroke-linecap': 'round', opacity: 0.9 }));

    function pos(i, total) {
      var row = Math.floor(i / COLS);
      var col = i % COLS;
      var inRow = Math.min(COLS, total - row * COLS);
      var off = ((COLS - inRow) * GAPX) / 2;
      return { x: 22 + GAPX / 2 + col * GAPX + off, y: 44 + H - 8 - ROWH / 2 - row * ROWH };
    }
    if (opts.cap) {
      for (var e = jar.length; e < opts.cap; e++) {
        var pe = pos(e, opts.cap);
        root.appendChild(svg('circle', { class: 'sjc-slot', cx: pe.x, cy: pe.y, r: 18 }));
      }
    }
    var nodes = [];
    jar.forEach(function (c, i) {
      var p = pos(i, opts.cap ? opts.cap : jar.length);
      var g = sweetNode(c, p.x, p.y);
      if (opts.onSweet) {
        g.classList.add('sjc-click');
        g.appendChild(svg('title', null, 'Take this ' + c + ' sweet out'));
        g.addEventListener('click', function () {
          opts.onSweet(i);
        });
      }
      root.appendChild(g);
      nodes.push(g);
    });
    return { svg: root, nodes: nodes };
  }

  function highlight(nodes, jar, stmt) {
    nodes.forEach(function (g, i) {
      var hit = matches(stmt, jar[i]);
      g.classList.toggle('sjc-hit', hit);
      g.classList.toggle('sjc-dim', !hit);
    });
  }

  function legend(cols) {
    return el(
      'div',
      { class: 'sjc-legend' },
      cols.map(function (c) {
        return el('span', { class: 'sjc-leg', html: dotHtml(c) + COL[c].name });
      })
    );
  }

  function jarBox(jar, opts) {
    opts = opts || {};
    var j = drawJar(jar, opts);
    var box = el('div', { class: 'sjc-jarbox' }, opts.title ? el('div', { class: 'sjc-jar-title' }, opts.title) : null, j.svg);
    box.nodes = j.nodes;
    return box;
  }

  function answerChoices(onPick) {
    return MQ.ui.choices(
      ORDER.map(function (k) {
        return { label: '<span class="sjc-ans-icon sjc-ans-' + k + '">' + ANS[k].icon + '</span> ' + ANS[k].label, value: k };
      }),
      onPick,
      { columns: 3 }
    );
  }

  // Bar split into `total` equal parts with `hit` parts coloured: shows the share to scale.
  function shareBar(hit, total, c) {
    var W = 240;
    var s = svg('svg', { class: 'sjc-bar', viewBox: '0 0 ' + (W + 4) + ' 34' });
    var w = W / total;
    for (var i = 0; i < total; i++) {
      s.appendChild(svg('rect', { x: 2 + i * w, y: 2, width: w, height: 30, fill: i < hit ? COL[c].hex : '#fff', stroke: '#5a6b75', 'stroke-width': 1.5 }));
    }
    return s;
  }

  // ---------- hints for will / might / won't answers ----------
  function mistakeFor(correct, chosen, stmt) {
    if (stmt.kind === 'not' || stmt.kind === 'either') return TAG.notQuestion;
    if (correct === 'wont') return chosen === 'might' ? TAG.missingAsMight : TAG.willWontMix;
    if (correct === 'will') return chosen === 'might' ? TAG.allAsMight : TAG.willWontMix;
    return chosen === 'will' ? TAG.someAsWill : TAG.someAsWont;
  }
  function hintFor(correct, chosen, stmt, jar, tries) {
    var cover = stmt.kind === 'not' ? ' Cover up the ' + stmt.c + ' sweets with your finger. What is left?' : '';
    if (tries >= 1) return working(stmt, jar).replace(/→.*$/, '') + 'So which one is it?' + cover;
    if (correct === 'wont') return 'Look carefully in the jar. Can you find any ' + desc(stmt) + '?' + cover;
    if (correct === 'will') {
      if (chosen === 'might') return 'Check every sweet. Is there even one that is NOT ' + short(stmt) + '?' + cover;
      return 'Look again: can you find any ' + desc(stmt) + '?' + cover;
    }
    if (chosen === 'will') return 'Is EVERY sweet ' + short(stmt) + '? Look for one that is not.' + cover;
    return 'Look again. Is there at least one sweet that is ' + short(stmt) + '?' + cover;
  }

  // ---------- question builder (chips) ----------
  // Builds "Will I pick … ?" or "What is the chance of picking … ?" questions.
  function makeBuilder(colours) {
    var state = { start: null, kind: null, c: null };
    var sentence = el('div', { class: 'sjc-built' });
    function chipRow(label, items, key) {
      var row = el('div', { class: 'sjc-chiprow' }, el('span', { class: 'sjc-chiplab' }, label));
      var btns = [];
      items.forEach(function (it) {
        var b = el('button', { class: 'sjc-chip', type: 'button', html: it.label });
        b.addEventListener('click', function () {
          if (b.disabled) return;
          MQ.sound('click');
          state[key] = it.value;
          btns.forEach(function (x) {
            x.classList.toggle('on', x === b);
          });
          draw();
        });
        b.value_ = it.value;
        btns.push(b);
        row.appendChild(b);
      });
      row.btns = btns;
      return row;
    }
    var r1 = chipRow(
      '1',
      [
        { label: 'Will I pick…', value: 'will' },
        { label: 'What is the chance of picking…', value: 'chance' },
      ],
      'start'
    );
    var r2 = chipRow(
      '2',
      [
        { label: 'a ___ sweet', value: 'is' },
        { label: 'a sweet that is <b>not</b> ___', value: 'not' },
      ],
      'kind'
    );
    var r3 = chipRow(
      '3',
      colours.map(function (c) {
        return { label: dotHtml(c) + COL[c].name, value: c };
      }),
      'c'
    );
    function stmt() {
      if (!state.kind || !state.c) return null;
      return { kind: state.kind, c: state.c };
    }
    function text(st, start) {
      var s = st ? phrase(st) : state.kind === 'not' ? 'a sweet that is <b>not</b> ___' : state.kind === 'is' ? 'a ___ sweet' : state.c ? 'a ' + cw(state.c) + ' sweet' : '___';
      var lead = start === 'chance' ? 'What is the chance of picking ' : start === 'will' ? 'Will I pick ' : '… ';
      return lead + s + '?';
    }
    function draw() {
      sentence.innerHTML = text(stmt(), state.start);
    }
    draw();
    var wrap = el('div', { class: 'sjc-builder' }, sentence, r1, r2, r3);
    wrap.stmt = stmt;
    wrap.state = state;
    wrap.text = function () {
      return text(stmt(), state.start);
    };
    wrap.ready = function () {
      return !!(state.start && state.kind && state.c);
    };
    wrap.set = function (st, start) {
      state.start = start || state.start || 'chance';
      state.kind = st.kind;
      state.c = st.c;
      [r1, r2, r3].forEach(function (r, i) {
        var v = [state.start, state.kind, state.c][i];
        r.btns.forEach(function (b) {
          b.classList.toggle('on', b.value_ === v);
        });
      });
      draw();
    };
    wrap.reset = function () {
      state.start = state.kind = state.c = null;
      [r1, r2, r3].forEach(function (r) {
        r.btns.forEach(function (b) {
          b.classList.remove('on');
        });
      });
      draw();
    };
    wrap.disable = function () {
      [r1, r2, r3].forEach(function (r) {
        r.btns.forEach(function (b) {
          b.disabled = true;
        });
      });
    };
    return wrap;
  }
  // An example question with the wanted answer for this jar (for "Show me").
  function exampleQuestion(target, jar) {
    var inJar = coloursIn(jar);
    var missing = ALL.filter(function (c) {
      return inJar.indexOf(c) === -1;
    });
    if (target === 'wont') return { kind: 'is', c: missing[0] };
    if (target === 'will') return inJar.length === 1 ? { kind: 'is', c: inJar[0] } : { kind: 'not', c: missing[0] };
    for (var i = 0; i < inJar.length; i++) {
      var s = { kind: 'is', c: inJar[i] };
      if (answerOf(s, jar) === 'might') return s;
    }
    return null;
  }
  function builderHint(target, got) {
    var s = 'That question’s answer is “' + ANS[got].label + '”. ';
    if (target === 'wont') return s + 'For “will not happen”, NO sweet may match. Choose a colour that is not in the jar.';
    if (target === 'will') return s + 'For “will happen”, EVERY sweet must match. Try “a sweet that is not ___” with a colour that is not in the jar.';
    return s + 'For “might happen”, some sweets match and some do not. Choose a colour that is in the jar, but not every sweet.';
  }

  // ---------- jar filler (trays + drag or click) ----------
  function makeFiller(api, opts) {
    var jar = (opts.start || []).slice();
    var cap = opts.cap;
    var holder = el('div', { class: 'sjc-jarbox sjc-drop' });
    var count = el('div', { class: 'sjc-count' });
    var trays = el('div', { class: 'sjc-trays' });
    var live = null; // active drag listeners
    var disabled = false;

    function redraw() {
      MQ.clear(holder);
      var j = drawJar(jar, {
        cap: cap,
        onSweet: function (i) {
          if (disabled) return;
          jar.splice(i, 1);
          MQ.sound('click');
          redraw();
          if (opts.onChange) opts.onChange(jar);
        },
      });
      holder.nodes = j.nodes;
      holder.appendChild(j.svg);
      count.textContent = jar.length + ' of ' + cap + ' sweets in the jar';
    }
    function add(c) {
      if (disabled) return;
      if (jar.length >= cap) {
        api.feedback('The jar is full. Click a sweet in the jar to take it out.', 'info');
        return;
      }
      jar.push(c);
      MQ.sound('pop');
      redraw();
      if (opts.onChange) opts.onChange(jar);
    }
    function stopDrag() {
      if (!live) return;
      window.removeEventListener('pointermove', live.move);
      window.removeEventListener('pointerup', live.up);
      window.removeEventListener('pointercancel', live.up);
      if (live.ghost && live.ghost.parentNode) live.ghost.parentNode.removeChild(live.ghost);
      live = null;
    }
    api.cleanup(stopDrag);

    opts.colours.forEach(function (c) {
      var b = el('button', { class: 'sjc-tray', type: 'button', 'aria-label': 'Add a ' + c + ' sweet', html: '<span class="sjc-tray-sweet">' + dotHtml(c) + '</span><span>' + COL[c].name + '</span>' });
      b.addEventListener('pointerdown', function (e) {
        if (disabled || e.button > 0) return;
        e.preventDefault();
        stopDrag();
        var d = { x: e.clientX, y: e.clientY, ghost: null };
        d.move = function (ev) {
          if (!d.ghost && Math.abs(ev.clientX - d.x) + Math.abs(ev.clientY - d.y) > 8) {
            d.ghost = el('div', { class: 'sjc-ghost', html: dotHtml(c) });
            document.body.appendChild(d.ghost);
          }
          if (d.ghost) {
            d.ghost.style.left = ev.clientX - 22 + 'px';
            d.ghost.style.top = ev.clientY - 22 + 'px';
          }
        };
        d.up = function (ev) {
          var dragged = !!d.ghost;
          stopDrag();
          if (!dragged) {
            add(c);
            return;
          }
          var r = holder.getBoundingClientRect();
          if (ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom) add(c);
        };
        live = d;
        window.addEventListener('pointermove', d.move);
        window.addEventListener('pointerup', d.up);
        window.addEventListener('pointercancel', d.up);
      });
      // keyboard (Enter / Space) gives a click with detail 0
      b.addEventListener('click', function (e) {
        if (e.detail === 0) add(c);
      });
      trays.appendChild(b);
    });
    redraw();
    return {
      holder: holder,
      count: count,
      trays: trays,
      jar: function () {
        return jar;
      },
      set: function (j) {
        jar = j.slice();
        redraw();
      },
      disable: function () {
        disabled = true;
        stopDrag();
        Array.prototype.forEach.call(trays.children, function (b) {
          b.disabled = true;
        });
      },
    };
  }

  // ---------- deck ----------
  function randomJar(n, cols) {
    // n sweets using every colour in cols at least once
    var jar = cols.slice();
    while (jar.length < n) jar.push(U.pick(cols));
    return U.shuffle(jar);
  }
  function pickColours(k, from) {
    return U.shuffle((from || ALL).slice()).slice(0, k);
  }

  function makeAnswerQ(level, target, forms, used) {
    var best = null;
    for (var t = 0; t < 600; t++) {
      var jar, stmt;
      if (level === 1) {
        var n = U.rand(3, 5);
        var k = target === 'will' ? 1 : target === 'might' ? 2 : U.rand(1, 2);
        jar = randomJar(n, pickColours(k));
        var inJ = coloursIn(jar);
        var pool = target === 'wont' ? ALL.filter(function (c) { return inJ.indexOf(c) === -1; }) : inJ;
        stmt = { kind: 'is', c: U.pick(pool) };
      } else {
        jar = randomJar(U.rand(5, 8), pickColours(3));
        var kind = U.pick(forms);
        if (kind === 'either') {
          var two = pickColours(2);
          stmt = { kind: 'either', cs: two };
        } else stmt = { kind: kind, c: U.pick(ALL) };
      }
      var key = jarKey(jar) + '|' + stmtKey(stmt);
      if (used[key]) continue;
      if (answerOf(stmt, jar) !== target) {
        if (!best) best = { jar: jar, stmt: stmt, key: key };
        continue;
      }
      used[key] = true;
      return { type: 'answer', jar: jar, stmt: stmt };
    }
    used[best.key] = true;
    return { type: 'answer', jar: best.jar, stmt: best.stmt }; // answer still computed from the jar
  }

  function makeTwoJars() {
    var cols = pickColours(2);
    var big = cols[0];
    var lone = cols[1];
    var n = U.rand(5, 10);
    var jarA = U.shuffle(Array(n).fill(big).concat([lone]));
    var jarB = U.shuffle([big, lone]);
    var swap = Math.random() < 0.5;
    var target = Math.random() < 0.6 ? lone : big;
    return { type: 'two', jars: swap ? [jarB, jarA] : [jarA, jarB], target: target };
  }
  // which jar gives the better chance: 0, 1 or 'same' (compare hit/total shares exactly)
  function betterJar(jars, c) {
    var a = colourCount(jars[0], c) * jars[1].length;
    var b = colourCount(jars[1], c) * jars[0].length;
    return a > b ? 0 : b > a ? 1 : 'same';
  }

  function makeBuild() {
    for (var t = 0; t < 500; t++) {
      var ex = randomJar(5, pickColours(U.rand(1, 3), TRAY4));
      var cands = [];
      TRAY4.forEach(function (c) {
        ['is', 'not'].forEach(function (kind) {
          var s = { kind: kind, c: c };
          cands.push({ stmt: s, target: answerOf(s, ex) });
        });
      });
      cands = U.shuffle(cands);
      var a = cands[0];
      var b = null;
      for (var i = 1; i < cands.length; i++) {
        if (cands[i].target !== a.target && cands[i].stmt.c !== a.stmt.c) {
          b = cands[i];
          break;
        }
      }
      if (!b) continue;
      // keep "is" sentences most of the time; at most one "not"
      if (a.stmt.kind === 'not' && b.stmt.kind === 'not') continue;
      return { type: 'build', conds: [a, b], example: ex };
    }
    var ex2 = ['red', 'red', 'blue', 'blue', 'red'];
    return { type: 'build', conds: [{ stmt: { kind: 'is', c: 'red' }, target: 'might' }, { stmt: { kind: 'is', c: 'green' }, target: 'wont' }], example: ex2 };
  }

  function makeAsk() {
    var jar = randomJar(U.rand(5, 6), pickColours(U.rand(2, 3)));
    return { type: 'ask', jar: jar, targets: U.shuffle(ORDER.slice()) };
  }

  function buildDeck() {
    var used = {};
    var q = [];
    U.shuffle(['will', 'might', 'wont']).forEach(function (t) {
      q.push(makeAnswerQ(1, t, null, used));
    });
    q.push(makeAnswerQ(2, U.pick(['will', 'might']), ['not'], used));
    q.push(makeTwoJars());
    q.push(makeAnswerQ(2, U.pick(['will', 'might', 'wont']), ['not', 'either'], used));
    q.push(makeBuild());
    q.push(makeAsk());
    return q;
  }

  var deck = null;
  var learnJar = null; // the jar the child fills on learn screen 1

  function defaultJar() {
    return ['red', 'blue', 'red', 'yellow', 'blue'];
  }
  function usableLearnJar() {
    return learnJar && learnJar.length === 5 && coloursIn(learnJar).length >= 2 ? learnJar.slice() : defaultJar();
  }

  // ---------- practice renderers ----------
  function renderAnswer(stage, api, q) {
    api.say(api.level === 1 ? 'Look at the jar. Then choose.' : 'Read the question carefully!', 'think');
    var correct = answerOf(q.stmt, q.jar);
    stage.appendChild(MQ.ui.prompt('Bolt picks one sweet without looking.<br>Will he pick ' + phrase(q.stmt) + '?'));
    var box = jarBox(q.jar);
    var row = el('div', { class: 'sjc-row' }, box, legend(coloursIn(q.jar).concat(q.stmt.kind === 'any' ? [] : (q.stmt.cs || [q.stmt.c]).filter(function (c) { return q.jar.indexOf(c) === -1; }))));
    stage.appendChild(row);
    var work = el('div', { class: 'sjc-work' });
    var ch = answerChoices(function (v) {
      if (v === correct) {
        ch.mark(v, 'good');
        ch.disable();
        highlight(box.nodes, q.jar, q.stmt);
        api.check(true, working(q.stmt, q.jar));
      } else {
        ch.mark(v, 'bad');
        api.check(false, hintFor(correct, v, q.stmt, q.jar, api.tries()), mistakeFor(correct, v, q.stmt));
      }
    });
    stage.appendChild(ch);
    stage.appendChild(work);
    api.onReveal(function () {
      ch.mark(correct, 'good');
      ch.disable();
      highlight(box.nodes, q.jar, q.stmt);
      work.textContent = 'The ringed sweets are ' + short(q.stmt) + '.';
      api.feedback(working(q.stmt, q.jar), 'info');
    });
  }

  function renderTwo(stage, api, q) {
    api.say('Two jars. Which gives a better chance?', 'think');
    var ans = betterJar(q.jars, q.target);
    stage.appendChild(MQ.ui.prompt('Bolt wants a ' + cw(q.target) + ' sweet.<br>Which jar gives him a <b>better chance</b>?'));
    var boxes = q.jars.map(function (j, i) {
      return jarBox(j, { title: 'Jar ' + (i + 1), rows: 3 });
    });
    var bars = q.jars.map(function () {
      return el('div', { class: 'sjc-share' });
    });
    var row = el(
      'div',
      { class: 'sjc-two' },
      boxes.map(function (b, i) {
        return el('div', { class: 'sjc-col' }, b, bars[i]);
      })
    );
    stage.appendChild(row);
    stage.appendChild(legend(coloursIn(q.jars[0])));
    function showShares() {
      q.jars.forEach(function (j, i) {
        var hit = colourCount(j, q.target);
        highlight(boxes[i].nodes, j, { kind: 'is', c: q.target });
        MQ.clear(bars[i]);
        bars[i].appendChild(shareBar(hit, j.length, q.target));
        bars[i].appendChild(el('div', { class: 'sjc-share-txt' }, hit + ' ' + q.target + ' out of ' + j.length));
      });
    }
    var ch = MQ.ui.choices(
      [
        { label: 'Jar 1', value: 0 },
        { label: 'Jar 2', value: 1 },
        { label: 'Same chance', value: 'same' },
      ],
      function (v) {
        var a = colourCount(q.jars[0], q.target) + ' ' + q.target + ' out of ' + q.jars[0].length;
        var b = colourCount(q.jars[1], q.target) + ' ' + q.target + ' out of ' + q.jars[1].length;
        if (v === ans) {
          ch.mark(v, 'good');
          ch.disable();
          showShares();
          api.check(true, 'Yes! Jar 1: ' + a + '. Jar 2: ' + b + '. Jar ' + (ans + 1) + ' has the bigger share.');
        } else {
          ch.mark(v, 'bad');
          var h = api.tries() >= 1 ? 'Jar 1 has ' + a + '. Jar 2 has ' + b + '. In which jar is ' + q.target + ' a bigger part of the jar?' : 'Count the ' + q.target + ' sweets AND all the sweets in each jar. Which jar is it easier to get ' + q.target + ' from?';
          api.check(false, h, TAG.jarShare);
        }
      },
      { columns: 3 }
    );
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(ans, 'good');
      ch.disable();
      showShares();
      api.feedback('Jar 1: ' + colourCount(q.jars[0], q.target) + ' out of ' + q.jars[0].length + '. Jar 2: ' + colourCount(q.jars[1], q.target) + ' out of ' + q.jars[1].length + '. The bars show the ' + q.target + ' part is bigger in Jar ' + (ans + 1) + '.', 'info');
    });
  }

  function condHtml(cnd) {
    return 'Picking ' + phrase(cnd.stmt) + ' <b class="sjc-t-' + cnd.target + '">' + ANS[cnd.target].label + '</b>.';
  }
  function fixTip(cnd) {
    var s = cnd.stmt;
    var c = s.c;
    if (cnd.target === 'will') return s.kind === 'is' ? 'make every sweet ' + c + '.' : 'take out every ' + c + ' sweet.';
    if (cnd.target === 'wont') return s.kind === 'is' ? 'take out every ' + c + ' sweet.' : 'make every sweet ' + c + '.';
    return 'use some ' + c + ' sweets AND some of another colour.';
  }

  function renderBuild(stage, api, q) {
    api.say('Build a jar that makes both sentences true.', 'think');
    var marks = [];
    var list = el(
      'div',
      { class: 'sjc-conds' },
      q.conds.map(function (cnd) {
        var m = el('span', { class: 'sjc-mark' }, '•');
        marks.push(m);
        return el('div', { class: 'sjc-cond' }, m, el('span', { html: condHtml(cnd) }));
      })
    );
    stage.appendChild(MQ.ui.prompt('Put <b>5 sweets</b> in the jar so that:'));
    stage.appendChild(list);
    var f = makeFiller(api, { cap: 5, colours: TRAY4 });
    var checkBtn = el('button', { class: 'btn sjc-check', type: 'button' }, 'Check my jar');
    stage.appendChild(el('div', { class: 'sjc-row' }, f.holder, el('div', { class: 'sjc-side' }, f.trays, f.count, checkBtn)));
    function markAll(jar) {
      q.conds.forEach(function (cnd, i) {
        var ok = answerOf(cnd.stmt, jar) === cnd.target;
        marks[i].textContent = ok ? '✔' : '✖';
        marks[i].className = 'sjc-mark ' + (ok ? 'ok' : 'no');
      });
    }
    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var jar = f.jar();
      if (jar.length !== 5) {
        api.feedback('The jar needs exactly 5 sweets. It has ' + jar.length + ' now.', 'info');
        return;
      }
      markAll(jar);
      var bad = q.conds.filter(function (cnd) {
        return answerOf(cnd.stmt, jar) !== cnd.target;
      });
      if (!bad.length) {
        f.disable();
        checkBtn.disabled = true;
        api.check(true, 'Both sentences are true for your jar. Great building!');
        return;
      }
      var cnd = bad[0];
      var got = answerOf(cnd.stmt, jar);
      var h = 'With your jar, picking ' + phrasePlain(cnd.stmt) + ' ' + ANS[got].label + ' (' + countMatch(cnd.stmt, jar) + ' of 5 match). ';
      h += api.tries() >= 1 ? 'To make it “' + ANS[cnd.target].label + '”, ' + fixTip(cnd) : 'It needs to be “' + ANS[cnd.target].label + '”.';
      api.check(false, h, TAG.buildWrong);
    });
    api.onReveal(function () {
      f.set(q.example);
      f.disable();
      checkBtn.disabled = true;
      markAll(q.example);
      api.feedback(
        'Here is one jar that works. ' +
          q.conds
            .map(function (cnd) {
              return working(cnd.stmt, q.example);
            })
            .join(' '),
        'info'
      );
    });
  }

  function renderAsk(stage, api, q) {
    var step = 0;
    api.say('Your turn to ask the questions!', 'think');
    var ask = el('div', { class: 'prompt' });
    stage.appendChild(ask);
    var b = makeBuilder(ALL);
    var done = el('div', { class: 'sjc-done' });
    var checkBtn = el('button', { class: 'btn sjc-check', type: 'button' }, 'Check my question');
    stage.appendChild(el('div', { class: 'sjc-row sjc-askrow' }, el('div', { class: 'sjc-col' }, jarBox(q.jar, { rows: 2 }), legend(coloursIn(q.jar))), el('div', { class: 'sjc-col sjc-wide' }, b, checkBtn, done)));
    function showAsk() {
      var t = q.targets[step];
      ask.innerHTML = 'Question ' + (step + 1) + ' of 3: make a question whose answer is <span class="sjc-t-' + t + '">' + ANS[t].icon + ' ' + ANS[t].label + '</span>';
    }
    function addDone(st, start, t) {
      b.set(st, start);
      done.appendChild(el('div', { class: 'sjc-done-row', html: '<span class="sjc-t-' + t + '">' + ANS[t].icon + '</span> ' + b.text() + ' <small>(' + working(st, q.jar) + ')</small>' }));
      b.reset();
    }
    showAsk();
    checkBtn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      if (!b.ready()) {
        api.feedback('Pick one chip from each row (1, 2 and 3) first.', 'info');
        return;
      }
      var st = b.stmt();
      var t = q.targets[step];
      var got = answerOf(st, q.jar);
      if (got !== t) {
        api.check(false, builderHint(t, got), TAG.questionWrongType);
        return;
      }
      addDone(st, b.state.start, t);
      step++;
      if (step >= q.targets.length) {
        b.disable();
        checkBtn.disabled = true;
        ask.innerHTML = 'All three questions made!';
        api.check(true, 'Three questions, three different answers. Brilliant!');
      } else {
        MQ.sound('pop');
        api.feedback('Yes! That one is “' + ANS[t].label + '”. Now the next one.', 'good');
        showAsk();
      }
    });
    api.onReveal(function () {
      while (step < q.targets.length) {
        var t = q.targets[step];
        addDone(exampleQuestion(t, q.jar), 'chance', t);
        step++;
      }
      b.disable();
      checkBtn.disabled = true;
      ask.innerHTML = 'Here are questions with each answer:';
      api.feedback('Will not: a colour with none in the jar. Will: every sweet matches (try “not” + a missing colour). Might: some match, some do not.', 'info');
    });
  }

  // ---------- learn screens ----------
  var learn = [
    // 1. fill the jar
    function (stage, api) {
      api.say('Let us fill a sweet jar! Drag or click 5 sweets in.');
      api.lockNext();
      stage.appendChild(MQ.ui.lesson('Fill the jar', 'Drag sweets from the trays into the jar (or just click a tray). Click a sweet in the jar to take it out.'));
      var unlocked = false;
      var f = makeFiller(api, {
        cap: 5,
        colours: ['red', 'blue', 'yellow'],
        onChange: function (jar) {
          learnJar = jar.slice();
          if (jar.length === 5 && coloursIn(jar).length < 2) {
            api.feedback('Use at least two colours, so we can ask good questions.', 'info');
          } else if (jar.length === 5 && !unlocked) {
            unlocked = true;
            api.say('A full jar! Now Bolt will ask about it.', 'cheer');
            api.feedback('Your jar is ready. Press Next.', 'good');
            api.unlockNext();
          }
        },
      });
      stage.appendChild(el('div', { class: 'sjc-row' }, f.holder, el('div', { class: 'sjc-side' }, f.trays, f.count)));
    },
    // 2. three questions about the jar
    function (stage, api) {
      api.lockNext();
      var jar = usableLearnJar();
      var inJ = coloursIn(jar);
      var missing = ALL.filter(function (c) {
        return inJ.indexOf(c) === -1;
      });
      var mightC = inJ.filter(function (c) {
        return colourCount(jar, c) < jar.length;
      })[0];
      var qs = [{ kind: 'any' }, { kind: 'is', c: missing.indexOf('green') !== -1 ? 'green' : missing[0] }, { kind: 'is', c: mightC }];
      stage.appendChild(MQ.ui.lesson('Will, might or will not?', 'Bolt picks ONE sweet without looking.'));
      var box = jarBox(jar);
      var qEl = el('div', { class: 'prompt' });
      var choiceHolder = el('div', { class: 'sjc-full' });
      stage.appendChild(el('div', { class: 'sjc-row' }, box, legend(inJ)));
      stage.appendChild(qEl);
      stage.appendChild(choiceHolder);
      var n = 0;
      function show() {
        MQ.clear(choiceHolder);
        if (n >= qs.length) {
          qEl.innerHTML = 'Every sweet → <b>will</b>. No sweet → <b>will not</b>. Some → <b>might</b>.';
          api.say('You know all three!', 'cheer');
          api.unlockNext();
          return;
        }
        var st = qs[n];
        var right = answerOf(st, jar);
        qEl.innerHTML = 'Will Bolt pick ' + phrase(st) + '?';
        api.say(n === 0 ? 'Will I pick a sweet?' : 'What do you think?', 'think');
        box.nodes.forEach(function (g) {
          g.classList.remove('sjc-hit', 'sjc-dim');
        });
        var ch = answerChoices(function (v) {
          if (v === right) {
            ch.mark(v, 'good');
            ch.disable();
            highlight(box.nodes, jar, st);
            api.sound('correct');
            api.feedback(working(st, jar), 'good');
            n++;
            api.later(show, 2200);
          } else {
            ch.mark(v, 'bad');
            api.sound('wrong');
            api.feedback(hintFor(right, v, st, jar, 0), 'try');
          }
        });
        choiceHolder.appendChild(ch);
      }
      show();
    },
    // 3. make a question
    function (stage, api) {
      api.lockNext();
      var jar = usableLearnJar();
      api.say('Now YOU ask. Make a question whose answer is "will not happen".', 'think');
      stage.appendChild(MQ.ui.lesson('Make a chance question', 'Pick one chip from each row. Make a question whose answer is <b>will not happen</b>.'));
      var b = makeBuilder(ALL);
      var btn = el('button', { class: 'btn sjc-check', type: 'button' }, 'Check my question');
      stage.appendChild(el('div', { class: 'sjc-row sjc-askrow' }, el('div', { class: 'sjc-col' }, jarBox(jar, { rows: 2 }), legend(coloursIn(jar))), el('div', { class: 'sjc-col sjc-wide' }, b, btn)));
      btn.addEventListener('click', function () {
        if (!b.ready()) {
          api.feedback('Pick one chip from each row first.', 'info');
          return;
        }
        var got = answerOf(b.stmt(), jar);
        if (got === 'wont') {
          api.sound('correct');
          api.say('Great question!', 'cheer');
          api.feedback('Yes! ' + working(b.stmt(), jar), 'good');
          api.unlockNext();
        } else {
          api.sound('wrong');
          api.feedback(builderHint('wont', got), 'try');
        }
      });
    },
    // 4. two jars (Workbook Q7 idea)
    function (stage, api) {
      api.lockNext();
      api.say('Which jar gives a better chance of a yellow sweet?', 'think');
      var jars = [U.shuffle(Array(10).fill('blue').concat(['yellow'])), ['yellow', 'blue']];
      stage.appendChild(MQ.ui.lesson('Better chance', 'Bolt wants a ' + cw('yellow') + ' sweet. Click the jar that gives a <b>better chance</b>.'));
      var boxes = jars.map(function (j, i) {
        return jarBox(j, { title: 'Jar ' + (i + 1), rows: 3 });
      });
      var bars = [el('div', { class: 'sjc-share' }), el('div', { class: 'sjc-share' })];
      var done = false;
      boxes.forEach(function (bx, i) {
        bx.classList.add('sjc-pick');
        bx.addEventListener('click', function () {
          if (done) return;
          if (i === betterJar(jars, 'yellow')) {
            done = true;
            jars.forEach(function (j, k) {
              highlight(boxes[k].nodes, j, { kind: 'is', c: 'yellow' });
              bars[k].appendChild(shareBar(colourCount(j, 'yellow'), j.length, 'yellow'));
              bars[k].appendChild(el('div', { class: 'sjc-share-txt' }, '1 yellow out of ' + j.length));
            });
            api.sound('correct');
            api.say('Yes! Half of Jar 2 is yellow.', 'cheer');
            api.feedback('Both jars have 1 yellow. But 1 out of 2 is a much bigger share than 1 out of 11.', 'good');
            api.unlockNext();
          } else {
            api.sound('wrong');
            api.feedback('Jar 1 has lots of sweets, but only 1 is yellow. How many sweets are in Jar 2?', 'try');
          }
        });
      });
      stage.appendChild(
        el(
          'div',
          { class: 'sjc-two' },
          boxes.map(function (b, i) {
            return el('div', { class: 'sjc-col' }, b, bars[i]);
          })
        )
      );
    },
  ];

  var def = {
    learn: learn,
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'answer') return renderAnswer(stage, api, q);
        if (q.type === 'two') return renderTwo(stage, api, q);
        if (q.type === 'build') return renderBuild(stage, api, q);
        return renderAsk(stage, api, q);
      },
    },
  };
  // Test hook (not used by the site): lets a script check generated decks against the jars.
  def._sjc = { buildDeck: buildDeck, answerOf: answerOf, betterJar: betterJar, exampleQuestion: exampleQuestion };
  MQ.register('sweet-jar-chance', def);

  var css = [
    '.sjc-row{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:16px;width:100%}',
    '.sjc-two{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:center;gap:22px;width:100%}',
    '.sjc-col{display:flex;flex-direction:column;align-items:center;gap:8px;min-width:0}',
    '.sjc-wide{flex:1 1 380px;max-width:560px}',
    '.sjc-jarbox{display:flex;flex-direction:column;align-items:center;max-width:100%}',
    '.sjc-jar{width:270px;max-width:100%;height:auto;display:block}',
    '.sjc-jar-title{font-weight:800;font-size:1.2rem}',
    '.sjc-pick{cursor:pointer;border:3px solid var(--line);border-radius:16px;padding:6px 8px;background:#fff}',
    '.sjc-pick:hover{border-color:var(--accent)}',
    '.sjc-sweet{transition:opacity .25s}',
    '.sjc-ring{fill:none;stroke:transparent;stroke-width:4}',
    '.sjc-hit .sjc-ring{stroke:#138a3e;fill:#d9f5e2}',
    '.sjc-dim{opacity:.3}',
    '.sjc-click{cursor:pointer}',
    '.sjc-click:hover .sjc-ring{stroke:#c0392b}',
    '.sjc-slot{fill:#fff;stroke:#a9bfcc;stroke-width:2.5;stroke-dasharray:5 4}',
    '.sjc-dot{display:inline-flex;align-items:center;justify-content:center;width:1.45em;height:1.45em;border-radius:50%;border:2px solid;font-size:.8em;font-weight:800;vertical-align:.1em;margin:0 .2em;line-height:1}',
    '.sjc-legend{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:320px}',
    '.sjc-leg{background:#fff;border:2px solid var(--line);border-radius:999px;padding:3px 10px;font-weight:700}',
    '.sjc-side{display:flex;flex-direction:column;align-items:center;gap:10px}',
    '.sjc-trays{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:340px}',
    '.sjc-tray{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:76px;padding:8px 10px;border:3px solid var(--line);border-radius:14px;background:#fffaf0;font-weight:800;font-size:1rem;cursor:grab;touch-action:none;color:var(--ink)}',
    '.sjc-tray:hover:not(:disabled){border-color:var(--accent)}',
    '.sjc-tray:disabled{opacity:.5;cursor:default}',
    '.sjc-tray-sweet{font-size:1.6rem}',
    '.sjc-ghost{position:fixed;z-index:999;pointer-events:none;font-size:2rem}',
    '.sjc-count{font-weight:700;color:var(--ink-soft)}',
    '.sjc-check{font-size:1.1rem}',
    '.sjc-full{width:100%;display:flex;justify-content:center}',
    '.sjc-work{font-weight:700;color:var(--ink-soft);min-height:1.2em}',
    '.sjc-ans-icon{display:inline-block;width:1.4em;font-weight:900}',
    '.sjc-ans-will,.sjc-t-will{color:#138a3e}',
    '.sjc-ans-might,.sjc-t-might{color:#b86e00}',
    '.sjc-ans-wont,.sjc-t-wont{color:#c0392b}',
    '.sjc-share{display:flex;flex-direction:column;align-items:center;gap:4px;min-height:10px}',
    '.sjc-bar{width:240px;max-width:100%;height:auto}',
    '.sjc-share-txt{font-weight:800}',
    '.sjc-conds{display:flex;flex-direction:column;gap:6px;font-size:1.2rem;font-weight:700}',
    '.sjc-cond{display:flex;gap:10px;align-items:center;background:#fff;border:2px solid var(--line);border-radius:12px;padding:6px 12px}',
    '.sjc-mark{display:inline-block;width:1.3em;text-align:center;font-weight:900}',
    '.sjc-mark.ok{color:#138a3e}.sjc-mark.no{color:#c0392b}',
    '.sjc-builder{display:flex;flex-direction:column;gap:8px;width:100%}',
    '.sjc-built{font-size:1.25rem;font-weight:800;background:#fff;border:3px dashed var(--accent);border-radius:14px;padding:10px 14px;text-align:center}',
    '.sjc-chiprow{display:flex;flex-wrap:wrap;gap:6px;align-items:center}',
    '.sjc-chiplab{display:inline-flex;align-items:center;justify-content:center;width:1.7em;height:1.7em;border-radius:50%;background:var(--paper-2);font-weight:800}',
    '.sjc-chip{border:2px solid var(--line);background:#fff;border-radius:999px;padding:6px 12px;font-size:1rem;font-weight:700;cursor:pointer;color:var(--ink)}',
    '.sjc-chip:hover:not(:disabled){border-color:var(--accent)}',
    '.sjc-chip.on{background:var(--good-bg);border-color:var(--good)}',
    '.sjc-chip:disabled{cursor:default}',
    '.sjc-done{display:flex;flex-direction:column;gap:4px;width:100%}',
    '.sjc-done-row{background:#fff;border-radius:10px;padding:4px 10px;font-weight:700}',
    '.sjc-done-row small{color:var(--ink-soft);font-weight:600}',
    '.sjc-askrow{align-items:flex-start}',
    '.sjc-askrow .sjc-jar{width:230px}',
    '@media (max-width:820px){.sjc-jar{width:230px}.sjc-two{gap:10px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'sweet-jar-chance' }, css));
})();

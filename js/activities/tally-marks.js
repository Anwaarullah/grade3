/* Tally marks — make and read tally marks grouped in fives (Unit 2.1).
 * Four upright sticks and a fifth that crosses them make a "gate" worth 5.
 * Learn: tally birds at a bird table, count gates in 5s on a number line, make 13.
 * Practice: read tallies, make tallies by clicking, read long runs, spot a wrongly drawn group.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  /* ---------------------------------------------------------------- *
   * Drawing tallies
   * A group is { up: upright sticks, cross: true if a line crosses them }.
   * A proper gate is { up: 4, cross: true } and is worth 5. Every stroke drawn is one thing.
   * ---------------------------------------------------------------- */
  var SX = 24; // space between sticks in a group
  var H = 64; // stick height
  var GAP = 40; // space between groups
  var TOP = 14;
  var PADX = 26;
  var LAB_Y = TOP + H + 32; // baseline of the counting labels

  function groupsFor(n) {
    var gs = [];
    while (n >= 5) {
      gs.push({ up: 4, cross: true });
      n -= 5;
    }
    if (n > 0) gs.push({ up: n, cross: false });
    return gs;
  }
  function valueOf(g) {
    return g.up + (g.cross ? 1 : 0);
  }
  function totalOf(gs) {
    return gs.reduce(function (s, g) {
      return s + valueOf(g);
    }, 0);
  }
  function isGate(g) {
    return g.cross && g.up === 4;
  }
  function gatesIn(gs) {
    return gs.filter(isGate).length;
  }
  function widthFor(gs, gap) {
    var x = PADX;
    gs.forEach(function (g, i) {
      x += (g.up - 1) * SX + (i < gs.length - 1 ? gap : 0);
    });
    return x + PADX;
  }
  /** "5, 10, 15" for 3 gates. */
  function fives(g) {
    var a = [];
    for (var i = 1; i <= g; i++) a.push(5 * i);
    return a.join(', ');
  }
  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : many || one + 's');
  }

  /**
   * Draw a tally as SVG. opts: gap, minWidth, scale, labels (false = no label room),
   * animateLast (draw the newest stroke in), cls.
   * Returns { svg, groups, pos[], gEls[], hits, labs, countUp(api, step, done) }.
   */
  function tallyPic(gs, opts) {
    opts = opts || {};
    var gap = opts.gap || GAP;
    var contentW = widthFor(gs, gap);
    var W = Math.max(contentW, opts.minWidth || 0);
    var HH = opts.labels === false ? TOP + H + 14 : LAB_Y + 30;
    var scale = opts.scale || 1.25;
    var root = svg('svg', {
      viewBox: '0 0 ' + W + ' ' + HH,
      width: Math.round(W * scale),
      height: Math.round(HH * scale),
      class: 'tm-pic' + (opts.cls ? ' ' + opts.cls : ''),
      role: 'img',
      'aria-label': 'Tally marks',
    });
    var hits = svg('g', { class: 'tm-hits' });
    var marks = svg('g');
    var labs = svg('g');
    root.appendChild(hits);
    root.appendChild(marks);
    root.appendChild(labs);
    var info = { svg: root, groups: gs, pos: [], gEls: [], hits: hits, labs: labs };
    var x = opts.left ? PADX : PADX + (W - contentW) / 2;
    gs.forEach(function (g, i) {
      var w = (g.up - 1) * SX;
      var ge = svg('g', { class: 'tm-group' + (g.bad ? ' tm-odd' : ''), 'data-up': g.up, 'data-cross': g.cross ? 1 : 0 });
      for (var k = 0; k < g.up; k++) {
        ge.appendChild(svg('line', { x1: x + k * SX, y1: TOP, x2: x + k * SX, y2: TOP + H, class: 'tm-stroke', pathLength: 1 }));
      }
      if (g.cross) {
        ge.appendChild(svg('line', { x1: x - 11, y1: TOP + H - 8, x2: x + w + 11, y2: TOP + 9, class: 'tm-stroke tm-cross', pathLength: 1 }));
      }
      marks.appendChild(ge);
      info.pos.push({ x: x, w: w, cx: x + w / 2 });
      info.gEls.push(ge);
      x += w + gap;
    });
    if (opts.animateLast && gs.length) {
      var lastLine = info.gEls[gs.length - 1].lastChild;
      if (lastLine) lastLine.classList.add('tm-new');
    }
    /** Write running totals under the tally: 5, 10, 15 under gates, then 16, 17 under sticks. */
    info.countUp = function (api, step, done) {
      MQ.clear(labs);
      var steps = [];
      var run = 0;
      gs.forEach(function (g, i) {
        if (g.cross) {
          run += valueOf(g);
          steps.push({ x: info.pos[i].cx, n: run, gi: i });
        } else {
          for (var k = 0; k < g.up; k++) {
            run += 1;
            steps.push({ x: info.pos[i].x + k * SX, n: run, gi: i, small: true, low: k % 2 === 1 });
          }
        }
      });
      steps.forEach(function (s, j) {
        var show = function () {
          info.gEls[s.gi].classList.add('tm-lit');
          labs.appendChild(svg('text', { x: s.x, y: LAB_Y + (s.low ? 20 : 0), class: 'tm-lab' + (s.small ? ' tm-lab-s' : ''), 'text-anchor': 'middle' }, String(s.n)));
          if (api && step) api.sound('pop');
        };
        if (api && step) api.later(show, step * (j + 1));
        else show();
      });
      if (done) {
        if (api && step) api.later(done, step * (steps.length + 1));
        else done();
      }
      return steps.map(function (s) {
        return s.n;
      });
    };
    return info;
  }

  /** Read-out of the counting: "5, 10, 15, 16, 17". */
  function countWords(gs) {
    var out = [];
    var run = 0;
    gs.forEach(function (g) {
      if (g.cross) {
        run += valueOf(g);
        out.push(run);
      } else {
        for (var k = 0; k < g.up; k++) out.push(++run);
      }
    });
    return out.join(', ');
  }

  /** "17 is 3 gates (15) and 2 more sticks." */
  function splitText(T) {
    var g = Math.floor(T / 5);
    var r = T % 5;
    if (!g) return T + ' is ' + plural(r, 'stick') + '.';
    return T + ' is ' + plural(g, 'gate') + ' (' + 5 * g + ')' + (r ? ' and ' + plural(r, 'more stick', 'more sticks') : '') + '.';
  }

  /* ---------------------------------------------------------------- *
   * A small number line that jumps in 5s, then 1s
   * ---------------------------------------------------------------- */
  function numberLine(max) {
    var step = 30;
    var L = 22;
    var W = max * step + L * 2;
    var HH = 104;
    var base = 70;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + HH, width: W, height: HH, class: 'tm-nl' });
    root.appendChild(svg('line', { x1: L, y1: base, x2: L + max * step, y2: base, class: 'tm-nl-axis' }));
    for (var n = 0; n <= max; n++) {
      var big = n % 5 === 0;
      root.appendChild(svg('line', { x1: L + n * step, y1: base - (big ? 9 : 5), x2: L + n * step, y2: base + (big ? 9 : 5), class: 'tm-nl-tick' }));
      root.appendChild(svg('text', { x: L + n * step, y: base + 28, class: 'tm-nl-num' + (big ? ' tm-nl-big' : ''), 'text-anchor': 'middle' }, String(n)));
    }
    var jumps = svg('g');
    root.appendChild(jumps);
    var dot = svg('circle', { cx: L, cy: base, r: 8, class: 'tm-nl-dot' });
    root.appendChild(dot);
    return {
      svg: root,
      jump: function (a, b) {
        var x1 = L + a * step;
        var x2 = L + b * step;
        var h = b - a > 1 ? 44 : 22;
        jumps.appendChild(svg('path', { d: 'M' + x1 + ' ' + base + ' Q' + (x1 + x2) / 2 + ' ' + (base - 2 * h) + ' ' + x2 + ' ' + base, class: 'tm-nl-jump', pathLength: 1 }));
        jumps.appendChild(svg('text', { x: (x1 + x2) / 2, y: base - h - 6, class: 'tm-nl-plus', 'text-anchor': 'middle' }, '+' + (b - a)));
        dot.setAttribute('cx', x2);
      },
    };
  }

  /* ---------------------------------------------------------------- *
   * Tally maker: click to add strokes.
   * auto: the 5th click automatically crosses the other four.
   * manual: "Add a stick" and "Cross them" buttons, so the child does the crossing.
   * opts: manual, cap (for the box width), max, undo (default true), onAdd(count), onCheck(groups)
   * ---------------------------------------------------------------- */
  function groupsFromMarks(marks) {
    var gs = [];
    var cur = null;
    marks.forEach(function (m) {
      if (m === 's') {
        if (!cur) {
          cur = { up: 0, cross: false };
          gs.push(cur);
        }
        cur.up++;
      } else if (cur) {
        cur.cross = true;
        cur = null;
      }
    });
    return gs;
  }
  function openSticks(marks) {
    var gs = groupsFromMarks(marks);
    var last = gs[gs.length - 1];
    return last && !last.cross ? last.up : 0;
  }

  function maker(api, opts) {
    var marks = [];
    var locked = false;
    var capW = widthFor(groupsFor(opts.cap || 20), GAP);
    var box = el('div', { class: 'tm-box', role: 'button', tabindex: '0', 'aria-label': 'Tally box. Click to add a stick.' });
    var wrap = el('div', { class: 'tm-maker', 'data-tm-count': '0' });
    var w = { el: wrap, pic: null };
    var addBtn = el('button', { class: 'btn tm-add', type: 'button' }, opts.manual ? '➕ Add a stick' : '➕ Add a mark');
    var crossBtn = opts.manual ? el('button', { class: 'btn tm-crossbtn', type: 'button' }, '✏️ Cross them') : null;
    var undoBtn = opts.undo === false ? null : el('button', { class: 'btn btn-ghost tm-undo', type: 'button' }, '↩ Undo');
    var checkBtn = opts.onCheck ? el('button', { class: 'btn tm-check', type: 'button' }, 'Check ✓') : null;

    function draw(anim) {
      MQ.clear(box);
      w.pic = tallyPic(groupsFromMarks(marks), { minWidth: capW, animateLast: anim, left: true });
      box.appendChild(w.pic.svg);
      wrap.setAttribute('data-tm-count', String(marks.length));
      addBtn.disabled = locked || (opts.max != null && marks.length >= opts.max);
      if (crossBtn) crossBtn.disabled = locked || openSticks(marks) < 2;
      if (undoBtn) undoBtn.disabled = locked || !marks.length;
      if (checkBtn) checkBtn.disabled = locked || !marks.length;
      box.classList.toggle('tm-locked', locked);
    }
    function push(m) {
      marks.push(m);
      api.sound(m === 'x' ? 'pop' : 'click');
      draw(true);
      if (opts.onAdd) opts.onAdd(marks.length, groupsFromMarks(marks));
    }
    function add() {
      if (locked || (opts.max != null && marks.length >= opts.max)) return;
      if (!opts.manual && openSticks(marks) === 4) push('x');
      else push('s');
    }
    function cross() {
      if (locked || openSticks(marks) < 2) return;
      push('x');
    }
    box.addEventListener('click', add);
    box.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        add();
      }
    });
    addBtn.addEventListener('click', add);
    if (crossBtn) crossBtn.addEventListener('click', cross);
    if (undoBtn)
      undoBtn.addEventListener('click', function () {
        if (locked || !marks.length) return;
        marks.pop();
        api.sound('click');
        draw(false);
      });
    if (checkBtn)
      checkBtn.addEventListener('click', function () {
        if (!locked && marks.length) opts.onCheck(groupsFromMarks(marks));
      });

    wrap.appendChild(box);
    wrap.appendChild(el('div', { class: 'tm-tools' }, addBtn, crossBtn, undoBtn, checkBtn));
    w.count = function () {
      return marks.length;
    };
    w.groups = function () {
      return groupsFromMarks(marks);
    };
    /** Replace the tally with the right one for n (used by Show me). */
    w.set = function (n) {
      marks = [];
      groupsFor(n).forEach(function (g) {
        for (var k = 0; k < g.up; k++) marks.push('s');
        if (g.cross) marks.push('x');
      });
      draw(false);
    };
    w.lock = function () {
      locked = true;
      draw(false);
    };
    draw(false);
    return w;
  }

  /* ---------------------------------------------------------------- *
   * Hints: guess the likely mistake from the answer
   * ---------------------------------------------------------------- */
  function readMistake(gs, ans) {
    var T = totalOf(gs);
    var g = gatesIn(gs);
    var r = T - 5 * g;
    var strong = g
      ? 'There ' + (g === 1 ? 'is 1 gate' : 'are ' + g + ' gates') + (r ? ' and ' + plural(r, 'single stick') : '') + '. Count ' + fives(g) + (r ? ', then on in 1s.' : '.')
      : 'There are no gates here. Touch each stick and count 1, 2, 3…';
    if (g && ans === g + r) return { tag: 'Counted a gate as 1', hint: 'Each gate is worth 5, not 1. Count the gates in 5s: ' + fives(Math.min(g, 3)) + '…', strong: strong };
    if (g && ans === T + g) return { tag: 'Counted the crossing line as a stroke', hint: 'The crossing line IS the 5th stick, so a gate is 5, not 6.', strong: strong };
    if (g && ans === T - g) return { tag: 'Counted a gate as 4', hint: 'Do not forget the crossing line. It counts too, so a gate is 5.', strong: strong };
    if (ans > T) return { tag: 'Counted in 1s and lost track', hint: 'That is too many. Count the gates in 5s first, then the single sticks in 1s.', strong: strong };
    return { tag: 'Counted in 1s and lost track', hint: 'That is too few. Count the gates in 5s first, then the single sticks in 1s.', strong: strong };
  }

  /** For a tally the child made. Returns null if it is right. */
  function makeMistake(gs, T, tries) {
    var strong = splitText(T) + ' Make ' + (Math.floor(T / 5) ? plural(Math.floor(T / 5), 'gate') + ' first.' : 'the sticks one by one.');
    for (var i = 0; i < gs.length; i++) {
      if (gs[i].up > 4) {
        return {
          tag: 'Made groups bigger than 5',
          hint: tries >= 1 ? 'Look for a group with 5 or more sticks standing up. Undo back to 4 sticks, then press Cross them.' : 'One group has more than 4 sticks standing up. The 5th mark must cross the other four.',
        };
      }
      if (gs[i].cross && gs[i].up < 4) {
        return {
          tag: 'Crossed a gate too early',
          hint: tries >= 1 ? 'Undo the crossing line, add sticks until there are 4, then cross them.' : 'A gate needs 4 sticks standing up, then the crossing line. One gate has too few sticks.',
        };
      }
    }
    var n = totalOf(gs);
    if (n === T) return null;
    if (n > T) return { tag: 'Counted in 1s and lost track', hint: tries >= 1 ? strong : 'Too many! Use ↩ Undo to take some off. Count your gates in 5s to check.' };
    return { tag: 'Counted in 1s and lost track', hint: tries >= 1 ? strong : 'Not enough yet. Count your gates in 5s, then the sticks in 1s. Keep going to ' + T + '.' };
  }

  /* ---------------------------------------------------------------- *
   * The bird table (learn screen 1)
   * ---------------------------------------------------------------- */
  var BIRD_COLORS = ['#4a90d9', '#e07a3f', '#7a9a3a', '#c0504d', '#7b6aa8', '#d4a017', '#3f8f8a'];
  function bird(x, y, color) {
    var inner = svg(
      'g',
      { class: 'tm-bird' },
      svg('polygon', { points: '-13,-12 -27,-20 -25,-6', fill: color }),
      svg('ellipse', { cx: 0, cy: -13, rx: 15, ry: 10, fill: color }),
      svg('ellipse', { cx: -3, cy: -14, rx: 8, ry: 5, fill: 'rgba(0,0,0,0.18)' }),
      svg('circle', { cx: 12, cy: -23, r: 7.5, fill: color }),
      svg('circle', { cx: 14, cy: -24, r: 1.8, fill: '#1b2a4a' }),
      svg('polygon', { points: '19,-25 27,-22 19,-19', fill: '#f2a33a' }),
      svg('line', { x1: -3, y1: -4, x2: -3, y2: 0, stroke: '#8a5a2b', 'stroke-width': 2 }),
      svg('line', { x1: 4, y1: -4, x2: 4, y2: 0, stroke: '#8a5a2b', 'stroke-width': 2 })
    );
    return svg('g', { transform: 'translate(' + x + ',' + y + ')' }, inner);
  }
  function birdTable() {
    var root = svg('svg', { viewBox: '0 0 420 230', width: 420, height: 230, class: 'tm-scene', role: 'img', 'aria-label': 'A bird table in a garden' });
    root.appendChild(svg('rect', { x: 0, y: 206, width: 420, height: 24, rx: 8, class: 'tm-grass' }));
    root.appendChild(svg('rect', { x: 200, y: 130, width: 20, height: 80, class: 'tm-wood' }));
    root.appendChild(svg('rect', { x: 170, y: 200, width: 80, height: 10, rx: 3, class: 'tm-wood' }));
    root.appendChild(svg('rect', { x: 54, y: 58, width: 8, height: 66, class: 'tm-wood' }));
    root.appendChild(svg('rect', { x: 358, y: 58, width: 8, height: 66, class: 'tm-wood' }));
    root.appendChild(svg('polygon', { points: '34,64 210,20 386,64', class: 'tm-roof' }));
    root.appendChild(svg('rect', { x: 36, y: 120, width: 348, height: 14, rx: 4, class: 'tm-wood' }));
    var birds = svg('g');
    root.appendChild(birds);
    return {
      svg: root,
      land: function (i) {
        var b = bird(88 + i * 42, 120, BIRD_COLORS[i % BIRD_COLORS.length]);
        b.firstChild.classList.add('tm-land');
        birds.appendChild(b);
      },
    };
  }

  /* ---------------------------------------------------------------- *
   * Practice deck
   * ---------------------------------------------------------------- */
  var THINGS = [
    { icon: '🚗', title: 'Cars that drove past the school', many: 'cars' },
    { icon: '🐦', title: 'Birds at the bird table', many: 'birds' },
    { icon: '🍎', title: 'Apples picked from the tree', many: 'apples' },
    { icon: '🚌', title: 'Buses at the bus stop', many: 'buses' },
    { icon: '🚲', title: 'Bikes in the bike shed', many: 'bikes' },
    { icon: '📚', title: 'Books taken back to the library', many: 'books' },
    { icon: '⚽', title: 'Goals scored at break time', many: 'goals' },
    { icon: '🌷', title: 'Flowers planted in the garden', many: 'flowers' },
    { icon: '🐕', title: 'Dogs walked in the park', many: 'dogs' },
    { icon: '🍪', title: 'Biscuits sold at the cake stall', many: 'biscuits' },
    { icon: '✉️', title: 'Letters posted today', many: 'letters' },
  ];
  var NAMES = ['Sam', 'Mia', 'Ravi', 'Lena', 'Omar', 'Zoe'];

  function spotQuestion() {
    var k = U.rand(2, 4);
    var kind = U.pick(['six', 'four']);
    var r = U.rand(0, 3);
    var bad = kind === 'six' ? { up: 6, cross: false, bad: true } : { up: 3, cross: true, bad: true };
    var w = valueOf(bad);
    if (5 * k + w + r < 15) r = 15 - 5 * k - w;
    var gs = [];
    for (var i = 0; i < k; i++) gs.push({ up: 4, cross: true });
    gs.splice(U.rand(0, k - 1), 0, bad); // always at least one proper gate after it
    if (r) gs.push({ up: r, cross: false });
    return { kind: 'spot', groups: gs, gates: k, odd: kind, oddValue: w, ones: r, answer: totalOf(gs), who: U.pick(NAMES) };
  }

  function buildDeck() {
    var things = U.shuffle(THINGS);
    var used = {};
    function val(a, b) {
      var v;
      var guard = 0;
      do {
        v = U.rand(a, b);
        guard++;
      } while (used[v] && guard < 60);
      used[v] = true;
      return v;
    }
    var q = [];
    // Level 1: read tallies of 1-12 (at most two gates)
    q.push({ kind: 'pick', answer: val(3, 7) });
    q.push({ kind: 'read', answer: val(7, 10) });
    q.push({ kind: 'read', answer: val(10, 12) });
    // Level 2: make 6-20 by clicking (gates form by themselves), read 13-26
    q.push({ kind: 'make', answer: val(6, 13) });
    q.push({ kind: 'read', answer: val(13, 26) });
    q.push({ kind: 'make', answer: val(14, 20) });
    // Level 3: long continuous run 15-31, spot a wrongly drawn group, click out a frequency 18-31
    q.push({ kind: 'run', answer: val(15, 31) });
    q.push(spotQuestion());
    q.push({ kind: 'manual', answer: val(18, 31) });
    q.forEach(function (item, i) {
      item.thing = things[i];
      if (!item.groups) item.groups = groupsFor(item.answer);
    });
    return q;
  }

  var deck = null;

  /* ---------------------------------------------------------------- *
   * Activity
   * ---------------------------------------------------------------- */
  MQ.register('tally-marks', {
    learn: [
      // 1. Bird table: one bird, one stick; the 5th stick crosses the four
      function (stage, api) {
        api.say('Birds keep landing on the bird table. Click the tally box once for each bird!');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('One bird, one mark', 'Click the box to make a mark for each bird.'));
        var scene = birdTable();
        var countEl = el('div', { class: 'tm-count' }, '0 birds');
        var w = maker(api, {
          cap: 7,
          max: 7,
          undo: false,
          onAdd: function (n) {
            scene.land(n - 1);
            countEl.textContent = plural(n, 'bird');
            if (n < 4) api.say(plural(n, 'bird') + ', ' + plural(n, 'mark') + '.', 'happy');
            else if (n === 4) api.say('4 marks standing up. Watch what the next one does!', 'think');
            else if (n === 5) {
              countEl.textContent = '5 birds = 1 gate';
              api.say('The 5th mark crosses the other four. That makes a gate. One gate = 5!', 'cheer');
              api.feedback('A gate: 4 sticks and a 5th line across them. One gate = 5.', 'good');
              api.unlockNext();
            } else if (n === 6) api.say('A new group starts after the gate. 5 and 1 more is 6.', 'happy');
            else {
              api.say('7 birds: one gate (5), then 6, 7. All the birds are here!', 'cheer');
              w.lock();
            }
          },
        });
        stage.appendChild(el('div', { class: 'tm-l1' }, el('div', { class: 'tm-scene-wrap' }, scene.svg), el('div', { class: 'tm-l1-right' }, w.el, countEl)));
      },

      // 2. Count gates in 5s on a number line: 5, 10, 15, then 16, 17
      function (stage, api) {
        api.say('Counting every stick is slow. Click each gate and count in 5s!');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Count in 5s, then 1s', 'Click the gates from the left, then the single sticks.'));
        var gs = groupsFor(17);
        var pic = tallyPic(gs, { scale: 1.4 });
        var nl = numberLine(20);
        var chant = el('div', { class: 'tm-chant' }, '…');
        var targets = [];
        gs.forEach(function (g, i) {
          var p = pic.pos[i];
          if (g.cross) targets.push({ x: p.x - 18, w: p.w + 36, label: p.cx, add: 5, gi: i });
          else for (var k = 0; k < g.up; k++) targets.push({ x: p.x + k * SX - SX / 2, w: SX, label: p.x + k * SX, add: 1, gi: i, low: k % 2 === 1 });
        });
        var at = 0;
        var run = 0;
        var said = [];
        targets.forEach(function (t, j) {
          t.rect = svg('rect', { x: t.x, y: TOP - 8, width: t.w, height: H + 16, rx: 8, class: 'tm-hit' + (j === 0 ? ' tm-next' : '') });
          t.rect.addEventListener('click', function () {
            if (j < at || at >= targets.length) return;
            if (j !== at) {
              api.feedback(at === 0 ? 'Start with the first gate on the left.' : 'Go in order: click the one with the yellow box.', 'try');
              return;
            }
            var before = run;
            run += t.add;
            t.rect.classList.remove('tm-next');
            t.rect.classList.add('tm-done');
            pic.gEls[t.gi].classList.add('tm-lit');
            pic.labs.appendChild(svg('text', { x: t.label, y: LAB_Y + (t.low ? 20 : 0), class: 'tm-lab' + (t.add === 1 ? ' tm-lab-s' : ''), 'text-anchor': 'middle' }, String(run)));
            nl.jump(before, run);
            api.sound('pop');
            said.push(run);
            chant.textContent = said.join(', ');
            at++;
            if (at < targets.length) {
              targets[at].rect.classList.add('tm-next');
              api.say(t.add === 5 ? run + '!' + (at < 3 ? ' Next gate.' : ' Now the single sticks, in 1s.') : run + '!', 'happy');
            } else {
              api.say('3 gates and 2 sticks: 5, 10, 15, 16, 17. That is 17!', 'cheer');
              api.feedback('Count the gates in 5s, then the single sticks in 1s: 17.', 'good');
              api.unlockNext();
            }
          });
          pic.hits.appendChild(t.rect);
        });
        stage.appendChild(el('div', { class: 'tm-card' }, pic.svg));
        stage.appendChild(chant);
        stage.appendChild(el('div', { class: 'tm-nl-wrap' }, nl.svg));
      },

      // 3. Make 13: the child does the crossing and Bolt checks the groups
      function (stage, api) {
        api.say('Your turn to draw. Make 13! You cross the 5th stick yourself.');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Make 13', 'Add sticks. When 4 are standing, press <b>Cross them</b>.'));
        var done = false;
        var w = maker(api, {
          manual: true,
          cap: 18,
          onCheck: function (gs) {
            if (done) return;
            var m = makeMistake(gs, 13, 0);
            if (m) {
              api.sound('wrong');
              api.say(m.hint, 'oops');
              api.feedback(m.hint, 'try');
              return;
            }
            done = true;
            w.lock();
            api.sound('correct');
            w.pic.countUp(api, 300, function () {
              api.say('Perfect groups! 5, 10, 11, 12, 13.', 'cheer');
              api.feedback('13 is 2 gates (10) and 3 more sticks.', 'good');
              api.unlockNext();
            });
          },
        });
        stage.appendChild(w.el);
      },
    ],

    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        var T = q.answer;
        var card = el('div', { class: 'tm-q', 'data-tm-kind': q.kind, 'data-tm-answer': String(T) });
        stage.appendChild(card);
        var title = el('div', { class: 'tm-title' }, el('span', { class: 'tm-icon' }, q.thing.icon), ' ' + q.thing.title);

        // --- Read a tally (pick or type) -------------------------------------
        if (q.kind === 'pick' || q.kind === 'read' || q.kind === 'run') {
          var run = q.kind === 'run';
          var pic = tallyPic(q.groups, { gap: run ? SX : GAP, scale: run ? 1.15 : 1.35 });
          api.say(run ? 'The gates are all squashed together. Find each crossing line and count in 5s!' : q.kind === 'pick' ? 'How many? Count the gate as 5.' : 'Count the gates in 5s, then the sticks in 1s.', 'think');
          card.appendChild(el('div', { class: 'tm-card' }, title, pic.svg));
          card.appendChild(MQ.ui.prompt('How many <b>' + q.thing.many + '</b>?'));
          var finish = function () {
            pic.countUp(api, 220);
          };
          var wrong = function (v) {
            var m = readMistake(q.groups, v);
            api.check(false, api.tries() >= 1 ? m.strong : m.hint, m.tag);
          };
          if (q.kind === 'pick') {
            var gg = gatesIn(q.groups);
            var opts = [T, T + 1, T - 1];
            if (gg) opts.push(gg + (T - 5 * gg), T + gg);
            var seen = {};
            opts = opts.filter(function (v) {
              if (v < 1 || seen[v]) return false;
              seen[v] = true;
              return true;
            });
            opts = [T].concat(U.shuffle(opts.slice(1)).slice(0, 3)).sort(function (a, b) {
              return a - b;
            });
            var ch = MQ.ui.choices(opts, function (v) {
              if (v === T) {
                ch.mark(v, 'good');
                ch.disable();
                finish();
                api.check(true, 'Yes! ' + countWords(q.groups) + '. That is ' + T + '.');
              } else {
                ch.mark(v, 'bad');
                wrong(v);
              }
            }, { columns: opts.length });
            card.appendChild(ch);
            api.onReveal(function () {
              ch.mark(T, 'good');
              ch.disable();
              finish();
              api.feedback(countWords(q.groups) + '. There are ' + T + ' ' + q.thing.many + '.', 'info');
            });
            return;
          }
          var ni = MQ.ui.numberInput({
            onSubmit: function (v) {
              if (v === T) {
                ni.good();
                ni.disable();
                finish();
                api.check(true, 'Yes! ' + countWords(q.groups) + '. That is ' + T + '.');
              } else {
                ni.bad();
                wrong(v);
              }
            },
          });
          card.appendChild(ni.el);
          ni.focus();
          api.onReveal(function () {
            ni.setValue(String(T));
            ni.good();
            ni.disable();
            finish();
            api.feedback(countWords(q.groups) + '. There are ' + T + ' ' + q.thing.many + '.', 'info');
          });
          return;
        }

        // --- Make a tally by clicking ------------------------------------------
        if (q.kind === 'make' || q.kind === 'manual') {
          var manual = q.kind === 'manual';
          api.say(manual ? 'This time you cross the 5th stick yourself. Make ' + T + '!' : 'Click once for each one. Every 5th click makes a gate.', 'think');
          card.appendChild(MQ.ui.prompt('<span class="tm-icon">' + q.thing.icon + '</span> Make a tally for <b class="tm-target">' + T + '</b> ' + q.thing.many + '.'));
          var w = maker(api, {
            manual: manual,
            cap: Math.max(T + 4, 20),
            onCheck: function (gs) {
              var m = makeMistake(gs, T, api.tries());
              if (!m) {
                w.lock();
                w.pic.countUp(api, 200);
                api.check(true, 'Yes! ' + splitText(T));
              } else api.check(false, m.hint, m.tag);
            },
          });
          card.appendChild(w.el);
          api.onReveal(function () {
            w.set(T);
            w.lock();
            w.pic.countUp(api, 250);
            api.feedback(splitText(T) + ' Count: ' + countWords(groupsFor(T)) + '.', 'info');
          });
          return;
        }

        // --- Spot the wrongly drawn group ----------------------------------------
        var spic = tallyPic(q.groups, { scale: 1.2 });
        var step = 1;
        var oddIndex = -1;
        var area = el('div', { class: 'tm-step2' });
        api.say(q.who + ' tallied in a hurry. One group is drawn wrong. Can you find it?', 'think');
        card.appendChild(el('div', { class: 'tm-card' }, el('div', { class: 'tm-title' }, el('span', { class: 'tm-icon' }, q.thing.icon), ' ' + q.who + "'s tally: " + q.thing.title.charAt(0).toLowerCase() + q.thing.title.slice(1)), spic.svg));
        var ask = MQ.ui.prompt('Click the group that is <b>drawn wrong</b>.');
        card.appendChild(ask);
        card.appendChild(area);
        var oddText = q.odd === 'six' ? 'It has 6 sticks and no crossing line. A gate has only 4 sticks, then the 5th crosses them.' : 'Its crossing line goes over only 3 sticks. A gate needs 4 sticks before the crossing line.';
        function markOdd() {
          spic.gEls[oddIndex].classList.add('tm-bad');
          spic.hits.childNodes[oddIndex].classList.add('tm-hit-bad');
        }
        var fixed = el('div', { class: 'tm-fixed' });
        function showFixed() {
          MQ.clear(fixed);
          var fp = tallyPic(groupsFor(T), { scale: 1.1 });
          fixed.appendChild(el('div', { class: 'tm-fixed-label' }, 'Drawn the right way:'));
          fixed.appendChild(fp.svg);
          fp.countUp(api, 200);
        }
        var ni2 = MQ.ui.numberInput({
          onSubmit: function (v) {
            if (v === T) {
              ni2.good();
              ni2.disable();
              showFixed();
              api.check(true, 'Yes! Every stroke is one. ' + T + ' ' + q.thing.many + '. ' + splitText(T));
              return;
            }
            ni2.bad();
            var tag;
            var hint;
            if (v === T - q.oddValue + 5) {
              tag = q.odd === 'six' ? 'Made groups bigger than 5' : 'Counted a gate as 5 without checking';
              hint = 'The odd group is not 5. Count its strokes one by one: there are ' + q.oddValue + '.';
            } else if (v === q.gates + 1 + q.ones) {
              tag = 'Counted a gate as 1';
              hint = 'Each proper gate is worth 5, not 1.';
            } else {
              tag = 'Counted in 1s and lost track';
              hint = 'Count the proper gates in 5s, add the strokes in the odd group, then the single sticks.';
            }
            if (api.tries() >= 1) hint = plural(q.gates, 'proper gate') + ' make ' + 5 * q.gates + '. The odd group has ' + q.oddValue + ' strokes' + (q.ones ? ', and there ' + (q.ones === 1 ? 'is 1 single stick' : 'are ' + q.ones + ' single sticks') : '') + '. Add them up.';
            api.check(false, hint, tag);
          },
        });
        function startStep2() {
          step = 2;
          ask.innerHTML = 'Every stroke is one. How many ' + q.thing.many + ' did ' + q.who + ' <b>really</b> count?';
          area.appendChild(el('div', { class: 'tm-why' }, oddText));
          area.appendChild(ni2.el);
          area.appendChild(fixed);
          ni2.focus();
        }
        q.groups.forEach(function (g, i) {
          if (g.bad) oddIndex = i;
          var p = spic.pos[i];
          var hit = svg('rect', { x: p.x - 17, y: TOP - 8, width: p.w + 34, height: H + 16, rx: 8, class: 'tm-hit', 'data-bad': g.bad ? '1' : '0' });
          hit.addEventListener('click', function () {
            if (step !== 1 || api.isAnswered()) return;
            if (g.bad) {
              api.sound('correct');
              markOdd();
              api.feedback('Well spotted! ' + oddText, 'good');
              api.say('Well spotted! Now count it properly.', 'happy');
              startStep2();
              return;
            }
            hit.classList.add('tm-hit-no');
            var h;
            if (g.cross) h = 'That one has 4 sticks and a crossing line, so it is a proper gate. Look for a group with too many or too few sticks.';
            else h = 'Those single sticks are fine: they are not a full group yet. Look at the bigger groups.';
            if (api.tries() >= 1) h = 'Count the sticks standing up in each group. One group does not have exactly 4 under its line.';
            api.check(false, h, q.odd === 'six' ? 'Missed a group of 6 sticks' : 'Missed a gate of only 4');
          });
          spic.hits.appendChild(hit);
        });
        api.onReveal(function () {
          markOdd();
          if (step === 1) startStep2();
          ni2.setValue(String(T));
          ni2.good();
          ni2.disable();
          showFixed();
          api.feedback(oddText + ' Each stroke is one: ' + T + ' altogether. ' + splitText(T), 'info');
        });
      },
    },
  });

  /* ---------------------------------------------------------------- *
   * Styles
   * ---------------------------------------------------------------- */
  var css = [
    '.tm-pic{display:block;max-width:100%;height:auto;margin:0 auto;user-select:none}',
    '.tm-group,.tm-lab{pointer-events:none}',
    '.tm-stroke{stroke:#2b3a55;stroke-width:5;stroke-linecap:round;fill:none}',
    '.tm-lit .tm-stroke{stroke:#0b6e66}',
    '.tm-bad .tm-stroke{stroke:#d1495b}',
    '.tm-new{stroke-dasharray:1;stroke-dashoffset:0;animation:tm-draw .35s ease-out}',
    '@keyframes tm-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}',
    '.tm-lab{font-size:22px;font-weight:800;fill:#0b6e66}',
    '.tm-lab-s{font-size:17px;fill:#5a6b8c}',
    '.tm-hit{fill:transparent;stroke:transparent;cursor:pointer}',
    '.tm-hit:hover{fill:rgba(255,183,3,.14)}',
    '.tm-next{fill:rgba(255,183,3,.16);stroke:var(--gold);stroke-width:3;stroke-dasharray:6 4}',
    '.tm-done{fill:rgba(46,196,182,.10);cursor:default}',
    '.tm-hit-bad{fill:rgba(209,73,91,.10);stroke:#d1495b;stroke-width:3}',
    '.tm-hit-no{fill:rgba(0,0,0,.04)}',
    '.tm-card{background:#fff;border:3px solid var(--line);border-radius:18px;padding:12px 18px;display:flex;flex-direction:column;align-items:center;gap:6px;max-width:100%;box-sizing:border-box}',
    '.tm-q{display:flex;flex-direction:column;align-items:center;gap:14px;width:100%}',
    '.tm-title{font-size:1.3rem;font-weight:800;text-align:center}',
    '.tm-icon{font-size:1.6rem}',
    '.tm-target{font-size:1.7rem;color:#0b6e66}',
    '.tm-maker{display:flex;flex-direction:column;align-items:center;gap:12px;max-width:100%}',
    '.tm-box{background:#fffdf5;border:3px dashed #e3c77a;border-radius:18px;padding:6px 10px;cursor:pointer;max-width:100%;box-sizing:border-box;min-width:260px}',
    '.tm-box:hover{border-color:var(--gold)}',
    '.tm-box:focus-visible{outline:4px solid var(--gold);outline-offset:2px}',
    '.tm-box.tm-locked{cursor:default;border-style:solid;border-color:var(--line)}',
    '.tm-tools{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.tm-add{background:#ffd166;color:#2b1d00}',
    '.tm-crossbtn{background:#cfe8ff;color:#123}',
    '.tm-check{background:var(--good);color:#fff}',
    '.tm-l1{display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:center;width:100%}',
    '.tm-scene{display:block;max-width:100%;height:auto}',
    '.tm-scene-wrap{flex:0 1 420px;min-width:0;max-width:100%}',
    '.tm-l1-right{display:flex;flex-direction:column;align-items:center;gap:10px;min-width:0;max-width:100%}',
    '.tm-count{font-size:1.5rem;font-weight:800;color:#0b6e66}',
    '.tm-grass{fill:#b7dfa0}',
    '.tm-wood{fill:#b07a4a}',
    '.tm-roof{fill:#8c5a33}',
    '.tm-land{animation:tm-drop .45s ease-out}',
    '@keyframes tm-drop{from{transform:translateY(-70px);opacity:0}to{transform:none;opacity:1}}',
    '.tm-chant{font-size:1.6rem;font-weight:800;color:#0b6e66;min-height:2rem}',
    '.tm-nl-wrap{max-width:100%}',
    '.tm-nl{display:block;max-width:100%;height:auto}',
    '.tm-nl-axis{stroke:#5a6b8c;stroke-width:3}',
    '.tm-nl-tick{stroke:#5a6b8c;stroke-width:2}',
    '.tm-nl-num{font-size:14px;fill:#5a6b8c}',
    '.tm-nl-big{font-size:18px;font-weight:800;fill:#1b2a4a}',
    '.tm-nl-dot{fill:var(--gold);stroke:#2b1d00;stroke-width:2}',
    '.tm-nl-jump{fill:none;stroke:#ff9f1c;stroke-width:3;stroke-dasharray:1;animation:tm-draw .4s ease-out}',
    '.tm-nl-plus{font-size:15px;font-weight:800;fill:#c46a00}',
    '.tm-step2{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.tm-why{font-size:1.05rem;color:#9a2b3b;font-weight:700;text-align:center;max-width:640px}',
    '.tm-fixed{display:flex;flex-direction:column;align-items:center;gap:4px;max-width:100%}',
    '.tm-fixed-label{font-weight:800;color:#0b6e66}',
    '@media (max-width:700px){.tm-title{font-size:1.1rem}.tm-box{min-width:0}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'tally-marks' }, css));
})();

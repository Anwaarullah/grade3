/* Bar Chart Builder — draw and read bar charts (Unit 10.1).
 * Bars are dragged by their tops on an SVG grid and snap to whole units (on a scale in 2s
 * a bar can stop halfway between two gridlines). Every bar starts at 0. The chart is drawn
 * from the same numbers the answers are computed from, so what the child reads is exact.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;
  var ID = 'bar-chart-builder';

  var COLORS = ['#5aa9e6', '#7cc6a4', '#f7b267', '#f28482', '#b39ddb', '#4fc3c8', '#f2c14e'];

  /* ------------------------------------------------------------------ *
   * Contexts (everyday data sets)
   * ------------------------------------------------------------------ */
  function C(name, icon, p) {
    return { name: name, icon: icon, p: p || name };
  }
  var DAYS5 = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  var CTX = {
    pets: {
      title: 'Pets in the pet shop', cat: 'Type of pet', val: 'Number of pets', head: 'The pet shop has:',
      cats: [C('turtle', '🐢', 'turtles'), C('rabbit', '🐇', 'rabbits'), C('fish', '🐟', 'fish'), C('cat', '🐈', 'cats'), C('guinea pig', '🐹', 'guinea pigs')],
      line: function (c, v) { return v + ' ' + (v === 1 ? c.name : c.p); },
      qValue: function (c) { return 'How many ' + c.p + ' are in the shop?'; },
      qMore: function (a, b) { return 'How many more ' + a.p + ' than ' + b.p + ' are there?'; },
      qMost: 'Which pet does the shop have the most of?', qLeast: 'Which pet does the shop have the fewest of?',
      qTotal: 'How many pets are there altogether?',
    },
    fruit: {
      title: 'Favourite fruit in our class', cat: 'Fruit', val: 'Number of children', head: 'Children chose their favourite fruit:',
      cats: [C('apple', '🍎', 'apples'), C('banana', '🍌', 'bananas'), C('orange', '🍊', 'oranges'), C('grapes', '🍇', 'grapes'), C('pear', '🍐', 'pears')],
      qValue: function (c) { return 'How many children like ' + c.p + ' best?'; },
      qMore: function (a, b) { return 'How many more children like ' + a.p + ' than ' + b.p + '?'; },
      qMost: 'Which fruit is the most popular?', qLeast: 'Which fruit is the least popular?',
      qTotal: 'How many children chose a fruit altogether?',
    },
    sports: {
      title: 'Favourite sports', cat: 'Sport', val: 'Number of children', head: 'Children chose their favourite sport:',
      cats: [C('football', '⚽'), C('cricket', '🏏'), C('tennis', '🎾'), C('golf', '⛳'), C('swimming', '🏊')],
      qValue: function (c) { return 'How many children chose ' + c.p + '?'; },
      qMore: function (a, b) { return 'How many more children chose ' + a.p + ' than ' + b.p + '?'; },
      qMost: 'Which sport is the most popular?', qLeast: 'Which sport is the least popular?',
      qTotal: 'How many children voted altogether?',
    },
    travel: {
      title: 'How we travel to school', cat: 'Way of travelling', val: 'Number of children', head: 'How children in our class travel to school:',
      cats: [C('walk', '🚶', 'walk'), C('car', '🚗', 'come by car'), C('bus', '🚌', 'come by bus'), C('bike', '🚲', 'ride a bike'), C('scooter', '🛴', 'ride a scooter')],
      qValue: function (c) { return 'How many children ' + c.p + '?'; },
      qMore: function (a, b) { return 'How many more children ' + a.p + ' than ' + b.p + '?'; },
      qMost: 'Which way do the most children travel?', qLeast: 'Which way do the fewest children travel?',
      qTotal: 'How many children are there altogether?',
    },
    dice: {
      title: 'Dice scores', cat: 'Score on the dice', val: 'Number of times', head: 'Sam threw a dice. Each score came up:',
      cats: ['1', '2', '3', '4', '5', '6'].map(function (s, i) { return C(s, ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][i]); }),
      line: function (c, v) { return 'a ' + c.name + ': ' + v + (v === 1 ? ' time' : ' times'); },
      qValue: function (c) { return 'How many times did the dice land on ' + c.name + '?'; },
      qMore: function (a, b) { return 'How many more times did it land on ' + a.name + ' than on ' + b.name + '?'; },
      qMost: 'Which score came up the most times?', qLeast: 'Which score came up the fewest times?',
      qTotal: 'How many times was the dice thrown altogether?',
    },
    books: {
      title: 'Books read in our class', cat: 'Day', val: 'Number of books', head: 'Books our class read each day:',
      cats: DAYS5.map(function (d) { return C(d, '📚'); }),
      qValue: function (c) { return 'How many books were read on ' + c.name + '?'; },
      qMore: function (a, b) { return 'How many more books were read on ' + a.name + ' than on ' + b.name + '?'; },
      qMost: 'On which day were the most books read?', qLeast: 'On which day were the fewest books read?',
      qTotal: 'How many books were read altogether?',
    },
    trees: {
      title: 'Trees planted at school', cat: 'Week', val: 'Number of trees', head: 'Trees our school planted each week:',
      cats: [1, 2, 3, 4, 5].map(function (w) { return C('Week ' + w, '🌳'); }),
      qValue: function (c) { return 'How many trees were planted in ' + c.name + '?'; },
      qMore: function (a, b) { return 'How many more trees were planted in ' + a.name + ' than in ' + b.name + '?'; },
      qMost: 'In which week were the most trees planted?', qLeast: 'In which week were the fewest trees planted?',
      qTotal: 'How many trees were planted altogether?',
    },
    icecream: {
      title: 'Ice creams sold', cat: 'Flavour', val: 'Number of ice creams', head: 'Ice creams sold at the shop:',
      cats: [C('vanilla', '🍦'), C('chocolate', '🍫'), C('strawberry', '🍓'), C('lemon', '🍋'), C('mint', '🌿')],
      qValue: function (c) { return 'How many ' + c.p + ' ice creams were sold?'; },
      qMore: function (a, b) { return 'How many more ' + a.p + ' than ' + b.p + ' ice creams were sold?'; },
      qMost: 'Which flavour sold the most?', qLeast: 'Which flavour sold the fewest?',
      qTotal: 'How many ice creams were sold altogether?',
    },
    clouds: {
      title: 'Cloudy hours each day', cat: 'Day', val: 'Number of hours', head: 'Hours of cloud each day:',
      cats: DAYS5.concat(['Saturday', 'Sunday']).map(function (d) { return C(d, '☁️'); }),
      qValue: function (c) { return 'How many cloudy hours were there on ' + c.name + '?'; },
      qMore: function (a, b) { return 'How many more cloudy hours were there on ' + a.name + ' than on ' + b.name + '?'; },
      qMost: 'Which day had the most cloudy hours?', qLeast: 'Which day had the fewest cloudy hours?',
      qTotal: 'How many cloudy hours were there altogether?',
    },
  };
  Object.keys(CTX).forEach(function (k) {
    CTX[k].key = k;
  });
  function dataLine(ctx, c, v) {
    return ctx.line ? ctx.line(c, v) : c.name + ': ' + v;
  }

  /* ------------------------------------------------------------------ *
   * Number helpers
   * ------------------------------------------------------------------ */
  function distinct(n, lo, hi) {
    return U.shuffle(U.range(lo, hi)).slice(0, n);
  }
  function sum(a) {
    return a.reduce(function (s, v) { return s + v; }, 0);
  }
  function uniqueExtremes(vals) {
    var mx = Math.max.apply(null, vals);
    var mn = Math.min.apply(null, vals);
    return vals.filter(function (v) { return v === mx; }).length === 1 && vals.filter(function (v) { return v === mn; }).length === 1;
  }
  /** Values 1..hi for n bars with a single tallest and a single shortest bar. */
  function readVals(n, lo, hi) {
    for (;;) {
      var v = [];
      for (var i = 0; i < n; i++) v.push(U.rand(lo, hi));
      if (uniqueExtremes(v) && Math.max.apply(null, v) - Math.min.apply(null, v) >= 3) return v;
    }
  }
  /** Values for a scale in 2s (up to 18) with at least two odd values. */
  function twosVals(n) {
    for (;;) {
      var v = distinct(n, 2, 18);
      var odd = v.filter(function (x) { return x % 2; }).length;
      if (odd >= 2 && odd < n && Math.max.apply(null, v) >= 12) return v;
    }
  }
  function evenTop(v, lo) {
    var m = Math.max.apply(null, v);
    return Math.max(lo, m % 2 ? m + 1 : m);
  }

  /* ------------------------------------------------------------------ *
   * The chart (SVG): bars, scale, labels or label slots, drag, marks
   * ------------------------------------------------------------------ */
  function chart(o) {
    var horiz = !!o.horiz;
    var cats = o.cats;
    var n = cats.length;
    var step = o.step || 1;
    var max = o.max;
    var u = o.u || (step === 2 ? 17 : horiz ? 48 : 34);
    var vals = (o.vals || cats.map(function () { return 0; })).slice();
    var editable = o.editable ? (o.editable === true ? cats.map(function () { return true; }) : o.editable) : cats.map(function () { return false; });
    var locked = false;
    var T = 54;
    var L, W, H, CW, BW, RH, BH, PH, PW, base, endLine;
    if (!horiz) {
      L = 86;
      CW = n > 5 ? 84 : 94;
      BW = 54;
      PH = max * u;
      base = T + PH;
      endLine = L + n * CW;
      W = endLine + 22;
      H = base + (o.slots ? 100 : 88);
    } else {
      L = 150;
      RH = 42;
      BH = 28;
      PW = max * u;
      base = T + n * RH;
      endLine = L + PW;
      W = endLine + 36;
      H = base + 70;
    }
    function pos(v) {
      return horiz ? L + v * u : base - v * u;
    }
    function bandC(i) {
      return horiz ? T + i * RH + RH / 2 : L + i * CW + CW / 2;
    }
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'bc-chart' + (horiz ? ' bc-horiz' : ''), style: { maxWidth: '100%', height: 'auto' }, role: 'img', 'aria-label': 'Bar chart' });
    var gGrid = svg('g');
    var gNums = svg('g', { class: 'bc-nums' });
    var gBars = svg('g');
    var gMarks = svg('g', { class: 'bc-marks' });
    var gHits = svg('g');
    var gText = svg('g');
    root.appendChild(gGrid);
    root.appendChild(gBars);
    root.appendChild(gNums);
    root.appendChild(gText);
    root.appendChild(gMarks);
    root.appendChild(gHits);

    // gridlines
    for (var v = 0; v <= max; v += step) {
      if (horiz) gGrid.appendChild(svg('line', { x1: pos(v), y1: T - 4, x2: pos(v), y2: base, class: 'bc-gl' }));
      else gGrid.appendChild(svg('line', { x1: L, y1: pos(v), x2: endLine, y2: pos(v), class: 'bc-gl' }));
    }
    function drawNums(mult) {
      MQ.clear(gNums);
      if (!mult) return;
      for (var k = 0; k <= max; k += step) {
        var t = String(k * mult);
        if (horiz) gNums.appendChild(svg('text', { x: pos(k), y: base + 24, 'text-anchor': 'middle', class: 'bc-num' }, t));
        else gNums.appendChild(svg('text', { x: L - 10, y: pos(k) + 6, 'text-anchor': 'end', class: 'bc-num' }, t));
      }
    }
    drawNums(o.showNums === false ? 0 : 1);
    // axes
    if (horiz) {
      gGrid.appendChild(svg('line', { x1: L, y1: T - 8, x2: L, y2: base, class: 'bc-axis' }));
      gGrid.appendChild(svg('line', { x1: L, y1: base, x2: endLine + 16, y2: base, class: 'bc-axis' }));
    } else {
      gGrid.appendChild(svg('line', { x1: L, y1: T - 12, x2: L, y2: base, class: 'bc-axis' }));
      gGrid.appendChild(svg('line', { x1: L, y1: base, x2: endLine + 12, y2: base, class: 'bc-axis' }));
    }
    // category names
    cats.forEach(function (c, i) {
      if (horiz) {
        gText.appendChild(svg('text', { x: L - 10, y: bandC(i) + 6, 'text-anchor': 'end', class: 'bc-cat' }, c.name));
      } else {
        gText.appendChild(svg('text', { x: bandC(i), y: base + 27, 'text-anchor': 'middle', class: 'bc-icon' }, c.icon));
        gText.appendChild(svg('text', { x: bandC(i), y: base + 50, 'text-anchor': 'middle', class: 'bc-cat' }, c.name));
      }
    });

    // title and axis labels (fixed text or empty slots)
    var midX = horiz ? L + PW / 2 : L + (n * CW) / 2;
    var place = {
      title: { x: midX, y: 32, rot: false, w: 330 },
      cat: horiz ? { x: 22, y: T + (n * RH) / 2, rot: true, w: Math.min(250, n * RH + 30) } : { x: midX, y: base + 78, rot: false, w: 260 },
      val: horiz ? { x: midX, y: base + 56, rot: false, w: 260 } : { x: 22, y: T + PH / 2, rot: true, w: Math.min(260, PH + 20) },
    };
    var slots = {};
    var slotHandler = null;
    function textAt(p, txt, cls) {
      var t = svg('text', { x: p.x, y: p.y + 6, 'text-anchor': 'middle', class: cls }, txt);
      if (p.rot) t.setAttribute('transform', 'rotate(-90 ' + p.x + ' ' + p.y + ')');
      return t;
    }
    ['title', 'cat', 'val'].forEach(function (name) {
      var p = place[name];
      if (o.slots) {
        var g = svg('g', { class: 'bc-slot', 'data-bc-slot': name });
        var r = p.rot ? svg('rect', { x: p.x - 17, y: p.y - p.w / 2, width: 34, height: p.w, rx: 8 }) : svg('rect', { x: p.x - p.w / 2, y: p.y - 17, width: p.w, height: 34, rx: 8 });
        var hint = name === 'title' ? 'title' : 'axis label';
        var t = textAt(p, hint, 'bc-slot-text bc-slot-empty');
        g.appendChild(r);
        g.appendChild(t);
        g.addEventListener('click', function () {
          if (slotHandler) slotHandler(name);
        });
        gText.appendChild(g);
        slots[name] = { g: g, t: t, hint: hint };
      } else {
        var txt = o[name];
        if (txt) gText.appendChild(textAt(p, txt, name === 'title' ? 'bc-title' : 'bc-label'));
      }
    });

    // bars
    var bars = [];
    var guide = svg('line', { class: 'bc-guide', x1: 0, y1: 0, x2: 0, y2: 0, style: { display: 'none' } });
    var live = svg('g', { style: { display: 'none' } }, svg('rect', { width: 40, height: 28, rx: 8, class: 'bc-pill' }), svg('text', { class: 'bc-pill-text', 'text-anchor': 'middle' }, ''));
    gMarks.appendChild(guide);
    gMarks.appendChild(live);
    var active = -1;

    function drawBar(i) {
      var b = bars[i];
      var v = vals[i];
      if (horiz) {
        b.rect.setAttribute('width', Math.max(0, v * u));
        if (b.grip) b.grip.setAttribute('x', pos(v) - 5);
      } else {
        b.rect.setAttribute('y', pos(v));
        b.rect.setAttribute('height', Math.max(0, v * u));
        if (b.grip) b.grip.setAttribute('y', pos(v) - 5);
      }
    }
    function topPoint(i) {
      return horiz ? { x: pos(vals[i]), y: bandC(i) } : { x: bandC(i), y: pos(vals[i]) };
    }
    function setGuide(i) {
      var v = vals[i];
      guide.style.display = '';
      if (horiz) {
        guide.setAttribute('x1', pos(v));
        guide.setAttribute('x2', pos(v));
        guide.setAttribute('y1', bandC(i) + BH / 2);
        guide.setAttribute('y2', base);
      } else {
        guide.setAttribute('x1', bandC(i) - BW / 2);
        guide.setAttribute('x2', L);
        guide.setAttribute('y1', pos(v));
        guide.setAttribute('y2', pos(v));
      }
      if (o.liveNum) {
        live.style.display = '';
        movePill(live, v, String(v));
      }
    }
    function movePill(g, v, txt) {
      var r = g.firstChild;
      var t = g.lastChild;
      var w = txt.length > 1 ? 42 : 34;
      var cx = horiz ? pos(v) : L - 26;
      var cy = horiz ? base + 19 : pos(v);
      r.setAttribute('width', w);
      r.setAttribute('x', cx - w / 2);
      r.setAttribute('y', cy - 14);
      t.setAttribute('x', cx);
      t.setAttribute('y', cy + 6);
      t.textContent = txt;
    }

    cats.forEach(function (c, i) {
      var rect = horiz
        ? svg('rect', { x: L, y: bandC(i) - BH / 2, height: BH, width: 0, class: 'bc-bar', style: { fill: COLORS[i % COLORS.length] } })
        : svg('rect', { x: bandC(i) - BW / 2, y: base, width: BW, height: 0, class: 'bc-bar', style: { fill: COLORS[i % COLORS.length] } });
      gBars.appendChild(rect);
      var b = { rect: rect, grip: null, hit: null };
      bars.push(b);
      if (editable[i]) {
        b.grip = horiz ? svg('rect', { x: L - 5, y: bandC(i) - BH / 2 - 4, width: 10, height: BH + 8, rx: 4, class: 'bc-grip' }) : svg('rect', { x: bandC(i) - BW / 2 - 5, y: base - 5, width: BW + 10, height: 10, rx: 4, class: 'bc-grip' });
        gBars.appendChild(b.grip);
        b.hit = horiz ? svg('rect', { x: L - 6, y: bandC(i) - RH / 2 + 1, width: PW + 22, height: RH - 2, class: 'bc-hit' + ' bc-hit-h' }) : svg('rect', { x: bandC(i) - CW / 2 + 4, y: T - 16, width: CW - 8, height: PH + 22, class: 'bc-hit' });
        b.hit.setAttribute('data-bar', i);
        gHits.appendChild(b.hit);
      }
      drawBar(i);
    });

    var api = {
      svg: root,
      el: el('div', { class: 'bc-chartbox' }, root),
      vals: function () { return vals.slice(); },
      n: n,
      max: max,
      step: step,
      set: function (i, v) {
        vals[i] = U.clamp(Math.round(v), 0, max);
        drawBar(i);
        api.barState(i, null);
      },
      barState: function (i, kind) {
        bars[i].rect.classList.remove('bc-bad', 'bc-good');
        if (kind) bars[i].rect.classList.add('bc-' + kind);
      },
      lock: function () {
        locked = true;
        root.classList.add('bc-locked');
        guide.style.display = 'none';
        live.style.display = 'none';
      },
      isLocked: function () { return locked; },
      numbers: function (mult) { drawNums(mult); },
      onSlot: function (fn) { slotHandler = fn; },
      setSlot: function (name, txt) {
        var s = slots[name];
        s.t.textContent = txt || s.hint;
        s.t.setAttribute('class', 'bc-slot-text' + (txt ? '' : ' bc-slot-empty'));
        s.g.classList.toggle('bc-filled', !!txt);
        api.slotState(name, null);
      },
      slotState: function (name, kind) {
        var g = slots[name].g;
        g.classList.remove('bc-sgood', 'bc-sbad', 'bc-shot');
        if (kind) g.classList.add('bc-s' + kind);
      },
      clearMarks: function () {
        Array.prototype.slice.call(gMarks.childNodes).forEach(function (nd) {
          if (nd !== guide && nd !== live) gMarks.removeChild(nd);
        });
      },
      /** Dashed reading line from the end of bar i to the scale; label = show the value on the scale. */
      ruler: function (i, label, value) {
        var v = value == null ? vals[i] : value;
        var line = horiz
          ? svg('line', { x1: pos(v), x2: pos(v), y1: bandC(i) - BH / 2, y2: base, class: 'bc-ruler' })
          : svg('line', { x1: bandC(i) + BW / 2, x2: L, y1: pos(v), y2: pos(v), class: 'bc-ruler' });
        gMarks.appendChild(line);
        if (label) api.pill(v, String(v * (label === true ? 1 : label)));
        return line;
      },
      /** A highlighted number on the scale at value v (sits between labels for odd values on a 2s scale). */
      pill: function (v, txt, cls) {
        var g = svg('g', { class: 'bc-pillg' + (cls ? ' ' + cls : '') }, svg('rect', { width: 34, height: 28, rx: 8, class: 'bc-pill' }), svg('text', { class: 'bc-pill-text', 'text-anchor': 'middle' }, ''));
        movePill(g, v, txt == null ? String(v) : txt);
        gMarks.appendChild(g);
        return g;
      },
      /** A short tick on the axis at v (used to show the halfway point). */
      tick: function (v) {
        var t = horiz ? svg('line', { x1: pos(v), x2: pos(v), y1: base - 8, y2: base + 8, class: 'bc-tick' }) : svg('line', { x1: L - 8, x2: L + 8, y1: pos(v), y2: pos(v), class: 'bc-tick' });
        gMarks.appendChild(t);
        return t;
      },
      /** Number written at the end of bar i. */
      tag: function (i, txt) {
        var p = topPoint(i);
        var t = horiz ? svg('text', { x: p.x + 10, y: p.y + 6, class: 'bc-tag' }, txt) : svg('text', { x: p.x, y: p.y - 10, 'text-anchor': 'middle', class: 'bc-tag' }, txt);
        gMarks.appendChild(t);
        return t;
      },
      /** Shade the part of bar i between values a and b (the difference). */
      gap: function (i, a, b) {
        var r = horiz
          ? svg('rect', { x: pos(a), y: bandC(i) - BH / 2 - 3, width: (b - a) * u, height: BH + 6, class: 'bc-gap' })
          : svg('rect', { x: bandC(i) - BW / 2 - 3, y: pos(b), width: BW + 6, height: (b - a) * u, class: 'bc-gap' });
        gMarks.appendChild(r);
        return r;
      },
      /** Grow bar i to v one unit at a time. */
      animateTo: function (i, v, later, done) {
        var cur = vals[i];
        var dir = v > cur ? 1 : -1;
        function stepFn() {
          if (vals[i] === v) {
            if (done) done();
            return;
          }
          vals[i] += dir;
          drawBar(i);
          later(stepFn, 45);
        }
        stepFn();
      },
      hitFor: function (i) { return bars[i].hit; },
    };

    // dragging
    var unbinds = [];
    bars.forEach(function (b, i) {
      if (!b.hit) return;
      function fromPoint(p) {
        var raw = horiz ? (p.x - L) / u : (base - p.y) / u;
        var nv = U.clamp(Math.round(raw), 0, max);
        if (nv !== vals[i]) {
          vals[i] = nv;
          drawBar(i);
          api.barState(i, null);
          if (o.onChange) o.onChange(i, nv);
        }
        setGuide(i);
      }
      unbinds.push(
        MQ.ui.drag(root, b.hit, {
          start: function (p) {
            if (locked) return;
            active = i;
            root.classList.add('bc-dragging');
            fromPoint(p);
          },
          move: function (p) {
            if (locked || active !== i) return;
            fromPoint(p);
          },
          end: function () {
            if (active !== i) return;
            active = -1;
            root.classList.remove('bc-dragging');
            guide.style.display = 'none';
            live.style.display = 'none';
            if (o.onDrop) o.onDrop(i, vals[i]);
          },
        })
      );
      b.hit.style.cursor = horiz ? 'ew-resize' : 'ns-resize';
    });
    api.unbind = function () {
      unbinds.forEach(function (f) { f(); });
    };
    return api;
  }

  /* ------------------------------------------------------------------ *
   * Label tiles: drag (pointer events) or click a tile then a slot
   * ------------------------------------------------------------------ */
  function labeler(api, ch, tiles, opts) {
    opts = opts || {};
    var placed = {};
    var sel = null;
    var locked = false;
    var drag = null;
    var tileEls = {};
    var byId = {};
    var tray = el('div', { class: 'bc-tray' });
    tiles.forEach(function (t) {
      byId[t.id] = t;
      var b = el('button', { class: 'bc-tile', type: 'button', 'data-tile': t.id }, t.text);
      b.addEventListener('pointerdown', function (e) {
        if (locked || b.classList.contains('bc-used')) return;
        e.preventDefault();
        drag = { id: t.id, x: e.clientX, y: e.clientY, ghost: null };
      });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          select(t.id);
        }
      });
      tileEls[t.id] = b;
      tray.appendChild(b);
    });
    function select(id) {
      if (locked) return;
      sel = sel === id ? null : id;
      Object.keys(tileEls).forEach(function (k) {
        tileEls[k].classList.toggle('bc-sel', k === sel);
      });
      if (sel && opts.onSelect) opts.onSelect();
    }
    function slotUnder(x, y) {
      var t = document.elementFromPoint(x, y);
      var s = t && t.closest ? t.closest('[data-bc-slot]') : null;
      return s ? s.getAttribute('data-bc-slot') : null;
    }
    var hot = null;
    function setHot(name) {
      if (hot === name) return;
      if (hot && !placedState[hot]) ch.slotState(hot, null);
      hot = name;
      if (hot) ch.slotState(hot, 'hot');
    }
    var placedState = {};
    function onMove(e) {
      if (!drag) return;
      if (!drag.ghost) {
        if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 6) return;
        drag.ghost = el('div', { class: 'bc-tile bc-ghost' }, byId[drag.id].text);
        document.body.appendChild(drag.ghost);
        tileEls[drag.id].classList.add('bc-lift');
      }
      drag.ghost.style.left = e.clientX + 'px';
      drag.ghost.style.top = e.clientY + 'px';
      setHot(slotUnder(e.clientX, e.clientY));
    }
    function onUp(e) {
      if (!drag) return;
      var d = drag;
      drag = null;
      if (d.ghost) {
        d.ghost.parentNode && d.ghost.parentNode.removeChild(d.ghost);
        tileEls[d.id].classList.remove('bc-lift');
        setHot(null);
        var s = slotUnder(e.clientX, e.clientY);
        if (s) tryPlace(s, d.id);
      } else {
        select(d.id);
      }
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    api.cleanup(function () {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (drag && drag.ghost && drag.ghost.parentNode) drag.ghost.parentNode.removeChild(drag.ghost);
      drag = null;
    });
    ch.onSlot(function (name) {
      if (locked) return;
      if (sel) tryPlace(name, sel);
      else if (placed[name]) unplace(name);
    });
    function unplace(name) {
      var id = placed[name];
      if (!id) return;
      delete placed[name];
      placedState[name] = false;
      tileEls[id].classList.remove('bc-used');
      ch.setSlot(name, null);
      if (opts.onChange) opts.onChange();
    }
    function tryPlace(name, id) {
      if (opts.accept && !opts.accept(name, id)) {
        select(null);
        sel = null;
        Object.keys(tileEls).forEach(function (k) { tileEls[k].classList.remove('bc-sel'); });
        return;
      }
      place(name, id);
    }
    function place(name, id) {
      Object.keys(placed).forEach(function (s) {
        if (placed[s] === id) unplace(s);
      });
      if (placed[name]) unplace(name);
      placed[name] = id;
      placedState[name] = true;
      tileEls[id].classList.add('bc-used');
      tileEls[id].classList.remove('bc-sel');
      sel = null;
      ch.setSlot(name, byId[id].text);
      api.sound('pop');
      if (opts.onChange) opts.onChange();
    }
    return {
      el: tray,
      placed: function () { return Object.assign({}, placed); },
      place: place,
      lock: function () {
        locked = true;
        sel = null;
        tray.classList.add('bc-tray-locked');
        Object.keys(tileEls).forEach(function (k) { tileEls[k].disabled = true; tileEls[k].classList.remove('bc-sel'); });
      },
    };
  }

  /* ------------------------------------------------------------------ *
   * Small visual helpers
   * ------------------------------------------------------------------ */
  function row(chartEl, side) {
    return el('div', { class: 'bc-row' }, chartEl, el('div', { class: 'bc-side' }, side));
  }
  function dataCard(ctx, cats, vals, clues) {
    var list = el('ul', { class: 'bc-data' });
    cats.forEach(function (c, i) {
      list.appendChild(el('li', null, el('span', { class: 'bc-data-ic' }, c.icon), el('span', { html: clues ? clues[i] : dataLine(ctx, c, vals[i]) })));
    });
    return el('div', { class: 'bc-card' }, el('div', { class: 'bc-card-head' }, ctx.head), list);
  }
  /** Skip-count strip for a scale in 2s: 0 → 2 → 4 … with the jumps shown. */
  function skipStrip(top, mark) {
    var s = el('div', { class: 'bc-skip' });
    for (var v = 0; v <= top; v += 2) {
      if (v) s.appendChild(el('span', { class: 'bc-jump' }, '+2'));
      s.appendChild(el('span', { class: 'bc-skipn' + (v === mark ? ' bc-on' : '') }, String(v)));
    }
    return s;
  }
  /** "6 · 7 · 8": the halfway number between two gridlines. */
  function halfStrip(v, showMid) {
    return el(
      'div',
      { class: 'bc-half' },
      el('span', { class: 'bc-halfn' }, String(v - 1)),
      el('span', { class: 'bc-halfm' + (showMid ? ' bc-on' : '') }, showMid ? String(v) : '?'),
      el('span', { class: 'bc-halfn' }, String(v + 1)),
      el('span', { class: 'bc-halfcap' }, 'halfway')
    );
  }
  function checkButton(label, fn) {
    var b = el('button', { class: 'btn bc-check', type: 'button' }, label || 'Check my chart');
    b.addEventListener('click', function () {
      if (!b.disabled) fn();
    });
    return b;
  }
  function info() {
    return el('div', { class: 'bc-info' });
  }
  function setInfo(box) {
    MQ.clear(box);
    for (var i = 1; i < arguments.length; i++) if (arguments[i]) box.appendChild(arguments[i]);
  }
  function txt(html, cls) {
    return el('div', { class: cls || 'bc-note', html: html });
  }

  /* ------------------------------------------------------------------ *
   * Checking built bars
   * ------------------------------------------------------------------ */
  function barTag(v, t, step) {
    if (v === 0 && t > 0) return 'Left a bar at 0';
    if (step === 2 && v === 2 * t) return 'Counted gridlines not the scale';
    if (step === 2 && t % 2 === 1 && Math.abs(v - t) === 1) return 'Misread a bar between two marks';
    if (v === t + 1) return 'Bar started at 1 not 0';
    return 'Bar drawn to the wrong height';
  }
  var TAG_ORDER = ['Did not spot a wrong bar', 'Counted gridlines not the scale', 'Bar started at 1 not 0', 'Misread a bar between two marks', 'Bar drawn to the wrong height', 'Left a bar at 0'];

  /** Wire a "build these bars" question: Check button, hints, reveal, test hook. */
  function buildQuestion(stage, api, q, ch, side, extra) {
    extra = extra || {};
    var box = info();
    var btn = checkButton(extra.button, check);
    side.appendChild(btn);
    side.appendChild(box);
    var horizWord = 'up';
    var lastSig = null;
    function check() {
      if (api.isAnswered()) return;
      var vals = ch.vals();
      var sig = vals.join(',');
      if (sig === (q.start ? q.start.join(',') : q.vals.map(function () { return 0; }).join(','))) {
        api.feedback(q.start ? 'First drag the bars that do not match the data.' : 'First drag the top of each bar up to its number.', 'try');
        return;
      }
      if (sig === lastSig) {
        api.feedback('Move a bar first, then check again.', 'try');
        return;
      }
      lastSig = sig;
      var wrong = [];
      vals.forEach(function (v, i) {
        if (v !== q.vals[i]) wrong.push(i);
      });
      ch.clearMarks();
      if (!wrong.length) {
        ch.lock();
        btn.disabled = true;
        vals.forEach(function (v, i) {
          ch.barState(i, 'good');
          ch.tag(i, String(v));
        });
        setInfo(box);
        api.check(true, extra.praise || 'Every bar stops at the right number!');
        return;
      }
      var tags = wrong.map(function (i) { return q.start && vals[i] === q.start[i] ? 'Did not spot a wrong bar' : barTag(vals[i], q.vals[i], q.step); });
      var tag = TAG_ORDER.filter(function (t) { return tags.indexOf(t) !== -1; })[0];
      var first = wrong[tags.indexOf(tag)];
      wrong.forEach(function (i) { ch.barState(i, 'bad'); });
      var c = q.cats[first];
      var t = q.vals[first];
      var more = wrong.length > 1 ? ' ' + wrong.length + ' bars need fixing (the orange ones).' : '';
      var hint;
      if (api.tries() === 0) {
        if (tag === 'Did not spot a wrong bar') hint = 'The ' + c.name + ' bar still does not match the data. The data says ' + t + '. Find ' + t + ' on the scale.';
        else if (tag === 'Counted gridlines not the scale') hint = 'Look at the numbers on the scale: each line is worth 2, not 1. Find ' + t + ' on the scale.';
        else if (tag === 'Misread a bar between two marks') hint = t + ' is not on a line. It is halfway between ' + (t - 1) + ' and ' + (t + 1) + '.';
        else if (tag === 'Bar started at 1 not 0') hint = 'Every bar starts at 0. Make the ' + c.name + ' bar stop at ' + t + ' on the scale.';
        else if (tag === 'Left a bar at 0') hint = 'The ' + c.name + ' bar is still at 0. Drag its top ' + horizWord + ' to ' + t + '.';
        else if (extra.clueHint && extra.clueHint[first]) hint = extra.clueHint[first];
        else hint = 'Check the ' + c.name + ' bar. Find ' + t + ' on the scale and make the top of the bar line up with it.';
        hint += more;
        if (q.step === 2) setInfo(box, txt('The scale counts in 2s:'), skipStrip(q.max), t % 2 ? halfStrip(t, false) : null);
      } else {
        ch.pill(t, String(t), 'bc-pill-hint');
        if (q.step === 2 && t % 2) ch.tick(t);
        ch.ruler(first, false, t);
        hint = 'Look at the dashed line: that is ' + t + ' for ' + c.name + '. Drag the top of the orange bar to it.' + more;
        if (q.step === 2 && t % 2) setInfo(box, txt('Halfway between ' + (t - 1) + ' and ' + (t + 1) + ' is ' + t + '.'), halfStrip(t, true));
      }
      api.check(false, hint, tag);
    }
    api.onReveal(function () {
      ch.lock();
      btn.disabled = true;
      ch.clearMarks();
      var i = 0;
      function nextBar() {
        if (i >= q.vals.length) return;
        var k = i++;
        ch.animateTo(k, q.vals[k], api.later, function () {
          ch.barState(k, 'good');
          ch.ruler(k, true);
          api.later(nextBar, 250);
        });
      }
      nextBar();
      var work = extra.revealText || 'Each bar starts at 0 and stops at its number on the scale.';
      setInfo(box, txt(work), q.step === 2 ? skipStrip(q.max) : null);
      api.feedback(work.replace(/&nbsp;/g, ' '), 'info');
    });
    MQ.__test = {
      solve: function () {
        q.vals.forEach(function (v, i) { ch.set(i, v); });
        btn.click();
      },
      wrong: function () {
        q.vals.forEach(function (v, i) { ch.set(i, v); });
        var k = wrongN++ % q.vals.length;
        ch.set(k, q.vals[k] + 1 <= q.max ? q.vals[k] + 1 : q.vals[k] - 1);
        btn.click();
      },
    };
    return { check: check, button: btn };
  }

  /* ------------------------------------------------------------------ *
   * Checking labels (title + two axis labels), with an optional scale choice
   * ------------------------------------------------------------------ */
  function labelTiles(ctx, other) {
    var tiles = [
      { id: 'title', text: ctx.title },
      { id: 'cat', text: ctx.cat },
      { id: 'val', text: ctx.val },
    ];
    if (other) tiles.push({ id: 'x', text: other.title });
    return U.shuffle(tiles);
  }
  function labelVerdict(placed) {
    var missing = ['title', 'cat', 'val'].filter(function (s) { return !placed[s]; });
    var wrong = ['title', 'cat', 'val'].filter(function (s) { return placed[s] && placed[s] !== s; });
    return { missing: missing, wrong: wrong };
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  var deck = null;
  var wrongN = 0; // varies the test hook's wrong answers so repeats still count

  function pickCats(ctx, n) {
    return ctx.cats.slice(0, n);
  }

  function readQ(kind, ctxKey, opts) {
    opts = opts || {};
    var ctx = CTX[ctxKey];
    var n = ctx.cats.length > 5 ? ctx.cats.length : 5;
    if (ctxKey === 'clouds') n = 7;
    var cats = pickCats(ctx, n);
    var vals = opts.vals || readVals(n, 1, opts.hi || 7);
    var q = { type: 'read', kind: kind, ctx: ctxKey, cats: cats, vals: vals, step: opts.step || 1, max: opts.max || 8, horiz: !!opts.horiz };
    if (kind === 'value') {
      var idxs = U.range(0, n - 1);
      if (opts.oddOnly) idxs = idxs.filter(function (i) { return vals[i] % 2; });
      q.a = U.pick(idxs);
      q.answer = vals[q.a];
    } else if (kind === 'more') {
      var pairs = [];
      for (var a = 0; a < n; a++) for (var b = 0; b < n; b++) if (vals[a] - vals[b] >= 2) pairs.push([a, b]);
      var pr = U.pick(pairs);
      q.a = pr[0];
      q.b = pr[1];
      q.answer = vals[q.a] - vals[q.b];
    } else if (kind === 'total') {
      q.answer = sum(vals);
    } else {
      var target = kind === 'most' ? Math.max.apply(null, vals) : Math.min.apply(null, vals);
      q.a = vals.indexOf(target);
      q.answer = q.a;
    }
    return q;
  }

  var WHICH = [
    {
      data: 'Books read by four children: 17, 12, 15 and 9.',
      good: 'A bar chart: with numbers as big as 17, drawing every picture takes too long. A bar is quicker.',
      bad: ['A pictogram: bar charts cannot show numbers bigger than 10.', 'A bar chart: bar charts do not need a title.'],
    },
    {
      data: 'Laps run by five children: 18, 16, 11, 15 and 17.',
      good: 'A bar chart with a scale in 2s: the bars are quick to draw and easy to compare.',
      bad: ['A pictogram: a pictogram never needs a key.', 'A bar chart: the bars can start at any number.'],
    },
    {
      data: 'Ali has 2 dogs, 3 cats and 1 rabbit. He wants to draw a little picture of each pet.',
      good: 'A pictogram: the numbers are small and each pet is easy to draw.',
      bad: ['A bar chart: small numbers cannot go on a pictogram.', 'A pictogram: it does not need a title.'],
    },
    {
      data: 'A poster for the youngest class, who are still learning their numbers: 4 apples, 2 pears, 3 bananas.',
      good: 'A pictogram: the children can count the pictures, one picture for each fruit.',
      bad: ['A bar chart: young children read scales best.', 'A pictogram: the pictures can be any size.'],
    },
  ];

  function buildDeck() {
    var q = [];
    // Level 1: build the pet shop chart, label it, build another chart
    var petVals = Math.random() < 0.3 ? [1, 3, 6, 8, 9] : distinct(5, 1, 9);
    q.push({ type: 'build', ctx: 'pets', cats: CTX.pets.cats, vals: petVals, step: 1, max: 9 });
    q.push({ type: 'label', ctx: 'pets', cats: CTX.pets.cats, vals: petVals, step: 1, max: 9, other: U.pick(['sports', 'fruit', 'dice']) });
    var used = ['pets'];
    var bctx = U.pick(['fruit', 'sports', 'travel', 'books', 'trees']);
    used.push(bctx);
    var bn = U.pick([4, 5]);
    q.push({ type: 'build', ctx: bctx, cats: CTX[bctx].cats.slice(0, bn), vals: distinct(bn, 1, 9), step: 1, max: 9 });
    // Level 2: read a chart, scale of 1, values up to 7
    var rctx = U.shuffle(['dice', 'fruit', 'sports', 'travel', 'books'].filter(function (k) { return used.indexOf(k) === -1; }));
    if (rctx.indexOf('dice') > 2) rctx[U.rand(0, 2)] = 'dice';
    rctx = rctx.slice(0, 3);
    var kinds = [U.pick(['value', 'most', 'least']), 'more', 'total'];
    rctx.forEach(function (k, i) {
      var opts = {};
      if (k === 'dice' && kinds[i] === 'total' && Math.random() < 0.5) opts.vals = [2, 6, 1, 3, 5, 3];
      var rq = readQ(kinds[i], k, opts);
      if (rq.kind === 'total') {
        // keep totals friendly for adding (no more than 25)
        while (rq.answer > 25) rq = readQ('total', k, opts);
      }
      q.push(rq);
    });
    used = used.concat(rctx);
    // Level 3: three different harder items, at least one on a scale in 2s
    var twos = ['build2', 'read2', 'clues'];
    var others = ['horiz', 'fix', 'bare', 'which'];
    var first = U.pick(twos);
    var rest = U.shuffle(twos.filter(function (t) { return t !== first; }).concat(others)).slice(0, 2);
    U.shuffle([first].concat(rest)).forEach(function (t) {
      q.push(level3(t, used));
    });
    return q;
  }

  function freeCtx(list, used) {
    var free = list.filter(function (k) { return used.indexOf(k) === -1; });
    var k = U.pick(free.length ? free : list);
    used.push(k);
    return k;
  }

  function level3(t, used) {
    if (t === 'build2') {
      var k = freeCtx(['trees', 'books', 'sports', 'fruit', 'travel'], used);
      return { type: 'build', ctx: k, cats: CTX[k].cats.slice(0, 5), vals: twosVals(5), step: 2, max: 18, l3: 'build2' };
    }
    if (t === 'read2') {
      var k2 = freeCtx(['trees', 'books', 'sports', 'fruit'], used);
      var v2 = twosVals(5);
      var rq = readQ('value', k2, { vals: v2, oddOnly: true, step: 2, max: evenTop(v2, 12) });
      rq.l3 = 'read2';
      return rq;
    }
    if (t === 'clues') {
      used.push('icecream');
      var V = U.pick([8, 10, 12, 14]);
      var S, Lm;
      do {
        S = U.rand(3, 8);
        Lm = U.rand(5, 11);
      } while (S + Lm > 18 || S + Lm < 11 || S === Lm);
      var vals = [V, V + 3, S, Lm, S + Lm];
      var cats = CTX.icecream.cats;
      var clues = [
        '<b>vanilla</b>: ' + V,
        '<b>chocolate</b>: 3 more than vanilla',
        '<b>strawberry</b>: ' + S,
        '<b>lemon</b>: ' + Lm,
        '<b>mint</b>: strawberry and lemon added together',
      ];
      return { type: 'build', ctx: 'icecream', cats: cats, vals: vals, step: 2, max: 18, clues: clues, l3: 'clues' };
    }
    if (t === 'horiz') {
      var kind = U.pick(['value', 'more', 'most', 'total']);
      var hctx = 'clouds';
      var hv = readVals(7, 1, 6);
      if (kind === 'total') while (sum(hv) > 26) hv = readVals(7, 1, 6);
      var hq = readQ(kind, hctx, { vals: hv, horiz: true, max: 7 });
      hq.l3 = 'horiz';
      return hq;
    }
    if (t === 'fix') {
      var fk = freeCtx(['sports', 'travel', 'fruit', 'books'], used);
      var fv = distinct(4, 1, 7);
      var shown = fv.slice();
      U.shuffle([0, 1, 2, 3]).slice(0, 2).forEach(function (i) {
        var opts = [fv[i] + 1, fv[i] - 1, fv[i] + 2, fv[i] - 2].filter(function (x) { return x >= 1 && x <= 8 && x !== fv[i]; });
        shown[i] = U.pick(opts);
      });
      return { type: 'build', ctx: fk, cats: CTX[fk].cats.slice(0, 4), vals: fv, start: shown, step: 1, max: 8, l3: 'fix' };
    }
    if (t === 'bare') {
      var bk = freeCtx(['trees', 'books', 'sports', 'travel'], used);
      var bv;
      do {
        bv = distinct(5, 1, 8).map(function (x) { return x * 2; });
      } while (Math.max.apply(null, bv) < 12);
      return { type: 'bare', ctx: bk, cats: CTX[bk].cats.slice(0, 5), vals: bv, lines: Math.max.apply(null, bv) / 2 + 1, other: freeCtx(['dice', 'pets', 'icecream'], used.slice()) };
    }
    var w = U.pick(WHICH);
    return { type: 'which', w: w, opts: U.shuffle([{ text: w.good, ok: true }].concat(w.bad.map(function (b) { return { text: b, ok: false }; }))) };
  }

  /* ------------------------------------------------------------------ *
   * Practice renderers
   * ------------------------------------------------------------------ */
  function renderBuild(stage, api, q) {
    var ctx = CTX[q.ctx];
    var isFix = q.l3 === 'fix';
    if (isFix) {
      api.say('Some bars do not match the table. Find them and fix them!', 'think');
      stage.appendChild(MQ.ui.prompt('Fix the <b>wrong bars</b> so the chart matches the data.'));
    } else if (q.clues) {
      api.say('Work out chocolate and mint first. The scale goes up in 2s!', 'think');
      stage.appendChild(MQ.ui.prompt('Use the clues to draw every bar. The scale counts in <b>2s</b>.'));
    } else if (q.step === 2) {
      api.say('This scale goes up in 2s. Odd numbers stop halfway between two lines.', 'think');
      stage.appendChild(MQ.ui.prompt('Drag each bar to its number. The scale counts in <b>2s</b>.'));
    } else {
      api.say('Drag the top of each bar up to its number. Every bar starts at 0.', 'think');
      stage.appendChild(MQ.ui.prompt('Draw the bar chart: drag each bar up to its number.'));
    }
    var ch = chart({ cats: q.cats, vals: q.start || null, step: q.step, max: q.max, editable: true, title: ctx.title, cat: ctx.cat, val: ctx.val });
    api.cleanup(ch.unbind);
    var side = el('div', { class: 'bc-sidein' });
    side.appendChild(dataCard(ctx, q.cats, q.vals, q.clues));
    stage.appendChild(row(ch.el, side));
    var extra = {};
    if (q.clues) {
      extra.clueHint = { 1: 'Chocolate is 3 more than vanilla. Count on 3 from ' + q.vals[0] + '.', 4: 'Mint is strawberry and lemon added together: ' + q.vals[2] + ' + ' + q.vals[3] + '.' };
      extra.revealText = 'chocolate = ' + q.vals[0] + ' + 3 = ' + q.vals[1] + ' &nbsp;·&nbsp; mint = ' + q.vals[2] + ' + ' + q.vals[3] + ' = ' + q.vals[4];
    }
    if (isFix) extra.button = 'Check the bars';
    var bq = buildQuestion(stage, api, q, ch, side, extra);
    if (q.clues) {
      // after the 2nd wrong try, show the two clue sums as chips
      var cluesBox = info();
      side.insertBefore(cluesBox, bq.button);
      bq.button.addEventListener('click', function () {
        if (api.isAnswered() || api.tries() < 2) return;
        setInfo(cluesBox, el('div', { class: 'bc-clue-sum' }, txt('chocolate:'), MQ.ui.sum([q.vals[0], 3], q.vals[1])), el('div', { class: 'bc-clue-sum' }, txt('mint:'), MQ.ui.sum([q.vals[2], q.vals[3]], q.vals[4])));
      });
    }
  }

  function renderLabel(stage, api, q) {
    var ctx = CTX[q.ctx];
    var lastSig = null;
    api.say('Finish the chart. Drag the title and the two axis labels into place.', 'think');
    stage.appendChild(MQ.ui.prompt('Add a <b>title</b> and label <b>both axes</b>.'));
    var ch = chart({ cats: q.cats, vals: q.vals, step: q.step, max: q.max, slots: true });
    var side = el('div', { class: 'bc-sidein' });
    var lab = labeler(api, ch, labelTiles(ctx, CTX[q.other]));
    side.appendChild(txt('Drag a card onto a dashed box (or click a card, then a box).'));
    side.appendChild(lab.el);
    var box = info();
    var btn = checkButton('Check my labels', check);
    side.appendChild(btn);
    side.appendChild(box);
    stage.appendChild(row(ch.el, side));
    function check() {
      if (api.isAnswered()) return;
      var p = lab.placed();
      var sig = JSON.stringify(p) + (typeof scale === 'undefined' ? '' : scale);
      if (!Object.keys(p).length && !(typeof scale !== 'undefined' && scale)) {
        api.feedback('First drag the cards into the dashed boxes.', 'try');
        return;
      }
      if (sig === lastSig) {
        api.feedback('Change something first, then check again.', 'try');
        return;
      }
      lastSig = sig;
      var vd = labelVerdict(p);
      ['title', 'cat', 'val'].forEach(function (s) {
        if (p[s]) ch.slotState(s, p[s] === s ? 'good' : 'bad');
      });
      if (!vd.missing.length && !vd.wrong.length) {
        lab.lock();
        btn.disabled = true;
        api.check(true, 'Now anyone can read your chart!');
        return;
      }
      var hint;
      var tag;
      if (vd.wrong.length) {
        var swapped = p.cat === 'val' && p.val === 'cat';
        var usedOther = Object.keys(p).some(function (s) { return p[s] === 'x'; });
        if (swapped) {
          tag = 'Mixed up the two axis labels';
          hint = 'The axis under the bars shows the groups. The axis with the numbers shows how many.';
        } else if (usedOther) {
          tag = 'Used a label that does not fit the data';
          hint = 'One card is about something else. Which cards are about ' + ctx.cats[0].p + ' and ' + ctx.cats[1].p + '?';
        } else {
          tag = 'Missing title or axis label';
          hint = 'The title says what the whole chart is about. The axis labels say what each axis shows.';
        }
      } else {
        tag = 'Missing title or axis label';
        hint = 'A bar chart needs a title and a label on both axes. ' + (vd.missing.length === 1 ? 'One box' : vd.missing.length + ' boxes') + ' are still empty.';
      }
      if (api.tries() >= 1) hint += ' The numbers go up the side, so that side is “' + ctx.val + '”.';
      api.check(false, hint, tag);
    }
    api.onReveal(function () {
      ['title', 'cat', 'val'].forEach(function (s) {
        lab.place(s, s);
        ch.slotState(s, 'good');
      });
      lab.lock();
      btn.disabled = true;
      setInfo(box, txt('<b>Title</b>: what the chart is about.<br><b>Along the bottom</b>: the groups.<br><b>Up the side</b>: how many.'));
      api.feedback('Title: what the chart is about. Along the bottom: the groups (' + ctx.cat + '). Up the side: how many (' + ctx.val + ').', 'info');
    });
    MQ.__test = {
      solve: function () {
        ['title', 'cat', 'val'].forEach(function (s) { lab.place(s, s); });
        btn.click();
      },
      wrong: function () {
        var a = wrongN++ % 2 ? ['cat', 'title', 'val'] : ['title', 'val', 'cat'];
        ['title', 'cat', 'val'].forEach(function (s, i) { lab.place(s, a[i]); });
        btn.click();
      },
    };
  }

  function readTag(q, ans) {
    var v = q.vals;
    if (q.kind === 'more') {
      if (ans === v[q.a] + v[q.b]) return "Answered 'altogether' for 'how many more'";
      if (ans === v[q.a] || ans === v[q.b]) return 'Read one bar instead of finding the difference';
      return 'Worked out the difference wrongly';
    }
    if (q.kind === 'total') {
      for (var i = 0; i < v.length; i++) if (ans === q.answer - v[i]) return 'Missed a bar when adding';
      return 'Added the bars wrongly';
    }
    var t = q.answer;
    if (q.step === 2 && (ans * 2 === t || ans * 2 === t - 1 || ans * 2 === t + 1)) return 'Counted gridlines not the scale';
    if (q.step === 2 && t % 2 && Math.abs(ans - t) === 1) return 'Misread a bar between two marks';
    if (ans === t - 1) return 'Bar started at 1 not 0';
    if (v.indexOf(ans) !== -1) return 'Read the wrong bar';
    return 'Misread the scale';
  }

  function renderRead(stage, api, q) {
    var ctx = CTX[q.ctx];
    var ch = chart({ cats: q.cats, vals: q.vals, step: q.step, max: q.max, horiz: q.horiz, title: ctx.title, cat: ctx.cat, val: ctx.val });
    var side = el('div', { class: 'bc-sidein' });
    var box = info();
    var word = q.horiz ? 'longest' : 'tallest';
    var wordS = q.horiz ? 'shortest' : 'shortest';
    var qText;
    if (q.kind === 'value') qText = ctx.qValue(q.cats[q.a]);
    else if (q.kind === 'more') qText = ctx.qMore(q.cats[q.a], q.cats[q.b]);
    else if (q.kind === 'total') qText = ctx.qTotal;
    else qText = q.kind === 'most' ? ctx.qMost : ctx.qLeast;
    stage.appendChild(MQ.ui.prompt(qText));
    if (q.step === 2) api.say('Careful: this scale goes up in 2s!', 'think');
    else if (q.horiz) api.say('This bar chart lies on its side. Read the scale along the bottom.', 'think');
    else api.say(q.kind === 'more' ? 'How many more? Find the difference between two bars.' : 'Follow the top of each bar across to the scale.', 'think');
    stage.appendChild(row(ch.el, side));

    if (q.kind === 'most' || q.kind === 'least') {
      var correctName = q.cats[q.a].name;
      var lastPick = null;
      var chs = MQ.ui.choices(q.cats.map(function (c) { return { label: c.icon + ' ' + c.name, value: c.name }; }), function (v) {
        if (api.isAnswered()) return;
        var i = q.cats.map(function (c) { return c.name; }).indexOf(v);
        if (i === q.a) {
          chs.mark(v, 'good');
          chs.disable();
          ch.barState(i, 'good');
          ch.ruler(i, true);
          api.check(true, q.cats[i].name + ' has the ' + (q.kind === 'most' ? word : wordS) + ' bar: ' + q.vals[i] + '.');
          return;
        }
        if (v === lastPick) {
          api.feedback('You tried that one. Pick a different bar.', 'try');
          return;
        }
        lastPick = v;
        chs.mark(v, 'bad');
        var other = q.kind === 'most' ? Math.min.apply(null, q.vals) : Math.max.apply(null, q.vals);
        var tag = q.vals[i] === other ? 'Mixed up most and least' : 'Did not compare all the bars';
        var hint = q.kind === 'most' ? 'The most means the ' + word + ' bar. Look at every bar.' : 'The fewest means the ' + wordS + ' bar. Look at every bar.';
        if (api.tries() >= 1) {
          ch.clearMarks();
          q.cats.forEach(function (c, k) { ch.ruler(k, false); });
          hint += ' Follow the dashed lines: which one is ' + (q.kind === 'most' ? 'highest on the scale' : 'lowest on the scale') + '?';
        }
        api.check(false, hint, tag);
      }, { columns: q.cats.length > 5 ? 2 : 1 });
      chs.classList.add('bc-choices');
      side.appendChild(chs);
      side.appendChild(box);
      api.onReveal(function () {
        chs.mark(correctName, 'good');
        chs.disable();
        ch.clearMarks();
        ch.barState(q.a, 'good');
        ch.ruler(q.a, true);
        var work = 'The ' + (q.kind === 'most' ? word : wordS) + ' bar is ' + correctName + ': ' + q.vals[q.a] + '.';
        setInfo(box, txt(work));
        api.feedback(work, 'info');
      });
      MQ.__test = {
        solve: function () { chs.buttons[q.a].click(); },
        wrong: function () { chs.buttons[(q.a + 1 + (wrongN++ % (q.cats.length - 1))) % q.cats.length].click(); },
      };
      return;
    }

    var lastAns = null;
    var ni = MQ.ui.numberInput({
      onSubmit: function (ans) {
        if (api.isAnswered()) return;
        if (U.same(ans, q.answer)) {
          ni.good();
          ni.disable();
          ch.clearMarks();
          showWorking(false);
          api.check(true);
          return;
        }
        if (ans === lastAns) {
          api.feedback('That is the same answer. Look at the dashed lines and try a different number.', 'try');
          return;
        }
        lastAns = ans;
        ni.bad();
        var tag = readTag(q, ans);
        api.check(false, hintFor(ans, tag), tag);
      },
    });
    side.appendChild(ni.el);
    side.appendChild(box);
    ni.focus();

    function hintFor(ans, tag) {
      var strong = api.tries() >= 1;
      ch.clearMarks();
      var c = q.cats[q.a];
      if (q.kind === 'value') {
        ch.ruler(q.a, false);
        var t = q.answer;
        if (q.step === 2 && t % 2) {
          ch.tick(t);
          setInfo(box, txt('The scale counts in 2s:'), skipStrip(q.max), strong ? halfStrip(t, false) : null);
          if (tag === 'Counted gridlines not the scale') return 'You counted the lines. Each line is worth 2! Follow the dashed line to the numbers on the scale.';
          return strong ? 'The bar stops between ' + (t - 1) + ' and ' + (t + 1) + '. What number is halfway?' : 'Follow the dashed line to the scale. It stops between two numbers.';
        }
        if (tag === 'Bar started at 1 not 0') return 'Bars start at 0, not 1. Follow the dashed line to the scale and read the number there.';
        return strong ? 'Put your finger on the end of the ' + c.name + ' bar and slide it along the dashed line to the scale.' : 'Find the ' + c.name + ' bar. Follow the dashed line across to the scale.';
      }
      if (q.kind === 'more') {
        ch.ruler(q.a, strong);
        ch.ruler(q.b, strong);
        var b = q.cats[q.b];
        var h = tag === "Answered 'altogether' for 'how many more'" ? '“How many more” is not “altogether”. Find the difference: how much longer is one bar than the other?' : 'Read both bars, then take the smaller number from the bigger one.';
        if (strong) {
          ch.gap(q.a, q.vals[q.b], q.vals[q.a]);
          h = c.name + ' is ' + q.vals[q.a] + ' and ' + b.name + ' is ' + q.vals[q.b] + '. Count up from ' + q.vals[q.b] + ' to ' + q.vals[q.a] + ' (the shaded part).';
        }
        return h;
      }
      // total
      q.cats.forEach(function (cc, k) { ch.ruler(k, false); });
      if (strong) {
        q.vals.forEach(function (v, k) { ch.tag(k, String(v)); });
        return 'Each bar’s number is written on it now. Add them one at a time.' + (tag === 'Missed a bar when adding' ? ' Did you add every bar?' : '');
      }
      return (tag === 'Missed a bar when adding' ? 'Nearly! I think one bar was left out. ' : '') + 'Read every bar, then add all the numbers together.';
    }

    function showWorking(full) {
      if (q.kind === 'value') {
        ch.ruler(q.a, true);
        if (q.step === 2 && q.answer % 2) {
          ch.tick(q.answer);
          setInfo(box, txt('It stops halfway between ' + (q.answer - 1) + ' and ' + (q.answer + 1) + '.'), halfStrip(q.answer, true));
        } else if (full) setInfo(box, txt('The end of the bar lines up with ' + q.answer + ' on the scale.'));
      } else if (q.kind === 'more') {
        ch.ruler(q.a, true);
        ch.ruler(q.b, true);
        ch.gap(q.a, q.vals[q.b], q.vals[q.a]);
        setInfo(box, el('div', { class: 'sum-row' }, el('span', { class: 'chip' }, String(q.vals[q.a])), el('span', { class: 'sum-op' }, '−'), el('span', { class: 'chip' }, String(q.vals[q.b])), el('span', { class: 'sum-op' }, '='), el('span', { class: 'chip chip-total' }, String(q.answer))));
      } else {
        q.vals.forEach(function (v, k) { ch.tag(k, String(v)); });
        setInfo(box, MQ.ui.sum(q.vals, q.answer));
      }
    }
    api.onReveal(function () {
      ni.setValue(String(q.answer));
      ni.good();
      ni.disable();
      ch.clearMarks();
      showWorking(true);
      var c = q.cats[q.a];
      var work = q.kind === 'value' ? 'The end of the ' + c.name + ' bar lines up with ' + q.answer + ' on the scale.' : q.kind === 'more' ? q.vals[q.a] + ' − ' + q.vals[q.b] + ' = ' + q.answer + ': the difference between the two bars.' : q.vals.join(' + ') + ' = ' + q.answer;
      api.feedback(work, 'info');
    });
    MQ.__test = {
      solve: function () {
        ni.setValue(String(q.answer));
        ni.el.querySelector('.btn-check').click();
      },
      wrong: function () {
        ni.setValue(String(q.answer + 1 + (wrongN++ % 3)));
        ni.el.querySelector('.btn-check').click();
      },
    };
  }

  function renderBare(stage, api, q) {
    var ctx = CTX[q.ctx];
    var lastSig = null;
    api.say('This chart has no title, no labels and no numbers. Can you finish it?', 'think');
    stage.appendChild(MQ.ui.prompt('Give the chart a <b>title</b>, <b>axis labels</b> and a <b>scale</b>.'));
    var bars = q.vals.map(function (v) { return v / 2; });
    var ch = chart({ cats: q.cats, vals: bars, step: 1, max: q.lines, u: 32, slots: true, showNums: false });
    var side = el('div', { class: 'bc-sidein' });
    side.appendChild(dataCard(ctx, q.cats, q.vals));
    var lab = labeler(api, ch, labelTiles(ctx, CTX[q.other]));
    side.appendChild(lab.el);
    var scale = 0;
    var scaleCh = MQ.ui.choices([{ label: 'Scale: 0, 1, 2, 3 …', value: 1 }, { label: 'Scale: 0, 2, 4, 6 …', value: 2 }], function (v) {
      if (api.isAnswered()) return;
      scale = v;
      ch.numbers(v);
      scaleCh.buttons.forEach(function (b) { b.classList.toggle('bc-picked', b.value_ === v); });
    }, { columns: 2 });
    scaleCh.classList.add('bc-scalepick');
    side.appendChild(scaleCh);
    var box = info();
    var btn = checkButton('Check my chart', check);
    side.appendChild(btn);
    side.appendChild(box);
    stage.appendChild(row(ch.el, side));
    var tallest = q.vals.indexOf(Math.max.apply(null, q.vals));
    function check() {
      if (api.isAnswered()) return;
      var p = lab.placed();
      var sig = JSON.stringify(p) + (typeof scale === 'undefined' ? '' : scale);
      if (!Object.keys(p).length && !(typeof scale !== 'undefined' && scale)) {
        api.feedback('First drag the cards into the dashed boxes.', 'try');
        return;
      }
      if (sig === lastSig) {
        api.feedback('Change something first, then check again.', 'try');
        return;
      }
      lastSig = sig;
      var vd = labelVerdict(p);
      ['title', 'cat', 'val'].forEach(function (s) {
        if (p[s]) ch.slotState(s, p[s] === s ? 'good' : 'bad');
      });
      var scaleOk = scale === 2;
      if (scaleOk && !vd.missing.length && !vd.wrong.length) {
        lab.lock();
        scaleCh.disable();
        btn.disabled = true;
        api.check(true, 'Now the chart makes sense: ' + q.cats[tallest].name + ' is ' + q.vals[tallest] + '!');
        return;
      }
      var hint;
      var tag;
      if (!scaleOk) {
        tag = scale === 1 ? 'Counted gridlines not the scale' : 'Missing the scale';
        var top = q.vals[tallest];
        hint = scale === 1 ? 'With 1s, the ' + q.cats[tallest].name + ' bar would show ' + top / 2 + ', but the data says ' + top + '.' : 'Choose a scale so the numbers go up the side.';
        if (api.tries() >= 1) {
          hint = 'The ' + q.cats[tallest].name + ' bar is ' + top + ' but reaches only ' + top / 2 + ' lines. So each line must be worth 2.';
          setInfo(box, skipStrip(q.lines * 2, top));
        }
      } else if (vd.missing.length) {
        tag = 'Missing title or axis label';
        hint = 'A bar chart needs a title and a label on both axes. Fill every dashed box.';
      } else {
        tag = p.cat === 'val' && p.val === 'cat' ? 'Mixed up the two axis labels' : 'Used a label that does not fit the data';
        hint = 'Check the orange box. The numbers go up the side, so that side says how many.';
      }
      api.check(false, hint, tag);
    }
    api.onReveal(function () {
      ['title', 'cat', 'val'].forEach(function (s) {
        lab.place(s, s);
        ch.slotState(s, 'good');
      });
      lab.lock();
      scale = 2;
      ch.numbers(2);
      scaleCh.buttons.forEach(function (b) { b.classList.toggle('bc-picked', b.value_ === 2); });
      scaleCh.disable();
      btn.disabled = true;
      ch.ruler(tallest, 2);
      var work = 'The ' + q.cats[tallest].name + ' bar reaches ' + q.vals[tallest] / 2 + ' lines and shows ' + q.vals[tallest] + ', so the scale counts in 2s.';
      setInfo(box, txt(work), skipStrip(q.lines * 2, q.vals[tallest]));
      api.feedback(work + ' Then add the title and both axis labels.', 'info');
    });
    MQ.__test = {
      solve: function () {
        ['title', 'cat', 'val'].forEach(function (s) { lab.place(s, s); });
        scaleCh.buttons[1].click();
        btn.click();
      },
      wrong: function () {
        var odd = wrongN++ % 2;
        var a = odd ? ['title', 'val', 'cat'] : ['title', 'cat', 'val'];
        ['title', 'cat', 'val'].forEach(function (s, i) { lab.place(s, a[i]); });
        scaleCh.buttons[odd ? 1 : 0].click();
        btn.click();
      },
    };
  }

  function renderWhich(stage, api, q) {
    api.say('Bar chart or pictogram? Read each reason carefully.', 'think');
    stage.appendChild(MQ.ui.prompt('Which graph would you choose, and why?'));
    stage.appendChild(el('div', { class: 'bc-card bc-which-data' }, el('span', { class: 'bc-which-ic' }, '📋'), el('span', null, q.w.data)));
    var mini = el('div', { class: 'bc-minis' }, miniBar(), miniPicto());
    stage.appendChild(mini);
    var good = q.opts.filter(function (o) { return o.ok; })[0];
    var lastPick = null;
    var chs = MQ.ui.choices(q.opts.map(function (o) { return { label: o.text, value: o.text }; }), function (v) {
      if (api.isAnswered()) return;
      if (v === good.text) {
        chs.mark(v, 'good');
        chs.disable();
        api.check(true, 'Yes! That is a true reason.');
        return;
      }
      if (v === lastPick) {
        api.feedback('You tried that one. Read another reason.', 'try');
        return;
      }
      lastPick = v;
      chs.mark(v, 'bad');
      var hint = api.tries() >= 1 ? 'Every bar chart and pictogram needs a title. Bars start at 0. Pictures must be the same size. Which reason is still true?' : 'That reason is not true. Read the other choices.';
      api.check(false, hint, 'Chose a graph for a wrong reason');
    }, { columns: 1 });
    chs.classList.add('bc-why');
    stage.appendChild(chs);
    api.onReveal(function () {
      chs.mark(good.text, 'good');
      chs.disable();
      api.feedback('Both graphs need a title and labels. Pictograms suit small numbers and easy pictures; bar charts suit bigger numbers.', 'info');
    });
    MQ.__test = {
      solve: function () {
        chs.buttons.filter(function (b) { return b.value_ === good.text; })[0].click();
      },
      wrong: function () {
        chs.buttons.filter(function (b) { return b.value_ !== good.text; })[wrongN++ % 2].click();
      },
    };
  }
  function miniBar() {
    var s = svg('svg', { viewBox: '0 0 120 70', width: 120, height: 70, class: 'bc-mini' });
    s.appendChild(svg('line', { x1: 12, y1: 6, x2: 12, y2: 62, class: 'bc-axis' }));
    s.appendChild(svg('line', { x1: 12, y1: 62, x2: 114, y2: 62, class: 'bc-axis' }));
    [30, 46, 20].forEach(function (h, i) {
      s.appendChild(svg('rect', { x: 24 + i * 30, y: 62 - h, width: 20, height: h, style: { fill: COLORS[i] } }));
    });
    return el('div', { class: 'bc-minibox' }, s, el('div', null, 'bar chart'));
  }
  function miniPicto() {
    var rows = [3, 4, 2];
    var box = el('div', { class: 'bc-picto' });
    rows.forEach(function (n) {
      var r = el('div', null);
      for (var i = 0; i < n; i++) r.appendChild(el('span', null, '🙂'));
      box.appendChild(r);
    });
    return el('div', { class: 'bc-minibox' }, box, el('div', null, 'pictogram'));
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */
  var LEARN_PETS = [1, 3, 6, 8, 9];

  function learnAxes(stage, api) {
    api.lockNext();
    api.say('A bar chart has two axes. Along the bottom are the groups. Up the side is how many.');
    stage.appendChild(MQ.ui.lesson('Name the parts', 'Drag each card to its dashed box.'));
    var ctx = CTX.pets;
    var ch = chart({ cats: ctx.cats, vals: LEARN_PETS, step: 1, max: 9, slots: true });
    var side = el('div', { class: 'bc-sidein' });
    var done = 0;
    var lab = labeler(api, ch, U.shuffle([{ id: 'title', text: ctx.title }, { id: 'cat', text: ctx.cat }, { id: 'val', text: ctx.val }]), {
      accept: function (slot, id) {
        if (slot === id) return true;
        api.sound('wrong');
        var msg = id === 'title' ? 'The title goes at the top: it tells us what the whole chart is about.' : id === 'cat' ? '“Type of pet” names the groups, so it goes under the bars, along the horizontal axis.' : '“Number of pets” is how many, so it goes up the side, next to the numbers.';
        api.feedback(msg, 'try');
        api.say('Not there. Try another box!', 'oops');
        return false;
      },
      onChange: function () {
        done = Object.keys(lab.placed()).length;
        ['title', 'cat', 'val'].forEach(function (s) { if (lab.placed()[s]) ch.slotState(s, 'good'); });
        if (done === 3) {
          lab.lock();
          api.say('Brilliant! Title, horizontal axis label and vertical axis label.', 'cheer');
          api.feedback('Every bar chart needs a title and a label on both axes.', 'good');
          api.unlockNext();
        } else {
          api.feedback('Good! ' + (3 - done) + ' more to go.', 'good');
        }
      },
    });
    side.appendChild(el('div', { class: 'bc-axes-key' }, el('div', null, '↔ ', el('b', null, 'horizontal axis'), ': the groups'), el('div', null, '↕ ', el('b', null, 'vertical axis'), ': how many')));
    side.appendChild(lab.el);
    stage.appendChild(row(ch.el, side));
  }

  function learnDrag(stage, api) {
    api.lockNext();
    api.say('The shop has 8 cats. Drag the top of the cat bar up to 8.');
    stage.appendChild(MQ.ui.lesson('Draw a bar', 'Every bar starts at <b>0</b>. Drag the top of the <b>cat</b> bar up to <b>8</b>.'));
    var ctx = CTX.pets;
    var vals = LEARN_PETS.slice();
    vals[3] = 0;
    var finished = false;
    var ch = chart({
      cats: ctx.cats, vals: vals, step: 1, max: 9, editable: [false, false, false, true, false], liveNum: true,
      title: ctx.title, cat: ctx.cat, val: ctx.val,
      onDrop: function (i, v) {
        if (finished) return;
        if (v === 8) {
          finished = true;
          ch.lock();
          ch.barState(3, 'good');
          ch.ruler(3, true);
          api.say('Yes! The top of the bar lines up with 8.', 'cheer');
          api.feedback('The dashed line goes from the top of the bar straight across to the scale: 8 cats.', 'good');
          api.unlockNext();
        } else {
          api.say(v < 8 ? 'Higher! Look for 8 on the scale.' : 'Too high! Bring it down to 8.', 'oops');
          api.feedback('That bar shows ' + v + '. Follow the line across to the scale and stop at 8.', 'try');
        }
      },
    });
    api.cleanup(ch.unbind);
    var side = el('div', { class: 'bc-sidein' }, el('div', { class: 'bc-bigtip' }, el('div', { class: 'bc-bigic' }, '🐈'), el('div', null, '8 cats')), txt('Grab the grey handle at the bottom of the cat bar and pull it up. A dashed line shows you where the top lines up on the scale.'));
    stage.appendChild(row(ch.el, side));
  }

  function learnHalf(stage, api) {
    api.lockNext();
    api.say('This scale goes up in 2s. Look at the Week 3 bar. What does it show?');
    stage.appendChild(MQ.ui.lesson('A scale in 2s', 'Each line is worth <b>2</b>. Some bars stop <b>between</b> two lines.'));
    var ctx = CTX.trees;
    var cats = ctx.cats.slice(0, 4);
    var vals = [4, 10, 7, 12];
    var ch = chart({ cats: cats, vals: vals, step: 2, max: 14, title: ctx.title, cat: ctx.cat, val: ctx.val });
    ch.ruler(2, false);
    var side = el('div', { class: 'bc-sidein' });
    side.appendChild(txt('The scale counts in 2s:'));
    side.appendChild(skipStrip(14));
    side.appendChild(txt('What does the <b>Week 3</b> bar show?'));
    var box = info();
    var chs = MQ.ui.choices([6, 7, 8], function (v) {
      if (v === 7) {
        chs.mark(7, 'good');
        chs.disable();
        ch.clearMarks();
        ch.ruler(2, true);
        ch.tick(7);
        setInfo(box, halfStrip(7, true));
        api.say('Yes! Halfway between 6 and 8 is 7.', 'cheer');
        api.feedback('The bar stops halfway between 6 and 8, so it shows 7 trees.', 'good');
        api.unlockNext();
      } else {
        chs.mark(v, 'bad');
        api.sound('wrong');
        api.say(v === 6 ? 'It goes past 6. Look again!' : 'It does not reach 8. Look again!', 'oops');
        api.feedback('The bar is above 6 but below 8. Which number is halfway?', 'try');
        setInfo(box, halfStrip(7, false));
      }
    }, { columns: 3 });
    side.appendChild(chs);
    side.appendChild(box);
    stage.appendChild(row(ch.el, side));
  }

  /* ------------------------------------------------------------------ */
  MQ.register(ID, {
    learn: [learnAxes, learnDrag, learnHalf],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        MQ.__test = null;
        if (q.type === 'build') renderBuild(stage, api, q);
        else if (q.type === 'label') renderLabel(stage, api, q);
        else if (q.type === 'read') renderRead(stage, api, q);
        else if (q.type === 'bare') renderBare(stage, api, q);
        else renderWhich(stage, api, q);
      },
    },
  });
  MQ.__bcBuildDeck = buildDeck; // for automated deck checks

  var css = [
    '.bc-row{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;align-items:flex-start;width:100%}',
    '.bc-chartbox{flex:1 1 440px;max-width:640px;min-width:0;display:flex;justify-content:center}',
    '.bc-chart{display:block;width:100%;max-height:480px;user-select:none;-webkit-user-select:none}',
    '.bc-side{flex:0 1 300px;min-width:240px;max-width:100%}',
    '.bc-sidein{display:flex;flex-direction:column;gap:12px;align-items:stretch}',
    '.bc-gl{stroke:#d5ddf0;stroke-width:1.5}',
    '.bc-axis{stroke:var(--ink);stroke-width:3;stroke-linecap:round}',
    '.bc-num{font-size:17px;font-weight:800;fill:var(--ink)}',
    '.bc-cat{font-size:15px;font-weight:700;fill:var(--ink)}',
    '.bc-icon{font-size:22px}',
    '.bc-title{font-size:20px;font-weight:800;fill:var(--ink)}',
    '.bc-label{font-size:16px;font-weight:700;fill:var(--ink-soft)}',
    '.bc-bar{stroke:#1b2a4a;stroke-width:2;transition:fill .2s}',
    '.bc-bar.bc-bad{fill:#ffb38a !important;stroke:var(--try);stroke-width:3}',
    '.bc-bar.bc-good{stroke:var(--good);stroke-width:3}',
    '.bc-grip{fill:#8a98b8;stroke:#1b2a4a;stroke-width:1.5;pointer-events:none}',
    '.bc-hit{fill:transparent}',
    '.bc-hit:hover{fill:rgba(46,196,182,.08)}',
    '.bc-locked .bc-hit{cursor:default !important;fill:transparent}',
    '.bc-locked .bc-grip{display:none}',
    '.bc-guide{stroke:var(--accent);stroke-width:3;stroke-dasharray:7 5;pointer-events:none}',
    '.bc-ruler{stroke:#e85d04;stroke-width:3;stroke-dasharray:8 5;pointer-events:none}',
    '.bc-tick{stroke:#e85d04;stroke-width:4;pointer-events:none}',
    '.bc-pill{fill:#fff3cd;stroke:var(--gold);stroke-width:2.5}',
    '.bc-pill-hint .bc-pill{fill:#ffe8d6;stroke:#e85d04}',
    '.bc-pill-text{font-size:17px;font-weight:800;fill:var(--ink)}',
    '.bc-marks{pointer-events:none}',
    '.bc-tag{font-size:17px;font-weight:800;fill:var(--good)}',
    '.bc-gap{fill:rgba(232,93,4,.25);stroke:#e85d04;stroke-width:2;stroke-dasharray:4 3}',
    '.bc-slot rect{fill:#f7f9ff;stroke:#9fb0d6;stroke-width:2;stroke-dasharray:6 4;cursor:pointer}',
    '.bc-slot.bc-filled rect{fill:#eef3ff;stroke:var(--accent);stroke-dasharray:none}',
    '.bc-slot.bc-shot rect{fill:#e2f7f4;stroke:var(--accent);stroke-width:3}',
    '.bc-slot.bc-sgood rect{fill:var(--good-bg);stroke:var(--good);stroke-dasharray:none}',
    '.bc-slot.bc-sbad rect{fill:var(--try-bg);stroke:var(--try);stroke-dasharray:none}',
    '.bc-slot-text{font-size:16px;font-weight:800;fill:var(--ink);pointer-events:none}',
    '.bc-slot-empty{fill:#9fb0d6;font-weight:700;font-style:italic}',
    '.bc-tray{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}',
    '.bc-tile{font:inherit;font-weight:800;font-size:1rem;padding:9px 13px;border-radius:12px;border:3px solid var(--line);background:#fff;color:var(--ink);cursor:grab;touch-action:none;user-select:none}',
    '.bc-tile:hover:not(:disabled){border-color:var(--accent)}',
    '.bc-tile.bc-sel{border-color:var(--accent);background:#e2f7f4;box-shadow:0 0 0 3px rgba(46,196,182,.3)}',
    '.bc-tile.bc-used{visibility:hidden}',
    '.bc-tile.bc-lift{opacity:.35}',
    '.bc-ghost{position:fixed;z-index:1000;pointer-events:none;transform:translate(-50%,-50%) rotate(-2deg);box-shadow:0 6px 18px rgba(27,42,74,.25);border-color:var(--accent)}',
    '.bc-card{background:var(--paper);border:2px solid var(--line);border-radius:14px;padding:10px 14px}',
    '.bc-card-head{font-weight:800;color:var(--ink-soft);margin-bottom:4px}',
    '.bc-data{list-style:none;margin:0;padding:0;font-size:1.15rem;font-weight:700}',
    '.bc-data li{display:flex;gap:8px;align-items:center;padding:2px 0}',
    '.bc-data b{color:#0b6e66}',
    '.bc-data-ic{font-size:1.3rem;width:1.6rem;text-align:center}',
    '.bc-check{align-self:center}',
    '.bc-info{display:flex;flex-direction:column;gap:8px;align-items:center}',
    '.bc-info:empty{display:none}',
    '.bc-note{font-weight:700;color:var(--ink-soft);text-align:center}',
    '.bc-skip{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:2px}',
    '.bc-skipn{display:inline-block;min-width:30px;text-align:center;font-weight:800;padding:4px 6px;border-radius:10px;background:var(--info-bg);border:2px solid var(--line)}',
    '.bc-skipn.bc-on{background:#fff3cd;border-color:var(--gold)}',
    '.bc-jump{font-size:.72rem;font-weight:800;color:#e85d04}',
    '.bc-half{display:flex;align-items:center;gap:6px;font-weight:800;font-size:1.3rem;position:relative;padding-bottom:16px}',
    '.bc-halfn{padding:4px 10px;border-radius:10px;background:var(--info-bg);border:2px solid var(--line)}',
    '.bc-halfm{padding:4px 10px;border-radius:10px;border:2px dashed #e85d04;color:#e85d04}',
    '.bc-halfm.bc-on{background:#fff3cd;border:2px solid var(--gold);color:var(--ink)}',
    '.bc-halfcap{position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);font-size:.75rem;color:#e85d04}',
    '.bc-choices .choice{min-height:46px;font-size:1.05rem}',
    '.bc-scalepick .choice{min-height:46px;font-size:1rem}',
    '.bc-scalepick .choice.bc-picked{border-color:var(--accent);background:#e2f7f4}',
    '.bc-clue-sum{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.bc-clue-sum .sum-row{font-size:1.1rem}',
    '.bc-axes-key{background:var(--paper);border:2px solid var(--line);border-radius:14px;padding:10px 14px;font-size:1.05rem;line-height:1.6}',
    '.bc-bigtip{display:flex;align-items:center;gap:10px;justify-content:center;font-size:1.5rem;font-weight:800}',
    '.bc-bigic{font-size:2.6rem}',
    '.bc-which-data{display:flex;gap:10px;align-items:center;font-size:1.2rem;font-weight:700;max-width:720px}',
    '.bc-which-ic{font-size:1.8rem}',
    '.bc-minis{display:flex;gap:24px;justify-content:center;flex-wrap:wrap}',
    '.bc-minibox{display:flex;flex-direction:column;align-items:center;font-weight:800;color:var(--ink-soft);font-size:.9rem}',
    '.bc-mini{width:120px;height:70px}',
    '.bc-picto{height:70px;display:flex;flex-direction:column;justify-content:center;font-size:16px;line-height:1.25}',
    '.bc-why{max-width:720px}',
    '.bc-why .choice{text-align:left;font-size:1.05rem;min-height:52px}',
    '@media (max-width:820px){.bc-side{flex:1 1 100%}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

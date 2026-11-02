/* Fraction Strip Wall — halves, quarters, fifths and tenths lined up to find equivalent
 * fractions (Unit 7.1, Textbook p.120 Q3, p.123 CYP Q1 · Workbook p.101 Q6, p.103 Q9). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var X0 = 20; // left end of every strip (SVG units)
  var W = 600; // length of one whole strip
  var RH = 50; // row height
  var GAP = 10;
  var COL = { 1: '#a1887f', 2: '#ffb74d', 4: '#81c784', 5: '#64b5f6', 10: '#ce93d8' };
  var NAME = { 1: 'whole', 2: 'halves', 4: 'quarters', 5: 'fifths', 10: 'tenths' };
  var ONE = { 1: 'whole', 2: 'half', 4: 'quarter', 5: 'fifth', 10: 'tenth' };
  var T_DIFF = 'Thought different numbers mean different amounts';
  var T_ALIGN = 'Did not line up the ends of the strips';
  var T_BIGDEN = 'Thought a bigger bottom number means a bigger piece';
  var T_TOP = 'Compared only the top numbers';
  var T_FALSE = 'Called two different amounts the same';
  var T_PART = 'Named only the part that was added';

  function same(a, b, c, d) {
    return a * d === b * c;
  }
  function fracHtml(n, d) {
    return '<span class="sw-frac"><span>' + n + '</span><span>' + d + '</span></span>';
  }
  function fracName(n, d) {
    return d === 1 ? n + ' whole' : n + '/' + d;
  }
  function plural(n, d) {
    return n === 1 ? ONE[d] : NAME[d];
  }

  /** Small stacked fraction drawn in SVG, centred at (cx, cy). */
  function svgFrac(g, cx, cy, n, d, size, color) {
    size = size || 18;
    var c = color || '#2b2d42';
    if (d === 1) {
      g.appendChild(svg('text', { x: cx, y: cy + size * 0.35, 'text-anchor': 'middle', 'font-size': size, 'font-weight': 800, fill: c }, '1 whole'));
      return;
    }
    g.appendChild(svg('text', { x: cx, y: cy - 3, 'text-anchor': 'middle', 'font-size': size, 'font-weight': 800, fill: c }, String(n)));
    g.appendChild(svg('line', { x1: cx - size * 0.55, y1: cy + 1, x2: cx + size * 0.55, y2: cy + 1, stroke: c, 'stroke-width': 2 }));
    g.appendChild(svg('text', { x: cx, y: cy + size * 0.95, 'text-anchor': 'middle', 'font-size': size, 'font-weight': 800, fill: c }, String(d)));
  }

  /** One strip of d equal pieces at row y. Returns array of piece <rect>s. */
  function strip(g, y, d, opts) {
    opts = opts || {};
    var w = W / d;
    var rects = [];
    for (var i = 0; i < d; i++) {
      var r = svg('rect', { x: X0 + i * w, y: y, width: w, height: RH, rx: 4, fill: COL[d], stroke: '#5d4037', 'stroke-width': 2.5, class: 'sw-piece' });
      g.appendChild(r);
      rects.push(r);
      if (!opts.noLabels) svgFrac(g, X0 + i * w + w / 2, y + RH / 2 - 4, 1, d, d === 10 ? 15 : 18);
    }
    return rects;
  }
  function dim(rects, from) {
    rects.forEach(function (r, i) {
      r.setAttribute('fill-opacity', i < from ? 1 : 0.25);
      r.setAttribute('stroke-opacity', i < from ? 1 : 0.45);
    });
  }

  /* ---------------- cover task (drag or click pieces under a coloured part) ---------------- */

  /**
   * Top strip in `big` pieces with the first `a` coloured; an empty track below it; a pile of
   * `small` pieces to drag (or click) into the track. opts.onChange(count) after each change.
   */
  function coverTask(api, a, big, small, opts) {
    opts = opts || {};
    var VW = 790;
    var root = svg('svg', { viewBox: '0 0 ' + VW + ' 172', class: 'sw-svg sw-cover' });
    var g = svg('g');
    root.appendChild(g);
    var top = strip(g, 10, big);
    dim(top, a);
    var trackY = 10 + RH + 24;
    g.appendChild(svg('rect', { x: X0, y: trackY, width: W, height: RH, rx: 4, fill: '#fbf7f0', stroke: '#b9ab95', 'stroke-width': 2, 'stroke-dasharray': '8 6' }));
    var endX = X0 + (a / big) * W;
    var guide = svg('line', { x1: endX, y1: 4, x2: endX, y2: trackY + RH + 6, stroke: '#2a9d8f', 'stroke-width': 5, 'stroke-dasharray': '10 7', opacity: 0 });
    var placedG = svg('g');
    g.appendChild(placedG);
    g.appendChild(guide);
    // pile
    var w = W / small;
    var pileX = 660;
    var pile = svg('g', { class: 'sw-pile' });
    for (var k = 2; k >= 0; k--) pile.appendChild(svg('rect', { x: pileX + k * 6, y: trackY - k * 6, width: Math.min(w, 100), height: RH, rx: 4, fill: COL[small], stroke: '#5d4037', 'stroke-width': 2.5 }));
    svgFrac(pile, pileX + Math.min(w, 100) / 2, trackY + RH / 2 - 4, 1, small, 18);
    pile.appendChild(svg('text', { x: pileX + 55, y: trackY + RH + 26, 'text-anchor': 'middle', 'font-size': 16, 'font-weight': 700, fill: '#5c677d' }, 'drag or click'));
    root.appendChild(pile);
    var ghost = svg('rect', { x: 0, y: 0, width: w, height: RH, rx: 4, fill: COL[small], stroke: '#5d4037', 'stroke-width': 2.5, opacity: 0, 'pointer-events': 'none' });
    root.appendChild(ghost);
    var placed = [];
    var locked = false;

    function place(n) {
      n = U.clamp(n, 0, small);
      while (placed.length < n) {
        var i = placed.length;
        var gp = svg('g', { class: 'sw-placed' });
        gp.appendChild(svg('rect', { x: X0 + i * w, y: trackY, width: w, height: RH, rx: 4, fill: COL[small], stroke: '#5d4037', 'stroke-width': 2.5 }));
        svgFrac(gp, X0 + i * w + w / 2, trackY + RH / 2 - 4, 1, small, small === 10 ? 15 : 18);
        gp.addEventListener('click', function () {
          if (locked) return;
          api.sound('click');
          place(placed.length - 1);
        });
        placedG.appendChild(gp);
        placed.push(gp);
      }
      while (placed.length > n) placedG.removeChild(placed.pop());
      var fits = placed.length * big === a * small;
      guide.setAttribute('opacity', fits ? 1 : 0);
      if (opts.onChange) opts.onChange(placed.length, fits);
    }
    function add() {
      if (locked) return;
      if (placed.length >= small) {
        api.feedback('All the ' + NAME[small] + ' are in the row. Click a piece in the row to take it out.', 'info');
        return;
      }
      api.sound('pop');
      place(placed.length + 1);
    }
    var moved = false;
    var unbind = MQ.ui.drag(root, pile, {
      start: function () {
        moved = false;
      },
      move: function (p) {
        if (locked) return;
        moved = true;
        ghost.setAttribute('x', p.x - w / 2);
        ghost.setAttribute('y', p.y - RH / 2);
        ghost.setAttribute('opacity', 0.8);
      },
      end: function (p) {
        ghost.setAttribute('opacity', 0);
        if (!moved) return add();
        if (p.x < X0 + W + 20 && p.y > trackY - 40 && p.y < trackY + RH + 40) add();
        else api.feedback('Drop the piece on the dashed row.', 'info');
      },
    });
    api.cleanup(unbind);
    return {
      svg: root,
      count: function () {
        return placed.length;
      },
      set: function (n) {
        place(n);
      },
      lock: function () {
        locked = true;
        pile.setAttribute('opacity', 0.35);
      },
    };
  }

  /* ---------------- the wall with a sliding line ---------------- */

  /**
   * rows: denominators, top to bottom. marks: {d: n} colours the first n pieces of row d.
   * The red line can be dragged (or the wall clicked) and snaps to piece edges.
   * opts.onLine(pos as [n, d] in lowest terms, rowsThatLineUp)
   */
  function wall(api, rows, marks, opts) {
    opts = opts || {};
    marks = marks || {};
    var H = 34 + rows.length * (RH + GAP);
    var root = svg('svg', { viewBox: '0 0 640 ' + (H + 10), class: 'sw-svg sw-wall' });
    var g = svg('g');
    root.appendChild(g);
    var rowRects = {};
    rows.forEach(function (d, i) {
      var r = strip(g, 34 + i * (RH + GAP), d);
      rowRects[d] = r;
      if (marks[d] !== undefined) dim(r, marks[d]);
    });
    var lineG = svg('g', { class: 'sw-line', opacity: 0 });
    var line = svg('line', { x1: 0, y1: 22, x2: 0, y2: H, stroke: '#e63946', 'stroke-width': 4 });
    var knob = svg('circle', { cx: 0, cy: 16, r: 14, fill: '#e63946', stroke: '#fff', 'stroke-width': 3 });
    var hit = svg('rect', { x: -16, y: 0, width: 32, height: H, fill: 'transparent' });
    lineG.appendChild(hit);
    lineG.appendChild(line);
    lineG.appendChild(knob);
    root.appendChild(lineG);
    var edges = [];
    rows.forEach(function (d) {
      for (var k = 0; k <= d; k++) edges.push(k / d);
    });
    var cur = null;
    function setLine(t, quiet) {
      cur = t;
      var x = X0 + t * W;
      lineG.setAttribute('opacity', 1);
      lineG.setAttribute('transform', 'translate(' + x + ',0)');
      if (quiet) return;
      var lined = rows.filter(function (d) {
        return Math.abs(Math.round(t * d) - t * d) < 1e-9;
      });
      rows.forEach(function (d) {
        rowRects[d].forEach(function (r, i) {
          r.classList.toggle('sw-lit', lined.indexOf(d) !== -1 && (i + 1) / d <= t + 1e-9);
        });
      });
      if (opts.onLine) opts.onLine(t, lined);
    }
    function snap(px) {
      var t = U.clamp((px - X0) / W, 0, 1);
      var best = edges[0];
      edges.forEach(function (e) {
        if (Math.abs(e - t) < Math.abs(best - t)) best = e;
      });
      return best;
    }
    var unbind = MQ.ui.drag(root, lineG, {
      move: function (p) {
        lineG.setAttribute('transform', 'translate(' + U.clamp(p.x, X0, X0 + W) + ',0)');
      },
      end: function (p) {
        api.sound('click');
        setLine(snap(p.x));
      },
    });
    api.cleanup(unbind);
    g.addEventListener('click', function (e) {
      var p = MQ.ui.svgPoint(root, e);
      api.sound('click');
      setLine(snap(p.x));
    });
    g.style.cursor = 'pointer';
    setLine(0, true);
    return {
      svg: root,
      setLine: setLine,
      line: function () {
        return cur;
      },
      rows: rowRects,
      numberRow: function (d, n) {
        var y = 34 + rows.indexOf(d) * (RH + GAP);
        for (var i = 0; i < n; i++) {
          var cx = X0 + (i + 0.5) * (W / d);
          g.appendChild(svg('circle', { cx: cx, cy: y + RH - 2, r: 11, fill: '#fff', stroke: '#e63946', 'stroke-width': 2.5 }));
          g.appendChild(svg('text', { x: cx, y: y + RH + 3, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 800, fill: '#e63946' }, String(i + 1)));
        }
      },
    };
  }

  /* ---------------- answer box: a fraction with a missing top number ---------------- */

  function missingForm(api, parts, onSubmit) {
    // parts: list of {n, d} or {d, ask:true}; rendered joined by "="
    var inputs = [];
    var row = el('div', { class: 'sw-eq' });
    parts.forEach(function (p, i) {
      if (i) row.appendChild(el('span', { class: 'sw-eqs' }, '='));
      if (p.ask) {
        var inp = el('input', { class: 'sw-in', type: 'text', inputmode: 'numeric', maxlength: 2, autocomplete: 'off', 'aria-label': 'top number' });
        inputs.push(inp);
        row.appendChild(el('span', { class: 'sw-frac sw-frac-in' }, el('span', null, inp), el('span', null, String(p.d))));
      } else if (p.d === 1) {
        row.appendChild(el('span', { class: 'sw-whole' }, '1 whole'));
      } else {
        row.appendChild(el('span', { html: fracHtml(p.n, p.d) }));
      }
    });
    var btn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    row.appendChild(btn);
    function submit() {
      if (btn.disabled) return;
      var vals = inputs.map(function (inp) {
        var s = inp.value.trim();
        return /^\d{1,2}$/.test(s) ? parseInt(s, 10) : NaN;
      });
      var empty = vals.indexOf(NaN) !== -1 || vals.some(isNaN);
      if (empty) {
        api.feedback('Type a number in each box first.', 'info');
        inputs[vals.findIndex(isNaN)].focus();
        return;
      }
      onSubmit(vals);
    }
    btn.addEventListener('click', submit);
    inputs.forEach(function (inp) {
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });
    });
    return {
      el: row,
      inputs: inputs,
      fill: function (vals) {
        inputs.forEach(function (inp, i) {
          inp.value = vals[i];
          inp.classList.add('sw-good');
        });
      },
      mark: function (i, ok) {
        inputs[i].classList.remove('sw-good', 'sw-bad');
        inputs[i].classList.add(ok ? 'sw-good' : 'sw-bad');
      },
      disable: function () {
        inputs.forEach(function (inp) {
          inp.disabled = true;
        });
        btn.disabled = true;
      },
      focus: function () {
        api.later(function () {
          try {
            inputs[0].focus({ preventScroll: true });
          } catch (e) {}
        }, 50);
      },
    };
  }

  /* ---------------- pizzas for "same or different?" ---------------- */

  function pizzaPair(api, A, B) {
    var root = svg('svg', { viewBox: '0 0 560 250', class: 'sw-svg sw-pizzas' });
    function pizza(cx, f, ghost) {
      var g = svg('g');
      var R = 105;
      var cy = 125;
      g.appendChild(svg('circle', { cx: cx, cy: cy, r: R, fill: ghost ? 'none' : '#fff6e0', stroke: '#c58b3a', 'stroke-width': 4 }));
      for (var i = 0; i < f.d; i++) {
        var a0 = (i / f.d) * 2 * Math.PI - Math.PI / 2;
        var a1 = ((i + 1) / f.d) * 2 * Math.PI - Math.PI / 2;
        var p0 = [cx + R * Math.cos(a0), cy + R * Math.sin(a0)];
        var p1 = [cx + R * Math.cos(a1), cy + R * Math.sin(a1)];
        var large = a1 - a0 > Math.PI ? 1 : 0;
        var d = f.d === 1 ? null : 'M' + cx + ',' + cy + ' L' + p0[0].toFixed(2) + ',' + p0[1].toFixed(2) + ' A' + R + ',' + R + ' 0 ' + large + ' 1 ' + p1[0].toFixed(2) + ',' + p1[1].toFixed(2) + ' Z';
        var shaded = i < f.n;
        if (!d) continue;
        g.appendChild(
          svg('path', {
            d: d,
            fill: shaded ? (ghost ? 'rgba(77,150,255,.45)' : '#f4a261') : ghost ? 'none' : '#fff6e0',
            stroke: ghost ? '#1d4ed8' : '#8d5b23',
            'stroke-width': ghost ? 3 : 2.5,
            'stroke-dasharray': ghost ? '8 5' : 'none',
          })
        );
      }
      return g;
    }
    var gA = pizza(140, A, false);
    var gB = pizza(420, B, false);
    var gBghost = pizza(420, B, true);
    gBghost.setAttribute('opacity', 0);
    gBghost.style.transition = 'transform .7s ease';
    root.appendChild(gA);
    root.appendChild(gB);
    root.appendChild(gBghost);
    var on = false;
    var btn = el('button', { class: 'btn btn-ghost sw-overlay', type: 'button' }, '⤵ Lay one on top');
    function show(v) {
      on = v;
      gBghost.setAttribute('opacity', on ? 1 : 0);
      gBghost.setAttribute('transform', on ? 'translate(-280,0)' : '');
      btn.textContent = on ? '⤴ Move it back' : '⤵ Lay one on top';
    }
    btn.addEventListener('click', function () {
      api.sound('click');
      show(!on);
    });
    return { svg: root, btn: btn, overlay: show };
  }

  /* ---------------- deck ---------------- */

  var FILLS = [
    { given: [2, 5], to: 10 },
    { given: [3, 5], to: 10 },
    { given: [1, 2], to: 10 },
    { given: [8, 10], to: 5 },
    { given: [2, 4], to: 2 },
    { given: [4, 10], to: 5 },
  ];
  var TF = [
    { a: [2, 4], b: [1, 2] },
    { a: [1, 5], b: [1, 10] },
    { a: [3, 5], b: [6, 10] },
    { a: [1, 2], b: [2, 10] },
    { a: [2, 5], b: [4, 10] },
    { a: [1, 4], b: [2, 10] },
  ];
  var BIGGER = [
    [1, 5, 1, 10],
    [3, 10, 1, 2],
    [2, 5, 1, 2],
    [1, 4, 1, 5],
    [1, 2, 1, 10],
  ];
  var PIZZAS = [
    [2, 5, 4, 10],
    [3, 4, 2, 3],
    [1, 2, 1, 3],
    [2, 5, 2, 4],
    [1, 2, 5, 10],
    [2, 4, 5, 10],
    [1, 3, 4, 10],
  ];

  function rowsFor(ds) {
    return [1, 2, 4, 5, 10].filter(function (d) {
      return ds.indexOf(d) !== -1;
    });
  }

  var deck = null;
  function buildDeck() {
    var q = [];
    // Level 1: cover a half with quarters, a fifth with tenths, then one whole
    q.push({ type: 'cover', a: 1, big: 2, small: 4 });
    q.push({ type: 'cover', a: 1, big: 5, small: 10 });
    q.push({ type: 'fill', given: [1, 1], to: U.pick([4, 5, 10]) });
    // Level 2: two fills from the wall + one same-or-not card
    U.shuffle(FILLS)
      .slice(0, 2)
      .forEach(function (f) {
        q.push({ type: 'fill', given: f.given, to: f.to });
      });
    var tf = U.pick(TF);
    q.push(U.pick([true, false]) ? { type: 'tf', a: tf.a, b: tf.b } : { type: 'tf', a: tf.b, b: tf.a });
    // Level 3: which is more, shade more, pizzas same or different
    var b = U.pick(BIGGER);
    q.push({ type: 'bigger', a: [b[0], b[1]], b: [b[2], b[3]], flip: Math.random() < 0.5 });
    q.push({ type: 'shade', start: U.pick([3, 2]), total: 5 });
    var p = U.pick(PIZZAS);
    q.push({ type: 'pizza', a: [p[0], p[1]], b: [p[2], p[3]] });
    return q;
  }

  /* ---------------- learn ---------------- */

  function learnCover(a, big, small, title, sayDone) {
    return function (stage, api) {
      api.say('Drag ' + NAME[small] + ' into the dashed row until they cover ' + fracName(a, big) + ' exactly.');
      api.lockNext();
      stage.appendChild(MQ.ui.lesson(title, 'Drag (or click) the ' + NAME[small] + ' into the dashed row. Stop when the ends line up with the coloured ' + ONE[big] + '.'));
      var done = false;
      var out = el('div', { class: 'sw-out' });
      var task = coverTask(api, a, big, small, {
        onChange: function (n, fits) {
          MQ.clear(out);
          if (fits && !done) {
            done = true;
            task.lock();
            out.innerHTML = fracHtml(a, big) + '<span class="sw-eqs">=</span>' + fracHtml(n, small);
            api.say(sayDone, 'cheer');
            api.feedback('Different numbers, same amount. We call them equivalent.', 'good');
            api.unlockNext();
          } else if (!done) {
            out.textContent = n + ' ' + plural(n, small) + (n * big > a * small ? ': too far! Click one to take it out.' : '');
          }
        },
      });
      stage.appendChild(task.svg);
      stage.appendChild(out);
    };
  }

  function learnLine(stage, api) {
    api.say('Drag the red line, or click the wall. Where do the edges line up?');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Check with a straight line', 'Find where <b>three</b> rows line up, then find a fifth that lines up with tenths.'));
    var found = {};
    var out = el('div', { class: 'sw-out' });
    var goals = el('div', { class: 'sw-goals' });
    function drawGoals() {
      MQ.clear(goals);
      goals.appendChild(el('span', { class: 'chip' + (found.three ? ' sw-done' : '') }, (found.three ? '✓ ' : '') + '3 rows line up'));
      goals.appendChild(el('span', { class: 'chip' + (found.fifth ? ' sw-done' : '') }, (found.fifth ? '✓ ' : '') + 'fifths and tenths'));
    }
    var w = wall(api, [1, 2, 4, 5, 10], {}, {
      onLine: function (t, lined) {
        var names = lined.map(function (d) {
          return fracHtml(Math.round(t * d), d);
        });
        if (t === 0 || t === 1) {
          out.innerHTML = t === 0 ? 'That is the start of every strip.' : 'Every row makes 1 whole!';
        } else if (lined.length < 2) {
          out.innerHTML = names.join('') + ' &nbsp;Nothing else lines up here.';
        } else {
          out.innerHTML = names.join('<span class="sw-eqs">=</span>');
        }
        if (lined.length >= 3 && t > 0 && t < 1) found.three = true;
        if (lined.indexOf(5) !== -1 && lined.indexOf(10) !== -1 && t > 0 && t < 1) found.fifth = true;
        drawGoals();
        if (found.three && found.fifth) {
          api.say('You found equivalent fractions! Same length, different names.', 'cheer');
          api.feedback('When the edges line up, the fractions are the same amount.', 'good');
          api.unlockNext();
        }
      },
    });
    drawGoals();
    stage.appendChild(w.svg);
    stage.appendChild(out);
    stage.appendChild(goals);
  }

  /* ---------------- practice ---------------- */

  function renderCover(stage, api, q) {
    var ans = (q.a * q.small) / q.big;
    stage.setAttribute('data-answer', ans);
    api.say('Fill the dashed row with ' + NAME[q.small] + ' to cover ' + q.a + '/' + q.big + '. How many fit?', 'think');
    stage.appendChild(MQ.ui.prompt('How many ' + NAME[q.small] + ' are the same as ' + fracHtml(q.a, q.big) + '?'));
    var task = coverTask(api, q.a, q.big, q.small, {
      onChange: function (n, fits) {
        if (fits) api.feedback('The ends line up! How many ' + NAME[q.small] + ' did you use?', 'info');
      },
    });
    stage.appendChild(task.svg);
    var form = missingForm(api, [{ n: q.a, d: q.big }, { d: q.small, ask: true }], function (v) {
      var n = v[0];
      if (n === ans) {
        form.mark(0, true);
        form.disable();
        task.set(ans);
        task.lock();
        api.check(true, q.a + '/' + q.big + ' = ' + ans + '/' + q.small + '. Same amount, different numbers!');
        return;
      }
      form.mark(0, false);
      var placed = task.count();
      if (n === q.a) {
        api.check(false, api.tries() ? 'Put ' + NAME[q.small] + ' in the row until the ends line up with the coloured part, then count them.' : 'The pieces underneath are smaller, so you need more of them. Fill the row and count.', T_DIFF);
      } else if (placed && n === placed && placed !== ans) {
        api.check(false, placed > ans ? 'Your row goes past the end of the coloured part. Take some out.' : 'Your row stops before the end of the coloured part. Add more.', T_ALIGN);
      } else {
        api.check(false, api.tries() ? 'Fill the dashed row until the green line appears, then count the pieces.' : 'Use the pieces: fill the row until the ends match, then count.', T_ALIGN);
      }
    });
    stage.appendChild(form.el);
    form.focus();
    api.onReveal(function () {
      task.set(ans);
      task.lock();
      form.fill([ans]);
      form.disable();
      api.feedback(ans + ' ' + NAME[q.small] + ' fit exactly under ' + q.a + '/' + q.big + '. So ' + q.a + '/' + q.big + ' = ' + ans + '/' + q.small + '.', 'info');
    });
  }

  function renderFill(stage, api, q) {
    var g = q.given;
    var ans = (g[0] * q.to) / g[1];
    stage.setAttribute('data-answer', ans);
    var givenTxt = g[1] === 1 ? '1 whole' : g[0] + '/' + g[1];
    api.say(g[1] === 1 ? 'How many ' + NAME[q.to] + ' make one whole?' : 'Use the wall. ' + givenTxt + ' is the same as how many ' + NAME[q.to] + '?', 'think');
    stage.appendChild(MQ.ui.prompt(g[1] === 1 ? 'How many ' + NAME[q.to] + ' make 1 whole?' : 'Fill in the missing number. The red line can help.'));
    var marks = {};
    marks[g[1]] = g[0];
    var w = wall(api, rowsFor([g[1], q.to]), marks);
    stage.appendChild(w.svg);
    var form = missingForm(api, [{ n: g[0], d: g[1] }, { d: q.to, ask: true }], function (v) {
      var n = v[0];
      if (n === ans) {
        form.mark(0, true);
        form.disable();
        w.setLine(g[0] / g[1]);
        api.check(true, givenTxt + ' = ' + ans + '/' + q.to + '!');
        return;
      }
      form.mark(0, false);
      var hint;
      var tag = T_ALIGN;
      if (n === g[0] && g[1] !== 1) {
        hint = 'The ' + NAME[q.to] + ' are a different size, so the top number changes. Look at the wall.';
        tag = T_DIFF;
      } else if (api.tries()) {
        hint = 'Click the wall at the end of the coloured part. Count the ' + NAME[q.to] + ' to the left of the red line, one by one.';
      } else {
        hint = 'Find where the coloured part ends. How many ' + NAME[q.to] + ' reach exactly that far?';
      }
      api.check(false, hint, tag);
    });
    stage.appendChild(form.el);
    form.focus();
    api.onReveal(function () {
      w.setLine(g[0] / g[1]);
      w.numberRow(q.to, ans);
      form.fill([ans]);
      form.disable();
      api.feedback('The red line is at the end of ' + givenTxt + '. Count the ' + NAME[q.to] + ' before it: ' + ans + '. So ' + givenTxt + ' = ' + ans + '/' + q.to + '.', 'info');
    });
  }

  function renderTF(stage, api, q) {
    var right = same(q.a[0], q.a[1], q.b[0], q.b[1]);
    stage.setAttribute('data-answer', right ? 'same' : 'different');
    api.say('Are these two the same amount? Use the wall to check.', 'think');
    stage.appendChild(MQ.ui.prompt('Is ' + fracHtml(q.a[0], q.a[1]) + ' the same amount as ' + fracHtml(q.b[0], q.b[1]) + '?'));
    var marks = {};
    marks[q.a[1]] = q.a[0];
    marks[q.b[1]] = q.b[0];
    var w = wall(api, rowsFor([q.a[1], q.b[1]]), marks);
    stage.appendChild(w.svg);
    var ch = MQ.ui.choices(
      [
        { label: '✓ Yes, the same amount', value: 'same' },
        { label: '✗ No, different amounts', value: 'different' },
      ],
      function (v) {
        if ((v === 'same') === right) {
          ch.mark(v, 'good');
          ch.disable();
          w.setLine(q.a[0] / q.a[1]);
          api.check(true, right ? 'Yes! The edges line up, so they are equivalent.' : 'Right! The edges do not line up, so they are different.');
        } else {
          ch.mark(v, 'bad');
          if (right) api.check(false, api.tries() ? 'Click the wall at the end of the top coloured part. Does the bottom coloured part end there too?' : 'Different numbers can still be the same amount. Do the coloured parts end in the same place?', T_DIFF);
          else api.check(false, api.tries() ? 'Click the wall at the end of the top coloured part. The bottom one does not end there.' : 'Look at where each coloured part ends. Is it the same place?', T_FALSE);
        }
      },
      { columns: 2 }
    );
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(right ? 'same' : 'different', 'good');
      ch.disable();
      w.setLine(q.a[0] / q.a[1]);
      api.feedback(
        right
          ? 'The red line marks the end of both coloured parts. ' + fracName(q.a[0], q.a[1]) + ' = ' + fracName(q.b[0], q.b[1]) + '.'
          : 'The red line marks the end of ' + fracName(q.a[0], q.a[1]) + '. ' + fracName(q.b[0], q.b[1]) + ' ends somewhere else, so they are different.',
        'info'
      );
    });
  }

  function renderBigger(stage, api, q) {
    var A = q.flip ? q.b : q.a;
    var B = q.flip ? q.a : q.b;
    var big = A[0] * B[1] > B[0] * A[1] ? A : B;
    var small = big === A ? B : A;
    stage.setAttribute('data-answer', big[0] + '/' + big[1]);
    api.say('Which is more chocolate? Look at the wall.', 'think');
    stage.appendChild(MQ.ui.prompt('Which is <b>more</b>: ' + fracHtml(A[0], A[1]) + ' or ' + fracHtml(B[0], B[1]) + '?'));
    var marks = {};
    marks[A[1]] = A[0];
    marks[B[1]] = B[0];
    var w = wall(api, rowsFor([1, A[1], B[1]]), marks);
    stage.appendChild(w.svg);
    var ch = MQ.ui.choices(
      [A, B].map(function (f) {
        return { label: fracHtml(f[0], f[1]), value: f[0] + '/' + f[1] };
      }),
      function (v) {
        if (v === big[0] + '/' + big[1]) {
          ch.mark(v, 'good');
          ch.disable();
          api.check(true, big[0] + '/' + big[1] + ' is longer on the wall, so it is more!');
        } else {
          ch.mark(v, 'bad');
          var tag = small[0] > big[0] ? T_TOP : small[1] > big[1] ? T_BIGDEN : T_TOP;
          var hint =
            small[1] > big[1] && small[0] === big[0]
              ? api.tries()
                ? 'Cutting into ' + small[1] + ' pieces makes each piece smaller than cutting into ' + big[1] + '. Compare the coloured lengths.'
                : small[1] + ' is a bigger number, but the pieces are smaller! Look at the coloured lengths.'
              : api.tries()
              ? 'Which coloured part reaches further to the right?'
              : 'Compare the coloured parts on the wall. Which one is longer?';
          api.check(false, hint, tag);
        }
      },
      { columns: 2 }
    );
    ch.classList.add('sw-fracchoices');
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(big[0] + '/' + big[1], 'good');
      ch.disable();
      w.setLine(big[0] / big[1], true);
      api.feedback('The red line is at the end of ' + big[0] + '/' + big[1] + '. ' + small[0] + '/' + small[1] + ' stops before it, so ' + big[0] + '/' + big[1] + ' is more.', 'info');
    });
  }

  function renderShade(stage, api, q) {
    var add = q.total - q.start;
    stage.setAttribute('data-answer', '1/2');
    api.say('Click ' + add + ' more boxes to shade them.', 'think');
    stage.appendChild(MQ.ui.prompt(q.start + ' of these 10 boxes are shaded. Shade <b>' + add + ' more</b>.'));
    var root = svg('svg', { viewBox: '0 0 640 150', class: 'sw-svg sw-shade' });
    var g = svg('g');
    root.appendChild(g);
    var halves = strip(g, 10, 2);
    halves.forEach(function (r) {
      r.setAttribute('fill-opacity', 0.35);
    });
    var boxes = [];
    var extra = 0;
    var y = 10 + RH + GAP;
    for (var i = 0; i < 10; i++) {
      (function (i) {
        var r = svg('rect', { x: X0 + i * 60, y: y, width: 60, height: RH + 10, fill: i < q.start ? COL[10] : '#fff', stroke: '#5d4037', 'stroke-width': 2.5, class: 'sw-box' });
        r.addEventListener('click', function () {
          if (i < q.start || extra >= add || r.getAttribute('data-on')) return;
          r.setAttribute('data-on', '1');
          r.setAttribute('fill', '#ab47bc');
          extra++;
          api.sound('pop');
          if (extra === add) step2();
        });
        g.appendChild(r);
        boxes.push(r);
      })(i);
    }
    stage.appendChild(root);
    var area2 = el('div', { class: 'sw-step2' });
    stage.appendChild(area2);
    var ch = null;
    function step2() {
      if (ch) return;
      MQ.clear(area2);
      area2.appendChild(MQ.ui.prompt('Now ' + fracHtml(5, 10) + ' is shaded. Which of these is the same as ' + fracHtml(5, 10) + '?'));
      var opts = U.shuffle([
        [1, 2],
        [2, 3],
        [add, 10],
        [1, 4],
      ]);
      ch = MQ.ui.choices(
        opts.map(function (f) {
          return { label: fracHtml(f[0], f[1]), value: f[0] + '/' + f[1] };
        }),
        function (v) {
          if (v === '1/2') {
            ch.mark(v, 'good');
            ch.disable();
            api.check(true, '5/10 = 1/2. The shading ends right under the half line!');
          } else {
            ch.mark(v, 'bad');
            if (v === add + '/10') api.check(false, 'That is only the boxes you just added. Count all the shaded boxes.', T_PART);
            else api.check(false, api.tries() ? 'Look at the halves strip above: the shading stops exactly under the end of one half.' : 'Look at the strip above the boxes. Where does the shading stop?', T_DIFF);
          }
        },
        { columns: 4 }
      );
      ch.classList.add('sw-fracchoices');
      area2.appendChild(ch);
    }
    api.onReveal(function () {
      boxes.forEach(function (r, i) {
        if (i >= q.start && i < q.total) {
          r.setAttribute('fill', '#ab47bc');
          r.setAttribute('data-on', '1');
        }
      });
      extra = add;
      step2();
      ch.mark('1/2', 'good');
      ch.disable();
      halves[0].setAttribute('fill-opacity', 1);
      g.appendChild(svg('line', { x1: X0 + W / 2, y1: 4, x2: X0 + W / 2, y2: y + RH + 16, stroke: '#e63946', 'stroke-width': 4 }));
      api.feedback('5 of the 10 boxes are shaded. They end exactly under 1 half: 5/10 = 1/2.', 'info');
    });
  }

  function renderPizza(stage, api, q) {
    var right = same(q.a[0], q.a[1], q.b[0], q.b[1]);
    stage.setAttribute('data-answer', right ? 'same' : 'different');
    api.say('Do both pizzas have the same amount shaded?', 'think');
    stage.appendChild(MQ.ui.prompt('Is ' + fracHtml(q.a[0], q.a[1]) + ' of this pizza the same as ' + fracHtml(q.b[0], q.b[1]) + ' of that one?'));
    var pp = pizzaPair(api, { n: q.a[0], d: q.a[1] }, { n: q.b[0], d: q.b[1] });
    stage.appendChild(pp.svg);
    stage.appendChild(pp.btn);
    var ch = MQ.ui.choices(
      [
        { label: '✓ Same amount', value: 'same' },
        { label: '✗ Different', value: 'different' },
      ],
      function (v) {
        if ((v === 'same') === right) {
          ch.mark(v, 'good');
          ch.disable();
          pp.overlay(true);
          api.check(true, right ? 'Yes! Laid on top, the shaded parts match: equivalent.' : 'Right! Laid on top, the shaded parts do not match.');
        } else {
          ch.mark(v, 'bad');
          if (right) api.check(false, api.tries() ? 'Press "Lay one on top". Does the blue shading cover the orange exactly?' : 'The numbers are different, but check the amounts. Try laying one on top.', T_DIFF);
          else api.check(false, api.tries() ? 'Press "Lay one on top". Look at the edges: does one shaded part stick out?' : 'Look carefully at the shaded parts. Lay one on top to check.', T_FALSE);
        }
      },
      { columns: 2 }
    );
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(right ? 'same' : 'different', 'good');
      ch.disable();
      pp.overlay(true);
      api.feedback(
        right
          ? 'Laid on top, the shaded parts cover each other exactly. ' + q.a.join('/') + ' = ' + q.b.join('/') + '.'
          : 'Laid on top, the shaded parts do not match, so ' + q.a.join('/') + ' and ' + q.b.join('/') + ' are different amounts.',
        'info'
      );
    });
  }

  MQ.register('fraction-strip-wall', {
    learn: [
      learnCover(1, 2, 4, 'Halves and quarters', '2 quarters fit under 1 half. 1/2 = 2/4!'),
      learnCover(1, 5, 10, 'Fifths and tenths', '2 tenths fit under 1 fifth. 1/5 = 2/10!'),
      learnLine,
    ],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        stage.setAttribute('data-sw-type', q.type);
        if (q.type === 'cover') renderCover(stage, api, q);
        else if (q.type === 'fill') renderFill(stage, api, q);
        else if (q.type === 'tf') renderTF(stage, api, q);
        else if (q.type === 'bigger') renderBigger(stage, api, q);
        else if (q.type === 'shade') renderShade(stage, api, q);
        else renderPizza(stage, api, q);
      },
    },
  });

  var css = [
    '.sw-svg{width:100%;max-width:700px;height:auto;display:block;user-select:none}',
    '.sw-wall{max-width:640px}',
    '.sw-pizzas{max-width:520px}',
    '.sw-piece.sw-lit{stroke:#e63946;stroke-width:4}',
    '.sw-box{cursor:pointer}',
    '.sw-box:hover{stroke:#e63946}',
    '.sw-pile{cursor:grab}',
    '.sw-placed{cursor:pointer}',
    '.sw-frac{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;line-height:1.05;font-weight:800;margin:0 4px}',
    '.sw-frac>span{padding:0 4px}',
    '.sw-frac>span+span{border-top:3px solid currentColor}',
    '.sw-out{font-size:1.5rem;font-weight:800;min-height:3.2rem;display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:4px;text-align:center}',
    '.sw-eqs{font-size:1.6rem;font-weight:800;margin:0 8px}',
    '.sw-eq{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px;font-size:1.7rem}',
    '.sw-eq .btn-check{margin-left:14px}',
    '.sw-whole{font-weight:800}',
    '.sw-in{width:64px;font-size:1.6rem;font-weight:800;text-align:center;border:3px solid var(--line);border-radius:10px;padding:2px 4px;margin-bottom:4px}',
    '.sw-in.sw-good{border-color:var(--good);background:var(--good-bg)}',
    '.sw-in.sw-bad{border-color:var(--try);background:var(--try-bg)}',
    '.sw-goals{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.sw-done{background:var(--good-bg);color:var(--good)}',
    '.sw-fracchoices .choice{font-size:1.5rem}',
    '.sw-step2{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'fraction-strip-wall' }, css));
})();

/* Where on the line? — place, read and estimate numbers on a 0–1000 number line marked
 * in hundreds (Unit 1.2, textbook p.18 Q5–Q6, workbook p.15 Q5, p.16 Q8).
 * The line is a street with a blue sign every 100 (no 50s marks anywhere, like the
 * workbook line). Everything is drawn to one scale: sc.X(value) gives the x of a value
 * and the pin's value is computed back from its x with sc.V(x), rounded to a whole number.
 * A 100-gap can open into a "zoom" panel with ten 10-steps.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var W = 900; // viewBox width of every line picture
  var L = 50; // x of 0 on the street
  var R = 850; // x of 1000 on the street
  var ZL = 90; // zoom line ends
  var ZR = 810;

  // Mistake tags (parent-readable)
  var T_TEN = 'Counted each mark as 10 not 100';
  var T_2D = 'Put a 2-digit number too far along';
  var T_WH = 'Estimate in the wrong hundred';
  var T_NEAR = 'Right hundred, but not close enough';
  var T_STEP1 = 'Counted each small step as 1, not 10';
  var T_END = 'Counted the steps from the wrong end';
  var T_NOH = 'Left out the hundreds';
  var T_RWH = 'Read the wrong hundred';
  var T_COUNT = 'Miscounted the steps of 10';
  var T_OFF = 'Gave a number that is not on the line';

  /* ---------------------------------------------------------------- *
   * Scale and drawing helpers
   * ---------------------------------------------------------------- */
  function scale(lo, hi, x0, x1) {
    var k = (x1 - x0) / (hi - lo);
    return {
      lo: lo,
      hi: hi,
      x0: x0,
      x1: x1,
      X: function (v) {
        return x0 + (v - lo) * k;
      },
      V: function (x) {
        return lo + (x - x0) / k;
      },
    };
  }

  function makeSvg(h, label) {
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + h, width: W, height: h, class: 'nl-svg', role: 'img', 'aria-label': label || 'Number line from 0 to 1000' });
    return root;
  }
  function setH(root, h) {
    root.setAttribute('viewBox', '0 0 ' + W + ' ' + h);
    root.setAttribute('height', h);
  }

  /** The 0–1000 street at height y. Returns { sc, y, back, front, gap(lo), ring(v) }. */
  function street(root, y, opts) {
    opts = opts || {};
    var sc = scale(0, 1000, L, R);
    var back = svg('g', { class: 'nl-back' });
    var mid = svg('g');
    var front = svg('g', { class: 'nl-front' });
    root.appendChild(back);
    root.appendChild(mid);
    root.appendChild(front);
    root.setAttribute('data-lo', 0);
    root.setAttribute('data-hi', 1000);
    root.setAttribute('data-x0', L);
    root.setAttribute('data-x1', R);
    root.setAttribute('data-y', y);
    if (opts.houses) {
      for (var hv = 100; hv <= 1000; hv += 100) {
        var hx = sc.X(hv);
        var top = y - 104;
        mid.appendChild(
          svg(
            'g',
            { class: 'nl-house' },
            svg('polygon', { points: hx - 19 + ',' + (top + 14) + ' ' + hx + ',' + top + ' ' + (hx + 19) + ',' + (top + 14), class: 'nl-roof' }),
            svg('rect', { x: hx - 15, y: top + 14, width: 30, height: 22, class: 'nl-wall' }),
            svg('rect', { x: hx - 4, y: top + 23, width: 8, height: 13, class: 'nl-door' })
          )
        );
      }
    }
    mid.appendChild(svg('line', { x1: L - 16, y1: y, x2: R + 16, y2: y, class: 'nl-road' }));
    for (var v = 0; v <= 1000; v += 100) {
      var x = sc.X(v);
      var bw = v === 1000 ? 54 : v === 0 ? 30 : 46;
      mid.appendChild(svg('line', { x1: x, y1: y - 16, x2: x, y2: y + 16, class: 'nl-tick' }));
      mid.appendChild(svg('rect', { x: x - bw / 2, y: y + 18, width: bw, height: 26, rx: 5, class: 'nl-board' }));
      mid.appendChild(svg('text', { x: x, y: y + 37, 'text-anchor': 'middle', class: 'nl-board-t' }, String(v)));
    }
    return {
      sc: sc,
      y: y,
      back: back,
      front: front,
      gap: function (lo) {
        var g = svg('rect', { x: sc.X(lo), y: y - 24, width: sc.X(lo + 100) - sc.X(lo), height: 48, rx: 8, class: 'nl-gap' });
        back.appendChild(g);
        return g;
      },
      ring: function (val) {
        var c = svg('circle', { cx: sc.X(val), cy: y, r: 20, class: 'nl-ring' });
        back.appendChild(c);
        return c;
      },
    };
  }

  /** One jump arc above a line at height y, from x1 to x2, with a label. */
  function arc(g, x1, x2, y, label, delay) {
    var h = Math.min(30, 8 + Math.abs(x2 - x1) * 0.35);
    var mx = (x1 + x2) / 2;
    var grp = svg('g', { class: 'nl-hop', style: delay ? { animationDelay: delay + 's' } : null });
    grp.appendChild(svg('path', { d: 'M' + x1 + ' ' + (y - 4) + ' Q' + mx + ' ' + (y - 4 - 2 * h) + ' ' + x2 + ' ' + (y - 4), class: 'nl-hop-p' }));
    grp.appendChild(svg('text', { x: mx, y: y - h - 12, 'text-anchor': 'middle', class: 'nl-hop-t' }, label));
    g.appendChild(grp);
    return grp;
  }
  /** Jumps of `step` from `from` towards `to`, the last one shorter if needed. */
  function hops(g, sc, y, from, to, step, pace) {
    var cur = from;
    var dir = to > from ? 1 : -1;
    var i = 0;
    while (cur !== to) {
      var nxt = Math.abs(to - cur) >= step ? cur + dir * step : to;
      arc(g, sc.X(cur), sc.X(nxt), y, (dir > 0 ? '+' : '−') + Math.abs(nxt - cur), pace ? i * pace : 0);
      cur = nxt;
      i++;
    }
  }

  /**
   * Zoom panel under a street: the gap lo..lo+100 opens into ten 10-steps.
   * opts.top = space above the zoom line inside the panel; opts.labels 'all' | 'ends';
   */
  function zoom(root, st, lo, opts) {
    opts = opts || {};
    var top = opts.top || 76;
    var panelTop = st.y + 62;
    var zy = panelTop + top;
    var bottom = zy + 48;
    var hi = lo + 100;
    var zsc = scale(lo, hi, ZL, ZR);
    var g = svg('g', { class: 'nl-zoom' });
    st.back.appendChild(svg('line', { x1: st.sc.X(lo), y1: st.y + 20, x2: 40, y2: panelTop, class: 'nl-zconn' }));
    st.back.appendChild(svg('line', { x1: st.sc.X(hi), y1: st.y + 20, x2: W - 40, y2: panelTop, class: 'nl-zconn' }));
    g.appendChild(svg('rect', { x: 40, y: panelTop, width: W - 80, height: bottom - panelTop, rx: 14, class: 'nl-zpanel' }));
    var segs = svg('g');
    g.appendChild(segs);
    g.appendChild(svg('line', { x1: ZL - 14, y1: zy, x2: ZR + 14, y2: zy, class: 'nl-zline' }));
    var hidden = [];
    for (var i = 0; i <= 10; i++) {
      var v = lo + i * 10;
      var x = zsc.X(v);
      var end = i === 0 || i === 10;
      g.appendChild(svg('line', { x1: x, y1: zy - (end ? 16 : 10), x2: x, y2: zy + (end ? 16 : 10), class: 'nl-ztick' + (end ? ' nl-ztick-end' : '') }));
      var t = svg('text', { x: x, y: zy + 36, 'text-anchor': 'middle', class: 'nl-zlab' + (end ? ' nl-zlab-end' : '') }, String(v));
      if (!end && opts.labels === 'ends') {
        t.classList.add('nl-zlab-hid');
        hidden.push(t);
      }
      g.appendChild(t);
    }
    var over = svg('g');
    g.appendChild(over);
    root.appendChild(g);
    setH(root, bottom + 8);
    return {
      sc: zsc,
      y: zy,
      g: g,
      segs: segs,
      over: over,
      showLabels: function () {
        hidden.forEach(function (t) {
          t.classList.remove('nl-zlab-hid');
        });
      },
    };
  }

  /** Red map pin. Its tip touches the line at the pin's value. */
  function makePin(parent, sc, y, opts) {
    opts = opts || {};
    var stem = opts.stem || 62;
    var r = opts.r || 18;
    var cy = y - stem - r + 6;
    var g = svg('g', { class: 'nl-pin' + (opts.fixed ? ' nl-pin-fixed' : ''), 'aria-label': 'Red pin' });
    if (!opts.fixed) {
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'slider');
    }
    g.appendChild(svg('rect', { x: -14, y: cy, width: 28, height: y - cy, class: 'nl-pin-hit' }));
    g.appendChild(svg('circle', { cx: 0, cy: cy, r: r + 12, class: 'nl-pin-hit' }));
    g.appendChild(svg('line', { x1: 0, y1: cy + r - 2, x2: 0, y2: y - 8, class: 'nl-pin-stem' }));
    g.appendChild(svg('polygon', { points: '-6,' + (y - 14) + ' 6,' + (y - 14) + ' 0,' + (y - 1), class: 'nl-pin-tip' }));
    g.appendChild(svg('circle', { cx: 0, cy: cy, r: r, class: 'nl-pin-head' }));
    if (!opts.fixed) {
      // a left-right grip so it is clear the head is the handle
      g.appendChild(svg('path', { d: 'M-5 ' + (cy - 6) + ' l-6 6 l6 6 M5 ' + (cy - 6) + ' l6 6 l-6 6', class: 'nl-pin-grip' }));
    }
    var label = svg('text', { x: 0, y: cy - r - 10, 'text-anchor': 'middle', class: 'nl-pin-val', visibility: 'hidden' }, '');
    g.appendChild(label);
    parent.appendChild(g);
    var val = sc.lo;
    var pin = {
      g: g,
      value: function () {
        return val;
      },
      set: function (v) {
        val = U.clamp(Math.round(v), sc.lo, sc.hi);
        var x = sc.X(val);
        g.setAttribute('transform', 'translate(' + x + ',0)');
        g.setAttribute('data-value', val);
        g.setAttribute('aria-valuenow', val);
        label.setAttribute('x', U.clamp(x, 60, W - 60) - x);
      },
      show: function (text, kind) {
        label.textContent = text;
        label.setAttribute('class', 'nl-pin-val' + (kind ? ' nl-pin-val-' + kind : ''));
        label.setAttribute('visibility', 'visible');
      },
      hide: function () {
        label.setAttribute('visibility', 'hidden');
      },
    };
    pin.set(opts.start == null ? sc.lo : opts.start);
    return pin;
  }

  /** Purple arrow pointing down at x on a line at height y. */
  function arrow(parent, x, y, len) {
    len = len || 76;
    var g = svg('g', { class: 'nl-arrow' });
    g.appendChild(svg('line', { x1: x, y1: y - len, x2: x, y2: y - 18, class: 'nl-arrow-l' }));
    g.appendChild(svg('polygon', { points: x - 10 + ',' + (y - 22) + ' ' + (x + 10) + ',' + (y - 22) + ' ' + x + ',' + (y - 3), class: 'nl-arrow-h' }));
    parent.appendChild(g);
    return g;
  }

  function dot(parent, x, y, text, ty) {
    parent.appendChild(svg('circle', { cx: x, cy: y, r: 8, class: 'nl-dot' }));
    if (text != null) parent.appendChild(svg('text', { x: x, y: ty == null ? y - 52 : ty, 'text-anchor': 'middle', class: 'nl-dot-t' }, String(text)));
  }

  function robotAt(parent, x, y, size) {
    var g = svg('g', { class: 'nl-bolt' });
    var r = MQ.robot('happy', size);
    r.setAttribute('x', -size / 2);
    r.setAttribute('y', y - size * 1.25 - 2);
    g.appendChild(r);
    g.style.transform = 'translate(' + x + 'px,0px)';
    parent.appendChild(g);
    return g;
  }

  /* ---------------------------------------------------------------- *
   * Deck
   * ---------------------------------------------------------------- */
  var TWO_DIGIT = [38, 46, 48, 48, 57, 64, 67, 74, 79, 83];

  function gen3() {
    var t = U.pick([1, 2, 3, 4, 6, 7, 8, 9]);
    return U.rand(1, 9) * 100 + t * 10 + U.rand(1, 9);
  }

  function buildDeck() {
    var used = {};
    var hund = {};
    function fresh(gen, ok) {
      for (var i = 0; i < 500; i++) {
        var v = gen();
        if (!used[v] && (!ok || ok(v))) {
          used[v] = 1;
          return v;
        }
      }
      throw new Error('number-line-1000: could not make a fresh number');
    }
    var q = [];
    // Level 1: place multiples of 100 and 50 (accept ±20)
    var a = fresh(function () {
      return U.rand(1, 9) * 100;
    });
    var b = fresh(function () {
      return U.rand(1, 9) * 100 + 50;
    });
    var c = fresh(function () {
      return U.rand(1, 19) * 50;
    });
    U.shuffle([a, b, c]).forEach(function (t) {
      q.push({ kind: 'place', t: t, tol: 20 });
    });
    // Level 2: place any 3-digit number (±30), read a pin on a zoomed hundred
    var p1 = fresh(gen3);
    hund[Math.floor(p1 / 100)] = 1;
    var p2 = fresh(gen3, function (v) {
      return !hund[Math.floor(v / 100)];
    });
    hund[Math.floor(p2 / 100)] = 1;
    var rd = fresh(
      function () {
        return U.rand(1, 9) * 100 + U.rand(1, 9) * 10;
      },
      function (v) {
        return !hund[Math.floor(v / 100)];
      }
    );
    q.push({ kind: 'place', t: p1, tol: 30 });
    q.push({ kind: 'read', t: rd, lo: Math.floor(rd / 100) * 100 });
    q.push({ kind: 'place', t: p2, tol: 30 });
    // Level 3: a 2-digit number near the start, then two arrows to estimate (±40)
    var two = fresh(function () {
      return U.pick(TWO_DIGIT);
    });
    var eh = U.shuffle(U.range(1, 9)).slice(0, 2);
    var e1 = fresh(function () {
      return eh[0] * 100 + U.rand(12, 88);
    });
    var e2 = fresh(function () {
      return eh[1] * 100 + U.rand(12, 88);
    });
    q.push({ kind: 'place', t: two, tol: 25 });
    q.push({ kind: 'estimate', t: e1, tol: 40 });
    q.push({ kind: 'estimate', t: e2, tol: 40 });
    return q;
  }

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */
  function learnStreet(stage, api) {
    api.say('This street goes from 0 to 1000. There is a sign every 100. Help me walk to number 438!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('A street from 0 to 1000', 'Each sign is <b>100</b> more than the one before.'));
    var root = makeSvg(226, 'A street from 0 to 1000 with a sign every 100');
    var y = 150;
    var st = street(root, y, { houses: true });
    var hopG = svg('g');
    st.front.appendChild(hopG);
    var halfG = svg('g', { visibility: 'hidden' });
    halfG.appendChild(svg('line', { x1: st.sc.X(450), y1: y - 12, x2: st.sc.X(450), y2: y + 56, class: 'nl-half' }));
    halfG.appendChild(svg('text', { x: st.sc.X(450) + 6, y: y + 70, 'text-anchor': 'middle', class: 'nl-half-t' }, 'halfway: 450'));
    st.front.appendChild(halfG);
    var bolt = robotAt(st.front, st.sc.X(0), y - 6, 34);
    var tag = svg('text', { x: st.sc.X(438), y: y - 56, 'text-anchor': 'middle', class: 'nl-dot-t', visibility: 'hidden' }, '438');
    st.front.appendChild(tag);
    var wrap = el('div', { class: 'nl-root' }, root);
    stage.appendChild(wrap);
    var step = 0;
    var btn = el('button', { class: 'btn nl-walk', type: 'button' }, 'Walk to the 400 sign ▶');
    btn.addEventListener('click', function () {
      if (btn.disabled) return;
      btn.disabled = true;
      api.sound('click');
      if (step === 0) {
        step = 1;
        bolt.style.transform = 'translate(' + st.sc.X(400) + 'px,0px)';
        hops(hopG, st.sc, y, 0, 400, 100, 0.35);
        api.say('100, 200, 300, 400. Four signs, and each one is 100 more.');
        api.feedback('438 has 4 hundreds, so first go to the 400 sign.', 'info');
        api.later(function () {
          btn.textContent = 'Walk on to 438 ▶';
          btn.disabled = false;
        }, 1500);
      } else {
        step = 2;
        bolt.style.transform = 'translate(' + st.sc.X(438) + 'px,0px)';
        halfG.setAttribute('visibility', 'visible');
        api.later(function () {
          tag.setAttribute('visibility', 'visible');
          api.say('Here is 438! Past the 400 sign, but a bit less than halfway to 500.', 'cheer');
          api.feedback('438 is between 400 and 500. Halfway is 450, and 438 is a bit before it.', 'good');
          btn.textContent = 'Done ✓';
          api.unlockNext();
        }, 1300);
      }
    });
    wrap.appendChild(btn);
  }

  function learnZoom(stage, api) {
    api.say('Let\'s zoom in! The gap from 400 to 500 opens up into ten small steps of 10.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Zoom in on one hundred', 'Click the small step where <b>438</b> lives.'));
    var root = makeSvg(260, 'The gap from 400 to 500 zoomed in');
    var st = street(root, 64);
    st.gap(400);
    var z = zoom(root, st, 400, { labels: 'all', top: 76 });
    var wrap = el('div', { class: 'nl-root', 'data-answer': 430 }, root);
    stage.appendChild(wrap);
    var done = false;
    for (var i = 0; i < 10; i++) {
      (function (slo) {
        var r = svg('rect', { x: z.sc.X(slo), y: z.y - 60, width: z.sc.X(slo + 10) - z.sc.X(slo), height: 104, class: 'nl-seg', 'data-lo': slo, role: 'button', 'aria-label': slo + ' to ' + (slo + 10) });
        r.addEventListener('click', function () {
          if (done) return;
          if (slo === 430) {
            done = true;
            r.classList.remove('nl-seg-bad');
            r.classList.add('nl-seg-good');
            root.classList.add('nl-locked');
            api.sound('correct');
            hops(z.over, z.sc, z.y, 400, 438, 10, 0.3);
            dot(z.over, z.sc.X(438), z.y, '438', z.y - 54);
            dot(st.front, st.sc.X(438), st.y);
            api.say('Yes! 438 is between 430 and 440: 3 tens, then 8 more.', 'cheer');
            api.feedback('From 400: 410, 420, 430, then 8 more ones makes 438.', 'good');
            api.unlockNext();
          } else {
            r.classList.add('nl-seg-bad');
            api.sound('wrong');
            api.feedback(
              'That step goes from ' + slo + ' to ' + (slo + 10) + '. 438 has 3 tens, so look for the step from 430 to 440.',
              'try'
            );
          }
        });
        z.segs.appendChild(r);
      })(400 + i * 10);
    }
  }

  function learnEstimate(stage, api) {
    var v = 268;
    api.say('The arrow has no number. Which two signs is it between? Then make a sensible guess.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Estimate', 'An estimate is a <b>sensible guess</b>. It does not have to be exact.'));
    var root = makeSvg(160, 'An arrow on the street between the 200 and 300 signs');
    var st = street(root, 100);
    st.gap(200);
    arrow(st.front, st.sc.X(v), st.y);
    var wrap = el('div', { class: 'nl-root', 'data-answer': 270 }, root);
    stage.appendChild(wrap);
    wrap.appendChild(el('div', { class: 'nl-cap' }, 'The arrow is between the 200 and 300 signs. About what number is it?'));
    var ch = MQ.ui.choices(
      U.shuffle([270, 370, 27]).map(function (n) {
        return { label: 'about ' + n, value: n };
      }),
      function (n) {
        if (n === 270) {
          ch.mark(n, 'good');
          ch.disable();
          api.sound('correct');
          var z = zoom(root, st, 200, { labels: 'all', top: 76 });
          arrow(z.over, z.sc.X(v), z.y, 56);
          api.say('Yes! It is past 200, a bit more than halfway to 300. About 270 is a sensible guess.', 'cheer');
          api.feedback('About 260 or about 280 would be sensible too. A good estimate is close, not exact.', 'good');
          api.unlockNext();
        } else {
          ch.mark(n, 'bad');
          api.sound('wrong');
          if (n === 27) api.feedback('27 is less than 100: that would be before the 100 sign. Each sign is 100, not 10.', 'try');
          else api.feedback('370 would be between the 300 and 400 signs. Our arrow is between 200 and 300.', 'try');
        }
      },
      { columns: 3 }
    );
    wrap.appendChild(ch);
  }

  /* ---------------------------------------------------------------- *
   * Practice
   * ---------------------------------------------------------------- */
  function whereInGap(t) {
    var off = t % 100;
    if (off === 50) return 'exactly halfway';
    if (off < 30) return 'just past the ' + (t - off) + ' sign';
    if (off < 50) return 'a bit less than halfway to ' + (t - off + 100);
    if (off <= 70) return 'a bit more than halfway to ' + (t - off + 100);
    return 'close to the ' + (t - off + 100) + ' sign';
  }

  function renderPlace(stage, api, q) {
    var t = q.t;
    var lo = Math.floor(t / 100) * 100;
    var two = t < 100;
    if (two) api.say(t + ' has only 2 digits. Where does it go?', 'think');
    else if (t % 100 === 0) api.say('Drag the red pin to ' + t + '. Use the signs!', 'think');
    else if (t % 50 === 0) api.say('Drag the pin to ' + t + '. There is no sign for it, so think!', 'think');
    else api.say('Which two signs is ' + t + ' between? Drag the pin there.', 'think');
    stage.appendChild(MQ.ui.prompt('Put the pin on <b class="nl-target">' + t + '</b>.'));
    var root = makeSvg(178);
    var st = street(root, 128);
    var hit = svg('rect', { x: L - 20, y: st.y - 26, width: R - L + 40, height: 74, class: 'nl-hit' });
    st.front.appendChild(hit);
    var pin = makePin(st.front, st.sc, st.y, { start: 0 });
    var wrap = el('div', { class: 'nl-root', 'data-kind': 'place', 'data-answer': t, 'data-tol': q.tol }, root);
    stage.appendChild(wrap);
    var moved = false;
    var locked = false;
    var marks = [];
    function clearMarks() {
      marks.forEach(function (m) {
        if (m.parentNode) m.parentNode.removeChild(m);
      });
      marks = [];
    }
    function moveTo(v) {
      if (locked) return;
      pin.set(v);
      moved = true;
      pin.hide();
    }
    var startX = 0;
    api.cleanup(
      MQ.ui.drag(root, pin.g, {
        start: function () {
          startX = st.sc.X(pin.value());
          if (!locked) pin.hide();
        },
        move: function (p, dx) {
          moveTo(st.sc.V(startX + dx));
        },
      })
    );
    hit.addEventListener('click', function (e) {
      moveTo(st.sc.V(MQ.ui.svgPoint(root, e).x));
    });
    pin.g.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      moveTo(pin.value() + d * (e.shiftKey ? 10 : 1));
    });

    var checkBtn = el('button', { class: 'btn nl-check', type: 'button' }, 'Check ✓');
    wrap.appendChild(el('div', { class: 'nl-row' }, checkBtn));
    checkBtn.addEventListener('click', function () {
      if (locked) return;
      if (!moved) {
        api.feedback('Drag the red pin along the street first.', 'info');
        return;
      }
      var p = pin.value();
      var strong = api.tries() >= 1;
      clearMarks();
      if (Math.abs(p - t) <= q.tol) {
        locked = true;
        root.classList.add('nl-locked');
        checkBtn.disabled = true;
        pin.show('Your pin: ' + p, 'good');
        api.check(true, p === t ? 'Spot on! Your pin is exactly on ' + t + '.' : 'Yes! Your pin is at ' + p + ', very close to ' + t + '.');
        return;
      }
      pin.show('Your pin: ' + p, 'bad');
      var hint;
      var tag;
      var pl = Math.floor(p / 100) * 100;
      if (two) {
        tag = T_2D;
        if (p >= 100) hint = t + ' has no hundreds, so it is less than 100. It goes before the 100 sign!';
        else hint = t + ' is between 0 and 100: ' + (t === 50 ? 'exactly halfway to the 100 sign.' : t < 50 ? 'a bit less than halfway to the 100 sign.' : 'past halfway to the 100 sign.');
        if (p < 100) tag = T_NEAR;
        if (strong) {
          hint += ' Look at the yellow gap from 0 to 100.';
          marks.push(st.gap(0));
        }
      } else if (Math.abs(p - t / 10) <= 15 && t / 10 < 100) {
        tag = T_TEN;
        hint = 'Each sign is 100 more, not 10. ' + t + ' is much further along: find the ' + (t % 100 === 0 ? t : lo) + ' sign.';
        if (strong) {
          hint = 'Count the signs: 100, 200, 300… Each one is 100. ' + (t % 100 === 0 ? 'Put the pin right on the ' + t + ' sign.' : t + ' is between the ' + lo + ' and ' + (lo + 100) + ' signs.');
          marks.push(t % 100 === 0 ? st.ring(t) : st.gap(lo));
        }
      } else if (t % 100 === 0) {
        tag = Math.abs(p - t) <= 50 ? T_NEAR : T_WH;
        hint = 'There is a sign for ' + t + '. Put the pin right on the ' + t + ' sign.';
        if (strong) {
          hint = 'Look for the yellow circle: that is the ' + t + ' sign. Drag the pin onto it.';
          marks.push(st.ring(t));
        }
      } else if (pl !== lo && !(p === lo + 100)) {
        tag = T_WH;
        hint = 'Your pin is between ' + pl + ' and ' + (pl + 100) + '. ' + t + ' is between the ' + lo + ' and ' + (lo + 100) + ' signs.';
        if (strong) {
          hint = t + ' has ' + lo / 100 + ' hundreds, so it goes in the yellow gap: ' + whereInGap(t) + '.';
          marks.push(st.gap(lo));
        }
      } else {
        tag = T_NEAR;
        hint = 'Right gap! Now look closer: ' + t + ' is ' + whereInGap(t) + '. Move the pin a bit to the ' + (p < t ? 'right.' : 'left.');
        if (strong) {
          hint = 'Halfway between ' + lo + ' and ' + (lo + 100) + ' is ' + (lo + 50) + '. ' + t + ' is ' + whereInGap(t) + '. Move it ' + (p < t ? 'right.' : 'left.');
          marks.push(st.gap(lo));
        }
      }
      api.check(false, hint, tag);
    });

    api.onReveal(function () {
      locked = true;
      root.classList.add('nl-locked');
      checkBtn.disabled = true;
      clearMarks();
      if (moved && pin.value() !== t) {
        var gx = st.sc.X(pin.value());
        st.back.appendChild(svg('polygon', { points: gx - 8 + ',' + (st.y - 26) + ' ' + (gx + 8) + ',' + (st.y - 26) + ' ' + gx + ',' + (st.y - 12), class: 'nl-ghost' }));
      }
      pin.set(t);
      pin.show(String(t), 'good');
      if (t % 100 === 0) {
        st.ring(t);
        var hg = svg('g');
        st.front.insertBefore(hg, st.front.firstChild);
        hops(hg, st.sc, st.y, 0, t, 100, 0.2);
        api.feedback('Count the signs in hundreds: ' + U.range(1, t / 100).map(function (k) {
          return k * 100;
        }).join(', ') + '. The pin goes right on the ' + t + ' sign.', 'info');
        return;
      }
      st.gap(lo);
      var z = zoom(root, st, lo, { labels: 'all', top: 80 });
      var near = t - lo <= 50 ? lo : lo + 100;
      if (lo === 0) near = t <= 50 ? 0 : 100;
      hops(z.over, z.sc, z.y, near, t, 10, 0.25);
      dot(z.over, z.sc.X(t), z.y, t, z.y - 54);
      var d = Math.abs(t - near);
      api.feedback(
        t + ' is between ' + lo + ' and ' + (lo + 100) + '. Start at the ' + near + ' sign and count ' + (near < t ? 'on ' : 'back ') + d + '.',
        'info'
      );
    });
  }

  function renderRead(stage, api, q) {
    var a = q.t;
    var lo = q.lo;
    var hi = lo + 100;
    var k = (a - lo) / 10;
    api.say('This part of the street is zoomed in. Count the small steps from ' + lo + '.', 'think');
    stage.appendChild(MQ.ui.prompt('What number is the pin on?'));
    var root = makeSvg(260);
    var st = street(root, 40);
    st.gap(lo);
    var z = zoom(root, st, lo, { labels: 'ends', top: 104 });
    var pin = makePin(z.over, z.sc, z.y, { fixed: true, stem: 54, r: 14, start: a });
    var wrap = el('div', { class: 'nl-root', 'data-kind': 'read', 'data-answer': a }, root);
    stage.appendChild(wrap);
    wrap.appendChild(el('div', { class: 'nl-cap' }, 'Each small step is 10.'));
    var inp = MQ.ui.numberInput({
      onSubmit: function (e) {
        if (e === a) {
          inp.good();
          inp.disable();
          z.showLabels();
          pin.show(String(a), 'good');
          api.check(true, 'Yes! The pin is on ' + a + '.');
          return;
        }
        inp.bad();
        var strong = api.tries() >= 1;
        var hint;
        var tag;
        if (e === lo + k) {
          tag = T_STEP1;
          hint = 'Each small step is 10, not 1. Count on in tens from ' + lo + ': ' + (lo + 10) + ', ' + (lo + 20) + '…';
        } else if (k !== 5 && e === hi - (a - lo)) {
          tag = T_END;
          hint = 'Start counting at ' + lo + ' on the left, not at ' + hi + '. The numbers get bigger as you go right.';
        } else if (e === a - lo) {
          tag = T_NOH;
          hint = 'The pin is past the ' + lo + ' sign, so the number has ' + lo / 100 + ' hundreds. It starts with ' + lo / 100 + '.';
        } else if (Math.floor(e / 100) * 100 !== lo) {
          tag = T_RWH;
          hint = 'The pin is between ' + lo + ' and ' + hi + ', so the number must be between ' + lo + ' and ' + hi + '.';
        } else {
          tag = T_COUNT;
          hint = 'Nearly! Point at each small step and count on in tens from ' + lo + '.';
        }
        if (strong) {
          hint = 'Start at ' + lo + '. Count one ten for each small step: ' + (lo + 10) + ', ' + (lo + 20) + ', ' + (lo + 30) + '… Stop at the pin.';
        }
        api.check(false, hint, tag);
      },
    });
    wrap.appendChild(inp.el);
    inp.focus();
    api.onReveal(function () {
      inp.disable();
      inp.setValue(a);
      inp.good();
      z.showLabels();
      hops(z.over, z.sc, z.y, lo, a, 10, 0.25);
      pin.show(String(a), 'good');
      api.feedback(k + ' small steps of 10 from ' + lo + ': ' + U.range(1, k).map(function (i) {
        return lo + i * 10;
      }).join(', ') + '. The pin is on ' + a + '.', 'info');
    });
  }

  function renderEstimate(stage, api, q) {
    var v = q.t;
    var lo = Math.floor(v / 100) * 100;
    var hi = lo + 100;
    var about = Math.round(v / 10) * 10;
    api.say('Which two signs is the arrow between? Then make a sensible guess.', 'think');
    stage.appendChild(MQ.ui.prompt('Estimate: about what number is the arrow pointing to?'));
    var root = makeSvg(160);
    var st = street(root, 104);
    arrow(st.front, st.sc.X(v), st.y);
    var wrap = el('div', { class: 'nl-root', 'data-kind': 'estimate', 'data-answer': v, 'data-tol': q.tol }, root);
    stage.appendChild(wrap);
    var marks = [];
    var inp = MQ.ui.numberInput({
      prefix: 'about',
      onSubmit: function (e) {
        marks.forEach(function (m) {
          if (m.parentNode) m.parentNode.removeChild(m);
        });
        marks = [];
        if (e >= 0 && e <= 1000 && Math.abs(e - v) <= q.tol) {
          inp.good();
          inp.disable();
          api.check(true, 'Good estimate! The arrow is at about ' + about + '.');
          return;
        }
        inp.bad();
        var strong = api.tries() >= 1;
        var hint;
        var tag;
        if (e < 0 || e > 1000 || e !== Math.floor(e)) {
          tag = T_OFF;
          hint = 'This street goes from 0 to 1000. Your estimate must be a whole number between ' + lo + ' and ' + hi + '.';
        } else if (Math.abs(e - v / 10) <= 15) {
          tag = T_TEN;
          hint = 'Each sign is 100, not 10. The arrow is past the ' + lo + ' sign, so it is more than ' + lo + '.';
        } else if (Math.floor(e / 100) * 100 !== lo && e !== hi) {
          tag = T_WH;
          hint = 'The arrow is between the ' + lo + ' and ' + hi + ' signs, so your estimate should be between ' + lo + ' and ' + hi + '.';
        } else {
          tag = T_NEAR;
          hint = 'Right hundred! Is the arrow nearer ' + lo + ', nearer ' + hi + ', or about halfway? Try a ' + (e < v ? 'bigger' : 'smaller') + ' number.';
        }
        if (strong) {
          marks.push(st.gap(lo));
          hint = 'Look at the yellow gap from ' + lo + ' to ' + hi + '. Halfway is ' + (lo + 50) + '. The arrow is ' + whereInGap(v).replace('exactly halfway', 'about halfway') + '.';
        }
        api.check(false, hint, tag);
      },
    });
    wrap.appendChild(inp.el);
    inp.focus();
    api.onReveal(function () {
      inp.disable();
      inp.setValue(about);
      inp.good();
      st.gap(lo);
      var z = zoom(root, st, lo, { labels: 'all', top: 84 });
      arrow(z.over, z.sc.X(v), z.y, 50);
      var near = v - lo <= 50 ? lo : hi;
      hops(z.over, z.sc, z.y, near, about, 10, 0.25);
      api.feedback('The arrow is between ' + lo + ' and ' + hi + '. Zoom in: it is close to ' + about + '. Any guess near ' + about + ' is sensible.', 'info');
    });
  }

  var deck = null;

  MQ.register('number-line-1000', {
    learn: [learnStreet, learnZoom, learnEstimate],
    practice: {
      count: 9,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.kind === 'place') renderPlace(stage, api, q);
        else if (q.kind === 'read') renderRead(stage, api, q);
        else renderEstimate(stage, api, q);
      },
    },
  });

  var css = [
    '.nl-root{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.nl-svg{display:block;width:100%;max-width:900px;height:auto;user-select:none;-webkit-user-select:none}',
    '.nl-svg text{pointer-events:none}',
    '.nl-road{stroke:#7d879c;stroke-width:8;stroke-linecap:round}',
    '.nl-tick{stroke:var(--ink);stroke-width:3}',
    '.nl-board{fill:#2f6fb3;stroke:#1f4f85;stroke-width:1.5}',
    '.nl-board-t{fill:#fff;font-size:17px;font-weight:800}',
    '.nl-gap{fill:#ffe9a8;stroke:#e0a100;stroke-width:2}',
    '.nl-ring{fill:#ffe9a8;stroke:#e0a100;stroke-width:4}',
    '.nl-roof{fill:#d9644a}',
    '.nl-wall{fill:#fbe7cf;stroke:#c98b4a;stroke-width:1.5}',
    '.nl-door{fill:#8a5a32}',
    '.nl-bolt{transition:transform 1.3s ease-in-out}',
    '.nl-hit{fill:transparent;cursor:pointer}',
    '.nl-locked .nl-hit,.nl-locked .nl-pin{cursor:default!important}',
    '.nl-pin{cursor:grab;outline:none}',
    '.nl-pin.dragging{cursor:grabbing}',
    '.nl-pin-hit{fill:transparent}',
    '.nl-pin-stem{stroke:#b03024;stroke-width:4}',
    '.nl-pin-tip{fill:#b03024}',
    '.nl-pin-head{fill:#e74c3c;stroke:#fff;stroke-width:3}',
    '.nl-pin:focus-visible .nl-pin-head,.nl-pin:hover .nl-pin-head,.nl-pin.dragging .nl-pin-head{stroke:#1b2a4a}',
    '.nl-locked .nl-pin:hover .nl-pin-head{stroke:#fff}',
    '.nl-pin-grip{fill:none;stroke:#fff;stroke-width:3;stroke-linecap:round;stroke-linejoin:round}',
    '.nl-pin-val{font-size:22px;font-weight:800;fill:var(--ink);paint-order:stroke;stroke:#fff;stroke-width:5px}',
    '.nl-pin-val-good{fill:#1d7a46}',
    '.nl-pin-val-bad{fill:#c25400}',
    '.nl-ghost{fill:#9aa6c4}',
    '.nl-arrow-l{stroke:#6a2c91;stroke-width:5;stroke-linecap:round}',
    '.nl-arrow-h{fill:#6a2c91}',
    '.nl-hop{animation:nl-fade .35s ease both}',
    '.nl-hop-p{fill:none;stroke:#e07a00;stroke-width:3}',
    '.nl-hop-t{font-size:15px;font-weight:800;fill:#b35f00;paint-order:stroke;stroke:#fff;stroke-width:4px}',
    '@keyframes nl-fade{from{opacity:0}to{opacity:1}}',
    '.nl-zpanel{fill:#f5f8ff;stroke:var(--line);stroke-width:2}',
    '.nl-zconn{stroke:#a9b5d6;stroke-width:2;stroke-dasharray:6 5}',
    '.nl-zline{stroke:var(--ink);stroke-width:4;stroke-linecap:round}',
    '.nl-ztick{stroke:var(--ink);stroke-width:2}',
    '.nl-ztick-end{stroke-width:3.5}',
    '.nl-zlab{font-size:17px;font-weight:700;fill:var(--ink-soft)}',
    '.nl-zlab-end{font-size:20px;font-weight:800;fill:var(--ink)}',
    '.nl-zlab-hid{visibility:hidden}',
    '.nl-seg{fill:transparent;cursor:pointer}',
    '.nl-seg:hover{fill:rgba(46,196,182,.16)}',
    '.nl-seg-bad,.nl-seg-bad:hover{fill:rgba(231,111,0,.16)}',
    '.nl-seg-good,.nl-seg-good:hover{fill:rgba(46,160,90,.24)}',
    '.nl-locked .nl-seg{cursor:default}',
    '.nl-dot{fill:#e07a00;stroke:#fff;stroke-width:2}',
    '.nl-dot-t{font-size:20px;font-weight:800;fill:#b35f00;paint-order:stroke;stroke:#fff;stroke-width:5px}',
    '.nl-half{stroke:#6a2c91;stroke-width:2;stroke-dasharray:5 4}',
    '.nl-half-t{font-size:15px;font-weight:800;fill:#6a2c91}',
    '.nl-row{display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap}',
    '.nl-check{font-size:1.2rem;padding-left:28px;padding-right:28px}',
    '.prompt .nl-target{color:#c0392b}',
    '.nl-cap{font-weight:700;color:var(--ink-soft);text-align:center}',
    '.nl-walk{font-size:1.15rem}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'number-line-1000' }, css));
})();

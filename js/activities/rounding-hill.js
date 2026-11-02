/* Rounding hill — round 3-digit numbers to the nearest 10 and 100, and estimate with a
 * range (Unit 1.3, textbook p.20–23, workbook p.18–22).
 * A number ball sits on a hill between two tens (or two hundreds). The top of the hill
 * is exactly halfway. Before the top it rolls back; on the top or past it, it rolls on.
 * Everything is drawn to one scale: X(value) gives the x of a value along the hill.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  // Mistake tags (parent-readable, from the unit notes)
  var T_DIGIT = 'Looked at the wrong digit';
  var T_FIVE = 'Rounded 5 down';
  var T_KEEP = 'Changed digits that should stay';
  var T_CROSS = 'Trouble crossing a hundred';
  var T_TWICE = 'Rounded twice';
  var T_EST = 'Estimate far too big or small';
  var T_WAY = 'Rolled the wrong way (picked the further end)';
  var T_NOT = 'Did not round to a ten or hundred';
  var T_SAME = 'Mixed up nearest 10 and nearest 100';
  var T_HUND = 'Estimate in the wrong hundred';

  /** Round a whole number to the nearest step (10 or 100). Halfway rounds up. */
  function roundTo(n, step) {
    return Math.floor((n + step / 2) / step) * step;
  }

  /* ------------------------------------------------------------------ *
   * The hill (SVG, drawn to scale)
   * ------------------------------------------------------------------ */
  var HW = 900; // viewBox width
  var HH = 304; // viewBox height
  var GY = 228; // ground line
  var X0 = 130; // x of the low end
  var X1 = 770; // x of the high end
  var HT = 140; // hill height
  var BR = 27; // ball radius

  function Y(x) {
    var t = (x - X0) / (X1 - X0);
    if (t <= 0 || t >= 1) return GY;
    return GY - HT * 0.5 * (1 - Math.cos(2 * Math.PI * t));
  }
  function slope(x) {
    var t = (x - X0) / (X1 - X0);
    if (t <= 0 || t >= 1) return 0;
    return -((HT * Math.PI) / (X1 - X0)) * Math.sin(2 * Math.PI * t);
  }

  /** Run step(t) for t from 0..1 over ms, using api.later. Returns a cancel function. */
  function animate(api, ms, step, done) {
    var frames = Math.max(1, Math.round(ms / 30));
    var i = 0;
    var stopped = false;
    function tick() {
      if (stopped) return;
      i++;
      step(Math.min(1, i / frames));
      if (i < frames) api.later(tick, 30);
      else if (done) done();
    }
    step(0);
    api.later(tick, 30);
    return function () {
      stopped = true;
    };
  }

  /**
   * makeHill({ lo, hi, api, pre, suf, labels: 'all'|'ends', half: bool, hideHi: bool })
   * Returns { svg, X, place(v, text), drop(v, text, cb), roll(to, cb), markEnd(v, kind),
   *           showLabels(), showHalf(), revealHi() }
   */
  function makeHill(o) {
    var api = o.api;
    var lo = o.lo;
    var hi = o.hi;
    var span = hi - lo;
    var mid = lo + span / 2;
    var minor = span / 10;
    var pre = o.pre || '';
    var suf = o.suf ? ' ' + o.suf : '';
    function X(v) {
      return X0 + ((v - lo) / span) * (X1 - X0);
    }
    var root = svg('svg', {
      viewBox: '0 0 ' + HW + ' ' + HH,
      width: HW,
      height: HH,
      class: 'rh-svg',
      role: 'img',
      'aria-label': 'A hill from ' + pre + lo + suf + ' to ' + pre + hi + suf + ' with its top at ' + mid,
      'data-lo': lo,
      'data-hi': hi,
      'data-x0': X0,
      'data-x1': X1,
    });

    // hill and ground
    var pts = [];
    for (var px = X0; px <= X1 + 0.01; px += 5) pts.push(px.toFixed(1) + ' ' + Y(px).toFixed(1));
    root.appendChild(svg('rect', { x: 14, y: GY, width: HW - 28, height: 9, rx: 4, class: 'rh-ground' }));
    root.appendChild(svg('path', { d: 'M14 ' + GY + ' L' + pts.join(' L') + ' L' + (HW - 14) + ' ' + GY + ' Z', class: 'rh-hill' }));
    root.appendChild(svg('path', { d: 'M14 ' + GY + ' L' + pts.join(' L') + ' L' + (HW - 14) + ' ' + GY, class: 'rh-hill-edge' }));

    // halfway line at the top
    var xm = X(mid);
    root.appendChild(svg('line', { x1: xm, y1: Y(xm) + 4, x2: xm, y2: GY - 2, class: 'rh-half' }));
    var halfT = svg('text', { x: xm, y: GY + 72, 'text-anchor': 'middle', class: 'rh-half-t' + (o.half ? '' : ' rh-hid') }, '▲ top of the hill = halfway');
    root.appendChild(halfT);

    // ticks and labels
    var minorLbls = [];
    var plates = {};
    var midPill = null;
    for (var i = 0; i <= 10; i++) {
      var v = lo + i * minor;
      var x = X(v);
      var end = i === 0 || i === 10;
      root.appendChild(svg('line', { x1: x, y1: GY + 4, x2: x, y2: GY + (end ? 14 : i === 5 ? 16 : 11), class: 'rh-tick' }));
      if (end) {
        var txt = pre + v + suf;
        var hidden = i === 10 && o.hideHi;
        var w = Math.max(70, 13 * txt.length + 24);
        var pg = svg('g', { class: 'rh-plate-g', 'data-value': v });
        pg.appendChild(svg('rect', { x: x - w / 2, y: GY + 16, width: w, height: 40, rx: 9, class: 'rh-plate' }));
        var pt = svg('text', { x: x, y: GY + 44, 'text-anchor': 'middle', class: 'rh-plate-t' }, hidden ? '?' : txt);
        pg.appendChild(pt);
        pg.text = pt;
        pg.full = txt;
        plates[v] = pg;
        root.appendChild(pg);
      } else if (i === 5) {
        var mg = svg('g', { class: 'rh-mid' + (o.half || o.labels === 'all' ? '' : ' rh-hid') });
        mg.appendChild(svg('rect', { x: x - 30, y: GY + 18, width: 60, height: 26, rx: 13, class: 'rh-mid-pill' }));
        mg.appendChild(svg('text', { x: x, y: GY + 37, 'text-anchor': 'middle', class: 'rh-mid-t' }, String(v)));
        root.appendChild(mg);
        midPill = mg;
      } else {
        var lt = svg('text', { x: x, y: GY + 36, 'text-anchor': 'middle', class: 'rh-tl' + (o.labels === 'all' ? '' : ' rh-hid') }, String(v));
        minorLbls.push(lt);
        root.appendChild(lt);
      }
    }

    // ball
    var dropLine = svg('line', { class: 'rh-dropline', visibility: 'hidden' });
    var ball = svg('g', { class: 'rh-ball', visibility: 'hidden' });
    ball.appendChild(svg('circle', { cx: 0, cy: 0, r: BR, class: 'rh-ball-c' }));
    ball.appendChild(svg('circle', { cx: -9, cy: -11, r: 6, class: 'rh-ball-shine' }));
    var ballT = svg('text', { x: 0, y: 6, 'text-anchor': 'middle', class: 'rh-ball-t' }, '');
    ball.appendChild(ballT);
    root.appendChild(dropLine);
    root.appendChild(ball);

    var cur = null;
    var token = 0;
    function setPos(v, yOver) {
      var x = X(v);
      var d = slope(x);
      var len = Math.sqrt(1 + d * d);
      var bx = x + (BR * d) / len;
      var by = Y(x) - BR / len;
      if (yOver != null) {
        bx = x;
        by = Math.min(yOver, by);
      }
      ball.setAttribute('transform', 'translate(' + bx.toFixed(2) + ',' + by.toFixed(2) + ')');
      dropLine.setAttribute('x1', x);
      dropLine.setAttribute('x2', x);
      dropLine.setAttribute('y1', Y(x) + 2);
      dropLine.setAttribute('y2', GY + 4);
    }
    function setText(t) {
      ballT.textContent = t;
      ballT.setAttribute('class', 'rh-ball-t' + (String(t).length >= 4 ? ' rh-ball-t-s' : ''));
    }

    var h = {
      svg: root,
      X: X,
      lo: lo,
      hi: hi,
      mid: mid,
      place: function (v, text) {
        token++;
        cur = v;
        setText(text == null ? v : text);
        setPos(v);
        ball.setAttribute('visibility', 'visible');
        dropLine.setAttribute('visibility', 'visible');
        root.setAttribute('data-ball', v);
      },
      drop: function (v, text, cb) {
        var my = ++token;
        cur = v;
        setText(text == null ? v : text);
        ball.setAttribute('visibility', 'visible');
        dropLine.setAttribute('visibility', 'hidden');
        root.setAttribute('data-ball', v);
        var x = X(v);
        var rest = Y(x) - BR;
        var top = BR + 2;
        animate(
          api,
          420,
          function (t) {
            if (my !== token) return;
            setPos(v, top + (rest - top) * t * t);
          },
          function () {
            if (my !== token) return;
            setPos(v);
            dropLine.setAttribute('visibility', 'visible');
            if (cb) cb();
          }
        );
      },
      roll: function (to, cb) {
        var my = ++token;
        var from = cur;
        dropLine.setAttribute('visibility', 'hidden');
        function go() {
          animate(
            api,
            900,
            function (t) {
              if (my !== token) return;
              var e = t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
              setPos(from + (to - from) * e);
            },
            function () {
              if (my !== token) return;
              cur = to;
              setPos(to);
              root.setAttribute('data-ball', to);
              if (cb) cb();
            }
          );
        }
        if (from === mid && to === hi) {
          // a wobble on the very top, then it tips forward
          animate(
            api,
            600,
            function (t) {
              if (my !== token) return;
              setPos(mid + minor * 0.12 * Math.sin(t * 4 * Math.PI) * (1 - t));
            },
            go
          );
        } else go();
      },
      markEnd: function (v, kind) {
        var g = plates[v];
        if (!g) return;
        g.classList.remove('good', 'bad');
        g.classList.add(kind);
      },
      showLabels: function () {
        minorLbls.forEach(function (t) {
          t.classList.remove('rh-hid');
        });
        midPill.classList.remove('rh-hid');
      },
      showHalf: function () {
        halfT.classList.remove('rh-hid');
        midPill.classList.remove('rh-hid');
      },
      revealHi: function () {
        var g = plates[hi];
        g.text.textContent = g.full;
      },
    };
    return h;
  }

  /* ------------------------------------------------------------------ *
   * Diagnosing a wrong rounding answer: { tag, hint }
   * q = { n, step, lo, hi, ans, pre, suf, hideHi, cross }; t = wrong tries so far
   * ------------------------------------------------------------------ */
  function fmtV(q, v) {
    return (q.pre || '') + v + (q.suf ? ' ' + q.suf : '');
  }
  function diagnose(q, a, t) {
    var n = q.n;
    var s = q.step;
    var lo = q.lo;
    var hi = q.hi;
    var mid = lo + s / 2;
    var N = fmtV(q, n);
    var L = fmtV(q, lo);
    var Hh = q.hideHi && !t ? 'the next ' + (s === 10 ? 'ten' : 'hundred') : fmtV(q, hi);
    var digit = s === 10 ? n % 10 : Math.floor(n / 10) % 10;
    var dname = s === 10 ? 'ones' : 'tens';
    var where = n < mid ? 'before the top (' + mid + '), so it rolls back to ' + L : n === mid ? 'exactly on the top (' + mid + '), so it rolls on to ' + Hh : 'past the top (' + mid + '), so it rolls on to ' + Hh;
    var between = N + ' is between ' + L + ' and ' + Hh + '. ';

    if (a === n) {
      return { tag: T_NOT, hint: t ? between + 'It is ' + where + '.' : 'That is the number itself. Rounding means rolling to the nearest ' + (s === 10 ? 'ten' : 'hundred') + '.' };
    }
    // halfway rounded down
    if (n === mid && a === lo) {
      return {
        tag: T_FIVE,
        hint: t
          ? (s === 10 ? 'A ones digit of 5' : 'A tens digit of 5 (with 0 ones)') + ' means exactly halfway. Halfway rounds UP, to ' + Hh + '.'
          : N + ' is exactly on the top of the hill. A ball on the top rolls on!',
      };
    }
    // crossing a hundred (or into 1000)
    if (q.cross && (a === lo || a > 1000 || (s === 10 && a % 10 === 0 && a !== hi && Math.floor(a / 100) === Math.floor(n / 100)))) {
      var nextOf = s === 10 ? lo + ' + 10' : lo + ' + 100';
      return {
        tag: T_CROSS,
        hint: t
          ? nextOf + ' = ' + hi + '. ' + (s === 10 ? 'Ten tens make a new hundred' : 'Ten hundreds make a thousand') + ', so it rolls on to ' + fmtV(q, hi) + '.'
          : N + ' is ' + (n === mid ? 'on' : 'past') + ' the top, so it rolls on to the next ' + (s === 10 ? 'ten' : 'hundred') + ' after ' + L + '. What is ' + (s === 10 ? '10' : '100') + ' more than ' + lo + '?',
      };
    }
    // rounded to the nearest 10 first, then to 100 (645 -> 650 -> 700)
    if (s === 100 && a === roundTo(roundTo(n, 10), 100) && a !== q.ans) {
      return {
        tag: T_TWICE,
        hint: t
          ? 'The tens digit of ' + n + ' is ' + digit + ', so it is ' + where + '. Do not round twice.'
          : 'Did you round to the nearest 10 first? Do not! Look at ' + N + ' itself: is it past the top (' + mid + ')?',
      };
    }
    // nearest 100 but answered the nearest 10
    if (s === 100 && a === roundTo(n, 10) && a % 100 !== 0) {
      return {
        tag: T_DIGIT,
        hint: t ? between + 'Look at the tens digit, ' + digit + ': it is ' + where + '.' : 'That is the nearest 10. To the nearest 100 the answer ends in 00. Look at the tens digit.',
      };
    }
    // nearest 10 but changed the hundreds / gave the nearest 100
    if (s === 10 && a === roundTo(n, 100) && a !== q.ans) {
      return {
        tag: T_KEEP,
        hint: t ? between + 'It is ' + where + '.' : 'To the nearest 10, only the tens and ones change. Which two tens is ' + N + ' between?',
      };
    }
    // the other end of the hill
    if (a === lo || a === hi) {
      if (s === 100 && (n % 10 >= 5 ? hi : lo) === a) {
        return {
          tag: T_DIGIT,
          hint: t ? 'The tens digit is ' + digit + '. ' + N + ' is ' + where + '.' : 'For the nearest 100, look at the TENS digit (' + digit + '), not the ones digit.',
        };
      }
      return {
        tag: T_WAY,
        hint: t ? N + ' is ' + where + '.' : 'Look at the ' + dname + ' digit: ' + digit + '. Is the ball before the top of the hill, or past it?',
      };
    }
    if (a % s !== 0) {
      return {
        tag: s === 100 && a % 10 === 0 ? T_DIGIT : T_NOT,
        hint: (s === 10 ? 'Rounded to the nearest 10, a number ends in 0. ' : 'Rounded to the nearest 100, a number ends in 00. ') + between + (t ? 'It is ' + where + '.' : 'Which end does it roll to?'),
      };
    }
    return { tag: T_KEEP, hint: between + 'The answer must be one of those two. ' + (t ? 'It is ' + where + '.' : 'Keep the digits in front the same.') };
  }

  /* ------------------------------------------------------------------ *
   * Practice deck
   * ------------------------------------------------------------------ */
  function roundQ(n, step, extra) {
    var lo = Math.floor(n / step) * step;
    var q = { type: 'round', n: n, step: step, lo: lo, hi: lo + step, ans: roundTo(n, step) };
    q.cross = (step === 10 && q.hi % 100 === 0) || (step === 100 && q.hi === 1000);
    if (extra) Object.keys(extra).forEach(function (k) {
      q[k] = extra[k];
    });
    return q;
  }

  function buildDeck() {
    var used = {};
    function uniq(fn) {
      for (var k = 0; k < 300; k++) {
        var q = fn();
        var key = q.key || q.n;
        if (!used[key]) {
          used[key] = true;
          return q;
        }
      }
      throw new Error('rounding-hill: could not make a unique question');
    }
    var deck = [];

    // Level 1: nearest 10, 100–999, not crossing a hundred, ones digit never 5 (or 0)
    var dirs = U.shuffle(['down', 'up', U.pick(['down', 'up'])]);
    var usedTens = {};
    dirs.forEach(function (dir) {
      deck.push(
        uniq(function () {
          var n;
          do {
            var H = U.rand(1, 9);
            var T = dir === 'up' ? U.rand(0, 8) : U.rand(1, 9);
            var o = dir === 'up' ? U.pick([6, 7, 8, 9]) : U.pick([1, 2, 3, 4]);
            n = H * 100 + T * 10 + o;
          } while (usedTens[Math.floor(n / 10)]);
          usedTens[Math.floor(n / 10)] = true;
          return roundQ(n, 10, { kind: 'l1' });
        })
      );
    });

    // Level 2: nearest 100 — halfway (350), ends in 0 (740), ends in 5 (385)
    var l2 = [
      uniq(function () {
        return roundQ(U.rand(1, 8) * 100 + 50, 100, { kind: 'half' });
      }),
      uniq(function () {
        return roundQ(U.rand(1, 8) * 100 + U.pick([1, 2, 3, 4, 6, 7, 8, 9]) * 10, 100, { kind: 'zero' });
      }),
      uniq(function () {
        return roundQ(U.rand(1, 8) * 100 + U.pick([1, 2, 3, 6, 7, 8]) * 10 + 5, 100, { kind: 'five' });
      }),
    ];
    deck = deck.concat(U.shuffle(l2));

    // Level 3: four different types out of five
    var makers = {
      cross: function () {
        return uniq(function () {
          if (Math.random() < 0.5) return roundQ(U.rand(1, 9) * 100 + 90 + U.rand(5, 9), 10, { kind: 'cross', hideHi: true });
          return roundQ(U.rand(950, 999), 100, { kind: 'cross', hideHi: true });
        });
      },
      money: function () {
        return uniq(function () {
          if (Math.random() < 0.5) {
            var H = U.rand(1, 9);
            var n = Math.random() < 0.5 ? H * 100 + 90 + U.rand(5, 9) : H * 100 + U.rand(0, 8) * 10 + U.rand(1, 9);
            return roundQ(n, 10, { kind: 'money', pre: '$' });
          }
          var m;
          if (Math.random() < 0.5) m = U.rand(1, 8) * 100 + 50;
          else {
            do m = U.rand(1, 8) * 100 + U.rand(1, 99);
            while (m % 100 === 50);
          }
          return roundQ(m, 100, { kind: 'mass', suf: 'kg' });
        });
      },
      twice: function () {
        return uniq(function () {
          var n = U.rand(1, 9) * 100 + 40 + U.rand(5, 9);
          var q = roundQ(n, 100);
          q.type = 'twice';
          q.kind = 'twice';
          q.via = roundTo(n, 10);
          q.wrong = roundTo(q.via, 100);
          return q;
        });
      },
      same: function () {
        return uniq(function () {
          var r = U.pick([95, 96, 97, 98, 99, 1, 2, 3, 4]);
          var H = r > 50 ? U.rand(1, 9) : U.rand(1, 9);
          var target = H * 100 + r;
          var hs = U.shuffle(U.range(1, 9).filter(function (x) {
            return x !== Math.floor(target / 100) && x !== Math.round(target / 100);
          })).slice(0, 3);
          var others = hs.map(function (hh) {
            return hh * 100 + U.rand(6, 94);
          });
          var opts = U.shuffle([target].concat(others));
          return { type: 'same', n: target, key: 'same', ans: target, options: opts };
        });
      },
      bean: function () {
        return uniq(function () {
          var g;
          do g = U.rand(11, 89);
          while (g % 10 === 0);
          var G = Math.floor(g / 10);
          var opts = [
            { lo: G * 10, hi: G * 10 + 10, far: true },
            { lo: (G - 1) * 100, hi: G * 100 },
            { lo: G * 100, hi: G * 100 + 100, ok: true },
            { lo: (G + 1) * 100, hi: (G + 2) * 100 },
          ];
          return { type: 'bean', key: 'bean', g: g, n: g, ans: G * 100 + '-' + (G * 100 + 100), lo: G * 100, hi: G * 100 + 100, options: opts };
        });
      },
    };
    var kinds = U.shuffle(Object.keys(makers)).slice(0, 4);
    kinds.forEach(function (k) {
      deck.push(makers[k]());
    });
    return deck;
  }

  /* ------------------------------------------------------------------ *
   * Small UI helpers
   * ------------------------------------------------------------------ */
  function box(child) {
    return el('div', { class: 'rh-box' }, child);
  }
  function endButton(label, value, onPick) {
    var b = el('button', { class: 'choice rh-end', type: 'button', 'data-value': value, html: label });
    b.addEventListener('click', function () {
      if (b.disabled) return;
      MQ.sound('click');
      onPick(value);
    });
    return b;
  }
  function markBtn(b, kind) {
    b.classList.remove('good', 'bad');
    b.classList.add(kind);
  }
  function tensDigitHtml(n) {
    var s = String(n);
    return s.charAt(0) + '<span class="rh-dig">' + s.charAt(1) + '</span>' + s.charAt(2);
  }

  /* ------------------------------------------------------------------ *
   * Learn screens 1 and 2: drop balls on a hill
   * ------------------------------------------------------------------ */
  function dropScreen(stage, api, cfg) {
    api.lockNext();
    api.say(cfg.say, 'think');
    stage.appendChild(MQ.ui.lesson(cfg.title, cfg.text));
    var hill = makeHill({ lo: cfg.lo, hi: cfg.hi, api: api, labels: 'all', half: true });
    stage.appendChild(box(hill.svg));
    var row = el('div', { class: 'rh-drops' });
    var log = el('div', { class: 'rh-log' });
    stage.appendChild(row);
    stage.appendChild(log);
    var done = {};
    var btns = [];
    cfg.nums.forEach(function (n) {
      var b = el('button', { class: 'btn rh-drop', type: 'button', 'data-n': n }, 'Drop ' + n + ' ⬇');
      b.addEventListener('click', function () {
        btns.forEach(function (x) {
          x.disabled = true;
        });
        api.sound('pop');
        var to = roundTo(n, cfg.hi - cfg.lo);
        hill.markEnd(cfg.lo, 'none');
        hill.markEnd(cfg.hi, 'none');
        api.feedback('', 'info');
        hill.drop(n, n, function () {
          api.later(function () {
            hill.roll(to, function () {
              hill.markEnd(to, 'good');
              done[n] = true;
              b.classList.add('rh-done');
              log.appendChild(el('span', { class: 'rh-chip', html: (cfg.digits ? tensDigitHtml(n) : n) + ' → <b>' + to + '</b>' }));
              api.say(cfg.msg[n], 'cheer');
              api.feedback(cfg.msg[n], 'good');
              btns.forEach(function (x) {
                x.disabled = !!done[x.getAttribute('data-n')];
              });
              if (Object.keys(done).length === cfg.nums.length) {
                api.later(function () {
                  stage.appendChild(el('div', { class: 'rh-rule', html: cfg.rule }));
                  api.say(cfg.end, 'cheer');
                  api.unlockNext();
                }, 900);
              }
            });
          }, 450);
        });
      });
      btns.push(b);
      row.appendChild(b);
    });
  }

  /* ------------------------------------------------------------------ *
   * Learn screen 3: estimate a tray of buttons with a range
   * ------------------------------------------------------------------ */
  var COLORS = ['#e8553d', '#2f6fb3', '#f2b51d', '#2ea36b', '#8e5bc8', '#e07a00'];
  function trayScreen(stage, api) {
    api.lockNext();
    api.say('A tray of buttons! I will show it for 4 seconds. Do not count. Just look!', 'think');
    stage.appendChild(MQ.ui.lesson('Estimate with a range', 'No time to count? Say a <b>range</b>: "between 200 and 300".'));
    var N;
    do N = U.rand(130, 370);
    while (N % 100 < 20 || N % 100 > 80);
    var W = 900;
    var Hh = 300;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + Hh, width: W, height: Hh, class: 'rh-svg rh-tray-svg', role: 'img', 'aria-label': 'A tray of buttons', 'data-count': N });
    root.appendChild(svg('rect', { x: 10, y: 10, width: W - 20, height: Hh - 20, rx: 18, class: 'rh-tray' }));
    var btnLayer = svg('g');
    root.appendChild(btnLayer);
    var labelLayer = svg('g');
    root.appendChild(labelLayer);
    var lid = svg('g', { class: 'rh-lid' });
    lid.appendChild(svg('rect', { x: 10, y: 10, width: W - 20, height: Hh - 20, rx: 18, class: 'rh-lid-r' }));
    var lidT = svg('text', { x: W / 2, y: Hh / 2 + 10, 'text-anchor': 'middle', class: 'rh-lid-t' }, 'A tray of buttons (covered)');
    lid.appendChild(lidT);
    root.appendChild(lid);

    // scattered positions: N different cells of a 30 × 13 grid, with a little jitter
    var cells = U.shuffle(U.range(0, 30 * 13 - 1)).slice(0, N);
    var cw = (W - 70) / 30;
    var ch = (Hh - 60) / 13;
    var buttons = cells.map(function (c, i) {
      var cx = 35 + (c % 30) * cw + cw / 2 + U.rand(-4, 4);
      var cy = 30 + Math.floor(c / 30) * ch + ch / 2 + U.rand(-3, 3);
      var g = svg('g', { class: 'rh-btn' });
      g.appendChild(svg('circle', { cx: 0, cy: 0, r: 6.5, fill: COLORS[i % COLORS.length], class: 'rh-btn-c' }));
      g.appendChild(svg('circle', { cx: -1.8, cy: 0, r: 1.1, class: 'rh-btn-h' }));
      g.appendChild(svg('circle', { cx: 1.8, cy: 0, r: 1.1, class: 'rh-btn-h' }));
      g.style.transform = 'translate(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px)';
      btnLayer.appendChild(g);
      return g;
    });
    stage.appendChild(box(root));

    var row = el('div', { class: 'rh-drops' });
    stage.appendChild(row);
    var showBtn = el('button', { class: 'btn btn-big rh-show', type: 'button' }, 'Show the tray 👀');
    row.appendChild(showBtn);
    showBtn.addEventListener('click', function () {
      showBtn.disabled = true;
      api.sound('pop');
      lid.setAttribute('visibility', 'hidden');
      var left = 4;
      showBtn.textContent = 'Look! ' + left + '…';
      function count() {
        left--;
        if (left > 0) {
          showBtn.textContent = 'Look! ' + left + '…';
          api.later(count, 1000);
          return;
        }
        lid.setAttribute('visibility', 'visible');
        lidT.textContent = 'Time is up! How many buttons were there?';
        MQ.clear(row);
        askRange();
      }
      api.later(count, 1000);
    });

    function askRange() {
      api.say('About how many buttons? Pick a range.', 'think');
      var lo = Math.floor(N / 100) * 100;
      var ch2 = MQ.ui.choices(
        [100, 200, 300].map(function (a) {
          return { label: a + ' to ' + (a + 100), value: a };
        }),
        function (v) {
          ch2.disable();
          ch2.mark(v, v === lo ? 'good' : 'bad');
          if (v !== lo) ch2.mark(lo, 'good');
          api.sound(v === lo ? 'correct' : 'pop');
          api.say('Let us check. I will put the buttons in groups of 100.', 'happy');
          regroup(v === lo, v);
        },
        { columns: 3 }
      );
      ch2.classList.add('rh-ranges');
      row.appendChild(ch2);
    }

    function regroup(good, picked) {
      lid.setAttribute('visibility', 'hidden');
      var H = Math.floor(N / 100);
      var R = N % 100;
      var tens = Math.floor(R / 10);
      var ones = R % 10;
      var sp = 16;
      var bw = sp * 10;
      buttons.forEach(function (g, i) {
        var x;
        var y;
        if (i < H * 100) {
          var b = Math.floor(i / 100);
          var k = i % 100;
          x = 50 + b * (bw + 34) + (k % 10) * sp;
          y = 36 + Math.floor(k / 10) * sp;
        } else {
          var j = i - H * 100;
          var gx = 50 + H * (bw + 34);
          if (j < tens * 10) {
            x = gx + (j % 10) * sp;
            y = 36 + Math.floor(j / 10) * sp;
          } else {
            x = gx + (j - tens * 10) * sp;
            y = 36 + tens * sp + 10;
          }
        }
        g.style.transitionDelay = (i % 100) * 6 + 'ms';
        g.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      api.later(function () {
        for (var b = 0; b < H; b++) {
          var cx = 50 + b * (bw + 34) + (bw - sp) / 2;
          labelLayer.appendChild(svg('rect', { x: cx - 52, y: 36 + 10 * sp + 6, width: 104, height: 34, rx: 10, class: 'rh-grp' }));
          labelLayer.appendChild(svg('text', { x: cx, y: 36 + 10 * sp + 30, 'text-anchor': 'middle', class: 'rh-grp-t' }, '100'));
        }
        var gx2 = 50 + H * (bw + 34) + (bw - sp) / 2;
        var ly = 36 + tens * sp + 10 + (ones ? sp : 0) + 6;
        labelLayer.appendChild(svg('rect', { x: gx2 - 52, y: ly, width: 104, height: 34, rx: 10, class: 'rh-grp rh-grp-r' }));
        labelLayer.appendChild(svg('text', { x: gx2, y: ly + 24, 'text-anchor': 'middle', class: 'rh-grp-t' }, String(R)));
        var lo = H * 100;
        var parts = [];
        for (var p = 0; p < H; p++) parts.push('100');
        var sentence = parts.join(' + ') + ' + ' + R + ' = <b>' + N + '</b> buttons. ' + N + ' is between ' + lo + ' and ' + (lo + 100) + '.';
        stage.appendChild(el('div', { class: 'rh-rule rh-count', 'data-count': N, html: sentence }));
        if (good) {
          api.say('There were ' + N + ' buttons. Your range ' + lo + ' to ' + (lo + 100) + ' was a good estimate!', 'cheer');
          api.feedback('Good estimate! ' + N + ' is in ' + lo + ' to ' + (lo + 100) + '.', 'good');
        } else {
          api.say('There were ' + N + '. That is in ' + lo + ' to ' + (lo + 100) + '. Estimates are guesses, so that is OK! Picture a block of 100 next time.', 'happy');
          api.feedback('You said ' + picked + ' to ' + (picked + 100) + '. The real count was ' + N + ', so ' + lo + ' to ' + (lo + 100) + ' fits.', 'info');
        }
        api.unlockNext();
      }, 1700);
    }
  }

  /* ------------------------------------------------------------------ *
   * Practice renderers
   * ------------------------------------------------------------------ */
  function stepWords(q) {
    if (q.pre === '$') return 'the nearest <b>$10</b>';
    if (q.suf === 'kg') return 'the nearest <b>100 kg</b>';
    return 'the nearest <b>' + q.step + '</b>';
  }

  function renderRound(stage, api, q) {
    var root = el('div', { class: 'rh-q', 'data-type': q.type, 'data-kind': q.kind, 'data-n': q.n, 'data-step': q.step, 'data-answer': q.ans });
    stage.appendChild(root);
    var N = fmtV(q, q.n);
    var ptxt = q.kind === 'money' ? 'A bike costs <b>$' + q.n + '</b>. Round the price to ' + stepWords(q) + '.' : q.kind === 'mass' ? 'A lorry carries <b>' + q.n + ' kg</b> of sand. Round it to ' + stepWords(q) + '.' : 'Round <b>' + N + '</b> to ' + stepWords(q) + '.';
    root.appendChild(MQ.ui.prompt(ptxt));
    if (q.kind === 'money') api.say('Round the price to the nearest $10. Which two tens is it between?', 'think');
    else if (q.kind === 'mass') api.say('Round the mass to the nearest 100 kg. Look at the tens digit.', 'think');
    else if (q.hideHi) api.say('What comes after ' + q.lo + '? Type your answer.', 'think');
    else if (q.step === 10) api.say('Which two tens is it between? Is it past the top?', 'think');
    else api.say('Nearest 100: look at the tens digit. Is it past the top?', 'think');

    var hill = makeHill({ lo: q.lo, hi: q.hi, api: api, pre: q.pre, suf: q.suf, labels: q.hideHi ? 'all' : 'ends', hideHi: q.hideHi });
    hill.place(q.n, q.pre === '$' ? '$' + q.n : q.n);
    root.appendChild(box(hill.svg));

    var row = el('div', { class: 'rh-ans' });
    var ends = [];
    var inp = MQ.ui.numberInput({
      prefix: q.pre || null,
      unit: q.suf || null,
      onSubmit: function (num) {
        answer(num, null);
      },
    });
    if (!q.hideHi) {
      var bl = endButton('◀ ' + fmtV(q, q.lo), q.lo, function (v) {
        answer(v, bl);
      });
      var br = endButton(fmtV(q, q.hi) + ' ▶', q.hi, function (v) {
        answer(v, br);
      });
      ends = [bl, br];
      row.appendChild(bl);
      row.appendChild(el('div', { class: 'rh-typebox' }, el('span', { class: 'rh-or' }, 'or type it'), inp.el));
      row.appendChild(br);
    } else {
      row.appendChild(inp.el);
    }
    root.appendChild(row);
    if (q.hideHi) inp.focus();

    function finish() {
      ends.forEach(function (b) {
        b.disabled = true;
      });
      inp.disable();
    }
    function praise() {
      var mid = q.lo + q.step / 2;
      if (q.n === mid) return N + ' is exactly on the top, so it rolls on to ' + fmtV(q, q.ans) + '!';
      if (q.cross) return 'Yes! ' + N + ' rolls on to ' + fmtV(q, q.ans) + '. You crossed into the next hundred!';
      return N + ' → ' + fmtV(q, q.ans) + '. ' + (q.ans === q.lo ? 'Before the top, so it rolls back.' : 'Past the top, so it rolls on.');
    }

    function answer(a, btn) {
      if (api.isAnswered()) return;
      if (a === q.ans) {
        finish();
        if (btn) markBtn(btn, 'good');
        else {
          inp.good();
          ends.forEach(function (b) {
            if (+b.getAttribute('data-value') === q.ans) markBtn(b, 'good');
          });
        }
        hill.revealHi();
        hill.showHalf();
        hill.roll(q.ans, function () {
          hill.markEnd(q.ans, 'good');
        });
        api.check(true, praise());
        return;
      }
      var t = api.tries();
      var d = diagnose(q, a, t);
      if (btn) markBtn(btn, 'bad');
      else inp.bad();
      if (a === q.lo || a === q.hi) hill.markEnd(a, 'bad');
      if (t >= 1) {
        hill.showLabels();
        hill.showHalf();
      }
      api.check(false, d.hint, d.tag);
    }

    api.onReveal(function () {
      finish();
      hill.showLabels();
      hill.showHalf();
      hill.revealHi();
      inp.setValue(String(q.ans));
      inp.good();
      ends.forEach(function (b) {
        if (+b.getAttribute('data-value') === q.ans) markBtn(b, 'good');
      });
      hill.roll(q.ans, function () {
        hill.markEnd(q.ans, 'good');
      });
      var mid = q.lo + q.step / 2;
      var pos = q.n < mid ? 'before the top' : q.n === mid ? 'exactly on the top' : 'past the top';
      api.feedback(
        N + ' is between ' + fmtV(q, q.lo) + ' and ' + fmtV(q, q.hi) + '. The top of the hill is ' + mid + '. ' + N + ' is ' + pos + ', so it rolls ' + (q.ans === q.lo ? 'back' : 'on') + ' to <b>' + fmtV(q, q.ans) + '</b>.',
        'info'
      );
    });
  }

  function renderTwice(stage, api, q) {
    var root = el('div', { class: 'rh-q', 'data-type': 'twice', 'data-n': q.n, 'data-answer': 'direct' });
    stage.appendChild(root);
    api.say('I rounded ' + q.n + ' to the nearest 100 in two ways. I got two answers! Which one is right?', 'think');
    root.appendChild(MQ.ui.prompt('Round <b>' + q.n + '</b> to the nearest <b>100</b>. Which answer is right?'));
    var hill = makeHill({ lo: q.lo, hi: q.hi, api: api, labels: 'all', half: true });
    hill.place(q.n);
    root.appendChild(box(hill.svg));
    var opts = U.shuffle([
      { label: '<span class="rh-way">Straight to the nearest 100</span>' + q.n + ' → ' + q.ans, value: 'direct' },
      { label: '<span class="rh-way">Nearest 10 first, then 100</span>' + q.n + ' → ' + q.via + ' → ' + q.wrong, value: 'twice' },
    ]);
    opts.push({ label: '<span class="rh-way">Both are right</span>' + q.ans + ' and ' + q.wrong, value: 'both' });
    var ch = MQ.ui.choices(
      opts,
      function (v) {
        if (api.isAnswered()) return;
        if (v === 'direct') {
          ch.mark(v, 'good');
          ch.disable();
          hill.roll(q.ans, function () {
            hill.markEnd(q.ans, 'good');
          });
          api.check(true, 'Yes! Round the number you were given. ' + q.n + ' is before ' + (q.lo + 50) + ', so it rolls back to ' + q.ans + '.');
          return;
        }
        ch.mark(v, 'bad');
        var t = api.tries();
        var hint;
        if (v === 'both') hint = q.ans + ' and ' + q.wrong + ' are different, so they cannot both be right. Where is ' + q.n + ' on the hill: before the top or past it?';
        else hint = t ? q.n + ' has tens digit 4. It is before the top (' + (q.lo + 50) + '), so it rolls back to ' + q.ans + '. Rounding to ' + q.via + ' first moved it past the top!' : 'Rounding twice moves the number! ' + q.n + ' is not ' + q.via + '. Is ' + q.n + ' before or past the top of the hill?';
        api.check(false, hint, T_TWICE);
      },
      { columns: 3 }
    );
    ch.classList.add('rh-ways');
    root.appendChild(ch);
    api.onReveal(function () {
      ch.mark('direct', 'good');
      ch.disable();
      hill.roll(q.ans, function () {
        hill.markEnd(q.ans, 'good');
      });
      api.feedback(q.n + ' is before the top (' + (q.lo + 50) + '), so it rolls back to <b>' + q.ans + '</b>. Rounding to ' + q.via + ' first pushes it onto the top, which gives the wrong answer ' + q.wrong + '.', 'info');
    });
  }

  function sameTable(q, showFor) {
    var t = el('table', { class: 'rh-table' });
    t.appendChild(el('tr', null, el('th', null, 'Number'), el('th', null, 'Nearest 10'), el('th', null, 'Nearest 100')));
    q.options.forEach(function (n) {
      if (showFor && showFor.indexOf(n) === -1) return;
      var a = roundTo(n, 10);
      var b = roundTo(n, 100);
      t.appendChild(el('tr', { class: a === b ? 'rh-row-same' : '' }, el('td', null, String(n)), el('td', null, String(a)), el('td', null, String(b) + (a === b ? ' ✓ same' : ''))));
    });
    return t;
  }

  function renderSame(stage, api, q) {
    var root = el('div', { class: 'rh-q', 'data-type': 'same', 'data-answer': q.ans, 'data-options': q.options.join(',') });
    stage.appendChild(root);
    api.say('Round each number to the nearest 10 and to the nearest 100. Only one gives the same answer both ways!', 'think');
    root.appendChild(MQ.ui.prompt('Which number rounds to the <b>same</b> answer to the nearest 10 <b>and</b> to the nearest 100?'));
    var tried = [];
    var tableHolder = el('div', { class: 'rh-tablebox' });
    var ch = MQ.ui.choices(
      q.options.map(function (n) {
        return { label: String(n), value: n };
      }),
      function (v) {
        if (api.isAnswered()) return;
        if (v === q.ans) {
          ch.mark(v, 'good');
          ch.disable();
          done();
          api.check(true, v + ' → ' + roundTo(v, 10) + ' and → ' + roundTo(v, 100) + '. The same both ways!');
          return;
        }
        ch.mark(v, 'bad');
        if (tried.indexOf(v) === -1) tried.push(v);
        MQ.clear(tableHolder);
        tableHolder.appendChild(sameTable(q, tried));
        var t = api.tries();
        api.check(false, v + ' → ' + roundTo(v, 10) + ' to the nearest 10, but → ' + roundTo(v, 100) + ' to the nearest 100. Not the same.' + (t ? ' Look for a number only a few steps away from a hundred.' : ' Try another.'), T_SAME);
      },
      { columns: 4 }
    );
    ch.classList.add('rh-picks');
    root.appendChild(ch);
    root.appendChild(tableHolder);
    var hillHolder = el('div', { class: 'rh-mini' });
    root.appendChild(hillHolder);

    function done() {
      MQ.clear(tableHolder);
      tableHolder.appendChild(sameTable(q));
      var lo = Math.floor(q.ans / 10) * 10;
      var hill = makeHill({ lo: lo, hi: lo + 10, api: api, labels: 'all', half: true });
      hill.place(q.ans);
      hillHolder.appendChild(box(hill.svg));
      var to = roundTo(q.ans, 10);
      api.later(function () {
        hill.roll(to, function () {
          hill.markEnd(to, 'good');
        });
      }, 300);
    }
    api.onReveal(function () {
      ch.mark(q.ans, 'good');
      ch.disable();
      done();
      api.feedback(q.ans + ' rolls to ' + roundTo(q.ans, 10) + ', which is already a hundred. So the nearest 10 and the nearest 100 are both <b>' + roundTo(q.ans, 100) + '</b>.', 'info');
    });
  }

  function beanStrip(q) {
    var W = 900;
    var Hh = 150;
    var c0 = 130;
    var cw = 75;
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + Hh, width: W, height: Hh, class: 'rh-svg rh-strip', role: 'img', 'aria-label': 'Table: 10 grams is 100 beans, up to 100 grams is 1000 beans' });
    var hl = svg('g');
    root.appendChild(hl);
    root.appendChild(svg('text', { x: c0 - 12, y: 66, 'text-anchor': 'end', class: 'rh-strip-h' }, 'Mass'));
    root.appendChild(svg('text', { x: c0 - 12, y: 114, 'text-anchor': 'end', class: 'rh-strip-h' }, 'Beans'));
    for (var k = 1; k <= 10; k++) {
      var x = c0 + (k - 1) * cw;
      root.appendChild(svg('rect', { x: x, y: 40, width: cw, height: 40, class: 'rh-cell rh-cell-g' }));
      root.appendChild(svg('rect', { x: x, y: 88, width: cw, height: 40, class: 'rh-cell rh-cell-b' }));
      root.appendChild(svg('text', { x: x + cw / 2, y: 67, 'text-anchor': 'middle', class: 'rh-cell-t' }, k * 10 + ' g'));
      root.appendChild(svg('text', { x: x + cw / 2, y: 115, 'text-anchor': 'middle', class: 'rh-cell-t' }, String(k * 100)));
    }
    root.appendChild(svg('text', { x: c0, y: 24, class: 'rh-strip-n' }, 'Count in tens of grams… and in hundreds of beans.'));
    var mk = svg('g', { visibility: 'hidden', class: 'rh-mark' });
    var mx = c0 + (q.g / 10 - 0.5) * cw; // column centres are at 10 g, 20 g, … so this is to scale
    mk.appendChild(svg('line', { x1: mx, y1: 32, x2: mx, y2: 134, class: 'rh-mark-l' }));
    mk.appendChild(svg('rect', { x: mx - 30, y: 128, width: 60, height: 20, rx: 6, class: 'rh-mark-r' }));
    mk.appendChild(svg('text', { x: mx, y: 143, 'text-anchor': 'middle', class: 'rh-mark-t' }, q.g + ' g'));
    root.appendChild(mk);
    var G = Math.floor(q.g / 10);
    return {
      svg: root,
      show: function () {
        MQ.clear(hl);
        [G, G + 1].forEach(function (k) {
          hl.appendChild(svg('rect', { x: c0 + (k - 1) * cw - 3, y: 36, width: cw + 6, height: 96, rx: 8, class: 'rh-hl' }));
        });
        mk.setAttribute('visibility', 'visible');
      },
    };
  }

  function scalePic(g) {
    var s = svg('svg', { viewBox: '0 0 170 130', width: 170, height: 130, class: 'rh-scale', 'aria-hidden': 'true' });
    s.appendChild(svg('path', { d: 'M52 58 q-6 -40 33 -42 q39 2 33 42 z', class: 'rh-bag' }));
    s.appendChild(svg('path', { d: 'M70 22 q15 -10 30 0', class: 'rh-bag-tie' }));
    for (var i = 0; i < 7; i++) s.appendChild(svg('ellipse', { cx: 66 + (i % 4) * 12, cy: 36 + Math.floor(i / 4) * 11, rx: 4.5, ry: 3, class: 'rh-bean' }));
    s.appendChild(svg('rect', { x: 30, y: 58, width: 110, height: 8, rx: 4, class: 'rh-pan' }));
    s.appendChild(svg('rect', { x: 20, y: 70, width: 130, height: 54, rx: 12, class: 'rh-scale-b' }));
    s.appendChild(svg('rect', { x: 42, y: 80, width: 86, height: 32, rx: 6, class: 'rh-disp' }));
    s.appendChild(svg('text', { x: 85, y: 104, 'text-anchor': 'middle', class: 'rh-disp-t' }, g + ' g'));
    return s;
  }

  function renderBean(stage, api, q) {
    var root = el('div', { class: 'rh-q', 'data-type': 'bean', 'data-g': q.g, 'data-answer': q.ans });
    stage.appendChild(root);
    api.say('The bag of beans weighs ' + q.g + ' g. Use the table to choose a range.', 'think');
    root.appendChild(el('div', { class: 'rh-beanhead' }, scalePic(q.g), MQ.ui.prompt('A bag of beans weighs <b>' + q.g + ' g</b>. About how many beans are in it?')));
    var strip = beanStrip(q);
    root.appendChild(box(strip.svg));
    var opts = q.options.slice().sort(function (a, b) {
      return a.lo - b.lo;
    });
    var ch = MQ.ui.choices(
      opts.map(function (o) {
        return { label: o.lo + ' to ' + o.hi + ' beans', value: o.lo + '-' + o.hi };
      }),
      function (v) {
        if (api.isAnswered()) return;
        if (v === q.ans) {
          ch.mark(v, 'good');
          ch.disable();
          strip.show();
          api.check(true, q.g + ' g is between ' + q.lo / 10 + ' g and ' + q.hi / 10 + ' g, so about ' + q.lo + ' to ' + q.hi + ' beans!');
          return;
        }
        ch.mark(v, 'bad');
        var o = opts.filter(function (x) {
          return x.lo + '-' + x.hi === v;
        })[0];
        var t = api.tries();
        if (t >= 1) strip.show();
        if (o.far) {
          api.check(false, q.g + ' is the grams, not the beans! 10 g is already 100 beans. ' + (t ? q.g + ' g is between ' + q.lo / 10 + ' g and ' + q.hi / 10 + ' g. Read the beans under them.' : 'Find ' + q.g + ' g in the top row.'), T_EST);
        } else {
          api.check(false, t ? 'Under ' + q.lo / 10 + ' g is ' + q.lo + ' beans. Under ' + q.hi / 10 + ' g is ' + q.hi + ' beans.' : 'Find ' + q.g + ' g in the top row. Which two masses is it between? Read the beans under them.', T_HUND);
        }
      },
      { columns: 2 }
    );
    ch.classList.add('rh-beans');
    root.appendChild(ch);
    api.onReveal(function () {
      ch.mark(q.ans, 'good');
      ch.disable();
      strip.show();
      api.feedback(q.g + ' g is between ' + q.lo / 10 + ' g and ' + q.hi / 10 + ' g. Under them are ' + q.lo + ' and ' + q.hi + ' beans, so the bag has about <b>' + q.lo + ' to ' + q.hi + '</b> beans.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Activity
   * ------------------------------------------------------------------ */
  var deck = null;

  var def = {
    learn: [
      function (stage, api) {
        dropScreen(stage, api, {
          lo: 380,
          hi: 390,
          title: 'The rounding hill',
          text: 'Before the top, the ball rolls <b>back</b>. On the top or past it, it rolls <b>on</b>.',
          say: 'This hill goes from 380 to 390. The top is 385, exactly halfway. Drop each ball!',
          nums: [383, 385, 388],
          msg: {
            383: '383 is before the top, so it rolls back to 380.',
            385: '385 is right on the top. A ball on the top rolls on, to 390!',
            388: '388 is past the top, so it rolls on to 390.',
          },
          rule: '⭐ Nearest 10: look at the <b>ones</b> digit. 5 or more rolls on.',
          end: 'You rounded to the nearest 10! 383 → 380, 385 → 390, 388 → 390.',
        });
      },
      function (stage, api) {
        dropScreen(stage, api, {
          lo: 300,
          hi: 400,
          digits: true,
          title: 'A bigger hill: nearest 100',
          text: 'From 300 to 400 the top is <b>350</b>. Look at the <span class="rh-dig">tens</span> digit.',
          say: 'Now the hill goes from 300 to 400. The top is 350. Drop each ball!',
          nums: [347, 362, 350],
          msg: {
            347: '347 has 4 tens. It is just before the top, so it rolls back to 300.',
            350: '350 is right on the top, so it rolls on to 400.',
            362: '362 has 6 tens. It is past the top, so it rolls on to 400.',
          },
          rule: '⭐ Nearest 100: look at the <b>tens</b> digit. 5 or more rolls on.',
          end: 'The 7 ones in 347 did not matter. For the nearest 100, the tens digit decides!',
        });
      },
      trayScreen,
    ],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0 || !deck[api.index]) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'round') return renderRound(stage, api, q);
        if (q.type === 'twice') return renderTwice(stage, api, q);
        if (q.type === 'same') return renderSame(stage, api, q);
        return renderBean(stage, api, q);
      },
    },
  };
  // Test hooks (no new globals: kept on the registered definition only)
  def._test = { roundTo: roundTo, buildDeck: buildDeck, diagnose: diagnose };
  MQ.register('rounding-hill', def);

  var css = [
    '.rh-box{width:100%;max-width:880px;background:#fff;border:2px solid var(--line);border-radius:16px;padding:4px 6px}',
    '.rh-svg{display:block;width:100%;max-width:100%;height:auto;user-select:none;-webkit-user-select:none}',
    '.rh-svg text{pointer-events:none}',
    '.rh-hill{fill:#a8d98a}',
    '.rh-hill-edge{fill:none;stroke:#4f9a3a;stroke-width:4;stroke-linejoin:round}',
    '.rh-ground{fill:#b98c55}',
    '.rh-half{stroke:#fff;stroke-width:3;stroke-dasharray:7 6}',
    '.rh-half-t{fill:#2f6b22;font-size:16px;font-weight:800}',
    '.rh-hid{visibility:hidden}',
    '.rh-tick{stroke:var(--ink);stroke-width:2.5}',
    '.rh-tl{font-size:16px;font-weight:700;fill:var(--ink-soft)}',
    '.rh-mid-pill{fill:#efe4ff;stroke:#7b3fbf;stroke-width:2}',
    '.rh-mid-t{font-size:17px;font-weight:800;fill:#5b2a99}',
    '.rh-plate{fill:#fff6d6;stroke:#d4a017;stroke-width:3}',
    '.rh-plate-t{font-size:23px;font-weight:800;fill:var(--ink)}',
    '.rh-plate-g.good .rh-plate{fill:var(--good-bg);stroke:var(--good)}',
    '.rh-plate-g.good .rh-plate-t{fill:var(--good)}',
    '.rh-plate-g.bad .rh-plate{fill:var(--try-bg);stroke:var(--try)}',
    '.rh-ball-c{fill:#e8553d;stroke:#fff;stroke-width:3}',
    '.rh-ball-shine{fill:rgba(255,255,255,.45)}',
    '.rh-ball-t{fill:#fff;font-size:19px;font-weight:800}',
    '.rh-ball-t-s{font-size:16px}',
    '.rh-dropline{stroke:#e8553d;stroke-width:2.5;stroke-dasharray:3 4}',
    '.rh-drops{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;width:100%}',
    '.rh-drop{font-size:1.2rem;min-width:150px}',
    '.rh-drop.rh-done{opacity:.55}',
    '.rh-log{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;min-height:42px}',
    '.rh-chip{background:#fff;border:2px solid var(--line);border-radius:999px;padding:5px 16px;font-weight:800;font-size:1.2rem}',
    '.rh-chip b{color:var(--good)}',
    '.rh-dig{color:#7b3fbf;text-decoration:underline;text-decoration-thickness:3px;text-underline-offset:3px;font-weight:800}',
    '.rh-rule{text-align:center;font-size:1.25rem;font-weight:800;background:#fff3cd;border:2px solid var(--gold);border-radius:14px;padding:8px 16px;max-width:760px}',
    '.rh-q{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.rh-ans{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;width:100%}',
    '.rh-end{min-width:140px;font-size:1.35rem}',
    '.rh-typebox{display:flex;flex-direction:column;align-items:center;gap:4px}',
    '.rh-or{color:var(--ink-soft);font-weight:700;font-size:.95rem}',
    '.rh-way{display:block;font-size:.9rem;font-weight:700;color:var(--ink-soft);margin-bottom:4px}',
    '.choice.good .rh-way{color:var(--good)}',
    '.rh-ways{max-width:860px}',
    '.rh-picks .choice{font-size:1.6rem}',
    '.rh-tablebox{display:flex;justify-content:center;width:100%}',
    '.rh-table{border-collapse:collapse;background:#fff;font-size:1.15rem;font-weight:700}',
    '.rh-table th,.rh-table td{border:2px solid var(--line);padding:5px 16px;text-align:center}',
    '.rh-table th{background:var(--paper-2);font-size:.95rem}',
    '.rh-row-same td{background:var(--good-bg);color:var(--good)}',
    '.rh-mini{width:100%;max-width:520px;display:flex;justify-content:center}',
    '.rh-tray{fill:#f3e3c7;stroke:#c9a46a;stroke-width:4}',
    '.rh-lid-r{fill:#8fb3d9;stroke:#5d86b3;stroke-width:4}',
    '.rh-lid-t{font-size:26px;font-weight:800;fill:#fff}',
    '.rh-btn{transition:transform 1.1s ease}',
    '.rh-btn-c{stroke:rgba(0,0,0,.25);stroke-width:1}',
    '.rh-btn-h{fill:rgba(0,0,0,.35)}',
    '.rh-grp{fill:#fff;stroke:#2f6fb3;stroke-width:2.5}',
    '.rh-grp-r{stroke:#e07a00}',
    '.rh-grp-t{font-size:20px;font-weight:800;fill:var(--ink)}',
    '.rh-count b{color:var(--good);font-size:1.4rem}',
    '.rh-ranges{max-width:620px}',
    '.rh-beanhead{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap}',
    '.rh-scale{width:150px;height:auto;flex:none}',
    '.rh-bag{fill:#e9d3a8;stroke:#b08b4f;stroke-width:2}',
    '.rh-bag-tie{fill:none;stroke:#b08b4f;stroke-width:3}',
    '.rh-bean{fill:#8a4b2a}',
    '.rh-pan{fill:#aab4c8}',
    '.rh-scale-b{fill:#dfe6f3;stroke:#8e9bb5;stroke-width:2}',
    '.rh-disp{fill:#1b2a4a}',
    '.rh-disp-t{fill:#7dffb0;font-size:22px;font-weight:800;font-family:monospace}',
    '.rh-strip-h{font-size:18px;font-weight:800;fill:var(--ink)}',
    '.rh-strip-n{font-size:15px;font-weight:700;fill:var(--ink-soft)}',
    '.rh-cell{stroke:var(--line);stroke-width:2}',
    '.rh-cell-g{fill:#eef7e8}',
    '.rh-cell-b{fill:#fbf1e3}',
    '.rh-cell-t{font-size:18px;font-weight:800;fill:var(--ink)}',
    '.rh-hl{fill:#fff3cd;stroke:var(--gold);stroke-width:3}',
    '.rh-mark-l{stroke:#c0392b;stroke-width:3;stroke-dasharray:5 4}',
    '.rh-mark-r{fill:#c0392b}',
    '.rh-mark-t{fill:#fff;font-size:15px;font-weight:800}',
    '.rh-beans{max-width:640px}',
    '@media (max-width:700px){.rh-end{min-width:110px}.rh-scale{width:110px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'rounding-hill' }, css));
})();

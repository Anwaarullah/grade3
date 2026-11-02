/* Rounding Measurements — round lengths on a number line (Unit 6.1).
 * A red pin marks the measurement. Two flags stand on the tens/hundreds either side.
 * The child picks the nearer flag; the pin slides to it.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  var W = 800; // viewBox width
  var H = 250; // viewBox height
  var M = 90; // side margin (flag positions)
  var LY = 150; // y of the number line

  /* ------------------------------------------------------------------ *
   * Question helpers
   * q = { value, unit: 'cm'|'km', step: 10|100, ask: 'cm'|'m'|'km', lo, hi, answer, both }
   * ------------------------------------------------------------------ */
  function makeQ(value, unit, step, ask) {
    var lo = Math.floor(value / step) * step;
    var hi = lo + step;
    var answer = value - lo >= step / 2 ? hi : lo; // halfway rounds up
    return { value: value, unit: unit, step: step, ask: ask || unit, lo: lo, hi: hi, answer: answer, halfway: value - lo === step / 2 };
  }

  // Text for a flag / answer button at value v (v is always in q.unit).
  function flagLines(q, v) {
    if (q.both) return [v + ' cm', '= ' + v / 100 + ' m'];
    if (q.ask === 'm') return [v / 100 + ' m'];
    return [v + ' ' + q.unit];
  }
  function flagLabel(q, v) {
    return flagLines(q, v).join(' ');
  }

  function stepWords(q) {
    if (q.ask === 'm') return 'the nearest <b>metre</b>';
    if (q.unit === 'km') return 'the nearest <b>10 km</b>';
    return 'the nearest <b>' + q.step + ' cm</b>';
  }

  /* ------------------------------------------------------------------ *
   * Number line SVG drawn to scale.
   * ------------------------------------------------------------------ */
  function numberLine(q, onFlag) {
    var span = q.hi - q.lo;
    var minor = span / 10;
    function X(v) {
      return M + ((v - q.lo) / span) * (W - 2 * M);
    }
    var root = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'rr-svg', role: 'img', 'aria-label': 'Number line from ' + q.lo + ' to ' + q.hi + ' ' + q.unit });
    var arcG = svg('g', { class: 'rr-arcs' });
    var flagG = svg('g');
    var pinG = svg('g', { class: 'rr-pin' });

    root.appendChild(svg('line', { x1: M - 40, y1: LY, x2: W - M + 40, y2: LY, class: 'rr-axis' }));
    for (var i = 0; i <= 10; i++) {
      var v = q.lo + i * minor;
      var x = X(v);
      var big = i === 0 || i === 10;
      var mid = i === 5;
      var len = big ? 14 : mid ? 12 : 7;
      root.appendChild(svg('line', { x1: x, y1: LY - len, x2: x, y2: LY + len, class: 'rr-tick' + (mid ? ' rr-tick-mid' : '') }));
      root.appendChild(svg('text', { x: x, y: LY + 34, 'text-anchor': 'middle', class: 'rr-num' + (big ? ' rr-num-big' : '') }, String(v)));
    }
    root.appendChild(svg('text', { x: W - M + 44, y: LY + 6, class: 'rr-unit' }, q.unit));
    var halfLbl = svg('text', { x: X(q.lo + span / 2), y: LY + 54, 'text-anchor': 'middle', class: 'rr-half', visibility: 'hidden' }, '↑ halfway');
    root.appendChild(halfLbl);
    root.appendChild(arcG);

    // flags
    var flags = {};
    [q.lo, q.hi].forEach(function (fv, idx) {
      var fx = X(fv);
      var lines = flagLines(q, fv);
      var w = q.both ? 104 : 96;
      var h = lines.length * 24 + 12;
      var rx = idx === 0 ? fx : fx - w;
      var g = svg('g', { class: 'rr-flag', tabindex: '0', role: 'button', 'aria-label': 'Flag ' + flagLabel(q, fv) });
      var hx = Math.min(rx, fx - 30);
      g.appendChild(svg('rect', { x: hx, y: 18, width: Math.max(rx + w, fx + 30) - hx, height: LY - 4, class: 'rr-hit' }));
      g.appendChild(svg('line', { x1: fx, y1: 22, x2: fx, y2: LY, class: 'rr-flag-pole' }));
      g.appendChild(svg('rect', { x: rx, y: 22, width: w, height: h, rx: 6, class: 'rr-flag-cloth' }));
      lines.forEach(function (t, k) {
        g.appendChild(svg('text', { x: rx + w / 2, y: 22 + 28 + k * 24, 'text-anchor': 'middle', class: 'rr-flag-text' + (k ? ' rr-flag-sub' : '') }, t));
      });
      function pick() {
        if (onFlag) onFlag(fv);
      }
      g.addEventListener('click', pick);
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          pick();
        }
      });
      flags[fv] = g;
      flagG.appendChild(g);
    });
    root.appendChild(flagG);

    // pin (drawn at x = 0, moved with a CSS transform so it can glide)
    var pinLabel = svg('text', { x: 0, y: 92, 'text-anchor': 'middle', class: 'rr-pin-label' }, q.value + ' ' + q.unit);
    pinG.appendChild(svg('line', { x1: 0, y1: 112, x2: 0, y2: LY, class: 'rr-pin-stem' }));
    pinG.appendChild(svg('circle', { cx: 0, cy: 112, r: 12, class: 'rr-pin-head' }));
    pinG.appendChild(pinLabel);
    pinG.style.transform = 'translate(' + X(q.value) + 'px, 0px)';
    root.appendChild(pinG);

    var api = {
      svg: root,
      X: X,
      moveTo: function (v) {
        pinG.style.transform = 'translate(' + X(v) + 'px, 0px)';
        // Put the label beside the pin head, on the inside of the flag pole, so it is not
        // cut off at the edge or drawn over the flag.
        var atHi = v === q.hi;
        pinLabel.setAttribute('text-anchor', atHi ? 'end' : 'start');
        pinLabel.setAttribute('x', atHi ? -20 : 20);
        pinLabel.setAttribute('y', 104);
        pinLabel.textContent = q.value + ' → ' + flagLabel(q, v);
      },
      mark: function (v, kind) {
        var g = flags[v];
        if (!g) return;
        g.classList.remove('good', 'bad');
        g.classList.add(kind);
      },
      disable: function () {
        root.classList.add('rr-done');
      },
      showHalf: function () {
        halfLbl.setAttribute('visibility', 'visible');
      },
      // Jump arcs from the pin to each flag, labelled with the distance.
      arcs: function () {
        MQ.clear(arcG);
        [q.lo, q.hi].forEach(function (end) {
          var d = Math.abs(end - q.value);
          var near = end === q.answer;
          var cls = 'rr-arc ' + (near ? 'rr-arc-near' : 'rr-arc-far');
          var a = Math.min(q.value, end);
          var b = Math.max(q.value, end);
          var steps = d % minor === 0 ? d / minor : 0;
          if (steps > 0) {
            for (var k = 0; k < steps; k++) {
              var x1 = X(a + k * minor);
              var x2 = X(a + (k + 1) * minor);
              arcG.appendChild(svg('path', { d: 'M' + x1 + ' ' + (LY - 3) + ' Q' + (x1 + x2) / 2 + ' ' + (LY - 30) + ' ' + x2 + ' ' + (LY - 3), class: cls }));
            }
          } else {
            var xa = X(a);
            var xb = X(b);
            arcG.appendChild(svg('path', { d: 'M' + xa + ' ' + (LY - 3) + ' Q' + (xa + xb) / 2 + ' ' + (LY - 50) + ' ' + xb + ' ' + (LY - 3), class: cls }));
          }
          var lbl = minor === 1 ? d + (d === 1 ? ' jump' : ' jumps') : d + ' ' + q.unit;
          if (minor !== 1 && steps > 0) lbl = steps + (steps === 1 ? ' jump' : ' jumps') + ' of ' + minor;
          arcG.appendChild(svg('text', { x: (X(a) + X(b)) / 2, y: LY + 78, 'text-anchor': 'middle', class: 'rr-arc-lbl ' + (near ? 'rr-lbl-near' : 'rr-lbl-far') }, lbl));
        });
      },
    };
    return api;
  }

  function distText(q, end) {
    var d = Math.abs(end - q.value);
    return q.value + ' to ' + end + ' is ' + d + ' ' + q.unit;
  }

  /* ------------------------------------------------------------------ *
   * Practice deck
   * ------------------------------------------------------------------ */
  var deck = null;

  function buildDeck() {
    var used = {};
    function uniq(fn) {
      for (var t = 0; t < 200; t++) {
        var q = fn();
        var key = q.value + '|' + q.step + '|' + q.ask;
        if (!used[key]) {
          used[key] = true;
          return q;
        }
      }
      return fn();
    }
    var downOnes = [1, 2, 3, 4];
    var upOnes = [6, 7, 8, 9];
    var L1 = [
      uniq(function () {
        return makeQ(U.rand(1, 9) * 10 + U.pick(U.pick([downOnes, upOnes])), 'cm', 10);
      }),
      uniq(function () {
        return makeQ(U.rand(10, 49) * 10 + U.pick(downOnes), 'cm', 10);
      }),
      uniq(function () {
        return makeQ(U.rand(10, 49) * 10 + U.pick(upOnes), 'cm', 10);
      }),
    ];
    function hundredsVal(up) {
      // e.g. 724 (down) or 275 (up): never exactly a hundred or exactly halfway
      var rest = up ? U.rand(51, 99) : U.rand(1, 49);
      return U.rand(1, 8) * 100 + rest;
    }
    var L2 = [
      uniq(function () {
        return makeQ(hundredsVal(Math.random() < 0.5), 'cm', 100, 'cm');
      }),
      uniq(function () {
        return makeQ(hundredsVal(false), 'cm', 100, 'm');
      }),
      uniq(function () {
        return makeQ(hundredsVal(true), 'cm', 100, 'm');
      }),
    ];
    var halfKinds = [
      function () {
        return makeQ(U.rand(10, 49) * 10 + 5, 'cm', 10); // 275 -> 280
      },
      function () {
        return makeQ(U.rand(1, 8) * 100 + 50, 'cm', 100, 'm'); // 450 -> 5 m
      },
      function () {
        return makeQ(U.rand(1, 9) * 10 + 5, 'cm', 10); // 65 -> 70
      },
    ];
    var L3 = [
      uniq(U.pick(halfKinds)),
      uniq(function () {
        var v;
        do v = U.rand(11, 89);
        while (v % 10 === 0);
        return makeQ(v, 'km', 10, 'km'); // 16 km -> 20 km
      }),
    ];
    return U.shuffle(L1).concat(U.shuffle(L2), U.shuffle(L3));
  }

  /* ------------------------------------------------------------------ *
   * Activity
   * ------------------------------------------------------------------ */
  MQ.register('rounding-rover', {
    learn: [
      // 1. nearest 10: 108 -> 110, then the halfway rule with 275 -> 280
      function (stage, api) {
        api.say('The red pin is at 108 cm. Which flag is nearer: 100 or 110? Press Go!', 'think');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Round to the nearest 10 cm', 'Find the <b>nearer</b> flag.'));
        var holder = el('div', { class: 'rr-box' });
        stage.appendChild(holder);
        var btnRow = el('div', { class: 'rr-btns' });
        stage.appendChild(btnRow);

        function part(q, after) {
          MQ.clear(holder);
          MQ.clear(btnRow);
          var line = numberLine(q);
          holder.appendChild(line.svg);
          var go = el('button', { class: 'btn btn-big', type: 'button' }, 'Go! ▶');
          go.addEventListener('click', function () {
            go.disabled = true;
            api.sound('pop');
            line.arcs();
            if (q.halfway) line.showHalf();
            api.later(function () {
              line.moveTo(q.answer);
              line.mark(q.answer, 'good');
            }, 500);
            api.later(after, 1300);
          });
          btnRow.appendChild(go);
        }

        var first = makeQ(108, 'cm', 10);
        var second = makeQ(275, 'cm', 10);
        part(first, function () {
          api.say('110 is only 2 jumps away. 100 is 8 jumps away. So 108 cm rounds to 110 cm!', 'cheer');
          api.feedback('108 cm → 110 cm (to the nearest 10 cm)', 'good');
          MQ.clear(btnRow);
          var more = el('button', { class: 'btn', type: 'button' }, 'What about 275? ▶');
          more.addEventListener('click', function () {
            api.feedback('', 'info');
            api.say('275 cm is between 270 and 280. Press Go!', 'think');
            part(second, function () {
              api.say('275 is exactly halfway: 5 jumps each way. Halfway numbers round UP!', 'cheer');
              MQ.clear(btnRow);
              holder.appendChild(el('div', { class: 'rr-rule' }, '⭐ Exactly halfway? Round up!  275 cm → 280 cm'));
              api.unlockNext();
            });
          });
          btnRow.appendChild(more);
        });
      },

      // 2. nearest 100 cm = nearest metre
      function (stage, api) {
        api.say('The bed is 275 cm long. Click the nearer flag!', 'think');
        api.lockNext();
        stage.appendChild(MQ.ui.lesson('Nearest 100 cm = nearest metre', '100 cm = 1 m, so these two flags have two names.'));
        var q = makeQ(275, 'cm', 100, 'cm');
        q.both = true;
        var done = false;
        var line = numberLine(q, pick);
        stage.appendChild(el('div', { class: 'rr-box' }, line.svg));
        var ch = MQ.ui.choices(
          [q.lo, q.hi].map(function (v) {
            return { label: flagLabel(q, v), value: v };
          }),
          pick,
          { columns: 2 }
        );
        stage.appendChild(ch);
        function pick(v) {
          if (done) return;
          if (v === q.answer) {
            done = true;
            api.sound('correct');
            line.arcs();
            line.moveTo(v);
            line.mark(v, 'good');
            line.disable();
            ch.mark(v, 'good');
            ch.disable();
            api.say('Yes! 275 cm rounds to 300 cm. And 300 cm is 3 m. Same answer, two names!', 'cheer');
            stage.appendChild(el('div', { class: 'rr-rule' }, '275 cm → 300 cm = 3 m'));
            api.feedback('Nearest 100 cm and nearest metre mean the same thing.', 'good');
            api.unlockNext();
          } else {
            api.sound('wrong');
            line.arcs();
            line.mark(v, 'bad');
            ch.mark(v, 'bad');
            api.feedback('From 275 to 200 is 75 cm. From 275 to 300 is only 25 cm. Which is nearer?', 'try');
          }
        }
      },
    ],

    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        var unitName = q.unit === 'km' ? 'km' : 'cm';

        if (q.unit === 'km') api.say('The road sign says ' + q.value + ' km. Round it to the nearest 10 km.', 'think');
        else if (q.ask === 'm') api.say('Round it to the nearest metre. Remember: 100 cm = 1 m.', 'think');
        else api.say('Which flag is nearer to the pin?', 'think');

        var what = q.unit === 'km' ? 'The town is <b>' + q.value + ' km</b> away. ' : '';
        stage.appendChild(MQ.ui.prompt(what + 'Round <b>' + q.value + ' ' + unitName + '</b> to ' + stepWords(q) + '.'));
        var line = numberLine(q, pick);
        stage.appendChild(el('div', { class: 'rr-box' }, line.svg));
        var ch = MQ.ui.choices(
          [q.lo, q.hi].map(function (v) {
            return { label: flagLabel(q, v), value: v };
          }),
          pick,
          { columns: 2 }
        );
        stage.appendChild(ch);
        stage.appendChild(el('div', { class: 'rr-small' }, 'Click a flag or a button.'));

        var far = q.answer === q.lo ? q.hi : q.lo;

        function praise() {
          if (q.halfway) return q.value + ' is exactly halfway, so it rounds up to ' + flagLabel(q, q.answer) + '!';
          if (q.ask === 'm') return q.value + ' cm → ' + q.answer + ' cm = ' + q.answer / 100 + ' m. Nearest 100 cm is the nearest metre!';
          return q.value + ' ' + unitName + ' is nearer to ' + flagLabel(q, q.answer) + '. Well rounded!';
        }

        function pick(v) {
          if (api.isAnswered()) return;
          if (v === q.answer) {
            line.moveTo(v);
            line.mark(v, 'good');
            line.disable();
            ch.mark(v, 'good');
            ch.disable();
            api.check(true, praise());
            return;
          }
          line.mark(v, 'bad');
          ch.mark(v, 'bad');
          var hint;
          var tag;
          if (q.halfway) {
            tag = 'Rounded a halfway number down';
            line.showHalf();
            hint =
              api.tries() === 0
                ? 'Look closely: ' + q.value + ' is exactly halfway between ' + q.lo + ' and ' + q.hi + '. What do we do with halfway numbers?'
                : 'Halfway numbers always round UP, to the bigger flag: ' + flagLabel(q, q.hi) + '.';
          } else {
            tag = 'Rounded to the further ten/hundred';
            if (api.tries() === 0) {
              hint = 'Which flag is closer? Count the jumps from the pin to each flag.';
            } else {
              line.arcs();
              hint = distText(q, far) + ', but ' + distText(q, q.answer) + '. Pick the nearer flag!';
            }
          }
          api.check(false, hint, tag);
        }

        api.onReveal(function () {
          line.arcs();
          if (q.halfway) line.showHalf();
          line.moveTo(q.answer);
          line.mark(q.answer, 'good');
          line.disable();
          ch.mark(q.answer, 'good');
          ch.disable();
          var msg = q.halfway
            ? q.value + ' is exactly halfway (' + Math.abs(q.value - q.lo) + ' ' + unitName + ' each way), so we round up to ' + flagLabel(q, q.answer) + '.'
            : distText(q, q.answer) + ' and ' + distText(q, far) + '. ' + flagLabel(q, q.answer) + ' is nearer, so ' + q.value + ' ' + unitName + ' rounds to ' + flagLabel(q, q.answer) + '.';
          api.feedback(msg, 'info');
        });
      },
    },
  });

  var css = [
    '.rr-box{width:100%;max-width:820px;background:#fff;border:2px solid var(--line);border-radius:16px;padding:6px 8px}',
    '.rr-svg{display:block;width:100%;height:auto;user-select:none}',
    '.rr-axis{stroke:#1b2a4a;stroke-width:4;stroke-linecap:round}',
    '.rr-tick{stroke:#1b2a4a;stroke-width:2}',
    '.rr-tick-mid{stroke:#6b7fb0;stroke-width:3}',
    '.rr-num{font-size:15px;font-weight:700;fill:#4a5a7d}',
    '.rr-num-big{font-size:19px;font-weight:800;fill:#1b2a4a}',
    '.rr-unit{font-size:16px;font-weight:800;fill:#4a5a7d}',
    '.rr-half{font-size:15px;font-weight:800;fill:#6b7fb0}',
    '.rr-hit{fill:transparent}',
    '.rr-flag{cursor:pointer;outline:none}',
    '.rr-flag-pole{stroke:#4a5a7d;stroke-width:4;stroke-linecap:round}',
    '.rr-flag-cloth{fill:#eef3ff;stroke:#2b6cb0;stroke-width:3}',
    '.rr-flag:hover .rr-flag-cloth,.rr-flag:focus .rr-flag-cloth{fill:#d9e6ff}',
    '.rr-flag-text{font-size:21px;font-weight:800;fill:#1b2a4a;pointer-events:none}',
    '.rr-flag-sub{font-size:18px;fill:#0b6e66}',
    '.rr-flag.good .rr-flag-cloth{fill:var(--good-bg);stroke:var(--good)}',
    '.rr-flag.bad .rr-flag-cloth{fill:var(--try-bg);stroke:var(--try)}',
    '.rr-done .rr-flag{cursor:default}',
    '.rr-pin{pointer-events:none;transition:transform .9s cubic-bezier(.3,.8,.3,1)}',
    '.rr-pin-head{fill:#e63946;stroke:#fff;stroke-width:3}',
    '.rr-pin-stem{stroke:#e63946;stroke-width:4}',
    '.rr-pin-label{font-size:22px;font-weight:800;fill:#1b2a4a;paint-order:stroke;stroke:#fff;stroke-width:6px;stroke-linejoin:round}',
    '.rr-arcs{pointer-events:none}',
    '.rr-arc{fill:none;stroke-width:3;stroke-linecap:round}',
    '.rr-arc-near{stroke:var(--good)}',
    '.rr-arc-far{stroke:#e08a4f;stroke-dasharray:6 5}',
    '.rr-arc-lbl{font-size:17px;font-weight:800}',
    '.rr-lbl-near{fill:var(--good)}',
    '.rr-lbl-far{fill:var(--try)}',
    '.rr-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.rr-rule{margin-top:8px;text-align:center;font-size:1.35rem;font-weight:800;background:#fff3cd;border:2px solid var(--gold);border-radius:14px;padding:8px 16px}',
    '.rr-small{color:var(--ink-soft);font-size:.95rem}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'rounding-rover' }, css));
})();

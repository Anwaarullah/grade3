/* One-Minute Challenge — units of time and the feel of one minute (Unit 14.1).
 * Learn: sort activity cards into minutes … years boxes; time a real minute (guess first);
 * scale a 1-minute count up to 2 and 10 minutes with bars and running totals.
 * Practice: best unit (incl. "no seconds on the list" and slow growing), the more
 * sensible duration, less than / about 1 minute / more than 1 minute / about 1 hour,
 * then ×2 / ×10 steps and hours of sleep in a week as repeated addition (bars).
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var S = MQ.svg;
  var U = MQ.util;
  var ID = 'minute-challenge';

  var UNITS = ['minutes', 'hours', 'days', 'weeks', 'months', 'years'];
  var UNIT_ICON = { minutes: '⏱️', hours: '🕐', days: '☀️', weeks: '🗓️', months: '📅', years: '🎂' };

  function unitIdx(u) {
    return UNITS.indexOf(u);
  }

  /* ---------------------------------------------------------------- *
   * Data
   * ---------------------------------------------------------------- */

  // Learn screen 1: one card per box (hours has two).
  var SORT_CARDS = [
    { name: 'brushing teeth', lines: ['brushing', 'teeth'], icon: '🪥', unit: 'minutes', why: 'Brushing teeth takes about 2 minutes.' },
    { name: 'a birthday party', lines: ['a birthday', 'party'], icon: '🎉', unit: 'hours', why: 'A party lasts a few hours.' },
    { name: "a night's sleep", lines: ["a night's", 'sleep'], icon: '🛏️', unit: 'hours', why: 'You sleep for about 10 hours each night.' },
    { name: 'a weekend away', lines: ['a weekend', 'away'], icon: '⛺', unit: 'days', why: 'A weekend is 2 days: Saturday and Sunday.' },
    { name: 'a summer holiday', lines: ['a summer', 'holiday'], icon: '🏖️', unit: 'weeks', why: 'A summer holiday lasts a few weeks.' },
    { name: 'a school term', lines: ['a school', 'term'], icon: '🏫', unit: 'months', why: 'A school term lasts about 3 months.' },
    { name: 'growing up', lines: ['growing', 'up'], icon: '🧒', unit: 'years', why: 'Growing up takes many years.' },
  ];

  // Level 1: best unit. Each item lists 3 options with exactly one sensible unit.
  var L1_ITEMS = [
    { key: 'teeth', name: 'brushing your teeth', icon: '🪥', unit: 'minutes', opts: ['minutes', 'days', 'months'], clue: 'You brush your teeth while one short song plays.', why: 'Brushing teeth takes about 2 minutes.' },
    { key: 'breakfast', name: 'eating breakfast', icon: '🥣', unit: 'minutes', opts: ['minutes', 'weeks', 'years'], clue: 'Breakfast is finished long before school starts.', why: 'Breakfast takes about 10 minutes.' },
    { key: 'laces', name: 'tying your shoelaces', icon: '👟', unit: 'minutes', opts: ['minutes', 'months', 'years'], clue: 'You can tie a bow very quickly.', why: 'Tying your laces takes a minute or less.' },
    { key: 'schoolday', name: 'a school day', icon: '🏫', unit: 'hours', opts: ['minutes', 'hours', 'years'], clue: 'You go in the morning and come home in the afternoon.', why: 'A school day is about 6 hours.' },
    { key: 'sleep', name: "a night's sleep", icon: '🛏️', unit: 'hours', opts: ['minutes', 'hours', 'months'], clue: 'You go to bed at night and wake up in the morning.', why: "A night's sleep is about 10 hours." },
    { key: 'party', name: 'a birthday party', icon: '🎉', unit: 'hours', opts: ['hours', 'weeks', 'years'], clue: 'A party starts after lunch and ends before bedtime.', why: 'A party lasts about 2 or 3 hours.' },
    { key: 'cake', name: 'baking a cake', icon: '🧁', unit: 'hours', opts: ['hours', 'weeks', 'years'], clue: 'The cake is ready to eat on the same afternoon.', why: 'Baking a cake takes about 1 hour.' },
    { key: 'weekend', name: 'a weekend', icon: '🧺', unit: 'days', opts: ['minutes', 'days', 'years'], clue: 'A weekend is Saturday and Sunday.', why: 'A weekend is 2 days.' },
    { key: 'camping', name: 'a camping trip', icon: '⛺', unit: 'days', opts: ['minutes', 'days', 'years'], clue: 'You sleep in the tent for a few nights.', why: 'A camping trip lasts a few days.' },
    { key: 'holiday', name: 'a summer holiday', icon: '🏖️', unit: 'weeks', opts: ['minutes', 'hours', 'weeks'], clue: 'It lasts much, much longer than one day.', why: 'A summer holiday lasts a few weeks.' },
    { key: 'schoolyear', name: 'a school year', icon: '🎒', unit: 'months', opts: ['minutes', 'hours', 'months'], clue: 'It goes from one summer holiday to the next.', why: 'A school year is about 10 months.' },
    { key: 'growup', name: 'a baby growing into a grown-up', icon: '👶', unit: 'years', opts: ['hours', 'days', 'years'], clue: 'Think how many birthdays it takes to grow up.', why: 'Growing up takes about 18 years.' },
  ];

  // Level 1: very quick things, but seconds are not on the list.
  var SMALL_ITEMS = [
    { key: 'hands', name: 'shaking hands with a friend', icon: '🤝', unit: 'minutes', opts: ['minutes', 'hours', 'days'], special: 'smallest', clue: 'There are no seconds on this list. Pick the smallest unit you can see.', why: 'A handshake takes a few seconds. Seconds are not on the list, so minutes is the best choice.' },
    { key: 'candles', name: 'blowing out birthday candles', icon: '🕯️', unit: 'minutes', opts: ['minutes', 'hours', 'days'], special: 'smallest', clue: 'There are no seconds on this list. Pick the smallest unit you can see.', why: 'One big puff takes a few seconds. Seconds are not on the list, so minutes is the best choice.' },
    { key: 'sneeze', name: 'a sneeze', icon: '🤧', unit: 'minutes', opts: ['minutes', 'hours', 'weeks'], special: 'smallest', clue: 'There are no seconds on this list. Pick the smallest unit you can see.', why: 'A sneeze takes a second. Seconds are not on the list, so minutes is the best choice.' },
  ];

  // Level 1: very slow things.
  var SLOW_ITEMS = [
    { key: 'grass', name: 'grass growing 5 cm taller', icon: '🌱', unit: 'weeks', opts: ['minutes', 'hours', 'weeks'], special: 'slow', clue: 'Grass grows so slowly that you cannot see it move. It takes many days.', why: 'Grass takes a few weeks to grow 5 cm.' },
    { key: 'sunflower', name: 'a seed growing into a tall sunflower', icon: '🌻', unit: 'months', opts: ['minutes', 'hours', 'months'], special: 'slow', clue: 'You plant it in spring and it is tall in summer.', why: 'A sunflower takes a few months to grow tall.' },
    { key: 'tadpole', name: 'a tadpole turning into a frog', icon: '🐸', unit: 'weeks', opts: ['minutes', 'hours', 'weeks'], special: 'slow', clue: 'You would watch the pond for many days before it changes.', why: 'A tadpole takes a few weeks to become a frog.' },
  ];

  // Level 2: the more sensible duration (good answer first).
  var DURATIONS = [
    { key: 'film', name: 'watching a film', icon: '🎬', good: '2 hours', bad: '2 minutes', clue: 'A film is much longer than a song.', why: 'A film lasts about 2 hours. In 2 minutes you would only see the start!' },
    { key: 'teeth', name: 'brushing your teeth', icon: '🪥', good: '2 minutes', bad: '2 hours', clue: 'You brush your teeth before school, then go.', why: 'Brushing teeth takes about 2 minutes. 2 hours would be a whole morning!' },
    { key: 'schoolday', name: 'a school day', icon: '🏫', good: '6 hours', bad: '6 days', clue: 'You come home from school every afternoon.', why: 'A school day is about 6 hours. 6 days would be almost a week!' },
    { key: 'sandwich', name: 'eating a sandwich', icon: '🥪', good: '5 minutes', bad: '5 weeks', clue: 'A sandwich is gone before lunchtime ends.', why: 'A sandwich takes about 5 minutes to eat.' },
    { key: 'sleep', name: "a night's sleep", icon: '🛏️', good: '10 hours', bad: '10 minutes', clue: 'You sleep from bedtime until the morning.', why: "A night's sleep is about 10 hours. 10 minutes is just a nap!" },
    { key: 'holiday', name: 'a summer holiday', icon: '🏖️', good: '6 weeks', bad: '6 minutes', clue: 'A holiday is many days long.', why: 'A summer holiday is about 6 weeks.' },
    { key: 'washhands', name: 'washing your hands', icon: '🧼', good: '1 minute', bad: '1 day', clue: 'You wash your hands and then go to eat.', why: 'Washing your hands takes about 1 minute.' },
    { key: 'football', name: 'a football match', icon: '⚽', good: '2 hours', bad: '2 days', clue: 'You can watch a match and still be home for dinner.', why: 'A football match takes about 2 hours, with the break.' },
    { key: 'walkbaby', name: 'a baby learning to walk', icon: '👣', good: '1 year', bad: '1 hour', clue: 'Babies take a long time to grow strong legs.', why: 'A baby takes about 1 year to learn to walk.' },
    { key: 'street', name: 'walking to the end of your street', icon: '🚶', good: '3 minutes', bad: '3 months', clue: 'You could walk there and back before lunch.', why: 'Walking to the end of the street takes a few minutes.' },
    { key: 'term', name: 'a school term', icon: '🗓️', good: '3 months', bad: '3 hours', clue: 'A term has lots and lots of school days.', why: 'A school term is about 3 months.' },
  ];

  // Level 2: closest box. Only clear-cut items.
  var BOXES4 = [
    { v: 'less', label: 'Less than 1 minute', icon: '⚡' },
    { v: 'about1', label: 'About 1 minute', icon: '⏱️' },
    { v: 'more', label: 'More than 1 minute', icon: '⏳' },
    { v: 'hour', label: 'About 1 hour', icon: '🕐' },
  ];
  var SORT4 = [
    { key: 'clap', name: 'one clap', icon: '👏', ans: 'less', why: 'One clap is over in a moment: less than 1 minute.' },
    { key: 'blink', name: 'one blink', icon: '👀', ans: 'less', why: 'A blink is super quick: less than 1 minute.' },
    { key: 'stamp', name: 'one stamp of your foot', icon: '🦶', ans: 'less', why: 'One stamp is over in a moment: less than 1 minute.' },
    { key: 'lesson', name: 'a maths lesson', icon: '📐', ans: 'hour', why: 'A lesson lasts about 1 hour.' },
    { key: 'dressed', name: 'getting dressed', icon: '👕', ans: 'more', why: 'Getting dressed takes a few minutes: more than 1 minute.' },
    { key: 'breakfast', name: 'eating breakfast', icon: '🥣', ans: 'more', why: 'Breakfast takes about 10 minutes: more than 1 minute.' },
  ];

  var STEP_SIZES = [40, 50, 60, 70, 80, 100];
  var DAYS7 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  /* ---------------------------------------------------------------- *
   * Deck
   * ---------------------------------------------------------------- */
  function buildDeck() {
    var used = {};
    function take(list) {
      var ok = U.shuffle(list.filter(function (it) {
        return !used[it.key];
      }));
      var it = ok[0];
      used[it.key] = true;
      return it;
    }
    var q = [];
    var l1 = U.shuffle([take(L1_ITEMS), take(SMALL_ITEMS), take(SLOW_ITEMS)]);
    l1.forEach(function (it) {
      q.push({ type: 'unit', item: it, ans: it.unit, opts: it.opts.slice().sort(function (a, b) { return unitIdx(a) - unitIdx(b); }) });
    });
    var l2 = U.shuffle(['dur', 'dur', 'sort4']);
    l2.forEach(function (t) {
      if (t === 'dur') {
        var d = take(DURATIONS);
        q.push({ type: 'dur', item: d, ans: d.good, opts: U.shuffle([d.good, d.bad]) });
      } else {
        var s = take(SORT4);
        q.push({ type: 'sort4', item: s, ans: s.ans });
      }
    });
    var size = U.pick(STEP_SIZES);
    var k = U.pick([2, 10]);
    q.push({ type: 'steps', s: size, k: k, ans: size * k });
    var h = U.rand(8, 11);
    q.push({ type: 'sleep', h: h, k: 7, ans: h * 7 });
    return q;
  }

  /* ---------------------------------------------------------------- *
   * Helpers
   * ---------------------------------------------------------------- */
  function itemCard(it) {
    return el('div', { class: 'omc-card' }, el('span', { class: 'omc-card-icon' }, it.icon), el('span', null, it.name));
  }

  function unitLabel(u) {
    return '<span class="omc-bicon">' + UNIT_ICON[u] + '</span>' + u;
  }

  function tagChoices(ch) {
    ch.buttons.forEach(function (b) {
      b.setAttribute('data-v', String(b.value_));
    });
    return ch;
  }

  function buttonFor(ch, v) {
    return ch.buttons.filter(function (b) {
      return b.value_ === v;
    })[0];
  }

  /** The card flies into the right box, then a small copy stays in the box. */
  function flyInto(api, card, btn, icon) {
    if (!card || !btn) return;
    var a = card.getBoundingClientRect();
    var b = btn.getBoundingClientRect();
    var dx = b.left + b.width / 2 - (a.left + a.width / 2);
    var dy = b.top + b.height / 2 - (a.top + a.height / 2);
    card.style.transition = 'transform .6s ease, opacity .6s ease';
    card.style.transform = 'translate(' + Math.round(dx) + 'px,' + Math.round(dy) + 'px) scale(.35)';
    card.style.opacity = '0.15';
    api.later(function () {
      card.style.visibility = 'hidden';
      if (!btn.querySelector('.omc-in')) btn.appendChild(el('span', { class: 'omc-in' }, icon));
      api.sound('pop');
    }, 620);
  }

  /**
   * A bar model: `slots` equal bars of `value`, laid end to end, with running totals
   * under the joins (0, v, 2v, …). Bars start as dashed empty slots.
   */
  function strip(value, slots, opts) {
    opts = opts || {};
    var segW = slots <= 2 ? 160 : slots <= 7 ? 112 : 84;
    var x0 = 34;
    var W = x0 * 2 + slots * segW;
    var H = 122;
    var root = S('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'omc-strip', style: { maxWidth: '100%', height: 'auto' } });
    root.appendChild(S('text', { x: x0, y: 112, class: 'omc-tot omc-tot0', 'text-anchor': 'middle' }, '0'));
    root.appendChild(S('line', { x1: x0, y1: 78, x2: x0, y2: 92, class: 'omc-tick' }));
    var fills = [];
    var tots = [];
    for (var i = 0; i < slots; i++) {
      var x = x0 + i * segW;
      var lab = opts.labels ? opts.labels[i] : i + 1 + ' min';
      root.appendChild(S('text', { x: x + segW / 2, y: 18, class: 'omc-slot-lab', 'text-anchor': 'middle' }, lab));
      root.appendChild(S('rect', { x: x + 2, y: 28, width: segW - 4, height: 48, rx: 8, class: 'omc-seg-empty' }));
      var g = S('g', { class: 'omc-seg-g' }, S('rect', { x: x + 2, y: 28, width: segW - 4, height: 48, rx: 8, class: 'omc-seg omc-seg-' + (i % 2) }), S('text', { x: x + segW / 2, y: 60, class: 'omc-seg-num', 'text-anchor': 'middle' }, String(value)));
      g.style.display = 'none';
      root.appendChild(g);
      fills.push(g);
      root.appendChild(S('line', { x1: x + segW, y1: 78, x2: x + segW, y2: 92, class: 'omc-tick' }));
      var t = S('text', { x: x + segW, y: 112, class: 'omc-tot', 'text-anchor': 'middle' }, '');
      root.appendChild(t);
      tots.push(t);
    }
    var api0 = {
      el: el('div', { class: 'omc-strip-wrap' }, root),
      svg: root,
      slots: slots,
      /** Fill the first n bars; totals shown for the first `tn` joins (default n). */
      show: function (n, tn) {
        if (tn == null) tn = n;
        fills.forEach(function (g, i) {
          g.style.display = i < n ? '' : 'none';
        });
        tots.forEach(function (t, i) {
          t.textContent = i < tn ? String((i + 1) * value) : '';
          t.classList.toggle('omc-tot-last', i === tn - 1 && tn === slots);
        });
      },
      /** Add bars one at a time from `from` to n with their running totals. */
      animate: function (api, n, done, from, step) {
        from = from || 0;
        step = step || 380;
        var self = this;
        self.show(from);
        for (var i = from; i < n; i++) {
          (function (k) {
            api.later(function () {
              self.show(k + 1);
              api.sound('pop');
            }, step * (k - from + 1));
          })(i);
        }
        api.later(function () {
          if (done) done();
        }, step * (n - from) + 200);
      },
    };
    return api0;
  }

  function repeatedSum(value, times, unit) {
    var parts = [];
    for (var i = 0; i < times; i++) parts.push(value);
    return MQ.ui.sum(parts, value * times, unit);
  }

  /* ---------------------------------------------------------------- *
   * Learn 1: unit sorter (drag cards into boxes)
   * ---------------------------------------------------------------- */
  var CW = 116;
  var CH = 92;
  var BW = 140;
  var BH = 256;
  var BY = 128;

  function learnSorter(stage, api) {
    api.lockNext();
    api.say('Drag each card into the box with the best unit of time.');
    stage.appendChild(MQ.ui.lesson('Minutes, hours, days … years', 'Short things take <b>minutes</b>. Long things take <b>years</b>. Drag each card to its box.'));
    var VW = 900;
    var VH = BY + BH + 6;
    var root = S('svg', { viewBox: '0 0 ' + VW + ' ' + VH, width: VW, height: VH, class: 'omc-sorter', style: { maxWidth: '100%', height: 'auto' } });
    var boxLayer = S('g');
    var cardLayer = S('g');
    root.appendChild(boxLayer);
    root.appendChild(cardLayer);

    var boxes = UNITS.map(function (u, i) {
      var x = 10 + i * (BW + 8);
      var rect = S('rect', { x: x, y: BY, width: BW, height: BH, rx: 14, class: 'omc-sbox-r' });
      var g = S('g', { class: 'omc-sbox', 'data-box': u }, rect, S('text', { x: x + BW / 2, y: BY + 34, class: 'omc-sbox-t', 'text-anchor': 'middle' }, UNIT_ICON[u] + ' ' + u));
      boxLayer.appendChild(g);
      return { unit: u, x: x, y: BY, g: g, n: 0 };
    });

    var cards = U.shuffle(SORT_CARDS);
    var placed = 0;
    var selected = null;
    var wrongCount = {};
    var x0 = (VW - (cards.length * CW + (cards.length - 1) * 8)) / 2;

    function setPos(c, x, y) {
      c.x = x;
      c.y = y;
      c.g.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    }

    function tweenTo(c, x, y, done) {
      var sx = c.x;
      var sy = c.y;
      var token = (c.token = (c.token || 0) + 1);
      var steps = 10;
      for (var i = 1; i <= steps; i++) {
        (function (k) {
          api.later(function () {
            if (c.token !== token) return;
            var t = k / steps;
            t = 1 - (1 - t) * (1 - t);
            setPos(c, sx + (x - sx) * t, sy + (y - sy) * t);
            if (k === steps && done) done();
          }, k * 22);
        })(i);
      }
    }

    function select(c) {
      if (selected && selected !== c) selected.g.classList.remove('omc-sel');
      selected = c;
      if (c) c.g.classList.add('omc-sel');
    }

    function tryDrop(c, box) {
      if (c.done) return;
      if (!box) {
        tweenTo(c, c.hx, c.hy);
        return;
      }
      if (box.unit === c.it.unit) {
        c.done = true;
        select(null);
        c.g.classList.add('omc-placed');
        c.g.style.cursor = 'default';
        var tx = box.x + (BW - CW) / 2;
        var ty = box.y + 50 + box.n * (CH + 8);
        box.n++;
        tweenTo(c, tx, ty);
        placed++;
        api.sound('correct');
        api.feedback(c.it.why, 'good');
        if (placed === cards.length) {
          api.say('All sorted! Short things in minutes, long things in years.', 'cheer');
          api.feedback(c.it.why + ' All sorted! Press Next.', 'good');
          api.unlockNext();
        } else {
          api.say(U.pick(['Yes!', 'Good sorting!', 'That fits!', 'Spot on!']), 'happy');
        }
      } else {
        wrongCount[c.it.name] = (wrongCount[c.it.name] || 0) + 1;
        var bigger = unitIdx(box.unit) > unitIdx(c.it.unit);
        var line = bigger
          ? 'Good try! ' + cap(box.unit) + ' is too long for ' + c.it.name + '. Try a smaller unit.'
          : 'Good try! ' + cap(c.it.name) + ' takes longer than a few ' + box.unit + '. Try a bigger unit.';
        if (wrongCount[c.it.name] >= 2) line += ' ' + c.it.why;
        api.sound('wrong');
        api.say(bigger ? 'A bit too long. Try a smaller unit.' : 'Longer than that! Try a bigger unit.', 'oops');
        api.feedback(line, 'try');
        tweenTo(c, c.hx, c.hy);
      }
    }

    function boxAt(p) {
      for (var i = 0; i < boxes.length; i++) {
        var b = boxes[i];
        if (p.x >= b.x && p.x <= b.x + BW && p.y >= b.y - 10 && p.y <= b.y + BH) return b;
      }
      return null;
    }

    cards.forEach(function (it, i) {
      var g = S(
        'g',
        { class: 'omc-scard', 'data-unit': it.unit, 'data-name': it.name },
        S('rect', { x: 0, y: 0, width: CW, height: CH, rx: 12, class: 'omc-scard-r' }),
        S('text', { x: CW / 2, y: 38, class: 'omc-scard-e', 'text-anchor': 'middle' }, it.icon),
        S('text', { x: CW / 2, y: 62, class: 'omc-scard-t', 'text-anchor': 'middle' }, it.lines[0]),
        S('text', { x: CW / 2, y: 80, class: 'omc-scard-t', 'text-anchor': 'middle' }, it.lines[1])
      );
      cardLayer.appendChild(g);
      var c = { it: it, g: g, hx: x0 + i * (CW + 8), hy: 10, done: false };
      setPos(c, c.hx, c.hy);
      var sx = 0;
      var sy = 0;
      var moved = 0;
      // Bring the card to the front BEFORE the drag helper captures the pointer
      // (moving the node after capture would drop the capture).
      function toFront() {
        if (!c.done && cardLayer.lastChild !== g) cardLayer.appendChild(g);
      }
      g.addEventListener('pointerdown', toFront);
      api.cleanup(function () {
        g.removeEventListener('pointerdown', toFront);
      });
      api.cleanup(
        MQ.ui.drag(root, g, {
          start: function () {
            if (c.done) return;
            c.token = (c.token || 0) + 1; // stop any bounce in progress
            sx = c.x;
            sy = c.y;
            moved = 0;
          },
          move: function (p, dx, dy) {
            if (c.done) return;
            moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
            setPos(c, U.clamp(sx + dx, 0, VW - CW), U.clamp(sy + dy, 0, VH - CH));
            boxes.forEach(function (b) {
              b.g.classList.toggle('omc-hot', b === boxAt(p));
            });
          },
          end: function (p) {
            boxes.forEach(function (b) {
              b.g.classList.remove('omc-hot');
            });
            if (c.done) return;
            if (moved < 6) {
              setPos(c, sx, sy);
              select(c);
              api.feedback('Now click the box for ' + it.name + '.', 'info');
              return;
            }
            tryDrop(c, boxAt(p));
          },
        })
      );
    });

    boxes.forEach(function (b) {
      b.g.addEventListener('click', function () {
        if (selected && !selected.done) tryDrop(selected, b);
      });
    });

    stage.appendChild(el('div', { class: 'omc-sorter-wrap' }, root));
  }

  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /* ---------------------------------------------------------------- *
   * Learn 2: the one-minute test
   * ---------------------------------------------------------------- */
  var MODES = {
    click: { icon: '👆', label: 'Click', noun: 'clicks', btn: 'Click me!', who: 'You click the big button as fast as you can.' },
    clap: { icon: '👏', label: 'Clap', noun: 'claps', btn: '+1 clap', who: 'You clap. Your grown-up clicks +1 for every clap.' },
    stamp: { icon: '🦶', label: 'Stamp', noun: 'stamps', btn: '+1 stamp', who: 'You stamp your foot. Your grown-up clicks +1 for every stamp.' },
  };
  var history = []; // results this visit: {mode, guess, count, secs}
  var lastMinute = null; // last full-minute result {noun, count}

  function learnMinute(stage, api) {
    api.lockNext();
    var unlocked = false;
    api.say('How much can you do in one minute? Guess first, then we time it!');
    stage.appendChild(MQ.ui.lesson('How long is 1 minute?', 'Guess, then test it with a real 60-second timer.'));
    var box = el('div', { class: 'omc-minute' });
    var hist = el('div', { class: 'omc-hist' });
    stage.appendChild(box);
    stage.appendChild(hist);
    drawHistory();

    function drawHistory() {
      MQ.clear(hist);
      if (!history.length) return;
      hist.appendChild(el('div', { class: 'omc-hist-h' }, 'My tests'));
      history.forEach(function (r) {
        hist.appendChild(el('div', { class: 'omc-hist-row' }, MODES[r.mode].icon + ' ' + MODES[r.mode].noun + ': guess ' + r.guess + ', real ' + r.count + (r.secs < 60 ? ' (stopped at ' + r.secs + ' s)' : '')));
      });
    }

    function pickMode() {
      MQ.clear(box);
      box.appendChild(MQ.ui.prompt('What will you do for 1 minute?'));
      var ch = MQ.ui.choices(
        Object.keys(MODES).map(function (k) {
          return { label: '<span class="omc-bicon">' + MODES[k].icon + '</span>' + MODES[k].label, value: k };
        }),
        function (v) {
          guessStep(v);
        },
        { columns: 3 }
      );
      tagChoices(ch);
      box.appendChild(ch);
    }

    function guessStep(mode) {
      var m = MODES[mode];
      MQ.clear(box);
      box.appendChild(el('p', { class: 'omc-who' }, m.icon + ' ' + m.who));
      box.appendChild(MQ.ui.prompt('Guess: how many <b>' + m.noun + '</b> in 1 minute?'));
      var inp = MQ.ui.numberInput({
        unit: m.noun,
        button: 'My guess',
        onSubmit: function (num) {
          if (num !== Math.round(num) || num < 1 || num > 999) {
            api.feedback('Type a whole number, like 50 or 120.', 'info');
            return;
          }
          readyStep(mode, num);
        },
      });
      inp.el.classList.add('omc-guess');
      box.appendChild(inp.el);
      inp.focus();
    }

    function readyStep(mode, guess) {
      var m = MODES[mode];
      MQ.clear(box);
      box.appendChild(el('div', { class: 'omc-guess-chip' }, 'My guess: ', el('b', null, String(guess)), ' ' + m.noun));
      box.appendChild(el('p', { class: 'omc-who' }, m.icon + ' ' + m.who));
      box.appendChild(el('button', { class: 'btn omc-start', type: 'button', onclick: function () { run(mode, guess); } }, '▶ Start the minute'));
      api.say('Ready? Press start, then go go go!');
    }

    function run(mode, guess) {
      var m = MODES[mode];
      MQ.clear(box);
      var count = 0;
      var t0 = Date.now();
      var over = false;
      var R = 50;
      var C = 2 * Math.PI * R;
      var ring = S('circle', { cx: 60, cy: 60, r: R, class: 'omc-ring', 'stroke-dasharray': C.toFixed(1), 'stroke-dashoffset': '0', transform: 'rotate(-90 60 60)' });
      var secT = S('text', { x: 60, y: 70, class: 'omc-sec', 'text-anchor': 'middle' }, '60');
      var clock = S('svg', { viewBox: '0 0 120 120', width: 140, height: 140, class: 'omc-timer' }, S('circle', { cx: 60, cy: 60, r: R, class: 'omc-ring-bg' }), ring, secT);
      var countEl = el('div', { class: 'omc-count' }, '0');
      var tap = el('button', { class: 'btn omc-tap', type: 'button' }, m.icon + ' ' + m.btn);
      tap.addEventListener('click', function () {
        if (over) return;
        count++;
        countEl.textContent = String(count);
        api.sound('click');
      });
      var skip = el('button', { class: 'btn omc-skip', type: 'button' }, 'Finish early');
      skip.addEventListener('click', function () {
        if (!over) finish(false);
      });
      box.appendChild(el('div', { class: 'omc-run' }, clock, el('div', { class: 'omc-run-mid' }, el('div', { class: 'omc-count-lab' }, m.noun), countEl, tap)));
      box.appendChild(skip);
      api.say('Go! Keep going until the timer ends.', 'cheer');
      try {
        tap.focus({ preventScroll: true });
      } catch (e) {}

      function tick() {
        if (over) return;
        var el2 = (Date.now() - t0) / 1000;
        var left = Math.max(0, 60 - Math.floor(el2));
        secT.textContent = String(left);
        ring.setAttribute('stroke-dashoffset', (C * Math.min(1, el2 / 60)).toFixed(1));
        if (el2 >= 60) finish(true);
        else api.later(tick, 200);
      }
      api.later(tick, 200);

      function finish(full) {
        over = true;
        var secs = full ? 60 : Math.min(59, Math.floor((Date.now() - t0) / 1000));
        history.push({ mode: mode, guess: guess, count: count, secs: secs });
        if (full && count > 0) lastMinute = { noun: m.noun, count: count };
        showResult(mode, guess, count, secs);
      }
    }

    function showResult(mode, guess, count, secs) {
      var m = MODES[mode];
      MQ.clear(box);
      var max = Math.max(guess, count, 1);
      function bar(label, n, cls) {
        return el('div', { class: 'omc-res-row' }, el('span', { class: 'omc-res-lab' }, label), el('div', { class: 'omc-res-track' }, el('div', { class: 'omc-res-bar ' + cls, style: { width: Math.max(2, (100 * n) / max) + '%' } })), el('b', { class: 'omc-res-n' }, String(n)));
      }
      box.appendChild(el('div', { class: 'omc-res' }, bar('My guess', guess, 'omc-res-g'), bar(secs < 60 ? 'Real (' + secs + ' s)' : 'Real count', count, 'omc-res-r')));
      var diff = Math.abs(guess - count);
      var msg;
      if (diff <= Math.max(3, Math.round(count / 10))) msg = 'Great guess! Very close to the real count.';
      else if (guess > count) msg = 'Your guess was ' + diff + ' more than the real count.';
      else msg = 'You did ' + diff + ' more than you guessed!';
      if (secs < 60) msg = 'You stopped early, after ' + secs + ' seconds, so that is not a whole minute. ' + msg;
      box.appendChild(el('p', { class: 'omc-res-msg' }, msg));
      var others = Object.keys(MODES).filter(function (k) {
        return k !== mode && k !== 'click';
      });
      var again = el('button', { class: 'btn omc-again', type: 'button', onclick: pickMode }, '↻ Try again (' + MODES[others[0]].noun + '?)');
      box.appendChild(again);
      drawHistory();
      api.say(secs < 60 ? 'Next time, try the full minute!' : 'A minute is longer than it feels!', 'cheer');
      api.feedback('Now you know how much fits in one minute. Press Next.', 'good');
      if (!unlocked) {
        unlocked = true;
        api.unlockNext();
      }
    }

    pickMode();
  }

  /* ---------------------------------------------------------------- *
   * Learn 3: scaling up with bars
   * ---------------------------------------------------------------- */
  function learnScale(stage, api) {
    api.lockNext();
    var n = 50;
    var noun = 'steps';
    var who = 'Bolt takes <b>50 steps</b> in 1 minute.';
    if (lastMinute && lastMinute.count >= 5 && lastMinute.count <= 400) {
      n = lastMinute.count;
      noun = lastMinute.noun;
      who = 'You did <b>' + n + ' ' + noun + '</b> in 1 minute.';
    }
    api.say('2 minutes is one minute and another minute. Add a bar for each minute!');
    stage.appendChild(MQ.ui.lesson('More minutes, more bars', who + ' Each bar is one minute.'));
    var st = strip(n, 10);
    st.show(1);
    stage.appendChild(st.el);
    var out = el('div', { class: 'omc-scale-out' });
    var seen = {};
    var busy = false;
    var btns = [1, 2, 10].map(function (k) {
      return el('button', { class: 'btn omc-kbtn', type: 'button', 'data-k': String(k), onclick: function () { go(k); } }, k + (k === 1 ? ' minute' : ' minutes'));
    });
    stage.appendChild(el('div', { class: 'omc-kbtns' }, btns));
    stage.appendChild(out);
    out.appendChild(el('p', { class: 'omc-scale-txt' }, 'Click 2 minutes, then 10 minutes.'));

    function go(k) {
      if (busy) return;
      busy = true;
      btns.forEach(function (b) {
        b.disabled = true;
      });
      MQ.clear(out);
      st.show(0);
      st.animate(
        api,
        k,
        function () {
          busy = false;
          btns.forEach(function (b) {
            b.disabled = false;
          });
          out.appendChild(el('p', { class: 'omc-scale-txt' }, k + (k === 1 ? ' minute = 1 bar' : ' minutes = ' + k + ' bars of ' + n)));
          out.appendChild(repeatedSum(n, k, noun));
          seen[k] = true;
          if (k === 2) api.say('Two bars: ' + n + ' + ' + n + ' = ' + n * 2 + '. That is double!', 'happy');
          if (k === 10) api.say('Ten bars! Count on in jumps of ' + n + '. Would you get tired and slow down?', 'cheer');
          if (seen[2] && seen[10]) {
            api.feedback('Each extra minute adds one more bar. Press Next to practise.', 'good');
            api.unlockNext();
          } else if (!seen[10]) {
            api.feedback('Now try 10 minutes.', 'info');
          } else {
            api.feedback('Now try 2 minutes.', 'info');
          }
        },
        0,
        k === 10 ? 330 : 450
      );
    }
  }

  /* ---------------------------------------------------------------- *
   * Practice
   * ---------------------------------------------------------------- */
  var deck = null;

  function renderUnit(stage, api, q) {
    var it = q.item;
    api.say(it.special === 'smallest' ? 'Which unit is best? Look at the list carefully.' : 'Which unit of time is best?', 'think');
    var wrap = el('div', { class: 'omc-q', 'data-answer': q.ans });
    wrap.appendChild(MQ.ui.prompt('Which unit is best for <b>' + it.name + '</b>?'));
    var card = itemCard(it);
    wrap.appendChild(card);
    var why = el('p', { class: 'omc-why' });
    var ch = tagChoices(
      MQ.ui.choices(
        q.opts.map(function (u) {
          return { label: unitLabel(u), value: u };
        }),
        function (v) {
          if (v === q.ans) {
            ch.mark(v, 'good');
            ch.disable();
            flyInto(api, card, buttonFor(ch, v), it.icon);
            why.textContent = it.why;
            api.check(true, it.why);
          } else {
            ch.mark(v, 'bad');
            api.check(false, unitHint(q, v, api.tries()), unitTag(q, v));
          }
        },
        { columns: 3 }
      )
    );
    ch.classList.add('omc-boxes');
    wrap.appendChild(ch);
    wrap.appendChild(why);
    stage.appendChild(wrap);
    api.onReveal(function () {
      ch.mark(q.ans, 'good');
      ch.disable();
      flyInto(api, card, buttonFor(ch, q.ans), it.icon);
      why.textContent = it.why;
      api.feedback(it.why, 'info');
    });
  }

  function unitHint(q, v, tries) {
    var it = q.item;
    if (tries >= 1) return it.clue;
    var bigger = unitIdx(v) > unitIdx(q.ans);
    if (it.special === 'smallest') return cap(it.name) + ' is very quick! ' + cap(v) + ' would be far too long.';
    if (it.special === 'slow') return 'Could you watch it happen in a few ' + v + '? It is very slow. Think of a bigger unit.';
    if (bigger) return 'Hmm, ' + v + ' is far too long for ' + it.name + '. Picture doing it.';
    return 'Hmm, ' + it.name + ' takes much longer than a few ' + v + '. Picture it.';
  }

  function unitTag(q, v) {
    if (q.item.special === 'smallest') return 'No seconds on the list: did not pick the smallest unit';
    if (q.item.special === 'slow' && unitIdx(v) < unitIdx(q.ans)) return 'Thought slow growing is quick';
    return 'Unit far too big or too small';
  }

  function renderDur(stage, api, q) {
    var it = q.item;
    api.say('Which makes more sense?', 'think');
    var wrap = el('div', { class: 'omc-q', 'data-answer': q.ans });
    wrap.appendChild(MQ.ui.prompt('How long does <b>' + it.name + '</b> take?'));
    var card = itemCard(it);
    wrap.appendChild(card);
    var why = el('p', { class: 'omc-why' });
    var ch = tagChoices(
      MQ.ui.choices(
        q.opts.map(function (o) {
          return { label: 'About <b>' + o + '</b>', value: o };
        }),
        function (v) {
          if (v === q.ans) {
            ch.mark(v, 'good');
            ch.disable();
            flyInto(api, card, buttonFor(ch, v), it.icon);
            why.textContent = it.why;
            api.check(true, it.why);
          } else {
            ch.mark(v, 'bad');
            api.check(false, api.tries() >= 1 ? it.clue + ' Which one fits?' : 'Imagine ' + it.name + '. Would it really take ' + v + '?', 'Thought time units are all the same size');
          }
        },
        { columns: 2 }
      )
    );
    ch.classList.add('omc-boxes', 'omc-two');
    wrap.appendChild(ch);
    wrap.appendChild(why);
    stage.appendChild(wrap);
    api.onReveal(function () {
      ch.mark(q.ans, 'good');
      ch.disable();
      flyInto(api, card, buttonFor(ch, q.ans), it.icon);
      why.textContent = it.why;
      api.feedback(it.why, 'info');
    });
  }

  function renderSort4(stage, api, q) {
    var it = q.item;
    api.say('Which box is closest?', 'think');
    var wrap = el('div', { class: 'omc-q', 'data-answer': q.ans });
    wrap.appendChild(MQ.ui.prompt('How long does <b>' + it.name + '</b> take?'));
    var card = itemCard(it);
    wrap.appendChild(card);
    var why = el('p', { class: 'omc-why' });
    var ch = tagChoices(
      MQ.ui.choices(
        BOXES4.map(function (b) {
          return { label: '<span class="omc-bicon">' + b.icon + '</span>' + b.label, value: b.v };
        }),
        function (v) {
          if (v === q.ans) {
            ch.mark(v, 'good');
            ch.disable();
            flyInto(api, card, buttonFor(ch, v), it.icon);
            why.textContent = it.why;
            api.check(true, it.why);
          } else {
            ch.mark(v, 'bad');
            api.check(false, sortHint(q, v, api.tries()), sortTag(q, v));
          }
        },
        { columns: 4 }
      )
    );
    ch.classList.add('omc-boxes', 'omc-four');
    wrap.appendChild(ch);
    wrap.appendChild(why);
    stage.appendChild(wrap);
    api.onReveal(function () {
      ch.mark(q.ans, 'good');
      ch.disable();
      flyInto(api, card, buttonFor(ch, q.ans), it.icon);
      why.textContent = it.why;
      api.feedback(it.why, 'info');
    });
  }

  function sortHint(q, v, tries) {
    var a = q.item.ans;
    if (a === 'more' && v === 'hour') return 'An hour is a very long time. ' + (tries >= 1 ? 'Think of your one-minute test: ' + q.item.name + ' takes a few of those minutes, not a whole hour.' : 'Does ' + q.item.name + ' really take that long?');
    if (a === 'hour' && v === 'more') return 'Yes, a lesson is more than 1 minute, but one box is closer. ' + (tries >= 1 ? 'Is it nearer to 1 minute or to 1 hour?' : 'How long is a lesson?');
    if (tries >= 1) {
      if (a === 'less') return 'Count how long it takes: one, done! That is much less than 1 minute.';
      if (a === 'more') return 'Think of your one-minute test. Could you finish ' + q.item.name + ' that fast? It takes a few minutes.';
      return 'A lesson is a lot longer than a few minutes. Think of the clock going all the way round.';
    }
    if (a === 'less') return 'Try it now! How long did that take? Much less than a whole minute?';
    if (a === 'more') return 'Could you finish ' + q.item.name + ' in one minute? Think again.';
    return 'A lesson is much longer than a minute or two.';
  }

  function sortTag(q, v) {
    var a = q.item.ans;
    if (a === 'more' && v === 'hour') return 'An hour is a very long time. ' + (tries >= 1 ? 'Think of your one-minute test: ' + q.item.name + ' takes a few of those minutes, not a whole hour.' : 'Does ' + q.item.name + ' really take that long?');
    if (a === 'hour' && v === 'more') return 'Picked a box that is not the closest';
    if ((a === 'hour') !== (v === 'hour')) return 'Unit far too big or too small';
    return 'Mixed up less than and more than 1 minute';
  }

  function stepsTag(q, v) {
    var s = q.s;
    var k = q.k;
    if (v === s + k) return k === 2 ? 'Added instead of doubling' : 'Added 10 instead of adding 10 lots';
    if (v === s) return 'Gave the 1-minute number';
    if (v % s === 0 && v !== s * k) return 'Counted the wrong number of minutes';
    return 'Slip adding the bars';
  }

  function renderSteps(stage, api, q) {
    var s = q.s;
    var k = q.k;
    api.say('I take ' + s + ' steps in one minute. Use the bars!', 'think');
    var wrap = el('div', { class: 'omc-q', 'data-answer': String(q.ans) });
    wrap.appendChild(MQ.ui.prompt('Bolt takes <b>' + s + ' steps</b> in 1 minute.<br>How many steps in <b>' + k + ' minutes</b>?'));
    var st = strip(s, k);
    st.show(1, 0);
    wrap.appendChild(st.el);
    wrap.appendChild(el('p', { class: 'omc-note' }, 'One bar for each minute. Each bar is ' + s + ' steps.'));
    var work = el('div', { class: 'omc-work' });
    var inp = MQ.ui.numberInput({
      unit: 'steps',
      onSubmit: function (num) {
        if (num !== Math.round(num) || num < 0) {
          api.feedback('Type a whole number of steps.', 'info');
          return;
        }
        if (num === q.ans) {
          inp.good();
          inp.disable();
          st.show(k);
          MQ.clear(work);
          work.appendChild(repeatedSum(s, k, 'steps'));
          api.check(true, k + ' bars of ' + s + ' make ' + q.ans + ' steps!');
        } else {
          inp.bad();
          var t = api.tries();
          var hint;
          if (t >= 1) {
            st.show(Math.min(k, 3), Math.min(k, 3));
            hint = k === 2 ? 'Two bars: ' + s + ' + ' + s + '. Double ' + s + '.' : 'Keep counting on in jumps of ' + s + ': ' + s + ', ' + 2 * s + ', ' + 3 * s + ' … until you have 10 bars.';
          } else if (num === s + k) {
            hint = k === 2 ? 'Not + 2! 2 minutes means 2 bars of ' + s + '. Add ' + s + ' + ' + s + '.' : 'Not + 10! 10 minutes means 10 bars of ' + s + '.';
          } else {
            hint = k === 2 ? '2 minutes is one minute and another minute: ' + s + ' + ' + s + '.' : '10 minutes is 10 bars. Count on in jumps of ' + s + ', one jump for each minute.';
          }
          api.check(false, hint, stepsTag(q, num));
        }
      },
    });
    wrap.appendChild(inp.el);
    wrap.appendChild(work);
    stage.appendChild(wrap);
    inp.focus();
    api.onReveal(function () {
      inp.setValue(String(q.ans));
      inp.good();
      inp.disable();
      st.animate(api, k, function () {
        MQ.clear(work);
        work.appendChild(repeatedSum(s, k, 'steps'));
      }, 0, k === 10 ? 280 : 450);
      api.feedback(k + ' bars of ' + s + ': count on ' + s + ' each time. The last number is ' + q.ans + ' steps.', 'info');
    });
  }

  function sleepTag(q, v) {
    var h = q.h;
    if (v === h * 6) return 'Counted 6 nights for a week';
    if (v === h + 7) return 'Added 7 instead of adding 7 nights';
    if (v === h * 5) return 'Counted only 5 nights (school nights)';
    if (v === h * 8) return 'Counted 8 nights for a week';
    if (v === h) return 'Gave the hours for one night';
    return 'Slip adding the bars';
  }

  function renderSleep(stage, api, q) {
    var h = q.h;
    api.say('One bar for each night of the week!', 'think');
    var wrap = el('div', { class: 'omc-q', 'data-answer': String(q.ans) });
    wrap.appendChild(MQ.ui.prompt('You sleep <b>' + h + ' hours</b> every night.<br>How many hours of sleep in <b>1 week</b>?'));
    var st = strip(h, 7, { labels: DAYS7 });
    st.show(1, 0);
    wrap.appendChild(st.el);
    wrap.appendChild(el('p', { class: 'omc-note' }, '🌙 One bar for each night. Each bar is ' + h + ' hours.'));
    var work = el('div', { class: 'omc-work' });
    var inp = MQ.ui.numberInput({
      unit: 'hours',
      onSubmit: function (num) {
        if (num !== Math.round(num) || num < 0) {
          api.feedback('Type a whole number of hours.', 'info');
          return;
        }
        if (num === q.ans) {
          inp.good();
          inp.disable();
          st.show(7);
          MQ.clear(work);
          work.appendChild(repeatedSum(h, 7, 'hours'));
          api.check(true, '7 nights of ' + h + ' hours make ' + q.ans + ' hours!');
        } else {
          inp.bad();
          var hint;
          if (api.tries() >= 1) {
            st.show(3, 3);
            hint = 'Count on ' + h + ' for every night: ' + h + ', ' + 2 * h + ', ' + 3 * h + ' … Keep going to Sunday.';
          } else if (num === h * 6) {
            hint = 'So close! Count the nights: Monday to Sunday is 7 nights, not 6.';
          } else if (num === h + 7) {
            hint = 'Not + 7! A week is 7 nights, so add ' + h + ' seven times.';
          } else {
            hint = 'A week has 7 nights. Add ' + h + ' for each night, Monday to Sunday.';
          }
          api.check(false, hint, sleepTag(q, num));
        }
      },
    });
    wrap.appendChild(inp.el);
    wrap.appendChild(work);
    stage.appendChild(wrap);
    inp.focus();
    api.onReveal(function () {
      inp.setValue(String(q.ans));
      inp.good();
      inp.disable();
      st.animate(api, 7, function () {
        MQ.clear(work);
        work.appendChild(repeatedSum(h, 7, 'hours'));
      }, 0, 380);
      api.feedback('7 nights, ' + h + ' hours each: ' + h + ', ' + 2 * h + ', ' + 3 * h + ', ' + 4 * h + ', ' + 5 * h + ', ' + 6 * h + ', ' + 7 * h + '. That is ' + q.ans + ' hours.', 'info');
    });
  }

  MQ.register(ID, {
    learn: [learnSorter, learnMinute, learnScale],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'unit') return renderUnit(stage, api, q);
        if (q.type === 'dur') return renderDur(stage, api, q);
        if (q.type === 'sort4') return renderSort4(stage, api, q);
        if (q.type === 'steps') return renderSteps(stage, api, q);
        return renderSleep(stage, api, q);
      },
    },
  });
  // Test hook (harmless): lets test scripts build decks and check the data.
  MQ.activities[ID]._test = { buildDeck: buildDeck, data: { L1: L1_ITEMS, SMALL: SMALL_ITEMS, SLOW: SLOW_ITEMS, DUR: DURATIONS, SORT4: SORT4, STEPS: STEP_SIZES } };

  var css = [
    '.omc-sorter-wrap{width:100%;max-width:900px}',
    '.omc-sorter{display:block;width:100%;user-select:none;-webkit-user-select:none}',
    '.omc-sbox-r{fill:#f7f9ff;stroke:var(--line);stroke-width:3;stroke-dasharray:8 6}',
    '.omc-sbox{cursor:pointer}',
    '.omc-sbox.omc-hot .omc-sbox-r{fill:#e8faf7;stroke:var(--accent);stroke-dasharray:none}',
    '.omc-sbox-t{font-size:19px;font-weight:800;fill:var(--ink);font-family:inherit}',
    '.omc-scard-r{fill:#fff;stroke:#9fb3d9;stroke-width:3;filter:drop-shadow(0 2px 3px rgba(27,42,74,.18))}',
    '.omc-scard.dragging .omc-scard-r,.omc-scard.omc-sel .omc-scard-r{stroke:#ffb703;stroke-width:4}',
    '.omc-scard.omc-placed .omc-scard-r{stroke:var(--good);fill:var(--good-bg);filter:none}',
    '.omc-scard-e{font-size:30px}',
    '.omc-scard-t{font-size:15px;font-weight:800;fill:var(--ink);font-family:inherit}',
    '.omc-card{display:flex;align-items:center;gap:14px;font-size:1.5rem;font-weight:800;background:#fff;border:3px dashed var(--line);border-radius:16px;padding:10px 24px;will-change:transform}',
    '.omc-card-icon{font-size:2.6rem;line-height:1}',
    '.omc-q{display:flex;flex-direction:column;align-items:center;gap:14px;width:100%}',
    '.omc-boxes{max-width:720px}',
    '.omc-boxes .choice{min-height:84px;position:relative;line-height:1.25}',
    '.omc-two{max-width:520px}',
    '.omc-four{max-width:820px}',
    '.omc-four .choice{font-size:1.05rem}',
    '.omc-bicon{display:block;font-size:1.6rem;line-height:1.2}',
    '.omc-in{position:absolute;top:4px;right:8px;font-size:1.5rem;animation:mcPop .35s ease}',
    '@keyframes mcPop{0%{transform:scale(.2)}100%{transform:scale(1)}}',
    '.omc-why{min-height:1.4em;margin:0;font-size:1.15rem;font-weight:700;color:var(--good);text-align:center}',
    '.omc-minute{display:flex;flex-direction:column;align-items:center;gap:14px;width:100%;max-width:760px}',
    '.omc-who{margin:0;font-size:1.1rem;color:var(--ink-soft);text-align:center}',
    '.omc-guess-chip{font-size:1.3rem;background:var(--info-bg);border-radius:14px;padding:8px 18px}',
    '.omc-start{font-size:1.3rem;min-height:64px;padding:10px 34px}',
    '.omc-run{display:flex;align-items:center;justify-content:center;gap:34px;flex-wrap:wrap}',
    '.omc-timer{max-width:100%;height:auto}',
    '.omc-ring-bg{fill:#fff;stroke:var(--paper-2);stroke-width:12}',
    '.omc-ring{fill:none;stroke:var(--accent);stroke-width:12;stroke-linecap:round;transition:stroke-dashoffset .2s linear}',
    '.omc-sec{font-size:34px;font-weight:800;fill:var(--ink);font-family:inherit}',
    '.omc-run-mid{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.omc-count-lab{font-weight:800;color:var(--ink-soft)}',
    '.omc-count{font-size:3rem;font-weight:800;line-height:1}',
    '.omc-tap{font-size:1.5rem;min-height:84px;min-width:220px;border-radius:20px;background:#ffd166}',
    '.omc-tap:active{transform:scale(.96)}',
    '.omc-skip{background:var(--paper-2);color:var(--ink);min-height:44px;font-size:.95rem}',
    '.omc-res{display:flex;flex-direction:column;gap:10px;width:100%;max-width:640px}',
    '.omc-res-row{display:grid;grid-template-columns:120px minmax(0,1fr) 60px;align-items:center;gap:10px}',
    '.omc-res-lab{font-weight:800;text-align:right}',
    '.omc-res-track{background:var(--paper-2);border-radius:10px;height:34px;overflow:hidden}',
    '.omc-res-bar{height:100%;border-radius:10px}',
    '.omc-res-g{background:#8ecae6}',
    '.omc-res-r{background:var(--accent)}',
    '.omc-res-n{font-size:1.4rem}',
    '.omc-res-msg{margin:0;font-size:1.15rem;font-weight:700;text-align:center}',
    '.omc-again{background:var(--paper-2);color:var(--ink)}',
    '.omc-hist{display:flex;flex-direction:column;align-items:center;gap:2px;font-size:.95rem;color:var(--ink-soft)}',
    '.omc-hist-h{font-weight:800}',
    '.omc-strip-wrap{width:100%;display:flex;justify-content:center}',
    '.omc-strip{display:block}',
    '.omc-slot-lab{font-size:14px;font-weight:700;fill:var(--ink-soft);font-family:inherit}',
    '.omc-seg-empty{fill:#fff;stroke:var(--line);stroke-width:2;stroke-dasharray:6 5}',
    '.omc-seg-0{fill:#ffd166;stroke:#c99a1f;stroke-width:2}',
    '.omc-seg-1{fill:#ffe29a;stroke:#c99a1f;stroke-width:2}',
    '.omc-seg-num{font-size:20px;font-weight:800;fill:var(--ink);font-family:inherit}',
    '.omc-tick{stroke:var(--ink-soft);stroke-width:2}',
    '.omc-tot{font-size:17px;font-weight:800;fill:#0b6e66;font-family:inherit}',
    '.omc-tot0{fill:var(--ink-soft)}',
    '.omc-tot-last{fill:var(--good);font-size:19px}',
    '.omc-kbtns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}',
    '.omc-kbtn{min-width:130px}',
    '.omc-scale-out{display:flex;flex-direction:column;align-items:center;gap:8px;min-height:90px}',
    '.omc-scale-txt{margin:0;font-size:1.2rem;font-weight:800}',
    '.omc-note{margin:0;color:var(--ink-soft);font-weight:700}',
    '.omc-work{min-height:10px}',
    '.omc-work .sum-row{font-size:1.1rem}',
    '@media (max-width:640px){.omc-four{grid-template-columns:repeat(2,minmax(0,1fr))!important}.omc-run{gap:16px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

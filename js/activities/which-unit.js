/* Which Unit? — choose cm, m or km (Unit 6.1). Reference example of the activity API. */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var U = MQ.util;

  var BAYS = {
    cm: { name: 'centimetres', short: 'cm', icon: '✋', rule: 'Small things that fit in your hand' },
    m: { name: 'metres', short: 'm', icon: '🚶', rule: 'Rooms, people, vehicles: a few big steps' },
    km: { name: 'kilometres', short: 'km', icon: '🚗', rule: 'Long journeys: you need a car or a long walk' },
  };

  // Things to sort. why = the reason shown when the child picks the wrong unit.
  var ITEMS = [
    { name: 'a pencil', icon: '✏️', unit: 'cm', why: 'A pencil fits in your hand' },
    { name: 'an eraser', icon: '🧽', unit: 'cm', why: 'An eraser is tiny' },
    { name: 'a spoon', icon: '🥄', unit: 'cm', why: 'A spoon fits in your hand' },
    { name: 'a toothbrush', icon: '🪥', unit: 'cm', why: 'A toothbrush fits in your hand' },
    { name: 'a shoe', icon: '👟', unit: 'cm', why: 'A shoe is shorter than a ruler and a half' },
    { name: 'an ant', icon: '🐜', unit: 'cm', why: 'An ant is smaller than your fingernail' },
    { name: 'a key', icon: '🔑', unit: 'cm', why: 'A key fits in your hand' },
    { name: 'a crayon', icon: '🖍️', unit: 'cm', why: 'A crayon fits in your hand' },
    { name: 'the height of a door', icon: '🚪', unit: 'm', why: 'A door is taller than you but you can walk through it' },
    { name: 'the length of a bus', icon: '🚌', unit: 'm', why: 'A bus is long, but you can walk past it in a few steps' },
    { name: 'the length of a classroom', icon: '🏫', unit: 'm', why: 'You can walk across a classroom in a few steps' },
    { name: 'a swimming pool', icon: '🏊', unit: 'm', why: 'You can swim across a pool' },
    { name: 'the height of a giraffe', icon: '🦒', unit: 'm', why: 'A giraffe is tall, but only a few metres' },
    { name: 'a football pitch', icon: '⚽', unit: 'm', why: 'A football pitch is big, but you can run across it' },
    { name: 'a train', icon: '🚆', unit: 'm', why: 'A train is long, but you could walk along it in a minute or two' },
    { name: 'a whale', icon: '🐋', unit: 'm', why: 'A whale is huge, but it is not a journey' },
    { name: 'the distance to another city', icon: '🏙️', unit: 'km', why: 'Going to another city is a long journey' },
    { name: 'a marathon race', icon: '🏃', unit: 'km', why: 'A marathon is a very long run' },
    { name: 'a long train journey', icon: '🛤️', unit: 'km', why: 'A journey is a long distance' },
    { name: 'the distance between two continents', icon: '🌍', unit: 'km', why: 'Continents are very far apart' },
    { name: 'the drive to the airport', icon: '✈️', unit: 'km', why: 'You need a car to get there' },
    { name: 'a long car trip to the seaside', icon: '🚗', unit: 'km', why: 'A long car trip is a long distance' },
  ];

  // "About ___" sentences: sensible-unit questions with a number given.
  var SENTENCES = [
    { text: 'A pencil is about <b>15</b> ___ long.', unit: 'cm' },
    { text: 'A door is about <b>2</b> ___ tall.', unit: 'm' },
    { text: 'The next city is about <b>40</b> ___ away.', unit: 'km' },
    { text: 'A bus is about <b>12</b> ___ long.', unit: 'm' },
    { text: 'A spoon is about <b>18</b> ___ long.', unit: 'cm' },
    { text: 'A marathon race is about <b>42</b> ___ long.', unit: 'km' },
    { text: 'A classroom is about <b>9</b> ___ long.', unit: 'm' },
    { text: 'My finger is about <b>1</b> ___ wide.', unit: 'cm' },
    { text: 'A football pitch is about <b>100</b> ___ long.', unit: 'm' },
    { text: 'A shoe is about <b>20</b> ___ long.', unit: 'cm' },
    { text: 'The airport is about <b>25</b> ___ from home.', unit: 'km' },
    { text: 'A giraffe is about <b>5</b> ___ tall.', unit: 'm' },
  ];

  function mistakeFor(correct, chosen) {
    if (correct === 'm' && chosen === 'km') return 'Used km for big things that are not far away';
    if (correct === 'cm' && chosen !== 'cm') return 'Used a unit that is too big for small things';
    if (correct === 'km' && chosen !== 'km') return 'Used a unit that is too small for journeys';
    return 'Used cm for metre-sized things';
  }

  function bayCard(key) {
    var b = BAYS[key];
    return el('div', { class: 'wu-bay' }, el('div', { class: 'wu-bay-icon' }, b.icon), el('div', { class: 'wu-bay-unit' }, b.short), el('div', { class: 'wu-bay-name' }, b.name), el('div', { class: 'wu-bay-rule' }, b.rule));
  }

  var deck = null; // practice questions for this run

  function buildDeck() {
    var cm = U.shuffle(ITEMS.filter(function (i) { return i.unit === 'cm'; }));
    var m = U.shuffle(ITEMS.filter(function (i) { return i.unit === 'm'; }));
    var km = U.shuffle(ITEMS.filter(function (i) { return i.unit === 'km'; }));
    var sentences = U.shuffle(SENTENCES);
    var q = [];
    // Level 1: one of each, plain sorting
    U.shuffle([cm[0], m[0], km[0]]).forEach(function (it) { q.push({ type: 'sort', item: it }); });
    // Level 2: tricky big-but-near items + sentences
    q.push({ type: 'sort', item: m[1] });
    q.push({ type: 'sentence', s: sentences[0] });
    q.push({ type: 'sort', item: cm[1] });
    q.push({ type: 'sentence', s: sentences[1] });
    // Level 3: odd one out + more sentences
    q.push({ type: 'which-km', options: U.shuffle([km[1], m[2], cm[2]]) });
    q.push({ type: 'sentence', s: sentences[2] });
    q.push({ type: 'which-km', options: U.shuffle([km[2], m[3], m[4]]) });
    return q;
  }

  MQ.register('which-unit', {
    learn: [
      function (stage, api) {
        api.say('We measure small things in centimetres, bigger things in metres, and long journeys in kilometres.');
        stage.appendChild(MQ.ui.lesson('Three units of length', '1 metre = 100 centimetres &nbsp;·&nbsp; 1 kilometre = 1000 metres'));
        stage.appendChild(el('div', { class: 'wu-bays' }, bayCard('cm'), bayCard('m'), bayCard('km')));
      },
      function (stage, api) {
        api.say('Your turn! Which unit would you use for each thing?');
        api.lockNext();
        var tryItems = U.shuffle([ITEMS[0], ITEMS[9], ITEMS[16]]);
        var n = 0;
        var holder = el('div', { class: 'wu-try' });
        stage.appendChild(MQ.ui.lesson('Sort them', 'Click the unit you would use.'));
        stage.appendChild(holder);
        function show() {
          MQ.clear(holder);
          if (n >= tryItems.length) {
            api.say('Great sorting! Now let\'s practise.', 'cheer');
            api.feedback('All sorted! Press the button to start practising.', 'good');
            api.unlockNext();
            return;
          }
          var it = tryItems[n];
          holder.appendChild(el('div', { class: 'wu-item' }, el('span', { class: 'wu-item-icon' }, it.icon), el('span', null, it.name)));
          var ch = MQ.ui.choices(['cm', 'm', 'km'].map(function (k) { return { label: BAYS[k].icon + ' ' + k, value: k }; }), function (v) {
            if (v === it.unit) {
              ch.mark(v, 'good');
              ch.disable();
              api.sound('correct');
              api.feedback(it.why + ', so we use ' + BAYS[it.unit].name + '.', 'good');
              n++;
              api.later(show, 1400);
            } else {
              ch.mark(v, 'bad');
              api.sound('wrong');
              api.feedback('Hmm. ' + it.why + '. Try another unit.', 'try');
            }
          }, { columns: 3 });
          holder.appendChild(ch);
        }
        show();
      },
    ],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];

        if (q.type === 'sort') {
          api.say('What would you measure this in?', 'think');
          stage.appendChild(el('div', { class: 'wu-item wu-item-big' }, el('span', { class: 'wu-item-icon' }, q.item.icon), el('span', null, q.item.name)));
          var ch = MQ.ui.choices(['cm', 'm', 'km'].map(function (k) { return { label: BAYS[k].icon + ' ' + BAYS[k].name, value: k }; }), function (v) {
            if (v === q.item.unit) {
              ch.mark(v, 'good');
              ch.disable();
              api.check(true, q.item.why + ' → ' + BAYS[q.item.unit].name + '!');
            } else {
              ch.mark(v, 'bad');
              api.check(false, 'Think again. ' + q.item.why + '.', mistakeFor(q.item.unit, v));
            }
          }, { columns: 3 });
          stage.appendChild(ch);
          api.onReveal(function () {
            ch.mark(q.item.unit, 'good');
            ch.disable();
            api.feedback(q.item.why + ', so we use ' + BAYS[q.item.unit].name + '.', 'info');
          });
          return;
        }

        if (q.type === 'sentence') {
          api.say('Which unit makes sense?', 'think');
          var promptEl = MQ.ui.prompt(q.s.text.replace('___', '<span class="wu-blank">?</span>'));
          stage.appendChild(promptEl);
          var ch2 = MQ.ui.choices(['cm', 'm', 'km'], function (v) {
            if (v === q.s.unit) {
              ch2.mark(v, 'good');
              ch2.disable();
              promptEl.innerHTML = q.s.text.replace('___', '<span class="wu-blank wu-filled">' + v + '</span>');
              api.check(true);
            } else {
              ch2.mark(v, 'bad');
              api.check(false, 'Would that be sensible? Imagine it in real life.', mistakeFor(q.s.unit, v));
            }
          }, { columns: 3 });
          stage.appendChild(ch2);
          api.onReveal(function () {
            ch2.mark(q.s.unit, 'good');
            ch2.disable();
            promptEl.innerHTML = q.s.text.replace('___', '<span class="wu-blank wu-filled">' + q.s.unit + '</span>');
          });
          return;
        }

        // which-km: pick the one thing measured in kilometres
        api.say('Only one of these is measured in kilometres. Which one?', 'think');
        stage.appendChild(MQ.ui.prompt('Which one is measured in <b>kilometres</b>?'));
        var correct = q.options.filter(function (o) { return o.unit === 'km'; })[0];
        var ch3 = MQ.ui.choices(q.options.map(function (o) { return { label: '<span class="wu-opt-icon">' + o.icon + '</span><br>' + o.name, value: o.name }; }), function (v) {
          var picked = q.options.filter(function (o) { return o.name === v; })[0];
          if (picked.unit === 'km') {
            ch3.mark(v, 'good');
            ch3.disable();
            api.check(true, correct.why + ' → kilometres!');
          } else {
            ch3.mark(v, 'bad');
            api.check(false, picked.why + ', so that one is measured in ' + BAYS[picked.unit].name + '.', mistakeFor(picked.unit, 'km'));
          }
        }, { columns: 3 });
        stage.appendChild(ch3);
        api.onReveal(function () {
          ch3.mark(correct.name, 'good');
          ch3.disable();
        });
      },
    },
  });

  // Activity-specific styles (kept with the activity so files stay independent).
  var css = [
    '.wu-bays{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;width:100%;max-width:760px}',
    '.wu-bay{background:#fff;border:3px solid var(--line);border-radius:16px;padding:14px;text-align:center}',
    '.wu-bay-icon{font-size:2.2rem}',
    '.wu-bay-unit{font-size:2rem;font-weight:800;color:#0b6e66}',
    '.wu-bay-name{font-weight:800}',
    '.wu-bay-rule{color:var(--ink-soft);font-size:.9rem;margin-top:4px}',
    '.wu-try{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.wu-item{display:flex;align-items:center;gap:12px;font-size:1.4rem;font-weight:800;background:#fff;border:3px dashed var(--line);border-radius:16px;padding:12px 20px}',
    '.wu-item-big{font-size:1.6rem;padding:18px 26px}',
    '.wu-item-icon{font-size:2.6rem}',
    '.wu-opt-icon{font-size:2rem}',
    '.wu-blank{display:inline-block;min-width:60px;border-bottom:4px solid var(--accent);color:var(--ink-soft)}',
    '.wu-filled{color:var(--good)}',
    '@media (max-width:640px){.wu-bays{grid-template-columns:1fr}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'which-unit' }, css));
})();

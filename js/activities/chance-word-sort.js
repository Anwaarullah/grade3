/* Will It Happen? — sort everyday events into will / might / will not happen (Unit 16.1 Chance). */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  /* ---------------------------------------------------------------- *
   * Bins and reasons
   * ---------------------------------------------------------------- */
  var BIN3 = [
    { key: 'will', label: 'will happen', icon: '✔', cls: 'will' },
    { key: 'might', label: 'might happen', icon: '?', cls: 'might', sub: 'also: may happen' },
    { key: 'wont', label: 'will not happen', icon: '✖', cls: 'wont' },
  ];
  var BIN2 = [
    { key: 'possible', label: 'possible', icon: '✔', cls: 'will', sub: 'it can happen' },
    { key: 'impossible', label: 'impossible', icon: '✖', cls: 'wont', sub: 'it can never happen' },
  ];
  var LABEL = { will: 'will happen', might: 'might happen', wont: 'will not happen', possible: 'possible', impossible: 'impossible' };
  var REASONS = { will: 'It happens every day', might: 'It can happen, but not always', wont: 'It can never happen' };

  var TAG = {
    mightAsWont: 'Said "will not happen" for something that could happen',
    unusualAsImpossible: 'Called an unusual (but possible) event impossible',
    usualAsCertain: 'Said "will happen" for something that does not happen every time',
    certainAsMight: 'Said "might" for something that is sure to happen',
    impossibleAsMight: 'Said "might" or "possible" for something that can never happen',
    willWontMix: 'Mixed up "will happen" and "will not happen"',
    reason: 'Reason did not match the chosen bin',
    likely: 'Mixed up likely and unlikely on a spinner',
  };

  /* ---------------------------------------------------------------- *
   * Event cards (all original, everyday)
   * ---------------------------------------------------------------- */
  // Level 1 clear-cut cards
  var WILL = [
    { icon: '💧', text: 'The water in a full cup will be wet.', why: 'Water is always wet.' },
    { icon: '🧊', text: 'An ice cube left in the hot sun will melt.', why: 'Hot sun always melts ice.' },
    { icon: '⚽', text: 'A ball you drop will fall down.', why: 'Dropped things always fall down.' },
    { icon: '📅', text: 'The day after Monday will be Tuesday.', why: 'Tuesday always comes after Monday.' },
  ];
  var WONT = [
    { icon: '🐱', text: 'A cat will drive the school bus.', why: 'Cats cannot drive.' },
    { icon: '🥕', text: 'A carrot will get up and walk away.', why: 'Carrots cannot walk.' },
    { icon: '🐟', text: 'A goldfish will bark like a dog.', why: 'Goldfish cannot bark.' },
    { icon: '🪑', text: 'A chair will fly around the classroom by itself.', why: 'Chairs cannot fly.' },
    { icon: '✏️', text: 'A pencil will turn into a banana.', why: 'A pencil can never turn into a banana.' },
    { icon: '🪙', text: 'A tossed coin will land on 7.', why: 'A coin only has heads and tails. There is no 7.' },
    { icon: '🧒', text: 'You will be 100 years old tomorrow.', why: 'Nobody grows that much in one day.' },
  ];
  var MIGHT = [
    { icon: '🌧️', text: 'It will rain at school today.', why: 'Some days it rains, some days it does not.' },
    { icon: '🪙', text: 'A coin you toss will land on heads.', why: 'It could land on heads or on tails.' },
    { icon: '🚗', text: 'The next car you see will be blue.', why: 'Some cars are blue, but lots are not.' },
    { icon: '☎️', text: 'The phone will ring during dinner.', why: 'Sometimes it rings, sometimes it does not.' },
    { icon: '⭐', text: 'You will get a sticker at school today.', why: 'You get one on some days, not every day.' },
    { icon: '🍞', text: 'The shop will have run out of bread.', why: 'Sometimes the bread is all gone, but usually not.' },
  ];
  WILL.forEach(function (c) { c.ans = 'will'; });
  WONT.forEach(function (c) { c.ans = 'wont'; });
  MIGHT.forEach(function (c) { c.ans = 'might'; });

  // Level 2 "sure vs possible" pairs
  var PAIRS = [
    [
      { icon: '🌇', text: 'The sun will set tonight.', why: 'The sun sets every evening.', ans: 'will' },
      { icon: '🌈', text: 'You will see a rainbow today.', why: 'A rainbow needs rain and sun together. It can happen, but not every day.', ans: 'might' },
    ],
    [
      { icon: '🎲', text: 'You roll a dice and get a number less than 7.', why: 'Every number on a dice (1 to 6) is less than 7.', ans: 'will' },
      { icon: '🎲', text: 'You roll a dice and get a 6.', why: 'You could get a 6, or 1, 2, 3, 4 or 5.', ans: 'might' },
    ],
    [
      { icon: '🗓️', text: 'Next week will have 7 days.', why: 'Every week has 7 days.', ans: 'will' },
      { icon: '🎉', text: 'Someone in your class will have a birthday next week.', why: 'There might be a birthday that week, or there might not.', ans: 'might' },
    ],
    [
      { icon: '🎂', text: 'On your next birthday you will be one year older.', why: 'Every birthday makes you one year older.', ans: 'will' },
      { icon: '🚲', text: 'You will get a bike for your next birthday.', why: 'You might get a bike, or a different present.', ans: 'might' },
    ],
    [
      { icon: '⏰', text: 'One hour after 2 o\'clock it will be 3 o\'clock.', why: 'One hour after 2 o\'clock is always 3 o\'clock.', ans: 'will' },
      { icon: '📚', text: 'Your teacher will read a story this afternoon.', why: 'Some afternoons there is a story, some days there is not.', ans: 'might' },
    ],
    [
      { icon: '🌂', text: 'If you stand in heavy rain with no umbrella, you will get wet.', why: 'Heavy rain always makes you wet.', ans: 'will' },
      { icon: '🌬️', text: 'It will be windy tomorrow.', why: 'Tomorrow could be windy or calm.', ans: 'might' },
    ],
  ];

  // Rare-but-possible cards (answer: might / possible)
  var RARE = [
    { icon: '🌳', text: 'A tree in the park will fall down today.', why: 'Trees can fall in a big storm. It is rare, but it can happen.' },
    { icon: '💡', text: 'The lights at home will go off in a power cut tonight.', why: 'Power cuts are rare, but they can happen.' },
    { icon: '🪙', text: 'You will find a coin on the pavement today.', why: 'People do drop coins. It is rare, but it can happen.' },
    { icon: '🍕', text: 'Your teacher will bring pizza for the whole class.', why: 'It does not happen often, but it could!' },
    { icon: '🧦', text: 'A sock will go missing in the wash.', why: 'It does not happen often, but socks do go missing!' },
    { icon: '🎈', text: 'A balloon will float over the school today.', why: 'It is unusual, but a balloon could float past.' },
  ];
  RARE.forEach(function (c) {
    c.ans = 'might';
    c.rare = true;
    c.ok = ['might'];
    c.talk = c.why + ' So it might happen: it can happen, but not always.';
  });

  // Level 3 judgement cards: ok = bins that are fine with a matching reason (first = model answer)
  var USUAL = [
    { icon: '🥪', text: 'You will eat lunch today.', ok: ['will', 'might'], talk: 'Most days you eat lunch, so "will happen: it happens every day" is fine. "Might happen" is fine too if some days you miss it.' },
    { icon: '📖', text: 'You will read a book today.', ok: ['will', 'might'], talk: 'If you read every day, it will happen. If not every day, it might happen. Both are fine with the right reason.' },
    { icon: '🪥', text: 'You will brush your teeth tonight.', ok: ['will', 'might'], talk: 'You brush your teeth every night, so it will happen. "Might happen" is fine if you sometimes forget!' },
    { icon: '🥤', text: 'You will drink some water today.', ok: ['will', 'might'], talk: 'Everyone drinks every day, so it will happen. "Might" is OK with a reason too.' },
    { icon: '🛒', text: 'You will go to the shop tomorrow.', ok: ['might', 'will'], talk: 'You might go, or you might not, so it might happen. If a shop trip is planned, "will happen" is fine too.' },
    { icon: '🤝', text: 'You will help a friend next week.', ok: ['might', 'will'], talk: 'You might help a friend, so it might happen. If you help every day, "will happen" is fine too.' },
  ];
  var ODD = [
    { icon: '🦁', text: 'You will see a lion on the way home.', ok: ['wont', 'might'], talk: 'Lions live in the wild or at a zoo, so most people say it will not happen. If you pass a zoo, "might" is fine.' },
    { icon: '💰', text: 'You will find treasure in the garden.', ok: ['might', 'wont'], talk: 'It is very rare, but it could happen, so it might happen. Some people say "will not happen" because it is so rare.' },
    { icon: '❄️', text: 'It will snow at your school tomorrow.', ok: ['might', 'wont'], talk: 'Where it gets cold, it might snow. Where it is always hot, it will not happen. It depends where you live.' },
  ];
  USUAL.forEach(function (c) { c.ans = c.ok[0]; });
  ODD.forEach(function (c) { c.ans = c.ok[0]; });

  var COLOURS = [
    { name: 'red', fill: '#e63946' },
    { name: 'blue', fill: '#3a86ff' },
    { name: 'yellow', fill: '#ffd166' },
    { name: 'green', fill: '#2a9d8f' },
  ];

  /* ---------------------------------------------------------------- *
   * Hints
   * ---------------------------------------------------------------- */
  function hintFor(card, chosen, strong) {
    var right = card.ans;
    var tag, text;
    if (right === 'might' && chosen === 'wont') {
      tag = card.rare ? TAG.unusualAsImpossible : TAG.mightAsWont;
      text = card.rare ? 'It does not happen often, but could it happen sometimes? Rare things can still happen.' : 'Could it ever happen, even once? Then it is not "will not happen".';
    } else if (right === 'might' && chosen === 'will') {
      tag = TAG.usualAsCertain;
      text = 'Does it happen every single time, no matter what? If not, it only might happen.';
    } else if (right === 'will' && chosen === 'might') {
      tag = TAG.certainAsMight;
      text = 'Could it ever NOT happen? Think hard. If it always happens, it will happen.';
    } else if (right === 'wont' && chosen === 'might') {
      tag = TAG.impossibleAsMight;
      text = 'Could this really happen, ever? If it never can, it will not happen.';
    } else {
      tag = TAG.willWontMix;
      text = right === 'will' ? 'This one is sure to happen. Look at the bins again.' : 'This one can never happen. Look at the bins again.';
    }
    if (strong) text = card.why + ' Which bin fits that?';
    return { text: text, tag: tag };
  }

  function hint2(card, chosen, strong) {
    // possible / impossible round
    if (card.ans === 'wont') {
      return { tag: TAG.impossibleAsMight, text: strong ? card.why + ' So it is impossible.' : 'Could this really happen, ever? Think about it.' };
    }
    return { tag: card.rare ? TAG.unusualAsImpossible : TAG.mightAsWont, text: strong ? card.why + ' So it is possible.' : 'It does not happen often, but could it happen sometimes? Rare things are still possible.' };
  }

  /* ---------------------------------------------------------------- *
   * Drawing helpers
   * ---------------------------------------------------------------- */
  function diceFace(n, size) {
    var pos = {
      1: [[50, 50]],
      2: [[28, 28], [72, 72]],
      3: [[28, 28], [50, 50], [72, 72]],
      4: [[28, 28], [72, 28], [28, 72], [72, 72]],
      5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
      6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
    }[n];
    var s = svg('svg', { viewBox: '0 0 100 100', width: size, height: size, class: 'cw-dice', 'data-face': n });
    s.appendChild(svg('rect', { x: 4, y: 4, width: 92, height: 92, rx: 16, fill: '#fff', stroke: '#1b2a4a', 'stroke-width': 4 }));
    pos.forEach(function (p) {
      s.appendChild(svg('circle', { cx: p[0], cy: p[1], r: 8.5, fill: '#1b2a4a' }));
    });
    return s;
  }

  function cardEl(card) {
    var attrs = { class: 'cw-card', tabindex: 0, 'data-ans': card.ans };
    if (card.ok) attrs['data-ok'] = card.ok.join(' ');
    return el('div', attrs, el('span', { class: 'cw-card-icon' }, card.icon), el('span', { class: 'cw-card-text' }, card.text));
  }

  /** Equal-section spinner. secs = array of colour objects, one per section. */
  function spinnerSvg(secs) {
    var n = secs.length;
    var cx = 110, cy = 110, r = 96;
    var s = svg('svg', { viewBox: '0 0 220 220', class: 'cw-spinner', 'data-n': n });
    var wedges = [];
    for (var i = 0; i < n; i++) {
      var a0 = ((-90 + (i * 360) / n) * Math.PI) / 180;
      var a1 = ((-90 + ((i + 1) * 360) / n) * Math.PI) / 180;
      var d = 'M' + cx + ' ' + cy + ' L' + (cx + r * Math.cos(a0)).toFixed(2) + ' ' + (cy + r * Math.sin(a0)).toFixed(2) + ' A' + r + ' ' + r + ' 0 0 1 ' + (cx + r * Math.cos(a1)).toFixed(2) + ' ' + (cy + r * Math.sin(a1)).toFixed(2) + ' Z';
      var w = svg('path', { d: d, fill: secs[i].fill, stroke: '#1b2a4a', 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'data-colour': secs[i].name });
      w.mid = (a0 + a1) / 2;
      wedges.push(w);
      s.appendChild(w);
    }
    s.appendChild(svg('circle', { cx: cx, cy: cy, r: r, fill: 'none', stroke: '#1b2a4a', 'stroke-width': 3 }));
    // fixed arrow
    s.appendChild(svg('path', { d: 'M110 110 L150 62', stroke: '#1b2a4a', 'stroke-width': 6, 'stroke-linecap': 'round' }));
    s.appendChild(svg('path', { d: 'M156 54 L136 64 L150 76 Z', fill: '#1b2a4a' }));
    s.appendChild(svg('circle', { cx: cx, cy: cy, r: 9, fill: '#fff', stroke: '#1b2a4a', 'stroke-width': 3 }));
    s.label = function (colourName) {
      var k = 0;
      wedges.forEach(function (w) {
        if (w.getAttribute('data-colour') !== colourName) return;
        k++;
        var lx = cx + r * 0.64 * Math.cos(w.mid);
        var ly = cy + r * 0.64 * Math.sin(w.mid);
        s.appendChild(svg('circle', { cx: lx, cy: ly, r: 13, fill: '#fff', stroke: '#1b2a4a', 'stroke-width': 2 }));
        s.appendChild(svg('text', { x: lx, y: ly + 6, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 800, fill: '#1b2a4a' }, String(k)));
      });
    };
    return s;
  }

  /* ---------------------------------------------------------------- *
   * Sorting board: cards in a tray, bins below. Drag a card (pointer
   * events) or click a card then click a bin.
   *   opts.bins, opts.cards, opts.onDrop(card, key), opts.movable,
   *   opts.onPick(card) (when a card is picked up or selected)
   * ---------------------------------------------------------------- */
  function makeBoard(api, opts) {
    var state = { locked: false, selected: null, drag: null };
    var tray = el('div', { class: 'cw-tray' });
    var bins = el('div', { class: 'cw-bins cw-bins-' + opts.bins.length });
    var binEls = {};

    function clearHover() {
      Object.keys(binEls).forEach(function (k) {
        binEls[k].classList.remove('cw-hover');
      });
    }
    function deselect() {
      if (state.selected) state.selected.el.classList.remove('cw-selected');
      state.selected = null;
      bins.classList.remove('cw-armed');
      if (opts.onPick) opts.onPick(null);
    }
    function select(card) {
      deselect();
      state.selected = card;
      card.el.classList.add('cw-selected');
      bins.classList.add('cw-armed');
      if (opts.onPick) opts.onPick(card);
    }
    function binAt(x, y) {
      var found = null;
      Object.keys(binEls).forEach(function (k) {
        var r = binEls[k].getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) found = k;
      });
      return found;
    }
    function drop(card, key) {
      if (state.locked || !card || card.bin === key) return;
      opts.onDrop(card, key);
    }

    opts.bins.forEach(function (b) {
      var area = el('div', { class: 'cw-bin-drop' });
      var be = el(
        'div',
        { class: 'cw-bin cw-' + b.cls, 'data-bin': b.key, tabindex: 0, role: 'button', 'aria-label': b.label },
        el('div', { class: 'cw-bin-head' }, el('span', { class: 'cw-bin-icon' }, b.icon), el('span', { class: 'cw-bin-label' }, b.label)),
        b.sub ? el('div', { class: 'cw-syn' }, b.sub) : null,
        area
      );
      be.area = area;
      be.addEventListener('click', function () {
        if (state.selected) {
          var c = state.selected;
          deselect();
          drop(c, b.key);
        }
      });
      be.addEventListener('keydown', function (e) {
        if ((e.key === 'Enter' || e.key === ' ') && state.selected) {
          e.preventDefault();
          var c = state.selected;
          deselect();
          drop(c, b.key);
        }
      });
      binEls[b.key] = be;
      bins.appendChild(be);
    });

    opts.cards.forEach(function (card) {
      card.el = cardEl(card);
      card.bin = null;
      card.el.addEventListener('pointerdown', function (e) {
        if (state.locked || card.fixed || (e.button != null && e.button !== 0)) return;
        e.preventDefault();
        state.drag = { card: card, x0: e.clientX, y0: e.clientY, moved: false };
      });
      card.el.addEventListener('keydown', function (e) {
        if (state.locked || card.fixed) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (state.selected === card) deselect();
          else select(card);
        }
      });
      tray.appendChild(card.el);
    });

    function onMove(e) {
      var d = state.drag;
      if (!d) return;
      var dx = e.clientX - d.x0;
      var dy = e.clientY - d.y0;
      if (!d.moved && Math.abs(dx) + Math.abs(dy) > 6) {
        d.moved = true;
        deselect();
        d.card.el.classList.add('cw-dragging');
        if (opts.onPick) opts.onPick(d.card);
      }
      if (d.moved) {
        d.card.el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
        clearHover();
        var k = binAt(e.clientX, e.clientY);
        if (k) binEls[k].classList.add('cw-hover');
      }
    }
    function onUp(e) {
      var d = state.drag;
      if (!d) return;
      state.drag = null;
      d.card.el.style.transform = '';
      d.card.el.classList.remove('cw-dragging');
      clearHover();
      if (e.type === 'pointercancel') return;
      if (d.moved) {
        if (opts.onPick) opts.onPick(null);
        var k = binAt(e.clientX, e.clientY);
        if (k) drop(d.card, k);
      } else if (state.selected === d.card) {
        deselect();
      } else {
        select(d.card);
      }
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    api.cleanup(function () {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    });

    return {
      tray: tray,
      bins: bins,
      binEls: binEls,
      place: function (card, key) {
        binEls[key].area.appendChild(card.el);
        card.el.classList.add('cw-placed');
        card.el.classList.remove('cw-shake');
        card.bin = key;
        card.el.setAttribute('data-in', key);
        if (!opts.movable) card.fixed = true;
        if (!tray.querySelector('.cw-card')) tray.classList.add('cw-tray-empty');
      },
      shake: function (card) {
        card.el.classList.remove('cw-shake');
        void card.el.offsetWidth;
        card.el.classList.add('cw-shake');
      },
      lock: function () {
        state.locked = true;
        deselect();
        bins.classList.add('cw-locked');
        opts.cards.forEach(function (c) {
          c.fixed = true;
        });
      },
      help: function (key) {
        Object.keys(binEls).forEach(function (k) {
          binEls[k].classList.toggle('cw-help', k === key);
        });
      },
    };
  }

  function addWhy(card, text) {
    if (card.el.querySelector('.cw-why')) return;
    card.el.appendChild(el('span', { class: 'cw-why' }, text));
  }

  /* ---------------------------------------------------------------- *
   * Practice deck
   * ---------------------------------------------------------------- */
  var deck = null;

  function clone(c) {
    var o = {};
    Object.keys(c).forEach(function (k) {
      o[k] = c[k];
    });
    return o;
  }

  function buildDeck() {
    var q = [];
    var will = U.shuffle(WILL), wont = U.shuffle(WONT), might = U.shuffle(MIGHT);
    var pools = { will: will, wont: wont, might: might };
    // Level 1 (Q1-4): 6 clear-cut cards, 2 of each kind. Two single cards, then two pairs.
    var kinds = U.shuffle(['will', 'might', 'wont']);
    var a = kinds[0], b = kinds[1], c = kinds[2];
    var taken = { will: 0, wont: 0, might: 0 };
    function take(k) {
      return clone(pools[k][taken[k]++]);
    }
    q.push({ type: 'sort', cards: [take(a)] });
    q.push({ type: 'sort', cards: [take(b)] });
    q.push({ type: 'sort', cards: U.shuffle([take(c), take(a)]) });
    q.push({ type: 'sort', cards: U.shuffle([take(c), take(b)]) });
    // Level 2 (Q5-7): possible / impossible first, then sure-vs-possible pairs with a won't card
    var rare = U.shuffle(RARE);
    q.push({ type: 'two', cards: U.shuffle([take('wont'), clone(rare[0])]) });
    var pairs = U.shuffle(PAIRS);
    q.push({ type: 'sort', cards: U.shuffle([clone(pairs[0][0]), clone(pairs[0][1]), take('wont')]) });
    q.push({ type: 'sort', cards: U.shuffle([clone(pairs[1][0]), clone(pairs[1][1]), take('wont')]) });
    // Level 3 (Q8-10): judgement card + reason, spinner card + likely/unlikely, judgement card + reason
    q.push({ type: 'judge', card: clone(U.pick(USUAL)) });
    q.push({ type: 'spin', spin: makeSpin() });
    q.push({ type: 'judge', card: clone(U.pick(ODD.concat(rare.slice(1)))) });
    return q;
  }

  function makeSpin() {
    var n = U.pick([4, 6, 8]);
    var k = U.pick({ 4: [1, 3], 6: [1, 2, 4, 5], 8: [1, 2, 6, 7] }[n]);
    var cols = U.shuffle(COLOURS);
    var target = cols[0], other = cols[1];
    var slots = U.shuffle(U.range(0, n - 1)).slice(0, k);
    var secs = [];
    for (var i = 0; i < n; i++) secs.push(slots.indexOf(i) >= 0 ? target : other);
    return { n: n, k: k, target: target, other: other, secs: secs, likely: k * 2 > n };
  }

  /* ---------------------------------------------------------------- *
   * Practice renderers
   * ---------------------------------------------------------------- */
  function renderSort(stage, api, q) {
    var two = q.type === 'two';
    var cards = q.cards;
    var left = cards.length;
    function rightKey(card) {
      return two ? (card.ans === 'wont' ? 'impossible' : 'possible') : card.ans;
    }
    if (two) {
      api.say('Can it happen at all? Drag each card to possible or impossible.', 'think');
      stage.appendChild(MQ.ui.prompt('Is it <b>possible</b> or <b>impossible</b>?'));
    } else {
      api.say(cards.length === 1 ? 'Where does this card go? Drag it to a bin.' : 'Drag each card to the right bin.', 'think');
      stage.appendChild(MQ.ui.prompt(cards.length === 1 ? 'Will it happen?' : 'Sort ' + (cards.length === 2 ? 'both' : 'all ' + cards.length) + ' cards.'));
    }
    var board = makeBoard(api, {
      bins: two ? BIN2 : BIN3,
      cards: cards,
      onDrop: function (card, key) {
        if (api.isAnswered()) return;
        if (key === rightKey(card)) {
          board.place(card, key);
          left--;
          if (left === 0) {
            board.lock();
            var msg = cards.length === 1 ? card.why + ' So it ' + (two ? 'is ' : '') + LABEL[key] + '!' : 'All sorted! ' + card.why;
            api.check(true, msg);
          } else {
            api.sound('pop');
            api.feedback('Yes! ' + card.why + ' Now the next card.', 'good');
          }
        } else {
          board.shake(card);
          var h = two ? hint2(card, key, api.tries() >= 1) : hintFor(card, key, api.tries() >= 1);
          api.check(false, h.text, h.tag);
        }
      },
    });
    stage.appendChild(el('div', { class: 'cw-board', 'data-qtype': q.type }, board.tray, board.bins));
    api.onReveal(function () {
      board.lock();
      cards.forEach(function (card) {
        if (!card.bin) board.place(card, rightKey(card));
        addWhy(card, card.why);
      });
      api.feedback('Each card is in its bin. Read why under each card.', 'info');
    });
  }

  function renderJudge(stage, api, q) {
    var card = q.card;
    api.say('There is more than one good answer here. Pick a bin, then tell me why.', 'think');
    stage.appendChild(MQ.ui.prompt('Pick a bin, then pick a <b>reason</b>.'));
    var why = el('div', { class: 'cw-why-box' });
    var reasons = null;
    var board = makeBoard(api, {
      bins: BIN3,
      cards: [card],
      movable: true,
      onDrop: function (c, key) {
        if (api.isAnswered()) return;
        if (card.ok.indexOf(key) >= 0) {
          board.place(card, key);
          api.sound('pop');
          showReasons();
          api.feedback('OK, ' + LABEL[key] + '. Now pick the reason that goes with it.', 'info');
        } else {
          board.shake(card);
          var tag, text;
          if (key === 'wont') {
            tag = card.rare ? TAG.unusualAsImpossible : TAG.mightAsWont;
            text = card.rare ? 'It does not happen often, but could it happen sometimes? Then it is not "will not happen".' : 'Could it happen? Then "will not happen" does not fit.';
          } else if (key === 'will') {
            tag = TAG.usualAsCertain;
            text = 'Does it happen every single day, no matter what? If not, it is not "will happen".';
          } else {
            tag = TAG.impossibleAsMight;
            text = 'Could this really happen?';
          }
          if (api.tries() >= 1) text = card.talk;
          api.check(false, text, tag);
        }
      },
    });
    function showReasons() {
      MQ.clear(why);
      why.appendChild(el('div', { class: 'cw-why-q' }, 'Why?'));
      reasons = MQ.ui.choices(
        ['will', 'might', 'wont'].map(function (k) {
          return { label: REASONS[k], value: k };
        }),
        function (r) {
          if (api.isAnswered()) return;
          if (r === card.bin) {
            reasons.mark(r, 'good');
            reasons.disable();
            board.lock();
            api.check(true, 'Good reason! ' + LABEL[r].charAt(0).toUpperCase() + LABEL[r].slice(1) + ': ' + REASONS[r].toLowerCase() + '.');
          } else {
            reasons.mark(r, 'bad');
            var lab = LABEL[card.bin];
            var t = api.tries() >= 1 ? '"' + lab + '" goes with "' + REASONS[card.bin] + '". Or drag the card to a different bin.' : 'You put it in "' + lab + '". Which reason goes with "' + lab + '"?';
            api.check(false, t, TAG.reason);
          }
        },
        { columns: 3 }
      );
      reasons.classList.add('cw-reasons');
      reasons.buttons.forEach(function (b) {
        b.setAttribute('data-reason', b.value_);
      });
      why.appendChild(reasons);
    }
    stage.appendChild(el('div', { class: 'cw-board', 'data-qtype': 'judge' }, board.tray, board.bins, why));
    api.onReveal(function () {
      if (card.ok.indexOf(card.bin) < 0) board.place(card, card.ok[0]);
      if (!reasons) showReasons();
      MQ.clear(why);
      why.appendChild(el('div', { class: 'cw-why-q' }, 'Why?'));
      why.appendChild(reasons);
      reasons.buttons.forEach(function (b) {
        b.classList.remove('bad');
      });
      reasons.mark(card.bin, 'good');
      reasons.disable();
      board.lock();
      addWhy(card, card.talk);
      api.feedback(LABEL[card.bin].charAt(0).toUpperCase() + LABEL[card.bin].slice(1) + ' goes with "' + REASONS[card.bin] + '".', 'info');
    });
  }

  function renderSpin(stage, api, q) {
    var sp = q.spin;
    var card = {
      icon: '🎯',
      text: 'The spinner will land on ' + sp.target.name + '.',
      ans: 'might',
      why: 'Some parts are ' + sp.target.name + ' and some are ' + sp.other.name + ', so it could land on either.',
    };
    api.say('Look at the spinner. Where does this card go?', 'think');
    stage.appendChild(MQ.ui.prompt('Look at the spinner. Will it land on <b>' + sp.target.name + '</b>?'));
    var pic = spinnerSvg(sp.secs);
    var side = el('div', { class: 'cw-spin-side' });
    var lk = null;
    var board = makeBoard(api, {
      bins: BIN3,
      cards: [card],
      onDrop: function (c, key) {
        if (api.isAnswered()) return;
        if (key === 'might') {
          board.place(card, key);
          board.lock();
          api.sound('pop');
          api.say('Yes, it might land on ' + sp.target.name + '. We can also say it MAY happen. Is it likely or unlikely?', 'happy');
          api.feedback('Yes! It might happen (or: it may happen). Now: likely or unlikely?', 'good');
          showStep2();
        } else {
          board.shake(card);
          var t, tag;
          if (key === 'will') {
            tag = TAG.usualAsCertain;
            t = api.tries() >= 1 ? card.why : 'Are ALL the parts ' + sp.target.name + '? Look again.';
          } else {
            tag = TAG.mightAsWont;
            t = api.tries() >= 1 ? card.why : 'Can you see any ' + sp.target.name + ' on the spinner? Then it could land on ' + sp.target.name + '.';
          }
          api.check(false, t, tag);
        }
      },
    });
    side.appendChild(board.tray);
    function showStep2() {
      MQ.clear(side);
      side.appendChild(el('div', { class: 'cw-step2-q' }, 'Is landing on ', el('b', null, sp.target.name), ' likely or unlikely?'));
      lk = MQ.ui.choices(
        [
          { label: 'likely<small>lots of the parts</small>', value: 'likely' },
          { label: 'unlikely<small>only a few parts</small>', value: 'unlikely' },
        ],
        function (v) {
          if (api.isAnswered()) return;
          var right = sp.likely ? 'likely' : 'unlikely';
          if (v === right) {
            lk.mark(v, 'good');
            lk.disable();
            pic.label(sp.target.name);
            api.check(true, sp.k + ' of the ' + sp.n + ' parts are ' + sp.target.name + ', so it is ' + right + '!');
          } else {
            lk.mark(v, 'bad');
            var t = api.tries() >= 1 ? 'Count: ' + sp.k + ' ' + sp.target.name + (sp.k === 1 ? ' part' : ' parts') + ' and ' + (sp.n - sp.k) + ' ' + sp.other.name + (sp.n - sp.k === 1 ? ' part' : ' parts') + '. Which colour has more parts?' : 'Count the ' + sp.target.name + ' parts. Is it lots of the parts, or only a few?';
            api.check(false, t, TAG.likely);
          }
        },
        { columns: 2 }
      );
      lk.classList.add('cw-lk');
      lk.buttons.forEach(function (b) {
        b.setAttribute('data-lk', b.value_);
      });
      side.appendChild(lk);
    }
    stage.appendChild(el('div', { class: 'cw-board', 'data-qtype': 'spin', 'data-likely': sp.likely ? 'likely' : 'unlikely' }, el('div', { class: 'cw-spin-row' }, el('div', { class: 'cw-spin-pic' }, pic), side), board.bins));
    api.onReveal(function () {
      var right = sp.likely ? 'likely' : 'unlikely';
      if (!card.bin) {
        board.place(card, 'might');
        board.lock();
        showStep2();
      }
      lk.buttons.forEach(function (b) {
        b.classList.remove('bad');
      });
      lk.mark(right, 'good');
      lk.disable();
      pic.label(sp.target.name);
      api.feedback('It might land on ' + sp.target.name + '. Count: ' + sp.k + ' of the ' + sp.n + ' parts are ' + sp.target.name + ' — ' + (sp.likely ? 'more than half, so it is likely.' : 'less than half, so it is unlikely.'), 'info');
    });
  }

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */
  function learnDice(stage, api) {
    api.say('I have a normal dice. Click each card to see if it will happen, might happen or will not happen.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Will it happen?', 'Bolt rolls a normal dice with 1 to 6 spots.'));
    var face = 5;
    var diceBox = el('div', { class: 'cw-dice-box' }, diceFace(face, 110));
    var rolled = el('div', { class: 'cw-rolled' }, 'Press Roll to try it.');
    var CARDS = [
      { text: 'It lands on 1, 2, 3, 4, 5 or 6.', ans: 'will', say: 'Every side has 1 to 6 spots. It WILL happen.', test: function () { return true; } },
      { text: 'It lands on 9.', ans: 'wont', say: 'There is no 9 on a dice. It WILL NOT happen.', test: function () { return false; } },
      { text: 'It lands on 4.', ans: 'might', say: 'It could be 4, or another number. It MIGHT happen.', test: function (n) { return n === 4; } },
    ];
    var flipped = 0;
    var row = el('div', { class: 'cw-flips' });
    CARDS.forEach(function (c) {
      var badge = el('span', { class: 'cw-badge' }, 'Click to find out');
      var mark = el('span', { class: 'cw-came' });
      var b = el('button', { class: 'cw-flip', type: 'button', 'data-ans': c.ans }, el('span', { class: 'cw-flip-text' }, c.text), badge, mark);
      c.mark = mark;
      b.addEventListener('click', function () {
        api.sound('pop');
        api.say(c.say, 'happy');
        if (b.classList.contains('cw-flipped')) return;
        b.classList.add('cw-flipped', 'cw-f-' + c.ans);
        badge.textContent = LABEL[c.ans];
        flipped++;
        if (flipped === CARDS.length) {
          api.unlockNext();
          api.feedback('Will happen = sure. Might happen = maybe. Will not happen = never. Try Roll!', 'good');
        }
      });
      row.appendChild(b);
    });
    var rollBtn = el('button', { class: 'btn cw-roll', type: 'button' }, '🎲 Roll');
    var rolling = false;
    rollBtn.addEventListener('click', function () {
      if (rolling) return;
      rolling = true;
      var steps = 0;
      function spin() {
        face = U.rand(1, 6);
        MQ.clear(diceBox).appendChild(diceFace(face, 110));
        steps++;
        if (steps < 6) {
          api.later(spin, 70);
          return;
        }
        rolling = false;
        api.sound('click');
        rolled.textContent = 'It landed on ' + face + '.';
        CARDS.forEach(function (c) {
          var yes = c.test(face);
          c.mark.textContent = yes ? '✔ came true' : '✖ not this time';
          c.mark.className = 'cw-came ' + (yes ? 'cw-yes' : 'cw-no');
        });
      }
      spin();
    });
    stage.appendChild(el('div', { class: 'cw-l1' }, el('div', { class: 'cw-dice-col' }, diceBox, rollBtn, rolled), row));
  }

  function weatherScene(kind) {
    var g = svg('g', { class: 'cw-scene' });
    var sky = { sun: '#bfe3ff', cloud: '#dfe6ee', rain: '#b9c3cf' }[kind];
    g.appendChild(svg('rect', { x: 40, y: 30, width: 240, height: 170, fill: sky }));
    g.appendChild(svg('rect', { x: 40, y: 170, width: 240, height: 30, fill: '#9ccc65' }));
    function cloud(x, y, s, col) {
      var c = svg('g', { transform: 'translate(' + x + ',' + y + ') scale(' + s + ')' });
      [[0, 0, 22], [24, -10, 26], [50, 0, 22], [24, 8, 22]].forEach(function (p) {
        c.appendChild(svg('circle', { cx: p[0], cy: p[1], r: p[2], fill: col }));
      });
      return c;
    }
    if (kind === 'sun') {
      g.appendChild(svg('circle', { cx: 160, cy: 95, r: 30, fill: '#ffcf33' }));
      for (var i = 0; i < 8; i++) {
        var a = (i * Math.PI) / 4;
        g.appendChild(svg('line', { x1: 160 + 40 * Math.cos(a), y1: 95 + 40 * Math.sin(a), x2: 160 + 54 * Math.cos(a), y2: 95 + 54 * Math.sin(a), stroke: '#ffb703', 'stroke-width': 6, 'stroke-linecap': 'round' }));
      }
    } else if (kind === 'cloud') {
      g.appendChild(cloud(80, 80, 1, '#fff'));
      g.appendChild(cloud(170, 115, 1.1, '#f4f6f8'));
    } else {
      g.appendChild(cloud(110, 70, 1.3, '#8a97a8'));
      for (var j = 0; j < 9; j++) {
        var x = 80 + j * 20;
        g.appendChild(svg('line', { x1: x, y1: 112 + (j % 2) * 18, x2: x - 6, y2: 132 + (j % 2) * 18, stroke: '#1d6fd1', 'stroke-width': 4, 'stroke-linecap': 'round' }));
      }
    }
    return g;
  }

  var WEATHER = { sun: { icon: '☀️', name: 'sunny' }, cloud: { icon: '☁️', name: 'cloudy' }, rain: { icon: '🌧️', name: 'rainy' } };

  function learnWindow(stage, api) {
    api.say('What will the weather be tomorrow? Click the curtains to peek. Do it 3 times!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Tomorrow\'s weather', 'Click the window to open the curtains.'));
    var order = U.shuffle(['sun', 'cloud', 'rain']);
    var peeks = 0;
    var open = false;
    var busy = false;
    var s = svg('svg', { viewBox: '0 0 320 260', class: 'cw-window', role: 'button', tabindex: 0, 'aria-label': 'Window with curtains' });
    s.appendChild(svg('rect', { x: 0, y: 0, width: 320, height: 260, fill: '#fdf3e1' }));
    var sceneHolder = svg('g', null);
    s.appendChild(sceneHolder);
    s.appendChild(svg('rect', { x: 40, y: 30, width: 240, height: 170, fill: 'none', stroke: '#8d6e63', 'stroke-width': 10 }));
    s.appendChild(svg('line', { x1: 160, y1: 30, x2: 160, y2: 200, stroke: '#8d6e63', 'stroke-width': 6 }));
    s.appendChild(svg('line', { x1: 40, y1: 115, x2: 280, y2: 115, stroke: '#8d6e63', 'stroke-width': 6 }));
    var curtL = svg('g', { class: 'cw-curt cw-curt-l' });
    var curtR = svg('g', { class: 'cw-curt cw-curt-r' });
    [curtL, curtR].forEach(function (c, i) {
      var x0 = i === 0 ? 30 : 160;
      c.appendChild(svg('rect', { x: x0, y: 22, width: 130, height: 190, fill: '#e76f51' }));
      for (var f = 1; f < 5; f++) c.appendChild(svg('line', { x1: x0 + f * 26, y1: 22, x2: x0 + f * 26, y2: 212, stroke: '#c4553a', 'stroke-width': 3 }));
    });
    s.appendChild(curtL);
    s.appendChild(curtR);
    s.appendChild(svg('rect', { x: 20, y: 14, width: 280, height: 10, rx: 5, fill: '#6d4c41' }));
    // window sill and plant pot
    s.appendChild(svg('rect', { x: 26, y: 212, width: 268, height: 14, rx: 4, fill: '#bcaaa4' }));
    s.appendChild(svg('path', { d: 'M232 212 L238 186 L262 186 L268 212 Z', fill: '#c96f3b' }));
    s.appendChild(svg('path', { d: 'M250 186 C244 168 236 164 232 160 M250 186 C254 170 262 164 268 162 M250 186 L250 162', stroke: '#2e7d32', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }));
    var seen = el('div', { class: 'cw-seen' });
    var tag = el('div', { class: 'cw-peek-tag' }, 'Peeks: 0 of 3');

    function setOpen(o) {
      open = o;
      s.classList.toggle('cw-open', o);
    }
    function peek() {
      if (busy) return;
      busy = true;
      api.sound('click');
      var doOpen = function () {
        var kind = order[peeks % 3];
        MQ.clear(sceneHolder).appendChild(weatherScene(kind));
        s.setAttribute('data-weather', kind);
        setOpen(true);
        peeks++;
        tag.textContent = 'Peeks: ' + Math.min(peeks, 3) + ' of 3';
        if (peeks <= 3) seen.appendChild(el('span', { class: 'cw-seen-chip' }, WEATHER[kind].icon + ' ' + WEATHER[kind].name));
        api.say('This time it is ' + WEATHER[kind].name + '. It might be ' + WEATHER[kind].name + ' tomorrow, but we cannot be sure!', 'happy');
        if (peeks === 3) {
          api.unlockNext();
          api.say('Sunny, cloudy or rainy: each one MIGHT happen. We cannot be sure which!', 'cheer');
          api.feedback('Tomorrow\'s weather might be sunny, cloudy or rainy. We cannot be sure.', 'good');
        }
        busy = false;
      };
      if (open) {
        setOpen(false);
        api.later(doOpen, 450);
      } else {
        doOpen();
      }
    }
    s.addEventListener('click', peek);
    s.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        peek();
      }
    });
    stage.appendChild(el('div', { class: 'cw-l2' }, el('div', { class: 'cw-window-box' }, s), el('div', { class: 'cw-l2-side' }, tag, seen, el('div', { class: 'cw-might-note' }, el('b', null, 'might happen'), el('span', null, 'It can happen, but we cannot be sure.')))));
  }

  function learnBins(stage, api) {
    api.say('Here are three bins. Drag each card into the right bin. I will help!');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Three chance bins', 'Drag a card into a bin, or click a card and then click a bin.'));
    var cards = U.shuffle([
      { icon: '🌅', text: 'The sun will rise tomorrow morning.', ans: 'will', why: 'The sun rises every morning.' },
      { icon: '👕', text: 'Your friend will wear a red T-shirt tomorrow.', ans: 'might', why: 'Your friend could wear red, or another colour.' },
      { icon: '🥄', text: 'A spoon will sing a song.', ans: 'wont', why: 'Spoons cannot sing.' },
    ]);
    var left = 3;
    var board = makeBoard(api, {
      bins: BIN3,
      cards: cards,
      onPick: function (card) {
        board && board.help(card ? card.ans : null);
      },
      onDrop: function (card, key) {
        board.help(null);
        if (key === card.ans) {
          board.place(card, key);
          api.sound('correct');
          left--;
          api.say(card.why + ' So it ' + LABEL[key] + '!', 'cheer');
          if (left === 0) {
            api.unlockNext();
            api.feedback('All three sorted! "Might happen" can also be said "may happen".', 'good');
          } else {
            api.feedback('Yes! ' + card.why, 'good');
          }
        } else {
          board.shake(card);
          api.sound('wrong');
          api.feedback(card.why + ' Try the glowing bin.', 'try');
          api.say('Look for the glowing bin!', 'oops');
        }
      },
    });
    var legend = el('div', { class: 'cw-legend' },
      el('span', { class: 'cw-leg cw-will' }, '✔ will happen = sure'),
      el('span', { class: 'cw-leg cw-might' }, '? might happen = maybe'),
      el('span', { class: 'cw-leg cw-wont' }, '✖ will not happen = never')
    );
    stage.appendChild(el('div', { class: 'cw-board', 'data-qtype': 'learn' }, legend, board.tray, board.bins));
  }

  /* ---------------------------------------------------------------- *
   * Register
   * ---------------------------------------------------------------- */
  MQ.register('chance-word-sort', {
    learn: [learnDice, learnWindow, learnBins],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        if (q.type === 'judge') return renderJudge(stage, api, q);
        if (q.type === 'spin') return renderSpin(stage, api, q);
        return renderSort(stage, api, q);
      },
    },
  });

  /* ---------------------------------------------------------------- *
   * Styles
   * ---------------------------------------------------------------- */
  var css = [
    '.cw-board{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%;max-width:900px}',
    '.cw-tray{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;min-height:76px;width:100%}',
    '.cw-tray-empty{min-height:0}',
    '.cw-card{display:flex;align-items:center;gap:10px;background:#fff;border:3px solid var(--line);border-radius:14px;padding:10px 14px;font-size:1.15rem;font-weight:800;max-width:270px;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;box-shadow:0 2px 6px rgba(27,42,74,.12);position:relative;flex-wrap:wrap}',
    '.cw-card:hover{border-color:var(--accent)}',
    '.cw-card:focus-visible{outline:4px solid var(--gold)}',
    '.cw-card-icon{font-size:2rem;line-height:1}',
    '.cw-card-text{flex:1;min-width:0;line-height:1.25}',
    '.cw-selected{border-color:var(--gold);box-shadow:0 0 0 4px rgba(255,183,3,.35)}',
    '.cw-dragging{z-index:50;cursor:grabbing;box-shadow:0 10px 24px rgba(27,42,74,.28);transition:none;pointer-events:none}',
    '.cw-placed{cursor:default;font-size:.95rem;padding:6px 10px;max-width:none;width:100%;box-shadow:none}',
    '.cw-placed .cw-card-icon{font-size:1.4rem}',
    '.cw-why{flex-basis:100%;font-size:.85rem;font-weight:700;color:var(--ink-soft);border-top:1px dashed var(--line);padding-top:4px}',
    '.cw-shake{animation:cwShake .4s ease}',
    '@keyframes cwShake{20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}',
    '.cw-bins{display:grid;gap:12px;width:100%}',
    '.cw-bins-3{grid-template-columns:repeat(3,minmax(0,1fr))}',
    '.cw-bins-2{grid-template-columns:repeat(2,minmax(0,1fr));max-width:640px}',
    '.cw-bin{border:3px dashed;border-radius:16px;padding:8px;min-height:150px;display:flex;flex-direction:column;gap:6px;cursor:pointer;transition:transform .1s ease,box-shadow .1s ease}',
    '.cw-bin:focus-visible{outline:4px solid var(--gold)}',
    '.cw-bin-head{display:flex;align-items:center;justify-content:center;gap:8px;font-weight:800;font-size:1.2rem}',
    '.cw-bin-icon{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;color:#fff;font-size:1.1rem;flex:none}',
    '.cw-syn{align-self:center;font-size:.85rem;font-weight:800;background:#fff;border-radius:99px;padding:2px 10px;border:2px solid currentColor}',
    '.cw-bin-drop{display:flex;flex-direction:column;gap:6px;flex:1}',
    '.cw-will{border-color:#1f9d6b;background:#e9f8f1;color:#146c4a}',
    '.cw-will .cw-bin-icon{background:#1f9d6b}',
    '.cw-might{border-color:#e9a800;background:#fff6dc;color:#8a5a00}',
    '.cw-might .cw-bin-icon{background:#e9a800}',
    '.cw-wont{border-color:#d0453a;background:#fdebea;color:#a1271e}',
    '.cw-wont .cw-bin-icon{background:#d0453a}',
    '.cw-bin .cw-card{color:var(--ink)}',
    '.cw-armed .cw-bin{box-shadow:0 0 0 3px rgba(255,183,3,.35)}',
    '.cw-hover{transform:scale(1.03);box-shadow:0 0 0 5px rgba(255,183,3,.55)!important;border-style:solid}',
    '.cw-help{border-style:solid;animation:cwGlow 1s ease-in-out infinite alternate}',
    '@keyframes cwGlow{from{box-shadow:0 0 0 2px rgba(255,183,3,.3)}to{box-shadow:0 0 0 8px rgba(255,183,3,.65)}}',
    '.cw-locked .cw-bin{cursor:default}',
    '.cw-legend{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}',
    '.cw-leg{border:2px solid;border-radius:99px;padding:3px 12px;font-weight:800;font-size:.95rem}',
    '.cw-why-box{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%}',
    '.cw-why-box:empty{display:none}',
    '.cw-why-q{font-size:1.25rem;font-weight:800}',
    '.cw-reasons{max-width:820px}',
    '.cw-reasons .choice{font-size:1.05rem}',
    '.cw-spin-row{display:flex;align-items:center;justify-content:center;gap:24px;width:100%;flex-wrap:wrap}',
    '.cw-spin-pic{width:200px;max-width:100%}',
    '.cw-spinner{width:100%;height:auto;display:block}',
    '.cw-spin-side{display:flex;flex-direction:column;align-items:center;gap:10px;min-width:260px;flex:1;max-width:420px}',
    '.cw-step2-q{font-size:1.25rem;font-weight:800;text-align:center}',
    '.cw-lk .choice small{display:block;font-size:.85rem;font-weight:700;color:var(--ink-soft)}',
    /* learn 1 */
    '.cw-l1{display:flex;align-items:center;justify-content:center;gap:22px;flex-wrap:wrap;width:100%}',
    '.cw-dice-col{display:flex;flex-direction:column;align-items:center;gap:8px}',
    '.cw-dice{display:block}',
    '.cw-rolled{font-weight:800;color:var(--ink-soft);min-height:1.4em}',
    '.cw-flips{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;flex:1;min-width:0;max-width:640px}',
    '.cw-flip{display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:10px;min-height:150px;padding:12px;border-radius:16px;border:3px solid var(--line);background:#fff;font:inherit;font-size:1.1rem;font-weight:800;color:var(--ink);cursor:pointer}',
    '.cw-flip:hover{border-color:var(--accent)}',
    '.cw-badge{display:inline-block;border-radius:99px;padding:4px 12px;background:var(--paper-2);color:var(--ink-soft);font-size:.95rem}',
    '.cw-f-will{border-color:#1f9d6b}.cw-f-will .cw-badge{background:#1f9d6b;color:#fff;font-size:1.1rem}',
    '.cw-f-might{border-color:#e9a800}.cw-f-might .cw-badge{background:#e9a800;color:#fff;font-size:1.1rem}',
    '.cw-f-wont{border-color:#d0453a}.cw-f-wont .cw-badge{background:#d0453a;color:#fff;font-size:1.1rem}',
    '.cw-came{font-size:.85rem;min-height:1.2em}',
    '.cw-yes{color:#146c4a}.cw-no{color:#a1271e}',
    /* learn 2 */
    '.cw-l2{display:flex;align-items:center;justify-content:center;gap:24px;flex-wrap:wrap;width:100%}',
    '.cw-window-box{width:340px;max-width:100%}',
    '.cw-window{width:100%;height:auto;display:block;cursor:pointer;border-radius:14px}',
    '.cw-window:focus-visible{outline:4px solid var(--gold)}',
    '.cw-curt{transition:transform .4s ease;transform-box:fill-box}',
    '.cw-curt-l{transform-origin:left center}',
    '.cw-curt-r{transform-origin:right center}',
    '.cw-open .cw-curt{transform:scaleX(.18)}',
    '.cw-l2-side{display:flex;flex-direction:column;gap:10px;align-items:flex-start;max-width:320px}',
    '.cw-peek-tag{font-weight:800;font-size:1.1rem}',
    '.cw-seen{display:flex;flex-wrap:wrap;gap:8px;min-height:40px}',
    '.cw-seen-chip{background:var(--info-bg);border:2px solid var(--line);border-radius:99px;padding:4px 12px;font-weight:800;font-size:1.05rem}',
    '.cw-might-note{background:#fff6dc;border:3px solid #e9a800;border-radius:14px;padding:8px 12px;color:#8a5a00;display:flex;flex-direction:column;gap:2px}',
    '.cw-might-note b{font-size:1.2rem}',
    '@media (max-width:760px){.cw-bin-head{font-size:1rem}.cw-card{font-size:1rem}.cw-flips{grid-template-columns:1fr}.cw-flip{min-height:0}.cw-bin{padding:6px}.cw-bin-icon{width:28px;height:28px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'chance-word-sort' }, css));
})();

/* Number word cards — read and build number names to 1000 with word cards (Unit 1.1).
 * British English: "three hundred and seventy-eight", hyphenated -ty words, and "and"
 * after hundred only when there are tens or ones ("four hundred", "four hundred and eight").
 * Every number name is made of cards; a card ending in "-" joins the next card with no space.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;

  /* ---------------------------------------------------------------- *
   * Number words (self-contained: the deck checker extracts this block)
   * ---------------------------------------------------------------- */
  // nw-words:begin
  var ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  /** British English number name, 0 to 1000. */
  function words(n) {
    if (n === 1000) return 'one thousand';
    var h = Math.floor(n / 100);
    var r = n % 100;
    var tail;
    if (r < 20) tail = ONES[r];
    else tail = TENS[Math.floor(r / 10)] + (r % 10 ? '-' + ONES[r % 10] : '');
    if (!h) return tail;
    return ONES[h] + ' hundred' + (r ? ' and ' + tail : '');
  }

  /** The word cards for n, each with the place it belongs to (h, t, o, to = teen, and, th). */
  function cardParts(n) {
    if (n === 1000) return [{ w: 'one', p: 'th' }, { w: 'thousand', p: 'th' }];
    var h = Math.floor(n / 100);
    var r = n % 100;
    var t = Math.floor(r / 10);
    var o = r % 10;
    var out = [];
    if (h) {
      out.push({ w: ONES[h], p: 'h' }, { w: 'hundred', p: 'h' });
      if (r) out.push({ w: 'and', p: 'and' });
    }
    if (r || !h) {
      if (r < 10) out.push({ w: ONES[r], p: 'o' });
      else if (r < 20) out.push({ w: ONES[r], p: 'to' });
      else if (o) out.push({ w: TENS[t] + '-', p: 't' }, { w: ONES[o], p: 'o' });
      else out.push({ w: TENS[t], p: 't' });
    }
    return out;
  }
  function cardsOf(n) {
    return cardParts(n).map(function (c) {
      return c.w;
    });
  }
  /** Join cards into a name: "seventy-" + "three" -> "seventy-three". */
  function joinCards(cards) {
    var s = '';
    for (var i = 0; i < cards.length; i++) {
      s += cards[i];
      if (i < cards.length - 1 && cards[i].slice(-1) !== '-') s += ' ';
    }
    return s;
  }
  var NAME_TO_N = {};
  for (var nn = 0; nn <= 1000; nn++) NAME_TO_N[words(nn)] = nn;
  /** The number a row of cards names, or -1 if it is not a proper number name. */
  function numberOfCards(cards) {
    var s = joinCards(cards);
    return Object.prototype.hasOwnProperty.call(NAME_TO_N, s) ? NAME_TO_N[s] : -1;
  }
  /** True if every card in need can be taken from have (each card used once). */
  function fromTray(need, have) {
    var left = have.slice();
    for (var i = 0; i < need.length; i++) {
      var k = left.indexOf(need[i]);
      if (k === -1) return false;
      left.splice(k, 1);
    }
    return true;
  }
  /** Cards in need that the tray does not have (counting repeats). */
  function missingCards(need, have) {
    var left = have.slice();
    var miss = [];
    need.forEach(function (w) {
      var k = left.indexOf(w);
      if (k === -1) miss.push(w);
      else left.splice(k, 1);
    });
    return miss;
  }
  /** Every 3-digit number whose name uses exactly `size` cards, all from the tray. */
  function possibleNumbers(tray, size) {
    var out = [];
    for (var n = 100; n <= 999; n++) {
      var c = cardsOf(n);
      if (c.length === size && fromTray(c, tray)) out.push(n);
    }
    return out;
  }
  // nw-words:end

  var DIGIT_WORDS = ONES.slice(1, 10);
  var TEENS = ONES.slice(10, 20);
  var TY_HY = TENS.slice(2).map(function (w) {
    return w + '-';
  });
  function isDigitWord(w) {
    return DIGIT_WORDS.indexOf(w) !== -1;
  }
  function isTeen(w) {
    return TEENS.indexOf(w) !== -1;
  }
  function isTy(w) {
    return TY_HY.indexOf(w) !== -1 || TENS.indexOf(w) > 1;
  }
  function digitsOf(n) {
    return { h: Math.floor(n / 100) % 10, t: Math.floor(n / 10) % 10, o: n % 10 };
  }
  function q(w) {
    return '<b>' + w + '</b>';
  }

  /* ---------------------------------------------------------------- *
   * Shared pieces
   * ---------------------------------------------------------------- */
  var PLACE_NAME = { h: 'hundreds', t: 'tens', o: 'ones', th: 'thousands' };

  /** A digit-by-digit strip: each digit with the words that belong to it underneath. */
  function matchStrip(n) {
    var cols;
    if (n === 1000) {
      cols = [
        { k: 'th', d: 1, head: 'Thousands' },
        { k: 'h', d: 0, head: 'Hundreds' },
        { k: 't', d: 0, head: 'Tens' },
        { k: 'o', d: 0, head: 'Ones' },
      ];
    } else {
      var d = digitsOf(n);
      cols = [
        { k: 'h', d: d.h, head: 'Hundreds' },
        { k: 't', d: d.t, head: 'Tens' },
        { k: 'o', d: d.o, head: 'Ones' },
      ];
    }
    var grid = el('div', { class: 'nw-strip', style: { gridTemplateColumns: 'repeat(' + cols.length + ', minmax(0, 150px))' } });
    cols.forEach(function (c) {
      grid.appendChild(el('div', { class: 'nw-st-head nw-p-' + c.k }, c.head));
    });
    cols.forEach(function (c) {
      var zero = c.d === 0;
      grid.appendChild(el('div', { class: 'nw-st-dig' + (zero ? ' nw-st-zero' : ' nw-pc-' + c.k) }, String(c.d)));
    });
    if (n === 1000) {
      grid.appendChild(el('div', { class: 'nw-st-word nw-p-th', style: { gridColumn: '1 / span 4' } }, 'one thousand = ten hundreds'));
      return grid;
    }
    var dd = digitsOf(n);
    var parts = cardParts(n);
    var hw = parts
      .filter(function (p) {
        return p.p === 'h';
      })
      .map(function (p) {
        return p.w;
      })
      .join(' ');
    grid.appendChild(el('div', { class: 'nw-st-word nw-p-h' }, hw));
    if (dd.t === 1) {
      grid.appendChild(el('div', { class: 'nw-st-word nw-p-to', style: { gridColumn: '2 / span 2' } }, ONES[10 + dd.o] + ': 1 ten, ' + dd.o + ' ones'));
    } else {
      grid.appendChild(dd.t ? el('div', { class: 'nw-st-word nw-p-t' }, TENS[dd.t] + (dd.o ? '-' : '')) : el('div', { class: 'nw-st-word nw-st-none' }, 'no tens → 0'));
      grid.appendChild(dd.o ? el('div', { class: 'nw-st-word nw-p-o' }, ONES[dd.o]) : el('div', { class: 'nw-st-word nw-st-none' }, 'no ones → 0'));
    }
    return grid;
  }

  /** "500 + 70 + 3 = 573" as coloured chips. */
  function sumRow(n) {
    var row = el('div', { class: 'sum-row nw-sum' });
    if (n === 1000) {
      row.appendChild(el('span', { class: 'chip nw-p-th' }, '10 hundreds'));
      row.appendChild(el('span', { class: 'sum-op' }, '='));
      row.appendChild(el('span', { class: 'chip chip-total' }, '1000'));
      return row;
    }
    var d = digitsOf(n);
    var parts = [];
    if (d.h) parts.push([d.h * 100, 'h']);
    if (d.t === 1) parts.push([10 + d.o, 'to']);
    else {
      if (d.t) parts.push([d.t * 10, 't']);
      if (d.o) parts.push([d.o, 'o']);
    }
    parts.forEach(function (p, i) {
      if (i) row.appendChild(el('span', { class: 'sum-op' }, '+'));
      row.appendChild(el('span', { class: 'chip nw-p-' + p[1] }, String(p[0])));
    });
    row.appendChild(el('span', { class: 'sum-op' }, '='));
    row.appendChild(el('span', { class: 'chip chip-total' }, String(n)));
    return row;
  }

  /** The name with each card's words coloured by place. */
  function colouredName(n, cls) {
    var span = el('span', { class: 'nw-cname ' + (cls || '') });
    var parts = cardParts(n);
    parts.forEach(function (p, i) {
      span.appendChild(el('span', { class: 'nw-pc-' + p.p }, p.w));
      if (i < parts.length - 1 && p.w.slice(-1) !== '-') span.appendChild(document.createTextNode(' '));
    });
    return span;
  }

  function hearBtn(text, label) {
    return el(
      'button',
      {
        class: 'btn btn-ghost nw-hear',
        type: 'button',
        onclick: function () {
          MQ.speak(text, true);
        },
      },
      label || '🔊 Hear it'
    );
  }

  /* ---------------------------------------------------------------- *
   * Card builder: a row of empty spaces and a tray of word cards.
   * Click a tray card to put it in the next empty space; click a placed card to send it
   * back. Cards can also be dragged onto a space (swapping) or back to the tray.
   * ---------------------------------------------------------------- */
  function cardBuilder(api, opts) {
    var items = opts.tray.map(function (w, i) {
      return { id: i, w: w, at: -1, cls: '' };
    });
    var nSlots = opts.slots;
    var guide = null;
    var locked = false;
    var root = el('div', { class: 'nw-builder' });
    var slotRow = el('div', { class: 'nw-slots' });
    var tray = el('div', { class: 'nw-tray', 'aria-label': 'Card tray' });
    root.appendChild(slotRow);
    root.appendChild(el('div', { class: 'nw-traylab' }, opts.trayLabel || 'Card tray'));
    root.appendChild(tray);

    function itemAt(s) {
      for (var i = 0; i < items.length; i++) if (items[i].at === s) return items[i];
      return null;
    }
    function byId(id) {
      return items[id];
    }
    function cardEl(it) {
      return el('button', { class: 'nw-card' + (it.cls ? ' ' + it.cls : ''), type: 'button', 'data-id': it.id, 'data-word': it.w }, it.w);
    }
    function render() {
      MQ.clear(slotRow);
      for (var s = 0; s < nSlots; s++) {
        var it = itemAt(s);
        var slot = el('div', { class: 'nw-slot' + (it ? ' nw-full' : ''), 'data-slot': s });
        if (it) slot.appendChild(cardEl(it));
        else if (guide && guide[s]) slot.appendChild(el('span', { class: 'nw-guide' }, guide[s]));
        slotRow.appendChild(slot);
      }
      MQ.clear(tray);
      var left = items.filter(function (x) {
        return x.at === -1;
      });
      left.forEach(function (x) {
        tray.appendChild(cardEl(x));
      });
      if (!left.length) tray.appendChild(el('span', { class: 'nw-trayempty' }, 'No cards left'));
    }
    function changed() {
      render();
      if (opts.onChange) opts.onChange(b.get());
    }
    function place(id, s) {
      var it = byId(id);
      var occ = itemAt(s);
      if (occ === it) return render();
      if (occ) occ.at = it.at;
      it.at = s;
      api.sound('pop');
      changed();
    }
    function toTray(id) {
      var it = byId(id);
      if (it.at === -1) return render();
      it.at = -1;
      api.sound('click');
      changed();
    }
    function tap(id) {
      if (locked) return;
      var it = byId(id);
      if (it.at !== -1) return toTray(id);
      for (var s = 0; s < nSlots; s++) {
        if (!itemAt(s)) return place(id, s);
      }
      api.feedback('All the spaces are full. Click a card in a space to send it back.', 'info');
    }

    // pointer handling
    var drag = null;
    function clearTargets() {
      Array.prototype.forEach.call(slotRow.children, function (s) {
        s.classList.remove('nw-target');
      });
    }
    function slotUnder(x, y) {
      var t = document.elementFromPoint(x, y);
      if (!t || !t.closest) return null;
      var s = t.closest('.nw-slot');
      if (s && root.contains(s)) return s;
      var tr = t.closest('.nw-tray');
      if (tr === tray) return tray;
      return null;
    }
    function onMove(e) {
      if (!drag) return;
      if (!drag.moved) {
        if (Math.abs(e.clientX - drag.x0) + Math.abs(e.clientY - drag.y0) < 6) return;
        drag.moved = true;
        drag.ghost = el('div', { class: 'nw-card nw-ghost' }, byId(drag.id).w);
        document.body.appendChild(drag.ghost);
        drag.src.classList.add('nw-lifted');
      }
      drag.ghost.style.left = e.clientX + 'px';
      drag.ghost.style.top = e.clientY + 'px';
      clearTargets();
      var s = slotUnder(e.clientX, e.clientY);
      if (s && s !== tray) s.classList.add('nw-target');
    }
    function stopListening() {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    }
    function dropGhost(d) {
      if (d && d.ghost && d.ghost.parentNode) d.ghost.parentNode.removeChild(d.ghost);
    }
    function onUp(e) {
      if (!drag) return;
      stopListening();
      var d = drag;
      drag = null;
      dropGhost(d);
      clearTargets();
      if (locked) return render();
      if (!d.moved) return tap(d.id);
      var s = slotUnder(e.clientX, e.clientY);
      if (s === tray) toTray(d.id);
      else if (s) place(d.id, +s.getAttribute('data-slot'));
      else render();
    }
    function onDown(e) {
      if (locked || drag) return;
      if (e.button !== undefined && e.button !== 0) return;
      var c = e.target && e.target.closest ? e.target.closest('.nw-card') : null;
      if (!c || !root.contains(c)) return;
      e.preventDefault();
      drag = { id: +c.getAttribute('data-id'), x0: e.clientX, y0: e.clientY, moved: false, src: c };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
    }
    function onKeyClick(e) {
      // keyboard (Enter / Space) gives a click with detail 0; mouse clicks go through pointer events
      if (e.detail !== 0) return;
      var c = e.target && e.target.closest ? e.target.closest('.nw-card') : null;
      if (c && root.contains(c)) tap(+c.getAttribute('data-id'));
    }
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('click', onKeyClick);
    api.cleanup(function () {
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('click', onKeyClick);
      stopListening();
      dropGhost(drag);
      drag = null;
    });

    var b = {
      el: root,
      get: function () {
        var out = [];
        for (var s = 0; s < nSlots; s++) {
          var it = itemAt(s);
          out.push(it ? it.w : null);
        }
        return out;
      },
      full: function () {
        return b.get().every(function (w) {
          return w !== null;
        });
      },
      clear: function () {
        items.forEach(function (x) {
          x.at = -1;
          x.cls = '';
        });
        render();
      },
      lock: function () {
        locked = true;
        root.classList.add('nw-locked');
        root.querySelectorAll('.nw-card').forEach(function (c) {
          c.disabled = true;
        });
      },
      lockAfterRender: function () {
        root.querySelectorAll('.nw-card').forEach(function (c) {
          c.disabled = true;
        });
      },
      /** Put the given words into the spaces (taking matching cards from anywhere). */
      set: function (wordsList, classes) {
        items.forEach(function (x) {
          x.at = -1;
          x.cls = '';
        });
        wordsList.forEach(function (w, s) {
          for (var i = 0; i < items.length; i++) {
            if (items[i].at === -1 && items[i].w === w) {
              items[i].at = s;
              items[i].cls = classes ? classes[s] : '';
              break;
            }
          }
        });
        render();
        if (locked) b.lockAfterRender();
      },
      setGuide: function (g) {
        guide = g;
        render();
      },
      shake: function () {
        slotRow.classList.remove('nw-shake');
        void slotRow.offsetWidth;
        slotRow.classList.add('nw-shake');
      },
    };
    render();
    return b;
  }

  /** Hint for five cards that do not make a proper number name. */
  function patternHint(seq, strong, tray) {
    tray = tray || [];
    var exD = tray.filter(isDigitWord)[0] || 'eight';
    var exT = tray.filter(function (w) {
      return TY_HY.indexOf(w) !== -1;
    })[0] || 'seventy-';
    var exO = tray.filter(isDigitWord)[1] || 'three';
    var teen = seq.filter(isTeen)[0];
    if (teen) {
      return {
        hint: q(teen) + ' is a whole word on its own (1 ten and ' + (ONES.indexOf(teen) - 10) + ' ones). It cannot fill a space here. After ' + q('and') + ' we need a -ty card, then a ones word.',
        tag: 'Mixed teen and -ty',
      };
    }
    var msg;
    if (seq[1] !== 'hundred') msg = 'Start with how many hundreds: a number word like ' + q(exD) + ', then ' + q('hundred') + '.';
    else if (!isDigitWord(seq[0])) msg = 'The first card says how many hundreds, like ' + q(exD) + '.';
    else if (seq[2] !== 'and') msg = q('and') + ' comes straight after ' + q('hundred') + '.';
    else if (TY_HY.indexOf(seq[3]) === -1) msg = 'After ' + q('and') + ' comes a -ty card, like ' + q(exT) + '.';
    else msg = 'The last card is a ones word, like ' + q(exO) + '.';
    if (strong) msg += ' The pattern is: ___ hundred and ___-___.';
    return { hint: msg, tag: 'Put the words in the wrong order' };
  }
  var GUIDE5 = ['how many?', 'hundred', 'and', '-ty', 'ones'];

  /* ---------------------------------------------------------------- *
   * Learn screens
   * ---------------------------------------------------------------- */

  // 1. A house door numbered 573: each word card lights its digit.
  function learnDoor(stage, api) {
    api.lockNext();
    var n = 573;
    api.say('This house is number 573. I read it: five hundred and seventy-three! Click each card.');
    stage.appendChild(MQ.ui.lesson('Read the door number', 'Each word card matches a digit. Click every card.'));
    var W = 250;
    var H = 300;
    var door = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'nw-door', style: { maxWidth: '100%', height: 'auto' } });
    door.appendChild(svg('rect', { x: 0, y: 0, width: W, height: H, rx: 12, class: 'nw-wall' }));
    door.appendChild(svg('rect', { x: 45, y: 92, width: 160, height: 208, rx: 6, class: 'nw-doorbody' }));
    door.appendChild(svg('rect', { x: 62, y: 110, width: 56, height: 74, rx: 4, class: 'nw-panel' }));
    door.appendChild(svg('rect', { x: 132, y: 110, width: 56, height: 74, rx: 4, class: 'nw-panel' }));
    door.appendChild(svg('rect', { x: 62, y: 198, width: 56, height: 88, rx: 4, class: 'nw-panel' }));
    door.appendChild(svg('rect', { x: 132, y: 198, width: 56, height: 88, rx: 4, class: 'nw-panel' }));
    door.appendChild(svg('circle', { cx: 190, cy: 210, r: 6, class: 'nw-knob' }));
    door.appendChild(svg('rect', { x: 40, y: 12, width: 170, height: 68, rx: 10, class: 'nw-plaque' }));
    var digs = {};
    ['h', 't', 'o'].forEach(function (k, i) {
      var cx = 75 + i * 50;
      var bg = svg('rect', { x: cx - 22, y: 18, width: 44, height: 56, rx: 8, class: 'nw-dbg' });
      var tx = svg('text', { x: cx, y: 64, class: 'nw-ddig', 'text-anchor': 'middle' }, String(digitsOf(n)[k]));
      door.appendChild(bg);
      door.appendChild(tx);
      digs[k] = { bg: bg, tx: tx };
    });
    var cardsRow = el('div', { class: 'nw-cardrow' });
    var readout = el('div', { class: 'nw-readout' }, 'Click a card');
    var right = el('div', { class: 'nw-door-right' }, el('div', { class: 'nw-cname-big' }, 'five hundred and seventy-three'), cardsRow, readout);
    stage.appendChild(el('div', { class: 'nw-door-wrap' }, door, right));
    var INFO = {
      h: 'is the hundreds digit: 5 hundreds',
      hundred: 'tells us the 5 means hundreds: 500',
      and: 'is a joining word. It has <b>no digit</b>!',
      t: 'is the tens digit: 7 tens = 70',
      o: 'is the ones digit: 3 ones',
    };
    var seen = {};
    var parts = cardParts(n);
    parts.forEach(function (p, i) {
      var c = el('button', { class: 'nw-card nw-lcard', type: 'button', 'data-i': i, 'data-word': p.w }, p.w);
      c.addEventListener('click', function () {
        api.sound('click');
        Array.prototype.forEach.call(cardsRow.children, function (x) {
          x.classList.remove('nw-on');
        });
        c.classList.add('nw-on', 'nw-p-' + p.p);
        ['h', 't', 'o'].forEach(function (k) {
          var on = p.p === k;
          digs[k].bg.setAttribute('class', 'nw-dbg' + (on ? ' nw-dbg-' + k : ''));
          digs[k].tx.setAttribute('class', 'nw-ddig' + (on ? ' nw-ddig-on' : ''));
        });
        var key = p.w === 'hundred' ? 'hundred' : p.p;
        readout.innerHTML = '<b>' + p.w + '</b> ' + INFO[key];
        seen[i] = true;
        if (Object.keys(seen).length === parts.length) {
          api.say('Every card matches a digit, except "and". Five hundred and seventy-three is 573!', 'cheer');
          api.feedback('five <b>hundred</b> → 5 &nbsp; seventy- → 7 &nbsp; three → 3. "and" has no digit.', 'good');
          api.unlockNext();
        }
      });
      cardsRow.appendChild(c);
    });
  }

  // 2. Sound-alike cards: thirteen / thirty, fifteen / fifty, eighteen / eighty.
  function miniBlocks(t, o) {
    var u = 5;
    var W = Math.max(30, t * 12 + (o ? 8 + o * 9 : 0));
    var H = 10 * u + 4;
    var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'nw-mini', style: { maxWidth: '100%', height: 'auto' } });
    for (var i = 0; i < t; i++) {
      s.appendChild(svg('rect', { x: 2 + i * 12, y: 2, width: u + 1, height: 10 * u, class: 'nw-mini-t' }));
    }
    for (var j = 0; j < o; j++) {
      s.appendChild(svg('rect', { x: 2 + t * 12 + 6 + j * 9, y: H - 2 - (u + 1), width: u + 1, height: u + 1, class: 'nw-mini-o' }));
    }
    return s;
  }
  function learnSoundAlike(stage, api) {
    api.lockNext();
    api.say('Some number words sound alike! Click each card to hear it and see its digits.');
    stage.appendChild(MQ.ui.lesson('-teen or -ty?', 'Listen to the end of the word: thir<b>teen</b> or thir<b>ty</b>?'));
    var pairs = [
      [13, 30],
      [15, 50],
      [18, 80],
    ];
    var grid = el('div', { class: 'nw-pairs' });
    var seen = {};
    pairs.forEach(function (pr) {
      var row = el('div', { class: 'nw-pair' });
      pr.forEach(function (v, i) {
        if (i) row.appendChild(el('span', { class: 'nw-vs' }, 'or'));
        var t = Math.floor(v / 10);
        var o = v % 10;
        var show = el('div', { class: 'nw-pshow' }, el('span', { class: 'nw-pq' }, '?'));
        var card = el('button', { class: 'nw-card nw-scard', type: 'button', 'data-n': v }, words(v));
        card.addEventListener('click', function () {
          api.sound('click');
          MQ.speak(words(v), true);
          MQ.clear(show);
          show.appendChild(el('div', { class: 'nw-pdig' }, el('span', { class: 'nw-pc-t' }, String(t)), el('span', { class: o ? 'nw-pc-o' : 'nw-st-zero-t' }, String(o))));
          show.appendChild(el('div', { class: 'nw-pside' }, miniBlocks(t, o), el('div', { class: 'nw-pcap' }, t + (t === 1 ? ' ten, ' : ' tens, ') + o + ' ones')));
          card.classList.add('nw-on');
          seen[v] = true;
          if (Object.keys(seen).length === 6) {
            api.say('-teen means 1 ten and some ones. -ty means that many tens!', 'cheer');
            api.feedback('thir<b>teen</b> = 13 (1 ten, 3 ones) &nbsp;·&nbsp; thir<b>ty</b> = 30 (3 tens, 0 ones)', 'good');
            api.unlockNext();
          }
        });
        row.appendChild(el('div', { class: 'nw-pcell' }, card, show));
      });
      grid.appendChild(row);
    });
    stage.appendChild(grid);
  }

  // 3. A tray of only six cards: you can only make the numbers those cards allow.
  function learnTray(stage, api) {
    api.lockNext();
    var tray = ['hundred', 'and', 'eight', 'three', 'seventy-', 'fifty-'];
    var all = possibleNumbers(tray, 5);
    api.say('Only these six cards! Use five of them to make a number.');
    stage.appendChild(MQ.ui.lesson('Only the cards you have', 'Put 5 cards in the spaces to make a number, then press <b>Make it</b>.'));
    var found = [];
    var made = el('div', { class: 'nw-made' });
    var list = el('div', { class: 'nw-alllist' });
    var b = cardBuilder(api, { tray: tray, slots: 5, trayLabel: 'Your 6 cards' });
    stage.appendChild(b.el);
    var btn = el('button', { class: 'btn nw-check', type: 'button' }, 'Make it ✓');
    stage.appendChild(btn);
    stage.appendChild(made);
    stage.appendChild(list);
    function showList() {
      MQ.clear(list);
      list.appendChild(el('div', { class: 'nw-listhead' }, 'These cards make only ' + all.length + ' numbers:'));
      var row = el('div', { class: 'nw-listrow' });
      all.forEach(function (v) {
        row.appendChild(el('span', { class: 'chip nw-poss' + (found.indexOf(v) !== -1 ? ' nw-got' : '') }, (found.indexOf(v) !== -1 ? '✓ ' : '') + v));
      });
      list.appendChild(row);
      var no = el('div', { class: 'nw-listrow nw-norow' });
      [875, 783, 535].forEach(function (v) {
        var miss = missingCards(cardsOf(v), tray);
        no.appendChild(el('span', { class: 'chip nw-cant' }, '✗ ' + v + ': no ' + miss[0] + ' card'));
      });
      list.appendChild(no);
    }
    btn.addEventListener('click', function () {
      var seq = b.get();
      if (!b.full()) {
        api.feedback('Fill all 5 spaces first.', 'info');
        return;
      }
      var v = numberOfCards(seq);
      if (v < 0 || all.indexOf(v) === -1) {
        api.say('Hmm, that is not a number name yet.', 'think');
        api.feedback(patternHint(seq, true, tray).hint, 'info');
        b.shake();
        return;
      }
      if (found.indexOf(v) !== -1) {
        api.feedback('You made ' + v + ' already. Try swapping two cards!', 'info');
        return;
      }
      found.push(v);
      api.sound('correct');
      MQ.clear(made);
      made.appendChild(el('div', { class: 'nw-madeline' }, colouredName(v), el('span', { class: 'nw-eq' }, '='), el('b', { class: 'nw-madenum' }, String(v))));
      showList();
      b.clear();
      api.say(found.length === 1 ? 'Yes, ' + v + '! There are no five, thirty or eighty cards, so we cannot make 875 or 535.' : 'Yes, ' + v + '!', 'cheer');
      api.feedback(found.length === all.length ? 'You made all ' + all.length + '! Only use the cards on the tray.' : 'Only use the cards you have. Can you make another?', 'good');
      api.unlockNext();
    });
  }

  /* ---------------------------------------------------------------- *
   * Practice deck
   * ---------------------------------------------------------------- */
  var deck = null;

  function distinctDigits(a, b, c) {
    return a !== b && b !== c && a !== c;
  }
  /** Level 1: three names for a number (100-999, no zeros, digits all different). */
  function nameOptions(n) {
    var d = digitsOf(n);
    var tv = d.t === 1 ? d.h * 100 + d.o * 10 : d.h * 100 + 10 + d.t;
    var swaps = [d.h * 100 + d.o * 10 + d.t, d.o * 100 + d.t * 10 + d.h, d.t * 100 + d.h * 10 + d.o];
    var sv = swaps.filter(function (v) {
      return v !== n && v !== tv;
    })[0];
    return { teenTy: tv, swap: sv };
  }

  /** Two distractor cards for a level 2 number. */
  function distractors(n) {
    var set = cardsOf(n);
    var c = [];
    if (n === 1000) c = ['hundred', 'zero', 'ten'];
    else {
      var d = digitsOf(n);
      if (d.t === 0 && d.o > 0) c = ['zero', TENS[d.o] || 'ten', d.o >= 3 ? ONES[10 + d.o] : null];
      else if (d.t === 1) c = [d.o >= 3 ? TENS[d.o] : null, 'one', d.o > 0 ? ONES[d.o] : 'zero', 'zero'];
      else if (d.o > 0) c = [ONES[10 + d.t], ONES[d.t], d.o >= 2 ? TENS[d.o] + '-' : null, 'zero'];
      else c = [ONES[10 + d.t], 'zero', ONES[d.t]];
    }
    var out = [];
    c.concat(['zero', 'ten', 'thousand']).forEach(function (w) {
      if (w && out.length < 2 && set.indexOf(w) === -1 && out.indexOf(w) === -1) out.push(w);
    });
    return out;
  }

  /** Level 3 card tray: hundred, and + four more; makes 2 or 4 five-card numbers. */
  function makeTray(kind) {
    for (var guard = 0; guard < 500; guard++) {
      var dg = U.shuffle(U.range(1, 9)).slice(0, 2);
      var ty = U.shuffle(U.range(2, 9)).slice(0, 2);
      var cards = ['hundred', 'and', ONES[dg[0]], ONES[dg[1]], TENS[ty[0]] + '-'];
      if (kind === 4) cards.push(TENS[ty[1]] + '-');
      else cards.push(ONES[10 + U.pick([ty[0], dg[0], dg[1]].filter(function (k) {
        return k >= 3;
      }).concat([ty[0]]))]);
      // not the book's own tray (that one is on the learn screen)
      var key = cards.slice().sort().join(',');
      if (key === ['hundred', 'and', 'eight', 'three', 'seventy-', 'fifty-'].sort().join(',')) continue;
      var all = possibleNumbers(cards, 5);
      if (all.length >= 2 && all.length <= 4) return { tray: U.shuffle(cards), all: all };
    }
    return { tray: ['hundred', 'and', 'six', 'two', 'forty-', 'ninety-'], all: possibleNumbers(['hundred', 'and', 'six', 'two', 'forty-', 'ninety-'], 5) };
  }

  function buildDeck() {
    var used = {};
    var R = U.rand;
    function fresh(gen) {
      for (var i = 0; i < 400; i++) {
        var n = gen();
        if (!used[n]) {
          used[n] = true;
          return n;
        }
      }
      var m = gen();
      used[m] = true;
      return m;
    }
    function noZeroDistinct(teen) {
      return function () {
        for (;;) {
          var h = R(1, 9);
          var t = teen ? 1 : R(3, 9);
          var o = teen ? R(3, 9) : R(1, 9);
          if (distinctDigits(h, t, o)) return h * 100 + t * 10 + o;
        }
      };
    }
    var out = [];
    // Level 1: pick the name (one teen number, two -ty numbers)
    U.shuffle([false, false, true]).forEach(function (teen) {
      out.push({ type: 'name', n: fresh(noZeroDistinct(teen)) });
    });
    // Level 2: build the name with cards (a zero ten, a hyphen number, and 1000 / x10 / teen / x-ty-0)
    var l2 = [
      fresh(function () {
        return R(1, 9) * 100 + R(1, 9);
      }),
      fresh(function () {
        return R(1, 9) * 100 + R(2, 9) * 10 + R(1, 9);
      }),
      fresh(function () {
        var k = U.pick(['k', 'ten', 'teen', 'ty0']);
        if (k === 'k' && !used[1000]) return 1000;
        if (k === 'ten') return R(1, 9) * 100 + 10;
        if (k === 'teen') return R(1, 9) * 100 + 10 + R(1, 9);
        return R(1, 9) * 100 + R(2, 9) * 10;
      }),
    ];
    U.shuffle(l2).forEach(function (n) {
      out.push({ type: 'cards', n: n });
    });
    // Level 3: find every number a six-card tray makes; type the digits for a name
    var tr = makeTray(Math.random() < 0.6 ? 4 : 2);
    var l3 = [{ type: 'find', tray: tr.tray, all: tr.all }];
    var r = Math.random();
    l3.push({
      type: 'digits',
      n: fresh(function () {
        var h = R(1, 9);
        if (r < 0.5) return h * 100 + R(1, 9); // six hundred and four
        if (r < 0.75) return h * 100 + R(2, 9) * 10 + R(1, 9); // three hundred and seventy-eight
        if (r < 0.875) return h * 100 + 10 + R(3, 9); // six hundred and fifteen
        return h * 100 + R(2, 9) * 10; // three hundred and seventy
      }),
    });
    U.shuffle(l3).forEach(function (x) {
      out.push(x);
    });
    return out;
  }

  /* ---------------------------------------------------------------- *
   * Practice question types
   * ---------------------------------------------------------------- */
  // Level 1: digits shown, pick the name.
  function qName(wrap, api, x) {
    var n = x.n;
    var d = digitsOf(n);
    var o = nameOptions(n);
    wrap.setAttribute('data-words', words(n));
    api.say('Which name is right for this number?', 'think');
    wrap.appendChild(MQ.ui.prompt('Which is the name of this number?'));
    wrap.appendChild(el('div', { class: 'nw-big' }, String(n)));
    var work = el('div', { class: 'nw-work' });
    var opts = U.shuffle([n, o.teenTy, o.swap]).map(function (v) {
      return { label: words(v), value: v };
    });
    var ch = MQ.ui.choices(
      opts,
      function (v) {
        if (api.isAnswered()) return;
        if (v === n) {
          ch.mark(v, 'good');
          ch.disable();
          api.check(true, 'Yes! ' + n + ' is ' + words(n) + '.');
          return;
        }
        ch.mark(v, 'bad');
        var strong = api.tries() >= 1;
        if (v === o.teenTy) {
          if (d.t === 1) {
            api.check(false, strong ? 'The tens digit is 1. 1 ten and ' + d.o + ' ones is ' + ONES[10 + d.o] + '. ' + TENS[d.o] + ' would be ' + d.o + ' tens.' : 'Look at the tens digit. It is 1, so it is a -teen number.', 'Mixed teen and -ty');
          } else {
            api.check(false, strong ? 'The tens digit is ' + d.t + ': ' + d.t + ' tens is ' + TENS[d.t] + '. ' + ONES[10 + d.t] + ' is only ' + (10 + d.t) + '.' : 'Look at the tens digit, ' + d.t + '. Is it ' + TENS[d.t] + ' or ' + ONES[10 + d.t] + '?', 'Mixed teen and -ty');
          }
        } else {
          api.check(false, strong ? 'The first digit is ' + d.h + ', so it starts ' + ONES[d.h] + ' hundred. Then the tens ' + d.t + ', then the ones ' + d.o + '.' : 'Read the digits from left to right. The first digit tells the hundreds.', 'Mixed up the places');
        }
      },
      { columns: 1 }
    );
    ch.classList.add('nw-choices');
    wrap.appendChild(ch);
    wrap.appendChild(work);
    api.onReveal(function () {
      ch.mark(n, 'good');
      ch.disable();
      work.appendChild(matchStrip(n));
    });
  }

  // Level 2: build the name with word cards.
  function qCards(wrap, api, x) {
    var n = x.n;
    var parts = cardParts(n);
    var right = cardsOf(n);
    var extra = distractors(n);
    wrap.setAttribute('data-cards', JSON.stringify(right));
    wrap.setAttribute('data-words', words(n));
    api.say('Put the word cards in order to name ' + n + '.', 'think');
    wrap.appendChild(el('div', { class: 'prompt nw-prompt' }, 'Name this number with the cards:', el('span', { class: 'nw-big nw-big-in' }, String(n))));
    var b = cardBuilder(api, { tray: U.shuffle(right.concat(extra)), slots: right.length });
    wrap.appendChild(b.el);
    var btn = el('button', { class: 'btn nw-check', type: 'button' }, 'Check ✓');
    wrap.appendChild(btn);
    var work = el('div', { class: 'nw-work' });
    wrap.appendChild(work);
    var d = digitsOf(n);
    btn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var seq = b.get();
      if (!b.full()) {
        api.feedback('Fill every space first. You need ' + right.length + ' cards.', 'info');
        return;
      }
      if (seq.join('|') === right.join('|')) {
        b.lock();
        btn.disabled = true;
        btn.style.display = 'none';
        b.set(right, parts.map(function (p) {
          return 'nw-p-' + p.p;
        }));
        api.check(true, 'Yes! ' + n + ' is ' + words(n) + '.');
        return;
      }
      b.shake();
      var strong = api.tries() >= 1;
      var wrongCards = seq.filter(function (w) {
        return right.indexOf(w) === -1;
      });
      var w0 = wrongCards[0];
      if (w0 === 'zero') {
        var empty = n === 1000 ? '' : d.t === 0 ? 'tens' : d.o === 0 ? 'ones' : '';
        api.check(false, strong ? (empty ? 'There are no ' + empty + ' in ' + n + ', so we just skip them: ' : 'Say it: ') + words(n) + '.' : 'We never say ' + q('zero') + ' in a number name. An empty place is just left out.', 'Said zero for an empty place');
      } else if (w0 === 'hundred' && n === 1000) {
        api.check(false, strong ? '1000 is ten hundreds. Its name is ' + q('one thousand') + '.' : '1000 has its own word. It is not a hundred!', 'Mixed up the places');
      } else if (w0 && (isTeen(w0) || isTy(w0))) {
        var msg;
        if (d.t === 0) msg = 'There are no tens in ' + n + '. ' + q(w0) + ' would need tens!';
        else if (d.t === 1) msg = d.o === 0 ? n + ' ends in 10: that is ' + q('ten') + '.' : 'The tens digit is 1, so it is a -teen word: ' + q(ONES[10 + d.o]) + '.';
        else msg = 'The tens digit is ' + d.t + ': ' + d.t + ' tens is ' + q(TENS[d.t]) + ', not ' + q(w0) + '.';
        api.check(false, strong ? msg + ' Listen to the end: -teen or -ty?' : msg, 'Mixed teen and -ty');
      } else if (w0 && isDigitWord(w0)) {
        var place = d.t >= 2 && w0 === ONES[d.t] ? 'tens' : d.t === 1 ? 'tens and ones' : 'other';
        if (place === 'tens') api.check(false, 'The ' + d.t + ' is in the tens place. ' + d.t + ' tens is ' + q(TENS[d.t]) + ', not ' + q(w0) + '.', 'Read the digits one by one');
        else if (place === 'tens and ones') api.check(false, (d.o ? 'The last two digits make ' + (10 + d.o) + ': one word, ' : 'The last two digits make 10: one word, ') + q(ONES[10 + d.o]) + '.', 'Read the digits one by one');
        else api.check(false, 'Is there a ' + q(w0) + ' in ' + n + '? Look at each digit again.', 'Read the digits one by one');
      } else if (w0) {
        api.check(false, 'Look again: is there a ' + q(w0) + ' in ' + n + '?', 'Used a card that was not there');
      } else {
        // right cards, wrong order
        api.check(false, strong ? 'Say it slowly: ' + words(n) + '. Put the cards in that order.' : 'You have the right cards! Start with the hundreds, then ' + q('and') + ', then the rest.', 'Put the words in the wrong order');
      }
    });
    api.onReveal(function () {
      b.lock();
      btn.disabled = true;
      btn.style.display = 'none';
      b.set(right, parts.map(function (p) {
        return 'nw-p-' + p.p;
      }));
      work.appendChild(matchStrip(n));
    });
  }

  // Level 3: find every number a fixed set of six cards can make.
  function qFind(wrap, api, x) {
    var all = x.all;
    wrap.setAttribute('data-answer', JSON.stringify(all));
    wrap.setAttribute('data-tray', JSON.stringify(x.tray));
    api.say('Use only these six cards. Find all ' + all.length + ' numbers you can make!', 'think');
    wrap.appendChild(MQ.ui.prompt('Make every number you can with 5 of these cards. There are <b>' + all.length + '</b>.'));
    var found = [];
    var b = cardBuilder(api, { tray: x.tray, slots: 5, trayLabel: 'Your 6 cards (one of each)' });
    wrap.appendChild(b.el);
    var btn = el('button', { class: 'btn nw-check', type: 'button' }, 'Make it ✓');
    wrap.appendChild(btn);
    var list = el('div', { class: 'nw-found' });
    wrap.appendChild(list);
    function drawList(revealed) {
      MQ.clear(list);
      var show = found.slice();
      all.forEach(function (v) {
        if (revealed && show.indexOf(v) === -1) show.push(v);
      });
      for (var i = 0; i < all.length; i++) {
        var v = show[i];
        if (v === undefined) {
          list.appendChild(el('div', { class: 'nw-fitem nw-fempty' }, '?'));
        } else {
          var mine = found.indexOf(v) !== -1;
          list.appendChild(el('div', { class: 'nw-fitem' + (mine ? ' nw-fgot' : ' nw-fshow'), 'data-n': v }, el('b', null, String(v)), colouredName(v, 'nw-fname')));
        }
      }
    }
    drawList(false);
    btn.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var seq = b.get();
      if (!b.full()) {
        api.feedback('Fill all 5 spaces first.', 'info');
        return;
      }
      var v = numberOfCards(seq);
      if (v >= 0 && all.indexOf(v) !== -1) {
        if (found.indexOf(v) !== -1) {
          api.feedback('You found ' + v + ' already. Swap two cards to make a new one!', 'info');
          return;
        }
        found.push(v);
        drawList(false);
        b.clear();
        if (found.length === all.length) {
          b.setGuide(null);
          b.lock();
          btn.disabled = true;
          btn.style.display = 'none';
          api.check(true, 'You found all ' + all.length + ': ' + found.join(', ') + '!');
        } else {
          api.sound('pop');
          api.say('Yes, ' + v + '! Find ' + (all.length - found.length) + ' more.', 'happy');
          api.feedback(v + ' is ' + words(v) + '. Now make a different one.', 'good');
        }
        return;
      }
      b.shake();
      var h = patternHint(seq, api.tries() >= 1, x.tray);
      api.check(false, h.hint, h.tag);
      if (api.tries() >= 1) b.setGuide(GUIDE5);
    });
    api.onReveal(function () {
      b.lock();
      btn.disabled = true;
      btn.style.display = 'none';
      drawList(true);
      var first = all.filter(function (v) {
        return found.indexOf(v) === -1;
      })[0];
      if (first === undefined) first = all[0];
      b.set(cardsOf(first), cardParts(first).map(function (p) {
        return 'nw-p-' + p.p;
      }));
      api.feedback('Each number uses: a number word + hundred + and + a -ty card + a ones word. Swap the two number words, or swap the -ty cards.', 'info');
    });
  }

  // Level 3: type the digits for a number written in words.
  function qDigits(wrap, api, x) {
    var n = x.n;
    var d = digitsOf(n);
    var name = words(n);
    wrap.setAttribute('data-words', name);
    api.say('Write this number in digits.', 'think');
    wrap.appendChild(MQ.ui.prompt('Write this number in digits:'));
    wrap.appendChild(el('div', { class: 'nw-wordsbig' }, '“' + name + '”'));
    wrap.appendChild(hearBtn(name));
    var work = el('div', { class: 'nw-work' });
    var tv = d.t === 1 && d.o > 0 ? d.h * 100 + d.o * 10 : d.t >= 2 && d.o === 0 ? d.h * 100 + 10 + d.t : -1;
    var inp = MQ.ui.numberInput({
      onSubmit: function (v) {
        if (api.isAnswered()) return;
        if (v === n) {
          inp.good();
          inp.disable();
          api.check(true, 'Yes! ' + name + ' is ' + n + '.');
          return;
        }
        inp.bad();
        var strong = api.tries() >= 1;
        var s = String(v);
        if (v >= 1000 && s.indexOf(String(d.h) + '00') === 0) {
          api.check(false, strong ? 'Hundreds digit ' + d.h + ', then the tens ' + d.t + ', then the ones ' + d.o + '. Only 3 digits!' : 'You wrote each part as you heard it. ' + name + ' fits in just 3 digits: hundreds, tens, ones.', 'Wrote the number as it sounds');
        } else if ((d.t === 0 && v === d.h * 10 + d.o) || (d.o === 0 && d.t > 0 && v === d.h * 10 + d.t)) {
          var pl = d.t === 0 ? 'tens' : 'ones';
          api.check(false, strong ? d.h + ' hundreds, ' + d.t + ' tens, ' + d.o + ' ones. Write all three digits.' : 'There are no ' + pl + ', but the ' + pl + ' place still needs a 0.', 'Left out the zero');
        } else if (v === tv) {
          api.check(false, d.t === 1 ? q(ONES[10 + d.o]) + ' is 1 ten and ' + d.o + ' ones: ' + (10 + d.o) + '.' : q(TENS[d.t]) + ' is ' + d.t + ' tens: ' + d.t * 10 + '.', 'Mixed teen and -ty');
        } else if (v >= 100 && v <= 999 && s.split('').sort().join('') === String(n).split('').sort().join('')) {
          api.check(false, strong ? 'Hundreds first: ' + d.h + '. Then tens: ' + d.t + '. Then ones: ' + d.o + '.' : 'Right digits, wrong places. Which digit is the hundreds, the tens, the ones?', 'Mixed up the places');
        } else {
          api.check(false, strong ? 'How many hundreds? ' + d.h + '. How many tens? ' + d.t + '. How many ones? ' + d.o + '.' : 'Say it slowly. How many hundreds? How many tens? How many ones?', 'Wrote the wrong number');
        }
      },
    });
    wrap.appendChild(inp.el);
    wrap.appendChild(work);
    inp.focus();
    api.onReveal(function () {
      inp.setValue(String(n));
      inp.good();
      inp.disable();
      work.appendChild(matchStrip(n));
      work.appendChild(sumRow(n));
    });
  }

  var TYPES = { name: qName, cards: qCards, find: qFind, digits: qDigits };

  MQ.register('number-word-cards', {
    learn: [learnDoor, learnSoundAlike, learnTray],
    practice: {
      count: 8,
      render: function (stage, api) {
        if (!deck || api.index === 0 || !deck[api.index]) deck = buildDeck();
        var x = deck[api.index];
        var wrap = el('div', { class: 'nw-q', 'data-type': x.type, 'data-level': api.level });
        if (x.n !== undefined) wrap.setAttribute('data-answer', String(x.n));
        stage.appendChild(wrap);
        TYPES[x.type](wrap, api, x);
      },
    },
  });

  var css = [
    '.nw-q{display:flex;flex-direction:column;align-items:center;gap:12px;width:100%}',
    '.nw-big{font-size:3.4rem;font-weight:800;letter-spacing:.06em;line-height:1.1;background:#fff;border:3px solid var(--line);border-radius:16px;padding:4px 26px}',
    '.nw-prompt{display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:center;margin:0}',
    '.nw-big-in{font-size:2.6rem;padding:2px 18px}',
    '.nw-choices{max-width:560px}',
    '.nw-choices .choice{font-size:1.3rem}',
    '.nw-wordsbig{font-size:2rem;font-weight:800;text-align:center;background:#fffaf0;border:3px solid #d8c7a4;border-radius:16px;padding:10px 22px;max-width:100%}',
    '.nw-hear{font-size:.95rem;padding:6px 14px}',
    '.nw-work{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%}',
    '.nw-work:empty{display:none}',
    /* cards, spaces and tray */
    '.nw-card{font:inherit;font-size:1.3rem;font-weight:800;color:var(--ink);background:#fffaf0;border:3px solid #c9b48a;border-radius:12px;padding:8px 14px;min-width:60px;min-height:52px;cursor:grab;box-shadow:0 2px 0 #d8c7a4;touch-action:none;user-select:none;-webkit-user-select:none;white-space:nowrap}',
    '.nw-card:hover:not(:disabled){border-color:var(--accent);transform:translateY(-2px)}',
    '.nw-card:disabled{cursor:default;opacity:1}',
    '.nw-lifted{opacity:.3}',
    '.nw-ghost{position:fixed;z-index:1000;pointer-events:none;transform:translate(-50%,-50%) rotate(-3deg);box-shadow:0 6px 16px rgba(0,0,0,.2)}',
    '.nw-builder{display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;max-width:820px}',
    '.nw-slots{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.nw-slot{min-width:118px;min-height:62px;border:3px dashed var(--line);border-radius:14px;background:#fff;display:flex;align-items:center;justify-content:center;padding:2px}',
    '.nw-slot.nw-full{border-style:solid;border-color:transparent;background:transparent}',
    '.nw-slot .nw-card{width:100%}',
    '.nw-slot.nw-target{border-color:var(--accent);background:var(--paper-2)}',
    '.nw-guide{color:#9aa6c4;font-weight:700;font-size:1rem}',
    '.nw-traylab{font-size:.95rem;font-weight:700;color:var(--ink-soft);margin-top:4px}',
    '.nw-tray{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;align-items:center;min-height:76px;width:100%;padding:10px;background:#f4f1ea;border:2px solid #d8cfbd;border-radius:14px}',
    '.nw-locked .nw-tray,.nw-locked .nw-traylab{display:none}',
    '.nw-trayempty{color:var(--ink-soft);font-weight:700}',
    '.nw-shake{animation:nw-shake .35s}',
    '@keyframes nw-shake{25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}',
    '.nw-check{font-size:1.15rem}',
    /* place colours */
    '.nw-card.nw-p-h,.chip.nw-p-h,.nw-st-word.nw-p-h,.nw-st-head.nw-p-h{background:#d8ecf8;border-color:#1d6fa5;color:#0b4f7d}',
    '.nw-card.nw-p-t,.chip.nw-p-t,.nw-st-word.nw-p-t,.nw-st-head.nw-p-t{background:#dcf0cf;border-color:#3d7a1f;color:#2d5e13}',
    '.nw-card.nw-p-o,.chip.nw-p-o,.nw-st-word.nw-p-o,.nw-st-head.nw-p-o{background:#ffefc2;border-color:#a06a00;color:#7a5200}',
    '.nw-card.nw-p-to,.chip.nw-p-to,.nw-st-word.nw-p-to{background:linear-gradient(90deg,#dcf0cf,#ffefc2);border-color:#5f7a1f;color:#2d5e13}',
    '.nw-card.nw-p-and{background:#eeeeee;border-color:#9a9a9a;color:#555}',
    '.nw-card.nw-p-th,.chip.nw-p-th,.nw-st-word.nw-p-th,.nw-st-head.nw-p-th{background:#eadcf8;border-color:#7b2cbf;color:#5a189a}',
    '.nw-pc-h{color:#1d6fa5}.nw-pc-t{color:#3d7a1f}.nw-pc-o{color:#a06a00}.nw-pc-to{color:#5f7a1f}.nw-pc-and{color:#777}.nw-pc-th{color:#7b2cbf}',
    /* match strip */
    '.nw-strip{display:grid;gap:4px;text-align:center;max-width:100%}',
    '.nw-st-head{font-weight:800;border-radius:8px;padding:3px;font-size:.95rem;border:2px solid transparent}',
    '.nw-st-dig{font-size:2rem;line-height:1.3;font-weight:800;background:#fff;border:2px solid var(--line);border-radius:8px}',
    '.nw-st-zero{color:#c25400;border:3px solid #e76f00;background:#fff1e0}',
    '.nw-st-zero-t{color:#c25400}',
    '.nw-st-word{font-weight:800;border-radius:8px;padding:4px 6px;border:2px solid transparent;font-size:.95rem;line-height:1.2}',
    '.nw-st-none{color:#c25400;background:#fff1e0}',
    '.nw-sum .chip{font-size:1.4rem}',
    '.nw-cname{font-weight:800}',
    /* learn 1: door */
    '.nw-door-wrap{display:flex;gap:26px;align-items:center;justify-content:center;flex-wrap:wrap;width:100%}',
    '.nw-door{display:block;width:230px}',
    '.nw-wall{fill:#f6efe4}',
    '.nw-doorbody{fill:#2f6f8f;stroke:#1d4a60;stroke-width:3}',
    '.nw-panel{fill:none;stroke:#86b6cc;stroke-width:3}',
    '.nw-knob{fill:#ffcf5c;stroke:#a87400;stroke-width:2}',
    '.nw-plaque{fill:#fff;stroke:#9c6b30;stroke-width:4}',
    '.nw-dbg{fill:transparent;transition:fill .2s}',
    '.nw-dbg-h{fill:#d8ecf8;stroke:#1d6fa5;stroke-width:3}.nw-dbg-t{fill:#dcf0cf;stroke:#3d7a1f;stroke-width:3}.nw-dbg-o{fill:#ffefc2;stroke:#a06a00;stroke-width:3}',
    '.nw-ddig{font-size:46px;font-weight:800;fill:var(--ink)}',
    '.nw-ddig-on{fill:#000}',
    '.nw-door-right{display:flex;flex-direction:column;align-items:center;gap:14px;max-width:520px}',
    '.nw-cname-big{font-size:1.5rem;font-weight:800;text-align:center}',
    '.nw-cardrow{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.nw-lcard{cursor:pointer}',
    '.nw-lcard.nw-on{transform:translateY(-4px);box-shadow:0 5px 0 #c9b48a}',
    '.nw-readout{min-height:56px;font-size:1.25rem;text-align:center;background:var(--paper);border:2px solid var(--line);border-radius:14px;padding:12px 16px;width:100%}',
    /* learn 2: sound-alikes */
    '.nw-pairs{display:flex;flex-direction:column;gap:12px;width:100%;align-items:center}',
    '.nw-pair{display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap;justify-content:center}',
    '.nw-vs{font-weight:800;color:var(--ink-soft);align-self:center;font-size:1.1rem}',
    '.nw-pcell{display:flex;align-items:center;gap:10px;background:#fff;border:2px solid var(--line);border-radius:14px;padding:6px 10px;width:330px;max-width:100%}',
    '.nw-scard{cursor:pointer;min-width:120px}',
    '.nw-scard.nw-on{border-color:var(--accent)}',
    '.nw-pshow{display:flex;align-items:center;gap:10px;min-height:56px}',
    '.nw-pq{font-size:1.6rem;font-weight:800;color:#b8c2dc}',
    '.nw-pdig{font-size:2rem;font-weight:800}',
    '.nw-pside{display:flex;flex-direction:column;gap:2px;align-items:flex-start}',
    '.nw-pcap{font-size:.9rem;font-weight:700;color:var(--ink-soft);white-space:nowrap}',
    '.nw-mini{display:block}',
    '.nw-mini-t{fill:#a7d58a;stroke:#3d7a1f;stroke-width:1}',
    '.nw-mini-o{fill:#ffcf5c;stroke:#a87400;stroke-width:1}',
    /* learn 3 + find */
    '.nw-made{min-height:0}',
    '.nw-madeline{display:flex;align-items:center;gap:10px;font-size:1.35rem;flex-wrap:wrap;justify-content:center}',
    '.nw-madenum{font-size:1.8rem}',
    '.nw-eq{font-weight:800;color:var(--ink-soft)}',
    '.nw-alllist{display:flex;flex-direction:column;align-items:center;gap:6px}',
    '.nw-listhead{font-weight:800}',
    '.nw-listrow{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}',
    '.chip.nw-poss{font-size:1.2rem}',
    '.chip.nw-got{background:var(--good-bg);border-color:var(--good);color:var(--good)}',
    '.chip.nw-cant{background:var(--try-bg);border-color:var(--try);color:var(--try);font-size:1rem}',
    '.nw-found{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;width:100%}',
    '.nw-fitem{min-width:150px;min-height:70px;border:3px solid var(--line);border-radius:14px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 10px;text-align:center}',
    '.nw-fitem b{font-size:1.6rem}',
    '.nw-fname{font-size:.85rem}',
    '.nw-fempty{border-style:dashed;color:#b8c2dc;font-size:1.6rem;font-weight:800}',
    '.nw-fgot{border-color:var(--good);background:var(--good-bg)}',
    '.nw-fshow{border-color:var(--gold);background:#fff8e1}',
    '@media (max-width:900px){.nw-slot{min-width:96px}.nw-card{font-size:1.15rem;padding:7px 10px}.nw-big{font-size:2.8rem}.nw-pcell{width:300px}.nw-scard{min-width:96px}.nw-door{width:170px}.nw-fitem{min-width:120px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': 'number-word-cards' }, css));
})();

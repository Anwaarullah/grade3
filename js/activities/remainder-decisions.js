/* Remainder Decisions — what does the remainder mean in a story? (Unit 11.3)
 * Things are packed into equal groups (tubes, benches, bags…). The child decides whether the
 * leftover needs one more group (round up), cannot make a whole one (round down), or is
 * simply left over when sharing.
 */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var U = MQ.util;

  /* ------------------------------------------------------------------ *
   * Story contexts. type: 'up' = need one more group, 'down' = only whole
   * groups count, 'share' = say how many each and what is left over.
   * ------------------------------------------------------------------ */
  var CTX = {
    tubes: { type: 'up', icon: '🎾', color: '#c6d93a', item: 'tennis balls', item1: 'tennis ball', group: 'tube', groups: 'tubes', d: [4],
      text: function (n, d) { return n + ' tennis balls are packed into tubes. Each tube holds ' + d + '. How many tubes are needed for all the balls?'; } },
    benches: { type: 'up', icon: '🪑', color: '#4d96ff', item: 'children', item1: 'child', group: 'bench', groups: 'benches', d: [10],
      text: function (n, d) { return n + ' children need a seat. ' + d + ' children fit on each bench. How many benches are needed?'; } },
    tables: { type: 'up', icon: '🍽️', color: '#f4a261', item: 'children', item1: 'child', group: 'table', groups: 'tables', d: [3],
      text: function (n, d) { return d + ' children fit at each small table. How many tables are needed for ' + n + ' children?'; } },
    cakes: { type: 'up', icon: '🧁', color: '#e76f9a', item: 'cakes', item1: 'cake', group: 'box', groups: 'boxes', d: [5, 4],
      text: function (n, d) { return n + ' cakes are put in boxes. Each box holds ' + d + '. How many boxes are needed for all the cakes?'; } },
    bikes: { type: 'down', icon: '🚲', color: '#555', item: 'wheels', item1: 'wheel', group: 'bike', groups: 'bikes', d: [2],
      text: function (n) { return 'A shop has ' + n + ' wheels. How many bikes can it make? (A bike has 2 wheels.)'; } },
    stools: { type: 'down', icon: '🪵', color: '#a0522d', item: 'legs', item1: 'leg', group: 'stool', groups: 'stools', d: [3],
      text: function (n) { return 'There are ' + n + ' legs. How many three-legged stools can be made?'; } },
    apples: { type: 'down', icon: '🍎', color: '#e63946', item: 'apples', item1: 'apple', group: 'bag', groups: 'bags', d: [5, 4],
      text: function (n, d) { return n + ' apples are packed in bags of ' + d + '. How many full bags are there?'; } },
    marbles: { type: 'share', icon: '🔵', color: '#457b9d', item: 'marbles', item1: 'marble', group: 'child', groups: 'children', d: [2, 3, 4, 5],
      text: function (n, d) { return n + ' marbles are shared equally by ' + d + ' children. How many does each child get?'; } },
    stickers: { type: 'share', icon: '⭐', color: '#f2b705', item: 'stickers', item1: 'sticker', group: 'friend', groups: 'friends', d: [2, 3, 4, 5],
      text: function (n, d) { return n + ' stickers are shared equally between ' + d + ' friends. How many does each friend get?'; } },
  };

  function storyQ(ctxKey, n, d) {
    var c = CTX[ctxKey];
    return { kind: 'story', ctx: ctxKey, type: c.type, n: n, d: d, q: Math.floor(n / d), r: n % d };
  }
  function correctCount(q) {
    return q.type === 'up' ? q.q + 1 : q.q;
  }
  function plural(k, one, many) {
    return k + ' ' + (k === 1 ? one : many);
  }

  /* ------------------------------------------------------------------ *
   * Groups picture: boxes of d dots. Full boxes are solid; the last box
   * holds the remainder with empty dashed slots.
   * ------------------------------------------------------------------ */
  function groupsView(n, d, color, opts) {
    opts = opts || {};
    var wrap = el('div', { class: 'rd-groups' + (n > 60 ? ' rd-small' : '') });
    var full = Math.floor(n / d);
    var r = n % d;
    function box(count, partial) {
      var b = el('div', { class: 'rd-box' + (partial ? ' rd-partial' : '') + (d === 10 ? ' rd-box10' : '') });
      for (var i = 0; i < d; i++) b.appendChild(el('span', { class: 'rd-dot' + (i < count ? '' : ' rd-empty'), style: i < count ? { background: color } : null }));
      return b;
    }
    for (var g = 0; g < full; g++) wrap.appendChild(box(d, false));
    if (r) {
      if (opts.loose) {
        var loose = el('div', { class: 'rd-loose' });
        for (var j = 0; j < r; j++) loose.appendChild(el('span', { class: 'rd-dot', style: { background: color } }));
        wrap.appendChild(loose);
      } else wrap.appendChild(box(r, true));
    }
    return wrap;
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */
  // Pack n things into groups of d, one group per click, then ask what to do with the rest.
  function packScreen(stage, api, cfg) {
    api.say(cfg.intro);
    api.lockNext();
    stage.appendChild(MQ.ui.lesson(cfg.title, cfg.sub));
    var packed = 0;
    var full = Math.floor(cfg.n / cfg.d);
    var r = cfg.n % cfg.d;
    var pic = el('div', { class: 'rd-pic' });
    var left = el('div', { class: 'rd-left' });
    var area = el('div', { class: 'rd-q' });
    function draw() {
      MQ.clear(pic);
      if (cfg.share) {
        var row = el('div', { class: 'rd-groups' });
        for (var c = 0; c < cfg.d; c++) {
          var b = el('div', { class: 'rd-box rd-child' }, el('div', { class: 'rd-who' }, 'child ' + (c + 1)));
          for (var k = 0; k < packed; k++) b.appendChild(el('span', { class: 'rd-dot', style: { background: cfg.color } }));
          row.appendChild(b);
        }
        pic.appendChild(row);
      } else pic.appendChild(groupsView(packed * cfg.d, cfg.d, cfg.color));
      var rest = cfg.n - packed * cfg.d;
      MQ.clear(left);
      left.appendChild(groupsView(rest, rest + 1, cfg.color, { loose: true }));
      left.appendChild(el('div', { class: 'rd-left-label' }, plural(rest, cfg.item1, cfg.item) + ' not packed'));
    }
    var btn = el('button', { class: 'btn btn-big', type: 'button' }, cfg.button);
    btn.addEventListener('click', function () {
      if (packed >= full) return;
      packed++;
      api.sound('pop');
      draw();
      if (packed === full) {
        btn.disabled = true;
        api.say(cfg.ask, 'think');
        area.appendChild(el('div', { class: 'prompt' }, cfg.ask));
        var ch = MQ.ui.choices(cfg.options, function (v) {
          if (v === cfg.right) {
            ch.mark(v, 'good');
            ch.disable();
            api.sound('correct');
            cfg.after(pic, area);
            api.unlockNext();
          } else {
            ch.mark(v, 'bad');
            api.sound('wrong');
            api.feedback(cfg.wrongMsg, 'try');
          }
        }, { columns: 2 });
        area.appendChild(ch);
      }
    });
    draw();
    stage.appendChild(el('div', { class: 'rd-scene' }, pic, left));
    stage.appendChild(btn);
    stage.appendChild(area);
  }

  function learnTubes(stage, api) {
    packScreen(stage, api, {
      n: 18, d: 4, color: CTX.tubes.color, item: 'balls', item1: 'ball',
      title: '18 tennis balls, 4 in each tube', sub: 'Press the button to fill a tube.',
      intro: '18 tennis balls go into tubes. Each tube holds 4. Fill the tubes!',
      button: 'Fill a tube 🎾',
      ask: '2 balls are left. Can we leave them on the floor?',
      options: [{ label: 'Leave them on the floor', value: 'leave' }, { label: 'Get one more tube', value: 'more' }],
      right: 'more',
      wrongMsg: 'All the balls must go in tubes. The 2 balls need a tube too!',
      after: function (pic, area) {
        MQ.clear(pic);
        pic.appendChild(groupsView(18, 4, CTX.tubes.color));
        area.appendChild(el('div', { class: 'rd-sentence' }, '18 ÷ 4 = 4 r2  →  5 tubes'));
        api.say('Yes! 4 full tubes and one more for the last 2 balls. 5 tubes.', 'cheer');
        api.feedback('Sometimes the remainder means we need ONE MORE.', 'good');
      },
    });
  }

  function learnMarbles(stage, api) {
    packScreen(stage, api, {
      n: 13, d: 4, share: true, color: CTX.marbles.color, item: 'marbles', item1: 'marble',
      title: '13 marbles shared by 4 children', sub: 'Each box is one child. Give one marble to each child per round.',
      intro: '13 marbles are shared by 4 children. Each box below is one child. Press the button to give out a round.',
      button: 'Give one to each child',
      ask: '1 marble is left. What do we do?',
      options: [{ label: 'It is left over', value: 'left' }, { label: 'Find another child', value: 'child' }],
      right: 'left',
      wrongMsg: 'We cannot invent another child! The marble just stays in the bag.',
      after: function (pic, area) {
        // Re-draw as 4 children with 3 each.
        MQ.clear(pic);
        var row = el('div', { class: 'rd-groups' });
        for (var i = 0; i < 4; i++) {
          var b = el('div', { class: 'rd-box rd-child' }, el('div', { class: 'rd-who' }, 'child ' + (i + 1)));
          for (var k = 0; k < 3; k++) b.appendChild(el('span', { class: 'rd-dot', style: { background: CTX.marbles.color } }));
          row.appendChild(b);
        }
        pic.appendChild(row);
        area.appendChild(el('div', { class: 'rd-sentence' }, '13 ÷ 4 = 3 r1  →  3 each, 1 left over'));
        api.say('Right! Each child gets 3. The 1 left over stays in the bag.', 'cheer');
        api.feedback('Sometimes the remainder is just left over.', 'good');
      },
    });
  }

  function learnBenches(stage, api) {
    api.say('23 children, 10 on each bench. Press Sit down to fill a bench.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Everyone needs a seat', '23 children · 10 fit on a bench'));
    var benches = el('div', { class: 'rd-benches' });
    var standing = el('div', { class: 'rd-standing' });
    var left = 23;
    var filled = 0;
    var out = el('div', { class: 'rd-q' });
    function bench(k) {
      var b = el('div', { class: 'rd-bench' });
      var seats = el('div', { class: 'rd-seats' });
      for (var i = 0; i < 10; i++) seats.appendChild(el('span', { class: 'rd-kid' + (i < k ? '' : ' rd-empty') }));
      b.appendChild(seats);
      b.appendChild(el('div', { class: 'rd-bench-legs' }));
      return b;
    }
    function drawStanding() {
      MQ.clear(standing);
      for (var i = 0; i < left; i++) standing.appendChild(el('span', { class: 'rd-kid' }));
      standing.appendChild(el('div', { class: 'rd-left-label' }, left + ' standing'));
    }
    var sit = el('button', { class: 'btn btn-big', type: 'button' }, 'Sit down');
    var add = el('button', { class: 'btn btn-big rd-hidden', type: 'button' }, 'Add a bench');
    sit.addEventListener('click', function () {
      if (left < 10) return;
      left -= 10;
      filled++;
      benches.appendChild(bench(10));
      api.sound('pop');
      drawStanding();
      if (left < 10) {
        sit.disabled = true;
        add.classList.remove('rd-hidden');
        api.say('3 children are still standing! Every child needs a seat.', 'think');
      }
    });
    add.addEventListener('click', function () {
      if (add.disabled) return;
      add.disabled = true;
      benches.appendChild(bench(left));
      left = 0;
      drawStanding();
      api.sound('correct');
      out.appendChild(el('div', { class: 'rd-sentence' }, '23 ÷ 10 = 2 r3  →  3 benches'));
      api.say('Now everyone sits. 23 ÷ 10 is 2 r3, but we need 3 benches.', 'cheer');
      api.feedback('The 3 left over still need a seat, so we round up.', 'good');
      api.unlockNext();
    });
    drawStanding();
    stage.appendChild(el('div', { class: 'rd-scene' }, benches, standing));
    stage.appendChild(el('div', { class: 'rd-btns' }, sit, add));
    stage.appendChild(out);
  }

  function learnCompare(stage, api) {
    api.say('24 cookies. Share them on 3 plates, or on 4 plates. Which way gives more on each plate?');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('More plates, less on each', 'Click the side where each plate gets more.'));
    function side(d, key) {
      var plates = el('div', { class: 'rd-groups' });
      for (var i = 0; i < d; i++) {
        var p = el('div', { class: 'rd-plate' });
        for (var k = 0; k < 24 / d; k++) p.appendChild(el('span', { class: 'rd-dot', style: { background: '#c98b4a' } }));
        plates.appendChild(p);
      }
      var lab = el('div', { class: 'rd-side-label' }, '24 ÷ ' + d + ' = ?');
      var s = el('button', { class: 'rd-side', type: 'button' }, el('div', { class: 'rd-side-title' }, d + ' plates'), plates, lab);
      s.addEventListener('click', function () {
        if (done) return;
        if (key === 3) {
          done = true;
          s.classList.add('good');
          a.querySelector('.rd-side-label').textContent = '24 ÷ 3 = 8';
          b.querySelector('.rd-side-label').textContent = '24 ÷ 4 = 6';
          api.sound('correct');
          api.say('Yes! 3 plates get 8 each. 4 plates get only 6 each.', 'cheer');
          api.feedback('Sharing between MORE gives LESS on each: 24 ÷ 3 is bigger than 24 ÷ 4.', 'good');
          api.unlockNext();
        } else {
          s.classList.add('bad');
          api.sound('wrong');
          api.feedback('Count the cookies on one plate on each side.', 'try');
        }
      });
      return s;
    }
    var done = false;
    var a = side(3, 3);
    var b = side(4, 4);
    stage.appendChild(el('div', { class: 'rd-compare' }, a, b));
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  var deck = null;
  var BOARD = [87, 43, 29, 49, 59, 73, 61, 38, 65];

  function randStory(ctxKeys, lo, hi, used) {
    for (var g = 0; g < 200; g++) {
      var key = U.pick(ctxKeys);
      var d = U.pick(CTX[key].d);
      var n = U.rand(Math.max(lo, d + 1), hi);
      if (n % d === 0) continue;
      var id = key + n + '/' + d;
      if (used[id]) continue;
      used[id] = true;
      return storyQ(key, n, d);
    }
    return null;
  }

  function buildDeck() {
    var used = {};
    var out = [];
    // Level 1 (Q1–4): picture stories, dividends 9–30, one of each kind, plus one more.
    var kinds = U.shuffle([
      ['tubes', 'tables', 'cakes', 'benches'],
      ['bikes', 'stools', 'apples'],
      ['marbles', 'stickers'],
    ]);
    kinds.forEach(function (keys) {
      out.push(randStory(keys, 9, 30, used));
    });
    out.push(randStory(['benches', 'tubes', 'bikes'], 9, 30, used));
    out = out.slice(0, 3).concat(U.shuffle(out.slice(3)));
    // Level 2 (Q5–7): dividends 30–50. Book/workbook: 46 balls in 4s, 36 marbles for 5,
    // 37 children on benches of 10, 37 children 3 per table, 35 legs for stools.
    var book = U.shuffle([storyQ('tubes', 46, 4), storyQ('marbles', 36, 5), storyQ('benches', 37, 10), storyQ('tables', 37, 3), storyQ('stools', 35, 3)]);
    var l2 = [];
    var types = {};
    book.forEach(function (q) {
      if (l2.length < 2 && !types[q.type]) {
        types[q.type] = 1;
        used[q.ctx + q.n + '/' + q.d] = true;
        l2.push(q);
      }
    });
    var missing = ['up', 'down', 'share'].filter(function (t) {
      return !types[t];
    })[0];
    var pool = Object.keys(CTX).filter(function (k) {
      return CTX[k].type === missing;
    });
    l2.push(randStory(pool, 30, 50, used));
    l2.forEach(function (q) {
      q.typeIt = true;
    });
    out = out.concat(U.shuffle(l2));
    // Level 3 (Q8–10): spinner-board division, comparing two divisions, a workbook challenge story.
    var bn = U.pick(BOARD);
    var bd;
    do {
      bd = U.pick([2, 3, 4, 5]);
    } while (bn % bd === 0);
    out.push({ kind: 'bare', n: bn, d: bd, q: Math.floor(bn / bd), r: bn % bd });
    var cmp = U.pick([[72, 3, 4], [60, 3, 5], [48, 3, 4], [36, 3, 4], [40, 4, 5], [24, 2, 3]]);
    out.push({ kind: 'compare', n: cmp[0], a: cmp[1], b: cmp[2] });
    out.push({ kind: 'special', which: U.pick(['games', 'ribbon', 'taxi', 'match']) });
    return out;
  }

  /* ------------------------------------------------------------------ *
   * Practice renderers
   * ------------------------------------------------------------------ */
  function storyOptions(q) {
    var c = CTX[q.ctx];
    if (q.type === 'share') {
      return [
        { label: q.q + ' each, ' + q.r + ' left over', value: 'right' },
        { label: q.q + 1 + ' each', value: 'up' },
        q.r !== q.q ? { label: q.r + ' each, ' + q.q + ' left over', value: 'swap' } : { label: q.q + ' each, none left over', value: 'none' },
      ];
    }
    return [
      { label: plural(q.q, c.group, c.groups), value: q.type === 'down' ? 'right' : 'down' },
      { label: plural(q.q + 1, c.group, c.groups), value: q.type === 'up' ? 'right' : 'up' },
      { label: q.q + ' r' + q.r + ' ' + c.groups, value: 'rem' },
    ];
  }

  function storyWhy(q) {
    var c = CTX[q.ctx];
    if (q.type === 'up') return q.n + ' ÷ ' + q.d + ' = ' + q.q + ' r' + q.r + '. The ' + plural(q.r, c.item1, c.item) + ' left still need a ' + c.group + ', so ' + plural(q.q + 1, c.group, c.groups) + '.';
    if (q.type === 'down') return q.n + ' ÷ ' + q.d + ' = ' + q.q + ' r' + q.r + '. The ' + q.r + ' left over cannot make a whole ' + c.group + ', so ' + plural(q.q, c.group, c.groups) + '.';
    return q.n + ' ÷ ' + q.d + ' = ' + q.q + ' r' + q.r + '. Each gets ' + q.q + ' and ' + q.r + ' ' + (q.r === 1 ? 'is' : 'are') + ' left over.';
  }

  function renderStory(stage, api, q) {
    var c = CTX[q.ctx];
    stage.appendChild(el('div', { class: 'prompt rd-story' }, el('span', { class: 'rd-icon' }, c.icon), ' ', c.text(q.n, q.d)));
    var pic = el('div', { class: 'rd-pic' });
    var picShown = false;
    function showPic() {
      if (picShown) return;
      picShown = true;
      if (q.type === 'share') {
        var row = el('div', { class: 'rd-groups' });
        for (var i = 0; i < q.d; i++) {
          var b = el('div', { class: 'rd-box rd-child' }, el('div', { class: 'rd-who' }, c.group + ' ' + (i + 1)));
          for (var k = 0; k < q.q; k++) b.appendChild(el('span', { class: 'rd-dot', style: { background: c.color } }));
          row.appendChild(b);
        }
        var loose = el('div', { class: 'rd-loose' });
        for (var j = 0; j < q.r; j++) loose.appendChild(el('span', { class: 'rd-dot', style: { background: c.color } }));
        row.appendChild(el('div', { class: 'rd-box rd-partial' }, el('div', { class: 'rd-who' }, 'left over'), loose));
        pic.appendChild(row);
      } else {
        pic.appendChild(groupsView(q.n, q.d, c.color));
        pic.appendChild(el('div', { class: 'rd-left-label' }, 'Each outline is one ' + c.group + ' (' + q.d + ' ' + c.item + '). The dashed one is not full.'));
      }
    }
    if (!q.typeIt) {
      api.say(q.type === 'share' ? 'Look at the sharing. How many each?' : 'Look at the groups. What about the last one?');
      showPic();
    } else api.say('First work out the division. Then answer the story.');
    stage.appendChild(pic);

    var divRow = null;
    var bq;
    var br;
    var divBtn;
    var area = el('div', { class: 'rd-q' });
    var ch = null;
    var divDone = !q.typeIt;

    function askCards() {
      area.appendChild(el('div', { class: 'rd-ask' }, 'So what is the answer to the story?'));
      ch = MQ.ui.choices(U.shuffle(storyOptions(q)), function (v) {
        if (api.isAnswered()) return;
        if (v === 'right') {
          ch.mark(v, 'good');
          ch.disable();
          area.appendChild(el('div', { class: 'rd-sentence' }, storyWhy(q)));
          api.check(true, q.type === 'up' ? 'Yes! The leftovers need one more ' + c.group + '.' : q.type === 'down' ? 'Yes! Only whole ' + c.groups + ' count.' : 'Yes! ' + q.r + ' left over.');
          return;
        }
        ch.mark(v, 'bad');
        showPic();
        var hint;
        var tag;
        if (v === 'down') {
          tag = 'Forgot to round up';
          hint = 'Then ' + plural(q.r, c.item1, c.item) + ' would have no ' + c.group + '! They need one more.';
        } else if (v === 'up' && q.type === 'down') {
          tag = 'Rounded up when not needed';
          hint = 'The last ' + c.group + ' would only have ' + q.r + ' ' + c.item + '. That is not a whole ' + c.group + '!';
        } else if (v === 'up') {
          tag = 'Rounded up when not needed';
          hint = q.q + 1 + ' each would need ' + q.d + ' × ' + (q.q + 1) + ' = ' + q.d * (q.q + 1) + ' ' + c.item + '. There are only ' + q.n + '.';
        } else if (v === 'none') {
          tag = 'Forgot the remainder';
          hint = q.d + ' × ' + q.q + ' = ' + q.d * q.q + '. That is not all ' + q.n + ' ' + c.item + '. Some are left over!';
        } else if (v === 'swap') {
          tag = 'Remainder written as the answer';
          hint = 'Each ' + c.group + ' gets ' + q.q + '. The remainder ' + q.r + ' is what is left.';
        } else {
          tag = 'Ignored what the remainder means';
          hint = 'You cannot have "' + q.q + ' r' + q.r + '" ' + c.groups + '. Think: what happens to the ' + q.r + ' left over?';
        }
        if (api.tries() >= 1) hint += q.type === 'up' ? ' Does everything need a place?' : q.type === 'down' ? ' Only count full ones.' : ' Share fairly: nobody gets extra.';
        api.check(false, hint, tag);
      }, { columns: 3 });
      area.appendChild(ch);
    }

    if (q.typeIt) {
      bq = el('input', { class: 'rd-box-in', type: 'text', inputmode: 'numeric', maxlength: 3, autocomplete: 'off', 'aria-label': 'Answer' });
      br = el('input', { class: 'rd-box-in', type: 'text', inputmode: 'numeric', maxlength: 3, autocomplete: 'off', 'aria-label': 'Remainder' });
      divBtn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
      divRow = el('div', { class: 'rd-div' }, el('span', { class: 'rd-eq' }, q.n + ' ÷ ' + q.d + ' ='), bq, el('span', { class: 'rd-eq' }, 'r'), br, divBtn);
      stage.appendChild(divRow);
      var submitDiv = function () {
        if (api.isAnswered() || divDone) return;
        var a = U.parseNum(bq.value);
        var r = br.value.trim() === '' ? 0 : U.parseNum(br.value);
        if (isNaN(a) || isNaN(r)) {
          api.feedback('Fill in the boxes, then press Check.', 'info');
          return;
        }
        if (a === q.q && r === q.r) {
          divDone = true;
          bq.className = br.className = 'rd-box-in good';
          bq.disabled = br.disabled = divBtn.disabled = true;
          api.feedback('Right! Now, what does it mean in the story?', 'good');
          api.say('Good! Now think about the ' + q.r + ' left over.', 'happy');
          askCards();
          return;
        }
        bq.classList.toggle('bad', a !== q.q);
        br.classList.toggle('bad', r !== q.r);
        showPic();
        if (a * q.d + r === q.n && r >= q.d) api.check(false, r + ' left over is enough for another group of ' + q.d + '. The remainder must be smaller than ' + q.d + '.', 'Remainder too big');
        else if (api.tries() >= 1) api.check(false, 'Count the full boxes in the picture: ' + q.q + ' boxes of ' + q.d + ' make ' + q.q * q.d + '. ' + q.n + ' − ' + q.q * q.d + ' = ' + q.r + '.', 'Division worked out wrongly');
        else api.check(false, 'Count in ' + q.d + 's: how many jumps of ' + q.d + ' fit in ' + q.n + '? The picture can help.', 'Division worked out wrongly');
      };
      divBtn.addEventListener('click', submitDiv);
      [bq, br].forEach(function (b) {
        b.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
            e.preventDefault();
            submitDiv();
          }
        });
      });
      api.later(function () {
        try {
          bq.focus({ preventScroll: true });
        } catch (e) {}
      }, 30);
    } else askCards();
    stage.appendChild(area);

    api.onReveal(function () {
      showPic();
      if (divRow) {
        bq.value = q.q;
        br.value = q.r;
        bq.classList.remove('bad');
        br.classList.remove('bad');
        bq.classList.add('good');
        br.classList.add('good');
        bq.disabled = br.disabled = divBtn.disabled = true;
      }
      if (!ch) askCards();
      ch.mark('right', 'good');
      ch.disable();
      area.appendChild(el('div', { class: 'rd-sentence' }, storyWhy(q)));
    });
  }

  function renderBare(stage, api, q) {
    api.say('Divide ' + q.n + ' by ' + q.d + '. Estimate first: is it more or less than 10? Than 20?');
    stage.appendChild(el('div', { class: 'prompt' }, 'Work out ', el('b', null, q.n + ' ÷ ' + q.d), '. Write any remainder.'));
    var tens = [];
    for (var t = 1; t * 10 * q.d <= 100; t++) tens.push(t * 10 + ' × ' + q.d + ' = ' + t * 10 * q.d);
    stage.appendChild(el('div', { class: 'rd-helper' }, el('b', null, 'Helpful facts: '), tens.join('   ·   ')));
    var bq = el('input', { class: 'rd-box-in', type: 'text', inputmode: 'numeric', maxlength: 3, autocomplete: 'off', 'aria-label': 'Answer' });
    var br = el('input', { class: 'rd-box-in', type: 'text', inputmode: 'numeric', maxlength: 3, autocomplete: 'off', 'aria-label': 'Remainder' });
    var btn = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    stage.appendChild(el('div', { class: 'rd-div' }, el('span', { class: 'rd-eq' }, q.n + ' ÷ ' + q.d + ' ='), bq, el('span', { class: 'rd-eq' }, 'r'), br, btn));
    stage.appendChild(el('div', { class: 'rd-key' }, 'Write 0 in the r box if nothing is left over.'));
    var out = el('div', { class: 'rd-q' });
    stage.appendChild(out);
    api.later(function () {
      try {
        bq.focus({ preventScroll: true });
      } catch (e) {}
    }, 30);
    var tensPart = Math.floor(q.q / 10) * 10;
    function working() {
      MQ.clear(out);
      var rest = q.n - tensPart * q.d;
      out.appendChild(el('div', { class: 'rd-line' }, tensPart + ' groups of ' + q.d + ' = ' + tensPart * q.d + '.  ' + q.n + ' − ' + tensPart * q.d + ' = ' + rest + ' left.'));
      out.appendChild(el('div', { class: 'rd-line' }, rest + ' ÷ ' + q.d + ' = ' + (q.q - tensPart) + ' r' + q.r + ' (count in ' + q.d + 's)'));
      out.appendChild(el('div', { class: 'rd-sentence' }, q.n + ' ÷ ' + q.d + ' = ' + q.q + ' r' + q.r));
      out.appendChild(el('div', { class: 'rd-line' }, 'Check: ' + q.q + ' × ' + q.d + ' = ' + q.q * q.d + ', + ' + q.r + ' = ' + q.n));
    }
    function submit() {
      if (api.isAnswered()) return;
      var a = U.parseNum(bq.value);
      var r = br.value.trim() === '' ? 0 : U.parseNum(br.value);
      if (isNaN(a) || isNaN(r)) {
        api.feedback('Fill in the boxes, then press Check.', 'info');
        return;
      }
      if (a === q.q && r === q.r) {
        bq.className = br.className = 'rd-box-in good';
        bq.disabled = br.disabled = btn.disabled = true;
        working();
        api.check(true, 'Yes! ' + q.n + ' ÷ ' + q.d + ' = ' + q.q + ' r' + q.r + '.');
        return;
      }
      bq.classList.toggle('bad', a !== q.q);
      br.classList.toggle('bad', r !== q.r);
      if (a * q.d + r === q.n && r >= q.d) api.check(false, 'The remainder ' + r + ' is not smaller than ' + q.d + '. You can make another group!', 'Remainder too big');
      else if (a === q.q) api.check(false, q.q + ' × ' + q.d + ' = ' + q.q * q.d + '. How many more to make ' + q.n + '?', 'Forgot the remainder');
      else if (api.tries() >= 1) api.check(false, tensPart + ' groups of ' + q.d + ' make ' + tensPart * q.d + '. That leaves ' + (q.n - tensPart * q.d) + '. How many more groups of ' + q.d + ' fit?', 'Division worked out wrongly');
      else api.check(false, 'Estimate: ' + tensPart + ' × ' + q.d + ' = ' + tensPart * q.d + ' and ' + (tensPart + 10) + ' × ' + q.d + ' = ' + (tensPart + 10) * q.d + '. So the answer is between ' + tensPart + ' and ' + (tensPart + 10) + '.', 'Division worked out wrongly');
    }
    btn.addEventListener('click', submit);
    [bq, br].forEach(function (b) {
      b.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          submit();
        }
      });
    });
    api.onReveal(function () {
      bq.value = q.q;
      br.value = q.r;
      bq.className = br.className = 'rd-box-in good';
      bq.disabled = br.disabled = btn.disabled = true;
      working();
    });
  }

  function renderCompare(stage, api, q) {
    api.say('Which is greater? Think about sharing ' + q.n + ' between ' + q.a + ' or between ' + q.b + '.');
    stage.appendChild(el('div', { class: 'prompt' }, 'Which is greater?'));
    var bars = el('div', { class: 'rd-bars' });
    stage.appendChild(bars);
    function showBars() {
      MQ.clear(bars);
      [q.a, q.b].forEach(function (d) {
        var each = q.n / d;
        var row = el('div', { class: 'rd-bar-row' }, el('span', { class: 'rd-bar-lab' }, q.n + ' ÷ ' + d + ' = ' + each));
        var bar = el('div', { class: 'rd-bar' });
        for (var i = 0; i < each; i++) bar.appendChild(el('span', { class: 'rd-cell' }));
        row.appendChild(bar);
        row.appendChild(el('span', { class: 'rd-bar-note' }, d + ' plates, ' + each + ' on each'));
        bars.appendChild(row);
      });
    }
    var ch = MQ.ui.choices(
      U.shuffle([
        { label: q.n + ' ÷ ' + q.a, value: 'a' },
        { label: q.n + ' ÷ ' + q.b, value: 'b' },
        { label: 'They are the same', value: 'same' },
      ]),
      function (v) {
        if (api.isAnswered()) return;
        if (v === 'a') {
          ch.mark(v, 'good');
          ch.disable();
          showBars();
          api.check(true, 'Yes! Sharing between fewer gives more on each.');
          return;
        }
        ch.mark(v, 'bad');
        if (v === 'b') api.check(false, api.tries() >= 1 ? 'Imagine ' + q.n + ' sweets on ' + q.a + ' plates or on ' + q.b + ' plates. Which plates get more?' : 'Sharing between MORE people gives LESS each. Which divides by fewer?', 'Thinks bigger divisor gives bigger answer');
        else api.check(false, 'Sharing ' + q.n + ' between ' + q.a + ' or ' + q.b + ' does not give the same amount each. Which gives more?', 'Thinks dividing by any number gives the same');
      },
      { columns: 3 }
    );
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark('a', 'good');
      ch.disable();
      showBars();
    });
  }

  var SPECIAL = {
    games: {
      icon: '🎮',
      text: 'You have $25. Games cost $4 each. How many games can you buy, and how much change do you get?',
      say: 'How many lots of $4 fit in $25? What is left is your change.',
      n: 25, d: 4, color: '#2a9d8f',
      options: [
        { label: '6 games, $1 change', value: 'right' },
        { label: '7 games', value: 'up', hint: '7 games cost 7 × $4 = $28. You only have $25!', tag: 'Rounded up when not needed' },
        { label: '6 games, $4 change', value: 'change', hint: '6 games cost 6 × $4 = $24. $25 − $24 = ?', tag: 'Change worked out wrongly' },
      ],
      why: '25 ÷ 4 = 6 r1. 6 games cost $24, so the change is $25 − $24 = $1.',
    },
    ribbon: {
      icon: '🎀',
      text: 'A ribbon is 1 metre long. How many 3 cm pieces can you cut from it, and how much is left?',
      say: '1 metre is 100 centimetres. How many 3s fit in 100?',
      n: 100, d: 3, color: '#e76f9a',
      options: [
        { label: '33 pieces, 1 cm left', value: 'right' },
        { label: '34 pieces', value: 'up', hint: 'The last bit is only 1 cm. That is not a 3 cm piece!', tag: 'Rounded up when not needed' },
        { label: '0 pieces: 3 cm is more than 1', value: 'unit', hint: '1 metre is 100 cm, not 1 cm. How many 3s fit in 100?', tag: 'Forgot 1 m = 100 cm' },
      ],
      why: '1 m = 100 cm. 100 ÷ 3 = 33 r1, so 33 pieces and 1 cm left.',
    },
    taxi: {
      icon: '🚕',
      text: 'A taxi takes 4 passengers and the driver. 10 people need a taxi. How many taxis are needed?',
      say: 'The driver is not a passenger. Each taxi takes 4 people.',
      n: 10, d: 4, color: '#f2b705',
      options: [
        { label: '3 taxis', value: 'right' },
        { label: '2 taxis', value: 'driver', hint: 'The driver does not count! Only 4 passengers fit in each taxi. 2 taxis carry 8. Who is left?', tag: 'Counted the driver as a passenger' },
        { label: '2 r2 taxis', value: 'rem', hint: 'You cannot have "2 r2" taxis. The 2 people left need a taxi too!', tag: 'Forgot to round up' },
      ],
      why: '10 ÷ 4 = 2 r2. The 2 people left need another taxi, so 3 taxis.',
    },
    match: {
      icon: '📖',
      text: 'Which story matches 31 ÷ 4 = 7 r3, with the answer 8?',
      say: 'Read each story. Which one needs one more?',
      n: 31, d: 4, color: '#457b9d',
      options: [
        { label: '31 people, 4 in each car. How many cars?', value: 'right' },
        { label: '31 sweets shared by 4. How many each?', value: 'share', hint: 'Sharing sweets gives 7 each with 3 left over, not 8.', tag: 'Rounded up when not needed' },
        { label: '31 wheels. How many 4-wheel carts?', value: 'down', hint: 'With 31 wheels you can only make 7 whole carts, not 8.', tag: 'Rounded up when not needed' },
      ],
      why: '31 ÷ 4 = 7 r3. The 3 people left need a car too, so 8 cars.',
    },
  };

  function renderSpecial(stage, api, q) {
    var s = SPECIAL[q.which];
    api.say(s.say);
    stage.appendChild(el('div', { class: 'prompt rd-story' }, el('span', { class: 'rd-icon' }, s.icon), ' ', s.text));
    var pic = el('div', { class: 'rd-pic' });
    stage.appendChild(pic);
    var area = el('div', { class: 'rd-q' });
    var ch = MQ.ui.choices(
      U.shuffle(s.options.map(function (o) {
        return { label: o.label, value: o.value };
      })),
      function (v) {
        if (api.isAnswered()) return;
        if (v === 'right') {
          ch.mark(v, 'good');
          ch.disable();
          area.appendChild(el('div', { class: 'rd-sentence' }, s.why));
          api.check(true, 'Yes! ' + s.why);
          return;
        }
        ch.mark(v, 'bad');
        var o = s.options.filter(function (x) {
          return x.value === v;
        })[0];
        var hint = o.hint;
        if (api.tries() >= 1) {
          hint += ' The picture shows the groups of ' + s.d + '.';
          if (!pic.firstChild) {
            pic.appendChild(groupsView(s.n, s.d, s.color));
          }
        }
        api.check(false, hint, o.tag);
      },
      { columns: q.which === 'match' ? 1 : 3 }
    );
    area.insertBefore(ch, area.firstChild);
    stage.appendChild(area);
    api.onReveal(function () {
      ch.mark('right', 'good');
      ch.disable();
      MQ.clear(pic);
      pic.appendChild(groupsView(s.n, s.d, s.color));
      area.appendChild(el('div', { class: 'rd-sentence' }, s.why));
    });
  }

  MQ.register('remainder-decisions', {
    _buildDeck: buildDeck, // used only by test scripts
    learn: [learnTubes, learnMarbles, learnBenches, learnCompare],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (api.index === 0 || !deck) deck = buildDeck();
        var q = deck[api.index];
        if (q.kind === 'story') renderStory(stage, api, q);
        else if (q.kind === 'bare') renderBare(stage, api, q);
        else if (q.kind === 'compare') renderCompare(stage, api, q);
        else renderSpecial(stage, api, q);
      },
    },
  });

  document.head.appendChild(
    el(
      'style',
      { 'data-activity': 'remainder-decisions' },
      [
        '.rd-scene{display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start;justify-content:center;width:100%;max-width:880px;}',
        '.rd-pic{display:flex;flex-direction:column;align-items:center;gap:6px;max-width:880px;width:100%;}',
        '.rd-pic:empty{display:none;}',
        '.rd-groups{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:860px;}',
        '.rd-box{display:flex;flex-wrap:wrap;align-content:flex-start;justify-content:center;gap:3px;padding:6px;border:3px solid #9fb3c8;border-radius:12px;background:#f4f9ff;max-width:84px;min-width:30px;}',
        '.rd-box10{max-width:110px;}',
        '.rd-child{max-width:120px;min-width:84px;}',
        '.rd-partial{border-style:dashed;border-color:#e0a030;background:#fff8e7;}',
        '.rd-who{width:100%;text-align:center;font-size:.8rem;font-weight:700;color:var(--ink-soft);}',
        '.rd-dot{width:16px;height:16px;border-radius:50%;display:inline-block;box-shadow:inset -2px -2px 0 rgba(0,0,0,.18);}',
        '.rd-dot.rd-empty{background:transparent;box-shadow:none;border:2px dashed #c9b27a;box-sizing:border-box;}',
        '.rd-small .rd-dot{width:10px;height:10px;}',
        '.rd-small .rd-box{padding:3px;gap:2px;border-width:2px;}',
        '.rd-loose{display:flex;flex-wrap:wrap;gap:3px;max-width:200px;justify-content:center;}',
        '.rd-left{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;border:2px dashed var(--line);border-radius:12px;min-width:110px;}',
        '.rd-left-label{width:100%;font-weight:700;color:var(--ink-soft);font-size:1rem;text-align:center;}',
        '.rd-q{display:flex;flex-direction:column;align-items:center;gap:10px;width:100%;}',
        '.rd-ask{font-size:1.2rem;font-weight:800;}',
        '.rd-sentence{font-size:1.3rem;font-weight:800;background:#fff3cd;border:2px solid var(--gold);border-radius:14px;padding:6px 16px;text-align:center;max-width:760px;}',
        '.rd-line{font-size:1.15rem;font-weight:700;background:var(--paper-2);border-radius:10px;padding:4px 12px;}',
        '.rd-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;}',
        '.rd-hidden{display:none;}',
        '.rd-benches{display:flex;flex-direction:column;gap:10px;}',
        '.rd-bench{display:flex;flex-direction:column;align-items:center;}',
        '.rd-seats{display:flex;gap:4px;padding:4px 8px;background:#c08a52;border-radius:8px;}',
        '.rd-bench-legs{width:88%;height:10px;border-left:6px solid #8b5e34;border-right:6px solid #8b5e34;}',
        '.rd-kid{width:22px;height:22px;border-radius:50% 50% 6px 6px;background:#4d96ff;display:inline-block;}',
        '.rd-kid.rd-empty{background:transparent;border:2px dashed #fff;box-sizing:border-box;}',
        '.rd-standing{display:flex;flex-wrap:wrap;gap:4px;max-width:270px;justify-content:center;align-items:center;padding:8px;border:2px dashed var(--line);border-radius:12px;min-height:40px;}',
        '.rd-compare{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;}',
        '.rd-side{display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px;border:3px solid var(--line);border-radius:16px;background:#fff;cursor:pointer;font-family:inherit;color:var(--ink);}',
        '.rd-side:hover{border-color:var(--accent);}',
        '.rd-side.good{border-color:var(--good);background:var(--good-bg);}',
        '.rd-side.bad{border-color:var(--try);background:var(--try-bg);}',
        '.rd-side-title{font-size:1.2rem;font-weight:800;}',
        '.rd-side-label{font-size:1.4rem;font-weight:800;}',
        '.rd-plate{display:flex;flex-wrap:wrap;gap:3px;justify-content:center;align-content:center;width:70px;height:70px;border-radius:50%;border:3px solid #cfd6e4;background:#fff;padding:8px;box-sizing:border-box;}',
        '.rd-plate .rd-dot{width:12px;height:12px;}',
        '.rd-story{display:block;}',
        '.rd-icon{font-size:2rem;vertical-align:middle;}',
        '.rd-div{display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;}',
        '.rd-eq{font-size:1.7rem;font-weight:800;}',
        '.rd-box-in{width:84px;height:58px;font-size:1.6rem;font-weight:800;text-align:center;border-radius:12px;border:3px solid var(--line);font-family:inherit;color:var(--ink);}',
        '.rd-box-in.good{border-color:var(--good);background:var(--good-bg);}',
        '.rd-box-in.bad{border-color:var(--try);background:var(--try-bg);}',
        '.rd-key{font-size:.95rem;color:var(--ink-soft);}',
        '.rd-helper{font-size:1.05rem;background:var(--info-bg);border-radius:12px;padding:6px 14px;text-align:center;max-width:760px;}',
        '.rd-bars{display:flex;flex-direction:column;gap:8px;align-items:flex-start;max-width:100%;}',
        '.rd-bars:empty{display:none;}',
        '.rd-bar-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px;}',
        '.rd-bar-lab{font-size:1.2rem;font-weight:800;min-width:110px;}',
        '.rd-bar{display:flex;gap:2px;flex-wrap:wrap;max-width:520px;}',
        '.rd-cell{width:16px;height:22px;background:#c98b4a;border-radius:3px;}',
        '.rd-bar-note{color:var(--ink-soft);font-weight:700;}',
        '@media (max-width:860px){.rd-cell{width:11px;}.rd-dot{width:13px;height:13px;}}',
      ].join('\n')
    )
  );
})();

/* Spinner Lab (Unit 16.1 Chance): outcomes, bigger slice = more likely, estimates out of 8 or 20 spins.
 * Every spinner is drawn from its own data (section sizes in "units" round the circle), and every
 * practice answer is computed from that same data. Random spins are used on learn screens only. */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var svg = MQ.svg;
  var U = MQ.util;
  var ID = 'spinner-lab';

  /* ------------------------------------------------------------------ *
   * Colours and mistake phrases
   * ------------------------------------------------------------------ */
  var COL = {
    red: '#ff7b7b',
    blue: '#6aaef0',
    yellow: '#ffd84d',
    green: '#79d18a',
    purple: '#b897f2',
    orange: '#ffa85c',
    pink: '#ff9fd0',
  };
  var COL_KEYS = Object.keys(COL);
  var SOFT = ['#ffe3a3', '#bfe3ff', '#c9f0cf', '#ffd0d0', '#e3d4ff', '#ffe0c2', '#d4f3f0', '#f6d6ec'];

  var MIS = {
    moreParts: 'Thought the spinner with more parts gives a better chance',
    size: 'Ignored how big each part is',
    missing: 'Missed a colour that is on the spinner',
    extra: 'Listed a colour that is not on the spinner',
    total: 'Estimates did not add up to the number of spins',
    certain: 'Said the biggest part will certainly happen',
    absentMight: 'Said a colour that is not on the spinner might happen',
    mightAsWill: 'Said one colour will happen when others could too',
    onAsWont: 'Said a colour on the spinner will not happen',
    allWill: 'Did not see the arrow must land on one of its own colours',
    equal: 'Did not see that equal parts give the same chance',
    absentEst: 'Gave spins to a letter that is not on the spinner',
  };

  function sw(key) {
    return '<span class="spl-sw" style="background:' + COL[key] + '"></span>' + key;
  }
  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  function listWords(arr) {
    if (arr.length === 1) return arr[0];
    return arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
  }
  function listOr(arr) {
    if (arr.length === 1) return arr[0];
    return arr.slice(0, -1).join(', ') + ' or ' + arr[arr.length - 1];
  }

  /* ------------------------------------------------------------------ *
   * Spinner data: { total, secs: [{ key, units, fill, label }] }
   * Section i covers units/total of the circle. Equal spinners: units 1 each.
   * ------------------------------------------------------------------ */
  function equalColours(keys) {
    return { total: keys.length, secs: keys.map(function (k) { return { key: k, units: 1, fill: COL[k] }; }) };
  }
  function unequalColours(list) {
    var t = 0;
    var secs = list.map(function (p) {
      t += p.units;
      return { key: p.key, units: p.units, fill: COL[p.key] };
    });
    return { total: t, secs: secs };
  }
  function labelled(list) {
    // list: [{label, units, fill?}]
    var t = 0;
    var secs = list.map(function (p, i) {
      t += p.units;
      return { key: p.label, label: p.label, units: p.units, fill: p.fill || SOFT[i % SOFT.length] };
    });
    return { total: t, secs: secs };
  }
  /** Units of the circle that each key covers. */
  function sizes(sp) {
    var o = {};
    sp.secs.forEach(function (s) {
      o[s.key] = (o[s.key] || 0) + s.units;
    });
    return o;
  }
  function keysOf(sp) {
    var seen = [];
    sp.secs.forEach(function (s) {
      if (seen.indexOf(s.key) === -1) seen.push(s.key);
    });
    return seen;
  }
  function layout(sp) {
    var acc = 0;
    return sp.secs.map(function (s) {
      var a0 = (acc / sp.total) * 360;
      acc += s.units;
      return { sec: s, a0: a0, a1: (acc / sp.total) * 360 };
    });
  }
  function sectionAt(sp, deg) {
    deg = ((deg % 360) + 360) % 360;
    var L = layout(sp);
    for (var i = 0; i < L.length; i++) if (deg >= L[i].a0 && deg < L[i].a1) return i;
    return L.length - 1;
  }
  /** A random spin (learn screens only): angle chosen evenly, the section is read from the drawing data. */
  function randomSpin(sp) {
    var deg = Math.random() * 360;
    var i = sectionAt(sp, deg);
    var p = layout(sp)[i];
    var m = Math.min(6, (p.a1 - p.a0) / 4);
    deg = Math.max(p.a0 + m, Math.min(p.a1 - m, deg));
    return { i: i, deg: deg, key: p.sec.key };
  }

  /* ------------------------------------------------------------------ *
   * Drawing
   * ------------------------------------------------------------------ */
  var CX = 120, CY = 120, R = 104;
  function rd(n) {
    return Math.round(n * 100) / 100;
  }
  function pt(deg, r) {
    var a = (deg * Math.PI) / 180;
    return [rd(CX + r * Math.sin(a)), rd(CY - r * Math.cos(a))];
  }
  function wedgePath(a0, a1, r) {
    if (a1 - a0 >= 359.99) return 'M' + CX + ' ' + (CY - r) + ' A' + r + ' ' + r + ' 0 1 1 ' + (CX - 0.01) + ' ' + (CY - r) + ' Z';
    var p0 = pt(a0, r), p1 = pt(a1, r);
    return 'M' + CX + ' ' + CY + ' L' + p0[0] + ' ' + p0[1] + ' A' + r + ' ' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + p1[0] + ' ' + p1[1] + ' Z';
  }

  /**
   * spinnerView(sp, opts) -> { svg, wedges, badge(i, txt, cls, rr), mark(i, cls), guides(), spinTo(deg, ms), clearBadges() }
   * opts: needle (bool), size (max px), onPart(i), only (key: draw only those sections, for "slice" pictures)
   */
  function spinnerView(sp, opts) {
    opts = opts || {};
    var root = svg('svg', { viewBox: '0 0 240 240', class: 'spl-spin' + (opts.cls ? ' ' + opts.cls : ''), role: 'img', 'aria-label': opts.aria || 'A spinner' });
    if (opts.size) root.style.maxWidth = opts.size + 'px';
    var gW = svg('g');
    var gGuide = svg('g', { class: 'spl-guides' });
    var gLab = svg('g', { class: 'spl-labs' });
    var gBadge = svg('g', { class: 'spl-badges' });
    var parts = layout(sp);
    if (opts.only) root.appendChild(svg('circle', { cx: CX, cy: CY, r: R, class: 'spl-ghost' }));
    root.appendChild(gW);
    var wedges = parts.map(function (p, i) {
      if (opts.only && p.sec.key !== opts.only) return null;
      var w = svg('path', { d: wedgePath(p.a0, p.a1, R), fill: p.sec.fill, class: 'spl-wedge', 'data-key': p.sec.key });
      gW.appendChild(w);
      if (p.sec.label) {
        var mid = (p.a0 + p.a1) / 2;
        var span = p.a1 - p.a0;
        var lp = pt(mid, span > 200 ? R * 0.42 : R * 0.62);
        gLab.appendChild(svg('text', { x: lp[0], y: lp[1] + (span < 50 ? 7 : 9), 'text-anchor': 'middle', class: 'spl-lab' + (span < 50 ? ' spl-lab-s' : '') }, p.sec.label));
      }
      if (opts.onPart) {
        w.classList.add('spl-click');
        w.addEventListener('click', function () {
          opts.onPart(i, w);
        });
      }
      return w;
    });
    root.appendChild(gGuide);
    root.appendChild(gLab);
    root.appendChild(svg('circle', { cx: CX, cy: CY, r: R, class: 'spl-rim' }));
    root.appendChild(gBadge);
    var needle = null;
    var rot = 0;
    if (opts.needle) {
      needle = svg('g', { class: 'spl-needle' }, svg('line', { x1: CX, y1: CY + 14, x2: CX, y2: CY - 70, class: 'spl-needle-l' }), svg('path', { d: 'M' + CX + ' ' + (CY - 86) + ' L' + (CX - 11) + ' ' + (CY - 64) + ' L' + (CX + 11) + ' ' + (CY - 64) + ' Z', class: 'spl-needle-h' }));
      needle.style.transformOrigin = CX + 'px ' + CY + 'px';
      root.appendChild(needle);
      root.appendChild(svg('circle', { cx: CX, cy: CY, r: 9, class: 'spl-hub' }));
    }
    var view = {
      svg: root,
      sp: sp,
      wedges: wedges,
      parts: parts,
      badge: function (i, txt, cls, rr) {
        var p = parts[i];
        var span = p.a1 - p.a0;
        var bp = pt((p.a0 + p.a1) / 2, R * (rr || (span > 200 ? 0.62 : 0.66)));
        gBadge.appendChild(svg('circle', { cx: bp[0], cy: bp[1], r: 14, class: 'spl-badge ' + (cls || '') }));
        gBadge.appendChild(svg('text', { x: bp[0], y: bp[1] + 6, 'text-anchor': 'middle', class: 'spl-badge-t' }, String(txt)));
      },
      clearBadges: function () {
        MQ.clear(gBadge);
      },
      mark: function (i, cls) {
        if (wedges[i]) wedges[i].classList.add(cls);
      },
      markKey: function (key, cls) {
        parts.forEach(function (p, i) {
          if (p.sec.key === key && wedges[i]) wedges[i].classList.add(cls);
        });
      },
      /** Dashed lines that cut the circle into `total` equal small parts, so unequal parts can be counted. */
      guides: function () {
        MQ.clear(gGuide);
        for (var k = 0; k < sp.total; k++) {
          var a = (k * 360) / sp.total;
          var e = pt(a, R);
          gGuide.appendChild(svg('line', { x1: CX, y1: CY, x2: e[0], y2: e[1], class: 'spl-guide' }));
        }
      },
      spinTo: function (deg, ms, turns) {
        if (!needle) return;
        var cur = ((rot % 360) + 360) % 360;
        var delta = (((deg - cur) % 360) + 360) % 360;
        rot += 360 * (turns == null ? 2 : turns) + delta;
        needle.style.transition = 'transform ' + ms + 'ms cubic-bezier(.15,.65,.25,1)';
        needle.style.transform = 'rotate(' + rot + 'deg)';
      },
    };
    return view;
  }

  /** A spinner with a caption, in a card. */
  function card(view, title, sub) {
    return el('div', { class: 'spl-card' }, title ? el('div', { class: 'spl-card-t', html: title }) : null, view.svg, sub ? el('div', { class: 'spl-card-s', html: sub }) : null);
  }

  /** A coin picture (heads side up). */
  function coinSvg() {
    return svg(
      'svg',
      { viewBox: '0 0 240 240', class: 'spl-spin', role: 'img', 'aria-label': 'A coin' },
      svg('circle', { cx: CX, cy: CY, r: 92, class: 'spl-coin' }),
      svg('circle', { cx: CX, cy: CY, r: 76, class: 'spl-coin-in' }),
      svg('text', { x: CX, y: CY + 22, 'text-anchor': 'middle', class: 'spl-coin-t' }, 'H')
    );
  }

  /** Tally marks for n. */
  function tallySvg(n) {
    var groups = Math.ceil(n / 5);
    var W = Math.max(10, groups * 34);
    var s = svg('svg', { viewBox: '0 0 ' + W + ' 26', width: W, height: 26, class: 'spl-tally' });
    for (var g = 0; g < groups; g++) {
      var inG = Math.min(5, n - g * 5);
      var x0 = 4 + g * 34;
      for (var k = 0; k < Math.min(4, inG); k++) s.appendChild(svg('line', { x1: x0 + k * 6, y1: 3, x2: x0 + k * 6, y2: 23 }));
      if (inG === 5) s.appendChild(svg('line', { x1: x0 - 3, y1: 19, x2: x0 + 22, y2: 7 }));
    }
    return s;
  }

  /**
   * Estimate panel: rows [{key, html}], N spins. Returns { el, vals, set(vals), disable(), resultEl(key) }.
   */
  function estimator(rows, N, onChange) {
    var vals = {};
    var vEls = {};
    var resEls = {};
    var btns = [];
    var box = el('div', { class: 'spl-est' });
    var totalEl = el('div', { class: 'spl-est-total' });
    function sum() {
      return rows.reduce(function (a, r) {
        return a + vals[r.key];
      }, 0);
    }
    function upd() {
      rows.forEach(function (r) {
        vEls[r.key].textContent = vals[r.key];
      });
      var t = sum();
      totalEl.innerHTML = 'Total: <b>' + t + '</b> of ' + N + (t === N ? ' ✓' : '');
      totalEl.className = 'spl-est-total' + (t === N ? ' spl-ok' : t > N ? ' spl-over' : '');
      if (onChange) onChange();
    }
    rows.forEach(function (r) {
      vals[r.key] = 0;
      var v = el('span', { class: 'spl-est-v' }, '0');
      vEls[r.key] = v;
      var minus = el('button', { class: 'spl-pm', type: 'button', 'aria-label': 'one less' }, '−');
      var plus = el('button', { class: 'spl-pm', type: 'button', 'aria-label': 'one more' }, '+');
      minus.addEventListener('click', function () {
        if (vals[r.key] > 0) {
          vals[r.key]--;
          MQ.sound('click');
          upd();
        }
      });
      plus.addEventListener('click', function () {
        if (vals[r.key] < N) {
          vals[r.key]++;
          MQ.sound('click');
          upd();
        }
      });
      btns.push(minus, plus);
      var res = el('div', { class: 'spl-est-res' });
      resEls[r.key] = res;
      box.appendChild(el('div', { class: 'spl-est-row' }, el('span', { class: 'spl-est-k', html: r.html }), minus, v, plus, res));
    });
    box.appendChild(totalEl);
    upd();
    return {
      el: box,
      vals: vals,
      sum: sum,
      set: function (o) {
        rows.forEach(function (r) {
          vals[r.key] = o[r.key] || 0;
        });
        upd();
      },
      disable: function () {
        btns.forEach(function (b) {
          b.disabled = true;
        });
      },
      enable: function () {
        btns.forEach(function (b) {
          b.disabled = false;
        });
      },
      res: function (key) {
        return resEls[key];
      },
    };
  }

  /**
   * Check an estimate set against a spinner. Rule: total must equal N; a key not on the spinner gets 0;
   * a bigger section never gets fewer spins than a smaller one; and not every letter the same.
   * Returns null when fine, else { why, key1, key2, mis }.
   */
  function estimateProblem(sz, rowKeys, vals, N) {
    var t = 0;
    rowKeys.forEach(function (k) {
      t += vals[k] || 0;
    });
    for (var i = 0; i < rowKeys.length; i++) {
      var k = rowKeys[i];
      if (!sz[k] && vals[k] > 0) return { why: 'absent', key1: k, mis: MIS.absentEst };
    }
    if (t !== N) return { why: 'total', t: t, mis: MIS.total };
    var on = rowKeys.filter(function (k) {
      return sz[k];
    });
    for (var a = 0; a < on.length; a++) {
      for (var b = 0; b < on.length; b++) {
        if (sz[on[a]] > sz[on[b]] && vals[on[a]] < vals[on[b]]) return { why: 'order', key1: on[a], key2: on[b], mis: MIS.size };
      }
    }
    var allSame = on.every(function (k) {
      return vals[k] === vals[on[0]];
    });
    var sizesDiffer = on.some(function (k) {
      return sz[k] !== sz[on[0]];
    });
    if (allSame && sizesDiffer) return { why: 'same', mis: MIS.size };
    return null;
  }

  /** The "fair share" for each key: each small part gets N / total spins. */
  function fairShare(sp, N) {
    var each = N / sp.total;
    var sz = sizes(sp);
    var o = {};
    Object.keys(sz).forEach(function (k) {
      o[k] = sz[k] * each;
    });
    return o;
  }

  /** Fair-share bar: N little squares, grouped and coloured by section. */
  function fairBar(sp, N, rowKeys, names) {
    var each = N / sp.total;
    var sz = sizes(sp);
    var wrap = el('div', { class: 'spl-fair' });
    var parts = [];
    for (var k = 0; k < sp.total; k++) parts.push(each);
    wrap.appendChild(el('div', { class: 'spl-fair-line', html: sp.total + ' small parts, ' + N + ' spins: ' + parts.join(' + ') + ' = ' + N + ' &nbsp;→&nbsp; <b>' + each + '</b> for each small part' }));
    var row = el('div', { class: 'spl-fair-row' });
    rowKeys.forEach(function (key) {
      if (!sz[key]) return;
      var n = sz[key] * each;
      var g = el('div', { class: 'spl-fair-g' });
      var cells = el('div', { class: 'spl-fair-cells' });
      var fill = (sp.secs.filter(function (s) { return s.key === key; })[0] || {}).fill;
      for (var c = 0; c < n; c++) cells.appendChild(el('span', { class: 'spl-cell', style: { background: fill } }));
      var bits = [];
      for (var u = 0; u < sz[key]; u++) bits.push(each);
      g.appendChild(cells);
      g.appendChild(el('div', { class: 'spl-fair-cap', html: '<b>' + names[key] + '</b>: ' + (bits.length > 1 ? bits.join(' + ') + ' = ' : '') + n }));
      row.appendChild(g);
    });
    wrap.appendChild(row);
    return wrap;
  }

  /* ------------------------------------------------------------------ *
   * Shared practice bits
   * ------------------------------------------------------------------ */
  var WORDS = [
    { label: '✅ will happen', value: 'will' },
    { label: '🤔 might happen', value: 'might' },
    { label: '❌ will not happen', value: 'wont' },
  ];
  var WORD_TEXT = { will: 'will happen', might: 'might happen', wont: 'will not happen' };

  function shapeSp(n) {
    var shapes = ['★', '●', '■', '▲', '◆', '♥'];
    var list = [];
    for (var i = 0; i < n; i++) list.push({ label: shapes[i], units: 1, fill: i === 0 ? '#ffd84d' : '#eef1f6' });
    // rotate so the star is not always at the top
    var r = U.rand(0, n - 1);
    list = list.slice(r).concat(list.slice(0, r));
    return labelled(list);
  }

  /** Spinner for "1 part of colour T out of n": the other parts alternate two other colours. */
  function oneOf(n, target, o1, o2) {
    var keys = [];
    for (var i = 0; i < n - 1; i++) keys.push(i % 2 === 0 ? o1 : o2);
    keys.splice(U.rand(0, n - 1), 0, target);
    return equalColours(keys);
  }

  /** "Count the parts" badges: numbers every section of a key (or all when key is null). */
  function countBadges(view, key, cls) {
    var n = 0;
    view.parts.forEach(function (p, i) {
      if (key == null || p.sec.key === key) view.badge(i, ++n, cls);
    });
    return n;
  }
  function countAll(view) {
    view.parts.forEach(function (p, i) {
      view.badge(i, i + 1, 'spl-badge-all', 0.84);
    });
  }

  /* ------------------------------------------------------------------ *
   * Deck
   * ------------------------------------------------------------------ */
  var ORDER_CFGS = [[4, 3, 1], [5, 2, 1], [3, 2, 2, 1], [6, 1, 1]];
  var EST_CFGS = [
    { N: 20, units: [2, 1, 1] },
    { N: 20, units: [3, 1] },
    { N: 8, tlm: true },
    { N: 8, units: [5, 2, 1] },
    { N: 8, units: [4, 3, 1] },
  ];

  function arrange(list) {
    // random rotation of the order round the circle, keeping the list
    var r = U.rand(0, list.length - 1);
    var out = list.slice(r).concat(list.slice(0, r));
    return Math.random() < 0.5 ? out : out.reverse();
  }

  function buildDeck() {
    var q = [];
    // ---- Level 1 ----
    // 1. list the outcomes (3 or 4 equal parts, a colour may repeat)
    var n = U.pick([3, 4, 4]);
    var k = n === 3 ? U.pick([2, 3]) : U.pick([2, 3, 3]);
    var ks = U.shuffle(COL_KEYS).slice(0, k);
    var parts = ks.slice();
    while (parts.length < n) parts.push(U.pick(ks));
    parts = U.shuffle(parts);
    var spO = equalColours(parts);
    var opts = ks.concat(U.shuffle(COL_KEYS.filter(function (c) { return ks.indexOf(c) === -1; })).slice(0, 5 - k));
    q.push({ type: 'outcomes', sp: spO, options: U.shuffle(opts), answer: keysOf(spO).slice().sort() });

    // 2. a colour that is not on the spinner
    var na = U.pick([2, 3, 4]);
    var ka = U.shuffle(COL_KEYS);
    q.push({ type: 'word', sub: 'absent', sp: equalColours(ka.slice(0, na)), target: [ka[na]], answer: 'wont' });

    // 3. will it land on a colour? (all colours -> will, one of several -> might)
    var kc = U.shuffle(COL_KEYS);
    if (Math.random() < 0.5) {
      var np = U.pick([3, 4]);
      var spP = equalColours(kc.slice(0, np));
      q.push({ type: 'word', sub: 'present', sp: spP, target: [U.pick(kc.slice(0, np))], answer: 'might' });
    } else {
      q.push({ type: 'word', sub: 'all', sp: equalColours([kc[0], kc[1], kc[0], kc[1]]), target: [kc[0], kc[1]], answer: 'will' });
    }

    // 4. make every part the same size: same chance
    var letters = U.pick([['A', 'B', 'C'], ['A', 'B', 'C', 'D']]);
    var uneq = letters.length === 3 ? [4, 2, 2] : [3, 2, 2, 1];
    q.push({
      type: 'equal',
      before: labelled(letters.map(function (L, i) { return { label: L, units: uneq[i] }; })),
      sp: labelled(letters.map(function (L) { return { label: L, units: 1 }; })),
      letters: letters,
      answer: 'same',
    });

    // ---- Level 2 (shuffled) ----
    var l2 = [];
    var cc = U.shuffle(COL_KEYS);
    var tgt = cc[0];
    if (Math.random() < 0.6) {
      var pair = U.pick([[2, 8], [3, 8], [2, 6], [4, 8]]);
      var firstFew = Math.random() < 0.5;
      var nA = firstFew ? pair[0] : pair[1];
      var nB = firstFew ? pair[1] : pair[0];
      l2.push({ type: 'compare', sub: 'oneof', target: tgt, A: oneOf(nA, tgt, cc[1], cc[2]), B: oneOf(nB, tgt, cc[1], cc[2]) });
    } else {
      var big = U.pick([3, 2]);
      var mk = function (m, other) {
        var arr = [];
        for (var i = 0; i < 4; i++) arr.push(i < m ? tgt : other);
        return equalColours(arrange(arr));
      };
      var bigFirst = Math.random() < 0.5;
      l2.push({ type: 'compare', sub: 'quarters', target: tgt, A: bigFirst ? mk(big, cc[1]) : mk(1, cc[2]), B: bigFirst ? mk(1, cc[2]) : mk(big, cc[1]) });
    }
    var coinSpin = [];
    for (var h = 0; h < 8; h++) coinSpin.push({ label: h === 0 ? 'H' : 'T', units: 1, fill: h === 0 ? '#ffd84d' : '#e3e7ee' });
    var hr = U.rand(0, 7);
    coinSpin = coinSpin.slice(hr).concat(coinSpin.slice(0, hr));
    var coinSp = labelled(coinSpin);
    coinSp.secs.forEach(function (s) {
      s.key = s.label;
    });
    l2.push({ type: 'coin', sp: coinSp, coinFirst: Math.random() < 0.5 });
    var bolt3 = Math.random() < 0.5;
    l2.push({ type: 'star', bolt: shapeSp(bolt3 ? 3 : 6), you: shapeSp(bolt3 ? 6 : 3) });
    U.shuffle(l2).forEach(function (x) {
      q.push(x);
    });

    // ---- Level 3 ----
    // 8. Bolt says it WILL land on yellow (yellow is half)
    var others = U.shuffle(['red', 'green', 'blue', 'purple']).slice(0, 3);
    var yl = arrange([{ key: 'yellow', units: 4 }, { key: others[0], units: 2 }, { key: others[1], units: 1 }, { key: others[2], units: 1 }]);
    q.push({ type: 'willyellow', sp: unequalColours(yl), answer: 'might' });

    // 9. order from most to least likely
    var oc = U.pick(ORDER_CFGS);
    var ocol = U.shuffle(COL_KEYS.filter(function (c) { return c !== 'yellow'; })).slice(0, oc.length);
    var spOrd = unequalColours(arrange(oc.map(function (u, i) { return { key: ocol[i], units: u }; })));
    q.push({ type: 'order', sp: spOrd });

    // 10. estimate out of 8 or 20 spins
    var ec = U.pick(EST_CFGS.filter(function (c) { return !c.units || c.units.join() !== oc.join(); }));
    var spE, rowKeys, names = {};
    if (ec.tlm) {
      spE = labelled(arrange([{ label: 'A', units: 3 }, { label: 'B', units: 1 }, { label: 'C', units: 1 }, { label: 'D', units: 1 }, { label: 'E', units: 2 }]));
      rowKeys = ['A', 'B', 'C', 'D', 'E', 'F'];
      rowKeys.forEach(function (L) {
        names[L] = L;
      });
    } else {
      var ecol = U.shuffle(COL_KEYS).slice(0, ec.units.length);
      spE = unequalColours(arrange(ec.units.map(function (u, i) { return { key: ecol[i], units: u }; })));
      rowKeys = ecol.slice();
      rowKeys.forEach(function (c) {
        names[c] = c;
      });
    }
    q.push({ type: 'estimate', sp: spE, N: ec.N, rowKeys: rowKeys, names: names });
    return q;
  }

  /* ------------------------------------------------------------------ *
   * Learn screens
   * ------------------------------------------------------------------ */
  function numberSp(n) {
    var list = [];
    for (var i = 1; i <= n; i++) list.push({ label: String(i), units: 1 });
    return labelled(list);
  }

  function learnOutcomes(stage, api) {
    api.say('A spinner can stop on any of its parts. Click every part to list what each spinner can land on.');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('What can it land on?', 'Click <b>every</b> part of both spinners.'));
    var found = { A: {}, B: {} };
    var lists = {};
    var total = 0;
    var row = el('div', { class: 'spl-row' });
    [['A', 3], ['B', 8]].forEach(function (d) {
      var name = d[0];
      var sp = numberSp(d[1]);
      var list = el('div', { class: 'spl-list' }, el('span', { class: 'spl-list-h' }, 'Can land on:'));
      lists[name] = list;
      var view = spinnerView(sp, {
        size: 250,
        onPart: function (i, w) {
          var lab = sp.secs[i].label;
          if (found[name][lab]) return;
          found[name][lab] = true;
          total++;
          MQ.sound('pop');
          w.classList.add('spl-found');
          view.badge(i, '✓', 'spl-badge-ok', 0.86);
          MQ.clear(list);
          list.appendChild(el('span', { class: 'spl-list-h' }, 'Can land on:'));
          Object.keys(found[name])
            .map(Number)
            .sort(function (a, b) {
              return a - b;
            })
            .forEach(function (x) {
              list.appendChild(el('span', { class: 'chip spl-chip' }, String(x)));
            });
          if (total === 11) {
            api.say('Spinner A can land on 1, 2 or 3. Spinner B can land on 1 to 8. Both can land on 3!', 'cheer');
            api.feedback('All found! A: 1, 2, 3. B: 1, 2, 3, 4, 5, 6, 7, 8.', 'good');
            api.unlockNext();
          } else if (Object.keys(found[name]).length === d[1]) {
            api.feedback('Spinner ' + name + ' is done. Now the other one!', 'info');
          }
        },
      });
      row.appendChild(card(view, 'Spinner ' + name + ' <span class="spl-dim">(' + d[1] + ' equal parts)</span>', null));
      row.lastChild.appendChild(list);
    });
    stage.appendChild(row);
  }

  function learnMoreLikely(stage, api) {
    api.say('Which spinner is more likely to land on 3? Look at how big the 3 part is on each one.', 'think');
    api.lockNext();
    stage.appendChild(MQ.ui.prompt('Which spinner is more likely to land on <b>3</b>?'));
    var spA = numberSp(3), spB = numberSp(8);
    var vA = spinnerView(spA, { needle: true, size: 210 });
    var vB = spinnerView(spB, { needle: true, size: 210 });
    vA.markKey('3', 'spl-hl');
    vB.markKey('3', 'spl-hl');
    var cA = card(vA, 'Spinner A', '<span class="spl-dim">3 is 1 part out of ?</span>');
    var cB = card(vB, 'Spinner B', '<span class="spl-dim">3 is 1 part out of ?</span>');
    var row = el('div', { class: 'spl-row' }, cA, cB);
    stage.appendChild(row);
    var table = el('div', { class: 'spl-table spl-hide' });
    var cells = { A: [], B: [] };
    var done = { A: 0, B: 0 };
    var spinBtns = {};
    var busy = { A: false, B: false };
    ['A', 'B'].forEach(function (name) {
      var r = el('div', { class: 'spl-trow' }, el('span', { class: 'spl-tname' }, name));
      for (var i = 0; i < 5; i++) {
        var c = el('span', { class: 'spl-tcell' }, '');
        cells[name].push(c);
        r.appendChild(c);
      }
      var b = el('button', { class: 'btn spl-spinbtn', type: 'button' }, '🌀 Spin ' + name);
      spinBtns[name] = b;
      b.addEventListener('click', function () {
        if (busy[name] || done[name] >= 5) return;
        busy[name] = true;
        var view = name === 'A' ? vA : vB;
        var res = randomSpin(view.sp);
        view.spinTo(res.deg, 900);
        api.later(function () {
          busy[name] = false;
          var c2 = cells[name][done[name]];
          c2.textContent = res.key;
          if (res.key === '3') c2.classList.add('spl-t3');
          done[name]++;
          MQ.sound('pop');
          if (done[name] >= 5) b.disabled = true;
          if (done.A >= 5 && done.B >= 5) finish();
        }, 950);
      });
      r.appendChild(b);
      table.appendChild(r);
    });
    function count3(name) {
      return cells[name].filter(function (c) {
        return c.textContent === '3';
      }).length;
    }
    function finish() {
      var a = count3('A'), b = count3('B');
      var msg = 'In 5 spins, A landed on 3 ' + a + (a === 1 ? ' time' : ' times') + ' and B ' + b + (b === 1 ? ' time.' : ' times.');
      if (a > b) api.say('A won this time, just as we thought. The bigger slice usually wins.', 'cheer');
      else api.say('Chance can surprise us! A still has the bigger slice for 3, so it usually wins over lots of spins.', 'happy');
      api.feedback(msg + ' Spin results can be different every time.', 'info');
      api.unlockNext();
    }
    var ch = MQ.ui.choices([{ label: 'Spinner A', value: 'A' }, { label: 'Spinner B', value: 'B' }], function (v) {
      if (v === 'A') {
        ch.mark('A', 'good');
        ch.disable();
        MQ.sound('correct');
        cA.querySelector('.spl-card-s').innerHTML = '3 is <b>1 part out of 3</b>: a big slice';
        cB.querySelector('.spl-card-s').innerHTML = '3 is <b>1 part out of 8</b>: a thin slice';
        countAll(vA);
        countAll(vB);
        api.say('Yes! A\'s 3 is a much bigger slice. Now spin each one 5 times.', 'cheer');
        api.feedback('More parts means thinner slices. Spin A and B five times each.', 'good');
        table.classList.remove('spl-hide');
        ch.parentNode && ch.parentNode.removeChild(ch);
      } else {
        ch.mark('B', 'bad');
        api.feedback('B has more numbers, but look at the slice for 3. Count the parts on each spinner. Which slice for 3 is bigger?', 'info');
      }
    }, { columns: 2 });
    stage.appendChild(ch);
    stage.appendChild(table);
  }

  function learnEstimate(stage, api) {
    api.say('This spinner has parts of different sizes. Guess how many times each letter comes up in 20 spins.', 'think');
    api.lockNext();
    stage.appendChild(MQ.ui.lesson('Guess, then spin 20 times', 'Share out <b>20</b> spins. Your guesses must add up to 20.'));
    var sp = labelled([{ label: 'A', units: 3 }, { label: 'B', units: 1 }, { label: 'E', units: 2 }, { label: 'C', units: 1 }, { label: 'D', units: 1 }]);
    var view = spinnerView(sp, { needle: true, size: 240 });
    var rowKeys = ['A', 'B', 'C', 'D', 'E', 'F'];
    var colourOf = {};
    sp.secs.forEach(function (s) {
      colourOf[s.key] = s.fill;
    });
    var est = estimator(
      rowKeys.map(function (k) {
        return { key: k, html: '<span class="spl-sw spl-sw-l" style="background:' + (colourOf[k] || '#fff') + '">' + k + '</span>' };
      }),
      20
    );
    var spinBtn = el('button', { class: 'btn spl-spinbtn', type: 'button' }, '🌀 Spin 20 times');
    var right = el('div', { class: 'spl-col' }, est.el, spinBtn);
    stage.appendChild(el('div', { class: 'spl-row spl-row-top' }, card(view, null, '<span class="spl-dim">F is not on the spinner</span>'), right));
    var running = false;
    spinBtn.addEventListener('click', function () {
      if (running) return;
      if (est.vals.F > 0) {
        api.feedback('F is not on the spinner, so it will not happen. Give F a 0.', 'info');
        return;
      }
      if (est.sum() !== 20) {
        api.feedback('Your guesses add up to ' + est.sum() + '. Make them add up to 20, one for each spin.', 'info');
        return;
      }
      running = true;
      spinBtn.disabled = true;
      est.disable();
      var got = {};
      rowKeys.forEach(function (k) {
        got[k] = 0;
        MQ.clear(est.res(k));
      });
      var n = 0;
      api.feedback('Spinning…', 'info');
      (function one() {
        var r = randomSpin(sp);
        view.spinTo(r.deg, 260, 1);
        api.later(function () {
          got[r.key]++;
          n++;
          var box = est.res(r.key);
          MQ.clear(box);
          box.appendChild(tallySvg(got[r.key]));
          box.appendChild(el('span', { class: 'spl-got' }, String(got[r.key])));
          if (n < 20) one();
          else done(got);
        }, 300);
      })();
    });
    function done(got) {
      rowKeys.forEach(function (k) {
        var box = est.res(k);
        MQ.clear(box);
        box.appendChild(
          el(
            'div',
            { class: 'spl-bars' },
            el('div', { class: 'spl-bar spl-bar-g', style: { width: est.vals[k] * 6 + 'px' } }),
            el('span', { class: 'spl-bar-n' }, 'guess ' + est.vals[k]),
            el('div', { class: 'spl-bar spl-bar-r', style: { width: got[k] * 6 + 'px', background: colourOf[k] || '#ccc' } }),
            el('span', { class: 'spl-bar-n' }, 'spun ' + got[k])
          )
        );
      });
      var top = rowKeys.reduce(function (a, k) {
        return got[k] > got[a] ? k : a;
      }, 'A');
      api.say(top === 'A' ? 'A, the biggest part, came up most. F never came up: it is not there!' : 'This time ' + top + ' came up most. Chance can surprise us, but over many spins the biggest part usually wins.', 'cheer');
      api.feedback('Results are never exactly the same as the guess, and that is OK. Press Spin again to try another 20.', 'good');
      api.unlockNext();
      running = false;
      spinBtn.disabled = false;
      spinBtn.textContent = '🌀 Spin 20 again';
    }
  }

  /* ------------------------------------------------------------------ *
   * Practice renderers
   * ------------------------------------------------------------------ */
  function renderOutcomes(stage, api, q) {
    api.say('Which colours can this spinner land on? Pick them all.', 'think');
    stage.appendChild(MQ.ui.prompt('Pick <b>every</b> colour this spinner can land on.'));
    var view = spinnerView(q.sp, { needle: true, size: 220 });
    stage.appendChild(card(view, null, '<span class="spl-dim">' + q.sp.total + ' equal parts</span>'));
    var picked = {};
    var chips = el('div', { class: 'spl-chips' });
    var btns = {};
    q.options.forEach(function (c) {
      var b = el('button', { class: 'choice spl-pick', type: 'button', html: sw(c) });
      btns[c] = b;
      b.addEventListener('click', function () {
        if (api.isAnswered()) return;
        picked[c] = !picked[c];
        b.classList.toggle('spl-on', !!picked[c]);
        MQ.sound('click');
      });
      chips.appendChild(b);
    });
    stage.appendChild(chips);
    var check = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    stage.appendChild(check);
    var on = keysOf(q.sp);
    check.addEventListener('click', function () {
      if (api.isAnswered()) return;
      var sel = q.options.filter(function (c) {
        return picked[c];
      });
      if (!sel.length) {
        api.feedback('Click the colours you can see on the spinner, then press Check.', 'info');
        return;
      }
      var extra = sel.filter(function (c) {
        return on.indexOf(c) === -1;
      });
      var miss = on.filter(function (c) {
        return !picked[c];
      });
      if (!extra.length && !miss.length) {
        check.disabled = true;
        on.forEach(function (c) {
          btns[c].classList.add('good');
        });
        api.check(true, 'Yes! It can land on ' + listWords(on) + '.');
        return;
      }
      if (extra.length) {
        api.check(false, 'Is there any ' + extra[0] + ' on the spinner? Look again.', MIS.extra);
      } else {
        api.check(false, api.tries() >= 1 ? 'Go round the spinner part by part and say each colour. One is missing.' : 'Look all the way round. Is there a colour you have not picked?', MIS.missing);
      }
    });
    api.onReveal(function () {
      check.disabled = true;
      q.options.forEach(function (c) {
        btns[c].classList.remove('spl-on');
        if (on.indexOf(c) !== -1) btns[c].classList.add('good');
      });
      countAll(view);
      var round = q.sp.secs.map(function (s) {
        return s.key;
      });
      api.feedback('Going round: ' + round.join(', ') + '. So it can land on ' + listWords(on) + '.', 'info');
    });
  }

  function renderWord(stage, api, q) {
    var t = q.target;
    var txt = q.sub === 'all' ? t[0] + ' or ' + t[1] : t[0];
    api.say('Will the arrow land on ' + txt + '?', 'think');
    stage.appendChild(MQ.ui.prompt('Spin once. Will it land on <b>' + txt + '</b>?'));
    var view = spinnerView(q.sp, { needle: true, size: 220 });
    stage.appendChild(card(view, null, null));
    var ch = MQ.ui.choices(WORDS, function (v) {
      if (v === q.answer) {
        ch.mark(v, 'good');
        ch.disable();
        api.check(true, q.answer === 'wont' ? 'Yes! There is no ' + t[0] + ', so it will not happen.' : q.answer === 'will' ? 'Yes! Every part is ' + txt + ', so it will happen.' : 'Yes! It could land on ' + t[0] + ', or on another colour.');
        return;
      }
      ch.mark(v, 'bad');
      var second = api.tries() >= 1;
      if (q.answer === 'wont') {
        api.check(false, second ? 'Point to every part. Not one part is ' + t[0] + '. Can the arrow stop on a colour that is not there?' : 'Can you see any ' + t[0] + ' on the spinner?', MIS.absentMight);
      } else if (q.answer === 'will') {
        api.check(false, second ? 'Every part is ' + t[0] + ' or ' + t[1] + '. Wherever the arrow stops, it is one of them!' : 'Look at every part. Is there any colour that is not ' + t[0] + ' or ' + t[1] + '?', MIS.allWill);
      } else if (v === 'will') {
        api.check(false, second ? 'There are other colours too. The arrow could stop on one of them.' : 'Could the arrow stop on a different colour?', MIS.mightAsWill);
      } else {
        api.check(false, 'There is a ' + t[0] + ' part on the spinner. Could the arrow stop there?', MIS.onAsWont);
      }
    }, { columns: 3 });
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(q.answer, 'good');
      ch.disable();
      if (q.answer === 'wont') {
        countAll(view);
        api.feedback('The parts are ' + listWords(keysOf(q.sp)) + '. No ' + t[0] + ', so it will not happen.', 'info');
      } else if (q.answer === 'will') {
        countAll(view);
        api.feedback('All 4 parts are ' + t[0] + ' or ' + t[1] + ', so it will happen.', 'info');
      } else {
        view.markKey(t[0], 'spl-hl');
        api.feedback(cap(t[0]) + ' is 1 part. The arrow could stop on it, or on another part. So it might happen.', 'info');
      }
    });
  }

  function renderEqual(stage, api, q) {
    api.say('Bolt makes every part the same size. Which letter is most likely now?', 'think');
    stage.appendChild(MQ.ui.prompt('Now every part is the <b>same size</b>. Which is the arrow most likely to land on?'));
    var before = spinnerView(q.before, { size: 150 });
    var after = spinnerView(q.sp, { needle: true, size: 220 });
    stage.appendChild(el('div', { class: 'spl-row' }, card(before, '<span class="spl-dim">Before</span>', null), el('div', { class: 'spl-arrow' }, '➜'), card(after, 'Now', null)));
    var opts = q.letters.map(function (L) {
      return { label: L, value: L };
    });
    opts.push({ label: 'All the same chance', value: 'same' });
    var ch = MQ.ui.choices(opts, function (v) {
      if (v === 'same') {
        ch.mark(v, 'good');
        ch.disable();
        api.check(true, 'Yes! Same size parts, same chance.');
        return;
      }
      ch.mark(v, 'bad');
      api.check(false, api.tries() >= 1 ? 'Look at the new spinner only. Every part is the same size, so is any letter a better bet?' : 'Look at the new spinner. Is any part bigger than the others?', MIS.equal);
    }, { columns: q.letters.length + 1 });
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark('same', 'good');
      ch.disable();
      countAll(after);
      api.feedback('The new spinner has ' + q.letters.length + ' parts, all the same size. Each letter has one part, so they all have the same chance.', 'info');
    });
  }

  function sliceRow(items) {
    // items: [{sp, key, cap}]
    var row = el('div', { class: 'spl-row spl-slices' });
    items.forEach(function (it) {
      row.appendChild(card(spinnerView(it.sp, { only: it.key, size: 120 }), null, it.cap));
    });
    return row;
  }

  function renderCompare(stage, api, q) {
    var sz = { A: sizes(q.A)[q.target], B: sizes(q.B)[q.target] };
    var best = sz.A / q.A.total > sz.B / q.B.total ? 'A' : 'B';
    api.say('Which spinner is more likely to land on ' + q.target + '? Click the parts to count them.', 'think');
    stage.appendChild(MQ.ui.prompt('Which spinner is <b>more likely</b> to land on ' + sw(q.target) + '?'));
    var views = {};
    var row = el('div', { class: 'spl-row' });
    ['A', 'B'].forEach(function (s) {
      var counted = 0;
      var done = {};
      var v = spinnerView(q[s], {
        needle: true,
        size: 210,
        onPart: function (i) {
          if (done[i] || api.isAnswered()) return;
          done[i] = true;
          v.badge(i, ++counted, 'spl-badge-all', 0.84);
          MQ.sound('pop');
        },
      });
      views[s] = v;
      row.appendChild(card(v, 'Spinner ' + s, null));
    });
    stage.appendChild(row);
    var ch = MQ.ui.choices([{ label: 'Spinner A', value: 'A' }, { label: 'Spinner B', value: 'B' }], function (v) {
      if (v === best) {
        ch.mark(v, 'good');
        ch.disable();
        api.check(true, 'Yes! ' + cap(q.target) + ' is a bigger slice of spinner ' + best + '.');
        return;
      }
      ch.mark(v, 'bad');
      var second = api.tries() >= 1;
      if (q.sub === 'oneof') {
        api.check(false, second ? 'Spinner ' + v + ' has more parts, so each part is a thinner slice. Which ' + q.target + ' slice is bigger?' : 'Count the parts on each spinner. ' + cap(q.target) + ' is 1 part out of how many?', MIS.moreParts);
      } else {
        api.check(false, second ? 'Both spinners have 4 parts. Which one has more ' + q.target + ' parts?' : 'Count the ' + q.target + ' parts on each spinner.', MIS.size);
      }
    }, { columns: 2 });
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(best, 'good');
      ch.disable();
      ['A', 'B'].forEach(function (s) {
        views[s].clearBadges();
        countAll(views[s]);
        views[s].markKey(q.target, 'spl-hl');
      });
      var capOf = function (s) {
        return '<b>' + sz[s] + '</b> of <b>' + q[s].total + '</b> parts';
      };
      stage.appendChild(sliceRow([{ sp: q.A, key: q.target, cap: 'A: ' + capOf('A') }, { sp: q.B, key: q.target, cap: 'B: ' + capOf('B') }]));
      api.feedback('Spinner A: ' + q.target + ' is ' + sz.A + ' of ' + q.A.total + ' parts. Spinner B: ' + sz.B + ' of ' + q.B.total + ' parts. The bigger ' + q.target + ' slice is on spinner ' + best + '.', 'info');
    });
  }

  function renderCoin(stage, api, q) {
    api.say('Which gives heads more often: the coin, or the spinner with one H part?', 'think');
    stage.appendChild(MQ.ui.prompt('Which is <b>more likely</b> to give <b>H</b> (heads)?'));
    var counted = 0;
    var done = {};
    var v = spinnerView(q.sp, {
      needle: true,
      size: 210,
      onPart: function (i) {
        if (done[i] || api.isAnswered()) return;
        done[i] = true;
        v.badge(i, ++counted, 'spl-badge-all', 0.84);
        MQ.sound('pop');
      },
    });
    var coinCard = card({ svg: coinSvg() }, 'The coin', '<span class="spl-dim">2 sides: H and T</span>');
    coinCard.querySelector('svg').style.maxWidth = '170px';
    var spinCard = card(v, 'The spinner', '<span class="spl-dim">H on 1 part</span>');
    stage.appendChild(q.coinFirst ? el('div', { class: 'spl-row' }, coinCard, spinCard) : el('div', { class: 'spl-row' }, spinCard, coinCard));
    var opts = [{ label: '🪙 The coin', value: 'coin' }, { label: '🎡 The spinner', value: 'spinner' }];
    if (!q.coinFirst) opts.reverse();
    var ch = MQ.ui.choices(opts, function (val) {
      if (val === 'coin') {
        ch.mark(val, 'good');
        ch.disable();
        api.check(true, 'Yes! H is 1 side out of 2 on the coin, but only 1 part out of 8 on the spinner.');
        return;
      }
      ch.mark(val, 'bad');
      api.check(false, api.tries() >= 1 ? 'A coin is like a spinner with just 2 parts: H and T. Which H slice is bigger: 1 of 2, or 1 of 8?' : 'Count the parts on the spinner. How many are H? How many are T?', MIS.moreParts);
    }, { columns: 2 });
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark('coin', 'good');
      ch.disable();
      v.clearBadges();
      countAll(v);
      v.markKey('H', 'spl-hl');
      var coinAsSpin = labelled([{ label: 'H', units: 1, fill: '#ffd84d' }, { label: 'T', units: 1, fill: '#e3e7ee' }]);
      stage.appendChild(sliceRow([{ sp: coinAsSpin, key: 'H', cap: 'Coin: H is <b>1 of 2</b>' }, { sp: q.sp, key: 'H', cap: 'Spinner: H is <b>1 of 8</b>' }]));
      api.feedback('A coin is like a spinner with 2 parts. H is 1 of 2 on the coin (half!), but only 1 of 8 on the spinner. The coin gives heads more often.', 'info');
    });
  }

  function renderStar(stage, api, q) {
    var boltRight = q.bolt.total < q.you.total;
    api.say('I think I will get the star more often than you in 10 spins. Do you agree?', 'think');
    stage.appendChild(MQ.ui.prompt('Bolt says: “I will get the ★ more often than you.” Do you <b>agree</b>?'));
    var views = {};
    var row = el('div', { class: 'spl-row' });
    [['bolt', "Bolt's spinner"], ['you', 'Your spinner']].forEach(function (d) {
      var counted = 0;
      var done = {};
      var v = spinnerView(q[d[0]], {
        needle: true,
        size: 200,
        onPart: function (i) {
          if (done[i] || api.isAnswered()) return;
          done[i] = true;
          v.badge(i, ++counted, 'spl-badge-all', 0.86);
          MQ.sound('pop');
        },
      });
      views[d[0]] = v;
      row.appendChild(card(v, d[1], null));
    });
    stage.appendChild(row);
    var ans = boltRight ? 'agree' : 'disagree';
    var ch = MQ.ui.choices([{ label: '👍 Agree', value: 'agree' }, { label: '👎 Disagree', value: 'disagree' }], function (v) {
      if (v === ans) {
        ch.mark(v, 'good');
        ch.disable();
        api.check(true, boltRight ? 'Yes! Bolt\'s star is a bigger slice, so he will probably get it more often.' : 'Yes! Your star is the bigger slice, so you will probably get it more often.');
        return;
      }
      ch.mark(v, 'bad');
      api.check(false, api.tries() >= 1 ? 'More parts means thinner slices. Whose star slice is bigger, Bolt\'s or yours?' : 'Count the parts on each spinner. The star is 1 part out of how many?', MIS.moreParts);
    }, { columns: 2 });
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark(ans, 'good');
      ch.disable();
      views.bolt.clearBadges();
      views.you.clearBadges();
      countAll(views.bolt);
      countAll(views.you);
      stage.appendChild(sliceRow([{ sp: q.bolt, key: '★', cap: 'Bolt: <b>1 of ' + q.bolt.total + '</b>' }, { sp: q.you, key: '★', cap: 'You: <b>1 of ' + q.you.total + '</b>' }]));
      api.feedback('Bolt\'s star is 1 of ' + q.bolt.total + ' parts; yours is 1 of ' + q.you.total + '. The bigger star slice is ' + (boltRight ? 'Bolt\'s, so agree' : 'yours, so disagree') + '. (It is still only likely, not certain.)', 'info');
    });
  }

  function renderWillYellow(stage, api, q) {
    api.say('This spinner WILL land on yellow! Am I right?', 'think');
    stage.appendChild(MQ.ui.prompt('Bolt says: “This spinner <b>will</b> land on yellow.” What is true?'));
    var view = spinnerView(q.sp, { needle: true, size: 230 });
    stage.appendChild(card(view, null, null));
    var opts = [
      { label: 'It <b>will</b> land on yellow', value: 'will' },
      { label: 'It <b>might</b> land on yellow', value: 'might' },
      { label: 'It <b>will not</b> land on yellow', value: 'wont' },
    ];
    var ch = MQ.ui.choices(opts, function (v) {
      if (v === 'might') {
        ch.mark(v, 'good');
        ch.disable();
        api.check(true, 'Yes! Yellow is the biggest part, but the arrow could still stop on another colour.');
        return;
      }
      ch.mark(v, 'bad');
      if (v === 'will') api.check(false, api.tries() >= 1 ? 'Point to the parts that are not yellow. Could the arrow stop on one of them?' : 'Yellow is the biggest part. But is every part yellow?', MIS.certain);
      else api.check(false, 'There is a big yellow part. Can the arrow stop on it?', MIS.onAsWont);
    }, { columns: 3 });
    stage.appendChild(ch);
    api.onReveal(function () {
      ch.mark('might', 'good');
      ch.disable();
      view.parts.forEach(function (p, i) {
        if (p.sec.key !== 'yellow') view.badge(i, '!', 'spl-badge-warn');
      });
      view.markKey('yellow', 'spl-hl');
      var not = keysOf(q.sp).filter(function (k) {
        return k !== 'yellow';
      });
      api.feedback('Yellow is half of the spinner, so it is likely. But the arrow could stop on ' + listOr(not) + ' (the ! parts). So it only MIGHT land on yellow. Bolt is wrong.', 'info');
    });
  }

  function renderOrder(stage, api, q) {
    var sz = sizes(q.sp);
    var keys = keysOf(q.sp);
    api.say('Put the colours in order, from most likely to least likely.', 'think');
    stage.appendChild(MQ.ui.prompt('Click the colours in order: <b>most likely</b> first, <b>least likely</b> last.'));
    var view = spinnerView(q.sp, { needle: true, size: 220 });
    var slots = el('div', { class: 'spl-slots' });
    var chips = el('div', { class: 'spl-chips' });
    var seq = [];
    var chipBtns = {};
    function draw() {
      MQ.clear(slots);
      for (var i = 0; i < keys.length; i++) {
        var lab = i === 0 ? 'most' : i === keys.length - 1 ? 'least' : '';
        var c = seq[i];
        var s = el('button', { class: 'spl-slot' + (c ? ' spl-slot-on' : ''), type: 'button', html: '<span class="spl-slot-n">' + (i + 1) + (lab ? ' · ' + lab : '') + '</span>' + (c ? sw(c) : '?') });
        (function (idx) {
          s.addEventListener('click', function () {
            if (api.isAnswered() || !seq[idx]) return;
            var k = seq.splice(idx, 1)[0];
            chipBtns[k].disabled = false;
            MQ.sound('click');
            draw();
          });
        })(i);
        slots.appendChild(s);
      }
    }
    U.shuffle(keys.slice()).forEach(function (k) {
      var b = el('button', { class: 'choice spl-pick', type: 'button', html: sw(k) });
      chipBtns[k] = b;
      b.addEventListener('click', function () {
        if (api.isAnswered() || seq.length >= keys.length) return;
        seq.push(k);
        b.disabled = true;
        draw();
      });
      chips.appendChild(b);
    });
    draw();
    var check = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    stage.appendChild(el('div', { class: 'spl-row spl-row-top' }, card(view, null, null), el('div', { class: 'spl-col' }, chips, slots, check)));
    check.addEventListener('click', function () {
      if (api.isAnswered()) return;
      if (seq.length < keys.length) {
        api.feedback('Put all ' + keys.length + ' colours in the boxes first. (Click a box to take a colour out.)', 'info');
        return;
      }
      for (var i = 0; i + 1 < seq.length; i++) {
        if (sz[seq[i]] < sz[seq[i + 1]]) {
          if (api.tries() >= 1) view.guides();
          api.check(false, api.tries() >= 1 ? 'Count the small parts (dashed lines) in each colour. ' + cap(seq[i + 1]) + ' covers more than ' + seq[i] + '.' : cap(seq[i + 1]) + ' is a bigger slice than ' + seq[i] + '. Which should come first?', MIS.size);
          return;
        }
      }
      check.disabled = true;
      api.check(true, keys.length > 3 || hasTie() ? 'Yes! Bigger slice, more likely. Same-size slices have the same chance.' : 'Yes! Bigger slice, more likely.');
    });
    function hasTie() {
      return keys.some(function (a) {
        return keys.some(function (b) {
          return a !== b && sz[a] === sz[b];
        });
      });
    }
    api.onReveal(function () {
      check.disabled = true;
      seq = keys.slice().sort(function (a, b) {
        return sz[b] - sz[a];
      });
      keys.forEach(function (k) {
        chipBtns[k].disabled = true;
      });
      draw();
      view.guides();
      view.parts.forEach(function (p, i) {
        view.badge(i, p.sec.units, 'spl-badge-all');
      });
      api.feedback('The dashed lines cut it into ' + q.sp.total + ' small equal parts. ' + seq.map(function (k) { return cap(k) + ' covers ' + sz[k]; }).join(', ') + '. More small parts = more likely.', 'info');
    });
  }

  function renderEstimate(stage, api, q) {
    var sz = sizes(q.sp);
    var N = q.N;
    var colourOf = {};
    q.sp.secs.forEach(function (s) {
      colourOf[s.key] = s.fill;
    });
    var isLetters = q.rowKeys[0] === 'A';
    api.say('Guess how many times each one comes up in ' + N + ' spins. Your guesses must add up to ' + N + '.', 'think');
    stage.appendChild(MQ.ui.prompt('In <b>' + N + ' spins</b>, about how many times will each come up?'));
    var view = spinnerView(q.sp, { needle: true, size: 220 });
    var est = estimator(
      q.rowKeys.map(function (k) {
        return { key: k, html: isLetters ? '<span class="spl-sw spl-sw-l" style="background:' + (colourOf[k] || '#fff') + '">' + k + '</span>' : sw(k) };
      }),
      N
    );
    var check = el('button', { class: 'btn btn-check', type: 'button' }, 'Check');
    var sub = isLetters ? '<span class="spl-dim">F is not on the spinner</span>' : null;
    stage.appendChild(el('div', { class: 'spl-row spl-row-top' }, card(view, null, sub), el('div', { class: 'spl-col' }, est.el, check)));
    check.addEventListener('click', function () {
      if (api.isAnswered()) return;
      if (est.sum() === 0) {
        api.feedback('Use the + buttons to share out the ' + N + ' spins.', 'info');
        return;
      }
      var pr = estimateProblem(sz, q.rowKeys, est.vals, N);
      if (!pr) {
        check.disabled = true;
        est.disable();
        api.check(true, 'Great guesses! They add up to ' + N + ', and bigger parts got more spins.');
        return;
      }
      var second = api.tries() >= 1;
      var nm = q.names;
      if (pr.why === 'absent') api.check(false, nm[pr.key1] + ' is not on the spinner, so it will not happen. Give it 0.', pr.mis);
      else if (pr.why === 'total') api.check(false, 'Your guesses add up to ' + pr.t + '. They must add up to ' + N + ', one for each spin.' + (second ? ' Use − or + to fix it.' : ''), pr.mis);
      else if (pr.why === 'order') {
        if (second) view.guides();
        api.check(false, cap(nm[pr.key1]) + ' is a bigger slice than ' + nm[pr.key2] + ', so it should get at least as many spins.' + (second ? ' Count the small parts between the dashed lines.' : ''), pr.mis);
      } else api.check(false, 'The parts are not all the same size. Should the big part get the same as a small part?', pr.mis);
    });
    api.onReveal(function () {
      check.disabled = true;
      var fs = fairShare(q.sp, N);
      est.set(fs);
      est.disable();
      view.guides();
      view.parts.forEach(function (p, i) {
        view.badge(i, fs[p.sec.key], 'spl-badge-all');
      });
      stage.appendChild(fairBar(q.sp, N, q.rowKeys, q.names));
      var big = keysOf(q.sp).sort(function (a, b) {
        return sz[b] - sz[a];
      })[0];
      var msg = 'Cut the spinner into ' + q.sp.total + ' small equal parts. ' + N + ' spins shared out: ' + N / q.sp.total + ' for each small part. ' + cap(q.names[big]) + ' covers ' + sz[big] + ' small parts, so about ' + fs[big] + '.';
      if (isLetters) msg += ' F is not there: 0.';
      api.feedback(msg + ' Any guesses that add to ' + N + ' with bigger parts getting more are fine.', 'info');
    });
  }

  /* ------------------------------------------------------------------ *
   * Register
   * ------------------------------------------------------------------ */
  var deck = null;
  var def = {
    learn: [learnOutcomes, learnMoreLikely, learnEstimate],
    practice: {
      count: 10,
      render: function (stage, api) {
        if (!deck || api.index === 0) deck = buildDeck();
        var q = deck[api.index];
        var fn = {
          outcomes: renderOutcomes,
          word: renderWord,
          equal: renderEqual,
          compare: renderCompare,
          coin: renderCoin,
          star: renderStar,
          willyellow: renderWillYellow,
          order: renderOrder,
          estimate: renderEstimate,
        }[q.type];
        fn(stage, api, q);
      },
    },
  };
  // Hooks for offline deck tests (not used by the site).
  def._test = { buildDeck: buildDeck, sizes: sizes, layout: layout, sectionAt: sectionAt, estimateProblem: estimateProblem, fairShare: fairShare, randomSpin: randomSpin };
  MQ.register(ID, def);

  var css = [
    '.spl-row{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:18px;width:100%;max-width:900px}',
    '.spl-row-top{align-items:flex-start}',
    '.spl-col{display:flex;flex-direction:column;align-items:center;gap:10px}',
    '.spl-card{display:flex;flex-direction:column;align-items:center;gap:4px;background:#fff;border:2px solid var(--line);border-radius:16px;padding:8px 12px}',
    '.spl-card-t{font-weight:800;font-size:1.1rem}',
    '.spl-card-s{font-size:1rem;text-align:center}',
    '.spl-dim{color:var(--ink-soft);font-weight:700}',
    '.spl-spin{width:100%;height:auto;display:block;max-width:240px}',
    '.spl-wedge{stroke:#1b2a4a;stroke-width:2.5;stroke-linejoin:round;transition:opacity .2s}',
    '.spl-click{cursor:pointer}',
    '.spl-click:hover{opacity:.8}',
    '.spl-found{stroke-width:4}',
    '.spl-hl{stroke:#0b6e66;stroke-width:5}',
    '.spl-rim{fill:none;stroke:#1b2a4a;stroke-width:3}',
    '.spl-ghost{fill:#f4f6fa;stroke:#c7cedb;stroke-width:2;stroke-dasharray:5 4}',
    '.spl-guides line,.spl-guide{stroke:#1b2a4a;stroke-width:1.5;stroke-dasharray:4 4;opacity:.65}',
    '.spl-lab{font-size:26px;font-weight:800;fill:#1b2a4a;pointer-events:none}',
    '.spl-lab-s{font-size:20px}',
    '.spl-badge{fill:#fff;stroke:#1b2a4a;stroke-width:2}',
    '.spl-badge-ok{fill:#d8f5df;stroke:#1f8a4c}',
    '.spl-badge-warn{fill:#fff3cd;stroke:#c26a00}',
    '.spl-badge-t{font-size:16px;font-weight:800;fill:#1b2a4a;pointer-events:none}',
    '.spl-badges{pointer-events:none}',
    '.spl-needle{pointer-events:none}',
    '.spl-needle-l{stroke:#1b2a4a;stroke-width:6;stroke-linecap:round}',
    '.spl-needle-h{fill:#1b2a4a}',
    '.spl-hub{fill:#fff;stroke:#1b2a4a;stroke-width:3;pointer-events:none}',
    '.spl-coin{fill:#f2c94c;stroke:#a87b00;stroke-width:5}',
    '.spl-coin-in{fill:none;stroke:#a87b00;stroke-width:3;stroke-dasharray:3 5}',
    '.spl-coin-t{font-size:70px;font-weight:900;fill:#6b4f00}',
    '.spl-sw{display:inline-block;width:20px;height:20px;border-radius:50%;border:2px solid #1b2a4a;vertical-align:-3px;margin-right:6px}',
    '.spl-sw-l{width:30px;height:30px;line-height:26px;text-align:center;font-weight:900;margin:0;vertical-align:middle}',
    '.spl-list{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;align-items:center;max-width:300px;min-height:38px}',
    '.spl-list-h{font-weight:800;color:var(--ink-soft);margin-right:4px}',
    '.spl-chip{padding:3px 10px;font-weight:800}',
    '.spl-chips{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;max-width:640px}',
    '.spl-pick{min-height:52px;font-size:1.1rem;padding:6px 14px}',
    '.spl-pick.spl-on{border-color:var(--accent);background:var(--info-bg);box-shadow:0 0 0 3px var(--accent) inset}',
    '.spl-pick:disabled{opacity:.35}',
    '.spl-slots{display:flex;flex-direction:column;gap:6px;width:100%;max-width:300px}',
    '.spl-slot{display:flex;align-items:center;gap:10px;min-height:46px;padding:4px 12px;border:3px dashed var(--line);border-radius:12px;background:#fff;font-size:1.1rem;font-weight:800;color:var(--ink);cursor:pointer;font-family:inherit}',
    '.spl-slot-on{border-style:solid}',
    '.spl-slot-n{font-size:.85rem;color:var(--ink-soft);min-width:64px;text-align:left}',
    '.spl-arrow{font-size:2rem;color:var(--ink-soft)}',
    '.spl-hide{display:none !important}',
    '.spl-table{display:flex;flex-direction:column;gap:8px;align-items:center}',
    '.spl-trow{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:center}',
    '.spl-tname{font-weight:900;font-size:1.2rem;width:26px;text-align:center}',
    '.spl-tcell{width:42px;height:42px;border:2px solid var(--line);border-radius:10px;background:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:1.25rem}',
    '.spl-t3{background:#d8f5df;border-color:#1f8a4c}',
    '.spl-spinbtn{margin-left:8px}',
    '.spl-est{display:flex;flex-direction:column;gap:6px;background:#fff;border:2px solid var(--line);border-radius:16px;padding:10px 12px}',
    '.spl-est-row{display:flex;align-items:center;gap:8px;min-height:40px}',
    '.spl-est-k{min-width:96px;font-weight:800;font-size:1.1rem}',
    '.spl-pm{width:40px;height:40px;border-radius:10px;border:2px solid var(--line);background:var(--paper-2);font-size:1.4rem;font-weight:900;cursor:pointer;color:var(--ink);font-family:inherit}',
    '.spl-pm:disabled{opacity:.4;cursor:default}',
    '.spl-est-v{min-width:32px;text-align:center;font-size:1.4rem;font-weight:900}',
    '.spl-est-res{display:flex;align-items:center;gap:6px;min-width:150px}',
    '.spl-est-total{font-size:1.15rem;font-weight:800;text-align:center;padding:4px;border-radius:10px;background:var(--paper-2)}',
    '.spl-est-total.spl-ok{background:var(--good-bg);color:var(--good)}',
    '.spl-est-total.spl-over{background:var(--try-bg);color:var(--try)}',
    '.spl-tally line{stroke:#1b2a4a;stroke-width:2.5;stroke-linecap:round}',
    '.spl-got{font-weight:900}',
    '.spl-bars{display:grid;grid-template-columns:auto auto;align-items:center;gap:2px 6px}',
    '.spl-bar{height:12px;border-radius:4px;min-width:2px}',
    '.spl-bar-g{border:2px dashed #5b6478;height:10px;background:transparent}',
    '.spl-bar-r{border:1.5px solid #1b2a4a}',
    '.spl-bar-n{font-size:.8rem;font-weight:700;color:var(--ink-soft)}',
    '.spl-slices .spl-card{padding:6px 10px}',
    '.spl-fair{display:flex;flex-direction:column;align-items:center;gap:6px;background:var(--info-bg);border-radius:14px;padding:8px 12px;max-width:860px}',
    '.spl-fair-line{font-weight:700;text-align:center}',
    '.spl-fair-row{display:flex;flex-wrap:wrap;gap:14px;justify-content:center}',
    '.spl-fair-g{display:flex;flex-direction:column;align-items:center;gap:3px}',
    '.spl-fair-cells{display:flex;flex-wrap:wrap;gap:2px;max-width:240px;justify-content:center}',
    '.spl-cell{width:16px;height:16px;border:1.5px solid #1b2a4a;border-radius:3px;display:inline-block}',
    '.spl-fair-cap{font-weight:700}',
    '@media (max-width:820px){.spl-est-k{min-width:70px}.spl-est-res{min-width:90px}}',
  ].join('\n');
  document.head.appendChild(el('style', { 'data-activity': ID }, css));
})();

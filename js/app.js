/* Interactive Maths — app shell: lesson map, activity player, parent corner. */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var cur = MQ.curriculum;
  var root = document.getElementById('app');
  var running = null;
  var screen = ''; // which screen is showing: home | unit | play | who | gate | parent | add-child | privacy
  var topbarEl = null;
  var topbarCrumb = null;
  var currentUnit = 0; // the unit page showing, for re-rendering it in place

  /* ---------------- helpers ---------------- */
  function allIds() {
    var ids = [];
    cur.units.forEach(function (u) {
      u.sections.forEach(function (s) {
        ids = ids.concat(s.activities);
      });
    });
    return ids;
  }
  function sectionOf(id) {
    var found = null;
    cur.units.forEach(function (u) {
      u.sections.forEach(function (s) {
        if (s.activities.indexOf(id) !== -1) found = { unit: u, section: s };
      });
    });
    return found;
  }
  function meta(id) {
    return cur.activities[id] || { title: id, icon: '⭐', summary: '', tips: {} };
  }
  function starsOf(id) {
    var p = MQ.store.load().activities[id];
    return p ? p.stars || 0 : 0;
  }
  function unitIds(u) {
    var ids = [];
    u.sections.forEach(function (s) {
      ids = ids.concat(s.activities);
    });
    return ids;
  }
  function unitByNumber(n) {
    return cur.units.filter(function (u) {
      return u.number === n;
    })[0];
  }
  function unitStars(u) {
    var ids = unitIds(u);
    return {
      got: ids.reduce(function (sum, id) {
        return sum + starsOf(id);
      }, 0),
      max: ids.length * 3,
      ready: ids.filter(function (id) {
        return MQ.activities[id];
      }).length,
      total: ids.length,
    };
  }
  /** Next activity: carry on after the last one played, otherwise the first without stars. */
  function nextRecommended() {
    var prog = MQ.store.load().activities;
    var ready = allIds().filter(function (id) {
      return MQ.activities[id];
    });
    if (!ready.length) return null;
    var last = null;
    var lastT = '';
    Object.keys(prog).forEach(function (id) {
      if (prog[id].lastPlayed && prog[id].lastPlayed > lastT && ready.indexOf(id) !== -1) {
        lastT = prog[id].lastPlayed;
        last = id;
      }
    });
    var start = last ? ready.indexOf(last) + 1 : 0;
    for (var i = 0; i < ready.length; i++) {
      var id = ready[(start + i) % ready.length];
      if (starsOf(id) === 0) return id;
    }
    var lowest = null;
    ready.forEach(function (rid) {
      if (starsOf(rid) < 3 && (lowest === null || starsOf(rid) < starsOf(lowest))) lowest = rid;
    });
    return lowest || ready[0];
  }
  function progressBar(got, max) {
    return el('div', { class: 'unit-progress' }, el('div', { class: 'bar' }, el('span', { style: { width: (max ? Math.round((got / max) * 100) : 0) + '%' } })), el('span', { class: 'bar-label' }, '★ ' + got + ' / ' + max));
  }
  function starRow(n, max) {
    max = max || 3;
    var s = el('span', { class: 'stars', 'aria-label': n + ' of ' + max + ' stars' });
    for (var i = 0; i < max; i++) s.appendChild(el('span', { class: i < n ? 'star on' : 'star' }, '★'));
    return s;
  }
  /* ---------------- top bar ---------------- */
  /** Rebuild the top bar in place (stars or the current child changed). */
  function refreshTopbar() {
    if (!topbarEl || !topbarEl.parentNode) return;
    var old = topbarEl;
    old.parentNode.replaceChild(topbar(topbarCrumb), old);
  }
  function childChip() {
    var c = MQ.store.currentChild();
    if (!c) return null;
    return el(
      'a',
      { class: 'who-chip', href: '#who', title: "Who's playing? (change player)", 'aria-label': 'Playing: ' + c.name + '. Change player' },
      el('span', { class: 'who-chip-avatar', 'aria-hidden': 'true' }, c.avatar),
      el('span', { class: 'who-chip-name' }, c.name)
    );
  }
  function topbar(crumb) {
    var settings = MQ.store.settings();
    var soundBtn = el(
      'button',
      {
        class: 'icon-btn',
        type: 'button',
        'aria-pressed': String(settings.sound),
        title: settings.sound ? 'Sound on' : 'Sound off',
        onclick: function () {
          MQ.store.setSetting('sound', !MQ.store.settings().sound);
          soundBtn.textContent = MQ.store.settings().sound ? '🔊' : '🔇';
          soundBtn.setAttribute('aria-pressed', String(MQ.store.settings().sound));
          MQ.sound('click');
        },
      },
      settings.sound ? '🔊' : '🔇'
    );
    var voiceBtn = el(
      'button',
      {
        class: 'icon-btn' + (settings.voice ? ' on' : ''),
        type: 'button',
        'aria-pressed': String(settings.voice),
        title: 'Read aloud',
        onclick: function () {
          var v = !MQ.store.settings().voice;
          MQ.store.setSetting('voice', v);
          voiceBtn.classList.toggle('on', v);
          voiceBtn.setAttribute('aria-pressed', String(v));
          if (v) MQ.speak('Read aloud is on.', true);
          else if (window.speechSynthesis) window.speechSynthesis.cancel();
        },
      },
      '🗣️'
    );
    topbarCrumb = crumb;
    topbarEl = el(
      'header',
      { class: 'topbar' },
      el('a', { class: 'brand', href: '#home' }, MQ.robot('happy', 30), el('span', null, 'Interactive Maths')),
      crumb ? el('span', { class: 'crumb' }, crumb) : null,
      el('span', { class: 'spacer' }),
      childChip(),
      el('span', { class: 'total-stars', title: 'Stars collected' }, '★ ', String(MQ.store.totalStars())),
      soundBtn,
      voiceBtn,
      el('a', { class: 'icon-btn parent-link', href: '#parent', title: 'Parent corner', 'aria-label': 'Parent corner' }, '👪')
    );
    return topbarEl;
  }

  /* ---------------- home: all units ---------------- */
  function renderMap() {
    screen = 'home';
    var rec = nextRecommended();
    var page = el('main', { class: 'page map' });
    var recMeta = meta(rec);
    var recWhere = rec ? sectionOf(rec) : null;
    page.appendChild(
      el(
        'section',
        { class: 'hero' },
        el('div', { class: 'hero-robot' }, MQ.robot('happy', 110)),
        el(
          'div',
          { class: 'hero-text' },
          el('p', { class: 'kicker' }, 'Grade 3 · Cambridge Stage 3'),
          el('h1', null, 'Hello! Ready to practise?'),
          el('p', { class: 'lead' }, 'I am Bolt, your maths helper. Each activity takes about 15 minutes. Try to collect 3 stars in every one.'),
          rec
            ? el(
                'div',
                { class: 'hero-actions' },
                el('a', { class: 'btn btn-big', href: '#play-' + rec }, 'Next activity: ' + recMeta.icon + ' ' + recMeta.title + ' ▶'),
                recWhere ? el('span', { class: 'hero-where' }, 'Unit ' + recWhere.unit.number + ' · ' + recWhere.section.id + ' ' + recWhere.section.title) : null
              )
            : null
        )
      )
    );

    var grid = el('div', { class: 'unit-grid' });
    for (var n = 1; n <= 17; n++) {
      var u = unitByNumber(n);
      var title = u ? u.title : cur.titles[n];
      var st = u ? unitStars(u) : null;
      var color = u && u.sections[0] ? u.sections[0].color : '#9aa6c4';
      var open = st && st.ready > 0;
      grid.appendChild(
        el(
          'a',
          { class: 'unit-card' + (open ? '' : ' is-locked'), href: open ? '#unit-' + n : null, 'aria-disabled': open ? null : 'true', style: { '--accent': color } },
          el('span', { class: 'unit-num' }, String(n)),
          el(
            'span',
            { class: 'unit-card-text' },
            el('strong', null, title),
            open
              ? el('small', null, st.total + ' activities' + (st.ready < st.total ? ' (' + (st.total - st.ready) + ' still being built)' : '') + (u.sections.length > 1 ? ' · sections ' + u.sections.map(function (s) { return s.id; }).join(', ') : ''))
              : el('small', null, 'Being built…'),
            open ? progressBar(st.got, st.max) : null
          )
        )
      );
    }
    page.appendChild(el('section', { class: 'unit' }, el('div', { class: 'unit-head' }, el('div', null, el('p', { class: 'kicker' }, 'Learner\'s Book 3'), el('h2', null, 'All units'))), grid));
    page.appendChild(el('p', { class: 'footnote' }, 'Activities follow the order of Cambridge Primary Mathematics Stage 3. Practise with the matching workbook pages after each section.'));
    page.appendChild(el('p', { class: 'footnote privacy-footer' }, el('a', { href: '#privacy' }, 'Privacy')));

    MQ.clear(root);
    root.appendChild(topbar(null));
    root.appendChild(page);
  }

  /* ---------------- one unit: its sections and activities ---------------- */
  function renderUnit(n) {
    var u = unitByNumber(n);
    if (!u) {
      renderMap();
      return;
    }
    screen = 'unit';
    currentUnit = n;
    var rec = nextRecommended();
    var st = unitStars(u);
    var page = el('main', { class: 'page map' });
    page.appendChild(el('a', { class: 'back back-light', href: '#home' }, '◀ All units'));
    var unitEl = el('section', { class: 'unit' }, el('div', { class: 'unit-head' }, el('div', null, el('p', { class: 'kicker' }, 'Unit ' + u.number), el('h1', { class: 'unit-title' }, u.title)), progressBar(st.got, st.max)));
    var sectionsEl = el('div', { class: 'sections' + (u.sections.length === 1 ? ' sections-one' : u.sections.length === 2 ? ' sections-two' : '') });
    u.sections.forEach(function (s) {
      var list = el('ol', { class: 'missions' });
      s.activities.forEach(function (id) {
        var m = meta(id);
        var ready = !!MQ.activities[id];
        list.appendChild(
          el(
            'li',
            null,
            el(
              'a',
              { class: 'mission' + (id === rec ? ' is-next' : '') + (ready ? '' : ' is-locked'), href: ready ? '#play-' + id : null, 'aria-disabled': ready ? null : 'true' },
              el('span', { class: 'mission-icon', 'aria-hidden': 'true' }, m.icon),
              el('span', { class: 'mission-text' }, el('strong', null, m.title), el('small', null, ready ? m.summary : 'Being built…')),
              ready ? starRow(starsOf(id)) : null
            )
          )
        );
      });
      sectionsEl.appendChild(
        el(
          'article',
          { class: 'section-card', style: { '--accent': s.color } },
          el('div', { class: 'section-head' }, el('span', { class: 'section-num' }, s.id), el('div', null, el('h3', null, s.title), el('p', { class: 'book-ref' }, s.book))),
          list
        )
      );
    });
    unitEl.appendChild(sectionsEl);
    page.appendChild(unitEl);
    var prevU = unitByNumber(n - 1);
    var nextU = unitByNumber(n + 1);
    page.appendChild(
      el(
        'nav',
        { class: 'unit-nav' },
        prevU ? el('a', { class: 'btn btn-ghost', href: '#unit-' + prevU.number }, '◀ Unit ' + prevU.number) : el('span'),
        nextU ? el('a', { class: 'btn btn-ghost', href: '#unit-' + nextU.number }, 'Unit ' + nextU.number + ' ▶') : el('span')
      )
    );
    MQ.clear(root);
    root.appendChild(topbar('Unit ' + u.number));
    root.appendChild(page);
  }

  /* ---------------- activity player ---------------- */
  function renderPlay(id) {
    screen = 'play';
    var m = meta(id);
    var where = sectionOf(id);
    MQ.clear(root);
    root.appendChild(topbar(where ? 'Unit ' + where.unit.number + ' › ' + where.section.id + ' ' + where.section.title : ''));

    if (!MQ.activities[id]) {
      root.appendChild(el('main', { class: 'page' }, el('div', { class: 'card center' }, MQ.robot('think', 90), el('h2', null, 'This activity is still being built'), el('p', null, 'Check back soon!'), el('a', { class: 'btn', href: '#home' }, '◀ Back to all activities'))));
      return;
    }

    var accent = where ? where.section.color : '#2ec4b6';
    var robotBox = el('div', { class: 'robot-box' }, MQ.robot('happy', 72));
    var bubble = el('div', { class: 'bubble', 'aria-live': 'polite' });
    var stage = el('div', { class: 'stage' });
    var fb = el('div', { class: 'feedback', 'aria-live': 'polite' });
    var revealBtn = el('button', { class: 'btn btn-ghost', type: 'button', hidden: true }, 'Show me 👀');
    var nextBtn = el('button', { class: 'btn btn-next', type: 'button' }, 'Next ▶');
    var progress = el('div', { class: 'progress' });
    var nextHandler = null;
    var revealHandler = null;
    var lastMood = 'happy';
    var phaseNow = 'learn';

    nextBtn.addEventListener('click', function () {
      if (nextBtn.disabled) return;
      MQ.sound('click');
      if (nextHandler) nextHandler();
    });
    revealBtn.addEventListener('click', function () {
      if (revealHandler) revealHandler();
    });

    var tips = m.tips || {};
    function tipList(items) {
      return el(
        'ul',
        null,
        (items || []).map(function (t) {
          return el('li', null, t);
        })
      );
    }
    var parentPanel = el(
      'details',
      { class: 'parent-panel', open: window.innerWidth > 1100 ? true : null },
      el('summary', null, '👪 Parent corner'),
      tips.goal ? el('div', { class: 'tip-block' }, el('h4', null, 'Goal'), el('p', null, tips.goal)) : null,
      tips.say ? el('div', { class: 'tip-block' }, el('h4', null, 'Things to say'), tipList(tips.say)) : null,
      tips.watch ? el('div', { class: 'tip-block' }, el('h4', null, 'Watch out for'), tipList(tips.watch)) : null,
      tips.offline ? el('div', { class: 'tip-block' }, el('h4', null, 'Away from the screen'), el('p', null, tips.offline)) : null,
      m.book ? el('p', { class: 'book-ref' }, '📘 ' + m.book) : null
    );

    var main = el(
      'main',
      { class: 'page play', style: { '--accent': accent } },
      el(
        'div',
        { class: 'play-main' },
        el('div', { class: 'play-head' }, el('a', { class: 'back', href: where ? '#unit-' + where.unit.number : '#home' }, where ? '◀ Unit ' + where.unit.number : '◀ Home'), el('h1', null, m.icon + ' ' + m.title), progress),
        el('div', { class: 'robot-row' }, robotBox, bubble),
        stage,
        el('div', { class: 'controls' }, fb, el('div', { class: 'control-btns' }, revealBtn, nextBtn))
      ),
      parentPanel
    );
    root.appendChild(main);

    var shell = {
      stage: stage,
      say: function (text, mood) {
        bubble.innerHTML = text || '';
        bubble.classList.remove('pop');
        void bubble.offsetWidth;
        bubble.classList.add('pop');
        mood = mood || 'happy';
        if (mood !== lastMood) {
          MQ.clear(robotBox);
          robotBox.appendChild(MQ.robot(mood, 72));
          lastMood = mood;
        }
        if (text) MQ.speak(text);
      },
      feedback: function (text, kind) {
        fb.className = 'feedback' + (text ? ' fb-' + (kind || 'info') : '');
        fb.innerHTML = text || '';
      },
      setNext: function (enabled, label) {
        nextBtn.disabled = !enabled;
        if (label) nextBtn.textContent = label;
        if (enabled && phaseNow === 'practice') {
          setTimeout(function () {
            try {
              nextBtn.focus({ preventScroll: true });
            } catch (e) {}
          }, 50);
        }
      },
      onNext: function (fn) {
        nextHandler = fn;
      },
      setReveal: function (visible, fn) {
        revealBtn.hidden = !visible;
        revealHandler = fn || null;
      },
      setProgress: function (phase, index, count) {
        phaseNow = phase;
        MQ.clear(progress);
        if (phase === 'learn') {
          progress.appendChild(el('span', { class: 'phase-tag' }, 'Learn ' + (index + 1) + ' / ' + count));
        } else {
          progress.appendChild(el('span', { class: 'phase-tag phase-practice' }, 'Practice'));
          var dots = el('span', { class: 'dots' });
          for (var i = 0; i < count; i++) dots.appendChild(el('i', { class: i < index ? 'done' : i === index ? 'now' : '' }));
          progress.appendChild(dots);
        }
      },
      done: function (r) {
        phaseNow = 'done';
        MQ.clear(progress);
        progress.appendChild(el('span', { class: 'phase-tag phase-done' }, 'Finished!'));
        shell.feedback('', 'info');
        revealBtn.hidden = true;
        var ids = allIds();
        var nextId = ids[ids.indexOf(id) + 1];
        var msg = r.stars === 3 ? 'Amazing! Three stars!' : r.stars === 2 ? 'Great job! Two stars!' : 'All done! Play again to earn more stars.';
        shell.say(msg, 'cheer');
        MQ.clear(stage);
        stage.className = 'stage stage-done';
        stage.appendChild(
          el(
            'div',
            { class: 'done-card' },
            el('div', { class: 'done-stars' }, starRow(r.stars)),
            el('h2', null, msg),
            el('p', null, r.firstTry + ' of ' + r.count + ' right first time.'),
            el(
              'div',
              { class: 'done-btns' },
              el(
                'button',
                {
                  class: 'btn btn-ghost',
                  type: 'button',
                  onclick: function () {
                    renderPlay(id);
                  },
                },
                '↻ Play again'
              ),
              nextId && MQ.activities[nextId] ? el('a', { class: 'btn', href: '#play-' + nextId }, 'Next: ' + meta(nextId).title + ' ▶') : null,
              el('a', { class: 'btn btn-ghost', href: where ? '#unit-' + where.unit.number : '#home' }, where ? 'Back to Unit ' + where.unit.number : 'Home')
            )
          )
        );
        nextBtn.disabled = true;
        nextBtn.textContent = 'Done';
        var ts = root.querySelector('.total-stars');
        if (ts) ts.textContent = '★ ' + MQ.store.totalStars();
        MQ.ui.confetti(document.body);
      },
    };

    shell.say(m.summary, 'happy');
    running = MQ.runActivity(id, shell);
  }

  /* ---------------- tab-session memory (sessionStorage, or a variable when it is blocked) ---------------- */
  var memSession = {};
  function ssGet(k) {
    try {
      var v = window.sessionStorage.getItem(k);
      if (v != null) return v;
    } catch (e) {}
    return memSession[k] != null ? memSession[k] : null;
  }
  function ssSet(k, v) {
    memSession[k] = String(v);
    try {
      window.sessionStorage.setItem(k, String(v));
    } catch (e) {}
  }
  function mount(page) {
    root.appendChild(page);
  }
  function keepScroll(fn) {
    var y = window.pageYOffset || 0;
    fn();
    window.scrollTo(0, y);
  }
  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
      return String(iso).slice(0, 10);
    }
  }
  /**
   * Plain words for an error from the sign-in or database service. The service's own text
   * (e.g. "new row violates row-level security policy") goes to the browser console only.
   */
  var lastLogged = '';
  function errText(e) {
    if (e && e.code === 'unsaved') return e.message; // already written for parents (js/sync.js)
    var raw = typeof e === 'string' ? e : (e && (e.message || e.error_description)) || String(e || '');
    // Every service message goes to the console, once (the troubleshooting steps in
    // docs/SETUP-ACCOUNTS.md ask the site owner to look there).
    if (raw && raw !== lastLogged) {
      lastLogged = raw;
      console.warn('Account service:', raw);
    }
    if (/at most 10/i.test(raw)) return KIDS_FULL_TEXT + ' Remove one in Your children to keep saving.';
    if (/failed to fetch|networkerror|network request failed|load failed|could not load|could not reach|timed? ?out|offline/i.test(raw)) return 'Could not reach the internet. Progress is still saved on this device.';
    if (/rate limit|too many|only request this after|\b429\b/i.test(raw)) return 'Too many tries. Please wait a few minutes, then try again.';
    // The sign-in service could not hand the email to its mail server (Supabase SMTP settings).
    if (/error sending .*email|smtp/i.test(raw)) return 'The website could not send the email right now. Please try Continue with Google, or contact ' + ((MQ.config || {}).contactEmail || 'the site owner') + '.';
    // Sign-in problems that trying again does not fix.
    var code = e && typeof e === 'object' && e.code ? ' ' + e.code : '';
    if (/invalid format|email_address_invalid|email address .*is invalid|invalid email/i.test(raw + code)) return 'That email address does not look right. Please check it.';
    if (/not authori[sz]ed|signups? not allowed|signup_disabled|provider is not enabled|unsupported provider|email_provider_disabled/i.test(raw + code)) {
      return 'This way of signing in is not set up on this website yet. Please contact ' + ((MQ.config || {}).contactEmail || 'the site owner') + '.';
    }
    if (/jwt|refresh token|session|not signed in|signed in to|\b401\b/i.test(raw)) return 'Your sign-in has ended. Please sign out and sign in again.';
    if (/row-level security|permission|policy|42501|\b403\b/i.test(raw)) return 'Your account could not be updated. Please try again later.';
    return 'Something went wrong. Please try again later.';
  }
  /** A message paragraph; errors are shown in the "try again" colour, not the success green. */
  function setMsg(node, text, isError) {
    if (!node) return;
    node.textContent = text || '';
    node.classList.toggle('is-error', !!(isError && text));
  }
  function msgEl(cls, text, isError) {
    var p = el('p', { class: cls });
    setMsg(p, text, isError);
    return p;
  }
  /** Move keyboard focus without jumping the page. */
  function focusEl(node) {
    if (!node) return;
    try {
      node.focus({ preventScroll: true });
    } catch (e) {
      node.focus();
    }
  }
  /* One live region that is never re-rendered, so screen readers reliably read messages. */
  var liveEl = null;
  var liveTimer = null;
  function announce(text) {
    if (!text) return;
    if (!liveEl || !liveEl.parentNode) {
      liveEl = el('p', { class: 'sr-only', id: 'sr-live', 'aria-live': 'polite', role: 'status' });
      document.body.appendChild(liveEl);
    }
    liveEl.textContent = '';
    clearTimeout(liveTimer);
    liveTimer = setTimeout(function () {
      liveEl.textContent = text;
    }, 60);
  }
  var MAX_KIDS = 10; // the database allows up to 10 children per family
  function kidsFull() {
    return MQ.store.children().length >= MAX_KIDS;
  }
  var KIDS_FULL_TEXT = 'A family can have up to ' + MAX_KIDS + ' children.';

  /* ---------------- parent gate ---------------- */
  var GATE_KEY = 'g3maths.gate';
  var GATE_MS = 30 * 60 * 1000;
  // A speed bump, not a lock: after a few wrong answers in a row the gate waits a little.
  var GATE_TRIES = 3;
  var GATE_WAIT_MS = 30 * 1000;
  var gateFails = 0;
  var gateLockUntil = 0;
  var gateTimer = null;
  function gatePassed() {
    var t = parseInt(ssGet(GATE_KEY), 10);
    var age = Date.now() - t;
    return !!t && age >= 0 && age < GATE_MS;
  }
  /**
   * After the gate, show the Parent corner again with focus on the step that was waiting (the
   * gate ran out while it was open), e.g. resumeAt('.reset-yes').
   */
  function resumeAt(selector) {
    return function () {
      focusNext = selector;
      renderParent();
    };
  }
  /** Run fn if a grown-up passed the gate in the last 30 minutes, otherwise show the gate first. */
  function gated(crumb, fn) {
    if (gatePassed()) fn();
    else renderGate(crumb, fn);
  }
  function renderGate(crumb, onPass) {
    screen = 'gate';
    var a = 0;
    var b = 0;
    var q = el('label', { class: 'gate-q', for: 'gate-answer' });
    var input = el('input', { id: 'gate-answer', class: 'gate-input', type: 'text', inputmode: 'numeric', pattern: '[0-9]*', autocomplete: 'off', maxlength: 4, 'aria-describedby': 'gate-msg' });
    var msg = el('p', { class: 'gate-msg', id: 'gate-msg', 'aria-live': 'polite' });
    var go = el('button', { class: 'btn', type: 'submit' }, 'Continue');
    function ask() {
      a = MQ.util.rand(13, 19);
      b = MQ.util.rand(6, 9);
      q.textContent = 'What is ' + a + ' × ' + b + '?';
      input.value = '';
    }
    function lock() {
      var wait = gateLockUntil - Date.now();
      if (wait <= 0) return false;
      input.disabled = true;
      go.disabled = true;
      msg.textContent = 'Too many tries. Please wait ' + Math.ceil(wait / 1000) + ' seconds, then try again.';
      clearTimeout(gateTimer);
      gateTimer = setTimeout(function () {
        if (!root.contains(input)) return; // left the gate meanwhile
        input.disabled = false;
        go.disabled = false;
        msg.textContent = '';
        ask();
        focusEl(input);
      }, wait);
      return true;
    }
    ask();
    var form = el(
      'form',
      {
        class: 'gate-form',
        novalidate: true,
        onsubmit: function (e) {
          e.preventDefault();
          if (input.disabled) return;
          var v = String(input.value).replace(/\s/g, '');
          if (!/^\d+$/.test(v)) {
            msg.textContent = 'Please type the answer as a number.';
          } else if (parseInt(v, 10) === a * b) {
            gateFails = 0;
            ssSet(GATE_KEY, Date.now());
            onPass();
            // Coming back to a half-finished step (see resumeAt): show it; otherwise the top.
            var ae = document.activeElement;
            if (ae && ae !== document.body && root.contains(ae) && ae.scrollIntoView) ae.scrollIntoView({ block: 'center' });
            else window.scrollTo(0, 0);
            return;
          } else {
            gateFails++;
            ask();
            if (gateFails >= GATE_TRIES) {
              gateFails = 0;
              gateLockUntil = Date.now() + GATE_WAIT_MS;
              lock();
              return;
            }
            msg.textContent = 'Not quite. Here is a new question.';
          }
          input.focus();
        },
      },
      q,
      el('div', { class: 'gate-row' }, input, go)
    );
    var page = el(
      'main',
      { class: 'page gate-page' },
      el(
        'section',
        { class: 'card gate-card' },
        el('div', { class: 'gate-robot' }, MQ.robot('think', 70)),
        el('h1', null, 'For grown-ups'),
        el('p', null, 'This part is for parents and carers. Please answer this question to carry on.'),
        form,
        msg,
        el('a', { class: 'back gate-back', href: '#home' }, '◀ Back')
      )
    );
    MQ.clear(root);
    root.appendChild(topbar(crumb));
    mount(page);
    if (!lock()) focusEl(input);
  }

  /* ---------------- shared bits for child profiles ---------------- */
  var AVATARS = ['🦊', '🐼', '🐯', '🐸', '🐵', '🦁', '🐨', '🐰', '🐙', '🦄', '🐢', '🐧'];
  var AVATAR_NAMES = { '🦊': 'Fox', '🐼': 'Panda', '🐯': 'Tiger', '🐸': 'Frog', '🐵': 'Monkey', '🦁': 'Lion', '🐨': 'Koala', '🐰': 'Rabbit', '🐙': 'Octopus', '🦄': 'Unicorn', '🐢': 'Turtle', '🐧': 'Penguin' };
  /** idPrefix: gives each button an id, so focus finds the same picker again after a re-render. */
  function avatarPicker(selected, onPick, label, idPrefix) {
    var wrap = el('div', { class: 'kids-avatars', role: 'group', 'aria-label': label || 'Choose a picture' });
    AVATARS.forEach(function (a, i) {
      var on = a === selected;
      var b = el(
        'button',
        {
          type: 'button',
          id: idPrefix ? idPrefix + '-' + i : null,
          class: 'kids-avatar' + (on ? ' is-on' : ''),
          'aria-pressed': String(on),
          'aria-label': AVATAR_NAMES[a] || a,
          title: AVATAR_NAMES[a] || '',
          onclick: function () {
            Array.prototype.forEach.call(wrap.children, function (x) {
              x.classList.remove('is-on');
              x.setAttribute('aria-pressed', 'false');
            });
            b.classList.add('is-on');
            b.setAttribute('aria-pressed', 'true');
            onPick(a);
          },
        },
        a
      );
      wrap.appendChild(b);
    });
    return wrap;
  }
  /** The automatic "Player 1" that nobody has played with yet. */
  function unusedStarter(c) {
    if (!c || !c.placeholder) return false;
    var acts = MQ.store.progressOf(c.id).activities;
    return !Object.keys(acts).some(function (a) {
      return acts[a].plays > 0;
    });
  }
  /**
   * Nickname + picture form. onAdded(child) after saving; onCancel optional. opts.onFull: the
   * family reached the limit meanwhile (e.g. a sync while the gate was showing). opts.keepPlayer:
   * the child playing now stays the player (unless it is the unused "Player 1"). opts.draft:
   * an object that keeps the typed nickname and chosen picture (name, pic) across re-renders.
   */
  function addChildForm(onAdded, onCancel, crumb, opts) {
    opts = opts || {};
    var draft = opts.draft || {};
    var used = MQ.store.children().map(function (c) {
      return c.avatar;
    });
    var chosen = AVATARS.indexOf(draft.pic) !== -1
      ? draft.pic
      : AVATARS.filter(function (a) {
          return used.indexOf(a) === -1;
        })[0] || AVATARS[0];
    var nameIn = el('input', {
      id: 'kids-new-name',
      class: 'kids-input',
      type: 'text',
      maxlength: 30,
      autocomplete: 'off',
      'aria-describedby': 'kids-new-hint',
      value: draft.name || '',
      oninput: function () {
        draft.name = nameIn.value;
      },
    });
    var msg = el('p', { class: 'kids-msg', 'aria-live': 'polite' });
    var form = el(
      'form',
      {
        class: 'kids-add',
        novalidate: true,
        onsubmit: function (e) {
          e.preventDefault();
          var name = nameIn.value.trim();
          if (!name) {
            setMsg(msg, 'Please type a nickname.', true);
            nameIn.focus();
            return;
          }
          if (kidsFull()) {
            setMsg(msg, KIDS_FULL_TEXT, true);
            return;
          }
          var pic = chosen;
          var add = function () {
            if (kidsFull()) {
              if (opts.onFull) opts.onFull(name);
              else setMsg(msg, KIDS_FULL_TEXT, true);
              return;
            }
            var now = MQ.store.currentChild();
            onAdded(MQ.store.addChild(name, pic, { makeCurrent: !opts.keepPlayer || unusedStarter(now) }));
          };
          // The gate ran out while the form was open: ask again, then finish adding.
          if (!gatePassed()) renderGate(crumb || 'Grown-ups', add);
          else add();
        },
      },
      el('label', { class: 'kids-label', for: 'kids-new-name' }, 'Nickname'),
      nameIn,
      el('p', { class: 'kids-hint muted', id: 'kids-new-hint' }, 'Use a nickname — no surnames needed.'),
      el('p', { class: 'kids-label' }, 'Picture'),
      avatarPicker(
        chosen,
        function (a) {
          chosen = a;
          draft.pic = a;
        },
        null,
        'kids-new-pic'
      ),
      msg,
      el(
        'div',
        { class: 'kids-btns' },
        el('button', { class: 'btn', type: 'submit' }, 'Add child'),
        onCancel ? el('button', { class: 'btn btn-ghost', type: 'button', onclick: onCancel }, 'Cancel') : null
      )
    );
    return form;
  }

  /* ---------------- who's playing? ---------------- */
  var WHO_KEY = 'g3maths.whoShown';
  function renderWho() {
    screen = 'who';
    ssSet(WHO_KEY, '1');
    var now = MQ.store.currentChild();
    var grid = el('div', { class: 'who-grid' });
    MQ.store.children().forEach(function (c) {
      var isNow = now && now.id === c.id;
      grid.appendChild(
        el(
          'button',
          {
            type: 'button',
            class: 'who-card' + (isNow ? ' is-current' : ''),
            'aria-label': c.name + ', ' + MQ.store.totalStars(c.id) + ' stars' + (isNow ? ', playing now' : ''),
            onclick: function () {
              MQ.store.switchChild(c.id);
              MQ.sound('click');
              window.location.hash = '#home';
            },
          },
          el('span', { class: 'who-avatar', 'aria-hidden': 'true' }, c.avatar),
          el('span', { class: 'who-name' }, c.name),
          el('span', { class: 'who-stars', 'aria-hidden': 'true' }, '★ ' + MQ.store.totalStars(c.id)),
          isNow ? el('span', { class: 'who-now' }, 'Playing now') : null
        )
      );
    });
    var page = el(
      'main',
      { class: 'page who-page' },
      el('div', { class: 'who-head' }, MQ.robot('happy', 80), el('h1', null, "Who's playing?"), el('p', { class: 'muted' }, 'Tap your name to start.')),
      grid,
      el('div', { class: 'who-actions' }, kidsFull() ? el('p', { class: 'muted' }, KIDS_FULL_TEXT) : el('a', { class: 'btn btn-ghost', href: '#add-child' }, '+ Add a child (grown-ups)'))
    );
    MQ.clear(root);
    root.appendChild(topbar("Who's playing?"));
    mount(page);
  }
  function renderAddChild() {
    screen = 'add-child';
    var page = el(
      'main',
      { class: 'page kids-page' },
      el(
        'section',
        { class: 'card kids-card' },
        el('h1', null, 'Add a child'),
        kidsFull()
          ? el('div', null, el('p', null, KIDS_FULL_TEXT), el('a', { class: 'btn btn-ghost', href: '#who' }, '◀ Back'))
          : addChildForm(
              function () {
                window.location.hash = '#home';
              },
              function () {
                window.location.hash = '#who';
              },
              'Add a child',
              { onFull: renderAddChild }
            )
      )
    );
    MQ.clear(root);
    root.appendChild(topbar('Add a child'));
    mount(page);
  }

  /* ---------------- parent corner ---------------- */
  var parentSel = null; // whose dashboard is shown
  // { removing: id, adding: bool, draft: { name, pic }, renameFor: id, renameText, msg, msgErr, addMsg }
  var kidsUi = {};
  var acctUi = {}; // remembers half-finished account steps across re-renders
  var acctKey = null;
  var acctStatus = null; // last sync status announced
  var focusNext = null; // CSS selector to focus after the next Parent corner render

  /** The Parent corner shows sel, but sel was removed meanwhile (e.g. a sync or another tab): show the new list. */
  function gone(child) {
    if (MQ.store.children().some(function (c) { return c.id === child.id; })) return false;
    kidsUi = { msg: child.name + ' had already been removed (on another device or in another tab), so there was nothing left to change.', msgErr: true };
    announce(kidsUi.msg);
    rerenderParent();
    return true;
  }
  /**
   * Two-step reset button (browser confirm dialogs are not available everywhere). The step
   * lives in kidsUi, so a background re-render (a sync, another tab) keeps it.
   */
  function resetControl(child) {
    var wrap = el('div', { class: 'reset-row' });
    if (kidsUi.resetting === child.id) {
      var yes = el(
        'button',
        {
          class: 'btn btn-danger reset-yes',
          type: 'button',
          onclick: function () {
            if (!gatePassed()) {
              renderGate('Parent corner', resumeAt('.reset-row .reset-yes')); // comes back to this step
              return;
            }
            if (gone(child)) return;
            MQ.store.reset(child.id);
            kidsUi = { resetFor: child.id, resetMsg: child.name + "'s progress has been reset." };
            announce(kidsUi.resetMsg);
            focusNext = '.reset-row .btn';
            rerenderParent();
          },
        },
        'Yes, reset ' + child.name
      );
      wrap.appendChild(el('p', { class: 'muted' }, 'Are you sure? This clears all of ' + child.name + "'s stars and progress."));
      wrap.appendChild(
        el(
          'div',
          { class: 'reset-btns' },
          yes,
          el(
            'button',
            {
              class: 'btn btn-ghost reset-cancel',
              type: 'button',
              onclick: function () {
                kidsUi = {};
                focusNext = '.reset-row .btn';
                rerenderParent();
              },
            },
            'Cancel'
          )
        )
      );
      return wrap;
    }
    wrap.appendChild(
      el(
        'button',
        {
          class: 'btn btn-danger',
          type: 'button',
          onclick: function () {
            kidsUi = { resetting: child.id };
            focusNext = '.reset-row .reset-yes';
            rerenderParent();
          },
        },
        'Reset ' + child.name + "'s progress"
      )
    );
    // Shown here, next to the button (the Parent corner is long); also read out by announce().
    if (kidsUi.resetFor === child.id && kidsUi.resetMsg) wrap.appendChild(el('p', { class: 'kids-msg' }, kidsUi.resetMsg));
    return wrap;
  }

  function kidsCard(kids, sel) {
    var card = el('section', { class: 'card kids-card', 'aria-labelledby': 'kids-h' }, el('h2', { id: 'kids-h' }, 'Your children'));
    var tabs = el('div', { class: 'kids-tabs', role: 'group', 'aria-label': 'Choose whose progress to see' });
    kids.forEach(function (c) {
      var on = c.id === sel.id;
      tabs.appendChild(
        el(
          'button',
          {
            type: 'button',
            class: 'kids-tab' + (on ? ' is-on' : ''),
            'aria-pressed': String(on),
            onclick: function () {
              parentSel = c.id;
              kidsUi = {};
              focusNext = '.kids-tab.is-on';
              rerenderParent();
            },
          },
          el('span', { class: 'kids-tab-avatar', 'aria-hidden': 'true' }, c.avatar),
          el('span', { class: 'kids-tab-name' }, c.name)
        )
      );
    });
    card.appendChild(tabs);

    var manage = el('div', { class: 'kids-manage' });
    // A name typed but not saved yet stays when the page is rebuilt (a sync, another tab).
    var nameIn = el('input', {
      id: 'kids-name',
      class: 'kids-input',
      type: 'text',
      maxlength: 30,
      autocomplete: 'off',
      value: kidsUi.renameFor === sel.id && kidsUi.renameText != null ? kidsUi.renameText : sel.name,
      oninput: function () {
        kidsUi.renameFor = sel.id;
        kidsUi.renameText = nameIn.value;
      },
    });
    manage.appendChild(
      el(
        'form',
        {
          class: 'kids-rename',
          novalidate: true,
          onsubmit: function (e) {
            e.preventDefault();
            var v = nameIn.value.trim();
            if (!v) {
              setMsg(kidsMsg, 'Please type a nickname.', true);
              announce('Please type a nickname.');
              return;
            }
            if (gone(sel)) return;
            var save = function () {
              MQ.store.updateChild(sel.id, { name: v });
              kidsUi = { msg: 'Name saved ✓' };
              announce(kidsUi.msg);
              focusNext = '#kids-name';
            };
            // The gate ran out while the page was open: ask again, then save the typed name.
            if (!gatePassed()) {
              renderGate('Parent corner', function () {
                if (gone(sel)) return; // removed (e.g. by a sync) while the gate was showing
                save();
                renderParent();
              });
              return;
            }
            save();
            rerenderParent();
          },
        },
        el('label', { class: 'kids-label', for: 'kids-name' }, 'Nickname'),
        el('div', { class: 'kids-row' }, nameIn, el('button', { class: 'btn btn-ghost', type: 'submit' }, 'Save name'))
      )
    );
    manage.appendChild(el('p', { class: 'kids-label' }, 'Picture'));
    manage.appendChild(
      avatarPicker(sel.avatar, function (a) {
        if (gone(sel)) return;
        var save = function () {
          MQ.store.updateChild(sel.id, { avatar: a });
          // A new name typed but not saved yet stays in the box.
          kidsUi = { msg: 'Picture changed ✓', renameFor: kidsUi.renameFor, renameText: kidsUi.renameText };
          announce(kidsUi.msg);
          focusNext = '.kids-manage .kids-avatar.is-on';
        };
        if (!gatePassed()) {
          renderGate('Parent corner', function () {
            if (gone(sel)) return;
            save();
            renderParent();
          });
          return;
        }
        save();
        rerenderParent();
      }, 'Picture for ' + sel.name, 'kids-pic')
    );
    // Shown on screen; read out through the page's own live region (see announce).
    var kidsMsg = msgEl('kids-msg', kidsUi.msg, kidsUi.msgErr);
    manage.appendChild(kidsMsg);

    var onlyChild = kids.length === 1;
    var removeBox = el('div', { class: 'kids-remove' });
    if (kidsUi.removing === sel.id) {
      var synced = syncOn() && MQ.store.raw().syncedChildren[sel.id];
      var where = synced ? ' from your account and this device. Your other devices remove them the next time they sync' : ' on this device';
      removeBox.appendChild(el('p', { class: 'kids-warn' }, 'This deletes ' + sel.name + "'s stars and progress" + where + (onlyChild ? ', and starts again with a new player.' : '.')));
      removeBox.appendChild(
        el(
          'div',
          { class: 'kids-btns' },
          el(
            'button',
            {
              class: 'btn btn-danger',
              type: 'button',
              onclick: function () {
                if (!gatePassed()) {
                  renderGate('Parent corner', resumeAt('.kids-remove .btn-danger')); // comes back to this step
                  return;
                }
                if (gone(sel)) return;
                MQ.store.removeChild(sel.id);
                parentSel = null;
                var left = MQ.store.children();
                kidsUi = { msg: left.length === 1 && left[0].placeholder ? sel.name + ' removed. A new player has been added — you can rename it below.' : sel.name + ' removed.' };
                announce(kidsUi.msg);
                focusNext = '.kids-tab.is-on';
                rerenderParent();
              },
            },
            'Yes, remove ' + sel.name
          ),
          el(
            'button',
            {
              class: 'btn btn-ghost kids-remove-cancel',
              type: 'button',
              onclick: function () {
                kidsUi = {};
                focusNext = '.kids-remove-btn';
                rerenderParent();
              },
            },
            'Cancel'
          )
        )
      );
    } else {
      removeBox.appendChild(
        el(
          'button',
          {
            class: 'btn btn-ghost kids-remove-btn',
            type: 'button',
            onclick: function () {
              kidsUi = { removing: sel.id };
              focusNext = '.kids-remove .btn-danger';
              rerenderParent();
            },
          },
          'Remove ' + sel.name
        )
      );
    }
    manage.appendChild(removeBox);
    card.appendChild(manage);

    var addBox = el('div', { class: 'kids-add-box' });
    // "Could not add …" (the family filled up meanwhile): shown where the parent was adding.
    if (kidsUi.addMsg) addBox.appendChild(el('p', { class: 'kids-msg is-error', tabindex: '-1' }, kidsUi.addMsg));
    if (kids.length >= MAX_KIDS) {
      addBox.appendChild(el('p', { class: 'muted' }, KIDS_FULL_TEXT));
    } else if (kidsUi.adding) {
      if (!kidsUi.draft) kidsUi.draft = {};
      addBox.appendChild(el('h3', null, 'Add a child'));
      addBox.appendChild(
        addChildForm(
          function (c) {
            parentSel = c.id;
            kidsUi = { msg: c.name + ' added ✓' };
            announce(kidsUi.msg);
            focusNext = '.kids-tab.is-on';
            rerenderParent();
          },
          function () {
            kidsUi = {};
            focusNext = '.kids-add-box .btn';
            rerenderParent();
          },
          'Parent corner',
          {
            keepPlayer: true, // adding a sibling does not change who is playing
            draft: kidsUi.draft,
            onFull: function (name) {
              kidsUi = { addMsg: 'Could not add ' + name + '. ' + KIDS_FULL_TEXT };
              announce(kidsUi.addMsg);
              focusNext = '.kids-add-box .kids-msg';
              renderParent();
            },
          }
        )
      );
    } else {
      addBox.appendChild(
        el(
          'button',
          {
            class: 'btn',
            type: 'button',
            onclick: function () {
              kidsUi = { adding: true };
              focusNext = '#kids-new-name';
              rerenderParent();
            },
          },
          '+ Add a child'
        )
      );
    }
    card.appendChild(addBox);
    return card;
  }

  function dashboardCard(sel) {
    var acts = MQ.store.progressOf(sel.id).activities;
    var ids = allIds();
    var played = ids.filter(function (id) {
      return acts[id] && acts[id].plays > 0;
    }).length;
    var last = '';
    var lastT = 0;
    Object.keys(acts).forEach(function (id) {
      var t = acts[id].lastPlayed ? Date.parse(acts[id].lastPlayed) : NaN;
      if (!isNaN(t) && t > lastT) {
        lastT = t;
        last = acts[id].lastPlayed;
      }
    });
    function tile(value, label) {
      return el('div', { class: 'kids-tile' }, el('strong', null, value), el('span', null, label));
    }
    var table = el('table', { class: 'progress-table' }, el('thead', null, el('tr', null, el('th', null, 'Activity'), el('th', null, 'Stars'), el('th', null, 'Plays'), el('th', null, 'Right first time'), el('th', null, 'Last played'), el('th', null, 'Slips to work on'))));
    var tbody = el('tbody');
    cur.units.forEach(function (u) {
      tbody.appendChild(el('tr', { class: 'unit-row' }, el('td', { colspan: 6 }, 'Unit ' + u.number + ' · ' + u.title)));
      u.sections.forEach(function (s) {
        tbody.appendChild(el('tr', { class: 'section-row' }, el('td', { colspan: 6 }, s.id + ' ' + s.title)));
        s.activities.forEach(function (id) {
          var m = meta(id);
          var p = acts[id];
          var pct = p && p.answered ? Math.round((p.firstTry / p.answered) * 100) + '%' : '—';
          var slips = p && p.mistakes ? Object.keys(p.mistakes).sort(function (a, b) {
            return p.mistakes[b] - p.mistakes[a];
          }) : [];
          tbody.appendChild(
            el(
              'tr',
              null,
              el(
                'td',
                null,
                el(
                  'a',
                  {
                    href: '#play-' + id,
                    // The table is this child's: play (and save the stars) as this child.
                    onclick: function () {
                      MQ.store.switchChild(sel.id);
                    },
                  },
                  m.icon + ' ' + m.title
                )
              ),
              el('td', null, starRow(p ? p.stars : 0)),
              el('td', null, p ? String(p.plays) : '0'),
              el('td', null, pct),
              el('td', null, p && p.lastPlayed ? fmtDate(p.lastPlayed) : '—'),
              el(
                'td',
                { class: 'slips' },
                slips.length
                  ? el(
                      'ul',
                      null,
                      slips.slice(0, 3).map(function (k) {
                        return el('li', null, k + ' (×' + p.mistakes[k] + ')');
                      })
                    )
                  : '—'
              )
            )
          );
        });
      });
    });
    table.appendChild(tbody);
    return el(
      'section',
      { class: 'card kids-dash', 'aria-labelledby': 'dash-h' },
      el('h2', { id: 'dash-h' }, sel.avatar + ' ' + sel.name + "'s progress"),
      el('div', { class: 'kids-summary' }, tile('★ ' + MQ.store.totalStars(sel.id), 'Total stars'), tile(played + ' of ' + ids.length, 'Activities played'), tile(last ? fmtDate(last) : '—', 'Last played')),
      el('p', { class: 'muted' }, 'Tapping an activity below starts it with ' + sel.name + ' as the player.'),
      el('div', { class: 'table-wrap' }, table)
    );
  }

  /* ---- account panel ---- */
  var EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
  function syncState() {
    return MQ.sync ? MQ.sync.state : null;
  }
  /** Signed in and syncing with the account. */
  function syncOn() {
    var s = syncState();
    return !!(s && s.enabled && s.user && s.consented && !s.otherAccount);
  }
  function savedWhereText() {
    if (syncOn()) return 'Progress is saved on this device and synced to your account, so it is safe and can be used on your other devices.';
    return 'Progress is saved in this browser on this device only.';
  }
  function ymd() {
    var d = new Date();
    function two(n) {
      return (n < 10 ? '0' : '') + n;
    }
    return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate());
  }
  function localExport() {
    var d = MQ.store.raw();
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        account: null,
        children: d.children.map(function (c) {
          return { name: c.name, avatar: c.avatar, progress: (d.progress[c.id] || {}).activities || {} };
        }),
      },
      null,
      2
    );
  }
  /** msgEl: where the result is shown; it is also kept in acctUi (dlMsg), so a re-render shows it again. */
  function downloadData(msgEl) {
    var text;
    var failed = false;
    try {
      var json = MQ.sync ? MQ.sync.exportData() : localExport();
      var blob = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = el('a', { href: url, download: 'interactive-maths-data-' + ymd() + '.json', hidden: true });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () {
        try {
          URL.revokeObjectURL(url);
        } catch (e) {}
      }, 2000);
      text = 'Your data file has been downloaded.';
    } catch (e) {
      text = 'Could not download: ' + errText(e);
      failed = true;
    }
    acctUi.dlMsg = text;
    acctUi.dlErr = failed;
    setMsg(msgEl, text, failed);
    announce(text);
  }
  function downloadButton(msgEl) {
    return el(
      'button',
      {
        class: 'btn btn-ghost',
        type: 'button',
        onclick: function () {
          downloadData(msgEl);
        },
      },
      'Download my data'
    );
  }
  function statusText(s) {
    if (s.status === 'syncing') return 'Saving…';
    if (s.status === 'saved') return 'All progress saved ✓';
    if (s.status === 'offline') return 'Offline — will save when you are back online';
    if (s.status === 'error') {
      if (/at most 10/i.test(s.lastError || '')) return 'Could not save: a family can have up to ' + MAX_KIDS + ' children. Remove one in Your children to keep saving.';
      return 'Could not save: ' + errText(s.lastError);
    }
    return 'Sync is on: progress is saved to your account.';
  }
  function focusIn(box, selector) {
    focusEl(box && box.querySelector(selector));
  }
  /**
   * Sign-out button. needsWarning: the profiles on this device came from the account, so
   * signing out removes them from the device. Its state lives in acctUi, so a re-render (the
   * sync status changes while signing out) shows the same step.
   */
  function signOutControl(needsWarning) {
    var wrap = el('div', { class: 'acct-signout' });
    var busy = acctUi.busy === 'signout';
    var msg = msgEl('acct-msg', acctUi.outMsg, acctUi.outErr);
    function show(text, isError) {
      acctUi.outMsg = text;
      acctUi.outErr = !!isError;
      announce(text);
    }
    function doSignOut(force) {
      if (!gatePassed()) {
        // comes back to the same step
        renderGate('Parent corner', resumeAt(force ? '.acct-signout-anyway' : needsWarning ? '.acct-signout-now' : '.acct-signout .btn'));
        return;
      }
      acctUi.busy = 'signout';
      acctUi.unsaved = false;
      show('Signing out…');
      renderAccount(true);
      Promise.resolve()
        .then(function () {
          return MQ.sync.signOut({ force: force });
        })
        .then(function () {
          acctUi = {};
          kidsUi = {};
          parentSel = null;
          announce('Signed out.');
          if (screen === 'parent') {
            focusNext = '#acct-h';
            rerenderParent();
          }
        })
        .catch(function (e) {
          acctUi.busy = '';
          acctUi.signingOut = needsWarning;
          acctUi.unsaved = !!(e && e.code === 'unsaved');
          show(acctUi.unsaved ? errText(e) : 'Could not sign out: ' + errText(e), true);
          renderAccount(true);
          focusIn(document.getElementById('acct-panel'), acctUi.unsaved ? '.acct-signout-anyway' : '.acct-signout .btn');
        });
    }
    function first() {
      var b = el(
        'button',
        {
          class: 'btn btn-ghost',
          type: 'button',
          disabled: busy,
          onclick: function () {
            if (!needsWarning) {
              doSignOut(false);
              return;
            }
            acctUi.signingOut = true;
            acctUi.outMsg = '';
            renderAccount(true);
            focusIn(document.getElementById('acct-panel'), '.acct-signout-now');
          },
        },
        'Sign out'
      );
      wrap.appendChild(b);
    }
    function second() {
      var cancel = el(
        'button',
        {
          class: 'btn btn-ghost acct-signout-cancel',
          type: 'button',
          disabled: busy,
          onclick: function () {
            acctUi.signingOut = false;
            acctUi.unsaved = false;
            acctUi.outMsg = '';
            renderAccount(true);
            focusIn(document.getElementById('acct-panel'), '.acct-signout .btn');
          },
        },
        'Cancel'
      );
      var row = el('div', { class: 'acct-btns' });
      if (acctUi.unsaved) {
        row.appendChild(
          el(
            'button',
            {
              class: 'btn btn-danger acct-signout-anyway',
              type: 'button',
              disabled: busy,
              onclick: function () {
                doSignOut(true);
              },
            },
            'Sign out anyway (unsaved progress on this device will be lost)'
          )
        );
      } else {
        row.appendChild(
          el(
            'button',
            {
              class: 'btn acct-signout-now',
              type: 'button',
              disabled: busy,
              onclick: function () {
                doSignOut(false);
              },
            },
            'Sign out now'
          )
        );
      }
      row.appendChild(cancel);
      wrap.appendChild(
        el(
          'p',
          { class: 'acct-note' },
          acctUi.unsaved
            ? 'Progress saved before now stays in your account, but the newest progress on this device has not been saved and would be lost.'
            : "Signing out removes your children's progress from this device. It stays saved in your account."
        )
      );
      wrap.appendChild(row);
    }
    if ((acctUi.signingOut && needsWarning) || acctUi.unsaved) second();
    else first();
    wrap.appendChild(msg);
    return wrap;
  }
  /** keepLocal: the profiles on this device never came from the account, so they stay here. */
  function deleteControl(keepLocal) {
    var wrap = el('div', { class: 'acct-delete' });
    var busy = acctUi.busy === 'delete';
    function first() {
      wrap.appendChild(
        el(
          'button',
          {
            class: 'btn btn-danger',
            type: 'button',
            onclick: function () {
              acctUi.deleting = true;
              renderAccount(true);
              focusIn(document.getElementById('acct-panel'), '#acct-delete-input');
            },
          },
          'Delete my account'
        )
      );
    }
    function second() {
      var input = el('input', {
        id: 'acct-delete-input',
        class: 'acct-input',
        type: 'text',
        autocomplete: 'off',
        autocapitalize: 'characters',
        spellcheck: 'false',
        disabled: busy,
        value: acctUi.deleteText || '',
        oninput: function () {
          acctUi.deleteText = input.value;
          go.disabled = input.value.trim() !== 'DELETE';
        },
      });
      var msg = msgEl('acct-msg', acctUi.deleteMsg, acctUi.deleteErr);
      var go = el(
        'button',
        {
          class: 'btn btn-danger',
          type: 'button',
          disabled: busy || (acctUi.deleteText || '').trim() !== 'DELETE',
          onclick: function () {
            if (input.value.trim() !== 'DELETE') return;
            if (!gatePassed()) {
              renderGate('Parent corner', resumeAt('#acct-delete-input')); // comes back to this step, DELETE still typed
              return;
            }
            acctUi.busy = 'delete';
            acctUi.deleteErr = false;
            acctUi.deleteMsg = 'Deleting…';
            announce('Deleting…');
            renderAccount(true);
            Promise.resolve()
              .then(function () {
                return MQ.sync.deleteAccount({ keepLocal: keepLocal });
              })
              .then(function () {
                acctUi = {};
                kidsUi = {};
                parentSel = null;
                announce('Your account has been deleted.');
                // Only from the Parent corner: a child may have started playing meanwhile.
                if (screen === 'parent' || screen === 'gate') window.location.hash = '#home';
                else refreshTopbar();
              })
              .catch(function (e) {
                acctUi.busy = '';
                acctUi.deleteMsg = 'Could not delete the account: ' + errText(e);
                acctUi.deleteErr = true;
                announce(acctUi.deleteMsg);
                renderAccount(true);
                focusIn(document.getElementById('acct-panel'), '#acct-delete-input');
              });
          },
        },
        'Delete everything'
      );
      wrap.appendChild(
        el(
          'p',
          { class: 'acct-warn' },
          keepLocal
            ? 'This deletes your login (your email address) from this website. The profiles and progress on this device were never saved to your account and stay on this device. It cannot be undone.'
            : "This deletes your account and every child's stars and progress from the cloud and from this device. It cannot be undone. Other devices keep their own copy until you sign out there or clear that browser's data. You may want to download your data first."
        )
      );
      wrap.appendChild(el('label', { class: 'kids-label', for: 'acct-delete-input' }, 'Type DELETE to confirm'));
      wrap.appendChild(input);
      wrap.appendChild(
        el(
          'div',
          { class: 'acct-btns' },
          go,
          el(
            'button',
            {
              class: 'btn btn-ghost acct-delete-cancel',
              type: 'button',
              disabled: busy,
              onclick: function () {
                acctUi.deleting = false;
                acctUi.deleteText = '';
                acctUi.deleteMsg = '';
                renderAccount(true);
                focusIn(document.getElementById('acct-panel'), '.acct-delete .btn');
              },
            },
            'Cancel'
          )
        )
      );
      wrap.appendChild(msg);
    }
    if (acctUi.deleting) second();
    else first();
    return wrap;
  }
  function signInBox(box, s) {
    // Kept in acctUi, so a re-render (e.g. another tab saved) shows it again.
    var msg = msgEl('acct-msg', acctUi.signInMsg, acctUi.signInErr);
    msg.id = 'acct-signin-msg';
    function say(text, isError, passing) {
      acctUi.signInMsg = passing ? '' : text;
      acctUi.signInErr = !!isError;
      // The card may have been rebuilt while a request was out (e.g. sync state changed):
      // write to the message that is on screen now, not the one this box was built with.
      setMsg(document.getElementById('acct-signin-msg') || msg, text, isError);
      announce(text);
    }
    box.appendChild(el('p', { class: 'acct-lead' }, 'Sign in to keep progress safe and use it on other devices.'));
    if (MQ.store.raw().accountId) leftoverBox(box);
    if (s.signInError) box.appendChild(el('p', { class: 'acct-problem', role: 'alert' }, s.signInError));
    var google = el(
      'button',
      {
        class: 'btn acct-google',
        type: 'button',
        onclick: function () {
          google.disabled = true;
          say('Opening Google sign-in…', false, true); // the page goes to Google next
          Promise.resolve()
            .then(function () {
              return MQ.sync.signInWithGoogle();
            })
            .then(function (res) {
              if (res && res.error) throw res.error;
            })
            .catch(function (e) {
              google.disabled = false;
              say('Could not open Google sign-in: ' + errText(e), true);
            });
        },
      },
      el('span', { class: 'acct-g', 'aria-hidden': 'true' }, 'G'),
      'Continue with Google'
    );
    box.appendChild(google);
    box.appendChild(el('p', { class: 'acct-or' }, 'or'));
    if (acctUi.sent) {
      box.appendChild(
        el(
          'div',
          { class: 'acct-sent', role: 'status', tabindex: '-1' },
          el('strong', null, 'Check your email'),
          el('p', null, 'We sent a sign-in link to ', el('b', null, acctUi.sent), '. Open it on this device to finish signing in.'),
          el(
            'button',
            {
              class: 'btn btn-ghost',
              type: 'button',
              onclick: function () {
                acctUi.sent = '';
                renderAccount(true);
                focusIn(document.getElementById('acct-panel'), '#acct-email');
              },
            },
            'Use a different email'
          )
        )
      );
    } else {
      var emailIn = el('input', {
        id: 'acct-email',
        class: 'acct-input',
        type: 'email',
        inputmode: 'email',
        autocomplete: 'email',
        placeholder: 'name@example.com',
        value: acctUi.email || '',
        oninput: function () {
          acctUi.email = emailIn.value;
        },
      });
      var send = el('button', { class: 'btn btn-ghost', type: 'submit' }, 'Email me a sign-in link');
      box.appendChild(
        el(
          'form',
          {
            class: 'acct-email-form',
            novalidate: true,
            onsubmit: function (e) {
              e.preventDefault();
              var v = emailIn.value.trim();
              if (!EMAIL_RE.test(v)) {
                say('Please type a full email address, like name@example.com.', true);
                emailIn.focus();
                return;
              }
              send.disabled = true;
              send.textContent = 'Sending…';
              say('', false, true);
              Promise.resolve()
                .then(function () {
                  return MQ.sync.sendEmailLink(v);
                })
                .then(function (res) {
                  if (res && res.error) throw res.error;
                  acctUi.sent = v;
                  acctUi.signInMsg = '';
                  renderAccount(true);
                  announce('Check your email. We sent a sign-in link.');
                  focusIn(document.getElementById('acct-panel'), '.acct-sent');
                })
                .catch(function (err) {
                  send.disabled = false;
                  send.textContent = 'Email me a sign-in link';
                  say('Could not send the link: ' + errText(err), true);
                });
            },
          },
          el('label', { class: 'kids-label', for: 'acct-email' }, 'Your email'),
          el('div', { class: 'kids-row' }, emailIn, send)
        )
      );
    }
    box.appendChild(msg);
    box.appendChild(el('p', { class: 'acct-note' }, 'Only grown-ups sign in. Children never need an email.'));
  }
  /**
   * Profiles on this device that agreeing would copy into the account. An unused "Player 1" is
   * left out (js/sync.js does not upload it), except when it is the only profile here: then it
   * is uploaded if the account has no children yet, and the list says so.
   */
  function profilesToUpload() {
    var d = MQ.store.raw();
    var kids = MQ.store.children();
    var list = kids.filter(function (c) {
      return !d.syncedChildren[c.id] && !unusedStarter(c);
    });
    if (!list.length && kids.length === 1 && !d.syncedChildren[kids[0].id] && unusedStarter(kids[0])) {
      return [{ id: kids[0].id, name: kids[0].name, avatar: kids[0].avatar, starter: true }];
    }
    return list;
  }
  function consentBox(box, s) {
    var busy = acctUi.busy === 'consent';
    var msg = msgEl('acct-msg', acctUi.consentMsg, acctUi.consentErr);
    box.appendChild(el('p', null, 'Signed in as ', el('strong', null, s.user.email || 'your account'), '.'));
    box.appendChild(el('p', { class: 'acct-lead' }, "Signing in has created a login with your email address. One more step before your children's profiles and progress are saved to your account. This is what will be stored:"));
    box.appendChild(
      el(
        'ul',
        { class: 'acct-list' },
        el('li', null, 'your email address, to sign you in (with Google, also your name, picture link and Google account id);'),
        el('li', null, "each child's nickname and picture;"),
        el('li', null, 'for each activity: stars, number of plays, how many questions were answered and how many right first time, when it was last played, and short notes of slips;'),
        el('li', null, 'the IP address and browser of each device you sign in on, and a security log of sign-ins (these started when you signed in);'),
        el('li', null, 'when you agreed, when records were changed, and when progress was last reset.')
      )
    );
    box.appendChild(el('p', { class: 'muted' }, 'No child email, no photos, no location, no ads and no tracking. Full details, including how long things are kept, are in the ', el('a', { href: '#privacy' }, 'privacy notice'), '.'));
    var upload = profilesToUpload();
    if (upload.length) {
      box.appendChild(el('p', { class: 'acct-lead' }, 'These profiles on this device will be saved to your account:'));
      box.appendChild(
        el(
          'ul',
          { class: 'acct-profiles' },
          upload.map(function (c) {
            return el('li', null, el('span', { 'aria-hidden': 'true' }, c.avatar + ' '), c.name, c.starter ? ' (the starter profile; not added if your account already has children)' : '');
          })
        )
      );
      box.appendChild(el('p', { class: 'acct-note' }, 'Remove any that are not your children (in Your children, below) before agreeing.'));
    }
    var agree = el(
      'button',
      {
        class: 'btn acct-agree',
        type: 'button',
        disabled: busy || !acctUi.consentChecked,
        onclick: function () {
          if (!acctUi.consentChecked) return;
          if (!gatePassed()) {
            renderGate('Parent corner', resumeAt('.acct-agree')); // comes back with the box still ticked
            return;
          }
          acctUi.busy = 'consent';
          acctUi.consentErr = false;
          acctUi.consentMsg = 'Turning on sync…';
          announce('Turning on sync…');
          renderAccount(true);
          Promise.resolve()
            .then(function () {
              return MQ.sync.giveConsent();
            })
            .then(function () {
              acctUi = {};
              announce('Sync is on.');
              renderAccount(true);
              focusIn(document.getElementById('acct-panel'), '#acct-h');
            })
            .catch(function (e) {
              acctUi.busy = '';
              acctUi.consentMsg = 'Could not turn on sync: ' + errText(e);
              acctUi.consentErr = true;
              announce(acctUi.consentMsg);
              renderAccount(true);
            });
        },
      },
      'Agree and turn on sync'
    );
    var chk = el('input', {
      id: 'acct-consent',
      type: 'checkbox',
      checked: !!acctUi.consentChecked,
      disabled: busy,
      onchange: function () {
        acctUi.consentChecked = chk.checked;
        agree.disabled = !chk.checked;
      },
    });
    box.appendChild(el('label', { class: 'acct-check', for: 'acct-consent' }, chk, el('span', null, 'I am the parent or legal guardian of the children I add, and I agree to the ', el('a', { href: '#privacy' }, 'privacy notice'), '.')));
    box.appendChild(el('div', { class: 'acct-btns' }, agree));
    box.appendChild(msg);
    // After the privacy notice changed, the profiles here may still be this account's.
    box.appendChild(signOutControl(MQ.sync.deviceFromAccount()));
    // Not agreeing is fine too: the login can be deleted here (the device keeps its own profiles).
    box.appendChild(deleteControl(!MQ.sync.deviceFromAccount()));
  }
  function tryAgainButton() {
    return el(
      'button',
      {
        class: 'btn btn-ghost',
        type: 'button',
        onclick: function () {
          MQ.sync.syncNow();
        },
      },
      'Try again'
    );
  }
  /** Signed in, but the account could not be checked yet (e.g. offline). */
  function checkingBox(box, s) {
    box.appendChild(el('p', null, 'Signed in as ', el('strong', null, s.user.email || 'your account'), '.'));
    var text = s.status === 'offline' ? 'Offline — your account will be checked when you are back online. Progress is saved on this device.' : s.status === 'error' ? 'Could not check your account: ' + errText(s.lastError) : 'Checking your account…';
    box.appendChild(el('p', { class: 'acct-status acct-status-' + s.status }, text));
    if (s.status === 'error' || s.status === 'offline') box.appendChild(tryAgainButton());
    box.appendChild(signOutControl(MQ.sync.deviceFromAccount()));
    if (s.status === 'error') box.appendChild(deleteControl(!MQ.sync.deviceFromAccount()));
  }
  /** Signed in on this device, but the sign-in could not be renewed yet (offline when the page opened). */
  function reconnectingBox(box) {
    box.appendChild(el('p', { class: 'acct-status acct-status-offline' }, 'Could not reach your account yet — it will reconnect when the connection is back. Progress is saved on this device.'));
    box.appendChild(tryAgainButton());
    box.appendChild(signOutControl(!!MQ.store.raw().accountId));
  }
  /**
   * This device holds another account's profiles with progress that never reached that
   * account (its sign-in ended without "Sign out"). Nothing syncs until the parent chooses.
   */
  function otherAccountBox(box, s) {
    var msg = msgEl('acct-msg', acctUi.dlMsg, acctUi.dlErr);
    box.appendChild(el('p', null, 'Signed in as ', el('strong', null, s.user.email || 'your account'), '.'));
    box.appendChild(el('p', { class: 'acct-problem', role: 'alert' }, 'This device has children’s progress from a different account that was never saved to it. Choose what to do with it before this account is used here.'));
    box.appendChild(
      el(
        'ul',
        { class: 'acct-list' },
        el('li', null, 'To keep it: sign out, then sign in with the other account (for example the other email address, or Google) and it is saved there.'),
        el('li', null, 'Or download a copy, then remove it from this device.')
      )
    );
    box.appendChild(el('div', { class: 'acct-btns' }, downloadButton(msg)));
    box.appendChild(msg);
    box.appendChild(signOutControl(false));
    if (acctUi.discarding) {
      box.appendChild(el('p', { class: 'acct-warn' }, 'This removes those profiles and their unsaved progress from this device. It cannot be undone.'));
      box.appendChild(
        el(
          'div',
          { class: 'acct-btns' },
          el(
            'button',
            {
              class: 'btn btn-danger acct-discard-yes',
              type: 'button',
              onclick: function () {
                if (!gatePassed()) {
                  renderGate('Parent corner', resumeAt('.acct-discard-yes'));
                  return;
                }
                acctUi = {};
                kidsUi = {};
                parentSel = null;
                announce('Removed. Using this account on this device.');
                MQ.sync.useThisAccount();
                rerenderParent();
              },
            },
            'Yes, remove them and use this account'
          ),
          el(
            'button',
            {
              class: 'btn btn-ghost acct-discard-cancel',
              type: 'button',
              onclick: function () {
                acctUi.discarding = false;
                renderAccount(true);
                focusIn(document.getElementById('acct-panel'), '.acct-discard');
              },
            },
            'Cancel'
          )
        )
      );
    } else {
      box.appendChild(
        el(
          'button',
          {
            class: 'btn btn-ghost acct-discard',
            type: 'button',
            onclick: function () {
              acctUi.discarding = true;
              renderAccount(true);
              focusIn(document.getElementById('acct-panel'), '.acct-discard-yes');
            },
          },
          'Remove it from this device and use this account'
        )
      );
    }
  }
  /**
   * Signed out, but the profiles on this device came from an account (its sign-in ended by
   * itself, e.g. it expired or was ended on another device): offer to clear them.
   */
  function leftoverBox(box) {
    var unsaved = MQ.sync.hasUnsaved();
    var wrap = el('div', { class: 'acct-leftover' });
    wrap.appendChild(
      el('p', { class: 'acct-note' }, "The children's profiles on this device came from an account that is no longer signed in here. Sign in again to keep saving, or remove them from this device" + (unsaved ? ' (the newest progress here was not saved and would be lost).' : '.'))
    );
    if (acctUi.clearing) {
      wrap.appendChild(
        el(
          'div',
          { class: 'acct-btns' },
          el(
            'button',
            {
              class: 'btn btn-danger acct-clear-yes',
              type: 'button',
              onclick: function () {
                if (!gatePassed()) {
                  renderGate('Parent corner', resumeAt('.acct-clear-yes'));
                  return;
                }
                acctUi = {};
                kidsUi = {};
                parentSel = null;
                MQ.sync.clearDevice(); // a child removal not sent yet is kept for that account
                announce('The profiles were removed from this device.');
                focusNext = '#acct-h';
                rerenderParent();
              },
            },
            'Yes, remove them from this device'
          ),
          el(
            'button',
            {
              class: 'btn btn-ghost acct-clear-cancel',
              type: 'button',
              onclick: function () {
                acctUi.clearing = false;
                renderAccount(true);
                focusIn(document.getElementById('acct-panel'), '.acct-clear');
              },
            },
            'Cancel'
          )
        )
      );
    } else {
      wrap.appendChild(
        el(
          'button',
          {
            class: 'btn btn-ghost acct-clear',
            type: 'button',
            onclick: function () {
              acctUi.clearing = true;
              renderAccount(true);
              focusIn(document.getElementById('acct-panel'), '.acct-clear-yes');
            },
          },
          'Remove the profiles from this device'
        )
      );
    }
    box.appendChild(wrap);
  }
  function signedInBox(box, s) {
    var msg = msgEl('acct-msg', acctUi.dlMsg, acctUi.dlErr);
    box.appendChild(el('p', null, 'Signed in as ', el('strong', null, s.user.email || 'your account'), '.'));
    box.appendChild(el('p', { class: 'acct-status acct-status-' + s.status }, statusText(s)));
    if (s.status === 'error') box.appendChild(tryAgainButton());
    box.appendChild(el('div', { class: 'acct-btns' }, downloadButton(msg)));
    box.appendChild(msg);
    box.appendChild(signOutControl(true));
    box.appendChild(deleteControl(false));
  }
  /** Fills the account card (#acct-panel). Skips the work if nothing it shows has changed. */
  function renderAccount(force) {
    var s = syncState();
    var where = document.getElementById('acct-where');
    if (where) {
      // With accounts switched off the account card already says this.
      var w = s && (s.enabled || s.startFailed) ? savedWhereText() : '';
      where.textContent = w;
      where.hidden = !w;
    }
    var box = document.getElementById('acct-panel');
    if (!box) return;
    var key = s ? [s.enabled, s.ready, s.startFailed, s.user ? s.user.id + s.user.email : '', s.consented, s.consentKnown, s.status, s.lastError, s.signInError, s.reconnecting, s.otherAccount].join('|') : 'none';
    if (!force && key === acctKey) return;
    acctKey = key;
    if (s && s.user && s.consented && s.status !== acctStatus && s.status !== 'syncing' && acctStatus !== null) announce(statusText(s));
    acctStatus = s && s.user && s.consented ? s.status : null;
    // Keep keyboard focus on the same control when the card is rebuilt.
    var had = focusMemo(box);
    MQ.clear(box);
    box.appendChild(el('h2', { id: 'acct-h', tabindex: '-1' }, 'Account and saving'));
    if (s && s.startFailed) {
      box.appendChild(el('p', { class: 'acct-lead' }, 'Could not connect to your account right now. Progress is still saved on this device.'));
      box.appendChild(
        el(
          'div',
          { class: 'acct-btns' },
          el(
            'button',
            {
              class: 'btn',
              type: 'button',
              onclick: function () {
                MQ.sync.retry().then(function () {
                  renderAccount(true);
                });
                renderAccount(true);
              },
            },
            'Try again'
          )
        )
      );
    } else if (!s || !s.enabled) {
      var msg = msgEl('acct-msg', acctUi.dlMsg, acctUi.dlErr);
      box.appendChild(el('p', { class: 'acct-lead' }, 'Progress is saved in this browser on this device only.'));
      box.appendChild(el('p', { class: 'muted' }, 'Parent accounts (to keep progress safe and use it on other devices) are not switched on for this website. Clearing this browser’s data also clears the stars, so you may like to download a copy now and then.'));
      box.appendChild(el('div', { class: 'acct-btns' }, downloadButton(msg)));
      box.appendChild(msg);
    } else if (!s.ready) {
      box.appendChild(el('p', { class: 'acct-status' }, 'Connecting…'));
    } else if (!s.user && s.reconnecting) {
      reconnectingBox(box);
    } else if (!s.user) {
      signInBox(box, s);
    } else if (s.otherAccount) {
      otherAccountBox(box, s);
    } else if (!s.consented && !s.consentKnown) {
      checkingBox(box, s);
    } else if (!s.consented) {
      consentBox(box, s);
    } else {
      signedInBox(box, s);
    }
    if (had) {
      var match = findAgain(box, had);
      if (match && !match.disabled) focusAgain(match, had);
      else focusEl(box.querySelector('#acct-h'));
    }
  }

  function renderParent() {
    screen = 'parent';
    var kids = MQ.store.children();
    var nowChild = MQ.store.currentChild();
    if (
      !parentSel ||
      !kids.some(function (c) {
        return c.id === parentSel;
      })
    ) {
      parentSel = nowChild ? nowChild.id : kids[0].id;
    }
    var sel = kids.filter(function (c) {
      return c.id === parentSel;
    })[0];
    var page = el('main', { class: 'page parent' });
    page.appendChild(
      el(
        'section',
        { class: 'card' },
        el('h1', null, '👪 Parent corner'),
        el('p', null, 'Sit with your child for 15–20 minutes a day: one activity, then the matching workbook pages. Open the "Parent corner" panel inside each activity for what to say and what to watch for.'),
        el('p', { class: 'muted', id: 'acct-where' }, savedWhereText()),
        // For the site owner: with accounts on, families must be able to reach someone about their data.
        syncState() && syncState().enabled && !(MQ.config || {}).contactEmail
          ? el('p', { class: 'acct-problem' }, 'Note for the site owner: add a contact email (contactEmail in js/config.js) before sharing this site. The privacy notice needs it.')
          : null
      )
    );
    page.appendChild(el('section', { class: 'card acct', id: 'acct-panel', 'aria-labelledby': 'acct-h' }));
    page.appendChild(kidsCard(kids, sel));
    page.appendChild(dashboardCard(sel));
    page.appendChild(el('section', { class: 'card', 'aria-labelledby': 'settings-h' }, el('h2', { id: 'settings-h' }, 'Settings'), resetControl(sel), el('p', { class: 'privacy-link' }, el('a', { href: '#privacy' }, 'Privacy'))));
    MQ.clear(root);
    root.appendChild(topbar('Parent corner'));
    mount(page);
    renderAccount(true);
    var f = focusNext && root.querySelector(focusNext);
    focusNext = null;
    if (f) focusEl(f);
  }
  /** What has keyboard focus inside container, so it can be found again after a re-render. */
  function focusMemo(container) {
    var ae = document.activeElement;
    if (!ae || ae === document.body || ae === container || !container.contains(ae)) return null;
    var card = ae.closest && ae.closest('.card');
    var had = {
      id: ae.id,
      tag: ae.tagName,
      cls: ae.className,
      text: ae.textContent,
      href: ae.getAttribute('href'),
      card: card ? Array.prototype.indexOf.call(container.querySelectorAll('.card'), card) : -1,
    };
    // Where the text cursor was in a text box (not available for every kind of box, e.g. email).
    try {
      if (typeof ae.selectionStart === 'number') {
        had.selStart = ae.selectionStart;
        had.selEnd = ae.selectionEnd;
      }
    } catch (e) {}
    return had;
  }
  /** Focus the control found again; a text box gets its text cursor back where it was. */
  function focusAgain(node, had) {
    focusEl(node);
    if (node.tagName !== 'INPUT' || typeof had.selStart !== 'number') return;
    try {
      node.setSelectionRange(had.selStart, had.selEnd);
    } catch (e) {}
  }
  /** The same control in the rebuilt container: by id, link address, or class and text. */
  function findAgain(container, had) {
    var match = had.id ? document.getElementById(had.id) : null;
    if (match && !container.contains(match)) match = null;
    if (!match && had.href) {
      match = Array.prototype.filter.call(container.querySelectorAll('a[href]'), function (n) {
        return n.getAttribute('href') === had.href;
      })[0];
    }
    if (!match) {
      match = Array.prototype.filter.call(container.querySelectorAll(had.tag), function (n) {
        return n.className === had.cls && n.textContent === had.text;
      })[0];
    }
    return match || null;
  }
  /**
   * Re-render a screen in place (a sync update, another tab) keeping the scroll position and
   * keyboard focus: the same control is found again (see findAgain), otherwise the first
   * control of the same card.
   */
  function rerenderKeepingFocus(render) {
    var had = focusMemo(root);
    keepScroll(render);
    if (!had || root.contains(document.activeElement)) return;
    var match = findAgain(root, had);
    if (!match && had.card >= 0) {
      var c = root.querySelectorAll('.card')[had.card];
      match = c && c.querySelector('button:not([disabled]), a[href], input:not([disabled])');
      had = {}; // another control: no text cursor to bring back
    }
    if (match && !match.disabled) focusAgain(match, had);
  }
  /** The parent did something: show the gate again first if it ran out. */
  function rerenderParent() {
    if (!gatePassed()) {
      parentStale = false;
      renderGate('Parent corner', renderParent);
      return;
    }
    refreshParent();
  }
  /**
   * A background update (a sync, another tab) of the Parent corner that is already showing. It
   * does not bring up the gate: every action re-checks it (rerenderParent, gatePassed()).
   */
  function refreshParent() {
    parentStale = false;
    // A chosen next control (focusNext) wins; otherwise keep focus where it was.
    if (focusNext) keepScroll(renderParent);
    else rerenderKeepingFocus(renderParent);
  }

  /* ---------------- privacy notice ---------------- */
  function renderPrivacy() {
    screen = 'privacy';
    var cfg = MQ.config || {};
    // Accounts switched off by the site owner (js/config.js): data saved in an account earlier
    // can then only be reached through the owner.
    var accountsOn = !!((cfg.supabaseUrl && cfg.supabaseAnonKey) || cfg.createClient);
    // A new link each time it is used (one DOM node can only be in one place).
    function contact() {
      return cfg.contactEmail ? el('a', { href: 'mailto:' + cfg.contactEmail }, cfg.contactEmail) : 'the site owner';
    }
    function sec(title) {
      var s = el('section', { class: 'privacy-sec' }, el('h2', null, title));
      for (var i = 1; i < arguments.length; i++) if (arguments[i]) s.appendChild(arguments[i]);
      return s;
    }
    function ul() {
      var list = el('ul');
      for (var i = 0; i < arguments.length; i++) list.appendChild(el('li', null, arguments[i]));
      return list;
    }
    var page = el(
      'main',
      { class: 'page privacy-page' },
      el(
        'article',
        { class: 'card privacy' },
        el('p', { class: 'privacy-draft', role: 'note' }, 'Draft — to be checked by a qualified person before the site is public.'),
        el('h1', null, 'Privacy notice'),
        el('p', { class: 'lead' }, (cfg.siteName || 'Interactive Maths') + ' is a maths practice website for children, used together with a parent or guardian. This notice explains, in plain words, what is saved and why. It is written with India’s Digital Personal Data Protection Act, 2023 (DPDP Act) in mind.'),
        sec('Who runs this website', el('p', null, 'This website is run by its owner for families to use. It is not run by an advertising or data company. For questions or requests, contact ', contact(), '.')),
        sec(
          'What is stored',
          ul(
            'For the parent or guardian: the email address used to sign in (only if you choose to sign in). Asking for a sign-in link already creates a login with that email address, even if the link is never opened; the site owner removes logins that were never used from time to time. If you use “Continue with Google”, Google also shares your name, a link to your Google profile picture and your Google account id; these are kept with your login but not used by this site.',
            "For each child: a nickname and an emoji picture chosen by the parent. No surname is needed.",
            'For each activity a child plays: stars, number of plays, how many questions were answered and how many were right first time, the time it was last played, and short labels for slips (for example “counted the gaps”). The time a child profile or record was created or last changed, and when progress was last reset.',
            'The date and version of this notice that you agreed to.',
            'The IP address and browser of each device you are signed in on, kept until you sign out there while online, or delete the account. A device that was signed out without a connection, or whose browser data was cleared, stays listed until the account is deleted or the site owner’s regular clean-up removes it.',
            'A security log of sign-ins kept by the sign-in service (time, IP address, your email address and what happened, for example “signed in” or “link requested”). It is deleted when you delete your account, or at the latest by the site owner’s next monthly clean-up.',
            'Technical request logs: the database and sign-in service records each request (time, IP address, browser, the address asked for and, for sign-in requests, your email address or account id), and the email-sending service and the web host keep their own logs. These are deleted when those services’ log periods end (typically days to weeks), not when you delete your account.'
          )
        ),
        sec('What is NOT collected', ul('No email address or account for children.', 'No photos, voice recordings or location.', 'No advertising, no tracking cookies, no behavioural profiling of children.', 'Nothing is sold or shared for marketing.')),
        sec('Why it is stored', el('p', null, 'Only to save your child’s progress, show it to you in the Parent corner, and let you continue on another device. It is not used for anything else.')),
        sec(
          'Where it is stored',
          el('p', null, 'On this device, in the browser’s own storage. If you sign in, a copy is kept in Supabase, a cloud database service, in a region chosen by the site owner (for example Mumbai, India). Each family can only see its own data.'),
          el('p', null, 'The site owner can see the stored data in order to run the site and answer your requests. Safety copies (backups) are kept for at most 30 days and then deleted, so data you delete is also gone from them within 30 days.')
        ),
        sec(
          'Other services this site uses',
          ul(
            'The site’s typeface (Nunito) is loaded from Google Fonts. Your browser asks Google for it, so Google sees your IP address and browser type. No progress or names are sent.',
            'If you choose “Continue with Google”, Google handles that sign-in.',
            'Sign-in links are sent by an email-sending service chosen by the site owner, which sees your email address and keeps a log of the emails it sent.',
            'The website itself is served by a web host chosen by the site owner. Like every website, it sees the IP address and browser of each visitor and may keep them in its access logs for a short time.'
          )
        ),
        sec('Parental consent', el('p', null, 'Only a parent or legal guardian may sign in and add children. Signing in creates a login with your email address (and, with Google, your name and picture link). Before your children’s profiles and progress are copied to the cloud, you are asked to confirm that you are the child’s parent or legal guardian and that you agree to this notice. If you do not agree, you can delete the login from the Parent corner.')),
        sec(
          'Your rights',
          el('p', null, 'From the Parent corner you can:'),
          accountsOn
            ? ul(
                'download a copy of your children’s profiles and progress saved on this device, with your account email (“Download my data”);',
                'correct a child’s details by changing the nickname or picture;',
                'remove a child, which deletes that child’s progress from your account and this device;',
                'delete your account, which deletes it and every child’s progress from the cloud and from this device. Other devices keep their own copy until you sign out there or clear that browser’s data.'
              )
            : ul('download a copy of your children’s profiles and progress saved on this device (“Download my data”);', 'correct a child’s details by changing the nickname or picture;', 'remove a child, which deletes that child’s progress from this device.'),
          accountsOn ? null : el('p', null, 'Accounts are switched off on this website. To see or delete data that was saved in an account earlier, contact ', contact(), '.'),
          el('p', null, 'For everything stored about you, including your login details, contact ', contact(), '.'),
          el('p', null, el('strong', null, 'Withdrawing consent: '), accountsOn ? 'delete your account in the Parent corner, or email ' : 'email ', contact(), '. Withdrawing is as easy as agreeing, and the data is then deleted as described above.'),
          el('p', null, el('strong', null, 'Questions and complaints: '), 'contact ', contact(), '. You will get a reply within 30 days. If you are not satisfied with the answer, you can complain to the Data Protection Board of India.')
        ),
        sec('Using the site without an account', el('p', null, 'You do not have to sign in. Without an account, progress is saved only in this browser on this device and is never sent to any server. (The web host and the typeface service still see the page requests; see “Other services”.) Clearing the browser’s data clears it.')),
        sec('How long it is kept', el('p', null, 'Until you delete it (and up to 30 days more in backups). Signing out removes your family’s progress from that device; it stays in your account until you delete the account. Technical logs are kept only for the services’ own log periods (see “What is stored”).')),
        sec('Changes to this notice', el('p', null, 'If this notice changes, you will be asked to agree again the next time you sign in. Current version: ', el('strong', null, String(cfg.consentVersion || '—')), '.')),
        // Opened from the Parent corner (e.g. the consent step's link): go back there.
        prevScreen === 'parent' || prevScreen === 'gate'
          ? el('p', null, el('a', { class: 'back', href: '#parent' }, '◀ Back to the Parent corner'))
          : el('p', null, el('a', { class: 'back', href: '#home' }, '◀ Back to home'))
      )
    );
    MQ.clear(root);
    root.appendChild(topbar('Privacy'));
    mount(page);
  }

  /* ---------------- router ---------------- */
  function isHomeHash(h) {
    return !h || h === '#' || h === '#home' || h === '#/';
  }
  var prevScreen = '';
  function route() {
    if (running && running.stop) running.stop();
    running = null;
    focusNext = null; // a step left on the gate (its Back link) is not resumed later
    screenStale = null; // the new screen is drawn fresh
    prevScreen = screen;
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    var raw = window.location.hash;
    var h = raw || '#home';
    // Accepts #play-<id> (current) and #/play/<id> (older links).
    var m = h.match(/^#\/?play[-\/]([\w-]+)/);
    if (m) renderPlay(m[1]);
    else if (/^#\/?parent/.test(h)) {
      // A sign-out or delete still on its way keeps its step (and its buttons disabled); a
      // sign-in link that was sent stays "Check your email". The consent tick is asked again.
      acctUi = acctUi.busy ? acctUi : acctUi.sent ? { sent: acctUi.sent } : {};
      kidsUi = {};
      parentSel = null;
      gated('Parent corner', renderParent);
    } else if (/^#\/?add-child/.test(h)) gated('Add a child', renderAddChild);
    else if (/^#\/?who/.test(h)) renderWho();
    else if (/^#\/?privacy/.test(h)) renderPrivacy();
    else if (/^#unit-(\d+)/.test(h)) renderUnit(parseInt(h.match(/^#unit-(\d+)/)[1], 10));
    else if (isHomeHash(raw) && ssGet(WHO_KEY) !== '1' && MQ.store.children().length > 1) {
      // First visit to home in this tab with several children: ask who is playing.
      try {
        window.history.replaceState(null, '', '#who');
      } catch (e) {}
      renderWho();
    } else renderMap();
    window.scrollTo(0, 0);
  }

  var parentStale = false; // the Parent corner skipped a re-render while a grown-up was typing
  function typing() {
    return document.activeElement && /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
  }
  // Home, a unit or "Who's playing?" skipped a re-render while a finger was down: { screen, hash }.
  var screenStale = null;
  /** Re-render home, a unit or "Who's playing?" in place (not route()): a background pull must not jump to "Who's playing?". */
  function refreshScreen() {
    screenStale = null;
    if (screen === 'who') rerenderKeepingFocus(renderWho);
    else if (screen === 'home') rerenderKeepingFocus(renderMap);
    else if (screen === 'unit') {
      rerenderKeepingFocus(function () {
        renderUnit(currentUnit);
      });
    }
  }
  /** Children or stars changed outside this screen (sync pulled, device wiped). */
  function onStoreChange(what) {
    if (running) return;
    if (what !== 'pull' && what !== 'wipe') return;
    if (screen === 'parent') {
      if (typing() || pointerDown) parentStale = true;
      else refreshParent();
    } else if (screen === 'who' || screen === 'home' || screen === 'unit') {
      // Replacing the card under a finger would swallow the child's tap: wait until it is done.
      if (pointerDown) screenStale = { screen: screen, hash: window.location.hash };
      else refreshScreen();
    } else refreshTopbar();
  }
  // Catch up once typing is over. Not while a mouse button or finger is down: Safari and Firefox
  // on a Mac do not focus a clicked button, so pressing "Save name" blurs the input before the
  // click, and replacing the form then would swallow the click and the typed name. Then it waits
  // until the click is done. Nor while focus moves to a button by keyboard; those handlers check
  // that the child still exists instead.
  var pointerDown = false;
  function catchUpParent() {
    if (parentStale && screen === 'parent' && !running && !pointerDown && !typing()) refreshParent();
  }
  document.addEventListener(
    'pointerdown',
    function () {
      pointerDown = true;
    },
    true
  );
  function pointerEnd() {
    if (!pointerDown) return;
    pointerDown = false;
    // After the click and submit handlers. A tap that went to another screen has already
    // shown it fresh (or is about to: the address changed).
    setTimeout(function () {
      catchUpParent();
      var st = screenStale;
      if (st && !running && !pointerDown && st.screen === screen && st.hash === window.location.hash) refreshScreen();
    }, 0);
  }
  document.addEventListener('pointerup', pointerEnd, true);
  document.addEventListener('pointercancel', pointerEnd, true);
  document.addEventListener('focusout', function () {
    setTimeout(function () {
      var ae = document.activeElement;
      if (!ae || ae === document.body) catchUpParent();
    }, 0);
  });

  window.addEventListener('hashchange', route);
  route();
  MQ.store.onChange(onStoreChange);
  if (MQ.sync) {
    MQ.sync.onChange(function () {
      renderAccount(false);
    });
    try {
      var started = MQ.sync.start();
      if (started && started.then) {
        started.then(function () {
          renderAccount(false);
        });
      }
    } catch (e) {
      console.error(e);
    }
  }
})();

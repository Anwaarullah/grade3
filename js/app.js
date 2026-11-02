/* Grade 3 Maths — app shell: lesson map, activity player, parent corner. */
(function () {
  'use strict';
  var MQ = window.MQ;
  var el = MQ.el;
  var cur = MQ.curriculum;
  var root = document.getElementById('app');
  var running = null;

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
  function nextRecommended() {
    var ids = allIds().filter(function (id) {
      return MQ.activities[id];
    });
    for (var i = 0; i < ids.length; i++) if (starsOf(ids[i]) === 0) return ids[i];
    var lowest = null;
    ids.forEach(function (id) {
      if (starsOf(id) < 3 && (lowest === null || starsOf(id) < starsOf(lowest))) lowest = id;
    });
    return lowest || ids[0];
  }
  function starRow(n, max) {
    max = max || 3;
    var s = el('span', { class: 'stars', 'aria-label': n + ' of ' + max + ' stars' });
    for (var i = 0; i < max; i++) s.appendChild(el('span', { class: i < n ? 'star on' : 'star' }, '★'));
    return s;
  }
  /* ---------------- top bar ---------------- */
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
    return el(
      'header',
      { class: 'topbar' },
      el('a', { class: 'brand', href: '#home' }, MQ.robot('happy', 30), el('span', null, 'Grade 3 Maths')),
      crumb ? el('span', { class: 'crumb' }, crumb) : null,
      el('span', { class: 'spacer' }),
      el('span', { class: 'total-stars', title: 'Stars collected' }, '★ ', String(MQ.store.totalStars())),
      soundBtn,
      voiceBtn,
      el('a', { class: 'icon-btn parent-link', href: '#parent', title: 'Parent corner' }, '👪')
    );
  }

  /* ---------------- lesson map ---------------- */
  function renderMap() {
    var rec = nextRecommended();
    var page = el('main', { class: 'page map' });
    var recMeta = meta(rec);
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
          rec ? el('a', { class: 'btn btn-big', href: '#play-' + rec }, 'Next activity: ' + recMeta.icon + ' ' + recMeta.title + ' ▶') : null
        )
      )
    );

    cur.units.forEach(function (u) {
      var ids = [];
      u.sections.forEach(function (s) {
        ids = ids.concat(s.activities);
      });
      var got = ids.reduce(function (sum, id) {
        return sum + starsOf(id);
      }, 0);
      var max = ids.length * 3;
      var unitEl = el(
        'section',
        { class: 'unit' },
        el(
          'div',
          { class: 'unit-head' },
          el('div', null, el('p', { class: 'kicker' }, 'Unit ' + u.number), el('h2', null, u.title)),
          el('div', { class: 'unit-progress' }, el('div', { class: 'bar' }, el('span', { style: { width: Math.round((got / max) * 100) + '%' } })), el('span', { class: 'bar-label' }, '★ ' + got + ' / ' + max))
        )
      );
      var sectionsEl = el('div', { class: 'sections' });
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
    });

    var up = el('div', { class: 'upcoming-grid' });
    cur.upcoming.forEach(function (u) {
      up.appendChild(el('div', { class: 'upcoming' }, el('span', { class: 'upcoming-num' }, String(u.number)), el('span', null, u.title)));
    });
    page.appendChild(el('section', { class: 'unit unit-upcoming' }, el('div', { class: 'unit-head' }, el('div', null, el('p', { class: 'kicker' }, 'Coming next'), el('h2', null, 'More units to come'))), up));
    page.appendChild(el('p', { class: 'footnote' }, 'Activities follow the order of Cambridge Primary Mathematics Stage 3. Practise with the matching workbook pages after each section.'));

    MQ.clear(root);
    root.appendChild(topbar(null));
    root.appendChild(page);
  }

  /* ---------------- activity player ---------------- */
  function renderPlay(id) {
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
        el('div', { class: 'play-head' }, el('a', { class: 'back', href: '#home' }, '◀ All activities'), el('h1', null, m.icon + ' ' + m.title), progress),
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
              el('a', { class: 'btn btn-ghost', href: '#home' }, 'All activities')
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

  /* ---------------- parent corner ---------------- */
  /** Two-step reset button (browser confirm dialogs are not available everywhere). */
  function resetControl() {
    var wrap = el('div', { class: 'reset-row' });
    function ask() {
      MQ.clear(wrap);
      wrap.appendChild(
        el(
          'button',
          {
            class: 'btn btn-danger',
            type: 'button',
            onclick: function () {
              MQ.clear(wrap);
              wrap.appendChild(el('p', { class: 'muted' }, 'Are you sure? This deletes all stars and progress on this device.'));
              wrap.appendChild(
                el(
                  'div',
                  { class: 'reset-btns' },
                  el(
                    'button',
                    {
                      class: 'btn btn-danger',
                      type: 'button',
                      onclick: function () {
                        MQ.store.reset();
                        renderParent();
                      },
                    },
                    'Yes, delete everything'
                  ),
                  el('button', { class: 'btn btn-ghost', type: 'button', onclick: ask }, 'Cancel')
                )
              );
            },
          },
          'Reset all progress'
        )
      );
    }
    ask();
    return wrap;
  }

  function renderParent() {
    var prog = MQ.store.load();
    var page = el('main', { class: 'page parent' });
    page.appendChild(
      el(
        'section',
        { class: 'card' },
        el('h1', null, '👪 Parent corner'),
        el('p', null, 'Sit with him for 15–20 minutes a day: one activity, then the matching workbook pages. Open the "Parent corner" panel inside each activity for what to say and what to watch for.'),
        el('p', { class: 'muted' }, 'Progress is saved in this browser on this laptop only.')
      )
    );
    var table = el('table', { class: 'progress-table' }, el('thead', null, el('tr', null, el('th', null, 'Activity'), el('th', null, 'Stars'), el('th', null, 'Plays'), el('th', null, 'Right first time'), el('th', null, 'Last played'), el('th', null, 'Slips to work on'))));
    var tbody = el('tbody');
    cur.units.forEach(function (u) {
      u.sections.forEach(function (s) {
        tbody.appendChild(el('tr', { class: 'section-row' }, el('td', { colspan: 6 }, s.id + ' ' + s.title)));
        s.activities.forEach(function (id) {
          var m = meta(id);
          var p = prog.activities[id];
          var pct = p && p.answered ? Math.round((p.firstTry / p.answered) * 100) + '%' : '—';
          var slips = p && p.mistakes ? Object.keys(p.mistakes).sort(function (a, b) {
            return p.mistakes[b] - p.mistakes[a];
          }) : [];
          tbody.appendChild(
            el(
              'tr',
              null,
              el('td', null, el('a', { href: '#play-' + id }, m.icon + ' ' + m.title)),
              el('td', null, starRow(p ? p.stars : 0)),
              el('td', null, p ? String(p.plays) : '0'),
              el('td', null, pct),
              el('td', null, p && p.lastPlayed ? new Date(p.lastPlayed).toLocaleDateString() : '—'),
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
    page.appendChild(el('section', { class: 'card' }, el('h2', null, 'Progress'), el('div', { class: 'table-wrap' }, table)));
    page.appendChild(
      el(
        'section',
        { class: 'card' },
        el('h2', null, 'Settings'),
        resetControl()
      )
    );
    MQ.clear(root);
    root.appendChild(topbar('Parent corner'));
    root.appendChild(page);
  }

  /* ---------------- router ---------------- */
  function route() {
    if (running && running.stop) running.stop();
    running = null;
    if (window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    var h = window.location.hash || '#home';
    // Accepts #play-<id> (current) and #/play/<id> (older links).
    var m = h.match(/^#\/?play[-\/]([\w-]+)/);
    if (m) renderPlay(m[1]);
    else if (/^#\/?parent/.test(h)) renderParent();
    else renderMap();
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  route();
})();

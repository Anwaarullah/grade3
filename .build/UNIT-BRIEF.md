# Unit build brief (temporary — not part of the website)

You are one of 16 parallel cloud sessions building **Grade 3 Maths**, the static website in this
repository. Unit 6 is finished and is the model to follow. Your job: build ONE unit
completely: its unit file and all of its activities. Then test them, have them independently
reviewed, fix the problems, commit and push.

## The learner and the setting
- Grade 3, Cambridge Primary Mathematics Stage 3 (IGCSE pathway), behind his class. He is fine with
  basic + and −, rounding and simple quarters, but **weak at multiplication and division**. Use
  equal groups, arrays, number lines, repeated addition and counting in jumps as visual bridges
  wherever × or ÷ appears, including hidden places such as money, measures and fractions of amounts.
- A parent sits beside him on a **laptop** (mouse + keyboard), 15–20 minutes a day. Clicking and
  dragging are both fine. Keep the reading light: short robot lines, big text, one idea per screen.
- Design: **plain and clean**, light background, **everyday objects** (home, school, shops, gardens,
  playgrounds). Bolt the robot is the only character (he talks through `api.say`). No space,
  planet, rocket, alien or fantasy theme.
- All content is **original**. Paraphrase; never copy textbook or workbook text or pictures.

## Read first
1. `ACTIVITY_API.md`: the activity contract and the unit file format. Follow it exactly.
2. `js/activities/which-unit.js`: a complete reference activity. Also skim two or three other
   Unit 6 activities (e.g. `ruler-lab.js`, `rectangle-builder.js`) for drag, grid and reveal patterns.
3. `js/units/unit-06.js`: the model for your unit file (sections, book refs, parent tips).
4. `js/core.js`, `js/components.js`, `css/style.css`: what you can use.
5. **Your unit's notes**: `.build/syllabus/unit-NN.md`. These are verified textbook and workbook
   extractions with number ranges, misconceptions, hidden workbook traps and a
   **Proposed activities** section. Build exactly those activities, with exactly those ids, in
   that order (`.build/activity-ids.json` lists the ids per unit; `index.html` already loads them).
   You may improve a design where the notes flag a problem, but keep the id.

## What to write (only these files)
- `js/units/unit-NN.js`: `window.MQ.addUnit(unit, activities)` like unit-06.js:
  - `unit`: `{ id: 'uN', number: N, title: <use MQ.curriculum.titles[N] wording>, sections: [...] }`.
    One section per textbook section (e.g. 5.1, 5.2, 5.3), each with `id`, `title`, `color`
    (from `MQ.curriculum.sectionColors`, in order), `book: 'Textbook p.a–b · Workbook p.c–d'`, and
    its `activities` ids in teaching order. Activities based on a project go in the section
    they extend (usually the last).
  - `activities`: for every id, `{ title, icon (one emoji), summary (one short child-facing line),
    book: 'Textbook p.. Q.. · Workbook p.. Q..', tips: { goal, say: [3 phrases], watch: [2–3 mistakes],
    offline: one away-from-screen task } }`. The tips are for the parent; make them specific.
- `js/activities/<id>.js` for every id in your unit.
Do NOT edit any other file (core, components, app, curriculum, style, index.html, other units,
other activities, docs). Other sessions are working in parallel and only your files will be merged.

## Activity rules
- 2–4 learn screens (show, then let him touch: something to look at or interact with on every
  screen; `api.lockNext()` until a key interaction is done), then 8–10 practice questions.
- Every practice question calls `api.check(ok, hint, mistakeTag)`. Hints are specific and kind and
  point at the likely mistake, with a stronger hint on the 2nd try via `api.tries()`. Mistake tags are
  short parent-readable phrases. Every question registers `api.onReveal(fn)`, which shows the
  answer **with the working**, visually.
- Raise difficulty with `api.level`. Use the exact number ranges from the notes. Build the deck when
  `api.index === 0` or when it is missing; no duplicate questions in one run.
- Maths must be exactly right: compute answers from the same data you draw. Anything the child
  counts or measures from the picture must be drawn to scale. Do not copy known book misprints
  (the notes list them).
- Use `api.later` instead of `setTimeout`; pass drag unbinds and window listeners to `api.cleanup`.
- Activity CSS goes in a `<style data-activity="<id>">` added by the file, with class names prefixed
  by a short code. Must work at 1366×900 and still be usable at 800px wide, with no horizontal page
  scroll (SVGs scale with viewBox and max-width:100%).
- Do not use `alert`, `confirm`, `prompt` or `window.open`. Internal links use `#play-<id>` / `#unit-N`.

## How to work
- You have 4 CPUs. Use the **Agent tool** to build activities in parallel, **at most 2 at a time**,
  each agent restricted to its own activity file and given this brief, the notes section for
  its activity, and the rules above. You write the unit file yourself.
- Test every activity:
  1. `node tools/smoke.js <ids...> --out /tmp/smoke`: every learn and practice screen must render
     with no errors. Read several screenshots per activity and fix anything cramped, overlapping,
     clipped or confusing.
  2. A Playwright script (outside the repo; `require('playwright')` works anywhere; load
     `file://<repo>/index.html#play-<id>`; block fonts.googleapis/gstatic) that, for each activity,
     goes through all practice questions: a wrong answer shows a hint and Next stays disabled; a correct answer
     enables Next; two wrong answers show "Show me" (`.controls .btn-ghost`), and clicking it enables Next.
     Exercise drags with `page.mouse`. The finish screen must appear after the last question. Also
     load at 800px width and check `document.documentElement.scrollWidth <= innerWidth`.
  3. For number-generating activities, a quick script that builds many decks and asserts the
     answers against an independent computation.
  4. Open `index.html#unit-N` and check your unit page shows all sections and activities.
- **Independent review**: when everything is built and passing, spawn ONE fresh reviewer agent
  that did not write the code. Have it check maths correctness first, then teaching quality for this
  child, interactions, layout and robustness, run its own tests, and report defects. Fix what it
  finds, then re-run your tests.
- Commit ONLY `js/units/unit-NN.js` and your `js/activities/*.js` files with a clear message and push to
  your branch (`git push -u origin HEAD`). Do not commit `.build/`. Do not open a pull request.
- End with a short report: each activity (learn screens, practice types), test results, what the
  reviewer found and fixed, and anything still uncertain.

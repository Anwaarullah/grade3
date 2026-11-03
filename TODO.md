# Grade 3 Maths — requests and to-do list

Everything asked for so far, what is done, and what is still open.
Last updated: 3 November 2026.

## About the learner and the site (decisions so far)

- Grade 3, Cambridge Primary Mathematics Stage 3 (Learner's Book 3 + Workbook 3, 2nd edition).
- Behind his class. Fine with basic + and −, rounding and quarters; **weak at × and ÷**.
- A parent sits beside him on a **laptop**, 15–20 minutes a day.
- Design: **plain and clean**, light background, **everyday objects**, Bolt the robot as the only
  character (the space/planet theme was removed on request).
- **Book order** for the units. **Dollars** kept in the money activities (matches the book).
- Big jobs are **split across parallel cloud sessions**, **4 at a time** (the 5-hour usage limit
  was hit when 16 ran at once).
- To save usage, later units had a **maths-only independent review** (no browser play-throughs).
- Hosting: the parent's **own domain**. A private claude.ai preview link is kept updated.

## Done

- [x] Analysed the textbook (FlipHTML5) and workbook (photos, then the online FlipHTML5 copy).
- [x] Built the site: home page with all 17 units, unit pages, activity player (learn screens,
      practice, hints, "Show me" with working, stars), Parent corner panel in every activity,
      parent dashboard (stars, right-first-time, common slips), sound and read-aloud.
- [x] Unit 6 first (12 activities), then all other units: **17 units, 105 activities**.
- [x] Verified syllabus notes for every unit (textbook + workbook, hidden traps, misprints).
- [x] Independent reviews: full review for Units 1–4 and 6; maths-only for Units 5 and 7–17.
- [x] Final automated play-through of all 105 activities at 1366px and 800px: every activity
      finishes, no errors, no sideways scrolling. CSS class clash fixed (Prism or Pyramid → `pyr-`).
- [x] README with deployment steps and the full unit/activity list.
- [x] Preview published: https://claude.ai/artifact/BvVzaRmMn9TbZJtsrW6fg3
- [x] Code pushed to branch `claude/magical-hamilton-czx145`.

## Open: tidy-up (needs the parent, Claude lacks permission)

- [ ] Delete temporary GitHub branches: `claude/u6-build-a` … `-d`, `claude/u6-build-kit`,
      `claude/u6-review-kit`, `claude/u6-review-61/62/63`, `claude/syllabus-kit`, `claude/syl-*`,
      `claude/units-build-kit`, `claude/unit-NN-build`.
- [ ] Optional: photos of the 4 pages missing from the online scans (textbook p.136–137 in
      Unit 9.1; workbook p.247–248 in Unit 17.2).
- [ ] Layout/usability check of Units 5 and 7–17 (they only had the maths-only review). Report
      any cramped screen or unresponsive button by activity name.

## Open: publish for other children (requested 3 Nov 2026)

Decisions: **public** site, **India** first, progress **synced across devices**, sign-in with
**Google + email link**, phones supported ("works, best on tablet"), **keep dollars**,
start with **Phase 1**.

### Phase 1: parent accounts and cloud sync (in progress)
- [x] Store rewritten for **child profiles** (`js/core.js`): each child's progress kept separately;
      old single-player progress moves into a "Player 1" profile; changes marked for syncing.
- [x] `js/config.js` (Supabase URL/key, contact email, consent version; empty = on-device mode).
- [x] `js/sync.js`: Supabase sign-in (Google, email link, PKCE), offline-first sync with merge
      (never loses stars), consent check, sign out, delete account, export data.
- [ ] **App screens** (`js/app.js`): "Who's playing?" profile picker + add child; child chip in the
      top bar; parent gate; account panel (sign in / consent / sync status / sign out / download
      data / delete account); manage children (rename/remove); dashboard per child; privacy page.
- [ ] Load `js/config.js` and `js/sync.js` in `index.html`; styles for the new screens.
- [ ] `backend/schema.sql`: tables `parents`, `children`, `progress` with row-level security
      (each family sees only its own data), `delete_my_account()` function.
- [ ] `docs/SETUP-ACCOUNTS.md`: step-by-step Supabase setup (Mumbai region), Google sign-in,
      email link, redirect URLs. **The parent creates the Supabase account.**
- [ ] Tests with a fake Supabase client (sign-in, consent, sync between two devices, offline).
- [ ] Note: cloud sync cannot work inside the claude.ai preview (it blocks outside servers);
      test on the parent's own domain.
- Note: the parent gate (a 13–19 × 6–9 question, with a 30-second wait after 3 wrong answers in a
  row) is a speed bump, not a lock: a child who has done Unit 11 could work it out. The real
  safeguard is the second confirmation step on every destructive action (remove, reset, sign out,
  delete account).
- Note: the store rewrite is committed and safe on its own: if no profile exists it creates
  "Player 1" automatically. config.js and sync.js are committed but not loaded by index.html yet.

### Phase 2: privacy and legal basics (India DPDP Act)
- [ ] Only the parent has an account; children get a nickname only, no email.
- [ ] Consent step at sign-up (parent/guardian confirmation, agree to privacy policy).
- [ ] Privacy policy page (draft by Claude; **have it checked by someone qualified**).
- [ ] "Download my data" and "Delete my account" (account + all children's data).
- [ ] No ads, no tracking or behavioural profiling of children.

### Phase 3: every device
- [ ] Test all 105 activities on tablet and phone sizes with touch; fix drag/layout problems.
- [ ] Phones: everything works; activities that need space show a "best on a bigger screen" note.
- [ ] Load each activity only when opened (faster on mobile data).
- [ ] Installable "add to home screen" app, works offline.

### Phase 4: public-ready
- [ ] Neutral wording: about 70 parent tips and a few screens say "him/his" → "your child".
- [ ] Branding: "Aligned to the Cambridge Primary Stage 3 curriculum — not affiliated with or
      endorsed by Cambridge"; no Cambridge logos.
- [ ] "Report a problem" button in every activity.
- [ ] Full quality pass on Units 5 and 7–17 (layout and play-through, not just maths).

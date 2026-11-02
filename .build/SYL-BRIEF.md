# Syllabus extraction brief (temporary — not part of the website)

You are one of several parallel cloud sessions preparing the next units of **Grade 3 Maths**,
the static website in this repository. Unit 6 is already built (see `js/curriculum.js`,
`js/activities/`, and `ACTIVITY_API.md`). Your job is to turn the textbook pages for YOUR
units into verified syllabus notes plus a proposed list of interactive activities, so build
sessions can later implement them.

## The learner
Grade 3, Cambridge Primary Mathematics Stage 3 (IGCSE pathway). Behind his class. Fine with
basic + and −, rounding and simple quarters, but **weak at multiplication and division**.
A parent sits beside him on a laptop (mouse + keyboard) for 15–20 minutes a day.
Site design: plain and clean, everyday objects (home, school, shops, gardens), Bolt the robot
is the only character. No space/fantasy theme.

## Source
Cambridge Primary Mathematics **Learner's Book 3** (2nd edition, Moseley & Rees), scanned
page images on FlipHTML5. `.build/pages.txt` lists `<image-index> <url>` for all 294 images.
**Image index = printed page number + 4** (the scan duplicates two early pages). Check the
printed page number in the page corner as you go; if the offset drifts, adjust and say so.

Contents (printed page numbers):

| Unit | Title | Pages |
|---|---|---|
| 1 | Numbers to 1000 (1.1 Hundreds, tens and ones; 1.2 Comparing and ordering; 1.3 Estimating and rounding) | 10–23 |
| 2 | Statistics: tally charts and frequency tables (2.1) | 24–35 |
| 3 | Addition, subtraction and money (3.1 Addition; 3.2 Subtraction; 3.3 Money) | 36–53 |
| P1 | Project 1: Surprising sums | 54–55 |
| 4 | 3D shapes (4.1) | 56–68 |
| P2 | Project 2: Prism to pyramid | 69–70 |
| 5 | Multiplication and division (5.1 Exploring ×/÷; 5.2 Connecting 2×, 4× and 8×; 5.3 Connecting 3×, 6× and 9×) | 71–88 |
| 6 | (done) Measurement, area and perimeter | 89–114 |
| 7 | Fractions of shapes (7.1 Fractions and equivalence of shapes) | 117–124 |
| 8 | Time (8.1) | 125–132 |
| 9 | More addition and subtraction (9.1 Regrouping tens and reordering; 9.2 Subtraction: regrouping tens; 9.3 Complements) | 133–149 |
| 10 | Graphs (10.1 Pictograms and bar charts; 10.2 Venn and Carroll diagrams) | 150–167 |
| 11 | More multiplication and division (11.1 Revisiting; 11.2 Playing with; 11.3 Extending) | 168–182 |
| 12 | More fractions (12.1 Fractions of numbers; 12.2 Ordering and comparing; 12.3 Calculating with fractions) | 183–198 |
| P4 | Project 4: Dicey fractions | 199 |
| 13 | Measure (13.1 Mass; 13.2 Capacity; 13.3 Temperature) | 200–222 |
| 14 | Time (2) (14.1 Time; 14.2 Timetables) | 223–235 |
| 15 | Angles and movement (15.1 Angles, direction, position and movement) | 236–248 |
| 16 | Chance (16.1) | 249–257 |
| P5 | Project 5: Venn variety | 258–259 |
| 17 | Pattern and symmetry (17.1 Shape and symmetry; 17.2 Pattern and symmetry) | 260–274 |
| P6 | Project 6: How likely? | 275–276 |

## Steps
1. Download the page images for your units (`curl -sS -o pN.webp <url>`; work in a scratch
   folder **outside the repo**, e.g. `/tmp/pages`). Convert to PNG with Python PIL
   (`Image.open(f).convert('RGB').save(...)`). Read **every** page of your units with the
   Read tool. Do not skip pages.
2. For each unit write `.build/syllabus/unit-NN.md` (NN = two digits) following the structure
   of `.build/syllabus/EXAMPLE-unit-06-section-6.1.md`: for each section, the objectives
   (mark which are stated by the book vs inferred), official key words, key facts and rules,
   question types (what the child does, exact number ranges, difficulty core/stretch/challenge,
   printed page), worked examples (teaching point), likely misconceptions, prerequisites
   (flag every dependence on multiplication/division or place value), hands-on activities.
   Include any project pages that follow the unit.
3. **Verify**: do a second, independent pass. Re-read every page against your notes and fix
   omissions and errors (you may use the Agent tool for an independent checker that reads the
   same pages). Note anything ambiguous in the scan.
4. **Propose activities** at the end of each unit file, under `## Proposed activities`:
   3–6 activities per unit (roughly one per textbook section, more for big sections), ordered
   as taught. For each give:
   - `id` (kebab-case, unique across the whole book; do not reuse Unit 6 ids), `title`,
     `icon` (one emoji), `section` (e.g. 5.2), one-line `summary`, `book` refs (textbook pages/questions)
   - **Learn screens** (2–4): what is shown and what the child does on each
   - **Practice** (count 8–10): question types for level 1 / 2 / 3 with exact number ranges
   - **Mistake tags** (short, parent-readable)
   - **Parent tips**: goal (1 sentence), 3 things to say, 2–3 things to watch for, 1 away-from-screen task
   Make the activities genuinely interactive (drag, build, click on pictures), not worksheets.
   For multiplication/division-heavy units, use arrays, equal groups, number lines and
   repeated addition as visual bridges.
5. Paraphrase everything in your own words. Do **not** copy textbook text or exercises verbatim
   (the book is copyrighted). Describe question *types* and number ranges instead.
6. Commit ONLY your `.build/syllabus/unit-NN.md` files and push to your branch
   (`git push -u origin HEAD`). Do not modify any other file. Do not open a pull request.
7. End with a short report: units covered, page ranges actually read, any offset drift or
   unreadable pages, and the activity ids you proposed.

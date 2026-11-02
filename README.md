# Grade 3 Maths

An interactive maths website for a Grade 3 learner following **Cambridge Primary
Mathematics Stage 3** (Learner's Book 3 and Workbook 3, 2nd edition). It has a clean,
plain design, a friendly robot helper called Bolt, short activities of about 15 minutes,
stars, and a **Parent corner** with what to say and what to watch for in each activity.

The first set covers **Unit 6: Measurement, area and perimeter**:

| Section | Activities |
|---|---|
| 6.1 Measurement | Ruler Lab · Which Unit? · Unit Converter · Rounding Measurements · Estimate and Measure |
| 6.2 2D shapes and perimeter | Walk the Edge · Shape Sorter · Perimeter Puzzles |
| 6.3 Introducing area | Square Counter · Fence or Floor? · Rectangle Builder · Unit 6 Challenge |

Every activity is original. The books are used only to follow the same topics, order
and number ranges, and each activity lists the matching textbook and workbook pages.

## Putting it on your own website

The site is plain HTML, CSS and JavaScript. It has no build step, needs no server code
and no database.

1. Copy these files and folders to any folder on your web host, keeping the structure:
   ```
   index.html
   css/
   js/
   assets/
   ```
   (`tools/`, `ACTIVITY_API.md` and `README.md` are only for development and don't need uploading.)
2. Open the folder's address in a browser, e.g. `https://your-domain.example/maths/`.

All paths are relative, so it works in a sub-folder. You can also double-click
`index.html` to run it straight from the laptop with no internet (it then uses the
laptop's default font instead of Nunito).

**Progress** (stars, mistakes, settings) is saved in the browser on that laptop. Use the
same browser each time. "Reset all progress" is in the Parent corner.

## How to use it with your child

* One activity per session (15–20 minutes), sitting together.
* Open the **Parent corner** panel on the right of each activity: it gives the goal,
  phrases to use, the mistakes to watch for, and a quick hands-on task.
* After finishing a section, do the matching workbook pages (listed on the home page).
* The Parent corner page (👪 at the top) shows stars, how many questions he got
  right first time, and his most common slips.
* 🗣️ turns on read-aloud; 🔊 turns sound effects on or off.

## Development

* Each activity is one file in `js/activities/`. See `ACTIVITY_API.md` for the activity contract.
* `js/curriculum.js` holds the map, the book page references and the parent tips.
* Smoke test (needs Node and Playwright):
  ```bash
  node tools/smoke.js            # all activities + the map
  node tools/smoke.js ruler-lab  # one activity
  ```

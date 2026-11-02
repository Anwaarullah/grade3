# Grade 3 Maths

An interactive maths website for a Grade 3 learner following **Cambridge Primary
Mathematics Stage 3** (Learner's Book 3 and Workbook 3, 2nd edition). It has a clean,
plain design, a friendly robot helper called Bolt, short activities of about 15 minutes,
stars, and a **Parent corner** with what to say and what to watch for in each activity.

It covers all 17 units of the book: **105 activities**. The home page lists every unit
with star progress; each unit page shows its sections and activities.

| Unit | Topic | Activities |
|---|---|---|
| 1 | Numbers to 1000 | Build a number · Number grid jigsaw · Number word cards · Bigger or smaller? · Where on the line? · Rounding hill |
| 2 | Tally charts and frequency tables | Tally marks · Class survey · What does the table tell us? · Test your guess |
| 3 | Addition, subtraction and money | Adding with swaps · Take away with swaps · Ink blot puzzles · Dollars and cents · School shop · Digit sum detective |
| 4 | 3D shapes | 3D Shape Sorter · Prism or Pyramid? · Faces, Edges, Corners · Cube Builder · Straws and Clay · Mystery Shape |
| 5 | Multiplication and division | Equal Groups · Array Fact Family · Multiples Hunter · Times-10 Machine · Double It! 2s, 4s, 8s · Split and Add · Jump Along |
| 6 | Measurement, area and perimeter | Ruler Lab · Which Unit? · Unit Converter · Rounding Measurements · Estimate and Measure · Walk the Edge · Shape Sorter · Perimeter Puzzles · Square Counter · Fence or Floor? · Rectangle Builder · Unit 6 Challenge |
| 7 | Fractions of shapes | Fair Shares · Colour the Fraction · Fraction Strip Wall · Find the Whole · Tile Designer |
| 8 | Time | Hour Hand Hints · Five-Minute Ring · Past or To? · Clock Twins · Set the Clock |
| 9 | More addition and subtraction | Tens Make a Hundred · Best Order Adding · Swap a Hundred · Mystery Number · Bonds to 100 · Thousand Partners |
| 10 | Graphs | Pictogram Maker · Bar Chart Builder · Spin and Count · Venn Hoops · Carroll Grid |
| 11 | More multiplication and division | Times Square Explorer · Sequence Hops · Split and Multiply · Share and Leftovers · Grid Method Builder · Chunk and Divide · Remainder Decisions |
| 12 | More fractions | Share It Out · Find the Whole · Fraction Line-Up · Equivalent Fraction Wall · Fraction Strip Sums · Sale Price Shop · Dicey Tenths · Measure Fractions |
| 13 | Measure: mass, capacity and temperature | Kitchen Scales · Balance It! · Make a Kilogram · Fill the Jug · Same Amount? · Thermometer Check |
| 14 | Time and timetables | Clock to the Minute · One-Minute Challenge · Calendar Hops · Birthdays and Years · My Day Timetable · Bus Stop Timetable |
| 15 | Angles and movement | Quarter and Half Turns · Right Angle Hunt · Compass Garden · Bolt's Route · Hippo to the River |
| 16 | Chance | Will It Happen? · What Could I Pick? · Coin-Toss Walk · Spinner Lab · Sweet Jar Questions · Venn Card Game |
| 17 | Pattern and symmetry | Find the Fold · Mirror Drawing · Symmetry Tile Designer · Grow and Shrink · How Likely? |

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
* `js/units/unit-NN.js` holds each unit's sections, book page references and parent tips;
  `js/curriculum.js` is the small registry they plug into.
* Smoke test (needs Node and Playwright):
  ```bash
  node tools/smoke.js            # all activities + the map
  node tools/smoke.js ruler-lab  # one activity
  ```

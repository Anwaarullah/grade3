# Unit 10 Graphs (10.1-10.2) - syllabus notes (paraphrased; do not copy book text)

Source: Learner's Book 3, printed pages 150-167 = scan image index **152-169** (offset **+2**, not the +4 in the brief: printed pages 136-137 are missing from the scan, see unit-09.md). Every page corner checked. There is no project page after this unit (Unit 11 starts on p.168).

## Scan notes
- All 18 pages present and readable.
- The bar chart on p.152 ('Gadgets owned by a Stage 8 class') is drawn slightly off the grid: the calculator and computer bars stop a little above 10, so their values are not exact (about 10 and about 11). Treat them as roughly 10, 4, 11, 8.
- Worked example 2 (p.161) says "ten numbers" but only nine are listed (book misprint).
- The 7 monsters on p.165 and p.166 are the same characters, but one is drawn with wheels on p.165 and with legs on p.166; leg counts are hard to read from the small pictures, so no definitive answer is given for the monster pictogram.

## Unit opener (p.150-151)

```json
{
 "section": "Unit 10 opener: Getting started and introduction",
 "book_pages": "150-151 (p.150 = title page and Getting started pictogram; p.151 = the four steps of an investigation, unit intro, classroom picture)",
 "objectives": [
  "[Unit intro, p.151] The four steps of a statistical investigation: (1) decide the question and plan how to answer it, (2) collect and record the data, (3) look at the data and work out what it shows, (4) check whether the data answers the question",
  "[Unit intro] Learn more ways to record data and practise interpreting it"
 ],
 "key_facts": [
  "Getting started pictogram 'Animals in the zoo', key 1 picture = 1 animal: lion 4, duck 6, elephant 3, turtle 5 (read from p.150)",
  "Derived answers: ducks 6; elephants 3; 2 more turtles than elephants; 18 animals altogether; 2 fewer lions than ducks"
 ],
 "question_types": [
  {"type": "Read a 1-to-1 pictogram", "description": "Answer five questions about a zoo pictogram: how many of one animal, how many more, how many fewer, total", "number_ranges": "counts 3-6, total 18", "difficulty": "core", "book_page": "150"}
 ]
}
```

## 10.1 Pictograms and bar charts

```json
{
 "section": "10.1 Pictograms and bar charts",
 "book_pages": "152-159 (p.152 = objectives, key words, intro with a key-of-2 pictogram and a bar chart; p.153 = Worked example 1; p.154 = Exercise 10.1 Q1; p.155 = Q2; p.156-157 = Q3 (spinner) and Q4 (name lengths); p.158 = Q5 (group survey); p.159 = Think like a mathematician (two dice), reflection, Look what I can do!)",
 "objectives": [
  "[Book objective] Record, organise and represent data using pictograms and bar charts",
  "[Book objective] Interpret data, finding similarities and differences, and asking and answering questions",
  "[Repeated as 'Look what I can do!' on p.159]",
  "[Intro, p.152] A pictogram is a visual tally that uses pictures instead of bars; it works best with simple pictures",
  "[Intro, p.152] A bar chart uses bars and has two axes, one vertical and one horizontal",
  "[Inferred from p.152 and Q1] Use a key where one picture stands for more than one item, and half pictures for half amounts",
  "[Inferred from Q3-Q5] Choose a suitable way to record and present data (tally chart, frequency table, pictogram or bar chart) and explain the choice",
  "[Inferred from TLAM] Predict, then test, an outcome by collecting data (two dice)"
 ],
 "vocabulary": [
  "Official key words (p.152 box): axes, axis, discrete data, represent",
  "pictogram, key, symbol / picture",
  "bar chart, bar, vertical axis, horizontal axis, label, title, scale",
  "data, record, organise, interpret",
  "tally chart, tally, frequency, options",
  "survey, investigation, statistician",
  "most, least, more than, fewer than, total, altogether"
 ],
 "key_facts": [
  "Every pictogram needs a key that says what one picture stands for (p.152-154)",
  "Intro pictogram 'Food I like' (p.152), key 1 picture = 2 items sold: chips 5 and a half pictures = 11; chocolate 3 and a half = 7; candy 4 = 8 (derived). A half picture means half of 2, i.e. 1",
  "Intro bar chart 'Gadgets owned by a Stage 8 class' (p.152): scale goes up in 2s from 0 to 12; bars about 10 calculator, 4 cell phone, 11 computer, 8 MP3 player (approx., see scan notes)",
  "Worked example 1 'Rainy days' (p.153), key 1 cloud = 1 hour of rain: Mon 5, Tue 3, Wed 1, Thu 6, Fri 2, Sat 3, Sun 4. Most rain on Thursday (6 hours)",
  "Q1 'Hours of sunshine' (p.154), key 1 sun = 1 hour: Mon 2, Tue 3 and a half, Wed 5. Derived: Mon + Tue = 5 and a half hours; Wed is 1 and a half hours more than Tue",
  "Q1c derived: Saturday 7 and a half hours, Sunday 5 and a half hours (2 less), Friday 13 hours (Saturday + Sunday). The child must also write a title and a key",
  "Q2 pet shop data (p.155): turtle 1, rabbit 3, fish 6, cat 8, guinea pig 9 on a bar chart with a scale of 1 from 0 to 9; the child adds a title and both axis labels",
  "A bar chart needs a title, labels on both axes and a scale",
  "TLAM (p.159): two dice thrown 20 times; 7 is the most likely total (6 of the 36 combinations), so you might expect about 3 or 4 sevens in 20 throws (derived; the book only asks for a prediction and a test). Results will vary if the investigation is repeated"
 ],
 "question_types": [
  {"type": "Read a pictogram with a key", "description": "Answer which day had most rain using a 1-to-1 pictogram and its key (worked example)", "number_ranges": "1-6 per day, 7 days", "difficulty": "core", "book_page": "153"},
  {"type": "Pictogram with half symbols: read, compare, complete", "description": "Read a sunshine pictogram with a half sun, find a total and a difference, then complete a new pictogram from three written clues (one value given, one is 2 less, one is the sum) and write its title and key", "number_ranges": "2, 3 and a half, 5; then 7 and a half, 5 and a half, 13 (half values involved)", "difficulty": "core / stretch", "book_page": "154"},
  {"type": "Draw a bar chart from data in words", "description": "Colour bars on a prepared grid for five pet types, add a title and axis labels, then write two questions about the chart for a partner", "number_ranges": "1, 3, 6, 8, 9 on a scale of 1 up to 9", "difficulty": "core", "book_page": "155"},
  {"type": "Spinner experiment", "description": "Spin a 5-colour spinner 20 times and record results; show them as a bar chart or pictogram; compare with a partner (same/different); explain the choice of graph; write two questions about it", "number_ranges": "20 spins over 5 equal colours (about 4 each, varies)", "difficulty": "core", "book_page": "156-157"},
  {"type": "Name lengths mini-survey", "description": "Ask five friends and yourself how many letters are in their first name; choose a recording method; say what you found and write three sentences about the data", "number_ranges": "6 data values, typically 3-10 letters", "difficulty": "core", "book_page": "157"},
  {"type": "Group survey with tally chart", "description": "Choose one of four questions (a place to visit, a day out with a best friend, what to do if school closed, what to take on a picnic), think of four answer options, predict the most popular, survey the class with a tally/frequency table, then decide another way to show the information and explain why", "number_ranges": "4 options, class-sized totals (about 20-30)", "difficulty": "core / stretch", "book_page": "158"},
  {"type": "Two-dice prediction (Think like a mathematician)", "description": "Predict how many times a total of 7 will appear in 20 throws of two dice, decide how to record, test it, compare with the prediction and say what would happen if repeated", "number_ranges": "totals 2-12, 20 throws", "difficulty": "challenge", "book_page": "159"}
 ],
 "worked_examples": [
  "Intro (p.152): a pictogram where each picture means 2 items, with half pictures; and a bar chart with a scale in 2s. These are models, not exercises",
  "Worked example 1 (p.153): a rainy-days pictogram. The answer picks the day with the most clouds (Thursday) and uses the key (1 cloud = 1 hour) to say it rained for 6 hours. Teaching point: compare by the number of symbols, then use the key to turn symbols into a quantity"
 ],
 "misconceptions": [
  "Ignoring the key and counting pictures as 1 each when the key says 1 picture = 2 (reading chips as 5 or 6 instead of 11)",
  "Counting a half picture as a whole one, or ignoring it",
  "Drawing pictures of different sizes or spacing, so rows cannot be compared by length",
  "Forgetting the title, key or axis labels",
  "Reading the top of a bar against the wrong gridline, or counting gridlines instead of reading the scale (especially when the scale goes up in 2s)",
  "Starting bars at 1 instead of 0",
  "Confusing 'how many more' with 'how many altogether'",
  "Expecting a spinner or dice to give exactly equal results; thinking a repeated experiment must give the same data",
  "Thinking any total from two dice is equally likely",
  "Writing 'questions' that cannot be answered from the graph",
  "Specific to this child: a key of 2 means counting in 2s and doubling (2 times table); 'Friday = Saturday + Sunday' needs adding halves (7 and a half + 5 and a half = 13). Keep keys at 1 at first, then use counting in 2s as the bridge"
 ],
 "prerequisites": [
  "Tally charts and frequency tables (Unit 2) - directly reused in Q3-Q5",
  "Counting in 1s and 2s (flagged: a key of 2 uses the 2 times table / doubling)",
  "Halves: half of 2 is 1; adding halves (7 and a half + 5 and a half)",
  "Comparing numbers: more, fewer, difference by subtraction",
  "Reading a scale on a vertical number line",
  "Adding several small numbers for totals"
 ],
 "interactive_ideas": [
  "Pictogram builder: drag picture stamps into rows to match data; switch the key between 1 and 2; a half stamp is available. A 'check' button counts each row using the key",
  "Pictogram reader: click a row to see its pictures turn into a count (in 1s or in 2s with a skip-counting strip), then answer most / fewest / how many more / total",
  "Clue puzzle: build a pictogram from three clues (one value, '2 less than', 'sum of the other two')",
  "Bar chart builder: drag the top of each bar to the right height on a grid with scale 1 or 2; add a title and labels from tiles",
  "Bar reader: a sliding ruler line across the chart to read a bar against the scale",
  "Spinner and dice lab: spin a 5-colour spinner or throw two dice 20 times on screen; tallies fill in automatically and become a bar chart; repeat to see results change",
  "Question maker: pick question starters ('How many more ... than ...?') and fill in categories to make answerable questions"
 ]
}
```

## 10.2 Venn and Carroll diagrams

```json
{
 "section": "10.2 Venn and Carroll diagrams",
 "book_pages": "160-167 (p.160 = objectives, key words, intro to Venn and Carroll diagrams; p.161 = Worked example 2; p.162 = Exercise 10.2 Q1; p.163 = Q2; p.164 = Q3 (group Venn); p.165 = Q4 (monsters), Think like a mathematician, reflection, Look what I can do!; p.166-167 = Check your progress Q1-Q4, covering the whole unit)",
 "objectives": [
  "[Book objective] Record, organise and show data using Venn and Carroll diagrams",
  "[Book objective] Interpret data, finding similarities and differences, and asking and answering questions",
  "[Repeated as 'Look what I can do!' on p.165]",
  "[Intro, p.160] A Venn diagram shows how members of a set are related: circles inside a box; a Carroll diagram is a grid that groups data by rules",
  "[Inferred from WE2 and Q1] Use the overlap for items that fit both rules and the space outside the circles for items that fit neither",
  "[Inferred from Q1b, Q2b, Q4] Choose your own set and sorting rules, and write the labels"
 ],
 "vocabulary": [
  "Official key words (p.160 box): Carroll diagram, Venn diagram",
  "set, circle, overlap, box (the outside region)",
  "rule, label, sort, group, organise",
  "multiple of 2 / 3 / 4 / 5, even, not even, odd, less than",
  "2D, not 2D, vertices (has / does not have vertices)",
  "curves / not curves, blue / not blue (intro example)"
 ],
 "key_facts": [
  "Intro Carroll diagram (p.160): columns 'curves' / 'not curves', rows 'blue' / 'not blue', holding a blue circle, a blue triangle, a yellow circle and a yellow triangle",
  "A Carroll diagram uses a rule and its opposite ('even' / 'not even') so every item has exactly one cell",
  "Worked example 2 (p.161): numbers 68, 79, 56, 53, 121, 24, 96, 59, 76 in a Venn diagram with 'multiple of 4' and 'less than 100'. Overlap: 68, 56, 24, 96, 76. Less than 100 only: 79, 53, 59. Multiple of 4 only: none. Outside both: 121. Note: every multiple of 4 in the list is under 100, so the left-only region is empty",
  "Q1a derived (numbers 1-20, multiples of 2 / multiples of 3): overlap 6, 12, 18; multiples of 2 only 2, 4, 8, 10, 14, 16, 20; multiples of 3 only 3, 9, 15; outside 1, 5, 7, 11, 13, 17, 19",
  "Q2a derived (Carroll, even / not even x multiple of 3 / not): even and multiple of 3: 18, 12, 24; not even and multiple of 3: 15, 21; even and not multiple of 3: 10, 16, 20, 22; not even and not multiple of 3: 11, 17, 23",
  "CYP Q2 derived (Carroll, 2D / not 2D x has / does not have vertices): 2D with vertices: rectangle, triangle, pentagon, hexagon, octagon; 2D without vertices: circle; not 2D with vertices: cube; not 2D without vertices: cylinder (a cylinder has curved edges but no vertices)",
  "CYP Q3 derived (Venn, odd / multiples of 5): overlap 25, 5, 35; odd only 31, 17, 19, 29; multiples of 5 only 10, 40; outside 8, 16",
  "CYP Q4 bar chart 'Rolling a dice' (p.167), 20 rolls: score 1 = 2, 2 = 6, 3 = 1, 4 = 3, 5 = 5, 6 = 3. So 4 was rolled 3 times; 2 was rolled most; 3 least; the total is 20"
 ],
 "question_types": [
  {"type": "Sort numbers into a Venn diagram (worked example)", "description": "Place nine numbers into a two-circle Venn diagram (multiple of 4 / less than 100), using the overlap and the outside", "number_ranges": "24-121", "difficulty": "core (worked)", "book_page": "161"},
  {"type": "Venn diagram for 1 to 20", "description": "Sort 1-20 into multiples of 2 / multiples of 3 circles, crossing off numbers as they are used; then choose 12 numbers, draw and label your own Venn diagram", "number_ranges": "1-20", "difficulty": "core / stretch", "book_page": "162"},
  {"type": "Fill a Carroll diagram", "description": "Sort 12 numbers into a 2 by 2 Carroll diagram (even / not even, multiple of 3 / not); then choose 12 numbers and make your own labelled Carroll diagram", "number_ranges": "10-24", "difficulty": "core / stretch", "book_page": "163"},
  {"type": "Group survey shown as a Venn diagram", "description": "In a group of four, decide a question; join another group and ask everyone; record the answers in a Venn diagram; write three things the diagram shows", "number_ranges": "8 people", "difficulty": "core / stretch", "book_page": "164"},
  {"type": "Sort pictures with your own rules", "description": "Sort 7 cartoon characters into a blank Carroll diagram, inventing and writing both pairs of labels; swap with another pair and check their rules", "number_ranges": "7 items", "difficulty": "stretch", "book_page": "165"},
  {"type": "Poster of recording methods (Think like a mathematician)", "description": "Make a poster of every way of recording data you know and when to use each", "number_ranges": "none", "difficulty": "challenge", "book_page": "165"},
  {"type": "Check your progress: pictogram from pictures", "description": "Count the legs of each of 7 characters and complete a pictogram with rows for two, three and four legs; write two observations; suggest another way to sort", "number_ranges": "7 items, 3 categories", "difficulty": "core", "book_page": "166"},
  {"type": "Check your progress: Carroll diagram of shapes", "description": "Sort 8 shapes (rectangle, cube, circle, cylinder, triangle, pentagon, hexagon, octagon) by 2D / not 2D and has vertices / no vertices", "number_ranges": "8 shapes", "difficulty": "core", "book_page": "166"},
  {"type": "Check your progress: Venn diagram of numbers", "description": "Sort 11 numbers into odd / multiples of 5 circles", "number_ranges": "5-40", "difficulty": "core", "book_page": "167"},
  {"type": "Check your progress: read a bar chart", "description": "Read how many times a score was rolled on a dice bar chart and write two more facts it shows", "number_ranges": "scale 0-7 in 1s; 6 bars totalling 20", "difficulty": "core", "book_page": "167"}
 ],
 "worked_examples": [
  "Intro (p.160): an empty two-circle Venn diagram inside a box, and a 2 by 2 Carroll diagram of coloured shapes (curves / not curves, blue / not blue)",
  "Worked example 2 (p.161): sort the multiples of 4 first; of the rest, numbers over 100 go outside the circles and numbers under 100 go in the right circle; multiples of 4 under 100 go in the overlap; anything left goes in the left circle. Teaching point: the overlap holds items with both properties, the circles show differences, and the box holds items with neither"
 ],
 "misconceptions": [
  "Putting a number that fits both rules in only one circle (e.g. 6 only in multiples of 2)",
  "Leaving out items that fit neither rule instead of writing them outside the circles in the box",
  "Writing an item twice, once in each circle, instead of once in the overlap",
  "Thinking a region must not be empty (the 'multiple of 4 only' region in WE2 is empty, and that is fine)",
  "In a Carroll diagram, putting an item in two cells, or reading a row label as a column label",
  "Thinking 'not even' is a different rule from 'odd'",
  "Shape sorting: thinking a circle or cylinder has vertices, or that a cube is 2D because it is drawn flat",
  "Making up labels that overlap or do not cover every item when writing your own Carroll diagram",
  "Specific to this child: 'multiple of 2/3/4/5' is times-table knowledge. Weak multiplication will show up here as sorting errors, not as diagram errors. Use a 'skip-count checker' (a number line with jumps of 3) so the diagram skill is not blocked by recall"
 ],
 "prerequisites": [
  "Multiples of 2, 3, 4 and 5 (flagged multiplication dependency: 2, 3, 4 and 5 times tables or skip counting)",
  "Odd and even numbers",
  "Comparing numbers with 100 (place value)",
  "2D and 3D shape names and properties: vertices, curved edges (Units 4 and 6)",
  "Reading a bar chart (10.1)"
 ],
 "interactive_ideas": [
  "Venn sorting hoops: drag number cards or picture cards into two overlapping hoops or the box; the overlap glows when both rules fit; cards bounce back with a reason if misplaced",
  "Skip-count checker: a side number line with jumps of 2, 3, 4 or 5 the child can turn on to test whether a number is a multiple",
  "Carroll grid: drag items into a 2 by 2 grid; row and column labels light up as the card is hovered so the child reads both rules",
  "Rule guesser: Bolt sorts some items into a Venn or Carroll diagram with hidden labels; the child picks the labels from a list",
  "Make your own: choose two rules from a menu and 12 numbers, then sort them",
  "Everyday sorting: home and school objects (fruit, toys, stationery) sorted by colour, shape, 'has wheels', 'is food'"
 ]
}
```

## Proposed activities

Ordered as taught (5 activities: 3 for the big 10.1 section, 2 for 10.2).

### 1. `pictogram-maker`
- **title**: Pictogram Maker
- **icon**: 🖼️
- **section**: 10.1
- **summary**: Read and build pictograms, using a key where one picture can stand for 1 or 2.
- **book**: Textbook p.150 Getting started, p.152 intro, p.153 Worked example 1, p.154 Q1, p.166 Check your progress Q1
- **Learn screens**
  1. A garden bird-watch pictogram, key 1 picture = 1 bird. The child clicks a row and the pictures count themselves (1, 2, 3 ...). Bolt asks which bird was seen most.
  2. The key changes to 1 picture = 2. The same row now counts 2, 4, 6 (a skip-counting strip appears). A half picture is cut in two: half of 2 is 1.
  3. Build: Bolt gives "apples 4, pears 6, bananas 3" and a key of 1. The child drags fruit stamps into rows and writes the title.
- **Practice** (count 9)
  - Level 1: key 1 picture = 1; read rows (counts 1-8) and answer how many / which most / which least.
  - Level 2: key 1 = 1 with half pictures (e.g. 3 and a half hours of sunshine); answer how many more and how many altogether; build a pictogram from three clues (e.g. 7 and a half, 2 less, the sum of both).
  - Level 3: key 1 picture = 2 with half pictures (counts up to 14, e.g. 11, 7, 8); read rows by counting in 2s; build one row from a number.
- **Mistake tags**: Ignored the key; Counted a half picture as 1 whole; Ignored the half picture; Mixed up more and altogether; Forgot the title or key
- **Parent tips**
  - Goal: Use the key to turn pictures into numbers, and draw a pictogram from data.
  - Say: "What does one picture stand for? Look at the key." / "Count in twos along the row." / "What is half of one picture worth?"
  - Watch for: counting pictures in 1s when the key says 2; forgetting a half picture.
  - Away from screen: Draw a pictogram of the fruit in your kitchen: one circle per fruit. Then redraw it with one circle for every 2 fruits.

### 2. `bar-chart-builder`
- **title**: Bar Chart Builder
- **icon**: 📊
- **section**: 10.1
- **summary**: Drag bars to the right height, label the chart, and answer questions by reading the scale.
- **book**: Textbook p.152 intro, p.155 Q2, p.167 Check your progress Q4
- **Learn screens**
  1. A blank chart with two axes. Bolt names them: the horizontal axis shows the groups, the vertical axis shows how many. The child drags "Title", "Pets" and "Number of pets" labels into place.
  2. The child drags the top of the "cat" bar up to 8 on a scale of 1. A ruler line slides across from the bar top to the scale.
  3. The scale changes to go up in 2s. A bar ends between 6 and 8: the child decides it shows 7.
- **Practice** (count 9)
  - Level 1: build a chart from data in words (e.g. 1 turtle, 3 rabbits, 6 fish, 8 cats, 9 guinea pigs) on a scale of 1 to 10, then add the title and axis labels.
  - Level 2: read a chart (scale of 1, up to 7; e.g. dice scores 2, 6, 1, 3, 5, 3): how many, most, least, how many more, total.
  - Level 3: read a chart with a scale in 2s (up to 12), including bars that end between gridlines (odd values); pick the question that can be answered from the chart.
- **Mistake tags**: Counted gridlines not the scale; Bar started at 1 not 0; Missing title or axis label; Misread a bar between two marks; Answered 'altogether' for 'how many more'
- **Parent tips**
  - Goal: Draw and read bar charts with a title, labelled axes and a scale.
  - Say: "Follow the top of the bar across to the numbers." / "What does each step on the scale go up in?" / "What would someone need to know to read your chart?"
  - Watch for: reading the nearest gridline when the scale goes up in 2s; leaving off labels.
  - Away from screen: Ask family members their favourite drink and draw a bar chart on squared paper together.

### 3. `spin-and-count`
- **title**: Spin and Count
- **icon**: 🎲
- **section**: 10.1
- **summary**: Run a spinner or dice experiment, tally the results, turn them into a chart, and compare with a prediction.
- **book**: Textbook p.151 four investigation steps, p.156-157 Q3-Q4, p.158 Q5, p.159 Think like a mathematician
- **Learn screens**
  1. The four steps of an investigation as four cards (ask, collect, look, check). The child puts them in order.
  2. A 5-colour spinner. The child predicts which colour will win in 20 spins, then clicks "spin" 20 times (or "spin 20"); a tally chart fills in and frequencies appear.
  3. The child chooses "pictogram" or "bar chart" and the tally turns into that graph. Bolt asks why that choice.
- **Practice** (count 8)
  - Level 1: given a finished tally chart (4 options, totals up to 12), type the frequencies and pick the most popular option.
  - Level 2: run a 20-spin spinner experiment, then answer two questions from the resulting chart (how many, how many more); compare with a second run ("what is the same, what is different?").
  - Level 3: two-dice totals: predict how many 7s in 20 throws, throw, record totals 2-12 in a tally, and decide whether the prediction was close. A survey-style item: build a tally from 20 children's picnic choices.
- **Mistake tags**: Tally marks miscounted (gate of 5); Frequency does not match tally; Expected equal results; Chart does not match the tally
- **Parent tips**
  - Goal: Collect data in a tally chart, show it as a graph, and see that results vary.
  - Say: "What do you think will happen? Why?" / "Count the tally in fives." / "If we did it again, would we get the same numbers?"
  - Watch for: being upset that the prediction was 'wrong'; miscounting tally gates.
  - Away from screen: Throw two real dice 20 times and tally the totals. Which total came up most? Try again tomorrow and compare.

### 4. `venn-hoops`
- **title**: Venn Hoops
- **icon**: ⭕
- **section**: 10.2
- **summary**: Sort numbers and pictures into two overlapping hoops, using the middle for both and the outside for neither.
- **book**: Textbook p.160 intro, p.161 Worked example 2, p.162 Q1, p.164 Q3, p.167 Check your progress Q3
- **Learn screens**
  1. Two hoops on a mat: "red things" and "round things". The child drags a red ball, a red book, a green apple and a blue pencil. The red ball has to go in the middle; the blue pencil goes outside, still on the mat.
  2. Numbers: "even" and "less than 10". The child sorts 4, 7, 12, 15; Bolt explains each region.
  3. A skip-count checker: turn on jumps of 3 on a number line to test whether 18 is a multiple of 3 before placing it.
- **Practice** (count 9)
  - Level 1: everyday object cards (6-8 per round) with picture rules (colour, shape, 'has wheels', 'is food').
  - Level 2: numbers with odd/even and 'less than' / 'more than' rules (e.g. odd / less than 20; even / more than 50), up to 100.
  - Level 3: multiple rules with the skip-count checker available (multiples of 2 and 3 for 1-20; odd and multiples of 5 up to 40; multiple of 4 and less than 100); one region may be empty.
- **Mistake tags**: Fits both but put in one hoop; Left an item off the mat; Placed in the wrong hoop; Multiple-of check wrong; Thought a region cannot be empty
- **Parent tips**
  - Goal: Use a Venn diagram to show what items have in common and how they differ.
  - Say: "Does it fit this rule? Does it fit that one too?" / "If it fits both, where does it go?" / "If it fits neither, it still goes in the box."
  - Watch for: missing the overlap; leaving out items that fit neither rule; times-table slips on 'multiple of'.
  - Away from screen: Use two hula hoops or loops of string on the floor and sort toys or socks by two rules you choose together.

### 5. `carroll-grid`
- **title**: Carroll Grid
- **icon**: 🔲
- **section**: 10.2
- **summary**: Sort items into a 2 by 2 grid by a rule and its opposite, then invent your own rules.
- **book**: Textbook p.160 intro, p.163 Q2, p.165 Q4, p.166 Check your progress Q2
- **Learn screens**
  1. A 2 by 2 grid labelled "curves / not curves" and "blue / not blue". As a card hovers over a cell, its row and column labels both light up. The child places a blue circle, blue triangle, yellow circle and yellow triangle.
  2. Numbers: "even / not even" and "multiple of 3 / not a multiple of 3". The child places 12, 15, 16, 23 and checks each with the skip-count line.
  3. Make your own: the child picks two rules from a menu (has wheels / no wheels, made of wood / not wood ...) and sorts 6 household objects.
- **Practice** (count 9)
  - Level 1: picture items (shapes, everyday objects) with colour and shape rules.
  - Level 2: numbers 10-24 with even / not even and multiple of 3 / not (e.g. 15, 11, 10, 16, 18, 21, 20, 22, 12, 24, 17, 23); shapes with 2D / not 2D and has vertices / no vertices (rectangle, cube, circle, cylinder, triangle, pentagon, hexagon, octagon).
  - Level 3: hidden-label rounds: Bolt has already sorted items; the child chooses the row and column labels that make the sorting correct.
- **Mistake tags**: Read row label as column; Item in two cells; Thought cylinder has vertices; Thought a drawn cube is 2D; Multiple-of check wrong; Labels do not split the items
- **Parent tips**
  - Goal: Use a Carroll diagram to sort by two rules and their opposites, so every item has exactly one place.
  - Say: "Check the row first, then the column." / "'Not even' means the same as odd." / "Do your labels give every item a place?"
  - Watch for: putting one item in two cells; saying a circle or cylinder has corners.
  - Away from screen: Draw a 2 by 2 grid on paper and sort the cutlery or shoes in the house (big / not big, has laces / no laces).

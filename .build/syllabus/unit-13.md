# Unit 13 Measure (mass, capacity, temperature) - syllabus notes (paraphrased; do not copy book text)

Source: Cambridge Primary Mathematics Learner's Book 3 (2nd ed.), printed pages 200-222.

**Page offset note:** for this unit the scan offset is **image index = printed page + 2**, not +4.
Printed p.200 is image 202 and printed p.222 is image 224 (checked against the page-corner number
on every page). Images 225 = printed 223 is the Unit 14 title page, so the unit ends at p.222.
No project page follows Unit 13 (Project 4 is p.199, before the unit).

Pages read: printed 200-222 (images 202-224), every page, twice (first pass + verification pass with
zoomed crops of every dial, jug and thermometer). No unreadable pages.

Unit layout:

| Printed page | Content |
|---|---|
| 200 | Unit title, Getting started (estimate and weigh 4 objects, table with "more than / less than 500 g" columns), kitchen picture introducing mass, capacity and temperature |
| 201 | 13.1 Mass: objectives, key words, intro, Worked example 1 (1 kg rice, 350 g used) |
| 202-205 | Exercise 13.1 Q1-Q6 |
| 206 | 13.1 Think like a mathematician (1 kg magic-grid puzzle), reflection, Look what I can do |
| 207-208 | 13.2 Capacity: objectives, key words, intro, Worked example 2 (500 ml vs half a litre) |
| 208-212 | Exercise 13.2 Q1-Q6 |
| 213 | 13.2 Think like a mathematician (500 ml and 300 ml cups), reflection, Look what I can do |
| 214-215 | 13.3 Temperature: objectives, key word, intro, Worked example 3 (horizontal thermometers) |
| 215-219 | Exercise 13.3 Q1-Q5 |
| 220 | 13.3 Think like a mathematician (temperature poster), reflection, Look what I can do, Check your progress Q1 |
| 221-222 | Check your progress Q2-Q4 (whole-unit review) |

---

## Unit opener (p.200)

```json
{
 "section": "Unit 13 opener (Getting started + introduction)",
 "book_pages": "200",
 "objectives": [
  "[Inferred] Recall from Stage 2 that objects can be weighed and that 500 g is a useful halfway benchmark below 1 kg",
  "[Book, unit intro] The unit covers three kinds of measure: mass, capacity and temperature"
 ],
 "vocabulary": ["estimated mass", "actual mass", "more than / less than 500 grams", "weigh"],
 "key_facts": ["The opener picture shows a pan balance, a measuring jug being filled and a thermometer in a hot pan: one tool per measure in the unit"],
 "question_types": [
  {
   "type": "Estimate, classify and weigh classroom objects",
   "description": "Choose 4 classroom objects, estimate each mass, tick whether it is more or less than 500 g, then weigh and record the actual mass in a 5-column table; share with a partner",
   "number_ranges": "classroom objects, roughly tens of grams to a few kg; benchmark 500 g",
   "difficulty": "core",
   "book_page": "200"
  }
 ],
 "worked_examples": [],
 "misconceptions": ["Thinking bigger objects are always heavier (a big box of tissues vs a small stone)"],
 "prerequisites": ["Stage 2 experience of weighing with a balance and using grams/kilograms informally"],
 "interactive_ideas": ["Quick sort warm-up: drag household objects into 'less than 500 g' and 'more than 500 g' trays, then reveal masses"]
}
```

---

## 13.1 Mass (p.201-206)

```json
{
 "section": "13.1 Mass",
 "book_pages": "201-206",
 "objectives": [
  "[Book objective] Estimate and measure the mass of objects",
  "[Book objective] Use instruments that measure mass",
  "[Book objective] Use knowledge of fractions when describing mass (stated in 'We are going to' but not repeated in 'Look what I can do'; no exercise uses fractions of a kg explicitly)",
  "[Look what I can do, p.206] Self-check: I can estimate and measure mass; I can use instruments that measure mass",
  "[Inferred from WE1 and Q3] Know that 1 kg = 1000 g and convert kg to g before subtracting or comparing",
  "[Inferred from Q1, Q2] Reason about balanced scales: equal masses on each side"
 ],
 "vocabulary": [
  "Official key words (p.201 box): gram (g), kilogram (kg), mass",
  "heavy, light, heavier, lighter, lightest, heaviest",
  "weigh, weight (the book uses 'weigh' and 'weight' informally alongside 'mass')",
  "scales, kilogram weight",
  "estimate, actual mass",
  "<, >, = (comparison symbols)"
 ],
 "key_facts": [
  "Mass is the measure used when we say something is heavy or light (p.201)",
  "1 kilogram = 1000 grams (Worked example 1)",
  "To subtract grams from kilograms, first change the kilograms into grams (WE1: 1 kg - 350 g = 1000 g - 350 g = 650 g)",
  "Dial scales can count in different steps: 0-500 g in 100s, 0-50 g in 10s, 0-1250 g in 250s, 0-5 kg in 1s (Q3)",
  "Expected Q1 answer (derived): 2 peaches = 2 x 80 = 160 g, so 4 pears = 160 g and 1 pear = 40 g",
  "Expected Q2 answer (derived): balance shows 3 muffins = 1 muffin + 100 g chocolate, so 2 muffins = 100 g, 1 muffin = 50 g, each side = 150 g",
  "Expected Q3 readings (derived from zoomed scan): a) cupcakes 500 g < pineapples 5 kg; b) toy van 10 g < toy train 1 kg; c) pears 1000 g = apples 1 kg (the '=' case is the teaching point)",
  "Expected Q4 sensible estimates (derived): fish bowl with water 8 kg (from 8 kg / 800 g / 80 g); cupcake 70 g (from 7 kg / 700 g / 70 g); tin of food/snacks 500 g (from 5 kg / 500 g / 5 g); wrapped sweet 4 g (from 4 g / 40 g / 4 kg)",
  "Think like a mathematician (derived): with 200, 250, 150, 300, 400, 500, 450, 700, 50 g the only way to split into three 1 kg rows is {700, 250, 50}, {500, 300, 200}, {450, 400, 150}; rows AND columns at once is impossible with this set. Challenge set 500, 250, 50, 450, 150, 600, 250, 350, 400 g does allow rows and columns all to total 1 kg, e.g. rows 50|350|600, 450|400|150, 500|250|250. Essentially 2 groupings exist (one grid's rows are the other grid's columns); counting all placements gives 72"
 ],
 "question_types": [
  {
   "type": "Balance word problem with an estimate first",
   "description": "A shopper buys two peaches and four pears; one peach's mass is given and four pears balance two peaches. Estimate the mass of four pears, then find one pear and show the working",
   "number_ranges": "peach 80 g; 2 peaches 160 g; pear 40 g",
   "difficulty": "core (needs doubling and quartering)",
   "book_page": "202"
  },
  {
   "type": "Read a balanced pan scale with a known mass",
   "description": "A pan balance has 3 muffins on one side and 1 muffin plus a 100 g chocolate bar on the other. Find one muffin and the mass on each side, show working, then check a different way",
   "number_ranges": "100 g known; muffin 50 g; each side 150 g",
   "difficulty": "stretch (removing equal items from both sides is algebraic thinking)",
   "book_page": "202"
  },
  {
   "type": "Read dial scales and compare with <, >, =",
   "description": "Three pairs of dial scales, one in grams and one in kilograms per pair. Write each reading in a box, then write <, > or = between them",
   "number_ranges": "dials: 0-500 g (labels every 100), 0-50 g (every 10), 0-1250 g (every 250), 0-5 kg (every 1). Readings 500 g, 5 kg, 10 g, 1 kg, 1000 g, 1 kg. Pointers sit on labelled numbers",
   "difficulty": "core (c is stretch: needs 1000 g = 1 kg)",
   "book_page": "203"
  },
  {
   "type": "Choose a sensible mass estimate",
   "description": "Four pictures (fish bowl, cupcake, tin, wrapped sweet), each with three options that differ by factors of 10 or a unit change; circle the sensible one",
   "number_ranges": "options like 8 kg / 800 g / 80 g, 7 kg / 700 g / 70 g, 5 kg / 500 g / 5 g, 4 g / 40 g / 4 kg",
   "difficulty": "core",
   "book_page": "204"
  },
  {
   "type": "Hefting and ordering five objects",
   "description": "Hold two classroom objects at a time to compare. Estimate the order lightest to heaviest and an estimated mass for each, record in a table, then weigh each one, fill in actual mass and reflect on closeness, surprises and whether the order was right",
   "number_ranges": "5 classroom objects, any mass",
   "difficulty": "core",
   "book_page": "204-205"
  },
  {
   "type": "Estimate in grams against a 1 kg weight",
   "description": "Pick five objects thought to be under 1 kg. Hold a 1 kg weight in one hand and the object in the other, estimate in grams, then weigh and compare",
   "number_ranges": "objects 0-1000 g",
   "difficulty": "core",
   "book_page": "205"
  },
  {
   "type": "Number puzzle: make 1 kg in every row/column (Think like a mathematician)",
   "description": "Place nine given masses in a 3 by 3 grid so each row (or each column) totals 1 kg. Challenge: a second set where every row and every column totals 1 kg; how many ways? Reflection: tell a friend how you solved it",
   "number_ranges": "masses 50-700 g in multiples of 50; totals 1000 g",
   "difficulty": "challenge",
   "book_page": "206"
  }
 ],
 "worked_examples": [
  "Worked example 1 (p.201): a 1 kg bag of rice on kg dial scales; 350 g is cooked. Teaching point: change 1 kg into 1000 g, then subtract to get 650 g left. Rule: convert kg to g before subtracting grams"
 ],
 "misconceptions": [
  "Writing 1 kg - 350 g = 650 kg, or trying 1 - 350, because the units were not made the same first",
  "Comparing numbers without units: thinking 500 g > 5 kg because 500 > 5, or 10 g > 1 kg",
  "Not seeing that 1000 g and 1 kg are the same (writing < or >)",
  "Reading a dial as if every dial counts in 1s or in 100s; ignoring the scale labels (e.g. 0-1250 g in 250s)",
  "Bigger means heavier: choosing 8 kg vs 80 g for a fish bowl by size alone, or picking 40 g for a sweet",
  "In the balance problems: forgetting that removing the same thing from both sides keeps it balanced; halving 160 to get 1 pear instead of quartering",
  "Thinking an estimate must be exact, or being upset when the estimate is not close",
  "Specific to this child: Q1 needs 2 x 80 and 160 / 4; Q2 needs 100 / 2; the 1 kg grid needs adding three 3-digit multiples of 50. Bar models and repeated halving (160 -> 80 -> 40) bridge the multiplication/division"
 ],
 "prerequisites": [
  "Place value to 1000 and that 1000 is ten hundreds (for 1 kg = 1000 g)",
  "Subtracting from 1000 (complements to 1000 in 50s and 10s: 1000 - 350)",
  "Counting in 10s, 100s and 250s around a dial; reading a scale between labels",
  "Doubling and halving 2-digit numbers (80 -> 160 -> 80 -> 40): a MULTIPLICATION/DIVISION dependency",
  "Using <, > and = (Unit 1)",
  "Adding three multiples of 50 to make 1000 (Unit 9 complements)"
 ],
 "interactive_ideas": [
  "Dial-scale reader: an SVG kitchen scale whose dial labels change (10s, 100s, 250s, 1 kg steps); drop an object on the pan and the needle swings; the child types the reading with the unit",
  "Compare pairs: two scales side by side, one g and one kg; the child drags <, > or = between them; a 'convert' button turns 1 kg into 1000 g to show why",
  "Pan balance puzzle: drag muffins/fruit and known weights onto two pans; the beam tilts until balanced; remove the same item from both sides to solve for one item",
  "Sensible-estimate picker: a household object with three tags (e.g. 4 g / 40 g / 4 kg); a 'heft' animation compares it with a 1 kg bag of sugar",
  "1 kg grid puzzle: drag weight tiles into a 3x3 grid with live row/column totals turning green at 1000 g"
 ]
}
```

---

## 13.2 Capacity (p.207-213)

```json
{
 "section": "13.2 Capacity",
 "book_pages": "207-213",
 "objectives": [
  "[Book objective] Estimate and measure capacity in millilitres and litres",
  "[Book objective] Use instruments that measure capacity",
  "[Look what I can do, p.213] Self-check: the same two statements",
  "[Inferred from WE2, Q1, Q2] Know 1 litre = 1000 ml, half a litre = 500 ml, a quarter of a litre = 250 ml and count in 250 ml steps",
  "[Inferred from Q4] Read a jug between marked divisions and round to the nearest marked division",
  "[Inferred from Q3] Know that the height of liquid only compares amounts if the containers are the same shape"
 ],
 "vocabulary": [
  "Official key words (p.207 box): capacity, litres (L), millilitres (ml)",
  "capacity = the total amount a container can hold (p.207)",
  "jug, measuring cylinder, container, teaspoon, bottle, tin/can",
  "full, half full, quarter of a litre, half a litre",
  "estimate, round to the nearest marked division, level, scale, difference"
 ],
 "key_facts": [
  "Capacity is the total amount a container can hold (p.207)",
  "A teaspoon holds 5 ml (used for medicine doses); a bottle can hold half a litre; a cereal bowl a quarter of a litre (p.207)",
  "If a container is not full, the liquid in it is less than its capacity (p.207)",
  "500 ml = half a litre, so a 1 L jug filled to 500 ml holds the same as a jug filled to half a litre (Worked example 2)",
  "Jugs can be marked in ml (250, 500, 750, 1 L) or in fractions of a litre (1/4, 1/2, 3/4, 1 litre)",
  "Expected Q1 readings (derived from zoomed scan): A = 250 ml, B = 750 ml (the water is drawn a hair above the 750 line; 750 is clearly intended), C = 500 ml; the 1 L jugs have one unlabelled tick between labels (125 ml steps), which is not needed for these answers; order largest to smallest B, C, A. Q1c: the wide jug is marked 1000 ml, which is the same capacity as the 1 L jugs even though it looks bigger",
  "Expected Q2 answers (derived): 1 tin 250 ml = 1/4 litre; 3 tins 750 ml = 3/4 litre; 4 tins 1000 ml = 1 litre; boxes of 8, 12 and 16 cans hold 2, 3 and 4 litres (4 cans per litre)",
  "Expected Q3 answer (derived): Marcus is not right. A tall thin glass and a wide jug can show different levels for the same amount; you can only compare levels in identical containers, or pour into the same measuring jug",
  "Expected Q4 readings (derived): a) a little over 600 ml (about 620), rounds to 600 ml; b) just under 500 ml (about 490), rounds to 500 ml; c) about 240-250 ml, between 200 and 300. Scan ambiguity: c looks very close to halfway and sits just below 250, so 200 ml is the likely intended rounding, but 300 ml (halfway rounds up) may be accepted",
  "Think like a mathematician (derived): with a 500 ml cup A and 300 ml cup B and pouring between them: 1000 ml = A + A; 700 ml = fill A, pour into B until full (200 left in A), then add a full A (200 + 500); 100 ml = fill B twice into A (A takes 300 then 200), leaving 100 ml in B. All hundreds 100-1000 are possible (e.g. 200 = A - B, 400 = 3B - A, 600 = 2B, 800 = A + B, 900 = 3B)"
 ],
 "question_types": [
  {
   "type": "Read 1 litre jugs and order them",
   "description": "Three 1 L jugs marked 250/500/750 ml with minor ticks. Write each amount, order largest to smallest, decide whether a wider jug marked 1000 ml has larger, smaller or the same capacity and explain, then use a ruler to draw a 500 ml water line on it",
   "number_ranges": "250, 500, 750 ml; 1000 ml jug with only a 500 ml mark",
   "difficulty": "core (c and d stretch)",
   "book_page": "208"
  },
  {
   "type": "Total drinks from 250 ml tins",
   "description": "Label 1, 3 and 4 tins with total ml and litres (fractions); then, knowing 4 cans make 1 litre, find litres in boxes of 8, 12 and 16 cans",
   "number_ranges": "250, 750, 1000 ml; 1/4, 3/4, 1 litre; 8, 12, 16 cans -> 2, 3, 4 L",
   "difficulty": "core (box part is stretch: grouping in 4s)",
   "book_page": "209"
  },
  {
   "type": "Evaluate a claim (Marcus)",
   "description": "A character says the container with the higher water level always holds more. A tall glass and a wide jug are shown. Say whether he is right and explain",
   "number_ranges": "no numbers",
   "difficulty": "stretch (reasoning)",
   "book_page": "210"
  },
  {
   "type": "Estimate and round jug readings",
   "description": "Three 1000 ml jugs marked every 100 ml; the water is between marks. Write an estimate, then round to the nearest marked division",
   "number_ranges": "0-1000 ml, marks every 100 ml; levels about 620, 490 and 245 ml",
   "difficulty": "core",
   "book_page": "211"
  },
  {
   "type": "Practical: mark 1, 2 and 3 litres on a container",
   "description": "Estimate where 1 litre comes on an unmarked container and mark it, check by pouring a litre, repeat for 2 litres, then draw three containers (empty, 1 L, 2 L) with a scale and say where 3 litres would be",
   "number_ranges": "1, 2, 3 litres",
   "difficulty": "core",
   "book_page": "211-212"
  },
  {
   "type": "Practical: displacement with a pebble",
   "description": "Half-fill a 1 litre measuring cylinder, record the level, drop in a large pebble, record the new level and the difference in a table",
   "number_ranges": "cylinder 0-1 litre with unlabelled ticks (about every 200 ml); start about 500 ml",
   "difficulty": "stretch",
   "book_page": "212"
  },
  {
   "type": "Two-cup pouring puzzle (Think like a mathematician)",
   "description": "With only full 500 ml and 300 ml cups (and pouring one into the other) make 1000 ml, 700 ml and 100 ml; then investigate whether every hundred from 100 to 1000 ml can be made. Reflection: did you predict before investigating?",
   "number_ranges": "500 ml, 300 ml; targets 100-1000 ml in hundreds",
   "difficulty": "challenge",
   "book_page": "213"
  }
 ],
 "worked_examples": [
  "Worked example 2 (p.207-208): jug 1 is marked 250/500/750 ml/1 L and filled to 500 ml; jug 2 is marked 1/4, 1/2, 3/4, 1 litre and filled to 1/2 litre. Which has more? Teaching point: they hold the same because 500 ml = half a litre; different scales can describe the same amount",
  "Not a worked example but a reference (p.207): everyday benchmarks - teaspoon 5 ml, bottle half a litre, bowl a quarter litre"
 ],
 "misconceptions": [
  "Higher level = more liquid, whatever the shape of the container (the book's Marcus error)",
  "A wider/bigger-looking jug must have a bigger capacity even when both are marked 1000 ml",
  "Confusing capacity (how much it can hold) with the amount actually in it",
  "Thinking 500 ml and 1/2 litre are different amounts because the numbers look different",
  "Reading unlabelled minor ticks as 1 ml, 10 ml or 'one more' instead of working out the step (e.g. 50 ml between 100s)",
  "Rounding a level to the nearest small tick instead of the nearest marked (labelled) division",
  "Counting 4 tins as 4 litres (mixing up 'tins' and 'litres'); writing 3 tins = 3/4 ml",
  "Specific to this child: the box questions (8, 12, 16 cans, 4 per litre) are division by 4. Show cans grouped in rows of 4 (an array) so the child counts groups, not divides"
 ],
 "prerequisites": [
  "Fractions of a whole: 1/4, 1/2, 3/4 (Units 7 and 12) and of 1000 (250, 500, 750)",
  "Counting in 250s to 1000 and in 100s",
  "Reading a vertical scale; rounding to the nearest 100 (Unit 1)",
  "Grouping in 4s / dividing by 4 (cans per litre): a DIVISION dependency",
  "Subtraction to find a difference (pebble levels; 500 - 300 in the cups puzzle)"
 ],
 "interactive_ideas": [
  "Jug filler: drag a tap handle to fill a jug to a target (e.g. 750 ml, 1/2 litre); jugs switch between ml scales and fraction-of-litre scales so 500 ml and 1/2 litre visibly match",
  "Read-the-jug: water stops between marks; the child types an estimate and then taps the nearest marked line (rounding)",
  "Same amount, different shapes: pour the same 300 ml into a tall glass and a wide bowl; ask which has more, then pour both back into identical jugs to show they are equal",
  "Tin stacker: drag 250 ml tins into a 1 litre crate of 4 slots; filled crates count litres (8 tins = 2 full crates)",
  "Two-cup puzzle: two cups (500 ml, 300 ml), a big bowl and a sink; buttons fill, pour into other, pour into bowl, empty; target amounts 1000, 700, 100 ml"
 ]
}
```

---

## 13.3 Temperature (p.214-220) and Check your progress (p.220-222)

```json
{
 "section": "13.3 Temperature + unit Check your progress",
 "book_pages": "214-222 (13.3 teaching and exercise 214-220; Check your progress 220-222 covers the whole unit)",
 "objectives": [
  "[Book objective] Use instruments that measure temperature",
  "[Book objective] Read the scales on a thermometer",
  "[Look what I can do, p.220] Self-check: the same two statements",
  "[Inferred from Q1-Q3] Round a thermometer reading to the nearest 10 degrees or nearest labelled division",
  "[Inferred from Q4, Q5] Estimate, measure and compare real temperatures and find a difference"
 ],
 "vocabulary": [
  "Official key word (p.214 box): degrees Celsius (°C)",
  "temperature, hot, cold, thermometer, scale",
  "labelled division / marked division / interval (e.g. labelled intervals of 5 °C)",
  "higher / lower temperature, hotter, colder, difference",
  "round up, round down, nearest 10 °C",
  "estimated temperature, actual temperature"
 ],
 "key_facts": [
  "Temperature matters in cooking, making tea and choosing clothes (p.214); 600 °C would burn a chicken",
  "On a thermometer the red line shows the temperature: the longer (higher) the line, the hotter it is (WE3)",
  "Thermometers can be horizontal or vertical and can be labelled in 2s, 5s or 10s",
  "Expected WE3 answers (printed): A = 15 °C, B = 20 °C; B is higher; 25 °C is drawn between 20 and 30",
  "Expected Q1 readings (derived from zoomed scan; vertical, labels every 10, no minor ticks): a) about 28 °C -> 30 °C; b) about 32 °C -> 30 °C; c) about 12 °C -> 10 °C",
  "Expected Q2a (derived): the bar ends at about 13 °C, so to the nearest division (5s) it is 15 °C; Marianna's 20 °C is wrong. Q2b: bar at about 33-34 °C -> 35 °C. Q2c: 27 °C is drawn 2 degrees past the 25 mark (3 before 30), so just under halfway between 25 and 30",
  "Expected Q3 (derived from zoomed scan, every thermometer 0-35 °C with 1 °C ticks): A is labelled every 2 °C and reads 17 °C (exactly halfway between labels 16 and 18; by the halfway-rounds-up rule 18 °C - scan note: this is genuinely halfway); B reads about 15 and a half, nearest labelled division 15 °C; C reads 15 °C; D reads 14 °C, so C is higher than D; E reads 19 °C -> 20 °C. Thermometers with labelled intervals of 5 °C: B, C, D and E",
  "Check your progress answers (derived): Q1 dial scales a) about 200 g (0-900 g dial, labels every 100); b) about 7 kg (0-10 kg); c) about 900 g; d) about 3 kg. Q2 a) 400 ml (0-1000 ml, labels every 100); b) about 150 ml on a 0-600 ml cylinder labelled every 100 - scan note: the level sits on the unlabelled 150 tick, so 'nearest labelled division' is ambiguous (100 or 200); c) 1/4 litre (250 ml) vs 350 ml: 350 ml is more. Q3 a) 8 plums x 50 g = 400 g; b) 55 ml / 5 ml a day = 11 days; c) 72 - 48 = 24 cm farther. Q4: 18 + 7 = 25 °C at 3 o'clock, then down 1 °C an hour for 9 hours = 16 °C at midnight"
 ],
 "question_types": [
  {
   "type": "Read vertical thermometers and round to nearest 10 °C",
   "description": "Three vertical thermometers labelled 0-40 in 10s; write each temperature and round it to the nearest 10 °C",
   "number_ranges": "about 28, 32, 12 °C -> 30, 30, 10 °C",
   "difficulty": "core",
   "book_page": "215"
  },
  {
   "type": "Spot the reading error / circle the reading / draw a temperature",
   "description": "a) A child reads a horizontal thermometer to the nearest division as 20 °C; is she right, and what should it be? b) circle the right reading (25, 30, 35 °C) to the nearest marked division; c) draw a red line to estimate 27 °C on a 0-40 scale marked in 5s",
   "number_ranges": "0-30 °C and 0-40 °C scales marked in 5s; readings about 13 and 34 °C; target 27 °C",
   "difficulty": "stretch",
   "book_page": "216"
  },
  {
   "type": "Compare thermometers with different labelling",
   "description": "Five horizontal thermometers (one labelled in 2s, four in 5s, all with 1 °C ticks): say which are labelled in 5s, give A, B and E to the nearest labelled division, say whether C or D is higher, and draw your own thermometer for 26 °C choosing a scale. Reflection: how do I decide whether to round up or down?",
   "number_ranges": "0-35 °C; readings 14-19 °C; draw 26 °C",
   "difficulty": "core to stretch",
   "book_page": "217-218"
  },
  {
   "type": "Practical: temperatures around school",
   "description": "In a group of four, place thermometers in four locations for 10 minutes; estimate first, then record actual temperatures; complete sentence frames (the temperature in X is ..., X is hotter/colder than Y, the difference between X and Y is ... degrees) and write three more comparison sentences",
   "number_ranges": "real air temperatures, roughly 10-40 °C; differences by subtraction",
   "difficulty": "core",
   "book_page": "218-219"
  },
  {
   "type": "Practical: wet soil vs dry sand",
   "description": "With a partner, put a thermometer in a container of wet soil and one in dry sand, estimate the temperatures after 30 minutes, check them, and explain why they are the same or different",
   "number_ranges": "real temperatures; 30 minutes",
   "difficulty": "stretch (science link)",
   "book_page": "219"
  },
  {
   "type": "Temperature poster (Think like a mathematician)",
   "description": "Design a poster about temperature with pictures, words and thermometers using the words degrees, Celsius and temperature; then improve it",
   "number_ranges": "open",
   "difficulty": "challenge (open)",
   "book_page": "220"
  },
  {
   "type": "Check your progress: read dial scales",
   "description": "Four dial scales (two 0-1000 g labelled in 100s, two 0-10 kg labelled in 1s); write the mass to the nearest labelled division",
   "number_ranges": "about 200 g, 7 kg, 900 g, 3 kg",
   "difficulty": "core",
   "book_page": "220"
  },
  {
   "type": "Check your progress: read containers and compare",
   "description": "Read a 1000 ml jug and a 600 ml cylinder to the nearest labelled division; draw two containers showing a quarter litre and 350 ml and say which holds more",
   "number_ranges": "400 ml; about 150 ml; 250 ml vs 350 ml",
   "difficulty": "core",
   "book_page": "221"
  },
  {
   "type": "Check your progress: measure word problems",
   "description": "Eight plums of about 50 g each; a 55 ml medicine bottle used 5 ml a day; difference between snail distances of 48 cm and 72 cm; a temperature that rises by 7 °C then falls 1 °C an hour until midnight",
   "number_ranges": "50 x 8 = 400 g; 55 / 5 = 11; 72 - 48 = 24 cm; 18 + 7 - 9 = 16 °C",
   "difficulty": "stretch",
   "book_page": "222"
  }
 ],
 "worked_examples": [
  "Worked example 3 (p.214-215): two horizontal thermometers 0-40 °C labelled in 5s. Read A (15 °C) and B (20 °C), say which is higher, and draw 25 °C. Teaching point: the longer the red line, the hotter; read the end of the line against the scale"
 ],
 "misconceptions": [
  "Reading the number nearest the start of the red bar, or counting ticks from the wrong end",
  "Treating every tick as 1 when ticks are not drawn, or as 5 when labels are every 2",
  "Rounding to the nearest tick rather than to the nearest labelled division (Marianna-type error), or always rounding up",
  "Not knowing what to do when a reading is exactly halfway (17 between 16 and 18)",
  "Thinking a longer thermometer or a different scale means a hotter temperature",
  "Forgetting °C, or writing the reading without a unit",
  "In the midnight problem: miscounting hours from 3 o'clock to midnight (9 hours), or subtracting 7 instead of adding",
  "Specific to this child: CYP Q3a (8 x 50) and Q3b (55 / 5) are multiplication/division; use counting in 50s (to 400) and counting in 5s (to 55) on a number line"
 ],
 "prerequisites": [
  "Reading number lines and scales in 1s, 2s, 5s and 10s (Units 1, 6)",
  "Rounding to the nearest 10 and to the nearest 5 (Unit 1, 6)",
  "Comparing numbers; finding a difference by subtraction (Units 3, 9)",
  "Counting on hours from 3 o'clock to 12 midnight (Unit 8 time)",
  "Counting in 50s and 5s (multiplication and division): CYP Q3"
 ],
 "interactive_ideas": [
  "Thermometer reader: horizontal or vertical SVG thermometer with switchable labelling (2s, 5s, 10s); the red line grows to a random temperature; the child types the reading, then taps the nearest labelled number",
  "Set the temperature: drag the top of the red line to show a target (e.g. 27 °C, 26 °C) on scales labelled differently",
  "Hotter or colder: two thermometers with different scales; the child clicks the hotter one; then says by how many degrees",
  "Day-temperature story: a slider moves through a day's clock; the temperature rises and falls by steps; the child predicts the midnight reading",
  "Real-life match: drag pictures (ice lolly, cup of tea, sunny beach, classroom, oven) to sensible temperatures"
 ]
}
```

---

## Workbook

Source: Cambridge Primary Mathematics Workbook 3 (2nd ed.), printed pages 179-201 (image index =
printed page + 2, as stated by the coordinating brief; page-corner numbers checked on every page).
Every page read. Workbook p.202 begins Unit 14 and was not part of the supplied list. No access code
appears on these pages. Workbook questions are graded Focus / Practice / Challenge.

### 13.1 Mass (workbook p.179-185)

| WB page / Q | Level | What the child does | Numbers |
|---|---|---|---|
| p.179 Worked example 1 | - | Apple and pear on digital scales total 160 g; the apple is 70 g, so subtract to find the pear (90 g) | 160 - 70 |
| p.179 Q1a | Focus | Read a 0-800 g dial (labels every 100, minor ticks) and **round to the nearest 100 g** | needle just under 200 (about 190 g) -> 200 g |
| p.180 Q1b | Focus | Read a horizontal slider scale 0-100 g (labels every 10, ticks every 5) and **round to the nearest 10 g** | pointer about 42 g -> 40 g |
| p.180-181 Q2 | Focus | Two scales: potatoes 700 g on a 0-1000 g dial, flour 2 kg on a 0-10 kg dial. Three children argue (arrow further round = heavier; 2 kg < 700 g; 2 kg > 700 g). Say who is right and why | correct: the flour is heavier, 2 kg = 2000 g > 700 g |
| p.182 Q3 | Focus | Ring a sensible mass for carrot, sheep, feather, frog | carrot 18 g (from 8 kg / 4 kg / 18 g) - scan note: 18 g is light for a carrot but is the only sensible option; sheep 90 kg; feather 1 g; frog 30 g |
| p.182 Q4 | Practice | Melon on scales reads 3 kg, skin is 850 g; how much can be eaten? Tip says change 3 kg to 3000 g | 3000 - 850 = 2150 g |
| p.183 Q5 | Practice | Read three 0-1000 g dials (labels every 100, unlabelled minor ticks) and round each to the nearest 100 g | banana about 175 g -> 200; apples about 250 g (needle near the unlabelled 250 tick -> 300 by the halfway rule; scan note: needle position is approximate); orange about 190 g -> 200 |
| p.183 Q6 | Practice | Ring a sensible mass: rabbit, pumpkin, mobile phone | rabbit 1 kg (10 g / 100 g / 1 kg); pumpkin 3 kg (700 g / 3 kg / 13 kg - 13 kg also possible for a big pumpkin); phone 140 g |
| p.184 Q7a | Challenge | Two parcels together weigh 3 kg; one is 900 g; find the other | 3000 - 900 = 2100 g (2 kg 100 g) |
| p.184 Q7b-c | Challenge | Draw scales showing more than 1 kg; draw and label three parcels: one under 500 g, one between 600 and 950 g, one free choice | open |
| p.185 Q7 cont. | Challenge | Write a question of your own with its answer | open |
| p.185 Q8 | Challenge | Three 0-5 kg dials with many unlabelled ticks (about 10 per kg); **round to the nearest whole kg** | about 0.9 -> 1 kg; about 2.9 -> 3 kg; about 1.8 -> 2 kg |
| p.185 Q9 | Challenge | A 0-10 kg dial with the needle missing; potatoes are 7 kg to the nearest kg. **Colour every part of the dial the needle could point to** | from 6.5 kg up to (not including) 7.5 kg |

**Hidden prerequisites / traps (not taught in the textbook 13.1):**
- **Rounding a mass to the nearest 100 g, 10 g or whole kg** (Q1, Q5, Q8). The textbook 13.1 never asks for rounding on a scale; it only appears in 13.2/13.3 of the textbook. Relies on Unit 1 rounding.
- **Reading unlabelled minor ticks** on dials (Q5, Q8): the child must work out each tick's value (e.g. 50 g, or 0.1 kg on the 0-5 kg dial - tenths of a kg are never named; the child just sees "a bit less than 1").
- **Subtracting grams from several kilograms** (Q4: 3000 - 850, Q7: 3000 - 900). The textbook only does 1 kg - 350 g. These need 4-digit place value (3000) which Stage 3 barely touches.
- **The reverse of rounding** (Q9): which readings round to 7 kg. This is a range idea the textbook never teaches.
- **Arrow "further round the dial" ≠ heavier** when the dials use different units (Q2) - a strong version of the g vs kg comparison trap.

### 13.2 Capacity (workbook p.186-191)

| WB page / Q | Level | What the child does | Numbers |
|---|---|---|---|
| p.186 Worked example 2 | - | A full 5 litre bucket; 6 lambs each need 500 ml. Is there enough? Two lambs share 1 litre, so 6 lambs need 3 litres | 500 ml = half a litre; 6 x 500 = 3 L |
| p.186 Q1 | Focus | A full 2 litre bottle; three friends each have a 500 ml cup. Can they all have a drink? Explain | 3 x 500 = 1500 ml < 2000 ml: yes, with 500 ml left |
| p.187 Q2a-c | Focus | Read three containers and **round to the nearest 100 ml**: a 500 ml jug filled to the top; a 300 ml jug (ticks every 50); a 250 ml cylinder labelled every 50 ml | a 500 ml; b about 80 ml -> 100 ml; c about 120 ml -> 100 ml |
| p.187 Q2d | Focus | Draw the liquid level for 2 and a half litres on a 3 litre jug marked 1L, 2L, 3L with half-litre ticks | 2.5 L line |
| p.188 Q3 | Focus | Full 2 litre jug; someone says pouring away 500 ml leaves 1 litre. Explain what you think | wrong: 2000 - 500 = 1500 ml (1 and a half litres) |
| p.188 Q4 | Practice | A full 400 ml flask: pour out half (how much poured?), a quarter (how much left?), three quarters (how much left?) | 200 ml; 300 ml; 100 ml |
| p.189 Q5 | Practice | Three 1 L containers (A full, B 500 ml, C about 350 ml) and three speech bubbles (exactly half a litre / less than 500 ml / 1000 ml). Match each person to a container and write what you found | A = 1000 ml, B = half a litre, C = less than 500 ml |
| p.190 Q6 | Practice | Jug 1 (labels every 100 ml) holds 400 ml; jug 2 (labels every 250 ml, ticks every 50) is full at 1 litre. Pour three 125 ml drinks from jug 2: will both jugs then hold the same? How much is left in jug 2? | 3 x 125 = 375; 1000 - 375 = 625 ml, so no (625 vs 400) |
| p.191 Q7 | Challenge | True or false: the tallest container always has the largest capacity. Explain and draw examples | false |
| p.191 Q8 | Challenge | A full 1 litre bottle: pour out a quarter - ml left, fraction left; if three quarters were poured out - how many ml, how much left | 750 ml, 3/4; 750 ml, 250 ml |

**Hidden prerequisites / traps:**
- **Fractions of 400** (Q4): half, quarter and three quarters of 400 ml. The textbook only uses fractions of 1 litre (250/500/750). Needs halving twice (400 -> 200 -> 100), then 3 x 100.
- **"How much is left"** after pouring out a fraction (Q4b-c, Q8): a two-step problem (find the fraction, then subtract) - easy to stop after step one.
- **125 ml drinks** (Q6): 3 x 125 = 375 and 1000 - 375 = 625. Multiplying a 3-digit number and subtracting from 1000 is well beyond the textbook. Best handled by repeated addition on a jug scale (125, 250, 375) - note that 125 is an eighth of a litre, never taught.
- **Reading a 50 ml step** on jugs labelled every 100 ml or 50 ml, then rounding to the nearest 100 ml (Q2) - the textbook rounds only on 100 ml marks.
- **Multi-litre jugs** (2 L, 3 L, 5 L): the textbook stays at 1 litre; the workbook expects 2000 ml, 2 and a half litres, 5 litres.

### 13.3 Temperature (workbook p.192-201)

| WB page / Q | Level | What the child does | Numbers |
|---|---|---|---|
| p.192 Worked example 3 | - | A thermometer in boiling water reads 100 °C. Fact: water boils at 100 °C; temperature is measured in degrees Celsius | 100 °C |
| p.192 Q1 | Focus | A thermometer in ice: what does it show? Difference between ice and boiling water | 0 °C; 100 °C |
| p.193 Q2a-d | Focus | Four vertical thermometers 0-40 °C labelled in 5s: coldest, warmest, read C, which two are above 20 °C | A about 1 °C (coldest), B about 31 °C (warmest), C about 16 °C, D about 22 °C; above 20: B and D |
| p.193 Q2e | Focus | Colour a thermometer to show a temperature you like and say hot / warm / cold and why | open, 0-40 °C |
| p.194-195 Q3 | Focus | Horizontal 0-30 °C thermometers with a tick every 1 °C (labels every 1). a) Round A and B to the nearest number on the scale; b) draw "just over 27 °C" and "just under 14 °C"; c) complete "thermometer X is rounded up/down to __ °C" for A-D | A about 26.5 -> 27 (scan: bar ends between 26 and 27, near halfway); B about 12.7 -> 13; C rounds down to 27; D rounds up to 14 |
| p.195 Q4a | Practice | Difference between ice (0 °C) and air on a 0-30 °C thermometer labelled in 2s | air about 24 °C; difference 24 °C |
| p.196 Q4b-c | Practice | Table of monthly temperatures in two countries (Apr-Jul); find each month's difference and the biggest | A: 9, 12, 17, 18; B: 31, 31, 32, 33. Differences 22, 19, 15, 15; biggest April |
| p.196 Q5a-b | Practice | Four thermometers 0-40 labelled in 10s (ticks every 5 - the 5s are unlabelled): which is best for plants that like just over 18 °C, and what does it show | C, about 20 °C (scan: C reads about 20-21, A about 16, B about 11, D about 34) |
| p.197 Q5c | Practice | School must not fall below 15 °C: show and write a temperature that would close schools | any reading below 15 °C |
| p.197 Q6 | Practice | A thermometer with only 0 and 40 labelled and 7 unlabelled marks between: write all the missing labels (each mark is 5 °C), then show a temperature between 15 and 20 °C | 5, 10, ... 35; e.g. 17 °C |
| p.198 Q7 | Challenge | Compare ice (0 °C) and a room thermometer (about 24 °C): fill in "the temperature of the __ is higher than the __"; night is 14 °C lower than the day; show 30 °C below boiling on a 0-100 °C thermometer labelled in 10s | room > ice; 24 - 14 = 10 °C; 70 °C |
| p.199 Q8a | Challenge | Six thermometer tops with unusual scales: A, B labelled every 2 (20-38); C, D labelled every 3 (72-99); E, F labelled every 4 (16-48). Ring higher/lower for A vs B, C vs D, E vs F | A about 29 < B about 32; C about 90 > D about 84; E about 23 > F about 20 |
| p.200 Q8b-c | Challenge | Write each to the nearest labelled division; find the differences A-E, D-B, F-C | e.g. A 28 or 30, B 32, C 90, D 84, E 24, F 20 (scan note: readings between labels are approximate, so differences will vary slightly) |
| p.200-201 Q9 | Challenge | Five thermometers 0-50 °C labelled in 5s with 1 °C ticks; round each to the nearest labelled division and order warmest to coldest | about 9 -> 10; about 27 -> 25; about 43 -> 45; about 38 -> 40; about 15 -> 15. Order 45, 40, 25, 15, 10 |

**Hidden prerequisites / traps:**
- **Boiling 100 °C and freezing/ice 0 °C** (WE3, Q1, Q7): facts the textbook never states; the textbook thermometers only go to 40 °C. Also a 0-100 °C scale labelled in 10s.
- **Scales labelled in 3s and 4s** (Q8): the textbook only uses 2s, 5s and 10s. Counting in 3s and 4s from 72 or 16 is times-table knowledge (MULTIPLICATION dependency for this child).
- **Differences of temperatures** (Q4, Q7, Q8c) up to two digits, including subtracting across a ten (31 - 9, 33 - 18).
- **"Just over" / "just under"** a value (Q3b, Q5a): placing a line slightly past a tick.
- **"Rounded up" vs "rounded down"** as words to write (Q3c), not just the rounded number.
- **Filling in missing scale labels** (Q6): work out that 8 equal gaps from 0 to 40 are 5 each - a division idea, solvable by counting in 5s.

### How the workbook changes the activities

- `scale-reader`: add rounding to the nearest 100 g / 10 g / whole kg (WB Q1, Q5, Q8), a "who is right?" g-vs-kg argument (WB Q2), and a level-3 "colour the part of the dial that rounds to 7 kg" task (WB Q9). Add subtracting from 2 kg / 3 kg as a stretch (WB Q4, Q7).
- `balance-puzzle`: add WB-style sensible-estimate items (carrot, sheep, feather, frog, rabbit, pumpkin, phone) and the "total minus known part" scales problem from WB Worked example 1.
- `jug-reader`: add 2 L, 3 L and 5 L jugs (fill to 2 and a half litres), jugs labelled in 50s and 250s, rounding to the nearest 100 ml, and fractions of 400 ml (halve, halve again).
- `same-amount`: add "how much is left?" pour-out stories (2 L - 500 ml; 1 L - a quarter; 1 L - 3 drinks of 125 ml counted on the jug) and the WB "tallest is always biggest?" true/false.
- `thermo-reader`: add 0 °C ice and 100 °C boiling facts, a 0-100 thermometer labelled in 10s, "just over / just under" line drawing, missing-label scales, and month-temperature difference tables. Scales in 3s and 4s (WB Q8) kept out of the core because of the times-table dependency; offered as an optional challenge.

---

## Proposed activities

Ordered as taught. Ids checked against Unit 6 ids (ruler-lab, which-unit, unit-converter,
estimate-measure, rounding-rover, fence-or-grass, rectangle-builder, square-counter,
mission-challenge): none reused.

### 1. `scale-reader` - Kitchen Scales
- **title:** Kitchen Scales
- **icon:** ⚖️
- **section:** 13.1
- **summary:** Read dial scales in grams and kilograms, then compare two masses with <, > or =.
- **book:** p.201 Worked example 1; p.203 Q3; p.220 Check your progress Q1; Workbook p.179-180 Q1, p.180-181 Q2, p.182 Q4, p.183 Q5, p.184 Q7a, p.185 Q8-Q9
- **Learn screens:**
  1. *1 kg = 1000 g.* A 1 kg bag of rice sits on a kg dial (needle at 1). The child clicks "show in grams": the bag splits into ten 100 g bags and a second dial labelled in grams shows 1000. Bolt: "Same rice, two ways to say it."
  2. *Reading a dial.* A gram dial labelled 0, 100, 200 ... The child drags a fruit onto the pan; the needle swings. The child clicks the label the needle points to. Then the dial changes to one labelled in 10s and the child does it again ("Look at the labels first!").
  3. *Compare with the same units.* Two scales: 500 g and 5 kg. Bolt asks which is heavier. If the child picks 500 g, the 5 kg changes to 5000 g to show why. Child drags the right symbol (<, >, =) between them.
  4. *Rice left over (WE1).* A 1000 g bar of rice; the child drags off 350 g (three 100 g blocks and a 50 g block); 650 g is left. Rule card: change kg to g before subtracting.
- **Practice (count 10):**
  - Level 1: read a dial where the needle sits exactly on a label. Dials 0-50 g (10s), 0-500 g (100s), 0-5 kg (1s). Type the number and pick the unit g/kg.
  - Level 2: needle on a labelled number on dials counting in 250s (0-1250 g) or 0-10 kg; or a pair of dials to compare with <, >, = (pairs include g vs kg such as 1000 g vs 1 kg, 800 g vs 1 kg, 2 kg vs 1500 g).
  - Level 3: needle between two labels (e.g. about 180 g on a 100s dial, about 2.9 on a 0-5 kg dial) - round to the nearest 100 g, 10 g or whole kg (workbook style); or "1 kg bag, use X g, how much is left?" with X in 50s (100-900), stretching to 2 kg or 3 kg totals (3000 - 850); or the workbook's reverse task: tap every part of a 0-10 kg dial that would round to 7 kg.
- **Mistake tags:** Ignored the dial labels; Compared numbers without units; Did not see 1000 g = 1 kg; Subtracted g from kg without converting; Read the wrong label.
- **Parent tips:**
  - Goal: read a weighing scale correctly and know that 1 kg is the same as 1000 g.
  - Say: "What does this dial count in?"; "Grams or kilograms - which is the big one?"; "Can we make both the same unit before we compare?"
  - Watch for: saying 500 g is more than 5 kg because 500 is bigger (the workbook has a child arguing exactly this); guessing the reading without checking the labels; forgetting to say the unit. The workbook also asks him to round scale readings and subtract from 3 kg - more than the textbook teaches, so expect help there.
  - Away from screen: weigh three foods on your kitchen scales (a bag of pasta, an apple, a tin) and read the scale together; check the label on the packet.

### 2. `balance-puzzle` - Balance It!
- **title:** Balance It!
- **icon:** 🍐
- **section:** 13.1
- **summary:** Use a pan balance to find the mass of one item, and choose sensible mass estimates.
- **book:** p.202 Q1-Q2; p.204 Q4-Q5; p.205 Q6; Workbook p.179 Worked example 1, p.182 Q3, p.183 Q6
- **Learn screens:**
  1. *Heavier goes down.* Drag two household items (a book and a sock) onto a pan balance; the heavier side drops. Child predicts first, then drops them in.
  2. *Balanced means equal.* 2 peaches (80 g each, shown as 80 g tags) on the left, pears added one at a time on the right until level (4 pears). The child sees 80 + 80 = 160 split into four equal pears: a 160 bar is cut in half (80) and half again (40). No division sign used.
  3. *Take the same off both sides.* 3 muffins vs 1 muffin + 100 g chocolate. The child clicks a muffin on each side to remove it; the scale stays level. 2 muffins = 100 g, so one muffin = 50 g.
- **Practice (count 8):**
  - Level 1: "Which is sensible?" A picture (sweet, cupcake, apple, tin, bag of sugar, fish bowl, school bag) with three tags differing by a unit or a factor of 10 (e.g. 4 g / 40 g / 4 kg). Click the sensible one.
  - Level 2: balance with N identical items vs a known mass, N = 2 or 4 (halving or halving twice), known masses 20-200 g in tens (e.g. 4 apples = 200 g -> 1 apple 50 g).
  - Level 3: remove-from-both-sides puzzles (3 items vs 1 item + 100 g; 4 items vs 2 items + 60 g) with answers 10-100 g; type the mass of one item and of each side.
- **Mistake tags:** Picked by size not weight; Halved only once; Did not remove the same from both sides; Forgot the known weight.
- **Parent tips:**
  - Goal: understand that a level balance means both sides weigh the same and use that to find a missing mass.
  - Say: "If it stays level, what do we know?"; "What happens if we take one muffin off each side?"; "Half of 160, then half again?"
  - Watch for: choosing the biggest object as heaviest; dividing instead of halving step by step (let him halve twice); rushing past the 'show working' step.
  - Away from screen: hold two objects (one in each hand), guess which is heavier, then check on the kitchen scale. Try to find two different things that weigh about the same.

### 3. `kilo-grid` - Make a Kilogram
- **title:** Make a Kilogram
- **icon:** 🧱
- **section:** 13.1 (Think like a mathematician)
- **summary:** Drag weight tiles into rows that each total exactly 1 kg (1000 g).
- **book:** p.206 Think like a mathematician (both grids)
- **Learn screens:**
  1. *1000 g strip.* A 1 kg bar split into ten 100 g pieces; the child drags 500 g + 300 g + 200 g tiles onto it and it fills exactly. Bolt: "Three weights, one kilogram."
  2. *Number bonds to 1000.* The child drags a 700 g tile onto the strip and is asked what fills the gap (300 g); then makes 300 from 250 + 50 by dropping tiles.
- **Practice (count 8):**
  - Level 1: one row of 3 slots, two tiles placed (multiples of 100, e.g. 400 + 500); choose the missing tile from 3 options.
  - Level 2: one row, one tile placed, multiples of 50 (e.g. 450); choose two tiles from 5 that complete 1000 g.
  - Level 3: full 3x3 grid with the book-style set (9 tiles, multiples of 50, total 3000 g); live row totals turn green at 1000 g; a bonus round asks for rows and columns at once (using the challenge-style set, which has a solution).
- **Mistake tags:** Row total not 1000; Added 50s wrongly; Gave up on the grid (try the biggest tile first).
- **Parent tips:**
  - Goal: practise adding in 50s and 100s to make 1000, which is the same as making 1 kg.
  - Say: "Which is the heaviest tile? What does it need to make 1000?"; "Is this row too heavy or too light?"; "How did you find it?"
  - Watch for: forgetting that 1 kg = 1000 g; mixing 50 and 500; using the same tile twice.
  - Away from screen: use kitchen scales and three foods to try to make as close to 1 kg as possible.

### 4. `jug-reader` - Fill the Jug
- **title:** Fill the Jug
- **icon:** 🥛
- **section:** 13.2
- **summary:** Fill and read measuring jugs in ml and litres, including halves and quarters of a litre.
- **book:** p.207-208 Worked example 2; p.208 Q1; p.209 Q2; p.211 Q4; p.221 Check your progress Q2; Workbook p.186 Q1, p.187 Q2, p.188 Q4, p.189 Q5, p.191 Q8
- **Learn screens:**
  1. *What capacity means.* A teaspoon (5 ml), a bottle (half a litre) and a bowl (a quarter litre). The child drags each to a full 1 litre jug to see how much of it they would fill.
  2. *Two scales, same water (WE2).* Jug 1 marked 250/500/750 ml/1 L, jug 2 marked 1/4, 1/2, 3/4, 1 litre. The child drags a tap to fill both to the halfway line and sees 500 ml = half a litre. Then 250 ml = quarter, 750 ml = three quarters.
  3. *Tins make a litre.* Four 250 ml tins pour into a 1 litre jug and fill it exactly (counting 250, 500, 750, 1000).
  4. *Between the lines.* Water stops at about 620 ml on a jug marked every 100 ml; the child taps the nearest marked line (600) - "nearest marked line" is the rounding rule.
- **Practice (count 10):**
  - Level 1: read a 1 L jug filled exactly to 250, 500, 750 or 1000 ml (scales in ml or in fractions); type ml or click the fraction.
  - Level 2: fill to a target by dragging the tap (e.g. 300 ml on a 100s scale, 3/4 litre on a fractions scale); or "how much drink?" with 1-4 tins of 250 ml (answer in ml and as a fraction of a litre).
  - Level 3: water between 100 ml marks (levels like 380, 520, 690 ml): pick the nearest marked division; or crates of 4 cans to litres with 8, 12 or 16 cans shown in rows of 4 (count the rows); or workbook-style 2 L and 3 L jugs (fill to 2 and a half litres) and a 400 ml flask poured out by halves and quarters (show the flask split into 4 equal bands of 100 ml).
- **Mistake tags:** Read the wrong scale step; Did not see 500 ml = half a litre; Rounded to the wrong mark; Counted cans as litres.
- **Parent tips:**
  - Goal: read a measuring jug and know that 1 litre = 1000 ml, half a litre = 500 ml and a quarter litre = 250 ml.
  - Say: "What does each line on this jug count in?"; "Is the water nearer this line or that line?"; "How many 250s make a litre?"
  - Watch for: reading the label above instead of the nearest one; thinking 1/2 litre is less than 500 ml; counting 4 cans as 4 litres.
  - Away from screen: use a kitchen measuring jug to pour 250 ml, 500 ml and 1 litre of water; pour a 250 ml cup four times into a 1 litre bottle.

### 5. `same-amount` - Same Amount?
- **title:** Same Amount?
- **icon:** 🫗
- **section:** 13.2
- **summary:** Discover that a higher water level does not always mean more water, and solve the two-cup pouring puzzle.
- **book:** p.208 Q1c; p.210 Q3; p.212 Q6; p.213 Think like a mathematician; Workbook p.188 Q3, p.190 Q6, p.191 Q7
- **Learn screens:**
  1. *Marcus's idea.* A tall thin glass and a wide jug. Bolt says "the higher water always has more". The child pours both into two identical measuring jugs and sees which really has more (sometimes the lower one!).
  2. *Pebble in the water.* A cylinder at 500 ml; the child drags a pebble in and the level rises to 600 ml. The child finds the difference (100 ml).
  3. *Two cups.* A 500 ml cup and a 300 ml cup. Buttons: fill, pour into other cup, pour into big bowl, empty. The child makes 1000 ml (two 500s) with Bolt's help.
- **Practice (count 8):**
  - Level 1: two containers of different shapes, both with a hidden ml amount; the child predicts which has more, then pours into identical jugs to check (amounts 100-900 ml in 100s, chosen so the taller level is sometimes the smaller amount).
  - Level 2: pebble/stone displacement: start level and new level shown on a cylinder marked in 100s; type the difference (differences 50-300 ml). Or a workbook-style "how much is left?" pour: a full 1 L or 2 L jug, pour out 500 ml or a quarter; the jug animates and the child reads what remains (answers 250-1500 ml).
  - Level 3: two-cup puzzles with the 500/300 cups: make 800, 200, 700, 600, 100 ml (one target per question), using the bowl as the collector; the number of moves is not limited.
- **Mistake tags:** Judged by level only; Subtracted the wrong way round; Lost track of what is in each cup.
- **Parent tips:**
  - Goal: understand that you can only compare water levels in the same shaped container, and enjoy a pouring puzzle.
  - Say: "How could we make the test fair?"; "What is in each cup right now?"; "How much more do we need?"
  - Watch for: always picking the taller glass; trying random pours without saying what is left; forgetting to find a difference.
  - Away from screen: pour the same cup of water into a tall glass and a wide bowl, and talk about which looks like more. Then try the pebble test in a jug.

### 6. `thermo-reader` - Thermometer Check
- **title:** Thermometer Check
- **icon:** 🌡️
- **section:** 13.3
- **summary:** Read horizontal and vertical thermometers in °C and round to the nearest labelled number.
- **book:** p.214-215 Worked example 3; p.215 Q1; p.216 Q2; p.217-218 Q3; p.222 Check your progress Q4; Workbook p.192 Q1, p.193 Q2, p.194-195 Q3, p.195-196 Q4, p.196-197 Q5-Q6, p.198 Q7, p.200-201 Q9
- **Learn screens:**
  1. *Hot and cold.* Pictures (ice lolly, classroom, sunny day, cup of tea) to drag onto a big thermometer at sensible places. Bolt: "Temperature is measured in degrees Celsius, °C." Then two anchor facts from the workbook: a thermometer in melting ice shows 0 °C and in boiling water shows 100 °C.
  2. *The longer the line, the hotter (WE3).* Two horizontal thermometers labelled in 5s showing 15 °C and 20 °C; the child clicks the hotter, then drags a red line to show 25 °C.
  3. *Different labels.* The same 17 °C shown on a scale labelled in 2s and on one labelled in 5s; the child counts ticks to read it on both.
  4. *Nearest labelled number.* A line at 13 °C on a 5s scale: the child taps the nearest label (15). Bolt explains a reading exactly halfway rounds up.
- **Practice (count 10):**
  - Level 1: read a thermometer exactly on a label (scales labelled in 10s or 5s, 0-40 °C); or click which of two is hotter.
  - Level 2: thermometers with 1 °C ticks labelled in 5s or 2s, readings 11-34 °C; type the exact reading. Or drag the red line to a given temperature (e.g. 26 °C, 27 °C).
  - Level 3: round a reading to the nearest 10 °C or nearest labelled division (vertical scales in 10s without ticks: about 12, 28, 32 °C; workbook-style 0-50 °C scales labelled in 5s); or fill in the missing labels on a scale with only 0 and 40 shown; or a two-country temperature table (difference per month, e.g. 31 - 9); or a day story: start 15-20 °C, rises by 4-8 °C, then falls 1 °C an hour for 3-9 hours (a clock and a moving thermometer help count).
- **Mistake tags:** Counted ticks wrongly; Read the label before the end of the line; Rounded to the wrong label; Forgot °C; Miscounted the hours.
- **Parent tips:**
  - Goal: read a thermometer in degrees Celsius and say which temperature is hotter or colder.
  - Say: "What do the labels count in, and what is each small line worth?"; "Where does the red line stop?"; "Is it nearer 10 or 20?"
  - Watch for: counting the first line as 1 instead of starting at 0; rounding to the nearest small tick instead of a label; forgetting that a longer line means hotter. The workbook expects him to know water freezes at 0 °C and boils at 100 °C (not in the textbook), and has scales counting in 3s and 4s - skip those if times tables are still shaky.
  - Away from screen: read an outdoor or fridge thermometer (or the weather app) each day for a week and say which day was warmest and by how many degrees.

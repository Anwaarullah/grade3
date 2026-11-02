# Unit 1 Numbers to 1000 - syllabus notes (paraphrased; do not copy book text)

Source: Learner's Book 3, printed pages 10-23 (scan image indexes 14-27; offset +4 checked on every page, no drift).
Sections: 1.1 Hundreds, tens and ones (pp.11-15), 1.2 Comparing and ordering (pp.16-19), 1.3 Estimating and rounding (pp.20-22), Check your progress (p.23).

## Notes on this scan (read before using these notes)

* The scanned copy has **pencil answers already written in** (most likely the learner's own book) plus teacher ticks. They are useful evidence of how this child thinks:
  * **Number-square pieces (p.12 Q1, p.16 Q1, p.23 Q1): every time, the squares directly above and below the given number were filled as one less / one more** (e.g. around 256: 257 above, 255 below) instead of ten less / ten more. Same error on all three pages, and it was ticked as correct on p.12. Treat "down a column = +10" as **not yet secure**.
  * p.14 Q5: the value of a ringed digit was written as a label ("3 tens", "9 one", "2 hundred") rather than as a value (30, 9, 200). Acceptable, but the step to "worth 30" should be practised. The follow-up (which tens values were not used) was left blank.
  * p.15 Q6: three of the four numbers (875, 783, 535) used words that were **not** on the given word cards (five, eighty, thirty); two of these were still ticked. The child did not keep to the constraint. Only 873, 853, 378 and 358 are possible.
  * p.13 Q2-Q4 (partitioning, place-value grids, base-ten picture: 215, 632, 564) were all correct. Page 1.2 and 1.3 work is mostly blank apart from a partial answer on p.17 Q2a (correct) and an estimate of 250 spots on p.20.
* No unreadable pages. The arrows on the p.18 Q6 number line are drawn by hand in the book, so the "true" values are approximate (about 175-180, about 320, about 850-860).

## Unit opener (p.10 Getting started, p.11 intro)

* p.10 Getting started (assumed Stage 2 knowledge): fill pieces cut from a 1-100 square around 46, 77, 23 and 52 (left/right = one less/more, up/down = ten less/more); mark 42 and 87 on a 0-100 line marked in tens; round 72, 29, 45 and 60 to the nearest 10 (45 is the halfway case, rounds up to 50; 60 stays 60).
* p.11 intro: numbers to 1000 appear in daily life (365 days in a year, a house number like 321, a book with 180 pages). Picture of a delivery driver holding a parcel addressed to a different house number from the door (312 vs 321): a hint that digit order matters.

## Section 1.1 Hundreds, tens and ones (pp.11-15)

```json
{
 "section": "1.1 Hundreds, tens and ones",
 "book_pages": "11-15 (objectives and key word on p.11; Exercise 1.1 on pp.12-15; Worked example 1 on p.14; Look what I can do on p.15)",
 "objectives": [
  "[Book objective] Say, read and write numbers and number words from 0 to 1000",
  "[Book objective] Know the value of each digit in a 3-digit number",
  "[Book objective] Count on and count back in steps of 1 and 10 from any number",
  "[Inferred from Q2-Q4] Partition a 3-digit number into hundreds + tens + ones and recombine it, from digits, place-value grids and base-ten pictures",
  "[Inferred from TLAM p.14] Reason about which digits are still unused in each place when a set of place-value cards is used up"
 ],
 "vocabulary": [
  "Official key word (p.11 box): thousand",
  "hundreds, tens, ones",
  "digit, 3-digit number",
  "place value, place value grid, place value cards",
  "value (of a digit), represents",
  "number words: hundred, and, -ty words (fifty-, seventy-), one to nine",
  "count on, count back, steps of 1 and 10",
  "number strip / 1 to 1000 number strip (laid out like a 100 square in rows of ten)"
 ],
 "key_facts": [
  "A 3-digit number is made of hundreds, tens and ones; e.g. 327 splits into 300, 20 and 7 (diagram p.11)",
  "The value of a digit depends on its place: the 7 in 472 is in the tens place so it is worth 7 tens = 70 (Worked example 1)",
  "Saying the number aloud helps: you say each digit's value as you read it (four hundred and seventy-two)",
  "In the number-strip pieces the strip is in rows of ten: one square right = +1, one square left = -1, one square down = +10, one square up = -10",
  "Expected answers (derived): 428 = 400 + 20 + 8; 913 = 900 + 10 + 3; 500 + 70 + 6 = 576; 300 + 90 + 5 = 395",
  "Place-value grid answers (derived): 2 hundreds, 1 ten, 5 ones = 215; 6 hundreds, 3 tens, 2 ones = 632; base-ten picture of 5 hundred-squares, 6 ten-sticks and 4 ones = 564",
  "Ringed-digit values for Q5 (derived): 6(3)7 -> 30; 10(9) -> 9; (9)21 -> 900; 3(9)4 -> 90; 76(8) -> 8; (2)53 -> 200. Tens values used across the six numbers: 30, 0, 20, 90, 60, 50, so 10, 40, 70 and 80 were not used",
  "TLAM (derived): the seven numbers use hundreds digits 4,6,3,1,9,2,7, tens digits 7,8,5,3,2,4,9 and ones digits 3,9,8,4,5,7,1. If each digit 1-9 is used once per place, the missing hundreds are 5 and 8, tens 1 and 6, ones 2 and 6, so the two numbers could be 512 and 866, 516 and 862, 562 and 816, or 566 and 812. Different answers come from pairing the leftover digits differently",
  "Word-card numbers (Q6, derived): with one each of hundred, and, eight, three, seventy-, fifty- the only possible numbers are 873, 853, 378 and 358 (exactly four, matching the four answer lines)"
 ],
 "question_types": [
  {
   "type": "Number-strip pieces",
   "description": "Fill the empty squares of jigsaw-like pieces cut from a 1-1000 strip laid out in rows of ten. Given one number in each piece, work out the neighbours left/right (one less/more) and up/down (ten less/more). Shapes: U, H, cross, L",
   "number_ranges": "given numbers 132, 479, 256, 147, 782; answers stay within about 120-800",
   "difficulty": "core",
   "book_page": "12"
  },
  {
   "type": "Partition and recombine",
   "description": "Fill missing digits so a number equals hundreds + tens + ones, then write the number that matches a given hundreds + tens + ones sum",
   "number_ranges": "428, 913; 500+70+6, 300+90+5",
   "difficulty": "core",
   "book_page": "13"
  },
  {
   "type": "Read a place-value grid with counters",
   "description": "Count stars in the 100s, 10s and 1s columns and write the 3-digit number",
   "number_ranges": "215 and 632 (1-6 counters per column)",
   "difficulty": "core",
   "book_page": "13"
  },
  {
   "type": "Read a base-ten picture",
   "description": "Count hundred-squares, ten-sticks and single cubes and write the number",
   "number_ranges": "564",
   "difficulty": "core",
   "book_page": "13"
  },
  {
   "type": "Value of a ringed digit",
   "description": "State what a ringed digit is worth in a 3-digit number; then spot which tens values never appeared in the list",
   "number_ranges": "six numbers between 107 and 921; one ringed digit each (hundreds, tens or ones)",
   "difficulty": "core (the 'not used' follow-up is stretch)",
   "book_page": "14"
  },
  {
   "type": "Reflection",
   "description": "Talk about whether the hundreds, tens or ones digit is easiest to value, and why",
   "number_ranges": "none",
   "difficulty": "core",
   "book_page": "14"
  },
  {
   "type": "Missing place-value-card numbers (Think like a mathematician)",
   "description": "A set of place-value cards made nine 3-digit numbers; seven are listed. Work out what the last two could be, compare with someone else and explain differences",
   "number_ranges": "seven listed numbers 134-925; leftover digits 5,8 / 1,6 / 2,6",
   "difficulty": "challenge",
   "book_page": "14"
  },
  {
   "type": "Write numbers in words from word cards",
   "description": "Use only six given word cards (hundred, and, two -ty words, two digit words) to write four different 3-digit numbers in words",
   "number_ranges": "only 873, 853, 378, 358 can be made",
   "difficulty": "core",
   "book_page": "15"
  }
 ],
 "worked_examples": [
  "Worked example 1 (p.14): find the value of the ringed tens digit in a 3-digit number by reading the number aloud, naming the place of the digit and turning '7 tens' into 70. Teaching point: say the number aloud and the value of each digit is heard as you say it",
  "Not a worked example but a model: the arrow diagram on p.11 shows a number splitting into its hundreds, tens and ones values (and the same three parts joining back into the number)"
 ],
 "misconceptions": [
  "OBSERVED IN THIS CHILD'S BOOK: on number-strip pieces, treating the square below as +1 and above as -1 (as if counting along a line) instead of +10 / -10",
  "Giving the digit instead of its value (saying the 9 in 394 is worth 9, not 90) or giving the place name only",
  "Zero as a place holder: reading 109 as 19, or writing one hundred and nine as 1009 or 19",
  "Writing number words as said, with extra parts: 'three hundred and seventy-eight' written as 30078 or 300708",
  "Mixing up 'teen' and 'ty' words (thirteen vs thirty) when reading or writing",
  "Crossing a hundred when counting on/back in tens: after 790 comes 800, not 7100; one less than 300 is 299",
  "OBSERVED: ignoring the restriction to the given word cards and using any words",
  "In the TLAM, thinking there is only one right answer, or not seeing that the digits are used once per place"
 ],
 "prerequisites": [
  "Place value to 100 and counting in 1s and 10s to 100 (Stage 2; checked in Getting started)",
  "Reading and writing 2-digit number words",
  "Layout of a 100 square (rows of ten) - needed for the strip pieces",
  "No multiplication or division needed. Seeing 7 tens as 70 is the same idea as 7 x 10, but the book treats it as counting tens, so present it with ten-sticks, not as a times fact"
 ],
 "interactive_ideas": [
  "Base-ten builder: drag hundred flats, ten sticks and ones into a place-value mat; the number and its words update live; target-number challenges",
  "Number-square piece puzzle with a visible 'zoom out' to the full rows-of-ten grid, so the child can see why the square below is ten more",
  "Ringed-digit spotlight: click a digit to light up its column and show its value as blocks"
 ]
}
```

## Section 1.2 Comparing and ordering (pp.16-19)

```json
{
 "section": "1.2 Comparing and ordering",
 "book_pages": "16-19 (objectives and key words on p.16; Exercise 1.2 pp.16-18; Think like a mathematician and Look what I can do on p.19)",
 "objectives": [
  "[Book objective] Compare numbers by looking at the value of each digit in turn",
  "[Book objective] Use the inequality symbols is less than (<) and is greater than (>) when comparing two numbers",
  "[Book objective] Order numbers from smallest to greatest and from greatest to smallest",
  "[Book intro, p.16] Estimate where a number belongs on a number line",
  "[Inferred from Q5, Q6] Place and read numbers on a 0-1000 line marked in hundreds"
 ],
 "vocabulary": [
  "Official key words (p.16 box): digit, inequality, inequalities, is greater than (>), is less than (<), symbol",
  "equals (=), the same as",
  "compare, order, smallest, greatest",
  "comes before / after on the number line",
  "estimate (Tip: a sensible guess)"
 ],
 "key_facts": [
  "Compare from the left: hundreds first; if they match look at tens; if those match look at ones",
  "A smaller number comes before (to the left of) a larger one on a number line (speech bubble: 375 is less than 475)",
  "The symbol opens towards the larger number: 643 > 458 and 458 < 643",
  "A 2-digit number is smaller than any 3-digit number (38 in Q3 and 48 in Q4 are distractors)",
  "Expected comparisons (derived): 643 > 458; 475 > 472; 883 > 838",
  "Expected orders (derived): Q3 smallest to greatest 38, 475, 563, 621, 679; Q4 greatest to smallest 834, 483, 438, 384, 48 (all made from the digits 3, 4, 8)",
  "Q6 arrows (approximate, hand-drawn): about 175-180, about 320, about 850-860 - any sensible estimate is accepted",
  "Q7 open inequalities (derived): any number below 263; any number above 671; any number above 457; any number below 346",
  "Middle-of-1000-square neighbours (Q1, derived): around 320 -> 319, 321, 310 above, 330 below; around 890 -> 889, 891, 880, 900; around 650 -> 649, 651, 640, 660",
  "TLAM (derived): with 234, 243, 243, 278, 278, 287 and <, =, > the easy start is 243 = 243 or 278 = 278, then use the others with < or > (e.g. 243 = 243, 234 < 278, 287 > 278). Several solutions exist"
 ],
 "question_types": [
  {
   "type": "1000-square pieces",
   "description": "Fill the four neighbours of a number in a cross-shaped piece of a 1000 square (rows of ten)",
   "number_ranges": "centres 320, 890, 650 (neighbours cross tens and one crosses to 900)",
   "difficulty": "core",
   "book_page": "16"
  },
  {
   "type": "Compare two numbers in a place-value table",
   "description": "Two numbers in 100s/10s/1s columns; complete the sentence frames 'X is greater than Y' and 'Y is less than X'",
   "number_ranges": "458 vs 643 (differ in hundreds); 475 vs 472 (differ in ones); 838 vs 883 (differ in tens)",
   "difficulty": "core",
   "book_page": "17"
  },
  {
   "type": "Order five numbers",
   "description": "Write five number cards in order, smallest to greatest (Q3) and greatest to smallest (Q4); each set contains one 2-digit number",
   "number_ranges": "Q3 38-679; Q4 48-834 (same three digits rearranged)",
   "difficulty": "core",
   "book_page": "17-18"
  },
  {
   "type": "Mark numbers on a 0-1000 line",
   "description": "Mark the five numbers from Q4 on a line marked every 100",
   "number_ranges": "48, 384, 438, 483, 834",
   "difficulty": "core",
   "book_page": "18"
  },
  {
   "type": "Estimate marked values",
   "description": "Arrows point to unlabelled positions on a 0-1000 line marked every 100; estimate each value",
   "number_ranges": "three arrows, roughly 180, 320, 860",
   "difficulty": "core",
   "book_page": "18"
  },
  {
   "type": "Complete inequalities",
   "description": "Fill a box to make each inequality true (box on either side of < or >)",
   "number_ranges": "263, 671, 457, 346; any valid 1-3 digit answer",
   "difficulty": "stretch",
   "book_page": "18"
  },
  {
   "type": "Make statements with <, = and > (Think like a mathematician)",
   "description": "Use six given numbers (two pairs repeated) and the three symbols to make three true statements, find another way, compare with a classmate and find all solutions; decide whether a character's tip (start with = and two equal numbers) is good",
   "number_ranges": "234, 243, 243, 278, 278, 287",
   "difficulty": "challenge",
   "book_page": "19"
  }
 ],
 "worked_examples": [
  "No formal worked example in 1.2. The model is the speech bubble on p.16: one number is less than another and therefore comes earlier on the number line. Teaching point: compare digit by digit from the hundreds",
  "Tip box p.18: an estimate is a sensible guess"
 ],
 "misconceptions": [
  "OBSERVED (p.16 Q1 again): neighbours above/below filled as one less/one more instead of ten less/ten more",
  "Comparing by the ones digit or by 'the biggest digit anywhere' (thinking 389 > 412 because 9 > 2)",
  "Thinking a number with more of a big digit is bigger, e.g. 48 > 384 because 8 is large; or that 38 > 475 because 8 > 5",
  "Reversing < and > (reading the symbol as an arrow pointing to the answer); 'the crocodile eats the smaller one' confusion",
  "Ordering in the wrong direction when the question asks greatest to smallest",
  "On a 0-1000 line, counting each tick as 1 or 10 instead of 100; placing 48 near 480",
  "Thinking an estimate must be exact, or giving a value outside the right hundred",
  "For open inequalities, thinking there is only one correct answer"
 ],
 "prerequisites": [
  "1.1 place value (value of each digit)",
  "Comparing 2-digit numbers and using < and > to 100 (Stage 2)",
  "Number lines marked in tens to 100 (Getting started p.10)",
  "No multiplication or division"
 ],
 "interactive_ideas": [
  "Digit-by-digit comparison machine: two numbers in place-value columns; the machine lights the hundreds first, then tens, then ones, and the child drags the correct symbol between them",
  "Parcel shelf: drag parcels with house numbers onto a shelf in order (smallest to greatest or reverse)",
  "0-1000 number line with a zoom: drop a pin where a number goes, then zoom into that hundred to check"
 ]
}
```

## Section 1.3 Estimating and rounding (pp.20-22) and Check your progress (p.23)

```json
{
 "section": "1.3 Estimating and rounding, plus Unit 1 Check your progress",
 "book_pages": "20-23 (objectives and key words p.20; Exercise 1.3 pp.20-22; TLAM and Look what I can do p.22; Check your progress p.23)",
 "objectives": [
  "[Book objective] Estimate quantities by giving a range of numbers as an estimate",
  "[Book objective] Round numbers to the nearest 10",
  "[Book objective] Round numbers to the nearest 100",
  "[Inferred from the reflection on p.22] Apply rounding to measures and money (dollars, grams, kilometres)",
  "[Inferred from Q5 and TLAM] Recognise when rounding to 10 and to 100 give the same answer"
 ],
 "vocabulary": [
  "Official key words (p.20 box): estimate, range, round, rounding",
  "nearest 10, nearest 100",
  "range (e.g. 400 to 500)",
  "about, roughly",
  "grams, mass (bean table), dollars, kilometres (reflection)"
 ],
 "key_facts": [
  "You do not always need an exact count; an estimate is often enough. You can estimate with a range or by rounding (p.20 intro)",
  "Rounding to the nearest 10 looks at the ones digit; to the nearest 100 looks at the tens digit. A 5 rounds up (assumed - not restated in the book; p.10 has 45)",
  "Bean table (p.21): 100 beans weigh 10 g, 200 weigh 20 g, ... 1000 weigh 100 g, so each 10 g is 100 beans",
  "Bean answers (derived): 56 g is about 560 beans, so an estimate of 400-500 is not good; 24 g is about 240 beans, so 200-300 is good; 78 g is about 780 beans, so a good range is 700-800",
  "Rounding answers (derived): to the nearest 10: 123 -> 120, 678 -> 680, 385 -> 390, 907 -> 910, 740 -> 740, 598 -> 600; to the nearest 100: 123 -> 100, 678 -> 700, 385 -> 400, 907 -> 900, 740 -> 700, 598 -> 600",
  "Q5 (derived): 598 is the only one that gives the same answer (600) both ways",
  "TLAM (derived): numbers that round to the same answer both ways are those within 4 of a hundred: 95-104 (-> 100), 195-204, ... , 995-1000 (-> 1000), and 1-4 (-> 0). Sofia's list of exact hundreds is right but incomplete",
  "Check your progress Q1 (derived): around 384 -> 383 left, 385 right, 374 above, 394 below. The H-shaped piece has only 765 printed, in the cross-bar; so 764 is left of it and 766 right of it, the left column reads 744, 754, 764, 774, 784 from top to bottom and the right column 746, 756, 766, 776, 786",
  "Check your progress Q2 (derived): 56(7) -> 7; (7)29 -> 700; 6(7)4 -> 70; 92(3) -> 3; (8)88 -> 800; 4(4)4 -> 40",
  "Check your progress Q3 (derived): 234 -> 230 / 200; 471 -> 470 / 500; 896 -> 900 / 900; 750 -> 750 / 800; 303 -> 300 / 300; 987 -> 990 / 1000"
 ],
 "question_types": [
  {
   "type": "Estimate a count of spots",
   "description": "Look at a box full of scattered dots and estimate how many (no counting all)",
   "number_ranges": "a few hundred dots (an independent machine count gives about 287; the pencil estimate of 250 is reasonable)",
   "difficulty": "core",
   "book_page": "20"
  },
  {
   "type": "Judge and make range estimates from a table",
   "description": "Use a table linking numbers of beans (100-1000) to their mass (10-100 g) to decide whether a child's range estimate fits a weighed mass, and to give a good range for a mass",
   "number_ranges": "ranges 400-500 and 200-300; masses 56 g, 24 g, 78 g",
   "difficulty": "core (part c is stretch)",
   "book_page": "21"
  },
  {
   "type": "Round to the nearest 10",
   "description": "Round six 3-digit numbers to the nearest 10",
   "number_ranges": "123, 678, 385 (halfway), 907 (crosses to 910), 740 (already a ten), 598 (crosses a hundred to 600)",
   "difficulty": "core",
   "book_page": "21"
  },
  {
   "type": "Round to the nearest 100",
   "description": "Round the same six numbers to the nearest 100",
   "number_ranges": "same six numbers; 907 rounds down to 900",
   "difficulty": "core",
   "book_page": "22"
  },
  {
   "type": "Reflection",
   "description": "Discuss whether the numbers could be rounded the same way if they were dollars, grams or kilometres",
   "number_ranges": "none",
   "difficulty": "core",
   "book_page": "22"
  },
  {
   "type": "Same answer both ways",
   "description": "Find which number in Q3 and Q4 rounds to the same value to the nearest 10 and the nearest 100",
   "number_ranges": "598",
   "difficulty": "stretch",
   "book_page": "22"
  },
  {
   "type": "What could the number be? (Think like a mathematician)",
   "description": "Find numbers that round to the same answer to the nearest 10 and the nearest 100; judge whether a list of only exact hundreds is complete",
   "number_ranges": "0-1000",
   "difficulty": "challenge",
   "book_page": "22"
  },
  {
   "type": "Check your progress",
   "description": "Number-strip pieces (cross around 384, H-shape around 765); value of a ringed digit in six numbers; table rounding six numbers to the nearest 10 and 100",
   "number_ranges": "384, 765; 567, 729, 674, 923, 888, 444; 234, 471, 896, 750, 303, 987",
   "difficulty": "core",
   "book_page": "23"
  }
 ],
 "worked_examples": [
  "No worked example in 1.3. Teaching text p.20: estimates can be a range or a rounded number",
  "The bean table on p.21 acts as a model of checking an estimate against a measurement"
 ],
 "misconceptions": [
  "Rounding the wrong digit (to the nearest 100 by looking at the ones digit), or always rounding down",
  "Changing the other digits: 385 to the nearest 10 written as 400 or 380; 678 to the nearest 100 written as 680",
  "Halfway cases (385, 750, 45): not knowing that 5 rounds up",
  "Crossing a boundary: 598 to the nearest 10 written as 590 or 5100; 987 to the nearest 100 written as 900 or 10000",
  "Thinking 740 'cannot be rounded' to the nearest 10 because it ends in 0",
  "Thinking an estimate is a wrong answer, or trying to count every dot",
  "Reading the bean table as 56 g = 56 beans; or not seeing that 56 g falls between 50 g and 60 g (500-600 beans)",
  "OBSERVED (p.23 Q1): the up/down neighbour error from 1.1 appears again in the end-of-unit check"
 ],
 "prerequisites": [
  "Place value of 3-digit numbers; the 0-1000 number line (1.1, 1.2)",
  "Rounding 2-digit numbers to the nearest 10 (Stage 2; Getting started p.10)",
  "The bean table hides a x10 / /10 relationship (10 g = 100 beans). Treat it as reading across a table or counting in hundreds next to counting in tens, not as multiplying",
  "Grams as a unit of mass (only named here)"
 ],
 "interactive_ideas": [
  "Rounding hill: a number rolls on a hill between two tens (or hundreds); the peak is at 5, so it rolls to the nearer end and a 5 rolls forward",
  "Spot estimate: dots flash for a few seconds; choose a range (e.g. 100-200, 200-300); then the dots are grouped in hundreds to check",
  "Bean jar scale: weigh a jar of beans, read the mass, use the table strip to choose a range"
 ]
}
```

## Workbook

Source: Cambridge Primary Mathematics Workbook 3 (2nd edition), printed pages 8-22 (image index = printed page + 2; the printed page number was checked on every page, no drift). Unit 1 has no opener page in the workbook. Each section has Focus, Practice and Challenge questions; ◆ marks a question with the 'Think like a mathematician' symbol.

**Child's pencil work in the workbook** (the same learner): on pp.8-13 and p.18 and p.22.
* **The up/down number-grid mistake shows up again here, twice (p.8 Q2 and p.12 Q10).** On p.12 the child drew their own rule: up and right mean "+", down and left mean "−". They then filled the whole piece as a +1 chain (501-507 round the U-shape, 896-902 down the H-shape), and the teacher crossed it out. On p.8 they also mixed up left and right (left of 112 written as 115). This is now seen on **five** pages across the two books, so the number-grid piece activity is a priority.
* p.8 Q3: to show 316 they drew **two** hundred-squares (should be three), one ten and six ones.
* p.9 Q5 and p.11 Q8-Q9, p.13 Q13: the child wrote values as labels ("1 hundreds", "8 ten") and wrote **digits where words were asked for** (152, 463, 753, 546, 318). They never wrote a number in words.
* p.18: estimated **1000** dots (about 200 are shown) and gave **100-500** for the middle spoon, a range so wide it overlaps both of the given ranges. They do not yet use the given examples to judge size.
* p.22 Q11 (rounding grid): nearly all correct (teacher wrote "Good"); one slip (558 to the nearest 100 written as 500, still ticked).
* Pages 14-17 and 19-21 are blank.

### 1.1 Hundreds, tens and ones (workbook pp.8-13)

| Q (page) | Level | What the child does | Numbers | Notes / answers |
|---|---|---|---|---|
| 1 (p.8) | Focus | Write the next row of a number square after the 91-100 row | 101-110 | Child correct |
| 2 (p.8) | Focus | Fill strip pieces (cross, L) | around 112, 201, 132 | Correct: 112 → 102 above, 122 below, 111 / 113; 201 → 211, 221, 222; 132 → 122, 142, 131, 133. Child used ±1 |
| 3 ◆ (p.8-9) | Focus | Draw your own picture of 316 that shows the value of each digit, then write it in words | 316 | Open drawing (blocks, abacus, place-value chart) |
| 4 (p.9) | Focus | Read base-ten blocks and a place-value grid with stars | 242, 513 | Child correct |
| 5 (p.9) | Focus | Value of a ringed digit, then which hundreds values were not used | (1)64, 31(5), (4)52, 23(7), 1(2)8, 3(8)1 | 100, 5, 400, 7, 20, 80; hundreds used 100-400, so 500-900 are not used |
| 6 (p.9) | Practice | Next row of the strip after 351-360 | 361-370 | Child correct |
| Worked example (p.10) | - | Draw beads on a 3-spike abacus (100s, 10s, 1s) from place-value arrow cards 600, 20, 3 | 623 | **New model not in the textbook: the spike abacus and arrow cards** |
| 7 (p.11) | Practice | Draw abacus beads for arrow-card numbers | 300+70+5, 700+90+7 | 375, 797 |
| 8 (p.11) | Practice | Read an abacus and write the number in words | 152, 463 | Words needed |
| 9 (p.11) | Practice | Read the shaded cells of a 100s/10s/1s chart and write the number in words | 700, 50, 3 | seven hundred and fifty-three |
| 10 (p.12) | Challenge | Strip pieces: U-shape with 500 in a top corner, H-shape with 899 in the bar | 497-520, 878-920 | Crosses hundreds (899 → 900, 909); harder than any textbook piece |
| 11 (p.12) | Challenge | Count on in 10s along 'worms' with gaps | 157-247; 372-462; 733-823 | Third worm crosses 800 |
| 12 ◆ (p.13) | Challenge | Decide if 3 different digit cards make only 3 different 3-digit numbers | - | No: they make 6 |
| 13 (p.13) | Challenge | Read 3 numbers across and 3 down a 3×3 digit grid and write each in words | grid 5 4 6 / 3 1 8 / 9 7 2 | 546, 318, 972, 539, 417, 682 |

**Hidden prerequisites and traps (1.1):** the bead abacus and arrow (place-value) cards are only taught in the workbook; writing numbers in words is asked for 7 times but the child never did it; the Challenge pieces cross a hundred (899 → 909); counting all the arrangements of 3 digit cards (Q12) is an early combinations idea.

### 1.2 Comparing and ordering (workbook pp.14-17)

| Q (page) | Level | What the child does | Numbers | Notes / answers |
|---|---|---|---|---|
| 1 (p.14) | Focus | Cross pieces of a 1000 strip | around 190, 230, 350 | 190 → 180 / 200 / 189 / 191 (crosses the hundred) |
| 2-3 (p.14) | Focus | Compare two numbers in a table with sentence frames, then rewrite with < and > | 249, 173 | 173 < 249; 249 > 173 |
| 4 (p.15) | Focus | Order smallest to greatest | 327, 79, 236, 64, 142 | two 2-digit numbers |
| 5 (p.15) | Focus | Estimate 3 arrows on a 0-1000 line marked in 100s | about 250, 505, 880 | hand-drawn arrows: accept near values |
| 6 (p.15) | Practice | Two inequalities for two numbers with the same hundreds | 456, 465 | 456 < 465; 465 > 456 |
| 7-8 (p.15-16) | Practice | Order greatest to smallest, then mark on a 0-1000 line | 968, 689, 98, 69, 896 | same three digits; two 2-digit numbers |
| 9 (p.16) | Challenge | Write inequalities about 3 numbers | 574, 753, 547 | |
| 10 (p.16) | Challenge | Copy the pattern of **chained** inequalities with mixed signs | e.g. 547 < 753 > 574 | **Not in the textbook**: reading a 3-part statement in two pieces |
| 11 ◆ (p.16) | Challenge | Missing digit in an inequality; list every answer for one | 634 < 6□1; 765 > □83; 257 > 25□; 372 < □72 | 4-9; 1-6 (0 would not make a 3-digit number); 0-6; 4-9 |
| 12 (p.17) | Challenge | Order six tower heights in metres | 442, 452, 462, 555, 632, 828 | three heights differ only in the tens |
| 13 (p.17) | Challenge | Put digits 1-9 in a 3×3 grid, read six numbers and mark them on a 0-1000 line | open | |

**Traps (1.2):** chained inequalities; missing-digit inequalities where several digits work (the textbook only has missing whole numbers); the 0-1000 line in the workbook has no 50s marks.

### 1.3 Estimating and rounding (workbook pp.18-22)

| Q (page) | Level | What the child does | Numbers | Notes / answers |
|---|---|---|---|---|
| 1 (p.18) | Focus | Estimate the dots in a box | about 200 | Child wrote 1000 |
| 2 (p.18) | Focus | Estimate a range for a spoon of rice, between a smaller spoon (100-200) and a ladle (400-600) | sensible range about 200-400 | Child wrote 100-500 |
| 3 (p.19) | Focus | Round to the nearest 10 | 271, 138, 397, 404 | 270, 140, 400, 400 (397 crosses a hundred) |
| 4 (p.19) | Focus | Round to the nearest 100 | 164, 325, 449, 250 | 200, 300, 400, 300 (449 does not become 500; 250 is halfway) |
| 5 ◆ (p.19) | Practice | Grains table: 5 g = 100 grains, up to 50 g = 1000; judge an estimate and choose a range | 18 g vs 300-400; 31 g | 18 g is between 300 and 400 grains: good. 31 g → 600-700 |
| 6 (p.20) | Practice | Round dollar amounts to the nearest $10 | $537, $772, $695, $808 | $540, $770, $700, $810 |
| 7 (p.20) | Practice | Round kilograms to the nearest 100 kg | 150, 555, 444, 501 | 200, 600, 400, 500 |
| 8-9 (p.21) | Challenge | Round tower heights to the nearest 10 m and 100 m; which round to the same 100 | the six heights from p.17 | 462 and 452 → 500; 632 and 555 → 600 |
| 10 ◆ (p.21) | Challenge | All numbers that round to 500 both to the nearest 10 and the nearest 100 | - | 495-504 |
| 11 (p.22) | Challenge | Round a 3×3 grid to the nearest 100 directly, and also by rounding to 10 first; say what you notice | 323 645 809 / 952 216 448 / 747 558 178 | **Rounding twice can change the answer**: 645 → 600 directly but 650 → 700; 448 → 400 but 450 → 500; 747 → 700 but 750 → 800 |
| 12 ◆ (p.22) | Challenge | A shop rounds every price to the nearest $10: would every customer be happy? | - | Some prices go up, some go down |

**Hidden prerequisites and traps (1.3):** the grains table counts in 5 g steps (5 g → 100 grains), so the child needs to count in 5s and 100s side by side, which is harder than the textbook's 10 g = 100 beans; kilograms and dollars appear with no teaching; **double rounding** (Q11) is a real trap, and the textbook never mentions it; Q10 needs a systematic list.

## Proposed activities

### 1. `place-value-builder` - Build a number
* **title**: Build a number · **icon**: 🧱 · **section**: 1.1
* **summary**: Build, read and split 3-digit numbers with hundreds, tens and ones blocks.
* **book**: p.11 diagram; p.13 Q2-Q4; p.14 Worked example 1 and Q5; p.23 Q2. Workbook p.8 Q3, p.9 Q4-Q5, p.10 Worked example 1 (abacus), p.11 Q7-Q9
* **Learn screens**
  1. A shop delivery of sweets: 3 boxes of 100, 2 bags of 10, 7 loose. Bolt counts in 100s then 10s then 1s; the child clicks each group and sees 300 + 20 + 7 = 327 written underneath.
  2. Drag blocks onto a hundreds/tens/ones mat to make a number Bolt says (e.g. 408). Zero tens is highlighted: an empty column still needs a 0.
  3. Click any digit of a number: its column lights up and its blocks pulse; the value appears (the 9 in 394 is worth 90 = 9 tens).
  4. The same number three ways (as in the workbook): blocks, beads on a 3-spike abacus, and arrow cards (300 | 70 | 5) that slide together into 375. Dragging an arrow card apart splits the number again.
* **Practice (count 9)**
  * Level 1: read a block picture or counters in a place-value grid and type the number (100-999, no zeros; each column 1-6 pieces).
  * Level 2: build a target number by dragging blocks (including numbers with a 0 in the tens or ones, e.g. 406, 750), or fill a missing part: 428 = 400 + __ + 8.
  * Level 3: value of a highlighted digit (choose 9 / 90 / 900, then type the value, not a label like '9 tens'), recombine out of order: 6 + 300 + 50 = __, and read a bead abacus (beads on each spike) or put beads on it to show a number.
* **Mistake tags**: Gave the digit not its value · Wrote a label instead of a value · Forgot the zero place holder · Mixed up tens and ones · Miscounted blocks
* **Parent tips**
  * Goal: know what each digit in a 3-digit number is worth.
  * Say: "Read it aloud - which word tells you the hundreds?" · "How many tens is that? So what is it worth?" · "Is there anything in the tens? Then what goes there?"
  * Watch for: answering 9 when the value is 90; writing 4008 for four hundred and eight; counting a ten-stick as one.
  * Away from screen: make 3-digit numbers with coins or bundles of 10 straws (bundles of 10 bundles for hundreds) and swap - one person builds, the other reads.

### 2. `number-square-pieces` - Number grid jigsaw
* **title**: Number grid jigsaw · **icon**: 🧩 · **section**: 1.1 (and 1.2 Q1, CYP Q1)
* **summary**: Fill the gaps in pieces of a 1-1000 number grid by counting on and back in 1s and 10s.
* **book**: p.12 Q1; p.16 Q1; p.23 Q1; Getting started p.10 Q1. Workbook p.8 Q1-Q2, p.9 Q6, p.12 Q10-Q11 (pieces and counting-in-10s worms), p.14 Q1
* **Learn screens**
  1. A full rows-of-ten grid (e.g. 301-400). Bolt moves right (+1), left (-1), then down (+10) and up (-10); arrows and +1 / +10 labels stay on screen. The child clicks "down" and sees the tens digit change, not the ones.
  2. A piece is cut out of the grid and floats free; the child drops it back into its place to see the neighbours.
  3. Counting on/back in 10s across a hundred: 380, 390, 400, 410 on a moving strip.
* **Practice (count 9)**
  * Level 1: a cross-shaped piece around a number 100-500 (no crossing of tens or hundreds); fill all four.
  * Level 2: L, T or U-shaped pieces (5-7 squares) with a centre in 100-999; some cross a ten (e.g. 389 -> 390).
  * Level 3: H- and U-shaped pieces that cross a hundred (e.g. 899 in the bar of an H: 909 below, 889 above), and counting-in-10s 'worms' with gaps (e.g. 733 … 823, crossing 800), forwards and backwards.
  * A "peek at the grid" button shows the surrounding rows faintly after a wrong try.
* **Mistake tags**: Used +1 for the square below · Used -1 for the square above · Lost the hundreds when crossing · Counted on instead of back
* **Parent tips**
  * Goal: move around a number grid in 1s and 10s from any 3-digit number.
  * Say: "Going down a row - how many squares did you skip?" · "Which digit changes when we go down?" · "What comes after 99 tens... 390, then?"
  * Watch for: **his books show the up/down = one more/less mistake on five pages; in the workbook he even made his own rule "up and right are plus, down and left are minus". Go slowly on Level 1, use the peek button, and keep asking "how many squares did you skip?"**; trouble crossing a hundred.
  * Away from screen: write a 100-square on squared paper (e.g. 401-500), cut out small shapes with one number left on each and fill the rest together.

### 3. `number-word-cards` - Number word cards
* **title**: Number word cards · **icon**: 🔤 · **section**: 1.1
* **summary**: Read and build number names to 1000 with word cards, and match words to digits.
* **book**: p.15 Q6; p.11 objective (say, read and write numbers and words). Workbook p.9 Q3, p.11 Q8-Q9, p.13 Q12-Q13
* **Learn screens**
  1. A house number on a door (e.g. 573). Bolt reads it; each word card (five / hundred / and / seventy- / three) lights its matching digit.
  2. Word cards that sound alike: thirteen vs thirty, fifteen vs fifty; click to hear and see the digits.
  3. A tray of only six cards: the child sees that you can only make numbers from the cards you have.
* **Practice (count 8)**
  * Level 1: number shown in digits (100-999, no zeros) - pick the correct name from 3 options.
  * Level 2: drag word cards into order to name a number shown in digits (includes 'and' and hyphenated -ty words; includes numbers like 408, 610, 1000).
  * Level 3: given a fixed set of six cards (one of each), build all the numbers they allow (e.g. the four from p.15); then type digits for a number given in words.
* **Mistake tags**: Wrote the number as it sounds (300708) · Mixed teen and -ty · Used a card that was not there · Left out the zero
* **Parent tips**
  * Goal: read and write number words from 0 to 1000.
  * Say: "Which card tells you the hundreds?" · "Can you only use the cards on the tray?" · "Say it slowly - is it thirteen or thirty?"
  * Watch for: using words that are not on the cards (seen in his book); writing digits when words are asked for (he did this every time in the workbook); writing 300708 for three hundred and seventy-eight.
  * Away from screen: read house numbers, page numbers or prices aloud on a walk and write one or two in words at home.

### 4. `compare-and-order` - Bigger or smaller?
* **title**: Bigger or smaller? · **icon**: ⚖️ · **section**: 1.2
* **summary**: Compare 3-digit numbers digit by digit, use < and >, and put numbers in order.
* **book**: p.16 intro; p.17 Q2-Q3; p.18 Q4 and Q7; p.19 TLAM. Workbook p.14 Q2-Q3, p.15 Q4 Q6-Q7, p.16 Q9-Q11, p.17 Q12
* **Learn screens**
  1. Two parcels with numbers in place-value columns (458 and 643). Bolt compares hundreds first; the bigger hundred glows and the comparison is decided.
  2. Equal hundreds (475 vs 472): hundreds tie, tens tie, ones decide. The child clicks the column that decides.
  3. The < and > symbols: the open side faces the bigger number; the child drags a symbol between two numbers and reads the sentence aloud ("is less than").
* **Practice (count 9)**
  * Level 1: click the greater of two numbers (100-999, differ in hundreds); then choose <, > or = .
  * Level 2: numbers that tie in hundreds or hundreds and tens (e.g. 838 vs 883, 475 vs 472); drag the correct symbol; include = for identical numbers.
  * Level 3: drag 5-6 parcels (or tower heights in metres) onto a shelf in order (smallest to greatest or greatest to smallest, the direction is shown with a picture); sets include 2-digit numbers and the same digits rearranged (48, 834, 438, 384, 483); type any number that makes __ < 263 true; or find every digit that fits a missing-digit inequality (372 < □72 → tick 4, 5, 6, 7, 8, 9).
* **Mistake tags**: Compared the ones first · Reversed < and > · Thought a 2-digit number was bigger · Ordered the wrong way round
* **Parent tips**
  * Goal: compare and order 3-digit numbers starting with the hundreds.
  * Say: "Look at the hundreds first - which is more?" · "They're the same - what next?" · "Read it out: 458 is less than 643."
  * Watch for: thinking 48 is bigger than 384 because of the 8; turning < and > round.
  * Away from screen: write five prices or house numbers on cards and line them up from smallest to greatest on the table.

### 5. `number-line-1000` - Where on the line?
* **title**: Where on the line? · **icon**: 📏 · **section**: 1.2
* **summary**: Place and estimate numbers on a 0-1000 number line marked in hundreds.
* **book**: p.16 intro; p.18 Q5-Q6; Getting started p.10 Q2. Workbook p.15 Q5, p.16 Q8, p.17 Q13
* **Learn screens**
  1. A long street with houses 0-1000, a sign every 100. Bolt walks to 438: first to the 400 sign, then a bit less than halfway to 500.
  2. Zoom in: the gap between 400 and 500 opens into ten 10-steps to show where 438 sits.
  3. An arrow on the line: the child sees the two nearest signs and picks a sensible estimate (it is a sensible guess, not an exact answer).
* **Practice (count 9)**
  * Level 1: drag a pin to a multiple of 100 or 50 on the 0-1000 line (accept within ±20).
  * Level 2: place any 3-digit number (accept within ±30); then read a pin at a multiple of 10 using a zoomed 100-section.
  * Level 3: an arrow at an unlabelled place - type an estimate (accept within ±40); include a 2-digit number like 48 near the start.
* **Mistake tags**: Counted each mark as 10 not 100 · Put a 2-digit number too far along · Estimate in the wrong hundred
* **Parent tips**
  * Goal: know roughly where any number to 1000 lives on a number line.
  * Say: "Which two hundreds is it between?" · "Is it nearer the start or the end of that gap?" · "A guess near enough is fine."
  * Watch for: placing 48 near 480; worrying about being exact.
  * Away from screen: chalk or tape a 0-1000 line along the hallway with marks every 100 and stand where a called number would be.

### 6. `rounding-hill` - Rounding hill
* **title**: Rounding hill · **icon**: ⛰️ · **section**: 1.3
* **summary**: Round 3-digit numbers to the nearest 10 and 100 and give sensible range estimates.
* **book**: p.20 Q1; p.21 Q2-Q3; p.22 Q4-Q5 and TLAM; p.23 Q3. Workbook p.18 Q1-Q2, p.19 Q3-Q5, p.20 Q6-Q7, p.21 Q8-Q10, p.22 Q11-Q12
* **Learn screens**
  1. A number ball sits on a hill between 380 and 390; the top of the hill is at 385. Balls left of the top roll back to 380, the top and beyond roll on to 390. The child drops 383, 385 and 388 to watch.
  2. The same hill stretched between 300 and 400 (top at 350): rounding to the nearest 100 looks at the tens digit.
  3. Estimating with a range: a jar of buttons is shown for a few seconds; the child picks a range (100-200, 200-300, 300-400), then the buttons are sorted into hundreds to check.
* **Practice (count 10)**
  * Level 1: round to the nearest 10 (100-999, not crossing a hundred, no 5s); click the end of the hill or type.
  * Level 2: round to the nearest 100, include halfway cases (385, 750) and numbers ending in 0 (740).
  * Level 3: crossing boundaries (598 -> 600, 987 -> 990 / 1000); the 'same both ways' question (which of these rounds to the same answer to 10 and to 100?); a bean-table question (24 g -> choose the range 200-300); rounding money and masses ($695 to the nearest $10, 150 kg to the nearest 100 kg); and the double-rounding trap: round 645 to the nearest 100 directly (600), then by way of the nearest 10 (650 → 700), and see why the direct way is right.
* **Mistake tags**: Looked at the wrong digit · Rounded 5 down · Changed digits that should stay · Trouble crossing a hundred · Rounded twice · Estimate far too big or small
* **Parent tips**
  * Goal: round any number to 1000 to the nearest 10 and 100.
  * Say: "Which two tens is it between?" · "Is it past halfway?" · "Exactly halfway rolls forward."
  * Watch for: 598 rounded to 590 or 5100; using the ones digit when rounding to 100; wild estimates (in the workbook he guessed 1000 for about 200 dots), so ask him to compare with a group of 10 or 100 first.
  * Away from screen: in a shop, round prices to the nearest 10 or 100 and guess the total; count a handful of dried beans by estimating a range first.

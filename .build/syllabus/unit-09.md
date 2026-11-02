# Unit 9 More addition and subtraction (9.1-9.3) - syllabus notes (paraphrased; do not copy book text)

Source: Learner's Book 3, printed pages 133-149. There is no project page after this unit (Unit 10 starts on p.150).

## Scan notes (important)
- **Printed pages 136 and 137 are missing from the scan.** Image index 139 is printed p.135 and image index 140 is printed p.138. The two pages do not appear anywhere else in `.build/pages.txt` (I checked the corner page numbers of all 294 images).
- **Offset drift:** image index = printed page + 4 up to p.135, then **printed page + 2 from p.138 to the end of the book** (checked at p.138-177, 178, 190, 202, 214 ... 288). Every later unit (10 onwards) must use +2, not +4.
- The workbook (pp.109-114, see the Workbook part below) fills much of the gap, including the only written column method.
- What is lost: the end of Exercise 9.1 (after Q2) and the start of what follows. Q5-Q7 on p.138-139 survive, so pp.136-137 must hold Exercise 9.1 Q3 and Q4. Exercise 9.2 has a "Worked example 2" (p.142), which implies a **Worked example 1 on p.136-137** that is also lost (probably column addition with regrouped tens, since "column addition" is a 9.1 key word and no column method is shown on the surviving pages). Anything about 9.1 Q3-Q4 or Worked example 1 below is inferred, not read.
- Exercise 9.3 Q5 (p.148) is lettered a, b, c, e, f, g, h, i: there is no part d (book misprint).
- Pages read: 133, 134, 135, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149 (15 of 17).

## Unit opener (p.133-134)

```json
{
 "section": "Unit 9 opener: Getting started and introduction",
 "book_pages": "133-134 (p.133 = title page with Getting started Q1-Q3; top of p.134 = unit introduction with an ice-skating score board picture; the rest of p.134 starts 9.1)",
 "objectives": [
  "[Unit intro, p.134] The way you add or subtract depends on the numbers; the unit builds methods and helps you work mentally",
  "[Inferred from Getting started] Recall from Unit 3: estimate, then add or subtract two 3-digit numbers and show a method"
 ],
 "key_facts": [
  "Getting started Q1: 519 + 348 = 867 (estimate about 520 + 350 = 870) (derived)",
  "Getting started Q2: 375 - 168 = 207 (estimate about 380 - 170 = 210) (derived)",
  "Getting started Q3: a child partitions 473 - 245 two ways and gets 228 and 232. The correct answer is 228. The first method regroups 473 as 400 + 60 + 13 so it can take 5 from 13. The second method wrongly does 3 - 5 as if it were 5 - 3 (giving +2 instead of -2); 200 + 30 - 2 = 228 fixes it",
  "Opener picture (p.134): a skating score board shows 143, 152 and 174 points and a 37-point penalty to be subtracted; the speech bubble asks for the total score. Derived answer 143 + 152 + 174 - 37 = 432"
 ],
 "question_types": [
  {"type": "Word problem, addition", "description": "Library with two kinds of books: estimate, then find the total and show a method", "number_ranges": "two 3-digit numbers, total under 1000, regrouping ones", "difficulty": "core", "book_page": "133"},
  {"type": "Word problem, subtraction", "description": "Factory makes T-shirts and a van takes some: estimate, then find how many are left", "number_ranges": "3-digit minus 3-digit, regrouping in ones and tens", "difficulty": "core", "book_page": "133"},
  {"type": "Spot and fix the mistake", "description": "A child has done the same subtraction two ways (expanded column and partitioning) and got two answers. Find and correct the error", "number_ranges": "473 - 245 with an estimate of 470 - 250 = 220", "difficulty": "stretch", "book_page": "133"}
 ]
}
```

## 9.1 Addition: regrouping tens and reordering

```json
{
 "section": "9.1 Addition: regrouping tens and reordering",
 "book_pages": "134-139 (p.134 lower half = objectives, intro, key words; p.135 = Exercise 9.1 Q1-Q2; p.136-137 MISSING FROM SCAN; p.138 = Q5 (spinner), reflection, Q6 (digit grid); p.139 = reflection, Q7, Look what I can do!)",
 "objectives": [
  "[Book objective] Make an estimate, then add a pair of 2-digit numbers where the ones or the tens need regrouping",
  "[Book objective] Make an estimate, then add 3-digit numbers (up to two of them) where the ones or the tens need regrouping",
  "[Book objective] Change the order of the numbers being added when that makes the calculation easier",
  "[Repeated as 'Look what I can do!' on p.139]",
  "[Intro, p.134] Learners can already regroup ones; now they regroup tens when there are more than 9 tens in the tens place",
  "[Inferred from Q5 and its speech bubble] Use the fact that addition is commutative and associative to choose an efficient order (e.g. look for pairs that make 10, or doubles)",
  "[Inferred from Q7] Write 3-digit numbers in words and explain how place value shows in words and in digits"
 ],
 "vocabulary": [
  "Official key words (p.134 box): associative, column addition, commutative",
  "regroup, regrouping the tens / the ones",
  "estimate, total, number sentence",
  "place value grid, 100s, 10s, 1s",
  "reorder, efficient, method"
 ],
 "key_facts": [
  "When the tens add up to 10 or more, 10 tens are regrouped as 1 hundred (e.g. 6 tens + 5 tens = 11 tens = 1 hundred and 1 ten)",
  "When the ones add up to 10 or more, 10 ones are regrouped as 1 ten",
  "Commutative: you can add numbers in any order and get the same total. Associative: you can group them in any way (spoken by a character on p.138, 'addition is commutative and associative')",
  "Q1 derived: 43 + 56 = 99 (no regrouping; estimate 40 + 60 = 100); 67 + 29 = 96 (regroup ones; estimate 70 + 30 = 100)",
  "Q2 derived: the place value grid shows 6 tens + 4 ones and 5 tens + 3 ones, i.e. 64 + 53 = 117 (estimate 60 + 50 = 110). The 11 tens regroup into 1 hundred and 1 ten, so the total grid has 1 hundred, 1 ten, 7 ones",
  "Q5 spinner numbers: 1 to 9 (one of each). Repeats are allowed (it is a spinner), so three spins give totals 3-27 and four spins give totals 4-36",
  "Q6 digit grid (3 by 3): rows read 132, 253, 341; columns read 123, 354, 231. Adding all three rows gives 726 and all three columns gives 708 (derived)",
  "Q7: e.g. 253 is 'two hundred and fifty-three' - the hundreds digit gives 'two hundred', the tens digit gives 'fifty', the ones digit gives 'three'",
  "[Missing pages] Q3-Q4 and Worked example 1 are not available; from the objectives they very likely practise 2-digit and 3-digit additions that regroup the tens, possibly in column form"
 ],
 "question_types": [
  {"type": "2-digit + 2-digit with estimate", "description": "Estimate, then add two 2-digit numbers and show a method", "number_ranges": "43 + 56 (no regrouping), 67 + 29 (regroup ones); totals under 100", "difficulty": "core", "book_page": "135"},
  {"type": "Add numbers shown as place value counters", "description": "Two numbers are shown as tens and ones counters in a place value grid. Estimate, write the number sentence and draw the total in a 100s/10s/1s grid", "number_ranges": "64 + 53 = 117 (regroup tens into a hundred)", "difficulty": "core", "book_page": "135"},
  {"type": "[Missing] Exercise 9.1 Q3-Q4", "description": "Not in the scan. Probably 2-digit and 3-digit additions that regroup tens", "number_ranges": "unknown", "difficulty": "unknown", "book_page": "136-137"},
  {"type": "Spinner: add three or four single digits", "description": "Use a paper-clip spinner numbered 1-9. Spin three times and add the numbers, showing the method; then spin four times and add. Reorder the numbers to make adding easier. Then discuss which method is most efficient and why", "number_ranges": "three or four digits 1-9, repeats possible; totals 3-27 (three spins) and 4-36 (four spins)", "difficulty": "core", "book_page": "138"},
  {"type": "Choose and add three 3-digit numbers from a grid", "description": "Read three different 3-digit numbers across or down a 3 by 3 digit grid; estimate and add them, showing a method; explain the chosen order to a partner", "number_ranges": "132, 253, 341, 123, 354, 231; totals about 500-950", "difficulty": "stretch", "book_page": "138-139"},
  {"type": "Numbers in words", "description": "Write two of the 3-digit numbers from Q6 in words and explain how place value appears in words and in digits", "number_ranges": "3-digit numbers from the grid", "difficulty": "core", "book_page": "139"}
 ],
 "worked_examples": [
  "Worked example 1 is on the missing pages (136-137) and could not be read",
  "Getting started Q3 (p.133) acts as a model of two partitioning layouts for subtraction (expanded columns and a partitioned number sentence)"
 ],
 "misconceptions": [
  "Writing 11 tens as '11' in the tens column (e.g. 64 + 53 = 1117) instead of regrouping into 1 hundred and 1 ten",
  "Forgetting to add the regrouped ten or hundred",
  "Regrouping ones correctly but not recognising when the tens need regrouping (only practised ones before)",
  "Estimating by rounding wrongly or not using the estimate to check",
  "Adding single digits in the given order and counting on in ones, instead of looking for pairs to 10 or doubles",
  "Thinking that changing the order changes the answer",
  "Misreading the grid in Q6 (reading diagonally or using the same number twice)",
  "Writing numbers in words with place value errors (e.g. 'two hundred and five three')",
  "Specific to this child: confident with basic +, so this section should feel achievable; the main risk is the hundreds regrouping step and organising work in columns"
 ],
 "prerequisites": [
  "Place value to 1000: hundreds, tens and ones (Unit 1) - flagged",
  "Regrouping 10 ones as 1 ten (Unit 3)",
  "Number bonds to 10 and to 20; doubles",
  "Rounding to the nearest 10 and 100 for estimates (Unit 1)",
  "Reading and writing 3-digit numbers in words"
 ],
 "interactive_ideas": [
  "Place value mat with counters: drag tens and ones counters for two numbers into a total row; when 10 tens collect, a 'swap' button bundles them into 1 hundred (animated)",
  "Estimate first: round each number on a number line, then the exact answer appears next to the estimate for a 'close enough?' check",
  "Spinner and reorder: spin three or four digits, then drag the number cards into pairs that make 10 or doubles before adding",
  "Digit grid hunt: click a row or column of a 3 by 3 grid to pick 3-digit numbers, then add them with the place value mat",
  "Say it in words: build the word form from tiles (two hundred / and / fifty / three)"
 ]
}
```

## 9.2 Subtraction: regrouping tens

```json
{
 "section": "9.2 Subtraction: regrouping tens",
 "book_pages": "140-144 (p.140 = objectives, intro, key words, Exercise 9.2 Q1; p.141 = Q2-Q3; p.142 = Q4, reflection, Worked example 2; p.143 = Q5, Think like a mathematician; p.144 top = reflection and Look what I can do!)",
 "objectives": [
  "[Book objective] Make an estimate, then take a 2-digit number from a 3-digit number, regrouping where needed (ones or tens)",
  "[Book objective] Make an estimate, then take one 3-digit number from another, regrouping where needed (ones or tens)",
  "[Book objective] Find a missing number by guessing, checking and improving the guess",
  "[Repeated as 'Look what I can do!' on p.144]",
  "[Intro, p.140] Learners can already regroup 1 ten as 10 ones; now they regroup 1 hundred as 10 tens when there are not enough tens",
  "[Inferred from reflection on p.142] Check a subtraction with a different calculation (e.g. the inverse addition)"
 ],
 "vocabulary": [
  "Official key words (p.140 box): exchange, regroup, trial and improvement, unknown",
  "estimate, method, place value grid",
  "unknown value (shown as a smiley face, a bag of marbles, a triangle or a box)",
  "digit, odd, even"
 ],
 "key_facts": [
  "Regrouping a hundred: 1 hundred is exchanged for 10 tens, e.g. 235 = 100 + 130 + 5 (the done example on p.140)",
  "Q1 derived: 452 = 300 + 150 + 2; 763 = 600 + 160 + 3; 309 = 200 + 100 + 9 (0 tens becomes 10 tens)",
  "Q2 derived: 246 - 84 = 162 (estimate 250 - 80 = 170); the grid shows 2 hundreds, 4 tens, 6 ones, and 1 hundred must be exchanged to take 8 tens",
  "Q3 derived: 148 - 60 = 88; 245 - 82 = 163; 326 - 71 = 255; 534 - 93 = 441 (all regroup a hundred into tens)",
  "Q4 derived: 339 - 163 = 176; 355 - 172 = 183; 647 - 386 = 261; 518 - 248 = 270 (518 - 248 regroups both a ten and a hundred)",
  "Trial and improvement: choose a sensible first try, check it, then adjust by a small amount until it works",
  "Q5 derived: 243 - ? = 151 gives 92 adults; ? + ? = 34 gives 17 marbles each",
  "Think like a mathematician derived: 3?7 - 1?7 = 160. The ones cancel (7 - 7 = 0) so the tens must give 6 tens: the second tens digit is 4 more than the first. Pairs (first, second) = (0,4), (1,5), (2,6), (3,7), (4,8), (5,9); e.g. 307 - 147 = 160 and 357 - 197 = 160. Two digits that differ by 4 are both odd or both even"
 ],
 "question_types": [
  {"type": "Exchange a hundred for ten tens", "description": "Rewrite a 3-digit number with one hundred moved into the tens, following a done example", "number_ranges": "235 (done), 452, 763, 309 (zero tens)", "difficulty": "core", "book_page": "140"},
  {"type": "Subtract with a place value grid", "description": "Estimate, then subtract a 2-digit number from a 3-digit number shown as counters, and draw the answer in an empty grid", "number_ranges": "246 - 84", "difficulty": "core", "book_page": "141"},
  {"type": "3-digit minus 2-digit with estimate", "description": "Estimate then subtract, showing a method; compare methods with a partner", "number_ranges": "148 - 60, 245 - 82, 326 - 71, 534 - 93 (not enough tens each time)", "difficulty": "core", "book_page": "141"},
  {"type": "3-digit minus 3-digit with estimate", "description": "Estimate then subtract, showing a method; then check two answers by a different calculation", "number_ranges": "339 - 163, 355 - 172, 647 - 386, 518 - 248", "difficulty": "core / stretch", "book_page": "142"},
  {"type": "Find the unknown by trial and improvement", "description": "Word problems with the unknown drawn as a symbol: (a) a park total and the number of children are known, find the adults; (b) two friends share marbles equally, find how many each has", "number_ranges": "243 - ? = 151; ? + ? = 34", "difficulty": "core / stretch", "book_page": "143"},
  {"type": "Missing digits (Think like a mathematician)", "description": "Two 3-digit numbers each have one unknown tens digit and their difference is 160. Find possible digits and decide whether they are both odd, both even or mixed, and explain", "number_ranges": "3?7 - 1?7 = 160; digits 0-9", "difficulty": "challenge", "book_page": "143"}
 ],
 "worked_examples": [
  "Worked example 2 (p.142): a museum has 147 people and 63 are adults; find the children. Written as 147 - ? = 63. The printed reasoning: there must be fewer than 100 children; 147 - 47 = 100, so a bit more must be taken away; it then uses 63 - 47 = 16 and 100 - 16 = 84. Answer 84 children (correct: 147 - 84 = 63). Note for builders: the printed middle steps are muddled (taking 47 leaves 100, which is 37 too many, so the unknown is 47 + 37 = 84); the activity should model a clearer guess-check-improve loop rather than copy these steps. Margin steps: pick a starting point that tells you the size of the answer; improve with a small change; reach the solution. Teaching point: trial and improvement means a sensible first try followed by adjustments",
  "Done example in Q1 (p.140): 235 = 100 + 130 + 5"
 ],
 "misconceptions": [
  "Subtracting the smaller digit from the larger in each column regardless of order (e.g. 246 - 84: 8 - 4 = 4 tens, giving 242)",
  "Exchanging a hundred but forgetting to reduce the hundreds digit",
  "Not knowing what to do when the tens digit is 0 (309)",
  "In 518 - 248: regrouping only once when both ones and tens need it",
  "Estimating with rounding that makes the estimate harder than the sum",
  "Trial and improvement: making random guesses instead of using the result of each try to adjust up or down",
  "Thinking ? + ? = 34 needs dividing, and getting stuck; halving 34 as 'half of 30 is 15, half of 4 is 2' is enough",
  "Missing digits: assuming the two unknown digits must be equal, or only finding one pair",
  "Specific to this child: the marble problem (? + ? = 34) is really halving, which is division by 2. Doubling guesses (15 + 15, 16 + 16, 17 + 17) keeps it as addition"
 ],
 "prerequisites": [
  "Place value to 1000 and partitioning numbers in more than one way - flagged",
  "Regrouping 1 ten as 10 ones (Unit 3)",
  "Subtraction facts within 20",
  "Rounding to the nearest 10 / 100 for estimates",
  "Inverse relationship between addition and subtraction (for checking)",
  "Doubles and halves up to 50 (halving is a flagged division dependency in Q5b)",
  "Odd and even numbers"
 ],
 "interactive_ideas": [
  "Exchange machine: drag a hundred flat into a machine and 10 ten-sticks drop out into the tens column, updating the partition (235 = 100 + 130 + 5)",
  "Subtraction on a place value mat: take away counters; if there are not enough tens, the child must click the exchange button first",
  "Error spotter: Bolt does a subtraction and makes the 'smaller from larger' mistake; the child finds the column where it went wrong",
  "Trial and improvement slider: guess the hidden number, see '243 - your guess = ...' and whether it is too big or too small, and improve",
  "Marble bags: two equal bags must total 34; the child adds or removes marbles from both bags at once until the total matches",
  "Missing digits: two digit dials; find all pairs that make the subtraction correct and sort them into odd/odd, even/even"
 ]
}
```

## 9.3 Complements

```json
{
 "section": "9.3 Complements",
 "book_pages": "144-149 (p.144 lower half = objectives, intro, key words; p.145 = Exercise 9.3 Q1 with a blank 100 square; p.146 = Q2; p.147 = Q3-Q4 and a reflection (is calculating with bonds quicker than counting on or back?); p.148 = Q5, reflection, Think like a mathematician, Look what I can do!; p.149 = Check your progress Q1-Q3, covering the whole unit)",
 "objectives": [
  "[Book objective] Find what must be added to reach 100 or 1000, working with multiples of 10",
  "[Book objective] Find the missing part to make any multiple of 10 or 100 up to 1000",
  "[Book objective] Work out estimates in your head",
  "[Repeated as 'Look what I can do!' on p.148]",
  "[Intro, p.144] With big numbers counting on or back is slow; for multiples of 10, use known number bonds and calculate mentally",
  "[Inferred from Q3] Make a fact ten times larger: 35 + 65 = 100 becomes 350 + 650 = 1000"
 ],
 "vocabulary": [
  "Official key words (p.144 box): blank, complement, mentally",
  "blank 100 square",
  "number facts for 10, number bonds",
  "multiple of 10, multiple of 100",
  "ten times larger",
  "estimate, calculate"
 ],
 "key_facts": [
  "A complement is the number you add to reach a target (e.g. the complement of 35 to 100 is 65)",
  "Use bonds to 10 for the tens and 10 for the ones: for 35, the ones need 5 more to make a ten, then the tens need 6 more to make 100 (the ones digits add to 10 and the tens digits add to 9)",
  "Q1 derived: 35 + 65, 53 + 47, 77 + 23, 81 + 19, 8 + 92 = 100",
  "Q2 pattern derived: 500 + 500, 510 + 490, 520 + 480, 530 + 470, 540 + 460, 550 + 450, 560 + 440, 570 + 430, 580 + 420, 590 + 410 (10 rows; continue in steps of 10)",
  "Q3 derived (ten times larger): 350 + 650, 530 + 470, 770 + 230, 810 + 190, 80 + 920 = 1000",
  "Q4 derived: 880 + 120, 470 + 530, 240 + 760, 510 + 490 = 1000; 340 + 230 = 570; 750 + 150 = 900; 560 + 290 = 850; 370 + 350 = 720; 670 + 140 = 810; 390 + 180 = 570",
  "Q5 derived: 980 - 260 = 720; 740 - 340 = 400; 670 - 380 = 290; 810 - 520 = 290; 760 - 490 = 270; 520 - 370 = 150; 850 - 480 = 370; 630 - 470 = 160",
  "Think like a mathematician derived: two 3-digit multiples of 10 that total 540 run from 100 + 440 to 440 + 100. Counting ordered pairs (100 + 440 and 440 + 100 counted separately) gives exactly 35; if order does not matter there are 18 different pairs (100 + 440 ... 270 + 270). So Sofia is right only if swapped pairs count as different",
  "Check your progress derived: Q1 263 + 174 = 437; 475 + 353 = 828; 358 - 187 = 171; 736 - 472 = 264. Q2 (correct the table): 54 and 46 correct; 19 should be 81 (not 91); 77 should be 23 (not 33); 440 should be 560 (not 660); 753 and 247 correct; 288 should be 712 (not 722). Q3: 370 + 290 = 660; 550 + 180 = 730; 670 - 290 = 380; 740 - 460 = 280; 370 + 360 = 730; 820 - 350 = 470"
 ],
 "question_types": [
  {"type": "Complements of 100 with a blank 100 square", "description": "Find the missing number to make 100, using a blank 10 by 10 square and bonds to 10; then say how the square helps", "number_ranges": "35, 53, 77, 81, 8 (complements 65, 47, 23, 19, 92)", "difficulty": "core", "book_page": "145"},
  {"type": "Continue a pattern of complements of 1000", "description": "A table starts 500 + 500, 510 + 490; continue it for 8 more rows; check with a partner", "number_ranges": "multiples of 10 from 500 to 590 with partners 500 down to 410", "difficulty": "core", "book_page": "146"},
  {"type": "Make it ten times larger", "description": "Turn each complement of 100 from Q1 into a complement of 1000 by making both numbers ten times larger", "number_ranges": "350, 530, 770, 810, 80 (complements to 1000)", "difficulty": "stretch (multiplying by 10)", "book_page": "147"},
  {"type": "Missing complements, mental", "description": "Find the missing addend mentally; first to 1000, then to other multiples of 10", "number_ranges": "880, 470, 240, 510 to 1000; 340 to 570; 750 to 900; 560 to 850; 370 to 720; 670 to 810; 390 to 570", "difficulty": "core / stretch", "book_page": "147"},
  {"type": "Mental subtraction of multiples of 10", "description": "Complete a child's estimate calculations mentally, then compare methods with a partner", "number_ranges": "three-digit multiples of 10, e.g. 980 - 260, 760 - 490, 630 - 470 (some cross a hundred)", "difficulty": "core / stretch", "book_page": "148"},
  {"type": "How many pairs? (Think like a mathematician)", "description": "Two 3-digit multiples of ten add to 540; a character claims there are 35 possible pairs. Agree or disagree and explain", "number_ranges": "pairs from 100 + 440 to 440 + 100", "difficulty": "challenge", "book_page": "148"},
  {"type": "Check your progress: estimate and calculate", "description": "Estimate, then add or subtract two 3-digit numbers and show a method", "number_ranges": "263 + 174, 475 + 353, 358 - 187, 736 - 472", "difficulty": "core", "book_page": "149"},
  {"type": "Check your progress: correct the complements", "description": "Check two tables of complements (to 100 and to 1000) and correct the wrong entries", "number_ranges": "54, 19, 77 to 100; 440, 753, 288 to 1000; 4 of the 6 rows are wrong", "difficulty": "core", "book_page": "149"},
  {"type": "Check your progress: mental multiples of 10", "description": "Complete addition and subtraction calculations mentally, including two with a missing number", "number_ranges": "370 + 290, 550 + 180, 670 - 290, 740 - 460, 370 + ? = 730, 820 - ? = 470", "difficulty": "core", "book_page": "149"}
 ],
 "worked_examples": [
  "There is no worked example in 9.3. The intro (p.144) gives the teaching point: for multiples of 10, use known number bonds rather than counting on or back",
  "Q2 provides two starter rows (500 + 500, 510 + 490) as the model for the pattern",
  "Q3 provides one starter (35 + 65 = 100 leads to 350 + 650 = 1000) as the model for scaling by 10"
 ],
 "misconceptions": [
  "Making both digits add to 10 (35 + 75 = 100, i.e. 'the 19 complement is 91') instead of tens adding to 9 and ones to 10",
  "Reversing digits as the complement (19 -> 91, 77 -> 33 style errors, as in the check-your-progress table)",
  "For complements of 1000, making the hundreds add to 10 (440 + 660)",
  "Forgetting that 8 is 08 when finding the complement to 100 (writing 2 or 12 instead of 92)",
  "Ten times larger: adding a zero to only one of the numbers, or to the target only",
  "Crossing a hundred mentally (560 + 290): adding the tens and forgetting to carry into the hundreds",
  "Treating subtraction such as 670 - 380 by subtracting digits without regrouping (getting 310)",
  "Counting on in tens one at a time (slow and error-prone) instead of using bonds",
  "Not knowing whether 100 + 440 and 440 + 100 count as different pairs",
  "Specific to this child: Q3 asks for 'ten times larger'. This can be shown as 'count in tens instead of ones' (35 ones -> 35 tens) without formal multiplication"
 ],
 "prerequisites": [
  "Number bonds to 10 and to 100 (multiples of 10) - must be secure",
  "Place value to 1000 - flagged",
  "Multiplying by 10 / thinking of 35 tens as 350 (flagged multiplication dependency, Q3)",
  "Adding and subtracting multiples of 10 and 100 mentally",
  "Inverse relationship between addition and subtraction (for missing-number forms)"
 ],
 "interactive_ideas": [
  "Blank 100 square shader: shade 35 squares (3 full rows and 5 more); the unshaded part (65) counts itself row by row",
  "Bead string or bar to 100: drag the split point; both parts update; show tens bonds to 9 and ones bonds to 10",
  "Complement ladder: a table of 1000 = ? + ? rows; the child fills the next row as the left number grows by 10",
  "Ten-times machine: drop a ones fact in, it comes out as a tens fact (35 + 65 = 100 -> 350 + 650 = 1000) with counters turning into ten-sticks",
  "Jump number line for mental subtraction of multiples of 10: jump to the next hundred, then on (380 -> 400 -> 670)",
  "Fix Ebele's table: click wrong entries and correct them",
  "Pair counter: list all pairs of multiples of 10 that make 540 and toggle 'count swaps' on/off to see 35 vs 18"
 ]
}
```

## Workbook (Workbook 3, printed pages 109-125)
All 17 pages read; corner numbers confirmed. Because textbook pp.136-137 are missing, the workbook is the main evidence for the 9.1 method: the only written column method in the unit is the expanded partial-sums layout on p.114 Q15 (ones, then tens, then hundreds written at full value, then added). Builders should teach that layout rather than compact carrying.

### 9.1 Addition: regrouping tens and reordering (p.109-114)
Key words: associative, column addition, commutative.
- p.109 Q1 (Focus): place value grid shows 4 tens 4 ones and 8 tens 5 ones. Estimate, draw total in an empty grid, fill boxes. 44 + 85 = 129 (est. 40 + 90 = 130); 12 tens regroup to 1 hundred 2 tens.
- p.110 Q2 (Focus): 53+76=129, 65+54=119, 46+81=127, 66+42=108 (all regroup tens).
- p.110 Q3 (Focus): 129+60=189 (no regrouping), 187+50=237, 164+71=235, 245+172=417.
- p.111 Q4 (Focus): write one thousand as digits (1000); 10 hundreds in it.
- p.111 Q5 (Focus): add 4, 5, 6 two ways, spotting 4+6=10; total 15. Tip box: reorder, addition is commutative and associative.
- p.111 Q6 (Practice): sort 12 sums into No regrouping / Regrouping ones / Regrouping tens. None: 34+52=86, 28+61=89, 43+55=98, 46+31=77. Ones: 25+57=82, 34+38=72, 69+27=96, 36+46=82. Tens: 75+63=138, 54+82=136, 96+21=117, 67+52=119.
- p.111 Q7 (Practice): explain when ones regroup (ones total 10+).
- p.112 Q8 (Practice): tick true statements about 3-digit + tens: ones unchanged (true); tens always change (true for 10-90); hundreds always change (false).
- p.112 Q9 (Practice): 135+73=208, 245+272=517, 571+243=814, 352+153=505.
- p.112 Q10 (Practice): reasoning: is "thousand" the only new number word? (yes).
- p.112 Q11 (Practice): three different single digits totalling 18, name the bond to 10 used. e.g. 9+1+8, 7+3+8, 6+4+8.
- p.113 Q12 (Practice): estimate and add 375+321+283=979 (est. 380+320+280=980).
- p.113 Q13 (Challenge): 3-digit number + some tens = 364; find more than six: 354+10, 344+20 ... 274+90 (9 answers; ones digit stays 4).
- p.113 Q14 (Challenge): add four or five digits in balloons: 3,7,4,8=22; 2,7,6,8=23; 4,5,9,2=20; 9,5,1,4,8=27.
- p.114 Q15 (Challenge): **only column layout in the unit.** Afua stacks three 3-digit numbers with + and a rule, then writes partial sums below, ones first, at full value: 154+151+243 gives 8, 140, 400, ruled total 548; 227+213+334 gives 14, 60, 700, total 774. Child explains her ordering (50+50=100; 7+3=10). No carry digits: expanded partial-sums column addition.

### 9.2 Subtraction: regrouping tens (p.115-119)
Key words: exchange, regroup, trial and improvement, unknown.
- p.115 Q1 (Focus): grid shows 158 (1 hundred, 5 tens, 8 ones). 158-73=85 (est. 160-70=90).
- p.116 Q2 (Focus): 178-53=125, 267-64=203 (no exchange), 154-72=82, 236-84=152 (exchange).
- p.116 Q3 (Focus): two equal sweet packets total 42: 21 each (trial and improvement).
- p.117 Q4 (Practice): sort 12 subtractions. None: 188-54=134, 345-213=132, 276-163=113, 257-125=132. Ones: 337-119=218, 143-28=115, 296-158=138, 172-127=45. Tens: 247-163=84, 269-182=87, 437-264=173, 736-283=453.
- p.117 Q5 (Practice): explain when tens regroup.
- p.117 Q6 (Practice): estimate and solve the four "tens" ones from Q4.
- p.118 Q7 (Practice): spot Danh's errors in 419-187 (partitioned rows 400+10+9 minus 100+80+7): rounded 419 to 410 and 187 to 180; did 80-10 as 70, got 372; ignored his check 372+187=559. Correct: 232.
- p.118 Q8 (Practice): 364 - newspaper = 83, so 281 sold.
- p.118 Q9 (Challenge): subtracting 90 always needs an exchange? Sometimes: not when the tens digit is 9 (195-90=105).
- p.119 Q10 (Challenge): 764 children, 392 girls; 764-392=372 boys (est. 760-390=370).
- p.119 Q11 (Challenge): two identical footballs cost $38, so $19 each.
- p.119 Q12 (Challenge): 354 km trip, 171 km left; 354-car=171, so 183 km.

### 9.3 Complements (p.120-125)
Key words: blank, complement.
- p.120-121 Q1 (Focus): read shaded blank 100 squares: a) 35+65=100; b) 87+13=100.
- p.121 Q2 (Focus): "six" complements of 1000 in hundreds: 100+900 ... 500+500 gives five, so six only if 0+1000 counts (book ambiguity).
- p.121 Q3 (Practice): 3x3 grid to complement grid: 19-81, 82-18, 93-7, 46-54, 78-22, 37-63, 3-97, 51-49, 64-36.
- p.122 Q4 (Practice): write those nine as sentences.
- p.122 Q5 (Practice): pairs, both with 5 tens, making 1000: 50+950, 150+850, 250+750, 350+650, 450+550.
- p.122 Q6 (Practice): 410+240=650, 720+180=900, 940-340=600, 530-270=260.
- p.122-123 Q7 (Challenge): word problems from 100: books 100-23=77; marbles 100-17=83; $100-$38=$62; 1 m string minus 43 cm = 57 cm; pencils 100-32=68.
- p.124 Q8 (Challenge): complements-of-100 cross-number: 17 clues (73, 25, 59 ... 83); answers e.g. A across 27, F down 89; grid checks out.
- p.124 Q9 (Challenge): digit cards 1-9, make two "__0 + __0 = 1000" sums, each digit once; tens pairs total 10, hundreds total 9, so unused digit is always 7 (e.g. 310+690, 420+580).
- p.125 Q10 (Challenge): 170+390=560, 420-280=140, 960-570=390, 430+490=920, 840-490=350, 750-670=80.
- p.125 Q11 (Challenge): digit-sum riddle: 790+100=890, 790+190=980, 880+100=980.

### Hidden prerequisites and traps
- Expanded column addition with partial sums (p.114 Q15) appears with no worked model; children must line up hundreds/tens/ones and add three numbers.
- Rounding to nearest 10 for every estimate; inverse check by adding back (p.118 Q7).
- Halving disguised as trial and improvement (p.116 Q3: 21; p.119 Q11: $19); weak area for this child.
- Money in dollars (p.119 Q11, p.123 Q7c); 1 m = 100 cm (p.123 Q7d); km distances (p.119 Q12).
- Complements of 1000 with tens bonding to 10 and hundreds to 9 (p.122 Q5, p.124 Q9).
- Single-digit complements 3/97, 93/7 (p.121 Q3).

### Activity refinements
- **tens-make-a-hundred**: Workbook p.109 Q1, p.110 Q2-Q3, p.111 Q4 and Q6-Q7, p.112 Q8-Q9, p.113 Q12-Q13, p.114 Q15. Add: sort round (none/ones/tens); "stack it" screen copying Afua's partial sums; three 3-digit addends; "? + tens = 364" puzzle. Tip: "ones first, write each part at full value."
- **best-order-adding**: Workbook p.111 Q5, p.112 Q11, p.113 Q14, p.114 Q15. Add: 4-5 digit balloons; "three digits make 18".
- **swap-a-hundred**: Workbook p.115 Q1, p.116 Q2, p.117 Q4-Q6, p.118 Q7 and Q9, p.119 Q10. Add: sort round; Danh's error hunt; "minus 90: exchange?" sorter; word problems.
- **mystery-number**: Workbook p.116 Q3, p.118 Q8, p.119 Q11-Q12. Tip: guess, double, compare (keeps halving as addition).
- **bonds-to-100**: Workbook p.120-121 Q1, p.121 Q3, p.122 Q4, p.122-123 Q7, p.124 Q8. Add: $, cm-in-1 m word problems; mini cross-number.
- **thousand-partners**: Workbook p.121 Q2, p.122 Q5-Q6, p.124 Q9, p.125 Q10-Q11. Add: digit-card puzzle; "5 tens" pairs.
- No new activity needed.

## Proposed activities

Ordered as taught (6 activities: 2 per section).

### 1. `tens-make-a-hundred`
- **title**: Tens Make a Hundred
- **icon**: ➕
- **section**: 9.1
- **summary**: Add 2- and 3-digit numbers on a place value mat, swapping 10 tens for a hundred.
- **book**: Textbook p.133 Getting started Q1, p.135 Q1-Q2, (p.136-137 Q3-Q4 not in scan), p.149 Check your progress Q1 · Workbook p.109 Q1, p.110 Q2-Q3, p.111 Q4 and Q6-Q7, p.112 Q8-Q9, p.113 Q12-Q13, p.114 Q15
- **Learn screens**
  1. 64 + 53 shown as tens sticks and ones cubes on a 100s/10s/1s mat. The child drags all the tens into one column and counts 11 tens.
  2. A "swap" button glows: the child drags 10 tens into the swap box and gets 1 hundred flat. The mat now shows 1 hundred, 1 ten, 7 ones = 117.
  3. Estimate first: each number rolls to its nearest 10 on a number line (60 + 50 = 110); the exact answer appears next to it and Bolt says "close to our estimate, good".
  4. Stack it (the workbook's written layout, p.114): three numbers in columns; the child adds the ones, then the tens, then the hundreds, writing each part at full value (8, 140, 400), then adds the parts (548). No carry digits.
- **Practice** (count 9)
  - Level 1: 2-digit + 2-digit, regroup the ones only or nothing (totals up to 99, e.g. 43 + 56, 67 + 29). Child builds on the mat and types the total.
  - Level 2: 2-digit + 2-digit that regroup the tens (totals 100-198, e.g. 64 + 53, 85 + 72), and 3-digit + 2-digit (e.g. 245 + 83).
  - Level 3: 3-digit + 3-digit with tens and/or ones regrouping, totals under 1000 (e.g. 519 + 348, 263 + 174, 475 + 353, 245 + 272); three 3-digit addends in the stacked layout (e.g. 154 + 151 + 243, 375 + 321 + 283). Estimate chosen from 3 options before calculating.
  - Extra item types from the workbook: sort a sum into 'no regrouping / regroup ones / regroup tens' before solving (p.111 Q6); missing-tens puzzle '? + some tens = 364' (p.113 Q13).
- **Mistake tags**: Wrote 11 tens in the tens place; Forgot the regrouped hundred; Forgot the regrouped ten; Estimate far from answer
- **Parent tips**
  - Goal: Add numbers up to 3 digits, regrouping ones and tens, and check with an estimate.
  - Say: "How many tens altogether? Is that more than 9?" / "Ten tens make one hundred - swap them." / "What did you estimate? Is your answer close?"
  - Watch for: writing "1117" for 64 + 53; skipping the estimate.
  - Also watch for: lining numbers up on the left instead of by place value when stacking three numbers.
  - Away from screen: Use 1p and 10p coins (or pasta and bundles of 10 straws) to add two prices, swapping ten 10p coins for a £1 coin.

### 2. `best-order-adding`
- **title**: Best Order Adding
- **icon**: 🔀
- **section**: 9.1
- **summary**: Spin single digits and drag them into a smart order (pairs to 10, doubles) before adding.
- **book**: Textbook p.138 Q5 and reflection, p.138-139 Q6-Q7 · Workbook p.111 Q5, p.112 Q11, p.113 Q14, p.114 Q15
- **Learn screens**
  1. A spinner numbered 1-9 lands on 7, 5, 3. Bolt adds them in order (7 + 5 = 12, 12 + 3 = 15), then the child drags 7 and 3 together to make 10, then adds 5. Same total: the order does not matter.
  2. Four numbers (6, 8, 4, 2): the child joins pairs that make 10 with a line, then adds the tens.
  3. Digit grid: a 3 by 3 grid; the child clicks a row to read 132, a column to read 354, and adds them on the mat from activity 1.
- **Practice** (count 8)
  - Level 1: three digits 1-9 (totals up to 27). Child drags two cards into a "make 10" or "double" box, then types the total.
  - Level 2: four or five digits 1-9 (totals up to 36, e.g. 9, 5, 1, 4, 8 = 27). Child groups them into friendly pairs before adding; puzzle: choose three different digits that make 18 and name the bond to 10 used.
  - Level 3: pick two or three 3-digit numbers from a 3 by 3 digit grid (rows and columns) and add them; then build one number in words from tiles.
- **Mistake tags**: Added in a slow order; Pair did not make 10; Used the same card twice; Lost a number when regrouping; Place value slip in words
- **Parent tips**
  - Goal: Know you can add numbers in any order and choose the order that makes adding easy.
  - Say: "Can you see two numbers that make 10?" / "Is there a double?" / "Does changing the order change the answer?"
  - Watch for: always adding left to right and counting on in ones; leaving a number out after moving cards around.
  - Away from screen: Roll three or four dice and race to add them; whoever spots a pair to 10 first says it out loud.

### 3. `swap-a-hundred`
- **title**: Swap a Hundred
- **icon**: 🔓
- **section**: 9.2
- **summary**: Subtract by exchanging 1 hundred for 10 tens when there are not enough tens.
- **book**: Textbook p.140 Q1, p.141 Q2-Q3, p.142 Q4, p.133 Getting started Q2-Q3, p.149 Check your progress Q1 · Workbook p.115 Q1, p.116 Q2, p.117 Q4-Q6, p.118 Q7 and Q9, p.119 Q10
- **Learn screens**
  1. 235 on the mat. The child breaks one hundred flat into 10 ten-sticks, and the label changes to 100 + 130 + 5. Then 452 and 309 (zero tens becomes 10 tens).
  2. 246 - 84: the child tries to take 8 tens from 4 tens and the mat shakes. Bolt suggests a swap; after exchanging, 14 tens - 8 tens = 6 tens; answer 162.
  3. Spot Bolt's mistake: Bolt writes 246 - 84 = 242 by taking 4 from 8 in the tens. The child clicks the wrong column and explains with the mat.
- **Practice** (count 10)
  - Level 1: rewrite a 3-digit number with one hundred exchanged (e.g. 452 = 300 + 150 + 2), then 3-digit minus 2-digit multiples of 10 (148 - 60).
  - Level 2: 3-digit minus 2-digit needing a hundred exchanged (246 - 84, 245 - 82, 326 - 71, 534 - 93).
  - Level 3: 3-digit minus 3-digit with one or two exchanges (339 - 163, 647 - 386, 518 - 248, 375 - 168, 736 - 283, 764 - 392); then check by adding the answer back.
  - Extra item types from the workbook: sort a subtraction into 'no exchange / exchange a ten / exchange a hundred' (p.117 Q4); error hunt where Bolt partitions 419 - 187 and gets 372 instead of 232, ignoring his own check (p.118 Q7); 'does taking 90 always need an exchange?' (only not when the tens digit is 9, p.118 Q9).
- **Mistake tags**: Took smaller digit from larger; Forgot to reduce the hundreds; Did not exchange when tens were short; Stuck on zero tens; Did not check with addition
- **Parent tips**
  - Goal: Subtract 2- and 3-digit numbers when you need to swap a hundred for ten tens.
  - Say: "Do you have enough tens to take away?" / "Swap one hundred for ten tens. How many tens now?" / "Check it: add your answer to the number you took away."
  - Watch for: 246 - 84 = 242 (subtracting the wrong way round in the tens); swapping but leaving the hundreds digit unchanged.
  - Away from screen: Use £1 coins and 10p coins: pay 84p from £2.46 and see that you need to change a £1 coin into ten 10p coins.

### 4. `mystery-number`
- **title**: Mystery Number
- **icon**: 🙂
- **section**: 9.2
- **summary**: Find a hidden number by making a sensible guess, checking it, and improving it.
- **book**: Textbook p.142 Worked example 2, p.143 Q5 and Think like a mathematician · Workbook p.116 Q3, p.118 Q8, p.119 Q11-Q12
- **Learn screens**
  1. A museum picture: 147 people, 63 adults, children hidden under a smiley face (147 - 🙂 = 63). Bolt's first guess is 47 (147 - 47 = 100: 37 too many left), so Bolt improves the guess by 37 to 84 (147 - 84 = 63). The child presses "check" each time and sees "too big / too small / just right".
  2. Marble bags: two equal bags make 34. The child adds marbles to both bags at once (15 + 15 = 30, 16 + 16 = 32, 17 + 17 = 34).
- **Practice** (count 8)
  - Level 1: missing number in additions/subtractions within 100 (e.g. 60 - 🙂 = 35, 🙂 + 🙂 = 24). Child uses a guess slider with too big/too small feedback.
  - Level 2: 3-digit missing number problems (243 - 🙂 = 151, 147 - 🙂 = 63, 364 - 🙂 = 83, 354 - 🙂 = 171, 🙂 + 🙂 = 34, 🙂 + 🙂 = 42, two equal prices = $38). Fewest guesses earns a star.
  - Level 3: missing digits (3△7 - 1□7 = 160): turn two digit dials to find at least two pairs, then choose whether the pairs are both odd, both even, or mixed.
- **Mistake tags**: Random guessing; Adjusted in the wrong direction; Equal bags not equal; Assumed the two digits are the same; Only found one pair
- **Parent tips**
  - Goal: Use trial and improvement: a sensible first guess, then small changes until it works.
  - Say: "Is your guess too big or too small?" / "How far out were you? Change it by about that much." / "Both bags must have the same number."
  - Watch for: guessing wildly without using the last result; for equal bags, trying different numbers in each bag. The workbook hides halving in 'two equal packets' and 'two identical footballs' questions (p.116 Q3, p.119 Q11): let him guess a number, double it by adding it to itself, and compare.
  - Away from screen: Hide some buttons in your hand from a pile of 30 he has counted. Show him how many are left and let him guess and check how many you hid.

### 5. `bonds-to-100`
- **title**: Bonds to 100
- **icon**: 💯
- **section**: 9.3
- **summary**: Shade a blank 100 square to find the number that makes 100.
- **book**: Textbook p.145 Q1 and reflection, p.149 Check your progress Q2 (complements of 100) · Workbook p.120-121 Q1, p.121 Q3, p.122 Q4, p.122-123 Q7, p.124 Q8
- **Learn screens**
  1. A blank 10 by 10 square. The child shades 35 squares (3 full rows and 5 more). Bolt counts the empty ones: first finish the row (5), then the full rows (60). 35 + 65 = 100.
  2. The rule appears as colour: the ones digits make 10 (5 + 5), the tens digits make 9 (3 + 6). The child tries it on 53.
  3. Fix the table: Bolt has written 19 -> 91. The child shades 19 and sees the real answer is 81.
- **Practice** (count 10)
  - Level 1: complements of multiples of 10 (30, 70, 40) and of numbers ending in 5 (35, 65), using the shaded square.
  - Level 2: any 2-digit number (53, 77, 81, 19, 54) - the square appears only after a wrong answer.
  - Level 3: single-digit and "near 100" numbers (8, 3, 93, 96, 99), spot-the-mistake tables (choose which of 3 complements are wrong and fix them), and everyday 'from 100' stories: $100 minus $38, 1 m (100 cm) of string minus 43 cm, 100 marbles minus 17 (workbook p.122-123 Q7).
- **Mistake tags**: Made both digits add to 10; Reversed the digits; Forgot the 0 tens in a single-digit number; Counted on in ones
- **Parent tips**
  - Goal: Find the number that adds to make 100 quickly using bonds to 10.
  - Say: "What makes the ones up to 10?" / "Now the tens only need to make 9, because one ten is already made." / "Check: does it fill the whole square?"
  - Watch for: 35 + 75 or 19 + 91 (making both digits 10); 8 + 2 = 100.
  - Away from screen: Play "100 snap": you call a number, he calls its partner to 100. Swap roles. Use a tape measure (100 cm) to check.

### 6. `thousand-partners`
- **title**: Thousand Partners
- **icon**: 🧮
- **section**: 9.3
- **summary**: Find partners to 1000 and other multiples of 10, and add or subtract multiples of 10 in your head.
- **book**: Textbook p.146 Q2, p.147 Q3-Q4, p.148 Q5 and Think like a mathematician, p.149 Check your progress Q2-Q3 · Workbook p.121 Q2, p.122 Q5-Q6, p.124 Q9, p.125 Q10-Q11
- **Learn screens**
  1. Ten-times machine: 35 ones and 65 ones go in and come out as 35 tens and 65 tens. 350 + 650 = 1000. The child drags the "times ten" lever for 53 + 47.
  2. Complement ladder: rows 500 + 500, 510 + 490 ... The child fills two more rows and notices one side goes up by 10 while the other goes down by 10.
  3. Mental jump line: 670 - 380. The child jumps from 380 to 400 (20), then to 670 (270): answer 290.
- **Practice** (count 10)
  - Level 1: complements of 1000 for multiples of 100 and 50 (400, 750, 150 + 850, 350 + 650) and the next ladder rows (520 + ?, 530 + ?).
  - Level 2: complements of 1000 for any multiple of 10 (880, 470, 240, 510), and to other multiples of 10 (340 + ? = 570, 750 + ? = 900).
  - Level 3: mental add/subtract of 3-digit multiples of 10 crossing a hundred (560 + 290, 980 - 260, 760 - 490, 820 - ? = 470); bonus: how many pairs of 3-digit multiples of 10 make 540 (order counts / does not count); digit-card puzzle: use cards 1-9 once each to make two '__0 + __0 = 1000' sums (the tens digits make 10, the hundreds make 9, so 7 is always left over - workbook p.124 Q9).
- **Mistake tags**: Hundreds added to 10; Added a zero to only one number; Forgot to cross the hundred; Subtracted digits without regrouping; Counted on in tens one by one
- **Parent tips**
  - Goal: Use bonds to 100 to find partners to 1000 and calculate with multiples of 10 mentally.
  - Say: "Pretend the 0 is not there: 35 and what make 100? Now put the 0 back." / "Jump to the next hundred first." / "Is your answer sensible? Estimate it."
  - Watch for: 440 + 660 = 1000; 560 + 290 = 750 (losing the extra hundred).
  - Away from screen: With a pretend £10 (1000p), "buy" items priced in 10p steps and work out the change in your head.

/* Grade 3 Maths — curriculum map.
 * Follows the order of Cambridge Primary Mathematics Stage 3 (Learner's Book 3 and
 * Workbook 3, 2nd edition). Page references point to the printed page numbers so a
 * parent can line activities up with the books. All activity content is original.
 */
(function () {
  'use strict';
  var MQ = window.MQ;

  MQ.curriculum = {
    units: [
      {
        id: 'u6',
        number: 6,
        title: 'Measurement, area and perimeter',
        status: 'open',
        sections: [
          {
            id: '6.1',
            title: 'Measurement',
            color: '#ff9f1c',
            book: 'Textbook p.89–101 · Workbook p.74–82',
            activities: ['ruler-lab', 'which-unit', 'unit-converter', 'rounding-rover', 'estimate-measure'],
          },
          {
            id: '6.2',
            title: '2D shapes and perimeter',
            color: '#2ec4b6',
            book: 'Textbook p.101–108 · Workbook p.82–90',
            activities: ['robot-patrol', 'regular-irregular', 'perimeter-puzzles'],
          },
          {
            id: '6.3',
            title: 'Introducing area',
            color: '#c77dff',
            book: 'Textbook p.109–116 · Workbook p.90–96',
            activities: ['square-counter', 'fence-or-grass', 'rectangle-builder', 'mission-challenge'],
          },
        ],
      },
    ],

    /** The rest of the book, shown on the home page as "coming soon". */
    upcoming: [
      { number: 1, title: 'Numbers to 1000' },
      { number: 2, title: 'Tally charts and frequency tables' },
      { number: 3, title: 'Addition, subtraction and money' },
      { number: 4, title: '3D shapes' },
      { number: 5, title: 'Multiplication and division' },
      { number: 7, title: 'Fractions of shapes' },
      { number: 8, title: 'Time' },
      { number: 9, title: 'More addition and subtraction' },
      { number: 10, title: 'Graphs' },
      { number: 11, title: 'More multiplication and division' },
      { number: 12, title: 'More fractions' },
      { number: 13, title: 'Measure: mass, capacity, temperature' },
      { number: 14, title: 'Time (2) and timetables' },
      { number: 15, title: 'Angles and movement' },
      { number: 16, title: 'Chance' },
      { number: 17, title: 'Pattern and symmetry' },
    ],

    activities: {
      /* ---------------- 6.1 Measurement ---------------- */
      'ruler-lab': {
        title: 'Ruler Lab',
        icon: '📏',
        summary: 'Measure things with a ruler, even a broken one that does not start at 0.',
        book: 'Textbook p.97 Q6 · Workbook p.76 Q4, p.77 Q6, p.79 Q9',
        tips: {
          goal: 'Measure lengths in centimetres, starting from 0, and work out lengths on a ruler that starts at another number.',
          say: [
            'Where does the object start? Put that end on the 0.',
            'This ruler is broken. Count the jumps from where it starts to where it ends.',
            'Is the end nearer this number or the next one?',
          ],
          watch: [
            'Reading the number at the end without checking the start (on the workbook rulers that start at 71, 12 and 19).',
            'Lining the object up with the edge of the ruler instead of the 0 line.',
            'Counting the tick marks instead of the gaps between them.',
          ],
          offline: 'Give him a real ruler and five small things (pencil, eraser, spoon). Measure each to the nearest cm. Then cover the start of the ruler with your thumb and measure from 3.',
        },
      },
      'which-unit': {
        title: 'Which Unit?',
        icon: '📐',
        summary: 'Sort things into centimetres, metres or kilometres.',
        book: 'Textbook p.93–94 Q3, p.98 Q9 · Workbook p.74 Q1, p.77 Q5',
        tips: {
          goal: 'Choose a sensible unit: cm for small things, m for rooms, people and vehicles, km for journeys.',
          say: [
            'Would it fit on your hand? Then centimetres.',
            'Could you walk past it in a few steps? Probably metres.',
            'Would you need a car or a long walk? Kilometres.',
          ],
          watch: [
            'Choosing km for big-but-not-far things like a football pitch or a train (those are metres).',
            'Thinking "big number = big unit". A 200 cm door and a 2 m door are the same.',
          ],
          offline: 'On a walk, take turns naming something and the unit you would use to measure it.',
        },
      },
      'unit-converter': {
        title: 'Unit Converter',
        icon: '🔁',
        summary: 'Build a metre from 100 centimetres and a kilometre from 1000 metres.',
        book: 'Textbook p.98 Q8 · Workbook p.75 Q3, p.76 Q3, p.78 Q8, p.82 Q12',
        tips: {
          goal: 'Know 1 m = 100 cm and 1 km = 1000 m, including halves and quarters (½ m = 50 cm, ¾ km = 750 m).',
          say: [
            'How many centimetres make one metre?',
            '3 metres is 100 + 100 + 100 centimetres.',
            'A quarter of 100 is 25, so three quarters is 25 + 25 + 25.',
          ],
          watch: [
            'Using 10 instead of 100 (7 m = 70 cm).',
            'Mixing up the two facts (1 km = 100 m).',
            '250 cm written as 25 m instead of 2½ m.',
          ],
          offline: 'Use a tape measure: find 1 m, ½ m (50 cm) and ¼ m (25 cm) on it. Pace out 10 m in a park and imagine 100 of those for a kilometre.',
        },
      },
      'rounding-rover': {
        title: 'Rounding Measurements',
        icon: '🔢',
        summary: 'Round lengths to the nearest 10 cm, 100 cm or whole metre.',
        book: 'Textbook p.99 Q10, p.113 Q1 · Workbook p.77 Q6, p.79 Q9',
        tips: {
          goal: 'Round measurements to the nearest whole cm, 10 cm, 100 cm (= nearest metre) and 10 km.',
          say: [
            'Which two tens is it between?',
            'Is it nearer this one or that one?',
            'Exactly halfway? Then we round up.',
          ],
          watch: [
            'Halfway numbers like 275 → 280 (round up).',
            'Not seeing that "nearest 100 cm" and "nearest metre" are the same thing.',
          ],
          offline: 'Measure his height and round it to the nearest 10 cm. Ask: how far is it to school, to the nearest kilometre?',
        },
      },
      'estimate-measure': {
        title: 'Estimate and Measure',
        icon: '🎯',
        summary: 'Guess first, then measure. How close can you get?',
        book: 'Textbook p.89, p.91–92 · Workbook p.75 Q2, p.78 Q7, p.80–81 Q10–11',
        tips: {
          goal: 'Make sensible estimates using benchmarks (a finger is about 1 cm wide, a long step is about 1 m).',
          say: [
            'An estimate is a clever guess. It does not have to be exact.',
            'How many finger-widths long is it?',
            'Was your guess too big or too small? Use that next time.',
          ],
          watch: [
            'Wild guesses because he has no feel for 1 cm, 10 cm or 1 m. Use the benchmarks.',
            'Rubbing out the estimate to match the measurement. Being close is the goal.',
          ],
          offline: 'Workbook p.80–81: find four things he thinks are 20 cm long, then measure them. Then four things between 1 m and 2 m.',
        },
      },

      /* ---------------- 6.2 2D shapes and perimeter ---------------- */
      'robot-patrol': {
        title: 'Walk the Edge',
        icon: '🚶',
        summary: 'Walk all the way round a shape and add the sides to find the perimeter.',
        book: 'Textbook p.102, p.106 Q6 · Workbook p.83 Q2, p.84 Q3, p.89 Q9–10',
        tips: {
          goal: 'Perimeter is the distance all the way round a shape: add every side.',
          say: [
            'Put your finger on a corner and walk all the way round.',
            'How many sides does it have? Did we add them all?',
            'This side has no number. Which side is the same length?',
          ],
          watch: [
            'Adding only the labelled sides of a rectangle (4 + 3 = 7 instead of 14).',
            'Counting the squares inside (area) instead of the edges.',
            'Forgetting the unit (cm, m or km).',
          ],
          offline: 'Walk round the edge of a rug or table counting your hand spans. That is its perimeter in spans.',
        },
      },
      'regular-irregular': {
        title: 'Shape Sorter',
        icon: '🔷',
        summary: 'Regular or irregular? Check the sides and the corners.',
        book: 'Textbook p.101, p.104 Q4 · Workbook p.82–83 Q1, p.86 Q5, p.89 Q8',
        tips: {
          goal: 'A regular shape has ALL sides the same length AND ALL angles the same. Otherwise it is irregular.',
          say: [
            'Are all the sides the same length?',
            'Are all the corners the same?',
            'Turn your head. Is it still a square?',
          ],
          watch: [
            'Calling a rectangle regular. Its corners match but its sides do not.',
            'Thinking a tilted square is not a square.',
            'Calling a rhombus regular because its sides are equal. Its corners are not.',
          ],
          offline: 'Workbook p.84 Q4: hunt for a square, rectangle, triangle, pentagon and hexagon at home and say if each is regular.',
        },
      },
      'perimeter-puzzles': {
        title: 'Perimeter Puzzles',
        icon: '🧩',
        summary: 'Square patterns, missing sides and shapes with a secret perimeter.',
        book: 'Textbook p.104–108 · Workbook p.83 Q2b, p.87 Q6, p.90 Q10',
        tips: {
          goal: 'Use the perimeter of squares (4 equal sides) both ways, and see the pattern go up in 4s.',
          say: [
            'A square has 4 sides the same. So the perimeter is side + side + side + side.',
            'The perimeter is 16. Share 16 between 4 sides.',
            'The side got 1 cm longer. How much longer is the whole walk round?',
          ],
          watch: [
            'Adding 3 sides instead of 4.',
            'Not linking 4, 8, 12, 16, 20 to the 4 times table. Say it out loud together.',
            'Doubling the side: the perimeter doubles too.',
          ],
          offline: 'Make squares from toothpicks or matchsticks: 1 stick per side, then 2, then 3. Count the sticks each time (4, 8, 12...).',
        },
      },

      /* ---------------- 6.3 Introducing area ---------------- */
      'square-counter': {
        title: 'Square Counter',
        icon: '🟪',
        summary: 'Area is how many squares a shape covers. Two halves make a whole!',
        book: 'Textbook p.109–111 · Workbook p.90 Q1–2, p.92 Q4, p.95 Q8',
        tips: {
          goal: 'Find area by counting the squares inside a shape, and write it in square units.',
          say: [
            'Tap each square as you count so you do not count it twice.',
            'Two half-squares fit together to make one whole square.',
            'Area is the space inside. Write "square units".',
          ],
          watch: [
            'Counting a half-square as a whole one, or skipping it.',
            'Counting squares in the background grid instead of only inside the shape.',
            'Counting corners or lines instead of squares.',
          ],
          offline: 'Cover a book with sticky notes or square coasters and count them. That is its area in sticky notes!',
        },
      },
      'fence-or-grass': {
        title: 'Fence or Floor?',
        icon: '🏡',
        summary: 'Perimeter is the fence round the edge. Area is the floor inside.',
        book: 'Textbook p.110 · Workbook p.91 Q3, p.93 Q5–6, p.94 Q6c',
        tips: {
          goal: 'Tell area and perimeter apart: perimeter is a length round the edge, area is squares inside.',
          say: [
            'Is the question asking about the fence or the floor?',
            'Perimeter: walk round the edge. Area: count the tiles inside.',
            'Shapes can look different but cover the same number of squares.',
          ],
          watch: [
            'The classic mix-up: a 3 × 3 square has area 9 but perimeter 12.',
            'A 4 × 4 square has area 16 AND perimeter 16. Same number, different meaning.',
            'Thinking same area means same perimeter.',
          ],
          offline: 'Draw a rectangle on squared paper. He colours the inside (area) in one colour and traces the edge (perimeter) in another.',
        },
      },
      'rectangle-builder': {
        title: 'Rectangle Builder',
        icon: '🧱',
        summary: 'Rows of squares are multiplication! Build rectangles and squares.',
        book: 'Textbook p.96 Q5, p.111 Q3 · Workbook p.95 Q8a, p.96 Q9',
        tips: {
          goal: 'See a rectangle of squares as rows × columns. This is the bridge to times tables (3 rows of 4 = 3 × 4 = 12).',
          say: [
            'How many in one row? How many rows? So it is ... times ...',
            'Count in jumps: 4, 8, 12.',
            'Turn it round. Is it still 12? Yes: 3 × 4 = 4 × 3.',
          ],
          watch: [
            'Counting every square one by one. Encourage counting in rows.',
            'For "a square has area 25", dividing by 4 (perimeter thinking) instead of finding 5 × 5.',
            'Only finding one rectangle when several are possible (1 × 12, 2 × 6, 3 × 4).',
          ],
          offline: 'Build rectangles from Lego bricks or coins: how many different rectangles can you make with 12?',
        },
      },
      'mission-challenge': {
        title: 'Unit 6 Challenge',
        icon: '🏆',
        summary: 'Design gardens with the same fence, then a mixed quiz on the whole unit.',
        book: 'Textbook p.112, p.114 Q4, p.115–116 Project 3 · Workbook p.94 Q7',
        tips: {
          goal: 'Same perimeter can give different areas (and the other way round), plus a review of all of Unit 6.',
          say: [
            'All these gardens have the same fence. Which one has the most room inside?',
            'What do you notice about the long thin ones?',
            'Which part of this unit was easiest? Which was tricky?',
          ],
          watch: [
            'Expecting rectangles with the same perimeter to have the same area.',
            'Not counting the square (6 × 6) as a rectangle.',
          ],
          offline: 'Use 24 toothpicks to make different rectangles. Which one has the most squares inside?',
        },
      },
    },
  };
})();

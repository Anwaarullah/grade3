/* Unit 3: Addition, subtraction and money — sections, activity list and parent tips.
 * Page references are printed page numbers in Learner's Book 3 (Textbook) and Workbook 3.
 */
(function () {
  'use strict';
  window.MQ.addUnit(
    {
      id: 'u3',
      number: 3,
      title: 'Addition, subtraction and money',
      sections: [
        {
          id: '3.1',
          title: 'Addition',
          color: '#ff9f1c',
          book: 'Textbook p.36–41 · Workbook p.35–39',
          activities: ['add-with-regrouping'],
        },
        {
          id: '3.2',
          title: 'Subtraction',
          color: '#2ec4b6',
          book: 'Textbook p.42–45 · Workbook p.40–44',
          activities: ['subtract-with-regrouping', 'ink-blot-sums'],
        },
        {
          id: '3.3',
          title: 'Money',
          color: '#c77dff',
          book: 'Textbook p.46–53 · Workbook p.45–50',
          activities: ['dollars-and-cents', 'shop-and-change'],
        },
        {
          id: 'P1',
          title: 'Project: Surprising sums',
          color: '#4d96ff',
          book: 'Textbook p.54–55',
          activities: ['digit-sum-detective'],
        },
      ],
    },
    {
      /* ---------------- 3.1 Addition ---------------- */
      'add-with-regrouping': {
        title: 'Adding with swaps',
        icon: '➕',
        summary: 'Add to a 3-digit number. Got 10 ones or more? Swap them for a ten!',
        book: 'Textbook p.36 Q1, p.38 Q1, p.39 Q2–3, p.40 Q4–6, p.52 Check your progress Q1 · Workbook p.35–38 Q1–10, p.39 Q11',
        tips: {
          goal: 'Add a 1-, 2- or 3-digit number to a 3-digit number when the ones make 10 or more, and check the answer against an estimate.',
          say: [
            'Do we have 10 ones or more? Then swap 10 ones for a ten.',
            'Round both numbers to the nearest 10. Roughly what will the answer be?',
            'Read the question again. What exactly does it ask you to add?',
          ],
          watch: [
            'Answering a different question from the one asked: in his book he added two 3-digit numbers when the question said add a single digit.',
            'Writing two digits in the ones place (148 + 136 = 2714) or forgetting the swapped ten (274).',
            'Small slips with tens, like 40 + 43 = 85. He is good at column addition already, so praise that and ask him to check against the estimate.',
          ],
          offline: 'Add two prices from a shop receipt or two page numbers in a book. Estimate first (round to the nearest 10), then work it out on paper and compare.',
        },
      },

      /* ---------------- 3.2 Subtraction ---------------- */
      'subtract-with-regrouping': {
        title: 'Take away with swaps',
        icon: '➖',
        summary: 'Not enough ones to take away? Open a ten into 10 ones!',
        book: 'Textbook p.36 Q2, p.42 Q1, p.43 Q2–4, p.44 Q5–6, p.52 Check your progress Q2 · Workbook p.40–43 Q1–10, p.44 Q11',
        tips: {
          goal: 'Subtract a 1-, 2- or 3-digit number from a 3-digit number, swapping a ten for 10 ones when there are not enough ones.',
          say: [
            'Have we got enough ones to take away?',
            'Open a ten. How many ones do we have now? How many tens are left?',
            'Does the question say add or take away? Which words tell you?',
          ],
          watch: [
            'Taking the small digit from the big one: 262 − 37 = 235 (because 7 − 2 = 5).',
            'Opening a ten but not making the tens digit one smaller.',
            'Adding when the question asks for subtraction: he did this on the first page of the unit in his book.',
          ],
          offline: 'Use 10c and 1c coins (or straws bundled in tens). Make 52, then take away 7: open a bundle when you run out of ones.',
        },
      },
      'ink-blot-sums': {
        title: 'Ink blot puzzles',
        icon: '🖋️',
        summary: 'Ink has hidden some digits in adding and take-away sums. Find every answer!',
        book: 'Textbook p.41 Think like a mathematician, p.45 Think like a mathematician · Workbook p.39 Q12, p.44 Q12',
        tips: {
          goal: 'Reason about missing digits in additions and subtractions, and look for every possible answer, not just one.',
          say: [
            'What do the parts we can see add up to?',
            'So what must the hidden digits make together?',
            'Have we found them all? How do you know there are no more?',
          ],
          watch: [
            'Guessing digits at random instead of working out what the hidden ones must make (11 in 24? + 13? = 381, not 1).',
            'Stopping after one answer.',
            'In a subtraction, putting the bigger hidden digit on top: in 49? − 14? = 345 the bottom digit is the bigger one.',
          ],
          offline: 'Write an addition, cover two ones digits with sticky notes and give him the total. Then swap: he makes one for you.',
        },
      },

      /* ---------------- 3.3 Money ---------------- */
      'dollars-and-cents': {
        title: 'Dollars and cents',
        icon: '💵',
        summary: 'Count notes and coins, and write money with a decimal point.',
        book: 'Textbook p.37 Q3, p.46 Worked example, p.47 Q1–3, p.48 Q3, p.49 Think like a mathematician · Workbook p.45–46 Q1–2, p.47 Q5, p.49 Q8',
        tips: {
          goal: 'Read, write and total money amounts using a decimal point: dollars before the point, cents after it.',
          say: [
            'Which part is dollars and which part is cents?',
            'Cents always take two places after the point: 5 cents is .05.',
            'Start with the biggest coin and count on.',
          ],
          watch: [
            '$2.09 read as 2 dollars 90 cents, or $24 and 5c written as $24.5.',
            'Counting coins instead of their value (three 25c coins counted as 3c).',
            'Listing coin and note values instead of choosing some that make the price: he did this in his book.',
          ],
          offline: 'Tip out a purse. Make the price of something from a shop leaflet with real coins and notes, then write it with a point.',
        },
      },
      'shop-and-change': {
        title: 'School shop',
        icon: '🛒',
        summary: 'Add up prices, find the change, and work out a missing price.',
        book: 'Textbook p.49 Q4, p.50 Q5–6, p.51 Q7–8, p.52 Q9, p.53 Check your progress Q3 · Workbook p.46 Q3, p.47 Q4, p.48 Q6, p.49 Q7, p.50 Q9–10',
        tips: {
          goal: 'Add prices, find change by counting up, and work backwards to find a missing price.',
          say: [
            'How much did you spend altogether?',
            'Count up from the price to the money you gave.',
            'You paid $50 and got $17 back. So what did it cost?',
          ],
          watch: [
            'Finding the total but forgetting the change, or subtracting the wrong way round.',
            'Adding $50 + $17 for a missing price. (In "how much did he have before?" you DO add: spent + change.)',
            'Halving: "two cost $8, so one costs?" is sharing, which is new for him. Use real coins in two piles; for $7, change the last $1 into 100c.',
          ],
          offline: 'Play shop with real coins and a few priced things from the kitchen. Take turns being the shopkeeper who gives the change.',
        },
      },

      /* ---------------- Project 1 ---------------- */
      'digit-sum-detective': {
        title: 'Digit sum detective',
        icon: '🔢',
        summary: 'Squeeze numbers down to one digit and test a surprising pattern.',
        book: 'Textbook p.54–55 Project 1',
        tips: {
          goal: 'Find the digit sum of a number (keep adding the digits until one digit is left) and test a pattern with his own examples.',
          say: [
            'Is it one digit yet? If not, keep going.',
            'What do you think the total\'s digit sum will be?',
            'Does it work every time? Let\'s try a big one.',
          ],
          watch: [
            'Stopping at a 2-digit answer (13 for 76 instead of 4).',
            'Adding the numbers instead of their digits.',
            'A small adding slip that makes the pattern look broken: check the sum again.',
          ],
          offline: 'Take car number plates or prices and race to find their digit sums. Then add two of them and test the pattern.',
        },
      },
    }
  );
})();

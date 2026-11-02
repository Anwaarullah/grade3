/* Unit 5: Multiplication and division — sections, activity list and parent tips.
 * Page references are printed page numbers in Learner's Book 3 (Textbook) and Workbook 3.
 */
(function () {
  'use strict';
  window.MQ.addUnit(
    {
      id: 'u5',
      number: 5,
      title: 'Multiplication and division',
      sections: [
        {
          id: '5.1',
          title: 'Exploring multiplication and division',
          color: '#ff9f1c',
          book: 'Textbook p.71–77 · Workbook p.60–64',
          activities: ['equal-groups-maker', 'array-fact-family', 'multiples-hunter', 'times-ten-machine'],
        },
        {
          id: '5.2',
          title: 'Connecting 2×, 4× and 8×',
          color: '#2ec4b6',
          book: 'Textbook p.77–81 · Workbook p.65–69',
          activities: ['double-it-tables'],
        },
        {
          id: '5.3',
          title: 'Connecting 3×, 6× and 9×',
          color: '#c77dff',
          book: 'Textbook p.82–88 · Workbook p.69–73',
          activities: ['split-and-add-tables', 'jump-along-sequences'],
        },
      ],
    },
    {
      /* ---------------- 5.1 Exploring multiplication and division ---------------- */
      'equal-groups-maker': {
        title: 'Equal Groups',
        icon: '🍎',
        summary: 'Put the same number in every group, count in jumps, and write it as ×.',
        book: 'Textbook p.71 Getting started Q1–2, p.72, p.76 Q8 · Workbook p.65 Q1 and Q4, p.68 Q13–14, p.69 Q15, p.71 Q7',
        tips: {
          goal: 'Understand that multiplying means adding equal groups: group size × number of groups (4 plates of 3 apples is 3 × 4 = 12).',
          say: [
            'How many in each group? How many groups?',
            'Count in threes with me: 3, 6, 9, 12.',
            'Is every group the same? Then we can multiply.',
          ],
          watch: [
            'Counting every single object one by one instead of counting in groups.',
            'Muddling which number is the group size and which is the number of groups.',
            'Making groups that are not all the same size, then still multiplying.',
          ],
          offline: 'Set the table: 4 plates with 2 biscuits on each. Ask "how many biscuits?" and say it as "4 groups of 2 is 8". Then share 12 grapes, 3 on each plate: how many plates?',
        },
      },
      'array-fact-family': {
        title: 'Array Fact Family',
        icon: '🥚',
        summary: 'Build an array, turn it round, and find all its × and ÷ facts.',
        book: 'Textbook p.71 Getting started Q2, p.75 Q4–5, p.87 Check your progress Q1 · Workbook p.61 Q3, p.63–64 Q7 and Q10',
        tips: {
          goal: 'See that one array gives two multiplication facts and two division facts: 3 rows of 5 gives 3 × 5, 5 × 3, 15 ÷ 3 and 15 ÷ 5.',
          say: [
            'How many rows? How many in each row?',
            'Turn it round. Has the number of counters changed?',
            'Which number is the biggest? That is the one we divide.',
          ],
          watch: [
            'Writing the division backwards (5 ÷ 30) or with the total as the answer (30 = 10 ÷ 3).',
            'Thinking 3 × 5 and 5 × 3 are different amounts.',
            'Counting every counter one by one instead of row by row.',
          ],
          offline: 'Lay out coins or buttons in 3 rows of 4 on a tray. Turn the tray round and say the four facts together: 3 × 4, 4 × 3, 12 ÷ 3, 12 ÷ 4.',
        },
      },
      'multiples-hunter': {
        title: 'Multiples Hunter',
        icon: '🔍',
        summary: 'Spot multiples of 2, 5 and 10 by the last digit, and sort them in circles.',
        book: 'Textbook p.73 Q1–2, p.74 Q3, p.79 Q5, p.83 Q4, p.88 Check your progress Q2 · Workbook p.60 Q1, p.61 Q2, p.62 Q6, p.63 Q9, p.65 Q3, p.67 Q6 and Q9',
        tips: {
          goal: 'Recognise multiples of 2, 5 and 10 from the last digit, and use the words multiple, odd and even.',
          say: [
            'Cover up all but the last digit. What does it tell you?',
            'Can it go in both circles?',
            'Is it odd or even? How do you know?',
          ],
          watch: [
            'Looking at the first digit instead of the last (thinking 532 is odd because 5 is odd).',
            'Thinking numbers ending in 5 are multiples of 10.',
            'Missing a multiple when crossing 100 (96, then 104).',
            'The workbook uses > and < and "the 7th multiple" without teaching them: read them aloud as "more than", "less than" and "4 × 7".',
          ],
          offline: 'On a walk, spot house numbers or car number plates and decide: is it a multiple of 2? of 5? of 10?',
        },
      },
      'times-ten-machine': {
        title: 'Times-10 Machine',
        icon: '🔟',
        summary: 'Watch each digit slide one place to the left when you multiply by 10.',
        book: 'Textbook p.76 Q6–8, p.88 Check your progress Q3 · Workbook p.62 Q4, p.63 Q8, p.64 Q11–12',
        tips: {
          goal: 'Multiply 1-digit and 2-digit numbers by 10 by moving every digit one place to the left (23 × 10 = 230).',
          say: [
            'Every one becomes a ten. Every ten becomes a hundred.',
            'Which column does the 2 move to?',
            'What goes in the empty ones place?',
          ],
          watch: [
            'Adding 10 instead of multiplying (23 × 10 = 33).',
            'Putting the 0 in the wrong place, or adding two zeros.',
            'Thinking 0 × 10 is 10. Ten empty boxes still hold nothing (the workbook tests this; the textbook never multiplies by zero).',
          ],
          offline: 'Count 10p coins (or 10-cent coins) in piles: 6 coins is 60. Then try 12 coins: 120.',
        },
      },

      /* ---------------- 5.2 Connecting 2×, 4× and 8× ---------------- */
      'double-it-tables': {
        title: 'Double It! 2s, 4s, 8s',
        icon: '🕷️',
        summary: 'Double the 2s to get the 4s, double again for the 8s.',
        book: 'Textbook p.78 Q1–2 and Worked example, p.79 Q3–4, p.80 Q6, p.83 Q3 · Workbook p.65 Q1–2, p.67 Q10, p.68 Q12, p.70 Q3',
        tips: {
          goal: 'Use the 2 times table to work out the 4 and 8 times tables by doubling (and the 6s from the 3s). Halving goes back the other way.',
          say: [
            'Only the group size doubles. The number of groups stays the same.',
            'What is double 18? Do 10 + 10 and 8 + 8.',
            'If 4 × 9 is 36, what is half of it?',
          ],
          watch: [
            'Doubling both numbers (2 × 6 = 12, so 4 × 12 = 48).',
            'Doubling the group size but forgetting to double the answer.',
            'Getting the double of a 2-digit number wrong (double 36 = 72). Practise doubles out loud.',
          ],
          offline: 'Count chair legs round the table (4 each). Then pretend each chair is a spider with 8 legs: how many legs now?',
        },
      },

      /* ---------------- 5.3 Connecting 3×, 6× and 9× ---------------- */
      'split-and-add-tables': {
        title: 'Split and Add',
        icon: '✂️',
        summary: 'Make tricky 6× and 9× facts from two easy parts added together.',
        book: 'Textbook p.82 Q1–2, p.84 Q5–6, p.85 Q8, p.86 Q9, p.88 Check your progress Q3 · Workbook p.69 Q1, p.70 Q2 and Q4, p.71 Q6 and Q8, p.72 Q9, p.73 Q12',
        tips: {
          goal: 'Build the 3, 6 and 9 times tables by doubling and adding, and split a hard fact into two easy parts (9 × 3 = 5 × 3 + 4 × 3).',
          say: [
            'Can you split it into a 5 part and a smaller part?',
            'Six lots plus three lots makes nine lots.',
            'You know 6 × 9 = 54. What else do you know now?',
          ],
          watch: [
            'Doubling the 6s to try to get the 9s (that gives the 12s).',
            'Splitting but forgetting to add the two parts.',
            'Adding the bricks in a multiplication wall instead of multiplying them.',
            'With the "10 lots take away 1 lot" trick, taking away just 1 instead of one for every group (9 × 4 = 40 − 4).',
          ],
          offline: 'Play dominoes: for each domino, say its total, then how many spots there would be on three of them.',
        },
      },
      'jump-along-sequences': {
        title: 'Jump Along',
        icon: '🐸',
        summary: 'Jump along a number line by the rule. Find the next numbers or the rule.',
        book: 'Textbook p.71 Getting started Q3, p.77 Q9, p.80 Q7, p.81 Q8–9, p.84 Q7, p.88 Check your progress Q4 · Workbook p.66 Q5, p.68 Q11, p.70 Q5, p.73 Q11',
        tips: {
          goal: 'Count on (and back) in 2s, 3s, 4s, 5s, 6s, 8s, 9s and 10s from any number, and find the rule of a sequence.',
          say: [
            'The first number is where the frog sits. Now jump.',
            'How far is it from this number to the next?',
            'Will the next number be odd or even? Why?',
          ],
          watch: [
            'Counting the start number as the first jump.',
            'Slipping when crossing a ten or a hundred (17 + 4, or 194 + 10).',
            'Thinking there is only one right answer in an open puzzle.',
          ],
          offline: 'Hop along stairs or paving slabs counting in 3s or 4s, starting from a number other than 0 (5, 9, 13, 17...).',
        },
      },
    }
  );
})();

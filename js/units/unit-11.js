/* Unit 11: More multiplication and division — sections, activity list and parent tips.
 * Page references are printed page numbers in Learner's Book 3 (Textbook) and Workbook 3.
 */
(function () {
  'use strict';
  window.MQ.addUnit(
    {
      id: 'u11',
      number: 11,
      title: 'More multiplication and division',
      sections: [
        {
          id: '11.1',
          title: 'Revisiting multiplication and division',
          color: '#ff9f1c',
          book: 'Textbook p.168–172 · Workbook p.152–155',
          activities: ['times-square-explorer', 'sequence-hops'],
        },
        {
          id: '11.2',
          title: 'Playing with multiplication and division',
          color: '#2ec4b6',
          book: 'Textbook p.173–176 · Workbook p.155–159',
          activities: ['split-and-multiply', 'share-and-leftovers'],
        },
        {
          id: '11.3',
          title: 'Extending multiplication and division',
          color: '#c77dff',
          book: 'Textbook p.176–182 · Workbook p.159–164',
          activities: ['grid-method-builder', 'chunk-and-divide', 'remainder-decisions'],
        },
      ],
    },
    {
      /* ---------------- 11.1 Revisiting multiplication and division ---------------- */
      'times-square-explorer': {
        title: 'Times Square Explorer',
        icon: '🔢',
        summary: 'Find any times fact in the big square, and see it as rows of dots.',
        book: 'Textbook p.168 Getting started, p.170–171 Q1–4 · Workbook p.152 Q1–2, p.153–154 Q4–9',
        tips: {
          goal: 'Find and read multiplication and division facts in a multiplication square, and see that 3 × 8 and 8 × 3 are the same.',
          say: [
            'Put one finger on the row and one on the column, then slide them together.',
            'Can you turn it round? What is 8 times 3?',
            'If 3 groups of 8 make 24, how many groups of 8 are in 24?',
          ],
          watch: [
            'Counting every dot from 1 instead of counting along the row in jumps (8, 16, 24).',
            'Reading the row next door (7 × 9 read as 7 × 8 = 56).',
            'Writing a division backwards (8 ÷ 24) or leaving the divisions out of a fact family.',
          ],
          offline: 'Lay out a muffin tin or an egg box. Say the multiplication it shows both ways round, then both divisions (2 rows of 6: 2 × 6, 6 × 2, 12 ÷ 2, 12 ÷ 6).',
        },
      },
      'sequence-hops': {
        title: 'Sequence Hops',
        icon: '🏀',
        summary: 'Find the jump size in a number pattern and keep jumping, even past 100.',
        book: 'Textbook p.172 Q5–6 · Workbook p.153 Q3, p.154 Q10, p.155 Q11',
        tips: {
          goal: 'Spot the term-to-term rule (add or subtract the same number each time) and use it to continue a sequence, even across 100.',
          say: [
            'How far is it from this number to the next one?',
            'Is it getting bigger or smaller?',
            'Adding 9 is like adding 10 and taking 1 away.',
          ],
          watch: [
            'Slips only where the pattern crosses 100 (99 + 8 = 117, or 108 − 9 = 98).',
            'A rule that works for the first jump but not for the others.',
            'Calling 83, 91, 99 "the 8 times table": it jumps in 8s but does not start at 0.',
          ],
          offline: 'Count up in 5s starting at 18 while stepping on stairs or paving slabs. Then count back down in 9s from 108.',
        },
      },

      /* ---------------- 11.2 Playing with multiplication and division ---------------- */
      'split-and-multiply': {
        title: 'Split and Multiply',
        icon: '✂️',
        summary: 'Cut a big times question into two easy ones, and multiply in any order.',
        book: 'Textbook p.173–174 Q1–3, Worked example 1 · Workbook p.155 Q1–2, p.156–157 Q4–5, p.157–158 Q8–9',
        tips: {
          goal: 'Break a bigger multiplication into two facts he already knows (16 × 4 = 10 × 4 + 6 × 4), and multiply three numbers in the easiest order.',
          say: [
            'Which part is easy: the 10 or the 6?',
            'Now add the two pieces together.',
            'Which two numbers would you multiply first? Look for a pair that makes 10 or 20.',
          ],
          watch: [
            '16 × 4 = 46: only the 10 was multiplied, the 6 was just added on.',
            'Adding the three numbers (5 + 4 + 3) instead of multiplying them.',
            'A split that does not add back to the number (16 split as 10 and 5).',
          ],
          offline: 'Lay out 4 rows of 13 coins or buttons. Put a pencil between the 10th and 11th column, count each part (40 and 12), then add.',
        },
      },
      'share-and-leftovers': {
        title: 'Share and Leftovers',
        icon: '🍬',
        summary: 'Share sweets fairly between plates. What is left over is the remainder.',
        book: 'Textbook p.175 Q4–5 · Workbook p.156 Q3, p.157 Q6–7, p.158 Q10–11, p.159 Q12',
        tips: {
          goal: 'Divide by sharing equally and write any left-over amount as a remainder (30 ÷ 4 = 7 r2).',
          say: [
            'Does everyone get the same?',
            'Could we give one more to each plate?',
            'Check: 4 lots of 7, add the 2 left over. Is it 30?',
          ],
          watch: [
            'A remainder that is as big as, or bigger than, the number of plates (53 ÷ 5 = 9 r8).',
            'Leaving the remainder out (30 ÷ 4 = 7) or writing the remainder as the answer.',
            'Thinking a division with a remainder is "wrong" or "doesn\'t work".',
          ],
          offline: 'Share a handful of grapes or raisins between the family, one at a time. Say the sentence: "17 shared by 3 is 5 each, 2 left over."',
        },
      },

      /* ---------------- 11.3 Extending multiplication and division ---------------- */
      'grid-method-builder': {
        title: 'Grid Method Builder',
        icon: '🧱',
        summary: 'Estimate first, then multiply the tens and the ones and add them.',
        book: 'Textbook p.177–178 Worked example 2, Q1–2, p.181 Check your progress Q1 · Workbook p.159 Q1, p.161 Q5, p.163 Q9',
        tips: {
          goal: 'Estimate by rounding to the nearest ten, then multiply a 2-digit number by 2–5 in a grid: tens and ones separately, then add.',
          say: [
            'Which ten is it closest to?',
            '2 tens times 4 is how many tens?',
            'Is your answer close to your estimate?',
          ],
          watch: [
            '20 × 4 written as 8 (the zero is lost).',
            'Forgetting to add the two boxes, or adding 80 + 28 as 98.',
            'Rounding the wrong way for the estimate (58 to 50).',
          ],
          offline: 'Use 10p and 1p coins (or bundles of 10 straws and single straws). Make 4 piles of 23. Count all the tens first, then the ones, then add.',
        },
      },
      'chunk-and-divide': {
        title: 'Chunk and Divide',
        icon: '📦',
        summary: 'Divide big numbers by taking away 10 groups at a time.',
        book: 'Workbook p.160 Q2, p.161–162 Q6, p.163 Q10 (the Textbook does not teach this layout)',
        tips: {
          goal: 'Divide by taking away big chunks of groups (10 groups at a time), then single groups, and count how many groups were taken.',
          say: [
            'Can we take away 10 groups of 4 again?',
            'How many groups have we taken altogether?',
            'Is what is left smaller than 4? Then it is the remainder.',
          ],
          watch: [
            'Forgetting to add up the group counts at the end (10 + 10 + 1 = 21).',
            'Taking away 4 instead of 40 for "10 groups of 4".',
            'Stopping while there is still enough left for another group.',
          ],
          offline: 'Count out 46 pasta pieces. Take away handfuls of 4 into egg-box cups and keep a tally. How many cups, and how many pieces are left?',
        },
      },
      'remainder-decisions': {
        title: 'Remainder Decisions',
        icon: '🎾',
        summary: 'In a story, does the leftover need one more box, or is it just spare?',
        book: 'Textbook p.179–180 Q3–7, p.181–182 Check your progress Q2–4 · Workbook p.160 Q3–4, p.161–162 Q6–8, p.163–164 Q10–13',
        tips: {
          goal: 'Understand that a remainder means something real in a story, and decide whether to round up, round down or say what is left over.',
          say: [
            'What happens to the ones left over?',
            'Does everyone need a seat? Then we need one more bench.',
            'If we share between fewer people, does each get more or less?',
          ],
          watch: [
            'Always adding 1, or never adding 1, whatever the story says.',
            'Forgetting a hidden fact: a bike has 2 wheels; the taxi driver is not a passenger.',
            'Thinking dividing by a bigger number gives a bigger answer (72 ÷ 4 > 72 ÷ 3).',
          ],
          offline: 'Pack 14 eggs (or socks, or toys) into boxes of 6. How many boxes do you need? How many boxes are full?',
        },
      },
    }
  );
})();

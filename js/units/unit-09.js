/* Unit 9: More addition and subtraction — sections, activity list and parent tips.
 * Page references are printed page numbers in Learner's Book 3 (Textbook) and Workbook 3.
 * Textbook p.136–137 are missing from our scan; the workbook (p.109–114) covers that part of 9.1.
 */
(function () {
  'use strict';
  window.MQ.addUnit(
    {
      id: 'u9',
      number: 9,
      title: 'More addition and subtraction',
      sections: [
        {
          id: '9.1',
          title: 'Addition: regrouping tens and reordering',
          color: '#ff9f1c',
          book: 'Textbook p.133–139 · Workbook p.109–114',
          activities: ['tens-make-a-hundred', 'best-order-adding'],
        },
        {
          id: '9.2',
          title: 'Subtraction: regrouping tens',
          color: '#2ec4b6',
          book: 'Textbook p.140–144 · Workbook p.115–119',
          activities: ['swap-a-hundred', 'mystery-number'],
        },
        {
          id: '9.3',
          title: 'Complements',
          color: '#c77dff',
          book: 'Textbook p.144–149 · Workbook p.120–125',
          activities: ['bonds-to-100', 'thousand-partners'],
        },
      ],
    },
    {
      /* ---------------- 9.1 Addition: regrouping tens and reordering ---------------- */
      'tens-make-a-hundred': {
        title: 'Tens Make a Hundred',
        icon: '➕',
        summary: 'Add 2- and 3-digit numbers on a place value mat, swapping 10 tens for a hundred.',
        book: 'Textbook p.133 Getting started Q1, p.135 Q1–2, p.149 Check your progress Q1 · Workbook p.109 Q1, p.110 Q2–3, p.111 Q4 and Q6, p.112 Q9, p.113 Q12–13, p.114 Q15',
        tips: {
          goal: 'Add numbers up to 3 digits when the ones or the tens make 10 or more, and check the answer against an estimate.',
          say: [
            'How many tens altogether? Is that more than 9?',
            'Ten tens make one hundred. Swap them.',
            'What was your estimate? Is your answer close to it?',
          ],
          watch: [
            'Writing 64 + 53 = 1117: putting "11" in the tens place instead of swapping 10 tens for 1 hundred.',
            'Forgetting to add the hundred (or the ten) made by the swap.',
            'Lining numbers up on the left instead of by hundreds, tens and ones when writing three numbers in a column.',
          ],
          offline: 'Use 1p and 10p coins (or pasta pieces and bundles of 10 straws). Add two amounts like 64p and 53p, and swap ten 10p coins for a £1 coin.',
        },
      },
      'best-order-adding': {
        title: 'Best Order Adding',
        icon: '🔀',
        summary: 'Put numbers in a smart order, with pairs that make 10 and doubles, before adding.',
        book: 'Textbook p.138 Q5–6, p.139 Q7 · Workbook p.111 Q5, p.112 Q11, p.113 Q14, p.114 Q15',
        tips: {
          goal: 'Know that numbers can be added in any order, and choose the order that makes adding easy (pairs to 10, doubles).',
          say: [
            'Can you see two numbers that make 10?',
            'Is there a double?',
            'Does changing the order change the answer?',
          ],
          watch: [
            'Always adding from left to right and counting on in ones.',
            'Leaving a number out (or using one twice) after moving the cards around.',
            'Number words with place value slips, like "two hundred and five three" for 253.',
          ],
          offline: 'Roll three or four dice and race to add them. Whoever spots a pair that makes 10 says it out loud first.',
        },
      },

      /* ---------------- 9.2 Subtraction: regrouping tens ---------------- */
      'swap-a-hundred': {
        title: 'Swap a Hundred',
        icon: '🔓',
        summary: 'Subtract by swapping 1 hundred for 10 tens when there are not enough tens.',
        book: 'Textbook p.133 Getting started Q2–3, p.140 Q1, p.141 Q2–3, p.142 Q4, p.149 Check your progress Q1 · Workbook p.115 Q1, p.116 Q2, p.117 Q4–6, p.118 Q7 and Q9, p.119 Q10',
        tips: {
          goal: 'Subtract 2- and 3-digit numbers, swapping 1 hundred for 10 tens (or 1 ten for 10 ones) when a column does not have enough.',
          say: [
            'Do you have enough tens to take away?',
            'Swap one hundred for ten tens. How many tens now?',
            'Check it: add your answer to the number you took away.',
          ],
          watch: [
            '246 − 84 = 242: taking the smaller digit from the bigger one in the tens (8 − 4) instead of swapping.',
            'Swapping a hundred but leaving the hundreds digit the same.',
            'Getting stuck when there are 0 tens, as in 309.',
          ],
          offline: 'Use £1 coins and 10p coins. Make £2.46, then pay 84p: he has to change a £1 coin into ten 10p coins first.',
        },
      },
      'mystery-number': {
        title: 'Mystery Number',
        icon: '🙂',
        summary: 'Find a hidden number: make a sensible guess, check it, then make it better.',
        book: 'Textbook p.142 Worked example 2, p.143 Q5 and Think like a mathematician · Workbook p.116 Q3, p.118 Q8, p.119 Q11–12',
        tips: {
          goal: 'Use trial and improvement: a sensible first guess, then small changes using what each check tells you.',
          say: [
            'Is your guess too big or too small?',
            'How far out were you? Change your guess by about that much.',
            'Both bags must have the same number. Add your guess to itself.',
          ],
          watch: [
            'Guessing wildly without using the last result.',
            'For two equal bags or two equal prices (really halving), trying different numbers in each. Let him guess one number, double it by adding it to itself, and compare.',
            'In 3?7 − 1?7 = 160, thinking both missing digits must be the same, or stopping after one answer.',
          ],
          offline: 'Count out 30 buttons together. Hide some in your hand and show what is left. He guesses how many you hid, checks by adding, and improves the guess.',
        },
      },

      /* ---------------- 9.3 Complements ---------------- */
      'bonds-to-100': {
        title: 'Bonds to 100',
        icon: '💯',
        summary: 'Shade a 100 square to find the number that makes 100.',
        book: 'Textbook p.145 Q1, p.149 Check your progress Q2 · Workbook p.120–121 Q1, p.121 Q3, p.122 Q4, p.122–123 Q7, p.124 Q8',
        tips: {
          goal: 'Find the partner that makes 100 quickly: the ones make 10 and the tens make 9.',
          say: [
            'What makes the ones up to 10?',
            'Now the tens only need to make 9, because one ten is already made.',
            'Check: does it fill the whole square?',
          ],
          watch: [
            'Making both digits add to 10: 35 + 75, or 19 + 91.',
            'Single-digit numbers: 8 + 2 = 100 (the partner of 8 is 92).',
            'Counting on in ones instead of using bonds to 10.',
          ],
          offline: 'Play "100 snap": you call a number, he calls its partner to 100, then swap roles. Check some with a 100 cm tape measure.',
        },
      },
      'thousand-partners': {
        title: 'Thousand Partners',
        icon: '🧮',
        summary: 'Find partners to 1000, and add or take away tens in your head.',
        book: 'Textbook p.146 Q2, p.147 Q3–4, p.148 Q5 and Think like a mathematician, p.149 Check your progress Q2–3 · Workbook p.121 Q2, p.122 Q5–6, p.124 Q9, p.125 Q10–11',
        tips: {
          goal: 'Use bonds to 100 to find partners to 1000, and add or subtract multiples of 10 in your head by jumping to the next hundred.',
          say: [
            'Hide the 0: 35 and what make 100? Now put the 0 back.',
            'Jump to the next hundred first.',
            'Is your answer sensible? Estimate it.',
          ],
          watch: [
            '440 + 660 = 1000: making the hundreds add to 10 instead of 9.',
            '560 + 290 = 750: losing the extra hundred when the tens make more than 100.',
            '670 − 380 = 310: taking digits away without swapping a hundred.',
          ],
          offline: 'With a pretend £10 (1000p), "buy" things priced in 10p steps (like £3.70) and work out the change in your head.',
        },
      },
    }
  );
})();

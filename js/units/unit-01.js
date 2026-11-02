/* Unit 1: Numbers to 1000 — sections, activity list and parent tips.
 * Page references are printed page numbers in Learner's Book 3 (Textbook) and Workbook 3.
 */
(function () {
  'use strict';
  window.MQ.addUnit(
    {
      id: 'u1',
      number: 1,
      title: 'Numbers to 1000',
      sections: [
        {
          id: '1.1',
          title: 'Hundreds, tens and ones',
          color: '#ff9f1c',
          book: 'Textbook p.10–15 · Workbook p.8–13',
          activities: ['place-value-builder', 'number-square-pieces', 'number-word-cards'],
        },
        {
          id: '1.2',
          title: 'Comparing and ordering',
          color: '#2ec4b6',
          book: 'Textbook p.16–19 · Workbook p.14–17',
          activities: ['compare-and-order', 'number-line-1000'],
        },
        {
          id: '1.3',
          title: 'Estimating and rounding',
          color: '#c77dff',
          book: 'Textbook p.20–23 · Workbook p.18–22',
          activities: ['rounding-hill'],
        },
      ],
    },
    {
      /* ---------------- 1.1 Hundreds, tens and ones ---------------- */
      'place-value-builder': {
        title: 'Build a number',
        icon: '🧱',
        summary: 'Build, read and split 3-digit numbers with hundreds, tens and ones blocks.',
        book: 'Textbook p.11, p.13 Q2–4, p.14 Q5, p.23 Q2 · Workbook p.8 Q3, p.9 Q4–5, p.10–11 Q7–9',
        tips: {
          goal: 'Know what each digit in a 3-digit number is worth: the 9 in 394 is worth 90, not 9.',
          say: [
            'Read it aloud. Which word tells you the hundreds?',
            'How many tens is that? So what is it worth?',
            'Is there anything in the tens? Then what goes there?',
          ],
          watch: [
            'Answering 9 when the value is 90, or writing a label ("9 tens") instead of the value 90 (he did this in his book).',
            'Writing 4008 for four hundred and eight: an empty column still needs a 0.',
            'Miscounting the blocks: in his workbook he drew 2 hundred-squares for 316.',
          ],
          offline: 'Make 3-digit numbers with bundles of 10 straws (and bundles of 10 bundles for hundreds). One person builds, the other reads the number, then swap.',
        },
      },
      'number-square-pieces': {
        title: 'Number grid jigsaw',
        icon: '🧩',
        summary: 'Fill the gaps in pieces of a 1–1000 number grid by counting on and back in 1s and 10s.',
        book: 'Textbook p.10 Q1, p.12 Q1, p.16 Q1, p.23 Q1 · Workbook p.8 Q1–2, p.9 Q6, p.12 Q10–11, p.14 Q1',
        tips: {
          goal: 'Move around a number grid from any 3-digit number: right +1, left −1, down +10, up −10.',
          say: [
            'Going down a row, how many squares did you skip?',
            'Which digit changes when we go down? The tens!',
            'What comes after 390 when we count in tens? 400!',
          ],
          watch: [
            'Top priority: his books show the square below filled as one more (and above as one less) on five pages. He even made his own rule "up and right are plus". Go slowly on the first questions and use the Peek button.',
            'Mixing up left and right (he once wrote 115 to the left of 112).',
            'Crossing a hundred: 899 then 909 below, not 8100.',
          ],
          offline: 'Write a 100-square from 401 to 500 on squared paper. Cut out small shapes with one number left on each and fill in the rest together.',
        },
      },
      'number-word-cards': {
        title: 'Number word cards',
        icon: '🔤',
        summary: 'Read and build number names to 1000 with word cards, and match words to digits.',
        book: 'Textbook p.11, p.15 Q6 · Workbook p.9 Q3, p.11 Q8–9, p.13 Q12–13',
        tips: {
          goal: 'Read and write number words from 0 to 1000, and match them to digits.',
          say: [
            'Which card tells you the hundreds?',
            'Can you only use the cards on the tray?',
            'Say it slowly. Is it thirteen or thirty?',
          ],
          watch: [
            'Using words that are not on the cards (seen in his book: he made 875 from cards that had no "five").',
            'Writing digits when words are asked for (he did this every time in the workbook).',
            'Writing the number as it sounds: 300708 for three hundred and seventy-eight.',
          ],
          offline: 'On a walk, read house numbers, bus numbers or prices aloud. At home, write one or two of them in words together.',
        },
      },

      /* ---------------- 1.2 Comparing and ordering ---------------- */
      'compare-and-order': {
        title: 'Bigger or smaller?',
        icon: '⚖️',
        summary: 'Compare 3-digit numbers digit by digit, use < and >, and put numbers in order.',
        book: 'Textbook p.16, p.17 Q2–3, p.18 Q4 and Q7, p.19 · Workbook p.14 Q2–3, p.15 Q4 Q6–7, p.16 Q9–11, p.17 Q12',
        tips: {
          goal: 'Compare and order 3-digit numbers by looking at the hundreds first, then the tens, then the ones.',
          say: [
            'Look at the hundreds first. Which has more?',
            'The hundreds are the same. What do we look at next?',
            'Read it out: 458 is less than 643.',
          ],
          watch: [
            'Thinking 48 is bigger than 384 because 8 is a big digit. A 2-digit number is always smaller than a 3-digit one.',
            'Turning < and > round. The open side faces the bigger number.',
            'Ordering the wrong way when the question asks greatest to smallest.',
          ],
          offline: 'Write five prices or house numbers on scraps of paper and line them up on the table from smallest to greatest, then the other way.',
        },
      },
      'number-line-1000': {
        title: 'Where on the line?',
        icon: '📏',
        summary: 'Place and estimate numbers on a 0–1000 number line marked in hundreds.',
        book: 'Textbook p.10 Q2, p.16, p.18 Q5–6 · Workbook p.15 Q5, p.16 Q8, p.17 Q13',
        tips: {
          goal: 'Know roughly where any number up to 1000 lives on a number line marked in hundreds.',
          say: [
            'Which two hundreds is it between?',
            'Is it nearer the start or the end of that gap?',
            'A sensible guess is fine. It does not have to be exact.',
          ],
          watch: [
            'Counting each mark as 10 instead of 100.',
            'Placing 48 near 480: a 2-digit number lives right at the start of the line.',
            'Worrying about being exact, or giving an estimate in the wrong hundred.',
          ],
          offline: 'Tape a 0–1000 line along the hallway with a mark every 100. Call out a number and he stands where it would be.',
        },
      },

      /* ---------------- 1.3 Estimating and rounding ---------------- */
      'rounding-hill': {
        title: 'Rounding hill',
        icon: '⛰️',
        summary: 'Round 3-digit numbers to the nearest 10 and 100 and give sensible range estimates.',
        book: 'Textbook p.20 Q1, p.21 Q2–3, p.22 Q4–5, p.23 Q3 · Workbook p.18 Q1–2, p.19 Q3–5, p.20 Q6–7, p.21 Q8–10, p.22 Q11–12',
        tips: {
          goal: 'Round any number up to 1000 to the nearest 10 and the nearest 100, and make sensible estimates.',
          say: [
            'Which two tens (or hundreds) is it between?',
            'Is it past halfway?',
            'Exactly halfway rolls forward, up to the bigger one.',
          ],
          watch: [
            '598 to the nearest 10 written as 590 or 5100 (it is 600), and 987 to the nearest 100 written as 900 (it is 1000).',
            'Looking at the ones digit when rounding to the nearest 100. Use the tens digit.',
            'Wild estimates: in the workbook he guessed 1000 for about 200 dots. Ask him to picture a group of 100 first.',
          ],
          offline: 'In a shop, round prices to the nearest 10. At home, grab a handful of dried beans or pasta, guess a range (100–200?), then count them in tens to check.',
        },
      },
    }
  );
})();

/* Unit 2: Tally charts and frequency tables — sections, activity list and parent tips.
 * Page references are printed page numbers in Learner's Book 3 (Textbook) and Workbook 3.
 */
(function () {
  'use strict';
  window.MQ.addUnit(
    {
      id: 'u2',
      number: 2,
      title: 'Tally charts and frequency tables',
      sections: [
        {
          id: '2.1',
          title: 'Tally charts and frequency tables',
          color: '#ff9f1c',
          book: 'Textbook p.24–35 · Workbook p.23–34',
          activities: ['tally-marks', 'survey-tally-table', 'read-the-table', 'chance-experiment'],
        },
      ],
    },
    {
      'tally-marks': {
        title: 'Tally marks',
        icon: '✏️',
        summary: 'Make and read tally marks grouped in fives, counting the gates in 5s.',
        book: 'Textbook p.24 Getting started, p.26, p.34 Q1 · Workbook p.23 Q1, p.24 Q3, p.32 Q11',
        tips: {
          goal: 'Record and read numbers up to about 30 as tally marks grouped in fives.',
          say: [
            'How much is one gate worth?',
            'Count the gates in fives, then the single sticks in ones.',
            'Cross it on the fifth one.',
          ],
          watch: [
            'Groups of six or seven upright strokes, or a five drawn as five sticks plus a crossing line (seen in his book on p.24 and p.34).',
            'Counting a gate as 1, or counting the crossing line as an extra stroke (a gate counted as 6).',
            'Counting long rows one stick at a time and losing track. Point at each gate and say 5, 10, 15.',
          ],
          offline: 'Sit by a window for five minutes and tally the cars, bikes and buses that go past. Then count each row in fives together.',
        },
      },
      'survey-tally-table': {
        title: 'Class survey',
        icon: '📋',
        summary: 'Collect answers from a picture, tally them and turn the tally chart into a frequency table.',
        book: 'Textbook p.26–27, p.31 Q3, p.32 Q4, p.35 Q3 · Workbook p.24 Q2–3, p.25–26 Q4, p.26–27 Q5, p.28 Q7',
        tips: {
          goal: 'Collect data into a tally chart for one question, then turn it into a frequency table with numbers.',
          say: [
            'Cross it off once you have tallied it.',
            'Count your tally. Does the number match?',
            'Do all your frequencies add up to how many people there were?',
          ],
          watch: [
            'Leaving out the frequency column (he did this on p.32 Q4).',
            'Counting the same item twice or missing one. Ticking off each item helps.',
            'Making a big chart with no real question behind it (his workbook party survey had 10 animals and counts up to 35). Keep it to one question, about four choices and ten people.',
          ],
          offline: 'Ask the family one question (favourite fruit, how they get to work). Tally the answers on paper, then make a frequency table with numbers.',
        },
      },
      'read-the-table': {
        title: 'What does the table tell us?',
        icon: '🔎',
        summary: 'Answer questions from tally charts and tables: most, least, the same, total and how many more.',
        book: 'Textbook p.30 Q2, p.32 Q4, p.34 Q1–2, p.35 Q3 · Workbook p.23 Q1, p.24 Q3, p.27 Q6, p.28 Q7, p.30 Q9, p.31 Q10a, p.32 Q11',
        tips: {
          goal: 'Use a tally chart or frequency table to answer questions and say what it shows (and what it does not).',
          say: [
            'Which number is the biggest?',
            'How many people altogether? What do we add?',
            'Does the table tell us WHY they chose it?',
          ],
          watch: [
            'Reading a clue like "seven people like bananas" as "add seven" (he did this on p.34 Q2). Double and half also confuse.',
            'Adding slips such as 17 + 15 = 22. Ask him to check with tens and ones.',
            'Tables where the categories are numbers (24 sweets in 4 bags). Ask: which column tells us how many bags? Skip workbook p.31 Q10b for now; it needs multiplication.',
          ],
          offline: 'Find a simple table on a cereal box, a bus timetable or a sports page and take turns asking each other three questions about it.',
        },
      },
      'chance-experiment': {
        title: 'Test your guess',
        icon: '🎲',
        summary: 'Make a prediction, flip coins or throw a dice, tally the results and see that chance changes each time.',
        book: 'Textbook p.28 Worked example 1, p.29 Q1, p.31 Q3, p.33 · Workbook p.30 Q8, p.34 Q12',
        tips: {
          goal: 'Test a prediction (a conjecture) with an experiment and understand that chance results are different each time.',
          say: [
            'What do you think will happen? That is your conjecture.',
            'Did it match? Would it match next time?',
            'Why might your result be different from mine?',
          ],
          watch: [
            'Thinking an unexpected result means the experiment went wrong.',
            'Losing count of how many throws have been done. Heads + tails should make the number of flips.',
          ],
          offline: 'Each flip a real coin 20 times and tally heads and tails. Compare your two charts: are they the same?',
        },
      },
    }
  );
})();

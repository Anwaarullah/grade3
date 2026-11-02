/* Unit 10: Graphs — sections, activity list and parent tips.
 * Page references are printed page numbers in Learner's Book 3 (Textbook) and Workbook 3.
 */
(function () {
  'use strict';
  window.MQ.addUnit(
    {
      id: 'u10',
      number: 10,
      title: 'Graphs',
      sections: [
        {
          id: '10.1',
          title: 'Pictograms and bar charts',
          color: '#ff9f1c',
          book: 'Textbook p.150–159 · Workbook p.126–138',
          activities: ['pictogram-maker', 'bar-chart-builder', 'spin-and-count'],
        },
        {
          id: '10.2',
          title: 'Venn and Carroll diagrams',
          color: '#2ec4b6',
          book: 'Textbook p.160–167 · Workbook p.139–151',
          activities: ['venn-hoops', 'carroll-grid'],
        },
      ],
    },
    {
      /* ---------------- 10.1 Pictograms and bar charts ---------------- */
      'pictogram-maker': {
        title: 'Pictogram Maker',
        icon: '🖼️',
        summary: 'Read and build pictograms, using a key where one picture can stand for 1 or 2.',
        book: 'Textbook p.150 Getting started, p.152, p.153 Worked example 1, p.154 Q1, p.166 Check your progress Q1 · Workbook p.126 worked example, p.127 Q1, p.129 Q3, p.130 Q4, p.131 Q5, p.135–136 Q9, p.137 Q10',
        tips: {
          goal: 'Use the key to turn pictures into numbers, and draw a pictogram from data with a title and a key.',
          say: [
            'What does one picture stand for? Look at the key first.',
            'The key says 2, so count along the row in twos: 2, 4, 6…',
            'A half picture is worth half of a whole one. Half of 2 is 1.',
          ],
          watch: [
            'Counting the pictures in ones when the key says 1 picture = 2 (reading 5½ pictures as 5 or 6 instead of 11).',
            'Counting a half picture as a whole one, or leaving it out.',
            'Answering "how many altogether" when the question asks "how many more".',
          ],
          offline: 'Draw a pictogram of the fruit in your kitchen with one circle per fruit. Then redraw it with one circle for every 2 fruits, using a half circle for an odd one.',
        },
      },
      'bar-chart-builder': {
        title: 'Bar Chart Builder',
        icon: '📊',
        summary: 'Drag bars to the right height, label the chart, and read the scale.',
        book: 'Textbook p.152, p.155 Q2, p.167 Check your progress Q4 · Workbook p.128 Q2, p.130 Q4, p.132 Q6, p.133 Q7, p.134 Q8, p.138 Q11, p.149 Q11a–b',
        tips: {
          goal: 'Draw and read bar charts that have a title, labels on both axes and a scale, including a scale that goes up in 2s.',
          say: [
            'Follow the top of the bar straight across to the numbers.',
            'What does each step on the scale go up in? 1 or 2?',
            'The bar stops halfway between 6 and 8. What number is halfway?',
          ],
          watch: [
            'Counting the gridlines instead of reading the numbers when the scale goes up in 2s.',
            'Leaving off the title or an axis label: someone else could not read the chart.',
            'Bars that do not start at 0.',
          ],
          offline: 'Ask family members their favourite drink and draw a bar chart on squared paper together. Give it a title and label both axes.',
        },
      },
      'spin-and-count': {
        title: 'Spin and Count',
        icon: '🎲',
        summary: 'Spin, roll or ask, tally the results, turn them into a chart, and compare with your guess.',
        book: 'Textbook p.151, p.156–157 Q3–Q4, p.158 Q5, p.159 Think like a mathematician · Workbook p.141–142 Q3, p.145–146 Q7, p.150–151 Q11c',
        tips: {
          goal: 'Collect data in a tally chart, show it as a graph, and see that results change each time you repeat an experiment.',
          say: [
            'What do you think will happen? Why?',
            'Count the tally in fives first, then the ones left over.',
            'If we did it again, would we get the same numbers?',
          ],
          watch: [
            'Miscounting a tally gate: four lines with one across is 5, not 4.',
            'Being upset that the prediction was "wrong". A prediction is a sensible guess.',
            'Thinking every total from two dice is equally likely (7 comes up most often).',
          ],
          offline: 'Throw two real dice 20 times and tally the totals. Which total came up most? Try again tomorrow and compare the two tallies.',
        },
      },

      /* ---------------- 10.2 Venn and Carroll diagrams ---------------- */
      'venn-hoops': {
        title: 'Venn Hoops',
        icon: '⭕',
        summary: 'Sort things into two hoops: the middle is for both, the outside is for neither.',
        book: 'Textbook p.160, p.161 Worked example 2, p.162 Q1, p.164 Q3, p.167 Check your progress Q3 · Workbook p.139 worked example, p.140 Q1, p.143 Q4, p.147 Q8, p.149 Q10b',
        tips: {
          goal: 'Use a Venn diagram to show what things have in common (the overlap) and how they differ.',
          say: [
            'Does it fit this rule? Does it fit that one too?',
            'If it fits both rules, it goes in the middle where the hoops overlap.',
            'If it fits neither rule, it still goes in the box, outside the hoops.',
          ],
          watch: [
            'Putting a number that fits both rules in only one hoop (6 only in "multiples of 2").',
            'Leaving out things that fit neither rule.',
            'Times-table slips on "multiple of 3" or "multiple of 5": use the skip-count line rather than guessing.',
          ],
          offline: 'Put two loops of string on the floor so they overlap. Sort toys or socks by two rules you choose together, like "red" and "soft".',
        },
      },
      'carroll-grid': {
        title: 'Carroll Grid',
        icon: '🔲',
        summary: 'Sort things into a 2 by 2 grid using a rule and its opposite.',
        book: 'Textbook p.160, p.163 Q2, p.165 Q4, p.166 Check your progress Q2 · Workbook p.140 Q2, p.141–142 Q3, p.144 Q5–Q6, p.148 Q9–Q10a',
        tips: {
          goal: 'Use a Carroll diagram to sort by two rules and their opposites, so every item has exactly one place.',
          say: [
            'Check the row first, then the column.',
            '"Not even" means the same as odd.',
            'Do your labels give every item a place?',
          ],
          watch: [
            'Reading a row label as a column label, so the item lands one cell across.',
            'Saying a circle or a cylinder has corners (vertices), or that a cube is 2D because it is drawn flat.',
            '"Not less than 50" means 50 or more, so 50 itself belongs there.',
          ],
          offline: 'Draw a 2 by 2 grid on paper and sort the shoes in the house: "has laces / no laces" across the top and "big / not big" down the side.',
        },
      },
    }
  );
})();

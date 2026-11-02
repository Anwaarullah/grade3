/* Unit 7: Fractions of shapes — sections, activity list and parent tips.
 * Page references are printed page numbers in Learner's Book 3 (Textbook) and Workbook 3.
 */
(function () {
  'use strict';
  window.MQ.addUnit(
    {
      id: 'u7',
      number: 7,
      title: 'Fractions of shapes',
      sections: [
        {
          id: '7.1',
          title: 'Fractions and equivalence of shapes',
          color: '#ff9f1c',
          book: 'Textbook p.117–124 · Workbook p.97–103',
          activities: ['fair-share-pizza', 'fraction-colour-in', 'fraction-strip-wall', 'whole-from-part', 'tile-designer'],
        },
      ],
    },
    {
      'fair-share-pizza': {
        title: 'Fair Shares',
        icon: '🍕',
        summary: 'Deal out pizza slices one at a time, then name each share as a fraction.',
        book: 'Textbook p.117, p.119–120 Q2 · Workbook p.98 Q3',
        tips: {
          goal: 'Share a whole equally and name each share as a fraction of the whole (10 slices shared by 5 people: 2 each, so 2/10).',
          say: [
            'Are all the pieces the same size?',
            'Don\'t forget to count yourself!',
            'How many pieces is the whole pizza cut into? How many does each person get?',
          ],
          watch: [
            'Counting "you and four friends" as 4 people instead of 5.',
            'Thinking 1/10 is bigger than 1/5 because 10 is bigger than 5. More pieces means smaller pieces.',
            'Accepting pieces that are not equal as halves or quarters.',
          ],
          offline: 'Cut a sandwich or pancake into 4 or 8 equal pieces and deal them out one at a time to family members. Say each person\'s fraction.',
        },
      },
      'fraction-colour-in': {
        title: 'Colour the Fraction',
        icon: '🎨',
        summary: 'Colour parts of shapes and name the fraction: parts coloured over equal parts.',
        book: 'Textbook p.118–119 Worked example 1, p.119 Q1, p.123–124 Check your progress · Workbook p.97, p.98 Q1–2, p.100 Q5, p.101 Q7',
        tips: {
          goal: 'Name fractions of shapes: the bottom number (denominator) is how many equal parts, the top number (numerator) is how many we are talking about.',
          say: [
            'How many equal parts altogether? That is the bottom number.',
            'How many are coloured? That is the top number.',
            'If you colour them all, what do you get? (5/5 is one whole.)',
          ],
          watch: [
            'Writing coloured over not coloured (3/7 instead of 3/10).',
            'Putting the numbers the wrong way up (10/3).',
            'Workbook p.98–100 asks for 1/3 of 12 squares or 3/4 of 20. That is really division: first split the squares into equal groups by circling them, then shade whole groups.',
          ],
          offline: 'Draw lines to cut a paper plate into 10 sections and colour them in 2 or 3 colours. Say the fraction for each colour and check they add up to 10/10.',
        },
      },
      'fraction-strip-wall': {
        title: 'Fraction Strip Wall',
        icon: '🧱',
        summary: 'Line up halves, quarters, fifths and tenths to find fractions that are the same size.',
        book: 'Textbook p.120 Q3, p.123 Check your progress Q1 · Workbook p.101 Q6, p.103 Q9',
        tips: {
          goal: 'See that two different fractions can be the same amount (equivalent): 1/2 = 2/4 = 5/10 and 1/5 = 2/10.',
          say: [
            'Do the ends line up exactly?',
            'How many tenths fit under one fifth?',
            'Same amount, different name.',
          ],
          watch: [
            'Thinking 2/4 must be more than 1/2 because the numbers are bigger.',
            'Thinking 1/10 is more than 1/5 because 10 is more than 5.',
            'The workbook asks for 1/2 = 5/10 and 8/10 = 4/5, which the textbook never shows. Use the wall for these.',
          ],
          offline: 'Cut four paper strips the same length. Fold one in half, one into quarters, and mark one into 5 (every 4 cm on a 20 cm strip) and one into 10. Lay them under each other.',
        },
      },
      'whole-from-part': {
        title: 'Find the Whole',
        icon: '🔷',
        summary: 'Bolt shows part of a shape. Add equal pieces to build the whole.',
        book: 'Textbook p.121 Q4–Q5 · Workbook p.99 Q4, p.102 Q8',
        tips: {
          goal: 'Work backwards from a part to the whole: the bottom number tells you how many equal pieces the whole needs.',
          say: [
            'If this is 2 of the 4 pieces, how many more pieces do we need?',
            'Are your new pieces the same size?',
            'Can you make a different whole that still works?',
          ],
          watch: [
            'Using pieces of a different size.',
            'Thinking 2/4 means the whole has 2 pieces.',
            'Thinking there is only one right answer. Any shape made of the right number of equal pieces works.',
          ],
          offline: 'Use Lego: "These 2 bricks are half of my tower. Build the whole tower." Then: "This brick is one third. Build the whole."',
        },
      },
      'tile-designer': {
        title: 'Tile Designer',
        icon: '🪟',
        summary: 'Colour square tiles to show a fraction, then read Bolt\'s tile designs.',
        book: 'Textbook p.122–123 Think like a mathematician: Designing tiles',
        tips: {
          goal: 'Make and read tile designs that show a fraction, and check that the parts are equal before naming it.',
          say: [
            'How many equal pieces is the tile cut into?',
            'Is there another way to colour the same fraction?',
            'How could you check Bolt\'s tile?',
          ],
          watch: [
            'Counting pieces that are not equal as if they were.',
            'Forgetting to name the part that is not shaded.',
            'Not spotting that 2/4 shaded is the same as 1/2.',
          ],
          offline: 'Fold a paper square along both diagonals and both middle lines, colour a pattern, and ask a family member to say the fraction coloured.',
        },
      },
    }
  );
})();

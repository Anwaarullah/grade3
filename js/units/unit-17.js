/* Unit 17: Pattern and symmetry (with Project 6 How likely?) — sections, activity list and parent tips.
 * Page references are printed page numbers in Learner's Book 3 (Textbook) and Workbook 3.
 * Workbook p.247–248 (end of 17.2) were not available when this unit was written.
 */
(function () {
  'use strict';
  window.MQ.addUnit(
    {
      id: 'u17',
      number: 17,
      title: 'Pattern and symmetry',
      sections: [
        {
          id: '17.1',
          title: 'Shape and symmetry',
          color: '#ff9f1c',
          book: 'Textbook p.260–267 · Workbook p.237–243',
          activities: ['mirror-line-finder', 'reflect-it'],
        },
        {
          id: '17.2',
          title: 'Pattern and symmetry',
          color: '#2ec4b6',
          book: 'Textbook p.267–276 · Workbook p.244–248',
          activities: ['six-square-designs', 'pattern-steps', 'likelihood-line'],
        },
      ],
    },
    {
      /* ---------------- 17.1 Shape and symmetry ---------------- */
      'mirror-line-finder': {
        title: 'Find the Fold',
        icon: '🪞',
        summary: 'Find the mirror line and fold to see if both halves match.',
        book: 'Textbook p.260, p.261 Q1, p.263 Q4, p.265 Q7–Q8, p.266 Q9 · Workbook p.237 Worked example 1, p.238 Q1, p.239 Q3, p.240 Q4–Q5, p.241 Q6',
        tips: {
          goal: 'Find vertical (up and down) and horizontal (side to side) lines of symmetry, and check them by folding: both halves must sit exactly on top of each other.',
          say: [
            'If we fold it on this line, would the two halves sit exactly on top of each other?',
            'Is your line going up and down, or side to side, like the horizon?',
            'The outside is a square, but what about the picture inside? Do the colours match too?',
          ],
          watch: [
            'Calling any line that cuts the shape in half a line of symmetry (a diagonal through a rectangle, a line through a parallelogram).',
            'Mixing up vertical and horizontal.',
            'Missing small off-centre details: a band or cross that is a little to one side, or three stripes in different colours.',
          ],
          offline: 'Cut out a paper heart, a rectangle and an arrow. Fold each one to find the lines that work, and the folds that do not.',
        },
      },
      'reflect-it': {
        title: 'Mirror Drawing',
        icon: '🦋',
        summary: 'Finish the picture by flipping it over the mirror line.',
        book: 'Textbook p.262–263 Q2–Q3, p.264 Q6, p.273 Check your progress Q1–Q2 · Workbook p.238–239 Q2, p.241 Q5b, p.242–243 Q8',
        tips: {
          goal: 'Draw an accurate reflection: every square ends up the same distance from the mirror line on the other side, and the picture faces the other way.',
          say: [
            'How many squares from the line is this square? So where must its partner go?',
            'Should the reflection face the same way, or the other way?',
            'There is a gap between the shape and the line. Is there the same gap on the other side?',
          ],
          watch: [
            'Copying the shape the same way round (sliding it) instead of flipping it.',
            'Counting from the edge of the shape instead of from the mirror line, so the gap is lost.',
            'Getting the shape right but the colours on the wrong squares.',
          ],
          offline: 'Draw half a face or half a house next to a line. Stand a small mirror on the line, look, then draw the other half and check with the mirror.',
        },
      },

      /* ---------------- 17.2 Pattern and symmetry ---------------- */
      'six-square-designs': {
        title: 'Symmetry Tile Designer',
        icon: '🟨',
        summary: 'Build designs from squares and shapes with one or two lines of symmetry.',
        book: 'Textbook p.263 Q5, p.271 Q5–Q6, p.272 Q7 and Think like a mathematician, p.274 Check your progress Q4–Q5 · Workbook p.238 Q1c, p.240 Q4b, p.242–243 Q7, Q9, p.245 Q3',
        tips: {
          goal: 'Make patterns that are symmetrical in a vertical line, a horizontal line, or both — with matching colours as well as matching shapes.',
          say: [
            'Fold it in your head along this line. Does every tile have a partner?',
            'Now check the other line. Does it still match?',
            'The shapes match. Do the colours match too?',
          ],
          watch: [
            'Matching the shapes but not the colours.',
            'Stopping after one line when two lines were asked for.',
            'Counting a turned-round copy as a new design.',
          ],
          offline: 'Use six sticky notes, crackers or coasters on the table to make a pattern with two lines of symmetry. Check by laying a pencil along each line.',
        },
      },
      'pattern-steps': {
        title: 'Grow and Shrink',
        icon: '🔺',
        summary: 'Grow or shrink a pattern by the same amount each step.',
        book: 'Textbook p.268 Worked example 1, p.269–270 Q1–Q4, p.274 Check your progress Q3 · Workbook p.244 Worked example 2, p.245 Q1–Q2, p.246 Q4–Q5',
        tips: {
          goal: 'Extend or shorten a pattern by adding or taking away the same amount each time, write the number sentences, and name that amount (the constant).',
          say: [
            'How many did we add last time? So how many do we add now?',
            'What stays the same every step? That is the constant.',
            'Count the objects in the picture in jumps to check.',
          ],
          watch: [
            'Adding 1, then 2, then 3 instead of the same number each time (3, 6, 10).',
            'Mixing up the constant (the jump) with the total (how many altogether).',
            'Counting everything from 1 each time instead of counting on from the last total.',
          ],
          offline: 'Lay out spoons or blocks in groups of 3 and build three steps (3, 6, 9). Then take a group away each step until none are left.',
        },
      },
      'likelihood-line': {
        title: 'How Likely?',
        icon: '📏',
        summary: 'Put things on a line from "will not happen" to "will happen".',
        book: 'Textbook p.275–276 Project 6',
        tips: {
          goal: 'Show how likely something is by where it goes on a line: impossible at the left end, certain at the right end, an even chance in the middle.',
          say: [
            'Is it sure to happen, impossible, or somewhere in between?',
            'Is it more likely or less likely than a coin landing on heads?',
            'Why did you put it there?',
          ],
          watch: [
            '"Might happen" events dragged right to an end.',
            'Reading the line backwards (putting "will happen" on the left).',
            'Thinking the middle means "probably will".',
          ],
          offline: 'Draw a long line on a strip of paper and write "will not happen" and "will happen" at the ends. Take turns placing event cards (weather, school, dinner) on it and talk about any you disagree on.',
        },
      },
    }
  );
})();

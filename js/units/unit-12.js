/* Unit 12: More fractions — sections, activity list and parent tips.
 * Page references are printed page numbers in Learner's Book 3 (Textbook) and Workbook 3.
 */
(function () {
  'use strict';
  window.MQ.addUnit(
    {
      id: 'u12',
      number: 12,
      title: 'More fractions',
      sections: [
        {
          id: '12.1',
          title: 'Fractions of numbers',
          color: '#ff9f1c',
          book: 'Textbook p.183–188 · Workbook p.165–169',
          activities: ['fraction-share-out', 'fraction-whole-finder'],
        },
        {
          id: '12.2',
          title: 'Ordering and comparing fractions',
          color: '#2ec4b6',
          book: 'Textbook p.188–192 · Workbook p.170–174',
          activities: ['fraction-line-up', 'equivalent-wall'],
        },
        {
          id: '12.3',
          title: 'Calculating with fractions',
          color: '#c77dff',
          book: 'Textbook p.192–199 · Workbook p.175–178',
          activities: ['fraction-strip-sums', 'sale-price-shop', 'dicey-tenths', 'fraction-of-measures'],
        },
      ],
    },
    {
      /* ---------------- 12.1 Fractions of numbers ---------------- */
      'fraction-share-out': {
        title: 'Share It Out',
        icon: '🍪',
        summary: 'Deal things into equal groups to find a fraction of a number.',
        book: 'Textbook p.184–187 Q3, Q5, Q7–10 · Workbook p.165 Q2, p.166 Q3–5, p.167 Q7, Q9, p.168 Q10, p.169 Q15',
        tips: {
          goal: 'Know that finding ⅓ of a number means sharing it into 3 equal groups, and that ¾ means taking 3 of 4 equal groups.',
          say: [
            'How many groups does the bottom number tell us to make?',
            'How many are in one group? That is one third.',
            'For ¾, how many groups do we take?',
          ],
          watch: [
            'Sharing by the top number instead of the bottom number (¾ of 20 shared into 3).',
            'Stopping at one group for ¾ of 20 (answering 5 instead of 15).',
            'Forcing an answer when it does not share equally (⅓ of 20 is not a whole number).',
          ],
          offline: 'Share 12 grapes between 3 bowls, one at a time. Then say together: "a third of 12 is 4". Try 2 bowls and 4 bowls too.',
        },
      },
      'fraction-whole-finder': {
        title: 'Find the Whole',
        icon: '🧩',
        summary: 'You know one part. Build the whole, and find where fractions go on a strip.',
        book: 'Textbook p.185–186 Q1, Q2, Q4, Q6 · Workbook p.165 Q1, p.166 Q6, p.167 Q8, p.168 Q11–12, p.169 Q13–14',
        tips: {
          goal: 'If you know one equal part, you can build the whole by repeating that part (⅓ is 4 cars, so the whole is 4 + 4 + 4 = 12).',
          say: [
            'How many parts like this make the whole?',
            'Add the same again, and again.',
            'Where would the first fold be on this strip?',
          ],
          watch: [
            'Answering with the part instead of the whole (saying 4 when ⅓ is 4).',
            'Counting the tick marks on a strip instead of the gaps between them.',
            'For "18 are left after ⅓ was eaten": treating 18 as one third. 18 is two of the three parts.',
          ],
          offline: 'Fold a paper strip into thirds, open it, and measure where the folds are with a ruler. Then try quarters.',
        },
      },

      /* ---------------- 12.2 Ordering and comparing fractions ---------------- */
      'fraction-line-up': {
        title: 'Fraction Line-Up',
        icon: '📏',
        summary: 'Put fractions in order and compare them with <, > and =.',
        book: 'Textbook p.188–190 Q1–6, p.197 Q1–2 · Workbook p.170 Q1–3, p.171 Q4, p.172 Q5–7, p.173 Q8–9, p.174 Q10–12',
        tips: {
          goal: 'Compare and order fractions using a fraction wall or a 0 to 1 number line, and record with <, > and =.',
          say: [
            'Which piece is longer?',
            'If a pizza is cut into more slices, are the slices bigger or smaller?',
            'Smallest first or largest first? Check the arrow.',
          ],
          watch: [
            'Thinking ⅒ is bigger than ½ because 10 is bigger than 2.',
            'Writing < and > the wrong way round. The open mouth faces the bigger amount.',
            'Thinking 2/4 and ½ cannot be equal because the numbers are different.',
          ],
          offline: 'Cut two same-size paper strips, one into 4 equal pieces and one into 5. Lay a quarter next to a fifth: which is longer?',
        },
      },
      'equivalent-wall': {
        title: 'Equivalent Fraction Wall',
        icon: '🧱',
        summary: 'Different fractions, same amount! Build chains like ½ = 2/4 = 3/6.',
        book: 'Textbook p.191–192 Q7–9 · Workbook p.173 Q9b, p.178 Q9c',
        tips: {
          goal: 'See that ½, 2/4 and 5/10 are the same amount, and that the tops and bottoms of a chain count up in times tables.',
          say: [
            'Do these pieces cover exactly the same length?',
            'What are the bottom numbers counting in?',
            'Lay the strips side by side: same length means same amount.',
          ],
          watch: [
            'Adding 1 to the top and bottom (½ = 2/3 = 3/4). Those are not equal.',
            'Changing only one number (½ = 1/4).',
            'Marking 2/4 as wrong when the answer was ½. Both are right.',
          ],
          offline: 'Fold a sheet of paper in half, then in half again, then again. Count how many quarters, then eighths, cover the half.',
        },
      },

      /* ---------------- 12.3 Calculating with fractions ---------------- */
      'fraction-strip-sums': {
        title: 'Fraction Strip Sums',
        icon: '➕',
        summary: 'More or less than a half? Add and take away fractions on a strip.',
        book: 'Textbook p.192–195 Q1–6, p.198 Q3 · Workbook p.175 Q1–3, p.176 Q5, p.177 Q6, p.178 Q9',
        tips: {
          goal: 'Add and subtract fractions with the same bottom number, staying within one whole, and estimate first (less than, equal to or more than ½).',
          say: [
            'What size are the pieces? Does that change when we add?',
            'Is it more than half the strip or less?',
            'How many tenths make a whole strip?',
          ],
          watch: [
            'Adding the bottom numbers too (4/10 + 3/10 = 7/20).',
            'Not seeing 1 as a full strip (5/5 or 10/10), so 1 − 3/10 looks impossible.',
            'Thinking that taking away 0 leaves 0 (3/3 − 0/3 is still 3/3).',
          ],
          offline: 'Use a chocolate bar or an egg box: take some pieces away and say the subtraction in fractions ("10 tenths take away 3 tenths leaves 7 tenths").',
        },
      },
      'sale-price-shop': {
        title: 'Sale Price Shop',
        icon: '🏷️',
        summary: 'Prices are cut by ¼ or ⅒. Split the coins into piles to find the new price.',
        book: 'Textbook p.195–196 Worked example 1, Q7 · Workbook p.177 Q7, p.178 Q10',
        tips: {
          goal: 'Know that "reduced by ¼" means find a quarter of the price and take it away from the price.',
          say: [
            'How many equal piles does ¼ need?',
            'Which pile do we take away?',
            'What do we pay now, and how much did we save?',
          ],
          watch: [
            'Giving the saving as the new price (¼ of $32 is $8, but you pay $24).',
            'Taking $4 off because the fraction has a 4 in it.',
            'Sharing into the wrong number of piles.',
          ],
          offline: 'Play shop with toy price tags and real coins. Have a pretend sale: share the coins into 4 equal piles and take one pile away.',
        },
      },
      'dicey-tenths': {
        title: 'Dicey Tenths',
        icon: '🎲',
        summary: 'A dice game: make a line of three tenths that adds up to one whole.',
        book: 'Textbook p.199 Project 4',
        tips: {
          goal: 'Add three tenths to make exactly one whole (10/10), and think ahead in a game.',
          say: [
            'How many more tenths does this line need to make 10?',
            'Check the columns and diagonals too, not just the rows.',
            'Does it matter who goes first?',
          ],
          watch: [
            'Adding the bottom numbers too (making 10/30).',
            'Only checking rows and missing columns and diagonals.',
            'A line that goes past one whole (11/10) does not win.',
          ],
          offline: 'Draw a 3 × 3 grid on paper with "/10" in every box and play the game with a real dice, taking turns.',
        },
      },
      'fraction-of-measures': {
        title: 'Measure Fractions',
        icon: '🥤',
        summary: 'Find fractions of a metre, an hour and a litre.',
        book: 'Workbook p.166 Q6, p.176 Q4, p.177 Q8, p.178 Q10',
        tips: {
          goal: 'Use 100 cm in a metre, 60 minutes in an hour and 1000 ml in a litre to find simple fractions of these measures.',
          say: [
            'How many centimetres in a metre? How many minutes in an hour?',
            'Share the 60 minutes into 3 equal parts.',
            'How many 100 ml cups fill the litre jug?',
          ],
          watch: [
            'Thinking an hour is 100 minutes, so ¼ hour is 25 minutes.',
            'Writing 600 ml instead of a fraction of a litre (6/10).',
            'Giving the amount used instead of the amount left.',
          ],
          offline: 'Pour 100 ml cups of water into a 1 litre jug and count the tenths. Look at a clock and find ½, ¼ and ⅓ of an hour.',
        },
      },
    }
  );
})();

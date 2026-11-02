/* Unit 16: Chance (plus Project 5 Venn variety) — sections, activity list and parent tips.
 * Page references are printed page numbers in Learner's Book 3 (Textbook) and Workbook 3.
 */
(function () {
  'use strict';
  window.MQ.addUnit(
    {
      id: 'u16',
      number: 16,
      title: 'Chance',
      sections: [
        {
          id: '16.1',
          title: 'Chance',
          color: '#ff9f1c',
          book: 'Textbook p.249–257 · Workbook p.229–236',
          activities: ['chance-word-sort', 'domino-card-draw', 'crocodile-coin-walk', 'spinner-lab', 'sweet-jar-chance'],
        },
        {
          id: 'P5',
          title: 'Project: Venn variety',
          color: '#2ec4b6',
          book: 'Textbook p.258–259',
          activities: ['venn-property-game'],
        },
      ],
    },
    {
      /* ---------------- 16.1 Chance ---------------- */
      'chance-word-sort': {
        title: 'Will It Happen?',
        icon: '🎲',
        summary: 'Sort everyday things into "will happen", "might happen" and "will not happen".',
        book: 'Textbook p.249 Q1–3, p.250, p.255 Check your progress Q1 · Workbook p.229, p.230 Q1–2, p.232 Q5, p.235 Q8',
        tips: {
          goal: 'Use the three chance phrases correctly (will happen, might happen, will not happen) and give a reason.',
          say: [
            'Could it ever happen? Then it cannot be "will not happen".',
            'Does it happen every single time, no matter what? Only then is it "will happen".',
            'Tell me why you put it there.',
          ],
          watch: [
            'Calling unusual things impossible (rain somewhere in the world today, a tree falling down). Unusual is still "might".',
            'Calling things that happen most days certain (eating lunch, reading a book). For these the reason matters more than the label.',
            '"May happen" in the workbook means the same as "might happen".',
          ],
          offline: 'At breakfast, each of you says one thing that will happen, one that might happen and one that will not happen today. Check at bedtime.',
        },
      },
      'domino-card-draw': {
        title: 'What Could I Pick?',
        icon: '🃏',
        summary: 'Look at the dominoes or cards, then decide: will it, might it, or won\'t it happen?',
        book: 'Textbook p.251 Worked example 1 and Q1, p.256 Check your progress Q2–3',
        tips: {
          goal: 'Decide if something is certain, possible or impossible by checking what is really in the bag or the row.',
          say: [
            'Is there at least one that works? Is there one that does not?',
            'What is the biggest total you could ever make?',
            'Count the spots on each half, then add. A blank half is 0.',
          ],
          watch: [
            'Saying "might" without checking that at least one domino or card actually works.',
            'Counting dominoes instead of spots, or forgetting a blank half is 0.',
            'Saying a total of 20 "might" happen with cards 1–7 (the biggest is 6 + 7 = 13).',
          ],
          offline: 'Put number cards 1–7 face down. Ask "Will two cards make 10? Make 20?" Then turn them over and look for pairs.',
        },
      },
      'crocodile-coin-walk': {
        title: 'Coin-Toss Walk',
        icon: '🪙',
        summary: 'Toss a coin to step along a garden path. Do you finish in the same place every time?',
        book: 'Textbook p.252 Q2 · Workbook p.231 Q3',
        tips: {
          goal: 'See that a chance game can end differently each time it is played, and follow simple move rules exactly.',
          say: [
            'Before we toss, where do you think we will finish?',
            'Did it match last time? Why could it be different?',
            'Could we finish on the same stone again? Is that sure?',
          ],
          watch: [
            'Being sure the result will repeat (or sure it must be different). The honest answer is "might".',
            'Moving more than one stone for a toss, or going the wrong way for heads or tails.',
            'On the grid game: forgetting to stay put at the edge.',
          ],
          offline: 'Draw 10 boxes on paper, put a coin in the middle and play the toss game twice with a real coin. Colour where each game ends.',
        },
      },
      'spinner-lab': {
        title: 'Spinner Lab',
        icon: '🎡',
        summary: 'Predict, spin and tally to see that bigger parts come up more often.',
        book: 'Textbook p.253–255 Q3 and Think like a mathematician · Workbook p.229, p.232 Q4, p.233–234 Q6, p.235–236 Q9',
        tips: {
          goal: 'Link the size of a spinner part to how often it comes up, and compare guesses with real results.',
          say: [
            'Which colour has the biggest slice? Count the equal parts.',
            '3 is 1 part out of 3 here, but 1 part out of 8 there. Which is the bigger piece?',
            'It did not match our guess exactly. That is OK: chance changes every time.',
          ],
          watch: [
            'Thinking the spinner with more numbers makes 3 more likely.',
            'Saying the biggest colour "will" happen. It only might (the workbook tests this).',
            'Estimates for 20 spins that do not add up to 20.',
          ],
          offline: 'Make a paper-clip spinner with one big part and two small parts. Spin 20 times and tally. Which part won?',
        },
      },
      'sweet-jar-chance': {
        title: 'Sweet Jar Questions',
        icon: '🍬',
        summary: 'Fill a jar with sweets, then answer and make up chance questions about picking one.',
        book: 'Textbook p.257 Check your progress Q4 · Workbook p.234 Q7',
        tips: {
          goal: 'Use what is in the jar to decide the chance, and make up chance questions of each kind.',
          say: [
            'Is there any of that colour in the jar?',
            'Are ALL the sweets that colour?',
            'Make me a question whose answer is "will not happen".',
          ],
          watch: [
            'Answering "might" when that colour is not in the jar at all.',
            'Answering "might" when every sweet is that colour (then it will happen).',
            'Finding it hard to invent questions. Model one first, then swap.',
          ],
          offline: 'Put 5 pieces of fruit or socks in a bag and take turns asking a chance question before pulling one out.',
        },
      },

      /* ---------------- Project 5: Venn variety ---------------- */
      'venn-property-game': {
        title: 'Venn Card Game',
        icon: '⭕',
        summary: 'Turn over two number rules and try to put a number in every part of the Venn diagram.',
        book: 'Textbook p.258–259 Project 5',
        tips: {
          goal: 'Sort numbers by two rules at once, and notice when one part of the Venn diagram has to stay empty.',
          say: [
            'Does this number fit the left label? The right label? Both?',
            'Can you find a number for every part?',
            'If you cannot, tell me why not. That still scores a point.',
          ],
          watch: [
            'Putting a number in the middle when it fits only one label.',
            'Guessing multiples. Let him skip-count on the number strip (3, 6, 9 …) instead of recalling.',
            'Thinking every pair of rules can fill all three parts (odd numbers and "one more than the 4 times table" cannot).',
          ],
          offline: 'Put two hoops or belts on the floor overlapping. Write numbers 1–20 on paper and sort them by "even" and "in the 5 times table".',
        },
      },
    }
  );
})();

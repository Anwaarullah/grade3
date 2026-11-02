/* Unit 13: Measure: mass, capacity and temperature — sections, activity list and parent tips.
 * Page references are printed page numbers in Learner's Book 3 (Textbook) and Workbook 3.
 */
(function () {
  'use strict';
  window.MQ.addUnit(
    {
      id: 'u13',
      number: 13,
      title: 'Measure: mass, capacity and temperature',
      sections: [
        {
          id: '13.1',
          title: 'Mass',
          color: '#ff9f1c',
          book: 'Textbook p.200–206 · Workbook p.179–185',
          activities: ['scale-reader', 'balance-puzzle', 'kilo-grid'],
        },
        {
          id: '13.2',
          title: 'Capacity',
          color: '#2ec4b6',
          book: 'Textbook p.207–213 · Workbook p.186–191',
          activities: ['jug-reader', 'same-amount'],
        },
        {
          id: '13.3',
          title: 'Temperature',
          color: '#c77dff',
          book: 'Textbook p.214–222 · Workbook p.192–201',
          activities: ['thermo-reader'],
        },
      ],
    },
    {
      /* ---------------- 13.1 Mass ---------------- */
      'scale-reader': {
        title: 'Kitchen Scales',
        icon: '⚖️',
        summary: 'Read scales in grams and kilograms, then compare two masses.',
        book: 'Textbook p.201 Worked example 1, p.203 Q3, p.220 Check your progress Q1 · Workbook p.179–180 Q1, p.180–181 Q2, p.182 Q4, p.183 Q5, p.185 Q8–9',
        tips: {
          goal: 'Read a dial scale by looking at what the labels count in, and know that 1 kg is the same as 1000 g.',
          say: [
            'What does this dial count in: 10s, 100s or 250s?',
            'Grams or kilograms? Which one is the big one?',
            'Let\'s make them both grams before we compare.',
          ],
          watch: [
            'Saying 500 g is heavier than 5 kg because 500 is a bigger number (the workbook has a child arguing exactly this).',
            'Guessing the reading without checking the labels, or forgetting to say the unit.',
            'Working out 1 kg − 350 g as "1 − 350". Change 1 kg into 1000 g first.',
          ],
          offline: 'Weigh a bag of pasta, an apple and a tin on your kitchen scales. Read the dial together, then check the mass printed on the packet.',
        },
      },
      'balance-puzzle': {
        title: 'Balance It!',
        icon: '🍐',
        summary: 'Use a pan balance to find the mass of one thing, and pick sensible masses.',
        book: 'Textbook p.202 Q1–2, p.204 Q4 · Workbook p.179 Worked example 1, p.182 Q3, p.183 Q6',
        tips: {
          goal: 'A level balance means both sides weigh the same. Use that to find a missing mass, and choose masses that make sense in real life.',
          say: [
            'It is level. What does that tell us?',
            'What happens if we take one muffin off each side?',
            'Half of 160 is 80. Now half again?',
          ],
          watch: [
            'Thinking the biggest object must be the heaviest.',
            'Halving only once when there are 4 items (160 → 80 is two pears, not one). Let him halve twice.',
            'Forgetting the known weight (the 100 g bar) when working out each side.',
          ],
          offline: 'Hold two things, one in each hand. Guess which is heavier, then check on the kitchen scales. Can you find two different things that weigh about the same?',
        },
      },
      'kilo-grid': {
        title: 'Make a Kilogram',
        icon: '🧱',
        summary: 'Drag weights into rows that each make exactly 1 kg.',
        book: 'Textbook p.206 Think like a mathematician',
        tips: {
          goal: 'Add hundreds and fifties to make exactly 1000 g, which is 1 kg.',
          say: [
            'Start with the heaviest tile. What does it need to make 1000?',
            'Is this row too heavy or too light? By how much?',
            'How did you find it? Tell me your steps.',
          ],
          watch: [
            'Forgetting that 1 kg = 1000 g.',
            'Mixing up 50 and 500, or adding 250 + 50 as 750.',
            'Trying tiles at random. Ask "how much more do we need?" each time.',
          ],
          offline: 'Use kitchen scales and three foods from the cupboard. Can you get as close to 1 kg as possible?',
        },
      },

      /* ---------------- 13.2 Capacity ---------------- */
      'jug-reader': {
        title: 'Fill the Jug',
        icon: '🥛',
        summary: 'Fill and read measuring jugs in millilitres and litres.',
        book: 'Textbook p.207–208 Worked example 2, p.208 Q1, p.209 Q2, p.211 Q4, p.221 Check your progress Q2 · Workbook p.186 Q1, p.187 Q2, p.188 Q4, p.189 Q5, p.191 Q8',
        tips: {
          goal: 'Read a measuring jug and know that 1 litre = 1000 ml, half a litre = 500 ml and a quarter of a litre = 250 ml.',
          say: [
            'What does each line on this jug count in?',
            'Is the water nearer this line or that line?',
            'How many 250s make a litre? Count with me: 250, 500, 750, 1000.',
          ],
          watch: [
            'Reading the label above the water instead of the nearest one.',
            'Thinking half a litre is less than 500 ml because the numbers look different.',
            'Counting 4 cans as 4 litres. Group the cans in fours: each group of 4 is one litre.',
          ],
          offline: 'With a kitchen measuring jug, pour 250 ml, 500 ml and 1 litre of water. Pour a 250 ml cup into a 1 litre bottle four times.',
        },
      },
      'same-amount': {
        title: 'Same Amount?',
        icon: '🫗',
        summary: 'Does higher water always mean more? Pour and find out, then solve a cup puzzle.',
        book: 'Textbook p.208 Q1c, p.210 Q3, p.212 Q6, p.213 Think like a mathematician · Workbook p.188 Q3, p.190 Q6, p.191 Q7',
        tips: {
          goal: 'You can only compare water levels in containers of the same shape. Pour into the same jug to make it fair, and find differences.',
          say: [
            'How could we make this test fair?',
            'What is in each cup right now?',
            'How much more do we need to reach the target?',
          ],
          watch: [
            'Always picking the taller glass as "more".',
            'Pouring at random in the cup puzzle without saying what is in each cup.',
            'Finding the new level instead of the difference (how much it went up).',
          ],
          offline: 'Pour the same cup of water into a tall glass and a wide bowl. Which looks like more? Then drop a pebble into a measuring jug and see how far the water rises.',
        },
      },

      /* ---------------- 13.3 Temperature ---------------- */
      'thermo-reader': {
        title: 'Thermometer Check',
        icon: '🌡️',
        summary: 'Read thermometers in °C and round to the nearest labelled number.',
        book: 'Textbook p.214–215 Worked example 3, p.215 Q1, p.216 Q2, p.217–218 Q3, p.222 Check your progress Q4 · Workbook p.192 Q1, p.193 Q2, p.194–195 Q3, p.196 Q4–5, p.197 Q6, p.200–201 Q9',
        tips: {
          goal: 'Read a thermometer in degrees Celsius, round to the nearest labelled number, and say which temperature is hotter and by how much.',
          say: [
            'What do the labels count in? What is each small line worth?',
            'Where does the red line stop?',
            'Is it nearer 10 or 20? Exactly halfway rounds up.',
          ],
          watch: [
            'Counting the first small line as 1 when the labels go up in 2s or 5s.',
            'Rounding to the nearest small line instead of the nearest labelled number.',
            'Not knowing that ice is 0 °C and boiling water is 100 °C (the workbook expects this, the textbook does not teach it).',
          ],
          offline: 'Read an outdoor thermometer or the weather app each day for a week. Which day was warmest? By how many degrees?',
        },
      },
    }
  );
})();

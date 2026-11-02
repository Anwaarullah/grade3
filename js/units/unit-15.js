/* Unit 15: Angles and movement — sections, activity list and parent tips.
 * Page references are printed page numbers in Learner's Book 3 (Textbook) and Workbook 3.
 */
(function () {
  'use strict';
  window.MQ.addUnit(
    {
      id: 'u15',
      number: 15,
      title: 'Angles and movement',
      sections: [
        {
          id: '15.1',
          title: 'Angles, direction, position and movement',
          color: '#ff9f1c',
          book: 'Textbook p.236–248 · Workbook p.218–228',
          activities: ['turn-spinner', 'right-angle-hunt', 'compass-garden', 'robot-route', 'hippo-routes'],
        },
      ],
    },
    {
      'turn-spinner': {
        title: 'Quarter and Half Turns',
        icon: '🔄',
        summary: 'Turn an arrow by quarter, half and full turns, both ways round.',
        book: 'Textbook p.236 Getting started, p.238, p.246 Q6 · Workbook p.225 Q7c',
        tips: {
          goal: 'Know clockwise and anticlockwise, and turn by quarter, half and full turns. A quarter turn is a right angle; a half turn is two right angles (a straight line).',
          say: [
            'Which way do clock hands go? That is clockwise.',
            'How many quarter turns make a half turn? And a full turn?',
            'Where will it point? Show me with your finger first.',
          ],
          watch: [
            'Mixing up clockwise and anticlockwise.',
            'Thinking a half turn clockwise ends somewhere different from a half turn anticlockwise (they end in the same place).',
            'Counting the starting position as one of the turns.',
          ],
          offline: 'Stand up facing a window. Take turns calling "quarter turn clockwise", "half turn" or "full turn", and say what you can see after each turn.',
        },
      },
      'right-angle-hunt': {
        title: 'Right Angle Hunt',
        icon: '📐',
        summary: 'Use a paper right-angle checker to sort angles and find right angles in shapes.',
        book: 'Textbook p.238, p.239 Q1, p.240 Q2, p.247 Check your progress Q1 · Workbook p.218–219, p.219 Q1, p.222 Q4, p.225 Q7',
        tips: {
          goal: 'Recognise a right angle (a square corner) even when it is tilted, and say whether other angles are greater or less than a right angle.',
          say: [
            'Does the checker fit exactly in the corner?',
            'Is there a gap, or is the corner too squashed for the checker?',
            'Turn the page round. Is it still a right angle?',
          ],
          watch: [
            'Thinking an angle with long lines is bigger. The size of an angle is the amount of turn, not the length of the lines.',
            'Not seeing a right angle when it is tilted (the workbook shows a square turned on its corner: it still has 4 right angles).',
            'Counting the inward corner of an L-shape as a right angle. It is bigger than a right angle; the L has 5 right angles, not 6.',
          ],
          offline: 'Fold a piece of paper in half and in half again to make a right-angle checker. Find four right angles, four bigger angles and four smaller angles around the house.',
        },
      },
      'compass-garden': {
        title: 'Compass Garden',
        icon: '🧭',
        summary: 'Learn north, south, east and west, and turn Bolt by right angles.',
        book: 'Textbook p.237, p.241 Q3, p.248 Check your progress Q2 · Workbook p.220 Q2, p.221 Q3, p.224 Q6, p.226 Q8, p.227–228 Q9',
        tips: {
          goal: 'Name the four compass directions, describe where things are using them, and use right-angle turns to change direction.',
          say: [
            'Going clockwise from north: Never Eat Shredded Wheat (N, E, S, W).',
            'If you turn one right angle clockwise from north, where do you face?',
            'Three right angles clockwise ends in the same place as one right angle anticlockwise.',
          ],
          watch: [
            'East and west swapped.',
            'Turning anticlockwise when asked for clockwise. Let him stand up and turn his body.',
            'Being thrown when the compass is turned so north is not at the top (the workbook does this). Go round clockwise N, E, S, W from the letter you know.',
          ],
          offline: 'Use a phone compass to find north at home. Stick N, E, S, W notes on the walls and play "face east, turn two right angles clockwise".',
        },
      },
      'robot-route': {
        title: "Bolt's Route",
        icon: '🤖',
        summary: 'Give Bolt step-by-step directions on a grid map.',
        book: 'Textbook p.242 Q4, p.245 Q5, p.248 Check your progress Q2 · Workbook p.220 Q2, p.223 Q5',
        tips: {
          goal: 'Give and follow clear directions on a grid using numbers of squares, with compass directions or forward, left and right.',
          say: [
            'Which way is Bolt facing now?',
            'Is that his left or your left?',
            'How many squares is that? Count the jumps, not the square you start on.',
          ],
          watch: [
            'Using his own left and right instead of Bolt\'s (when Bolt faces south, his right is west on the map).',
            'Counting the square he starts on as 1.',
            'Giving directions without numbers, or mixing turn words (left/right) with compass words (west/east).',
          ],
          offline: 'Draw a simple map of your street or home on squared paper. Take turns giving directions to a place ("2 squares north, then 3 east") and following them with a toy.',
        },
      },
      'hippo-routes': {
        title: 'Hippo to the River',
        icon: '🦛',
        summary: 'Find all the routes to the river, walking only east or south.',
        book: 'Textbook p.243–244 Think like a mathematician',
        tips: {
          goal: 'Follow movement rules and look for every possible route in an organised way, so none are missed or counted twice.',
          say: [
            'Which directions is the hippo allowed to walk?',
            'Have we found this route before?',
            'Can we find them in an order, so we do not miss any? Start with all the east steps first.',
          ],
          watch: [
            'Random clicking without checking for repeats.',
            'Routes that go back north or west.',
            'Getting tired on the 3 by 3 grid. 20 routes is a lot. The question asks him to find 6, then Bolt lists all 20 in order so he can count them.',
          ],
          offline: 'Draw a 2 by 2 block grid on paper. Walk a toy along every route from one corner to the opposite corner, colouring each route a different colour. There are 6.',
        },
      },
    }
  );
})();

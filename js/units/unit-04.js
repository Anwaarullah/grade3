/* Unit 4: 3D shapes — sections, activity list and parent tips.
 * Page references are printed page numbers in Learner's Book 3 (Textbook) and Workbook 3.
 * Unit 4 has one textbook section (4.1). Project 2 (Prism to pyramid) follows it and is
 * included in 4.1, which it extends.
 */
(function () {
  'use strict';
  window.MQ.addUnit(
    {
      id: 'u4',
      number: 4,
      title: '3D shapes',
      sections: [
        {
          id: '4.1',
          title: '3D shapes',
          color: '#ff9f1c',
          book: 'Textbook p.56–70 · Workbook p.51–59',
          activities: [
            'shape-sorter-3d',
            'prism-or-pyramid',
            'face-edge-vertex-count',
            'cube-builder',
            'straw-shape-builder',
            'mystery-shape-clues',
          ],
        },
      ],
    },
    {
      'shape-sorter-3d': {
        title: '3D Shape Sorter',
        icon: '🧊',
        summary: 'Sort everyday things by curved or flat faces, face shapes and corners.',
        book: 'Textbook p.56 Getting started, p.57, p.59 Q1, p.60 Q2 · Workbook p.55 Q4, p.59 Q9',
        tips: {
          goal: 'Sort 3D shapes by what they look like: curved or flat surfaces, the shape of their faces and how many corners (vertices) they have.',
          say: [
            'Would it roll? Then it has a curved surface.',
            'Touch each corner as you count so you do not count one twice.',
            'Does it fit both labels? Then it goes in the middle where the circles overlap.',
          ],
          watch: [
            'Thinking 5 corners counts as "more than five" (a square-based pyramid has exactly 5, so it does not).',
            'Leaving out a shape that fits neither label. It goes outside both circles.',
            'Calling a tin "straight" because its sides look straight from the front. Its edges are curved circles.',
          ],
          offline: 'Collect 6 things from the kitchen (tin, box, ball, cup, dice, cone-shaped snack) and sort them on the table into "rolls" and "does not roll". Then let him make up his own rule.',
        },
      },
      'prism-or-pyramid': {
        title: 'Prism or Pyramid?',
        icon: '🔺',
        summary: 'Two matching ends and flat faces? Prism. One point at the top? Pyramid.',
        book: 'Textbook p.58 Worked example 1, p.62–63 Q5, p.68 Check your progress · Workbook p.51, p.52 Q1, p.54 Q3, p.56 Q5',
        tips: {
          goal: 'Tell prisms from pyramids: a prism has two matching ends and only flat faces; a pyramid has one base and triangle faces meeting at one point (the apex).',
          say: [
            'Find the two ends. Are they the same shape and the same size?',
            'Are all the faces flat? A curved side means it is not a prism.',
            'Turn it round in your head. Which end could it stand on?',
          ],
          watch: [
            'Calling a tin (cylinder) a prism. It has matching ends but a curved side.',
            'Calling a cone a pyramid because it is pointed. Its base is a circle and its side is curved.',
            'Missing a prism that is lying on its side, and not counting a cube or cereal box as a prism.',
          ],
          offline: 'Look in the food cupboard for prisms: cereal box, a triangular chocolate box, a tea box. Stand each one on one end, then the other. Are the two ends the same?',
        },
      },
      'face-edge-vertex-count': {
        title: 'Faces, Edges, Corners',
        icon: '🎲',
        summary: 'Click every face, edge and corner on a shape you can turn, and count them.',
        book: 'Textbook p.61 Q3, p.62 Q4, p.63 Q6 · Workbook p.53 Q2, p.56–57 Q6, p.58 Q8',
        tips: {
          goal: 'Count the faces, edges and vertices (corners) of 3D shapes carefully, including the hidden ones at the back.',
          say: [
            'Edges are the lines where two faces meet. Vertices are the corners.',
            'Count the top ring, then the bottom ring, then the ones that join them.',
            'Turn it round. Are there faces hiding at the back or underneath?',
          ],
          watch: [
            'Mixing up edges and corners (a cube has 12 edges but 8 corners).',
            'Forgetting the bottom face or the hidden back edges.',
            'The books are not consistent about a tin: accept "2 flat faces and 1 curved surface" or "3 faces".',
          ],
          offline: 'Take a real box. Put a sticker or pen dot on each corner as you count, and a strip of tape along each edge. Count again: 8 corners, 12 edges.',
        },
      },
      'cube-builder': {
        title: 'Cube Builder',
        icon: '🟧',
        summary: 'Build blocks from cubes layer by layer, and find every block for a number.',
        book: 'Textbook p.65 Q8, p.66 Think like a mathematician · Workbook p.58 Q7, p.59 Q10',
        tips: {
          goal: 'Count the cubes in a cuboid by counting one layer and adding the layers (6 + 6 + 6), and find different cuboids that use the same number of cubes.',
          say: [
            'How many cubes in the bottom layer? How many layers?',
            'Count in layers: 6, 12, 18.',
            'Is this one really new, or the same one turned round?',
          ],
          watch: [
            'Counting only the cubes he can see and missing the hidden ones at the back.',
            'Counting every cube one by one and losing track. Count one layer, then add layers.',
            'Thinking a turned cuboid (2 by 6 standing up or lying down) is a new one.',
          ],
          offline: 'Build blocks from Lego bricks or sugar cubes. Count the bottom layer, then add a layer and count on. Try to find all the blocks you can make with 12.',
        },
      },
      'straw-shape-builder': {
        title: 'Straws and Clay',
        icon: '🥤',
        summary: 'Build skeleton prisms from straws and clay, then turn them into pyramids.',
        book: 'Textbook p.67 Q9, p.69–70 Project 2 Prism to pyramid',
        tips: {
          goal: 'See straws as edges and clay balls as vertices, and notice how the counts change when a prism becomes a pyramid with the same base.',
          say: [
            'Each straw is one edge. Each ball is one corner.',
            'What did we take away? What did we add at the top?',
            'The table goes 9, 12, 15... What comes next? Build it to check.',
          ],
          watch: [
            'Counting a ball twice where several straws meet.',
            'Forgetting the pyramid needs one ball at the top (the apex).',
            'Guessing the next number in the table instead of counting on in 3s or 2s.',
          ],
          offline: 'Make a triangular prism (9 sticks, 6 balls) from cocktail sticks and play dough. Take off the top triangle, keep one ball, and lean the sticks in to make a pyramid. Count again.',
        },
      },
      'mystery-shape-clues': {
        title: 'Mystery Shape',
        icon: '🕵️',
        summary: 'Bolt hides a shape and gives clues. Cross out shapes until one is left.',
        book: 'Textbook p.61 Q3, p.62 Q4, p.64 Q7, p.68 Check your progress · Workbook p.56–57 Q6',
        tips: {
          goal: 'Use shape properties as clues to find a 3D shape, and describe a shape without saying its name.',
          say: [
            'Which shapes can we cross out now?',
            'Read the clue again: is it about faces, edges or corners?',
            'Is it a prism, a pyramid or neither?',
          ],
          watch: [
            'Jumping to a guess after the first clue instead of crossing out.',
            'Mixing up faces and corners in the clues.',
            'Crossing out shapes that do fit the clue.',
          ],
          offline: 'Play "I am thinking of a shape" with real objects on the table: take turns giving one clue at a time until the other person can name it.',
        },
      },
    }
  );
})();

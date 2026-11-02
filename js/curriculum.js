/* Grade 3 Maths — curriculum registry.
 * Follows Cambridge Primary Mathematics Stage 3 (Learner's Book 3 and Workbook 3, 2nd edition).
 * Each unit lives in its own file, js/units/unit-NN.js, which calls MQ.addUnit(unit, activities):
 *   unit = { id: 'u6', number: 6, title: '...', sections: [ { id: '6.1', title, color, book, activities: [ids] } ] }
 *   activities = { '<id>': { title, icon, summary, book, tips: { goal, say: [], watch: [], offline } } }
 * All activity content is original.
 */
(function () {
  'use strict';
  var MQ = window.MQ;

  MQ.curriculum = {
    units: [],
    activities: {},
    /** Every unit in the book, so the home page can show units that are still being built. */
    titles: {
      1: 'Numbers to 1000',
      2: 'Tally charts and frequency tables',
      3: 'Addition, subtraction and money',
      4: '3D shapes',
      5: 'Multiplication and division',
      6: 'Measurement, area and perimeter',
      7: 'Fractions of shapes',
      8: 'Time',
      9: 'More addition and subtraction',
      10: 'Graphs',
      11: 'More multiplication and division',
      12: 'More fractions',
      13: 'Measure: mass, capacity and temperature',
      14: 'Time and timetables',
      15: 'Angles and movement',
      16: 'Chance',
      17: 'Pattern and symmetry',
    },
    /** Suggested section colours, in order, for unit files to use. */
    sectionColors: ['#ff9f1c', '#2ec4b6', '#c77dff', '#4d96ff', '#f15bb5'],
  };

  MQ.addUnit = function (unit, activities) {
    var c = MQ.curriculum;
    c.units = c.units
      .filter(function (u) {
        return u.number !== unit.number;
      })
      .concat([unit])
      .sort(function (a, b) {
        return a.number - b.number;
      });
    Object.keys(activities || {}).forEach(function (id) {
      c.activities[id] = activities[id];
    });
  };
})();

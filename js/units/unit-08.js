/* Unit 8: Time — sections, activity list and parent tips.
 * Page references are printed page numbers in Learner's Book 3 (Textbook) and Workbook 3.
 */
(function () {
  'use strict';
  window.MQ.addUnit(
    {
      id: 'u8',
      number: 8,
      title: 'Time',
      sections: [
        {
          id: '8.1',
          title: 'Time',
          color: '#ff9f1c',
          book: 'Textbook p.125–132 · Workbook p.104–108',
          activities: ['hour-hand-hint', 'five-minute-ring', 'past-or-to', 'clock-twins', 'set-the-clock'],
        },
      ],
    },
    {
      /* ---------------- 8.1 Time ---------------- */
      'hour-hand-hint': {
        title: 'Hour Hand Hints',
        icon: '🕰️',
        summary: 'Use the short hand alone to guess the time, then put in the missing long hand.',
        book: 'Textbook p.126 Worked example 1, p.127 Q1 · Workbook p.105 Q3, p.106 Q4',
        tips: {
          goal: 'Know that the short hand on its own shows roughly how far through the hour it is.',
          say: [
            'Is the short hand right on a number, or between two numbers?',
            'Halfway between two numbers means half past.',
            'It is nearly at the next number, so it is nearly o\'clock. At 6:54 the short hand is almost on 7.',
          ],
          watch: [
            'Putting the long hand on the same number the short hand points at.',
            'Naming the hour the short hand is about to reach, instead of the one it has passed.',
            'Mixing up quarter past (long hand on 3) and quarter to (long hand on 9).',
          ],
          offline: 'Cover the long hand of a real clock with a sticky note. He guesses the time from the short hand, then peels the note off to check.',
        },
      },
      'five-minute-ring': {
        title: 'Five-Minute Ring',
        icon: '⏱️',
        summary: 'Read a clock to the exact minute: count in fives, then in ones.',
        book: 'Textbook p.125 Getting started, p.129 Q5, p.130 Check your progress Q1 · Workbook p.105 Q3',
        tips: {
          goal: 'Read any analogue clock to the exact minute.',
          say: [
            'Count the big numbers in fives first, then the little marks in ones.',
            'Which number has the short hand already gone past?',
            'Long hand for minutes, short hand for hours.',
          ],
          watch: [
            'Saying "4 minutes" when the long hand is on the 4 (it is 20 minutes).',
            'Giving the next hour when the short hand is close to it (7:50 read as 8:50).',
            'Swapping the hands when they are close to a straight line, like 3:50.',
          ],
          offline: 'Each time you pass a clock at home today, ask him for the time to the exact minute, then check it together on a phone.',
        },
      },
      'past-or-to': {
        title: 'Past or To?',
        icon: '↩️',
        summary: 'Change digital times into "past" and "to" words, and words back into digital times.',
        book: 'Textbook p.127 Q2, p.131 Check your progress Q2–Q3 · Workbook p.104 Q1, p.105 Q2, p.107 Q7–Q8',
        tips: {
          goal: 'Switch between digital times and spoken "past" and "to" times, both ways.',
          say: [
            'Is it before or after half past?',
            'How many more minutes to get to 60? Count on from the minutes.',
            'If it is "to 3", which hour is it really?',
          ],
          watch: [
            '01:52 read as "52 to 2" or "8 to 1".',
            '"24 minutes to 3" written as 03:24 or 03:36 (it is 02:36).',
            'Thinking "34 minutes past 2" is wrong. The workbook uses it, and it is the same as 26 minutes to 3.',
          ],
          offline: 'Read out the oven or microwave clock together and ask him to say it as "past" or "to".',
        },
      },
      'clock-twins': {
        title: 'Clock Twins',
        icon: '🔗',
        summary: 'Match clocks with hands, digital clocks and words that show the same time.',
        book: 'Textbook p.128 Q3, p.130–131 Check your progress · Workbook p.105 Q3, p.107 Q8',
        tips: {
          goal: 'See that a clock with hands and a digital clock can show exactly the same time.',
          say: [
            'Find the hour first, then check the minutes.',
            'These are all in the 4 o\'clock hour. What is different?',
            'Say the digital time out loud. Does the clock say that too?',
          ],
          watch: [
            'Pairing clocks only by the hour.',
            'Guessing when two long hands are close together, like 4:45 and 4:48.',
            'Matching a "to" time to the wrong hour (quarter to 5 is 4:45).',
          ],
          offline: 'Set a toy clock (or draw one) and let him write the digital time underneath. Then swap: he sets it and you write.',
        },
      },
      'set-the-clock': {
        title: 'Set the Clock',
        icon: '⏰',
        summary: 'Drag the hands to show a time, find times in a time window, and move one hour on.',
        book: 'Textbook p.128 Q4, p.132 Check your progress Q4 · Workbook p.106 Q4–Q6, p.107–108 Q9, p.108 Q10',
        tips: {
          goal: 'Show any time on a clock with hands, and reason about times before, after and between.',
          say: [
            'Put the long hand in first, then check where the short hand should be.',
            'One hour later: what changes and what stays the same?',
            'Is 8:45 after 8 o\'clock? Is it before 10 o\'clock?',
          ],
          watch: [
            'The short hand pointing exactly at the number for times like 8:45 (it should be nearly at 9).',
            'Adding 1 to the minutes instead of the hour for "1 hour later".',
            'Counting 10:12 as between 8 and 10 o\'clock because the short hand is near 10.',
          ],
          offline: 'Set his real getting-up time and bedtime on a paper clock and talk about morning and evening. Then list 3 favourite times of day; he draws each on a paper clock and writes the digital time beside it.',
        },
      },
    }
  );
})();

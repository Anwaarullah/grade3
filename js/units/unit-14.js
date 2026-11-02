/* Unit 14: Time and timetables — sections, activity list and parent tips.
 * Page references are printed page numbers in Learner's Book 3 (Textbook) and Workbook 3.
 * The unit opener (Getting started, Textbook p.223–224) is revised by Clock to the Minute,
 * which starts section 14.1.
 */
(function () {
  'use strict';
  window.MQ.addUnit(
    {
      id: 'u14',
      number: 14,
      title: 'Time and timetables',
      sections: [
        {
          id: '14.1',
          title: 'Time',
          color: '#ff9f1c',
          book: 'Textbook p.223–230 · Workbook p.202–209',
          activities: ['clock-to-the-minute', 'minute-challenge', 'calendar-hops', 'birthdays-and-years'],
        },
        {
          id: '14.2',
          title: 'Timetables',
          color: '#2ec4b6',
          book: 'Textbook p.230–235 · Workbook p.209–217',
          activities: ['my-day-timetable', 'bus-stop-timetable'],
        },
      ],
    },
    {
      /* ---------------- 14.1 Time ---------------- */
      'clock-to-the-minute': {
        title: 'Clock to the Minute',
        icon: '⏰',
        summary: 'Read and set a clock to the exact minute, and match it to a digital time.',
        book: 'Textbook p.223–224 Getting started Q1–3 · Workbook p.210 Q1, p.215 Q7 (spoken times)',
        tips: {
          goal: 'Read and set an analogue clock to the exact minute and write the time in digital form (h:mm).',
          say: [
            'Count the big numbers in 5s, then the little marks in 1s.',
            'Which number has the short hand just gone past? That is the hour.',
            'Is it nearly the next hour? Then the short hand is nearly on the next number.',
          ],
          watch: [
            'Reading the number the minute hand points to as the minutes (on the 3 read as 3 minutes, not 15).',
            'Using the next hour too early: 1:34 read as 2:34 because the short hand is past halfway.',
            'Mixing up the hour hand and the minute hand.',
          ],
          offline: 'Ask "what time is it?" from a wall clock at random moments in the day. Also say a time like "twenty-five to seven" and let him write it as 6:35. (7.10 and 7:10 mean the same time.)',
        },
      },
      'minute-challenge': {
        title: 'One-Minute Challenge',
        icon: '⏱️',
        summary: 'How much can you do in one minute? Pick the right unit of time.',
        book: 'Textbook p.225 Q1, p.229–230 Q7 and Think like a mathematician · Workbook p.202 Q1–2, p.204 Q4, p.206–207 Q7',
        tips: {
          goal: 'Get a feel for how long a minute is and choose sensible units of time (minutes, hours, days, weeks, months, years).',
          say: [
            'Would that take minutes or hours?',
            'Let us guess first, then time it.',
            'Two minutes is one minute and another minute: add it again.',
          ],
          watch: [
            'Choosing a unit that is far too big or too small (days to brush teeth).',
            'Counting 6 nights for a week when adding up hours of sleep (8 + 8 + ... needs 7 eights = 56).',
            'If the list has no seconds (a handshake), choose the smallest unit on the list.',
          ],
          offline: 'Time one minute on a phone while he claps, then while he stamps. Guess first each time. Then guess how many star jumps in 2 minutes.',
        },
      },
      'calendar-hops': {
        title: 'Calendar Hops',
        icon: '📅',
        summary: 'Hop days and weeks on a calendar, and count the days between two dates.',
        book: 'Textbook p.226–228 Q2–5, p.234 Check your progress Q1 · Workbook p.203–204 Q3, p.206 Q6, p.207–209 Q8–9',
        tips: {
          goal: 'Count on and back in days and weeks on a calendar, across the end of a month, and find the days between two dates.',
          say: [
            'One row down is one week: 7 days.',
            'Finger on the start day. The first hop lands on day 1.',
            'What is the last day of this month: 28, 30 or 31?',
          ],
          watch: [
            'Being one day out by counting the start day as day 1.',
            '"Between" leaves out both end dates (22 Jan to 18 Feb is 26 days between).',
            'Hopping 3 days when the question said 3 weeks.',
          ],
          offline: 'On the family calendar, count the days until the next birthday or holiday. Hop a week by moving straight down one row.',
        },
      },
      'birthdays-and-years': {
        title: 'Birthdays and Years',
        icon: '🎂',
        summary: 'Hop along a line of years to find ages, birth years and waiting times.',
        book: 'Textbook p.226–228 Q3c–d, Q4b, Q6 · Workbook p.205 Q5',
        tips: {
          goal: 'Count forwards and back in years to find ages, birth years and how long to wait for an age.',
          say: [
            'Each birthday adds one year.',
            'Jump 10 years first, then the rest.',
            'Who has to wait longer? Both of them have to be old enough.',
          ],
          watch: [
            'Adding when he should subtract (born = 2023 + 13).',
            'Crossing 2000: 1996 to 2000 is 4, then 2000 to 2007 is 7, so 11 years.',
            'Answering for only one child when both must reach the age.',
          ],
          offline: 'Work out the birth year of each person in the family from their age. Then ask: how old will you be in 2030?',
        },
      },

      /* ---------------- 14.2 Timetables ---------------- */
      'my-day-timetable': {
        title: 'My Day Timetable',
        icon: '🗓️',
        summary: 'Read a school or holiday-camp timetable and plan your own day.',
        book: 'Textbook p.230–231 Worked example 1, p.233, p.234 Check your progress Q2 · Workbook p.209–210 Q1, p.212 Q3, p.217 Q9',
        tips: {
          goal: 'Find start and end times in a daily timetable, read a weekly grid, and spot what is happening at a given time.',
          say: [
            'Find the lesson first, then read the time beside it.',
            'Is the question asking for a day or a time?',
            'Is 12:30 after the start and before the end?',
          ],
          watch: [
            'Giving the end time when the start was asked (or the other way round).',
            'Answering with a time when the question asks "which day?".',
            'Choosing two clubs whose times overlap.',
          ],
          offline: 'Make a timetable for a weekend day together, with start and end times, and stick it on the fridge. Ask him what is happening at 11:00.',
        },
      },
      'bus-stop-timetable': {
        title: 'Bus Stop Timetable',
        icon: '🚌',
        summary: 'Follow a bus down the timetable to find when it arrives and which bus to catch.',
        book: 'Textbook p.230–232 Q1–2, p.235 Check your progress Q3 · Workbook p.211 Q2, p.213–216 Q4–8',
        tips: {
          goal: 'Read a bus or train timetable by following one vehicle along its column (or row) and use it to plan a journey.',
          say: [
            'Put your finger on your bus, then slide down to your stop.',
            'What does the dash mean? The bus does not stop there.',
            'Before 8:30 means 8:29 or earlier. The best bus lets you leave as late as possible and still be on time.',
          ],
          watch: [
            'Reading across a row (all the buses at one stop) when he needs one bus down its column.',
            'Choosing the next bus when it has a dash at his stop.',
            'Thinking the first bus to leave arrives first, or that 1:05 is earlier than 12:05.',
          ],
          offline: 'Look up a real local bus or train timetable together and plan a pretend trip: which one gets you there before lunch?',
        },
      },
    }
  );
})();

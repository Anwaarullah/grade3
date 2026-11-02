# Unit 14 Time (2) and timetables - syllabus notes (paraphrased; do not copy book text)

Source: Learner's Book 3, printed pages 223-235 (scan images 225-237).

**Page offset note:** the offset is **+2, not +4** (image 225 = printed 223, image 237 = printed 235). Image 224 is printed 222 (end of Unit 13) and image 238 is printed 236 (start of Unit 15). Printed page numbers were checked in the corners.

**Learner flag:** this unit is mostly counting on and back (days on a calendar, minutes on a timetable) rather than x and /. The few multiplicative items are flagged: weeks to days (x 7), "steps in 10 / 30 / 60 minutes" (x 10, x 30, x 60), and multi-month day counts.

## Unit opener (p.223-224)

```json
{
 "section": "Unit 14 opener: Getting started + unit introduction",
 "book_pages": "223 (title and Getting started Q1-2) and 224 (Getting started Q3, introduction text and street picture with a bakery and a bus stop)",
 "objectives": [
  "[Inferred, Getting started] Check readiness: read analogue clocks to the minute, write the time in digital form, and draw hands for a given digital time",
  "[Unit intro, p.224] Time is measured in everyday situations: running a race, meeting friends, catching a bus or train, baking a cake"
 ],
 "vocabulary": ["analogue clock", "digital clock", "hour hand", "minute hand", "minutes past"],
 "key_facts": [
  "Getting started Q1 clocks (best reading from the scan, derived): a about 8:05 (minute hand on 1, hour hand just past 8); b about 11:17 (minute hand a little past 3, hour hand just past 11); c about 2:35 (minute hand at or just before 7, hour hand about halfway between 2 and 3); d about 1:34 (minute hand just before 7, hour hand past halfway between 1 and 2). The c and d minute hands are within about one minute of 7 - see scan notes",
  "Q2: write the same four times on digital clocks in h:mm form",
  "Q3: draw hands for 5:55, 1:34, 6:17 and 9:12 (minute-level accuracy; the hour hand must be nearly at the next hour for 5:55)"
 ],
 "question_types": [
  {"type": "Read analogue clocks to the minute", "description": "Write the time shown on four clock faces", "number_ranges": "times with minutes 05, ~17, ~34-35", "difficulty": "core", "book_page": "223"},
  {"type": "Write the time digitally", "description": "Copy the four times into h:mm digital displays", "number_ranges": "as Q1", "difficulty": "core", "book_page": "223"},
  {"type": "Draw hands for a digital time", "description": "Draw hour and minute hands on blank faces", "number_ranges": "5:55, 1:34, 6:17, 9:12", "difficulty": "core/stretch", "book_page": "224"}
 ],
 "worked_examples": [],
 "misconceptions": [
  "Reading the minute hand as the number it points to (minute hand on 1 read as 1 minute, not 5 minutes)",
  "Reading the hour hand as the next hour when it is past halfway (2:35 read as 3:35)",
  "Drawing the hour hand exactly on the hour for 5:55 (should be almost at 6)",
  "Mixing up the hour and minute hands when they are similar lengths"
 ],
 "prerequisites": [
  "Reading o'clock, half past, quarter past/to and 5-minute intervals (Unit 8) - counting in 5s (**5x table dependence**)",
  "Digital time notation h:mm (Unit 8)",
  "60 minutes in an hour"
 ],
 "interactive_ideas": [
  "Clock matcher: drag the minute hand round; a digital display updates as it moves and the hour hand creeps forward; then set a clock to a given digital time"
 ]
}
```

## 14.1 Time (p.225-230)

```json
{
 "section": "14.1 Time",
 "book_pages": "225 (title, 'We are going to', intro, key words, Exercise 14.1 Q1) to top half of 230 (reflection and Look what I can do). 14.2 starts lower on p.230",
 "objectives": [
  "[Book objective] Choose units of time for activities",
  "[Book objective] Learn about (work out) time intervals",
  "[Inferred from Q1 and TLAM] Estimate how much can be done in one minute and check with a timer",
  "[Inferred from Q2-6] Use a calendar to count days and weeks between dates, forwards and backwards, and solve age problems in years"
 ],
 "vocabulary": [
  "Official key words (p.225 box): time, time interval",
  "minutes, hours, days, weeks, months, years",
  "calendar, date, between (Tip: do not count the two end dates)",
  "before, after, check out, nights"
 ],
 "key_facts": [
  "Time is measured in minutes, hours, days, weeks, months and years (p.225)",
  "Tip (p.226, repeated p.227): when asked how many days are between two dates, do not count the two dates themselves",
  "Q2 calendars (Jan, Feb with 28 days, Mar; 1 January is a Friday, 1 February and 1 March are Mondays). Expected answers (derived): a between 22 Jan and 18 Feb = 26 days; b three weeks after 1 March = 22 March; c six weeks before 17 March = 3 February; d a 3-week holiday leaving 19 January returns 9 February",
  "Q3 (no calendar, derived): a 14 days before 20 June = 6 June; b arrive 8 July, stay 3 nights, check out 11 July; c 11 Sept vs 18 Sept birthdays (same age) = 7 days older; d 13 on 7 Oct 2023 means born 2010, aged 20 on 7 Oct 2030",
  "Q4a (derived): days between 3 June 2022 and 25 November 2022 = 27 + 31 + 31 + 30 + 31 + 24 = 174, using printed calendars June-November 2022 (1 June is a Wednesday)",
  "Q4b (derived): born 10 Jan 2003, on the 2018 birthday he is 15",
  "Q4c (derived, ambiguous): Lily 9-21 May (13 days counting both ends, 12 days/nights between); Song 2 weeks = 14 days. Song's holiday is longer, by 1 day if Lily's is counted inclusively (2 if not)",
  "Q5 April calendar (1 April is a Tuesday). Expected answers (derived): a pack on Mon 7 April, travel 3 days later (Thu 10 April), stay 9 days, home Saturday 19 April; b due Wed 16 April, delayed a week to Wed 23 April, stays 5 days, goes home Monday 28 April",
  "Q6 (derived): ages 8 and 9, ride from age 10 - they can ride together in 2 years",
  "Q7: give two examples of things measured in years, months, days, hours, minutes",
  "Think like a mathematician (p.229): count steps walked in one minute with a timer, predict 2 minutes (about double), then 10 minutes, 30 minutes and an hour (x 10, x 30, x 60 - **multiplication**), and discuss whether you would slow down over an hour (p.230)",
  "Exercise 14.1 Q1 is lettered a, b, c, e, f, g (there is no d in the print)"
 ],
 "question_types": [
  {"type": "One-minute estimates", "description": "Estimate how many times you can walk round the room or stand up and sit down in a minute; how long you can balance on one leg, then try it", "number_ranges": "counts in one minute; seconds/minutes for balancing", "difficulty": "core", "book_page": "225"},
  {"type": "Match activities to hour/day/week", "description": "Name things that take about an hour, last about a day, and last a week", "number_ranges": "none", "difficulty": "core", "book_page": "225"},
  {"type": "Calendar intervals (with calendar)", "description": "Days between two dates, the date 3 weeks after, 6 weeks before, and a 3-week trip end date", "number_ranges": "Jan-Mar; up to 42 days; crossing month ends (31-day Jan, 28-day Feb)", "difficulty": "core/stretch", "book_page": "226"},
  {"type": "Date problems without a calendar", "description": "Days before a flight, hotel check-out date after N nights, difference between two birthdays, birth year and future age", "number_ranges": "14 days, 3 nights, 7 days, years 2010-2030", "difficulty": "core/stretch", "book_page": "226-227"},
  {"type": "Long interval with six calendars", "description": "Count the days between two dates five months apart", "number_ranges": "June-November; 174 days", "difficulty": "challenge", "book_page": "227"},
  {"type": "Age and holiday comparisons", "description": "Age on a birthday in a later year; compare two holiday lengths", "number_ranges": "2003-2018; 9-21 May vs 2 weeks", "difficulty": "core/stretch", "book_page": "228"},
  {"type": "Multi-step calendar stories", "description": "Count on in days and weeks through a short story to find the day and date of returning home", "number_ranges": "April; steps of 3, 5, 7, 9 days", "difficulty": "stretch", "book_page": "228"},
  {"type": "Waiting for an age", "description": "Two children's ages and an age limit - how many years until both qualify", "number_ranges": "ages 8, 9; limit 10", "difficulty": "core", "book_page": "228"},
  {"type": "Choose units of time", "description": "Give two examples for each unit from years down to minutes", "number_ranges": "none", "difficulty": "core", "book_page": "229"},
  {"type": "Steps-per-minute investigation", "description": "Walk for a minute counting steps, then predict steps for 2, 10, 30 and 60 minutes", "number_ranges": "steps per minute (roughly 60-120) scaled up", "difficulty": "challenge", "book_page": "229-230"}
 ],
 "worked_examples": [
  "No worked example in 14.1. The Tip box (p.226 and p.227) explains that 'between' excludes the two given dates",
  "Reflection (p.227): what would have helped you work out the answers; (p.230) would the walk slow down if it lasted an hour"
 ],
 "misconceptions": [
  "Counting the start and end dates when asked 'between' (27 or 28 instead of 26)",
  "Forgetting February has 28 days, or that some months have 30 or 31 days",
  "Three weeks after 1 March given as 21 March (counting 21 days including the start) or 4 March (adding 3 days)",
  "Counting back from 17 March and forgetting to jump over the month boundary",
  "Hotel nights: checking out on 10 July (counting days not nights) or 12 July",
  "Birth year = 2023 + 13, or age 2030 - 2023 = 7 instead of 13 + 7 = 20",
  "Holiday length: subtracting dates (21 - 9 = 12) vs counting days inclusively (13)",
  "Q6: answering 1 year (only for Gina) or 3 years (adding 1 + 2)",
  "Thinking steps in an hour is exactly 60 x steps in a minute without considering tiredness (the book invites this discussion)"
 ],
 "prerequisites": [
  "Days of the week, months of the year, days in each month (Unit 8)",
  "7 days in a week, 14 days in a fortnight, 52 weeks in a year - **multiplication dependence (x 7)** for weeks to days",
  "Counting on and back across a boundary (end of month) - like crossing a ten (Unit 9)",
  "Subtracting 4-digit years (2023 - 13) - **place value dependence**",
  "Adding several 2-digit numbers for long intervals (27 + 31 + 31 + ...)"
 ],
 "interactive_ideas": [
  "Calendar hopper: a month calendar where clicking a start date then 'jump a week' moves a counter down one row; a day count runs beside it; month pages flip when the counter passes the last day",
  "Between-counter: shade the days between two dates (start and end shown in outline only) and count the shaded squares",
  "Hotel nights: a bed icon appears on each night; the check-out date is the morning after the last bed",
  "Age ladder: a timeline of years with a child figure that steps forward one birthday at a time",
  "One-minute challenge: an on-screen 60-second timer with a clicker to count claps or stand-ups; then predict 2 minutes"
 ]
}
```

## 14.2 Timetables (p.230-235)

```json
{
 "section": "14.2 Timetables (and unit Check your progress)",
 "book_pages": "230 (lower half: title, 'We are going to', intro, key word, Worked example 1 question) to 235 (Check your progress Q3 and a train photo). Worked example 1 answer and Exercise 14.2 on p.231. Look what I can do on p.233; Check your progress p.234-235",
 "objectives": [
  "[Book objective] Read and use the information in timetables",
  "[Inferred from WE1 and TLAM] Read start and finish times on a school timetable and make your own timetable",
  "[Inferred from Q1-2 and CYP Q3] Read bus and train timetables across rows and down columns, understand '-' (does not stop) and pick a bus/train to arrive by a given time",
  "[Inferred from CYP Q1] Count months, days and weeks between dates"
 ],
 "vocabulary": [
  "Official key word (p.230 box): timetable",
  "leave / depart, arrive, bus stop, station, destination",
  "start, end/finish, a.m., p.m., morning, afternoon",
  "earliest, next, does not stop ('-')"
 ],
 "key_facts": [
  "Timetables help plan journeys, holidays and meetings by bus, train or plane; they show when a vehicle leaves and arrives, and also what happens during a school day (p.230)",
  "Worked example 1 (p.230-231): a one-row school timetable - Maths 9-10 a.m., Science 10-10.45 a.m., Art 11-11.30 a.m., Music 12-12.30 p.m., Games 1-2.15 p.m., Literacy 2.30-3.15 p.m. Art starts at 11 in the morning; Music ends at 12.30 in the afternoon. Teaching point: find the lesson in the table; it gives the start and end times",
  "Q1 bus timetable: stops Orange Street, Baker Avenue, School, Genesta Road, Altash Way down the side; Bus 1-4 across. Bus 1: 7:40, 7:54, 8:22, 8:46, 9:02. Bus 2: 7:55, 8:09, 8:19, 8:43, 8:50. Bus 3: 8:15, 8:32, 8:45, 8:59, -. Bus 4: 8:30, -, -, 9:10, -",
  "Q1 expected answers (derived): a Bus 2 reaches Altash Way at 8:50; b the 8:15 from Orange Street (Bus 3) reaches school at 8:45; c from Baker Avenue to be at school by 8:30: Bus 1 (8:22) or Bus 2 (8:19); d yes - the timetable only shows buses going away from home in the morning, so it doesn't help for the journey home",
  "Note: Bus 2 leaves after Bus 1 but reaches school earlier (8:19 vs 8:22) - an oddity worth noticing",
  "Q2 train timetable: Brightville, Blue City, Central Town, Downton down the side; Trains 1-6 across. Train 1: 8:01, 8:23, 8:31, 8:37. Train 2: 9:26, 9:38, -, -. Train 3: 10:43, 10:58, (blank), 11.23. Train 4: 11.17, 11:25, 11:38, 11:51. Train 5: 1:18, 1:30, -, 1:58. Train 6: 2:36, 2:46, 2:58, -",
  "Q2 expected answers (derived): a 10:43 from Brightville arrives Downton 11:23; b 2:46 from Blue City reaches Central Town 2:58; c Trains 2 and 6 do not stop at Downton; d to reach Central Town at 11:38 leave Blue City at 11:25; e to reach Central Town at 8:31 leave Brightville at 8:01",
  "Think like a mathematician (p.233): draw your own day's timetable (6 columns) with lesson start and end times, ask a partner questions, then draw your 'perfect' timetable",
  "Check your progress Q1 (Jan-Mar 2026 calendars, derived): a 2 months between 25 Jan and 25 Mar; b 30 days between 25 Jan and 25 Feb (not counting the two dates; 31 if the end date is counted); c 2 weeks between 11 and 25 Feb",
  "Check your progress Q2 holiday camp timetable (times 10:00-2:00 down the side, Monday-Friday across). Expected answers (derived): a late lunch (1:00) on Wednesday; b singing on Thursday; c singing starts at 1:00; d no tennis on Tuesday (Games instead), so no racquet needed",
  "Check your progress Q3 train timetable: Blueberry Hill, Sunny Meadow, Redwood Place; First train 7:30, 7:47, 8:00; Second 8:05, -, 8:40; Third 8:25, 8:42, 8:59; Fourth 9:20, 9:39, 10:00. Expected answers (derived): a earliest from Blueberry Hill to Sunny Meadow leaves 7:30; b after missing the 7:47 from Sunny Meadow, the next is 8:42; c the second train does not stop at Sunny Meadow"
 ],
 "question_types": [
  {"type": "Read a school timetable", "description": "Find when a lesson starts or ends", "number_ranges": "9 a.m.-3.15 p.m.; lesson lengths 30-75 min", "difficulty": "core", "book_page": "230-231"},
  {"type": "Bus timetable look-ups", "description": "Find an arrival time; follow a bus down its column; choose buses that arrive before a deadline; judge if a timetable is useful for a return trip", "number_ranges": "7:40-9:10, 5 stops x 4 buses, '-' for no stop", "difficulty": "core/stretch", "book_page": "231"},
  {"type": "Train timetable look-ups", "description": "Arrival from a given departure; which trains skip a stop; which departure reaches a station at a given time", "number_ranges": "8:01-2:58, 4 stations x 6 trains", "difficulty": "core/stretch", "book_page": "232"},
  {"type": "Make your own timetable", "description": "Write today's lessons with start and end times, quiz a partner, design a 'perfect' timetable", "number_ranges": "school day times", "difficulty": "challenge", "book_page": "233"},
  {"type": "Check your progress: months, days, weeks between dates", "description": "Use three 2026 calendars to count an interval in months, days and weeks", "number_ranges": "Jan-Mar 2026", "difficulty": "core/stretch", "book_page": "234"},
  {"type": "Check your progress: weekly activity timetable", "description": "Read a Monday-Friday grid of activities by hour", "number_ranges": "10:00-2:00", "difficulty": "core", "book_page": "234"},
  {"type": "Check your progress: train choices", "description": "Earliest train, next train after missing one, and the train that skips a station", "number_ranges": "7:30-10:00", "difficulty": "core", "book_page": "235"}
 ],
 "worked_examples": [
  "Worked example 1 (p.230-231): school timetable. Teaching point: locate the lesson, then read its start and finish times; morning times are a.m. and afternoon times p.m."
 ],
 "misconceptions": [
  "Reading across a row (all buses at one stop) when the question needs a column (one bus at all stops), or vice versa",
  "Thinking '-' means the bus is late or the time is zero",
  "Choosing Bus 3 for school by 8:30 because it leaves Baker Avenue at 8:32 'near' 8:30, or excluding Bus 1 because it leaves first but arrives later than Bus 2",
  "Treating 1:18 as earlier than 11:17 (no a.m./p.m. labels on the train timetable)",
  "Mixed time punctuation (11.17 and 11:25 in the same table) causing confusion",
  "Train 3 has a blank (not '-') at Central Town - the child may not know whether it stops",
  "'Next train' after 7:47 answered as 8:05 (the second train, which doesn't stop at Sunny Meadow)",
  "CYP Q2: 'late lunch' answered as a time rather than a day",
  "The question spells the station 'Brightsville' while the table says 'Brightville' (book inconsistency)"
 ],
 "prerequisites": [
  "Reading digital times h:mm and comparing times (earlier/later) (Unit 8)",
  "a.m. and p.m. (Unit 8)",
  "Reading a two-way table (rows and columns) (Units 2 and 10)",
  "Counting on in minutes to find a duration (optional extension - the book does not ask for journey lengths)",
  "Calendar skills from 14.1"
 ],
 "interactive_ideas": [
  "Timetable tracer: click a bus number and its column lights up stop by stop while a small bus moves along a drawn street; click a stop to light its row",
  "Beat the bell: pick a bus from your stop that reaches school before a clock shows 8:30; the bus animates and arrives early or late",
  "Skip-stop spotter: trains run past stations with '-'; the child clicks the trains that don't stop at a chosen station",
  "Build-a-day: drag lesson cards onto a blank timetable and set start/end times with clock spinners"
 ]
}
```

## Ambiguities and scan notes

- Page offset is +2 for this unit (not +4).
- p.223 Getting started clocks: a (8:05) and b (about 11:17) are clear; c and d have the minute hand within about a minute of the 7, so c reads 2:34-2:35 and d reads 1:34-1:35. Activities should use original clocks anyway.
- p.225 Exercise 14.1 Q1 skips the letter d (a, b, c, e, f, g).
- p.228 Q4c 'whose holiday is longer and by how many days' depends on whether Lily's 9-21 May is counted inclusively (13 days) - the Tip about 'between' does not apply because the question is about holiday length.
- p.232 train timetable mixes '.' and ':' in times (11.17, 11.23), leaves Train 3's Central Town cell blank instead of '-', and has no a.m./p.m. Q2e spells the station 'Brightsville'.
- p.231 Bus 2 overtakes Bus 1 (arrives at school 8:19 vs 8:22).
- p.234 CYP Q1b: 25 Jan to 25 Feb is 30 days 'between' by the book's Tip, 31 days as a difference.

## Proposed activities

### 1. `clock-to-the-minute` - Clock to the Minute ⏰
- **section:** Unit 14 opener (revision for 14.1-14.2)
- **summary:** Read and set analogue clocks to the nearest minute and match them to digital times.
- **book:** Textbook p.223-224 (Getting started Q1-3)
- **Learn screens:**
  1. A kitchen clock. The child drags the minute hand round from 12; the minutes count in 5s on the numbers (5, 10, 15 ...) and in 1s on the small marks between, while a digital display updates.
  2. Hour hand creep: as the minute hand goes round, the hour hand slides from 2 towards 3. Bolt points out that at 2:35 it is past halfway but it is still "2-something".
  3. Set a time: Bolt shows 6:17 on a digital clock; the child drags hands to match (snaps to minutes).
- **Practice (count 9):**
  - Level 1: read clocks at 5-minute times (e.g. 8:05, 3:25); choose from 3 digital options.
  - Level 2: read clocks at any minute (e.g. 11:17, 1:34) and type h:mm.
  - Level 3: set hands for a given digital time (book: 5:55, 1:34, 6:17, 9:12) including near-the-hour times.
- **Mistake tags:** Read the minute number as the minutes (1 = 1 min); Used the next hour too early; Hands swapped; Counted 1s instead of 5s on the numbers.
- **Parent tips:**
  - Goal: Read and set a clock to the exact minute and write the time in digital form.
  - Say: "Count the big numbers in 5s, then the little marks in 1s." / "Which hour has the short hand just passed?" / "Is it nearly the next hour?"
  - Watch for: 1:34 read as 2:34; the minute hand on 3 read as 3 minutes.
  - Away from screen: ask the time from a wall clock at random moments during the day.


### 2. `minute-challenge` - One-Minute Challenge ⏱️
- **section:** 14.1
- **summary:** Choose the right unit of time for activities and estimate what you can do in one minute.
- **book:** Textbook p.225 (Ex 14.1 Q1), p.229-230 (Q7 and Think like a mathematician)
- **Learn screens:**
  1. Unit sorter: picture cards (brushing teeth, a school term, a birthday party, a night's sleep, a summer holiday, growing up) are dragged into minutes / hours / days / weeks / months / years boxes.
  2. One minute: the child guesses how many times they can click a button (or clap with the parent counting) in 60 seconds, then a timer runs and the real count shows next to the guess.
  3. Scaling up: Bolt shows steps in 1 minute as one bar; 2 minutes is two bars (repeated addition), 10 minutes is ten bars.
- **Practice (count 8):**
  - Level 1: choose the best unit for an activity from 3 options.
  - Level 2: choose the more sensible duration (e.g. a film: 2 minutes or 2 hours?).
  - Level 3: "I take 50 steps in a minute - about how many in 2 minutes? in 10 minutes?" using bars of 50 (repeated addition, x 2 and x 10 only).
- **Mistake tags:** Picked a unit that is far too big or too small; Added instead of doubling; Thought time units are all the same size.
- **Parent tips:**
  - Goal: Pick sensible units of time and get a feel for how long a minute is.
  - Say: "Would that take minutes or hours?" / "Let's guess first, then time it." / "Two minutes is one minute and another minute."
  - Watch for: choosing days for very short tasks; random guesses with no sense of a minute.
  - Away from screen: time a minute while doing a task (tidying toys, star jumps) and count how many.

### 3. `calendar-hops` - Calendar Hops 📅
- **section:** 14.1
- **summary:** Count days and weeks forwards and backwards on a calendar, including "between" two dates.
- **book:** Textbook p.226-228 (Ex 14.1 Q2-5), Check your progress Q1 p.234
- **Learn screens:**
  1. A month calendar (original dates). A counter sits on the 4th; the child clicks "one week later" and it drops one row to the 11th. Bolt: a week is one row down - 7 days.
  2. Crossing a month: from 25 January the counter hops a week and the page flips to February; the child sees January has 31 days.
  3. Between: two dates are outlined; the child clicks every day in between (the outlined ones don't count) and the count appears (Tip from the book).
  4. Nights: a hotel story - a bed on each night from the 8th; check-out is the morning after the last bed.
- **Practice (count 10):**
  - Level 1: one month on screen; date N days or 1-2 weeks after/before a date (no month crossing).
  - Level 2: two or three months on screen (31- and 28-day months); 3 weeks after, 6 weeks before, days between (book: 22 Jan-18 Feb = 26; 6 weeks before 17 March = 3 Feb).
  - Level 3: multi-step stories (pack, travel in 3 days, stay 9 days -> what day and date home?; delayed by a week then stay 5 days); or months/weeks/days between two dates.
- **Mistake tags:** Counted the start or end date for 'between'; Forgot the month length; Added days instead of weeks; Checked out a day late or early.
- **Parent tips:**
  - Goal: Use a calendar to count on and back in days and weeks and to find the number of days between two dates.
  - Say: "One row down is one week - 7 days." / "Do we count the first day? The question says between." / "What's the last day of this month?"
  - Watch for: being one day out (counting the start); jumping 3 days when it said 3 weeks.
  - Away from screen: on the family calendar, count the days until the next birthday or holiday.


### 4. `birthdays-and-years` - Birthdays and Years 🎂
- **section:** 14.1
- **summary:** Work out ages, birth years and waiting times on a timeline of years.
- **book:** Textbook p.226-228 (Ex 14.1 Q3c-d, Q4b, Q6)
- **Learn screens:**
  1. A timeline of years 2010-2030. A child figure is placed at their birth year; each click moves to the next birthday, and the age badge goes up by 1.
  2. Counting back: "13 in 2023" - the child drags the figure back 13 jumps (10 then 3) to find 2010.
  3. Waiting together: two children aged 8 and 9 and a ride sign "10 and over"; the child steps both forward a year at a time until both badges show 10 or more.
- **Practice (count 8):**
  - Level 1: age next year / in 2 years; how many years until age 10.
  - Level 2: age in a given later year (book: born 2003, age in 2018 = 15); birth year from an age (13 in 2023 -> 2010); days apart for two birthdays in the same month (11th and 18th).
  - Level 3: two-step: "13 in 2023, how old in 2030?"; two children waiting for an age limit; who is older and by how many days.
- **Mistake tags:** Added instead of subtracting years; Off by one year; Answered for only one child.
- **Parent tips:**
  - Goal: Count forwards and back in years to find ages and birth years.
  - Say: "Each birthday adds one year." / "Jump 10 years first, then the rest." / "Who has to wait longer?"
  - Watch for: 2023 - 13 errors across the thousands; answering 1 year when both children must wait.
  - Away from screen: work out the birth years of family members from their ages.


### 5. `my-day-timetable` - My Day Timetable 🗓️
- **section:** 14.2
- **summary:** Read a school or holiday-camp timetable and build your own day with start and end times.
- **book:** Textbook p.230-231 (Worked example 1), p.233 (Think like a mathematician), Check your progress Q2 p.234
- **Learn screens:**
  1. A one-row school timetable (original lessons and times). The child clicks a lesson; Bolt reads "starts at ..., ends at ..."; a pair of clocks shows the two times.
  2. A week grid (days across, hours down) for a holiday camp. Click a day to light its column, click a time to light its row, and their meeting cell shows the activity.
  3. Build your day: drag lesson cards (Maths, Reading, Art, Lunch, Games, Music) into six slots and set start/end times with clock spinners.
- **Practice (count 8):**
  - Level 1: "When does Art start?" / "When does Music end?" from a one-row timetable (times on the hour, half and quarter hours).
  - Level 2: week grid questions: "Which day has a late lunch?", "What day is singing?", "What time does singing start?".
  - Level 3: "Which day do you not need a tennis racquet?" (find the day without tennis); "How long is Games?" (count on from start to end, 15-75 minutes).
- **Mistake tags:** Gave the end time for the start; Gave a time when a day was asked; Read the wrong row; Mixed up a.m. and p.m.
- **Parent tips:**
  - Goal: Find information in a daily or weekly timetable and make one for his own day.
  - Say: "Find the lesson first, then read across to the time." / "Is the question asking for a day or a time?" / "What would your perfect day look like?"
  - Watch for: answering with a time when asked "which day"; reading the end time as the start.
  - Away from screen: make a timetable for a weekend day together and stick it on the fridge.


### 6. `bus-stop-timetable` - Bus Stop Timetable 🚌
- **section:** 14.2
- **summary:** Read bus and train timetables to find arrival times, skipped stops and the right bus to arrive on time.
- **book:** Textbook p.230-232 (Worked example 1, Ex 14.2 Q1-2), Check your progress Q3 p.235
- **Learn screens:**
  1. A street map with 4 stops and a small timetable (original times). The child clicks "Bus 2"; its column lights up and a bus icon moves stop to stop as each time highlights.
  2. Rows and columns: clicking a stop name lights its row - every bus that calls there. Bolt explains '-' means the bus does not stop.
  3. Beat the bell: a clock shows "be at school by 8:30". The child tries a bus; it animates and arrives with a green tick (early) or red cross (late).
- **Practice (count 10):**
  - Level 1: "What time does Bus N arrive at Stop X?" with a 3-stop x 3-bus table.
  - Level 2: "I get the 8:15 from Orange Street - when do I reach school?"; "Which trains do not stop at Downton?" (click all); "Earliest train from A?" with 4-5 stops x 4-6 vehicles (times 7:30-10:00 and early afternoon).
  - Level 3: "Which buses get me to school by 8:30?" (select all that work); "I missed the 7:47 - when is the next train that stops here?" (skip-stop trap); "Which train leaves Blue City to reach Central Town at 11:38?".
- **Mistake tags:** Read across a row instead of down a column; Treated '-' as a time; Picked a bus that skips the stop; Thought the first bus to leave arrives first.
- **Parent tips:**
  - Goal: Read a timetable by following one bus or train down its column and use it to plan a journey.
  - Say: "Put your finger on your bus, then slide down to your stop." / "What does the dash mean?" / "Will it get there before the bell?"
  - Watch for: mixing rows and columns; choosing the earliest departure without checking the arrival.
  - Away from screen: look up a real local bus or train timetable together and plan a pretend trip.


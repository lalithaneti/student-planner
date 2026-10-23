// Planner logic with no screen or storage code, so it can be tested on its own.
// Dates are stored as "YYYY-MM-DD" strings (a "date key") and times as "HH:MM",
// which avoids time-zone surprises and sorts correctly as plain text.

const PlannerModel = (() => {
  const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function pad(number) {
    return String(number).padStart(2, '0');
  }

  function toDateKey(date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  function parseDateKey(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  function addDays(dateKey, days) {
    const date = parseDateKey(dateKey);
    date.setDate(date.getDate() + days);
    return toDateKey(date);
  }

  // Whole days from one date key to another (negative if "to" is earlier).
  function daysBetween(from, to) {
    return Math.round((parseDateKey(to) - parseDateKey(from)) / (24 * 60 * 60 * 1000));
  }

  function isValidDateKey(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && toDateKey(parseDateKey(value)) === value;
  }

  function isValidTime(value) {
    return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
  }

  function isValidLink(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
      return false;
    }
  }

  // ---------- Colors ----------

  // Classes (and their assignments) use pastels; RSOs and events use earthy, muted colors,
  // so school and RSOs are easy to tell apart.
  const CLASS_COLORS = [
    { name: 'Rose', value: '#f4a6a6' },
    { name: 'Peach', value: '#f8c4a0' },
    { name: 'Butter', value: '#f3dd8c' },
    { name: 'Mint', value: '#a8dfbf' },
    { name: 'Aqua', value: '#9fdcd6' },
    { name: 'Baby blue', value: '#a9c6f5' },
    { name: 'Lavender', value: '#c9b3ec' },
    { name: 'Blush', value: '#f2b3d6' },
  ];
  const RSO_COLORS = [
    { name: 'Terracotta', value: '#b5654a' },
    { name: 'Clay', value: '#c08a5b' },
    { name: 'Mustard', value: '#b8962e' },
    { name: 'Olive', value: '#7d8445' },
    { name: 'Sage', value: '#8a9f7e' },
    { name: 'Slate', value: '#5f7891' },
    { name: 'Plum', value: '#7d5a73' },
    { name: 'Dusty rose', value: '#b07f86' },
  ];
  // The bold colors used before 2026-10-22, in the same order as the lists above.
  const OLD_BOLD_COLORS = ['#e5484d', '#f76b15', '#c99a06', '#30a46c', '#12a594', '#3e63dd', '#8e4ec6', '#d6409f'];

  // Switches anything saved with an old bold color to its match in the new palettes.
  function updateOldColors(state) {
    const swap = (item, palette) => {
      const index = OLD_BOLD_COLORS.indexOf(item.color);
      if (index !== -1) {
        item.color = palette[index].value;
      }
    };
    state.classes.forEach((plannerClass) => swap(plannerClass, CLASS_COLORS));
    (state.rsos || []).forEach((rso) => swap(rso, RSO_COLORS));
    (state.events || []).forEach((standalone) => swap(standalone, RSO_COLORS));
    return state;
  }

  // A sensible starting semester based on today's date; the user can edit it.
  function defaultSemester(today) {
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    if (month >= 8) {
      return { name: `Fall ${year}`, startDate: `${year}-08-24`, endDate: `${year}-12-18` };
    }
    if (month <= 5) {
      return { name: `Spring ${year}`, startDate: `${year}-01-20`, endDate: `${year}-05-15` };
    }
    return { name: `Summer ${year}`, startDate: `${year}-06-01`, endDate: `${year}-08-01` };
  }

  // Every date an assignment is due, skipping dates the user removed.
  function occurrenceDates(assignment) {
    if (assignment.kind === 'once') {
      return [assignment.dueDate];
    }
    const skipped = new Set(assignment.skippedDates);
    const dates = [];
    for (let date = assignment.startDate; date <= assignment.endDate; date = addDays(date, 1)) {
      if (assignment.days.includes(parseDateKey(date).getDay()) && !skipped.has(date)) {
        dates.push(date);
      }
    }
    return dates;
  }

  // ---------- Breaks ----------

  const BREAK_THEMES = ['fall', 'winter', 'spring', 'summer', 'party'];

  // Data saved before breaks existed has no breaks list.
  function breaksOf(state) {
    return (state.breaks || []).filter((schoolBreak) => schoolBreak.semesterId === state.currentSemesterId);
  }

  function breakOn(state, date) {
    return breaksOf(state).find((schoolBreak) => schoolBreak.startDate <= date && date <= schoolBreak.endDate) || null;
  }

  // Breaks that cover any of the given dates, in date order.
  function breaksDuring(state, dates) {
    return breaksOf(state)
      .filter((schoolBreak) => dates.some((date) => schoolBreak.startDate <= date && date <= schoolBreak.endDate))
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  // The break happening now ({ ongoing: true, daysLeft }), or else the next one coming up
  // ({ ongoing: false, daysUntil }), however far away. null if there are none left.
  function upcomingBreak(state, todayKey) {
    const schoolBreak = breaksOf(state)
      .filter((candidate) => candidate.endDate >= todayKey)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
    if (!schoolBreak) {
      return null;
    }
    return schoolBreak.startDate <= todayKey
      ? { schoolBreak, ongoing: true, daysLeft: daysBetween(todayKey, schoolBreak.endDate) }
      : { schoolBreak, ongoing: false, daysUntil: daysBetween(todayKey, schoolBreak.startDate) };
  }

  // A starting theme from the month a break begins: Sep–Nov fall, Dec–Feb winter,
  // Mar–May spring, Jun–Aug summer. (Party is only picked by hand.)
  function guessBreakTheme(startDate) {
    const month = parseDateKey(startDate).getMonth() + 1;
    if (month >= 9 && month <= 11) {
      return 'fall';
    }
    if (month === 12 || month <= 2) {
      return 'winter';
    }
    return month <= 5 ? 'spring' : 'summer';
  }

  function validateBreak(schoolBreak) {
    const errors = [];
    if (!schoolBreak.name.trim()) {
      errors.push('Give the break a name, like Thanksgiving break.');
    }
    if (!isValidDateKey(schoolBreak.startDate) || !isValidDateKey(schoolBreak.endDate)) {
      errors.push('Pick the first and last day of the break.');
    } else if (schoolBreak.endDate < schoolBreak.startDate) {
      errors.push('The last day must be on or after the first day.');
    }
    if (!BREAK_THEMES.includes(schoolBreak.theme)) {
      errors.push('Pick a theme.');
    }
    return errors;
  }

  function isOccurrenceDone(assignment, date) {
    return assignment.kind === 'once' ? assignment.done : assignment.doneDates.includes(date);
  }

  // One entry per due date for the current semester, sorted soonest first.
  function buildDueList(state) {
    const classesById = new Map(state.classes.map((plannerClass) => [plannerClass.id, plannerClass]));
    const items = [];
    for (const assignment of state.assignments) {
      if (assignment.semesterId !== state.currentSemesterId) {
        continue;
      }
      for (const date of occurrenceDates(assignment)) {
        // Repeating assignments take break days off; one-time ones were entered on purpose.
        if (assignment.kind === 'weekly' && breakOn(state, date)) {
          continue;
        }
        items.push({
          assignment,
          plannerClass: classesById.get(assignment.classId) || null,
          date,
          time: assignment.dueTime,
          done: isOccurrenceDone(assignment, date),
        });
      }
    }
    items.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || a.assignment.title.localeCompare(b.assignment.title));
    return items;
  }

  // Assignments made before the "late work allowed" setting existed count as allowing it.
  function allowsLateWork(assignment) {
    return assignment.lateAllowed !== false;
  }

  // Where an item stands right now: 'done', 'upcoming', 'overdue' (past due, late work
  // allowed), or 'missed' (past due, no late work). nowTime is "HH:MM".
  function itemStatus(item, todayKey, nowTime) {
    if (item.done) {
      return 'done';
    }
    const isPastDue = item.date < todayKey || (item.date === todayKey && item.time < nowTime);
    if (!isPastDue) {
      return 'upcoming';
    }
    return allowsLateWork(item.assignment) ? 'overdue' : 'missed';
  }

  // Splits the due list into the sections shown on screen. Missed items stay on their
  // day if that's today; earlier missed items go in their own section.
  function groupDueList(items, todayKey, nowTime = '00:00') {
    const weekEnd = addDays(todayKey, 7);
    const groups = { overdue: [], today: [], thisWeek: [], later: [], missed: [], done: [] };
    for (const item of items) {
      const status = itemStatus(item, todayKey, nowTime);
      if (status === 'done') {
        groups.done.push(item);
      } else if (status === 'overdue') {
        groups.overdue.push(item);
      } else if (status === 'missed' && item.date < todayKey) {
        groups.missed.push(item);
      } else if (item.date === todayKey) {
        groups.today.push(item);
      } else if (item.date <= weekEnd) {
        groups.thisWeek.push(item);
      } else {
        groups.later.push(item);
      }
    }
    // Most recent first, so these lists stay useful as they grow.
    groups.done.reverse();
    groups.missed.reverse();
    return groups;
  }

  // Bundles a sorted list into one entry per day: [{ date, items }].
  function groupByDay(items) {
    const days = [];
    for (const item of items) {
      const lastDay = days[days.length - 1];
      if (lastDay && lastDay.date === item.date) {
        lastDay.items.push(item);
      } else {
        days.push({ date: item.date, items: [item] });
      }
    }
    return days;
  }

  // The Monday of the week containing dateKey.
  function startOfWeek(dateKey) {
    const weekday = parseDateKey(dateKey).getDay();
    return addDays(dateKey, -((weekday + 6) % 7));
  }

  // Planner columns for one week: Mon–Fri, then Saturday and Sunday together.
  // When viewing the current week, overdue items from earlier weeks go in overdue
  // (missed ones don't, since they can't be turned in). progress counts the week's items.
  function buildWeek(items, weekStart, todayKey, nowTime = '00:00') {
    const columns = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((label, index) => ({
      label,
      dates: [addDays(weekStart, index)],
      items: [],
    }));
    columns.push({ label: 'Weekend', dates: [addDays(weekStart, 5), addDays(weekStart, 6)], items: [] });
    const weekEnd = addDays(weekStart, 6);
    const isCurrentWeek = todayKey >= weekStart && todayKey <= weekEnd;
    const overdue = [];
    for (const item of items) {
      if (item.date >= weekStart && item.date <= weekEnd) {
        columns.find((column) => column.dates.includes(item.date)).items.push(item);
      } else if (isCurrentWeek && item.date < weekStart && itemStatus(item, todayKey, nowTime) === 'overdue') {
        overdue.push(item);
      }
    }
    const weekItems = columns.flatMap((column) => column.items);
    const progress = { done: weekItems.filter((item) => item.done).length, total: weekItems.length };
    return { overdue, columns, progress };
  }

  // Pulls one date out of a repeating assignment into its own one-time assignment,
  // keeping whether it was done. This is how "edit only this date" works.
  function detachOccurrence(series, date, newAssignmentId) {
    const wasDone = series.doneDates.includes(date);
    series.skippedDates.push(date);
    series.doneDates = series.doneDates.filter((doneDate) => doneDate !== date);
    return {
      id: newAssignmentId,
      semesterId: series.semesterId,
      classId: series.classId,
      title: series.title,
      link: series.link,
      kind: 'once',
      dueDate: date,
      dueTime: series.dueTime,
      lateAllowed: allowsLateWork(series),
      done: wasDone,
    };
  }

  // A repeating assignment made from the class form. It runs from today to the end of
  // the semester; fields are the form's title, days, dueTime, link, and lateAllowed.
  function newRecurringAssignment(fields, { id, semesterId, classId, todayKey, semesterEndDate }) {
    return {
      id,
      semesterId,
      classId,
      kind: 'weekly',
      title: fields.title,
      days: fields.days,
      dueTime: fields.dueTime,
      link: fields.link,
      lateAllowed: fields.lateAllowed,
      startDate: todayKey,
      endDate: semesterEndDate,
      skippedDates: [],
      doneDates: [],
    };
  }

  // ---------- Calendar ----------

  // The hours the calendar shows unless a class starts earlier or ends later.
  const DEFAULT_CALENDAR_HOURS = { start: 8, end: 18 };

  function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Whether a weekly meeting happens on a date's weekday. An every-other-week meeting
  // (every: 2) also needs the date to be its first meeting or an even number of weeks after.
  function meetsOn(meeting, date) {
    if (!meeting.days.includes(parseDateKey(date).getDay())) {
      return false;
    }
    if (meeting.every !== 2) {
      return true;
    }
    const daysApart = daysBetween(startOfWeek(meeting.firstDate), startOfWeek(date));
    return date >= meeting.firstDate && (daysApart / 7) % 2 === 0;
  }

  // Returns a list of problems with a meeting time; empty means it is valid.
  function validateMeeting(meeting) {
    const errors = [];
    if (meeting.days.length === 0) {
      errors.push('Pick at least one day.');
    }
    if (meeting.every === 2 && !isValidDateKey(meeting.firstDate)) {
      errors.push('Pick the date of the first meeting.');
    } else if (meeting.every === 2 && !meeting.days.includes(parseDateKey(meeting.firstDate).getDay())) {
      errors.push(`The first meeting is on a ${WEEKDAY_NAMES[parseDateKey(meeting.firstDate).getDay()]}, so pick that day too.`);
    }
    if (!isValidTime(meeting.startTime) || !isValidTime(meeting.endTime)) {
      errors.push('Pick a start and end time.');
    } else if (meeting.endTime <= meeting.startTime) {
      errors.push('The end time must be after the start time.');
    }
    return errors;
  }

  // Places one day's blocks so overlapping ones sit side by side. Each block gets a
  // lane (0, 1, ...) and laneCount, the number of lanes in its group of overlapping blocks.
  function assignLanes(blocks) {
    blocks.sort((a, b) => a.startTime.localeCompare(b.startTime) || a.endTime.localeCompare(b.endTime));
    let group = [];
    let laneEnds = [];
    let groupEnd = '';
    const closeGroup = () => {
      for (const block of group) {
        block.laneCount = laneEnds.length;
      }
    };
    for (const block of blocks) {
      if (group.length > 0 && block.startTime >= groupEnd) {
        closeGroup();
        group = [];
        laneEnds = [];
      }
      let lane = laneEnds.findIndex((end) => end <= block.startTime);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(block.endTime);
      } else {
        laneEnds[lane] = block.endTime;
      }
      block.lane = lane;
      groupEnd = group.length === 0 || block.endTime > groupEnd ? block.endTime : groupEnd;
      group.push(block);
    }
    closeGroup();
    return blocks;
  }

  function isMeetingCancelled(meeting, date) {
    return (meeting.cancelledDates || []).includes(date);
  }

  // Every class meeting on one date (only inside the current semester and not on a break),
  // including cancelled ones, which are marked so the calendar can show them faded.
  function classMeetingsOn(state, date) {
    const semester = state.semesters.find((candidate) => candidate.id === state.currentSemesterId);
    if (date < semester.startDate || date > semester.endDate || breakOn(state, date)) {
      return [];
    }
    const weekday = parseDateKey(date).getDay();
    const meetings = [];
    for (const plannerClass of state.classes) {
      if (plannerClass.semesterId !== state.currentSemesterId) {
        continue;
      }
      for (const meeting of plannerClass.meetings || []) {
        if (meeting.days.includes(weekday)) {
          meetings.push({
            plannerClass,
            meeting,
            date,
            startTime: meeting.startTime,
            endTime: meeting.endTime,
            cancelled: isMeetingCancelled(meeting, date),
          });
        }
      }
    }
    return meetings.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  // Data saved before exams existed has no exams list.
  function examsOf(state) {
    return (state.exams || []).filter((exam) => exam.semesterId === state.currentSemesterId);
  }

  // Returns a list of problems with an exam; empty means it is valid.
  function validateExam(exam) {
    const errors = [];
    if (!exam.title.trim()) {
      errors.push('Give the exam a name, like Midterm 1.');
    }
    if (!exam.classId) {
      errors.push('Pick the class this exam is for.');
    }
    if (!isValidDateKey(exam.date)) {
      errors.push('Pick the exam date.');
    } else if ([0, 6].includes(parseDateKey(exam.date).getDay())) {
      errors.push('The calendar shows Monday to Friday, so pick a weekday.');
    }
    if (!isValidTime(exam.startTime) || !isValidTime(exam.endTime)) {
      errors.push('Pick a start and end time.');
    } else if (exam.endTime <= exam.startTime) {
      errors.push('The end time must be after the start time.');
    }
    return errors;
  }

  // ---------- RSOs ----------

  // The last day of the school year (fall + spring). Semesters saved before this setting
  // existed use May 15 after a fall semester, or the semester's own end otherwise.
  function schoolYearEnd(semester) {
    if (semester.schoolYearEndDate) {
      return semester.schoolYearEndDate;
    }
    const startYear = Number(semester.startDate.slice(0, 4));
    return semester.startDate.slice(5, 7) >= '08' ? `${startYear + 1}-05-15` : semester.endDate;
  }

  // The dates an RSO meets: from the start of the semester it was added in to the end of
  // that semester, or to the end of the school year if it lasts all year.
  function rsoDateRange(state, rso) {
    const semester = state.semesters.find((candidate) => candidate.id === rso.semesterId);
    return { startDate: semester.startDate, endDate: rso.lasts === 'year' ? schoolYearEnd(semester) : semester.endDate };
  }

  // Data saved before RSOs existed has no RSO lists.
  function rsosOf(state) {
    return state.rsos || [];
  }

  // Every RSO meeting on one date (not on a break), including cancelled ones.
  function rsoMeetingsOn(state, date) {
    if (breakOn(state, date)) {
      return [];
    }
    const meetings = [];
    for (const rso of rsosOf(state)) {
      const range = rsoDateRange(state, rso);
      if (date < range.startDate || date > range.endDate) {
        continue;
      }
      for (const meeting of rso.meetings) {
        if (meetsOn(meeting, date)) {
          meetings.push({ kind: 'rso-meeting', rso, meeting, date, startTime: meeting.startTime, endTime: meeting.endTime, cancelled: isMeetingCancelled(meeting, date) });
        }
      }
    }
    return meetings;
  }

  // One-time events on one date: each RSO's own events, then events that stand on their own
  // (a concert, a career fair). They show even on break days, since they were added for that day.
  function eventsOn(state, date) {
    const blocks = [];
    for (const rso of rsosOf(state)) {
      for (const rsoEvent of rso.events || []) {
        if (rsoEvent.date === date) {
          blocks.push({ kind: 'rso-event', rso, event: rsoEvent, date, startTime: rsoEvent.startTime, endTime: rsoEvent.endTime, cancelled: false });
        }
      }
    }
    for (const standalone of state.events || []) {
      if (standalone.date === date) {
        blocks.push({ kind: 'event', event: standalone, date, startTime: standalone.startTime, endTime: standalone.endTime, cancelled: false });
      }
    }
    return blocks;
  }

  // Returns a list of problems with a one-time event (an RSO's or a standalone one); empty means it is valid.
  function validateEvent(event) {
    const errors = [];
    if (!event.title.trim()) {
      errors.push('Give the event a name, like Fall social.');
    }
    if (!isValidDateKey(event.date)) {
      errors.push('Pick the event date.');
    }
    if (!isValidTime(event.startTime) || !isValidTime(event.endTime)) {
      errors.push('Pick a start and end time.');
    } else if (event.endTime <= event.startTime) {
      errors.push('The end time must be after the start time.');
    }
    return errors;
  }

  // Everything on the calendar for one date: class meetings, exams, RSO meetings, and
  // events. An exam replaces its own class's meeting when they overlap (an in-class exam).
  function calendarBlocksOn(state, date) {
    const classesById = new Map(state.classes.map((plannerClass) => [plannerClass.id, plannerClass]));
    const exams = examsOf(state)
      .filter((exam) => exam.date === date && classesById.has(exam.classId))
      .map((exam) => ({ kind: 'exam', exam, plannerClass: classesById.get(exam.classId), date, startTime: exam.startTime, endTime: exam.endTime, cancelled: false }));
    const meetings = classMeetingsOn(state, date)
      .filter((meeting) => !exams.some((exam) => exam.plannerClass.id === meeting.plannerClass.id && exam.startTime < meeting.endTime && meeting.startTime < exam.endTime))
      .map((meeting) => ({ kind: 'meeting', ...meeting }));
    return [...meetings, ...exams, ...rsoMeetingsOn(state, date), ...eventsOn(state, date)].sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  // Exams from now through the next two weeks, soonest first, with how many days away each is.
  function upcomingExams(state, todayKey, nowTime) {
    const lastDay = addDays(todayKey, 14);
    return examsOf(state)
      .filter((exam) => exam.date <= lastDay && (exam.date > todayKey || (exam.date === todayKey && exam.endTime > nowTime)))
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
      .map((exam) => ({
        exam,
        plannerClass: state.classes.find((plannerClass) => plannerClass.id === exam.classId),
        daysUntil: daysBetween(todayKey, exam.date),
      }))
      .filter((upcoming) => upcoming.plannerClass);
  }

  // One week's schedule: Mon–Fri, plus Saturday and Sunday only when something is on them.
  // startHour and endHour cover 8 AM–6 PM, stretched to fit anything earlier or later.
  function buildCalendarWeek(state, weekStart) {
    const semester = state.semesters.find((candidate) => candidate.id === state.currentSemesterId);
    const classes = state.classes.filter((plannerClass) => plannerClass.semesterId === state.currentSemesterId);
    let startMinutes = DEFAULT_CALENDAR_HOURS.start * 60;
    let endMinutes = DEFAULT_CALENDAR_HOURS.end * 60;
    const days = [0, 1, 2, 3, 4, 5, 6]
      .map((offset) => {
        const date = addDays(weekStart, offset);
        return { date, label: WEEKDAY_NAMES[parseDateKey(date).getDay()], blocks: calendarBlocksOn(state, date) };
      })
      .filter((day, offset) => offset < 5 || day.blocks.length > 0);
    for (const day of days) {
      for (const block of day.blocks) {
        startMinutes = Math.min(startMinutes, timeToMinutes(block.startTime));
        endMinutes = Math.max(endMinutes, timeToMinutes(block.endTime));
      }
      assignLanes(day.blocks);
    }
    return {
      days,
      startHour: Math.floor(startMinutes / 60),
      endHour: Math.ceil(endMinutes / 60),
      hasMeetings:
        classes.some((plannerClass) => (plannerClass.meetings || []).length > 0) ||
        rsosOf(state).some((rso) => rso.meetings.length > 0 || (rso.events || []).length > 0) ||
        (state.events || []).length > 0,
      outsideSemester: addDays(weekStart, 4) < semester.startDate || weekStart > semester.endDate,
    };
  }

  // The class or exam happening now ({ status: 'now', ... }), or else the next one that
  // isn't cancelled ({ status: 'next', ... }), looking up to two weeks ahead. null if none.
  // RSOs aren't classes, so they don't count.
  function nextClass(state, todayKey, nowTime) {
    for (let offset = 0; offset < 14; offset += 1) {
      const date = addDays(todayKey, offset);
      const meetings = calendarBlocksOn(state, date).filter((meeting) => !meeting.cancelled && (meeting.kind === 'meeting' || meeting.kind === 'exam'));
      if (offset === 0) {
        const happeningNow = meetings.find((meeting) => meeting.startTime <= nowTime && nowTime < meeting.endTime);
        if (happeningNow) {
          return { status: 'now', ...happeningNow };
        }
        const laterToday = meetings.find((meeting) => meeting.startTime > nowTime);
        if (laterToday) {
          return { status: 'next', ...laterToday };
        }
      } else if (meetings.length > 0) {
        return { status: 'next', ...meetings[0] };
      }
    }
    return null;
  }

  function formatTime(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const suffix = hours < 12 ? 'AM' : 'PM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours}:${pad(minutes)} ${suffix}`;
  }

  // "10:00–10:50 AM" when both are in the morning (or afternoon), else "11:30 AM–12:20 PM".
  function formatTimeRange(startTime, endTime) {
    const start = formatTime(startTime);
    const end = formatTime(endTime);
    const sameHalfOfDay = start.slice(-2) === end.slice(-2);
    return `${sameHalfOfDay ? start.slice(0, -3) : start}–${end}`;
  }

  function formatDate(dateKey) {
    const date = parseDateKey(dateKey);
    return `${WEEKDAY_NAMES[date.getDay()]}, ${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
  }

  function formatMonthDay(dateKey) {
    const date = parseDateKey(dateKey);
    return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}`;
  }

  function formatDays(days) {
    // Monday first, Sunday last, matching how class schedules are usually written.
    const mondayFirst = (day) => (day + 6) % 7;
    return [...days].sort((a, b) => mondayFirst(a) - mondayFirst(b)).map((day) => WEEKDAY_NAMES[day]).join('/');
  }

  // Returns a list of problems with a new assignment; empty means it is valid.
  function validateAssignment(assignment) {
    const errors = [];
    if (!assignment.title.trim()) {
      errors.push('Give the assignment a name.');
    }
    if (assignment.link && !isValidLink(assignment.link)) {
      errors.push('The link should start with https://');
    }
    if (!isValidTime(assignment.dueTime)) {
      errors.push('Pick a due time.');
    }
    if (assignment.kind === 'once') {
      if (!isValidDateKey(assignment.dueDate)) {
        errors.push('Pick a due date.');
      }
    } else {
      if (assignment.days.length === 0) {
        errors.push('Pick at least one day of the week.');
      }
      if (!isValidDateKey(assignment.startDate) || !isValidDateKey(assignment.endDate)) {
        errors.push('Pick when the repeating assignment starts and ends.');
      } else if (assignment.startDate > assignment.endDate) {
        errors.push('The end date must be after the start date.');
      }
    }
    return errors;
  }

  return {
    WEEKDAY_NAMES,
    CLASS_COLORS,
    RSO_COLORS,
    updateOldColors,
    toDateKey,
    parseDateKey,
    addDays,
    isValidDateKey,
    isValidLink,
    defaultSemester,
    occurrenceDates,
    buildDueList,
    allowsLateWork,
    itemStatus,
    BREAK_THEMES,
    breakOn,
    breaksDuring,
    upcomingBreak,
    guessBreakTheme,
    validateBreak,
    groupDueList,
    groupByDay,
    startOfWeek,
    buildWeek,
    detachOccurrence,
    newRecurringAssignment,
    timeToMinutes,
    validateMeeting,
    buildCalendarWeek,
    validateExam,
    schoolYearEnd,
    validateEvent,
    calendarBlocksOn,
    upcomingExams,
    nextClass,
    formatTimeRange,
    formatTime,
    formatDate,
    formatMonthDay,
    formatDays,
    validateAssignment,
  };
})();

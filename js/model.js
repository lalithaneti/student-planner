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

  // Returns a list of problems with a class meeting time; empty means it is valid.
  function validateMeeting(meeting) {
    const errors = [];
    if (meeting.days.length === 0) {
      errors.push('Pick at least one day.');
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

  // Every class meeting on one date (only inside the current semester), including
  // cancelled ones, which are marked so the calendar can show them faded.
  function classMeetingsOn(state, date) {
    const semester = state.semesters.find((candidate) => candidate.id === state.currentSemesterId);
    if (date < semester.startDate || date > semester.endDate) {
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

  // Everything on the calendar for one date: class meetings and exams. An exam replaces
  // its own class's meeting when they overlap (an in-class exam).
  function calendarBlocksOn(state, date) {
    const classesById = new Map(state.classes.map((plannerClass) => [plannerClass.id, plannerClass]));
    const exams = examsOf(state)
      .filter((exam) => exam.date === date && classesById.has(exam.classId))
      .map((exam) => ({ kind: 'exam', exam, plannerClass: classesById.get(exam.classId), date, startTime: exam.startTime, endTime: exam.endTime, cancelled: false }));
    const meetings = classMeetingsOn(state, date)
      .filter((meeting) => !exams.some((exam) => exam.plannerClass.id === meeting.plannerClass.id && exam.startTime < meeting.endTime && meeting.startTime < exam.endTime))
      .map((meeting) => ({ kind: 'meeting', ...meeting }));
    return [...meetings, ...exams].sort((a, b) => a.startTime.localeCompare(b.startTime));
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
        daysUntil: Math.round((parseDateKey(exam.date) - parseDateKey(todayKey)) / (24 * 60 * 60 * 1000)),
      }))
      .filter((upcoming) => upcoming.plannerClass);
  }

  // The Mon–Fri class schedule for one week, only on dates inside the current semester.
  // startHour and endHour cover 8 AM–6 PM, stretched to fit any earlier or later class.
  function buildCalendarWeek(state, weekStart) {
    const semester = state.semesters.find((candidate) => candidate.id === state.currentSemesterId);
    const classes = state.classes.filter((plannerClass) => plannerClass.semesterId === state.currentSemesterId);
    let startMinutes = DEFAULT_CALENDAR_HOURS.start * 60;
    let endMinutes = DEFAULT_CALENDAR_HOURS.end * 60;
    const days = [0, 1, 2, 3, 4].map((offset) => {
      const date = addDays(weekStart, offset);
      const blocks = calendarBlocksOn(state, date);
      for (const block of blocks) {
        startMinutes = Math.min(startMinutes, timeToMinutes(block.startTime));
        endMinutes = Math.max(endMinutes, timeToMinutes(block.endTime));
      }
      return { date, label: WEEKDAY_NAMES[parseDateKey(date).getDay()], blocks: assignLanes(blocks) };
    });
    return {
      days,
      startHour: Math.floor(startMinutes / 60),
      endHour: Math.ceil(endMinutes / 60),
      hasMeetings: classes.some((plannerClass) => (plannerClass.meetings || []).length > 0),
      outsideSemester: addDays(weekStart, 4) < semester.startDate || weekStart > semester.endDate,
    };
  }

  // The class or exam happening now ({ status: 'now', ... }), or else the next one that
  // isn't cancelled ({ status: 'next', ... }), looking up to two weeks ahead. null if none.
  function nextClass(state, todayKey, nowTime) {
    for (let offset = 0; offset < 14; offset += 1) {
      const date = addDays(todayKey, offset);
      const meetings = calendarBlocksOn(state, date).filter((meeting) => !meeting.cancelled);
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

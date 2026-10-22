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

  // The Mon–Fri class schedule for one week, only on dates inside the current semester.
  // startHour and endHour cover 8 AM–6 PM, stretched to fit any earlier or later class.
  function buildCalendarWeek(state, weekStart) {
    const semester = state.semesters.find((candidate) => candidate.id === state.currentSemesterId);
    const classes = state.classes.filter((plannerClass) => plannerClass.semesterId === state.currentSemesterId);
    let startMinutes = DEFAULT_CALENDAR_HOURS.start * 60;
    let endMinutes = DEFAULT_CALENDAR_HOURS.end * 60;
    const days = [0, 1, 2, 3, 4].map((offset) => {
      const date = addDays(weekStart, offset);
      const weekday = parseDateKey(date).getDay();
      const blocks = [];
      if (date >= semester.startDate && date <= semester.endDate) {
        for (const plannerClass of classes) {
          for (const meeting of plannerClass.meetings || []) {
            if (meeting.days.includes(weekday)) {
              blocks.push({ plannerClass, meeting, startTime: meeting.startTime, endTime: meeting.endTime });
            }
          }
        }
      }
      for (const block of blocks) {
        startMinutes = Math.min(startMinutes, timeToMinutes(block.startTime));
        endMinutes = Math.max(endMinutes, timeToMinutes(block.endTime));
      }
      return { date, label: WEEKDAY_NAMES[weekday], blocks: assignLanes(blocks) };
    });
    return {
      days,
      startHour: Math.floor(startMinutes / 60),
      endHour: Math.ceil(endMinutes / 60),
      hasMeetings: classes.some((plannerClass) => (plannerClass.meetings || []).length > 0),
      outsideSemester: addDays(weekStart, 4) < semester.startDate || weekStart > semester.endDate,
    };
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
    timeToMinutes,
    validateMeeting,
    buildCalendarWeek,
    formatTimeRange,
    formatTime,
    formatDate,
    formatMonthDay,
    formatDays,
    validateAssignment,
  };
})();

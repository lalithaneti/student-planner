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

  // Splits the due list into the sections shown on screen.
  function groupDueList(items, todayKey) {
    const weekEnd = addDays(todayKey, 7);
    const groups = { overdue: [], today: [], thisWeek: [], later: [], done: [] };
    for (const item of items) {
      if (item.done) {
        groups.done.push(item);
      } else if (item.date < todayKey) {
        groups.overdue.push(item);
      } else if (item.date === todayKey) {
        groups.today.push(item);
      } else if (item.date <= weekEnd) {
        groups.thisWeek.push(item);
      } else {
        groups.later.push(item);
      }
    }
    // Most recently finished first, so the list of done items stays useful.
    groups.done.reverse();
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
  // When viewing the current week, unfinished items from earlier weeks go in overdue.
  function buildWeek(items, weekStart, todayKey) {
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
      } else if (isCurrentWeek && item.date < weekStart && !item.done) {
        overdue.push(item);
      }
    }
    return { overdue, columns };
  }

  function formatTime(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const suffix = hours < 12 ? 'AM' : 'PM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours}:${pad(minutes)} ${suffix}`;
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
    groupDueList,
    groupByDay,
    startOfWeek,
    buildWeek,
    formatTime,
    formatDate,
    formatMonthDay,
    formatDays,
    validateAssignment,
  };
})();

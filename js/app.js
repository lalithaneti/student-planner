// Connects the page to the planner data: draws the screen and handles forms and clicks.
// Every change follows the same steps: change the data, save it, redraw the screen.

(() => {
  const model = PlannerModel;

  const NO_CLASS_COLOR = '#8b8d98';
  // Pennant colors and decorations for each break banner theme.
  const BREAK_THEME_STYLES = {
    fall: {
      label: 'Fall',
      emoji: '🍂',
      decorations: ['🍁', '🍂', '🍃', '🌰', '🍁', '🎃'],
      colors: ['#c2410c', '#d97706', '#92400e', '#b45309', '#9a3412'],
      text: '#fff7ed',
    },
    winter: {
      label: 'Winter',
      emoji: '❄️',
      decorations: ['❄️', '❄️', '⛄', '❄️', '✨'],
      colors: ['#bfdbfe', '#e0f2fe', '#93c5fd', '#f8fafc', '#c7d2fe'],
      text: '#1e3a8a',
    },
    spring: {
      label: 'Spring',
      emoji: '🌸',
      decorations: ['🌸', '🌷', '🦋', '🌸', '🌼'],
      colors: ['#fbcfe8', '#bbf7d0', '#ddd6fe', '#fef08a', '#a5f3fc'],
      text: '#581c87',
    },
    summer: {
      label: 'Summer',
      emoji: '☀️',
      decorations: ['☀️', '🌊', '🐚', '🌴', '🕶️'],
      colors: ['#facc15', '#fb7185', '#38bdf8', '#fb923c', '#2dd4bf'],
      text: '#1f2937',
    },
    party: {
      label: 'Party',
      emoji: '🎉',
      decorations: ['🎈', '🎊', '✨', '🎉', '🎈'],
      colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'],
      text: '#ffffff',
    },
  };
  // The banner's string: how far below the top it hangs at the ends, and how much it sags in the middle (px).
  const BUNTING_STRING_TOP = 8;
  const BUNTING_SAG = 22;
  // How many decorations drift down behind each banner.
  const BANNER_DECORATION_COUNT = 12;
  const TOAST_DURATION_MS = 6000;
  const VIEW_STORAGE_KEY = 'student-planner-view';
  const TAB_STORAGE_KEY = 'student-planner-tab';
  // Height of one hour on the calendar, in pixels.
  const HOUR_HEIGHT = 56;
  const MEETING_DAYS = [1, 2, 3, 4, 5];
  // Week starts on Monday, the way most class schedules are written.
  const ALL_DAYS = [1, 2, 3, 4, 5, 6, 0];

  const loaded = PlannerStorage.load(new Date());
  let state = loaded.state;
  let editingClassId = null;
  // The assignment being edited: { id, scope: 'all' | 'date', date }, or null when adding.
  let editingAssignment = null;
  // Which part of the Add panel is showing: 'assignment', 'class', 'exam', 'break', 'rso', or 'event'.
  let drawerSection = 'assignment';
  let editingExamId = null;
  let editingBreakId = null;
  let editingRsoId = null;
  let editingEventId = null;
  // Whether the break theme was picked by hand; until then it follows the first day's month.
  let breakThemeChosen = false;
  let showLater = false;
  let showDone = false;
  let showMissed = false;
  let toastTimer = null;
  let resolveChoice = null;
  let currentView = loadSavedPreference(VIEW_STORAGE_KEY, ['list', 'week']);
  let currentTab = loadSavedPreference(TAB_STORAGE_KEY, ['assignments', 'calendar']);
  let weekStart = model.startOfWeek(todayKey());

  const elements = {
    semesterLabel: document.getElementById('semester-label'),
    semesterButton: document.getElementById('semester-button'),
    semesterDialog: document.getElementById('semester-dialog'),
    semesterForm: document.getElementById('semester-form'),
    semesterErrors: document.getElementById('semester-errors'),
    banner: document.getElementById('banner'),
    dueList: document.getElementById('due-list'),
    viewButtons: document.querySelectorAll('[data-action="set-view"]'),
    tabButtons: document.querySelectorAll('[data-action="set-tab"]'),
    assignmentsPanel: document.getElementById('assignments-panel'),
    calendarPanel: document.getElementById('calendar-panel'),
    calendar: document.getElementById('calendar'),
    meetingList: document.getElementById('meeting-list'),
    recurringList: document.getElementById('recurring-list'),
    existingRecurring: document.getElementById('existing-recurring'),
    classPanel: document.getElementById('class-panel'),
    assignmentPanel: document.getElementById('assignment-panel'),
    drawerHeading: document.getElementById('drawer-heading'),
    examPanel: document.getElementById('exam-panel'),
    examForm: document.getElementById('exam-form'),
    examClass: document.getElementById('exam-class'),
    examHeading: document.getElementById('exam-heading'),
    examSubmit: document.getElementById('exam-submit'),
    examCancel: document.getElementById('exam-cancel'),
    examErrors: document.getElementById('exam-errors'),
    breakPanel: document.getElementById('break-panel'),
    breakForm: document.getElementById('break-form'),
    breakHeading: document.getElementById('break-heading'),
    breakSubmit: document.getElementById('break-submit'),
    breakCancel: document.getElementById('break-cancel'),
    breakErrors: document.getElementById('break-errors'),
    breakList: document.getElementById('break-list'),
    breakThemePicker: document.getElementById('break-theme-picker'),
    assignmentForm: document.getElementById('assignment-form'),
    assignmentClass: document.getElementById('assignment-class'),
    assignmentErrors: document.getElementById('assignment-errors'),
    onceFields: document.getElementById('once-fields'),
    weeklyFields: document.getElementById('weekly-fields'),
    dayPicker: document.getElementById('day-picker'),
    classList: document.getElementById('class-list'),
    classForm: document.getElementById('class-form'),
    classFormLabel: document.getElementById('class-form-label'),
    classSubmit: document.getElementById('class-submit'),
    classCancel: document.getElementById('class-cancel'),
    classErrors: document.getElementById('class-errors'),
    colorPicker: document.getElementById('color-picker'),
    rsoPanel: document.getElementById('rso-panel'),
    rsoForm: document.getElementById('rso-form'),
    rsoFormLabel: document.getElementById('rso-form-label'),
    rsoSubmit: document.getElementById('rso-submit'),
    rsoCancel: document.getElementById('rso-cancel'),
    rsoErrors: document.getElementById('rso-errors'),
    rsoList: document.getElementById('rso-list'),
    rsoColorPicker: document.getElementById('rso-color-picker'),
    rsoMeetingList: document.getElementById('rso-meeting-list'),
    rsoEventList: document.getElementById('rso-event-list'),
    rsoLastsHint: document.getElementById('rso-lasts-hint'),
    eventPanel: document.getElementById('event-panel'),
    eventForm: document.getElementById('event-form'),
    eventHeading: document.getElementById('event-heading'),
    eventSubmit: document.getElementById('event-submit'),
    eventCancel: document.getElementById('event-cancel'),
    eventErrors: document.getElementById('event-errors'),
    eventColorPicker: document.getElementById('event-color-picker'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message'),
    toastUndo: document.getElementById('toast-undo'),
    confirmDialog: document.getElementById('confirm-dialog'),
    confirmMessage: document.getElementById('confirm-message'),
    confirmChoices: document.getElementById('confirm-choices'),
    assignmentHeading: document.getElementById('add-assignment-heading'),
    assignmentSubmit: document.getElementById('assignment-submit'),
    assignmentCancel: document.getElementById('assignment-cancel'),
    kindField: document.getElementById('kind-field'),
    drawer: document.getElementById('add-drawer'),
  };

  // ---------- Helpers ----------

  function newId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function escapeHtml(text) {
    return String(text)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  // Display preferences (List or Week, which tab) are remembered on this device.
  // Losing them is harmless, so failures fall back to the first option.
  function loadSavedPreference(key, options) {
    try {
      const saved = localStorage.getItem(key);
      return options.includes(saved) ? saved : options[0];
    } catch {
      return options[0];
    }
  }

  function savePreference(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // The preference just won't be remembered next time.
    }
  }

  function todayKey() {
    return model.toDateKey(new Date());
  }

  // The current time as "HH:MM", to compare with due times.
  function currentTime() {
    return new Date().toTimeString().slice(0, 5);
  }

  function statusOf(item) {
    return model.itemStatus(item, todayKey(), currentTime());
  }

  function currentSemester() {
    return state.semesters.find((semester) => semester.id === state.currentSemesterId);
  }

  function currentClasses() {
    return state.classes.filter((plannerClass) => plannerClass.semesterId === state.currentSemesterId);
  }

  function findAssignment(id) {
    return state.assignments.find((assignment) => assignment.id === id);
  }

  function showErrors(listElement, errors) {
    listElement.innerHTML = errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('');
  }

  // Applies a change, saves it, redraws, and shows a message with Undo.
  function applyChange(message, change) {
    const before = JSON.stringify(state);
    change();
    if (!PlannerStorage.save(state)) {
      showToast('Couldn’t save. Your browser may be out of storage or blocking it.', null);
    } else {
      showToast(message, before);
    }
    render();
  }

  // Answers the open question box (null means cancelled) and closes it.
  function finishChoice(answer) {
    if (resolveChoice) {
      resolveChoice(answer);
      resolveChoice = null;
    }
    if (elements.confirmDialog.open) {
      elements.confirmDialog.close();
    }
  }

  // An in-page question box with one button per choice. Resolves to the chosen value,
  // or null if cancelled. The browser's own confirm() is silently blocked in some
  // embedded browsers, and some never send a dialog's "close" event, so answers come
  // straight from the button clicks.
  function askChoice(message, choices) {
    finishChoice(null);
    elements.confirmMessage.textContent = message;
    elements.confirmChoices.innerHTML =
      choices
        .map((choice) => `<button type="button" class="${choice.className}" data-choice="${choice.value}">${escapeHtml(choice.label)}</button>`)
        .join('') + '<button type="button" class="text-button" data-choice="cancel">Cancel</button>';
    elements.confirmDialog.showModal();
    return new Promise((resolve) => {
      resolveChoice = resolve;
    });
  }

  async function askToConfirm(message, confirmLabel) {
    const answer = await askChoice(message, [{ value: 'confirm', label: confirmLabel, className: 'primary-button danger-button' }]);
    return answer === 'confirm';
  }

  function showToast(message, undoData) {
    clearTimeout(toastTimer);
    elements.toastMessage.textContent = message;
    elements.toastUndo.hidden = undoData === null;
    elements.toastUndo.onclick = () => {
      state = JSON.parse(undoData);
      PlannerStorage.save(state);
      render();
      showToast('Undone.', null);
    };
    elements.toast.hidden = false;
    toastTimer = setTimeout(() => {
      elements.toast.hidden = true;
    }, TOAST_DURATION_MS);
  }

  // ---------- Drawing the screen ----------

  function render() {
    renderSemester();
    renderClasses();
    renderBreaks();
    renderRsos();
    renderClassOptions();
    renderTabs();
    renderDueList();
    renderCalendar();
  }

  function renderTabs() {
    elements.tabButtons.forEach((button) => button.setAttribute('aria-selected', String(button.dataset.tab === currentTab)));
    elements.assignmentsPanel.hidden = currentTab !== 'assignments';
    elements.calendarPanel.hidden = currentTab !== 'calendar';
    document.body.classList.toggle('calendar-tab', currentTab === 'calendar');
  }

  function renderSemester() {
    const semester = currentSemester();
    elements.semesterLabel.textContent = `${semester.name} · ${model.formatMonthDay(semester.startDate)} – ${model.formatMonthDay(semester.endDate)}`;
    elements.rsoLastsHint.textContent = `This school year ends ${model.formatDate(model.schoolYearEnd(semester))}; ${semester.name} ends ${model.formatDate(semester.endDate)}. Change them with the semester button (✎).`;
  }

  function renderClasses() {
    const classes = currentClasses();
    if (classes.length === 0) {
      elements.classList.innerHTML = '<li class="empty">No classes yet. Add your first one above.</li>';
      return;
    }
    elements.classList.innerHTML = classes
      .map((plannerClass) => {
        const count = state.assignments.filter((assignment) => assignment.classId === plannerClass.id).length;
        return `
          <li class="class-item" style="--class-color: ${plannerClass.color}">
            <span class="swatch" aria-hidden="true"></span>
            <span class="class-info">
              <span class="class-name">${escapeHtml(plannerClass.name)}</span>
              <span class="class-count">${count} assignment${count === 1 ? '' : 's'}</span>
              ${(plannerClass.meetings || []).map((meeting) => `<span class="class-meeting">${describeMeeting(meeting)}</span>`).join('')}
            </span>
            <button type="button" class="text-button" data-action="edit-class" data-id="${plannerClass.id}">Edit</button>
            <button type="button" class="text-button danger" data-action="delete-class" data-id="${plannerClass.id}">Delete</button>
          </li>`;
      })
      .join('');
  }

  function describeMeeting(meeting) {
    const label = meeting.label ? `${escapeHtml(meeting.label)} ` : '';
    const location = meeting.location ? ` · ${escapeHtml(meeting.location)}` : '';
    const every = meeting.every === 2 ? 'every other ' : '';
    return `${label}${every}${model.formatDays(meeting.days)} ${model.formatTimeRange(meeting.startTime, meeting.endTime)}${location}`;
  }

  function renderClassOptions() {
    const selected = elements.assignmentClass.value;
    // Until a class exists, "No class" is the only choice; once one does, default to it.
    const hadClasses = elements.assignmentClass.options.length > 1;
    const options = currentClasses().map(
      (plannerClass) => `<option value="${plannerClass.id}">${escapeHtml(plannerClass.name)}</option>`,
    );
    options.push('<option value="">No class</option>');
    elements.assignmentClass.innerHTML = options.join('');
    if (hadClasses && [...elements.assignmentClass.options].some((option) => option.value === selected)) {
      elements.assignmentClass.value = selected;
    }
    // Exams always belong to a class, so their list has no "No class" choice.
    const selectedExamClass = elements.examClass.value;
    elements.examClass.innerHTML =
      currentClasses().length === 0
        ? '<option value="">Add a class first (+ Add → Class)</option>'
        : options.slice(0, -1).join('');
    if ([...elements.examClass.options].some((option) => option.value === selectedExamClass)) {
      elements.examClass.value = selectedExamClass;
    }
  }

  // ---------- Pieces shared by the list and week views ----------

  function itemColor(item) {
    return item.plannerClass ? item.plannerClass.color : NO_CLASS_COLOR;
  }

  function renderClassTag(item) {
    return `<span class="class-tag">${item.plannerClass ? escapeHtml(item.plannerClass.name) : 'No class'}</span>`;
  }

  function renderCheckbox(item) {
    const { assignment, date, done } = item;
    return `<input type="checkbox" class="done-checkbox" data-action="toggle-done" data-id="${assignment.id}" data-date="${date}" ${done ? 'checked' : ''}
      aria-label="${done ? 'Mark not done' : 'Mark done'}: ${escapeHtml(assignment.title)}, ${model.formatDate(date)}" />`;
  }

  function renderTitle(assignment) {
    const titleText = escapeHtml(assignment.title);
    const title = assignment.link
      ? `<a href="${escapeHtml(assignment.link)}" target="_blank" rel="noopener noreferrer">${titleText} <span aria-hidden="true">↗</span></a>`
      : titleText;
    const repeatIcon =
      assignment.kind === 'weekly'
        ? `<span class="repeat-icon" title="Repeats every ${model.formatDays(assignment.days)}" aria-label="Repeats every ${model.formatDays(assignment.days)}">↻</span>`
        : '';
    return `<span class="due-title">${title}${repeatIcon}</span>`;
  }

  // The ⋯ menu with the less common actions.
  function renderMenu(item) {
    const { assignment, date } = item;
    const dataAttributes = `data-id="${assignment.id}" data-date="${date}"`;
    const editItem = `<button type="button" data-action="edit-assignment" ${dataAttributes}>Edit…</button>`;
    const menuItems =
      editItem +
      (assignment.kind === 'weekly'
        ? `<button type="button" data-action="skip" ${dataAttributes}>Skip this date</button>
           <button type="button" class="danger" data-action="delete-series" ${dataAttributes}>Delete all dates…</button>`
        : `<button type="button" class="danger" data-action="delete-assignment" ${dataAttributes}>Delete</button>`);
    return `
      <details class="row-menu">
        <summary aria-label="More actions for ${escapeHtml(assignment.title)}">⋯</summary>
        <div class="row-menu-items">${menuItems}</div>
      </details>`;
  }

  function renderEmptyPlanner() {
    const hasClasses = currentClasses().length > 0;
    return `
      <div class="empty-state">
        <p class="empty">Nothing due yet. ${hasClasses ? 'Add an assignment to see it here.' : 'Start by adding a class, then add its assignments.'}</p>
        <button type="button" class="primary-button" data-action="open-drawer" data-section="${hasClasses ? 'assignment' : 'class'}">${
          hasClasses ? 'Add an assignment' : 'Add your first class'
        }</button>
      </div>`;
  }

  function renderDueList() {
    elements.viewButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.view === currentView)));
    document.body.classList.toggle('week-view', currentView === 'week');
    const items = model.buildDueList(state);
    if (items.length === 0) {
      elements.dueList.innerHTML = renderEmptyPlanner();
    } else {
      elements.dueList.innerHTML = currentView === 'week' ? renderWeekView(items) : renderListView(items);
    }
  }

  // ---------- List view ----------

  // One row: checkbox, class tag and time, title, and the ⋯ menu.
  // showDate adds the day to the time, for sections that aren't already grouped by day.
  // Classes and an optional label that show an item's status (done, overdue, missed).
  function statusDecorations(item) {
    const status = statusOf(item);
    return {
      className: { done: ' is-done', overdue: ' is-overdue', missed: ' is-missed', upcoming: '' }[status],
      label: status === 'missed' ? ' · <span class="missed-label">Missed</span>' : '',
    };
  }

  function renderListItem(item, showDate) {
    const when = showDate ? `${model.formatDate(item.date)} · ${model.formatTime(item.time)}` : model.formatTime(item.time);
    const status = statusDecorations(item);
    return `
      <li class="due-item${status.className}" style="--class-color: ${itemColor(item)}">
        ${renderCheckbox(item)}
        <div class="due-main">
          <span class="due-top-line">${renderClassTag(item)}<span class="due-time">${when}${status.label}</span></span>
          ${renderTitle(item.assignment)}
        </div>
        ${renderMenu(item)}
      </li>`;
  }

  function renderHeading(text, count, className = '') {
    return `<h3 class="due-heading ${className}">${text} <span class="count">${count}</span></h3>`;
  }

  function renderList(items, showDate) {
    return `<ul class="due-items">${items.map((item) => renderListItem(item, showDate)).join('')}</ul>`;
  }

  function dayHeading(date) {
    const today = todayKey();
    if (date === today) {
      return `Today · ${model.formatDate(date)}`;
    }
    if (date === model.addDays(today, 1)) {
      return `Tomorrow · ${model.formatDate(date)}`;
    }
    return model.formatDate(date);
  }

  // A heading per day, like a planner agenda.
  function renderDays(items) {
    return model
      .groupByDay(items)
      .map((day) => renderHeading(dayHeading(day.date), day.items.length) + renderList(day.items, false))
      .join('');
  }

  function renderToggle(action, expanded, label) {
    return `<button type="button" class="toggle-button" data-action="${action}" aria-expanded="${expanded}">${label}</button>`;
  }

  function renderListView(items) {
    const groups = model.groupDueList(items, todayKey(), currentTime());
    let html = '';
    if (groups.overdue.length > 0) {
      html += renderHeading('Overdue', groups.overdue.length, 'overdue') + renderList(groups.overdue, true);
    }
    if (groups.today.length + groups.thisWeek.length === 0) {
      html += '<p class="empty">Nothing else due in the next 7 days.</p>';
    }
    html += renderDays([...groups.today, ...groups.thisWeek]);
    if (groups.later.length > 0) {
      html += renderToggle('toggle-later', showLater, showLater ? 'Hide later' : `Show later (${groups.later.length})`);
      if (showLater) {
        html += renderDays(groups.later);
      }
    }
    if (groups.missed.length > 0) {
      html += renderToggle('toggle-missed', showMissed, showMissed ? 'Hide missed' : `Show missed (${groups.missed.length})`);
      if (showMissed) {
        html += renderHeading('Missed', groups.missed.length) + renderList(groups.missed, true);
      }
    }
    if (groups.done.length > 0) {
      html += renderToggle('toggle-done-section', showDone, showDone ? 'Hide completed' : `Show completed (${groups.done.length})`);
      if (showDone) {
        html += renderHeading('Completed', groups.done.length) + renderList(groups.done, true);
      }
    }
    return html;
  }

  // ---------- Week view ----------

  // A compact card for a narrow day column: class tag and ⋯ on top, then checkbox and title, then time.
  function renderWeekItem(item, when) {
    const status = statusDecorations(item);
    return `
      <li class="due-item week-item${status.className}" style="--class-color: ${itemColor(item)}">
        <span class="week-item-top">${renderClassTag(item)}${renderMenu(item)}</span>
        <span class="week-item-title">${renderCheckbox(item)}${renderTitle(item.assignment)}</span>
        <span class="due-time">${when}${status.label}</span>
      </li>`;
  }

  function renderWeekColumn(heading, items, whenText, className) {
    const body =
      items.length === 0
        ? '<p class="week-empty">Nothing due</p>'
        : `<ul class="due-items">${items.map((item) => renderWeekItem(item, whenText(item))).join('')}</ul>`;
    return `<section class="week-column ${className}"><h3 class="week-column-heading">${heading}</h3>${body}</section>`;
  }

  function renderProgress({ done, total }) {
    if (total === 0) {
      return '<span class="week-progress"><span class="progress-text">Nothing due this week</span></span>';
    }
    const percent = Math.round((done / total) * 100);
    return `
      <span class="week-progress">
        <span class="progress-text">${done} of ${total} done</span>
        <span class="progress-bar" role="progressbar" aria-label="Done this week" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}">
          <span class="progress-fill" style="width: ${percent}%"></span>
        </span>
      </span>`;
  }

  function weekRangeLabel(start) {
    const end = model.addDays(start, 6);
    const sameMonth = start.slice(0, 7) === end.slice(0, 7);
    return `${model.formatMonthDay(start)} – ${sameMonth ? Number(end.slice(8)) : model.formatMonthDay(end)}`;
  }

  function weekdayName(date) {
    return model.WEEKDAY_NAMES[model.parseDateKey(date).getDay()];
  }

  function renderWeekView(items) {
    const today = todayKey();
    const week = model.buildWeek(items, weekStart, today, currentTime());
    let columns = '';
    if (week.overdue.length > 0) {
      columns += renderWeekColumn(
        `Overdue <span class="count">${week.overdue.length}</span>`,
        week.overdue,
        (item) => `${model.formatDate(item.date)} · ${model.formatTime(item.time)}`,
        'overdue',
      );
    }
    for (const column of week.columns) {
      const isToday = column.dates.includes(today);
      const isWeekend = column.dates.length > 1;
      const dayNumbers = column.dates.map((date) => Number(date.slice(8))).join('–');
      columns += renderWeekColumn(
        `<span class="weekday">${column.label}</span> <span class="day-number">${dayNumbers}</span>${isToday ? ' <span class="today-badge">Today</span>' : ''}`,
        column.items,
        (item) => (isWeekend ? `${weekdayName(item.date)} · ${model.formatTime(item.time)}` : model.formatTime(item.time)),
        isToday ? 'is-today' : '',
      );
    }
    return `${renderWeekNav(renderProgress(week.progress))}${renderBreakBanners(weekDates(7))}<div class="week-grid">${columns}</div>`;
  }

  // ← week → navigation, shared by the assignments Week view and the calendar. extra goes at the end.
  function renderWeekNav(extra = '') {
    const isCurrentWeek = weekStart === model.startOfWeek(todayKey());
    return `
      <div class="week-nav">
        <button type="button" class="icon-button" data-action="previous-week" aria-label="Previous week">←</button>
        <span class="week-range">${weekRangeLabel(weekStart)}</span>
        <button type="button" class="icon-button" data-action="next-week" aria-label="Next week">→</button>
        ${isCurrentWeek ? '' : '<button type="button" class="text-button" data-action="this-week">This week</button>'}
        ${extra}
      </div>`;
  }

  // ---------- Breaks ----------

  function breakDateRange(schoolBreak) {
    return `${model.formatDate(schoolBreak.startDate)} – ${model.formatDate(schoolBreak.endDate)}`;
  }

  function sortedBreaks() {
    return (state.breaks || [])
      .filter((schoolBreak) => schoolBreak.semesterId === state.currentSemesterId)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
  }

  function renderBreaks() {
    const breaks = sortedBreaks();
    elements.breakList.innerHTML =
      breaks.length === 0
        ? '<li class="empty">No breaks yet.</li>'
        : breaks
            .map(
              (schoolBreak) => `
                <li class="class-item">
                  <span aria-hidden="true">${BREAK_THEME_STYLES[schoolBreak.theme].emoji}</span>
                  <span class="class-info">
                    <span class="class-name">${escapeHtml(schoolBreak.name)}</span>
                    <span class="class-count">${breakDateRange(schoolBreak)}</span>
                  </span>
                  <button type="button" class="text-button" data-action="edit-break" data-id="${schoolBreak.id}">Edit</button>
                  <button type="button" class="text-button danger" data-action="delete-break" data-id="${schoolBreak.id}">Delete</button>
                </li>`,
            )
            .join('');
  }

  // A string of triangle flags spelling the break's name, sagging in the middle like real bunting.
  function renderBreakBanner(schoolBreak) {
    const style = BREAK_THEME_STYLES[schoolBreak.theme];
    const letters = [...schoolBreak.name.toUpperCase()];
    let colorIndex = 0;
    const flags = letters
      .map((letter, index) => {
        if (!letter.trim()) {
          return ''; // A space leaves a gap on the string.
        }
        const position = (index + 0.5) / letters.length;
        const drop = BUNTING_SAG * 4 * position * (1 - position);
        // Lean with the string: tipped one way on the left, the other way on the right.
        const tilt = 7 * (1 - 2 * position);
        const color = style.colors[colorIndex % style.colors.length];
        colorIndex += 1;
        return `<span class="flag" style="left: ${position * 100}%; top: ${BUNTING_STRING_TOP + drop}px; --tilt: ${-tilt}deg; --flag-color: ${color}; --flag-text: ${style.text}">${escapeHtml(letter)}</span>`;
      })
      .join('');
    const stringMiddle = BUNTING_STRING_TOP + 2 * BUNTING_SAG;
    // Spread out evenly-ish but not in a grid, with staggered timing so they don't fall in step.
    // Each one's place in its fall comes from the clock, so the once-a-minute redraw
    // continues the animation instead of restarting it.
    const secondsNow = Date.now() / 1000;
    const falling = Array.from({ length: BANNER_DECORATION_COUNT }, (_, index) => {
      const symbol = style.decorations[index % style.decorations.length];
      const left = (index * 37 + 5) % 100;
      const duration = 7 + (index % 4) * 1.5;
      const delay = -((secondsNow + index * 1.7) % duration);
      const size = 14 + (index % 3) * 5;
      return `<span class="falling-decoration" style="left: ${left}%; animation-delay: ${delay}s; animation-duration: ${duration}s; font-size: ${size}px">${symbol}</span>`;
    }).join('');
    return `
      <div class="break-banner">
        <div class="banner-decorations" aria-hidden="true">${falling}</div>
        <span class="string-end string-end-left" aria-hidden="true">${style.decorations[0]}</span>
        <span class="string-end string-end-right" aria-hidden="true">${style.decorations[1]}</span>
        <div class="bunting" style="--flag-count: ${letters.length}" role="img" aria-label="${escapeHtml(schoolBreak.name)} banner">
          <svg class="bunting-string" viewBox="0 0 100 80" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 ${BUNTING_STRING_TOP} Q50 ${stringMiddle} 100 ${BUNTING_STRING_TOP}" vector-effect="non-scaling-stroke" />
          </svg>
          ${flags}
        </div>
        <p class="break-caption">
          <span aria-hidden="true">${style.emoji}</span>
          <strong>${escapeHtml(schoolBreak.name)}</strong> · ${breakDateRange(schoolBreak)} · no classes
          <span aria-hidden="true">${style.emoji}</span>
          <button type="button" class="text-button" data-action="edit-break" data-id="${schoolBreak.id}" aria-label="Edit ${escapeHtml(schoolBreak.name)}">✎</button>
        </p>
      </div>`;
  }

  // Banners for every break covering any of the given dates.
  function renderBreakBanners(dates) {
    return model
      .breaksDuring(state, dates)
      .map(renderBreakBanner)
      .join('');
  }

  function weekDates(dayCount) {
    return Array.from({ length: dayCount }, (_, offset) => model.addDays(weekStart, offset));
  }

  // ---------- Calendar ----------

  function hourLabel(hour) {
    const suffix = hour < 12 ? 'AM' : 'PM';
    return `${hour % 12 === 0 ? 12 : hour % 12} ${suffix}`;
  }

  // Pixels from the top of the calendar for a time like "10:30".
  function timeOffset(time, startHour) {
    return ((model.timeToMinutes(time) - startHour * 60) / 60) * HOUR_HEIGHT;
  }

  // Where a block sits on the grid: its height comes from its times, its width from overlaps.
  function blockPlacement(block, startHour) {
    const top = timeOffset(block.startTime, startHour);
    const height = timeOffset(block.endTime, startHour) - top;
    return {
      height,
      style: `top: ${top}px; height: ${height}px; left: ${(block.lane / block.laneCount) * 100}%; width: ${100 / block.laneCount}%`,
    };
  }

  // An exam on the calendar, in its class's color and marked EXAM. Clicking it opens a
  // menu to edit or delete it.
  function renderExamBlock(block, startHour) {
    const { exam, plannerClass } = block;
    const { height, style } = blockPlacement(block, startHour);
    const title = escapeHtml(exam.title);
    const details = height >= HOUR_HEIGHT && exam.location ? `<span class="class-block-details">${escapeHtml(exam.location)}</span>` : '';
    return `
      <details class="row-menu class-block-slot" style="${style}">
        <summary class="class-block is-exam" style="--class-color: ${plannerClass.color}"
          title="${escapeHtml(plannerClass.name)} ${title}${exam.location ? ` · ${escapeHtml(exam.location)}` : ''}">
          <span class="class-block-name"><span class="exam-tag">Exam</span> ${escapeHtml(plannerClass.name)} ${title}</span>
          ${details}
          <span class="class-block-time">${model.formatTimeRange(block.startTime, block.endTime)}</span>
        </summary>
        <div class="row-menu-items">
          <button type="button" data-action="edit-exam" data-id="${exam.id}">Edit exam…</button>
          <button type="button" class="danger" data-action="delete-exam" data-id="${exam.id}">Delete exam</button>
        </div>
      </details>`;
  }

  // A class or RSO meeting on the calendar. Clicking it opens a menu to edit the class (or
  // RSO) or cancel (or restore) just this day's meeting.
  function renderMeetingBlock(block, startHour) {
    const { meeting, date, cancelled } = block;
    const isRso = block.kind === 'rso-meeting';
    const owner = isRso ? block.rso : block.plannerClass;
    const ownerType = isRso ? 'RSO meeting' : 'class';
    const { height, style } = blockPlacement(block, startHour);
    // Blocks under about an hour only have room for the name and time; the rest is in the hover text.
    const hasRoomForDetails = height >= HOUR_HEIGHT;
    const details = cancelled
      ? 'Cancelled'
      : hasRoomForDetails
        ? [meeting.label, meeting.location].filter(Boolean).map(escapeHtml).join(' · ')
        : '';
    const name = escapeHtml(owner.name);
    const meetingData = `data-owner="${isRso ? 'rso' : 'class'}" data-owner-id="${owner.id}" data-meeting-id="${meeting.id}" data-date="${date}"`;
    const dayAction = cancelled
      ? `<button type="button" data-action="restore-meeting" ${meetingData}>Restore ${ownerType} on ${model.formatDate(date)}</button>`
      : `<button type="button" class="danger" data-action="cancel-meeting" ${meetingData}>Cancel ${ownerType} on ${model.formatDate(date)}</button>`;
    return `
      <details class="row-menu class-block-slot" style="${style}">
        <summary class="class-block${cancelled ? ' is-cancelled' : ''}" style="--class-color: ${owner.color}"
          title="${name} ${describeMeeting(meeting)}${cancelled ? ' (cancelled)' : ''}">
          <span class="class-block-name">${name}</span>
          ${details ? `<span class="class-block-details">${details}</span>` : ''}
          <span class="class-block-time">${model.formatTimeRange(block.startTime, block.endTime)}</span>
        </summary>
        <div class="row-menu-items">
          <button type="button" data-action="${isRso ? 'edit-rso' : 'edit-class'}" data-id="${owner.id}">Edit ${name}…</button>
          ${dayAction}
        </div>
      </details>`;
  }

  // A one-time event on the calendar: an RSO's (in its color, named "MedLaunch: Fall social")
  // or a standalone one in its own color. Clicking it opens a menu to edit or delete it.
  function renderEventBlock(block, startHour) {
    const { event, rso } = block;
    const { height, style } = blockPlacement(block, startHour);
    const name = rso ? `${escapeHtml(rso.name)}: ${escapeHtml(event.title)}` : escapeHtml(event.title);
    const details = height >= HOUR_HEIGHT && event.location ? `<span class="class-block-details">${escapeHtml(event.location)}</span>` : '';
    const eventData = rso ? `data-rso-id="${rso.id}" data-id="${event.id}"` : `data-id="${event.id}"`;
    return `
      <details class="row-menu class-block-slot" style="${style}">
        <summary class="class-block is-event" style="--class-color: ${rso ? rso.color : event.color}"
          title="${name}${event.location ? ` · ${escapeHtml(event.location)}` : ''}">
          <span class="class-block-name">${name}</span>
          ${details}
          <span class="class-block-time">${model.formatTimeRange(block.startTime, block.endTime)}</span>
        </summary>
        <div class="row-menu-items">
          <button type="button" data-action="${rso ? 'edit-rso' : 'edit-event'}" data-id="${rso ? rso.id : event.id}">Edit ${rso ? escapeHtml(rso.name) : 'event'}…</button>
          <button type="button" class="danger" data-action="delete-event" ${eventData}>Delete event</button>
        </div>
      </details>`;
  }

  // "Now: MATH 241 Lecture until 10:50 AM · Altgeld 314", or the next class coming up.
  function renderNextClass() {
    const upcoming = model.nextClass(state, todayKey(), currentTime());
    if (!upcoming) {
      return '<p class="next-class">No classes in the next two weeks.</p>';
    }
    const { plannerClass, status, date, startTime, endTime } = upcoming;
    // An exam reads "MATH 241 Midterm 1 (exam)"; a class meeting "MATH 241 Lecture".
    const isExam = upcoming.kind === 'exam';
    const label = isExam ? `${upcoming.exam.title} (exam)` : upcoming.meeting.label;
    const location = isExam ? upcoming.exam.location : upcoming.meeting.location;
    const what = `<strong>${escapeHtml(plannerClass.name)}</strong>${label ? ` ${escapeHtml(label)}` : ''}`;
    const where = location ? ` · ${escapeHtml(location)}` : '';
    let text;
    if (status === 'now') {
      text = `Now: ${what} until ${model.formatTime(endTime)}${where}`;
    } else if (date === todayKey()) {
      text = `Next: ${what} at ${model.formatTime(startTime)}${where}`;
    } else {
      const day = date === model.addDays(todayKey(), 1) ? 'Tomorrow' : model.formatDate(date);
      text = `Next: ${day} ${model.formatTime(startTime)} · ${what}${where}`;
    }
    return `<p class="next-class" style="--class-color: ${plannerClass.color}"><span class="swatch" aria-hidden="true"></span>${text}</p>`;
  }

  function daysAwayText(days) {
    if (days === 0) {
      return 'today';
    }
    return days === 1 ? 'tomorrow' : `in ${days} days`;
  }

  // "★ Exams: MATH 241 Midterm 1 · Thu, Nov 5, 7:00 PM · in 5 days", for the next two weeks.
  function renderExamCountdown() {
    const exams = model.upcomingExams(state, todayKey(), currentTime());
    if (exams.length === 0) {
      return '';
    }
    const rows = exams
      .map(
        ({ exam, plannerClass, daysUntil }) => `
          <li style="--class-color: ${plannerClass.color}">
            <span class="swatch" aria-hidden="true"></span>
            <span><strong>${escapeHtml(plannerClass.name)}</strong> ${escapeHtml(exam.title)} · ${model.formatDate(exam.date)}, ${model.formatTime(exam.startTime)}
            · <span class="days-away">${daysAwayText(daysUntil)}</span></span>
          </li>`,
      )
      .join('');
    return `<div class="exam-countdown"><span class="exam-countdown-title">★ Exams</span><ul>${rows}</ul></div>`;
  }

  function renderCalendar() {
    const week = model.buildCalendarWeek(state, weekStart);
    const today = todayKey();
    let notice = '';
    if (!week.hasMeetings) {
      notice = `
        <div class="empty-state calendar-notice">
          <p class="empty">Add meeting times to your classes or RSOs to see them here.</p>
          <button type="button" class="primary-button" data-action="open-drawer" data-section="class">Add meeting times</button>
        </div>`;
    } else if (week.outsideSemester) {
      notice = `<p class="empty calendar-notice">This week is outside ${escapeHtml(currentSemester().name)}, so no classes meet.</p>`;
    }
    const hours = week.endHour - week.startHour;
    const hourLabels = Array.from({ length: hours }, (_, index) => week.startHour + index)
      .map((hour) => `<span class="hour-label" style="top: ${(hour - week.startHour) * HOUR_HEIGHT}px">${hourLabel(hour)}</span>`)
      .join('');
    const headers = week.days
      .map(
        (day) => `
          <div class="calendar-day-heading${day.date === today ? ' is-today' : ''}">
            <span class="weekday">${day.label}</span> <span class="day-number">${Number(day.date.slice(8))}</span>
            ${model.breakOn(state, day.date) ? '<span class="break-tag">Break</span>' : ''}
          </div>`,
      )
      .join('');
    const nowTime = currentTime();
    const columns = week.days
      .map((day) => {
        const showNow = day.date === today && nowTime >= `${String(week.startHour).padStart(2, '0')}:00` && model.timeToMinutes(nowTime) <= week.endHour * 60;
        const nowLine = showNow ? `<div class="now-line" style="top: ${timeOffset(nowTime, week.startHour)}px" aria-hidden="true"></div>` : '';
        const blockRenderers = { exam: renderExamBlock, 'rso-event': renderEventBlock, event: renderEventBlock };
        const blocks = day.blocks.map((block) => (blockRenderers[block.kind] || renderMeetingBlock)(block, week.startHour)).join('');
        return `<div class="calendar-day${day.date === today ? ' is-today' : ''}">${blocks}${nowLine}</div>`;
      })
      .join('');
    elements.calendar.innerHTML = `
      ${currentClasses().some((plannerClass) => (plannerClass.meetings || []).length > 0) ? renderNextClass() : ''}
      ${renderExamCountdown()}
      ${renderWeekNav()}
      ${renderBreakBanners(week.days.map((day) => day.date))}
      ${notice}
      <div class="calendar" style="--day-count: ${week.days.length}">
        <div class="calendar-row calendar-headings"><span></span>${headers}</div>
        <div class="calendar-row calendar-body" style="height: ${hours * HOUR_HEIGHT}px">
          <div class="hour-labels">${hourLabels}</div>
          ${columns}
        </div>
      </div>`;
  }

  // ---------- Add panel ----------

  function isDrawerOpen() {
    return elements.drawer.classList.contains('is-open');
  }

  // The panel's title follows what it shows, e.g. "Classes" or "Edit assignment".
  function renderDrawerHeading() {
    const headings = {
      class: 'Classes',
      assignment: elements.assignmentHeading.textContent,
      exam: elements.examHeading.textContent,
      break: 'Breaks',
      rso: 'RSOs',
      event: elements.eventHeading.textContent,
    };
    elements.drawerHeading.textContent = headings[drawerSection];
  }

  // Opens the Add panel showing one section ('assignment', 'class', 'exam', 'break', 'rso', or 'event'), or closes it.
  function setDrawerOpen(open, section = drawerSection) {
    if (!open && editingAssignment) {
      stopEditingAssignment();
    }
    if (!open && editingExamId) {
      stopEditingExam();
    }
    if (!open && editingBreakId) {
      stopEditingBreak();
    }
    if (!open && editingRsoId) {
      stopEditingRso();
    }
    if (!open && editingEventId) {
      stopEditingEvent();
    }
    elements.drawer.inert = !open;
    elements.drawer.classList.toggle('is-open', open);
    document.body.classList.toggle('drawer-open', open);
    if (open) {
      drawerSection = section;
      elements.classPanel.hidden = section !== 'class';
      elements.assignmentPanel.hidden = section !== 'assignment';
      elements.examPanel.hidden = section !== 'exam';
      elements.breakPanel.hidden = section !== 'break';
      elements.rsoPanel.hidden = section !== 'rso';
      elements.eventPanel.hidden = section !== 'event';
      renderDrawerHeading();
      const firstFields = {
        class: elements.classForm.elements.name,
        assignment: elements.assignmentForm.elements.title,
        exam: elements.examForm.elements.title,
        break: elements.breakForm.elements.name,
        rso: elements.rsoForm.elements.name,
        event: elements.eventForm.elements.title,
      };
      firstFields[section].focus();
    }
  }

  // ---------- ⋯ menus ----------

  // Menus are placed relative to the window, so the sideways-scrolling week view can't cut them off.
  function positionMenu(menu) {
    const summaryBox = menu.querySelector('summary').getBoundingClientRect();
    const items = menu.querySelector('.row-menu-items');
    const left = Math.max(8, Math.min(summaryBox.right - items.offsetWidth, window.innerWidth - items.offsetWidth - 8));
    const below = summaryBox.bottom + 4;
    const top = below + items.offsetHeight > window.innerHeight ? summaryBox.top - items.offsetHeight - 4 : below;
    Object.assign(items.style, { left: `${left}px`, top: `${top}px` });
  }

  function closeMenus() {
    document.querySelectorAll('.row-menu[open], .add-menu[open]').forEach((menu) => {
      menu.open = false;
    });
  }

  // ---------- Day buttons ----------

  // Mon, Tue, ... toggle buttons. inputAttributes names the checkboxes, e.g. 'name="days"'.
  function renderDayOptions(days, selectedDays, inputAttributes) {
    return days
      .map(
        (day) =>
          `<label class="day-option"><input type="checkbox" ${inputAttributes} value="${day}" ${selectedDays.includes(day) ? 'checked' : ''} /><span>${model.WEEKDAY_NAMES[day]}</span></label>`,
      )
      .join('');
  }

  function checkedDays(container, selector) {
    return [...container.querySelectorAll(`${selector}:checked`)].map((input) => Number(input.value));
  }

  // ---------- Meeting times in the class form ----------

  // Meeting rows for a class (list = elements.meetingList, Mon–Fri) or an RSO (any day).
  // RSO meetings can also repeat every other week, starting from a first meeting date.
  function renderRepeatFields(meeting, index) {
    const everyOther = meeting.every === 2;
    return `
      <label class="field"><span>Repeats</span>
        <select class="meeting-every" aria-label="Meeting ${index + 1} repeats">
          <option value="1" ${everyOther ? '' : 'selected'}>Every week</option>
          <option value="2" ${everyOther ? 'selected' : ''}>Every other week</option>
        </select>
      </label>
      <label class="field meeting-first-field" ${everyOther ? '' : 'hidden'}><span>First meeting</span>
        <input class="meeting-first" type="date" value="${meeting.firstDate || ''}" />
      </label>`;
  }

  function renderMeetingRows(list, meetings, days = MEETING_DAYS) {
    const isRso = days !== MEETING_DAYS;
    list.innerHTML = meetings
      .map(
        (meeting, index) => `
          <li class="meeting-row" data-meeting-id="${meeting.id}">
            <div class="meeting-row-top">
              <input class="meeting-label" type="text" maxlength="30" placeholder="${days === MEETING_DAYS ? 'Lecture, Lab…' : 'General meeting, Practice…'}" value="${escapeHtml(meeting.label)}"
                aria-label="Meeting ${index + 1} name" />
              <button type="button" class="text-button danger" data-meeting-action="remove">Remove</button>
            </div>
            <div class="day-picker" role="group" aria-label="Meeting ${index + 1} days">
              ${renderDayOptions(days, meeting.days, 'class="meeting-day"')}
            </div>
            ${isRso ? renderRepeatFields(meeting, index) : ''}
            <div class="field-row">
              <label class="field"><span>Starts</span><input class="meeting-start" type="time" value="${meeting.startTime}" /></label>
              <label class="field"><span>Ends</span><input class="meeting-end" type="time" value="${meeting.endTime}" /></label>
            </div>
            <input class="meeting-location" type="text" maxlength="40" placeholder="${days === MEETING_DAYS ? 'Room' : 'Place'} (optional)" value="${escapeHtml(meeting.location)}"
              aria-label="Meeting ${index + 1} room" />
          </li>`,
      )
      .join('');
  }

  function readMeetingRows(list) {
    return [...list.querySelectorAll('.meeting-row')].map((row) => ({
      id: row.dataset.meetingId,
      label: row.querySelector('.meeting-label').value.trim(),
      days: checkedDays(row, '.meeting-day'),
      startTime: row.querySelector('.meeting-start').value,
      endTime: row.querySelector('.meeting-end').value,
      location: row.querySelector('.meeting-location').value.trim(),
      ...readRepeatFields(row),
    }));
  }

  // Only RSO meeting rows have repeat fields; class meetings are always weekly.
  function readRepeatFields(row) {
    const everySelect = row.querySelector('.meeting-every');
    if (!everySelect || everySelect.value !== '2') {
      return {};
    }
    return { every: 2, firstDate: row.querySelector('.meeting-first').value };
  }

  // firstLabel names the first meeting, e.g. "Lecture" for a class.
  function addMeetingRow(list, days, firstLabel) {
    const meetings = readMeetingRows(list);
    meetings.push({ id: newId('meeting'), label: meetings.length === 0 ? firstLabel : '', days: [], startTime: '', endTime: '', location: '' });
    renderMeetingRows(list, meetings, days);
    list.querySelector('.meeting-row:last-child .meeting-label').focus();
  }

  function removeMeetingRow(list, row, days) {
    const meetings = readMeetingRows(list).filter((meeting) => meeting.id !== row.dataset.meetingId);
    renderMeetingRows(list, meetings, days);
  }

  // ---------- Events in the RSO form ----------

  function renderRsoEventRows(rows) {
    elements.rsoEventList.innerHTML = rows
      .map(
        (row, index) => `
          <li class="meeting-row rso-event-row" data-event-id="${row.id}">
            <div class="meeting-row-top">
              <input class="event-title" type="text" maxlength="80" placeholder="e.g. Fall social" value="${escapeHtml(row.title)}"
                aria-label="Event ${index + 1} name" />
              <button type="button" class="text-button danger" data-rso-event-action="remove">Remove</button>
            </div>
            <label class="field"><span>Date</span><input class="event-date" type="date" value="${row.date}" /></label>
            <div class="field-row">
              <label class="field"><span>Starts</span><input class="event-start" type="time" value="${row.startTime}" /></label>
              <label class="field"><span>Ends</span><input class="event-end" type="time" value="${row.endTime}" /></label>
            </div>
            <input class="event-location" type="text" maxlength="40" placeholder="Place (optional)" value="${escapeHtml(row.location)}"
              aria-label="Event ${index + 1} place" />
          </li>`,
      )
      .join('');
  }

  function readRsoEventRows() {
    return [...elements.rsoEventList.querySelectorAll('.rso-event-row')].map((row) => ({
      id: row.dataset.eventId,
      title: row.querySelector('.event-title').value.trim(),
      date: row.querySelector('.event-date').value,
      startTime: row.querySelector('.event-start').value,
      endTime: row.querySelector('.event-end').value,
      location: row.querySelector('.event-location').value.trim(),
    }));
  }

  function addRsoEventRow() {
    const rows = readRsoEventRows();
    rows.push({ id: newId('event'), title: '', date: '', startTime: '', endTime: '', location: '' });
    renderRsoEventRows(rows);
    elements.rsoEventList.querySelector('.rso-event-row:last-child .event-title').focus();
  }

  function removeRsoEventRow(row) {
    renderRsoEventRows(readRsoEventRows().filter((candidate) => candidate.id !== row.dataset.eventId));
  }

  // ---------- Recurring assignments in the class form ----------

  function renderRecurringRows(rows) {
    elements.recurringList.innerHTML = rows
      .map(
        (row, index) => `
          <li class="meeting-row recurring-row" data-row-id="${row.rowId}">
            <div class="meeting-row-top">
              <input class="recurring-title" type="text" maxlength="120" placeholder="e.g. Math HW" value="${escapeHtml(row.title)}"
                aria-label="Recurring assignment ${index + 1} name" />
              <button type="button" class="text-button danger" data-recurring-action="remove">Remove</button>
            </div>
            <div class="day-picker" role="group" aria-label="Recurring assignment ${index + 1} due days">
              ${renderDayOptions(ALL_DAYS, row.days, 'class="recurring-day"')}
            </div>
            <label class="field"><span>Due time</span><input class="recurring-time" type="time" value="${row.dueTime}" /></label>
            <input class="recurring-link" type="url" placeholder="Link (optional): https://" value="${escapeHtml(row.link)}"
              aria-label="Recurring assignment ${index + 1} link" />
            <label class="checkbox-field">
              <input class="recurring-late" type="checkbox" ${row.lateAllowed ? 'checked' : ''} />
              <span>Late work allowed</span>
            </label>
          </li>`,
      )
      .join('');
  }

  function readRecurringRows() {
    return [...elements.recurringList.querySelectorAll('.recurring-row')].map((row) => ({
      rowId: row.dataset.rowId,
      title: row.querySelector('.recurring-title').value.trim(),
      days: checkedDays(row, '.recurring-day'),
      dueTime: row.querySelector('.recurring-time').value,
      link: row.querySelector('.recurring-link').value.trim(),
      lateAllowed: row.querySelector('.recurring-late').checked,
    }));
  }

  function addRecurringRow() {
    const rows = readRecurringRows();
    rows.push({ rowId: newId('row'), title: '', days: [], dueTime: '23:59', link: '', lateAllowed: true });
    renderRecurringRows(rows);
    elements.recurringList.querySelector('.recurring-row:last-child .recurring-title').focus();
  }

  function removeRecurringRow(row) {
    renderRecurringRows(readRecurringRows().filter((candidate) => candidate.rowId !== row.dataset.rowId));
  }

  // When editing a class, lists the repeating assignments it already has.
  function renderExistingRecurring(classId) {
    const existing = state.assignments.filter((assignment) => assignment.classId === classId && assignment.kind === 'weekly');
    elements.existingRecurring.innerHTML =
      existing.length === 0
        ? ''
        : `<ul class="existing-recurring">${existing
            .map((assignment) => `<li>${escapeHtml(assignment.title)} · every ${model.formatDays(assignment.days)} · ${model.formatTime(assignment.dueTime)}</li>`)
            .join('')}</ul>
           <p class="hint">To change these, use ⋯ → Edit… on them in your assignments.</p>`;
  }

  function recurringRowToAssignment(row, classId) {
    return model.newRecurringAssignment(row, {
      id: newId('assignment'),
      semesterId: state.currentSemesterId,
      classId,
      todayKey: todayKey(),
      semesterEndDate: currentSemester().endDate,
    });
  }

  // ---------- Forms ----------

  function renderColorOptions(palette) {
    return palette.map(
      (color, index) => `
        <label class="color-option" style="--class-color: ${color.value}" title="${color.name}">
          <input type="radio" name="color" value="${color.value}" ${index === 0 ? 'checked' : ''} aria-label="${color.name}" />
          <span class="swatch" aria-hidden="true"></span>
        </label>`,
    ).join('');
  }

  function selectColor(form, color) {
    const colorInput = [...form.elements.color].find((input) => input.value === color);
    if (colorInput) {
      colorInput.checked = true;
    }
  }

  function setUpPickers() {
    elements.colorPicker.innerHTML = renderColorOptions(model.CLASS_COLORS);
    elements.rsoColorPicker.innerHTML = renderColorOptions(model.RSO_COLORS);
    elements.eventColorPicker.innerHTML = renderColorOptions(model.RSO_COLORS);
    elements.dayPicker.innerHTML = renderDayOptions(ALL_DAYS, [], 'name="days"');
    elements.breakThemePicker.innerHTML = model.BREAK_THEMES.map(
      (theme, index) => `
        <label class="theme-option">
          <input type="radio" name="theme" value="${theme}" ${index === 0 ? 'checked' : ''} />
          <span><span aria-hidden="true">${BREAK_THEME_STYLES[theme].emoji}</span> ${BREAK_THEME_STYLES[theme].label}</span>
        </label>`,
    ).join('');
  }

  function resetAssignmentDates() {
    const form = elements.assignmentForm;
    form.elements.startDate.value = todayKey();
    form.elements.endDate.value = currentSemester().endDate;
  }

  function updateKindFields() {
    const isWeekly = elements.assignmentForm.elements.kind.value === 'weekly';
    elements.onceFields.hidden = isWeekly;
    elements.weeklyFields.hidden = !isWeekly;
  }

  // Reads the form into the fields an assignment of this kind stores.
  function readAssignmentForm(kind) {
    const form = elements.assignmentForm;
    const fields = {
      classId: form.elements.classId.value || null,
      title: form.elements.title.value.trim(),
      link: form.elements.link.value.trim(),
      dueTime: form.elements.dueTime.value,
      lateAllowed: form.elements.lateAllowed.checked,
    };
    if (kind === 'once') {
      fields.dueDate = form.elements.dueDate.value;
    } else {
      fields.days = checkedDays(form, 'input[name="days"]');
      fields.startDate = form.elements.startDate.value;
      fields.endDate = form.elements.endDate.value;
    }
    return fields;
  }

  function clearAssignmentForm() {
    const form = elements.assignmentForm;
    form.elements.title.value = '';
    form.elements.link.value = '';
    form.elements.dueDate.value = '';
    form.querySelectorAll('input[name="days"]').forEach((input) => {
      input.checked = false;
    });
    resetAssignmentDates();
    showErrors(elements.assignmentErrors, []);
  }

  function handleAssignmentSubmit(event) {
    event.preventDefault();
    const kind = elements.assignmentForm.elements.kind.value;
    const fields = readAssignmentForm(kind);
    const errors = model.validateAssignment({ kind, ...fields });
    showErrors(elements.assignmentErrors, errors);
    if (errors.length > 0) {
      return;
    }
    if (editingAssignment) {
      saveAssignmentEdit(fields);
      return;
    }
    const progress = kind === 'once' ? { done: false } : { skippedDates: [], doneDates: [] };
    const assignment = { id: newId('assignment'), semesterId: state.currentSemesterId, kind, ...fields, ...progress };
    applyChange(`Added “${assignment.title}”.`, () => state.assignments.push(assignment));
    // Keep the class, type, time, and late setting so adding several similar assignments is quick.
    clearAssignmentForm();
    elements.assignmentForm.elements.title.focus();
  }

  // Fills the form with an assignment. scope 'date' edits one date of a repeating
  // assignment, so the form shows it as a one-time assignment on that date.
  function startEditingAssignment(assignment, scope, date) {
    editingAssignment = { id: assignment.id, scope, date };
    const form = elements.assignmentForm;
    const editsOneDate = assignment.kind === 'once' || scope === 'date';
    form.elements.title.value = assignment.title;
    form.elements.classId.value = assignment.classId || '';
    form.elements.link.value = assignment.link;
    form.elements.dueTime.value = assignment.dueTime;
    form.elements.lateAllowed.checked = model.allowsLateWork(assignment);
    form.elements.kind.value = editsOneDate ? 'once' : 'weekly';
    if (editsOneDate) {
      form.elements.dueDate.value = assignment.kind === 'once' ? assignment.dueDate : date;
    } else {
      form.querySelectorAll('input[name="days"]').forEach((input) => {
        input.checked = assignment.days.includes(Number(input.value));
      });
      form.elements.startDate.value = assignment.startDate;
      form.elements.endDate.value = assignment.endDate;
    }
    updateKindFields();
    // Switching between one-time and repeating isn't supported while editing.
    elements.kindField.hidden = true;
    elements.assignmentHeading.textContent = scope === 'date' ? `Edit ${model.formatDate(date)} only` : 'Edit assignment';
    elements.assignmentSubmit.textContent = 'Save changes';
    elements.assignmentCancel.hidden = false;
    showErrors(elements.assignmentErrors, []);
    setDrawerOpen(true, 'assignment');
  }

  function stopEditingAssignment() {
    editingAssignment = null;
    elements.kindField.hidden = false;
    elements.assignmentHeading.textContent = 'Add assignment';
    elements.assignmentSubmit.textContent = 'Add assignment';
    elements.assignmentCancel.hidden = true;
    elements.assignmentForm.elements.lateAllowed.checked = true;
    clearAssignmentForm();
    updateKindFields();
    renderDrawerHeading();
  }

  function saveAssignmentEdit(fields) {
    const { id, scope, date } = editingAssignment;
    const assignment = findAssignment(id);
    applyChange(`Saved “${fields.title}”.`, () => {
      if (scope === 'date') {
        const single = model.detachOccurrence(assignment, date, newId('assignment'));
        state.assignments.push(Object.assign(single, fields));
      } else {
        Object.assign(assignment, fields);
      }
    });
    setDrawerOpen(false);
  }

  // ---------- Break form ----------

  function setBreakTheme(theme) {
    const input = elements.breakThemePicker.querySelector(`input[value="${theme}"]`);
    if (input) {
      input.checked = true;
    }
  }

  function startEditingBreak(id) {
    const schoolBreak = state.breaks.find((candidate) => candidate.id === id);
    editingBreakId = id;
    breakThemeChosen = true;
    const form = elements.breakForm;
    form.elements.name.value = schoolBreak.name;
    form.elements.startDate.value = schoolBreak.startDate;
    form.elements.endDate.value = schoolBreak.endDate;
    setBreakTheme(schoolBreak.theme);
    elements.breakHeading.textContent = 'Edit break';
    elements.breakSubmit.textContent = 'Save break';
    elements.breakCancel.hidden = false;
    showErrors(elements.breakErrors, []);
    if (!isDrawerOpen() || drawerSection !== 'break') {
      setDrawerOpen(true, 'break');
    }
    form.elements.name.focus();
  }

  function stopEditingBreak() {
    editingBreakId = null;
    breakThemeChosen = false;
    elements.breakForm.reset();
    setBreakTheme('fall');
    elements.breakHeading.textContent = 'Add break';
    elements.breakSubmit.textContent = 'Add break';
    elements.breakCancel.hidden = true;
    showErrors(elements.breakErrors, []);
  }

  function handleBreakSubmit(event) {
    event.preventDefault();
    const form = elements.breakForm;
    const fields = {
      name: form.elements.name.value.trim(),
      startDate: form.elements.startDate.value,
      endDate: form.elements.endDate.value,
      theme: form.elements.theme.value,
    };
    const errors = model.validateBreak(fields);
    showErrors(elements.breakErrors, errors);
    if (errors.length > 0) {
      return;
    }
    if (editingBreakId) {
      const schoolBreak = state.breaks.find((candidate) => candidate.id === editingBreakId);
      applyChange(`Saved ${fields.name}.`, () => Object.assign(schoolBreak, fields));
    } else {
      applyChange(`Added ${fields.name} ${BREAK_THEME_STYLES[fields.theme].emoji}`, () => {
        state.breaks = [...(state.breaks || []), { id: newId('break'), semesterId: state.currentSemesterId, ...fields }];
      });
    }
    stopEditingBreak();
  }

  // ---------- Exams ----------

  function startEditingExam(id) {
    const exam = state.exams.find((candidate) => candidate.id === id);
    editingExamId = id;
    const form = elements.examForm;
    form.elements.title.value = exam.title;
    form.elements.classId.value = exam.classId;
    form.elements.date.value = exam.date;
    form.elements.startTime.value = exam.startTime;
    form.elements.endTime.value = exam.endTime;
    form.elements.location.value = exam.location;
    elements.examHeading.textContent = 'Edit exam';
    elements.examSubmit.textContent = 'Save exam';
    elements.examCancel.hidden = false;
    showErrors(elements.examErrors, []);
    setDrawerOpen(true, 'exam');
  }

  function stopEditingExam() {
    editingExamId = null;
    elements.examForm.reset();
    elements.examHeading.textContent = 'Add exam';
    elements.examSubmit.textContent = 'Add exam';
    elements.examCancel.hidden = true;
    showErrors(elements.examErrors, []);
    renderClassOptions();
    renderDrawerHeading();
  }

  function handleExamSubmit(event) {
    event.preventDefault();
    const form = elements.examForm;
    const fields = {
      title: form.elements.title.value.trim(),
      classId: form.elements.classId.value || null,
      date: form.elements.date.value,
      startTime: form.elements.startTime.value,
      endTime: form.elements.endTime.value,
      location: form.elements.location.value.trim(),
    };
    const errors = model.validateExam(fields);
    showErrors(elements.examErrors, errors);
    if (errors.length > 0) {
      return;
    }
    if (editingExamId) {
      const exam = state.exams.find((candidate) => candidate.id === editingExamId);
      applyChange(`Saved ${fields.title}.`, () => Object.assign(exam, fields));
      setDrawerOpen(false);
    } else {
      applyChange(`Added ${fields.title} on ${model.formatDate(fields.date)}.`, () => {
        state.exams = [...(state.exams || []), { id: newId('exam'), semesterId: state.currentSemesterId, ...fields }];
      });
      // Keep the class so adding several exams for one class is quick.
      ['title', 'date', 'startTime', 'endTime', 'location'].forEach((name) => {
        form.elements[name].value = '';
      });
      form.elements.title.focus();
    }
  }

  // Reads a form's meeting rows. Each meeting keeps its cancelled dates; the form doesn't
  // show them, so it can't carry them.
  function readMeetingsKeepingCancellations(list, previousMeetings) {
    return readMeetingRows(list).map((meeting) => ({
      ...meeting,
      cancelledDates: previousMeetings.find((previous) => previous.id === meeting.id)?.cancelledDates || [],
    }));
  }

  function meetingErrors(meetings) {
    return meetings.flatMap((meeting, index) => {
      const which = meeting.label || `Meeting ${index + 1}`;
      return model.validateMeeting(meeting).map((error) => `${which}: ${error}`);
    });
  }

  function startEditingClass(id) {
    const plannerClass = state.classes.find((candidate) => candidate.id === id);
    editingClassId = id;
    elements.classForm.elements.name.value = plannerClass.name;
    selectColor(elements.classForm, plannerClass.color);
    renderMeetingRows(elements.meetingList, plannerClass.meetings || []);
    renderRecurringRows([]);
    renderExistingRecurring(id);
    elements.classFormLabel.textContent = `Edit ${plannerClass.name}`;
    elements.classSubmit.textContent = 'Save class';
    elements.classCancel.hidden = false;
    elements.classForm.elements.name.focus();
  }

  function stopEditingClass() {
    editingClassId = null;
    elements.classForm.reset();
    renderMeetingRows(elements.meetingList, []);
    renderRecurringRows([]);
    elements.existingRecurring.innerHTML = '';
    elements.classFormLabel.textContent = 'New class';
    elements.classSubmit.textContent = 'Add class';
    elements.classCancel.hidden = true;
    showErrors(elements.classErrors, []);
  }

  function handleClassSubmit(event) {
    event.preventDefault();
    const name = elements.classForm.elements.name.value.trim();
    const color = elements.classForm.elements.color.value;
    const duplicate = currentClasses().some(
      (plannerClass) => plannerClass.id !== editingClassId && plannerClass.name.toLowerCase() === name.toLowerCase(),
    );
    const previousMeetings = editingClassId ? state.classes.find((candidate) => candidate.id === editingClassId).meetings || [] : [];
    const meetings = readMeetingsKeepingCancellations(elements.meetingList, previousMeetings);
    const errors = [];
    if (!name) {
      errors.push('Give the class a name.');
    } else if (duplicate) {
      errors.push(`You already have a class called ${name}.`);
    }
    errors.push(...meetingErrors(meetings));
    const classId = editingClassId || newId('class');
    const recurring = readRecurringRows().map((row) => recurringRowToAssignment(row, classId));
    recurring.forEach((assignment, index) => {
      const which = assignment.title || `Recurring assignment ${index + 1}`;
      model.validateAssignment(assignment).forEach((error) => errors.push(`${which}: ${error}`));
    });
    showErrors(elements.classErrors, errors);
    if (errors.length > 0) {
      return;
    }
    const verb = editingClassId ? 'Saved' : 'Added';
    const extra = recurring.length > 0 ? ` and ${recurring.length} recurring assignment${recurring.length === 1 ? '' : 's'}` : '';
    // One change, so a single Undo removes the class and its new assignments together.
    applyChange(`${verb} ${name}${extra}.`, () => {
      if (editingClassId) {
        Object.assign(state.classes.find((candidate) => candidate.id === editingClassId), { name, color, meetings });
      } else {
        state.classes.push({ id: classId, semesterId: state.currentSemesterId, name, color, meetings });
      }
      state.assignments.push(...recurring);
    });
    stopEditingClass();
  }

  // ---------- RSOs ----------

  function renderRsos() {
    const rsos = state.rsos || [];
    elements.rsoList.innerHTML =
      rsos.length === 0
        ? '<li class="empty">No RSOs yet. Add your first one above.</li>'
        : rsos
            .map((rso) => {
              const eventCount = (rso.events || []).length;
              return `
                <li class="class-item" style="--class-color: ${rso.color}">
                  <span class="swatch" aria-hidden="true"></span>
                  <span class="class-info">
                    <span class="class-name">${escapeHtml(rso.name)}</span>
                    <span class="class-count">Until end of ${rso.lasts === 'year' ? 'school year' : 'semester'}${eventCount > 0 ? ` · ${eventCount} event${eventCount === 1 ? '' : 's'}` : ''}</span>
                    ${rso.meetings.map((meeting) => `<span class="class-meeting">${describeMeeting(meeting)}</span>`).join('')}
                  </span>
                  <button type="button" class="text-button" data-action="edit-rso" data-id="${rso.id}">Edit</button>
                  <button type="button" class="text-button danger" data-action="delete-rso" data-id="${rso.id}">Delete</button>
                </li>`;
            })
            .join('');
  }

  function startEditingRso(id) {
    const rso = state.rsos.find((candidate) => candidate.id === id);
    editingRsoId = id;
    const form = elements.rsoForm;
    form.elements.name.value = rso.name;
    selectColor(form, rso.color);
    form.elements.lasts.value = rso.lasts;
    renderMeetingRows(elements.rsoMeetingList, rso.meetings, ALL_DAYS);
    renderRsoEventRows(rso.events || []);
    elements.rsoFormLabel.textContent = `Edit ${rso.name}`;
    elements.rsoSubmit.textContent = 'Save RSO';
    elements.rsoCancel.hidden = false;
    showErrors(elements.rsoErrors, []);
    if (!isDrawerOpen() || drawerSection !== 'rso') {
      setDrawerOpen(true, 'rso');
    }
    form.elements.name.focus();
  }

  function stopEditingRso() {
    editingRsoId = null;
    elements.rsoForm.reset();
    renderMeetingRows(elements.rsoMeetingList, [], ALL_DAYS);
    renderRsoEventRows([]);
    elements.rsoFormLabel.textContent = 'New RSO';
    elements.rsoSubmit.textContent = 'Add RSO';
    elements.rsoCancel.hidden = true;
    showErrors(elements.rsoErrors, []);
  }

  function handleRsoSubmit(event) {
    event.preventDefault();
    const form = elements.rsoForm;
    const name = form.elements.name.value.trim();
    const existing = editingRsoId ? state.rsos.find((candidate) => candidate.id === editingRsoId) : null;
    const meetings = readMeetingsKeepingCancellations(elements.rsoMeetingList, existing ? existing.meetings : []);
    const events = readRsoEventRows();
    const errors = [];
    if (!name) {
      errors.push('Give the RSO a name.');
    } else if ((state.rsos || []).some((rso) => rso.id !== editingRsoId && rso.name.toLowerCase() === name.toLowerCase())) {
      errors.push(`You already have an RSO called ${name}.`);
    }
    errors.push(...meetingErrors(meetings));
    events.forEach((rsoEvent, index) => {
      const which = rsoEvent.title || `Event ${index + 1}`;
      model.validateEvent(rsoEvent).forEach((error) => errors.push(`${which}: ${error}`));
    });
    showErrors(elements.rsoErrors, errors);
    if (errors.length > 0) {
      return;
    }
    const fields = { name, color: form.elements.color.value, lasts: form.elements.lasts.value, meetings, events };
    if (existing) {
      applyChange(`Saved ${name}.`, () => Object.assign(existing, fields));
    } else {
      applyChange(`Added ${name}.`, () => {
        state.rsos = [...(state.rsos || []), { id: newId('rso'), semesterId: state.currentSemesterId, ...fields }];
      });
    }
    stopEditingRso();
  }

  // ---------- Standalone events ----------

  function startEditingEvent(id) {
    const standalone = state.events.find((candidate) => candidate.id === id);
    editingEventId = id;
    const form = elements.eventForm;
    ['title', 'date', 'startTime', 'endTime', 'location'].forEach((field) => {
      form.elements[field].value = standalone[field];
    });
    selectColor(form, standalone.color);
    elements.eventHeading.textContent = 'Edit event';
    elements.eventSubmit.textContent = 'Save event';
    elements.eventCancel.hidden = false;
    showErrors(elements.eventErrors, []);
    setDrawerOpen(true, 'event');
  }

  function stopEditingEvent() {
    editingEventId = null;
    elements.eventForm.reset();
    elements.eventHeading.textContent = 'Add event';
    elements.eventSubmit.textContent = 'Add event';
    elements.eventCancel.hidden = true;
    showErrors(elements.eventErrors, []);
    renderDrawerHeading();
  }

  function handleEventSubmit(event) {
    event.preventDefault();
    const form = elements.eventForm;
    const fields = {
      title: form.elements.title.value.trim(),
      color: form.elements.color.value,
      date: form.elements.date.value,
      startTime: form.elements.startTime.value,
      endTime: form.elements.endTime.value,
      location: form.elements.location.value.trim(),
    };
    const errors = model.validateEvent(fields);
    showErrors(elements.eventErrors, errors);
    if (errors.length > 0) {
      return;
    }
    if (editingEventId) {
      const standalone = state.events.find((candidate) => candidate.id === editingEventId);
      applyChange(`Saved ${fields.title}.`, () => Object.assign(standalone, fields));
      setDrawerOpen(false);
    } else {
      applyChange(`Added ${fields.title} on ${model.formatDate(fields.date)}.`, () => {
        state.events = [...(state.events || []), { id: newId('event'), ...fields }];
      });
      ['title', 'date', 'startTime', 'endTime', 'location'].forEach((field) => {
        form.elements[field].value = '';
      });
      form.elements.title.focus();
    }
  }

  function openSemesterDialog() {
    const semester = currentSemester();
    const form = elements.semesterForm;
    form.elements.name.value = semester.name;
    form.elements.startDate.value = semester.startDate;
    form.elements.endDate.value = semester.endDate;
    form.elements.schoolYearEndDate.value = model.schoolYearEnd(semester);
    showErrors(elements.semesterErrors, []);
    elements.semesterDialog.showModal();
  }

  function handleSemesterSubmit(event) {
    event.preventDefault();
    const form = elements.semesterForm;
    const name = form.elements.name.value.trim();
    const startDate = form.elements.startDate.value;
    const endDate = form.elements.endDate.value;
    const schoolYearEndDate = form.elements.schoolYearEndDate.value;
    const errors = [];
    if (!name) {
      errors.push('Give the semester a name, like Fall 2026.');
    }
    if (!model.isValidDateKey(startDate) || !model.isValidDateKey(endDate)) {
      errors.push('Pick a start and end date.');
    } else if (startDate > endDate) {
      errors.push('The end date must be after the start date.');
    } else if (!model.isValidDateKey(schoolYearEndDate)) {
      errors.push('Pick when the school year ends.');
    } else if (schoolYearEndDate < endDate) {
      errors.push('The school year can’t end before the semester does.');
    }
    showErrors(elements.semesterErrors, errors);
    if (errors.length > 0) {
      return;
    }
    applyChange('Semester saved.', () => Object.assign(currentSemester(), { name, startDate, endDate, schoolYearEndDate }));
    elements.semesterDialog.close();
    resetAssignmentDates();
  }

  // ---------- Clicks in lists ----------

  async function handleListAction(target) {
    const action = target.dataset.action;
    const { id, date } = target.dataset;
    const assignment = id ? findAssignment(id) : null;

    if (action === 'toggle-done') {
      const nowDone = target.checked;
      applyChange(nowDone ? `Done: ${assignment.title} 🎉` : `Marked not done: ${assignment.title}`, () => {
        if (assignment.kind === 'once') {
          assignment.done = nowDone;
        } else if (nowDone) {
          assignment.doneDates.push(date);
        } else {
          assignment.doneDates = assignment.doneDates.filter((doneDate) => doneDate !== date);
        }
      });
    } else if (action === 'skip') {
      applyChange(`Skipped ${assignment.title} on ${model.formatDate(date)}.`, () => {
        assignment.skippedDates.push(date);
        assignment.doneDates = assignment.doneDates.filter((doneDate) => doneDate !== date);
      });
    } else if (action === 'delete-assignment') {
      applyChange(`Deleted “${assignment.title}”.`, () => {
        state.assignments = state.assignments.filter((candidate) => candidate.id !== id);
      });
    } else if (action === 'delete-series') {
      const count = model.occurrenceDates(assignment).length;
      const message = `Delete all ${count} dates of “${assignment.title}” (every ${model.formatDays(assignment.days)})?`;
      if (await askToConfirm(message, 'Delete all')) {
        applyChange(`Deleted every “${assignment.title}”.`, () => {
          state.assignments = state.assignments.filter((candidate) => candidate.id !== id);
        });
      }
    } else if (action === 'edit-class') {
      // From the calendar, the Add panel may be closed or showing assignments.
      if (!isDrawerOpen() || drawerSection !== 'class') {
        setDrawerOpen(true, 'class');
      }
      startEditingClass(id);
      elements.classForm.scrollIntoView({ block: 'start' });
    } else if (action === 'cancel-meeting' || action === 'restore-meeting') {
      const owners = target.dataset.owner === 'rso' ? state.rsos : state.classes;
      const owner = owners.find((candidate) => candidate.id === target.dataset.ownerId);
      const meeting = owner.meetings.find((candidate) => candidate.id === target.dataset.meetingId);
      const cancelling = action === 'cancel-meeting';
      applyChange(`${cancelling ? 'Cancelled' : 'Restored'} ${owner.name} on ${model.formatDate(date)}.`, () => {
        const others = (meeting.cancelledDates || []).filter((cancelledDate) => cancelledDate !== date);
        meeting.cancelledDates = cancelling ? [...others, date] : others;
      });
    } else if (action === 'delete-class') {
      const plannerClass = state.classes.find((candidate) => candidate.id === id);
      const count = state.assignments.filter((candidate) => candidate.classId === id).length;
      const examCount = (state.exams || []).filter((exam) => exam.classId === id).length;
      const parts = [];
      if (count > 0) {
        parts.push(`${count} assignment${count === 1 ? '' : 's'}`);
      }
      if (examCount > 0) {
        parts.push(`${examCount} exam${examCount === 1 ? '' : 's'}`);
      }
      const warning = parts.length > 0 ? ` This also deletes its ${parts.join(' and ')}.` : '';
      if (await askToConfirm(`Delete ${plannerClass.name}?${warning}`, 'Delete class')) {
        if (editingClassId === id) {
          stopEditingClass();
        }
        applyChange(`Deleted ${plannerClass.name}.`, () => {
          state.classes = state.classes.filter((candidate) => candidate.id !== id);
          state.assignments = state.assignments.filter((candidate) => candidate.classId !== id);
          state.exams = (state.exams || []).filter((exam) => exam.classId !== id);
        });
      }
    } else if (action === 'edit-assignment') {
      let scope = 'all';
      if (assignment.kind === 'weekly') {
        scope = await askChoice(`Edit “${assignment.title}” for…`, [
          { value: 'date', label: `Only ${model.formatDate(date)}`, className: 'primary-button' },
          { value: 'all', label: `All dates (every ${model.formatDays(assignment.days)})`, className: 'secondary-button' },
        ]);
      }
      if (scope) {
        startEditingAssignment(assignment, scope, date);
      }
    } else if (action === 'edit-break') {
      startEditingBreak(id);
    } else if (action === 'delete-break') {
      const schoolBreak = state.breaks.find((candidate) => candidate.id === id);
      if (editingBreakId === id) {
        stopEditingBreak();
      }
      applyChange(`Deleted ${schoolBreak.name}.`, () => {
        state.breaks = state.breaks.filter((candidate) => candidate.id !== id);
      });
    } else if (action === 'edit-rso') {
      startEditingRso(id);
      elements.rsoForm.scrollIntoView({ block: 'start' });
    } else if (action === 'delete-rso') {
      const rso = state.rsos.find((candidate) => candidate.id === id);
      const eventCount = (rso.events || []).length;
      const warning = eventCount > 0 ? ` This also deletes its ${eventCount} event${eventCount === 1 ? '' : 's'}.` : '';
      if (await askToConfirm(`Delete ${rso.name}?${warning}`, 'Delete RSO')) {
        if (editingRsoId === id) {
          stopEditingRso();
        }
        applyChange(`Deleted ${rso.name}.`, () => {
          state.rsos = state.rsos.filter((candidate) => candidate.id !== id);
        });
      }
    } else if (action === 'edit-event') {
      startEditingEvent(id);
    } else if (action === 'delete-event') {
      const rso = target.dataset.rsoId ? state.rsos.find((candidate) => candidate.id === target.dataset.rsoId) : null;
      const events = rso ? rso.events : state.events;
      const doomed = events.find((candidate) => candidate.id === id);
      if (editingRsoId === rso?.id) {
        stopEditingRso();
      }
      applyChange(`Deleted ${doomed.title}.`, () => {
        if (rso) {
          rso.events = rso.events.filter((candidate) => candidate.id !== id);
        } else {
          state.events = state.events.filter((candidate) => candidate.id !== id);
        }
      });
    } else if (action === 'edit-exam') {
      startEditingExam(id);
    } else if (action === 'delete-exam') {
      const exam = state.exams.find((candidate) => candidate.id === id);
      applyChange(`Deleted ${exam.title}.`, () => {
        state.exams = state.exams.filter((candidate) => candidate.id !== id);
      });
    } else if (action === 'open-drawer') {
      if (editingAssignment) {
        stopEditingAssignment();
      }
      if (editingExamId) {
        stopEditingExam();
      }
      if (editingBreakId) {
        stopEditingBreak();
      }
      if (editingEventId) {
        stopEditingEvent();
      }
      setDrawerOpen(true, target.dataset.section || 'assignment');
    } else if (action === 'set-view') {
      currentView = target.dataset.view;
      savePreference(VIEW_STORAGE_KEY, currentView);
      renderDueList();
    } else if (action === 'set-tab') {
      currentTab = target.dataset.tab;
      savePreference(TAB_STORAGE_KEY, currentTab);
      renderTabs();
    } else if (action === 'previous-week' || action === 'next-week') {
      weekStart = model.addDays(weekStart, action === 'next-week' ? 7 : -7);
      renderDueList();
      renderCalendar();
    } else if (action === 'this-week') {
      weekStart = model.startOfWeek(todayKey());
      renderDueList();
      renderCalendar();
    } else if (action === 'toggle-later') {
      showLater = !showLater;
      renderDueList();
    } else if (action === 'toggle-missed') {
      showMissed = !showMissed;
      renderDueList();
    } else if (action === 'toggle-done-section') {
      showDone = !showDone;
      renderDueList();
    }
  }

  // ---------- Start ----------

  setUpPickers();
  resetAssignmentDates();
  if (loaded.error) {
    elements.banner.textContent = loaded.error;
    elements.banner.hidden = false;
  }

  elements.assignmentForm.addEventListener('submit', handleAssignmentSubmit);
  elements.assignmentForm.addEventListener('change', (event) => {
    if (event.target.name === 'kind') {
      updateKindFields();
    }
  });
  elements.classForm.addEventListener('submit', handleClassSubmit);
  elements.examForm.addEventListener('submit', handleExamSubmit);
  elements.breakForm.addEventListener('submit', handleBreakSubmit);
  elements.breakCancel.addEventListener('click', stopEditingBreak);
  elements.breakForm.addEventListener('change', (event) => {
    if (event.target.name === 'theme') {
      breakThemeChosen = true;
    } else if (event.target.name === 'startDate' && !breakThemeChosen && model.isValidDateKey(event.target.value)) {
      setBreakTheme(model.guessBreakTheme(event.target.value));
    }
  });
  elements.examCancel.addEventListener('click', () => setDrawerOpen(false));
  elements.classCancel.addEventListener('click', stopEditingClass);
  elements.semesterButton.addEventListener('click', openSemesterDialog);
  elements.semesterForm.addEventListener('submit', handleSemesterSubmit);
  document.getElementById('semester-cancel').addEventListener('click', () => elements.semesterDialog.close());
  document.getElementById('drawer-close').addEventListener('click', () => setDrawerOpen(false));
  elements.assignmentCancel.addEventListener('click', () => setDrawerOpen(false));
  document.getElementById('add-meeting').addEventListener('click', () => addMeetingRow(elements.meetingList, MEETING_DAYS, 'Lecture'));
  document.getElementById('add-rso-meeting').addEventListener('click', () => addMeetingRow(elements.rsoMeetingList, ALL_DAYS, 'General meeting'));
  document.getElementById('add-rso-event').addEventListener('click', addRsoEventRow);
  elements.rsoForm.addEventListener('submit', handleRsoSubmit);
  elements.rsoCancel.addEventListener('click', stopEditingRso);
  elements.eventForm.addEventListener('submit', handleEventSubmit);
  elements.eventCancel.addEventListener('click', () => setDrawerOpen(false));
  elements.rsoMeetingList.addEventListener('change', (event) => {
    if (event.target.matches('.meeting-every')) {
      const firstField = event.target.closest('.meeting-row').querySelector('.meeting-first-field');
      firstField.hidden = event.target.value !== '2';
      if (!firstField.hidden) {
        firstField.querySelector('input').focus();
      }
    }
  });
  elements.rsoEventList.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-rso-event-action="remove"]');
    if (removeButton) {
      removeRsoEventRow(removeButton.closest('.rso-event-row'));
    }
  });
  document.getElementById('add-recurring').addEventListener('click', addRecurringRow);
  elements.recurringList.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-recurring-action="remove"]');
    if (removeButton) {
      removeRecurringRow(removeButton.closest('.recurring-row'));
    }
  });
  [
    [elements.meetingList, MEETING_DAYS],
    [elements.rsoMeetingList, ALL_DAYS],
  ].forEach(([list, days]) => {
    list.addEventListener('click', (event) => {
      const removeButton = event.target.closest('[data-meeting-action="remove"]');
      if (removeButton) {
        removeMeetingRow(list, removeButton.closest('.meeting-row'), days);
      }
    });
  });
  elements.confirmChoices.addEventListener('click', (event) => {
    const button = event.target.closest('[data-choice]');
    if (button) {
      finishChoice(button.dataset.choice === 'cancel' ? null : button.dataset.choice);
    }
  });
  // Escape closes the box; treat that as Cancel.
  elements.confirmDialog.addEventListener('cancel', () => finishChoice(null));
  elements.confirmDialog.addEventListener('close', () => finishChoice(null));
  // Redraw each minute so items turn overdue or missed when their due time passes and
  // the calendar's "now" line and next class stay current, unless a menu is open
  // (redrawing would close it).
  setInterval(() => {
    if (!document.querySelector('.row-menu[open]')) {
      renderDueList();
      renderCalendar();
    }
  }, 60 * 1000);
  // 'toggle' doesn't bubble, so listen during the capture phase to catch every ⋯ menu.
  document.addEventListener(
    'toggle',
    (event) => {
      if (event.target.matches('.row-menu') && event.target.open) {
        positionMenu(event.target);
      }
    },
    true,
  );
  document.addEventListener('scroll', closeMenus, true);
  window.addEventListener('resize', closeMenus);
  document.addEventListener('keydown', (event) => {
    // Pop-up boxes handle Escape themselves, so only close the panel when none is open.
    if (event.key === 'Escape' && isDrawerOpen() && !document.querySelector('dialog[open]')) {
      setDrawerOpen(false);
    }
  });
  document.addEventListener('click', (event) => {
    document.querySelectorAll('.row-menu[open], .add-menu[open]').forEach((menu) => {
      if (!menu.contains(event.target) || event.target.closest('[data-action]')) {
        menu.open = false;
      }
    });
    const target = event.target.closest('[data-action]');
    if (target && target.dataset.action !== 'toggle-done') {
      handleListAction(target);
    }
  });
  document.addEventListener('change', (event) => {
    if (event.target.dataset.action === 'toggle-done') {
      handleListAction(event.target);
    }
  });

  render();
})();

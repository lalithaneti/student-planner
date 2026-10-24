// Connects the page to the planner data: draws the screen and handles forms and clicks.
// Every change follows the same steps: change the data, save it, redraw the screen.

(() => {
  const model = PlannerModel;
  const themes = PlannerThemes;
  const buddy = PlannerBuddy;

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
  const WEATHER_REFRESH_MS = 30 * 60 * 1000;
  const LOCATION_TIMEOUT_MS = 15 * 1000;
  const VIEW_STORAGE_KEY = 'student-planner-view';
  // Height of one hour on the calendar, in pixels.
  const HOUR_HEIGHT = 56;
  const MEETING_DAYS = [1, 2, 3, 4, 5];
  // Week starts on Monday, the way most class schedules are written.
  const ALL_DAYS = [1, 2, 3, 4, 5, 6, 0];

  const loaded = PlannerStorage.load(new Date());
  let state = loaded.state;
  // Planners from before the Study Buddy get one that starts counting today.
  if (!state.buddy) {
    state.buddy = buddy.newBuddy(model.toDateKey(new Date()));
    PlannerStorage.save(state);
  }
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
  // Weather for Home: { status: 'loading' | 'ready' | 'denied' | 'unavailable', ...readWeather's fields }.
  let weather = { status: 'loading' };
  // The greeting slides in once when the app opens, not again at each minute's redraw.
  let greetingHasArrived = false;
  let resolveChoice = null;
  let currentView = loadSavedPreference(VIEW_STORAGE_KEY, ['list', 'week']);
  // The app always opens on Home.
  let currentTab = 'home';
  let weekStart = model.startOfWeek(todayKey());

  const elements = {
    backupStatus: document.getElementById('backup-status'),
    restoreBackupInput: document.getElementById('restore-backup'),
    quickAddDialog: document.getElementById('quick-add-dialog'),
    quickAddForm: document.getElementById('quick-add-form'),
    quickAddDays: document.getElementById('quick-add-days'),
    quickAddErrors: document.getElementById('quick-add-errors'),
    semesterLabel: document.getElementById('semester-label'),
    semesterButton: document.getElementById('semester-button'),
    semesterDialog: document.getElementById('semester-dialog'),
    semesterList: document.getElementById('semester-list'),
    newSemesterDialog: document.getElementById('new-semester-dialog'),
    newSemesterForm: document.getElementById('new-semester-form'),
    newSemesterRsos: document.getElementById('new-semester-rsos'),
    newSemesterRsosField: document.getElementById('new-semester-rsos-field'),
    newSemesterErrors: document.getElementById('new-semester-errors'),
    semesterForm: document.getElementById('semester-form'),
    semesterErrors: document.getElementById('semester-errors'),
    banner: document.getElementById('banner'),
    dueList: document.getElementById('due-list'),
    viewButtons: document.querySelectorAll('[data-action="set-view"]'),
    tabButtons: document.querySelectorAll('[data-action="set-tab"]'),
    homePanel: document.getElementById('home-panel'),
    home: document.getElementById('home'),
    assignmentsPanel: document.getElementById('assignments-panel'),
    calendarPanel: document.getElementById('calendar-panel'),
    calendar: document.getElementById('calendar'),
    buddyPanel: document.getElementById('buddy-panel'),
    buddy: document.getElementById('buddy'),
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
    classExamList: document.getElementById('class-exam-list'),
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

  // Applies a change, saves it, redraws, and shows a message with Undo. The message can
  // be a function, for messages that depend on the result of the change.
  function applyChange(message, change) {
    const before = JSON.stringify(state);
    change();
    if (!PlannerStorage.save(state)) {
      showToast('Couldn’t save. Your browser may be out of storage or blocking it.', null);
    } else {
      showToast(typeof message === 'function' ? message() : message, before);
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
    renderHome();
    renderBuddy();
  }

  function renderTabs() {
    elements.tabButtons.forEach((button) => button.setAttribute('aria-selected', String(button.dataset.tab === currentTab)));
    elements.homePanel.hidden = currentTab !== 'home';
    elements.assignmentsPanel.hidden = currentTab !== 'assignments';
    elements.calendarPanel.hidden = currentTab !== 'calendar';
    elements.buddyPanel.hidden = currentTab !== 'buddy';
    document.body.classList.toggle('calendar-tab', currentTab === 'calendar');
    document.body.classList.toggle('home-tab', currentTab === 'home');
  }

  function renderSemester() {
    const semester = currentSemester();
    elements.semesterLabel.textContent = `${semester.name} · ${model.formatMonthDay(semester.startDate)} – ${model.formatMonthDay(semester.endDate)}`;
    elements.rsoLastsHint.textContent = `This school year ends ${model.formatDate(model.schoolYearEnd(semester))}; ${semester.name} ends ${model.formatDate(semester.endDate)}. Change them with the semester button (✎).`;
    const semesters = [...state.semesters].sort((a, b) => b.startDate.localeCompare(a.startDate));
    elements.semesterList.innerHTML = semesters
      .map(
        (candidate) => `
          <li class="class-item">
            <span class="class-info">
              <span class="class-name">${escapeHtml(candidate.name)}</span>
              <span class="class-count">${model.formatMonthDay(candidate.startDate)} – ${model.formatMonthDay(candidate.endDate)}</span>
            </span>
            ${
              candidate.id === semester.id
                ? '<span class="current-tag">Viewing</span>'
                : `<button type="button" class="text-button" data-action="switch-semester" data-id="${candidate.id}">Switch to ${escapeHtml(candidate.name)}</button>`
            }
          </li>`,
      )
      .join('');
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

  // A negative animation delay that picks up where the clock says an animation should be,
  // so the once-a-minute redraw continues animations instead of restarting them.
  function clockDelay(duration, offset = 0) {
    return -((Date.now() / 1000 + offset) % duration);
  }

  // A break theme's decorations (leaves, snowflakes, blossoms...) drifting down behind
  // something. Spread out evenly-ish but not in a grid, with staggered timing so they
  // don't fall in step.
  function renderFallingDecorations(style) {
    const falling = Array.from({ length: BANNER_DECORATION_COUNT }, (_, index) => {
      const symbol = style.decorations[index % style.decorations.length];
      const left = (index * 37 + 5) % 100;
      const duration = 7 + (index % 4) * 1.5;
      const size = 14 + (index % 3) * 5;
      return `<span class="falling-decoration" style="left: ${left}%; animation-delay: ${clockDelay(duration, index * 1.7)}s; animation-duration: ${duration}s; font-size: ${size}px">${symbol}</span>`;
    }).join('');
    return `<div class="banner-decorations" aria-hidden="true">${falling}</div>`;
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
    return `
      <div class="break-banner">
        ${renderFallingDecorations(style)}
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

  // "★ Exams: MATH 241 Midterm 1 · Thu, Nov 5, 7:00 PM · in 5 days", for the next 30 days.
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
    return `<div class="countdowns"><span class="countdowns-title">★ Exams</span><ul>${rows}</ul></div>`;
  }

  // ---------- Home ----------

  // The greeting's sky follows the time of day: sunrise until noon, daytime until 5 PM, then night.
  function skyPeriod(hour) {
    if (hour >= 5 && hour < 12) {
      return { name: 'morning', greeting: 'Good morning!' };
    }
    if (hour >= 12 && hour < 17) {
      return { name: 'afternoon', greeting: 'Good afternoon!' };
    }
    return { name: 'evening', greeting: hour < 5 ? 'Up late?' : 'Good evening!' };
  }

  // How long (seconds) each calm, repeating sky animation takes: a wave through the
  // greeting's letters, the sky's colors drifting, and something flying across.
  const GREETING_WAVE_SECONDS = 6;
  const SKY_SHIFT_SECONDS = 20;
  const SKY_FLYER_SECONDS = 12;

  // One thing at a time crosses the sky: a shooting star at night; by day, a bird or a
  // plane, taking turns each minute.
  function renderSkyFlyer(period) {
    const delay = `animation-delay: ${clockDelay(SKY_FLYER_SECONDS, 4)}s`;
    if (period === 'evening') {
      return `<span class="sky-flyer shooting-star" style="${delay}"></span>`;
    }
    return new Date().getMinutes() % 2 === 0
      ? `<span class="sky-flyer sky-bird" style="${delay}">🐦</span>`
      : `<span class="sky-flyer sky-plane" style="${delay}">✈️</span>`;
  }

  // Each letter in its own span, so a wave can roll through them one after another.
  function renderWavingText(text) {
    const waveStart = clockDelay(GREETING_WAVE_SECONDS);
    return [...text]
      .map((letter, index) => `<span class="sky-letter" style="animation-delay: ${waveStart + index * 0.07}s">${letter === ' ' ? '&nbsp;' : escapeHtml(letter)}</span>`)
      .join('');
  }

  // Sun, clouds, or moon and stars for the greeting's sky, animated in step with the clock.
  function renderSkyDecorations(period) {
    if (period === 'evening') {
      const stars = Array.from({ length: 18 }, (_, index) => {
        const duration = 2 + (index % 4) * 0.7;
        return `<span class="sky-star" style="left: ${(index * 41 + 7) % 100}%; top: ${(index * 23 + 9) % 85}%; animation-delay: ${clockDelay(duration, index)}s; animation-duration: ${duration}s"></span>`;
      }).join('');
      return `${stars}<span class="sky-moon">🌙</span>${renderSkyFlyer(period)}`;
    }
    const clouds = Array.from({ length: period === 'afternoon' ? 4 : 2 }, (_, index) => {
      const duration = 40 + index * 12;
      return `<span class="sky-cloud" style="top: ${12 + index * 19}%; animation-delay: ${clockDelay(duration, index * 15)}s; animation-duration: ${duration}s; font-size: ${30 + (index % 2) * 14}px">☁️</span>`;
    }).join('');
    return `<span class="sky-sun">☀️</span>${clouds}${renderSkyFlyer(period)}`;
  }

  // ---------- Weather ----------

  function renderWeather() {
    switch (weather.status) {
      case 'ready':
        return `<span aria-hidden="true">${weather.icon}</span> <strong>${weather.temperature}°F</strong> · ${weather.label} · H ${weather.high}° L ${weather.low}°`;
      case 'denied':
        // Once location is blocked, browsers don't ask again until it's allowed in the site settings.
        return 'Allow location to see the weather (in your browser’s settings for this site). <button type="button" class="sky-button" data-action="retry-weather">Try again</button>';
      case 'unavailable':
        return 'Weather unavailable right now. <button type="button" class="sky-button" data-action="retry-weather">Try again</button>';
      default:
        return 'Checking the weather…';
    }
  }

  // Updates just the weather line, so a redraw doesn't close any open ⋯ menu.
  function showWeather(next) {
    weather = next;
    const line = document.getElementById('sky-weather');
    if (line) {
      line.innerHTML = renderWeather();
    }
  }

  async function fetchWeather(position) {
    try {
      const response = await fetch(model.weatherUrl(position.coords.latitude, position.coords.longitude));
      const reading = response.ok ? model.readWeather(await response.json()) : null;
      showWeather(reading ? { status: 'ready', ...reading } : { status: 'unavailable' });
    } catch {
      showWeather({ status: 'unavailable' });
    }
  }

  // Asks the browser where we are (it asks the person the first time), then gets the weather there.
  function loadWeather() {
    if (!('geolocation' in navigator)) {
      showWeather({ status: 'unavailable' });
      return;
    }
    if (weather.status !== 'ready') {
      showWeather({ status: 'loading' });
    }
    navigator.geolocation.getCurrentPosition(
      fetchWeather,
      (error) => showWeather({ status: error.code === error.PERMISSION_DENIED ? 'denied' : 'unavailable' }),
      { timeout: LOCATION_TIMEOUT_MS, maximumAge: WEATHER_REFRESH_MS },
    );
  }

  function renderGreeting(now, nowTime) {
    const period = skyPeriod(now.getHours());
    const html = `
      <div class="sky sky-${period.name}" style="animation-delay: ${clockDelay(SKY_SHIFT_SECONDS * 2)}s">
        <div class="sky-decorations" aria-hidden="true">${renderSkyDecorations(period.name)}</div>
        <h2 class="sky-greeting${greetingHasArrived ? '' : ' is-arriving'}" aria-label="${period.greeting}">
          <span aria-hidden="true">${renderWavingText(period.greeting)}</span>
        </h2>
        <p class="sky-date">${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · ${model.formatTime(nowTime)}</p>
        <p class="sky-weather" id="sky-weather" aria-live="polite">${renderWeather()}</p>
      </div>`;
    greetingHasArrived = true;
    return html;
  }

  // A big card in the next break's theme: "30 days until Thanksgiving break", or during it, "Back in 4 days".
  function renderBreakCountdown() {
    const upcoming = model.upcomingBreak(state, todayKey());
    if (!upcoming) {
      return '';
    }
    const { schoolBreak } = upcoming;
    const style = BREAK_THEME_STYLES[schoolBreak.theme];
    const [number, words] = upcoming.ongoing
      ? [upcoming.daysLeft, `more day${upcoming.daysLeft === 1 ? '' : 's'} of ${escapeHtml(schoolBreak.name)}! It’s here ${style.emoji}`]
      : [upcoming.daysUntil, `day${upcoming.daysUntil === 1 ? '' : 's'} until ${escapeHtml(schoolBreak.name)} ${style.emoji}`];
    const dates = upcoming.ongoing ? `Last day ${model.formatDate(schoolBreak.endDate)}` : breakDateRange(schoolBreak);
    return `
      <div class="break-countdown" style="--break-from: ${style.colors[0]}; --break-to: ${style.colors[2]}; --break-text: ${style.text}">
        ${renderFallingDecorations(style)}
        <span class="break-countdown-number">${number}</span>
        <span class="break-countdown-words">${words}</span>
        <span class="break-countdown-dates">${dates}</span>
      </div>`;
  }

  // What one block on today's schedule says, and its color.
  function describeBlock(block) {
    switch (block.kind) {
      case 'exam':
        return { color: block.plannerClass.color, name: `<span class="exam-tag">Exam</span> ${escapeHtml(block.plannerClass.name)} ${escapeHtml(block.exam.title)}`, place: block.exam.location };
      case 'rso-meeting':
        return { color: block.rso.color, name: `${escapeHtml(block.rso.name)}${block.meeting.label ? ` ${escapeHtml(block.meeting.label)}` : ''}`, place: block.meeting.location };
      case 'rso-event':
        return { color: block.rso.color, name: `${escapeHtml(block.rso.name)}: ${escapeHtml(block.event.title)}`, place: block.event.location };
      case 'event':
        return { color: block.event.color, name: escapeHtml(block.event.title), place: block.event.location };
      default:
        return { color: block.plannerClass.color, name: `${escapeHtml(block.plannerClass.name)}${block.meeting.label ? ` ${escapeHtml(block.meeting.label)}` : ''}`, place: block.meeting.location };
    }
  }

  function renderTodaySchedule(today, nowTime) {
    const blocks = model.calendarBlocksOn(state, today);
    if (blocks.length === 0) {
      const schoolBreak = model.breakOn(state, today);
      return `<p class="empty">${schoolBreak ? `No classes: it’s ${escapeHtml(schoolBreak.name)}! ${BREAK_THEME_STYLES[schoolBreak.theme].emoji}` : 'Nothing on your schedule today.'}</p>`;
    }
    const rows = blocks
      .map((block) => {
        const { color, name, place } = describeBlock(block);
        const isNow = !block.cancelled && block.startTime <= nowTime && nowTime < block.endTime;
        const isOver = !block.cancelled && block.endTime <= nowTime;
        const status = block.cancelled ? ' is-cancelled' : isNow ? ' is-now' : isOver ? ' is-over' : '';
        const note = block.cancelled ? ' · Cancelled' : isNow ? ' · <strong>Now</strong>' : '';
        return `
          <li class="schedule-item${status}" style="--class-color: ${color}">
            <span class="schedule-time">${model.formatTimeRange(block.startTime, block.endTime)}</span>
            <span class="swatch" aria-hidden="true"></span>
            <span class="schedule-name">${name}${place ? ` <span class="schedule-place">· ${escapeHtml(place)}</span>` : ''}${note}</span>
          </li>`;
      })
      .join('');
    return `<ul class="schedule-list">${rows}</ul>`;
  }

  function renderHome() {
    const now = new Date();
    const today = todayKey();
    const nowTime = currentTime();
    const dueToday = model.buildDueList(state).filter((item) => item.date === today);
    const doneCount = dueToday.filter((item) => item.done).length;
    const homework =
      dueToday.length === 0
        ? '<p class="empty">Nothing due today 🎉</p>'
        : renderList(dueToday, false);
    elements.home.innerHTML = `
      ${renderGreeting(now, nowTime)}
      ${renderBreakCountdown()}
      ${renderBuddyCard()}
      <div class="home-columns">
        <section class="home-box" aria-labelledby="home-homework-heading">
          <div class="home-box-heading">
            <h3 class="due-heading" id="home-homework-heading">Due today ${dueToday.length > 0 ? `<span class="count">${doneCount} of ${dueToday.length} done</span>` : ''}</h3>
            <button type="button" class="text-button" data-action="open-quick-add">+ Add homework</button>
          </div>
          ${homework}
        </section>
        <section class="home-box" aria-labelledby="home-schedule-heading">
          ${renderExamCountdown()}
          <h3 class="due-heading" id="home-schedule-heading">Today’s schedule</h3>
          ${renderTodaySchedule(today, nowTime)}
        </section>
      </div>`;
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

  // ---------- One-time rows: an RSO's events and a class's exams ----------

  // The list's data-kind ("event" or "exam") picks the wording.
  const ONE_TIME_ROW_TEXT = {
    event: { name: 'Event', example: 'e.g. Fall social', place: 'Place' },
    exam: { name: 'Exam', example: 'e.g. Midterm 2', place: 'Room' },
  };

  function renderOneTimeRows(list, rows) {
    const text = ONE_TIME_ROW_TEXT[list.dataset.kind];
    list.innerHTML = rows
      .map(
        (row, index) => `
          <li class="meeting-row one-time-row" data-row-id="${row.id}">
            <div class="meeting-row-top">
              <input class="one-time-title" type="text" maxlength="80" placeholder="${text.example}" value="${escapeHtml(row.title)}"
                aria-label="${text.name} ${index + 1} name" />
              <button type="button" class="text-button danger" data-one-time-action="remove">Remove</button>
            </div>
            <label class="field"><span>Date</span><input class="one-time-date" type="date" value="${row.date}" /></label>
            <div class="field-row">
              <label class="field"><span>Starts</span><input class="one-time-start" type="time" value="${row.startTime}" /></label>
              <label class="field"><span>Ends</span><input class="one-time-end" type="time" value="${row.endTime}" /></label>
            </div>
            <input class="one-time-location" type="text" maxlength="40" placeholder="${text.place} (optional)" value="${escapeHtml(row.location)}"
              aria-label="${text.name} ${index + 1} ${text.place.toLowerCase()}" />
          </li>`,
      )
      .join('');
  }

  function readOneTimeRows(list) {
    return [...list.querySelectorAll('.one-time-row')].map((row) => ({
      id: row.dataset.rowId,
      title: row.querySelector('.one-time-title').value.trim(),
      date: row.querySelector('.one-time-date').value,
      startTime: row.querySelector('.one-time-start').value,
      endTime: row.querySelector('.one-time-end').value,
      location: row.querySelector('.one-time-location').value.trim(),
    }));
  }

  function addOneTimeRow(list) {
    const rows = readOneTimeRows(list);
    rows.push({ id: newId(list.dataset.kind), title: '', date: '', startTime: '', endTime: '', location: '' });
    renderOneTimeRows(list, rows);
    list.querySelector('.one-time-row:last-child .one-time-title').focus();
  }

  function removeOneTimeRow(list, row) {
    renderOneTimeRows(list, readOneTimeRows(list).filter((candidate) => candidate.id !== row.dataset.rowId));
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
    // A half-edited class form lists that class's exams and would undo this change when saved.
    if (editingClassId) {
      stopEditingClass();
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
    renderOneTimeRows(
      elements.classExamList,
      (state.exams || []).filter((exam) => exam.classId === id).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)),
    );
    elements.classFormLabel.textContent = `Edit ${plannerClass.name}`;
    elements.classSubmit.textContent = 'Save class';
    elements.classCancel.hidden = false;
    showErrors(elements.classErrors, []);
    elements.classForm.elements.name.focus();
  }

  function stopEditingClass() {
    editingClassId = null;
    elements.classForm.reset();
    renderMeetingRows(elements.meetingList, []);
    renderRecurringRows([]);
    renderOneTimeRows(elements.classExamList, []);
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
    const exams = readOneTimeRows(elements.classExamList).map((row) => ({ ...row, semesterId: state.currentSemesterId, classId }));
    exams.forEach((exam, index) => {
      const which = exam.title || `Exam ${index + 1}`;
      model.validateExam(exam).forEach((error) => errors.push(`${which}: ${error}`));
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
      // The form lists all of this class's exams, so it replaces them.
      state.exams = [...(state.exams || []).filter((exam) => exam.classId !== classId), ...exams];
    });
    stopEditingClass();
  }

  // ---------- RSOs ----------

  function renderRsos() {
    const rsos = model.currentRsos(state);
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
    renderOneTimeRows(elements.rsoEventList, rso.events || []);
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
    renderOneTimeRows(elements.rsoEventList, []);
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
    const events = readOneTimeRows(elements.rsoEventList);
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
        const semesterId = state.currentSemesterId;
        state.rsos = [...(state.rsos || []), { id: newId('rso'), semesterId, semesterIds: [semesterId], ...fields }];
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
    elements.backupStatus.textContent = '';
    elements.semesterDialog.showModal();
  }

  function handleSemesterSubmit(event) {
    event.preventDefault();
    const form = elements.semesterForm;
    const name = form.elements.name.value.trim();
    const startDate = form.elements.startDate.value;
    const endDate = form.elements.endDate.value;
    const schoolYearEndDate = form.elements.schoolYearEndDate.value;
    const errors = model.validateSemester({ name, startDate, endDate });
    // The school year end is only checked once the semester's own dates are right.
    if (errors.length === 0 && !model.isValidDateKey(schoolYearEndDate)) {
      errors.push('Pick when the school year ends.');
    } else if (errors.length === 0 && schoolYearEndDate < endDate) {
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

  // ---------- Quick add ----------

  // A short form on Home for homework mentioned in class: name, class, and day. It's a pop-up box
  // instead of part of Home, because Home redraws every minute and would wipe what's typed.
  function openQuickAdd() {
    const form = elements.quickAddForm;
    const classes = currentClasses();
    form.elements.classId.innerHTML = [
      ...classes.map((plannerClass) => `<option value="${plannerClass.id}">${escapeHtml(plannerClass.name)}</option>`),
      '<option value="">No class</option>',
    ].join('');
    form.elements.title.value = '';
    elements.quickAddDays.innerHTML = model
      .quickAddDays(todayKey())
      .map(({ date, label }) => `<label class="day-option"><input type="radio" name="quickDay" value="${date}" /><span>${label}</span></label>`)
      .join('');
    setQuickAddDate(todayKey());
    form.elements.dueTime.value = model.usualDueTime(state, form.elements.classId.value || null);
    showErrors(elements.quickAddErrors, []);
    elements.quickAddDialog.showModal();
    form.elements.title.focus();
  }

  // The date box is the one answer; the day buttons fill it in, and a matching button lights up.
  function setQuickAddDate(date) {
    const form = elements.quickAddForm;
    form.elements.dueDate.value = date;
    elements.quickAddDays.querySelectorAll('input').forEach((input) => {
      input.checked = input.value === date;
    });
  }

  function handleQuickAddChange(event) {
    const form = elements.quickAddForm;
    if (event.target.name === 'quickDay' || event.target.name === 'dueDate') {
      setQuickAddDate(event.target.value);
    } else if (event.target.name === 'classId') {
      form.elements.dueTime.value = model.usualDueTime(state, event.target.value || null);
    }
  }

  function handleQuickAddSubmit(event) {
    event.preventDefault();
    const form = elements.quickAddForm;
    const fields = {
      classId: form.elements.classId.value || null,
      title: form.elements.title.value.trim(),
      link: '',
      dueTime: form.elements.dueTime.value,
      lateAllowed: true,
      dueDate: form.elements.dueDate.value,
    };
    const errors = model.validateAssignment({ kind: 'once', ...fields });
    showErrors(elements.quickAddErrors, errors);
    if (errors.length > 0) {
      return;
    }
    const assignment = { id: newId('assignment'), semesterId: state.currentSemesterId, kind: 'once', ...fields, done: false };
    elements.quickAddDialog.close();
    applyChange(`Added “${assignment.title}” for ${model.formatDate(assignment.dueDate)}.`, () => state.assignments.push(assignment));
  }

  // ---------- Backup ----------

  // Saves the planner to a file in the browser's Downloads, named with today's date.
  function downloadBackup() {
    const fileName = `planner-backup-${todayKey()}.json`;
    const file = new Blob([PlannerStorage.createBackup(state, themes.getChoice(), new Date())], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
    elements.backupStatus.textContent = `Downloaded ${fileName}. Keep it somewhere safe, like your cloud drive.`;
  }

  function describeBackup(planner) {
    const count = (number, singular, plural) => `${number} ${number === 1 ? singular : plural}`;
    return [
      count(planner.classes.length, 'class', 'classes'),
      count(planner.assignments.length, 'assignment', 'assignments'),
      count(planner.semesters.length, 'semester', 'semesters'),
    ].join(', ');
  }

  // Replaces the whole planner with a backup file, after asking. Undo puts the old planner back.
  async function restoreBackup() {
    const input = elements.restoreBackupInput;
    const file = input.files[0];
    input.value = ''; // So choosing the same file again still counts as a change.
    if (!file) {
      return;
    }
    const { backup, error } = PlannerStorage.readBackup(await file.text());
    if (error) {
      elements.backupStatus.textContent = error;
      return;
    }
    elements.backupStatus.textContent = '';
    elements.semesterDialog.close();
    const from = backup.savedAt ? ` from ${model.formatDate(model.toDateKey(backup.savedAt))}` : '';
    const confirmed = await askToConfirm(
      `Replace everything in this planner with the backup${from}? It has ${describeBackup(backup.planner)}.`,
      'Restore',
    );
    if (!confirmed) {
      return;
    }
    applyChange(`Restored the backup${from}.`, () => {
      state = backup.planner;
      if (!state.buddy) {
        state.buddy = buddy.newBuddy(todayKey());
      }
    });
    if (backup.theme) {
      themes.setChoice(backup.theme);
      renderThemeOptions();
    }
  }

  // ---------- Study Buddy ----------

  function buddyPoints() {
    return buddy.totalPoints(buddy.pointsLog(state, todayKey(), currentTime()));
  }

  const GROWN_MESSAGES = ['', 'hatched! 🐣', 'grew little ears! 🐾', 'is all grown up! 🌼'];

  function buddyStreak() {
    return buddy.streakFor(state, todayKey(), currentTime());
  }

  function dayCount(days) {
    return `${days} day${days === 1 ? '' : 's'}`;
  }

  // " 🔥 3-day streak!" when a check-off finishes the day.
  function describeStreakChange(streakBefore) {
    const streakAfter = buddyStreak().current;
    return streakAfter > streakBefore ? ` 🔥 ${streakAfter}-day streak!` : '';
  }

  // A flame on the buddy's picture that grows at each streak milestone.
  function renderStreakFlame(streak) {
    if (streak.current === 0) {
      return '';
    }
    return `<span class="buddy-flame flame-level-${streak.level}" aria-hidden="true">🔥</span>`;
  }

  function streakText(streak) {
    if (streak.current === 0) {
      return 'Finish everything due today on time to start a streak';
    }
    return `🔥 ${streak.current}-day streak`;
  }

  function nextBonusText(streak) {
    const daysLeft = streak.next.days - streak.current;
    return `${dayCount(daysLeft)} more for +${streak.next.points}`;
  }

  // " +10 ✨" after a check-off, plus news when the buddy reaches a new stage.
  function describePointsChange(pointsBefore) {
    const pointsAfter = buddyPoints();
    const change = pointsAfter - pointsBefore;
    if (change === 0) {
      return '';
    }
    const stageBefore = buddy.stageFor(pointsBefore).index;
    const stageAfter = buddy.stageFor(pointsAfter).index;
    const grown = stageAfter > stageBefore ? ` ${buddy.displayName(state.buddy)} ${GROWN_MESSAGES[stageAfter]}` : '';
    return change > 0 ? ` +${change} ✨${grown}` : ` (−${-change} points)`;
  }

  function buddyMood() {
    return buddy.moodFor(state, todayKey(), currentTime());
  }

  // What the buddy is feeling and why, e.g. "Mochi is worried about Lab 3 (overdue)".
  function moodText({ mood, worries, dueLeft }) {
    const name = buddy.displayName(state.buddy);
    if (mood === 'droopy') {
      const first = worries[0];
      const why = model.allowsLateWork(first.assignment) ? 'overdue' : 'missed';
      const more = worries.length > 1 ? ` and ${worries.length - 1} more` : '';
      return `${name} is worried about ${first.assignment.title} (${why})${more} 🥺`;
    }
    if (mood === 'sleepy') {
      return `${name} is fast asleep. Good night! 🌙`;
    }
    if (mood === 'happy') {
      return `${name} is so happy, you’re all caught up! 💕`;
    }
    return `${name} is cheering you on: ${dueLeft} thing${dueLeft === 1 ? '' : 's'} left today ✨`;
  }

  function growHint(where) {
    if (!where.next) {
      return 'All grown up! Keep it happy by finishing your work.';
    }
    const plural = where.pointsToNext === 1 ? '' : 's';
    return `${where.pointsToNext} more point${plural} to ${where.stage.growVerb}`;
  }

  function renderBuddyProgress(where, className = '') {
    const percent = Math.round(where.progress * 100);
    return `<span class="progress-bar buddy-progress ${className}" role="progressbar" aria-label="Growth" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
        <span class="progress-fill" style="width: ${percent}%"></span>
      </span>`;
  }

  function renderBuddyCard() {
    const points = buddyPoints();
    const where = buddy.stageFor(points);
    const streak = buddyStreak();
    const mood = buddyMood();
    return `<button type="button" class="buddy-card" data-action="set-tab" data-tab="buddy">
        <span class="buddy-card-art">${buddy.drawBuddy(where.index, where.progress, mood.mood)}${renderStreakFlame(streak)}</span>
        <span class="buddy-card-text">
          <span><strong>${escapeHtml(buddy.displayName(state.buddy))}</strong> <span class="buddy-muted">· ${where.stage.name}</span></span>
          <span class="buddy-card-mood">${escapeHtml(moodText(mood))}</span>
          <span class="buddy-card-points">${points} point${points === 1 ? '' : 's'} ${streak.current > 0 ? `<span class="buddy-streak">${streakText(streak)}</span>` : ''}</span>
          ${renderBuddyProgress(where)}
          <span class="buddy-muted">${growHint(where)}</span>
        </span>
        <span class="buddy-card-arrow" aria-hidden="true">›</span>
      </button>`;
  }

  function renderPointsEntry({ item, points, reason, streakDays, when }) {
    const sign = points > 0 ? `+${points}` : `−${-points}`;
    if (!item) {
      return `<li class="buddy-log-item is-streak">
          <span class="buddy-log-points is-gain">${sign}</span>
          <span class="buddy-log-title">🔥 ${streakDays}-day streak bonus</span>
          <span class="buddy-muted">${model.formatDate(when.slice(0, 10))}</span>
        </li>`;
    }
    return `<li class="buddy-log-item" style="--class-color: ${itemColor(item)}">
        <span class="buddy-log-points ${points > 0 ? 'is-gain' : 'is-loss'}">${sign}</span>
        <span class="buddy-log-title">${escapeHtml(item.assignment.title)}</span>
        <span class="buddy-muted">${renderClassTag(item)} · ${model.formatDate(item.date)}${reason === 'done' ? '' : ` · ${reason}`}</span>
      </li>`;
  }

  function renderBuddyStages(where) {
    return buddy.STAGES.map((stage, index) => {
      const reached = index <= where.index;
      return `<li class="buddy-stage-item ${reached ? 'is-reached' : 'is-locked'}">
          ${buddy.drawBuddy(index)}
          <span>${reached ? stage.name : '???'}</span>
          <span class="buddy-muted">${stage.minPoints} pts</span>
        </li>`;
    }).join('');
  }

  const RECENT_POINTS_COUNT = 8;

  function renderBuddy() {
    const log = buddy.pointsLog(state, todayKey(), currentTime());
    const points = buddy.totalPoints(log);
    const where = buddy.stageFor(points);
    const streak = buddyStreak();
    const mood = buddyMood();
    const recent =
      log.length === 0
        ? '<p class="empty">Check off an assignment to earn your first points!</p>'
        : `<ul class="buddy-log">${log.slice(0, RECENT_POINTS_COUNT).map(renderPointsEntry).join('')}</ul>`;
    elements.buddy.innerHTML = `
      <div class="buddy-layout">
        <section class="buddy-home">
          <div class="buddy-big">${buddy.drawBuddy(where.index, where.progress, mood.mood)}${renderStreakFlame(streak)}</div>
          <p class="buddy-mood-line">${escapeHtml(moodText(mood))}</p>
          <form class="buddy-name-form" id="buddy-name-form">
            <label class="field">
              <span>Name</span>
              <input type="text" name="name" maxlength="20" autocomplete="off" placeholder="Give your buddy a name" value="${escapeHtml(state.buddy.name)}" />
            </label>
            <button type="submit" class="secondary-button">Save</button>
          </form>
          <ul class="form-errors" id="buddy-name-errors" role="alert"></ul>
          <p class="buddy-big-points"><strong>${points}</strong> point${points === 1 ? '' : 's'} · ${where.stage.name}</p>
          ${renderBuddyProgress(where, 'is-wide')}
          <p class="buddy-muted">${growHint(where)}</p>
          <div class="buddy-streak-box">
            <p class="buddy-streak-now">${streakText(streak)}</p>
            <p class="buddy-muted">Best: ${dayCount(streak.best)} · ${nextBonusText(streak)}</p>
          </div>
        </section>
        <div class="buddy-side">
          <section class="home-box">
            <h3 class="due-heading">How your buddy grows</h3>
            <ul class="buddy-rules">
              <li><span>Check off work on time</span> <strong class="is-gain">+${buddy.ON_TIME_POINTS}</strong></li>
              <li><span>Check it off late</span> <strong class="is-gain">+${buddy.LATE_POINTS}</strong></li>
              <li><span>Missed (no late work allowed)</span> <strong class="is-loss">−${-buddy.MISSED_POINTS}</strong></li>
              <li class="buddy-rule-streaks"><span>Streak bonuses</span>
                <span class="buddy-milestones">${buddy.STREAK_MILESTONES.map(
                  (milestone) => `<span>🔥 ${milestone.days} days <strong class="is-gain">+${milestone.points}</strong></span>`,
                ).join('')}</span></li>
            </ul>
            <p class="buddy-muted">A day adds to your streak when everything due that day is checked off on time.
              Counts work due from ${model.formatDate(state.buddy.startDate)} on.</p>
            <ol class="buddy-stages">${renderBuddyStages(where)}</ol>
          </section>
          <section class="home-box">
            <h3 class="due-heading">Recent points</h3>
            ${recent}
          </section>
        </div>
      </div>`;
  }

  function handleBuddyNameSubmit(event) {
    event.preventDefault();
    const name = new FormData(event.target).get('name').trim();
    const errors = buddy.validateName(name);
    showErrors(document.getElementById('buddy-name-errors'), errors);
    if (errors.length > 0) {
      return;
    }
    applyChange(name ? `Named your buddy ${name} 💕` : 'Cleared your buddy’s name.', () => {
      state.buddy.name = name;
    });
  }

  // ---------- Starting and switching semesters ----------

  function openNewSemesterDialog() {
    const guess = model.nextSemesterGuess(currentSemester());
    const form = elements.newSemesterForm;
    form.elements.name.value = guess.name;
    form.elements.startDate.value = guess.startDate;
    form.elements.endDate.value = guess.endDate;
    // Year-long RSOs start checked, semester-only ones unchecked.
    const rsos = model.currentRsos(state);
    elements.newSemesterRsosField.hidden = rsos.length === 0;
    elements.newSemesterRsos.innerHTML = rsos
      .map(
        (rso) => `
          <label class="checkbox-field" style="--class-color: ${rso.color}">
            <input type="checkbox" name="keepRso" value="${rso.id}" ${rso.lasts === 'year' ? 'checked' : ''} />
            <span><span class="swatch" aria-hidden="true"></span> ${escapeHtml(rso.name)} <small>${rso.lasts === 'year' ? 'all year' : 'this semester only'}</small></span>
          </label>`,
      )
      .join('');
    showErrors(elements.newSemesterErrors, []);
    elements.semesterDialog.close();
    elements.newSemesterDialog.showModal();
  }

  // Shows the week a semester is happening in: this week if it's on now, else its last
  // week if it's over, or its first week if it hasn't started.
  function jumpToSemesterWeek(semester) {
    const today = todayKey();
    const shownDate = today < semester.startDate ? semester.startDate : today > semester.endDate ? semester.endDate : today;
    weekStart = model.startOfWeek(shownDate);
  }

  // Forms open for the semester being left would save into the wrong one.
  function leaveSemester() {
    if (editingClassId) {
      stopEditingClass();
    }
    if (editingRsoId) {
      stopEditingRso();
    }
    setDrawerOpen(false);
  }

  function handleNewSemesterSubmit(event) {
    event.preventDefault();
    const form = elements.newSemesterForm;
    const fields = { name: form.elements.name.value.trim(), startDate: form.elements.startDate.value, endDate: form.elements.endDate.value };
    const errors = model.validateSemester(fields);
    if (state.semesters.some((semester) => semester.name.toLowerCase() === fields.name.toLowerCase())) {
      errors.push(`You already have a semester called ${fields.name}.`);
    }
    showErrors(elements.newSemesterErrors, errors);
    if (errors.length > 0) {
      return;
    }
    const keepRsoIds = [...form.querySelectorAll('input[name="keepRso"]:checked')].map((input) => input.value);
    leaveSemester();
    applyChange(`Started ${fields.name}! Add your classes with + Add → Class.`, () => model.startNewSemester(state, fields, keepRsoIds, newId('semester')));
    jumpToSemesterWeek(currentSemester());
    resetAssignmentDates();
    render();
    elements.newSemesterDialog.close();
  }

  function switchSemester(id) {
    const semester = state.semesters.find((candidate) => candidate.id === id);
    leaveSemester();
    applyChange(`Switched to ${semester.name}.`, () => {
      state.currentSemesterId = id;
    });
    jumpToSemesterWeek(semester);
    resetAssignmentDates();
    render();
    if (elements.semesterDialog.open) {
      elements.semesterDialog.close();
    }
  }

  // ---------- Clicks in lists ----------

  async function handleListAction(target) {
    const action = target.dataset.action;
    const { id, date } = target.dataset;
    const assignment = id ? findAssignment(id) : null;

    if (action === 'toggle-done') {
      const nowDone = target.checked;
      const item = { assignment, date, time: assignment.dueTime };
      const pointsBefore = buddyPoints();
      const streakBefore = buddyStreak().current;
      const message = nowDone ? `Done: ${assignment.title} 🎉` : `Marked not done: ${assignment.title}`;
      applyChange(() => message + describePointsChange(pointsBefore) + describeStreakChange(streakBefore), () => {
        buddy.recordCheckOff(state.buddy, item, nowDone, todayKey(), currentTime());
        if (assignment.kind === 'once') {
          assignment.done = nowDone;
        } else if (nowDone) {
          assignment.doneDates.push(date);
        } else {
          assignment.doneDates = assignment.doneDates.filter((doneDate) => doneDate !== date);
        }
      });
      // The Home card was just redrawn, so the hop plays once on the new buddy.
      if (nowDone) {
        elements.home.querySelector('.buddy-card-art')?.classList.add('is-hopping');
      }
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
      if (editingClassId === exam.classId) {
        stopEditingClass();
      }
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
      renderTabs();
    } else if (action === 'previous-week' || action === 'next-week') {
      weekStart = model.addDays(weekStart, action === 'next-week' ? 7 : -7);
      renderDueList();
      renderCalendar();
    } else if (action === 'this-week') {
      weekStart = model.startOfWeek(todayKey());
      renderDueList();
      renderCalendar();
    } else if (action === 'open-quick-add') {
      openQuickAdd();
    } else if (action === 'open-new-semester') {
      openNewSemesterDialog();
    } else if (action === 'switch-semester') {
      switchSemester(id);
    } else if (action === 'retry-weather') {
      loadWeather();
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

  // ---------- Themes ----------

  const themeMenu = document.querySelector('.theme-menu');
  const themeOptions = document.getElementById('theme-options');
  const decoratedThemeOptions = document.getElementById('decorated-theme-options');

  // A small preview of a palette: its background with a card and an accent dot on it.
  // Decorated themes show their background pattern, and their heading icon on the card.
  function renderThemePreview(palette, art) {
    const artwork = art ? ThemeArt.cssVariables(art) : null;
    const pattern = artwork ? `<span class="theme-preview-pattern" style="${escapeHtml(`background-image: ${artwork['--decor-pattern']}`)}"></span>` : '';
    const cardStyle = `background: ${artwork ? `${artwork['--decor-icon']} 4px center / 16px no-repeat,` : ''} ${palette.surface}; border-color: ${palette.border}`;
    return `<span class="theme-preview" aria-hidden="true" style="background: ${palette.background}; border-color: ${palette.border}">
      ${pattern}
      <span class="theme-preview-card" style="${escapeHtml(cardStyle)}"></span>
      <span class="theme-preview-dot" style="background: ${palette.accent}"></span>
    </span>`;
  }

  function renderThemeButton(theme, dark) {
    return `<button type="button" class="color-theme-option" data-theme="${theme.id}">${renderThemePreview(dark ? theme.dark : theme.light, theme.art)}<span>${escapeHtml(theme.name)}</span></button>`;
  }

  // Previews show each theme in the current mode, so they're redrawn when the mode changes.
  function renderThemeOptions() {
    const choice = themes.getChoice();
    const dark = document.documentElement.classList.contains('dark');
    decoratedThemeOptions.innerHTML = themes.DECORATED.map((theme) => renderThemeButton(theme, dark)).join('');
    const customPalette = themes.customPalette(choice.customColor, dark);
    themeOptions.innerHTML = `${themes.PRESETS.map((theme) => renderThemeButton(theme, dark)).join('')}
      <label class="color-theme-option" data-theme="custom">
        ${renderThemePreview(customPalette)}
        <span>Your color</span>
        <input type="color" class="custom-theme-color" value="${choice.customColor}" aria-label="Pick your own theme color" />
      </label>`;
    updateThemeSelection();
  }

  function updateThemeSelection() {
    const choice = themes.getChoice();
    themeMenu.querySelectorAll('[data-mode]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.mode === choice.mode));
    });
    themeMenu.querySelectorAll('[data-theme]').forEach((option) => {
      const selected = option.dataset.theme === choice.theme;
      option.classList.toggle('is-selected', selected);
      if (option.tagName === 'BUTTON') {
        option.setAttribute('aria-pressed', String(selected));
      }
    });
  }

  function handleThemeClick(event) {
    const modeButton = event.target.closest('button[data-mode]');
    // The 'Your color' tile is a label, so clicking it also opens the color picker.
    const themeButton = event.target.closest('[data-theme]');
    if (modeButton) {
      themes.setChoice({ mode: modeButton.dataset.mode });
      renderThemeOptions();
    } else if (themeButton) {
      themes.setChoice({ theme: themeButton.dataset.theme });
      updateThemeSelection();
    }
  }

  // Dragging in the color picker re-themes the app live. Only the custom preview is redrawn,
  // because rebuilding the picker while it's open would close it.
  function handleCustomColor(event) {
    if (!event.target.classList.contains('custom-theme-color')) {
      return;
    }
    const choice = themes.setChoice({ theme: 'custom', customColor: event.target.value });
    const dark = document.documentElement.classList.contains('dark');
    const preview = themeOptions.querySelector('[data-theme="custom"] .theme-preview');
    preview.outerHTML = renderThemePreview(themes.customPalette(choice.customColor, dark));
    updateThemeSelection();
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
  elements.quickAddForm.addEventListener('submit', handleQuickAddSubmit);
  elements.quickAddForm.addEventListener('change', handleQuickAddChange);
  document.getElementById('quick-add-cancel').addEventListener('click', () => elements.quickAddDialog.close());
  document.getElementById('download-backup').addEventListener('click', downloadBackup);
  elements.restoreBackupInput.addEventListener('change', restoreBackup);
  elements.semesterForm.addEventListener('submit', handleSemesterSubmit);
  document.getElementById('semester-cancel').addEventListener('click', () => elements.semesterDialog.close());
  elements.newSemesterForm.addEventListener('submit', handleNewSemesterSubmit);
  document.getElementById('new-semester-cancel').addEventListener('click', () => elements.newSemesterDialog.close());
  document.getElementById('drawer-close').addEventListener('click', () => setDrawerOpen(false));
  elements.assignmentCancel.addEventListener('click', () => setDrawerOpen(false));
  document.getElementById('add-meeting').addEventListener('click', () => addMeetingRow(elements.meetingList, MEETING_DAYS, 'Lecture'));
  document.getElementById('add-rso-meeting').addEventListener('click', () => addMeetingRow(elements.rsoMeetingList, ALL_DAYS, 'General meeting'));
  document.getElementById('add-rso-event').addEventListener('click', () => addOneTimeRow(elements.rsoEventList));
  document.getElementById('add-class-exam').addEventListener('click', () => addOneTimeRow(elements.classExamList));
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
  [elements.rsoEventList, elements.classExamList].forEach((list) => {
    list.addEventListener('click', (event) => {
      const removeButton = event.target.closest('[data-one-time-action="remove"]');
      if (removeButton) {
        removeOneTimeRow(list, removeButton.closest('.one-time-row'));
      }
    });
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
  // the calendar's "now" line, next class, and Home's clock stay current, unless a menu
  // is open (redrawing would close it). The first redraw waits for the next whole minute,
  // so the clock changes when the minute does.
  function redrawEachMinute() {
    if (!document.querySelector('.row-menu[open]')) {
      renderDueList();
      renderCalendar();
      renderHome();
      // Redrawing would wipe out a name being typed.
      if (!elements.buddy.contains(document.activeElement)) {
        renderBuddy();
      }
    }
  }
  setTimeout(() => {
    redrawEachMinute();
    setInterval(redrawEachMinute, 60 * 1000);
  }, (60 - new Date().getSeconds()) * 1000);
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

  elements.buddy.addEventListener('submit', handleBuddyNameSubmit);

  themeMenu.addEventListener('click', handleThemeClick);
  themeOptions.addEventListener('input', handleCustomColor);
  // In Auto mode the computer can switch between light and dark while the menu is open.
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', renderThemeOptions);
  // The theme menu stays open while trying themes, and closes on a click anywhere else.
  document.addEventListener('click', (event) => {
    if (themeMenu.open && !themeMenu.contains(event.target)) {
      themeMenu.open = false;
    }
  });

  renderThemeOptions();
  render();
  loadWeather();
  setInterval(loadWeather, WEATHER_REFRESH_MS);
})();

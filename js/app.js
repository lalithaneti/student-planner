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
  const PATH_LIST_STORAGE_KEY = 'student-planner-path-list';
  // Height of one hour on the calendar, in pixels.
  const HOUR_HEIGHT = 56;
  const MEETING_DAYS = [1, 2, 3, 4, 5];
  // Week starts on Monday, the way most class schedules are written.
  const ALL_DAYS = [1, 2, 3, 4, 5, 6, 0];

  const loaded = PlannerStorage.load(new Date());
  let state = loaded.state;
  // Planners from before buddies were per semester keep theirs as their semester's buddy.
  // Buddies from before species existed get one: the oldest stays a mochi, later ones get new species.
  const movedBuddy = buddy.moveToSemesterBuddies(state, model.toDateKey(new Date()));
  const filledInSpecies = buddy.fillInSpecies(state);
  // Chests opened before the sticker book existed get their stickers now.
  const gaveMissedStickers = PlannerStickers.giveMissedStickers(state) > 0;
  const gaveMissedAccessories = buddy.giveMissedAccessories(state) > 0;
  if (movedBuddy || filledInSpecies || gaveMissedStickers || gaveMissedAccessories) {
    PlannerStorage.save(state);
  }
  // Planners that already have classes skip the Getting started card on Home.
  if (state.gettingStartedClosed === undefined) {
    state.gettingStartedClosed = state.classes.length > 0;
    PlannerStorage.save(state);
  }
  let editingClassId = null;
  // The assignment being edited: { id, scope: 'all' | 'date', date }, or null when adding.
  let editingAssignment = null;
  // Which part of the Add panel is showing: 'assignment', 'class', 'exam', 'quiz', 'work', 'break', 'rso', or 'event'.
  let drawerSection = 'assignment';
  let editingExamId = null;
  // The exam panel also adds quizzes: 'exam' or 'quiz'.
  let examFormKind = 'exam';
  let editingBreakId = null;
  let editingRsoId = null;
  let editingEventId = null;
  let editingWorkId = null;
  // Whether the break theme was picked by hand; until then it follows the first day's month.
  let breakThemeChosen = false;
  let showDone = false;
  let toastTimer = null;
  // Weather for Home: { status: 'loading' | 'ready' | 'denied' | 'unavailable', ...readWeather's fields }.
  let weather = { status: 'loading' };
  // The greeting slides in once when the app opens, not again at each minute's redraw.
  let greetingHasArrived = false;
  // Which break the Home countdown card is showing, when there are two to slide between.
  let breakSlideIndex = 0;
  let resolveChoice = null;
  // What's chosen so far in the Study Buddy picker, before the egg is started.
  let buddyPick = { species: 'mochi', color: 'pink' };
  let currentView = loadSavedPreference(VIEW_STORAGE_KEY, ['day', 'week', 'game']);
  // Whether Buddy's Path's full list is showing, under its Next up card.
  let pathListShown = loadSavedPreference(PATH_LIST_STORAGE_KEY, ['hidden', 'shown']) === 'shown';
  // The app always opens on Home.
  let currentTab = 'home';
  let weekStart = model.startOfWeek(todayKey());
  // The day shown in the assignments Day view.
  let selectedDay = todayKey();

  const elements = {
    challengeDialog: document.getElementById('challenge-dialog'),
    timeDialog: document.getElementById('time-dialog'),
    timeForm: document.getElementById('time-form'),
    timeErrors: document.getElementById('time-errors'),
    chestDialog: document.getElementById('chest-dialog'),
    shopDialog: document.getElementById('shop-dialog'),
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
    examPlaceLabel: document.getElementById('exam-place-label'),
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
    finalFields: document.getElementById('final-fields'),
    classDateFields: document.getElementById('class-date-fields'),
    rsoLastsHint: document.getElementById('rso-lasts-hint'),
    workPanel: document.getElementById('work-panel'),
    workForm: document.getElementById('work-form'),
    workClass: document.getElementById('work-class'),
    workHeading: document.getElementById('work-heading'),
    workSubmit: document.getElementById('work-submit'),
    workCancel: document.getElementById('work-cancel'),
    workErrors: document.getElementById('work-errors'),
    workDays: document.getElementById('work-days'),
    workDaysField: document.getElementById('work-days-field'),
    workDateLabel: document.getElementById('work-date-label'),
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

  // Display preferences (Day or Week, which tab) are remembered on this device.
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
              ${plannerClass.startDate ? `<span class="class-meeting">${model.formatMonthDay(plannerClass.startDate)} – ${model.formatMonthDay(plannerClass.endDate)}</span>` : ''}
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
    const selectedWorkClass = elements.workClass.value;
    elements.workClass.innerHTML = elements.examClass.innerHTML;
    if ([...elements.workClass.options].some((option) => option.value === selectedWorkClass)) {
      elements.workClass.value = selectedWorkClass;
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
    if (currentView === 'game') {
      elements.dueList.innerHTML = renderGameView();
      cobbleObserver.disconnect();
      cobbleObserver.observe(elements.dueList.querySelector('.buddy-path-track'));
      scrollPathToBuddy();
    } else if (items.length === 0) {
      elements.dueList.innerHTML = renderEmptyPlanner();
    } else {
      elements.dueList.innerHTML = currentView === 'week' ? renderWeekView(items) : renderDayView(items);
    }
  }

  // ---------- Assignment rows ----------

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

  function renderToggle(action, expanded, label) {
    return `<button type="button" class="toggle-button" data-action="${action}" aria-expanded="${expanded}">${label}</button>`;
  }

  // ---------- Day view ----------

  // One day at a time, so the rest of the week doesn't crowd it. Done items stay, checked off.
  function renderDayView(items) {
    const today = todayKey();
    const day = model.buildDay(items, selectedDay, today, currentTime());
    const period = selectedDay === today ? 'today' : 'this day';
    let html = renderDayNav(day.items.length > 0 ? renderProgress(day.progress, period) : '');
    if (day.overdue.length > 0) {
      html += renderHeading('Overdue', day.overdue.length, 'overdue') + renderList(day.overdue, true);
    }
    if (day.items.length === 0) {
      html += `<p class="empty">Nothing due ${period}.</p>`;
    } else {
      html += renderHeading(dayHeading(selectedDay), day.items.length) + renderList(day.items, false);
      if (day.progress.done === day.progress.total) {
        html += `<p class="day-complete">All done for ${period}!</p>`;
      }
    }
    if (day.completed.length > 0) {
      html += renderToggle('toggle-done-section', showDone, showDone ? 'Hide completed' : `Show completed (${day.completed.length})`);
      if (showDone) {
        html += renderHeading('Completed', day.completed.length) + renderList(day.completed, true);
      }
    }
    return html;
  }

  function renderDayNav(extra) {
    const isToday = selectedDay === todayKey();
    return `
      <div class="week-nav">
        <button type="button" class="icon-button" data-action="previous-day" aria-label="Previous day">←</button>
        <span class="week-range">${weekdayName(selectedDay)}, ${model.formatMonthDay(selectedDay)}</span>
        <button type="button" class="icon-button" data-action="next-day" aria-label="Next day">→</button>
        ${isToday ? '' : '<button type="button" class="text-button" data-action="go-to-today">Today</button>'}
        ${extra}
      </div>`;
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

  function renderProgress({ done, total }, period = 'this week') {
    if (total === 0) {
      return `<span class="week-progress"><span class="progress-text">Nothing due ${period}</span></span>`;
    }
    const percent = Math.round((done / total) * 100);
    return `
      <span class="week-progress">
        <span class="progress-text">${done} of ${total} done</span>
        <span class="progress-bar" role="progressbar" aria-label="Done ${period}" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${done}">
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

  // ---------- Game view: Buddy's Path ----------

  const TREASURE_CHEST = `<svg class="treasure-chest" viewBox="0 0 80 70" aria-hidden="true" focusable="false">
      <ellipse cx="40" cy="64" rx="32" ry="4" fill="#000" opacity="0.1" />
      <path d="M8 30 C8 12 72 12 72 30 Z" fill="#d9965b" stroke="#9c5f2e" stroke-width="3" stroke-linejoin="round" />
      <rect x="8" y="30" width="64" height="32" rx="4" fill="#c7814a" stroke="#9c5f2e" stroke-width="3" />
      <path d="M8 30 H72 M30 18 V62 M50 18 V62" stroke="#ffd166" stroke-width="5" />
      <rect x="34" y="32" width="12" height="14" rx="3" fill="#ffd166" stroke="#d99a1f" stroke-width="2" />
      <circle cx="40" cy="39" r="2.2" fill="#9c5f2e" />
    </svg>`;

  const OPEN_TREASURE_CHEST = `<svg class="treasure-chest" viewBox="0 0 80 70" aria-hidden="true" focusable="false">
      <ellipse cx="40" cy="64" rx="32" ry="4" fill="#000" opacity="0.1" />
      <path d="M8 34 C4 6 76 6 72 34 Z" fill="#a9683a" stroke="#9c5f2e" stroke-width="3" stroke-linejoin="round" />
      <path d="M8 34 H72" stroke="#ffd166" stroke-width="5" />
      <circle cx="28" cy="32" r="7" fill="#ffd166" stroke="#d99a1f" stroke-width="2" />
      <circle cx="52" cy="32" r="7" fill="#ffd166" stroke="#d99a1f" stroke-width="2" />
      <circle cx="40" cy="28" r="8" fill="#ffe08f" stroke="#d99a1f" stroke-width="2" />
      <rect x="8" y="36" width="64" height="26" rx="4" fill="#c7814a" stroke="#9c5f2e" stroke-width="3" />
      <path d="M8 36 H72 M30 36 V62 M50 36 V62" stroke="#ffd166" stroke-width="5" />
    </svg>`;

  // The chest at the end of the trail: shut, shining and tappable once earned, or open.
  function renderPathChest(chest, spot) {
    const place = `style="left: ${spot.x}%; top: ${spot.y}%"`;
    if (chest.status === 'ready') {
      return `<button type="button" class="buddy-path-chest is-ready" ${place} data-action="open-chest" aria-label="Open this week’s chest">${TREASURE_CHEST}</button>`;
    }
    return `<div class="buddy-path-chest" ${place}>${chest.status === 'opened' ? OPEN_TREASURE_CHEST : TREASURE_CHEST}</div>`;
  }

  // Opens the viewed week's chest and shows what was inside, in one small card.
  function openWeekChest() {
    const grownUp = buddy.stageFor(buddyPoints()).index === buddy.STAGES.length - 1;
    const prize = buddy.openChest(currentBuddy(), weekStart, grownUp);
    const sticker = PlannerStickers.giveSticker(state, state.currentSemesterId, weekStart);
    const accessory = buddy.giveChestAccessory(state, state.currentSemesterId, weekStart);
    if (!PlannerStorage.save(state)) {
      showToast('Couldn’t save. Your browser may be out of storage or blocking it.', null);
    }
    render();
    elements.chestDialog.innerHTML = `
      <div class="chest-card">
        <div class="chest-card-art">${OPEN_TREASURE_CHEST}</div>
        <h3 id="chest-heading">Week finished!</h3>
        ${
          prize.points > 0
            ? `<p class="chest-card-prize">+${prize.points} bonus points</p>
               <p class="buddy-muted">${escapeHtml(buddy.displayName(currentBuddy()))} found them in this week’s chest.</p>`
            : `<p>${escapeHtml(buddy.displayName(currentBuddy()))} is all grown up! No bonus points needed.</p>`
        }
        ${renderChestSticker(sticker)}
        ${
          accessory
            ? `<div class="chest-card-accessory">
                ${buddy.drawAccessory(accessory.id)}
                <span>🎁 New accessory: <strong>${accessory.name}</strong></span>
                <span class="buddy-muted">Wear it from the Study Buddy tab.</span>
              </div>`
            : ''
        }
        <button type="button" class="primary-button" data-action="close-chest">Nice!</button>
      </div>`;
    elements.chestDialog.showModal();
  }

  // The chest card's sticker, or a note once the book is full.
  function renderChestSticker(sticker) {
    if (!sticker) {
      return '<p class="buddy-muted">Your sticker book is full!</p>';
    }
    return `<div class="chest-card-sticker">
        ${PlannerStickers.drawSticker(sticker)}
        <span>${sticker.rare ? '✨ Rare sticker' : 'New sticker'}: <strong>${sticker.name}</strong></span>
        <span class="buddy-muted">Added to your sticker book.</span>
      </div>`;
  }

  // The buddy for the game: the viewed semester's, or a waiting egg if it has none yet.
  function drawGameBuddy() {
    if (!currentBuddy()) {
      return buddy.drawBuddy(0, 0, 'happy');
    }
    const where = buddy.stageFor(buddyPoints());
    return drawCurrentBuddy(where, buddyMood(), buddyStreak());
  }

  // Busy weeks scroll sideways, so each stone keeps this much room (px).
  const PATH_STONE_SPACING = 72;
  const PATH_SAMPLES = 80;
  const PATH_STATUS_TEXT = { done: 'Done', overdue: 'Overdue', missed: 'Missed', upcoming: '' };

  // A spot along the trail, from 0 (start) to 1 (the chest), as percentages of the track.
  function pathPoint(along, waves) {
    // Starts a little in from the left, so the buddy standing before the first flag fits.
    // A little lower than the middle, leaving the top of the sky for the progress bar.
    return { x: 12 + along * 74, y: 62 + 18 * Math.sin(along * waves * 2 * Math.PI) };
  }

  function renderPathStone({ item, status }, index, along, waves) {
    const { x, y } = pathPoint(along, waves);
    const when = `${model.formatDate(item.date)}, ${model.formatTime(item.time)}`;
    const title = escapeHtml(item.assignment.title);
    return `<button type="button" class="path-stone is-${status}" style="left: ${x}%; top: ${y}%; --class-color: ${itemColor(item)}"
        data-action="toggle-stone" data-id="${item.assignment.id}" data-date="${item.date}" data-done="${item.done}"
        aria-label="${item.done ? 'Mark not done' : 'Mark done'}: ${title}, ${model.formatDate(item.date)}" title="${title} · ${when}">${drawCheckpoint(index + 1)}</button>`;
  }

  // What a finished week's chest is doing, so a shut chest never looks broken.
  function describeFinishedChest(chest) {
    if (chest.status === 'opened') {
      return chest.prize.points > 0 ? ` Chest: +${chest.prize.points} points.` : ' Chest opened.';
    }
    if (chest.status === 'ready') {
      return ' Tap the chest to open it.';
    }
    if (chest.reason === 'no-buddy') {
      return ' Pick a buddy on the Study Buddy tab to start earning chests.';
    }
    if (chest.reason === 'before-buddy') {
      const { startDate } = currentBuddy();
      return todayKey() < startDate
        ? ` Your buddy’s chests start when it wakes up on ${model.formatMonthDay(startDate)}.`
        : ' This week was before your buddy started, so it has no chest.';
    }
    return '';
  }

  // A checkpoint beside the path: a flag on a post by day, a lantern by night (dark mode). Both are
  // drawn and the stylesheet shows the one that fits; finishing raises the flag or lights the lantern.
  function drawCheckpoint(number) {
    return `<svg class="checkpoint-flag" viewBox="0 0 40 60" aria-hidden="true" focusable="false">
        <rect x="7" y="4" width="4" height="56" rx="2" fill="#a0714f" />
        <circle cx="9" cy="4" r="3" fill="#ffd166" />
        <g class="flag-cloth">
          <path d="M11 32 H37 L31 40 L37 48 H11 Z" fill="var(--class-color)" stroke="color-mix(in srgb, var(--class-color) 60%, #000)" stroke-width="1.5" stroke-linejoin="round" />
          <text x="22" y="44" text-anchor="middle" font-size="11" font-weight="700" fill="#1c2024">${number}</text>
        </g>
      </svg>
      <svg class="checkpoint-lantern" viewBox="0 0 40 60" aria-hidden="true" focusable="false">
        <rect x="7" y="8" width="4" height="52" rx="2" fill="#6b5a4e" />
        <path d="M9 10 H27 V16" fill="none" stroke="#6b5a4e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        <g class="lantern">
          <circle class="lantern-glow" cx="27" cy="29" r="15" />
          <rect x="21" y="16" width="12" height="3" rx="1.5" fill="var(--class-color)" />
          <rect class="lantern-glass" x="19" y="19" width="16" height="20" rx="4" stroke="var(--class-color)" stroke-width="2.5" />
          <rect x="21" y="39" width="12" height="3" rx="1.5" fill="var(--class-color)" />
          <text x="27" y="33" text-anchor="middle" font-size="10" font-weight="700" class="lantern-number">${number}</text>
        </g>
      </svg>`;
  }

  // One thing at a time: the assignment the buddy is standing on, ready to finish.
  function renderNextUp(stones, buddyStone, chest) {
    if (stones.length === 0) {
      return '<p class="empty">Nothing due this week.</p>';
    }
    if (buddyStone === stones.length) {
      const allDone = stones.every((stone) => stone.status === 'done');
      return `<p class="next-up-finished">${allDone ? `All done for this week! 🎉${describeFinishedChest(chest)}` : 'Nothing left to do this week.'}</p>`;
    }
    const { item, status } = stones[buddyStone];
    const statusText = PATH_STATUS_TEXT[status] ? ` · ${PATH_STATUS_TEXT[status]}` : '';
    return `<section class="next-up" style="--class-color: ${itemColor(item)}" aria-label="Next up">
        <span class="next-up-text">
          <span class="next-up-label">Next up</span>
          ${renderTitle(item.assignment)}
          <span class="buddy-muted">${renderClassTag(item)} · ${model.formatDate(item.date)}, ${model.formatTime(item.time)}${statusText}</span>
        </span>
        <button type="button" class="primary-button next-up-done" data-action="next-up-done" data-id="${item.assignment.id}" data-date="${item.date}"
          aria-label="Done: ${escapeHtml(item.assignment.title)}, ${model.formatDate(item.date)}">Done</button>
      </section>`;
  }

  // The names to go with the stones' numbers, hidden until asked for so a busy week stays calm.
  // Each has a checkbox too, for a stone that has scrolled out of view.
  function renderPathList(stones) {
    if (stones.length === 0) {
      return '';
    }
    const toggle = renderToggle('toggle-path-list', pathListShown, pathListShown ? 'Hide list' : `Show all (${stones.length})`);
    if (!pathListShown) {
      return toggle;
    }
    const rows = stones.map(({ item, status }, index) => {
      const statusText = PATH_STATUS_TEXT[status] ? ` · ${PATH_STATUS_TEXT[status]}` : '';
      return `<li class="path-list-item is-${status}" style="--class-color: ${itemColor(item)}">
          ${renderCheckbox(item)}
          <span class="path-stone-mini" aria-hidden="true">${index + 1}</span>
          <span>
            <strong>${escapeHtml(item.assignment.title)}</strong>
            <span class="buddy-muted">${renderClassTag(item)} · ${model.formatDate(item.date)}, ${model.formatTime(item.time)}${statusText}</span>
          </span>
        </li>`;
    });
    return `${toggle}<ol class="path-list">${rows.join('')}</ol>`;
  }

  // ---------- The scene behind the trail ----------
  // Sky, hills, trees on the far hill, clouds, and little things in the front grass, all set by the
  // semester's path theme. Hills stretch with the track; trees, clouds, and the rest keep their
  // size and spread along it. Colors come from the stylesheet, by theme and light or dark mode.

  const MEADOW_HILLS = `<svg class="scene-hills" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path class="scene-hill-far" d="M0 46 C10 38 20 36 32 42 C44 48 54 36 66 37 C78 38 88 46 100 41 V100 H0 Z" />
      <path class="scene-hill-near" d="M0 58 C14 52 26 54 40 57 C56 61 70 50 84 53 C92 55 96 57 100 56 V100 H0 Z" />
    </svg>`;

  // The sea at the horizon with a few wave lines, then a sandy beach.
  const BEACH_HILLS = `<svg class="scene-hills" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path class="scene-hill-far" d="M0 40 H100 V100 H0 Z" />
      <path class="scene-waves" d="M4 45 q3 -2 6 0 t6 0 M30 49 q3 -2 6 0 t6 0 M60 44 q3 -2 6 0 t6 0 M82 50 q3 -2 6 0 t6 0" />
      <path class="scene-hill-near" d="M0 56 C18 52 34 55 50 53 C66 51 84 55 100 52 V100 H0 Z" />
    </svg>`;

  const ROUND_TREE = `<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false"><rect x="17" y="38" width="6" height="20" rx="2" fill="#a0714f" />
      <circle cx="20" cy="26" r="16" fill="var(--scene-tree)" /><circle cx="12" cy="32" r="10" fill="var(--scene-tree)" /><circle cx="28" cy="32" r="10" fill="var(--scene-tree)" />
      <circle cx="15" cy="20" r="5" fill="#fff" opacity="0.18" /></svg>`;
  const PINE_TREE = `<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false"><rect x="17" y="44" width="6" height="14" rx="2" fill="#a0714f" />
      <path d="M20 4 L36 46 H4 Z" fill="var(--scene-pine)" stroke="var(--scene-pine)" stroke-width="3" stroke-linejoin="round" /></svg>`;
  const FLOWER_BUSH = `<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false"><path d="M6 58 C2 40 12 30 20 30 C28 30 38 40 34 58 Z" fill="var(--scene-bush)" />
      <circle cx="14" cy="42" r="2.5" fill="#ffb3c7" /><circle cx="25" cy="38" r="2.5" fill="#fff3b0" /><circle cx="27" cy="48" r="2.5" fill="#ffb3c7" /></svg>`;
  const PALM_TREE = `<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false">
      <path d="M22 58 C22 44 18 30 22 16" fill="none" stroke="#b98b5e" stroke-width="4" stroke-linecap="round" />
      <g fill="var(--scene-tree)"><path d="M22 15 C14 8 6 10 2 16 C10 13 16 14 22 17 Z" /><path d="M22 15 C30 8 38 10 40 17 C32 13 27 14 22 17 Z" />
      <path d="M22 15 C20 6 12 2 7 4 C13 6 18 10 22 17 Z" /><path d="M22 15 C26 6 33 3 37 6 C31 7 26 10 22 17 Z" /></g>
      <circle cx="20" cy="18" r="2.4" fill="#8a5f3a" /><circle cx="24" cy="18.5" r="2.4" fill="#8a5f3a" /></svg>`;
  const BEACH_UMBRELLA = `<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false">
      <path d="M20 26 V58" stroke="#e8e0d0" stroke-width="2.5" />
      <path d="M2 28 C4 14 36 14 38 28 Z" fill="#ff8a9c" /><path d="M14 28 C14 16 26 16 26 28 Z" fill="#fff" /><path d="M2 28 C4 14 36 14 38 28" fill="none" stroke="#e8637b" stroke-width="1.5" /></svg>`;
  const SNOWY_PINE = `<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false"><rect x="17" y="44" width="6" height="14" rx="2" fill="#8a6a55" />
      <path d="M20 4 L36 46 H4 Z" fill="var(--scene-pine)" stroke="var(--scene-pine)" stroke-width="3" stroke-linejoin="round" />
      <path d="M20 4 L27 22 C24 20 22 23 20 21 C18 23 15 20 13 22 Z M11 28 C15 26 17 30 20 28 C23 30 26 26 30 28 L33 38 C28 36 25 40 20 37 C15 40 11 36 7 38 Z" fill="#ffffff" /></svg>`;
  const SNOWMAN = `<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false">
      <circle cx="20" cy="47" r="11" fill="#fff" stroke="#c9d6e6" stroke-width="1.5" /><circle cx="20" cy="29" r="8" fill="#fff" stroke="#c9d6e6" stroke-width="1.5" />
      <circle cx="17" cy="27" r="1.2" fill="#4a2e44" /><circle cx="23" cy="27" r="1.2" fill="#4a2e44" /><path d="M20 30 L26 31.5 L20 32 Z" fill="#ff9f4a" />
      <path d="M13 35 H27" stroke="#ff8a9c" stroke-width="3" stroke-linecap="round" /><rect x="14" y="17" width="12" height="4" rx="1" fill="#46527a" /><rect x="16" y="11" width="8" height="7" rx="1" fill="#46527a" /></svg>`;

  // Autumn trees in fixed fall colors, so a forest has a mix of red, orange, and gold.
  const fallTree = (color) => `<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false"><rect x="17" y="38" width="6" height="20" rx="2" fill="#8a5f3a" />
      <circle cx="20" cy="26" r="16" fill="${color}" /><circle cx="12" cy="32" r="10" fill="${color}" /><circle cx="28" cy="32" r="10" fill="${color}" />
      <circle cx="15" cy="20" r="5" fill="#fff" opacity="0.18" /></svg>`;
  // A cherry tree with a paper lantern that only shows (and glows) in dark mode.
  const BLOSSOM_TREE = `<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false"><path d="M20 58 V36 M20 44 L13 36 M20 40 L27 33" stroke="#7a5446" stroke-width="3.5" stroke-linecap="round" />
      <circle cx="20" cy="24" r="15" fill="var(--scene-tree)" /><circle cx="10" cy="31" r="9" fill="var(--scene-tree)" /><circle cx="30" cy="30" r="9" fill="var(--scene-tree)" />
      <circle cx="14" cy="20" r="2" fill="#fff" opacity="0.6" /><circle cx="25" cy="27" r="2" fill="#fff" opacity="0.6" /><circle cx="19" cy="31" r="1.6" fill="#fff" opacity="0.6" />
      <g class="tree-lantern"><path d="M28 34 V38" stroke="#5a3d10" stroke-width="1" /><rect x="25" y="38" width="6" height="8" rx="3" fill="#ffb36b" /></g></svg>`;
  const BLOSSOM_BUSH = `<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false"><path d="M6 58 C2 40 12 30 20 30 C28 30 38 40 34 58 Z" fill="var(--scene-bush)" />
      <circle cx="14" cy="42" r="2.5" fill="#ffffff" /><circle cx="25" cy="38" r="2.5" fill="#ffe3ec" /><circle cx="27" cy="48" r="2.5" fill="#ffffff" /></svg>`;

  // Candy land: gumdrop hills, lollipops, candy canes, and gumdrops.
  const GUMDROP_HILLS = `<svg class="scene-hills" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path class="scene-hill-far" d="M0 48 C4 34 14 34 18 46 C22 34 32 34 36 46 C40 34 50 34 54 46 C58 34 68 34 72 46 C76 34 86 34 90 46 C94 38 98 38 100 42 V100 H0 Z" />
      <path class="scene-hill-near" d="M0 58 C14 52 26 54 40 57 C56 61 70 50 84 53 C92 55 96 57 100 56 V100 H0 Z" />
    </svg>`;
  const LOLLIPOP = (color) => `<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false"><rect x="18.5" y="28" width="3" height="30" rx="1.5" fill="#fff" stroke="#e6d6e6" stroke-width="0.8" />
      <circle cx="20" cy="20" r="13" fill="${color}" /><path d="M20 20 m0 -9 a9 9 0 1 1 -8 5 a6 6 0 1 1 5 -3 a3 3 0 1 1 3 1" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" /></svg>`;
  const CANDY_CANE = `<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false"><path d="M22 58 V20 C22 10 10 10 10 18" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" />
      <path d="M22 58 V20 C22 10 10 10 10 18" fill="none" stroke="#ff6f8e" stroke-width="6" stroke-dasharray="4 4" stroke-linecap="butt" /></svg>`;
  const GUMDROPS = `<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false"><path d="M4 58 C4 44 16 44 16 58 Z" fill="#7fd8b5" /><path d="M14 58 C14 40 28 40 28 58 Z" fill="#ffb3c7" /><path d="M24 58 C24 46 36 46 36 58 Z" fill="#c9b3ff" />
      <circle cx="9" cy="50" r="1" fill="#fff" /><circle cx="20" cy="47" r="1.2" fill="#fff" /><circle cx="29" cy="52" r="1" fill="#fff" /></svg>`;

  // Starry space: a moon's lilac surface with craters, and planets floating above it.
  const MOON_SURFACE = `<svg class="scene-hills" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path class="scene-hill-far" d="M0 50 C20 44 40 47 60 45 C80 43 90 48 100 46 V100 H0 Z" />
      <path class="scene-hill-near" d="M0 58 C14 54 26 56 40 58 C56 61 70 53 84 55 C92 56 96 58 100 57 V100 H0 Z" />
      <g class="scene-craters"><ellipse cx="10" cy="80" rx="4" ry="1.6" /><ellipse cx="36" cy="92" rx="5" ry="2" /><ellipse cx="62" cy="84" rx="3.5" ry="1.4" /><ellipse cx="88" cy="90" rx="4.5" ry="1.8" /></g>
    </svg>`;
  const RINGED_PLANET = `<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false"><circle cx="20" cy="18" r="10" fill="#ffb36b" />
      <ellipse cx="20" cy="18" rx="17" ry="4.5" fill="none" stroke="#ffe3a8" stroke-width="2.2" transform="rotate(-15 20 18)" /><circle cx="16" cy="14" r="2.5" fill="#fff" opacity="0.25" /></svg>`;
  const SMALL_PLANET = `<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false"><circle cx="20" cy="24" r="8" fill="#8fd3ff" /><path d="M13 21 C17 23 23 19 27 22 M14 27 C18 29 22 26 26 28" fill="none" stroke="#5aa7e0" stroke-width="1.5" stroke-linecap="round" /></svg>`;
  const ROCKET = `<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false"><path d="M20 10 C27 18 27 34 25 42 H15 C13 34 13 18 20 10 Z" fill="#f4f1ff" stroke="#c9b3ff" stroke-width="1.5" />
      <circle cx="20" cy="24" r="3.5" fill="#8fd3ff" stroke="#c9b3ff" stroke-width="1.2" /><path d="M15 34 L10 44 H15 Z M25 34 L30 44 H25 Z" fill="#ff8a9c" /><path d="M17 42 L20 52 L23 42 Z" fill="#ffd166" /></svg>`;

  const SCENE_CLOUD = `<svg viewBox="0 0 60 30" aria-hidden="true" focusable="false">
      <path d="M12 26 C4 26 2 18 8 15 C8 8 18 6 22 11 C25 4 38 4 40 12 C48 10 56 16 52 24 C51 26 49 26 48 26 Z" fill="var(--scene-cloud)" /></svg>`;

  // Each theme's scenery: hills, things on the far hill, little things in the front, the path's
  // surface (laid at real size by layPathDetails), and anything falling from the sky.
  const PATH_THEMES = {
    meadow: { name: 'Meadow', hills: MEADOW_HILLS, trees: [ROUND_TREE, PINE_TREE, FLOWER_BUSH], ground: ['#ffb3c7', '#fff3b0', '#ffffff', '#d4c6ff'], path: 'cobble', falling: null },
    beach: { name: 'Beach boardwalk', hills: BEACH_HILLS, trees: [PALM_TREE, PALM_TREE, BEACH_UMBRELLA], ground: ['#ffd1dc', '#ffffff', '#ffe3b3', '#f7b9a8'], path: 'planks', falling: null },
    snow: { name: 'Snowy trail', hills: MEADOW_HILLS, trees: [SNOWY_PINE, SNOWY_PINE, SNOWMAN], ground: [], path: 'snow', falling: 'snow' },
    autumn: { name: 'Autumn forest', hills: MEADOW_HILLS, trees: [fallTree('#e8713c'), fallTree('#d9473b'), fallTree('#f2b13d'), PINE_TREE], ground: ['#e8713c', '#d9473b', '#f2b13d', '#b5652f'], path: 'leaves', falling: 'leaves' },
    blossom: { name: 'Cherry blossom lane', hills: MEADOW_HILLS, trees: [BLOSSOM_TREE, BLOSSOM_TREE, BLOSSOM_BUSH], ground: ['#ffc4d8', '#ffffff', '#ffd9e5'], path: 'slabs', falling: 'petals' },
    candy: { name: 'Candy land', hills: GUMDROP_HILLS, trees: [LOLLIPOP('#ff8fb1'), LOLLIPOP('#8fd3ff'), CANDY_CANE, GUMDROPS], ground: ['#ff8fb1', '#8fd3ff', '#ffe08a', '#b5f0c8', '#c9b3ff'], path: 'candy', falling: 'sprinkles' },
    space: { name: 'Starry space', hills: MOON_SURFACE, trees: [RINGED_PLANET, SMALL_PLANET, ROCKET], ground: [], path: 'glow', falling: 'stars' },
  };

  // The viewed semester's theme (each semester remembers its own owned pick), else Meadow.
  function currentPathTheme() {
    const picked = buddy.pathThemeFor(state, state.currentSemesterId);
    return PATH_THEMES[picked] ? picked : 'meadow';
  }

  // A steady, varied-looking number from 0 to 1 for each decoration, so the scene doesn't
  // reshuffle every time the page redraws.
  function sceneJitter(index, salt) {
    const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
    return value - Math.floor(value);
  }

  function renderScenery(stoneCount, theme) {
    const spots = Math.max(6, stoneCount + 2);
    const trees = Array.from({ length: spots }, (_, index) => {
      const x = ((index + 0.3 + sceneJitter(index, 1) * 0.5) / spots) * 100;
      const size = 34 + Math.round(sceneJitter(index, 2) * 18);
      const art = theme.trees[Math.floor(sceneJitter(index, 3) * theme.trees.length)];
      return `<div class="scene-tree" style="left: ${x.toFixed(1)}%; width: ${size}px">${art}</div>`;
    }).join('');
    const clouds = Array.from({ length: Math.ceil(spots / 2) }, (_, index) => {
      const x = ((index + sceneJitter(index, 4)) / Math.ceil(spots / 2)) * 100;
      const y = 6 + sceneJitter(index, 5) * 16;
      return `<div class="scene-cloud" style="left: ${x.toFixed(1)}%; top: ${y.toFixed(1)}%; animation-delay: -${Math.round(sceneJitter(index, 6) * 20)}s">${SCENE_CLOUD}</div>`;
    }).join('');
    // Flowers in the meadow, shells on the beach.
    const ground = theme.ground.length
      ? Array.from({ length: spots * 2 }, (_, index) => {
          const x = ((index + sceneJitter(index, 7)) / (spots * 2)) * 100;
          const color = theme.ground[index % theme.ground.length];
          return `<span class="scene-flower" style="left: ${x.toFixed(1)}%; bottom: ${(4 + sceneJitter(index, 8) * 10).toFixed(1)}px; --flower: ${color}"></span>`;
        }).join('')
      : '';
    // Snow, leaves, or petals drifting down. Leaves take the ground's fall colors.
    const falling = theme.falling
      ? Array.from({ length: theme.falling === 'snow' ? spots * 3 : spots * 2 }, (_, index) => {
          const x = (sceneJitter(index, 10) * 100).toFixed(1);
          const delay = (sceneJitter(index, 11) * 8).toFixed(1);
          const small = theme.falling === 'snow' || theme.falling === 'stars';
          const size = ((small ? 2 : 5) + sceneJitter(index, 12) * 3).toFixed(1);
          const color = theme.ground.length ? `; --fall-color: ${theme.ground[index % theme.ground.length]}` : '';
          // Stars stay up in the sky and twinkle instead of falling.
          const top = theme.falling === 'stars' ? `top: ${(sceneJitter(index, 17) * 40).toFixed(1)}%; ` : '';
          return `<span class="scene-falling is-${theme.falling}" style="${top}left: ${x}%; width: ${size}px; height: ${size}px; animation-delay: -${delay}s${color}"></span>`;
        }).join('')
      : '';
    return `<div class="buddy-path-scene" aria-hidden="true">
        <span class="scene-sun"></span>
        ${clouds}
        ${theme.hills}
        ${trees}
        ${ground}
        ${falling}
      </div>`;
  }

  // The path's edge and bed stretch with the trail; its surface (cobblestones, boardwalk planks,
  // or footprints in snow) is laid on top at real size once the page knows how big the track is.
  function renderCobbleBed(trail) {
    return `<path class="cobble-edge" d="M${trail}" /><path class="cobble-bed" d="M${trail}" />`;
  }

  // The surface is laid at real size, so it's laid again whenever the track's size changes: when
  // it's first shown, and when the window is resized.
  const cobbleObserver = new ResizeObserver(() => layPathDetails());

  const COBBLE_SPACING = 11; // px between stones along the path
  const COBBLE_ROW_OFFSETS = [-7.5, 0, 7.5]; // px across the path
  const PLANK_SPACING = 9; // px between boardwalk planks
  const FOOTPRINT_SPACING = 15; // px between footprints in the snow

  // Spots every `spacing` pixels along the drawn trail, each with the direction the trail runs there.
  function spotsAlongTrail(width, height, waves, spacing) {
    const point = (along) => {
      const { x, y } = pathPoint(along, waves);
      return { x: (x / 100) * width, y: (y / 100) * height };
    };
    const spots = [];
    let previous = point(0);
    let travelled = 0;
    for (let step = 1; step <= 600; step += 1) {
      const next = point(step / 600);
      travelled += Math.hypot(next.x - previous.x, next.y - previous.y);
      while (travelled >= spacing * spots.length) {
        spots.push({ x: next.x, y: next.y, angle: Math.atan2(next.y - previous.y, next.x - previous.x) });
      }
      previous = next;
    }
    return spots;
  }

  const degrees = (angle) => ((angle * 180) / Math.PI).toFixed(0);

  // Three staggered rows of rounded stones across the path, each a slightly different size and shade.
  function cobblestoneMarkup(width, height, waves) {
    return spotsAlongTrail(width, height, waves, COBBLE_SPACING).flatMap(({ x: cx, y: cy, angle }, placed) =>
      COBBLE_ROW_OFFSETS.map((offset, row) => {
        const stagger = row === 1 ? COBBLE_SPACING / 2 : 0;
        const x = cx - Math.sin(angle) * offset + Math.cos(angle) * stagger;
        const y = cy + Math.cos(angle) * offset + Math.sin(angle) * stagger;
        const jitter = sceneJitter(placed * 3 + row, 9);
        return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(4.2 + jitter * 1.2).toFixed(1)}" ry="${(3.1 + jitter).toFixed(1)}"
            transform="rotate(${degrees(angle)} ${x.toFixed(1)} ${y.toFixed(1)})" class="cobble-stone${jitter > 0.66 ? ' is-light' : jitter < 0.25 ? ' is-dark' : ''}" />`;
      }),
    );
  }

  // Wooden boardwalk planks laid across the path.
  function plankMarkup(width, height, waves) {
    return spotsAlongTrail(width, height, waves, PLANK_SPACING).map(({ x, y, angle }, placed) => {
      const jitter = sceneJitter(placed, 13);
      return `<rect x="${(x - 3.5).toFixed(1)}" y="${(y - 12).toFixed(1)}" width="7" height="24" rx="1.5"
          transform="rotate(${degrees(angle)} ${x.toFixed(1)} ${y.toFixed(1)})" class="path-plank${jitter > 0.6 ? ' is-light' : jitter < 0.25 ? ' is-dark' : ''}" />`;
    });
  }

  // Footprints pressed into the snow, left and right in turn.
  function footprintMarkup(width, height, waves) {
    return spotsAlongTrail(width, height, waves, FOOTPRINT_SPACING).map(({ x: cx, y: cy, angle }, placed) => {
      const side = placed % 2 === 0 ? -4 : 4;
      const x = cx - Math.sin(angle) * side;
      const y = cy + Math.cos(angle) * side;
      return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="4" ry="2.3" transform="rotate(${degrees(angle)} ${x.toFixed(1)} ${y.toFixed(1)})" class="path-footprint" />`;
    });
  }

  // A dirt path with fallen leaves scattered across it, in fall colors.
  const LEAF_COLORS = ['#e8713c', '#d9473b', '#f2b13d', '#b5652f'];
  function leafMarkup(width, height, waves) {
    return spotsAlongTrail(width, height, waves, 7).map(({ x: cx, y: cy, angle }, placed) => {
      const across = (sceneJitter(placed, 14) - 0.5) * 18;
      const x = cx - Math.sin(angle) * across;
      const y = cy + Math.cos(angle) * across;
      const turn = Math.round(sceneJitter(placed, 15) * 180);
      return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="3.6" ry="1.9" transform="rotate(${turn} ${x.toFixed(1)} ${y.toFixed(1)})"
          fill="${LEAF_COLORS[placed % LEAF_COLORS.length]}" class="path-leaf" />`;
    });
  }

  // Pale stone slabs laid across the path, with a little gap between each.
  function slabMarkup(width, height, waves) {
    return spotsAlongTrail(width, height, waves, 16).map(({ x, y, angle }, placed) => {
      const jitter = sceneJitter(placed, 16);
      return `<rect x="${(x - 6.5).toFixed(1)}" y="${(y - 10.5).toFixed(1)}" width="13" height="21" rx="3.5"
          transform="rotate(${degrees(angle)} ${x.toFixed(1)} ${y.toFixed(1)})" class="path-slab${jitter > 0.6 ? ' is-light' : ''}" />`;
    });
  }

  // Candy stripes across the path, alternating pink and white like a candy cane.
  function candyStripeMarkup(width, height, waves) {
    return spotsAlongTrail(width, height, waves, 6).map(
      ({ x, y, angle }, placed) =>
        `<rect x="${(x - 3).toFixed(1)}" y="${(y - 12).toFixed(1)}" width="6" height="24"
          transform="rotate(${degrees(angle)} ${x.toFixed(1)} ${y.toFixed(1)})" class="path-candy${placed % 2 === 0 ? ' is-pink' : ''}" />`,
    );
  }

  // Round glowing stepping stones floating along the path.
  function glowStoneMarkup(width, height, waves) {
    return spotsAlongTrail(width, height, waves, 18).map(
      ({ x, y }, placed) =>
        `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(7 + sceneJitter(placed, 18) * 2).toFixed(1)}" class="path-glow-stone" />`,
    );
  }

  const PATH_SURFACES = {
    cobble: cobblestoneMarkup,
    planks: plankMarkup,
    snow: footprintMarkup,
    leaves: leafMarkup,
    slabs: slabMarkup,
    candy: candyStripeMarkup,
    glow: glowStoneMarkup,
  };

  function layPathDetails() {
    const track = elements.dueList.querySelector('.buddy-path-track');
    const layer = track && track.querySelector('.cobble-stones');
    if (!layer) {
      return;
    }
    const width = track.clientWidth;
    const height = track.clientHeight;
    // A hidden tab has no size yet; the observer above lays them once it's shown.
    if (width === 0 || height === 0) {
      return;
    }
    const surface = PATH_SURFACES[PATH_THEMES[currentPathTheme()].path];
    layer.setAttribute('viewBox', `0 0 ${width} ${height}`);
    layer.innerHTML = surface(width, height, Number(track.dataset.waves)).join('');
  }

  // ---------- The theme shop ----------

  function openThemeShop() {
    renderThemeShop();
    if (!elements.shopDialog.open) {
      elements.shopDialog.showModal();
    }
  }

  const SHOP_POSITIONS = { start: 'Start of', middle: 'Middle of', end: 'End of' };

  // A tiny picture of a theme: its sky, ground, and path colors.
  function themeSwatch(themeId) {
    return `<span class="buddy-path shop-preview" data-theme="${themeId}" aria-hidden="true"><span class="shop-preview-ground"></span><span class="shop-preview-path"></span></span>`;
  }

  // What a shop card offers: In use, Use, Buy, not enough gems yet, or when it unlocks.
  function shopAction(themeId, status, price, unlocksOn) {
    if (status === 'owned') {
      return themeId === currentPathTheme()
        ? '<span class="shop-in-use">In use ✓</span>'
        : `<button type="button" class="secondary-button" data-action="shop-use" data-theme-id="${themeId}">Use</button>`;
    }
    if (status === 'locked') {
      return `<span class="buddy-muted">🔒 Unlocks ${model.formatMonthDay(unlocksOn)}</span>`;
    }
    if (status === 'short') {
      return `<button type="button" class="secondary-button" disabled>Need 💎 ${price - buddy.gemBalance(state)} more</button>`;
    }
    return `<button type="button" class="primary-button" data-action="shop-buy" data-theme-id="${themeId}">Buy for 💎 ${price}</button>`;
  }

  function shopCard(themeId, label, action) {
    return `<li class="shop-card">
        ${themeSwatch(themeId)}
        <strong>${PATH_THEMES[themeId].name}</strong>
        <span class="buddy-muted">${label}</span>
        ${action}
      </li>`;
  }

  // The viewed semester's season themes, the specials, and owned themes from other seasons.
  function renderThemeShop() {
    const semester = currentSemester();
    const shop = buddy.themeShop(state, semester.id, todayKey());
    const cards = (items) => items.map((item) => shopCard(item.themeId, item.label, shopAction(item.themeId, item.status, item.price, item.unlocksOn))).join('');
    const seasons = shop
      .filter((item) => item.position !== 'special')
      .map((item) => ({ ...item, label: `${SHOP_POSITIONS[item.position]} ${escapeHtml(semester.name)}` }));
    const specials = shop.filter((item) => item.position === 'special').map((item) => ({ ...item, label: 'Any semester' }));
    const inShop = new Set(shop.map((item) => item.themeId));
    const others = Object.keys(PATH_THEMES)
      .filter((themeId) => !inShop.has(themeId) && buddy.ownsTheme(state, themeId))
      .map((themeId) => ({ themeId, status: 'owned', label: themeId === 'meadow' ? 'Free' : 'Yours' }));
    elements.shopDialog.innerHTML = `
      <h2 id="shop-heading">Theme shop</h2>
      <p class="shop-balance">You have <strong>💎 ${buddy.gemBalance(state)}</strong>. Earn gems by checking things off on time.</p>
      <h3 class="due-heading">${escapeHtml(semester.name)}’s seasons</h3>
      <ul class="shop-grid">${cards(seasons)}</ul>
      <h3 class="due-heading">Specials</h3>
      <ul class="shop-grid">${cards(specials)}</ul>
      <h3 class="due-heading">Your themes</h3>
      <ul class="shop-grid">${cards(others)}</ul>
      <p class="buddy-muted">Themes you buy are yours in every semester. Switching is free, and each semester keeps its own.</p>
      <div class="button-row"><button type="button" class="text-button" data-action="close-shop">Close</button></div>`;
  }

  async function buyPathTheme(themeId) {
    const offer = buddy.themeShop(state, state.currentSemesterId, todayKey()).find((item) => item.themeId === themeId);
    const name = PATH_THEMES[themeId].name;
    const answer = await askChoice(`Buy ${name} for 💎 ${offer.price}? It goes on this semester’s path right away.`, [
      { value: 'buy', label: `Buy for 💎 ${offer.price}`, className: 'primary-button' },
    ]);
    if (answer !== 'buy') {
      return;
    }
    applyChange(`Bought ${name}! It’s on your path now 🎉`, () => buddy.buyTheme(state, state.currentSemesterId, themeId, todayKey()));
    renderThemeShop();
  }

  function usePathTheme(themeId) {
    applyChange(`Path theme: ${PATH_THEMES[themeId].name}`, () => buddy.useTheme(state, state.currentSemesterId, themeId));
    renderThemeShop();
  }

  // The week as a winding trail: one stone per assignment, the buddy on the next one to do, and
  // a chest at the end.
  function renderGameView() {
    const { stones, buddyStone } = model.buildPathWeek(model.buildDueList(state), weekStart, todayKey(), currentTime());
    const count = stones.length;
    // Longer weeks get more bends, so a long trail still winds.
    const waves = Math.max(1.25, count / 4);
    const stoneAlong = (index) => (count === 0 ? 0 : index / count);
    const trail = Array.from({ length: PATH_SAMPLES + 1 }, (_, sample) => {
      const { x, y } = pathPoint(sample / PATH_SAMPLES, waves);
      return `${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' L');
    const buddySpot = pathPoint(stoneAlong(buddyStone), waves);
    const chestSpot = pathPoint(1, waves);
    const atChest = count > 0 && buddyStone === count;
    const chest = buddy.chestFor(buddyView(), weekStart);
    return `
      <h3 class="buddy-path-title">Buddy’s Path</h3>
      ${renderWeekNav()}
      <div class="buddy-path-frame">
      ${renderPathHud(stones, chest)}
      <div class="buddy-path" id="buddy-path" data-theme="${currentPathTheme()}">
        <div class="buddy-path-track" style="min-width: ${(count + 1) * PATH_STONE_SPACING}px" data-waves="${waves}">
          ${renderScenery(count, PATH_THEMES[currentPathTheme()])}
          <svg class="buddy-path-trail" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
            ${renderCobbleBed(trail)}
          </svg>
          <svg class="cobble-stones" aria-hidden="true" focusable="false"></svg>
          ${renderPathGems(stones, waves)}
          ${stones.map((stone, index) => renderPathStone(stone, index, stoneAlong(index), waves)).join('')}
          ${count > 0 ? renderPathChest(chest, chestSpot) : ''}
          ${(state.friends || [])
            .filter((friend) => friend.challenge.week === weekStart)
            .map((friend) => renderFriendGhost(friend, waves))
            .join('')}
          <div class="buddy-path-buddy${atChest ? ' is-at-chest' : ''}" style="left: ${buddySpot.x}%; top: ${buddySpot.y}%" data-along="${stoneAlong(buddyStone)}">${drawGameBuddy()}</div>
        </div>
      </div>
      </div>
      ${currentBuddy() ? '<div class="shop-row"><button type="button" class="secondary-button" data-action="open-shop">🛒 Theme shop</button></div>' : ''}
      ${renderNextUp(stones, buddyStone, chest)}
      ${renderPathList(stones)}
      ${
        currentBuddy()
          ? `<div class="challenge-row">
              <button type="button" class="secondary-button" data-action="open-challenge">Challenge a friend</button>
              <span class="buddy-muted">Sends your buddy and this week’s progress, never your assignments.</span>
            </div>`
          : ''
      }
      ${renderFriends()}`;
  }

  // A friend's buddy on your trail, see-through, as far along as they were when they sent
  // their link. Only for the week their link is from.
  function renderFriendGhost({ challenge }, waves) {
    const along = challenge.total === 0 ? 0 : challenge.done / challenge.total;
    const { x, y } = pathPoint(along, waves);
    const name = challenge.name || 'Friend';
    return `<div class="buddy-path-friend" style="left: ${x}%; top: ${y}%" title="${escapeHtml(name)}: ${buddy.challengePercent(challenge)}%">
        ${buddy.drawBuddy(challenge.stage, 0, 'happy', {}, challenge.color, challenge.species)}
        <span>${escapeHtml(name)}</span>
      </div>`;
  }

  // Everyone whose challenge link you've opened, with their progress for the viewed week.
  function renderFriends() {
    const friends = state.friends || [];
    if (friends.length === 0) {
      return '';
    }
    const cards = friends
      .map(({ key, challenge }) => {
        const name = challenge.name || 'A friend';
        const progress =
          challenge.week !== weekStart
            ? `<span class="buddy-muted">Last link: week of ${weekRangeLabel(challenge.week)}</span>`
            : challenge.total === 0
              ? '<span class="buddy-muted">Nothing due this week</span>'
              : `<span>${challenge.done} of ${challenge.total} done · <strong>${buddy.challengePercent(challenge)}%</strong></span>`;
        return `<li class="friend-card">
            ${buddy.drawBuddy(challenge.stage, 0, 'happy', {}, challenge.color, challenge.species)}
            <span class="friend-text">
              <strong>${escapeHtml(name)}</strong>
              ${progress}
            </span>
            <button type="button" class="text-button" data-action="remove-friend" data-key="${escapeHtml(key)}"
              aria-label="Remove ${escapeHtml(name)} from Friends">Remove</button>
          </li>`;
      })
      .join('');
    return `<section class="friends" aria-label="Friends">
        <h4 class="friends-heading">Friends</h4>
        <ul class="friend-list">${cards}</ul>
        <p class="buddy-muted">As of each friend’s last link. Ask for a new one to see their latest.</p>
      </section>`;
  }

  // A gem after each flag, halfway to the next one. Waiting gems sparkle, taken ones are gone
  // (collected), and lost ones (late, missed, or past due) are dull gray.
  const GEM_ART = `<svg viewBox="0 0 20 18" aria-hidden="true" focusable="false">
      <path d="M5 1 H15 L19 6 L10 17 L1 6 Z" class="gem-body" />
      <path d="M1 6 H19 M5 1 L7.5 6 L10 17 L12.5 6 L15 1 M7.5 6 L10 1 L12.5 6" class="gem-facets" />
    </svg>`;

  function renderPathGems(stones, waves) {
    if (!currentBuddy() || stones.length === 0) {
      return '';
    }
    return stones
      .map(({ item }, index) => {
        const status = buddy.gemStatus(buddyView(), item, todayKey(), currentTime());
        const along = (index + 0.5) / stones.length;
        const { x, y } = pathPoint(along, waves);
        return `<span class="path-gem is-${status}" style="left: ${x}%; top: ${y}%" data-along="${along}"
            data-id="${item.assignment.id}" data-date="${item.date}" aria-hidden="true">${GEM_ART}</span>`;
      })
      .join('');
  }

  // The gem a check-off just earned shows until the buddy reaches it, then sparkles away.
  function holdGemForPickup(assignment, date) {
    const gem = elements.dueList.querySelector(`.path-gem.is-taken[data-id="${assignment.id}"][data-date="${date}"]`);
    gem?.classList.add('is-awaiting');
    return gem;
  }

  function pickUpGems(buddyAlong) {
    elements.dueList.querySelectorAll('.path-gem.is-awaiting').forEach((gem) => {
      if (buddyAlong === null || Number(gem.dataset.along) <= buddyAlong + 0.001) {
        gem.classList.remove('is-awaiting');
        gem.classList.add('is-picked');
      }
    });
  }

  // The game-style bar over the sky: the week's progress, the chest, and the buddy's points.
  // It sits outside the scrolling path, so it stays put on a long week.
  function renderPathHud(stones, chest) {
    const done = stones.filter((stone) => stone.status === 'done').length;
    const total = stones.length;
    const progress =
      total === 0
        ? '<span class="hud-progress">Nothing due</span>'
        : `<span class="hud-progress" aria-label="${done} of ${total} done this week">⭐ <strong class="hud-count">${done} / ${total}</strong>
            <span class="hud-bar" aria-hidden="true"><span style="width: ${(done / total) * 100}%"></span></span></span>`;
    const chestLabels = { locked: 'Chest: finish the week to open it', ready: 'Chest: ready to open!', opened: 'Chest: opened' };
    const chestIcon =
      total === 0
        ? ''
        : `<span class="hud-chest is-${chest.status}" title="${chestLabels[chest.status]}" aria-label="${chestLabels[chest.status]}">${chest.status === 'opened' ? OPEN_TREASURE_CHEST : TREASURE_CHEST}</span>`;
    let buddyText = '';
    if (currentBuddy()) {
      const points = buddyPoints();
      const grown = buddy.stageFor(points).index === buddy.STAGES.length - 1;
      buddyText = `<span class="hud-buddy">${escapeHtml(buddy.displayName(currentBuddy()))} · <strong class="hud-points">${points}</strong> ✨${grown ? ' 🌼' : ''}</span>`;
    }
    const gems = currentBuddy()
      ? `<button type="button" class="hud-gems" data-action="open-shop" aria-label="${buddy.gemBalance(state)} gems. Open the theme shop">${GEM_ART}<strong class="hud-gem-count">${buddy.gemBalance(state)}</strong></button>`
      : '';
    return `<div class="buddy-path-hud"><span class="hud-left">${progress}${gems}</span>${chestIcon}${buddyText}</div>`;
  }

  // ---------- The buddy hopping along the path ----------

  const HOP_MS_PER_STEP = 420; // about how long it takes to hop from one flag to the next
  const HOP_HEIGHT = 14; // px

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Where the buddy stands on the path right now (0 = start, 1 = the chest), or null when the
  // path isn't showing.
  function pathBuddyAlong() {
    const element = elements.dueList.querySelector('.buddy-path-buddy');
    return element ? Number(element.dataset.along) : null;
  }

  // Moves the just-redrawn buddy from where it was (fromAlong) to its new spot, hopping along the
  // curve of the path, and keeps it in view. Calls done when it lands. Reduce motion skips the hop.
  function hopBuddyAlongPath(fromAlong, done = () => {}) {
    const element = elements.dueList.querySelector('.buddy-path-buddy');
    const track = elements.dueList.querySelector('.buddy-path-track');
    const toAlong = element ? Number(element.dataset.along) : null;
    if (!element || fromAlong === null || fromAlong === toAlong || prefersReducedMotion()) {
      pickUpGems(null);
      done();
      return;
    }
    const waves = Number(track.dataset.waves);
    const stoneCount = track.querySelectorAll('.path-stone').length || 1;
    const steps = Math.abs(toAlong - fromAlong) * stoneCount;
    const duration = Math.min(1600, Math.max(500, steps * HOP_MS_PER_STEP));
    const hops = Math.max(2, Math.round(steps * 2));
    const path = document.getElementById('buddy-path');
    // Until it lands, the buddy stands like it does on the path, even when it's heading for the chest.
    const atChest = element.classList.contains('is-at-chest');
    element.classList.remove('is-at-chest');
    const started = performance.now();
    const frame = (now) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;
      const { x, y } = pathPoint(fromAlong + (toAlong - fromAlong) * eased, waves);
      element.style.left = `${x}%`;
      element.style.top = `${y}%`;
      element.style.translate = `0 ${-Math.abs(Math.sin(progress * hops * Math.PI)) * HOP_HEIGHT}px`;
      path.scrollLeft = element.offsetLeft - path.clientWidth / 3;
      pickUpGems(fromAlong + (toAlong - fromAlong) * eased);
      if (progress < 1) {
        requestAnimationFrame(frame);
      } else {
        pickUpGems(null);
        element.style.translate = '';
        element.classList.toggle('is-at-chest', atChest);
        done();
      }
    };
    requestAnimationFrame(frame);
  }

  // On a trail too long for the screen, brings the buddy into view.
  function scrollPathToBuddy() {
    const path = document.getElementById('buddy-path');
    path.scrollLeft = path.querySelector('.buddy-path-buddy').offsetLeft - path.clientWidth / 3;
  }

  // ---------- Challenging a friend ----------

  // A random id for this planner's links, made once, so friends who get several of your links
  // see one of you, not several. It says nothing about you.
  function myChallengeId() {
    if (!state.challengeId) {
      const bytes = crypto.getRandomValues(new Uint8Array(8));
      state.challengeId = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
      PlannerStorage.save(state);
    }
    return state.challengeId;
  }

  // This week's progress for the viewed semester's buddy, whichever week is on screen.
  function myChallenge() {
    return { ...buddy.challengeFor(buddyView(), model.startOfWeek(todayKey()), todayKey(), currentTime()), from: myChallengeId() };
  }

  // After the #, so the challenge is never sent to the website, only read by the page.
  function challengeLink() {
    return `${location.origin}${location.pathname}#challenge=${buddy.encodeChallenge(myChallenge())}`;
  }

  function renderChallengeCard(challenge, label) {
    const percent = buddy.challengePercent(challenge);
    const progress =
      challenge.total === 0
        ? '<span class="buddy-muted">Nothing due this week</span>'
        : `<span>${challenge.done} of ${challenge.total} done · <strong>${percent}%</strong></span>
           <span class="progress-bar" aria-hidden="true"><span class="progress-fill" style="width: ${percent}%"></span></span>`;
    return `<div class="challenge-card">
        ${buddy.drawBuddy(challenge.stage, 0, 'happy', {}, challenge.color, challenge.species)}
        <strong>${escapeHtml(label)}</strong>
        ${progress}
      </div>`;
  }

  function openChallengeDialog(html) {
    elements.challengeDialog.innerHTML = html;
    if (!elements.challengeDialog.open) {
      elements.challengeDialog.showModal();
    }
  }

  // Your buddy and progress, with the link to copy.
  function showChallengeLink(heading) {
    const link = challengeLink();
    openChallengeDialog(`
      <h2 id="challenge-heading">${heading}</h2>
      <div class="challenge-cards">${renderChallengeCard(myChallenge(), buddy.displayName(currentBuddy()))}</div>
      <p class="hint">Send this link. It shows your buddy and this week’s progress as of right now, never your assignments or classes.</p>
      <input class="challenge-link" id="challenge-link" type="text" readonly value="${link}" aria-label="Challenge link" />
      <p class="backup-status" id="challenge-status" role="status"></p>
      <div class="button-row">
        <button type="button" class="primary-button" data-action="copy-challenge-link">Copy link</button>
        <button type="button" class="text-button" data-action="close-challenge">Close</button>
      </div>`);
  }

  // Sends your challenge in as few taps as the device allows: its share menu (phones, Safari),
  // else straight to the clipboard, else the box with the link to copy by hand.
  async function sendChallenge(heading) {
    const link = challengeLink();
    if (elements.challengeDialog.open) {
      elements.challengeDialog.close();
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Study Buddy challenge', text: 'Can you finish more of your week than me? 🐾', url: link });
        showToast('Challenge sent! 🎉', null);
      } catch (error) {
        // Closing the share menu without picking anyone isn't a problem worth a message.
        if (error.name !== 'AbortError') {
          showChallengeLink(heading);
        }
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      showToast('Link copied! Paste it to your friend.', null);
    } catch {
      showChallengeLink(heading);
    }
  }

  async function copyChallengeLink() {
    const input = document.getElementById('challenge-link');
    const status = document.getElementById('challenge-status');
    try {
      await navigator.clipboard.writeText(input.value);
      status.textContent = 'Link copied! Send it to a friend.';
    } catch {
      input.select();
      status.textContent = 'Couldn’t copy automatically, so the link is selected. Copy it from there.';
    }
  }

  function challengeVerdict(mine, theirs) {
    if (mine.week !== theirs.week) {
      return `This link is from the week of ${weekRangeLabel(theirs.week)}, so it can’t be compared with this week. Ask for a new one!`;
    }
    const verdicts = {
      ahead: 'You’re ahead! 🎉',
      behind: 'They’re ahead. Time to catch up! 🔥',
      tied: 'It’s a tie!',
    };
    return verdicts[buddy.compareChallenges(mine, theirs)] || 'Nothing to compare yet: one of you has nothing due this week.';
  }

  const FRIEND_SAVED_TEXT = {
    added: 'Saved to Friends on your Game page.',
    updated: 'Updated on your Game page.',
    older: 'You already have a newer link from them, so your Game page keeps that one.',
    self: 'This is your own link, so it isn’t saved to Friends.',
  };

  // A challenge someone sent: their buddy and progress beside yours, and a way to answer.
  function showReceivedChallenge(theirs, savedAs) {
    const yours = currentBuddy() ? myChallenge() : null;
    openChallengeDialog(`
      <h2 id="challenge-heading">${theirs.name ? escapeHtml(theirs.name) : 'A friend'} challenged you!</h2>
      <div class="challenge-cards">
        ${renderChallengeCard(theirs, theirs.name || 'Their buddy')}
        ${yours ? renderChallengeCard(yours, buddy.displayName(currentBuddy())) : ''}
      </div>
      <p class="challenge-verdict">${yours ? challengeVerdict(yours, theirs) : 'Pick your Study Buddy on the Study Buddy tab to send one back.'}</p>
      <p class="hint challenge-saved">${FRIEND_SAVED_TEXT[savedAs]}</p>
      <div class="button-row">
        ${yours ? '<button type="button" class="primary-button" data-action="send-challenge-back">Send yours back</button>' : ''}
        <button type="button" class="text-button" data-action="close-challenge">Close</button>
      </div>`);
  }

  // Opens the challenge in the address bar, if there is one, then takes it out so it doesn't
  // open again on every refresh.
  function openChallengeFromLink() {
    const match = location.hash.match(/^#challenge=(.+)$/);
    if (!match) {
      return;
    }
    history.replaceState(null, '', location.pathname + location.search);
    const challenge = buddy.readChallenge(match[1]);
    if (challenge) {
      const savedAs = buddy.saveFriend(state, challenge, state.challengeId);
      if (savedAs === 'added' || savedAs === 'updated') {
        PlannerStorage.save(state);
        render();
      }
      showReceivedChallenge(challenge, savedAs);
    } else {
      showToast('That challenge link didn’t work. Ask your friend for a new one.', null);
    }
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

  // Finals get a plain title instead of a banner: the word FINALS with the dates under it.
  function renderFinalsTitle() {
    const semester = currentSemester();
    return `
      <div class="finals-title">
        <h3>Finals</h3>
        <p>
          ${model.formatDate(semester.finalsStartDate)} – ${model.formatDate(semester.endDate)} · no classes
          <button type="button" class="text-button" data-action="edit-semester" aria-label="Edit finals dates">✎</button>
        </p>
      </div>`;
  }

  // Banners for every break covering any of the given dates, then the finals title if finals are among them.
  function renderBreakBanners(dates) {
    const breakBanners = model.bannerBreaks(state, model.startOfWeek(dates[0])).map(renderBreakBanner).join('');
    const finalsTitle = dates.some((date) => model.finalsDayKind(state, date) === 'finals') ? renderFinalsTitle() : '';
    return breakBanners + finalsTitle;
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

  // Lets a one-time block be dragged to a new time, and adds Change time… to its menu.
  function movableData(kind, id, rsoId = '') {
    return `data-move-kind="${kind}" data-move-id="${id}"${rsoId ? ` data-move-rso="${rsoId}"` : ''}`;
  }

  function changeTimeButton(kind, id, rsoId = '') {
    return `<button type="button" data-action="change-time" ${movableData(kind, id, rsoId)}>Change time…</button>`;
  }

  function examTag(exam) {
    return exam.isFinal ? 'Final' : 'Exam';
  }

  // An exam (or quiz) on the calendar, in its class's color and marked EXAM, FINAL, or QUIZ.
  // Clicking it opens a menu to edit or delete it.
  function renderExamBlock(block, startHour) {
    const { plannerClass, kind } = block;
    const exam = kind === 'quiz' ? block.quiz : block.exam;
    const { height, style } = blockPlacement(block, startHour);
    const title = escapeHtml(exam.title);
    const details = height >= HOUR_HEIGHT && exam.location ? `<span class="class-block-details">${escapeHtml(exam.location)}</span>` : '';
    return `
      <details class="row-menu class-block-slot" style="${style}">
        <summary class="class-block is-exam" style="--class-color: ${plannerClass.color}" ${movableData(kind, exam.id)}
          title="${escapeHtml(plannerClass.name)} ${title}${exam.location ? ` · ${escapeHtml(exam.location)}` : ''}">
          <span class="class-block-name"><span class="exam-tag">${kind === 'quiz' ? 'Quiz' : examTag(exam)}</span> ${escapeHtml(plannerClass.name)} ${title}</span>
          ${details}
          <span class="class-block-time">${model.formatTimeRange(block.startTime, block.endTime)}</span>
        </summary>
        <div class="row-menu-items">
          ${changeTimeButton(kind, exam.id)}
          <button type="button" data-action="edit-${kind}" data-id="${exam.id}">Edit ${kind}…</button>
          <button type="button" class="danger" data-action="delete-${kind}" data-id="${exam.id}">Delete ${kind}</button>
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

  // A work session on the calendar: striped in its class's color and marked WORK. Clicking it
  // opens a menu to edit or delete it, or for a repeating one, to cancel just that date.
  function renderWorkBlock(block, startHour) {
    const { session, plannerClass, date, cancelled } = block;
    const { height, style } = blockPlacement(block, startHour);
    const name = `${escapeHtml(plannerClass.name)}${session.note ? ` ${escapeHtml(session.note)}` : ''}`;
    const details = cancelled ? 'Cancelled' : height >= HOUR_HEIGHT ? escapeHtml(session.location) : '';
    const dateData = `data-id="${session.id}" data-date="${date}"`;
    const dayAction = cancelled
      ? `<button type="button" data-action="restore-work" ${dateData}>Restore work session on ${model.formatDate(date)}</button>`
      : `<button type="button" class="danger" data-action="cancel-work" ${dateData}>Cancel work session on ${model.formatDate(date)}</button>`;
    return `
      <details class="row-menu class-block-slot" style="${style}">
        <summary class="class-block is-work${cancelled ? ' is-cancelled' : ''}" style="--class-color: ${plannerClass.color}" ${session.repeats ? '' : movableData('work', session.id)}
          title="Work session: ${name}${session.location ? ` · ${escapeHtml(session.location)}` : ''}${cancelled ? ' (cancelled)' : ''}">
          <span class="class-block-name"><span class="exam-tag">Work</span> ${name}</span>
          ${details ? `<span class="class-block-details">${details}</span>` : ''}
          <span class="class-block-time">${model.formatTimeRange(block.startTime, block.endTime)}</span>
        </summary>
        <div class="row-menu-items">
          ${session.repeats ? '' : changeTimeButton('work', session.id)}
          <button type="button" data-action="edit-work" data-id="${session.id}">Edit work session…</button>
          ${session.repeats ? dayAction : ''}
          <button type="button" class="danger" data-action="delete-work" data-id="${session.id}">Delete ${session.repeats ? 'all dates' : 'work session'}</button>
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
        <summary class="class-block is-event" style="--class-color: ${rso ? rso.color : event.color}" ${movableData(rso ? 'rso-event' : 'event', event.id, rso ? rso.id : '')}
          title="${name}${event.location ? ` · ${escapeHtml(event.location)}` : ''}">
          <span class="class-block-name">${name}</span>
          ${details}
          <span class="class-block-time">${model.formatTimeRange(block.startTime, block.endTime)}</span>
        </summary>
        <div class="row-menu-items">
          ${changeTimeButton(rso ? 'rso-event' : 'event', event.id, rso ? rso.id : '')}
          <button type="button" data-action="${rso ? 'edit-rso' : 'edit-event'}" data-id="${rso ? rso.id : event.id}">Edit ${rso ? escapeHtml(rso.name) : 'event'}…</button>
          <button type="button" class="danger" data-action="delete-event" ${eventData}>Delete event</button>
        </div>
      </details>`;
  }

  // ---------- Moving one-time things on the Calendar ----------

  function movableItemFrom(element) {
    const { moveKind, moveId, moveRso } = element.dataset;
    return model.findMovableItem(state, moveKind, moveId, moveRso);
  }

  // What to call it in messages: its title, or for a work session (which has none) its class.
  function movableItemName(item) {
    if (item.title) {
      return item.title;
    }
    const plannerClass = state.classes.find((candidate) => candidate.id === item.classId);
    return `${plannerClass ? plannerClass.name : 'Your'} work session`;
  }

  function moveItemTo(item, startTime, endTime) {
    applyChange(`Moved ${movableItemName(item)} to ${model.formatTimeRange(startTime, endTime)}`, () => {
      item.startTime = startTime;
      item.endTime = endTime;
    });
  }

  // Dragging a block up or down with a mouse or pen moves it in 15-minute steps, keeping its
  // length. Touch screens scroll instead, and use Change time… from the block's menu.
  const DRAG_STEP_MINUTES = 15;
  const DRAG_START_DISTANCE = 4; // px before a press counts as a drag rather than a click
  let blockDrag = null;

  function startBlockDrag(event) {
    const block = event.target.closest('.class-block[data-move-kind]');
    if (!block || event.pointerType === 'touch' || event.button !== 0 || !movableItemFrom(block)) {
      return;
    }
    const slot = block.closest('.class-block-slot');
    blockDrag = { block, slot, startY: event.clientY, top: parseFloat(slot.style.top), moved: false, times: null };
    block.setPointerCapture(event.pointerId);
  }

  function moveBlockDrag(event) {
    if (!blockDrag) {
      return;
    }
    const dy = event.clientY - blockDrag.startY;
    if (!blockDrag.moved && Math.abs(dy) < DRAG_START_DISTANCE) {
      return;
    }
    blockDrag.moved = true;
    blockDrag.slot.classList.add('is-dragging');
    const item = movableItemFrom(blockDrag.block);
    const stepMinutes = Math.round((dy / HOUR_HEIGHT) * (60 / DRAG_STEP_MINUTES)) * DRAG_STEP_MINUTES;
    const times = model.shiftedTimes(item.startTime, item.endTime, model.timeToMinutes(item.startTime) + stepMinutes);
    const shift = model.timeToMinutes(times.startTime) - model.timeToMinutes(item.startTime);
    blockDrag.slot.style.top = `${blockDrag.top + (shift / 60) * HOUR_HEIGHT}px`;
    blockDrag.block.querySelector('.class-block-time').textContent = model.formatTimeRange(times.startTime, times.endTime);
    blockDrag.times = times;
  }

  function endBlockDrag() {
    if (!blockDrag) {
      return;
    }
    const { block, moved, times } = blockDrag;
    blockDrag = null;
    if (!moved) {
      return;
    }
    // A drag shouldn't also open the block's menu when the button comes up.
    block.addEventListener('click', (clickEvent) => clickEvent.preventDefault(), { capture: true, once: true });
    const item = movableItemFrom(block);
    if (times && item && times.startTime !== item.startTime) {
      moveItemTo(item, times.startTime, times.endTime);
    } else {
      renderCalendar();
    }
  }

  // Change time…: a small box with just the start and end, for touch screens or exact times.
  let timeDialogTarget = null;

  function openTimeDialog(button) {
    const item = movableItemFrom(button);
    timeDialogTarget = { kind: button.dataset.moveKind, id: button.dataset.moveId, rso: button.dataset.moveRso };
    elements.timeForm.reset();
    elements.timeForm.elements.startTime.value = item.startTime;
    elements.timeForm.elements.endTime.value = item.endTime;
    document.getElementById('time-dialog-what').textContent = `${movableItemName(item)} · ${model.formatDate(item.date)}`;
    showErrors(elements.timeErrors, []);
    button.closest('details')?.removeAttribute('open');
    elements.timeDialog.showModal();
    elements.timeForm.elements.startTime.focus();
  }

  function handleTimeSubmit(event) {
    event.preventDefault();
    const startTime = elements.timeForm.elements.startTime.value;
    const endTime = elements.timeForm.elements.endTime.value;
    const errors = model.validateTimes(startTime, endTime);
    showErrors(elements.timeErrors, errors);
    if (errors.length > 0) {
      return;
    }
    const item = model.findMovableItem(state, timeDialogTarget.kind, timeDialogTarget.id, timeDialogTarget.rso);
    elements.timeDialog.close();
    if (item && (startTime !== item.startTime || endTime !== item.endTime)) {
      moveItemTo(item, startTime, endTime);
    }
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
  // The next two breaks in one card that slides between them, with arrows and dots to pick one.
  function renderBreakCountdown() {
    const upcoming = model.upcomingBreaks(state, todayKey());
    if (upcoming.length === 0) {
      return '';
    }
    breakSlideIndex %= upcoming.length;
    const slides = upcoming.map((item, index) => renderBreakSlide(item, index === breakSlideIndex)).join('');
    if (upcoming.length === 1) {
      return `<div class="break-carousel">${slides}</div>`;
    }
    const dots = upcoming
      .map(
        (item, index) =>
          `<button type="button" class="break-dot" data-action="show-break-slide" data-index="${index}" aria-label="Show ${escapeHtml(item.schoolBreak.name)}" aria-pressed="${index === breakSlideIndex}"></button>`,
      )
      .join('');
    return `
      <div class="break-carousel">
        <div class="break-track" style="transform: translateX(-${breakSlideIndex * 100}%)">${slides}</div>
        <button type="button" class="break-arrow previous" data-action="step-break-slide" data-step="-1" aria-label="Previous break">‹</button>
        <button type="button" class="break-arrow next" data-action="step-break-slide" data-step="1" aria-label="Next break">›</button>
        <div class="break-dots">${dots}</div>
      </div>`;
  }

  function showBreakSlide(index) {
    const carousel = elements.home.querySelector('.break-carousel');
    const track = carousel && carousel.querySelector('.break-track');
    if (!track) {
      return;
    }
    breakSlideIndex = index;
    track.style.transform = `translateX(-${index * 100}%)`;
    carousel.querySelectorAll('.break-dot').forEach((dot, dotIndex) => dot.setAttribute('aria-pressed', String(dotIndex === index)));
    carousel.querySelectorAll('.break-countdown').forEach((slide, slideIndex) => slide.setAttribute('aria-hidden', String(slideIndex !== index)));
  }

  function breakSlideCount() {
    return elements.home.querySelectorAll('.break-track .break-countdown').length;
  }

  // Slides to the other break every few seconds, unless someone has asked for less motion.
  // Picking a break by hand restarts the wait, so it doesn't slide away right after.
  const BREAK_SLIDE_MS = 6000;
  let breakSlideTimer = null;
  function restartBreakSlideTimer() {
    clearInterval(breakSlideTimer);
    breakSlideTimer = setInterval(() => {
      if (breakSlideCount() > 1 && !prefersReducedMotion()) {
        showBreakSlide((breakSlideIndex + 1) % breakSlideCount());
      }
    }, BREAK_SLIDE_MS);
  }
  restartBreakSlideTimer();

  function renderBreakSlide(upcoming, isShown) {
    const { schoolBreak } = upcoming;
    const style = BREAK_THEME_STYLES[schoolBreak.theme];
    const [number, words] = upcoming.ongoing
      ? [upcoming.daysLeft, `more day${upcoming.daysLeft === 1 ? '' : 's'} of ${escapeHtml(schoolBreak.name)}! It’s here ${style.emoji}`]
      : [upcoming.daysUntil, `day${upcoming.daysUntil === 1 ? '' : 's'} until ${escapeHtml(schoolBreak.name)} ${style.emoji}`];
    const dates = upcoming.ongoing ? `Last day ${model.formatDate(schoolBreak.endDate)}` : breakDateRange(schoolBreak);
    return `
      <div class="break-countdown" aria-hidden="${!isShown}" style="--break-from: ${style.colors[0]}; --break-to: ${style.colors[2]}; --break-text: ${style.text}">
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
        return { color: block.plannerClass.color, name: `<span class="exam-tag">${examTag(block.exam)}</span> ${escapeHtml(block.plannerClass.name)} ${escapeHtml(block.exam.title)}`, place: block.exam.location };
      case 'quiz':
        return { color: block.plannerClass.color, name: `<span class="exam-tag">Quiz</span> ${escapeHtml(block.plannerClass.name)} ${escapeHtml(block.quiz.title)}`, place: block.quiz.location };
      case 'work':
        return {
          color: block.plannerClass.color,
          name: `<span class="exam-tag">Work</span> ${escapeHtml(block.plannerClass.name)}${block.session.note ? ` ${escapeHtml(block.session.note)}` : ''}`,
          place: block.session.location,
        };
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

  const GETTING_STARTED_STEPS = {
    class: {
      title: 'Add a class',
      why: 'Each class gets a color, and its meeting times fill your Calendar.',
      button: '<button type="button" class="primary-button" data-action="open-drawer" data-section="class">Add a class</button>',
    },
    assignment: {
      title: 'Add an assignment',
      why: 'Anything due, from Canvas or a course website. Homework that repeats every week is added once.',
      button: '<button type="button" class="primary-button" data-action="open-drawer" data-section="assignment">Add an assignment</button>',
    },
    'check-off': {
      title: 'Check it off to feed your Study Buddy',
      why: 'Work done on time earns 10 points (late work earns 5). At 50 points, the egg hatches.',
      button: '<button type="button" class="primary-button" data-action="show-next-assignment">Go to Assignments</button>',
    },
  };

  // A checklist for a new planner. Only the next step has a button; done steps are ticked.
  function renderGettingStarted() {
    if (state.gettingStartedClosed) {
      return '';
    }
    const steps = model.gettingStartedSteps(state, buddyPoints());
    if (steps.every((step) => step.done)) {
      return `<section class="home-box getting-started" aria-labelledby="getting-started-heading">
          <h3 class="due-heading" id="getting-started-heading">🎉 You’re all set!</h3>
          <p>Your Study Buddy has its first points. Keep checking off work to help it grow.</p>
          <button type="button" class="primary-button" data-action="close-getting-started">Got it</button>
        </section>`;
    }
    const nextStepId = steps.find((step) => !step.done).id;
    const rows = steps
      .map((step, index) => {
        const info = GETTING_STARTED_STEPS[step.id];
        const isNext = step.id === nextStepId;
        return `<li class="getting-started-step${step.done ? ' is-done' : ''}${isNext ? ' is-next' : ''}">
            <span class="getting-started-number" aria-hidden="true">${step.done ? '✓' : index + 1}</span>
            <span class="getting-started-text">
              <strong>${info.title}</strong>${step.done ? '<span class="visually-hidden"> (done)</span>' : ''}
              <span class="buddy-muted">${info.why}</span>
              ${isNext ? info.button : ''}
            </span>
          </li>`;
      })
      .join('');
    return `<section class="home-box getting-started" aria-labelledby="getting-started-heading">
        <div class="home-box-heading">
          <h3 class="due-heading" id="getting-started-heading">Getting started</h3>
          <button type="button" class="text-button" data-action="close-getting-started">Hide</button>
        </div>
        <ol class="getting-started-steps">${rows}</ol>
      </section>`;
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
      ${renderGettingStarted()}
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
            ${renderDayTag(day.date)}
          </div>`,
      )
      .join('');
    const nowTime = currentTime();
    const columns = week.days
      .map((day) => {
        const showNow = day.date === today && nowTime >= `${String(week.startHour).padStart(2, '0')}:00` && model.timeToMinutes(nowTime) <= week.endHour * 60;
        const nowLine = showNow ? `<div class="now-line" style="top: ${timeOffset(nowTime, week.startHour)}px" aria-hidden="true"></div>` : '';
        const blockRenderers = { exam: renderExamBlock, quiz: renderExamBlock, work: renderWorkBlock, 'rso-event': renderEventBlock, event: renderEventBlock };
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

  const FINALS_DAY_TAGS = { reading: 'Reading day', finals: 'Finals' };

  // A small label under a calendar day's date for a break, a reading day, or a finals day.
  function renderDayTag(date) {
    const label = model.breakOn(state, date) ? 'Break' : FINALS_DAY_TAGS[model.finalsDayKind(state, date)];
    return label ? `<span class="break-tag">${label}</span>` : '';
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
      quiz: elements.examHeading.textContent,
      work: elements.workHeading.textContent,
      break: 'Breaks',
      rso: 'RSOs',
      event: elements.eventHeading.textContent,
    };
    elements.drawerHeading.textContent = headings[drawerSection];
  }

  // Opens the Add panel showing one section ('assignment', 'class', 'exam', 'quiz', 'work', 'break', 'rso', or 'event'), or closes it.
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
    if (!open && editingWorkId) {
      stopEditingWork();
    }
    elements.drawer.inert = !open;
    elements.drawer.classList.toggle('is-open', open);
    document.body.classList.toggle('drawer-open', open);
    if (open) {
      drawerSection = section;
      elements.classPanel.hidden = section !== 'class';
      // A new class starts on a color no other class has; an edit or a half-typed class keeps its own.
      if (section === 'class' && !editingClassId && !elements.classForm.elements.name.value) {
        selectColor(elements.classForm, model.suggestClassColor(currentClasses()));
      }
      elements.assignmentPanel.hidden = section !== 'assignment';
      elements.examPanel.hidden = section !== 'exam' && section !== 'quiz';
      if ((section === 'exam' || section === 'quiz') && !editingExamId) {
        setExamFormKind(section);
      }
      elements.workPanel.hidden = section !== 'work';
      elements.breakPanel.hidden = section !== 'break';
      elements.rsoPanel.hidden = section !== 'rso';
      elements.eventPanel.hidden = section !== 'event';
      renderDrawerHeading();
      const firstFields = {
        class: elements.classForm.elements.name,
        assignment: elements.assignmentForm.elements.title,
        exam: elements.examForm.elements.title,
        quiz: elements.examForm.elements.title,
        work: elements.workClass,
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

  // ---------- A class's final exam ----------

  // The final is saved as one of the class's exams, marked isFinal, so the Calendar and the
  // exam countdown treat it like any exam. The class form gives it a section of its own.
  function fillClassDateFields(plannerClass) {
    const fields = elements.classForm.elements;
    const hasDates = Boolean(plannerClass && plannerClass.startDate);
    fields.hasClassDates.checked = hasDates;
    fields.classStartDate.value = hasDates ? plannerClass.startDate : '';
    fields.classEndDate.value = hasDates ? plannerClass.endDate : '';
    elements.classDateFields.hidden = !hasDates;
  }

  function fillFinalFields(final) {
    const fields = elements.classForm.elements;
    fields.hasFinal.checked = Boolean(final);
    fields.finalDate.value = final ? final.date : '';
    fields.finalStart.value = final ? final.startTime : '';
    fields.finalEnd.value = final ? final.endTime : '';
    fields.finalLocation.value = final ? final.location : '';
    elements.finalFields.hidden = !final;
  }

  // The final from the form, or null when "This class has a final" is off. A class that
  // already has a final keeps its id.
  function readFinalFields(classId) {
    const fields = elements.classForm.elements;
    if (!fields.hasFinal.checked) {
      return null;
    }
    const existing = (state.exams || []).find((exam) => exam.classId === classId && exam.isFinal);
    return {
      id: existing ? existing.id : newId('exam'),
      semesterId: state.currentSemesterId,
      classId,
      title: 'Final exam',
      date: fields.finalDate.value,
      startTime: fields.finalStart.value,
      endTime: fields.finalEnd.value,
      location: fields.finalLocation.value.trim(),
      isFinal: true,
    };
  }

  // Turning the final on shows its fields, with the date starting on the first day of finals.
  function handleHasFinalChange() {
    const fields = elements.classForm.elements;
    elements.finalFields.hidden = !fields.hasFinal.checked;
    if (fields.hasFinal.checked && !fields.finalDate.value) {
      fields.finalDate.value = currentSemester().finalsStartDate || '';
    }
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
    elements.workDays.innerHTML = renderDayOptions(ALL_DAYS, [], 'class="work-day"');
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

  // ---------- Exams and quizzes ----------

  const EXAM_FORM_TEXT = {
    exam: { example: 'e.g. Midterm 1', placeLabel: 'Room', placeExample: 'e.g. Foellinger Auditorium' },
    quiz: { example: 'e.g. Quiz 5', placeLabel: 'Place', placeExample: 'e.g. CBTF' },
  };

  // Quizzes are kept in their own list, so they never join the exam countdown or a class's exam rows.
  function examList(kind) {
    if (kind === 'quiz') {
      state.quizzes = state.quizzes || [];
      return state.quizzes;
    }
    state.exams = state.exams || [];
    return state.exams;
  }

  // Words the exam panel uses for an exam or a quiz, adding or editing.
  function setExamFormKind(kind) {
    examFormKind = kind;
    const text = EXAM_FORM_TEXT[kind];
    const form = elements.examForm;
    form.elements.title.placeholder = text.example;
    form.elements.location.placeholder = text.placeExample;
    elements.examPlaceLabel.textContent = text.placeLabel;
    elements.examHeading.textContent = `${editingExamId ? 'Edit' : 'Add'} ${kind}`;
    elements.examSubmit.textContent = `${editingExamId ? 'Save' : 'Add'} ${kind}`;
  }

  function startEditingExam(id, kind = 'exam') {
    const exam = examList(kind).find((candidate) => candidate.id === id);
    editingExamId = id;
    setExamFormKind(kind);
    const form = elements.examForm;
    form.elements.title.value = exam.title;
    form.elements.classId.value = exam.classId;
    form.elements.date.value = exam.date;
    form.elements.startTime.value = exam.startTime;
    form.elements.endTime.value = exam.endTime;
    form.elements.location.value = exam.location;
    elements.examCancel.hidden = false;
    showErrors(elements.examErrors, []);
    setDrawerOpen(true, kind);
  }

  function stopEditingExam() {
    editingExamId = null;
    elements.examForm.reset();
    setExamFormKind(examFormKind);
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
    const kind = examFormKind;
    const errors = model.validateExam(fields, kind);
    showErrors(elements.examErrors, errors);
    if (errors.length > 0) {
      return;
    }
    // A half-edited class form lists that class's exams and would undo this change when saved.
    if (editingClassId && kind === 'exam') {
      stopEditingClass();
    }
    if (editingExamId) {
      const exam = examList(kind).find((candidate) => candidate.id === editingExamId);
      applyChange(`Saved ${fields.title}.`, () => Object.assign(exam, fields));
      setDrawerOpen(false);
    } else {
      applyChange(`Added ${fields.title} on ${model.formatDate(fields.date)}.`, () => {
        examList(kind).push({ id: newId(kind), semesterId: state.currentSemesterId, ...fields });
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
    fillClassDateFields(plannerClass);
    renderMeetingRows(elements.meetingList, plannerClass.meetings || []);
    renderRecurringRows([]);
    renderExistingRecurring(id);
    const classExams = (state.exams || []).filter((exam) => exam.classId === id);
    renderOneTimeRows(
      elements.classExamList,
      classExams.filter((exam) => !exam.isFinal).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime)),
    );
    fillFinalFields(classExams.find((exam) => exam.isFinal) || null);
    elements.classFormLabel.textContent = `Edit ${plannerClass.name}`;
    elements.classSubmit.textContent = 'Save class';
    elements.classCancel.hidden = false;
    showErrors(elements.classErrors, []);
    elements.classForm.elements.name.focus();
  }

  function stopEditingClass() {
    editingClassId = null;
    elements.classForm.reset();
    selectColor(elements.classForm, model.suggestClassColor(currentClasses()));
    fillClassDateFields(null);
    renderMeetingRows(elements.meetingList, []);
    renderRecurringRows([]);
    renderOneTimeRows(elements.classExamList, []);
    fillFinalFields(null);
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
    const fields = elements.classForm.elements;
    const classDates = fields.hasClassDates.checked
      ? { startDate: fields.classStartDate.value, endDate: fields.classEndDate.value }
      : { startDate: '', endDate: '' };
    if (fields.hasClassDates.checked) {
      errors.push(...model.validateClassDates(classDates, currentSemester()));
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
    const final = readFinalFields(classId);
    if (final) {
      model.validateExam(final).forEach((error) => errors.push(`Final exam: ${error}`));
      exams.push(final);
    }
    showErrors(elements.classErrors, errors);
    if (errors.length > 0) {
      return;
    }
    const verb = editingClassId ? 'Saved' : 'Added';
    const extra = recurring.length > 0 ? ` and ${recurring.length} recurring assignment${recurring.length === 1 ? '' : 's'}` : '';
    // One change, so a single Undo removes the class and its new assignments together.
    applyChange(`${verb} ${name}${extra}.`, () => {
      if (editingClassId) {
        Object.assign(state.classes.find((candidate) => candidate.id === editingClassId), { name, color, meetings, ...classDates });
      } else {
        state.classes.push({ id: classId, semesterId: state.currentSemesterId, name, color, meetings, ...classDates });
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

  // ---------- Work sessions ----------

  // Repeating sessions pick their days, and their date is the first one they can fall on.
  function showWorkRepeat(repeats) {
    elements.workDaysField.hidden = !repeats;
    elements.workDateLabel.textContent = repeats ? 'Starting' : 'Date';
    if (repeats && !elements.workForm.elements.date.value) {
      elements.workForm.elements.date.value = todayKey();
    }
  }

  function startEditingWork(id) {
    const session = state.workSessions.find((candidate) => candidate.id === id);
    editingWorkId = id;
    const form = elements.workForm;
    form.elements.classId.value = session.classId;
    ['note', 'date', 'startTime', 'endTime', 'location'].forEach((field) => {
      form.elements[field].value = session[field];
    });
    form.elements.repeats.checked = session.repeats;
    elements.workDays.querySelectorAll('.work-day').forEach((input) => {
      input.checked = session.days.includes(Number(input.value));
    });
    showWorkRepeat(session.repeats);
    elements.workHeading.textContent = 'Edit work session';
    elements.workSubmit.textContent = 'Save work session';
    elements.workCancel.hidden = false;
    showErrors(elements.workErrors, []);
    setDrawerOpen(true, 'work');
  }

  function stopEditingWork() {
    editingWorkId = null;
    elements.workForm.reset();
    showWorkRepeat(false);
    elements.workHeading.textContent = 'Add work session';
    elements.workSubmit.textContent = 'Add work session';
    elements.workCancel.hidden = true;
    showErrors(elements.workErrors, []);
    renderClassOptions();
    renderDrawerHeading();
  }

  function handleWorkSubmit(event) {
    event.preventDefault();
    const form = elements.workForm;
    const repeats = form.elements.repeats.checked;
    const fields = {
      classId: form.elements.classId.value,
      note: form.elements.note.value.trim(),
      repeats,
      date: form.elements.date.value,
      days: repeats ? checkedDays(elements.workDays, '.work-day') : [],
      startTime: form.elements.startTime.value,
      endTime: form.elements.endTime.value,
      location: form.elements.location.value.trim(),
    };
    const errors = model.validateWorkSession(fields);
    showErrors(elements.workErrors, errors);
    if (errors.length > 0) {
      return;
    }
    const className = state.classes.find((plannerClass) => plannerClass.id === fields.classId).name;
    if (editingWorkId) {
      const session = state.workSessions.find((candidate) => candidate.id === editingWorkId);
      applyChange(`Saved the work session for ${className}.`, () => Object.assign(session, fields));
      setDrawerOpen(false);
    } else {
      const when = repeats ? `every ${model.formatDays(fields.days)}` : `on ${model.formatDate(fields.date)}`;
      applyChange(`Added a work session for ${className} ${when}.`, () => {
        state.workSessions = [
          ...(state.workSessions || []),
          { id: newId('work'), semesterId: state.currentSemesterId, cancelledDates: [], ...fields },
        ];
      });
      // Keep the class so adding several sessions for one class is quick.
      const classId = form.elements.classId.value;
      form.reset();
      form.elements.classId.value = classId;
      showWorkRepeat(false);
    }
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
    form.elements.lastClassDate.value = semester.lastClassDate || '';
    form.elements.finalsStartDate.value = semester.finalsStartDate || '';
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
    const lastClassDate = form.elements.lastClassDate.value;
    const finalsStartDate = form.elements.finalsStartDate.value;
    const schoolYearEndDate = form.elements.schoolYearEndDate.value;
    const errors = model.validateSemester({ name, startDate, endDate, lastClassDate, finalsStartDate });
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
    applyChange('Semester saved.', () =>
      Object.assign(currentSemester(), { name, startDate, endDate, lastClassDate, finalsStartDate, schoolYearEndDate }),
    );
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
      buddy.moveToSemesterBuddies(state, todayKey());
      buddy.fillInSpecies(state);
    });
    if (backup.theme) {
      themes.setChoice(backup.theme);
      renderThemeOptions();
    }
  }

  // ---------- Study Buddy ----------

  // The planner as the viewed semester's buddy sees it (see PlannerBuddy.forSemester).
  function buddyView() {
    return buddy.forSemester(state, state.currentSemesterId);
  }

  // The viewed semester's buddy, or null until one is picked.
  function currentBuddy() {
    return buddyView().buddy;
  }

  function buddyPoints() {
    return buddy.totalPoints(buddy.pointsLog(buddyView(), todayKey(), currentTime()));
  }

  const GROWN_MESSAGES = ['', 'hatched! 🐣', 'grew little ears! 🐾', 'is all grown up! 🌼'];

  function buddyStreak() {
    return buddy.streakFor(buddyView(), todayKey(), currentTime());
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
    const grown = stageAfter > stageBefore ? ` ${buddy.displayName(currentBuddy())} ${GROWN_MESSAGES[stageAfter]}` : '';
    return change > 0 ? ` +${change} ✨${grown}` : ` (−${-change} points)`;
  }

  function buddyMood() {
    return buddy.moodFor(buddyView(), todayKey(), currentTime());
  }

  // What the buddy is feeling and why, e.g. "Mochi is worried about Lab 3 (overdue)".
  function moodText({ mood, worries, dueLeft, wakesOn }) {
    const name = buddy.displayName(currentBuddy());
    if (wakesOn) {
      return `${name} is asleep until ${currentSemester().name} starts on ${model.formatDate(wakesOn)} 💤`;
    }
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

  // Chest-only accessories found so far, which every buddy can wear.
  function foundAccessoryIds() {
    return buddy.foundAccessories(state).map((entry) => entry.id);
  }

  function buddyWearing(streak) {
    return buddy.wornAccessories(currentBuddy(), streak.best, foundAccessoryIds());
  }

  // One button per accessory in each spot: tap to put on or take off. Locked ones say what unlocks them.
  function renderWardrobe(streak) {
    const wearing = buddyWearing(streak);
    return buddy.ACCESSORY_SPOTS.map((spot) => {
      const buttons = buddy.ACCESSORIES.filter((accessory) => accessory.spot === spot.id)
        .map((accessory) => {
          if (!buddy.isUnlocked(accessory, streak.best, foundAccessoryIds())) {
            return `<button type="button" class="wardrobe-item is-locked" disabled>
                ${buddy.drawAccessory(accessory.id)}
                <span>${accessory.name}</span>
                <span class="buddy-muted">${accessory.fromChest ? '🎁 Find in a chest' : `🔒 ${accessory.streakDays}-day streak`}</span>
              </button>`;
          }
          const worn = wearing[spot.id] === accessory.id;
          return `<button type="button" class="wardrobe-item" data-action="wear-accessory" data-accessory="${accessory.id}" aria-pressed="${worn}">
              ${buddy.drawAccessory(accessory.id)}
              <span>${accessory.name}</span>
              <span class="buddy-muted">${worn ? 'Wearing' : 'Tap to wear'}</span>
            </button>`;
        })
        .join('');
      return `<h4 class="wardrobe-spot">${spot.name}</h4><div class="wardrobe-row">${buttons}</div>`;
    }).join('');
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

  // The viewed semester's buddy drawn as it is now.
  function drawCurrentBuddy(where, mood, streak) {
    const { color, species } = currentBuddy();
    return buddy.drawBuddy(where.index, where.progress, mood.mood, buddyWearing(streak), color, species);
  }

  function renderBuddyCard() {
    if (!currentBuddy()) {
      return `<button type="button" class="buddy-card" data-action="set-tab" data-tab="buddy">
          <span class="buddy-card-art">${buddy.drawBuddy(0, 0, 'happy')}</span>
          <span class="buddy-card-text">
            <strong>${escapeHtml(currentSemester().name)} needs a Study Buddy</strong>
            <span class="buddy-muted">Pick its color to start a new egg.</span>
          </span>
          <span class="buddy-card-arrow" aria-hidden="true">›</span>
        </button>`;
    }
    const points = buddyPoints();
    const where = buddy.stageFor(points);
    const streak = buddyStreak();
    const mood = buddyMood();
    return `<button type="button" class="buddy-card" data-action="set-tab" data-tab="buddy">
        <span class="buddy-card-art">${drawCurrentBuddy(where, mood, streak)}${renderStreakFlame(streak)}</span>
        <span class="buddy-card-text">
          <span><strong>${escapeHtml(buddy.displayName(currentBuddy()))}</strong> <span class="buddy-muted">· ${where.stage.name}</span></span>
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
    if (reason === 'chest') {
      return `<li class="buddy-log-item is-streak">
          <span class="buddy-log-points is-gain">${sign}</span>
          <span class="buddy-log-title">🎁 Week’s chest</span>
          <span class="buddy-muted">Week ending ${model.formatDate(when.slice(0, 10))}</span>
        </li>`;
    }
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
          ${buddy.drawBuddy(index, 0, 'content', {}, currentBuddy().color, currentBuddy().species)}
          <span>${reached ? stage.name : '???'}</span>
          <span class="buddy-muted">${stage.minPoints} pts</span>
        </li>`;
    }).join('');
  }

  const RECENT_POINTS_COUNT = 8;

  // The semester whose buddy is a species, other than the one being viewed, or undefined.
  function semesterWithSpecies(speciesId) {
    const [semesterId] = Object.entries(state.buddies || {}).find(
      ([id, semesterBuddy]) => id !== state.currentSemesterId && semesterBuddy.species === speciesId,
    ) || [];
    return state.semesters.find((semester) => semester.id === semesterId);
  }

  // Every species grown up, in this semester's buddy's color, with whose buddy each one is.
  function renderAllSpecies() {
    const items = buddy.SPECIES.map((species) => {
      const owner =
        currentBuddy().species === species.id ? currentSemester() : semesterWithSpecies(species.id);
      return `<li class="buddy-shelf-item">
          ${buddy.drawBuddy(3, 0, 'happy', {}, currentBuddy().color, species.id)}
          <strong>${species.name}</strong>
          <span class="buddy-muted">${owner ? `${escapeHtml(owner.name)}’s buddy` : 'Not picked yet'}</span>
        </li>`;
    }).join('');
    return `<section class="home-box">
        <h3 class="due-heading">All species</h3>
        <p class="buddy-muted">Each new semester, pick one you haven’t had yet.</p>
        <ul class="buddy-shelf-list">${items}</ul>
      </section>`;
  }

  // Every sticker in a fixed order: found ones in color, the rest as gray shapes to find.
  function renderStickerBook() {
    const found = new Set(PlannerStickers.foundStickers(state).map((entry) => entry.id));
    const all = [...PlannerStickers.STICKERS, ...PlannerStickers.RARE_STICKERS];
    const items = all
      .map((sticker) => {
        const label = found.has(sticker.id) ? sticker.name : '?';
        return `<li class="sticker-item${found.has(sticker.id) ? '' : ' is-missing'}" aria-label="${found.has(sticker.id) ? sticker.name : 'Not found yet'}">
          ${PlannerStickers.drawSticker(sticker)}
          <strong>${label}</strong>
          ${sticker.rare ? '<span class="sticker-rare-label">✨ Rare</span>' : ''}
        </li>`;
      })
      .join('');
    return `<section class="home-box">
        <h3 class="due-heading">Sticker book</h3>
        <p class="buddy-muted"><strong>${found.size} of ${all.length}</strong> found. Each week’s chest on Buddy’s Path holds a new one.</p>
        <ul class="sticker-grid">${items}</ul>
      </section>`;
  }

  // For a semester without a buddy: pick a species (each shown grown up, with ones other
  // semesters already have grayed out), then a color, then start the egg.
  function renderBuddyPicker() {
    const available = buddy.speciesChoices(state, state.currentSemesterId);
    if (!available.includes(buddyPick.species)) {
      buddyPick.species = available[0];
    }
    const speciesButtons = buddy.SPECIES.map((species) => {
      const taken = !available.includes(species.id);
      const owner = taken ? semesterWithSpecies(species.id) : null;
      return `<button type="button" class="buddy-color-choice" data-action="choose-buddy-species" data-species="${species.id}"
          aria-pressed="${buddyPick.species === species.id}" ${taken ? 'disabled' : ''}>
          ${buddy.drawBuddy(3, 0, 'happy', {}, buddyPick.color, species.id)}
          <span>${species.name}</span>
          ${owner ? `<span class="buddy-muted">${escapeHtml(owner.name)}’s buddy</span>` : ''}
        </button>`;
    }).join('');
    const colorButtons = buddy.COLORS.map(
      (color) => `<button type="button" class="buddy-color-choice" data-action="choose-buddy-color" data-color="${color.id}"
          aria-pressed="${buddyPick.color === color.id}">
          ${buddy.drawBuddy(3, 0, 'content', {}, color.id, buddyPick.species)}
          <span>${color.name}</span>
        </button>`,
    ).join('');
    const species = buddy.SPECIES.find((candidate) => candidate.id === buddyPick.species);
    const color = buddy.COLORS.find((candidate) => candidate.id === buddyPick.color);
    return `<section class="home-box buddy-picker">
        <h3 class="due-heading">Pick a Study Buddy for ${escapeHtml(currentSemester().name)}</h3>
        <p class="buddy-muted">Each semester gets its own buddy, and a species you haven’t had yet. It starts as an egg and grows with this semester’s work.</p>
        <h4 class="wardrobe-spot">Species</h4>
        <div class="buddy-color-choices">${speciesButtons}</div>
        <h4 class="wardrobe-spot">Color</h4>
        <div class="buddy-color-choices">${colorButtons}</div>
        <button type="button" class="primary-button buddy-start" data-action="start-buddy">Start a ${color.name.toLowerCase()} ${species.name.toLowerCase()} egg</button>
      </section>`;
  }

  // Buddies from the other semesters, each as it is in its own semester.
  function renderBuddyShelf() {
    const today = todayKey();
    const nowTime = currentTime();
    const cards = state.semesters
      .filter((semester) => semester.id !== state.currentSemesterId && (state.buddies || {})[semester.id])
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .map((semester) => {
        const view = buddy.forSemester(state, semester.id);
        const points = buddy.totalPoints(buddy.pointsLog(view, today, nowTime));
        const where = buddy.stageFor(points);
        const best = buddy.streakFor(view, today, nowTime).best;
        return `<li class="buddy-shelf-item">
            ${buddy.drawBuddy(where.index, where.progress, 'content', buddy.wornAccessories(view.buddy, best, foundAccessoryIds()), view.buddy.color, view.buddy.species)}
            <strong>${escapeHtml(buddy.displayName(view.buddy))}</strong>
            <span>${escapeHtml(semester.name)}</span>
            <span class="buddy-muted">${where.stage.name} · ${points} point${points === 1 ? '' : 's'}</span>
            <span class="buddy-muted">Best streak: ${dayCount(best)}</span>
          </li>`;
      });
    if (cards.length === 0) {
      return '';
    }
    return `<section class="home-box buddy-shelf">
        <h3 class="due-heading">Buddy Collection</h3>
        <ul class="buddy-shelf-list">${cards.join('')}</ul>
      </section>`;
  }

  function renderBuddy() {
    if (!currentBuddy()) {
      elements.buddy.innerHTML = renderBuddyPicker() + renderBuddyShelf();
      return;
    }
    const log = buddy.pointsLog(buddyView(), todayKey(), currentTime());
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
          <div class="buddy-big">${drawCurrentBuddy(where, mood, streak)}${renderStreakFlame(streak)}</div>
          <p class="buddy-mood-line">${escapeHtml(moodText(mood))}</p>
          <form class="buddy-name-form" id="buddy-name-form">
            <label class="field">
              <span>Name</span>
              <input type="text" name="name" maxlength="20" autocomplete="off" placeholder="Give your buddy a name" value="${escapeHtml(currentBuddy().name)}" />
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
            <h3 class="due-heading">Wardrobe</h3>
            <p class="buddy-muted">Longer streaks unlock more. Once unlocked, they're yours to keep.</p>
            ${renderWardrobe(streak)}
          </section>
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
              <li><span>Finish a whole week, then open its chest on Buddy’s Path (until grown up)</span> <strong class="is-gain">🎁 Bonus</strong></li>
            </ul>
            <p class="buddy-muted">A day adds to your streak when everything due that day is checked off on time.
              Counts ${escapeHtml(currentSemester().name)} work due from ${model.formatDate(currentBuddy().startDate)} on.</p>
            <ol class="buddy-stages">${renderBuddyStages(where)}</ol>
          </section>
          <section class="home-box">
            <h3 class="due-heading">Recent points</h3>
            ${recent}
          </section>
          ${renderAllSpecies()}
          ${renderStickerBook()}
        </div>
      </div>
      ${renderBuddyShelf()}`;
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
      currentBuddy().name = name;
    });
  }

  // ---------- Starting and switching semesters ----------

  function openNewSemesterDialog() {
    const guess = model.nextSemesterGuess(currentSemester());
    const form = elements.newSemesterForm;
    form.elements.name.value = guess.name;
    form.elements.startDate.value = guess.startDate;
    form.elements.endDate.value = guess.endDate;
    form.elements.lastClassDate.value = '';
    form.elements.finalsStartDate.value = '';
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
    const fields = {
      name: form.elements.name.value.trim(),
      startDate: form.elements.startDate.value,
      endDate: form.elements.endDate.value,
      lastClassDate: form.elements.lastClassDate.value,
      finalsStartDate: form.elements.finalsStartDate.value,
    };
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

  function setAssignmentDone(assignment, date, nowDone) {
    const item = { assignment, date, time: assignment.dueTime };
    const pointsBefore = buddyPoints();
    const streakBefore = buddyStreak().current;
    const gemsBefore = buddy.gemsEarned(state);
    const message = nowDone ? `Done: ${assignment.title} 🎉` : `Marked not done: ${assignment.title}`;
    const describeGemChange = () => {
      const change = buddy.gemsEarned(state) - gemsBefore;
      return change > 0 ? ` +${change} 💎` : change < 0 ? ` (−${-change} 💎)` : '';
    };
    const itemWeek = model.startOfWeek(date);
    const onThePath = currentTab === 'assignments' && currentView === 'game';
    const buddyWasAt = onThePath ? pathBuddyAlong() : null;
    const chestReadyText = () =>
      !onThePath && buddy.chestFor(buddyView(), itemWeek).status === 'ready' ? ' Your week’s chest is ready on Buddy’s Path!' : '';
    applyChange(() => message + describePointsChange(pointsBefore) + describeGemChange() + describeStreakChange(streakBefore) + chestReadyText(), () => {
      if (currentBuddy()) {
        buddy.recordCheckOff(currentBuddy(), item, nowDone, todayKey(), currentTime());
      }
      if (assignment.kind === 'once') {
        assignment.done = nowDone;
      } else if (nowDone) {
        assignment.doneDates.push(date);
      } else {
        assignment.doneDates = assignment.doneDates.filter((doneDate) => doneDate !== date);
      }
    });
    // Home's card and the path were just redrawn. On the path the buddy hops along to its new
    // spot (forward or back); elsewhere it does a little hop in place.
    const buddyMoves = onThePath && buddyWasAt !== null && pathBuddyAlong() !== buddyWasAt;
    if (nowDone) {
      elements.home.querySelector('.buddy-card-art')?.classList.add('is-hopping');
      if (!buddyMoves) {
        elements.dueList.querySelector('.buddy-path-buddy')?.classList.add('is-hopping');
      }
      // The bar's count and points pop once to show they went up.
      elements.dueList.querySelector('.buddy-path-hud')?.classList.add('is-bumped');
      holdGemForPickup(assignment, date);
      // Only the one just finished raises its flag (or lights its lantern); the others are already up.
      elements.dueList.querySelector(`.path-stone[data-id="${assignment.id}"][data-date="${date}"]`)?.classList.add('is-rising');
    }
    // Finishing the week on the path opens its chest once the buddy gets there.
    const opensChest = nowDone && onThePath && itemWeek === weekStart && buddy.chestFor(buddyView(), weekStart).status === 'ready';
    if (buddyMoves) {
      hopBuddyAlongPath(buddyWasAt, opensChest ? openWeekChest : undefined);
    } else {
      pickUpGems(null);
      if (opensChest) {
        openWeekChest();
      }
    }
  }

  async function handleListAction(target) {
    const action = target.dataset.action;
    const { id, date } = target.dataset;
    const assignment = id ? findAssignment(id) : null;

    if (action === 'toggle-done') {
      setAssignmentDone(assignment, date, target.checked);
    } else if (action === 'toggle-stone') {
      setAssignmentDone(assignment, date, target.dataset.done !== 'true');
      // The path was just redrawn, so keep the keyboard on the same stone.
      elements.dueList.querySelector(`.path-stone[data-id="${id}"][data-date="${date}"]`)?.focus({ preventScroll: true });
    } else if (action === 'next-up-done') {
      setAssignmentDone(assignment, date, true);
      // The card was just redrawn for the next assignment, so keep the keyboard on its button.
      elements.dueList.querySelector('.next-up-done')?.focus({ preventScroll: true });
    } else if (action === 'toggle-path-list') {
      pathListShown = !pathListShown;
      savePreference(PATH_LIST_STORAGE_KEY, pathListShown ? 'shown' : 'hidden');
      renderDueList();
    } else if (action === 'wear-accessory') {
      const accessory = buddy.ACCESSORIES.find((candidate) => candidate.id === target.dataset.accessory);
      const name = buddy.displayName(currentBuddy());
      const takingOff = (currentBuddy().wearing || {})[accessory.spot] === accessory.id;
      applyChange(takingOff ? `${name} took off the ${accessory.name.toLowerCase()}.` : `${name} is wearing the ${accessory.name.toLowerCase()} ✨`, () => {
        buddy.toggleAccessory(currentBuddy(), accessory.id);
      });
    } else if (action === 'choose-buddy-species') {
      buddyPick.species = target.dataset.species;
      renderBuddy();
    } else if (action === 'choose-buddy-color') {
      buddyPick.color = target.dataset.color;
      renderBuddy();
    } else if (action === 'start-buddy') {
      const { species, color } = buddyPick;
      const speciesName = buddy.SPECIES.find((candidate) => candidate.id === species).name.toLowerCase();
      const colorName = buddy.COLORS.find((candidate) => candidate.id === color).name.toLowerCase();
      applyChange(`A new egg for ${currentSemester().name}! It will hatch into a ${colorName} ${speciesName} 🥚`, () => {
        buddy.startBuddy(state, state.currentSemesterId, color, todayKey(), species);
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
      const quizCount = (state.quizzes || []).filter((quiz) => quiz.classId === id).length;
      const workCount = (state.workSessions || []).filter((session) => session.classId === id).length;
      const parts = [];
      if (count > 0) {
        parts.push(`${count} assignment${count === 1 ? '' : 's'}`);
      }
      if (examCount > 0) {
        parts.push(`${examCount} exam${examCount === 1 ? '' : 's'}`);
      }
      if (quizCount > 0) {
        parts.push(`${quizCount} quiz${quizCount === 1 ? '' : 'zes'}`);
      }
      if (workCount > 0) {
        parts.push(`${workCount} work session${workCount === 1 ? '' : 's'}`);
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
          state.quizzes = (state.quizzes || []).filter((quiz) => quiz.classId !== id);
          state.workSessions = (state.workSessions || []).filter((session) => session.classId !== id);
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
    } else if (action === 'change-time') {
      openTimeDialog(target);
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
    } else if (action === 'edit-work') {
      startEditingWork(id);
    } else if (action === 'delete-work') {
      if (editingWorkId === id) {
        stopEditingWork();
      }
      applyChange('Deleted the work session.', () => {
        state.workSessions = state.workSessions.filter((candidate) => candidate.id !== id);
      });
    } else if (action === 'cancel-work' || action === 'restore-work') {
      const session = state.workSessions.find((candidate) => candidate.id === id);
      const cancelling = action === 'cancel-work';
      applyChange(`${cancelling ? 'Cancelled' : 'Restored'} the work session on ${model.formatDate(date)}.`, () => {
        const others = session.cancelledDates.filter((cancelledDate) => cancelledDate !== date);
        session.cancelledDates = cancelling ? [...others, date] : others;
      });
    } else if (action === 'edit-quiz') {
      startEditingExam(id, 'quiz');
    } else if (action === 'delete-quiz') {
      const quiz = state.quizzes.find((candidate) => candidate.id === id);
      applyChange(`Deleted ${quiz.title}.`, () => {
        state.quizzes = state.quizzes.filter((candidate) => candidate.id !== id);
      });
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
      if (editingWorkId) {
        stopEditingWork();
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
    } else if (action === 'previous-day' || action === 'next-day') {
      selectedDay = model.addDays(selectedDay, action === 'next-day' ? 1 : -1);
      renderDueList();
    } else if (action === 'go-to-today') {
      selectedDay = todayKey();
      renderDueList();
    } else if (action === 'this-week') {
      weekStart = model.startOfWeek(todayKey());
      renderDueList();
      renderCalendar();
    } else if (action === 'show-next-assignment') {
      // Opens Assignments on the day the next unfinished assignment is due (overdue work shows on today).
      const today = todayKey();
      const nextItem = model.buildDueList(state).find((item) => !item.done && statusOf(item) !== 'missed');
      const date = nextItem && nextItem.date > today ? nextItem.date : today;
      selectedDay = date;
      weekStart = model.startOfWeek(date);
      currentTab = 'assignments';
      render();
    } else if (action === 'close-getting-started') {
      applyChange('Getting started hidden.', () => {
        state.gettingStartedClosed = true;
      });
    } else if (action === 'edit-semester') {
      openSemesterDialog();
    } else if (action === 'open-challenge') {
      sendChallenge('Challenge a friend');
    } else if (action === 'send-challenge-back') {
      sendChallenge('Send yours back');
    } else if (action === 'copy-challenge-link') {
      copyChallengeLink();
    } else if (action === 'close-challenge') {
      elements.challengeDialog.close();
    } else if (action === 'remove-friend') {
      const friend = (state.friends || []).find((candidate) => candidate.key === target.dataset.key);
      applyChange(`Removed ${friend.challenge.name || 'your friend'} from Friends`, () => buddy.removeFriend(state, friend.key));
    } else if (action === 'open-shop') {
      openThemeShop();
    } else if (action === 'close-shop') {
      elements.shopDialog.close();
    } else if (action === 'shop-buy') {
      buyPathTheme(target.dataset.themeId);
    } else if (action === 'shop-use') {
      usePathTheme(target.dataset.themeId);
    } else if (action === 'open-chest') {
      openWeekChest();
    } else if (action === 'close-chest') {
      elements.chestDialog.close();
    } else if (action === 'show-break-slide') {
      showBreakSlide(Number(target.dataset.index));
      restartBreakSlideTimer();
    } else if (action === 'step-break-slide') {
      const count = breakSlideCount();
      showBreakSlide((breakSlideIndex + Number(target.dataset.step) + count) % count);
      restartBreakSlideTimer();
    } else if (action === 'open-quick-add') {
      openQuickAdd();
    } else if (action === 'open-new-semester') {
      openNewSemesterDialog();
    } else if (action === 'switch-semester') {
      switchSemester(id);
    } else if (action === 'retry-weather') {
      loadWeather();
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
  elements.timeForm.addEventListener('submit', handleTimeSubmit);
  document.getElementById('time-cancel').addEventListener('click', () => elements.timeDialog.close());
  elements.calendar.addEventListener('pointerdown', startBlockDrag);
  elements.calendar.addEventListener('pointermove', moveBlockDrag);
  elements.calendar.addEventListener('pointerup', endBlockDrag);
  elements.calendar.addEventListener('pointercancel', () => {
    blockDrag = null;
    renderCalendar();
  });
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
  document.getElementById('has-final').addEventListener('change', handleHasFinalChange);
  document.getElementById('has-class-dates').addEventListener('change', (event) => {
    elements.classDateFields.hidden = !event.target.checked;
  });
  elements.rsoForm.addEventListener('submit', handleRsoSubmit);
  elements.rsoCancel.addEventListener('click', stopEditingRso);
  elements.eventForm.addEventListener('submit', handleEventSubmit);
  elements.eventCancel.addEventListener('click', () => setDrawerOpen(false));
  elements.workForm.addEventListener('submit', handleWorkSubmit);
  elements.workCancel.addEventListener('click', () => setDrawerOpen(false));
  document.getElementById('work-repeats').addEventListener('change', (event) => showWorkRepeat(event.target.checked));
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
    // A tap on the dim area around the prize card or the shop closes it too.
    if (event.target === elements.chestDialog || event.target === elements.shopDialog) {
      event.target.close();
    }
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

  // Each tab keeps its own copy of the planner and saves all of it on every change, so a tab
  // opened earlier would save its older copy over work done in another tab. Picking up every
  // save from other tabs (and from a page the browser brings back with Back) prevents that.
  function reloadSavedPlanner() {
    state = PlannerStorage.load(new Date()).state;
    buddy.moveToSemesterBuddies(state, todayKey());
    buddy.fillInSpecies(state);
    PlannerStickers.giveMissedStickers(state);
    buddy.giveMissedAccessories(state);
    // Undo would put back this tab's older copy, so it's only offered right after a change made here.
    elements.toast.hidden = true;
    render();
  }
  window.addEventListener('storage', (event) => {
    if (event.key === PlannerStorage.STORAGE_KEY && event.newValue !== null) {
      reloadSavedPlanner();
    }
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      reloadSavedPlanner();
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

  window.addEventListener('hashchange', openChallengeFromLink);

  renderThemeOptions();
  render();
  openChallengeFromLink();
  loadWeather();
  setInterval(loadWeather, WEATHER_REFRESH_MS);
})();

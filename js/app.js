// Connects the page to the planner data: draws the screen and handles forms and clicks.
// Every change follows the same steps: change the data, save it, redraw the screen.

(() => {
  const model = PlannerModel;

  const CLASS_COLORS = [
    { name: 'Red', value: '#e5484d' },
    { name: 'Orange', value: '#f76b15' },
    { name: 'Gold', value: '#c99a06' },
    { name: 'Green', value: '#30a46c' },
    { name: 'Teal', value: '#12a594' },
    { name: 'Blue', value: '#3e63dd' },
    { name: 'Purple', value: '#8e4ec6' },
    { name: 'Pink', value: '#d6409f' },
  ];
  const NO_CLASS_COLOR = '#8b8d98';
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
  // Which part of the Add panel is showing: 'assignment' or 'class'.
  let drawerSection = 'assignment';
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
    return `${label}${model.formatDays(meeting.days)} ${model.formatTimeRange(meeting.startTime, meeting.endTime)}${location}`;
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
    return `${renderWeekNav(renderProgress(week.progress))}<div class="week-grid">${columns}</div>`;
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

  // ---------- Calendar ----------

  function hourLabel(hour) {
    const suffix = hour < 12 ? 'AM' : 'PM';
    return `${hour % 12 === 0 ? 12 : hour % 12} ${suffix}`;
  }

  // Pixels from the top of the calendar for a time like "10:30".
  function timeOffset(time, startHour) {
    return ((model.timeToMinutes(time) - startHour * 60) / 60) * HOUR_HEIGHT;
  }

  // A class block on the calendar. Clicking it opens a menu to edit the class or cancel
  // (or restore) just this day's meeting.
  function renderClassBlock(block, startHour) {
    const { plannerClass, meeting, lane, laneCount, date, cancelled } = block;
    const top = timeOffset(block.startTime, startHour);
    const height = timeOffset(block.endTime, startHour) - top;
    // Blocks under about an hour only have room for the name and time; the rest is in the hover text.
    const hasRoomForDetails = height >= HOUR_HEIGHT;
    const details = cancelled
      ? 'Cancelled'
      : hasRoomForDetails
        ? [meeting.label, meeting.location].filter(Boolean).map(escapeHtml).join(' · ')
        : '';
    const name = escapeHtml(plannerClass.name);
    const meetingData = `data-class-id="${plannerClass.id}" data-meeting-id="${meeting.id}" data-date="${date}"`;
    const dayAction = cancelled
      ? `<button type="button" data-action="restore-meeting" ${meetingData}>Restore class on ${model.formatDate(date)}</button>`
      : `<button type="button" class="danger" data-action="cancel-meeting" ${meetingData}>Cancel class on ${model.formatDate(date)}</button>`;
    return `
      <details class="row-menu class-block-slot" style="top: ${top}px; height: ${height}px; left: ${(lane / laneCount) * 100}%; width: ${100 / laneCount}%">
        <summary class="class-block${cancelled ? ' is-cancelled' : ''}" style="--class-color: ${plannerClass.color}"
          title="${name} ${describeMeeting(meeting)}${cancelled ? ' (cancelled)' : ''}">
          <span class="class-block-name">${name}</span>
          ${details ? `<span class="class-block-details">${details}</span>` : ''}
          <span class="class-block-time">${model.formatTimeRange(block.startTime, block.endTime)}</span>
        </summary>
        <div class="row-menu-items">
          <button type="button" data-action="edit-class" data-id="${plannerClass.id}">Edit ${name}…</button>
          ${dayAction}
        </div>
      </details>`;
  }

  // "Now: MATH 241 Lecture until 10:50 AM · Altgeld 314", or the next class coming up.
  function renderNextClass() {
    const upcoming = model.nextClass(state, todayKey(), currentTime());
    if (!upcoming) {
      return '<p class="next-class">No classes in the next two weeks.</p>';
    }
    const { plannerClass, meeting, status, date } = upcoming;
    const what = `<strong>${escapeHtml(plannerClass.name)}</strong>${meeting.label ? ` ${escapeHtml(meeting.label)}` : ''}`;
    const where = meeting.location ? ` · ${escapeHtml(meeting.location)}` : '';
    let text;
    if (status === 'now') {
      text = `Now: ${what} until ${model.formatTime(meeting.endTime)}${where}`;
    } else if (date === todayKey()) {
      text = `Next: ${what} at ${model.formatTime(meeting.startTime)}${where}`;
    } else {
      const day = date === model.addDays(todayKey(), 1) ? 'Tomorrow' : model.formatDate(date);
      text = `Next: ${day} ${model.formatTime(meeting.startTime)} · ${what}${where}`;
    }
    return `<p class="next-class" style="--class-color: ${plannerClass.color}"><span class="swatch" aria-hidden="true"></span>${text}</p>`;
  }

  function renderCalendar() {
    const week = model.buildCalendarWeek(state, weekStart);
    const today = todayKey();
    let notice = '';
    if (!week.hasMeetings) {
      notice = `
        <div class="empty-state calendar-notice">
          <p class="empty">Add meeting times to your classes to see them here.</p>
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
          </div>`,
      )
      .join('');
    const nowTime = currentTime();
    const columns = week.days
      .map((day) => {
        const showNow = day.date === today && nowTime >= `${String(week.startHour).padStart(2, '0')}:00` && model.timeToMinutes(nowTime) <= week.endHour * 60;
        const nowLine = showNow ? `<div class="now-line" style="top: ${timeOffset(nowTime, week.startHour)}px" aria-hidden="true"></div>` : '';
        return `<div class="calendar-day${day.date === today ? ' is-today' : ''}">${day.blocks.map((block) => renderClassBlock(block, week.startHour)).join('')}${nowLine}</div>`;
      })
      .join('');
    elements.calendar.innerHTML = `
      ${week.hasMeetings ? renderNextClass() : ''}
      ${renderWeekNav()}
      ${notice}
      <div class="calendar">
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
    elements.drawerHeading.textContent = drawerSection === 'class' ? 'Classes' : elements.assignmentHeading.textContent;
  }

  // Opens the Add panel showing one section ('assignment' or 'class'), or closes it.
  function setDrawerOpen(open, section = drawerSection) {
    if (!open && editingAssignment) {
      stopEditingAssignment();
    }
    elements.drawer.inert = !open;
    elements.drawer.classList.toggle('is-open', open);
    document.body.classList.toggle('drawer-open', open);
    if (open) {
      drawerSection = section;
      elements.classPanel.hidden = section !== 'class';
      elements.assignmentPanel.hidden = section !== 'assignment';
      renderDrawerHeading();
      const firstField = section === 'class' ? elements.classForm.elements.name : elements.assignmentForm.elements.title;
      firstField.focus();
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

  function renderMeetingRows(meetings) {
    elements.meetingList.innerHTML = meetings
      .map(
        (meeting, index) => `
          <li class="meeting-row" data-meeting-id="${meeting.id}">
            <div class="meeting-row-top">
              <input class="meeting-label" type="text" maxlength="30" placeholder="Lecture, Lab…" value="${escapeHtml(meeting.label)}"
                aria-label="Meeting ${index + 1} name" />
              <button type="button" class="text-button danger" data-meeting-action="remove">Remove</button>
            </div>
            <div class="day-picker" role="group" aria-label="Meeting ${index + 1} days">
              ${renderDayOptions(MEETING_DAYS, meeting.days, 'class="meeting-day"')}
            </div>
            <div class="field-row">
              <label class="field"><span>Starts</span><input class="meeting-start" type="time" value="${meeting.startTime}" /></label>
              <label class="field"><span>Ends</span><input class="meeting-end" type="time" value="${meeting.endTime}" /></label>
            </div>
            <input class="meeting-location" type="text" maxlength="40" placeholder="Room (optional)" value="${escapeHtml(meeting.location)}"
              aria-label="Meeting ${index + 1} room" />
          </li>`,
      )
      .join('');
  }

  function readMeetingRows() {
    return [...elements.meetingList.querySelectorAll('.meeting-row')].map((row) => ({
      id: row.dataset.meetingId,
      label: row.querySelector('.meeting-label').value.trim(),
      days: checkedDays(row, '.meeting-day'),
      startTime: row.querySelector('.meeting-start').value,
      endTime: row.querySelector('.meeting-end').value,
      location: row.querySelector('.meeting-location').value.trim(),
    }));
  }

  function addMeetingRow() {
    const meetings = readMeetingRows();
    const isFirst = meetings.length === 0;
    meetings.push({ id: newId('meeting'), label: isFirst ? 'Lecture' : '', days: [], startTime: '', endTime: '', location: '' });
    renderMeetingRows(meetings);
    elements.meetingList.querySelector('.meeting-row:last-child .meeting-label').focus();
  }

  function removeMeetingRow(row) {
    const meetings = readMeetingRows().filter((meeting) => meeting.id !== row.dataset.meetingId);
    renderMeetingRows(meetings);
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

  function setUpPickers() {
    elements.colorPicker.innerHTML = CLASS_COLORS.map(
      (color, index) => `
        <label class="color-option" style="--class-color: ${color.value}" title="${color.name}">
          <input type="radio" name="color" value="${color.value}" ${index === 0 ? 'checked' : ''} aria-label="${color.name}" />
          <span class="swatch" aria-hidden="true"></span>
        </label>`,
    ).join('');
    elements.dayPicker.innerHTML = renderDayOptions(ALL_DAYS, [], 'name="days"');
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

  function startEditingClass(id) {
    const plannerClass = state.classes.find((candidate) => candidate.id === id);
    editingClassId = id;
    elements.classForm.elements.name.value = plannerClass.name;
    const colorInput = [...elements.classForm.elements.color].find((input) => input.value === plannerClass.color);
    if (colorInput) {
      colorInput.checked = true;
    }
    renderMeetingRows(plannerClass.meetings || []);
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
    renderMeetingRows([]);
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
    // Keep each meeting's cancelled dates; the form doesn't show them, so it can't carry them.
    const previousMeetings = editingClassId ? state.classes.find((candidate) => candidate.id === editingClassId).meetings || [] : [];
    const meetings = readMeetingRows().map((meeting) => ({
      ...meeting,
      cancelledDates: previousMeetings.find((previous) => previous.id === meeting.id)?.cancelledDates || [],
    }));
    const errors = [];
    if (!name) {
      errors.push('Give the class a name.');
    } else if (duplicate) {
      errors.push(`You already have a class called ${name}.`);
    }
    meetings.forEach((meeting, index) => {
      const which = meeting.label || `Meeting ${index + 1}`;
      model.validateMeeting(meeting).forEach((error) => errors.push(`${which}: ${error}`));
    });
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

  function openSemesterDialog() {
    const semester = currentSemester();
    const form = elements.semesterForm;
    form.elements.name.value = semester.name;
    form.elements.startDate.value = semester.startDate;
    form.elements.endDate.value = semester.endDate;
    showErrors(elements.semesterErrors, []);
    elements.semesterDialog.showModal();
  }

  function handleSemesterSubmit(event) {
    event.preventDefault();
    const form = elements.semesterForm;
    const name = form.elements.name.value.trim();
    const startDate = form.elements.startDate.value;
    const endDate = form.elements.endDate.value;
    const errors = [];
    if (!name) {
      errors.push('Give the semester a name, like Fall 2026.');
    }
    if (!model.isValidDateKey(startDate) || !model.isValidDateKey(endDate)) {
      errors.push('Pick a start and end date.');
    } else if (startDate > endDate) {
      errors.push('The end date must be after the start date.');
    }
    showErrors(elements.semesterErrors, errors);
    if (errors.length > 0) {
      return;
    }
    applyChange('Semester saved.', () => Object.assign(currentSemester(), { name, startDate, endDate }));
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
      const plannerClass = state.classes.find((candidate) => candidate.id === target.dataset.classId);
      const meeting = plannerClass.meetings.find((candidate) => candidate.id === target.dataset.meetingId);
      const cancelling = action === 'cancel-meeting';
      applyChange(`${cancelling ? 'Cancelled' : 'Restored'} ${plannerClass.name} on ${model.formatDate(date)}.`, () => {
        const others = (meeting.cancelledDates || []).filter((cancelledDate) => cancelledDate !== date);
        meeting.cancelledDates = cancelling ? [...others, date] : others;
      });
    } else if (action === 'delete-class') {
      const plannerClass = state.classes.find((candidate) => candidate.id === id);
      const count = state.assignments.filter((candidate) => candidate.classId === id).length;
      const warning = count > 0 ? ` This also deletes its ${count} assignment${count === 1 ? '' : 's'}.` : '';
      if (await askToConfirm(`Delete ${plannerClass.name}?${warning}`, 'Delete class')) {
        if (editingClassId === id) {
          stopEditingClass();
        }
        applyChange(`Deleted ${plannerClass.name}.`, () => {
          state.classes = state.classes.filter((candidate) => candidate.id !== id);
          state.assignments = state.assignments.filter((candidate) => candidate.classId !== id);
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
    } else if (action === 'open-drawer') {
      if (editingAssignment) {
        stopEditingAssignment();
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
  elements.classCancel.addEventListener('click', stopEditingClass);
  elements.semesterButton.addEventListener('click', openSemesterDialog);
  elements.semesterForm.addEventListener('submit', handleSemesterSubmit);
  document.getElementById('semester-cancel').addEventListener('click', () => elements.semesterDialog.close());
  document.getElementById('drawer-close').addEventListener('click', () => setDrawerOpen(false));
  elements.assignmentCancel.addEventListener('click', () => setDrawerOpen(false));
  document.getElementById('add-meeting').addEventListener('click', addMeetingRow);
  document.getElementById('add-recurring').addEventListener('click', addRecurringRow);
  elements.recurringList.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-recurring-action="remove"]');
    if (removeButton) {
      removeRecurringRow(removeButton.closest('.recurring-row'));
    }
  });
  elements.meetingList.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-meeting-action="remove"]');
    if (removeButton) {
      removeMeetingRow(removeButton.closest('.meeting-row'));
    }
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

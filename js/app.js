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

  const loaded = PlannerStorage.load(new Date());
  let state = loaded.state;
  let editingClassId = null;
  let showLater = false;
  let showDone = false;
  let toastTimer = null;
  let currentView = loadSavedView();
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
    confirmYes: document.getElementById('confirm-yes'),
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

  // Remembers List or Week on this device. A display preference, so losing it is harmless.
  function loadSavedView() {
    try {
      return localStorage.getItem(VIEW_STORAGE_KEY) === 'week' ? 'week' : 'list';
    } catch {
      return 'list';
    }
  }

  function saveView(view) {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      // The view just won't be remembered next time.
    }
  }

  function todayKey() {
    return model.toDateKey(new Date());
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

  // An in-page "Are you sure?" box. The browser's own confirm() is silently
  // blocked in some embedded browsers, which made delete buttons do nothing.
  function askToConfirm(message, confirmLabel) {
    elements.confirmMessage.textContent = message;
    elements.confirmYes.textContent = confirmLabel;
    elements.confirmDialog.returnValue = '';
    elements.confirmDialog.showModal();
    return new Promise((resolve) => {
      elements.confirmDialog.addEventListener('close', () => resolve(elements.confirmDialog.returnValue === 'confirm'), { once: true });
    });
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
    renderDueList();
  }

  function renderSemester() {
    const semester = currentSemester();
    elements.semesterLabel.textContent = `${semester.name} · ${model.formatMonthDay(semester.startDate)} – ${model.formatMonthDay(semester.endDate)}`;
  }

  function renderClasses() {
    const classes = currentClasses();
    if (classes.length === 0) {
      elements.classList.innerHTML = '<li class="empty">No classes yet. Add your first one below.</li>';
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
            </span>
            <button type="button" class="text-button" data-action="edit-class" data-id="${plannerClass.id}">Edit</button>
            <button type="button" class="text-button danger" data-action="delete-class" data-id="${plannerClass.id}">Delete</button>
          </li>`;
      })
      .join('');
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
    const menuItems =
      assignment.kind === 'weekly'
        ? `<button type="button" data-action="skip" ${dataAttributes}>Skip this date</button>
           <button type="button" class="danger" data-action="delete-series" ${dataAttributes}>Delete all dates…</button>`
        : `<button type="button" class="danger" data-action="delete-assignment" ${dataAttributes}>Delete</button>`;
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
        <button type="button" class="primary-button" data-action="open-drawer">${hasClasses ? 'Add an assignment' : 'Add your first class'}</button>
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
  function renderListItem(item, showDate) {
    const when = showDate ? `${model.formatDate(item.date)} · ${model.formatTime(item.time)}` : model.formatTime(item.time);
    return `
      <li class="due-item${item.done ? ' is-done' : ''}" style="--class-color: ${itemColor(item)}">
        ${renderCheckbox(item)}
        <div class="due-main">
          <span class="due-top-line">${renderClassTag(item)}<span class="due-time">${when}</span></span>
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
    const groups = model.groupDueList(items, todayKey());
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
    const isOverdue = !item.done && item.date < todayKey();
    return `
      <li class="due-item week-item${item.done ? ' is-done' : ''}${isOverdue ? ' is-overdue' : ''}" style="--class-color: ${itemColor(item)}">
        <span class="week-item-top">${renderClassTag(item)}${renderMenu(item)}</span>
        <span class="week-item-title">${renderCheckbox(item)}${renderTitle(item.assignment)}</span>
        <span class="due-time">${when}</span>
      </li>`;
  }

  function renderWeekColumn(heading, items, whenText, className) {
    const body =
      items.length === 0
        ? '<p class="week-empty">Nothing due</p>'
        : `<ul class="due-items">${items.map((item) => renderWeekItem(item, whenText(item))).join('')}</ul>`;
    return `<section class="week-column ${className}"><h3 class="week-column-heading">${heading}</h3>${body}</section>`;
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
    const week = model.buildWeek(items, weekStart, today);
    const isCurrentWeek = weekStart === model.startOfWeek(today);
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
    return `
      <div class="week-nav">
        <button type="button" class="icon-button" data-action="previous-week" aria-label="Previous week">←</button>
        <span class="week-range">${weekRangeLabel(weekStart)}</span>
        <button type="button" class="icon-button" data-action="next-week" aria-label="Next week">→</button>
        ${isCurrentWeek ? '' : '<button type="button" class="text-button" data-action="this-week">This week</button>'}
      </div>
      <div class="week-grid">${columns}</div>`;
  }

  // ---------- Add panel ----------

  function isDrawerOpen() {
    return elements.drawer.classList.contains('is-open');
  }

  function setDrawerOpen(open) {
    elements.drawer.inert = !open;
    elements.drawer.classList.toggle('is-open', open);
    document.body.classList.toggle('drawer-open', open);
    document.querySelectorAll('[data-action="open-drawer"]').forEach((button) => button.setAttribute('aria-expanded', String(open)));
    if (open) {
      // With no classes yet, start at the class form; otherwise at the assignment name.
      const firstField = currentClasses().length === 0 ? elements.classForm.elements.name : elements.assignmentForm.elements.title;
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
    document.querySelectorAll('.row-menu[open]').forEach((menu) => {
      menu.open = false;
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
    // Week starts on Monday, the way most class schedules are written.
    const weekOrder = [1, 2, 3, 4, 5, 6, 0];
    elements.dayPicker.innerHTML = weekOrder
      .map(
        (day) => `<label class="day-option"><input type="checkbox" name="days" value="${day}" /><span>${model.WEEKDAY_NAMES[day]}</span></label>`,
      )
      .join('');
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

  function handleAssignmentSubmit(event) {
    event.preventDefault();
    const form = elements.assignmentForm;
    const kind = form.elements.kind.value;
    const assignment = {
      id: newId('assignment'),
      semesterId: state.currentSemesterId,
      classId: form.elements.classId.value || null,
      title: form.elements.title.value.trim(),
      link: form.elements.link.value.trim(),
      kind,
      dueTime: form.elements.dueTime.value,
    };
    if (kind === 'once') {
      assignment.dueDate = form.elements.dueDate.value;
      assignment.done = false;
    } else {
      assignment.days = [...form.querySelectorAll('input[name="days"]:checked')].map((input) => Number(input.value));
      assignment.startDate = form.elements.startDate.value;
      assignment.endDate = form.elements.endDate.value;
      assignment.skippedDates = [];
      assignment.doneDates = [];
    }
    const errors = model.validateAssignment(assignment);
    showErrors(elements.assignmentErrors, errors);
    if (errors.length > 0) {
      return;
    }
    applyChange(`Added “${assignment.title}”.`, () => state.assignments.push(assignment));
    // Keep the class, type, and time so adding several similar assignments is quick.
    form.elements.title.value = '';
    form.elements.link.value = '';
    form.elements.dueDate.value = '';
    form.querySelectorAll('input[name="days"]').forEach((input) => {
      input.checked = false;
    });
    resetAssignmentDates();
    form.elements.title.focus();
  }

  function startEditingClass(id) {
    const plannerClass = state.classes.find((candidate) => candidate.id === id);
    editingClassId = id;
    elements.classForm.elements.name.value = plannerClass.name;
    const colorInput = [...elements.classForm.elements.color].find((input) => input.value === plannerClass.color);
    if (colorInput) {
      colorInput.checked = true;
    }
    elements.classFormLabel.textContent = `Rename ${plannerClass.name}`;
    elements.classSubmit.textContent = 'Save class';
    elements.classCancel.hidden = false;
    elements.classForm.elements.name.focus();
  }

  function stopEditingClass() {
    editingClassId = null;
    elements.classForm.reset();
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
    const errors = [];
    if (!name) {
      errors.push('Give the class a name.');
    } else if (duplicate) {
      errors.push(`You already have a class called ${name}.`);
    }
    showErrors(elements.classErrors, errors);
    if (errors.length > 0) {
      return;
    }
    if (editingClassId) {
      const plannerClass = state.classes.find((candidate) => candidate.id === editingClassId);
      applyChange(`Saved ${name}.`, () => Object.assign(plannerClass, { name, color }));
    } else {
      applyChange(`Added ${name}.`, () => state.classes.push({ id: newId('class'), semesterId: state.currentSemesterId, name, color }));
    }
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
      startEditingClass(id);
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
    } else if (action === 'open-drawer') {
      setDrawerOpen(true);
    } else if (action === 'set-view') {
      currentView = target.dataset.view;
      saveView(currentView);
      renderDueList();
    } else if (action === 'previous-week' || action === 'next-week') {
      weekStart = model.addDays(weekStart, action === 'next-week' ? 7 : -7);
      renderDueList();
    } else if (action === 'this-week') {
      weekStart = model.startOfWeek(todayKey());
      renderDueList();
    } else if (action === 'toggle-later') {
      showLater = !showLater;
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
    document.querySelectorAll('.row-menu[open]').forEach((menu) => {
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

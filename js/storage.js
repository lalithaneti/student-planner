// Saves the planner in the browser's localStorage, which keeps it across refreshes
// on this device and browser.

const PlannerStorage = (() => {
  const STORAGE_KEY = 'student-planner';
  const BACKUP_KEY = 'student-planner-unreadable-backup';
  const DATA_VERSION = 1;

  function createEmptyState(today) {
    const semester = { id: 'semester-1', ...PlannerModel.defaultSemester(today) };
    return {
      version: DATA_VERSION,
      currentSemesterId: semester.id,
      semesters: [semester],
      classes: [],
      assignments: [],
    };
  }

  function looksLikeState(value) {
    return (
      value !== null &&
      typeof value === 'object' &&
      value.version === DATA_VERSION &&
      Array.isArray(value.semesters) &&
      Array.isArray(value.classes) &&
      Array.isArray(value.assignments)
    );
  }

  // Returns { state, error }. Unreadable saved data is copied to a backup key first so it isn't lost.
  function load(today) {
    let saved;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      return { state: createEmptyState(today), error: 'This browser is blocking saved data, so changes won’t be kept after you close the page.' };
    }
    if (saved === null) {
      return { state: createEmptyState(today), error: null };
    }
    try {
      const parsed = JSON.parse(saved);
      if (looksLikeState(parsed)) {
        return { state: PlannerModel.updateOldColors(parsed), error: null };
      }
    } catch {
      // Falls through to the backup below.
    }
    try {
      localStorage.setItem(BACKUP_KEY, saved);
    } catch {
      return { state: createEmptyState(today), error: 'Your saved planner couldn’t be read, and a backup copy couldn’t be made.' };
    }
    return { state: createEmptyState(today), error: 'Your saved planner couldn’t be read, so the app started fresh. A backup copy of the old data was kept.' };
  }

  // Returns true if the save worked.
  function save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch {
      return false;
    }
  }

  const BACKUP_APP = 'student-planner-backup';

  // A backup file holds the whole planner plus the theme, with a label so restoring can
  // tell it apart from any other file.
  function createBackup(state, theme, now) {
    return JSON.stringify({ app: BACKUP_APP, savedAt: now.toISOString(), planner: state, theme }, null, 2);
  }

  // Returns { backup } with the planner, theme, and when it was saved, or { error } explaining what's wrong.
  function readBackup(text) {
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { error: 'That file isn’t a planner backup. Choose a file made with “Download backup”.' };
    }
    if (parsed === null || typeof parsed !== 'object' || parsed.app !== BACKUP_APP) {
      return { error: 'That file isn’t a planner backup. Choose a file made with “Download backup”.' };
    }
    if (!looksLikeState(parsed.planner)) {
      return { error: 'That backup is damaged or from a newer version of the planner, so it can’t be restored.' };
    }
    const savedAt = new Date(parsed.savedAt);
    return {
      backup: {
        planner: PlannerModel.updateOldColors(parsed.planner),
        theme: parsed.theme ?? null,
        savedAt: Number.isNaN(savedAt.getTime()) ? null : savedAt,
      },
    };
  }

  return { createEmptyState, load, save, createBackup, readBackup };
})();

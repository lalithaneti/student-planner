// Study Buddy: a little creature that grows as assignments get done.
// Points are worked out from the planner itself each time (not kept as a running
// total), so Undo, unchecking, and editing can never leave them out of step.

const PlannerBuddy = (() => {
  const ON_TIME_POINTS = 10;
  const LATE_POINTS = 5;
  const MISSED_POINTS = -5;
  const NAME_MAX_LENGTH = 20;
  // Bonus points for finishing everything on time this many days in a row. After the
  // last one, every further LAST_MILESTONE days earns its bonus again.
  const STREAK_MILESTONES = [
    { days: 3, points: 10 },
    { days: 7, points: 25 },
    { days: 14, points: 50 },
    { days: 30, points: 100 },
  ];
  const LAST_MILESTONE = STREAK_MILESTONES[STREAK_MILESTONES.length - 1];

  // What a week's chest can hold. Repeats make the bigger prizes rarer.
  const CHEST_PRIZES = [10, 10, 10, 15, 15, 20, 30];

  // Each stage starts at a number of points; growVerb finishes "N more points to …".
  const STAGES = [
    { name: 'Egg', minPoints: 0, growVerb: 'hatch' },
    { name: 'Baby', minPoints: 50, growVerb: 'grow ears' },
    { name: 'Little one', minPoints: 150, growVerb: 'grow up' },
    { name: 'Grown-up', minPoints: 300, growVerb: null },
  ];

  // Accessories unlock by best streak, so once earned they stay. One can be worn per spot.
  const ACCESSORY_SPOTS = [
    { id: 'head', name: 'Head' },
    { id: 'face', name: 'Face' },
    { id: 'neck', name: 'Neck' },
  ];
  const ACCESSORIES = [
    { id: 'bow', name: 'Pink bow', spot: 'head', streakDays: 1 },
    { id: 'round-glasses', name: 'Round glasses', spot: 'face', streakDays: 2 },
    { id: 'scarf', name: 'Striped scarf', spot: 'neck', streakDays: 3 },
    { id: 'beret', name: 'Beret', spot: 'head', streakDays: 5 },
    { id: 'heart-shades', name: 'Heart shades', spot: 'face', streakDays: 7 },
    { id: 'bow-tie', name: 'Bow tie', spot: 'neck', streakDays: 10 },
    { id: 'flower-crown', name: 'Flower crown', spot: 'head', streakDays: 14 },
    { id: 'party-hat', name: 'Party hat', spot: 'head', streakDays: 21 },
    { id: 'crown', name: 'Gold crown', spot: 'head', streakDays: 30 },
  ];

  // The mochi blob comes in these colors, picked when a semester's buddy is started.
  const COLORS = [
    { id: 'pink', name: 'Pink' },
    { id: 'mint', name: 'Mint' },
    { id: 'lavender', name: 'Lavender' },
    { id: 'peach', name: 'Peach' },
    { id: 'sky', name: 'Sky blue' },
    { id: 'lemon', name: 'Lemon' },
  ];

  // Each semester's buddy is a species it hasn't been before, as long as unused ones are left.
  const SPECIES = [
    { id: 'mochi', name: 'Mochi' },
    { id: 'bunny', name: 'Bunny' },
    { id: 'chick', name: 'Chick' },
    { id: 'fox', name: 'Fox' },
    { id: 'puppy', name: 'Puppy' },
    { id: 'bear', name: 'Bear' },
    { id: 'penguin', name: 'Penguin' },
    { id: 'hamster', name: 'Hamster' },
    { id: 'hedgehog', name: 'Hedgehog' },
    { id: 'mouse', name: 'Mouse' },
  ];

  // Only work due on or after startDate counts, so things missed before the buddy
  // existed don't count against it. wearing maps a spot to an accessory id.
  function newBuddy(todayKey, color = 'pink', species = 'mochi') {
    return { name: '', species, color, startDate: todayKey, lateDone: [], wearing: {}, openedChests: [] };
  }

  // Each semester has its own buddy in state.buddies, keyed by semester id. A new one
  // starts counting on the semester's first day, or today if the semester already began.
  function startBuddy(state, semesterId, color, todayKey, species = 'mochi') {
    const semester = state.semesters.find((candidate) => candidate.id === semesterId);
    state.buddies = {
      ...(state.buddies || {}),
      [semesterId]: newBuddy(semester.startDate > todayKey ? semester.startDate : todayKey, color, species),
    };
  }

  // The species other semesters' buddies already are.
  function usedSpecies(state, semesterId) {
    return Object.entries(state.buddies || {})
      .filter(([id, buddy]) => id !== semesterId && buddy.species)
      .map(([, buddy]) => buddy.species);
  }

  // The species a semester can pick: the unused ones, or every one once all have been used.
  function speciesChoices(state, semesterId) {
    const used = usedSpecies(state, semesterId);
    const unused = SPECIES.filter((species) => !used.includes(species.id));
    return unused.length > 0 ? unused.map((species) => species.id) : SPECIES.map((species) => species.id);
  }

  // Buddies from before species existed get one, oldest semester first: the first is a mochi,
  // and each later one the first species not used yet. Returns true if anything changed.
  function fillInSpecies(state) {
    let changed = false;
    const semesters = [...state.semesters].sort((a, b) => a.startDate.localeCompare(b.startDate));
    for (const semester of semesters) {
      const buddy = (state.buddies || {})[semester.id];
      if (buddy && !buddy.species) {
        buddy.species = speciesChoices(state, semester.id)[0];
        changed = true;
      }
    }
    return changed;
  }

  // Planners from before buddies were per semester had one state.buddy; it becomes the buddy of
  // the semester it started in, in its original pink. A brand-new planner gets a pink buddy for
  // its first semester. Returns true if anything changed, so the caller knows to save.
  function moveToSemesterBuddies(state, todayKey) {
    if (state.buddies) {
      return false;
    }
    state.buddies = {};
    if (state.buddy) {
      const home =
        state.semesters.find((semester) => semester.startDate <= state.buddy.startDate && state.buddy.startDate <= semester.endDate) ||
        state.semesters.find((semester) => semester.id === state.currentSemesterId);
      state.buddies[home.id] = { color: 'pink', species: 'mochi', ...state.buddy };
      delete state.buddy;
    } else {
      startBuddy(state, state.currentSemesterId, 'pink', todayKey);
    }
    return true;
  }

  // The planner as one semester's buddy sees it: that semester's work and that buddy (or
  // null if the semester has none yet). Every function below takes a view like this.
  function forSemester(state, semesterId) {
    return { ...state, currentSemesterId: semesterId, buddy: (state.buddies || {})[semesterId] || null };
  }

  function isUnlocked(accessory, bestStreak) {
    return bestStreak >= accessory.streakDays;
  }

  // What the buddy has on, spot by spot, leaving out anything not unlocked.
  function wornAccessories(buddy, bestStreak) {
    const worn = {};
    for (const [spot, id] of Object.entries((buddy && buddy.wearing) || {})) {
      const accessory = ACCESSORIES.find((candidate) => candidate.id === id);
      if (accessory && isUnlocked(accessory, bestStreak)) {
        worn[spot] = id;
      }
    }
    return worn;
  }

  // Puts an accessory on, or takes it off if it's already on. Anything else in that spot comes off.
  function toggleAccessory(buddy, accessoryId) {
    const accessory = ACCESSORIES.find((candidate) => candidate.id === accessoryId);
    const wearing = { ...(buddy.wearing || {}) };
    if (wearing[accessory.spot] === accessoryId) {
      delete wearing[accessory.spot];
    } else {
      wearing[accessory.spot] = accessoryId;
    }
    buddy.wearing = wearing;
  }

  function occurrenceKey(assignmentId, date) {
    return `${assignmentId}|${date}`;
  }

  // The semester's assignment dates since its buddy started, oldest first.
  function countedItems(state) {
    return PlannerModel.buildDueList(state)
      .filter((item) => item.date >= state.buddy.startDate)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }

  function wasDoneLate(buddy, item) {
    return buddy.lateDone.includes(occurrenceKey(item.assignment.id, item.date));
  }

  // The bonus for reaching a streak length, or 0 if it isn't a milestone.
  function streakBonus(days) {
    const milestone = STREAK_MILESTONES.find((candidate) => candidate.days === days);
    if (milestone) {
      return milestone.points;
    }
    return days > LAST_MILESTONE.days && days % LAST_MILESTONE.days === 0 ? LAST_MILESTONE.points : 0;
  }

  // How each day since the buddy started went: 'kept' (everything due was checked off
  // on time, or nothing was due), 'broken' (something was late or went past due
  // unchecked), or 'pending' (today, with work still to do before it's due).
  function streakDays(state, items, todayKey, nowTime) {
    const days = [];
    // Days after the semester ends don't count, so a past semester's buddy stays as it finished.
    const semesterEnd = state.semesters.find((semester) => semester.id === state.currentSemesterId).endDate;
    const lastDay = todayKey < semesterEnd ? todayKey : semesterEnd;
    for (let date = state.buddy.startDate; date <= lastDay; date = PlannerModel.addDays(date, 1)) {
      const dueThatDay = items.filter((item) => item.date === date);
      const broken = dueThatDay.some((item) =>
        item.done ? wasDoneLate(state.buddy, item) : isPastDue(item, todayKey, nowTime),
      );
      const allDone = dueThatDay.every((item) => item.done);
      days.push({ date, result: broken ? 'broken' : allDone ? 'kept' : 'pending' });
    }
    return days;
  }

  // The current and best streaks, and the bonuses earned along the way. A pending
  // today doesn't add to the streak or break it.
  function streakSummary(state, items, todayKey, nowTime) {
    let current = 0;
    let best = 0;
    const bonuses = [];
    for (const { date, result } of streakDays(state, items, todayKey, nowTime)) {
      if (result === 'broken') {
        current = 0;
      } else if (result === 'kept') {
        current += 1;
        best = Math.max(best, current);
        const bonus = streakBonus(current);
        if (bonus > 0) {
          bonuses.push({ date, days: current, points: bonus });
        }
      }
    }
    return { current, best, bonuses };
  }

  // The streak now, the best one, and the next bonus to reach.
  function streakFor(state, todayKey, nowTime) {
    if (!state.buddy) {
      return { current: 0, best: 0, next: STREAK_MILESTONES[0] };
    }
    const { current, best } = streakSummary(state, countedItems(state), todayKey, nowTime);
    let nextDays = current + 1;
    while (streakBonus(nextDays) === 0) {
      nextDays += 1;
    }
    // How many milestones the current streak has passed (0 to 4), for the flame's size.
    const level = STREAK_MILESTONES.filter((milestone) => current >= milestone.days).length;
    return { current, best, level, next: { days: nextDays, points: streakBonus(nextDays) } };
  }

  // Each week's prize comes from the week and the buddy, not from a dice roll, so it looks
  // random but stays the same however many times the week is unchecked, undone, and redone.
  function chestPrize(buddy, weekStart) {
    // FNV-1a, a standard hash, with a final stir: week dates differ by only a digit or two,
    // and a simpler hash gave the same prize many weeks in a row.
    let hash = 2166136261;
    for (const character of `${buddy.startDate}|${buddy.species}|${weekStart}`) {
      hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    }
    hash = Math.imul(hash ^ (hash >>> 15), 2246822519);
    hash ^= hash >>> 13;
    return { points: CHEST_PRIZES[(hash >>> 0) % CHEST_PRIZES.length] };
  }

  // Whether a week's work is all checked off, counting only weeks the buddy was around for.
  function weekIsFinished(state, items, weekStart) {
    const weekEnd = PlannerModel.addDays(weekStart, 6);
    const dueThatWeek = items.filter((item) => item.date >= weekStart && item.date <= weekEnd);
    return dueThatWeek.length > 0 && dueThatWeek.every((item) => item.done) && weekEnd >= state.buddy.startDate;
  }

  // A week's chest: 'locked' until the week is finished, then 'ready' to open, then 'opened'.
  // Unchecking work locks an opened chest again until the week is finished again.
  function chestFor(state, weekStart) {
    if (!state.buddy) {
      return { status: 'locked', reason: 'no-buddy' };
    }
    if (PlannerModel.addDays(weekStart, 6) < state.buddy.startDate) {
      return { status: 'locked', reason: 'before-buddy' };
    }
    if (!weekIsFinished(state, PlannerModel.buildDueList(state), weekStart)) {
      return { status: 'locked' };
    }
    const prize = chestPrize(state.buddy, weekStart);
    return { status: (state.buddy.openedChests || []).includes(weekStart) ? 'opened' : 'ready', prize };
  }

  function openChest(buddy, weekStart) {
    buddy.openedChests = [...new Set([...(buddy.openedChests || []), weekStart])];
    return chestPrize(buddy, weekStart);
  }

  // The points each counted assignment date and streak bonus earned or lost, newest first.
  function pointsLog(state, todayKey, nowTime) {
    if (!state.buddy) {
      return [];
    }
    const items = countedItems(state);
    const entries = [];
    for (const item of items) {
      const status = PlannerModel.itemStatus(item, todayKey, nowTime);
      const when = item.date + item.time;
      if (status === 'done') {
        const late = wasDoneLate(state.buddy, item);
        entries.push({ when, item, points: late ? LATE_POINTS : ON_TIME_POINTS, reason: late ? 'done late' : 'done' });
      } else if (status === 'missed') {
        entries.push({ when, item, points: MISSED_POINTS, reason: 'missed' });
      }
    }
    // A streak bonus comes after that day's work.
    for (const bonus of streakSummary(state, items, todayKey, nowTime).bonuses) {
      entries.push({ when: `${bonus.date}~`, item: null, points: bonus.points, reason: 'streak', streakDays: bonus.days });
    }
    // A chest's bonus counts while its week stays finished, dated the last day of that week.
    const allItems = PlannerModel.buildDueList(state);
    for (const weekStart of state.buddy.openedChests || []) {
      if (weekIsFinished(state, allItems, weekStart)) {
        const when = `${PlannerModel.addDays(weekStart, 6)}~`;
        entries.push({ when, item: null, points: chestPrize(state.buddy, weekStart).points, reason: 'chest' });
      }
    }
    // Plain character order (not localeCompare, which ranks "~" before digits).
    return entries.sort((a, b) => (a.when < b.when ? 1 : a.when > b.when ? -1 : 0));
  }

  // Points never go below 0.
  function totalPoints(entries) {
    return Math.max(
      0,
      entries.reduce((sum, entry) => sum + entry.points, 0),
    );
  }

  // How many points checking off this assignment date right now would earn: 0 if it
  // was due before the buddy existed, half if it's already past due.
  function pointsForCheckingOff(state, item, todayKey, nowTime) {
    if (!state.buddy || item.date < state.buddy.startDate) {
      return 0;
    }
    return isPastDue(item, todayKey, nowTime) ? LATE_POINTS : ON_TIME_POINTS;
  }

  function isPastDue(item, todayKey, nowTime) {
    return item.date < todayKey || (item.date === todayKey && item.time < nowTime);
  }

  // Records whether an assignment date was checked off late, or forgets it when unchecked.
  function recordCheckOff(buddy, item, done, todayKey, nowTime) {
    const key = occurrenceKey(item.assignment.id, item.date);
    buddy.lateDone = buddy.lateDone.filter((candidate) => candidate !== key);
    if (done && isPastDue(item, todayKey, nowTime)) {
      buddy.lateDone.push(key);
    }
  }

  // Where the buddy is: its stage, the next one, and how far along the way it is (0 to 1).
  function stageFor(points) {
    let index = 0;
    while (index + 1 < STAGES.length && points >= STAGES[index + 1].minPoints) {
      index += 1;
    }
    const stage = STAGES[index];
    const next = STAGES[index + 1] || null;
    return {
      index,
      stage,
      next,
      pointsToNext: next ? next.minPoints - points : 0,
      progress: next ? (points - stage.minPoints) / (next.minPoints - stage.minPoints) : 1,
    };
  }

  // Sleepy hours: from 11 PM until 5 AM.
  const BEDTIME = '23:00';
  const WAKE_UP = '05:00';

  // How the buddy feels right now:
  // - 'droopy': something is overdue (until it's checked off), or something was missed today.
  // - 'sleepy': it's night and nothing is still due tonight.
  // - 'happy': everything due today is done (or nothing is due).
  // - 'content': work is still due later today.
  // worries lists what made it droopy, soonest first; dueLeft counts work still due today.
  function moodFor(state, todayKey, nowTime) {
    if (!state.buddy) {
      return { mood: 'content', worries: [], dueLeft: 0 };
    }
    // A buddy for a semester that hasn't started sleeps until its first day.
    if (todayKey < state.buddy.startDate) {
      return { mood: 'sleepy', worries: [], dueLeft: 0, wakesOn: state.buddy.startDate };
    }
    const items = countedItems(state);
    const worries = items.filter((item) => {
      const status = PlannerModel.itemStatus(item, todayKey, nowTime);
      return status === 'overdue' || (status === 'missed' && item.date === todayKey);
    });
    const stillDueToday = items.filter((item) => item.date === todayKey && PlannerModel.itemStatus(item, todayKey, nowTime) === 'upcoming');
    const isNight = nowTime >= BEDTIME || nowTime < WAKE_UP;
    // "Tonight" ends at midnight late in the evening, or at 5 AM after midnight.
    const tonightEnds = nowTime >= BEDTIME ? '24:00' : WAKE_UP;
    const dueTonight = stillDueToday.filter((item) => item.time < tonightEnds);
    let mood = 'content';
    if (worries.length > 0) {
      mood = 'droopy';
    } else if (isNight && dueTonight.length === 0) {
      mood = 'sleepy';
    } else if (stillDueToday.length === 0) {
      mood = 'happy';
    }
    return { mood, worries, dueLeft: stillDueToday.length };
  }

  function validateName(name) {
    return name.trim().length > NAME_MAX_LENGTH ? [`Names can be up to ${NAME_MAX_LENGTH} letters.`] : [];
  }

  function displayName(buddy) {
    return buddy && buddy.name.trim() ? buddy.name.trim() : 'Your buddy';
  }

  // ---------- Challenging a friend ----------

  const CHALLENGE_VERSION = 1;
  const CHALLENGE_MAX_ITEMS = 1000;

  // What a challenge link carries: the buddy's look and one week's numbers, and nothing else
  // from the planner. The state is a view from forSemester, so it must have a buddy.
  function challengeFor(state, weekStart, todayKey, nowTime) {
    const { done, total } = PlannerModel.buildWeek(PlannerModel.buildDueList(state), weekStart, todayKey, nowTime).progress;
    const points = totalPoints(pointsLog(state, todayKey, nowTime));
    return {
      name: state.buddy.name.trim(),
      species: state.buddy.species,
      color: state.buddy.color,
      stage: stageFor(points).index,
      week: weekStart,
      done,
      total,
    };
  }

  // Letters, digits, - and _ only, so the text survives being pasted into a message.
  function encodeChallenge(challenge) {
    const bytes = new TextEncoder().encode(JSON.stringify({ version: CHALLENGE_VERSION, ...challenge }));
    return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  }

  // A challenge from a link, or null if it isn't a valid one. Anyone can edit a link, so every
  // value is checked, and only the expected values are kept.
  function readChallenge(text) {
    let parsed;
    try {
      const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
      parsed = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (letter) => letter.charCodeAt(0))));
    } catch {
      return null;
    }
    if (parsed === null || typeof parsed !== 'object' || parsed.version !== CHALLENGE_VERSION) {
      return null;
    }
    const { name, species, color, stage, week, done, total } = parsed;
    const isValid =
      typeof name === 'string' &&
      name.length <= NAME_MAX_LENGTH &&
      SPECIES.some((candidate) => candidate.id === species) &&
      COLORS.some((candidate) => candidate.id === color) &&
      Number.isInteger(stage) &&
      stage >= 0 &&
      stage < STAGES.length &&
      PlannerModel.isValidDateKey(week) &&
      Number.isInteger(done) &&
      Number.isInteger(total) &&
      done >= 0 &&
      done <= total &&
      total <= CHALLENGE_MAX_ITEMS;
    return isValid ? { name, species, color, stage, week, done, total } : null;
  }

  function challengePercent({ done, total }) {
    return total === 0 ? 0 : Math.round((done / total) * 100);
  }

  // 'ahead', 'behind', or 'tied' by share of the week's work done, so more homework isn't an
  // advantage. null when they can't be compared: different weeks, or either has nothing due.
  function compareChallenges(mine, theirs) {
    if (mine.week !== theirs.week || mine.total === 0 || theirs.total === 0) {
      return null;
    }
    const difference = mine.done * theirs.total - theirs.done * mine.total;
    if (difference === 0) {
      return 'tied';
    }
    return difference > 0 ? 'ahead' : 'behind';
  }

  // ---------- Drawing ----------

  const INK = '#4a2e44';

  // Each color's body gradient (light to dark), outline, ears and arms (soft), inner ears
  // (deep), feet, and egg (light, dark, outline).
  const PALETTES = {
    pink: { light: '#fff0f6', dark: '#ffbcd3', outline: '#f29bbb', soft: '#ffc6da', deep: '#ff9ebd', feet: '#ffb3cd', egg: ['#fff8fb', '#ffd9e7', '#efb7cb'] },
    mint: { light: '#effcf5', dark: '#b2ebcd', outline: '#7fcfa6', soft: '#c6f0da', deep: '#93dcb6', feet: '#a8e6c6', egg: ['#f6fef9', '#cdf3df', '#93d8b4'] },
    lavender: { light: '#f6f1ff', dark: '#d4c6ff', outline: '#ab97ea', soft: '#ddd2ff', deep: '#bfaef5', feet: '#cdbffb', egg: ['#faf7ff', '#e2d9ff', '#b9a8ee'] },
    peach: { light: '#fff4ec', dark: '#ffcfae', outline: '#f0a77a', soft: '#ffd9bf', deep: '#ffb88c', feet: '#ffc7a3', egg: ['#fffaf5', '#ffe0c9', '#f0b48c'] },
    sky: { light: '#eff8ff', dark: '#bde0ff', outline: '#86bfe8', soft: '#cbe7ff', deep: '#9fd0f7', feet: '#b3dbfb', egg: ['#f6fbff', '#d3ebff', '#94c7ec'] },
    lemon: { light: '#fffcea', dark: '#ffeea0', outline: '#e0c252', soft: '#fff3b8', deep: '#ffe27a', feet: '#ffeb99', egg: ['#fffef5', '#fff3c2', '#e3cc72'] },
  };
  const BLUSH = '#ff8fab';

  const CLOSED_EYES = `<path d="M77 124 q7 7 14 0 M109 124 q7 7 14 0" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" />`;
  const SMALL_SMILE = `<path d="M93 131 q3.5 5 7 0 q3.5 5 7 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />`;

  // Eyes and mouth for each mood; the egg always sleeps inside its shell.
  function faceParts(mood) {
    if (mood === 'sleepy') {
      return { eyes: CLOSED_EYES, mouth: `<ellipse cx="100" cy="134" rx="3.5" ry="4" fill="${INK}" />` };
    }
    if (mood === 'happy') {
      return {
        eyes: `<path d="M70 120 q10 -14 20 0 M110 120 q10 -14 20 0" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" />`,
        mouth: `<path d="M90 128 Q100 144 110 128 Z" fill="${INK}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" />
          <path d="M95 135 Q100 131 105 135 Q100 140 95 135 Z" fill="${BLUSH}" />`,
      };
    }
    const droopy = mood === 'droopy';
    // Worried brows tilt up toward the middle, and the eyes get extra shine like they're teary.
    const brows = droopy
      ? `<path d="M68 101 L88 95 M132 101 L112 95" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round" />`
      : '';
    const tears = droopy ? `<circle cx="84" cy="124" r="2.4" fill="#fff" /><circle cx="124" cy="124" r="2.4" fill="#fff" />` : '';
    return {
      eyes: `${brows}<g class="buddy-eyes">
          <ellipse cx="80" cy="116" rx="10" ry="12.5" fill="${INK}" />
          <ellipse cx="120" cy="116" rx="10" ry="12.5" fill="${INK}" />
          <circle cx="83.5" cy="110.5" r="4.2" fill="#fff" />
          <circle cx="123.5" cy="110.5" r="4.2" fill="#fff" />
          <circle cx="76.5" cy="121" r="2" fill="#fff" />
          <circle cx="116.5" cy="121" r="2" fill="#fff" />
          ${tears}
        </g>`,
      mouth: droopy ? `<path d="M93 136 q7 -7 14 0" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" />` : SMALL_SMILE,
    };
  }

  function face(mood) {
    const { eyes, mouth } = faceParts(mood);
    return `${eyes}
      <ellipse cx="62" cy="134" rx="11" ry="6.5" fill="${BLUSH}" opacity="0.55" />
      <ellipse cx="138" cy="134" rx="11" ry="6.5" fill="${BLUSH}" opacity="0.55" />
      ${mouth}`;
  }

  // Floating hearts when happy, a sweat drop when droopy, a nightcap when sleepy.
  function heart(x, y, size, delay) {
    return `<path class="buddy-heart" style="animation-delay:${delay}s" transform="translate(${x} ${y}) scale(${size})"
      d="M0 3 C-1 -2 -8 -2 -8 3 C-8 7 -3 10 0 13 C3 10 8 7 8 3 C8 -2 1 -2 0 3 Z" fill="#ff7aa2" />`;
  }

  function moodExtras(mood, isEgg) {
    if (mood === 'happy') {
      return heart(30, 72, 1.3, 0) + heart(166, 58, 1, 1.1) + heart(150, 28, 0.8, 2.2);
    }
    if (mood === 'droopy') {
      const [x, y] = isEgg ? [150, 74] : [150, 84];
      return `<path class="buddy-sweat" d="M${x} ${y} C${x - 7} ${y + 10} ${x - 7} ${y + 18} ${x} ${y + 18} C${x + 7} ${y + 18} ${x + 7} ${y + 10} ${x} ${y} Z"
        fill="#a7d8ff" stroke="#6fb6ee" stroke-width="1.5" />`;
    }
    return '';
  }

  const NIGHTCAP = `<path d="M70 72 C72 52 96 40 120 44 C134 46 146 40 152 30 C152 50 140 64 130 72 Z" fill="#9db4ff" stroke="#7d95e8" stroke-width="2.5" stroke-linejoin="round" />
    <rect x="66" y="66" width="68" height="11" rx="5.5" fill="#fff" stroke="#d6defa" stroke-width="2" />
    <circle cx="153" cy="29" r="7" fill="#fff" stroke="#d6defa" stroke-width="2" />`;

  function zzz(x, y) {
    return `<text class="buddy-zzz" x="${x}" y="${y}" font-size="20" fill="${INK}" opacity="0.6">z</text>
      <text class="buddy-zzz" style="animation-delay:1s" x="${x + 14}" y="${y - 16}" font-size="14" fill="${INK}" opacity="0.6">z</text>`;
  }

  function drawEgg(cracked, fillId, mood, wearing, palette) {
    const crack = cracked
      ? `<path d="M58 98 L70 108 L80 96 L92 110 L103 97 L114 109 L126 96 L140 104" fill="none" stroke="#c9a46e" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />`
      : '';
    return `<g class="buddy-body buddy-egg">
        <path d="M100 38 C142 38 162 108 160 136 C158 166 134 180 100 180 C66 180 42 166 40 136 C38 108 58 38 100 38 Z"
          fill="url(#${fillId})" stroke="${palette.egg[2]}" stroke-width="3" />
        <circle cx="74" cy="84" r="10" fill="#ffc8dc" />
        <circle cx="128" cy="72" r="7" fill="#c3ecd8" />
        <circle cx="138" cy="118" r="11" fill="#ffc8dc" />
        <circle cx="58" cy="140" r="6" fill="#c3ecd8" />
        <circle cx="122" cy="160" r="7" fill="#d9ccff" />
        <circle cx="78" cy="162" r="6" fill="#ffc8dc" />
        <ellipse cx="78" cy="62" rx="10" ry="6" transform="rotate(-35 78 62)" fill="#fff" opacity="0.7" />
        ${crack}
        ${CLOSED_EYES}
        <ellipse cx="62" cy="134" rx="11" ry="6.5" fill="${BLUSH}" opacity="0.55" />
        <ellipse cx="138" cy="134" rx="11" ry="6.5" fill="${BLUSH}" opacity="0.55" />
        ${faceParts(mood === 'droopy' ? 'droopy' : 'content').mouth}
        ${moodExtras(mood, true)}
        ${drawAccessories(wearing, true, mood === 'sleepy')}
      </g>
      ${mood === 'happy' ? '' : zzz(150, 52)}`;
  }

  // Accessory drawings, placed for the grown blob's head (top at y=60), eyes (y=116),
  // and lower body (y=150). The egg and smaller blobs shift them to fit.
  const flower = (x, y, color) =>
    `<g transform="translate(${x} ${y})">
      <circle cx="0" cy="-4" r="4" fill="${color}" /><circle cx="4" cy="0" r="4" fill="${color}" />
      <circle cx="0" cy="4" r="4" fill="${color}" /><circle cx="-4" cy="0" r="4" fill="${color}" />
      <circle r="2.6" fill="#ffd166" />
    </g>`;
  const heartLens = (x) =>
    `<path transform="translate(${x} 108)" d="M0 6 C-2 -2 -16 -2 -16 8 C-16 16 -6 20 0 26 C6 20 16 16 16 8 C16 -2 2 -2 0 6 Z"
      fill="#e8457f" opacity="0.88" stroke="#b8305f" stroke-width="2" />
     <ellipse cx="${x - 7}" cy="114" rx="3.5" ry="2.2" fill="#fff" opacity="0.8" />`;
  const ACCESSORY_ART = {
    bow: `<g transform="translate(132 72) rotate(18)">
        <path d="M0 0 C-6 -15 -26 -15 -24 0 C-26 15 -6 15 0 0 Z" fill="#ff86b6" stroke="#e0558c" stroke-width="2.5" />
        <path d="M0 0 C6 -15 26 -15 24 0 C26 15 6 15 0 0 Z" fill="#ff86b6" stroke="#e0558c" stroke-width="2.5" />
        <circle r="6" fill="#e0558c" />
      </g>`,
    beret: `<g transform="rotate(-12 100 62)">
        <ellipse cx="102" cy="64" rx="44" ry="14" fill="#d9485f" stroke="#b83248" stroke-width="2.5" />
        <path d="M60 66 Q102 80 144 66" fill="none" stroke="#b83248" stroke-width="3" />
        <rect x="98" y="44" width="7" height="9" rx="3.5" fill="#b83248" />
      </g>`,
    'flower-crown': `<path d="M62 82 Q100 54 138 82" fill="none" stroke="#6cbf8a" stroke-width="3" />
      ${flower(64, 80, '#ff9ebd')}${flower(82, 68, '#c9b3ff')}${flower(100, 64, '#ffffff')}${flower(118, 68, '#ff9ebd')}${flower(136, 80, '#c9b3ff')}`,
    'party-hat': `<path d="M82 66 L112 12 L126 62 Z" fill="#7cc4ff" stroke="#4f9ee0" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M90 52 L118 46 M98 36 L114 33" stroke="#ffd166" stroke-width="5" stroke-linecap="round" />
      <circle cx="112" cy="12" r="6" fill="#ff86b6" />`,
    crown: `<path d="M74 68 L70 40 L87 53 L100 32 L113 53 L130 40 L126 68 Z" fill="#ffd166" stroke="#d99a1f" stroke-width="2.5" stroke-linejoin="round" />
      <circle cx="100" cy="58" r="4.5" fill="#ff6f91" /><circle cx="84" cy="61" r="3" fill="#7cc4ff" /><circle cx="116" cy="61" r="3" fill="#7cc4ff" />`,
    'round-glasses': `<g fill="#fff" fill-opacity="0.18" stroke="#6b4f3a" stroke-width="3.5">
        <circle cx="80" cy="116" r="16" /><circle cx="120" cy="116" r="16" />
      </g>
      <path d="M96 114 Q100 110 104 114 M64 112 L48 106 M136 112 L152 106" fill="none" stroke="#6b4f3a" stroke-width="3.5" stroke-linecap="round" />`,
    'heart-shades': `${heartLens(80)}${heartLens(120)}
      <path d="M95 114 Q100 110 105 114 M64 114 L48 108 M136 114 L152 108" fill="none" stroke="#b8305f" stroke-width="3" stroke-linecap="round" />`,
    scarf: `<g transform="translate(0 -12)"><path d="M34 142 Q100 166 166 142 L168 158 Q100 182 32 158 Z" fill="#ff9f6e" stroke="#e07a45" stroke-width="2.5" />
      <path d="M58 150 L54 165 M82 156 L80 172 M106 158 L106 174 M130 155 L132 171 M152 148 L156 163" stroke="#fff3e8" stroke-width="5" />
      <path d="M134 160 L150 190 L134 194 L124 164 Z" fill="#ff9f6e" stroke="#e07a45" stroke-width="2.5" stroke-linejoin="round" /></g>`,
    'bow-tie': `<path d="M100 156 L82 146 L82 166 Z M100 156 L118 146 L118 166 Z" fill="#6f8cff" stroke="#4f6be0" stroke-width="2.5" stroke-linejoin="round" />
      <circle cx="100" cy="156" r="5" fill="#4f6be0" />`,
  };

  // The worn accessories as SVG. On the egg, head things sit higher, face things lower
  // (its eyes are lower), and neck things narrower.
  function drawAccessories(wearing, isEgg, sleepy) {
    const fit = isEgg
      ? { head: 'translate(0 -24)', face: 'translate(0 8)', neck: 'translate(100 4) scale(0.86 1) translate(-100 0)' }
      : { head: '', face: '', neck: '' };
    return ['neck', 'face', 'head']
      .filter((spot) => wearing[spot] && !(spot === 'head' && sleepy))
      .map((spot) => `<g transform="${fit[spot]}">${ACCESSORY_ART[wearing[spot]]}</g>`)
      .join('');
  }

  // The part of the drawing each spot's accessories sit in, for drawing one on its own.
  const SPOT_VIEW_BOXES = { head: '50 6 110 86', face: '42 90 116 50', neck: '26 122 148 66' };

  function drawAccessory(accessoryId) {
    const accessory = ACCESSORIES.find((candidate) => candidate.id === accessoryId);
    return `<svg class="accessory-art" viewBox="${SPOT_VIEW_BOXES[accessory.spot]}" aria-hidden="true" focusable="false">${ACCESSORY_ART[accessoryId]}</svg>`;
  }

  // Each drawing gets its own gradient ids: a gradient defined inside a hidden tab
  // doesn't paint for drawings elsewhere that point to it.
  let drawingCount = 0;

  const BODY_PATH = 'M42 172 C30 172 28 150 32 130 C40 82 70 60 100 60 C130 60 160 82 168 130 C172 150 170 172 158 172 Z';

  // ---------- Species ----------
  // Every species shares the round body, face, and accessory spots; each adds its own parts.
  // ears and tail are drawn behind the body, underFace on the body under the eyes, front over
  // the face, and arms (if a species has its own) in place of the usual little arms. Each takes
  // (stageIndex, palette); stage 0 is the egg and never gets here.

  // The mochi's round ears (from Little one on) and curly tail (Grown-up).
  const MOCHI_PARTS = {
    ears: (stageIndex, { soft, deep, outline }) =>
      stageIndex >= 2
        ? `<circle cx="58" cy="82" r="19" fill="${soft}" stroke="${outline}" stroke-width="3" />
           <circle cx="142" cy="82" r="19" fill="${soft}" stroke="${outline}" stroke-width="3" />
           <circle cx="58" cy="82" r="9" fill="${deep}" />
           <circle cx="142" cy="82" r="9" fill="${deep}" />`
        : '',
    tail: (stageIndex, { soft, outline }) =>
      stageIndex >= 3
        ? `<path d="M160 150 C184 150 188 124 174 120 C164 117 160 130 170 134" fill="none" stroke="${outline}" stroke-width="9" stroke-linecap="round" />
           <path d="M160 150 C184 150 188 124 174 120 C164 117 160 130 170 134" fill="none" stroke="${soft}" stroke-width="4" stroke-linecap="round" />`
        : '',
  };

  // The bunny's long ears grow each stage, and the right one flops over once it's grown up.
  // It gets a puff of a tail when grown, and a little pink nose.
  function bunnyEars(stageIndex, { light, outline, deep }) {
    const length = [0, 18, 26, 32][stageIndex];
    const ear = (x, tilt) => `<g transform="rotate(${tilt} ${x} 72)">
        <ellipse cx="${x}" cy="${72 - length}" rx="12" ry="${length + 6}" fill="${light}" stroke="${outline}" stroke-width="3" />
        <ellipse cx="${x}" cy="${74 - length}" rx="5.5" ry="${length - 2}" fill="${deep}" opacity="0.8" />
      </g>`;
    return ear(80, -10) + (stageIndex >= 3 ? ear(124, 62) : ear(120, 10));
  }

  const PINK_NOSE = `<ellipse cx="100" cy="125" rx="3.4" ry="2.4" fill="${BLUSH}" />`;

  const BUNNY_PARTS = {
    ears: bunnyEars,
    tail: (stageIndex, { light, outline }) =>
      stageIndex >= 3
        ? `<g fill="${light}" stroke="${outline}" stroke-width="2.5"><circle cx="168" cy="146" r="13" /><circle cx="160" cy="138" r="7" stroke="none" /></g>`
        : '',
    front: () => PINK_NOSE,
  };

  // The chick has a feather tuft that grows, a little orange beak and feet, and tail feathers when grown.
  const BEAK_ORANGE = '#ffb347';
  const BEAK_EDGE = '#e8912c';

  const CHICK_PARTS = {
    ears: (stageIndex, { soft, outline }) => {
      const height = [0, 16, 22, 28][stageIndex];
      const feather = (path) => `<path d="${path}" fill="none" stroke="${outline}" stroke-width="8" stroke-linecap="round" />
        <path d="${path}" fill="none" stroke="${soft}" stroke-width="3.5" stroke-linecap="round" />`;
      // Left of center, so the grown-up's daisy doesn't hide it.
      return feather(`M86 70 C82 ${62 - height} 72 ${58 - height} 70 ${64 - height}`) + feather(`M90 70 C90 ${58 - height} 96 ${52 - height} 101 ${56 - height}`);
    },
    tail: (stageIndex, { soft, outline }) =>
      stageIndex >= 3
        ? `<path d="M158 148 L182 134 L177 148 L186 154 L162 160 Z" fill="${soft}" stroke="${outline}" stroke-width="2.5" stroke-linejoin="round" />`
        : '',
    front: () => `<path d="M90 120 L110 120 L100 133 Z" fill="${BEAK_ORANGE}" stroke="${BEAK_EDGE}" stroke-width="2" stroke-linejoin="round" />`,
    feet: { fill: BEAK_ORANGE, stroke: BEAK_EDGE },
  };

  // The fox has pointed ears with dark tips that grow each stage, a white muzzle, a dark nose,
  // and a bushy white-tipped tail from Little one on.
  const FOX_DARK = '#5b4636';

  function foxEars(stageIndex, { light, outline, deep }) {
    const height = [0, 22, 30, 38][stageIndex];
    const ear = (flip) => {
      const x = (value) => (flip ? 200 - value : value);
      const apex = [60, 72 - height];
      const base = [[54, 94], [92, 70]];
      // The dark tip is the top third of the ear.
      const tip = base.map(([bx, by]) => [apex[0] + (bx - apex[0]) * 0.33, apex[1] + (by - apex[1]) * 0.33]);
      const points = (list) => list.map(([px, py]) => `${x(px)} ${py}`).join(' L');
      return `<path d="M${points([base[0], apex, base[1]])} Z" fill="${light}" stroke="${outline}" stroke-width="3" stroke-linejoin="round" />
        <path d="M${points([[62, 88], [apex[0] + 3, apex[1] + 12], [84, 74]])} Z" fill="${deep}" opacity="0.8" />
        <path d="M${points([tip[0], apex, tip[1]])} Z" fill="${FOX_DARK}" stroke="${FOX_DARK}" stroke-width="3" stroke-linejoin="round" />`;
    };
    return ear(false) + ear(true);
  }

  const FOX_PARTS = {
    ears: foxEars,
    tail: (stageIndex, { light, outline }) => {
      if (stageIndex < 2) {
        return '';
      }
      const size = stageIndex >= 3 ? 1 : 0.75;
      return `<g transform="translate(160 156) scale(${size}) translate(-160 -156)">
          <path d="M156 156 C190 154 200 118 186 96 C176 112 160 126 150 140 Z" fill="${light}" stroke="${outline}" stroke-width="3" stroke-linejoin="round" />
          <path d="M186 96 C196 110 194 122 189 128 C182 124 178 116 177 108 Z" fill="#fff" stroke="${outline}" stroke-width="2" stroke-linejoin="round" />
        </g>`;
    },
    underFace: () => `<ellipse cx="100" cy="133" rx="21" ry="13" fill="#fff" opacity="0.85" />`,
    front: () => `<ellipse cx="100" cy="125" rx="4.2" ry="3" fill="${FOX_DARK}" />`,
  };

  // The puppy has floppy ears hanging over the sides of its head that grow each stage, a patch
  // over one eye, a big dark nose, and a wagging tail from Little one on.
  const PUPPY_PARTS = {
    tail: (stageIndex, { soft, outline }) =>
      stageIndex >= 2
        ? `<path d="M160 146 C176 140 182 122 174 110" fill="none" stroke="${outline}" stroke-width="10" stroke-linecap="round" />
           <path d="M160 146 C176 140 182 122 174 110" fill="none" stroke="${soft}" stroke-width="5" stroke-linecap="round" />`
        : '',
    underFace: (stageIndex, { deep, outline }) => {
      const length = [0, 16, 20, 24][stageIndex];
      const ear = (x, tilt) =>
        `<ellipse cx="${x}" cy="${78 + length}" rx="13" ry="${length}" transform="rotate(${tilt} ${x} 78)" fill="${deep}" stroke="${outline}" stroke-width="3" />`;
      return `${ear(58, 18)}${ear(142, -18)}<ellipse cx="121" cy="115" rx="16" ry="15" fill="${deep}" opacity="0.45" />`;
    },
    front: () => `<ellipse cx="100" cy="125" rx="6" ry="4.2" fill="${INK}" /><ellipse cx="98" cy="123.5" rx="2" ry="1.2" fill="#fff" opacity="0.7" />`,
  };

  // The bear has small round ears high on its head that grow each stage, a round snout with a
  // dark nose (which the earless-at-first mochi doesn't have), and a stubby tail when grown.
  const BEAR_PARTS = {
    ears: (stageIndex, { soft, deep, outline }) => {
      const size = [0, 10, 12, 14][stageIndex];
      const ear = (x) => `<circle cx="${x}" cy="70" r="${size}" fill="${soft}" stroke="${outline}" stroke-width="3" />
        <circle cx="${x}" cy="70" r="${size / 2}" fill="${deep}" />`;
      return ear(68) + ear(132);
    },
    tail: (stageIndex, { soft, outline }) =>
      stageIndex >= 3 ? `<circle cx="166" cy="152" r="9" fill="${soft}" stroke="${outline}" stroke-width="2.5" />` : '',
    underFace: (stageIndex, { light, outline }) =>
      `<ellipse cx="100" cy="132" rx="19" ry="13" fill="${light}" stroke="${outline}" stroke-width="2" />`,
    front: () => `<ellipse cx="100" cy="125" rx="5.5" ry="3.8" fill="${INK}" />`,
  };

  // The penguin has a white face and tummy, a small orange beak and feet, and flippers in
  // place of arms. Unlike the chick, it has no tuft.
  const PENGUIN_PARTS = {
    underFace: () => `<g fill="#fff" opacity="0.88">
        <circle cx="83" cy="120" r="21" /><circle cx="117" cy="120" r="21" /><ellipse cx="100" cy="134" rx="26" ry="14" />
        <ellipse cx="100" cy="156" rx="34" ry="16" />
      </g>`,
    arms: (stageIndex, { deep, outline }) =>
      stageIndex >= 2
        ? `<ellipse cx="33" cy="136" rx="8" ry="21" transform="rotate(32 33 136)" fill="${deep}" stroke="${outline}" stroke-width="2.5" />
           <ellipse cx="167" cy="136" rx="8" ry="21" transform="rotate(-32 167 136)" fill="${deep}" stroke="${outline}" stroke-width="2.5" />`
        : '',
    front: () => `<path d="M94 122 L106 122 L100 129 Z" fill="${BEAK_ORANGE}" stroke="${BEAK_EDGE}" stroke-width="2" stroke-linejoin="round" />`,
    feet: { fill: BEAK_ORANGE, stroke: BEAK_EDGE },
  };

  // The hamster has puffy cheek pouches that fill out as it grows, tiny ears set low, and a
  // pink nose. Unlike the bear, it has no snout.
  const HAMSTER_PARTS = {
    ears: (stageIndex, { soft, deep, outline }) => {
      const size = [0, 8, 10, 11][stageIndex];
      const ear = (x) => `<circle cx="${x}" cy="78" r="${size}" fill="${soft}" stroke="${outline}" stroke-width="3" />
        <circle cx="${x}" cy="78" r="${size / 2}" fill="${BLUSH}" opacity="0.7" />`;
      return ear(62) + ear(138);
    },
    underFace: (stageIndex, { light, outline }) => {
      const puff = [0, 15, 18, 20][stageIndex];
      const cheek = (x) => `<ellipse cx="${x}" cy="136" rx="${puff}" ry="${puff - 3}" fill="${light}" stroke="${outline}" stroke-width="2" />`;
      return `${cheek(66)}${cheek(134)}<ellipse cx="100" cy="150" rx="24" ry="14" fill="#fff" opacity="0.6" />`;
    },
    front: () => PINK_NOSE,
  };

  // The hedgehog has a ring of soft spikes behind its body that grows each stage, a pale face
  // with tiny ears, and a little dark nose.
  function hedgehogSpikes(stageIndex, { deep, outline }) {
    const length = [0, 9, 13, 17][stageIndex];
    const spikeCount = 11;
    // The spikes follow the top of the body (an arc around its middle), from one side to the other.
    const pointAt = (angle, radius) => {
      const radians = (angle * Math.PI) / 180;
      return `${(100 + Math.cos(radians) * radius).toFixed(1)} ${(132 + Math.sin(radians) * radius).toFixed(1)}`;
    };
    const points = [];
    for (let index = 0; index <= spikeCount * 2; index += 1) {
      const angle = 195 + (150 * index) / (spikeCount * 2);
      points.push(pointAt(angle, index % 2 === 0 ? 66 : 70 + length));
    }
    return `<path d="M${pointAt(195, 50)} L${points.join(' L')} L${pointAt(345, 50)} Z" fill="${deep}" stroke="${outline}" stroke-width="3" stroke-linejoin="round" />`;
  }

  const HEDGEHOG_PARTS = {
    ears: hedgehogSpikes,
    underFace: (stageIndex, { light, soft, outline }) => `<ellipse cx="100" cy="124" rx="42" ry="32" fill="${light}" opacity="0.9" />
      <circle cx="70" cy="92" r="7" fill="${soft}" stroke="${outline}" stroke-width="2" />
      <circle cx="130" cy="92" r="7" fill="${soft}" stroke="${outline}" stroke-width="2" />`,
    front: () => `<ellipse cx="100" cy="125" rx="4.6" ry="3.4" fill="${INK}" />`,
  };

  // The mouse has big round ears high on its head that grow each stage, whiskers, a pink nose,
  // and a long thin tail from Little one on.
  const MOUSE_PARTS = {
    ears: (stageIndex, { soft, outline }) => {
      const size = [0, 14, 19, 23][stageIndex];
      const ear = (x) => `<circle cx="${x}" cy="68" r="${size}" fill="${soft}" stroke="${outline}" stroke-width="3" />
        <circle cx="${x}" cy="68" r="${size * 0.6}" fill="${BLUSH}" opacity="0.6" />`;
      return ear(64) + ear(136);
    },
    tail: (stageIndex, { outline }) =>
      stageIndex >= 2
        ? `<path d="M158 160 C186 162 192 136 178 128 C168 122 164 136 176 140" fill="none" stroke="${outline}" stroke-width="3.5" stroke-linecap="round" />`
        : '',
    front: (stageIndex, { outline }) => `${PINK_NOSE}
      <path d="M80 128 L58 124 M80 132 L58 134 M120 128 L142 124 M120 132 L142 134" fill="none" stroke="${outline}" stroke-width="1.8" stroke-linecap="round" />`,
  };

  const SPECIES_PARTS = {
    mochi: MOCHI_PARTS,
    bunny: BUNNY_PARTS,
    chick: CHICK_PARTS,
    fox: FOX_PARTS,
    puppy: PUPPY_PARTS,
    bear: BEAR_PARTS,
    penguin: PENGUIN_PARTS,
    hamster: HAMSTER_PARTS,
    hedgehog: HEDGEHOG_PARTS,
    mouse: MOUSE_PARTS,
  };

  function drawBlob(stageIndex, fillId, mood, wearing, palette, species) {
    const { outline, soft } = palette;
    const parts = SPECIES_PARTS[species] || MOCHI_PARTS;
    const part = (name) => (parts[name] ? parts[name](stageIndex, palette) : '');
    const feetColors = parts.feet || { fill: palette.feet, stroke: outline };
    const sleepy = mood === 'sleepy';
    // A head accessory or the nightcap takes the place of the eggshell and the daisy.
    const headCovered = sleepy || Boolean(wearing.head);
    const scale = [0, 0.72, 0.86, 1][stageIndex];
    const hasEars = stageIndex >= 2;
    const isGrown = stageIndex >= 3;
    const ears = part('ears');
    const tail = part('tail');
    const feet = hasEars
      ? `<ellipse cx="72" cy="172" rx="15" ry="7" fill="${feetColors.fill}" stroke="${feetColors.stroke}" stroke-width="2.5" />
         <ellipse cx="128" cy="172" rx="15" ry="7" fill="${feetColors.fill}" stroke="${feetColors.stroke}" stroke-width="2.5" />`
      : '';
    const usualArms = hasEars
      ? `<ellipse cx="36" cy="140" rx="9" ry="13" transform="rotate(20 36 140)" fill="${soft}" stroke="${outline}" stroke-width="2.5" />
         <ellipse cx="164" cy="140" rx="9" ry="13" transform="rotate(-20 164 140)" fill="${soft}" stroke="${outline}" stroke-width="2.5" />`
      : '';
    const arms = parts.arms ? part('arms') : usualArms;
    const shell =
      stageIndex === 1 && !headCovered
        ? `<path d="M70 74 L80 63 L90 73 L100 61 L110 73 L120 63 L130 74 C130 46 70 46 70 74 Z" fill="#fff7e8" stroke="#ecd3a8" stroke-width="2.5" stroke-linejoin="round" />
           <circle cx="88" cy="58" r="4" fill="#ffc8dc" /><circle cx="112" cy="55" r="3" fill="#c3ecd8" />`
        : '';
    const daisy = isGrown && !headCovered
      ? `<path d="M100 62 C100 52 102 46 104 40" fill="none" stroke="#6cbf8a" stroke-width="3.5" stroke-linecap="round" />
         <ellipse cx="94" cy="52" rx="7" ry="4" transform="rotate(30 94 52)" fill="#86d4a2" />
         <g transform="translate(105 34)">
           <circle cx="0" cy="-7" r="6" fill="#fff" /><circle cx="7" cy="-2" r="6" fill="#fff" />
           <circle cx="4" cy="6" r="6" fill="#fff" /><circle cx="-4" cy="6" r="6" fill="#fff" />
           <circle cx="-7" cy="-2" r="6" fill="#fff" /><circle cx="0" cy="0" r="4.5" fill="#ffd166" />
         </g>`
      : '';
    return `<g transform="translate(100 172) scale(${scale}) translate(-100 -172)">
        <g class="buddy-body">
          ${tail}${ears}${feet}
          <path d="${BODY_PATH}" fill="url(#${fillId})" stroke="${outline}" stroke-width="3" />
          <ellipse cx="68" cy="88" rx="13" ry="7" transform="rotate(-32 68 88)" fill="#fff" opacity="0.65" />
          ${part('underFace')}${arms}${face(mood)}${part('front')}${shell}${daisy}${drawAccessories(wearing, false, sleepy)}${sleepy ? NIGHTCAP : ''}
          ${moodExtras(mood, false)}
        </g>
        ${sleepy ? zzz(160, 62) : ''}
      </g>`;
  }

  function drawSparkles() {
    const star = (x, y, size, delay) =>
      `<path class="buddy-sparkle" style="animation-delay:${delay}s" d="M${x} ${y - size} Q${x} ${y} ${x + size} ${y} Q${x} ${y} ${x} ${y + size} Q${x} ${y} ${x - size} ${y} Q${x} ${y} ${x} ${y - size} Z" fill="#ffd166" />`;
    return star(30, 60, 9, 0) + star(172, 70, 7, 0.8) + star(176, 30, 5, 1.6) + star(22, 110, 5, 2.2);
  }

  // An SVG of the buddy at a stage, in a mood, wearing accessories ({ spot: id }), in a color,
  // as a species. Every species hatches from the same egg.
  // The egg cracks once it's over halfway to hatching.
  function drawBuddy(stageIndex, progress = 0, mood = 'content', wearing = {}, color = 'pink', species = 'mochi') {
    drawingCount += 1;
    const fillId = `buddy-fill-${drawingCount}`;
    const palette = PALETTES[color] || PALETTES.pink;
    const art = stageIndex === 0 ? drawEgg(progress >= 0.5, fillId, mood, wearing, palette) : drawBlob(stageIndex, fillId, mood, wearing, palette, species);
    const [light, dark] = stageIndex === 0 ? palette.egg : [palette.light, palette.dark];
    return `<svg class="buddy-art buddy-mood-${mood}" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="${fillId}" cx="0.38" cy="0.3" r="0.85">
            <stop offset="0" stop-color="${light}" /><stop offset="1" stop-color="${dark}" />
          </radialGradient>
        </defs>
        <ellipse cx="100" cy="182" rx="${stageIndex === 0 ? 50 : 30 + stageIndex * 14}" ry="7" fill="#000" opacity="0.08" />
        ${stageIndex === 3 && mood !== 'sleepy' ? drawSparkles() : ''}
        ${art}
      </svg>`;
  }

  return {
    ON_TIME_POINTS,
    LATE_POINTS,
    MISSED_POINTS,
    STAGES,
    STREAK_MILESTONES,
    ACCESSORY_SPOTS,
    ACCESSORIES,
    COLORS,
    SPECIES,
    newBuddy,
    startBuddy,
    speciesChoices,
    usedSpecies,
    fillInSpecies,
    moveToSemesterBuddies,
    forSemester,
    isUnlocked,
    wornAccessories,
    toggleAccessory,
    streakFor,
    chestFor,
    openChest,
    pointsLog,
    totalPoints,
    pointsForCheckingOff,
    recordCheckOff,
    stageFor,
    moodFor,
    validateName,
    displayName,
    challengeFor,
    encodeChallenge,
    readChallenge,
    challengePercent,
    compareChallenges,
    drawBuddy,
    drawAccessory,
  };
})();

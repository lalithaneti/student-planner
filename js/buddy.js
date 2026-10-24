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

  // Only work due on or after startDate counts, so things missed before the buddy
  // existed don't count against it. wearing maps a spot to an accessory id.
  function newBuddy(todayKey) {
    return { name: '', startDate: todayKey, lateDone: [], wearing: {} };
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

  // Every assignment date in every semester, so switching semesters doesn't change points.
  function allItems(state) {
    return state.semesters.flatMap((semester) => PlannerModel.buildDueList({ ...state, currentSemesterId: semester.id }));
  }

  // Assignment dates since the buddy started, oldest first.
  function countedItems(state) {
    return allItems(state)
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
    for (let date = state.buddy.startDate; date <= todayKey; date = PlannerModel.addDays(date, 1)) {
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

  // ---------- Drawing ----------

  const INK = '#4a2e44';
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

  function drawEgg(cracked, fillId, mood, wearing) {
    const crack = cracked
      ? `<path d="M58 98 L70 108 L80 96 L92 110 L103 97 L114 109 L126 96 L140 104" fill="none" stroke="#c9a46e" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" />`
      : '';
    return `<g class="buddy-body buddy-egg">
        <path d="M100 38 C142 38 162 108 160 136 C158 166 134 180 100 180 C66 180 42 166 40 136 C38 108 58 38 100 38 Z"
          fill="url(#${fillId})" stroke="#ecd3a8" stroke-width="3" />
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

  function drawBlob(stageIndex, fillId, mood, wearing) {
    const sleepy = mood === 'sleepy';
    // A head accessory or the nightcap takes the place of the eggshell and the daisy.
    const headCovered = sleepy || Boolean(wearing.head);
    const scale = [0, 0.72, 0.86, 1][stageIndex];
    const hasEars = stageIndex >= 2;
    const isGrown = stageIndex >= 3;
    const ears = hasEars
      ? `<circle cx="58" cy="82" r="19" fill="#ffc6da" stroke="#f29bbb" stroke-width="3" />
         <circle cx="142" cy="82" r="19" fill="#ffc6da" stroke="#f29bbb" stroke-width="3" />
         <circle cx="58" cy="82" r="9" fill="#ff9ebd" />
         <circle cx="142" cy="82" r="9" fill="#ff9ebd" />`
      : '';
    const tail = isGrown
      ? `<path d="M160 150 C184 150 188 124 174 120 C164 117 160 130 170 134" fill="none" stroke="#f29bbb" stroke-width="9" stroke-linecap="round" />
         <path d="M160 150 C184 150 188 124 174 120 C164 117 160 130 170 134" fill="none" stroke="#ffc6da" stroke-width="4" stroke-linecap="round" />`
      : '';
    const feet = hasEars
      ? `<ellipse cx="72" cy="172" rx="15" ry="7" fill="#ffb3cd" stroke="#f29bbb" stroke-width="2.5" />
         <ellipse cx="128" cy="172" rx="15" ry="7" fill="#ffb3cd" stroke="#f29bbb" stroke-width="2.5" />`
      : '';
    const arms = hasEars
      ? `<ellipse cx="36" cy="140" rx="9" ry="13" transform="rotate(20 36 140)" fill="#ffc6da" stroke="#f29bbb" stroke-width="2.5" />
         <ellipse cx="164" cy="140" rx="9" ry="13" transform="rotate(-20 164 140)" fill="#ffc6da" stroke="#f29bbb" stroke-width="2.5" />`
      : '';
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
          <path d="${BODY_PATH}" fill="url(#${fillId})" stroke="#f29bbb" stroke-width="3" />
          <ellipse cx="68" cy="88" rx="13" ry="7" transform="rotate(-32 68 88)" fill="#fff" opacity="0.65" />
          ${arms}${face(mood)}${shell}${daisy}${drawAccessories(wearing, false, sleepy)}${sleepy ? NIGHTCAP : ''}
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

  // An SVG of the buddy at a stage, in a mood, wearing accessories ({ spot: id }).
  // The egg cracks once it's over halfway to hatching.
  function drawBuddy(stageIndex, progress = 0, mood = 'content', wearing = {}) {
    drawingCount += 1;
    const fillId = `buddy-fill-${drawingCount}`;
    const art = stageIndex === 0 ? drawEgg(progress >= 0.5, fillId, mood, wearing) : drawBlob(stageIndex, fillId, mood, wearing);
    const [light, dark] = stageIndex === 0 ? ['#fffdf7', '#ffe8c4'] : ['#fff0f6', '#ffbcd3'];
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
    newBuddy,
    isUnlocked,
    wornAccessories,
    toggleAccessory,
    streakFor,
    pointsLog,
    totalPoints,
    pointsForCheckingOff,
    recordCheckOff,
    stageFor,
    moodFor,
    validateName,
    displayName,
    drawBuddy,
    drawAccessory,
  };
})();

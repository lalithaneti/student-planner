// Stickers: little drawings for the sticker book, in the same soft style as the buddies.
// Each is drawn on a 100 by 100 canvas. The white die-cut edge comes from styles.css.

const PlannerStickers = (() => {
  const INK = '#4a2e44';

  // The sleepy-sweet face most stickers share, centered on (x, y).
  function stickerFace(x, y) {
    return `<circle cx="${x - 8}" cy="${y}" r="2.6" fill="${INK}" />
      <circle cx="${x + 8}" cy="${y}" r="2.6" fill="${INK}" />
      <path d="M${x - 3.5} ${y + 3} Q${x} ${y + 7} ${x + 3.5} ${y + 3}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" />
      <ellipse cx="${x - 14}" cy="${y + 5}" rx="4" ry="2.6" fill="#ff9eb5" opacity="0.65" />
      <ellipse cx="${x + 14}" cy="${y + 5}" rx="4" ry="2.6" fill="#ff9eb5" opacity="0.65" />`;
  }

  const STICKERS = [
    {
      id: 'pencil',
      name: 'Pencil',
      group: 'School life',
      art: `<g transform="rotate(18 50 50)">
          <rect x="34" y="8" width="32" height="16" rx="7" fill="#ffb3c7" stroke="#e58aa5" stroke-width="3" />
          <rect x="34" y="20" width="32" height="9" fill="#d7dce5" stroke="#a9b1c0" stroke-width="3" />
          <path d="M34 29 H66 V70 L50 95 L34 70 Z" fill="#ffd97a" stroke="#e0ad3f" stroke-width="3" stroke-linejoin="round" />
          <path d="M34 70 H66 L50 95 Z" fill="#f6dcb8" stroke="#e0ad3f" stroke-width="3" stroke-linejoin="round" />
          <path d="M44.5 86.5 H55.5 L50 95 Z" fill="${INK}" stroke="${INK}" stroke-width="2" stroke-linejoin="round" />
          ${stickerFace(50, 48)}
        </g>`,
    },
    {
      id: 'coffee',
      name: 'Coffee',
      group: 'School life',
      art: `<path d="M38 24 C33 18 43 14 38 7 M54 24 C49 18 59 14 54 7" fill="none" stroke="#d9c6bb" stroke-width="4" stroke-linecap="round" />
        <path d="M70 46 C90 42 90 72 68 70" fill="none" stroke="#e2b7a0" stroke-width="7" stroke-linecap="round" />
        <path d="M20 32 H74 V74 C74 86 66 92 56 92 H38 C28 92 20 86 20 74 Z" fill="#fff5ec" stroke="#e2b7a0" stroke-width="3" stroke-linejoin="round" />
        <ellipse cx="47" cy="33" rx="27" ry="7" fill="#9c6a4c" stroke="#e2b7a0" stroke-width="3" />
        ${stickerFace(47, 60)}`,
    },
    {
      id: 'a-plus',
      name: 'A+ paper',
      group: 'School life',
      art: `<g transform="rotate(-6 50 50)">
          <path d="M20 8 H64 L80 24 V88 C80 91 78 92 76 92 H24 C22 92 20 91 20 88 Z" fill="#fffdf8" stroke="#d8cfc4" stroke-width="3" stroke-linejoin="round" />
          <path d="M64 8 V24 H80 Z" fill="#ece4d8" stroke="#d8cfc4" stroke-width="3" stroke-linejoin="round" />
          <text x="46" y="50" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700" fill="#f2637e">A+</text>
          ${stickerFace(50, 68)}
        </g>`,
    },
    {
      id: 'backpack',
      name: 'Backpack',
      group: 'School life',
      art: `<path d="M38 22 C38 4 62 4 62 22" fill="none" stroke="#7f95d8" stroke-width="6" stroke-linecap="round" />
        <rect x="9" y="42" width="14" height="36" rx="7" fill="#90a6e6" stroke="#7f95d8" stroke-width="3" />
        <rect x="77" y="42" width="14" height="36" rx="7" fill="#90a6e6" stroke="#7f95d8" stroke-width="3" />
        <rect x="18" y="18" width="64" height="76" rx="20" fill="#aebff2" stroke="#7f95d8" stroke-width="3" />
        <rect x="28" y="62" width="44" height="25" rx="8" fill="#c8d4f8" stroke="#7f95d8" stroke-width="3" />
        <path d="M34 71 H66" stroke="#7f95d8" stroke-width="2.5" stroke-linecap="round" />
        <rect x="46" y="70" width="8" height="8" rx="2" fill="#ffd166" stroke="#d99a1f" stroke-width="1.5" />
        ${stickerFace(50, 42)}`,
    },
    {
      id: 'laptop',
      name: 'Laptop',
      group: 'School life',
      art: `<rect x="16" y="14" width="68" height="52" rx="7" fill="#c9cfdc" stroke="#99a2b5" stroke-width="3" />
        <rect x="23" y="21" width="54" height="38" rx="3" fill="#dcf0ff" stroke="#99a2b5" stroke-width="2" />
        <path d="M16 66 H84 L95 82 C96 85 94 87 91 87 H9 C6 87 4 85 5 82 Z" fill="#dde1ea" stroke="#99a2b5" stroke-width="3" stroke-linejoin="round" />
        <path d="M40 79 H60" stroke="#99a2b5" stroke-width="3" stroke-linecap="round" />
        ${stickerFace(50, 38)}`,
    },
    {
      id: 'calculator',
      name: 'Calculator',
      group: 'School life',
      art: `<rect x="20" y="5" width="60" height="90" rx="10" fill="#b5e3cf" stroke="#7fc0a3" stroke-width="3" />
        <rect x="27" y="12" width="46" height="28" rx="5" fill="#f4fff4" stroke="#7fc0a3" stroke-width="2.5" />
        ${stickerFace(50, 24)}
        <g fill="#fff" stroke="#7fc0a3" stroke-width="2">
          <rect x="27" y="47" width="12" height="11" rx="3" /><rect x="44" y="47" width="12" height="11" rx="3" />
          <rect x="27" y="62" width="12" height="11" rx="3" /><rect x="44" y="62" width="12" height="11" rx="3" />
          <rect x="27" y="77" width="12" height="11" rx="3" /><rect x="44" y="77" width="12" height="11" rx="3" />
        </g>
        <g fill="#ffb3c7" stroke="#e58aa5" stroke-width="2">
          <rect x="61" y="47" width="12" height="11" rx="3" /><rect x="61" y="62" width="12" height="26" rx="3" />
        </g>`,
    },
    {
      id: 'boba',
      name: 'Boba',
      group: 'Snacks',
      art: `<path d="M58 28 L68 5" stroke="#ff9ebd" stroke-width="7" stroke-linecap="round" />
        <path d="M26 32 H74 L67 90 C66 94 63 96 60 96 H40 C37 96 34 94 33 90 Z" fill="#f0d3ad" stroke="#d3a878" stroke-width="3" stroke-linejoin="round" />
        <path d="M24 32 C24 14 76 14 76 32 Z" fill="#fff" fill-opacity="0.75" stroke="#d3a878" stroke-width="3" stroke-linejoin="round" />
        <rect x="21" y="29" width="58" height="7" rx="3.5" fill="#fff" stroke="#d3a878" stroke-width="3" />
        <g fill="#5a3a4a">
          <circle cx="40" cy="87" r="4.5" /><circle cx="50" cy="89" r="4.5" /><circle cx="60" cy="87" r="4.5" />
          <circle cx="45" cy="79" r="4.5" /><circle cx="55" cy="79" r="4.5" />
        </g>
        ${stickerFace(50, 55)}`,
    },
    {
      id: 'strawberry',
      name: 'Strawberry',
      group: 'Snacks',
      art: `<path d="M50 94 C24 82 10 58 14 40 C17 26 36 24 50 28 C64 24 83 26 86 40 C90 58 76 82 50 94 Z" fill="#ff8a9c" stroke="#e8637b" stroke-width="3" stroke-linejoin="round" />
        <path d="M50 30 C42 34 30 34 24 26 C30 24 32 20 30 15 C38 15 43 17 45 21 C46 16 48 11 50 8 C52 11 54 16 55 21 C57 17 62 15 70 15 C68 20 70 24 76 26 C70 34 58 34 50 30 Z" fill="#9ddc8f" stroke="#6fb864" stroke-width="3" stroke-linejoin="round" />
        <g fill="#ffe9a8">
          <ellipse cx="28" cy="46" rx="1.8" ry="2.6" /><ellipse cx="72" cy="46" rx="1.8" ry="2.6" />
          <ellipse cx="36" cy="72" rx="1.8" ry="2.6" /><ellipse cx="64" cy="72" rx="1.8" ry="2.6" />
          <ellipse cx="50" cy="82" rx="1.8" ry="2.6" /><ellipse cx="50" cy="42" rx="1.8" ry="2.6" />
        </g>
        ${stickerFace(50, 56)}`,
    },
    {
      id: 'donut',
      name: 'Donut',
      group: 'Snacks',
      art: `<path fill-rule="evenodd" d="M50 7 A43 43 0 1 1 49.9 7 Z M50 26 A9 9 0 1 0 50.1 26 Z" fill="#e8b98a" stroke="#c98f5c" stroke-width="3" />
        <path fill-rule="evenodd" d="M50 11 C62 9 74 14 81 25 C88 34 89 46 85 56 C82 64 74 62 68 68 C62 74 56 79 48 76 C40 73 33 77 26 71 C18 64 12 56 12 45 C12 33 20 21 31 15 C37 12 44 12 50 11 Z M50 26 A9 9 0 1 0 50.1 26 Z" fill="#ffa9c4" stroke="#ef86a8" stroke-width="2" />
        <g stroke-width="3" stroke-linecap="round">
          <path d="M28 28 L32 32" stroke="#fff3b0" /><path d="M70 22 L66 27" stroke="#b6e3ff" />
          <path d="M77 42 L72 43" stroke="#fff" /><path d="M23 46 L27 42" stroke="#b6e3ff" />
        </g>
        <circle cx="50" cy="33" r="13" fill="#fff" stroke="#ef86a8" stroke-width="2.5" />
        ${stickerFace(50, 62)}`,
    },
    {
      id: 'onigiri',
      name: 'Onigiri',
      group: 'Snacks',
      art: `<path d="M50 7 C60 7 94 62 94 77 C94 90 82 93 70 93 H30 C18 93 6 90 6 77 C6 62 40 7 50 7 Z" fill="#fffdf8" stroke="#d6d0c6" stroke-width="3" stroke-linejoin="round" />
        <path d="M32 72 H68 V93 H32 Z" fill="#3f5350" stroke="#2f403e" stroke-width="2.5" stroke-linejoin="round" />
        ${stickerFace(50, 50)}`,
    },
    {
      id: 'ramen',
      name: 'Ramen bowl',
      group: 'Snacks',
      art: `<path d="M34 24 C30 18 38 14 34 7 M50 24 C46 18 54 14 50 7" fill="none" stroke="#d9c6bb" stroke-width="4" stroke-linecap="round" />
        <path d="M60 36 L90 8 M68 38 L96 14" stroke="#c98f5c" stroke-width="4" stroke-linecap="round" />
        <ellipse cx="50" cy="42" rx="42" ry="13" fill="#ffe3a8" stroke="#e8807f" stroke-width="3" />
        <path d="M24 42 C29 36 33 48 38 42 C43 36 47 48 52 42" fill="none" stroke="#f2c14e" stroke-width="3.5" stroke-linecap="round" />
        <circle cx="66" cy="42" r="7" fill="#fff" stroke="#e8d3a0" stroke-width="2" />
        <circle cx="66" cy="42" r="3.5" fill="#ffb84d" />
        <path d="M8 44 C10 68 24 88 38 88 H62 C76 88 90 68 92 44 C80 58 20 58 8 44 Z" fill="#ff9d9a" stroke="#e8807f" stroke-width="3" stroke-linejoin="round" />
        <rect x="36" y="86" width="28" height="7" rx="3" fill="#ff9d9a" stroke="#e8807f" stroke-width="3" />
        ${stickerFace(50, 68)}`,
    },
    {
      id: 'popcorn',
      name: 'Popcorn',
      group: 'Snacks',
      art: `<g fill="#fff6d6" stroke="#e8c978" stroke-width="2.5">
          <circle cx="50" cy="15" r="11" /><circle cx="31" cy="23" r="11" /><circle cx="69" cy="23" r="11" />
          <circle cx="40" cy="30" r="11" /><circle cx="60" cy="30" r="11" /><circle cx="22" cy="34" r="9" /><circle cx="78" cy="34" r="9" />
        </g>
        <path d="M18 38 H82 L72 94 H28 Z" fill="#fff" stroke="#e8637b" stroke-width="3" stroke-linejoin="round" />
        <g fill="#ff8a9c">
          <path d="M29 38 H40 L43 94 H36 Z" /><path d="M60 38 H71 L64 94 H57 Z" />
        </g>
        <path d="M18 38 H82 L72 94 H28 Z" fill="none" stroke="#e8637b" stroke-width="3" stroke-linejoin="round" />
        <rect x="27" y="52" width="46" height="24" rx="10" fill="#fff" stroke="#e8637b" stroke-width="2" />
        ${stickerFace(50, 61)}`,
    },
    {
      id: 'leaf',
      name: 'Autumn leaf',
      group: 'Nature',
      art: `<path d="M50 72 V96" stroke="#b5683a" stroke-width="5" stroke-linecap="round" />
        <path d="M50 5 L60 24 L72 17 L69 37 L88 33 L80 49 L92 57 L66 68 L68 79 L50 75 L32 79 L34 68 L8 57 L20 49 L12 33 L31 37 L28 17 L40 24 Z" fill="#ffb066" stroke="#e58a3f" stroke-width="3" stroke-linejoin="round" />
        ${stickerFace(50, 46)}`,
    },
    {
      id: 'mushroom',
      name: 'Mushroom',
      group: 'Nature',
      art: `<path d="M34 54 H66 C66 70 70 82 68 88 C66 94 34 94 32 88 C30 82 34 70 34 54 Z" fill="#fff4e3" stroke="#e0c5a0" stroke-width="3" stroke-linejoin="round" />
        <path d="M10 54 C10 8 90 8 90 54 C90 62 10 62 10 54 Z" fill="#ff8f8f" stroke="#e56a6a" stroke-width="3" stroke-linejoin="round" />
        <g fill="#fff6f0">
          <circle cx="32" cy="36" r="7" /><circle cx="56" cy="26" r="8" /><circle cx="74" cy="42" r="5.5" /><circle cx="48" cy="47" r="4" />
        </g>
        ${stickerFace(50, 72)}`,
    },
    {
      id: 'cherry-blossom',
      name: 'Cherry blossom',
      group: 'Nature',
      art: `${[0, 72, 144, 216, 288]
        .map(
          (angle) => `<path transform="rotate(${angle} 50 52)" d="M50 52 C26 40 26 14 42 7 L50 16 L58 7 C74 14 74 40 50 52 Z" fill="#ffc4d8" stroke="#f093b3" stroke-width="3" stroke-linejoin="round" />`,
        )
        .join('')}
        <circle cx="50" cy="52" r="20" fill="#fff1f6" stroke="#f093b3" stroke-width="2" />
        ${stickerFace(50, 50)}`,
    },
    {
      id: 'snowflake',
      name: 'Snowflake',
      group: 'Nature',
      art: `<g fill="none" stroke="#8fc7f0" stroke-width="6" stroke-linecap="round">
          ${[0, 60, 120, 180, 240, 300]
            .map((angle) => `<path transform="rotate(${angle} 50 50)" d="M50 50 V7 M50 20 L40 10 M50 20 L60 10" />`)
            .join('')}
        </g>
        <circle cx="50" cy="50" r="21" fill="#eef8ff" stroke="#8fc7f0" stroke-width="3" />
        ${stickerFace(50, 48)}`,
    },
    {
      id: 'cactus',
      name: 'Cactus',
      group: 'Nature',
      art: `<path d="M34 50 H22 C16 50 13 46 13 40 V30" fill="none" stroke="#6fb864" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M34 50 H22 C16 50 13 46 13 40 V30" fill="none" stroke="#a3dc95" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M66 58 H78 C84 58 87 54 87 48 V38" fill="none" stroke="#6fb864" stroke-width="15" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M66 58 H78 C84 58 87 54 87 48 V38" fill="none" stroke="#a3dc95" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M30 76 V28 C30 2 70 2 70 28 V76 Z" fill="#a3dc95" stroke="#6fb864" stroke-width="3" stroke-linejoin="round" />
        <circle cx="50" cy="9" r="5" fill="#ffb3c7" stroke="#e58aa5" stroke-width="2" />
        <path d="M24 72 H76 L70 95 H30 Z" fill="#f0a77a" stroke="#cf8152" stroke-width="3" stroke-linejoin="round" />
        <rect x="20" y="68" width="60" height="10" rx="4" fill="#f7bc94" stroke="#cf8152" stroke-width="3" />
        ${stickerFace(50, 40)}`,
    },
    {
      id: 'cloud',
      name: 'Cloud',
      group: 'Nature',
      art: `<path d="M26 80 C10 80 3 68 6 57 C9 46 20 42 27 45 C28 30 42 21 55 25 C66 28 72 37 72 45 C84 42 96 50 96 63 C96 74 87 80 76 80 Z" fill="#f4faff" stroke="#a9cdec" stroke-width="3" stroke-linejoin="round" />
        ${stickerFace(50, 57)}`,
    },
  ];

  // Small hands, drawn over the buddy's body so it looks like they're holding a prop.
  function holdingHands(leftX, rightX, y, color, outline) {
    return [leftX, rightX]
      .map((x) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="9" fill="${color}" stroke="${outline}" stroke-width="2.5" />`)
      .join('');
  }

  const SPARKLE = 'M0 -10 C1 -3 3 -1 10 0 C3 1 1 3 0 10 C-1 3 -3 1 -10 0 C-3 -1 -1 -3 0 -10 Z';

  function drawSparkle(x, y, size) {
    return `<path transform="translate(${x} ${y}) scale(${size})" d="${SPARKLE}" fill="#fff8d6" stroke="#e8b93f" stroke-width="1.2" stroke-linejoin="round" />`;
  }

  // Rare stickers: a grown-up buddy doing something, on a shiny rainbow circle.
  const RARE_STICKERS = [
    {
      id: 'rare-bunny-phone',
      name: 'Bunny',
      group: 'Rare',
      rare: true,
      species: 'bunny',
      color: 'lavender',
      prop: `<rect x="84" y="144" width="32" height="42" rx="7" fill="#5f6f96" stroke="#46527a" stroke-width="3" />
        <circle cx="93" cy="152" r="3.5" fill="#2f3a5c" />
        <path d="M100 174 C92 167 94 162 100 166 C106 162 108 167 100 174 Z" fill="#ffb3c7" />
        ${holdingHands(82, 118, 170, '#ddd2ff', '#ab97ea')}
        <g transform="translate(150 66)">
          <path d="M-20 -14 H20 C24 -14 26 -12 26 -8 V8 C26 12 24 14 20 14 H-6 L-16 24 L-14 14 H-20 C-24 14 -26 12 -26 8 V-8 C-26 -12 -24 -14 -20 -14 Z" fill="#fff" stroke="#c7bdeb" stroke-width="2.5" stroke-linejoin="round" />
          <path d="M0 8 C-11 -1 -7 -9 0 -4 C7 -9 11 -1 0 8 Z" fill="#ff8fa8" />
        </g>`,
    },
    {
      id: 'rare-fox-book',
      name: 'Fox',
      group: 'Rare',
      rare: true,
      species: 'fox',
      color: 'peach',
      prop: `<g fill="none" stroke="#6b4a3a" stroke-width="3.5">
          <circle cx="78" cy="108" r="15" fill="#fff" fill-opacity="0.25" />
          <circle cx="122" cy="108" r="15" fill="#fff" fill-opacity="0.25" />
          <path d="M93 106 Q100 101 107 106" />
        </g>
        <path d="M100 150 C88 142 72 142 58 146 V182 C72 178 88 178 100 186 C112 178 128 178 142 182 V146 C128 142 112 142 100 150 Z" fill="#8fb4ea" stroke="#6588c4" stroke-width="3" stroke-linejoin="round" />
        <path d="M100 150 V186" stroke="#6588c4" stroke-width="3" />
        <path d="M79 153 l2.5 5.5 6 0.6 -4.5 4 1.3 5.9 -5.3 -3 -5.3 3 1.3 -5.9 -4.5 -4 6 -0.6 Z" fill="#ffd166" />
        ${holdingHands(58, 142, 166, '#ffd9bf', '#f0a77a')}`,
    },
    {
      id: 'rare-chick-graduate',
      name: 'Chick',
      group: 'Rare',
      rare: true,
      species: 'chick',
      color: 'lemon',
      wearing: { head: 'graduation-cap' },
      prop: `<g transform="rotate(-8 100 164)">
          <rect x="62" y="150" width="76" height="26" rx="13" fill="#fff" stroke="#b08d4f" stroke-width="3" />
          <ellipse cx="136" cy="163" rx="5" ry="11" fill="#f2e5c8" stroke="#b08d4f" stroke-width="2.5" />
          <rect x="93" y="148" width="14" height="30" rx="3" fill="#ff8fa8" stroke="#e8637b" stroke-width="2.5" />
        </g>
        ${holdingHands(72, 122, 168, '#fff3b8', '#e0c252')}`,
    },
    {
      id: 'rare-penguin-boba',
      name: 'Penguin',
      group: 'Rare',
      rare: true,
      species: 'penguin',
      color: 'sky',
      prop: `<path d="M120 146 L144 112" stroke="#ff9ebd" stroke-width="8" stroke-linecap="round" />
        <path d="M70 148 H130 L123 188 C122 192 120 194 116 194 H84 C80 194 78 192 77 188 Z" fill="#f0d3ad" stroke="#d3a878" stroke-width="3" stroke-linejoin="round" />
        <rect x="66" y="141" width="68" height="9" rx="4.5" fill="#fff" stroke="#d3a878" stroke-width="3" />
        <g fill="#5a3a4a">
          <circle cx="88" cy="184" r="5" /><circle cx="100" cy="186" r="5" /><circle cx="112" cy="184" r="5" />
          <circle cx="94" cy="175" r="5" /><circle cx="106" cy="175" r="5" />
        </g>
        ${holdingHands(70, 130, 166, '#cbe7ff', '#86bfe8')}`,
    },
    {
      id: 'rare-hedgehog-sleeping',
      name: 'Hedgehog',
      group: 'Rare',
      rare: true,
      species: 'hedgehog',
      color: 'pink',
      mood: 'sleepy',
      // Smaller and higher than usual, so it sits on top of the books.
      buddyPlace: { x: 24, y: -2, size: 152 },
      prop: `<rect x="40" y="128" width="120" height="20" rx="4" fill="#8fb4ea" stroke="#6588c4" stroke-width="3" />
        <path d="M52 128 V148 M148 128 V148" stroke="#ffd166" stroke-width="4" />
        <rect x="30" y="148" width="132" height="20" rx="4" fill="#a3dc95" stroke="#6fb864" stroke-width="3" />
        <path d="M150 151 H162 V165 H150 Z" fill="#fff8e8" stroke="#6fb864" stroke-width="2" />
        <rect x="42" y="168" width="116" height="20" rx="4" fill="#ffb3a0" stroke="#e58a75" stroke-width="3" />
        <path d="M54 168 V188 M146 168 V188" stroke="#fff" stroke-width="4" />`,
    },
    {
      id: 'rare-puppy-homework',
      name: 'Puppy',
      group: 'Rare',
      rare: true,
      species: 'puppy',
      color: 'mint',
      prop: `<g transform="rotate(-5 100 158)">
          <path d="M76 134 L84 140 L92 133 L100 140 L108 133 L116 140 L124 134 V184 H76 Z" fill="#fffdf8" stroke="#b9ad98" stroke-width="3" stroke-linejoin="round" />
          <text x="100" y="163" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="700" fill="#f2637e">HW</text>
          <path d="M84 172 H116" stroke="#c9beab" stroke-width="3" stroke-linecap="round" />
        </g>
        <g fill="#fffdf8" stroke="#b9ad98" stroke-width="2" stroke-linejoin="round">
          <path d="M34 158 L44 154 L46 164 L36 167 Z" />
          <path d="M150 158 L160 156 L160 166 L151 167 Z" />
        </g>
        ${holdingHands(70, 130, 172, '#c6f0da', '#7fcfa6')}`,
    },
  ];

  function drawRareSticker(sticker) {
    const { x, y, size } = sticker.buddyPlace || { x: 4, y: 4, size: 192 };
    const buddy = PlannerBuddy.drawBuddy(3, 0, sticker.mood || 'happy', sticker.wearing || {}, sticker.color, sticker.species).replace(
      /<svg [^>]*>/,
      `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 200 200">`,
    );
    const shineId = `sticker-shine-${sticker.id}`;
    return `<svg class="sticker-art is-rare" viewBox="-8 -8 216 216" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="${shineId}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#ffd6e6" /><stop offset="0.25" stop-color="#fff0b8" />
            <stop offset="0.5" stop-color="#c9f5dc" /><stop offset="0.75" stop-color="#c7e4ff" />
            <stop offset="1" stop-color="#e3d2ff" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="100" fill="url(#${shineId})" stroke="#e8b93f" stroke-width="4" />
        <path d="M34 150 L150 34 L176 60 L60 176 Z" fill="#fff" opacity="0.35" />
        ${buddy}
        <svg x="4" y="4" width="192" height="192" viewBox="0 0 200 200">${sticker.prop}</svg>
        ${drawSparkle(30, 44, 1.2)}${drawSparkle(176, 128, 1)}${drawSparkle(22, 142, 0.8)}
      </svg>`;
  }

  function drawSticker(sticker) {
    if (sticker.rare) {
      return drawRareSticker(sticker);
    }
    return `<svg class="sticker-art" viewBox="-4 -4 108 108" aria-hidden="true" focusable="false">${sticker.art}</svg>`;
  }

  // ---------- The sticker book ----------
  // One book for every semester: state.stickerBook.found lists each sticker found, with the
  // chest (semester and week) it came from. Each chest gives one sticker, never a duplicate.

  // About one chest in this many gives a rare sticker, while any are left to find.
  const RARE_CHANCE = 6;

  function findSticker(id) {
    return [...STICKERS, ...RARE_STICKERS].find((sticker) => sticker.id === id) || null;
  }

  function foundStickers(state) {
    return (state.stickerBook && state.stickerBook.found) || [];
  }

  // A number from a chest's semester and week, so its sticker looks random but is the same
  // every time that chest is opened with the same stickers already found (after Undo, say).
  function chestHash(text) {
    let hash = 2166136261;
    for (const character of text) {
      hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
    }
    hash = Math.imul(hash ^ (hash >>> 15), 2246822519);
    return (hash ^ (hash >>> 13)) >>> 0;
  }

  // The sticker a chest holds, or null once every sticker has been found.
  function pickSticker(state, semesterId, weekStart) {
    const owned = new Set(foundStickers(state).map((entry) => entry.id));
    const commonLeft = STICKERS.filter((sticker) => !owned.has(sticker.id));
    const rareLeft = RARE_STICKERS.filter((sticker) => !owned.has(sticker.id));
    const hash = chestHash(`${semesterId}|${weekStart}`);
    const wantsRare = hash % RARE_CHANCE === 0;
    const pool = (wantsRare && rareLeft.length > 0) || commonLeft.length === 0 ? rareLeft : commonLeft;
    return pool.length === 0 ? null : pool[Math.floor(hash / RARE_CHANCE) % pool.length];
  }

  // Puts a chest's sticker in the book (once) and returns it, or null if the book is full.
  function giveSticker(state, semesterId, weekStart) {
    const already = foundStickers(state).find((entry) => entry.semesterId === semesterId && entry.weekStart === weekStart);
    if (already) {
      return findSticker(already.id);
    }
    const sticker = pickSticker(state, semesterId, weekStart);
    if (sticker) {
      state.stickerBook = { found: [...foundStickers(state), { id: sticker.id, semesterId, weekStart }] };
    }
    return sticker;
  }

  // Chests opened before the sticker book existed get their stickers, oldest week first.
  // Returns how many were given.
  function giveMissedStickers(state) {
    const chests = Object.entries(state.buddies || {})
      .flatMap(([semesterId, buddy]) => (buddy.openedChests || []).map((weekStart) => ({ semesterId, weekStart })))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
    const before = foundStickers(state).length;
    for (const { semesterId, weekStart } of chests) {
      giveSticker(state, semesterId, weekStart);
    }
    return foundStickers(state).length - before;
  }

  return { STICKERS, RARE_STICKERS, drawSticker, findSticker, foundStickers, giveSticker, giveMissedStickers };
})();

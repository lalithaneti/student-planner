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

  // ---------- The window's sky ----------
  // The time of day is morning from 5 to 9 AM, day until 5 PM, evening until 8 PM, then night.
  // A window in the room shows the sky for it. The shop and Decorate's tray show the daytime one.
  const WINDOW_TIMES = ['morning', 'day', 'evening', 'night'];

  function timeOfDayFor(hour) {
    if (hour >= 5 && hour < 9) {
      return 'morning';
    }
    if (hour >= 9 && hour < 17) {
      return 'day';
    }
    return hour >= 17 && hour < 20 ? 'evening' : 'night';
  }

  const WINDOW_CLOUD = 'M26 46 C24 40 32 37 35 41 C37 36 46 37 46 43 C50 43 51 49 46 49 H29 C25 49 24 47 26 46 Z';

  // What's seen through the glass (inside 19,15 to 81,71) at each time of day.
  const WINDOW_SKIES = {
    morning: {
      top: '#ffc7d6',
      bottom: '#ffe3b3',
      view: `<circle cx="34" cy="64" r="9" fill="#ffd97a" stroke="#f2b84b" stroke-width="2" />
        <path d="${WINDOW_CLOUD}" fill="#fff" opacity="0.8" transform="translate(30 -18)" />`,
    },
    day: {
      top: '#cfe9ff',
      bottom: '#cfe9ff',
      view: `<circle cx="64" cy="31" r="7" fill="#ffd97a" stroke="#e0ad3f" stroke-width="2" />
        <path d="${WINDOW_CLOUD}" fill="#fff" />`,
    },
    evening: {
      top: '#b9a3e3',
      bottom: '#ffb08a',
      view: `<circle cx="64" cy="64" r="10" fill="#ff9f6b" stroke="#f07f4c" stroke-width="2" />
        <path d="${WINDOW_CLOUD}" fill="#ffd1dc" opacity="0.85" transform="translate(-2 -14)" />`,
    },
    night: {
      top: '#1f2550',
      bottom: '#3a4280',
      view: `<path d="M64 22 A10 10 0 1 0 72 38 A8 8 0 1 1 64 22 Z" fill="#fff3b0" />
        <g fill="#fff"><circle cx="28" cy="24" r="1.3" /><circle cx="40" cy="34" r="1" /><circle cx="30" cy="56" r="1.2" /><circle cx="58" cy="52" r="1" /><circle cx="72" cy="62" r="1.3" /><circle cx="44" cy="20" r="0.9" /></g>`,
    },
  };

  function drawWindowArt(time) {
    const sky = WINDOW_SKIES[time] || WINDOW_SKIES.day;
    return `<defs><linearGradient id="window-sky-${time}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky.top}" /><stop offset="1" stop-color="${sky.bottom}" /></linearGradient>
        <clipPath id="window-glass"><rect x="19" y="15" width="62" height="56" rx="3" /></clipPath></defs>
      <rect x="14" y="10" width="72" height="66" rx="5" fill="#fffdf8" stroke="#c98f5c" stroke-width="3" />
      <g clip-path="url(#window-glass)">
        <rect x="19" y="15" width="62" height="56" fill="url(#window-sky-${time})" />
        ${sky.view}
      </g>
      <path d="M50 15 V71 M19 43 H81" stroke="#e8b98a" stroke-width="4" />
      <rect x="8" y="73" width="84" height="8" rx="3" fill="#e8b98a" stroke="#c98f5c" stroke-width="2.5" />
      <path d="M8 6 H25 C21 30 27 54 18 78 H8 Z" fill="#ffb3c7" stroke="#e58aa5" stroke-width="2.5" stroke-linejoin="round" />
      <path d="M92 6 H75 C79 30 73 54 82 78 H92 Z" fill="#ffb3c7" stroke="#e58aa5" stroke-width="2.5" stroke-linejoin="round" />
      <rect x="3" y="3" width="94" height="6" rx="3" fill="#e8b98a" stroke="#c98f5c" stroke-width="2" />`;
  }

  // ---------- The wall clock ----------
  // A wall clock in the room points to the real time ("HH:MM"); the shop shows 10:10.

  // How far each hand is turned, in degrees clockwise from 12.
  function clockHandAngles(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return { hour: (hours % 12) * 30 + minutes / 2, minute: minutes * 6 };
  }

  function drawClockArt(time) {
    const angles = clockHandAngles(time);
    return `<circle cx="50" cy="52" r="40" fill="#fffdf8" stroke="#e58aa5" stroke-width="6" />
      <g stroke="#c9b6c4" stroke-width="4" stroke-linecap="round">
        <path d="M50 19 V25 M50 79 V85 M17 52 H23 M77 52 H83" />
      </g>
      <path d="M50 52 V34" transform="rotate(${angles.hour} 50 52)" stroke="${INK}" stroke-width="5" stroke-linecap="round" />
      <path d="M50 52 V24" transform="rotate(${angles.minute} 50 52)" stroke="${INK}" stroke-width="3.5" stroke-linecap="round" />
      <circle cx="50" cy="52" r="4" fill="#e58aa5" />`;
  }

  // ---------- Bedtime ----------
  // From 9 PM to 7:30 AM, if a bed is in the room, the buddy is tucked in on it (the bed on top, if
  // there's more than one): drawn on the mattress with a copy of the bed's blanket over it. Its
  // saved spot doesn't change, so it's back there in the morning and while decorating.
  const BEDTIME_START = 21 * 60;
  const BEDTIME_END = 7 * 60 + 30;

  function isBedtime(time) {
    const [hours, minutes] = time.split(':').map(Number);
    const minute = hours * 60 + minutes;
    return minute >= BEDTIME_START || minute < BEDTIME_END;
  }

  // The bed's blanket, drawn on the bed and again over a tucked-in buddy.
  const BED_BLANKET = `<path d="M40 50 C40 46 44 45 48 45 H84 C87 45 88 47 88 50 V70 C88 74 86 76 82 76 H46 C42 76 40 74 40 70 Z" fill="#c9b6f2" stroke="#a48ad8" stroke-width="2.5" stroke-linejoin="round" />
        <path d="M40 54 H88" stroke="#a48ad8" stroke-width="2" />
        <path d="M40 50 V54 C40 52 44 51 48 51 H88" fill="#e3d8fb" stroke="#a48ad8" stroke-width="2" />
        <g fill="#fff" opacity="0.85">
          <circle cx="52" cy="62" r="2.2" /><circle cx="64" cy="68" r="2.2" /><circle cx="76" cy="61" r="2.2" /><circle cx="58" cy="71" r="1.8" /><circle cx="82" cy="70" r="1.8" />
        </g>`;

  // Where a point on a placed piece's 100-by-100 drawing is in the room (percentages, like
  // spots), following the piece's size and tilt. Also returns the piece's width (a percentage of
  // the room's width).
  function pointOnPiece(placed, item, pointX, pointY) {
    const width = item.width * stickerSize(placed);
    const turn = (stickerTilt(placed) * Math.PI) / 180;
    const across = ((pointX - 50) / 100) * width;
    const down = ((pointY - 50) / 100) * width;
    return {
      x: placed.x + across * Math.cos(turn) - down * Math.sin(turn),
      y: placed.y + (across * Math.sin(turn) + down * Math.cos(turn)) * ROOM_SHAPE,
      width,
    };
  }

  // The buddy is drawn 38% of the room wide at size 1, with its body's bottom near the bottom of
  // its drawing. In bed it's a bit narrower than the bed, sitting on the mattress over the blanket.
  const ROOM_BUDDY_WIDTH = 38;
  const BUDDY_BODY_BOTTOM = 0.42; // from the middle of its drawing to its body's bottom, in drawing widths

  // At bedtime, where the buddy goes (spot and size) and the bed it's in, or null with no bed.
  function bedSpot(state) {
    const bed = pageStickers(state).filter((placed) => placed.id === 'bed').pop();
    if (!bed) {
      return null;
    }
    const mattress = pointOnPiece(bed, findSticker('bed'), 62, 60);
    const size = clampSize((mattress.width * 0.8) / ROOM_BUDDY_WIDTH);
    const buddyWidth = ROOM_BUDDY_WIDTH * size;
    return {
      bed,
      x: clampSpot(mattress.x),
      y: clampSpot(mattress.y - BUDDY_BODY_BOTTOM * buddyWidth * ROOM_SHAPE),
      size,
    };
  }

  // ---------- The room's light ----------
  // The room takes on the time of day: a rosy tint in the morning, none in the day, golden in the
  // evening, and a cozy dim blue at night. Lamps and fairy lights are on in the evening and at
  // night; each `glows` spot ([x, y, radius] on the piece's 100-by-100 drawing) lights up the room
  // around it.
  const ROOM_LIGHTS = {
    morning: { color: '#ffd2c8', opacity: 0.3 },
    day: null,
    evening: { color: '#ffc27f', opacity: 0.35 },
    night: { color: '#34407a', opacity: 0.5 },
  };

  const lightsOnAt = (time) => time === 'evening' || time === 'night';

  // The room is 3 wide by 2 tall: a distance across it is 1.5 times as much of its height.
  const ROOM_SHAPE = 3 / 2;

  // Where a placed piece's lights are in the room (percentages, like spots) and how wide each glow
  // is (a percentage of the room's width), following its size and tilt.
  function glowSpots(placed, item) {
    const round = (value) => Math.round(value * 10) / 10;
    return (item.glows || []).map(([glowX, glowY, radius]) => {
      const { x, y, width } = pointOnPiece(placed, item, glowX, glowY);
      return { x: round(x), y: round(y), size: round(((2 * radius) / 100) * width) };
    });
  }

  // Fairy lights' bulbs: where each hangs on the string, and its color.
  const FAIRY_BULBS = [
    [11, 31, '#ffd97a'],
    [24, 37, '#ffb3c7'],
    [37, 35, '#b5e3cf'],
    [50, 27, '#cfe9ff'],
    [63, 35, '#ffd97a'],
    [76, 37, '#ffb3c7'],
    [89, 31, '#b5e3cf'],
  ];

  // ---------- Furniture ----------
  // Things for the buddy's room, bought with gems in the Gem shop (state.ownedFurniture lists
  // what's been bought, for every semester). Once bought, a piece goes in the room like a sticker,
  // as many times as wanted. `width` is its normal width as a percentage of the room.
  const FURNITURE = [
    {
      id: 'bed',
      name: 'Bed',
      price: 20,
      width: 30,
      furniture: true,
      art: `<g fill="#e8b98a" stroke="#c98f5c" stroke-width="2.5">
          <rect x="11" y="78" width="7" height="14" rx="2" /><rect x="83" y="78" width="7" height="14" rx="2" />
          <rect x="5" y="20" width="18" height="64" rx="9" />
          <rect x="79" y="44" width="16" height="40" rx="8" />
          <rect x="9" y="68" width="83" height="14" rx="5" />
        </g>
        <rect x="16" y="52" width="70" height="20" rx="7" fill="#fffdf8" stroke="#d6d0c6" stroke-width="2.5" />
        <path d="M22 50 C22 40 44 40 44 50 C44 56 22 56 22 50 Z" fill="#fff" stroke="#d6d0c6" stroke-width="2.5" />
        ${BED_BLANKET}`,
    },
    {
      id: 'desk',
      name: 'Desk with a lamp',
      price: 15,
      width: 26,
      furniture: true,
      glows: [[27, 24, 34]],
      art: `<circle class="lamp-glow" cx="27" cy="30" r="15" fill="#fff3b0" opacity="0.45" />
        <g fill="#e8b98a" stroke="#c98f5c" stroke-width="2.5">
          <rect x="12" y="58" width="7" height="36" rx="2" /><rect x="81" y="58" width="7" height="36" rx="2" />
          <rect x="54" y="58" width="30" height="22" rx="3" />
          <rect x="5" y="51" width="90" height="9" rx="3" />
        </g>
        <path d="M60 69 H78" stroke="#c98f5c" stroke-width="2" stroke-linecap="round" />
        <circle cx="69" cy="69" r="2.2" fill="#c98f5c" />
        <ellipse cx="27" cy="49" rx="10" ry="3.5" fill="#ffb3c7" stroke="#e58aa5" stroke-width="2.5" />
        <rect x="25" y="28" width="4" height="21" fill="#ffb3c7" stroke="#e58aa5" stroke-width="2" />
        <path d="M14 32 L21 14 H33 L40 32 Z" fill="#ffd97a" stroke="#e0ad3f" stroke-width="2.5" stroke-linejoin="round" />
        <rect x="60" y="43" width="26" height="8" rx="2" fill="#b5e3cf" stroke="#7fc0a3" stroke-width="2" />
        <rect x="63" y="35" width="21" height="8" rx="2" fill="#c9b6f2" stroke="#a48ad8" stroke-width="2" />
        <rect x="61" y="27" width="23" height="8" rx="2" fill="#ffb3c7" stroke="#e58aa5" stroke-width="2" />`,
    },
    {
      id: 'rug',
      name: 'Round rug',
      price: 8,
      width: 32,
      furniture: true,
      art: `<g stroke="#f093b3" stroke-width="2.5" stroke-linecap="round">
          <path d="M3 50 H-2 M3 56 H-2 M3 62 H-2 M97 50 H102 M97 56 H102 M97 62 H102" />
        </g>
        <ellipse cx="50" cy="56" rx="47" ry="22" fill="#ffc4d8" stroke="#f093b3" stroke-width="3" />
        <ellipse cx="50" cy="56" rx="35" ry="15" fill="#fff1f6" stroke="#f093b3" stroke-width="2" stroke-dasharray="4 4" />
        <ellipse cx="50" cy="56" rx="20" ry="8" fill="#ffc4d8" stroke="#f093b3" stroke-width="2" />`,
    },
    {
      id: 'plant',
      name: 'Potted plant',
      price: 6,
      width: 10,
      furniture: true,
      art: `<g fill="#a3dc95" stroke="#6fb864" stroke-width="2.5">
          <ellipse cx="30" cy="48" rx="7" ry="16" transform="rotate(-55 30 48)" />
          <ellipse cx="70" cy="48" rx="7" ry="16" transform="rotate(55 70 48)" />
          <ellipse cx="39" cy="32" rx="8" ry="21" transform="rotate(-22 39 32)" />
          <ellipse cx="61" cy="32" rx="8" ry="21" transform="rotate(22 61 32)" />
          <ellipse cx="50" cy="26" rx="8" ry="24" />
        </g>
        <path d="M33 66 H67 L62 94 H38 Z" fill="#f0a77a" stroke="#cf8152" stroke-width="3" stroke-linejoin="round" />
        <rect x="28" y="58" width="44" height="11" rx="4" fill="#f7bc94" stroke="#cf8152" stroke-width="3" />`,
    },
    {
      id: 'window',
      name: 'Window',
      price: 10,
      width: 16,
      furniture: true,
      art: drawWindowArt('day'),
    },
    {
      id: 'beanbag',
      name: 'Beanbag',
      price: 12,
      width: 15,
      furniture: true,
      art: `<path d="M14 86 C3 70 12 40 34 30 C46 24 58 24 70 32 C90 44 98 70 86 86 C70 96 30 96 14 86 Z" fill="#c9b6f2" stroke="#a48ad8" stroke-width="3" stroke-linejoin="round" />
        <path d="M24 60 C38 70 62 70 76 58" fill="none" stroke="#a48ad8" stroke-width="2.5" stroke-linecap="round" />
        <path d="M34 40 C40 34 50 32 58 34" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity="0.6" />`,
    },
    {
      id: 'fairy-lights',
      name: 'Fairy lights',
      price: 10,
      width: 30,
      furniture: true,
      glows: FAIRY_BULBS.map(([x, y]) => [x, y + 7, 16]),
      art: `<path d="M2 22 Q26 52 50 26 Q74 52 98 22" fill="none" stroke="#9c8a7a" stroke-width="2" />
        ${FAIRY_BULBS
          .map(
            ([x, y, color]) => `<circle class="lamp-glow" cx="${x}" cy="${y + 7}" r="9" fill="${color}" opacity="0.35" />
              <rect x="${x - 2}" y="${y - 1}" width="4" height="4" fill="#9c8a7a" />
              <ellipse cx="${x}" cy="${y + 7}" rx="4" ry="5.5" fill="${color}" stroke="#fff" stroke-width="1.2" />`,
          )
          .join('')}`,
    },
    {
      id: 'clock',
      name: 'Wall clock',
      price: 6,
      width: 8,
      furniture: true,
      art: drawClockArt('10:10'),
    },
    {
      id: 'picture',
      name: 'Framed picture',
      price: 6,
      width: 10,
      furniture: true,
      art: `<path d="M32 14 L50 3 L68 14" fill="none" stroke="#9c8a7a" stroke-width="2" />
        <circle cx="50" cy="3" r="2.5" fill="#9c8a7a" />
        <rect x="14" y="12" width="72" height="82" rx="4" fill="#e8b98a" stroke="#c98f5c" stroke-width="3" />
        <rect x="22" y="20" width="56" height="66" fill="#fffdf8" />
        <rect x="28" y="26" width="44" height="54" fill="#cfe9ff" />
        <circle cx="61" cy="38" r="6" fill="#ffd97a" />
        <path d="M28 80 L42 56 L52 68 L60 60 L72 74 V80 Z" fill="#a3dc95" stroke="#6fb864" stroke-width="2" stroke-linejoin="round" />`,
    },
    {
      id: 'fish-tank',
      name: 'Fish tank',
      price: 18,
      width: 18,
      furniture: true,
      art: `<rect x="12" y="80" width="76" height="12" rx="3" fill="#e8b98a" stroke="#c98f5c" stroke-width="2.5" />
        <rect x="8" y="22" width="84" height="60" rx="6" fill="#cfe9ff" stroke="#8fc7f0" stroke-width="3" />
        <path d="M11 30 H89" stroke="#fff" stroke-width="2" opacity="0.8" />
        <path d="M11 72 Q30 66 50 72 T89 70 V79 H11 Z" fill="#ffe3a8" />
        <path d="M24 72 C18 62 30 56 24 44 M30 72 C36 64 26 58 32 50" fill="none" stroke="#6fb864" stroke-width="3" stroke-linecap="round" />
        <ellipse cx="50" cy="46" rx="10" ry="7" fill="#ffb066" stroke="#e58a3f" stroke-width="2" />
        <path d="M40 46 L32 40 V52 Z" fill="#ffb066" stroke="#e58a3f" stroke-width="2" stroke-linejoin="round" />
        <circle cx="54" cy="44" r="1.6" fill="${INK}" />
        <ellipse cx="72" cy="60" rx="7" ry="5" fill="#ffb3c7" stroke="#e58aa5" stroke-width="2" />
        <path d="M79 60 L85 56 V64 Z" fill="#ffb3c7" stroke="#e58aa5" stroke-width="2" stroke-linejoin="round" />
        <circle cx="69" cy="59" r="1.3" fill="${INK}" />
        <g fill="none" stroke="#fff" stroke-width="1.5"><circle cx="58" cy="34" r="2.5" /><circle cx="62" cy="27" r="2" /></g>
        <rect x="5" y="16" width="90" height="7" rx="3" fill="#c9cfdc" stroke="#99a2b5" stroke-width="2" />`,
    },
    {
      id: 'nightstand',
      name: 'Nightstand with a lamp',
      price: 8,
      width: 11,
      furniture: true,
      glows: [[50, 18, 40]],
      art: `<circle class="lamp-glow" cx="50" cy="20" r="18" fill="#fff3b0" opacity="0.45" />
        <g fill="#e8b98a" stroke="#c98f5c" stroke-width="2.5">
          <rect x="27" y="88" width="7" height="8" rx="2" /><rect x="66" y="88" width="7" height="8" rx="2" />
          <rect x="20" y="46" width="60" height="44" rx="5" />
        </g>
        <g fill="#f3cfa8" stroke="#c98f5c" stroke-width="2">
          <rect x="27" y="52" width="46" height="15" rx="3" /><rect x="27" y="70" width="46" height="15" rx="3" />
        </g>
        <circle cx="50" cy="59.5" r="2.2" fill="#c98f5c" /><circle cx="50" cy="77.5" r="2.2" fill="#c98f5c" />
        <ellipse cx="50" cy="44" rx="11" ry="3.5" fill="#b5e3cf" stroke="#7fc0a3" stroke-width="2.5" />
        <rect x="48" y="26" width="4" height="18" fill="#b5e3cf" stroke="#7fc0a3" stroke-width="2" />
        <path d="M33 30 L40 10 H60 L67 30 Z" fill="#ffd97a" stroke="#e0ad3f" stroke-width="2.5" stroke-linejoin="round" />`,
    },
    {
      id: 'pet-bed',
      name: 'Pet bed',
      price: 10,
      width: 16,
      furniture: true,
      art: `<ellipse cx="50" cy="64" rx="45" ry="24" fill="#ffb3c7" stroke="#e58aa5" stroke-width="3" />
        <ellipse cx="50" cy="58" rx="32" ry="13" fill="#fff1f6" stroke="#e58aa5" stroke-width="2" />
        <path d="M30 56 C38 50 62 50 70 56" fill="none" stroke="#f6c6d6" stroke-width="3" stroke-linecap="round" />
        <path d="M50 84 C44 79 40 76 42 73 C44 70 48 71 50 74 C52 71 56 70 58 73 C60 76 56 79 50 84 Z" fill="#fff" stroke="#e58aa5" stroke-width="1.5" />`,
    },
  ];

  // ---------- Wallpaper and floors ----------
  // The room's two surfaces: the wall (its top 70%) and the floor (its bottom 30%, under the
  // baseboard). Patterns are bought with gems in the Gem shop like path themes: bought once, then
  // switched for free. Plain (no pattern) is free. Each pattern is a CSS background, sized in
  // percentages of its surface so it looks the same on a phone and a laptop.

  // A 3-by-2 room: the wall is 3 wide by 1.4 tall, the floor 3 wide by 0.6 tall.
  const WALL_SHAPE = 3 / 1.4;
  const FLOOR_SHAPE = 3 / 0.6;

  // A small picture (`viewWidth` by `viewHeight`) repeated `across` times across a surface of the
  // given shape, over a solid color. The color is its own layer (not part of each picture) so no
  // thin lines show where the pictures meet.
  function surfaceTile({ svg, viewWidth = 40, viewHeight = 40, color, across, shape }) {
    const width = 100 / across;
    const height = (width * shape * viewHeight) / viewWidth;
    const picture = encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewWidth} ${viewHeight}">${svg}</svg>`);
    return `url('data:image/svg+xml,${picture}') 0 0 / ${width.toFixed(3)}% ${height.toFixed(3)}%, ${color}`;
  }

  const wallTile = (svg, color, across) => surfaceTile({ svg, color, across, shape: WALL_SHAPE });
  const floorTile = (svg, color, across) => surfaceTile({ svg, color, across, shape: FLOOR_SHAPE });

  // Checks of two colors, `across` pairs wide, square on a surface of the given shape.
  function checks(first, second, across, shape) {
    const width = 100 / across;
    return `conic-gradient(${first} 25%, ${second} 0 50%, ${first} 0 75%, ${second} 0) 0 0 / ${width.toFixed(3)}% ${(width * shape).toFixed(3)}%`;
  }

  // Long floorboards running sideways, four rows deep, with staggered ends.
  function floorboards(color, line) {
    const svg = `<g fill="${line}"><rect x="50" y="0" width="30" height="16" opacity="0.14" /><rect x="0" y="16" width="12" height="16" opacity="0.08" /><rect x="66" y="16" width="14" height="16" opacity="0.2" /></g>
      <path d="M0 15.5 H80 M0 31.5 H80 M50 0 V15.5 M12 16 V31.5 M66 16 V31.5" stroke="${line}" stroke-width="1.2" />
      <path d="M6 6 H30 M56 10 H74 M20 22 H48 M30 27 H60" stroke="${line}" stroke-width="0.6" opacity="0.5" />`;
    return surfaceTile({ svg, viewWidth: 80, viewHeight: 32, color, across: 4, shape: FLOOR_SHAPE });
  }

  const DAISY = [0, 72, 144, 216, 288]
    .map((angle) => `<circle cx="20" cy="13" r="4.5" fill="#fff" stroke="#e8c26a" stroke-width="1.3" transform="rotate(${angle} 20 20)" />`)
    .join('');

  const WALLPAPERS = [
    { id: 'plain', name: 'Plain', price: 0, pattern: null },
    { id: 'stripes', name: 'Pink stripes', price: 8, pattern: 'repeating-linear-gradient(90deg, #ffd6e2 0 3%, #ffeaf0 3% 6%)' },
    {
      id: 'dots',
      name: 'Polka dots',
      price: 8,
      pattern: wallTile('<circle cx="10" cy="10" r="4" fill="#fff" /><circle cx="30" cy="30" r="4" fill="#fff" />', '#d9f2e6', 18),
    },
    {
      id: 'hearts',
      name: 'Hearts',
      price: 10,
      pattern: wallTile(
        '<path d="M20 28 C12 22 9 18 11 14 C13 10 18 11 20 15 C22 11 27 10 29 14 C31 18 28 22 20 28 Z" fill="#ffb3c7" />',
        '#ffe3ec',
        16,
      ),
    },
    {
      id: 'stars',
      name: 'Starry night',
      price: 12,
      pattern: wallTile(
        '<path d="M12 5 L14 10 L19 12 L14 14 L12 19 L10 14 L5 12 L10 10 Z" fill="#fff3b0" /><circle cx="30" cy="29" r="1.6" fill="#fff" /><circle cx="33" cy="9" r="1" fill="#fff" /><circle cx="8" cy="33" r="1" fill="#fff" />',
        '#2e3566',
        14,
      ),
    },
    {
      id: 'gingham',
      name: 'Gingham',
      price: 10,
      pattern: `linear-gradient(90deg, rgb(255 140 175 / 0.3) 50%, transparent 0) 0 0 / 5% ${(5 * WALL_SHAPE).toFixed(2)}%, linear-gradient(rgb(255 140 175 / 0.3) 50%, transparent 0) 0 0 / 5% ${(5 * WALL_SHAPE).toFixed(2)}%, #fff8fa`,
    },
    {
      id: 'flowers',
      name: 'Daisies',
      price: 12,
      pattern: wallTile(`${DAISY}<circle cx="20" cy="20" r="3.5" fill="#ffc94d" />`, '#fff1c4', 14),
    },
    {
      id: 'clouds',
      name: 'Clouds',
      price: 12,
      pattern: wallTile(
        '<path d="M7 25 C3 25 3 19 8 19 C9 14 16 13 18 17 C22 15 26 18 25 22 C28 22 28 25 25 25 Z" fill="#fff" /><path d="M24 37 C22 37 22 34 25 34 C26 31 30 31 31 33 C33 32 35 34 34 36 C36 36 36 37 34 37 Z" fill="#fff" opacity="0.85" />',
        '#cfe9ff',
        9,
      ),
    },
    {
      id: 'wood',
      name: 'Wood panels',
      price: 15,
      pattern: 'linear-gradient(rgb(255 255 255 / 0.12), transparent), repeating-linear-gradient(90deg, #e8b98a 0 7.24%, #c98f5c 7.24% 7.69%)',
    },
  ];

  const FLOORS = [
    { id: 'plain', name: 'Plain', price: 0, pattern: null },
    {
      id: 'pink-carpet',
      name: 'Pink carpet',
      price: 8,
      pattern:
        'repeating-linear-gradient(45deg, rgb(255 255 255 / 0.2) 0 0.5%, transparent 0.5% 1%), repeating-linear-gradient(-45deg, rgb(229 138 165 / 0.15) 0 0.5%, transparent 0.5% 1%), #f6c6d6',
    },
    { id: 'mint-tiles', name: 'Mint tiles', price: 8, pattern: checks('#bfe8d4', '#f4fffa', 12, FLOOR_SHAPE) },
    {
      id: 'night-rug',
      name: 'Night rug',
      price: 12,
      pattern: floorTile(
        '<circle cx="8" cy="10" r="1.3" fill="#ffd97a" /><circle cx="27" cy="6" r="0.9" fill="#fff3b0" /><circle cx="20" cy="26" r="1.1" fill="#ffd97a" /><circle cx="35" cy="33" r="0.8" fill="#fff" /><circle cx="5" cy="34" r="0.8" fill="#fff3b0" />',
        '#2b3160',
        16,
      ),
    },
    { id: 'picnic', name: 'Picnic checks', price: 10, pattern: checks('#ff9eb9', '#fff', 6, FLOOR_SHAPE) },
    {
      id: 'grass',
      name: 'Grass',
      price: 12,
      pattern: floorTile(
        '<path d="M8 30 L10 22 L12 30 M14 30 L15 24 L17 30 M27 14 L29 7 L31 14 M33 14 L34 9 L36 14" fill="none" stroke="#6fb864" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /><circle cx="22" cy="34" r="1.6" fill="#fff" /><circle cx="22" cy="34" r="0.7" fill="#ffc94d" />',
        '#a3dc95',
        14,
      ),
    },
    {
      id: 'cloud-carpet',
      name: 'Cloud carpet',
      price: 12,
      pattern: floorTile(
        '<path d="M6 22 C6 14 16 14 16 20 C16 26 9 25 10 20" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" /><path d="M24 36 C24 30 32 30 32 34" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity="0.8" /><circle cx="30" cy="10" r="3" fill="#fff" opacity="0.7" />',
        '#dceeff',
        14,
      ),
    },
    { id: 'light-wood', name: 'Light wood', price: 15, pattern: floorboards('#f0c995', '#c99a62') },
    { id: 'dark-wood', name: 'Dark wood', price: 15, pattern: floorboards('#9a6a46', '#6f4a30') },
  ];

  // Where each surface's patterns and choices are kept in the planner.
  const SURFACES = {
    wall: { patterns: WALLPAPERS, owned: 'ownedWallpapers', picked: 'roomWallpaper' },
    floor: { patterns: FLOORS, owned: 'ownedFloors', picked: 'roomFloor' },
  };

  function findSurface(kind, id) {
    return SURFACES[kind].patterns.find((pattern) => pattern.id === id) || null;
  }

  function ownsSurface(state, kind, id) {
    return id === 'plain' || (state[SURFACES[kind].owned] || []).includes(id);
  }

  // The pattern on a surface: the one picked, if it's owned, or else Plain.
  function roomSurface(state, kind) {
    const picked = findSurface(kind, state[SURFACES[kind].picked]);
    return picked && ownsSurface(state, kind, picked.id) ? picked : SURFACES[kind].patterns[0];
  }

  // The Gem shop's patterns for a surface, each marked 'owned', 'affordable', or 'short' (not enough gems).
  function surfaceShop(state, kind) {
    const balance = PlannerBuddy.gemBalance(state);
    return SURFACES[kind].patterns.map((pattern) => ({
      id: pattern.id,
      price: pattern.price,
      status: ownsSurface(state, kind, pattern.id) ? 'owned' : balance >= pattern.price ? 'affordable' : 'short',
    }));
  }

  // Buys a pattern and puts it in. Returns false (and changes nothing) if it isn't sold, is
  // already owned, or costs more gems than there are.
  function buySurface(state, kind, id) {
    const offer = surfaceShop(state, kind).find((item) => item.id === id);
    if (!offer || offer.status !== 'affordable') {
      return false;
    }
    const { owned, picked } = SURFACES[kind];
    state[owned] = [...(state[owned] || []), id];
    state.gemsSpent = (state.gemsSpent || 0) + offer.price;
    state[picked] = id;
    return true;
  }

  // Puts in an owned pattern, for free. Returns false for one that isn't owned.
  function useSurface(state, kind, id) {
    if (!findSurface(kind, id) || !ownsSurface(state, kind, id)) {
      return false;
    }
    state[SURFACES[kind].picked] = id;
    return true;
  }

  // ---------- The trophy shelf ----------
  // A free shelf for the room, with a trophy for each thing earned. Trophies stay once earned:
  // streak cups go by the best streak any semester's buddy has had, and medals by the furthest any
  // buddy has grown. Unearned ones show as faint gray outlines, so you can see what's left. The
  // shelf only goes in the room once.
  const TROPHY_SHELF_ID = 'trophy-shelf';
  const CUP_NAMES = ['Bronze cup', 'Silver cup', 'Gold cup', 'Rainbow cup'];
  const MEDAL_WORDS = ['your buddy hatching', 'your buddy growing to Little one', 'your buddy growing all the way up'];
  const SHELF_FRAMES = 3; // photos of other semesters' buddies, the latest ones

  // Every trophy, earned or not, each with what it's for. `frames` are other semesters' buddies
  // (their semester ids and names), latest last, for the bottom shelf's photos.
  function trophiesFor(state, todayKey, nowTime) {
    const semesterIds = Object.keys(state.buddies || {}).filter((id) => state.semesters.some((semester) => semester.id === id));
    const views = semesterIds.map((id) => PlannerBuddy.forSemester(state, id));
    const bestStreak = Math.max(0, ...views.map((view) => PlannerBuddy.streakFor(view, todayKey, nowTime).best));
    const furthestStage = Math.max(
      0,
      ...views.map((view) => PlannerBuddy.stageFor(PlannerBuddy.totalPoints(PlannerBuddy.pointsLog(view, todayKey, nowTime))).index),
    );
    const cups = PlannerBuddy.STREAK_MILESTONES.map((milestone, index) => ({
      id: `streak-${milestone.days}`,
      name: CUP_NAMES[index] || `${milestone.days}-day cup`,
      earned: bestStreak >= milestone.days,
      why: `a best streak of ${milestone.days} days`,
    }));
    const medals = PlannerBuddy.STAGES.slice(1).map((stage, index) => ({
      id: `stage-${index + 1}`,
      name: `${stage.name} medal`,
      earned: furthestStage >= index + 1,
      why: MEDAL_WORDS[index],
    }));
    const found = new Set(foundStickers(state).map((entry) => entry.id));
    const chest = {
      id: 'first-chest',
      name: 'Treasure trophy',
      earned: views.some((view) => (view.buddy.openedChests || []).length > 0),
      why: 'opening your first chest on Buddy’s Path',
    };
    const star = {
      id: 'all-stickers',
      name: 'Sticker star',
      earned: STICKERS.every((sticker) => found.has(sticker.id)),
      why: `finding all ${STICKERS.length} common stickers`,
    };
    const frames = state.semesters
      .filter((semester) => semester.id !== state.currentSemesterId && semesterIds.includes(semester.id))
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
      .slice(-SHELF_FRAMES)
      .map((semester) => ({ semesterId: semester.id, semesterName: semester.name }));
    return { cups, medals, chest, star, frames };
  }

  // ----- Drawing the shelf: 200 wide by 130 tall, two shelves of six spots. -----
  const SHELF_SPOTS = [22, 53, 84, 116, 147, 178];
  const SHELF_TOP = 52;
  const SHELF_BOTTOM = 117;
  const CUP_COLORS = [
    ['#e8ab74', '#b8763e'],
    ['#e3e6ee', '#99a2b5'],
    ['#ffd97a', '#d99a1f'],
    ['url(#trophy-rainbow)', '#c98fd8'],
  ];
  const MEDAL_RIBBONS = ['#b5e3cf', '#c9b6f2', '#ffb3c7'];

  function drawCup([fill, edge]) {
    return `<rect x="-9" y="-6" width="18" height="6" rx="1.5" fill="#9c7a54" stroke="#7a5c3c" stroke-width="1" />
      <rect x="-2.5" y="-14" width="5" height="8" fill="${fill}" stroke="${edge}" stroke-width="1" />
      <path d="M-11 -24 C-18 -24 -18 -15 -9 -15 M11 -24 C18 -24 18 -15 9 -15" fill="none" stroke="${edge}" stroke-width="2" />
      <path d="M-12 -34 H12 C12 -22 7 -14 0 -14 C-7 -14 -12 -22 -12 -34 Z" fill="${fill}" stroke="${edge}" stroke-width="1.5" stroke-linejoin="round" />
      <path d="M-7 -30 C-7 -24 -5 -20 -2 -18" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" opacity="0.7" />`;
  }

  function drawMedal(ribbon) {
    return `<path d="M-8 -36 L-3 -20 H3 L8 -36 Z" fill="${ribbon}" stroke="#fff" stroke-width="1" />
      <circle cx="0" cy="-12" r="10" fill="#ffd97a" stroke="#d99a1f" stroke-width="1.5" />
      <path d="M0 -18 L1.8 -14 L6 -13.5 L2.8 -10.6 L3.7 -6.5 L0 -8.6 L-3.7 -6.5 L-2.8 -10.6 L-6 -13.5 L-1.8 -14 Z" fill="#fff3b0" stroke="#d99a1f" stroke-width="0.8" />`;
  }

  const DRAW_CHEST = `<rect x="-10" y="-4" width="20" height="4" rx="1" fill="#9c7a54" />
      <rect x="-12" y="-20" width="24" height="16" rx="2" fill="#c98f5c" stroke="#8a5a34" stroke-width="1.2" />
      <path d="M-12 -20 C-12 -30 12 -30 12 -20 Z" fill="#e8b98a" stroke="#8a5a34" stroke-width="1.2" />
      <path d="M-12 -20 H12" stroke="#ffd97a" stroke-width="2" />
      <rect x="-3" y="-23" width="6" height="7" rx="1.5" fill="#ffd97a" stroke="#d99a1f" stroke-width="1" />`;

  const DRAW_STAR = `<rect x="-9" y="-6" width="18" height="6" rx="1.5" fill="#9c7a54" stroke="#7a5c3c" stroke-width="1" />
      <rect x="-1.5" y="-12" width="3" height="6" fill="#d99a1f" />
      <path d="M0 -38 L4.5 -28.5 L15 -27.5 L7 -20.5 L9.5 -10.5 L0 -15.5 L-9.5 -10.5 L-7 -20.5 L-15 -27.5 L-4.5 -28.5 Z" fill="#ffd97a" stroke="#d99a1f" stroke-width="1.5" stroke-linejoin="round" />`;

  // A photo frame; `inside` is the picture (a buddy drawing, or a question mark for none yet).
  function drawFrame(inside) {
    return `<rect x="-13" y="-36" width="26" height="34" rx="2" fill="#e8b98a" stroke="#c98f5c" stroke-width="1.5" />
      <rect x="-9.5" y="-32.5" width="19" height="27" fill="#fffdf8" />
      ${inside}
      <path d="M-13 -2 L-16 0 H16 L13 -2" fill="#c98f5c" />`;
  }

  // One spot on the shelf. Earned ones can be tapped to say what they're for (when `tappable`).
  function shelfItem(x, baseline, art, { name, earned, why, label }, tappable) {
    const text = label || (earned ? `${name} 🏆 Earned for ${why}!` : `${name}: not earned yet. It’s for ${why}.`);
    const tap = tappable ? ` data-action="show-trophy" data-trophy-text="${text.replace(/"/g, '&quot;')}"` : '';
    const look = earned ? '' : ' filter="url(#trophy-locked)" opacity="0.28"';
    return `<g class="trophy" transform="translate(${x} ${baseline})"${look}${tap}><title>${text}</title>${art}</g>`;
  }

  // The whole shelf. `frames` are { art, label } for photos of other semesters' buddies (art is
  // an <svg> of the buddy). With `tappable`, each trophy says what it's for when tapped.
  function drawTrophyShelf(trophies, frames, tappable) {
    const top = [
      ...trophies.cups.map((cup, index) => shelfItem(SHELF_SPOTS[index], SHELF_TOP, drawCup(CUP_COLORS[index] || CUP_COLORS[2]), cup, tappable)),
      shelfItem(SHELF_SPOTS[4], SHELF_TOP, DRAW_CHEST, trophies.chest, tappable),
      shelfItem(SHELF_SPOTS[5], SHELF_TOP, DRAW_STAR, trophies.star, tappable),
    ];
    const photos =
      frames.length > 0
        ? frames.map((frame, index) =>
            shelfItem(
              SHELF_SPOTS[3 + index],
              SHELF_BOTTOM,
              drawFrame(frame.art.replace('<svg', '<svg x="-9.5" y="-32.5" width="19" height="27"')),
              { earned: true, label: frame.label },
              tappable,
            ),
          )
        : [
            shelfItem(
              SHELF_SPOTS[3],
              SHELF_BOTTOM,
              drawFrame('<text x="0" y="-13" text-anchor="middle" font-size="14" font-weight="700" fill="#c9b6c4">?</text>'),
              { earned: false, label: 'A photo of your buddy from another semester goes here once you have one.' },
              tappable,
            ),
          ];
    const bottom = [...trophies.medals.map((medal, index) => shelfItem(SHELF_SPOTS[index], SHELF_BOTTOM, drawMedal(MEDAL_RIBBONS[index]), medal, tappable)), ...photos];
    const board = (y) => `<rect x="4" y="${y}" width="192" height="7" rx="2" fill="#e8b98a" stroke="#c98f5c" stroke-width="1.5" />
      <path d="M20 ${y + 7} V${y + 13} L28 ${y + 7} M180 ${y + 7} V${y + 13} L172 ${y + 7}" fill="#c98f5c" stroke="#c98f5c" stroke-width="1.5" stroke-linejoin="round" />`;
    return `<svg class="sticker-art is-furniture" viewBox="0 0 200 130" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="trophy-rainbow" x1="0" x2="1"><stop offset="0" stop-color="#ffb3c7" /><stop offset="0.35" stop-color="#ffd97a" /><stop offset="0.65" stop-color="#b5e3cf" /><stop offset="1" stop-color="#b9c8ff" /></linearGradient>
          <filter id="trophy-locked"><feColorMatrix type="saturate" values="0" /></filter>
        </defs>
        ${top.join('')}${board(SHELF_TOP)}${bottom.join('')}${board(SHELF_BOTTOM)}
      </svg>`;
  }

  // In Decorate's tray, the shelf is shown with three cups.
  const TROPHY_SHELF = {
    id: TROPHY_SHELF_ID,
    name: 'Trophy shelf',
    width: 30,
    furniture: true,
    art: `<rect x="4" y="58" width="92" height="9" rx="3" fill="#e8b98a" stroke="#c98f5c" stroke-width="2.5" />
      <g transform="translate(22 58) scale(1.2)">${drawCup(CUP_COLORS[0])}</g>
      <g transform="translate(50 58) scale(1.4)">${drawCup(CUP_COLORS[2])}</g>
      <g transform="translate(78 58) scale(1.2)">${drawCup(CUP_COLORS[1])}</g>`,
  };

  // ---------- Visiting buddies ----------
  // Other semesters' buddies can visit the room, placed in Decorate like furniture (free, each
  // once). One is saved on the page as 'visitor:' and its semester's id. While that semester is the
  // one being viewed, its buddy is the main buddy, so the app hides the visitor instead.
  const VISITOR_PREFIX = 'visitor:';
  const VISITOR_WIDTH = 24;

  const visitorId = (semesterId) => `${VISITOR_PREFIX}${semesterId}`;

  // The semester a visitor id is for, or null for anything that isn't a visitor.
  function visitorSemester(id) {
    return typeof id === 'string' && id.startsWith(VISITOR_PREFIX) ? id.slice(VISITOR_PREFIX.length) : null;
  }

  // Every semester with a buddy can visit.
  // What a visitor says when tapped: "Hi from <semester>!" first, then, tap by tap, the lines for
  // the time of day and one about the real day (what's left today, or at night what's due tomorrow).
  const VISITOR_TIME_LINES = {
    morning: ['Good morning! ☀️', 'Ready for today?', 'Breakfast first!'],
    day: ['You’ve got this!', 'Don’t forget to take a break!', 'So proud of you!'],
    evening: ['Almost done for the day!', 'Dinner time? 🍜', 'I love what you did with the room!'],
    night: ['It’s getting late…', 'Get some rest soon! 🌙', 'Sweet dreams! 💤'],
  };

  const things = (count) => `${count} thing${count === 1 ? '' : 's'}`;

  function visitorDueLine(time, leftToday, dueTomorrow) {
    if (time === 'night') {
      return dueTomorrow > 0 ? `You have ${things(dueTomorrow)} due tomorrow 👀` : 'Nothing due tomorrow. Sleep well! 🌙';
    }
    return leftToday > 0 ? `You have ${things(leftToday)} left today!` : 'All done for today! 🎉';
  }

  // `said` is how many lines this visitor has said before; `leftToday` and `dueTomorrow` count work
  // not checked off yet.
  function visitorLine({ semesterName, time, said, leftToday, dueTomorrow }) {
    if (said === 0) {
      return `Hi from ${semesterName}!`;
    }
    const lines = [...VISITOR_TIME_LINES[time], visitorDueLine(time, leftToday, dueTomorrow)];
    return lines[(said - 1) % lines.length];
  }

  function visitorIds(state) {
    return Object.keys(state.buddies || {})
      .filter((semesterId) => (state.semesters || []).some((semester) => semester.id === semesterId))
      .map(visitorId);
  }

  function drawSticker(sticker) {
    if (sticker.rare) {
      return drawRareSticker(sticker);
    }
    if (sticker.furniture) {
      return `<svg class="sticker-art is-furniture" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${sticker.art}</svg>`;
    }
    return `<svg class="sticker-art" viewBox="-4 -4 108 108" aria-hidden="true" focusable="false">${sticker.art}</svg>`;
  }

  // ---------- The sticker book ----------
  // One book for every semester: state.stickerBook.found lists each sticker found, with the
  // chest (semester and week) it came from. Each chest gives one sticker, never a duplicate.

  // About one chest in this many gives a rare sticker, while any are left to find.
  const RARE_CHANCE = 6;

  function findSticker(id) {
    const semesterId = visitorSemester(id);
    if (semesterId) {
      return { id, name: 'Visiting buddy', width: VISITOR_WIDTH, furniture: true, visitor: true, semesterId };
    }
    return [...STICKERS, ...RARE_STICKERS, ...FURNITURE, TROPHY_SHELF].find((sticker) => sticker.id === id) || null;
  }

  function foundStickers(state) {
    return (state.stickerBook && state.stickerBook.found) || [];
  }

  function ownedFurniture(state) {
    return FURNITURE.filter((piece) => (state.ownedFurniture || []).includes(piece.id));
  }

  // The Gem shop's Room section: each piece marked 'owned', 'affordable', or 'short' (not enough gems).
  function furnitureShop(state) {
    const balance = PlannerBuddy.gemBalance(state);
    const owned = new Set(ownedFurniture(state).map((piece) => piece.id));
    return FURNITURE.map((piece) => ({
      id: piece.id,
      price: piece.price,
      status: owned.has(piece.id) ? 'owned' : balance >= piece.price ? 'affordable' : 'short',
    }));
  }

  // Buys a piece of furniture. Returns false (and changes nothing) if it isn't sold, is already
  // owned, or costs more gems than there are.
  function buyFurniture(state, id) {
    const offer = furnitureShop(state).find((item) => item.id === id);
    if (!offer || offer.status !== 'affordable') {
      return false;
    }
    state.ownedFurniture = [...(state.ownedFurniture || []), id];
    state.gemsSpent = (state.gemsSpent || 0) + offer.price;
    return true;
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

  // ---------- The sticker page ----------
  // One page to decorate with found stickers, each as many times as wanted. A spot is a
  // percentage across and down the page (where the sticker's middle is), so the page looks
  // the same on a phone and a laptop.
  const PAGE_MAX_STICKERS = 60;

  // The stickers on the page, oldest (bottom) first. Skips anything not found or not readable.
  // Found stickers, bought furniture, the trophy shelf, and visiting buddies can go on the page.
  function placeableIds(state) {
    return new Set([
      ...foundStickers(state).map((entry) => entry.id),
      ...ownedFurniture(state).map((piece) => piece.id),
      TROPHY_SHELF_ID,
      ...visitorIds(state),
    ]);
  }

  function pageStickers(state) {
    const found = placeableIds(state);
    const placed = (state.stickerPage && state.stickerPage.stickers) || [];
    return placed.filter(
      (sticker) => sticker && found.has(sticker.id) && Number.isInteger(sticker.key) && Number.isFinite(sticker.x) && Number.isFinite(sticker.y),
    );
  }

  // Stickers are behind the buddy unless brought to the front.
  const isInFront = (sticker) => sticker.front === true;

  const clampSpot = (value) => Math.min(100, Math.max(0, Math.round(value * 10) / 10));

  // A sticker's size is a multiple of its normal size, from half to double. Stickers saved before
  // resizing existed (or with a damaged size) are normal size.
  const PAGE_SIZE_MIN = 0.5;
  const PAGE_SIZE_MAX = 2;
  const clampSize = (value) => Math.min(PAGE_SIZE_MAX, Math.max(PAGE_SIZE_MIN, Math.round(value * 100) / 100));

  function stickerSize(sticker) {
    return Number.isFinite(sticker.size) ? clampSize(sticker.size) : 1;
  }

  // Puts a found sticker, bought furniture, the trophy shelf, or a visiting buddy on the page and
  // returns it, or null if it can't go there, is a once-only one already there, or the page is full.
  function placeSticker(state, stickerId) {
    const placed = pageStickers(state);
    // The trophy shelf and each visiting buddy go in only once.
    const onlyOnce = stickerId === TROPHY_SHELF_ID || visitorSemester(stickerId) !== null;
    const alreadyIn = onlyOnce && placed.some((sticker) => sticker.id === stickerId);
    if (!placeableIds(state).has(stickerId) || placed.length >= PAGE_MAX_STICKERS || alreadyIn) {
      return null;
    }
    const key = placed.reduce((highest, sticker) => Math.max(highest, sticker.key), 0) + 1;
    // Each lands a little down and to the right of the last, so a few added in a row don't hide each other.
    const nudge = (placed.length % 5) * 10 - 20;
    const sticker = { key, id: stickerId, x: 50 + nudge, y: 50 + nudge };
    // New stickers go behind the buddy, on top of the others back there.
    const firstFront = placed.findIndex(isInFront);
    const at = firstFront === -1 ? placed.length : firstFront;
    state.stickerPage = { stickers: [...placed.slice(0, at), sticker, ...placed.slice(at)] };
    return sticker;
  }

  function moveSticker(state, key, x, y) {
    state.stickerPage = {
      stickers: pageStickers(state).map((sticker) => (sticker.key === key ? { ...sticker, x: clampSpot(x), y: clampSpot(y) } : sticker)),
    };
  }

  // A sticker's tilt in whole degrees, from -180 to 180 (positive turns clockwise). Within a few
  // degrees of straight it snaps to straight, so a tilt is easy to take back by hand.
  const TILT_SNAP = 6;

  function normalTilt(degrees) {
    const turned = ((Math.round(degrees) % 360) + 540) % 360 - 180;
    return Math.abs(turned) <= TILT_SNAP ? 0 : turned;
  }

  function stickerTilt(sticker) {
    return Number.isFinite(sticker.tilt) ? normalTilt(sticker.tilt) : 0;
  }

  function tiltSticker(state, key, degrees) {
    state.stickerPage = {
      stickers: pageStickers(state).map((sticker) => (sticker.key === key ? { ...sticker, tilt: normalTilt(degrees) } : sticker)),
    };
  }

  function resizeSticker(state, key, size) {
    state.stickerPage = {
      stickers: pageStickers(state).map((sticker) => (sticker.key === key ? { ...sticker, size: clampSize(size) } : sticker)),
    };
  }

  // The page lists stickers bottom first, and the ones in front of the buddy come last, so the
  // list order is always the order you see. To front: on top of everything, in front of the buddy.
  // To back: under everything, behind the buddy. Each returns false if it was already there.

  function stickerToFront(state, key) {
    const placed = pageStickers(state);
    const sticker = placed.find((each) => each.key === key);
    if (!sticker || (isInFront(sticker) && placed[placed.length - 1] === sticker)) {
      return false;
    }
    state.stickerPage = { stickers: [...placed.filter((each) => each !== sticker), { ...sticker, front: true }] };
    return true;
  }

  function stickerToBack(state, key) {
    const placed = pageStickers(state);
    const sticker = placed.find((each) => each.key === key);
    if (!sticker || (!isInFront(sticker) && placed[0] === sticker)) {
      return false;
    }
    const behind = { ...sticker };
    delete behind.front;
    state.stickerPage = { stickers: [behind, ...placed.filter((each) => each !== sticker)] };
    return true;
  }

  // Where the buddy stands in the room (its middle, as percentages like a sticker) and its size.
  // One spot for every semester's buddy; until it's moved, it stands in the middle near the bottom.
  const ROOM_BUDDY_HOME = { x: 50, y: 60, size: 1 };

  function roomBuddy(state) {
    const spot = state.roomBuddy || {};
    return {
      x: Number.isFinite(spot.x) ? clampSpot(spot.x) : ROOM_BUDDY_HOME.x,
      y: Number.isFinite(spot.y) ? clampSpot(spot.y) : ROOM_BUDDY_HOME.y,
      size: stickerSize(spot),
    };
  }

  function moveRoomBuddy(state, x, y) {
    state.roomBuddy = { ...roomBuddy(state), x: clampSpot(x), y: clampSpot(y) };
  }

  function resizeRoomBuddy(state, size) {
    state.roomBuddy = { ...roomBuddy(state), size: clampSize(size) };
  }

  function peelSticker(state, key) {
    state.stickerPage = { stickers: pageStickers(state).filter((sticker) => sticker.key !== key) };
  }

  return {
    STICKERS,
    RARE_STICKERS,
    FURNITURE,
    TROPHY_SHELF,
    WINDOW_TIMES,
    timeOfDayFor,
    ROOM_LIGHTS,
    lightsOnAt,
    glowSpots,
    drawWindowArt,
    clockHandAngles,
    isBedtime,
    bedSpot,
    BED_BLANKET,
    drawClockArt,
    WALLPAPERS,
    FLOORS,
    PAGE_MAX_STICKERS,
    drawSticker,
    findSticker,
    foundStickers,
    giveSticker,
    giveMissedStickers,
    ownedFurniture,
    furnitureShop,
    buyFurniture,
    visitorId,
    visitorSemester,
    VISITOR_TIME_LINES,
    visitorLine,
    trophiesFor,
    drawTrophyShelf,
    findSurface,
    roomSurface,
    surfaceShop,
    buySurface,
    useSurface,
    pageStickers,
    placeSticker,
    moveSticker,
    PAGE_SIZE_MIN,
    PAGE_SIZE_MAX,
    stickerSize,
    resizeSticker,
    stickerTilt,
    tiltSticker,
    isInFront,
    roomBuddy,
    moveRoomBuddy,
    resizeRoomBuddy,
    stickerToFront,
    stickerToBack,
    peelSticker,
  };
})();

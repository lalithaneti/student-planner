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
  ];

  function drawSticker(sticker) {
    return `<svg class="sticker-art" viewBox="-4 -4 108 108" aria-hidden="true" focusable="false">${sticker.art}</svg>`;
  }

  return { STICKERS, drawSticker };
})();

// Color themes for the app's background, cards, text, borders, and accent. Class and RSO
// colors, the Home sky, and break banners keep their own colors in every theme.
// Loaded in <head> after js/theme-art.js, so the saved theme is applied before the page first appears.

const PlannerThemes = (() => {
  const STORAGE_KEY = 'planner-theme';
  const MODES = ['auto', 'light', 'dark'];
  const DEFAULT_CUSTOM_COLOR = '#3e63dd';

  // Each palette sets the CSS variables of the same names (textMuted → --text-muted).
  const PRESETS = [
    {
      id: 'default',
      name: 'Classic',
      light: { background: '#f6f6f9', surface: '#ffffff', text: '#1c2024', textMuted: '#60646c', border: '#e0e1e6', accent: '#3e63dd', accentText: '#ffffff' },
      dark: { background: '#111113', surface: '#1c1c1f', text: '#edeef0', textMuted: '#a0a3ab', border: '#2e3035', accent: '#7b9bff', accentText: '#111113' },
    },
    {
      id: 'lavender',
      name: 'Lavender',
      light: { background: '#f7f4fc', surface: '#ffffff', text: '#211a2e', textMuted: '#675e78', border: '#e6dff2', accent: '#7c5cc4', accentText: '#ffffff' },
      dark: { background: '#14111a', surface: '#1e1a26', text: '#eeeaf5', textMuted: '#aaa2b8', border: '#322b3d', accent: '#b8a1f0', accentText: '#14111a' },
    },
    {
      id: 'forest',
      name: 'Forest',
      light: { background: '#f2f6f1', surface: '#fcfdfb', text: '#19231b', textMuted: '#5a6a5c', border: '#dbe5d9', accent: '#2f7a4b', accentText: '#ffffff' },
      dark: { background: '#0f1410', surface: '#181f19', text: '#e8efe8', textMuted: '#9fb0a1', border: '#28332a', accent: '#7fcf98', accentText: '#0f1410' },
    },
    {
      id: 'ocean',
      name: 'Ocean',
      light: { background: '#eff6f8', surface: '#fbfeff', text: '#13232a', textMuted: '#546a72', border: '#d5e6ec', accent: '#1a7a99', accentText: '#ffffff' },
      dark: { background: '#0c1417', surface: '#142026', text: '#e5f0f3', textMuted: '#98afb7', border: '#223640', accent: '#6cc7e3', accentText: '#0c1417' },
    },
    {
      id: 'autumn',
      name: 'Cozy autumn',
      light: { background: '#faf5ef', surface: '#fffcf8', text: '#2a1f17', textMuted: '#74655a', border: '#eddfd0', accent: '#b5562a', accentText: '#ffffff' },
      dark: { background: '#16110d', surface: '#211a14', text: '#f3ebe3', textMuted: '#b4a698', border: '#382c22', accent: '#f0a070', accentText: '#16110d' },
    },
    {
      id: 'rose',
      name: 'Rose',
      light: { background: '#fbf3f5', surface: '#fffbfc', text: '#2b1a1f', textMuted: '#79606a', border: '#f0dde3', accent: '#c2416b', accentText: '#ffffff' },
      dark: { background: '#170f12', surface: '#22171b', text: '#f5e9ed', textMuted: '#b9a0a9', border: '#3a272e', accent: '#f294b3', accentText: '#170f12' },
    },
  ];

  // Decorated themes add artwork (js/theme-art.js) to their colors. art.colors fills the motifs.
  const DECORATED = [
    {
      id: 'garden',
      name: 'Garden',
      light: { background: '#f5f8f0', surface: '#fffffb', text: '#1f2a1c', textMuted: '#5f6b58', border: '#e0e8d6', accent: '#c2457a', accentText: '#ffffff' },
      dark: { background: '#11160f', surface: '#1a2117', text: '#ecf1e6', textMuted: '#a3b09c', border: '#2c3628', accent: '#f08cb6', accentText: '#11160f' },
      art: { motifs: ['flower', 'leaf', 'tulip'], colors: { petal: '#f4a6c4', center: '#f6c945', leaf: '#7fb069', stem: '#6a9a55', accent: '#e86f9a' } },
    },
    {
      id: 'leaves',
      name: 'Autumn leaves',
      light: { background: '#fbf4ea', surface: '#fffaf3', text: '#2d1f14', textMuted: '#7a6553', border: '#efdcc6', accent: '#c0531f', accentText: '#ffffff' },
      dark: { background: '#17110b', surface: '#221911', text: '#f4eadf', textMuted: '#b8a491', border: '#3b2d20', accent: '#f29a5e', accentText: '#17110b' },
      art: { motifs: ['maple', 'leaf', 'acorn'], colors: { petal: '#e0702f', center: '#c99a4a', leaf: '#d9a03b', stem: '#7a5232', accent: '#a8452a' } },
    },
    {
      id: 'winter',
      name: 'Winter',
      light: { background: '#f1f6fb', surface: '#fcfeff', text: '#15222e', textMuted: '#566676', border: '#d9e5f0', accent: '#2e6fb0', accentText: '#ffffff' },
      dark: { background: '#0b1219', surface: '#131d27', text: '#e6eef6', textMuted: '#9aabbb', border: '#22313f', accent: '#8cc2f2', accentText: '#0b1219' },
      art: { motifs: ['snowflake', 'pine', 'dot'], colors: { petal: '#8fb8de', center: '#b9d4ec', leaf: '#6f9fae', stem: '#a7bfd6', accent: '#5d8fbf' } },
    },
    {
      id: 'beach',
      name: 'Beach',
      light: { background: '#f2f8f7', surface: '#fffefb', text: '#13282a', textMuted: '#546d6e', border: '#d6e8e5', accent: '#12827f', accentText: '#ffffff' },
      dark: { background: '#0b1616', surface: '#122122', text: '#e4f2f0', textMuted: '#98b3b1', border: '#1f3536', accent: '#5fd0c9', accentText: '#0b1616' },
      art: { motifs: ['shell', 'wave', 'starfish'], colors: { petal: '#f2b38f', center: '#e6cf9a', leaf: '#63b8c4', stem: '#8fcfd6', accent: '#ef8a6b' } },
    },
    {
      id: 'starry',
      name: 'Starry night',
      light: { background: '#f3f2fa', surface: '#fefdff', text: '#1d1b33', textMuted: '#625f80', border: '#e0def0', accent: '#4b45a8', accentText: '#ffffff' },
      dark: { background: '#0d0c1d', surface: '#17162b', text: '#ecebf8', textMuted: '#a6a3c4', border: '#2a2845', accent: '#a9a3ff', accentText: '#0d0c1d' },
      art: { motifs: ['star', 'sparkle', 'moon'], colors: { petal: '#f3c74f', center: '#f6dd8a', leaf: '#a9a3ff', stem: '#b8b4e0', accent: '#a9a3ff' }, dashedStem: true },
    },
    {
      id: 'cafe',
      name: 'Cozy café',
      light: { background: '#f8f2ea', surface: '#fffbf5', text: '#2b1d14', textMuted: '#77624f', border: '#ecdfcf', accent: '#8a5a3b', accentText: '#ffffff' },
      dark: { background: '#15100c', surface: '#201812', text: '#f2e9df', textMuted: '#b5a493', border: '#382b21', accent: '#d9a679', accentText: '#15100c' },
      art: { motifs: ['cup', 'bean', 'heart'], colors: { petal: '#c08a5e', center: '#6f4a32', leaf: '#b8a090', stem: '#b8a090', accent: '#d9837a' } },
    },
    {
      id: 'cherry',
      name: 'Cherry blossom',
      light: { background: '#fdf4f6', surface: '#fffcfd', text: '#2e1b22', textMuted: '#7d6169', border: '#f3dde3', accent: '#c94f7c', accentText: '#ffffff' },
      dark: { background: '#180f13', surface: '#24171d', text: '#f7eaef', textMuted: '#bda2ab', border: '#3d2a32', accent: '#f6a1c0', accentText: '#180f13' },
      art: { motifs: ['sakura', 'petal', 'bud'], colors: { petal: '#f7b6cb', center: '#d9577f', leaf: '#8a6a55', stem: '#6b4a3e', accent: '#d9577f' } },
    },
    {
      id: 'strawberry',
      name: 'Strawberry',
      light: { background: '#fdf5f2', surface: '#fffdfb', text: '#2e1716', textMuted: '#7d5f5c', border: '#f2dcd6', accent: '#d33f49', accentText: '#ffffff' },
      dark: { background: '#180e0e', surface: '#241616', text: '#f8eae8', textMuted: '#c0a19e', border: '#3e2827', accent: '#ff8d93', accentText: '#180e0e' },
      art: {
        motifs: ['strawberry', 'blossom', 'leaf'],
        colors: { petal: '#ffffff', center: '#f6c945', leaf: '#6fae5a', stem: '#6fae5a', accent: '#e8505b' },
        gingham: '#f6c5c5',
      },
    },
  ];

  function isHexColor(value) {
    return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
  }

  function hexToHsl(hex) {
    const [r, g, b] = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lightness = (max + min) / 2;
    const delta = max - min;
    if (delta === 0) {
      return { h: 0, s: 0, l: lightness * 100 };
    }
    const saturation = delta / (1 - Math.abs(2 * lightness - 1));
    let hue;
    if (max === r) {
      hue = ((g - b) / delta) % 6;
    } else if (max === g) {
      hue = (b - r) / delta + 2;
    } else {
      hue = (r - g) / delta + 4;
    }
    return { h: (hue * 60 + 360) % 360, s: saturation * 100, l: lightness * 100 };
  }

  function hsl(h, s, l) {
    return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
  }

  // Builds a whole palette around one picked color: tinted backgrounds and borders in its hue,
  // and the color itself as the accent, darkened or lightened just enough to stand out.
  function customPalette(hex, dark) {
    const { h, s, l } = hexToHsl(isHexColor(hex) ? hex : DEFAULT_CUSTOM_COLOR);
    const tint = Math.min(s, 40);
    if (dark) {
      const accentLightness = Math.max(l, 68);
      return {
        background: hsl(h, tint * 0.5, 7),
        surface: hsl(h, tint * 0.45, 11),
        text: hsl(h, tint * 0.25, 93),
        textMuted: hsl(h, tint * 0.2, 68),
        border: hsl(h, tint * 0.4, 20),
        accent: hsl(h, s, accentLightness),
        accentText: hsl(h, tint * 0.5, 7),
      };
    }
    const accentLightness = Math.min(l, 42);
    return {
      background: hsl(h, tint, 96),
      surface: hsl(h, tint, 99.5),
      text: hsl(h, tint * 0.4, 12),
      textMuted: hsl(h, tint * 0.25, 40),
      border: hsl(h, tint * 0.8, 88),
      accent: hsl(h, s, accentLightness),
      accentText: '#ffffff',
    };
  }

  function findPreset(id) {
    return [...PRESETS, ...DECORATED].find((preset) => preset.id === id);
  }

  function paletteFor(choice, dark) {
    if (choice.theme === 'custom') {
      return customPalette(choice.customColor, dark);
    }
    const preset = findPreset(choice.theme) || PRESETS[0];
    return dark ? preset.dark : preset.light;
  }

  // Anything missing or unreadable falls back to Classic in Auto mode.
  function normalizeChoice(value) {
    const choice = value && typeof value === 'object' ? value : {};
    return {
      theme: choice.theme === 'custom' || findPreset(choice.theme) ? choice.theme : 'default',
      customColor: isHexColor(choice.customColor) ? choice.customColor.toLowerCase() : DEFAULT_CUSTOM_COLOR,
      mode: MODES.includes(choice.mode) ? choice.mode : 'auto',
    };
  }

  function loadChoice() {
    try {
      return normalizeChoice(JSON.parse(localStorage.getItem(STORAGE_KEY)));
    } catch {
      return normalizeChoice(null);
    }
  }

  function saveChoice(choice) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
    } catch {
      // The theme just won't be remembered next time.
    }
  }

  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function isDark(choice) {
    return choice.mode === 'dark' || (choice.mode === 'auto' && systemDark.matches);
  }

  const DECOR_VARIABLES = Object.keys(ThemeArt.cssVariables(DECORATED[0].art));

  // Decorated themes put their artwork in CSS variables and mark <html> with data-decor,
  // which turns on the background, corner, garland, and heading styles.
  function applyDecorations(theme) {
    const root = document.documentElement;
    if (theme && theme.art) {
      for (const [name, value] of Object.entries(ThemeArt.cssVariables(theme.art))) {
        root.style.setProperty(name, value);
      }
      root.dataset.decor = theme.id;
    } else {
      DECOR_VARIABLES.forEach((name) => root.style.removeProperty(name));
      delete root.dataset.decor;
    }
  }

  // Sets the palette's CSS variables on <html>, and the .dark class that the dark-mode styles use.
  function apply(choice) {
    const root = document.documentElement;
    const dark = isDark(choice);
    const palette = paletteFor(choice, dark);
    for (const [name, value] of Object.entries(palette)) {
      root.style.setProperty(`--${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`, value);
    }
    applyDecorations(findPreset(choice.theme));
    root.classList.toggle('dark', dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
  }

  let current = loadChoice();
  apply(current);
  // In Auto mode, follow the computer's setting when it changes (e.g. at sunset).
  systemDark.addEventListener('change', () => apply(current));

  function getChoice() {
    return current;
  }

  function setChoice(changes) {
    current = normalizeChoice({ ...current, ...changes });
    apply(current);
    saveChoice(current);
    return current;
  }

  return { PRESETS, DECORATED, MODES, customPalette, paletteFor, normalizeChoice, getChoice, setChoice };
})();

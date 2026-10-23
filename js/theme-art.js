// Artwork for the decorated themes, drawn as SVG. Each theme has a few small motifs
// (a flower, a leaf…), and the builders below arrange them four ways: a faint background
// pattern, sprays for the bottom corners, a garland across the top, and a heading icon.
// Motifs are drawn around (0, 0) at about 20 units across.

const ThemeArt = (() => {
  // ---------- Shapes ----------

  function star(points, outer, inner, fill) {
    const corners = [];
    for (let i = 0; i < points * 2; i += 1) {
      const radius = i % 2 === 0 ? outer : inner;
      const angle = (Math.PI * i) / points - Math.PI / 2;
      corners.push(`${(radius * Math.cos(angle)).toFixed(2)},${(radius * Math.sin(angle)).toFixed(2)}`);
    }
    return `<polygon points="${corners.join(' ')}" fill="${fill}" stroke="${fill}" stroke-width="1" stroke-linejoin="round"/>`;
  }

  // Repeats a shape around the center, e.g. the petals of a flower.
  function around(count, shape) {
    return Array.from({ length: count }, (_, i) => `<g transform="rotate(${(360 / count) * i})">${shape}</g>`).join('');
  }

  const MOTIFS = {
    flower: ({ petal, center }) =>
      `${around(5, `<circle cx="0" cy="-5" r="4.6" fill="${petal}"/>`)}<circle r="3" fill="${center}"/>`,
    leaf: ({ leaf }) =>
      `<path d="M0,-9 C6,-4 6,4 0,9 C-6,4 -6,-4 0,-9Z" fill="${leaf}"/><path d="M0,-6 V8" stroke="rgb(255 255 255 / 45%)" stroke-width="1"/>`,
    tulip: ({ accent }) => `<path d="M-6,-1 L-6,-8 L-3,-5 L0,-9 L3,-5 L6,-8 L6,-1 C6,6 -6,6 -6,-1Z" fill="${accent}"/>`,
    maple: ({ petal }) =>
      `<path d="M0,-10 L2,-5 L6,-7 L5,-2 L10,-1 L6,2 L7,5 L2,4 L1,8 L0,7 L-1,8 L-2,4 L-7,5 L-6,2 L-10,-1 L-5,-2 L-6,-7 L-2,-5Z" fill="${petal}" stroke="${petal}" stroke-width="0.8" stroke-linejoin="round"/><path d="M0,6 L0,11" stroke="${petal}" stroke-width="1.4" stroke-linecap="round"/>`,
    acorn: ({ stem, center }) =>
      `<ellipse cx="0" cy="3" rx="5" ry="6" fill="${center}"/><path d="M-6.5,0 C-6.5,-6 6.5,-6 6.5,0Z" fill="${stem}"/><path d="M0,-4 Q1,-7 2.5,-8.5" stroke="${stem}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`,
    snowflake: ({ petal }) =>
      `<g stroke="${petal}" stroke-width="1.7" stroke-linecap="round" fill="none">${around(6, '<path d="M0,0 V-9 M0,-5 L-3,-8 M0,-5 L3,-8"/>')}</g>`,
    dot: ({ center }) => `<circle r="2.6" fill="${center}"/>`,
    pine: ({ leaf, stem }) =>
      `<path d="M0,-10 L6,-2 L3,-2 L8,5 L-8,5 L-3,-2 L-6,-2Z" fill="${leaf}" stroke="${leaf}" stroke-width="1" stroke-linejoin="round"/><rect x="-1.5" y="5" width="3" height="4" fill="${stem}"/>`,
    shell: ({ petal }) =>
      `<path d="M0,8 L-8,-2 C-8,-9 8,-9 8,-2Z" fill="${petal}" stroke="${petal}" stroke-width="1" stroke-linejoin="round"/><path d="M0,7 L-5,-5 M0,7 L0,-7 M0,7 L5,-5" stroke="rgb(255 255 255 / 55%)" stroke-width="1.1"/>`,
    starfish: ({ accent }) => star(5, 9.5, 4, accent),
    wave: ({ leaf }) =>
      `<path d="M-10,2 C-7,-5 -3,-5 0,0 C3,5 7,5 10,-2" stroke="${leaf}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
    star: ({ petal }) => star(5, 9, 4, petal),
    moon: ({ center }) => `<path d="M3,-9 A9,9 0 1,0 3,9 A7,7 0 1,1 3,-9Z" fill="${center}"/>`,
    sparkle: ({ accent }) => star(4, 8, 2, accent),
    cup: ({ petal, stem }) =>
      `<path d="M-7,-2 H5 V3 C5,7 2,9 -1,9 C-4,9 -7,7 -7,3Z" fill="${petal}"/><circle cx="6" cy="2" r="2.6" stroke="${petal}" stroke-width="1.6" fill="none"/><path d="M-4,-4 C-6,-7 -2,-8 -4,-11 M0,-4 C-2,-7 2,-8 0,-11" stroke="${stem}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`,
    bean: ({ center }) =>
      `<g transform="rotate(25)"><ellipse rx="5" ry="7.5" fill="${center}"/><path d="M0,-6 C-2.5,-2 2.5,2 0,6" stroke="rgb(255 255 255 / 40%)" stroke-width="1.3" fill="none"/></g>`,
    heart: ({ accent }) => `<path d="M0,7 C-9,0 -6,-8 0,-3 C6,-8 9,0 0,7Z" fill="${accent}"/>`,
    sakura: ({ petal, center }) =>
      `${around(5, `<path d="M0,0 C-4.5,-3 -4.5,-8 -1.6,-9.6 L0,-8 L1.6,-9.6 C4.5,-8 4.5,-3 0,0Z" fill="${petal}"/>`)}<circle r="1.6" fill="${center}"/>`,
    bud: ({ petal, leaf }) =>
      `<ellipse cx="0" cy="-1" rx="4" ry="6" fill="${petal}"/><path d="M-4,3 Q0,7 4,3 L0,9Z" fill="${leaf}"/>`,
    petal: ({ petal }) =>
      `<path d="M0,6 C-5,3 -5,-4 -1.6,-6.5 L0,-5 L1.6,-6.5 C5,-4 5,3 0,6Z" fill="${petal}" transform="rotate(30)"/>`,
    strawberry: ({ accent, leaf, center }) =>
      `<path d="M0,9.5 C-8,4 -8,-4 -5,-5 C-2,-6 2,-6 5,-5 C8,-4 8,4 0,9.5Z" fill="${accent}"/>${[
        [-3, -1],
        [2, -2],
        [-1, 3],
        [3, 3],
        [0, 6.5],
      ]
        .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="0.7" ry="1.1" fill="${center}"/>`)
        .join('')}<path d="M-5.5,-5 L-2,-8.5 L0,-5.5 L2,-8.5 L5.5,-5 L0,-3Z" fill="${leaf}"/>`,
    blossom: ({ center }) =>
      `${around(5, '<circle cx="0" cy="-4.5" r="4" fill="#ffffff" stroke="rgb(0 0 0 / 8%)" stroke-width="0.5"/>')}<circle r="2.6" fill="${center}"/>`,
  };

  // ---------- Builders ----------

  function svg(width, height, body) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
  }

  function place(motif, art, x, y, scale, angle) {
    return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${scale})">${MOTIFS[motif](art.colors)}</g>`;
  }

  // Motifs are spread out and kept away from the edges, so the tile repeats without cut-offs.
  const PATTERN_SPOTS = [
    [34, 40, 1.1, -15],
    [134, 30, 0.8, 20],
    [206, 96, 1.2, 40],
    [80, 118, 0.9, 10],
    [158, 166, 1.1, -30],
    [36, 200, 0.8, 60],
    [214, 214, 0.7, 0],
    [112, 214, 0.7, -10],
  ];

  function gingham(color) {
    return `<rect width="40" height="40" fill="none"/><rect width="20" height="40" fill="${color}" opacity="0.5"/><rect width="40" height="20" fill="${color}" opacity="0.5"/>`;
  }

  function pattern(art) {
    if (art.gingham) {
      // Gingham under the strawberries, at a smaller tile so the checks repeat.
      const checks = Array.from({ length: 36 }, (_, i) => `<g transform="translate(${(i % 6) * 40} ${Math.floor(i / 6) * 40})">${gingham(art.gingham)}</g>`).join('');
      return svg(240, 240, checks + PATTERN_SPOTS.filter((_, i) => i % 2 === 0).map(([x, y, scale, angle], i) => place(art.motifs[i % art.motifs.length], art, x, y, scale, angle)).join(''));
    }
    return svg(240, 240, PATTERN_SPOTS.map(([x, y, scale, angle], i) => place(art.motifs[i % art.motifs.length], art, x, y, scale, angle)).join(''));
  }

  const CORNER_SPOTS = [
    [150, 110, 2.6, 10],
    [228, 30, 2.1, -20],
    [60, 112, 2.2, -30],
    [104, 170, 1.7, 35],
    [196, 70, 1.5, 50],
    [30, 196, 1.6, 0],
  ];

  // A curving stem from the bottom-left corner with motifs along it. The right corner is a mirror image.
  function corner(art, mirrored) {
    const dash = art.dashedStem ? ' stroke-dasharray="2 7"' : '';
    const stems = `<g stroke="${art.colors.stem}" stroke-width="3" fill="none" stroke-linecap="round"${dash}>
      <path d="M0,238 C60,222 110,182 150,112 S204,42 232,30"/>
      <path d="M70,212 C92,172 82,142 60,112"/>
      <path d="M122,170 C140,162 180,140 196,70"/>
    </g>`;
    const motifs = CORNER_SPOTS.map(([x, y, scale, angle], i) => place(art.motifs[i % art.motifs.length], art, x, y, scale, angle)).join('');
    const body = stems + motifs;
    return svg(240, 240, mirrored ? `<g transform="translate(240 0) scale(-1 1)">${body}</g>` : body);
  }

  // A swag of string with motifs hanging from it, repeated across the top of the page.
  function garland(art) {
    const dash = art.dashedStem ? ' stroke-dasharray="2 6"' : '';
    const string = `<path d="M0,6 Q40,26 80,6 Q120,26 160,6" stroke="${art.colors.stem}" stroke-width="2" fill="none"${dash}/>`;
    const motifs = [
      place(art.motifs[0], art, 40, 22, 1.1, -8),
      place(art.motifs[1 % art.motifs.length], art, 80, 9, 0.7, 0),
      place(art.motifs[2 % art.motifs.length], art, 120, 22, 1, 10),
    ].join('');
    return svg(160, 40, string + motifs);
  }

  function icon(art) {
    return svg(24, 24, place(art.motifs[0], art, 12, 12, 1.05, 0));
  }

  function toUrl(markup) {
    return `url("data:image/svg+xml,${encodeURIComponent(markup)}")`;
  }

  // The CSS variables a decorated theme sets on <html>.
  function cssVariables(art) {
    return {
      '--decor-pattern': toUrl(pattern(art)),
      '--decor-corner-left': toUrl(corner(art, false)),
      '--decor-corner-right': toUrl(corner(art, true)),
      '--decor-garland': toUrl(garland(art)),
      '--decor-icon': toUrl(icon(art)),
    };
  }

  return { MOTIFS, pattern, corner, garland, icon, cssVariables };
})();

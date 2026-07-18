// Palette.js
// The Ghibli / watercolor color system for Aetheria's Ascent.
// Six color ramps (primary, secondary, accent, success, warning, error) plus
// neutrals, each with multiple shades. Used by PixiJS renderers and the DOM HUD.

export const palette = {
  primary: {
    50: '#f3f0ff',
    100: '#e9e2ff',
    200: '#d4c7ff',
    300: '#b6a0ff',
    400: '#9a78f0',
    500: '#7b54e0',
    600: '#5f3cc0',
    700: '#4a2e9c',
    800: '#372378',
    900: '#271a57'
  },
  secondary: {
    50: '#e7fbff',
    100: '#c4f3ff',
    200: '#8fe6ff',
    300: '#54d6f7',
    400: '#28c0e6',
    500: '#13a4cc',
    600: '#0d83a8',
    700: '#0a6582',
    800: '#084d62',
    900: '#063a4a'
  },
  accent: {
    50: '#fff7e6',
    100: '#ffe9b8',
    200: '#ffd97f',
    300: '#ffc94a',
    400: '#ffb81f',
    500: '#f59e0b',
    600: '#c97a06',
    700: '#9c5d04',
    800: '#6f4303',
    900: '#4a2c02'
  },
  success: {
    50: '#e7fff0',
    100: '#b6ffd4',
    200: '#74f5ad',
    300: '#3de584',
    400: '#16cf64',
    500: '#08a84f',
    600: '#06833e',
    700: '#056631',
    800: '#044a23',
    900: '#033319'
  },
  warning: {
    50: '#fff7e0',
    100: '#ffe8a8',
    200: '#ffd770',
    300: '#ffc44a',
    400: '#ffae27',
    500: '#f59010',
    600: '#c2710a',
    700: '#945808',
    800: '#684006',
    900: '#3f2804'
  },
  error: {
    50: '#ffeaea',
    100: '#ffc6c6',
    200: '#ff9d9d',
    300: '#ff6f6f',
    400: '#f54545',
    500: '#d92323',
    600: '#b01818',
    700: '#871212',
    800: '#5f0d0d',
    900: '#3a0808'
  },
  neutral: {
    50: '#f7f8fc',
    100: '#eceef6',
    200: '#d3d7e6',
    300: '#aeb5cf',
    400: '#7e87ad',
    500: '#5c6491',
    600: '#434a72',
    700: '#303656',
    800: '#1f2340',
    900: '#11142a'
  },
  // Twilight sky gradient stops for the parallax deep background.
  sky: {
    top: '#0d0820',
    mid: '#1b1432',
    horizon: '#3b2a5e',
    glow: '#6b4a8c'
  }
};

// 💡 إضافة مسارات استدعاء باقي صور اللعبة الأصلية محلياً لتستخدمها باقي الملفات
export const gameAssets = {
  background: 'background.png',
  starShard: 'starshard.png',
  aetherHeart: 'aetherheart.png'
};

// Convert a hex color to a 0xRRGGBB number for PixiJS.
export function hexToNum(hex) {
  return parseInt(hex.replace('#', ''), 16);
}

// Lighten/darken a hex color by a percentage (-1..1). Returns a hex string.
export function shade(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent);
  const nr = Math.round((t - r) * p) + r;
  const ng = Math.round((t - g) * p) + g;
  const nb = Math.round((t - b) * p) + b;
  return `#${((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1)}`;
}

// Build a vertical gradient texture (cached on the provided renderer).
const gradientCache = new Map();
export function makeVerticalGradient(renderer, w, h, stops) {
  const key = `${w}x${h}:${stops.map(s => s.color + s.offset).join('|')}`;
  const cached = gradientCache.get(key);
  if (cached && !cached.destroyed) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  for (const s of stops) grad.addColorStop(s.offset, s.color);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const tex = renderer.generateTexture(canvas);
  gradientCache.set(key, tex);
  return tex;
}

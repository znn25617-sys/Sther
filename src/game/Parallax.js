// Parallax.js
// Three-layer parallax scrolling background with a Ghibli / watercolor aesthetic.
// Layer 1: deep twilight sky gradient (slowest).
// Layer 2: glowing silhouette trees (mid).
// Layer 3: floating foreground crystals (fastest, in front).
import { Container, Sprite, Graphics } from 'pixi.js';
import { makeVerticalGradient } from './Palette.js';

// ---- Layer 1: Twilight sky -------------------------------------------------
function buildSky(renderer, w, h) {
  const tex = makeVerticalGradient(renderer, w, h, [
    { offset: 0, color: '#0d0820' },
    { offset: 0.45, color: '#1b1432' },
    { offset: 0.8, color: '#3b2a5e' },
    { offset: 1, color: '#6b4a8c' }
  ]);
  const spr = new Sprite(tex);
  spr.width = w;
  spr.height = h;
  return spr;
}

// Soft glowing orbs (stars/moons) drawn into the sky layer.
function buildStars(renderer, w, h, count = 60) {
  const g = new Graphics();
  for (let i = 0; i < count; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h * 0.7;
    const r = Math.random() * 1.6 + 0.4;
    const a = 0.3 + Math.random() * 0.6;
    g.beginFill(0xffffff, a);
    g.drawCircle(x, y, r);
    g.endFill();
    // Soft halo
    g.beginFill(0xffffff, a * 0.15);
    g.drawCircle(x, y, r * 3);
    g.endFill();
  }
  return g;
}

// ---- Layer 2: Silhouette trees --------------------------------------------
// Returns a container of two tiling tree-silhouette strips for parallax wrap.
function buildTreeStrip(renderer, stripWidth, stripHeight, color, treeCount) {
  const canvas = document.createElement('canvas');
  canvas.width = stripWidth;
  canvas.height = stripHeight;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  // Rolling ground hill
  ctx.beginPath();
  ctx.moveTo(0, stripHeight);
  for (let x = 0; x <= stripWidth; x += 24) {
    const y = stripHeight * 0.7 + Math.sin(x * 0.02) * 14 + Math.sin(x * 0.007) * 22;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(stripWidth, stripHeight);
  ctx.closePath();
  ctx.fill();
  // Trees as simple soft triangles with glow
  for (let i = 0; i < treeCount; i++) {
    const tx = (i / treeCount) * stripWidth + (Math.random() - 0.5) * 30;
    const baseY = stripHeight * 0.7 + Math.sin(tx * 0.02) * 14 + Math.sin(tx * 0.007) * 22;
    const th = 60 + Math.random() * 90;
    const tw = 18 + Math.random() * 14;
    // Trunk
    ctx.fillStyle = shadeColor(color, -0.2);
    ctx.fillRect(tx - 3, baseY - th * 0.3, 6, th * 0.3 + 8);
    // Canopy (watercolor-ish soft circle stack)
    ctx.fillStyle = color;
    for (let l = 0; l < 3; l++) {
      ctx.beginPath();
      ctx.arc(tx, baseY - th + l * 14, tw - l * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Inner glow
    ctx.fillStyle = shadeColor(color, 0.25);
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(tx - tw * 0.2, baseY - th + 6, tw * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  const tex = renderer.generateTexture(canvas);
  return tex;
}

function shadeColor(hex, percent) {
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

// ---- Layer 3: Floating foreground crystals --------------------------------
function buildCrystalStrip(renderer, stripWidth, stripHeight, color, count) {
  const canvas = document.createElement('canvas');
  canvas.width = stripWidth;
  canvas.height = stripHeight;
  const ctx = canvas.getContext('2d');
  for (let i = 0; i < count; i++) {
    const x = (i / count) * stripWidth + (Math.random() - 0.5) * 40;
    const y = Math.random() * stripHeight;
    const size = 10 + Math.random() * 22;
    drawCrystal(ctx, x, y, size, color);
  }
  const tex = renderer.generateTexture(canvas);
  return tex;
}

function drawCrystal(ctx, x, y, size, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.random() * Math.PI);
  // Glow
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 2.4);
  grad.addColorStop(0, color);
  grad.addColorStop(0.4, color + 'aa');
  grad.addColorStop(1, color + '00');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, size * 2.4, 0, Math.PI * 2);
  ctx.fill();
  // Diamond shape
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.6, 0);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.6, 0);
  ctx.closePath();
  ctx.fill();
  // Highlight
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.25, -size * 0.3);
  ctx.lineTo(0, 0);
  ctx.lineTo(-size * 0.25, -size * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export class Parallax {
  constructor(renderer, viewW, viewH) {
    this.renderer = renderer;
    this.viewW = viewW;
    this.viewH = viewH;
    this.container = new Container();

    // Layer 1: sky (fixed-ish, very slow parallax)
    this.sky = buildSky(renderer, viewW, viewH);
    this.stars = buildStars(renderer, viewW, viewH, 70);
    this.container.addChild(this.sky);
    this.container.addChild(this.stars);

    // Layer 2: two tree silhouette strips at different depths
    const stripW = Math.max(viewW * 2, 1600);
    const treeTexFar = buildTreeStrip(renderer, stripW, viewH, '#241a4a', 14);
    const treeTexNear = buildTreeStrip(renderer, stripW, viewH, '#0f0a26', 22);
    this.treesFar = new Sprite(treeTexFar);
    this.treesFar.y = 0;
    this.treesFarW = stripW;
    this.treesNear = new Sprite(treeTexNear);
    this.treesNear.y = 0;
    this.treesNearW = stripW;
    this.container.addChild(this.treesFar);
    this.container.addChild(this.treesNear);

    // Layer 3: foreground floating crystals (fastest)
    const crystalW = Math.max(viewW * 2, 1600);
    this.crystalTex = buildCrystalStrip(renderer, crystalW, viewH, '#b6a0ff', 16);
    this.crystals = new Sprite(this.crystalTex);
    this.crystalsW = crystalW;
    this.container.addChild(this.crystals);

    // Parallax factors
    this.factorSky = 0.02;
    this.factorTreesFar = 0.25;
    this.factorTreesNear = 0.5;
    this.factorCrystals = 0.85;
  }

  // `cameraX` is the world camera X. Layers wrap by tiling.
  update(cameraX, viewW) {
    this.viewW = viewW;
    // Stars drift very slowly and twinkle via subtle position.
    this.stars.x = -(cameraX * this.factorSky) % viewW;

    // Tree strips wrap around their width.
    this.treesFar.x = -((cameraX * this.factorTreesFar) % this.treesFarW);
    if (this.treesFar.x > 0) this.treesFar.x -= this.treesFarW;
    this.treesNear.x = -((cameraX * this.factorTreesNear) % this.treesNearW);
    if (this.treesNear.x > 0) this.treesNear.x -= this.treesNearW;

    // Crystals wrap faster.
    this.crystals.x = -((cameraX * this.factorCrystals) % this.crystalsW);
    if (this.crystals.x > 0) this.crystals.x -= this.crystalsW;
  }

  resize(viewW, viewH) {
    this.viewW = viewW;
    this.viewH = viewH;
    this.sky.width = viewW;
    this.sky.height = viewH;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}

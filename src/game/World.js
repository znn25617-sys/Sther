// World.js
// Procedurally generated world: ground, floating platforms, treasures, and
// hazards (abyss gaps). Infinite scroll-right generation with chunk recycling.
import { Container, Graphics } from 'pixi.js';
import { hexToNum } from './Palette.js';
import { Treasure, TREASURE_TYPES } from './Treasure.js';

const CHUNK_W = 900;       // width of each generated chunk
const GROUND_H = 90;       // ground band height
const PLATFORM_MIN_W = 120;
const PLATFORM_MAX_W = 260;
const PLATFORM_MIN_Y = 120; // from bottom
const PLATFORM_MAX_Y = 360;

// A simple deterministic PRNG (mulberry32) for reproducible chunks.
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class World {
  constructor(renderer, viewH) {
    this.renderer = renderer;
    this.viewH = viewH;
    this.container = new Container();
    this.solids = [];     // {x,y,w,h}
    this.treasures = [];
    this.chunks = [];     // generated chunks metadata
    this.groundGfx = new Graphics();
    this.platformGfx = new Graphics();
    this.treasureLayer = new Container();
    this.container.addChild(this.groundGfx);
    this.container.addChild(this.platformGfx);
    this.container.addChild(this.treasureLayer);
    this.rightEdge = 0;   // world X up to which we've generated
    this.seed = (Math.random() * 1e9) | 0;
    this.rng = mulberry32(this.seed);
    this.chunkIndex = 0;
  }

  // Reset the world for a new run.
  reset(viewH) {
    this.viewH = viewH;
    this.solids = [];
    this.treasures = [];
    this.chunks = [];
    this.rightEdge = 0;
    this.chunkIndex = 0;
    this.seed = (Math.random() * 1e9) | 0;
    this.rng = mulberry32(this.seed);
    this.groundGfx.clear();
    this.platformGfx.clear();
    for (const t of this.treasures) t.destroy();
    this.treasures = [];
    this.treasureLayer.removeChildren();
    // First chunk is a safe flat runway.
    this.generateInitial();
  }

  generateInitial() {
    const groundY = this.viewH - GROUND_H;
    const chunk = {
      index: 0,
      x: 0,
      width: CHUNK_W,
      ground: { x: 0, y: groundY, w: CHUNK_W, h: GROUND_H },
      platforms: [],
      hasGap: false
    };
    this.solids.push(chunk.ground);
    this.chunks.push(chunk);
    this.rightEdge = CHUNK_W;
    this.chunkIndex = 1;
    // A few starter treasures on the ground.
    for (let i = 0; i < 3; i++) {
      this.spawnTreasure(TREASURE_TYPES.STARSHARD, 220 + i * 120, groundY - 60);
    }
    this.redrawGround();
  }

  generateNext() {
    const groundY = this.viewH - GROUND_H;
    const startX = this.rightEdge;
    // ~30% of chunks have a gap the player must jump over.
    const hasGap = this.chunkIndex > 1 && this.rng() < 0.3;
    const gapW = hasGap ? 90 + Math.floor(this.rng() * 90) : 0;

    const chunk = {
      index: this.chunkIndex,
      x: startX,
      width: CHUNK_W,
      ground: null,
      platforms: [],
      hasGap
    };

    // Ground segment (after the gap if present).
    const groundX = startX + gapW;
    const groundW = CHUNK_W - gapW;
    if (groundW > 0) {
      chunk.ground = { x: groundX, y: groundY, w: groundW, h: GROUND_H };
      this.solids.push(chunk.ground);
    }

    // Floating platforms: 1-3 per chunk.
    const platformCount = 1 + Math.floor(this.rng() * 3);
    for (let i = 0; i < platformCount; i++) {
      const pw = PLATFORM_MIN_W + Math.floor(this.rng() * (PLATFORM_MAX_W - PLATFORM_MIN_W));
      const px = groundX + 40 + this.rng() * Math.max(40, groundW - pw - 80);
      const pyOff = PLATFORM_MIN_Y + this.rng() * (PLATFORM_MAX_Y - PLATFORM_MIN_Y);
      const py = groundY - pyOff;
      const plat = { x: px, y: py, w: pw, h: 18 };
      chunk.platforms.push(plat);
      this.solids.push(plat);
    }

    // Treasures: place on platforms and over ground.
    for (const plat of chunk.platforms) {
      const tcount = 1 + Math.floor(this.rng() * 3);
      for (let i = 0; i < tcount; i++) {
        const tx = plat.x + 24 + (i / Math.max(1, tcount - 1)) * (plat.w - 48);
        const ty = plat.y - 30;
        const isHeart = this.rng() < 0.12;
        this.spawnTreasure(
          isHeart ? TREASURE_TYPES.AETHER_HEART : TREASURE_TYPES.STARSHARD,
          tx, ty
        );
      }
    }
    // Some ground-level treasures in gaps (risky pickups).
    if (hasGap && this.rng() < 0.5) {
      const tx = startX + gapW * 0.5;
      this.spawnTreasure(TREASURE_TYPES.AETHER_HEART, tx, groundY - 120);
    }

    this.chunks.push(chunk);
    this.rightEdge = startX + CHUNK_W;
    this.chunkIndex++;
    this.redrawGround();
    this.redrawPlatforms();
  }

  spawnTreasure(type, x, y) {
    const t = new Treasure(type, x, y);
    this.treasures.push(t);
    this.treasureLayer.addChild(t.container);
  }

  redrawGround() {
    const g = this.groundGfx;
    g.clear();
    for (const s of this.solids) {
      if (s.h >= GROUND_H) {
        // Ground band with watercolor top edge.
        g.beginFill(hexToNum('#1a1330'));
        g.drawRect(s.x, s.y, s.w, s.h);
        g.endFill();
        // Glowing top grass line.
        g.beginFill(hexToNum('#3de584'), 0.85);
        g.drawRect(s.x, s.y, s.w, 4);
        g.endFill();
        g.beginFill(hexToNum('#74f5ad'), 0.3);
        g.drawRect(s.x, s.y - 2, s.w, 2);
        g.endFill();
        // Subtle texture dots.
        g.beginFill(hexToNum('#271a57'), 0.5);
        for (let dx = 0; dx < s.w; dx += 28) {
          g.drawCircle(s.x + dx + 8, s.y + 18 + ((dx * 7) % 20), 2);
        }
        g.endFill();
      }
    }
  }

  redrawPlatforms() {
    const g = this.platformGfx;
    g.clear();
    for (const s of this.solids) {
      if (s.h < GROUND_H) {
        // Floating stone platform with glow underside.
        g.beginFill(hexToNum('#2a2050'));
        g.drawRoundedRect(s.x, s.y, s.w, s.h, 8);
        g.endFill();
        g.beginFill(hexToNum('#54d6f7'), 0.7);
        g.drawRoundedRect(s.x, s.y, s.w, 3, 2);
        g.endFill();
        g.beginFill(hexToNum('#b6a0ff'), 0.25);
        g.drawRoundedRect(s.x - 2, s.y + s.h - 4, s.w + 4, 4, 2);
        g.endFill();
      }
    }
  }

  // Recycle chunks/treasures that are far behind the camera to save memory.
  recycle(cameraX) {
    const cullBehind = cameraX - 400;
    // Remove solids that are fully behind the camera and not the ground runway.
    this.solids = this.solids.filter(s => {
      const keep = s.x + s.w > cullBehind;
      return keep;
    });
    // Cull treasures behind the camera.
    const kept = [];
    for (const t of this.treasures) {
      if (t.x < cullBehind && !t.collected) {
        t.destroy();
      } else {
        kept.push(t);
      }
    }
    this.treasures = kept;
    this.redrawGround();
    this.redrawPlatforms();
  }

  update(dt, cameraX) {
    // Generate ahead of the camera.
    while (this.rightEdge < cameraX + 1600) {
      this.generateNext();
    }
    // Recycle behind.
    if (this.chunks.length > 6) {
      this.recycle(cameraX);
    }
    // Update treasures.
    for (const t of this.treasures) {
      if (!t.collected) t.update(dt);
    }
  }

  // Returns uncollected treasures overlapping the player rect.
  collectOverlaps(playerRect) {
    const collected = [];
    for (const t of this.treasures) {
      if (!t.collected && t.overlaps(playerRect)) {
        t.collected = true;
        t.container.visible = false;
        collected.push(t);
      }
    }
    return collected;
  }

  destroy() {
    this.container.destroy({ children: true });
    for (const t of this.treasures) t.destroy();
    this.treasures = [];
  }
}

export { CHUNK_W, GROUND_H };

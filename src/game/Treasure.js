// Treasure.js
// Collectible treasures: "Starshards" (yellow glow, common) and rare
// "Aether Hearts" (rotating purple crystals). Procedurally drawn.
import { Container, Graphics } from 'pixi.js';
import { hexToNum } from './Palette.js';
import { aabbOverlap, safeRect, FALLBACK_W, FALLBACK_H } from './Physics.js';

export const TREASURE_TYPES = {
  STARSHARD: 'starshard',
  AETHER_HEART: 'aether_heart'
};

export const TREASURE_VALUES = {
  starshard: 10,
  aether_heart: 100
};

function drawStarshard(g, size, tint) {
  g.clear();
  // Glow
  g.beginFill(tint, 0.25);
  g.drawCircle(0, 0, size * 2);
  g.endFill();
  g.beginFill(tint, 0.4);
  g.drawCircle(0, 0, size * 1.4);
  g.endFill();
  // 4-point star
  g.beginFill(tint);
  g.moveTo(0, -size);
  g.lineTo(size * 0.3, -size * 0.3);
  g.lineTo(size, 0);
  g.lineTo(size * 0.3, size * 0.3);
  g.lineTo(0, size);
  g.lineTo(-size * 0.3, size * 0.3);
  g.lineTo(-size, 0);
  g.lineTo(-size * 0.3, -size * 0.3);
  g.closePath();
  g.endFill();
  // Inner highlight
  g.beginFill(0xffffff, 0.8);
  g.moveTo(0, -size * 0.6);
  g.lineTo(size * 0.16, -size * 0.16);
  g.lineTo(0, 0);
  g.lineTo(-size * 0.16, -size * 0.16);
  g.closePath();
  g.endFill();
}

function drawAetherHeart(g, size, tint) {
  g.clear();
  // Outer glow
  g.beginFill(tint, 0.25);
  g.drawCircle(0, 0, size * 2.2);
  g.endFill();
  // Crystal diamond
  g.beginFill(tint);
  g.moveTo(0, -size);
  g.lineTo(size * 0.7, 0);
  g.lineTo(0, size);
  g.lineTo(-size * 0.7, 0);
  g.closePath();
  g.endFill();
  // Facets
  g.beginFill(0xffffff, 0.35);
  g.moveTo(0, -size);
  g.lineTo(size * 0.35, -size * 0.2);
  g.lineTo(0, 0);
  g.lineTo(-size * 0.35, -size * 0.2);
  g.closePath();
  g.endFill();
  g.beginFill(0x000000, 0.15);
  g.moveTo(0, 0);
  g.lineTo(size * 0.7, 0);
  g.lineTo(0, size);
  g.closePath();
  g.endFill();
}

export class Treasure {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.size = type === TREASURE_TYPES.AETHER_HEART ? 16 : 12;
    this.w = this.size * 2;
    this.h = this.size * 2;
    this.collected = false;
    this.phase = Math.random() * Math.PI * 2;
    this.baseY = y;
    this.rot = 0;

    this.container = new Container();
    this.container.position.set(x, y);
    this.gfx = new Graphics();
    this.container.addChild(this.gfx);

    this.tint = type === TREASURE_TYPES.AETHER_HEART
      ? hexToNum('#b6a0ff')
      : hexToNum('#ffd97f');

    this.redraw();
  }

  redraw() {
    if (this.type === TREASURE_TYPES.AETHER_HEART) {
      drawAetherHeart(this.gfx, this.size, this.tint);
    } else {
      drawStarshard(this.gfx, this.size, this.tint);
    }
  }

  // AABB centered on the treasure's anchor. Uses safeRect() so missing or
  // non-finite fields never produce a malformed box that would throw in
  // aabbOverlap during the collision resolution cycle.
  get rect() {
    const w = this.w || FALLBACK_W;
    const h = this.h || FALLBACK_H;
    return safeRect({
      x: (this.x || 0) - w / 2,
      y: (this.baseY != null ? this.baseY : this.y || 0) - h / 2,
      w,
      h
    });
  }

  overlaps(playerRect) {
    return aabbOverlap(this.rect, playerRect);
  }

  update(dt) {
    this.phase += dt * 2.2;
    this.rot += dt * (this.type === TREASURE_TYPES.AETHER_HEART ? 1.6 : 0.8);
    this.y = this.baseY + Math.sin(this.phase) * 6;
    this.container.position.set(this.x, this.y);
    this.container.rotation = this.rot;
  }

  destroy() {
    this.container.destroy({ children: true });
  }
}

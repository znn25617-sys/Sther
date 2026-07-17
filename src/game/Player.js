// Player.js
// Iris — the player character. Updated to load the native image asset with local bounds.
import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import { hexToNum } from './Palette.js';
import { createBody } from './Physics.js';

const PLAYER_W = 40;
const PLAYER_H = 52;

// Generate the glowing aura texture once.
function makeAuraTexture(renderer) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 6, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(180,160,255,0.55)');
  g.addColorStop(0.4, 'rgba(120,90,230,0.22)');
  g.addColorStop(1, 'rgba(120,90,230,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return renderer.generateTexture(canvas);
}

export class Player {
  constructor(renderer) {
    this.renderer = renderer;
    this.container = new Container();
    this.body = createBody(0, 0, PLAYER_W, PLAYER_H, { tag: 'player' });

    // Aura glow sprite (behind the body).
    this.auraTex = makeAuraTexture(renderer);
    this.aura = new Sprite(this.auraTex);
    this.aura.anchor.set(0.5);
    this.aura.tint = hexToNum('#b6a0ff');
    this.aura.alpha = 0.8;
    this.container.addChild(this.aura);

    // 💡 ضبط سحب واستدعاء الصورة الأصلية بدلاً من الرسم البرمجي
    this.playerTexture = Texture.from('player.png');
    this.sprite = new Sprite(this.playerTexture);
    this.sprite.anchor.set(0.5);
    this.sprite.width = PLAYER_W;
    this.sprite.height = PLAYER_H;
    this.container.addChild(this.sprite);

    // Body graphics (retained for structural alignment and flicker effect).
    this.gfx = new Graphics();
    this.container.addChild(this.gfx);

    // Animation state
    this.facing = 1;
    this.bob = 0;           // float bob phase
    this.squash = 1;        // scale Y
    this.stretch = 1;       // scale X
    this.targetSquash = 1;
    this.targetStretch = 1;
    this.glowPhase = 0;
    this.alive = true;
    this.invuln = 0;        // invulnerability timer after hit

    this.redraw();
  }

  setPosition(x, y) {
    this.body.x = x;
    this.body.y = y;
  }

  get x() { return this.body.x; }
  get y() { return this.body.y; }
  get cx() { return this.body.x + this.body.w / 2; }
  get cy() { return this.body.y + this.body.h / 2; }

  redraw() {
    const g = this.gfx;
    g.clear();

    const flicker = this.invuln > 0 && Math.floor(this.invuln * 20) % 2 === 0;
    
    // 💡 صمام أمان للتحكم في ظهور واختفاء الصورة الأصلية عند وميض الضرر (Flicker)
    if (flicker) {
      this.sprite.visible = false;
      return;
    } else {
      this.sprite.visible = true;
    }
  }

  // Trigger jump squash & stretch.
  jumpAnim() {
    this.targetStretch = 0.8;
    this.targetSquash = 1.25;
  }

  // Trigger landing squash.
  landAnim() {
    this.targetStretch = 1.25;
    this.targetSquash = 0.8;
  }

  hit() {
    if (this.invuln > 0) return false;
    this.invuln = 1.2;
    return true;
  }

  update(dt, onGroundPrev) {
    this.bob += dt * 3.2;
    this.glowPhase += dt * 2;

    // Squash/stretch easing back to neutral.
    this.squash += (this.targetSquash - this.squash) * Math.min(1, dt * 12);
    this.stretch += (this.targetStretch - this.stretch) * Math.min(1, dt * 12);
    this.targetSquash += (1 - this.targetSquash) * Math.min(1, dt * 8);
    this.targetStretch += (1 - this.targetStretch) * Math.min(1, dt * 8);

    if (this.invuln > 0) this.invuln -= dt;

    // Landing detection -> squash.
    if (this.body.onGround && !onGroundPrev) this.landAnim();

    // Position the container at the body center, applying squash + float bob.
    const floatY = this.body.onGround ? 0 : Math.sin(this.bob) * 2;
    this.container.position.set(this.cx, this.cy + floatY);
    this.container.scale.set(this.facing * this.stretch, this.squash);

    // Aura pulse.
    const pulse = 1 + Math.sin(this.glowPhase) * 0.08;
    this.aura.scale.set(pulse * 1.3);
    this.aura.alpha = 0.55 + Math.sin(this.glowPhase) * 0.15;
    this.aura.position.set(0, 0);

    this.redraw();
  }

  destroy() {
    this.container.destroy({ children: true });
    if (this.auraTex) this.auraTex.destroy(true);
  }
}

export { PLAYER_W, PLAYER_H };

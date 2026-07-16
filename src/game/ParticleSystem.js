// ParticleSystem.js
// A dynamic PixiJS particle emitter for magical dust trails and glowing bursts.
// Uses a single ParticleContainer for batched rendering at 60fps+.
import { ParticleContainer, Sprite, BLEND_MODES } from 'pixi.js';
import { hexToNum } from './Palette.js';

// A cheap circular glow texture generated once and tinted per-particle.
function makeGlowTexture(renderer, size = 64) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.65)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = renderer.generateTexture(canvas);
  return tex;
}

// A single particle instance (pooled, never re-allocated per frame).
class Particle {
  constructor(sprite) {
    this.sprite = sprite;
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 1;
    this.startScale = 1;
    this.endScale = 0;
    this.startAlpha = 1;
    this.endAlpha = 0;
    this.tint = 0xffffff;
    this.drag = 0.9;
    this.gravity = 0;
    this.rotation = 0;
    this.rotSpeed = 0;
  }

  reset(opts) {
    this.x = opts.x;
    this.y = opts.y;
    this.vx = opts.vx ?? 0;
    this.vy = opts.vy ?? 0;
    this.life = opts.life;
    this.maxLife = opts.life;
    this.startScale = opts.startScale ?? 1;
    this.endScale = opts.endScale ?? 0;
    this.startAlpha = opts.startAlpha ?? 1;
    this.endAlpha = opts.endAlpha ?? 0;
    this.tint = opts.tint ?? 0xffffff;
    this.drag = opts.drag ?? 0.9;
    this.gravity = opts.gravity ?? 0;
    this.rotation = opts.rotation ?? 0;
    this.rotSpeed = opts.rotSpeed ?? 0;
    this.active = true;
    this.sprite.visible = true;
    this.sprite.tint = this.tint;
  }

  update(dt) {
    if (!this.active) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.active = false;
      this.sprite.visible = false;
      return;
    }
    const t = 1 - this.life / this.maxLife; // 0..1 progress
    this.vy += this.gravity * dt;
    this.vx *= Math.pow(this.drag, dt * 60);
    this.vy *= Math.pow(this.drag, dt * 60);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rotation += this.rotSpeed * dt;
    const scale = this.startScale + (this.endScale - this.startScale) * t;
    const alpha = this.startAlpha + (this.endAlpha - this.startAlpha) * t;
    this.sprite.position.set(this.x, this.y);
    this.sprite.scale.set(scale);
    this.sprite.alpha = alpha;
    this.sprite.rotation = this.rotation;
  }
}

export class ParticleSystem {
  constructor(renderer, maxParticles = 400) {
    this.renderer = renderer;
    this.maxParticles = maxParticles;
    this.container = new ParticleContainer(maxParticles, {
      scale: true,
      position: true,
      rotation: true,
      tint: true,
      alpha: true,
      vertices: false,
      uvs: false
    });
    this.texture = makeGlowTexture(renderer, 64);
    this.particles = [];
    this.cursor = 0;
    for (let i = 0; i < maxParticles; i++) {
      const spr = new Sprite(this.texture);
      spr.anchor.set(0.5);
      spr.visible = false;
      // Additive blending for a glowing magical look.
      spr.blendMode = BLEND_MODES.ADD;
      this.container.addChild(spr);
      this.particles.push(new Particle(spr));
    }
  }

  // Emit a single particle with the given options.
  emit(opts) {
    // Find next inactive particle (ring buffer).
    for (let i = 0; i < this.maxParticles; i++) {
      const idx = (this.cursor + i) % this.maxParticles;
      const p = this.particles[idx];
      if (!p.active) {
        p.reset(opts);
        this.cursor = (idx + 1) % this.maxParticles;
        return;
      }
    }
    // Pool full — overwrite the oldest by cursor.
    this.particles[this.cursor].reset(opts);
    this.cursor = (this.cursor + 1) % this.maxParticles;
  }

  // Spawn a trail of magical dust behind the player.
  emitTrail(x, y, facing = 1) {
    for (let i = 0; i < 2; i++) {
      this.emit({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 16,
        vx: -facing * (20 + Math.random() * 40) + (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30 - 10,
        life: 0.6 + Math.random() * 0.4,
        startScale: 0.5 + Math.random() * 0.3,
        endScale: 0,
        startAlpha: 0.8,
        endAlpha: 0,
        tint: Math.random() > 0.5 ? hexToNum('#b6a0ff') : hexToNum('#54d6f7'),
        drag: 0.86,
        gravity: -40
      });
    }
  }

  // Spawn a glowing burst when a treasure is collected.
  emitBurst(x, y, color, count = 18) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 120 + Math.random() * 180;
      this.emit({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.7 + Math.random() * 0.4,
        startScale: 0.8 + Math.random() * 0.4,
        endScale: 0,
        startAlpha: 1,
        endAlpha: 0,
        tint: color,
        drag: 0.9,
        gravity: 120,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 8
      });
    }
  }

  // Ambient floating sparkles across the viewport.
  emitAmbient(x, y) {
    this.emit({
      x,
      y,
      vx: (Math.random() - 0.5) * 12,
      vy: -10 - Math.random() * 20,
      life: 2 + Math.random() * 2,
      startScale: 0.2 + Math.random() * 0.2,
      endScale: 0,
      startAlpha: 0.5,
      endAlpha: 0,
      tint: Math.random() > 0.5 ? hexToNum('#ffe9a8') : hexToNum('#d4c7ff'),
      drag: 0.98,
      gravity: -8
    });
  }

  update(dt) {
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles[i].update(dt);
    }
  }

  // Attach the particle container above a given parent layer.
  attach(parent, index) {
    if (index != null) parent.addChildAt(this.container, index);
    else parent.addChild(this.container);
  }

  setOffset(x, y) {
    this.container.position.set(x, y);
  }

  destroy() {
    this.container.destroy({ children: true });
    if (this.texture) this.texture.destroy(true);
    this.particles = [];
  }
}

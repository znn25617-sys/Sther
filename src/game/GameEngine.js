// GameEngine.js
// The core game loop, physics integration, camera, scoring, and lives.
// Owns PixiJS stage + ticker and exposes callbacks for React (HUD/store).

import { Application, Container } from 'pixi.js';
import { Player } from './Player.js';
import { World, GROUND_H } from './World.js';
import { ParticleSystem } from './ParticleSystem.js';
import { Parallax } from './Parallax.js';
import {
  applyGravity, resolveCollisions, tryJump, applyHorizontalControl, clamp, getRect
} from './Physics.js';
import {
  input, attachKeyboard, detachKeyboard, pressJump, releaseJump,
  getTouchWalkDir, resetInput
} from './Input.js';
import { TREASURE_VALUES } from './Treasure.js';
import { hexToNum } from './Palette.js';

const START_LIVES = 3;
const PLAYER_START_X = 220;

export class GameEngine {
  constructor({ canvas, viewW, viewH, onScore, onLives, onGameOver, onReady }) {
    this.canvas = canvas;
    this.viewW = viewW;
    this.viewH = viewH;
    this.onScore = onScore;
    this.onLives = onLives;
    this.onGameOver = onGameOver;
    this.onReady = onReady;

    this.score = 0;
    this.lives = START_LIVES;
    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    this.cameraX = 0;

    // PixiJS application (WebGL, 60fps ticker).
    this.app = new Application({
      view: canvas,
      width: viewW,
      height: viewH,
      backgroundColor: 0x0d0820,
      antialias: true,
      autoDensity: true,
      resolution: Math.min(window.devicePixelRatio || 1, 2),
      autoStart: false
    });

    this.stage = this.app.stage;
    this.worldLayer = new Container();
    this.stage.addChild(this.worldLayer);

    // Parallax background (fixed to screen, scrolls via camera).
    this.parallax = new Parallax(this.app.renderer, viewW, viewH);
    this.stage.addChildAt(this.parallax.container, 0);

    // World (platforms + treasures).
    this.world = new World(this.app.renderer, viewH);
    this.worldLayer.addChild(this.world.container);

    // Player.
    this.player = new Player(this.app.renderer);
    this.worldLayer.addChild(this.player.container);

    // Particle system (in screen space, offset by camera for world trails).
    this.particles = new ParticleSystem(this.app.renderer, 500);
    this.stage.addChild(this.particles.container);

    // Bind the ticker to our fixed-step update.
    this.app.ticker.add(this.tick, this);
    attachKeyboard();
  }

  start() {
    this.reset();
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this.app.start();
  }

  reset() {
    this.score = 0;
    this.lives = START_LIVES;
    this.cameraX = 0;
    this.world.reset(this.viewH);
    this.player.setPosition(PLAYER_START_X, this.viewH - GROUND_H - 60);
    this.player.alive = true;
    this.player.invuln = 0;
    resetInput();
    this.onScore?.(this.score);
    this.onLives?.(this.lives);
  }

  pause() {
    this.paused = true;
  }

  resume() {
    if (!this.running) return;
    this.paused = false;
    this.lastTime = performance.now();
  }

  resize(viewW, viewH) {
    this.viewW = viewW;
    this.viewH = viewH;
    this.app.renderer.resize(viewW, viewH);
    this.parallax.resize(viewW, viewH);
    // Rebuild world ground band to match new height.
    this.world.reset(viewH);
    this.player.setPosition(PLAYER_START_X, viewH - GROUND_H - 60);
  }

  tick(deltaFactor) {
    if (!this.running || this.paused) return;
    // Convert PIXI ticker delta (frames@60) to seconds, clamp for stability.
    const dt = Math.min((deltaFactor / 60), 0.05);
    this.update(dt);
    this.render();
  }

  update(dt) {
    const p = this.player;

    // --- Input -> movement intent -----------------------------------------
    let dir = 0;
    if (input.left) dir -= 1;
    if (input.right) dir += 1;
    const touchDir = getTouchWalkDir();
    if (touchDir !== 0) dir = touchDir;
    if (dir !== 0) p.facing = dir > 0 ? 1 : -1;

    // --- Horizontal control + friction ------------------------------------
    applyHorizontalControl(p.body, dir, dt, p.body.onGround);

    // --- Jump (buffered + coyote) -----------------------------------------
    if (input.jump) {
      const jumped = tryJump(p.body, dt);
      if (jumped) p.jumpAnim();
      input.jump = false;
    }

    // --- Gravity + collision resolution -----------------------------------
    const onGroundPrev = p.body.onGround;
    applyGravity(p.body, dt);
    resolveCollisions(p.body, this.world.solids, dt);

    // --- World generation / recycling -------------------------------------
    this.world.update(dt, this.cameraX);

    // --- Camera follows player (smooth, look-ahead) -----------------------
    const targetCam = p.body.x - this.viewW * 0.35;
    this.cameraX = clamp(
      this.cameraX + (targetCam - this.cameraX) * Math.min(1, dt * 5),
      0, this.world.rightEdge - this.viewW
    );
    this.worldLayer.x = -this.cameraX;
    this.parallax.update(this.cameraX, this.viewW);

    // --- Particles --------------------------------------------------------
    // Trail behind player when moving or in air.
    if (Math.abs(p.body.vx) > 40 || !p.body.onGround) {
      this.particles.emitTrail(p.cx - this.cameraX, p.cy + 14, p.facing);
    }
    // Ambient sparkles across the screen.
    if (Math.random() < 0.25) {
      this.particles.emitAmbient(Math.random() * this.viewW, this.viewH * (0.5 + Math.random() * 0.4));
    }
    this.particles.update(dt);

    // --- Treasure collection ----------------------------------------------
    // Route through getRect() so a malformed body never throws here.
    const pRect = getRect(p.body);
    const collected = this.world.collectOverlaps(pRect);
    for (const t of collected) {
      const value = TREASURE_VALUES[t.type] || 10;
      this.score += value;
      const color = t.type === 'aether_heart' ? hexToNum('#b6a0ff') : hexToNum('#ffd97f');
      this.particles.emitBurst(t.x - this.cameraX, t.y, color, t.type === 'aether_heart' ? 26 : 16);
      this.onScore?.(this.score);
    }

    // --- Falling off the world (hazard) -----------------------------------
    if (p.body.y > this.viewH + 200) {
      this.loseLife();
    }

    // --- Player update (animations) --------------------------------------
    p.update(dt, onGroundPrev);
  }

  loseLife() {
    this.lives -= 1;
    this.onLives?.(this.lives);
    if (this.lives <= 0) {
      
      this.gameOver();
    } else {
      // Respawn at a safe spot near the camera.
      this.player.setPosition(this.cameraX + 180, this.viewH - GROUND_H - 80);
      this.player.body.vx = 0;
      this.player.body.vy = 0;
      this.player.invuln = 1.2;
    }
  }

  gameOver() {
    this.running = false;
    this.onGameOver?.(this.score);
  }

  render() {
    // The PixiJS ticker auto-renders after update; nothing extra needed.
  }

  // Programmatic controls for QA capture scripts.
  captureMoveRight() { input.right = true; input.left = false; }
  captureStop() { input.right = false; input.left = false; }
  captureJump() { pressJump(); setTimeout(releaseJump, 120); }

  destroy() {
    this.app.ticker.remove(this.tick, this);
    detachKeyboard();
    this.app.stop();
    this.player?.destroy();
    this.world?.destroy();
    this.particles?.destroy();
    this.parallax?.destroy();
    this.app.destroy(true, { children: true });
  }
}

export { START_LIVES };

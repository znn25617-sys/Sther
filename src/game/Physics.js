// Physics.js
// Lightweight custom 2D arcade physics: gravity, velocity, AABB collision.
// Pure math functions — no side effects, no globals.

// Default physical constants tuned for a fluid, floaty magical platformer.
export const GRAVITY = 2400;       // px/s^2 (strong but snappy)
export const MOVE_ACCEL = 4200;    // horizontal acceleration while input held
export const MAX_RUN_SPEED = 360;  // cap on horizontal run speed
export const FRICTION = 2600;      // deceleration when no input on ground
export const AIR_FRICTION = 700;   // reduced deceleration in the air
export const JUMP_VELOCITY = -880; // initial upward velocity on jump
export const MAX_FALL_SPEED = 1300;
export const COYOTE_TIME = 0.10;   // grace window after leaving ground (s)
export const JUMP_BUFFER = 0.12;   // early-press grace window (s)

// A rigid body in the world. `rect` is the AABB in world coords.
export function createBody(x, y, w, h, opts = {}) {
  return {
    x, y, w, h,
    vx: 0,
    vy: 0,
    onGround: false,
    wasOnGround: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    solid: opts.solid ?? true,
    static: opts.static ?? false,
    bounciness: opts.bounciness ?? 0,
    tag: opts.tag ?? 'body'
  };
}

export function getRect(body) {
  return { x: body.x, y: body.y, w: body.w, h: body.h };
}

// Standard AABB overlap test (axis-aligned bounding boxes).
export function aabbOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

// Swept AABB: returns normalized hit normal {x,y} and time of collision (0..1),
// or null if no collision this frame. Used to prevent tunnelling at high speeds.
export function sweptAABB(dynamic, staticRect, dt) {
  const dx = dynamic.vx * dt;
  const dy = dynamic.vy * dt;

  // Expand the static box by the dynamic box's half-extents to reduce to a
  // point-vs-rect sweep.
  const expanded = {
    x: staticRect.x - dynamic.w / 2,
    y: staticRect.y - dynamic.h / 2,
    w: staticRect.w + dynamic.w,
    h: staticRect.h + dynamic.h
  };

  const cx = dynamic.x + dynamic.w / 2;
  const cy = dynamic.y + dynamic.h / 2;

  // Broad-phase: skip if moving away from the box entirely.
  if (dx > 0 && cx > expanded.x + expanded.w) return null;
  if (dx < 0 && cx < expanded.x) return null;
  if (dy > 0 && cy > expanded.y + expanded.h) return null;
  if (dy < 0 && cy < expanded.y) return null;

  let tFirstX = 0;
  let tLastX = 1;
  let tFirstY = 0;
  let tLastY = 1;

  if (dx > 0) {
    tFirstX = (expanded.x - (cx + dynamic.w / 2)) / dx;
    tLastX = ((expanded.x + expanded.w) - (cx - dynamic.w / 2)) / dx;
  } else if (dx < 0) {
    tFirstX = ((expanded.x + expanded.w) - (cx - dynamic.w / 2)) / dx;
    tLastX = (expanded.x - (cx + dynamic.w / 2)) / dx;
  } else {
    if (cx + dynamic.w / 2 < expanded.x || cx - dynamic.w / 2 > expanded.x + expanded.w) {
      return null;
    }
  }

  if (dy > 0) {
    tFirstY = (expanded.y - (cy + dynamic.h / 2)) / dy;
    tLastY = ((expanded.y + expanded.h) - (cy - dynamic.h / 2)) / dy;
  } else if (dy < 0) {
    tFirstY = ((expanded.y + expanded.h) - (cy - dynamic.h / 2)) / dy;
    tLastY = (expanded.y - (cy + dynamic.h / 2)) / dy;
  } else {
    if (cy + dynamic.h / 2 < expanded.y || cy - dynamic.h / 2 > expanded.y + expanded.h) {
      return null;
    }
  }

  const tEnter = Math.max(tFirstX, tFirstY);
  const tExit = Math.min(tLastX, tLastY);

  if (tEnter > tExit || tEnter > 1 || tEnter < 0) return null;

  // Determine the hit normal from whichever axis was entered first.
  let nx = 0;
  let ny = 0;
  if (tFirstX > tFirstY) {
    nx = dx > 0 ? -1 : 1;
  } else {
    ny = dy > 0 ? -1 : 1;
  }

  return { nx, ny, t: tEnter };
}

// Apply gravity to a dynamic body for one time step.
export function applyGravity(body, dt, gravity = GRAVITY) {
  if (body.static) return body;
  body.vy += gravity * dt;
  if (body.vy > MAX_FALL_SPEED) body.vy = MAX_FALL_SPEED;
  return body;
}

// Resolve a single dynamic body against an array of static solid rects.
// Mutates body position/velocity and sets onGround. Returns the body.
export function resolveCollisions(body, solids, dt) {
  body.wasOnGround = body.onGround;
  body.onGround = false;

  // Integrate motion along each axis separately for stable arcade collision.
  body.x += body.vx * dt;
  for (const s of solids) {
    const r = { x: s.x, y: s.y, w: s.w, h: s.h };
    if (aabbOverlap(getRect(body), r)) {
      if (body.vx > 0) {
        body.x = r.x - body.w;
      } else if (body.vx < 0) {
        body.x = r.x + r.w;
      }
      body.vx = 0;
    }
  }

  body.y += body.vy * dt;
  for (const s of solids) {
    const r = { x: s.x, y: s.y, w: s.w, h: s.h };
    if (aabbOverlap(getRect(body), r)) {
      if (body.vy > 0) {
        body.y = r.y - body.h;
        body.onGround = true;
      } else if (body.vy < 0) {
        body.y = r.y + r.h;
      }
      body.vy = 0;
    }
  }

  // Coyote-time window: keep a small grace after walking off a ledge.
  if (body.onGround) {
    body.coyoteTimer = COYOTE_TIME;
  } else if (body.coyoteTimer > 0) {
    body.coyoteTimer -= dt;
  }

  return body;
}

// Attempt a buffered jump. Returns true if a jump was actually performed.
export function tryJump(body, dt) {
  body.jumpBufferTimer = JUMP_BUFFER;
  const grounded = body.onGround || body.coyoteTimer > 0;
  if (grounded && body.jumpBufferTimer > 0) {
    body.vy = JUMP_VELOCITY;
    body.onGround = false;
    body.coyoteTimer = 0;
    body.jumpBufferTimer = 0;
    return true;
  }
  // Decrement buffer each call regardless.
  if (body.jumpBufferTimer > 0) body.jumpBufferTimer -= dt;
  return false;
}

// Clamp horizontal velocity to MAX_RUN_SPEED and apply ground/air friction.
export function applyHorizontalControl(body, inputDir, dt, onGround) {
  if (inputDir !== 0) {
    body.vx += inputDir * MOVE_ACCEL * dt;
    if (body.vx > MAX_RUN_SPEED) body.vx = MAX_RUN_SPEED;
    if (body.vx < -MAX_RUN_SPEED) body.vx = -MAX_RUN_SPEED;
  } else {
    const f = onGround ? FRICTION : AIR_FRICTION;
    if (body.vx > 0) {
      body.vx = Math.max(0, body.vx - f * dt);
    } else if (body.vx < 0) {
      body.vx = Math.min(0, body.vx + f * dt);
    }
  }
  return body;
}

// Linear interpolation helper.
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Clamp helper.
export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

// Distance between two points.
export function dist(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

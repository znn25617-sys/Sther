// Physics.js
// Lightweight custom 2D arcade physics: gravity, velocity, AABB collision.
// Pure math functions — no side effects, no globals.
//
// getRect() is the hardened entry point for every AABB used in the engine.
// It is the fix for the production-minification crash "t.getLocalBounds is
// not a function": a plain physics body ({x,y,w,h}) has no getLocalBounds, so
// any code path that calls it on a plain object throws after minification
// renames the symbol. We only ever invoke getLocalBounds after verifying it is
// a function, wrap the call in try/catch, validate the result is finite, and
// fall back to a safe numeric rectangle so the engine never red-screens.

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

// Safe fallback dimensions if a body is missing or malformed. Shared across
// the engine so every rect constructor stays consistent.
export const FALLBACK_W = 40;
export const FALLBACK_H = 52;

// Coerce a possibly-undefined/non-finite value to a safe finite number.
function finite(value, fallback) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

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

// Build a safe AABB rectangle from any body-like object.
export function getRect(body) {
  if (body == null) {
    return { x: 0, y: 0, w: FALLBACK_W, h: FALLBACK_H };
  }

  // الحماية القصوى والمعدلة لمنع انهيار تصفح الهاتف والـ Minification تماماً
  try {
    if (body && typeof body.getLocalBounds === 'function') {
      const b = body.getLocalBounds(); // الاستدعاء المباشر والأمن للسياق
      if (
        b &&
        Number.isFinite(b.x) &&
        Number.isFinite(b.y) &&
        Number.isFinite(b.width) &&
        Number.isFinite(b.height) &&
        (b.width > 0 || b.height > 0)
      ) {
        return {
          x: finite(body.x, 0) + b.x,
          y: finite(body.y, 0) + b.y,
          w: b.width || FALLBACK_W,
          h: b.height || FALLBACK_H
        };
      }
    }
  } catch (err) {
    // قمع وتجاوز أي خطأ قد يحدث أثناء الاستدعاء الداخلي لمحرك الرسوميات
  }

  // Numeric AABB fallback — the requested safe rectangle.
  return {
    x: finite(body.x, 0),
    y: finite(body.y, 0),
    w: finite(body.w, FALLBACK_W),
    h: finite(body.h, FALLBACK_H)
  };
}

// Build a safe rect from explicit numeric fields. Same never-throws contract.
export function safeRect(obj) {
  if (obj == null) return { x: 0, y: 0, w: FALLBACK_W, h: FALLBACK_H };
  return {
    x: finite(obj.x, 0),
    y: finite(obj.y, 0),
    w: finite(obj.w, finite(obj.width, FALLBACK_W)),
    h: finite(obj.h, finite(obj.height, FALLBACK_H))
  };
}

// Standard AABB overlap test (axis-aligned bounding boxes).
export function aabbOverlap(a, b) {
  const ax = finite(a?.x, 0);
  const ay = finite(a?.y, 0);
  const aw = finite(a?.w, 0);
  const ah = finite(a?.h, 0);
  const bx = finite(b?.x, 0);
  const by = finite(b?.y, 0);
  const bw = finite(b?.w, 0);
  const bh = finite(b?.h, 0);
  return (
    ax < bx + bw &&
    ax + aw > bx &&
    ay < by + bh &&
    ay + ah > by
  );
}

// Swept AABB: returns normalized hit normal {x,y} and time of collision (0..1)
export function sweptAABB(dynamic, staticRect, dt) {
  const dx = dynamic.vx * dt;
  const dy = dynamic.vy * dt;

  const expanded = {
    x: staticRect.x - dynamic.w / 2,
    y: staticRect.y - dynamic.h / 2,
    w: staticRect.w + dynamic.w,
    h: staticRect.h + dynamic.h
  };

  const cx = dynamic.x + dynamic.w / 2;
  const cy = dynamic.y + dynamic.h / 2;

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
export function resolveCollisions(body, solids, dt) {
  body.wasOnGround = body.onGround;
  body.onGround = false;

  body.x += body.vx * dt;
  for (const s of solids) {
    if (s == null) continue;
    const r = getRect(s);
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
    if (s == null) continue;
    const r = getRect(s);
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

  if (body.onGround) {
    body.coyoteTimer = COYOTE_TIME;
  } else if (body.coyoteTimer > 0) {
    body.coyoteTimer -= dt;
  }

  return body;
}

// Attempt a buffered jump. Optimized for mobile touch events.
export function tryJump(body, dt) {
  if (body.jumpBufferTimer === undefined || body.jumpBufferTimer <= 0) {
    body.jumpBufferTimer = JUMP_BUFFER;
  }
  const grounded = body.onGround || body.coyoteTimer > 0;
  if (grounded && body.jumpBufferTimer > 0) {
    body.vy = JUMP_VELOCITY;
    body.onGround = false;
    body.coyoteTimer = 0;
    body.jumpBufferTimer = 0;
    return true;
  }
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

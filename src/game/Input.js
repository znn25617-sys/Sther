// Input.js
// Multi-device input: keyboard (desktop) + touch zones (mobile/tablet).
// Exposes a single shared `input` state read by the game loop each frame.

// Global input state consumed by the game loop.
export const input = {
  left: false,
  right: false,
  jump: false,        // edge-triggered: set on press, cleared after consumed
  jumpHeld: false,
  pause: false
};

// Keyboard handling (desktop). Arrow keys / WASD to move, Space to jump.
const keyMap = {
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ArrowUp: 'jump', KeyW: 'jump', Space: 'jump'
};

function onKeyDown(e) {
  const action = keyMap[e.code];
  if (!action) return;
  e.preventDefault();
  if (action === 'jump') {
    if (!input.jumpHeld) input.jump = true;
    input.jumpHeld = true;
  } else {
    input[action] = true;
  }
}

function onKeyUp(e) {
  const action = keyMap[e.code];
  if (!action) return;
  e.preventDefault();
  if (action === 'jump') {
    input.jumpHeld = false;
  } else {
    input[action] = false;
  }
}

let attached = false;
export function attachKeyboard() {
  if (attached) return;
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  attached = true;
}

export function detachKeyboard() {
  if (!attached) return;
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  attached = false;
}

// Touch handling (mobile/tablet). The left half of the screen walks toward
// the touch X; a dedicated jump button is rendered in the DOM HUD and calls
// `pressJump()` / `releaseJump()` directly.
let touchWalkDir = 0;
export function getTouchWalkDir() {
  return touchWalkDir;
}
export function setTouchWalkDir(d) {
  touchWalkDir = d;
}

export function pressJump() {
  input.jump = true;
  input.jumpHeld = true;
  // Fire-and-forget haptic feedback on jump.
  import('../lib/haptics.js').then((m) => m.hapticMedium()).catch(() => {});
}
export function releaseJump() {
  input.jumpHeld = false;
}

// Programmatic control (used by automated capture / QA scripts).
export function setInput(name, value) {
  if (name in input) input[name] = value;
}

export function resetInput() {
  input.left = false;
  input.right = false;
  input.jump = false;
  input.jumpHeld = false;
  input.pause = false;
  touchWalkDir = 0;
}

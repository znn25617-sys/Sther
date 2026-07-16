// TouchControls.jsx
// On-screen controls for mobile/tablet: a left/right walk zone on the left
// half of the screen and a jump button on the right. Hidden on desktop.
import { useEffect, useRef } from 'react';
import { setTouchWalkDir, pressJump, releaseJump } from '../game/Input.js';

export default function TouchControls() {
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const jumpRef = useRef(null);

  // Helper: bind press/release pointer events to a callback.
  function bindPressRelease(el, onDown, onUp) {
    if (!el) return () => {};
    const down = (e) => { e.preventDefault(); onDown(); };
    const up = (e) => { e.preventDefault(); if (onUp) onUp(); };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('pointercancel', up);
    return () => {
      el.removeEventListener('pointerdown', down);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointerleave', up);
      el.removeEventListener('pointercancel', up);
    };
  }

  useEffect(() => {
    const cleanups = [
      bindPressRelease(leftRef.current, () => setTouchWalkDir(-1), () => setTouchWalkDir(0)),
      bindPressRelease(rightRef.current, () => setTouchWalkDir(1), () => setTouchWalkDir(0)),
      bindPressRelease(jumpRef.current, () => pressJump(), () => releaseJump())
    ];
    return () => cleanups.forEach((c) => c());
  }, []);

  return (
    <div className="touch-controls">
      <div className="touch-dpad">
        <button ref={leftRef} className="touch-btn touch-left" aria-label="Move left">
          {'\u25C0'}
        </button>
        <button ref={rightRef} className="touch-btn touch-right" aria-label="Move right">
          {'\u25B6'}
        </button>
      </div>
      <button ref={jumpRef} className="touch-btn touch-jump" aria-label="Jump">
        {'\u2191'}
      </button>
    </div>
  );
}

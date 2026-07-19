// HUD.jsx
// Responsive mobile HUD overlay for Android: score, lives, pause/mute, and
// the virtual touch controls (left/right D-pad + jump button) integrated into
// the HUD as required. Pure DOM/CSS overlay rendered above the PixiJS canvas.
// Ripple effects are handled globally by App.jsx's delegated listener; here we
// only add the .ripple-btn class and wire the press/release game controls.
import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore.js';
import { setTouchWalkDir, pressJump, releaseJump } from '../game/Input.js';
import { hapticLight } from '../lib/haptics.js';

// eslint-disable-next-line react/prop-types
function Hearts({ lives }) {
  const max = 3;
  const items = [];
  for (let i = 0; i < max; i++) {
    const filled = i < lives;
    items.push(
      <span key={i} className={`hud-heart ${filled ? 'filled' : 'empty'}`}>
        {filled ? '\u2665' : '\u2661'}
      </span>
    );
  }
  return <div className="hud-hearts">{items}</div>;
}

function TouchControls() {
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const jumpRef = useRef(null);

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
      bindPressRelease(
        leftRef.current,
        () => { setTouchWalkDir(-1); hapticLight(); },
        () => setTouchWalkDir(0)
      ),
      bindPressRelease(
        rightRef.current,
        () => { setTouchWalkDir(1); hapticLight(); },
        () => setTouchWalkDir(0)
      ),
      bindPressRelease(jumpRef.current, () => pressJump(), () => releaseJump())
    ];
    return () => cleanups.forEach((c) => c());
  }, []);

  return (
    <div className="touch-controls">
      <div className="touch-dpad">
        <button ref={leftRef} className="touch-btn touch-left ripple-btn" aria-label="Move left">
          {'\u25C0'}
        </button>
        <button ref={rightRef} className="touch-btn touch-right ripple-btn" aria-label="Move right">
          {'\u25B6'}
        </button>
      </div>
      <button ref={jumpRef} className="touch-btn touch-jump ripple-btn" aria-label="Jump">
        {'\u2191'}
      </button>
    </div>
  );
}

export default function HUD() {
  const score = useGameStore((s) => s.score);
  const lives = useGameStore((s) => s.lives);
  const highScore = useGameStore((s) => s.highScore);
  const muted = useGameStore((s) => s.muted);
  const toggleMuted = useGameStore((s) => s.toggleMuted);
  const pauseGame = useGameStore((s) => s.pauseGame);

  return (
    <div className="hud">
      <div className="hud-top">
        <div className="hud-cluster hud-left">
          <div className="hud-pill">
            <span className="hud-label">SCORE</span>
            <span className="hud-value">{score.toLocaleString()}</span>
          </div>
          <div className="hud-pill hud-best">
            <span className="hud-label">BEST</span>
            <span className="hud-value">{highScore.toLocaleString()}</span>
          </div>
        </div>
        <div className="hud-cluster hud-right">
          <Hearts lives={lives} />
          <button className="hud-btn ripple-btn" onClick={toggleMuted} aria-label="Toggle sound">
            {muted ? '\u{1F507}' : '\u{1F50A}'}
          </button>
          <button className="hud-btn ripple-btn" onClick={pauseGame} aria-label="Pause">
            {'\u23F8'}
          </button>
        </div>
      </div>

      {/* Virtual touch controls integrated into the HUD for Android. */}
      <TouchControls />
    </div>
  );
}

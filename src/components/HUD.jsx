// HUD.jsx
// Responsive in-game overlay: score, lives (hearts), pause button, and mute.
// Pure DOM/CSS overlay rendered above the PixiJS canvas.
import { useGameStore } from '../store/gameStore.js';

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
          <button className="hud-btn" onClick={toggleMuted} aria-label="Toggle sound">
            {muted ? '\u{1F507}' : '\u{1F50A}'}
          </button>
          <button className="hud-btn" onClick={pauseGame} aria-label="Pause">
            {'\u23F8'}
          </button>
        </div>
      </div>
    </div>
  );
}

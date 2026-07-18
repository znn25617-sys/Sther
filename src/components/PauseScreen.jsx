// PauseScreen.jsx
// Overlay shown when the game is paused: resume + quit to menu.
import { useGameStore } from '../store/gameStore.js';

export default function PauseScreen() {
  const resumeGame = useGameStore((s) => s.resumeGame);
  const backToMenu = useGameStore((s) => s.backToMenu);

  return (
    <div className="overlay pause-screen">
      <div className="pause-content">
        <h1 className="pause-title">Paused</h1>
        <p className="pause-subtitle">The realm waits for your return.</p>
        <div className="pause-actions">
          <button className="primary-btn" onClick={resumeGame}>Resume</button>
          <button className="secondary-btn" onClick={backToMenu}>Quit to Menu</button>
        </div>
      </div>
    </div>
  );
}

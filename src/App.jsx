// App.jsx
// Core game-state router for the Android build. Mounts the PixiJS canvas once
// and swaps the DOM overlay (menu / HUD / pause / game over) based on the
// Zustand status. Touch controls live inside the HUD for the playing state.
import GameCanvas from './game/GameCanvas.jsx';
import HUD from './components/HUD.jsx';
import StartScreen from './components/StartScreen.jsx';
import PauseScreen from './components/PauseScreen.jsx';
import GameOverScreen from './components/GameOverScreen.jsx';
import { useGameStore, GAME_STATUS } from './store/gameStore.js';
import './App.css';

export default function App() {
  const status = useGameStore((s) => s.status);

  return (
    <div className="app-root">
      {/* The PixiJS canvas is always mounted so the engine persists across
          menu <-> play <-> game-over transitions without re-initializing. */}
      <GameCanvas />

      {status === GAME_STATUS.PLAYING && <HUD />}

      {status === GAME_STATUS.PAUSED && (
        <>
          <HUD />
          <PauseScreen />
        </>
      )}

      {status === GAME_STATUS.MENU && <StartScreen />}

      {status === GAME_STATUS.GAMEOVER && <GameOverScreen />}
    </div>
  );
}

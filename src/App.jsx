// App.jsx
// Core game-state router for the Android build. Mounts the PixiJS canvas once
// and swaps the DOM overlay (menu / HUD / pause / game over) based on the
// Zustand status. Touch controls live inside the HUD for the playing state.
//
// A React ErrorBoundary wraps the whole tree so a render-time crash shows a
// visible error card instead of a black screen. A loading gate hides the
// overlays until the PixiJS engine reports it is ready, isolating React
// rendering from PixiJS/WebGL initialization.
import { useState } from 'react';
import GameCanvas from './game/GameCanvas.jsx';
import HUD from './components/HUD.jsx';
import StartScreen from './components/StartScreen.jsx';
import PauseScreen from './components/PauseScreen.jsx';
import GameOverScreen from './components/GameOverScreen.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { useGameStore, GAME_STATUS } from './store/gameStore.js';
import './App.css';

export default function App() {
  const status = useGameStore((s) => s.status);
  // `ready` flips true once the PixiJS engine has mounted without error.
  const [ready, setReady] = useState(false);

  return (
    <ErrorBoundary>
      <div className="app-root">
        {/* The PixiJS canvas is always mounted so the engine persists across
            menu <-> play <-> game-over transitions without re-initializing.
            It calls onReady once initialization completes (or onError). */}
        <GameCanvas onReady={() => setReady(true)} />

        {/* The inline boot loader (from index.html) stays visible until React
            takes over. Once the engine is ready we render the game overlays. */}
        {ready && status === GAME_STATUS.PLAYING && <HUD />}

        {ready && status === GAME_STATUS.PAUSED && (
          <>
            <HUD />
            <PauseScreen />
          </>
        )}

        {ready && status === GAME_STATUS.MENU && <StartScreen />}

        {ready && status === GAME_STATUS.GAMEOVER && <GameOverScreen />}
      </div>
    </ErrorBoundary>
  );
}

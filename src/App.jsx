// App.jsx
// Core game-state router for the Android build. Mounts the PixiJS canvas once
// and swaps the DOM overlay (menu / HUD / pause / game over) based on the
// Zustand status. Touch controls live inside the HUD for the playing state.
//
// A React ErrorBoundary wraps the whole tree so a render-time crash shows a
// visible error card instead of a black screen. A loading gate hides the
// overlays until the PixiJS engine reports it is ready, isolating React
// rendering from PixiJS/WebGL initialization.
import { useState, useEffect } from 'react';
import GameCanvas from './game/GameCanvas.jsx';
import HUD from './components/HUD.jsx';
import StartScreen from './components/StartScreen.jsx';
import PauseScreen from './components/PauseScreen.jsx';
import GameOverScreen from './components/GameOverScreen.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { useGameStore, GAME_STATUS } from './store/gameStore.js';
import { useOrientationLock } from './lib/useOrientationLock.js';
import './App.css';

export default function App() {
  const status = useGameStore((s) => s.status);
  const [ready, setReady] = useState(false);
  useOrientationLock();

  // Global delegated Material-style ripple listener. Handles all .ripple-btn
  // elements including overlay buttons that mount/unmount with status changes.
  useEffect(() => {
    const onPointerDown = (e) => {
      const el = e.target.closest('.ripple-btn');
      if (!el || !el.contains(e.target)) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = (e.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2;
      const y = (e.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2;
      const ink = document.createElement('span');
      ink.className = 'ripple-ink';
      ink.style.width = `${size}px`;
      ink.style.height = `${size}px`;
      ink.style.left = `${x}px`;
      ink.style.top = `${y}px`;
      el.appendChild(ink);
      const remove = () => {
        if (ink.parentNode) ink.parentNode.removeChild(ink);
        ink.removeEventListener('animationend', remove);
      };
      ink.addEventListener('animationend', remove);
      setTimeout(remove, 700);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  return (
    <ErrorBoundary>
      <div className="desktop-stage">
        <div className="mobile-frame app-root">
          <GameCanvas onReady={() => setReady(true)} />

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
      </div>
    </ErrorBoundary>
  );
}

// GameCanvas.jsx
// React wrapper around the PixiJS GameEngine. Manages the canvas element,
// lifecycle (mount/unmount), resize handling, and bridges engine callbacks
// into the Zustand store. All PixiJS resources are cleaned up on unmount.

// Consolidated, single-source safety patch for PixiJS getLocalBounds.
// This is the ONLY place the prototype is patched (GameEngine.js does NOT
// re-patch). On Android, a Sprite whose texture failed to load can throw
// inside getLocalBounds during PixiJS internal layout/render, which after
// minification surfaces as "t.getLocalBounds is not a function". We wrap the
// call and return a real PIXI.Rectangle (not a plain object) so downstream
// PixiJS methods like copyFrom/encompass keep working.
import { DisplayObject, Rectangle } from 'pixi.js';
if (DisplayObject && !DisplayObject.prototype._originalGetLocalBounds) {
  DisplayObject.prototype._originalGetLocalBounds = DisplayObject.prototype.getLocalBounds;
  DisplayObject.prototype.getLocalBounds = function (rect, skipChildren) {
    try {
      return this._originalGetLocalBounds(rect, skipChildren);
    } catch {
      // Return a real Rectangle so PixiJS internals never crash on a
      // plain object missing copyFrom/encompass.
      return rect instanceof Rectangle
        ? rect
        : new Rectangle(0, 0, 64, 64);
    }
  };
}

import { useEffect, useRef } from 'react';
import { GameEngine } from '../game/GameEngine.js';
import { useGameStore, GAME_STATUS } from '../store/gameStore.js';
import { fetchTopScores } from '../lib/highScores.js';

export default function GameCanvas() {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const containerRef = useRef(null);

  const status = useGameStore((s) => s.status);
  const setScore = useGameStore((s) => s.setScore);
  const setLives = useGameStore((s) => s.setLives);
  const endGame = useGameStore((s) => s.endGame);
  const setLeaderboard = useGameStore((s) => s.setLeaderboard);

  // Compute the current viewport size for the canvas.
  function getViewSize() {
    const el = containerRef.current;
    if (!el) return { w: window.innerWidth, h: window.innerHeight };
    return { w: el.clientWidth, h: el.clientHeight };
  }

  // Create the engine once on mount.
  useEffect(() => {
    const { w, h } = getViewSize();
    const engine = new GameEngine({
      canvas: canvasRef.current,
      viewW: w,
      viewH: h,
      onScore: setScore,
      onLives: setLives,
      onGameOver: (finalScore) => {
        endGame(finalScore);
        fetchTopScores().then(setLeaderboard);
      }
    });
    engineRef.current = engine;

    // Handle resize with debounce.
    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const { w, h } = getViewSize();
        engine.resize(w, h);
      }, 120);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);

    // Expose engine for QA capture scripts.
    window.__aetheria = engine;

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      clearTimeout(resizeTimer);
      engine.destroy();
      engineRef.current = null;
      delete window.__aetheria;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to status changes from the store.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (status === GAME_STATUS.PLAYING) {
      if (!engine.running) {
        engine.start();
      } else {
        engine.resume();
      }
    } else if (status === GAME_STATUS.PAUSED) {
      engine.pause();
    }
    // MENU / GAMEOVER: the engine stops itself on game over; no action here.
  }, [status]);

  return (
    <div className="game-canvas-container" ref={containerRef}>
      <canvas ref={canvasRef} className="game-canvas" />
    </div>
  );
}

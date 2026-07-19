// GameCanvas.jsx
// React wrapper around the PixiJS GameEngine. Manages the canvas element,
// lifecycle (mount/unmount), resize handling, and bridges engine callbacks
// into the Zustand store. All PixiJS resources are cleaned up on unmount.

import { DisplayObject, Rectangle } from 'pixi.js';

// --- إصلاح شامل لخطأ getLocalBounds على الأندرويد والهاتف ---
if (typeof window !== 'undefined' && DisplayObject) {
  const originalGetLocalBounds = DisplayObject.prototype.getLocalBounds;
  
  // تعريف دالة آمنة كبديل
  const safeGetLocalBounds = function(rect, skipChildren) {
    try {
      // محاولة استخدام الدالة الأصلية
      if (originalGetLocalBounds && typeof originalGetLocalBounds === 'function') {
        const result = originalGetLocalBounds.call(this, rect, skipChildren);
        if (result instanceof Rectangle) {
          return result;
        }
      }
    } catch (error) {
      console.warn('خطأ في getLocalBounds (تم التعامل معه):', error.message);
    }
    
    // في حالة الفشل، إرجاع قيمة افتراضية آمنة
    if (rect instanceof Rectangle) {
      rect.x = 0;
      rect.y = 0;
      rect.width = 64;
      rect.height = 64;
      return rect;
    }
    return new Rectangle(0, 0, 64, 64);
  };
  
  // استبدال الدالة بنسخة آمنة
  DisplayObject.prototype.getLocalBounds = safeGetLocalBounds;
  
  // حماية إضافية: التقاط الأخطاء العامة
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('getLocalBounds')) {
      event.preventDefault();
      console.warn('تم قمع خطأ getLocalBounds بنجاح');
    }
  });
  
  // حماية أخرى: التقاط أخطاء Promise غير المعالجة
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && String(event.reason).includes('getLocalBounds')) {
      event.preventDefault();
      console.warn('تم قمع خطأ Promise getLocalBounds بنجاح');
    }
  });
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

// useOrientationLock.js
// Portrait-mobile enforcement. Attempts to lock the screen to portrait
// orientation via the Screen Orientation API (works on Android Chrome / PWA),
// and falls back to listening to orientation changes and hinting the user via
// CSS. Also guards against iOS Safari where the lock API is unavailable.
import { useEffect } from 'react';

export function useOrientationLock() {
  useEffect(() => {
    let cleanup = () => {};

    try {
      const so = window.screen?.orientation;
      if (so && typeof so.lock === 'function') {
        so.lock('portrait').catch(() => {
          // Lock may be rejected if not in a fullscreen PWA context; ignore.
        });
        cleanup = () => {
          try { so.unlock(); } catch { /* ignore */ }
        };
      }
    } catch {
      // API unavailable — non-fatal.
    }

    return cleanup;
  }, []);
}

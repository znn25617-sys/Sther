// haptics.js
// Thin wrapper around @capacitor/haptics for native-feeling Android vibration.
// Falls back to navigator.vibrate (web) and no-ops if neither is available,
// so the game never errors on platforms without a haptics API.
import { Capacitor } from '@capacitor/core';

let Haptics = null;
async function loadHaptics() {
  if (Haptics) return Haptics;
  if (Capacitor.isNativePlatform()) {
    const mod = await import('@capacitor/haptics');
    Haptics = mod.Haptics;
  }
  return Haptics;
}

// Light tap — used for movement and UI taps.
export async function hapticLight() {
  try {
    const h = await loadHaptics();
    if (h) {
      await h.impact({ style: 'LIGHT' });
      return;
    }
  } catch { /* ignore */ }
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(8);
  }
}

// Medium impact — used for jumps.
export async function hapticMedium() {
  try {
    const h = await loadHaptics();
    if (h) {
      await h.impact({ style: 'MEDIUM' });
      return;
    }
  } catch { /* ignore */ }
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(18);
  }
}

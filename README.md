# Aetheria's Ascent

A magical 2D side-scroller / platformer coin & treasure-collecting game with a
Ghibli / watercolor aesthetic, built for **Android** (APK + AAB) via React +
Vite + PixiJS, wrapped with Capacitor.

## Features

- **PixiJS WebGL rendering** at 60fps+ with a fixed-timestep game loop.
- **Custom 2D physics** — gravity, AABB collisions, swept collision, coyote
  time, and jump buffering (`src/game/Physics.js`).
- **3-layer parallax** twilight sky, silhouette trees, and floating crystals
  (`src/game/Parallax.js`).
- **Particle system** — magical dust trails behind the player and glowing
  bursts when treasures are collected (`src/game/ParticleSystem.js`).
- **Procedural world** — infinite chunked generation with platforms, gaps, and
  treasures; recycling for memory efficiency (`src/game/World.js`).
- **Collectibles** — yellow Starshards and rare rotating purple Aether Hearts.
- **Android touch controls** — virtual D-pad (bottom-left) + jump button
  (bottom-right) integrated into the HUD, with native haptic feedback
  (`@capacitor/haptics`).
- **Global leaderboard** — top scores persisted via Supabase
  (`src/lib/highScores.js`).
- **State management** — Zustand store for game status, score, lives, audio.

## Tech Stack

| Concern        | Choice                          |
|----------------|---------------------------------|
| UI / build     | React 18 + Vite 5               |
| Rendering      | PixiJS 7 (WebGL)                |
| Physics        | Custom 2D arcade (this repo)    |
| State          | Zustand                         |
| Backend        | Supabase (leaderboard)          |
| Mobile bridge  | Capacitor 6 (Android)           |
| Haptics        | @capacitor/haptics              |

## Scripts

| Script              | Description                                       |
|---------------------|---------------------------------------------------|
| `npm run dev`       | Start the Vite dev server.                        |
| `npm run build`     | Production build into `dist/`.                    |
| `npm run preview`   | Preview the built app locally.                    |
| `npm run lint`      | Run ESLint.                                       |
| `npm run cap:sync`  | Build + sync `dist/` into the Android project.    |
| `npm run cap:add`   | Add the native Android platform.                  |
| `npm run cap:open`  | Open the Android project in Android Studio.       |
| `npm run android:build` | Build + sync + Gradle APK & AAB.              |

## Android Controls

- **Move:** left/right D-pad buttons (bottom-left of screen).
- **Jump:** the glowing button on the bottom-right.
- Haptic feedback fires on movement and jumps via Capacitor Haptics.

## CI/CD — Android

`.github/workflows/android-build.yml` runs on every push to `main`:

1. **Web build & QA capture** — lint + Vite build, then a Playwright snapshot
   of the start menu and active gameplay saved as `capture.png` (QA artifact).
2. **Android build** — JDK 17 + Android SDK, `npx cap add android` +
   `npx cap sync android`, then Gradle compiles both the release **APK**
   (`assembleRelease`) and the Play Store **AAB** (`bundleRelease`).
3. **Signing** — release binaries signed with a generated keystore.
4. **Artifacts** — the signed APK, signed AAB, and QA screenshots uploaded as
   workflow artifacts.

## Project Structure

```
src/
  game/
    GameCanvas.jsx     # React wrapper around the PixiJS engine
    GameEngine.js      # Core loop, camera, scoring, lives
    Physics.js         # Gravity, AABB, swept collision, jump feel
    Player.js          # Iris — procedural character + animations
    Treasure.js        # Starshards + Aether Hearts
    World.js           # Procedural chunked world + recycling
    Parallax.js        # 3-layer scrolling background
    ParticleSystem.js  # Glowing dust + burst particles
    Input.js           # Keyboard + touch input
    Palette.js         # Color system + gradient textures
  components/
    HUD.jsx            # Mobile score/lives overlay + virtual touch controls
    StartScreen.jsx    # Main menu + leaderboard
    GameOverScreen.jsx # Final score + submission + board
    PauseScreen.jsx    # Pause overlay
  store/
    gameStore.js       # Zustand global state
  lib/
    supabaseClient.js  # Supabase singleton
    highScores.js      # Leaderboard API
    haptics.js         # Capacitor haptics wrapper
scripts/
  capture.mjs          # Playwright QA capture script
.github/workflows/
  android-build.yml    # Android APK + AAB pipeline
capacitor.config.json  # Capacitor Android config (appId, webDir: dist)
```

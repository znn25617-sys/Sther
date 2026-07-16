# Aetheria's Ascent

A magical 2D side-scroller / platformer coin & treasure-collecting game with a
Ghibli / watercolor aesthetic. Built with React + Vite + PixiJS and a custom
2D arcade physics engine.

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
- **Multi-device input** — keyboard (Arrow keys / WASD + Space) and on-screen
  touch controls for mobile/tablet (`src/game/Input.js`,
  `src/components/TouchControls.jsx`).
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
| Desktop        | Electron (electron-builder)     |
| Mobile shell   | Capacitor (config included)     |
| PWA            | vite-plugin-pwa                 |

## Scripts

| Script              | Description                              |
|---------------------|------------------------------------------|
| `npm run dev`       | Start the Vite dev server.               |
| `npm run build`     | Production build into `dist/`.           |
| `npm run preview`   | Preview the built app locally.           |
| `npm run lint`      | Run ESLint.                              |
| `npm run electron:build` | Build the Windows portable EXE.     |
| `npm run cap:sync`  | Sync `dist/` into native mobile shells.  |

## Controls

- **Desktop:** Arrow keys or WASD to move, Space to jump.
- **Mobile:** On-screen directional pad + jump button.

## CI/CD

`.github/workflows/multiplatform-build.yml` runs on every push to `main`:

1. Lint + Vite production build (PWA-ready `dist/`).
2. Playwright capture: screenshots of the start menu and active gameplay,
   uploaded as a QA artifact.
3. Electron Windows portable `.exe` packaging via electron-builder.
4. Uploads the web build, the Windows EXE, and the QA screenshots as
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
    HUD.jsx            # In-game score / lives / pause overlay
    StartScreen.jsx    # Main menu + leaderboard
    GameOverScreen.jsx # Final score + submission + board
    PauseScreen.jsx    # Pause overlay
    TouchControls.jsx  # Mobile on-screen controls
  store/
    gameStore.js       # Zustand global state
  lib/
    supabaseClient.js  # Supabase singleton
    highScores.js      # Leaderboard API
electron/
  main.cjs             # Electron main process
  preload.cjs          # Preload bridge
scripts/
  capture.mjs          # Playwright QA capture script
.github/workflows/
  multiplatform-build.yml
```

// gameStore.js
// Global game state via Zustand: status, score, lives, high score, audio, name.
import { create } from 'zustand';

export const GAME_STATUS = {
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAMEOVER: 'gameover'
};

export const useGameStore = create((set) => ({
  status: GAME_STATUS.MENU,
  score: 0,
  lives: 3,
  highScore: 0,
  playerName: 'Aether',
  muted: false,
  leaderboard: [],

  setStatus: (status) => set({ status }),
  setScore: (score) => set({ score }),
  setLives: (lives) => set({ lives }),
  setHighScore: (highScore) => set({ highScore }),
  setPlayerName: (playerName) => set({ playerName }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
  setMuted: (muted) => set({ muted }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),

  startGame: () => set({ status: GAME_STATUS.PLAYING, score: 0, lives: 3 }),
  pauseGame: () => set({ status: GAME_STATUS.PAUSED }),
  resumeGame: () => set({ status: GAME_STATUS.PLAYING }),
  endGame: (finalScore) =>
    set((s) => ({
      status: GAME_STATUS.GAMEOVER,
      highScore: Math.max(s.highScore, finalScore),
      score: finalScore
    })),
  backToMenu: () => set({ status: GAME_STATUS.MENU })
}));

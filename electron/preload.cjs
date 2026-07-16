// electron/preload.cjs
// Preload bridge — intentionally minimal. The game runs fully in the renderer.
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('aetheriaDesktop', {
  platform: process.platform,
  version: process.versions.electron
});

// scripts/capture.mjs
// QA visual artifact script: spins up the built web app with Playwright,
// captures a high-resolution screenshot of the start menu, then drives the
// game via the exposed `window.__aetheria` engine API to capture active
// gameplay. Saves both PNGs into artifacts/.
//
// Usage: node scripts/capture.mjs [baseURL]
//   baseURL defaults to http://localhost:4173 (vite preview).
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const baseURL = process.argv[2] || 'http://localhost:4173';
const outDir = path.resolve('artifacts');

async function run() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2
  });
  const page = await context.newPage();

  console.log(`Navigating to ${baseURL} ...`);
  await page.goto(baseURL, { waitUntil: 'networkidle' });

  // 1. Start menu screenshot.
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, 'capture-menu.png'), fullPage: false });
  console.log('Captured start menu -> capture-menu.png');

  // 2. Start the game by clicking the primary "Begin Ascent" button.
  const startBtn = page.locator('.start-btn');
  await startBtn.click();
  await page.waitForTimeout(1500);

  // 3. Drive gameplay via the exposed engine API for a few seconds.
  //    The engine attaches itself to window.__aetheria in GameCanvas.jsx.
  await page.evaluate(() => {
    const eng = window.__aetheria;
    if (!eng) throw new Error('Game engine not exposed on window.__aetheria');
    eng.captureMoveRight();
  });

  // Walk right, jump periodically.
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(700);
    await page.evaluate(() => window.__aetheria?.captureJump());
  }

  // Capture active gameplay.
  await page.screenshot({ path: path.join(outDir, 'capture-gameplay.png'), fullPage: false });
  console.log('Captured active gameplay -> capture-gameplay.png');

  // Combine into a single artifact name expected by the workflow.
  // (We also keep the two individual shots; the workflow zips the folder.)
  await page.screenshot({ path: path.join(outDir, 'capture.png'), fullPage: false });
  console.log('Captured final shot -> capture.png');

  await browser.close();
  console.log('Capture complete.');
}

run().catch((err) => {
  console.error('Capture failed:', err);
  process.exit(1);
});

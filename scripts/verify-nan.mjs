// Renders the lighthouse procedural world in Chromium and reports every
// console warning/error, so NaN-geometry regressions are visible for real.
import * as fs from 'node:fs';
import { chromium } from 'playwright';
import { bundleWorlds } from '../server/engine/bundler.js';
import { synthesizeProceduralScene } from '../server/engine/procedural.js';

const prompt = process.argv[2] || 'A lighthouse on a cliff';
const code = synthesizeProceduralScene(prompt, 'worlds', null, 'hero');
const html = await bundleWorlds(code, null);
const file = '.tmp/nan-check.html';
fs.mkdirSync('.tmp', { recursive: true });
fs.writeFileSync(file, html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
const messages = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) messages.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => messages.push(`pageerror: ${e.message}`));
await page.goto('file://' + fs.realpathSync(file));
await page.waitForTimeout(2500);

const stats = await page.evaluate(() => {
  const stage = document.querySelector('[data-any3d-stage], .stage, canvas');
  const canvas = document.querySelector('canvas');
  return {
    state: document.body.querySelector('[data-state]')?.dataset.state || null,
    hasCanvas: Boolean(canvas),
    canvasSize: canvas ? `${canvas.width}x${canvas.height}` : null,
    stage: Boolean(stage),
    meshes: window.__world?.content ? window.__world.content.children.length : null,
  };
});
await page.screenshot({ path: 'browser-results/nan-check.png' });
await browser.close();

console.log('prompt   :', prompt);
console.log('stats    :', stats);
console.log('console  :', messages.length ? '\n  ' + messages.join('\n  ') : 'clean');
const bad = messages.filter((m) => /NaN|BoundingSphere|position/i.test(m));
console.log(bad.length ? `FAIL: ${bad.length} NaN-related message(s)` : 'PASS: no NaN geometry messages');
process.exitCode = bad.length ? 1 : 0;

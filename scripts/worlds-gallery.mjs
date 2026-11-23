// Renders every procedural worlds category in Chromium, records NaN console
// messages, measures how much of the frame the scene fills, and saves a
// screenshot per scene, so silhouette regressions are easy to spot.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { chromium } from 'playwright';
import { bundleWorlds } from '../server/engine/bundler.js';
import { synthesizeProceduralScene } from '../server/engine/procedural.js';
import { extractPromptSemantics } from '../server/engine/semantics.js';

const SCENES = [
  ['bus', 'A city bus picking up passengers at a bus stop'],
  ['classroom', 'A teacher explaining a lesson at a chalkboard'],
  ['sports', 'A tennis court match with two players'],
  ['office', 'A modern office with computers and chairs'],
  ['city', 'A bustling city street with crosswalks and trams'],
  ['farm', 'A modern automated crop farm with GPS combines'],
  ['park', 'A botanical park with a fountain and benches'],
  ['space', 'A rocket launchpad with a gantry tower'],
  ['harbor', 'A seaside harbor with fishing boats and a pier'],
  ['lighthouse', 'A lighthouse on a cliff'],
  ['airport', 'An airport runway with planes and a control tower'],
  ['campus', 'A university campus with a clock tower and lawn'],
  ['sea', 'A sailboat on the open ocean with waves'],
  ['castle', 'A medieval castle on a hill with towers'],
  ['bakery', 'A baker pulling fresh bread from the oven'],
  ['blacksmith', 'A blacksmith forging a sword at an anvil'],
  ['submarine', 'A submarine underwater near a coral reef'],
  ['wizard', 'A wizard reading spells in a library'],
  ['aviation', 'An aeroplane taking off with landing gear'],
  ['racing', 'A sports car drifting on a race track'],
  ['waterfall', 'A waterfall cascading into a pond with rocks'],
  ['abstract', 'A geometric sculpture of floating metallic rings'],
  ['humanoid', 'A person standing on a pedestal'],
  ['vehicle', 'A futuristic rover on open ground'],
];

const only = (process.argv[2] || '').split(',').map((s) => s.trim()).filter(Boolean);
const picked = only.length ? SCENES.filter(([id]) => only.includes(id)) : SCENES;

const outDir = path.resolve('browser-results/worlds');fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync('.tmp', { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
let consoleLines = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) consoleLines.push(`${m.type()}: ${m.text()}`); });
page.on('pageerror', (e) => consoleLines.push(`pageerror: ${e.message}`));

const results = [];
for (const [id, prompt] of picked) {
  const category = extractPromptSemantics(prompt).category;
  const code = synthesizeProceduralScene(prompt, 'worlds', null, 'hero');
  const html = await bundleWorlds(code, null);
  const file = `.tmp/world-${id}.html`;
  fs.writeFileSync(file, html);

  consoleLines = [];
  await page.goto('file://' + fs.realpathSync(file));
  await page.waitForTimeout(1400);

  const stats = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return { ok: false, reason: 'no canvas' };
    const w = canvas.width, h = canvas.height;
    const off = document.createElement('canvas');
    off.width = w; off.height = h;
    const ctx = off.getContext('2d');
    ctx.drawImage(canvas, 0, 0);
    const data = ctx.getImageData(0, 0, w, h).data;
    let ink = 0, total = 0, minX = w, maxX = -1, minY = h, maxY = -1;
    for (let y = 0; y < h; y += 3) {
      for (let x = 0; x < w; x += 3) {
        const i = (y * w + x) * 4, r = data[i], g = data[i + 1], b = data[i + 2];
        // Scene background is white; anything darker is painted content.
        const painted = r < 246 || g < 246 || b < 246;
        total++;
        if (painted) {
          ink++;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    const meshes = window.__world?.content ? (() => { let n = 0; window.__world.content.traverse((o) => { if (o.isMesh || o.isInstancedMesh) n++; }); return n; })() : null;
    return {
      ok: true,
      w, h,
      coverage: +(ink / Math.max(1, total)).toFixed(3),
      box: maxX < 0 ? null : { l: +(minX / w).toFixed(2), r: +(1 - maxX / w).toFixed(2), t: +(minY / h).toFixed(2), b: +(1 - maxY / h).toFixed(2) },
      meshes,
    };
  });

  await page.screenshot({ path: path.join(outDir, `${id}.png`) });
  const nan = consoleLines.filter((l) => /NaN|BoundingSphere|position\b/i.test(l));
  const other = consoleLines.filter((l) => !/GL Driver Message|GPU stall|ReadPixels|WebGL-/i.test(l) && !nan.includes(l));
  const flags = [];
  if (!stats.ok) flags.push(stats.reason);
  else {
    if (stats.coverage < 0.02) flags.push('almost empty frame');
    if (stats.box && (stats.box.l < 0.02 || stats.box.r < 0.02 || stats.box.t < 0.02 || stats.box.b < 0.02)) flags.push('content near frame edge');
    if (stats.coverage > 0.92) flags.push('frame nearly covered');
  }
  if (nan.length) flags.push(`${nan.length} NaN message(s)`);
  results.push({ id, category, prompt, stats, nan, other, flags });
  console.log(
    `${flags.length ? 'FLAG' : ' ok '} ${id.padEnd(11)} cat=${String(category).padEnd(18)} ` +
    `${stats.ok ? `ink=${stats.coverage} meshes=${stats.meshes} box=${JSON.stringify(stats.box)}` : stats.reason}` +
    (flags.length ? `  << ${flags.join('; ')}` : '')
  );
}

await browser.close();
if (!only.length) fs.writeFileSync('browser-results/worlds/summary.json', JSON.stringify(results, null, 2));

const flagged = results.filter((r) => r.flags.length || r.other.length);
console.log('\nFlagged scenes:', flagged.length);
for (const r of flagged) {
  console.log(` - ${r.id} (${r.category}): ${[...r.flags, ...r.other].join('; ')}`);
}

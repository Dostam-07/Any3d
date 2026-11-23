/**
 * Catch a scene that still draws but no longer looks like itself.
 *
 *   node scripts/verify-still-fidelity.mjs            compare against the committed stills
 *   KEEP=1 node scripts/verify-still-fidelity.mjs      keep .tmp/fidelity for inspection
 *
 * Re-runs the README showcase into .tmp/fidelity (same route as the committed
 * images: real studio, real presentations), then compares each fresh still with
 * the committed one on a coarse luminance grid. That ignores antialiasing and a
 * mid-loop limb, and misses a swapped model, a collapsed silhouette or a scene
 * that turned into a different subject.
 *
 * Needs the dev server (A3D_URL, default http://localhost:5174) and the API on
 * :3001, because the fresh capture goes through the studio like a real run.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const COMMITTED = 'docs/assets/showcase';
const FRESH = '.tmp/fidelity';
const GRID = { w: 64, h: 36 };

let passed = 0;
let failed = 0;
function check(name, ok, detail = '') {
  if (ok) {
    passed += 1;
    console.log(`PASS  ${name}${detail ? `  ${detail}` : ''}`);
  } else {
    failed += 1;
    console.log(`FAIL  ${name}${detail ? `  ${detail}` : ''}`);
  }
}

const keys = fs.readdirSync(COMMITTED)
  .filter((f) => f.endsWith('.png'))
  .map((f) => f.replace(/\.png$/, ''))
  .sort();
check('committed stills exist', keys.length >= 12, `${keys.length} stills`);

fs.rmSync(FRESH, { recursive: true, force: true });
fs.mkdirSync(FRESH, { recursive: true });

console.log(`\ncapturing ${keys.length} stills into ${FRESH} …`);
const started = Date.now();
execFileSync(process.execPath, ['scripts/showcase.mjs'], {
  env: { ...process.env, A3D_OUT: FRESH, A3D_GIFS: '0' },
  stdio: 'inherit',
});
console.log(`captured in ${((Date.now() - started) / 1000).toFixed(1)} s\n`);

/* ---- compare on a coarse luminance grid, inside the browser --------------- */

const browser = await chromium.launch();
const page = await browser.newPage();

const diff = await page.evaluate(async ({ committed, fresh, keys, grid, cross }) => {
  const load = async (b64) => {
    const image = new Image();
    image.src = `data:image/png;base64,${b64}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    return ctx.getImageData(0, 0, image.width, image.height);
  };
  // Mean luminance of each cell of a w x h grid, ignoring transparent pixels.
  const gridOf = (data) => {
    const cells = new Float64Array(grid.w * grid.h).fill(-1);
    for (let y = 0; y < data.height; y += 1) {
      const cy = Math.min(grid.h - 1, Math.floor(y / data.height * grid.h));
      for (let x = 0; x < data.width; x += 1) {
        const i = (y * data.width + x) * 4;
        if (data.data[i + 3] < 16) continue;
        const cx = Math.min(grid.w - 1, Math.floor(x / data.width * grid.w));
        const k = cy * grid.w + cx;
        const luma = 0.2126 * data.data[i] + 0.7152 * data.data[i + 1] + 0.0722 * data.data[i + 2];
        cells[k] = cells[k] < 0 ? luma : cells[k];
      }
    }
    return cells;
  };

  const rows = [];
  for (const [index, key] of keys.entries()) {
    // CROSS=1 pairs every fresh still with the next committed one, which is how
    // this check proves it would notice a scene that stopped being itself.
    const other = cross ? keys[(index + 1) % keys.length] : key;
    const a = gridOf(await load(committed[other]));
    const b = gridOf(await load(fresh[key]));
    let sum = 0;
    let worst = 0;
    let hot = 0;
    let cells = 0;
    for (let k = 0; k < a.length; k += 1) {
      if (a[k] < 0 && b[k] < 0) continue;
      const d = Math.abs((a[k] < 0 ? 0 : a[k]) - (b[k] < 0 ? 0 : b[k]));
      sum += d;
      worst = Math.max(worst, d);
      if (d > 40) hot += 1;
      cells += 1;
    }
    rows.push({ key, mean: +(sum / Math.max(1, cells)).toFixed(2), worst: +worst.toFixed(1), hot: +(hot / Math.max(1, cells)).toFixed(3), cells });
  }
  return rows;
}, {
  cross: process.env.CROSS === '1',
  committed: Object.fromEntries(keys.map((key) => [key, fs.readFileSync(path.join(COMMITTED, `${key}.png`)).toString('base64')])),
  fresh: Object.fromEntries(keys.map((key) => {
    const file = path.join(FRESH, `${key}.png`);
    return [key, fs.existsSync(file) ? fs.readFileSync(file).toString('base64') : ''];
  })),
  keys,
  grid: GRID,
});

await browser.close();

/* ---- thresholds ---------------------------------------------------------- */

// A still captured twice differs only by animation phase and antialiasing: a few
// cells (a swinging crane, a lamp) move hard, the picture does not. A scene that
// stopped being itself moves a third of the frame. So: the mean must stay small
// AND at most a twentieth of the cells may differ strongly.
const MEAN_LIMIT = 3;
const HOT_LIMIT = 0.05;

for (const row of diff) {
  check(`${row.key} matches its committed still`,
    row.mean <= MEAN_LIMIT && row.hot <= HOT_LIMIT,
    `mean ${row.mean} / hot ${(row.hot * 100).toFixed(1)}% / worst ${row.worst} (limit ${MEAN_LIMIT} / ${HOT_LIMIT * 100}%)`);
}

if (!process.env.KEEP) fs.rmSync(FRESH, { recursive: true, force: true });

console.log(`\n${passed}/${passed + failed} still-fidelity checks passed`);
process.exit(failed > 0 ? 1 : 0);

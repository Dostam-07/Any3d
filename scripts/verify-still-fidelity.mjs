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
import { SCENES } from './showcase-scenes.mjs';

const COMMITTED = 'docs/assets/showcase';
const FRESH = '.tmp/fidelity';
const GRID = { w: 64, h: 36, crop: 0.82 };

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

// Presets only: a prompt-only scene is re-composed from its prompt on every run,
// and that composer is not reproducible across machines, so its still is not a
// stable baseline. Those are covered by re-shooting the showcase.
const presetKeys = SCENES.filter((scene) => scene.kind === 'preset').map((scene) => scene.key);
const keys = fs.readdirSync(COMMITTED)
  .filter((f) => f.endsWith('.png'))
  .map((f) => f.replace(/\.png$/, ''))
  .filter((key) => presetKeys.includes(key))
  .sort();
const promptOnly = SCENES.filter((scene) => scene.kind === 'prompt').length;
check('committed preset stills exist', keys.length >= 8,
  `${keys.length} presets${promptOnly ? `, ${promptOnly} prompt-only skipped` : ''}`);

fs.rmSync(FRESH, { recursive: true, force: true });
fs.mkdirSync(FRESH, { recursive: true });

console.log(`\ncapturing every showcase still into ${FRESH} …`);
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
  //
  // Only the top `crop` of the still is looked at, and it is sampled through a
  // scale window: a card still is cropped to the card's content height and width,
  // and both follow font metrics and scrollbar width, so the same scene lands a
  // few percent larger or smaller on another machine. A different scene does not
  // line up at any scale, so searching a small window costs no sensitivity.
  const gridOf = (data, sx, sy) => {
    const cells = new Float64Array(grid.w * grid.h).fill(-1);
    const counts = new Int32Array(grid.w * grid.h);
    const h = Math.floor(data.height * grid.crop);
    const w = data.width;
    const winW = w * sx;
    const winH = h * sy;
    const x0 = (w - winW) / 2;
    for (let y = 0; y < winH; y += 1) {
      const sy0 = Math.min(h - 1, Math.floor(y / sy));
      const cy = Math.min(grid.h - 1, Math.floor(y / winH * grid.h));
      for (let x = 0; x < winW; x += 1) {
        const sx0 = Math.min(w - 1, Math.max(0, Math.floor(x0 + x / sx)));
        const i = (sy0 * w + sx0) * 4;
        if (data.data[i + 3] < 16) continue;
        const cx = Math.min(grid.w - 1, Math.floor(x / winW * grid.w));
        const k = cy * grid.w + cx;
        const luma = 0.2126 * data.data[i] + 0.7152 * data.data[i + 1] + 0.0722 * data.data[i + 2];
        cells[k] = cells[k] < 0 ? luma : cells[k] + luma;
        counts[k] += 1;
      }
    }
    for (let k = 0; k < cells.length; k += 1) if (counts[k] > 0) cells[k] /= counts[k];
    return cells;
  };

  const SCALES = [0.96, 0.98, 1, 1.02, 1.04];
  const rows = [];
  for (const [index, key] of keys.entries()) {
    // CROSS=1 pairs every fresh still with the next committed one, which is how
    // this check proves it would notice a scene that stopped being itself.
    const other = cross ? keys[(index + 1) % keys.length] : key;
    const committedImage = await load(committed[other]);
    const freshImage = await load(fresh[key]);
    let best = null;
    for (const sx of SCALES) {
      const a = gridOf(committedImage, sx, 1);
      const b = gridOf(freshImage, sx, 1);
      for (let shift = -2; shift <= 2; shift += 1) {
        let sum = 0, worst = 0, hot = 0, cells = 0;
        for (let y = 0; y < grid.h; y += 1) {
          const sy = y + shift;
          if (sy < 0 || sy >= grid.h) continue;
          for (let x = 0; x < grid.w; x += 1) {
            const ka = sy * grid.w + x, kb = y * grid.w + x;
            if (a[ka] < 0 && b[kb] < 0) continue;
            const d = Math.abs((a[ka] < 0 ? 0 : a[ka]) - (b[kb] < 0 ? 0 : b[kb]));
            sum += d;
            worst = Math.max(worst, d);
            if (d > 40) hot += 1;
            cells += 1;
          }
        }
        const mean = sum / Math.max(1, cells);
        if (!best || mean < best.mean) best = { mean, worst, hot: hot / Math.max(1, cells), cells, sx, shift };
      }
    }
    rows.push({ key, mean: +best.mean.toFixed(2), worst: +best.worst.toFixed(1), hot: +best.hot.toFixed(3), sx: best.sx, shift: best.shift, cells: best.cells });
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
    `mean ${row.mean} / hot ${(row.hot * 100).toFixed(1)}% / worst ${row.worst} / scale ${row.sx} shift ${row.shift} (limit ${MEAN_LIMIT} / ${HOT_LIMIT * 100}%)`);
}

if (!process.env.KEEP) fs.rmSync(FRESH, { recursive: true, force: true });

console.log(`\n${passed}/${passed + failed} still-fidelity checks passed`);
process.exit(failed > 0 ? 1 : 0);

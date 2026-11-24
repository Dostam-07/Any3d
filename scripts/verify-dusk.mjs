/**
 * The dusk stills must actually be dusk.
 *
 *   node scripts/verify-dusk.mjs
 *
 * The dusk set is captured with `A3D_LOOK=dusk`, which means it goes through the
 * look control, the bundle and the runtime — three places that can quietly drop
 * the look and leave a picture that is lit at noon. Comparing each dusk still
 * with its noon counterpart catches that: an unapplied look makes the two files
 * the same picture, and no layout drift can hide a whole time of day.
 *
 * Pure committed-file check: no dev server needed, so it is cheap in CI.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';

const NOON = 'docs/assets/showcase';
const DUSK = 'docs/assets/showcase/dusk';
// Coarse enough to ignore antialiasing and a mid-loop limb, fine enough that a
// sunset against a noon sky cannot pass.
const GRID = { w: 64, h: 36 };
const MEAN_MIN = 3;
const HOT_MIN = 0.005;
const HOT_DELTA = 40;

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

const names = fs.existsSync(DUSK)
  ? fs.readdirSync(DUSK).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, '')).sort()
  : [];
check('the dusk set exists', names.length >= 6, `${names.length} stills`);

const browser = await chromium.launch();
const page = await browser.newPage();

/** Luminance grid of an image, read through a canvas so any colour space lands. */
async function luminance(file) {
  const b64 = fs.readFileSync(file).toString('base64');
  return page.evaluate(
    async ({ src, grid }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = grid.w;
      canvas.height = grid.h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, grid.w, grid.h);
      const data = ctx.getImageData(0, 0, grid.w, grid.h).data;
      const lum = [];
      for (let i = 0; i < data.length; i += 4) {
        lum.push(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      }
      return lum;
    },
    { src: `data:image/png;base64,${b64}`, grid: GRID },
  );
}

for (const name of names) {
  const noonFile = `${NOON}/${name}.png`;
  if (!fs.existsSync(noonFile)) {
    check(`${name} has a noon twin`, false, `missing ${noonFile}`);
    continue;
  }
  const noon = await luminance(noonFile);
  const dusk = await luminance(`${DUSK}/${name}.png`);
  let sum = 0;
  let hot = 0;
  for (let i = 0; i < noon.length; i += 1) {
    const delta = Math.abs(noon[i] - dusk[i]);
    sum += delta;
    if (delta > HOT_DELTA) hot += 1;
  }
  const mean = sum / noon.length;
  const hotShare = hot / noon.length;
  check(
    `${name} is lit differently from noon`,
    mean >= MEAN_MIN && hotShare >= HOT_MIN,
    `mean Δ ${mean.toFixed(1)}, ${(hotShare * 100).toFixed(0)}% of cells moved`,
  );
}

await browser.close();
console.log(`\n${passed}/${passed + failed} dusk checks passed`);
if (failed) process.exitCode = 1;

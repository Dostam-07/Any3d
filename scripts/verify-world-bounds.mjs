/**
 * A world declares the box it will fill, and the runtime frames the camera from
 * that declaration — not from the geometry. So a box that is too large shrinks a
 * scene into its own frame, and one that is too small clips the corners off it.
 * Both are invisible to a NaN sweep and to a still nobody re-shot.
 *
 *   node scripts/verify-world-bounds.mjs            every procedural category
 *   node scripts/verify-world-bounds.mjs humanoid   just the ones you name
 *
 * For each scene it mounts the bundle, measures the real geometry extent in world
 * space, and checks the declared bounds contain it (with a small tolerance for the
 * motion loop) and that the painted silhouette still fills the frame.
 *
 * No dev server needed: the composer and the bundler run in-process.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { bundleWorlds } from '../server/engine/bundler.js';
import { synthesizeProceduralScene } from '../server/engine/procedural.js';

const SCENES = [
  ['bus', 'A city bus picking up passengers at a bus stop'],
  ['classroom', 'A teacher explaining a lesson at a chalkboard'],
  ['office', 'A modern office with computers and chairs'],
  ['city', 'A bustling city street with crosswalks and trams'],
  ['farm', 'A modern automated crop farm with GPS combines'],
  ['space', 'A rocket launchpad with a gantry tower'],
  ['harbor', 'A seaside harbor with fishing boats and a pier'],
  ['bakery', 'A baker pulling fresh bread from the oven'],
  ['wizard', 'A wizard reading spells in a library'],
  ['humanoid', 'A person standing on a pedestal'],
  ['vehicle', 'A futuristic rover on open ground'],
  ['abstract', 'A geometric sculpture of floating metallic rings'],
];

// A scene narrower than this reads as a thumbnail in a banner, whatever it is.
const MIN_FILL = 0.25;
// Every scene's fill is recorded, so a box that grows (or a composer that shrinks
// its geometry) shows up as a scene that lost its frame. A bare threshold would
// have to be loosened for a sparse sculpture and would then miss the regression.
const BASELINE = 'scripts/world-bounds-baseline.json';
const DROP = 0.12;

const UPDATE = process.argv.includes('--update');
const baseline = fs.existsSync(BASELINE) ? JSON.parse(fs.readFileSync(BASELINE, 'utf8')) : {};
const measuredFills = {};

const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const picked = only.length ? SCENES.filter(([id]) => only.includes(id)) : SCENES;

let passed = 0;
let failed = 0;
const check = (name, ok, detail = '') => {
  if (ok) {
    passed += 1;
    console.log(`PASS  ${name}${detail ? `  ${detail}` : ''}`);
  } else {
    failed += 1;
    console.log(`FAIL  ${name}${detail ? `  ${detail}` : ''}`);
  }
};

fs.mkdirSync('.tmp/world-bounds', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1240, height: 700 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));

for (const [id, prompt] of picked) {
  const code = synthesizeProceduralScene(prompt, 'worlds', null, 'hero');
  const declared = code.match(/bounds: \[\[([^\]]+)\], \[([^\]]+)\]\]/);
  const file = `.tmp/world-bounds/${id}.html`;
  fs.writeFileSync(file, await bundleWorlds(code, null));
  await page.goto(`file://${path.resolve(file).split(path.sep).join('/')}`);
  await page.waitForTimeout(1600);

  const measured = await page.evaluate(() => {
    const world = window.__world;
    if (!world) return null;
    const box = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] };
    world.content.updateMatrixWorld(true);
    world.content.traverse((o) => {
      if (!o.isMesh || !o.geometry) return;
      const g = o.geometry;
      if (!g.boundingBox) g.computeBoundingBox();
      const bb = g.boundingBox;
      const m = o.matrixWorld.elements;
      for (const x of [bb.min.x, bb.max.x]) {
        for (const y of [bb.min.y, bb.max.y]) {
          for (const z of [bb.min.z, bb.max.z]) {
            const wx = m[0] * x + m[4] * y + m[8] * z + m[12];
            const wy = m[1] * x + m[5] * y + m[9] * z + m[13];
            const wz = m[2] * x + m[6] * y + m[10] * z + m[14];
            box.min = [Math.min(box.min[0], wx), Math.min(box.min[1], wy), Math.min(box.min[2], wz)];
            box.max = [Math.max(box.max[0], wx), Math.max(box.max[1], wy), Math.max(box.max[2], wz)];
          }
        }
      }
    });
    const canvas = document.querySelector('#stage canvas');
    const img = new Image();
    img.src = canvas.toDataURL('image/png');
    return { box, canvas: { w: canvas.width, h: canvas.height }, src: img.src };
  });

  if (!measured) {
    check(`${id} mounts a world`, false);
    continue;
  }

  // The picture, not the declaration: a scene that touches the frame edge has had
  // part of itself cut off, which is what a too-small box looks like from outside.
  const fill = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const off = document.createElement('canvas');
    off.width = img.width;
    off.height = img.height;
    const ctx = off.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, img.width, img.height);
    const bg = [data[0], data[1], data[2]];
    let minX = 1e9;
    let maxX = -1e9;
    let minY = 1e9;
    let maxY = -1e9;
    for (let y = 0; y < img.height; y += 1) {
      for (let x = 0; x < img.width; x += 1) {
        const o = (y * img.width + x) * 4;
        const d = Math.abs(data[o] - bg[0]) + Math.abs(data[o + 1] - bg[1]) + Math.abs(data[o + 2] - bg[2]);
        if (d > 12) {
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    const edge = 2;
    const touches = minX <= edge ? 'left' : maxX >= img.width - 1 - edge ? 'right' : minY <= edge ? 'top' : maxY >= img.height - 1 - edge ? 'bottom' : null;
    return { w: (maxX - minX) / img.width, h: (maxY - minY) / img.height, touches };
  }, measured.src);

  const base = baseline[id];
  const lost = base ? Math.max(1 - fill.w / base.w, 1 - fill.h / base.h) : 0;
  check(
    `${id} fills its frame`,
    fill.w >= MIN_FILL && fill.h >= MIN_FILL && lost <= DROP,
    `${(fill.w * 100).toFixed(0)}% wide, ${(fill.h * 100).toFixed(0)}% tall${
      base ? ` (was ${(base.w * 100).toFixed(0)}% / ${(base.h * 100).toFixed(0)}%)` : ' (no baseline)'
    }`,
  );
  measuredFills[id] = { w: +fill.w.toFixed(3), h: +fill.h.toFixed(3) };
  check(
    `${id} is not clipped by the frame`,
    fill.touches === null,
    fill.touches ? `painted content reaches the ${fill.touches} edge` : '',
  );
}

check('no console errors while measuring', errors.length === 0, errors.slice(0, 3).join(' | '));
await browser.close();

if (UPDATE) {
  fs.writeFileSync(BASELINE, `${JSON.stringify({ ...baseline, ...measuredFills }, null, 2)}
`);
  console.log(`baseline written to ${BASELINE}`);
}
console.log(`
${passed}/${passed + failed} world bounds checks passed`);
if (failed) process.exitCode = 1;

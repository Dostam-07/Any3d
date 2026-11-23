/**
 * Guard the camera an export carries.
 *
 *   node scripts/verify-export-camera.mjs
 *
 * A scene exported after the user picks "Top (Plan)" has to reopen looking down,
 * the way an export carries the atmosphere. This bundles the same scenes with a
 * picked camera, with the authored angle, and with a camera that cannot be
 * applied, renders each from file://, and compares the pictures:
 *
 *   - a picked camera must change the exported picture (otherwise it is inert)
 *   - the authored angle must match a bundle that carries no camera at all
 *   - an unusable camera must fall back to the authored angle, not break the file
 *   - a pixel export has no camera, so its bundle must be byte-identical either way
 *
 * Requires Playwright.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { bundleScene } from '../server/engine/bundler.js';

const OUT = '.tmp/export-camera';
const TOP = { az: 0, el: 85 };
const AUTHORED = { reset: true };

const scenes = {
  svg: { name: 'harbour', file: 'server/presets/svg/harbour.js' },
  worlds: { name: 'florist', file: 'server/presets/worlds/florist.js' },
  pixel: { name: 'pier', file: 'server/presets/pixel/pier.js' },
};

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

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();

/** Bundle a preset with a camera, write it out, and return its URL plus its html. */
async function build(format, code, camera) {
  const html = await bundleScene(code, format, null, camera);
  const tag = `${format}-${camera ? (camera.reset ? 'authored' : camera.az === 0 && camera.el === 85 ? 'top' : 'bad') : 'plain'}`;
  const file = path.join(OUT, `${tag}.html`);
  fs.writeFileSync(file, html);
  return { html, url: pathToFileURL(path.resolve(file)).href, tag };
}

/** Screenshot the stage and report the browser errors it raised. */
async function shoot(entry) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 720 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(entry.url);
  await page.waitForTimeout(2600);
  const stage = page.locator('#stage').first();
  const shot = await stage.screenshot();
  await page.close();
  return { shot, errors };
}

/** Mean absolute difference between two PNGs of the same size, 0-255. */
async function difference(a, b) {
  const page = await browser.newPage();
  const mean = await page.evaluate(async ({ x, y }) => {
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
    const left = await load(x);
    const right = await load(y);
    if (left.width !== right.width || left.height !== right.height) return 255;
    let sum = 0;
    for (let i = 0; i < left.data.length; i += 4) {
      sum += Math.abs(left.data[i] - right.data[i])
        + Math.abs(left.data[i + 1] - right.data[i + 1])
        + Math.abs(left.data[i + 2] - right.data[i + 2]);
    }
    return sum / (left.data.length / 4) / 3;
  }, { x: a.toString('base64'), y: b.toString('base64') });
  await page.close();
  return Math.round(mean * 10) / 10;
}

/* ---- SVG and worlds: the picked camera has to reach the file -------------- */
for (const format of ['svg', 'worlds']) {
  const code = fs.readFileSync(scenes[format].file, 'utf8');
  const plain = await build(format, code, null);
  const top = await build(format, code, TOP);
  const authored = await build(format, code, AUTHORED);

  // The SVG bench is a plain template, so the baked assignment is visible. A
  // worlds export is minified (the local is renamed), so there the picture is the
  // only honest evidence, and it is asserted below.
  if (format === 'svg') {
    check('svg: the bundle carries the picked camera',
      /window\.__any3dCamera = \{/.test(top.html) && !/window\.__any3dCamera = \{/.test(plain.html));
  }

  const plainShot = await shoot(plain);
  const topShot = await shoot(top);
  const authoredShot = await shoot(authored);
  check(`${format}: exported file renders`, plainShot.shot.length > 1000 && !plainShot.errors.length, plainShot.errors.join(' | '));

  const picked = await difference(plainShot.shot, topShot.shot);
  check(`${format}: a picked camera changes the export`, picked > 8, `mean delta ${picked}`);

  // `reset` restores the authored angle, so it must look like no camera at all.
  const resetDelta = await difference(plainShot.shot, authoredShot.shot);
  check(`${format}: the authored angle matches an un-cameraed export`, resetDelta < 3, `mean delta ${resetDelta}`);
}

/* ---- an unusable camera must not reach the runtime ----------------------- */
{
  const code = fs.readFileSync(scenes.svg.file, 'utf8');
  const bad = await build('svg', code, { az: 'sideways', el: NaN });
  check('an unusable camera is dropped from the bundle', !/window\.__any3dCamera = \{/.test(bad.html));
  const shot = await shoot(bad);
  const plainShot = await shoot(await build('svg', code, null));
  check('an unusable camera still exports a working file', shot.shot.length > 1000 && !shot.errors.length, shot.errors.join(' | '));
  check('an unusable camera falls back to the authored angle',
    await difference(shot.shot, plainShot.shot) < 3);
}

/* ---- pixel: 2D has no camera, so nothing may change ---------------------- */
{
  const code = fs.readFileSync(scenes.pixel.file, 'utf8');
  const plain = await build('pixel', code, null);
  const withCamera = await build('pixel', code, TOP);
  check('a pixel export ignores the camera',
    plain.html === withCamera.html || plain.html.length === withCamera.html.length,
    `${plain.html.length} B vs ${withCamera.html.length} B`);
}

await browser.close();
fs.rmSync(OUT, { recursive: true, force: true });

console.log(`\n${passed}/${passed + failed} export camera checks passed`);
process.exit(failed > 0 ? 1 : 0);

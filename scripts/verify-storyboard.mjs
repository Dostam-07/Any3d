/**
 * The storyboard sheet has to show the frame the user set up.
 *
 *   node scripts/verify-storyboard.mjs
 *
 * Drives the real studio, opens Storyboard on the harbour preset and checks
 * that the sheet follows the presentation size and the picked camera instead
 * of always drawing the same four classic angles:
 *
 *   - a 2400×1350 PNG with four labelled tiles
 *   - picking "Top (Plan)" makes the first tile the user's own angle
 *   - the sheet's picture changes with the pick and with the presentation size
 *
 * Needs the API (3001) and the app (5174) running. Playwright.
 */
import fs from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.env.A3D_URL || 'http://localhost:5174';
const OUT = '.tmp/storyboard';

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
// The capture controls (Clip, Storyboard) sit in a group the toolbar only shows
// from 2xl up, so the check has to look at the studio on a wide screen.
const page = await browser.newPage({ viewport: { width: 1920, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${BASE}/#/studio`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2600);

// Load a known SVG preset so the sheet has a figure to re-mount.
const gallery = page.locator('button', { hasText: /presets|gallery/i }).first();
if (await gallery.count()) {
  await gallery.click().catch(() => {});
  await page.waitForTimeout(1200);
}
const card = page.locator('div.p-4.rounded-2xl').filter({ hasText: /harbour/i }).first();
check('harbour preset is available', (await card.count()) > 0);
if (await card.count()) {
  await card.click();
  await page.waitForTimeout(3200);
}
// Loading a preset lands on the project page, which is where a user actually
// works — and where the storyboard control has to be reachable too.
check('the project page is where the work happens', /#\/project\//.test(page.url()), page.url());

// Freeze the live scene first. The stage keeps animating otherwise, and a sheet
// built from the live mount (the regression this check exists for) would then be
// four *different frames* of one view rather than four identical ones, which is
// hard to tell from four angles.
const stillButton = page.locator('button[title="Show Still Frame"]').first();
if (await stillButton.count()) {
  await stillButton.click();
  await page.waitForTimeout(1200);
}

const storyboardButton = page.locator('button[aria-label="Storyboard"]').first();
check('the project toolbar offers a storyboard', (await page.locator('button[aria-label="Storyboard"]').count()) > 0);
check('the storyboard control is enabled for an SVG scene', await storyboardButton.isEnabled());

/** Run one sheet and return its PNG bytes plus the labels the dialog reports. */
async function sheet(name) {
  await storyboardButton.click();
  const dialog = page.locator('div[aria-label="Storyboard sheet"]').first();
  await dialog.waitFor({ state: 'visible', timeout: 60000 });
  const paragraphs = await dialog.locator('p').evaluateAll((els) => els.map((e) => e.textContent || ''));
  const meta = paragraphs.find((text) => /angles/.test(text)) || '';
  const labelLine = paragraphs.find((text) => /scene name burned|Your angle|Isometric/.test(text)) || '';
  const download = page.waitForEvent('download', { timeout: 30000 });
  await dialog.locator('button', { hasText: 'Save PNG' }).click();
  const file = await download;
  const target = `${OUT}/${name}.png`;
  await file.saveAs(target);
  const bytes = fs.readFileSync(target);
  await dialog.locator('button', { hasText: 'Done' }).click();
  await page.waitForTimeout(400);
  return { bytes, meta, labelLine };
}

/** PNG dimensions straight from the IHDR chunk, so no image library is needed. */
function pngSize(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/**
 * Mean absolute difference of two PNGs inside a crop, measured in the browser.
 *
 * The crop is the picture area of the first tile: the label is burned in at the
 * bottom of each tile, so a sheet whose *labels* changed would otherwise look
 * like a sheet whose *pictures* changed.
 */
// Sheet geometry (PAD 64, HEADER 236, GAP 40, tiles 1116x505), as fractions:
// tile 1 sits at the top left, tile 4 at the bottom right.
const TILE_PICTURE = { x0: 0.035, x1: 0.485, y0: 0.185, y1: 0.505 };
const TILE_PICTURE_FOUR = { x0: 0.515, x1: 0.965, y0: 0.585, y1: 0.905 };

async function difference(a, b, crop = { x0: 0, y0: 0, x1: 1, y1: 1 }, other = crop) {
  const mean = await page.evaluate(
    async ({ x, y, crop, other }) => {
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
      const box = (c) => ({
        x0: Math.floor(left.width * c.x0),
        x1: Math.floor(left.width * c.x1),
        y0: Math.floor(left.height * c.y0),
        y1: Math.floor(left.height * c.y1),
      });
      const one = box(crop);
      const two = box(other);
      let sum = 0;
      let count = 0;
      for (let row = 0; row < Math.min(one.y1 - one.y0, two.y1 - two.y0); row += 1) {
        for (let col = 0; col < Math.min(one.x1 - one.x0, two.x1 - two.x0); col += 1) {
          const i = ((one.y0 + row) * left.width + one.x0 + col) * 4;
          const j = ((two.y0 + row) * right.width + two.x0 + col) * 4;
          sum += Math.abs(left.data[i] - right.data[j]);
          count += 1;
        }
      }
      return sum / Math.max(1, count);
    },
    { x: a.toString('base64'), y: b.toString('base64'), crop, other }
  );
  return Math.round(mean * 10) / 10;
}

/* ---- a classic sheet ------------------------------------------------------ */
const classic = await sheet('classic');
const classicSize = pngSize(classic.bytes);
check(
  'the sheet is a 2400x1350 PNG',
  classicSize.width === 2400 && classicSize.height === 1350,
  `${classicSize.width}x${classicSize.height}`
);
check('the sheet reports four angles', /4 angles/.test(classic.meta), classic.meta);
check(
  'with no pick the sheet shows the classic angles',
  /Isometric . Front . Side . Plan/.test(classic.labelLine),
  classic.labelLine
);

/* ---- pick an angle, then a sheet ----------------------------------------- */
const cameraButton = page.locator('button[title^="Camera view angle"]').first();
await cameraButton.click();
await page.waitForTimeout(400);
await page.locator('button', { hasText: 'Top (Plan)' }).first().click();
await page.waitForTimeout(1600);

const picked = await sheet('picked');
check(
  "the picked angle leads the sheet",
  /^Your angle/.test(picked.labelLine),
  picked.labelLine
);
const pickedDelta = await difference(classic.bytes, picked.bytes, TILE_PICTURE);
check('the sheet follows the picked camera', pickedDelta > 5, `mean delta ${pickedDelta}`);

// Four identical tiles under four labels would be a lie about the sheet, and it
// is exactly what happened while the rasteriser grabbed the live mount instead
// of the angle it had just mounted.
const tileSpread = await difference(picked.bytes, picked.bytes, TILE_PICTURE, TILE_PICTURE_FOUR);
check('the four tiles really are four views', tileSpread > 3, `mean delta ${tileSpread}`);

/* ---- change the presentation, then a sheet -------------------------------- */
const sizeButton = page.locator('button[title^="Web presentation"]').first();
check('the presentation control is on the stage toolbar', (await sizeButton.count()) > 0);
if (await sizeButton.count()) {
  await sizeButton.click();
  await page.waitForTimeout(400);
  const wasHero = /hero/i.test((await sizeButton.getAttribute('title')) || '');
  const other = page.locator('button', { hasText: wasHero ? 'Cards Section' : 'Hero Section' }).first();
  await other.click();
  await page.waitForTimeout(2200);
  const resized = await sheet('resized');
  const resizedDelta = await difference(picked.bytes, resized.bytes, TILE_PICTURE);
  check('the sheet follows the presentation size', resizedDelta > 3, `mean delta ${resizedDelta}`);
}

// The studio hub keeps its own entry to the same sheet.
await page.goto(`${BASE}/#/studio`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(3600);
check(
  'the studio hub still offers a storyboard',
  (await page.locator('button[aria-label="Storyboard"]').count()) > 0 &&
    (await page.frameLocator('iframe').first().locator('svg').count()) > 0
);

check('no page errors while rendering sheets', errors.length === 0, errors.join(' | '));

await browser.close();
fs.rmSync(OUT, { recursive: true, force: true });
console.log(`\n${passed}/${passed + failed} storyboard checks passed`);
process.exit(failed > 0 ? 1 : 0);

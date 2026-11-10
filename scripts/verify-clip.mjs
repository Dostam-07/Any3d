import { chromium } from 'playwright';

const STUDIO = 'http://localhost:5173/#/studio';
const out = [];
const log = (...a) => { const s = a.join(' '); out.push(s); console.log(s); };
const fail = (msg) => { log('FAIL:', msg); process.exitCode = 1; };

const browser = await chromium.launch({
  args: ['--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', (m) => { if (m.type() === 'error') log('  [console error]', m.text().slice(0, 200)); });
page.on('pageerror', (e) => log('  [pageerror]', e.message.slice(0, 200)));

const dialog = page.locator('[role="dialog"][aria-label="Turntable clip"]');
const clipButton = () => page.getByRole('button', { name: 'Clip', exact: true }).first();

async function openStudio() {
  await page.goto(STUDIO, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
}

/** Open the gallery, filter to one engine and load the first matching preset. */
async function loadPreset(engine, preferred) {
  await page.getByRole('button', { name: /benchmark|gallery|presets/i }).first().click();
  const modal = page.locator('div.fixed.inset-0.z-50').filter({ hasText: 'Any3d Benchmark Gallery' }).first();
  await modal.waitFor({ state: 'visible', timeout: 10000 });
  // Engine chips are labelled per engine: "SVG VECTOR (19)", "THREE.JS 3D (7)", …
  await modal.getByRole('button', { name: engine }).first().click();
  await page.waitForTimeout(400);
  const cards = modal.locator('div.p-4.rounded-2xl');
  log(`   ${engine} presets:`, await cards.count());
  const card = cards.filter({ hasText: preferred }).first();
  await (await card.count() ? card : cards.first()).click({ force: true });
  await page.waitForTimeout(3500);
  if ((await dialog.count()) === 0) log('   gallery closed after pick:', (await modal.count()) === 0);
}

/** Click Clip and wait for the result dialog, surfacing error banners. */
async function recordClip(label) {
  await clipButton().click();
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(500);
    if (await dialog.count()) return true;
    const err = page.locator('text=/Could not record|no drawable|not ready/i');
    if (await err.count()) { fail(`${label}: ${await err.first().innerText()}`); return false; }
  }
  fail(`${label}: dialog never appeared`);
  return false;
}

async function setCapture({ format, aspect, rate }) {
  await page.getByRole('button', { name: 'Capture settings' }).first().click();
  if (format) await page.getByRole('button', { name: format, exact: true }).click();
  if (aspect) await page.getByRole('button', { name: aspect, exact: true }).click();
  if (rate) await page.getByRole('button', { name: rate, exact: true }).click();
  await page.keyboard.press('Escape');
}

// ---------------------------------------------------------------- SVG engine
await openStudio();
log('1. Studio loaded, url =', page.url());
await loadPreset(/svg vector/i, /harbour|cafe|kitchen/i);

const frame = page.locator('iframe').first();
const info = await frame.evaluate((f) => {
  const d = f.contentDocument;
  const svg = d?.querySelector('svg');
  return { hasSvg: !!svg, hasCanvas: !!d?.querySelector('canvas'), vb: svg?.getAttribute('viewBox') ?? null, w: svg?.clientWidth ?? 0 };
});
log('2. preview content:', JSON.stringify(info));
if (!info.hasSvg) fail('expected an SVG scene for the SVG checks');

// Root cause of the old blur: an SVG with only a viewBox rasterises at the
// image's 300x150 intrinsic size. Width/height attributes make the browser
// rasterise the vector at the requested pixels.
const raster = await frame.evaluate(async (f) => {
  const svg = f.contentDocument.querySelector('svg');
  if (!svg) return { svg: false };
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('viewBox', svg.getAttribute('viewBox') || `0 0 ${svg.clientWidth} ${svg.clientHeight}`);
  clone.setAttribute('width', '1080');
  clone.setAttribute('height', '1080');
  const markup = new XMLSerializer().serializeToString(clone);
  const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });

  const url = URL.createObjectURL(blob);
  const img = new Image();
  await new Promise((res, rej) => { img.onload = res; img.onerror = () => rej(new Error('decode failed')); img.src = url; });
  URL.revokeObjectURL(url);

  return { svg: true, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight };
});
log('3. SVG raster probe:', JSON.stringify(raster));
if (raster.svg && raster.naturalWidth !== 1080) fail(`SVG rasterised at ${raster.naturalWidth}px instead of 1080px`);
if (raster.svg && raster.naturalHeight !== 1080) fail(`SVG raster height ${raster.naturalHeight}px instead of 1080px`);

// Long text at 1080: measure edge contrast on the fixed-size route against the
// viewBox-only route, so a blur regression cannot pass unnoticed.
const sharp = await page.evaluate(async () => {
  const line = 'The quick brown fox jumps over the lazy dog';
  const base = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 698 698"><rect width="698" height="698" fill="#f6efe3"/>${[330, 360, 390]
    .map((y) => `<text x="349" y="${y}" text-anchor="middle" font-family="Georgia, serif" font-size="19" fill="#1b1b1b">${line}</text>`)
    .join('')}</svg>`;
  async function measure(markup) {
    const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const c = document.createElement('canvas');
    c.width = c.height = 1080;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1080, 1080);
    ctx.drawImage(img, 0, 0, 1080, 1080);
    URL.revokeObjectURL(url);
    const { data } = ctx.getImageData(0, 400, 1080, 250);
    let edges = 0, count = 0;
    for (let y = 0; y < 250; y++) {
      for (let x = 0; x < 1079; x++) {
        const i = (y * 1080 + x) * 4, a = data[i], b = data[i + 4];
        if (a < 140 || b < 140) { edges += Math.abs(a - b); count++; }
      }
    }
    return +(edges / Math.max(1, count)).toFixed(2);
  }
  const soft = await measure(base);
  const crisp = await measure(base.replace('<svg ', '<svg width="1080" height="1080" '));
  return { soft, crisp, ratio: +(crisp / Math.max(0.01, soft)).toFixed(2) };
});
log('   text sharpness (viewBox-only → fixed size):', JSON.stringify(sharp));
if (sharp.crisp < sharp.soft) {
  fail(`fixed-size text is softer than the viewBox-only route (${sharp.crisp} vs ${sharp.soft})`);
}

if (await recordClip('svg video')) {
  const video = dialog.locator('video');
  await video.evaluate((v) => new Promise((r) => (v.readyState >= 1 ? r() : (v.onloadedmetadata = r))));
  const vInfo = await video.evaluate(async (v) => {
    const b = await (await fetch(v.src)).blob();
    return { type: b.type, bytes: b.size, w: v.videoWidth, h: v.videoHeight, readyState: v.readyState };
  });
  log('   video:', JSON.stringify(vInfo));
  if (vInfo.w !== 1080 || vInfo.h !== 1080) fail(`video is ${vInfo.w}x${vInfo.h}, expected 1080x1080`);
  if (vInfo.bytes > 8 * 1024 * 1024) fail(`video is ${(vInfo.bytes / 1024 / 1024).toFixed(1)}MB, over the 8MB budget`);
  log('4. meta:', await dialog.locator('p.font-mono').last().innerText());
  await page.screenshot({ path: 'shots/clip-dialog.png' });
  await page.getByRole('button', { name: /^Done$/ }).click();
  log('   dialog closed:', (await dialog.count()) === 0);
}

// ---------------------------------------------------------------- GIF route
await setCapture({ format: 'GIF' });
if (await recordClip('gif')) {
  const gifInfo = await dialog.locator('img').evaluate(async (img) => {
    const b = await (await fetch(img.src)).blob();
    const head = new TextDecoder().decode(await b.slice(0, 6).arrayBuffer());
    const bitmap = await createImageBitmap(b);
    return { type: b.type, bytes: b.size, head, w: bitmap.width, h: bitmap.height };
  });
  log('5. gif:', JSON.stringify(gifInfo));
  if (gifInfo.type !== 'image/gif') fail('GIF clip is not image/gif');
  if (!gifInfo.head.startsWith('GIF8')) fail(`GIF signature is ${JSON.stringify(gifInfo.head)}`);
  if (gifInfo.w !== gifInfo.h) fail(`GIF is ${gifInfo.w}x${gifInfo.h}, expected square`);
  log('   gif meta:', await dialog.locator('p.font-mono').last().innerText());

  // The dialog must be centred in the viewport, not clipped by the toolbar it
  // was mounted in (a backdrop-filter ancestor captures fixed positioning).
  const box = await dialog.locator('div.rounded-2xl').first().boundingBox();
  log('6. dialog box:', JSON.stringify(box));
  if (!box || box.y < 0 || box.y + box.height > 901) fail('dialog is clipped by the viewport');
  await page.screenshot({ path: 'shots/clip-gif.png' });
  await page.getByRole('button', { name: /^Done$/ }).click();
}

// ------------------------------------------------------------ Worlds engine
// Fresh load: the gallery keeps its filter and the page keeps its stage view,
// so each engine check starts from a known state.
await page.waitForTimeout(500);
await openStudio();
await loadPreset(/three\.js 3d/i, /bakery|pottery|florist/i);

const canvasInfo = await page.locator('iframe').first().evaluate((f) => {
  const c = f.contentDocument.querySelector('canvas');
  return c ? { hasCanvas: true, w: c.width, h: c.height } : { hasCanvas: false, w: 0, h: 0 };
});
log('7. worlds canvas:', JSON.stringify(canvasInfo));
if (!canvasInfo.hasCanvas) fail('worlds preset did not mount a canvas');

// Wide + 60 fps exercises the direct-capture path (no copy canvas).
await setCapture({ format: 'Video', aspect: 'Wide', rate: '60 fps' });
if (await recordClip('worlds video')) {
  const cv = dialog.locator('video');
  await cv.evaluate((v) => new Promise((r) => (v.readyState >= 1 ? r() : (v.onloadedmetadata = r))));
  const cInfo = await cv.evaluate(async (v) => {
    const b = await (await fetch(v.src)).blob();
    return { bytes: b.size, w: v.videoWidth, h: v.videoHeight };
  });
  const cMeta = await dialog.locator('p.font-mono').last().innerText();
  log('8. worlds video:', JSON.stringify(cInfo), '| meta:', cMeta);
  if (cInfo.w !== canvasInfo.w || cInfo.h !== canvasInfo.h) {
    fail(`wide video is ${cInfo.w}x${cInfo.h}, expected the canvas size ${canvasInfo.w}x${canvasInfo.h}`);
  }
  if (!/60 fps/.test(cMeta)) fail('wide clip did not use the 60 fps setting');
  await page.screenshot({ path: 'shots/clip-worlds.png' });
}

await browser.close();
log(process.exitCode ? 'RESULT: FAILED' : 'RESULT: PASSED');

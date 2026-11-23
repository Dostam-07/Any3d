// Cold reload of a project: the bundle lives in memory only, so this is the flow
// that silently broke once — the transcript and the scene came back, the preview
// did not, and every capture action stayed disabled above a valid scene.
//
//   A3D_URL=http://127.0.0.1:5174 A3D_API=http://127.0.0.1:3001 node scripts/verify-reload.mjs
import { chromium } from 'playwright';

const APP = process.env.A3D_URL || 'http://localhost:5174';
const TIMEOUT = Number(process.env.A3D_TIMEOUT_MS || 120000);
const results = [];
const pass = (name, detail = '') => results.push({ ok: true, name, detail });
const fail = (name, detail = '') => results.push({ ok: false, name, detail });
const errors = [];
let browser;

const openGalleryPreset = async (page, engine, title) => {
  await page.locator('button:visible').filter({ hasText: 'Presets' }).first().click();
  const modal = page.locator('div.fixed.inset-0.z-50').filter({ hasText: 'Any3d Benchmark Gallery' }).first();
  await modal.waitFor({ state: 'visible', timeout: 20000 });
  const tab = modal.locator('button').filter({ hasText: engine }).last();
  if (await tab.count()) await tab.click();
  await page.waitForTimeout(500);
  await modal.locator('div.p-4.rounded-2xl').filter({ hasText: title }).first().click();
  await page.waitForTimeout(1200);
};

try {
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));

  // Load a scene the normal way, then throw the page away and come back to the URL
  // a user would bookmark or refresh on.
  await page.goto(`${APP}/#/studio`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2500);
  await openGalleryPreset(page, /SVG Vector/i, /pier nine/i);
  await page.waitForSelector('iframe', { timeout: TIMEOUT });
  const projectUrl = page.url();
  const openedWithPreview = (await page.locator('iframe').count()) > 0;
  if (openedWithPreview && /#\/project\//.test(projectUrl)) pass('loading a preset lands on a project url', projectUrl.replace(APP, ''));
  else fail('loading a preset lands on a project url', projectUrl);

  await page.goto(projectUrl, { waitUntil: 'domcontentloaded' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // Give the rebuild the same patience a person would: the bundle is a round trip.
  const frame = page.locator('iframe').first();
  await frame.waitFor({ state: 'attached', timeout: TIMEOUT }).catch(() => {});
  await page.waitForTimeout(4000);

  const reloaded = await page.evaluate(() => {
    const frame = document.querySelector('iframe');
    const doc = frame?.contentDocument;
    return {
      frames: document.querySelectorAll('iframe').length,
      // An SVG scene is one <svg> root with hundreds of children; a worlds scene
      // is a canvas. Count the drawing, not the mount.
      shapes: doc ? doc.querySelectorAll('svg *').length + doc.querySelectorAll('canvas').length : 0,
      emptyCopy: /will appear here as soon as the first generation finishes/i.test(document.body.innerText || ''),
      exportEnabled: Boolean(
        document.querySelector('button[title*="standalone offline HTML"]:not([disabled])'),
      ),
    };
  });

  if (reloaded.frames > 0) pass('a cold reload restores a live frame', `${reloaded.frames} iframe`);
  else fail('a cold reload restores a live frame', 'no iframe after reload');
  if (reloaded.shapes > 10) pass('the restored frame draws the scene', `${reloaded.shapes} nodes`);
  else fail('the restored frame draws the scene', JSON.stringify(reloaded));
  if (!reloaded.emptyCopy) pass('the preview is not empty after a reload');
  else fail('the preview is not empty after a reload', 'the empty-state copy is showing above a valid scene');
  if (reloaded.exportEnabled) pass('capture actions survive the reload');
  else fail('capture actions survive the reload', 'the export button is disabled');
} catch (error) {
  fail('run', String(error).slice(0, 300));
} finally {
  if (browser) await browser.close();
}

if (errors.length) fail('no page errors', errors.slice(0, 2).join(' | '));

for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  ' + r.detail : ''}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} reload checks passed`);
process.exit(failed ? 1 : 0);

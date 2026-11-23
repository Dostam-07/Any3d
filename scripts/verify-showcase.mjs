// Presentation invariants for CI: no screenshots, no vision, no GIFs.
//
//   node scripts/verify-showcase.mjs           (expects app + API already running)
//   A3D_URL=http://localhost:5174 A3D_API=http://localhost:3001 node scripts/verify-showcase.mjs
//
// It fails (exit 1) when the frame reloads on a presentation switch, when a
// console error appears, when the card CTA stops exporting or copying, when the
// "Editable source" link stops reaching the editor, or when a pixel/dither frame
// collapses back into a postage stamp.
import { chromium } from 'playwright';
import * as fs from 'node:fs';

const APP = process.env.A3D_URL || 'http://localhost:5174';
const API = process.env.A3D_API || 'http://localhost:3001';
const TIMEOUT = Number(process.env.A3D_TIMEOUT_MS) || 60000;

const checks = [];
const fail = (name, detail) => checks.push({ name, ok: false, detail });
const pass = (name, detail = '') => checks.push({ name, ok: true, detail });

const waitFor = async (url, label) => {
  const started = Date.now();
  for (;;) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch { /* server not up yet */ }
    if (Date.now() - started > TIMEOUT) throw new Error(`${label} never became ready at ${url}`);
    await new Promise((r) => setTimeout(r, 1000));
  }
};

await waitFor(`${API}/api/presets`, 'API');
await waitFor(APP, 'Vite app');

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1600, height: 950 }, acceptDownloads: true });
await context.addInitScript(() => {
  try { localStorage.setItem('any3d_theme', 'dark'); } catch { /* ignore */ }
});
const page = await context.newPage();
const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push(e.message.slice(0, 200)));
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 200)); });

const openPreset = async (formatRe, nameRe) => {
  await page.goto(`${APP}/#/studio`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  await page.locator('button:visible').filter({ hasText: 'Presets' }).first().click();
  const modal = page.locator('div.fixed.inset-0.z-50').filter({ hasText: 'Any3d Benchmark Gallery' }).first();
  await modal.waitFor({ state: 'visible', timeout: 20000 });
  const chips = await modal.locator('button').allInnerTexts();
  if (!chips.some((t) => formatRe.test(t))) throw new Error(`gallery has no ${formatRe} filter`);
  await modal.getByRole('button', { name: formatRe }).first().click();
  await page.waitForTimeout(400);
  const card = modal.locator('div.p-4.rounded-2xl').filter({ hasText: nameRe }).first();
  if (!(await card.count())) throw new Error(`preset ${nameRe} missing from the ${formatRe} tab`);
  await card.click({ force: true });
  await page.waitForTimeout(2500);
  const ready = await page.evaluate(() => {
    const doc = document.querySelector('iframe')?.contentDocument;
    return Boolean(doc && doc.querySelector('canvas, svg'));
  });
  if (!ready) throw new Error('preview never mounted a canvas');
  await page.waitForTimeout(1200);
};

const switchSize = async (label) => {
  await page.locator('button[title^="Web presentation:"]').first().click();
  await page.getByRole('button', { name: label }).first().click();
  await page.waitForTimeout(1500);
};

try {
  // --- gallery coverage: every engine tab exists, including dither ----------
  await page.goto(`${APP}/#/studio`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  await page.locator('button:visible').filter({ hasText: 'Presets' }).first().click();
  const modal = page.locator('div.fixed.inset-0.z-50').filter({ hasText: 'Any3d Benchmark Gallery' }).first();
  await modal.waitFor({ state: 'visible', timeout: 20000 });
  const tabs = await modal.locator('button').allInnerTexts();
  for (const engine of [/SVG Vector/i, /Three\.js/i, /Pixel Art/i, /Dither/i]) {
    if (tabs.some((t) => engine.test(t))) pass(`gallery tab ${engine}`);
    else fail(`gallery tab ${engine}`, 'missing engine filter');
  }
  await modal.getByRole('button', { name: /Dither/i }).first().click();
  await page.waitForTimeout(400);
  const ditherCards = await modal.locator('div.p-4.rounded-2xl').count();
  if (ditherCards >= 3) pass('dither presets reachable', `${ditherCards} cards`);
  else fail('dither presets reachable', `${ditherCards} cards`);
  await page.keyboard.press('Escape');

  // --- one scene, both presentations, frame must survive -------------------
  await openPreset(/Three\.js/i, /bakery/i);
  await page.evaluate(() => {
    const frame = document.querySelector('iframe');
    frame.dataset.probe = 'kept';
    frame.contentWindow.__probe = 'kept';
  });
  await switchSize(/^Hero Section/);
  const hero = await page.evaluate(() => {
    const frame = document.querySelector('iframe');
    const stage = document.querySelector('div[class*="@container"]');
    const area = (el) => (el ? { w: Math.round(el.clientWidth), h: Math.round(el.clientHeight) } : null);
    return {
      elementKept: frame?.dataset.probe === 'kept',
      windowKept: frame?.contentWindow?.__probe === 'kept',
      stage: area(stage),
      heroChrome: Boolean(document.querySelector('[data-hero-chrome]')) || /Start free/.test(document.body.innerText || ''),
      specChips: /ENGINE/i.test(stage?.innerText || '') && /MOTION/i.test(stage?.innerText || ''),
    };
  });
  if (hero.elementKept && hero.windowKept) pass('iframe survives hero switch');
  else fail('iframe survives hero switch', JSON.stringify(hero));
  if (hero.heroChrome) pass('hero renders site chrome');
  else fail('hero renders site chrome', 'no nav/CTA copy found');
  if (!hero.specChips) pass('hero has no spec chips');
  else fail('hero has no spec chips', 'spec chips leaked into the hero');

  await switchSize(/^Cards Section/);
  const card = await page.evaluate(() => {
    const stage = document.querySelector('div[class*="@container"]');
    const frame = document.querySelector('iframe');
    const text = stage?.innerText || '';
    return {
      stage: stage ? { w: Math.round(stage.clientWidth), h: Math.round(stage.clientHeight) } : null,
      threeTiles: stage ? stage.querySelectorAll('article').length : 0,
      specChips: /ENGINE/i.test(text) && /MOTION/i.test(text),
      ship: /Ship this scene/i.test(text),
      codePeek: Boolean(stage?.querySelector('div[class*="font-mono"]')),
      frameKept: frame?.dataset.probe === 'kept' && frame?.contentWindow?.__probe === 'kept',
    };
  });
  if (card.frameKept) pass('iframe survives card switch');
  else fail('iframe survives card switch', JSON.stringify(card));
  if (card.ship) pass('card shows the ship CTA');
  else fail('card shows the ship CTA');
  if (card.specChips) pass('spec lives in the card chrome');
  else fail('spec lives in the card chrome', 'chips missing');
  if (card.threeTiles >= 3) pass('card grid keeps three tiles', `${card.threeTiles} articles`);
  else fail('card grid keeps three tiles', `${card.threeTiles} articles`);

  // --- copy + export actually work from the tile ---------------------------
  const stage = page.locator('div[class*="@container"]').first();
  await stage.getByRole('button', { name: /^Copy$/ }).first().click();
  await page.waitForTimeout(500);
  const copied = (await stage.getByRole('button', { name: /Copied/ }).count()) > 0;
  if (copied) pass('card copy action');
  else fail('card copy action', 'no Copied state');

  const download = page.waitForEvent('download', { timeout: 45000 });
  await stage.getByRole('button', { name: /Export HTML/ }).first().click();
  const file = await (await download).path();
  const html = fs.readFileSync(file, 'utf8');
  const selfContained = /mountWorld|Any3d\.figure|Pixel\.mount/.test(html) && html.length > 100000;
  const stamped = /\bsize\s*:\s*['"](card|hero)['"]/.test(html);
  if (selfContained && stamped) pass('card export is standalone', `${Math.round(html.length / 1024)} KB`);
  else fail('card export is standalone', JSON.stringify({ selfContained, stamped, bytes: html.length }));

  // --- editable source reaches the code editor ----------------------------
  await stage.getByRole('button', { name: /Editable source/ }).first().click();
  await page.waitForTimeout(1200);
  const editor = await page.evaluate(() => ({
    textarea: Boolean(document.querySelector('textarea')),
    codeTab: [...document.querySelectorAll('button')].some(
      (b) => /^Code$/i.test((b.textContent || '').trim()) && b.className.includes('bg-indigo-600'),
    ),
  }));
  if (editor.textarea && editor.codeTab) pass('editable source opens the editor');
  else fail('editable source opens the editor', JSON.stringify(editor));

  // --- a world takes its look from the studio instead of a fixed dark sky --
  // Regression guard: worlds used to ignore the look entirely and sit on the dark
  // placeholder backdrop under noon lighting, which read as a black banner.
  await openPreset(/Three\.js/i, /florist|bakery/i);
  await switchSize(/^Hero Section/);
  await page.waitForTimeout(2600);
  const worldFrame = page.frames().find((f) => f !== page.mainFrame());
  const skyAt = async (look) => {
    if (look) {
      await page.evaluate((value) => {
        const frame = document.querySelector('iframe');
        frame?.contentWindow?.postMessage({ type: 'any3d-world', look: value }, '*');
      }, look);
      await page.waitForTimeout(1000);
    }
    return worldFrame.evaluate(async () => {
      const canvas = document.querySelector('#stage canvas');
      if (!canvas) return null;
      const img = new Image();
      img.src = canvas.toDataURL('image/png');
      await img.decode();
      const off = document.createElement('canvas');
      off.width = img.width;
      off.height = img.height;
      off.getContext('2d').drawImage(img, 0, 0);
      // Right side, just above the bottom scrim: sky in every look, unmasked by copy.
      const { data } = off.getContext('2d').getImageData(img.width - 8, Math.round(img.height * 0.42), 1, 1);
      return Math.round((data[0] + data[1] + data[2]) / 3);
    });
  };
  const noonSky = await skyAt({ timeOfDay: 1 / 3, weather: 'clear' });
  const nightSky = await skyAt({ timeOfDay: 1, weather: 'clear' });
  if (noonSky > 120 && nightSky < 80) pass('world look reaches the runtime', `noon ${noonSky} -> night ${nightSky}`);
  else fail('world look reaches the runtime', `noon ${noonSky}, night ${nightSky}`);
  await skyAt({ timeOfDay: 1 / 3, weather: 'clear' });

  // --- pixel art must fill its frame, not sit in the middle ----------------
  await openPreset(/Pixel Art/i, /flower/i);
  await switchSize(/^Cards Section/);
  const pixel = await page.evaluate(() => {
    const frame = document.querySelector('iframe');
    const canvas = frame?.contentDocument?.querySelector('canvas');
    if (!canvas || !frame) return null;
    const art = canvas.getBoundingClientRect();
    const box = frame.getBoundingClientRect();
    return { ratio: art.width / box.width, height: art.height / box.height };
  });
  if (pixel && pixel.ratio > 0.9 && pixel.height > 0.9) pass('pixel art fills its card', JSON.stringify(pixel));
  else fail('pixel art fills its card', JSON.stringify(pixel));
} catch (error) {
  fail('run', String(error).slice(0, 300));
}

if (consoleErrors.length) fail('console is clean', consoleErrors.slice(0, 3).join(' | '));
else pass('console is clean');

await browser.close();

const width = Math.max(...checks.map((c) => c.name.length));
for (const check of checks) {
  console.log(`${check.ok ? 'PASS' : 'FAIL'}  ${check.name.padEnd(width)}  ${check.detail}`);
}
const failures = checks.filter((c) => !c.ok);
console.log(`\n${checks.length - failures.length}/${checks.length} presentation checks passed`);
process.exit(failures.length ? 1 : 0);

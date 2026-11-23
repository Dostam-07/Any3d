// Screenshots the hero and card presentations at wide, laptop and narrow pane
// widths. One scene is loaded, then the viewport is resized so the responsive
// layouts are exercised without the sidebar gallery going out of reach.
import { chromium } from 'playwright';
import * as fs from 'node:fs';

const BASE = process.env.A3D_URL || 'http://localhost:5174';
const THEME = process.env.A3D_THEME === 'dark' ? 'dark' : 'light';
const outDir = 'browser-results/presentation';
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
// Theme comes from localStorage on first paint, so seed it before any script runs.
await page.addInitScript((theme) => {
  try { localStorage.setItem('any3d_theme', theme); } catch { /* storage may be blocked */ }
}, THEME);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });

await page.goto(`${BASE}/#/studio`, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

// Close the agent chat panel when it is open, so the stage gets the space.
const closeAgent = page.getByRole('button', { name: /Close Agent Studio/i });
if (await closeAgent.count()) { await closeAgent.first().click(); await page.waitForTimeout(900); }

await page.locator('button:visible').filter({ hasText: 'Presets' }).first().click();
const modal = page.locator('div.fixed.inset-0.z-50').filter({ hasText: 'Any3d Benchmark Gallery' }).first();
await modal.waitFor({ state: 'visible', timeout: 15000 });
await modal.getByRole('button', { name: /Three.js/i }).first().click();
await page.waitForTimeout(400);
const card = modal.locator('div.p-4.rounded-2xl').filter({ hasText: /bakery/i }).first();
await (await card.count() ? card : modal.locator('div.p-4.rounded-2xl').first()).click({ force: true });
await page.waitForTimeout(4000);

// After the preset opens, give the stage the full width: close the agent panel
// and collapse the sidebar (both toggleable, both hide the preview).
for (const name of [/Close Agent Studio/i, /Close panel/i]) {
  const btn = page.getByRole('button', { name }).first();
  if (await btn.count() && await btn.isVisible()) { await btn.click(); await page.waitForTimeout(700); }
}
const sidebar = page.getByRole('button', { name: /Collapse Sidebar/i }).first();
if (await sidebar.count() && await sidebar.isVisible()) { await sidebar.click(); await page.waitForTimeout(700); }

const setSize = async (label) => {
  const trigger = page.locator('button[title^="Web presentation:"]').first();
  await trigger.click();
  await page.getByRole('button', { name: new RegExp(`^${label}`) }).first().click();
  await page.waitForTimeout(1200);
};

const measure = () => page.evaluate(() => {
  const frame = document.querySelector('iframe');
  const media = frame?.closest('article');
  const grid = media?.parentElement;
  const stage = document.querySelector('.\\@container');
  const body = document.body.innerText;
  return {
    stage: stage ? { w: Math.round(stage.clientWidth), h: Math.round(stage.clientHeight) } : null,
    article: media ? { w: Math.round(media.clientWidth), h: Math.round(media.clientHeight) } : null,
    grid: grid && grid !== media ? {
      cols: getComputedStyle(grid).gridTemplateColumns.split(' ').length,
      cards: [...grid.children].map((c) => `${Math.round(c.clientWidth)}x${Math.round(c.clientHeight)}`),
    } : null,
    headline: document.querySelector('h1')?.textContent || null,
    scrolls: stage ? stage.scrollHeight > stage.clientHeight + 1 : null,
    hasSectionHeading: /Cards section/i.test(body),
  };
});

const markFrame = () => page.evaluate(() => { const f = document.querySelector('iframe'); if (f) f.contentWindow.__a3dMarker = 'kept'; return Boolean(f); });
const markerSurvives = () => page.evaluate(() => document.querySelector('iframe')?.contentWindow?.__a3dMarker === 'kept');

const runs = [];
for (const [w, h] of [[1920, 1080], [1440, 900], [1100, 800], [820, 780], [600, 760]]) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(900);
  // Below lg the sidebar becomes a drawer; dismiss it so it does not cover the stage.
  const drawerBackdrop = page.locator('button[aria-label="Close navigation"]').first();
  if (await drawerBackdrop.count() && await drawerBackdrop.isVisible()) {
    await drawerBackdrop.click({ force: true });
    await page.waitForTimeout(500);
  }

  await setSize('Hero Section');
  await markFrame();
  await page.screenshot({ path: `${outDir}/${THEME}-hero-${w}.png` });
  const hero = await measure();
  const heroKept = await markerSurvives();

  await setSize('Cards Section');
  await page.screenshot({ path: `${outDir}/${THEME}-card-${w}.png` });
  const cards = await measure();
  const cardKept = await markerSurvives();

  runs.push({ w, h, hero, cards, frameKept: heroKept && cardKept });
  console.log(`\n${w}x${h}`);
  console.log('  hero', JSON.stringify(hero));
  console.log('  card', JSON.stringify(cards), '| iframe kept:', heroKept && cardKept);
}

console.log('\nerrors:', errors.length ? errors : 'none');
await browser.close();
fs.writeFileSync(`${outDir}/${THEME}-summary.json`, JSON.stringify(runs, null, 2));

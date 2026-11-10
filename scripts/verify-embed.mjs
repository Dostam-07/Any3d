/**
 * Verify the published embed demo from `file://`, including the sandboxed frame.
 *
 *   node scripts/verify-embed.mjs
 *
 * Requires Playwright (the clip/look checks use the same dependency).
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const demo = pathToFileURL(path.resolve('docs/embed/demo.html')).href;
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});

await page.goto(demo);
await page.waitForTimeout(2000);

const sandbox = await page.evaluate(() => {
  const frame = document.querySelector('iframe');
  return frame ? frame.getAttribute('sandbox') : null;
});

const frame = page.frames().find((f) => f !== page.mainFrame());
const inside = frame
  ? await frame.evaluate(() => ({
      svg: Boolean(document.querySelector('svg')),
      canvas: Boolean(document.querySelector('canvas')),
      motion: window.__any3dMotion ?? null,
      title: document.title,
      size: {
        w: document.documentElement.clientWidth,
        h: document.documentElement.clientHeight,
      },
    }))
  : null;

console.log(
  JSON.stringify(
    {
      demo,
      iframe: Boolean(frame),
      sandbox,
      inside,
      consoleErrors: errors,
    },
    null,
    2
  )
);

await browser.close();

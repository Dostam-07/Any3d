/**
 * Guard the documented pixel "finish" options.
 *
 *   node scripts/verify-pixel-finish.mjs
 *
 * `bayer`, `shadow`, `rim`, `wind` and `contact` are documented in
 * docs/guides/pixel-scene-api.md, but no preset uses them, so nothing would
 * notice if a kernel change made them inert. This bundles the same scene with
 * and without them, renders both from file://, and fails when the pixels match
 * (option ignored) or when an invalid `bayer` no longer throws the documented
 * message. Requires Playwright.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { bundleScene } from '../server/engine/bundler.js';

const OUT = '.tmp/pixel-finish';
const base = fs.readFileSync('server/presets/pixel/pier.js', 'utf8');

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

/** Splice extra spec keys into the scene declaration. */
function withFinish(code, finish) {
  const body = JSON.stringify(finish).slice(1, -1);
  return /Pixel\.scene\(\{\n/.test(code)
    ? code.replace('Pixel.scene({\n', `Pixel.scene({\n  ${body},\n`)
    : code.replace('Pixel.scene({', `Pixel.scene({ ${body},`);
}

fs.mkdirSync(OUT, { recursive: true });

const pages = {
  plain: base,
  finish: withFinish(base, { bayer: 4, shadow: 'hard', rim: true, wind: 6, contact: 0.6 }),
  bad: withFinish(base, { bayer: 5 }),
};

for (const [name, code] of Object.entries(pages)) {
  fs.writeFileSync(path.join(OUT, `${name}.html`), await bundleScene(code, 'pixel'));
}

const browser = await chromium.launch();
const shots = {};
const url = (name) => pathToFileURL(path.resolve(OUT, `${name}.html`)).href;

for (const name of ['plain', 'finish']) {
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url(name));
  await page.waitForTimeout(2200);
  const canvas = page.locator('canvas').first();
  check(`${name} scene renders`, await canvas.count() === 1);
  check(`${name} scene has no page errors`, errors.length === 0, errors.join(' | '));
  shots[name] = await canvas.screenshot();
  await page.close();
}

check(
  'finish options change the picture',
  Buffer.compare(shots.plain, shots.finish) !== 0,
  `${shots.plain.length} B vs ${shots.finish.length} B`,
);

const page = await browser.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(url('bad'));
await page.waitForTimeout(1500);
check(
  'invalid bayer throws the documented message',
  errs.some((e) => /bayer must be 4 or 8 \(got 5\)/.test(e)),
  errs.join(' | ') || 'no throw',
);
await browser.close();

console.log(`\n${passed}/${passed + failed} pixel finish checks passed`);
process.exit(failed > 0 ? 1 : 0);

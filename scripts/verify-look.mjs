import { chromium } from 'playwright';

const STUDIO = 'http://localhost:5173/#/studio';
const log = (...a) => console.log(...a);
const fail = (msg) => { log('FAIL:', msg); process.exitCode = 1; };

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => log('  [pageerror]', e.message.slice(0, 200)));

let bundleCalls = 0;
page.on('request', (req) => { if (req.url().includes('/api/bundle')) bundleCalls += 1; });

await page.goto(STUDIO, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

// Load an SVG preset.
await page.getByRole('button', { name: /benchmark|gallery|presets/i }).first().click();
const modal = page.locator('div.fixed.inset-0.z-50').filter({ hasText: 'Any3d Benchmark Gallery' }).first();
await modal.waitFor({ state: 'visible', timeout: 10000 });
await modal.getByRole('button', { name: /svg vector/i }).first().click();
await page.waitForTimeout(400);
const cards = modal.locator('div.p-4.rounded-2xl');
const card = cards.filter({ hasText: /harbour|cafe|kitchen/i }).first();
await (await card.count() ? card : cards.first()).click({ force: true });
await page.waitForTimeout(3500);

const frame = page.locator('iframe').first();

/** Mean luma + mean hue of the painted faces, and the stage background. */
const sample = () => frame.evaluate((f) => {
  const doc = f.contentDocument;
  const svg = doc.querySelector('svg');
  const fills = [...doc.querySelectorAll('.scene path[fill], .scene rect[fill], .scene ellipse[fill]')]
    .map((n) => n.getAttribute('fill'))
    .filter((v) => v && v.startsWith('#'));
  let r = 0, g = 0, b = 0;
  for (const hex of fills) {
    r += parseInt(hex.slice(1, 3), 16); g += parseInt(hex.slice(3, 5), 16); b += parseInt(hex.slice(5, 7), 16);
  }
  const n = Math.max(1, fills.length);
  const ctx = f.contentWindow.__any3d;
  return {
    fills: fills.length,
    luma: +((0.2126 * r / n + 0.7152 * g / n + 0.0722 * b / n) / 255).toFixed(3),
    warmth: +(((r / n) - (b / n)) / 255).toFixed(3),
    background: svg ? svg.style.background : '',
    look: ctx && ctx.look ? { name: ctx.look.name, t: +ctx.look.t.toFixed(3), weather: ctx.look.weather } : null,
    weatherNodes: doc.querySelectorAll('.weather > *').length,
  };
});

const noon = await sample();
log('1. noon:', JSON.stringify(noon));
if (!noon.look) fail('the preview runtime has no look state');
if (noon.fills < 5) fail(`only ${noon.fills} painted faces found`);

const bundlesBefore = bundleCalls;
await page.getByRole('button', { name: 'Night', exact: true }).first().click();
await page.waitForTimeout(700);
const night = await sample();
log('2. night:', JSON.stringify(night));
if (night.look?.name !== 'night') fail(`look did not reach night (got ${night.look?.name})`);
if (night.luma > noon.luma * 0.85) {
  fail(`night is only ${(100 - (night.luma / noon.luma) * 100).toFixed(1)}% darker than noon — the grade is not reaching the faces`);
}
if (night.background === noon.background) fail('sky background did not change');

// Drag across the whole range: every step must be a message, not a rebuild.
const slider = page.getByLabel('Time of day').first();
for (const value of ['0.05', '0.28', '0.5', '0.78', '0.95']) {
  await slider.fill(value);
  await page.waitForTimeout(80);
}
const dusk = await sample();
log('3. after drag:', JSON.stringify(dusk));

await page.getByRole('button', { name: 'Golden hour', exact: true }).first().click();
await page.waitForTimeout(300);
log('4. golden hour:', JSON.stringify(await sample()));

await page.getByRole('button', { name: 'Rain', exact: true }).first().click();
await page.waitForTimeout(500);
const rain = await sample();
log('5. rain:', JSON.stringify(rain));
if (rain.weatherNodes < 20) fail(`rain layer has ${rain.weatherNodes} particles`);
if (rain.look?.weather !== 'rain') fail('weather did not reach the runtime');

await page.getByRole('button', { name: 'Snow', exact: true }).first().click();
await page.waitForTimeout(500);
const snow = await sample();
log('6. snow:', JSON.stringify(snow));
if (snow.weatherNodes < 10) fail(`snow layer has ${snow.weatherNodes} particles`);

if (bundleCalls !== bundlesBefore) {
  fail(`scrubbing triggered ${bundleCalls - bundlesBefore} /api/bundle request(s); it must be message-only`);
}
log('7. bundle requests during scrub:', bundleCalls - bundlesBefore);

// Cost of one look change: the whole scene repaints, so this is what a drag pays.
const repaint = await frame.evaluate((f) => {
  const ctx = f.contentWindow.__any3d;
  const samples = [];
  for (let i = 0; i < 12; i++) {
    const t0 = performance.now();
    ctx.setLook({ timeOfDay: 0.08 + i * 0.07, weather: 'clear' });
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
  return { avgMs: +avg.toFixed(1), p95Ms: +samples[Math.floor(samples.length * 0.95)].toFixed(1) };
});
log('7b. repaint per look change:', JSON.stringify(repaint));
if (repaint.avgMs > 33) {
  fail(`a look change costs ${repaint.avgMs}ms, below 30 fps — the drag cannot hit 60 fps`);
}

// The payload carries the look: a shared scene must reopen at the same light.
const payload = await page.evaluate(async () => {
  const mod = await import('/src/lib/scene-payload.ts');
  const encoded = await mod.encodeScene(
    {
      v: mod.SCENE_PAYLOAD_VERSION,
      format: 'svg',
      code: 'Any3d.figure({ name: "x", title: "x", build: function (o) { return {}; } });',
      look: { timeOfDay: 0.72, weather: 'rain' },
    },
    { compact: true }
  );
  const back = await mod.decodeScene(encoded);
  return { v: back.v, look: back.look, chars: encoded.length };
});
log('8. payload round-trip:', JSON.stringify(payload));
if (payload.v !== 2) fail(`payload version is ${payload.v}, expected 2`);
if (!payload.look || Math.abs(payload.look.timeOfDay - 0.72) > 1e-6 || payload.look.weather !== 'rain') {
  fail('look did not survive the payload round-trip');
}

// Export baking: the bundle route stamps the look into the HTML.
const baked = await page.evaluate(async () => {
  const res = await fetch('/api/bundle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: 'Any3d.figure({ name: "x", title: "x", build: function (o) { return {}; } });',
      format: 'svg',
      look: { timeOfDay: 0.72, weather: 'snow' },
    }),
  });
  const data = await res.json();
  return { hasLook: /__any3dLook\s*=\s*\{[^}]*"timeOfDay":0\.72/.test(data.html), bytes: data.sizeBytes };
});
log('9. export bake:', JSON.stringify(baked));
if (!baked.hasLook) fail('bundled HTML does not bake the look');

await page.screenshot({ path: 'shots/look-night.png' });
await browser.close();
log(process.exitCode ? 'RESULT: FAILED' : 'RESULT: PASSED');

// Captures the README showcase: stills and short GIFs of hero and card
// presentations, mixing curated presets with prompt-only scenes that no preset
// covers. For prompt scenes it seeds the same localStorage session the studio
// writes, then deep-links to #/project/<id>, so the capture exercises the real
// project page rather than a special case.
import { chromium } from 'playwright';
import * as fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { buildPromptScenes } from './showcase-prompts.mjs';
import { SCENES } from './showcase-scenes.mjs';

const BASE = process.env.A3D_URL || 'http://localhost:5174';
// A3D_OUT lets a check (or a preview run) capture somewhere other than the
// committed set without touching it.
const OUT = process.env.A3D_OUT || 'docs/assets/showcase';
// GIFs are opt-in: they are large, and only the two animated heroes need them.
const RECORD_GIFS = process.env.A3D_GIFS === '1' || process.argv.includes('--gifs');
const FRAMES = '.tmp/showcase-frames';
const REPORT = 'browser-results/showcase/report.json';
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(FRAMES, { recursive: true });
fs.mkdirSync('browser-results/showcase', { recursive: true });


// Scene keys as positional args; --gifs only toggles recording and must not
// be mistaken for a scene filter (a bare filter matches nothing and exits silently).
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const scenes = only.length ? SCENES.filter((s) => only.some((k) => s.key.includes(k))) : SCENES;

// --- prompt scenes: rebuild the sources, then seed the sessions the studio
// would have written. Rebuilding keeps CI honest: .tmp/ starts empty there.
const built = buildPromptScenes();
console.log('prompt-only scenes:', built.map((s) => `${s.file}(${s.valid ? 'valid' : 'INVALID'})`).join(' '));
const sessions = [];
for (const scene of scenes.filter((s) => s.kind === 'prompt')) {
  const file = `.tmp/novel/${scene.file}.json`;
  if (!fs.existsSync(file)) {
    console.warn(`missing ${file}; run the generation step first`);
    continue;
  }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const prompt = data.code.match(/description: '(.*)'/)?.[1] || scene.title;
  sessions.push({
    id: `sess-show-${scene.file}`,
    title: scene.title.slice(0, 36),
    format: 'worlds',
    updatedAt: Date.now(),
    code: data.code,
    prompt,
    messages: [
      { id: 'm1', role: 'user', content: prompt },
      { id: 'm2', role: 'assistant', content: data.fallbackNotice || 'Scene generated locally.' },
    ],
  });
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2 });
await context.addInitScript((payload) => {
  try {
    localStorage.setItem('any3d_theme', 'dark');
    if (payload.length) localStorage.setItem('any3d_saved_sessions', JSON.stringify(payload));
  } catch { /* storage can be unavailable */ }
}, sessions);

const page = await context.newPage();
const report = [];

const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });

await page.goto(`${BASE}/#/studio`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(2500);

const closePanels = async () => {
  for (const name of [/Close Agent Studio/i, /Close panel/i]) {
    const btn = page.getByRole('button', { name }).first();
    if (await btn.count() && await btn.isVisible()) { await btn.click(); await page.waitForTimeout(500); }
  }
  const sidebar = page.getByRole('button', { name: /Collapse Sidebar/i }).first();
  if (await sidebar.count() && await sidebar.isVisible()) { await sidebar.click(); await page.waitForTimeout(500); }
};
await closePanels();

const setSize = async (size) => {
  // Match the viewport to the presentation so a card capture is not mostly
  // empty stage below a short grid.
  await page.setViewportSize(size === 'hero' ? { width: 1920, height: 860 } : { width: 1920, height: 780 });
  await page.waitForTimeout(500);
  const trigger = page.locator('button[title^="Web presentation:"]').first();
  await trigger.click();
  const label = size === 'hero' ? /^Hero Section/ : /^Cards Section/;
  await page.getByRole('button', { name: label }).first().click();
  await page.waitForTimeout(1600);
};

const waitForScene = async () => {
  await page.waitForTimeout(2200);
  const ready = await page.evaluate(() => {
    const f = document.querySelector('iframe');
    if (!f) return false;
    const doc = f.contentDocument;
    if (!doc) return false;
    // SVG and pixel stages are not canvas based.
    return Boolean(doc.querySelector('canvas, svg, [data-state="ready"]'));
  });
  if (ready) await page.waitForTimeout(1400);
  return ready;
};

const stageMetrics = () => page.evaluate(() => {
  const stage = document.querySelector('div[class*="@container"]');
  const frame = document.querySelector('iframe');
  let meshes = null;
  try {
    const world = frame?.contentWindow?.__world;
    meshes = world?.content ? world.content.children.length : null;
  } catch { /* cross-document access can fail */ }
  // Where does the visible content end? A card section is shorter than the
  // stage, and a still that keeps the empty tail reads as a broken layout.
  let contentBottom = 0;
  if (stage) {
    const top = stage.getBoundingClientRect().top;
    stage.querySelectorAll('*').forEach((node) => {
      const r = node.getBoundingClientRect();
      if (r.height > 4 && r.width > 4) {
        contentBottom = Math.max(contentBottom, Math.min(r.bottom - top, stage.clientHeight));
      }
    });
  }
  return {
    stage: stage ? { w: Math.round(stage.clientWidth), h: Math.round(stage.clientHeight) } : null,
    contentBottom: Math.round(contentBottom),
    meshes,
  };
});

const stageLocator = () => page.locator('div[class*="@container"]').first();

// Captures are taken at deviceScaleFactor 2 for crisp edges; README images are
// normalised to one width so GitHub renders every tile at the same scale instead
// of mixing 1240- and 2480-pixel files side by side.
const STILL_WIDTH = 1240;
const GIF_WIDTH = 640;
const hasFfmpeg = () => {
  try {
    execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};
const FFMPEG = hasFfmpeg();
if (!FFMPEG) console.log('ffmpeg: not installed — stills stay at capture size and GIFs are skipped');

const normalizeStill = (file) => {
  if (!FFMPEG) return;
  const tmp = `${file}.tmp.png`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', file, '-vf', `scale=${STILL_WIDTH}:-1:flags=lanczos`, '-frames:v', '1', tmp]);
  fs.renameSync(tmp, file);
};

const shootGif = async (name, clip) => {
  const dir = `${FRAMES}/${name}`;
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(dir, { recursive: true });
  const frames = 22;
  for (let i = 0; i < frames; i += 1) {
    await page.screenshot({ path: `${dir}/${String(i).padStart(3, '0')}.png`, clip });
  }
  const gif = `${OUT}/${name}.gif`;
  execFileSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-framerate', '9', '-i', `${dir}/%03d.png`,
    '-vf', `scale=${GIF_WIDTH}:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=160[p];[b][p]paletteuse=dither=bayer:bayer_scale=3`,
    '-loop', '0', gif,
  ]);
  return gif;
};

for (const scene of scenes) {
  let loaded = false;
  if (scene.kind === 'preset') {
    await page.goto(`${BASE}/#/studio`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1600);
    await closePanels();
    await page.locator('button:visible').filter({ hasText: 'Presets' }).first().click();
    const modal = page.locator('div.fixed.inset-0.z-50').filter({ hasText: 'Any3d Benchmark Gallery' }).first();
    await modal.waitFor({ state: 'visible', timeout: 15000 });
    const FILTERS = { worlds: /Three\.js/i, pixel: /Pixel Art/i, svg: /SVG Vector/i };
    const filter = FILTERS[scene.format] || FILTERS.svg;
    await modal.getByRole('button', { name: filter }).first().click();
    await page.waitForTimeout(500);
    const card = modal.locator('div.p-4.rounded-2xl').filter({ hasText: new RegExp(scene.name, 'i') }).first();
    if (!await card.count()) {
      report.push({ ...scene, loaded: false, reason: `${scene.name} not found in gallery` });
      console.log(`\n[skip] ${scene.key}: not found`);
      await page.keyboard.press('Escape').catch(() => {});
      continue;
    }
    await card.click({ force: true });
    await page.waitForTimeout(3500);
    loaded = await waitForScene();
    await closePanels();
  } else {
    await page.goto(`${BASE}/#/project/sess-show-${scene.file}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await closePanels();
    loaded = await waitForScene();
  }

  await setSize(scene.size);
  const metrics = await stageMetrics();
  const box = await stageLocator().boundingBox();
  const clipHeight = scene.size === 'card' && metrics.contentBottom > 200
    ? Math.min(box.height, metrics.contentBottom + 18)
    : box.height;
  const clip = { x: box.x, y: box.y, width: box.width, height: clipHeight };
  const still = `${OUT}/${scene.key}.png`;
  await page.screenshot({ path: still, clip });
  normalizeStill(still);
  // Only scenes whose motion is the point get a GIF; the rest animate by a few
  // pixels per frame and would just triple the repository size.
  const gif = RECORD_GIFS && scene.motion && FFMPEG ? await shootGif(scene.key, clip) : null;

  const entry = { ...scene, loaded, ...metrics, still, gif, bytes: [fs.statSync(still).size, gif ? fs.statSync(gif).size : 0] };
  report.push(entry);
  console.log(`\n${scene.key} (${scene.size}) loaded=${loaded} stage=${metrics.stage?.w}x${metrics.stage?.h} meshes=${metrics.meshes}`);
  console.log(`  still ${still}${gif ? `  gif ${gif}` : ''}`);
}

console.log('\nconsole errors:', errors.length ? errors.slice(0, 6) : 'none');
fs.writeFileSync(REPORT, JSON.stringify({ scenes: report, errors }, null, 2));
await browser.close();

import { chromium } from 'playwright';
import { bundleScene } from '../server/engine/bundler.js';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ASSETS_DIR = path.join(ROOT, 'docs', 'assets');

async function main() {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1200, height: 750 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // 1. Render and screenshot complex preset scenes
  const scenes = [
    {
      file: 'server/presets/svg/harbour.js',
      format: 'svg',
      output: 'scene-dock.png',
      look: { timeOfDay: 0.5, weather: 'clear' },
      theme: 'toy'
    },
    {
      file: 'server/presets/svg/launchpad.js',
      format: 'svg',
      output: 'scene-launchpad.png',
      look: { timeOfDay: 0.9, weather: 'clear' },
      theme: 'night'
    },
    {
      file: 'server/presets/svg/farm.js',
      format: 'svg',
      output: 'scene-farm.png',
      look: { timeOfDay: 0.45, weather: 'clear' },
      theme: 'toy'
    },
    {
      file: 'server/presets/svg/town.js',
      format: 'svg',
      output: 'scene-city.png',
      look: { timeOfDay: 0.5, weather: 'clear' },
      theme: 'toy'
    },
    {
      file: 'server/presets/svg/airport.js',
      format: 'svg',
      output: 'scene-airport.png',
      look: { timeOfDay: 0.5, weather: 'clear' },
      theme: 'soft'
    },
    {
      file: 'server/presets/worlds/observatory.js',
      format: 'worlds',
      output: 'scene-observatory.png',
      look: { timeOfDay: 0.92, weather: 'clear' }
    }
  ];

  for (const item of scenes) {
    if (!fs.existsSync(item.file)) {
      console.log('Skipping missing:', item.file);
      continue;
    }
    console.log(`Bundling and capturing ${item.output} from ${item.file}...`);
    const code = fs.readFileSync(item.file, 'utf8');
    const html = await bundleScene(code, item.format, item.look, item.theme);
    
    // Write temporary html
    const tmpHtmlPath = path.join(ROOT, '.tmp', `preview-${item.output}.html`);
    fs.mkdirSync(path.join(ROOT, '.tmp'), { recursive: true });
    fs.writeFileSync(tmpHtmlPath, html, 'utf8');

    await page.goto(`file://${tmpHtmlPath.replace(/\\/g, '/')}`, { waitUntil: 'load' });
    await page.waitForTimeout(1500); // Wait for canvas / svg to animate & settle

    const outPath = path.join(ASSETS_DIR, item.output);
    await page.screenshot({ path: outPath, clip: { x: 0, y: 0, width: 1200, height: 750 } });
    console.log(`Saved ${outPath}`);
  }

  // 2. Capture updated home.png from the local Vite app!
  try {
    console.log('Capturing updated home.png from http://localhost:5173...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1500);
    const homeOut = path.join(ASSETS_DIR, 'home.png');
    await page.screenshot({ path: homeOut });
    console.log(`Updated ${homeOut}`);
  } catch (err) {
    console.warn('Could not capture home.png from dev server:', err.message);
  }

  await browser.close();
  console.log('Done generating scene images!');
}

main().catch((err) => {
  console.error('Error generating images:', err);
  process.exit(1);
});

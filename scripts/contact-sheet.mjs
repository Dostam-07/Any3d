// Composes the worlds gallery screenshots into one labelled contact sheet.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { chromium } from 'playwright';

const dir = path.resolve('browser-results/worlds');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
const cols = 6;
const cellW = 300, cellH = 250;

const cells = files.map((f) => {
  const b64 = fs.readFileSync(path.join(dir, f)).toString('base64');
  return `<figure><img src="data:image/png;base64,${b64}"><figcaption>${f.replace('.png', '')}</figcaption></figure>`;
});

const html = `<!doctype html><meta charset="utf-8"><style>
  body { margin:0; background:#111; font:600 16px/1.2 system-ui, sans-serif; color:#eee; }
  main { display:grid; grid-template-columns:repeat(${cols}, ${cellW}px); }
  figure { margin:0; padding:6px; }
  img { width:${cellW}px; height:${Math.round(cellH * 0.86)}px; object-fit:cover; display:block; background:#fff; border-radius:4px; }
  figcaption { padding-top:6px; letter-spacing:.02em; }
</style><main>${cells.join('')}</main>`;

fs.writeFileSync('.tmp/contact-sheet.html', html);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: cols * cellW, height: Math.ceil(files.length / cols) * cellH } });
await page.goto('file://' + path.resolve('.tmp/contact-sheet.html'));
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(dir, 'contact-sheet.png'), fullPage: true });
await browser.close();
console.log(`contact sheet: ${files.length} tiles -> browser-results/worlds/contact-sheet.png`);

import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/#/studio', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const opener = page.getByRole('button', { name: /benchmark|gallery|presets/i }).first();
console.log('opener text:', JSON.stringify(await opener.innerText()));
await opener.click();
await page.waitForTimeout(800);

const modals = await page.locator('div.fixed.inset-0.z-50').count();
console.log('z-50 fixed divs:', modals);
for (let i = 0; i < modals; i++) {
  const m = page.locator('div.fixed.inset-0.z-50').nth(i);
  const text = (await m.innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 220);
  console.log(`modal[${i}] text:`, text);
  console.log(`modal[${i}] buttons:`, JSON.stringify(await m.getByRole('button').allInnerTexts().catch(() => [])));
}

await browser.close();

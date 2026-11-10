import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('about:blank');

const result = await page.evaluate(async () => {
  const text = 'The quick brown fox jumps over the lazy dog';
  const svgBase = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 698 698">
    <rect width="698" height="698" fill="#f6efe3"/>
    <text x="349" y="330" text-anchor="middle" font-family="Georgia, serif" font-size="19" fill="#1b1b1b">${text}</text>
    <text x="349" y="360" text-anchor="middle" font-family="Georgia, serif" font-size="19" fill="#1b1b1b">${text}</text>
    <text x="349" y="390" text-anchor="middle" font-family="Georgia, serif" font-size="19" fill="#1b1b1b">${text}</text>
  </svg>`;

  async function measure(markup) {
    const url = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml;charset=utf-8' }));
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, 1080, 1080);
    ctx.drawImage(img, 0, 0, 1080, 1080);
    URL.revokeObjectURL(url);
    const { data } = ctx.getImageData(0, 400, 1080, 250);
    let edges = 0, count = 0;
    for (let y = 0; y < 250; y++) {
      for (let x = 0; x < 1079; x++) {
        const i = (y * 1080 + x) * 4;
        const a = data[i], b = data[i + 4];
        if (a < 140 || b < 140) { edges += Math.abs(a - b); count++; }
      }
    }
    return { natural: `${img.naturalWidth}x${img.naturalHeight}`, sharpness: +(edges / Math.max(1, count)).toFixed(2) };
  }

  // Old route: viewBox only, so Chrome rasterises at its 300x150 intrinsic size.
  const soft = await measure(svgBase);
  // New route: explicit pixel attributes, so the vector rasterises at 1080.
  const crisp = await measure(svgBase.replace('<svg ', '<svg width="1080" height="1080" '));
  return { soft, crisp, ratio: +(crisp.sharpness / Math.max(0.01, soft.sharpness)).toFixed(2) };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();

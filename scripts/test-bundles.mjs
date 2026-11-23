import { bundleScene } from '../server/engine/bundler.js';
import fs from 'node:fs';

const worldsCode = fs.readFileSync('server/presets/worlds/bakery.js', 'utf8');
const pixelCode = fs.readFileSync('server/presets/pixel/flower-stall.js', 'utf8');
const svgCode = fs.readFileSync('server/presets/svg/cafe.js', 'utf8');

async function test() {
  const wHtml = await bundleScene(worldsCode, 'worlds', { timeOfDay: 0.9, weather: 'clear' });
  if (!wHtml.includes('timeOfDay:.9') && !wHtml.includes('timeOfDay:0.9') && !wHtml.includes('timeOfDay: .9')) throw new Error('Worlds missing look');
  if (!wHtml.includes('setLook')) throw new Error('Worlds missing runtime.setLook');
  if (!wHtml.includes("want===\"png\"") && !wHtml.includes("want === 'png'")) throw new Error('Worlds missing png message handler');

  const pHtml = await bundleScene(pixelCode, 'pixel', { timeOfDay: 0.8, weather: 'rain' });
  if (!pHtml.includes('__any3dLook') || !pHtml.includes('"timeOfDay":0.8')) throw new Error('Pixel missing look');
  if (!pHtml.includes('d.want === \'png\'')) throw new Error('Pixel missing png message handler');

  const sHtml = await bundleScene(svgCode, 'svg', { timeOfDay: 0.7, weather: 'snow' });
  if (!sHtml.includes('__any3dLook') || !sHtml.includes('"timeOfDay":0.7')) throw new Error('SVG missing look');
  if (!sHtml.includes('d.want === \'png\'')) throw new Error('SVG missing png message handler');

  console.log('ALL BUNDLE LOOK & POSTMESSAGE TESTS PASSED!');
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});

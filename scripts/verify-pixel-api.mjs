/**
 * Guard the documented `P` toolkit of the pixel kernel.
 *
 *   node scripts/verify-pixel-api.mjs
 *
 * The kernel header is the contract for every pixel scene. Nothing checked that
 * its primitives exist, draw, or stay sane when handed a bad number. This reads
 * the header, builds a scene that calls all of them, rasterises it in Chromium
 * and inspects the canvas. Requires Playwright.
 */
import fs from 'node:fs';
import { chromium } from 'playwright';

const source = fs.readFileSync('core/kernels/any3d-pixel.js', 'utf8');

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

/* ---- the contract, read out of the kernel header ------------------------- */

const header = source.slice(0, source.indexOf('var Pixel = (function ()'));
const block = header.slice(header.indexOf('   P (toolkit given to build and tick):'),
  header.indexOf('Pixel.mount(spec, canvas'));
const documented = [...new Set([
  ...[...block.matchAll(/P\.([A-Za-z]+)\s*[,(]/g)].map((m) => m[1]),
  // the motion line ends with a bare `P.clamp`
  ...[...block.matchAll(/P\.(clamp)/g)].map((m) => m[1]),
])];
check('header documents the toolkit', documented.length >= 20, documented.join(', '));

/* ---- run the scene in a page -------------------------------------------- */

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 640, height: 480 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));
await page.setContent('<!doctype html><meta charset="utf-8"><canvas id="c"></canvas>');
await page.addScriptTag({ content: source });

const result = await page.evaluate(({ documented }) => {
  const out = { called: [], missing: [], sane: null, bad: null, joints: null };

  function probe(bad) {
    const called = [];
    const missing = [];
    const spec = {
      name: bad ? 'bad-args' : 'every-call',
      title: 'Probe',
      means: 'A test scene that calls every documented toolkit entry once.',
      width: 160,
      height: 120,
      duration: 4,
      still: 1,
      build(P) {
        const call = (name, fn) => {
          try { fn(); called.push(name); } catch (error) { missing.push(`${name}: ${error.message}`); }
        };
        const n = bad ? NaN : 1;
        const at = bad ? NaN : 0;
        const seg = bad ? 'eight' : 10;
        const grass = P.mat('grass');
        const wood = P.mat('wood');

        call('group', () => P.group(at, at, at));
        call('box', () => P.box(n, n, n, wood, at, at, at));
        call('cyl', () => P.cyl(n, n, n, wood, at, at, at, null, seg));
        call('cone', () => P.cone(n, n, palm(grass), at, at, at, null, seg));
        call('ball', () => P.ball(n, grass, at, at, at, null, seg));
        call('wedge', () => P.wedge(n, n, n, wood, at, at, at));
        call('line', () => P.line([[at, at, at], [1, 1, 1]], wood));
        call('person', () => {
          const p = P.person(at, at, null, { yaw: bad ? NaN : 0.3 });
          out.joints = Object.keys(p || {}).length;
          call('pose', () => P.pose(p, 'work', bad ? NaN : 1));
        });
        call('tree', () => P.tree(at, at, null, { r: bad ? NaN : 0.6, h: bad ? NaN : 1.4, seed: bad ? NaN : 2 }));
        call('bush', () => P.bush(at, at, null, { r: bad ? NaN : 0.4 }));
        call('mat', () => { P.mat('grass'); P.mat('#8a9a5b'); P.mat({ color: '#8a9a5b', tex: 'wood' }); });
        // snap and wind are installed by the first render, so they are called
        // from tick (which runs after it), not from build.
        call('update', () => P.update());
        call('wave', () => P.wave(1, 2, 0));
        call('phase', () => P.phase(1, 2, 0));
        call('pulse', () => P.pulse(1, 2, 0.3));
        call('smooth', () => P.smooth(0.5));
        call('lerp', () => P.lerp(0, 1, 0.5));
        call('clamp', () => P.clamp(2, 0, 1));
        call('noise', () => P.noise(1, 2));
        call('fbm', () => P.fbm(1, 2));
        call('hash', () => P.hash(1, 2));
        return {};
      },
      tick(ctx) {
        if (called.includes('snap')) return;
        const P = ctx.P;
        for (const [name, fn] of [
          ['snap', () => P.snap(bad ? NaN : 0.37)],
          ['wind', () => P.wind(1, 2, 0)],
        ]) {
          try { fn(); called.push(name); } catch (error) { missing.push(`${name}: ${error.message}`); }
        }
      },
    };
    function palm(mat) { return mat; }

    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 120;
    document.body.appendChild(canvas);
    let pixels = null;
    try {
      const runtime = Pixel.mount(spec, canvas, { reduced: true });
      runtime.renderAt(1);
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      const colours = new Set();
      let painted = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) painted += 1;
        colours.add(`${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]}`);
      }
      pixels = { painted, colours: colours.size, total: data.length / 4, stats: runtime.stats() };
      runtime.destroy();
    } catch (error) {
      out.missing.push(`mount(${bad ? 'bad' : 'sane'}): ${error.message}`);
    }
    canvas.remove();
    return { called, missing, pixels };
  }

  const sane = probe(false);
  const bad = probe(true);
  out.called = sane.called;
  out.missing = [...sane.missing, ...bad.missing];
  out.sane = sane.pixels;
  out.bad = bad.pixels;
  return out;
}, { documented });

/* ---- assertions --------------------------------------------------------- */

check('page produced no script errors', pageErrors.length === 0, pageErrors.join(' | ').slice(0, 200));

const notCalled = documented.filter((name) => !result.called.includes(name));
check('every documented call exists and runs', notCalled.length === 0 && result.missing.length === 0,
  (notCalled.length ? `missing ${notCalled.join(', ')}` : result.missing.join(' | ')).slice(0, 240));

check('person returns its joints', result.joints >= 12, `${result.joints} joints`);

check('a scene using all of them paints',
  Boolean(result.sane) && result.sane.painted > result.sane.total * 0.3,
  result.sane ? `${result.sane.painted}/${result.sane.total} px, ${result.sane.colours} colours` : 'no render');
check('its stats are finite',
  Boolean(result.sane) && Number.isFinite(result.sane.stats.tris) && result.sane.stats.tris > 0,
  result.sane ? `${result.sane.stats.tris} triangles, ${result.sane.stats.ms?.toFixed?.(2)} ms` : '');

check('a scene using all of them has structure', result.sane.colours >= 10, `${result.sane.colours} colours`);
check('bad arguments still paint a structured scene',
  Boolean(result.bad) && result.bad.painted === result.bad.total && result.bad.colours >= 8,
  result.bad ? `${result.bad.painted}/${result.bad.total} px, ${result.bad.colours} colours` : 'no render');

await browser.close();

console.log(`\n${passed}/${passed + failed} pixel API checks passed`);
process.exit(failed > 0 ? 1 : 0);

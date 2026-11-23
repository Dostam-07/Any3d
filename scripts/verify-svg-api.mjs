/**
 * Guard the documented `D` toolkit of the SVG kernel.
 *
 *   node scripts/verify-svg-api.mjs
 *
 * The kernel header is the contract: it lists every call a figure may make.
 * Nothing checked that those calls exist, draw, or stay finite when handed a
 * bad number. This reads the header, builds a figure that calls all of them,
 * mounts it in Chromium and inspects the SVG it produces. Requires Playwright.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const KERNEL = 'core/kernels/any3d-svg.js';
const source = fs.readFileSync(KERNEL, 'utf8');

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

const header = source.slice(0, source.indexOf('var Any3d = (function ()'));

/** Names from a header block: `D.name(...)` / `D.props.name(...)` lines. */
function documented(block) {
  const names = [];
  for (const line of block.split(/\r?\n/)) {
    const match = line.match(/^\s+(D\.(?:props\.)?[A-Za-z]+)\s*\(/);
    if (match) names.push(match[1]);
  }
  return [...new Set(names)];
}

const primitives = documented(
  header.slice(header.indexOf('   D (per mount toolkit'),
    header.indexOf('Motion (also on Any3d):')),
);
const motion = documented(header.slice(header.indexOf('Motion (also on Any3d):')));
check('header documents the toolkit',
  primitives.length >= 20 && motion.length >= 10,
  `${primitives.length} primitives, ${motion.length} motion helpers`);

/* ---- run the figure in a page ------------------------------------------- */

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(e.message));

await page.setContent('<!doctype html><meta charset="utf-8"><div id="stage" style="width:640px"></div>');
await page.addScriptTag({ content: source });

const result = await page.evaluate(({ primitives, motion }) => {
  const called = [];
  const missing = [];
  const notes = [];

  function primitivesFigure(bad) {
    return Any3d.figure({
      name: bad ? 'bad-args' : 'every-call',
      size: 'card',
      means: 'A test figure that calls every documented primitive once.',
      hint: 'Nothing to press',
      build({ D }) {
        const pal = D.pal;
        const call = (name, fn) => {
          try {
            fn();
            called.push(name);
          } catch (error) {
            missing.push(`${name}: ${error.message}`);
          }
        };
        const n = bad ? NaN : 1;
        const at = bad ? NaN : 0;
        const size = bad ? NaN : 1;
        const seg = bad ? 'eight' : 12;

        call('D.group', () => D.group(at, at, at));
        call('D.box', () => D.box(size, size, size, pal.coral, at, at, at));
        call('D.rbox', () => D.rbox(size, size, size, pal.cobalt, at, at, at, null, { r: bad ? NaN : 0.1 }));
        call('D.cyl', () => D.cyl(size, size, size, pal.steel, at, at, at, null, seg));
        call('D.cone', () => D.cone(size, size, pal.mustard, at, at, at, null, seg));
        call('D.ball', () => D.ball(size, pal.sage, at, at, at));
        call('D.dome', () => D.dome(size, pal.cloud, at, at, at));
        call('D.wedge', () => D.wedge(size, size, size, pal.terracotta, at, at, at));
        call('D.slab', () => D.slab(bad ? NaN : 4, bad ? NaN : 3, pal.ground, at, at, at, null, { h: bad ? NaN : 0.2, r: bad ? NaN : 0.4 }));
        call('D.torus', () => D.torus(size * 0.4, bad ? NaN : 0.06, pal.ink, at, at, at));
        call('D.wheel', () => D.wheel(size * 0.3, bad ? NaN : 0.14, pal.tyre, at, at, at));
        call('D.label', () => D.label(bad ? 'NaN' : 'TEST', 1, 0.4, { size: bad ? NaN : 0.2 }));
        call('D.mat', () => D.mat(pal.paper, { emissive: pal.sky, emissiveIntensity: 0.4 }));
        call('D.props.tree', () => D.props.tree(at, at, null, { r: bad ? NaN : 0.6, kind: 'pine' }));
        call('D.props.bush', () => D.props.bush(at, at, null, { r: bad ? NaN : 0.35 }));
        call('D.props.rock', () => D.props.rock(at, at, null, { r: bad ? NaN : 0.3, h: bad ? NaN : 0.25 }));
        call('D.props.cloud', () => D.props.cloud(at, bad ? NaN : 2, at, null, { r: bad ? NaN : 0.4 }));
        call('D.props.person', () => D.props.person(at, at, null, { yaw: bad ? NaN : 0.3 }));
        call('D.props.lamp', () => D.props.lamp(at, at, null, { h: bad ? NaN : 2.6 }));
        call('D.props.crate', () => D.props.crate(at, at, at, null, { w: bad ? NaN : 0.4 }));
        call('D.props.pallet', () => D.props.pallet(at, at, at, null, { h: bad ? NaN : 0.3 }));
        call('D.props.cone', () => D.props.cone(at, at, null));
        call('D.props.flag', () => D.props.flag(at, at, null, { h: bad ? NaN : 2 }));

        // Motion, path and springs: every value must be a real number.
        // Motion helpers are pure maths: the kernel does not promise to coerce
        // them, so they are called with real numbers in both passes.
        const t = 1;
        for (const name of motion) {
          call(name, () => {
            const key = name.replace(/^D\./, '');
            const fn = D[key] || Any3d[key];
            if (typeof fn !== 'function') throw new Error('not a function');
            let value;
            switch (key) {
              case 'clamp': value = fn(5, 0, 1); break;
              case 'lerp': value = fn(0, 10, 0.5); break;
              case 'smooth': case 'out': case 'inOut': value = fn(0.5); break;
              case 'phase': value = fn(t, 4); break;
              case 'wave': value = fn(t, 4); break;
              case 'pulse': value = fn(t, 4, 0.3); break;
              case 'spring': { const s = fn(60, 12); s.set(1); s.step(0.016); value = s.x; break; }
              case 'apart': {
                const a = fn([{ g: D.group(0, 0, 0), x: 0, y: 1, z: 0 }], { k: 60, c: 12 });
                a.open(true); a.step(0.016);
                value = a.items.length;
                break;
              }
              case 'path': { const p = fn([[0, 0], [2, 0], [2, 2]], false, 0.4); value = p.length + p.at(0.5).x; break; }
              case 'place': { const p = D.path([[0, 0], [2, 0]], false, 0); const g = D.group(); fn(g, p, 0.5); value = g.position.x; break; }
              case 'spin': { const w = D.wheel(0.3, 0.14, D.pal.tyre, 0, 0, 0); fn([w], 1, 0.3); value = w.rotation.z; break; }
              case 'stagger': value = fn(3, 1, 0.06); break;
              default: throw new Error('unhandled helper');
            }
            if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('not finite: ' + value);
          });
        }
        return {};
      },
      tick() {},
    });
  }

  const out = { called, missing, notes, sane: null, bad: null, motion: {} };
  for (const bad of [false, true]) {
    const fig = primitivesFigure(bad);
    const el = document.createElement('div');
    el.style.width = '640px';
    document.body.appendChild(el);
    let html = '';
    try {
      const ctx = Any3d.mount(fig, { el });
      ctx.render();
      html = el.innerHTML;
      ctx.destroy();
    } catch (error) {
      const trace = String(error.stack || '').split(String.fromCharCode(10)).slice(0, 4).join(' / ');
      out.missing.push(`mount(${bad ? 'bad' : 'sane'}): ${error.message} :: ${trace}`);
    }
    const tokens = html.match(/\b(?:NaN|undefined|Infinity)\b/g);
    out[bad ? 'bad' : 'sane'] = {
      length: html.length,
      elements: (html.match(/<[a-z]/g) || []).length,
      tokens: tokens ? tokens.slice(0, 6) : [],
    };
  }
  return out;
}, { primitives, motion });

/* ---- assertions --------------------------------------------------------- */

check('page produced no script errors', pageErrors.length === 0, pageErrors.join(' | ').slice(0, 200));

const notCalled = [...primitives, ...motion].filter((name) => !result.called.includes(name));
check('every documented call exists and runs', notCalled.length === 0 && result.missing.length === 0,
  (notCalled.length ? `missing ${notCalled.join(', ')}` : result.missing.join(' | ')).slice(0, 240));

check('a figure using all of them draws', result.sane.elements >= 40, `${result.sane.elements} elements, ${result.sane.length} B`);
check('sane scene markup is finite', result.sane.tokens.length === 0, result.sane.tokens.join(', '));
check('bad arguments still draw', result.bad.elements >= 20, `${result.bad.elements} elements`);
check('bad arguments leave no NaN in the markup', result.bad.tokens.length === 0, result.bad.tokens.join(', '));

const badNames = new Set(result.missing.map((m) => m.split(':')[0]));
check('no call threw', result.missing.length === 0,
  [...badNames].join(', ') + (result.missing.length ? ` (${result.missing[0]})` : ''));

await browser.close();

console.log(`\n${passed}/${passed + failed} svg API checks passed`);
process.exit(failed > 0 ? 1 : 0);

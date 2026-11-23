import esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getSVGKernel,
  getSVGBenchTemplate,
  getWorldsKernel,
  getWorldsBenchTemplate,
  getPixelKernel,
  getPixelBenchTemplate,
} from './kernels.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

function extractTitle(code, fallback = 'Any3d Scene') {
  const match = /\btitle:\s*['"`]([^'"`]+)['"`]/.exec(code) || /\bname:\s*['"`]([^'"`]+)['"`]/.exec(code);
  return match ? match[1] : fallback;
}

/**
 * The camera the user picked in the studio, in the shape the runtimes accept.
 * Anything unusable becomes null so the export keeps the scene's own angle
 * instead of handing `setCamera` a NaN.
 */
function normalizeCamera(camera) {
  if (!camera || typeof camera !== 'object') return null;
  if (camera.reset === true) return { reset: true };
  const az = Number(camera.az);
  const el = Number(camera.el);
  if (!Number.isFinite(az) || !Number.isFinite(el)) return null;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const round = (v) => Math.round(v * 10) / 10;
  return { az: round(clamp(((az % 360) + 360) % 360, 0, 359.9)), el: round(clamp(el, -90, 90)) };
}

/** `window.__any3dCamera = ...` for the SVG bench, which reads it before the kernel. */
function cameraPrelude(camera) {
  const pick = normalizeCamera(camera);
  return pick ? `window.__any3dCamera = ${JSON.stringify(pick)};\n` : '';
}

export function balanceBraces(code) {
  let stripped = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:\\])\/\/[^\n]*/g, '$1')
    .replace(/('([^'\\]|\\.)*'|"([^"\\]|\\.)*"|`([^`\\]|\\.)*`)/g, '""');

  let openBraces = (stripped.match(/\{/g) || []).length;
  let closeBraces = (stripped.match(/\}/g) || []).length;

  if (openBraces > closeBraces) {
    let diff = openBraces - closeBraces;
    if (/\}\s*\)\s*;?$/.test(code.trim())) {
      let extra = '\n' + '  }'.repeat(diff);
      return code.trim().replace(/\}\s*\)\s*;?$/, extra + '\n});');
    } else if (/\)\s*;?$/.test(code.trim())) {
      let extra = '\n' + '  }'.repeat(diff);
      return code.trim().replace(/\)\s*;?$/, extra + '\n});');
    }
  }
  return code;
}

/**
 * Assemble a standalone offline HTML file for an Any3d SVG figure.
 */
export function bundleSVG(figureCode, look = null, camera = null) {
  const benchTemplate = getSVGBenchTemplate();
  const kernel = getSVGKernel();
  // Bake the look as the scene's initial state, so an export opened at dusk
  // starts at dusk even when the file is opened straight from disk.
  const lookPrelude = look
    ? `window.__any3dLook = ${JSON.stringify({
        timeOfDay: Math.min(1, Math.max(0, Number(look.timeOfDay) || 0)),
        weather: ['clear', 'rain', 'snow'].includes(look.weather) ? look.weather : 'clear',
      })};\n`
    : '';

  // The picked camera travels with the file the same way the look does.
  const cameraScript = cameraPrelude(camera);

  let sanitized = figureCode.replace(/\r\n/g, '\n').trim();

  // Self-heal common syntax quirks: duplicate opening brace or naked object literals
  sanitized = sanitized
    .replace(/\bAny3d\.figure\s*\(\s*\{\s*\{+/g, 'Any3d.figure({')
    .replace(/((?:Any3d)\.figure\s*\(\s*\{)\s*\{/g, '$1');

  if (!/\bAny3d\.figure\s*\(/.test(sanitized) && sanitized.startsWith('{')) {
    sanitized = `Any3d.figure(${sanitized.replace(/;?$/, '')});`;
  }

  if (/\bAny3d\.figure\s*\(/.test(sanitized) && !/\bname\s*:/.test(sanitized)) {
    const titleMatch = /\btitle\s*:\s*['"`]([^'"`]+)['"`]/.exec(sanitized);
    const fallbackName = titleMatch
      ? titleMatch[1].toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : 'any3d-scene';
    sanitized = sanitized.replace(/\bAny3d\.figure\s*\(\s*\{+/, `Any3d.figure({\n  name: '${fallbackName}',`);
  }

  sanitized = balanceBraces(sanitized);

  return benchTemplate
    .replace('/*KERNEL*/', () => `\n${lookPrelude}${cameraScript}${kernel}\n`)
    .replace('/*FIGURE*/', () => `\n${sanitized}\n`);
}

/**
 * Assemble a standalone offline HTML file for an Any3d Pixel scene.
 */
// A 2D engine has no camera, so `camera` is accepted and ignored.
export function bundlePixel(pixelCode, look = null, camera = null) {
  const benchTemplate = getPixelBenchTemplate();
  const kernel = getPixelKernel();
  const title = extractTitle(pixelCode, 'Pixel Scene') + ' · Any3d';
  const lookPrelude = look
    ? `window.__any3dLook = ${JSON.stringify({
        timeOfDay: Math.min(1, Math.max(0, Number(look.timeOfDay) || 0)),
        weather: ['clear', 'rain', 'snow'].includes(look.weather) ? look.weather : 'clear',
      })};\n`
    : '';

  return benchTemplate
    .replace('/*TITLE*/', () => title)
    .replace('/*KERNEL*/', () => `\n${lookPrelude}${kernel}\n`)
    .replace('/*SCENE*/', () => `\n${pixelCode.replace(/\r\n/g, '\n').trim()}\n`);
}

/**
 * Bundle a standalone offline HTML file for an Any3d Worlds scene using esbuild.
 */
export async function bundleWorlds(worldCode, look = null, camera = null) {
  const benchTemplate = getWorldsBenchTemplate();
  const worldKitPath = path.join(rootDir, 'core', 'kernels', 'any3d-world.js');

  const lookPrelude = look
    ? `const initialLook = ${JSON.stringify({
        timeOfDay: Math.min(1, Math.max(0, Number(look.timeOfDay) || 0)),
        weather: ['clear', 'rain', 'snow'].includes(look.weather) ? look.weather : 'clear',
      })};\n`
    : 'const initialLook = null;\n';

  const cameraPick = normalizeCamera(camera);
  const cameraInit = cameraPick
    ? `const initialCamera = ${JSON.stringify(cameraPick)};\n`
    : 'const initialCamera = null;\n';

  // Sanitize user code to remove unwanted imports and normalize export/define
  let cleanUserCode = worldCode
    .replace(/import\s+.*from\s+['"]@any3d\/worlds['"];?/g, '')
    .trim();

  // Normalize different export patterns to a consistent const defaultDefinition
  if (/export\s+default\s+defineWorld\s*\(/.test(cleanUserCode)) {
    cleanUserCode = cleanUserCode.replace(/export\s+default\s+defineWorld\s*\(/, 'const defaultDefinition = defineWorld(');
  } else if (/export\s+default\s+/.test(cleanUserCode)) {
    cleanUserCode = cleanUserCode.replace(/export\s+default\s+/, 'const defaultDefinition = ');
  } else if (!/\b(defaultDefinition|definition)\s*=/.test(cleanUserCode) && /\bdefineWorld\s*\(/.test(cleanUserCode)) {
    cleanUserCode = cleanUserCode.replace(/\bdefineWorld\s*\(/, 'const defaultDefinition = defineWorld(');
  }

  const entryCode = `
import * as THREE from 'three';
import { defineWorld, mountWorld, FINISHES } from '@any3d/worlds';

// User definition
${cleanUserCode}

const def = (typeof defaultDefinition !== 'undefined' && defaultDefinition) ? defaultDefinition : ((typeof definition !== 'undefined' && definition) ? definition : null);

// Fallback definition in case user definition was incomplete
const safeDef = def || defineWorld({
  name: 'any3d-world',
  title: 'Any3d World',
  duration: 4.0,
  still: 1.0,
  description: 'An interactive 3D miniature world.',
  bounds: [[-3.5, -0.6, -3.0], [3.5, 3.0, 3.0]],
  build(W) {
    W.terrain(6.0, 4.5, '#758852', 12);
    W.box(1.2, 0.8, 1.2, '#c8b69b', 0, 0.4, 0);
    return {};
  },
  tick() {}
});

const params = new URLSearchParams(location.search);
const stage = document.querySelector('#stage');
if (params.has('embed') || (typeof window !== 'undefined' && window.parent !== window)) document.documentElement.classList.add('embedded');

const titleEl = document.querySelector('#title');
const descEl = document.querySelector('#description');
if (titleEl && safeDef?.title) titleEl.textContent = safeDef.title;
if (descEl && safeDef?.description) descEl.textContent = safeDef.description;
if (safeDef?.title) document.title = safeDef.title + ' · Any3d Worlds';

const requested = params.get('finish');
const finish = FINISHES.includes(requested) ? requested : 'miniature';
const requestedSize = params.get('size') || (['hero', 'card'].includes(safeDef?.size) ? safeDef.size : 'card');
const runtime = mountWorld(safeDef, { el: stage, finish, size: requestedSize, paused: params.has('still') });
${lookPrelude}${cameraInit}
if (runtime && initialLook) {
  try { runtime.setLook(initialLook); } catch (e) {}
}
// The exported file opens at the angle the user framed, not the authored one.
if (runtime && initialCamera) {
  try { runtime.setCamera(initialCamera); } catch (e) {}
}
window.__world = runtime;
window.__any3d = runtime;

const select = document.querySelector('#finish');
if (select) select.value = finish;
const pause = document.querySelector('#pause');
const rate = document.querySelector('#rate');

if (runtime) {
  let paused = params.has('still');
  const update = () => {
    if (pause) {
      pause.textContent = paused ? 'Play scene' : 'Pause scene';
      pause.setAttribute('aria-pressed', String(paused));
    }
  };
  update();

  const tell = () => {
    if (parent !== window && location.origin !== 'null') {
      parent.postMessage({ type: 'any3d-world', name: safeDef.name, state: 'ready', ...runtime.stats() }, '*');
    }
  };

  if (select) {
    select.addEventListener('change', () => {
      runtime.setFinish(select.value);
      tell();
    });
  }

  if (rate) {
    rate.addEventListener('change', () => {
      runtime.setSpeed(Number(rate.value));
      tell();
    });
  }

  window.addEventListener('message', event => {
    const d = event.data;
    if (!d || d.type !== 'any3d-world') return;
    let changed = false;
    if (FINISHES.includes(d.finish)) {
      runtime.setFinish(d.finish);
      if (select) select.value = d.finish;
      changed = true;
    }
    if (['hero', 'card'].includes(d.size)) {
      if (runtime && runtime.setSize) runtime.setSize(d.size);
      changed = true;
    }
    if (typeof d.paused === 'boolean') {
      paused = d.paused;
      runtime.setPaused(paused);
      update();
      changed = true;
    }
    if (typeof d.still === 'boolean') {
      paused = d.still;
      runtime.setPaused(paused);
      update();
      changed = true;
    }
    if ([0.75, 1, 1.5].includes(d.speed)) {
      runtime.setSpeed(d.speed);
      if (rate) rate.value = String(d.speed);
      changed = true;
    }
    if (d.look !== undefined) runtime.setLook(d.look);
    if (d.camera && typeof d.camera.az === 'number' && typeof d.camera.el === 'number') {
      runtime.setCamera(d.camera);
      changed = true;
    }
    if (d.want === 'png') {
      try {
        const canvas = document.querySelector('#stage canvas');
        if (!canvas) {
          window.parent.postMessage({ type: 'any3d-world', png: { id: d.id, error: 'No canvas in the stage' } }, '*');
        } else {
          window.parent.postMessage({ type: 'any3d-world', png: { id: d.id, dataUrl: canvas.toDataURL('image/png') } }, '*');
        }
      } catch (err) {
        window.parent.postMessage({ type: 'any3d-world', png: { id: d.id, error: (err && err.message) || 'PNG capture failed' } }, '*');
      }
    }
    if (changed) tell();
  });

  if (pause) {
    pause.addEventListener('click', () => {
      paused = !paused;
      runtime.setPaused(paused);
      update();
    });
  }

  const resetBtn = document.querySelector('#reset');
  if (resetBtn && safeDef?.still != null) {
    resetBtn.addEventListener('click', () => runtime.seek(safeDef.still));
  }

  tell();
}
`;

  const result = await esbuild.build({
    stdin: {
      contents: entryCode,
      resolveDir: path.join(rootDir, 'core', 'kernels'),
      sourcefile: 'world-entry.js',
    },
    alias: {
      '@any3d/worlds': worldKitPath,
    },
    bundle: true,
    write: false,
    format: 'iife',
    platform: 'browser',
    target: ['es2022'],
    minify: true,
    legalComments: 'inline',
  });

  const bundledJs = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
  return benchTemplate.replace('<!-- SCRIPT_INJECTION -->', () => `<script>${bundledJs}</script>`);
}

/**
 * Unified bundler supporting every engine with smart auto-detection.
 */
export async function bundleScene(code, format = 'svg', look = null, camera = null) {
  // The ordered-dither engine was removed; its scenes were Pixel.scene documents
  // with `bayer`/`shadow` flags, so old shares still open through the pixel kernel.
  if (format === 'dither') format = 'pixel';
  if (!code || !code.trim()) {
    return bundleSVG('Any3d.figure({ name: "empty", title: "Empty Scene", build: function(o) { var D=o.D, pal=o.pal; return { ground: D.slab(8, 6, pal.ground, 0, 0, 0, null, { h: 0.5, r: 0.8, side: pal.base }) }; } });');
  }

  // Detect genuine engine format from the code itself
  const hasWorlds = /\bdefineWorld\b/.test(code);
  const hasPixel = /\bPixel\.scene\b/.test(code);
  const hasSVG = /\bAny3d\.figure\b/.test(code);

  if (hasWorlds) {
    return await bundleWorlds(code, look, camera);
  }
  if (hasPixel) {
    return bundlePixel(code, look, camera);
  }
  if (hasSVG) {
    return bundleSVG(code, look, camera);
  }
  return bundleSVG(code, look, camera);

  // Fallback by requested format
  if (format === 'worlds') {
    return await bundleWorlds(code, look);
  }
  if (format === 'pixel') {
    return bundlePixel(code, look);
  }
  return bundleSVG(code, look);
}

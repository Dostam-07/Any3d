/**
 * Quick manual verification of Phase 2 features using real presets:
 * - Color change ("make it red") across SVG, Worlds, Pixel
 * - Pronoun resolution ("remove it", "move it left")
 * - Cross-engine reference resolution
 */
import fs from 'node:fs';
import path from 'node:path';
import { editSceneOffline } from '../server/llm/offline-editor.js';
import { validateScene } from '../server/engine/validator.js';

let passed = 0;
let failed = 0;
function check(name, condition, detail = '') {
  if (condition) { passed++; console.log(`PASS: ${name}`); }
  else { failed++; console.log(`FAIL: ${name} ${detail}`); }
}

const ROOT = process.cwd();

// --- SVG: cafe preset → make it red → move it left → add car → remove it ---
const svgCode = fs.readFileSync(path.join(ROOT, 'server/presets/svg/cafe.js'), 'utf8');

let r1 = editSceneOffline(svgCode, 'make it red', 'svg');
check('SVG make it red changed', r1.changed, r1.summary);
let v1 = validateScene(r1.code, 'svg');
check('SVG make it red valid', v1.valid);
check('SVG recolored to coral', r1.code.includes('pal.coral'));

let r2 = editSceneOffline(r1.code, 'move it left', 'svg');
check('SVG move it left changed', r2.changed, r2.summary);
let v2 = validateScene(r2.code, 'svg');
check('SVG move it left valid', v2.valid);

let r3 = editSceneOffline(r2.code, 'add a car', 'svg');
check('SVG add car changed', r3.changed, r3.summary);

let r4 = editSceneOffline(r3.code, 'remove it', 'svg');
check('SVG remove it changed', r4.changed, r4.summary);

// --- Worlds: bakery preset → add a bench → recolor it red ---
const worldsCode = fs.readFileSync(path.join(ROOT, 'server/presets/worlds/bakery.js'), 'utf8');

let w1 = editSceneOffline(worldsCode, 'add a car', 'worlds');
check('Worlds add car changed', w1.changed, w1.summary);
let w2 = editSceneOffline(w1.code, 'make it red', 'worlds');
check('Worlds make it red changed', w2.changed, w2.summary);
let vw2 = validateScene(w2.code, 'worlds');
check('Worlds make it red valid', vw2.valid);

// --- Pixel: flower-stall preset → make it blue ---
const pixelCode = fs.readFileSync(path.join(ROOT, 'server/presets/pixel/flower-stall.js'), 'utf8');

let p1 = editSceneOffline(pixelCode, 'make it blue', 'pixel');
check('Pixel make it blue changed', p1.changed, p1.summary);
let vp1 = validateScene(p1.code, 'pixel');
check('Pixel make it blue valid', vp1.valid);

// --- Dither: forge preset → make it red ---
const ditherCode = fs.readFileSync(path.join(ROOT, 'server/presets/dither/forge.js'), 'utf8');

let d1 = editSceneOffline(ditherCode, 'make it red', 'dither');
check('Dither make it red changed', d1.changed, d1.summary);

// --- Failure message has rephrasings ---
let bad = editSceneOffline(svgCode, 'make it fly to the moon', 'svg');
check('Failure has rephrasing', bad.summary.includes('Try:') && bad.summary.includes('or'), bad.summary);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
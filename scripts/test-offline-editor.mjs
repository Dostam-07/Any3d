/**
 * Offline editor acceptance test.
 *
 * Run:  node scripts/test-offline-editor.mjs
 *
 * It uses the real presets and the real validator: an edit only passes when it
 * actually changed the code, still validates, and contains the expected shape.
 */

import fs from 'node:fs';
import path from 'node:path';
import { editSceneOffline } from '../server/llm/offline-editor.js';
import { validateScene } from '../server/engine/validator.js';

const ROOT = process.cwd();
const PRESET_DIR = path.join(ROOT, 'server', 'presets', 'svg');

let passed = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) passed += 1;
  else failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

function preset(name) {
  return fs.readFileSync(path.join(PRESET_DIR, `${name}.js`), 'utf8');
}

function apply(code, instruction) {
  const result = editSceneOffline(code, instruction, 'svg');
  const valid = result.changed ? validateScene(result.code, 'svg').valid : null;
  return { ...result, valid };
}

const base = preset('cafe');
const steps = [];

// 1. add a car
const addCar = apply(base, 'add a car');
check('add car changed', addCar.changed, addCar.summary);
check('add car valid', addCar.valid === true);
check('add car tagged', addCar.code.includes('/*a3d:car*/'));
steps.push(addCar.code);

// 2. follow-up pronoun: a lap + hover, applied to the car we just added
const lap = apply(addCar.code, 'it can do a lap in the open road, when I hover on it');
check('lap changed', lap.changed, lap.summary);
check('lap valid', lap.valid === true);
check('lap orbits', lap.code.includes('Math.cos(a3dT*.8)'));
check('lap lifts on hover', /hover===a3d_car_0\?\.22:0/.test(lap.code));
check('lap targets the car', lap.code.includes('a3d_car_0.position.x'));

// 3. add driver / worker
const addDriver = apply(base, 'add driver');
check('add driver changed', addDriver.changed, addDriver.summary);
check('add driver valid', addDriver.valid === true);
check('add driver is a person', addDriver.code.includes('/*a3d:person*/'));
check('add driver named driver', addDriver.code.includes("name='driver'"));

// 4. counted add
const threeTrees = apply(base, 'add three trees');
check('add three trees changed', threeTrees.changed, threeTrees.summary);
check('add three trees valid', threeTrees.valid === true);
check('add three trees count', (threeTrees.code.match(/\/\*a3d:tree\*\//g) || []).length === 3);

// 5. remove the car we added
const removeCar = apply(addCar.code, 'remove the car');
check('remove car changed', removeCar.changed, removeCar.summary);
check('remove car valid', removeCar.valid === true);
check('remove car gone', !removeCar.code.includes('/*a3d:car*/'));

// 6. remove a documented prop (town has props.tree)
const town = preset('town');
const removeTree = apply(town, 'remove a tree');
check('remove prop changed', removeTree.changed, removeTree.summary);
check('remove prop valid', removeTree.valid === true);
check('remove prop stripped', removeTree.code.includes('/* removed */'));

// 7. body / vehicle breadth
for (const [instruction, marker] of [
  ['add a truck', '/*a3d:truck*/'],
  ['add a bicycle', '/*a3d:bike*/'],
  ['add a boat', '/*a3d:boat*/'],
  ['add a bench', '/*a3d:bench*/'],
  ['add a crate', '/*a3d:crate*/'],
  ['add a fence', '/*a3d:fence*/'],
  ['add a sign', '/*a3d:sign*/'],
  ['add a dog', '/*a3d:dog*/'],
  ['add a bird', '/*a3d:bird*/'],
  ['add a flag', '/*a3d:flag*/'],
]) {
  const r = apply(base, instruction);
  check(`${instruction} changed`, r.changed, r.summary);
  check(`${instruction} valid`, r.valid === true);
  check(`${instruction} tagged`, r.code.includes(marker));
}

// 8. motion on a scene's own object (racing-style var names are covered in presets too)
const spin = apply(addCar.code, 'make the car spin');
check('spin changed', spin.changed, spin.summary);
check('spin valid', spin.valid === true);
check('spin writes rotation', spin.code.includes('a3d_car_0.rotation.y='));

const bigger = apply(addCar.code, 'make the car bigger');
check('scale changed', bigger.changed, bigger.summary);
check('scale valid', bigger.valid === true);
check('scale writes scale', bigger.code.includes('setScalar'));

const move = apply(addCar.code, 'move the car left');
check('move changed', move.changed, move.summary);
check('move valid', move.valid === true);
check('move writes position', move.code.includes('.position.x -='));

// 9. theme
const night = apply(base, 'make it night');
check('theme changed', night.changed, night.summary);
check('theme valid', night.valid === true);
check('theme is night', night.code.includes("theme: 'night'"));

// 10. unrelated question must not pretend to change anything
const unrelated = apply(base, 'explain the lighting');
check('unrelated makes no change', unrelated.changed === false);
check('unrelated is honest', unrelated.summary.includes('could not map'));

// 11. the message lists what is supported
check('message lists capability', unrelated.summary.includes('cars'));

// 12. non-svg is reported, not broken
const nonSvg = editSceneOffline(base.replace("theme: 'soft'", ''), 'add a car', 'worlds');
check('non-svg honest', nonSvg.changed === false && /SVG scenes/.test(nonSvg.summary));

console.log('');
console.log(`assertions : ${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log('');
  for (const f of failures) console.log(`  FAIL  ${f}`);
  process.exitCode = 1;
}

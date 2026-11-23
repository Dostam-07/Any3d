/**
 * Guard the documented `W` toolkit.
 *
 *   node scripts/verify-worlds-api.mjs
 *
 * docs/guides/worlds-scene-api.md is the contract scene authors and the LLM
 * prompt both read. Nothing checked that its primitives still exist, still
 * draw, or still refuse to emit NaN geometry when handed a bad number. This
 * walks the guide, calls every documented primitive twice (once sanely, once
 * with non-finite and out-of-range arguments) and inspects the result.
 */
import fs from 'node:fs';
import * as THREE from 'three';
import { toolkit } from '../core/kernels/any3d-world.js';

// `surface` needs a canvas to build its wear texture.
if (typeof global.document === 'undefined') {
  global.document = {
    createElement(tag) {
      if (tag === 'canvas') {
        return { width: 0, height: 0, getContext: () => ({ fillStyle: '', fillRect() {} }) };
      }
      return {};
    },
  };
}

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

const doc = fs.readFileSync('docs/guides/worlds-scene-api.md', 'utf8');
// Toolkit bullets only: no fenced code samples, and a bullet may document more
// than one call (`tree(...)`; `bench(...)`).
const section = doc
  .split('## Runtime and embedding')[0]
  .replace(/```[\s\S]*?```/g, '');
const documented = [...new Set(
  section.split(/\r?\n/)
    .filter((line) => line.startsWith('- '))
    .flatMap((line) => [...line.matchAll(/`([A-Za-z]+)\(/g)].map((m) => m[1])),
)];
check('guide documents the toolkit', documented.length >= 12, `${documented.join(', ')}`);

/** Sane calls, plus a `bad` variant that must be coerced rather than trusted. */
const CALLS = {
  group: (W) => W.group(1, 0, 2),
  box: (W) => W.box(1, 1, 1, '#b45309', 0, 0.5, 0),
  ball: (W) => W.ball(0.4, '#dcb35a', 1, 0.5, 0),
  cylinder: (W) => W.cylinder(0.3, 1, '#7c8f4a', -1, 0.5, 0),
  line: (W) => W.line([[0, 0, 0], [1, 1, 0], [2, 0, 0]], '#111'),
  ring: (W) => W.ring(0.6, '#94a3b8', 2, 0.2, 2),
  surface: (W) => W.surface(3, 2, '#8a9a5b', 0, 0.05, 0),
  terrain: (W) => W.terrain(8, 6),
  grass: (W) => W.grass(8, 6, 40),
  tree: (W) => W.tree(3, -3, 1.1),
  bench: (W) => W.bench(-3, 2, 0.4),
  person: (W) => W.person(0, 0),
};

const CALLS_BAD = {
  group: (W) => W.group(NaN, Infinity, undefined),
  box: (W) => W.box(NaN, -Infinity, undefined, '#b45309', NaN, NaN, NaN),
  ball: (W) => W.ball(NaN, '#dcb35a', NaN, Infinity, NaN),
  cylinder: (W) => W.cylinder(NaN, NaN, NaN, '#7c8f4a', NaN, NaN, NaN, undefined, 0),
  line: (W) => W.line([[NaN, 0, 0], [0, Infinity, 0]], '#111', NaN),
  ring: (W) => W.ring(NaN, '#94a3b8', NaN, NaN, NaN, undefined, NaN, NaN),
  surface: (W) => W.surface(NaN, NaN, '#8a9a5b', NaN, NaN, NaN),
  terrain: (W) => W.terrain(NaN, NaN),
  grass: (W) => W.grass(NaN, NaN, NaN),
  tree: (W) => W.tree(NaN, NaN, NaN),
  bench: (W) => W.bench(NaN, NaN, NaN),
  person: (W) => W.person(NaN, NaN),
};

const parent = new THREE.Group();
const W = toolkit(parent);

const exercised = new Set();
let buildError = null;
try {
  for (const [name, call] of Object.entries(CALLS)) {
    call(W);
    exercised.add(name);
  }
  // Tapered call shape, the one that once produced NaN geometry: the colour
  // argument used to land in the segment slot and reach CylinderGeometry.
  W.cylinder(0.4, 0.9, 1.2, '#a16207', -2, 0.6, 1, undefined, 6);
  W.cylinder(0.4, 0.9, 1.2, '#a16207', 2, 0.6, -1, undefined, 'eight');
  // Actor controls: reach + plant must pose a real person.
  const actor = W.person(2, 2, '#dcb35a', '#34433b', 0.9);
  W.plant(actor, { crouch: 0.04, lean: 0.1, twist: 0.05 });
  const palm = W.reach(actor, 1, [2.4, 0.9, 2.5]);
  exercised.add('reach');
  exercised.add('plant');
  const JOINTS = ['root', 'body', 'chest', 'head', 'face', 'leftArm', 'rightArm', 'leftForearm', 'rightForearm',
    'leftHand', 'rightHand', 'leftLeg', 'rightLeg', 'leftShin', 'rightShin', 'leftFoot', 'rightFoot'];
  check('person returns the documented joints', JOINTS.every((k) => actor[k]), Object.keys(actor).length + ' joints');
  check('reach returns a finite palm endpoint',
    Array.isArray(palm) ? palm.length === 3 && palm.every(Number.isFinite) : false, JSON.stringify(palm));
  // Helpers documented alongside the primitives.
  check('random / phase / smooth are callable',
    typeof W.random() === 'number' && W.phase(1, 4) >= 0 && W.phase(1, 4) < 1 && W.smooth(2) === 1);
  for (const helper of ['random', 'phase', 'smooth']) exercised.add(helper);
  check('THREE and own are exposed', W.THREE === THREE && typeof W.own === 'function');
  const owned = new THREE.BufferGeometry();
  check('own registers a disposable', W.own(owned) === owned);
  exercised.add('own');
  owned.dispose();
} catch (error) {
  buildError = error;
}
check('every documented primitive builds', !buildError, buildError ? buildError.message : '');

// The bad-argument pass runs in its own toolkit so its meshes are inspected too.
const badParent = new THREE.Group();
const WBad = toolkit(badParent);
const badErrors = [];
for (const [name, call] of Object.entries(CALLS_BAD)) {
  try {
    call(WBad);
  } catch (error) {
    badErrors.push(`${name}: ${error.message}`);
  }
}
check('bad arguments never throw', badErrors.length === 0, badErrors.join(' | '));

/** Every vertex, normal, uv and index in the tree must be a real number. */
function inspect(root) {
  const problems = [];
  let meshes = 0;
  let vertices = 0;
  root.updateMatrixWorld(true);
  root.traverse((object) => {
    // A NaN transform blanks the mesh just as surely as a NaN vertex.
    const transform = [...object.position.toArray(), ...object.scale.toArray(), ...object.quaternion.toArray(), ...object.matrixWorld.elements];
    if (!transform.every(Number.isFinite)) problems.push(`${object.name || object.type}.transform`);
    if (!object.isMesh) return;
    meshes += 1;
    const geometry = object.geometry;
    for (const [name, attribute] of Object.entries(geometry.attributes)) {
      const array = attribute.array;
      vertices += attribute.count;
      for (let i = 0; i < array.length; i += 1) {
        if (!Number.isFinite(array[i])) {
          problems.push(`${object.name || object.type}.${name}[${i}]`);
          break;
        }
      }
    }
    if (geometry.index) {
      const index = geometry.index.array;
      for (let i = 0; i < index.length; i += 1) {
        if (!Number.isFinite(index[i]) || index[i] >= geometry.attributes.position.count) {
          problems.push(`${object.name || object.type}.index[${i}]`);
          break;
        }
      }
    }
    geometry.computeBoundingSphere();
    const radius = geometry.boundingSphere ? geometry.boundingSphere.radius : NaN;
    if (!Number.isFinite(radius)) problems.push(`${object.name || object.type}.boundingSphere`);
  });
  return { problems, meshes, vertices };
}

const sane = inspect(parent);
check('documented calls produce a populated scene', sane.meshes >= 15, `${sane.meshes} meshes, ${sane.vertices} vertices`);
check('geometry values are all finite', sane.problems.length === 0, sane.problems.slice(0, 4).join(', '));

const coerced = inspect(badParent);
check('bad arguments still produce finite geometry', coerced.problems.length === 0,
  coerced.problems.slice(0, 4).join(', ') || `${coerced.meshes} meshes`);

// Documented ⇄ exercised must match in both directions, so a new guide entry
// without a call, or a silent primitive nobody documented, fails here.
const missingCalls = documented.filter((name) => !exercised.has(name));
const undocumented = [...exercised].filter((name) => !documented.includes(name));
check('every documented builder is exercised', missingCalls.length === 0, missingCalls.join(', '));
check('every exercised builder is documented', undocumented.length === 0, undocumented.join(', '));

// Segment counts are clamped to 3..96: an absurd count must not build a huge
// buffer, and a too-small one must not build a degenerate (NaN) one.
{
  const probe = new THREE.Group();
  const WSeg = toolkit(probe);
  const count = (segments) => {
    const before = probe.children.length;
    WSeg.cylinder(1, 1, '#ffffff', 0, 0, 0, undefined, segments);
    return probe.children[before].geometry.attributes.position.count;
  };
  // The guide documents segments as the 8th argument (plain) and 9th
  // (tapered); presets pass 10, 16, 20 and 32, and those were once silently
  // dropped, so every cylinder came out at 8.
  const divisions = (segments) => {
    WSeg.cylinder(0.5, 0.3, 1, '#ffffff', 0, 0, 0, undefined, segments);
    return probe.children[probe.children.length - 1].geometry.parameters.radialSegments;
  };
  check('documented segments argument is honoured', divisions(32) === 32 && divisions(12) === 12,
    `plain ${divisions(32)}, tapered ${divisions(12)}`);
  const huge = count(100000);
  const tooSmall = count(2);
  const eight = count(8);
  check('segment counts are clamped', huge <= 1200, `${huge} vertices at 100000 segments`);
  check('too-few segments fall back to 8', tooSmall === eight, `${tooSmall} vs ${eight} vertices`);
}

const realKeys = new Set(Object.keys(W));
const fallbacks = documented.filter((name) => !realKeys.has(name));
check('documented names are real toolkit methods, not proxy fallbacks', fallbacks.length === 0, fallbacks.join(', '));

console.log(`\n${passed}/${passed + failed} worlds API checks passed`);
process.exit(failed > 0 ? 1 : 0);

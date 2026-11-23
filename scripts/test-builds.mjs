import * as THREE from 'three';
import { toolkit } from '../core/kernels/any3d-world.js';
import { synthesizeProceduralScene } from '../server/engine/procedural.js';

// Mock DOM elements that surface/terrain need
if (typeof document === 'undefined') {
  global.document = {
    createElement(tag) {
      if (tag === 'canvas') {
        return {
          width: 0,
          height: 0,
          getContext: () => ({
            fillStyle: '',
            fillRect: () => {},
          }),
        };
      }
      return {};
    },
  };
}

const parent = new THREE.Group();
const W = toolkit(parent);

const prompts = [
  'A sprawling deep-water maritime shipping container terminal: a massive container freighter docked along a concrete quay, rail-mounted gantry cranes actively lifting colored shipping containers, transport trucks queueing in striped transit lanes, stacks of modular cargo crates, a harbor tugboat with water spray escort, and animated ocean waves with channel buoys.',
  'A teacher stands in front of a chalkboard',
  'A modern automated crop farm with GPS combines',
  'A rocket launchpad with gantry tower',
  'A bustling city street with crosswalks',
  'A warehouse with forklift',
  'A coffee shop barista',
  'A tennis court match',
  'A basketball court game',
  'A hospital emergency ward',
  'A construction site excavator',
  'A seaside harbor with fishing boats',
  'An airport runway with planes',
  'A cozy campsite campfire with tents'
];

let failed = 0;
for (const p of prompts) {
  const code = synthesizeProceduralScene(p, 'worlds', null, 'hero');
  const clean = code
    .replace(/import\s+.*from\s+['"]@any3d\/worlds['"];?/g, '')
    .replace(/export\s+default\s+defineWorld\s*\(/, 'return (');
  try {
    const fn = new Function('THREE', 'defineWorld', clean);
    const def = fn(THREE, (d) => d);
    const parts = def.build(W);
    console.log('SUCCESS:', p.slice(0, 32), 'Parts:', Object.keys(parts || {}));
  } catch (err) {
    console.error('FAILED:', p.slice(0, 32), err.stack);
    failed++;
  }
}

if (failed > 0) {
  console.error(`Total failures: ${failed}`);
  process.exit(1);
} else {
  console.log('All worlds procedural builds succeeded!');
}

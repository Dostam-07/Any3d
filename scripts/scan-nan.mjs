// Scans preset/procedural scenes for non-finite geometry data.
import * as THREE from 'three';
import fs from 'node:fs';
import path from 'node:path';
import { toolkit } from '../core/kernels/any3d-world.js';
import { synthesizeProceduralScene } from '../server/engine/procedural.js';

if (typeof document === 'undefined') {
  global.document = {
    createElement() {
      return { width: 0, height: 0, getContext: () => ({ fillStyle: '', fillRect: () => {} }) };
    },
  };
}

const reports = [];

function checkGroup(name, obj) {
  obj.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    const g = o.geometry;
    for (const [attrName, attr] of Object.entries(g.attributes)) {
      const a = attr.array;
      for (let i = 0; i < a.length; i++) {
        if (!Number.isFinite(a[i])) {
          reports.push(`${name}: ${g.type} (${o.name || 'unnamed'}) attribute ${attrName}[${i}] = ${a[i]}`);
          return;
        }
      }
    }
    for (const p of ['x', 'y', 'z']) {
      if (!Number.isFinite(o.position[p]) || !Number.isFinite(o.scale[p]) || !Number.isFinite(o.rotation[p])) {
        reports.push(`${name}: ${g.type} non-finite transform ${p} pos=${o.position[p]} scale=${o.scale[p]} rot=${o.rotation[p]}`);
        return;
      }
    }
  });
}

// Presets
const worldsDir = path.resolve('server/presets/worlds');
for (const file of fs.readdirSync(worldsDir).filter((f) => f.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(worldsDir, file), 'utf8');
  const clean = src
    .replace(/^import[\s\S]*?;$/gm, '')
    .replace(/export\s+default\s+/g, 'return ')
    .replace(/^export\s+/gm, '');
  try {
    const def = new Function('defineWorld', 'THREE', clean)((d) => d, THREE);
    const parent = new THREE.Group();
    const W = toolkit(parent);
    def.build(W);
    checkGroup(`preset:${file}`, parent);
  } catch (err) {
    reports.push(`preset:${file} BUILD FAILED ${err.message}`);
  }
}

// Procedural synthesis
const prompts = [
  'A sprawling deep-water maritime shipping container terminal',
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
  'A cozy campsite campfire with tents',
  'A lighthouse on a cliff',
  'A train station platform',
];
for (const p of prompts) {
  const code = synthesizeProceduralScene(p, 'worlds', null, 'hero');
  const clean = code
    .replace(/import\s+.*from\s+['"]@any3d\/worlds['"];?/g, '')
    .replace(/export\s+default\s+defineWorld\s*\(/, 'return (');
  try {
    const def = new Function('THREE', 'defineWorld', clean)(THREE, (d) => d);
    const parent = new THREE.Group();
    const W = toolkit(parent);
    def.build(W);
    checkGroup(`proc:${p.slice(0, 28)}`, parent);
  } catch (err) {
    reports.push(`proc:${p.slice(0, 28)} BUILD FAILED ${err.message}`);
  }
}

if (reports.length === 0) console.log('No non-finite geometry values found.');
else {
  console.log(`Found ${reports.length} issue(s):`);
  for (const r of reports) console.log(' -', r);
}

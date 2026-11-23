import fs from 'node:fs';
import path from 'node:path';
import { editSceneOffline } from '../server/llm/offline-editor.js';
import { validateScene } from '../server/engine/validator.js';

const ROOT = process.cwd();

// Test 1: Worlds preset
const worldsCode = fs.readFileSync(path.join(ROOT, 'server', 'presets', 'worlds', 'bakery.js'), 'utf8');

// 1. Add tree to worlds
const wAddTree = editSceneOffline(worldsCode, 'add a tree', 'worlds');
console.log('Worlds add tree:', wAddTree.changed, wAddTree.summary);
if (!wAddTree.changed || !wAddTree.code.includes('W.tree')) throw new Error('Worlds add tree failed');
const val1 = validateScene(wAddTree.code, 'worlds');
if (!val1.valid) throw new Error('Worlds add tree invalid: ' + JSON.stringify(val1));

// 2. Add bench to worlds
const wAddBench = editSceneOffline(wAddTree.code, 'add a bench', 'worlds');
console.log('Worlds add bench:', wAddBench.changed, wAddBench.summary);
if (!wAddBench.changed || !wAddBench.code.includes('W.bench')) throw new Error('Worlds add bench failed');

// 3. Remove tree from worlds
const wRemoveTree = editSceneOffline(wAddBench.code, 'remove the tree', 'worlds');
console.log('Worlds remove tree:', wRemoveTree.changed, wRemoveTree.summary);
if (!wRemoveTree.changed || wRemoveTree.code.includes('W.tree')) throw new Error('Worlds remove tree failed');

// 4. Switch finish to blueprint in worlds
const wBlueprint = editSceneOffline(worldsCode, 'switch finish to blueprint', 'worlds');
console.log('Worlds blueprint:', wBlueprint.changed, wBlueprint.summary);
if (!wBlueprint.changed || !wBlueprint.code.includes("finish: 'blueprint'")) throw new Error('Worlds blueprint failed');

// Test 2: Pixel preset
const pixelCode = fs.readFileSync(path.join(ROOT, 'server', 'presets', 'pixel', 'flower-stall.js'), 'utf8');

// 5. Add tree to pixel
const pAddTree = editSceneOffline(pixelCode, 'add a tree', 'pixel');
console.log('Pixel add tree:', pAddTree.changed, pAddTree.summary);
if (!pAddTree.changed || !pAddTree.code.includes('/*a3d:tree*/')) throw new Error('Pixel add tree failed');
const val2 = validateScene(pAddTree.code, 'pixel');
if (!val2.valid) throw new Error('Pixel add tree invalid: ' + JSON.stringify(val2));

// 6. Remove tree from pixel
const pRemoveTree = editSceneOffline(pAddTree.code, 'remove the tree', 'pixel');
console.log('Pixel remove tree:', pRemoveTree.changed, pRemoveTree.summary);
if (!pRemoveTree.changed || pRemoveTree.code.includes('/*a3d:tree*/')) throw new Error('Pixel remove tree failed');

console.log('ALL MULTI-FORMAT OFFLINE TESTS PASSED!');

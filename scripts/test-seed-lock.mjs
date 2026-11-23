/**
 * Seed-lock reproduction check — Phase 1, Track A2.
 *
 * Runs the same prompt through the deterministic procedural fallback twice
 * and compares the two generated scenes. The procedural path ignores the
 * model seed (it is pure geometry from prompt semantics), so identical
 * input must produce identical output. This is the part of "same seed ≈
 * same scene" that can be verified without a live LLM provider.
 *
 * Model-path (Ollama / Gemini) seed reproduction requires a live provider
 * and an API key; it is documented below but cannot be exercised here.
 *
 * Run: node scripts/test-seed-lock.mjs
 */

import { synthesizeProceduralScene } from '../server/engine/procedural.js';

const CASES = [
  { prompt: 'A morning bakery with a baker rolling dough', format: 'worlds' },
  { prompt: 'A coffee cart on a street corner', format: 'svg' },
  { prompt: 'A flower stall on wet cobblestone', format: 'pixel' },
  { prompt: 'A mountain forge with glowing embers', format: 'pixel' },
  { prompt: 'A lighthouse island with a docking boat', format: 'worlds' },
  { prompt: 'A kitchen with a steaming kettle', format: 'svg' },
];

let passed = 0;
const failures = [];

function norm(code) {
  return (code || '').replace(/\r\n/g, '\n').trimEnd();
}

for (const { prompt, format } of CASES) {
  const a = norm(synthesizeProceduralScene(prompt, format));
  const b = norm(synthesizeProceduralScene(prompt, format));
  const identical = a === b;
  if (identical) passed += 1;
  else failures.push(`${format}/${prompt.slice(0, 30)}`);
  console.log(
    `${identical ? 'PASS' : 'FAIL'}  ${format.padEnd(7)}  "${prompt}"  ` +
    `(code ${a.length} → ${b.length} bytes)`
  );
}

console.log('');
console.log(`Procedural determinism: ${passed}/${CASES.length} cases byte-identical across two runs.`);

if (failures.length) {
  console.log('Non-identical cases:', failures.join(', '));
  process.exit(1);
}

/**
 * Model-path note (cannot be run offline):
 *
 *   const res1 = await generateAny3d({ provider: 'ollama', model: 'qwen2.5-coder:1.5b', seed: 42, ... });
 *   const res2 = await generateAny3d({ provider: 'ollama', model: 'qwen2.5-coder:1.5b', seed: 42, ... });
 *   // compare res1.code === res2.code (code identity) or render both and pixel-diff (pixel delta)
 *
 * The model path is non-deterministic across providers and temperatures, so
 * "same seed ≈ same scene" can only be backed by numbers against a specific
 * provider+model. Until that measurement exists, the claim is softened to:
 *   "The procedural fallback is deterministic; model output is reproducible
 *   only when provider, model, temperature and seed are all fixed."
 */

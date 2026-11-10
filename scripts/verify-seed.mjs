/**
 * Seed reproduction check.
 *
 *   node scripts/verify-seed.mjs
 *
 * Two layers:
 *  1. The procedural path is deterministic by construction — two runs of the
 *     same prompt must produce byte-identical code on every engine.
 *  2. The provider plumbing must send a seed with temperature 0 for both Ollama
 *     and Gemini when a seed is locked.
 *
 * A live model is required to measure model-backed reproduction; that is
 * reported as not-run here rather than claimed as passing.
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { synthesizeProceduralScene } from '../server/engine/procedural.js';

const checks = [];
const check = (label, ok, detail = '') => {
  checks.push({ label, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`);
};

const codeOf = (value) =>
  typeof value === 'string' ? value : value && (value.code || value.source || value.scene);

const prompts = [
  'A corner bookshop with a cat sleeping in the window',
  'A night-time rocket launchpad with floodlights and a gantry',
];
const formats = ['svg', 'worlds', 'pixel', 'dither'];

for (const prompt of prompts) {
  for (const format of formats) {
    const a = codeOf(synthesizeProceduralScene(prompt, format));
    const b = codeOf(synthesizeProceduralScene(prompt, format));
    check(
      `${format}: same prompt is stable`,
      typeof a === 'string' && a.length > 60 && a === b,
      typeof a === 'string' ? `${a.length} chars` : 'no code returned'
    );
  }
}

const servicePath = fileURLToPath(new URL('../server/llm/service.js', import.meta.url));
const service = fs.readFileSync(servicePath, 'utf8');
check(
  'Ollama sends the seed with temperature 0',
  /temperature:\s*seed == null \? 0\.25 : 0/.test(service) && /seed:\s*seed == null \? undefined : seed/.test(service)
);
check(
  'Gemini sends the seed with temperature 0',
  /temperature:\s*seed == null \? 0\.3 : 0/.test(service) && /\.\.\.\(seed == null \? \{\} : \{ seed \}\)/.test(service)
);

const failed = checks.filter((c) => !c.ok);
console.log(
  `\n${checks.length - failed.length}/${checks.length} checks passed. ` +
    'Model-backed reproduction was not measured: it needs a live provider.'
);
process.exit(failed.length ? 1 : 0);

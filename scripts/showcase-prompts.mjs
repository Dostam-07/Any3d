// Builds the showcase "prompt only" scenes with the exact generator the server
// falls back to when a local model times out, and writes them in the shape
// GET /api/generate returns so the capture script can seed a session.
//
// Deterministic and offline: no model, no network. Run automatically by
// scripts/showcase.mjs (including in CI, where .tmp/ starts empty).
import { mkdirSync, writeFileSync } from 'node:fs';
import { synthesizeProceduralScene } from '../server/engine/procedural.js';
import { validateScene } from '../server/engine/validator.js';

export const SHOWCASE_PROMPTS = [
  { file: 'market', size: 'hero', prompt: 'a bustling night market with noodle stalls and paper lanterns' },
  { file: 'glacier', size: 'hero', prompt: 'a lighthouse at the edge of a glacier with a stranded research hut' },
  { file: 'greenhouse', size: 'card', prompt: 'a rooftop greenhouse with a robotic watering arm and tomato rows' },
  { file: 'coral', size: 'card', prompt: 'an underwater coral nursery with divers planting fragments' },
];

export function buildPromptScenes(outDir = '.tmp/novel') {
  mkdirSync(outDir, { recursive: true });
  const built = [];
  for (const scene of SHOWCASE_PROMPTS) {
    const code = synthesizeProceduralScene(scene.prompt, 'worlds', null, scene.size);
    const validation = validateScene(code, 'worlds', scene.prompt);
    const payload = {
      code,
      validation,
      format: 'worlds',
      provider: 'ollama',
      model: 'procedural-synth',
      fallbackNotice: `Synthesized dynamic procedural Any3d scene for "${scene.prompt.slice(0, 45)}" (local model exceeded the generation timeout).`,
    };
    writeFileSync(`${outDir}/${scene.file}.json`, JSON.stringify(payload, null, 2));
    built.push({ ...scene, valid: Boolean(validation.valid), lines: code.split('\n').length });
  }
  return built;
}

// Allow `node scripts/showcase-prompts.mjs` for a quick standalone rebuild.
if (process.argv[1] && process.argv[1].endsWith('showcase-prompts.mjs')) {
  for (const scene of buildPromptScenes()) {
    console.log(`${scene.file}: valid=${scene.valid} lines=${scene.lines}`);
  }
}

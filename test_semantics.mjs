import { extractPromptSemantics } from './server/engine/semantics.js';

const QUICK_PROMPTS = [
  'A cozy retro coffee cart with a sleeping cat',
  'A nocturnal rocket launchpad with gantry arms',
  'A seaside lighthouse island with waves',
  'A Japanese hot spring onsen pavilion',
  'A high-tech sci-fi research lab with holograms',
  'A mountain watermill forge with spinning wheel',
];

for (const p of QUICK_PROMPTS) {
  const s = extractPromptSemantics(p);
  console.log(`PROMPT: "${p}"`);
  console.log(`  category: ${s.category}`);
  console.log(`  primarySubject: ${s.primarySubject}`);
  console.log(`  subjectType: ${s.subjectType}`);
  console.log(`  environment: ${s.environment}`);
  console.log('---');
}


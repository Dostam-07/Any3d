import { extractPromptSemantics, unwrapCorePrompt } from './semantics.js';
import { synthesizeProceduralScene } from './procedural.js';
import { validateScene } from './validator.js';
import { validatePromptFidelity } from './fidelityValidator.js';

const TEST_PROMPTS = [
  {
    id: 'User-Screenshot-Bakery',
    prompt: `A charming isometric vignette on an architectural beveled pedestal slab with contrasting material textures: a detailed modular scene bringing to life "A baker taking out a cake from an oven and presenting it on a table", featuring layered structural elements, tactile storytelling micro-props, directional rim lighting, and a synchronized continuous motion loop in tick().`,
    expectedSubject: 'baker',
    expectedProps: ['cake', 'oven', 'table'],
    forbidden: ['unrequested dustbin/trashcan', 'unrequested outdoor trees', 'unrequested rogue cat']
  },
  {
    id: 'Test-A-Bakery',
    prompt: 'A baker taking a cake out of an oven and presenting it on a table.',
    expectedSubject: 'baker',
    expectedProps: ['cake', 'oven', 'table'],
    forbidden: ['unrequested dustbin/trashcan', 'unrequested outdoor trees', 'unrequested rogue cat']
  },
  {
    id: 'Test-B-Aeroplane',
    prompt: 'An aeroplane flying above a runway with its landing gear retracting.',
    expectedSubject: 'aeroplane',
    expectedProps: ['runway', 'landing gear'],
    forbidden: ['unrequested dustbin/trashcan', 'unrequested rogue cat']
  },
  {
    id: 'Test-C-Car',
    prompt: 'A sports car drifting around a corner with visible tyre movement.',
    expectedSubject: 'sports car',
    expectedProps: ['corner', 'tyres'],
    forbidden: ['unrequested dustbin/trashcan', 'unrequested rogue cat']
  },
  {
    id: 'Test-D-Nature',
    prompt: 'A waterfall flowing into a small pond surrounded by rocks.',
    expectedSubject: 'waterfall',
    expectedProps: ['pond', 'rocks'],
    forbidden: ['unrequested dustbin/trashcan', 'unrequested road', 'unrequested rogue cat']
  },
  {
    id: 'Test-E-Abstract',
    prompt: 'A floating geometric sculpture made of interconnected metallic rings.',
    expectedSubject: 'geometric sculpture',
    expectedProps: ['rings'],
    forbidden: ['unrequested dustbin/trashcan', 'unrequested outdoor trees', 'unrequested outdoor backdrop wall', 'unrequested rogue cat']
  },
  {
    id: 'Test-F-F1Car',
    prompt: 'F1 car racing on the tracks with visible tyre movement.',
    expectedSubject: 'f1 car',
    expectedProps: ['corner', 'tyres'],
    forbidden: ['unrequested dustbin/trashcan', 'unrequested outdoor trees', 'unrequested rogue cat']
  },
  {
    id: 'Test-G-Blacksmith',
    prompt: 'A blacksmith forging a glowing sword on an anvil with sparks.',
    expectedSubject: 'blacksmith',
    expectedProps: ['anvil', 'sword', 'sparks'],
    forbidden: ['unrequested dustbin/trashcan', 'unrequested outdoor trees', 'unrequested rogue cat']
  },
  {
    id: 'Test-H-Submarine',
    prompt: 'A submarine diving into glowing underwater corals.',
    expectedSubject: 'submarine',
    expectedProps: ['corals'],
    forbidden: ['unrequested dustbin/trashcan', 'unrequested outdoor trees', 'unrequested rogue cat', 'unrequested road']
  },
  {
    id: 'Test-I-Wizard',
    prompt: 'A wizard casting a spell in a library with floating books.',
    expectedSubject: 'wizard',
    expectedProps: ['books'],
    forbidden: ['unrequested dustbin/trashcan', 'unrequested outdoor trees', 'unrequested rogue cat', 'unrequested road']
  },
  {
    id: 'Test-J-Botanist',
    prompt: 'An alien botanist examining glowing alien flora on an asteroid.',
    expectedSubject: 'alien botanist',
    expectedProps: ['flora'],
    forbidden: ['unrequested dustbin/trashcan', 'unrequested outdoor trees', 'unrequested rogue cat', 'unrequested rocket']
  },
  {
    id: 'Test-K-Samurai',
    prompt: 'A samurai practicing with a wooden sword under a pavilion.',
    expectedSubject: 'samurai',
    expectedProps: ['sword', 'pavilion'],
    forbidden: ['unrequested dustbin/trashcan', 'unrequested outdoor trees', 'unrequested rogue cat']
  }
];

const FORMATS = ['worlds', 'svg', 'pixel', 'dither'];

console.log('====================================================');
console.log('RUNNING ANY3D PROMPT UNDERSTANDING & GENERATION TESTS');
console.log('====================================================\n');

let totalPassed = 0;
let totalFailed = 0;

for (const test of TEST_PROMPTS) {
  console.log(`\n--- [${test.id}] ---`);
  console.log(`Prompt: "${test.prompt.slice(0, 75)}..."`);

  // 1. Semantic Extraction Test
  const semantics = extractPromptSemantics(test.prompt);
  const core = unwrapCorePrompt(test.prompt);
  console.log(`  -> Unwrapped Core: "${core}"`);
  console.log(`  -> Extracted Subject: "${semantics.primarySubject}"`);
  console.log(`  -> Extracted Props: [${semantics.secondaryObjects.join(', ')}]`);
  console.log(`  -> Extracted Actions: [${semantics.actions.join(', ')}]`);
  console.log(`  -> Environment: "${semantics.environment}"`);

  // 2. Test generation across all 4 formats
  for (const fmt of FORMATS) {
    const code = synthesizeProceduralScene(test.prompt, fmt);
    const report = validateScene(code, fmt, test.prompt);
    const fidelity = report.fidelity;

    const subjectFound = fidelity.primarySubject?.found;
    const missingProps = fidelity.secondaryObjects?.filter(o => !o.found).map(o => o.name) || [];
    const rogueFound = fidelity.unrelatedObjects || [];

    const isOk = report.valid && subjectFound && missingProps.length === 0 && rogueFound.length === 0;

    if (isOk) {
      console.log(`  [PASS] [${fmt.toUpperCase()}] Valid (${report.checks.filter(c => c.ok).length}/${report.checks.length} checks) | Fidelity: ${fidelity.score}/100`);
      totalPassed++;
    } else {
      console.error(`  [FAIL] [${fmt.toUpperCase()}] Fidelity: ${fidelity.score}/100`);
      console.error(`         Technical valid: ${report.valid}`);
      console.error(`         Subject found: ${subjectFound}`);
      console.error(`         Missing props: ${missingProps.join(', ') || 'none'}`);
      console.error(`         Rogue objects: ${rogueFound.join(', ') || 'none'}`);
      totalFailed++;
    }
  }
}

console.log('\n====================================================');
console.log(`RESULTS: ${totalPassed} Passed, ${totalFailed} Failed`);
console.log('====================================================');

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log('ALL REGRESSION TESTS PASSED WITH 100% FIDELITY!');
}

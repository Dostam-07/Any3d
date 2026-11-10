import { generateScene } from './server/llm/service.js';

async function testHarbour() {
  const result = await generateScene({
    provider: 'ollama',
    prompt: 'A busy container harbour quay with a gantry crane lifting cargo and a tractor stopping at a gate',
    format: 'svg',
    size: 'card'
  });
  console.log('Result code length:', result.code.length);
  console.log('Validation passed:', result.validation.valid);
  console.log('Checks count:', result.validation.checks.length);
  if (!result.validation.valid) {
    console.error('Failed checks:', result.validation.checks.filter(c => !c.ok));
    process.exit(1);
  }
  console.log('TEST HARBOUR PASSED!');
}

testHarbour();

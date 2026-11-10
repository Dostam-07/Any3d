// Test what the generate endpoint actually returns for each Try prompt
const QUICK_PROMPTS = [
  'A cozy retro coffee cart with a sleeping cat',
  'A seaside lighthouse island with waves',
];

async function testGenerate(prompt) {
  console.log(`\n=== Testing: "${prompt}" ===`);
  try {
    const res = await fetch('http://localhost:3001/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'ollama',
        ollamaHost: 'http://localhost:11434',
        model: 'qwen2.5-coder:1.5b',
        format: 'svg',
        prompt: prompt,
      }),
    });
    const data = await res.json();
    if (data.error) {
      console.log(`  ERROR: ${data.error}`);
      return;
    }
    console.log(`  fallbackNotice: ${data.fallbackNotice || 'none'}`);
    // Check if code contains racing keywords
    const code = data.code || '';
    const hasRacing = /grand prix|rumble|kerb|pirelli|formula|f1|drifting|race\s*track/i.test(code);
    console.log(`  contains racing keywords: ${hasRacing}`);
    // Print first 200 chars of code
    console.log(`  code start: ${code.substring(0, 200)}...`);
  } catch (e) {
    console.log(`  FETCH ERROR: ${e.message}`);
  }
}

(async () => {
  for (const p of QUICK_PROMPTS) {
    await testGenerate(p);
  }
})();


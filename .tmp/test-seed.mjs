let bodies = [];
globalThis.fetch = async (url, init = {}) => {
  const u = String(url);
  if (u.endsWith('/api/tags')) return new Response(JSON.stringify({ models: [{ name: 'qwen2.5-coder:1.5b' }] }), { status: 200 });
  if (u.endsWith('/api/chat')) {
    bodies.push(JSON.parse(init.body));
    const code = "```javascript\nAny3d.figure({ name: 'probe', title: 'probe', build: function (o) { var D = o.D; D.box(1, 1, 1, '#fff', 0, 0, 0); return {}; } });\n```";
    return new Response(JSON.stringify({ message: { content: code } }), { status: 200 });
  }
  return new Response('not found', { status: 404 });
};
const { generateScene } = await import('../server/llm/service.js');
let passed = 0, failed = 0;
const check = (label, ok, detail = '') => { if (ok) passed++; else { failed++; console.error(`  FAIL ${label} ${detail}`); } };

bodies = [];
await generateScene({ provider: 'ollama', prompt: 'a test kiosk', format: 'svg', model: 'qwen2.5-coder:1.5b', seed: 4242 });
const locked = bodies[0]?.options || {};
check('locked seed reaches the sampler', locked.seed === 4242, JSON.stringify(locked));
check('locked seed forces temperature 0', locked.temperature === 0, JSON.stringify(locked));

bodies = [];
await generateScene({ provider: 'ollama', prompt: 'a test kiosk', format: 'svg', model: 'qwen2.5-coder:1.5b', seed: null });
const free = bodies[0]?.options || {};
check('unlocked sends no seed', free.seed === undefined, JSON.stringify(free));
check('unlocked keeps the creative temperature', free.temperature === 0.25, JSON.stringify(free));
check('the request carried the prompt', (bodies[0]?.messages?.[1]?.content || '').includes('test kiosk'));

console.log(`seed assertions       : ${passed} passed, ${failed} failed`);
if (failed) process.exit(1);

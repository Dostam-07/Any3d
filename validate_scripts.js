import fs from 'node:fs';
import vm from 'node:vm';

for (const fmt of ['svg', 'worlds', 'pixel', 'dither']) {
  const html = fs.readFileSync(`test_${fmt}.html`, 'utf8');
  const scripts = [];
  const regex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (match[1].trim()) {
      scripts.push(match[1]);
    }
  }
  console.log(`Found ${scripts.length} script blocks in test_${fmt}.html`);
  scripts.forEach((code, idx) => {
    try {
      new vm.Script(code);
      console.log(`  Script ${idx + 1}: Valid syntax`);
    } catch (err) {
      console.error(`  Script ${idx + 1} ERROR in test_${fmt}.html:`, err.message);
    }
  });
}


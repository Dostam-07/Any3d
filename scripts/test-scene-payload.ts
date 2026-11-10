/**
 * Phase 0 acceptance tests for the scene payload.
 *
 * Run with:  npm run test:payload
 *
 * Covers:
 *  - lossless round-trip for every preset in server/presets
 *  - URL budget for a ~6 KB scene
 *  - plain-base64 codec fallback (browsers without CompressionStream)
 *  - rejection of malformed / unsupported / oversized payloads
 *  - comment stripping that respects strings and template literals
 */

import fs from 'node:fs';
import { transformSync } from 'esbuild';
import path from 'node:path';
import type { RenderFormat } from '../src/types';
import {
  encodeScene,
  decodeScene,
  sceneSharePath,
  bytesToBase64Url,
  stripCodeComments,
  ScenePayloadError,
  SCENE_PAYLOAD_VERSION,
  type ScenePayload,
  compactCode,
  SHARE_ROUTE_SOFT_LIMIT,
} from '../src/lib/scene-payload';

const ROOT = process.cwd();
const PRESET_DIR = path.join(ROOT, 'server', 'presets');

let passed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    passed += 1;
  } else {
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function collectPresets(): { file: string; format: RenderFormat; code: string }[] {
  const out: { file: string; format: RenderFormat; code: string }[] = [];
  for (const dir of fs.readdirSync(PRESET_DIR)) {
    const abs = path.join(PRESET_DIR, dir);
    if (!fs.statSync(abs).isDirectory()) continue;
    for (const file of fs.readdirSync(abs)) {
      if (!file.endsWith('.js')) continue;
      out.push({
        file: `${dir}/${file}`,
        format: dir as RenderFormat,
        code: fs.readFileSync(path.join(abs, file), 'utf8'),
      });
    }
  }
  return out;
}

async function expectReject(
  name: string,
  encoded: string,
  reason: string
) {
  try {
    await decodeScene(encoded);
    check(name, false, 'expected a rejection, got a payload');
  } catch (err) {
    const ok = err instanceof ScenePayloadError && err.reason === reason;
    check(name, ok, err instanceof Error ? err.message : String(err));
  }
}

async function main() {
  const presets = collectPresets();
  check('found 44 presets', presets.length === 44, `found ${presets.length}`);

  let maxEncoded = 0;
  let maxEncodedFile = '';
  let largestCode = 0;
  let largestFile = '';
  let totalRatio = 0;

  for (const preset of presets) {
    const payload: ScenePayload = {
      v: SCENE_PAYLOAD_VERSION,
      format: preset.format,
      code: preset.code,
      prompt: `preset ${preset.file}`,
      theme: 'toy',
    };
    const encoded = await encodeScene(payload);
    const decoded = await decodeScene(encoded);

    check(`round-trip code ${preset.file}`, decoded.code === preset.code);
    check(`round-trip format ${preset.file}`, decoded.format === preset.format);
    check(`round-trip prompt ${preset.file}`, decoded.prompt === payload.prompt);

    // Look-state baking: a scene shared at dusk must reopen at dusk. Encode the
    // same payload again with a non-default look and verify it survives.
    const looked = await encodeScene({
      v: SCENE_PAYLOAD_VERSION,
      format: preset.format,
      code: preset.code,
      look: { timeOfDay: 0.72, weather: 'rain' },
      seed: 4242,
    });
    const lookedDecoded = await decodeScene(looked);
    check(`look round-trip timeOfDay ${preset.file}`, lookedDecoded.look?.timeOfDay === 0.72, `${lookedDecoded.look?.timeOfDay}`);
    check(`look round-trip weather ${preset.file}`, lookedDecoded.look?.weather === 'rain', `${lookedDecoded.look?.weather}`);
    check(`seed round-trip ${preset.file}`, lookedDecoded.seed === 4242, `${lookedDecoded.seed}`);

    check(`no padding ${preset.file}`, !/[=+/]/.test(encoded), 'base64url must be padding-free');
    if (/[^A-Za-z0-9_-]/.test(encoded)) {
      check(`url-safe ${preset.file}`, false, 'encoded payload contains non-url characters');
    }

    // Compaction must never break the scene: comments are gone, syntax is intact.
    try {
      transformSync(compactCode(preset.code), { loader: 'js' });
      check(`compacted scene still parses ${preset.file}`, true);
    } catch (err) {
      check(`compacted scene still parses ${preset.file}`, false, String(err));
    }

    const ratio = encoded.length / preset.code.length;
    totalRatio += ratio;

    if (encoded.length > maxEncoded) {
      maxEncoded = encoded.length;
      maxEncodedFile = preset.file;
    }
    if (preset.code.length > largestCode) {
      largestCode = preset.code.length;
      largestFile = preset.file;
    }
  }

  // Share budget: measured on real presets, not guessed.
  const shareSample = presets.find((p) => p.file === 'svg/cafe') || presets[0];
  const shareEncoded = await encodeScene(
    { v: SCENE_PAYLOAD_VERSION, format: shareSample.format, code: shareSample.code },
    { compact: true }
  );
  const shareRoute = sceneSharePath(shareEncoded).length;
  check(
    'share route under soft limit',
    shareRoute < SHARE_ROUTE_SOFT_LIMIT,
    `${shareRoute} chars for ${shareSample.code.length} bytes of code`
  );

  const routes: number[] = [];
  for (const preset of presets) {
    const enc = await encodeScene(
      { v: SCENE_PAYLOAD_VERSION, format: preset.format, code: preset.code },
      { compact: true }
    );
    routes.push(sceneSharePath(enc).length);
  }
  routes.sort((a, b) => a - b);
  const p50 = routes[Math.floor(routes.length * 0.5)];
  const p90 = routes[Math.floor(routes.length * 0.9)];
  const p95 = routes[Math.floor(routes.length * 0.95)];
  check('median share route under 3.2 KB', p50 < 3200, `${p50} chars`);
  check('p95 share route under soft limit', p95 < SHARE_ROUTE_SOFT_LIMIT, `${p95} chars`);

  // Plain codec fallback — proves links still decode where CompressionStream is absent.
  const plainJson = JSON.stringify({ v: 1, format: 'svg', code: 'export default 1;\n' });
  const plainEncoded = `p${bytesToBase64Url(new TextEncoder().encode(plainJson))}`;
  const plainDecoded = await decodeScene(plainEncoded);
  check('plain codec decodes', plainDecoded.code === 'export default 1;\n');

  // Rejections
  await expectReject('rejects empty', '', 'empty');
  await expectReject('rejects unknown codec', 'zzzz', 'unsupported-codec');
  await expectReject('rejects bad base64', 'r!!!!', 'malformed');
  await expectReject(
    'rejects future version',
    `p${bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ v: 99, format: 'svg', code: 'x' })))}`,
    'unsupported-version'
  );
  await expectReject(
    'rejects missing code',
    `p${bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ v: 1, format: 'svg', code: '  ' })))}`,
    'missing-code'
  );
  await expectReject(
    'rejects unknown engine',
    `p${bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ v: 1, format: 'voxel', code: 'x' })))}`,
    'invalid-format'
  );

  // Comment stripping
  const sample = [
    '// leading comment',
    'const url = "https://example.com/a//b";',
    'const tpl = `line // not a comment`;',
    '/* block',
    '   comment */',
    'const keep = 1; // trailing',
  ].join('\n');
  const stripped = stripCodeComments(sample);
  check('strips line comments', !stripped.includes('leading comment'));
  check('strips trailing comments', !stripped.includes('trailing'));
  check('strips block comments', !stripped.includes('block'));
  check('keeps urls in strings', stripped.includes('https://example.com/a//b'));
  check('keeps template literals', stripped.includes('line // not a comment'));
  check('keeps real code', stripped.includes('const keep = 1;'));

  const avgRatio = totalRatio / presets.length;

  console.log('');
  console.log(`presets round-tripped : ${presets.length}`);
  console.log(`largest preset        : ${largestFile} (${largestCode} B code)`);
  console.log(`largest payload       : ${maxEncoded} chars (${maxEncodedFile})`);
  console.log(`compression ratio     : ${(avgRatio * 100).toFixed(1)}% of raw code`);
  console.log(`share route sample    : ${sceneSharePath(shareEncoded).length} chars`);
  console.log(`assertions            : ${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log('');
    for (const failure of failures) console.log(`  FAIL  ${failure}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('test run crashed:', err);
  process.exitCode = 1;
});

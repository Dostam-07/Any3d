import { validatePromptFidelity } from './fidelityValidator.js';

/**
 * Deterministic validator for Any3d scene formats:
 * - Any3d SVG
 * - Any3d Worlds (Three.js)
 * - Any3d Pixel (Canvas software rasterizer)
 * - Any3d Dither (4x4 ordered dither yard miniatures)
 */

const LINES = { hero: 420, card: 240, mini: 150 };
const LABELS = { hero: 1, card: 0, mini: 0 };
const COLOURS = { hero: 14, card: 10, mini: 6 };

export function validateSVG(code) {
  const checks = [];
  const addCheck = (id, label, ok, message = '') => checks.push({ id, label, ok, message });

  // 0. Syntax check (detects unexpected tokens, unclosed braces, etc.)
  let syntaxOk = true;
  let syntaxError = '';
  try {
    new Function(code);
  } catch (err) {
    syntaxOk = false;
    syntaxError = `SyntaxError: ${err.message}`;
  }
  addCheck(0, 'syntax', syntaxOk, syntaxError);

  const strip = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\])\/\/[^\n]*/g, "$1");

  // 1. Declaration
  const hasDoubleBrace = /\bAny3d\.figure\s*\(\s*\{\s*\{/.test(strip);
  const calls = [...strip.matchAll(/\bAny3d\.figure\s*\(\s*\{/g)];
  const decl = calls.length === 1 ? strip.slice(calls[0].index) : "";
  const nameMatch = /\bname:\s*["'`]([^"'`]*)["'`]/.exec(decl);
  const sizeMatch = /\bsize:\s*["'`]([^"'`]*)["'`]/.exec(decl);
  const meansMatch = /\bmeans:\s*["'`]([^"'`]*)["'`]/.exec(decl);
  const name = nameMatch ? nameMatch[1] : null;
  const size = sizeMatch ? sizeMatch[1] : null;
  const means = meansMatch ? meansMatch[1] : null;
  const hasBuild = /\bbuild\s*(\(|:)/.test(decl);
  const hasTick = /\btick\s*(\(|:)/.test(decl);

  const declOk = !hasDoubleBrace && calls.length === 1 && !!name && /^[a-z][a-z0-9-]*$/.test(name) &&
    ["hero", "card", "mini"].includes(size) && (!means || means.length <= 140) && hasBuild && hasTick;

  let declError = '';
  if (hasDoubleBrace) declError = 'Invalid duplicate opening brace in Any3d.figure({{ ... })';
  else if (calls.length !== 1) declError = `Found ${calls.length} Any3d.figure calls, expected exactly 1`;
  else if (!name) declError = 'Missing name attribute';
  else if (!/^[a-z][a-z0-9-]*$/.test(name)) declError = `Name "${name}" must be lowercase and hyphenated`;
  else if (!["hero", "card", "mini"].includes(size)) declError = `Invalid size "${size}", must be hero, card, or mini`;
  else if (!means) declError = 'Missing means attribute';
  else if (means.length > 140) declError = `Means exceeds 140 characters (${means.length})`;
  else if (!hasBuild) declError = 'Missing build() function';
  else if (!hasTick) declError = 'Missing tick() function';

  addCheck(1, 'declaration', declOk, declError);

  const s = ["hero", "card", "mini"].includes(size) ? size : "card";

  // 2. Length Budget
  const lineCount = code.split('\n').length;
  addCheck(2, 'length', lineCount <= LINES[s], `${lineCount} lines (budget: $\\le$ ${LINES[s]} for a ${s})`);

  // 3. Clock Purity
  const clockViolation = /\b(requestAnimationFrame|setTimeout|setInterval|@keyframes)\b/.exec(strip);
  addCheck(3, 'clock', !clockViolation, clockViolation ? `Prohibited ${clockViolation[1]} used; all motion must be derived from ctx.t in tick()` : '');

  // 4. Self-Contained
  const netViolation = /\b(import\s*\(|^\s*import\s|fetch\s*\(|XMLHttpRequest|WebSocket|document\.createElement\s*\(\s*["']script)/m.exec(strip);
  addCheck(4, 'self-contained', !netViolation, netViolation ? `Forbidden external/network call: ${netViolation[0]}` : '');

  // 5. Words / Labels
  const labelsCount = (strip.match(/\bD\.label\s*\(/g) || []).length;
  addCheck(5, 'words', labelsCount <= LABELS[s], `${labelsCount} D.label calls (limit: ${LABELS[s]} for ${s})`);

  // 6. Distinct Colors Budget
  const hexMatches = strip.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g) || [];
  const uniqueHex = new Set(hexMatches.map(h => h.toLowerCase()));
  addCheck(6, 'colours', uniqueHex.size <= COLOURS[s], `${uniqueHex.size} hex colors in code (limit: ${COLOURS[s]} for ${s})`);

  // 7. Base Presence
  const hasBase = /\bD\.slab\s*\(/.test(strip);
  addCheck(7, 'base', hasBase, hasBase ? '' : 'Missing D.slab: scene needs a ground base for shadows');

  // 8. Pointer / Touch Responsiveness
  const readsPointer = /\bctx\.(pointer|hover|pressed|active)\b|\bhot\s*[:=]/.test(strip);
  const namesHot = !/\bhot\s*[:=]/.test(strip) || /\.name\s*=/.test(strip);
  const pointerOk = s === 'mini' || (readsPointer && namesHot);
  addCheck(8, 'pointer', pointerOk, !readsPointer ? 'Hero/card must answer pointer (ctx.hover, ctx.pressed, or parts.hot)' : 'Hot groups must declare .name for read-out');

  // 9. Complexity & Detail Density (Anti-Blob)
  const geomCount = (strip.match(/\bD\.(box|cyl|cone|ball|dome|wedge|wheel|torus|slab|props\.\w+)\s*\(/g) || []).length;
  const isComplexEnough = s === 'mini' ? geomCount >= 4 : geomCount >= 6;
  addCheck(9, 'complexity', isComplexEnough, isComplexEnough ? '' : `Low geometric density (${geomCount} parts). Compose scenes with slender structural members, trims, windows, and props instead of crude blocks.`);

  // 10. Palette Color Diversity
  const palMatches = strip.match(/\bpal\.([a-zA-Z]+)\b/g) || [];
  const uniquePals = new Set(palMatches.map(p => p.slice(4)));
  const hasColorVariety = uniquePals.size >= 3;
  addCheck(10, 'palette-diversity', hasColorVariety, hasColorVariety ? '' : `Only ${uniquePals.size} palette colors used. Use at least 4-6 contrasting palette colors (e.g. pal.coral, pal.mustard, pal.sky, pal.paper, pal.steel).`);

  // 11. Anti-Monolith Guard (flags single oversized blocks when detail density is low)
  const isMonolith = geomCount < 12 && /\bD\.box\s*\(\s*([8-9]|\d{2,})\s*,\s*([3-9]|\d{2,})/g.test(strip);
  addCheck(11, 'anti-blob', !isMonolith, isMonolith ? 'Oversized monolithic block detected. Break large volumes into modular pillars, frames, walls, and trim.' : '');

  return {
    valid: checks.every(c => c.ok),
    format: 'svg',
    name: name || 'untitled',
    size: s,
    checks
  };
}

export function validateWorlds(code) {
  const checks = [];
  const addCheck = (id, label, ok, message = '') => checks.push({ id, label, ok, message });

  const strip = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\])\/\/[^\n]*/g, "$1");

  // 1. Definition
  const hasDefine = /\bdefineWorld\s*\(\s*\{/.test(strip);
  const nameMatch = /\bname:\s*['"`]([a-z][a-z0-9-]*)['"`]/.exec(strip);
  const hasBuild = /\bbuild\s*(\(|:)/.test(strip);
  const hasTick = /\btick\s*(\(|:)/.test(strip);
  const hasDuration = /\bduration\b/.test(strip);
  const hasStill = /\bstill\b/.test(strip);

  const defOk = hasDefine && !!nameMatch && hasBuild && hasTick && hasDuration && hasStill;
  addCheck(1, 'definition', defOk, !defOk ? 'Invalid defineWorld structure (missing name, build, tick, duration or still)' : '');

  // 2. Clock Purity
  const clockViolation = /\b(requestAnimationFrame|setTimeout|setInterval)\b/.exec(strip);
  addCheck(2, 'clock', !clockViolation, clockViolation ? `Prohibited ${clockViolation[1]} used; time is provided via { t } in tick` : '');

  // 3. Self-Contained
  const netViolation = /\b(fetch\s*\(|XMLHttpRequest|WebSocket)\b/.exec(strip);
  addCheck(3, 'self-contained', !netViolation, netViolation ? `Forbidden network call: ${netViolation[0]}` : '');

  // 4. Bounds Check
  const hasBounds = /\bbounds\s*:\s*\[/.test(strip);
  addCheck(4, 'bounds', hasBounds, !hasBounds ? 'Scene should specify bounds: [[minX, minY, minZ], [maxX, maxY, maxZ]]' : '');

  return {
    valid: checks.every(c => c.ok),
    format: 'worlds',
    name: nameMatch ? nameMatch[1] : 'world',
    checks
  };
}

export function validatePixel(code) {
  const checks = [];
  const addCheck = (id, label, ok, message = '') => checks.push({ id, label, ok, message });

  const strip = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\])\/\/[^\n]*/g, "$1");

  // 1. Declaration
  const calls = [...strip.matchAll(/\bPixel\.scene\s*\(\s*\{/g)];
  const nameMatch = /\bname:\s*["'`]([^"'`]*)["'`]/.exec(strip);
  const name = nameMatch ? nameMatch[1] : null;
  const hasBuild = /\bbuild\s*(\(|:)/.test(strip);
  const hasTick = /\btick\s*(\(|:)/.test(strip);
  const hasGround = /\bground\s*:\s*\{/.test(strip);

  const declOk = calls.length === 1 && !!name && /^[a-z][a-z0-9-]*$/.test(name) && hasBuild && hasTick;
  addCheck(1, 'declaration', declOk, !declOk ? 'Must declare exactly one Pixel.scene({ ... }) with build, tick, name' : '');

  // 2. Length Budget (260 lines)
  const lineCount = code.split('\n').length;
  addCheck(2, 'length', lineCount <= 260, `${lineCount} lines (budget: $\\le$ 260 lines)`);

  // 3. Clock Purity
  const clockViolation = /\b(requestAnimationFrame|setTimeout|setInterval)\b/.exec(strip);
  addCheck(3, 'clock', !clockViolation, clockViolation ? `Prohibited ${clockViolation[1]} used; time is provided via ctx.t / ctx.q in tick` : '');

  // 4. Ground Presence
  addCheck(4, 'ground', hasGround, hasGround ? '' : 'Pixel scene requires ground: { rx, rz, ... } definition');

  // 5. Self-Contained
  const netViolation = /\b(fetch\s*\(|XMLHttpRequest|WebSocket)\b/.exec(strip);
  addCheck(5, 'self-contained', !netViolation, netViolation ? `Forbidden network call: ${netViolation[0]}` : '');

  return {
    valid: checks.every(c => c.ok),
    format: 'pixel',
    name: name || 'pixel-scene',
    checks
  };
}

export function validateDither(code) {
  const checks = [];
  const addCheck = (id, label, ok, message = '') => checks.push({ id, label, ok, message });

  const strip = code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\])\/\/[^\n]*/g, "$1");

  // 1. Declaration
  const calls = [...strip.matchAll(/\bPixel\.scene\s*\(\s*\{/g)];
  const nameMatch = /\bname:\s*["'`]([^"'`]*)["'`]/.exec(strip);
  const name = nameMatch ? nameMatch[1] : null;
  const hasBuild = /\bbuild\s*(\(|:)/.test(strip);
  const hasTick = /\btick\s*(\(|:)/.test(strip);

  const declOk = calls.length === 1 && !!name && hasBuild && hasTick;
  addCheck(1, 'declaration', declOk, !declOk ? 'Must declare Pixel.scene({ ... }) with build, tick, and name' : '');

  // 2. Length (260 lines max)
  const lineCount = code.split('\n').length;
  addCheck(2, 'length', lineCount <= 260, `${lineCount} lines (budget: $\\le$ 260 lines)`);

  // 3. Clock Purity
  const clockViolation = /\b(requestAnimationFrame|setTimeout|setInterval)\b/.exec(strip);
  addCheck(3, 'clock', !clockViolation, clockViolation ? `Prohibited ${clockViolation[1]} used` : '');

  // 4. Self-Contained
  const netViolation = /\b(fetch\s*\(|XMLHttpRequest|WebSocket)\b/.exec(strip);
  addCheck(4, 'self-contained', !netViolation, netViolation ? `Forbidden network call` : '');

  return {
    valid: checks.every(c => c.ok),
    format: 'dither',
    name: name || 'dither-scene',
    checks
  };
}

export function validateScene(code, format = 'svg', prompt = '') {
  let report;
  if (format === 'worlds' || /defineWorld/.test(code)) {
    report = validateWorlds(code);
  } else if (format === 'pixel') {
    report = validatePixel(code);
  } else if (format === 'dither') {
    report = validateDither(code);
  } else {
    report = validateSVG(code);
  }

  // If a prompt is provided, run prompt fidelity verification
  if (prompt && prompt.trim()) {
    const fidelity = validatePromptFidelity(code, prompt, format);
    report.fidelity = fidelity;
    report.checks = [...report.checks, ...fidelity.checks];
    report.valid = report.valid && fidelity.valid;
  }

  return report;
}

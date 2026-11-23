/**
 * Offline scene editor — deterministic, no model required.
 *
 * The chat box has to be useful with no coding model connected. This module
 * turns a plain-language add / remove / move / animate request into code
 * changes it can verify, for SVG figures (the engine the examples and the
 * generator produce most often). It never reports a change it did not make and
 * never ships code that fails validation when the input passed.
 *
 * Supported, by design:
 *   add / remove  people, cars, trucks, buses, bicycles, boats, benches,
 *                 tables, chairs, crates, barrels, trees, bushes, flowers,
 *                 rocks, fences, lamps, signs, dogs, cats, birds, flags, cones
 *   count         "add three trees"
 *   move          left / right / forward / back / up / down
 *   scale         bigger / smaller / taller / wider
 *   motion        spin, bob, sway, pulse, orbit ("do a lap", "circle")
 *   interaction   "when I hover" lifts the thing under the pointer
 *   theme         night, soft, mono, line, print, toy
 *
 * Anything else is reported honestly instead of silently doing nothing.
 */

import { validateScene } from '../engine/validator.js';

function balanceBraces(code) {
  const stripped = code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:\\])\/\/[^\n]*/g, '$1')
    .replace(/('([^'\\]|\\.)*'|"([^"\\]|\\.)*"|`([^`\\]|\\.)*`)/g, '""');

  const openBraces = (stripped.match(/\{/g) || []).length;
  const closeBraces = (stripped.match(/\}/g) || []).length;

  if (openBraces > closeBraces) {
    const diff = openBraces - closeBraces;
    if (/\}\s*\)\s*;?$/.test(code.trim())) {
      const extra = '\n' + '  }'.repeat(diff);
      return code.trim().replace(/\}\s*\)\s*;?$/, extra + '\n});');
    } else if (/\)\s*;?$/.test(code.trim())) {
      const extra = '\n' + '  }'.repeat(diff);
      return code.trim().replace(/\)\s*;?$/, extra + '\n});');
    }
  }
  return code;
}

const SLOTS = [
  [-3.2, 1.4],
  [3.2, 1.4],
  [-3.2, -1.4],
  [3.2, -1.4],
  [0, 2.2],
  [0, -2.2],
  [2.4, 0.2],
  [-2.4, 0.2],
];

const COUNTS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };

const VERB = { orbit: 'drives a lap', spin: 'spins', bob: 'bobs', sway: 'sways', pulse: 'pulses' };

/* HTML/CSS color names → SVG palette keys or hex, used by the offline "make it red" path. */
const COLOR_MAP = {
  red: 'pal.coral', green: 'pal.ok', blue: 'pal.cobalt', yellow: 'pal.safety',
  orange: 'pal.flame', purple: 'pal.plum', pink: 'pal.rose', cyan: 'pal.teal',
  magenta: 'pal.plum', white: 'pal.paper', black: 'pal.ink', gray: 'pal.steel',
  grey: 'pal.steel', brown: 'pal.wood', gold: 'pal.mustard', silver: 'pal.hub',
  teal: 'pal.teal', navy: 'pal.ink', maroon: 'pal.terracotta', olive: 'pal.sage',
  coral: 'pal.coral', mustard: 'pal.mustard', terracotta: 'pal.terracotta', sage: 'pal.sage',
  plum: 'pal.plum', rose: 'pal.rose', cobalt: 'pal.cobalt', flame: 'pal.flame',
  mint: 'pal.mint', lilac: 'pal.lilac', sky: 'pal.sky', ink: 'pal.ink',
  steel: 'pal.steel', slate: 'pal.slate', mist: 'pal.mist', paper: 'pal.paper',
  cloud: 'pal.cloud', wood: 'pal.wood', cardboard: 'pal.cardboard', skin: 'pal.skin',
  leaf: 'pal.leaf', trunk: 'pal.trunk', tyre: 'pal.tyre', lampGlow: 'pal.lampGlow',
};

const COLOR_NAMES = Object.keys(COLOR_MAP).join('|');

/* Detect a color request: "make it red", "change it to blue", "recolor it green", "it red". */
function colorFrom(lower) {
  const direct = new RegExp(`\\b(?:make it|change it|recolor it|set it|turn it|paint it)\\s+(?:to\\s+)?(${COLOR_NAMES})\\b`, 'i').exec(lower);
  if (direct) return direct[1];
  const tail = new RegExp(`\\b(${COLOR_NAMES})\\b(?:\\s+(?:thing|object|car|tree|person|house|building|wall|roof|door|window|lamp|bench|table|chair))?\\s*$`, 'i').exec(lower);
  if (tail) return tail[1];
  return null;
}

const KINDS = [
  {
    key: 'person',
    nouns: ['person', 'people', 'man', 'woman', 'men', 'women', 'figure', 'figures', 'human', 'humans', 'customer', 'visitor', 'driver', 'worker', 'chef', 'barista', 'baker', 'child', 'kid', 'actor', 'pedestrian', 'someone', 'programmer', 'coder', 'developer', 'engineer', 'employee'],
    noun: 'person',
    helper: 'person',
  },
  { key: 'car', nouns: ['car', 'cars', 'auto', 'sedan', 'taxi', 'cab', 'racecar'], noun: 'car', helper: null },
  { key: 'truck', nouns: ['truck', 'lorry', 'van', 'pickup', 'delivery'], noun: 'truck', helper: null },
  { key: 'bus', nouns: ['bus', 'coach', 'minibus'], noun: 'bus', helper: null },
  { key: 'bike', nouns: ['bike', 'bicycle', 'cycle', 'scooter', 'moped'], noun: 'bicycle', helper: null },
  { key: 'boat', nouns: ['boat', 'ship', 'dinghy', 'canoe', 'kayak', 'sailboat', 'ferry'], noun: 'boat', helper: null },
  { key: 'bench', nouns: ['bench', 'seat', 'pew'], noun: 'bench', helper: null },
  { key: 'table', nouns: ['table', 'desk', 'counter', 'workstation'], noun: 'table', helper: null },
  { key: 'chair', nouns: ['chair', 'stool', 'office chair'], noun: 'chair', helper: null },
  { key: 'laptop', nouns: ['laptop', 'notebook', 'macbook', 'pc', 'computer'], noun: 'laptop', helper: null },
  { key: 'crate', nouns: ['crate', 'box', 'carton'], noun: 'crate', helper: null },
  { key: 'barrel', nouns: ['barrel', 'keg'], noun: 'barrel', helper: null },
  { key: 'tree', nouns: ['tree', 'trees', 'pine', 'pines', 'evergreen', 'evergreens', 'oak'], noun: 'tree', helper: 'tree' },
  { key: 'bush', nouns: ['bush', 'bushes', 'shrub', 'shrubs', 'hedge', 'hedges'], noun: 'bush', helper: 'bush' },
  { key: 'flower', nouns: ['flower', 'flowers', 'plant', 'plants', 'planter', 'pot'], noun: 'flowers', helper: 'bush' },
  { key: 'rock', nouns: ['rock', 'rocks', 'stone', 'stones', 'boulder'], noun: 'rock', helper: 'rock' },
  { key: 'fence', nouns: ['fence', 'fencing', 'railing', 'railings'], noun: 'fence', helper: null },
  { key: 'lamp', nouns: ['lamp', 'lamps', 'lamp post', 'lamppost', 'street lamp', 'lantern', 'lanterns', 'light', 'lights', 'floodlight'], noun: 'lamp', helper: 'lamp' },
  { key: 'sign', nouns: ['sign', 'signs', 'signage', 'billboard', 'poster', 'banner'], noun: 'sign', helper: null },
  { key: 'dog', nouns: ['dog', 'dogs', 'pup', 'puppy', 'hound'], noun: 'dog', helper: null },
  { key: 'cat', nouns: ['cat', 'cats', 'kitten'], noun: 'cat', helper: null },
  { key: 'bird', nouns: ['bird', 'birds', 'seagull', 'pigeon', 'crow', 'gull'], noun: 'bird', helper: null },
  { key: 'flag', nouns: ['flag', 'flags', 'pennant'], noun: 'flag', helper: 'flag' },
  { key: 'cone', nouns: ['cone', 'cones', 'traffic cone', 'bollard'], noun: 'traffic cone', helper: 'cone' },
];

const KIND_RE = KINDS.map((k) => ({
  ...k,
  re: new RegExp(`\\b(${k.nouns.join('|')})\\b`, 'i'),
}));

const THEME_WORDS =
  /\b(theme|night|midnight|evening|dusk|dark|sunset|mono|monochrome|minimal|black and white|sketch|line art|hairline|print|screen ?print|morning|daylight|pastel|soft|colou?rful|vibrant|playful)\b/i;

function themeFrom(lower) {
  if (/\b(night|midnight|evening|dusk|dark|sunset)\b/.test(lower)) return 'night';
  if (/\b(mono|monochrome|minimal|black and white)\b/.test(lower)) return 'mono';
  if (/\b(sketch|line art|hairline)\b/.test(lower)) return 'line';
  if (/\bprint|screen ?print\b/.test(lower)) return 'print';
  if (/\b(morning|daylight|pastel|soft)\b/.test(lower)) return 'soft';
  if (/\b(colou?rful|vibrant|playful)\b/.test(lower)) return 'toy';
  return null;
}

/** One-line, marker-tagged construction of an object, so it can be found and removed later. */
function buildKind(key, v, x, z, name, yOffset = 0, yaw = 0) {
  let body;
  const y = yOffset || 0;
  switch (key) {
    case 'person':
      body = `var ${v}=D.props.person(${x},${z},null,{shirt:pal.mustard,hat:pal.paper${yaw ? `,yaw:${yaw}` : ''}});${y ? `${v}.position.y=${y};` : ''}${yaw ? `${v}.rotation.y=${yaw};` : ''}`;
      break;
    case 'car':
      body = `var ${v}=D.group(${x},${y},${z});D.box(1.5,.3,2.6,pal.accent,0,.32,0,${v});D.box(1.1,.28,1.2,pal.sky,0,.58,0,${v});D.box(1.6,.05,.4,pal.accent,0,.44,-1.2,${v});D.wheel(.24,.18,pal.tyre,-.72,.24,.8,${v});D.wheel(.24,.18,pal.tyre,.72,.24,.8,${v});D.wheel(.24,.18,pal.tyre,-.72,.24,-.8,${v});D.wheel(.24,.18,pal.tyre,.72,.24,-.8,${v});`;
      break;
    case 'truck':
      body = `var ${v}=D.group(${x},${y},${z});D.box(2.0,1.6,3.0,pal.paper,0,1.0,0,${v});D.box(1.8,1.2,1.0,pal.accent,0,.9,1.9,${v});D.box(2.1,.2,3.1,pal.steel,0,1.85,0,${v});D.wheel(.3,.2,pal.tyre,-.9,.3,1.5,${v});D.wheel(.3,.2,pal.tyre,.9,.3,1.5,${v});D.wheel(.3,.2,pal.tyre,-.9,.3,-1.4,${v});D.wheel(.3,.2,pal.tyre,.9,.3,-1.4,${v});`;
      break;
    case 'bus':
      body = `var ${v}=D.group(${x},${y},${z});D.box(2.2,1.9,4.4,pal.mustard,0,1.15,0,${v});D.box(2.22,.55,3.8,pal.sky,0,1.5,0,${v});D.box(2.3,.16,4.5,pal.steel,0,2.1,0,${v});D.wheel(.32,.22,pal.tyre,-1.0,.32,1.4,${v});D.wheel(.32,.22,pal.tyre,1.0,.32,1.4,${v});D.wheel(.32,.22,pal.tyre,-1.0,.32,-1.4,${v});D.wheel(.32,.22,pal.tyre,1.0,.32,-1.4,${v});`;
      break;
    case 'bike':
      body = `var ${v}=D.group(${x},${y},${z});var ${v}_w1=D.torus(.32,.05,pal.tyre,0,.34,.5,${v});${v}_w1.rotation.y=Math.PI/2;var ${v}_w2=D.torus(.32,.05,pal.tyre,0,.34,-.5,${v});${v}_w2.rotation.y=Math.PI/2;D.box(.06,.06,1.0,pal.accent,0,.6,0,${v});D.box(.06,.4,.06,pal.ink,0,.82,.45,${v});`;
      break;
    case 'boat':
      body = `var ${v}=D.group(${x},${y},${z});D.box(1.4,.4,2.6,pal.wood,0,.24,0,${v});D.box(1.1,.3,2.2,pal.cardboard,0,.34,0,${v});D.cyl(.04,.04,2.0,pal.steel,0,1.2,0,${v},6);D.wedge(1.0,1.4,.06,pal.paper,0,1.3,.05,${v});`;
      break;
    case 'bench':
      body = `var ${v}=D.group(${x},${y},${z});D.box(2.0,.12,.6,pal.wood,0,.45,0,${v});D.box(2.0,.5,.1,pal.wood,0,.7,-.25,${v});D.cyl(.05,.05,.45,pal.ink,-.8,.22,.2,${v},6);D.cyl(.05,.05,.45,pal.ink,.8,.22,.2,${v},6);D.cyl(.05,.05,.45,pal.ink,-.8,.22,-.2,${v},6);D.cyl(.05,.05,.45,pal.ink,.8,.22,-.2,${v},6);`;
      break;
    case 'table':
      body = `var ${v}=D.group(${x},${y},${z});D.box(1.8,.08,1.0,pal.wood,0,.8,0,${v});D.cyl(.04,.04,.78,pal.ink,-.7,.39,-.35,${v},6);D.cyl(.04,.04,.78,pal.ink,.7,.39,-.35,${v},6);D.cyl(.04,.04,.78,pal.ink,-.7,.39,.35,${v},6);D.cyl(.04,.04,.78,pal.ink,.7,.39,.35,${v},6);`;
      break;
    case 'chair':
      body = `var ${v}=D.group(${x},${y},${z});D.box(.6,.06,.6,pal.wood,0,.48,0,${v});D.box(.6,.5,.06,pal.wood,0,.72,-.27,${v});D.cyl(.03,.03,.46,pal.ink,-.24,.23,-.24,${v},6);D.cyl(.03,.03,.46,pal.ink,.24,.23,-.24,${v},6);D.cyl(.03,.03,.46,pal.ink,-.24,.23,.24,${v},6);D.cyl(.03,.03,.46,pal.ink,.24,.23,.24,${v},6);`;
      break;
    case 'laptop':
      body = `var ${v}=D.group(${x},${y},${z});D.box(.6,.02,.42,pal.steel,0,.01,0,${v});var ${v}_scr=D.box(.6,.42,.02,pal.ink,0,.21,-.2,${v});${v}_scr.rotation.x=-.25;D.box(.54,.36,.02,pal.sky,0,.21,-.19,${v}).rotation.x=-.25;${yaw ? `${v}.rotation.y=${yaw};` : ''}`;
      break;
    case 'crate':
      body = `var ${v}=D.props.crate(${x},${y},${z},null,{w:.9,h:.8,d:.9});`;
      break;
    case 'barrel':
      body = `var ${v}=D.group(${x},${y},${z});D.cyl(.34,.3,.9,pal.wood,0,.45,0,${v},14);var ${v}_t1=D.torus(.34,.03,pal.steel,0,.68,0,${v});${v}_t1.rotation.x=Math.PI/2;var ${v}_t2=D.torus(.34,.03,pal.steel,0,.24,0,${v});${v}_t2.rotation.x=Math.PI/2;`;
      break;
    case 'tree':
      body = `var ${v}=D.props.tree(${x},${z},null,{r:.65,kind:'round'});${y ? `${v}.position.y=${y};` : ''}`;
      break;
    case 'bush':
      body = `var ${v}=D.props.bush(${x},${z},null,{r:.35});${y ? `${v}.position.y=${y};` : ''}`;
      break;
    case 'flower':
      body = `var ${v}=D.group(${x},${y},${z});D.cyl(.18,.14,.3,pal.terracotta,0,.15,0,${v},10);D.props.bush(0,0,${v},{r:.2}).position.y=.28;D.ball(.06,pal.rose,0,.52,0,${v});`;
      break;
    case 'rock':
      body = `var ${v}=D.props.rock(${x},${z},null,{r:.4});${y ? `${v}.position.y=${y};` : ''}`;
      break;
    case 'fence':
      body = `var ${v}=D.group(${x},${y},${z});D.box(.08,.9,.08,pal.wood,-.8,.45,0,${v});D.box(.08,.9,.08,pal.wood,0,.45,0,${v});D.box(.08,.9,.08,pal.wood,.8,.45,0,${v});D.box(1.9,.08,.06,pal.wood,0,.7,0,${v});D.box(1.9,.08,.06,pal.wood,0,.35,0,${v});`;
      break;
    case 'lamp':
      body = `var ${v}=D.props.lamp(${x},${z},null,{h:2.8});${y ? `${v}.position.y=${y};` : ''}`;
      break;
    case 'sign':
      body = `var ${v}=D.group(${x},${y},${z});D.box(.08,1.6,.08,pal.ink,0,.8,0,${v});D.box(.9,.6,.06,pal.mustard,0,1.65,0,${v});D.box(.7,.08,.02,pal.ink,0,1.72,.04,${v});`;
      break;
    case 'dog':
      body = `var ${v}=D.group(${x},${y},${z});D.box(.5,.24,.24,pal.cardboard,0,.3,0,${v});D.ball(.14,pal.cardboard,0,.45,.2,${v});D.box(.12,.12,.18,pal.cardboard,.28,.32,.18,${v});D.cyl(.03,.03,.3,pal.cardboard,.2,.45,-.14,${v},6);`;
      break;
    case 'cat':
      body = `var ${v}=D.group(${x},${y},${z});D.box(.44,.2,.2,pal.mustard,0,.26,0,${v});D.ball(.12,pal.mustard,0,.4,.18,${v});D.box(.05,.14,.05,pal.mustard,.06,.5,.18,${v});D.cyl(.025,.025,.34,pal.mustard,-.2,.32,-.1,${v},6);`;
      break;
    case 'bird':
      body = `var ${v}=D.group(${x},${y},${z});D.ball(.14,pal.cloud,0,.8,0,${v});D.ball(.1,pal.cloud,.1,.88,.1,${v});D.cone(.05,.14,pal.mustard,.2,.86,.12,${v},6);`;
      break;
    case 'flag':
      body = `var ${v}=D.props.flag(${x},${z},null,{h:2.2}).group;${y ? `${v}.position.y=${y};` : ''}`;
      break;
    case 'cone':
      body = `var ${v}=D.props.cone(${x},${z},null);${y ? `${v}.position.y=${y};` : ''}`;
      break;
    default:
      body = '';
  }
  if (!body) return '';
  const safeName = String(name || key).replace(/'/g, '');
  return `/*a3d:${key}*/${body}${v}.name='${safeName}';${v}.userData.a3d={x:${x},y:${y},z:${z}};if(typeof hot!=='undefined')hot.push(${v});`;
}

/** Insert full statements just before the scene's `return { … }` or `return parts;` block. */
function insertBeforeReturn(code, statements) {
  if (!statements.length) return null;
  const anchor = /(?:(?:\r?\n([ \t]*))|;[ \t]*)return\b[ \t]*(?:\{|[A-Za-z_$][\w$]*|\[)/.exec(code);
  if (!anchor) {
    // Fallback: If code is single-line or minified without newline before return
    const inlineAnchor = /return\b[ \t]*(?:\{|[A-Za-z_$][\w$]*|\[)/.exec(code);
    if (!inlineAnchor) return null;
    const block = statements.join(' ');
    const at = inlineAnchor.index;
    return code.slice(0, at) + block + ' ' + code.slice(at);
  }
  const indent = anchor[1] || '    ';
  const block = statements.map((s) => `${s}`).join(`\n${indent}`);
  if (anchor[0].startsWith(';')) {
    const at = anchor.index + 1;
    return code.slice(0, at) + '\n' + indent + block + '\n' + indent + code.slice(at).trimStart();
  }
  const at = anchor.index;
  return code.slice(0, at) + '\n' + indent + block + code.slice(at);
}

function countFrom(lower) {
  const digit = /\b(\d{1,2})\b/.exec(lower);
  if (digit) return Math.max(1, Math.min(6, Number(digit[1])));
  for (const [word, n] of Object.entries(COUNTS)) {
    if (new RegExp(`\\b${word}\\b`).test(lower)) return n;
  }
  return 1;
}

function matchedKinds(lower) {
  return KIND_RE.filter((k) => k.re.test(lower));
}

/** The most recent object we added, preferring the named kind; else a same-named var already in the code. */
function resolveTarget(code, lower, kinds) {
  // Match markers, optionally followed by a variable name: /*a3d:key*/ [var name =] ...
  const added = [...code.matchAll(/\/\*a3d:(\w+)\*\/\s*(?:var|const|let)?\s*(\w*)/g)];
  for (const kind of kinds) {
    const hit = added.filter((m) => m[1] === kind.key).pop();
    if (hit) return hit[2] || hit[1];
  }
  if (added.length) return added[added.length - 1][2] || added[added.length - 1][1];
  for (const kind of kinds) {
    const named = new RegExp(`var\\s+(\\w*${kind.key}\\w*)\\s*=`, 'i').exec(code);
    if (named) return named[1];
  }
  // "it" / "that thing" after an add in a previous turn: last named group.
  const groups = [...code.matchAll(/var\s+(\w+)\s*=\s*(?:D|P|W|Dither)\.group\(/g)];
  if (groups.length) return groups[groups.length - 1][1];
  return null;
}

function nounForTarget(target, kinds) {
  if (kinds.length) return kinds[0].noun;
  const m = /^a3d_(\w+?)_\d+$/.exec(String(target || ''));
  if (m) {
    const kind = KINDS.find((k) => k.key === m[1]);
    if (kind) return kind.noun;
  }
  return 'object';
}

/* Recolor the target object and its children to the requested color name.
   Scans the target's creation line and subsequent indented child lines.
   Returns the modified code or null when nothing could be changed. */
function recolorTarget(code, targetVar, colorName, format) {
  const paletteKey = COLOR_MAP[colorName];
  const hexMap = {
    red: '#e8714f', green: '#3f9f6f', blue: '#3b63d8', yellow: '#e9b949',
    orange: '#e8714f', purple: '#8a6fb8', pink: '#ee8fa6', cyan: '#4aa3a0',
    white: '#f8f8f6', black: '#1f2430', gray: '#5e6675', grey: '#5e6675',
    brown: '#a07c5b', gold: '#e9b949', teal: '#4aa3a0', maroon: '#cf6a4c',
    coral: '#e8714f', mustard: '#e9b949', terracotta: '#cf6a4c', sage: '#8fbf9f',
  };
  const newHex = hexMap[colorName];
  if (!paletteKey && !newHex) return null;

  const lines = code.split('\n');
  let targetLineIndex = -1;

  // Find the creation line for the target variable, or a marker line for
  // additions that don't store in a variable (e.g. Worlds W.bench(...)).
  for (let i = 0; i < lines.length; i++) {
    const isVarDecl = new RegExp(`(?:var|const|let)\\s+${targetVar}\\s*=`).test(lines[i]);
    const isMarker = new RegExp(`/\\*a3d:${targetVar}\\*/`).test(lines[i]);
    if (isVarDecl || isMarker) {
      targetLineIndex = i;
      break;
    }
  }
  if (targetLineIndex < 0) return null;

  const baseIndent = (lines[targetLineIndex].match(/^[ \t]*/) || [''])[0];
  let changed = false;

  // Process the creation line and subsequent indented child lines.
  for (let i = targetLineIndex; i < lines.length; i++) {
    const line = lines[i];
    const curIndent = (line.match(/^[ \t]*/) || [''])[0];

    // Stop at a new top-level statement with <= base indentation.
    if (i > targetLineIndex && curIndent.length <= baseIndent.length && line.trim().length > 0) {
      if (/^(var|const|let|return|function|\}|\/\*|\/\/)/.test(line.trim())) break;
    }

    let newLine = line;
    if (format === 'svg') {
      if (paletteKey) newLine = line.replace(/\bpal\.[a-zA-Z]+/g, paletteKey);
      else if (newHex) newLine = line.replace(/#[0-9a-fA-F]{3,6}\b/g, newHex);
    } else if (format === 'worlds') {
      if (newHex) newLine = line.replace(/#[0-9a-fA-F]{3,6}/g, newHex);
    } else {
      newLine = line.replace(/'[a-zA-Z]+'/g, `'${colorName}'`);
    }

    if (newLine !== line) {
      lines[i] = newLine;
      changed = true;
    }
  }

  if (!changed) return null;
  return lines.join('\n');
}

function motionTypes(lower) {
  const out = [];
  if (/\b(lap|laps|orbit|orbits|circle|circles|loop|loops|patrol|patrols|roam|roams|wander|wanders|drive around|drives around|go around|goes around)\b/.test(lower)) out.push('orbit');
  if (/\b(spin|spins|rotate|rotates|turn|turns|twirl|twirls)\b/.test(lower)) out.push('spin');
  if (/\b(bob|bobs|float|floats|bounce|bounces|hover up|rise|rises)\b/.test(lower)) out.push('bob');
  if (/\b(sway|sways|wobble|wobbles|swing|swings)\b/.test(lower)) out.push('sway');
  if (/\b(pulse|pulses|throb|throbs|beat|beats|breathe|breathes)\b/.test(lower)) out.push('pulse');
  return out;
}

function motionStatements(v, type) {
  if (type === 'orbit')
    return [
      `if(${v}&&!${v}.userData.a3d)${v}.userData.a3d={x:${v}.position.x,z:${v}.position.z};`,
      `if(${v}){var a3dT=ctx.t;${v}.position.x=${v}.userData.a3d.x+Math.cos(a3dT*.8)*2.4;${v}.position.z=${v}.userData.a3d.z+Math.sin(a3dT*.8)*2.4;${v}.rotation.y=-a3dT*.8+Math.PI/2;}`,
    ];
  if (type === 'spin') return [`if(${v})${v}.rotation.y=ctx.t*1.2;`];
  if (type === 'bob') return [`if(${v})${v}.position.y=.18+Math.sin(ctx.t*2.2)*.1;`];
  if (type === 'sway') return [`if(${v})${v}.rotation.z=Math.sin(ctx.t*1.6)*.08;`];
  if (type === 'pulse') return [`if(${v})${v}.scale.setScalar(1+Math.sin(ctx.t*3)*.06);`];
  return [];
}

function injectIntoTick(code, statements) {
  if (!statements.length) return null;
  const anchor =
    /\btick\s*:\s*function\s*\(\s*([A-Za-z_$][\w$]*)\s*\)\s*\{/.exec(code) ||
    /\btick\s*\(\s*([A-Za-z_$][\w$]*)\s*\)\s*\{/.exec(code);
  if (!anchor) return null;
  const param = anchor[1];
  const at = anchor.index + anchor[0].length;
  const block = '\n' + statements.map((s) => `    ${s.replace(/\bctx\./g, `${param}.`)}`).join('\n');
  return code.slice(0, at) + block + code.slice(at);
}

function safeValid(code, format) {
  try {
    return Boolean(validateScene(code, format)?.valid);
  } catch {
    return false;
  }
}

const HELP = 'Offline editing can add or remove people, cars, trucks, buses, bicycles, boats, benches, tables, chairs, crates, barrels, trees, bushes, flowers, rocks, fences, lamps, signs, animals, flags and cones; switch the theme; move or resize something; and make it spin, bob, sway, pulse, drive a lap or lift on hover. Try "add a bench near it" or "make it spin". Connect a coding model for anything else.';

/* Two concrete rephrasings for a failed offline edit, based on what the user tried. */
function rephraseSuggestions(lower) {
  const hasAdd = /\b(add|put|place|create|bring)\b/.test(lower);
  const hasRemove = /\b(remove|delete|take out)\b/.test(lower);
  const hasMove = /\b(move|shift|slide)\b/.test(lower);
  const hasColor = /\b(red|blue|green|yellow|color|colour|make it|change it)\b/.test(lower);
  const hasMotion = /\b(spin|bob|sway|pulse|orbit|lap)\b/.test(lower);
  const hasTheme = /\b(night|soft|mono|line|print|theme)\b/.test(lower);

  if (hasColor || /make it/.test(lower)) return ['make it red', 'change it to blue'];
  if (hasAdd) return ['add a car', 'add a tree near it'];
  if (hasRemove) return ['remove the last thing added', 'delete the lamp'];
  if (hasMove) return ['move it left', 'shift it forward'];
  if (hasMotion) return ['make it spin', 'make it bob'];
  if (hasTheme) return ['switch theme to night', 'set theme to soft'];
  return ['add a car', 'remove the lamp'];
}

export function editWorldsOffline(currentCode, instruction) {
  const lower = String(instruction || '').toLowerCase().trim();
  let code = currentCode;
  const changes = [];

  const commit = (next, label) => {
    if (typeof next === 'string' && next && next !== code) {
      code = next;
      changes.push(label);
    }
  };

  // 0. Size change (Hero, Card, Mini)
  const sizeMatch = lower.match(/\b(hero|card|mini)\b/i);
  if (sizeMatch && /\b(size|format|hero|card|mini|panoramic|vignette)\b/i.test(lower)) {
    const targetSize = sizeMatch[1].toLowerCase();
    if (/size:\s*['"`][^'"`]+['"`]/.test(code)) {
      commit(code.replace(/size:\s*['"`][^'"`]+['"`]/, `size: '${targetSize}'`), `Changed size to ${targetSize}`);
    } else if (/Any3d\.figure\s*\(\s*\{/.test(code)) {
      commit(code.replace(/Any3d\.figure\s*\(\s*\{/, `Any3d.figure({\n  size: '${targetSize}',`), `Changed size to ${targetSize}`);
    }
  }

  const wantsAdd = /\b(add|put|place|include|insert|create|bring|give me|need|want|introduce|show|spawn|have)\b/i.test(lower) || (/\bmake\b/i.test(lower) && !THEME_WORDS.test(lower));
  const wantsRemove = /\b(remove|delete|strip|hide|get rid of|take out|drop|erase|clear|kill|destroy|without|no more)\b/i.test(lower);
  const wantsMove = /\b(move|shift|slide|nudge|push)\b/i.test(lower);
  const wantsScale = /\b(bigger|smaller|larger|taller|shorter|wider|thinner|scale|resize)\b/i.test(lower);
  const wantsHover = /\b(hover|pointer over|cursor over|mouse over|when i hover|on hover)\b/i.test(lower);

  // 1. Finish / Theme shift
  if (/\b(blueprint|cyan)\b/i.test(lower)) {
    if (/finish:\s*['"`][^'"`]+['"`]/.test(code)) {
      commit(code.replace(/finish:\s*['"`][^'"`]+['"`]/, "finish: 'blueprint'"), 'Switched finish to blueprint');
    } else {
      commit(code.replace(/defineWorld\s*\(\s*\{/, "defineWorld({\n  finish: 'blueprint',"), 'Switched finish to blueprint');
    }
  } else if (/\b(pixel|pixelated)\b/i.test(lower)) {
    if (/finish:\s*['"`][^'"`]+['"`]/.test(code)) {
      commit(code.replace(/finish:\s*['"`][^'"`]+['"`]/, "finish: 'pixel'"), 'Switched finish to pixel');
    } else {
      commit(code.replace(/defineWorld\s*\(\s*\{/, "defineWorld({\n  finish: 'pixel',"), 'Switched finish to pixel');
    }
  } else if (/\b(halftone|print)\b/i.test(lower)) {
    if (/finish:\s*['"`][^'"`]+['"`]/.test(code)) {
      commit(code.replace(/finish:\s*['"`][^'"`]+['"`]/, "finish: 'halftone'"), 'Switched finish to halftone');
    } else {
      commit(code.replace(/defineWorld\s*\(\s*\{/, "defineWorld({\n  finish: 'halftone',"), 'Switched finish to halftone');
    }
  } else if (THEME_WORDS.test(lower)) {
    const theme = themeFrom(lower);
    if (theme === 'night') {
      if (/W\.terrain\s*\([^,]+,[^,]+,\s*['"`]#[0-9a-fA-F]+['"`]/.test(code)) {
        commit(code.replace(/(W\.terrain\s*\([^,]+,[^,]+,\s*)['"`]#[0-9a-fA-F]+['"`]/, "$1'#1e293b'"), 'Set night atmosphere');
      }
    }
  }

  // 1.5. Recolor an existing object ("make it red", "change it to blue")
  const colorReq = colorFrom(lower);
  if (colorReq && !wantsRemove && !/theme/.test(lower)) {
    const kinds = matchedKinds(lower);
    const target = resolveTarget(code, lower, kinds);
    if (target) {
      const next = recolorTarget(code, target, colorReq, 'worlds');
      if (next) {
        commit(next, `Recolored the ${nounForTarget(target, kinds)} to ${colorReq}`);
      }
    }
  }

  // 2. Removal
  if (wantsRemove) {
    // Pronoun resolution: "remove it / that / the last thing" → last added object.
    if (/\b(it|that|last|thing)\b/.test(lower) && /\b(remove|delete|take out|drop|erase)\b/.test(lower)) {
      const tags = [...code.matchAll(/\/\*a3d:(\w+)\*/g)];
      if (tags.length) {
        const last = tags[tags.length - 1][0];
        const stripped = code
          .split('\n')
          .filter((line) => !line.includes(last))
          .join('\n');
        commit(stripped, 'Removed the last thing added');
      }
    }
    const kinds = matchedKinds(lower);
    for (const kind of kinds) {
      const marker = `/*a3d:${kind.key}*/`;
      if (code.includes(marker)) {
        const stripped = code.split('\n').filter(line => !line.includes(marker)).join('\n');
        commit(stripped, `Removed the ${kind.noun}`);
      } else if (kind.key === 'tree' && /W\.tree\s*\(/.test(code)) {
        commit(code.replace(/W\.tree\s*\([^)]*\);?/g, '/* removed tree */'), 'Removed the tree');
      } else if (kind.key === 'bench' && /W\.bench\s*\(/.test(code)) {
        commit(code.replace(/W\.bench\s*\([^)]*\);?/g, '/* removed bench */'), 'Removed the bench');
      } else if (kind.key === 'person' && /W\.person\s*\(/.test(code)) {
        commit(code.replace(/W\.person\s*\([^)]*\);?/g, '/* removed person */'), 'Removed the person');
      }
    }
  }

  // 3. Additions
  if (wantsAdd && !wantsRemove) {
    const kinds = matchedKinds(lower);
    const isWorkingOnLaptop = /\b(working|typing|coding|programming|using)\b/i.test(lower) && /\blaptop\b/i.test(lower);
    if (isWorkingOnLaptop && !kinds.some(k => k.key === 'laptop')) {
      const lap = KINDS.find(k => k.key === 'laptop');
      if (lap) kinds.push(lap);
    }
    if (kinds.length) {
      const perKind = countFrom(lower);
      const statements = [];
      const labels = [];
      let slot = 0;
      const hasOfficeDesk = /\bdesk\b/i.test(code);

      for (const kind of kinds) {
        for (let n = 0; n < perKind; n++) {
          let [x, z] = SLOTS[slot % SLOTS.length];
          const v = `a3d_${kind.key}_${slot}`;
          slot++;
          let stmt = '';
          switch (kind.key) {
            case 'tree':
              stmt = `/*a3d:tree*/ W.tree(${x}, ${z});`;
              break;
            case 'bench':
              stmt = `/*a3d:bench*/ W.bench(${x}, ${z});`;
              break;
            case 'person': {
              const px = hasOfficeDesk ? -2.2 : x;
              const pz = hasOfficeDesk ? 0.3 : z;
              stmt = `/*a3d:person*/ const ${v} = W.person(${px}, ${pz});`;
              break;
            }
            case 'laptop': {
              const lx = hasOfficeDesk ? -2.2 : x;
              const lz = hasOfficeDesk ? -0.55 : z;
              const ly = hasOfficeDesk ? 0.95 : 0.8;
              stmt = `/*a3d:laptop*/ const ${v} = W.group(${lx}, ${ly}, ${lz}); W.box(0.55, 0.02, 0.38, '#94a3b8', 0, 0.01, 0, ${v}); const ${v}_scr = W.box(0.55, 0.38, 0.02, '#0f172a', 0, 0.19, -0.18, ${v}); ${v}_scr.rotation.x = -0.25; W.box(0.5, 0.32, 0.02, '#38bdf8', 0, 0.19, -0.17, ${v}).rotation.x = -0.25;`;
              break;
            }
            case 'lamp':
              stmt = `/*a3d:lamp*/ W.cylinder(0.06, 2.6, '#475569', ${x}, 1.3, ${z}, undefined, 8); W.ball(0.18, '#fef08a', ${x}, 2.6, ${z});`;
              break;
            case 'crate':
              stmt = `/*a3d:crate*/ W.box(0.8, 0.8, 0.8, '#a16207', ${x}, 0.4, ${z});`;
              break;
            case 'rock':
              stmt = `/*a3d:rock*/ W.ball(0.45, '#64748b', ${x}, 0.25, ${z});`;
              break;
            case 'table':
              stmt = `/*a3d:table*/ W.table(${x}, 0, ${z});`;
              break;
            case 'chair':
              stmt = `/*a3d:chair*/ W.box(0.5, 0.5, 0.5, '#78350f', ${x}, 0.25, ${z});`;
              break;
            case 'car':
              stmt = `/*a3d:car*/ const ${v} = W.group(${x}, 0.25, ${z}); W.box(1.5, 0.35, 2.4, '#ef4444', 0, 0.2, 0, ${v}); W.box(1.1, 0.3, 1.2, '#38bdf8', 0, 0.5, 0, ${v}); W.cylinder(0.25, 0.18, '#0f172a', -0.7, 0.25, 0.7, ${v}); W.cylinder(0.25, 0.18, '#0f172a', 0.7, 0.25, 0.7, ${v}); W.cylinder(0.25, 0.18, '#0f172a', -0.7, 0.25, -0.7, ${v}); W.cylinder(0.25, 0.18, '#0f172a', 0.7, 0.25, -0.7, ${v});`;
              break;
            default:
              stmt = `/*a3d:${kind.key}*/ W.box(0.8, 0.8, 0.8, '#94a3b8', ${x}, 0.4, ${z});`;
          }
          statements.push(stmt);
        }
        labels.push(perKind > 1 ? `${perKind} ${kind.noun}s` : `a ${kind.noun}`);
      }
      const injected = insertBeforeReturn(code, statements);
      if (injected) {
        if (kinds.some(k => k.key === 'person') && kinds.some(k => k.key === 'laptop')) {
          commit(injected, 'Added a person working on the laptop');
        } else {
          commit(injected, `Added ${labels.join(' and ')}`);
        }
      }
    }
  }

  // 4. Move / scale an existing or just-added thing.
  if (wantsMove || wantsScale) {
    const kinds = matchedKinds(lower);
    const target = resolveTarget(code, lower, kinds);
    if (target) {
      const ops = [];
      if (wantsMove) {
        const step = 1.2;
        if (/\bleft\b/.test(lower)) ops.push(`${target}.position.x -= ${step};`);
        if (/\bright\b/.test(lower)) ops.push(`${target}.position.x += ${step};`);
        if (/\b(forward|front|closer)\b/.test(lower)) ops.push(`${target}.position.z -= ${step};`);
        if (/\b(back|backward|behind|further)\b/.test(lower)) ops.push(`${target}.position.z += ${step};`);
        if (/\bup\b/.test(lower)) ops.push(`${target}.position.y += .5;`);
        if (/\bdown\b/.test(lower)) ops.push(`${target}.position.y -= .5;`);
      }
      if (wantsScale) {
        const k = /\b(smaller|shorter|thinner)\b/.test(lower) ? 0.7 : /\b(bigger|larger|taller|wider)\b/.test(lower) ? 1.4 : 1;
        if (k !== 1) ops.push(`${target}.scale.setScalar(${target}.scale.x * ${k});`);
      }
      if (ops.length) {
        const injected = insertBeforeReturn(code, ops);
        if (injected) commit(injected, `Moved or resized the ${kinds[0]?.noun || 'object'}`);
      }
    }
  }

  // 5. Motion and hover.
  const motions = motionTypes(lower);
  if (motions.length || wantsHover) {
    const kinds2 = matchedKinds(lower);
    const target = resolveTarget(code, lower, kinds2);
    if (target) {
      const statements = [];
      for (const type of motions) statements.push(...motionStatements(target, type));
      if (wantsHover) statements.push(`if(${target})${target}.position.y=(ctx.hover===${target}?.22:0);`);
      const injected = injectIntoTick(code, statements);
      if (injected) {
        const noun = nounForTarget(target, kinds2);
        const parts = motions.map((m) => VERB[m]);
        if (wantsHover) parts.push('lifts when you hover it');
        commit(injected, `The ${noun} now ${parts.join(' and ')}`);
      }
    }
  }

  if (code !== currentCode) {
    const balanced = balanceBraces(code);
    if (safeValid(currentCode, 'worlds') && !safeValid(balanced, 'worlds')) {
      const suggestions = rephraseSuggestions(lower);
      return {
        code: currentCode,
        summary: `I could not apply "${instruction}" safely in this 3D world. Try: "${suggestions[0]}" or "${suggestions[1]}".`,
        changed: false,
      };
    }
    code = balanced;
  }

  if (code === currentCode) {
    const suggestions = rephraseSuggestions(lower);
    return {
      code: currentCode,
      summary: `I could not map "${instruction}" to an offline change in this 3D world. Try: "${suggestions[0]}" or "${suggestions[1]}". Connect a coding model for complex structural edits.`,
      changed: false,
    };
  }

  return { code, summary: changes.join(', '), changed: true };
}

export function editPixelOffline(currentCode, instruction, format = 'pixel') {
  const lower = String(instruction || '').toLowerCase().trim();
  let code = currentCode;
  const changes = [];

  const commit = (next, label) => {
    if (typeof next === 'string' && next && next !== code) {
      code = next;
      changes.push(label);
    }
  };

  // 0. Size change (Hero, Card, Mini)
  const sizeMatch = lower.match(/\b(hero|card|mini)\b/i);
  if (sizeMatch && /\b(size|format|hero|card|mini|panoramic|vignette)\b/i.test(lower)) {
    const targetSize = sizeMatch[1].toLowerCase();
    if (/size:\s*['"`][^'"`]+['"`]/.test(code)) {
      commit(code.replace(/size:\s*['"`][^'"`]+['"`]/, `size: '${targetSize}'`), `Changed size to ${targetSize}`);
    } else if (/Any3d\.figure\s*\(\s*\{/.test(code)) {
      commit(code.replace(/Any3d\.figure\s*\(\s*\{/, `Any3d.figure({\n  size: '${targetSize}',`), `Changed size to ${targetSize}`);
    }
  }

  const wantsAdd = /\b(add|put|place|include|insert|create|bring|give me|need|want|introduce|show|spawn|have)\b/i.test(lower) || (/\bmake\b/i.test(lower) && !THEME_WORDS.test(lower));
  const wantsRemove = /\b(remove|delete|strip|hide|get rid of|take out|drop|erase|clear|kill|destroy|without|no more)\b/i.test(lower);
  const wantsMove = /\b(move|shift|slide|nudge|push)\b/i.test(lower);
  const wantsScale = /\b(bigger|smaller|larger|taller|shorter|wider|thinner|scale|resize)\b/i.test(lower);
  const wantsHover = /\b(hover|pointer over|cursor over|mouse over|when i hover|on hover)\b/i.test(lower);

  // 1. Theme / palette shift
  if (/\b(colourful|colorful|vibrant|saturated|more color|brighten|colors|colours)\b/i.test(lower)) {
    let nextCode = code;
    nextCode = nextCode.replace(/'wood'/g, "'warmOak'").replace(/"wood"/g, '"warmOak"');
    if (/zone\s*:\s*function\s*\([^)]*\)\s*\{\s*return\s+true;\s*\}/.test(nextCode)) {
      nextCode = nextCode.replace(
        /zone\s*:\s*function\s*\([^)]*\)\s*\{\s*return\s+true;\s*\}/,
        "zone: function(x, z) { var cx = Math.floor(x * 1.6 + 10), cz = Math.floor(z * 1.6 + 10); return (cx + cz) % 2 === 0 ? 'tileLight' : 'tileAccent'; }"
      );
    }
    if (nextCode !== code) {
      commit(nextCode, 'Enhanced scene with vibrant, colorful materials and tiled floor');
    }
  } else if (THEME_WORDS.test(lower)) {
    const theme = themeFrom(lower);
    if (theme === 'night') {
      if (/ground\s*:\s*\{[^}]*color\s*:\s*['"`]#[0-9a-fA-F]+['"`]/.test(code)) {
        commit(code.replace(/(ground\s*:\s*\{[^}]*color\s*:\s*)['"`]#[0-9a-fA-F]+['"`]/, "$1'#0f172a'"), 'Set dark pixel ground');
      }
    }
  }

  // 1.5. Recolor an existing object ("make it red", "change it to blue")
  const colorReq = colorFrom(lower);
  if (colorReq && !wantsRemove && !/theme/.test(lower)) {
    const kinds = matchedKinds(lower);
    const target = resolveTarget(code, lower, kinds);
    if (target) {
      const next = recolorTarget(code, target, colorReq, 'pixel');
      if (next) {
        commit(next, `Recolored the ${nounForTarget(target, kinds)} to ${colorReq}`);
      }
    }
  }

  // 2. Removal
  if (wantsRemove) {
    // Pronoun resolution: "remove it / that / the last thing" → last added object.
    if (/\b(it|that|last|thing)\b/.test(lower) && /\b(remove|delete|take out|drop|erase)\b/.test(lower)) {
      const tags = [...code.matchAll(/\/\*a3d:(\w+)\*/g)];
      if (tags.length) {
        const last = tags[tags.length - 1][0];
        const stripped = code
          .split('\n')
          .filter((line) => !line.includes(last))
          .join('\n');
        commit(stripped, 'Removed the last thing added');
      }
    }
    const kinds = matchedKinds(lower);
    for (const kind of kinds) {
      const marker = `/*a3d:${kind.key}*/`;
      if (code.includes(marker)) {
        const stripped = code.split('\n').filter(line => !line.includes(marker)).join('\n');
        commit(stripped, `Removed the ${kind.noun}`);
      }
    }
  }

  // 3. Additions
  if (wantsAdd && !wantsRemove) {
    const kinds = matchedKinds(lower);
    if (kinds.length) {
      const perKind = countFrom(lower);
      const statements = [];
      const labels = [];
      let slot = 0;
      for (const kind of kinds) {
        for (let n = 0; n < perKind; n++) {
          const [x, z] = SLOTS[slot % SLOTS.length];
          slot++;
          let stmt = '';
          switch (kind.key) {
            case 'laptop': {
              const hasDesk = /\bdesk\b|box\([^)]*desk/i.test(code);
              const lx = hasDesk ? 0 : x;
              const lz = hasDesk ? -0.05 : z;
              const ly = hasDesk ? 0.91 : 0.42;
              stmt = `/*a3d:laptop*/ P.box(0.5, 0.02, 0.35, 'steel', ${lx}, ${ly}, ${lz}); var a3dLaptop = P.box(0.5, 0.35, 0.02, 'steel', ${lx}, ${ly + 0.16}, ${lz - 0.14}); a3dLaptop.rotation.x = -0.2; P.box(0.46, 0.31, 0.01, 'cyan', ${lx}, ${ly + 0.16}, ${lz - 0.13});`;
              break;
            }
            case 'tree':
              stmt = `/*a3d:tree*/ P.tree(${x}, ${z}, null, { r: 0.8, h: 1.4 });`;
              break;
            case 'bench':
              stmt = `/*a3d:bench*/ P.box(1.4, 0.4, 0.5, 'warmOak', ${x}, 0.2, ${z});`;
              break;
            case 'crate':
              stmt = `/*a3d:crate*/ P.box(0.7, 0.7, 0.7, 'gold', ${x}, 0.35, ${z});`;
              break;
            case 'lamp':
              stmt = `/*a3d:lamp*/ P.cyl(0.06, 0.06, 2.2, 'gold', ${x}, 1.1, ${z}, null, 6); P.ball(0.2, 'paper', ${x}, 2.2, ${z}, null, 6);`;
              break;
            case 'rock':
              stmt = `/*a3d:rock*/ P.ball(0.45, 'stone', ${x}, 0.25, ${z}, null, 6);`;
              break;
            case 'table':
              stmt = `/*a3d:table*/ P.box(1.2, 0.7, 0.8, 'warmOak', ${x}, 0.35, ${z});`;
              break;
            case 'chair':
              stmt = `/*a3d:chair*/ P.box(0.5, 0.5, 0.5, 'ruby', ${x}, 0.25, ${z});`;
              break;
            case 'person': {
              const hasDesk = /\bdesk\b|box\([^)]*desk/i.test(code);
              const px = hasDesk ? 0 : x;
              const pz = hasDesk ? 0.85 : z;
              stmt = `/*a3d:person*/ P.person(${px}, ${pz}, null, { shirt: '#2563eb', pants: '#1e293b', skin: '#f8d5b8' });`;
              break;
            }
            case 'car':
              stmt = `/*a3d:car*/ var a3dCar = P.group(${x}, 0.28, ${z}); P.box(1.4, 0.28, 2.4, 'red', 0, 0.2, 0.1, a3dCar); P.box(1.1, 0.26, 1.2, 'cyan', 0, 0.45, -0.1, a3dCar); P.box(1.6, 0.04, 0.35, 'red', 0, 0.62, -1.0, a3dCar);`;
              break;
            default:
              stmt = `/*a3d:${kind.key}*/ P.box(0.7, 0.7, 0.7, 'gold', ${x}, 0.35, ${z});`;
          }
          statements.push(stmt);
        }
        labels.push(perKind > 1 ? `${perKind} ${kind.noun}s` : `a ${kind.noun}`);
      }
      const injected = insertBeforeReturn(code, statements);
      if (injected) commit(injected, `Added ${labels.join(' and ')}`);
    }
  }

  // 4. Move / scale an existing or just-added thing.
  if (wantsMove || wantsScale) {
    const kinds = matchedKinds(lower);
    const target = resolveTarget(code, lower, kinds);
    if (target) {
      const ops = [];
      if (wantsMove) {
        const step = 1.2;
        if (/\bleft\b/.test(lower)) ops.push(`${target}.position.x -= ${step};`);
        if (/\bright\b/.test(lower)) ops.push(`${target}.position.x += ${step};`);
        if (/\b(forward|front|closer)\b/.test(lower)) ops.push(`${target}.position.z -= ${step};`);
        if (/\b(back|backward|behind|further)\b/.test(lower)) ops.push(`${target}.position.z += ${step};`);
        if (/\bup\b/.test(lower)) ops.push(`${target}.position.y += .5;`);
        if (/\bdown\b/.test(lower)) ops.push(`${target}.position.y -= .5;`);
      }
      if (wantsScale) {
        const k = /\b(smaller|shorter|thinner)\b/.test(lower) ? 0.7 : /\b(bigger|larger|taller|wider)\b/.test(lower) ? 1.4 : 1;
        if (k !== 1) ops.push(`${target}.scale.setScalar(${target}.scale.x * ${k});`);
      }
      if (ops.length) {
        const injected = insertBeforeReturn(code, ops);
        if (injected) commit(injected, `Moved or resized the ${kinds[0]?.noun || 'object'}`);
      }
    }
  }

  // 5. Motion and hover.
  const motions = motionTypes(lower);
  if (motions.length || wantsHover) {
    const kinds2 = matchedKinds(lower);
    const target = resolveTarget(code, lower, kinds2);
    if (target) {
      const statements = [];
      for (const type of motions) statements.push(...motionStatements(target, type));
      if (wantsHover) statements.push(`if(${target})${target}.position.y=(ctx.hover===${target}?.22:0);`);
      const injected = injectIntoTick(code, statements);
      if (injected) {
        const noun = nounForTarget(target, kinds2);
        const parts = motions.map((m) => VERB[m]);
        if (wantsHover) parts.push('lifts when you hover it');
        commit(injected, `The ${noun} now ${parts.join(' and ')}`);
      }
    }
  }

  if (code !== currentCode) {
    const balanced = balanceBraces(code);
    if (safeValid(currentCode, format) && !safeValid(balanced, format)) {
      const suggestions = rephraseSuggestions(lower);
      return {
        code: currentCode,
        summary: `I could not apply "${instruction}" safely in this pixel scene. Try: "${suggestions[0]}" or "${suggestions[1]}".`,
        changed: false,
      };
    }
    code = balanced;
  }

  if (code === currentCode) {
    const suggestions = rephraseSuggestions(lower);
    return {
      code: currentCode,
      summary: `I could not map "${instruction}" to an offline change in this pixel scene. Try: "${suggestions[0]}" or "${suggestions[1]}". Connect a coding model for complex edits.`,
      changed: false,
    };
  }

  return { code, summary: changes.join(', '), changed: true };
}

export function editSceneOffline(currentCode, instruction, format = 'svg') {
  const lower = String(instruction || '').toLowerCase().trim();
  let code = currentCode;
  const changes = [];

  if (!currentCode || !currentCode.trim()) {
    return { code: currentCode, summary: 'There is no scene on the stage yet.', changed: false };
  }
  if (!lower) {
    return { code: currentCode, summary: 'Tell me what to change, for example "add a car" or "remove the lamp".', changed: false };
  }
  if (format === 'worlds') {
    if (/\bdefineWorld\b/.test(currentCode)) {
      return editWorldsOffline(currentCode, instruction);
    }
    return {
      code: currentCode,
      summary: `This is a worlds scene. Offline editing works on SVG scenes; connect a coding model to edit a worlds scene.`,
      changed: false,
    };
  }
  if (format === 'pixel' || format === 'dither') {
    if (/\bPixel\.scene\b/.test(currentCode)) {
      return editPixelOffline(currentCode, instruction, format);
    }
    return {
      code: currentCode,
      summary: `This is a ${format} scene. Offline editing works on SVG scenes; connect a coding model to edit a ${format} scene.`,
      changed: false,
    };
  }
  if (format !== 'svg') {
    return {
      code: currentCode,
      summary: `This is a ${format} scene. Offline editing works on SVG scenes; connect a coding model to edit a ${format} scene.`,
      changed: false,
    };
  }

  const commit = (next, label) => {
    if (typeof next === 'string' && next && next !== code) {
      code = next;
      changes.push(label);
    }
  };

  // 0. Size change (Hero, Card, Mini)
  const sizeMatch = lower.match(/\b(hero|card|mini)\b/i);
  if (sizeMatch && /\b(size|format|hero|card|mini|panoramic|vignette)\b/i.test(lower)) {
    const targetSize = sizeMatch[1].toLowerCase();
    if (/size:\s*['"`][^'"`]+['"`]/.test(code)) {
      commit(code.replace(/size:\s*['"`][^'"`]+['"`]/, `size: '${targetSize}'`), `Changed size to ${targetSize}`);
    } else if (/Any3d\.figure\s*\(\s*\{/.test(code)) {
      commit(code.replace(/Any3d\.figure\s*\(\s*\{/, `Any3d.figure({\n  size: '${targetSize}',`), `Changed size to ${targetSize}`);
    }
  }

  const wantsAdd = /\b(add|put|place|include|insert|create|bring|give me|need|want|introduce|show|spawn|have)\b/i.test(lower) || (/\bmake\b/i.test(lower) && !THEME_WORDS.test(lower));
  const wantsRemove = /\b(remove|delete|strip|hide|get rid of|take out|drop|erase|clear|kill|destroy|without|no more)\b/i.test(lower);
  const wantsMove = /\b(move|shift|slide|nudge|push)\b/i.test(lower);
  const wantsScale = /\b(bigger|smaller|larger|taller|shorter|wider|thinner|scale|resize)\b/i.test(lower);
  const wantsHover = /\b(hover|pointer over|cursor over|mouse over|when i hover|on hover)\b/i.test(lower);

  // 1. Theme shift.
  if (THEME_WORDS.test(lower) && !(wantsAdd && !/\btheme\b/i.test(lower))) {
    const theme = themeFrom(lower);
    if (theme) {
      const next = code.replace(/\btheme:\s*['"`][^'"`]+['"`]/, `theme: '${theme}'`);
      commit(next, `Switched the theme to ${theme}`);
    }
  }

  // 1.5. Recolor an existing object ("make it red", "change it to blue")
  const colorReq = colorFrom(lower);
  if (colorReq && !wantsRemove && !/theme/.test(lower)) {
    const kinds = matchedKinds(lower);
    const target = resolveTarget(code, lower, kinds);
    if (target) {
      const next = recolorTarget(code, target, colorReq, 'svg');
      if (next) {
        commit(next, `Recolored the ${nounForTarget(target, kinds)} to ${colorReq}`);
      }
    }
  }

  // 2. Removal. Our own additions carry a marker; documented props can be cut too.
  if (wantsRemove) {
    const kinds = matchedKinds(lower);
    if (/\b(it|that|last|thing)\b/.test(lower) && /\b(remove|delete|take out|drop|erase)\b/.test(lower) && !kinds.length) {
      const tags = [...code.matchAll(/\/\*a3d:(\w+)\*/g)];
      if (tags.length) {
        const last = tags[tags.length - 1][0];
        const stripped = code
          .split('\n')
          .filter((line) => !line.includes(last))
          .join('\n');
        commit(stripped, 'Removed the last thing added');
      }
    }
    for (const kind of kinds) {
      const marker = `/*a3d:${kind.key}*/`;
      if (code.includes(marker)) {
        const stripped = code
          .split('\n')
          .filter((line) => !line.includes(marker))
          .join('\n');
        commit(stripped, `Removed the ${kind.noun}`);
      } else if (kind.helper) {
        const callRe = new RegExp(`[ \\t]*(?:var\\s+\\w+\\s*=\\s*)?(?:D|P|W)\\.props\\.${kind.helper}\\([^;]*\\);?[ \\t]*`, 'g');
        if (callRe.test(code)) {
          commit(code.replace(callRe, '/* removed */'), `Removed the ${kind.noun}`);
        }
      } else {
        // Fallback for procedural and named variables matching kind.key or any of kind.nouns
        const allNouns = [kind.key, ...kind.nouns].join('|');
        const propRe = new RegExp(`[ \\t]*(?:var|let|const)\\s+\\w*(?:${allNouns})\\w*\\s*=[^;]+;?`, 'gi');
        if (propRe.test(code)) {
          commit(code.replace(propRe, '/* removed */'), `Removed the ${kind.noun}`);
        }
      }
    }
  }

  // 3. Additions.
  if (wantsAdd && !wantsRemove && !colorReq) {
    const kinds = matchedKinds(lower).slice(0, 3);
    const isWorkingOnLaptop = /\b(working|typing|coding|programming|using)\b/i.test(lower) && /\blaptop\b/i.test(lower);
    if (isWorkingOnLaptop && !kinds.some(k => k.key === 'laptop')) {
      const lap = KINDS.find(k => k.key === 'laptop');
      if (lap) kinds.push(lap);
    }
    if (kinds.length) {
      const perKind = countFrom(lower);
      const statements = [];
      const labels = [];
      let slot = 0;
      const explicitName = (lower.match(/\b(driver|worker|chef|barista|baker|customer|child|kid|human|person|dog|cat|bird|developer|programmer)\b/) || [])[0];

      // Contextual placement checks:
      const hasOfficeDesk = /\bdesk\b/i.test(code);
      const hasOfficeChair = /\bchair\b/i.test(code);

      for (const kind of kinds) {
        for (let n = 0; n < perKind; n += 1) {
          let [x, z] = SLOTS[slot % SLOTS.length];
          let y = 0;
          let yaw = 0;

          // Smart focal placement for office desks and workspaces
          if (hasOfficeDesk && kind.key === 'laptop') {
            x = 0;
            z = -0.15;
            y = 0.98; // On top of desk surface facing seated person
          } else if (hasOfficeDesk && kind.key === 'person') {
            x = 0;
            z = 0.65;
            y = hasOfficeChair ? 0.25 : 0; // Seated at the desk in front of chair
            yaw = Math.PI; // Face the desk and laptop
          } else if (hasOfficeDesk && kind.key === 'table') {
            x = -0.55;
            z = 0.1;
            y = 0.98;
          }

          const targetName = (explicitName && (kind.key === 'person' || kind.key === 'dog' || kind.key === 'cat'))
            ? explicitName
            : kind.noun;

          statements.push(buildKind(kind.key, `a3d_${kind.key}_${slot}`, x, z, targetName, y, yaw));
          slot += 1;
        }
        labels.push(perKind > 1 ? `${perKind} ${kind.noun}s` : `a ${kind.noun}`);
      }
      const injected = insertBeforeReturn(code, statements);
      if (injected) {
        if (kinds.some(k => k.key === 'person') && kinds.some(k => k.key === 'laptop')) {
          commit(injected, 'Added a person working on the laptop');
        } else {
          commit(injected, `Added ${labels.join(' and ')}`);
        }
      }
    }
  }

  // 4. Move / scale an existing or just-added thing.
  if (wantsMove || wantsScale) {
    const kinds = matchedKinds(lower);
    const target = resolveTarget(code, lower, kinds);
    if (target) {
      const ops = [];
      if (wantsMove) {
        const step = 1.2;
        if (/\bleft\b/.test(lower)) ops.push(`${target}.position.x -= ${step};`);
        if (/\bright\b/.test(lower)) ops.push(`${target}.position.x += ${step};`);
        if (/\b(forward|front|closer)\b/.test(lower)) ops.push(`${target}.position.z -= ${step};`);
        if (/\b(back|backward|behind|further)\b/.test(lower)) ops.push(`${target}.position.z += ${step};`);
        if (/\bup\b/.test(lower)) ops.push(`${target}.position.y += .5;`);
        if (/\bdown\b/.test(lower)) ops.push(`${target}.position.y -= .5;`);
      }
      if (wantsScale) {
        const k = /\b(smaller|shorter|thinner)\b/.test(lower) ? 0.7 : /\b(bigger|larger|taller|wider)\b/.test(lower) ? 1.4 : 1;
        if (k !== 1) ops.push(`${target}.scale.setScalar(${target}.scale.x * ${k});`);
      }
      if (ops.length) {
        const injected = insertBeforeReturn(code, ops);
        if (injected) commit(injected, `Moved or resized the ${kinds[0]?.noun || 'object'}`);
      }
    }
  }

  // 5. Motion and hover.
  const kinds = matchedKinds(lower);
  const motions = motionTypes(lower);
  if (motions.length || wantsHover) {
    const target = resolveTarget(code, lower, kinds);
    if (target) {
      const statements = [];
      for (const type of motions) statements.push(...motionStatements(target, type));
      if (wantsHover) statements.push(`if(${target})${target}.position.y=(ctx.hover===${target}?.22:0);`);
      const injected = injectIntoTick(code, statements);
      if (injected) {
        const noun = nounForTarget(target, kinds);
        const parts = motions.map((m) => VERB[m]);
        if (wantsHover) parts.push('lifts when you hover it');
        commit(injected, `The ${noun} now ${parts.join(' and ')}`);
      }
    }
  }

  // Never ship a change that breaks a previously valid scene.
  if (code !== currentCode) {
    const balanced = balanceBraces(code);
    if (safeValid(currentCode, 'svg') && !safeValid(balanced, 'svg')) {
      const suggestions = rephraseSuggestions(lower);
      return {
        code: currentCode,
        summary: `I could not apply "${instruction}" safely — that edit would have broken the scene. Try: "${suggestions[0]}" or "${suggestions[1]}".`,
        changed: false,
      };
    }
    code = balanced;
  }

  if (code === currentCode) {
    const suggestions = rephraseSuggestions(lower);
    return { code: currentCode, summary: `I could not map "${instruction}" to a change. Try: "${suggestions[0]}" or "${suggestions[1]}". ${HELP}`, changed: false };
  }

  return { code, summary: changes.join(', '), changed: true };
}

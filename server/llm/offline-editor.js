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
import { balanceBraces } from '../engine/bundler.js';

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

const KINDS = [
  {
    key: 'person',
    nouns: ['person', 'people', 'man', 'woman', 'men', 'women', 'figure', 'figures', 'customer', 'visitor', 'driver', 'worker', 'chef', 'barista', 'baker', 'child', 'kid', 'actor', 'pedestrian', 'someone'],
    noun: 'person',
    helper: 'person',
  },
  { key: 'car', nouns: ['car', 'cars', 'auto', 'sedan', 'taxi', 'cab', 'racecar', 'racecar'], noun: 'car', helper: null },
  { key: 'truck', nouns: ['truck', 'lorry', 'van', 'pickup', 'delivery'], noun: 'truck', helper: null },
  { key: 'bus', nouns: ['bus', 'coach', 'minibus'], noun: 'bus', helper: null },
  { key: 'bike', nouns: ['bike', 'bicycle', 'cycle', 'scooter', 'moped'], noun: 'bicycle', helper: null },
  { key: 'boat', nouns: ['boat', 'ship', 'dinghy', 'canoe', 'kayak', 'sailboat', 'ferry'], noun: 'boat', helper: null },
  { key: 'bench', nouns: ['bench', 'seat', 'pew'], noun: 'bench', helper: null },
  { key: 'table', nouns: ['table', 'desk', 'counter'], noun: 'table', helper: null },
  { key: 'chair', nouns: ['chair', 'stool'], noun: 'chair', helper: null },
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
function buildKind(key, v, x, z, name) {
  let body;
  switch (key) {
    case 'person':
      body = `var ${v}=D.props.person(${x},${z},null,{shirt:pal.mustard,hat:pal.paper});`;
      break;
    case 'car':
      body = `var ${v}=D.group(${x},0,${z});D.box(1.5,.3,2.6,pal.accent,0,.32,0,${v});D.box(1.1,.28,1.2,pal.sky,0,.58,0,${v});D.box(1.6,.05,.4,pal.accent,0,.44,-1.2,${v});D.wheel(.24,.18,pal.tyre,-.72,.24,.8,${v});D.wheel(.24,.18,pal.tyre,.72,.24,.8,${v});D.wheel(.24,.18,pal.tyre,-.72,.24,-.8,${v});D.wheel(.24,.18,pal.tyre,.72,.24,-.8,${v});`;
      break;
    case 'truck':
      body = `var ${v}=D.group(${x},0,${z});D.box(2.0,1.6,3.0,pal.paper,0,1.0,0,${v});D.box(1.8,1.2,1.0,pal.accent,0,.9,1.9,${v});D.box(2.1,.2,3.1,pal.steel,0,1.85,0,${v});D.wheel(.3,.2,pal.tyre,-.9,.3,1.5,${v});D.wheel(.3,.2,pal.tyre,.9,.3,1.5,${v});D.wheel(.3,.2,pal.tyre,-.9,.3,-1.4,${v});D.wheel(.3,.2,pal.tyre,.9,.3,-1.4,${v});`;
      break;
    case 'bus':
      body = `var ${v}=D.group(${x},0,${z});D.box(2.2,1.9,4.4,pal.mustard,0,1.15,0,${v});D.box(2.22,.55,3.8,pal.sky,0,1.5,0,${v});D.box(2.3,.16,4.5,pal.steel,0,2.1,0,${v});D.wheel(.32,.22,pal.tyre,-1.0,.32,1.4,${v});D.wheel(.32,.22,pal.tyre,1.0,.32,1.4,${v});D.wheel(.32,.22,pal.tyre,-1.0,.32,-1.4,${v});D.wheel(.32,.22,pal.tyre,1.0,.32,-1.4,${v});`;
      break;
    case 'bike':
      body = `var ${v}=D.group(${x},0,${z});var ${v}_w1=D.torus(.32,.05,pal.tyre,0,.34,.5,${v});${v}_w1.rotation.y=Math.PI/2;var ${v}_w2=D.torus(.32,.05,pal.tyre,0,.34,-.5,${v});${v}_w2.rotation.y=Math.PI/2;D.box(.06,.06,1.0,pal.accent,0,.6,0,${v});D.box(.06,.4,.06,pal.ink,0,.82,.45,${v});`;
      break;
    case 'boat':
      body = `var ${v}=D.group(${x},0,${z});D.box(1.4,.4,2.6,pal.wood,0,.24,0,${v});D.box(1.1,.3,2.2,pal.cardboard,0,.34,0,${v});D.cyl(.04,.04,2.0,pal.steel,0,1.2,0,${v},6);D.wedge(1.0,1.4,.06,pal.paper,0,1.3,.05,${v});`;
      break;
    case 'bench':
      body = `var ${v}=D.group(${x},0,${z});D.box(2.0,.12,.6,pal.wood,0,.45,0,${v});D.box(2.0,.5,.1,pal.wood,0,.7,-.25,${v});D.cyl(.05,.05,.45,pal.ink,-.8,.22,.2,${v},6);D.cyl(.05,.05,.45,pal.ink,.8,.22,.2,${v},6);D.cyl(.05,.05,.45,pal.ink,-.8,.22,-.2,${v},6);D.cyl(.05,.05,.45,pal.ink,.8,.22,-.2,${v},6);`;
      break;
    case 'table':
      body = `var ${v}=D.group(${x},0,${z});D.box(1.8,.08,1.0,pal.wood,0,.8,0,${v});D.cyl(.04,.04,.78,pal.ink,-.7,.39,-.35,${v},6);D.cyl(.04,.04,.78,pal.ink,.7,.39,-.35,${v},6);D.cyl(.04,.04,.78,pal.ink,-.7,.39,.35,${v},6);D.cyl(.04,.04,.78,pal.ink,.7,.39,.35,${v},6);`;
      break;
    case 'chair':
      body = `var ${v}=D.group(${x},0,${z});D.box(.6,.06,.6,pal.wood,0,.48,0,${v});D.box(.6,.5,.06,pal.wood,0,.72,-.27,${v});D.cyl(.03,.03,.46,pal.ink,-.24,.23,-.24,${v},6);D.cyl(.03,.03,.46,pal.ink,.24,.23,-.24,${v},6);D.cyl(.03,.03,.46,pal.ink,-.24,.23,.24,${v},6);D.cyl(.03,.03,.46,pal.ink,.24,.23,.24,${v},6);`;
      break;
    case 'crate':
      body = `var ${v}=D.props.crate(${x},0,${z},null,{w:.9,h:.8,d:.9});`;
      break;
    case 'barrel':
      body = `var ${v}=D.group(${x},0,${z});D.cyl(.34,.3,.9,pal.wood,0,.45,0,${v},14);var ${v}_t1=D.torus(.34,.03,pal.steel,0,.68,0,${v});${v}_t1.rotation.x=Math.PI/2;var ${v}_t2=D.torus(.34,.03,pal.steel,0,.24,0,${v});${v}_t2.rotation.x=Math.PI/2;`;
      break;
    case 'tree':
      body = `var ${v}=D.props.tree(${x},${z},null,{r:.65,kind:'round'});`;
      break;
    case 'bush':
      body = `var ${v}=D.props.bush(${x},${z},null,{r:.35});`;
      break;
    case 'flower':
      body = `var ${v}=D.group(${x},0,${z});D.cyl(.18,.14,.3,pal.terracotta,0,.15,0,${v},10);D.props.bush(0,0,${v},{r:.2}).position.y=.28;D.ball(.06,pal.rose,0,.52,0,${v});`;
      break;
    case 'rock':
      body = `var ${v}=D.props.rock(${x},${z},null,{r:.4});`;
      break;
    case 'fence':
      body = `var ${v}=D.group(${x},0,${z});D.box(.08,.9,.08,pal.wood,-.8,.45,0,${v});D.box(.08,.9,.08,pal.wood,0,.45,0,${v});D.box(.08,.9,.08,pal.wood,.8,.45,0,${v});D.box(1.9,.08,.06,pal.wood,0,.7,0,${v});D.box(1.9,.08,.06,pal.wood,0,.35,0,${v});`;
      break;
    case 'lamp':
      body = `var ${v}=D.props.lamp(${x},${z},null,{h:2.8});`;
      break;
    case 'sign':
      body = `var ${v}=D.group(${x},0,${z});D.box(.08,1.6,.08,pal.ink,0,.8,0,${v});D.box(.9,.6,.06,pal.mustard,0,1.65,0,${v});D.box(.7,.08,.02,pal.ink,0,1.72,.04,${v});`;
      break;
    case 'dog':
      body = `var ${v}=D.group(${x},0,${z});D.box(.5,.24,.24,pal.cardboard,0,.3,0,${v});D.ball(.14,pal.cardboard,0,.45,.2,${v});D.box(.12,.12,.18,pal.cardboard,.28,.32,.18,${v});D.cyl(.03,.03,.3,pal.cardboard,.2,.45,-.14,${v},6);`;
      break;
    case 'cat':
      body = `var ${v}=D.group(${x},0,${z});D.box(.44,.2,.2,pal.mustard,0,.26,0,${v});D.ball(.12,pal.mustard,0,.4,.18,${v});D.box(.05,.14,.05,pal.mustard,.06,.5,.18,${v});D.cyl(.025,.025,.34,pal.mustard,-.2,.32,-.1,${v},6);`;
      break;
    case 'bird':
      body = `var ${v}=D.group(${x},0,${z});D.ball(.14,pal.cloud,0,.8,0,${v});D.ball(.1,pal.cloud,.1,.88,.1,${v});D.cone(.05,.14,pal.mustard,.2,.86,.12,${v},6);`;
      break;
    case 'flag':
      body = `var ${v}=D.props.flag(${x},${z},null,{h:2.2}).group;`;
      break;
    case 'cone':
      body = `var ${v}=D.props.cone(${x},${z},null);`;
      break;
    default:
      body = '';
  }
  if (!body) return '';
  const safeName = String(name || key).replace(/'/g, '');
  return `/*a3d:${key}*/${body}${v}.name='${safeName}';${v}.userData.a3d={x:${x},z:${z}};if(typeof hot!=='undefined')hot.push(${v});`;
}

/** Insert full statements just before the scene's `return { … }` parts block. */
function insertBeforeReturn(code, statements) {
  if (!statements.length) return null;
  const anchor = /\n([ \t]*)return\s*\{/.exec(code);
  if (!anchor) return null;
  const indent = anchor[1];
  const block = statements.map((s) => `\n${indent}${s}`).join('');
  return code.slice(0, anchor.index) + block + code.slice(anchor.index);
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
  const added = [...code.matchAll(/\/\*a3d:(\w+)\*\/var (\w+)/g)];
  for (const kind of kinds) {
    const hit = added.filter((m) => m[1] === kind.key).pop();
    if (hit) return hit[2];
  }
  if (added.length) return added[added.length - 1][2];
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

  const wantsAdd = /\b(add|put|place|include|insert|create|bring|give me|need|want)\b/i.test(lower);
  const wantsRemove = /\b(remove|delete|strip|hide|get rid of|take out|drop|erase)\b/i.test(lower);
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
        const callRe = new RegExp(`[ \\t]*(?:var\\s+\\w+\\s*=\\s*)?(?:D|P|W)\\.props\\.${kind.helper}\\([^;]*\\);[ \\t]*`, 'g');
        if (callRe.test(code)) {
          commit(code.replace(callRe, '/* removed */'), `Removed the ${kind.noun}`);
        }
      }
    }
  }

  // 3. Additions.
  if (wantsAdd && !wantsRemove) {
    const kinds = matchedKinds(lower).slice(0, 3);
    if (kinds.length) {
      const perKind = countFrom(lower);
      const statements = [];
      const labels = [];
      let slot = 0;
      const explicitName = (lower.match(/\b(driver|worker|chef|barista|baker|customer|child|kid|dog|cat|bird)\b/) || [])[0];
      for (const kind of kinds) {
        for (let n = 0; n < perKind; n += 1) {
          const [x, z] = SLOTS[slot % SLOTS.length];
          statements.push(buildKind(kind.key, `a3d_${kind.key}_${slot}`, x, z, explicitName || kind.noun));
          slot += 1;
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
      return {
        code: currentCode,
        summary: `I could not apply "${instruction}" safely — that edit would have broken the scene.`,
        changed: false,
      };
    }
    code = balanced;
  }

  if (code === currentCode) {
    return { code: currentCode, summary: `I could not map "${instruction}" to a change. ${HELP}`, changed: false };
  }

  return { code, summary: changes.join(', '), changed: true };
}

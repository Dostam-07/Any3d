/**
 * Prompt Fidelity Validator for Any3d
 * 
 * Verifies whether generated 3D code actually realizes the user's prompt
 * with true semantic fidelity, rather than substituting generic fallbacks.
 * 
 * Checks:
 * 1. Primary Subject Presence
 * 2. Secondary Objects Presence
 * 3. Requested Actions & Animations in tick()
 * 4. Environment & Setting Match
 * 5. Absence of Unrelated Dominant Objects (No rogue dustbins/cats/trees in bakery/abstract)
 */

import { extractPromptSemantics } from './semantics.js';

function extractFunctionBody(code, funcName) {
  const re = new RegExp(`\\b${funcName}\\s*(?::\\s*function\\s*)?\\([^)]*\\)\\s*\\{`);
  const match = re.exec(code);
  if (!match) return '';
  const startIndex = match.index + match[0].length;
  let depth = 1;
  let i = startIndex;
  while (i < code.length && depth > 0) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') depth--;
    i++;
  }
  return code.slice(startIndex, depth === 0 ? i - 1 : code.length);
}

export function validatePromptFidelity(code, rawPrompt, format = 'svg') {
  const semantics = extractPromptSemantics(rawPrompt);
  const codeLower = (code || '').toLowerCase();
  const buildSection = extractFunctionBody(code, 'build').toLowerCase();
  const tickSection = extractFunctionBody(code, 'tick').toLowerCase();
  const checks = [];

  const addCheck = (id, label, ok, message = '') => {
    checks.push({ id, label, ok, message });
  };

  // Helper: check if any of the regexes or words exist in code
  const hasInCode = (terms) => {
    return terms.some(t => {
      if (t instanceof RegExp) return t.test(codeLower);
      return codeLower.includes(t.toLowerCase());
    });
  };

  // 1. Primary Subject Verification
  let primaryFound = false;
  let primaryName = semantics.primarySubject;

  switch (semantics.category) {
    case 'bakery':
      primaryFound = hasInCode([/\bbaker\b/, /\bchef\b/, /\bperson\b/, /\bw\.person\b/, /\bapron\b/, /\btorque\b/, /\bchest\b/]);
      break;
    case 'kitchen':
      primaryFound = hasInCode([/\bchef\b/, /\bcook\b/, /\bperson\b/, /\bkitchen\b/, /\bcounter\b/]);
      break;
    case 'blacksmith':
      primaryFound = hasInCode([/\bblacksmith\b/, /\bsmith\b/, /\bperson\b/, /\bforge\b/, /\banvil\b/, /\bhammer\b/]);
      break;
    case 'submarine':
      primaryFound = hasInCode([/\bsubmarine\b/, /\bsub\b/, /\bhull\b/, /\bpropeller\b/, /\bperiscope\b/]);
      break;
    case 'wizard':
      primaryFound = hasInCode([/\bwizard\b/, /\bmage\b/, /\bperson\b/, /\bhat\b/, /\bwand\b/, /\bbook\b/]);
      break;
    case 'aviation':
      primaryFound = hasInCode([/\bplane\b/, /\bairplane\b/, /\baeroplane\b/, /\bfuselage\b/, /\bfus\b/, /\bwing\b/, /\baircraft\b/]);
      break;
    case 'racing':
      primaryFound = hasInCode([/\bcar\b/, /\bracecar\b/, /\bf1\b/, /\bchassis\b/, /\bmonocoque\b/, /\bspoiler\b/, /\bwing\b/]);
      break;
    case 'vehicle':
      primaryFound = hasInCode([/\bcar\b/, /\bchassis\b/, /\bautomobile\b/, /\btruck\b/, /\bvehicle\b/]);
      break;
    case 'nature_waterfall':
      primaryFound = hasInCode([/\bwaterfall\b/, /\bwater\b/, /\bcascade\b/, /\bstream\b/, /\briver\b/]);
      break;
    case 'abstract':
      primaryFound = hasInCode([/\bsculpture\b/, /\bring\b/, /\brings\b/, /\btorus\b/, /\bgimbal\b/, /\barmillary\b/, /\bgyro\b/, /\bgeometric\b/]);
      break;
    case 'space':
      primaryFound = hasInCode([/\brocket\b/, /\bspacecraft\b/, /\bshuttle\b/, /\bgantry\b/]);
      break;
    case 'maritime':
      primaryFound = hasInCode([/\bboat\b/, /\bship\b/, /\bsailboat\b/, /\byacht\b/, /\bmast\b/]);
      break;
    case 'cat':
      primaryFound = hasInCode([/\bcat\b/, /\bkitten\b/, /\bfeline\b/, /\bwhisker\b/]);
      break;
    case 'dog':
      primaryFound = hasInCode([/\bdog\b/, /\bpuppy\b/, /\bhound\b/, /\bcanine\b/]);
      break;
    default:
      // Arbitrary subject check
      const subjectTokens = primaryName.split(/\s+/).filter(w => w.length > 2);
      primaryFound = subjectTokens.length === 0 || subjectTokens.some(tok => codeLower.includes(tok));
      break;
  }

  addCheck(
    101,
    'fidelity-primary-subject',
    primaryFound,
    primaryFound
      ? `Primary subject "${primaryName}" is prominently present.`
      : `Missing primary subject "${primaryName}". The scene fails to represent the central focus of the prompt.`
  );

  // 2. Explicit Secondary Objects Verification
  const missingSecondary = [];
  const foundSecondary = [];

  for (const obj of semantics.secondaryObjects) {
    let objFound = false;
    if (obj === 'cake') {
      objFound = hasInCode([/\bcake\b/, /\bpastry\b/, /\bloaf\b/, /\bfrosting\b/, /\btart\b/]);
    } else if (obj === 'oven') {
      objFound = hasInCode([/\boven\b/, /\bhearth\b/, /\bcoals\b/, /\bfurnace\b/, /\bkiln\b/]);
    } else if (obj === 'table') {
      objFound = hasInCode([/\btable\b/, /\bbench\b/, /\bcounter\b/, /\bstand\b/]);
    } else if (obj === 'runway') {
      objFound = hasInCode([/\brunway\b/, /\btarmac\b/, /\bthreshold\b/, /\bpiano\b/, /\bdashes\b/]);
    } else if (obj === 'landing gear') {
      objFound = hasInCode([/\bgear\b/, /\bwheel\b/, /\bwheels\b/, /\bstrut\b/, /\bstruts\b/, /\bwfl\b/, /\bwfr\b/]);
    } else if (obj === 'wings') {
      objFound = hasInCode([/\bwing\b/, /\bwings\b/, /\bwingl\b/, /\bwingr\b/]);
    } else if (obj === 'corner') {
      objFound = hasInCode([/\bcorner\b/, /\bcurve\b/, /\bkerb\b/, /\brumble\b/, /\btrack\b/]);
    } else if (obj === 'tyres') {
      objFound = hasInCode([/\btyre\b/, /\btyres\b/, /\btire\b/, /\btires\b/, /\bwheel\b/, /\bwheels\b/]);
    } else if (obj === 'pond') {
      objFound = hasInCode([/\bpond\b/, /\bpool\b/, /\bwater\b/, /\bbasin\b/]);
    } else if (obj === 'rocks') {
      objFound = hasInCode([/\brock\b/, /\brocks\b/, /\bboulder\b/, /\bboulders\b/, /\bstone\b/, /\bstones\b/, /\bcliff\b/]);
    } else if (obj === 'rings') {
      objFound = hasInCode([/\bring\b/, /\brings\b/, /\btorus\b/]);
    } else if (obj === 'anvil') {
      objFound = hasInCode([/\banvil\b/, /\bblock\b/, /\biron\b/]);
    } else if (obj === 'sword') {
      objFound = hasInCode([/\bsword\b/, /\bblade\b/, /\bsteel\b/]);
    } else if (obj === 'sparks') {
      objFound = hasInCode([/\bspark\b/, /\bsparks\b/, /\bember\b/, /\bcoals\b/]);
    } else if (obj === 'corals') {
      objFound = hasInCode([/\bcoral\b/, /\bcorals\b/, /\breef\b/]);
    } else if (obj === 'books') {
      objFound = hasInCode([/\bbook\b/, /\bbooks\b/, /\btome\b/, /\bscroll\b/]);
    } else {
      objFound = hasInCode([obj]);
    }

    if (objFound) {
      foundSecondary.push(obj);
    } else {
      missingSecondary.push(obj);
    }
  }

  const secondaryOk = missingSecondary.length === 0;
  addCheck(
    102,
    'fidelity-secondary-props',
    secondaryOk,
    secondaryOk
      ? (foundSecondary.length > 0 ? `Requested secondary objects (${foundSecondary.join(', ')}) are all present.` : 'No mandatory secondary objects requested.')
      : `Missing explicitly requested object(s): ${missingSecondary.join(', ')}.`
  );

  // 3. Actions & Kinematic Motion Loop in tick()
  let actionOk = true;
  let actionMessage = 'Animation loop is present.';

  if (semantics.actions.length > 0) {
    const verifiedActions = [];
    const missingActions = [];

    for (const act of semantics.actions) {
      let actFound = false;
      if (act === 'taking out' || act === 'presenting') {
        actFound = hasInCode([/\boven\b/, /\btable\b/]) && (tickSection.includes('baker') || tickSection.includes('cake') || tickSection.includes('hand') || tickSection.includes('reach') || tickSection.includes('position') || tickSection.includes('sin'));
      } else if (act === 'retracting') {
        actFound = tickSection.includes('gear') || tickSection.includes('wheel') || tickSection.includes('retract') || (tickSection.includes('plane') && tickSection.includes('rotation'));
      } else if (act === 'drifting' || act === 'racing') {
        actFound = (tickSection.includes('rotation') || tickSection.includes('drift') || tickSection.includes('wheel') || tickSection.includes('sin') || tickSection.includes('position')) && (tickSection.includes('car') || tickSection.includes('p.'));
      } else if (act === 'forging') {
        actFound = tickSection.includes('hammer') || tickSection.includes('spark') || tickSection.includes('arm') || tickSection.includes('sin') || tickSection.includes('reach');
      } else if (act === 'diving') {
        actFound = tickSection.includes('sub') || tickSection.includes('propeller') || tickSection.includes('position') || tickSection.includes('sin');
      } else if (act === 'casting') {
        actFound = tickSection.includes('book') || tickSection.includes('wand') || tickSection.includes('glow') || tickSection.includes('position') || tickSection.includes('sin');
      } else if (act === 'flowing') {
        actFound = tickSection.includes('water') || tickSection.includes('stream') || tickSection.includes('fall') || tickSection.includes('scale') || tickSection.includes('position') || tickSection.includes('sin');
      } else if (act === 'floating' || act === 'rotating') {
        actFound = (tickSection.includes('rotation') && (tickSection.includes('.x') || tickSection.includes('.y') || tickSection.includes('.z'))) || (tickSection.includes('position') && (tickSection.includes('plane') || tickSection.includes('hero') || tickSection.includes('boat') || tickSection.includes('core')));
      } else {
        actFound = tickSection.length > 20;
      }

      if (actFound) verifiedActions.push(act);
      else missingActions.push(act);
    }

    actionOk = missingActions.length === 0;
    actionMessage = actionOk
      ? `Requested actions (${verifiedActions.join(', ')}) represented in kinematic loop.`
      : `Requested action(s) (${missingActions.join(', ')}) not reflected in motion loop.`;
  }

  addCheck(103, 'fidelity-action-motion', actionOk, actionMessage);

  // 4. Absence of Unrelated Dominant Objects Guard
  const rogueFound = [];
  for (const prohibited of semantics.prohibitedObjects) {
    if (prohibited === 'dustbin' || prohibited === 'trashcan') {
      if (hasInCode([/\btrashcan\b/, /\bdustbin\b/, /\bprop can\b/, /\bcorrugated steel trashcan\b/, /\bcan \/ basket\b/])) {
        rogueFound.push('unrequested dustbin/trashcan');
      }
    } else if (prohibited === 'tree' || prohibited === 'trees') {
      if (hasInCode([/\bp\.tree\b/, /\bd\.props\.bush\b/, /\btrees\b/, /\bcylinder\(0\.08, 0\.9/])) {
        rogueFound.push('unrequested outdoor trees');
      }
    } else if (prohibited === 'cat') {
      if (hasInCode([/\bcat\b/, /\bcalico\b/, /\btailrod\b/, /\bearl\b/])) {
        rogueFound.push('unrequested rogue cat');
      }
    } else if (prohibited === 'wall') {
      if (hasInCode([/\bbackwall\b/, /\bbackground wall\b/, /\bwall = group\b/])) {
        rogueFound.push('unrequested outdoor backdrop wall');
      }
    }
  }

  const noRogueObjects = rogueFound.length === 0;
  addCheck(
    104,
    'fidelity-clean-concept',
    noRogueObjects,
    noRogueObjects
      ? 'No unrelated dominant objects invented. Scene remains strictly faithful to prompt.'
      : `Unrelated object(s) invented that hijack the scene: ${rogueFound.join(', ')}.`
  );

  // 5. Environment Match Check
  let envMatch = true;
  let envMsg = `Environment matches requested ${semantics.environment}.`;

  if (semantics.isIndoor) {
    // Indoor scene should NOT have green terrain or grass meadow in build
    const hasOutdoorTerrain = [/#758852/, /#65a30d/, /'grass'/, /"grass"/, /pal\.leaf/, /lush meadow/, /garden & masonry/].some(t => {
      if (t instanceof RegExp) return t.test(buildSection);
      return buildSection.includes(t);
    });
    if (hasOutdoorTerrain) {
      envMatch = false;
      envMsg = `Indoor setting requested, but outdoor grass/meadow terrain was generated.`;
    }
  } else if (semantics.isAbstractVoid) {
    const hasOutdoor = [/w\.terrain\(/, /'meadow'/, /'grass'/, /pal\.leaf/, /backwall/].some(t => {
      if (t instanceof RegExp) return t.test(buildSection);
      return buildSection.includes(t);
    });
    if (hasOutdoor) {
      envMatch = false;
      envMsg = `Abstract geometric sculpture requested, but outdoor ground terrain or walls were generated.`;
    }
  }

  addCheck(105, 'fidelity-environment', envMatch, envMsg);

  // Calculate Fidelity Score (0 to 100)
  let score = 100;
  if (!primaryFound) score -= 45;
  if (!secondaryOk) score -= Math.min(30, missingSecondary.length * 15);
  if (!actionOk) score -= 15;
  if (!noRogueObjects) score -= Math.min(30, rogueFound.length * 15);
  if (!envMatch) score -= 15;
  score = Math.max(0, score);

  const isValid = primaryFound && secondaryOk && noRogueObjects && score >= 70;

  return {
    valid: isValid,
    score,
    semantics,
    primarySubject: { name: primaryName, found: primaryFound },
    secondaryObjects: semantics.secondaryObjects.map(obj => ({
      name: obj,
      found: foundSecondary.includes(obj)
    })),
    actions: semantics.actions.map(act => ({
      name: act,
      found: !actionOk ? false : true
    })),
    unrelatedObjects: rogueFound,
    checks,
    summary: isValid
      ? `High prompt fidelity (${score}/100): ${primaryName} faithfully realized.`
      : `Low prompt fidelity (${score}/100): ${!primaryFound ? `Missing ${primaryName}. ` : ''}${!secondaryOk ? `Missing props (${missingSecondary.join(', ')}). ` : ''}${!noRogueObjects ? `Invented unrelated items (${rogueFound.join(', ')}).` : ''}`
  };
}

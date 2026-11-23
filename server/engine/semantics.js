/**
 * Any3d Semantic Understanding Engine
 * 
 * Accurately extracts the user's intent from raw or enhanced prompts:
 * - Unwraps meta-prompts ("bringing to life '...'")
 * - Identifies Primary Subject (who or what is the focal point)
 * - Identifies Subject Semantic Type (humanoid, vehicle, nature, creature, abstract, architecture)
 * - Identifies Secondary Objects (explicit props and contextual elements)
 * - Identifies Actions & Interactions (what is happening)
 * - Identifies Environment & Setting (indoor kitchen vs runway vs nature vs asteroid vs abstract void)
 * - Identifies Prohibited / Incompatible Objects (e.g. no outdoor trees/dustbins in bakery, asteroid, or abstract sculpture)
 * - Determines Visual Style & Motion parameters
 */

/**
 * Unwraps enhanced or quoted prompts to extract the core user intent.
 */
export function unwrapCorePrompt(rawPrompt) {
  if (!rawPrompt || typeof rawPrompt !== 'string') return '';
  let trimmed = rawPrompt.trim();

  // Pattern 0: Strip meta prompt scaffolding (e.g. "Enhance this 3D scene prompt for the WORLDS engine: \"...\"")
  const metaWrapper = /^(?:Enhance|Generate|Create|Optimize)\s+(?:this\s+)?3D\s+scene\s+prompt\s+for\s+(?:the\s+)?[A-Za-z0-9_-]+\s+engine:\s*["'`]?/i;
  if (metaWrapper.test(trimmed)) {
    trimmed = trimmed.replace(metaWrapper, '').replace(/["'`]\s*$/, '').trim();
  }

  // Pattern 0b: Strip general prefix commands like "Create a detailed 3D scene of ..." or "Create a 3D scene for ..."
  const makeWrapper = /^(?:Please\s+)?(?:create|build|generate|make|render|show)\s+(?:me\s+)?(?:a|an)\s+(?:detailed\s+|multi-part\s+|isometric\s+|3d\s+)*(?:scene|figure|world|diorama)\s+(?:of|for|depicting|showing)\s*:\s*["'`]?/i;
  if (makeWrapper.test(trimmed)) {
    trimmed = trimmed.replace(makeWrapper, '').replace(/["'`]\s*$/, '').trim();
  }

  // Pattern 1: bringing to life ["']([^"']+)["']
  const quotedLifeMatch = /bringing\s+to\s+life\s+["'`]([^"'`]+)["'`]/i.exec(trimmed);
  if (quotedLifeMatch && quotedLifeMatch[1].trim().length > 3) {
    return quotedLifeMatch[1].trim();
  }

  // Pattern 2: bringing to life (.*?)(?:, featuring|\.|$)/i
  const unquotedLifeMatch = /bringing\s+to\s+life\s+([^,.:]+(?:,[^,.:]+)*?)(?:,\s*featuring|\.|$)/i.exec(trimmed);
  if (unquotedLifeMatch && unquotedLifeMatch[1].trim().length > 3) {
    return unquotedLifeMatch[1].trim();
  }

  // Pattern 3: quoted core inside quotes at beginning or end
  const singleQuotedMatch = /^["'`]([^"'`]{10,})["'`]$/.exec(trimmed);
  if (singleQuotedMatch) {
    return singleQuotedMatch[1].trim();
  }

  // Pattern 4: Check if prompt starts with boilerplate "A charming isometric vignette... : <core>"
  const colonMatch = /^A\s+(?:charming\s+)?isometric\s+(?:vignette|scene)[^:]*:\s*([^,.:]+(?:,[^,.:]+)*?)(?:,\s*featuring|\.|$)/i.exec(trimmed);
  if (colonMatch && colonMatch[1].trim().length > 3) {
    return colonMatch[1].trim();
  }

  // Pattern 5: "A detailed modular isometric scene depicting <core>, accompanied by..."
  const depictingMatch = /^A\s+detailed\s+(?:modular\s+)?isometric\s+scene\s+depicting\s+([^,.:]+(?:,[^,.:]+)*?)(?:,\s*accompanied|\.|$)/i.exec(trimmed);
  if (depictingMatch && depictingMatch[1].trim().length > 3) {
    return depictingMatch[1].trim();
  }

  // Pattern 6: Generalized enhanced/descriptive prefixes: "A detailed isometric scene of <core>, featuring..."
  const scenePrefixMatch = /^(?:A|An)\s+(?:[\w-]+\s+){0,6}?(?:scene|vignette|illustration|view|composition)\s+(?:of|depicting|showing|centered\s+on|where)\s+(?:an?\s+)?(.+?)(?:,\s*(?:featuring\s+directional|featuring\s+|accompanied\s+by|with\s+directional|with\s+tactile)|\.|$)/i.exec(trimmed);
  if (scenePrefixMatch && scenePrefixMatch[1].trim().length > 3) {
    return scenePrefixMatch[1].trim();
  }

  // Pattern 7: Strip trailing synthetic scaffolding if present
  let out = trimmed;
  const trailingScaffolding = /,\s*(?:featuring\s+(?:directional|warm|ambient|tactile|specular|glossy|clean|subtle)[^.]*|and\s+a\s+synchronized\s+[^.]*in\s+tick\(\))\.*$/i;
  if (trailingScaffolding.test(out)) {
    out = out.replace(trailingScaffolding, '').trim();
    const leadingPrefix = /^(?:A|An)\s+(?:[\w-]+\s+){0,6}?(?:scene|vignette|illustration|view|composition)\s+(?:of|depicting|showing|centered\s+on|where)\s+(?:an?\s+)?/i;
    if (leadingPrefix.test(out)) {
      out = out.replace(leadingPrefix, '').trim();
    }
    return out;
  }

  return trimmed;
}

// Words that are modifiers, not the head noun of a phrase.
const MODIFIERS = new Set([
  'a', 'an', 'the', 'of', 'in', 'on', 'at', 'with', 'and', 'or', 'to', 'for',
  'cozy', 'cosy', 'retro', 'cute', 'little', 'small', 'tiny', 'big', 'large', 'huge', 'giant',
  'seaside', 'coastal', 'nocturnal', 'night', 'nighttime', 'sunny', 'sunlit', 'golden',
  'high-tech', 'hightech', 'high', 'low', 'tech', 'sci-fi', 'scifi', 'futuristic', 'modern',
  'japanese', 'ancient', 'old', 'rustic', 'weathered', 'factory', 'industrial', 'detailed',
  'charming', 'beautiful', 'gorgeous', 'stunning', 'colorful', 'colourful', 'vibrant', 'pastel',
  'mountain', 'mountainous', 'alpine', 'forest', 'woodland', 'desert', 'arctic', 'tropical',
  'lonely', 'solitary', 'abandoned', 'sleeping', 'spinning', 'moving', 'animated', 'floating',
  'mysterious', 'magical', 'enchanted', 'bustling', 'quiet', 'peaceful', 'warm', 'cool',
  'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'white', 'grey', 'gray',
  'brown', 'silver', 'gold', 'golden', 'metallic', 'wooden', 'stone', 'brick', 'glass',
  'high', 'deep', 'tall', 'short', 'wide', 'narrow', 'round', 'square', 'flat',
  'hot', 'cold', 'wet', 'dry', 'icy', 'snowy', 'lush', 'steam', 'steaming',
  'research', 'secret', 'hidden', 'underground', 'floating', 'orbital', 'deep-space',
  'vintage', 'classic', 'antique', 'weathered', 'rusty', 'polished', 'shiny', 'matte',
  'proud', 'brave', 'fierce', 'gentle', 'weary', 'happy', 'sad', 'angry', 'lonely',
  'spring', 'autumn', 'winter', 'summer', 'quick', 'brown', 'lazy', 'sleeping',
  'sleek', 'slim', 'bold', 'delicate', 'ornate', 'minimal', 'minimalist',
  'isometric', 'scene', 'scenes', 'vignette', 'vignettes', 'illustration', 'render', 'model', 'figure', 'composition', 'depicting', 'showing', 'modular', 'stylized', 'view'
]);

/**
 * Extracts the most likely head noun phrase from free text.
 * Skips leading articles/modifiers and returns the trailing noun-ish sequence.
 * "A cozy retro coffee cart with a sleeping cat" -> "coffee cart"
 * "a seaside lighthouse island"               -> "lighthouse island"
 */
export function extractHeadNounPhrase(text, maxWords = 3) {
  if (!text || typeof text !== 'string') return 'scene';

  // Known compound nouns that should be treated as a single lexical unit.
  const COMPOUNDS = ['hot spring', 'coffee cart', 'food cart', 'tea house', 'water mill'];
  const lower = text.toLowerCase();
  const compound = COMPOUNDS.find(c => lower.includes(c));

  // Take the text up to the first clause separator.
  const head = text.split(/[,;:.!?]|\bwith\b|\bfeaturing\b|\bthat\b|\bwhich\b/i)[0].trim();
  const words = head.toLowerCase().replace(/[^a-z0-9\-\s]/g, ' ').split(/\s+/).filter(Boolean);
  if (!words.length) return 'scene';

  // Drop leading articles and known modifiers.
  let start = 0;
  while (start < words.length - 1 && (MODIFIERS.has(words[start]) || words[start].length < 3)) {
    start++;
  }

  // If every word was a modifier (e.g. "vintage red"), the real noun was skipped:
  // fall back to the last word instead of returning a dangling adjective.
  if (start >= words.length - 1 && MODIFIERS.has(words[start])) {
    return words[words.length - 1];
  }

  // Take up to maxWords from the start, but stop at a trailing preposition/modifier
  // or at a verb/gerund (e.g. "samurai practicing" -> "samurai").
  const out = [];
  for (let i = start; i < words.length && out.length < maxWords; i++) {
    if (MODIFIERS.has(words[i]) && out.length > 0) break;
    if (out.length > 0 && /^[a-z]{4,}ing$/.test(words[i]) && !MODIFIERS.has(words[i])) break;
    out.push(words[i]);
  }
  let phrase = out.join(' ').trim();

  // Collapse a leading modifier inside the phrase when a compound noun is present.
  if (compound && phrase.includes(compound)) {
    phrase = (phrase.split(compound)[0].trim() ? phrase : compound);
    if (phrase !== compound) {
      // Keep any real head words that follow the compound; else just the compound.
      const rest = phrase.split(compound)[1].trim();
      phrase = rest ? `${compound} ${rest}` : compound;
    }
  }
  return phrase || words[words.length - 1] || 'scene';
}

/**
 * Extracts a complete semantic specification from any natural language prompt.
 */
export function extractPromptSemantics(rawPrompt) {
  const fullText = (rawPrompt || '').trim();
  const coreText = unwrapCorePrompt(fullText);
  const p = fullText.toLowerCase();
  const cp = coreText.toLowerCase();

  // Combined search corpus with higher weight on core intent
  const corpus = `${cp} ${cp} ${p}`;

  // 1. Specific Domain Checks
  const hasOffice = /\b(office|workspace|workstation|cubicle|desktop|desk|computer|laptop|chair|chairs|study|study\s*room)\b/i.test(corpus);
  const hasBaker = /\b(baker|bakery|bake|bread|cake|pastry|pastries|croissant|oven|baking|dough)\b/i.test(corpus);
  const hasBlacksmith = /\b(blacksmith|forge|anvil|smithy|metalsmith|hammering\s*sword|forging)\b/i.test(corpus);
  const hasSubmarine = /\b(submarine|submersible|u-boat|underwater\s*drone)\b/i.test(corpus);
  const hasWizard = /\b(wizard|mage|sorcerer|warlock|spellcaster|library.*spell|magic.*book)\b/i.test(corpus);
  const hasAviation = /\b(aeroplane|airplane|plane|jet|jetliner|aircraft|airport|runway|tarmac|hangar|flight|flying|landing\s*gear)\b/i.test(corpus);
  const hasRacing = /\b(f1|formula\s*1|racing|racecar|grand\s*prix|racetrack|race\s*track|speedway|supercar|drift|drifting)\b/i.test(corpus);
  const hasCar = !hasRacing && /\b(sports\s*car|car|cars|automobile|vehicle|driving)\b/i.test(corpus);
  const hasWaterfall = /\b(waterfall|cascade|rapids|pond.*rocks|waterfall.*pond)\b/i.test(corpus);
  const hasSculpture = /\b(sculpture|abstract|geometric\s*sculpture|metallic\s*rings|rings.*sculpture|floating.*rings)\b/i.test(corpus);
  const hasRocket = /\b(rocket|spaceship|spacecraft|shuttle|launchpad|flame\s*trench)\b/i.test(corpus);
  const hasBus = /\b(bus|transit\s*bus|city\s*bus|coach|minibus|double\s*decker)\b/i.test(corpus);
  const hasCity = !hasBus && /\b(city|metropolis|downtown|urban|skyline|city\s*street|street\s*corner|street|avenue|boulevard|crossroad|crossroads|cityscape|town|skyscraper|skyscrapers|tram|traffic|crosswalk|cobblestone|crane)\b/i.test(corpus);
  const hasFarm = /\b(farm|farmstead|farmland|barn|farmhouse|ranch|countryside|pasture|crop|crops|orchard|tractor|hay|silo|livestock|windmill|windpump)\b/i.test(corpus);
  const hasPark = /\b(park|botanical|meadow|nature\s*park|greenery|campsite|camping)\b/i.test(corpus);
  const hasHarbor = /\b(harbor|harbour|port|pier|dock|docks|marina|wharf|seaport|quay|dockyard|container\s*ship|cargo\s*ship)\b/i.test(corpus);
  const hasCastle = /\b(castle|fortress|medieval|kingdom|citadel|rampart|towers|stronghold)\b/i.test(corpus);
  const hasLighthouse = /\b(lighthouse|light\s*station|beacon\s*tower|rocky\s*island)\b/i.test(corpus);
  const hasClassroom = /\b(classroom|class\s*room|teacher|lesson|lecture|school\s*class|students|pupils|chalkboard|blackboard|desks?|chalk)\b/i.test(corpus);
  const hasSports = /\b(badminton|tennis|court|ping\s*pong|table\s*tennis|basketball|volleyball|soccer|football|racket|shuttlecock|referee)\b/i.test(corpus);
  const hasCampus = !hasClassroom && /\b(school|college|university|campus|academy|high\s*school|quadrangle|lecture\s*hall|dormitory)\b/i.test(corpus);
  const hasAirport = /\b(airport|airfield|aerodrome|terminal|hangar|air\s*traffic\s*control|concourse|runway|tarmac)\b/i.test(corpus);
  const hasSea = !hasHarbor && !hasLighthouse && !hasSubmarine && /\b(sea|ocean|open\s*water|deep\s*sea|marine|maritime|sailing|yacht|sailboat|schooner|beach|coast)\b/i.test(corpus);

  // 2. Identify High-Level Subject Type
  const isHumanoid = hasClassroom || hasBaker || hasBlacksmith || hasWizard || /\b(person|man|woman|baker|samurai|botanist|chef|scientist|worker|dancer|kid|child|mechanic|sailor|knight|guard|pilot|warrior|astronaut|farmer|artist|diver|juggler|florist|teacher|student|students|player|players)\b/i.test(corpus);
  const isVehicle = hasAviation || hasRacing || hasCar || hasSubmarine || hasRocket || /\b(car|truck|plane|aeroplane|airplane|submarine|boat|ship|train|locomotive|motorcycle|bike|rover|shuttle|rocket)\b/i.test(corpus);
  const isWater = hasWaterfall || hasSubmarine || hasHarbor || /\b(water|pond|ocean|sea|river|lake|stream|coral)\b/i.test(corpus);
  const isIndoor = hasClassroom || hasBaker || hasBlacksmith || hasWizard || hasOffice || /\b(indoor|kitchen|bakery|library|workshop|office|room|diner|lab|laboratory|hall|inside|classroom|barbershop)\b/i.test(corpus);
  const isAbstractVoid = hasSculpture || (!isHumanoid && !isVehicle && !isWater && /\b(sculpture|abstract|geometric|rings|torus|void|gyro)\b/i.test(corpus));

  // Determine Primary Subject Name
  let primarySubject = 'scene';
  let category = 'custom';
  let environment = 'pedestal';

  if (hasBus) {
    category = 'transit_bus';
    primarySubject = 'bus';
    environment = 'transit_avenue';
  } else if (hasClassroom) {
    category = 'classroom';
    primarySubject = 'classroom';
    environment = 'indoor_classroom';
  } else if (hasSports) {
    category = 'sports';
    primarySubject = /\bbadminton\b/i.test(corpus) ? 'badminton court' : 'tennis court';
    environment = 'sports_arena';
  } else if (hasOffice) {
    category = 'office';
    primarySubject = 'office';
    environment = 'indoor_office';
  } else if (hasCity) {
    category = 'city';
    primarySubject = 'city';
    environment = 'urban_avenue';
  } else if (hasFarm) {
    category = 'farm';
    primarySubject = 'farm';
    environment = 'countryside_farm';
  } else if (hasPark) {
    category = 'park';
    primarySubject = 'park';
    environment = 'nature_park';
  } else if (hasLighthouse) {
    category = 'lighthouse';
    primarySubject = 'lighthouse';
    environment = 'coastal_shore';
  } else if (hasAirport) {
    category = 'airport';
    primarySubject = 'airport';
    environment = 'airport_terminal';
  } else if (hasHarbor) {
    category = 'harbor';
    primarySubject = 'harbor';
    environment = 'coastal_harbor';
  } else if (hasCampus) {
    category = 'campus';
    primarySubject = 'campus';
    environment = 'academic_campus';
  } else if (hasSea) {
    category = 'sea';
    primarySubject = 'ocean';
    environment = 'open_ocean';
  } else if (hasCastle) {
    category = 'castle';
    primarySubject = 'castle';
    environment = 'medieval_kingdom';
  } else if (hasBaker) {
    category = 'bakery';
    primarySubject = 'baker';
    environment = 'indoor_bakery';
  } else if (hasBlacksmith) {
    category = 'blacksmith';
    primarySubject = 'blacksmith';
    environment = 'indoor_workshop';
  } else if (hasSubmarine) {
    category = 'submarine';
    primarySubject = 'submarine';
    environment = 'underwater_marine';
  } else if (hasWizard) {
    category = 'wizard';
    primarySubject = 'wizard';
    environment = 'indoor_library';
  } else if (hasAviation) {
    category = 'aviation';
    primarySubject = 'aeroplane';
    environment = 'airport_runway';
  } else if (hasRacing) {
    category = 'racing';
    primarySubject = /\bf1\b/i.test(corpus) ? 'f1 car' : 'sports car';
    environment = 'road_circuit';
  } else if (hasCar) {
    category = 'racing';
    primarySubject = 'sports car';
    environment = 'road_circuit';
  } else if (hasWaterfall) {
    category = 'nature_waterfall';
    primarySubject = 'waterfall';
    environment = 'natural_pond';
  } else if (hasSculpture) {
    category = 'abstract';
    primarySubject = 'geometric sculpture';
    environment = 'abstract_void';
  } else if (hasRocket) {
    category = 'space';
    primarySubject = 'rocket';
    environment = 'launchpad';
  } else if (isHumanoid) {
    category = 'humanoid_character';
    primarySubject = extractHeadNounPhrase(coreText) || 'character';
    environment = isIndoor ? 'indoor_room' : 'pedestal';
  } else if (isVehicle) {
    category = 'vehicle_craft';
    primarySubject = extractHeadNounPhrase(coreText) || 'vehicle';
    environment = 'open_ground';
  } else {
    // Dynamic Subject Extraction from prompt nouns
    primarySubject = extractHeadNounPhrase(coreText) || 'scene';
    // Descriptive environment hint for the LLM prompt (no new geometry is invented).
    if (/\b(lighthouse|beacon|coastal\s*tower|shore)\b/i.test(corpus)) environment = 'coastal_shore';
    else if (/\b(onsen|hot\s*spring|thermal\s*bath|bathtub)\b/i.test(corpus)) environment = 'thermal_spring';
    else if (/\b(coffee\s*cart|food\s*cart|tea\s*cart|market\s*stall|kiosk)\b/i.test(corpus)) environment = 'street_market';
    else if (/\b(lab|laboratory|research|hologram)\b/i.test(corpus)) environment = 'indoor_lab';
  }

  // Refine primary subject based on explicit key terms
  if (/\bbaker\b/i.test(corpus)) primarySubject = 'baker';
  if (/\b(aeroplane|airplane|plane|jet)\b/i.test(corpus)) primarySubject = 'aeroplane';
  if (/\bf1\s*car\b/i.test(corpus)) primarySubject = 'f1 car';
  else if (/\b(sports\s*car|racecar|drifting\s*car)\b/i.test(corpus)) primarySubject = 'sports car';
  if (/\bblacksmith\b/i.test(corpus)) primarySubject = 'blacksmith';
  if (/\bsubmarine\b/i.test(corpus)) primarySubject = 'submarine';
  if (/\bwizard\b/i.test(corpus)) primarySubject = 'wizard';
  if (/\bwaterfall\b/i.test(corpus)) primarySubject = 'waterfall';
  if (/\b(sculpture|geometric\s*sculpture|metallic\s*rings)\b/i.test(corpus)) primarySubject = 'geometric sculpture';

  // 3. Extract Secondary Objects explicitly mentioned
  const secondaryObjects = [];
  const addSecondary = (name, synonyms) => {
    if (synonyms.some(s => new RegExp(`\\b${s}\\b`, 'i').test(corpus))) {
      secondaryObjects.push(name);
    }
  };

  addSecondary('cake', ['cake', 'pastry', 'pie', 'tart', 'loaf', 'bread']);
  addSecondary('oven', ['oven', 'kiln', 'stove', 'furnace', 'hearth']);
  addSecondary('desk', ['desk', 'desktop', 'workstation', 'work\\s*table', 'study\\s*table', 'cubicle']);
  addSecondary('chair', ['chair', 'chairs', 'seat', 'armchair', 'swivel\\s*chair', 'stool']);
  addSecondary('computer', ['computer', 'desktop', 'monitor', 'screen', 'laptop', 'pc']);
  addSecondary('keyboard', ['keyboard', 'keypad']);
  addSecondary('lamp', ['lamp', 'desk\\s*lamp', 'street\\s*lamp', 'lantern', 'torch', 'sconce', 'task\\s*lamp']);
  addSecondary('table', ['table', 'bench', 'counter', 'stand', 'pedestal']);
  addSecondary('runway', ['runway', 'tarmac', 'airstrip']);
  addSecondary('landing gear', ['landing\\s*gear', 'gear', 'wheels', 'struts']);
  addSecondary('wings', ['wings', 'wing']);
  addSecondary('corner', ['corner', 'curve', 'turn', 'bend', 'track']);
  addSecondary('tyres', ['tyre', 'tyres', 'tire', 'tires', 'wheels']);
  addSecondary('pond', ['pond', 'pool', 'basin', 'lake', 'stream']);
  addSecondary('rocks', ['rock', 'rocks', 'boulders', 'stones', 'cliffs', 'cliff']);
  addSecondary('rings', ['ring', 'rings', 'metallic\\s*rings', 'torus', 'hoops']);
  addSecondary('anvil', ['anvil', 'iron\\s*anvil']);
  addSecondary('sword', ['sword', 'blade', 'bokken']);
  addSecondary('sparks', ['spark', 'sparks', 'ember', 'embers']);
  addSecondary('corals', ['coral', 'corals', 'reef']);
  addSecondary('books', ['book', 'books', 'tome', 'scroll', 'scrolls']);
  addSecondary('pavilion', ['pavilion', 'gazebo', 'pagoda', 'canopy']);
  addSecondary('flora', ['flora', 'flower', 'flowers', 'plant', 'plants', 'crystal']);
  addSecondary('asteroid', ['asteroid', 'meteor', 'crater']);
  addSecondary('radar', ['radar', 'dish', 'antenna']);
  addSecondary('trashcan', ['trashcan', 'trash\\s*can', 'garbage\\s*can', 'dustbin', 'bin', 'dumpster']);
  addSecondary('trees', ['tree', 'trees', 'pines', 'foliage']);
  addSecondary('wall', ['wall', 'barrier', 'fence']);
  addSecondary('fire', ['fire', 'flame', 'campfire', 'bonfire']);
  addSecondary('buildings', ['building', 'buildings', 'skyscraper', 'skyscrapers', 'tower', 'towers']);
  addSecondary('barn', ['barn', 'silo', 'farmhouse']);
  addSecondary('tractor', ['tractor', 'harvester']);
  addSecondary('street', ['street', 'road', 'avenue', 'crosswalk']);
  addSecondary('traffic light', ['traffic\\s*light', 'stoplight', 'signal']);
  addSecondary('windmill', ['windmill', 'windpump']);
  addSecondary('lighthouse', ['lighthouse', 'beacon']);
  addSecondary('terminal', ['terminal', 'concourse', 'jet\\s*bridge', 'hangar']);
  addSecondary('control tower', ['control\\s*tower', 'atc']);
  addSecondary('crane', ['crane', 'gantry\\s*crane', 'cargo\\s*crane']);
  addSecondary('passengers', ['passenger', 'passengers', 'passanger', 'passangers', 'commuter', 'commuters', 'riders', 'crowd']);
  addSecondary('conductor', ['conductor', 'bus\\s*conductor', 'ticket\\s*collector', 'ticket\\s*inspector', 'driver']);
  addSecondary('bus stop', ['bus\\s*stop', 'bus\\s*shelter', 'shelter', 'transit\\s*stop']);
  addSecondary('tram', ['tram', 'streetcar', 'trolley', 'light\\s*rail']);
  addSecondary('containers', ['containers', 'cargo\\s*containers', 'shipping\\s*containers']);
  addSecondary('tugboat', ['tugboat', 'boat', 'freighter', 'ship', 'schooner', 'yacht']);
  addSecondary('clock tower', ['clock\\s*tower', 'bell\\s*tower']);
  addSecondary('fountain', ['fountain', 'water\\s*fountain']);
  addSecondary('drawbridge', ['drawbridge', 'moat']);
  addSecondary('chalkboard', ['chalkboard', 'blackboard', 'whiteboard', 'board']);
  addSecondary('teacher', ['teacher', 'instructor', 'professor', 'lecturer']);
  addSecondary('students', ['student', 'students', 'pupil', 'pupils']);
  addSecondary('net', ['net', 'badminton\\s*net', 'tennis\\s*net']);
  addSecondary('racket', ['racket', 'rackets', 'racquet']);
  addSecondary('shuttlecock', ['shuttlecock', 'shuttle', 'birdie']);

  // 4. Extract Actions & Interactions
  const actions = [];
  const addAction = (actionName, patterns) => {
    if (patterns.some(patt => new RegExp(`\\b${patt}\\b`, 'i').test(corpus))) {
      actions.push(actionName);
    }
  };

  addAction('taking out', ['taking\\s*out', 'pulling\\s*out', 'extracting', 'removing']);
  addAction('presenting', ['presenting', 'serving', 'placing', 'setting', 'showing', 'displaying']);
  addAction('flying', ['flying', 'soaring', 'cruising', 'airborne']);
  addAction('retracting', ['retracting', 'tucking', 'folding', 'raising']);
  addAction('drifting', ['drifting', 'sliding', 'skidding', 'cornering', 'turning']);
  addAction('racing', ['racing', 'speeding', 'accelerating', 'lapping']);
  addAction('forging', ['forging', 'hammering', 'striking', 'smithing', 'crafting']);
  addAction('diving', ['diving', 'submerging', 'descending', 'exploring']);
  addAction('casting', ['casting', 'conjuring', 'channeling', 'chanting']);
  addAction('flowing', ['flowing', 'cascading', 'pouring', 'falling', 'rushing']);
  addAction('floating', ['floating', 'hovering', 'levitating', 'suspended']);
  addAction('rotating', ['rotating', 'spinning', 'turning', 'revolving', 'twisting']);
  addAction('practicing', ['practicing', 'sparring', 'training']);
  addAction('examining', ['examining', 'inspecting', 'scanning', 'studying']);
  addAction('working', ['working', 'typing', 'computing', 'coding', 'writing']);
  addAction('sitting', ['sitting', 'seated', 'swivel', 'swiveling']);

  // 4b. Extract Explicit Size Intent (hero: webpage hero section vs card: website feature card)
  let requestedSize = null;
  if (/\b(hero|hero\s*section|webpage\s*hero|panoramic|16:9|banner|wide\s*stage|landing\s*page|header)\b/i.test(corpus)) {
    requestedSize = 'hero';
  } else if (/\b(card|feature\s*card|website\s*card|component\s*card|diorama|4:3)\b/i.test(corpus)) {
    requestedSize = 'card';
  }

  // 5. Build Prohibited Objects Guard
  // (Prevents unrequested rogue trees, walls, dustbins, or cats from dominating the scene)
  const prohibitedObjects = [];
  if (!/\b(trash|trashcan|dustbin|bin)\b/i.test(corpus)) prohibitedObjects.push('dustbin', 'trashcan');
  if (!/\b(tree|trees|pines|woods)\b/i.test(corpus)) prohibitedObjects.push('tree', 'trees');
  if (!/\b(cat|kitten)\b/i.test(corpus)) prohibitedObjects.push('cat');
  if (isIndoor && !/\b(wall)\b/i.test(corpus)) prohibitedObjects.push('outdoor wall');

  return {
    rawPrompt: fullText,
    corePrompt: coreText,
    primarySubject,
    category,
    subjectType: isHumanoid ? 'humanoid' : (isVehicle ? 'vehicle' : (isWater ? 'nature' : (isAbstractVoid ? 'abstract' : 'general'))),
    secondaryObjects,
    actions,
    environment,
    requestedSize,
    isIndoor,
    isWater,
    isAbstractVoid,
    prohibitedObjects,
  };
}

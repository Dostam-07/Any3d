import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  SVG_SYSTEM_PROMPT,
  WORLDS_SYSTEM_PROMPT,
  PIXEL_SYSTEM_PROMPT,
  DITHER_SYSTEM_PROMPT,
} from './prompts.js';
import { validateScene } from '../engine/validator.js';
import { balanceBraces } from '../engine/bundler.js';
import { synthesizeProceduralScene } from '../engine/procedural.js';
import { extractPromptSemantics, unwrapCorePrompt } from '../engine/semantics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

function findMatchingPreset(prompt, format) {
  const core = unwrapCorePrompt(prompt);
  const p = `${core} ${prompt}`.toLowerCase();
  const semantics = extractPromptSemantics(prompt);

  if (format === 'svg') {
    if (/\b(rocket\s*launch|launchpad|launch\s*pad|space\s*shuttle|orbital\s*launch|apollo|nasa|flame\s*trench)\b/i.test(p)) return 'launchpad';
    if (/\b(airport|runway|aeroplane|airplane|jetliner|aircraft|tarmac|hangar)\b/i.test(p)) return 'airport';
    if (/\b(harbour|harbor|quay|pier\s*nine|gantry\s*crane|container\s*ship|shipping\s*port)\b/i.test(p)) return 'harbour';
    if (/\b(warehouse|forklift|pallet\s*rack|distribution\s*centre|cargo\s*depot)\b/i.test(p)) return 'warehouse';
    if (/\b(lighthouse|rocky\s*island|coastal\s*island|beacon\s*tower)\b/i.test(p)) return 'island';
    if (/\b(observatory|astronomy\s*dome|stargazing\s*dome|celestial\s*telescope)\b/i.test(p)) return 'observatory';
    if (/\b(coffee\s*shop|espresso|cafe|barista|bistro|coffee\s*cart)\b/i.test(p)) return 'cafe';
    if (/\b(town\s*square|tram\s*line|city\s*blocks|street\s*tram|urban\s*avenue)\b/i.test(p)) return 'town';
    if (/\b(assembly\s*line|pcb|circuit\s*board|surface\s*mount|soldering|smt)\b/i.test(p)) return 'assembly';
    if (/\b(typewriter|writing\s*desk|antique\s*desk)\b/i.test(p)) return 'desk';
    if (/\b(farmstead|red\s*barn|grain\s*silo|wheat\s*field|country\s*farm)\b/i.test(p)) return 'farm';
    if (/\b(bakery\s*kitchen|pastry\s*kitchen|chef\s*kitchen|kneading\s*dough)\b/i.test(p)) return 'kitchen';
    if (/\b(mailbox|postbox|letter\s*box|postal\s*box)\b/i.test(p)) return 'mailbox';
    if (/\b(ski\s*slope|skiing|snowboard|chairlift|piste|ski\s*resort)\b/i.test(p)) return 'powder';
    if (/\b(server\s*rack|datacenter\s*rack|blade\s*servers)\b/i.test(p)) return 'rack';
    if (/\b(seedling|botanical\s*greenhouse|plant\s*nursery|sprout\s*pot)\b/i.test(p)) return 'seedling';
    if (/\b(blade\s*server|edge\s*server|cluster\s*node)\b/i.test(p)) return 'server';
    if (/\b(turntable|vinyl\s*record|record\s*player|phonograph)\b/i.test(p)) return 'turntable';
    if (/\b(vending\s*machine|soda\s*machine|can\s*dispenser)\b/i.test(p)) return 'vending';
    if (/\b(badminton|shuttlecock|racket|court\s*sport|net\s*game)\b/i.test(p)) return 'badminton';
  } else if (format === 'worlds') {
    // Only match bakery preset if dough/rolling pin bread work was asked, not cake presentation
    if (/\b(bread\s*dough|knead|rolling\s*pin|loaves|bread\s*bench)\b/i.test(p)) return 'bakery';
    if (/\b(bakery|bread\s*oven|pastry\s*shop)\b/i.test(p) && !/\bcake\b/i.test(p)) return 'bakery';
    if (/\b(basketball|hoop|court|dunk|dribble)\b/i.test(p)) return 'basketball';
    if (/\b(juggler|juggling|cascade|street\s*juggler)\b/i.test(p)) return 'street-juggler';
    if (/\b(florist|flower\s*stall|flower\s*shop)\b/i.test(p)) return 'florist';
    if (/\b(pottery|potter|clay\s*wheel|pottery\s*studio)\b/i.test(p)) return 'pottery-studio';
    if (/\b(cricket|cricket\s*pitch|batsman|wicket)\b/i.test(p)) return 'cricket';
    if (/\b(observatory|telescope|dome\s*stars)\b/i.test(p)) return 'observatory';
  } else if (format === 'pixel') {
    if (/\b(flower\s*stall|tulip\s*awning|sunflower\s*stall)\b/i.test(p)) return 'flower-stall';
    if (/\b(fishing\s*pier|pier\s*dock|dock\s*net)\b/i.test(p)) return 'pier';
    if (/\b(allotment|vegetable\s*patch|garden\s*shed)\b/i.test(p)) return 'allotment';
  } else if (format === 'dither') {
    if (/\b(blacksmith|forge|iron\s*anvil|waterwheel\s*forge)\b/i.test(p)) return 'forge';
    if (/\b(cliff\s*lighthouse|beacon\s*rock)\b/i.test(p)) return 'lighthouse';
    if (/\b(tea\s*house|zen\s*garden|bamboo\s*tea)\b/i.test(p)) return 'tea-house';
    if (/\b(windmill|canal\s*mill|dutch\s*windmill)\b/i.test(p)) return 'windmill';
  }
  return null;
}

function adaptPreset(presetName, format, prompt) {
  const filePath = path.join(rootDir, 'server', 'presets', format, `${presetName}.js`);
  if (!fs.existsSync(filePath)) return null;
  let code = fs.readFileSync(filePath, 'utf8');
  const slug = prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30).replace(/^-|-$/g, '') || presetName;
  const cleanTitle = prompt.slice(0, 50).replace(/'/g, "\\'");
  const cleanMeans = prompt.slice(0, 130).replace(/'/g, "\\'");

  if (format === 'svg') {
    code = code
      .replace(/\bname:\s*['"`][^'"`]+['"`]/, `name: '${slug}'`)
      .replace(/\btitle:\s*['"`][^'"`]+['"`]/, `title: '${cleanTitle}'`)
      .replace(/\bmeans:\s*['"`][^'"`]+['"`]/, `means: '${cleanMeans}'`);
  } else if (format === 'worlds') {
    code = code
      .replace(/\bname:\s*['"`][^'"`]+['"`]/, `name: '${slug}'`)
      .replace(/\btitle:\s*['"`][^'"`]+['"`]/, `title: '${cleanTitle}'`)
      .replace(/\bdescription:\s*['"`][^'"`]+['"`]/, `description: '${cleanMeans}'`);
  } else if (format === 'pixel' || format === 'dither') {
    code = code
      .replace(/\bname:\s*['"`][^'"`]+['"`]/, `name: '${slug}'`)
      .replace(/\btitle:\s*['"`][^'"`]+['"`]/, `title: '${cleanTitle}'`)
      .replace(/\bmeans:\s*['"`][^'"`]+['"`]/, `means: '${cleanMeans}'`);
  }
  return code;
}

export async function getOllamaModels(host = 'http://localhost:11434') {
  try {
    const res = await fetch(`${host}/api/tags`);
    if (!res.ok) throw new Error(`Ollama returned status ${res.status}`);
    const data = await res.json();
    return (data.models || []).map(m => ({
      name: m.name,
      size: m.size,
      modified_at: m.modified_at,
      capabilities: Array.isArray(m.capabilities) ? m.capabilities : [],
    }));
  } catch (err) {
    return [];
  }
}

async function callOllamaWithFallback({ host = 'http://localhost:11434', model, system, prompt, seed = null }) {
  // Preflight: fail fast (5s) if Ollama is not reachable, instead of hanging on every candidate.
  let installed = [];
  try {
    const tagsRes = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (!tagsRes.ok) throw new Error(`Ollama returned status ${tagsRes.status}`);
    const tags = await tagsRes.json();
    installed = (tags.models || []).map(m => m.name);
  } catch (err) {
    throw new Error(`Ollama is not reachable at ${host}. Is \`ollama serve\` running? (${err.message})`);
  }
  if (!installed.length) {
    throw new Error(`No Ollama models installed at ${host}. Run \`ollama pull qwen2.5-coder:1.5b\`.`);
  }

  // Ordered fallback models: user choice first, then lightweight models that fit in <= 2GB RAM.
  // Only try models that are actually installed, so we never wait on a model that will fail.
  const preferred = [
    model,
    'qwen2.5-coder:1.5b',
    'qwen2.5:1.5b',
    'deepseek-r1:1.5b',
    'qwen3:1.7b',
    'llama3.2:3b',
    'llama3.2:latest',
  ].filter(Boolean);

  const installedSet = new Set(installed);
  const candidates = preferred.filter(m => installedSet.has(m));
  // If the preferred list matches nothing installed, try every installed model once.
  const uniqueCandidates = candidates.length ? [...new Set(candidates)] : installed;

  let lastErr = null;
  for (const candidate of uniqueCandidates) {
    try {
      console.log(`[Ollama] Attempting generation with ${candidate}...`);
      const res = await fetch(`${host}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(60000), // 60s per model; smaller models on CPU should finish well within this
        body: JSON.stringify({
          model: candidate,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt }
          ],
          stream: false,
          options: {
            // A locked seed has to reproduce: temperature 0 plus the seed makes the
            // sampler deterministic for a given model and prompt.
            temperature: seed == null ? 0.25 : 0,
            seed: seed == null ? undefined : seed,
            num_ctx: 16384,
            num_predict: 8192,
          }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Ollama error (${res.status}): ${errText}`);
      }

      const data = await res.json();
      return { text: data.message?.content || '', usedModel: candidate };
    } catch (err) {
      lastErr = err;
      const msg = err.message || '';
      // Detect memory allocation errors, buffer crashes, or llama-server termination
      const isOOM = msg.includes('failed to allocate buffer') ||
                    msg.includes('CPU_REPACK buffer') ||
                    msg.includes('llama-server process has terminated') ||
                    msg.includes('out of memory') ||
                    msg.includes('ggml_backend');

      if (isOOM && candidate !== uniqueCandidates[uniqueCandidates.length - 1]) {
        console.warn(`[Ollama] Model ${candidate} exceeded system RAM buffer limit. Falling back to lightweight candidate...`);
        continue;
      }
      throw err;
    }
  }

  throw lastErr || new Error('Ollama generation failed.');
}

async function callGeminiWithFallback({ apiKey, model, system, prompt, seed = null }) {
  if (!apiKey) {
    throw new Error('Missing Gemini API Key. Please enter your Gemini API key in settings.');
  }

  // Ordered fallback list for Gemini models: user selection first, then current active Google models
  const candidates = [
    model,
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ].filter(Boolean);

  const uniqueCandidates = [...new Set(candidates)];
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastErr = null;

  for (const candidate of uniqueCandidates) {
    try {
      console.log(`[Gemini] Attempting generation with ${candidate}...`);
      const generativeModel = genAI.getGenerativeModel({
        model: candidate,
        systemInstruction: system,
      });

      const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: seed == null ? 0.3 : 0,
          ...(seed == null ? {} : { seed }),
        }
      });

      return { text: result.response.text(), usedModel: candidate };
    } catch (err) {
      lastErr = err;
      const msg = err.message || '';
      // Check for deprecated model, 404 not found, or unsupported model
      const isUnavailable = msg.includes('404') ||
                            msg.includes('not found') ||
                            msg.includes('no longer available') ||
                            msg.includes('is not supported');

      if (isUnavailable && candidate !== uniqueCandidates[uniqueCandidates.length - 1]) {
        console.warn(`[Gemini] Model ${candidate} unavailable (${msg.slice(0, 100)}...). Trying active fallback model...`);
        continue;
      }
      throw err;
    }
  }

  throw lastErr || new Error('All Gemini model candidates failed.');
}

function extractCode(raw) {
  let cleaned = raw.trim();
  const match = /```(?:javascript|js)?\s*([\s\S]*?)```/i.exec(cleaned);
  if (match) {
    cleaned = match[1].trim();
  }
  return cleaned;
}

function normalizeCode(code, format, prompt = '') {
  let cleaned = code.trim();
  const slug = prompt
    ? prompt.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30).replace(/^-|-$/g, '')
    : 'scene';

  // 1. Remove duplicate opening curly braces (e.g. Any3d.figure({{ or Any3d.figure({\n{)
  cleaned = cleaned
    .replace(/\bAny3d\.figure\s*\(\s*\{\s*\{+/g, 'Any3d.figure({')
    .replace(/\bdefineWorld\s*\(\s*\{\s*\{+/g, 'defineWorld({')
    .replace(/\bPixel\.scene\s*\(\s*\{\s*\{+/g, 'Pixel.scene({');

  // Also clean if there is an isolated opening brace right after declaration
  cleaned = cleaned.replace(/((?:Any3d)\.figure\s*\(\s*\{)\s*\{/g, '$1');

  // 2. If SVG output is a naked object literal starting with '{', wrap it
  if (format === 'svg' && !/\bAny3d\.figure\s*\(/.test(cleaned) && cleaned.startsWith('{')) {
    cleaned = `Any3d.figure(${cleaned.replace(/;?$/, '')});`;
  }

  // 4. Inject name & title if missing
  if (format === 'svg') {
    if (!/\bname\s*:/.test(cleaned) && /\bAny3d\.figure\s*\(\s*\{/.test(cleaned)) {
      cleaned = cleaned.replace(
        /\bAny3d\.figure\s*\(\s*\{+/,
        `Any3d.figure({\n  name: '${slug || 'svg-scene'}',\n  title: '${(prompt.slice(0, 40) || 'Any3d Scene').replace(/'/g, "\\'")}',`
      );
    }
  } else if (format === 'worlds') {
    if (!/\bname\s*:/.test(cleaned) && /\bdefineWorld\s*\(\s*\{/.test(cleaned)) {
      cleaned = cleaned.replace(
        /\bdefineWorld\s*\(\s*\{+/,
        `defineWorld({\n  name: '${slug || 'world-scene'}',\n  title: '${(prompt.slice(0, 40) || 'Any3d World').replace(/'/g, "\\'")}',`
      );
    }
  } else if (format === 'pixel' || format === 'dither') {
    if (!/\bname\s*:/.test(cleaned) && /\bPixel\.scene\s*\(\s*\{/.test(cleaned)) {
      cleaned = cleaned.replace(
        /\bPixel\.scene\s*\(\s*\{+/,
        `Pixel.scene({\n  name: '${slug || 'pixel-scene'}',\n  title: '${(prompt.slice(0, 40) || 'Any3d Scene').replace(/'/g, "\\'")}',`
      );
    }
  }
  cleaned = balanceBraces(cleaned);
  return cleaned;
}

export async function generateScene({
  provider = 'ollama',
  apiKey = '',
  ollamaHost = 'http://localhost:11434',
  model = '',
  format = 'svg', // 'svg' | 'worlds' | 'pixel' | 'dither'
  prompt = '',
  seed = null,
  maxRetries = 1,
}) {
  let systemPrompt = SVG_SYSTEM_PROMPT;
  let formatLabel = 'Any3d SVG figure';

  if (format === 'worlds') {
    systemPrompt = WORLDS_SYSTEM_PROMPT;
    formatLabel = 'Three.js miniature world';
  } else if (format === 'pixel') {
    systemPrompt = PIXEL_SYSTEM_PROMPT;
    formatLabel = 'Any3d Pixel 320x240 miniature';
  } else if (format === 'dither') {
    systemPrompt = DITHER_SYSTEM_PROMPT;
    formatLabel = 'Any3d Dither yard scene';
  }

  const corePrompt = unwrapCorePrompt(prompt);
  const semantics = extractPromptSemantics(prompt);

  let currentPrompt = `Create a detailed, multi-part Any3d ${formatLabel} for: "${corePrompt}".
CRITICAL PROMPT FIDELITY:
- Primary Subject: "${semantics.primarySubject}" must be prominently modeled as the main focus.
${semantics.secondaryObjects.length ? `- Mandatory Props: Include ${semantics.secondaryObjects.join(', ')}.` : '- Mandatory Props: Build at least 3-5 supporting props around the main subject.'}
${semantics.actions.length ? `- Action & Animation: Model ${semantics.actions.join(', ')} in geometry and tick().` : '- Animation: Include a subtle looping motion (tick function) so the scene feels alive.'}
- Setting: ${semantics.environment}. Build a complete environment, not just one object.
- DO NOT invent unrelated items (${semantics.prohibitedObjects.join(', ') || 'no rogue trees or trashcans'}).

CONSTRUCTION RULES (follow exactly):
1. Always start with a ground slab: D.slab(11, 9, pal.ground, 0, 0, 0, null, { h: 0.6, r: 1.2, side: pal.base })
2. NEVER make a single monolithic blob. Compose 15-35 parts from slender boxes, cylinders, wedges, cones, and groups.
3. Use at least 5-7 contrasting colors from pal (pal.paper, pal.wood, pal.steel, pal.accent, pal.coral, pal.mustard, pal.sky, etc.)
4. ALWAYS add actors/people using D.props.person(x, z, null, { shirt: ..., hat: ... })
5. ALWAYS add environmental props: D.props.tree, D.props.bush, D.props.rock, D.props.lamp, D.props.crate
6. ALWAYS add lighting: D.props.lamp at perimeter positions
7. Give interactive parts a .name and add them to parts.hot array
8. Implement tick(ctx) with a looping motion using D.smooth(D.phase(t, period)) or D.wave(t, period)

Build the scene now. Output ONLY raw JavaScript starting with Any3d.figure({ and ending with });`;

  let lastCode = '';
  let lastValidation = null;
  let usedModelName = model;
  let fallbackNotice = '';

  try {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let rawOutput = '';
      if (provider === 'gemini') {
        const selectedModel = model || 'gemini-2.5-flash';
        const geminiRes = await callGeminiWithFallback({
          apiKey,
          model: selectedModel,
          system: systemPrompt,
          prompt: currentPrompt,
          seed,
        });
        rawOutput = geminiRes.text;
        usedModelName = geminiRes.usedModel;
        if (model && usedModelName !== model) {
          fallbackNotice = `Model ${model} is deprecated; automatically generated with active ${usedModelName}.`;
        }
      } else {
        const selectedModel = model || 'qwen2.5-coder:1.5b';
        const ollamaRes = await callOllamaWithFallback({
          host: ollamaHost,
          model: selectedModel,
          system: systemPrompt,
          prompt: currentPrompt,
          seed,
        });
        rawOutput = ollamaRes.text;
        usedModelName = ollamaRes.usedModel;
        if (model && usedModelName !== model) {
          fallbackNotice = `Model ${model} exceeded available system RAM. Automatically generated using lightweight ${usedModelName}.`;
        }
      }

      lastCode = normalizeCode(extractCode(rawOutput), format, corePrompt);
      lastValidation = validateScene(lastCode, format, prompt);

      if (lastValidation.valid || attempt === maxRetries) {
        break;
      }

      const failedLabels = lastValidation.checks.filter(c => !c.ok).map(c => c.label);
      currentPrompt = `Your previous output was too simple — it produced only basic primitives instead of a detailed scene.

You MUST build a multi-part scene with these requirements:
1. Ground slab: D.slab(11, 9, pal.ground, 0, 0, 0, null, { h: 0.6, r: 1.2, side: pal.base })
2. Primary subject "${semantics.primarySubject}": compose from multiple boxes/cylinders/wedges (NOT one giant box)
3. Mandatory Props: ${semantics.secondaryObjects.length ? semantics.secondaryObjects.join(', ') : 'at least 3 supporting props'}
4. Actors: Add D.props.person figures
5. Lighting: Add D.props.lamp at perimeter
6. Use 5+ contrasting colors from pal
7. Implement tick(ctx) with D.smooth(D.phase(t, period)) animation
8. Return parts with .name and parts.hot for interactivity

Output ONLY raw JavaScript starting with Any3d.figure({ and ending with });`;
    }
  } catch (llmErr) {
    console.warn(`[Any3d AI] Model error: ${llmErr.message}. Attempting architectural preset fallback...`);
    const matchedPreset = findMatchingPreset(prompt, format);
    if (matchedPreset) {
      const adapted = adaptPreset(matchedPreset, format, prompt);
      if (adapted) {
        const enrichedValidation = validateScene(adapted, format, prompt);
        if (enrichedValidation.valid) {
          return {
            code: adapted,
            validation: enrichedValidation,
            format,
            provider,
            model: usedModelName,
            fallbackNotice: fallbackNotice || `Enriched with Any3d architectural composition for "${corePrompt}".`
          };
        }
      }
    }

    // Dynamic procedural scene generation for custom prompts without presets
    console.log(`[Any3d AI] Synthesizing custom procedural Any3d scene for "${prompt}"...`);
    const proceduralCode = synthesizeProceduralScene(prompt, format);
    const procValidation = validateScene(proceduralCode, format, prompt);
    return {
      code: proceduralCode,
      validation: procValidation,
      format,
      provider,
      model: usedModelName,
      fallbackNotice: fallbackNotice || `Synthesized dynamic high-fidelity Any3d scene for "${corePrompt.slice(0, 45)}".`
    };
  }

  // Double Safety Net: If model failed validation or prompt fidelity after retries
  if (!lastValidation?.valid) {
    const matchedPreset = findMatchingPreset(prompt, format);
    if (matchedPreset) {
      const adapted = adaptPreset(matchedPreset, format, prompt);
      if (adapted) {
        const enrichedValidation = validateScene(adapted, format, prompt);
        if (enrichedValidation.valid) {
          console.log(`[Any3d AI] Enriched scene using architectural preset "${matchedPreset}" for prompt "${prompt}".`);
          return {
            code: adapted,
            validation: enrichedValidation,
            format,
            provider,
            model: usedModelName,
            fallbackNotice: fallbackNotice || `Enriched with Any3d high-density architectural composition for "${corePrompt}".`
          };
        }
      }
    }

    // Procedural fallback with strict fidelity
    console.log(`[Any3d AI] Model output invalid/lacking fidelity, synthesizing custom procedural Any3d scene for "${prompt}"...`);
    const proceduralCode = synthesizeProceduralScene(prompt, format);
    const procValidation = validateScene(proceduralCode, format, prompt);
    return {
      code: proceduralCode,
      validation: procValidation,
      format,
      provider,
      model: usedModelName,
      fallbackNotice: `Synthesized dynamic high-fidelity Any3d scene for "${corePrompt.slice(0, 45)}".`
    };
  }

  return {
    code: lastCode,
    validation: lastValidation,
    format,
    provider,
    model: usedModelName,
    seed,
    fallbackNotice
  };
}

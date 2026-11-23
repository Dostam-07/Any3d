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
        // Local 7B code models need well over 90s for a full world on a CPU-only
        // machine; the old 90s cap made every real generation time out and land on
        // the procedural fallback. Override with OLLAMA_TIMEOUT_MS when needed.
        signal: AbortSignal.timeout(Number(process.env.OLLAMA_TIMEOUT_MS) || 240000),
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
            num_ctx: 4096,
            num_predict: 2048,
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
  size = 'card', // 'hero' | 'card' | 'mini'
  prompt = '',
  seed = null,
  maxRetries = 1,
  visualResearch = null,
  visualReferences = [], // client-selected web image search results
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

  let constructionRules = '';
  if (format === 'worlds') {
    constructionRules = `CONSTRUCTION RULES FOR THREE.JS WORLDS (follow exactly):
1. Start with an expansive terrain foundation: W.terrain(11.0, 8.5, '#1e293b', 24); box(10.5, 0.08, 8.0, '#334155', 0, 0.04, 0);
2. EXPANSIVE ENVIRONMENT: Build a rich, complete miniature world with 25-50 modular parts across multiple zones (NEVER generate a single lone chair/table or tiny chunk).
3. If an office: compose multiple workstations/desks, dual monitors, partitions, whiteboard meeting zone, water cooler, lounge chairs, and bookshelves.
4. If a city: compose multiple skyscrapers/buildings with lit windows, avenue with crosswalks, streetlights, traffic signals, and driving cars.
5. If a farm: compose red timber barn, silo, spinning windpump, crop rows, tractor, hay bales, and fenced animal paddocks.
6. Use W.box, W.cylinder, W.ball, W.person, W.group with rich contrasting materials.
7. Implement tick({ t, parts, W }) with synchronized looping animation (spinning wheels/fans, moving vehicles, swiveling chairs).
8. Output ONLY raw JavaScript starting with "import { defineWorld } from '@any3d/worlds';" and ending with "});".`;
  } else if (format === 'pixel') {
    constructionRules = `CONSTRUCTION RULES FOR PIXEL 320x240 (follow exactly):
1. Start with ground: { rx: 4.0, rz: 3.0, wobble: 0.25, fade: 0.35, rect: true, zone: function(x, z, P) { ... } }
2. Use rich, colorful custom ramps in materials (tileLight, tileAccent, deskTeal, chairRed, screenGlow, gold, cyan, blue, ruby).
3. Build complete environments with 20-40 parts (e.g. multi-desk office, street corner with storefronts, full farmstead).
4. Implement tick(ctx) with looping animation.
5. Output ONLY raw JavaScript starting with "Pixel.scene({" and ending with "});".`;
  } else if (format === 'dither') {
    constructionRules = `CONSTRUCTION RULES FOR DITHER (follow exactly):
1. Declare Dither.scene({ ... }).
2. Build 20-35 parts with rich retro Bayer dithering and textures.
3. Output ONLY raw JavaScript starting with "Dither.scene({" and ending with "});".`;
  } else {
    constructionRules = `CONSTRUCTION RULES (follow exactly):
1. Always start with a ground slab: D.slab(11, 9, pal.ground, 0, 0, 0, null, { h: 0.6, r: 1.2, side: pal.base })
2. NEVER make a single monolithic blob. Compose 15-35 parts from slender boxes, cylinders, wedges, cones, and groups.
3. Use at least 5-7 contrasting colors from pal (pal.paper, pal.wood, pal.steel, pal.accent, pal.coral, pal.mustard, pal.sky, etc.)
4. ALWAYS add actors/people using D.props.person(x, z, null, { shirt: ..., hat: ... })
5. ALWAYS add environmental props: D.props.tree, D.props.bush, D.props.rock, D.props.lamp, D.props.crate
6. ALWAYS add lighting: D.props.lamp at perimeter positions
7. Give interactive parts a .name and add them to parts.hot array
8. Implement tick(ctx) with a looping motion using D.smooth(D.phase(t, period)) or D.wave(t, period)
9. Output ONLY raw JavaScript starting with "Any3d.figure({" and ending with "});".`;
  }

  let visualSection = '';
  if (visualResearch?.references?.length) {
    const compStr = visualResearch.decomposition?.components?.join(', ') || '';
    const palStr = visualResearch.decomposition?.palette?.join(', ') || '';
    const layoutStr = visualResearch.decomposition?.spatialLayout?.join(' | ') || '';
    visualSection = `
REAL-WORLD WEB VISUAL REFERENCES (Analyzed from ${visualResearch.references.length} web photos):
- Authentic Components to Replicate: ${compStr}
- Dominant Real-World Palette: ${palStr}
- Spatial Architecture: ${layoutStr}
REPLICATE these authentic real-world physical parts and color relationships in the 3D scene!`;
  }

  if (visualReferences && visualReferences.length) {
    const refList = visualReferences.map((r) => `- ${r.title || 'Untitled image'} (${r.url})`).join('\n');
    visualSection += `

CLIENT-SELECTED WEB IMAGES (Use these as direct visual references - match composition, colors, and style):
${refList}
REPLICATE the look, materials, color palette, and arrangement from these reference images in your 3D scene.`;
  }

  let currentPrompt = `Create a detailed, multi-part Any3d ${formatLabel} for: "${corePrompt}".
CRITICAL PROMPT FIDELITY:
- Primary Subject: "${semantics.primarySubject}" must be prominently modeled as the main focus.
${semantics.secondaryObjects.length ? `- Mandatory Props: Include ${semantics.secondaryObjects.join(', ')}.` : '- Mandatory Props: Build at least 5-10 supporting environmental props around the main subject.'}
${semantics.actions.length ? `- Action & Animation: Model ${semantics.actions.join(', ')} in geometry and tick().` : '- Animation: Include a subtle looping motion (tick function) so the scene feels alive.'}
- Setting: ${semantics.environment}. Build a complete environment, not just one object.
- DO NOT invent unrelated items (${semantics.prohibitedObjects.join(', ') || 'no rogue trees or trashcans'}).
${visualSection}

${constructionRules}`;

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
      currentPrompt = format === 'worlds'
        ? `Your previous output was rejected: ${failedLabels.join(', ')}.

Fix the API and the scene, then return ONLY a worlds scene:
1. import { defineWorld } from '@any3d/worlds'; — the ONLY allowed import. Never use D.*, pal.*, Any3d.figure, Pixel.scene or Dither.scene.
2. export default defineWorld({ name, title, duration, still, bounds, build(W) { ... }, tick({ t, parts, W }) { ... } });
3. build(W) starts with W.terrain(...) and a ground slab, then 25-50 modular parts using W.box / W.cylinder / W.ball / W.group.
4. Primary subject "${semantics.primarySubject}" must be modelled as the focus, with ${semantics.secondaryObjects.length ? semantics.secondaryObjects.join(', ') : 'at least 5 supporting props'} around it.
5. Animate something in tick({ t }) so the scene is alive.

Output ONLY raw JavaScript starting with "import { defineWorld } from '@any3d/worlds';" and ending with "});".`
        : `Your previous output was too simple — it produced only basic primitives instead of a detailed scene.

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
    console.warn(`[Any3d AI] Model error: ${llmErr.message}. Synthesizing custom procedural Any3d scene for "${prompt}"...`);
    const proceduralCode = synthesizeProceduralScene(prompt, format, visualResearch, size);
    const procValidation = validateScene(proceduralCode, format, prompt);
    return {
      code: proceduralCode,
      validation: procValidation,
      format,
      provider,
      model: usedModelName,
      fallbackNotice: `Synthesized dynamic procedural Any3d scene for "${corePrompt.slice(0, 45)}" (AI engine unavailable/timed out).`,
    };
  }

  // Safety Net: If model output failed validation after retries
  if (!lastValidation?.valid) {
    console.log(`[Any3d AI] Model output invalid/lacking fidelity, synthesizing custom procedural Any3d scene for "${prompt}"...`);
    const proceduralCode = synthesizeProceduralScene(prompt, format, null, size);
    const procValidation = validateScene(proceduralCode, format, prompt);
    return {
      code: proceduralCode,
      validation: procValidation,
      format,
      provider,
      model: usedModelName,
      fallbackNotice: `Synthesized dynamic procedural Any3d scene for "${corePrompt.slice(0, 45)}".`,
    };
  }

  return {
    code: lastCode,
    validation: lastValidation,
    format,
    provider,
    model: usedModelName,
    seed,
    fallbackNotice,
  };
}

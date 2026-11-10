import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractPromptSemantics, unwrapCorePrompt } from '../engine/semantics.js';

export const ENHANCER_SYSTEM_PROMPT = `You are Any3d's Precision Prompt Architect.
Your task is to take the user's 3D scene concept and enhance it into 1 or 2 vivid, highly descriptive sentences for procedural isometric 3D generation.

CRITICAL RULES:
1. THE USER'S PROMPT IS THE ABSOLUTE CENTER AND SINGLE SOURCE OF TRUTH:
   - Every subject, character, vehicle, prop, and action mentioned in the user's prompt MUST be explicitly included in the enhanced description.
   - NEVER replace, omit, or subordinate the user's requested subject or props.
   - NEVER introduce unrequested generic elements (such as outdoor trees, park benches, brick walls, dustbins, or stray animals) unless the user explicitly requested them.
2. ENHANCE WITH SPECIFIC VISUAL & MATERIAL FIDELITY:
   - Describe the exact physical appearance, materials, textures, and colors of the user's subjects and props.
   - Describe the environment that directly suits the user's subject (e.g. indoor kitchen floor for baking, asphalt track for racing, clear water for marine, minimalist pedestal for sculptures).
   - Describe directional rim lighting and surface highlights.
   - Explicitly specify a synchronized continuous motion loop in tick() matching the requested action.
3. ABSOLUTE FORBIDDEN PATTERNS:
   - NEVER wrap the prompt in meta-commentary like "A charming isometric vignette... bringing to life '...' featuring storytelling micro-props".
   - NEVER output conversational text (no "Sure", no "Here is", no quotes).
   - Output ONLY the raw enhanced scene description.`;

/**
 * Robustly strips conversational preambles, markdown, and assistant intros.
 */
export function cleanAIOutput(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let s = rawText.trim();

  // Strip markdown code fences if present
  s = s.replace(/^```(?:markdown|text|json)?\s*/i, '').replace(/\s*```$/i, '');
  s = s.replace(/^["'`]([\s\S]+)["'`]$/, '$1').trim();

  // Strip conversational preambles
  s = s.replace(/^(?:Sure(?: thing|!|,)?\s*|Certainly(?:!|,)?\s*|Okay(?:!|,)?\s*|Here(?:'s| is)[^:\n]*:?\s*|Below is[^:\n]*:?\s*|As requested[^:\n]*:?\s*|I have enhanced[^:\n]*:?\s*|Enhanced prompt:?\s*)+/i, '');
  s = s.replace(/^(?:(?:Enhanced|Isometric|3D)\s*(?:Prompt|Description|Scene):\s*)+/i, '');

  // If multi-line and first line is brief preamble, remove it
  const lines = s.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    if (/^(here\b|sure\b|enhanced\b|certainly\b|okay\b)/i.test(lines[0]) && lines[0].length < 60) {
      lines.shift();
      s = lines.join(' ');
    }
  }

  return s.trim().replace(/^["'`]|["'`]$/g, '').trim();
}

/**
 * Validates that enhanced text is clean and faithfully reflects the user's intent.
 */
export function isCleanEnhancedPrompt(originalPrompt, generatedText) {
  if (!generatedText || typeof generatedText !== 'string') return false;
  const trimmed = generatedText.trim();
  if (trimmed.length < 25) return false;

  const lower = trimmed.toLowerCase();
  // Strictly reject conversational remnants or boilerplate meta-wrapping
  if (
    /^(sure|here|certainly|okay|ok|alright|below|as an ai|i have enhanced)/i.test(lower) ||
    lower.includes('here is the enhanced') ||
    lower.includes("here's the enhanced") ||
    lower.includes('here is an enhanced') ||
    lower.includes('sure, here') ||
    lower.includes('bringing to life')
  ) {
    return false;
  }

  // Ensure substantive words from original prompt are preserved
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'with', 'for', 'this', 'that', 'his', 'her', 'its',
    'from', 'into', 'scene', 'isometric', 'make', 'create', 'view', 'here', 'sure', 'onto', 'out', 'of'
  ]);
  const originalTokens = originalPrompt
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3 && !stopWords.has(t));

  if (originalTokens.length === 0) return true;

  const matchCount = originalTokens.filter(t => lower.includes(t)).length;
  // At least 40% of key tokens must appear in the enhancement
  return matchCount >= Math.max(1, Math.floor(originalTokens.length * 0.4));
}

/**
 * Universal Semantic Prompt Enhancer (Dynamic & Thematically Faithful).
 * Builds a rich Any3d isometric description around the user's ACTUAL subject and props,
 * without ever substituting unrelated themes or inventing rogue elements.
 */
export function expandPromptSemantically(prompt) {
  const p = unwrapCorePrompt(prompt || '');
  if (!p) {
    return 'A detailed isometric scene featuring layered modular architecture, contrasting material textures, directional rim lighting, and a synchronized continuous motion loop in tick().';
  }

  const semantics = extractPromptSemantics(p);
  const core = semantics.corePrompt || p;
  const cleanCore = core.replace(/[.]+$/, '').trim();
  const lower = cleanCore.toLowerCase();

  // If already highly detailed and long (>= 15 words) and contains isometric specs, preserve as-is with tick loop
  if (cleanCore.split(/\s+/).length >= 15 && /\b(isometric|tick\(\)|lighting|textures)\b/i.test(cleanCore)) {
    return cleanCore;
  }

  // Formula 1 / open-wheel racing detection: only when the prompt really asks for it.
  // (Never hijack a plain "car", "cart", "taxi", or "sedan" into an F1 scene.)
  const isOpenWheel = /\b(f1|formula\s*(?:1|one)|open\s*wheel|grand\s*prix|gp\s*(?:car|race|cars)|single[- ]?seater|indy\s*car|halo\s*cockpit|racecar)\b/i.test(lower);

  // Universal pass-through: if the prompt is already the user's own end-to-end
  // description (cart, taxi, diner, bakery cart, etc.), never swap in a canned
  // preset scene. Only add the isometric + motion-loop scaffolding.
  const isDomainPreset = /\b(baker|bakery|bake|cake|pastry|oven|blacksmith|forge|anvil|wizard|mage|submarine|waterfall|cascade|sculpture|geometric|rings|aeroplane|airplane|plane|jet)\b/i.test(lower);
  if (!isDomainPreset && !isOpenWheel) {
    const spokenCore = cleanCore.replace(/^(?:a|an|the)\s+/i, (m) => m.toLowerCase());
    const propsPhrase = semantics.secondaryObjects
      .filter((o) => !lower.includes(o.toLowerCase()))
      .length > 0
      ? ` with ${semantics.secondaryObjects.filter((o) => !lower.includes(o.toLowerCase())).join(' and ')}`
      : '';
    const motion = semantics.actions.length > 0
      ? `a synchronized ${semantics.actions[0]} motion loop`
      : 'a synchronized continuous motion loop';
    const lightingHint = semantics.isIndoor
      ? 'warm ambient indoor glow and directional rim lighting'
      : semantics.isWater
        ? 'specular water reflections and directional rim lighting'
        : 'directional rim lighting and tactile material contrast';
    return `A detailed isometric scene of ${spokenCore}${propsPhrase}, featuring ${lightingHint}, and ${motion} in tick().`;
  }

  // Domain-specific tailored expansions that preserve exact subjects & verbs
  if (/\b(baker|bakery|bake|cake|pastry|oven)\b/i.test(lower)) {
    return `An intricate isometric artisan bakery scene where a baker in an apron slides a freshly baked tiered cake out of a glowing stone brick oven and presents it on a wooden preparation table, featuring tactile culinary micro-props, warm directional rim lighting, and a synchronized continuous motion loop in tick().`;
  }

  if (/\b(aeroplane|airplane|plane|jet|aircraft)\b/i.test(lower) && /\b(runway|landing\s*gear|flying|fly)\b/i.test(lower)) {
    return `A detailed isometric aviation scene of a streamlined aeroplane flying above an asphalt tarmac runway with its landing gear retracting smoothly into the fuselage, featuring directional rim lighting, yellow runway markings, and a synchronized flight animation loop in tick().`;
  }

  if (isOpenWheel && /\b(car|race|racing|driver|cockpit|track|circuit|lap)\b/i.test(lower)) {
    const kerbs = /\b(kerb|kerbs|curb|curbs|rumble|circuit|track|grand\s*prix|pit\s*lane)\b/i.test(lower)
      ? ', red-and-white rumble kerbs lining the corner, safety tire barriers, and a pit-lane gantry'
      : '';
    return `A high-octane isometric scene of an open-wheel Formula 1 single-seater racing car with a multi-element front wing, halo cockpit protection, and wide slick tyres${kerbs}, featuring visible spinning wheel motion, glossy bodywork reflections, directional rim lighting, and a synchronized racing motion loop in tick().`;
  }

  // Generic road cars (sedan, taxi, pickup, sports car, drifting…) keep their own subject.
  if (/\b(car|cars|sedan|taxi|cab|pickup|suv|van|truck|bus|sports\s*car|supercar|roadster|coupe|hatchback|automobile|driving|parked|drifting|drift)\b/i.test(lower)) {
    const action = /\b(parked|parking|idling|stopped)\b/i.test(lower)
      ? 'resting on its tyres with a slow idle glow'
      : /\b(drift|drifting)\b/i.test(lower)
        ? 'drifting with visible tyre-slip motion'
        : 'rolling forward with spinning wheels';
    return `A detailed isometric scene centered on ${cleanCore.replace(/^(?:a|an|the)\s+/i, (m) => m.toLowerCase())}, ${action}, featuring glossy painted bodywork, chrome trim highlights, realistic wheel and headlight details, directional rim lighting, and a synchronized motion loop in tick().`;
  }

  if (/\b(waterfall|cascade)\b/i.test(lower) && /\b(pond|rocks|pool)\b/i.test(lower)) {
    return `A serene isometric nature scene of a crystalline waterfall cascading down stepped stone cliffs into a clear pond surrounded by natural mossy rocks, featuring flowing water shader effects, directional sunlight, and a continuous water ripple loop in tick().`;
  }

  if (/\b(sculpture|geometric|rings|abstract)\b/i.test(lower)) {
    return `A minimalist isometric art scene of a floating geometric sculpture composed of interconnected metallic rings, featuring reflective chrome and brushed bronze materials, specular rim highlights, and a synchronized multi-axis rotational loop in tick().`;
  }

  if (/\b(blacksmith|forge|anvil|sword)\b/i.test(lower)) {
    return `A detailed isometric workshop scene of a muscular blacksmith hammering a glowing heated sword on a heavy steel anvil, featuring glowing forge ember lighting, flying sparks, and a rhythmic hammer-striking motion loop in tick().`;
  }

  if (/\b(submarine|submersible|underwater)\b/i.test(lower)) {
    return `An atmospheric underwater isometric scene of a deep-sea submarine gliding past glowing bioluminescent coral reefs, with dual searchlight beams, translucent water effects, and a continuous propulsion motion loop in tick().`;
  }

  if (/\b(wizard|mage|spell|library)\b/i.test(lower)) {
    return `A magical isometric scene of an ornate wizard casting incantations within an ancient arched library, with glowing runes, levitating books, mystical rim lighting, and a continuous spellcasting pulse loop in tick().`;
  }

  // --- Dynamic Universal Expander for Any Arbitrary Prompt ---
  // Ensure the user's exact phrase is the grammatical center
  const subject = semantics.primarySubject || 'subject';
  // (Kept for readability of the fallback below; the core prompt is the source of truth.)
  const propsPhrase = semantics.secondaryObjects.length > 0
    ? `accompanied by detailed ${semantics.secondaryObjects.join(' and ')}`
    : 'with layered structural elements';

  let lighting = 'directional rim lighting and tactile material contrast';
  if (semantics.isIndoor) lighting = 'warm ambient indoor glow and directional rim lighting';
  else if (semantics.isWater) lighting = 'specular water refractions and directional rim lighting';

  return `A detailed modular isometric scene depicting ${cleanCore}, ${propsPhrase}, featuring ${lighting}, and a synchronized continuous motion loop in tick().`;
}

/**
 * Main AI Prompt Enhancer.
 * Uses configured AI model (Gemini or Ollama) with generous timeouts,
 * cleanly post-processes output to eliminate conversational chatter,
 * and falls back to our dynamic, prompt-centering expander if unavailable.
 */
export async function enhancePromptWithAI({
  prompt,
  format = 'svg',
  provider = 'gemini',
  apiKey = '',
  ollamaHost = 'http://localhost:11434',
  model = ''
}) {
  const cleanPrompt = (prompt || '').trim();
  if (!cleanPrompt) {
    return 'A detailed isometric scene with modular architecture, expressive moving elements, and rich contrasting color accents.';
  }

  // 1. If Gemini is requested and configured with apiKey
  if (provider === 'gemini' && apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({
        model: model || 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.25,
          maxOutputTokens: 180,
        }
      });

      const userReq = `User concept: "${cleanPrompt}". Target format: Any3d ${format}. Output ONLY 1-2 sentences of enhanced 3D isometric description. Keep exact subject and props at the center!`;
      const result = await Promise.race([
        geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: `${ENHANCER_SYSTEM_PROMPT}\n\n${userReq}` }] }]
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini timeout')), 15000))
      ]);

      const cleaned = cleanAIOutput(result.response.text());
      if (isCleanEnhancedPrompt(cleanPrompt, cleaned)) {
        return cleaned;
      }
    } catch (err) {
      console.warn('[Enhance Prompt] Gemini unavailable, falling back:', err.message);
    }
  }

  // 2. If Ollama is requested (Fast & Responsive with single model attempt, instant fallback)
  if (provider === 'ollama') {
    try {
      const targetModel = model || 'llama3.2:3b' || 'qwen2.5-coder:1.5b';
      const res = await Promise.race([
        fetch(`${ollamaHost}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: targetModel,
            messages: [
              { role: 'system', content: ENHANCER_SYSTEM_PROMPT },
              { role: 'user', content: `Enhance this concept: "${cleanPrompt}". Return ONLY the visual description:` }
            ],
            stream: false,
            options: {
              temperature: 0.25,
              num_predict: 90,
            }
          })
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Ollama timeout')), 14000))
      ]);

      if (res.ok) {
        const data = await res.json();
        const rawContent = data.message?.content || '';
        const cleaned = cleanAIOutput(rawContent);
        if (isCleanEnhancedPrompt(cleanPrompt, cleaned)) {
          return cleaned;
        }
      }
    } catch (err) {
      console.warn('[Enhance Prompt] Ollama timeout/error, using instant dynamic expander:', err.message);
    }
  }

  // 3. Dynamic Universal Expander (Instant, 100% faithful to user prompt)
  return expandPromptSemantically(cleanPrompt);
}

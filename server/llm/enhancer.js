import { GoogleGenerativeAI } from '@google/generative-ai';
import { extractPromptSemantics, unwrapCorePrompt } from '../engine/semantics.js';

const ENHANCER_SYSTEM_PROMPT = `You are a prompt engineering expert specializing in 3D procedural scenes.
Your task is to take a short, simple user prompt and expand it into a rich, detailed scene description that generates visually stunning 3D procedural scenes.

CRITICAL RULES:
- PRESERVE the user's core intent, subject, and any explicit details they mentioned. DO NOT change their subject.
- Keep the expansion concise (2-4 sentences max, 30-60 words).
- Add specific physical details: materials, colors, micro-props, lighting, and a looping animation motion.
- NEVER invent unrelated subjects (e.g. do not add a random cat, dustbin, or trees unless requested or contextually natural).
- Return ONLY the enhanced prompt string. No explanation, no quotes, no markdown.`;

export async function enhancePromptWithAI({
  prompt,
  format = 'svg',
  provider = 'gemini',
  apiKey = '',
  ollamaHost = 'http://localhost:11434',
  model = '',
}) {
  const trimmed = (prompt || '').trim();
  if (!trimmed) return trimmed;
  const cleanCore = unwrapCorePrompt(trimmed);

  // 1. Try Gemini if configured
  if (provider === 'gemini' && apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const generativeModel = genAI.getGenerativeModel({
        model: model || 'gemini-2.5-flash',
        systemInstruction: ENHANCER_SYSTEM_PROMPT,
      });

      const result = await generativeModel.generateContent({
        contents: [{
          role: 'user',
          parts: [{
            text: `Enhance this 3D scene prompt for the ${format.toUpperCase()} engine: "${cleanCore}"`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 200,
        }
      });

      const rawText = result.response.text().trim().replace(/^["'`]|["'`]$/g, '');
      const text = rawText.replace(/^(?:Enhance|Generate|Create)\s+(?:this\s+)?3D\s+scene\s+prompt[^:]*:\s*["'`]?/i, '').replace(/["'`]\s*$/, '').trim();
      if (text && text.length > cleanCore.length && !text.includes('Enhance this 3D scene')) {
        return text;
      }
    } catch (err) {
      console.warn('[Enhancer] Gemini error, falling back to dynamic enhancer:', err.message);
    }
  }

  // 2. Try Ollama if configured (fast 6s timeout so it never hangs)
  if (provider === 'ollama') {
    try {
      const selectedModel = model || 'qwen2.5-coder:1.5b';
      const res = await fetch(`${ollamaHost}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(6000),
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: ENHANCER_SYSTEM_PROMPT },
            { role: 'user', content: `Enhance this 3D scene prompt for the ${format.toUpperCase()} engine: "${cleanCore}"` }
          ],
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 200,
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = (data.message?.content || '').trim().replace(/^["'`]|["'`]$/g, '');
        const text = rawText.replace(/^(?:Enhance|Generate|Create)\s+(?:this\s+)?3D\s+scene\s+prompt[^:]*:\s*["'`]?/i, '').replace(/["'`]\s*$/, '').trim();
        if (text && text.length > cleanCore.length && !text.includes('Enhance this 3D scene')) {
          return text;
        }
      }
    } catch (err) {
      console.warn('[Enhancer] Ollama error, falling back to dynamic enhancer:', err.message);
    }
  }

  // 3. Dynamic offline enhancer — strictly honors user input without canned hijacking
  return enhancePromptOffline(cleanCore);
}

/**
 * Dynamic offline prompt enhancer:
 * Augments the user's actual prompt with architectural details, tactile lighting,
 * and synchronized kinematic loop specifications without replacing it with canned stories.
 */
export function enhancePromptOffline(rawPrompt) {
  const trimmed = (rawPrompt || '').trim();
  if (!trimmed) return trimmed;

  // If already descriptive (>= 15 words) and contains technical specs, keep as-is
  if (trimmed.split(/\s+/).length >= 15 && /\b(isometric|tick\(\)|lighting|loop)\b/i.test(trimmed)) {
    return trimmed;
  }

  const core = unwrapCorePrompt(trimmed);
  const cleanCore = core.replace(/[.]+$/, '').trim();
  const semantics = extractPromptSemantics(cleanCore);

  const propsPhrase = semantics.secondaryObjects.length > 0
    ? `with detailed ${semantics.secondaryObjects.join(' and ')}`
    : 'with layered structural elements';

  let lighting = 'directional rim lighting and tactile material contrast';
  if (semantics.isIndoor) lighting = 'warm ambient indoor glow and directional rim lighting';
  else if (semantics.isWater) lighting = 'specular water reflections and directional rim lighting';

  const motion = semantics.actions.length > 0
    ? `a synchronized ${semantics.actions.join(' and ')} motion loop`
    : 'a synchronized continuous motion loop';

  return `A detailed modular isometric scene depicting ${cleanCore}, ${propsPhrase}, featuring ${lighting}, and ${motion} in tick().`;
}

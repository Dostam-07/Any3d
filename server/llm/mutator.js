import { GoogleGenerativeAI } from '@google/generative-ai';
import { validateScene } from '../engine/validator.js';
import { balanceBraces } from '../engine/bundler.js';
import { editSceneOffline } from './offline-editor.js';

const MUTATOR_SYSTEM_PROMPT = `You are Any3d's Precision Code Surgeon.
Your job is to update, add to, or delete from an existing Any3d 3D scene code conversationally.

CRITICAL RULES:
1. PRECISION EDITING: Apply the user's requested additions, removals, or tweaks directly into the existing code.
2. PRESERVE WORKING LOGIC: Do NOT throw away the existing scene! Keep all working geometry, hierarchical coordinates, palettes, and tick(ctx) animations unless explicitly requested to change or remove them.
3. THE CHANGE MUST BE VISIBLE: if the user asks to add, remove, recolour, move or resize something, the returned code must differ from the input code in a way that produces that visible change.
4. COMPLETE EXECUTABLE CODE: Output the COMPLETE updated JavaScript code starting with Any3d.figure({ and ending with }); (or defineWorld).
5. OUTPUT FORMAT: Output ONLY the complete JavaScript code wrapped in a \`\`\`javascript ... \`\`\` block.`;

function extractCode(raw) {
  let cleaned = (raw || '').trim();
  const match = /```(?:javascript|js)?\s*([\s\S]*?)```/i.exec(cleaned);
  if (match) {
    cleaned = match[1].trim();
  }
  return cleaned;
}

function safeValid(code, format) {
  try {
    return Boolean(validateScene(code, format)?.valid);
  } catch {
    return false;
  }
}

/** Helpers that are documented and safe to inject into SVG scenes. */
const ADD_OPS = [
  {
    re: /\b(trees?|pines?|evergreens?)\b/i,
    noun: 'tree',
    build: (x, z) => `D.props.tree(${x}, ${z}, null, { r: 0.65, kind: 'round' });`,
    label: 'Added a tree',
  },
  {
    re: /\b(bush(?:es)?|shrubs?|hedges?)\b/i,
    noun: 'bush',
    build: (x, z) => `D.props.bush(${x}, ${z}, null, { r: 0.35 });`,
    label: 'Added a bush',
  },
  {
    re: /\b(lamp|lamps|lamp ?posts?|street ?lamps?|lanterns?|floodlights?)\b/i,
    noun: 'lamp',
    build: (x, z) => `D.props.lamp(${x}, ${z}, null, { h: 2.8 });`,
    label: 'Added a lamp post',
  },
  {
    re: /\b(people|person|man|woman|figure|figures|customer|visitor|actor)\b/i,
    noun: 'person',
    build: (x, z) => `D.props.person(${x}, ${z}, null, { shirt: pal.mustard, hat: pal.paper });`,
    label: 'Added a person',
  },
];

/** Objects that can be removed by deleting their documented prop call. */
const REMOVE_OPS = [
  { re: /\b(trees?|pines?|evergreens?)\b/i, helper: 'tree', noun: 'tree' },
  { re: /\b(bush(?:es)?|shrubs?|hedges?|plants?|greenery)\b/i, helper: 'bush', noun: 'bush' },
  { re: /\b(lamp|lamps|lamp ?posts?|street ?lamps?|lanterns?|floodlights?)\b/i, helper: 'lamp', noun: 'lamp' },
  { re: /\b(people|person|bystander|visitor)\b/i, helper: 'person', noun: 'person' },
];

const ADD_SLOTS = [
  [-3.2, 1.4],
  [3.2, 1.4],
  [-3.2, -1.4],
  [3.2, -1.4],
];

/** Insert statements just before the scene's `return { ... }` parts block. */
function insertStatements(code, statements) {
  const anchor = /\n([ \t]*)return\s*\{/.exec(code);
  if (!anchor) return null;
  const indent = anchor[1];
  const block = statements.map((s) => `\n${indent}${s}`).join('');
  return code.slice(0, anchor.index) + block + code.slice(anchor.index);
}

/**
 * Deterministic code mutator for offline fallback or instant local modifications.
 * It only reports a change when the code actually changed, and it never returns
 * code that regresses a previously valid scene.
 */
export function mutateSceneHeuristically(currentCode, instruction, format = 'svg') {
  return editSceneOffline(currentCode, instruction, format);
  /* Legacy narrow engine kept below for reference; editSceneOffline supersedes it. */
  const lower = instruction.toLowerCase();
  const changes = [];
  let code = currentCode;
  const fmt =
    format || (/\bdefineWorld\b/.test(currentCode) ? 'worlds' : /\bPixel\.scene\b/.test(currentCode) ? 'pixel' : 'svg');

  const commit = (next, label) => {
    if (typeof next === 'string' && next && next !== code) {
      code = next;
      changes.push(label);
    }
  };

  const wantsAdd = /\b(add|put|place|include|insert|create|bring|give)\b/i.test(lower);
  const wantsRemove = /\b(remove|delete|strip|hide|get rid of|take out|drop)\b/i.test(lower);

  // 1. Theme / time-of-day shifts (visible on their own).
  if (fmt === 'svg') {
    const hasThemeWord =
      /\b(theme|night|midnight|evening|dusk|dark|sunset|mono|monochrome|minimal|sketch|line art|print|morning|daylight|pastel|soft|colou?rful|vibrant)\b/i.test(
        lower
      );
    if (hasThemeWord && !(wantsAdd && !/\btheme\b/i.test(lower))) {
      let theme = null;
      if (/\b(night|midnight|evening|dusk|dark|sunset)\b/i.test(lower)) theme = 'night';
      else if (/\b(mono|monochrome|minimal|black and white)\b/i.test(lower)) theme = 'mono';
      else if (/\b(sketch|line art|hairline)\b/i.test(lower)) theme = 'line';
      else if (/\bprint|screen ?print\b/i.test(lower)) theme = 'print';
      else if (/\b(morning|daylight|pastel|soft)\b/i.test(lower)) theme = 'soft';
      else if (/\b(colou?rful|vibrant|playful)\b/i.test(lower)) theme = 'toy';
      if (theme) {
        commit(code.replace(/\btheme:\s*['"`][^'"`]+['"`]/, `theme: '${theme}'`), `Switched the theme to ${theme}`);
      }
    }
  }

  // 2. Removals — delete the documented helper call for the named prop.
  if (wantsRemove) {
    for (const op of REMOVE_OPS) {
      if (!op.re.test(lower)) continue;
      const callRe = new RegExp(`[ \\t]*(?:var\\s+\\w+\\s*=\\s*)?(?:D|P|W)\\.props\\.${op.helper}\\([^;]*\\);[ \\t]*`, 'g');
      if (!callRe.test(code)) continue;
      const stripped = code.replace(callRe, '/* removed */');
      commit(stripped, `Removed the ${op.noun}`);
    }
  }

  // 3. Additions — inject documented helpers near the scene edges.
  if (wantsAdd && !wantsRemove) {
    const statements = [];
    const labels = [];
    let slot = 0;
    for (const op of ADD_OPS) {
      if (!op.re.test(lower)) continue;
      const [x, z] = ADD_SLOTS[slot % ADD_SLOTS.length];
      statements.push(op.build(x, z));
      labels.push(op.label);
      slot += 1;
      if (statements.length >= 2) break;
    }
    if (statements.length > 0) {
      const injected = insertStatements(code, statements);
      if (injected) commit(injected, labels.join(' and '));
    }
  }

  // Never ship a change that breaks a previously valid scene.
  let changed = code !== currentCode;
  if (changed) {
    const balanced = balanceBraces(code);
    const wasValid = safeValid(currentCode, fmt);
    const nowValid = safeValid(balanced, fmt);
    if (wasValid && !nowValid) {
      return {
        code: currentCode,
        summary: `I could not apply "${instruction}" safely — that edit would have broken the scene.`,
        changed: false,
      };
    }
    code = balanced;
  }

  if (!changed) {
    return {
      code: currentCode,
      summary: `I couldn't apply "${instruction}" offline. Try naming the object and the change — add/remove, move/scale, a motion (spin, bob, sway, pulse, orbit), a hover lift, or a theme. For example: "add a bench near it" or "make it spin". For structural edits, connect a coding model.`,
      changed: false,
    };
  }

  return { code, summary: changes.join(', '), changed: true };
}

const PLAN_SYSTEM_PROMPT = `You convert a scene edit request into a JSON edit plan. Return ONLY JSON, no prose.

Schema (all fields optional):
{
  "theme": "toy" | "soft" | "mono" | "line" | "night" | "print",
  "add": [{ "kind": "tree" | "bush" | "lamp" | "person", "x": number, "z": number }],
  "remove": ["tree" | "bush" | "lamp" | "person"],
  "unsupported": true
}

Rules:
- Use ONLY the listed kinds. Never invent other object types.
- x and z are world coordinates roughly between -3.5 and 3.5. y is implied by the helper.
- If the request cannot be expressed with these ops, return {"unsupported": true}.
- If the request asks only for a change we cannot express (recolouring a specific object, weather, a bicycle...), return {"unsupported": true} rather than guessing.`;

/**
 * A small model happily answers with an unrelated op (e.g. "add a bicycle" ->
 * restyle the theme). Only accept a plan that matches what was actually asked.
 */
function planMatchesIntent(plan, instruction) {
  const t = instruction.toLowerCase();
  const wantsAdd = /\b(add|put|place|include|insert|create|bring)\b/.test(t);
  const wantsRemove = /\b(remove|delete|strip|hide|get rid of|take out|drop)\b/.test(t);
  const mentionsTheme =
    /\b(theme|style|night|midnight|evening|dusk|dark|sunset|mono|monochrome|minimal|sketch|line art|print|morning|daylight|pastel|soft|colou?rful|vibrant)\b/.test(
      t
    );

  if (wantsAdd && !(Array.isArray(plan.add) && plan.add.length > 0)) return false;
  if (wantsRemove && !(Array.isArray(plan.remove) && plan.remove.length > 0)) return false;
  if (plan.theme && !mentionsTheme) return false;
  if (!wantsAdd && !wantsRemove && !plan.theme) return false;
  return true;
}

/** Apply a JSON edit plan deterministically. */
export function applyEditPlan(plan, currentCode, format = 'svg') {
  let code = currentCode;
  const changes = [];
  if (!plan || typeof plan !== 'object') {
    return { code: currentCode, changed: false, summary: '' };
  }

  if (typeof plan.theme === 'string' && /^(toy|soft|mono|line|night|print)$/.test(plan.theme)) {
    const next = code.replace(/\btheme:\s*['"`][^'"`]+['"`]/, `theme: '${plan.theme}'`);
    if (next !== code) {
      code = next;
      changes.push(`Switched the theme to ${plan.theme}`);
    }
  }

  if (Array.isArray(plan.remove)) {
    for (const kind of plan.remove) {
      const op = REMOVE_OPS.find((o) => o.helper === String(kind).toLowerCase());
      if (!op) continue;
      const callRe = new RegExp(
        `[ \\t]*(?:var\\s+\\w+\\s*=\\s*)?(?:D|P|W)\\.props\\.${op.helper}\\([^;]*\\);[ \\t]*`,
        'g'
      );
      if (!callRe.test(code)) continue;
      code = code.replace(callRe, '/* removed */');
      changes.push(`Removed the ${op.noun}`);
    }
  }

  if (Array.isArray(plan.add)) {
    const statements = [];
    const labels = [];
    for (const item of plan.add.slice(0, 3)) {
      const op = ADD_OPS.find((o) => o.noun === String(item?.kind || '').toLowerCase());
      if (!op) continue;
      const clamp = (v, fallback) => {
        const n = Number(v);
        return Number.isFinite(n) ? Math.max(-3.5, Math.min(3.5, n)) : fallback;
      };
      const x = clamp(item.x, 0);
      const z = clamp(item.z, 0);
      statements.push(op.build(x, z));
      labels.push(op.label);
    }
    if (statements.length > 0) {
      const injected = insertStatements(code, statements);
      if (injected && injected !== code) {
        code = injected;
        const counts = labels.reduce((acc, label) => {
          acc[label] = (acc[label] || 0) + 1;
          return acc;
        }, {});
        changes.push(
          Object.entries(counts)
            .map(([label, n]) => (n > 1 ? `${label} (×${n})` : label))
            .join(' and ')
        );
      }
    }
  }

  const changed = code !== currentCode;
  if (!changed) return { code: currentCode, changed: false, summary: '' };

  const balanced = balanceBraces(code);
  if (safeValid(currentCode, format) && !safeValid(balanced, format)) {
    return { code: currentCode, changed: false, summary: '' };
  }
  return { code: balanced, changed: true, summary: changes.join(', ') };
}

/** Ask a small local model for a compact JSON plan (fast, unlike a full-file rewrite). */
async function planWithOllama(ollamaHost, model, instruction, format) {
  const res = await fetch(`${ollamaHost}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: PLAN_SYSTEM_PROMPT },
        { role: 'user', content: `Scene engine: ${format}\nRequest: "${instruction}"` }
      ],
      stream: false,
      format: 'json',
      options: { temperature: 0.1, num_ctx: 4096, num_predict: 300 }
    })
  });
  if (!res.ok) return null;
  const data = await res.json();
  try {
    return JSON.parse(data.message?.content || 'null');
  } catch {
    return null;
  }
}

const ASK_SYSTEM_PROMPT = `You are Any3d's scene inspector. You answer questions about the scene code that is shown to you.

RULES:
1. READ ONLY. You never rewrite, patch or output code. You never propose a diff. If asked to change something, say what would need to change and stop.
2. Answer from the code you are given: name the function, prop call or palette entry that explains the behaviour, and quote the relevant line.
3. Use the validation report when it is supplied, and say plainly when a check is failing.
4. Be short: two or three sentences unless the question needs a list.`;

/**
 * Deterministic answer used when no model is available. It inspects the code
 * for the thing being asked about, so "why is the lamp dark?" still gets a
 * real answer offline. Read-only by construction: it returns text only.
 */
function answerFromCode({ currentCode, question, format, validation }) {
  const q = String(question || '').toLowerCase();
  const lines = currentCode.split('\n');
  // Count call expressions, not lines: a minified scene puts many calls on one line.
  const calls = (re) => currentCode.match(re) || [];
  const propCalls = calls(/\b(?:D|P|W)\.props\.\w+\([^;)]*\)/g);
  const propNames = [...new Set(propCalls.map((c) => (/\bprops\.(\w+)\(/.exec(c) || [])[1]).filter(Boolean))];
  const theme = (/\btheme:\s*['"`]([^'"`]+)['"`]/.exec(currentCode) || [])[1];
  const palette = [...new Set((currentCode.match(/\bpal\.\w+/g) || []))].slice(0, 8);
  const hasTick = /\btick\s*:/.test(currentCode);
  const look = (/\blook\s*:\s*\{[^}]*timeOfDay:\s*([\d.]+)/.exec(currentCode) || [])[1];
  const failing = (validation?.checks || []).filter((c) => !c.ok).map((c) => c.label);

  const find = (re) => lines.filter((l) => re.test(l)).map((l) => l.trim()).slice(0, 3);

  if (/\b(lamp|light|glow|dark|dim|lit|shadow)\b/.test(q)) {
    const lampCalls = calls(/\b(?:D|P|W)\.props\.\w*(?:lamp|glow|light)\w*\([^;)]*\)/gi);
    if (!lampCalls.length) {
      return `There is no lamp or emissive call in this ${format} scene, so nothing is lit from inside: the only light is the scene's own shade. Add \`D.props.lamp(x, z)\` or a \`night\` theme to get a glow.`;
    }
    return `The light comes from ${lampCalls.length} call${lampCalls.length === 1 ? '' : 's'}: ${lampCalls.slice(0, 3).join(' ; ')}. Theme is ${theme || 'default'}${look ? ` and the look's timeOfDay is ${look}` : ''}, which scales lamp emission — a dark lamp at dusk/night is the grade dimming it, not a broken call.`;
  }
  if (/\b(colour|color|palette|hue|tone|paint)\b/.test(q)) {
    return `The scene draws from ${palette.length ? palette.join(', ') : 'no named palette entries'} on a ${theme || 'default'} theme. Change the theme field, or the palette values in the figure header, to restyle everything at once.`;
  }
  if (/\b(animat|move|motion|tick|spin|loop|still)\b/.test(q)) {
    return hasTick
      ? `Yes — \`tick(ctx)\` is defined, so the scene animates continuously; the moving parts are driven by the values it updates each frame.`
      : 'No: this scene has no `tick(ctx)`, so it renders as a still frame.';
  }
  if (/\b(prop|object|contain|include|there|part|element)\b/.test(q)) {
    return `It contains ${propCalls.length} prop call${propCalls.length === 1 ? '' : 's'}${propNames.length ? ` (${propNames.join(', ')})` : ''} plus the figure's own geometry. ${failing.length ? `Validation is failing: ${failing.join(', ')}.` : 'Validation passes.'}`;
  }
  if (/\b(weather|rain|snow|fog|sky)\b/.test(q)) {
    return look != null
      ? `The look is baked with timeOfDay ${look}; weather particles are drawn by the kernel's look system, not by the scene code, so they follow the scrubber rather than the figure.`
      : 'Weather is a kernel-level look, not a scene prop: use the light scrubber and the weather toggle above the stage.';
  }
  return `This is a ${format} scene${theme ? ` on the ${theme} theme` : ''} with ${propCalls.length} prop calls${hasTick ? ' and a tick loop' : ''}. ${failing.length ? `Validation reports: ${failing.join(', ')}.` : 'All validation checks pass.'} Ask about a specific part — a lamp, the palette, the motion, or what is in the scene — for a closer answer.`;
}

export async function askScene({
  currentCode = '',
  question = '',
  format = 'svg',
  validation = null,
  provider = 'ollama',
  apiKey = '',
  ollamaHost = 'http://localhost:11434',
  model = '',
}) {
  const clean = String(question || '').trim();
  if (!clean) throw new Error('A question is required.');
  if (!currentCode.trim()) {
    return {
      answer: 'There is no scene on the stage yet — generate or load one, then ask about it.',
      changed: false,
      readOnly: true,
      offline: true,
    };
  }

  const failures = (validation?.checks || []).filter((c) => !c.ok).map((c) => `${c.label}: ${c.message}`);
  const prompt = `SCENE FORMAT: ${format}\r\n\r\nSCENE CODE:\r\n\`\`\`javascript\r\n${currentCode}\r\n\`\`\`\r\n\r\nVALIDATION REPORT:\r\n${failures.length ? failures.join('\n') : 'All checks passing.'}\r\n\r\nQUESTION: "${clean}"\r\n\r\nAnswer the question about this scene. Do not output code.`;

  // 1. Gemini, when configured.
  if (provider === 'gemini' && apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({
        model: model || 'gemini-2.5-flash',
        systemInstruction: ASK_SYSTEM_PROMPT,
      });
      const res = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 700 },
      });
      const answer = (res.response.text() || '').trim();
      if (answer) return { answer, changed: false, readOnly: true };
    } catch (err) {
      console.warn('[Ask Scene] Gemini error, answering from the code:', err.message);
    }
  }

  // 2. Local model.
  if (provider === 'ollama') {
    try {
      const res = await fetch(`${ollamaHost}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(45000),
        body: JSON.stringify({
          model: model || 'qwen2.5-coder:1.5b',
          messages: [
            { role: 'system', content: ASK_SYSTEM_PROMPT },
            { role: 'user', content: prompt },
          ],
          stream: false,
          options: { temperature: 0.2, num_ctx: 8192, num_predict: 400 },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const answer = (data.message?.content || '').trim();
        if (answer) return { answer, changed: false, readOnly: true };
      }
    } catch (err) {
      console.warn('[Ask Scene] Local model error, answering from the code:', err.message);
    }
  }

  // 3. Deterministic, code-grounded answer. Still read-only.
  return {
    answer: answerFromCode({ currentCode, question: clean, format, validation }),
    changed: false,
    readOnly: true,
    offline: true,
  };
}

export async function mutateSceneWithAI({
  currentCode,
  instruction,
  format = 'svg',
  history = [],
  provider = 'gemini',
  apiKey = '',
  ollamaHost = 'http://localhost:11434',
  model = ''
}) {
  if (!currentCode || !currentCode.trim()) {
    throw new Error('Current scene code is required for conversational mutation.');
  }

  const cleanInstruction = instruction.trim();

  // 0. Deterministic offline editor first: it is instant, needs no model, and is
  //    honest about what it cannot do. Only fall through to a model for the rest.
  const offlineEdit = editSceneOffline(currentCode, cleanInstruction, format);
  if (offlineEdit && offlineEdit.changed) {
    const offlineVal = validateScene(offlineEdit.code, format);
    if (offlineVal.valid) {
      return { code: offlineEdit.code, validation: offlineVal, summary: offlineEdit.summary, changed: true };
    }
  }
  const historyText = history
    .slice(-6)
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');

  const userPrompt = `CURRENT CODE:
\`\`\`javascript
${currentCode}
\`\`\`

CONVERSATION CONTEXT:
${historyText || 'No prior context'}

USER MUTATION REQUEST:
"${cleanInstruction}"

Apply exactly this change to the current code, keep everything else intact, and output the complete runnable Any3d code.`;

  const accepted = (candidate, label) => {
    const balanced = balanceBraces(candidate);
    const val = validateScene(balanced, format);
    const actuallyChanged = balanced.trim() !== currentCode.trim();
    if (val.valid && actuallyChanged) {
      return { code: balanced, validation: val, summary: label, changed: true };
    }
    return null;
  };

  // 1. If Gemini is available
  if (provider === 'gemini' && apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const geminiModel = genAI.getGenerativeModel({
        model: model || 'gemini-2.5-flash',
        systemInstruction: MUTATOR_SYSTEM_PROMPT,
      });

      const res = await geminiModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.25, maxOutputTokens: 8192 }
      });

      const result = accepted(extractCode(res.response.text()), `Applied: "${cleanInstruction}"`);
      if (result) return result;
    } catch (err) {
      console.warn('[Chat Mutate] Gemini error, falling back to smart mutator:', err.message);
    }
  }

  // 2. Local models: rewriting a whole scene file is far too slow on CPU (it times
  //    out), so ask for a compact JSON edit plan and apply it deterministically.
  if (provider === 'ollama') {
    try {
      const candidate = model || 'qwen2.5-coder:7b';
      const plan = await planWithOllama(ollamaHost, candidate, cleanInstruction, format);
      if (plan && !plan.unsupported && planMatchesIntent(plan, cleanInstruction)) {
        const applied = applyEditPlan(plan, currentCode, format);
        if (applied.changed) {
          const val = validateScene(applied.code, format);
          if (val.valid) {
            return { code: applied.code, validation: val, summary: applied.summary, changed: true };
          }
        }
      }
    } catch (err) {
      console.warn('[Chat Mutate] Local plan error, falling back to smart mutator:', err.message);
    }
  }

  // 3. Smart Deterministic Fallback Mutator
  const heuristic = mutateSceneHeuristically(currentCode, cleanInstruction, format);
  const val = validateScene(heuristic.code, format);
  return {
    code: heuristic.code,
    validation: val,
    summary: heuristic.summary,
    changed: heuristic.changed
  };
}

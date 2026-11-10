import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateScene } from './engine/validator.js';
import { bundleScene } from './engine/bundler.js';
import { generateScene, getOllamaModels } from './llm/service.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { enhancePromptWithAI } from './llm/enhancer.js';
import { mutateSceneWithAI, askScene } from './llm/mutator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', product: 'Any3d', timestamp: new Date().toISOString() });
});

// Presets Inventory for all 4 engines
app.get('/api/presets', (req, res) => {
  try {
    const presets = [];
    const dirs = [
      { format: 'svg', dir: path.join(rootDir, 'server', 'presets', 'svg') },
      { format: 'worlds', dir: path.join(rootDir, 'server', 'presets', 'worlds') },
      { format: 'pixel', dir: path.join(rootDir, 'server', 'presets', 'pixel') },
      { format: 'dither', dir: path.join(rootDir, 'server', 'presets', 'dither') },
    ];

    for (const { format, dir } of dirs) {
      if (fs.existsSync(dir)) {
        for (const file of fs.readdirSync(dir)) {
          if (file.endsWith('.js')) {
            const code = fs.readFileSync(path.join(dir, file), 'utf8');
            const titleMatch = /\btitle:\s*['"`]([^'"`]+)['"`]/.exec(code);
            presets.push({
              id: `${format}-${file.replace('.js', '')}`,
              name: file.replace('.js', ''),
              title: titleMatch ? titleMatch[1] : file.replace('.js', ''),
              format,
              code
            });
          }
        }
      }
    }

    res.json(presets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validate Scene Code
app.post('/api/validate', (req, res) => {
  try {
    const { code, format, prompt = '' } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });
    const result = validateScene(code, format, prompt);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bundle Scene to Standalone HTML
app.post('/api/bundle', async (req, res) => {
  try {
    const { code, format, look } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });
    const html = await bundleScene(code, format, look || null);
    res.json({ html, sizeBytes: Buffer.byteLength(html, 'utf8') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ollama Models Discovery
app.get('/api/ollama/models', async (req, res) => {
  const host = req.query.host || 'http://localhost:11434';
  const models = await getOllamaModels(host);
  res.json({ models });
});

// LLM Scene Generation
app.post('/api/generate', async (req, res) => {
  try {
    const {
      provider = 'gemini',
      apiKey = '',
      ollamaHost = 'http://localhost:11434',
      model = '',
      format = 'svg',
      prompt = '',
      seed = null,
    } = req.body;

    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const key = apiKey || process.env.GEMINI_API_KEY || '';
    const result = await generateScene({
      provider,
      apiKey: key,
      ollamaHost,
      model,
      format,
      prompt,
      seed: seed == null ? null : Number(seed),
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Enhance Prompt Endpoint
app.post('/api/enhance-prompt', async (req, res) => {
  try {
    const {
      prompt = '',
      format = 'svg',
      provider = 'gemini',
      apiKey = '',
      ollamaHost = 'http://localhost:11434',
      model = '',
    } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const key = apiKey || process.env.GEMINI_API_KEY || '';
    const enhanced = await enhancePromptWithAI({
      prompt,
      format,
      provider,
      apiKey: key,
      ollamaHost,
      model,
    });

    const origWords = prompt.trim().split(/\s+/).length;
    const enhWords = enhanced.trim().split(/\s+/).length;

    res.json({
      original: prompt,
      enhanced,
      wordsAdded: Math.max(0, enhWords - origWords),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Conversational Scene Mutation Endpoint
app.post('/api/chat-mutate', async (req, res) => {
  try {
    const {
      currentCode = req.body.code || '',
      instruction = '',
      format = 'svg',
      history = [],
      provider = 'gemini',
      apiKey = '',
      ollamaHost = 'http://localhost:11434',
      model = '',
    } = req.body;

    if (!instruction || !instruction.trim()) {
      return res.status(400).json({ error: 'Instruction is required' });
    }

    const key = apiKey || process.env.GEMINI_API_KEY || '';
    const result = await mutateSceneWithAI({
      currentCode,
      instruction,
      format,
      history,
      provider,
      apiKey: key,
      ollamaHost,
      model,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Read-only scene questions. Returns text only: never code, never a version.
app.post('/api/ask-scene', async (req, res) => {
  try {
    const {
      currentCode = req.body.code || '',
      question = '',
      format = 'svg',
      validation = null,
      provider = 'ollama',
      apiKey = '',
      ollamaHost = 'http://localhost:11434',
      model = '',
    } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'A question is required.' });
    }

    const key = apiKey || process.env.GEMINI_API_KEY || '';
    const result = await askScene({
      currentCode,
      question,
      format,
      validation,
      provider,
      apiKey: key,
      ollamaHost,
      model,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Image -> palette extraction. Gemini vision reads a reference photo and returns a
// compact descriptor (palette, horizon, light direction, mood) that the client
// folds into the next generation prompt, so a scene can be painted in that key.
app.post('/api/extract-palette', async (req, res) => {
  try {
    const {
      image = '',
      mimeType = 'image/jpeg',
      provider = 'gemini',
      apiKey = '',
      ollamaHost = 'http://localhost:11434',
      model = '',
    } = req.body || {};

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'image (base64) is required' });
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      return res.status(400).json({ error: 'Use a JPEG, PNG, or WebP reference image.' });
    }
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(image) || image.length % 4 === 1) {
      return res.status(400).json({ error: 'The image data is not valid base64.' });
    }
    if (Buffer.from(image, 'base64').byteLength > 6 * 1024 * 1024) {
      return res.status(413).json({ error: 'Reference images must be 6 MB or smaller.' });
    }

    const instruction = `You are a colour and lighting analyst for a 3D Any3d scene studio.
Look at the reference photo and reply with ONLY a JSON object (no markdown, no prose) of this shape:
{
  "palette": ["#rrggbb", "#rrggbb", "#rrggbb", "#rrggbb", "#rrggbb"],
  "horizon": 0.0,
  "lightAz": 0,
  "lightEl": 0,
  "mood": "short mood phrase",
  "description": "one sentence describing the colour and light key of the photo"
}
Rules:
- palette: 5 to 7 dominant colours as #rrggbb hex, ordered from dominant to accent.
- horizon: where the horizon sits in the frame, 0.0 (bottom) to 1.0 (top).
- lightAz: sun/light azimuth in degrees (0-360), estimated from shadow direction.
- lightEl: sun/light elevation in degrees (0-90).
- mood: 2-5 words (e.g. "golden hour dusk", "overcast noon", "cool twilight").
- description: one sentence, no quotes inside.
Return ONLY the JSON object.`;

    let raw;
    if (provider === 'gemini') {
      const key = apiKey || process.env.GEMINI_API_KEY || '';
      if (!key) {
        return res.status(400).json({
          error: 'Image -> palette needs a Gemini API key or an Ollama vision model.',
        });
      }

      const genAI = new GoogleGenerativeAI(key);
      const visionModel = genAI.getGenerativeModel({
        model: model || 'gemini-2.5-flash',
        generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
      });
      const result = await visionModel.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { data: image, mimeType } },
              { text: instruction },
            ],
          },
        ],
      });
      raw = result.response.text().trim();
    } else if (provider === 'ollama') {
      if (!model) return res.status(400).json({ error: 'Choose an Ollama vision model first.' });
      const response = await fetch(`${ollamaHost}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: instruction, images: [image] }],
          stream: false,
          format: 'json',
          options: { temperature: 0.2, num_predict: 512 },
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.error || `Ollama vision request failed (${response.status})`);
      }
      raw = body.message?.content?.trim();
      if (!raw) throw new Error('Ollama vision model returned an empty response');
    } else {
      return res.status(400).json({ error: 'Choose Gemini or Ollama as the vision provider.' });
    }

    // Extract the first {...} block in case the model wrapped it.
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Vision model did not return JSON');
    const parsed = JSON.parse(match[0]);

    const palette = Array.isArray(parsed.palette)
      ? parsed.palette.filter((c) => /^#[0-9a-fA-F]{6}$/.test(c)).slice(0, 7)
      : [];
    if (palette.length < 3) throw new Error('Could not extract a usable palette');

    const rawHorizon = Number(parsed.horizon);
    const rawLightAz = Number(parsed.lightAz);
    const rawLightEl = Number(parsed.lightEl);
    const horizon = Math.min(1, Math.max(0, Number.isFinite(rawHorizon) ? rawHorizon : 0.5));
    const lightAz = ((Number.isFinite(rawLightAz) ? rawLightAz : 0) % 360 + 360) % 360;
    const lightEl = Math.min(90, Math.max(0, Number.isFinite(rawLightEl) ? rawLightEl : 30));
    const mood = String(parsed.mood || 'reference light').slice(0, 60);
    const description = String(parsed.description || '').slice(0, 200);

    res.json({ palette, horizon, lightAz, lightEl, mood, description });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Palette extraction failed' });
  }
});

// Serve static frontend assets if built
const distDir = path.join(rootDir, 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

const server = app.listen(PORT, () => {
  console.log(`[Any3d Studio API] Listening on port ${PORT}`);
});
server.timeout = 600000;
server.keepAliveTimeout = 610000;
server.headersTimeout = 620000;

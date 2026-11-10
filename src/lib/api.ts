import { PresetScene, ValidationReport, OllamaModelInfo, GeneratorConfig, RenderFormat, LLMProvider } from '../types';

export async function fetchPresets(): Promise<PresetScene[]> {
  const res = await fetch('/api/presets');
  if (!res.ok) throw new Error('Failed to load presets');
  return res.json();
}

export async function validateCode(code: string, format: RenderFormat, prompt?: string): Promise<ValidationReport> {
  const res = await fetch('/api/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, format, prompt }),
  });
  if (!res.ok) throw new Error('Validation request failed');
  return res.json();
}

export async function bundleCode(
  code: string,
  format: RenderFormat,
  look?: { timeOfDay: number; weather: 'clear' | 'rain' | 'snow' } | null
): Promise<{ html: string; sizeBytes: number }> {
  const res = await fetch('/api/bundle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, format, look }),
  });
  if (!res.ok) throw new Error('Bundle request failed');
  return res.json();
}

export async function fetchOllamaModels(host: string = 'http://localhost:11434'): Promise<OllamaModelInfo[]> {
  try {
    const res = await fetch(`/api/ollama/models?host=${encodeURIComponent(host)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.models || [];
  } catch {
    return [];
  }
}

export async function generateAny3d(config: GeneratorConfig): Promise<{
  code: string;
  validation: ValidationReport;
  format: RenderFormat;
  model?: string;
  fallbackNotice?: string;
}> {
  const model = config.provider === 'gemini' ? config.geminiModel : config.ollamaModel;
  let res: Response;
  try {
    res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: config.provider,
        apiKey: config.apiKey,
        ollamaHost: config.ollamaHost,
        model,
        format: config.format,
        prompt: config.prompt,
        seed: config.seed ?? null,
      }),
    });
  } catch (err: any) {
    throw new Error(
      `Cannot connect to Any3d backend server (${err.message}). Please verify the local server is running on port 3001.`
    );
  }

  if (!res.ok) {
    let errMsg = `Generation failed (${res.status})`;
    try {
      const data = await res.json();
      if (data && data.error) errMsg = data.error;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) errMsg = text;
    }
    throw new Error(errMsg);
  }

  return res.json();
}

export async function enhancePromptApi(params: {
  prompt: string;
  format: RenderFormat;
  provider: LLMProvider;
  geminiModel: string;
  ollamaModel: string;
  ollamaHost: string;
  apiKey: string;
}): Promise<{ original: string; enhanced: string; wordsAdded: number }> {
  const model = params.provider === 'gemini' ? params.geminiModel : params.ollamaModel;
  const res = await fetch('/api/enhance-prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: params.prompt,
      format: params.format,
      provider: params.provider,
      apiKey: params.apiKey,
      ollamaHost: params.ollamaHost,
      model,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to enhance prompt');
  }
  return res.json();
}

export async function mutateSceneApi(params: {
  currentCode?: string;
  code?: string;
  instruction: string;
  format: RenderFormat;
  history?: Array<{ role: string; content: string }>;
  provider: LLMProvider;
  geminiModel: string;
  ollamaModel: string;
  ollamaHost: string;
  apiKey: string;
}): Promise<{ code: string; validation: ValidationReport; summary: string; changed?: boolean }> {
  const model = params.provider === 'gemini' ? params.geminiModel : params.ollamaModel;
  const res = await fetch('/api/chat-mutate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currentCode: params.currentCode || params.code || '',
      instruction: params.instruction,
      format: params.format,
      history: params.history || [],
      provider: params.provider,
      apiKey: params.apiKey,
      ollamaHost: params.ollamaHost,
      model,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to apply conversational update');
  }
  return res.json();
}

export async function askSceneApi(params: {
  code: string;
  question: string;
  format: RenderFormat;
  validation?: ValidationReport | null;
  provider: LLMProvider;
  geminiModel: string;
  ollamaModel: string;
  ollamaHost: string;
  apiKey: string;
}): Promise<{ answer: string; changed: false; readOnly: true; offline?: boolean }> {
  const model = params.provider === 'gemini' ? params.geminiModel : params.ollamaModel;
  const res = await fetch('/api/ask-scene', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      currentCode: params.code,
      question: params.question,
      format: params.format,
      validation: params.validation || null,
      provider: params.provider,
      apiKey: params.apiKey,
      ollamaHost: params.ollamaHost,
      model,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Could not answer that question');
  }
  return res.json();
}

// Backward-compatible alias
export async function extractPaletteApi(params: {
  image: string;
  mimeType?: string;
  provider: LLMProvider;
  geminiModel: string;
  ollamaModel: string;
  ollamaHost: string;
  apiKey: string;
}): Promise<{
  palette: string[];
  horizon: number;
  lightAz: number;
  lightEl: number;
  mood: string;
  description: string;
}> {
  const model = params.provider === 'gemini' ? params.geminiModel : params.ollamaModel;
  const res = await fetch('/api/extract-palette', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: params.image,
      mimeType: params.mimeType,
      provider: params.provider,
      apiKey: params.apiKey,
      ollamaHost: params.ollamaHost,
      model,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Could not extract a palette from that image');
  }
  return res.json();
}



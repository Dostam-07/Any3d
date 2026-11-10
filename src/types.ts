export type RenderFormat = 'svg' | 'worlds' | 'pixel' | 'dither';
export type SVGTheme = 'toy' | 'soft' | 'mono' | 'line' | 'night' | 'print';
export type WorldFinish = 'miniature' | 'pixel' | 'halftone' | 'blueprint';
export type LLMProvider = 'gemini' | 'ollama';

export interface ValidationCheck {
  id: number;
  label: string;
  ok: boolean;
  message: string;
}

export interface ValidationReport {
  valid: boolean;
  format: RenderFormat;
  name: string;
  size?: 'hero' | 'card' | 'mini';
  checks: ValidationCheck[];
  fidelity?: {
    valid: boolean;
    score: number;
    summary: string;
    primarySubject?: { name: string; found: boolean };
    secondaryObjects?: { name: string; found: boolean }[];
    unrelatedObjects?: string[];
  };
}

export interface PresetScene {
  id: string;
  name: string;
  title: string;
  format: RenderFormat;
  code: string;
}

export interface OllamaModelInfo {
  name: string;
  size: number;
  modified_at: string;
  capabilities?: string[];
}

export interface GeneratorConfig {
  provider: LLMProvider;
  geminiModel: string;
  ollamaModel: string;
  ollamaHost: string;
  apiKey: string;
  format: RenderFormat;
  size: 'hero' | 'card' | 'mini';
  prompt: string;
  /** Locked generation seed: same model + seed + prompt should reproduce a scene. */
  seed?: number | null;
}

export type SlashCommandType = '/svg' | '/worlds' | '/pixel' | '/dither' | '/enhance' | '/glb' | '/html' | '/undo' | '/clear';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  command?: SlashCommandType;
  timestamp: number;
  codeSnapshot?: string;
  format?: RenderFormat;
  version?: number;
  summary?: string;
  /** Seed this version was generated with, when the seed lock was on. */
  seed?: number;
  /** 'ask' messages are read-only answers: they never carry a code snapshot. */
  kind?: 'edit' | 'ask';
}

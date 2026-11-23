import React, { useState } from 'react';
import {
  ArrowRight,
  Cpu,
  Key,
  Play,
  Shapes,
  Cuboid,
  Grid3X3,
  Sparkles,
} from 'lucide-react';
import { RenderFormat, LLMProvider, OllamaModelInfo, WebPresentationSize } from '../types';

interface FirstRunPanelProps {
  provider: LLMProvider;
  setProvider: (p: LLMProvider) => void;
  ollamaModel: string;
  setOllamaModel: (m: string) => void;
  ollamaModels: OllamaModelInfo[];
  geminiModel: string;
  setGeminiModel: (m: string) => void;
  hasApiKey: boolean;
  onOpenApiKey: () => void;
  onStartScene: (prompt: string, format: RenderFormat, size: WebPresentationSize) => void;
  setFormat: (f: RenderFormat) => void;
  format: RenderFormat;
}

interface StarterItem {
  id: string;
  title: string;
  format: RenderFormat;
  description: string;
  prompt: string;
  icon: React.FC<{ className?: string }>;
  accent: string;
}

const STARTERS: StarterItem[] = [
  {
    id: 'coffee-cart',
    title: 'Coffee Cart',
    format: 'svg',
    description: 'A retro coffee cart with a barista and steaming cups',
    prompt: 'A retro coffee cart on a street corner with a barista pulling shots',
    icon: Shapes,
    accent: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
  },
  {
    id: 'lighthouse',
    title: 'Lighthouse Island',
    format: 'worlds',
    description: 'A seaside lighthouse with rotating beacon and waves',
    prompt: 'A seaside lighthouse island with breathing waves and a turning beacon light',
    icon: Cuboid,
    accent: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5',
  },
  {
    id: 'forge',
    title: 'Mountain Forge',
    format: 'pixel',
    description: 'A smithy with glowing embers and rising smoke',
    prompt: 'A mountain forge with glowing embers and smoke leaving the chimney',
    icon: Grid3X3,
    accent: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
  },
];

export const FirstRunPanel: React.FC<FirstRunPanelProps> = ({
  provider,
  setProvider,
  ollamaModel,
  setOllamaModel,
  ollamaModels,
  geminiModel,
  setGeminiModel,
  hasApiKey,
  onOpenApiKey,
  onStartScene,
  setFormat,
  format,
}) => {
  const [localFormat, setLocalFormat] = useState<RenderFormat>(format);

  // Determine model status
  const isOllamaReady = ollamaModels.length > 0;
  const hasProvider =
    provider === 'ollama' ? isOllamaReady : hasApiKey;

  const handleSetFormat = (f: RenderFormat) => {
    setLocalFormat(f);
    setFormat(f);
  };

  const handleStartStarter = (starter: StarterItem) => {
    setLocalFormat(starter.format);
    setFormat(starter.format);
    onStartScene(starter.prompt, starter.format, 'card');
  };

  const ready = hasProvider && ollamaModels.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Model Status Banner */}
      <div className="mb-6 rounded-xl border p-4 {${
        ready
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : 'bg-amber-500/5 border-amber-500/20'
      }}">
        <div className="flex items-start gap-3">
          {ready ? (
            <Cpu className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
          ) : (
            <Key className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          )}
          <div>
            <h3 className="text-sm font-bold text-zinc-100">
              {ready ? 'AI model ready' : 'AI model not configured'}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              {ready
                ? `Using ${provider === 'ollama' ? ollamaModel : geminiModel}. You can start generating scenes immediately.`
                : provider === 'ollama'
                ? 'No Ollama models detected. Run `ollama serve` and pull a model (e.g. qwen2.5-coder:1.5b), or add a Gemini API key.'
                : 'Add a Gemini API key to enable scene generation, or switch to Ollama for offline use.'}
            </p>
          </div>
        </div>
        {!ready && (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenApiKey}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition cursor-pointer"
            >
              <Key className="w-3 h-3" />
              <span>Enter Gemini API Key</span>
            </button>
            {provider === 'ollama' && (
              <button
                type="button"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-300 bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition cursor-pointer"
              >
                <Cpu className="w-3 h-3" />
                <span>Switch to Ollama</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Engine Picker */}
      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Choose an Engine</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {(['svg', 'worlds', 'pixel'] as RenderFormat[]).map((f) => {
            const isActive = localFormat === f;
            const iconMap: Record<RenderFormat, React.FC<{ className?: string }>> = {
              svg: Shapes,
              worlds: Cuboid,
              pixel: Grid3X3,
            };
            const Icon = iconMap[f];
            const labels: Record<RenderFormat, string> = {
              svg: 'SVG Vector',
              worlds: 'Worlds 3D',
              pixel: 'Pixel Art',
            };
            const accents: Record<RenderFormat, string> = {
              svg: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
              worlds: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5',
              pixel: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
            };
            return (
              <button
                key={f}
                type="button"
                onClick={() => handleSetFormat(f)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl text-xs transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-500/10 border-indigo-500/20 shadow-sm shadow-indigo-950/20'
                    : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  accents[f]
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="font-semibold text-zinc-200 group-hover:text-white">
                  {labels[f]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Starters */}
      <div className="mb-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Quick Start</h3>
        <p className="text-xs text-zinc-500 mb-3">
          Pick a starter to generate your first scene instantly, or type your own below.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STARTERS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => handleStartStarter(s)}
              disabled={!ready}
              className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer disabled:opacity-50 ${
                ready
                  ? 'bg-white/[0.02] border-white/[0.06] hover:border-indigo-500/30 hover:bg-white/[0.05]'
                  : 'bg-white/[0.01] border-white/[0.04]'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2.5 ${s.accent}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-sm text-zinc-100 group-hover:text-white mb-1">
                {s.title}
              </h4>
              <p className="text-[11px] text-zinc-500 line-clamp-2 mb-2.5">{s.description}</p>
              <div className="flex items-center gap-1.5 pt-2 border-t border-white/[0.05]">
                <Play className="w-3 h-3 text-indigo-400 group-hover:text-indigo-300" />
                <span className="text-[10px] font-mono text-indigo-400 group-hover:text-indigo-300">
                  Generate
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Or type your own */}
      <div className="pt-4 border-t border-white/[0.06]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Or Describe Your Own Scene</h3>
        <div className="relative">
          <input
            type="text"
            placeholder="e.g. A coffee cart on a street corner at dusk"
            className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none transition"
            disabled={!ready}
          />
          <button
            type="button"
            onClick={() => {
              // Handled by parent via onStartScene with the local prompt
              // This is a placeholder - the actual input is in the parent
            }}
            disabled
            className="absolute right-1 top-1 px-2 py-1 rounded-lg text-xs text-zinc-500"
          >
            Use above
          </button>
        </div>
        <p className="text-[10px] text-zinc-500 mt-2">
          {ready ? 'Type a scene description and press Enter to create it.' : 'Configure an AI model above to enable custom prompts.'}
        </p>
      </div>
    </div>
  );
};

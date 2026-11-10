import React from 'react';
import { Sparkles, Loader2, Shapes, Cuboid, Grid3X3, Layers, Wand2, Undo2, X, Compass, Terminal } from 'lucide-react';
import { RenderFormat, LLMProvider, OllamaModelInfo } from '../types';

interface PromptBarProps {
  prompt: string;
  setPrompt: (p: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  onEnhance: () => void;
  isEnhancing: boolean;
  enhancedNotice?: { wordsAdded: number; previousPrompt: string } | null;
  onUndoEnhance?: () => void;
  format: RenderFormat;
  provider: LLMProvider;
  geminiModel: string;
  setGeminiModel: (m: string) => void;
  ollamaModel: string;
  setOllamaModel: (m: string) => void;
  ollamaModels: OllamaModelInfo[];
  size: 'hero' | 'card' | 'mini';
  setSize: (s: 'hero' | 'card' | 'mini') => void;
}

const SVG_SUGGESTIONS = [
  'A seaside lighthouse island with breathing waves and a boat on a lap that docks at the pier',
  'A busy container harbour quay with a gantry crane lifting cargo and a tractor stopping at a gate',
  'A rocket launchpad at night with floodlights and arm gantry swinging back for liftoff',
  'A retro coffee cart on a street corner with a barista pulling shots and a cat on a chair',
  'A round hilltop observatory with a turning dome and telescope looking at the stars',
];

const WORLDS_SUGGESTIONS = [
  'A morning bakery with a baker rolling dough on a flour-dusted bench beside a brick oven',
  'A florist arranging vibrant bouquets in a flower stall with planted feet and cloth movements',
  'A patient potter drawing hands slowly up a spinning clay vessel on a wheel in an open-air studio',
  'A street juggler performing a 3-ball cascade with palms catching and releasing balls in rhythm',
  'A cricket match in an English countryside pavilion with a batsman swinging at wickets',
];

const PIXEL_SUGGESTIONS = [
  'A flower stall on wet cobblestone with buckets of tulips, sunflowers, and an awning in the wind',
  'A peaceful riverside allotment with raised vegetable patches, a potting shed, and a weathercock',
  'An old wooden fishing pier jutting into calm water with drying nets and a gull on a bollard',
  'A cozy village bakery with warm lantern glow, chimney smoke puffing, and a delivery bicycle',
];

const DITHER_SUGGESTIONS = [
  'A weathered mountain forge with an anvil, water wheel turning, glowing embers, and iron ingots',
  'A solitary cliffside lighthouse in storm winds with revolving beam and wave spray hitting rocks',
  'A traditional hillside tea house with bamboo railings, stone lanterns, and raked gravel garden',
  'A rural Dutch windmill with turning four-blade sail, wooden canal sluice, and swimming ducks',
];

export const PromptBar: React.FC<PromptBarProps> = ({
  prompt,
  setPrompt,
  onGenerate,
  isGenerating,
  onEnhance,
  isEnhancing,
  enhancedNotice,
  onUndoEnhance,
  format,
  provider,
  geminiModel,
  setGeminiModel,
  ollamaModel,
  setOllamaModel,
  ollamaModels,
  size,
  setSize,
}) => {
  const suggestions =
    format === 'svg'
      ? SVG_SUGGESTIONS
      : format === 'worlds'
      ? WORLDS_SUGGESTIONS
      : format === 'pixel'
      ? PIXEL_SUGGESTIONS
      : DITHER_SUGGESTIONS;

  const placeholders: Record<RenderFormat, string> = {
    svg: 'Describe an isometric Any3d scene... (e.g. Airport with planes running on the runway)',
    worlds: 'Describe an Any3d Three.js narrative world... (e.g. A craftsman carving wood in a sunlit workshop)',
    pixel: 'Describe a 320×240 Any3d pixel art scene... (e.g. A sunlit flower stall with potted hydrangeas and blooming petunias)',
    dither: 'Describe an Any3d 4×4 ordered dither scene... (e.g. A hillside forge with hammer clinking and water wheel spinning)',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    onGenerate();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
      e.preventDefault();
      if (prompt.trim() && !isGenerating) {
        onGenerate();
      }
    }
  };

  return (
    <div className="border-b border-white/[0.08] bg-[#0c0e17]/80 backdrop-blur-md p-3 shrink-0">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 max-w-[1920px] mx-auto">
        <div className="flex gap-2.5 items-center">
          {/* Main Prompt Input Capsule */}
          <div className="relative flex-1 flex items-center group">
            <div className="absolute left-3.5 pointer-events-none text-zinc-500 group-focus-within:text-indigo-400 transition">
              <Terminal className="w-4 h-4" />
            </div>
            <input
              type="text"
              aria-label="Describe the scene to generate"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholders[format]}
              className={`w-full bg-[#11131f]/90 border rounded-2xl pl-10 pr-36 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none transition-all shadow-inner ${
                enhancedNotice
                  ? 'border-purple-500/80 ring-2 ring-purple-500/20'
                  : 'border-white/[0.08] focus:border-indigo-500/80 focus:ring-2 focus:ring-indigo-500/20 hover:border-white/[0.15]'
              }`}
            />

            {/* Clear Button */}
            {prompt.length > 0 && (
              <button
                type="button"
                onClick={() => setPrompt('')}
                title="Clear prompt"
                className="absolute right-28 p-1 text-zinc-500 hover:text-zinc-300 rounded-full hover:bg-white/[0.06] transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Enhance Prompt Action Capsule */}
            <div className="absolute right-2 flex items-center gap-1.5">
              {enhancedNotice && onUndoEnhance && (
                <button
                  type="button"
                  onClick={onUndoEnhance}
                  title="Undo prompt enhancement"
                  className="flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-medium bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/[0.08] transition"
                >
                  <Undo2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Undo</span>
                </button>
              )}
              <button
                type="button"
                onClick={onEnhance}
                disabled={!prompt.trim() || isEnhancing || isGenerating}
                title="Nuanced AI expansion with architectural layout, kinetic loops, and lighting"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-40 text-white transition shadow-sm border border-purple-400/30 group cursor-pointer"
              >
                {isEnhancing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-200" />
                    <span className="hidden sm:inline">Enhancing…</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5 text-purple-200 group-hover:rotate-12 transition transform" />
                    <span>Enhance</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Model Selector Dropdown */}
          <div className="flex items-center">
            {provider === 'gemini' ? (
              <select
                aria-label="Gemini model"
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="bg-[#11131f]/90 border border-white/[0.08] hover:border-white/[0.15] rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition cursor-pointer font-medium"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro (Deep)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            ) : (
              <select
                aria-label="Ollama model"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                className="bg-[#11131f]/90 border border-white/[0.08] hover:border-white/[0.15] rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition cursor-pointer max-w-[260px] font-medium"
              >
                {ollamaModels.length > 0 ? (
                  [...ollamaModels]
                    .filter((m) => !m.name.includes('embed'))
                    .sort((a, b) => a.size - b.size)
                    .map((m) => {
                      const gb = (m.size / 1e9).toFixed(1);
                      const isLightweight = m.size < 2.2e9;
                      const isHeavy = m.size >= 4.5e9;
                      const badge = isLightweight ? '⚡ Low RAM' : isHeavy ? '⚠️ Heavy' : 'OK';
                      return (
                        <option key={m.name} value={m.name}>
                          {m.name} ({gb}GB · {badge})
                        </option>
                      );
                    })
                ) : (
                  <>
                    <option value="qwen2.5-coder:1.5b">qwen2.5-coder:1.5b (1.0GB · ⚡ Low RAM)</option>
                    <option value="qwen2.5-coder:7b">qwen2.5-coder:7b (4.7GB · ⚠️ Heavy)</option>
                    <option value="llama3.2:latest">llama3.2:latest (2.0GB)</option>
                  </>
                )}
              </select>
            )}
          </div>

          {/* Format Metadata Badges / Size Selectors */}
          {format === 'svg' ? (
            <div className="flex items-center p-0.5 rounded-xl bg-[#11131f]/90 border border-white/[0.08] text-xs">
              {(['hero', 'card', 'mini'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  className={`px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer capitalize ${
                    size === s ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          ) : format === 'pixel' ? (
            <div className="hidden sm:flex items-center px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono text-amber-300">
              320×240 · 24fps
            </div>
          ) : format === 'dither' ? (
            <div className="hidden sm:flex items-center px-2.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-mono text-cyan-300">
              360×280 · 4×4
            </div>
          ) : (
            <div className="hidden sm:flex items-center px-2.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-mono text-indigo-300">
              Three.js · Ortho
            </div>
          )}

          {/* Generate Action Button */}
          <button
            type="submit"
            disabled={!prompt.trim() || isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-40 transition shadow-lg shadow-indigo-600/30 border border-white/10 shrink-0 cursor-pointer active:scale-[0.98]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Crafting…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-cyan-300" />
                <span>Generate</span>
                <kbd className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-black/30 text-indigo-200 border border-white/10">
                  ⏎
                </kbd>
              </>
            )}
          </button>
        </div>

        {/* Quick Suggestion Chips Carousel */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto text-[11px] text-zinc-400 no-scrollbar py-0.5">
          <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
            <span className="flex items-center gap-1 text-zinc-500 font-medium shrink-0 pr-1">
              <Compass className="w-3 h-3 text-indigo-400" />
              <span>Inspirations:</span>
            </span>
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setPrompt(s)}
                className="shrink-0 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] hover:border-white/[0.12] text-zinc-400 hover:text-zinc-200 transition-all truncate max-w-[320px] cursor-pointer"
              >
                {s}
              </button>
            ))}
          </div>

          {enhancedNotice && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-[11px] font-mono text-purple-300 shrink-0 animate-fade-in">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Enhanced (+{enhancedNotice.wordsAdded} words of nuance)</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

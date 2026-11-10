import React, { useState, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  Shapes,
  Cuboid,
  Grid3X3,
  Layers,
  Cpu,
  Key,
  ShieldCheck,
  Download,
  Box,
  Wand2,
  CornerDownLeft,
  ChevronDown,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { RenderFormat, LLMProvider, OllamaModelInfo, PresetScene } from '../types';

interface HomepageProps {
  onStartScene: (prompt: string, format: RenderFormat, size: 'hero' | 'card' | 'mini') => void;
  format: RenderFormat;
  setFormat: (f: RenderFormat) => void;
  size: 'hero' | 'card' | 'mini';
  setSize: (s: 'hero' | 'card' | 'mini') => void;
  provider: LLMProvider;
  setProvider: (p: LLMProvider) => void;
  ollamaModel: string;
  setOllamaModel: (m: string) => void;
  ollamaModels: OllamaModelInfo[];
  geminiModel: string;
  setGeminiModel: (m: string) => void;
  hasApiKey: boolean;
  onOpenApiKey: () => void;
  onOpenGallery: () => void;
  isGenerating: boolean;
  onEnhancePrompt: (promptText: string) => Promise<string | void>;
  presets: PresetScene[];
  onSelectPreset: (preset: PresetScene) => void;
}

interface InspirationItem {
  id: string;
  title: string;
  format: RenderFormat;
  description: string;
  prompt: string;
  badge: string;
  accent: string;
  bgGlow: string;
}

const INSPIRATIONS: InspirationItem[] = [
  {
    id: 'coffee-cart',
    title: 'Retro Tokyo Coffee Cart',
    format: 'svg',
    description: 'A cozy corner coffee cart with steam rising, a barista pulling espresso shots, and a calm street cat sitting on a stool.',
    prompt: 'A retro coffee cart on a street corner with a barista pulling shots and a cat on a chair',
    badge: 'SVG Vector',
    accent: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    bgGlow: 'from-emerald-500/10 via-transparent to-transparent',
  },
  {
    id: 'rocket-complex',
    title: 'Orbital Rocket Launchpad',
    format: 'worlds',
    description: 'Nocturnal launch complex with articulated gantry swing arms, floodlights cutting through mist, and flame trench.',
    prompt: 'A rocket launchpad at night with floodlights and arm gantries, a towering orbital rocket ready on the pad',
    badge: 'Worlds 3D',
    accent: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
    bgGlow: 'from-indigo-500/10 via-transparent to-transparent',
  },
  {
    id: 'lighthouse-island',
    title: 'Seaside Lighthouse Atoll',
    format: 'svg',
    description: 'An isolated stone lighthouse on jagged wave-swept rocks with rotating Fresnel beam, seabirds, and tide pools.',
    prompt: 'A seaside lighthouse island with breathing waves and a turning beacon light',
    badge: 'SVG Vector',
    accent: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    bgGlow: 'from-cyan-500/10 via-transparent to-transparent',
  },
  {
    id: 'village-bakery',
    title: 'Morning Village Bakery',
    format: 'worlds',
    description: 'Warm street patisserie with fresh baguette displays, glowing brick oven chimney, striped awning, and outdoor cafe table.',
    prompt: 'A warm morning village bakery with pastry displays, glowing brick oven, and striped canopy awning',
    badge: 'Worlds 3D',
    accent: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    bgGlow: 'from-amber-500/10 via-transparent to-transparent',
  },
  {
    id: 'cyberpunk-alley',
    title: 'Neon Cyberpunk Noodle Bar',
    format: 'pixel',
    description: 'Densely packed rainy night alley with glowing holographic signage, steaming ramen counter, and vintage vending machines.',
    prompt: 'A cyberpunk ramen shop with glowing neon signs, steam rising from broth kettles, and wet asphalt reflections',
    badge: 'Pixel Art',
    accent: 'text-fuchsia-400 border-fuchsia-500/30 bg-fuchsia-500/10',
    bgGlow: 'from-fuchsia-500/10 via-transparent to-transparent',
  },
  {
    id: 'floating-citadel',
    title: 'Floating Sky Citadel',
    format: 'dither',
    description: 'Ancient monolithic fortress ruins suspended on an aerated floating rock chunk with cascading vines and atmospheric clouds.',
    prompt: 'An ancient fortress floating on a rock island in the clouds with hanging ruins and dithered shadows',
    badge: '4×4 Dither',
    accent: 'text-sky-400 border-sky-500/30 bg-sky-500/10',
    bgGlow: 'from-sky-500/10 via-transparent to-transparent',
  },
];

const QUICK_PROMPTS = [
  'A cozy retro coffee cart with a sleeping cat',
  'A nocturnal rocket launchpad with gantry arms',
  'A seaside lighthouse island with waves',
  'A Japanese hot spring onsen pavilion',
  'A high-tech sci-fi research lab with holograms',
  'A mountain watermill forge with spinning wheel',
];

export const Homepage: React.FC<HomepageProps> = ({
  onStartScene,
  format,
  setFormat,
  size,
  setSize,
  provider,
  setProvider,
  ollamaModel,
  setOllamaModel,
  ollamaModels,
  geminiModel,
  setGeminiModel,
  hasApiKey,
  onOpenApiKey,
  onOpenGallery,
  isGenerating,
  onEnhancePrompt,
  presets,
  onSelectPreset,
}) => {
  const [localPrompt, setLocalPrompt] = useState('');
  const [isEnhancingLocal, setIsEnhancingLocal] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle Enter key for submission (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = localPrompt.trim();
    if (!trimmed || isGenerating) return;
    onStartScene(trimmed, format, size);
  };

  const handleEnhance = async () => {
    const trimmed = localPrompt.trim();
    if (!trimmed || isEnhancingLocal) return;
    setIsEnhancingLocal(true);
    try {
      const res = await onEnhancePrompt(trimmed);
      if (res) {
        setLocalPrompt(res);
      }
    } finally {
      setIsEnhancingLocal(false);
    }
  };

  const handleSelectQuickPrompt = (p: string) => {
    setLocalPrompt(p);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleLaunchInspiration = (item: InspirationItem) => {
    setFormat(item.format);
    // If a matching preset exists in our presets library, we can load it directly
    const match = presets.find((p) => p.format === item.format && (p.name.includes(item.id) || item.prompt.toLowerCase().includes(p.name.toLowerCase())));
    if (match) {
      onSelectPreset(match);
    } else {
      onStartScene(item.prompt, item.format, size);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-[#090b11] text-zinc-100 relative selection:bg-indigo-500/30">
      {/* Ambient Radial Mesh Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-indigo-600/10 via-purple-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-12 pb-20 flex flex-col items-center">
        {/* Top Product Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-medium mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">Any3d v2.0</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400">Offline-First Isometric & 3D Generator</span>
        </div>

        {/* Hero Headline (ChatGPT/Claude/Perplexity Style) */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-center text-white mb-3">
          What 3D world will you create today?
        </h1>
        <p className="text-sm sm:text-base text-zinc-400 text-center max-w-2xl mb-8 leading-relaxed">
          Sculpt isometric scenes, mechanical contraptions, and procedural environments.
          Export directly to binary <span className="text-indigo-300 font-mono font-medium">.GLB</span> for Blender/Unity or standalone <span className="text-emerald-300 font-mono font-medium">HTML</span>.
        </p>

        {/* Primary Command Capsule */}
        <div className="w-full bg-[#0d0f1a] border border-white/[0.12] focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-2xl p-3 shadow-2xl transition-all mb-4 relative group">
          {/* Main Textarea */}
          <textarea
            ref={textareaRef}
            aria-label="Describe the 3D scene you want to create"
            value={localPrompt}
            onChange={(e) => setLocalPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe an isometric scene, vehicle, architectural vignette, or scene..."
            rows={3}
            className="w-full bg-transparent text-sm sm:text-base text-zinc-100 placeholder-zinc-500 resize-none outline-none leading-relaxed p-1.5 font-sans"
          />

          {/* Capsule Bottom Action Bar */}
          <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2.5">
            {/* Left Controls: Engine Format Selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Format Segmented Buttons */}
              <div className="flex items-center p-0.5 rounded-xl bg-zinc-950/80 border border-white/[0.08] text-xs">
                <button
                  type="button"
                  onClick={() => setFormat('svg')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    format === 'svg'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Shapes className="w-3 h-3" />
                  <span>SVG</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('worlds')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    format === 'worlds'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Cuboid className="w-3 h-3" />
                  <span>Worlds 3D</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('pixel')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    format === 'pixel'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Grid3X3 className="w-3 h-3" />
                  <span>Pixel</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('dither')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                    format === 'dither'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Dither</span>
                </button>
              </div>

              {/* Size Selector */}
              <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-zinc-950/80 border border-white/[0.08] text-xs">
                {(['hero', 'card', 'mini'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`px-2 py-1 rounded-lg font-medium capitalize transition cursor-pointer ${
                      size === s
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {/* Provider Indicator Chip */}
              <button
                type="button"
                onClick={onOpenApiKey}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-950/80 hover:bg-zinc-800 border border-white/[0.08] text-xs text-zinc-300 transition cursor-pointer"
                title="Change AI model provider or settings"
              >
                <div className={`w-1.5 h-1.5 rounded-full ${provider === 'ollama' || hasApiKey ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span className="font-mono text-[11px] truncate max-w-[120px]">
                  {provider === 'ollama' ? (ollamaModel || 'Ollama') : geminiModel}
                </span>
                <ChevronDown className="w-3 h-3 text-zinc-500" />
              </button>
            </div>

            {/* Right Controls: Enhance & Submit Button */}
            <div className="flex items-center gap-2 ml-auto">
              {/* Enhance Prompt Button */}
              <button
                type="button"
                onClick={handleEnhance}
                disabled={!localPrompt.trim() || isEnhancingLocal}
                title="Enrich prompt with architectural and material details"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-200 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 disabled:opacity-40 transition cursor-pointer"
              >
                <Wand2 className={`w-3.5 h-3.5 ${isEnhancingLocal ? 'animate-spin' : ''}`} />
                <span>{isEnhancingLocal ? 'Enhancing…' : 'Enhance'}</span>
              </button>

              {/* Create Scene Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!localPrompt.trim() || isGenerating}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 transition shadow-lg shadow-indigo-600/30 border border-white/10 cursor-pointer active:scale-[0.98]"
              >
                <span>{isGenerating ? 'Creating…' : 'Create Scene'}</span>
                <CornerDownLeft className="w-3.5 h-3.5 opacity-80" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-2 flex-wrap justify-center mb-12">
          <span className="text-xs text-zinc-500 font-medium">Try:</span>
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectQuickPrompt(qp)}
              className="text-xs px-2.5 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/[0.06] transition cursor-pointer"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Section Heading: Curated Inspirations */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
              Curated Inspirations
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenGallery}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition cursor-pointer"
          >
            <span>View all {presets.length} presets</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Inspiration Bento Grid (6 Cards) */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-14">
          {INSPIRATIONS.map((item) => (
            <div
              key={item.id}
              onClick={() => handleLaunchInspiration(item)}
              className="group relative bg-[#0c0e17] hover:bg-[#10131f] border border-white/[0.08] hover:border-white/[0.18] rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl hover:shadow-indigo-950/20"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${item.bgGlow} pointer-events-none rounded-tr-2xl`} />

              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${item.accent}`}>
                    {item.badge}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                    Any3d
                  </span>
                </div>

                <h3 className="font-bold text-sm text-zinc-100 group-hover:text-white mb-1.5 transition">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4 line-clamp-2">
                  {item.description}
                </p>
              </div>

              <div className="pt-2 border-t border-white/[0.05] flex items-center justify-between text-xs text-indigo-400 font-semibold group-hover:text-indigo-300">
                <span>Create this scene</span>
                <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {/* Feature Highlights / Capabilities Row */}
        <div className="w-full border-t border-white/[0.08] pt-8">
          <div className="text-center mb-6">
            <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
              Production Capabilities
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-200 mb-0.5">100% Offline with Ollama</h4>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Runs local quantized models like Qwen2.5-Coder without internet or token costs.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0">
                <Box className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-200 mb-0.5">Binary .GLB 3D Export</h4>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Export complete 3D meshes ready for Blender, Unreal Engine, Godot, or Three.js.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-200 mb-0.5">Zero-Dependency HTML</h4>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Download self-contained single-file HTML bundles with embedded runtime and shaders.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-200 mb-0.5">Deterministic Validation</h4>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  12 geometric, camera, and security checks ensure zero-runtime failures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

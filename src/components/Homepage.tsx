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
  Clock,
  Play,
  Image,
  Search,
  ExternalLink,
} from 'lucide-react';
import { RenderFormat, LLMProvider, OllamaModelInfo, PresetScene, VisualReference, WebPresentationSize } from '../types';
import { SceneSession } from './Sidebar';
import { PresetPreview } from './PresetPreview';

interface HomepageProps {
  onStartScene: (prompt: string, format: RenderFormat, size: WebPresentationSize) => void;
  format: RenderFormat;
  setFormat: (f: RenderFormat) => void;
  size: WebPresentationSize;
  setSize: (s: WebPresentationSize) => void;
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
  sessions?: SceneSession[];
  onSelectSession?: (session: SceneSession) => void;
}

/**
 * The home grid used to be six written prompts with no scenes attached. It now
 * shows six real presets, each running live, so what you click is what you get —
 * the prompt deck still exists in the composer for people who want to write.
 */
const FEATURED_PRESET_IDS = [
  'svg-harbour',
  'worlds-pottery-studio',
  'pixel-flower-stall',
  'svg-foodtruck',
  'worlds-cricket',
  'svg-greenhouse',
];

const QUICK_PROMPTS = [
  'A cozy retro coffee cart with a sleeping cat',
  'A nocturnal rocket launchpad with gantry arms',
  'A seaside lighthouse island with waves',
  'A Japanese hot spring onsen pavilion',
  'A high-tech sci-fi research lab with holograms',
  'A mountain watermill forge with spinning wheel',
];

const FORMAT_ICONS: Record<RenderFormat, React.FC<{ className?: string }>> = {
  svg: Shapes,
  worlds: Cuboid,
  pixel: Grid3X3,
};

const formatLabel = (format: RenderFormat) =>
  format === 'worlds' ? 'Three.js' : format === 'svg' ? 'SVG vector' : 'Pixel';

const FORMAT_BADGES: Record<RenderFormat, string> = {
  svg: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  worlds: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
  pixel: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
};

function formatRelativeTime(ts?: number): string {
  if (!ts) return 'recently';
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

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
  sessions = [],
  onSelectSession,
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

  const featuredPresets = (() => {
    const picked = FEATURED_PRESET_IDS.map((id) => presets.find((p) => p.id === id)).filter(
      (p): p is PresetScene => Boolean(p),
    );
    if (picked.length >= 3) return picked;
    // A build without those ids still has scenes to show.
    return presets.slice(0, 6);
  })();

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
            {/* Left Controls: Size Selector & Provider Indicator */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Size Selector */}
              <div className="flex items-center p-0.5 rounded-xl bg-zinc-950/80 border border-white/[0.08] text-xs">
                {(['hero', 'card'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    title={s === 'hero' ? 'Webpage Hero Section (Wide 16:9 banner)' : 'Website Feature Card (Compact 4:3 component)'}
                    className={`px-3 py-1 rounded-lg font-medium capitalize transition cursor-pointer ${
                      size === s
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {s === 'hero' ? 'Hero' : 'Card'}
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
        <div className="flex items-center gap-2 flex-wrap justify-center mb-8">
          <span className="text-xs text-zinc-500 font-medium">Try:</span>
          {QUICK_PROMPTS.map((qp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectQuickPrompt(qp)}
              className="text-xs px-2.5 py-1 rounded-full bg-white/[0.03] hover:bg-white/[0.08] text-zinc-400 hover:text-zinc-200 border border-white/[0.06] transition cursor-pointer active:scale-95"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Jump Back In / Recent Projects Row (Visible when user has saved scenes) */}
        {sessions.length > 0 && (
          <div className="w-full mb-10">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">
                  Jump Back In
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
                  {sessions.length} {sessions.length === 1 ? 'scene' : 'scenes'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {sessions.slice(0, 6).map((sess, idx) => {
                const Icon = FORMAT_ICONS[sess.format] || Shapes;
                return (
                  <button
                    key={`${sess.id}-${idx}`}
                    type="button"
                    onClick={() => onSelectSession?.(sess)}
                    className="group flex flex-col justify-between p-3.5 rounded-2xl bg-[#0c0e17] hover:bg-[#111422] border border-white/[0.08] hover:border-indigo-500/35 transition-all text-left cursor-pointer shadow-sm hover:shadow-lg hover:shadow-indigo-950/25"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border ${FORMAT_BADGES[sess.format]}`}>
                          <Icon className="w-2.5 h-2.5" />
                          <span className="uppercase">{sess.format}</span>
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {formatRelativeTime(sess.updatedAt)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-xs text-zinc-100 group-hover:text-white line-clamp-1 mb-1 transition">
                        {sess.title}
                      </h3>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">
                        {sess.messages?.length ? `${sess.messages.length} messages` : '1 version'}
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-indigo-400 group-hover:text-indigo-300 font-medium">
                      <span>Resume workspace</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Section Heading: Curated Inspirations */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-400" />
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300">Curated scenes</h2>
              <p className="mt-1 text-xs text-zinc-500">
                Six of the {presets.length} presets, running live. Click one to open it.
              </p>
            </div>
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

        {/* Featured presets: real scenes, drawn by their own runtimes — not a
            written description of a scene you have not seen yet. */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-14">
          {featuredPresets.map((preset) => {
            const Icon = FORMAT_ICONS[preset.format];
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                aria-label={`Open ${preset.title}`}
                className="group relative flex flex-col rounded-2xl border border-white/[0.08] bg-[#0c0e17] p-2.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-white/[0.18] hover:shadow-xl hover:shadow-indigo-950/20 cursor-pointer"
              >
                <div className="relative">
                  <PresetPreview preset={preset} footer={false} lazy aspect="aspect-[4/3]" />
                  {/* The arrow rides the picture instead of the title row: it was
                      costing the title the width it needed to fit on one line. */}
                  <span className="pointer-events-none absolute right-1.5 top-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-1 pb-0.5 pt-2.5">
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-mono font-semibold uppercase ${FORMAT_BADGES[preset.format]}`}
                  >
                    <Icon className="h-2.5 w-2.5" />
                    {preset.format === 'worlds' ? '3D' : preset.format}
                  </span>
                  <span className="truncate text-[13px] font-semibold text-zinc-100 group-hover:text-white">
                    {preset.title}
                  </span>
                </div>
                {/* The same line on every card: mixing a prose blurb with a meta
                    line made one card taller and the row's bottoms uneven. The
                    prose belongs where there is room for it — the gallery pane. */}
                <p className="truncate px-1 pb-1 pt-0.5 text-[11px] leading-5 text-zinc-500">
                  {formatLabel(preset.format)} scene · {preset.code.split(String.fromCharCode(10)).length} lines
                </p>
              </button>
            );
          })}
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

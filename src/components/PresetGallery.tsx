import React, { useState } from 'react';
import { X, Check, Shapes, Cuboid, Grid3X3, Sparkles, Search } from 'lucide-react';
import { PresetScene, RenderFormat } from '../types';

interface PresetGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  presets: PresetScene[];
  currentId: string;
  onSelectPreset: (preset: PresetScene) => void;
  /** Start a fresh project from this preset instead of loading it in place. */
  onRemixPreset?: (preset: PresetScene) => void;
}

const ENGINE_LABELS: Record<
  RenderFormat,
  { label: string; icon: React.FC<{ className?: string }>; badgeStyle: string }
> = {
  svg: {
    label: 'SVG Vector',
    icon: Shapes,
    badgeStyle: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  },
  worlds: {
    label: 'Three.js 3D',
    icon: Cuboid,
    badgeStyle: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
  },
  pixel: {
    label: 'Pixel Art',
    icon: Grid3X3,
    badgeStyle: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  },
  dither: {
    label: '4×4 Dither',
    icon: Sparkles,
    badgeStyle: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  },
};

export const PresetGallery: React.FC<PresetGalleryProps> = ({
  isOpen,
  onClose,
  presets,
  currentId,
  onSelectPreset,
  onRemixPreset,
}) => {
  const [filter, setFilter] = useState<RenderFormat | 'all'>('all');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = presets.filter((p) => {
    const matchesFormat = filter === 'all' || p.format === filter;
    const matchesSearch =
      !search.trim() ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase());
    return matchesFormat && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="bg-[#0e101a] border border-white/[0.08] rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl shadow-indigo-950/40 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-white/[0.08] flex items-center justify-between bg-[#0a0c13]/80">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Any3d Benchmark Gallery</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.08]">
                {presets.length} Presets Available
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              Production-tested architectural scenes across SVG Vector, Three.js 3D, Pixel Art, and Ordered Dither engines.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Engine Filter Tabs & Search Bar */}
        <div className="px-6 py-2.5 border-b border-white/[0.06] bg-[#0c0e17] flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold uppercase transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-zinc-800 text-white shadow-sm border border-white/10'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              All ({presets.length})
            </button>
            {(['svg', 'worlds', 'pixel', 'dither'] as const).map((fmt) => {
              const count = presets.filter((p) => p.format === fmt).length;
              const cfg = ENGINE_LABELS[fmt];
              const Icon = cfg.icon;
              const isActive = filter === fmt;
              return (
                <button
                  key={fmt}
                  onClick={() => setFilter(fmt)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold uppercase transition cursor-pointer ${
                    isActive
                      ? 'bg-zinc-800 text-white shadow-sm border border-white/10'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cfg.label}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="relative flex items-center min-w-[200px] max-w-xs flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 pointer-events-none" />
            <input
              type="text"
              aria-label="Filter presets"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter presets..."
              className="w-full bg-[#121422] border border-white/[0.08] focus:border-indigo-500/80 rounded-xl pl-8 pr-3 py-1 text-xs text-zinc-100 placeholder-zinc-500 outline-none transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 p-0.5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Presets Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((preset) => {
            const isSelected = preset.id === currentId;
            const cfg = ENGINE_LABELS[preset.format];
            const Icon = cfg?.icon || Shapes;

            return (
              <div
                key={preset.id}
                onClick={() => {
                  onSelectPreset(preset);
                  onClose();
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99] ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/25 shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500/40'
                    : 'border-white/[0.06] hover:border-indigo-500/40 bg-white/[0.02] hover:bg-white/[0.05] shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-zinc-100 group-hover:text-white transition">
                      {preset.title}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        cfg?.badgeStyle || 'bg-zinc-800 text-zinc-300'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{preset.format}</span>
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">presets/{preset.format}/{preset.name}.js</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between gap-2 text-xs text-zinc-500">
                  <span className="font-mono text-[11px]">{preset.code.split('\n').length} lines of code</span>
                  <div className="flex items-center gap-2">
                    {onRemixPreset && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemixPreset(preset);
                          onClose();
                        }}
                        title="Start a new project from this preset"
                        className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.08] transition cursor-pointer"
                      >
                        Remix
                      </button>
                    )}
                    <span className="text-indigo-400 font-medium group-hover:text-indigo-300 transition flex items-center gap-1">
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-semibold">Active Scene</span>
                        </>
                      ) : (
                        'Load Scene →'
                      )}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

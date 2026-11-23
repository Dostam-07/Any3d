import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { X, Check, Shapes, Cuboid, Grid3X3, Sparkles, Search } from 'lucide-react';
import { PresetScene, RenderFormat } from '../types';
import { PresetPreview } from './PresetPreview';

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
  { label: string; short: string; icon: React.FC<{ className?: string }>; badgeStyle: string }
> = {
  svg: {
    label: 'SVG Vector',
    short: 'SVG',
    icon: Shapes,
    badgeStyle: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  },
  worlds: {
    label: 'Three.js 3D',
    short: '3D',
    icon: Cuboid,
    badgeStyle: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30',
  },
  pixel: {
    label: 'Pixel Art',
    short: 'Pixel',
    icon: Grid3X3,
    badgeStyle: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
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
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  // The preview follows the pointer; the first row shows until the user hovers
  // another, so the pane is never a blank rectangle.
  const [previewId, setPreviewId] = useState<string | null>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Memoised: this array is a dependency of the focus effect, and a fresh array on
  // every render kept resetting the keyboard focus to the first row.
  const filtered = useMemo(
    () =>
      presets.filter((p) => {
        const matchesFormat = filter === 'all' || p.format === filter;
        const matchesSearch =
          !search.trim() ||
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.name.toLowerCase().includes(search.toLowerCase());
        return matchesFormat && matchesSearch;
      }),
    [presets, filter, search],
  );

  const previewPreset = filtered.find((p) => p.id === previewId) ?? filtered[0] ?? null;

  // Enter loads whatever the preview pane is showing, so the keyboard and the
  // pointer agree even when the user never touched the arrow keys.
  const selectFocused = useCallback(() => {
    const target = focusedIndex != null ? filtered[focusedIndex] : previewPreset;
    if (!target) return;
    onSelectPreset(target);
    onClose();
  }, [filtered, focusedIndex, previewPreset, onSelectPreset, onClose]);

  // Keyboard navigation: arrow keys move focus, Enter selects, Escape closes.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        selectFocused();
        return;
      }
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        setFocusedIndex((i) => {
          const next = (i == null ? -1 : i) + 1;
          return next < filtered.length ? next : filtered.length - 1;
        });
        return;
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        setFocusedIndex((i) => {
          const prev = (i == null ? filtered.length : i) - 1;
          return prev >= 0 ? prev : 0;
        });
        return;
      }
      if (e.key === 'Home') {
        e.preventDefault();
        setFocusedIndex(filtered.length > 0 ? 0 : null);
        return;
      }
      if (e.key === 'End') {
        e.preventDefault();
        setFocusedIndex(filtered.length > 0 ? filtered.length - 1 : null);
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered.length, selectFocused, onClose]);

  // Clear the keyboard cursor when the list changes, instead of parking it on the
  // first row: a focus ring on a row the user never selected read as a second
  // selection beside the one the preview pane was actually showing.
  useEffect(() => {
    setFocusedIndex(null);
  }, [filtered]);

  // Scroll the focused card into view.
  useEffect(() => {
    if (focusedIndex != null) {
      cardRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest' });
    }
  }, [focusedIndex]);

  if (!isOpen) return null;

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Search className="w-8 h-8 text-zinc-600 mb-3" />
      <p className="text-zinc-500 text-sm mb-1">No presets match your filter.</p>
      <p className="text-xs text-zinc-500 max-w-xs mb-4">
        Try clearing the search or choosing a different engine filter.
      </p>
      <button
        onClick={() => {
          setSearch('');
          setFilter('all');
        }}
        className="px-4 py-2 rounded-lg text-xs font-medium text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition cursor-pointer"
      >
        Clear filters
      </button>
    </div>
  );

  const gridContent =
    filtered.length === 0
      ? emptyState
      : filtered.map((preset, index) => {
          const isSelected = preset.id === currentId;
          const isPreviewed = previewPreset?.id === preset.id;
          const cfg = ENGINE_LABELS[preset.format];
          const Icon = cfg?.icon || Shapes;
          const isFocused = focusedIndex === index;

          return (
            <div
              key={preset.id}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              tabIndex={isFocused ? 0 : -1}
              onClick={() => {
                setFocusedIndex(index);
                onSelectPreset(preset);
                onClose();
              }}
              onMouseEnter={() => setPreviewId(preset.id)}
              onFocus={() => setPreviewId(preset.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onSelectPreset(preset);
                  onClose();
                }
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group active:scale-[0.99] ${
                isPreviewed
                  ? 'border-indigo-500 bg-indigo-950/25 shadow-lg shadow-indigo-950/50 ring-1 ring-indigo-500/40'
                  : 'border-white/[0.06] hover:border-indigo-500/40 bg-white/[0.02] hover:bg-white/[0.05] shadow-sm'
              } ${isFocused ? 'ring-2 ring-indigo-500 bg-zinc-900/30' : ''}`}
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
                    <span>{cfg?.short || preset.format}</span>
                  </span>
                </div>
                <p className="text-xs text-zinc-400 font-mono">
                  presets/{preset.format}/{preset.name}.js
                </p>
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
        });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="bg-[#0e101a] border border-white/[0.08] rounded-3xl w-full max-w-6xl overflow-hidden shadow-2xl shadow-indigo-950/40 flex flex-col max-h-[88vh]">
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
              Production-tested architectural scenes across SVG Vector, Three.js 3D and Pixel Art engines.
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
            {(['svg', 'worlds', 'pixel'] as const).map((fmt) => {
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

        {/* Split view: names on the left, the real scene on the right — the gallery
            is how you browse forty scenes, and it used to show none of them. */}
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="relative min-h-0 flex-1 md:w-[47%] md:flex-none">
            <div className="h-full overflow-y-auto p-4 grid grid-cols-1 gap-2.5 content-start">{gridContent}</div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-[#0e101a] to-transparent"
            />
          </div>
          <aside className="hidden min-h-0 flex-col justify-center border-l border-white/[0.06] bg-[#0a0c13]/70 p-4 md:flex md:w-[53%] md:flex-none">
            <PresetPreview preset={previewPreset} />
            <button
              type="button"
              onClick={() => {
                if (!previewPreset) return;
                onSelectPreset(previewPreset);
                onClose();
              }}
              disabled={!previewPreset}
              className="mt-2.5 w-full shrink-0 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-40 cursor-pointer"
            >
              Load {previewPreset ? `“${previewPreset.title}”` : 'preset'} →
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
};

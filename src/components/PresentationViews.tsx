import * as React from 'react';
import { Camera, Maximize2, Pause, Play } from 'lucide-react';
import { LOOK_STOPS, nearestStop, type SceneLook } from '../lib/look';
import type { RenderFormat, SVGTheme, WebPresentationSize, WorldFinish } from '../types';

/**
 * The two web presentations are different page structures, not one frame at two
 * sizes. Hero is the scene, edge to edge, with no chrome: that is what the
 * exported page contains. Card is a compact, self-contained card in a responsive
 * grid, so it keeps a caption row under the frame. Everything here is
 * presentational: the live iframe stays mounted in SandboxPreview and only its
 * CSS surrounds change when the size is switched.
 */

export const FORMAT_META: Record<RenderFormat, { label: string; tone: string; dot: string }> = {
  svg: { label: 'SVG Vector', tone: 'border-emerald-400/30 bg-emerald-500/10 text-[#6ee7b7]', dot: 'bg-emerald-400' },
  worlds: { label: 'Three.js', tone: 'border-indigo-400/30 bg-indigo-500/10 text-[#a5b4fc]', dot: 'bg-indigo-400' },
  pixel: { label: 'Pixel Art', tone: 'border-amber-400/30 bg-amber-500/10 text-[#fcd34d]', dot: 'bg-amber-400' },
};

export const ACCENT_SWATCHES = ['#e0604b', '#5b4ae0', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'];

interface LiveCardBodyProps {
  sceneName: string;
  format: RenderFormat;
  motion: string;
  hoverText: string;
  onSnapshot: () => void;
  onFullscreen: () => void;
}

export function LiveCardBody({ sceneName, format, motion, hoverText, onSnapshot, onFullscreen }: LiveCardBodyProps) {
  const meta = FORMAT_META[format];
  return (
    <div className="flex flex-1 flex-col gap-2.5 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-semibold tracking-tight text-[var(--text-primary)]">{sceneName}</h3>
          <p className="mt-0.5 truncate text-[11px] text-[var(--text-muted)]">
            {meta.label} <span className="text-[var(--text-muted)]">·</span> {motion}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-emerald-500">
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          Live
        </span>
      </div>
      <div className="flex min-h-[14px] items-center gap-1.5 text-[10px] font-mono text-[var(--text-muted)]">
        {hoverText ? (
          <>
            <span className="h-1 w-1 rounded-full bg-indigo-400" />
            <span className="truncate text-indigo-500">hover: {hoverText}</span>
          </>
        ) : (
          <span className="truncate text-[var(--text-muted)]">Interactive embed · drag to orbit</span>
        )}
      </div>
      <div className="mt-auto flex items-center gap-1.5 border-t border-[var(--border-subtle)] pt-2.5">
        <button
          type="button"
          onClick={onSnapshot}
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)] active:scale-[0.98] cursor-pointer"
        >
          <Camera className="h-3 w-3 text-[#22d3ee]" />
          Still
        </button>
        <button
          type="button"
          onClick={onFullscreen}
          title="Expand to full screen"
          data-card-expand=""
          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-2 py-1 text-[10px] font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-raised)] hover:text-[var(--text-primary)] active:scale-[0.98] cursor-pointer"
        >
          <Maximize2 className="h-3 w-3 text-[#818cf8]" />
          Expand
        </button>
        <span className="ml-auto rounded-md border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wide text-[var(--text-muted)]">
          4:3
        </span>
      </div>
    </div>
  );
}

interface LookStripProps {
  accent: string;
  look: SceneLook;
  isPaused: boolean;
  /** Short stages tighten the row so the scene keeps the room. */
  compact?: boolean;
  onAccentChange: (color: string) => void;
  onLookChange: (look: SceneLook) => void;
  onTogglePlay: () => void;
}

/**
 * Look controls belong to the studio, not to the scene: they are a thin strip
 * under the card, not a sibling card competing with the scene for the frame.
 * The 3D scene is the subject of this presentation; anything that styles it is
 * chrome and reads as chrome.
 */
export function LookStrip({
  accent,
  look,
  isPaused,
  compact = false,
  onAccentChange,
  onLookChange,
  onTogglePlay,
}: LookStripProps) {
  const activeStop = nearestStop(look.timeOfDay);
  const divider = <span aria-hidden="true" className="hidden h-4 w-px bg-[var(--border-subtle)] sm:block" />;

  return (
    // One row, always: a wrapping strip changes its own height, and the card is
    // sized from that height. Narrow stages drop pieces instead of stacking.
    <div
      aria-label="Look controls"
      className="@container flex flex-nowrap items-center gap-x-2 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-2.5 py-1.5"
    >
      <span className="hidden whitespace-nowrap text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)] @[520px]:inline">
        Look
      </span>


      {divider}

      <div className="flex items-center gap-1">
        {ACCENT_SWATCHES.map((color) => {
          const selected = accent.toLowerCase() === color.toLowerCase();
          return (
            <button
              key={color}
              type="button"
              onClick={() => onAccentChange(color)}
              aria-label={'Accent ' + color}
              aria-pressed={selected}
              className={
                'h-4 w-4 rounded-full border transition active:scale-95 cursor-pointer ' +
                (selected
                  ? 'border-[var(--text-primary)] ring-2 ring-[var(--text-primary)]/20'
                  : 'border-[var(--border-subtle)] hover:border-[var(--text-muted)]')
              }
              style={{ backgroundColor: color }}
            />
          );
        })}
      </div>

      {divider}

      <div className="flex items-center gap-0.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-0.5">
        {LOOK_STOPS.map((stop) => (
          <button
            key={stop.key}
            type="button"
            onClick={() => onLookChange({ ...look, timeOfDay: stop.at })}
            title={stop.hint}
            className={
              'rounded-md px-1.5 py-0.5 text-[10px] font-medium transition cursor-pointer ' +
              (activeStop === stop.at
                ? 'bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]')
            }
          >
            {stop.label}
          </button>
        ))}
      </div>

      <div className="hidden items-center gap-1 @[620px]:flex">
        {(['clear', 'rain', 'snow'] as const).map((weather) => (
          <button
            key={weather}
            type="button"
            onClick={() => onLookChange({ ...look, weather })}
            className={
              'rounded-md border px-1.5 py-0.5 text-[10px] font-medium capitalize transition cursor-pointer ' +
              (look.weather === weather
                ? 'border-indigo-400/40 bg-indigo-500/10 text-indigo-500'
                : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]')
            }
          >
            {weather}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onTogglePlay}
        aria-pressed={isPaused}
        className={
          'ml-auto inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-[var(--border-subtle)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] active:scale-[0.99] cursor-pointer ' +
          (compact ? '' : '')
        }
      >
        {isPaused ? <Play className="h-3 w-3 text-emerald-500" /> : <Pause className="h-3 w-3 text-amber-500" />}
        {isPaused ? 'Resume' : 'Pause'}
      </button>
    </div>
  );
}

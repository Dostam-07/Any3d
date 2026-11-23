import * as React from 'react';
import {
  ArrowUpRight,
  Camera,
  Check,
  Code2,
  Copy,
  Download,
  Maximize2,
  Pause,
  Play,
} from 'lucide-react';
import { LOOK_STOPS, lookLabel, nearestStop, type SceneLook } from '../lib/look';
import type { RenderFormat, SVGTheme, WebPresentationSize, WorldFinish } from '../types';

/**
 * The two web presentations are different page structures, not one frame at two
 * sizes. Hero is a full-bleed landing banner with site chrome and a headline;
 * Card is a section of compact, self-contained cards in a responsive grid.
 * Everything here is presentational: the live iframe stays mounted in
 * SandboxPreview and only its CSS surrounds change when the size is switched.
 */

export const FORMAT_META: Record<RenderFormat, { label: string; tone: string; dot: string }> = {
  svg: { label: 'SVG Vector', tone: 'border-emerald-400/30 bg-emerald-500/10 text-[#6ee7b7]', dot: 'bg-emerald-400' },
  worlds: { label: 'Three.js', tone: 'border-indigo-400/30 bg-indigo-500/10 text-[#a5b4fc]', dot: 'bg-indigo-400' },
  pixel: { label: 'Pixel Art', tone: 'border-amber-400/30 bg-amber-500/10 text-[#fcd34d]', dot: 'bg-amber-400' },
};

export const ACCENT_SWATCHES = ['#e0604b', '#5b4ae0', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'];

interface HeroChromeProps {
  sceneName: string;
  format: RenderFormat;
  motion: string;
  onFullscreen: () => void;
  onSnapshot: () => void;
}

/** Site nav + scrims. Rendered behind the hero copy inside the full-bleed stage. */
export function HeroSiteChrome({ sceneName, format, motion, onFullscreen, onSnapshot }: HeroChromeProps) {
  const meta = FORMAT_META[format];
  return (
    <>
      {/* Readability scrims: the copy keeps the left third, the scene keeps the right.
          Kept as a wide gradient rather than a dark panel so a noon scene stays
          bright across most of the banner instead of sitting in a black field. */}
      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(5,7,13,0.88)_0%,rgba(5,7,13,0.66)_28%,rgba(5,7,13,0.3)_52%,rgba(5,7,13,0.06)_74%,rgba(5,7,13,0)_90%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-[#05070d]/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[56%] bg-gradient-to-t from-[#05070d]/95 from-20% via-[#05070d]/72 via-54% to-transparent" />

      {/* Mock site navigation: a hero belongs to a page, so the page header shows. */}
      <div
        data-hero-chrome="nav"
        className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between gap-4 px-4 py-3.5 sm:px-8 sm:py-5"
      >
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] font-bold tracking-tight text-[#ffffff] shadow-lg shadow-indigo-950/50">
            A3
          </span>
          <span className="text-[13px] font-semibold tracking-tight text-white/90">Any3d</span>
          <span className="ml-1 hidden rounded-full border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.05)] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55 sm:inline">
            Hero layout
          </span>
        </div>
        <nav aria-hidden="true" className="hidden items-center gap-6 text-[12px] font-medium text-white/45 md:flex">
          <span>Overview</span>
          <span className="text-white/85">Scene</span>
          <span>Docs</span>
          <span>Pricing</span>
        </nav>
        <div aria-hidden="true" className="hidden items-center gap-2 sm:flex">
          <span className="rounded-full border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.05)] px-3 py-1 text-[11px] font-medium text-white/70">
            {meta.label}
          </span>
          <span className="rounded-full bg-[#ffffff] px-3 py-1.5 text-[11px] font-semibold text-[#09090b]">Start free</span>
        </div>
      </div>

      {/* Hero copy block: one headline, one line of support, one primary action. */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-5 sm:px-8 sm:pb-7 lg:px-10 lg:pb-9">
        <div className="max-w-xl">
          <div className="mb-2.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
            <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} animate-pulse`} />
            Live 3D
            <span className="text-white/25">/</span>
            {meta.label}
            <span className="hidden text-white/25 sm:inline">/</span>
            <span className="hidden sm:inline">{motion}</span>
          </div>
          <h1 className="text-balance text-[26px] font-semibold leading-[1.05] tracking-tight text-[#ffffff] sm:text-4xl lg:text-[44px]">
            {sceneName}
          </h1>
          <p className="mt-2.5 max-w-md text-[12px] leading-relaxed text-white/60 sm:text-[13px] [@media(max-height:560px)]:hidden">
            Edge-to-edge scenery with room for one headline, one line of support,
            and a single call to action.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 [@media(max-height:420px)]:hidden">
            <button
              type="button"
              onClick={onFullscreen}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#ffffff] px-3.5 py-1.5 text-[11px] font-semibold text-[#09090b] shadow-lg shadow-black/30 transition hover:bg-[rgba(255,255,255,0.9)] active:scale-[0.98] cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              View fullscreen
            </button>
            <button
              type="button"
              onClick={onSnapshot}
              className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.20)] bg-[rgba(255,255,255,0.06)] px-3.5 py-1.5 text-[11px] font-semibold text-white/85 backdrop-blur-sm transition hover:border-[rgba(255,255,255,0.35)] hover:bg-[rgba(255,255,255,0.10)] active:scale-[0.98] cursor-pointer"
            >
              <Camera className="h-3.5 w-3.5" />
              Save still
            </button>
            <span className="ml-1 hidden items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.10)] bg-[rgba(0,0,0,0.25)] px-2.5 py-1 text-[10px] font-medium text-white/45 sm:inline-flex">
              Drag to orbit · scroll to zoom
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export function CardSectionHeader({
  format,
  columns,
  compact = false,
}: {
  format: RenderFormat;
  columns: number;
  /** Short stages drop the blurb so the cards themselves stay above the fold. */
  compact?: boolean;
}) {
  const meta = FORMAT_META[format];
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 pb-1">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
          <span className="h-px w-6 bg-indigo-400/60" />
          Cards section
        </div>
        <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-[var(--text-primary)] sm:text-xl">
          Your scene as one card in a grid
        </h2>
        {compact ? null : (
          <p className="mt-1 max-w-lg text-[11px] leading-relaxed text-[var(--text-muted)]">
            Compact 4:3 media, its own title and metadata, and sibling cards in the
            same row. {meta.label} embedded live.
          </p>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
          {columns} column grid
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-secondary)]">
          Card
          <ArrowUpRight className="h-3 w-3" />
        </span>
      </div>
    </header>
  );
}

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
          <h3 className="truncate text-[13px] font-semibold tracking-tight text-[#f4f4f5]">{sceneName}</h3>
          <p className="mt-0.5 truncate text-[11px] text-[#8b93a1]">
            {meta.label} <span className="text-[#4b5158]">·</span> {motion}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#6ee7b7]">
          <span className="h-1 w-1 rounded-full bg-emerald-400" />
          Live
        </span>
      </div>
      <div className="flex min-h-[14px] items-center gap-1.5 text-[10px] font-mono text-[#8b93a1]">
        {hoverText ? (
          <>
            <span className="h-1 w-1 rounded-full bg-indigo-400" />
            <span className="truncate text-indigo-300/90">hover: {hoverText}</span>
          </>
        ) : (
          <span className="truncate text-[#98a0ac]">Interactive embed · drag to orbit</span>
        )}
      </div>
      <div className="mt-auto flex items-center gap-1.5 border-t border-[rgba(255,255,255,0.06)] pt-2.5">
        <button
          type="button"
          onClick={onSnapshot}
          className="inline-flex items-center gap-1 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-2 py-1 text-[10px] font-medium text-[#d4d4d8] transition hover:bg-[rgba(255,255,255,0.07)] hover:text-[#ffffff] active:scale-[0.98] cursor-pointer"
        >
          <Camera className="h-3 w-3 text-[#22d3ee]" />
          Still
        </button>
        <button
          type="button"
          onClick={onFullscreen}
          className="inline-flex items-center gap-1 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-2 py-1 text-[10px] font-medium text-[#d4d4d8] transition hover:bg-[rgba(255,255,255,0.07)] hover:text-[#ffffff] active:scale-[0.98] cursor-pointer"
        >
          <Maximize2 className="h-3 w-3 text-[#818cf8]" />
          Expand
        </button>
        <span className="ml-auto rounded-md border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.20)] px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-wide text-[#8b93a1]">
          4:3
        </span>
      </div>
    </div>
  );
}

interface SceneSpecRow {
  label: string;
  value: string;
}

/**
 * Scene spec as a single quiet row of chips.
 *
 * It used to be a full card beside the live preview, which competed with the
 * thing the user actually came to look at. The same facts now ride in the
 * section chrome, and the freed slot carries the export CTA.
 */
export function SceneSpecStrip({
  format,
  size,
  motion,
  finish,
  theme,
  look,
}: {
  format: RenderFormat;
  size: WebPresentationSize;
  motion: string;
  finish: WorldFinish;
  theme: SVGTheme;
  look: SceneLook;
}) {
  const rows: SceneSpecRow[] = [
    { label: 'Engine', value: FORMAT_META[format].label },
    { label: 'Frame', value: size === 'hero' ? 'Full bleed' : '4:3 card' },
    { label: 'Look', value: lookLabel(look) },
    { label: 'Style', value: format === 'worlds' ? finish : theme },
    { label: 'Motion', value: motion },
  ];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {rows.map((row) => (
        <span
          key={row.label}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-2.5 py-1 text-[10px] text-[var(--text-secondary)]"
        >
          <span className="uppercase tracking-[0.12em] text-[var(--text-muted)]">{row.label}</span>
          <span className="font-medium text-[var(--text-primary)]">{row.value}</span>
        </span>
      ))}
    </div>
  );
}

interface ShipCardProps {
  code: string;
  format: RenderFormat;
  sceneName: string;
  /** Short stages show fewer source lines so the card keeps fitting. */
  compact?: boolean;
  onExportHtml?: () => void;
  /** Jump to the editable source; the footer link is inert without it. */
  onOpenCode?: () => void;
}

/**
 * The card that belongs next to the live preview: what to do with the scene.
 * One primary action (export the standalone file), a copy action, and a scoped
 * look at the source that produced the image, so the output stays the subject.
 */
export function ShipCard({ code, format, sceneName, compact = false, onExportHtml, onOpenCode }: ShipCardProps) {
  const [copied, setCopied] = React.useState(false);
  const lines = React.useMemo(() => (code || '').split('\n').filter((line) => line.trim().length > 0), [code]);
  const previewCount = compact ? 6 : 10;
  // Dedent the peek so its first characters are the scene's structure, not the
  // shared indentation of the whole file.
  const preview = React.useMemo(() => {
    const head = lines.slice(0, previewCount);
    const indent = head
      .filter((line) => line.trim())
      .reduce((min, line) => Math.min(min, line.length - line.trimStart().length), Number.POSITIVE_INFINITY);
    const cut = Number.isFinite(indent) ? indent : 0;
    return head.map((line) => line.slice(cut));
  }, [lines, previewCount]);
  const meta = FORMAT_META[format];

  React.useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    const fallback = () => {
      // Clipboard permissions are not always granted (insecure origin, embedded
      // preview); a hidden textarea still copies on a real user gesture.
      try {
        const area = document.createElement('textarea');
        area.value = code;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(area);
        setCopied(ok);
      } catch {
        setCopied(false);
      }
    };
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      fallback();
    }
  };

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0b0d16] p-3 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a1a1aa]">Ship this scene</h3>
        <Code2 className="h-3.5 w-3.5 text-[rgba(129,140,248,0.8)]" />
      </div>

      <p className="mt-1.5 text-[11px] leading-relaxed text-[#98a0ac]">
        One HTML file with the runtime inlined. No server, no CDN, opens offline.
      </p>

      <div className="mt-2.5 flex items-center gap-1.5">
        <button
          type="button"
          onClick={onExportHtml}
          disabled={!onExportHtml || !code}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-2.5 py-1.5 text-[11px] font-semibold text-[#ffffff] shadow-sm transition hover:from-indigo-500 hover:to-purple-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          Export HTML
        </button>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-2.5 py-1.5 text-[11px] font-medium text-[#d4d4d8] transition hover:bg-[rgba(255,255,255,0.07)] hover:text-[#ffffff] active:scale-[0.99] cursor-pointer"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#34d399]" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      <div className="mt-2.5 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-[rgba(255,255,255,0.07)] bg-[#080a11]">
        <div className="flex items-center gap-1.5 border-b border-[rgba(255,255,255,0.06)] px-2 py-1">
          <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
          <span className="truncate font-mono text-[9.5px] text-[#8b93a1]">
            {sceneName ? sceneName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') : 'scene'}.js
          </span>
          <span className="ml-auto font-mono text-[9px] text-[#6b7280]">{lines.length} lines</span>
        </div>
        <div className="relative min-h-0 flex-1 overflow-hidden px-2 py-1.5 font-mono text-[10.5px] leading-[1.6] text-[#9aa4b2]">
          <span className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-6 bg-gradient-to-t from-[#080a11] to-transparent" />
          {preview.map((line, index) => (
            <div key={index} className="whitespace-pre-wrap break-words">
              {line || ' '}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-[rgba(255,255,255,0.06)] pt-2 text-[10px] text-[#8b93a1]">
        <span>{meta.label} · self-contained</span>
        <button
          type="button"
          onClick={onOpenCode}
          disabled={!onOpenCode}
          title={onOpenCode ? 'Open the scene source in the code editor' : 'Code editing is unavailable here'}
          className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-[10px] font-medium text-[#a5b4fc] transition hover:bg-[rgba(255,255,255,0.06)] hover:text-[#c7d2fe] disabled:cursor-default disabled:opacity-60 cursor-pointer"
        >
          Editable source
          <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
    </article>
  );
}

interface LookCardProps {
  accent: string;
  look: SceneLook;
  isPaused: boolean;
  /** Short stages tighten spacing so the card keeps fitting the viewport. */
  compact?: boolean;
  onAccentChange: (color: string) => void;
  onLookChange: (look: SceneLook) => void;
  onTogglePlay: () => void;
}

export function LookCard({
  accent,
  look,
  isPaused,
  compact = false,
  onAccentChange,
  onLookChange,
  onTogglePlay,
}: LookCardProps) {
  const activeStop = nearestStop(look.timeOfDay);
  const gap = compact ? 'mt-2' : 'mt-3';
  const innerGap = compact ? 'mt-1' : 'mt-1.5';

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[#0b0d16] p-3 shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a1a1aa]">Look</h3>
        <span className="rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-2 py-0.5 text-[9px] font-mono text-[#a1a1aa]">
          {lookLabel(look)}
        </span>
      </div>

      <div className={gap}>
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#98a0ac]">Accent</div>
        <div className={innerGap + ' flex items-center gap-1.5'}>
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
                  'h-5 w-5 rounded-full border transition active:scale-95 cursor-pointer ' +
                  (selected
                    ? 'border-[rgba(255,255,255,0.80)] ring-2 ring-white/25'
                    : 'border-[rgba(255,255,255,0.15)] hover:border-[rgba(255,255,255,0.45)]')
                }
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>
      </div>

      <div className={gap}>
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#98a0ac]">Time of day</div>
        <div
          className={
            innerGap +
            ' grid grid-cols-4 gap-1 rounded-lg border border-[rgba(255,255,255,0.06)] bg-[rgba(0,0,0,0.20)] p-0.5'
          }
        >
          {LOOK_STOPS.map((stop) => (
            <button
              key={stop.key}
              type="button"
              onClick={() => onLookChange({ ...look, timeOfDay: stop.at })}
              title={stop.hint}
              className={
                'rounded-md px-1 py-1 text-[10px] font-medium transition cursor-pointer ' +
                (activeStop === stop.at
                  ? 'bg-[rgba(255,255,255,0.10)] text-[#ffffff] shadow-sm'
                  : 'text-[#8b93a1] hover:text-[#e4e4e7]')
              }
            >
              {stop.label}
            </button>
          ))}
        </div>
      </div>

      <div className={gap + ' flex items-center gap-1'}>
        {(['clear', 'rain', 'snow'] as const).map((weather) => (
          <button
            key={weather}
            type="button"
            onClick={() => onLookChange({ ...look, weather })}
            className={
              'flex-1 rounded-md border px-1.5 py-1 text-[10px] font-medium capitalize transition cursor-pointer ' +
              (look.weather === weather
                ? 'border-indigo-400/30 bg-indigo-500/10 text-[#c7d2fe]'
                : 'border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] text-[#8b93a1] hover:text-[#e4e4e7]')
            }
          >
            {weather}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onTogglePlay}
        className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-2 py-1.5 text-[10px] font-medium text-[#d4d4d8] transition hover:bg-[rgba(255,255,255,0.07)] hover:text-[#ffffff] active:scale-[0.99] cursor-pointer"
      >
        {isPaused ? <Play className="h-3 w-3 text-[#34d399]" /> : <Pause className="h-3 w-3 text-[#fbbf24]" />}
        {isPaused ? 'Resume motion' : 'Pause on a still'}
      </button>
    </article>
  );
}

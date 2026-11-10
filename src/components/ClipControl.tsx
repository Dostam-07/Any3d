import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Film, Loader2, Download, X, AlertTriangle, Settings2 } from 'lucide-react';
import { SandboxPreviewHandle } from './SandboxPreview';
import { saveClip, TurntableFormat, TurntableResult, TurntableAspect } from '../lib/turntable';
import { countExport } from '../lib/telemetry';

interface ClipControlProps {
  previewRef: React.RefObject<SandboxPreviewHandle | null>;
  sceneName: string;
  disabled?: boolean;
  /** Compact variant for toolbars: icon + progress only. */
  compact?: boolean;
}

interface ClipPrefs {
  aspect: TurntableAspect;
  size: number;
  fps: number;
  format: TurntableFormat;
}

const DEFAULT_PREFS: ClipPrefs = { aspect: 'square', size: 1080, fps: 30, format: 'video' };
const PREFS_KEY = 'any3d.clip.prefs';

function loadPrefs(): ClipPrefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<ClipPrefs>;
    return {
      aspect: parsed.aspect === 'source' ? 'source' : 'square',
      size: parsed.size === 720 ? 720 : 1080,
      fps: parsed.fps === 60 ? 60 : 30,
      format: parsed.format === 'gif' ? 'gif' : 'video',
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function Segmented({
  value,
  options,
  onChange,
  label,
}: {
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: (value: string | number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{label}</span>
      <div className="flex items-center p-0.5 rounded-lg bg-zinc-950/80 border border-white/[0.06]">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={
              'px-2 py-0.5 rounded-md text-[10px] font-medium transition cursor-pointer ' +
              (value === option.value
                ? 'bg-white/[0.1] text-white'
                : 'text-zinc-500 hover:text-zinc-200')
            }
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * "Clip" — records the live scene for a few seconds and offers it for download.
 *
 * Shared by the project page and the Studio stage so every engine is reachable:
 * presets for worlds/pixel/dither live in Studio, so a project-page-only button
 * would leave the canvas engines without a way to record.
 *
 * The popover and the dialog are portalled to <body>: this button lives in a
 * toolbar with `backdrop-blur`, which is the containing block for fixed
 * descendants and clips anything taller than the bar itself.
 */
export const ClipControl: React.FC<ClipControlProps> = ({
  previewRef,
  sceneName,
  disabled,
  compact,
}) => {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [clip, setClip] = useState<{ url: string; result: TurntableResult } | null>(null);
  const [prefs, setPrefs] = useState<ClipPrefs>(loadPrefs);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!settingsOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (toggleRef.current?.contains(target)) return;
      setSettingsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSettingsOpen(false);
    };
    const onResize = () => setSettingsOpen(false);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onResize);
    };
  }, [settingsOpen]);

  const toggleSettings = () => {
    const rect = toggleRef.current?.getBoundingClientRect();
    if (rect) {
      setAnchor({
        top: rect.bottom + 6,
        right: Math.max(8, window.innerWidth - rect.right),
      });
    }
    setSettingsOpen((open) => !open);
  };

  const updatePrefs = (patch: Partial<ClipPrefs>) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      try {
        window.localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        // Private mode: settings just don't persist.
      }
      return next;
    });
  };

  const close = () => {
    setClip((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  const record = async () => {
    if (!previewRef.current || busy) return;
    setError(null);
    close();
    setBusy(true);
    setProgress(0);
    try {
      const result = await previewRef.current.recordTurntable({
        seconds: prefs.format === 'gif' ? 4 : 5,
        fps: prefs.format === 'gif' ? 15 : prefs.fps,
        maxSize: prefs.size,
        aspect: prefs.aspect,
        format: prefs.format,
        onProgress: setProgress,
      });
      setClip({ url: URL.createObjectURL(result.blob), result });
    } catch (err: any) {
      setError(err?.message || 'Could not record a clip');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="relative inline-flex items-center gap-1">
        <button
          type="button"
          onClick={record}
          disabled={disabled || busy}
          aria-label="Clip"
          title={disabled ? 'Nothing to record yet' : 'Record a short clip of this scene'}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-zinc-200 bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.08] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-300" />
          ) : (
            <Film className="w-3.5 h-3.5 text-rose-300" />
          )}
          {busy ? (
            <span className="font-mono">{Math.round(progress * 100)}%</span>
          ) : (
            !compact && <span>Clip</span>
          )}
        </button>
        <button
          ref={toggleRef}
          type="button"
          onClick={toggleSettings}
          disabled={busy}
          aria-label="Capture settings"
          aria-expanded={settingsOpen}
          title="Capture settings"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.08] transition cursor-pointer disabled:opacity-40"
        >
          <Settings2 className="w-3 h-3" />
        </button>
      </div>

      {settingsOpen && anchor && createPortal(
        <div
          ref={panelRef}
          role="group"
          aria-label="Capture settings"
          style={{ position: 'fixed', top: anchor.top, right: anchor.right }}
          className="z-[60] w-60 rounded-xl border border-white/[0.1] bg-[#0c0e17] p-3 space-y-2.5 shadow-2xl"
        >
          <Segmented
            label="Stage"
            value={prefs.aspect}
            onChange={(value) => updatePrefs({ aspect: value as TurntableAspect })}
            options={[
              { value: 'square', label: 'Square' },
              { value: 'source', label: 'Wide' },
            ]}
          />
          <Segmented
            label="Size"
            value={prefs.format === 'gif' ? 'gif' : prefs.size}
            onChange={(value) => updatePrefs({ size: Number(value) })}
            options={
              prefs.format === 'gif'
                ? [{ value: 'gif', label: '640 max' }]
                : [
                    { value: 1080, label: prefs.aspect === 'source' ? '1080 max' : '1080' },
                    { value: 720, label: prefs.aspect === 'source' ? '720 max' : '720' },
                  ]
            }
          />
          <Segmented
            label="Rate"
            value={prefs.format === 'gif' ? 'gif' : prefs.fps}
            onChange={(value) => updatePrefs({ fps: Number(value) })}
            options={
              prefs.format === 'gif'
                ? [{ value: 'gif', label: '15 fps' }]
                : [
                    { value: 30, label: '30 fps' },
                    { value: 60, label: '60 fps' },
                  ]
            }
          />
          <Segmented
            label="Format"
            value={prefs.format}
            onChange={(value) => updatePrefs({ format: value as TurntableFormat })}
            options={[
              { value: 'video', label: 'Video' },
              { value: 'gif', label: 'GIF' },
            ]}
          />
          <p className="text-[10px] leading-relaxed text-zinc-600 pt-0.5">
            {prefs.format === 'gif'
              ? 'GIF · 4 s · square · 640 px — the lightest thing that loops anywhere.'
              : `${prefs.aspect === 'square' ? 'Square' : 'Wide'} · ${
                  prefs.aspect === 'square' ? prefs.size : `up to ${prefs.size}`
                } px · ${prefs.fps} fps · 5 s`}
          </p>
        </div>,
        document.body
      )}

      {error && createPortal(
        <div className="fixed bottom-4 right-4 z-[60] max-w-sm rounded-xl border border-amber-500/30 bg-[#1a1208] px-3 py-2 text-[11px] text-amber-200 flex items-start gap-2 shadow-xl">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
          <span className="flex-1">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-amber-400/70 hover:text-amber-200 transition cursor-pointer"
            aria-label="Dismiss"
          >
            <X className="w-3 h-3" />
          </button>
        </div>,
        document.body
      )}

      {clip && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Turntable clip"
        >
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#0c0e17] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
              <p className="text-xs font-semibold text-zinc-200">Turntable clip</p>
              <button
                type="button"
                onClick={close}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-mono text-zinc-500">
                  {clip.result.width}×{clip.result.height} · {clip.result.format === 'gif' ? 'GIF' : 'Video'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    close();
                    void record();
                  }}
                  className="px-2 py-1 rounded-lg text-[10px] font-medium text-zinc-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition cursor-pointer"
                >
                  Re-record
                </button>
              </div>
              {clip.result.format === 'gif' ? (
                <img
                  src={clip.url}
                  alt="Turntable clip preview"
                  className="w-full rounded-xl bg-black object-contain max-h-[60vh]"
                />
              ) : (
                <video
                  src={clip.url}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full rounded-xl bg-black object-contain max-h-[60vh]"
                />
              )}
              <p className="text-[10px] font-mono text-zinc-500">
                {clip.result.width}×{clip.result.height} ·{' '}
                {(clip.result.durationMs / 1000).toFixed(1)}s ·{' '}
                {clip.result.fps} fps ·{' '}
                {Math.max(1, Math.round(clip.result.blob.size / 1024))} KB ·{' '}
                {clip.result.extension}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={close}
                className="px-3 py-1.5 rounded-lg text-[11px] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => { countExport('clip'); saveClip(clip.result.blob, sceneName || 'scene', clip.result.extension); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 border border-rose-400/20 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Save clip
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

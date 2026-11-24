import { useEffect, useRef, useState } from 'react';
import { Loader2, Play } from 'lucide-react';
import { bundleCode } from '../lib/api';
import { presetSummary, summaryIsThin } from '../lib/preset-summary';
import type { PresetScene } from '../types';

/** One bundled document per preset id: the gallery is browsed by hovering, and a
 *  bundle is a few hundred kilobytes, so refetching on every flick would crawl. */
const bundleCache = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

function loadBundle(preset: PresetScene): Promise<string> {
  const key = `${preset.id}:${preset.format}`;
  const cached = bundleCache.get(key);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(key);
  if (pending) return pending;
  const request = bundleCode(preset.code, preset.format, null, null)
    .then(({ html }) => {
      bundleCache.set(key, html);
      inflight.delete(key);
      return html;
    })
    .catch((error) => {
      inflight.delete(key);
      throw error;
    });
  inflight.set(key, request);
  return request;
}

interface PresetPreviewProps {
  preset: PresetScene | null;
  /** Rendered under the frame: title + engine, or the rest state. */
  footer?: boolean;
  /** Frame ratio. Presets are wide scenes, so a square frame letterboxes them. */
  aspect?: string;
  /** Only bundle once the frame is on screen: the home grid shows six of these. */
  lazy?: boolean;
  /** Let the frame take pointer events (orbit). Off by default: a preview sits
   *  inside a clickable card, and an iframe swallows the click. */
  interactive?: boolean;
}

/**
 * A live look at a preset before loading it.
 *
 * The gallery used to be a list of names, line counts and file paths — the one
 * screen in a scene generator with no scenes on it. This mounts the real bundle,
 * so what you pick is what you get. Presets are first-party files, so the frame is
 * left same-origin (like the studio's own preview); generated code is the case
 * that gets sandboxed.
 */
export function PresetPreview({
  preset,
  footer = true,
  aspect = 'aspect-[16/9]',
  lazy = false,
  interactive = false,
}: PresetPreviewProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  const [visible, setVisible] = useState(!lazy);
  const frameRef = useRef<HTMLDivElement>(null);
  const mounted = useRef(true);

  useEffect(() => {
    if (!lazy || visible) return;
    const node = frameRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [lazy, visible]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!preset) {
      setHtml(null);
      setState('idle');
      return;
    }
    const cached = bundleCache.get(`${preset.id}:${preset.format}`);
    if (cached) {
      setHtml(cached);
      setState('ready');
      return;
    }
    if (!visible) return;
    setState('loading');
    let cancelled = false;
    loadBundle(preset)
      .then((doc) => {
        if (cancelled || !mounted.current) return;
        setHtml(doc);
        setState('ready');
      })
      .catch(() => {
        if (cancelled || !mounted.current) return;
        setState('failed');
      });
    return () => {
      cancelled = true;
    };
  }, [preset?.id, preset?.format, visible]);

  return (
    <div className="flex flex-col gap-2.5">
      <div
        ref={frameRef}
        className={
          'relative w-full overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] ' +
          aspect
        }
      >
        {html ? (
          <iframe
            key={`${preset?.id}-${preset?.format}`}
            title={preset ? `${preset.title} preview` : 'Preset preview'}
            srcDoc={html}
            tabIndex={-1}
            className={'h-full w-full border-0 ' + (interactive ? '' : 'pointer-events-none')}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
            {state === 'failed' ? (
              <span className="text-xs">Preview unavailable — load it to see the scene.</span>
            ) : (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">{preset ? 'Bundling scene…' : 'Pick a preset to preview it'}</span>
              </>
            )}
          </div>
        )}
        {/* The frame is a picture, not a control surface: clicks belong to the row. */}
        {html && <span aria-hidden="true" className="pointer-events-none absolute inset-0" />}
        {html && (
          <span className="pointer-events-none absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-primary)]/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] backdrop-blur">
            <Play className="h-2.5 w-2.5 text-emerald-500" />
            Live
          </span>
        )}
      </div>
      {footer && preset && (
        <div className="shrink-0 px-0.5">
          <div className="truncate text-sm font-semibold tracking-tight text-[var(--text-primary)]">{preset.title}</div>
          <div className="mt-0.5 truncate font-mono text-[10px] text-[var(--text-muted)]">
            presets/{preset.format}/{preset.name}.js · {preset.code.split(String.fromCharCode(10)).length} lines
          </div>
          {summaryIsThin(presetSummary(preset.code)) ? null : (
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-[var(--text-muted)]">
              {presetSummary(preset.code)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { LayoutGrid, Loader2, Download, X, AlertTriangle } from 'lucide-react';
import { SandboxPreviewHandle } from './SandboxPreview';
import { saveStoryboard, StoryboardResult } from '../lib/storyboard';
import { countExport } from '../lib/telemetry';
import { RenderFormat } from '../types';

interface StoryboardControlProps {
  previewRef: React.RefObject<SandboxPreviewHandle | null>;
  sceneName: string;
  format: RenderFormat;
  disabled?: boolean;
}

/**
 * "Storyboard" — four camera angles of the current SVG scene in one
 * 2400×1350 PNG, with the scene name burned in.
 *
 * Disabled on the canvas engines on purpose: their camera lives in Three.js,
 * so four angles would mean four different renders that do not exist yet. A
 * button that quietly exported four identical frames would be worse than a
 * button that explains itself.
 *
 * The dialog is portalled to <body> for the same reason as the clip dialog:
 * the toolbar's `backdrop-blur` is the containing block for fixed descendants.
 */
export const StoryboardControl: React.FC<StoryboardControlProps> = ({
  previewRef,
  sceneName,
  format,
  disabled,
}) => {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ url: string; result: StoryboardResult } | null>(null);

  const svgOnly = format !== 'svg';

  const close = () => {
    setSheet((current) => {
      if (current) URL.revokeObjectURL(current.url);
      return null;
    });
  };

  const render = async () => {
    if (!previewRef.current || busy) return;
    setError(null);
    close();
    setBusy(true);
    setProgress(0);
    try {
      const result = await previewRef.current.storyboard({
        name: sceneName || 'scene',
        onProgress: setProgress,
      });
      setSheet({ url: URL.createObjectURL(result.blob), result });
    } catch (err: any) {
      setError(err?.message || 'Could not render a storyboard');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={render}
        disabled={disabled || busy || svgOnly}
        aria-label="Storyboard"
        title={
          svgOnly
            ? 'Canvas storyboards are not planned: the camera lives inside Three.js, so four angles is real work, not a flag'
            : 'Four camera angles of this scene in one 2400×1350 PNG'
        }
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-zinc-200 bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.08] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-300" />
        ) : (
          <LayoutGrid className="w-3.5 h-3.5 text-cyan-300" />
        )}
        {busy ? <span className="font-mono">{Math.round(progress * 100)}%</span> : <span>Storyboard</span>}
      </button>

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

      {sheet && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Storyboard sheet"
        >
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/[0.1] bg-[#0c0e17] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
              <p className="text-xs font-semibold text-zinc-200">Storyboard sheet</p>
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
              <img
                src={sheet.url}
                alt={`Storyboard of ${sheet.result.name}`}
                className="w-full rounded-xl border border-white/[0.08] bg-black object-contain"
              />
              <p className="text-[10px] font-mono text-zinc-500">
                {sheet.result.width}×{sheet.result.height} · {sheet.result.angles.length} angles ·{' '}
                {Math.max(1, Math.round(sheet.result.bytes / 1024))} KB · PNG
              </p>
              <p className="text-[10px] text-zinc-500">
                {sheet.result.angles.join(' · ')} — scene name burned into the header.
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
                onClick={() => { countExport('storyboard'); saveStoryboard(sheet.result.blob, sheet.result.name); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-gradient-to-r from-cyan-700 to-indigo-700 hover:from-cyan-800 hover:to-indigo-800 border border-cyan-400/20 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Save PNG
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

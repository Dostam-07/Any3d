/**
 * Product-shot mode panel.
 *
 * Lets the user drop a product image onto a styled plinth, light it with the
 * existing look system, and export a hero image (PNG) or a turntable clip
 * (WebM/GIF). The generated HTML is fully self-contained: the product image
 * is embedded as a data URL, so the exported file works offline.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera, Download, Film, Loader2, X, AlertTriangle, ImageIcon, Sparkles,
  RotateCcw, Palette, Settings2,
} from 'lucide-react';
import { buildProductShotHTML, type ProductShotOptions, type PlinthKind } from '../lib/productShot';
import { saveClip, TurntableFormat } from '../lib/turntable';
import { countExport } from '../lib/telemetry';
import { normalizeLook, type SceneLook } from '../lib/look';

interface ProductShotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  look: SceneLook;
  onLookChange: (look: SceneLook) => void;
}

const PLINTH_OPTIONS: { value: PlinthKind; label: string; icon: React.FC<{ className?: string }> }[] = [
  { value: 'marble', label: 'Marble', icon: Palette },
  { value: 'wood', label: 'Wood', icon: RotateCcw },
  { value: 'scifi-ring', label: 'Sci-Fi Ring', icon: Settings2 },
  { value: 'brushed-metal', label: 'Brushed Metal', icon: ImageIcon },
];

const LOOK_CHOICES: { value: number; label: string }[] = [
  { value: 0, label: 'Dawn' },
  { value: 1 / 3, label: 'Noon' },
  { value: 2 / 3, label: 'Dusk' },
  { value: 1, label: 'Night' },
];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export const ProductShotPanel: React.FC<ProductShotPanelProps> = ({
  isOpen,
  onClose,
  look,
  onLookChange,
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productImage, setProductImage] = useState<string | null>(null);
  const [productName, setProductName] = useState('Product');
  const [plinth, setPlinth] = useState<PlinthKind>('marble');
  const [generated, setGenerated] = useState<string | null>(null);
  const [clipBusy, setClipBusy] = useState(false);
  const [clipProgress, setClipProgress] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const close = () => {
    setGenerated(null);
    setProductImage(null);
    setProductName('Product');
    setPlinth('marble');
    onClose();
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('That does not look like an image.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Use a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be 10 MB or smaller.');
      return;
    }
    setError(null);
    try {
      const dataUrl = await fileToDataUrl(file);
      setProductImage(dataUrl);
    } catch {
      setError('Could not read that image.');
    }
  };

  const handleGenerate = async () => {
    if (!productImage) return;
    setBusy(true);
    setError(null);
    try {
      const opts: ProductShotOptions = {
        productImage,
        plinth,
        look,
        productName: productName.trim() || 'Product',
      };
      const html = buildProductShotHTML(opts);
      setGenerated(html);
    } catch (err: any) {
      setError(err?.message || 'Could not generate product shot.');
    } finally {
      setBusy(false);
    }
  };

  // Push generated HTML into the iframe when it changes.
  useEffect(() => {
    if (!generated || !iframeRef.current) return;
    iframeRef.current.src = 'data:text/html,' + encodeURIComponent(generated);
  }, [generated]);

  const handleExportHero = () => {
    if (!iframeRef.current) return;
    const win = iframeRef.current.contentWindow as any;
    if (!win) return;
    // Trigger the hero export button inside the iframe.
    win.btnHero?.click();
    countExport('html');
  };

  const handleExportClip = async () => {
    if (!iframeRef.current || clipBusy) return;
    const win = iframeRef.current.contentWindow as any;
    if (!win) return;
    setClipBusy(true);
    setClipProgress(0);
    try {
      const frames: string[] = [];
      const frameCount = 12;
      const wrap = win.document.getElementById('productWrap');
      if (!wrap) throw new Error('Product wrap not found in preview.');
      const plinthEl = win.document.querySelector('.plinth');
      if (!plinthEl) throw new Error('Plinth not found in preview.');
      const rect = plinthEl.getBoundingClientRect();
      const scale = Math.max(1, Math.min(4, 1600 / Math.max(rect.width, rect.height)));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(rect.width * scale);
      canvas.height = Math.round(rect.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context failed.');

      // Capture frames at 30° increments around the product.
      for (let i = 0; i < frameCount; i++) {
        const angle = (i / frameCount) * 360;
        wrap.style.transform = `rotateY(${angle}deg)`;
        await new Promise((r) => setTimeout(r, 50)); // let CSS settle

        // Render current iframe frame onto canvas.
        ctx.drawImage(
          plinthEl,
          0, 0, rect.width, rect.height,
          0, 0, canvas.width, canvas.height
        );
        frames.push(canvas.toDataURL('image/png'));
        setClipProgress((i + 1) / frameCount);
      }

      // Reset rotation.
      wrap.style.transform = 'rotateY(0deg)';

      // Encode frames as a GIF using gifenc.
      const { GIFEncoder, applyPalette, quantize } = await import('gifenc');
      const gif = GIFEncoder();
      for (let i = 0; i < frames.length; i++) {
        const f = new Image();
        f.src = frames[i];
        await new Promise((r) => (f.onload = r));
        ctx.drawImage(f, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const palette = quantize(imgData.data, 256);
        const index = applyPalette(imgData.data, palette);
        gif.writeFrame(index, canvas.width, canvas.height, i === 0 ? { palette, delay: 80, repeat: 0 } : { palette, delay: 80 });
      }
      gif.finish();
      const bytes = gif.bytes();
      const blob = new Blob([bytes as unknown as BlobPart], { type: 'image/gif' });

      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${productName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-turntable.gif`;
      a.click();
      countExport('clip');
    } catch (err: any) {
      setError(err?.message || 'Could not record turntable clip.');
    } finally {
      setClipBusy(false);
      setClipProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl border border-white/[0.1] bg-[#0c0e17] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-fuchsia-400" />
            <h2 className="text-sm font-bold text-white">Product Shot</h2>
          </div>
          <button
            type="button"
            onClick={close}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Step 1: Upload image */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0a0c13] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">1 · Product image</h3>
              <span className="text-[10px] font-mono text-zinc-500">JPEG · PNG · WebP · ≤10 MB</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border-2 border-dashed border-white/[0.08] hover:border-white/[0.2] transition cursor-pointer group"
              onClick={() => document.getElementById('productFile')?.click()}
            >
              <input
                id="productFile"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <ImageIcon className="w-6 h-6 text-zinc-500 group-hover:text-fuchsia-400" />
              <div className="flex-1">
                <p className="text-sm text-zinc-200">{productImage ? 'Image loaded' : 'Drop your product image'}</p>
                {productImage && (
                  <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">
                    {productImage.slice(0, 60)}…
                  </p>
                )}
              </div>
              {productImage && (
                <button
                  type="button"
                  onClick={() => setProductImage(null)}
                  className="text-[10px] text-zinc-500 hover:text-zinc-200 px-2 py-1 rounded hover:bg-white/[0.05]"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {/* Step 2: Plinth + lighting */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/[0.08] bg-[#0a0c13] p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">2 · Plinth</h3>
              <div className="grid grid-cols-2 gap-2">
                {PLINTH_OPTIONS.map((p) => {
                  const active = plinth === p.value;
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPlinth(p.value)}
                      className={`flex flex-col items-center gap-2 p-2 rounded-lg border transition cursor-pointer ${
                        active
                          ? 'bg-indigo-500/10 border-indigo-500/20 shadow-sm shadow-indigo-950/20'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-indigo-500/20' : 'bg-white/[0.03]'}" style={{ borderColor: active ? '#4f46e5' : 'transparent' }}>
                        <p.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium text-zinc-200 group-hover:text-white">{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#0a0c13] p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">3 · Lighting</h3>
              <div className="flex flex-col gap-2">
                {LOOK_CHOICES.map((lc) => {
                  const active = Math.abs(lc.value - look.timeOfDay) < 0.01;
                  return (
                    <button
                      key={lc.value}
                      type="button"
                      onClick={() => onLookChange(normalizeLook({ timeOfDay: lc.value, weather: 'clear' }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition cursor-pointer ${
                        active
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                          : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:border-white/[0.1]'
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-indigo-500" style={{ opacity: active ? 1 : 0 }} />
                      <span className="text-xs">{lc.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 4: Name */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0a0c13] p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">4 · Product name</h3>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Ceramic vase"
              className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none"
            />
          </div>

          {/* Generate */}
          <div className="rounded-xl border border-white/[0.08] bg-[#0a0c13] p-4">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={busy || !productImage}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              {busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{busy ? 'Generating…' : 'Generate product shot'}</span>
            </button>
          </div>
        </div>

        {/* Preview */}
        {generated && (
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#090b11]">
            <div className="h-11 px-3 py-2 border-b border-white/[0.08] bg-[#0c0e17] flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold text-zinc-200">Preview</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportHero}
                  disabled={busy}
                  title="Export hero PNG"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition cursor-pointer disabled:opacity-40"
                >
                  <Download className="w-3 h-3" />
                  <span className="hidden sm:inline">Hero PNG</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportClip}
                  disabled={clipBusy || !productImage}
                  title="Export turntable GIF"
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition cursor-pointer disabled:opacity-40"
                >
                  <Film className="w-3 h-3" />
                  <span className="hidden sm:inline">GIF</span>
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <iframe
                ref={iframeRef}
                src="data:text/html,"
                title="Product shot preview"
                className="w-full h-full block"
                style={{ border: 'none' }}
              ></iframe>
              {busy && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
                </div>
              )}
              {clipBusy && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 backdrop-blur-sm z-20">
                  <Loader2 className="w-3 h-3 animate-spin text-indigo-400" />
                  <span className="text-[10px] text-zinc-200 font-mono">{Math.round(clipProgress * 100)}%</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && createPortal(
        <div className="fixed bottom-4 right-4 z-[70] max-w-sm rounded-xl border border-amber-500/30 bg-[#1a1208] px-3 py-2 text-[11px] text-amber-200 flex items-start gap-2 shadow-xl">
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
    </div>
  );
};

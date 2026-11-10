import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Loader2, X, AlertTriangle, ImageIcon, Sparkles } from 'lucide-react';
import { extractPaletteApi } from '../lib/api';
import { LLMProvider, OllamaModelInfo } from '../types';
import { normalizeLook, type SceneLook } from '../lib/look';

interface PaletteFromPhotoProps {
  provider: LLMProvider;
  geminiModel: string;
  ollamaModel: string;
  ollamaModels?: OllamaModelInfo[];
  ollamaHost: string;
  apiKey: string;
  hasApiKey: boolean;
  onOpenSettings: () => void;
  onApply: (descriptor: string) => void;
  onApplyLook?: (look: SceneLook) => void;
  disabled?: boolean;
}

interface PaletteResult {
  palette: string[];
  horizon: number;
  lightAz: number;
  lightEl: number;
  mood: string;
  description: string;
}

function fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve({
        data: comma >= 0 ? result.slice(comma + 1) : result,
        mimeType: file.type || 'image/jpeg',
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function lightElToLook(lightEl: number): SceneLook {
  // Map the estimated sun elevation onto the Phase 3 time-of-day axis.
  let timeOfDay = 1 / 3; // noon
  if (lightEl < 12) timeOfDay = 0.95; // night
  else if (lightEl < 28) timeOfDay = 0.72; // dusk
  else if (lightEl < 50) timeOfDay = 0.33; // noon
  else timeOfDay = 0.12; // dawn
  return normalizeLook({ timeOfDay, weather: 'clear' });
}

export const PaletteFromPhoto: React.FC<PaletteFromPhotoProps> = ({
  provider,
  geminiModel,
  ollamaModel,
  ollamaModels = [],
  ollamaHost,
  apiKey,
  hasApiKey,
  onOpenSettings,
  onApply,
  onApplyLook,
  disabled,
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PaletteResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const detectedVisionModel = ollamaModels.find((model) => model.capabilities?.includes('vision'))?.name;
  const visionModel = detectedVisionModel || ollamaModel;

  const close = () => {
    setResult(null);
    setError(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('That does not look like an image.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Use a JPEG, PNG, or WebP reference image.');
      return;
    }
    if (file.size > 6 * 1024 * 1024) {
      setError('Reference images must be 6 MB or smaller.');
      return;
    }
    if (provider === 'gemini' && !hasApiKey && !apiKey) {
      setError('A Gemini API key is required to read a photo. Open settings to add one.');
      onOpenSettings();
      return;
    }
    if (provider === 'ollama' && !visionModel) {
      setError('Choose an Ollama vision model before reading a photo.');
      return;
    }

    setError(null);
    setResult(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setBusy(true);
    try {
      const { data, mimeType } = await fileToBase64(file);
      const res = await extractPaletteApi({
        image: data,
        mimeType,
        provider,
        geminiModel,
        ollamaModel: visionModel,
        ollamaHost,
        apiKey,
      });
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Could not read that photo');
    } finally {
      setBusy(false);
    }
  };

  const apply = () => {
    if (!result) return;
    const descriptor =
      `Paint this scene in the key of the reference photo: palette ${result.palette.join(', ')}; ` +
      `horizon at ${result.horizon.toFixed(2)}; light from azimuth ${Math.round(result.lightAz)}°, ` +
      `elevation ${Math.round(result.lightEl)}°; mood: ${result.mood}. ${result.description} ` +
      `Adopt these colours, lighting and atmosphere while keeping the requested subject and composition.`;
    onApply(descriptor);
    if (onApplyLook) onApplyLook(lightElToLook(result.lightEl));
    close();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || busy}
        aria-label="Paint from photo"
        title={provider === 'ollama' && detectedVisionModel
          ? `Analyze with ${detectedVisionModel}`
          : 'Upload a photo and paint the next scene in its colour and light key'}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-zinc-200 bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.08] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {busy ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-fuchsia-300" />
        ) : (
          <Camera className="w-3.5 h-3.5 text-fuchsia-300" />
        )}
        <span>{busy ? 'Reading…' : 'Photo'}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />

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

      {result && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Palette from photo"
        >
          <div className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#0c0e17] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
              <p className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-fuchsia-300" />
                Paint in this key
              </p>
              <button
                type="button"
                onClick={close}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="Reference photo"
                  className="w-full h-32 object-cover rounded-xl border border-white/[0.08]"
                />
              )}

              <div className="flex items-center gap-1.5 flex-wrap">
                {result.palette.map((c) => (
                  <span
                    key={c}
                    title={c}
                    className="w-7 h-7 rounded-lg border border-white/[0.12] shadow-inner"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>

              <div className="space-y-1">
                <p className="text-[11px] text-zinc-200 font-medium">{result.mood}</p>
                <p className="text-[10px] text-zinc-500 leading-relaxed">{result.description}</p>
                <p className="text-[10px] font-mono text-zinc-600">
                  horizon {result.horizon.toFixed(2)} · light az {Math.round(result.lightAz)}° · el {Math.round(result.lightEl)}°
                </p>
              </div>

              <p className="text-[10px] text-zinc-500">
                Applying adds this palette and lighting to your next prompt. Your requested subject and composition stay in control.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={close}
                className="px-3 py-1.5 rounded-lg text-[11px] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={apply}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-gradient-to-r from-fuchsia-600 to-indigo-600 hover:from-fuchsia-500 hover:to-indigo-500 border border-fuchsia-400/20 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Apply to prompt
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

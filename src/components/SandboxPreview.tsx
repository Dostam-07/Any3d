import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import {
  Play,
  Pause,
  Maximize2,
  Minimize2,
  Eye,
  RefreshCw,
  Sparkles,
  Grid3X3,
  Cuboid,
  Shapes,
  Gamepad2,
  Box,
  Download,
  Camera,
  EllipsisVertical,
} from 'lucide-react';
import { RenderFormat, SVGTheme, WorldFinish } from '../types';
import { GenerationPlayground } from './GenerationPlayground';
import { convertAny3dToThree, exportThreeToGlb, downloadGlbFile } from '../lib/glbExporter';
import { recordSceneFromIframe } from '../lib/turntable';
import { LookScrubber } from './LookScrubber';
import { DEFAULT_LOOK, type SceneLook } from '../lib/look';
import { renderStoryboard } from '../lib/storyboard';

export interface SandboxPreviewHandle {
  exportGlb: () => Promise<void>;
  /** Capture the current frame as a PNG data URL (works in an opaque sandbox). */
  snapshotPng: () => Promise<string>;
  /** Record the live scene to a short clip (Phase 2 turntable export). */
  recordTurntable: (options?: import('../lib/turntable').TurntableOptions) => Promise<import('../lib/turntable').TurntableResult>;
  /** Four camera angles composited into one sheet (Phase 5 storyboard). */
  storyboard: (options?: { name?: string; onProgress?: (progress: number) => void }) => Promise<import('../lib/storyboard').StoryboardResult>;
}

interface SandboxPreviewProps {
  html: string;
  format: RenderFormat;
  sceneName: string;
  isLoading: boolean;
  isGenerating?: boolean;
  generatingPrompt?: string;
  onRefresh: () => void;
  /** Controlled look controls (optional) so a parent page can own the state. */
  theme?: SVGTheme;
  onThemeChange?: (t: SVGTheme) => void;
  accent?: string;
  onAccentChange?: (c: string) => void;
  finish?: WorldFinish;
  onFinishChange?: (f: WorldFinish) => void;
  /** Hide the built-in control bar when the parent renders its own. */
  hideControls?: boolean;
  /** Controlled atmosphere (Phase 3); omit to let the preview own it. */
  look?: SceneLook;
  onLookChange?: (look: SceneLook) => void;
  /** Shared/untrusted scenes run in an opaque-origin iframe. */
  untrusted?: boolean;
}

const SVG_THEMES: SVGTheme[] = ['toy', 'soft', 'mono', 'line', 'night', 'print'];
const WORLD_FINISHES: WorldFinish[] = ['miniature', 'pixel', 'halftone', 'blueprint'];
const SWATCHES = ['#e0604b', '#5b4ae0', '#10b981', '#f59e0b', '#06b6d4', '#ec4899'];

function SandboxPreviewInner({
  html,
  format,
  sceneName,
  isLoading,
  isGenerating = false,
  generatingPrompt = '',
  onRefresh,
  theme,
  onThemeChange,
  accent,
  onAccentChange,
  finish,
  onFinishChange,
  hideControls = false,
  look,
  onLookChange,
  untrusted = false,
}: SandboxPreviewProps, ref: React.Ref<SandboxPreviewHandle>) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [themeState, setThemeState] = useState<SVGTheme>('toy');
  const [finishState, setFinishState] = useState<WorldFinish>('miniature');
  const svgTheme = theme ?? themeState;
  const worldFinish = finish ?? finishState;
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [hoverText, setHoverText] = useState<string>('');
  const [readoutText, setReadoutText] = useState<string>('');
  const [hotList, setHotList] = useState<string[]>([]);
  const [accentState, setAccentState] = useState<string>('#e0604b');
  const [lookState, setLookState] = useState<SceneLook>(DEFAULT_LOOK);
  const sceneLook = look ?? lookState;
  const lookRef = useRef(sceneLook);
  lookRef.current = sceneLook;
  const accentColor = accent ?? accentState;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPlayground, setShowPlayground] = useState<boolean>(false);
  const [isExportingGlb, setIsExportingGlb] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // The toolbar must adapt to the panel it lives in (not the viewport), otherwise
  // controls spill past the edge in a narrow split pane.
  const [compact, setCompact] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pngPending = useRef(
    new Map<string, { resolve: (url: string) => void; reject: (err: Error) => void; timer: number }>()
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width ?? el.clientWidth;
      setCompact(width < 620);
    });
    observer.observe(el);
    setCompact(el.clientWidth < 620);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [menuOpen]);

  // Never block the 3D view: auto-close playground when scene is ready so view shows directly
  useEffect(() => {
    if (!isGenerating && html) {
      setShowPlayground(false);
    }
  }, [isGenerating, html]);

  // Send message to iframe based on active format
  const sendMessage = (msg: Record<string, unknown>) => {
    if (!iframeRef.current?.contentWindow) return;
    const type =
      format === 'worlds'
        ? 'any3d-world'
        : format === 'pixel'
        ? 'any3d-pixel'
        : format === 'dither'
        ? 'any3d-dither'
        : 'any3d';
    iframeRef.current.contentWindow.postMessage({ type, ...msg }, '*');
  };

  // Listen to messages from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data || e.source !== iframeRef.current?.contentWindow) return;
      const d = e.data;

      // Bundle-side PNG capture: the frame answers even when it is opaque.
      if (d && d.png && typeof d.png.id === 'string') {
        const pending = pngPending.current.get(d.png.id);
        if (pending) {
          window.clearTimeout(pending.timer);
          pngPending.current.delete(d.png.id);
          if (d.png.error) pending.reject(new Error(d.png.error));
          else if (typeof d.png.dataUrl === 'string') pending.resolve(d.png.dataUrl);
          else pending.reject(new Error('The preview returned an empty image'));
        }
        return;
      }

      if (d.type === 'any3d') {
        // A freshly mounted scene knows nothing about the toolbar: hand it the look.
        if (d.ready) sendMessage({ look: lookRef.current });
        if (typeof d.hover === 'string') setHoverText(d.hover);
        if (typeof d.read === 'string') setReadoutText(d.read);
        if (Array.isArray(d.hot)) setHotList(d.hot);
      } else if (d.type === 'any3d-world') {
        if (typeof d.finish === 'string') setFinishState(d.finish as WorldFinish);
        if (d.state === 'ready') sendMessage({ look: lookRef.current });
      } else if (d.type === 'any3d-pixel') {
        if (typeof d.read === 'string') setReadoutText(d.read);
        if (d.ready) sendMessage({ look: lookRef.current });
      } else if (d.type === 'any3d-dither') {
        if (typeof d.read === 'string') setReadoutText(d.read);
        if (d.ready) sendMessage({ look: lookRef.current });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [format]);

  // Handle SVG theme change
  const handleThemeChange = (t: SVGTheme) => {
    setThemeState(t);
    onThemeChange?.(t);
    sendMessage({ theme: t });
  };

  // Handle Worlds finish change
  const handleFinishChange = (f: WorldFinish) => {
    setFinishState(f);
    onFinishChange?.(f);
    sendMessage({ finish: f });
  };

  // Atmosphere: a live message, never a re-mount or a re-bundle.
  const handleLookChange = (next: SceneLook) => {
    setLookState(next);
    onLookChange?.(next);
    sendMessage({ look: next });
  };

  // Handle Pause/Play toggle
  const handleTogglePlay = () => {
    const next = !isPaused;
    setIsPaused(next);
    if (format === 'worlds') {
      sendMessage({ paused: next });
    } else {
      sendMessage({ still: next });
    }
  };

  // Handle Accent Swatch
  const handleAccentChange = (color: string) => {
    setAccentState(color);
    onAccentChange?.(color);
    sendMessage({ accent: color });
  };

  // When a parent owns the look state, push its changes into the sandbox.
  const lastThemeRef = useRef<SVGTheme | undefined>(theme);
  const lastAccentRef = useRef<string | undefined>(accent);
  const lastFinishRef = useRef<WorldFinish | undefined>(finish);

  useEffect(() => {
    if (theme === undefined || lastThemeRef.current === theme) return;
    lastThemeRef.current = theme;
    sendMessage({ theme });
  }, [theme]);

  useEffect(() => {
    if (accent === undefined || lastAccentRef.current === accent) return;
    lastAccentRef.current = accent;
    sendMessage({ accent });
  }, [accent]);

  useEffect(() => {
    if (finish === undefined || lastFinishRef.current === finish) return;
    lastFinishRef.current = finish;
    sendMessage({ finish });
  }, [finish]);

  useEffect(() => {
    if (!look) return;
    sendMessage({ look });
  }, [look?.timeOfDay, look?.weather]);

  // Handle Speed (Worlds)
  const handleSpeedChange = (val: number) => {
    setSpeed(val);
    sendMessage({ speed: val });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleCameraPreset = (cam: 'iso' | 'top' | 'front' | 'side') => {
    const angles = {
      iso: { az: 38, el: 34 },
      top: { az: 0, el: 85 },
      front: { az: 0, el: 15 },
      side: { az: 85, el: 20 },
    };
    sendMessage({ camera: angles[cam] });
  };

  const requestPng = (scale = 2) =>
    new Promise<string>((resolve, reject) => {
      const id = `png-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const timer = window.setTimeout(() => {
        pngPending.current.delete(id);
        reject(new Error('The preview did not answer the capture request'));
      }, 8000);
      pngPending.current.set(id, { resolve, reject, timer });
      sendMessage({ want: 'png', id, scale });
    });

  const handleSnapshotPng = async () => {
    try {
      const dataUrl = await requestPng(2);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `Any3d-${sceneName || 'snapshot'}.png`;
      a.click();
    } catch (err: any) {
      alert(`Snapshot note: ${err.message || 'Could not export screenshot'}`);
    }
  };

  // Export 3D Scene directly to Binary GLTF (.glb)
  const handleExportGlb = async () => {
    if (untrusted) {
      alert('GLB export is disabled for shared scenes. Use HTML or PNG instead.');
      return;
    }
    setIsExportingGlb(true);
    try {
      const win = iframeRef.current?.contentWindow as any;
      if (!win) throw new Error('Preview canvas not ready yet.');

      let buffer: ArrayBuffer | null = null;
      if (format === 'worlds') {
        const runtime = win.__world || win.__any3d;
        const target = runtime?.content || runtime?.scene;
        if (!target) throw new Error('Three.js scene graph not yet instantiated in preview.');
        buffer = await exportThreeToGlb(target);
      } else {
        // SVG Figure
        const ctx = win.__any3d;
        const world = ctx?.world;
        if (!world) throw new Error('Any3d 3D scene graph not ready in preview.');
        const threeGroup = convertAny3dToThree(world);
        buffer = await exportThreeToGlb(threeGroup);
      }

      if (buffer) {
        downloadGlbFile(buffer, `Any3d-${sceneName || 'model'}.glb`);
      }
    } catch (err: any) {
      alert(`GLB Export Error: ${err.message}`);
    } finally {
      setIsExportingGlb(false);
    }
  };

  useImperativeHandle(ref, () => ({
    exportGlb: handleExportGlb,
    snapshotPng: () => requestPng(2),
    recordTurntable: async (options) => {
      if (untrusted) throw new Error('Clip export is disabled for shared scenes');
      const frame = iframeRef.current;
      if (!frame) throw new Error('Preview is not ready');
      return recordSceneFromIframe(frame, options);
    },
    storyboard: async (options) => {
      if (untrusted) throw new Error('Storyboard export is disabled for shared scenes');
      const frame = iframeRef.current;
      if (!frame) throw new Error('Preview is not ready');
      return renderStoryboard(frame, options);
    },
  }));

  // Engine accent badge config
  const engineColorClass =
    format === 'svg'
      ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
      : format === 'worlds'
      ? 'border-indigo-500/30 text-indigo-400 bg-indigo-500/10'
      : format === 'pixel'
      ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
      : 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10';

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full bg-[#090b11] relative overflow-hidden ${
        isFullscreen ? 'p-0' : ''
      }`}
    >
      {/* Top Floating Controls Bar — collapses to essentials on narrow panels */}
      <div
        className={
          'min-h-11 px-3 py-1.5 border-b border-white/[0.08] bg-[#0c0e17]/90 backdrop-blur-md flex-wrap items-center justify-between gap-x-2 gap-y-1 z-10 shrink-0 ' +
          (hideControls ? 'hidden' : 'flex')
        }
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
          <LookScrubber look={sceneLook} onChange={handleLookChange} compact={compact} />
          {compact ? (
            <>
              {format === 'svg' ? (
                <label className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">Theme</span>
                  <select
                    value={svgTheme}
                    onChange={(e) => handleThemeChange(e.target.value as SVGTheme)}
                    title="Scene theme"
                    className="text-[11px] font-mono px-1.5 py-0.5 rounded-lg bg-zinc-950/80 border border-white/[0.08] text-zinc-300 outline-none cursor-pointer capitalize"
                  >
                    {SVG_THEMES.map((t) => (
                      <option key={t} value={t} className="bg-[#0c0e17] capitalize">
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
              ) : format === 'worlds' ? (
                <label className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">Finish</span>
                  <select
                    value={worldFinish}
                    onChange={(e) => handleFinishChange(e.target.value as WorldFinish)}
                    title="Render finish"
                    className="text-[11px] font-mono px-1.5 py-0.5 rounded-lg bg-zinc-950/80 border border-white/[0.08] text-zinc-300 outline-none cursor-pointer capitalize"
                  >
                    {WORLD_FINISHES.map((f) => (
                      <option key={f} value={f} className="bg-[#0c0e17] capitalize">
                        {f}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-zinc-400">
                  {format === 'pixel' ? 'Pixel 320×240' : 'Dither 360×280'}
                </span>
              )}
            </>
          ) : format === 'svg' ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">Theme</span>
              <div className="flex items-center p-0.5 rounded-xl bg-zinc-950/80 border border-white/[0.06] text-xs">
                {SVG_THEMES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleThemeChange(t)}
                    className={`px-2.5 py-0.5 rounded-lg font-mono text-[11px] transition cursor-pointer capitalize ${
                      svgTheme === t
                        ? 'bg-zinc-800 text-emerald-400 font-semibold shadow-sm border border-emerald-500/30'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Accent Color Swatches for SVG */}
              <div className="flex items-center gap-1.5 ml-2 border-l border-white/[0.08] pl-2.5">
                {SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    onClick={() => handleAccentChange(hex)}
                    style={{ backgroundColor: hex }}
                    title={`Set accent to ${hex}`}
                    className={`w-3.5 h-3.5 rounded-full transition transform hover:scale-125 cursor-pointer ${
                      accentColor === hex ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110 shadow-sm' : 'opacity-80 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : format === 'worlds' ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold tracking-wider text-zinc-500 uppercase">Finish</span>
              <div className="flex items-center p-0.5 rounded-xl bg-zinc-950/80 border border-white/[0.06] text-xs">
                {WORLD_FINISHES.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => handleFinishChange(f)}
                    className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium transition cursor-pointer capitalize ${
                      worldFinish === f
                        ? 'bg-indigo-600 text-white shadow-sm border border-indigo-400/40'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          ) : format === 'pixel' ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-mono">
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>Pixel Engine · 320×240 Raster</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 font-mono">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Dither Engine · 360×280 4×4 Bayer</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {/* Worlds Speed Selector */}
          {format === 'worlds' && !compact && (
            <select
              value={speed}
              onChange={(e) => handleSpeedChange(Number(e.target.value))}
              className="bg-zinc-900 border border-white/[0.08] rounded-lg px-2 py-0.5 text-xs text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value={0.75}>0.75×</option>
              <option value={1}>1.0× (Normal)</option>
              <option value={1.5}>1.5×</option>
            </select>
          )}

          {/* Play/Pause Button */}
          <button
            onClick={handleTogglePlay}
            title={isPaused ? 'Resume Animation' : 'Show Still Frame'}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 transition cursor-pointer active:scale-95"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            <span className="hidden sm:inline">{isPaused ? 'Still' : 'Loop'}</span>
          </button>

          {/* Mini-Game Arcade Toggle (wide only) */}
          {!compact && (
            <button
              onClick={() => setShowPlayground(!showPlayground)}
              title={showPlayground ? 'View Scene' : 'Play AnyStack 3D Arcade'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer active:scale-95 ${
                showPlayground
                  ? 'bg-indigo-600 text-white border-indigo-400/50 shadow-sm'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-white/[0.08]'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">{showPlayground ? 'Scene' : 'AnyStack'}</span>
            </button>
          )}

          {/* Camera Preset Angles (wide only) */}
          {!compact && (
            <div className="flex items-center p-0.5 rounded-lg bg-zinc-950/80 border border-white/[0.06] text-[10px] font-mono">
              {(['iso', 'top', 'front', 'side'] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCameraPreset(c)}
                  title={`Switch camera to ${c.toUpperCase()} view`}
                  className="px-1.5 py-0.5 rounded text-zinc-400 hover:text-white uppercase transition cursor-pointer hover:bg-white/[0.06]"
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          {/* Snapshot PNG Button (wide only — compact keeps it in the menu) */}
          {!compact && (
            <button
              onClick={handleSnapshotPng}
              title="Download high-resolution PNG snapshot of the 3D scene"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white transition cursor-pointer active:scale-95"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">PNG</span>
            </button>
          )}

          {/* Re-render Button */}
          <button
            onClick={onRefresh}
            title="Reload sandbox preview"
            className="p-1.5 hover:text-white text-zinc-400 rounded-lg hover:bg-white/[0.06] transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            title="Toggle Fullscreen"
            className="p-1.5 hover:text-white text-zinc-400 rounded-lg hover:bg-white/[0.06] transition cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Compact overflow: every secondary control stays reachable */}
          {compact && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                title="More scene controls"
                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                  menuOpen
                    ? 'bg-zinc-800 text-white border-white/[0.16]'
                    : 'bg-zinc-900/90 text-zinc-400 hover:text-white border-white/[0.08]'
                }`}
              >
                <EllipsisVertical className="w-3.5 h-3.5" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl border border-white/[0.1] bg-[#0c0e17] shadow-2xl shadow-black/60 p-1.5 z-50 space-y-1">
                  <button
                    onClick={() => {
                      handleSnapshotPng();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-cyan-400" /> Snapshot PNG
                  </button>
                  <button
                    onClick={() => {
                      setShowPlayground(!showPlayground);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                  >
                    <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
                    {showPlayground ? 'Back to scene' : 'AnyStack arcade'}
                  </button>
                  <div className="px-2.5 pt-1 pb-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Camera</p>
                    <div className="flex items-center gap-1">
                      {(['iso', 'top', 'front', 'side'] as const).map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            handleCameraPreset(c);
                            setMenuOpen(false);
                          }}
                          className="flex-1 px-1 py-1 rounded-md bg-zinc-950/80 border border-white/[0.08] text-[10px] font-mono text-zinc-300 hover:text-white uppercase cursor-pointer"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                  {format === 'svg' && (
                    <div className="px-2.5 pt-1 pb-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Accent</p>
                      <div className="flex items-center gap-1.5">
                        {SWATCHES.map((hex) => (
                          <button
                            key={hex}
                            onClick={() => {
                              handleAccentChange(hex);
                              setMenuOpen(false);
                            }}
                            style={{ backgroundColor: hex }}
                            title={`Set accent to ${hex}`}
                            className={`w-4 h-4 rounded-full transition cursor-pointer ${
                              accentColor === hex ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0c0e17]' : 'opacity-80'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  {format === 'worlds' && (
                    <div className="px-2.5 pt-1 pb-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Speed</p>
                      <select
                        value={speed}
                        onChange={(e) => handleSpeedChange(Number(e.target.value))}
                        className="w-full bg-zinc-950/80 border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-zinc-300 outline-none cursor-pointer"
                      >
                        <option value={0.75}>0.75×</option>
                        <option value={1}>1.0× (Normal)</option>
                        <option value={1.5}>1.5×</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sandboxed Iframe Container */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center p-3 sm:p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#0a0c13] to-[#0a0c13]">
        {/* Playable Mini-Game Overlay (Only if user manually toggles it) */}
        {showPlayground && (
          <GenerationPlayground
            isGenerating={isGenerating}
            prompt={generatingPrompt}
            format={format}
            onRevealScene={() => setShowPlayground(false)}
            hasReadyScene={!isGenerating && Boolean(html)}
          />
        )}

        {/* Sleek, non-blocking floating generation status pill */}
        {isGenerating && !showPlayground && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-zinc-950/90 border border-indigo-500/40 text-indigo-200 text-xs shadow-2xl backdrop-blur-md animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span className="font-medium tracking-wide">Synthesizing Any3d Scene…</span>
          </div>
        )}

        {isLoading && !showPlayground && !isGenerating && (
          html ? (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950/90 border border-white/10 text-zinc-300 text-xs shadow-xl backdrop-blur-md">
              <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
              <span className="font-medium text-[11px]">Compiling Any3d Scene…</span>
            </div>
          ) : (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#090b11] text-zinc-300">
              <RefreshCw className="w-7 h-7 animate-spin text-indigo-400 mb-2" />
              <span className="text-xs font-medium tracking-wide">Rendering Any3d Scene…</span>
            </div>
          )
        )}

        <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-[#0c0e17] border border-white/[0.08] relative flex items-center justify-center">
          <iframe
            ref={iframeRef}
            srcDoc={html}
            title="Any3d Sandbox"
            sandbox={untrusted ? 'allow-scripts' : undefined}
            className="w-full h-full border-none block"
          />

          {/* Floating Read-out HUD Overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950/85 backdrop-blur-md border border-white/[0.08] text-[11px] font-mono text-zinc-200 shadow-xl">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>{hoverText ? `hover: ${hoverText}` : readoutText || 'scene interactive · click & drag'}</span>
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              {hotList.length > 0 && (
                <div className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-zinc-950/85 backdrop-blur-md text-zinc-400 border border-white/[0.08] shadow-md hidden sm:block">
                  pickable: {hotList.join(', ')}
                </div>
              )}
              <div className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-zinc-500 border border-white/[0.05] shadow-sm hidden md:block">
                Drag to rotate · Scroll to zoom
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const SandboxPreview = forwardRef(SandboxPreviewInner) as React.ForwardRefExoticComponent<SandboxPreviewProps & React.RefAttributes<SandboxPreviewHandle>>;
SandboxPreview.displayName = 'SandboxPreview';

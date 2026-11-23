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
  ChevronDown,
  Layers,
  Palette,
  Compass,
  Frame,
} from 'lucide-react';
import { RenderFormat, SVGTheme, WorldFinish, WebPresentationSize } from '../types';
import { GenerationPlayground } from './GenerationPlayground';
import { HeroSiteChrome, LiveCardBody, LookStrip } from './PresentationViews';
import { convertAny3dToThree, exportThreeToGlb, downloadGlbFile } from '../lib/glbExporter';
import { recordSceneFromIframe } from '../lib/turntable';
import { LookScrubber } from './LookScrubber';
import { DEFAULT_LOOK, type SceneLook } from '../lib/look';
import { CAMERA_PRESETS, cameraLabel, type CameraPick } from '../lib/camera';
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
  /** Web layout presentation format: hero (webpage hero section) or card (website feature card) */
  size?: WebPresentationSize;
  onSizeChange?: (size: WebPresentationSize) => void;
  /** Shared/untrusted scenes run in an opaque-origin iframe. */
  untrusted?: boolean;
  /** Generated scene source, shown (abridged) in the card section's CTA. */
  code?: string;
  /** Export the standalone HTML file; the CTA in the card section calls this. */
  onExportHtml?: () => void;
  /** Open the stage in code mode, from the card's "Editable source" link. */
  onOpenCode?: () => void;
  /** Camera the user framed; exports bake it the way they bake the look. */
  camera?: CameraPick | null;
  onCameraChange?: (camera: CameraPick | null) => void;
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
  size,
  onSizeChange,
  untrusted = false,
  code = '',
  onExportHtml,
  camera,
  onCameraChange,
}: SandboxPreviewProps, ref: React.Ref<SandboxPreviewHandle>) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [sizeState, setSizeState] = useState<WebPresentationSize>('card');
  const currentSize = size ?? sizeState;
  const [sizeMenuOpen, setSizeMenuOpen] = useState<boolean>(false);
  const sizeMenuRef = useRef<HTMLDivElement>(null);
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
  // The ready handshake has to replay the picked camera too, or a scene that
  // mounts after the pick reopens at its authored angle.
  const cameraRef = useRef<CameraPick | null>(camera ?? null);
  cameraRef.current = camera ?? null;
  const accentColor = accent ?? accentState;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPlayground, setShowPlayground] = useState<boolean>(false);
  const [isExportingGlb, setIsExportingGlb] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  // The toolbar must adapt to the panel it lives in (not the viewport), otherwise
  // controls spill past the edge in a narrow split pane.
  const [compact, setCompact] = useState<boolean>(false);
  const [stageWidth, setStageWidth] = useState<number>(0);
  const [stageHeight, setStageHeight] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [styleMenuOpen, setStyleMenuOpen] = useState<boolean>(false);
  const [cameraMenuOpen, setCameraMenuOpen] = useState<boolean>(false);
  const [activeCamera, setActiveCamera] = useState<'iso' | 'top' | 'front' | 'side'>('iso');
  // A camera can also arrive from outside (a shared link): the toolbar shows what
  // the stage is actually looking at, not the last button pressed here.
  const shownCamera = camera ? cameraLabel(camera) : activeCamera;
  const styleMenuRef = useRef<HTMLDivElement>(null);
  const cameraMenuRef = useRef<HTMLDivElement>(null);
  const pngPending = useRef(
    new Map<string, { resolve: (url: string) => void; reject: (err: Error) => void; timer: number }>()
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect?.width ?? el.clientWidth;
      setCompact(width < 620);
      setStageWidth(width);
    });
    observer.observe(el);
    setCompact(el.clientWidth < 620);
    setStageWidth(el.clientWidth);
    return () => observer.disconnect();
  }, []);

  // The stage's own box decides the card grid and how much chrome fits. Height
  // matters as much as width: a short stage has to drop the section blurb so the
  // cards still fit without scrolling.
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const box = entries[0]?.contentRect;
      if (!box) return;
      setStageWidth(box.width);
      setStageHeight(box.height);
    });
    observer.observe(el);
    setStageWidth(el.clientWidth);
    setStageHeight(el.clientHeight);
    return () => observer.disconnect();
  }, []);

  // The scene is the subject: the card takes as much of the stage as the height
  // allows and the look controls ride underneath as a strip. Rather than assume a
  // header height / caption height / gap budget (all of which drift when a scene
  // name wraps or a chip line hides), the width is fitted against the real layout:
  // set it, read how much the stage overflows or has spare, correct, repeat. Four
  // passes is plenty and the result needs no constants to stay correct.
  const cardSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentSize !== 'card') return;
    const stage = stageRef.current;
    const section = cardSectionRef.current;
    if (!stage || !section) return;

    let frame = 0;
    const fit = () => {
      const limit = Math.min(1152, Math.max(260, stage.clientWidth - 16));
      let width = Math.min(limit, section.clientWidth || limit);
      for (let pass = 0; pass < 6; pass += 1) {
        section.style.maxWidth = `${Math.round(width)}px`;
        // scrollHeight is clamped to the box, so it can only report overflow, not
        // spare room: measure the section's own box instead.
        const style = getComputedStyle(stage);
        const paddingTop = parseFloat(style.paddingTop) || 0;
        const paddingBottom = parseFloat(style.paddingBottom) || 0;
        const content = section.offsetTop - stage.scrollTop + section.offsetHeight;
        const slack = stage.clientHeight - paddingTop - paddingBottom - content;
        if (Math.abs(slack) < 2) break;
        // A 4:3 box gains (or loses) three quarters of a pixel of height per pixel
        // of width, so the correction is slack * 4/3. Damped slightly to settle.
        width = Math.max(260, Math.min(limit, width + slack * 0.72));
      }
      section.style.maxWidth = `${Math.round(width)}px`;
    };

    fit();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(fit);
    });
    observer.observe(stage);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [currentSize, stageHeight, stageWidth, format, sceneName, sceneLook.weather, sceneLook.timeOfDay]);

  useEffect(() => {
    if (!menuOpen && !styleMenuOpen && !cameraMenuOpen && !sizeMenuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (styleMenuRef.current && !styleMenuRef.current.contains(e.target as Node)) setStyleMenuOpen(false);
      if (cameraMenuRef.current && !cameraMenuRef.current.contains(e.target as Node)) setCameraMenuOpen(false);
      if (sizeMenuRef.current && !sizeMenuRef.current.contains(e.target as Node)) setSizeMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [menuOpen, styleMenuOpen, cameraMenuOpen, sizeMenuOpen]);

  // Automatically launch the playable 3D tower stacking game while generating assets
  useEffect(() => {
    if (isGenerating) {
      setShowPlayground(true);
    }
  }, [isGenerating]);

  // Send message to iframe based on active format
  const sendMessage = (msg: Record<string, unknown>) => {
    if (!iframeRef.current?.contentWindow) return;
    const type =
      format === 'worlds'
        ? 'any3d-world'
        : format === 'pixel'
        ? 'any3d-pixel'
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
        // A freshly mounted scene knows nothing about the toolbar: hand it the look and size.
        if (d.ready) {
          sendMessage({ look: lookRef.current, size: currentSize });
          if (cameraRef.current) sendMessage({ camera: cameraRef.current });
        }
        if (typeof d.hover === 'string') setHoverText(d.hover);
        if (typeof d.read === 'string') setReadoutText(d.read);
        if (Array.isArray(d.hot)) setHotList(d.hot);
      } else if (d.type === 'any3d-world') {
        if (typeof d.finish === 'string') setFinishState(d.finish as WorldFinish);
        if (d.state === 'ready') {
          sendMessage({ look: lookRef.current });
          if (cameraRef.current) sendMessage({ camera: cameraRef.current });
        }
      } else if (d.type === 'any3d-pixel') {
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

  // Handle Size change
  const handleSizeChange = (s: WebPresentationSize) => {
    setSizeState(s);
    onSizeChange?.(s);
    sendMessage({ size: s });
  };

  const lastSizeRef = useRef<WebPresentationSize | undefined>(size);
  useEffect(() => {
    if (size === undefined || lastSizeRef.current === size) return;
    lastSizeRef.current = size;
    sendMessage({ size });
  }, [size]);

  useEffect(() => {
    if (!look) return;
    sendMessage({ look });
  }, [look?.timeOfDay, look?.weather]);

  // A camera picked elsewhere (a stored session, a share link) is applied here.
  useEffect(() => {
    if (!camera) return;
    sendMessage({ camera });
  }, [camera && JSON.stringify(camera)]);

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
    // `reset` restores the angle the scene was authored for: an SVG figure's own
    // camera is part of its art, so a fixed 38/34 would override it.
    const pick = CAMERA_PRESETS[cam];
    sendMessage({ camera: pick });
    // Lift the pick so an export reopens at the angle the user framed.
    onCameraChange?.(pick);
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
      // The sheet shows the frame the user is looking at: the presentation they
      // chose and, when they picked one, their own angle as the first tile.
      return renderStoryboard(frame, {
        ...options,
        size: currentSize,
        camera: cameraRef.current,
      });
    },
  }));

  // Two presentations, one live iframe: only the surrounding CSS changes when
  // the size is switched, so the scene never reloads and keeps its pose.
  const motionLabel = isPaused ? 'Paused still' : 'Live loop';

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
      {/* Top Floating Controls Bar — single-row clubbed actions */}
      <div
        className={
          'min-h-11 px-2.5 py-1.5 border-b border-white/[0.08] bg-[#0c0e17]/95 backdrop-blur-md items-center justify-between gap-2 z-10 shrink-0 w-full overflow-x-auto scrollbar-none flex-nowrap ' +
          (hideControls ? 'hidden' : 'flex')
        }
      >
        {/* If mini-game/generation playground is active: Show clean focused arcade bar */}
        {showPlayground ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center">
                <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
              </div>
              <span className="text-xs font-bold text-white tracking-wide">AnyStack 3D Arcade</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
                Mini-Game
              </span>
            </div>

            <div className="flex items-center gap-2">
              {Boolean(html) && (
                <button
                  type="button"
                  onClick={() => setShowPlayground(false)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View 3D Scene</span>
                </button>
              )}
              <button
                onClick={toggleFullscreen}
                title="Toggle Fullscreen"
                className="p-1.5 hover:text-white text-zinc-400 rounded-lg hover:bg-white/[0.06] transition cursor-pointer"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        ) : (
          /* Normal 3D Scene View: Clubbed controls in ONE single slender row */
          <>
            <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
              {/* Club 1: Environment & Lighting — the card strip owns the look in
                  that presentation, so this only appears for the hero. */}
              {currentSize !== 'card' && <LookScrubber look={sceneLook} onChange={handleLookChange} />}

              {/* Club 2: Material Style / Finish / Theme */}
              <div className="relative shrink-0" ref={styleMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setStyleMenuOpen(!styleMenuOpen);
                    setCameraMenuOpen(false);
                    setSizeMenuOpen(false);
                  }}
                  title={`Render style and finish (${format === 'worlds' ? worldFinish : svgTheme})`}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition cursor-pointer active:scale-95 shrink-0 ${
                    styleMenuOpen
                      ? 'bg-zinc-800 text-indigo-300 border-indigo-500/40 shadow-sm ring-1 ring-indigo-500/20'
                      : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-white/[0.08]'
                  }`}
                >
                  {format === 'worlds' ? (
                    <>
                      <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="capitalize text-[11px] font-medium">{worldFinish}</span>
                    </>
                  ) : format === 'svg' ? (
                    <>
                      <Palette className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="capitalize text-[11px] font-medium">{svgTheme}</span>
                      <span
                        className="w-2 h-2 rounded-full inline-block border border-white/20 ml-0.5 shrink-0"
                        style={{ backgroundColor: accentColor }}
                      />
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="text-[11px] font-mono">Pixel</span>
                    </>
                  )}
                  <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform shrink-0 ${styleMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {styleMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-64 p-3 rounded-2xl bg-[#0c0e17] border border-white/[0.12] shadow-2xl shadow-black/80 z-50 backdrop-blur-xl animate-fade-in space-y-3">
                    {format === 'worlds' ? (
                      <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-400" />
                          <span>3D World Finish</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {WORLD_FINISHES.map((f) => (
                            <button
                              key={f}
                              type="button"
                              onClick={() => {
                                handleFinishChange(f);
                                setStyleMenuOpen(false);
                              }}
                              className={`flex flex-col items-start p-2 rounded-xl text-left border transition cursor-pointer capitalize ${
                                worldFinish === f
                                  ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200 font-semibold shadow-sm'
                                  : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
                              }`}
                            >
                              <span className="text-xs font-semibold">{f}</span>
                              <span className="text-[9px] text-zinc-500">
                                {f === 'miniature'
                                  ? 'Soft shaded diorama'
                                  : f === 'pixel'
                                  ? 'Retro pixel raster'
                                  : f === 'halftone'
                                  ? 'Print halftone dots'
                                  : 'Drafting blueprint'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : format === 'svg' ? (
                      <div className="space-y-3">
                        <div>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
                            <Palette className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Vector Theme</span>
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            {SVG_THEMES.map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => handleThemeChange(t)}
                                className={`py-1 px-2 rounded-lg text-[11px] font-mono capitalize border transition cursor-pointer text-center ${
                                  svgTheme === t
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold'
                                    : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/[0.06]">
                          <div className="text-[10px] text-zinc-400 mb-1.5">Accent Color</div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {SWATCHES.map((hex) => (
                              <button
                                key={hex}
                                onClick={() => handleAccentChange(hex)}
                                style={{ backgroundColor: hex }}
                                title={`Set accent color to ${hex}`}
                                className={`w-5 h-5 rounded-full transition transform hover:scale-125 cursor-pointer ${
                                  accentColor === hex
                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-950 scale-110 shadow-sm'
                                    : 'opacity-80 hover:opacity-100'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-zinc-400">
                        Pixel Art engine 320×240
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Club 3: Camera Angles — a 2D engine has no camera to move. */}
              {format !== 'pixel' && (
                <div className="relative shrink-0" ref={cameraMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setCameraMenuOpen(!cameraMenuOpen);
                      setStyleMenuOpen(false);
                      setSizeMenuOpen(false);
                    }}
                    title={`Camera view angle (${shownCamera.toUpperCase()})`}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition cursor-pointer active:scale-95 shrink-0 ${
                      cameraMenuOpen
                        ? 'bg-zinc-800 text-sky-300 border-sky-500/40 shadow-sm'
                        : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-white/[0.08]'
                    }`}
                  >
                    <Compass className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="font-mono text-[11px] uppercase hidden sm:inline">{shownCamera}</span>
                    <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform shrink-0 ${cameraMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {cameraMenuOpen && (
                    <div className="absolute left-0 top-full mt-2 w-48 p-1.5 rounded-xl bg-[#0c0e17] border border-white/[0.12] shadow-2xl z-50 backdrop-blur-xl animate-fade-in space-y-1">
                      {[
                        { key: 'iso', label: 'Isometric View', desc: 'Standard 3D angle' },
                        { key: 'top', label: 'Top (Plan)', desc: 'Overhead view' },
                        { key: 'front', label: 'Front Elevation', desc: 'Face view' },
                        { key: 'side', label: 'Side Elevation', desc: 'Profile view' },
                      ].map((cam) => (
                        <button
                          key={cam.key}
                          onClick={() => {
                            handleCameraPreset(cam.key as any);
                            setActiveCamera(cam.key as any);
                            setCameraMenuOpen(false);
                          }}
                          className={`w-full flex flex-col items-start px-2.5 py-1.5 rounded-lg text-left transition cursor-pointer ${
                            shownCamera === cam.key
                              ? 'bg-sky-500/20 text-sky-200 font-semibold'
                              : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs">{cam.label}</span>
                            <span className="text-[10px] font-mono uppercase text-zinc-500">{cam.key}</span>
                          </div>
                          <span className="text-[9px] text-zinc-500">{cam.desc}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Club 4: Stage Size (Hero vs Card) */}
              <div className="relative shrink-0" ref={sizeMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setSizeMenuOpen(!sizeMenuOpen);
                    setStyleMenuOpen(false);
                    setCameraMenuOpen(false);
                  }}
                  title={`Web presentation: ${currentSize === 'hero' ? 'full-bleed hero banner with page chrome' : 'compact card inside a responsive cards section'}`}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition cursor-pointer active:scale-95 shrink-0 ${
                    sizeMenuOpen
                      ? 'bg-zinc-800 text-purple-300 border-purple-500/40 shadow-sm'
                      : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-white/[0.08]'
                  }`}
                >
                  <Frame className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="capitalize text-[11px] font-medium hidden sm:inline">{currentSize}</span>
                  <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform shrink-0 ${sizeMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {sizeMenuOpen && (
                  <div className="absolute left-0 top-full mt-2 w-60 p-1.5 rounded-xl bg-[#0c0e17] border border-white/[0.12] shadow-2xl z-50 backdrop-blur-xl animate-fade-in space-y-1">
                    {[
                      { key: 'hero', label: 'Hero Section', desc: 'Full-bleed banner: nav, headline, one CTA' },
                      { key: 'card', label: 'Cards Section', desc: 'Compact 4:3 card in a responsive grid' },
                    ].map((sz) => (
                      <button
                        key={sz.key}
                        type="button"
                        onClick={() => {
                          handleSizeChange(sz.key as any);
                          setSizeMenuOpen(false);
                        }}
                        className={`w-full flex flex-col items-start px-2.5 py-1.5 rounded-lg text-left transition cursor-pointer ${
                          currentSize === sz.key
                            ? 'bg-purple-600/20 text-purple-200 font-semibold'
                            : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-medium">{sz.label}</span>
                          <span className="text-[10px] font-mono uppercase text-zinc-500">{sz.key}</span>
                        </div>
                        <span className="text-[9px] text-zinc-500">{sz.desc}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Group: Playback, AnyStack, Snapshot, Fullscreen */}
            <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
              {/* Play / Pause Toggle & Speed */}
              <div className="flex items-center rounded-xl bg-zinc-900/90 border border-white/[0.08] p-0.5 shrink-0">
                {currentSize !== 'card' && (
                  <button
                    onClick={handleTogglePlay}
                    title={isPaused ? 'Resume Animation' : 'Show Still Frame'}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-zinc-300 hover:text-white transition cursor-pointer active:scale-95 shrink-0"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                    <span className="text-[11px] hidden sm:inline">{isPaused ? 'Still' : 'Loop'}</span>
                  </button>
                )}

                {/* Worlds Speed Selector */}
                {format === 'worlds' && (
                  <select
                    value={speed}
                    onChange={(e) => handleSpeedChange(Number(e.target.value))}
                    title="Playback speed"
                    className="bg-transparent border-l border-white/[0.08] px-1.5 py-1 text-[11px] text-zinc-400 hover:text-zinc-200 focus:outline-none cursor-pointer"
                  >
                    <option value={0.75} className="bg-zinc-900 text-zinc-200">0.75×</option>
                    <option value={1} className="bg-zinc-900 text-zinc-200">1.0×</option>
                    <option value={1.5} className="bg-zinc-900 text-zinc-200">1.5×</option>
                  </select>
                )}
              </div>

              {/* AnyStack 3D Arcade Button */}
              <button
                onClick={() => setShowPlayground(!showPlayground)}
                title={showPlayground ? 'Back to 3D Scene' : 'Play AnyStack 3D Arcade Game'}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-95 shrink-0 ${
                  showPlayground
                    ? 'bg-indigo-600 text-white border-indigo-400/50 shadow-sm'
                    : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-white/[0.08]'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px] hidden sm:inline">AnyStack</span>
              </button>

              {/* Standalone HTML Export — the same action the project header offers,
                  kept here so the hub stage has one too. */}
              {onExportHtml && (
                <button
                  onClick={onExportHtml}
                  disabled={!code}
                  title="Download standalone offline HTML (runtime inlined)"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white transition cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] hidden sm:inline">HTML</span>
                </button>
              )}

              {/* Snapshot PNG Button */}
              <button
                onClick={handleSnapshotPng}
                title="Download high-resolution PNG snapshot of the 3D scene"
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.08] text-zinc-300 hover:text-white transition cursor-pointer active:scale-95 shrink-0"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] hidden sm:inline">PNG</span>
              </button>

              {/* Reload Button */}
              <button
                onClick={onRefresh}
                title="Reload sandbox preview"
                className="p-1.5 hover:text-white text-zinc-400 rounded-lg hover:bg-white/[0.06] transition cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                title="Toggle Fullscreen"
                className="p-1.5 hover:text-white text-zinc-400 rounded-lg hover:bg-white/[0.06] transition cursor-pointer shrink-0"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Presentation stage. Hero is a full-bleed banner; Card is a scrollable
          section of compact cards. Same iframe node in both, different page. */}
      <div
        ref={stageRef}
        className={
          '@container relative w-full flex-1 min-h-0 ' +
          (currentSize === 'hero'
            ? 'overflow-hidden bg-[#05070d]'
            : 'no-scrollbar overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/25 via-[#0a0c13] to-[#0a0c13] px-3 ' +
            (stageHeight > 0 && stageHeight < 820 ? 'py-3 sm:py-3' : 'py-4 sm:py-5'))
        }
      >
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

        <div
          ref={cardSectionRef}
          className={
            currentSize === 'hero'
              ? 'absolute inset-0'
              : 'mx-auto flex w-full flex-col ' +
                (stageHeight > 0 && stageHeight < 820 ? 'gap-2' : 'gap-2.5')
          }
        >
          {currentSize === 'hero' ? (
            <HeroSiteChrome
              sceneName={sceneName}
              format={format}
              motion={motionLabel}
              onFullscreen={toggleFullscreen}
              onSnapshot={handleSnapshotPng}
            />
          ) : null}

          <div
            className={
              currentSize === 'hero'
                ? 'absolute inset-0 z-0'
                : 'flex flex-col gap-2'
            }
          >
            <article
              className={
                currentSize === 'hero'
                  ? 'absolute inset-0 overflow-hidden'
                  : 'group flex flex-col overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.9)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--text-muted)]/40'
              }
            >
              <div
                className={
                  currentSize === 'hero'
                    ? 'relative h-full w-full overflow-hidden'
                    : 'relative aspect-[4/3] w-full overflow-hidden bg-[#080a11]'
                }
              >
                <iframe
                  ref={iframeRef}
                  srcDoc={html}
                  title="Any3d Sandbox"
                  sandbox={untrusted ? 'allow-scripts' : undefined}
                  className="absolute inset-0 h-full w-full border-none block"
                />

                {currentSize === 'hero' ? (
                  <div className="pointer-events-none absolute bottom-4 right-4 z-20 flex flex-col items-end gap-1.5">
                    {hoverText && (
                      <div className="flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-zinc-950/80 px-2.5 py-1 text-[10px] font-mono text-indigo-200 backdrop-blur-md">
                        <Eye className="h-3 w-3 text-indigo-400" />
                        {hoverText}
                      </div>
                    )}
                    <span className="rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[10px] font-mono text-white/45 backdrop-blur-sm [@media(max-height:420px)]:hidden">
                      Drag to orbit · scroll to zoom
                    </span>
                  </div>
                ) : (
                  <span className="pointer-events-none absolute left-2.5 top-2.5 z-10 rounded-md border border-white/10 bg-black/35 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/70 backdrop-blur-sm">
                    Live embed
                  </span>
                )}
              </div>

              {currentSize === 'card' && (
                <div className="shrink-0">
                  <LiveCardBody
                    sceneName={sceneName}
                    format={format}
                    motion={motionLabel}
                    hoverText={hoverText}
                    onSnapshot={handleSnapshotPng}
                    onFullscreen={toggleFullscreen}
                  />
                </div>
              )}
            </article>

            {currentSize === 'card' && (
              <div className="shrink-0">
                <LookStrip
                  accent={accentColor}
                  look={sceneLook}
                  isPaused={isPaused}
                  compact={stageHeight > 0 && stageHeight < 820}
                  onAccentChange={handleAccentChange}
                  onLookChange={handleLookChange}
                  onTogglePlay={handleTogglePlay}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const SandboxPreview = forwardRef(SandboxPreviewInner) as React.ForwardRefExoticComponent<SandboxPreviewProps & React.RefAttributes<SandboxPreviewHandle>>;
SandboxPreview.displayName = 'SandboxPreview';

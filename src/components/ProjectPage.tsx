import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Lock, LockOpen } from 'lucide-react';
import { drawSurprise } from '../lib/surprise-deck';
import {
  ArrowLeft,
  Sparkles,
  Send,
  Bot,
  Loader2,
  Code2,
  Eye,
  Download,
  Box,
  Wand2,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Layers,
  RotateCcw,
  PanelLeftClose,
  Share2,
  Copy,
  Check,
  X,
  ExternalLink,
  GitCompare,
  Sun,
  Moon,
  PanelLeft,
  EllipsisVertical,
  Settings2,
} from 'lucide-react';
import { ChatMessage, OllamaModelInfo, PresetScene, RenderFormat, SVGTheme, WorldFinish } from '../types';
import { SandboxPreview, SandboxPreviewHandle } from './SandboxPreview';
import { ClipControl } from './ClipControl';
import { PaletteFromPhoto } from './PaletteFromPhoto';
import {
  encodeScene,
  sceneShareUrl,
  SCENE_PAYLOAD_VERSION,
  SHARE_ROUTE_SOFT_LIMIT,
} from '../lib/scene-payload';
import { CodeEditor } from './CodeEditor';
import { VersionDiff } from './VersionDiff';
import { DEFAULT_LOOK, type SceneLook } from '../lib/look';

/**
 * Dedicated project page.
 *
 * This is the surface that future improvements target: a full page that opens
 * when a project starts, with the conversation as the primary interface and the
 * live scene beside it. It deliberately does NOT reuse the Studio workspace.
 */

interface ProjectPageProps {
  projectId: string;
  title: string;
  messages: ChatMessage[];
  isProcessing: boolean;
  format: RenderFormat;
  onSelectFormat: (f: RenderFormat) => void;
  modelName: string;
  providerLabel: string;
  hasApiKey: boolean;
  provider?: 'gemini' | 'ollama';
  geminiModel?: string;
  ollamaModel?: string;
  ollamaHost?: string;
  apiKey?: string;
  onOpenSettings: () => void;
  models: OllamaModelInfo[];
  canSelectModel: boolean;
  onSelectModel: (name: string) => void;
  code: string;
  setCode: (c: string) => void;
  sceneName: string;
  html: string;
  isBundling: boolean;
  validationOk: boolean;
  /** Shared scenes run sandboxed; DOM-reaching exports are unavailable. */
  untrusted?: boolean;
  /** Controlled atmosphere, shared with the Studio so chat look edits apply here. */
  look?: SceneLook;
  onLookChange?: (look: SceneLook) => void;
  presets?: PresetScene[];
  onRemixPreset?: (preset: PresetScene) => void;
  onSendMessage: (text: string) => Promise<void>;
  onRestoreVersion: (msg: ChatMessage) => void;
  onEnhance: (text: string) => Promise<string | void>;
  /** Locked generation seed, shared with the Studio. */
  seed?: number;
  seedLocked?: boolean;
  onToggleSeedLock?: () => void;
  onExportHtml: () => void;
  onExportGlb: () => void;
  onBackHome: () => void;
  onOpenStudio: () => void;
  onRefreshPreview: () => void;
  onResetCode: () => void;
  previewRef: React.RefObject<SandboxPreviewHandle | null>;
  colorMode: 'light' | 'dark';
  onToggleTheme: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const ENGINE_META: Record<RenderFormat, { label: string; blurb: string }> = {
  svg: { label: 'SVG Vector', blurb: 'Crisp isometric vector scene' },
  worlds: { label: 'Three.js', blurb: 'Narrative miniature 3D world' },
  pixel: { label: 'Pixel Art', blurb: '320×240 pixel micro-scene' },
  dither: { label: '4×4 Dither', blurb: 'Retro ordered-dither scene' },
};

const STARTERS: Record<RenderFormat, { title: string; prompt: string }[]> = {
  svg: [
    { title: 'Coffee cart', prompt: 'A retro coffee cart on a street corner with a barista pulling shots and a cat on a chair' },
    { title: 'Harbour quay', prompt: 'A busy container harbour quay with a gantry crane lifting cargo' },
    { title: 'Lighthouse', prompt: 'A seaside lighthouse island with breathing waves and a docking boat' },
  ],
  worlds: [
    { title: 'Bakery morning', prompt: 'A morning bakery with a baker rolling dough on a flour-dusted bench' },
    { title: 'Flower stall', prompt: 'A florist arranging vibrant bouquets in a flower stall' },
    { title: 'Juggler', prompt: 'A street juggler performing a 3-ball cascade in rhythm' },
  ],
  pixel: [
    { title: 'Wet cobblestone', prompt: 'A flower stall on wet cobblestone with buckets of tulips and an awning' },
    { title: 'Fishing pier', prompt: 'An old wooden fishing pier with drying nets and a gull on a bollard' },
    { title: 'Allotment', prompt: 'A peaceful riverside allotment with raised vegetable patches and shed' },
  ],
  dither: [
    { title: 'Mountain forge', prompt: 'A weathered mountain forge with water wheel turning and glowing embers' },
    { title: 'Cliff lighthouse', prompt: 'A solitary cliffside lighthouse in storm winds with revolving beam' },
    { title: 'Tea house', prompt: 'A traditional hillside tea house with bamboo railings and gravel garden' },
  ],
};

export const ProjectPage: React.FC<ProjectPageProps> = ({
  projectId,
  title,
  messages,
  isProcessing,
  format,
  onSelectFormat,
  modelName,
  providerLabel,
  hasApiKey,
  provider = 'gemini',
  geminiModel = 'gemini-2.5-flash',
  ollamaModel = '',
  ollamaHost = 'http://localhost:11434',
  apiKey = '',
  onOpenSettings,
  models,
  canSelectModel,
  onSelectModel,
  code,
  setCode,
  sceneName,
  html,
  isBundling,
  validationOk,
  untrusted = false,
  look: controlledLook,
  onLookChange,
  presets = [],
  onRemixPreset,
  onSendMessage,
  onRestoreVersion,
  onEnhance,
  seed,
  seedLocked = false,
  onToggleSeedLock,
  onExportHtml,
  onExportGlb,
  onBackHome,
  onOpenStudio,
  onRefreshPreview,
  onResetCode,
  previewRef,
  colorMode,
  onToggleTheme,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const [draft, setDraft] = useState('');
  const [stage, setStage] = useState<'preview' | 'code'>('preview');
  // Look controls live here so they stay visible at any panel width.
  const [theme, setTheme] = useState<SVGTheme>('toy');
  const [accent, setAccent] = useState('#e0604b');
  const [finish, setFinish] = useState<WorldFinish>('miniature');

  // Share: a scene is small enough to live in a URL, so a link is the whole product.
  const [shareOpen, setShareOpen] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [localLook, setLocalLook] = useState<SceneLook>(DEFAULT_LOOK);
  const look = controlledLook ?? localLook;
  const changeLook = onLookChange ?? setLocalLook;
  const [shareUrl, setShareUrl] = useState('');
  const [shareError, setShareError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const openShare = async () => {
    setShareOpen(true);
    setCopied(false);
    setShareError(null);
    setShareUrl('');
    setShareBusy(true);
    try {
      // Prefer the user's own description over a command or a preset load.
      const prompt = [...messages]
        .reverse()
        .find(
          (m) =>
            m.role === 'user' &&
            !/^\s*(\/|Load preset:)/i.test(m.content)
        )?.content;
      const encoded = await encodeScene(
        {
          v: SCENE_PAYLOAD_VERSION,
          format,
          code,
          prompt,
          theme: format === 'svg' ? theme : undefined,
          finish: format === 'worlds' ? finish : undefined,
          look,
        },
        { compact: true }
      );
      setShareUrl(sceneShareUrl(encoded));
    } catch (err: any) {
      setShareError(err?.message || 'Could not build a share link');
    } finally {
      setShareBusy(false);
    }
  };

  const copyShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareError('Clipboard is blocked here — select the link and copy it manually');
    }
  };
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [shareCardBusy, setShareCardBusy] = useState(false);

  const shareCard = async () => {
    if (!code.trim()) return;
    setShareCardBusy(true);
    setShareError(null);
    try {
      const dataUrl = await previewRef.current?.snapshotPng();
      if (!dataUrl) throw new Error('The preview has no image yet');
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `Any3d-${sceneName || 'scene'}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: title || 'Any3d scene' });
      } else {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = file.name;
        a.click();
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') setShareError(err?.message || 'Could not create a share card');
    } finally {
      setShareCardBusy(false);
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileMenuOpen]);

  const versionCount = useMemo(
    () => messages.filter((m) => m.role === 'assistant' && m.version).length,
    [messages]
  );
  const codeVersions = useMemo(
    () => messages.filter((m) => m.role === 'assistant' && m.codeSnapshot),
    [messages]
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages.length, isProcessing]);

  // Auto-grow the composer up to ~7 lines.
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 168)}px`;
  }, [draft]);

  const submit = async (text?: string) => {
    const value = (text ?? draft).trim();
    if (!value || isProcessing) return;
    setDraft('');
    await onSendMessage(value);
  };

  const handleEnhanceDraft = async () => {
    if (!draft.trim() || isEnhancing) return;
    setIsEnhancing(true);
    try {
      const enhanced = await onEnhance(draft);
      if (typeof enhanced === 'string' && enhanced.trim()) setDraft(enhanced);
    } finally {
      setIsEnhancing(false);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090b11]">
      {/* Project top bar */}
      <div className="h-12 px-3 sm:px-4 border-b border-white/[0.08] bg-[#0c0e17] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
            title={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={isSidebarOpen}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-zinc-400 transition hover:bg-white/[0.06] hover:text-white"
          >
            <PanelLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onBackHome}
            title="Back to Home"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-zinc-100 truncate max-w-[46vw] max-[480px]:max-w-[140px]">
                {title || 'Untitled project'}
              </span>
              <select
                value={format}
                onChange={(e) => onSelectFormat(e.target.value as RenderFormat)}
                aria-label="Engine for the next generation"
                title="Engine for the next generation"
                className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-300 border border-white/[0.08] outline-none cursor-pointer shrink-0 max-[480px]:max-w-[92px]"
              >
                {(Object.keys(ENGINE_META) as RenderFormat[]).map((key) => (
                  <option key={key} value={key} className="bg-[#0c0e17] text-zinc-200">
                    {ENGINE_META[key].label}
                  </option>
                ))}
              </select>
              {versionCount > 0 && (
                <span className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/25 shrink-0">
                  v{versionCount}
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 font-mono truncate max-[480px]:hidden">
              {projectId === 'new'
                ? 'new project'
                : projectId === 'shared'
                  ? 'shared scene'
                  : `project ${projectId}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`}
            aria-pressed={colorMode === 'light'}
            title={`Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`}
            className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-zinc-900/90 text-zinc-300 transition hover:bg-zinc-800 hover:text-white cursor-pointer"
          >
            {colorMode === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            title="AI provider & model settings"
            className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-[10px] text-zinc-400 hover:text-zinc-200 font-mono transition cursor-pointer"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${hasApiKey || providerLabel === 'Ollama' ? 'bg-emerald-400' : 'bg-amber-400'}`}
            />
            {providerLabel}
          </button>
          {canSelectModel && models.length > 0 ? (
            <select
              value={modelName}
              onChange={(e) => onSelectModel?.(e.target.value)}
              aria-label="Model used for edits in this chat"
              title="Model used for edits in this chat"
              className="hidden 2xl:block max-w-[150px] text-[10px] font-mono px-1.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.08] text-zinc-300 outline-none cursor-pointer"
            >
              {!models.some((m) => m.name === modelName) && <option value={modelName}>{modelName}</option>}
              {models.map((m) => (
                <option key={m.name} value={m.name} className="bg-[#0c0e17]">
                  {m.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="hidden lg:inline text-[10px] text-zinc-500 font-mono max-w-[150px] truncate">
              {modelName}
            </span>
          )}
          <div className="hidden md:block">
            <ClipControl previewRef={previewRef} sceneName={sceneName} disabled={!html || untrusted} />
          </div>
          <button
            type="button"
            onClick={openShare}
            disabled={!code.trim()}
            title={code.trim() ? 'Copy a link that opens this scene' : 'Nothing to share yet'}
            className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-zinc-200 bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.08] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            type="button"
            onClick={() => setDiffOpen(true)}
            disabled={codeVersions.length < 2}
            title={codeVersions.length >= 2 ? 'Compare scene versions' : 'Make another scene version to compare'}
            className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.08] transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare</span>
          </button>
          <button
            type="button"
            onClick={onOpenStudio}
            title="Open this scene in the Studio workspace"
            className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-white/[0.08] transition cursor-pointer"
          >
            <PanelLeftClose className="w-3.5 h-3.5 text-zinc-400" />
            <span>Studio</span>
          </button>
          <button
            type="button"
            onClick={onExportGlb}
            disabled={untrusted}
            title={untrusted ? 'GLB export is unavailable for shared scenes — use HTML or PNG' : 'Download 3D Binary GLTF (.glb)'}
            className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border border-indigo-400/20 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Box className="w-3.5 h-3.5 text-indigo-200" />
            <span className="hidden sm:inline">GLB</span>
          </button>
          <button
            type="button"
            onClick={onExportHtml}
            title="Download standalone offline HTML"
            className="hidden 2xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-medium text-white bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 border border-emerald-400/20 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">HTML</span>
          </button>
          <div className="relative 2xl:hidden" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="More project actions"
              aria-expanded={mobileMenuOpen}
              aria-controls="project-mobile-actions"
              title="More project actions"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-zinc-900/90 text-zinc-300 transition hover:bg-zinc-800"
            >
              <EllipsisVertical className="h-4 w-4" aria-hidden="true" />
            </button>
            {mobileMenuOpen && (
              <div
                id="project-mobile-actions"
                className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-white/[0.1] bg-[#0c0e17] p-1.5 shadow-2xl"
              >
                <button
                  type="button"
                  onClick={() => {
                    onToggleTheme();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-zinc-300 transition hover:bg-white/[0.06]"
                >
                  {colorMode === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
                  Switch to {colorMode === 'dark' ? 'light' : 'dark'} mode
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenSettings();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-zinc-300 transition hover:bg-white/[0.06]"
                >
                  <Settings2 className="h-4 w-4" aria-hidden="true" />
                  AI settings
                </button>
                {onToggleSeedLock && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleSeedLock();
                      setMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-zinc-300 transition hover:bg-white/[0.06]"
                  >
                    {seedLocked ? <LockOpen className="h-4 w-4" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
                    {seedLocked ? 'Unlock seed' : `Lock seed ${seed ?? '—'}`}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setDiffOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  disabled={codeVersions.length < 2}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-zinc-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <GitCompare className="h-4 w-4" aria-hidden="true" />
                  Compare versions
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenStudio();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-zinc-300 transition hover:bg-white/[0.06]"
                >
                  <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
                  Open Studio
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExportGlb();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-zinc-300 transition hover:bg-white/[0.06]"
                >
                  <Box className="h-4 w-4" aria-hidden="true" />
                  Export GLB
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onExportHtml();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-zinc-300 transition hover:bg-white/[0.06]"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Export HTML
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void openShare();
                    setMobileMenuOpen(false);
                  }}
                  disabled={!code.trim()}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs text-zinc-300 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  Share scene
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Conversation column — the primary interface of a project */}
        <div className="w-full lg:w-[46%] lg:max-w-[680px] flex flex-col h-[52%] lg:h-full min-h-0 border-b lg:border-b-0 lg:border-r border-white/[0.08] bg-[#0a0c13]">
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-5">
            {isEmpty ? (
              <div className="max-w-md mx-auto pt-6 sm:pt-12">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 mb-4">
                  <div className="w-full h-full rounded-[15px] bg-[#0a0c13] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                  </div>
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">Start a new project</h1>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Describe the world you want. You can keep refining it in this conversation — every reply
                  becomes a new version you can restore.
                </p>

                <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Model</p>
                    <p className="text-[11px] text-zinc-300 truncate">{providerLabel} · {modelName}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${hasApiKey || providerLabel === 'Ollama' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="text-[10px] text-zinc-400">{hasApiKey || providerLabel === 'Ollama' ? 'Ready' : 'Key needed'}</span>
                    <button type="button" onClick={onOpenSettings} className="px-2 py-1 rounded-lg text-[10px] text-zinc-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition cursor-pointer">Settings</button>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Engine</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(ENGINE_META) as RenderFormat[]).map((key) => {
                      const active = key === format;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => onSelectFormat(key)}
                          className={`text-left px-3 py-2 rounded-xl border transition cursor-pointer ${
                            active
                              ? 'bg-indigo-500/10 border-indigo-500/40 text-white'
                              : 'bg-white/[0.02] border-white/[0.08] text-zinc-300 hover:bg-white/[0.05]'
                          }`}
                        >
                          <span className="block text-[11px] font-semibold">{ENGINE_META[key].label}</span>
                          <span className="block text-[10px] text-zinc-500 mt-0.5">
                            {ENGINE_META[key].blurb}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {presets.filter((p) => p.format === format).length > 0 && (
                  <div className="mt-5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">Start from a preset</p>
                    <div className="space-y-1.5">
                      {presets.filter((p) => p.format === format).slice(0, 3).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onRemixPreset?.(p)}
                          disabled={!onRemixPreset}
                          className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] text-left transition cursor-pointer disabled:opacity-50"
                        >
                          <span className="min-w-0">
                            <span className="block text-[11px] font-semibold text-zinc-200">{p.title}</span>
                            <span className="block text-[10px] text-zinc-500">{p.format.toUpperCase()} · {p.code.split('\n').length} lines</span>
                          </span>
                          <span className="text-[10px] font-semibold text-indigo-300 shrink-0">Remix</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-2">
                    Try one
                  </p>
                  <div className="space-y-1.5">
                    {STARTERS[format].map((s) => (
                      <button
                        key={s.title}
                        type="button"
                        onClick={() => submit(s.prompt)}
                        disabled={isProcessing}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.08] text-left transition cursor-pointer disabled:opacity-50"
                      >
                        <span className="min-w-0">
                          <span className="block text-[11px] font-semibold text-zinc-200">{s.title}</span>
                          <span className="block text-[10px] text-zinc-500 truncate">{s.prompt}</span>
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <MessageRow
                    key={msg.id}
                    msg={msg}
                    onRestore={onRestoreVersion}
                    onViewCode={() => setStage('code')}
                  />
                ))}
                {isProcessing && <ThinkingRow />}
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="px-3 sm:px-4 pt-3 pb-3 border-t border-white/[0.08] bg-[#0a0c13] shrink-0">
            <div className="rounded-2xl border border-white/[0.1] bg-[#0c0e17] focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/20 transition p-2">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                aria-label={isEmpty ? 'Describe the 3D scene you want to create' : 'Describe a change to the current scene'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    submit();
                  }
                }}
                rows={1}
                placeholder={
                  isEmpty
                    ? 'Describe the scene you want to build…'
                    : 'Describe a change, or ask for something new…'
                }
                className="w-full bg-transparent text-xs text-zinc-100 placeholder-zinc-500 resize-none outline-none px-1.5 py-1.5 leading-relaxed max-h-[168px]"
              />
              <div className="flex items-center justify-between gap-2 px-1 pt-1">
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                  <button
                    type="button"
                    onClick={handleEnhanceDraft}
                    disabled={!draft.trim() || isEnhancing}
                    title="Expand this prompt with architectural detail"
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/25 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isEnhancing ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Wand2 className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">Enhance</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft(drawSurprise().prompt)}
                    disabled={isProcessing}
                    title="Draw a curated place × activity × light × palette combination"
                    className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium text-amber-200/90 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/25 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span className="hidden sm:inline">Surprise</span>
                  </button>
                  <PaletteFromPhoto
                    provider={provider}
                    geminiModel={geminiModel}
                    ollamaModel={ollamaModel}
                    ollamaModels={models}
                    ollamaHost={ollamaHost}
                    apiKey={apiKey}
                    hasApiKey={hasApiKey}
                    onOpenSettings={onOpenSettings}
                    onApply={(desc) =>
                      setDraft((prev) => (prev.trim() ? `${prev.trim()}\n\n${desc}` : desc))
                    }
                    onApplyLook={changeLook}
                    disabled={isProcessing}
                  />
                  {onToggleSeedLock && (
                    <button
                      type="button"
                      onClick={onToggleSeedLock}
                      title={
                        seedLocked
                          ? `Seed ${seed} locked — the same model and prompt should reproduce this composition`
                          : 'Lock the seed to make this composition repeatable'
                      }
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-mono border transition cursor-pointer max-[480px]:hidden ${
                        seedLocked
                          ? 'text-emerald-200 bg-emerald-500/15 border-emerald-500/30'
                          : 'text-zinc-400 bg-white/[0.03] border-white/[0.08] hover:text-zinc-200'
                      }`}
                    >
                      {seedLocked ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
                      <span>{seed ?? '—'}</span>
                    </button>
                  )}
                  <span className="hidden sm:inline text-[10px] text-zinc-600 font-mono truncate">
                    /svg · /worlds · /pixel · /dither
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => submit()}
                  disabled={!draft.trim() || isProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </div>
            <p className="text-[10px] text-zinc-600 mt-1.5 px-1">
              Enter to send · Shift+Enter for a new line
            </p>
          </div>
        </div>

        {/* Scene column */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#090b11]">
          <div className="min-h-11 h-auto px-3 py-2 border-b border-white/[0.08] bg-[#0c0e17] flex flex-col items-stretch gap-2 shrink-0 lg:h-11 lg:px-4 lg:py-0 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
            <div className="flex items-center gap-2 min-w-0">
              <Layers className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span className="text-xs font-semibold text-zinc-200 truncate">
                {sceneName || 'Live scene'}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.05] text-zinc-500 border border-white/[0.08] uppercase">
                {format}
              </span>
            </div>
            <div className="flex w-full items-center gap-1 flex-wrap justify-between lg:w-auto lg:gap-2 lg:justify-end">
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono border ${
                  validationOk
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/25'
                }`}
              >
                {validationOk ? (
                  <ShieldCheck className="w-3 h-3" />
                ) : (
                  <AlertTriangle className="w-3 h-3" />
                )}
                {validationOk ? 'Valid' : 'Issues'}
              </span>
              <div className="flex items-center p-0.5 rounded-lg bg-zinc-950/80 border border-white/[0.08] text-[11px]">
                <button
                  type="button"
                  onClick={() => setStage('preview')}
                  className={`flex min-h-11 items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition cursor-pointer lg:min-h-8 ${
                    stage === 'preview' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStage('code')}
                  className={`flex min-h-11 items-center gap-1 px-2 py-0.5 rounded-md font-semibold transition cursor-pointer lg:min-h-8 ${
                    stage === 'code' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Code2 className="w-3 h-3" />
                  <span>Code</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {stage === 'code' ? (
              code ? (
                <CodeEditor
                  code={code}
                  setCode={setCode}
                  format={format}
                  onReset={onResetCode}
                  linesCount={code.split('\n').length}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-zinc-600">
                  No code yet — send a prompt to generate the scene.
                </div>
              )
            ) : html ? (
              <SandboxPreview
                ref={previewRef}
                html={html}
                untrusted={untrusted}
                format={format}
                sceneName={sceneName || 'scene'}
                isLoading={isBundling}
                isGenerating={isProcessing}
                onRefresh={onRefreshPreview}
                theme={theme}
                onThemeChange={setTheme}
                accent={accent}
                onAccentChange={setAccent}
                finish={finish}
                onFinishChange={setFinish}
                look={look}
                onLookChange={changeLook}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-8">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
                  <Box className="w-5 h-5 text-zinc-600" />
                </div>
                <p className="text-xs text-zinc-500 max-w-[240px] leading-relaxed">
                  Your scene will appear here as soon as the first generation finishes.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Share this scene"
        >
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#0c0e17] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
              <p className="text-xs font-semibold text-zinc-200">Share this scene</p>
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-[11px] text-zinc-400">
                The whole scene travels inside the link — no account, no upload.
              </p>

              {shareBusy && (
                <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                  Compressing the scene…
                </div>
              )}

              {shareError && (
                <p className="text-[11px] text-amber-300 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
                  {shareError}
                </p>
              )}

              {shareUrl && (
                <>
                  <input
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="w-full text-[10px] font-mono px-2.5 py-2 rounded-lg bg-black/40 border border-white/[0.08] text-zinc-300 outline-none focus:border-indigo-500/40"
                  />
                  <p className="text-[10px] text-zinc-500">
                    {shareUrl.length.toLocaleString()} characters
                    {shareUrl.length > SHARE_ROUTE_SOFT_LIMIT
                      ? ' — long enough that some chat apps may truncate it. Consider the HTML export instead.'
                      : ' — safe to paste in a chat message.'}
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-white/[0.08]">
              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="px-3 py-1.5 rounded-lg text-[11px] text-zinc-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
              >
                Done
              </button>
              {shareUrl && (
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-zinc-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open
                </a>
              )}
              {shareUrl.length > SHARE_ROUTE_SOFT_LIMIT && (
                <button
                  type="button"
                  onClick={onExportHtml}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-emerald-700 hover:bg-emerald-800 border border-emerald-400/20 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export HTML
                </button>
              )}
              <button
                type="button"
                onClick={() => void shareCard()}
                disabled={shareCardBusy || !code.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-zinc-200 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition cursor-pointer disabled:opacity-40"
              >
                <Share2 className="w-3.5 h-3.5" />
                {shareCardBusy ? 'Preparing…' : 'Share card'}
              </button>
              <button
                type="button"
                onClick={copyShare}
                disabled={!shareUrl}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 border border-indigo-400/20 transition cursor-pointer disabled:opacity-40"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </div>
        </div>
      )}
      <VersionDiff
        open={diffOpen}
        onClose={() => setDiffOpen(false)}
        versions={codeVersions}
        currentCode={code}
        onApply={setCode}
      />
    </div>
  );
};

const MessageRow: React.FC<{
  msg: ChatMessage;
  onRestore: (msg: ChatMessage) => void;
  onViewCode: () => void;
}> = ({ msg, onRestore, onViewCode }) => {
  const isUser = msg.role === 'user';
  const lineCount = msg.codeSnapshot ? msg.codeSnapshot.split('\n').length : 0;

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-indigo-600/90 text-white px-3.5 py-2 shadow-sm shadow-indigo-900/30">
          <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
          {msg.command && (
            <span className="inline-block mt-1 text-[9px] font-mono text-indigo-200/80">{msg.command}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5">
        <Bot className="w-3.5 h-3.5 text-indigo-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="rounded-2xl rounded-tl-md bg-white/[0.03] border border-white/[0.07] px-3.5 py-2.5">
          <p className="text-xs leading-relaxed text-zinc-200 whitespace-pre-wrap break-words">
            {msg.content}
          </p>

          {msg.codeSnapshot && (
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
                v{msg.version ?? '—'}
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-white/[0.05] text-zinc-400 border border-white/[0.08]">
                {lineCount} lines
              </span>
              <button
                type="button"
                onClick={onViewCode}
                className="text-[9px] font-medium px-1.5 py-0.5 rounded-full text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition cursor-pointer"
              >
                View code
              </button>
              <button
                type="button"
                onClick={() => onRestore(msg)}
                className="flex items-center gap-1 text-[9px] font-medium px-1.5 py-0.5 rounded-full text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition cursor-pointer"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                Restore
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ThinkingRow: React.FC = () => (
  <div className="flex gap-2.5">
    <div className="w-7 h-7 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0">
      <Bot className="w-3.5 h-3.5 text-indigo-400" />
    </div>
    <div className="rounded-2xl rounded-tl-md bg-white/[0.03] border border-white/[0.07] px-3.5 py-2.5 flex items-center gap-2">
      <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
      <span className="text-[11px] text-zinc-400">Building the scene…</span>
    </div>
  </div>
);

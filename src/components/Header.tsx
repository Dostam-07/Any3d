import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Key,
  Download,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Shapes,
  Cuboid,
  Grid3X3,
  Sparkles,
  MessageSquare,
  PanelLeft,
  Home,
  EllipsisVertical,
  ShieldCheck,
  Settings2,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { RenderFormat, LLMProvider } from '../types';

interface HeaderProps {
  format: RenderFormat;
  setFormat: (f: RenderFormat) => void;
  provider: LLMProvider;
  setProvider: (p: LLMProvider) => void;
  isValid: boolean;
  onOpenApiKey: () => void;
  onOpenGallery: () => void;
  onExportHtml: () => void;
  isExporting: boolean;
  onExportGlb?: () => void;
  isExportingGlb?: boolean;
  hasApiKey: boolean;
  presetsCount?: number;
  onToggleChat?: () => void;
  isChatOpen?: boolean;
  chatCount?: number;
  onToggleInspector?: () => void;
  onNavigateHome?: () => void;
  onNavigateStudio?: () => void;
  activeView?: 'home' | 'studio' | 'project' | 'shared';
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

const ENGINE_CONFIG: Record<
  RenderFormat,
  {
    name: string;
    label: string;
    badge: string;
    icon: React.FC<{ className?: string }>;
    activeBg: string;
    activeBorder: string;
    activeText: string;
    glow: string;
  }
> = {
  svg: {
    name: 'SVG Vector',
    label: 'SVG',
    badge: 'Vector Isometric',
    icon: Shapes,
    activeBg: 'bg-emerald-500/15',
    activeBorder: 'border-emerald-500/40',
    activeText: 'text-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  worlds: {
    name: 'Three.js 3D',
    label: 'Worlds',
    badge: 'WebGL Ortho',
    icon: Cuboid,
    activeBg: 'bg-indigo-500/15',
    activeBorder: 'border-indigo-500/40',
    activeText: 'text-indigo-400',
    glow: 'shadow-indigo-500/20',
  },
  pixel: {
    name: 'Pixel Art',
    label: 'Pixel',
    badge: '320×240 Raster',
    icon: Grid3X3,
    activeBg: 'bg-amber-500/15',
    activeBorder: 'border-amber-500/40',
    activeText: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  },
  dither: {
    name: '4×4 Dither',
    label: 'Dither',
    badge: '360×280 5-Tone',
    icon: Sparkles,
    activeBg: 'bg-cyan-500/15',
    activeBorder: 'border-cyan-500/40',
    activeText: 'text-cyan-400',
    glow: 'shadow-cyan-500/20',
  },
};

export const Header: React.FC<HeaderProps> = ({
  format,
  setFormat,
  provider,
  setProvider,
  isValid,
  onOpenApiKey,
  onOpenGallery,
  onExportHtml,
  isExporting,
  onExportGlb,
  isExportingGlb = false,
  hasApiKey,
  presetsCount = 0,
  onToggleChat,
  isChatOpen = false,
  chatCount = 0,
  onToggleInspector,
  onNavigateHome,
  onNavigateStudio,
  activeView = 'studio',
  isSidebarOpen = true,
  onToggleSidebar,
  theme,
  onToggleTheme,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the overflow menu on outside click / Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const menuItemClass =
    'w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-white/[0.06] transition cursor-pointer';

  return (
    <header className="h-14 border-b border-white/[0.08] bg-[#0d0f18]/90 backdrop-blur-xl px-3 sm:px-4 flex items-center justify-between gap-2 z-30 relative shrink-0">
      {/* Brand & Engine Selector */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Toggle Sidebar Icon (when collapsed) */}
        {!isSidebarOpen && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title="Expand Sidebar (Ctrl+B)"
            className="p-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-white/[0.08] text-zinc-400 hover:text-white transition cursor-pointer shrink-0"
          >
            <PanelLeft className="w-4 h-4 text-indigo-400" />
          </button>
        )}

        {/* Brand Logo */}
        <button
          type="button"
          className="flex items-center gap-2.5 group cursor-pointer shrink-0 text-left"
          onClick={onNavigateHome || onOpenGallery}
          title="Return to Home (Ctrl+N for new project)"
        >
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition">
            <div className="w-full h-full rounded-[11px] bg-[#0c0e17] flex items-center justify-center">
              <Box className="w-4 h-4 text-indigo-400 group-hover:text-cyan-300 transition stroke-[2.2]" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0c0e17]" />
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm tracking-tight text-white flex items-center font-sans">
                Any<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400">3d</span>
              </span>
              <span className="hidden xl:inline text-[10px] font-mono tracking-wider px-1.5 py-0.5 rounded-full bg-white/[0.06] text-zinc-400 border border-white/[0.08]">
                v2.0
              </span>
            </div>
          </div>
        </button>

        {/* Navigation Tabs: Home vs Studio */}
        <div className="flex items-center p-0.5 rounded-xl bg-zinc-950/80 border border-white/[0.08] text-xs shrink-0">
          <button
            type="button"
            onClick={onNavigateHome}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
              activeView === 'home'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
            title="Homepage & Inspirations"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </button>
          <button
            type="button"
            onClick={onNavigateStudio}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
              activeView === 'studio'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
            title="Studio workspace"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Studio</span>
          </button>
        </div>

        <div className="hidden md:block h-4 w-[1px] bg-white/[0.08] shrink-0" />

        {/* Engine Switcher — icons always, labels from xl up */}
        <div className="hidden md:flex items-center p-1 rounded-xl bg-zinc-950/70 border border-white/[0.08] shadow-inner shrink-0">
          {(Object.keys(ENGINE_CONFIG) as RenderFormat[]).map((key) => {
            const cfg = ENGINE_CONFIG[key];
            const Icon = cfg.icon;
            const isActive = format === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFormat(key)}
                title={`${cfg.name} — ${cfg.badge}`}
                className={`relative flex items-center gap-1.5 px-2 xl:px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  isActive
                    ? `${cfg.activeBg} ${cfg.activeText} border ${cfg.activeBorder} shadow-sm ${cfg.glow}`
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? cfg.activeText : 'text-zinc-500'}`} />
                <span className="hidden xl:inline">{cfg.label}</span>
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full bg-current opacity-80" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Controls — progressive disclosure, never clipped */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-pressed={theme === 'light'}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-zinc-900/90 text-zinc-300 transition hover:bg-zinc-800 hover:text-white cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
        </button>

        {/* Validation Status Pill (Clickable -> toggles Inspector drawer!) */}
        <button
          type="button"
          onClick={onToggleInspector}
          title="Inspect validation checks & prompt fidelity (Ctrl+I)"
          className={`flex items-center gap-1.5 px-2 xl:px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition cursor-pointer border ${
            isValid
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
          }`}
        >
          {isValid ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden xl:inline">Valid (12)</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Issues</span>
            </>
          )}
        </button>

        {/* Wide screens: show everything inline */}
        {onToggleChat && (
          <button
            onClick={onToggleChat}
            title={isChatOpen ? 'Close Agent Studio (Ctrl+J)' : 'Open Agent Studio (Ctrl+J)'}
            className={`hidden 2xl:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer ${
              isChatOpen
                ? 'bg-indigo-600 text-white shadow-indigo-600/30 ring-1 ring-indigo-400/50'
                : 'text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/[0.08]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span>Agent Chat</span>
            {chatCount > 0 && (
              <span className="px-1.5 rounded-full text-[10px] bg-indigo-400/20 text-indigo-200 font-mono font-bold">
                {chatCount}
              </span>
            )}
          </button>
        )}

        <button
          onClick={onOpenGallery}
          title="Browse Curated 3D Scenes (Ctrl+K)"
          className="hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-zinc-300 hover:text-white bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/[0.08] transition cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-zinc-400" />
          <span>Presets</span>
          {presetsCount > 0 && (
            <span className="ml-0.5 px-1.5 rounded-full text-[10px] bg-white/[0.06] text-zinc-400 font-mono">
              {presetsCount}
            </span>
          )}
        </button>

        <div className="hidden 2xl:flex items-center p-0.5 rounded-xl bg-zinc-950/70 border border-white/[0.08] text-xs">
          <button
            onClick={() => setProvider('ollama')}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium cursor-pointer ${
              provider === 'ollama' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Ollama
          </button>
          <button
            onClick={() => setProvider('gemini')}
            className={`px-2.5 py-1 rounded-lg transition-all font-medium flex items-center gap-1.5 cursor-pointer ${
              provider === 'gemini'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <span>Gemini</span>
            {!hasApiKey && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" title="API Key required" />}
          </button>
        </div>

        <button
          onClick={onOpenApiKey}
          title={hasApiKey ? 'AI Provider Settings (Configured)' : 'Configure Gemini API Key / Ollama Host'}
          className={`hidden 2xl:flex p-1.5 rounded-xl border text-xs transition cursor-pointer ${
            hasApiKey
              ? 'border-white/[0.08] text-zinc-400 hover:bg-zinc-800 hover:text-white bg-zinc-900/60'
              : 'border-amber-500/50 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
        </button>

        {onExportGlb && (
          <button
            onClick={onExportGlb}
            disabled={isExportingGlb}
            title="Download 3D Binary GLTF model (.glb)"
            className="hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 transition shadow-md shadow-indigo-900/40 border border-indigo-400/20 cursor-pointer"
          >
            <Box className="w-3.5 h-3.5 text-indigo-200" />
            <span>{isExportingGlb ? 'Building…' : 'GLB'}</span>
          </button>
        )}

        {/* Export Standalone HTML — always visible, it is the primary action */}
        <button
          onClick={onExportHtml}
          disabled={isExporting}
          title="Download self-contained single file zero-dependency HTML bundle"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium text-white bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 disabled:opacity-50 transition shadow-md shadow-emerald-900/40 border border-emerald-400/20 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{isExporting ? 'Exporting…' : 'HTML'}</span>
        </button>

        {/* Everything else lives here below 2xl so nothing is ever clipped */}
        <div className="2xl:hidden relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            title="More actions"
            aria-expanded={menuOpen}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              menuOpen
                ? 'bg-zinc-800 text-white border-white/[0.16]'
                : 'bg-zinc-900/90 text-zinc-400 hover:text-white border-white/[0.08] hover:bg-zinc-800'
            }`}
          >
            <EllipsisVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 rounded-2xl border border-white/[0.1] bg-[#0c0e17] shadow-2xl shadow-black/60 p-1.5 z-50">
              <div className="px-2.5 py-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Actions</span>
                <button onClick={closeMenu} className="p-0.5 text-zinc-500 hover:text-white cursor-pointer">
                  <X className="w-3 h-3" />
                </button>
              </div>

              {onToggleChat && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleChat();
                    closeMenu();
                  }}
                  className={menuItemClass}
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    Agent Chat
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">{isChatOpen ? 'on' : 'off'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onOpenGallery();
                  closeMenu();
                }}
                className={menuItemClass}
              >
                <span className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  Presets
                </span>
                <span className="text-[10px] font-mono text-zinc-500">{presetsCount}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onToggleInspector?.();
                  closeMenu();
                }}
                className={menuItemClass}
              >
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Validation checks
                </span>
                <span className={`text-[10px] font-mono ${isValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {isValid ? 'pass' : 'issues'}
                </span>
              </button>

              {onExportGlb && (
                <button
                  type="button"
                  onClick={() => {
                    onExportGlb();
                    closeMenu();
                  }}
                  className={menuItemClass}
                >
                  <span className="flex items-center gap-2">
                    <Box className="w-3.5 h-3.5 text-indigo-300" />
                    Export GLB
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">{isExportingGlb ? '…' : '.glb'}</span>
                </button>
              )}

              <div className="my-1 h-px bg-white/[0.08]" />

              <div className="px-2.5 py-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1.5">Model provider</p>
                <div className="flex items-center p-0.5 rounded-lg bg-zinc-950/80 border border-white/[0.08] text-[11px]">
                  <button
                    onClick={() => setProvider('ollama')}
                    className={`flex-1 py-1 rounded-md font-medium transition cursor-pointer ${
                      provider === 'ollama' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Ollama
                  </button>
                  <button
                    onClick={() => setProvider('gemini')}
                    className={`flex-1 py-1 rounded-md font-medium transition cursor-pointer flex items-center justify-center gap-1 ${
                      provider === 'gemini' ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Gemini
                    {!hasApiKey && <span className="w-1 h-1 rounded-full bg-amber-400" />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onOpenApiKey();
                  closeMenu();
                }}
                className={menuItemClass}
              >
                <span className="flex items-center gap-2">
                  <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
                  {hasApiKey ? 'Provider settings' : 'Add API key'}
                </span>
                {!hasApiKey && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

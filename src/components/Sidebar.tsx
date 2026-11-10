import React from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Settings,
  PanelLeftClose,
  Layers,
  Shapes,
  Cuboid,
  Grid3X3,
  Sparkles,
  Key,
  Box,
  Compass,
  Clock,
} from 'lucide-react';
import { RenderFormat, LLMProvider, ChatMessage } from '../types';

export interface SceneSession {
  id: string;
  title: string;
  format: RenderFormat;
  updatedAt: number;
  messages: ChatMessage[];
  code: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: SceneSession[];
  currentSessionId: string;
  onSelectSession: (session: SceneSession) => void;
  onNewScene: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onOpenGallery: () => void;
  onOpenSettings: () => void;
  provider: LLMProvider;
  currentModelName: string;
  hasApiKey: boolean;
  presetsCount?: number;
  activeView: 'home' | 'studio' | 'project' | 'shared';
  onNavigateHome: () => void;
}

const FORMAT_ICONS: Record<RenderFormat, React.FC<{ className?: string }>> = {
  svg: Shapes,
  worlds: Cuboid,
  pixel: Grid3X3,
  dither: Sparkles,
};

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewScene,
  onDeleteSession,
  onOpenGallery,
  onOpenSettings,
  provider,
  currentModelName,
  hasApiKey,
  presetsCount = 0,
  activeView,
  onNavigateHome,
}) => {
  const closeOnMobile = () => {
    if (window.matchMedia('(max-width: 1023px)').matches) onToggle();
  };

  if (!isOpen) return null;

  return (
    <aside className="w-64 sm:w-72 h-full flex flex-col bg-[#08090f] border-r border-white/[0.08] text-zinc-300 z-30 shrink-0 select-none">
      {/* Sidebar Header */}
      <div className="h-14 px-3.5 border-b border-white/[0.06] flex items-center justify-between shrink-0">
        <button
          onClick={() => {
            onNavigateHome();
            closeOnMobile();
          }}
          className="flex items-center gap-2.5 group cursor-pointer text-left"
        >
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-[1px] shadow-md shadow-indigo-500/20">
            <div className="w-full h-full rounded-[11px] bg-[#0c0e17] flex items-center justify-center">
              <Box className="w-3.5 h-3.5 text-indigo-400 group-hover:text-cyan-300 transition" />
            </div>
          </div>
          <span className="font-extrabold text-sm tracking-tight text-white flex items-center">
            Any<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">3d</span>
          </span>
        </button>

        <button
          onClick={onToggle}
          title="Collapse Sidebar (Ctrl+B)"
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition cursor-pointer"
        >
          <PanelLeftClose className="w-4 h-4" />
        </button>
      </div>

      {/* New Scene CTA */}
      <div className="p-3">
        <button
          onClick={() => {
            onNewScene();
            closeOnMobile();
          }}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs transition shadow-md shadow-indigo-900/40 border border-white/10 cursor-pointer active:scale-[0.98]"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </div>
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 border border-white/10 text-indigo-200">
            ^N
          </kbd>
        </button>
      </div>

      {/* Navigation Links */}
      <div className="px-3 pb-2 space-y-1 text-xs">
        <button
          onClick={() => {
            onNavigateHome();
            closeOnMobile();
          }}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition cursor-pointer font-medium ${
            activeView === 'home'
              ? 'bg-white/[0.08] text-white'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
          }`}
        >
          <Compass className="w-4 h-4 text-indigo-400" />
          <span>Home & Inspirations</span>
        </button>

        <button
          onClick={() => {
            onOpenGallery();
            closeOnMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition cursor-pointer font-medium"
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Presets Benchmark</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-zinc-400">
            {presetsCount > 0 ? presetsCount : '—'}
          </span>
        </button>
      </div>

      {/* Recent Scenes Section (ChatGPT/Claude style) */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          <span>Recent Scenes</span>
          <Clock className="w-3 h-3 text-zinc-600" />
        </div>

        {sessions.length === 0 ? (
          <div className="px-2 py-4 text-center text-xs text-zinc-500 italic">
            No saved scenes yet. Create your first 3D world!
          </div>
        ) : (
          sessions.map((sess) => {
            const Icon = FORMAT_ICONS[sess.format] || Shapes;
            const isSelected = sess.id === currentSessionId && activeView !== 'home';
            return (
              <div key={sess.id} className="group flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectSession(sess);
                    closeOnMobile();
                  }}
                  aria-current={isSelected ? 'page' : undefined}
                  className={`min-w-0 flex-1 flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-left transition cursor-pointer ${
                    isSelected
                      ? 'bg-white/[0.08] text-white font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-zinc-500'}`} />
                  <span className="truncate">{sess.title}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => onDeleteSession(sess.id, e)}
                  aria-label={`Delete ${sess.title} from history`}
                  title="Delete scene from history"
                  className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 p-2 text-zinc-500 hover:text-rose-400 hover:bg-white/[0.08] rounded transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Model & Settings Bar */}
      <div className="p-3 border-t border-white/[0.06] bg-[#07080d] flex items-center justify-between text-xs shrink-0">
        <button
          type="button"
          onClick={() => {
            onOpenSettings();
            closeOnMobile();
          }}
          aria-label="Configure AI provider and model settings"
          title="Click to configure AI models and connection"
          className="flex items-center gap-2 overflow-hidden flex-1 cursor-pointer group pr-2 text-left"
        >
          <div className="relative">
            <div className={`w-2 h-2 rounded-full ${hasApiKey || provider === 'ollama' ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-[11px] font-semibold text-zinc-200 group-hover:text-white truncate">
              {provider === 'gemini' ? 'Gemini API' : 'Ollama (Local)'}
            </p>
            <p className="text-[10px] text-zinc-500 font-mono truncate">{currentModelName}</p>
          </div>
          <Settings className="w-4 h-4 shrink-0 text-zinc-500 group-hover:text-zinc-200 transition" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
};

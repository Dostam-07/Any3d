import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  RotateCcw,
  Trash2,
  X,
  History,
  Box,
  Code2,
  Check,
  ChevronRight,
  Layers,
  Wand2,
  Undo2,
  Shapes,
  Cuboid,
  Grid3X3,
  Terminal,
  User,
  Bot,
  Clock,
  Compass,
} from 'lucide-react';
import { ChatMessage, RenderFormat, LLMProvider, OllamaModelInfo, SlashCommandType } from '../types';
import { SlashCommandMenu, CommandItem, SLASH_COMMANDS } from './SlashCommandMenu';
import { GitCompare, MessageCircleQuestion, Lock, LockOpen } from 'lucide-react';
import { drawSurprise } from '../lib/surprise-deck';

interface ConversationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentVersion: number;
  onSendMessage: (text: string) => Promise<void>;
  onRestoreVersion: (msg: ChatMessage) => void;
  onClearHistory: () => void;
  isProcessing: boolean;
  format: RenderFormat;
  setFormat?: (f: RenderFormat) => void;
  provider?: LLMProvider;
  geminiModel?: string;
  setGeminiModel?: (m: string) => void;
  ollamaModel?: string;
  setOllamaModel?: (m: string) => void;
  ollamaModels?: OllamaModelInfo[];
  onExportGlb: () => void;
  onEnhancePrompt?: (text: string) => Promise<string | void>;
  isEnhancing?: boolean;
  /** Read-only question mode: answers about the scene, never writes code. */
  onAskScene?: (question: string) => Promise<void>;
  askSceneEnabled?: boolean;
  onToggleAskScene?: (v: boolean) => void;
  onCompareVersions?: () => void;
  seed?: number;
  seedLocked?: boolean;
  onToggleSeedLock?: () => void;
}

const INSPIRATIONS: Record<RenderFormat, string[]> = {
  svg: [
    'A retro coffee cart on a street corner with a barista pulling shots and a cat',
    'A seaside lighthouse island with breathing waves and a docking boat',
    'A rocket launchpad at night with floodlights and swinging arm gantry',
    'Airport with planes running on the runway and control tower radar',
    'A busy container harbour quay with a gantry crane lifting cargo',
  ],
  worlds: [
    'A morning bakery with a baker rolling dough on a flour-dusted bench',
    'A florist arranging vibrant bouquets in a flower stall',
    'A patient potter drawing hands slowly up a spinning clay vessel',
    'A street juggler performing a 3-ball cascade in rhythm',
  ],
  pixel: [
    'A flower stall on wet cobblestone with buckets of tulips and an awning',
    'A peaceful riverside allotment with raised vegetable patches and shed',
    'An old wooden fishing pier with drying nets and a gull on a bollard',
  ],
  dither: [
    'A weathered mountain forge with water wheel turning and glowing embers',
    'A solitary cliffside lighthouse in storm winds with revolving beam',
    'A traditional hillside tea house with bamboo railings and gravel garden',
  ],
};

const QUICK_MUTATIONS = [
  { label: '+ Streetlamp', text: 'Add a glowing streetlamp near the scene' },
  { label: 'Remove Crates', text: 'Remove the wooden crates and barrels' },
  { label: 'Night Theme', text: 'Switch to night theme with glowing windows' },
  { label: '+ Trees & Bench', text: 'Add a pine tree and a park bench' },
  { label: '+ Neon Sign', text: 'Add a glowing neon holographic sign on the back wall' },
  { label: '+ Rain Puddles', text: 'Add reflective rainwater puddles on the ground' },
];

export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  isOpen,
  onClose,
  messages,
  currentVersion,
  onSendMessage,
  onRestoreVersion,
  onClearHistory,
  isProcessing,
  format,
  setFormat,
  provider = 'ollama',
  geminiModel = 'gemini-2.5-flash',
  setGeminiModel,
  ollamaModel = 'qwen2.5-coder:1.5b',
  setOllamaModel,
  ollamaModels = [],
  onExportGlb,
  onEnhancePrompt,
  isEnhancing = false,
  onAskScene,
  askSceneEnabled = false,
  onToggleAskScene,
  onCompareVersions,
  seed,
  seedLocked = false,
  onToggleSeedLock,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'versions'>('chat');
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isProcessing, activeTab]);

  // Auto-resize textarea to fit content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Handle slash command typing in textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);

    if (val.startsWith('/')) {
      setShowSlashMenu(true);
      setSlashFilter(val);
      setSelectedSlashIndex(0);
    } else {
      setShowSlashMenu(false);
    }
  };

  const handleSelectSlashCommand = (cmd: CommandItem) => {
    if (cmd.command === '/clear') {
      onClearHistory();
      setInput('');
      setShowSlashMenu(false);
      return;
    }
    if (cmd.command === '/glb') {
      onExportGlb();
      setInput('');
      setShowSlashMenu(false);
      return;
    }
    if (cmd.command === '/undo') {
      setInput('');
      setShowSlashMenu(false);
      void onSendMessage('/undo');
      return;
    }

    // Prefill command and keep input focused
    setInput(`${cmd.command} `);
    setShowSlashMenu(false);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSlashMenu) {
      const cleanFilter = slashFilter.toLowerCase().replace(/^\//, '');
      const filtered = SLASH_COMMANDS.filter((c) =>
        c.command.toLowerCase().includes(cleanFilter) || c.label.toLowerCase().includes(cleanFilter)
      );

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSlashIndex((prev) => (prev + 1) % filtered.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSlashIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (filtered[selectedSlashIndex]) {
          handleSelectSlashCommand(filtered[selectedSlashIndex]);
        }
        return;
      }
      if (e.key === 'Escape') {
        setShowSlashMenu(false);
        return;
      }
    }

    // Submit on Enter (Shift+Enter for newline)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;
    const toSend = input;
    setInput('');
    setShowSlashMenu(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    // Ask mode routes to the read-only endpoint: it can never produce a version.
    if (askSceneEnabled && onAskScene) {
      await onAskScene(toSend);
    } else {
      await onSendMessage(toSend);
    }
  };

  const handleEnhanceClick = async () => {
    if (!input.trim() || isEnhancing || !onEnhancePrompt) return;
    const res = await onEnhancePrompt(input);
    if (typeof res === 'string') {
      setInput(res);
    }
  };

  const handleCopyCode = (id: string, code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const versionCheckpoints = messages.filter((m) => m.role === 'assistant' && m.codeSnapshot);

  if (!isOpen) return null;

  return (
    <aside className="w-full lg:w-[420px] h-full flex flex-col bg-[#0a0c13] border-r border-white/[0.08] shadow-2xl z-30 shrink-0 max-lg:absolute max-lg:inset-0 max-lg:z-40">
      {/* Drawer Header */}
      <div className="h-12 px-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0d0f18]/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <MessageSquare className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs tracking-wide text-zinc-100">Agent Studio</span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-semibold">
                v{currentVersion || 1}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={onClearHistory}
              title="Clear conversation history"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-white/[0.06] transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            title="Close panel (Ctrl+J)"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Studio Sub-Navigation Tabs */}
      <div className="h-9 px-3 border-b border-white/[0.06] bg-[#0c0e17] flex items-center gap-1 shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <MessageSquare className="w-3 h-3 text-indigo-400" />
            <span>Chat</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('versions')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'versions'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
            }`}
          >
            <History className="w-3 h-3 text-cyan-400" />
            <span>Checkpoints</span>
            {versionCheckpoints.length > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/[0.08] text-zinc-300">
                {versionCheckpoints.length}
              </span>
            )}
          </button>
        </div>

        {onCompareVersions && versionCheckpoints.length >= 2 && (
          <button
            type="button"
            onClick={onCompareVersions}
            title="Compare two versions and revert a single hunk"
            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 transition cursor-pointer"
          >
            <GitCompare className="w-3 h-3" />
            <span>Compare</span>
          </button>
        )}
        {onToggleAskScene && (
          <button
            type="button"
            onClick={() => onToggleAskScene(!askSceneEnabled)}
            title={
              askSceneEnabled
                ? 'Ask mode is on: questions are answered from the scene, no code is written'
                : 'Switch to Ask mode to question the scene without editing it'
            }
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition cursor-pointer ${
              askSceneEnabled
                ? 'text-emerald-200 bg-emerald-500/15 border-emerald-500/30'
                : 'text-zinc-400 bg-white/[0.03] border-white/[0.08] hover:text-zinc-200'
            }`}
          >
            <MessageCircleQuestion className="w-3 h-3" />
            <span>Ask</span>
          </button>
        )}

        <div className="ml-auto hidden 2xl:block text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
          {format} engine
        </div>
      </div>

      {/* Main Panel Content Area */}
      {activeTab === 'chat' ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            const isCurrentVer = m.version === currentVersion;
            return (
              <div key={m.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}>
                <div
                  className={`max-w-[94%] rounded-2xl p-3.5 space-y-2 shadow-lg transition-all ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none border border-indigo-400/30'
                      : `bg-[#111320] border text-zinc-100 rounded-tl-none ${
                          isCurrentVer ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : 'border-white/[0.08]'
                        }`
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] opacity-80 font-mono">
                    <div className="flex items-center gap-1.5">
                      {isUser ? (
                        <>
                          <User className="w-3 h-3 text-indigo-200" />
                          <span className="font-semibold">You</span>
                        </>
                      ) : (
                        <>
                          <Bot className="w-3 h-3 text-indigo-400" />
                          <span className="font-semibold text-indigo-300">Any3d Agent</span>
                        </>
                      )}
                    </div>
                    {m.version && (
                      <div className="flex items-center gap-1.5">
                        {isCurrentVer && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                            ACTIVE
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 font-bold">
                          v{m.version}
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="leading-relaxed whitespace-pre-wrap text-[12px]">{m.content}</p>

                  {m.summary && (
                    <div className="text-[11px] font-medium text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2 flex items-start gap-1.5 shadow-inner">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                      <span>{m.summary}</span>
                    </div>
                  )}

                  {/* Assistant actions: time travel, code copy */}
                  {!isUser && m.codeSnapshot && (
                    <div className="pt-2 flex items-center gap-2 border-t border-white/[0.06] mt-1.5">
                      <button
                        type="button"
                        onClick={() => onRestoreVersion(m)}
                        title="Restore scene to this version checkpoint"
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-indigo-600/20 hover:bg-indigo-600/35 text-indigo-300 border border-indigo-500/30 transition cursor-pointer active:scale-95"
                      >
                        <RotateCcw className="w-3 h-3 text-indigo-400" />
                        <span>Restore v{m.version}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyCode(m.id, m.codeSnapshot)}
                        title="Copy code for this version"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 border border-white/[0.08] transition cursor-pointer active:scale-95"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-300 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Code2 className="w-3 h-3 text-zinc-400" />
                            <span>Code</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isProcessing && (
            <div role="status" aria-live="polite" className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-200 text-xs animate-pulse">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
              <span>Sculpting Any3d scene changes…</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      ) : (
        /* Dedicated Version Checkpoints Drawer */
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {versionCheckpoints.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-2">
              <History className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="font-semibold text-zinc-400">No checkpoints recorded yet</p>
              <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                Every generated scene or prompt modification creates a restorable checkpoint automatically.
              </p>
            </div>
          ) : (
            versionCheckpoints.map((chk) => {
              const isActive = chk.version === currentVersion;
              const lineCount = chk.codeSnapshot ? chk.codeSnapshot.split('\n').length : 0;
              return (
                <div
                  key={chk.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-indigo-950/30 border-indigo-500/50 ring-1 ring-indigo-500/20'
                      : 'bg-white/[0.02] border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full font-mono font-bold text-[10px] bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                        v{chk.version}
                      </span>
                      {isActive && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {lineCount} lines
                    </span>
                  </div>

                  <p className="text-zinc-200 text-xs font-medium line-clamp-2 mb-3">
                    {chk.summary || chk.content}
                  </p>

                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">
                      {chk.format || format}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(chk.id, chk.codeSnapshot)}
                        className="px-2 py-1 rounded-lg text-[10px] font-mono bg-white/[0.05] hover:bg-white/10 text-zinc-300 transition cursor-pointer"
                      >
                        {copiedId === chk.id ? 'Copied' : 'Copy'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onRestoreVersion(chk)}
                        disabled={isActive}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition cursor-pointer active:scale-95"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Unified Bottom Command & Input Dock */}
      <div className="border-t border-white/[0.08] bg-[#0c0e17] flex flex-col shrink-0 relative">
        {/* Quick Suggestion & Mutation Pills Carousel */}
        <div className="px-3 pt-2 pb-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-white/[0.04]">
          {/* Surprise deck: one curated place × activity × light × palette combo */}
          <button
            type="button"
            onClick={() => setInput(drawSurprise().prompt)}
            title="Draw a curated combination into the composer"
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-400/10 hover:bg-amber-400/20 text-amber-200 border border-amber-400/25 whitespace-nowrap transition cursor-pointer"
          >
            <Sparkles className="w-2.5 h-2.5 shrink-0" />
            <span>Surprise me</span>
          </button>
          {/* Format Inspirations */}
          {(INSPIRATIONS[format] || []).slice(0, 3).map((s, idx) => (
            <button
              key={`insp-${idx}`}
              type="button"
              onClick={() => setInput(s)}
              className="inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] whitespace-nowrap transition cursor-pointer max-w-[200px] truncate"
            >
              <Sparkles className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
              <span className="truncate">{s}</span>
            </button>
          ))}
          {/* Quick Mutations */}
          {QUICK_MUTATIONS.map((q, idx) => (
            <button
              key={`mut-${idx}`}
              type="button"
              onClick={() => setInput(q.text)}
              className="text-[10px] font-medium px-2.5 py-1 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 whitespace-nowrap transition cursor-pointer"
            >
              {q.label}
            </button>
          ))}
        </div>

        {/* Engine Format & Model Controls Strip */}
        <div className="px-3 py-1.5 flex items-center justify-between text-xs border-b border-white/[0.04]">
          {/* Format Selector */}
          {setFormat && (
            <div className="flex items-center p-0.5 rounded-lg bg-zinc-950/70 border border-white/[0.06] text-[11px]">
              {(['svg', 'worlds', 'pixel', 'dither'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFormat(fmt)}
                  className={`px-2 py-0.5 rounded font-mono uppercase font-semibold transition cursor-pointer ${
                    format === fmt ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          )}

          {/* Model & AI Settings */}
          <div className="flex items-center gap-1.5">
            {onToggleSeedLock && (
              <button
                type="button"
                onClick={onToggleSeedLock}
                title={
                  seedLocked
                    ? `Seed ${seed} locked — the same model and prompt should reproduce this composition`
                    : 'Lock the seed to make this composition repeatable'
                }
                className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono border transition cursor-pointer ${
                  seedLocked
                    ? 'text-emerald-200 bg-emerald-500/15 border-emerald-500/30'
                    : 'text-zinc-400 bg-white/[0.03] border-white/[0.08] hover:text-zinc-200'
                }`}
              >
                {seedLocked ? <Lock className="w-3 h-3" /> : <LockOpen className="w-3 h-3" />}
                <span>{seed ?? '—'}</span>
              </button>
            )}
            {provider === 'gemini' ? (
              setGeminiModel && (
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="bg-zinc-950 border border-white/[0.08] rounded-lg px-2 py-0.5 text-[11px] text-zinc-300 font-mono focus:outline-none cursor-pointer"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                </select>
              )
            ) : (
              setOllamaModel && (
                <select
                  value={ollamaModel}
                  onChange={(e) => setOllamaModel(e.target.value)}
                  className="bg-zinc-950 border border-white/[0.08] rounded-lg px-2 py-0.5 text-[11px] text-zinc-300 font-mono focus:outline-none cursor-pointer max-w-[140px] truncate"
                >
                  {ollamaModels.length > 0 ? (
                    ollamaModels
                      .filter((m) => !m.name.includes('embed'))
                      .map((m) => (
                        <option key={m.name} value={m.name}>
                          {m.name}
                        </option>
                      ))
                  ) : (
                    <option value="qwen2.5-coder:1.5b">qwen2.5-coder:1.5b</option>
                  )}
                </select>
              )
            )}

            {/* Enhance Prompt Button */}
            {onEnhancePrompt && (
              <button
                type="button"
                onClick={handleEnhanceClick}
                disabled={!input.trim() || isEnhancing || isProcessing}
                title="Nuanced AI expansion with architectural layout, kinetic loops, and lighting"
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white transition shadow-sm border border-purple-400/30 cursor-pointer"
              >
                <Wand2 className="w-3 h-3 text-purple-200" />
                <span>{isEnhancing ? 'Enhancing…' : 'Enhance'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Input Text Box with Slash Command Menu & Resizable Textarea */}
        <div className="p-3 relative">
          {showSlashMenu && (
            <SlashCommandMenu
              filter={slashFilter}
              selectedIndex={selectedSlashIndex}
              onSelect={handleSelectSlashCommand}
              onClose={() => setShowSlashMenu(false)}
            />
          )}

          <div className="flex items-end gap-2 bg-[#121422] border border-white/[0.08] rounded-2xl px-3.5 py-2.5 focus-within:border-indigo-500/80 focus-within:ring-2 focus-within:ring-indigo-500/20 transition shadow-inner">
            <Terminal className="w-3.5 h-3.5 text-indigo-400 mb-1 shrink-0" aria-hidden="true" />
            <textarea
              ref={textareaRef}
              aria-label={askSceneEnabled ? 'Ask a question about the current scene' : 'Describe a change to the current scene'}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Prompt or instruction... (/ for commands, Enter to send)"
              disabled={isProcessing}
              className="flex-1 bg-transparent text-[13px] text-white placeholder-zinc-500 focus:outline-none disabled:opacity-50 resize-none max-h-28 overflow-y-auto leading-relaxed py-0.5"
            />

            {input.length > 0 && (
              <button
                type="button"
                onClick={() => setInput('')}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded-full hover:bg-white/[0.06] transition cursor-pointer mb-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!input.trim() || isProcessing}
              title="Send prompt or mutation (Enter)"
              className="w-7 h-7 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none disabled:opacity-100 text-white flex items-center justify-center transition shadow-md shadow-indigo-600/30 cursor-pointer active:scale-95 shrink-0 mb-0.5"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mt-1.5 px-1">
            <span>Shift+Enter for newline</span>
            {input.length > 0 && <span>{input.length} chars</span>}
          </div>
        </div>
      </div>
    </aside>
  );
};

import React, { useEffect, useRef } from 'react';
import {
  Shapes,
  Cuboid,
  Grid3X3,
  Sparkles,
  Wand2,
  Box,
  Download,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { SlashCommandType } from '../types';

export interface CommandItem {
  command: SlashCommandType;
  label: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export const SLASH_COMMANDS: CommandItem[] = [
  {
    command: '/svg',
    label: '/svg',
    description: 'Create or switch to Isometric SVG Vector figure',
    icon: Shapes,
    badge: 'SVG Engine',
    badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
  {
    command: '/worlds',
    label: '/worlds',
    description: 'Create or switch to Three.js Orthographic 3D miniature',
    icon: Cuboid,
    badge: 'Three.js',
    badgeColor: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10',
  },
  {
    command: '/pixel',
    label: '/pixel',
    description: 'Create or switch to 320×240 Retro Software Pixel Art',
    icon: Grid3X3,
    badge: 'Pixel Engine',
    badgeColor: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
  {
    command: '/dither',
    label: '/dither',
    description: 'Create or switch to 4×4 Bayer Ordered Dither Yard',
    icon: Sparkles,
    badge: 'Dither Yard',
    badgeColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  },
  {
    command: '/enhance',
    label: '/enhance',
    description: 'Exponentially enhance prompt with architectural nuance',
    icon: Wand2,
    badge: 'AI Enhancer',
    badgeColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  },
  {
    command: '/glb',
    label: '/glb',
    description: 'Download active 3D model as Binary GLTF (.glb)',
    icon: Box,
    badge: '3D Binary',
    badgeColor: 'text-indigo-300 border-indigo-400/30 bg-indigo-500/10',
  },
  {
    command: '/html',
    label: '/html',
    description: 'Export standalone self-contained offline HTML file',
    icon: Download,
    badge: 'Offline HTML',
    badgeColor: 'text-teal-400 border-teal-500/30 bg-teal-500/10',
  },
  {
    command: '/undo',
    label: '/undo',
    description: 'Revert to the previous version in conversation history',
    icon: RotateCcw,
    badge: 'Time Travel',
    badgeColor: 'text-zinc-400 border-zinc-700 bg-zinc-800',
  },
  {
    command: '/clear',
    label: '/clear',
    description: 'Reset conversation history and start a fresh session',
    icon: Trash2,
    badge: 'Session',
    badgeColor: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
  },
];

interface SlashCommandMenuProps {
  filter: string;
  selectedIndex: number;
  onSelect: (cmd: CommandItem) => void;
  onClose: () => void;
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  filter,
  selectedIndex,
  onSelect,
  onClose,
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  const cleanFilter = filter.toLowerCase().replace(/^\//, '');
  const filteredCommands = SLASH_COMMANDS.filter(
    (c) =>
      c.command.toLowerCase().includes(cleanFilter) ||
      c.label.toLowerCase().includes(cleanFilter) ||
      c.description.toLowerCase().includes(cleanFilter)
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (filteredCommands.length === 0) return null;

  return (
    <div
      ref={listRef}
      className="absolute bottom-full left-0 mb-2 w-96 max-h-80 overflow-y-auto rounded-xl bg-zinc-950/95 border border-zinc-800 shadow-2xl backdrop-blur-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-zinc-500 border-b border-zinc-800/80 mb-1 flex items-center justify-between">
        <span>Slash Commands</span>
        <span>↑↓ Navigate · ↵ Select</span>
      </div>
      <div className="space-y-0.5">
        {filteredCommands.map((item, idx) => {
          const Icon = item.icon;
          const isSelected = idx === selectedIndex % filteredCommands.length;
          return (
            <button
              key={item.command}
              type="button"
              onClick={() => onSelect(item)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition ${
                isSelected
                  ? 'bg-indigo-600/20 text-white border border-indigo-500/40'
                  : 'text-zinc-300 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-indigo-500/30 text-indigo-200' : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-white">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate">{item.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};


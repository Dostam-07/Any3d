import React, { useState, useRef, useEffect } from 'react';
import {
  Sunrise,
  Sun,
  Sunset,
  Moon,
  CloudRain,
  Snowflake,
  Cloud,
  ChevronDown,
} from 'lucide-react';
import { AnchoredPanel } from './AnchoredPanel';
import {
  LOOK_CHIPS,
  LOOK_STOPS,
  nearestStop,
  lookLabel,
  type SceneLook,
  type SceneWeather,
} from '../lib/look';

interface LookScrubberProps {
  look: SceneLook;
  onChange: (look: SceneLook) => void;
  compact?: boolean;
}

const STOP_ICONS: Record<string, React.FC<{ className?: string }>> = {
  dawn: Sunrise,
  noon: Sun,
  dusk: Sunset,
  night: Moon,
};

const WEATHERS: { key: SceneWeather; label: string; icon: typeof Cloud }[] = [
  { key: 'clear', label: 'Clear', icon: Cloud },
  { key: 'rain', label: 'Rain', icon: CloudRain },
  { key: 'snow', label: 'Snow', icon: Snowflake },
];

/**
 * Clubbed Environment & Lighting Scrubber.
 * Consolidates time-of-day slider, snap stops, lighting chips, and weather toggles
 * into a single unified, elegant popover dropdown to keep the 3D toolbar slender.
 */
export const LookScrubber: React.FC<LookScrubberProps> = ({ look, onChange }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const activeStop = nearestStop(look.timeOfDay);

  const matchedStop = LOOK_STOPS.reduce((prev, curr) =>
    Math.abs(curr.at - look.timeOfDay) < Math.abs(prev.at - look.timeOfDay) ? curr : prev
  );

  const ActiveIcon = STOP_ICONS[matchedStop.key] || Sun;

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      // The panel is portalled out of the toolbar's scrolling row, so a click
      // inside it is outside `containerRef` but still inside the menu.
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative shrink-0" ref={containerRef}>
      {/* Clubbed Trigger Pill */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Atmosphere, lighting & weather controls"
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium border transition cursor-pointer active:scale-95 shrink-0 ${
          open
            ? 'bg-zinc-800 text-amber-300 border-amber-500/40 shadow-sm ring-1 ring-amber-500/20'
            : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-white/[0.08]'
        }`}
      >
        <ActiveIcon className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-medium text-[11px]">{lookLabel(look)}</span>
        {look.weather === 'rain' && <CloudRain className="w-3 h-3 text-sky-400" />}
        {look.weather === 'snow' && <Snowflake className="w-3 h-3 text-cyan-300" />}
        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Floating Popover Panel */}
      {open && (
<AnchoredPanel anchor={containerRef} panelRef={panelRef} open gap={8} className="w-72 p-3.5 rounded-2xl bg-[#0c0e17] border border-white/[0.12] shadow-2xl shadow-black/80 z-50 backdrop-blur-xl animate-fade-in space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              <span>Lighting & Atmosphere</span>
            </span>
            <span className="text-[10px] font-mono text-amber-400">
              {Math.round(look.timeOfDay * 100)}%
            </span>
          </div>

          {/* Time of Day Slider */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
              <span>Time of day</span>
              <span className="font-medium text-zinc-300">{matchedStop.label}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={look.timeOfDay}
              aria-label="Time of day"
              onChange={(e) => onChange({ ...look, timeOfDay: Number(e.target.value) })}
              onPointerUp={() => {
                const snapped = nearestStop(look.timeOfDay);
                if (snapped !== look.timeOfDay) onChange({ ...look, timeOfDay: snapped });
              }}
              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
            />
          </div>

          {/* Snap Presets */}
          <div className="grid grid-cols-4 gap-1">
            {LOOK_STOPS.map((stop) => {
              const Icon = STOP_ICONS[stop.key] || Sun;
              const active = Math.abs(activeStop - stop.at) < 0.001;
              return (
                <button
                  key={stop.key}
                  type="button"
                  onClick={() => onChange({ ...look, timeOfDay: stop.at })}
                  title={`${stop.label} — ${stop.hint}`}
                  className={`flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg text-[10px] font-medium border transition cursor-pointer ${
                    active
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                      : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{stop.label}</span>
                </button>
              );
            })}
          </div>

          {/* Golden / Blue Hour Chips */}
          <div className="flex items-center gap-1.5">
            {LOOK_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => onChange({ ...look, timeOfDay: chip.at, weather: chip.weather })}
                className={`flex-1 py-1 px-2 rounded-lg text-[10px] font-medium border transition cursor-pointer text-center ${
                  Math.abs(look.timeOfDay - chip.at) < 0.001
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-200 font-semibold'
                    : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Weather Effects */}
          <div className="pt-2 border-t border-white/[0.06]">
            <div className="text-[10px] text-zinc-400 mb-1.5">Weather condition</div>
            <div className="grid grid-cols-3 gap-1.5">
              {WEATHERS.map((w) => {
                const Icon = w.icon;
                const active = look.weather === w.key;
                return (
                  <button
                    key={w.key}
                    type="button"
                    onClick={() => onChange({ ...look, weather: w.key })}
                    className={`flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[10px] font-medium border transition cursor-pointer ${
                      active
                        ? 'bg-sky-500/20 border-sky-500/40 text-sky-200 font-semibold'
                        : 'bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{w.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </AnchoredPanel>
      )}
    </div>
  );
};

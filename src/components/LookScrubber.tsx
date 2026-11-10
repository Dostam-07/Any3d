import React from 'react';
import { Sunrise, Sun, Sunset, Moon, CloudRain, Snowflake, Cloud } from 'lucide-react';
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

const STOP_ICONS = [Sunrise, Sun, Sunset, Moon];
const WEATHERS: { key: SceneWeather; label: string; icon: typeof Cloud }[] = [
  { key: 'clear', label: 'Clear', icon: Cloud },
  { key: 'rain', label: 'Rain', icon: CloudRain },
  { key: 'snow', label: 'Snow', icon: Snowflake },
];

/**
 * Time-of-day scrubber. Four snap points, two named chips and a weather toggle.
 *
 * Every change is a message to the live scene — no re-bundle, no re-generation —
 * so dragging stays at the scene's own frame rate.
 */
export const LookScrubber: React.FC<LookScrubberProps> = ({ look, onChange, compact }) => {
  const activeStop = nearestStop(look.timeOfDay);

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Light</span>

      <div className="flex items-center gap-1.5 min-w-0">
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
          className="w-20 sm:w-24 accent-amber-400 cursor-pointer"
        />

        <div className="flex items-center p-0.5 rounded-lg bg-zinc-950/80 border border-white/[0.06]">
          {LOOK_STOPS.map((stop, i) => {
            const Icon = STOP_ICONS[i];
            const active = Math.abs(activeStop - stop.at) < 0.001;
            return (
              <button
                key={stop.key}
                type="button"
                onClick={() => onChange({ ...look, timeOfDay: stop.at })}
                aria-pressed={active}
                aria-label={stop.label}
                title={`${stop.label} — ${stop.hint}`}
                className={
                  'flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium transition cursor-pointer ' +
                  (active ? 'bg-white/[0.1] text-amber-200' : 'text-zinc-500 hover:text-zinc-200')
                }
              >
                <Icon className="w-3 h-3" />
                {!compact && <span>{stop.label}</span>}
              </button>
            );
          })}
        </div>

        {!compact && (
          <div className="flex items-center gap-1">
            {LOOK_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => onChange({ ...look, timeOfDay: chip.at, weather: chip.weather })}
                title={`Jump to ${chip.label.toLowerCase()}`}
                className={
                  'px-1.5 py-0.5 rounded-md text-[10px] font-medium border transition cursor-pointer ' +
                  (Math.abs(look.timeOfDay - chip.at) < 0.001
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-200'
                    : 'bg-white/[0.03] border-white/[0.07] text-zinc-400 hover:text-zinc-200')
                }
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center p-0.5 rounded-lg bg-zinc-950/80 border border-white/[0.06]">
          {WEATHERS.map((w) => {
            const Icon = w.icon;
            return (
              <button
                key={w.key}
                type="button"
                onClick={() => onChange({ ...look, weather: w.key })}
                aria-pressed={look.weather === w.key}
                aria-label={w.label}
                title={w.label}
                className={
                  'p-1 rounded-md transition cursor-pointer ' +
                  (look.weather === w.key ? 'bg-white/[0.1] text-sky-200' : 'text-zinc-500 hover:text-zinc-200')
                }
              >
                <Icon className="w-3 h-3" />
              </button>
            );
          })}
        </div>
      </div>

      <span className="text-[10px] font-mono text-zinc-500 hidden xl:inline">{lookLabel(look)}</span>
    </div>
  );
};

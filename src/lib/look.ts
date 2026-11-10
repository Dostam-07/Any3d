/**
 * The scene look — time of day and weather.
 *
 * This is the client-side half of the Phase 3 atmosphere system. The engine
 * kernels own the actual keyframes (sun angles, grade, sky colours); this module
 * only carries the value, its four snap points and its labels, so the toolbar,
 * the payload and the recorder all agree on the same numbers.
 */

import type { SceneLook, SceneWeather } from './scene-payload';

export type { SceneLook, SceneWeather };

/** Noon is the identity keyframe: it reproduces the scene exactly as built. */
export const DEFAULT_LOOK: SceneLook = { timeOfDay: 1 / 3, weather: 'clear' };

export interface LookStop {
  at: number;
  key: 'dawn' | 'noon' | 'dusk' | 'night';
  label: string;
  hint: string;
}

export const LOOK_STOPS: LookStop[] = [
  { at: 0, key: 'dawn', label: 'Dawn', hint: 'Low warm sun, long shadows' },
  { at: 1 / 3, key: 'noon', label: 'Noon', hint: 'The scene as it was built' },
  { at: 2 / 3, key: 'dusk', label: 'Dusk', hint: 'Golden hour, lamps coming on' },
  { at: 1, key: 'night', label: 'Night', hint: 'Moonlight grade, lamps lit' },
];

export const LOOK_CHIPS: { label: string; at: number; weather: SceneWeather }[] = [
  { label: 'Golden hour', at: 0.72, weather: 'clear' },
  { label: 'Blue hour', at: 0.84, weather: 'clear' },
];

export function clampLookTime(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_LOOK.timeOfDay;
  return Math.min(1, Math.max(0, value));
}

/** Nearest of the four snap points, used when a drag ends. */
export function nearestStop(at: number): number {
  let best = LOOK_STOPS[0];
  for (const stop of LOOK_STOPS) {
    if (Math.abs(stop.at - at) < Math.abs(best.at - at)) best = stop;
  }
  return best.at;
}

export function stopAt(at: number): LookStop {
  const nearest = nearestStop(at);
  return LOOK_STOPS.find((s) => s.at === nearest) ?? LOOK_STOPS[1];
}

export function normalizeLook(look?: Partial<SceneLook> | null): SceneLook {
  const weather = look?.weather;
  return {
    timeOfDay: clampLookTime(Number(look?.timeOfDay ?? DEFAULT_LOOK.timeOfDay)),
    weather: weather === 'rain' || weather === 'snow' ? weather : 'clear',
  };
}

export function lookLabel(look: SceneLook): string {
  const stop = stopAt(look.timeOfDay);
  const weather = look.weather === 'clear' ? '' : ` · ${look.weather}`;
  return `${stop.label}${weather}`;
}

export function isDefaultLook(look?: SceneLook | null): boolean {
  if (!look) return true;
  return Math.abs(look.timeOfDay - DEFAULT_LOOK.timeOfDay) < 0.001 && look.weather === 'clear';
}

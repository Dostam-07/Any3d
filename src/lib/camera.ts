/**
 * A camera the user picked in the studio.
 *
 * `reset` means "the angle this scene was authored for": an SVG figure carries
 * its own camera as part of its art, so a fixed pair of angles would move a scene
 * the author had framed deliberately. The other shape is an explicit orbit.
 */
export type CameraPick = { reset: true } | { az: number; el: number };

export type CameraPreset = 'iso' | 'top' | 'front' | 'side';

export const CAMERA_PRESETS: Record<CameraPreset, CameraPick> = {
  iso: { reset: true },
  top: { az: 0, el: 85 },
  front: { az: 0, el: 15 },
  side: { az: 85, el: 20 },
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Accept only what the runtimes can apply, so a stored session, a share link or
 * a bad message cannot hand `setCamera` a NaN and blank the stage.
 */
export function sanitizeCamera(value: unknown): CameraPick | null {
  if (!value || typeof value !== 'object') return null;
  const pick = value as { reset?: unknown; az?: unknown; el?: unknown };
  if (pick.reset === true) return { reset: true };
  const az = Number(pick.az);
  const el = Number(pick.el);
  if (!Number.isFinite(az) || !Number.isFinite(el)) return null;
  return { az: clamp(((az % 360) + 360) % 360, 0, 359.9), el: clamp(el, -90, 90) };
}

/** The label the toolbar shows for a pick; an unknown angle reads as a custom view. */
export function cameraLabel(pick: CameraPick | null): string {
  if (!pick) return 'iso';
  for (const [key, preset] of Object.entries(CAMERA_PRESETS) as [CameraPreset, CameraPick][]) {
    if ('reset' in preset && 'reset' in pick) return key;
    if ('az' in preset && 'az' in pick && preset.az === pick.az && preset.el === pick.el) return key;
  }
  return 'view';
}

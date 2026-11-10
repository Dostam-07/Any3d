/**
 * Opt-in, on-device usage counters.
 *
 * Local-first means no telemetry by default: nothing is sent anywhere. When the
 * user explicitly opts in (Settings → "Share anonymous usage counts"), counters
 * are kept in localStorage and shown in the debug panel, where they can be read
 * and reset. The counts are the only signal we have that Phase 1/2 worked.
 */

const STORAGE_KEY = 'any3d_telemetry';
const OPTIN_KEY = 'any3d_telemetry_optin';

export interface TelemetryCounters {
  scenesCreated: number;
  editsPerProject: Record<string, number>;
  exportsByType: Record<string, number>;
  remixLinksOpened: number;
}

const EMPTY: TelemetryCounters = {
  scenesCreated: 0,
  editsPerProject: {},
  exportsByType: {},
  remixLinksOpened: 0,
};

function readRaw(): TelemetryCounters {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY, editsPerProject: {}, exportsByType: {} };
    const parsed = JSON.parse(raw);
    return {
      scenesCreated: Number(parsed?.scenesCreated) || 0,
      editsPerProject: parsed?.editsPerProject && typeof parsed.editsPerProject === 'object' ? parsed.editsPerProject : {},
      exportsByType: parsed?.exportsByType && typeof parsed.exportsByType === 'object' ? parsed.exportsByType : {},
      remixLinksOpened: Number(parsed?.remixLinksOpened) || 0,
    };
  } catch {
    return { ...EMPTY, editsPerProject: {}, exportsByType: {} };
  }
}

function writeRaw(c: TelemetryCounters): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    /* ignore quota errors */
  }
}

export function isTelemetryEnabled(): boolean {
  try {
    return localStorage.getItem(OPTIN_KEY) === '1';
  } catch {
    return false;
  }
}

export function setTelemetryEnabled(on: boolean): void {
  try {
    if (on) localStorage.setItem(OPTIN_KEY, '1');
    else localStorage.removeItem(OPTIN_KEY);
  } catch {
    /* ignore */
  }
}

export function readCounters(): TelemetryCounters {
  return readRaw();
}

export function resetCounters(): void {
  writeRaw({ ...EMPTY, editsPerProject: {}, exportsByType: {} });
}

/** No-op unless the user has opted in. Safe to call from anywhere. */
export function countSceneCreated(): void {
  if (!isTelemetryEnabled()) return;
  const c = readRaw();
  c.scenesCreated += 1;
  writeRaw(c);
}

export function countEdit(projectId: string): void {
  if (!isTelemetryEnabled()) return;
  const c = readRaw();
  const key = projectId || 'unknown';
  c.editsPerProject[key] = (c.editsPerProject[key] || 0) + 1;
  writeRaw(c);
}

export function countExport(type: string): void {
  if (!isTelemetryEnabled()) return;
  const c = readRaw();
  c.exportsByType[type] = (c.exportsByType[type] || 0) + 1;
  writeRaw(c);
}

export function countRemixOpened(): void {
  if (!isTelemetryEnabled()) return;
  const c = readRaw();
  c.remixLinksOpened += 1;
  writeRaw(c);
}

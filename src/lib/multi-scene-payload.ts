/**
 * Multi-scene payload — scene composition for worlds.
 *
 * A multi-scene payload combines multiple individual scenes into a single
 * shareable unit. Each scene keeps its own engine, code, look, and theme, and
 * is placed at an (x, z) coordinate on a shared grid so they can be rendered
 * together as one cohesive world.
 *
 * Payload v3 adds the `scenes` array. Single-scene payloads (v2) continue to
 * work unchanged; multi-scene payloads are opt-in.
 *
 * Envelope:  <codec><base64url(payload)>
 *   Same codecs as scene-payload: 'r' = deflate-raw, 'd' = deflate, 'p' = plain.
 *
 * No network access, no DOM access, no Node-only APIs.
 */

import type { RenderFormat, SVGTheme, WorldFinish } from '../types';
import {
  SceneLook,
  ScenePayload,
  SCENE_PAYLOAD_VERSION as SCENE_PAYLOAD_VERSION_V2,
  ScenePayloadError,
  stripCodeComments,
  compactCode,
} from './scene-payload';

/** v3 adds `scenes` for multi-scene worlds composition. */
export const MULTI_SCENE_PAYLOAD_VERSION = 3;

export type MultiSceneWeather = SceneLook['weather'];

export interface ScenePlacement {
  /** Grid X coordinate (in world units). */
  x: number;
  /** Grid Z coordinate (in world units). */
  z: number;
  /** Optional rotation in radians around Y. */
  yaw?: number;
  /** Optional uniform scale. Default 1. */
  scale?: number;
}

export interface MultiSceneEntry {
  /** Human-readable name for this scene in the composition. */
  name: string;
  /** The individual scene payload. */
  scene: ScenePayload;
  /** Placement on the shared grid. */
  placement: ScenePlacement;
}

export interface MultiScenePayload {
  v: number;
  /** Human-readable title for the composition. */
  title: string;
  /** Optional overall description. */
  description?: string;
  /** Individual scenes, each with its own engine, code, and placement. */
  scenes: MultiSceneEntry[];
  /** Optional overall look applied as a base; individual scenes can override. */
  look?: SceneLook;
  /** Optional seed for deterministic composition. */
  seed?: number;
}

export type MultiScenePayloadReason =
  | 'empty'
  | 'too-large'
  | 'malformed'
  | 'unsupported-version'
  | 'invalid-format'
  | 'unsupported-codec'
  | 'missing-scene'
  | 'invalid-scene';

export class MultiScenePayloadError extends Error {
  readonly reason: MultiScenePayloadReason;

  constructor(reason: MultiScenePayloadReason, message: string) {
    super(message);
    this.name = 'MultiScenePayloadError';
    this.reason = reason;
  }
}

const MAX_SCENES = 16;
const MAX_TOTAL_CODE_CHARS = 400_000;

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export interface EncodeMultiSceneOptions {
  stripComments?: boolean;
  compact?: boolean;
}

/**
 * Encode a multi-scene payload into a shareable string.
 * Throws MultiScenePayloadError on validation failure.
 */
export async function encodeMultiScene(
  payload: MultiScenePayload,
  options: EncodeMultiSceneOptions = {}
): Promise<string> {
  const normalized = normalizeMultiScene(
    payload,
    Boolean(options.stripComments || options.compact),
    Boolean(options.compact)
  );
  const json = JSON.stringify(normalized);
  const bytes = new TextEncoder().encode(json);

  const { codec, data } = await compress(bytes);
  const encoded = `${codec}${bytesToBase64Url(data)}`;

  if (encoded.length > 300_000) {
    throw new MultiScenePayloadError('too-large', 'Multi-scene payload is too large to share as a link');
  }
  return encoded;
}

/**
 * Decode a multi-scene payload string.
 * Throws MultiScenePayloadError on validation failure.
 */
export async function decodeMultiScene(encoded: string): Promise<MultiScenePayload> {
  const value = (encoded || '').trim();
  if (!value) throw new MultiScenePayloadError('empty', 'No scene data in this link');
  if (value.length > 300_000) {
    throw new MultiScenePayloadError('too-large', 'Multi-scene link is too large');
  }

  const codec = value[0] as 'r' | 'd' | 'p';
  const validCodecs = ['r', 'd', 'p'] as const;
  if (!validCodecs.includes(codec)) {
    throw new MultiScenePayloadError('unsupported-codec', `Unknown payload codec "${value[0]}"`);
  }

  let bytes: Uint8Array;
  try {
    bytes = base64UrlToBytes(value.slice(1));
  } catch {
    throw new MultiScenePayloadError('malformed', 'Multi-scene data is not valid base64url');
  }

  let json: string;
  try {
    json = new TextDecoder().decode(await decompress(codec, bytes));
  } catch {
    throw new MultiScenePayloadError('malformed', 'Multi-scene data could not be decompressed');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new MultiScenePayloadError('malformed', 'Multi-scene data is not valid JSON');
  }

  return validateMultiScene(parsed);
}

/** `#/m/...` path for a multi-scene composition, ready to append to any origin + pathname. */
export function multiSceneSharePath(encoded: string): string {
  return `#/m/${encoded}`;
}

/** Absolute share URL for a multi-scene composition. */
export function multiSceneShareUrl(encoded: string): string {
  const path = multiSceneSharePath(encoded);
  if (typeof window === 'undefined' || !window.location) return path;
  const { origin, pathname } = window.location;
  return `${origin}${pathname}${path}`;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

function normalizeMultiScene(
  payload: MultiScenePayload,
  strip: boolean,
  compact = false
): MultiScenePayload {
  if (!payload || typeof payload !== 'object') {
    throw new MultiScenePayloadError('malformed', 'Multi-scene payload is not an object');
  }
  if (!payload.title || typeof payload.title !== 'string' || !payload.title.trim()) {
    throw new MultiScenePayloadError('missing-scene', 'Multi-scene payload needs a title');
  }
  if (!Array.isArray(payload.scenes) || payload.scenes.length === 0) {
    throw new MultiScenePayloadError('missing-scene', 'Multi-scene payload needs at least one scene');
  }
  if (payload.scenes.length > MAX_SCENES) {
    throw new MultiScenePayloadError(
      'too-large',
      `Multi-scene payload exceeds ${MAX_SCENES} scenes`
    );
  }

  const normalizedScenes: MultiSceneEntry[] = [];
  let totalCodeChars = 0;

  for (const entry of payload.scenes) {
    if (!entry || typeof entry !== 'object') {
      throw new MultiScenePayloadError('invalid-scene', 'Multi-scene entry is not an object');
    }
    if (!entry.scene || typeof entry.scene !== 'object') {
      throw new MultiScenePayloadError('invalid-scene', 'Multi-scene entry needs a scene');
    }

    // Validate and normalize the inner single scene.
    const inner = normalizeScenePayload(entry.scene, strip, compact);
    totalCodeChars += inner.code.length;

    const placement = normalizePlacement(entry.placement);
    normalizedScenes.push({
      name: entry.name || `Scene ${normalizedScenes.length + 1}`,
      scene: inner,
      placement,
    });
  }

  if (totalCodeChars > MAX_TOTAL_CODE_CHARS) {
    throw new MultiScenePayloadError(
      'too-large',
      `Multi-scene payload code exceeds ${MAX_TOTAL_CODE_CHARS} total characters`
    );
  }

  const out: MultiScenePayload = {
    v: MULTI_SCENE_PAYLOAD_VERSION,
    title: payload.title.trim(),
    scenes: normalizedScenes,
  };
  if (payload.description) out.description = payload.description.trim();
  if (payload.look) {
    out.look = {
      timeOfDay: Math.min(1, Math.max(0, Number(payload.look.timeOfDay) || 0)),
      weather: ['clear', 'rain', 'snow'].includes(payload.look.weather)
        ? payload.look.weather
        : 'clear',
    };
  }
  if (typeof payload.seed === 'number' && Number.isFinite(payload.seed)) out.seed = payload.seed;
  return out;
}

function normalizeScenePayload(
  payload: ScenePayload,
  strip: boolean,
  compact = false
): ScenePayload {
  if (!payload || typeof payload.code !== 'string' || !payload.code.trim()) {
    throw new MultiScenePayloadError('missing-scene', 'Multi-scene entry needs scene code');
  }
  const code = compact
    ? compactCode(payload.code)
    : strip
      ? stripCodeComments(payload.code)
      : payload.code;
  if (code.length > 200_000) {
    throw new MultiScenePayloadError('too-large', 'Multi-scene entry code is too large');
  }

  const out: ScenePayload = {
    v: SCENE_PAYLOAD_VERSION_V2,
    format: payload.format,
    code,
  };
  if (payload.prompt) out.prompt = payload.prompt;
  if (payload.theme) out.theme = payload.theme;
  if (payload.finish) out.finish = payload.finish;
  if (payload.seed !== undefined) out.seed = payload.seed;
  if (payload.look) {
    out.look = {
      timeOfDay: Math.min(1, Math.max(0, Number(payload.look.timeOfDay) || 0)),
      weather: ['clear', 'rain', 'snow'].includes(payload.look.weather)
        ? payload.look.weather
        : 'clear',
    };
  }
  return out;
}

function normalizePlacement(
  placement?: ScenePlacement
): ScenePlacement {
  return {
    x: placement?.x ?? 0,
    z: placement?.z ?? 0,
    yaw: placement?.yaw ?? 0,
    scale: placement?.scale ?? 1,
  };
}

function validateMultiScene(value: unknown): MultiScenePayload {
  if (!value || typeof value !== 'object') {
    throw new MultiScenePayloadError('malformed', 'Multi-scene payload is not an object');
  }
  const raw = value as Partial<MultiScenePayload> & { v?: unknown };

  const version = Number(raw.v);
  if (!Number.isFinite(version) || version < 1) {
    throw new MultiScenePayloadError('malformed', 'Multi-scene payload has no version');
  }
  if (version > MULTI_SCENE_PAYLOAD_VERSION) {
    throw new MultiScenePayloadError(
      'unsupported-version',
      `This link was made with a newer Any3d (multi-scene payload v${version})`
    );
  }
  if (
    typeof raw.title !== 'string' ||
    !raw.title.trim()
  ) {
    throw new MultiScenePayloadError('missing-scene', 'Multi-scene payload needs a title');
  }
  if (!Array.isArray(raw.scenes) || raw.scenes.length === 0) {
    throw new MultiScenePayloadError('missing-scene', 'Multi-scene payload needs at least one scene');
  }

  const out: MultiScenePayload = {
    v: version,
    title: raw.title.trim(),
    scenes: [],
  };
  if (typeof raw.description === 'string') out.description = raw.description.trim();
  if (raw.look && typeof raw.look === 'object') {
    out.look = {
      timeOfDay: Math.min(1, Math.max(0, Number((raw.look as SceneLook).timeOfDay) || 0)),
      weather: ['clear', 'rain', 'snow'].includes((raw.look as SceneLook).weather)
        ? (raw.look as SceneLook).weather
        : 'clear',
    };
  }
  if (typeof raw.seed === 'number' && Number.isFinite(raw.seed)) out.seed = raw.seed;

  for (const rawEntry of raw.scenes) {
    if (!rawEntry || typeof rawEntry !== 'object') {
      throw new MultiScenePayloadError('invalid-scene', 'Multi-scene entry is not an object');
    }
    if (!rawEntry.scene || typeof rawEntry.scene !== 'object') {
      throw new MultiScenePayloadError('invalid-scene', 'Multi-scene entry needs a scene');
    }

    // Reuse single-scene validation for the inner scene.
    const inner = validateSingleScene(rawEntry.scene);
    const placement = normalizePlacement((rawEntry as MultiSceneEntry).placement);
    out.scenes.push({
      name: typeof rawEntry.name === 'string' && rawEntry.name.trim()
        ? rawEntry.name.trim()
        : `Scene ${out.scenes.length + 1}`,
      scene: inner,
      placement,
    });
  }

  return out;
}

function validateSingleScene(value: unknown): ScenePayload {
  if (!value || typeof value !== 'object') {
    throw new MultiScenePayloadError('invalid-scene', 'Multi-scene entry scene is not an object');
  }
  const raw = value as Partial<ScenePayload> & { v?: unknown };

  const version = Number(raw.v);
  if (!Number.isFinite(version) || version < 1) {
    throw new MultiScenePayloadError('invalid-scene', 'Multi-scene entry scene has no version');
  }
  if (version > SCENE_PAYLOAD_VERSION_V2) {
    throw new MultiScenePayloadError(
      'unsupported-version',
      `Multi-scene entry scene was made with a newer Any3d (scene payload v${version})`
    );
  }
  if (typeof raw.code !== 'string' || !raw.code.trim()) {
    throw new MultiScenePayloadError('missing-scene', 'Multi-scene entry scene needs code');
  }
  const format = raw.format as RenderFormat;
  const validFormats: RenderFormat[] = ['svg', 'worlds', 'pixel'];
  if (!validFormats.includes(format)) {
    throw new MultiScenePayloadError('invalid-format', 'Multi-scene entry scene has unknown engine');
  }

  const out: ScenePayload = { v: version, format, code: raw.code };
  if (typeof raw.prompt === 'string' && raw.prompt) out.prompt = raw.prompt;
  if (typeof raw.theme === 'string') out.theme = raw.theme;
  if (typeof raw.finish === 'string') out.finish = raw.finish;
  if (typeof raw.seed === 'number' && Number.isFinite(raw.seed)) out.seed = raw.seed;
  if (raw.look && typeof raw.look === 'object') {
    out.look = {
      timeOfDay: Math.min(1, Math.max(0, Number((raw.look as SceneLook).timeOfDay) || 0)),
      weather: ['clear', 'rain', 'snow'].includes((raw.look as SceneLook).weather)
        ? (raw.look as SceneLook).weather
        : 'clear',
    };
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Compression + base64url                                             */
/* ------------------------------------------------------------------ */

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  return buf as ArrayBuffer;
}

async function compress(bytes: Uint8Array): Promise<{ codec: 'r' | 'd' | 'p'; data: Uint8Array }> {
  for (const codec of ['r', 'd'] as const) {
    const format = codec === 'r' ? 'deflate-raw' : 'deflate';
    try {
      if (typeof CompressionStream === 'undefined') break;
      const stream = new Blob([toArrayBuffer(bytes)]).stream().pipeThrough(new CompressionStream(format));
      const data = new Uint8Array(await new Response(stream).arrayBuffer());
      return { codec, data };
    } catch {
      // Try the next codec, then fall through to plain.
    }
  }
  return { codec: 'p', data: bytes };
}

async function decompress(codec: 'r' | 'd' | 'p', bytes: Uint8Array): Promise<Uint8Array> {
  if (codec === 'p') return bytes;
  if (typeof DecompressionStream === 'undefined') {
    throw new MultiScenePayloadError('unsupported-codec', 'This browser cannot read compressed links');
  }
  const format = codec === 'r' ? 'deflate-raw' : 'deflate';
  const stream = new Blob([toArrayBuffer(bytes)]).stream().pipeThrough(new DecompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) throw new Error('invalid base64url');
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/* ------------------------------------------------------------------ */
/* Re-export single-scene helpers for convenience                      */
/* ------------------------------------------------------------------ */

export {
  stripCodeComments,
  compactCode,
};
export type { ScenePayload, SceneLook };

/**
 * Scene payload — the portable form of a scene.
 *
 * A payload is the smallest thing that can reproduce what the user is looking at:
 * the scene source, its engine, and the optional look/prompt context. It is
 * versioned so a link created today still opens after the format changes, and it
 * is compressed so it fits in a URL.
 *
 * Envelope:  <codec><base64url(payload)>
 *   codec 'r' = deflate-raw (best, Chrome/Edge/Safari 16.4+, Node 18+)
 *   codec 'd' = deflate     (fallback)
 *   codec 'p' = plain       (no CompressionStream available)
 *
 * No network access, no DOM access, no Node-only APIs: the same module runs in
 * the browser, in tests and on the server.
 */

import type { RenderFormat, SVGTheme, WorldFinish } from '../types';

/** v2 adds `look` (time of day + weather) as a first-class part of the scene. */
export const SCENE_PAYLOAD_VERSION = 2;

/** Hard ceilings — protect the URL from absurd payloads and the decoder from abuse. */
export const MAX_ENCODED_CHARS = 300_000;
export const MAX_CODE_CHARS = 200_000;

/**
 * Practical ceiling for a share link. Measured on the 44 presets: median route
 * is ~2.9 KB, p95 ~5.6 KB. Above this, offer the scene as a file instead.
 */
export const SHARE_ROUTE_SOFT_LIMIT = 6000;

export type SceneWeather = 'clear' | 'rain' | 'snow';

export interface SceneLook {
  /** 0 = dawn, 0.33 = noon, 0.66 = dusk, 1 = night. Used by Phase 3; carried here already. */
  timeOfDay: number;
  weather: SceneWeather;
}

export interface ScenePayload {
  v: number;
  format: RenderFormat;
  code: string;
  prompt?: string;
  theme?: SVGTheme;
  finish?: WorldFinish;
  look?: SceneLook;
  seed?: number;
}

export type PayloadReason =
  | 'empty'
  | 'too-large'
  | 'malformed'
  | 'unsupported-version'
  | 'invalid-format'
  | 'unsupported-codec'
  | 'missing-code';

export class ScenePayloadError extends Error {
  readonly reason: PayloadReason;

  constructor(reason: PayloadReason, message: string) {
    super(message);
    this.name = 'ScenePayloadError';
    this.reason = reason;
  }
}

const FORMATS: RenderFormat[] = ['svg', 'worlds', 'pixel', 'dither'];
const CODECS = ['r', 'd', 'p'] as const;
type Codec = (typeof CODECS)[number];

export interface EncodeOptions {
  /**
   * Drop `//` and block comments before encoding. Off by default: a payload must
   * reproduce the scene exactly. Turn it on for share links where size matters.
   */
  stripComments?: boolean;
  /**
   * Also collapse indentation and blank lines, and trim the trailing whitespace
   * of each line. Purely cosmetic for JavaScript, roughly 15% smaller than
   * stripping comments alone. Off by default.
   */
  compact?: boolean;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export async function encodeScene(
  payload: ScenePayload,
  options: EncodeOptions = {}
): Promise<string> {
  const normalized = normalize(
    payload,
    Boolean(options.stripComments || options.compact),
    Boolean(options.compact)
  );
  const json = JSON.stringify(normalized);
  const bytes = new TextEncoder().encode(json);

  const { codec, data } = await compress(bytes);
  const encoded = `${codec}${bytesToBase64Url(data)}`;

  if (encoded.length > MAX_ENCODED_CHARS) {
    throw new ScenePayloadError('too-large', 'Scene is too large to share as a link');
  }
  return encoded;
}

export async function decodeScene(encoded: string): Promise<ScenePayload> {
  const value = (encoded || '').trim();
  if (!value) throw new ScenePayloadError('empty', 'No scene data in this link');
  if (value.length > MAX_ENCODED_CHARS) {
    throw new ScenePayloadError('too-large', 'Scene link is too large');
  }

  const codec = value[0] as Codec;
  if (!CODECS.includes(codec)) {
    throw new ScenePayloadError('unsupported-codec', `Unknown payload codec "${value[0]}"`);
  }

  let bytes: Uint8Array;
  try {
    bytes = base64UrlToBytes(value.slice(1));
  } catch {
    throw new ScenePayloadError('malformed', 'Scene data is not valid base64url');
  }

  let json: string;
  try {
    json = new TextDecoder().decode(await decompress(codec, bytes));
  } catch {
    throw new ScenePayloadError('malformed', 'Scene data could not be decompressed');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new ScenePayloadError('malformed', 'Scene data is not valid JSON');
  }

  return validate(parsed);
}

/** `#/s/...` path for a scene, ready to append to any origin + pathname. */
export function sceneSharePath(encoded: string): string {
  return `#/s/${encoded}`;
}

/** Absolute share URL when a browser location is available. */
export function sceneShareUrl(encoded: string): string {
  const path = sceneSharePath(encoded);
  if (typeof window === 'undefined' || !window.location) return path;
  const { origin, pathname } = window.location;
  return `${origin}${pathname}${path}`;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

function normalize(payload: ScenePayload, strip: boolean, compact = false): ScenePayload {
  if (!payload || typeof payload.code !== 'string' || !payload.code.trim()) {
    throw new ScenePayloadError('missing-code', 'Scene code is required');
  }
  if (!FORMATS.includes(payload.format)) {
    throw new ScenePayloadError('invalid-format', `Unknown engine "${payload.format}"`);
  }
  const code = compact
    ? compactCode(payload.code)
    : strip
      ? stripCodeComments(payload.code)
      : payload.code;
  if (code.length > MAX_CODE_CHARS) {
    throw new ScenePayloadError('too-large', 'Scene code exceeds the payload limit');
  }

  const out: ScenePayload = { v: SCENE_PAYLOAD_VERSION, format: payload.format, code };
  if (payload.prompt) out.prompt = payload.prompt;
  if (payload.theme) out.theme = payload.theme;
  if (payload.finish) out.finish = payload.finish;
  if (payload.seed !== undefined) out.seed = payload.seed;
  if (payload.look) {
    out.look = {
      timeOfDay: clamp01(Number(payload.look.timeOfDay) || 0),
      weather: (['clear', 'rain', 'snow'] as const).includes(payload.look.weather)
        ? payload.look.weather
        : 'clear',
    };
  }
  return out;
}

function validate(value: unknown): ScenePayload {
  if (!value || typeof value !== 'object') {
    throw new ScenePayloadError('malformed', 'Scene data is not an object');
  }
  const raw = value as Partial<ScenePayload> & { v?: unknown };

  const version = Number(raw.v);
  if (!Number.isFinite(version) || version < 1) {
    throw new ScenePayloadError('malformed', 'Scene data has no version');
  }
  if (version > SCENE_PAYLOAD_VERSION) {
    throw new ScenePayloadError(
      'unsupported-version',
      `This link was made with a newer Any3d (payload v${version})`
    );
  }
  if (typeof raw.code !== 'string' || !raw.code.trim()) {
    throw new ScenePayloadError('missing-code', 'Scene data has no code');
  }
  if (raw.code.length > MAX_CODE_CHARS) {
    throw new ScenePayloadError('too-large', 'Scene code exceeds the payload limit');
  }
  const format = raw.format as RenderFormat;
  if (!FORMATS.includes(format)) {
    throw new ScenePayloadError('invalid-format', 'Scene data has an unknown engine');
  }

  const out: ScenePayload = { v: version, format, code: raw.code };
  if (typeof raw.prompt === 'string' && raw.prompt) out.prompt = raw.prompt;
  if (typeof raw.theme === 'string') out.theme = raw.theme;
  if (typeof raw.finish === 'string') out.finish = raw.finish;
  if (typeof raw.seed === 'number' && Number.isFinite(raw.seed)) out.seed = raw.seed;
  if (raw.look && typeof raw.look === 'object') {
    out.look = {
      timeOfDay: clamp01(Number((raw.look as SceneLook).timeOfDay) || 0),
      weather: (['clear', 'rain', 'snow'] as const).includes((raw.look as SceneLook).weather)
        ? (raw.look as SceneLook).weather
        : 'clear',
    };
  }
  return out;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/* ------------------------------------------------------------------ */
/* Comment stripping (opt-in)                                          */
/* ------------------------------------------------------------------ */

/**
 * Removes `//` and block comments while respecting string and template literals.
 * `scheme://` inside a string is preserved. Regex literals are not detected, so
 * this is only applied to generated scene code, never to arbitrary input.
 */
export function stripCodeComments(code: string): string {
  let out = '';
  let i = 0;
  let quote: string | null = null;

  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1];

    if (quote) {
      out += ch;
      if (ch === '\\') {
        out += next ?? '';
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      out += ch;
      i += 1;
      continue;
    }

    if (ch === '/' && next === '/') {
      const prev = out.trimEnd().slice(-1);
      if (prev === ':') {
        out += ch;
        i += 1;
        continue;
      }
      while (i < code.length && code[i] !== '\n') i += 1;
      continue;
    }

    if (ch === '/' && next === '*') {
      i += 2;
      while (i < code.length && !(code[i] === '*' && code[i + 1] === '/')) i += 1;
      i += 2;
      continue;
    }

    out += ch;
    i += 1;
  }

  return out;
}

/**
 * Whitespace-only compaction: drops comments, leading indentation, trailing
 * spaces and runs of blank lines. It never touches string contents, so the
 * scene behaves identically — it just reads denser.
 */
export function compactCode(code: string): string {
  return stripCodeComments(code)
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, '').replace(/^[ \t]+/, ''))
    .filter((line, index, all) => line.length > 0 || (index > 0 && all[index - 1].length > 0))
    .join('\n')
    .trim();
}

/* ------------------------------------------------------------------ */
/* Compression + base64url                                             */
/* ------------------------------------------------------------------ */

async function compress(bytes: Uint8Array): Promise<{ codec: Codec; data: Uint8Array }> {
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

async function decompress(codec: Codec, bytes: Uint8Array): Promise<Uint8Array> {
  if (codec === 'p') return bytes;
  if (typeof DecompressionStream === 'undefined') {
    throw new ScenePayloadError('unsupported-codec', 'This browser cannot read compressed links');
  }
  const format = codec === 'r' ? 'deflate-raw' : 'deflate';
  const stream = new Blob([toArrayBuffer(bytes)]).stream().pipeThrough(new DecompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlToBytes(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) throw new Error('invalid base64url');
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// src/lib/scene-payload.ts
var SCENE_PAYLOAD_VERSION = 1;
var MAX_ENCODED_CHARS = 3e5;
var MAX_CODE_CHARS = 2e5;
var SHARE_ROUTE_SOFT_LIMIT = 6e3;
var ScenePayloadError = class extends Error {
  reason;
  constructor(reason, message) {
    super(message);
    this.name = "ScenePayloadError";
    this.reason = reason;
  }
};
var FORMATS = ["svg", "worlds", "pixel", "dither"];
var CODECS = ["r", "d", "p"];
async function encodeScene(payload, options = {}) {
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
    throw new ScenePayloadError("too-large", "Scene is too large to share as a link");
  }
  return encoded;
}
async function decodeScene(encoded) {
  const value = (encoded || "").trim();
  if (!value) throw new ScenePayloadError("empty", "No scene data in this link");
  if (value.length > MAX_ENCODED_CHARS) {
    throw new ScenePayloadError("too-large", "Scene link is too large");
  }
  const codec = value[0];
  if (!CODECS.includes(codec)) {
    throw new ScenePayloadError("unsupported-codec", `Unknown payload codec "${value[0]}"`);
  }
  let bytes;
  try {
    bytes = base64UrlToBytes(value.slice(1));
  } catch {
    throw new ScenePayloadError("malformed", "Scene data is not valid base64url");
  }
  let json;
  try {
    json = new TextDecoder().decode(await decompress(codec, bytes));
  } catch {
    throw new ScenePayloadError("malformed", "Scene data could not be decompressed");
  }
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new ScenePayloadError("malformed", "Scene data is not valid JSON");
  }
  return validate(parsed);
}
function sceneSharePath(encoded) {
  return `#/s/${encoded}`;
}
function sceneShareUrl(encoded) {
  const path = sceneSharePath(encoded);
  if (typeof window === "undefined" || !window.location) return path;
  const { origin, pathname } = window.location;
  return `${origin}${pathname}${path}`;
}
function normalize(payload, strip, compact = false) {
  if (!payload || typeof payload.code !== "string" || !payload.code.trim()) {
    throw new ScenePayloadError("missing-code", "Scene code is required");
  }
  if (!FORMATS.includes(payload.format)) {
    throw new ScenePayloadError("invalid-format", `Unknown engine "${payload.format}"`);
  }
  const code = compact ? compactCode(payload.code) : strip ? stripCodeComments(payload.code) : payload.code;
  if (code.length > MAX_CODE_CHARS) {
    throw new ScenePayloadError("too-large", "Scene code exceeds the payload limit");
  }
  const out = { v: SCENE_PAYLOAD_VERSION, format: payload.format, code };
  if (payload.prompt) out.prompt = payload.prompt;
  if (payload.theme) out.theme = payload.theme;
  if (payload.finish) out.finish = payload.finish;
  if (payload.seed !== void 0) out.seed = payload.seed;
  if (payload.look) {
    out.look = {
      timeOfDay: clamp01(Number(payload.look.timeOfDay) || 0),
      weather: ["clear", "rain", "snow"].includes(payload.look.weather) ? payload.look.weather : "clear"
    };
  }
  return out;
}
function validate(value) {
  if (!value || typeof value !== "object") {
    throw new ScenePayloadError("malformed", "Scene data is not an object");
  }
  const raw = value;
  const version = Number(raw.v);
  if (!Number.isFinite(version) || version < 1) {
    throw new ScenePayloadError("malformed", "Scene data has no version");
  }
  if (version > SCENE_PAYLOAD_VERSION) {
    throw new ScenePayloadError(
      "unsupported-version",
      `This link was made with a newer Any3d (payload v${version})`
    );
  }
  if (typeof raw.code !== "string" || !raw.code.trim()) {
    throw new ScenePayloadError("missing-code", "Scene data has no code");
  }
  if (raw.code.length > MAX_CODE_CHARS) {
    throw new ScenePayloadError("too-large", "Scene code exceeds the payload limit");
  }
  const format = raw.format;
  if (!FORMATS.includes(format)) {
    throw new ScenePayloadError("invalid-format", "Scene data has an unknown engine");
  }
  const out = { v: version, format, code: raw.code };
  if (typeof raw.prompt === "string" && raw.prompt) out.prompt = raw.prompt;
  if (typeof raw.theme === "string") out.theme = raw.theme;
  if (typeof raw.finish === "string") out.finish = raw.finish;
  if (typeof raw.seed === "number" && Number.isFinite(raw.seed)) out.seed = raw.seed;
  if (raw.look && typeof raw.look === "object") {
    out.look = {
      timeOfDay: clamp01(Number(raw.look.timeOfDay) || 0),
      weather: ["clear", "rain", "snow"].includes(raw.look.weather) ? raw.look.weather : "clear"
    };
  }
  return out;
}
function toArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}
function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}
function stripCodeComments(code) {
  let out = "";
  let i = 0;
  let quote = null;
  while (i < code.length) {
    const ch = code[i];
    const next = code[i + 1];
    if (quote) {
      out += ch;
      if (ch === "\\") {
        out += next ?? "";
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      quote = ch;
      out += ch;
      i += 1;
      continue;
    }
    if (ch === "/" && next === "/") {
      const prev = out.trimEnd().slice(-1);
      if (prev === ":") {
        out += ch;
        i += 1;
        continue;
      }
      while (i < code.length && code[i] !== "\n") i += 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < code.length && !(code[i] === "*" && code[i + 1] === "/")) i += 1;
      i += 2;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}
function compactCode(code) {
  return stripCodeComments(code).split("\n").map((line) => line.replace(/[ \t]+$/, "").replace(/^[ \t]+/, "")).filter((line, index, all) => line.length > 0 || index > 0 && all[index - 1].length > 0).join("\n").trim();
}
async function compress(bytes) {
  for (const codec of ["r", "d"]) {
    const format = codec === "r" ? "deflate-raw" : "deflate";
    try {
      if (typeof CompressionStream === "undefined") break;
      const stream = new Blob([toArrayBuffer(bytes)]).stream().pipeThrough(new CompressionStream(format));
      const data = new Uint8Array(await new Response(stream).arrayBuffer());
      return { codec, data };
    } catch {
    }
  }
  return { codec: "p", data: bytes };
}
async function decompress(codec, bytes) {
  if (codec === "p") return bytes;
  if (typeof DecompressionStream === "undefined") {
    throw new ScenePayloadError("unsupported-codec", "This browser cannot read compressed links");
  }
  const format = codec === "r" ? "deflate-raw" : "deflate";
  const stream = new Blob([toArrayBuffer(bytes)]).stream().pipeThrough(new DecompressionStream(format));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
function bytesToBase64Url(bytes) {
  let binary = "";
  const chunk = 32768;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function base64UrlToBytes(value) {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) throw new Error("invalid base64url");
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - padded.length % 4) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
export {
  MAX_CODE_CHARS,
  MAX_ENCODED_CHARS,
  SCENE_PAYLOAD_VERSION,
  SHARE_ROUTE_SOFT_LIMIT,
  ScenePayloadError,
  base64UrlToBytes,
  bytesToBase64Url,
  compactCode,
  decodeScene,
  encodeScene,
  sceneSharePath,
  sceneShareUrl,
  stripCodeComments
};

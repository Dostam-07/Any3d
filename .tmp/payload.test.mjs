// scripts/test-scene-payload.ts
import fs from "node:fs";
import { transformSync } from "esbuild";
import path from "node:path";

// src/lib/scene-payload.ts
var SCENE_PAYLOAD_VERSION = 2;
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

// scripts/test-scene-payload.ts
var ROOT = process.cwd();
var PRESET_DIR = path.join(ROOT, "server", "presets");
var passed = 0;
var failures = [];
function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
  } else {
    failures.push(`${name}${detail ? ` \u2014 ${detail}` : ""}`);
  }
}
function collectPresets() {
  const out = [];
  for (const dir of fs.readdirSync(PRESET_DIR)) {
    const abs = path.join(PRESET_DIR, dir);
    if (!fs.statSync(abs).isDirectory()) continue;
    for (const file of fs.readdirSync(abs)) {
      if (!file.endsWith(".js")) continue;
      out.push({
        file: `${dir}/${file}`,
        format: dir,
        code: fs.readFileSync(path.join(abs, file), "utf8")
      });
    }
  }
  return out;
}
async function expectReject(name, encoded, reason) {
  try {
    await decodeScene(encoded);
    check(name, false, "expected a rejection, got a payload");
  } catch (err) {
    const ok = err instanceof ScenePayloadError && err.reason === reason;
    check(name, ok, err instanceof Error ? err.message : String(err));
  }
}
async function main() {
  const presets = collectPresets();
  check("found 44 presets", presets.length === 44, `found ${presets.length}`);
  let maxEncoded = 0;
  let maxEncodedFile = "";
  let largestCode = 0;
  let largestFile = "";
  let totalRatio = 0;
  for (const preset of presets) {
    const payload = {
      v: SCENE_PAYLOAD_VERSION,
      format: preset.format,
      code: preset.code,
      prompt: `preset ${preset.file}`,
      theme: "toy"
    };
    const encoded = await encodeScene(payload);
    const decoded = await decodeScene(encoded);
    check(`round-trip code ${preset.file}`, decoded.code === preset.code);
    check(`round-trip format ${preset.file}`, decoded.format === preset.format);
    check(`round-trip prompt ${preset.file}`, decoded.prompt === payload.prompt);
    const looked = await encodeScene({
      v: SCENE_PAYLOAD_VERSION,
      format: preset.format,
      code: preset.code,
      look: { timeOfDay: 0.72, weather: "rain" },
      seed: 4242
    });
    const lookedDecoded = await decodeScene(looked);
    check(`look round-trip timeOfDay ${preset.file}`, lookedDecoded.look?.timeOfDay === 0.72, `${lookedDecoded.look?.timeOfDay}`);
    check(`look round-trip weather ${preset.file}`, lookedDecoded.look?.weather === "rain", `${lookedDecoded.look?.weather}`);
    check(`seed round-trip ${preset.file}`, lookedDecoded.seed === 4242, `${lookedDecoded.seed}`);
    check(`no padding ${preset.file}`, !/[=+/]/.test(encoded), "base64url must be padding-free");
    if (/[^A-Za-z0-9_-]/.test(encoded)) {
      check(`url-safe ${preset.file}`, false, "encoded payload contains non-url characters");
    }
    try {
      transformSync(compactCode(preset.code), { loader: "js" });
      check(`compacted scene still parses ${preset.file}`, true);
    } catch (err) {
      check(`compacted scene still parses ${preset.file}`, false, String(err));
    }
    const ratio = encoded.length / preset.code.length;
    totalRatio += ratio;
    if (encoded.length > maxEncoded) {
      maxEncoded = encoded.length;
      maxEncodedFile = preset.file;
    }
    if (preset.code.length > largestCode) {
      largestCode = preset.code.length;
      largestFile = preset.file;
    }
  }
  const shareSample = presets.find((p) => p.file === "svg/cafe") || presets[0];
  const shareEncoded = await encodeScene(
    { v: SCENE_PAYLOAD_VERSION, format: shareSample.format, code: shareSample.code },
    { compact: true }
  );
  const shareRoute = sceneSharePath(shareEncoded).length;
  check(
    "share route under soft limit",
    shareRoute < SHARE_ROUTE_SOFT_LIMIT,
    `${shareRoute} chars for ${shareSample.code.length} bytes of code`
  );
  const routes = [];
  for (const preset of presets) {
    const enc = await encodeScene(
      { v: SCENE_PAYLOAD_VERSION, format: preset.format, code: preset.code },
      { compact: true }
    );
    routes.push(sceneSharePath(enc).length);
  }
  routes.sort((a, b) => a - b);
  const p50 = routes[Math.floor(routes.length * 0.5)];
  const p90 = routes[Math.floor(routes.length * 0.9)];
  const p95 = routes[Math.floor(routes.length * 0.95)];
  check("median share route under 3.2 KB", p50 < 3200, `${p50} chars`);
  check("p95 share route under soft limit", p95 < SHARE_ROUTE_SOFT_LIMIT, `${p95} chars`);
  const plainJson = JSON.stringify({ v: 1, format: "svg", code: "export default 1;\n" });
  const plainEncoded = `p${bytesToBase64Url(new TextEncoder().encode(plainJson))}`;
  const plainDecoded = await decodeScene(plainEncoded);
  check("plain codec decodes", plainDecoded.code === "export default 1;\n");
  await expectReject("rejects empty", "", "empty");
  await expectReject("rejects unknown codec", "zzzz", "unsupported-codec");
  await expectReject("rejects bad base64", "r!!!!", "malformed");
  await expectReject(
    "rejects future version",
    `p${bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ v: 99, format: "svg", code: "x" })))}`,
    "unsupported-version"
  );
  await expectReject(
    "rejects missing code",
    `p${bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ v: 1, format: "svg", code: "  " })))}`,
    "missing-code"
  );
  await expectReject(
    "rejects unknown engine",
    `p${bytesToBase64Url(new TextEncoder().encode(JSON.stringify({ v: 1, format: "voxel", code: "x" })))}`,
    "invalid-format"
  );
  const sample = [
    "// leading comment",
    'const url = "https://example.com/a//b";',
    "const tpl = `line // not a comment`;",
    "/* block",
    "   comment */",
    "const keep = 1; // trailing"
  ].join("\n");
  const stripped = stripCodeComments(sample);
  check("strips line comments", !stripped.includes("leading comment"));
  check("strips trailing comments", !stripped.includes("trailing"));
  check("strips block comments", !stripped.includes("block"));
  check("keeps urls in strings", stripped.includes("https://example.com/a//b"));
  check("keeps template literals", stripped.includes("line // not a comment"));
  check("keeps real code", stripped.includes("const keep = 1;"));
  const avgRatio = totalRatio / presets.length;
  console.log("");
  console.log(`presets round-tripped : ${presets.length}`);
  console.log(`largest preset        : ${largestFile} (${largestCode} B code)`);
  console.log(`largest payload       : ${maxEncoded} chars (${maxEncodedFile})`);
  console.log(`compression ratio     : ${(avgRatio * 100).toFixed(1)}% of raw code`);
  console.log(`share route sample    : ${sceneSharePath(shareEncoded).length} chars`);
  console.log(`assertions            : ${passed} passed, ${failures.length} failed`);
  if (failures.length) {
    console.log("");
    for (const failure of failures) console.log(`  FAIL  ${failure}`);
    process.exitCode = 1;
  }
}
main().catch((err) => {
  console.error("test run crashed:", err);
  process.exitCode = 1;
});

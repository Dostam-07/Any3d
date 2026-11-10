# Scene payload

The portable form of a scene: everything needed to reopen exactly what the user was looking at, small enough to live in a URL.

Source: [`src/lib/scene-payload.ts`](../../src/lib/scene-payload.ts)

---

## Shape

```ts
interface ScenePayload {
  v: 1;                       // format version
  format: 'svg' | 'worlds' | 'pixel' | 'dither';
  code: string;               // the scene source
  prompt?: string;            // what produced it, shown in the transcript
  theme?: SVGTheme;           // toy | soft | mono | line | night | print
  finish?: WorldFinish;       // miniature | pixel | halftone | blueprint
  look?: { timeOfDay: number; weather: 'clear' | 'rain' | 'snow' };
  seed?: number;
}
```

`look` and `seed` are carried from day one so Phase 3 (atmosphere) and Phase 4 (seed lock) don't need a format migration. They are optional and ignored by current renderers.

## Envelope

```
<codec><base64url(utf8(json))>
```

| Codec | Meaning | When chosen |
|---|---|---|
| `r` | `deflate-raw` | Default on Chrome/Edge/Safari 16.4+ and Node 18+ |
| `d` | `deflate` | Fallback when `deflate-raw` is unavailable |
| `p` | none | No `CompressionStream` in the runtime |

The codec is a single leading character so the decoder never guesses. Payloads are padding-free and URL-safe (`A–Z a–z 0–9 - _`), which is why they can sit in a hash route without escaping.

## API

```ts
encodeScene(payload, { stripComments?, compact? }): Promise<string>
decodeScene(encoded): Promise<ScenePayload>          // throws ScenePayloadError
sceneSharePath(encoded): string                       // "#/s/<payload>"
sceneShareUrl(encoded): string                        // absolute, browser only
stripCodeComments(code): string
compactCode(code): string
```

`ScenePayloadError.reason` is one of `empty | too-large | malformed | unsupported-version | invalid-format | unsupported-codec | missing-code`, so the UI can show a specific message instead of a generic failure.

**Encoding is lossless by default.** `stripComments` and `compact` are opt-in and only appropriate for share links, where the exact byte layout of a comment doesn't matter.

## Measured size

Deflate already removes whitespace redundancy, so compaction buys less than intuition suggests. Numbers from the 44 presets (`npm run test:payload`):

| Scene | Code | Payload | Share route |
|---|---|---|---|
| median preset | — | — | ~2.9 KB |
| `svg/cafe` | 6.8 KB | 2.9 KB | 2.9 KB |
| `svg/powder` (largest) | 17.3 KB | 8.1 KB | 8.1 KB |

`SHARE_ROUTE_SOFT_LIMIT = 6000`. Above that, offer the scene as a file rather than a link, because chat clients truncate long URLs.

## Route

`#/s/<payload>` is parsed by [`src/lib/router.ts`](../../src/lib/router.ts) into `{ view: 'shared', share }`. On load the app decodes the payload, opens it as an **unsaved** project, and only materialises a local session when the recipient sends their first message — so a link can never overwrite someone's existing work.

## Security note — read before publishing links

A payload is executable JavaScript. Today the preview iframe uses `srcDoc` without a `sandbox` attribute, so scene code runs **same-origin** and can reach the app's `localStorage` (which holds the Gemini API key) — and `PNG`/`GLB` export depends on that same-origin access.

That is acceptable for scenes generated locally by the user's own model, which is why opening a link is gated:

**Trust gate.** `#/s/<payload>` never auto-opens. The page shows "Open shared scene?" with the payload size and requires an explicit Open click before any scene code is decoded or bundled.

**Still open (Phase 1b).** The iframe itself remains same-origin, so a shared scene that the user does open can read `localStorage` — including the Gemini key. Sandboxing it (`sandbox="allow-scripts"`) is the fix, but PNG and GLB export currently read the scene graph through `contentDocument`/`contentWindow`, so both must move inside the bundle first. Until then: open links from people you trust.

## Testing

```bash
npm run test:payload
```

182 assertions: lossless round-trip for all 44 presets, url-safe alphabet, size percentiles, plain-codec fallback, six rejection paths, comment stripping that respects strings/template literals, and an esbuild parse of every compacted scene to prove compaction never breaks syntax.

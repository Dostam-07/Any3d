# Image → palette (Phase 6)

Source: `server/index.js` (`/api/extract-palette`), `src/lib/api.ts` (`extractPaletteApi`), `src/components/PaletteFromPhoto.tsx`.

## What it does

Upload a JPEG, PNG, or WebP reference photo up to 6 MB. Gemini vision or an Ollama vision model extracts a colour and light key (palette, horizon, light azimuth/elevation, mood, description). The descriptor is folded into the next prompt so the scene is painted in that key, and the Phase 3 look is set from the estimated light elevation.

## Endpoint

`POST /api/extract-palette` — body `{ image (base64), mimeType, provider, apiKey, ollamaHost, model }`. Returns `{ palette: string[], horizon, lightAz, lightEl, mood, description }`. Gemini requires a key; Ollama requires a model that supports image inputs. Unsupported MIME types, malformed base64 and images over 6 MB are rejected.

## Client

`PaletteFromPhoto` component: file input, thumbnail preview, swatch strip, apply button. Wired into the Studio toolbar and the Project page composer. The "Apply to prompt" action appends the descriptor to the composer and calls `onApplyLook`.

## Limitations

The palette and lighting are currently passed through the prompt text rather than as structured scene fields. Ollama vision availability depends on the selected model supporting image inputs.
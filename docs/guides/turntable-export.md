# Turntable clip export (Phase 2)

Source: `src/lib/turntable.ts`, `src/components/ClipControl.tsx`, `core/templates/*-bench.html`.

## What it does

Records a short looping clip of the live scene and downloads it as WebM or GIF. SVG scenes are serialised frame-by-frame and rasterised at the target pixel size; canvas engines (Worlds / Pixel / Dither) use `MediaRecorder` over the live canvas.

## Entry points

- `canRecordScene()` — feature probe (MediaRecorder + canvas capture support).
- `recordSceneFromIframe(frame, options)` — drives the recording; returns a `TurntableResult` with a blob, duration and extension.
- `saveClip(blob, name, extension)` — triggers the download.

## Options

`TurntableOptions`: `format` (`webm` | `gif`), `aspect` (`square` | `wide` | `tall`), `duration` (seconds), `fps`. The stage is fixed at 1080×1080 square for the export; the aspect crops the capture canvas.

## Determinism

Recording uses `ctx.step` (deterministic time stepping) so the same scene + options produce the same frames. SVG frames are rasterised through an `<img>` + blob URL (not `createImageBitmap`, which fails on SVG blobs in this Chromium).

## Guard

An 8 MB guard aborts oversized captures. `scripts/verify-clip.mjs` exercises the full path.
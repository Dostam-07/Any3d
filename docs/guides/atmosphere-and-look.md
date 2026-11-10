# Atmosphere and look (Phase 3)

Source: `src/lib/look.ts`, `core/kernels/any3d-svg.js` (keyframes), `core/templates/svg-bench.html`.

## What it does

A single `timeOfDay` (0–1) plus `weather` (`clear` | `rain` | `snow`) drives a continuous keyframe grade: sun azimuth/elevation, sky gradient, lamp emission, particle weather. Noon (1/3) is the identity keyframe — it reproduces the scene exactly as built.

## Client state

`SceneLook = { timeOfDay, weather }`. `DEFAULT_LOOK = { timeOfDay: 1/3, weather: 'clear' }`. Helpers: `clampLookTime`, `nearestStop`, `stopAt`, `normalizeLook`, `lookLabel`, `isDefaultLook`.

## Four snap points

Dawn (0), Noon (1/3), Dusk (2/3), Night (1). `LOOK_CHIPS` adds "Golden hour" (0.72) and "Blue hour" (0.84).

## Baking

`bundleCode(code, format, look)` bakes the look into the exported HTML via `bundleSVG(code, look)` so a scene shared at dusk reopens at dusk. The look also rides in the scene payload (`ScenePayload.look`).

## Cache key

`LOOK_KEYS` is part of the painter cache key, so changing the look repaints correctly. `ctx.setLook` applies a live change without a re-mount.

## Status

SVG only. Worlds / Pixel / Dither keep their camera and lighting inside their engines; atmosphere there is future work. `scripts/verify-look.mjs` passes (noon→night luma −20.5%, 0 `/api/bundle` calls during scrub, 6.7 ms avg repaint).
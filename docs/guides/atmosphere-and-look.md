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

## Camera

The camera the user frames in the stage travels with an export the same way the
look does, and through the same call: `bundleCode(code, format, look, camera)`
→ `POST /api/bundle { code, format, look, camera }` → `bundleScene(code, format,
look, camera)`.

`CameraPick` (`src/lib/camera.ts`) is one of two shapes:

| Pick | Meaning |
| --- | --- |
| `{ reset: true }` | the angle the scene was authored for — an SVG figure's camera is part of its art, so this is what `Isometric View` sends |
| `{ az, el }` | an explicit orbit in degrees; `az` is wrapped into `0–359.9`, `el` clamped to `-90–90` |

`CAMERA_PRESETS` holds the four toolbar angles (`iso`, `top` 0/85, `front`
0/15, `side` 85/20). `sanitizeCamera` keeps a stored or shared pick usable: a
non-finite angle becomes `null`, so a bad payload reaches neither `setCamera`
nor the export.

Baking: `bundleSVG` writes `window.__any3dCamera = {...}` (the bench reads it
before the kernel, and `?camera=` still wins), `bundleWorlds` writes
`const initialCamera = {...}` and applies it right after `initialLook`. A pixel
export has no camera, so the bundle is byte-identical whether or not one is
given. `ScenePayload.camera` carries the pick in a share link, so a link made
from a top-down view opens top-down.

`scripts/verify-export-camera.mjs` (11 checks, in CI) proves it: the same
preset exported at `top` differs from the authored angle by a mean pixel delta
of 27 (SVG) and 30 (worlds), `reset` matches an un-cameraed export to within
0.2, an unusable pick is dropped and still exports a file that renders, and the
pixel bundle is identical either way.

## Cache key

`LOOK_KEYS` is part of the painter cache key, so changing the look repaints correctly. `ctx.setLook` applies a live change without a re-mount.

## Status

Every engine honours the look: the SVG painter grades its fills from keyframes, the
pixel kernel tints its palette, and the world runtime maps `timeOfDay` onto a light
and sky profile (`worldLook`) on mount and on every `look` message. `bundleCode(code,
format, look, camera)` bakes it into exports and share links, and every studio
rebuild — preset load, project restore, format switch, generation — now passes the
same pair, so the first frame is already the one the controls describe.

`scripts/verify-look.mjs` passes (noon→night luma −20.9%: 0.54 → 0.427, 0
`/api/bundle` calls during scrub, 5.7 ms avg repaint, p95 8.9 ms). It opens the look
popover itself and honours `A3D_URL`.

The README keeps a dusk set beside the noon one (`docs/assets/showcase/dusk/`),
shot through this control with `A3D_LOOK=dusk`. `npm run verify:dusk` compares each
dusk still with its noon twin on a luminance grid, so a look that stops reaching the
picture fails the build instead of shipping a noon screenshot under a dusk name.

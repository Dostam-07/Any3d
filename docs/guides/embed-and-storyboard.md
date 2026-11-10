# Embed snippet and storyboard sheet (Phase 5)

Source: `public/embed.js`, `src/lib/storyboard.ts`, `src/components/StoryboardControl.tsx`, `core/templates/svg-bench.html`.

## Embed snippet

`public/embed.js` (1.3 KB gzipped) scans `script[data-src]`, builds a responsive `aspect-ratio` container and a lazy iframe pointing at the bundle with `?embed=1`. Forwards `prefers-reduced-motion` as `?motion=none` and reloads once when the preference changes. A plain iframe `src` is deliberate: no fetch, no module loading, works from `file://`.

The bundle template is chrome-less by construction: `.head`, `.means`, `.foot` are hidden, background transparent, no padding. Reduced motion: `?motion=none`, the OS preference via `matchMedia`, or a still frame all mount reduced; `window.__any3dMotion` records which.

## Storyboard sheet

Four camera angles taken from the figure's own `camera` option, each re-mounted and serialised, composited 2×2 at **2400×1350** with the scene name burned in. SVG-only (canvas engines keep their camera in Three.js; the button is disabled there with a reason). The live scene is remounted afterwards. `StoryboardControl.tsx` mirrors `ClipControl.tsx`.

## Acceptance

- Embed adds under 15 KB gzipped and respects prefers-reduced-motion. (Measured: 1,355 bytes.)
- Storyboard exports at 2400×1350 with the scene name burned in. (Measured: 2400×1350, name-band luminance diff 235.)
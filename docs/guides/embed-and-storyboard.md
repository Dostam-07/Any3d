# Embed snippet and storyboard sheet (Phase 5)

Source: `public/embed.js`, `src/lib/storyboard.ts`, `src/components/StoryboardControl.tsx`, `core/templates/svg-bench.html`.

## Embed snippet

`public/embed.js` (1.3 KB gzipped) scans `script[data-src]`, builds a responsive `aspect-ratio` container and a lazy iframe pointing at the bundle with `?embed=1`. Forwards `prefers-reduced-motion` as `?motion=none` and reloads once when the preference changes. A plain iframe `src` is deliberate: no fetch, no module loading, works from `file://`.

The bundle template is chrome-less by construction: `.head`, `.means`, `.foot` are hidden, background transparent, no padding. Reduced motion: `?motion=none`, the OS preference via `matchMedia`, or a still frame all mount reduced; `window.__any3dMotion` records which.

## Storyboard sheet

Four camera angles each re-mounted inside the preview and serialised, composited 2×2 at **2400×1350** with the scene name burned in. The sheet follows the frame the user set up:

- **Presentation:** every tile is mounted at the size the user chose (hero 16:9 or card 4:3), so the sheet shows the framing on screen rather than the figure's default.
- **Camera:** with no pick the classic set is used (*Isometric · Front · Side · Plan*). Once the user picks an angle, `storyboardAngles` leads with **Your angle**, turns it ±45°, and closes from the other side of the horizon (*Lower angle* or *Higher angle*). Azimuth wraps into 0–360, elevation clamps to 2–89, and a set that would repeat an angle falls back to the classic four.
- **Labels:** the labels burned into the tiles are the labels of the angles that were rendered.
- **The mount matters:** the stage already holds the preview's own `<svg>`, and a destroyed mount can linger, so each tile is rasterised from the *newest* svg. Picking the first one rasterised a stale mount.

The control lives in three places: the project page header next to the clip button, the same
page's "more actions" menu on a narrow screen (`variant="menu"` renders a full-width row
instead of a chip), and the studio hub's stage toolbar. The project page is where a user
works on a scene, so that is where the sheet has to be reachable.
studio hub's stage toolbar. The project page is where a user works on a scene, so that is where
the sheet has to be reachable.

`scripts/test-storyboard.ts` covers the angle set (16 checks) and `scripts/verify-storyboard.mjs` drives the real project page (20 checks: 2400×1350 PNG, four labelled tiles, the picked angle leads, tile 1 ≠ tile 4, and the sheet's picture changes with the pick (mean Δ 24–25) and with the presentation size (mean Δ 20)). It also drives a 414×900 phone: the chips are hidden there, the sheet is built from the
"more actions" menu, and the preview arrives through the phone's own Preview tab — which
only works because a reopened project rebuilds its bundle (see below).

SVG-only (canvas engines keep their camera in Three.js; the button is disabled there with a reason). The live scene is remounted afterwards. `StoryboardControl.tsx` mirrors `ClipControl.tsx`.

## Acceptance

- Embed adds under 15 KB gzipped and respects prefers-reduced-motion. (Measured: 1,355 bytes.)
- Storyboard exports at 2400×1350 with the scene name burned in. (Measured: 2400×1350, name-band luminance diff 235.)
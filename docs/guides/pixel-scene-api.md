# Scene API

A scene is one call, `Pixel.scene({ … })`, in a plain script (no module, no import). The kernel is a global `Pixel` defined by `kit/pixel.js`; the page mounts the last declared scene.

## The declaration

| Field | Meaning |
| --- | --- |
| `name` | lowercase-hyphen, the file and page name (`pixel-<name>.html`) |
| `title` | shown under the stage and as the page title |
| `means` | one sentence, at most 140 characters, what the scene shows and what moves |
| `hint` | one line: what to hover and what to tap. `look.mjs` presses the hot group named after "tap", "press" or "click" |
| `width`, `height` | internal resolution, default 320 x 240, at most 480 x 360 |
| `duration` | seconds in the loop; `ctx.q` runs 0..1 over it, and textures (water) loop on it |
| `still` | the second shown for reduced motion, thumbnails and the first frame |
| `fps` | frame cap, default 24 (pixel art moves in steps; 0 means every display frame) |
| `camera` | `{ az: 45, el: 30, height, scale, target }`: az/el in degrees (30 is the 2:1 pixel isometric), `height` the tallest thing so the fit leaves it room, `scale` pixels per unit if you want to fix it |
| `sun` | `{ az: -40, el: 48, ambient: .34 }`: where the light comes from, and how light the shade is |
| `outline` | default true: a solid pixel against something far behind it steps one shade darker |
| `ground` | `{ rx, rz, wobble: .3, fade: .45, zone(x, z, P) }`: an ellipse of radii rx, rz, its edge warped by noise (`wobble`) and dissolved over `fade` units; `zone` returns the material key of the ground at x, z |
| `materials` | `{ key: material }` named materials for this scene |
| `build(P)` | builds the scene once; returns `parts` (anything tick needs) with `parts.hot`, the groups the pointer may pick, each with a `.name` |
| `tick(ctx)` | poses the parts every frame from absolute time |

Units: a person is about 1.15 tall at the default `h` 1.3. A ground of rx 4.3, rz 3.6 fills the 320 x 240 frame.

## P, the toolkit

Primitives are convex solids centred on x, y, z unless noted, added to `parent` (or the root):

- `P.group(x, y, z, parent)`: a node. Every node has `.position`, `.rotation` (radians; applied yaw, then pitch, then roll), `.scale` (each with `.set(x, y, z)`), `.visible`, `.name` and `.worldPoint(x, y, z)`.
- `P.box(w, h, d, mat, x, y, z, parent)`
- `P.cyl(rTop, rBottom, h, mat, x, y, z, parent, seg = 10)`
- `P.cone(r, h, mat, x, y, z, parent, seg)`
- `P.ball(r, mat, x, y, z, parent, seg = 8)`
- `P.wedge(w, h, d, mat, x, y, z, parent)`: a gable along x whose base sits on y (a roof)
- `P.line(points, mat, parent)`: a 1 px polyline, `[[x, y, z], …]`; set `node.line = [...]` in tick to move it (fishing lines, ropes)
- `P.update()`: composes every world matrix now, so tick can read `node.worldPoint(…)` after posing parents
- `P.person(x, z, parent, { shirt, pants, skin, hair, hat, shoes, sleeve, bare, yaw, h = 1.3 })` returns `{ root, hips, body, head, armL, armR, elbowL, elbowR, handL, handR, legL, legR, kneeL, kneeR }`. Every joint is a group to rotate; children of `handR` move with the hand (a rod, a can, a bag). Sleeves default a shade darker than the shirt so the arms separate from the body.
- `P.pose(person, name, amount = 1)`: sets every joint for `stand`, `work` (forearms forward at a bench), `hold` (something held in front of the chest), `carry` (one forearm up), `sit` (on an edge; hips lower, thighs forward, shins down) or `wave`. Call it first in tick, then add the motion on top.
- `P.tree(x, z, parent, { r, h, clusters, mat, trunk, yaw, seed })`: a trunk and a crown of round-shaded leaf clumps.
- `P.bush(x, z, parent, { r, clusters, mat, flowers })`: a low clump; `flowers` is a hex for small blossoms.
- Motion: `P.phase(t, period, offset)` 0..1 sawtooth, `P.wave(t, period, offset)` −1..1, `P.pulse(t, period, width)` a bump, `P.smooth`, `P.lerp`, `P.clamp`, `P.TAU`.
- Noise: `P.noise(x, y)`, `P.fbm(x, y)`, `P.hash(x, y)`, the same functions the textures use (for ground zones and stable variety).

## Materials

`mat` is one of:

- a key: `'grass'`, `'paving'`, `'water'`, `'sand'`, `'dirt'` (ground), `'wood'`, `'darkwood'`, `'thatch'`, `'stone'`, `'leaf'`, `'leafLight'`, `'cloth'`, `'canvas'`, or one from `materials`;
- a hex colour: a plain material with a five-step ramp made from it, shadows shifted toward cool violet and lights toward warm cream;
- an object: `{ color | ramp, tex, grain, plank, size, stripe, alt, rough, dither, glow, round, flat, ground, water }`
  - `ramp`: a key of `Pixel.RAMPS` or 4–6 hex colours from dark to light
  - `tex`: `plain`, `wood` (planks of width `plank` along `grain`), `thatch` (streaks in rows), `stone` (coursed blocks of `size`), `paving` (running bond of `size`, ground), `grass`, `dirt`, `sand`, `water`, `leaf`, `cloth`
  - `grain`: `'x'`, `'y'` or `'z'`, the axis planks and streaks run along
  - `stripe`, `alt`: stripes of width `stripe` alternating with the ramp `alt` (an awning, a flag)
  - `dither`: 0..1 how far the Bayer spread reaches (textured default 1, plain .55)
  - `glow`: a floor on the light (0..1) for lamps and ripples; `round`: shade from the solid's centre (leaf clumps); `ground` / `water`: ground materials (water sparkles)

## ctx, the tick context

`ctx.t` seconds, `ctx.q` 0..1 through the loop, `ctx.dt`, `ctx.parts`, `ctx.P`, and the pointer:

- `ctx.hover`: the hot group under the pointer, or null. The kernel lights it one shade; lift or nudge it in tick if the story wants.
- `ctx.pressed`, `ctx.pressedAt`: the hot group under the last press and the second it happened. A tap is how a phone answers, so give the scene one press (a wave, a strike, a pour) that runs for a second or two from `ctx.pressedAt`.
- `ctx.active`: a hot group switched on by a press until pressed again.
- `ctx.pointer`: `{ x, y }` in −1..1 over the canvas, `inside`.
- `ctx.read`: set a short line (at most 40 characters) saying what is happening now (`'float · a nibble'`). The page shows the hovered group's name, or else this line.

Rules: assign every animated value from `ctx.t` / `ctx.q`, never accumulate; no timers, no `Math.random`, no new solids in tick (toggle `.visible` instead).

## Runtime and embedding

`Pixel.mount(spec, canvas, { still, reduced, onRead })` returns `{ renderAt(t), start(), stop(), setCap(fps), hoverAt(x, y), tap(x, y), stats(), destroy(), parts, ctx }`. The loop renders at the cap, pauses offscreen and in a hidden tab, and holds the still frame under `prefers-reduced-motion`.

Plain page: a `<canvas>` with `image-rendering: pixelated`, `<script>` with the kernel, `<script>` with the scene, then `Pixel.mount(Pixel.scenes.at(-1), canvas)`. Enlarge the canvas by a whole number (`width: 960px` for 320) so every pixel is the same size.

React or Next.js (client component; put `kit/pixel.js` and the scene in `public/`):

```tsx
'use client';
import { useEffect, useRef } from 'react';

export function PixelScene({ src }: { src: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const load = (url: string) => new Promise<void>((ok, fail) => {
      const s = document.createElement('script'); s.src = url; s.onload = () => ok(); s.onerror = fail; document.head.appendChild(s);
    });
    /* the scripts load asynchronously: if the component unmounts first (or StrictMode mounts twice), never mount after cleanup */
    let cancelled = false;
    let rt: { destroy(): void } | undefined;
    (async () => {
      const w = window as unknown as { Pixel?: any };
      if (!w.Pixel) await load('/pixel/pixel.js');
      await load(src);
      if (cancelled || !ref.current) return;
      rt = w.Pixel.mount(w.Pixel.scenes.at(-1), ref.current);
    })();
    return () => { cancelled = true; rt?.destroy(); rt = undefined; };
  }, [src]);
  return <canvas ref={ref} style={{ width: '100%', imageRendering: 'pixelated' }} />;
}
```

The simplest embed of all is the built page in an `<iframe>`: it is self-contained and about 50 KB.

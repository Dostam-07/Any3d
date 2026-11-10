# Embedding a any3d

The built page is one HTML file: the kernel, the figure, and the bench's own mount code. The kernel draws SVG, so there is nothing to load: no three.js, no WebGL, no canvas. For a product, keep the figure and the kernel, drop the bench.

## Any page

```html
<div id="hero" style="width:100%"></div>
<script src="/any3d/kit/any3d.js"></script>
<script src="/any3d/warehouse.js"></script>
<script>
  var fig = Any3d.figures[Any3d.figures.length - 1];
  var ctx = Any3d.mount(fig, { el: document.getElementById('hero') });
  // later: ctx.destroy();
</script>
```

The kernel puts an `<svg>` in the element, sizes it to the element's width and the figure's aspect, watches resizes, sleeps offscreen, and honours `prefers-reduced-motion`. Pass `{ theme: 'night' }` or `{ theme: { base: 'mono', accent: '#5b4ae0' } }` to `mount` to draw the same figure in another theme, for a dark mode or a brand: remount on change (`ctx.destroy()`, then `mount` again). Give the element a width; the kernel sets its height. For a mini in an empty state, a 200px-wide element above the heading is the usual place; the drawing has no background, so the card's shows through, and the base's soft shadow lands on it.

`{ theme: { accent: '#5b4ae0' } }` recolours the subject (every figure paints it with `pal.accent`) and is all a brand needs; `{ theme: { halo: 0 } }` drops the base's shadow when the host card draws its own; `{ theme: { base: 'line', wobble: 1.4 } }` draws the figure by hand; `{ theme: 'print' }` is flat tones with ink. `ctx.read` holds the scene's own line (`'truck · at the dock'`) for a caption the host renders; `ctx.hover`, `ctx.pressed` and `ctx.active` tell the host what the visitor is on, pressed and switched on. Taps work on touch: the drawing keeps `touch-action: pan-y`, so the page still scrolls. The kernel gives the element `role="img"` and an `aria-label` from the title and the means unless it already has one.

Because it is SVG, the page's CSS reaches it: `#hero svg { filter: … }`, a `mix-blend-mode`, a print stylesheet, all work; and the still frame can be saved from the page as a vector (serialise `ctx.svg`).

## React or Next.js

Copy `kit/any3d.js` and the figure into the project (for example `components/any3d/`). Nothing to install.

```tsx
"use client";
import { useEffect, useRef } from "react";
import Any3d from "./any3d.js";
import "./warehouse.js"; // registers the figure in Any3d.figures

export function Hero() {
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fig = Any3d.figures[Any3d.figures.length - 1];
    const ctx = Any3d.mount(fig, { el: el.current! });
    return () => ctx.destroy();
  }, []);
  return <div ref={el} style={{ width: "100%" }} />;
}
```

Notes:

- The kernel's `module.exports` line makes `import Any3d from "./any3d.js"` work under bundlers; with plain `<script>` tags it sets `window.Any3d`.
- A figure file ends with `Any3d.figure({ … })`, which needs `Any3d` in scope. In a bundler, change its first line to `import Any3d from "./any3d.js";` or wrap it as `export default (Any3d) => Any3d.figure({ … })` and call it in the effect. Nothing else in the figure changes.
- Server rendering: render the `<div>` empty with a fixed aspect ratio (`aspectRatio: "3 / 2"`, `"4 / 3"` or `"1"`) so nothing shifts when the drawing mounts.
- One drawing per any3d. Several on one page are fine; each sleeps when offscreen.
- The figure's `title` and `means` are yours to render as React text next to the stage, along with any heading or button your UI needs; the kernel never writes words. Read `ctx.read` in your own loop (or on hover) for a live caption. Set `aria-hidden` on the element instead when the words beside it already say it all.

## Shipping the page itself

For a blog or a static site, `any3d-<name>.html` can be served as is, or embedded in an `<iframe>` at the stage's aspect. It is a single file with no network request: the kernel, the figure and the bench, 30 to 35 KB gzip.

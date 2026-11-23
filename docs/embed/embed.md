# Any3d embed — one script tag, one scene, no chrome

**Audience:** anyone who wants to drop a built Any3d scene onto an external page (blog, docs, marketing site).  
**Status:** published (Phase 1, Track A4). The loader is `docs/embed/embed.js`, a copy of the sandboxed `public/embed.js`.

---

## What it does

The scene bundle is a self-contained HTML file, so the loader only has to place an `<iframe>` pointing at it with `?embed=1`. A plain iframe `src` keeps working from `file://` — no fetch, no CORS, no module loading — which is how most people first try an embed.

- `prefers-reduced-motion` is forwarded as `?motion=none`, so the scene mounts still instead of animating.
- The frame reloads once when the preference changes.
- The iframe runs `sandbox="allow-scripts"` **without** `allow-same-origin`, so an embedded scene cannot read the host page's origin or `localStorage`. It can still answer the pointer, switch theme/accent/still/look over `postMessage`, and export a PNG from inside the bundle.

---

## Quick start

1. Build a scene in Any3d Studio and **Export HTML** → you get `my-scene.html`.
2. Host `my-scene.html` anywhere (it is 100% self-contained, no network at runtime).
3. Copy `docs/embed/embed.js` to your site.
4. Add one script tag:

```html
<script src="/path/to/embed.js"
        data-src="https://your.site/scenes/my-scene.html"
        data-ratio="4 / 3"
        data-title="Corner coffee cart">
</script>
```

The loader mounts an iframe sized to `data-ratio` (default `4 / 3`) with `data-radius` (default `14px`) and `data-bg` (default `#0c0e17`).

### Attributes

| Attribute | Default | Meaning |
|---|---|---|
| `data-src` | *(required)* | URL or path to the self-contained scene bundle HTML |
| `data-ratio` | `4 / 3` | CSS `aspect-ratio` of the embed wrapper |
| `data-radius` | `14px` | Border radius of the embed wrapper |
| `data-bg` | `#0c0e17` | Background colour of the embed wrapper |
| `data-title` | `Any3d scene` | `<iframe title>` |

## Demo

Open `docs/embed/demo.html` in a browser. It loads `scene.html` (an SVG airport figure) through the same loader. The demo also works from `file://` (double-click the file) because the loader never fetches the scene — it just points an iframe at it.

> `file://` note: the embed itself is verified to work from `file://`. Whether the *scene bundle* runs from `file://` depends on the browser's handling of self-contained HTML opened from disk — Any3d bundles make no network request, so they open cleanly in Chromium and Firefox; Safari may restrict some WebGL features for `file://` Worlds scenes.

## Files

- `embed.js` — the loader (sandboxed copy of `public/embed.js`)
- `demo.html` — standalone demo page
- `scene.html` — demo scene bundle (SVG airport)

## Security

Embedded scenes run in an opaque-origin iframe (`allow-scripts`, no `allow-same-origin`). They cannot reach the parent page's `localStorage`, cookies, or DOM. PNG capture runs inside the bundle over `postMessage`; GLB / clips / storyboards are not available inside an embed (they require same-origin access to the preview runtime).

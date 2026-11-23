# Any3d

**Local-first, chat-first creative studio for animated isometric 3D scenes.** Describe a place; your agent builds an animated scene and hands you one self-contained HTML file. Four engines — SVG vector, Three.js miniature worlds, pixel-art rasterizer, and ordered-dither yards — share one chat interface, one look system, and one offline export.

Any3d ports all four engines (SVG figures in six themes, Three.js worlds in four finishes, pixel miniatures without WebGL, dithered yards on the pixel kernel) and wraps them in a fullstack creative studio with dual-provider LLM generation, deterministic offline editing, and one-file HTML export.

---

## What it makes

Any3d scenes are small, animated, interactive isometric worlds. Every export is a single self-contained HTML file with no network dependency at runtime.

| Engine | Renderer | Look | Output size | Best for |
|---|---|---|---|---|
| **SVG** | Dependency-free SVG, no WebGL | 6 themes: toy, soft, mono, line, night, print | ~30–35 KB gzip | UI, docs, empty states, interactive illustrations |
| **Worlds** | Three.js / WebGL 2 | 4 finishes: miniature, pixel, halftone, blueprint | ~0.77 MB | Detailed miniature stories with articulated people |
| **Pixel** | 2D canvas software rasterizer | 320×240, 8×8 Bayer dither, dissolving ground | ~50 KB | Cozy pixel-art vignettes, no WebGL |
| **Dither** | Pixel kernel | 360×280, 4×4 ordered dither, hard shadow | ≤70 KB | Yards/shores that fill the frame, one tap toggles state |

Every scene answers the pointer (hover to name/lift, tap to switch), carries a read-out saying what it's doing, honors `prefers-reduced-motion`, and sleeps when offscreen.

---

## Quick start

### Prerequisites

- **Node.js 20+** (for `build.mjs`, `validate.mjs`, and the dev server)
- **Google Gemini API key** (cloud generation) or **Ollama** running locally (`ollama serve`) for offline generation

### Install & run

```bash
# Clone or open the Any3d folder
cd path/to/Any3d

# Install dependencies
npm install

# Start the dev server (Express API on :3001 + Vite frontend)
npm run dev
```

Open `http://localhost:5173` (or the port Vite reports). Describe a scene in the chat, watch it build, then **Export HTML** to get a standalone file.

### Production build

```bash
npm run build
npm start
```

---

## Core capabilities

### 1. Dual-provider LLM generation

Generate scenes from natural language with either **Google Gemini** (cloud) or **local Ollama** (offline). The system unwraps meta-prompts, extracts the primary subject and mandatory props, enforces prompt fidelity (0–100 scoring), and falls back to a deterministic procedural generator when a model is unavailable.

### 2. Conversational editing

Edit scenes by talking: "add a car", "make it red", "move it left", "switch theme to night". A deterministic offline AST editor handles SVG edits in sub-5ms with no model call; Worlds/Pixel/Dither edits fall back to the LLM. `/undo` walks back versions.

### 3. Look system (time of day + weather)

Dawn / noon / dusk / night + clear / rain / snow. The look rides with the scene in the URL hash payload (`#/s/...`) and in exported HTML, so a scene opened at dusk starts at dusk. Wired into all four engines.

### 4. Exports

| Export | Description |
|---|---|
| **Standalone HTML** | Self-contained, one file, no network at runtime |
| **Binary .GLB** | Three.js scene graph for Blender/Unity import |
| **Animated GIF / WebM** | Turntable clip recorded from the live preview |
| **URL-hash link** (`#/s/...`) | Compressed scene payload — share the whole scene in a link |

### 5. Embed

Drop any built scene onto an external page with one script tag (`docs/embed/embed.js`, 1,355 B gzipped). Runs in a sandboxed iframe (`allow-scripts`, no `same-origin`), works from `file://`.

```html
<script src="/path/to/embed.js"
        data-src="https://your.site/scenes/my-scene.html"
        data-ratio="4 / 3"
        data-title="Corner coffee cart">
</script>
```

---

## Project structure

```
Any3d/
├── server/                 # Express API studio server (:3001)
│   ├── index.js            # API routes: presets, validate, bundle, generate, mutate, ask-scene, extract-palette
│   ├── engine/
│   │   ├── kernels.js      # Kernel loading (SVG, Worlds, Pixel, Dither)
│   │   ├── validator.js    # Deterministic scene validation (10 checks)
│   │   ├── fidelityValidator.js  # Prompt fidelity scoring (0–100)
│   │   ├── bundler.js      # Self-healing HTML bundler + esbuild for Three.js
│   │   ├── procedural.js   # Deterministic procedural fallback generator
│   │   └── semantics.js    # Prompt semantics: subject, props, actions, prohibited objects
│   ├── llm/
│   │   ├── service.js      # Dual-provider generation (Gemini + Ollama)
│   │   ├── prompts.js      # System prompts per engine
│   │   ├── enhancer.js     # Prompt enhancer
│   │   ├── mutator.js      # Conversational scene mutation
│   │   └── offline-editor.js   # Deterministic offline AST editor (SVG)
│   └── presets/
│       ├── svg/            # 30 SVG figures
│       ├── worlds/         # 7 Three.js worlds
│       ├── pixel/          # 3 pixel scenes
│       └── dither/         # 4 dithered yards
├── core/
│   └── kernels/            # The four render kernels (SVG, Worlds, Pixel, Dither)
│       └── templates/      # HTML bench templates
├── src/                    # React 19 + Vite frontend studio
│   ├── components/         # Homepage, ProjectPage, SandboxPreview, Sidebar, CodeEditor, ...
│   ├── lib/                # scene-payload, glbExporter, turntable, productShot, look, api, ...
│   └── types.ts            # TypeScript type definitions
├── public/
│   └── embed.js            # Embeddable loader script (1,355 B gzipped)
├── docs/
│   ├── guides/             # 16 guide pages (SVG craft, motion, React; Worlds art direction & API; Pixel; Dither; turntable; diff; embed; palette; atmosphere; scene payload)
│   ├── embed/              # Embed demo (demo.html, embed.js, scene.html)
│   ├── assets/             # Screenshots
│   ├── ROADMAP.md          # Roadmap v2
│   ├── AUDIT_AND_ROADMAP.md
│   └── GAP-AUDIT-AND-PLAN.md
├── scripts/                # Test & verification scripts (payload, diff, offline editor, clip, look, seed, embed)
└── package.json
```

### Preset library (44 scenes)

**SVG (30):** town, island, farm, warehouse, powder, cafe, launchpad, server, rack, mailbox, seedling, desk, turntable, harbour, kitchen, assembly, observatory, vending, airport, badminton, barbershop, gym, laundromat, library, arcade, classroom, foodtruck, greenhouse, campsite, patisserie

**Worlds (7):** bakery, pottery-studio, florist, observatory, cricket, basketball, street-juggler

**Pixel (3):** flower-stall, pier, allotment

**Dither (4):** forge, lighthouse, tea-house, windmill

---

## Commands

| Script | Description |
|---|---|
| `npm run dev` | Start API + Vite frontend (concurrently) |
| `npm run dev:server` | Start Express API only |
| `npm run dev:client` | Start Vite frontend only |
| `npm run build` | Vite production build |
| `npm start` | Start the production server |
| `npm run test:payload` | Scene-payload round-trip tests (369 assertions over 44 presets) |
| `npm run test:diff` | Version diff tests (23 assertions) |
| `node scripts/test-offline-editor.mjs` | Offline editor tests (67 assertions) |
| `npx tsc --noEmit` | TypeScript type check |

Every roadmap item ships with a test or measured number and no regressions in `test:payload`, `test:diff`, `test-offline-editor.mjs`, `tsc --noEmit`, or `npm run build`.

---

## Guides (`docs/guides/`)

- **SVG:** `svg-craft.md`, `svg-motion.md`, `svg-react.md`
- **Worlds:** `worlds-art-direction.md`, `worlds-scene-api.md`
- **Pixel:** `pixel-art-direction.md`, `pixel-scene-api.md`
- **Dither:** `dither-yard.md`
- **Export:** `turntable-export.md`, `embed-and-storyboard.md`
- **Editing:** `version-diff-and-seeds.md`
- **AI/photo:** `palette-from-photo.md`
- **Look:** `atmosphere-and-look.md`
- **Payload/sharing:** `scene-payload.md`

---

## Roadmap status

See `docs/ROADMAP.md` for the full roadmap v2. Highlights:

- **Shipped:** versioned scene payload + `#/s/` routing, share/remix links, turntable video/GIF, atmosphere (time/weather), diff/seed/surprise/Ask, embed snippet, image→palette, deterministic offline editor, 44 presets
- **In progress / next:** product-shot mode (product image on plinth + hero/turntable export), multi-scene worlds composition, in-browser WebLLM, universal offline editor for Worlds/Pixel
- **Out of scope:** photorealism, node graphs, accounts/cloud sync, plugin marketplace, additional engines, server-rendered Open Graph images

---

<<<<<<< HEAD


---

## License

MIT. See `LICENSE` for details.
=======
**Can I use it on a phone?** Yes, the project page stacks into a single column.
>>>>>>> 9d8a50a7bfb21b0e980fdc101e6c1279aecd4042

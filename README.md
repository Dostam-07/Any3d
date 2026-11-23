<div align="center">

# Any3d — AI 3D Scene Studio on Your Machine

**Describe complex places in natural language — from bustling metropolis cities and deep-water container docks to orbital rocket launchpads and automated agritech farms. Watch them build in real-time. Keep editing them conversationally. Export one self-contained HTML file that runs anywhere offline.**

[![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![Vite 6](https://img.shields.io/badge/Vite-6.0-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r172-black?style=flat-square&logo=three.js)](https://threejs.org/)
[![Local-First](https://img.shields.io/badge/Privacy-Local--First-10b981?style=flat-square)](https://ollama.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)
[![CI](https://github.com/Dostam-07/Any3d/actions/workflows/ci.yml/badge.svg)](https://github.com/Dostam-07/Any3d/actions/workflows/ci.yml)
[![Showcase](https://github.com/Dostam-07/Any3d/actions/workflows/showcase.yml/badge.svg)](https://github.com/Dostam-07/Any3d/actions/workflows/showcase.yml)

[Quick Start](#quick-start) • [Complex Scene Gallery](#complex-scene-gallery--prompt-cookbook) • [Three Render Engines](#three-render-engines) • [Web Presentation Sizes](#web-presentation-sizes-hero-vs-card) • [Inside-Out Showcase](#inside-out-showcase-hero-and-card) • [Atmosphere & Look](#atmosphere--lighting-scrubber) • [Visual Research](#web-visual-grounding) • [Exports](#export-suite) • [Docs](#documentation)

</div>

<br />

<p align="center">
  <img src="docs/assets/home.png" alt="Any3d home screen with prompt composer, engine selectors, size switchers and curated 3D scene gallery" width="100%" />
</p>

Any3d is an open-source, local-first **text-to-3D scene creative studio**. It transforms descriptive prompts into interactive, animated, miniature 3D worlds. Whether you need a dense cyberpunk city grid, an industrial shipping dock with operating gantry cranes, a heavy-lift rocket launch facility, or an automated crop farm with GPS combines, Any3d generates complete procedural geometry, lighting, materials, and motion loops.

Every scene is fully editable in real-time chat, responsive across desktops and phones, grounded in real-world visual references, and exports into a single standalone HTML file with zero runtime dependencies.

---

## Highlights

| Feature | Description |
|---|---|
| **Complex Prompt to 3D Scene** | Natural language compiles directly into intricate multi-object dioramas — skyscrapers, cargo cranes, launch gantries, articulated vehicles, and synchronized animation loops. |
| **Conversational Editing** | Follow-up prompts refine *the current live scene*: "add an elevated monorail between the towers", "make the rocket engines vent vapor", "add a combine harvester to the crop field". |
| **Three Render Engines** | Choose from **SVG Vector** (clean architectural lines), **Three.js Worlds 3D** (ambient-occluded WebGL dioramas), and **Pixel Art** (nostalgic 320×240 software rasterizer). |
| **Web Presentation Modes** | Calibrated output formats: **Hero (16:9)** for wide landing page banners, and **Card (4:3)** for compact website UI components. |
| **Authentic Visual Grounding** | Automated background photographic research via Wikipedia Commons extracts authentic real-world engineering details, materials, and architectural scales — never mock or fake data. |
| **Live Atmosphere Scrubber** | Real-time lighting control (Dawn, Noon, Dusk, Night, Golden Hour, Blue Hour) and dynamic weather (Clear, Rain, Snow). |
| **AnyStack 3D Arcade** | Integrated 3D tower-stacking physics minigame built directly into the studio to enjoy while scenes build. |
| **Offline-First & Privacy** | Run 100% locally with **Ollama** on your GPU/CPU, or connect **Google Gemini** for high-speed cloud generation. |
| **Deterministic Validation** | Multi-point automated inspection: structural clock purity, ground pedestal bounds, pointer hover/picking hooks, and prompt fidelity scoring. |
| **One-File Offline Export** | Download a single `.html` file with the runtime inlined — open it on an airplane with no internet connection. |

---

## Workspace Layout

Starting a project opens its dedicated studio workspace (`#/project/<id>`) pairing the conversational chat assistant on the left with the interactive live 3D viewport on the right.

<p align="center">
  <img src="docs/assets/project-chat.png" alt="Any3d project page: a conversation about an industrial shipping harbour on the left, the rendered 3D scene and version badges on the right" width="100%" />
</p>

---

## Complex Scene Gallery & Prompt Cookbook

Any3d is built to handle rich, multi-layered environments with dozens of interacting elements. Here are ready-to-build scenes and prompts across complex industrial, urban, aerospace, and agricultural settings:

### 🚢 Deep-Water Industrial Container Dock & Shipping Harbour

<p align="center">
  <img src="docs/assets/scene-dock.png" alt="Deep-Water Industrial Container Dock with Freighter and Gantry Cranes" width="100%" />
</p>

```text
A sprawling deep-water maritime shipping container terminal: a massive container freighter docked along a concrete quay, rail-mounted gantry cranes actively lifting colored shipping containers, transport trucks queueing in striped transit lanes, stacks of modular cargo crates, a harbor tugboat with water spray escort, and animated ocean waves with channel buoys.
```
- **Key Props**: Container freighter hull with cargo stacks, motorized gantry cranes with moving trolleys, terminal trucks, harbor tugboat with oscillating wake, navigation buoys.
- **Interactions**: Hover over container stacks to read TEU inventory; click gantry crane to lower spreader.

---

### 🚀 Orbital Rocket Ship & Spaceport Launchpad

<p align="center">
  <img src="docs/assets/scene-launchpad.png" alt="Orbital Rocket Launchpad with Hydraulic Gantry Arms and Telemetry Bunker" width="100%" />
</p>

```text
A nocturnal orbital rocket launch facility at T-minus 10 seconds: a massive multi-stage heavy-lift rocket on a concrete launch pedestal, articulated hydraulic gantry tower arms swinging away, billowing white cryogenic LOX vapor clouds venting from booster valves, flame trench deflector channels, parabolic telemetry satellite dishes rotating on bunker roofs, and perimeter floodlights piercing the dark sky.
```
- **Key Props**: Multi-stage rocket booster with interstage fairings, launch umbilical tower, swinging service arms, cryogenic vapor particle emitters, tracking radar dishes, bunker telemetry array.
- **Interactions**: Tap launchpad to trigger countdown exhaust smoke; hover over telemetry dish to see orbital angle.

---

### 🌾 Automated Agritech Farm & Terraced Crop Estate

<p align="center">
  <img src="docs/assets/scene-farm.png" alt="Automated Agritech Farm with Crop Fields, Windmill, and Barn" width="100%" />
</p>

```text
A sprawling high-tech automated agricultural farm estate: expansive golden wheat fields and geometric hydroponic greenhouse domes, autonomous GPS-guided combine harvesters cutting crop swaths with rotating reel headers, corrugated steel grain elevator silos with conveyor chutes, solar tracking photovoltaic arrays, a turning aeration windmill, and an irrigation canal network with overflow sluice gates.
```
- **Key Props**: Crop field swaths, automated combines with rotating cutters, hydroponic glass geodesic domes, cylindrical grain silos, tracking solar panels, lattice windmill with spinning sails.
- **Interactions**: Hover over combine harvester to read crop yield metrics; click windmill to toggle rotation speed.

---

### 🏙️ Metropolis City Grid & Urban Architecture

<p align="center">
  <img src="docs/assets/scene-city.png" alt="Metropolis City Center with Multi-Tier Buildings and Transit" width="100%" />
</p>

```text
A dense multi-level urban city center at twilight: towering brutalist skyscrapers with illuminated window grids, glass-enclosed skybridges linking high-rises, an elevated monorail train cruising on curved tracks, multi-lane asphalt highway carrying autonomous commuter pods, glowing holographic billboard advertisements, neon cafes with steam rising, and reflective street pavement.
```
- **Key Props**: Skyscraper cluster, skybridges, monorail with loop motion, neon billboards, highway with moving car pods, pedestrian overpasses.
- **Interactions**: Hover over skybridge reveals structural read-out; click monorail to toggle transit speed.

---

### 🔬 High-Altitude Observatory & Regional Airport

<p align="center">
  <img src="docs/assets/scene-observatory.png" alt="High-Altitude Mountain Summit Astronomical Observatory" width="48%" />
  &nbsp;
  <img src="docs/assets/scene-airport.png" alt="Regional Airport Terminal with Aircraft Taxiing" width="48%" />
</p>

- **Astronomical Observatory**: Dual rotating silver domes with open aperture slits pointing reflecting telescopes toward the stars, satellite telemetry dish arrays, and cliffside funicular tramway.
- **Airport Hub**: Modern terminal building with jet bridges, taxiways with directional striping, twin-engine passenger aircraft taxiing, and a rotating 360-degree airport radar beacon tower.

---

## Quick Start

### Prerequisites

- **Node.js 20+** (v18.18+ supported)
- **npm** or **pnpm**
- *(Optional)* [Ollama](https://ollama.com) for fully offline, private generation
- *(Optional)* [Google Gemini API Key](https://aistudio.google.com/app/apikey) for cloud generation

### Installation

```bash
# Clone the repository
git clone https://github.com/Dostam-07/Any3d.git
cd Any3d

# Install dependencies
npm install

# Start development studio (Express API on :3001 + Vite frontend on :5173)
npm run dev
```

Open `http://localhost:5173` in your browser. Type a scene prompt, hit **Enter**, and watch your scene construct itself.

### Production Build

```bash
npm run build     # Compiles the React/Vite studio into dist/
npm start         # Serves static assets + Express API from port 3001
```

---

## Connect an AI Provider

Any3d supports dual AI providers, switchable at any time from the top header:

### 1. Ollama (100% Private & Local)

Run models locally with zero cloud dependencies and no API quota:

```bash
ollama serve
ollama pull qwen2.5-coder:7b
```

Any3d automatically enumerates installed Ollama models in the toolbar dropdown.

### 2. Google Gemini (Fast & High-Fidelity)

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click **Settings** (or the model badge in the toolbar) and paste your key.
3. The key is securely stored in your browser's `localStorage` and never shared externally.

### 3. Deterministic Procedural Fallback

No internet and no LLM installed? Any3d includes an offline procedural generator that crafts valid geometric scenes immediately without an AI model.

---

## Three Render Engines

Any3d houses three dedicated rendering engines sharing a unified prompt compiler and look system:

| Engine | Tech Stack | Aesthetic | Best For | Output Size |
|---|---|---|---|---|
| **SVG** | Dependency-free Vector SVG | 6 distinct vector themes, crisp lines, zero WebGL | Complex technical schematics, architectural line art, UI illustrations | ~30–35 KB |
| **Worlds** | Three.js / WebGL 2 | Soft miniature diorama, articulated figures, dynamic shadows | Narrative 3D worlds, industrial docks, cities, rocket launchpads | ~0.77 MB |
| **Pixel** | Software 2D Canvas Rasterizer | 320×240 retro resolution, 8×8 Bayer dither, dissolving edges | Nostalgic retro scenes, cozy farms, lightweight vignettes | ~50 KB |

<br />

### Engine Showcase

<p align="center">
  <img src="docs/assets/engine-svg-card.png" alt="SVG vector scene of a coffee cart" width="48%" />
  &nbsp;
  <img src="docs/assets/engine-worlds-card.png" alt="Three.js world diorama of a morning bakery" width="48%" />
</p>
<p align="center">
  <img src="docs/assets/engine-pixel-card.png" alt="Pixel art scene of a flower stall" width="60%" />
</p>

---

## Web Presentation Sizes: Hero vs Card

Any3d generates 3D scenes tailored to their real-world placement on the web:

<br />

| Presentation Format | Aspect Ratio | Camera & Stage Calibration | Ideal Placement |
|---|---|---|---|
| **Web Hero Section** | **16:9 Widescreen** | Panoramic boulevard bounds (`20.0 × 11.2`), wide camera frustum (`1.35×`), spacious multi-prop layout | Full-width landing page headers, sprawling city skylines, shipping docks |
| **Website Feature Card** | **4:3 Component** | Tight diorama bounds (`13.0 × 9.6`), focused component framing (`1.02×`), central pedestal emphasis | Feature cards, bento grids, standalone rocket launchpad pedestals |

Switch between **Hero** and **Card** with one click in the prompt bar or toolbar to see the stage and camera bounds adapt dynamically.

---

## Inside-Out Showcase: Hero and Card

Twelve captures taken straight from the running studio with `node scripts/showcase.mjs` — no retouching, no mock layout:

- **Six hero sections** (full-bleed banner: nav, one headline, one CTA) and **six card sections** (a live 4:3 card in a responsive grid, beside a *Ship this scene* card with an Export HTML CTA and a peek at the generated source, and the look controls). The scene spec rides as quiet chips in the section header instead of competing with the output.
- Each presentation mixes **four presets** with **two prompt-only scenes that are not in the preset library** (night market, glacier lighthouse, rooftop greenhouse, coral nursery). Those four were typed as prompts and generated end to end, which is how the framing and coverage bugs below were caught.
- Two hero banners are looping GIFs because their motion is the point: crane travel on the harbour, lantern sway in the night market. Everything else is a still.

<h3 align="center">Hero Sections — 6 scenes</h3>

<table>
  <tr>
    <td width="50%" align="center">
      <a href="docs/assets/showcase/harbour-hero.png" title="Open the full-resolution still"><img src="docs/assets/showcase/harbour-hero.gif" alt="SVG harbour scene as a full-bleed hero banner with nav and headline" /></a><br />
      <sub><b>harbour</b> · SVG Vector · preset — blueprint gantry cranes over water</sub>
    </td>
    <td width="50%" align="center">
      <img src="docs/assets/showcase/florist-hero.png" alt="Three.js florist shop front as a full-bleed hero banner" /><br />
      <sub><b>florist</b> · Three.js · preset — warm shop front with a street of planters</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="docs/assets/showcase/town-hero.png" alt="Isometric town square as a full-bleed hero banner" /><br />
      <sub><b>town square</b> · SVG Vector · preset — a whole town block with roads and traffic</sub>
    </td>
    <td align="center">
      <img src="docs/assets/showcase/airport-hero.png" alt="SVG airport terminal and runway in a hero banner" /><br />
      <sub><b>airport</b> · SVG Vector · preset — terminal, apron and runway lights</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <a href="docs/assets/showcase/market-hero.png" title="Open the full-resolution still"><img src="docs/assets/showcase/market-hero.gif" alt="Night market with lanterns and stalls as a hero banner" /></a><br />
      <sub><b>night market</b> · Three.js · <i>prompt only</i> — “a bustling night market with noodle stalls and paper lanterns”</sub>
    </td>
    <td align="center">
      <img src="docs/assets/showcase/glacier-hero.png" alt="Glacier lighthouse and research hut as a hero banner" /><br />
      <sub><b>glacier lighthouse</b> · Three.js · <i>prompt only</i> — “a lighthouse at the edge of a glacier with a stranded research hut”</sub>
    </td>
  </tr>
</table>

<h3 align="center">Card Sections — 6 scenes</h3>

<table>
  <tr>
    <td width="33%" align="center">
      <img src="docs/assets/showcase/bakery-card.png" alt="Bakery scene embedded as a card in a dark grid" /><br />
      <sub><b>bakery</b> · Three.js · preset</sub>
    </td>
    <td width="33%" align="center">
      <img src="docs/assets/showcase/classroom-card.png" alt="Classroom scene embedded as a card in a dark grid" /><br />
      <sub><b>classroom</b> · SVG Vector · preset</sub>
    </td>
    <td width="33%" align="center">
      <img src="docs/assets/showcase/flowerstall-card.png" alt="Pixel art flower stall embedded as a card" /><br />
      <sub><b>flower stall</b> · Pixel Art · preset</sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="docs/assets/showcase/pier-card.png" alt="Pixel art fishing pier embedded as a card" /><br />
      <sub><b>fishing pier</b> · Pixel Art · preset</sub>
    </td>
    <td align="center">
      <img src="docs/assets/showcase/greenhouse-card.png" alt="Rooftop greenhouse with watering arm embedded as a card" /><br />
      <sub><b>rooftop greenhouse</b> · Three.js · <i>prompt only</i></sub>
    </td>
    <td align="center">
      <img src="docs/assets/showcase/coral-card.png" alt="Underwater coral nursery embedded as a card" /><br />
      <sub><b>coral nursery</b> · Three.js · <i>prompt only</i></sub>
    </td>
  </tr>
</table>

The two prompt-only worlds per presentation were sent through the same `POST /api/generate` path the studio uses. On this CPU-only machine the local 7B model exceeded the generation timeout, so the request fell back to the built-in procedural composer — that composer output is what the screenshots show, and it is the reason the fallback was rebuilt (see below).

### What this audit run fixed

| Found while shooting the showcase | Fix |
|---|---|
| Any prompt outside a hand-written category produced the same courtyard: pergola, table, one person. | `server/engine/custom-world.js` now composes from the prompt's own nouns — palette profile (`ice`, `underwater`, `volcanic`, `orbital`, `market`, `industrial`, `garden`, `desert`) plus set pieces (stalls, lanterns, lamp posts, greenhouse, crop rows, watering arm, coral, bubbles, huts, glaciers, domes, solar arrays). |
| Worlds written with the SVG API passed validation, then failed bundling with `Could not resolve "@any3d/figure"` → HTTP 500. | `validateWorlds()` rejects `D.*`, `pal.*`, `Any3d.*`, `Pixel.*` and any import other than `@any3d/worlds`. |
| The ordered-dither engine shipped as a fourth format nobody asked for, doubling the bundle and kernel surface for a look the pixel engine already covers. | Removed: kernel, bench template, four presets, prompt/validator/bundler branches and the gallery tab are gone. Two showcase tiles that used it were re-shot with SVG and pixel scenes. |
| Pixel scenes appeared as a postage stamp in the middle of the stage, because the canvas kept its native 320×240 box. | `fit()` scales to the largest whole-number multiple of both stage axes — in the studio and in exported files. |
| The default (noon) look painted the stage pure white behind every scene. | Noon background is a soft studio tone (`#e6ebf3`). |
| Every Three.js scene sat on a near-black backdrop under bright noon lighting, so a hero banner read as a black rectangle on any light page: `world-bench.html` ignored the studio's `look` message and the runtime never applied a profile at mount. | The world runtime applies the default look on mount and honours `look` / `size` / `finish` / `paused` / `camera` messages; exports carry the look for every format, not just SVG. Guarded by a *world look reaches the runtime* check (noon sky 236 → night 47). |
| Hero framing zoomed out 1.35×, leaving a wide dead margin around the scene. | 1.08× — the scene reaches the banner edges and tall props still clear the top. |
| Nothing noticed a scene that still draws but stopped looking like itself — a swapped model, a collapsed silhouette, a presentation that lost its framing. | `scripts/verify-still-fidelity.mjs` re-shoots all 13 README stills through the studio into `.tmp/fidelity` and compares each with the committed one on a 64 × 36 luminance grid: same-scene noise measures mean 0.0–0.8 and ≤0.5% of cells hot, while a swapped subject measures mean 6–96 and 5–66% hot, so the limit is mean ≤ 3 and ≤ 5% hot. |
| The pixel kernel had no contract test at all: `P.snap` and `P.wind` only exist after the first render, so a scene calling them from `build` silently got a no-op and plain `P.wave`, and nothing would have noticed if any of the 24 documented `P` entries stopped drawing. | Documented the timing, and added `scripts/verify-pixel-api.mjs`: it calls every `P` entry with sane and with non-finite arguments, rasterises both scenes and fails on a missing call, a throw, an empty frame or non-finite stats. |
| A non-numeric `seg` on `D.cyl` (or a NaN extent on any SVG primitive) threw inside the painter and blanked the whole figure, with no clue in the markup. | Every `D` primitive coerces sizes, positions and segment counts; `scripts/verify-svg-api.mjs` calls all 23 primitives and 10 motion helpers from the kernel header and fails if a bad argument throws or leaves `NaN` in the SVG. |
| The documented `segments` argument on `W.cylinder` was silently dropped in both call shapes, so presets asking for 10, 16, 20 or 32 segments (the pottery wheel, its pots and cans) all rendered at 8. | Both shapes read the argument again (`scripts/verify-worlds-api.mjs` asserts it), and every documented primitive is now called in CI with sane and with non-finite arguments. |
| The camera menu (isometric / top / front / side) changed its own label and nothing else: the world bench dropped `camera` messages too, and the SVG runtime had no runtime camera at all. | Worlds accept `{ az, el, dist }` and refit; SVG gained `ctx.setCamera` that sets the rest angle and refits the frustum; *Isometric View* restores each scene's authored angle; the control is hidden for the pixel engine, which has no camera. Guarded by three checks (`world camera presets apply`, `svg camera presets apply`, `camera hidden for the 2D engines`). |
| Generated scenes showed a slug in the headline and exports: “a-bustling-night-market-with-n”. | `src/lib/scene-title.ts` prefers the scene description, drops a truncated tail, and trims dangling connectors. |
| A 4:3 card section left a tall empty tail in a squarish stage. | The card section measures its content and compacts itself; the showcase crops stills to the content box. |
| Switching Hero ↔ Card rewrote the scene source, re-bundled it and reloaded the frame — the camera pose was lost and the code editor quietly changed. | The size is a runtime message to the live frame; only the exported file is stamped (`src/lib/presentation-size.ts`). Verified: the iframe document survives every switch. |

To regenerate everything: start the API (`node server/index.js`) and the app (`npm run dev`), then run `npm run showcase` (pass scene keys to re-shoot a subset, and `npm run showcase:gifs` to record the two animated banners). The four prompt-only scenes are rebuilt deterministically by the script itself, so a clean checkout can reproduce every image.

Stills are normalised to 1240 px wide and GIFs to 640 px, so GitHub renders every tile at the same scale.

Before pushing, `npm run check` runs the test suite, the typechecker and the production build. `npm run verify:showcase` covers the live presentation invariants and needs the API and app running.

CI keeps this honest:

| Workflow | What it does |
|---|---|
| `.github/workflows/ci.yml` | `npm test`, `tsc --noEmit`, `npm run build`, then boots the API and app and runs `npm run verify:showcase` — the presentation invariants (frame survives Hero ↔ Card, card CTA exports and copies, *Editable source* opens the editor, pixel art fills its frame, console clean). |
| `.github/workflows/showcase.yml` | Weekly / on demand: re-captures all twelve scenes with `showcase:gifs`, uploads them as an artifact, and commits the refreshed images only when `commit_images` is set. |

---

## Six Live Themes & Four 3D Finishes

### SVG Vector Themes

Repaint any SVG scene instantly in sub-5ms without regeneration or model calls:

<p align="center">
  <img src="docs/assets/theme-cycle.gif" alt="Animated GIF cycling through the six Any3d themes: toy, soft, mono, line, night and print" width="100%" />
</p>

- **Toy**: Saturated, joyful primary palette with clean outlines.
- **Soft**: Pastel tones with gentle warm shading.
- **Mono**: High-contrast editorial monochrome.
- **Line**: Technical architectural wireframe with zero fill.
- **Night**: Dark luminescent cyber aesthetic with glowing accents.
- **Print**: Risograph and newspaper halftone dot aesthetics.

### Worlds 3D Finishes

Switch the 3D post-processing shader stack:
- **Miniature**: Soft depth-of-field diorama with ambient occlusion.
- **Pixel**: Real-time 3D pixelation pass.
- **Halftone**: Comic-book style screen-tone dots.
- **Blueprint**: Technical CAD schematic drafting finish.

---

## Atmosphere & Lighting Scrubber

Control scene lighting, sun elevation, shadows, and weather in real time:

- **Time of Day**: Dawn, Noon, Dusk, Night, Golden Hour, and Blue Hour.
- **Weather Particles**: Clear, Animated Rain, and Falling Snow.
- **Persistent State**: The chosen atmosphere is automatically encoded into export HTML files and URL-hash payloads (`#/s/...`).

---

## Web Visual Grounding

When you prompt a complex scene — such as *"an industrial deep-water container dock with a cargo ship and gantry cranes"* or *"an automated agritech farm with combines and grain silos"* — Any3d performs automated background visual research on Wikimedia Commons.

- **Authentic Photographic Studies**: Gathers real photographs of the exact subjects requested (real container gantry crane truss geometry, real ship draft waterlines, real combine harvester cutting reels).
- **No Mock or Fake Data**: Never uses generic placeholders or hallucinated geometries. Real-world proportions, color palettes, and architectural scales directly ground the scene generator.

---

## AnyStack 3D Arcade

Waiting for a model generation or want to take a creative break? Click **AnyStack** in the 3D toolbar to play an integrated physics-based 3D block stacking minigame directly on the 3D stage.

---

## Deterministic Validation & Inspector

Every generated scene passes an automated quality harness before rendering:

<p align="center">
  <img src="docs/assets/inspector.png" alt="Any3d validation drawer listing structural checks and prompt fidelity for the current scene" width="100%" />
</p>

- **Clock Purity**: Ensures all animation loops derive strictly from the kernel timestamp `t` (no uncontrolled `Date.now()` or `Math.random()` jitter).
- **Ground Pedestal Bounds**: Confirms geometry remains contained on the diorama base.
- **Pointer & Picking Hooks**: Verifies hover highlights, name read-outs, and interactive click events.
- **Prompt Fidelity**: Evaluates presence of mandatory subjects, props, and actions (0–100 score).
- **Self-Healing Bundler**: Automatically fixes unclosed tags, malformed transforms, and missing imports.

---

## Curated Preset Library

Browse 40 production-grade scenes across all three engines via the **Presets** gallery (`Ctrl/⌘ K`):

<p align="center">
  <img src="docs/assets/gallery.png" alt="Any3d preset gallery showing curated scenes across SVG, Worlds, and Pixel engines" width="100%" />
</p>

- **SVG (30)**: `town`, `island`, `farm`, `warehouse`, `powder`, `cafe`, `launchpad`, `server`, `rack`, `mailbox`, `seedling`, `desk`, `turntable`, `harbour`, `kitchen`, `assembly`, `observatory`, `vending`, `airport`, `badminton`, `barbershop`, `gym`, `laundromat`, `library`, `arcade`, `classroom`, `foodtruck`, `greenhouse`, `campsite`, `patisserie`.
- **Worlds 3D (7)**: `bakery`, `pottery-studio`, `florist`, `observatory`, `cricket`, `basketball`, `street-juggler`.
- **Pixel (3)**: `flower-stall`, `pier`, `allotment`.

---

## Export Suite

Any3d is built to deliver assets ready for production deployment:

| Export Target | Format | Description |
|---|---|---|
| **Standalone HTML** | `.html` | Completely self-contained single-file bundle. Inlined CSS, runtime, and scene logic. Zero dependencies, works offline. |
| **Binary GLB** | `.glb` | Standard 3D scene graph for import into Blender, Unity, Unreal Engine, or Godot. |
| **PNG Snapshot** | `.png` | 2× high-resolution crisp image snapshot with transparent or styled background. |
| **Turntable Video** | `.webm` / `.gif` | Smooth 360-degree rotating camera clip recorded directly from the canvas. |
| **Compressed URL Link** | `#/s/...` | Losslessly compressed scene payload in the URL hash. Share complete scenes without server storage. |
| **Embed Script** | `<script>` | Drop any scene onto your existing website using `embed.js` (sandboxed, responsive iframe). |

---

## Mobile Responsive Design

Any3d is built mobile-first and fully responsive across smartphones and tablets. The studio interface dynamically adapts for touch-first screens:

- **Mobile Home Studio**: The prompt capsule, engine selectors, aspect ratio switches, and curated inspirations stack into an ergonomic single-column view with touch-friendly controls.
- **Mobile Project Studio**: The conversation assistant and interactive 3D viewport stack vertically with progressive disclosure menus for camera presets, lighting scrubbers, and live preview tabs.

<p align="center">
  <img src="docs/assets/mobile-home.png" alt="Any3d on mobile: home prompt composer and inspiration grid" width="45%" />
  &nbsp; &nbsp;
  <img src="docs/assets/mobile-project.png" alt="Any3d on mobile: stacked project view with live 3D diorama and conversational editor" width="45%" />
</p>

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/⌘ + N` | Create a new scene project |
| `Ctrl/⌘ + K` | Open the Preset Scene Gallery |
| `Ctrl/⌘ + J` | Toggle the conversational chat drawer |
| `Ctrl/⌘ + I` | Open the Scene Validation Inspector |
| `Ctrl/⌘ + B` | Toggle the project sidebar |
| `Enter` | Send generation / edit prompt |
| `Shift + Enter` | Insert new line in prompt composer |

---

## Project Architecture

```
Any3d/
├── core/
│   ├── kernels/            # Three core render kernels (SVG, Worlds, Pixel)
│   └── templates/          # HTML bench templates for standalone bundling
├── server/                 # Express backend API (:3001)
│   ├── engine/
│   │   ├── bundler.js      # Self-healing HTML bundler + Three.js esbuild packager
│   │   ├── validator.js    # Deterministic scene validator
│   │   ├── fidelityValidator.js  # Semantic prompt coverage & scoring
│   │   ├── procedural.js   # Deterministic offline procedural fallback generator
│   │   └── semantics.js    # Subject, prop, and layout semantics extractor
│   ├── llm/
│   │   ├── service.js      # Dual-provider LLM coordinator (Gemini & Ollama)
│   │   ├── prompts.js      # Engine-specific system prompts & syntax rules
│   │   ├── enhancer.js     # Prompt expansion & real-world photo researcher
│   │   ├── mutator.js      # Conversational differential scene editor
│   │   └── offline-editor.js   # Sub-5ms deterministic AST editor (SVG)
│   └── presets/            # Source code for preset scenes
├── src/                    # React 19 + Vite 6 frontend
│   ├── components/         # Homepage, ProjectPage, SandboxPreview, LookScrubber, AnyStack...
│   ├── lib/                # glbExporter, turntable, look, scene-payload, api
│   └── types.ts            # Core TypeScript schemas
├── docs/
│   ├── assets/             # Screenshots, GIFs, and engine comparison cards
│   ├── guides/             # In-depth architectural and authoring guides
│   └── ROADMAP.md          # Project milestones and feature roadmap
└── public/
    └── embed.js            # Standalone zero-dependency embed script
```

---

## Documentation Guides (`docs/guides/`)

- **Vector SVG**: [SVG Craft](docs/guides/svg-craft.md) • [SVG Motion Loops](docs/guides/svg-motion.md) • [SVG + React](docs/guides/svg-react.md)
- **Three.js Worlds**: [Worlds Art Direction](docs/guides/worlds-art-direction.md) • [Worlds Scene API](docs/guides/worlds-scene-api.md)
- **Pixel Art**: [Pixel Art Direction](docs/guides/pixel-art-direction.md) • [Pixel Scene API](docs/guides/pixel-scene-api.md)
- **Exports & Embeds**: [Turntable Export](docs/guides/turntable-export.md) • [Embed Script & Storyboard](docs/guides/embed-and-storyboard.md)
- **Atmosphere**: [Atmosphere & Look Scrubber](docs/guides/atmosphere-and-look.md) • [Palette from Photo](docs/guides/palette-from-photo.md)
- **Architecture**: [Scene Payload Protocol](docs/guides/scene-payload.md) • [Version Diff & Seeds](docs/guides/version-diff-and-seeds.md)

---

## FAQ & Troubleshooting

<details>
<summary><b>Does Any3d require an active internet connection?</b></summary>
No. When using Ollama with local models or the built-in procedural generator, Any3d operates 100% offline. Exported HTML files also function completely offline with zero external network requests.
</details>

<details>
<summary><b>Where is my scene data stored?</b></summary>
All project sessions, chat histories, and custom scenes are persisted locally in your browser's <code>localStorage</code> (keys: <code>any3d_saved_sessions</code> and <code>any3d_chat_history</code>).
</details>

<details>
<summary><b>Can I import Any3d models into Blender or Unity?</b></summary>
Yes. In the Worlds 3D engine, click <b>Export → GLB</b> to download a standard binary <code>.glb</code> file containing the Three.js mesh geometry and materials.
</details>

<details>
<summary><b>Port 3001 or 5173 is already in use. How do I change it?</b></summary>
You can start the frontend and backend individually with custom ports:
<code>PORT=3005 npm run dev:server</code> and <code>npm run dev:client -- --port 5175</code>.
</details>

---

## License

This project is licensed under the [MIT License](LICENSE).

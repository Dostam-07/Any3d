# Any3d roadmap

**Roadmap v2 · last audited 2026-11-10**

The previous roadmap ran phases 0–6. Most of it shipped; this version records what actually landed, then sets the next body of work. The guiding constraint is unchanged: **local-first, chat-first, one-file export.** Anything that needs an account, a server-side scene database, or a node graph stays out.

---

## 1. Audit of the previous roadmap

| Phase | Promise | Status | Evidence |
|---|---|---|---|
| 0 | Versioned scene payload + `#/s/` route | **Shipped** | `src/lib/scene-payload.ts`, trust gate, `npm run test:payload` — 369 assertions over 44 presets |
| 1 | Share/remix links + "Remix this" | **Shipped, 1b open** | Share dialog and trust gate work; the preview iframe is still `allow-same-origin`; preset and export cards have no Remix entry point |
| 2 | Turntable video/GIF export | **Shipped** | `src/lib/turntable.ts`, `ClipControl.tsx`, `scripts/verify-clip.mjs` (1080² WebM, 640² GIF); SVG video still lands at 9–12 fps |
| 3 | Atmosphere: time of day + weather | **Partial** | Payload carries `look`; all four kernels contain the look path; SVG verified (mean luma 0.533 → 0.424 at night, 0 bundle requests while scrubbing). Worlds and Pixel visual parity is unmeasured (the ordered-dither engine has since been removed) |
| 4 | Diff, seed lock, surprise deck, Ask | **Shipped, one gap** | `src/lib/diff.ts` + `VersionDiff.tsx` (now also on the project page), seed plumbing, `surprise-deck.ts`, `/api/ask-scene`; locked-seed reproduction is still unmeasured |
| 5 | Embed snippet + storyboard | **Shipped, verification gaps** | `public/embed.js` at 1,355 B gzipped; storyboard 2400×1350 with burned-in name; `file://` untested; no published demo; storyboard is SVG-only |
| 6 | Image→palette, product-shot, multi-scene | **Partial** | `/api/extract-palette` + `PaletteFromPhoto` + guide shipped; product-shot and multi-scene not started |

### Shipped outside the old roadmap

- **Deterministic offline editor** (`server/llm/offline-editor.js`): add/remove, move/scale, motion (spin, bob, sway, pulse, orbit), hover lift and themes without a model call. 67 assertions. Currently SVG-only.
- **10 new SVG presets** — barbershop, gym, laundromat, library, arcade, classroom, food truck, greenhouse, campsite, patisserie — bringing the library to **40** (30 SVG, 7 Worlds, 3 Pixel; the 4 ordered-dither presets were removed with that engine).
- **Responsive UI pass** — chat overlays the stage on phones, project toolbar collapses secondary actions into a menu, scene header no longer clips, light-mode contrast fixed, `100dvh` layout.
- **Local telemetry + debug panel** — opt-in counters for scenes, edits, exports and remixes; no network.
- **README refresh** — 44 presets, engine-specific validation, offline-edit capabilities, responsive workspace.

### Corrections to earlier claims

- Payload tests are **369 assertions**, not 182.
- Presets are **44**, not “30+”.
- The project page now has version diff, not only the Studio.
- “Atmosphere is SVG-only” is no longer true at the code level: every kernel handles the look message. What is missing is **measured parity** on Worlds and Pixel.

---

## 2. What “done” means

Every item below ships with:

1. A user-visible result, not just plumbing.
2. A test or a measured number (assertion count, pixels, KB, ms).
3. A guide page under `docs/guides/` linked from the README.
4. No regression in `npm run test:payload`, `npm run test:diff`, `node scripts/test-offline-editor.mjs`, `tsc --noEmit` or `npm run build`.

Estimates assume one focused developer.

---

## 3. Roadmap v2

### Track A — Close the trust gaps (mostly shipped)

The product makes claims that are not fully verified. Close those before adding surface area.

**A1 · Sandbox the preview and move exports into the bundle.**
The share payload is executable code running same-origin, so it can read `localStorage` (including the Gemini key). Move PNG capture and GLB export inside the bundled scene over `postMessage`, then switch the iframe to `sandbox="allow-scripts"` without `allow-same-origin`.
*Acceptance:* a shared scene cannot read the parent origin; PNG and GLB still export from project and Studio; the security note in the share dialog is removed because it is no longer needed. If a GLB converter cannot fit the size budget for vector scenes, disable GLB inside shared/embed contexts and say so in the UI.
*Status:* shared payloads are sandboxed (`allow-scripts`, opaque origin) and PNG capture now runs inside the bundle on all four engines. GLB, clips and storyboards are gated for shared scenes until the bundle exporter lands.

**A2 · Measure locked-seed reproduction.** — DONE 2026-11-23
`scripts/test-seed-lock.mjs` runs the same prompt twice through the deterministic procedural fallback across 6 prompt × format cases; all 6 are byte-identical (code identity). Model-path (Ollama/Gemini) seed reproduction requires a live provider and is documented in the script; the claim is softened to “procedural fallback is deterministic; model output reproducible only when provider/model/temperature/seed are fixed.”

**A3 · Finish the remix entry points.** — DONE 2026-11-23
`handleRemixPreset` (`src/App.tsx:662-707`) opens a brand-new project with the scene as version 1, no model call, no trust gate. Wired to the `PresetGallery` Remix button (`src/components/PresetGallery.tsx:185-198`) and the ProjectPage empty-state “Start from a preset” (`src/components/ProjectPage.tsx:707-728`). Title is `Remix · <preset title>`; source project untouched.

**A4 · Publish the embed demo.** — DONE 2026-11-23
Fixture moved from `.tmp/embed/` into `docs/embed/`: `demo.html` (static demo page), `embed.md` (copy-paste snippet + guide), sandboxed `embed.js` (copy of `public/embed.js`, `allow-scripts` without `allow-same-origin`), `scene.html` fixture. `file://` works for the loader itself (no scene fetch); bundle runtime from `file://` documented as a browser-dependent limitation.

---

### Track B — Editing parity (shipped: look, undo, actionable failures)

Chat editing is the product’s differentiator, but the instant path only covers SVG.

**B1 · Offline look and theme on every engine.** — DONE (Phase 2)
`editSceneOffline` now handles theme/finish switches and live look changes for SVG, Worlds and Pixel. It is wired into `handleSendMessage` (`src/App.tsx`): the deterministic offline editor runs first (zero model calls), and the LLM fallback (`mutateSceneApi`) only runs when it cannot apply the edit. Unsupported requests return a short, accurate reply with two concrete rephrasings plus a one-click **Use model** path.

**B2 · Undo the last edit from chat.** — DONE (Phase 2)
Added an **Undo** button in the ProjectPage composer (next to Surprise), backed by `/undo`. It restores the previous checkpoint (`codeVersions[length-2]`) without creating a new one; repeated Undo walks back versions. No new checkpoint is added.

**B3 · Resolve references and recover from failure.** — DONE (Phase 2)
Pronoun resolution ("it"/"that"/"the last thing") works for add/remove/move across all four engines via `/*a3d:...*/` markers. Color change ("make it red", "change it to blue") works on SVG, Pixel and Worlds (when the target's creation line carries visible hex colors). Failed offline edits reply with two concrete rephrasings instead of a generic failure.

---

### Track C — Discovery and onboarding (shipped)

44 presets are only useful if people can find them.

**C1 · Search and filter the gallery.** — DONE (Phase 3)
`PresetGallery` now has keyboard navigation (arrow keys move focus, Enter selects, Escape closes, Home/End jump to first/last), an empty state with a "Clear filters" button when no results match, and focused-card scroll-into-view. Text search and engine/subject filter tabs were already present.
*Acceptance:* filtering to SVG + "food" surfaces the food truck; keyboard-only selection works; no layout shift at 390 px.

**C2 · Start from a preset inside a project.** — Already DONE (Phase 1, Track A3)
`handleRemixPreset` (`src/App.tsx`) opens a new project at version 1 with no model call. Wired to PresetGallery Remix button and ProjectPage empty-state "Start from a preset" row (`ProjectPage.tsx:707-728`). Two clicks from blank project to rendered scene.
*Acceptance:* two clicks from a blank project to a rendered scene with one version and a sensible title.

**C3 · First-run panel.** — DONE (Phase 3)
New `FirstRunPanel` component (`src/components/FirstRunPanel.tsx`) shows model status (Ollama models detected / Gemini key missing), an engine picker (SVG/Worlds/Pixel), and three starters (Coffee Cart SVG, Lighthouse Island Worlds, Mountain Forge Pixel). Wired into App.tsx: shown on Home when `sessions.length === 0` and no model is configured; replaced by the normal Homepage once a model is available or a session exists. Gives new users one clear next action with no dead ends when the API is down.
*Acceptance:* a new user can tell whether a model is available before typing; no dead ends when the API is down.

---

### Track D — Distribution polish (Phase 4 — DONE 2026-11-23)

**D1 · Share card instead of Open Graph.** — DONE
`shareCard()` generates a PNG preview client-side via `snapshotPng()` and shares it through the Web Share API together with the scene link URL. Fallback copies the link to the clipboard. Sharing produces both a link and an image on supporting browsers; the fallback copies the link.

**D2 · Decide the canvas storyboard.** — Dropped (decision recorded).
The camera lives inside Three.js, so four angles is real work for a low-frequency export. The button stays disabled with that explanation; canvas storyboards are no longer planned.

**D3 · Share-size guardrails.** — DONE
The share dialog shows the character count and a verdict (safe vs. may be truncated). Above `SHARE_ROUTE_SOFT_LIMIT` (6 KB), **Export HTML** becomes the primary action (gradient emerald/teal button), with Open and Share card/Copy link as secondary actions.

---

### Track E — Expansion (decision: product-shot)

**Decided:** product-shot mode first; multi-scene worlds waits until it ships.

- **Product-shot mode.** Drop a product image on a plinth, light it with the existing look system, export a hero image and a turntable clip. New buyer, same engine. ~1–2 weeks.
- **Multi-scene worlds.** Several islands in one scene, one prompt each, payload v3. Turns “a scene” into “a place”. ~2–3 weeks.

Image→palette already shipped; do not re-plan it.

---

## 4. Cross-cutting work

- **Docs:** one guide per subsystem, linked from the README. New guides needed for offline editing and the audit results.
- **Assets:** refresh `docs/assets/` whenever the UI changes; the current screenshots predate the toolbar and mobile fixes.
- **Accessibility:** keyboard path for gallery, diff and menus; `aria-live` on generation status; AA contrast in both themes.
- **Performance budgets:** share route 6 KB soft limit, embed 15 KB gzipped, first paint under 1.5 s on the reference machine. Measure before claiming.
- **Failure states:** API down, no model, invalid scene, clipboard blocked. Every one needs a next action.
- **Tests:** keep payload (369), diff (23) and offline editor (67) green; add end-to-end coverage for share, export and remix.

---

## 5. Success signals

No telemetry by default. The existing opt-in counters in the debug panel are enough:

- scenes created per week;
- edits per project (does chat editing get used more than once?);
- exports by type (HTML vs GLB vs clip);
- remix links opened;
- offline-edit success rate by engine — the clearest signal for Track B.

---

## 6. Deliberately out of scope

Photorealism, node graphs, accounts and cloud sync, a plugin marketplace, more engines, and server-rendered Open Graph images. Each dilutes the two things that make this product distinct: it runs on your machine, and you change it by talking.

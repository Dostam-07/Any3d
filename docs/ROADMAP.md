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
| 3 | Atmosphere: time of day + weather | **Partial** | Payload carries `look`; all four kernels contain the look path; SVG verified (mean luma 0.533 → 0.424 at night, 0 bundle requests while scrubbing). Worlds, Pixel and Dither visual parity is unmeasured |
| 4 | Diff, seed lock, surprise deck, Ask | **Shipped, one gap** | `src/lib/diff.ts` + `VersionDiff.tsx` (now also on the project page), seed plumbing, `surprise-deck.ts`, `/api/ask-scene`; locked-seed reproduction is still unmeasured |
| 5 | Embed snippet + storyboard | **Shipped, verification gaps** | `public/embed.js` at 1,355 B gzipped; storyboard 2400×1350 with burned-in name; `file://` untested; no published demo; storyboard is SVG-only |
| 6 | Image→palette, product-shot, multi-scene | **Partial** | `/api/extract-palette` + `PaletteFromPhoto` + guide shipped; product-shot and multi-scene not started |

### Shipped outside the old roadmap

- **Deterministic offline editor** (`server/llm/offline-editor.js`): add/remove, move/scale, motion (spin, bob, sway, pulse, orbit), hover lift and themes without a model call. 67 assertions. Currently SVG-only.
- **10 new SVG presets** — barbershop, gym, laundromat, library, arcade, classroom, food truck, greenhouse, campsite, patisserie — bringing the library to **44** (30 SVG, 7 Worlds, 3 Pixel, 4 Dither).
- **Responsive UI pass** — chat overlays the stage on phones, project toolbar collapses secondary actions into a menu, scene header no longer clips, light-mode contrast fixed, `100dvh` layout.
- **Local telemetry + debug panel** — opt-in counters for scenes, edits, exports and remixes; no network.
- **README refresh** — 44 presets, engine-specific validation, offline-edit capabilities, responsive workspace.

### Corrections to earlier claims

- Payload tests are **369 assertions**, not 182.
- Presets are **44**, not “30+”.
- The project page now has version diff, not only the Studio.
- “Atmosphere is SVG-only” is no longer true at the code level: all four kernels handle the look message. What is missing is **measured parity** on Worlds, Pixel and Dither.

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

**A2 · Measure locked-seed reproduction.**
Add a script that runs the same prompt twice with a locked seed against a deterministic provider, then compares the two scenes. Report code identity for procedural scenes and a pixel delta for model scenes.
*Acceptance:* the guide states a measured threshold and the exact command; the claim “same seed ≈ same scene” is either backed by numbers or softened.

**A3 · Finish the remix entry points.**
Add **Remix** to preset cards and to the export/share surface. Remix opens a new project with the scene loaded as version 1 — no model call, no shared-link trust gate.
*Acceptance:* from gallery → Remix → project with the scene, one version, and the preset name in the title; the source project is untouched.

**A4 · Publish the embed demo.**
Move the fixture out of `.tmp/embed` into `docs/` with a static demo page and a copy-paste snippet. Exercise `file://` in a real browser and record the result.
*Acceptance:* a link in the README opens a working embed; reduced-motion path verified; `file://` either verified or documented as a known limitation with the reason.

---

### Track B — Editing parity (shipped: look, undo, actionable failures)

Chat editing is the product’s differentiator, but the instant path only covers SVG.

**B1 · Offline look and theme on every engine.**
Wire the deterministic path to the look/theme message for Worlds, Pixel and Dither (no code rewrite needed). Keep structural edits model-only there.
*Acceptance:* `make it night` changes all four engines with zero model calls; unsupported requests return a short, accurate reply with a one-click **Use model** action.

**B2 · Undo the last edit from chat.**
Add `/undo` and an **Undo** button in the composer. It restores the previous checkpoint without creating a new one.
*Acceptance:* after an edit, `/undo` restores the exact prior code; a second `/undo` walks back another version; no new checkpoint is added.

**B3 · Resolve references and recover from failure.**
Resolve “it”, “that”, “the car” against the last edited object. When an offline edit cannot run, reply with two concrete rephrasings instead of a generic failure.
*Acceptance:* a three-turn conversation (“add a car” → “make it red” → “move it left”) applies each step to the same object; failed edits offer usable next prompts.

---

### Track C — Discovery and onboarding (shipped)

44 presets are only useful if people can find them.

**C1 · Search and filter the gallery.**
Text search plus engine and subject filters, keyboard navigation, and an empty state that suggests a prompt.
*Acceptance:* filtering to SVG + “food” surfaces the food truck; keyboard-only selection works; no layout shift at 390 px.

**C2 · Start from a preset inside a project.**
A “Start from a preset” row on the project empty state, using the same Remix path as A3.
*Acceptance:* two clicks from a blank project to a rendered scene with one version and a sensible title.

**C3 · First-run panel.**
Show model status (Ollama detected / key missing), an engine picker and three starters. Replace blank-canvas states with one clear next action.
*Acceptance:* a new user can tell whether a model is available before typing; no dead ends when the API is down.

---

### Track D — Distribution polish (shipped; canvas storyboards dropped)

**D1 · Share card instead of Open Graph.**
Hash payloads cannot be rendered by a server, so generate a PNG preview client-side and use the Web Share API where available, with a download fallback.
*Acceptance:* sharing produces a link plus an image on supporting browsers; the fallback still copies the link.

**D2 · Decide the canvas storyboard.**
**Decided: drop it for v2.** The camera lives inside Three.js, so four angles is real work for a low-frequency export. The button stays disabled with that explanation, and canvas storyboards are no longer planned.

**D3 · Share-size guardrails.**
Show the size verdict earlier, and switch the primary action to **Export HTML** above `SHARE_ROUTE_SOFT_LIMIT`.
*Acceptance:* a scene over 6 KB offers the file path first; the link path remains available but secondary.

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

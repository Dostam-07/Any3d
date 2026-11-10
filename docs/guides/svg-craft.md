# The ten rules of the look

They describe the look: an orthographic isometric camera, a pale blue-grey world, matte blocks in a few saturated accents, one warm sun with soft shadows, and hundreds of small objects that are each five to twenty primitives. Each rule has what it says, how to keep it with the kernel, and what gets a figure rejected.

## 01 · base: the world stands on a plate

A any3d is a thing on a table, not a view into infinity. Its base is a rounded slab, seen whole, and its shadows land on it.

- **Keep it:** `D.slab(w, d, pal.ground, 0, 0, 0, null, { h, r, side: pal.base })` first: the top is the ground colour, the walls the base colour, so no box of ground has to cover it. Zones on it (grass, roads, sand) are thin `D.box`es (`{ shadow: false }`) that stay at least `r` away from the slab's corners, because a rectangle laid to the edge pokes out of the rounded corner. A road that reaches the edge does so on a straight part, never at a corner. Keep every object inside the slab, paths included: a lap that leaves the base reads as a bug. Hero slabs run 30–46 units wide; card slabs 8–12; mini slabs 2.5–4. The kernel lays a soft shadow under the first slab (`halo`, by theme), the blur that sits the plate on the page: leave it on; a host page that draws its own shadow can set `halo: 0`.
- **Rejected when:** there is no slab; a road, a rail or a zone pokes out of a rounded corner; a vehicle leaves the base; the slab is cut by the frame; the scene floats on the page background with no ground.

## 02 · camera: true isometric, seen from the front-left

The kernel's camera is orthographic at azimuth 45° and elevation 35.264°, fitted to the world's bounds. A hero on a 3:2 stage wants a wide base and an azimuth of 30–40, so the long side runs along the frame.

- **Keep it:** set `camera: { az, el, pad }` once and build to it; the kernel fits. Put the thing that matters toward the front-left (positive x and z), where nothing hides it. Tall things go at the back (negative z). Leave `el` alone unless the scene is a tower.
- **Rejected when:** the camera is perspective; the fit is fought with a hand-placed camera; the subject hides behind a building; the base is too deep for the stage so the scene is a small island in a big frame.

## 03 · palette: pale world, few accents

The world is near-white and warm grey; colour belongs to the subject. The kit's palette leans warm on purpose, away from the reference's cobalt: coral and terracotta for the thing that matters, mustard for marks and beams, teal, sage, plum and rose for the rest, sky for glass and water, and shades of paper and ink for everything else. The themes keep this: `mono` and `line` reduce it to one accent, `night` darkens the world and keeps the accents.

- **Keep it:** take colours from `pal`: `base`, `ground`, `grass`, `sand`, `water`, `asphalt`, `line` for the ground; `paper`, `cloud` for walls and bodies; `ink`, `steel`, `slate`, `mist` for frames, tyres and posts; `coral`, `terracotta`, `mustard`, `teal`, `sage`, `plum`, `rose`, `mint`, `sky` as accents, two or three per scene (`cobalt` exists, but it is the reference's colour: use it only when it is the brand's). Name the one that matters most and paint it with `pal.accent`: it is the subject's colour in every theme, the colour `mono` and `line` keep, the one the bench's swatches swap live (a letterbox, a boat's hull, a truck's cab, a rack's beams). A product's brand goes in through `theme: { accent: … }`, and a second colour through `palette: { cobalt: … }`, never through new hex literals. The validator counts hex literals in the figure: ≤ 6 in a mini, ≤ 10 in a card, ≤ 14 in a hero.
- **Rejected when:** the ground is saturated; more than three accents compete; a black or a pure white; a colour used for nothing in particular; a figure that only reads in colour (switch to `mono` and look: the shapes must still tell the story).

## 04 · material: matte blocks, no textures

Every surface is a flat colour in one tone per face: the kernel lights each face by where it faces (the sun, the fill, the sky) and paints it as one flat polygon, the way an illustrator shades a block; a cylinder gets a band per segment, a sphere a disc with a crescent. The only exceptions are a label on a sign and an emissive on a lamp or beacon, which `night` turns up and `line` turns off.

- **Keep it:** pass a colour string to every primitive; the kernel caches the material in the theme. For a lamp: `{ mat: { emissive: pal.lampGlow, emissiveIntensity: .5 } }`. For a beacon that blinks, keep the mesh and set `material.emissiveIntensity` in `tick` (multiply by `ctx.theme.glow` if it must respect the theme). For a beam of light or a wake: `{ mat: { transparent: true, opacity: .35 } }`.
- **Rejected when:** a texture, a gradient, glass, a metallic look, a glow sprite; a cylinder with forty segments where twelve would do (every band is a shape to paint).

## 05 · parts: every object is a few primitives with its giveaways

A forklift is a yellow body, an orange counterweight, two mast rails, a carriage with two forks, four wheels, a driver and a beacon: twenty primitives. A tree is a trunk and two balls. A truck is a trailer, a stripe, a cab, a windscreen and eight wheels. The giveaways (the features from the concept list) are what make it recognisable at 400px.

- **Keep it:** build each object in its own `D.group` at the origin, nose toward +x, then place the group. Use `D.props.*` for trees, bushes, people, lamps, crates, pallets, cones and flags. Give a vehicle at least four wheels (`D.wheel`), a building a roof of a different colour with a parapet and roof units, a rack posts and beams in two colours. Size: a person is 0.9 tall, a forklift 2.3, a truck 3.6, a lamp 3.2, a tree 2–3, a building 5–7. Keep one scale across the scene. **Finish** is the small things that say a block was made, not placed: a sill under each window, a step at each door, a kerb along a road, a hub on each wheel, a cap on each chimney, a ridge on each roof, a base plate under each post, a handle on each door. Density comes from structure, never from texture; and every part sits on another part, so nothing floats and nothing sinks. **Insides** are built as shells: a fridge, a cupboard, a vending machine, a garage is a back, two sides, a top and a bottom around what is inside, never a solid block with things buried in it, because the painter draws whole pieces back to front and cannot cut a hole in a solid; a box buried in another shows through it or vanishes. A thing set into a face (a window in a wall, a door on a cabinet, a sign on a box) is a thin box just proud of that face, and takes `{ on: wall }` when it must paint right after it.
- **Rejected when:** an object is a single box; two objects are the same box in two colours; a wheel is missing; a building is a box with no roof; a scene is a grid of identical things; a lamp head with no post, a sign with no feet, a part that hangs in the air; shelves drawn inside a solid cabinet; a window sunk into its wall.

## 06 · shadows: one sun, soft shadows, everything casts

The sun comes from the front-left and above, with a cool fill from the back-right so shaded faces still show their colour; shadows fall toward the back-right, as flat shapes thrown on the ground, the way a cut-out throws them under a lamp. They give the blocks their volume and tie everything to the ground. `line` and `print` have no thrown shadows: there, edges and silhouettes do that work, which is why a figure must also read as shapes (rule 03).

- **Keep it:** every primitive throws its outline along the sun onto the ground under it (the slab it stands on, at that slab's height), and the shadows land on the slabs only. Mark ground markings and glows `{ shadow: false }` so they throw none. A shadow does not fall on another object (a truck's shadow does not climb a wall), so keep the things whose shadows matter where the ground shows. If something big is added after `build`, call `ctx.fit()`.
- **Rejected when:** shadows are off in a solid theme; a flat marking throws a shadow (it shows as a dark slab beside it); a thing that floats with its shadow at its feet.

## 07 · clock: all motion comes from `ctx.t` in `tick`

One loop, in the kernel, sleeps offscreen and when the tab is hidden, and renders a single still frame under reduced motion. A figure writes no timers.

- **Keep it:** everything in `tick(ctx)` is a function of `ctx.t`, so any second of the loop can be drawn alone: `D.phase(t, period)` for a lap, `D.pulse(t, period, width)` for something that happens now and then, `D.wave(t, period)` for a sway. Use `ctx.dt` only for springs. Keep `tick` cheap: no allocations, no `new THREE.*`, no searching the scene.
- **Rejected when:** `requestAnimationFrame`, `setTimeout`, `setInterval` or a CSS animation in the figure; a counter that accumulates so the still frame differs between loads; `tick` allocates every frame.

## 08 · laps: vehicles ride paths on a schedule

A vehicle is believable when it follows a road, turns at corners, stops for a reason and starts again, and its wheels turn with the ground.

- **Keep it:** `D.path([[x, z], …], closed, round)` on the lane's centreline, with corners rounded wide enough for the vehicle's length (.5 for a car, 3–4 for a truck); in `tick`, turn the lap's phase into a distance with an ease per leg (drive, wait, drive), then `D.place(group, path, dist)` and `D.spin(wheels, dist, r)`. Build the vehicle nose toward +x. One lane carries one direction, and vehicles that share a lane run at one speed (`T = path.length / speed`), a fixed share of the lap apart. Keep furniture a vehicle-length from every corner: the nose and tail sweep outside it. Give a stop a cause: a door opens, forks lift, a light changes.
- **Rejected when:** a vehicle slides without turning its wheels; it moves at one speed forever; two vehicles meet head-on or pass through each other in one lane; it passes through a building, a tree or a parked car (`look.mjs` lists these as `clash`); it turns around in its own length; it teleports at the end of the lap (an open path needs a return leg, or a closed path).

## 09 · tempo: a few loops, different periods, something rare

A scene reads as alive when two or three things keep their own time and one thing only happens now and then. A scene where everything moves all the time reads as noise; a scene where one thing moves reads as a gif.

- **Keep it:** a hero has three or four loops (a lap of 20–30 s, a shuttle of 10–15 s, a walk of 15 s, a flag at 2 s) and a blink. A card has one or two. A mini has one ambient motion with a long period (6–10 s) and a short active part (`D.pulse(t, 7, .35)`). Stagger repeated things with `D.stagger(i, from, step)`.
- **Rejected when:** every period is the same; everything oscillates on a sine; nothing pauses; a mini does laps.

## 10 · quiet: words stay out of the scene

The scene is understood from its objects. Words go around the stage: the title, the `means`, and whatever the person's own UI puts beside the figure. The scene itself carries none: a sign half hidden by a roof reads as a glitch, and a brand on a wall is the brand's call, not yours.

- **Keep it:** no `D.label` in a mini or a card, and at most one in a hero, only when the product asked for its mark. Say "nothing here" by showing the empty thing, not by writing it. Colour says where to look: the one accent on the object the eye should start at. A building is told by its roof, its windows and its door, not by its name.
- **Rejected when:** text floats in the air; an arrow; an icon; a number; a mini with a label; a scene that cannot be understood without its title.

## The six themes

A theme is a set of fields the kernel applies to every primitive; a figure never branches on it. Declare it as a name or as `{ base, …overrides }`.

| Theme | Reads as | Keeps | Adds | Use it for |
| --- | --- | --- | --- | --- |
| `toy` | pastel blocks, warm sun, soft shadows, cool fill | all colours | | product pages, READMEs, anything warm |
| `soft` | the same on cream, gentler light, desaturated accents | all colours (shifted) | | editorial pages, cream or paper backgrounds |
| `mono` | tints of ink on white, one accent | the `accent` | `tone { paper, ink }`, `tint` | docs, product UIs with their own accent, text-heavy pages |
| `line` | a hairline drawing: white fills, ink edges, silhouettes, no shadows | the `accent`, as a stroke with a faint fill | `edges`, `outline`, `stroke`, `strokeWidth`, optional `round` | minimal or technical pages, quiet empty states |
| `night` | dusk: dark base, cool sky, warm lamps and windows | all colours, darker world | `glow` 2.6 | dark pages, hero sections on black |
| `print` | flat tones per face (top, lit side, dark side) and ink lines, no thrown shadows: a printed illustration | all colours | `tones`, `edges` | editorial pages, docs that want a drawing, anything Colorfigures-like |

Fields every theme takes, in the figure's `theme: { … }` or on `Any3d.mount(fig, { theme })`:

- `bg`, `palette`, `accent`: the stage colour, palette overrides, the one colour mono and line keep.
- `lights: { hemi: [sky, ground, i], sun: [c, i], fill: [c, i] | null, ambient: [c, i] }`: four lights, any of them replaceable.
- `shadows`, `finish: { roughness, metalness }`, `glow`.
- `tone: { paper, ink }` and `tint` (0..1): turn any theme monochrome, or let some colour back in (`tint: .3` is a hand-tinted print).
- `edges`, `outline`, `stroke`, `strokeWidth`: ink lines on flat solids, silhouettes on round ones, their colour and width in css px. Add them to `mono` for a drawn look with shadows.
- `round`: every `D.box` becomes a rounded `D.rbox`; with `line` that gives rounded, hairline-like solids (and reads best on simple scenes, since the top edges of boxes vanish).
- `halo`: 0..1, the soft shadow the base throws on the page (toy .3, soft .24, mono .26, line .16, night .6; 0 for none).
- `wobble`: css px of hand tremor on the ink (0; 1.2 a pen, 2.5 a felt tip). Only where the theme draws ink.

### Drawn by hand

`line` with `wobble` is a figure drawn by hand: every ink edge is split in eight and bowed a little, its own way; one end in three runs past the corner; the silhouette of a round thing thickens and thins like a pen's. The ends stay put, so lines still meet. It suits an empty state that should feel warm rather than technical, an editorial figure, a brand that sketches. Keep the figure simple: the wobble is strongest on long straight edges (a slab, a wall) and turns parts under ten pixels to fuzz, so a hand-drawn mini has fewer, bigger parts. `wobble` is in css px: 1.2 reads as a fine pen at 220px, 1.6 on a card, 2 and above as a felt tip. `edges: true, wobble: 1.4` on `mono` gives a drawn figure that still has shadows.

What the themes change in the rules: in `mono` and `line`, choose the accent for the thing the eye should find (the beams of an empty rack, the letterbox) and nothing else; in `line`, keep flat ground markings `{ shadow: false }` so they draw no edges, and prefer `D.cyl` with 12+ segments so seams do not show; in `night`, give lamps and windows an `emissive` so they are the light.

## Proportions and the frame

- Units are metres, roughly. A person 0.9 tall is the yardstick.
- The scene should fill 55–75% of the stage. The kernel fits the bounds; what you control is the base's shape (wide for a 3:2 hero, square for a mini) and the azimuth.
- Put the subject toward the centre-front. Trees, lamps, bushes and cones go along the edges and corners, where they frame without hiding.
- Keep the back-right corner lower than the front-left so nothing is hidden behind a tall thing.

## Recipes

Every example is built from these. Positions are in the object's own group, nose toward +x.

**Building (hero).** Shell `D.box(w, 5.4, d, pal.paper)`; roof `D.box(w+.3, .5, d+.3, pal.cobalt)` above a `pal.cloud` parapet; roof units `D.box(1.4, .8, 1.4, pal.cloud)` with a `D.cyl(.45, .45, .2, pal.slate)` fan; a `pal.safety` stripe along the front; windows `D.box(1.2, .8, .06, pal.sky, …, { shadow: false })` on the face; dock doors `pal.cloud` frames with `pal.steel` doors, `pal.ink` bumpers, an `ok`/`bad` lamp with `emissive`.

**Truck.** Trailer `D.box(7.2, 2.5, 2.4, pal.paper)` with a stripe; chassis `pal.steel`; cab `D.box(2, 2.1, 2.3, pal.cobalt)` at +x with a `pal.ink` windscreen; eight `D.wheel(.46, .36)` with `pal.hub` centres. 3.6 high.

**Forklift.** Body `pal.safety`, counterweight `pal.flame` at −x, four `pal.steel` mast posts, carriage group at +x with two forks, a `pal.warn` beacon with `emissive`, driver `D.props.person` at y .55 turned to face +x, wheels .3 front and .26 rear.

**Rack.** `pal.cobalt` posts (.12 square, 3.2–4 tall), `pal.safety` beams per level, `pal.cloud` decking, `pal.ink` feet. Loads: `D.props.pallet(x, y, z, parent, { h, color })`.

**Road.** `D.box(len, .03, 3.6, pal.asphalt)` with `D.box(1.1, .012, .14, pal.line)` dashes every 2.2 units; centrelines 1.8 from the edge.

**Van.** `D.box(3.4, 1.6, 1.8, accent)` body, `pal.paper` cab block at +x, `pal.ink` windscreen, four `D.wheel(.34, .3)`.

**Mailbox.** `pal.wood` post and cap; `pal.cobalt` box with a `D.cyl` laid on its side for the curved top; `pal.ink` inset for the dark inside; a door group hinged at the front; a flag group hinged on the side.

**People.** `D.props.person(x, z, parent, { shirt, hat, yaw })`: cylinder body, two short legs, a head, a hard hat. Give a walker a bob of `.05 * |D.wave(t, .5)|`.

**Trees and bushes.** `D.props.tree(x, z, parent, { r, kind })` with `kind` `round` (three lobes in three greens), `pine` (three cones) or `tall` (a poplar); vary `r` between .6 and .9 and `yaw` along a row, and mix kinds. `D.props.bush` (three lobes) at corners, `D.props.rock` at edges and on sand. Groups of three, never evenly spaced, never the same tree twice in a row.

**Water and islands.** The base itself can be water (`D.slab` in `pal.water`), with a sand `D.slab` of a large radius on it and a grass one on that, a low `D.dome` for a hill, a few thin `pal.line` boxes that drift and breathe for waves. Boats are a `D.rbox` hull with a cabin and a mast, nose toward +x, on a lap that stops at a pier of planks on posts.

**Lighthouse.** A tapered `D.cyl` in `pal.paper` with coral rings, an ink gallery, a `pal.sky` lantern with an emissive core, a coral cone roof, and a long thin emissive box as the beam, turning in `tick`.

**A cart or a kiosk.** A `D.rbox` body on four wheels, a wooden counter, two posts and a striped canopy of alternating boxes, a `pal.steel` machine with a steam of three small balls rising in `tick`, cups as short cylinders with an ink lid.

**Clouds and gulls.** `D.props.cloud` (three balls, no shadow) drifting from the clock, `position.x = wrap(x0 + speed · t)` with the start kept in `userData` (never `+= speed · dt`, which breaks the still frame and the loop); a gull is two thin boxes as wings that flap from a short wave, on a path above the scene.

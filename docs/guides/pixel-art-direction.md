# Art direction

What makes a frame read as a pixel-art miniature, and not as a small blurry 3D render.

## Resolution is the style

- Keep 320 x 240 (or 240 x 180 for a card, 360 x 270 at most for a hero). Every extra pixel moves the look toward "render". The page enlarges by a whole number, so pixels stay square.
- Fit the ground to the frame: an `rx` / `rz` of about 4.3 / 3.6 at 320 x 240. Set `camera.height` to the tallest thing so the fit leaves room for it.
- At this scale one unit is about 30 px. A head is 5–6 px, a hand 2 px, a plank 4 px. Design for that: a detail smaller than 0.05 units does not exist.

## Palette and ramps

- Muted naturals: sage and olive greens, warm greys, straw, umber, faded brick, dusty blue. One or two saturated accents per scene (a red float, a striped awning, the flowers) and nothing else loud.
- Every material is a ramp of four to six colours from dark to light, not one colour. Shadows lean cool (toward violet or blue-grey), lights lean warm (toward cream). Hex colours get such a ramp automatically; hand-pick ramps for the materials that cover the most pixels (ground, walls, roofs).
- Neighbouring materials need different values, not only different hues: at pixel scale, value is what separates a face from a sleeve, a post from a wall.

## Dithering

- The 8 x 8 Bayer matrix blends between two neighbouring ramp steps. A smooth lit gradient becomes a pattern, and that pattern is the look. Do not fight it on big surfaces.
- On small plain things (clothes, skin, a bucket) the spread is narrower by default (`dither: .55`), so they read as flat colour with a crisp edge. Raise it for a surface that should feel textured; lower it toward 0 for a sign or a face.
- The texture adds tone before the dither, so stones, planks and thatch show as patterns of two or three colours, like hand-placed pixels.

## Materials

- **Wood:** planks with dark gaps, per-plank tone and grain. Set `grain` to the axis the boards run along: `x` for a deck along x, `y` for vertical boards on a counter or a shed, `z` for cross planks on a pier.
- **Thatch:** streaks along the ridge (`grain: 'x'` on a `P.wedge`) in rows down the slope; a pale straw ramp.
- **Paving and stone:** running bond with grout lines; `size` .3–.45 for paving, .25 for bricks.
- **Grass:** stippled noise of three greens plus 2 px blade marks; it is the default ground.
- **Water:** blotches of two or three blues with lighter patches and time-stepped sparkles; a `shallow` band of a lighter ramp along the shore. Posts and hulls go below y = 0 and the water hides them.
- **Leaves:** `P.tree` and `P.bush` build crowns of round-shaded clumps: lit tops, dark undersides, a dithered terminator. Never one big ball.

## The ground edge

- The ground is an ellipse warped by noise whose edge dissolves into the page through the dither: dots thin out over `fade` units. No slab, no plinth, no outline. `wobble` .4–.5 gives an organic shape; keep things at least half a unit inside the edge.
- Zones (`ground.zone`) are where the scene's story starts: a paved square inside grass, a sandy shore before water, a brick path through soil. Warp zone borders with `P.noise` so they are not ruled lines.

## Light and shadow

- One warm sun from the side (`sun.az` around −40 to −60, `el` around 45): the shadows fall right and back, the faces toward the camera on the left are lit, the right ones shaded.
- Shadows come from a real shadow map, plus contact darkening where something stands close to the ground. Check them: every object should be grounded by a darker patch.
- `ambient` around .34 keeps the shade readable; lower it for a stronger afternoon, never under .25.

## People at pixel scale

- One action per person, posed clearly: `P.pose(p, 'work' | 'hold' | 'carry' | 'sit' | 'wave')`, then motion on top. Forearms forward and hands holding something with its own colour read; arms hanging by the sides read as a block.
- Put people where the camera sees them whole: in front of counters, not behind posts or under roofs. Face them toward the camera's side (+x or +z) when you can: the backs of heads are dark hair blocks.
- Give the action a rhythm: anticipation, the act, a rest. A strike, a pour or a wave for the press, lasting one to two seconds.
- Hats and aprons are the cheapest way to tell people apart at 30 px.

## Composition

- One place, one story, 10–25 objects. A focal group near the centre, quieter things toward the edge, nothing cut by the frame.
- Something tall at the back (a tree, a pole with a flag, a fence) gives depth; something small in front (a stone, a pot, a bush) gives scale.
- Two or three loops with different periods: cloth (fast), water or leaves (medium), the action (the loop).
- The still frame shows the action at its most telling moment: the can tipped, the float dipping, the bouquet held up.

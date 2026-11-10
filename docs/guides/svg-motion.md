# Motion

Everything moves from `ctx.t` inside `tick(ctx)`. The kernel runs the loop, sleeps it offscreen, stops it when the tab is hidden, and under reduced motion draws one still frame at `still` seconds. A figure poses its parts; it never schedules anything.

## The helpers

| Call | Gives | Use for |
| --- | --- | --- |
| `D.phase(t, period, offset)` | 0..1, sawtooth | where in a lap, a cycle, a blink |
| `D.wave(t, period, offset)` | −1..1, sine | sway, bob, flutter |
| `D.pulse(t, period, width)` | 0..1 bump once per period, lasting `width · period` | something that happens now and then |
| `D.smooth(u)` `D.out(u)` `D.inOut(u)` | eased 0..1 | the shape of a move; `inOut` for vehicles, `smooth` for doors and lifts |
| `D.lerp(a, b, u)` `D.clamp(v, a, b)` | | |
| `D.path(points, closed)` | `{ length, at(dist) → { x, z, yaw } }` | roads, aisles, walks |
| `D.place(group, path, dist)` | puts the group on the path, nose (+x) along it | vehicles, walkers |
| `D.spin(wheels, dist, r)` | turns wheels by distance travelled | any `D.wheel` |
| `D.spring(k, c)` | `{ x, t, step(dt), set(x) }` | the pointer's answer, a lift that settles |
| `D.stagger(i, from, step)` | `|i − from| · step` | a row that reacts outward from a point |

## A lap with stops

Turn the cycle's time into a distance leg by leg. Each leg is a range of seconds; inside it, ease from one distance to the next; between legs, hold.

```js
var T = D.phase(t, 24) * 24, L = p.loop.length, dock = 14.7, dist;
if (T < 9) dist = D.inOut(T / 9) * dock;                       // drive to the dock
else if (T < 14) dist = dock;                                  // wait five seconds
else dist = dock + D.inOut((T - 14) / 10) * (L - dock);        // drive the rest of the lap
D.place(p.truck, p.loop, dist); D.spin(p.tw, dist, .46);
```

Give the stop a cause in the same clock: the dock door opens as the truck arrives and closes as it leaves.

```js
var open = D.smooth((T - 8.4) / 1.2) * (1 - D.smooth((T - 13.6) / 1.2));
door.scale.y = 1 - .85 * open; door.position.y = 1.55 - 1.3 * open;
```

A closed path (`D.path(points, true)`) loops seamlessly. An open path needs a return: drive out, turn (add π to `rotation.y`), drive back.

## Corners, lanes and speed

`D.path` rounds every corner with an arc (radius .5 by default; the third argument sets it, 0 is sharp), so a vehicle turns instead of snapping to the new heading. Give a long vehicle a wide arc: a truck of 7 needs `D.path(points, true, 4)`, and its nose and tail sweep outside the corner while it turns, so keep trees, lamps and parked things a vehicle-length away from a corner, and keep the corner itself that far from the base's edge. The arc shortens the path a little, so read stops from `path.length` or check the still frame rather than trusting a distance worked out on paper.

One lane, one direction, and nothing shares it at two speeds: two vehicles in the same lane at different periods pass through each other once a minute. Either give every lane one vehicle, or run the ones that share a lane at the same speed, a fixed share of the lap apart: `T = path.length / speed` for all of them, with `D.phase(t, T, offset)`. Lanes side by side need the width of both vehicles between their centrelines plus a hand's breadth; at a corner the inner vehicle's arc should not cut into the outer lane.

`scripts/look.mjs` prints `clash`: every moving part that passes through another part during the first 40 seconds, with its depth and the second it first happens. A vehicle through a tree, a car through a bus, a tractor inside a barn: fix the lane, the schedule or the furniture. Forks inside a rack, a flag on its hinge, an arm holding a rocket: contacts on purpose, leave them.

## A shuttle

Out loaded, lift, set down, lower, back empty, reload: six legs of one 12 s cycle. Visibility and scale sell the hand-off: the load on the carriage shrinks to nothing as the one on the shelf grows.

```js
var F = D.phase(t, 12) * 12, R = p.run.length, d, up, loaded;
if (F < 4)        { d = D.inOut(F / 4) * R; up = 0; loaded = 1; }
else if (F < 5.2) { d = R; up = D.smooth((F - 4) / 1.2); loaded = 1; }
else if (F < 6.4) { d = R; up = 1; loaded = 1 - D.smooth((F - 5.2) / 1.2); }
else if (F < 7.6) { d = R; up = 1 - D.smooth((F - 6.4) / 1.2); loaded = 0; }
else if (F < 11.6){ d = (1 - D.inOut((F - 7.6) / 4)) * R; up = 0; loaded = 0; }
else              { d = 0; up = 0; loaded = D.smooth((F - 11.6) / .4); }
```

## Ambient motion

- **A flag:** `cloth.rotation.y = .25 * D.wave(t, 2.1) + .1 * D.wave(t, .7)`: two sines of unrelated periods so it never repeats visibly.
- **A beacon:** `material.emissiveIntensity = .2 + .8 * (D.phase(t, .8) < .5 ? 1 : 0)`.
- **A walker:** a path, `wd` going out for half the cycle and back for the other, `rotation.y += Math.PI` on the way back, `position.y = .05 * Math.abs(D.wave(t, .5))` for the step.
- **Something rare:** `var check = D.smooth(D.pulse(t, 7, .36))` then `flag.rotation.z = D.lerp(.2, 1.45, check)`: still for most of the period, a move in the middle.
- **A door that sways:** `door.rotation.z = -1.25 + .06 * D.wave(t, 3.2)`.

In a mini, one of these is enough. In a hero, three or four with different periods, so the whole never repeats.

## The pointer

The kernel gives three things without a line of code: `ctx.pointer` (`x`, `y` in −1..1, `inside`, `world` on the ground plane), `ctx.hover` (the group under the pointer among `parts.hot`), and the camera tilt (a few degrees toward the pointer, sprung). On a hero or card add one answer:

- **Lift what is under the pointer.** A spring per hot group, target .35 when hovered, 0 otherwise; `group.position.y = s.x`.
- **Light a level.** Swap the beams' material to a `D.mat(pal.safety, { emissive: pal.safety, emissiveIntensity: .55 })` while hovered; swap back after. Materials are cached, so make the two once in `build`.
- **Send something there.** The forks' spring target becomes the hovered level's height; with no hover it goes back to the ambient value.
- **Look at it.** A driver's head turns toward `ctx.pointer.world`.
- **Tap to keep it.** The same answer on `ctx.active`, so a phone can hold what a hover previews.

Springs make the answer and the return calm; never set a pose directly from the pointer. Test the pick against what is at rest (`parts.hot` are groups; a lifted group is still picked where it stands). Name every hot group (`g.name = 'tram'`): the bench and the site show the name as a read-out while the pointer is on it, which is how a visitor learns what answers.

## The press

A click or a tap is a press. The kernel records it: `ctx.pressed` is the hot group under the last press (or null), `ctx.pressedAt` its second, `ctx.active` the group switched on by a press until it or another is pressed again, and `ctx.pointer.down` while the button is held. Touch has no hover, so on a phone the press is the only answer there is: a hero or a card gives one thing a press, and the hint says so ("tap the control room to launch now"). Three shapes:

- **A switch.** `ctx.active === p.lamp` turns the lamp on and keeps it on; pressing again turns it off. The same spring that answers the hover answers this, with `ctx.hover === g || ctx.active === g` as its target, so a tap on a phone does what a hover does on a desk.
- **A call.** A press moves the clock to the moment the visitor asked for, and the loop goes on from there, seamless:

```js
if (ctx.pressed === p.bunker && ctx.pressedAt !== p.lastPress) {   // one press, once
  p.lastPress = ctx.pressedAt;
  if (D.phase(t - p.base, 20) * 20 < 12) p.base = t - 12;          // only while the rocket waits
}
var T = D.phase(t - p.base, 20) * 20;                              // T is 12 now: the arm swings
```

  `p.base` starts at 0 and only a press changes it, so the still frame and the loop stay reproducible; nothing accumulates.
- **A pick.** A press on a level sends the forks there and keeps them there until another level is pressed; the hover previews, the press commits.

Never run an event from a press that leaves the scene half way: a rocket that teleports home when the next press lands is a bug. Guard the call with the phase, as above.

## Taking it apart

Hover a thing and it comes apart into what it is made of, then closes when the pointer leaves: a rocket into its stages, a building into roof and floors, a machine out of its cover. `D.apart` does the motion:

```js
var apart = D.apart([{ g: nose, y: 1.5 }, { g: body, y: .7 }], { stagger: .08 });            // in build, outermost first
apart.open((ctx.hover === p.rocket || ctx.active === p.rocket) && !busy); apart.step(ctx.dt);   // in tick
```

Each item is a group and the vector it moves along, times a sprung 0..1; the first leaves first and the rest follow one `stagger` later each, and closing runs the order backwards, so the parts that left last come home first and nothing passes through anything. Build the thing in groups at their assembled places; list them outermost first; give each part a vector along which it clears the others (a nose up, a side panel out, a drawer forward). Hold it shut while the thing is busy (`!busy`: a rocket in flight stays whole).

## The read-out

`ctx.read` is one line the figure writes every frame, shown under the stage when the pointer is on nothing: what the scene is doing right now, from the same clock that poses it. `'truck · at the dock'`, `'boat · out round the island'`, `'on the pad · T−8 s'`, `'lift-off · 9 m'`. Keep it under forty characters, name the thing then its state with a middle dot, and let a number in only when it comes from the model (the count from `T`, the height from `rise`), never a made-up one. The read-out is how a visitor learns the scene is a working model with a schedule and not a gif; a phase word that lags the picture is a bug, so compute it from `T` beside the pose, not from a second clock.

## The still frame

Reduced motion, a thumbnail, and the look's `rest` picture all draw the loop at `still` seconds, once. Choose the second where every loop is in a telling place: the truck at the dock with the door open, the forklift with the forks up, the walker mid-aisle, the flag out. Check it on the sheet.

## Cost

`tick` runs sixty times a second. Keep it to arithmetic and property sets: no `new o.M.Vector3()`, no array allocations, no `world.traverse`, no material creation. Make every material in `build` and swap references in `tick`. A part that does not move costs nothing to draw again (the kernel keeps its shapes), so the frame is the movers: a hero of 400 primitives with twenty of them moving draws in a few milliseconds on a laptop; the look prints the time in headless Chromium as a hint.

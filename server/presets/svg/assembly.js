/* assembly · a card in mono with one accent: a build queue as a conveyor.
   Build queue. Jobs are boxes on a belt; they pass a scanner gate that
   lights up as each one goes through, and a robot arm stamps each one on
   its way to the pallet. Hover a box and it lifts; tap the gate and the
   belt holds (the gate turns red) until you tap it again. The read-out
   counts what is waiting. Mono, with the gate's light as the accent.
   Parts · ground: the slab, a painted lane, a floor grid. Structure: the
   belt and its legs, the gate, the arm's base and column, the pallet, the
   control panel. Movers: the boxes, the arm's head, the gate light. Furniture:
   a bin, a worker at the panel, a cone. Light: the gate light, the panel. */
Any3d.figure({
  name: 'assembly',
  size: 'card',
  theme: { base: 'mono', accent: '#2a9d8f' },
  title: 'Build queue',
  means: 'Jobs ride the belt one at a time through the scanner and under the stamp; the belt holds when you ask.',
  hint: 'Hover a box and it lifts; tap the gate to hold the belt, tap again to run.',
  camera: { az: 38, el: 34, pad: 1.06 },
  still: 3,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(12.4, 8, pal.ground, 0, 0, 0, null, { h: .6, r: 1.1, side: pal.base });
    for (var i = -4.5; i <= 4.5; i += 1) D.box(.02, .012, 7, pal.cloud, i, .02, 0, null, { shadow: false });
    D.box(9.6, .03, 2.2, pal.cloud, 0, .03, .2, null, { shadow: false }); D.box(9.6, .012, .1, pal.accent, 0, .045, 1.3, null, { shadow: false });
    /* the belt: a long band on legs, rollers along its sides */
    var belt = D.group(0, 0, .2);
    D.box(9, .12, 1.4, pal.steel, 0, 1.0, 0, belt); D.box(8.8, .3, 1.2, pal.ink, 0, .8, 0, belt);
    [-3.9, -1.3, 1.3, 3.9].forEach(function (x) { [-.5, .5].forEach(function (z) { D.box(.12, .66, .12, pal.slate, x, .33, z, belt); }); });
    for (var r = -4.2; r <= 4.2; r += .6) { D.wheel(.08, .06, pal.mist, r, 1.06, .72, belt); D.wheel(.08, .06, pal.mist, r, 1.06, -.72, belt); }
    /* the boxes: four jobs a fixed share of the belt apart; each wears a label stripe once stamped */
    var boxes = [], L = 9;
    for (var b = 0; b < 4; b++) { var g = D.group(0, 1.06, .2); D.box(.9, .7, .8, pal.cardboard, 0, .35, 0, g); D.box(.2, .012, .82, pal.paper, 0, .71, 0, g, { shadow: false }); var stamp = D.box(.3, .3, .012, pal.accent, 0, .4, .41, g, { shadow: false }); g.name = 'job ' + (b + 1); hot.push(g); boxes.push({ g: g, stamp: stamp }); }
    /* the gate: two posts and a beam with a light bar */
    var gate = D.group(-1.6, 0, .2); gate.name = 'scanner gate'; hot.push(gate);
    [-1.0, 1.0].forEach(function (z) { D.box(.2, 2.4, .2, pal.steel, 0, 1.2, z, gate); });
    D.box(.3, .3, 2.2, pal.steel, 0, 2.5, 0, gate); var light = D.box(.14, .1, 1.8, pal.accent, 0, 2.3, 0, gate, { mat: { emissive: pal.accent, emissiveIntensity: .3 }, shadow: false });
    D.box(.3, .5, .3, pal.ink, 0, 2.9, 0, gate);
    /* the arm: a base, a column, an upper arm, a head that dips to stamp */
    var arm = D.group(1.4, 0, -1.6); arm.name = 'stamping arm'; hot.push(arm);
    D.cyl(.6, .7, .3, pal.ink, 0, .15, 0, arm, 16); D.cyl(.22, .26, 3.0, pal.steel, 0, 1.8, 0, arm, 12); D.box(.4, .4, .4, pal.slate, 0, 3.3, 0, arm);
    var upper = D.group(0, 3.3, 0, arm); D.box(.3, .3, 2.0, pal.steel, 0, 0, .9, upper); var head = D.group(0, 0, 1.8, upper); D.box(.4, .6, .4, pal.slate, 0, -.4, 0, head); D.cyl(.18, .18, .3, pal.accent, 0, -.85, 0, head, 12);
    /* the pallet at the end, a bin, the panel with a worker, a cone */
    var pal2 = D.props.pallet(5.6, 0, .2, null, { h: 0 }); D.props.crate(5.4, .15, .0, null, { w: .9, h: .7, d: .8 }); D.props.crate(5.8, .85, .3, null, { w: .9, h: .7, d: .8 });
    var panel = D.group(-3.8, 0, -2.2); panel.rotation.y = .5; D.box(1.0, 1.1, .4, pal.slate, 0, .55, 0, panel); D.box(.8, .5, .04, pal.accent, 0, 1.3, .1, panel, { mat: { emissive: pal.accent, emissiveIntensity: .5 }, shadow: false }); D.box(.9, .5, .3, pal.ink, 0, 1.3, -.05, panel);
    [-.25, 0, .25].forEach(function (x, k) { D.cyl(.06, .06, .04, [pal.bad, pal.mustard, pal.ok][k], x, .8, .22, panel, 10).rotation.x = Math.PI / 2; });
    D.props.person(-3.4, -1.2, null, { shirt: pal.plum, hat: false, yaw: 2.4 });
    var bin = D.cyl(.32, .28, .7, pal.steel, -4.6, .35, 2.4, null, 12); D.props.cone(4.2, 2.6);
    var lit = D.mat(pal.accent, { emissive: pal.accent, emissiveIntensity: 1.6 }), dim = D.mat(pal.accent, { emissive: pal.accent, emissiveIntensity: .3 }), red = D.mat(pal.bad, { emissive: pal.bad, emissiveIntensity: 1.2 });
    return { hot: hot, boxes: boxes, gate: gate, light: light, head: head, lit: lit, dim: dim, red: red, L: L, pause: 0, dip: D.spring(90, 14), lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    /* the belt runs at .75 units a second unless the gate is switched on (held): then its clock stands still */
    var held = ctx.active === p.gate; if (held) p.pause += ctx.dt;
    var bt = t - p.pause, waiting = 0, under = 0, inGate = false;
    p.boxes.forEach(function (b, k) {
      var x = ((bt * .75 + k * p.L / 4) % p.L + p.L) % p.L - p.L / 2;
      b.g.position.x = x; b.g.visible = x > -4.3 && x < 4.4;
      b.stamp.visible = x > 1.4;
      if (x < -1.6) waiting++;
      if (Math.abs(x + 1.6) < .5) inGate = true;
      under = Math.max(under, 1 - Math.min(Math.abs(x - 1.4) / .25, 1));
    });
    p.light.material = held ? p.red : inGate ? p.lit : p.dim;
    p.dip.t = held ? 0 : under; p.dip.step(ctx.dt); p.head.position.y = -.62 * p.dip.x;
    ctx.read = held ? 'belt · held' : 'belt · ' + waiting + ' waiting';
    p.hot.forEach(function (g) { if (g === p.gate) return; var s = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18)); s.t = ctx.hover === g ? .25 : 0; s.step(ctx.dt); g.position.y = (g.userData.y0 == null ? (g.userData.y0 = g.position.y) : g.userData.y0) + s.x; });
  }
});

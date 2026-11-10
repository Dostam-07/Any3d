/* seedling · a mini in line.
   A terracotta pot full of soil and nothing growing, a watering can beside
   it. Now and then the can lifts, turns to the pot, tips, and a few drops
   fall from its rose onto the soil. Drawn in the line theme, with the pot
   as the accent. */
Any3d.figure({
  name: 'seedling',
  size: 'mini',
  theme: { base: 'line', accent: '#cf6a4c' },
  means: 'A pot of soil with nothing growing and a watering can that lifts and waters it now and then.',
  hint: 'Wait for the can to water the pot.',
  title: 'Pot and can',
  still: 1.6,
  build: function (o) {
    var D = o.D, pal = o.pal;
    D.slab(2.6, 2.6, pal.grass, 0, 0, 0, null, { h: .45, r: .45, side: pal.base });
    var pot = D.group(.3, 0, .15);
    D.cyl(.6, .46, .95, pal.accent, 0, .475, 0, pot, 20);
    D.cyl(.67, .65, .16, pal.accent, 0, .95, 0, pot, 20);
    D.cyl(.58, .58, .06, pal.ink, 0, 1.0, 0, pot, 20);
    // At rest the spout points away from the pot; it turns to face the pot as the can lifts.
    var can = D.group(-.75, 0, -.55); can.rotation.y = .5;
    var body = D.group(0, 0, 0, can);
    D.cyl(.34, .3, .7, pal.steel, 0, .35, 0, body, 16);
    D.cyl(.3, .3, .06, pal.steel, 0, .72, 0, body, 16);
    var spout = D.cyl(.04, .06, .9, pal.steel, .55, .55, 0, body, 8); spout.rotation.z = -1.0;
    var rose = D.cyl(.1, .07, .1, pal.steel, .95, .83, 0, body, 10); rose.rotation.z = -1.0;
    var handle = D.torus(.26, .035, pal.steel, 0, .85, 0, body); handle.rotation.y = Math.PI / 2;
    var drops = []; [0, 1, 2, 3].forEach(function (k) { drops.push(D.ball(.035, pal.sky, 0, 0, 0, null)); });
    D.props.rock(.95, -.8, null, { r: .16 }); D.props.rock(-.85, .8, null, { r: .12, yaw: 2 });
    return { can: can, face: -Math.atan2(.15 + .55, .3 + .75), body: body, rose: rose, drops: drops, nozzle: new o.M.Vector3(), soil: 1.03 };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    // Lifted off the ground and tipped, so the rose ends up over the pot, above the soil.
    var tip = D.smooth(D.pulse(t, 8, .4));
    var lift = D.smooth(D.clamp(tip * 1.6, 0, 1));
    p.can.rotation.y = D.lerp(.5, p.face, lift);
    p.body.rotation.z = -.55 * tip; p.body.position.y = 1.1 * lift;
    p.body.updateMatrixWorld(true);
    var n = p.rose.localToWorld(p.nozzle.set(0, .06, 0)), fall = n.y - p.soil;
    p.drops.forEach(function (d, k) {
      // Each drop leaves the rose and falls under gravity to the soil, then starts again.
      var u = D.phase(t, .45, k / p.drops.length);
      d.visible = tip > .85 && fall > 0;
      d.position.set(n.x, n.y - fall * u * u, n.z);
    });
  }
});

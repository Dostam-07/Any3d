/* observatory · a mini in line, drawn by hand.
   A small observatory on a grass tile: a round house with a dome, a slit
   in the dome and a telescope poking out of it, a door with two steps, a
   bench, a pine and a rock. The dome turns slowly; now and then the
   telescope lifts to look, finds nothing, and settles. For an empty state
   that should feel warm: wobble on the ink, the telescope as the accent.
   Parts · ground: the tile, three stepping stones. Structure: the house,
   the dome, the slit, the steps, the door. Movers: the dome and its slit,
   the telescope. Furniture: the bench, the pine, the rock. */
Any3d.figure({
  name: 'observatory',
  size: 'mini',
  theme: { base: 'line', accent: '#5b4ae0', wobble: 1.3 },
  means: 'An observatory whose dome turns; now and then the telescope lifts, finds nothing yet, and settles.',
  hint: 'Wait for the telescope to look.',
  title: 'Observatory',
  still: 2.2,
  build: function (o) {
    var D = o.D, pal = o.pal;
    D.slab(3, 3, pal.grass, 0, 0, 0, null, { h: .45, r: .45, side: pal.base });
    [[-.2, 1.05], [.1, .8], [.35, .55]].forEach(function (p) { D.box(.3, .03, .22, pal.cloud, p[0], .04, p[1], null, { shadow: false }); });
    /* the house: a drum with a door and two steps; the dome, its slit and the telescope turn together */
    var house = D.group(.25, 0, -.2);
    D.cyl(.72, .78, 1.0, pal.paper, 0, .5, 0, house, 24); D.cyl(.8, .8, .1, pal.ink, 0, 1.05, 0, house, 24);
    D.box(.34, .55, .06, pal.ink, 0, .3, .73, house, { shadow: false }); D.box(.5, .1, .3, pal.cloud, 0, .05, .9, house); D.box(.5, .1, .2, pal.cloud, 0, .15, .78, house);
    var dome = D.group(0, 1.1, 0, house);
    D.dome(.72, pal.paper, 0, 0, 0, dome);
    D.box(.16, .5, .9, pal.ink, 0, .4, .3, dome, { shadow: false });
    var scope = D.group(0, .25, .15, dome); scope.rotation.x = -.7;
    D.cyl(.1, .12, .9, pal.accent, 0, .45, 0, scope, 12); D.cyl(.13, .13, .08, pal.accent, 0, .9, 0, scope, 12); D.cyl(.05, .05, .12, pal.ink, 0, .02, 0, scope, 8);
    /* the bench, the pine, the rock */
    var bench = D.group(-.95, 0, .55); bench.rotation.y = .5; D.box(.7, .05, .26, pal.wood, 0, .3, 0, bench); D.box(.7, .26, .05, pal.wood, 0, .45, -.12, bench); [-.28, .28].forEach(function (x) { D.box(.05, .3, .22, pal.ink, x, .15, 0, bench); });
    D.props.tree(1.0, -1.0, null, { r: .4, kind: 'pine' }); D.props.rock(1.05, .7, null, { r: .16, yaw: 2 });
    return { dome: dome, scope: scope };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    p.dome.rotation.y = .6 + .3 * D.wave(t, 20);
    var look = D.smooth(D.pulse(t, 8, .4));
    p.scope.rotation.x = -.7 - .5 * look;
  }
});

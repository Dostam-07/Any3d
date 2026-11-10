/* kitchen · a card: breakfast in a kitchen corner.
   Breakfast. A counter with a sink, a kettle that steams, a toaster that
   pops two slices now and then, a fridge, a stool with a cat, a window on
   a short back wall, a plant. Hover the fridge and its door swings open;
   tap the toaster and the toast pops now. The read-out counts the toast.
   Parts · ground: the slab, the tiled floor, a mat. Structure: the back
   wall and its window, the counter and its cabinets, the fridge, the stool.
   Movers: the fridge door, the slices, the steam, the cat's tail, the
   kettle lid, the clock's hand, the wall fan. Furniture: a plant, a bowl, a
   shelf with jars. Light: the window. */
Any3d.figure({
  name: 'kitchen',
  size: 'card',
  title: 'Breakfast',
  means: 'The kettle steams and the toaster pops now and then; a cat minds the stool.',
  hint: 'Hover the fridge to open it; tap the toaster and the toast pops now.',
  camera: { az: 38, el: 33, pad: 1.06 },
  still: 9.4,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(10, 8, pal.ground, 0, 0, 0, null, { h: .6, r: 1.1, side: pal.base });
    for (var i = -3.5; i <= 3.5; i += 1) for (var j = -2.5; j <= 2.5; j += 1) D.box(.92, .02, .92, (i + j) % 2 ? pal.cloud : pal.ground, i, .02, j, null, { shadow: false });
    D.box(2.2, .03, 1.4, pal.rose, .2, .04, 1.6, null, { shadow: false });
    /* the back wall with a window and a shelf */
    var wall = D.box(9.4, 3.6, .3, pal.paper, 0, 1.8, -3.6, null); D.box(2.2, 1.6, .06, pal.sky, -2.4, 2.1, -3.42, null, { shadow: false, on: wall, mat: { emissive: pal.sky, emissiveIntensity: .35 } });
    D.box(2.4, .08, .12, pal.wood, -2.4, 1.28, -3.4, null); D.box(.08, 1.7, .1, pal.wood, -2.4, 2.1, -3.41, null, { shadow: false }); D.box(2.4, .08, .1, pal.wood, -2.4, 2.1, -3.41, null, { shadow: false });
    /* a wall clock whose hand goes round once in twelve seconds */
    D.cyl(.34, .34, .04, pal.ink, -.7, 2.8, -3.44, null, 20).rotation.x = Math.PI / 2; D.cyl(.3, .3, .04, pal.paper, -.7, 2.8, -3.41, null, 20).rotation.x = Math.PI / 2;
    var clock = D.group(-.7, 2.8, -3.37); D.box(.035, .16, .02, pal.ink, 0, .07, 0, clock, { shadow: false }).rotation.z = -2.1; var hand = D.group(0, 0, 0, clock); D.box(.03, .26, .02, pal.coral, 0, .11, 0, hand, { shadow: false }); D.ball(.03, pal.ink, 0, 0, .01, clock);
    D.box(2.6, .08, .5, pal.wood, 1.6, 2.6, -3.2, null); [[.7, pal.mustard], [1.3, pal.sage], [1.9, pal.teal], [2.5, pal.paper]].forEach(function (q) { D.cyl(.16, .16, .4, q[1], q[0], 2.84, -3.2, null, 12); D.cyl(.1, .1, .08, pal.ink, q[0], 3.08, -3.2, null, 10); });
    /* the counter: an L along the back and the left, with cabinet doors, a sink and a tap */
    var counter = D.group(0, 0, 0);
    D.box(6.4, .9, 1.2, pal.cloud, 0, .45, -2.8, counter); D.box(6.6, .1, 1.3, pal.wood, 0, .95, -2.8, counter);
    [-2.4, -.8, .8, 2.4].forEach(function (x) { D.box(1.3, .7, .05, pal.paper, x, .45, -2.18, counter, { shadow: false }); D.box(.3, .05, .05, pal.ink, x, .5, -2.15, counter, { shadow: false }); });
    D.box(1.2, .9, 2.6, pal.cloud, -3.6, .45, -1.3, counter); D.box(1.3, .1, 2.7, pal.wood, -3.6, .95, -1.3, counter); D.box(.05, .7, 1.2, pal.paper, -2.98, .45, -1.3, counter, { shadow: false });
    D.box(1.3, .06, .9, pal.steel, 1.9, 1.0, -2.8, counter); D.box(1.1, .04, .7, pal.slate, 1.9, 1.02, -2.8, counter, { shadow: false });
    D.cyl(.05, .05, .5, pal.steel, 1.9, 1.25, -3.2, counter, 8); var tap = D.cyl(.04, .04, .5, pal.steel, 1.9, 1.5, -2.95, counter, 8); tap.rotation.x = Math.PI / 2;
    /* the kettle: a body, a lid, a spout, a handle; steam rises from the spout */
    var kettle = D.group(-3.6, 1.0, -1.6); kettle.name = 'kettle'; hot.push(kettle);
    D.cyl(.32, .38, .55, pal.teal, 0, .28, 0, kettle, 16); D.cyl(.26, .3, .1, pal.teal, 0, .6, 0, kettle, 16); var lid = D.ball(.06, pal.ink, 0, .68, 0, kettle);
    var spout = D.cyl(.05, .08, .5, pal.teal, .38, .5, 0, kettle, 8); spout.rotation.z = -.8; var hdl = D.torus(.2, .03, pal.ink, -.3, .55, 0, kettle); hdl.rotation.y = Math.PI / 2;
    var steam = []; [0, 1, 2, 3].forEach(function (k) { var b = D.ball(.12, pal.cloud, 0, 0, 0, null); b.castShadow = false; steam.push(b); });
    /* a wall fan above the counter, turning */
    var fanArm = D.cyl(.05, .05, .3, pal.steel, 0.4, 2.9, -3.3, null, 8); fanArm.rotation.x = Math.PI / 2; D.cyl(.12, .12, .1, pal.ink, .4, 2.9, -3.14, null, 12).rotation.x = Math.PI / 2;
    var fan = D.group(.4, 2.9, -3.08); for (var fb = 0; fb < 3; fb++) { var bl = D.box(.12, .42, .03, pal.paper, 0, 0, 0, fan); bl.position.set(Math.cos(fb * 2.094) * .26, Math.sin(fb * 2.094) * .26, 0); bl.rotation.z = fb * 2.094 + Math.PI / 2; }
    /* the toaster, two slots, two slices that pop */
    var toaster = D.group(-.8, 1.0, -2.9); toaster.name = 'toaster'; hot.push(toaster);
    D.rbox(1.0, .6, .7, pal.coral, 0, .3, 0, toaster, { r: .08 }); [-.18, .18].forEach(function (z) { D.box(.7, .02, .12, pal.ink, 0, .61, z, toaster, { shadow: false }); });
    D.cyl(.06, .06, .12, pal.ink, .3, .25, .42, toaster, 8).rotation.x = Math.PI / 2;
    /* the slices grow out of the slots (a box scaled from its foot), so nothing is drawn inside the toaster */
    var slices = [-.18, .18].map(function (z) { var s = D.group(0, .62, z, toaster); D.box(.56, .5, .08, pal.cardboard, 0, .25, 0, s); s.scale.y = .02; return s; });
    /* the fridge: a shell (a back, two sides, a top and a bottom) around shelves, and a door hinged on its right
       edge, with a handle: a shell, not a solid, so the inside shows only through the open door */
    var fridge = D.group(3.4, 0, -2.4); fridge.name = 'fridge'; hot.push(fridge);
    D.box(1.5, 3.2, .3, pal.paper, 0, 1.6, -.5, fridge); D.box(.12, 3.2, 1.0, pal.paper, -.69, 1.6, .15, fridge); D.box(.12, 3.2, 1.0, pal.paper, .69, 1.6, .15, fridge);
    D.box(1.5, .12, 1.0, pal.paper, 0, 3.14, .15, fridge); D.box(1.5, .3, 1.0, pal.paper, 0, .15, .15, fridge);
    [1.0, 1.7, 2.4].forEach(function (y) { D.box(1.26, .04, .9, pal.sky, 0, y, .15, fridge, { shadow: false }); }); D.cyl(.12, .1, .3, pal.mustard, -.3, 1.87, .2, fridge, 10); D.box(.3, .4, .3, pal.teal, .25, 2.62, .15, fridge);
    var door = D.group(.75, 0, .65, fridge); D.rbox(1.5, 3.2, .12, pal.paper, -.75, 1.6, .06, door, { r: .05 }); D.box(.08, .9, .08, pal.ink, -1.35, 1.6, .18, door); D.box(1.5, .03, .14, pal.ink, -.75, 2.0, .06, door, { shadow: false });
    /* the stool and the cat, the plant, a bowl */
    var stool = D.group(1.6, 0, .9); D.cyl(.42, .42, .08, pal.wood, 0, .9, 0, stool, 16); [0, 1, 2].forEach(function (k) { var a = k * Math.PI * 2 / 3; D.cyl(.04, .04, .88, pal.ink, Math.cos(a) * .3, .44, Math.sin(a) * .3, stool, 6); });
    var cat = D.group(0, .94, 0, stool); var body = D.ball(.22, pal.slate, 0, .16, 0, cat); body.scale.set(1.3, .8, 1); D.ball(.15, pal.slate, .25, .3, 0, cat); D.cone(.06, .12, pal.slate, .2, .42, .08, cat, 6); D.cone(.06, .12, pal.slate, .3, .42, -.08, cat, 6);
    var tail = D.group(-.28, .18, 0, cat); D.cyl(.03, .04, .45, pal.slate, 0, .2, 0, tail, 6); stool.name = 'the cat'; hot.push(stool);
    var plant = D.group(-3.6, 0, 2.2); D.cyl(.4, .32, .6, pal.terracotta, 0, .3, 0, plant, 14); D.props.bush(0, 0, plant, { r: .4, color: pal.leaf, light: pal.leafLight }).position.y = .5;
    D.cyl(.3, .22, .18, pal.sky, 2.9, 1.09, -2.6, null, 14);
    return { hot: hot, kettle: kettle, lid: lid, steam: steam, fan: fan, hand: hand, cat: cat, toaster: toaster, slices: slices, fridge: fridge, door: door, tail: tail, open: D.spring(60, 11), base: 0, lastPress: -1, lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    /* the toast: 12 s down, a pop that bounces, 3 s up; a tap on the toaster pops it now */
    if (ctx.pressed === p.toaster && ctx.pressedAt !== p.lastPress) { p.lastPress = ctx.pressedAt; if (D.phase(t - p.base, 12) * 12 < 8.5) p.base = t - 9; }
    var T = D.phase(t - p.base, 12) * 12, up = T < 9 ? 0 : T < 9.5 ? Math.sin((T - 9) / .5 * Math.PI) * .18 + .4 * D.out((T - 9) / .5) : .4 + .02 * D.wave(t, .6);
    p.slices.forEach(function (s) { s.scale.y = D.clamp((up - .04) / .5, .02, 1.2); });
    ctx.read = T < 9 ? 'toast · ' + Math.ceil(9 - T) + ' s' : 'toast · up';
    /* the kettle boils: steam always, the lid rattles */
    p.steam.forEach(function (b, k) { var u = D.phase(t, 2.4, k * .25); b.position.set(-3.6 + .55 + .16 * D.wave(t, 1.1, k * .3), 1.0 + .95 + u * 1.5, -1.6 + .08 * D.wave(t, 1.6, k)); b.scale.setScalar((.5 + u) * (1 - u) * 2.6 + .15); });
    p.fan.rotation.z = t * 4; p.hand.rotation.z = -t * Math.PI / 6; p.cat.rotation.y = .3 * D.wave(t, 7) + .15 * D.wave(t, 2.6);
    p.lid.position.y = .68 + .015 * Math.abs(D.wave(t, .25));
    p.tail.rotation.z = .5 + .35 * D.wave(t, 2.2) + .1 * D.wave(t, .9);
    /* the fridge door swings open under the pointer, or stays open after a tap */
    p.open.t = ctx.hover === p.fridge || ctx.active === p.fridge ? 1.3 : 0; p.open.step(ctx.dt); p.door.rotation.y = p.open.x;
    p.hot.forEach(function (g) { if (g === p.fridge) return; var s = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18)); s.t = ctx.hover === g ? .2 : 0; s.step(ctx.dt); g.position.y = (g.userData.y0 == null ? (g.userData.y0 = g.position.y) : g.userData.y0) + s.x; });
  }
});

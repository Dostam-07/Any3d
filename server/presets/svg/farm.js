/* farm · a hero: a small farm in the afternoon.
   Striped fields, a barn with a silo, a farmhouse, an orchard, a windmill
   that turns, a pond, sheep that graze along the fence. A tractor does a lap
   of the fields and stops at the barn; the farmer walks the lane. The
   pointer tilts the camera and lifts what it rests on. */
Any3d.figure({
  name: 'farm',
  size: 'hero',
  title: 'Hollow Farm',
  means: 'A tractor laps the fields and stops at the barn, the windmill turns, sheep graze, the farmer walks the lane.',
  hint: 'Hover the tractor, the barn, the silo or the windmill.',
  camera: { az: 36, el: 34, pad: 1.05 },
  still: 10,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(40, 27, pal.grass, 0, 0, 0, null, { h: .8, r: 2.6, side: pal.base });
    /* fields: three plots of stripes, a lane, a pond */
    function plot(x, z, w, d, a, b, n) { for (var i = 0; i < n; i++) D.box(w, .04, d / n - .08, i % 2 ? a : b, x, .02 + (i % 2) * .01, z - d / 2 + d / n * (i + .5), null, { shadow: false }); }
    plot(-11, -5.5, 12, 9, pal.sand, pal.cardboard, 9); plot(-11, 6.5, 12, 8, pal.leafDark, pal.leaf, 8); plot(12, -5.5, 10, 9, pal.leafLight, pal.leaf, 9);
    for (var cx = -16; cx <= -6; cx += 1.3) for (var cz = 3; cz <= 10; cz += 1.1) { var c = D.ball(.18, pal.leafLight, cx, .22, cz); c.castShadow = false; }
    D.box(1.8, .03, 25, pal.sand, 1.5, .05, -.5, null, { shadow: false }); D.box(30, .03, 1.8, pal.sand, -3, .05, 0.5, null, { shadow: false }); D.box(21, .03, 1.8, pal.sand, -8.5, .05, -12.4, null, { shadow: false }); D.box(1.8, .03, 25, pal.sand, -18.5, .05, -.5, null, { shadow: false }); D.box(21, .03, 1.8, pal.sand, -8.5, .05, 11.8, null, { shadow: false });
    D.cyl(2.6, 2.6, .08, pal.water, 12.5, .04, 7.5, null, 28); D.cyl(2.3, 2.3, .06, pal.sky, 12.5, .09, 7.5, null, 28);
    D.props.rock(9.6, 8.6, null, { r: .4 }); D.props.rock(14.9, 5.6, null, { r: .3, yaw: 1 }); D.props.bush(15.3, 9.2, null, { r: .4 }); D.props.bush(10, 10, null, { r: .3 });
    /* fences along the lane and the pasture */
    function fence(x1, z1, x2, z2) { var n = Math.round(Math.hypot(x2 - x1, z2 - z1) / 1.4), yaw = Math.atan2(-(z2 - z1), x2 - x1); for (var i = 0; i <= n; i++) { var u = i / n; D.box(.1, .7, .1, pal.paper, x1 + (x2 - x1) * u, .35, z1 + (z2 - z1) * u); } var r = D.box(Math.hypot(x2 - x1, z2 - z1), .06, .06, pal.paper, (x1 + x2) / 2, .55, (z1 + z2) / 2); r.rotation.y = yaw; var r2 = D.box(Math.hypot(x2 - x1, z2 - z1), .06, .06, pal.paper, (x1 + x2) / 2, .3, (z1 + z2) / 2); r2.rotation.y = yaw; }
    fence(5, 2, 18, 2); fence(18, 2, 18, 12); fence(5, 2, 5, 12);
    /* the barn, the silo, the farmhouse, the windmill */
    var barn = D.group(7.5, 0, -9); barn.name = 'barn'; hot.push(barn);
    D.box(6.4, 3, 4.6, pal.coral, 0, 1.5, 0, barn); D.wedge(6.8, 2, 5, pal.terracotta, 0, 3, 0, barn);
    D.box(2, 2.3, .1, pal.paper, 0, 1.15, 2.33, barn); D.box(.08, 2.1, 1.8, pal.coral, .02, 1.15, 2.4, barn).rotation.y = Math.PI / 2;
    D.box(.9, .7, .06, pal.paper, 0, 3.4, 2.5, barn, { shadow: false });
    var silo = D.group(12, 0, -9.5); silo.name = 'silo'; hot.push(silo);
    D.cyl(1.3, 1.3, 5, pal.paper, 0, 2.5, 0, silo, 20); D.dome(1.3, pal.steel, 0, 5, 0, silo); [1.2, 2.6, 4].forEach(function (y) { D.cyl(1.33, 1.33, .12, pal.steel, 0, y, 0, silo, 20); });
    var house = D.group(-4, 0, -9.2); house.rotation.y = .2; house.name = 'farmhouse'; hot.push(house);
    D.box(4.4, 2.2, 3.4, pal.paper, 0, 1.1, 0, house); D.wedge(4.8, 1.5, 3.8, pal.mustard, 0, 2.2, 0, house);
    D.box(.5, .8, .5, pal.mist, 1.2, 3.1, -.6, house); D.box(.6, 1.0, .06, pal.ink, -.6, .5, 1.73, house, { shadow: false });
    [[.9, 1.73], [-1.4, 1.73]].forEach(function (w) { D.box(.7, .6, .06, pal.sky, w[0], 1.2, w[1], house, { shadow: false }); });
    D.box(5.2, .08, 1.4, pal.wood, 0, .3, 2.4, house); [-2.2, 2.2].forEach(function (x) { D.cyl(.06, .06, 2.1, pal.paper, x, 1.3, 2.9, house, 8); }); D.box(5.4, .12, 1.6, pal.cloud, 0, 2.35, 2.4, house);
    var mill = D.group(-16.5, 0, -8.5); mill.name = 'windmill'; hot.push(mill);
    [[0, 0], [1.2, 0], [0, 1.2], [1.2, 1.2]].forEach(function (p) { D.box(.1, 6, .1, pal.steel, p[0] - .6, 3, p[1] - .6, mill); });
    [1.8, 3.6, 5.2].forEach(function (y) { D.box(1.3, .06, .06, pal.steel, 0, y, -.6, mill); D.box(1.3, .06, .06, pal.steel, 0, y, .6, mill); D.box(.06, .06, 1.3, pal.steel, -.6, y, 0, mill); D.box(.06, .06, 1.3, pal.steel, .6, y, 0, mill); });
    D.box(.6, .4, .6, pal.steel, 0, 6.2, 0, mill); var hub = D.group(0, 6.2, .5, mill); D.cyl(.12, .12, .4, pal.ink, 0, 0, 0, hub, 8).rotation.x = Math.PI / 2;
    for (var b = 0; b < 6; b++) { var bl = D.box(.22, 1.9, .04, pal.paper, 0, 0, 0, hub); bl.position.set(Math.cos(b * Math.PI / 3) * .95, Math.sin(b * Math.PI / 3) * .95, .22); bl.rotation.z = b * Math.PI / 3 + Math.PI / 2; }
    /* the orchard and the trees around */
    for (var ox = -16; ox <= -7; ox += 2.2) for (var oz = -4.5; oz <= -1; oz += 1.8) D.props.tree(ox + (oz < -3 ? .4 : 0), oz, null, { r: .5, kind: 'round', yaw: ox + oz, color: oz < -3 ? pal.leafDark : pal.leaf });
    [[18.3, .6, 'pine'], [-2.6, 5.5, 'tall'], [18.5, -11, 'round'], [16, -12.2, 'pine'], [-0.9, -10.0, 'round'], [18.5, -4, 'tall'], [3.8, 12.4, 'round'], [-3.2, -2.5, 'pine']].forEach(function (t, k) { D.props.tree(t[0], t[1], null, { r: .6 + (k % 3) * .1, kind: t[2], yaw: k }); });
    /* sheep, hay bales, the tractor and the farmer */
    function sheep(x, z, yaw) { var g = D.group(x, 0, z); g.rotation.y = yaw; var b = D.ball(.34, pal.paper, 0, .42, 0, g); b.scale.set(1.3, .9, 1); D.ball(.17, pal.ink, .42, .5, 0, g); [[.2, .14], [-.2, .14], [.2, -.14], [-.2, -.14]].forEach(function (l) { D.cyl(.04, .04, .3, pal.ink, l[0], .15, l[1], g, 6); }); return g; }
    var flock = [sheep(8, 5, 1), sheep(10.5, 4, 2.4), sheep(7, 9, -.5), sheep(14, 10.5, 1.8), sheep(9.5, 7.5, 3)];
    [[3.5, -7.5], [4.3, -6.3], [3.9, -6.9]].forEach(function (p, k) { D.cyl(.5, .5, .9, pal.cardboard, p[0], k === 2 ? 1.4 : .5, p[1], null, 14).rotation.z = Math.PI / 2; });
    var tractor = D.group(0, 0, 0), tw = []; tractor.name = 'tractor'; hot.push(tractor);
    D.rbox(2.2, .9, 1.2, pal.accent, .1, .95, 0, tractor, { r: .12 }); D.box(1.2, .6, 1.0, pal.accent, .6, .5, 0, tractor); D.cyl(.08, .08, .9, pal.ink, 1.0, 1.7, .3, tractor, 8);
    D.box(.9, .9, 1.0, pal.paper, -.5, 1.85, 0, tractor); D.box(.9, .06, 1.1, pal.ink, -.5, 2.33, 0, tractor); D.box(.06, .5, .9, pal.sky, -.03, 1.9, 0, tractor, { shadow: false });
    var driver = D.props.person(-.5, 0, tractor, { shirt: pal.teal, hat: pal.mustard }); driver.position.y = 1.0; driver.scale.setScalar(.9); driver.rotation.y = Math.PI / 2;
    tw.push(D.wheel(.65, .5, pal.tyre, -.6, .65, .75, tractor), D.wheel(.65, .5, pal.tyre, -.6, .65, -.75, tractor), D.wheel(.38, .4, pal.tyre, 1.1, .38, .65, tractor), D.wheel(.38, .4, pal.tyre, 1.1, .38, -.65, tractor));
    D.cyl(.3, .3, .5, pal.mustard, -.6, .65, .75, tractor, 10).rotation.x = Math.PI / 2; D.cyl(.3, .3, .5, pal.mustard, -.6, .65, -.75, tractor, 10).rotation.x = Math.PI / 2;
    var lap = D.path([[1.5, 11.8], [1.5, -12.4], [-18.5, -12.4], [-18.5, 11.8]], true, 1.6);
    var farmer = D.props.person(0, 0, null, { shirt: pal.plum, hat: pal.mustard }), walk = D.path([[-3, -0.5], [-14, -0.5]]);
    return { hot: hot, hub: hub, flock: flock, tractor: tractor, tw: tw, lap: lap, farmer: farmer, walk: walk, lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    p.hub.rotation.z = t * .9;
    var T = D.phase(t, 36) * 36, L = p.lap.length, stop = 20.3, d;
    if (T < 14) d = D.inOut(T / 14) * stop; else if (T < 19) d = stop; else d = stop + D.inOut((T - 19) / 17) * (L - stop);
    D.place(p.tractor, p.lap, d); D.spin(p.tw, d, .5); p.tractor.position.y = .03 * Math.abs(D.wave(t, .4)) * (T < 14 || T > 19 ? 1 : 0);
    p.flock.forEach(function (s, k) { var g = D.pulse(t, 9 + k, .3); s.position.y = .12 * g; s.rotation.y = (s.userData.yaw0 == null ? (s.userData.yaw0 = s.rotation.y) : s.userData.yaw0) + .15 * D.wave(t, 5, k); s.children[1].position.y = .5 - .12 * D.smooth(D.pulse(t, 6 + k * .7, .5)); });
    var W = D.phase(t, 22), wd = W < .5 ? D.smooth(W * 2) : 1 - D.smooth((W - .5) * 2);
    D.place(p.farmer, p.walk, wd * p.walk.length); if (W >= .5) p.farmer.rotation.y += Math.PI; p.farmer.position.y = .05 * Math.abs(D.wave(t, .5));
    p.hot.forEach(function (g) { var s = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18)); s.t = ctx.hover === g ? .3 : 0; s.step(ctx.dt); g.position.y = (g.userData.y0 == null ? (g.userData.y0 = g.position.y) : g.userData.y0) + s.x; });
  }
});

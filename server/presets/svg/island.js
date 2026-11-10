/* island · a hero: a lighthouse island at the end of the day.
   A boat circles the island and ties up at the pier for a while, the lamp
   turns, two gulls cross, clouds drift, the waves breathe. The pointer tilts
   the camera and lifts the boat, the lighthouse or the keeper's house. */
Any3d.figure({
  name: 'island',
  size: 'hero',
  title: 'Gull Rock',
  means: 'A boat circles the island and ties up at the pier, the lamp turns, gulls cross, the waves breathe.',
  hint: 'Hover the boat, the lighthouse or the house.',
  camera: { az: 36, el: 33, pad: 1.05 },
  still: 11,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(27, 18, pal.water, 0, 0, 0, null, { h: .8, r: 2.2 });
    var waves = [];
    [[-10, 6], [-7, -5.5], [3, 7.2], [9, -6], [11.5, 2], [-11.5, -1], [6, -2.8]].forEach(function (p, k) { waves.push(D.box(1.2 + (k % 3) * .3, .02, .1, pal.line, p[0], .03, p[1], null, { shadow: false })); });

    /* the island: sand, grass, a hill, rocks */
    D.slab(17, 12.5, pal.sand, -1, .32, -.5, null, { h: .32, r: 5 });
    D.slab(14, 9.5, pal.grass, -1.6, .62, -1, null, { h: .3, r: 4 });
    var hill = D.dome(2.6, pal.leaf, -5.4, .62, -3.4); hill.scale.set(1.3, .42, 1);
    D.props.rock(6.2, 1.8, null, { r: .7, h: .5 }); D.props.rock(5.4, 2.6, null, { r: .4 }); D.props.rock(-8.8, 2.2, null, { r: .5, yaw: 1.2 }); D.props.rock(-7.6, -5.4, null, { r: .45 });
    D.props.tree(-7.4, 1.0, null, { r: .7, kind: 'pine' }); D.props.tree(-8.6, .2, null, { r: .55, kind: 'pine' }); D.props.tree(-4.4, 2.6, null, { r: .6, kind: 'round', yaw: 1 });
    D.props.tree(3.6, -4.2, null, { r: .65, kind: 'pine' }); D.props.tree(2.2, -4.9, null, { r: .5, kind: 'round' });
    D.props.bush(4.6, 1.2); D.props.bush(-2.8, 3.1, null, { r: .3 }); D.props.bush(1.2, -3.2, null, { r: .35 });

    /* the lighthouse */
    var lh = D.group(1.2, .62, -1.4);
    D.cyl(1.25, 1.35, .35, pal.mist, 0, .17, 0, lh, 20);
    D.cyl(.72, 1.0, 5.2, pal.paper, 0, 2.95, 0, lh, 20);
    [1.4, 3.0, 4.4].forEach(function (y, k) { var ring = D.cyl(1.0 - k * .11 + .02, 1.0 - k * .11 + .05, .55, pal.coral, 0, y, 0, lh, 20); });
    D.cyl(.95, .95, .22, pal.ink, 0, 5.62, 0, lh, 20);
    D.cyl(.55, .55, .8, pal.sky, 0, 6.15, 0, lh, 14);
    var lamp = D.cyl(.28, .28, .5, pal.lampGlow, 0, 6.15, 0, lh, 10); lamp.material = D.mat(pal.lampGlow, { emissive: pal.lampGlow, emissiveIntensity: 1.2 });
    [0, 1, 2, 3].forEach(function (k) { var post = D.cyl(.04, .04, .8, pal.ink, Math.cos(k * Math.PI / 2) * .56, 6.15, Math.sin(k * Math.PI / 2) * .56, lh, 6); });
    D.cone(.75, .7, pal.coral, 0, 6.9, 0, lh, 14);
    D.ball(.1, pal.ink, 0, 7.3, 0, lh);
    var beam = D.box(7, .18, .5, pal.lampGlow, 3.5, 6.15, 0, lh, { mat: { emissive: pal.lampGlow, emissiveIntensity: .9, transparent: true, opacity: .35 }, shadow: false });
    var beamPivot = D.group(0, 0, 0, lh); beamPivot.add(beam);
    D.box(.9, 1.1, .08, pal.ink, 0, .6, 1.0, lh);
    lh.name = 'lighthouse'; hot.push(lh);

    /* the keeper's house, the path, the pier */
    var house = D.group(-3.6, .92, 1.2); house.rotation.y = .25;
    D.box(3.2, 1.7, 2.4, pal.paper, 0, .85, 0, house);
    D.wedge(3.5, 1.1, 2.7, pal.terracotta, 0, 1.7, 0, house);
    D.box(.5, .7, .5, pal.mist, .8, 2.55, -.5, house);
    D.box(.5, .9, .06, pal.ink, -.5, .45, 1.21, house);
    D.box(.6, .5, .06, pal.sky, .7, 1.0, 1.21, house); D.box(.6, .5, .06, pal.sky, -1.61, 1.0, 0, house).rotation.y = Math.PI / 2;
    house.name = "keeper's house"; hot.push(house);
    [[-1.2, 2.6], [.1, 3.0], [1.4, 3.3], [2.6, 3.8]].forEach(function (p) { D.box(.5, .04, .35, pal.cloud, p[0], .8, p[1], null, { shadow: false }).rotation.y = .3; });
    var pier = D.group(4.2, 0, 4.0); pier.rotation.y = -.5;
    for (var i = 0; i < 5; i++) { D.box(1.1, .12, 1.6, pal.wood, i * 1.1, .55, 0, pier); }
    [0, 2.2, 4.4].forEach(function (x) { D.cyl(.08, .09, .9, pal.trunk, x - .3, .15, -.7, pier, 8); D.cyl(.08, .09, .9, pal.trunk, x - .3, .15, .7, pier, 8); });
    D.cyl(.12, .12, .5, pal.trunk, 4.6, .8, .6, pier, 8);
    var keeper = D.props.person(3.3, 0, pier, { shirt: pal.mustard, hat: pal.paper, yaw: 1.2 }); keeper.position.y = .61;

    /* the boat, on a lap that stops at the pier */
    var boat = D.group(0, 0, 0); var hull = D.rbox(3.2, .7, 1.3, pal.accent, 0, .25, 0, boat, { r: .18 });
    D.box(2.6, .1, 1.0, pal.paper, 0, .62, 0, boat);
    D.box(1.1, .7, .9, pal.paper, -.3, 1.0, 0, boat); D.box(.6, .3, .06, pal.ink, .26, 1.1, .46, boat); D.box(.6, .3, .06, pal.ink, .26, 1.1, -.46, boat);
    D.cyl(.04, .04, 1.6, pal.ink, .9, 1.4, 0, boat, 6);
    D.box(.3, .06, .3, pal.mustard, -1.2, .7, 0, boat);
    var skipper = D.props.person(-.75, 0, boat, { shirt: pal.teal, hat: false }); skipper.position.y = .6; skipper.scale.setScalar(.8);
    var wake = D.box(1.6, .02, .5, pal.line, -2.2, .04, 0, boat, { shadow: false, mat: { transparent: true, opacity: .7 } });
    boat.name = 'boat'; hot.push(boat);
    var lap = D.path([[8.4, 7.9], [12.0, 4.8], [10.4, -6.1], [0, -7.9], [-11.2, -6.2], [-11.4, 3], [-5, 6.6], [3, 7.9]], true);

    /* gulls and clouds */
    function gull(parent) { var g = D.group(0, 0, 0, parent); var l = D.box(.5, .03, .14, pal.paper, -.26, 0, 0, g, { shadow: false }), r = D.box(.5, .03, .14, pal.paper, .26, 0, 0, g, { shadow: false }); D.box(.18, .06, .12, pal.cloud, 0, 0, 0, g, { shadow: false }); return { g: g, l: l, r: r }; }
    var gulls = [gull(), gull()], fly = D.path([[-12.5, 5], [-5, -1.5], [5, -5], [12, 1]]);
    var clouds = [D.props.cloud(-8.5, 8.5, -5, null, { r: 1.0 }), D.props.cloud(7.5, 9.3, -6, null, { r: .75 })];

    return { hot: hot, boat: boat, lap: lap, wake: wake, beam: beamPivot, gulls: gulls, fly: fly, clouds: clouds, waves: waves, lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    /* the boat: 30 s lap, 7 s tied up at the pier (the lap starts there) */
    var T = D.phase(t, 30) * 30, L = p.lap.length, d;
    if (T < 7) d = 0; else d = D.inOut((T - 7) / 23) * L;
    var q = D.place(p.boat, p.lap, d);
    p.boat.position.y = .62 + .05 * D.wave(t, 2.6); p.boat.rotation.z = .035 * D.wave(t, 2.1); p.boat.rotation.x = .025 * D.wave(t, 3.3);
    var moving = T > 7.5 && T < 29.5; p.wake.scale.x = moving ? 1 : .001;
    ctx.read = T < 7 ? 'boat · tied up at the pier' : 'boat · out round the island';
    p.beam.rotation.y = t * .9;
    p.gulls.forEach(function (g, k) {
      var u = D.phase(t, 22, k * .5), s = p.fly.at(u * p.fly.length);
      g.g.position.set(s.x, 7.5 + k * .8 + .3 * D.wave(t, 3, k), s.z); g.g.rotation.y = s.yaw;
      var flap = .6 * D.wave(t, .45, k * .3); g.l.rotation.x = flap; g.r.rotation.x = -flap;
    });
    var wrap = function (x) { return ((x + 12) % 24 + 24) % 24 - 12; };
    p.clouds.forEach(function (c, k) { var x0 = c.userData.x0 == null ? (c.userData.x0 = c.position.x) : c.userData.x0; c.position.x = wrap(x0 + (k ? -.08 : .06) * t); });
    p.waves.forEach(function (w, k) { w.scale.x = .6 + .5 * (D.wave(t, 3.5, k * .17) * .5 + .5); var x0 = w.userData.x0 == null ? (w.userData.x0 = w.position.x) : w.userData.x0; w.position.x = wrap(x0 + .25 * t * (k % 2 ? 1 : -1)); });
    p.hot.forEach(function (g) {
      var s = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18)); s.t = ctx.hover === g ? .35 : 0; s.step(ctx.dt);
      if (g === p.boat) p.boat.position.y += s.x; else g.position.y = (g.userData.y0 == null ? (g.userData.y0 = g.position.y) : g.userData.y0) + s.x;
    });
  }
});

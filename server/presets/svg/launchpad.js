/* launchpad · a card at night.
   A rocket on its pad, a gantry with an arm, a fuel tank, a control bunker
   with lit windows, floodlights. Every twenty seconds the arm swings away,
   the engine lights and the rocket climbs out of the frame, then it is back
   on the pad. Hover the rocket and it comes apart into its stages, nose
   first, and closes up when you leave; tap the control room and the count
   reaches zero now. The read-out says where the count is. */
Any3d.figure({
  name: 'launchpad',
  size: 'card',
  theme: 'night',
  title: 'Launchpad',
  means: 'A rocket waits on its pad under floodlights; the arm swings away and it launches, on the clock or on your call.',
  hint: 'Hover the rocket to see its stages; tap the control room to launch now.',
  camera: { az: 38, el: 33, pad: 1.0 },
  still: 4,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(11, 9, pal.ground, 0, 0, 0, null, { h: .6, r: 1.2, side: pal.base });
    D.box(7.5, .03, 7, pal.asphalt, .4, .04, .2, null, { shadow: false });
    D.cyl(2.2, 2.2, .3, pal.cloud, 1.2, .15, .6, null, 24); D.cyl(1.6, 1.6, .06, pal.ink, 1.2, .3, .6, null, 24);
    [[-3.2, 3.2], [4.4, 3.4], [4.6, -3.0], [-3.4, -3.1]].forEach(function (p) { D.props.lamp(p[0], p[1], null, { h: 2.8 }); });
    /* the rocket, in three stages so it can come apart: the engine on the pad, the body, the nose */
    var rocket = D.group(1.2, .3, .6); rocket.name = 'rocket'; hot.push(rocket);
    var engine = D.group(0, 0, 0, rocket), body = D.group(0, 0, 0, rocket), nose = D.group(0, 0, 0, rocket);
    D.cyl(.3, .45, .5, pal.steel, 0, .5, 0, engine, 14);
    [0, 1, 2, 3].forEach(function (k) { var f = D.wedge(.08, .9, .7, pal.accent, 0, .4, 0, engine); f.position.set(Math.cos(k * Math.PI / 2) * .62, .35, Math.sin(k * Math.PI / 2) * .62); f.rotation.y = -k * Math.PI / 2 + Math.PI / 2; });
    D.cyl(.5, .5, 3.4, pal.paper, 0, 2.4, 0, body, 20); D.cyl(.52, .52, .5, pal.accent, 0, 1.1, 0, body, 20); D.cyl(.52, .52, .3, pal.accent, 0, 3.6, 0, body, 20);
    D.box(.5, .4, .06, pal.sky, 0, 3.1, .5, body, { shadow: false, mat: { emissive: pal.sky, emissiveIntensity: .4 } });
    D.cyl(.5, .5, .2, pal.paper, 0, 4.2, 0, nose, 20); D.cone(.5, 1.2, pal.accent, 0, 4.9, 0, nose, 20);
    var apart = D.apart([{ g: nose, y: 1.5 }, { g: body, y: .7 }], { stagger: .08 });
    var flame = D.group(0, .2, 0, rocket); var f1 = D.cone(.42, 1.6, pal.mustard, 0, -.8, 0, flame, 12); f1.rotation.x = Math.PI; f1.castShadow = false; f1.material = D.mat(pal.mustard, { emissive: pal.mustard, emissiveIntensity: 1.6 });
    var f2 = D.cone(.26, 2.4, pal.accent, 0, -1.2, 0, flame, 12); f2.rotation.x = Math.PI; f2.castShadow = false; f2.material = D.mat(pal.accent, { emissive: pal.accent, emissiveIntensity: 1.2 });
    var smoke = []; [0, 1, 2, 3, 4].forEach(function (k) { var s = D.ball(.35, pal.cloud, 0, 0, 0, null); s.castShadow = false; smoke.push(s); });
    /* the tank vents a wisp of vapour all the time, so the pad is never quite still */
    var vent = []; [0, 1, 2].forEach(function (k) { var v = D.ball(.16, pal.cloud, 0, 0, 0, null); v.castShadow = false; vent.push(v); });
    /* the gantry and its arm */
    var gantry = D.group(-.6, 0, .6); gantry.name = 'gantry'; hot.push(gantry);
    [[-.4, -.4], [.4, -.4], [-.4, .4], [.4, .4]].forEach(function (p) { D.box(.12, 6.2, .12, pal.steel, p[0], 3.1, p[1], gantry); });
    [1.2, 2.4, 3.6, 4.8, 6.0].forEach(function (y) { D.box(.95, .08, .95, pal.steel, 0, y, 0, gantry); });
    D.box(.3, .3, .3, pal.steel, .5, 4.2, 0, gantry); var arm = D.group(.6, 4.2, 0, gantry); D.box(.7, .16, .4, pal.mustard, .35, 0, 0, arm); D.box(.2, .5, .5, pal.mustard, .7, .1, 0, arm);
    var beacon = D.box(.16, .16, .05, pal.bad, 0, 6.3, .5, gantry, { mat: { emissive: pal.bad, emissiveIntensity: 1.5 }, shadow: false });
    /* the tank and the bunker */
    var tank = D.group(4.0, 0, 2.6); D.cyl(.8, .8, 2.4, pal.cloud, 0, 1.2, 0, tank, 18); D.dome(.8, pal.cloud, 0, 2.4, 0, tank); D.cyl(.82, .82, .15, pal.steel, 0, 1.0, 0, tank, 18);
    D.cyl(.06, .06, 3.2, pal.steel, 2.4, .2, 1.6, null, 8).rotation.z = Math.PI / 2;
    var bunker = D.group(-3.2, 0, -2.4); bunker.rotation.y = .3; bunker.name = 'control room'; hot.push(bunker);
    D.box(3.2, 1.4, 2.2, pal.paper, 0, .7, 0, bunker); D.box(3.4, .2, 2.4, pal.slate, 0, 1.5, 0, bunker);
    [-.9, 0, .9].forEach(function (x) { D.box(.6, .5, .06, pal.sky, x, .8, 1.12, bunker, { shadow: false, mat: { emissive: pal.sky, emissiveIntensity: .9 } }); });
    var dish = D.group(-1.1, 1.6, -.5, bunker); D.cyl(.05, .05, .5, pal.steel, 0, .25, 0, dish, 6); var disc = D.cyl(.42, .3, .1, pal.cloud, 0, .55, 0, dish, 14); disc.rotation.x = -.9; D.cyl(.03, .03, .4, pal.steel, 0, .6, .25, dish, 6).rotation.x = -.9;
    D.cyl(.04, .04, 1.6, pal.steel, 1.2, 2.3, -.6, bunker, 6); D.ball(.12, pal.bad, 1.2, 3.1, -.6, bunker).material = D.mat(pal.bad, { emissive: pal.bad, emissiveIntensity: 1.5 });
    D.props.person(-1.2, 1.9, bunker, { shirt: pal.teal, hat: pal.paper, yaw: .4 });
    /* a technician walks the apron between the bunker and the pad */
    var tech = D.props.person(0, 0, null, { shirt: pal.mustard, hat: pal.paper }), walk = D.path([[-3.0, 3.5], [1.6, 3.5]]);
    D.props.rock(-4.2, 3.4, null, { r: .3 }); D.props.bush(4.6, -3.6, null, { r: .35 }); D.props.bush(-4.4, -3.6, null, { r: .28 });
    return { hot: hot, rocket: rocket, apart: apart, bunker: bunker, flame: flame, smoke: smoke, vent: vent, dish: dish, tech: tech, walk: walk, arm: arm, beacon: beacon, base: 0, lastPress: -1, lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    /* a tap on the control room while the rocket waits moves the clock to T−0 now; the loop goes on from there, seamless */
    if (ctx.pressed === p.bunker && ctx.pressedAt !== p.lastPress) { p.lastPress = ctx.pressedAt; if (D.phase(t - p.base, 20) * 20 < 12) p.base = t - 12; }
    /* 20 s: 0–12 on the pad, 12–13.5 the arm swings away, 13.5–18 the launch, 18–20 back on the pad */
    var T = D.phase(t - p.base, 20) * 20, armOut = D.smooth((T - 12) / 1.5) * (1 - D.smooth((T - 18.5) / 1.2));
    p.arm.rotation.y = -1.6 * armOut;
    var burn = T > 13.5 && T < 18, u = D.clamp((T - 13.5) / 4.5, 0, 1), rise = u * u * 16;
    p.rocket.position.y = .3 + rise;
    var back = D.smooth((T - 18) / 1.5); if (T >= 18) p.rocket.position.y = .3 + 16 * (1 - back);
    ctx.read = T < 12 ? 'on the pad · T−' + Math.ceil(12 - T) + ' s' : T < 13.5 ? 'arm away · ignition' : T < 18 ? 'lift-off · ' + Math.round(rise) + ' m' : 'back on the pad';
    /* the stages come apart under the pointer, or stay apart after a tap, but never while the rocket is busy */
    p.apart.open((ctx.hover === p.rocket || ctx.active === p.rocket) && !(T >= 12 && T < 18)); p.apart.step(ctx.dt);
    p.beacon.material.emissiveIntensity = D.phase(t, 1.2) < .5 ? 1.6 : .15;
    p.dish.rotation.y = t * .5;
    var W = D.phase(t, 11), wd = W < .5 ? D.smooth(W * 2) : 1 - D.smooth((W - .5) * 2);
    D.place(p.tech, p.walk, wd * p.walk.length); if (W >= .5) p.tech.rotation.y += Math.PI; p.tech.position.y = .05 * Math.abs(D.wave(t, .5));
    p.vent.forEach(function (v, k) { var w = D.phase(t, 2.4, k * .33); v.position.set(4.0 + .35 + .1 * D.wave(t, 1.3, k), 2.55 + w * 1.1, 2.6 - .3 + .08 * D.wave(t, .9, k)); v.scale.setScalar((.5 + w) * (1 - w) * 2 + .1); });
    p.flame.visible = burn; p.flame.scale.set(1, .8 + .5 * Math.abs(D.wave(t, .15)) + .6 * u, 1);
    p.smoke.forEach(function (s, k) { var on = burn && u < .8; var v = D.phase(t, 1.1, k * .2); s.visible = on; s.position.set(1.2 + Math.cos(k * 1.26) * (.4 + v * 1.6), .5 + v * .6, .6 + Math.sin(k * 1.26) * (.4 + v * 1.6)); s.scale.setScalar(.5 + v * 1.1); });
    p.hot.forEach(function (g) { if (g === p.rocket) return; var s = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18)); s.t = ctx.hover === g ? .25 : 0; s.step(ctx.dt); g.position.y = s.x; });
  }
});

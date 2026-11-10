/* harbour · a hero: a container quay at work.
   Pier Nine. A ship moored along the quay with containers on deck, a gantry
   crane that lifts them ashore one by one, a terminal tractor that carries
   a container round the quay and stops at the gate, a tug circling the
   basin, gulls, lamps and the harbour office. The pointer lifts what it
   rests on; tap the crane while it waits and it starts the next lift now.
   The read-out says what the crane is doing.
   Parts · ground: the water, the quay, the apron, the road. Structure: the
   ship, the crane, the office, the stack, the gate, the bollards. Movers:
   the trolley and its spreader, the carried container, the tractor, the tug,
   two gulls, the waves. Furniture: lamps, cones, crates, a van, trees, rocks.
   Light: lamp heads, the office windows, the crane beacon, the lighthouse. */
Any3d.figure({
  name: 'harbour',
  size: 'hero',
  title: 'Pier Nine',
  means: 'A crane lifts containers off the ship one by one, a tractor carries them round the quay, a tug circles the basin.',
  hint: 'Hover the ship, the crane, the tractor or the tug; tap the crane to start a lift now.',
  camera: { az: 34, el: 33, pad: 1.04 },
  still: .3,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(44, 28, pal.water, 0, 0, -1, null, { h: .9, r: 3 });
    var waves = []; [[-16, 9], [-12, 2], [-18, -4], [-8, 11], [2, 12], [10, 12.5], [-6, 6], [16, 10]].forEach(function (p, k) { waves.push(D.box(1.2 + (k % 3) * .3, .02, .1, pal.line, p[0], .03, p[1], null, { shadow: false })); });
    /* the quay: a concrete plate on the back-right, with an apron and a road loop */
    D.slab(30, 15, pal.cloud, 4, .5, -6.5, null, { h: .5, r: 1.2, side: pal.mist });
    D.box(27, .03, 2.6, pal.asphalt, 4, .52, -12, null, { shadow: false }); D.box(2.6, .03, 8, pal.asphalt, 16.2, .52, -9.3, null, { shadow: false }); D.box(2.6, .03, 8, pal.asphalt, -8.2, .52, -9.3, null, { shadow: false }); D.box(27, .03, 2.6, pal.asphalt, 4, .52, -6.6, null, { shadow: false });
    for (var i = -7; i <= 15; i += 2.2) D.box(1.1, .012, .14, pal.line, i, .545, -12, null, { shadow: false });
    D.box(24, .03, 3.2, pal.cloud, 4, .52, -2.4, null, { shadow: false });
    [[-6, -.6], [-1, -.6], [4, -.6], [9, -.6], [14, -.6]].forEach(function (p) { var b = D.cyl(.22, .26, .5, pal.ink, p[0], .75, p[1], null, 10); });
    /* the ship, moored along the quay, nose toward +x */
    var ship = D.group(3, 0, 3.4); ship.name = 'ship'; hot.push(ship);
    D.rbox(16, 1.6, 4.4, pal.steel, 0, .9, 0, ship, { r: .25 }); D.box(16.2, .3, 4.5, pal.bad, 0, .3, 0, ship); D.box(15.4, .12, 4.0, pal.cloud, 0, 1.75, 0, ship);
    var bow = D.wedge(1.6, 2.4, 4.4, pal.steel, 8.0, .9, 0, ship); bow.rotation.z = -Math.PI / 2;
    D.wedge(.3, 2.45, 4.5, pal.bad, 8.0, .3, 0, ship).rotation.z = -Math.PI / 2; D.wedge(.12, 2.2, 4.0, pal.cloud, 8.0, 1.75, 0, ship).rotation.z = -Math.PI / 2;
    var bridge = D.group(-6.6, 1.8, 0, ship); D.box(2.6, 2.2, 3.4, pal.paper, 0, 1.1, 0, bridge); D.box(2.8, .3, 3.6, pal.slate, 0, 2.3, 0, bridge); D.box(2.2, .6, .06, pal.sky, 0, 1.7, 1.72, bridge, { shadow: false });
    D.cyl(.4, .5, 1.4, pal.coral, -.6, 3.1, -.9, bridge, 12); D.cyl(.42, .42, .2, pal.ink, -.6, 3.8, -.9, bridge, 12); D.cyl(.04, .04, 2.4, pal.ink, .6, 3.6, .6, bridge, 6);
    var deck = [], DC = [pal.teal, pal.mustard, pal.plum, pal.sage, pal.coral, pal.teal, pal.rose, pal.mustard];
    for (var dz = 0; dz < 2; dz++) for (var dx = 0; dx < 4; dx++) { var c = D.box(2.4, 1.0, 1.3, DC[dz * 4 + dx], -3.6 + dx * 2.7, 2.3, -.9 + dz * 1.8, ship); deck.push(c); }
    /* the crane: a portal on the quay, a boom out over the ship, a trolley with a spreader on cables */
    var crane = D.group(-.6, .5, -2.2); crane.name = 'crane'; hot.push(crane);
    [[-2.2, -2.6], [2.2, -2.6], [-2.2, 1.0], [2.2, 1.0]].forEach(function (p) { D.box(.5, 8, .5, pal.coral, p[0], 4, p[1], crane); D.box(1.2, .5, 1.2, pal.ink, p[0], .25, p[1], crane); });
    D.box(5.2, .6, .6, pal.coral, 0, 8.2, -2.6, crane); D.box(5.2, .6, .6, pal.coral, 0, 8.2, 1.0, crane);
    D.box(.6, .6, 13, pal.coral, -2.2, 8.5, 1.4, crane); D.box(.6, .6, 13, pal.coral, 2.2, 8.5, 1.4, crane);
    [-5, -1, 3, 7].forEach(function (z) { D.box(4.4, .2, .3, pal.coral, 0, 8.3, z, crane); });
    D.box(1.4, 1.6, 2.0, pal.paper, 2.2, 7.1, -.8, crane); D.box(1.0, .5, .06, pal.sky, 2.2, 7.3, .22, crane, { shadow: false });
    var beacon = D.box(.2, .2, .2, pal.bad, 0, 9.1, -2.6, crane, { mat: { emissive: pal.bad, emissiveIntensity: 1.2 }, shadow: false });
    D.box(2.0, 1.8, 1.6, pal.paper, 0, .9, -.4, crane); D.box(.8, .5, .06, pal.sky, 0, 1.2, .41, crane, { shadow: false }); D.box(.7, .3, .06, pal.ink, 0, 1.6, -1.21, crane, { shadow: false });
    var trolley = D.group(0, 8.9, 0, crane); D.box(3.6, .5, 1.6, pal.ink, 0, 0, 0, trolley);
    var cables = [-1.2, 1.2].map(function (x) { return D.box(.06, 6, .06, pal.ink, x, -3, 0, trolley, { shadow: false }); });
    var spreader = D.group(0, -6, 0, trolley); D.box(2.6, .3, 1.4, pal.mustard, 0, 0, 0, spreader);
    var carried = D.box(2.4, 1.0, 1.3, pal.teal, 0, -.65, 0, spreader);
    var landing = D.box(2.4, 1.0, 1.3, pal.teal, 0, 1.0, -2.4, crane); landing.visible = false;
    /* the stack, the gate, the office, the furniture */
    var stack = D.group(11, .5, -3.0); [[0, 0, pal.plum], [2.7, 0, pal.sage], [0, 1.8, pal.mustard], [2.7, 1.8, pal.teal], [1.35, .9, pal.coral]].forEach(function (q, k) { D.box(2.4, 1.0, 1.3, q[2], q[0], .5 + (k === 4 ? 1.0 : 0), q[1], stack); });
    /* the gate across the front lane: two posts, a beam, a barrier arm hinged on the far post that lifts for the tractor */
    var gate = D.group(4, .5, -6.6); gate.rotation.y = Math.PI / 2; D.box(.3, 2.6, .3, pal.steel, -1.6, 1.3, 0, gate); D.box(.3, 2.6, .3, pal.steel, 1.6, 1.3, 0, gate); D.box(3.6, .3, .4, pal.mustard, 0, 2.7, 0, gate);
    var arm = D.group(1.6, 1.5, .25, gate); D.box(3.0, .1, .1, pal.mustard, -1.5, 0, 0, arm); [-.6, -1.4, -2.2].forEach(function (x) { D.box(.3, .12, .12, pal.bad, x, 0, 0, arm, { shadow: false }); });
    var office = D.group(12, .5, -9.0); office.name = 'harbour office'; hot.push(office);
    D.box(4.4, 2.6, 3, pal.paper, 0, 1.3, 0, office); D.box(4.7, .3, 3.3, pal.slate, 0, 2.75, 0, office); [-1.3, 0, 1.3].forEach(function (x) { D.box(.8, .7, .06, pal.sky, x, 1.5, 1.52, office, { shadow: false, mat: { emissive: pal.sky, emissiveIntensity: .4 } }); });
    D.box(.7, 1.3, .06, pal.ink, 1.4, .65, -1.52, office, { shadow: false }); var flag = D.props.flag(2.6, 1.0, office, { h: 3.4, color: pal.coral });
    [[-4, -13.6], [6, -13.6], [18.4, -5.6], [-8.6, -13.6]].forEach(function (p) { D.props.lamp(p[0], p[1], null).position.y = .5; });
    [[7.6, -3.6], [8.6, -3.6]].forEach(function (p, k) { D.props.crate(p[0], .5 + (k ? .8 : 0), p[1], null, { w: .8, h: .8, d: .8 }); });
    D.props.cone(-4.6, -4.0).position.y = .5; D.props.cone(-5.3, -4.3).position.y = .5;
    [[18.2, -2.2], [18.0, -.4], [-10.3, -3.4]].forEach(function (p, k) { D.props.tree(p[0], p[1], null, { r: .5 + k * .08, kind: k === 1 ? 'pine' : 'round', yaw: k }).position.y = .5; });
    D.props.rock(-20.5, 10.4, null, { r: .7, h: .5 }); D.props.rock(-19, 11.6, null, { r: .45, yaw: 1 }); D.props.rock(20.6, 12, null, { r: .5 });
    /* the breakwater: a stone mole in the basin with a lighthouse at its end */
    D.slab(3, 11, pal.mist, -19.5, .4, 0, null, { h: .4, r: .8, side: pal.slate }); D.props.rock(-19.6, -4.6, null, { r: .6, h: .5, yaw: 2 });
    var light = D.group(-19.5, .4, 3.6); D.cyl(.6, .7, .5, pal.slate, 0, .25, 0, light, 12); D.cyl(.42, .5, 2.4, pal.paper, 0, 1.7, 0, light, 12); D.cyl(.47, .47, .5, pal.bad, 0, 1.9, 0, light, 12);
    D.cyl(.5, .5, .15, pal.ink, 0, 2.95, 0, light, 12); var lamp = D.ball(.3, pal.lampGlow, 0, 3.3, 0, light); lamp.material = D.mat(pal.lampGlow, { emissive: pal.lampGlow, emissiveIntensity: 1.2 }).clone(); D.cone(.5, .5, pal.ink, 0, 3.85, 0, light, 12);
    /* the tractor: a cab and a flat trailer with a container, on a lap of the quay road */
    var truck = D.group(0, .5, 0), tw = []; truck.name = 'tractor'; hot.push(truck);
    D.box(1.4, 1.6, 1.8, pal.mustard, 1.9, 1.1, 0, truck); D.box(.08, .7, 1.5, pal.ink, 2.62, 1.3, 0, truck, { shadow: false }); D.box(4.6, .3, 1.6, pal.steel, -1.2, .7, 0, truck);
    var load = D.box(2.4, 1.0, 1.3, pal.plum, -1.0, 1.35, 0, truck);
    [1.8, -1.0, -2.6].forEach(function (x) { [-.9, .9].forEach(function (z) { tw.push(D.wheel(.34, .3, pal.tyre, x, .34, z, truck)); }); });
    var lap = D.path([[-8.2, -12], [16.2, -12], [16.2, -6.6], [-8.2, -6.6]], true, 2.4);
    /* the tug, on a lap in the basin, with a wake */
    var tug = D.group(0, 0, 0); tug.name = 'tug'; hot.push(tug);
    D.rbox(3.2, .8, 1.5, pal.coral, 0, .4, 0, tug, { r: .2 }); D.box(2.8, .12, 1.3, pal.paper, 0, .8, 0, tug); D.box(1.2, 1.0, 1.1, pal.paper, -.4, 1.35, 0, tug); D.box(.9, .45, .06, pal.ink, .22, 1.5, .56, tug, { shadow: false });
    D.cyl(.18, .22, .7, pal.ink, -.9, 2.1, 0, tug, 10); D.box(.3, .3, .3, pal.mustard, -1.2, 1.0, 0, tug);
    var wake = D.box(1.8, .02, .6, pal.line, -2.3, .04, 0, tug, { shadow: false, mat: { transparent: true, opacity: .7 } });
    var basin = D.path([[-15, -9], [-15.5, 2], [-13, 9], [-3, 12], [10, 12.5], [18, 9], [12, 8.5], [0, 9], [-9, 6], [-13, -2]], true, 3);
    function gull(parent) { var g = D.group(0, 0, 0, parent); var l = D.box(.5, .03, .14, pal.paper, -.26, 0, 0, g, { shadow: false }), r = D.box(.5, .03, .14, pal.paper, .26, 0, 0, g, { shadow: false }); D.box(.18, .06, .12, pal.cloud, 0, 0, 0, g, { shadow: false }); return { g: g, l: l, r: r }; }
    var gulls = [gull(), gull()], fly = D.path([[-20, 2], [-6, 8], [8, 9], [20, 2]]);
    return { hot: hot, ship: ship, crane: crane, trolley: trolley, spreader: spreader, cables: cables, carried: carried, landing: landing, deck: deck, beacon: beacon, truck: truck, tw: tw, load: load, lap: lap, tug: tug, wake: wake, basin: basin, gulls: gulls, fly: fly, waves: waves, flag: flag, arm: arm, lamp: lamp, base: 0, lastPress: -1, lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    /* the crane: 18 s, nine seconds in at the start so the still frame has a box in the air; out to the ship 0–3, down 3–5, grab, up 5.5–7.5, back to the quay 7.5–10.5, down 10.5–12.5, release, up 13–15, wait 15–18.
       A tap on the crane while it waits starts the next lift now; the loop goes on from there */
    if (ctx.pressed === p.crane && ctx.pressedAt !== p.lastPress) { p.lastPress = ctx.pressedAt; if (D.phase(t - p.base + 9, 18) * 18 >= 15) p.base = t + 9; }
    var T = D.phase(t - p.base + 9, 18) * 18, zShip = 4.7, zQuay = -2.4, z, drop, loaded, read;
    if (T < 3) { z = D.lerp(zQuay, zShip, D.inOut(T / 3)); drop = 0; loaded = false; read = 'crane · out to the ship'; }
    else if (T < 5) { z = zShip; drop = D.smooth((T - 3) / 2) * 4.25; loaded = false; read = 'crane · down to the deck'; }
    else if (T < 5.5) { z = zShip; drop = 4.25; loaded = T > 5.25; read = 'crane · hooked on'; }
    else if (T < 7.5) { z = zShip; drop = 4.25 * (1 - D.smooth((T - 5.5) / 2)); loaded = true; read = 'crane · lifting'; }
    else if (T < 10.5) { z = D.lerp(zShip, zQuay, D.inOut((T - 7.5) / 3)); drop = 0; loaded = true; read = 'crane · over the quay'; }
    else if (T < 12.5) { z = zQuay; drop = D.smooth((T - 10.5) / 2) * 5.05; loaded = true; read = 'crane · setting down'; }
    else if (T < 13) { z = zQuay; drop = 5.05; loaded = T < 12.75; read = 'crane · released'; }
    else if (T < 15) { z = zQuay; drop = 5.05 * (1 - D.smooth((T - 13) / 2)); loaded = false; read = 'crane · back up'; }
    else { z = zQuay; drop = 0; loaded = false; read = 'crane · waiting'; }
    p.trolley.position.z = z; p.spreader.position.y = -2.2 - drop; p.cables.forEach(function (c) { c.scale.y = (2.2 + drop) / 6; c.position.y = -(2.2 + drop) / 2; });
    p.carried.visible = loaded; p.deck[0].visible = T < 5.25 || T >= 17.5; p.landing.visible = T >= 12.75 && T < 17;
    ctx.read = read;
    p.beacon.material.emissiveIntensity = D.phase(t, 1.1) < .5 ? 1.4 : .15; p.lamp.material.emissiveIntensity = .3 + 1.2 * D.pulse(t, 4, .3);
    /* the tractor: a 26 s lap with a 4 s stop at the gate; the barrier lifts as it leaves and drops once it is through */
    var L = p.lap.length, U = D.phase(t, 26) * 26, gateAt = L * .66, dist;
    if (U < 11) dist = D.inOut(U / 11) * gateAt; else if (U < 15) dist = gateAt; else dist = gateAt + D.inOut((U - 15) / 11) * (L - gateAt);
    var open = U < 14 ? 0 : U < 15 ? D.smooth(U - 14) : U < 19.5 ? 1 : U < 20.5 ? 1 - D.smooth(U - 19.5) : 0; p.arm.rotation.z = -1.35 * open;
    D.place(p.truck, p.lap, dist); D.spin(p.tw, dist, .34);
    /* the tug: a 34 s lap of the basin, bobbing */
    var td = D.phase(t, 34) * p.basin.length; D.place(p.tug, p.basin, td);
    p.tug.position.y = .02 + .05 * D.wave(t, 2.4); p.tug.rotation.z = .03 * D.wave(t, 2.0); p.tug.rotation.x = .02 * D.wave(t, 3.1);
    p.gulls.forEach(function (g, k) { var u = D.phase(t, 24, k * .45), s = p.fly.at(u * p.fly.length); g.g.position.set(s.x, 8.5 + k * .9 + .3 * D.wave(t, 3, k), s.z); g.g.rotation.y = s.yaw; var flap = .6 * D.wave(t, .45, k * .3); g.l.rotation.x = flap; g.r.rotation.x = -flap; });
    var wrap = function (x) { return ((x + 21) % 42 + 42) % 42 - 21; };
    p.waves.forEach(function (w, k) { w.scale.x = .6 + .5 * (D.wave(t, 3.5, k * .17) * .5 + .5); var x0 = w.userData.x0 == null ? (w.userData.x0 = w.position.x) : w.userData.x0; w.position.x = wrap(x0 + .25 * t * (k % 2 ? 1 : -1)); });
    p.flag.cloth.rotation.y = .25 * D.wave(t, 2.1) + .1 * D.wave(t, .7);
    p.hot.forEach(function (g) { var s = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18)); s.t = ctx.hover === g ? .35 : 0; s.step(ctx.dt); g.position.y = (g.userData.y0 == null ? (g.userData.y0 = g.position.y) : g.userData.y0) + s.x + (g === p.tug ? .02 + .05 * D.wave(t, 2.4) : 0); });
  }
});

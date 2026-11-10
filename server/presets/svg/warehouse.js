/* warehouse · a hero: a distribution centre at work.
   A truck circles the yard and pauses at the dock, a forklift shuttles pallets
   from the dock to the racks, a worker walks the aisle, the roof flag stirs.
   The pointer tilts the camera and lifts whatever it rests on. */
Any3d.figure({
  name: 'warehouse',
  size: 'hero',
  title: 'Northgate DC',
  means: 'A truck circles the yard and docks, a forklift carries pallets to the racks, and the yard keeps its own time.',
  hint: 'Hover the truck, the forklift or the building.',
  camera: { az: 38, el: 35.264, pad: 1.05 },
  still: 9,
  build: function (o) {
    var D = o.D, pal = o.pal;
    var hot = [];
    D.slab(36, 26, pal.ground, 0, 0, 0, null, { h: .7, r: 2, side: pal.base });

    /* yard: road loop, lane stripes, grass verges */
    D.box(33.2, .03, 3.6, pal.asphalt, 0, .05, 10.3, null, { shadow: false });
    D.box(33.2, .03, 3.6, pal.asphalt, 0, .05, -9.8, null, { shadow: false });
    D.box(3.6, .03, 23.7, pal.asphalt, 14.8, .05, .25, null, { shadow: false });
    D.box(3.6, .03, 23.7, pal.asphalt, -14.8, .05, .25, null, { shadow: false });
    for (var i = -12; i <= 12; i += 2.2) { D.box(1.1, .012, .14, pal.line, i, .075, 10.3, null, { shadow: false }); D.box(1.1, .012, .14, pal.line, i, .075, -9.8, null, { shadow: false }); }
    for (var j = -7.6; j <= 8; j += 2.2) { D.box(.14, .012, 1.1, pal.line, 14.8, .075, j, null, { shadow: false }); D.box(.14, .012, 1.1, pal.line, -14.8, .075, j, null, { shadow: false }); }
    D.box(5, .03, 6, pal.grass, -11.5, .05, 1, null, { shadow: false });
    D.box(30, .03, .7, pal.grass, -1, .05, 12.55, null, { shadow: false });
    
    [-7.2, -3.6, 0, 3.6, 7.2].forEach(function (x, k) { D.props.tree(x, 12.5, null, { r: .4 + .05 * (k % 3), kind: k % 3 === 2 ? 'pine' : 'round', yaw: k * 1.3 }); });
    D.props.tree(-12.9, 2.6, null, { r: .55, kind: 'tall', yaw: 2 }); D.props.tree(17.4, -1.6, null, { r: .5, kind: 'round', yaw: 1 });
    D.props.bush(-12.6, 3.4, null, { r: .3, color: pal.leaf }); D.props.bush(-12.2, 2.2); D.props.bush(17.1, -3.4); D.props.bush(17.2, 1.4, null, { r: .3, color: pal.leaf });
    [[-8, 5], [4, 5], [17.5, 3.6], [17.5, -6]].forEach(function (p) { D.props.lamp(p[0], p[1]); });
    D.props.cone(9.6, 4.6); D.props.cone(10.4, 4.3);
    [[8.4, 2.2], [9.4, 2.2], [8.9, 2.2]].forEach(function (p, k) { D.props.crate(p[0], k === 2 ? .8 : 0, p[1], null, { w: .9, h: .8, d: .9 }); });
    var van = D.group(9.4, 0, -5.6);
    D.box(3.4, 1.6, 1.8, pal.plum, 0, 1.15, 0, van); D.box(1.1, 1.2, 1.76, pal.paper, 1.6, .95, 0, van); D.box(.06, .6, 1.5, pal.ink, 2.16, 1.2, 0, van);
    [1.2, -1.1].forEach(function (x) { [-.95, .95].forEach(function (z) { D.wheel(.34, .3, pal.tyre, x, .34, z, van); }); });

    /* the building: shell, roof, parapet, units, sign, windows, dock doors */
    var bld = D.group(-2.9, 0, -3.2);
    D.box(18, 5.4, 10, pal.paper, 0, 2.7, 0, bld);
    D.box(18.3, .5, 10.3, pal.terracotta, 0, 5.55, 0, bld);
    D.box(18, .5, 10, pal.cloud, 0, 5.1, 0, bld);
    D.box(18.3, .35, .4, pal.safety, 0, 1.3, 5.1, bld);
    [[-5, -2], [1, -3], [5, 1], [-2, 2.5]].forEach(function (p) { D.box(1.4, .8, 1.4, pal.cloud, p[0], 6.2, p[1], bld); D.cyl(.45, .45, .2, pal.slate, p[0], 6.7, p[1], bld, 14); });
    for (var w = -7.6; w <= 7.6; w += 1.9) D.box(1.2, .8, .06, pal.sky, w, 4.1, 5.03, bld, { shadow: false });
    var doors = [];
    [-1.2, 2.2, 5.6].forEach(function (x) {
      D.box(2.6, 3.4, .12, pal.cloud, x, 1.7, 5.06, bld, { shadow: false });
      var dr = D.box(2.3, 3.1, .08, pal.steel, x, 1.55, 5.1, bld, { shadow: false }); doors.push(dr);
      D.box(.3, .5, .4, pal.ink, x - 1.1, .3, 5.3, bld); D.box(.3, .5, .4, pal.ink, x + 1.1, .3, 5.3, bld);
      var lamp = D.box(.22, .12, .14, pal.ok, x + 1.4, 3.5, 5.12, bld, { mat: { emissive: pal.ok, emissiveIntensity: .8 }, shadow: false }); dr.userData.lamp = lamp;
    });
    bld.name = 'warehouse'; hot.push(bld);
    var flag = D.props.flag(-8.4, 0, bld, { h: 2.6, color: pal.coral }); flag.group.position.y = 5.8;

    /* racks: four bays, three levels, a few loads */
    var rack = D.group(-10.5, 0, 5.2), beams = [];
    for (var b = 0; b < 4; b++) {
      var x = b * 1.6;
      [0, 1.3].forEach(function (z) { D.box(.1, 3.2, .1, pal.steel, x - .7, 1.6, z - .65, rack); D.box(.1, 3.2, .1, pal.steel, x + .7, 1.6, z - .65, rack); });
      [1.05, 2.1, 3.15].forEach(function (y) { beams.push(D.box(1.5, .12, 1.3, pal.safety, x, y, 0, rack)); });
      if (b !== 2) D.props.pallet(x, 1.11, 0, rack, { h: .7, color: [pal.mint, pal.plum, pal.rose][b % 3] });
      if (b === 0 || b === 3) D.props.pallet(x, 2.16, 0, rack, { h: .6, color: pal.cardboard });
    }
    var slot = { x: -10.5 + 2 * 1.6, y: 1.11, z: 5.2 };

    /* the truck: cab, trailer, wheels; it rides a closed loop */
    var truck = D.group(0, 0, 0), tw = [];
    D.box(5.4, 2.5, 2.4, pal.paper, -1.05, 2.05, 0, truck);
    D.box(5.42, .3, 2.42, pal.teal, -1.05, 1.1, 0, truck);
    D.box(7.3, .35, 1.4, pal.steel, -.1, .72, 0, truck);
    D.box(2, 2.1, 2.3, pal.accent, 2.75, 1.75, 0, truck);
    D.box(1.5, .5, 2.2, pal.teal, 2.5, 3.05, 0, truck);
    D.box(.08, .8, 2, pal.ink, 3.76, 2.1, 0, truck);
    [3.3, 1.5, -2.2, -3.2].forEach(function (x) { [-1.05, 1.05].forEach(function (z) { tw.push(D.wheel(.46, .36, pal.tyre, x, .46, z, truck)); D.wheel(.2, .4, pal.hub, x, .46, z, truck); }); });
    truck.name = 'truck'; hot.push(truck);
    var loop = D.path([[-14.8, 10.3], [14.8, 10.3], [14.8, -9.8], [-14.8, -9.8]], true, 4);

    /* the forklift: body, mast, forks; a pallet rides the carriage when loaded */
    var fl = D.group(0, 0, 0), fw = [];
    D.box(1.4, .6, 1.1, pal.safety, -.1, .55, 0, fl);
    D.box(.5, .8, 1.1, pal.flame, -.78, .7, 0, fl);
    [[-.6, -.5], [-.6, .5], [.42, -.5], [.42, .5]].forEach(function (p) { D.box(.07, 1.35, .07, pal.steel, p[0], 1.55, p[1], fl); });
    D.box(1.15, .06, 1.08, pal.steel, -.09, 2.22, 0, fl);
    [-.32, .32].forEach(function (z) { D.box(.1, 2.3, .1, pal.slate, .74, 1.25, z, fl); });
    var beacon = D.box(.16, .12, .16, pal.warn, -.4, 2.31, 0, fl, { mat: { emissive: pal.flame, emissiveIntensity: .2 }, shadow: false });
    [[.45, .3], [-.62, .26]].forEach(function (p) { [-.52, .52].forEach(function (z) { fw.push(D.wheel(p[1], .22, pal.tyre, p[0], p[1], z, fl)); }); });
    var driver = D.props.person(-.2, 0, fl, { shirt: pal.teal }); driver.position.y = .55; driver.rotation.y = Math.PI / 2;
    var carriage = D.group(.8, .1, 0, fl);
    D.box(.07, .6, .82, pal.steel, 0, .3, 0, carriage);
    [-.26, .26].forEach(function (z) { D.box(1.1, .05, .14, pal.steel, .55, .02, z, carriage); });
    var load = D.props.pallet(.55, .04, 0, carriage, { h: .7, color: pal.mint }); load.rotation.y = Math.PI / 2;
    fl.name = 'forklift'; hot.push(fl);
    var run = D.path([[-1.3, 3.2], [-3.8, 3.2], [-3.8, 7.9], [slot.x, 7.9]]);

    /* people */
    var walker = D.props.person(0, 0, null, { shirt: pal.plum }), walk = D.path([[-11.4, 3.8], [-6.8, 3.8]]);
    D.props.person(1.9, 3.0, null, { shirt: pal.ok, yaw: 2.4 });
    D.props.person(2.5, 3.3, null, { shirt: pal.rose, yaw: -.6, hat: pal.paper });
    [[4.0, 2.3], [5.1, 2.3]].forEach(function (p) { D.props.pallet(p[0], .02, p[1], null, { h: .6, color: pal.mint }); });

    return { hot: hot, truck: truck, tw: tw, loop: loop, doors: doors, fl: fl, fw: fw, carriage: carriage, load: load, run: run, beacon: beacon, flag: flag, walker: walker, walk: walk, lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t, pal = ctx.pal;
    /* truck: 24 s lap; drives 9 s, waits 5 s at the dock, drives on */
    var T = D.phase(t, 24) * 24, L = p.loop.length, dock = 13.5, dist;
    if (T < 9) dist = D.inOut(T / 9) * dock;
    else if (T < 14) dist = dock;
    else dist = dock + D.inOut((T - 14) / 10) * (L - dock);
    D.place(p.truck, p.loop, dist); D.spin(p.tw, dist, .46);
    ctx.read = T < 9 ? 'truck · driving to the dock' : T < 14 ? 'truck · at the dock' : 'truck · back on the lap';
    var open = D.smooth((T - 8.4) / 1.2) * (1 - D.smooth((T - 13.6) / 1.2));
    p.doors[1].scale.y = 1 - .85 * open; p.doors[1].position.y = 1.55 - 1.3 * open;
    p.doors[1].userData.lamp.material.color.set(open > .5 ? pal.bad : pal.ok); p.doors[1].userData.lamp.material.emissive.set(open > .5 ? pal.bad : pal.ok);

    /* forklift: 14 s cycle; out loaded along the aisle, turn to face the bay, lift, drive in, set down, back out, lower, turn, home */
    var F = D.phase(t, 14) * 14, R = p.run.length, d = 0, up = 0, loaded = 1, turn = 0, adv = 0;
    if (F < 4) { d = D.inOut(F / 4) * R; }
    else if (F < 4.8) { d = R; turn = D.smooth((F - 4) / .8); }
    else if (F < 6) { d = R; turn = 1; up = D.smooth((F - 4.8) / 1.2); }
    else if (F < 7.2) { d = R; turn = 1; up = 1; adv = D.inOut((F - 6) / 1.2); }
    else if (F < 7.8) { d = R; turn = 1; up = 1; adv = 1; loaded = 1 - D.smooth((F - 7.2) / .6); }
    else if (F < 9) { d = R; turn = 1; up = 1; adv = 1 - D.inOut((F - 7.8) / 1.2); loaded = 0; }
    else if (F < 10) { d = R; turn = 1; up = 1 - D.smooth((F - 9) / 1); loaded = 0; }
    else if (F < 10.8) { d = R; turn = 1 - D.smooth((F - 10) / .8); loaded = 0; }
    else if (F < 13.6) { d = (1 - D.inOut((F - 10.8) / 2.8)) * R; loaded = 0; }
    else { loaded = D.smooth((F - 13.6) / .4); }
    var q = p.run.at(d), back = F >= 10.8 && F < 13.6;
    p.fl.position.set(q.x, 0, q.z - adv * 1.4);
    p.fl.rotation.y = q.yaw + (back ? Math.PI : 0) - turn * Math.PI / 2;
    p.carriage.position.y = .1 + up * 1.05; p.load.visible = loaded > .5; p.load.scale.setScalar(Math.max(.001, loaded));
    d += adv * 1.4;
    D.spin(p.fw, d, .3);
    p.beacon.material.emissiveIntensity = .2 + .8 * (D.phase(t, .8) < .5 ? 1 : 0);

    /* the walker, the flag, the hover lift */
    var W = D.phase(t, 16), wd = W < .5 ? D.smooth(W * 2) : 1 - D.smooth((W - .5) * 2);
    D.place(p.walker, p.walk, wd * p.walk.length); if (W >= .5) p.walker.rotation.y += Math.PI;
    p.walker.position.y = Math.abs(D.wave(t, .5)) * .05;
    p.flag.cloth.rotation.y = .25 * D.wave(t, 2.1) + .1 * D.wave(t, .7);
    p.hot.forEach(function (g) {
      var s = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18));
      s.t = ctx.hover === g ? .35 : 0; s.step(ctx.dt);
      if (g !== p.fl) g.position.y = s.x; else g.position.y = s.x;
    });
  }
});

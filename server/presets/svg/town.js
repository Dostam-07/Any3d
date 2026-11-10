/* town · a hero: a small town on a plate.
   Two avenues and three streets cut six blocks: houses with gabled roofs,
   shops with awnings, an office tower with a flag, a park with a pond and a
   fountain, a station, a building site with a crane that turns. Cars and a
   bus ride the streets on their own laps, a tram crosses, people walk, the
   traffic lights cycle, a cloud drifts. The pointer lifts what it rests on. */
Any3d.figure({
  name: 'town',
  size: 'hero',
  title: 'Alder Springs',
  means: 'Six blocks of houses, shops, a park and a tower; cars, a bus and a tram keep the streets busy and the crane turns.',
  hint: 'Hover a house, the tower, a car or the tram.',
  camera: { az: 37, el: 34, pad: 1.04 },
  still: 14,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [], R = 1;
    var rnd = function () { R = (R * 16807) % 2147483647; return R / 2147483647; };
    D.slab(46, 32, pal.ground, 0, 0, 0, null, { h: .8, r: 3, side: pal.base });

    /* streets: two avenues along x, three streets along z, dashes, crossings */
    [-6.5, 6.5].forEach(function (z) { D.box(42, .03, 3.4, pal.asphalt, 0, .05, z, null, { shadow: false }); for (var i = -19; i <= 19; i += 2.2) D.box(1.1, .012, .14, pal.line, i, .075, z, null, { shadow: false }); });
    [-7, 7].forEach(function (x) { D.box(3.4, .03, 28, pal.asphalt, x, .05, 0, null, { shadow: false }); for (var j = -12.5; j <= 12.5; j += 2.2) if (Math.abs(j) < 4.5 || Math.abs(j) > 8.7) D.box(.14, .012, 1.1, pal.line, x, .075, j, null, { shadow: false }); });
    [-7, 7].forEach(function (x) { [-6.5, 6.5].forEach(function (z) { [-2.3, 2.3].forEach(function (dz) { for (var k = -1.2; k <= 1.2; k += .6) D.box(.35, .014, .9, pal.line, x + k, .08, z + dz, null, { shadow: false }); }); }); });

    /* a block is a rectangle between streets; its buildings face the avenue */
    var ROOFS = [pal.terracotta, pal.mustard, pal.teal, pal.plum, pal.sage, pal.coral];
    function house(x, z, yaw, roof, w, d, floors) {
      w = w || 2.6; d = d || 2.2; floors = floors || 1; var h = 1.5 * floors, g = D.group(x, 0, z); g.rotation.y = yaw;
      D.box(w, h, d, pal.paper, 0, h / 2, 0, g);
      D.wedge(w + .3, 1.1, d + .3, roof, 0, h, 0, g);
      D.box(.4, .7, .4, pal.mist, w * .25, h + .9, -d * .15, g);
      D.box(.5, .9, .06, pal.ink, -w * .2, .45, d / 2 + .02, g, { shadow: false });
      for (var f = 0; f < floors; f++) { D.box(.6, .5, .06, pal.sky, w * .25, .9 + f * 1.5, d / 2 + .02, g, { shadow: false }); if (f) D.box(.6, .5, .06, pal.sky, -w * .2, .9 + f * 1.5, d / 2 + .02, g, { shadow: false }); }
      g.name = 'house'; hot.push(g); return g;
    }
    function shop(x, z, yaw, c, w) {
      w = w || 3.2; var g = D.group(x, 0, z); g.rotation.y = yaw;
      D.box(w, 2.2, 2.6, pal.cloud, 0, 1.1, 0, g); D.box(w + .2, .25, 2.8, pal.slate, 0, 2.3, 0, g);
      D.box(w - .6, 1.1, .06, pal.sky, 0, .95, 1.32, g, { shadow: false });
      for (var k = 0; k < 5; k++) D.box((w - .4) / 5, .05, .9, k % 2 ? pal.paper : c, -(w - .4) / 2 + (w - .4) / 10 + k * (w - .4) / 5, 1.7, 1.65, g);
      D.box(.4, .4, .4, pal.mist, w * .3, 2.6, -.4, g);
      g.name = 'shop'; hot.push(g); return g;
    }
    /* NW block: houses in a row on both avenues */
    [[-18.6, 2.2, 0], [-15, 2.2, 0], [-11.2, 2.2, 0], [-18.6, -2.4, Math.PI], [-15, -2.4, Math.PI], [-11.2, -2.4, Math.PI]].forEach(function (p, k) { house(p[0], p[1], p[2], ROOFS[(k * 5) % 6], 2.4 + rnd() * .5, 2.2, 1 + (k % 3 === 1 ? 1 : 0)); });
    D.props.tree(-13.1, 0, null, { r: .6, kind: 'round' }); D.props.bush(-17, 0, null, { r: .3 });
    /* the north strip, beyond the top avenue: houses facing it */
    [[-18, -11.2, 0], [-14, -11.2, 0], [-10, -11.2, 0], [-2.4, -11.2, 0], [2.4, -11.2, 0], [10.5, -11.2, 0], [14.5, -11.2, 0], [18.5, -11.2, 0]].forEach(function (p, k) { house(p[0], p[1], p[2], ROOFS[(k * 4 + 1) % 6], 2.3 + rnd() * .6, 2.3, 1 + (k % 4 === 2 ? 1 : 0)); });
    [[-16, -13.8, 'pine'], [-6, -13.6, 'round'], [6.2, -13.7, 'tall'], [16.6, -13.6, 'round'], [-12, -8.5, 'round'], [0, -9.2, 'pine'], [12.4, -8.5, 'round']].forEach(function (p, k) { D.props.tree(p[0], p[1], null, { r: .55 + (k % 3) * .1, kind: p[2], yaw: k }); });
    /* N block: shops on the avenue, the tower behind */
    shop(-3.5, 3.6, 0, pal.coral, 3.0); shop(3.5, 3.6, 0, pal.teal, 3.0); shop(0, 3.6, 0, pal.mustard, 3.4);
    var tower = D.group(0, 0, -2.2); tower.name = 'office tower'; hot.push(tower);
    D.box(7, 7.5, 3.4, pal.paper, 0, 3.75, 0, tower); D.box(7.3, .3, 3.7, pal.slate, 0, 7.6, 0, tower);
    for (var fl = 0; fl < 4; fl++) for (var wx = -2.4; wx <= 2.4; wx += 1.2) { D.box(.7, .8, .06, pal.sky, wx, 1.2 + fl * 1.7, 1.72, tower, { shadow: false }); D.box(.7, .8, .06, pal.sky, wx, 1.2 + fl * 1.7, -1.72, tower, { shadow: false }); }
    var flag = D.props.flag(2.6, 0, tower, { h: 2.2, color: pal.coral }); flag.group.position.y = 7.7;
    /* NE block: the park: grass, pond, fountain, trees, benches */
    var park = D.group(14.8, 0, 0);
    D.box(8.4, .04, 8.4, pal.grass, 0, .02, 0, park, { shadow: false });
    D.cyl(1.7, 1.7, .06, pal.sky, 1.6, .05, -1.4, park, 24); D.cyl(1.6, 1.6, .04, pal.water, 1.6, .09, -1.4, park, 24);
    var fountain = D.group(-1.8, 0, 1.6, park); D.cyl(1.0, 1.0, .3, pal.cloud, 0, .15, 0, fountain, 20); D.cyl(.9, .9, .1, pal.water, 0, .3, 0, fountain, 20); D.cyl(.12, .16, .9, pal.cloud, 0, .7, 0, fountain, 10);
    var splash = []; [0, 1, 2, 3].forEach(function (k) { splash.push(D.ball(.08, pal.sky, 0, 1.2, 0, fountain)); });
    [[-3.2, -3.2, 'round'], [3.3, 3.1, 'pine'], [-3.4, 1.8, 'tall'], [3.4, -3.3, 'round'], [0.4, 3.1, 'pine'], [-0.6, -3.3, 'round']].forEach(function (p, k) { D.props.tree(p[0], p[1], park, { r: .6 + (k % 3) * .1, kind: p[2], yaw: k }); });
    [[-.6, 1.4, 0], [.9, 3.0, Math.PI / 2]].forEach(function (b) { var g = D.group(b[0], 0, b[1], park); g.rotation.y = b[2]; D.box(1.2, .08, .4, pal.wood, 0, .45, 0, g); D.box(1.2, .4, .08, pal.wood, 0, .7, -.18, g); D.box(.08, .45, .4, pal.ink, -.5, .22, 0, g); D.box(.08, .45, .4, pal.ink, .5, .22, 0, g); });
    fountain.name = 'fountain'; hot.push(fountain);
    /* SW block: the station and a tram line */
    var station = D.group(-14.5, 0, 10.8); station.name = 'station'; hot.push(station);
    D.box(9, .3, 4.6, pal.cloud, 0, .15, 0, station); D.box(8.4, 2.4, 1.6, pal.paper, 0, 1.5, -1.3, station); D.wedge(8.8, .9, 2.0, pal.mustard, 0, 2.7, -1.3, station);
    [-3.6, -1.2, 1.2, 3.6].forEach(function (x) { D.cyl(.08, .08, 2.4, pal.ink, x, 1.5, 1.2, station, 8); }); D.box(9, .18, 2.8, pal.slate, 0, 2.75, .9, station);
    D.box(.8, 1.2, .06, pal.sky, -2, 1.5, -.48, station, { shadow: false }); D.box(.8, 1.2, .06, pal.sky, 2, 1.5, -.48, station, { shadow: false });
    [-2.6, 2.4].forEach(function (x) { D.props.person(x, .9, station, { shirt: [pal.plum, pal.teal][x < 0 ? 0 : 1], yaw: 1 }).position.y = .3; });
    D.box(36, .04, .12, pal.slate, 0, .06, 13.4, null, { shadow: false }); D.box(36, .04, .12, pal.slate, 0, .06, 14.4, null, { shadow: false });
    var tram = D.group(0, 0, 13.9), tw = []; tram.name = 'tram'; hot.push(tram);
    D.rbox(5.4, 1.5, 1.4, pal.teal, 0, 1.05, 0, tram, { r: .14 }); D.box(5.5, .35, 1.42, pal.paper, 0, 1.0, 0, tram); D.box(5.0, .5, 1.44, pal.sky, 0, 1.4, 0, tram, { shadow: false });
    D.cyl(.05, .05, 1.3, pal.ink, 0, 2.4, 0, tram, 6); [-1.8, 1.8].forEach(function (x) { [-.5, .5].forEach(function (z) { tw.push(D.wheel(.28, .2, pal.tyre, x, .28, z, tram)); }); });
    /* S block: houses and a corner café */
    [[-3.4, 9.4, Math.PI], [0, 9.4, Math.PI], [3.4, 9.4, Math.PI]].forEach(function (p, k) { house(p[0], p[1], p[2], ROOFS[(k * 7 + 2) % 6], 2.3 + rnd() * .5, 2.4, 1 + (k === 1 ? 1 : 0)); });
    shop(-2.6, 12.0, Math.PI, pal.plum, 2.8); shop(2.6, 12.0, Math.PI, pal.sage, 2.8);
    D.props.bush(-4.6, 12.2); D.props.bush(4.6, 12.1, null, { r: .3 });
    /* SE block: a building site with a crane */
    var site = D.group(14.8, 0, 10.3); site.name = 'building site'; hot.push(site);
    D.box(8.2, .04, 5.2, pal.sand, 0, .02, 0, site, { shadow: false });
    D.box(4.4, 3.0, 2.6, pal.cloud, -1.4, 1.5, 0, site); for (var fy = 1; fy <= 3; fy++) D.box(4.5, .1, 2.7, pal.steel, -1.4, fy, 0, site);
    [[-3.5, -1.2], [.7, -1.2], [-3.5, 1.2], [.7, 1.2]].forEach(function (p) { D.box(.12, 4.2, .12, pal.steel, p[0], 2.1, p[1], site); });
    [[2.4, -1.8], [3.2, -1.8], [2.8, -1.8]].forEach(function (p, k) { D.props.crate(p[0], k === 2 ? .8 : 0, p[1], site, { w: .8, h: .8, d: .8 }); });
    D.props.cone(-3.4, 2.2, site); D.props.cone(-2.6, 2.3, site);
    var crane = D.group(2.6, 0, 1.4, site); D.box(1.6, .3, 1.6, pal.steel, 0, .15, 0, crane); D.box(.5, 7, .5, pal.mustard, 0, 3.6, 0, crane);
    var jib = D.group(0, 7.1, 0, crane); D.box(7, .35, .4, pal.mustard, 1.8, 0, 0, jib); D.box(1.6, .5, .6, pal.steel, -1.6, 0, 0, jib); var hook = D.group(3.8, 0, 0, jib); D.cyl(.02, .02, 3, pal.ink, 0, -1.5, 0, hook, 6); D.box(.5, .4, .5, pal.coral, 0, -3.2, 0, hook);
    D.props.person(-3.4, -2.2, site, { shirt: pal.coral, hat: pal.mustard, yaw: .8 });
    /* streets' furniture: trees, lamps, lights */
    [[-10.5, 4.75], [-3.9, -4.5], [3.6, 4.4], [10.6, -4.6], [-10.6, 9.0], [11.4, 9.0], [-3.5, 9.0], [3.5, -9.0], [-19.5, 8.4], [19.5, -8.4]].forEach(function (p, k) { D.props.tree(p[0], p[1], null, { r: (k === 1 || k === 2) ? .4 : .55 + (k % 3) * .08, kind: k % 4 === 1 ? 'pine' : k % 4 === 3 ? 'tall' : 'round', yaw: k * .7 }); });
    [[-14, 4.6], [14, -4.6], [-1, -8.4], [1, 8.4], [-19.5, -8.4], [19.5, 8.4]].forEach(function (p) { D.props.lamp(p[0], p[1]); });
    var lights = [];
    [[-9.2, -4.5, 0], [-4.8, 4.5, Math.PI], [4.8, -4.5, 0], [9.2, 4.5, Math.PI]].forEach(function (p) { var g = D.group(p[0], 0, p[1]); g.rotation.y = p[2]; D.cyl(.06, .07, 2.6, pal.ink, 0, 1.3, 0, g, 8); D.box(.3, .9, .3, pal.ink, 0, 2.6, 0, g); var r = D.box(.16, .16, .05, pal.bad, 0, 2.9, .17, g, { mat: { emissive: pal.bad, emissiveIntensity: 1 }, shadow: false }), y = D.box(.16, .16, .05, pal.mustard, 0, 2.6, .17, g, { mat: { emissive: pal.mustard, emissiveIntensity: .1 }, shadow: false }), gr = D.box(.16, .16, .05, pal.ok, 0, 2.3, .17, g, { mat: { emissive: pal.ok, emissiveIntensity: .1 }, shadow: false }); lights.push([r.material, y.material, gr.material]); });
    /* vehicles: cars on three laps, a bus on the big one */
    function car(c) { var g = D.group(0, 0, 0), w = []; D.rbox(2.1, .6, 1.1, c, 0, .5, 0, g, { r: .12 }); D.rbox(1.1, .5, 1.0, pal.paper, -.15, 1.0, 0, g, { r: .12 }); D.box(.05, .35, .9, pal.ink, .42, 1.0, 0, g, { shadow: false }); [.7, -.7].forEach(function (x) { [-.55, .55].forEach(function (z) { w.push(D.wheel(.24, .2, pal.tyre, x, .24, z, g)); }); }); g.name = 'car'; hot.push(g); return { g: g, w: w }; }
    var cars = [
      { v: car(pal.coral), p: D.path([[6.1, 5.6], [-6.1, 5.6], [-6.1, -5.6], [6.1, -5.6]], true), off: .5 },
      { v: car(pal.plum), p: D.path([[6.1, 5.6], [-6.1, 5.6], [-6.1, -5.6], [6.1, -5.6]], true), off: 0 },
      { v: car(pal.mustard), p: D.path([[-7.9, 7.4], [7.9, 7.4], [7.9, -7.4], [-7.9, -7.4]], true), off: .33 },
      { v: car(pal.teal), p: D.path([[-7.9, 7.4], [7.9, 7.4], [7.9, -7.4], [-7.9, -7.4]], true), off: .66 }
    ];
    cars.forEach(function (c) { c.T = c.p.length / 2.2; });
    /* parked cars on the outer stretches, nose along their lane */
    [[-15, 7.4, 0, pal.rose], [16.5, -7.4, Math.PI, pal.sage], [7.9, -11, Math.PI / 2, pal.plum]].forEach(function (q) { var v = car(q[3]); v.g.position.set(q[0], 0, q[1]); v.g.rotation.y = q[2]; });
    var bus = D.group(0, 0, 0), bw = []; bus.name = 'bus'; hot.push(bus);
    D.rbox(4.6, 1.6, 1.4, pal.sage, 0, 1.05, 0, bus, { r: .14 }); D.box(4.2, .55, 1.44, pal.sky, .1, 1.3, 0, bus, { shadow: false }); D.box(.05, .7, 1.2, pal.ink, 2.32, 1.1, 0, bus, { shadow: false });
    [1.5, -1.5].forEach(function (x) { [-.7, .7].forEach(function (z) { bw.push(D.wheel(.3, .22, pal.tyre, x, .3, z, bus)); }); });
    var busLap = D.path([[-7.9, 7.4], [7.9, 7.4], [7.9, -7.4], [-7.9, -7.4]], true, .8);
    /* walkers and a cloud */
    var walkers = [[[-19, 3.9], [-9.5, 3.9]], [[3, -4.3], [-2.8, -4.3]], [[10.4, 4.4], [19.2, 4.4]]].map(function (w, k) { return { g: D.props.person(0, 0, null, { shirt: [pal.plum, pal.teal, pal.rose][k], hat: k === 2 ? pal.paper : false }), p: D.path(w), T: 12 + k * 3 }; });
    var cloud = D.props.cloud(-12, 10.5, -10, null, { r: 1.1 });
    return { hot: hot, cars: cars, bus: bus, bw: bw, busLap: busLap, tram: tram, tw: tw, jib: jib, hook: hook, splash: splash, lights: lights, walkers: walkers, cloud: cloud, flag: flag, lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    p.cars.forEach(function (c) { var d = D.phase(t, c.T, c.off) * c.p.length; D.place(c.v.g, c.p, d); D.spin(c.v.w, d, .24); });
    var bd = D.phase(t, p.busLap.length / 2.2) * p.busLap.length;
    D.place(p.bus, p.busLap, bd); D.spin(p.bw, bd, .3);
    var T = D.phase(t, 28), td = T < .5 ? D.inOut(T * 2) : 1 - D.inOut((T - .5) * 2);
    p.tram.position.x = -15 + td * 30; p.tram.rotation.y = T < .5 ? 0 : Math.PI; D.spin(p.tw, td * 30, .28);
    p.jib.rotation.y = .6 * D.wave(t, 26) + .2; p.hook.position.x = 3 + 1.2 * D.wave(t, 11); p.hook.children[1].position.y = -3.2 + .8 * D.wave(t, 7);
    p.splash.forEach(function (b, k) { var u = D.phase(t, 1.4, k * .25); b.position.set(.35 * Math.cos(k * 1.57) * u, 1.2 + .9 * u - 1.2 * u * u, .35 * Math.sin(k * 1.57) * u); b.scale.setScalar(1 - u * .6); });
    var ph = D.phase(t, 12);
    p.lights.forEach(function (l, k) { var q = (ph + (k % 2) * .5) % 1; l[0].emissiveIntensity = q < .45 ? 1 : .1; l[1].emissiveIntensity = q >= .45 && q < .55 ? 1 : .1; l[2].emissiveIntensity = q >= .55 ? 1 : .1; });
    p.walkers.forEach(function (w) { var W = D.phase(t, w.T), wd = W < .5 ? D.smooth(W * 2) : 1 - D.smooth((W - .5) * 2); D.place(w.g, w.p, wd * w.p.length); if (W >= .5) w.g.rotation.y += Math.PI; w.g.position.y = .05 * Math.abs(D.wave(t, .5)); });
    p.cloud.position.x = ((-12 + .05 * t + 24) % 48 + 48) % 48 - 24;
    p.flag.cloth.rotation.y = .25 * D.wave(t, 2.1) + .1 * D.wave(t, .7);
    p.hot.forEach(function (g) { var s = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18)); s.t = ctx.hover === g ? .3 : 0; s.step(ctx.dt); g.position.y = (g.userData.y0 == null ? (g.userData.y0 = g.position.y) : g.userData.y0) + s.x; });
  }
});

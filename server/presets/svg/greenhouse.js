/* greenhouse · a card: propagation.
   A glass house holds two benches of seedlings; the mist drifts, the
   watering can tilts and the door sways in the warm air. */
Any3d.figure({
  name: 'greenhouse',
  size: 'card',
  theme: 'soft',
  title: 'Propagation',
  means: 'A glass greenhouse holds two benches of seedlings; the mist drifts, the watering can tilts and the door sways.',
  hint: 'Hover a bench, the watering can or the door.',
  camera: { az: 41, el: 33, pad: 1.06 },
  still: 2,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(11, 8.5, pal.ground, 0, 0, 0, null, { h: .6, r: 1.2, side: pal.base });
    D.box(10.2, .04, 7.6, pal.sand, 0, .02, 0, null, { shadow: false });
    D.box(1.6, .02, 7.0, pal.paper, 0, .04, 0, null, { shadow: false });
    var house = D.group(0, 0, -.6); house.name = 'the greenhouse'; hot.push(house);
    [[-3.6, -3.0], [3.6, -3.0], [-3.6, 2.4], [3.6, 2.4]].forEach(function (p) {
      D.box(.14, 3.4, .14, pal.paper, p[0], 1.7, p[1], house);
    });
    [-3.0, 2.4].forEach(function (z) { D.box(7.4, .14, .14, pal.paper, 0, 3.4, z, house); });
    [-3.6, 3.6].forEach(function (x) { D.box(.14, .14, 5.6, pal.paper, x, 3.4, -.3, house); });
    D.box(7.4, .12, .2, pal.paper, 0, 4.1, -.3, house);
    for (var gx = -2.4; gx <= 2.4; gx += 2.4) D.box(.1, .1, 5.4, pal.paper, gx, 4.05, -.3, house);
    D.box(7.2, 2.8, .04, pal.sky, 0, 1.7, -3.02, house, { shadow: false, mat: { transparent: true, opacity: .22 } });
    D.box(.04, 2.8, 5.2, pal.sky, 3.58, 1.7, -.3, house, { shadow: false, mat: { transparent: true, opacity: .18 } });
    [-1.5, .9].forEach(function (z, bi) {
      var b = D.group(0, 0, z); b.name = 'bench ' + (bi + 1); hot.push(b);
      D.box(6.0, .12, 1.0, pal.wood, 0, .9, 0, b);
      [[-2.7, -.35], [2.7, -.35], [-2.7, .35], [2.7, .35]].forEach(function (l) { D.box(.12, .88, .12, pal.steel, l[0], .44, l[1], b); });
      for (var p = 0; p < 7; p++) {
        var px = -2.5 + p * .84;
        D.cyl(.16, .13, .2, pal.terracotta, px, 1.06, 0, b, 10);
        D.props.bush(0, 0, b, { r: .17 }).position.set(px, 1.16, 0);
      }
    });
    var can = D.group(2.4, 0, 1.9); can.name = 'watering can'; hot.push(can); can.rotation.y = -.6;
    D.cyl(.3, .34, .55, pal.teal, 0, .3, 0, can, 12);
    D.cyl(.12, .12, .08, pal.teal, 0, .6, 0, can, 10);
    D.box(.08, .08, .55, pal.teal, 0, .5, -.35, can);
    D.box(.2, .26, .06, pal.teal, .36, .35, 0, can);
    D.cyl(.3, .24, .4, pal.steel, -3.0, .22, 1.8, null, 12);
    var door = D.group(3.5, 0, 2.0); door.name = 'the door'; hot.push(door);
    D.box(.08, 2.4, 1.2, pal.paper, 0, 1.2, 0, door);
    D.box(.04, 2.2, .5, pal.sky, .04, 1.2, 0, door, { shadow: false, mat: { transparent: true, opacity: .25 } });
    var mist = [];
    for (var m = 0; m < 6; m++) {
      var mb = D.ball(.07, pal.paper, -2.4 + m * 1.0, 1.4 + (m % 3) * .5, -.8 + (m % 2) * 1.2);
      mb.castShadow = false; mist.push(mb);
    }
    return { hot: hot, can: can, door: door, mist: mist, lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    p.can.rotation.z = .12 * D.wave(t, 3.4);
    p.door.rotation.y = .1 * D.wave(t, 5.2);
    p.mist.forEach(function (b, k) {
      var u = D.phase(t, 6, k * .37);
      b.position.x = -2.4 + k * 1.0 + .3 * D.wave(t, 2.4, k);
      b.position.y = 1.2 + u * 1.4;
      b.scale.setScalar((1 - u) * 1.1 + .1);
    });
    p.hot.forEach(function (g) {
      var s = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18));
      s.t = ctx.hover === g ? .28 : 0; s.step(ctx.dt); g.position.y = s.x;
    });
    ctx.read = 'mist · on';
  }
});

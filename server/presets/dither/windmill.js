/* A walled grass yard. The sails turn on a shaft in the cap's front. Tap the miller to brake. */
Pixel.scene({
  name: 'windmill',
  title: 'The windmill',
  means: 'A stone mill under a conical tile cap. The sails turn on the front shaft while the miller holds a sack.',
  hint: 'Hover the miller or the carter; tap the miller to brake the sails.',
  width: 360, height: 280, duration: 8, still: 2, fps: 12,
  bayer: 4, shadow: 'hard', rim: true, wind: 8, contact: .42,
  camera: { az: 45, el: 30, height: 1.08, scale: 56 },
  sun: Dither.sun(45, 38, 16),
  ground: {
    rx: 3.5, rz: 2.65, wobble: .36, fade: .32, rect: true,
    zone: function (x, z) {
      if (x > .15 && x < 1.25 && z > .35 && z < 2.35) return 'earth';
      return 'meadow';
    }
  },
  materials: {
    meadow: Dither.mat('meadow'), earth: Dither.mat('earth'), stone: Dither.mat('stone'),
    tile: Dither.mat('tile'), timber: Dither.mat('timber'), beam: Dither.mat('beam'),
    sail: Dither.mat('sail'), sack: Dither.mat('sack'), iron: Dither.mat('iron'),
    leaf: Dither.mat('leaf'), cart: Dither.mat('cart'), lantern: Dither.mat('lantern'),
    moss: Dither.mat('moss')
  },
  build: function (P) {
    var parts = { plants: [] };
    var ix = 2.75, iz = 2.05;
    Dither.wall(P, 0, -iz, ix * 2, 0);
    Dither.wall(P, -ix, 0, iz * 2, Math.PI / 2);
    Dither.wall(P, ix, 0, iz * 2, Math.PI / 2);
    Dither.wall(P, -1.35, iz, 2.8, 0);
    Dither.wall(P, 1.92, iz, 1.65, 0);
    Dither.gate(P, .55, iz, 0);

    var mill = P.group(-1.2, 0, .48);
    mill.rotation.y = .74;
    Dither.seat(mill, 'mill');
    var plinth = P.box(1.38, .16, 1.38, 'stone', 0, .08, 0, mill);
    Dither.seat(plinth, 'plinth');
    var rTop = .4, th = 1.56, base = .16, top = base + th;
    var tower = P.cyl(rTop, .62, th, 'stone', 0, base + th / 2, 0, mill, 8);
    Dither.seat(tower, 'tower', plinth);
    var door = P.box(.28, .52, .1, 'timber', 0, base + .26, .54, mill);
    Dither.seat(door, 'door', tower);
    Dither.seat(P.box(.32, .06, .06, 'beam', 0, base + .54, .56, mill), 'lintel', door);
    Dither.seat(P.box(.1, .12, .05, 'beam', -.22, base + .88, .38, mill), 'window', tower);
    Dither.seat(P.box(.1, .12, .05, 'beam', .26, base + .58, .4, mill), 'window', tower);
    var cone = Dither.cap(P, tower, { y: top, r: rTop, over: .1, h: .46 });
    parts.sails = Dither.rotor(P, mill, { y: top + .12, z: .78, face: 0, len: .72, tilt: .32 });
    Dither.seat(parts.sails, 'sails', cone);

    var cart = P.group(1.15, 0, .72);
    cart.rotation.y = .85;
    cart.name = 'cart';
    parts.cart = cart;
    Dither.seat(cart, 'cart');
    var r = .16, axle = null;
    [-.32, .3].forEach(function (x) {
      axle = P.box(.08, .06, .84, 'timber', x, r, 0, cart);
      axle.name = 'axle';
      [-.34, .34].forEach(function (z) {
        var w = P.cyl(r, r, .08, 'iron', x, r, z, cart, 10);
        w.rotation.x = Math.PI / 2;
        Dither.seat(w, 'cart-wheel', 'ground', axle);
      });
    });
    var floor = P.box(1.02, .08, .52, 'cart', 0, r + .07, 0, cart);
    Dither.seat(floor, 'cart-bed', axle);
    Dither.seat(P.box(1.02, .24, .06, 'cart', 0, r + .22, .26, cart), 'cart-side', floor);
    Dither.seat(P.box(1.02, .24, .06, 'cart', 0, r + .22, -.26, cart), 'cart-side', floor);
    Dither.seat(P.box(.06, .24, .52, 'cart', -.48, r + .22, 0, cart), 'cart-end', floor);
    Dither.seat(P.box(.4, .06, .06, 'timber', .7, r + .02, 0, cart), 'cart-tongue', floor);
    Dither.seat(P.box(.26, .18, .18, 'sack', -.08, r + .2, 0, cart), 'cart-sack', floor);

    var miller = Dither.folk(P, .04, 1.02, {
      h: .4, yaw: Math.PI, name: 'miller', parent: mill,
      shirt: '#f6e6c0', pants: '#152038', sleeve: '#c9a15a', hat: '#6e3b28', hair: '#2a2018'
    });
    var carter = Dither.folk(P, .58, 1.16, {
      h: .4, yaw: 2.25, name: 'carter',
      shirt: '#f04a38', pants: '#1c1612', sleeve: '#b43328', hair: '#1a1410', shoes: '#14110e'
    });
    parts.miller = miller;
    parts.carter = carter;

    parts.sack = P.group(0, .16, -.05, miller.root);
    P.box(.1, .09, .07, 'sack', 0, 0, 0, parts.sack);
    Dither.afloat(parts.sack, 'sack', 'carried');
    Dither.seat(P.box(.18, .12, .14, 'sack', .2, .06, .62), 'sack');

    parts.plants = Dither.fringe(P, [[2.2, 1.35], [-2.35, -1.35], [1.85, -1.4], [2.35, -.2]]);
    parts.plants.push(Dither.tree(P, 1.7, -1.25, { r: .48, h: .85, clusters: 6, seed: 5 }));
    [[2.15, .85, .24], [2.25, -1.55, .22], [-2.4, .35, .2]].forEach(function (b) {
      parts.plants.push(Dither.bush(P, b[0], b[1], b[2]));
    });

    [[.85, 1.7], [.4, .7], [1.55, -.55]].forEach(function (s, n) {
      Dither.seat(P.box(.22 + (n % 2) * .05, .12, .16, 'stone', s[0], .06, s[1]), 'stone');
    });
    Dither.fence(P, 1.85, -.15, .4, 4);
    Dither.lamp(P, 2.05, -.55);

    parts.hot = [miller.root, carter.root, cart];
    return parts;
  },
  tick: function (c) {
    var t = c.t, q = c.q, p = c.parts, P = c.P, u = Dither.carry((q + .75) % 1);
    var brake = c.active === p.miller.root, lean = Math.sin(q * P.TAU);
    p.sails.rotation.z = brake ? P.phase(c.pressedAt < 0 ? 0 : c.pressedAt, 8) * P.TAU : q * P.TAU;
    p.sack.position.set(P.lerp(0, .03, u), P.lerp(.16, .24, u), P.lerp(-.05, -.03, u));
    P.pose(p.miller, 'hold');
    p.miller.body.rotation.x = P.lerp(.12, .06, u);
    p.miller.head.rotation.x = .08;
    p.miller.armL.rotation.x = P.lerp(-.35, -.2, u);
    p.miller.armR.rotation.x = P.lerp(-.45, -1.15, u);
    p.miller.elbowL.rotation.x = -.7;
    p.miller.elbowR.rotation.x = P.lerp(-.85, -.4, u);
    p.miller.armL.rotation.z = -.2;
    p.miller.armR.rotation.z = .28;
    P.pose(p.carter, 'work');
    p.carter.body.rotation.x = .48 + lean * .03;
    p.carter.head.rotation.x = .28;
    p.carter.armL.rotation.x = -1.05;
    p.carter.armR.rotation.x = -1.15 + lean * .04;
    p.carter.elbowL.rotation.x = -.85;
    p.carter.elbowR.rotation.x = -.9;
    p.carter.armL.rotation.z = -.16;
    p.carter.armR.rotation.z = .18;
    p.plants.forEach(function (g, i) { Dither.sway(P, g, g.base, t, i > 4 ? 1.4 : 2.2, i * .17); });
    c.read = brake ? 'miller · brake on' : '';
  }
});

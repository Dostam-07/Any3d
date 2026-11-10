/* A mountain smithy. Tap the smith to rest. */
Pixel.scene({
  name: 'forge',
  title: 'The mountain forge',
  means: 'A smith strikes the anvil by a stone forge. Smoke leaves the chimney, and a mule waits with the cart.',
  hint: 'Hover the smith or the mule; tap the smith to rest.',
  width: 360, height: 280, duration: 8, still: 2, fps: 12,
  bayer: 4, shadow: 'hard', rim: true, wind: 8, contact: .4,
  camera: { az: 45, el: 30, height: 1.62, scale: 56 },
  sun: Dither.sun(45, 46, 16),
  ground: {
    rx: 3.6, rz: 2.75, wobble: .32, fade: .3, rect: true,
    zone: function (x, z) {
      if (z < -1.15 || x < -2.15) return 'rock';
      if (x > -.4 && x < 1.3 && z > -.15 && z < 1.35) return 'earth';
      return 'meadow';
    }
  },
  materials: {
    meadow: Dither.mat('meadow'), earth: Dither.mat('earth'), rock: Dither.mat('rock'),
    stone: Dither.mat('stone'), timber: Dither.mat('timber'), tile: Dither.mat('tile'),
    beam: Dither.mat('beam'), iron: Dither.mat('iron'), ember: Dither.mat('ember'),
    coal: Dither.mat('coal'), smoke: Dither.mat('smoke'), hide: Dither.mat('hide'),
    cart: Dither.mat('cart'), leaf: Dither.mat('leaf'), moss: Dither.mat('moss'),
    spark: Dither.mat('#f3e2a4', { tex: 'plain', rough: 0, dither: 0 })
  },
  build: function (P) {
    var parts = { plants: [] }, S = Dither.seat, A = Dither.afloat;
    S(P.wedge(2.4, 1.5, 1.6, 'rock', -2.3, 0, -1.55), 'mountain');
    var ridge = P.wedge(1.7, 1.15, 1.3, 'rock', -.4, 0, -1.85);
    ridge.rotation.y = .4;
    S(ridge, 'ridge');
    Dither.wall(P, 1.7, -1.5, 2.2, .15, { h: .4, stone: 'rock', cap: 'stone' });

    var shed = P.group(-.55, 0, -.45);
    shed.rotation.y = .45;
    var shedBox = P.box(1.7, 1.05, 1.25, 'stone', 0, .525, 0, shed);
    S(shedBox, 'shed');
    var mouthFrame = P.box(.34, .5, .08, 'coal', .35, .38, .64, shed);
    S(mouthFrame, 'mouth', shedBox);
    parts.mouth = P.box(.28, .32, .06, 'ember', .35, .4, .68, shed);
    S(parts.mouth, 'ember', mouthFrame);
    var roof = P.wedge(2.0, .5, 1.55, 'tile', 0, 1.05, 0, shed);
    S(roof, 'roof', shedBox);
    var stack = P.box(.26, .72, .26, 'rock', -.5, 1.4, -.15, shed);
    S(stack, 'stack', roof);
    S(P.box(.34, .06, .34, 'stone', -.5, 1.78, -.15, shed), 'cap', stack);
    var anvil = P.box(.16, .4, .14, 'iron', .15, .2, .85);
    S(anvil, 'anvil');
    var anvilTop = P.box(.42, .1, .18, 'iron', .15, .45, .85);
    S(anvilTop, 'anvil-top', anvil);
    S(P.box(.16, .08, .08, 'iron', -.02, .52, .85), 'horn', anvilTop);

    var smith = Dither.folk(P, .95, 1.55, {
      h: .44, yaw: 2.2, name: 'smith',
      shirt: '#8d3a2a', pants: '#2a241c', sleeve: '#6e2e22', hair: '#1a140f', shoes: '#14110e'
    });
    parts.smith = smith;
    parts.hammer = P.group(0, -.02, .02, smith.handR);
    P.box(.05, .24, .05, 'beam', 0, .1, 0, parts.hammer);
    P.box(.1, .06, .08, 'iron', 0, .24, 0, parts.hammer);
    S(parts.hammer, 'hammer', smith.handR);
    parts.sparks = [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) {
      var big = i % 2 === 0, a = i / 8 * Math.PI * 2;
      var s = P.box(big ? .11 : .07, big ? .1 : .12, big ? .06 : .05, i % 2 === 0 ? 'spark' : 'ember', .15, .52, .85);
      s.home = [.15, .52, .85];
      s.dir = [Math.cos(a), Math.sin(a)];
      A(s, 'spark', 'burst');
      return s;
    });

    parts.smoke = [0, 1, 2, 3].map(function (i) {
      var g = P.group(-.5, 1.82, -.15, shed);
      P.box(.18 - i * .02, .12, .16 - i * .02, 'smoke', 0, 0, 0, g);
      g.base = [-.5, 1.82, -.15];
      g.phase = i / 4;
      A(g, 'smoke', 'smoke');
      return g;
    });

    var mule = P.group(1.7, 0, .35);
    mule.rotation.y = .42;
    mule.name = 'mule';
    parts.mule = mule;
    var body = P.box(.84, .34, .4, 'hide', -.02, .7, 0, mule);
    var neck = P.box(.22, .28, .16, 'hide', .34, .84, 0, mule);
    neck.rotation.z = -.4;
    S(neck, 'neck', body);
    var head = P.box(.28, .18, .18, 'hide', .52, .98, 0, mule);
    S(head, 'head', neck);
    S(P.box(.16, .1, .12, 'hide', .7, .94, 0, mule), 'muzzle', head);
    [.06, -.06].forEach(function (z) { S(P.box(.06, .14, .04, 'coal', .46, 1.12, z, mule), 'ear', head); });
    S(P.box(.1, .16, .06, 'coal', .22, .98, 0, mule), 'mane', neck);
    S(P.box(.06, .22, .05, 'coal', -.46, .58, 0, mule), 'tail', body);
    [[-.28, .16], [-.28, -.16], [.18, .16], [.18, -.16]].forEach(function (p) {
      var leg = P.box(.08, .56, .08, 'hide', p[0], .32, p[1], mule);
      S(P.box(.1, .08, .1, 'coal', p[0], .04, p[1], mule), 'hoof', 'ground', leg);
      S(leg, 'leg', body);
    });
    S(mule, 'mule');

    var cart = P.group(2.25, 0, 1.4);
    cart.rotation.y = -.4;
    S(cart, 'cart');
    var cr = .16, axle = P.box(.07, .06, .7, 'timber', .12, cr, 0, cart);
    [-.28, .28].forEach(function (z) {
      var w = P.cyl(cr, cr, .08, 'iron', .12, cr, z, cart, 10);
      w.rotation.x = Math.PI / 2;
      S(w, 'cart-wheel', 'ground', axle);
    });
    var bed = P.box(.9, .08, .48, 'cart', 0, cr + .07, 0, cart);
    S(bed, 'cart-bed', axle);
    [.24, -.24].forEach(function (z) { S(P.box(.9, .2, .05, 'cart', 0, cr + .2, z, cart), 'cart-side', bed); });
    [-.24, .24].forEach(function (z) { S(P.box(.06, cr + .07, .06, 'timber', -.38, (cr + .07) / 2, z, cart), 'cart-leg', 'ground', bed); });
    S(P.box(.2, .14, .16, 'coal', -.06, cr + .18, 0, cart), 'load', bed);

    Dither.fence(P, -1.7, 1.15, .7, 4);
    parts.plants.push(Dither.tree(P, 2.15, -1.35, { r: .42, h: .6, clusters: 4, seed: 4 }));
    parts.plants = parts.plants.concat(Dither.fringe(P, [[-2.2, .8], [1.2, 1.7], [-1.5, 1.5]]));
    parts.hot = [smith.root, mule];
    return parts;
  },
  tick: function (c) {
    var t = c.t, q = c.q, p = c.parts, P = c.P;
    var work = c.active !== p.smith.root;
    var u = ((q + .29) * 2) % 1;
    var live = u < .18;
    var down = !work ? 0 : live ? u / .18 : u < .4 ? 1 - (u - .18) / .22 : 0;
    P.pose(p.smith, work ? 'work' : 'stand');
    p.smith.body.rotation.x = work ? .35 : .05;
    p.smith.armR.rotation.x = work ? P.lerp(-2.05, -.32, down) : -.25;
    p.smith.elbowR.rotation.x = work ? P.lerp(-.15, -1.05, down) : -.2;
    p.smith.armL.rotation.x = work ? -1.35 : -.15;
    p.smith.elbowL.rotation.x = work ? -.4 : -.15;
    p.sparks.forEach(function (s) {
      s.visible = work && live;
      var k = u / .18;
      s.position.set(s.home[0] + s.dir[0] * k * .42, s.home[1] + k * .55 * (1 - k * .35), s.home[2] + s.dir[1] * k * .28);
    });
    p.mouth.visible = work;
    p.smoke.forEach(function (g) {
      var u = (q + g.phase) % 1;
      g.visible = work || u < .35;
      g.position.set(g.base[0] + Math.sin((q + g.phase) * P.TAU) * .06, g.base[1] + u * 1.05, g.base[2]);
    });
    p.plants.forEach(function (g, i) { Dither.sway(P, g, g.base, t, 1.5, i * .21); });
    c.read = work ? 'smith · at the anvil' : 'smith · resting';
  }
});

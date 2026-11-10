/* A small pier on a lake: someone sits at the end with a rod, the float bobs
   and rings spread, a rowboat rocks at its rope, a cloth flag swings over a
   thatched shed on the shore. */
Pixel.scene({
  name: 'pier',
  title: 'Fishing off the pier',
  means: 'Someone fishes from the end of a small pier; the float bobs, the rowboat rocks and the flag over the shed swings.',
  hint: 'Hover the fisher, the boat or the shed; tap the fisher to strike.',
  width: 320, height: 240, duration: 6, still: 1.6, fps: 24,
  camera: { az: 45, el: 30, height: 2.4 },
  sun: { az: -60, el: 44, ambient: .34 },
  ground: {
    rx: 4.4, rz: 3.7, wobble: .5, fade: .5,
    zone: function (x, z, P) {
      var shore = x + z * .25 + 1.35 + (P.fbm(x * .5 + 9, z * .9) - .5) * 1.4;
      if (shore < -.55) return 'grass';
      if (shore < .05) return 'sand';
      if (shore < .4 + (P.noise(x * 4, z * 4) - .5) * .2) return 'shallow';
      return 'water';
    }
  },
  materials: {
    deck: { ramp: 'wood', tex: 'wood', grain: 'z', plank: .17 },
    walls: { ramp: 'wood', tex: 'wood', grain: 'y', plank: .15 },
    hull: { ramp: ['#3f3a3a', '#55504c', '#6f675f', '#8d8274', '#ab9f8b'], tex: 'wood', grain: 'x', plank: .09 },
    reed: { ramp: ['#4e5a2a', '#66733a', '#808c4a', '#9da660', '#bcc07e'], tex: 'plain' },
    flag: { ramp: ['#2f4f5f', '#3d6676', '#4f7f8f', '#6c9aa6', '#93b8bf'], tex: 'cloth', stripe: .12, grain: 'y', alt: ['#8f8a78', '#b1ac97', '#d0cbb4', '#e6e2cf', '#f5f2e4'] },
    shallow: { ramp: ['#4f8aa0', '#6a9fb3', '#8bb8c6', '#acd0d8', '#d2e8ea', '#eef7f6'], tex: 'water', ground: true, water: true },
    ring: { ramp: ['#cfe6ea', '#dff0f2', '#eef8f8'], flat: true, glow: .95 }
  },
  build: function (P) {
    var parts = {}, i;
    /* the pier: a deck of cross planks on posts that go into the water */
    var pier = P.group(-.6, 0, .35);
    P.box(4.4, .08, 1, 'deck', 0, .38, 0, pier);
    for (i = 0; i < 4; i++) [-.46, .46].forEach(function (z) { P.cyl(.07, .07, .9, 'darkwood', -1.9 + i * 1.3, .0, z, pier, 6); });
    P.box(4.4, .06, .06, 'darkwood', 0, .3, -.47, pier); P.box(4.4, .06, .06, 'darkwood', 0, .3, .47, pier);
    /* the fisher, sitting at the end, legs over the edge, facing +x */
    var fi = P.person(2.05, .05, pier, { shirt: '#b5553e', pants: '#3d4a5c', hair: '#3a2a20', skin: '#d9a47e', hat: '#d8c79a', yaw: Math.PI / 2 });
    fi.root.position.y = .03; fi.root.name = 'fisher · waiting for a bite';
    parts.fi = fi;
    var rod = P.group(0, 0, .02, fi.handR); parts.rod = rod;
    P.cyl(.012, .02, 1.7, '#5a4632', 0, -.85, 0, rod, 5);
    parts.tip = P.group(0, -1.7, 0, rod);
    /* float, its rings and the line, placed in tick */
    parts.float = P.group(2.85, 0, .95);
    P.ball(.05, '#d8513c', 0, .04, 0, parts.float, 6); P.ball(.035, '#f1ece0', 0, .1, 0, parts.float, 5);
    parts.rings = [0, 1].map(function () {
      var g = P.group(2.85, .02, .95), pts = [];
      for (var k = 0; k <= 20; k++) pts.push([Math.cos(k / 20 * P.TAU) * .32, 0, Math.sin(k / 20 * P.TAU) * .16]);
      P.line(pts, 'ring', g); return g;
    });
    parts.lineNode = P.line([[0, 0, 0], [0, 0, 0]], '#e8e4da');
    /* bucket and a tackle box beside the fisher */
    P.cyl(.11, .09, .22, '#7f8a8e', 1.6, .53, -.3, pier, 8);
    P.box(.3, .14, .2, '#5f7f5a', 1.1, .49, -.25, pier);
    /* rowboat on its rope */
    var boat = P.group(.2, 0, 1.55); parts.boat = boat; boat.name = 'rowboat · on its rope';
    P.box(1.3, .18, .55, 'hull', 0, .06, 0, boat);
    P.box(.39, .18, .39, 'hull', .65, .06, 0, boat).rotation.y = Math.PI / 4;
    P.box(.39, .18, .39, 'hull', -.65, .06, 0, boat).rotation.y = Math.PI / 4;
    P.box(1.12, .04, .42, 'deck', 0, .14, 0, boat);
    P.box(.12, .05, .5, 'darkwood', -.2, .2, 0, boat);
    var oar = P.box(.9, .03, .05, 'darkwood', .1, .23, .12, boat); oar.rotation.y = .25;
    parts.rope = P.line([[0, 0, 0], [0, 0, 0]], '#cbb98e');
    /* shore: a thatched shed with plank walls, reeds, a flag */
    var shed = P.group(-3.1, 0, -.9); shed.rotation.y = .2; shed.name = 'shed · nets and oars';
    P.box(1.3, .8, 1.0, 'walls', 0, .4, 0, shed);
    P.box(.3, .5, .04, '#3a2e26', .2, .27, .52, shed);
    var roof = P.wedge(1.55, .62, 1.35, 'thatch', 0, .8, 0, shed);
    var flagPole = P.group(-2.3, 0, -1.9);
    P.cyl(.03, .04, 2.1, 'darkwood', 0, 1.05, 0, flagPole, 6);
    parts.flag = []; var prev = P.group(0, 1.95, 0, flagPole);
    for (i = 0; i < 4; i++) { var seg = P.group(i ? .15 : .02, 0, 0, prev); P.box(.15, .34, .02, 'flag', .075, -.17, 0, seg); parts.flag.push(seg); prev = seg; }
    parts.reeds = [];
    [[-1.7, 1.6], [-1.4, 2.1], [-2.2, 1.0], [-.9, -1.6], [-1.3, -2.2]].forEach(function (c, k) {
      for (var j = 0; j < 7; j++) {
        var g = P.group(c[0] + Math.cos(j * 2.3 + k) * .18, 0, c[1] + Math.sin(j * 1.7 + k) * .18), h = .45 + ((j * 37 + k * 11) % 10) / 22;
        P.box(.03, h, .03, 'reed', 0, h / 2, 0, g); if (j % 3 === 0) P.box(.05, .12, .05, '#6b4a2f', 0, h, 0, g);
        parts.reeds.push(g);
      }
    });
    P.tree(-3.3, 1.2, null, { r: .72, h: 1.05 });
    P.bush(-2.0, -2.4, null, { r: .3 }); P.bush(-3.8, .1, null, { r: .26, mat: 'leafLight' });
    [[-2.6, 2.3], [-3.6, -2.0], [-1.6, -2.7]].forEach(function (p, k) { P.ball(.2 + k * .04, 'stone', p[0], .05, p[1], null, 6).scale.y = .55; });
    P.box(.5, .4, .45, 'wood', -2.3, .2, .1).rotation.y = .4;
    parts.hot = [fi.root, boat, shed];
    return parts;
  },
  tick: function (c) {
    var t = c.t, q = c.q, p = c.parts, P = c.P, TAU = P.TAU;
    /* the fisher: the rod arm lifts a little every cycle, the other rests, the head watches */
    var nib = P.pulse(t, 6, .22), bob = Math.sin(q * TAU * 3) * .5 + nib;
    var since = c.pressed === p.fi.root ? t - c.pressedAt : 9, strike = since < 1.6 ? Math.sin(Math.min(1, since / 1.6) * Math.PI) : 0;
    P.pose(p.fi, 'sit');
    p.fi.armR.rotation.x = -.55 - .25 * nib - .5 * strike; p.fi.elbowR.rotation.x = -.7;
    p.fi.armL.rotation.x = -.45; p.fi.elbowL.rotation.x = -.8; p.fi.armL.rotation.z = .25;
    p.fi.body.rotation.x = .1 + .06 * nib - .1 * strike; p.fi.head.rotation.x = .25 + .1 * nib;
    p.fi.kneeL.rotation.x = 1.45 + .25 * Math.sin(q * TAU); p.fi.kneeR.rotation.x = 1.35 - .25 * Math.sin(q * TAU + .6);
    p.rod.rotation.x = -1.1 + .2 * nib;
    P.update();
    /* float: bobs, dips on the nibble; rings spread from it */
    p.float.position.y = -.02 * bob - .05 * nib + .35 * strike; p.float.position.x = 2.85 - .5 * strike;
    p.rings.forEach(function (r, k) { r.position.x = p.float.position.x; var f = P.phase(t, 2, k * .5); r.scale.set(.4 + f * 1.4, 1, .4 + f * 1.4); r.visible = f < .8; });
    /* line from the rod tip to the float, sagging slightly */
    var a = p.tip.worldPoint(0, 0, 0), b = [p.float.position.x, p.float.position.y + .1, p.float.position.z];
    p.lineNode.line = [a, [P.lerp(a[0], b[0], .5), P.lerp(a[1], b[1], .5) - .12, P.lerp(a[2], b[2], .5)], b];
    /* rowboat rocks, its rope follows */
    p.boat.rotation.x = .05 * Math.sin(q * TAU); p.boat.rotation.z = .03 * Math.sin(q * TAU * 2 + 1); p.boat.position.y = .015 * Math.sin(q * TAU * 2);
    var bow = p.boat.worldPoint(.55, .15, -.2); p.rope.line = [[-.2, .4, .82], [P.lerp(-.2, bow[0], .5), .2, P.lerp(.82, bow[2], .5)], bow];
    /* wind: the flag and the reeds */
    p.flag.forEach(function (s, i) { s.rotation.y = .22 * Math.sin(q * TAU * 2 - i * .9) * (i ? 1 : .4); });
    p.reeds.forEach(function (r, i) { r.rotation.z = .06 * Math.sin(q * TAU * 2 + i * .7); });
    c.read = strike > 0 ? 'fisher · strike!' : nib > .2 ? 'float · a nibble' : 'fisher · waiting for a bite';
  }
});

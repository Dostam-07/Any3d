/* An allotment in the morning: a gardener waters a raised bed of greens, a
   scarecrow's sleeves flap, a wheelbarrow waits on the brick path. */
Pixel.scene({
  name: 'allotment',
  title: 'Watering the allotment',
  means: 'A gardener waters a raised bed of greens on a small allotment; the scarecrow flaps and the water falls in drops.',
  hint: 'Hover the gardener, the scarecrow or the barrow; tap the gardener to wave.',
  width: 320, height: 240, duration: 4, still: .9, fps: 24,
  camera: { az: 45, el: 30, height: 2.2 },
  sun: { az: -50, el: 45, ambient: .34 },
  ground: {
    rx: 4.2, rz: 3.5, wobble: .45, fade: .5,
    zone: function (x, z, P) {
      var w = (P.noise(x * 3, z * 3) - .5) * .12;
      if (Math.abs(z - .95 + x * .08) < .36 + w && x > -3.2 && x < 2.6) return 'brick';
      if (x > -2.7 && x < 1.9 && z > -2.2 && z < .4 + w) return 'soil';
      return 'grass';
    }
  },
  materials: {
    soil: { ramp: ['#4a3626', '#5e4532', '#73563e', '#8a6a4c', '#a1805c'], tex: 'dirt', ground: true },
    brick: { ramp: ['#7a4a3a', '#925a45', '#a96c52', '#bd8164', '#cf9a7c'], tex: 'stone', size: .26, ground: true, grain: 'x' },
    bed: { ramp: 'wood', tex: 'wood', grain: 'x', plank: .1 },
    can: { ramp: ['#2f4d47', '#3e6159', '#4f776d', '#679084', '#86aa9d'], tex: 'plain' },
    straw: { ramp: 'thatch', tex: 'thatch', grain: 'y' },
    drop: { ramp: ['#9cc6d4', '#c4e0e8', '#e8f4f6'], flat: true, glow: .9 }
  },
  build: function (P) {
    var parts = { drops: [] }, i, j;
    /* two raised beds of greens */
    function bed(x, z, rows, plant) {
      var g = P.group(x, 0, z);
      P.box(1.7, .22, .08, 'bed', 0, .11, -.46, g); P.box(1.7, .22, .08, 'bed', 0, .11, .46, g);
      P.box(.08, .22, 1, 'bed', -.85, .11, 0, g); P.box(.08, .22, 1, 'bed', .85, .11, 0, g);
      P.box(1.62, .16, .84, 'soil', 0, .08, 0, g);
      for (var r = 0; r < rows; r++) for (var c = 0; c < 5; c++) plant(g, -.62 + c * .31, -.26 + r * .26, r * 5 + c);
      return g;
    }
    bed(-.9, -.75, 3, function (g, x, z, k) { P.bush(x, z, g, { r: .14, clusters: 4, mat: k % 2 ? 'leaf' : 'leafLight' }).position.y = .14; });
    bed(-1.0, -2.0 + .1, 2, function (g, x, z, k) {
      var s = P.group(x, .16, z, g); P.box(.03, .3, .03, '#5f7a3c', 0, .15, 0, s); P.box(.09, .09, .09, k % 3 ? '#d0573e' : '#e7b54a', 0, .3, 0, s);
    });
    /* the gardener with a watering can, beside the front bed */
    var ga = P.person(.45, -.45, null, { shirt: '#5f7fa8', pants: '#5a4a3a', hair: '#7a5236', skin: '#e2b08c', hat: '#cdb67a', yaw: -1.9 });
    ga.root.name = 'gardener · watering the greens';
    var can = P.group(.02, -.04, .1, ga.handR); parts.can = can;
    P.box(.2, .18, .14, 'can', 0, -.06, 0, can);
    P.cyl(.014, .02, .3, 'can', 0, -.04, .2, can, 5).rotation.x = 1.1;
    parts.spout = P.group(0, .07, .33, can);
    for (i = 0; i < 6; i++) parts.drops.push(P.box(.03, .05, .03, 'drop', 0, 0, 0));
    parts.ga = ga;
    /* scarecrow: a post, straw head, a coat with sleeves that flap */
    var sc = P.group(1.3, 0, -1.7); sc.name = 'scarecrow · keeping watch'; sc.rotation.y = -.5;
    P.cyl(.04, .05, 1.5, 'darkwood', 0, .75, 0, sc, 6);
    P.box(.9, .05, .05, 'darkwood', 0, 1.15, 0, sc);
    P.box(.3, .4, .16, '#8a5a3c', 0, 1.0, 0, sc);
    P.box(.2, .2, .2, 'straw', 0, 1.36, 0, sc);
    P.cyl(.2, .2, .02, '#5a4632', 0, 1.47, 0, sc, 8); P.cyl(.1, .11, .1, '#5a4632', 0, 1.52, 0, sc, 8);
    parts.sleeves = [-1, 1].map(function (sd) { var g = P.group(sd * .15, 1.15, 0, sc); P.box(.3, .12, .12, '#7a4e34', sd * .15, -.03, 0, g); P.box(.06, .12, .06, 'straw', sd * .32, -.06, 0, g); return g; });
    parts.sc = sc;
    /* wheelbarrow on the path */
    var wb = P.group(-2.2, 0, 1.15); wb.name = 'barrow · full of compost'; wb.rotation.y = .4;
    P.box(.6, .22, .42, '#5f7f5a', 0, .32, 0, wb); P.box(.52, .06, .34, 'soil', 0, .44, 0, wb);
    var wheel = P.cyl(.13, .13, .06, '#2f2a28', .42, .13, 0, wb, 10); wheel.rotation.x = Math.PI / 2;
    [-.16, .16].forEach(function (z) { P.box(.7, .04, .04, 'darkwood', -.2, .3, z, wb); P.box(.04, .2, .04, 'darkwood', -.15, .1, z, wb); });
    /* fence along the back, a water butt, a tree and some edging */
    for (i = 0; i < 7; i++) P.box(.07, .55, .07, 'darkwood', -3 + i * .75, .27, -2.75 + i * .12);
    P.box(4.6, .05, .04, 'bed', -.75, .45, -2.39, null).rotation.y = -.16;
    P.box(4.6, .05, .04, 'bed', -.75, .2, -2.39, null).rotation.y = -.16;
    P.cyl(.26, .24, .62, '#4a5a52', 2.3, .31, -.6, null, 10);
    P.tree(-3.2, -.6, null, { r: .7, h: 1.1 });
    P.bush(2.9, 1.3, null, { r: .34, flowers: '#e9c65a' }); P.bush(-3.4, 1.9, null, { r: .28, mat: 'leafLight' });
    for (j = 0; j < 4; j++) P.box(.18, .12, .18, 'stone', 2.4 - j * .2, .06, .4 + j * .28);
    parts.hot = [ga.root, sc, wb];
    return parts;
  },
  tick: function (c) {
    var t = c.t, q = c.q, p = c.parts, P = c.P, TAU = P.TAU;
    var waving = c.pressed === p.ga.root && t - c.pressedAt < 2, tip = waving ? 0 : .5 + .5 * Math.sin(q * TAU);
    /* the gardener: can held out, tipped to pour twice a loop, the other hand on the hip; a tap makes them wave */
    P.pose(p.ga, waving ? 'wave' : 'stand');
    if (waving) { p.ga.elbowR.rotation.z = .4 + .4 * Math.sin(t * 14); p.ga.armL.rotation.set(-.4, 0, -.2); p.ga.elbowL.rotation.x = -1.1; }
    else {
      p.ga.armR.rotation.set(-.85, 0, .1); p.ga.elbowR.rotation.x = -.35; p.ga.armL.rotation.set(.1, 0, -.45); p.ga.elbowL.rotation.set(-1.4, 0, .5);
      p.ga.body.rotation.x = .1 + .05 * tip; p.ga.head.rotation.x = .35;
    }
    p.can.rotation.x = .25 + .55 * tip;
    p.can.visible = !waving;
    /* drops fall from the spout while it is tipped */
    P.update();
    var s = p.spout.worldPoint(0, 0, 0);
    p.drops.forEach(function (d, i) {
      var f = P.phase(t, .5, i / 6), y = s[1] - f * s[1];
      d.visible = tip > .55 && !waving; d.position.set(s[0] + f * .05, Math.max(.05, y - .02), s[2] + f * .08);
    });
    /* scarecrow sleeves flap in the wind, the barrow nods on hover */
    p.sleeves.forEach(function (g, i) { g.rotation.z = (i ? -1 : 1) * (.1 + .12 * Math.sin(q * TAU * 2 + i)); });
    p.sc.rotation.z = .02 * Math.sin(q * TAU);
    c.read = waving ? 'gardener · waving' : tip > .55 ? 'can · pouring' : 'gardener · moving along the row';
  }
});

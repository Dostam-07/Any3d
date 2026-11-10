/* rack · a card in mono with one accent.
   A pallet rack with every slot bare, a forklift waiting in front with its
   forks down. The forks rise and settle as if checking the shelves. The
   pointer picks a level; its beams light up and the forklift looks there.
   Drawn in the mono theme: everything a tint of ink except one accent, the
   safety yellow of the beams, so the bare shelves are what the eye finds. */
Any3d.figure({
  name: 'rack',
  size: 'card',
  theme: { base: 'mono', accent: '#f2c230' },
  title: 'Pallet rack',
  means: 'A three-level rack with nothing on it and a forklift waiting. Hover a level and the forks go to it.',
  hint: 'Hover a level and the forks go to it.',
  still: 3,
  build: function (o) {
    var D = o.D, pal = o.pal;
    D.slab(9, 7, pal.ground, 0, 0, 0, null, { h: .6, r: 1, side: pal.base });
    D.box(7.6, .012, .14, pal.accent, 0, .05, .3, null, { shadow: false });
    for (var i = -3.4; i <= 3.4; i += 1.1) D.box(.5, .012, .12, pal.line, i, .05, 2.4, null, { shadow: false });

    var rack = D.group(0, 0, -1.6), levels = [], LV = [1.1, 2.2, 3.3];
    for (var b = -1.5; b <= 1.5; b++) {
      var x = b * 1.7;
      [-.7, .7].forEach(function (z) { D.box(.12, 4, .12, pal.steel, x - .78, 2, z, rack); D.box(.12, 4, .12, pal.steel, x + .78, 2, z, rack); });
    }
    LV.forEach(function (y, k) {
      var g = D.group(0, y, 0, rack), beams = [];
      beams.push(D.box(6.9, .14, .1, pal.accent, 0, 0, -.72, g));
      beams.push(D.box(6.9, .14, .1, pal.accent, 0, 0, .72, g));
      for (var b = -1.5; b <= 1.5; b++) D.box(1.5, .04, 1.4, pal.cloud, b * 1.7, .07, 0, g, { shadow: false });
      g.name = 'level ' + (k + 1); levels.push({ g: g, beams: beams, y: y });
    });
    D.box(6.9, .1, .1, pal.steel, 0, 4.05, -.72, rack); D.box(6.9, .1, .1, pal.steel, 0, 4.05, .72, rack);
    for (var b = -1.5; b <= 1.5; b++) { D.box(.3, .08, .3, pal.ink, b * 1.7 - .78, .04, -.72, rack); D.box(.3, .08, .3, pal.ink, b * 1.7 + .78, .04, .72, rack); }

    var fl = D.group(-.6, 0, 1.4); fl.rotation.y = Math.PI;
    D.box(1.4, .6, 1.1, pal.safety, -.1, .55, 0, fl);
    D.box(.5, .8, 1.1, pal.flame, -.78, .7, 0, fl);
    [[-.6, -.5], [-.6, .5], [.42, -.5], [.42, .5]].forEach(function (p) { D.box(.07, 1.35, .07, pal.steel, p[0], 1.55, p[1], fl); });
    D.box(1.15, .06, 1.08, pal.steel, -.09, 2.22, 0, fl);
    [-.32, .32].forEach(function (z) { D.box(.1, 3.4, .1, pal.slate, .74, 1.8, z, fl); });
    var beacon = D.box(.16, .12, .16, pal.warn, -.4, 2.31, 0, fl, { mat: { emissive: pal.flame, emissiveIntensity: .2 }, shadow: false });
    [[.45, .3], [-.62, .26]].forEach(function (p) { [-.52, .52].forEach(function (z) { D.wheel(p[1], .22, pal.tyre, p[0], p[1], z, fl); }); });
    var driver = D.props.person(-.2, 0, fl, { shirt: pal.teal }); driver.position.y = .85;
    var head = driver.children[3];
    var carriage = D.group(.8, .1, 0, fl);
    D.box(.07, .6, .82, pal.steel, 0, .3, 0, carriage);
    [-.26, .26].forEach(function (z) { D.box(1.1, .05, .14, pal.steel, .55, .02, z, carriage); });
    D.props.cone(3.2, 2.2); D.props.bush(-3.9, 2.6, null, { r: .3 });

    var lit = D.mat(pal.accent, { emissive: pal.accent, emissiveIntensity: .55 }), plain = D.mat(pal.accent);
    return { hot: levels.map(function (l) { return l.g; }), levels: levels, carriage: carriage, beacon: beacon, driver: driver, lit: lit, plain: plain, lift: D.spring(40, 11), look: D.spring(60, 12) };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    var picked = -1;
    p.levels.forEach(function (l, k) { var on = ctx.hover === l.g; if (on) picked = k; l.beams.forEach(function (b) { b.material = on ? p.lit : p.plain; }); });
    var idle = D.smooth(D.pulse(t, 9, .5)) * 1.1;
    p.lift.t = picked >= 0 ? p.levels[picked].y - .95 : idle; p.lift.step(ctx.dt);
    p.carriage.position.y = .1 + p.lift.x;
    p.look.t = picked >= 0 ? .35 : .12 * D.wave(t, 5); p.look.step(ctx.dt);
    p.driver.rotation.x = -p.look.x * .5; p.driver.rotation.y = Math.PI / 2 + p.look.x * .4;
    p.beacon.material.emissiveIntensity = .2 + .8 * (D.phase(t, 1) < .5 ? 1 : 0);
  }
});

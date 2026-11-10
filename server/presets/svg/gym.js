/* gym · a card: the last set of the day.
   A lifter presses a barbell in the rack while the wall fan turns; plates,
   a bench and a dumbbell rack fill the rubber floor. */
Any3d.figure({
  name: 'gym',
  size: 'card',
  theme: 'toy',
  title: 'Last set',
  means: 'A lifter presses a barbell in the rack while the wall fan turns; plates, a bench and dumbbells fill the floor.',
  hint: 'Hover the rack, the bench or the fan.',
  camera: { az: 40, el: 33, pad: 1.06 },
  still: 2.5,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(11, 8.5, pal.ground, 0, 0, 0, null, { h: .6, r: 1.2, side: pal.base });
    D.box(10.2, .06, 7.6, pal.slate, 0, .03, 0, null, { shadow: false });
    [-4.4, -1.4, 1.6, 4.4].forEach(function (x) { D.box(.06, .01, 7.4, pal.ink, x, .07, 0, null, { shadow: false }); });
    var rack = D.group(-.6, 0, -.8); rack.name = 'squat rack'; hot.push(rack);
    [-1.1, 1.1].forEach(function (x) {
      D.box(.24, 3.2, .24, pal.cobalt, x, 1.6, 0, rack);
      D.box(.2, .12, .9, pal.steel, x, .9, .3, rack);
      D.box(.5, .08, .5, pal.steel, x, .04, 0, rack);
    });
    D.box(2.5, .14, .2, pal.steel, 0, 3.15, 0, rack);
    var bar = D.group(0, 1.9, .35, rack); bar.name = 'barbell';
    var rod = D.cyl(.06, .06, 3.4, pal.steel, 0, 0, 0, bar, 10); rod.rotation.z = Math.PI / 2;
    [-1.5, 1.5].forEach(function (x) {
      var plate = D.cyl(.42, .42, .12, pal.ink, x, 0, 0, bar, 16); plate.rotation.z = Math.PI / 2;
      var inner = D.cyl(.3, .3, .14, pal.coral, x + (x < 0 ? .2 : -.2), 0, 0, bar, 16); inner.rotation.z = Math.PI / 2;
    });
    var lifter = D.props.person(0, 0, null, { shirt: pal.mustard, hat: false }); lifter.position.set(-.6, 0, -.1);
    var arms = D.group(0, .9, 0, lifter);
    var al = D.cyl(.06, .06, .5, pal.skin, -.3, .1, 0, arms, 6); al.rotation.z = .5;
    var ar = D.cyl(.06, .06, .5, pal.skin, .3, .1, 0, arms, 6); ar.rotation.z = -.5;
    var bench = D.group(2.6, 0, .4); bench.rotation.y = -.4; bench.name = 'bench'; hot.push(bench);
    D.box(1.8, .16, .55, pal.mustard, 0, .5, 0, bench);
    [-.7, .7].forEach(function (x) { D.box(.12, .5, .5, pal.steel, x, .25, 0, bench); });
    var dum = D.group(3.2, 0, -2.4); dum.name = 'dumbbell rack'; hot.push(dum);
    D.box(2.2, .12, .5, pal.steel, 0, .5, 0, dum);
    D.box(2.2, .12, .5, pal.steel, 0, .9, 0, dum);
    for (var i = 0; i < 5; i++) {
      var d1 = D.cyl(.1, .1, .4, pal.ink, -.8 + i * .4, .58, 0, dum, 8); d1.rotation.z = Math.PI / 2;
      var d2 = D.cyl(.1, .1, .4, pal.ink, -.8 + i * .4, .98, 0, dum, 8); d2.rotation.z = Math.PI / 2;
    }
    var fan = D.group(-4.6, 2.4, -3.4); fan.name = 'wall fan'; hot.push(fan);
    D.torus(.5, .04, pal.ink, 0, 0, 0, fan);
    var blades = D.group(0, 0, 0, fan);
    for (var b = 0; b < 4; b++) { var bl = D.box(.16, .7, .03, pal.paper, 0, 0, 0, blades); bl.rotation.z = b * Math.PI / 2; }
    D.cyl(.1, .1, .2, pal.steel, 0, 0, -.1, fan, 8);
    D.box(9.8, 2.4, .12, pal.cloud, 0, 2.6, -4.0, null);
    return { hot: hot, bar: bar, blades: blades, lifter: lifter, arms: arms, lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    var up = .5 + .5 * D.wave(t, 3.2);
    p.bar.position.y = 1.55 + up * .85;
    p.lifter.position.y = .06 * up;
    p.lifter.rotation.x = .04 * up;
    p.arms.rotation.x = -.3 * up;
    p.lifter.scale.y = 1 - .04 * up;
    p.blades.rotation.z = t * 4;
    p.hot.forEach(function (g) {
      var s = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18));
      s.t = ctx.hover === g ? .28 : 0; s.step(ctx.dt); g.position.y = s.x;
    });
    ctx.read = up > .7 ? 'lifter · pressing' : 'lifter · in the hole';
  }
});

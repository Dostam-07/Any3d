/* barbershop · a card: one chair, one cut, the pole turning.
   A barber snips at a seated customer while the mirror wall, counter and
   plant hold the room. The pole's stripes turn and the chair settles. */
Any3d.figure({
  name: 'barbershop',
  size: 'card',
  theme: 'soft',
  title: 'The Saturday cut',
  means: 'A barber snips at a seated customer while the pole turns; mirrors, a counter and a plant hold the room.',
  hint: 'Hover the chair, the pole or the counter.',
  camera: { az: 42, el: 32, pad: 1.06 },
  still: 3,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(11, 8.5, pal.ground, 0, 0, 0, null, { h: .6, r: 1.2, side: pal.base });
    D.box(10.2, .05, 7.6, pal.wood, 0, .02, 0, null, { shadow: false });
    D.box(10.6, 4.6, .3, pal.paper, 0, 2.3, -3.9, null);
    [-2.6, 0, 2.6].forEach(function (x) {
      D.box(1.9, 2.2, .06, pal.ink, x, 2.1, -3.72, null, { shadow: false });
      D.box(1.7, 2.0, .05, pal.sky, x, 2.1, -3.68, null, { shadow: false });
    });
    var counter = D.group(-2.6, 0, -3.2); counter.name = 'the counter'; hot.push(counter);
    D.box(5.2, 1.0, 1.0, pal.cloud, 0, .5, 0, counter);
    D.box(5.4, .08, 1.1, pal.ink, 0, 1.03, 0, counter, { shadow: false });
    [-1.8, 0, 1.8].forEach(function (x) {
      D.cyl(.1, .08, .3, pal.mustard, x, 1.2, 0, counter, 10);
      D.cyl(.12, .12, .04, pal.teal, x, 1.37, 0, counter, 10);
    });
    var chair = D.group(1.0, 0, -.6); chair.name = 'barber chair'; hot.push(chair);
    D.cyl(.9, .9, .12, pal.steel, 0, .06, 0, chair, 16);
    D.cyl(.14, .16, .5, pal.steel, 0, .3, 0, chair, 10);
    D.box(1.1, .16, 1.1, pal.plum, 0, .62, 0, chair);
    D.box(1.1, .9, .16, pal.plum, 0, 1.12, -.48, chair);
    D.box(.5, .16, .5, pal.plum, 0, 1.55, -.48, chair);
    [-.5, .5].forEach(function (x) { D.box(.1, .1, .6, pal.steel, x, .78, .35, chair); });
    var cust = D.props.person(0, 0, chair, { shirt: pal.mint, hat: false });
    cust.position.set(0, .62, .1); cust.scale.setScalar(.92);
    D.props.person(-.1, 0, null, { shirt: pal.coral, hat: false }).position.set(1.0, 0, -1.9);
    var sciss = D.group(1.0, 1.5, -.2); sciss.name = 'the scissors'; hot.push(sciss);
    D.box(.06, .5, .03, pal.steel, -.04, -.2, 0, sciss);
    D.box(.06, .5, .03, pal.steel, .04, -.2, 0, sciss);
    var pole = D.group(-4.6, 0, .8); pole.name = 'the pole'; hot.push(pole);
    D.cyl(.22, .22, .3, pal.steel, 0, .15, 0, pole, 12);
    var drum = D.group(0, 2.0, 0, pole);
    D.cyl(.24, .24, 2.9, pal.paper, 0, 0, 0, drum, 14);
    for (var i = 0; i < 8; i++) {
      var ring = D.box(.06, .28, .5, i % 2 ? pal.coral : pal.teal, 0, -1.2 + i * .36, 0, drum);
      ring.rotation.z = .5;
    }
    D.cyl(.26, .26, .3, pal.steel, 0, 3.6, 0, pole, 12);
    var plant = D.group(4.3, 0, .6);
    D.cyl(.3, .22, .5, pal.terracotta, 0, .25, 0, plant, 12);
    D.props.bush(0, 0, plant, { r: .34 }).position.y = .5;
    var coat = D.group(4.6, 0, -2.6);
    D.cyl(.05, .07, 2.4, pal.slate, 0, 1.2, 0, coat, 8);
    D.box(.5, .7, .06, pal.cobalt, 0, 1.9, 0, coat);
    return { hot: hot, drum: drum, sciss: sciss, chair: chair, cust: cust, lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    p.drum.rotation.y = t * .9;
    p.sciss.rotation.z = .5 * D.wave(t, 1.2);
    p.sciss.position.y = 1.5 + .04 * D.wave(t, 1.2);
    p.cust.rotation.z = .03 * D.wave(t, 2.1);
    p.hot.forEach(function (g) {
      var s = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18));
      s.t = ctx.hover === g ? .3 : 0; s.step(ctx.dt); g.position.y = s.x;
    });
    ctx.read = 'chair · one more minute';
  }
});

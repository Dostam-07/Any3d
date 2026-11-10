/* laundromat · a card: a quiet spin cycle.
   Three washers turn their drums, a basket waits on the bench, and a plant
   leans by the folding table under a shelf of detergent. */
Any3d.figure({
  name: 'laundromat',
  size: 'card',
  theme: 'soft',
  title: 'Spin cycle',
  means: 'Three washers turn their drums while a basket waits on the bench and a plant leans by the folding table.',
  hint: 'Hover a washer, the basket or the folding table.',
  camera: { az: 41, el: 33, pad: 1.06 },
  still: 2,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(11, 8.5, pal.ground, 0, 0, 0, null, { h: .6, r: 1.2, side: pal.base });
    D.box(10.2, .05, 7.6, pal.mint, 0, .02, 0, null, { shadow: false });
    for (var gx = -5; gx <= 5; gx += 1) D.box(.04, .01, 7.6, pal.paper, gx, .03, 0, null, { shadow: false });
    D.box(10.4, 3.6, .2, pal.cloud, 0, 1.8, -3.9, null);
    D.box(9.6, .1, .5, pal.wood, 0, 2.6, -3.7, null);
    [-3.6, -2.4, -1.2, 0, 1.2].forEach(function (x) { D.cyl(.16, .14, .3, pal.coral, x, 2.8, -3.7, null, 10); });
    var drums = [];
    [-3.0, 0, 3.0].forEach(function (x, i) {
      var w = D.group(x, 0, -2.6); w.name = 'washer ' + (i + 1); hot.push(w);
      D.box(1.8, 2.0, 1.4, pal.paper, 0, 1.0, 0, w);
      D.box(1.9, .16, 1.5, pal.cobalt, 0, 2.04, 0, w);
      var ring = D.cyl(.52, .52, .08, pal.steel, 0, 1.1, .72, w, 20); ring.rotation.x = Math.PI / 2;
      var dr = D.group(0, 1.1, .74, w);
      var glass = D.cyl(.46, .46, .06, pal.sky, 0, 0, 0, dr, 20); glass.rotation.x = Math.PI / 2;
      for (var k = 0; k < 3; k++) {
        var pad = D.box(.3, .16, .06, pal.paper, Math.cos(k * 2.1) * .22, Math.sin(k * 2.1) * .22, 0, dr);
        pad.rotation.z = k * 2.1;
      }
      D.box(.7, .16, .04, pal.ink, 0, 1.75, .71, w, { shadow: false });
      var dial = D.cyl(.08, .08, .06, pal.mustard, .55, 1.75, .71, w, 10); dial.rotation.x = Math.PI / 2;
      drums.push(dr);
    });
    var basket = D.group(-4.2, 0, .6); basket.name = 'laundry basket'; hot.push(basket);
    D.cyl(.5, .4, .5, pal.cardboard, 0, .25, 0, basket, 14);
    for (var c = 0; c < 5; c++) D.ball(.2, c % 2 ? pal.paper : pal.mint, -.2 + c * .1, .5, (c % 2 ? .1 : -.1), basket);
    var bench = D.group(2.6, 0, -1.0); bench.rotation.y = .2; bench.name = 'bench'; hot.push(bench);
    D.box(2.4, .14, .7, pal.wood, 0, .48, 0, bench);
    [-.9, .9].forEach(function (x) { D.box(.12, .48, .6, pal.steel, x, .24, 0, bench); });
    D.box(2.4, .1, .2, pal.wood, 0, .85, -.28, bench);
    var table = D.group(2.2, 0, 1.6); table.name = 'folding table'; hot.push(table);
    D.box(3.0, .08, 1.4, pal.paper, 0, .9, 0, table);
    [[-1.2, -.5], [1.2, -.5], [-1.2, .5], [1.2, .5]].forEach(function (l) { D.cyl(.04, .04, .88, pal.steel, l[0], .44, l[1], table, 8); });
    var plant = D.group(-4.4, 0, -1.4);
    D.cyl(.3, .22, .5, pal.terracotta, 0, .25, 0, plant, 12);
    D.props.bush(0, 0, plant, { r: .34 }).position.y = .5;
    return { hot: hot, drums: drums, plant: plant, lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    p.drums.forEach(function (dr, i) { dr.rotation.z = t * (1.6 + i * .35); });
    p.plant.rotation.z = .05 * D.wave(t, 3.3);
    p.hot.forEach(function (g) {
      var s = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18));
      s.t = ctx.hover === g ? .28 : 0; s.step(ctx.dt); g.position.y = s.x;
    });
    ctx.read = 'drums · spinning';
  }
});

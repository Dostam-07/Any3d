/* patisserie · a card: the morning case.
   A glass case of tarts and a cake stand, a hanging lamp and a baker behind
   the counter; the lamp sways and the cake turns under its dome. */
Any3d.figure({
  name: 'patisserie',
  size: 'card',
  theme: 'soft',
  title: 'The morning case',
  means: 'A pastry case of tarts and cakes, a hanging lamp and a baker behind the counter; the lamp sways and a tart turns.',
  hint: 'Hover the case, the cake stand or the baker.',
  camera: { az: 41, el: 32, pad: 1.06 },
  still: 2,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(11, 8.5, pal.ground, 0, 0, 0, null, { h: .6, r: 1.2, side: pal.base });
    D.box(10.2, .05, 7.6, pal.wood, 0, .02, 0, null, { shadow: false });
    D.box(10.4, 3.8, .2, pal.paper, 0, 1.9, -3.9, null);
    D.box(9.4, .1, .5, pal.wood, 0, 2.7, -3.7, null);
    [-3.6, -2.4, -1.2, 0, 1.2, 2.4].forEach(function (x) {
      D.cyl(.14, .12, .24, pal.coral, x, 2.9, -3.7, null, 10);
      D.cyl(.14, .12, .24, pal.mustard, x, 2.62, -3.7, null, 10);
    });
    D.box(2.2, 1.3, .06, pal.ink, 3.4, 2.4, -3.78, null, { shadow: false });
    [0, 1, 2, 3].forEach(function (i) { D.box(1.6 - i * .2, .06, .02, pal.paper, 3.4, 2.85 - i * .28, -3.73, null, { shadow: false }); });
    var counter = D.group(0, 0, -.6); counter.name = 'the counter'; hot.push(counter);
    D.box(7.0, 1.1, 1.4, pal.cloud, 0, .55, 0, counter);
    D.box(7.2, .1, 1.6, pal.paper, 0, 1.15, 0, counter);
    D.box(4.2, 1.0, 1.4, pal.sky, -1.0, 1.7, 0, counter, { shadow: false, mat: { transparent: true, opacity: .3 } });
    D.box(4.4, .06, 1.5, pal.steel, -1.0, 2.22, 0, counter, { shadow: false });
    for (var t2 = 0; t2 < 4; t2++) {
      D.cyl(.16, .16, .08, pal.wood, -2.2 + t2 * .8, 1.22, 0, counter, 12);
      D.ball(.13, pal.mustard, -2.2 + t2 * .8, 1.28, 0, counter);
    }
    var stand = D.group(2.2, 0, -.6); stand.name = 'the cake stand'; hot.push(stand);
    D.cyl(.4, .5, .06, pal.paper, 0, 1.2, 0, stand, 16);
    D.cyl(.08, .1, .5, pal.steel, 0, .95, 0, stand, 8);
    var cake = D.group(0, 1.23, 0, stand);
    D.cyl(.34, .36, .4, pal.rose, 0, .2, 0, cake, 16);
    D.dome(.34, pal.paper, 0, .4, 0, cake);
    var lamp = D.group(0, 3.4, -.6); lamp.name = 'the lamp'; hot.push(lamp);
    D.cyl(.02, .02, 1.3, pal.ink, 0, .65, 0, lamp, 6);
    var shade = D.cone(.5, .35, pal.teal, 0, 0, 0, lamp, 18); shade.rotation.x = Math.PI;
    var bulb = D.ball(.1, pal.lampGlow, 0, -.12, 0, lamp); bulb.castShadow = false;
    D.props.person(-3.2, 0, null, { shirt: pal.teal, hat: pal.paper }).position.set(-3.2, 0, -2.4);
    var table = D.group(3.6, 0, 1.4); table.rotation.y = .2;
    D.cyl(.7, .7, .06, pal.paper, 0, .78, 0, table, 18);
    D.cyl(.06, .06, .76, pal.ink, 0, .4, 0, table, 8);
    D.cyl(.1, .08, .18, pal.sky, .2, .9, .1, table, 10);
    var chair = D.group(2.4, 0, 1.8); chair.rotation.y = .6;
    D.box(.6, .06, .6, pal.wood, 0, .48, 0, chair);
    D.box(.6, .5, .06, pal.wood, 0, .75, -.26, chair);
    [[-.24, -.24], [.24, -.24], [-.24, .24], [.24, .24]].forEach(function (l) { D.cyl(.03, .03, .48, pal.ink, l[0], .24, l[1], chair, 6); });
    D.props.bush(-4.6, 1.6, null, { r: .26 });
    return { hot: hot, lamp: lamp, cake: cake, stand: stand, lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    p.lamp.rotation.z = .03 * D.wave(t, 4.1);
    p.cake.rotation.y = t * .4;
    p.stand.rotation.z = .01 * D.wave(t, 3.2);
    p.hot.forEach(function (g) {
      var s = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18));
      s.t = ctx.hover === g ? .28 : 0; s.step(ctx.dt); g.position.y = s.x;
    });
    ctx.read = 'case · fresh';
  }
});

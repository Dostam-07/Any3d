/* library · a card: the quiet stacks.
   Two tall shelves of books, a rolling ladder that creeps along the wall, a
   reading table under a green lamp and a rug by the plant. */
Any3d.figure({
  name: 'library',
  size: 'card',
  theme: 'soft',
  title: 'Quiet stacks',
  means: 'Two tall shelves of books, a rolling ladder and a reader under a green lamp; the ladder creeps along the wall.',
  hint: 'Hover the ladder, a shelf or the lamp.',
  camera: { az: 39, el: 32, pad: 1.06 },
  still: 2,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(11, 8.5, pal.ground, 0, 0, 0, null, { h: .6, r: 1.2, side: pal.base });
    D.box(10.2, .05, 7.6, pal.wood, 0, .02, 0, null, { shadow: false });
    var COLS = [pal.coral, pal.teal, pal.mustard, pal.plum, pal.sage, pal.cobalt];
    [-3.4, .2].forEach(function (x, si) {
      var sh = D.group(x, 0, -2.9); sh.name = 'shelf ' + (si + 1); hot.push(sh);
      D.box(.16, 4.0, 1.1, pal.slate, -1.1, 2.0, 0, sh);
      D.box(.16, 4.0, 1.1, pal.slate, 1.1, 2.0, 0, sh);
      D.box(2.4, .12, 1.2, pal.slate, 0, 4.0, 0, sh);
      [.5, 1.4, 2.3, 3.2].forEach(function (y) { D.box(2.2, .08, 1.0, pal.wood, 0, y, 0, sh); });
      for (var row = 0; row < 4; row++) {
        for (var b = 0; b < 9; b++) {
          D.box(.1, .34, .24, COLS[(row * 9 + b) % 6], -.9 + b * .22, .5 + row * .9, .1, sh, { shadow: false });
        }
      }
    });
    var ladder = D.group(-1.0, 0, -2.2); ladder.rotation.z = -.12; ladder.rotation.x = .1;
    ladder.name = 'rolling ladder'; hot.push(ladder);
    [-.35, .35].forEach(function (x) { D.box(.08, 4.2, .08, pal.wood, x, 2.1, 0, ladder); });
    for (var s = 1; s < 7; s++) D.box(.75, .06, .1, pal.wood, 0, .5 * s, 0, ladder);
    var table = D.group(2.6, 0, .4); table.name = 'reading table'; hot.push(table);
    D.box(2.6, .1, 1.3, pal.wood, 0, .9, 0, table);
    [[-1.0, -.45], [1.0, -.45], [-1.0, .45], [1.0, .45]].forEach(function (l) { D.cyl(.05, .05, .85, pal.ink, l[0], .42, l[1], table, 8); });
    var lamp = D.group(.8, 1.0, -.3, table); lamp.name = 'green lamp'; hot.push(lamp);
    D.cyl(.1, .14, .3, pal.ink, 0, .15, 0, lamp, 8);
    var shade = D.cone(.3, .24, pal.ok, 0, .45, 0, lamp, 14); shade.rotation.x = Math.PI;
    var bulb = D.ball(.05, pal.lampGlow, 0, .3, 0, lamp); bulb.castShadow = false;
    D.box(.7, .04, .5, pal.paper, -.2, .96, .1, table, { shadow: false });
    D.box(.7, .04, .5, pal.paper, -.2, .98, .1, table, { shadow: false });
    D.props.person(2.4, 0, null, { shirt: pal.plum, hat: false, yaw: Math.PI }).position.set(2.6, 0, 1.2);
    D.box(4.4, .02, 3.0, pal.coral, 2.0, .05, .6, null, { shadow: false });
    var plant = D.group(-4.5, 0, 1.0);
    D.cyl(.3, .22, .5, pal.terracotta, 0, .25, 0, plant, 12);
    D.props.bush(0, 0, plant, { r: .36 }).position.y = .5;
    return { hot: hot, ladder: ladder, lamp: lamp, lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    p.ladder.position.x = -1.0 + .9 * D.wave(t, 12);
    p.lamp.rotation.z = .04 * D.wave(t, 3.7);
    p.hot.forEach(function (g) {
      var s = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18));
      s.t = ctx.hover === g ? .26 : 0; s.step(ctx.dt); g.position.y = s.x;
    });
    ctx.read = 'stacks · all quiet';
  }
});

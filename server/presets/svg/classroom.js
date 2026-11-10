/* classroom · a card: roll call.
   A teacher stands at the board while the clock ticks and a paper plane loops
   over four desks and a globe. The room is a low-walled cutaway. */
Any3d.figure({
  name: 'classroom',
  size: 'card',
  theme: 'soft',
  title: 'Roll call',
  means: 'A teacher stands at the board while the clock ticks and a paper plane loops over four desks and a globe.',
  hint: 'Hover the board, the globe or a desk.',
  camera: { az: 40, el: 34, pad: 1.06 },
  still: 2,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(11, 8.5, pal.ground, 0, 0, 0, null, { h: .6, r: 1.2, side: pal.base });
    D.box(10.2, .05, 7.6, pal.wood, 0, .02, 0, null, { shadow: false });
    D.box(10.4, 4.0, .2, pal.paper, 0, 2.0, -3.9, null);
    var board = D.group(-1.0, 0, -3.75); board.name = 'the board'; hot.push(board);
    D.box(5.6, 2.4, .08, pal.ink, 0, 2.2, 0, board);
    D.box(5.3, 2.1, .05, pal.ok, 0, 2.2, .03, board, { shadow: false });
    [1.5, 2.0, 2.5].forEach(function (y, i) { D.box(2.6 - i * .5, .06, .02, pal.paper, -1.0, y, .07, board, { shadow: false }); });
    D.box(2.2, .1, .3, pal.steel, 0, .95, .1, board);
    var clock = D.group(3.4, 3.1, -3.7);
    var face = D.cyl(.45, .45, .12, pal.paper, 0, 0, 0, clock, 20); face.rotation.x = Math.PI / 2;
    var mh = D.box(.04, .32, .03, pal.ink, 0, .12, .1, clock);
    var hh = D.box(.05, .2, .03, pal.ink, 0, .06, .1, clock);
    [[-2.4, .2], [0, .2], [-2.4, 2.0], [0, 2.0]].forEach(function (d, i) {
      var g = D.group(d[0], 0, d[1]); g.name = 'desk ' + (i + 1); hot.push(g);
      D.box(1.3, .1, .8, pal.mustard, 0, .72, 0, g);
      [[-.5, -.3], [.5, -.3], [-.5, .3], [.5, .3]].forEach(function (l) { D.cyl(.04, .04, .7, pal.steel, l[0], .35, l[1], g, 8); });
      D.box(1.0, .04, .5, pal.paper, 0, .78, .05, g);
      var ch = D.group(0, 0, .75, g);
      D.box(.6, .08, .5, pal.cobalt, 0, .52, 0, ch);
      D.box(.6, .5, .08, pal.cobalt, 0, .8, -.22, ch);
      D.cyl(.05, .05, .5, pal.steel, 0, .26, 0, ch, 8);
    });
    D.props.person(-1.0, 0, null, { shirt: pal.teal, hat: false }).position.set(-1.0, 0, -3.0);
    var globe = D.group(3.8, 0, .4); globe.name = 'the globe'; hot.push(globe);
    D.cyl(.07, .09, .5, pal.steel, 0, .25, 0, globe, 8);
    D.cyl(.3, .3, .05, pal.wood, 0, .03, 0, globe, 14);
    var ball = D.group(0, .75, 0, globe);
    D.ball(.35, pal.sky, 0, 0, 0, ball);
    var ring = D.torus(.36, .02, pal.mustard, 0, 0, 0, ball); ring.rotation.x = 1.2;
    var plane = D.group(0, 2.3, 1.0);
    D.box(.5, .04, .18, pal.paper, 0, 0, 0, plane);
    D.wedge(.5, .16, .18, pal.cloud, 0, .08, 0, plane);
    var loop = D.path([[-3.6, 1.2], [-1, .4], [1.6, 1.0], [3.6, 1.6]], false, .8);
    return { hot: hot, mh: mh, hh: hh, ball: ball, plane: plane, loop: loop, lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    p.mh.rotation.z = -t * .5;
    p.hh.rotation.z = -t * .04;
    p.ball.rotation.y = t * .5;
    var s = D.phase(t, 14) * 14;
    D.place(p.plane, p.loop, (s / 14) * p.loop.length);
    p.plane.position.y = 2.0 + .3 * D.wave(t, 3);
    p.hot.forEach(function (g) {
      var sp = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18));
      sp.t = ctx.hover === g ? .26 : 0; sp.step(ctx.dt); g.position.y = sp.x;
    });
    ctx.read = 'class · in progress';
  }
});

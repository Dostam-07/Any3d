/* cafe · a card: a coffee cart on a street corner, first customer of the day.
   The barista pulls a shot (steam rises), a customer walks up, takes a cup
   and walks off; a cat on the chair flicks its tail. Hover the cart, the
   table or the cat and it lifts. Drawn in the soft theme. */
Any3d.figure({
  name: 'cafe',
  size: 'card',
  theme: 'soft',
  title: 'Corner coffee',
  means: 'A barista pulls shots, a customer comes for a cup and goes, a cat minds the chair.',
  hint: 'Hover the cart, the table or the cat.',
  camera: { az: 40, el: 34, pad: 1.06 },
  still: 5,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(11, 8.5, pal.ground, 0, 0, 0, null, { h: .6, r: 1.2, side: pal.base });
    D.box(9.6, .05, 2.4, pal.asphalt, 0, .03, 2.6, null, { shadow: false });
    for (var i = -4.2; i <= 4.2; i += 1.4) D.box(.8, .012, .12, pal.line, i, .06, 2.6, null, { shadow: false });
    D.box(9.6, .14, .3, pal.cloud, 0, .07, 1.25, null, { shadow: false });

    /* the cart */
    var cart = D.group(-.8, 0, -1.2);
    D.rbox(3.4, 1.4, 1.5, pal.accent, 0, .95, 0, cart, { r: .12 });
    D.box(3.5, .1, 1.6, pal.wood, 0, 1.7, 0, cart);
    D.wheel(.36, .18, pal.tyre, -1.2, .36, .85, cart); D.wheel(.36, .18, pal.tyre, 1.2, .36, .85, cart);
    D.wheel(.36, .18, pal.tyre, -1.2, .36, -.85, cart); D.wheel(.36, .18, pal.tyre, 1.2, .36, -.85, cart);
    [-1.55, 1.55].forEach(function (x) { D.cyl(.05, .05, 2.3, pal.ink, x, 2.6, -.6, cart, 8); });
    for (var k = 0; k < 7; k++) D.box(.55, .06, 1.9, k % 2 ? pal.paper : pal.accent, -1.65 + k * .55, 3.72, -.1, cart, { shadow: k === 0 });
    D.box(3.9, .08, .12, pal.ink, 0, 3.7, .85, cart);
    var sign = D.group(-1.1, 3.66, .85, cart); D.box(.04, .2, .04, pal.ink, 0, -.1, 0, sign, { shadow: false }); D.box(.8, .45, .05, pal.paper, 0, -.42, 0, sign); D.box(.5, .07, .05, pal.ink, 0, -.36, .03, sign, { shadow: false }); D.box(.3, .07, .05, pal.ink, 0, -.5, .03, sign, { shadow: false });
    var machine = D.box(.9, .7, .6, pal.steel, .9, 2.1, -.3, cart); D.box(.3, .12, .3, pal.mustard, .9, 2.5, -.3, cart);
    D.cyl(.1, .1, .3, pal.ink, .9, 1.9, .15, cart, 8);
    var cups = []; [[-1.1, -.3], [-.7, -.3], [-.3, -.3]].forEach(function (c) { var g = D.group(c[0], 1.75, c[1], cart); D.cyl(.14, .11, .26, pal.paper, 0, .13, 0, g, 12); D.cyl(.15, .15, .04, pal.ink, 0, .28, 0, g, 12); cups.push(g); });
    var steam = []; [0, 1, 2].forEach(function (k) { var b = D.ball(.08, pal.cloud, .9 + k * .1 - .1, 2.6, -.3, cart); b.castShadow = false; steam.push(b); });
    var barista = D.props.person(0, 0, cart, { shirt: pal.teal, hat: pal.ink, yaw: Math.PI }); barista.position.set(.1, .0, -1.0); barista.scale.setScalar(1.15);
    cart.name = 'coffee cart'; hot.push(cart);

    /* a bistro table, two chairs, the cat, a planter and a sign */
    var table = D.group(2.6, 0, .4);
    D.cyl(.7, .7, .06, pal.paper, 0, .78, 0, table, 18); D.cyl(.05, .05, .76, pal.ink, 0, .4, 0, table, 8); D.cyl(.3, .3, .04, pal.ink, 0, .02, 0, table, 12);
    D.cyl(.1, .08, .2, pal.sky, .2, .9, .1, table, 10);
    table.name = 'table'; hot.push(table);
    function chair(x, z, yaw) { var g = D.group(x, 0, z); g.rotation.y = yaw; D.box(.6, .05, .6, pal.wood, 0, .5, 0, g); D.box(.6, .55, .05, pal.wood, 0, .8, -.28, g); [[-.25, -.25], [.25, -.25], [-.25, .25], [.25, .25]].forEach(function (l) { D.cyl(.03, .03, .5, pal.ink, l[0], .25, l[1], g, 6); }); return g; }
    chair(3.6, 1.0, -.8); var seat = chair(1.7, 1.4, .9);
    var cat = D.group(0, .53, 0, seat); var catBody = D.ball(.22, pal.mustard, 0, .16, 0, cat); catBody.scale.set(1.3, .8, 1);
    D.ball(.15, pal.mustard, .25, .3, 0, cat); D.cone(.06, .12, pal.mustard, .2, .42, .08, cat, 6); D.cone(.06, .12, pal.mustard, .3, .42, -.08, cat, 6);
    var tail = D.group(-.28, .18, 0, cat); D.cyl(.03, .04, .45, pal.mustard, 0, .2, 0, tail, 6);
    seat.name = 'the cat'; hot.push(seat);
    var planter = D.group(-3.9, 0, 1.2); D.box(.9, .7, .9, pal.terracotta, 0, .35, 0, planter); D.props.bush(0, 0, planter, { r: .38 }).position.y = .6;
    D.props.tree(3.9, -2.4, null, { r: .7, kind: 'round', yaw: .6 }); D.props.tree(-3.6, -2.6, null, { r: .55, kind: 'tall' });
    var board = D.group(-2.9, 0, .4); board.rotation.y = .4; D.box(.7, 1.0, .05, pal.ink, 0, .6, 0, board); D.box(.5, .08, .05, pal.paper, 0, .75, .03, board, { shadow: false }); D.box(.3, .08, .05, pal.paper, 0, .55, .03, board, { shadow: false });

    /* the customer and the cup they carry */
    var cust = D.props.person(0, 0, null, { shirt: pal.plum, hat: false }); var hand = D.group(.22, .4, 0, cust); var held = D.cyl(.12, .1, .22, pal.paper, 0, 0, 0, hand, 10); held.visible = false;
    var walk = D.path([[4.6, 2.6], [1.2, 2.6], [-.3, .9]]);
    return { hot: hot, cups: cups, steam: steam, tail: tail, sign: sign, cust: cust, held: held, walk: walk, lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    /* the customer: 14 s; walks in 4 s, waits 3 s, takes the cup, walks out 4 s, gone 3 s */
    var T = D.phase(t, 14) * 14, L = p.walk.length, d, back = false, has = false, vis = true;
    if (T < 4) d = D.inOut(T / 4) * L;
    else if (T < 7) d = L;
    else if (T < 11) { d = (1 - D.inOut((T - 7) / 4)) * L; back = true; has = true; }
    else { d = 0; vis = false; }
    var q = D.place(p.cust, p.walk, d); if (back) p.cust.rotation.y += Math.PI; p.cust.visible = vis;
    p.cust.position.y = (T < 4 || (T >= 7 && T < 11)) ? .05 * Math.abs(D.wave(t, .5)) : 0;
    p.held.visible = has; p.cups[2].visible = !(T >= 6.6 && T < 14);
    var steamOn = T >= 1 && T < 6;
    p.steam.forEach(function (b, k) { var u = D.phase(t, 1.6, k * .33); b.position.y = 2.6 + u * .9; b.scale.setScalar(steamOn ? (.6 + u) * (1 - u) * 1.6 : .001); b.position.x = .9 + .12 * D.wave(t, 1.1, k * .3); });
    p.tail.rotation.z = .5 + .35 * D.wave(t, 2.2) + .1 * D.wave(t, .9);
    p.sign.rotation.z = .14 * D.wave(t, 2.7) + .05 * D.wave(t, 1.1);
    p.hot.forEach(function (g) {
      var s = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18)); s.t = ctx.hover === g ? .3 : 0; s.step(ctx.dt); g.position.y = s.x;
    });
  }
});

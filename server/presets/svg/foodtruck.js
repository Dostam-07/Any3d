/* foodtruck · a card: service window open.
   A truck serves from its striped awning; the grill steams, the sign sways
   and a customer waits by a traffic cone at the kerb. */
Any3d.figure({
  name: 'foodtruck',
  size: 'card',
  theme: 'toy',
  title: 'Service window',
  means: 'A food truck serves from its awning window; the grill steams, the sign sways and a customer waits with a cone.',
  hint: 'Hover the truck, the grill or the customer.',
  camera: { az: 42, el: 33, pad: 1.06 },
  still: 2,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(11, 8.5, pal.ground, 0, 0, 0, null, { h: .6, r: 1.2, side: pal.base });
    D.box(10.2, .04, 3.2, pal.asphalt, 0, .04, 2.4, null, { shadow: false });
    for (var i = -4.6; i <= 4.6; i += 1.3) D.box(.7, .012, .16, pal.line, i, .07, 2.4, null, { shadow: false });
    var truck = D.group(-.6, 0, -.8); truck.name = 'the truck'; hot.push(truck);
    D.box(6.6, 2.5, 2.6, pal.paper, 0, 1.6, 0, truck);
    D.box(2.4, 2.1, 2.5, pal.coral, -2.6, 1.35, 0, truck);
    D.box(1.6, 1.0, .1, pal.sky, -2.9, 1.9, 1.28, truck, { shadow: false });
    D.box(6.9, .18, 2.8, pal.coral, 0, 2.9, 0, truck);
    [-1.9, 1.9].forEach(function (x) {
      D.wheel(.5, .3, pal.tyre, x, .5, 1.35, truck);
      D.wheel(.5, .3, pal.tyre, x, .5, -1.35, truck);
      var hub = D.cyl(.2, .2, .34, pal.hub, x, .5, 1.35, truck, 10); hub.rotation.x = Math.PI / 2;
    });
    D.box(4.4, 1.0, .12, pal.ink, 1.0, 1.9, 1.32, truck, { shadow: false });
    D.box(4.0, .8, .08, pal.lampGlow, 1.0, 1.9, 1.36, truck, { mat: { emissive: pal.lampGlow, emissiveIntensity: .5 }, shadow: false });
    D.box(4.8, .12, .7, pal.wood, 1.0, 1.3, 1.7, truck);
    var awn = D.group(1.0, 2.55, 1.35, truck); awn.name = 'the awning'; hot.push(awn);
    for (var a = 0; a < 8; a++) {
      var st = D.box(.56, .06, 1.1, a % 2 ? pal.paper : pal.coral, -1.96 + a * .56, 0, .55, awn);
      st.rotation.x = -.25;
    }
    var grill = D.group(1.0, 1.42, .6, truck); grill.name = 'the grill'; hot.push(grill);
    D.box(1.6, .18, .9, pal.steel, 0, 0, 0, grill);
    for (var k = 0; k < 4; k++) D.cyl(.14, .14, .12, pal.mustard, -.6 + k * .4, .12, 0, grill, 10);
    var steam = [];
    [0, 1, 2].forEach(function () { var b = D.ball(.1, pal.cloud, 0, 0, 0, grill); b.castShadow = false; steam.push(b); });
    var sign = D.group(1.0, 3.0, 1.6, truck); sign.name = 'the sign'; hot.push(sign);
    D.box(.05, .5, .05, pal.ink, -.9, -.25, 0, sign);
    D.box(.05, .5, .05, pal.ink, .9, -.25, 0, sign);
    D.box(2.2, .55, .06, pal.mustard, 0, -.6, 0, sign);
    D.box(1.8, .18, .02, pal.ink, 0, -.56, .04, sign, { shadow: false });
    var cust = D.props.person(2.6, 0, null, { shirt: pal.teal, hat: false, yaw: -1.2 });
    cust.position.set(2.6, 0, 1.2);
    D.props.cone(3.6, 2.9, null);
    D.props.tree(-4.4, 1.9, null, { r: .5, kind: 'round' });
    return { hot: hot, steam: steam, sign: sign, awn: awn, cust: cust, lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    p.steam.forEach(function (b, k) {
      var u = D.phase(t, 1.8, k * .4);
      b.position.set(.1 * D.wave(t, 1.2, k), .1 + u * .7, 0);
      b.scale.setScalar((1 - u) * 1.2 + .2);
    });
    p.sign.rotation.z = .08 * D.wave(t, 2.6);
    p.awn.rotation.z = .02 * D.wave(t, 3.1);
    p.cust.rotation.z = .03 * D.wave(t, 2.2);
    p.hot.forEach(function (g) {
      var s = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18));
      s.t = ctx.hover === g ? .28 : 0; s.step(ctx.dt); g.position.y = s.x;
    });
    ctx.read = 'window · open';
  }
});

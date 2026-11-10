/* campsite · a card: first night out.
   A tent stands by a small fire; smoke rises, the flames flicker and a camper
   warms their hands on a log while pines and a rock frame the clearing. */
Any3d.figure({
  name: 'campsite',
  size: 'card',
  theme: 'toy',
  title: 'First night out',
  means: 'A tent stands by a small fire; smoke rises, the flames flicker and a camper warms their hands on a log.',
  hint: 'Hover the tent, the fire or the camper.',
  camera: { az: 42, el: 33, pad: 1.06 },
  still: 2,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(11, 8.5, pal.grass, 0, 0, 0, null, { h: .6, r: 1.2, side: pal.base });
    D.props.tree(-4.2, -2.4, null, { r: .7, kind: 'pine' });
    D.props.tree(4.2, -2.6, null, { r: .55, kind: 'pine' });
    D.props.tree(3.8, 2.6, null, { r: .5, kind: 'round' });
    D.props.rock(-3.0, 1.8, null, { r: .4 });
    var tent = D.group(-1.8, 0, -1.4); tent.rotation.y = .3; tent.name = 'the tent'; hot.push(tent);
    D.wedge(3.2, 1.9, 3.4, pal.teal, 0, 1.9, 0, tent);
    D.box(3.2, .05, 3.4, pal.leafDark, 0, .03, 0, tent);
    [-1.6, 1.6].forEach(function (z) { D.box(.08, 2.0, .08, pal.ink, 0, 1.0, z, tent); });
    D.box(.06, 1.5, 1.1, pal.ink, 0, .75, 1.7, tent, { shadow: false });
    D.box(.5, .06, .06, pal.ink, 0, 1.6, -1.7, tent);
    var fire = D.group(1.6, 0, .6); fire.name = 'the fire'; hot.push(fire);
    D.cyl(1.0, 1.0, .08, pal.sand, 0, .04, 0, fire, 18);
    for (var i = 0; i < 5; i++) {
      var lg = D.cyl(.1, .12, 1.2, pal.trunk, 0, .16, 0, fire, 8);
      lg.rotation.z = Math.PI / 2 - .3; lg.rotation.y = i * 1.26;
    }
    var flames = [];
    for (var f = 0; f < 3; f++) flames.push(D.cone(.22 - f * .05, .8 - f * .15, f === 1 ? pal.mustard : pal.flame, 0, .55 + f * .12, (f - 1) * .14, fire, 10));
    var glow = D.ball(.28, pal.lampGlow, 0, .4, 0, fire); glow.castShadow = false;
    var smoke = [];
    [0, 1, 2].forEach(function () { var b = D.ball(.16, pal.cloud, 0, 0, 0, fire); b.castShadow = false; smoke.push(b); });
    var seat = D.group(.2, 0, 1.6); seat.rotation.y = 1.57;
    D.cyl(.22, .22, 1.8, pal.trunk, 0, .22, 0, seat, 10);
    var camper = D.props.person(0, 0, null, { shirt: pal.mustard, hat: false, yaw: 2.2 });
    camper.position.set(-.1, 0, 1.9);
    D.props.bush(2.8, 2.4, null, { r: .24 });
    return { hot: hot, flames: flames, smoke: smoke, glow: glow, camper: camper, lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    p.flames.forEach(function (f, i) {
      f.scale.y = .8 + .3 * D.wave(t, .8 + i * .17, i * .4);
      f.rotation.z = .1 * D.wave(t, 1.1, i);
    });
    p.glow.scale.setScalar(1 + .12 * D.wave(t, .7));
    p.smoke.forEach(function (b, k) {
      var u = D.phase(t, 3.2, k * .5);
      b.position.set(.2 * D.wave(t, 1.6, k), .8 + u * 2.0, .1 * D.wave(t, 1.2, k));
      b.scale.setScalar((1 - u) * 1.4 + .1);
    });
    p.camper.rotation.z = .02 * D.wave(t, 2.3);
    p.hot.forEach(function (g) {
      var s = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18));
      s.t = ctx.hover === g ? .28 : 0; s.step(ctx.dt); g.position.y = s.x;
    });
    ctx.read = 'fire · lit';
  }
});

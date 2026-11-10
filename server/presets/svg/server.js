/* server · a card in mono with teal lights.
   A small server room: three racks of units with status lights, a raised
   floor, a cable tray, a cooling unit whose fan turns, a technician who
   walks the aisle with a laptop. The lights blink in their own rhythms;
   hover a rack and it lifts and its lights all turn on. */
Any3d.figure({
  name: 'server',
  size: 'card',
  theme: { base: 'mono', accent: '#4aa3a0' },
  title: 'Server room',
  means: 'Three racks blink in their own rhythms, the fan turns, a technician walks the aisle with a laptop.',
  hint: 'Hover a rack and all its lights turn on.',
  camera: { az: 40, el: 34, pad: 1.06 },
  still: 2,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [], LED = pal.accent;
    D.slab(10, 8, pal.ground, 0, 0, 0, null, { h: .6, r: 1.1, side: pal.base });
    for (var i = -3.5; i <= 3.5; i += 1) for (var j = -2.5; j <= 2.5; j += 1) D.box(.92, .02, .92, (i + j) % 2 ? pal.cloud : pal.ground, i, .02, j, null, { shadow: false });
    var racks = [], lights = [];
    [-2.4, 0, 2.4].forEach(function (x, r) {
      var g = D.group(x, 0, -1.4); g.name = 'rack ' + (r + 1); hot.push(g); racks.push(g);
      D.box(1.6, 3.6, 1.2, pal.slate, 0, 1.8, 0, g); D.box(1.62, .08, 1.22, pal.ink, 0, .04, 0, g); D.box(1.62, .06, 1.22, pal.ink, 0, 3.62, 0, g);
      for (var u = 0; u < 7; u++) {
        var y = .45 + u * .45, dark = (u + r) % 3 === 0;
        D.box(1.4, .36, .06, dark ? pal.ink : pal.steel, 0, y, .62, g, { shadow: false });
        var l = D.box(.08, .08, .03, LED, -.55, y, .66, g, { mat: { emissive: LED, emissiveIntensity: .2 }, shadow: false }); lights.push({ m: l.material, r: r, u: u });
        D.box(.08, .08, .03, pal.mustard, -.42, y, .66, g, { mat: { emissive: pal.mustard, emissiveIntensity: .15 }, shadow: false });
        for (var v = 0; v < 4; v++) D.box(.12, .03, .02, pal.ink, -.1 + v * .16, y, .66, g, { shadow: false });
      }
    });
    D.box(7.6, .08, .5, pal.steel, 0, 3.9, -1.4, null); [-3.6, 3.6].forEach(function (x) { D.box(.06, .5, .06, pal.steel, x, 3.65, -1.4, null); });
    var ac = D.group(-3.9, 0, 2.2); ac.name = 'cooling unit'; hot.push(ac);
    D.box(1.4, 2.2, 1.0, pal.cloud, 0, 1.1, 0, ac); D.cyl(.42, .42, .08, pal.ink, 0, 1.4, .52, ac, 18).rotation.x = Math.PI / 2;
    var fan = D.group(0, 1.4, .56, ac); for (var b = 0; b < 5; b++) { var bl = D.box(.1, .34, .03, pal.paper, 0, 0, 0, fan); bl.position.set(Math.cos(b * 1.257) * .2, Math.sin(b * 1.257) * .2, 0); bl.rotation.z = b * 1.257; }
    [.3, .6, .9].forEach(function (y) { D.box(1.0, .04, .02, pal.steel, 0, y, .51, ac, { shadow: false }); });
    var desk = D.group(3.4, 0, 2.4); D.box(1.6, .06, .8, pal.paper, 0, .78, 0, desk); [[-.7, -.3], [.7, -.3], [-.7, .3], [.7, .3]].forEach(function (l) { D.cyl(.03, .03, .76, pal.ink, l[0], .38, l[1], desk, 6); });
    D.box(.7, .45, .04, pal.ink, 0, 1.05, -.2, desk); D.box(.66, .4, .02, LED, 0, 1.05, -.17, desk, { shadow: false, mat: { emissive: LED, emissiveIntensity: .5 } });
    var tech = D.props.person(0, 0, null, { shirt: pal.plum, hat: false }); var lap = D.box(.32, .02, .22, pal.ink, .2, .5, 0, tech); D.box(.3, .2, .02, LED, .33, .6, 0, tech, { shadow: false, mat: { emissive: LED, emissiveIntensity: .4 } }).rotation.y = Math.PI / 2;
    var walk = D.path([[-3.2, .4], [3.2, .4]]);
    var lit = D.mat(LED, { emissive: LED, emissiveIntensity: 1.4 }), dim = D.mat(LED, { emissive: LED, emissiveIntensity: .2 });
    return { hot: hot, racks: racks, lights: lights, fan: fan, tech: tech, walk: walk, lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    p.fan.rotation.z = t * 6;
    p.lights.forEach(function (l) { var on = ctx.hover === p.racks[l.r] || D.phase(t, 1.3 + l.r * .4, l.u * .13) < .25; l.m.emissiveIntensity = on ? 1.4 : .2; });
    var W = D.phase(t, 14), wd = W < .5 ? D.smooth(W * 2) : 1 - D.smooth((W - .5) * 2);
    D.place(p.tech, p.walk, wd * p.walk.length); if (W >= .5) p.tech.rotation.y += Math.PI; p.tech.position.y = .05 * Math.abs(D.wave(t, .5));
    p.hot.forEach(function (g) { var s = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18)); s.t = ctx.hover === g ? .25 : 0; s.step(ctx.dt); g.position.y = s.x; });
  }
});

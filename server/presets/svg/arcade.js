/* arcade · a card: one more quarter.
   Three cabinets glow in a dark arcade; the screens pulse, the joysticks
   wiggle and a stool waits in front of the change machine. */
Any3d.figure({
  name: 'arcade',
  size: 'card',
  theme: 'night',
  title: 'One more quarter',
  means: 'Three cabinets glow in a dark arcade; the screens flicker, the joysticks wiggle and a stool waits in front.',
  hint: 'Hover a cabinet, the stool or the change machine.',
  camera: { az: 42, el: 33, pad: 1.06 },
  still: 2,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(11, 8.5, pal.base, 0, 0, 0, null, { h: .6, r: 1.2, side: pal.slate });
    D.box(10.2, .04, 7.6, pal.ink, 0, .02, 0, null, { shadow: false });
    [-4.4, -1.4, 1.6, 4.4].forEach(function (x) { D.box(.05, .01, 7.4, pal.coral, x, .05, 0, null, { shadow: false }); });
    D.box(10.2, .05, .2, pal.coral, 0, .06, 3.6, null, { shadow: false });
    var screens = [], joys = [];
    [-3.0, 0, 3.0].forEach(function (x, i) {
      var cab = D.group(x, 0, -2.0); cab.name = 'cabinet ' + (i + 1); hot.push(cab);
      D.box(1.7, 2.6, 1.3, pal.slate, 0, 1.3, 0, cab);
      D.box(1.8, .3, 1.4, pal.cobalt, 0, 2.7, 0, cab);
      D.box(1.4, .9, .06, pal.ink, 0, 1.9, .68, cab, { shadow: false });
      var glow = i === 1 ? pal.mint : pal.lampGlow;
      var scr = D.box(1.15, .72, .04, glow, 0, 1.9, .72, cab, { mat: { emissive: glow, emissiveIntensity: 1.4 }, shadow: false });
      screens.push(scr);
      D.box(1.3, .16, .5, pal.ink, 0, 1.3, .75, cab, { shadow: false });
      D.cyl(.05, .05, .18, pal.steel, -.35, 1.45, .75, cab, 8);
      var joy = D.group(-.35, 1.54, .75, cab); D.ball(.08, pal.coral, 0, 0, 0, joy); joys.push(joy);
      D.cyl(.07, .07, .04, pal.mustard, .1, 1.32, .75, cab, 8);
      D.cyl(.07, .07, .04, pal.teal, .3, 1.32, .75, cab, 8);
    });
    var stool = D.group(-1.4, 0, 1.6); stool.name = 'the stool'; hot.push(stool);
    D.cyl(.55, .55, .1, pal.coral, 0, .55, 0, stool, 16);
    D.cyl(.08, .12, .5, pal.steel, 0, .27, 0, stool, 8);
    D.cyl(.4, .4, .05, pal.steel, 0, .03, 0, stool, 14);
    var change = D.group(4.2, 0, -2.4); change.name = 'change machine'; hot.push(change);
    D.box(1.0, 1.9, .7, pal.cobalt, 0, .95, 0, change);
    D.box(.7, .4, .05, pal.lampGlow, 0, 1.45, .38, change, { mat: { emissive: pal.lampGlow, emissiveIntensity: .8 }, shadow: false });
    D.box(.5, .08, .06, pal.ink, 0, .8, .38, change, { shadow: false });
    return { hot: hot, screens: screens, joys: joys, lift: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    p.screens.forEach(function (s, i) { s.scale.y = 1 + .03 * D.wave(t * (2 + i), 1.3, i); });
    p.joys.forEach(function (j, i) { j.rotation.z = .3 * D.wave(t, 4.2, i * .5); });
    p.hot.forEach(function (g) {
      var s = p.lift[g.id] || (p.lift[g.id] = D.spring(120, 18));
      s.t = ctx.hover === g ? .26 : 0; s.step(ctx.dt); g.position.y = s.x;
    });
    ctx.read = 'high score · 07';
  }
});

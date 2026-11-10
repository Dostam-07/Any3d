/* vending · a mini in print: nothing in stock.
   A vending machine with its shelves bare: two shelves of coils with
   nothing on them behind an open front, a panel with a little screen, a
   coin slot and a button, an empty tray at the bottom, a plant beside it
   and a mat in front. Every nine seconds a coil turns a notch and nothing
   drops; tap the button and one turns now. The button is the accent, in
   flat tones and ink; the compressor's fan turns on the side.
   Parts · ground: the tile, the mat. Structure: the cabinet (a back block
   and a frame around the open front), the shelves, the panel, the tray.
   Movers: the coils and their fins, the fan. Furniture: the plant, two
   feet. Light: the panel's little screen. */
Any3d.figure({
  name: 'vending',
  size: 'mini',
  theme: { base: 'print', accent: '#e8714f' },
  means: 'A vending machine with every coil bare; now and then a coil turns and nothing drops into the tray.',
  hint: 'Tap the button and a coil turns now.',
  title: 'Nothing in stock',
  still: 1.4,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(3, 3, pal.ground, 0, 0, 0, null, { h: .45, r: .45, side: pal.base });
    D.box(1.3, .02, .6, pal.sage, -.1, .02, 1.05, null, { shadow: false });
    /* the cabinet: a back block, then a frame around the open front (a left post, a wide right post with the
       panel, a top band, a bottom band with the tray), so the coils sit in a real recess */
    var vm = D.group(-.1, 0, -.1); vm.name = 'machine';
    [-.45, .45].forEach(function (x) { D.box(.3, .1, .9, pal.ink, x, .05, 0, vm); });
    D.box(1.4, 2.4, .7, pal.cloud, 0, 1.3, -.15, vm);
    D.box(.1, 2.4, .3, pal.cloud, -.65, 1.3, .35, vm); D.box(.5, 2.4, .3, pal.cloud, .45, 1.3, .35, vm);
    D.box(.8, .2, .3, pal.cloud, -.2, 2.4, .35, vm); D.box(.8, .75, .3, pal.cloud, -.2, .475, .35, vm);
    D.box(.8, 1.45, .04, pal.ink, -.2, 1.475, .22, vm, { shadow: false });
    /* two shelves, three coils each: a rod with a fin, in two rings */
    var coils = [];
    [1.05, 1.7].forEach(function (y, row) {
      D.box(.78, .04, .24, pal.paper, -.2, y - .2, .36, vm, { shadow: false });
      [-.46, -.2, .06].forEach(function (x, k) {
        var c = D.group(x, y - .07, .37, vm); var rod = D.cyl(.03, .03, .24, pal.steel, 0, 0, 0, c, 8); rod.rotation.x = Math.PI / 2;
        D.box(.2, .03, .2, pal.ink, 0, 0, 0, c, { shadow: false });
        [-.08, .08].forEach(function (z) { var ring = D.torus(.085, .012, pal.ink, 0, 0, z, c); ring.castShadow = false; });
        coils.push({ g: c, i: row * 3 + k });
      });
    });
    /* the panel on the right post: a little screen, a coin slot, the button; the tray in the bottom band */
    var panel = D.group(.45, 0, .51, vm);
    var screen = D.box(.3, .22, .03, pal.ink, 0, 2.05, 0, panel, { shadow: false, mat: { emissive: pal.lampGlow, emissiveIntensity: .4 } });
    D.box(.18, .03, .03, pal.ink, 0, 1.75, 0, panel, { shadow: false });
    var button = D.group(0, 1.45, 0, panel); button.name = 'button'; hot.push(button);
    var cap = D.cyl(.1, .1, .08, pal.accent, 0, 0, .02, button, 14); cap.rotation.x = Math.PI / 2;
    D.box(.6, .3, .03, pal.ink, -.2, .5, .51, vm, { shadow: false }); D.box(.6, .03, .24, pal.steel, -.2, .36, .6, vm);
    /* the compressor's fan on the right side, behind a ring */
    var fan = D.group(.72, .45, -.2, vm); for (var fb = 0; fb < 3; fb++) { var bl = D.box(.02, .12, .05, pal.steel, 0, 0, 0, fan); bl.position.set(0, Math.cos(fb * 2.094) * .08, Math.sin(fb * 2.094) * .08); bl.rotation.x = fb * 2.094; }
    var grille = D.torus(.15, .015, pal.ink, .73, .45, -.2, vm); grille.rotation.y = Math.PI / 2;
    /* the plant */
    var plant = D.group(1.0, 0, .55); D.cyl(.22, .17, .4, pal.terracotta, 0, .2, 0, plant, 12); D.props.bush(0, 0, plant, { r: .24 }).position.y = .34;
    var lit = D.mat(pal.accent, { emissive: pal.accent, emissiveIntensity: .8 });
    return { hot: hot, coils: coils, button: button, cap: cap, screen: screen, dark: screen.material, lit: lit, fan: fan, plant: plant, base: 0, lastPress: -1, push: D.spring(140, 16) };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    /* one coil turns a notch every 9 s (the first three seconds in); a tap turns the next one now */
    if (ctx.pressed === p.button && ctx.pressedAt !== p.lastPress) { p.lastPress = ctx.pressedAt; if (D.phase(t - p.base + 6, 9) * 9 > 1.6) p.base = t + 6; }
    var T = D.phase(t - p.base + 6, 9) * 9, which = Math.floor(D.phase(t - p.base + 6, 54) * 6), turn = D.smooth(D.clamp(T / 1.2, 0, 1));
    p.coils.forEach(function (c) { c.g.rotation.z = c.i === which ? turn * Math.PI / 2 : 0; });
    p.screen.material = T < 1.6 ? p.lit : p.dark;
    p.push.t = T < .3 ? -.03 : 0; p.push.step(ctx.dt); p.cap.position.z = .02 + p.push.x;
    p.fan.rotation.x = t * 9; p.plant.rotation.z = .05 * D.wave(t, 3.1);
    ctx.read = T < 1.6 ? 'coil ' + (which + 1) + ' · turning' : 'tray · empty';
  }
});

/* desk · a mini, drawn in ink.
   A desk with a lamp, an empty tray, a mug and a chair. The chair swivels
   a little now and then, and the mug steams. */
Any3d.figure({
  name: 'desk',
  size: 'mini',
  theme: { base: 'line', accent: '#e8714f' },
  means: 'A desk with a lamp, an empty tray and a mug; the chair swivels now and then and the mug steams.',
  hint: 'Wait for the chair to swivel.',
  title: 'Desk',
  still: 1,
  build: function (o) {
    var D = o.D, pal = o.pal;
    D.slab(2.8, 2.8, pal.ground, 0, 0, 0, null, { h: .45, r: .42, side: pal.base });
    var desk = D.group(.1, 0, -.2); desk.rotation.y = .15;
    D.box(2.2, .08, 1.1, pal.paper, 0, .9, 0, desk); [[-1, -.45], [1, -.45], [-1, .45], [1, .45]].forEach(function (l) { D.cyl(.035, .035, .86, pal.ink, l[0], .43, l[1], desk, 8); });
    var lamp = D.group(-.75, .94, -.3, desk); D.cyl(.16, .18, .05, pal.ink, 0, .02, 0, lamp, 14); var armA = D.cyl(.025, .025, .7, pal.ink, 0, .37, 0, lamp, 6);
    var elbow = D.group(0, .72, 0, lamp); elbow.rotation.z = -.9; D.cyl(.025, .025, .6, pal.ink, 0, .3, 0, elbow, 6);
    var head = D.group(0, .6, 0, elbow); head.rotation.z = 1.1; D.cone(.16, .24, pal.accent, 0, .1, 0, head, 14).rotation.x = Math.PI;
    var tray = D.group(.45, .94, .1, desk); D.box(.7, .03, .5, pal.accent, 0, .015, 0, tray); D.box(.7, .1, .03, pal.accent, 0, .05, -.24, tray); D.box(.7, .1, .03, pal.accent, 0, .05, .24, tray); D.box(.03, .1, .5, pal.accent, -.34, .05, 0, tray);
    var mug = D.group(-.15, .94, .25, desk); D.cyl(.09, .08, .18, pal.paper, 0, .09, 0, mug, 14); D.torus(.07, .02, pal.paper, .11, .1, 0, mug);
    var steam = []; [0, 1, 2].forEach(function (k) { var b = D.ball(.03, pal.cloud, 0, 0, 0, mug); b.castShadow = false; steam.push(b); });
    D.box(.5, .02, .36, pal.paper, .05, .95, -.25, desk); D.box(.5, .02, .36, pal.paper, .1, .97, -.2, desk);
    var chair = D.group(.1, 0, .85); chair.rotation.y = .3;
    D.cyl(.05, .05, .5, pal.ink, 0, .25, 0, chair, 8); D.cyl(.28, .28, .04, pal.ink, 0, .02, 0, chair, 14);
    var seat = D.group(0, .5, 0, chair); D.rbox(.6, .08, .6, pal.ink, 0, .04, 0, seat, { r: .03 }); D.rbox(.6, .55, .08, pal.ink, 0, .36, -.28, seat, { r: .03 });
    D.props.bush(-1.1, .95, null, { r: .22 });
    return { seat: seat, chair: chair, steam: steam, head: head };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    p.chair.rotation.y = .3 + .5 * D.smooth(D.pulse(t, 9, .4)) * D.wave(t, 9);
    p.head.rotation.z = 1.1 + .06 * D.wave(t, 4);
    p.steam.forEach(function (b, k) { var u = D.phase(t, 2.2, k * .33); b.position.set(.03 * D.wave(t, 1.3, k * .3), .2 + u * .35, 0); b.scale.setScalar((1 - u) * 1.2 + .2); });
  }
});

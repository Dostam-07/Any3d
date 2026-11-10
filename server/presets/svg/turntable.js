/* turntable · a mini, drawn in ink, with a brand accent.
   A record player on a low cabinet with an empty crate beside it. Now and
   then the tonearm lifts, swings over the bare platter, finds no record,
   and goes back to its rest. The platter mat is the one accent. */
Any3d.figure({
  name: 'turntable',
  size: 'mini',
  theme: { base: 'line', accent: '#7c5cff' },
  means: 'A record player with nothing on it and an empty crate; now and then the arm swings over, finds no record and goes back.',
  hint: 'Wait for the arm to look for a record.',
  title: 'Turntable',
  still: 4,
  build: function (o) {
    var D = o.D, pal = o.pal;
    D.slab(2.8, 2.8, pal.ground, 0, 0, 0, null, { h: .45, r: .45, side: pal.base });

    // low cabinet on four short legs, a little right of centre
    var cab = D.group(.3, 0, -.4);
    D.box(1.5, .5, .8, pal.paper, 0, .4, 0, cab);
    D.box(1.56, .05, .86, pal.paper, 0, .675, 0, cab);
    [[-.68, -.33], [.68, -.33], [-.68, .33], [.68, .33]].forEach(function (l) { D.cyl(.035, .035, .15, pal.ink, l[0], .075, l[1], cab, 10); });
    D.box(.02, .4, .02, pal.ink, 0, .4, .41, cab);

    // the record player
    var tt = D.group(0, .7, 0, cab);
    D.rbox(1.15, .12, .82, pal.paper, 0, .06, 0, tt, { r: .03 });
    D.cyl(.34, .34, .05, pal.cloud, -.14, .145, 0, tt, 32);
    D.cyl(.31, .31, .012, pal.accent, -.14, .176, 0, tt, 32);
    D.cyl(.012, .012, .06, pal.ink, -.14, .2, 0, tt, 8);
    D.cyl(.035, .035, .02, pal.ink, -.42, .13, .32, tt, 12);
    D.cyl(.035, .035, .02, pal.ink, -.3, .13, .32, tt, 12);

    // tonearm: a pivot at the back right, the arm pointing to the front at rest
    D.cyl(.07, .08, .09, pal.ink, .42, .165, -.26, tt, 14);
    var yaw = D.group(.42, .235, -.26, tt);
    var lift = D.group(0, 0, 0, yaw);
    var arm = D.cyl(.016, .016, .58, pal.ink, 0, 0, .29, lift, 8); arm.rotation.x = Math.PI / 2;
    D.box(.07, .035, .11, pal.ink, 0, -.01, .6, lift);
    var cw = D.cyl(.045, .045, .08, pal.ink, 0, 0, -.07, lift, 12); cw.rotation.x = Math.PI / 2;
    D.cyl(.014, .014, .08, pal.ink, .42, .2, .33, tt, 8);

    // a floor speaker beside the cabinet, facing the room
    var spk = D.group(-.85, 0, -.35); spk.rotation.y = .2;
    D.rbox(.46, .95, .4, pal.paper, 0, .475, 0, spk, { r: .03 });
    var w1 = D.cyl(.15, .15, .03, pal.cloud, 0, .32, .2, spk, 20); w1.rotation.x = Math.PI / 2;
    var w2 = D.cyl(.07, .07, .03, pal.cloud, 0, .72, .2, spk, 16); w2.rotation.x = Math.PI / 2;

    // an empty record crate on the floor: slatted on the two sides that face us, so you see into it
    var crate = D.group(.15, 0, .72); crate.rotation.y = -.2;
    D.box(.72, .03, .56, pal.wood, 0, .015, 0, crate);
    D.box(.72, .26, .03, pal.wood, 0, .13, -.265, crate);
    D.box(.03, .26, .56, pal.wood, -.345, .13, 0, crate);
    [.04, .22].forEach(function (y) {
      D.box(.72, .06, .03, pal.wood, 0, y, .265, crate);
      D.box(.03, .06, .56, pal.wood, .345, y, 0, crate);
    });
    D.box(.04, .26, .04, pal.wood, .345, .13, .265, crate);

    return { yaw: yaw, lift: lift };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, T = D.phase(ctx.t, 9) * 9;
    // up, over, down to hover, wait, up, back, down: one look every nine seconds
    var up = D.smooth((T - .8) / .6) * (1 - D.smooth((T - 2.8) / .6)) + D.smooth((T - 5) / .5) * (1 - D.smooth((T - 6.9) / .6));
    var over = D.inOut((T - 1.4) / 1.4) * (1 - D.inOut((T - 5.5) / 1.4));
    p.yaw.rotation.y = -.7 * over;
    p.lift.rotation.x = -.05 * over - .16 * up;
  }
});

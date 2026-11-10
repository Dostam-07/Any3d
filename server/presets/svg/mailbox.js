/* mailbox · a mini.
   A letterbox on a post, door open, nothing inside. The flag rests down; now
   and then it lifts as if to check, finds nothing, and settles. The box is
   painted with pal.accent, so a brand colour or a swatch recolours it. */
Any3d.figure({
  name: 'mailbox',
  size: 'mini',
  means: 'An open letterbox with nothing inside. The flag lifts now and then to check, and settles again.',
  hint: 'Wait for the flag to check.',
  title: 'Mailbox',
  still: 1,
  build: function (o) {
    var D = o.D, pal = o.pal;
    D.slab(3, 3, pal.grass, 0, 0, 0, null, { h: .5, r: .45, side: pal.base });
    for (var i = 0; i < 5; i++) D.box(.05, .5, .1, pal.paper, -1.1, .3, -1.1 + i * .28, null);
    D.box(.04, .05, 1.3, pal.paper, -1.1, .42, -.55, null);
    [[-.7, .95], [-.35, 1.1]].forEach(function (p) { D.box(.3, .04, .22, pal.cloud, p[0], .07, p[1], null, { shadow: false }); });

    var post = D.group(.15, 0, -.1);
    D.cyl(.07, .09, 1.1, pal.wood, 0, .55, 0, post, 8);
    D.box(.5, .06, .5, pal.wood, 0, 1.12, 0, post);
    var body = D.group(0, 1.15, 0, post);
    D.box(.95, .5, .6, pal.accent, 0, .25, 0, body);
    var top = D.cyl(.3, .3, .95, pal.accent, 0, .5, 0, body, 18); top.rotation.z = Math.PI / 2;
    D.box(.86, .42, .5, pal.ink, .06, .25, 0, body);
    var door = D.group(-.475, .02, 0, body);
    D.box(.04, .5, .58, pal.cloud, 0, .25, 0, door);
    D.box(.02, .06, .18, pal.ink, -.02, .4, 0, door);
    var flag = D.group(.1, .5, .32, body);
    D.cyl(.02, .02, .36, pal.ink, 0, -.18, 0, flag, 6);
    D.box(.26, .16, .03, pal.mustard, .1, .02, 0, flag);
    flag.rotation.z = .2;

    D.props.bush(-.95, -.8, null, { r: .3 });
    D.props.tree(1.0, -.8, null, { r: .42, yaw: .8 });
    D.props.rock(1.05, .55, null, { r: .18 });
    return { door: door, flag: flag };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    p.door.rotation.z = 1.9 + .06 * D.wave(t, 3.2);
    var check = D.smooth(D.pulse(t, 7, .36));
    p.flag.rotation.z = D.lerp(.2, 1.45, check) + .04 * D.wave(t, 1.3);
  }
});

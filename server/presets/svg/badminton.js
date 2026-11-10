/* badminton · a card at day.
   Two badminton players on a grass court with nets, rackets, and a shuttlecock mid-rally.
   The players bounce on their feet and swing rackets in a loop. Hover a player to highlight. */
Any3d.figure({
  name: 'badminton',
  size: 'card',
  theme: 'toy',
  title: 'Badminton Court',
  means: 'Two badminton players rally on a grass court under bright sky; nets and rackets, shuttlecock in flight.',
  hint: 'Hover a player to highlight them during the rally.',
  camera: { az: 38, el: 33, pad: 1.0 },
  still: 2,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(11, 9, pal.ground, 0, 0, 0, null, { h: .6, r: 1.2, side: pal.base });
    D.box(8, .04, 7, pal.leaf, .2, .05, .2, null, { shadow: false });
    D.box(7.8, .02, 6.8, pal.leafDark, 0, .06, 0, null, { shadow: false });
    [[-3.4, 3.4], [4.2, 3.4], [4.4, -3.2], [-3.2, -3.2]].forEach(function (p) { D.props.lamp(p[0], p[1], null, { h: 2.6 }); });
    var net = D.group(0, 0, 0); net.name = 'net'; hot.push(net);
    D.box(.04, 1.1, 7.2, pal.cloud, 0, .6, 0, net);
    D.box(.04, .06, 7.2, pal.accent, 0, 1.2, 0, net);
    var player1 = D.group(-3.2, 0, 2.0); player1.name = 'player 1'; hot.push(player1);
    D.props.person(-3.2, 2.0, null, { shirt: pal.coral, hat: pal.paper, yaw: .3 });
    D.box(.06, .3, .06, pal.steel, -3.0, 1.5, 2.2, player1);
    D.box(.5, .05, .4, pal.ink, -2.6, 1.6, 2.2, player1);
    var player2 = D.group(3.2, 0, -2.0); player2.name = 'player 2'; hot.push(player2);
    D.props.person(3.2, -2.0, null, { shirt: pal.mustard, hat: pal.cloud, yaw: -.3 });
    D.box(.06, .3, .06, pal.steel, 3.0, 1.5, -2.2, player2);
    D.box(.5, .05, .4, pal.ink, 2.6, 1.6, -2.2, player2);
    D.props.bush(-4.6, -3.4, null, { r: .3 });
    D.props.bush(4.6, 3.4, null, { r: .28 });
    D.props.rock(-4.0, -2.6, null, { r: .25 });
    var shuttle = D.ball(.12, pal.cloud, 0, 1.0, 0, null); shuttle.name = 'shuttle'; hot.push(shuttle);
    D.cone(.08, .25, pal.coral, 0, .9, 0, null, 8);
    return { hot: hot, net: net, player1: player1, player2: player2, shuttle: shuttle };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    var W = D.phase(t, 4);
    if (p.player1) {
      p.player1.position.y = .05 * Math.abs(D.wave(t, 1.0));
      p.player1.rotation.y = D.wave(t, 2.0) * .2;
    }
    if (p.player2) {
      p.player2.position.y = .05 * Math.abs(D.wave(t, 1.2));
      p.player2.rotation.y = D.wave(t, 2.2) * .2;
    }
    if (p.shuttle) {
      var h = D.smooth(W) * 2.5 - 1.2;
      p.shuttle.position.set(Math.sin(W * 3) * 2.8, 1.0 + h, Math.cos(W * 3) * 1.5);
      p.shuttle.rotation.z = t * 3;
    }
    ctx.read = W < .5 ? 'player 1 serves' : 'player 2 returns';
  }
});
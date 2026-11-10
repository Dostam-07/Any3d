/* A flower stall on a paved corner: the florist ties a bouquet under a striped
   awning while a customer waits; the valance and a pennant move in the wind. */
Pixel.scene({
  name: 'flower-stall',
  title: 'The flower stall',
  means: 'A florist ties a bouquet at a corner stall while a customer waits; the awning and the pennant move in the wind.',
  hint: 'Hover the stall, the florist or the customer; tap the customer to wave.',
  width: 320, height: 240, duration: 4.8, still: 1.1, fps: 24,
  camera: { az: 45, el: 30, height: 2.6 },
  sun: { az: -55, el: 46, ambient: .34 },
  ground: {
    rx: 4.3, rz: 3.6, wobble: .45, fade: .5,
    zone: function (x, z, P) {
      var d = Math.sqrt(x * x / 9.5 + z * z / 6.2) + (P.fbm(x * .7, z * .7) - .5) * .5;
      if (d < 1) return 'paving';
      if (Math.abs(x + z * .35 - 2.3) < .32 + (P.noise(x * 2, z * 2) - .5) * .2 && z > 0) return 'dirt';
      return 'grass';
    }
  },
  materials: {
    awning: { ramp: ['#7e3a35', '#9c4a40', '#b85e4c', '#cf7a5f', '#e2997b'], tex: 'cloth', stripe: .2, grain: 'x', alt: ['#8f8a78', '#b1ac97', '#d0cbb4', '#e6e2cf', '#f5f2e4'] },
    bucket: { ramp: ['#4a5258', '#626b70', '#7d868a', '#9aa2a4', '#bcc2c2'], tex: 'plain' },
    counter: { ramp: 'wood', tex: 'wood', grain: 'y', plank: .16 },
    top: { ramp: 'wood', tex: 'wood', grain: 'x', plank: .12 }
  },
  build: function (P) {
    var parts = { heads: [] };
    var heads = ['#d7756f', '#e9c65a', '#f1e6d2', '#b07fb3', '#e48e5a'];
    var stall = P.group(-.2, 0, -.6); stall.name = 'stall · cut flowers';
    /* counter: vertical boards, a top, posts */
    P.box(2.2, .6, .7, 'counter', 0, .3, 0, stall);
    P.box(2.36, .06, .84, 'top', 0, .63, 0, stall);
    [-1.08, 1.08].forEach(function (x) { [-.38, .38].forEach(function (z) { P.box(.07, 2.3, .07, 'darkwood', x, 1.15, z, stall); }); });
    /* awning: a sloped striped plane and a valance of flaps that sway */
    var aw = P.group(0, 2.3, 0, stall);
    P.box(2.5, .04, 1.05, 'awning', 0, 0, -.05, aw).rotation.x = .22;
    parts.flaps = [];
    for (var i = 0; i < 10; i++) { var f = P.group(-1.125 + i * .25, -.1, .47, aw); P.box(.24, .2, .03, 'awning', 0, -.1, 0, f); parts.flaps.push(f); }
    /* buckets of tight flower heads */
    function bucket(x, y, z, col, n) {
      var g = P.group(x, y, z, stall), heads2 = P.group(0, 0, 0, g);
      P.cyl(.13, .11, .24, 'bucket', 0, .12, 0, g, 8);
      P.ball(.1, 'leaf', 0, .3, 0, g, 6);
      for (var k = 0; k < n; k++) {
        var a = k / n * P.TAU, r = k ? .075 : 0;
        P.box(.014, .2, .014, '#4f6b3a', Math.cos(a) * r, .3, Math.sin(a) * r, heads2);
        P.box(.08, .07, .08, col, Math.cos(a) * r, .42 + (k % 2) * .04, Math.sin(a) * r, heads2);
      }
      parts.heads.push(heads2); return g;
    }
    bucket(-.95, .66, .1, heads[0], 6); bucket(.55, .66, .12, heads[1], 6); bucket(.88, .66, -.12, heads[3], 6);
    P.box(2.1, .22, .4, 'wood', 0, .11, .62, stall);
    for (var j = 0; j < 5; j++) bucket(-.84 + j * .42, .22, .62, heads[(j + 2) % 5], 5);
    P.cyl(.05, .05, .5, '#e6dcc2', .1, .69, .2, stall, 8).rotation.z = Math.PI / 2;
    P.cyl(.05, .05, .06, '#c2a46a', .55, .69, .15, stall, 8);
    /* the florist behind the counter, holding the bouquet in front of her */
    var fl = P.person(-.75, -1.2, null, { shirt: '#6f8a7a', pants: '#3a3f4a', hair: '#5a3a26', skin: '#e2b08c' });
    fl.root.name = 'florist · tying a bouquet';
    P.box(.26, .34, .02, '#d9cfb6', 0, .12, .085, fl.body);
    var bq = P.group(0, .1, .3, fl.body); parts.bq = bq;
    P.cone(.09, .3, '#e8dfc8', 0, -.04, 0, bq, 6).rotation.x = Math.PI;
    for (var b = 0; b < 6; b++) { var ang = b / 6 * P.TAU; P.box(.075, .07, .075, heads[b % 3 ? 0 : 4], Math.cos(ang) * .07, .15, Math.sin(ang) * .07, bq); }
    P.box(.08, .08, .08, heads[1], 0, .19, 0, bq);
    parts.fl = fl;
    /* the customer, a paper bag in one hand */
    var cu = P.person(1.7, .35, null, { shirt: '#c99a4f', pants: '#4b5568', hair: '#2b211c', skin: '#b98260', yaw: -1.25 });
    cu.root.name = 'customer · waiting';
    P.box(.18, .22, .12, '#d6c7a0', 0, -.13, 0, cu.handL);
    parts.cu = cu;
    /* pennant on a pole: five linked segments */
    var pole = P.group(1.95, 0, -1.45);
    P.cyl(.035, .045, 2.6, 'darkwood', 0, 1.3, 0, pole, 6);
    parts.pen = []; var prev = P.group(0, 2.45, 0, pole);
    for (var s = 0; s < 5; s++) { var seg = P.group(s ? .16 : .02, 0, 0, prev); P.box(.16, .3 - s * .05, .02, s % 2 ? '#e2c15a' : '#d9a441', .08, -.15 + s * .025, 0, seg); parts.pen.push(seg); prev = seg; }
    /* corner life: a bench, a tree, flowering pots, crates, stones */
    var bench = P.group(-2.6, 0, .9); bench.rotation.y = .5;
    P.box(1.2, .06, .38, 'top', 0, .42, 0, bench); P.box(1.2, .3, .05, 'top', 0, .66, -.18, bench);
    [-.5, .5].forEach(function (x) { P.box(.06, .42, .34, '#3c4148', x, .21, 0, bench); });
    P.tree(-2.8, -1.6, null, { r: .8, h: 1.2 });
    [[2.3, -.2, heads[0]], [2.65, .3, heads[2]], [-1.7, 1.9, heads[1]]].forEach(function (p) {
      var g = P.group(p[0], 0, p[1]); P.cyl(.2, .15, .32, '#a8603f', 0, .16, 0, g, 8);
      P.bush(0, 0, g, { r: .3, flowers: p[2] }).position.y = .26;
    });
    P.box(.5, .36, .4, 'wood', 1.45, .18, -.95); P.box(.42, .3, .34, 'wood', 1.5, .51, -.98).rotation.y = .3;
    P.bush(3.3, -.9, null, { r: .32 }); P.bush(-.6, 2.9, null, { r: .28, mat: 'leafLight' });
    [[3.2, -1.6], [-3.4, .6], [.6, 2.9], [-1.2, -2.8]].forEach(function (p, k) { P.ball(.18 + k * .03, 'stone', p[0], .05, p[1], null, 6).scale.y = .55; });
    parts.hot = [stall, fl.root, cu.root];
    return parts;
  },
  tick: function (c) {
    var t = c.t, q = c.q, p = c.parts, P = c.P, TAU = P.TAU;
    var tie = Math.sin(q * TAU * 2), turn = Math.sin(q * TAU);
    /* florist: holds the bouquet, the right hand ties the stems twice a loop, the head follows */
    P.pose(p.fl, 'hold');
    p.fl.body.rotation.y = .15 * turn; p.fl.head.rotation.x = .35 + .08 * tie; p.fl.head.rotation.y = .12 * turn;
    p.fl.elbowR.rotation.x = -1.25 + .35 * Math.max(0, tie); p.fl.armR.rotation.y = .3 * tie;
    p.bq.rotation.y = .5 * turn; p.bq.rotation.z = .1 * tie;
    /* customer: a bag in the left hand, weight shifting; a tap makes them wave for two seconds */
    var waving = c.pressed === p.cu.root && t - c.pressedAt < 2;
    P.pose(p.cu, waving ? 'wave' : 'carry');
    p.cu.elbowL.rotation.x = -.15; p.cu.armL.rotation.x = .05;
    if (waving) p.cu.elbowR.rotation.z = .4 + .4 * Math.sin(t * 14);
    p.cu.body.rotation.z = .04 * Math.sin(q * TAU); p.cu.head.rotation.y = .25 * Math.sin(q * TAU + 1);
    /* hover the stall: the flower heads lift a little */
    p.heads.forEach(function (h, i) { h.position.y = c.hover && c.hover.name && c.hover.name.indexOf('stall') === 0 ? .04 + .02 * Math.sin(t * 8 + i) : 0; });
    /* wind */
    p.flaps.forEach(function (f, i) { f.rotation.x = -.25 * (.5 + .5 * Math.sin(q * TAU * 2 - i * .55)); });
    p.pen.forEach(function (s, i) { s.rotation.y = .2 * Math.sin(q * TAU * 2 - i * .9) * (i ? 1 : .4); });
    c.read = waving ? 'customer · waving' : tie > .3 ? 'florist · tying the stems' : 'florist · turning the bouquet';
  }
});

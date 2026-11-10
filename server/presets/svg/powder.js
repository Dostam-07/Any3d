/* powder · a hero: a small ski village at the foot of a snowy mountain.
   A chairlift climbs the slope with its chairs on a loop; two skiers ride it
   up, get off at the top and ski back down in turns to board again. A ski
   class snakes round the nursery field, the shuttle bus laps the village and
   waits at the lift, a skater circles the pond, chimneys smoke and the
   square's tree twinkles. The pointer lifts what it rests on. */
Any3d.figure({
  name: 'powder',
  size: 'hero',
  title: 'Powder',
  means: 'Chairs climb the slope, two skiers ride up and carve back down, a ski class snakes the nursery and the shuttle waits at the lift.',
  hint: 'Hover a chalet, the hotel, the lift station, the ski school or the shuttle.',
  camera: { az: 32, el: 33, pad: 1.0 },
  still: 14,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];
    D.slab(46, 32, pal.ground, 0, 0, 0, null, { h: .9, r: 3, side: pal.base });

    /* the mountain: a cone of snow, a taller peak behind, rocks and pines on its flanks */
    var C = [-9, -5], R = 10, H = 8, aU = Math.atan2(-.6, .8), ux = .8, uz = .6, px = -.6, pz = .8;
    function hgt(x, z) { var d = Math.hypot(x - C[0], z - C[1]); return d < R ? H * (1 - d / R) : 0; }
    function W(lx, lz) { return [C[0] + lx * ux + lz * px, C[1] + lx * uz + lz * pz]; }     /* lift frame → world */
    function P(d, a) { return [d * Math.cos(a), d * Math.sin(a)]; }                           /* polar in the lift frame */
    D.cone(R, H, pal.paper, C[0], H / 2, C[1], null, 40).userData.terrain = true;   /* the slope things ride up: not a clash */
    D.cone(5.6, 10.5, pal.mist, -15.6, 5.25, -10.2, null, 28); D.cone(2.35, 4.4, pal.paper, -15.6, 8.5, -10.2, null, 28);
    [[6.2, -.9, .6], [7.4, 1.7, .5], [4.2, -1.3, .45], [8.8, -1.6, .55]].forEach(function (q, k) { var p = W.apply(null, P(q[0], q[1])), r = D.props.rock(p[0], p[1], null, { r: q[2], yaw: k }); r.position.y = hgt(p[0], p[1]) - .1; });
    [[8.4, -.75], [9.2, -.55], [7.6, -1.25], [9.4, -1.05], [6.4, -1.5], [8.6, 1.45], [9.3, 1.62], [7.6, 1.85], [9.5, 1.95], [5.4, 2.2]].forEach(function (q, k) {
      var p = W.apply(null, P(q[0], q[1])), tr = D.props.tree(p[0], p[1], null, { r: .5 + (k % 3) * .12, kind: 'pine', yaw: k }); tr.position.y = hgt(p[0], p[1]) - .05;
    });

    [[3.4, .28], [5, .26], [6.6, .3], [8.2, .32], [9.6, .36], [3.6, 1.3], [5.2, 1.36], [6.8, 1.34], [8.4, 1.38], [9.8, 1.3]].forEach(function (q) { var p = W.apply(null, P(q[0], q[1])); D.cyl(.05, .05, .8, pal.coral, p[0], hgt(p[0], p[1]) + .35, p[1], null, 6); });
    [[2.6, -1.2, .7], [3.4, 2.2, .6], [1.6, 2.8, .5], [4.4, -2.0, .8]].forEach(function (q, k) { var p = W.apply(null, P(q[0], q[1])), r = D.props.rock(p[0], p[1], null, { r: q[2], h: q[2] * 1.2, yaw: k * 2 }); r.position.y = hgt(p[0], p[1]) - .15; });
    /* the chairlift, built in its own frame: x runs down the fall line, z across it */
    var lift = D.group(C[0], 0, C[1]); lift.rotation.y = aU;
    var xT = 2.4, xB = 12, yB = 2.05, yT = H * (1 - xT / R) + yB, Lc = Math.hypot(xB - xT, yT - yB), rr = .7, L = 2 * Lc + 2 * Math.PI * rr;
    [-rr, rr].forEach(function (z) { var c = D.box(Lc, .04, .04, pal.ink, (xT + xB) / 2, (yT + yB) / 2, z, lift, { shadow: false }); c.rotation.z = -Math.atan2(yT - yB, xB - xT); });
    [5.4, 8.7].forEach(function (x) {
      var base = H * (1 - x / R), top = yB + (yT - yB) * (xB - x) / (xB - xT) + .2;
      D.cyl(.12, .18, top + .15 - base, pal.steel, x, (top + .15 + base) / 2, 0, lift, 10); D.box(.24, .18, 2.0, pal.ink, x, top + .15, 0, lift);
      D.cyl(.12, .12, .1, pal.slate, x, top + .27, -rr, lift, 10); D.cyl(.12, .12, .1, pal.slate, x, top + .27, rr, lift, 10);
    });
    var top = D.group(xT, H * (1 - xT / R) - .45, 0, lift);
    D.box(1.9, .3, 1.8, pal.mist, -.55, -.1, 0, top); D.box(1.6, 1.6, 1.4, pal.wood, -.3, .9, -2.3, top); D.wedge(1.9, .7, 1.8, pal.accent, -.3, 1.7, -2.3, top);
    D.cyl(.12, .12, yB + .65, pal.steel, 0, (yB + .65) / 2, 0, top, 8); D.cyl(.8, .8, .12, pal.accent, 0, yB + .45, 0, top, 20);
    var station = D.group(xB, 0, 0, lift); station.name = 'lift station'; hot.push(station);
    D.box(3.4, .12, 3.2, pal.mist, .3, .06, 0, station); D.box(1.2, 2.0, 2.2, pal.wood, 1.75, 1.3, 0, station); D.wedge(1.6, .8, 2.6, pal.accent, 1.75, 2.3, 0, station);
    D.box(.06, .5, .7, pal.mustard, 1.13, 1.5, 0, station, { mat: { emissive: pal.lampGlow, emissiveIntensity: .6 }, shadow: false });
    [[-.9, -1.2], [-.9, 1.2], [.9, -1.2], [.9, 1.2]].forEach(function (q) { D.cyl(.07, .07, 2.6, pal.steel, q[0], 1.45, q[1], station, 8); });
    D.box(2.4, .22, 3.0, pal.accent, 0, 2.85, 0, station); D.cyl(.8, .8, .12, pal.ink, 0, yB + .2, 0, station, 20);
    var chairs = [];
    for (var k = 0; k < 8; k++) {
      var ch = D.group(0, 0, 0, lift);
      D.cyl(.025, .025, 1.3, pal.ink, 0, -.65, 0, ch, 6); D.box(.5, .08, .9, pal.accent, .02, -1.3, 0, ch); D.box(.08, .45, .9, pal.accent, -.22, -1.08, 0, ch); D.box(.06, .05, .9, pal.ink, .32, -1.7, 0, ch, { shadow: false });
      chairs.push(ch);
    }
    function onLoop(s, o) {       /* a place on the rope: up side, top wheel, down side, bottom wheel */
      s = ((s % L) + L) % L; var f, a;
      if (s < Lc) { f = s / Lc; o.x = xB - (xB - xT) * f; o.z = rr; o.y = yB + (yT - yB) * f; o.yaw = Math.PI; }
      else if (s < Lc + Math.PI * rr) { a = (s - Lc) / rr; o.x = xT - rr * Math.sin(a); o.z = rr * Math.cos(a); o.y = yT; o.yaw = Math.PI - a; }
      else if (s < 2 * Lc + Math.PI * rr) { f = (s - Lc - Math.PI * rr) / Lc; o.x = xT + (xB - xT) * f; o.z = -rr; o.y = yT - (yT - yB) * f; o.yaw = 0; }
      else { a = (s - 2 * Lc - Math.PI * rr) / rr; o.x = xB + rr * Math.sin(a); o.z = -rr * Math.cos(a); o.y = yB; o.yaw = -a; }
      return o;
    }

    /* skiers: ride up, step off, carve down in turns, queue, board the next chair */
    function skier(shirt, hat, sc) {
      var g = D.group(0, 0, 0);
      var man = D.props.person(0, 0, g, { shirt: shirt, hat: hat }); man.scale.setScalar(sc || 1);
      [-.11, .11].forEach(function (z) { D.box(1.0 * (sc || 1), .03, .08, pal.ink, .06, .03, z * (sc || 1), g, { shadow: false }); });
      return g;
    }
    function run(pts) { var q = [W(xT, rr)]; pts.forEach(function (p) { q.push(W.apply(null, P(p[0], p[1]))); }); q.push(W(xB, 3.4), W(xB, 1.9), W(xB, rr)); return D.path(q, false, .6); }
    var skiers = [
      { g: skier(pal.mustard, pal.coral), p: run([[3.8, .5], [4.9, .95], [6.4, .55], [7.9, 1.0], [9.4, .62], [10.6, .78]]), off: 0 },
      { g: skier(pal.plum, pal.paper), p: run([[4.0, .38], [5.2, 1.1], [6.8, .7], [8.4, 1.15], [9.8, .8], [10.9, .98]]), off: .5 }
    ];
    skiers.forEach(function (s) { s.q = s.p.length - (2.3 - rr); });
    /* a rider on the chairs going up between the skiers, always aboard */
    var riders = [skier(pal.teal, pal.mustard), skier(pal.rose, false)];

    /* the nursery: a field of cones, the ski school hut with its flag, a class in a line */
    D.box(10.5, .03, 5.4, pal.cloud, -13.2, .03, 10.8, null, { shadow: false });
    [[-15.5, 10.7], [-13, 10.9], [-10.5, 10.6]].forEach(function (q) { D.props.cone(q[0], q[1]); });
    var school = D.group(-19.6, 0, 7.6); school.name = 'ski school'; hot.push(school);
    D.box(2.4, 1.6, 2.0, pal.wood, 0, .8, 0, school); D.wedge(2.8, 1.0, 2.5, pal.mustard, 0, 1.6, 0, school); D.wedge(2.6, .95, 2.3, pal.paper, 0, 1.72, 0, school);
    D.box(.06, .9, .6, pal.ink, 1.22, .45, .3, school, { shadow: false }); D.box(.06, .45, .5, pal.mustard, 1.22, 1.05, -.5, school, { mat: { emissive: pal.lampGlow, emissiveIntensity: .6 }, shadow: false });
    var flag = D.props.flag(1.6, 1.4, school, { h: 2.6, color: pal.coral });
    var oval = D.path([[-17.3, 9.2], [-9, 9.2], [-9, 12.4], [-17.3, 12.4]], true, 1.5);
    var klass = [skier(pal.coral, pal.mustard)].concat([pal.teal, pal.sky, pal.rose].map(function (c) { return skier(c, pal.paper, .62); }));

    /* the pond and its skater, a snowman */
    D.cyl(2.5, 2.5, .06, pal.mist, -2.4, .04, 11.2, null, 30); D.cyl(2.3, 2.3, .05, pal.sky, -2.4, .08, 11.2, null, 30);
    var skater = skier(pal.coral, pal.ink); skater.children[1].visible = skater.children[2].visible = false;
    var snowman = D.group(1.6, 0, 13.4); D.ball(.5, pal.paper, 0, .45, 0, snowman); D.ball(.35, pal.paper, 0, 1.1, 0, snowman); D.ball(.24, pal.paper, 0, 1.55, 0, snowman);
    D.cone(.06, .3, pal.coral, .3, 1.55, 0, snowman, 8).rotation.z = -Math.PI / 2; D.cyl(.2, .2, .22, pal.ink, 0, 1.82, 0, snowman, 12);

    /* the village: a loop road, chalets with snow on their roofs and lit windows, the hotel, the chapel */
    var ROAD = pal.mist;
    D.box(2.4, .03, 21.6, ROAD, 4.6, .05, .5, null, { shadow: false }); D.box(2.4, .03, 21.6, ROAD, 19.4, .05, .5, null, { shadow: false });
    D.box(17.2, .03, 2.4, ROAD, 12, .05, -10, null, { shadow: false }); D.box(17.2, .03, 2.4, ROAD, 12, .05, 11, null, { shadow: false });
    var lit = { mat: { emissive: pal.lampGlow, emissiveIntensity: .7 }, shadow: false }, smoke = [];
    function chalet(x, z, yaw, roof, w, d, floors, name) {
      var g = D.group(x, 0, z), h = 1.35 * floors; g.rotation.y = yaw;
      D.box(w, .5, d, pal.slate, 0, .25, 0, g);
      if (floors > 1) { D.box(w, 1.35, d, pal.paper, 0, .5 + .675, 0, g); D.box(w + .02, h - 1.35, d + .02, pal.wood, 0, .5 + 1.35 + (h - 1.35) / 2, 0, g); }
      else D.box(w, h, d, pal.wood, 0, .5 + h / 2, 0, g);
      D.wedge(w + .8, 1.4, d + .8, roof, 0, .5 + h, 0, g); D.wedge(w + .5, 1.4, d + .6, pal.paper, 0, .5 + h + .16, 0, g);
      D.box(.06, .9, .6, pal.ink, w / 2 + .02, .95, -d * .25, g, { shadow: false });
      D.box(.06, .55, .5, pal.mustard, w / 2 + .02, 1.1, d * .2, g, lit);
      for (var f = 1; f < floors; f++) { D.box(.06, .5, .45, pal.mustard, w / 2 + .02, .55 + f * 1.35 + .5, -d * .22, g, lit); D.box(.06, .5, .45, pal.mustard, w / 2 + .02, .55 + f * 1.35 + .5, d * .22, g, lit); D.box(.5, .08, d * .8, pal.wood, w / 2 + .25, .5 + f * 1.35, 0, g); }
      D.box(.06, .45, .45, pal.mustard, w / 2 + .02, .55 + h + .35, 0, g, lit);
      for (var wx = -w / 2 + .6; wx < w / 2 - .3; wx += 1.1) D.box(.5, .5, .06, pal.mustard, wx, .5 + h - .7, d / 2 + .02, g, lit);
      D.box(.45, 1.1, .45, pal.slate, -w * .22, .5 + h + 1.1, -d * .18, g);
      var puffs = []; for (var k = 0; k < 3; k++) { var b = D.ball(.22, pal.cloud, -w * .22, .5 + h + 1.9, -d * .18, g); b.castShadow = false; puffs.push(b); } smoke.push({ b: puffs, y: .5 + h + 1.8, off: (x * 7 + z * 3) % 1 });
      g.name = name || 'chalet'; hot.push(g); return g;
    }
    chalet(8, 7.4, 0, pal.terracotta, 2.8, 2.6, 1); chalet(12.4, 7.6, .08, pal.plum, 3, 2.8, 2); chalet(8.3, 1.4, 0, pal.teal, 2.6, 2.4, 2);
    chalet(16.4, .8, -.1, pal.terracotta, 2.6, 2.6, 1); chalet(7.6, -6.2, 0, pal.sage, 2.6, 2.6, 1); chalet(16.6, -6, .05, pal.plum, 2.8, 2.6, 2);
    chalet(11.8, -6, 0, pal.coral, 4.6, 3.2, 3, 'hotel');
    chalet(12.2, 13.6, 0, pal.teal, 2.6, 2.4, 1); chalet(16.6, 13.4, -.06, pal.sage, 2.8, 2.6, 2);
    var chapel = D.group(16.4, 0, 7); chapel.name = 'chapel'; hot.push(chapel);
    D.box(3, 2.2, 2, pal.paper, 0, 1.1, 0, chapel); D.wedge(3.4, 1.1, 2.4, pal.slate, 0, 2.2, 0, chapel); D.wedge(3.2, 1.1, 2.1, pal.paper, 0, 2.34, 0, chapel);
    D.box(1, 2.6, 1, pal.paper, -1.0, 1.3, 0, chapel); D.cone(.8, 1.8, pal.terracotta, -1.0, 3.5, 0, chapel, 4).rotation.y = Math.PI / 4;
    D.box(.06, .9, .5, pal.ink, 1.52, .45, 0, chapel, { shadow: false }); D.box(.06, .5, .3, pal.mustard, -.48, 2.0, 0, chapel, lit);
    /* the square's tree, with lights */
    var twinkle = []; D.props.tree(12.4, 2.6, null, { r: 1, kind: 'pine' });
    [[.55, .7, 0], [-.4, 1.2, .4], [.2, 1.7, -.45], [-.5, .6, -.3], [.35, 2.3, .2], [-.15, 2.6, -.2], [.6, 1.3, .5]].forEach(function (q, k) { var b = D.ball(.1, k % 2 ? pal.coral : pal.mustard, 12.4 + q[0], q[1] + .4, 2.6 + q[2]); b.material = D.mat(k % 2 ? pal.coral : pal.mustard, { emissive: k % 2 ? pal.coral : pal.lampGlow, emissiveIntensity: .8 }).clone(); b.castShadow = false; twinkle.push(b); });
    /* pines round the edge, lamps on the road, a bus shelter */
    [[3, -13.6], [5.2, -14.2], [8.8, -13.2], [11.6, -14], [14.6, -13.4], [17.4, -14.3], [20.6, -12.8], [21.3, -5], [21.4, 4.6], [21, 13.4], [9.2, 13.9], [-6.2, 14.4], [-4.6, 15], [-21, 13.8], [-20.6, 2.6], [-1, -9.8], [1.2, -7.2], [2, -11.5]].forEach(function (q, k) {
      D.props.tree(q[0], q[1], null, { r: .55 + (k % 4) * .1, kind: k % 5 === 2 ? 'round' : 'pine', yaw: k * .7, color: k % 3 ? pal.leafDark : pal.leaf });
    });
    [[6.2, -2.2], [6.2, 4.4], [17.8, -2.4], [12, 9.6]].forEach(function (q) { D.props.lamp(q[0], q[1], null, { h: 2.6 }); });
    var shelter = D.group(2.8, 0, 7.4); D.box(.9, .06, 2.2, pal.steel, 0, 2, 0, shelter); D.box(.08, 2, 2.2, pal.sky, -.42, 1, 0, shelter, { shadow: false }); D.box(.5, .08, 1.6, pal.wood, -.15, .5, 0, shelter);
    D.props.person(-.1, -.5, shelter, { shirt: pal.sage, hat: pal.coral, yaw: 0 });

    /* the shuttle: nose to +x, skis on the roof, waits at the lift */
    var bus = D.group(0, 0, 0), bw = []; bus.name = 'shuttle'; hot.push(bus);
    D.rbox(3.4, 1.4, 1.4, pal.teal, 0, .95, 0, bus, { r: .16 }); D.box(2.9, .45, 1.44, pal.sky, -.1, 1.25, 0, bus, { shadow: false }); D.box(.05, .6, 1.2, pal.ink, 1.72, 1.15, 0, bus, { shadow: false });
    D.box(2.4, .1, 1.1, pal.steel, -.2, 1.72, 0, bus); [-.35, 0, .35].forEach(function (z, k) { D.box(2.6, .05, .1, [pal.mustard, pal.coral, pal.plum][k], -.2, 1.8, z, bus); });
    [1.1, -1.1].forEach(function (x) { [-.7, .7].forEach(function (z) { bw.push(D.wheel(.3, .22, pal.tyre, x, .3, z, bus)); }); });
    var loop = D.path([[4.6, 11], [19.4, 11], [19.4, -10], [4.6, -10]], true, 2.2), stop = 0, best = 1e9;
    for (var s = 0; s < loop.length; s += .05) { var a = loop.at(s), e = Math.abs(a.x - 4.6) + Math.abs(a.z - 6.4); if (e < best) { best = e; stop = s; } }

    var cloud = D.props.cloud(0, 10.5, -13, null, { r: 1.1 });
    return { hot: hot, lift: lift, chairs: chairs, onLoop: onLoop, L: L, Lc: Lc, W: W, hgt: hgt, aU: aU, skiers: skiers, riders: riders, oval: oval, klass: klass, flag: flag, skater: skater, smoke: smoke, twinkle: twinkle, bus: bus, bw: bw, loop: loop, stop: stop, cloud: cloud, o: { x: 0, y: 0, z: 0, yaw: 0 }, lifts: {} };
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t, o = p.o, k, w;
    /* the rope: eight chairs, one every 2 s; a skier's 24 s cycle is twelve chairs, so a chair is always there to board */
    var v = p.L / 16, s0 = v * t;
    for (k = 0; k < 8; k++) { p.onLoop(s0 + k * p.L / 8, o); p.chairs[k].position.set(o.x, o.y, o.z); p.chairs[k].rotation.y = o.yaw; }
    function seat(g, s) { p.onLoop(s, o); w = p.W(o.x, o.z); g.position.set(w[0], o.y - 1.75, w[1]); g.rotation.y = p.aU + o.yaw; }
    var Tup = p.Lc / v;
    p.skiers.forEach(function (sk) {
      var tau = D.phase(t, 24, sk.off) * 24, d;
      if (tau < Tup) { seat(sk.g, v * tau); return; }
      if (tau < 21.4) { var x = D.clamp((tau - Tup - .3) / (21.4 - Tup - .3), 0, 1); d = (.5 * x + .5 * D.inOut(x)) * sk.q; }
      else if (tau < 23.2) d = sk.q;
      else d = sk.q + D.smooth((tau - 23.2) / .8) * (sk.p.length - sk.q);
      D.place(sk.g, sk.p, d); sk.g.position.y = p.hgt(sk.g.position.x, sk.g.position.z) + (tau < Tup + .3 ? .13 * (1 - (tau - Tup) / .3) : 0);
    });
    /* two more riders sit on chairs that are on the way up whenever the skiers are not */
    p.riders.forEach(function (r, i) { var q = (s0 + (3 + i * 4) * p.L / 8) % p.L, up = q < p.Lc; r.visible = up; if (up) seat(r, q); });
    /* the class: instructor first, three children behind, round the nursery */
    var cd = D.phase(t, 22) * p.oval.length;
    p.klass.forEach(function (g, i) { D.place(g, p.oval, (cd - i * 1.1 + p.oval.length) % p.oval.length); g.position.y = i ? .18 * D.smooth(D.pulse(t - i * .25, 9, .08)) : 0; });
    p.flag.cloth.rotation.y = .25 * D.wave(t, 2.1) + .1 * D.wave(t, .7);
    /* the skater circles, leaning in */
    var sa = D.phase(t, 6.5) * Math.PI * 2; p.skater.position.set(-2.4 + 1.5 * Math.cos(sa), .1, 11.2 - 1.5 * Math.sin(sa)); p.skater.rotation.y = sa + Math.PI / 2; p.skater.rotation.x = -.15;
    /* chimneys and the tree */
    p.smoke.forEach(function (c) { c.b.forEach(function (b, i) { var u = D.phase(t, 3.6, c.off + i / 3); b.position.y = c.y + 1.6 * u; b.scale.setScalar(.6 + 1.1 * u * (1 - u) * 2); }); });
    p.twinkle.forEach(function (b, i) { b.material.emissiveIntensity = .25 + .75 * (D.phase(t, 1.6, i * .37) < .5 ? 1 : 0); });
    /* the shuttle: waits six seconds at the lift, then a lap of the village */
    var T = D.phase(t - 11, 34) * 34, bd = p.stop + (T < 6 ? 0 : D.inOut((T - 6) / 28) * p.loop.length);
    bd = bd % p.loop.length; D.place(p.bus, p.loop, bd); D.spin(p.bw, bd, .3);
    p.cloud.position.x = -26 + 52 * D.phase(t, 70);
    p.hot.forEach(function (g) { var s = p.lifts[g.id] || (p.lifts[g.id] = D.spring(120, 18)); s.t = ctx.hover === g ? .35 : 0; s.step(ctx.dt); g.position.y = (g.userData.y0 == null ? (g.userData.y0 = g.position.y) : g.userData.y0) + s.x; });
  }
});

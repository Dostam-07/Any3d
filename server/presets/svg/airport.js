/* airport · a hero: an airport runway and terminal apron at work.
   A twin-engine jetliner taxies along the yellow centreline with turning
   landing gear, approach lights blink along the threshold, a radar dome
   rotates atop the control tower, and a baggage tug shuttles cargo.
   Hover the plane, the tower or the baggage train to inspect. */
Any3d.figure({
  name: 'airport',
  size: 'hero',
  title: 'Terminal Runway',
  means: 'A jetliner taxies along the runway, a radar dish sweeps atop the control tower, and a baggage tug loops the apron.',
  hint: 'Hover the plane, the control tower, or the baggage tug.',
  camera: { az: 38, el: 34, pad: 1.05 },
  still: 4.2,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];

    /* 1. Base foundation slab */
    D.slab(38, 25, pal.ground, 0, 0, 0, null, { h: .7, r: 2.2, side: pal.base });

    /* 2. Runway tarmac & taxiway apron */
    D.box(34, .04, 9, pal.asphalt, 0, .52, -5, null, { shadow: false });
    D.box(20, .04, 7, pal.asphalt, 6, .52, 6, null, { shadow: false });

    // Runway threshold piano keys (white stripes)
    for (var k = -3.2; k <= 3.2; k += .9) {
      D.box(2.4, .015, .45, pal.paper, -15, .545, -5 + k, null, { shadow: false });
      D.box(2.4, .015, .45, pal.paper, 15, .545, -5 + k, null, { shadow: false });
    }

    // Yellow centreline dashes
    for (var x = -11; x <= 11; x += 3.2) {
      D.box(1.8, .015, .2, pal.mustard, x, .545, -5, null, { shadow: false });
    }

    // Runway blue edge taxiway lights
    var lights = [];
    for (var lx = -14; lx <= 14; lx += 4) {
      var l1 = D.cyl(.08, .08, .35, pal.sky, lx, .68, -9.6, null, 8);
      var l2 = D.cyl(.08, .08, .35, pal.sky, lx, .68, -.4, null, 8);
      lights.push(l1); lights.push(l2);
    }

    /* 3. Control Tower */
    var tower = D.group(-12, .5, 5.5);
    tower.name = 'control tower';
    hot.push(tower);

    // Tower base and shaft
    D.box(4.2, 1.2, 4.2, pal.paper, 0, .6, 0, tower);
    D.cyl(1.3, 1.1, 7.5, pal.cloud, 0, 4.8, 0, tower, 12);

    // Observation cab with panoramic windows
    var cab = D.group(0, 8.8, 0, tower);
    D.cyl(2.2, 1.6, 1.4, pal.paper, 0, 0, 0, cab, 12);
    D.cyl(2.35, 2.35, .8, pal.sky, 0, .4, 0, cab, 12);
    D.cyl(2.5, 2.1, .4, pal.steel, 0, .9, 0, cab, 12);

    // Rotating Radar Mast
    var radar = D.group(0, 1.5, 0, cab);
    D.cyl(.08, .08, 1.2, pal.ink, 0, .6, 0, radar, 8);
    var dish = D.wedge(.4, 1.8, .3, pal.coral, 0, 1.3, 0, radar);
    dish.rotation.z = Math.PI / 4;

    /* 4. The Twin-Engine Jet Airplane */
    var plane = D.group(4, .5, -5);
    plane.name = 'jetliner';
    hot.push(plane);

    // Fuselage
    var body = D.group(0, 1.4, 0, plane);
    var fus = D.cyl(.85, .85, 7.2, pal.paper, 0, 0, 0, body, 12);
    fus.rotation.x = Math.PI / 2;
    var nose = D.cone(.85, 1.6, pal.paper, 0, 0, 4.4, body, 12);
    nose.rotation.x = Math.PI / 2;
    var cockpit = D.box(.9, .3, .6, pal.ink, 0, .45, 3.8, body, { shadow: false });

    // Main Wings
    var wingL = D.box(4.6, .12, 1.6, pal.paper, -2.6, -.1, .2, body);
    wingL.rotation.y = -.25;
    var wingR = D.box(4.6, .12, 1.6, pal.paper, 2.6, -.1, .2, body);
    wingR.rotation.y = .25;

    // Wingtip hazard markers
    D.box(.2, .4, .6, pal.coral, -4.8, .1, -.4, body);
    D.box(.2, .4, .6, pal.coral, 4.8, .1, -.4, body);

    // Jet Engines under wings
    var engL = D.cyl(.42, .42, 1.6, pal.steel, -2.1, -.6, .3, body, 10);
    engL.rotation.x = Math.PI / 2;
    var engR = D.cyl(.42, .42, 1.6, pal.steel, 2.1, -.6, .3, body, 10);
    engR.rotation.x = Math.PI / 2;

    // Tail Fin and Horizontal Stabilizers
    var tail = D.box(.14, 1.8, 1.4, pal.accent, 0, 1.2, -3.2, body);
    tail.rotation.x = -.35;
    var stabL = D.box(1.8, .08, .8, pal.paper, -1.1, .3, -3.4, body);
    var stabR = D.box(1.8, .08, .8, pal.paper, 1.1, .3, -3.4, body);

    // Landing Gear
    var gearF = D.group(0, -.85, 3.2, body);
    D.cyl(.05, .05, .8, pal.steel, 0, .4, 0, gearF);
    D.wheel(.24, .12, pal.tyre, 0, .12, 0, gearF);

    var gearL = D.group(-1.8, -.85, 0, body);
    D.cyl(.06, .06, .8, pal.steel, 0, .4, 0, gearL);
    D.wheel(.28, .14, pal.tyre, -.1, .14, 0, gearL);

    var gearR = D.group(1.8, -.85, 0, body);
    D.cyl(.06, .06, .8, pal.steel, 0, .4, 0, gearR);
    D.wheel(.28, .14, pal.tyre, .1, .14, 0, gearR);

    /* 5. Baggage Tug & Luggage Trailers */
    var tug = D.group(2, .5, 7.5);
    tug.name = 'baggage tug';
    hot.push(tug);

    // Tug tractor
    D.rbox(1.4, .7, .9, pal.mustard, 0, .45, 0, tug, { r: .1 });
    D.box(.6, .45, .8, pal.paper, .1, .85, 0, tug);
    D.box(.5, .3, .72, pal.sky, .15, .85, 0, tug, { shadow: false });
    D.wheel(.22, .1, pal.tyre, -.45, .22, .48, tug);
    D.wheel(.22, .1, pal.tyre, .45, .22, .48, tug);
    D.wheel(.22, .1, pal.tyre, -.45, .22, -.48, tug);
    D.wheel(.22, .1, pal.tyre, .45, .22, -.48, tug);

    // Trailer 1 with luggage boxes
    var cart1 = D.group(-1.8, 0, 0, tug);
    D.box(1.2, .2, .8, pal.steel, 0, .25, 0, cart1);
    D.wheel(.18, .08, pal.tyre, -.4, .18, .42, cart1);
    D.wheel(.18, .08, pal.tyre, .4, .18, .42, cart1);
    D.wheel(.18, .08, pal.tyre, -.4, .18, -.42, cart1);
    D.wheel(.18, .08, pal.tyre, .4, .18, -.42, cart1);
    D.box(.45, .35, .35, pal.coral, -.2, .5, .1, cart1);
    D.box(.4, .3, .3, pal.teal, .25, .48, -.1, cart1);

    // Trailer 2
    var cart2 = D.group(-3.4, 0, 0, tug);
    D.box(1.2, .2, .8, pal.steel, 0, .25, 0, cart2);
    D.wheel(.18, .08, pal.tyre, -.4, .18, .42, cart2);
    D.wheel(.18, .08, pal.tyre, .4, .18, .42, cart2);
    D.wheel(.18, .08, pal.tyre, -.4, .18, -.42, cart2);
    D.wheel(.18, .08, pal.tyre, .4, .18, -.42, cart2);
    D.box(.5, .38, .38, pal.plum, 0, .52, 0, cart2);

    /* 6. Windsock */
    var sockPole = D.cyl(.04, .04, 3.2, pal.steel, 14, 2.1, 7.5, null, 8);
    var sock = D.cone(.25, .8, pal.coral, 14.3, 3.6, 7.5, null, 8);
    sock.rotation.z = Math.PI / 2.2;

    return {
      hot: hot,
      radar: radar,
      plane: plane,
      tug: tug,
      sock: sock,
      lights: lights
    };
  },
  tick: function (ctx) {
    var p = ctx.parts, t = ctx.t;

    // 1. Radar sweeps 360 degrees
    if (p.radar) p.radar.rotation.y = t * 2.8;

    // 2. Jet taxi motion along runway
    if (p.plane) {
      var lap = Any3d.phase(t, 10);
      // Accelerate, roll down runway, then taxi back
      if (lap < .4) {
        var u = lap / .4;
        p.plane.position.x = -10 + u * 24;
        p.plane.position.z = -5;
        p.plane.rotation.y = 0;
      } else if (lap < .5) {
        var u = (lap - .4) / .1;
        p.plane.position.x = 14 - u * 4;
        p.plane.position.z = -5 + u * 6;
        p.plane.rotation.y = u * Math.PI / 2;
      } else if (lap < .85) {
        var u = (lap - .5) / .35;
        p.plane.position.x = 10 - u * 18;
        p.plane.position.z = 1;
        p.plane.rotation.y = Math.PI;
      } else {
        var u = (lap - .85) / .15;
        p.plane.position.x = -8 - (1 - u) * 2;
        p.plane.position.z = 1 - u * 6;
        p.plane.rotation.y = Math.PI + u * Math.PI / 2;
      }
    }

    // 3. Baggage Tug gentle oscillation
    if (p.tug) {
      var tugPhase = Any3d.phase(t, 7);
      p.tug.position.x = 2 + Math.sin(tugPhase * Math.PI * 2) * 4.5;
    }

    // 4. Windsock gentle sway
    if (p.sock) {
      p.sock.rotation.y = Math.sin(t * 1.5) * .25;
    }
  }
});


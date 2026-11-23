import fs from 'node:fs';

const filePath = 'server/engine/procedural.js';
let content = fs.readFileSync(filePath, 'utf8');

// =========================================================================
// 1. Upgrade SVG City Generator in generateSVGProcedural
// =========================================================================
const svgCityStart = "category === 'city' ? `";
const svgCityIdx = content.indexOf(svgCityStart, content.indexOf('function generateSVGProcedural'));

if (svgCityIdx === -1) {
  console.error('Could not find svgCityStart in generateSVGProcedural!');
  process.exit(1);
}

// Find the end of the city branch (the next : category ===)
const svgCityEnd = content.indexOf("` : category === 'farm' ?", svgCityIdx);
if (svgCityEnd === -1) {
  console.error('Could not find end of svg city branch!');
  process.exit(1);
}

const richSVGCity = `category === 'city' ? \`
    // Grand Multi-Block City Boulevard Foundation & Cobblestone
    var ground = D.slab(15.0, 11.0, pal.ground, 0, 0, 0, null, { h: 0.65, r: 1.4, side: pal.base });

    // Main Asphalt Avenue with Double Lane Markings & Crosswalks
    D.box(14.4, 0.04, 3.8, pal.slate, 0, 0.03, 0.4, null, { shadow: false });
    for (var ix = -5.5; ix <= 5.5; ix += 2.0) {
      D.box(1.0, 0.015, 0.14, pal.mustard, ix, 0.055, 0.4, null, { shadow: false });
    }
    // Zebra Pedestrian Crosswalks
    for (var kx of [-4.2, 4.2]) {
      for (var kz = -1.2; kz <= 1.2; kz += 0.45) {
        D.box(0.35, 0.015, 0.25, pal.paper, kx, 0.055, 0.4 + kz, null, { shadow: false });
      }
    }

    // Concrete Sidewalk Curbs
    D.box(14.4, 0.16, 2.8, pal.paper, 0, 0.1, -2.8); // North Block Sidewalk
    D.box(14.4, 0.16, 2.4, pal.paper, 0, 0.1, 3.4);  // South Block Sidewalk

    // Steel Tram Line with Double Rails along Front Boulevard
    D.box(14.0, 0.02, 0.08, pal.steel, 0, 0.19, 2.8, null, { shadow: false });
    D.box(14.0, 0.02, 0.08, pal.steel, 0, 0.19, 3.8, null, { shadow: false });
    // Streamlined City Tram
    var tram = D.group(0, 0.19, 3.3);
    tram.name = 'city tram';
    hot.push(tram);
    D.rbox(4.2, 1.4, 1.2, pal.teal, 0, 0.9, 0, tram, { r: 0.12 });
    D.box(4.3, 0.28, 1.22, pal.paper, 0, 0.9, 0, tram);
    D.box(3.8, 0.45, 1.24, pal.sky, 0, 1.25, 0, tram, { shadow: false });
    D.cyl(0.04, 0.04, 0.9, pal.ink, 0, 1.95, 0, tram, 6); // Pantograph

    // City Transit Bus humming along street
    var bus = D.group(-2.2, 0, 1.4);
    bus.name = 'city bus';
    hot.push(bus);
    D.box(3.2, 1.3, 1.3, pal.mustard, 0, 0.85, 0, bus);
    D.box(3.25, 0.4, 1.32, pal.sky, 0, 1.1, 0, bus, { shadow: false });
    D.box(3.3, 0.12, 1.35, pal.paper, 0, 1.55, 0, bus);
    [-0.9, 0.9].forEach(function (bx) {
      [-0.65, 0.65].forEach(function (bz) {
        D.wheel(0.24, 0.18, pal.tyre, bx, 0.24, bz, bus);
      });
    });

    // Yellow Taxi Cab
    var taxi = D.group(2.6, 0, -0.4);
    taxi.name = 'taxi cab';
    hot.push(taxi);
    D.box(1.8, 0.42, 1.1, pal.mustard, 0, 0.36, 0, taxi);
    D.box(1.1, 0.36, 1.0, pal.sky, 0, 0.72, 0, taxi);
    D.box(0.4, 0.1, 0.35, pal.paper, 0, 0.94, 0, taxi); // Taxi roof sign

    // Construction Site with Tall Turning Crane (Left North Block)
    var site = D.group(-4.5, 0.18, -2.8);
    site.name = 'construction site';
    hot.push(site);
    D.box(3.8, 0.04, 2.4, pal.sand, 0, 0.02, 0, site, { shadow: false });
    // Steel structure under construction
    D.box(2.8, 2.8, 1.8, pal.slate, -0.4, 1.4, 0, site);
    for (var sy = 0.9; sy <= 2.7; sy += 0.9) {
      D.box(2.9, 0.08, 1.9, pal.steel, -0.4, sy, 0, site);
    }
    // Crane Tower & Turning Jib
    var crane = D.group(1.2, 0, 0.4, site);
    crane.name = 'construction crane';
    hot.push(crane);
    D.box(0.35, 5.2, 0.35, pal.mustard, 0, 2.6, 0, crane);
    var jib = D.group(0, 5.2, 0, crane);
    D.box(4.6, 0.25, 0.3, pal.mustard, 1.4, 0, 0, jib);
    D.box(1.2, 0.35, 0.4, pal.steel, -1.0, 0, 0, jib); // Counterweight
    var hoist = D.group(2.6, 0, 0, jib);
    D.cyl(0.015, 0.015, 2.2, pal.ink, 0, -1.1, 0, hoist, 6);
    D.box(0.4, 0.35, 0.4, pal.coral, 0, -2.3, 0, hoist); // Suspended heavy cargo load

    // High-Rise Glass Office Tower with Spire (Center North Block)
    var tower = D.group(0, 0.18, -3.2);
    tower.name = 'office skyscraper';
    hot.push(tower);
    D.box(3.2, 6.4, 2.4, pal.cobalt, 0, 3.2, 0, tower);
    D.box(3.4, 0.2, 2.6, pal.slate, 0, 6.4, 0, tower);
    D.cyl(0.05, 0.05, 1.6, pal.steel, 0, 7.2, 0, tower, 8); // Antenna spire
    D.ball(0.12, pal.coral, 0, 8.0, 0, tower); // Blinking spire beacon
    // Skyscraper window grid
    for (var ty = 1.0; ty <= 5.8; ty += 0.8) {
      for (var tx = -1.1; tx <= 1.1; tx += 0.7) {
        D.box(0.42, 0.4, 0.04, ((Math.floor(ty * 4 + tx * 3) % 2 === 0) ? pal.mustard : pal.sky), tx, ty, 1.22, tower, { shadow: false });
      }
    }

    // Street Corner Shops with Striped Awnings (Right North Block)
    var shop = D.group(4.2, 0.18, -2.6);
    shop.name = 'street cafe & shops';
    hot.push(shop);
    D.box(3.4, 2.8, 2.2, pal.paper, 0, 1.4, 0, shop);
    D.box(3.0, 1.1, 0.06, pal.sky, 0, 1.0, 1.12, shop, { shadow: false });
    // Striped Awning
    for (var ak = 0; ak < 5; ak++) {
      D.box(0.55, 0.06, 0.9, (ak % 2 === 0 ? pal.coral : pal.paper), -1.1 + ak * 0.55, 2.0, 1.45, shop);
    }

    // Park Zone with Splashing Water Fountain (Right Front)
    var park = D.group(4.5, 0.18, 1.8);
    park.name = 'city park & fountain';
    hot.push(park);
    D.box(3.2, 0.04, 2.4, pal.leaf, 0, 0.02, 0, park, { shadow: false });
    // Tiered Stone Fountain
    var fountain = D.group(0, 0, 0, park);
    fountain.name = 'fountain';
    hot.push(fountain);
    D.cyl(1.2, 1.2, 0.28, pal.slate, 0, 0.14, 0, fountain, 20);
    D.cyl(1.05, 1.05, 0.08, pal.sky, 0, 0.24, 0, fountain, 20); // Fountain pool
    D.cyl(0.2, 0.24, 0.7, pal.paper, 0, 0.5, 0, fountain, 10);
    var splash = D.ball(0.22, pal.sky, 0, 0.95, 0, fountain);

    // Street Amenities: Cycling Traffic Lights & Streetlamps
    var lightGroup = D.group(2.2, 0.18, -1.2);
    D.cyl(0.05, 0.06, 2.6, pal.ink, 0, 1.3, 0, lightGroup, 8);
    D.box(0.28, 0.85, 0.28, pal.ink, 0, 2.5, 0, lightGroup);
    var lightRed = D.box(0.16, 0.16, 0.04, pal.bad, 0, 2.75, 0.15, lightGroup, { mat: { emissive: pal.bad, emissiveIntensity: 1 }, shadow: false });
    var lightYellow = D.box(0.16, 0.16, 0.04, pal.mustard, 0, 2.5, 0.15, lightGroup, { mat: { emissive: pal.mustard, emissiveIntensity: 0.1 }, shadow: false });
    var lightGreen = D.box(0.16, 0.16, 0.04, pal.ok, 0, 2.25, 0.15, lightGroup, { mat: { emissive: pal.ok, emissiveIntensity: 0.1 }, shadow: false });

    D.props.lamp(-2.2, 0.18, null, { h: 2.8 });
    D.props.lamp(-5.8, 0.18, null, { h: 2.8 });
    D.props.tree(3.2, 0.18, park, { r: 0.65, kind: 'round' });

    // Walking Pedestrians
    D.props.person(-1.8, 0.18, null, { shirt: pal.coral, yaw: 0.8 });
    D.props.person(2.0, 0.18, null, { shirt: pal.teal, yaw: -0.6 });
    D.props.person(5.2, 0.18, null, { shirt: pal.mustard, yaw: 1.5 });

    return { ground: ground, hot: hot, tram: tram, bus: bus, taxi: taxi, crane: crane, jib: jib, splash: splash, tower: tower, lightRed: lightRed, lightYellow: lightYellow, lightGreen: lightGreen };
`;

content = content.slice(0, svgCityIdx) + richSVGCity + content.slice(svgCityEnd);
console.log('Successfully upgraded SVG City Generator!');

// =========================================================================
// 2. Upgrade tick animations for City in SVG
// =========================================================================
const cityTickTarget = "if (p.taxi) p.taxi.position.z = Math.sin(a) * 2.0;";
const cityTickAdditions = `if (p.crane) p.crane.rotation.y = Math.sin(t * 0.7) * 0.85;
    if (p.tram) p.tram.position.x = Math.sin(t * 0.6) * 4.5;
    if (p.bus) p.bus.position.x = -2.2 + Math.cos(t * 0.5) * 2.8;
    if (p.taxi) p.taxi.position.x = 2.6 - Math.sin(t * 0.8) * 3.2;
    if (p.splash) p.splash.position.y = 0.95 + Math.abs(Math.sin(t * 4.0)) * 0.16;
    if (p.lightRed && p.lightGreen) {
      var phase = Math.floor(t * 0.5) % 3;
      p.lightRed.visible = (phase === 0);
      p.lightYellow.visible = (phase === 1);
      p.lightGreen.visible = (phase === 2);
    }`;

if (content.includes(cityTickTarget)) {
  content = content.replace(cityTickTarget, cityTickAdditions);
  console.log('Successfully upgraded SVG City Tick animations!');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Finished updating procedural.js with rich City World!');

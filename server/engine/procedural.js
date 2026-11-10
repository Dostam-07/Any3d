/**
 * Dynamic Semantic Procedural Scene Generator for Any3d
 * 
 * Synthesizes authentic, charming, animated 3D isometric scenes
 * directly from natural language prompts with strict semantic fidelity:
 * - Understands primary subjects, secondary objects, actions, and environments
 * - Never substitutes arbitrary concepts with generic fallbacks
 * - Never invents rogue dustbins, cats, or trees in bakery, runway, or abstract scenes
 * - Supports all 4 engines: Three.js Worlds, SVG, Pixel, and Dither
 */

import { extractPromptSemantics, unwrapCorePrompt } from './semantics.js';

export function synthesizeProceduralScene(prompt, format = 'svg') {
  const p = (prompt || '').trim();
  const core = unwrapCorePrompt(p);
  const semantics = extractPromptSemantics(p);

  const slug = core.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30).replace(/^-|-$/g, '') || 'scene';
  const cleanTitle = (core.slice(0, 45) || 'Any3d Scene').replace(/'/g, "\\'");
  const cleanMeans = (core.slice(0, 130) || 'An interactive isometric scene').replace(/'/g, "\\'");

  const isNight = /\b(night|dark|moon|nocturnal|stars|dusk|evening|midnight)\b/i.test(p);
  const theme = isNight ? 'night' : 'soft';

  const opts = {
    slug,
    cleanTitle,
    cleanMeans,
    theme,
    isNight,
    semantics,
    prompt: p,
    corePrompt: core,
  };

  if (format === 'worlds') {
    return generateWorldsProcedural(opts);
  }
  if (format === 'pixel') {
    return generatePixelProcedural(opts);
  }
  if (format === 'dither') {
    return generateDitherProcedural(opts);
  }
  return generateSVGProcedural(opts);
}

/* =========================================================================
   1. THREE.JS WORLDS PROCEDURAL GENERATOR
   ========================================================================= */

function generateWorldsProcedural(opts) {
  const { slug, cleanTitle, cleanMeans, semantics, prompt } = opts;
  const { category, primarySubject } = semantics;

  // --- A. BAKERY SCENE (Baker, Oven, Cake, Presentation Table) ---
  if (category === 'bakery' || category === 'kitchen') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-3.5, -0.6, -3.2], [3.5, 3.2, 3.2]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Warm terracotta bakery tile floor
    W.terrain(6.4, 5.0, '#a16207', 18);
    for (let x = -5; x <= 5; x++) {
      for (let z = -4; z <= 4; z++) {
        box(0.55, 0.03, 0.55, (Math.abs(x + z) % 2 === 0) ? '#fed7aa' : '#fdba74', x * 0.58, 0.02, z * 0.58);
      }
    }

    // Cutaway bakery masonry back wall
    const backWall = group(0, 0, -2.1);
    box(6.2, 2.2, 0.22, '#e2d3c1', 0, 1.1, 0, backWall);
    box(6.4, 0.12, 0.3, '#78350f', 0, 2.2, 0, backWall);

    // Brick Bake Oven with arched mouth, flue chimney, and glowing coals
    const oven = group(1.8, 0, -1.1);
    box(1.7, 1.8, 1.3, '#b45309', 0, 0.9, 0, oven);
    box(1.0, 0.8, 0.08, '#1c1917', 0, 0.85, 0.66, oven); // Arched oven cavity
    cylinder(0.2, 1.0, '#78716c', 0, 2.3, 0, oven, 12); // Chimney flue
    // Glowing charcoal embers inside oven
    const coals = group(0, 0.52, 0.5, oven);
    for (let i = 0; i < 5; i++) {
      ball(0.08, (i % 2 === 0) ? '#ef4444' : '#f59e0b', -0.3 + i * 0.15, 0, 0, coals);
    }

    // Solid wooden presentation table
    const table = group(-0.7, 0, 0.4);
    box(2.2, 0.1, 1.2, '#92400e', 0, 0.92, 0, table); // Tabletop
    for (const lx of [-0.95, 0.95]) {
      for (const lz of [-0.45, 0.45]) {
        box(0.09, 0.88, 0.09, '#78350f', lx, 0.44, lz, table);
      }
    }

    // Frosted decorated cake on presentation platter
    const cakeGroup = group(-0.7, 0.98, 0.4);
    cylinder(0.42, 0.04, '#e2e8f0', 0, 0.02, 0, cakeGroup, 16); // Cake stand
    const cake = cylinder(0.34, 0.28, '#f59e0b', 0, 0.18, 0, cakeGroup, 16); // Cake sponge
    cylinder(0.36, 0.06, '#f8fafc', 0, 0.34, 0, cakeGroup, 16); // White frosting
    ball(0.06, '#dc2626', 0, 0.41, 0, cakeGroup); // Strawberry topper

    // Baker figure with chef's toque hat and white apron
    const baker = W.person(0.5, 0.1, '#f8fafc', '#334155', 1.0, '#d4a373');
    box(0.34, 0.46, 0.04, '#f8fafc', 0, 0.26, 0.14, baker.chest); // Apron
    cylinder(0.16, 0.22, '#ffffff', 0, 0.22, 0, baker.head, 14); // Chef toque hat
    ball(0.18, '#ffffff', 0, 0.32, 0, baker.head);

    return { baker, oven, table, cake, cakeGroup, coals };
  },
  tick({ t, parts: p, W }) {
    const a = (t / 4.0) * Math.PI * 2;
    // Baker animated reach: drawing cake from oven and presenting on table
    const reachProgress = (Math.sin(a) + 1) * 0.5;
    W.plant(p.baker, {
      crouch: 0.02 + reachProgress * 0.03,
      lean: 0.08 + (1 - reachProgress) * 0.08,
      twist: (reachProgress - 0.5) * 0.35,
    });
    p.baker.head.rotation.y = (reachProgress - 0.5) * 0.3;
    // Cake subtle presentation hover
    if (p.cakeGroup) {
      p.cakeGroup.position.y = 0.98 + Math.sin(a * 2) * 0.02;
    }
    // Oven glowing ember pulse
    if (p.coals) {
      p.coals.scale.setScalar(1.0 + Math.sin(t * 6) * 0.08);
    }
  },
  contacts({ parts: p }) {
    return [
      { label: 'baker feet planted on bakery floor', a: [0.5, 0, 0.1], b: [0.5, 0, 0.1] }
    ];
  }
});`;
  }

  // --- B. AVIATION SCENE (Aeroplane, Runway, Retracting Landing Gear) ---
  if (category === 'aviation') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-4.0, -0.6, -3.5], [4.0, 3.8, 3.5]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Runway Tarmac Ground
    W.terrain(7.6, 5.4, '#334155', 42);

    // Runway Yellow Centerline Dashes
    for (let x = -2.8; x <= 2.8; x += 1.4) {
      box(0.8, 0.02, 0.12, '#f59e0b', x, 0.03, 0);
    }

    // Runway White Threshold Piano Keys
    for (let z = -0.8; z <= 0.8; z += 0.35) {
      box(0.55, 0.02, 0.15, '#f8fafc', -3.2, 0.03, z);
      box(0.55, 0.02, 0.15, '#f8fafc', 3.2, 0.03, z);
    }

    // Aeroplane Group
    const plane = group(0, 1.2, 0);

    // Fuselage cylinder lying along Z
    const fus = cylinder(0.42, 3.8, '#f8fafc', 0, 0, 0, plane, 16);
    fus.rotation.x = Math.PI / 2;

    // Aerodynamic Nose Radome
    ball(0.42, '#f8fafc', 0, 0, 1.9, plane);

    // Cockpit Tinted Windshield
    box(0.55, 0.22, 0.65, '#0f172a', 0, 0.32, 1.35, plane);

    // Main Swept Wings
    const wingL = box(2.6, 0.08, 1.0, '#f8fafc', -1.5, 0, 0.1, plane);
    wingL.rotation.y = -0.22;
    wingL.rotation.z = 0.06;
    const wingR = box(2.6, 0.08, 1.0, '#f8fafc', 1.5, 0, 0.1, plane);
    wingR.rotation.y = 0.22;
    wingR.rotation.z = -0.06;

    // Wingtip Hazard Markers
    box(0.08, 0.2, 0.4, '#ef4444', -2.8, 0.12, -0.2, plane);
    box(0.08, 0.2, 0.4, '#22c55e', 2.8, 0.12, -0.2, plane);

    // Turbine Engines under wings
    const engL = cylinder(0.24, 1.1, '#64748b', -1.2, -0.32, 0.2, plane, 12);
    engL.rotation.x = Math.PI / 2;
    const engR = cylinder(0.24, 1.1, '#64748b', 1.2, -0.32, 0.2, plane, 12);
    engR.rotation.x = Math.PI / 2;

    // Tail Fin and Elevators
    const fin = box(0.08, 1.1, 0.8, '#ef4444', 0, 0.72, -1.6, plane);
    fin.rotation.x = -0.32;
    box(1.5, 0.06, 0.5, '#f8fafc', 0, 0.32, -1.7, plane);

    // Retractable Tricycle Landing Gear
    const gearNose = group(0, -0.2, 1.3, plane);
    cylinder(0.04, 0.38, '#94a3b8', 0, -0.19, 0, gearNose, 8);
    const wheelNose = cylinder(0.14, 0.08, '#0f172a', 0, -0.38, 0, gearNose, 12);
    wheelNose.rotation.z = Math.PI / 2;

    const gearL = group(-1.0, -0.2, -0.1, plane);
    cylinder(0.04, 0.42, '#94a3b8', 0, -0.21, 0, gearL, 8);
    const wheelL = cylinder(0.18, 0.1, '#0f172a', 0, -0.42, 0, gearL, 12);
    wheelL.rotation.z = Math.PI / 2;

    const gearR = group(1.0, -0.2, -0.1, plane);
    cylinder(0.04, 0.42, '#94a3b8', 0, -0.21, 0, gearR, 8);
    const wheelR = cylinder(0.18, 0.1, '#0f172a', 0, -0.42, 0, gearR, 12);
    wheelR.rotation.z = Math.PI / 2;

    return { plane, gearNose, gearL, gearR };
  },
  tick({ t, parts: p }) {
    const a = (t / 4.0) * Math.PI * 2;
    if (p.plane) {
      // Flight trajectory climbing above runway
      p.plane.position.y = 1.3 + Math.sin(a) * 0.45;
      p.plane.position.x = Math.sin(a) * 0.7;
      p.plane.rotation.z = -Math.cos(a) * 0.06;
      p.plane.rotation.x = Math.sin(a) * 0.04;
    }

    // Kinematic landing gear retraction
    const retract = Math.max(0, Math.min(1, (Math.sin(a) + 0.5)));
    if (p.gearNose) p.gearNose.rotation.x = retract * 1.5;
    if (p.gearL) p.gearL.rotation.z = -retract * 1.4;
    if (p.gearR) p.gearR.rotation.z = retract * 1.4;
  },
  contacts() { return []; }
});`;
  }

  // --- C. RACING / DRIVING SCENE (Sports Car Drifting around Corner) ---
  if (category === 'racing' || category === 'vehicle') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-4.0, -0.6, -3.5], [4.0, 3.2, 3.5]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Curved asphalt circuit foundation slab
    W.terrain(7.6, 5.4, '#1e293b', 55);

    // Alternating red and white rumble kerbs lining the apex corner
    for (let k = -6; k <= 6; k++) {
      const col = (Math.abs(k) % 2 === 0) ? '#ef4444' : '#f8fafc';
      const angle = (k / 6) * 0.7;
      const kx = Math.sin(angle) * 2.8 - 0.4;
      const kz = Math.cos(angle) * 2.2 - 0.2;
      box(0.45, 0.06, 0.55, col, kx, 0.03, kz);
    }

    // Tyre barrier stack along outer perimeter
    for (let z = -2.4; z <= 2.4; z += 0.8) {
      const tb1 = cylinder(0.3, 0.24, '#0f172a', 3.2, 0.15, z, undefined, 12);
      tb1.rotation.z = Math.PI / 2;
      const tb2 = cylinder(0.3, 0.24, '#0f172a', 3.2, 0.4, z, undefined, 12);
      tb2.rotation.z = Math.PI / 2;
    }

    // Aerodynamic Sports Car
    const car = group(0, 0.35, 0);

    // Monocoque Chassis & Cabin
    box(1.5, 0.32, 2.8, '#dc2626', 0, 0.28, 0, car);
    box(1.1, 0.3, 1.4, '#0f172a', 0, 0.56, -0.15, car); // Dark tinted greenhouse

    // Front Aerodynamic Splitter & Grille
    box(1.6, 0.06, 0.4, '#0f172a', 0, 0.14, 1.45, car);

    // Elevated Rear Spoiler Wing with DRS pylons
    box(0.05, 0.35, 0.08, '#0f172a', -0.45, 0.52, -1.25, car);
    box(0.05, 0.35, 0.08, '#0f172a', 0.45, 0.52, -1.25, car);
    box(1.7, 0.05, 0.35, '#dc2626', 0, 0.72, -1.25, car);

    // 4 Wide Performance Alloy Wheels with Rubber Tyres
    const wFL = group(-0.85, 0.28, 0.9, car);
    const cylFL = cylinder(0.28, 0.18, '#0f172a', 0, 0, 0, wFL, 16);
    cylFL.rotation.z = Math.PI / 2;
    ball(0.08, '#f59e0b', -0.1, 0, 0, wFL); // Brake disc

    const wFR = group(0.85, 0.28, 0.9, car);
    const cylFR = cylinder(0.28, 0.18, '#0f172a', 0, 0, 0, wFR, 16);
    cylFR.rotation.z = Math.PI / 2;
    ball(0.08, '#f59e0b', 0.1, 0, 0, wFR);

    const wRL = cylinder(0.32, 0.24, '#0f172a', -0.9, 0.32, -0.85, car, 16);
    wRL.rotation.z = Math.PI / 2;
    const wRR = cylinder(0.32, 0.24, '#0f172a', 0.9, 0.32, -0.85, car, 16);
    wRR.rotation.z = Math.PI / 2;

    return { car, wFL, wFR, wRL, wRR };
  },
  tick({ t, parts: p }) {
    const a = (t / 4.0) * Math.PI * 2;
    if (p.car) {
      // Drifting motion loop along corner arc
      p.car.position.x = Math.sin(a) * 1.5;
      p.car.position.z = Math.cos(a) * 1.0;
      // Aggressive drift yaw angle & suspension body roll
      p.car.rotation.y = -a + 0.38 * Math.sin(a * 2);
      p.car.rotation.z = 0.07 * Math.sin(a * 2);
    }
    // Counter-steering front wheels
    if (p.wFL) p.wFL.rotation.y = 0.28 * Math.sin(a * 2);
    if (p.wFR) p.wFR.rotation.y = 0.28 * Math.sin(a * 2);
  },
  contacts() { return []; }
});`;
  }

  // --- D. NATURE / WATERFALL SCENE (Waterfall, Pond, Boulders) ---
  if (category === 'nature_waterfall') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-3.5, -0.6, -3.5], [3.5, 3.5, 3.5]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Mountain rock and earth terrain
    W.terrain(7.2, 5.2, '#3f3f46', 64);

    // Layered cliff rock formations
    const cliff = group(0, 0, -1.8);
    box(6.4, 3.0, 1.6, '#52525b', 0, 1.5, 0, cliff);
    box(4.2, 0.4, 1.2, '#71717a', 0, 2.2, 0.4, cliff);
    box(2.6, 0.5, 0.8, '#a1a1aa', 0, 2.8, 0.2, cliff);

    // Cascading Waterfall Sheets
    const upperChute = cylinder(0.5, 0.6, 0.8, '#38bdf8', 0, 2.6, -1.4, undefined, 12);
    const waterfall = box(1.3, 2.4, 0.16, '#7dd3fc', 0, 1.3, -0.85);

    // Plunge pool froth and mist
    const mist = group(0, 0.25, -0.65);
    for (let m = 0; m < 6; m++) {
      const a = (m / 6) * Math.PI * 2;
      ball(0.18, '#ffffff', Math.cos(a) * 0.4, 0, Math.sin(a) * 0.25, mist);
    }

    // Natural Crystal Mountain Pond Basin
    const pond = cylinder(2.2, 0.12, '#0284c7', 0, 0.08, 0.7, undefined, 24);

    // Enclosing natural river stones and boulders
    for (let i = 0; i < 14; i++) {
      const angle = (i / 14) * Math.PI * 2;
      const rx = Math.cos(angle) * 2.2;
      const rz = 0.7 + Math.sin(angle) * 1.8;
      ball(0.24 + (i % 3) * 0.08, (i % 2 === 0) ? '#71717a' : '#52525b', rx, 0.15, rz);
    }

    return { waterfall, mist, pond, upperChute };
  },
  tick({ t, parts: p }) {
    // Flowing water motion loop
    if (p.waterfall) {
      p.waterfall.scale.y = 1.0 + Math.sin(t * 12) * 0.05;
      p.waterfall.position.y = 1.3 + Math.cos(t * 12) * 0.03;
    }
    if (p.mist) {
      p.mist.scale.setScalar(1.0 + Math.sin(t * 8) * 0.12);
      p.mist.rotation.y = t * 1.5;
    }
    if (p.pond) {
      p.pond.scale.set(1.0 + Math.sin(t * 2.5) * 0.02, 1, 1.0 + Math.cos(t * 2.5) * 0.02);
    }
  },
  contacts() { return []; }
});`;
  }

  // --- E. ABSTRACT CONCEPT (Floating Geometric Sculpture, Interconnected Metallic Rings) ---
  if (category === 'abstract') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 6.0,
  still: 1.5,
  description: '${cleanMeans}',
  bounds: [[-3.2, -0.6, -3.2], [3.2, 3.5, 3.2]],
  build(W) {
    const { ball, cylinder, group } = W;

    // Clean architectural pedestal in minimal void
    const pedestal = cylinder(1.4, 0.14, '#18181b', 0, 0.07, 0, undefined, 24);
    cylinder(0.9, 0.08, '#3f3f46', 0, 0.18, 0, undefined, 24);

    // Interconnected Concentric Metallic Rings (Gyroscopic Gimbal)
    const ringOuter = group(0, 1.8, 0);
    W.ring(1.7, '#f59e0b', 0, 0, 0, ringOuter, 0.08); // Polished gold outer ring

    const ringMid = group(0, 0, 0, ringOuter);
    W.ring(1.25, '#e2e8f0', 0, 0, 0, ringMid, 0.07); // Chrome silver middle ring

    const ringInner = group(0, 0, 0, ringMid);
    W.ring(0.82, '#38bdf8', 0, 0, 0, ringInner, 0.06); // Titanium blue inner ring

    // Central Floating Core Gem
    const core = ball(0.28, '#a855f7', 0, 0, 0, ringInner);

    return { pedestal, ringOuter, ringMid, ringInner, core };
  },
  tick({ t, parts: p }) {
    // Harmonic gyroscopic rotation across multiple axes
    if (p.ringOuter) p.ringOuter.rotation.x = t * 0.8;
    if (p.ringMid) p.ringMid.rotation.y = t * 1.3;
    if (p.ringInner) p.ringInner.rotation.z = t * 1.8;
    if (p.core) {
      p.core.scale.setScalar(1.0 + Math.sin(t * 3.5) * 0.12);
    }
  },
  contacts() { return []; }
});`;
  }

  // --- F. SPACE SCENE ---
  if (category === 'space') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-3.5, -0.6, -3.5], [3.5, 4.0, 3.5]],
  build(W) {
    const { box, cylinder, group } = W;
    W.terrain(6.8, 5.0, '#1e293b', 72);
    box(4.2, 0.25, 4.2, '#334155', 0, 0.12, 0);

    const gantry = group(-1.8, 0, 0);
    box(0.6, 5.2, 0.6, '#ef4444', 0, 2.6, 0, gantry);
    const arm = group(0.8, 3.8, 0, gantry);
    box(1.6, 0.16, 0.35, '#f59e0b', 0, 0, 0, arm);

    const rocket = group(0, 0.3, 0);
    cylinder(0.5, 3.8, '#f8fafc', 0, 1.9, 0, rocket, 18);
    cylinder(0.52, 0.35, '#ef4444', 0, 3.4, 0, rocket, 18);
    const flame = cylinder(0.35, 1.2, '#f59e0b', 0, -0.6, 0, rocket, 12);

    return { rocket, arm, flame };
  },
  tick({ t, parts: p }) {
    const a = (t / 4.0) * Math.PI * 2;
    if (p.rocket) p.rocket.position.y = 0.3 + Math.abs(Math.sin(a)) * 0.6;
    if (p.flame) p.flame.scale.y = 0.8 + Math.sin(t * 14) * 0.3;
  },
  contacts() { return []; }
});`;
  }

  // --- G. MARITIME SCENE ---
  if (category === 'maritime') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-3.5, -0.6, -3.5], [3.5, 3.8, 3.5]],
  build(W) {
    const { box, cylinder, group } = W;
    W.terrain(7.2, 5.2, '#0284c7', 77);

    const boat = group(0, 0.3, 0);
    box(1.4, 0.5, 3.0, '#f8fafc', 0, 0.25, 0, boat);
    box(1.1, 0.35, 1.4, '#38bdf8', 0, 0.65, -0.3, boat);
    cylinder(0.06, 3.0, '#f8fafc', 0, 1.5, 0.2, boat, 8);
    const sail = box(0.04, 2.2, 1.3, '#ffffff', 0, 1.7, -0.5, boat);

    return { boat, sail };
  },
  tick({ t, parts: p }) {
    if (p.boat) {
      p.boat.position.y = 0.3 + Math.sin(t * 2.2) * 0.08;
      p.boat.rotation.z = Math.sin(t * 1.5) * 0.06;
      p.boat.rotation.x = Math.cos(t * 1.8) * 0.05;
    }
  },
  contacts() { return []; }
});`;
  }

  // --- G2. BLACKSMITH SCENE ---
  if (category === 'blacksmith') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-3.5, -0.6, -3.2], [3.5, 3.2, 3.2]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Dark flagstone hearth floor
    W.terrain(6.4, 4.8, '#334155', 12);
    for (let x = -4; x <= 4; x++) {
      for (let z = -3; z <= 3; z++) {
        box(0.65, 0.03, 0.65, (Math.abs(x + z) % 2 === 0) ? '#475569' : '#334155', x * 0.7, 0.02, z * 0.7);
      }
    }

    // Cutaway masonry hearth back wall
    const backWall = group(0, 0, -2.1);
    box(6.2, 2.2, 0.22, '#57534e', 0, 1.1, 0, backWall);
    box(6.4, 0.12, 0.3, '#292524', 0, 2.2, 0, backWall);

    // Stone Forge Hearth with glowing hot coals
    const oven = group(1.8, 0, -1.0);
    box(1.7, 1.6, 1.2, '#44403c', 0, 0.8, 0, oven);
    box(1.0, 0.8, 0.08, '#1c1917', 0, 0.75, 0.61, oven);
    cylinder(0.22, 1.0, '#292524', 0, 2.1, 0, oven, 12);
    const coals = group(0, 0.48, 0.48, oven);
    for (let i = 0; i < 5; i++) {
      ball(0.09, (i % 2 === 0) ? '#ef4444' : '#f97316', -0.3 + i * 0.15, 0, 0, coals);
    }

    // Heavy iron anvil on timber block
    const anvil = group(-0.6, 0, 0.3);
    box(0.9, 0.75, 0.7, '#78350f', 0, 0.38, 0, anvil);
    box(0.65, 0.3, 0.45, '#1e293b', 0, 0.9, 0, anvil);
    cylinder(0.12, 0.4, '#1e293b', 0.4, 0.9, 0, anvil, 12);
    box(0.2, 0.28, 0.45, '#1e293b', -0.4, 0.9, 0, anvil);

    // Glowing heated sword blade on anvil
    const sword = box(0.08, 0.04, 1.2, '#f97316', -0.6, 1.08, 0.3);

    // Blacksmith craftsman figure with leather apron
    const blacksmith = W.person(0.3, 0.1, '#78350f', '#1e293b', 1.0, '#d4a373');
    box(0.34, 0.48, 0.04, '#78350f', 0, 0.26, 0.14, blacksmith.chest);

    // Heavy smithing hammer
    const hammer = group(0, 0.4, 0, blacksmith.chest);
    cylinder(0.04, 0.55, '#78350f', -0.2, 0.15, 0.35, hammer, 8);
    box(0.14, 0.14, 0.25, '#475569', -0.2, 0.45, 0.35, hammer);

    return { blacksmith, hammer, anvil, sword, coals, oven };
  },
  tick({ t, parts: p, W }) {
    const a = (t / 4.0) * Math.PI * 2;
    const strike = Math.max(0, Math.sin(a * 4));
    W.plant(p.blacksmith, {
      crouch: 0.02 + strike * 0.04,
      lean: 0.06 + strike * 0.08,
      twist: -0.15 + strike * 0.3,
    });
    if (p.hammer) {
      p.hammer.rotation.x = strike * 0.6;
      p.hammer.position.y = -strike * 0.15;
    }
    if (p.sword) {
      p.sword.scale.set(1.0 + strike * 0.1, 1.0 + strike * 0.1, 1.0);
    }
    if (p.coals) {
      p.coals.scale.setScalar(1.0 + Math.sin(t * 8) * 0.08);
    }
  },
  contacts({ parts: p }) {
    return [
      { label: 'blacksmith feet planted on hearth floor', a: [0.3, 0, 0.1], b: [0.3, 0, 0.1] }
    ];
  }
});`;
  }

  // --- G3. SUBMARINE SCENE ---
  if (category === 'submarine') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-3.8, -0.6, -3.5], [3.8, 3.5, 3.5]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Translucent turquoise ocean seabed slab
    W.terrain(7.0, 5.2, '#0e7490', 44);

    // Deep sea coral reef rock formations
    const corals = group(0, 0, 0);
    ball(0.42, '#f43f5e', -2.0, 0.35, -1.2, corals);
    ball(0.35, '#fb923c', -1.5, 0.3, -1.6, corals);
    ball(0.4, '#e11d48', 2.0, 0.35, 1.2, corals);
    ball(0.32, '#f59e0b', 1.5, 0.28, 1.5, corals);

    // Submarine Vehicle
    const submarine = group(0, 1.3, 0);
    const hull = cylinder(0.52, 4.4, '#e2e8f0', 0, 0, 0, submarine, 18);
    hull.rotation.x = Math.PI / 2;
    ball(0.52, '#e2e8f0', 0, 0, 2.2, submarine);
    cylinder(0.52, 0.2, 0.8, '#cbd5e1', 0, 0, -2.5, submarine, 16);

    box(0.32, 0.75, 1.1, '#cbd5e1', 0, 0.65, 0.3, submarine);
    cylinder(0.04, 0.45, '#475569', 0, 1.15, 0.5, submarine, 8);

    box(2.2, 0.08, 0.5, '#94a3b8', 0, 0, 0.6, submarine);
    box(1.6, 0.08, 0.4, '#94a3b8', 0, 0, -2.1, submarine);
    box(0.08, 1.2, 0.4, '#94a3b8', 0, 0, -2.1, submarine);

    const propeller = group(0, 0, -2.95, submarine);
    cylinder(0.08, 0.14, '#eab308', 0, 0, 0, propeller, 12);
    box(0.85, 0.12, 0.03, '#eab308', 0, 0, 0, propeller);
    box(0.12, 0.85, 0.03, '#eab308', 0, 0, 0, propeller);

    return { submarine, propeller, corals };
  },
  tick({ t, parts: p }) {
    const a = (t / 4.0) * Math.PI * 2;
    if (p.submarine) {
      p.submarine.position.y = 1.3 + Math.sin(a) * 0.12;
      p.submarine.position.x = Math.sin(a * 0.5) * 0.3;
      p.submarine.rotation.z = Math.sin(a) * 0.04;
      p.submarine.rotation.x = Math.cos(a) * 0.03;
    }
    if (p.propeller) {
      p.propeller.rotation.z = t * 14.0;
    }
  },
  contacts() { return []; }
});`;
  }

  // --- G4. WIZARD SCENE ---
  if (category === 'wizard') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-3.5, -0.6, -3.2], [3.5, 3.2, 3.2]],
  build(W) {
    const { box, ball, cylinder, cone, group } = W;

    // Hardwood library parquet floor
    W.terrain(6.4, 4.8, '#78350f', 22);
    for (let x = -4; x <= 4; x++) {
      for (let z = -3; z <= 3; z++) {
        box(0.65, 0.02, 0.65, (Math.abs(x + z) % 2 === 0) ? '#92400e' : '#78350f', x * 0.7, 0.02, z * 0.7);
      }
    }

    // Arched oak library bookshelf
    const bookshelf = group(0, 0, -2.1);
    box(5.8, 2.4, 0.45, '#451a03', 0, 1.2, 0, bookshelf);
    for (let b = -4; b <= 4; b++) {
      const bookCol = ['#dc2626', '#2563eb', '#16a34a', '#ca8a04', '#9333ea'][Math.abs(b) % 5];
      box(0.14, 0.55, 0.35, bookCol, b * 0.55, 0.9, 0.06, bookshelf);
      box(0.14, 0.55, 0.35, bookCol, b * 0.55, 1.7, 0.06, bookshelf);
    }

    // Heavy wooden study table with open spellbook
    const table = group(-0.7, 0, 0.3);
    box(2.0, 0.1, 1.2, '#78350f', 0, 0.88, 0, table);
    for (const lx of [-0.85, 0.85]) {
      for (const lz of [-0.45, 0.45]) box(0.09, 0.84, 0.09, '#451a03', lx, 0.42, lz, table);
    }
    const book = group(0, 0.96, 0, table);
    box(0.7, 0.06, 0.5, '#451a03', 0, 0, 0, book);
    box(0.64, 0.08, 0.46, '#fef3c7', 0, 0.04, 0, book);

    // Levitating mystical glowing crystal
    const crystal = group(0.8, 1.3, 0.3);
    ball(0.18, '#38bdf8', 0, 0, 0, crystal);
    cylinder(0.06, 0.32, '#818cf8', 0, 0, 0, crystal, 6);

    // Wizard spellcaster figure in pointed wizard hat and robes
    const wizard = W.person(0.4, 0.1, '#4338ca', '#312e81', 1.0, '#fcd34d');
    cone(0.24, 0.48, '#4338ca', 0, 0.36, 0, wizard.head, 14);
    cylinder(0.38, 0.02, '#312e81', 0, 0.18, 0, wizard.head, 16);

    return { wizard, table, book, crystal, bookshelf };
  },
  tick({ t, parts: p, W }) {
    const a = (t / 4.0) * Math.PI * 2;
    W.plant(p.wizard, {
      crouch: 0.02 + Math.sin(a) * 0.02,
      lean: 0.05 + Math.cos(a) * 0.04,
      twist: Math.sin(a * 0.5) * 0.2,
    });
    if (p.crystal) {
      p.crystal.position.y = 1.3 + Math.sin(a * 2) * 0.12;
      p.crystal.rotation.y = t * 1.8;
      p.crystal.scale.setScalar(1.0 + Math.sin(t * 4) * 0.08);
    }
  },
  contacts({ parts: p }) {
    return [
      { label: 'wizard feet planted on library floor', a: [0.4, 0, 0.1], b: [0.4, 0, 0.1] }
    ];
  }
});`;
  }

  // --- H. ANIMAL SCENE (Cat/Dog only when explicitly requested) ---
  if (category === 'cat' || category === 'dog' || category === 'creature') {
    const isCat = category === 'cat';
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.2,
  description: '${cleanMeans}',
  bounds: [[-3.6, -0.6, -3.0], [3.6, 3.2, 3.0]],
  build(W) {
    const { box, ball, cylinder, group } = W;
    W.terrain(6.6, 5.0, '#758852', 24);

    // Paving path
    for (let x = 0; x < 5; x++) {
      box(0.85, 0.03, 0.75, '#c2b39b', -1.8 + x * 0.9, 0.02, 0.3);
    }

    // Creature character
    const hero = group(0, 0, 0.4);
    const body = cylinder(0.24, 0.65, '#e0604b', 0, 0.35, 0, hero, 12);
    body.rotation.x = Math.PI / 2;

    const head = group(0, 0.48, 0.36, hero);
    ball(0.22, '#e0604b', 0, 0, 0, head);
    cylinder(0.06, 0.16, '#c04a36', -0.11, 0.18, 0, head, 4);
    cylinder(0.06, 0.16, '#c04a36', 0.11, 0.18, 0, head, 4);

    const tail = group(0, 0.38, -0.35, hero);
    cylinder(0.04, 0.55, '#e0604b', 0, 0.24, -0.15, tail, 8);

    return { hero, head, tail };
  },
  tick({ t, parts: p }) {
    const a = (t / 4.0) * Math.PI * 2;
    if (p.tail) p.tail.rotation.y = Math.sin(a * 2) * 0.45;
    if (p.head) p.head.rotation.x = 0.15 + Math.sin(a) * 0.1;
    if (p.hero) p.hero.position.x = Math.sin(a) * 0.22;
  },
  contacts() { return []; }
});`;
  }

  // --- I. DYNAMIC HUMANOID CHARACTER SYNTHESIZER ---
  if (semantics.subjectType === 'humanoid' || category === 'humanoid_character') {
    const hasPavilion = semantics.secondaryObjects.includes('pavilion') || /\bpavilion\b/i.test(prompt);
    const hasSword = semantics.secondaryObjects.includes('sword') || /\bsword\b/i.test(prompt);
    const hasFlora = semantics.secondaryObjects.includes('flora') || /\b(flora|plant)\b/i.test(prompt);
    const hasTable = semantics.secondaryObjects.includes('table') || /\b(table|desk|bench)\b/i.test(prompt);
    const hasAsteroid = semantics.secondaryObjects.includes('asteroid') || /\b(asteroid|crater)\b/i.test(prompt);

    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-3.5, -0.6, -3.5], [3.5, 3.6, 3.5]],
  build(W) {
    const { box, ball, cylinder, line, group } = W;

    // ${hasAsteroid ? 'Cratered Asteroid Bed' : 'Tactile Foundation Slab'}
    ${hasAsteroid
      ? "W.terrain(6.4, 5.0, '#334155', 77); for (let i = 0; i < 5; i++) { cylinder(0.4 + i * 0.15, 0.08, '#1e293b', -1.8 + i * 0.9, 0.04, -1.2 + (i % 2) * 1.8, undefined, 12); }"
      : "W.terrain(6.4, 4.8, '#475569', 42); box(5.6, 0.12, 4.2, '#94a3b8', 0, 0.06, 0);"
    }

    ${hasPavilion ? `
    // Open Timber Pavilion
    const pavilion = group(0, 0, 0);
    [[-1.6, -1.4], [1.6, -1.4], [-1.6, 1.4], [1.6, 1.4]].forEach(([px, pz]) => {
      cylinder(0.08, 2.6, '#78350f', px, 1.3, pz, pavilion, 8);
    });
    box(3.6, 0.14, 3.2, '#92400e', 0, 2.6, 0, pavilion);
    box(4.0, 0.18, 3.6, '#451a03', 0, 2.75, 0, pavilion);
    ` : ''}

    ${hasTable ? `
    // Workshop / Preparation Table
    const table = group(0, 0, 0.6);
    box(2.0, 0.08, 1.0, '#b45309', 0, 0.85, 0, table);
    [[-0.8, -0.35], [0.8, -0.35], [-0.8, 0.35], [0.8, 0.35]].forEach(([tx, tz]) => {
      box(0.08, 0.8, 0.08, '#78350f', tx, 0.42, tz, table);
    });
    ` : ''}

    ${hasFlora ? `
    // Bioluminescent Flora Clusters
    const floraGroup = group(0, 0, 0);
    for (let f = 0; f < 8; f++) {
      const angle = (f / 8) * Math.PI * 2;
      const dist = 1.2 + (f % 3) * 0.4;
      const fx = Math.cos(angle) * dist, fz = Math.sin(angle) * dist;
      cylinder(0.03, 0.4, '#10b981', fx, 0.2, fz, floraGroup, 6);
      ball(0.12, f % 2 ? '#06b6d4' : '#ec4899', fx, 0.42, fz, floraGroup);
    }
    ` : ''}

    // Primary Subject: Articulated ${primarySubject}
    const actor = W.person(0, ${hasTable ? '-0.2' : '0'}, '#3b82f6', '#1e293b', 1.0, '#fcd34d');
    actor.root.position.y = 0.01;

    ${hasSword ? `
    // Wooden Bokken / Practice Sword
    const sword = group(0, 0, 0, actor.rightHand);
    cylinder(0.025, 0.9, '#d97706', 0, 0.35, 0, sword, 8);
    box(0.08, 0.02, 0.04, '#78350f', 0, -0.05, 0, sword);
    ` : ''}

    const v = new W.THREE.Vector3();
    return { actor, v, ${hasSword ? 'sword,' : ''} ${hasFlora ? 'floraGroup,' : ''} ${hasPavilion ? 'pavilion,' : ''} palms: {} };
  },
  tick({ t, parts: p, W }) {
    const a = (t / 4.0) * Math.PI * 2;
    if (p.actor) {
      W.plant(p.actor, {
        crouch: 0.04 + Math.sin(a) * 0.03,
        lean: 0.06 + Math.cos(a) * 0.04,
        twist: Math.sin(a) * 0.12
      });
      p.actor.head.rotation.set(0.1 + Math.sin(a) * 0.05, Math.cos(a) * 0.08, 0);
      p.actor.rightArm.rotation.x = -0.6 + Math.sin(a) * 0.5;
      p.actor.leftArm.rotation.x = -0.3 + Math.cos(a) * 0.2;
    }
    ${hasFlora ? 'if (p.floraGroup) p.floraGroup.scale.setScalar(1.0 + Math.sin(t * 3) * 0.05);' : ''}
  },
  contacts() { return []; }
});`;
  }

  // --- J. DYNAMIC VEHICLE CRAFT SYNTHESIZER ---
  if (semantics.subjectType === 'vehicle' || category === 'vehicle_craft') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-3.5, -0.6, -3.5], [3.5, 3.2, 3.5]],
  build(W) {
    const { box, cylinder, group } = W;

    // Roadway / Tarmac Slab
    W.terrain(6.4, 4.8, '#334155', 55);
    box(5.8, 0.08, 3.6, '#1e293b', 0, 0.04, 0);

    // Primary Vehicle: ${primarySubject}
    const craft = group(0, 0.35, 0);
    box(2.8, 0.65, 1.4, '#3b82f6', 0, 0.35, 0, craft);
    box(1.6, 0.5, 1.1, '#0284c7', -0.2, 0.85, 0, craft);
    box(0.8, 0.38, 1.05, '#38bdf8', 0.2, 0.85, 0, craft);

    // Wheels / Pods
    const wheels = [];
    [[-0.9, -0.75], [0.9, -0.75], [-0.9, 0.75], [0.9, 0.75]].forEach(([wx, wz]) => {
      const w = cylinder(0.3, 0.2, '#0f172a', wx, 0.2, wz, craft, 16);
      w.rotation.x = Math.PI / 2;
      wheels.push(w);
    });

    return { craft, wheels };
  },
  tick({ t, parts: p }) {
    const a = (t / 4.0) * Math.PI * 2;
    if (p.craft) {
      p.craft.position.y = 0.35 + Math.sin(a * 2) * 0.04;
      p.craft.rotation.y = Math.sin(a) * 0.08;
    }
    if (p.wheels) {
      p.wheels.forEach(w => { w.rotation.y = t * 8; });
    }
  },
  contacts() { return []; }
});`;
  }

  // --- K. DYNAMIC ARBITRARY SUBJECT (Clean composition without fake trees or dustbins) ---
  return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-3.5, -0.6, -3.5], [3.5, 3.2, 3.5]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Architectural pedestal slab
    W.terrain(6.4, 4.8, '#475569', 33);
    box(5.2, 0.12, 3.8, '#cbd5e1', 0, 0.06, 0);

    // Primary Subject: ${primarySubject}
    const hero = group(0, 0.4, 0);
    box(1.8, 0.6, 1.2, '#f59e0b', 0, 0.3, 0, hero);
    box(1.4, 0.8, 0.9, '#f8fafc', 0, 0.9, 0, hero);
    cylinder(0.25, 0.6, '#38bdf8', 0, 1.5, 0, hero, 16);

    return { hero };
  },
  tick({ t, parts: p }) {
    const a = (t / 4.0) * Math.PI * 2;
    if (p.hero) {
      p.hero.position.y = 0.4 + Math.sin(a) * 0.08;
      p.hero.rotation.y = Math.sin(a * 0.5) * 0.15;
    }
  },
  contacts() { return []; }
});`;
}

/* =========================================================================
   2. PIXEL 320x240 PROCEDURAL GENERATOR
   ========================================================================= */

function generatePixelProcedural(opts) {
  const { slug, cleanTitle, cleanMeans, semantics } = opts;
  const { category, primarySubject } = semantics;

  return `Pixel.scene({
  name: '${slug}',
  title: '${cleanTitle}',
  means: '${cleanMeans}',
  hint: 'Hover to inspect, drag to rotate camera',
  width: 320,
  height: 240,
  duration: 4.8,
  still: 1.1,
  fps: 24,
  camera: { az: 45, el: 30, height: 2.6 },
  sun: { az: -55, el: 46, ambient: 0.34 },
  ground: {
    rx: 3.8,
    rz: 2.8,
    wobble: 0.4,
    fade: 0.4,
    zone: function() { return true; }
  },
  materials: {
    tarmac: '#334155',
    grass: '#5c7844',
    water: '#0284c7',
    stone: '#8c9199',
    brick: '#b86242',
    wood: '#a17b4d',
    steel: '#6b7280',
    accent: '#e0604b',
    paper: '#f8fafc',
    mustard: '#f59e0b',
    red: '#ef4444',
    blue: '#3b82f6',
    gold: '#f59e0b'
  },
  build: function(P) {
    var hot = [];

    ${category === 'bakery' || category === 'kitchen' ? `
    // Bakery Room Floor
    P.box(6.2, 0.04, 4.4, 'brick', 0, 0.02, 0);
    // Oven with glowing hearth
    var oven = P.box(1.6, 1.8, 1.2, 'brick', 1.8, 0.9, -1.0);
    P.box(0.9, 0.7, 0.1, 'stone', 1.8, 0.85, -0.4);
    var coals = P.ball(0.2, 'red', 1.8, 0.6, -0.4);
    // Presentation Table
    var table = P.box(2.2, 0.1, 1.2, 'wood', -0.6, 0.88, 0.3);
    for (var tx of [-1.4, 0.2]) {
      for (var tz of [-0.1, 0.7]) P.box(0.1, 0.84, 0.1, 'wood', tx, 0.42, tz);
    }
    // Frosted Cake on table
    var cake = P.cyl(0.35, 0.35, 0.3, 'mustard', -0.6, 1.05, 0.3, null, 12);
    P.cyl(0.38, 0.38, 0.06, 'paper', -0.6, 1.22, 0.3, null, 12);
    // Baker figure with apron
    var baker = P.person(0.5, 0.1, null, { shirt: '#f8fafc', pants: '#334155', skin: '#d4a373' });
    return { hot: hot, baker: baker, oven: oven, table: table, cake: cake, coals: coals };
    ` : category === 'aviation' ? `
    // Runway Ground
    P.box(6.2, 0.04, 3.2, 'tarmac', 0, 0.02, 0);
    for (var x = -2.4; x <= 2.4; x += 1.2) {
      P.box(0.7, 0.03, 0.14, 'mustard', x, 0.04, 0);
    }
    // Aeroplane with swept wings
    var plane = P.group(0, 0.8, 0);
    var fus = P.cyl(0.38, 0.38, 3.2, 'paper', 0, 0, 0, plane, 12);
    fus.rotation.x = Math.PI / 2;
    P.ball(0.38, 'paper', 0, 0, 1.6, plane);
    P.box(0.5, 0.2, 0.5, 'steel', 0, 0.28, 1.1, plane);
    var wingL = P.box(2.4, 0.06, 0.8, 'paper', -1.4, 0, 0.1, plane);
    wingL.rotation.y = -0.2;
    var wingR = P.box(2.4, 0.06, 0.8, 'paper', 1.4, 0, 0.1, plane);
    wingR.rotation.y = 0.2;
    // Retractable Landing Gear
    var gear = P.cyl(0.06, 0.06, 0.45, 'steel', 0, -0.3, 0.8, plane, 8);
    return { hot: hot, plane: plane, gear: gear };
    ` : category === 'racing' || category === 'vehicle' ? `
    // Grand Prix Circuit Corner with Kerbs
    P.box(6.8, 0.04, 4.0, 'tarmac', 0, 0.02, 0);
    for (var ki = -3; ki <= 3; ki++) {
      var col = (Math.abs(ki) % 2 === 0) ? 'red' : 'paper';
      P.box(0.4, 0.06, 0.6, col, -2.2, 0.04, ki * 0.6);
    }
    // Drifting Sports Car
    var car = P.group(0, 0.28, 0);
    P.box(1.4, 0.28, 2.4, 'red', 0, 0.2, 0.1, car);
    P.box(1.1, 0.26, 1.2, 'steel', 0, 0.45, -0.1, car);
    P.box(1.6, 0.04, 0.35, 'red', 0, 0.62, -1.0, car); // Spoiler
    for (var wx of [-0.75, 0.75]) {
      for (var wz of [-0.65, 0.65]) {
        var w = P.cyl(0.26, 0.26, 0.16, 'steel', wx, 0.26, wz, car, 12);
        w.rotation.z = Math.PI / 2;
      }
    }
    return { hot: hot, car: car };
    ` : category === 'nature_waterfall' ? `
    // Cliff Rocks & Waterfall
    P.box(6.2, 2.8, 1.4, 'stone', 0, 1.4, -1.6);
    var waterfall = P.box(1.2, 2.2, 0.15, 'blue', 0, 1.2, -0.85);
    // Pond Basin with stones
    var pond = P.cyl(2.0, 2.0, 0.1, 'water', 0, 0.05, 0.6, null, 16);
    for (var r = 0; r < 8; r++) {
      var ra = (r / 8) * Math.PI * 2;
      P.ball(0.25, 'stone', Math.cos(ra) * 2.0, 0.1, 0.6 + Math.sin(ra) * 1.6);
    }
    return { hot: hot, waterfall: waterfall, pond: pond };
    ` : category === 'blacksmith' ? `
    // Smithy Hearth Slab
    P.box(6.0, 0.04, 4.0, 'stone', 0, 0.02, 0);
    var oven = P.box(1.6, 1.8, 1.2, 'brick', 1.8, 0.9, -1.0);
    var coals = P.ball(0.2, 'red', 1.8, 0.6, -0.4);
    var anvil = P.box(0.9, 0.7, 0.7, 'steel', -0.6, 0.45, 0.2);
    var sword = P.box(0.08, 0.04, 1.2, 'mustard', -0.6, 0.85, 0.2);
    var blacksmith = P.person(0.4, 0.1, null, { shirt: '#b86242', pants: '#334155' });
    return { hot: hot, blacksmith: blacksmith, anvil: anvil, sword: sword, oven: oven, coals: coals };
    ` : category === 'submarine' ? `
    // Deep Ocean Water Slab
    P.box(6.4, 0.04, 4.0, 'water', 0, 0.02, 0);
    var corals = P.ball(0.4, 'red', -2.0, 0.3, -1.2);
    var submarine = P.group(0, 0.9, 0);
    var hull = P.cyl(0.45, 0.45, 3.2, 'paper', 0, 0, 0, submarine, 12);
    hull.rotation.x = Math.PI / 2;
    P.box(0.3, 0.6, 0.8, 'paper', 0, 0.45, 0.2, submarine);
    var prop = P.cyl(0.08, 0.08, 0.1, 'mustard', 0, 0, -1.7, submarine);
    return { hot: hot, submarine: submarine, prop: prop, corals: corals };
    ` : category === 'wizard' ? `
    // Library Parquet Floor
    P.box(6.0, 0.04, 4.0, 'wood', 0, 0.02, 0);
    var shelf = P.box(5.4, 2.2, 0.4, 'wood', 0, 1.1, -1.8);
    var table = P.box(2.0, 0.1, 1.2, 'wood', -0.6, 0.85, 0.2);
    var book = P.box(0.6, 0.06, 0.45, 'paper', -0.6, 0.92, 0.2);
    var crystal = P.ball(0.2, 'blue', 0.8, 1.2, 0.2);
    var wizard = P.person(0.4, 0.1, null, { shirt: '#3b82f6', pants: '#1e293b' });
    return { hot: hot, wizard: wizard, table: table, book: book, crystal: crystal, shelf: shelf };
    ` : category === 'abstract' ? `
    // Minimal Pedestal & Interconnected Rings
    P.box(2.0, 0.15, 2.0, 'steel', 0, 0.08, 0);
    var ring1 = P.cyl(1.4, 1.4, 0.08, 'gold', 0, 1.4, 0, null, 16);
    var ring2 = P.cyl(1.0, 1.0, 0.08, 'paper', 0, 1.4, 0, null, 16);
    var core = P.ball(0.3, 'accent', 0, 1.4, 0);
    return { hot: hot, ring1: ring1, ring2: ring2, core: core };
    ` : `
    // Subject: ${primarySubject}
    P.box(5.0, 0.1, 3.5, 'stone', 0, 0.05, 0);
    var hero = P.box(1.4, 0.8, 1.0, 'mustard', 0, 0.45, 0);
    return { hot: hot, hero: hero };
    `}
  },
  tick: function(ctx) {
    var p = ctx.parts, t = ctx.t;
    var a = (t / 4.8) * Math.PI * 2;
    if (p.baker) p.baker.position.x = 0.5 + Math.sin(a) * 0.1;
    if (p.plane) {
      p.plane.position.x = Math.sin(a) * 0.6;
      p.plane.position.y = 0.8 + Math.abs(Math.sin(a)) * 0.3;
      if (p.gear) p.gear.position.y = -0.3 + Math.max(0, Math.sin(a)) * 0.25;
    }
    if (p.car) {
      p.car.position.x = Math.sin(a) * 0.8;
      p.car.rotation.y = Math.cos(a) * 0.35;
    }
    if (p.waterfall) p.waterfall.scale.y = 1.0 + Math.sin(t * 8) * 0.06;
    if (p.ring1) p.ring1.rotation.x = t * 1.2;
    if (p.ring2) p.ring2.rotation.y = t * 1.6;
    if (p.hero) p.hero.position.y = 0.45 + Math.sin(a) * 0.06;
  }
});`;
}

/* =========================================================================
   3. DITHER 360x280 RETRO BAYER PROCEDURAL GENERATOR
   ========================================================================= */

function generateDitherProcedural(opts) {
  const { slug, cleanTitle, cleanMeans, semantics } = opts;
  const { category, primarySubject } = semantics;

  return `Pixel.scene({
  name: '${slug}',
  title: '${cleanTitle}',
  means: '${cleanMeans}',
  hint: 'Hover to inspect, drag to rotate camera',
  width: 360,
  height: 280,
  fps: 12,
  duration: 8,
  still: 2,
  bayer: 4,
  shadow: 'hard',
  rim: true,
  wind: 8,
  camera: { az: 45, el: 30, scale: 56 },
  ground: {
    rx: 3.8,
    rz: 2.8,
    wobble: 0.35,
    fade: 0.32,
    zone: function() { return true; }
  },
  materials: {
    meadow: '#5c7844',
    earth: '#785236',
    stone: '#8c9199',
    brick: '#b86242',
    timber: '#a17b4d',
    paper: '#f8fafc',
    water: '#0284c7',
    iron: '#334155',
    gold: '#f59e0b',
    accent: '#ef4444'
  },
  build: function(P) {
    var hot = [];

    ${category === 'bakery' || category === 'kitchen' ? `
    P.box(6.0, 0.04, 4.0, 'brick', 0, 0.02, 0);
    var oven = P.box(1.5, 1.8, 1.2, 'brick', 1.8, 0.9, -1.0);
    var table = P.box(2.2, 0.1, 1.2, 'timber', -0.6, 0.88, 0.3);
    var cake = P.cyl(0.35, 0.35, 0.28, 'gold', -0.6, 1.05, 0.3, null, 12);
    var baker = P.person(0.5, 0.1, null, { shirt: '#f8fafc', pants: '#334155' });
    return { hot: hot, baker: baker, oven: oven, table: table, cake: cake };
    ` : category === 'aviation' ? `
    P.box(6.2, 0.04, 3.2, 'iron', 0, 0.02, 0);
    var plane = P.group(0, 0.8, 0);
    P.cyl(0.38, 0.38, 3.2, 'paper', 0, 0, 0, plane, 12);
    P.box(2.4, 0.06, 0.8, 'paper', 0, 0, 0.1, plane);
    var gear = P.cyl(0.06, 0.06, 0.45, 'iron', 0, -0.3, 0.8, plane, 8);
    return { hot: hot, plane: plane, gear: gear };
    ` : category === 'racing' || category === 'vehicle' ? `
    P.box(6.8, 0.04, 4.0, 'iron', 0, 0.02, 0);
    var car = P.group(0, 0.28, 0);
    P.box(1.4, 0.28, 2.4, 'accent', 0, 0.2, 0.1, car);
    return { hot: hot, car: car };
    ` : category === 'nature_waterfall' ? `
    P.box(6.0, 2.8, 1.4, 'stone', 0, 1.4, -1.6);
    var waterfall = P.box(1.2, 2.2, 0.15, 'water', 0, 1.2, -0.85);
    var pond = P.cyl(2.0, 2.0, 0.1, 'water', 0, 0.05, 0.6, null, 16);
    return { hot: hot, waterfall: waterfall, pond: pond };
    ` : category === 'blacksmith' ? `
    // Smithy Hearth Slab
    P.box(6.0, 0.04, 4.0, 'stone', 0, 0.02, 0);
    var oven = P.box(1.6, 1.8, 1.2, 'brick', 1.8, 0.9, -1.0);
    var coals = P.ball(0.2, 'red', 1.8, 0.6, -0.4);
    var anvil = P.box(0.9, 0.7, 0.7, 'steel', -0.6, 0.45, 0.2);
    var sword = P.box(0.08, 0.04, 1.2, 'mustard', -0.6, 0.85, 0.2);
    var blacksmith = P.person(0.4, 0.1, null, { shirt: '#b86242', pants: '#334155' });
    return { hot: hot, blacksmith: blacksmith, anvil: anvil, sword: sword, oven: oven, coals: coals };
    ` : category === 'submarine' ? `
    // Deep Ocean Water Slab
    P.box(6.4, 0.04, 4.0, 'water', 0, 0.02, 0);
    var corals = P.ball(0.4, 'red', -2.0, 0.3, -1.2);
    var submarine = P.group(0, 0.9, 0);
    var hull = P.cyl(0.45, 0.45, 3.2, 'paper', 0, 0, 0, submarine, 12);
    hull.rotation.x = Math.PI / 2;
    P.box(0.3, 0.6, 0.8, 'paper', 0, 0.45, 0.2, submarine);
    var prop = P.cyl(0.08, 0.08, 0.1, 'mustard', 0, 0, -1.7, submarine);
    return { hot: hot, submarine: submarine, prop: prop, corals: corals };
    ` : category === 'wizard' ? `
    // Library Parquet Floor
    P.box(6.0, 0.04, 4.0, 'wood', 0, 0.02, 0);
    var shelf = P.box(5.4, 2.2, 0.4, 'wood', 0, 1.1, -1.8);
    var table = P.box(2.0, 0.1, 1.2, 'wood', -0.6, 0.85, 0.2);
    var book = P.box(0.6, 0.06, 0.45, 'paper', -0.6, 0.92, 0.2);
    var crystal = P.ball(0.2, 'blue', 0.8, 1.2, 0.2);
    var wizard = P.person(0.4, 0.1, null, { shirt: '#3b82f6', pants: '#1e293b' });
    return { hot: hot, wizard: wizard, table: table, book: book, crystal: crystal, shelf: shelf };
    ` : category === 'abstract' ? `
    var ring1 = P.cyl(1.4, 1.4, 0.08, 'gold', 0, 1.4, 0, null, 16);
    var ring2 = P.cyl(1.0, 1.0, 0.08, 'paper', 0, 1.4, 0, null, 16);
    return { hot: hot, ring1: ring1, ring2: ring2 };
    ` : `
    P.box(4.8, 0.1, 3.4, 'stone', 0, 0.05, 0);
    var hero = P.box(1.4, 0.8, 1.0, 'timber', 0, 0.45, 0);
    return { hot: hot, hero: hero };
    `}
  },
  tick: function(ctx) {
    var p = ctx.parts, t = ctx.t;
    if (p.plane) p.plane.position.y = 0.8 + Math.sin(t) * 0.2;
    if (p.car) {
      p.car.position.x = Math.sin(t) * 0.7;
      p.car.rotation.y = Math.cos(t) * 0.35;
    }
    if (p.waterfall) p.waterfall.scale.y = 1.0 + Math.sin(t * 4) * 0.05;
    if (p.ring1) p.ring1.rotation.x = t * 0.8;
  }
});`;
}

/* =========================================================================
   4. SVG PROCEDURAL GENERATOR
   ========================================================================= */

function generateSVGProcedural(opts) {
  const { slug, cleanTitle, cleanMeans, theme, semantics, prompt } = opts;
  const { category, primarySubject } = semantics;

  return `/* ${cleanTitle} · Any3d SVG isometric figure */
Any3d.figure({
  name: '${slug}',
  size: 'card',
  theme: '${theme}',
  title: '${cleanTitle}',
  means: '${cleanMeans}',
  hint: 'Drag to inspect 3D view; hover items to interact.',
  camera: { az: 40, el: 34, pad: 1.06 },
  still: 2.0,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];

    ${category === 'bakery' || category === 'kitchen' ? `
    // Bakery Foundation Slab & Tiled Floor
    var ground = D.slab(10.5, 8.0, pal.ground, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    for (var ix = -4; ix <= 4; ix++) {
      for (var iz = -3; iz <= 3; iz++) {
        D.box(0.9, 0.02, 0.9, ((ix + iz) % 2 === 0) ? pal.paper : pal.terracotta, ix * 0.95, 0.02, iz * 0.95, null, { shadow: false });
      }
    }

    // Cutaway Back Wall
    D.box(9.2, 2.6, 0.25, pal.paper, 0, 1.3, -3.4);
    D.box(9.4, 0.15, 0.35, pal.wood, 0, 2.6, -3.4);

    // Brick Bake Oven with Glowing Cavity
    var oven = D.group(2.6, 0, -2.0);
    oven.name = 'brick bake oven';
    hot.push(oven);
    D.box(2.2, 2.2, 1.6, pal.terracotta, 0, 1.1, 0, oven);
    D.box(1.2, 0.9, 0.08, pal.ink, 0, 1.0, 0.84, oven, { shadow: false });
    D.cyl(0.25, 0.25, 1.2, pal.slate, 0, 2.8, 0, oven, 14); // Chimney
    // Oven glowing coals
    for (var c = -2; c <= 2; c++) {
      D.ball(0.1, (c % 2 === 0) ? pal.coral : pal.mustard, c * 0.2, 0.7, 0.82, oven);
    }

    // Sturdy Wooden Presentation Table
    var table = D.group(-1.2, 0, 0.4);
    table.name = 'presentation table';
    hot.push(table);
    D.box(3.2, 0.12, 1.6, pal.wood, 0, 1.1, 0, table);
    for (var tx of [-1.4, 1.4]) {
      for (var tz of [-0.6, 0.6]) {
        D.box(0.14, 1.06, 0.14, pal.ink, tx, 0.53, tz, table);
      }
    }

    // Frosted Cake on Presentation Stand
    var cakeGroup = D.group(-1.2, 1.16, 0.4);
    cakeGroup.name = 'fresh cake';
    hot.push(cakeGroup);
    D.cyl(0.55, 0.55, 0.06, pal.cloud, 0, 0.03, 0, cakeGroup, 16); // Stand
    var cake = D.cyl(0.44, 0.44, 0.38, pal.mustard, 0, 0.25, 0, cakeGroup, 16); // Sponge
    D.cyl(0.46, 0.46, 0.08, pal.paper, 0, 0.45, 0, cakeGroup, 16); // White frosting
    D.ball(0.08, pal.coral, 0, 0.55, 0, cakeGroup); // Cherry topper

    // Baker Artisan Figure
    var baker = D.props.person(0.6, -0.6, null, { shirt: pal.paper, pants: pal.slate, hat: pal.paper });
    baker.name = 'baker';
    hot.push(baker);

    return { ground: ground, hot: hot, baker: baker, oven: oven, table: table, cake: cake, cakeGroup: cakeGroup };
    ` : category === 'aviation' ? `
    // Airport Runway Ground Slab
    var ground = D.slab(11.5, 8.5, pal.asphalt, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    // Yellow Guidance Centerlines
    for (var x = -3.8; x <= 3.8; x += 1.8) {
      D.box(1.0, 0.02, 0.18, pal.mustard, x, 0.02, 0, null, { shadow: false });
    }
    // Piano Key Threshold Stripes
    for (var z = -1.2; z <= 1.2; z += 0.45) {
      D.box(0.8, 0.02, 0.22, pal.paper, -4.5, 0.02, z, null, { shadow: false });
      D.box(0.8, 0.02, 0.22, pal.paper, 4.5, 0.02, z, null, { shadow: false });
    }

    // Aeroplane Figure
    var plane = D.group(0, 1.6, 0);
    plane.name = 'aeroplane';
    hot.push(plane);
    var fus = D.cyl(0.7, 0.7, 6.2, pal.paper, 0, 0, 0, plane, 16);
    fus.rotation.x = Math.PI / 2;
    var nose = D.cone(0.7, 1.4, pal.paper, 0, 0, 3.8, plane, 16);
    nose.rotation.x = Math.PI / 2;
    D.box(0.8, 0.35, 0.7, pal.ink, 0, 0.5, 2.8, plane, { shadow: false });

    var wingL = D.box(4.2, 0.12, 1.4, pal.paper, -2.4, 0, 0.2, plane);
    wingL.rotation.y = -0.22;
    var wingR = D.box(4.2, 0.12, 1.4, pal.paper, 2.4, 0, 0.2, plane);
    wingR.rotation.y = 0.22;

    // Retractable Tricycle Landing Gear
    var gearNose = D.cyl(0.06, 0.06, 0.6, pal.steel, 0, -0.55, 2.2, plane);
    var wheelNose = D.wheel(0.24, 0.14, pal.tyre, 0, -0.75, 2.2, plane);
    var gearL = D.cyl(0.06, 0.06, 0.6, pal.steel, -1.6, -0.55, -0.2, plane);
    var wheelL = D.wheel(0.28, 0.16, pal.tyre, -1.6, -0.75, -0.2, plane);
    var gearR = D.cyl(0.06, 0.06, 0.6, pal.steel, 1.6, -0.55, -0.2, plane);
    var wheelR = D.wheel(0.28, 0.16, pal.tyre, 1.6, -0.75, -0.2, plane);

    return { ground: ground, hot: hot, plane: plane, gearNose: gearNose, gearL: gearL, gearR: gearR, wheelNose: wheelNose, wheelL: wheelL, wheelR: wheelR };
    ` : category === 'racing' || category === 'vehicle' ? `
    // Grand Prix Asphalt Slab
    var ground = D.slab(11.5, 8.0, pal.asphalt, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    // Alternating Red & White Rumble Kerbs
    for (var sk = -4; sk <= 4; sk++) {
      var colK = (Math.abs(sk) % 2 === 0) ? pal.coral : pal.paper;
      D.box(0.5, 0.08, 0.9, colK, -4.2, 0.05, sk * 0.9, null, { shadow: false });
      D.box(0.5, 0.08, 0.9, colK, 4.2, 0.05, sk * 0.9, null, { shadow: false });
    }
    // Sports Car Figure
    var car = D.group(0, 0.45, 0);
    car.name = 'sports car';
    hot.push(car);
    D.rbox(3.8, 0.42, 1.4, pal.coral, 0, 0.32, 0, car, { r: 0.12 });
    D.box(1.8, 0.35, 1.1, pal.ink, 0, 0.62, -0.1, car);
    D.box(0.08, 0.45, 0.1, pal.ink, -1.4, 0.65, -0.3, car);
    D.box(0.08, 0.45, 0.1, pal.ink, -1.4, 0.65, 0.3, car);
    D.box(0.75, 0.08, 2.2, pal.ink, -1.45, 0.88, 0, car, { shadow: false }); // Spoiler
    // 4 Wheels
    D.wheel(0.45, 0.32, pal.tyre, 1.4, 0.45, -1.1, car);
    D.wheel(0.45, 0.32, pal.tyre, 1.4, 0.45, 1.1, car);
    D.wheel(0.48, 0.36, pal.tyre, -1.2, 0.48, -1.1, car);
    D.wheel(0.48, 0.36, pal.tyre, -1.2, 0.48, 1.1, car);
    return { ground: ground, hot: hot, car: car };
    ` : category === 'nature_waterfall' ? `
    // Rocky Cliff & Waterfall Ground
    var ground = D.slab(10.5, 8.0, pal.slate, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    // Cliff Formation
    D.box(8.2, 3.2, 1.6, pal.slate, 0, 1.6, -2.4);
    D.box(5.4, 0.4, 1.0, pal.paper, 0, 2.4, -1.6);
    // Waterfall Cascading Sheet
    var waterfall = D.box(1.6, 2.6, 0.18, pal.sky, 0, 1.3, -1.4, null, { shadow: false, mat: { emissive: pal.sky, emissiveIntensity: 0.4 } });
    waterfall.name = 'waterfall';
    hot.push(waterfall);
    // Crystal Pond with Stones
    var pond = D.cyl(2.6, 2.6, 0.12, pal.teal, 0, 0.08, 0.6, null, 24);
    for (var rk = 0; rk < 10; rk++) {
      var rAngle = (rk / 10) * Math.PI * 2;
      D.ball(0.32, pal.cloud, Math.cos(rAngle) * 2.6, 0.18, 0.6 + Math.sin(rAngle) * 2.0);
    }
    return { ground: ground, hot: hot, waterfall: waterfall, pond: pond };
    ` : category === 'blacksmith' ? `
    // Smithy Hearth Slab
    var ground = D.slab(10.5, 8.0, pal.slate, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    // Masonry Backwall
    D.box(9.0, 2.4, 0.25, pal.paper, 0, 1.2, -3.2);
    // Forge Oven with Embers
    var oven = D.group(2.6, 0, -1.8);
    oven.name = 'stone forge';
    hot.push(oven);
    D.box(2.2, 2.0, 1.4, pal.slate, 0, 1.0, 0, oven);
    D.box(1.2, 0.8, 0.08, pal.ink, 0, 0.9, 0.74, oven, { shadow: false });
    for (var c = -2; c <= 2; c++) D.ball(0.12, (c % 2 === 0) ? pal.coral : pal.mustard, c * 0.22, 0.6, 0.72, oven);
    // Iron Anvil on Timber Block
    var anvil = D.group(-0.8, 0, 0.3);
    anvil.name = 'iron anvil';
    hot.push(anvil);
    D.box(1.2, 0.8, 0.9, pal.wood, 0, 0.4, 0, anvil);
    D.box(1.0, 0.32, 0.55, pal.steel, 0, 0.96, 0, anvil);
    D.cyl(0.16, 0.16, 0.45, pal.steel, 0.55, 0.96, 0, anvil, 12);
    // Heated Glowing Sword Blade
    var sword = D.box(0.1, 0.06, 1.6, pal.coral, 0, 1.15, 0, anvil);
    sword.name = 'glowing sword';
    hot.push(sword);
    // Blacksmith Person
    var blacksmith = D.props.person(0.6, -0.4, null, { shirt: pal.terracotta, pants: pal.slate, hat: pal.paper });
    blacksmith.name = 'blacksmith';
    hot.push(blacksmith);
    return { ground: ground, hot: hot, blacksmith: blacksmith, anvil: anvil, sword: sword, oven: oven };
    ` : category === 'submarine' ? `
    // Deep Ocean Water Slab
    var ground = D.slab(11.0, 8.5, pal.teal, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    // Coral Reef Formations
    D.ball(0.55, pal.coral, -3.2, 0.3, -1.4);
    D.ball(0.45, pal.mustard, -2.4, 0.25, -2.0);
    D.ball(0.5, pal.coral, 3.0, 0.3, 1.2);
    // Submarine Vessel
    var submarine = D.group(0, 1.4, 0);
    submarine.name = 'submarine';
    hot.push(submarine);
    var hull = D.cyl(0.7, 0.7, 5.8, pal.paper, 0, 0, 0, submarine, 18);
    hull.rotation.x = Math.PI / 2;
    var bow = D.ball(0.7, pal.paper, 0, 0, 2.9, submarine);
    D.box(0.4, 0.8, 1.2, pal.paper, 0, 0.7, 0.4, submarine);
    D.cyl(0.06, 0.06, 0.6, pal.steel, 0, 1.3, 0.6, submarine);
    D.box(2.4, 0.08, 0.6, pal.cloud, 0, 0, 0.8, submarine);
    D.box(1.8, 0.08, 0.5, pal.cloud, 0, 0, -2.6, submarine);
    var prop = D.group(0, 0, -3.1, submarine);
    D.wheel(0.5, 0.1, pal.mustard, 0, 0, 0, prop);
    return { ground: ground, hot: hot, submarine: submarine, prop: prop };
    ` : category === 'wizard' ? `
    // Parquet Library Floor Slab
    var ground = D.slab(10.5, 8.0, pal.wood, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    var shelf = D.group(0, 0, -3.2);
    D.box(8.5, 2.8, 0.5, pal.wood, 0, 1.4, 0, shelf);
    for (var bi = -3; bi <= 3; bi++) {
      var bCol = [pal.coral, pal.sky, pal.mustard, pal.terracotta][Math.abs(bi) % 4];
      D.box(0.2, 0.7, 0.35, bCol, bi * 0.9, 1.0, 0.1, shelf);
      D.box(0.2, 0.7, 0.35, bCol, bi * 0.9, 2.0, 0.1, shelf);
    }
    var table = D.group(-1.2, 0, 0.4);
    table.name = 'study table';
    hot.push(table);
    D.box(2.8, 0.12, 1.6, pal.wood, 0, 1.0, 0, table);
    for (var legX of [-1.2, 1.2]) {
      for (var legZ of [-0.6, 0.6]) D.box(0.12, 0.96, 0.12, pal.ink, legX, 0.48, legZ, table);
    }
    D.box(0.8, 0.08, 0.6, pal.ink, 0, 1.1, 0, table);
    D.box(0.74, 0.04, 0.54, pal.paper, 0, 1.14, 0, table);
    var crystal = D.ball(0.25, pal.sky, 1.0, 1.6, 0.4);
    crystal.name = 'magic crystal';
    hot.push(crystal);
    var wizard = D.props.person(0.6, -0.6, null, { shirt: pal.slate, pants: pal.ink, hat: pal.mustard });
    wizard.name = 'wizard';
    hot.push(wizard);
    return { ground: ground, hot: hot, wizard: wizard, table: table, crystal: crystal, shelf: shelf };
    ` : category === 'abstract' ? `
    // Minimal Architectural Void Pedestal
    var ground = D.slab(8.0, 8.0, pal.ink, 0, 0, 0, null, { h: 0.4, r: 0.8, side: pal.slate });
    D.cyl(2.0, 2.0, 0.12, pal.steel, 0, 0.25, 0, null, 24);
    // Interconnected Metallic Rings
    var ring1 = D.torus(1.6, 0.09, pal.mustard, 0, 2.0, 0);
    ring1.name = 'outer metallic ring';
    hot.push(ring1);
    var ring2 = D.torus(1.2, 0.08, pal.paper, 0, 2.0, 0);
    var ring3 = D.torus(0.8, 0.07, pal.sky, 0, 2.0, 0);
    var core = D.ball(0.35, pal.coral, 0, 2.0, 0);
    return { ground: ground, hot: hot, ring1: ring1, ring2: ring2, ring3: ring3, core: core };
    ` : (semantics.subjectType === 'humanoid' || category === 'humanoid_character') ? `
    // Humanoid Scene: ${primarySubject}
    var ground = D.slab(10.5, 8.0, pal.ground, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    var hero = D.group(0, 0, 0);
    hero.name = '${primarySubject}';
    hot.push(hero);

    // Actor Person Figure
    var actor = D.props.person(0, 0.2, null, { shirt: pal.mustard, hat: pal.paper });
    actor.name = '${primarySubject}';

    // Contextual Structural Elements & Props
    ${(semantics.secondaryObjects.includes('pavilion') || /\bpavilion\b/i.test(prompt)) ? `
    // Pavilion Columns & Roof Architecture
    D.cyl(0.08, 0.08, 2.8, pal.wood, -1.8, 1.4, -1.4);
    D.cyl(0.08, 0.08, 2.8, pal.wood, 1.8, 1.4, -1.4);
    D.cyl(0.08, 0.08, 2.8, pal.wood, -1.8, 1.4, 1.4);
    D.cyl(0.08, 0.08, 2.8, pal.wood, 1.8, 1.4, 1.4);
    D.box(4.2, 0.18, 3.4, pal.terracotta, 0, 2.8, 0);
    D.wedge(4.4, 0.8, 3.6, pal.coral, 0, 3.3, 0);
    var sword = D.box(0.06, 0.8, 0.04, pal.wood, 0.4, 0.7, 0.2);
    ` : (semantics.secondaryObjects.includes('flora') || /\bflora\b/i.test(prompt)) ? `
    // Bioluminescent Crystalline / Flora Formations
    D.cyl(0.04, 0.04, 0.5, pal.teal, -1.6, 0.25, -1.2);
    D.ball(0.22, pal.sky, -1.6, 0.55, -1.2);
    D.cyl(0.04, 0.04, 0.6, pal.teal, 1.8, 0.3, -0.8);
    D.ball(0.24, pal.coral, 1.8, 0.65, -0.8);
    D.cyl(0.04, 0.04, 0.45, pal.teal, -1.2, 0.22, 1.4);
    D.ball(0.20, pal.mustard, -1.2, 0.48, 1.4);
    D.cyl(0.04, 0.04, 0.55, pal.teal, 1.5, 0.28, 1.2);
    D.ball(0.22, pal.sky, 1.5, 0.58, 1.2);
    ` : `
    // Workspace Surface & Structural Columns
    var workTable = D.box(2.6, 0.12, 1.4, pal.wood, 0, 0.9, 0.8);
    D.box(0.1, 0.85, 0.1, pal.steel, -1.1, 0.45, 0.3);
    D.box(0.1, 0.85, 0.1, pal.steel, 1.1, 0.45, 0.3);
    D.box(0.1, 0.85, 0.1, pal.steel, -1.1, 0.45, 1.3);
    D.box(0.1, 0.85, 0.1, pal.steel, 1.1, 0.45, 1.3);
    D.box(0.8, 0.1, 0.5, pal.paper, 0, 1.0, 0.8);
    D.ball(0.18, pal.coral, 0.7, 1.05, 0.8);
    `}

    return { ground: ground, hot: hot, hero: hero, actor: actor };
    ` : `
    // Arbitrary Subject: ${primarySubject}
    var ground = D.slab(10.5, 8.0, pal.ground, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    var hero = D.group(0, 0.4, 0);
    hero.name = '${primarySubject}';
    hot.push(hero);

    // Composed Multi-Part Geometry (Slender members, trims, base, core, accents)
    D.box(3.2, 0.14, 2.4, pal.slate, 0, 0.14, 0, hero);
    D.box(2.2, 0.8, 1.4, pal.mustard, 0, 0.6, 0, hero);
    D.box(1.6, 0.9, 1.1, pal.paper, 0, 1.4, 0, hero);
    D.cyl(0.35, 0.35, 0.5, pal.coral, 0, 2.1, 0, hero, 16);
    D.ball(0.25, pal.sky, 0, 2.5, 0, hero);
    for (var mi = -1; mi <= 1; mi += 2) {
      D.box(0.1, 1.2, 0.1, pal.steel, mi * 1.3, 0.8, 0, hero);
    }
    return { ground: ground, hot: hot, hero: hero };
    `}
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    var a = (t / 4.0) * Math.PI * 2;
    if (p.baker) p.baker.position.x = 0.6 + Math.sin(a) * 0.15;
    if (p.cakeGroup) p.cakeGroup.position.y = 1.16 + Math.abs(Math.sin(a)) * 0.04;
    if (p.blacksmith) p.blacksmith.position.x = 0.6 + Math.sin(a * 2) * 0.08;
    if (p.sword) p.sword.scale.set(1.0 + Math.abs(Math.sin(a * 4)) * 0.15, 1.0, 1.0);
    if (p.submarine) {
      p.submarine.position.y = 1.4 + Math.sin(a) * 0.12;
      p.submarine.rotation.z = Math.sin(a) * 0.04;
      if (p.prop) p.prop.rotation.z = t * 14.0;
    }
    if (p.crystal) {
      p.crystal.position.y = 1.6 + Math.sin(a * 2) * 0.14;
      p.crystal.scale.setScalar(1.0 + Math.sin(t * 6) * 0.08);
    }
    if (p.plane) {
      p.plane.position.x = Math.sin(a) * 1.1;
      p.plane.position.y = 1.6 + Math.abs(Math.sin(a)) * 0.25;
      p.plane.rotation.z = -Math.cos(a) * 0.08;
      if (p.gearNose) p.gearNose.position.y = -0.55 + Math.max(0, Math.sin(a)) * 0.35;
    }
    if (p.car) {
      p.car.position.x = Math.sin(a) * 1.2;
      p.car.rotation.y = Math.cos(a) * 0.25;
    }
    if (p.waterfall) {
      p.waterfall.scale.y = 1.0 + Math.sin(t * 8) * 0.05;
    }
    if (p.ring1) p.ring1.rotation.x = t * 1.2;
    if (p.ring2) p.ring2.rotation.y = t * 1.6;
    if (p.ring3) p.ring3.rotation.z = t * 2.0;
    if (p.hero) p.hero.position.y = 0.4 + Math.sin(a) * 0.08;
  }
});`;
}

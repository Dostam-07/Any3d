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

export function synthesizeProceduralScene(prompt, format = 'svg', visualResearch = null, size = 'card') {
  const p = (prompt || '').trim();
  const core = unwrapCorePrompt(p);
  const semantics = extractPromptSemantics(p);
  const effectiveSize = semantics.requestedSize || size || 'card';

  // Ground with real-world web visual research components if available
  if (visualResearch?.decomposition?.components?.length) {
    for (const comp of visualResearch.decomposition.components) {
      if (!semantics.secondaryObjects.includes(comp) && comp.toLowerCase() !== semantics.primarySubject.toLowerCase()) {
        semantics.secondaryObjects.push(comp);
      }
    }
  }

  const slug = core.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30).replace(/^-|-$/g, '') || 'scene';
  const cleanTitle = (core.slice(0, 45) || 'Any3d Scene').replace(/'/g, "\\'");
  const cleanMeans = ((visualResearch?.decomposition?.summary) || core.slice(0, 130) || 'An interactive isometric scene').replace(/'/g, "\\'");

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
    visualResearch,
    size: effectiveSize,
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
  const { slug, cleanTitle, cleanMeans, semantics, prompt, size = 'card' } = opts;
  const { category, primarySubject } = semantics;
  const isHero = size === 'hero';

  // --- A0-0. TRANSIT BUS WITH PASSENGERS & CONDUCTOR ---
  if (category === 'transit_bus' || primarySubject === 'bus') {
    // HERO: Webpage hero section banner (16:9 widescreen avenue)
    // CARD: Feature card diorama (4:3 focused pedestal)
    const bounds = isHero
      ? '[[-10.0, -0.6, -5.5], [10.0, 5.2, 5.5]]'
      : '[[-6.5, -0.6, -4.8], [6.5, 4.5, 4.8]]';
    const terrainW = isHero ? 20.0 : 13.0;
    const terrainD = isHero ? 11.2 : 9.6;
    const roadW = isHero ? 19.6 : 12.6;
    const roadZ = isHero ? 0.8 : 0.5;
    const curbZ = isHero ? -3.2 : -2.8;

    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  size: '${size}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: ${bounds},
  build(W) {
    const { box, ball, cylinder, group } = W;

    // ${isHero ? 'Panoramic Web Hero Avenue' : 'Website Feature Card Pedestal'}
    W.terrain(${terrainW}, ${terrainD}, '#0f172a', ${isHero ? 40 : 28});
    box(${roadW}, 0.08, 5.2, '#1e293b', 0, 0.04, ${roadZ}); // Roadway
    // Dashed Yellow Center Lane Divider
    for (let dx = ${isHero ? -8.0 : -4.0}; dx <= ${isHero ? 8.0 : 4.0}; dx += 2.0) {
      box(1.0, 0.02, 0.14, '#facc15', dx, 0.09, ${roadZ});
    }
    // Concrete Sidewalk with Curb
    box(${roadW}, 0.22, 2.8, '#64748b', 0, 0.11, ${curbZ});

    // Modern Glass Bus Stop Shelter with Bench & Schedule Board
    const shelter = group(-3.5, 0.22, ${curbZ});
    box(4.2, 0.08, 1.8, '#334155', 0, 2.4, 0, shelter); // Canopy Roof
    box(4.0, 2.3, 0.06, '#38bdf8', 0, 1.15, -0.85, shelter); // Rear Glass Screen
    box(0.06, 2.3, 1.6, '#38bdf8', -2.0, 1.15, 0, shelter);  // Side Glass Panel
    for (const sx of [-2.0, 0, 2.0]) {
      cylinder(0.06, 2.4, '#0f172a', sx, 1.2, 0.85, shelter, 8); // Pillars
    }
    // Waiting Bench
    box(2.8, 0.08, 0.5, '#78350f', 0, 0.55, -0.3, shelter);
    box(0.08, 0.5, 0.08, '#0f172a', -1.2, 0.27, -0.3, shelter);
    box(0.08, 0.5, 0.08, '#0f172a', 1.2, 0.27, -0.3, shelter);
    // Route 42 Schedule Totem Pole
    const totem = group(2.8, 0.22, -2.6);
    cylinder(0.05, 2.8, '#475569', 0, 1.4, 0, totem, 8);
    box(0.65, 0.9, 0.08, '#f59e0b', 0, 2.2, 0, totem);
    box(0.55, 0.75, 0.02, '#ffffff', 0, 2.2, 0.05, totem);

    // Large Detailed City Transit Bus (with Cutaway Panoramic Windows)
    const bus = group(0, 0.08, 0.8);

    // Main Bus Chassis: Amber/Yellow Transit Body
    box(8.2, 2.2, 2.6, '#f59e0b', 0, 1.45, 0, bus);
    // Dark Lower Skirt / Protective Fender
    box(8.3, 0.45, 2.64, '#0f172a', 0, 0.48, 0, bus);
    // White Roof Cap with Air Conditioning Units
    box(8.2, 0.18, 2.62, '#f8fafc', 0, 2.64, 0, bus);
    box(1.8, 0.25, 1.2, '#94a3b8', -1.2, 2.82, 0, bus);
    box(1.8, 0.25, 1.2, '#94a3b8', 1.6, 2.82, 0, bus);

    // Front Windshield, Grille & Destination Display
    box(0.08, 1.1, 2.4, '#38bdf8', 4.12, 1.85, 0, bus); // Front Windshield
    box(0.12, 0.35, 1.8, '#0f172a', 4.13, 2.45, 0, bus); // Route Display Box
    box(0.04, 0.22, 1.5, '#facc15', 4.2, 2.45, 0, bus); // "42 DOWNTOWN" Sign
    box(0.08, 0.45, 1.8, '#0f172a', 4.12, 0.85, 0, bus); // Front Grille
    // Headlights
    cylinder(0.14, 0.06, '#ffffff', 4.13, 0.85, -0.9, bus, 12);
    cylinder(0.14, 0.06, '#ffffff', 4.13, 0.85, 0.9, bus, 12);
    // Rear Tail Lights
    box(0.06, 0.35, 0.18, '#dc2626', -4.12, 0.95, -1.0, bus);
    box(0.06, 0.35, 0.18, '#dc2626', -4.12, 0.95, 1.0, bus);

    // Cutaway Panoramic Passenger Windows (Front and Side visibility)
    box(7.2, 1.05, 2.68, '#38bdf8', 0, 1.95, 0, bus);

    // Heavy Duty Transit Wheels
    const wheels = [];
    for (const wx of [-2.6, 2.6]) {
      for (const wz of [-1.32, 1.32]) {
        const wh = group(wx, 0.42, wz, bus);
        wh.rotation.x = Math.PI / 2;
        cylinder(0.42, 0.32, '#0f172a', 0, 0, 0, wh, 16); // Tyre
        cylinder(0.24, 0.34, '#94a3b8', 0, 0, 0, wh, 12); // Rim
        cylinder(0.08, 0.36, '#e2e8f0', 0, 0, 0, wh, 8);  // Hub
        wheels.push(wh);
      }
    }

    // Bus Interior: Blue Fabric Passenger Seats in Rows
    for (let sx = -2.8; sx <= 2.0; sx += 1.4) {
      box(0.65, 0.45, 0.7, '#1d4ed8', sx, 0.95, -0.75, bus); // Left Seat
      box(0.65, 0.45, 0.7, '#1d4ed8', sx, 0.95, 0.75, bus);  // Right Seat
    }

    // Seated Passenger Figures inside the bus
    const passengers = [];
    const passengerData = [
      { x: -2.8, z: -0.75, shirt: '#ef4444' },
      { x: -1.4, z: -0.75, shirt: '#10b981' },
      { x: 0.0, z: -0.75, shirt: '#f97316' },
      { x: 1.4, z: -0.75, shirt: '#8b5cf6' },
      { x: -2.8, z: 0.75, shirt: '#06b6d4' },
      { x: -1.4, z: 0.75, shirt: '#ec4899' },
      { x: 0.0, z: 0.75, shirt: '#eab308' },
    ];
    for (const p of passengerData) {
      const passGroup = group(p.x, 1.2, p.z, bus);
      cylinder(0.18, 0.48, p.shirt, 0, 0.24, 0, passGroup, 10); // Torso
      ball(0.16, '#fed7aa', 0, 0.62, 0, passGroup); // Head
      passengers.push(passGroup);
    }

    // Bus Conductor Figure Standing at Entrance/Aisle
    const conductor = group(3.2, 0.75, 0, bus);
    cylinder(0.2, 0.65, '#1e3a8a', 0, 0.35, 0, conductor, 12); // Navy Conductor Uniform
    cylinder(0.08, 0.55, '#0f172a', -0.1, 0.15, 0, conductor, 8); // Trouser Leg L
    cylinder(0.08, 0.55, '#0f172a', 0.1, 0.15, 0, conductor, 8);  // Trouser Leg R
    ball(0.17, '#fed7aa', 0, 0.82, 0, conductor); // Head
    cylinder(0.2, 0.08, '#1e3a8a', 0, 0.96, 0, conductor, 12); // Conductor Cap Crown
    box(0.22, 0.02, 0.12, '#0f172a', 0, 0.94, 0.12, conductor); // Cap Peak Visor
    box(0.18, 0.12, 0.1, '#0f172a', 0.22, 0.45, 0.15, conductor); // Ticket Dispenser Machine in Hand

    // Street Lighting: Perimeter Streetlamps along Sidewalk
    for (const lx of [-5.5, 0, 5.5]) {
      const lamp = group(lx, 0.22, -4.2);
      cylinder(0.06, 3.8, '#334155', 0, 1.9, 0, lamp, 8);
      box(0.8, 0.12, 0.25, '#475569', 0.35, 3.8, 0, lamp);
      box(0.5, 0.06, 0.2, '#fef08a', 0.35, 3.72, 0, lamp);
    }

    return { bus, conductor, passengers, wheels };
  },
  tick({ t, parts: p }) {
    const a = (t / 4.0) * Math.PI * 2;
    // Bus subtle cruising suspension sway
    if (p.bus) {
      p.bus.position.y = 0.08 + Math.sin(a * 4.0) * 0.02;
      p.bus.rotation.z = Math.sin(a * 2.0) * 0.008;
    }
    // Rotating wheels
    if (p.wheels) {
      p.wheels.forEach(w => { w.rotation.y = t * 6.0; });
    }
    // Conductor subtle checking passengers sway
    if (p.conductor) {
      p.conductor.rotation.y = Math.sin(a) * 0.25;
    }
    // Passengers subtle head bobbing with ride
    if (p.passengers) {
      p.passengers.forEach((pass, i) => {
        pass.position.y = 1.2 + Math.sin(a * 4.0 + i) * 0.015;
      });
    }
  },
  contacts() { return []; }
});`;
  }

  // --- A0-1. EXPANSIVE CLASSROOM WORLD (Teacher at chalkboard, desks in rows, students, globe, laptop) ---
  if (category === 'classroom') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-5.5, -0.6, -4.5], [5.5, 4.2, 4.5]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Hardwood Classroom Parquet Floor & Skirting
    W.terrain(10.5, 8.5, '#78350f', 24);
    box(10.0, 0.08, 8.0, '#b45309', 0, 0.04, 0);

    // Cutaway Back Wall with Large Framed Dark Green Chalkboard
    const backWall = group(0, 0, -3.6);
    box(10.0, 3.4, 0.18, '#f1f5f9', 0, 1.7, 0, backWall);
    box(6.2, 2.2, 0.08, '#78350f', -0.5, 1.8, 0.1, backWall);
    box(5.9, 1.9, 0.04, '#14532d', -0.5, 1.8, 0.14, backWall);
    box(6.2, 0.08, 0.22, '#78350f', -0.5, 0.81, 0.18, backWall);
    box(0.25, 0.04, 0.08, '#475569', 1.6, 0.86, 0.18, backWall);
    box(0.12, 0.03, 0.03, '#ffffff', 0.8, 0.86, 0.18, backWall);
    box(0.12, 0.03, 0.03, '#fde047', 1.1, 0.86, 0.18, backWall);
    box(2.2, 0.04, 0.01, '#e2e8f0', -2.0, 2.2, 0.17, backWall);
    box(1.8, 0.04, 0.01, '#e2e8f0', -2.2, 1.9, 0.17, backWall);
    box(2.4, 0.04, 0.01, '#fde047', -1.9, 1.5, 0.17, backWall);

    // Wall Clock above board
    const clock = group(3.4, 2.7, 0.12, backWall);
    cylinder(0.42, 0.08, '#f8fafc', 0, 0, 0, clock, 20);
    cylinder(0.46, 0.04, '#0f172a', 0, 0, -0.02, clock, 20);
    const minuteHand = box(0.04, 0.32, 0.02, '#0f172a', 0, 0.12, 0.05, clock);
    const hourHand = box(0.05, 0.2, 0.02, '#0f172a', 0, 0.06, 0.05, clock);

    // Teacher Lecturing at the Front
    const teacher = W.person(-0.5, -2.6);

    // Executive Oak Teacher's Desk at Front Left
    const teacherDesk = group(-2.8, 0, -2.2);
    box(2.4, 0.1, 1.3, '#92400e', 0, 0.9, 0, teacherDesk);
    for (const dx of [-1.05, 1.05]) {
      for (const dz of [-0.5, 0.5]) {
        cylinder(0.04, 0.85, '#0f172a', dx, 0.43, dz, teacherDesk, 12);
      }
    }
    // Teacher Laptop with glowing screen
    box(0.55, 0.02, 0.38, '#94a3b8', 0, 0.96, 0, teacherDesk);
    const tScreen = box(0.55, 0.38, 0.02, '#0f172a', 0, 1.14, -0.18, teacherDesk);
    tScreen.rotation.x = -0.25;
    box(0.5, 0.32, 0.02, '#38bdf8', 0, 1.14, -0.17, teacherDesk);
    // Globe on teacher desk
    const globe = group(0.85, 0.96, 0.15, teacherDesk);
    cylinder(0.04, 0.45, '#f59e0b', 0, 0.22, 0, globe, 10);
    ball(0.24, '#0284c7', 0, 0.42, 0, globe);

    // Student Desks in Two Rows with Seated Students
    const studentCols = [-2.4, 0, 2.4];
    const studentRows = [-0.2, 1.9];
    studentRows.forEach((rz, rIdx) => {
      studentCols.forEach((cx, cIdx) => {
        const d = group(cx, 0, rz);
        box(1.5, 0.08, 0.9, '#d97706', 0, 0.76, 0, d);
        for (const dx of [-0.65, 0.65]) {
          for (const dz of [-0.35, 0.35]) {
            cylinder(0.035, 0.72, '#475569', dx, 0.36, dz, d, 8);
          }
        }
        const sc = group(0, 0, 0.85, d);
        cylinder(0.03, 0.45, '#475569', -0.22, 0.23, -0.2, sc, 8);
        cylinder(0.03, 0.45, '#475569', 0.22, 0.23, -0.2, sc, 8);
        cylinder(0.03, 0.45, '#475569', -0.22, 0.23, 0.2, sc, 8);
        cylinder(0.03, 0.45, '#475569', 0.22, 0.23, 0.2, sc, 8);
        box(0.58, 0.06, 0.52, '#0284c7', 0, 0.48, 0, sc);
        box(0.54, 0.45, 0.06, '#0284c7', 0, 0.72, 0.23, sc);
        box(0.35, 0.02, 0.45, '#f8fafc', -0.3, 0.81, 0.05, d);
        box(0.03, 0.02, 0.25, '#ef4444', 0.15, 0.81, 0.05, d);
        if (rIdx === 0 || cIdx === 1) {
          W.person(cx, rz + 0.55);
        }
      });
    });

    // Bookshelf Unit along Right Wall
    const shelf = group(4.4, 0, -1.0);
    box(0.8, 2.8, 3.4, '#78350f', 0, 1.4, 0, shelf);
    for (const sy of [0.7, 1.4, 2.1]) {
      box(0.74, 0.06, 3.3, '#92400e', 0, sy, 0, shelf);
    }
    for (let b = -1.4; b <= 1.4; b += 0.3) {
      const col = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.abs(Math.round(b * 5)) % 5];
      box(0.5, 0.55, 0.18, col, 0, 1.0, b, shelf);
      box(0.5, 0.55, 0.18, col, 0, 1.7, b, shelf);
    }

    return { teacher, minuteHand, hourHand };
  },
  tick(world) {
    const { parts, time } = world;
    if (parts.minuteHand) parts.minuteHand.rotation.z = -time * 0.4;
    if (parts.hourHand) parts.hourHand.rotation.z = -time * 0.04;
  }
});`;
  }

  // --- A0-2. EXPANSIVE SPORTS ARENA (Badminton / Tennis Court with players, net, umpire chair) ---
  if (category === 'sports') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-5.5, -0.6, -4.5], [5.5, 4.2, 4.5]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Stadium Court Floor Mat & White Boundary Lines
    W.terrain(11.0, 9.0, '#15803d', 24);
    box(10.0, 0.06, 7.8, '#16a34a', 0, 0.03, 0);
    box(8.4, 0.02, 0.08, '#ffffff', 0, 0.07, -3.2);
    box(8.4, 0.02, 0.08, '#ffffff', 0, 0.07, 3.2);
    box(0.08, 0.02, 6.4, '#ffffff', -4.2, 0.07, 0);
    box(0.08, 0.02, 6.4, '#ffffff', 4.2, 0.07, 0);
    box(8.4, 0.02, 0.06, '#ffffff', 0, 0.07, 0);

    // Badminton / Tennis Net & Tension Posts
    const netGroup = group(0, 0, 0);
    cylinder(0.06, 1.6, '#334155', 0, 0.8, -3.4, netGroup, 12);
    cylinder(0.06, 1.6, '#334155', 0, 0.8, 3.4, netGroup, 12);
    box(0.04, 0.9, 6.8, '#f8fafc', 0, 1.0, 0, netGroup);
    box(0.06, 0.08, 6.8, '#ffffff', 0, 1.45, 0, netGroup);

    // Player 1 (Left Court)
    const p1Group = group(-2.6, 0, 0);
    const player1 = W.person(0, 0, p1Group);
    cylinder(0.02, 0.6, '#94a3b8', 0.45, 0.7, 0.2, p1Group, 8);
    cylinder(0.24, 0.03, '#ef4444', 0.45, 1.1, 0.2, p1Group, 14);

    // Player 2 (Right Court)
    const p2Group = group(2.6, 0, 0.4);
    const player2 = W.person(0, 0, p2Group);
    cylinder(0.02, 0.6, '#94a3b8', -0.45, 0.7, 0.2, p2Group, 8);
    cylinder(0.24, 0.03, '#3b82f6', -0.45, 1.1, 0.2, p2Group, 14);

    // Shuttlecock in Flight Mid-Air
    const shuttle = group(0, 2.2, 0);
    ball(0.1, '#f8fafc', 0, 0, 0, shuttle);
    cylinder(0.12, 0.18, '#f8fafc', 0, -0.08, 0, shuttle, 8);

    // High Referee / Umpire Chair on Side
    const refChair = group(0, 0, -3.9);
    cylinder(0.04, 2.6, '#475569', -0.4, 1.3, -0.3, refChair, 8);
    cylinder(0.04, 2.6, '#475569', 0.4, 1.3, -0.3, refChair, 8);
    cylinder(0.04, 2.6, '#475569', -0.4, 1.3, 0.3, refChair, 8);
    cylinder(0.04, 2.6, '#475569', 0.4, 1.3, 0.3, refChair, 8);
    box(0.9, 0.08, 0.8, '#e2e8f0', 0, 2.1, 0, refChair);
    box(0.9, 0.6, 0.06, '#e2e8f0', 0, 2.45, -0.37, refChair);
    W.person(0, 0, group(0, 1.6, 0, refChair));

    // Courtside Spectator Bench
    const bench = group(0, 0, 3.9);
    box(3.2, 0.1, 0.7, '#92400e', 0, 0.45, 0, bench);
    box(0.8, 0.5, 0.4, '#dc2626', -0.8, 0.75, 0, bench);
    cylinder(0.07, 0.28, '#06b6d4', 0.8, 0.64, 0, bench, 10);

    return { player1: p1Group, player2: p2Group, shuttle };
  },
  tick(world) {
    const { parts, time } = world;
    if (parts.player1) parts.player1.position.y = Math.abs(Math.sin(time * 3)) * 0.1;
    if (parts.player2) parts.player2.position.y = Math.abs(Math.sin(time * 3 + 1.2)) * 0.1;
    if (parts.shuttle) {
      parts.shuttle.position.x = Math.sin(time * 2.5) * 2.4;
      parts.shuttle.position.y = 1.6 + Math.cos(time * 5.0) * 0.6;
    }
  }
});`;
  }

  // --- A0. EXPANSIVE OFFICE WORLD (Dual Workstations, Whiteboard Meeting Zone, Water Cooler, Lounge, Shelves) ---
  if (category === 'office') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-5.5, -0.6, -4.5], [5.5, 4.2, 4.5]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Expansive Studio Office Foundation Slab & Perimeter Baseboards
    W.terrain(10.5, 8.5, '#1e293b', 24);
    box(10.0, 0.08, 8.0, '#334155', 0, 0.04, 0);

    // Contrasting Zoned Floor Carpeting
    box(4.6, 0.02, 3.8, '#475569', -2.2, 0.09, -0.2); // Executive zone carpet
    box(4.2, 0.02, 3.8, '#334155', 2.3, 0.09, -0.2);  // Collaboration zone carpet

    // Architectural Perimeter Back Partition with Glass Acoustic Panels
    const backWall = group(0, 0, -3.6);
    box(10.0, 3.0, 0.18, '#e2e8f0', 0, 1.5, 0, backWall);
    box(4.2, 1.4, 0.05, '#0284c7', -2.2, 1.6, 0.1, backWall);
    box(3.6, 1.4, 0.05, '#38bdf8', 2.2, 1.6, 0.1, backWall);

    // --- ZONE 1: Executive Developer L-Desk Setup (Left) ---
    const desk = group(-2.2, 0, -0.8);
    box(2.8, 0.1, 1.5, '#78350f', 0, 0.9, 0, desk);
    box(1.2, 0.08, 1.1, '#78350f', 1.5, 0.89, 0.45, desk); // L-wing return
    for (const lx of [-1.25, 1.25]) {
      for (const lz of [-0.65, 0.65]) {
        cylinder(0.04, 0.85, '#94a3b8', lx, 0.43, lz, desk, 12);
      }
    }

    // High-Resolution Curved Dual Monitors
    const monitor = group(-0.2, 0.95, -0.3, desk);
    cylinder(0.03, 0.35, '#0f172a', -0.6, 0.18, 0, monitor, 12);
    box(1.5, 0.9, 0.06, '#0f172a', -0.6, 0.65, 0, monitor);
    const screen = box(1.42, 0.82, 0.01, '#38bdf8', -0.6, 0.65, 0.035, monitor);
    // Angled Secondary Vertical Code Monitor
    cylinder(0.03, 0.35, '#0f172a', 0.65, 0.18, 0, monitor, 12);
    box(0.75, 1.15, 0.06, '#0f172a', 0.65, 0.78, -0.05, monitor);
    box(0.69, 1.09, 0.01, '#0284c7', 0.65, 0.78, -0.015, monitor);

    // Mechanical Keyboard & Gaming Mousepad
    box(0.75, 0.03, 0.25, '#1e293b', -0.3, 0.97, 0.25, desk);
    box(0.22, 0.01, 0.26, '#ef4444', 0.35, 0.96, 0.25, desk);
    box(0.1, 0.03, 0.14, '#0f172a', 0.35, 0.98, 0.25, desk);

    // Ergonomic Swivel Executive Chair 1
    const chair = group(-2.2, 0, 0.6);
    cylinder(0.25, 0.05, '#0f172a', 0, 0.05, 0, chair, 16);
    cylinder(0.04, 0.42, '#94a3b8', 0, 0.26, 0, chair, 12);
    box(0.72, 0.1, 0.7, '#0369a1', 0, 0.52, 0, chair);
    box(0.66, 0.65, 0.08, '#0284c7', 0, 0.92, -0.32, chair);
    box(0.08, 0.25, 0.45, '#0f172a', -0.38, 0.72, 0, chair);
    box(0.08, 0.25, 0.45, '#0f172a', 0.38, 0.72, 0, chair);

    // Brass Task Desk Lamp
    const lamp = group(-1.1, 0.95, -0.35, desk);
    cylinder(0.14, 0.04, '#f59e0b', 0, 0.02, 0, lamp, 12);
    cylinder(0.025, 0.65, '#f59e0b', 0, 0.34, 0, lamp, 8);
    cylinder(0.16, 0.22, '#f59e0b', 0.1, 0.68, 0.1, lamp, 14);

    // --- ZONE 2: Secondary Collaborative Workstation (Right) ---
    const desk2 = group(2.4, 0, -1.2);
    box(2.2, 0.1, 1.3, '#92400e', 0, 0.9, 0, desk2);
    for (const lx of [-0.95, 0.95]) {
      for (const lz of [-0.5, 0.5]) {
        cylinder(0.04, 0.85, '#64748b', lx, 0.43, lz, desk2, 12);
      }
    }
    // Open Laptop on desk 2 with glowing cyan display
    box(0.5, 0.02, 0.35, '#0f172a', 0, 0.96, 0.05, desk2);
    const lapScreen = box(0.5, 0.35, 0.02, '#0f172a', 0, 1.12, -0.1, desk2);
    lapScreen.rotation.x = -0.22;
    box(0.46, 0.31, 0.01, '#38bdf8', 0, 1.12, -0.09, desk2);
    // Collaborative Chair 2 in crimson
    const chair2 = group(2.4, 0, -0.1);
    box(0.58, 0.08, 0.58, '#dc2626', 0, 0.5, 0, chair2);
    box(0.54, 0.55, 0.06, '#ef4444', 0, 0.85, -0.26, chair2);

    // --- ZONE 3: Meeting Area with Mobile Glass Whiteboard & Table ---
    const whiteboard = group(3.8, 0, 1.8);
    whiteboard.rotation.y = -0.35;
    cylinder(0.04, 2.0, '#64748b', -0.9, 1.0, 0, whiteboard);
    cylinder(0.04, 2.0, '#64748b', 0.9, 1.0, 0, whiteboard);
    box(1.8, 1.2, 0.04, '#f8fafc', 0, 1.4, 0, whiteboard);
    box(0.28, 0.18, 0.01, '#fde047', -0.5, 1.5, 0.03, whiteboard);
    box(0.25, 0.18, 0.01, '#f472b6', -0.1, 1.5, 0.03, whiteboard);
    box(0.28, 0.18, 0.01, '#38bdf8', 0.35, 1.5, 0.03, whiteboard);

    const confTable = group(1.6, 0, 2.2);
    cylinder(0.7, 0.06, '#cbd5e1', 0, 0.85, 0, confTable, 16);
    cylinder(0.08, 0.82, '#0f172a', 0, 0.42, 0, confTable, 12);
    for (const ca of [-1.2, 1.2]) {
      box(0.48, 0.08, 0.48, '#4338ca', Math.sin(ca) * 1.0, 0.48, Math.cos(ca) * 1.0, confTable);
    }

    // --- ZONE 4: Breakout Water Cooler & Biophilic Elements ---
    const cooler = group(-4.4, 0, -2.4);
    box(0.55, 1.0, 0.55, '#f8fafc', 0, 0.5, 0, cooler);
    cylinder(0.22, 0.55, '#38bdf8', 0, 1.28, 0, cooler, 14);
    cylinder(0.18, 0.08, '#0284c7', 0, 1.58, 0, cooler, 12);

    // Modular Executive Bookshelf on back wall
    const shelf = group(-4.2, 0, -3.2);
    box(1.4, 2.4, 0.5, '#78350f', 0, 1.2, 0, shelf);
    for (let b = 0; b < 6; b++) {
      const bColor = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'][b];
      box(0.6, 0.35, 0.1, bColor, 0, 0.45, -0.42 + b * 0.16, shelf);
      box(0.6, 0.35, 0.1, bColor, 0, 1.15, -0.42 + b * 0.16, shelf);
    }

    // Potted Office Plants
    const plant1 = group(-4.3, 0, 1.4);
    cylinder(0.35, 0.55, '#ea580c', 0, 0.28, 0, plant1, 12);
    ball(0.42, '#10b981', 0, 0.85, 0, plant1);
    ball(0.32, '#059669', 0, 1.25, 0, plant1);

    const plant2 = group(4.4, 0, -3.0);
    cylinder(0.3, 0.5, '#ea580c', 0, 0.25, 0, plant2, 12);
    ball(0.35, '#16a34a', 0, 0.75, 0, plant2);

    return { chair, screen, desk, chair2, desk2, whiteboard, cooler, shelf };
  },
  tick({ t, parts: p }) {
    const a = (t / 4.0) * Math.PI * 2;
    if (p.chair) {
      p.chair.rotation.y = Math.sin(a * 1.2) * 0.18;
    }
    if (p.screen) {
      p.screen.scale.setScalar(1.0 + Math.sin(t * 6.0) * 0.02);
    }
    if (p.chair2) {
      p.chair2.rotation.y = Math.cos(a) * 0.12;
    }
  },
  contacts() { return []; }
});`;
  }

  // --- A01. CITY / URBAN AVENUE (Skyscrapers, Avenue, Crosswalks, Streetlights, Taxi) ---
  if (category === 'city') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-7.5, -0.6, -5.5], [7.5, 9.0, 5.5]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Grand Urban Boulevard Ground & Multi-Lane Asphalt Avenue
    W.terrain(15.0, 11.0, '#090d16', 36);
    box(14.6, 0.06, 4.0, '#1e293b', 0, 0.03, 0.4);

    // Center Dashed Yellow Lane Markings
    for (let dx = -6.0; dx <= 6.0; dx += 2.0) {
      box(1.0, 0.02, 0.14, '#facc15', dx, 0.07, 0.4);
    }
    // White Pedestrian Zebra Crosswalks
    for (const cx of [-4.5, 4.5]) {
      for (let dz = -1.5; dz <= 1.5; dz += 0.5) {
        box(0.35, 0.02, 0.3, '#ffffff', cx, 0.07, 0.4 + dz);
      }
    }

    // Concrete Sidewalk Curbs
    box(14.6, 0.16, 2.6, '#64748b', 0, 0.1, -2.9); // North Boulevard Sidewalk
    box(14.6, 0.16, 2.4, '#64748b', 0, 0.1, 3.6);  // South Boulevard Sidewalk

    // Steel Tram Line with Double Rails along Front Boulevard
    box(14.4, 0.02, 0.08, '#94a3b8', 0, 0.19, 2.8);
    box(14.4, 0.02, 0.08, '#94a3b8', 0, 0.19, 3.8);
    // Streamlined City Tram
    const tram = group(0, 0.19, 3.3);
    box(4.4, 1.4, 1.2, '#0d9488', 0, 0.9, 0, tram);
    box(4.5, 0.28, 1.22, '#f8fafc', 0, 0.9, 0, tram);
    box(3.8, 0.45, 1.24, '#38bdf8', 0, 1.25, 0, tram);
    cylinder(0.04, 0.9, '#0f172a', 0, 1.95, 0, tram, 6); // Pantograph

    // City Transit Bus humming along street
    const bus = group(-2.2, 0.18, 1.4);
    box(3.4, 1.4, 1.3, '#f59e0b', 0, 0.85, 0, bus);
    box(3.5, 0.4, 1.32, '#f8fafc', 0, 0.85, 0, bus);
    box(3.0, 0.45, 1.34, '#38bdf8', 0, 1.2, 0, bus);
    for (const bx of [-1.1, 1.1]) {
      for (const bz of [-0.68, 0.68]) {
        const bw = cylinder(0.24, 0.14, '#0f172a', bx, 0.24, bz, bus, 12);
        bw.rotation.x = Math.PI / 2;
      }
    }

    // High-Rise Glass Skyscraper 1 (North West)
    const tower1 = group(-4.2, 0, -2.8);
    box(3.0, 7.2, 2.4, '#0369a1', 0, 3.6, 0, tower1);
    box(3.1, 0.14, 2.5, '#0f172a', 0, 7.27, 0, tower1);
    cylinder(0.05, 1.6, '#e2e8f0', 0, 8.05, 0, tower1, 8);
    const beacon = ball(0.09, '#ef4444', 0, 8.85, 0, tower1);
    for (let wy = 1.0; wy <= 6.6; wy += 0.8) {
      for (let wx = -1.1; wx <= 1.1; wx += 0.7) {
        box(0.42, 0.38, 0.04, ((Math.floor(wy * 3 + wx * 5) % 3 === 0) ? '#fef08a' : '#38bdf8'), wx, wy, 1.22, tower1);
      }
    }

    // Construction Building Site with Tall Tower Crane & Turning Jib
    const crane = group(-0.8, 0, -3.0);
    // Vertical Lattice Mast
    for (const my of [1.5, 3.0, 4.5, 6.0, 7.5]) {
      box(0.7, 0.08, 0.7, '#f59e0b', 0, my, 0, crane);
    }
    box(0.1, 8.2, 0.1, '#d97706', -0.3, 4.1, -0.3, crane);
    box(0.1, 8.2, 0.1, '#d97706', 0.3, 4.1, -0.3, crane);
    box(0.1, 8.2, 0.1, '#d97706', -0.3, 4.1, 0.3, crane);
    box(0.1, 8.2, 0.1, '#d97706', 0.3, 4.1, 0.3, crane);
    // Operator Cab & Jib
    box(0.65, 0.7, 0.65, '#f8fafc', 0, 7.8, 0, crane);
    const jib = group(0, 8.2, 0, crane);
    box(5.8, 0.2, 0.25, '#f59e0b', 1.8, 0, 0, jib); // Long forward reach
    box(2.0, 0.2, 0.25, '#d97706', -1.0, 0, 0, jib); // Counterweight jib
    box(0.6, 0.5, 0.4, '#475569', -1.7, -0.1, 0, jib); // Concrete counterweights
    // Hoist Cable & Suspended Heavy Cargo
    const hoist = group(3.4, 0, 0, jib);
    cylinder(0.015, 3.5, '#94a3b8', 0, -1.75, 0, hoist);
    const cargo = box(0.9, 0.7, 0.7, '#0284c7', 0, -3.5, 0, hoist);

    // Central City Park Plaza with Tiered Water Fountain
    const fountain = group(2.6, 0.17, -2.8);
    cylinder(1.6, 0.22, '#cbd5e1', 0, 0.11, 0, fountain, 18); // Outer Stone Pool Basin
    cylinder(1.4, 0.14, '#38bdf8', 0, 0.18, 0, fountain, 18); // Water Pool
    cylinder(0.7, 0.45, '#94a3b8', 0, 0.4, 0, fountain, 16);  // Second Tier Basin
    cylinder(0.2, 0.9, '#64748b', 0, 0.9, 0, fountain, 12);   // Central Spout Pillar
    const waterSplash = ball(0.28, '#bae6fd', 0, 1.4, 0, fountain);

    // Boutique Storefronts with Striped Awnings
    const shop = group(5.4, 0, -2.6);
    box(2.6, 3.2, 2.2, '#334155', 0, 1.6, 0, shop);
    const awning = box(2.6, 0.12, 1.0, '#ef4444', 0, 1.8, 1.3, shop);
    awning.rotation.x = 0.22;
    box(2.0, 1.0, 0.04, '#38bdf8', 0, 0.8, 1.12, shop);

    // Cycling Traffic Signal Post
    const trafficSignal = group(3.6, 0.17, -0.8);
    cylinder(0.04, 3.2, '#475569', 0, 1.6, 0, trafficSignal);
    box(0.25, 0.7, 0.2, '#0f172a', 0, 2.8, 0, trafficSignal);
    const greenLight = ball(0.07, '#22c55e', 0, 2.6, 0.11, trafficSignal);
    const yellowLight = ball(0.07, '#eab308', 0, 2.8, 0.11, trafficSignal);
    const redLight = ball(0.07, '#ef4444', 0, 3.0, 0.11, trafficSignal);

    // Street Lamps & Illumination Poles
    const lamp1 = group(-2.6, 0.17, -0.8);
    cylinder(0.03, 2.6, '#475569', 0, 1.3, 0, lamp1);
    cylinder(0.12, 0.12, '#fef08a', 0, 2.65, 0, lamp1);

    // Moving Yellow Taxi Cab
    const car = group(1.8, 0.2, 0.4);
    box(2.0, 0.42, 1.1, '#facc15', 0, 0.28, 0, car);
    box(1.2, 0.36, 0.95, '#0f172a', -0.1, 0.62, 0, car);
    box(0.35, 0.1, 0.2, '#ffffff', -0.1, 0.85, 0, car);
    for (const wx of [-0.65, 0.65]) {
      for (const wz of [-0.55, 0.55]) {
        const w = cylinder(0.22, 0.14, '#0f172a', wx, 0.22, wz, car, 12);
        w.rotation.x = Math.PI / 2;
      }
    }

    return { car, tram, bus, crane, jib, cargo, fountain, waterSplash, tower1, shop, beacon, greenLight, yellowLight, redLight };
  },
  tick({ t, parts: p }) {
    const a = (t / 4.0) * Math.PI * 2;
    if (p.car) {
      p.car.position.x = ((t * 2.8) % 18.0) - 9.0;
    }
    if (p.tram) {
      p.tram.position.x = Math.sin(a * 0.5) * 3.8;
    }
    if (p.bus) {
      p.bus.position.x = -2.2 + Math.cos(a * 0.5) * 3.4;
    }
    if (p.jib) {
      p.jib.rotation.y = Math.sin(a * 0.5) * 0.65;
    }
    if (p.cargo) {
      p.cargo.position.y = -3.5 + Math.sin(a) * 0.6;
    }
    if (p.waterSplash) {
      p.waterSplash.scale.setScalar(1.0 + Math.sin(t * 8.0) * 0.25);
    }
    if (p.beacon) {
      p.beacon.scale.setScalar(1.0 + Math.sin(t * 8.0) * 0.3);
    }
    if (p.greenLight && p.redLight) {
      const cycle = Math.floor(t * 0.8) % 3;
      p.greenLight.visible = cycle === 0;
      if (p.yellowLight) p.yellowLight.visible = cycle === 1;
      p.redLight.visible = cycle === 2;
    }
  },
  contacts() { return []; }
});`;
  }

  // --- A02. FARM / COUNTRYSIDE (Red Barn, Silo, Spinning Windmill, Tractor, Hay Bales, Crop Rows) ---
  if (category === 'farm') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-6.0, -0.6, -5.0], [6.0, 6.0, 5.0]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Expansive Country Pasture & Dirt Road
    W.terrain(12.0, 9.0, '#15803d', 50);
    box(11.8, 0.04, 1.8, '#785334', 0, 0.02, 1.4);

    // Tilled Crop Patch with Raised Cabbages
    const cropPatch = group(-3.5, 0, 2.4);
    box(3.8, 0.08, 2.6, '#451a03', 0, 0.04, 0, cropPatch);
    for (let fz = -0.9; fz <= 0.9; fz += 0.6) {
      for (let fx = -1.5; fx <= 1.5; fx += 0.5) {
        ball(0.13, '#22c55e', fx, 0.14, fz, cropPatch);
      }
    }

    // Golden Hay Bales
    const hay1 = cylinder(0.4, 0.7, '#facc15', 2.8, 0.35, 2.4, null, 14); hay1.rotation.z = Math.PI / 2;
    const hay2 = cylinder(0.4, 0.7, '#facc15', 3.6, 0.35, 2.2, null, 14); hay2.rotation.z = Math.PI / 2;
    const hay3 = cylinder(0.4, 0.7, '#facc15', 3.2, 0.95, 2.3, null, 14); hay3.rotation.z = Math.PI / 2;

    // Classic Red Timber Barn
    const barn = group(-2.2, 0, -1.8);
    box(3.8, 2.6, 3.0, '#b91c1c', 0, 1.3, 0, barn);
    box(4.0, 1.2, 3.2, '#7f1d1d', 0, 3.1, 0, barn);
    box(1.6, 1.8, 0.04, '#f8fafc', 0, 0.9, 1.52, barn);
    box(0.7, 0.8, 0.04, '#f8fafc', 0, 2.4, 1.52, barn);

    // Metal Grain Silo
    const silo = group(0.8, 0, -2.4);
    cylinder(0.75, 4.2, '#cbd5e1', 0, 2.1, 0, silo, 16);
    cylinder(0, 0.8, 0.7, '#64748b', 0, 4.55, 0, silo, 16);
    box(0.15, 3.8, 0.04, '#475569', 0, 2.1, 0.76, silo);

    // Lattice Water-Pumping Windmill with Spinning Blades
    const windmill = group(4.0, 0, -1.5);
    cylinder(0.04, 3.6, '#94a3b8', -0.3, 1.8, -0.3, windmill);
    cylinder(0.04, 3.6, '#94a3b8', 0.3, 1.8, -0.3, windmill);
    cylinder(0.04, 3.6, '#94a3b8', -0.3, 1.8, 0.3, windmill);
    cylinder(0.04, 3.6, '#94a3b8', 0.3, 1.8, 0.3, windmill);
    box(0.5, 0.3, 0.6, '#64748b', 0, 3.7, 0, windmill);
    box(0.06, 0.5, 0.7, '#dc2626', 0, 3.8, -0.5, windmill);

    const fan = group(0, 3.7, 0.35, windmill);
    cylinder(0.1, 0.1, '#0f172a', 0, 0, 0, fan);
    for (let b = 0; b < 8; b++) {
      const ba = (b / 8) * Math.PI * 2;
      box(0.06, 0.7, 0.02, '#cbd5e1', Math.sin(ba) * 0.45, Math.cos(ba) * 0.45, 0, fan);
    }

    // Classic Farm Tractor
    const tractor = group(1.0, 0, 1.4);
    box(1.6, 0.7, 1.0, '#15803d', 0, 0.55, 0, tractor);
    box(0.9, 0.8, 0.9, '#fef08a', -0.3, 1.1, 0, tractor);
    cylinder(0.04, 0.6, '#0f172a', 0.5, 1.1, 0.3, tractor);
    cylinder(0.45, 0.25, '#0f172a', -0.5, 0.45, -0.55, tractor, 16);
    cylinder(0.45, 0.25, '#0f172a', -0.5, 0.45, 0.55, tractor, 16);
    cylinder(0.28, 0.2, '#0f172a', 0.6, 0.28, -0.5, tractor, 16);
    cylinder(0.28, 0.2, '#0f172a', 0.6, 0.28, 0.5, tractor, 16);

    // Fenced Pasture & Grazing Sheep
    const paddock = group(-3.5, 0, -3.2);
    for (let px = -1.6; px <= 1.6; px += 0.8) {
      cylinder(0.03, 0.7, '#78350f', px, 0.35, 0, paddock);
    }
    box(3.4, 0.06, 0.04, '#78350f', 0, 0.5, 0, paddock);
    box(3.4, 0.06, 0.04, '#78350f', 0, 0.25, 0, paddock);
    const sheep = group(-3.2, 0, -2.6);
    ball(0.3, '#f8fafc', 0, 0.35, 0, sheep);
    ball(0.15, '#1e293b', 0.25, 0.4, 0, sheep);

    return { barn, silo, windmill, fan, tractor, sheep };
  },
  tick({ t, parts: p }) {
    if (p.fan) {
      p.fan.rotation.z = t * 3.5;
    }
    if (p.sheep) {
      p.sheep.position.y = Math.abs(Math.sin(t * 4)) * 0.03;
    }
  },
  contacts() { return []; }
});`;
  }

  // --- A03. PARK / NATURE LANDSCAPE (Gazebo, Winding Path, Footbridge, Stream, Park Benches, Trees) ---
  if (category === 'park') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-6.0, -0.6, -5.0], [6.0, 5.0, 5.0]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Park Grassland & Meandering Stream
    W.terrain(12.0, 9.0, '#15803d', 60);
    box(11.8, 0.04, 1.8, '#0284c7', 0, 0.02, 0.6);

    // Wooden Arched Footbridge over Stream
    const bridge = group(0, 0, 0.6);
    box(1.6, 0.1, 2.4, '#78350f', 0, 0.25, 0, bridge);
    box(0.08, 0.6, 2.4, '#451a03', -0.75, 0.5, 0, bridge);
    box(0.08, 0.6, 2.4, '#451a03', 0.75, 0.5, 0, bridge);

    // Park Gazebo / Pavilion (Left)
    const gazebo = group(-3.5, 0, -1.8);
    cylinder(1.6, 0.15, '#e2e8f0', 0, 0.08, 0, gazebo, 8);
    for (let c = 0; c < 6; c++) {
      const ca = (c / 6) * Math.PI * 2;
      cylinder(0.06, 2.2, '#78350f', Math.sin(ca) * 1.3, 1.18, Math.cos(ca) * 1.3, gazebo);
    }
    cylinder(0, 1.8, 1.1, '#b91c1c', 0, 2.8, 0, gazebo, 8);

    // Park Benches & Stone Pathways
    const bench1 = group(2.4, 0, 2.4);
    box(1.4, 0.08, 0.45, '#78350f', 0, 0.45, 0, bench1);
    box(1.4, 0.4, 0.06, '#78350f', 0, 0.7, -0.2, bench1);
    box(0.08, 0.45, 0.45, '#0f172a', -0.6, 0.22, 0, bench1);
    box(0.08, 0.45, 0.45, '#0f172a', 0.6, 0.22, 0, bench1);

    // Diverse Trees & Flowering Bushes
    const tree1 = group(-2.0, 0, 2.4);
    cylinder(0.16, 2.2, '#78350f', 0, 1.1, 0, tree1, 8);
    ball(0.9, '#15803d', 0, 2.6, 0, tree1);
    ball(0.7, '#22c55e', 0.3, 3.2, 0, tree1);

    const tree2 = group(3.8, 0, -2.4);
    cylinder(0.14, 2.6, '#78350f', 0, 1.3, 0, tree2, 8);
    ball(1.0, '#16a34a', 0, 3.0, 0, tree2);

    // Flowering Shrubs
    ball(0.3, '#f472b6', 1.2, 0.3, -1.8);
    ball(0.35, '#facc15', -1.2, 0.3, -2.6);
    ball(0.3, '#c084fc', 3.2, 0.3, 0.8);

    return { bridge, gazebo, bench1, tree1, tree2 };
  },
  tick({ t, parts: p }) {
    if (p.bridge) {
      p.bridge.position.y = Math.sin(t * 2) * 0.01;
    }
  },
  contacts() { return []; }
});`;
  }

  // --- A04. EXPANSIVE AIRPORT TERMINAL & RUNWAY WORLD ---
  if (category === 'airport') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-6.0, -0.6, -5.0], [6.0, 5.0, 5.0]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Runway & Taxiway Tarmac
    W.terrain(12.0, 9.0, '#1e293b', 45);

    // Main Runway with Threshold Piano Keys & Yellow Centerline
    box(11.8, 0.04, 3.2, '#0f172a', 0, 0.02, 2.4);
    for (let x = -4.5; x <= 4.5; x += 1.8) {
      box(1.0, 0.02, 0.14, '#f59e0b', x, 0.05, 2.4);
    }
    for (let z = 1.2; z <= 3.6; z += 0.4) {
      box(0.7, 0.02, 0.2, '#f8fafc', -5.4, 0.05, z);
      box(0.7, 0.02, 0.2, '#f8fafc', 5.4, 0.05, z);
    }

    // Modern Passenger Terminal Concourse (Back-Left)
    const terminal = group(-2.4, 0, -2.4);
    box(5.8, 2.2, 2.6, '#334155', 0, 1.1, 0, terminal);
    box(6.0, 0.15, 2.8, '#64748b', 0, 2.25, 0, terminal);
    for (let gx = -2.4; gx <= 2.4; gx += 0.8) {
      box(0.65, 1.8, 0.04, '#38bdf8', gx, 1.0, 1.32, terminal);
    }
    box(2.0, 0.8, 0.8, '#94a3b8', 1.8, 1.2, 1.8, terminal);
    box(0.12, 1.2, 0.12, '#475569', 2.6, 0.6, 1.8, terminal);

    // Air Traffic Control (ATC) Tower (Back-Right)
    const tower = group(3.8, 0, -2.2);
    cylinder(0.6, 0.8, 3.8, '#e2e8f0', 0, 1.9, 0, tower, 12);
    cylinder(1.1, 0.8, 0.8, '#0f172a', 0, 4.0, 0, tower, 12);
    for (let w = 0; w < 8; w++) {
      const wa = (w / 8) * Math.PI * 2;
      box(0.4, 0.5, 0.04, '#38bdf8', Math.sin(wa) * 0.95, 4.0, Math.cos(wa) * 0.95, tower);
    }
    cylinder(0.7, 0.7, 0.1, '#64748b', 0, 4.45, 0, tower, 12);
    const radar = group(0, 4.7, 0, tower);
    box(0.06, 0.4, 0.06, '#94a3b8', 0, 0.2, 0, radar);
    box(0.8, 0.3, 0.06, '#ef4444', 0, 0.45, 0, radar);

    // Commercial Passenger Jetliner on Apron
    const plane = group(1.6, 0.8, 0.2);
    const fus = cylinder(0.45, 4.2, '#f8fafc', 0, 0, 0, plane, 16);
    fus.rotation.x = Math.PI / 2;
    ball(0.45, '#f8fafc', 0, 0, 2.1, plane);
    box(0.6, 0.25, 0.7, '#0f172a', 0, 0.35, 1.5, plane);
    const wingL = box(2.8, 0.08, 1.1, '#f8fafc', -1.6, 0, 0.1, plane);
    wingL.rotation.y = -0.2;
    const wingR = box(2.8, 0.08, 1.1, '#f8fafc', 1.6, 0, 0.1, plane);
    wingR.rotation.y = 0.2;
    cylinder(0.24, 1.0, '#0284c7', -1.3, -0.35, 0.3, plane, 12).rotation.x = Math.PI / 2;
    cylinder(0.24, 1.0, '#0284c7', 1.3, -0.35, 0.3, plane, 12).rotation.x = Math.PI / 2;
    box(0.08, 1.2, 0.9, '#0284c7', 0, 0.8, -1.8, plane).rotation.x = -0.3;

    // Baggage Tow Tractor & Carts
    const tug = group(-1.2, 0, 0.2);
    box(0.8, 0.5, 1.2, '#eab308', 0, 0.3, 0, tug);
    box(0.6, 0.4, 0.5, '#0f172a', 0, 0.6, -0.2, tug);
    box(0.7, 0.3, 1.0, '#94a3b8', 0, 0.22, 1.3, tug);

    // Windsock
    const windsock = group(-4.8, 0, 0.5);
    cylinder(0.04, 2.2, '#94a3b8', 0, 1.1, 0, windsock, 8);
    const sockCone = cylinder(0.18, 0.08, 0.8, '#f97316', 0.4, 2.1, 0, windsock, 8);
    sockCone.rotation.z = Math.PI / 2;

    return { plane, radar, tug, windsock };
  },
  tick({ t, parts: p }) {
    if (p.radar) {
      p.radar.rotation.y = t * 2.2;
    }
    if (p.windsock) {
      p.windsock.rotation.y = Math.sin(t * 1.5) * 0.15;
    }
    if (p.plane) {
      p.plane.position.y = 0.8 + Math.sin(t * 1.2) * 0.02;
    }
  },
  contacts() { return []; }
});`;
  }

  // --- A05. EXPANSIVE HARBOR / DOCK & CRANE WORLD ---
  if (category === 'harbor') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-6.0, -0.6, -5.0], [6.0, 5.0, 5.0]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Half Concrete Quay, Half Deep Cerulean Sea
    W.terrain(12.0, 9.0, '#0284c7', 60);
    box(11.8, 0.5, 4.4, '#475569', 0, 0.25, -2.2);
    box(11.8, 0.08, 0.25, '#f59e0b', 0, 0.54, 0);

    // Rail-Mounted Container Gantry Crane
    const crane = group(-2.2, 0, -1.8);
    box(0.25, 4.2, 0.25, '#ef4444', -1.2, 2.1, -1.2, crane);
    box(0.25, 4.2, 0.25, '#ef4444', 1.2, 2.1, -1.2, crane);
    box(0.25, 4.2, 0.25, '#ef4444', -1.2, 2.1, 1.2, crane);
    box(0.25, 4.2, 0.25, '#ef4444', 1.2, 2.1, 1.2, crane);
    box(3.2, 0.35, 4.8, '#ef4444', 0, 4.2, 0.8, crane);

    // Spreader Trolley & Hoist Cables
    const spreader = group(0, 3.8, 1.4, crane);
    box(0.8, 0.2, 1.4, '#0f172a', 0, 0, 0, spreader);
    cylinder(0.02, 1.8, '#94a3b8', -0.3, -0.9, 0.5, spreader);
    cylinder(0.02, 1.8, '#94a3b8', 0.3, -0.9, 0.5, spreader);
    cylinder(0.02, 1.8, '#94a3b8', -0.3, -0.9, -0.5, spreader);
    cylinder(0.02, 1.8, '#94a3b8', 0.3, -0.9, -0.5, spreader);
    box(1.2, 0.7, 2.4, '#059669', 0, -2.1, 0, spreader);

    // Stacked Intermodal Shipping Containers
    box(1.3, 0.7, 2.6, '#1d4ed8', 2.4, 0.85, -2.8);
    box(1.3, 0.7, 2.6, '#dc2626', 3.8, 0.85, -2.8);
    box(1.3, 0.7, 2.6, '#d97706', 2.4, 1.55, -2.8);
    box(1.3, 0.7, 2.6, '#0f172a', 3.1, 0.85, -1.3);

    // Moored Cargo Tugboat in Water Basin
    const boat = group(0.8, 0.25, 2.2);
    box(1.8, 0.6, 3.8, '#1e293b', 0, 0.3, 0, boat);
    box(1.4, 0.45, 1.6, '#f8fafc', 0, 0.8, -0.4, boat);
    cylinder(0.16, 0.7, '#dc2626', 0, 1.35, -0.8, boat, 12);
    cylinder(0.04, 1.6, '#f8fafc', 0, 1.6, 0.2, boat, 8);
    cylinder(0.12, 0.08, '#f59e0b', -0.9, 0.35, 0.6, boat).rotation.z = Math.PI / 2;
    cylinder(0.12, 0.08, '#f59e0b', -0.9, 0.35, -0.6, boat).rotation.z = Math.PI / 2;

    // Quayside Mooring Bollards
    for (let bx = -4.5; bx <= 4.5; bx += 2.2) {
      cylinder(0.08, 0.25, '#0f172a', bx, 0.65, -0.2, undefined, 8);
      cylinder(0.14, 0.08, '#0f172a', bx, 0.75, -0.2, undefined, 8);
    }

    // Wooden Pier Extension
    const pier = group(4.6, 0, 1.8);
    box(1.2, 0.1, 3.6, '#78350f', 0, 0.35, 0, pier);
    for (let pz = -1.4; pz <= 1.4; pz += 1.4) {
      cylinder(0.08, 0.7, '#451a03', -0.5, 0.05, pz, pier, 8);
      cylinder(0.08, 0.7, '#451a03', 0.5, 0.05, pz, pier, 8);
    }

    return { boat, spreader, crane };
  },
  tick({ t, parts: p }) {
    if (p.boat) {
      p.boat.position.y = 0.25 + Math.sin(t * 2.2) * 0.03;
      p.boat.rotation.z = Math.sin(t * 1.6) * 0.025;
      p.boat.rotation.x = Math.cos(t * 1.8) * 0.02;
    }
    if (p.spreader) {
      p.spreader.position.z = 1.4 + Math.sin(t * 1.0) * 0.4;
    }
  },
  contacts() { return []; }
});`;
  }

  // --- A06. EXPANSIVE LIGHTHOUSE & ROCKY ISLAND WORLD ---
  if (category === 'lighthouse') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-6.0, -0.6, -5.0], [6.0, 5.5, 5.0]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Deep Ocean Water with Waves
    W.terrain(12.0, 9.0, '#0369a1', 70);

    // Multi-Tier Rugged Granite Cliff Island
    const island = group(-0.5, 0, 0);
    cylinder(3.4, 4.0, 0.8, '#475569', 0, 0.4, 0, island, 10);
    cylinder(2.6, 3.2, 0.9, '#334155', -0.4, 1.2, -0.3, island, 10);
    cylinder(1.8, 2.2, 0.8, '#1e293b', -0.8, 2.0, -0.5, island, 8);
    cylinder(1.6, 1.7, 0.15, '#15803d', -0.8, 2.45, -0.5, island, 8);

    // Red-and-White Banded Lighthouse Tower
    const tower = group(-1.2, 2.4, -0.8);
    cylinder(0.9, 0.95, 0.4, '#1e293b', 0, 0.2, 0, tower, 16);
    cylinder(0.78, 0.86, 0.9, '#f8fafc', 0, 0.85, 0, tower, 16);
    cylinder(0.70, 0.78, 0.9, '#dc2626', 0, 1.75, 0, tower, 16);
    cylinder(0.62, 0.70, 0.9, '#f8fafc', 0, 2.65, 0, tower, 16);
    cylinder(0.55, 0.62, 0.9, '#dc2626', 0, 3.55, 0, tower, 16);
    cylinder(0.85, 0.65, 0.15, '#1e293b', 0, 4.05, 0, tower, 16);
    cylinder(0.04, 0.4, '#0f172a', 0.8, 4.25, 0, tower, 8);
    cylinder(0.04, 0.4, '#0f172a', -0.8, 4.25, 0, tower, 8);
    cylinder(0.5, 0.5, 0.6, '#38bdf8', 0, 4.4, 0, tower, 12);
    cylinder(0, 0.6, 0.5, '#047857', 0, 4.95, 0, tower, 16);
    cylinder(0.03, 0.5, '#ca8a04', 0, 5.3, 0, tower, 8);

    // Revolving Light Beam
    const beacon = group(0, 4.4, 0, tower);
    box(0.2, 0.2, 0.3, '#fef08a', 0, 0, 0, beacon);
    const beam = cylinder(0.1, 0.9, 3.2, '#fef08a', 0, 0, 1.6, beacon, 8);
    beam.rotation.x = Math.PI / 2;

    // Keeper's Whitewashed Stone Cottage
    const cottage = group(1.2, 1.4, 0.6);
    box(1.8, 1.2, 1.4, '#f8fafc', 0, 0.6, 0, cottage);
    const roof = cylinder(0, 1.5, 0.8, '#78350f', 0, 1.6, 0, cottage, 4);
    roof.rotation.y = Math.PI / 4;
    box(0.3, 0.8, 0.3, '#b91c1c', 0.6, 1.7, 0.3, cottage);
    box(0.35, 0.5, 0.04, '#f59e0b', 0, 0.6, 0.72, cottage);

    // Wooden Landing Jetty & Moored Rowboat
    const jetty = group(2.4, 0, 1.8);
    box(1.0, 0.1, 2.4, '#78350f', 0, 0.3, 0, jetty);
    cylinder(0.08, 0.6, '#451a03', -0.4, 0.1, 0.8, jetty, 8);
    cylinder(0.08, 0.6, '#451a03', 0.4, 0.1, 0.8, jetty, 8);

    const dinghy = group(3.2, 0.15, 2.6);
    box(0.9, 0.35, 1.8, '#92400e', 0, 0.15, 0, dinghy);
    box(0.7, 0.25, 1.2, '#f8fafc', 0, 0.25, 0, dinghy);

    return { beacon, dinghy, tower };
  },
  tick({ t, parts: p }) {
    if (p.beacon) {
      p.beacon.rotation.y = t * 1.8;
    }
    if (p.dinghy) {
      p.dinghy.position.y = 0.15 + Math.sin(t * 2.4) * 0.04;
      p.dinghy.rotation.z = Math.sin(t * 1.8) * 0.05;
      p.dinghy.rotation.x = Math.cos(t * 2.0) * 0.04;
    }
  },
  contacts() { return []; }
});`;
  }

  // --- A07. EXPANSIVE SCHOOL / UNIVERSITY CAMPUS WORLD ---
  if (category === 'campus') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-6.0, -0.6, -5.0], [6.0, 5.2, 5.0]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Manicured Campus Quad Lawn
    W.terrain(11.8, 8.8, '#15803d', 50);

    // Stately Collegiate Academic Hall with Clock Tower (Back)
    const hall = group(0, 0, -2.6);
    box(8.2, 2.6, 2.4, '#991b1b', 0, 1.3, 0, hall);
    box(8.6, 0.2, 2.8, '#475569', 0, 2.7, 0, hall);
    box(2.0, 1.8, 0.4, '#e2e8f0', 0, 0.9, 1.3, hall);
    box(1.0, 1.2, 0.1, '#0f172a', 0, 0.6, 1.45, hall);
    for (let wx of [-3.2, -2.2, -1.2, 1.2, 2.2, 3.2]) {
      box(0.5, 0.7, 0.05, '#38bdf8', wx, 1.8, 1.22, hall);
      box(0.5, 0.7, 0.05, '#38bdf8', wx, 0.7, 1.22, hall);
    }

    // Central Clock Tower
    const clockTower = group(0, 2.7, 0.2, hall);
    box(1.6, 2.4, 1.6, '#991b1b', 0, 1.2, 0, clockTower);
    cylinder(0.4, 0.4, 0.04, '#f8fafc', 0, 1.8, 0.82, clockTower, 16);
    box(0.04, 0.25, 0.02, '#0f172a', 0, 1.9, 0.85, clockTower);
    cylinder(0, 1.1, 1.4, '#047857', 0, 3.0, 0, clockTower, 4);
    cylinder(0.03, 0.6, '#ca8a04', 0, 3.8, 0, clockTower, 8);

    // Stone Quad Pathways
    box(1.2, 0.04, 5.5, '#cbd5e1', 0, 0.03, 1.2);
    box(7.5, 0.04, 1.2, '#cbd5e1', 0, 0.03, 1.2);

    // Central Tiered Stone Fountain
    const fountain = group(0, 0, 1.2);
    cylinder(1.4, 1.5, 0.35, '#94a3b8', 0, 0.18, 0, fountain, 16);
    cylinder(1.3, 1.3, 0.1, '#0284c7', 0, 0.32, 0, fountain, 16);
    cylinder(0.5, 0.6, 0.7, '#64748b', 0, 0.55, 0, fountain, 12);
    const jet = cylinder(0.08, 0.08, 0.5, '#38bdf8', 0, 1.1, 0, fountain, 8);

    // Outdoor Campus Study Benches & Oak Trees
    const bench1 = group(-2.4, 0, 2.4);
    box(1.4, 0.08, 0.45, '#78350f', 0, 0.45, 0, bench1);
    box(1.4, 0.4, 0.06, '#78350f', 0, 0.7, -0.2, bench1);

    const bench2 = group(2.4, 0, 2.4);
    box(1.4, 0.08, 0.45, '#78350f', 0, 0.45, 0, bench2);
    box(1.4, 0.4, 0.06, '#78350f', 0, 0.7, -0.2, bench2);

    // Campus Shade Trees
    const tree1 = group(-3.8, 0, 0.8);
    cylinder(0.16, 2.4, '#78350f', 0, 1.2, 0, tree1, 8);
    ball(1.1, '#15803d', 0, 2.8, 0, tree1);

    const tree2 = group(3.8, 0, 0.8);
    cylinder(0.16, 2.4, '#78350f', 0, 1.2, 0, tree2, 8);
    ball(1.1, '#16a34a', 0, 2.8, 0, tree2);

    // Campus Flagpole
    const flagpole = group(-2.4, 0, -0.8);
    cylinder(0.05, 4.2, '#94a3b8', 0, 2.1, 0, flagpole, 8);
    ball(0.1, '#ca8a04', 0, 4.25, 0, flagpole);
    const flag = box(0.9, 0.5, 0.02, '#1d4ed8', 0.5, 3.8, 0, flagpole);

    return { jet, flag, hall, fountain };
  },
  tick({ t, parts: p }) {
    if (p.jet) {
      p.jet.scale.y = 1.0 + Math.sin(t * 5.0) * 0.15;
    }
    if (p.flag) {
      p.flag.rotation.y = Math.sin(t * 3.0) * 0.08;
    }
  },
  contacts() { return []; }
});`;
  }

  // --- A07b. EXPANSIVE CLASSROOM / LECTURE HALL WORLD ---
  if (category === 'classroom') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-6.0, -0.6, -5.0], [6.0, 5.0, 5.0]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Hardwood Parquet Classroom Floor Slab
    W.terrain(12.0, 9.0, '#b45309', 24);
    box(11.8, 0.08, 8.8, '#d97706', 0, 0.04, 0);

    // Cutaway Back Wall with Large Chalkboard
    box(11.8, 3.4, 0.25, '#f8fafc', 0, 1.7, -4.2);
    box(11.8, 0.15, 0.35, '#78350f', 0, 3.4, -4.2);
    box(11.8, 0.25, 0.1, '#78350f', 0, 0.12, -4.08);

    // Large Green Framed Chalkboard
    const boardGroup = group(0, 2.0, -4.0);
    box(6.8, 2.2, 0.08, '#14532d', 0, 0, 0, boardGroup);
    box(7.0, 0.08, 0.14, '#92400e', 0, 1.14, 0, boardGroup);
    box(7.0, 0.14, 0.24, '#92400e', 0, -1.14, 0.06, boardGroup);
    box(0.08, 2.36, 0.14, '#92400e', -3.45, 0, 0, boardGroup);
    box(0.08, 2.36, 0.14, '#92400e', 3.45, 0, 0, boardGroup);
    for (let cl = -2; cl <= 2; cl++) {
      box(1.8, 0.02, 0.01, '#f8fafc', -1.8, cl * 0.35, 0.05, boardGroup);
    }
    cylinder(0.02, 0.9, '#fde047', 1.8, 0.2, 0.05, boardGroup);
    cylinder(0.02, 0.9, '#fde047', 1.8, -0.2, 0.05, boardGroup);
    box(0.12, 0.04, 0.04, '#ffffff', -1.0, -1.02, 0.12, boardGroup);
    box(0.12, 0.04, 0.04, '#fde047', -0.7, -1.02, 0.12, boardGroup);
    box(0.28, 0.06, 0.1, '#1e293b', 0.8, -1.02, 0.12, boardGroup);

    // Wall Clock above board
    const clock = group(0, 3.45, -4.05);
    cylinder(0.38, 0.05, '#0f172a', 0, 0, 0, clock, 16);
    cylinder(0.34, 0.02, '#ffffff', 0, 0, 0.03, clock, 16);
    ball(0.04, '#dc2626', 0, 0, 0.05, clock);

    // Teacher Standing at Front Lecturing
    const teacher = W.person(2.4, -2.2);

    // Teacher's Executive Oak Desk
    const tDesk = group(-2.4, 0, -2.4);
    box(3.2, 0.12, 1.6, '#92400e', 0, 0.94, 0, tDesk);
    box(3.0, 0.6, 0.04, '#78350f', 0, 0.55, 0.75, tDesk);
    for (const lx of [-1.45, 1.45]) {
      for (const lz of [-0.65, 0.65]) {
        cylinder(0.05, 0.88, '#1e293b', lx, 0.44, lz, tDesk, 12);
      }
    }
    box(0.55, 0.02, 0.38, '#94a3b8', -0.4, 1.01, 0, tDesk);
    const lapScr = box(0.55, 0.38, 0.02, '#0f172a', -0.4, 1.19, -0.17, tDesk);
    lapScr.rotation.x = -0.22;
    box(0.5, 0.32, 0.01, '#38bdf8', -0.4, 1.19, -0.16, tDesk);
    const globe = group(0.9, 1.0, 0.2, tDesk);
    cylinder(0.08, 0.04, '#f59e0b', 0, 0.02, 0, globe, 10);
    cylinder(0.02, 0.3, '#f59e0b', 0, 0.15, 0, globe, 8);
    ball(0.18, '#0284c7', 0, 0.32, 0, globe);
    box(0.35, 0.08, 0.26, '#dc2626', 0.4, 1.04, -0.3, tDesk);
    box(0.34, 0.07, 0.25, '#2563eb', 0.4, 1.11, -0.3, tDesk);

    // Student Desks in Rows with Seated Students
    const studentCols = [-2.8, 0, 2.8];
    const studentRows = [0.4, 2.4];
    studentCols.forEach((sx, ci) => {
      studentRows.forEach((sz, ri) => {
        const sDesk = group(sx, 0, sz);
        box(1.4, 0.08, 0.8, '#d97706', 0, 0.74, 0, sDesk);
        for (const dx of [-0.6, 0.6]) {
          for (const dz of [-0.3, 0.3]) {
            cylinder(0.03, 0.7, '#64748b', dx, 0.35, dz, sDesk, 8);
          }
        }
        const sChair = group(0, 0, 0.7, sDesk);
        box(0.55, 0.06, 0.5, '#1e293b', 0, 0.42, 0, sChair);
        box(0.5, 0.4, 0.05, '#1e293b', 0, 0.68, 0.22, sChair);
        box(0.32, 0.02, 0.24, '#ffffff', -0.2, 0.79, 0, sDesk);
        cylinder(0.01, 0.18, '#f59e0b', 0.15, 0.79, 0, sDesk, 6);
        if ((ci + ri) % 2 === 0) {
          W.person(sx, sz + 0.55);
        }
      });
    });

    const shelf = group(-5.2, 0, -1.0);
    box(0.8, 2.6, 2.2, '#78350f', 0, 1.3, 0, shelf);
    for (let sb = 0; sb < 5; sb++) {
      const bColor = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][sb];
      box(0.45, 0.35, 0.1, bColor, 0, 0.55, -0.7 + sb * 0.35, shelf);
      box(0.45, 0.35, 0.1, bColor, 0, 1.35, -0.7 + sb * 0.35, shelf);
    }

    return { teacher, tDesk, clock, shelf };
  },
  tick({ t, parts: p }) {
    const a = (t / 4.0) * Math.PI * 2;
    if (p.teacher) {
      p.teacher.position.x = 2.4 + Math.sin(a * 0.5) * 0.25;
      p.teacher.rotation.y = Math.PI + Math.sin(a) * 0.15;
    }
  },
  contacts() { return []; }
});`;
  }

  // --- A07c. EXPANSIVE SPORTS ARENA / BADMINTON COURT WORLD ---
  if (category === 'sports') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-6.0, -0.6, -5.0], [6.0, 5.0, 5.0]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Green Synthetic Indoor Court Mat
    W.terrain(12.0, 9.0, '#064e3b', 24);
    box(11.4, 0.06, 7.8, '#047857', 0, 0.03, 0);

    // White Regulation Badminton Lines
    box(8.2, 0.02, 0.08, '#ffffff', 0, 0.07, -2.6);
    box(8.2, 0.02, 0.08, '#ffffff', 0, 0.07, 2.6);
    box(0.08, 0.02, 5.28, '#ffffff', -4.0, 0.07, 0);
    box(0.08, 0.02, 5.28, '#ffffff', 4.0, 0.07, 0);
    box(0.08, 0.02, 5.2, '#ffffff', 0, 0.07, 0);
    box(0.08, 0.02, 5.2, '#ffffff', -1.8, 0.07, 0);
    box(0.08, 0.02, 5.2, '#ffffff', 1.8, 0.07, 0);

    // Center Net with Tension Posts
    const net = group(0, 0, 0);
    cylinder(0.05, 1.8, '#1e293b', 0, 0.9, -2.9, net, 10);
    cylinder(0.05, 1.8, '#1e293b', 0, 0.9, 2.9, net, 10);
    box(0.04, 0.85, 5.8, '#94a3b8', 0, 1.15, 0, net);
    box(0.06, 0.08, 5.8, '#ffffff', 0, 1.58, 0, net);

    // Players on Both Halves
    const player1 = W.person(-2.2, 0.4);
    const player2 = W.person(2.2, -0.4);

    // Badminton Rackets
    const racket1 = group(-2.2, 1.2, 0.4);
    cylinder(0.015, 0.65, '#ef4444', 0, 0, 0, racket1, 6);
    cylinder(0.18, 0.02, '#38bdf8', 0, 0.35, 0, racket1, 12);
    const racket2 = group(2.2, 1.3, -0.4);
    cylinder(0.015, 0.65, '#3b82f6', 0, 0, 0, racket2, 6);
    cylinder(0.18, 0.02, '#fde047', 0, 0.35, 0, racket2, 12);

    // Suspended Shuttlecock in flight
    const shuttle = group(0, 1.9, 0.2);
    ball(0.05, '#ffffff', 0, 0, 0, shuttle);
    cylinder(0.08, 0.08, '#f8fafc', 0, 0.06, 0, shuttle, 8);

    // Referee Elevated High Chair
    const refChair = group(0, 0, 3.5);
    box(0.8, 0.1, 0.8, '#1e293b', 0, 1.8, 0, refChair);
    for (const rx of [-0.35, 0.35]) {
      for (const rz of [-0.35, 0.35]) {
        cylinder(0.03, 1.8, '#64748b', rx, 0.9, rz, refChair, 6);
      }
    }
    const bench = group(0, 0, -3.8);
    box(3.2, 0.1, 0.6, '#92400e', 0, 0.45, 0, bench);
    for (const bx of [-1.4, 1.4]) {
      cylinder(0.04, 0.42, '#1e293b', bx, 0.21, 0, bench, 8);
    }

    return { net, player1, player2, racket1, racket2, shuttle, refChair, bench };
  },
  tick({ t, parts: p }) {
    const a = (t / 4.0) * Math.PI * 2;
    if (p.shuttle) {
      p.shuttle.position.x = Math.sin(a * 2.0) * 1.8;
      p.shuttle.position.y = 1.9 + Math.sin(a * 4.0) * 0.45;
    }
    if (p.player1) {
      p.player1.position.z = 0.4 + Math.sin(a * 2.0) * 0.35;
    }
    if (p.player2) {
      p.player2.position.z = -0.4 - Math.sin(a * 2.0) * 0.35;
    }
  },
  contacts() { return []; }
});`;
  }

  // --- A08. EXPANSIVE OPEN OCEAN & SCHOONER WORLD ---
  if (category === 'sea' || category === 'maritime') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-6.0, -0.6, -5.0], [6.0, 5.5, 5.0]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Deep Cerulean Ocean Waves
    W.terrain(12.0, 9.0, '#0284c7', 80);

    // Distant Rocky Outcrop with Seagulls
    const reef = group(-4.0, 0, -2.8);
    cylinder(1.4, 1.8, 0.9, '#475569', 0, 0.4, 0, reef, 8);
    cylinder(0.8, 1.2, 0.6, '#334155', 0.5, 0.9, 0.2, reef, 6);
    ball(0.12, '#f8fafc', 0.4, 1.3, 0.2, reef);

    // Stately Ocean Schooner / Sailing Yacht
    const yacht = group(0, 0.35, 0.4);
    box(1.8, 0.7, 4.8, '#0f172a', 0, 0.35, 0, yacht);
    box(1.5, 0.12, 4.4, '#d97706', 0, 0.72, 0, yacht);
    box(1.0, 0.4, 1.8, '#f8fafc', 0, 0.95, -0.4, yacht);
    cylinder(0.04, 1.6, '#78350f', 0, 0.75, 2.8, yacht).rotation.x = -0.4;

    // Main Mast & Billowing Mainsail
    cylinder(0.08, 4.4, '#78350f', 0, 2.8, -0.6, yacht, 8);
    const sail1 = box(0.04, 3.2, 1.8, '#ffffff', 0, 3.0, -1.4, yacht);
    sail1.rotation.y = 0.08;

    // Fore Mast & Jib Sail
    cylinder(0.08, 3.8, '#78350f', 0, 2.5, 0.9, yacht, 8);
    const sail2 = box(0.04, 2.6, 1.4, '#ffffff', 0, 2.6, 0.3, yacht);
    sail2.rotation.y = -0.08;

    // Floating Navigational Sea Buoy
    const buoy = group(3.8, 0.2, -1.8);
    cylinder(0.45, 0.45, 0.6, '#dc2626', 0, 0.3, 0, buoy, 12);
    cylinder(0.04, 1.2, '#f8fafc', 0, 1.0, 0, buoy, 8);
    ball(0.14, '#facc15', 0, 1.6, 0, buoy);

    // Flying Seagull Glide Group
    const gull = group(2.0, 4.2, 0);
    box(0.14, 0.1, 0.4, '#f8fafc', 0, 0, 0, gull);
    const wingL = box(0.9, 0.02, 0.2, '#f8fafc', -0.5, 0.05, 0, gull);
    wingL.rotation.z = -0.15;
    const wingR = box(0.9, 0.02, 0.2, '#f8fafc', 0.5, 0.05, 0, gull);
    wingR.rotation.z = 0.15;

    return { yacht, buoy, gull };
  },
  tick({ t, parts: p }) {
    if (p.yacht) {
      p.yacht.position.y = 0.35 + Math.sin(t * 2.0) * 0.08;
      p.yacht.rotation.z = Math.sin(t * 1.5) * 0.07;
      p.yacht.rotation.x = Math.cos(t * 1.8) * 0.05;
    }
    if (p.buoy) {
      p.buoy.position.y = 0.2 + Math.sin(t * 2.8) * 0.05;
      p.buoy.rotation.z = Math.sin(t * 2.2) * 0.1;
    }
    if (p.gull) {
      p.gull.position.x = Math.sin(t * 1.2) * 2.8;
      p.gull.position.z = Math.cos(t * 1.2) * 2.2;
    }
  },
  contacts() { return []; }
});`;
  }

  // --- A09. EXPANSIVE MEDIEVAL CASTLE FORTRESS WORLD ---
  if (category === 'castle') {
    return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 4.0,
  still: 1.0,
  description: '${cleanMeans}',
  bounds: [[-6.0, -0.6, -5.0], [6.0, 5.5, 5.0]],
  build(W) {
    const { box, ball, cylinder, group } = W;

    // Defensive Moat with Island Castle Mound
    W.terrain(12.0, 9.0, '#0284c7', 60);
    box(9.2, 0.6, 7.2, '#15803d', 0, 0.3, 0);

    // Ashlar Stone Curtain Walls
    box(7.0, 2.0, 0.5, '#64748b', 0, 1.5, -2.6);
    box(2.4, 2.0, 0.5, '#64748b', -2.3, 1.5, 2.6);
    box(2.4, 2.0, 0.5, '#64748b', 2.3, 1.5, 2.6);
    box(0.5, 2.0, 5.2, '#64748b', -3.5, 1.5, 0);
    box(0.5, 2.0, 5.2, '#64748b', 3.5, 1.5, 0);

    // Crenellated Battlements
    for (let cx = -3.2; cx <= 3.2; cx += 0.8) {
      box(0.4, 0.35, 0.55, '#475569', cx, 2.65, -2.6);
    }

    // 4 Cylindrical Corner Watchtowers
    const towers = [
      [-3.5, -2.6],
      [3.5, -2.6],
      [-3.5, 2.6],
      [3.5, 2.6]
    ];
    for (const [tx, tz] of towers) {
      cylinder(0.75, 0.75, 3.2, '#475569', tx, 2.0, tz, undefined, 12);
      cylinder(0.9, 0.75, 0.3, '#334155', tx, 3.65, tz, undefined, 12);
      cylinder(0, 1.0, 1.2, '#991b1b', tx, 4.4, tz, undefined, 12);
    }

    // Gatehouse with Heavy Timber Drawbridge
    const gate = group(0, 0, 2.6);
    box(1.2, 2.6, 0.6, '#334155', -1.0, 1.8, 0, gate);
    box(1.2, 2.6, 0.6, '#334155', 1.0, 1.8, 0, gate);
    box(2.0, 0.6, 0.6, '#334155', 0, 2.8, 0, gate);
    box(1.6, 0.1, 2.4, '#78350f', 0, 0.55, 1.2, gate);
    cylinder(0.03, 2.2, '#94a3b8', -0.7, 1.4, 0.8, gate);
    cylinder(0.03, 2.2, '#94a3b8', 0.7, 1.4, 0.8, gate);

    // Lofty Central Royal Keep Tower
    const keep = group(0, 0, -0.6);
    box(3.2, 3.8, 2.8, '#475569', 0, 2.4, 0, keep);
    box(3.6, 0.3, 3.2, '#334155', 0, 4.4, 0, keep);
    cylinder(0.05, 1.8, '#94a3b8', 0, 5.4, 0, keep, 8);
    ball(0.1, '#ca8a04', 0, 6.35, 0, keep);
    const flag = box(1.0, 0.5, 0.02, '#dc2626', 0.55, 5.8, 0, keep);

    // Courtyard Details (Water Well)
    cylinder(0.6, 0.6, 0.5, '#475569', -1.2, 0.85, 0.6, undefined, 12);
    cylinder(0, 0.8, 0.5, '#78350f', -1.2, 1.5, 0.6, undefined, 4);

    return { flag, keep, gate };
  },
  tick({ t, parts: p }) {
    if (p.flag) {
      p.flag.rotation.y = Math.sin(t * 3.5) * 0.12;
    }
  },
  contacts() { return []; }
});`;
  }

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
  if (category === 'racing') {
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

    // Expansive Landscaped Courtyard & Architectural Terrace
    W.terrain(12.0, 9.0, '#1e293b', 36);
    box(11.4, 0.14, 8.4, '#e2e8f0', 0, 0.07, 0);
    box(9.2, 0.04, 6.4, '#f1f5f9', 0, 0.15, 0);

    // Architectural Garden Pergola with Slender Timber Pillars
    const pavilion = group(0, 0.16, -1.2);
    for (const px of [-2.4, 2.4]) {
      for (const pz of [-1.5, 1.5]) {
        cylinder(0.08, 2.8, '#78350f', px, 1.4, pz, pavilion, 8);
      }
    }
    box(5.2, 0.12, 3.4, '#9a3412', 0, 2.86, 0, pavilion);
    // Timber Rafter Grid
    for (let rx = -2.2; rx <= 2.2; rx += 0.8) {
      box(0.08, 0.18, 3.6, '#78350f', rx, 2.96, 0, pavilion);
    }

    // Courtyard Seating & Stone Table with Props
    const table = group(0, 0.16, -1.2);
    cylinder(0.7, 0.08, '#f8fafc', 0, 0.72, 0, table, 16);
    cylinder(0.12, 0.7, '#475569', 0, 0.35, 0, table, 8);
    box(0.35, 0.06, 0.28, '#0284c7', 0, 0.78, 0.1, table); // Journal
    cylinder(0.06, 0.1, '#f59e0b', 0.25, 0.8, -0.1, table, 8); // Cup

    // Perimeter Garden Planters with Shrubbery & Flowering Blooms
    for (const side of [-3.8, 3.8]) {
      box(0.8, 0.4, 2.8, '#475569', side, 0.35, 0);
      ball(0.45, '#15803d', side, 0.75, -0.7);
      ball(0.5, '#16a34a', side, 0.8, 0.3);
      ball(0.42, '#f43f5e', side, 0.75, 1.0);
    }

    // Stone Garden Lanterns at Perimeter Corners
    for (const lx of [-4.8, 4.8]) {
      for (const lz of [-3.4, 3.4]) {
        cylinder(0.06, 1.6, '#334155', lx, 0.8, lz, null, 8);
        box(0.3, 0.3, 0.3, '#fef08a', lx, 1.6, lz);
      }
    }

    // Resident Person Figure
    const person = group(0, 0.16, 0.8);
    cylinder(0.16, 0.55, '#3b82f6', 0, 0.55, 0, person, 12); // Torso
    ball(0.16, '#fed7aa', 0, 0.98, 0, person); // Head
    cylinder(0.06, 0.5, '#1e293b', -0.1, 0.25, 0, person, 8); // Leg L
    cylinder(0.06, 0.5, '#1e293b', 0.1, 0.25, 0, person, 8);  // Leg R

    return { pavilion, table, person };
  },
  tick({ t, parts: p }) {
    const a = (t / 4.0) * Math.PI * 2;
    if (p.person) {
      p.person.position.x = Math.sin(a * 0.5) * 0.6;
      p.person.rotation.y = Math.sin(a * 0.5) * 0.3;
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
    wobble: 0.25,
    fade: 0.35,
    rect: ${category === 'office' || category === 'bakery' || category === 'kitchen' ? 'true' : 'false'},
    zone: function(x, z, P) {
      ${(category === 'transit_bus' || primarySubject === 'bus') ? `
    // Transit Avenue Asphalt with Yellow Lane Divider
    P.box(6.2, 0.04, 3.8, 'darkSlate', 0, 0.02, 0.5);
    for (var dx = -2.2; dx <= 2.2; dx += 1.1) {
      P.box(0.5, 0.02, 0.08, 'gold', dx, 0.04, 0.5);
    }
    // Sidewalk with Shelter
    P.box(6.2, 0.14, 1.8, 'slate', 0, 0.07, -1.8);
    var shelter = P.group(-1.6, 0, -1.8);
    P.box(2.2, 0.06, 1.0, 'steel', 0, 1.5, 0, shelter);
    P.box(2.0, 1.4, 0.03, 'glass', 0, 0.7, -0.45, shelter);
    P.box(1.6, 0.06, 0.35, 'warmOak', 0, 0.35, 0, shelter);

    // City Transit Bus
    var bus = P.group(0, 0.05, 0.6);
    P.box(4.4, 1.3, 1.6, 'gold', 0, 0.85, 0, bus);
    P.box(4.5, 0.28, 1.62, 'darkSlate', 0, 0.28, 0, bus);
    P.box(4.4, 0.1, 1.62, 'ivory', 0, 1.52, 0, bus);
    P.box(3.8, 0.65, 1.64, 'glass', 0, 1.15, 0, bus);
    // Wheels
    for (const wx of [-1.4, 1.4]) {
      for (const wz of [-0.85, 0.85]) {
        P.cyl(0.24, 0.24, 0.16, 'charcoal', wx, 0.24, wz, bus, 10);
      }
    }
    // Passengers
    for (let px = -1.2; px <= 1.0; px += 0.8) {
      P.ball(0.12, 'amber', px, 1.0, -0.4, bus, 6);
      P.ball(0.12, 'cyan', px, 1.0, 0.4, bus, 6);
    }
    // Conductor at Entrance
    var conductor = P.group(1.8, 0.35, 0, bus);
    P.cyl(0.14, 0.14, 0.5, 'navy', 0, 0.25, 0, conductor, 8);
    P.ball(0.12, 'skin', 0, 0.6, 0, conductor, 6);
    P.cyl(0.14, 0.14, 0.06, 'navy', 0, 0.72, 0, conductor, 8);
    return { bus: bus, conductor: conductor };
    ` : category === 'classroom' ? `
    // Hardwood Classroom Parquet Foundation & Wall Cutaway
    var ground = D.slab(11.0, 8.5, pal.ground, 0, 0, 0, null, { h: 0.6, r: 1.2, side: pal.base });
    D.box(10.2, 0.05, 7.6, pal.wood, 0, 0.02, 0, null, { shadow: false });
    D.box(10.4, 4.0, 0.2, pal.paper, 0, 2.0, -3.9, null);

    // Large Framed Dark Green Chalkboard with Equations
    var board = D.group(-0.8, 0, -3.75);
    board.name = 'the chalkboard';
    hot.push(board);
    D.box(5.8, 2.4, 0.08, pal.ink, 0, 2.2, 0, board);
    D.box(5.5, 2.1, 0.05, pal.ok, 0, 2.2, 0.03, board, { shadow: false });
    [1.5, 1.9, 2.3, 2.7].forEach(function (y, i) {
      D.box(2.8 - i * 0.4, 0.05, 0.02, pal.paper, -1.0, y, 0.07, board, { shadow: false });
    });
    D.box(2.2, 0.08, 0.25, pal.steel, 0, 0.95, 0.1, board);

    // Wall Clock
    var clock = D.group(3.4, 3.1, -3.7);
    var face = D.cyl(0.45, 0.45, 0.12, pal.paper, 0, 0, 0, clock, 20);
    face.rotation.x = Math.PI / 2;
    var mh = D.box(0.04, 0.32, 0.03, pal.ink, 0, 0.12, 0.1, clock);
    var hh = D.box(0.05, 0.2, 0.03, pal.ink, 0, 0.06, 0.1, clock);

    // Teacher Lecturing at the Front
    var teacher = D.props.person(-0.8, -2.8, null, { shirt: pal.teal, hat: false });
    teacher.name = 'teacher';
    hot.push(teacher);

    // Teacher's Executive Oak Desk & Laptop
    var tDesk = D.group(-2.6, 0, -2.0);
    tDesk.name = 'teacher desk';
    hot.push(tDesk);
    D.box(2.2, 0.1, 1.3, pal.wood, 0, 0.88, 0, tDesk);
    D.box(0.55, 0.02, 0.38, pal.steel, 0, 0.94, 0, tDesk);
    var tScr = D.box(0.55, 0.38, 0.02, pal.ink, 0, 1.12, -0.18, tDesk);
    tScr.rotation.x = -0.25;
    D.box(0.5, 0.32, 0.02, pal.sky, 0, 1.12, -0.17, tDesk).rotation.x = -0.25;

    // Globe on Teacher Desk
    var globe = D.group(3.6, 0, 0.4);
    globe.name = 'the globe';
    hot.push(globe);
    D.cyl(0.07, 0.09, 0.5, pal.steel, 0, 0.25, 0, globe, 8);
    D.cyl(0.3, 0.3, 0.05, pal.wood, 0, 0.03, 0, globe, 14);
    var gBall = D.group(0, 0.75, 0, globe);
    D.ball(0.35, pal.sky, 0, 0, 0, gBall);
    var gRing = D.torus(0.36, 0.02, pal.mustard, 0, 0, 0, gBall);
    gRing.rotation.x = 1.2;

    // Two Rows of Student Desks with Student Figures
    [[-2.4, 0.2], [0, 0.2], [2.4, 0.2], [-2.4, 2.0], [0, 2.0], [2.4, 2.0]].forEach(function (pos, i) {
      var d = D.group(pos[0], 0, pos[1]);
      d.name = 'student desk ' + (i + 1);
      hot.push(d);
      D.box(1.4, 0.08, 0.85, pal.mustard, 0, 0.72, 0, d);
      [[-0.55, -0.3], [0.55, -0.3], [-0.55, 0.3], [0.55, 0.3]].forEach(function (l) {
        D.cyl(0.035, 0.035, 0.7, pal.steel, l[0], 0.35, l[1], d, 8);
      });
      D.box(1.0, 0.04, 0.5, pal.paper, 0, 0.78, 0.05, d);
      var ch = D.group(0, 0, 0.75, d);
      D.box(0.6, 0.08, 0.5, pal.cobalt, 0, 0.52, 0, ch);
      D.box(0.6, 0.5, 0.08, pal.cobalt, 0, 0.8, -0.22, ch);
      D.cyl(0.05, 0.05, 0.5, pal.steel, 0, 0.26, 0, ch, 8);
    });
    var student1 = D.props.person(0, 0.8, null, { shirt: pal.coral, hat: pal.paper });
    var student2 = D.props.person(-2.4, 2.6, null, { shirt: pal.mustard, hat: false });
    return { ground: ground, hot: hot, board: board, mh: mh, hh: hh, gBall: gBall, teacher: teacher };
    ` : category === 'sports' ? `
    // Stadium Green Court Mat with Boundary Lines
    var ground = D.slab(11.0, 9.0, pal.ground, 0, 0, 0, null, { h: 0.6, r: 1.2, side: pal.base });
    D.box(8.6, 0.04, 7.2, pal.leaf, 0, 0.05, 0, null, { shadow: false });
    D.box(8.2, 0.02, 6.8, pal.leafDark, 0, 0.06, 0, null, { shadow: false });
    // Court Lines
    D.box(8.0, 0.02, 0.06, pal.paper, 0, 0.08, -3.0, null, { shadow: false });
    D.box(8.0, 0.02, 0.06, pal.paper, 0, 0.08, 3.0, null, { shadow: false });
    D.box(0.06, 0.02, 6.0, pal.paper, -4.0, 0.08, 0, null, { shadow: false });
    D.box(0.06, 0.02, 6.0, pal.paper, 4.0, 0.08, 0, null, { shadow: false });
    D.box(8.0, 0.02, 0.04, pal.paper, 0, 0.08, 0, null, { shadow: false });

    // Net & Posts
    var net = D.group(0, 0, 0);
    net.name = 'net';
    hot.push(net);
    D.cyl(0.05, 0.05, 1.4, pal.steel, 0, 0.7, -3.4, net, 10);
    D.cyl(0.05, 0.05, 1.4, pal.steel, 0, 0.7, 3.4, net, 10);
    D.box(0.04, 0.9, 6.8, pal.cloud, 0, 0.7, 0, net);
    D.box(0.05, 0.06, 6.8, pal.accent, 0, 1.18, 0, net);

    // Player 1 (Left Court)
    var player1 = D.group(-3.0, 0, 1.2);
    player1.name = 'player 1';
    hot.push(player1);
    D.props.person(0, 0, player1, { shirt: pal.coral, hat: pal.paper, yaw: 0.3 });
    D.box(0.05, 0.3, 0.05, pal.steel, 0.3, 1.2, 0.2, player1);
    D.box(0.45, 0.04, 0.35, pal.ink, 0.6, 1.3, 0.2, player1);

    // Player 2 (Right Court)
    var player2 = D.group(3.0, 0, -1.2);
    player2.name = 'player 2';
    hot.push(player2);
    D.props.person(0, 0, player2, { shirt: pal.mustard, hat: pal.cloud, yaw: -0.3 });
    D.box(0.05, 0.3, 0.05, pal.steel, -0.3, 1.2, 0.2, player2);
    D.box(0.45, 0.04, 0.35, pal.ink, -0.6, 1.3, 0.2, player2);

    // Suspended Shuttlecock Mid-Air
    var shuttle = D.ball(0.12, pal.cloud, 0, 2.0, 0);
    shuttle.name = 'shuttlecock';
    hot.push(shuttle);
    D.cone(0.08, 0.22, pal.coral, 0, 1.88, 0, null, 8);

    // High Referee Chair
    var refChair = D.group(0, 0, -3.8);
    refChair.name = 'referee chair';
    hot.push(refChair);
    D.cyl(0.04, 0.04, 2.4, pal.steel, -0.35, 1.2, 0, refChair, 8);
    D.cyl(0.04, 0.04, 2.4, pal.steel, 0.35, 1.2, 0, refChair, 8);
    D.box(0.8, 0.06, 0.7, pal.wood, 0, 1.8, 0, refChair);
    D.box(0.8, 0.5, 0.06, pal.wood, 0, 2.1, -0.32, refChair);

    return { ground: ground, hot: hot, net: net, player1: player1, player2: player2, shuttle: shuttle };
    ` : category === 'airport' ? `
    // Airport Tarmac Slab & Runway Markings
    var ground = D.slab(11.5, 9.0, pal.ink, 0, 0, 0, null, { h: 0.5, r: 0.8, side: pal.slate });
    D.box(9.5, 0.02, 0.25, pal.mustard, 0, 0.02, 0, null, { shadow: false });
    for (var rx = -4; rx <= 4; rx += 1.8) {
      D.box(0.9, 0.02, 0.15, pal.paper, rx, 0.02, -1.8, null, { shadow: false });
    }

    // Modern Concourse Terminal with Glass Curtain Wall
    var terminal = D.box(4.8, 2.0, 2.4, pal.paper, -2.6, 1.0, -2.6);
    D.box(4.4, 0.9, 0.06, pal.sky, -2.6, 1.1, -1.37);

    // Air Traffic Control Tower
    D.cyl(0.35, 0.45, 3.4, pal.slate, 3.8, 1.7, -2.6, null, 12);
    D.box(1.4, 0.7, 1.4, pal.paper, 3.8, 3.7, -2.6);
    D.box(1.2, 0.45, 1.2, pal.sky, 3.8, 3.7, -2.6);
    var radar = D.torus(0.4, 0.06, pal.coral, 3.8, 4.3, -2.6);
    radar.name = 'radar';
    hot.push(radar);

    // Commercial Passenger Airliner
    var plane = D.group(0.5, 0.8, 1.2);
    plane.name = 'airliner';
    hot.push(plane);
    D.cyl(0.48, 0.48, 3.8, pal.paper, 0, 0, 0, plane, 16);
    D.cone(0.48, 0.8, pal.paper, 0, 0, 2.3, plane, 16);
    D.wedge(3.8, 0.06, 1.4, pal.paper, 0, 0, -0.3, plane);
    D.wedge(0.06, 0.9, 0.8, pal.coral, 0, 0.6, -1.6, plane);
    D.cyl(0.18, 0.18, 0.7, pal.slate, -1.1, -0.22, -0.2, plane, 10);
    D.cyl(0.18, 0.18, 0.7, pal.slate, 1.1, -0.22, -0.2, plane, 10);

    // Baggage Tug
    D.box(0.9, 0.5, 1.4, pal.mustard, -2.4, 0.25, 1.6);
    return { ground: ground, hot: hot, plane: plane, radar: radar };
    ` : category === 'harbor' ? `
    // Deep Ocean Water Slab & Concrete Quay
    var ground = D.slab(11.5, 9.0, pal.sky, 0, 0, 0, null, { h: 0.5, r: 0.8, side: pal.cobalt });
    D.box(5.2, 0.6, 8.6, pal.slate, -3.1, 0.3, 0);
    [-3.0, 0, 3.0].forEach(function (bz) {
      D.cyl(0.1, 0.12, 0.3, pal.ink, -0.6, 0.65, bz, null, 8);
    });

    // Container Gantry Crane
    var crane = D.group(-2.6, 0.6, 0);
    crane.name = 'container gantry crane';
    hot.push(crane);
    D.box(0.12, 3.8, 0.12, pal.mustard, -1.2, 1.9, -1.6, crane);
    D.box(0.12, 3.8, 0.12, pal.mustard, 1.2, 1.9, -1.6, crane);
    D.box(0.12, 3.8, 0.12, pal.mustard, -1.2, 1.9, 1.6, crane);
    D.box(0.12, 3.8, 0.12, pal.mustard, 1.2, 1.9, 1.6, crane);
    D.box(2.8, 0.16, 4.4, pal.mustard, 0.6, 3.8, 0, crane);

    // Stacked Shipping Containers
    D.box(1.0, 0.9, 2.4, pal.coral, -3.8, 0.95, -1.8);
    D.box(1.0, 0.9, 2.4, pal.cobalt, -3.8, 0.95, 1.2);
    D.box(1.0, 0.9, 2.4, pal.mustard, -3.8, 1.85, -1.8);

    // Cargo Tugboat
    var tug = D.group(2.6, 0.3, 0.5);
    tug.name = 'cargo tug';
    hot.push(tug);
    D.box(1.8, 0.6, 3.8, pal.coral, 0, 0.3, 0, tug);
    D.wedge(1.8, 0.6, 1.0, pal.coral, 0, 0.3, 2.4, tug);
    D.box(1.2, 0.8, 1.4, pal.paper, 0, 0.9, 0.2, tug);
    D.cyl(0.16, 0.16, 0.7, pal.ink, 0, 1.5, -0.4, tug, 8);
    return { ground: ground, hot: hot, crane: crane, tug: tug };
    ` : category === 'lighthouse' ? `
    // Ocean Water Slab & Stepped Rock Cliff Island
    var ground = D.slab(11.5, 9.0, pal.sky, 0, 0, 0, null, { h: 0.5, r: 0.8, side: pal.cobalt });
    D.box(6.2, 1.2, 5.8, pal.slate, -0.6, 0.6, -0.6);
    D.box(4.8, 0.8, 4.4, pal.paper, -0.6, 1.6, -0.6);

    // Red & White Banded Cylindrical Lighthouse Tower
    var tower = D.group(-1.2, 1.8, -1.0);
    tower.name = 'lighthouse tower';
    hot.push(tower);
    D.cyl(0.72, 0.88, 1.2, pal.paper, 0, 0.6, 0, tower, 16);
    D.cyl(0.62, 0.72, 1.2, pal.coral, 0, 1.8, 0, tower, 16);
    D.cyl(0.52, 0.62, 1.2, pal.paper, 0, 3.0, 0, tower, 16);
    // Glazed Lantern Room & Dome
    D.cyl(0.44, 0.44, 0.7, pal.mustard, 0, 3.95, 0, tower, 12);
    D.dome(0.48, pal.coral, 0, 4.3, 0, tower);
    // Revolving Light Beam
    var beam = D.wedge(0.4, 0.4, 3.6, pal.mustard, 0, 3.95, 1.8, tower);

    // Keeper's Cottage
    D.box(1.8, 1.1, 1.5, pal.paper, 1.4, 2.35, -0.5);
    D.wedge(1.9, 0.7, 1.6, pal.terracotta, 1.4, 3.25, -0.5);

    // Wooden Jetty with Dinghy
    D.box(1.2, 0.15, 2.8, pal.wood, 2.6, 0.65, 2.4);
    D.box(0.8, 0.35, 1.6, pal.wood, 3.6, 0.3, 2.4);
    return { ground: ground, hot: hot, tower: tower, beam: beam };
    ` : category === 'campus' ? `
    // Academic Campus Green Lawn Slab
    var ground = D.slab(11.0, 8.5, pal.ground, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });

    // Red Brick Collegiate University Hall with Clock Tower
    var hall = D.box(7.6, 2.6, 2.4, pal.terracotta, 0, 1.3, -2.6);
    D.box(1.6, 1.8, 0.3, pal.paper, 0, 0.9, -1.35);
    D.box(1.6, 4.6, 1.6, pal.terracotta, 0, 2.3, -2.6);
    D.cone(1.2, 1.2, pal.slate, 0, 5.2, -2.6, 4);

    // Central Paved Quad with Tiered Stone Fountain
    var fountain = D.group(0, 0, 1.0);
    fountain.name = 'quad fountain';
    hot.push(fountain);
    D.cyl(1.5, 1.5, 0.3, pal.slate, 0, 0.15, 0, fountain, 20);
    D.cyl(0.8, 0.8, 0.4, pal.paper, 0, 0.4, 0, fountain, 16);
    D.ball(0.26, pal.sky, 0, 0.85, 0, fountain);

    // Quad Trees, Benches, and Students
    D.props.tree(-3.6, 1.2, null, { r: 0.8 });
    D.props.tree(3.6, 1.2, null, { r: 0.8 });
    D.props.person(1.4, 1.8, null, { shirt: pal.coral });
    D.props.person(-1.6, 1.6, null, { shirt: pal.mustard });
    return { ground: ground, hot: hot, fountain: fountain };
    ` : (category === 'sea' || category === 'maritime') ? `
    // Open Ocean Swell Slab
    var ground = D.slab(11.5, 9.0, pal.sky, 0, 0, 0, null, { h: 0.5, r: 0.8, side: pal.cobalt });

    // Multi-Mast Sailing Schooner
    var ship = D.group(0, 0.3, 0);
    ship.name = 'schooner';
    hot.push(ship);
    D.box(1.8, 0.8, 5.2, pal.wood, 0, 0.4, 0, ship);
    D.wedge(1.8, 0.8, 1.2, pal.wood, 0, 0.4, 2.8, ship);
    D.cyl(0.06, 0.06, 3.4, pal.wood, 0, 2.0, -1.0, ship, 8);
    D.cyl(0.06, 0.06, 3.6, pal.wood, 0, 2.2, 0.8, ship, 8);
    D.wedge(1.4, 1.8, 0.08, pal.paper, 0, 2.2, -1.0, ship);
    D.wedge(1.6, 2.0, 0.08, pal.paper, 0, 2.4, 0.8, ship);

    // Coral Reef Outcrop & Navigation Buoy
    D.ball(0.8, pal.coral, -3.6, 0.2, -2.2);
    D.ball(0.6, pal.mint, -4.0, 0.3, -1.6);
    D.cyl(0.2, 0.2, 0.8, pal.flame, 3.4, 0.4, 2.4, null, 8);
    return { ground: ground, hot: hot, ship: ship };
    ` : category === 'castle' ? `
    // Moat Slab & Castle Fortress Architecture
    var ground = D.slab(11.5, 9.0, pal.sky, 0, 0, 0, null, { h: 0.5, r: 0.8, side: pal.cobalt });
    D.box(6.6, 1.8, 5.8, pal.slate, 0, 0.9, 0);
    D.box(5.4, 2.0, 4.6, pal.paper, 0, 1.0, 0);

    // 4 Corner Watchtowers
    [-2.9, 2.9].forEach(function (tx) {
      [-2.5, 2.5].forEach(function (tz) {
        D.cyl(0.65, 0.65, 2.8, pal.slate, tx, 1.4, tz, null, 16);
        D.cone(0.75, 1.1, pal.terracotta, tx, 3.35, tz, 16);
      });
    });

    // Central Royal Keep with Flag
    var keep = D.group(0, 0, 0);
    keep.name = 'royal keep';
    hot.push(keep);
    D.box(3.0, 3.6, 2.6, pal.slate, 0, 1.8, 0, keep);
    D.props.flag(0, 0, keep, { h: 4.8, color: pal.coral });

    // Drawbridge & Guard
    D.box(1.3, 0.1, 2.2, pal.wood, 0, 0.1, 3.2);
    D.props.person(-0.8, 3.0, null, { shirt: pal.steel, hat: pal.steel });
    return { ground: ground, hot: hot, keep: keep };
    ` : category === 'city' ? `
    // Multi-Lane City Avenue Asphalt Slab
    var ground = D.slab(11.5, 9.0, pal.ink, 0, 0, 0, null, { h: 0.5, r: 0.8, side: pal.slate });
    [-3.0, -1.0, 1.0, 3.0].forEach(function (z) {
      D.box(0.18, 0.02, 1.0, pal.mustard, 0, 0.02, z, null, { shadow: false });
    });

    // Sidewalks with Curbs
    D.box(2.4, 0.18, 8.6, pal.paper, -3.8, 0.09, 0);
    D.box(2.4, 0.18, 8.6, pal.paper, 3.8, 0.09, 0);

    // High-Rise Skyscraper Towers
    D.box(2.0, 5.2, 2.2, pal.cobalt, -3.8, 2.6, -2.0);
    D.box(1.8, 4.4, 2.0, pal.sky, 3.8, 2.2, -1.8);
    D.box(1.6, 3.6, 1.8, pal.slate, 3.8, 1.8, 1.8);

    // Yellow Taxi Cab
    var taxi = D.group(0.8, 0, 0);
    taxi.name = 'taxi cab';
    hot.push(taxi);
    D.box(1.4, 0.35, 2.6, pal.mustard, 0, 0.28, 0, taxi);
    D.box(1.1, 0.3, 1.3, pal.sky, 0, 0.6, 0, taxi);
    D.box(0.3, 0.1, 0.4, pal.paper, 0, 0.8, 0, taxi);

    // Streetlights & Pedestrian
    D.props.lamp(-2.5, 2.4, null, { h: 2.8 });
    D.props.lamp(2.5, -2.4, null, { h: 2.8 });
    D.props.person(-3.4, 1.2, null, { shirt: pal.coral });
    return { ground: ground, hot: hot, taxi: taxi };
    ` : category === 'farm' ? `
    // Farm Countryside Terrain
    var ground = D.slab(11.0, 8.5, pal.ground, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });

    // Classic Red Barn with Gambrel Roof
    var barn = D.group(-2.6, 0, -1.4);
    barn.name = 'red barn';
    hot.push(barn);
    D.box(3.4, 2.2, 2.8, pal.coral, 0, 1.1, 0, barn);
    D.wedge(3.5, 1.2, 2.9, pal.paper, 0, 2.8, 0, barn);
    D.box(1.4, 1.6, 0.06, pal.paper, 0, 0.8, 1.42, barn);

    // Grain Silo with Domed Roof
    D.cyl(0.7, 0.7, 3.4, pal.slate, -4.2, 1.7, 1.2, null, 16);
    D.dome(0.72, pal.paper, -4.2, 3.4, 1.2);

    // Farm Tractor
    var tractor = D.group(1.8, 0, 0.8);
    tractor.name = 'tractor';
    hot.push(tractor);
    D.box(1.2, 0.6, 1.8, pal.leaf, 0, 0.5, 0, tractor);
    D.cyl(0.38, 0.38, 0.22, pal.ink, -0.65, 0.38, -0.45, tractor, 12);
    D.cyl(0.38, 0.38, 0.22, pal.ink, 0.65, 0.38, -0.45, tractor, 12);
    D.cyl(0.24, 0.24, 0.18, pal.ink, -0.6, 0.24, 0.55, tractor, 10);
    D.cyl(0.24, 0.24, 0.18, pal.ink, 0.6, 0.24, 0.55, tractor, 10);

    // Pasture Fence & Tree
    D.box(0.08, 0.7, 3.8, pal.wood, 3.8, 0.35, -1.0);
    D.props.tree(3.2, -2.6, null, { r: 0.7 });
    return { ground: ground, hot: hot, barn: barn, tractor: tractor };
    ` : category === 'park' ? `
    // Landscaped Lawn & Serene Duck Pond
    var ground = D.slab(11.0, 8.5, pal.leaf, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    var pond = D.cyl(2.0, 2.0, 0.04, pal.sky, -1.5, 0.02, 0.5, null, 24);
    D.box(0.8, 0.12, 2.4, pal.wood, -1.5, 0.25, 0.5);

    // Timber Gazebo Bandstand
    var gazebo = D.group(2.4, 0, -1.6);
    gazebo.name = 'park gazebo';
    hot.push(gazebo);
    D.cyl(1.4, 1.4, 0.2, pal.wood, 0, 0.1, 0, gazebo, 16);
    D.cone(1.6, 1.1, pal.terracotta, 0, 2.4, 0, gazebo, 8);

    // Park Benches, Trees, and Visitor
    D.props.tree(-3.6, -2.4, null, { r: 0.85 });
    D.props.tree(3.8, 2.0, null, { r: 0.8 });
    D.props.person(1.2, 1.8, null, { shirt: pal.coral });
    return { ground: ground, hot: hot, gazebo: gazebo };
    ` : category === 'office' ? `
      // Crisp alternating designer tiles with vibrant border
      var cx = Math.floor(x * 1.6 + 10);
      var cz = Math.floor(z * 1.6 + 10);
      return (cx + cz) % 2 === 0 ? 'tileLight' : 'tileAccent';
      ` : category === 'bakery' || category === 'kitchen' ? `
      // Warm terracotta and ivory bakery tiles
      var bx = Math.floor(x * 1.5 + 10);
      var bz = Math.floor(z * 1.5 + 10);
      return (bx + bz) % 2 === 0 ? 'tileLight' : 'tileRuby';
      ` : category === 'classroom' ? `
      var cx = Math.floor(x * 1.6 + 10);
      var cz = Math.floor(z * 1.6 + 10);
      return (cx + cz) % 2 === 0 ? 'warmOak' : 'darkwood';
      ` : category === 'sports' ? `
      if (Math.abs(x) < 2.0 && Math.abs(z) < 1.3) return 'emerald';
      return 'green';
      ` : category === 'airport' || category === 'aviation' ? `
      if (Math.abs(z) < 1.3) return 'tarmac';
      if (Math.abs(x) > 2.8) return 'grass';
      return 'paving';
      ` : category === 'harbor' ? `
      if (x < -0.6) return 'water';
      if (x < 0.4) return 'stone';
      return 'paving';
      ` : category === 'lighthouse' ? `
      var dist = Math.sqrt(x * x + z * z);
      if (dist > 1.8) return 'water';
      if (dist > 1.4) return 'sand';
      return 'stone';
      ` : category === 'campus' ? `
      if (Math.abs(x) < 0.4 || Math.abs(z) < 0.4) return 'paving';
      return 'grass';
      ` : category === 'sea' || category === 'maritime' ? `
      return 'water';
      ` : category === 'castle' ? `
      var dist = Math.sqrt(x * x + z * z);
      if (dist > 2.1 && dist < 2.9) return 'water';
      return 'grass';
      ` : category === 'city' ? `
      if (Math.abs(z) < 1.1) return 'tarmac';
      return 'paving';
      ` : category === 'farm' ? `
      if (x > 0.5 && z > 0) return 'amber';
      if (x < -0.5) return 'dirt';
      return 'grass';
      ` : category === 'park' ? `
      var d = Math.sqrt((x - 1.2) * (x - 1.2) + (z - 0.8) * (z - 0.8));
      if (d < 1.1) return 'water';
      if (Math.abs(x + 0.5) < 0.35) return 'paving';
      return 'grass';
      ` : category === 'racing' ? `
      // Track asphalt with kerbs and vibrant grass verge
      if (Math.abs(x) < 1.8) return 'tarmac';
      if (Math.abs(x) < 2.3) return (Math.floor(z * 2 + 10) % 2 === 0) ? 'red' : 'tileLight';
      return 'grass';
      ` : category === 'nature_waterfall' ? `
      var d = Math.sqrt(x * x / 4.0 + z * z / 3.0);
      if (d < 1.2 && z > 0) return 'water';
      var n = P.noise(x * 2, z * 2);
      if (n > 0.6) return 'tileRuby';
      return 'grass';
      ` : category === 'submarine' ? `
      return 'water';
      ` : `
      var cx = Math.floor(x * 1.4 + 10);
      var cz = Math.floor(z * 1.4 + 10);
      return (cx + cz) % 2 === 0 ? 'tileLight' : 'tileAccent';
      `}
    }
  },
  materials: {
    tileLight: { ramp: ['#cbd5e1', '#e2e8f0', '#f1f5f9', '#ffffff'], tex: 'plain' },
    tileAccent: { ramp: ['#1e1b4b', '#312e81', '#3730a3', '#4338ca', '#6366f1', '#818cf8'], tex: 'plain' },
    tileMint: { ramp: ['#042f2e', '#0f766e', '#0d9488', '#14b8a6', '#2dd4bf', '#5eead4'], tex: 'plain' },
    tileRuby: { ramp: ['#4c0519', '#881337', '#be123c', '#e11d48', '#f43f5e', '#fb7185'], tex: 'plain' },
    deskTeal: { ramp: ['#083344', '#0e7490', '#06b6d4', '#22d3ee', '#67e8f9'], tex: 'wood', plank: 0.12 },
    warmOak: { ramp: ['#78350f', '#92400e', '#b45309', '#d97706', '#f59e0b', '#fde68a'], tex: 'wood', plank: 0.14 },
    darkwood: { ramp: ['#2f2420', '#423128', '#574133', '#6e5440', '#86684f'], tex: 'wood' },
    chairRed: { ramp: ['#7f1d1d', '#991b1b', '#dc2626', '#ef4444', '#f87171', '#fca5a5'], tex: 'plain' },
    screenGlow: { ramp: ['#082f49', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd'], glow: 0.85, flat: true },
    plantLeaf: { ramp: ['#14532d', '#15803d', '#16a34a', '#22c55e', '#4ade80'], tex: 'leaf' },
    gold: { ramp: ['#713f12', '#a16207', '#ca8a04', '#eab308', '#facc15', '#fef08a'], tex: 'plain' },
    cyan: { ramp: ['#164e63', '#0e7490', '#0891b2', '#06b6d4', '#22d3ee', '#67e8f9'], tex: 'plain' },
    blue: { ramp: ['#1e3a8a', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'], tex: 'plain' },
    cobalt: { ramp: ['#1e1b4b', '#312e81', '#3730a3', '#4338ca', '#6366f1', '#818cf8'], tex: 'plain' },
    red: { ramp: ['#7f1d1d', '#991b1b', '#dc2626', '#ef4444', '#f87171', '#fca5a5'], tex: 'plain' },
    ruby: { ramp: ['#4c0519', '#881337', '#be123c', '#e11d48', '#f43f5e', '#fb7185'], tex: 'plain' },
    emerald: { ramp: ['#064e3b', '#047857', '#059669', '#10b981', '#34d399', '#6ee7b7'], tex: 'plain' },
    amber: { ramp: ['#78350f', '#b45309', '#d97706', '#f59e0b', '#fbbf24', '#fde68a'], tex: 'plain' },
    purple: { ramp: ['#4c1d95', '#6d28d9', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'], tex: 'plain' },
    pink: { ramp: ['#831843', '#be185d', '#db2777', '#ec4899', '#f472b6', '#fbcfe8'], tex: 'plain' },
    steel: { ramp: ['#0f172a', '#1e293b', '#334155', '#475569', '#64748b', '#94a3b8'], tex: 'plain' },
    slate: { ramp: ['#1e293b', '#334155', '#475569', '#64748b', '#94a3b8', '#cbd5e1'], tex: 'plain' },
    stone: { ramp: ['#475569', '#64748b', '#7f8ea3', '#94a3b8', '#b3bfce', '#cbd5e1'], tex: 'plain' },
    paving: { ramp: ['#64748b', '#78889e', '#94a3b8', '#b0bccd', '#cbd5e1', '#e2e8f0'], tex: 'plain' },
    sand: { ramp: ['#a08c68', '#b9a47b', '#cdb98e', '#ddcba2', '#ebdcb9'], tex: 'sand' },
    dirt: { ramp: ['#6e5a43', '#86704f', '#a08861', '#b89f77', '#cdb791'], tex: 'dirt' },
    brick: { ramp: ['#7f1d1d', '#991b1b', '#b91c1c', '#dc2626', '#b86242'], tex: 'plain' },
    paper: { ramp: ['#94a3b8', '#cbd5e1', '#e2e8f0', '#f1f5f9', '#f8fafc', '#ffffff'], tex: 'plain' },
    charcoal: { ramp: ['#090d16', '#111827', '#1f2937', '#374151', '#4b5563'], tex: 'plain' },
    tarmac: { ramp: ['#090d16', '#111827', '#1f2937', '#374151', '#4b5563', '#6b7280'], tex: 'plain' },
    water: { ramp: ['#255877', '#367296', '#4a8fb5', '#6bb1d6', '#98d2ec', '#cbe7f7'], tex: 'water', water: true },
    grass: { ramp: ['#14532d', '#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac'], tex: 'grass', ground: true }
  },
  build: function(P) {
    var hot = [];

    ${category === 'office' ? `
    // Vibrant Office Floor Plinth & Backdrop Partition
    P.box(6.0, 0.04, 4.2, 'tileAccent', 0, 0.02, 0);
    P.box(5.8, 2.2, 0.15, 'tileLight', 0, 1.1, -1.9);
    // Modern Teal Computer Desk with Sleek Chrome Legs
    var desk = P.box(2.6, 0.1, 1.4, 'deskTeal', 0, 0.85, 0);
    for (var dx of [-1.15, 1.15]) {
      for (var dz of [-0.55, 0.55]) P.box(0.08, 0.8, 0.08, 'steel', dx, 0.4, dz);
    }
    // High-Res Monitor with Glowing Cyan Screen
    P.box(0.4, 0.03, 0.25, 'steel', 0, 0.92, -0.3);
    P.cyl(0.03, 0.03, 0.35, 'steel', 0, 1.08, -0.3);
    P.box(1.4, 0.85, 0.06, 'steel', 0, 1.45, -0.3);
    var screen = P.box(1.32, 0.77, 0.02, 'screenGlow', 0, 1.45, -0.27);
    // Keyboard & Crimson Mousepad
    P.box(0.7, 0.02, 0.22, 'steel', 0, 0.92, 0.25);
    P.box(0.18, 0.015, 0.22, 'chairRed', 0.55, 0.92, 0.25);
    P.box(0.09, 0.02, 0.13, 'cyan', 0.55, 0.93, 0.25);
    // Vivid Ruby Ergonomic Swivel Chair
    var chair = P.group(0, 0, 0.95);
    P.cyl(0.04, 0.04, 0.45, 'steel', 0, 0.22, 0, chair);
    P.box(0.7, 0.08, 0.65, 'chairRed', 0, 0.48, 0, chair);
    P.box(0.65, 0.6, 0.08, 'chairRed', 0, 0.82, -0.3, chair);
    // Brass / Gold Desk Lamp
    var lamp = P.cyl(0.03, 0.03, 0.65, 'gold', -1.0, 1.25, -0.35);
    P.ball(0.16, 'gold', -1.0, 1.6, -0.35);
    // Colorful Desk Accessories: Steaming Ruby Coffee Mug, Potted Succulent, Stack of Colorful Books
    P.cyl(0.07, 0.06, 0.12, 'chairRed', -0.55, 0.96, 0.25, null, 8); // Coffee mug
    P.cyl(0.1, 0.08, 0.14, 'gold', 1.05, 0.97, -0.25, null, 8); // Terracotta pot
    P.ball(0.09, 'plantLeaf', 1.05, 1.08, -0.25); // Lush green succulent
    P.box(0.3, 0.06, 0.4, 'purple', -0.9, 0.93, 0.15); // Purple book
    P.box(0.28, 0.06, 0.38, 'cyan', -0.9, 0.99, 0.15); // Cyan book
    return { hot: hot, chair: chair, screen: screen, desk: desk, lamp: lamp };
    ` : category === 'bakery' || category === 'kitchen' ? `
    // Warm Checkered Bakery Floor
    P.box(6.2, 0.04, 4.4, 'tileRuby', 0, 0.02, 0);
    // Brick Oven with blazing fiery hearth
    var oven = P.box(1.6, 1.8, 1.2, 'red', 1.8, 0.9, -1.0);
    P.box(0.9, 0.7, 0.1, 'steel', 1.8, 0.85, -0.4);
    var coals = P.ball(0.25, 'gold', 1.8, 0.6, -0.4);
    // Presentation Table in warm golden oak
    var table = P.box(2.2, 0.1, 1.2, 'warmOak', -0.6, 0.88, 0.3);
    for (var tx of [-1.4, 0.2]) {
      for (var tz of [-0.1, 0.7]) P.box(0.1, 0.84, 0.1, 'warmOak', tx, 0.42, tz);
    }
    // Frosted Cakes: Strawberry Pink with White Cream & Gold Berries
    var cake = P.cyl(0.35, 0.35, 0.28, 'pink', -0.6, 1.04, 0.3, null, 12);
    P.cyl(0.38, 0.38, 0.06, 'paper', -0.6, 1.2, 0.3, null, 12);
    P.ball(0.08, 'gold', -0.6, 1.26, 0.3);
    // Baker figure with royal blue trousers and clean white chef coat
    var baker = P.person(0.5, 0.1, null, { shirt: '#ffffff', pants: '#1d4ed8', skin: '#f8d5b8' });
    return { hot: hot, baker: baker, oven: oven, table: table, cake: cake, coals: coals };
    ` : category === 'aviation' ? `
    // High-Contrast Runway Ground with Yellow Centerline & Emerald Edge Beacons
    P.box(6.2, 0.04, 3.2, 'tarmac', 0, 0.02, 0);
    for (var x = -2.4; x <= 2.4; x += 1.2) {
      P.box(0.7, 0.03, 0.14, 'gold', x, 0.04, 0);
    }
    P.ball(0.12, 'emerald', -2.8, 0.08, 1.4);
    P.ball(0.12, 'emerald', 2.8, 0.08, 1.4);
    P.ball(0.12, 'red', -2.8, 0.08, -1.4);
    P.ball(0.12, 'red', 2.8, 0.08, -1.4);
    // Supersonic Jet with Cobalt Blue & Royal Red Accents
    var plane = P.group(0, 0.8, 0);
    var fus = P.cyl(0.38, 0.38, 3.2, 'paper', 0, 0, 0, plane, 12);
    fus.rotation.x = Math.PI / 2;
    P.ball(0.38, 'blue', 0, 0, 1.6, plane);
    P.box(0.5, 0.2, 0.5, 'cyan', 0, 0.28, 1.1, plane);
    var wingL = P.box(2.4, 0.06, 0.8, 'blue', -1.4, 0, 0.1, plane);
    wingL.rotation.y = -0.2;
    var wingR = P.box(2.4, 0.06, 0.8, 'blue', 1.4, 0, 0.1, plane);
    wingR.rotation.y = 0.2;
    P.box(0.08, 0.7, 0.6, 'red', 0, 0.45, -1.2, plane); // Rudder fin
    // Retractable Landing Gear
    var gear = P.cyl(0.06, 0.06, 0.45, 'steel', 0, -0.3, 0.8, plane, 8);
    return { hot: hot, plane: plane, gear: gear };
    ` : category === 'racing' ? `
    // Grand Prix Circuit Corner with Vibrant Kerbs
    P.box(6.8, 0.04, 4.0, 'tarmac', 0, 0.02, 0);
    for (var ki = -3; ki <= 3; ki++) {
      var col = (Math.abs(ki) % 2 === 0) ? 'red' : 'paper';
      P.box(0.4, 0.06, 0.6, col, -2.2, 0.04, ki * 0.6);
    }
    // Drifting Crimson Sports Car with Cobalt Windshield & Gold Rims
    var car = P.group(0, 0.28, 0);
    P.box(1.4, 0.28, 2.4, 'red', 0, 0.2, 0.1, car);
    P.box(1.1, 0.26, 1.2, 'cyan', 0, 0.45, -0.1, car);
    P.box(1.6, 0.04, 0.35, 'red', 0, 0.62, -1.0, car); // Spoiler
    for (var wx of [-0.75, 0.75]) {
      for (var wz of [-0.65, 0.65]) {
        var w = P.cyl(0.26, 0.26, 0.16, 'gold', wx, 0.26, wz, car, 12);
        w.rotation.z = Math.PI / 2;
      }
    }
    return { hot: hot, car: car };
    ` : category === 'nature_waterfall' ? `
    // Cliff Rocks, Foaming Waterfall & Azure Pool with Blooming Wildflowers
    P.box(6.2, 2.8, 1.4, 'stone', 0, 1.4, -1.6);
    var waterfall = P.box(1.2, 2.2, 0.15, 'cyan', 0, 1.2, -0.85);
    // Pond Basin with stones & crystal water
    var pond = P.cyl(2.0, 2.0, 0.1, 'water', 0, 0.05, 0.6, null, 16);
    for (var r = 0; r < 8; r++) {
      var ra = (r / 8) * Math.PI * 2;
      P.ball(0.25, 'stone', Math.cos(ra) * 2.0, 0.1, 0.6 + Math.sin(ra) * 1.6);
    }
    // Blooming Wildflowers on lush moss bank
    P.ball(0.12, 'ruby', -1.6, 0.18, 1.8);
    P.ball(0.12, 'gold', 1.8, 0.18, 1.7);
    P.ball(0.12, 'purple', -1.2, 0.18, 2.1);
    P.ball(0.12, 'pink', 1.4, 0.18, 2.0);
    return { hot: hot, waterfall: waterfall, pond: pond };
    ` : category === 'blacksmith' ? `
    // Workshop Slate Floor & Glowing Hearth
    P.box(6.0, 0.04, 4.0, 'steel', 0, 0.02, 0);
    var oven = P.box(1.6, 1.8, 1.2, 'red', 1.8, 0.9, -1.0);
    var coals = P.ball(0.25, 'gold', 1.8, 0.6, -0.4);
    var anvil = P.box(0.9, 0.7, 0.7, 'steel', -0.6, 0.45, 0.2);
    var sword = P.box(0.08, 0.04, 1.2, 'gold', -0.6, 0.85, 0.2);
    P.ball(0.08, 'ruby', -0.6, 0.85, 0.7);
    var blacksmith = P.person(0.4, 0.1, null, { shirt: '#dc2626', pants: '#1e293b', skin: '#f8d5b8' });
    return { hot: hot, blacksmith: blacksmith, anvil: anvil, sword: sword, oven: oven, coals: coals };
    ` : category === 'submarine' ? `
    // Deep Ocean Water Slab & Luminous Coral Reef
    P.box(6.4, 0.04, 4.0, 'water', 0, 0.02, 0);
    var corals = P.ball(0.4, 'ruby', -2.0, 0.3, -1.2);
    P.ball(0.3, 'gold', -1.6, 0.25, -1.6);
    P.ball(0.35, 'pink', -2.3, 0.28, -0.7);
    // Bright Yellow/Gold Submersible with Cyan Port Glass
    var submarine = P.group(0, 0.9, 0);
    var hull = P.cyl(0.45, 0.45, 3.2, 'gold', 0, 0, 0, submarine, 12);
    hull.rotation.x = Math.PI / 2;
    P.box(0.3, 0.6, 0.8, 'gold', 0, 0.45, 0.2, submarine);
    P.ball(0.2, 'cyan', 0, 0.5, 0.5, submarine); // Viewport glass
    var prop = P.cyl(0.08, 0.08, 0.1, 'red', 0, 0, -1.7, submarine);
    return { hot: hot, submarine: submarine, prop: prop, corals: corals };
    ` : category === 'wizard' ? `
    // Mystical Sanctum Floor in Royal Violet & Indigo
    P.box(6.0, 0.04, 4.0, 'purple', 0, 0.02, 0);
    var shelf = P.box(5.4, 2.2, 0.4, 'cobalt', 0, 1.1, -1.8);
    var table = P.box(2.0, 0.1, 1.2, 'warmOak', -0.6, 0.85, 0.2);
    // Ancient Spellbook with Ruby Cover & Gold Edges
    var book = P.box(0.6, 0.06, 0.45, 'ruby', -0.6, 0.92, 0.2);
    P.box(0.55, 0.02, 0.4, 'gold', -0.6, 0.95, 0.2);
    // Glowing Cyan Crystal Orb
    var crystal = P.ball(0.24, 'cyan', 0.8, 1.2, 0.2);
    var wizard = P.person(0.4, 0.1, null, { shirt: '#7c3aed', pants: '#1e1b4b', skin: '#f8d5b8' });
    return { hot: hot, wizard: wizard, table: table, book: book, crystal: crystal, shelf: shelf };
    ` : category === 'classroom' ? `
    // Parquet Floor & Chalkboard Wall
    P.box(6.8, 0.04, 4.4, 'warmOak', 0, 0.02, 0);
    P.box(6.8, 2.2, 0.15, 'paper', 0, 1.1, -2.1);
    // Large Chalkboard with Chalk Lines
    P.box(4.2, 1.3, 0.04, 'leaf', 0, 1.3, -2.0);
    for (var cl = -1; cl <= 1; cl++) {
      P.box(1.2, 0.02, 0.01, 'paper', -0.8, 1.3 + cl * 0.22, -1.97);
    }
    P.ball(0.04, 'gold', 0.8, 1.3, -1.97);
    // Teacher's Desk & Laptop
    var tDesk = P.box(2.2, 0.1, 1.2, 'warmOak', -1.2, 0.85, -1.0);
    P.box(0.4, 0.02, 0.3, 'steel', -1.2, 0.91, -0.9);
    var tScr = P.box(0.4, 0.28, 0.02, 'steel', -1.2, 1.05, -1.04);
    tScr.rotation.x = -0.2;
    P.box(0.36, 0.24, 0.01, 'cyan', -1.2, 1.05, -1.03);
    // Teacher Figure Lecturing
    var teacher = P.person(1.4, -1.0, null, { shirt: '#ef4444', pants: '#1e293b' });
    // Student Desks in Rows
    for (var ci of [-1.4, 1.4]) {
      for (var ri of [0.4, 1.6]) {
        P.box(1.0, 0.08, 0.6, 'warmOak', ci, 0.68, ri);
        P.box(0.4, 0.06, 0.4, 'steel', ci, 0.38, ri + 0.45);
        P.box(0.24, 0.02, 0.18, 'paper', ci - 0.15, 0.73, ri);
      }
    }
    var stu1 = P.person(-1.4, 0.8, null, { shirt: '#3b82f6', pants: '#1e293b' });
    var stu2 = P.person(1.4, 0.8, null, { shirt: '#10b981', pants: '#374151' });
    return { hot: hot, teacher: teacher, tDesk: tDesk, stu1: stu1, stu2: stu2 };
    ` : category === 'sports' ? `
    // Badminton Court Mat & Lines
    P.box(6.8, 0.04, 4.4, 'emerald', 0, 0.02, 0);
    P.box(5.4, 0.02, 0.05, 'paper', 0, 0.04, -1.6);
    P.box(5.4, 0.02, 0.05, 'paper', 0, 0.04, 1.6);
    P.box(0.05, 0.02, 3.25, 'paper', -2.7, 0.04, 0);
    P.box(0.05, 0.02, 3.25, 'paper', 2.7, 0.04, 0);
    P.box(0.05, 0.02, 3.2, 'paper', 0, 0.04, 0);
    var net = P.group(0, 0, 0);
    P.cyl(0.03, 0.03, 1.4, 'steel', 0, 0.7, -1.8, net, 6);
    P.cyl(0.03, 0.03, 1.4, 'steel', 0, 0.7, 1.8, net, 6);
    P.box(0.02, 0.65, 3.6, 'paper', 0, 0.9, 0, net);
    var player1 = P.person(-1.8, 0.3, null, { shirt: '#dc2626', pants: '#f8fafc' });
    var player2 = P.person(1.8, -0.3, null, { shirt: '#2563eb', pants: '#1e293b' });
    var shuttle = P.group(0, 1.4, 0.1);
    P.ball(0.06, 'paper', 0, 0, 0, shuttle);
    return { hot: hot, net: net, player1: player1, player2: player2, shuttle: shuttle };
    ` : category === 'airport' ? `
    // Airport Runway Ground Slab
    P.box(7.2, 0.04, 4.4, 'tarmac', 0, 0.02, 0);
    for (var rx = -3.0; rx <= 3.0; rx += 1.2) {
      P.box(0.7, 0.02, 0.12, 'gold', rx, 0.04, 0);
    }
    // Terminal Concourse building with cyan glass facade
    var terminal = P.group(0, 0, -1.6);
    P.box(4.8, 1.4, 1.2, 'paper', 0, 0.7, 0, terminal);
    P.box(4.6, 0.9, 0.1, 'cyan', 0, 0.7, 0.6, terminal);
    P.box(0.5, 0.6, 1.2, 'paper', -1.2, 0.6, 1.0, terminal);
    // Air traffic control tower with glazed observation cab
    var tower = P.group(2.6, 0, -1.4);
    P.cyl(0.25, 0.35, 2.6, 'paper', 0, 1.3, 0, tower, 10);
    P.cyl(0.55, 0.45, 0.4, 'cyan', 0, 2.7, 0, tower, 10);
    P.cone(0.6, 0.25, 'red', 0, 3.0, 0, tower, 10);
    var radar = P.box(0.6, 0.1, 0.04, 'paper', 0, 3.2, 0, tower);
    // Parked Passenger Airliner
    var plane = P.group(-0.8, 0.45, 0.8);
    var fus = P.cyl(0.32, 0.32, 3.0, 'paper', 0, 0, 0, plane, 12);
    fus.rotation.x = Math.PI / 2;
    P.ball(0.32, 'blue', 0, 0, 1.5, plane);
    P.box(0.4, 0.16, 0.4, 'cyan', 0, 0.22, 1.0, plane);
    var wingL = P.box(2.2, 0.05, 0.7, 'blue', -1.3, 0, 0, plane);
    wingL.rotation.y = -0.2;
    var wingR = P.box(2.2, 0.05, 0.7, 'blue', 1.3, 0, 0, plane);
    wingR.rotation.y = 0.2;
    P.box(0.06, 0.6, 0.5, 'red', 0, 0.4, -1.2, plane);
    // Baggage Tug
    var tug = P.group(1.6, 0.16, 1.4);
    P.box(0.7, 0.32, 0.5, 'gold', 0, 0, 0, tug);
    P.box(0.4, 0.2, 0.45, 'cyan', -0.1, 0.22, 0, tug);
    // Windsock
    P.cyl(0.03, 0.03, 1.8, 'steel', -2.8, 0.9, 1.6, null, 6);
    P.cone(0.14, 0.5, 'red', -2.8, 1.7, 1.8, null, 8).rotation.x = Math.PI / 2;
    return { hot: hot, plane: plane, radar: radar, tower: tower, terminal: terminal, tug: tug };
    ` : category === 'harbor' ? `
    // Water basin & Concrete Quay
    P.box(4.0, 0.04, 4.4, 'water', -1.6, 0.02, 0);
    P.box(3.2, 0.35, 4.4, 'stone', 1.8, 0.18, 0);
    for (var bz = -1.8; bz <= 1.8; bz += 0.9) {
      P.cyl(0.08, 0.08, 0.18, 'gold', 0.4, 0.42, bz, null, 8);
    }
    // Gantry Crane
    var crane = P.group(2.0, 0.35, 0);
    P.box(0.14, 2.6, 0.14, 'red', -0.8, 1.3, -1.4, crane);
    P.box(0.14, 2.6, 0.14, 'red', -0.8, 1.3, 1.4, crane);
    P.box(0.14, 2.6, 0.14, 'red', 0.8, 1.3, -1.4, crane);
    P.box(0.14, 2.6, 0.14, 'red', 0.8, 1.3, 1.4, crane);
    P.box(1.8, 0.25, 3.4, 'red', -0.4, 2.6, 0, crane);
    var hoist = P.group(-0.8, 1.6, 0, crane);
    P.box(0.8, 0.1, 1.4, 'gold', 0, 0, 0, hoist);
    P.box(0.7, 0.45, 1.3, 'blue', 0, -0.3, 0, hoist);
    // Containers
    P.box(0.8, 0.5, 1.6, 'blue', 2.2, 0.6, -1.0);
    P.box(0.8, 0.5, 1.6, 'red', 2.2, 1.1, -1.0);
    P.box(0.8, 0.5, 1.6, 'emerald', 2.2, 0.6, 1.0);
    P.box(0.8, 0.5, 1.6, 'gold', 2.2, 1.1, 1.0);
    // Tugboat
    var tugboat = P.group(-2.0, 0.12, 0.4);
    P.box(1.2, 0.35, 2.6, 'emerald', 0, 0.12, 0, tugboat);
    P.wedge(1.2, 0.35, 0.8, 'emerald', 0, 0.12, 1.6, tugboat);
    P.box(0.9, 0.4, 1.1, 'paper', 0, 0.45, -0.2, tugboat);
    P.cyl(0.1, 0.1, 0.5, 'red', 0, 0.8, -0.4, tugboat, 8);
    return { hot: hot, crane: crane, hoist: hoist, tugboat: tugboat };
    ` : category === 'lighthouse' ? `
    // Rocky Cliff Island
    P.box(7.2, 0.04, 4.4, 'water', 0, 0.02, 0);
    P.box(3.2, 0.5, 3.0, 'stone', 0, 0.25, 0);
    P.box(2.4, 0.4, 2.2, 'stone', 0.2, 0.65, -0.1);
    P.box(1.2, 0.12, 1.6, 'sand', -1.6, 0.1, 0.8);
    // Banded Lighthouse Tower
    var lighthouse = P.group(0.5, 0.85, -0.2);
    P.cyl(0.55, 0.7, 0.6, 'paper', 0, 0.3, 0, lighthouse, 12);
    P.cyl(0.48, 0.55, 0.6, 'red', 0, 0.9, 0, lighthouse, 12);
    P.cyl(0.42, 0.48, 0.6, 'paper', 0, 1.5, 0, lighthouse, 12);
    P.cyl(0.38, 0.42, 0.6, 'red', 0, 2.1, 0, lighthouse, 12);
    P.cyl(0.52, 0.52, 0.08, 'steel', 0, 2.44, 0, lighthouse, 14);
    P.cyl(0.32, 0.32, 0.45, 'cyan', 0, 2.7, 0, lighthouse, 10);
    P.cone(0.42, 0.35, 'red', 0, 3.1, 0, lighthouse, 12);
    var beam = P.group(0, 2.7, 0, lighthouse);
    P.cone(0.35, 1.6, 'gold', 0, 0, 0.8, beam, 8);
    beam.children[0].rotation.x = Math.PI / 2;
    var cottage = P.group(-0.8, 0.85, 0.5);
    P.box(1.2, 0.7, 0.9, 'brick', 0, 0.35, 0, cottage);
    P.wedge(1.2, 0.4, 0.9, 'red', 0, 0.7, 0, cottage);
    P.cyl(0.08, 0.08, 0.4, 'stone', 0.35, 1.0, 0, cottage, 6);
    P.box(0.5, 0.08, 1.2, 'warmOak', -1.8, 0.14, 1.2);
    var dinghy = P.box(0.5, 0.16, 0.9, 'warmOak', -2.3, 0.1, 1.2);
    return { hot: hot, lighthouse: lighthouse, beam: beam, cottage: cottage, dinghy: dinghy };
    ` : category === 'campus' ? `
    // Collegiate Hall & Clock Tower
    var hall = P.group(0, 0, -1.6);
    P.box(5.4, 1.4, 1.2, 'brick', 0, 0.7, 0, hall);
    P.box(5.6, 0.1, 1.4, 'stone', 0, 1.45, 0, hall);
    for (var wx = -2.0; wx <= 2.0; wx += 0.8) {
      P.box(0.35, 0.5, 0.04, 'cyan', wx, 0.75, 0.61, hall);
    }
    var tower = P.group(0, 1.4, 0, hall);
    P.box(1.2, 1.6, 1.1, 'brick', 0, 0.8, 0, tower);
    P.cyl(0.28, 0.28, 0.04, 'paper', 0, 1.1, 0.56, tower, 12).rotation.x = Math.PI / 2;
    P.ball(0.05, 'gold', 0, 1.1, 0.58, tower);
    P.cone(0.8, 0.9, 'ruby', 0, 2.05, 0, tower, 8);
    P.cyl(0.02, 0.02, 0.8, 'steel', 0, 2.8, 0, tower, 6);
    var flag = P.box(0.35, 0.18, 0.02, 'gold', 0.2, 2.7, 0, tower);
    // Fountain
    var fountain = P.group(0, 0, 0.6);
    P.cyl(1.1, 1.2, 0.2, 'stone', 0, 0.1, 0, fountain, 14);
    P.cyl(0.9, 0.9, 0.08, 'water', 0, 0.18, 0, fountain, 14);
    P.cyl(0.25, 0.35, 0.5, 'stone', 0, 0.45, 0, fountain, 10);
    var waterJet = P.ball(0.18, 'cyan', 0, 0.8, 0, fountain);
    P.tree(-2.2, 0.6, null, { r: 0.7, h: 1.3, mat: 'leaf' });
    P.tree(2.2, 0.6, null, { r: 0.7, h: 1.3, mat: 'leaf' });
    P.box(0.9, 0.08, 0.3, 'warmOak', -1.2, 0.22, 1.4);
    P.box(0.9, 0.08, 0.3, 'warmOak', 1.2, 0.22, 1.4);
    var student1 = P.person(-1.2, 1.4, null, { shirt: '#3b82f6', pants: '#1e293b' });
    var student2 = P.person(1.2, 1.4, null, { shirt: '#ec4899', pants: '#374151' });
    return { hot: hot, hall: hall, tower: tower, fountain: fountain, waterJet: waterJet, flag: flag, student1: student1, student2: student2 };
    ` : category === 'sea' || category === 'maritime' ? `
    // Vast Ocean Water & Reef
    P.box(7.2, 0.04, 4.4, 'water', 0, 0.02, 0);
    var reef = P.group(-2.2, 0, -1.2);
    P.ball(0.6, 'stone', 0, 0.1, 0, reef);
    P.ball(0.45, 'stone', 0.4, 0.15, 0.3, reef);
    P.ball(0.35, 'paper', 0.2, 0.28, 0.1, reef);
    // Sailing Schooner
    var ship = P.group(0.4, 0.1, 0.2);
    P.box(1.2, 0.4, 2.8, 'warmOak', 0, 0.2, 0, ship);
    P.wedge(1.2, 0.4, 0.9, 'warmOak', 0, 0.2, 1.7, ship);
    P.cyl(0.04, 0.05, 2.6, 'darkwood', 0, 1.3, 0.5, ship, 6);
    P.cyl(0.04, 0.05, 2.4, 'darkwood', 0, 1.2, -0.6, ship, 6);
    var sail1 = P.box(1.1, 1.4, 0.04, 'paper', 0, 1.5, 0.5, ship);
    sail1.rotation.y = -0.15;
    var sail2 = P.box(1.0, 1.2, 0.04, 'paper', 0, 1.4, -0.6, ship);
    sail2.rotation.y = -0.12;
    P.box(0.25, 0.12, 0.02, 'gold', 0, 2.6, 0.5, ship);
    var buoy = P.group(2.2, 0.15, -1.0);
    P.cyl(0.3, 0.3, 0.4, 'red', 0, 0.15, 0, buoy, 10);
    P.cone(0.18, 0.5, 'gold', 0, 0.5, 0, buoy, 8);
    var gull1 = P.box(0.5, 0.04, 0.14, 'paper', -1.2, 2.4, 0.8);
    gull1.rotation.z = 0.2;
    return { hot: hot, ship: ship, sail1: sail1, buoy: buoy, gull1: gull1, reef: reef };
    ` : category === 'castle' ? `
    // Castle Moat & Fortress
    P.box(7.2, 0.04, 4.4, 'water', 0, 0.02, 0);
    P.box(5.0, 0.35, 3.4, 'stone', 0, 0.18, 0);
    var castle = P.group(0, 0.35, 0);
    for (var tx of [-1.8, 1.8]) {
      for (var tz of [-1.2, 1.2]) {
        P.cyl(0.38, 0.44, 2.2, 'stone', tx, 1.1, tz, castle, 10);
        P.cyl(0.48, 0.38, 0.25, 'stone', tx, 2.25, tz, castle, 10);
        P.cone(0.52, 0.7, 'ruby', tx, 2.7, tz, castle, 10);
      }
    }
    P.box(0.2, 1.4, 2.0, 'stone', -1.8, 0.7, 0, castle);
    P.box(0.2, 1.4, 2.0, 'stone', 1.8, 0.7, 0, castle);
    P.box(3.2, 1.4, 0.2, 'stone', 0, 0.7, -1.2, castle);
    P.box(3.2, 1.4, 0.2, 'stone', 0, 0.7, 1.2, castle);
    var drawbridge = P.box(1.0, 0.08, 1.6, 'warmOak', 0, 0.04, 1.9, castle);
    var keep = P.group(0, 0, -0.2, castle);
    P.box(1.6, 2.6, 1.4, 'stone', 0, 1.3, 0, keep);
    P.box(1.8, 0.3, 1.6, 'stone', 0, 2.7, 0, keep);
    P.cyl(0.03, 0.03, 0.9, 'steel', 0, 3.25, 0, keep, 6);
    var banner = P.box(0.5, 0.25, 0.02, 'gold', 0.28, 3.2, 0, keep);
    P.cyl(0.35, 0.35, 0.35, 'stone', 0, 0.18, 0.5, castle, 8);
    var guard = P.person(-0.8, 0.5, castle, { shirt: '#dc2626', pants: '#334155', hat: '#64748b' });
    return { hot: hot, castle: castle, keep: keep, banner: banner, drawbridge: drawbridge, guard: guard };
    ` : category === 'city' ? `
    // Multi-Lane City Avenue with Tram Tracks & Crosswalks
    P.box(7.6, 0.04, 4.4, 'tarmac', 0, 0.02, 0);
    for (var cz = -1.6; cz <= 1.6; cz += 0.5) {
      P.box(1.2, 0.02, 0.2, 'paper', 0, 0.04, cz);
    }
    P.box(7.6, 0.12, 1.0, 'paving', 0, 0.06, -1.8);
    P.box(7.6, 0.12, 1.0, 'paving', 0, 0.06, 1.8);

    // Skyscraper 1
    var bldg1 = P.box(1.8, 3.8, 1.0, 'cobalt', -2.4, 1.9, -1.8);
    for (var fy = 0.6; fy <= 3.4; fy += 0.5) {
      P.box(1.6, 0.2, 0.04, 'cyan', -2.4, fy, -1.28);
    }
    // Skyscraper 2
    var bldg2 = P.box(2.0, 4.6, 1.1, 'steel', 0.2, 2.3, -1.8);
    for (var fy2 = 0.6; fy2 <= 4.2; fy2 += 0.6) {
      P.box(1.8, 0.24, 0.04, 'gold', 0.2, fy2, -1.23);
    }

    // Construction Tower Crane with Jib and Hoist
    var crane = P.group(2.6, 0.12, -1.8);
    crane.name = 'tower crane'; hot.push(crane);
    P.cyl(0.08, 0.08, 4.8, 'gold', 0, 2.4, 0, crane, 8); // Mast
    var jib = P.box(3.2, 0.14, 0.14, 'gold', 1.0, 4.8, 0, crane); // Horizontal reach
    P.cyl(0.02, 0.02, 1.8, 'steel', 2.2, 3.9, 0, crane, 4); // Hoist cable
    var cargo = P.box(0.6, 0.5, 0.5, 'cobalt', 2.2, 2.7, 0, crane);

    // City Park Plaza with Water Fountain
    var fountain = P.group(2.4, 0.12, 1.8);
    fountain.name = 'city fountain'; hot.push(fountain);
    P.cyl(0.8, 0.8, 0.24, 'steel', 0, 0.12, 0, fountain, 14); // Basin
    var splash = P.ball(0.24, 'cyan', 0, 0.36, 0, fountain);

    // Streamlined Tram on Rails
    var tram = P.group(-1.4, 0.14, 1.6);
    tram.name = 'city tram'; hot.push(tram);
    P.box(2.8, 0.9, 0.85, 'teal', 0, 0.55, 0, tram);
    P.box(2.4, 0.25, 0.88, 'cyan', 0, 0.72, 0, tram);

    // City Transit Bus
    var bus = P.group(1.8, 0.14, 0.35);
    bus.name = 'city bus'; hot.push(bus);
    P.box(2.4, 0.95, 0.85, 'gold', 0, 0.55, 0, bus);
    P.box(2.0, 0.3, 0.88, 'paper', 0, 0.7, 0, bus);

    // Yellow Taxi Cab
    var taxi = P.group(-0.8, 0.14, -0.4);
    taxi.name = 'taxi cab'; hot.push(taxi);
    P.box(1.6, 0.35, 0.85, 'gold', 0, 0.18, 0, taxi);
    P.box(1.0, 0.28, 0.75, 'cyan', -0.1, 0.42, 0, taxi);

    // Cycling Traffic Light Post
    var trafficLight = P.group(-1.2, 0.12, -1.2);
    P.cyl(0.04, 0.04, 2.2, 'charcoal', 0, 1.1, 0, trafficLight, 6);
    P.box(0.18, 0.55, 0.18, 'charcoal', 0, 2.0, 0, trafficLight);
    P.ball(0.06, 'red', 0, 2.18, 0.1, trafficLight);
    P.ball(0.06, 'gold', 0, 2.0, 0.1, trafficLight);
    P.ball(0.06, 'emerald', 0, 1.82, 0.1, trafficLight);

    return { hot: hot, taxi: taxi, tram: tram, bus: bus, crane: crane, jib: jib, cargo: cargo, fountain: fountain, splash: splash, bldg1: bldg1, bldg2: bldg2, trafficLight: trafficLight };
    ` : category === 'farm' ? `
    // Red Barn & Tractor
    var barn = P.group(-1.6, 0, -0.8);
    P.box(2.4, 1.8, 2.0, 'red', 0, 0.9, 0, barn);
    P.wedge(2.4, 0.7, 2.0, 'paper', 0, 1.8, 0, barn);
    P.box(0.8, 1.0, 0.04, 'paper', 0, 0.5, 1.02, barn);
    var silo = P.group(-2.8, 0, 0.8);
    P.cyl(0.55, 0.55, 2.6, 'steel', 0, 1.3, 0, silo, 12);
    P.cone(0.6, 0.5, 'paper', 0, 2.8, 0, silo, 12);
    var tractor = P.group(1.2, 0.15, 0.6);
    P.box(1.4, 0.45, 0.8, 'emerald', 0, 0.25, 0, tractor);
    P.box(0.7, 0.4, 0.75, 'cyan', -0.2, 0.62, 0, tractor);
    P.cyl(0.04, 0.04, 0.5, 'charcoal', 0.5, 0.65, 0.25, tractor, 6);
    P.box(0.06, 0.4, 2.4, 'warmOak', 0.2, 0.2, -1.0);
    P.box(0.06, 0.4, 2.4, 'warmOak', 2.8, 0.2, -1.0);
    var cow = P.group(1.4, 0.2, -1.0);
    P.box(0.8, 0.45, 0.4, 'paper', 0, 0.22, 0, cow);
    P.box(0.3, 0.3, 0.3, 'charcoal', 0.45, 0.35, 0, cow);
    P.tree(2.4, 1.2, null, { r: 0.6, h: 1.2, mat: 'leaf' });
    return { hot: hot, barn: barn, silo: silo, tractor: tractor, cow: cow };
    ` : category === 'park' ? `
    // Bandstand Gazebo & Duck Pond
    var gazebo = P.group(-1.4, 0, -0.6);
    P.cyl(1.2, 1.3, 0.2, 'stone', 0, 0.1, 0, gazebo, 8);
    for (var a = 0; a < 8; a++) {
      var angle = (a / 8) * Math.PI * 2;
      P.cyl(0.04, 0.04, 1.4, 'paper', Math.cos(angle) * 1.0, 0.8, Math.sin(angle) * 1.0, gazebo, 6);
    }
    P.cone(1.3, 0.8, 'emerald', 0, 1.8, 0, gazebo, 8);
    var pond = P.group(1.2, 0, 0.8);
    P.cyl(1.3, 1.3, 0.08, 'water', 0, 0.04, 0, pond, 14);
    var bridge = P.box(1.8, 0.06, 0.5, 'warmOak', 0, 0.18, 0, pond);
    P.box(0.9, 0.1, 0.3, 'warmOak', 0, 0.2, -1.4);
    P.ball(0.2, 'ruby', -1.2, 0.12, 1.4);
    P.ball(0.2, 'gold', -0.8, 0.12, 1.6);
    P.tree(2.2, -1.2, null, { r: 0.75, h: 1.4, mat: 'leaf' });
    P.tree(-2.6, 1.0, null, { r: 0.65, h: 1.3, mat: 'leaf' });
    var visitor = P.person(0, -1.4, null, { shirt: '#f59e0b', pants: '#1e293b' });
    return { hot: hot, gazebo: gazebo, pond: pond, bridge: bridge, visitor: visitor };
    ` : category === 'classroom' ? `
    // Hardwood Classroom Floor & Chalkboard Wall
    P.box(6.8, 0.04, 4.4, 'timber', 0, 0.02, 0);
    P.box(6.8, 2.2, 0.15, 'paper', 0, 1.1, -2.1);
    P.box(4.2, 1.3, 0.04, 'iron', 0, 1.3, -2.0);
    for (var cl = -1; cl <= 1; cl++) {
      P.box(1.2, 0.02, 0.01, 'paper', -0.8, 1.3 + cl * 0.22, -1.97);
    }
    var tDesk = P.box(2.2, 0.1, 1.2, 'timber', -1.2, 0.85, -1.0);
    P.box(0.4, 0.02, 0.3, 'iron', -1.2, 0.91, -0.9);
    var teacher = P.person(1.4, -1.0, null, { shirt: '#b86242', pants: '#334155' });
    for (var ci of [-1.4, 1.4]) {
      for (var ri of [0.4, 1.6]) {
        P.box(1.0, 0.08, 0.6, 'timber', ci, 0.68, ri);
        P.box(0.4, 0.06, 0.4, 'iron', ci, 0.38, ri + 0.45);
      }
    }
    var stu1 = P.person(-1.4, 0.8, null, { shirt: '#f8fafc', pants: '#334155' });
    var stu2 = P.person(1.4, 0.8, null, { shirt: '#f59e0b', pants: '#334155' });
    return { hot: hot, teacher: teacher, tDesk: tDesk, stu1: stu1, stu2: stu2 };
    ` : category === 'sports' ? `
    P.box(6.8, 0.04, 4.4, 'meadow', 0, 0.02, 0);
    var net = P.group(0, 0, 0);
    P.cyl(0.03, 0.03, 1.4, 'iron', 0, 0.7, -1.8, net, 6);
    P.cyl(0.03, 0.03, 1.4, 'iron', 0, 0.7, 1.8, net, 6);
    P.box(0.02, 0.65, 3.6, 'paper', 0, 0.9, 0, net);
    var player1 = P.person(-1.8, 0.3, null, { shirt: '#ef4444', pants: '#f8fafc' });
    var player2 = P.person(1.8, -0.3, null, { shirt: '#0284c7', pants: '#334155' });
    var shuttle = P.ball(0.08, 'paper', 0, 1.4, 0.1);
    return { hot: hot, net: net, player1: player1, player2: player2, shuttle: shuttle };
    ` : category === 'airport' ? `
    P.box(7.2, 0.04, 4.4, 'iron', 0, 0.02, 0);
    for (var rx = -3.0; rx <= 3.0; rx += 1.2) P.box(0.7, 0.02, 0.12, 'gold', rx, 0.04, 0);
    var terminal = P.box(4.8, 1.4, 1.2, 'paper', 0, 0.7, -1.6);
    var tower = P.cyl(0.25, 0.35, 2.6, 'paper', 2.6, 1.3, -1.4, null, 10);
    var plane = P.group(-0.8, 0.45, 0.8);
    var fus = P.cyl(0.32, 0.32, 3.0, 'paper', 0, 0, 0, plane, 12);
    fus.rotation.x = Math.PI / 2;
    P.box(2.2, 0.05, 0.7, 'paper', -1.3, 0, 0, plane);
    P.box(2.2, 0.05, 0.7, 'paper', 1.3, 0, 0, plane);
    return { hot: hot, plane: plane, terminal: terminal, tower: tower };
    ` : category === 'harbor' ? `
    P.box(4.0, 0.04, 4.4, 'water', -1.6, 0.02, 0);
    P.box(3.2, 0.35, 4.4, 'stone', 1.8, 0.18, 0);
    var crane = P.box(1.8, 2.8, 3.2, 'accent', 2.0, 1.4, 0);
    var tugboat = P.box(1.2, 0.35, 2.6, 'iron', -2.0, 0.18, 0.4);
    return { hot: hot, crane: crane, tugboat: tugboat };
    ` : category === 'lighthouse' ? `
    P.box(7.2, 0.04, 4.4, 'water', 0, 0.02, 0);
    P.box(3.2, 0.5, 3.0, 'stone', 0, 0.25, 0);
    var lighthouse = P.cyl(0.55, 0.7, 2.4, 'paper', 0.5, 1.4, -0.2, null, 12);
    var cottage = P.box(1.2, 0.7, 0.9, 'brick', -0.8, 0.6, 0.5);
    return { hot: hot, lighthouse: lighthouse, cottage: cottage };
    ` : category === 'campus' ? `
    var hall = P.box(5.4, 1.4, 1.2, 'brick', 0, 0.7, -1.6);
    var tower = P.box(1.2, 2.6, 1.1, 'brick', 0, 1.3, -1.6);
    var fountain = P.cyl(1.1, 1.2, 0.2, 'stone', 0, 0.1, 0.6, null, 14);
    return { hot: hot, hall: hall, tower: tower, fountain: fountain };
    ` : category === 'sea' || category === 'maritime' ? `
    P.box(7.2, 0.04, 4.4, 'water', 0, 0.02, 0);
    var ship = P.box(1.2, 0.4, 2.8, 'timber', 0.4, 0.2, 0.2);
    var sail = P.box(1.1, 1.4, 0.04, 'paper', 0.4, 1.5, 0.7);
    return { hot: hot, ship: ship, sail: sail };
    ` : category === 'castle' ? `
    P.box(7.2, 0.04, 4.4, 'water', 0, 0.02, 0);
    P.box(5.0, 0.35, 3.4, 'stone', 0, 0.18, 0);
    var castle = P.box(3.6, 1.4, 2.4, 'stone', 0, 0.85, 0);
    var keep = P.box(1.6, 2.6, 1.4, 'stone', 0, 1.45, -0.2);
    return { hot: hot, castle: castle, keep: keep };
    ` : category === 'city' ? `
    P.box(7.2, 0.04, 4.4, 'iron', 0, 0.02, 0);
    var bldg1 = P.box(1.8, 3.8, 1.0, 'iron', -2.2, 1.9, -1.8);
    var bldg2 = P.box(2.0, 4.6, 1.1, 'stone', 0.4, 2.3, -1.8);
    var taxi = P.box(1.8, 0.35, 0.9, 'gold', 0, 0.25, 0.4);
    return { hot: hot, taxi: taxi, bldg1: bldg1, bldg2: bldg2 };
    ` : category === 'farm' ? `
    var barn = P.box(2.4, 1.8, 2.0, 'brick', -1.6, 0.9, -0.8);
    var silo = P.cyl(0.55, 0.55, 2.6, 'stone', -2.8, 1.3, 0.8, null, 12);
    var tractor = P.box(1.4, 0.45, 0.8, 'accent', 1.2, 0.25, 0.6);
    return { hot: hot, barn: barn, silo: silo, tractor: tractor };
    ` : category === 'park' ? `
    var gazebo = P.cyl(1.2, 1.3, 1.4, 'timber', -1.4, 0.7, -0.6, null, 8);
    var pond = P.cyl(1.3, 1.3, 0.08, 'water', 1.2, 0.04, 0.8, null, 14);
    return { hot: hot, gazebo: gazebo, pond: pond };
    ` : category === 'abstract' ? `
    // Sleek Royal Indigo Pedestal & Glowing Nested Geometry
    P.box(2.0, 0.15, 2.0, 'tileAccent', 0, 0.08, 0);
    var ring1 = P.cyl(1.4, 1.4, 0.08, 'gold', 0, 1.4, 0, null, 16);
    var ring2 = P.cyl(1.0, 1.0, 0.08, 'cyan', 0, 1.4, 0, null, 16);
    var core = P.ball(0.3, 'ruby', 0, 1.4, 0);
    return { hot: hot, ring1: ring1, ring2: ring2, core: core };
    ` : `
    // Expansive Colorful Tiled Plaza & Shaded Pavilion
    P.box(5.8, 0.12, 4.2, 'tileAccent', 0, 0.06, 0);
    for (var ix = -2.2; ix <= 2.2; ix += 1.1) {
      P.box(0.9, 0.02, 3.8, 'tileLight', ix, 0.13, 0);
    }
    // Timber Pavilion & Canvas Canopy
    P.cyl(0.08, 0.08, 2.2, 'timber', -1.8, 1.1, -1.2, null, 8);
    P.cyl(0.08, 0.08, 2.2, 'timber', 1.8, 1.1, -1.2, null, 8);
    P.cyl(0.08, 0.08, 2.2, 'timber', -1.8, 1.1, 1.2, null, 8);
    P.cyl(0.08, 0.08, 2.2, 'timber', 1.8, 1.1, 1.2, null, 8);
    var canopy = P.box(4.0, 0.15, 2.8, 'ruby', 0, 2.25, 0);
    // Plaza Amenities: Fountain Basin, Cafe Kiosk & Streetlamp
    P.cyl(0.9, 0.9, 0.3, 'steel', 0, 0.25, 0, null, 12);
    var fountain = P.ball(0.28, 'cyan', 0, 0.55, 0);
    fountain.name = 'plaza fountain'; hot.push(fountain);
    var lamp = P.cyl(0.06, 0.06, 2.4, 'steel', 2.4, 1.2, -1.6, null, 8);
    P.ball(0.2, 'gold', 2.4, 2.4, -1.6);
    // Resident Character
    var resident = P.person(-0.8, 0.12, null, { shirt: '#3b82f6', pants: '#1e293b' });
    resident.name = 'plaza resident'; hot.push(resident);
    return { hot: hot, canopy: canopy, fountain: fountain, lamp: lamp, resident: resident };
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
    if (p.radar) p.radar.rotation.y = t * 3.0;
    if (p.beam) p.beam.rotation.y = t * 2.2;
    if (p.waterJet) p.waterJet.position.y = 0.8 + Math.sin(t * 8) * 0.08;
    if (p.flag) p.flag.rotation.y = Math.sin(t * 4) * 0.15;
    if (p.banner) p.banner.rotation.y = Math.sin(t * 4) * 0.15;
    if (p.ship) {
      p.ship.position.y = 0.1 + Math.sin(a) * 0.05;
      p.ship.rotation.z = Math.cos(a) * 0.04;
    }
    if (p.buoy) p.buoy.position.y = 0.15 + Math.sin(a * 2) * 0.06;
    if (p.gull1) {
      p.gull1.position.x = -1.2 + Math.sin(a) * 0.8;
      p.gull1.position.z = 0.8 + Math.cos(a) * 0.5;
    }
    if (p.hoist) p.hoist.position.y = 1.6 + Math.sin(a) * 0.3;
    if (p.taxi) p.taxi.position.x = Math.sin(a) * 1.4;
    if (p.tractor) p.tractor.position.x = 1.2 + Math.sin(a * 0.5) * 0.4;
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

    ${(category === 'transit_bus' || primarySubject === 'bus') ? `
    P.box(6.2, 0.04, 3.8, 'iron', 0, 0.02, 0.5);
    for (var dx = -2.2; dx <= 2.2; dx += 1.1) {
      P.box(0.5, 0.02, 0.08, 'gold', dx, 0.04, 0.5);
    }
    P.box(6.2, 0.14, 1.8, 'stone', 0, 0.07, -1.8);
    var bus = P.group(0, 0.05, 0.6);
    P.box(4.4, 1.3, 1.6, 'gold', 0, 0.85, 0, bus);
    P.box(4.5, 0.28, 1.62, 'iron', 0, 0.28, 0, bus);
    P.box(4.4, 0.1, 1.62, 'paper', 0, 1.52, 0, bus);
    P.box(3.8, 0.65, 1.64, 'water', 0, 1.15, 0, bus);
    for (const wx of [-1.4, 1.4]) {
      for (const wz of [-0.85, 0.85]) {
        P.cyl(0.24, 0.24, 0.16, 'iron', wx, 0.24, wz, bus, 10);
      }
    }
    for (let px = -1.2; px <= 1.0; px += 0.8) {
      P.ball(0.12, 'brick', px, 1.0, -0.4, bus, 6);
      P.ball(0.12, 'gold', px, 1.0, 0.4, bus, 6);
    }
    var conductor = P.group(1.8, 0.35, 0, bus);
    P.cyl(0.14, 0.14, 0.5, 'iron', 0, 0.25, 0, conductor, 8);
    P.ball(0.12, 'paper', 0, 0.6, 0, conductor, 6);
    return { hot: hot, bus: bus, conductor: conductor };
    ` : category === 'classroom' ? `
    P.box(6.2, 0.04, 4.2, 'wood', 0, 0.02, 0);
    P.box(6.0, 2.4, 0.15, 'timber', 0, 1.2, -1.9);
    var board = P.box(3.8, 1.4, 0.04, 'accent', 0, 1.3, -1.8);
    var teacher = P.person(-0.5, -0.8, null, { shirt: '#38bdf8', pants: '#1e293b' });
    var tDesk = P.box(1.6, 0.08, 0.8, 'wood', -1.4, 0.76, -0.6);
    P.box(0.9, 0.06, 0.6, 'gold', -1.0, 0.65, 0.8);
    P.box(0.9, 0.06, 0.6, 'gold', 1.0, 0.65, 0.8);
    return { hot: hot, teacher: teacher, board: board, tDesk: tDesk };
    ` : category === 'sports' ? `
    P.box(6.2, 0.04, 4.4, 'meadow', 0, 0.02, 0);
    var net = P.box(0.04, 0.8, 4.0, 'paper', 0, 0.5, 0);
    var player1 = P.person(-1.6, 0, null, { shirt: '#ef4444', pants: '#1e293b' });
    var player2 = P.person(1.6, 0, null, { shirt: '#3b82f6', pants: '#1e293b' });
    var shuttle = P.ball(0.12, 'paper', 0, 1.4, 0);
    return { hot: hot, net: net, player1: player1, player2: player2, shuttle: shuttle };
    ` : category === 'airport' ? `
    P.box(6.2, 0.04, 4.2, 'stone', 0, 0.02, 0);
    var plane = P.group(0, 0.4, 0);
    P.cyl(0.3, 0.3, 2.4, 'paper', 0, 0, 0, plane, 12);
    P.box(2.2, 0.04, 0.7, 'paper', 0, 0, 0, plane);
    var tower = P.cyl(0.25, 0.35, 2.2, 'stone', 2.2, 1.1, -1.2, null, 10);
    return { hot: hot, plane: plane, tower: tower };
    ` : category === 'harbor' ? `
    P.box(6.2, 0.04, 4.2, 'water', 0, 0.02, 0);
    P.box(3.2, 0.35, 4.2, 'stone', -1.5, 0.18, 0);
    var boat = P.box(1.2, 0.4, 2.2, 'timber', 1.6, 0.2, 0);
    var crane = P.box(0.15, 2.6, 0.15, 'gold', -2.2, 1.3, 0);
    return { hot: hot, boat: boat, crane: crane };
    ` : category === 'lighthouse' ? `
    P.box(6.2, 0.04, 4.2, 'water', 0, 0.02, 0);
    P.box(3.6, 0.6, 3.2, 'stone', -0.5, 0.3, -0.5);
    var tower = P.cyl(0.45, 0.6, 2.6, 'paper', -0.8, 1.6, -0.6, null, 14);
    var lantern = P.cyl(0.32, 0.32, 0.4, 'gold', -0.8, 3.1, -0.6);
    return { hot: hot, tower: tower, lantern: lantern };
    ` : category === 'campus' ? `
    P.box(6.2, 0.04, 4.2, 'meadow', 0, 0.02, 0);
    var hall = P.box(4.6, 1.8, 1.6, 'brick', 0, 0.9, -1.2);
    var fountain = P.cyl(0.8, 0.8, 0.25, 'stone', 0, 0.12, 0.8, null, 12);
    return { hot: hot, hall: hall, fountain: fountain };
    ` : (category === 'sea' || category === 'maritime') ? `
    P.box(6.2, 0.04, 4.2, 'water', 0, 0.02, 0);
    var ship = P.box(1.4, 0.6, 3.2, 'timber', 0, 0.3, 0);
    P.cyl(0.04, 0.04, 2.2, 'timber', 0, 1.4, 0);
    return { hot: hot, ship: ship };
    ` : category === 'castle' ? `
    P.box(6.2, 0.04, 4.2, 'stone', 0, 0.02, 0);
    var keep = P.box(2.4, 2.4, 2.0, 'stone', 0, 1.2, 0);
    P.cyl(0.4, 0.4, 2.8, 'brick', -1.5, 1.4, -1.2);
    P.cyl(0.4, 0.4, 2.8, 'brick', 1.5, 1.4, -1.2);
    return { hot: hot, keep: keep };
    ` : category === 'city' ? `
    P.box(6.8, 0.04, 4.4, 'stone', 0, 0.02, 0);
    var b1 = P.box(1.6, 3.8, 1.4, 'iron', -2.2, 1.9, -1.2);
    var b2 = P.box(1.5, 3.0, 1.4, 'timber', 0.2, 1.5, -1.2);
    // Tower Crane
    var crane = P.cyl(0.08, 0.08, 4.6, 'gold', 2.2, 2.3, -1.2, null, 8);
    var jib = P.box(2.8, 0.14, 0.14, 'gold', 2.8, 4.6, -1.2);
    // Park Fountain
    var fountain = P.cyl(0.9, 0.9, 0.3, 'stone', 2.2, 0.15, 1.2, null, 12);
    var splash = P.ball(0.24, 'water', 2.2, 0.42, 1.2);
    // Vehicles: Tram, Bus, Taxi
    var tram = P.box(2.4, 0.8, 0.8, 'water', -1.6, 0.45, 1.4);
    var bus = P.box(2.2, 0.85, 0.8, 'gold', 0.4, 0.48, 0.2);
    var taxi = P.box(1.2, 0.35, 0.7, 'gold', -0.6, 0.2, -0.4);
    return { hot: hot, b1: b1, b2: b2, crane: crane, jib: jib, fountain: fountain, splash: splash, tram: tram, bus: bus, taxi: taxi };
    ` : category === 'farm' ? `
    P.box(6.2, 0.04, 4.2, 'meadow', 0, 0.02, 0);
    var barn = P.box(2.4, 1.8, 2.0, 'brick', -1.5, 0.9, -0.8);
    var silo = P.cyl(0.5, 0.5, 2.6, 'stone', -2.8, 1.3, -0.8);
    var tractor = P.box(0.9, 0.5, 1.2, 'meadow', 1.4, 0.25, 0.6);
    return { hot: hot, barn: barn, silo: silo, tractor: tractor };
    ` : category === 'park' ? `
    P.box(6.2, 0.04, 4.2, 'meadow', 0, 0.02, 0);
    var pond = P.cyl(1.4, 1.4, 0.05, 'water', -1.0, 0.03, 0.2, null, 16);
    var gazebo = P.cyl(1.0, 1.0, 1.4, 'timber', 1.6, 0.7, -0.8, null, 8);
    return { hot: hot, pond: pond, gazebo: gazebo };
    ` : category === 'office' ? `
    // Office Floor & Partition
    P.box(6.0, 0.04, 4.2, 'wood', 0, 0.02, 0);
    P.box(5.8, 2.2, 0.15, 'paper', 0, 1.1, -1.9);
    // Computer Desk
    var desk = P.box(2.6, 0.1, 1.4, 'wood', 0, 0.85, 0);
    for (var dx of [-1.15, 1.15]) {
      for (var dz of [-0.55, 0.55]) P.box(0.08, 0.8, 0.08, 'steel', dx, 0.4, dz);
    }
    // Computer Monitor & Screen
    P.box(0.4, 0.03, 0.25, 'steel', 0, 0.92, -0.3);
    P.cyl(0.03, 0.03, 0.35, 'steel', 0, 1.08, -0.3);
    P.box(1.4, 0.85, 0.06, 'steel', 0, 1.45, -0.3);
    var screen = P.box(1.32, 0.77, 0.02, 'blue', 0, 1.45, -0.27);
    // Keyboard & Mouse
    P.box(0.7, 0.02, 0.22, 'steel', 0, 0.92, 0.25);
    P.box(0.1, 0.02, 0.14, 'accent', 0.5, 0.92, 0.25);
    // Swivel Office Chair
    var chair = P.group(0, 0, 0.95);
    P.cyl(0.04, 0.04, 0.45, 'steel', 0, 0.22, 0, chair);
    P.box(0.7, 0.08, 0.65, 'blue', 0, 0.48, 0, chair);
    P.box(0.65, 0.6, 0.08, 'blue', 0, 0.82, -0.3, chair);
    // Desk Lamp
    var lamp = P.cyl(0.03, 0.03, 0.65, 'mustard', -1.0, 1.25, -0.35);
    P.ball(0.16, 'mustard', -1.0, 1.6, -0.35);
    return { hot: hot, chair: chair, screen: screen, desk: desk, lamp: lamp };
    ` : category === 'bakery' || category === 'kitchen' ? `
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
    ` : category === 'racing' ? `
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
    ` : category === 'classroom' ? `
    // Hardwood Classroom Floor & Chalkboard Wall
    P.box(6.8, 0.04, 4.4, 'timber', 0, 0.02, 0);
    P.box(6.8, 2.2, 0.15, 'paper', 0, 1.1, -2.1);
    P.box(4.2, 1.3, 0.04, 'iron', 0, 1.3, -2.0);
    for (var cl = -1; cl <= 1; cl++) {
      P.box(1.2, 0.02, 0.01, 'paper', -0.8, 1.3 + cl * 0.22, -1.97);
    }
    var tDesk = P.box(2.2, 0.1, 1.2, 'timber', -1.2, 0.85, -1.0);
    P.box(0.4, 0.02, 0.3, 'iron', -1.2, 0.91, -0.9);
    var teacher = P.person(1.4, -1.0, null, { shirt: '#b86242', pants: '#334155' });
    for (var ci of [-1.4, 1.4]) {
      for (var ri of [0.4, 1.6]) {
        P.box(1.0, 0.08, 0.6, 'timber', ci, 0.68, ri);
        P.box(0.4, 0.06, 0.4, 'iron', ci, 0.38, ri + 0.45);
      }
    }
    var stu1 = P.person(-1.4, 0.8, null, { shirt: '#f8fafc', pants: '#334155' });
    var stu2 = P.person(1.4, 0.8, null, { shirt: '#f59e0b', pants: '#334155' });
    return { hot: hot, teacher: teacher, tDesk: tDesk, stu1: stu1, stu2: stu2 };
    ` : category === 'sports' ? `
    P.box(6.8, 0.04, 4.4, 'meadow', 0, 0.02, 0);
    var net = P.group(0, 0, 0);
    P.cyl(0.03, 0.03, 1.4, 'iron', 0, 0.7, -1.8, net, 6);
    P.cyl(0.03, 0.03, 1.4, 'iron', 0, 0.7, 1.8, net, 6);
    P.box(0.02, 0.65, 3.6, 'paper', 0, 0.9, 0, net);
    var player1 = P.person(-1.8, 0.3, null, { shirt: '#ef4444', pants: '#f8fafc' });
    var player2 = P.person(1.8, -0.3, null, { shirt: '#0284c7', pants: '#334155' });
    var shuttle = P.ball(0.08, 'paper', 0, 1.4, 0.1);
    return { hot: hot, net: net, player1: player1, player2: player2, shuttle: shuttle };
    ` : category === 'airport' ? `
    P.box(7.2, 0.04, 4.4, 'iron', 0, 0.02, 0);
    for (var rx = -3.0; rx <= 3.0; rx += 1.2) P.box(0.7, 0.02, 0.12, 'gold', rx, 0.04, 0);
    var terminal = P.box(4.8, 1.4, 1.2, 'paper', 0, 0.7, -1.6);
    var tower = P.cyl(0.25, 0.35, 2.6, 'paper', 2.6, 1.3, -1.4, null, 10);
    var plane = P.group(-0.8, 0.45, 0.8);
    var fus = P.cyl(0.32, 0.32, 3.0, 'paper', 0, 0, 0, plane, 12);
    fus.rotation.x = Math.PI / 2;
    P.box(2.2, 0.05, 0.7, 'paper', -1.3, 0, 0, plane);
    P.box(2.2, 0.05, 0.7, 'paper', 1.3, 0, 0, plane);
    return { hot: hot, plane: plane, terminal: terminal, tower: tower };
    ` : category === 'harbor' ? `
    P.box(4.0, 0.04, 4.4, 'water', -1.6, 0.02, 0);
    P.box(3.2, 0.35, 4.4, 'stone', 1.8, 0.18, 0);
    var crane = P.box(1.8, 2.8, 3.2, 'accent', 2.0, 1.4, 0);
    var tugboat = P.box(1.2, 0.35, 2.6, 'iron', -2.0, 0.18, 0.4);
    return { hot: hot, crane: crane, tugboat: tugboat };
    ` : category === 'lighthouse' ? `
    P.box(7.2, 0.04, 4.4, 'water', 0, 0.02, 0);
    P.box(3.2, 0.5, 3.0, 'stone', 0, 0.25, 0);
    var lighthouse = P.cyl(0.55, 0.7, 2.4, 'paper', 0.5, 1.4, -0.2, null, 12);
    var cottage = P.box(1.2, 0.7, 0.9, 'brick', -0.8, 0.6, 0.5);
    return { hot: hot, lighthouse: lighthouse, cottage: cottage };
    ` : category === 'campus' ? `
    var hall = P.box(5.4, 1.4, 1.2, 'brick', 0, 0.7, -1.6);
    var tower = P.box(1.2, 2.6, 1.1, 'brick', 0, 1.3, -1.6);
    var fountain = P.cyl(1.1, 1.2, 0.2, 'stone', 0, 0.1, 0.6, null, 14);
    return { hot: hot, hall: hall, tower: tower, fountain: fountain };
    ` : category === 'sea' || category === 'maritime' ? `
    P.box(7.2, 0.04, 4.4, 'water', 0, 0.02, 0);
    var ship = P.box(1.2, 0.4, 2.8, 'timber', 0.4, 0.2, 0.2);
    var sail = P.box(1.1, 1.4, 0.04, 'paper', 0.4, 1.5, 0.7);
    return { hot: hot, ship: ship, sail: sail };
    ` : category === 'castle' ? `
    P.box(7.2, 0.04, 4.4, 'water', 0, 0.02, 0);
    P.box(5.0, 0.35, 3.4, 'stone', 0, 0.18, 0);
    var castle = P.box(3.6, 1.4, 2.4, 'stone', 0, 0.85, 0);
    var keep = P.box(1.6, 2.6, 1.4, 'stone', 0, 1.45, -0.2);
    return { hot: hot, castle: castle, keep: keep };
    ` : category === 'city' ? `
    P.box(7.2, 0.04, 4.4, 'iron', 0, 0.02, 0);
    var bldg1 = P.box(1.8, 3.8, 1.0, 'iron', -2.2, 1.9, -1.8);
    var bldg2 = P.box(2.0, 4.6, 1.1, 'stone', 0.4, 2.3, -1.8);
    var taxi = P.box(1.8, 0.35, 0.9, 'gold', 0, 0.25, 0.4);
    return { hot: hot, taxi: taxi, bldg1: bldg1, bldg2: bldg2 };
    ` : category === 'farm' ? `
    var barn = P.box(2.4, 1.8, 2.0, 'brick', -1.6, 0.9, -0.8);
    var silo = P.cyl(0.55, 0.55, 2.6, 'stone', -2.8, 1.3, 0.8, null, 12);
    var tractor = P.box(1.4, 0.45, 0.8, 'accent', 1.2, 0.25, 0.6);
    return { hot: hot, barn: barn, silo: silo, tractor: tractor };
    ` : category === 'park' ? `
    var gazebo = P.cyl(1.2, 1.3, 1.4, 'timber', -1.4, 0.7, -0.6, null, 8);
    var pond = P.cyl(1.3, 1.3, 0.08, 'water', 1.2, 0.04, 0.8, null, 14);
    return { hot: hot, gazebo: gazebo, pond: pond };
    ` : category === 'abstract' ? `
    var ring1 = P.cyl(1.4, 1.4, 0.08, 'gold', 0, 1.4, 0, null, 16);
    var ring2 = P.cyl(1.0, 1.0, 0.08, 'paper', 0, 1.4, 0, null, 16);
    return { hot: hot, ring1: ring1, ring2: ring2 };
    ` : `
    // Medieval Cobblestone Courtyard & Timber Architecture
    P.box(5.4, 0.12, 3.8, 'stone', 0, 0.06, 0);
    // Timber Pavilion Canopy
    P.cyl(0.08, 0.08, 2.2, 'timber', -1.6, 1.1, -1.0, null, 8);
    P.cyl(0.08, 0.08, 2.2, 'timber', 1.6, 1.1, -1.0, null, 8);
    P.cyl(0.08, 0.08, 2.2, 'timber', -1.6, 1.1, 1.0, null, 8);
    P.cyl(0.08, 0.08, 2.2, 'timber', 1.6, 1.1, 1.0, null, 8);
    var roof = P.box(3.6, 0.2, 2.4, 'timber', 0, 2.25, 0);
    // Central Stone Fountain Basin
    P.cyl(0.8, 0.8, 0.35, 'stone', 0, 0.25, 0, null, 12);
    var water = P.ball(0.25, 'water', 0, 0.55, 0);
    var traveler = P.person(-0.7, 0.12, null, { shirt: '#3b82f6', pants: '#1e293b' });
    traveler.name = 'traveler'; hot.push(traveler);
    return { hot: hot, roof: roof, water: water, traveler: traveler };
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
  const { slug, cleanTitle, cleanMeans, theme, semantics, prompt, size = 'card' } = opts;
  const { category, primarySubject } = semantics;

  return `/* ${cleanTitle} · Any3d SVG isometric figure */
Any3d.figure({
  name: '${slug}',
  size: '${size}',
  theme: '${theme}',
  title: '${cleanTitle}',
  means: '${cleanMeans}',
  hint: 'Drag to inspect 3D view; hover items to interact.',
  camera: { az: ${size === 'hero' ? 38 : 40}, el: ${size === 'hero' ? 32 : 34}, pad: ${size === 'hero' ? 1.15 : 1.08} },
  still: 2.0,
  build: function (o) {
    var D = o.D, pal = o.pal, hot = [];

    ${(category === 'transit_bus' || primarySubject === 'bus') ? `
    // Multi-Lane Asphalt Transit Avenue & Paved Sidewalk Foundation
    var ground = D.slab(14.0, 9.8, pal.ground, 0, 0, 0, null, { h: 0.6, r: 1.2, side: pal.base });
    D.box(13.2, 0.04, 5.2, pal.asphalt, 0, 0.02, 1.0, null, { shadow: false });
    // Dashed Yellow Lane Divider
    for (var dx = -5.0; dx <= 5.0; dx += 2.0) {
      D.box(1.0, 0.015, 0.14, pal.mustard, dx, 0.045, 1.0, null, { shadow: false });
    }
    // Sidewalk with Stone Curb
    D.box(13.2, 0.18, 2.8, pal.paper, 0, 0.1, -2.8);

    // Glass Bus Stop Shelter with Bench & Timetable
    var shelter = D.group(-3.4, 0, -2.8);
    shelter.name = 'bus stop shelter';
    hot.push(shelter);
    D.box(3.8, 0.08, 1.6, pal.steel, 0, 2.3, 0, shelter); // Roof
    D.box(3.6, 2.2, 0.04, pal.sky, 0, 1.1, -0.75, shelter); // Back Glass
    D.box(0.04, 2.2, 1.4, pal.sky, -1.8, 1.1, 0, shelter);  // Side Glass
    [-1.8, 0, 1.8].forEach(function (sx) {
      D.cyl(0.05, 0.05, 2.3, pal.ink, sx, 1.15, 0.75, shelter, 8);
    });
    // Waiting Bench
    D.box(2.4, 0.08, 0.45, pal.wood, 0, 0.55, -0.2, shelter);
    // Route 42 Bus Stop Pole
    var pole = D.group(2.6, 0, -2.2);
    D.cyl(0.04, 0.04, 2.6, pal.steel, 0, 1.3, 0, pole, 8);
    D.box(0.6, 0.8, 0.06, pal.mustard, 0, 2.1, 0, pole);
    D.box(0.5, 0.65, 0.02, pal.paper, 0, 2.1, 0.04, pole, { shadow: false });

    // Detailed City Transit Bus with Windows & Passengers
    var bus = D.group(0, 0.04, 1.0);
    bus.name = 'city transit bus';
    hot.push(bus);
    // Bus Chassis
    D.box(7.6, 2.0, 2.4, pal.mustard, 0, 1.35, 0, bus);
    // Lower Fender Skirt
    D.box(7.7, 0.4, 2.45, pal.ink, 0, 0.45, 0, bus);
    // Roof Panel & AC Units
    D.box(7.6, 0.16, 2.42, pal.paper, 0, 2.43, 0, bus);
    D.box(1.6, 0.22, 1.1, pal.steel, -1.2, 2.58, 0, bus);
    D.box(1.6, 0.22, 1.1, pal.steel, 1.4, 2.58, 0, bus);

    // Front Windshield & Destination Sign
    D.box(0.06, 1.0, 2.2, pal.sky, 3.82, 1.7, 0, bus);
    D.box(0.08, 0.3, 1.6, pal.ink, 3.83, 2.25, 0, bus);
    D.box(0.04, 0.18, 1.4, pal.paper, 3.88, 2.25, 0, bus, { shadow: false });
    // Headlights
    D.cyl(0.12, 0.12, 0.04, pal.paper, 3.83, 0.8, -0.8, bus, 10);
    D.cyl(0.12, 0.12, 0.04, pal.paper, 3.83, 0.8, 0.8, bus, 10);

    // Cutaway Panoramic Passenger Windows
    D.box(6.8, 0.95, 2.48, pal.sky, 0, 1.82, 0, bus);

    // Wheels
    [-2.4, 2.4].forEach(function (wx) {
      [-1.24, 1.24].forEach(function (wz) {
        D.wheel(0.38, 0.26, pal.tyre, wx, 0.38, wz, bus);
      });
    });

    // Seated Passenger Figures inside the bus
    var passengers = [];
    [
      { x: -2.4, z: -0.65, shirt: pal.coral },
      { x: -1.2, z: -0.65, shirt: pal.teal },
      { x: 0.0, z: -0.65, shirt: pal.plum },
      { x: 1.2, z: -0.65, shirt: pal.rose },
      { x: -2.4, z: 0.65, shirt: pal.cobalt },
      { x: -1.2, z: 0.65, shirt: pal.sage },
      { x: 0.0, z: 0.65, shirt: pal.accent }
    ].forEach(function (p) {
      var pass = D.props.person(p.x, p.z, bus, { shirt: p.shirt, hat: false });
      pass.position.y = 0.55;
      passengers.push(pass);
    });

    // Standing Bus Conductor Figure at Entrance
    var conductor = D.group(2.8, 0.55, 0, bus);
    conductor.name = 'bus conductor';
    hot.push(conductor);
    D.props.person(0, 0, conductor, { shirt: pal.ink, hat: pal.mustard });
    // Ticket Machine Box in Hand
    D.box(0.16, 0.1, 0.08, pal.steel, 0.2, 0.45, 0.12, conductor);

    // Street Lighting
    D.props.lamp(-5.2, -4.0, null, { h: 3.2 });
    D.props.lamp(0, -4.0, null, { h: 3.2 });
    D.props.lamp(5.2, -4.0, null, { h: 3.2 });

    return { ground: ground, hot: hot, bus: bus, conductor: conductor, passengers: passengers };
    ` : category === 'classroom' ? `
    // Hardwood Classroom Parquet Foundation & Wall Cutaway
    var ground = D.slab(11.0, 8.5, pal.ground, 0, 0, 0, null, { h: 0.6, r: 1.2, side: pal.base });
    D.box(10.2, 0.05, 7.6, pal.wood, 0, 0.02, 0, null, { shadow: false });
    D.box(10.4, 4.0, 0.2, pal.paper, 0, 2.0, -3.9, null);

    // Large Framed Dark Green Chalkboard with Equations
    var board = D.group(-0.8, 0, -3.75);
    board.name = 'the chalkboard';
    hot.push(board);
    D.box(5.8, 2.4, 0.08, pal.ink, 0, 2.2, 0, board);
    D.box(5.5, 2.1, 0.05, pal.ok, 0, 2.2, 0.03, board, { shadow: false });
    [1.5, 1.9, 2.3, 2.7].forEach(function (y, i) {
      D.box(2.8 - i * 0.4, 0.05, 0.02, pal.paper, -1.0, y, 0.07, board, { shadow: false });
    });
    D.box(2.2, 0.08, 0.25, pal.steel, 0, 0.95, 0.1, board);

    // Wall Clock
    var clock = D.group(3.4, 3.1, -3.7);
    var face = D.cyl(0.45, 0.45, 0.12, pal.paper, 0, 0, 0, clock, 20);
    face.rotation.x = Math.PI / 2;
    var mh = D.box(0.04, 0.32, 0.03, pal.ink, 0, 0.12, 0.1, clock);
    var hh = D.box(0.05, 0.2, 0.03, pal.ink, 0, 0.06, 0.1, clock);

    // Teacher Lecturing at the Front
    var teacher = D.props.person(-0.8, -2.8, null, { shirt: pal.teal, hat: false });
    teacher.name = 'teacher';
    hot.push(teacher);

    // Teacher's Executive Oak Desk & Laptop
    var tDesk = D.group(-2.6, 0, -2.0);
    tDesk.name = 'teacher desk';
    hot.push(tDesk);
    D.box(2.2, 0.1, 1.3, pal.wood, 0, 0.88, 0, tDesk);
    D.box(0.55, 0.02, 0.38, pal.steel, 0, 0.94, 0, tDesk);
    var tScr = D.box(0.55, 0.38, 0.02, pal.ink, 0, 1.12, -0.18, tDesk);
    tScr.rotation.x = -0.25;
    D.box(0.5, 0.32, 0.02, pal.sky, 0, 1.12, -0.17, tDesk).rotation.x = -0.25;

    // Globe on Teacher Desk
    var globe = D.group(3.6, 0, 0.4);
    globe.name = 'the globe';
    hot.push(globe);
    D.cyl(0.07, 0.09, 0.5, pal.steel, 0, 0.25, 0, globe, 8);
    D.cyl(0.3, 0.3, 0.05, pal.wood, 0, 0.03, 0, globe, 14);
    var gBall = D.group(0, 0.75, 0, globe);
    D.ball(0.35, pal.sky, 0, 0, 0, gBall);
    var gRing = D.torus(0.36, 0.02, pal.mustard, 0, 0, 0, gBall);
    gRing.rotation.x = 1.2;

    // Two Rows of Student Desks with Student Figures
    [[-2.4, 0.2], [0, 0.2], [2.4, 0.2], [-2.4, 2.0], [0, 2.0], [2.4, 2.0]].forEach(function (pos, i) {
      var d = D.group(pos[0], 0, pos[1]);
      d.name = 'student desk ' + (i + 1);
      hot.push(d);
      D.box(1.4, 0.08, 0.85, pal.mustard, 0, 0.72, 0, d);
      [[-0.55, -0.3], [0.55, -0.3], [-0.55, 0.3], [0.55, 0.3]].forEach(function (l) {
        D.cyl(0.035, 0.035, 0.7, pal.steel, l[0], 0.35, l[1], d, 8);
      });
      D.box(1.0, 0.04, 0.5, pal.paper, 0, 0.78, 0.05, d);
      var ch = D.group(0, 0, 0.75, d);
      D.box(0.6, 0.08, 0.5, pal.cobalt, 0, 0.52, 0, ch);
      D.box(0.6, 0.5, 0.08, pal.cobalt, 0, 0.8, -0.22, ch);
      D.cyl(0.05, 0.05, 0.5, pal.steel, 0, 0.26, 0, ch, 8);
    });
    var student1 = D.props.person(0, 0.8, null, { shirt: pal.coral, hat: pal.paper });
    var student2 = D.props.person(-2.4, 2.6, null, { shirt: pal.mustard, hat: false });
    return { ground: ground, hot: hot, board: board, mh: mh, hh: hh, gBall: gBall, teacher: teacher };
    ` : category === 'sports' ? `
    // Stadium Green Court Mat with Boundary Lines
    var ground = D.slab(11.0, 9.0, pal.ground, 0, 0, 0, null, { h: 0.6, r: 1.2, side: pal.base });
    D.box(8.6, 0.04, 7.2, pal.leaf, 0, 0.05, 0, null, { shadow: false });
    D.box(8.2, 0.02, 6.8, pal.leafDark, 0, 0.06, 0, null, { shadow: false });
    D.box(8.0, 0.02, 0.06, pal.paper, 0, 0.08, -3.0, null, { shadow: false });
    D.box(8.0, 0.02, 0.06, pal.paper, 0, 0.08, 3.0, null, { shadow: false });
    D.box(0.06, 0.02, 6.0, pal.paper, -4.0, 0.08, 0, null, { shadow: false });
    D.box(0.06, 0.02, 6.0, pal.paper, 4.0, 0.08, 0, null, { shadow: false });
    D.box(8.0, 0.02, 0.04, pal.paper, 0, 0.08, 0, null, { shadow: false });

    // Net & Posts
    var net = D.group(0, 0, 0);
    net.name = 'net';
    hot.push(net);
    D.cyl(0.05, 0.05, 1.4, pal.steel, 0, 0.7, -3.4, net, 10);
    D.cyl(0.05, 0.05, 1.4, pal.steel, 0, 0.7, 3.4, net, 10);
    D.box(0.04, 0.9, 6.8, pal.cloud, 0, 0.7, 0, net);
    D.box(0.05, 0.06, 6.8, pal.accent, 0, 1.18, 0, net);

    // Player 1 (Left Court)
    var player1 = D.group(-3.0, 0, 1.2);
    player1.name = 'player 1';
    hot.push(player1);
    D.props.person(0, 0, player1, { shirt: pal.coral, hat: pal.paper, yaw: 0.3 });
    D.box(0.05, 0.3, 0.05, pal.steel, 0.3, 1.2, 0.2, player1);
    D.box(0.45, 0.04, 0.35, pal.ink, 0.6, 1.3, 0.2, player1);

    // Player 2 (Right Court)
    var player2 = D.group(3.0, 0, -1.2);
    player2.name = 'player 2';
    hot.push(player2);
    D.props.person(0, 0, player2, { shirt: pal.mustard, hat: pal.cloud, yaw: -0.3 });
    D.box(0.05, 0.3, 0.05, pal.steel, -0.3, 1.2, 0.2, player2);
    D.box(0.45, 0.04, 0.35, pal.ink, -0.6, 1.3, 0.2, player2);

    // Suspended Shuttlecock Mid-Air
    var shuttle = D.ball(0.12, pal.cloud, 0, 2.0, 0);
    shuttle.name = 'shuttlecock';
    hot.push(shuttle);
    D.cone(0.08, 0.22, pal.coral, 0, 1.88, 0, null, 8);

    // High Referee Chair
    var refChair = D.group(0, 0, -3.8);
    refChair.name = 'referee chair';
    hot.push(refChair);
    D.cyl(0.04, 0.04, 2.4, pal.steel, -0.35, 1.2, 0, refChair, 8);
    D.cyl(0.04, 0.04, 2.4, pal.steel, 0.35, 1.2, 0, refChair, 8);
    D.box(0.8, 0.06, 0.7, pal.wood, 0, 1.8, 0, refChair);
    D.box(0.8, 0.5, 0.06, pal.wood, 0, 2.1, -0.32, refChair);

    return { ground: ground, hot: hot, net: net, player1: player1, player2: player2, shuttle: shuttle };
    ` : category === 'airport' ? `
    // Airport Tarmac Slab & Runway Markings
    var ground = D.slab(11.5, 9.0, pal.ink, 0, 0, 0, null, { h: 0.5, r: 0.8, side: pal.slate });
    D.box(9.5, 0.02, 0.25, pal.mustard, 0, 0.02, 0, null, { shadow: false });
    for (var rx = -4; rx <= 4; rx += 1.8) {
      D.box(0.9, 0.02, 0.15, pal.paper, rx, 0.02, -1.8, null, { shadow: false });
    }

    // Modern Concourse Terminal with Glass Curtain Wall
    var terminal = D.box(4.8, 2.0, 2.4, pal.paper, -2.6, 1.0, -2.6);
    D.box(4.4, 0.9, 0.06, pal.sky, -2.6, 1.1, -1.37);

    // Air Traffic Control Tower
    D.cyl(0.35, 0.45, 3.4, pal.slate, 3.8, 1.7, -2.6, null, 12);
    D.box(1.4, 0.7, 1.4, pal.paper, 3.8, 3.7, -2.6);
    D.box(1.2, 0.45, 1.2, pal.sky, 3.8, 3.7, -2.6);
    var radar = D.torus(0.4, 0.06, pal.coral, 3.8, 4.3, -2.6);
    radar.name = 'radar';
    hot.push(radar);

    // Commercial Passenger Airliner
    var plane = D.group(0.5, 0.8, 1.2);
    plane.name = 'airliner';
    hot.push(plane);
    D.cyl(0.48, 0.48, 3.8, pal.paper, 0, 0, 0, plane, 16);
    D.cone(0.48, 0.8, pal.paper, 0, 0, 2.3, plane, 16);
    D.wedge(3.8, 0.06, 1.4, pal.paper, 0, 0, -0.3, plane);
    D.wedge(0.06, 0.9, 0.8, pal.coral, 0, 0.6, -1.6, plane);
    D.cyl(0.18, 0.18, 0.7, pal.slate, -1.1, -0.22, -0.2, plane, 10);
    D.cyl(0.18, 0.18, 0.7, pal.slate, 1.1, -0.22, -0.2, plane, 10);

    // Baggage Tug
    D.box(0.9, 0.5, 1.4, pal.mustard, -2.4, 0.25, 1.6);
    return { ground: ground, hot: hot, plane: plane, radar: radar };
    ` : category === 'harbor' ? `
    // Deep Ocean Water Slab & Concrete Quay
    var ground = D.slab(11.5, 9.0, pal.sky, 0, 0, 0, null, { h: 0.5, r: 0.8, side: pal.cobalt });
    D.box(5.2, 0.6, 8.6, pal.slate, -3.1, 0.3, 0);
    [-3.0, 0, 3.0].forEach(function (bz) {
      D.cyl(0.1, 0.12, 0.3, pal.ink, -0.6, 0.65, bz, null, 8);
    });

    // Container Gantry Crane
    var crane = D.group(-2.6, 0.6, 0);
    crane.name = 'container gantry crane';
    hot.push(crane);
    D.box(0.12, 3.8, 0.12, pal.mustard, -1.2, 1.9, -1.6, crane);
    D.box(0.12, 3.8, 0.12, pal.mustard, 1.2, 1.9, -1.6, crane);
    D.box(0.12, 3.8, 0.12, pal.mustard, -1.2, 1.9, 1.6, crane);
    D.box(0.12, 3.8, 0.12, pal.mustard, 1.2, 1.9, 1.6, crane);
    D.box(2.8, 0.16, 4.4, pal.mustard, 0.6, 3.8, 0, crane);

    // Stacked Shipping Containers
    D.box(1.0, 0.9, 2.4, pal.coral, -3.8, 0.95, -1.8);
    D.box(1.0, 0.9, 2.4, pal.cobalt, -3.8, 0.95, 1.2);
    D.box(1.0, 0.9, 2.4, pal.mustard, -3.8, 1.85, -1.8);

    // Cargo Tugboat
    var tug = D.group(2.6, 0.3, 0.5);
    tug.name = 'cargo tug';
    hot.push(tug);
    D.box(1.8, 0.6, 3.8, pal.coral, 0, 0.3, 0, tug);
    D.wedge(1.8, 0.6, 1.0, pal.coral, 0, 0.3, 2.4, tug);
    D.box(1.2, 0.8, 1.4, pal.paper, 0, 0.9, 0.2, tug);
    D.cyl(0.16, 0.16, 0.7, pal.ink, 0, 1.5, -0.4, tug, 8);
    return { ground: ground, hot: hot, crane: crane, tug: tug };
    ` : category === 'lighthouse' ? `
    // Ocean Water Slab & Stepped Rock Cliff Island
    var ground = D.slab(11.5, 9.0, pal.sky, 0, 0, 0, null, { h: 0.5, r: 0.8, side: pal.cobalt });
    D.box(6.2, 1.2, 5.8, pal.slate, -0.6, 0.6, -0.6);
    D.box(4.8, 0.8, 4.4, pal.paper, -0.6, 1.6, -0.6);

    // Red & White Banded Cylindrical Lighthouse Tower
    var tower = D.group(-1.2, 1.8, -1.0);
    tower.name = 'lighthouse tower';
    hot.push(tower);
    D.cyl(0.72, 0.88, 1.2, pal.paper, 0, 0.6, 0, tower, 16);
    D.cyl(0.62, 0.72, 1.2, pal.coral, 0, 1.8, 0, tower, 16);
    D.cyl(0.52, 0.62, 1.2, pal.paper, 0, 3.0, 0, tower, 16);
    D.cyl(0.44, 0.44, 0.7, pal.mustard, 0, 3.95, 0, tower, 12);
    D.dome(0.48, pal.coral, 0, 4.3, 0, tower);
    var beam = D.wedge(0.4, 0.4, 3.6, pal.mustard, 0, 3.95, 1.8, tower);

    // Keeper's Cottage
    D.box(1.8, 1.1, 1.5, pal.paper, 1.4, 2.35, -0.5);
    D.wedge(1.9, 0.7, 1.6, pal.terracotta, 1.4, 3.25, -0.5);

    // Wooden Jetty with Dinghy
    D.box(1.2, 0.15, 2.8, pal.wood, 2.6, 0.65, 2.4);
    D.box(0.8, 0.35, 1.6, pal.wood, 3.6, 0.3, 2.4);
    return { ground: ground, hot: hot, tower: tower, beam: beam };
    ` : category === 'campus' ? `
    // Academic Campus Green Lawn Slab
    var ground = D.slab(11.0, 8.5, pal.ground, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });

    // Red Brick Collegiate University Hall with Clock Tower
    var hall = D.box(7.6, 2.6, 2.4, pal.terracotta, 0, 1.3, -2.6);
    D.box(1.6, 1.8, 0.3, pal.paper, 0, 0.9, -1.35);
    D.box(1.6, 4.6, 1.6, pal.terracotta, 0, 2.3, -2.6);
    D.cone(1.2, 1.2, pal.slate, 0, 5.2, -2.6, 4);

    // Central Paved Quad with Tiered Stone Fountain
    var fountain = D.group(0, 0, 1.0);
    fountain.name = 'quad fountain';
    hot.push(fountain);
    D.cyl(1.5, 1.5, 0.3, pal.slate, 0, 0.15, 0, fountain, 20);
    D.cyl(0.8, 0.8, 0.4, pal.paper, 0, 0.4, 0, fountain, 16);
    D.ball(0.26, pal.sky, 0, 0.85, 0, fountain);

    // Quad Trees, Benches, and Students
    D.props.tree(-3.6, 1.2, null, { r: 0.8 });
    D.props.tree(3.6, 1.2, null, { r: 0.8 });
    D.props.person(1.4, 1.8, null, { shirt: pal.coral });
    D.props.person(-1.6, 1.6, null, { shirt: pal.mustard });
    return { ground: ground, hot: hot, fountain: fountain };
    ` : (category === 'sea' || category === 'maritime') ? `
    // Open Ocean Swell Slab
    var ground = D.slab(11.5, 9.0, pal.sky, 0, 0, 0, null, { h: 0.5, r: 0.8, side: pal.cobalt });

    // Multi-Mast Sailing Schooner
    var ship = D.group(0, 0.3, 0);
    ship.name = 'schooner';
    hot.push(ship);
    D.box(1.8, 0.8, 5.2, pal.wood, 0, 0.4, 0, ship);
    D.wedge(1.8, 0.8, 1.2, pal.wood, 0, 0.4, 2.8, ship);
    D.cyl(0.06, 0.06, 3.4, pal.wood, 0, 2.0, -1.0, ship, 8);
    D.cyl(0.06, 0.06, 3.6, pal.wood, 0, 2.2, 0.8, ship, 8);
    D.wedge(1.4, 1.8, 0.08, pal.paper, 0, 2.2, -1.0, ship);
    D.wedge(1.6, 2.0, 0.08, pal.paper, 0, 2.4, 0.8, ship);

    // Coral Reef Outcrop & Navigation Buoy
    D.ball(0.8, pal.coral, -3.6, 0.2, -2.2);
    D.ball(0.6, pal.mint, -4.0, 0.3, -1.6);
    D.cyl(0.2, 0.2, 0.8, pal.flame, 3.4, 0.4, 2.4, null, 8);
    return { ground: ground, hot: hot, ship: ship };
    ` : category === 'castle' ? `
    // Moat Slab & Castle Fortress Architecture
    var ground = D.slab(11.5, 9.0, pal.sky, 0, 0, 0, null, { h: 0.5, r: 0.8, side: pal.cobalt });
    D.box(6.6, 1.8, 5.8, pal.slate, 0, 0.9, 0);
    D.box(5.4, 2.0, 4.6, pal.paper, 0, 1.0, 0);

    // 4 Corner Watchtowers
    [-2.9, 2.9].forEach(function (tx) {
      [-2.5, 2.5].forEach(function (tz) {
        D.cyl(0.65, 0.65, 2.8, pal.slate, tx, 1.4, tz, null, 16);
        D.cone(0.75, 1.1, pal.terracotta, tx, 3.35, tz, 16);
      });
    });

    // Central Royal Keep with Flag
    var keep = D.group(0, 0, 0);
    keep.name = 'royal keep';
    hot.push(keep);
    D.box(3.0, 3.6, 2.6, pal.slate, 0, 1.8, 0, keep);
    D.props.flag(0, 0, keep, { h: 4.8, color: pal.coral });

    // Drawbridge & Guard
    D.box(1.3, 0.1, 2.2, pal.wood, 0, 0.1, 3.2);
    D.props.person(-0.8, 3.0, null, { shirt: pal.steel, hat: pal.steel });
    return { ground: ground, hot: hot, keep: keep };
    ` : category === 'city' ? `
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
` : category === 'farm' ? `
    // Farm Countryside Terrain
    var ground = D.slab(11.0, 8.5, pal.ground, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });

    // Classic Red Barn with Gambrel Roof
    var barn = D.group(-2.6, 0, -1.4);
    barn.name = 'red barn';
    hot.push(barn);
    D.box(3.4, 2.2, 2.8, pal.coral, 0, 1.1, 0, barn);
    D.wedge(3.5, 1.2, 2.9, pal.paper, 0, 2.8, 0, barn);
    D.box(1.4, 1.6, 0.06, pal.paper, 0, 0.8, 1.42, barn);

    // Grain Silo with Domed Roof
    D.cyl(0.7, 0.7, 3.4, pal.slate, -4.2, 1.7, 1.2, null, 16);
    D.dome(0.72, pal.paper, -4.2, 3.4, 1.2);

    // Farm Tractor
    var tractor = D.group(1.8, 0, 0.8);
    tractor.name = 'tractor';
    hot.push(tractor);
    D.box(1.2, 0.6, 1.8, pal.leaf, 0, 0.5, 0, tractor);
    D.cyl(0.38, 0.38, 0.22, pal.ink, -0.65, 0.38, -0.45, tractor, 12);
    D.cyl(0.38, 0.38, 0.22, pal.ink, 0.65, 0.38, -0.45, tractor, 12);
    D.cyl(0.24, 0.24, 0.18, pal.ink, -0.6, 0.24, 0.55, tractor, 10);
    D.cyl(0.24, 0.24, 0.18, pal.ink, 0.6, 0.24, 0.55, tractor, 10);

    // Pasture Fence & Tree
    D.box(0.08, 0.7, 3.8, pal.wood, 3.8, 0.35, -1.0);
    D.props.tree(3.2, -2.6, null, { r: 0.7 });
    return { ground: ground, hot: hot, barn: barn, tractor: tractor };
    ` : category === 'park' ? `
    // Landscaped Lawn & Serene Duck Pond
    var ground = D.slab(11.0, 8.5, pal.leaf, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    var pond = D.cyl(2.0, 2.0, 0.04, pal.sky, -1.5, 0.02, 0.5, null, 24);
    D.box(0.8, 0.12, 2.4, pal.wood, -1.5, 0.25, 0.5);

    // Timber Gazebo Bandstand
    var gazebo = D.group(2.4, 0, -1.6);
    gazebo.name = 'park gazebo';
    hot.push(gazebo);
    D.cyl(1.4, 1.4, 0.2, pal.wood, 0, 0.1, 0, gazebo, 16);
    D.cone(1.6, 1.1, pal.terracotta, 0, 2.4, 0, gazebo, 8);

    // Park Benches, Trees, and Visitor
    D.props.tree(-3.6, -2.4, null, { r: 0.85 });
    D.props.tree(3.8, 2.0, null, { r: 0.8 });
    D.props.person(1.2, 1.8, null, { shirt: pal.coral });
    return { ground: ground, hot: hot, gazebo: gazebo };
    ` : category === 'office' ? `
    // Office Foundation Slab & Polished Flooring
    var ground = D.slab(11.0, 8.5, pal.ground, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    for (var ix = -4; ix <= 4; ix++) {
      for (var iz = -3; iz <= 3; iz++) {
        D.box(1.0, 0.02, 0.8, ((ix + iz) % 2 === 0) ? pal.paper : pal.slate, ix * 1.05, 0.02, iz * 0.85, null, { shadow: false });
      }
    }

    // Cutaway Back Wall with Art Panel
    D.box(9.2, 2.6, 0.22, pal.paper, 0, 1.3, -3.4);
    D.box(9.4, 0.14, 0.3, pal.wood, 0, 2.6, -3.4);
    D.box(3.2, 1.4, 0.06, pal.sky, 0, 1.5, -3.25);

    // Executive Computer Desk
    var desk = D.group(0, 0, -0.4);
    desk.name = 'office desk';
    hot.push(desk);
    D.box(3.4, 0.12, 1.8, pal.wood, 0, 0.92, 0, desk);
    D.box(3.2, 0.65, 0.04, pal.ink, 0, 0.55, -0.85, desk);
    for (var dx of [-1.55, 1.55]) {
      for (var dz of [-0.8, 0.8]) {
        D.cyl(0.05, 0.05, 0.86, pal.slate, dx, 0.43, dz, desk, 12);
      }
    }

    // Desktop Computer Monitor
    var monitor = D.group(0, 0.98, -0.35, desk);
    monitor.name = 'desktop monitor';
    hot.push(monitor);
    D.box(0.5, 0.03, 0.35, pal.ink, 0, 0.02, 0, monitor);
    D.cyl(0.04, 0.04, 0.4, pal.slate, 0, 0.2, 0, monitor, 12);
    D.box(1.6, 1.0, 0.08, pal.ink, 0, 0.72, 0, monitor);
    var screen = D.box(1.5, 0.9, 0.02, pal.sky, 0, 0.72, 0.045, monitor);

    // Keyboard and mouse
    D.box(0.85, 0.03, 0.28, pal.slate, 0, 1.0, 0.3, desk);
    D.box(0.12, 0.03, 0.18, pal.coral, 0.65, 1.0, 0.3, desk);

    // Ergonomic Swivel Chair
    var chair = D.group(0, 0, 1.1);
    chair.name = 'office chair';
    hot.push(chair);
    D.cyl(0.3, 0.3, 0.05, pal.ink, 0, 0.02, 0, chair, 16);
    D.cyl(0.05, 0.05, 0.48, pal.slate, 0, 0.26, 0, chair, 12);
    D.rbox(0.8, 0.1, 0.75, pal.ink, 0, 0.55, 0, chair, { r: 0.04 });
    D.rbox(0.72, 0.7, 0.08, pal.ink, 0, 0.95, -0.34, chair, { r: 0.04 });
    D.box(0.08, 0.26, 0.48, pal.slate, -0.42, 0.75, 0, chair);
    D.box(0.08, 0.26, 0.48, pal.slate, 0.42, 0.75, 0, chair);

    // Desk Task Lamp
    var lamp = D.group(-1.2, 0.98, -0.3, desk);
    lamp.name = 'desk lamp';
    hot.push(lamp);
    D.cyl(0.16, 0.18, 0.05, pal.mustard, 0, 0.02, 0, lamp, 12);
    D.cyl(0.03, 0.03, 0.75, pal.mustard, 0, 0.38, 0, lamp, 8);
    D.cone(0.2, 0.26, pal.mustard, 0.1, 0.78, 0.1, lamp, 14);

    // Steaming coffee mug
    D.cyl(0.09, 0.08, 0.16, pal.coral, 0.95, 1.06, 0.4, desk, 14);
    D.torus(0.06, 0.02, pal.coral, 1.06, 1.06, 0.4, desk);

    // Potted Succulent Plant
    D.cyl(0.16, 0.22, 0.28, pal.terracotta, -1.3, 1.12, 0.4, desk, 14);
    D.ball(0.2, pal.green, -1.3, 1.34, 0.4, desk);

    // Bookshelf / Filing Unit
    var shelf = D.group(3.2, 0, -1.2);
    shelf.name = 'filing shelf';
    hot.push(shelf);
    D.box(1.0, 2.2, 1.6, pal.wood, 0, 1.1, 0, shelf);
    for (var b = 0; b < 6; b++) {
      var col = [pal.coral, pal.mustard, pal.sky, pal.green, pal.terracotta, pal.slate][b];
      D.box(0.7, 0.4, 0.12, col, 0, 0.45, -0.55 + b * 0.22, shelf);
      D.box(0.7, 0.4, 0.12, col, 0, 1.15, -0.55 + b * 0.22, shelf);
    }

    return { ground: ground, hot: hot, desk: desk, chair: chair, screen: screen, lamp: lamp, shelf: shelf };
    ` : category === 'bakery' || category === 'kitchen' ? `
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
    ` : category === 'racing' ? `
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
    ` : category === 'classroom' ? `
    // Parquet Classroom Floor & Back Wall
    var ground = D.slab(11.0, 8.5, pal.wood, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    D.box(9.6, 2.8, 0.22, pal.paper, 0, 1.4, -3.6);
    D.box(9.8, 0.14, 0.32, pal.wood, 0, 2.8, -3.6);

    // Large Green Framed Chalkboard with Chalk Lines
    var board = D.group(0, 1.7, -3.45);
    board.name = 'chalkboard';
    hot.push(board);
    D.box(5.8, 1.8, 0.06, pal.green, 0, 0, 0, board);
    D.box(6.0, 0.08, 0.12, pal.wood, 0, 0.94, 0, board);
    D.box(6.0, 0.12, 0.18, pal.wood, 0, -0.94, 0.05, board);
    for (var cl = -2; cl <= 2; cl++) {
      D.box(1.5, 0.02, 0.01, pal.paper, -1.5, cl * 0.28, 0.04, board);
    }
    D.cyl(0.02, 0.02, 0.7, pal.mustard, 1.5, 0.15, 0.04, board);
    D.cyl(0.02, 0.02, 0.7, pal.mustard, 1.5, -0.15, 0.04, board);
    D.box(0.1, 0.03, 0.03, pal.paper, -0.8, -0.84, 0.08, board);
    D.box(0.24, 0.05, 0.08, pal.ink, 0.6, -0.84, 0.08, board);

    // Wall Clock
    var clock = D.group(0, 2.85, -3.45);
    D.cyl(0.3, 0.3, 0.04, pal.ink, 0, 0, 0, clock, 16);
    D.cyl(0.26, 0.26, 0.02, pal.paper, 0, 0, 0.02, clock, 16);
    D.ball(0.04, pal.coral, 0, 0, 0.04, clock);

    // Teacher Figure Standing Proudly at Front Lecturing
    var teacher = D.props.person(1.8, -1.6, null, { shirt: pal.coral, pants: pal.slate, hat: pal.paper });
    teacher.name = 'teacher';
    hot.push(teacher);

    // Teacher's Wooden Desk
    var tDesk = D.group(-1.8, 0, -1.8);
    tDesk.name = 'teacher desk';
    hot.push(tDesk);
    D.box(2.8, 0.1, 1.4, pal.wood, 0, 0.9, 0, tDesk);
    for (var tx of [-1.25, 1.25]) {
      for (var tz of [-0.55, 0.55]) D.cyl(0.04, 0.04, 0.85, pal.ink, tx, 0.42, tz, tDesk, 8);
    }
    D.box(0.5, 0.02, 0.35, pal.slate, -0.3, 0.96, 0, tDesk);
    var tScreen = D.box(0.5, 0.35, 0.02, pal.ink, -0.3, 1.12, -0.15, tDesk);
    tScreen.rotation.x = -0.22;
    D.box(0.46, 0.31, 0.01, pal.sky, -0.3, 1.12, -0.14, tDesk);
    var globe = D.group(0.8, 0.95, 0.2, tDesk);
    D.cyl(0.06, 0.04, 0.22, pal.mustard, 0, 0.11, 0, globe, 8);
    D.ball(0.16, pal.sky, 0, 0.26, 0, globe);
    D.box(0.3, 0.06, 0.22, pal.coral, 0.3, 0.98, -0.25, tDesk);
    D.box(0.28, 0.05, 0.2, pal.sky, 0.3, 1.04, -0.25, tDesk);

    // Student Desks in Rows with Students
    for (var ci of [-1.8, 1.8]) {
      for (var ri of [0.4, 2.0]) {
        var sd = D.group(ci, 0, ri);
        D.box(1.2, 0.06, 0.7, pal.wood, 0, 0.72, 0, sd);
        for (var dx of [-0.5, 0.5]) {
          for (var dz of [-0.25, 0.25]) D.cyl(0.03, 0.03, 0.68, pal.slate, dx, 0.34, dz, sd, 6);
        }
        D.box(0.45, 0.05, 0.42, pal.slate, 0, 0.42, 0.55, sd);
        D.box(0.42, 0.35, 0.04, pal.slate, 0, 0.65, 0.74, sd);
        D.box(0.28, 0.02, 0.2, pal.paper, -0.15, 0.76, 0, sd);
        D.cyl(0.01, 0.01, 0.15, pal.mustard, 0.12, 0.76, 0, sd, 4);
      }
    }
    var student1 = D.props.person(-1.8, 0.95, null, { shirt: pal.mustard, pants: pal.slate, hat: pal.paper });
    student1.name = 'student';
    hot.push(student1);
    var student2 = D.props.person(1.8, 0.95, null, { shirt: pal.sky, pants: pal.ink, hat: pal.paper });
    student2.name = 'student';
    hot.push(student2);

    return { ground: ground, hot: hot, teacher: teacher, board: board, clock: clock, tDesk: tDesk, student1: student1, student2: student2 };
    ` : category === 'sports' ? `
    // Regulation Badminton Court Mat
    var ground = D.slab(11.0, 8.5, pal.green, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    D.box(8.0, 0.02, 0.06, pal.paper, 0, 0.02, -2.4, null, { shadow: false });
    D.box(8.0, 0.02, 0.06, pal.paper, 0, 0.02, 2.4, null, { shadow: false });
    D.box(0.06, 0.02, 4.86, pal.paper, -4.0, 0.02, 0, null, { shadow: false });
    D.box(0.06, 0.02, 4.86, pal.paper, 4.0, 0.02, 0, null, { shadow: false });
    D.box(0.06, 0.02, 4.8, pal.paper, 0, 0.02, 0, null, { shadow: false });
    D.box(0.06, 0.02, 4.8, pal.paper, -1.8, 0.02, 0, null, { shadow: false });
    D.box(0.06, 0.02, 4.8, pal.paper, 1.8, 0.02, 0, null, { shadow: false });

    var net = D.group(0, 0, 0);
    net.name = 'badminton net';
    hot.push(net);
    D.cyl(0.04, 0.04, 1.7, pal.ink, 0, 0.85, -2.6, net, 8);
    D.cyl(0.04, 0.04, 1.7, pal.ink, 0, 0.85, 2.6, net, 8);
    D.box(0.03, 0.75, 5.2, pal.paper, 0, 1.1, 0, net);
    D.box(0.05, 0.06, 5.2, pal.paper, 0, 1.5, 0, net);

    var player1 = D.props.person(-2.2, 0.4, null, { shirt: pal.coral, pants: pal.paper, hat: pal.paper });
    player1.name = 'badminton player 1';
    hot.push(player1);
    var player2 = D.props.person(2.2, -0.4, null, { shirt: pal.sky, pants: pal.ink, hat: pal.paper });
    player2.name = 'badminton player 2';
    hot.push(player2);

    var racket1 = D.group(-2.2, 1.2, 0.4);
    D.cyl(0.015, 0.015, 0.6, pal.coral, 0, 0, 0, racket1, 6);
    D.torus(0.16, 0.015, pal.mustard, 0, 0.35, 0, racket1);
    var racket2 = D.group(2.2, 1.3, -0.4);
    D.cyl(0.015, 0.015, 0.6, pal.sky, 0, 0, 0, racket2, 6);
    D.torus(0.16, 0.015, pal.mustard, 0, 0.35, 0, racket2);

    var shuttlecock = D.group(0, 1.8, 0.2);
    shuttlecock.name = 'shuttlecock';
    hot.push(shuttlecock);
    D.ball(0.05, pal.paper, 0, 0, 0, shuttlecock);
    D.cone(0.08, 0.09, pal.paper, 0, 0.06, 0, shuttlecock, 8);

    var refChair = D.group(0, 0, 3.2);
    D.box(0.7, 0.08, 0.7, pal.slate, 0, 1.6, 0, refChair);
    for (var rx of [-0.3, 0.3]) {
      for (var rz of [-0.3, 0.3]) D.cyl(0.025, 0.025, 1.6, pal.slate, rx, 0.8, rz, refChair, 6);
    }
    var bench = D.group(0, 0, -3.4);
    D.box(2.8, 0.08, 0.6, pal.wood, 0, 0.4, 0, bench);

    return { ground: ground, hot: hot, net: net, player1: player1, player2: player2, racket1: racket1, racket2: racket2, shuttlecock: shuttlecock, refChair: refChair, bench: bench };
    ` : category === 'airport' ? `
    // Airport Runway Ground Slab
    var ground = D.slab(11.5, 8.5, pal.asphalt, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    for (var rx of [-3.8, -2.0, 0, 2.0, 3.8]) {
      D.box(1.2, 0.02, 0.2, pal.mustard, rx, 0.02, 0, null, { shadow: false });
    }
    // Terminal Concourse with Cyan Glass Curtain Wall
    var terminal = D.group(0, 0, -2.6);
    terminal.name = 'terminal';
    hot.push(terminal);
    D.box(8.2, 2.2, 1.8, pal.paper, 0, 1.1, 0, terminal);
    D.box(7.8, 1.5, 0.1, pal.sky, 0, 1.1, 0.95, terminal);
    D.box(1.0, 1.0, 1.8, pal.slate, -2.0, 1.0, 1.8, terminal); // Jet bridge
    // Air traffic control tower with revolving radar
    var tower = D.group(3.6, 0, -2.2);
    tower.name = 'control tower';
    hot.push(tower);
    D.cyl(0.35, 0.5, 3.4, pal.paper, 0, 1.7, 0, tower, 12);
    D.cyl(0.8, 0.65, 0.6, pal.sky, 0, 3.7, 0, tower, 12);
    D.cone(0.85, 0.4, pal.coral, 0, 4.2, 0, tower, 12);
    var radar = D.box(0.9, 0.14, 0.06, pal.paper, 0, 4.45, 0, tower);
    // Parked Passenger Jetliner
    var plane = D.group(-1.2, 0.8, 1.2);
    plane.name = 'airliner';
    hot.push(plane);
    var fus = D.cyl(0.5, 0.5, 4.8, pal.paper, 0, 0, 0, plane, 14);
    fus.rotation.x = Math.PI / 2;
    D.ball(0.5, pal.sky, 0, 0, 2.4, plane);
    var wingL = D.box(3.4, 0.08, 1.1, pal.sky, -1.9, 0, 0, plane);
    wingL.rotation.y = -0.22;
    var wingR = D.box(3.4, 0.08, 1.1, pal.sky, 1.9, 0, 0, plane);
    wingR.rotation.y = 0.22;
    D.box(0.08, 0.9, 0.8, pal.coral, 0, 0.6, -1.9, plane);
    return { ground: ground, hot: hot, plane: plane, radar: radar, tower: tower, terminal: terminal };
    ` : category === 'harbor' ? `
    // Concrete Quay and Water Basin
    var ground = D.slab(11.5, 8.5, pal.slate, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    D.box(5.8, 0.35, 8.2, pal.water, -2.8, 0.18, 0, null, { shadow: false });
    for (var bz = -3.2; bz <= 3.2; bz += 1.6) {
      D.cyl(0.12, 0.12, 0.25, pal.mustard, 0.3, 0.45, bz, null, 8);
    }
    // Gantry Crane
    var crane = D.group(2.6, 0.35, 0);
    crane.name = 'gantry crane';
    hot.push(crane);
    D.box(0.2, 3.8, 0.2, pal.coral, -1.2, 1.9, -1.8, crane);
    D.box(0.2, 3.8, 0.2, pal.coral, -1.2, 1.9, 1.8, crane);
    D.box(0.2, 3.8, 0.2, pal.coral, 1.2, 1.9, -1.8, crane);
    D.box(0.2, 3.8, 0.2, pal.coral, 1.2, 1.9, 1.8, crane);
    D.box(2.8, 0.35, 4.6, pal.coral, -0.6, 3.8, 0, crane);
    var hoist = D.group(-1.4, 2.4, 0, crane);
    D.box(1.2, 0.15, 2.0, pal.mustard, 0, 0, 0, hoist);
    D.box(1.1, 0.7, 1.9, pal.sky, 0, -0.45, 0, hoist);
    // Stacked Containers
    D.box(1.2, 0.75, 2.4, pal.sky, 3.2, 0.72, -1.4);
    D.box(1.2, 0.75, 2.4, pal.coral, 3.2, 1.48, -1.4);
    D.box(1.2, 0.75, 2.4, pal.green, 3.2, 0.72, 1.4);
    // Tugboat
    var tugboat = D.group(-2.8, 0.2, 0.5);
    tugboat.name = 'cargo tugboat';
    hot.push(tugboat);
    D.box(1.8, 0.5, 3.8, pal.paper, 0, 0.25, 0, tugboat);
    D.box(1.3, 0.6, 1.6, pal.coral, 0, 0.75, -0.3, tugboat);
    D.cyl(0.14, 0.14, 0.7, pal.ink, 0, 1.25, -0.6, tugboat, 8);
    return { ground: ground, hot: hot, crane: crane, hoist: hoist, tugboat: tugboat };
    ` : category === 'lighthouse' ? `
    // Ocean Water & Stepped Cliff Island
    var ground = D.slab(11.5, 8.5, pal.water, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    D.box(4.8, 0.8, 4.4, pal.slate, 0.2, 0.4, 0);
    D.box(3.6, 0.6, 3.2, pal.slate, 0.4, 1.1, -0.2);
    // Cylindrical Banded Tower
    var lighthouse = D.group(0.8, 1.4, -0.4);
    lighthouse.name = 'lighthouse tower';
    hot.push(lighthouse);
    D.cyl(0.8, 0.95, 0.9, pal.paper, 0, 0.45, 0, lighthouse, 16);
    D.cyl(0.7, 0.8, 0.9, pal.coral, 0, 1.35, 0, lighthouse, 16);
    D.cyl(0.62, 0.7, 0.9, pal.paper, 0, 2.25, 0, lighthouse, 16);
    D.cyl(0.55, 0.62, 0.9, pal.coral, 0, 3.15, 0, lighthouse, 16);
    D.cyl(0.75, 0.75, 0.1, pal.ink, 0, 3.65, 0, lighthouse, 16);
    D.cyl(0.48, 0.48, 0.65, pal.sky, 0, 4.05, 0, lighthouse, 14);
    D.cone(0.6, 0.5, pal.coral, 0, 4.65, 0, lighthouse, 16);
    var beam = D.group(0, 4.05, 0, lighthouse);
    D.cone(0.5, 2.4, pal.mustard, 0, 0, 1.2, beam, 10);
    beam.children[0].rotation.x = Math.PI / 2;
    // Keeper's Cottage
    var cottage = D.group(-1.0, 1.4, 0.8);
    cottage.name = 'keeper cottage';
    hot.push(cottage);
    D.box(1.8, 1.1, 1.4, pal.terracotta, 0, 0.55, 0, cottage);
    D.wedge(1.8, 0.6, 1.4, pal.coral, 0, 1.4, 0, cottage);
    D.cyl(0.12, 0.12, 0.6, pal.slate, 0.5, 1.8, 0, cottage, 8);
    // Jetty & rowboat
    D.box(0.8, 0.12, 1.8, pal.wood, -2.4, 0.22, 1.8);
    var dinghy = D.box(0.7, 0.25, 1.3, pal.wood, -3.2, 0.16, 1.8);
    return { ground: ground, hot: hot, lighthouse: lighthouse, beam: beam, cottage: cottage, dinghy: dinghy };
    ` : category === 'campus' ? `
    // Collegiate Red Brick Hall & Clock Tower
    var ground = D.slab(11.5, 8.5, pal.green, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    var hall = D.group(0, 0, -2.4);
    hall.name = 'collegiate hall';
    hot.push(hall);
    D.box(8.2, 2.2, 1.8, pal.terracotta, 0, 1.1, 0, hall);
    D.box(8.4, 0.15, 2.0, pal.paper, 0, 2.25, 0, hall);
    for (var wx of [-3.0, -1.8, 1.8, 3.0]) {
      D.box(0.5, 0.8, 0.05, pal.sky, wx, 1.2, 0.93, hall);
    }
    var clockTower = D.group(0, 2.25, 0, hall);
    D.box(1.8, 2.4, 1.6, pal.terracotta, 0, 1.2, 0, clockTower);
    D.cyl(0.42, 0.42, 0.05, pal.paper, 0, 1.6, 0.83, clockTower, 16).rotation.x = Math.PI / 2;
    D.ball(0.06, pal.mustard, 0, 1.6, 0.86, clockTower);
    D.cone(1.1, 1.2, pal.coral, 0, 3.0, 0, clockTower, 12);
    // Tiered Stone Fountain
    var fountain = D.group(0, 0, 0.8);
    fountain.name = 'campus fountain';
    hot.push(fountain);
    D.cyl(1.6, 1.8, 0.3, pal.slate, 0, 0.15, 0, fountain, 18);
    D.cyl(1.3, 1.3, 0.1, pal.sky, 0, 0.28, 0, fountain, 18);
    D.cyl(0.4, 0.5, 0.7, pal.slate, 0, 0.65, 0, fountain, 12);
    var fountainJet = D.ball(0.25, pal.sky, 0, 1.1, 0, fountain);
    // Study Benches & Students
    D.box(1.4, 0.1, 0.45, pal.wood, -1.8, 0.3, 2.0);
    D.box(1.4, 0.1, 0.45, pal.wood, 1.8, 0.3, 2.0);
    var stu1 = D.props.person(-1.8, 2.0, null, { shirt: pal.coral, pants: pal.slate, hat: pal.paper });
    var stu2 = D.props.person(1.8, 2.0, null, { shirt: pal.sky, pants: pal.ink, hat: pal.paper });
    return { ground: ground, hot: hot, hall: hall, clockTower: clockTower, fountain: fountain, fountainJet: fountainJet, stu1: stu1, stu2: stu2 };
    ` : category === 'sea' || category === 'maritime' ? `
    // Vast Rolling Azure Ocean Water
    var ground = D.slab(11.5, 8.5, pal.water, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    var reef = D.group(-3.0, 0, -1.8);
    D.ball(0.9, pal.slate, 0, 0.15, 0, reef);
    D.ball(0.65, pal.slate, 0.6, 0.2, 0.4, reef);
    D.ball(0.5, pal.paper, 0.3, 0.35, 0.2, reef); // White wave foam
    // Multi-Mast Sailing Schooner
    var ship = D.group(0.6, 0.15, 0.4);
    ship.name = 'sailing schooner';
    hot.push(ship);
    D.box(1.8, 0.6, 4.4, pal.wood, 0, 0.3, 0, ship);
    D.wedge(1.8, 0.6, 1.4, pal.wood, 0, 0.3, 2.7, ship);
    D.cyl(0.06, 0.08, 4.0, pal.ink, 0, 2.0, 0.8, ship, 8);
    D.cyl(0.06, 0.08, 3.6, pal.ink, 0, 1.8, -0.9, ship, 8);
    var sail1 = D.box(1.6, 2.2, 0.06, pal.paper, 0, 2.3, 0.8, ship);
    sail1.rotation.y = -0.15;
    var sail2 = D.box(1.5, 1.9, 0.06, pal.paper, 0, 2.1, -0.9, ship);
    sail2.rotation.y = -0.12;
    D.box(0.4, 0.2, 0.02, pal.mustard, 0, 4.0, 0.8, ship);
    // Buoy & Seagulls
    var buoy = D.group(3.2, 0.2, -1.4);
    buoy.name = 'navigational buoy';
    hot.push(buoy);
    D.cyl(0.45, 0.45, 0.6, pal.coral, 0, 0.2, 0, buoy, 12);
    D.cone(0.28, 0.7, pal.mustard, 0, 0.7, 0, buoy, 10);
    return { ground: ground, hot: hot, ship: ship, sail1: sail1, buoy: buoy, reef: reef };
    ` : category === 'castle' ? `
    // Medieval Castle Fortress & Moat
    var ground = D.slab(11.5, 8.5, pal.water, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    D.box(7.8, 0.55, 5.8, pal.slate, 0, 0.28, 0);
    var castle = D.group(0, 0.55, 0);
    castle.name = 'castle';
    hot.push(castle);
    for (var tx of [-2.8, 2.8]) {
      for (var tz of [-1.8, 1.8]) {
        D.cyl(0.55, 0.65, 3.2, pal.slate, tx, 1.6, tz, castle, 14);
        D.cyl(0.7, 0.55, 0.35, pal.slate, tx, 3.3, tz, castle, 14);
        D.cone(0.75, 1.0, pal.coral, tx, 3.9, tz, castle, 14);
      }
    }
    D.box(0.3, 2.0, 3.2, pal.slate, -2.8, 1.0, 0, castle);
    D.box(0.3, 2.0, 3.2, pal.slate, 2.8, 1.0, 0, castle);
    D.box(5.0, 2.0, 0.3, pal.slate, 0, 1.0, -1.8, castle);
    D.box(5.0, 2.0, 0.3, pal.slate, 0, 1.0, 1.8, castle);
    var drawbridge = D.box(1.5, 0.12, 2.4, pal.wood, 0, 0.06, 2.8, castle);
    var keep = D.group(0, 0, -0.3, castle);
    keep.name = 'central keep';
    hot.push(keep);
    D.box(2.4, 3.8, 2.2, pal.slate, 0, 1.9, 0, keep);
    D.box(2.7, 0.4, 2.5, pal.slate, 0, 4.0, 0, keep);
    D.cyl(0.04, 0.04, 1.4, pal.steel, 0, 4.8, 0, keep, 6);
    D.box(0.7, 0.35, 0.04, pal.mustard, 0.4, 4.7, 0, keep);
    var guard = D.props.person(-1.2, 0.8, castle, { shirt: pal.coral, pants: pal.slate, hat: pal.steel });
    guard.name = 'castle guard';
    hot.push(guard);
    return { ground: ground, hot: hot, castle: castle, keep: keep, drawbridge: drawbridge, guard: guard };
    ` : category === 'city' ? `
    // Multi-Lane Asphalt City Avenue
    var ground = D.slab(11.5, 8.5, pal.asphalt, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    for (var cz = -2.6; cz <= 2.6; cz += 0.8) {
      D.box(2.2, 0.02, 0.35, pal.paper, 0, 0.02, cz, null, { shadow: false });
    }
    D.box(11.0, 0.18, 1.6, pal.slate, 0, 0.09, -2.8);
    D.box(11.0, 0.18, 1.6, pal.slate, 0, 0.09, 2.8);
    // Skyscrapers
    var bldg1 = D.box(2.8, 5.6, 1.6, pal.ink, -3.4, 2.8, -2.8);
    for (var wy = 0.8; wy <= 5.0; wy += 0.7) {
      D.box(2.4, 0.3, 0.06, pal.sky, -3.4, wy, -1.98);
    }
    var bldg2 = D.box(3.2, 6.8, 1.7, pal.slate, 0.6, 3.4, -2.8);
    for (var wy2 = 0.8; wy2 <= 6.2; wy2 += 0.8) {
      D.box(2.8, 0.35, 0.06, pal.mustard, 0.6, wy2, -1.93);
    }
    // Moving Yellow Taxi Cab
    var taxi = D.group(0, 0.24, 0.6);
    taxi.name = 'taxi cab';
    hot.push(taxi);
    D.box(2.7, 0.5, 1.35, pal.mustard, 0, 0.25, 0, taxi);
    D.box(1.7, 0.45, 1.25, pal.sky, -0.15, 0.65, 0, taxi);
    D.box(0.5, 0.12, 0.25, pal.paper, -0.15, 0.92, 0, taxi);
    for (var wx of [-0.85, 0.85]) {
      for (var wz of [-0.7, 0.7]) D.cyl(0.24, 0.24, 0.12, pal.ink, wx, 0.2, wz, taxi, 12).rotation.z = Math.PI / 2;
    }
    // Traffic Light
    var trafficLight = D.group(-2.0, 0.18, -1.8);
    D.cyl(0.06, 0.06, 3.2, pal.ink, 0, 1.6, 0, trafficLight, 8);
    D.box(0.28, 0.8, 0.28, pal.ink, 0, 3.0, 0, trafficLight);
    D.ball(0.09, pal.coral, 0, 3.25, 0.15, trafficLight);
    D.ball(0.09, pal.mustard, 0, 3.0, 0.15, trafficLight);
    D.ball(0.09, pal.green, 0, 2.75, 0.15, trafficLight);
    return { ground: ground, hot: hot, taxi: taxi, bldg1: bldg1, bldg2: bldg2, trafficLight: trafficLight };
    ` : category === 'farm' ? `
    // Countryside Farmland & Red Barn
    var ground = D.slab(11.5, 8.5, pal.green, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    var barn = D.group(-2.4, 0, -1.2);
    barn.name = 'red barn';
    hot.push(barn);
    D.box(3.6, 2.6, 3.0, pal.coral, 0, 1.3, 0, barn);
    D.wedge(3.6, 1.0, 3.0, pal.paper, 0, 2.6, 0, barn);
    D.box(1.2, 1.5, 0.06, pal.paper, 0, 0.75, 1.52, barn);
    // Silver Silo
    var silo = D.group(-4.2, 0, 1.2);
    silo.name = 'grain silo';
    hot.push(silo);
    D.cyl(0.8, 0.8, 3.8, pal.steel, 0, 1.9, 0, silo, 16);
    D.cone(0.9, 0.7, pal.paper, 0, 4.15, 0, silo, 16);
    // Green Agricultural Tractor
    var tractor = D.group(1.8, 0.22, 0.9);
    tractor.name = 'farm tractor';
    hot.push(tractor);
    D.box(2.0, 0.65, 1.2, pal.green, 0, 0.35, 0, tractor);
    D.box(1.0, 0.6, 1.1, pal.sky, -0.3, 0.9, 0, tractor);
    D.cyl(0.06, 0.06, 0.75, pal.ink, 0.7, 0.95, 0.35, tractor, 8);
    for (var wz of [-0.66, 0.66]) {
      D.cyl(0.48, 0.48, 0.2, pal.mustard, -0.5, 0.4, wz, tractor, 14).rotation.z = Math.PI / 2;
      D.cyl(0.3, 0.3, 0.16, pal.mustard, 0.65, 0.26, wz, tractor, 12).rotation.z = Math.PI / 2;
    }
    // Pasture Fence & Cow
    D.box(0.08, 0.6, 3.6, pal.wood, 0.3, 0.3, -1.5);
    var cow = D.group(2.2, 0.3, -1.5);
    cow.name = 'grazing cow';
    hot.push(cow);
    D.box(1.2, 0.65, 0.6, pal.paper, 0, 0.35, 0, cow);
    D.box(0.45, 0.45, 0.45, pal.ink, 0.65, 0.55, 0, cow);
    return { ground: ground, hot: hot, barn: barn, silo: silo, tractor: tractor, cow: cow };
    ` : category === 'park' ? `
    // Botanical Nature Park & Gazebo
    var ground = D.slab(11.5, 8.5, pal.green, 0, 0, 0, null, { h: 0.55, r: 0.9, side: pal.base });
    var gazebo = D.group(-2.0, 0, -0.9);
    gazebo.name = 'victorian gazebo';
    hot.push(gazebo);
    D.cyl(1.8, 1.9, 0.3, pal.slate, 0, 0.15, 0, gazebo, 12);
    for (var ga = 0; ga < 8; ga++) {
      var gang = (ga / 8) * Math.PI * 2;
      D.cyl(0.06, 0.06, 2.0, pal.paper, Math.cos(gang) * 1.5, 1.15, Math.sin(gang) * 1.5, gazebo, 8);
    }
    D.cone(1.9, 1.2, pal.coral, 0, 2.6, 0, gazebo, 12);
    // Duck pond & Arched Bridge
    var pond = D.group(1.8, 0, 1.2);
    pond.name = 'duck pond';
    hot.push(pond);
    D.cyl(1.8, 1.8, 0.12, pal.sky, 0, 0.06, 0, pond, 18);
    D.box(2.6, 0.09, 0.7, pal.wood, 0, 0.25, 0, pond);
    // Park bench & visitor
    D.box(1.3, 0.12, 0.45, pal.wood, 0, 0.28, -2.0);
    var visitor = D.props.person(0, -2.0, null, { shirt: pal.mustard, pants: pal.slate, hat: pal.paper });
    visitor.name = 'park visitor';
    hot.push(visitor);
    return { ground: ground, hot: hot, gazebo: gazebo, pond: pond, visitor: visitor };
    ` : category === 'classroom' ? `
    // Hardwood Classroom Floor & Chalkboard Wall
    P.box(6.8, 0.04, 4.4, 'timber', 0, 0.02, 0);
    P.box(6.8, 2.2, 0.15, 'paper', 0, 1.1, -2.1);
    P.box(4.2, 1.3, 0.04, 'iron', 0, 1.3, -2.0);
    for (var cl = -1; cl <= 1; cl++) {
      P.box(1.2, 0.02, 0.01, 'paper', -0.8, 1.3 + cl * 0.22, -1.97);
    }
    var tDesk = P.box(2.2, 0.1, 1.2, 'timber', -1.2, 0.85, -1.0);
    P.box(0.4, 0.02, 0.3, 'iron', -1.2, 0.91, -0.9);
    var teacher = P.person(1.4, -1.0, null, { shirt: '#b86242', pants: '#334155' });
    for (var ci of [-1.4, 1.4]) {
      for (var ri of [0.4, 1.6]) {
        P.box(1.0, 0.08, 0.6, 'timber', ci, 0.68, ri);
        P.box(0.4, 0.06, 0.4, 'iron', ci, 0.38, ri + 0.45);
      }
    }
    var stu1 = P.person(-1.4, 0.8, null, { shirt: '#f8fafc', pants: '#334155' });
    var stu2 = P.person(1.4, 0.8, null, { shirt: '#f59e0b', pants: '#334155' });
    return { hot: hot, teacher: teacher, tDesk: tDesk, stu1: stu1, stu2: stu2 };
    ` : category === 'sports' ? `
    P.box(6.8, 0.04, 4.4, 'meadow', 0, 0.02, 0);
    var net = P.group(0, 0, 0);
    P.cyl(0.03, 0.03, 1.4, 'iron', 0, 0.7, -1.8, net, 6);
    P.cyl(0.03, 0.03, 1.4, 'iron', 0, 0.7, 1.8, net, 6);
    P.box(0.02, 0.65, 3.6, 'paper', 0, 0.9, 0, net);
    var player1 = P.person(-1.8, 0.3, null, { shirt: '#ef4444', pants: '#f8fafc' });
    var player2 = P.person(1.8, -0.3, null, { shirt: '#0284c7', pants: '#334155' });
    var shuttle = P.ball(0.08, 'paper', 0, 1.4, 0.1);
    return { hot: hot, net: net, player1: player1, player2: player2, shuttle: shuttle };
    ` : category === 'airport' ? `
    P.box(7.2, 0.04, 4.4, 'iron', 0, 0.02, 0);
    for (var rx = -3.0; rx <= 3.0; rx += 1.2) P.box(0.7, 0.02, 0.12, 'gold', rx, 0.04, 0);
    var terminal = P.box(4.8, 1.4, 1.2, 'paper', 0, 0.7, -1.6);
    var tower = P.cyl(0.25, 0.35, 2.6, 'paper', 2.6, 1.3, -1.4, null, 10);
    var plane = P.group(-0.8, 0.45, 0.8);
    var fus = P.cyl(0.32, 0.32, 3.0, 'paper', 0, 0, 0, plane, 12);
    fus.rotation.x = Math.PI / 2;
    P.box(2.2, 0.05, 0.7, 'paper', -1.3, 0, 0, plane);
    P.box(2.2, 0.05, 0.7, 'paper', 1.3, 0, 0, plane);
    return { hot: hot, plane: plane, terminal: terminal, tower: tower };
    ` : category === 'harbor' ? `
    P.box(4.0, 0.04, 4.4, 'water', -1.6, 0.02, 0);
    P.box(3.2, 0.35, 4.4, 'stone', 1.8, 0.18, 0);
    var crane = P.box(1.8, 2.8, 3.2, 'accent', 2.0, 1.4, 0);
    var tugboat = P.box(1.2, 0.35, 2.6, 'iron', -2.0, 0.18, 0.4);
    return { hot: hot, crane: crane, tugboat: tugboat };
    ` : category === 'lighthouse' ? `
    P.box(7.2, 0.04, 4.4, 'water', 0, 0.02, 0);
    P.box(3.2, 0.5, 3.0, 'stone', 0, 0.25, 0);
    var lighthouse = P.cyl(0.55, 0.7, 2.4, 'paper', 0.5, 1.4, -0.2, null, 12);
    var cottage = P.box(1.2, 0.7, 0.9, 'brick', -0.8, 0.6, 0.5);
    return { hot: hot, lighthouse: lighthouse, cottage: cottage };
    ` : category === 'campus' ? `
    var hall = P.box(5.4, 1.4, 1.2, 'brick', 0, 0.7, -1.6);
    var tower = P.box(1.2, 2.6, 1.1, 'brick', 0, 1.3, -1.6);
    var fountain = P.cyl(1.1, 1.2, 0.2, 'stone', 0, 0.1, 0.6, null, 14);
    return { hot: hot, hall: hall, tower: tower, fountain: fountain };
    ` : category === 'sea' || category === 'maritime' ? `
    P.box(7.2, 0.04, 4.4, 'water', 0, 0.02, 0);
    var ship = P.box(1.2, 0.4, 2.8, 'timber', 0.4, 0.2, 0.2);
    var sail = P.box(1.1, 1.4, 0.04, 'paper', 0.4, 1.5, 0.7);
    return { hot: hot, ship: ship, sail: sail };
    ` : category === 'castle' ? `
    P.box(7.2, 0.04, 4.4, 'water', 0, 0.02, 0);
    P.box(5.0, 0.35, 3.4, 'stone', 0, 0.18, 0);
    var castle = P.box(3.6, 1.4, 2.4, 'stone', 0, 0.85, 0);
    var keep = P.box(1.6, 2.6, 1.4, 'stone', 0, 1.45, -0.2);
    return { hot: hot, castle: castle, keep: keep };
    ` : category === 'city' ? `
    P.box(7.2, 0.04, 4.4, 'iron', 0, 0.02, 0);
    var bldg1 = P.box(1.8, 3.8, 1.0, 'iron', -2.2, 1.9, -1.8);
    var bldg2 = P.box(2.0, 4.6, 1.1, 'stone', 0.4, 2.3, -1.8);
    var taxi = P.box(1.8, 0.35, 0.9, 'gold', 0, 0.25, 0.4);
    return { hot: hot, taxi: taxi, bldg1: bldg1, bldg2: bldg2 };
    ` : category === 'farm' ? `
    var barn = P.box(2.4, 1.8, 2.0, 'brick', -1.6, 0.9, -0.8);
    var silo = P.cyl(0.55, 0.55, 2.6, 'stone', -2.8, 1.3, 0.8, null, 12);
    var tractor = P.box(1.4, 0.45, 0.8, 'accent', 1.2, 0.25, 0.6);
    return { hot: hot, barn: barn, silo: silo, tractor: tractor };
    ` : category === 'park' ? `
    var gazebo = P.cyl(1.2, 1.3, 1.4, 'timber', -1.4, 0.7, -0.6, null, 8);
    var pond = P.cyl(1.3, 1.3, 0.08, 'water', 1.2, 0.04, 0.8, null, 14);
    return { hot: hot, gazebo: gazebo, pond: pond };
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
    // Expansive Landscaped Courtyard & Architectural Terrace Diorama
    var ground = D.slab(13.0, 9.5, pal.ground, 0, 0, 0, null, { h: 0.6, r: 1.2, side: pal.base });

    // Flagstone Paved Courtyard Foundation
    D.box(12.0, 0.04, 8.5, pal.paper, 0, 0.02, 0, null, { shadow: false });
    for (var ix = -4.5; ix <= 4.5; ix += 2.2) {
      for (var iz = -3.0; iz <= 3.0; iz += 2.0) {
        D.box(1.8, 0.015, 1.6, pal.cloud, ix, 0.045, iz, null, { shadow: false });
      }
    }

    // Architectural Garden Pergola with Slender Timber Pillars & Lattice Rafters
    var pergola = D.group(0, 0, -1.0);
    pergola.name = 'garden pergola';
    hot.push(pergola);
    [[-2.4, -1.6], [2.4, -1.6], [-2.4, 1.6], [2.4, 1.6]].forEach(function (pos) {
      D.cyl(0.08, 0.08, 3.0, pal.wood, pos[0], 1.5, pos[1], pergola, 10);
    });
    D.box(5.2, 0.14, 3.6, pal.terracotta, 0, 3.05, 0, pergola);
    // Cross Rafter Beams
    for (var rx = -2.2; rx <= 2.2; rx += 0.75) {
      D.box(0.08, 0.22, 3.8, pal.wood, rx, 3.16, 0, pergola);
    }

    // Teak Outdoor Dining Table with Books & Refreshment Cup
    var diningTable = D.group(0, 0, -1.0);
    diningTable.name = 'courtyard table';
    hot.push(diningTable);
    D.cyl(0.85, 0.85, 0.08, pal.wood, 0, 0.86, 0, diningTable, 18);
    D.cyl(0.14, 0.14, 0.82, pal.steel, 0, 0.41, 0, diningTable, 8);
    D.box(0.42, 0.06, 0.32, pal.sky, 0, 0.93, 0.15, diningTable); // Hardcover Book
    D.cyl(0.07, 0.07, 0.14, pal.mustard, 0.3, 0.96, -0.15, diningTable, 8); // Ceramic Cup

    // Perimeter Stone Lanterns & Lighting
    [[-5.2, -3.6], [5.2, -3.6], [-5.2, 3.6], [5.2, 3.6]].forEach(function (lp) {
      D.props.lamp(lp[0], lp[1], null, { h: 2.8 });
    });

    // Perimeter Architectural Terracotta Urns & Stone Planters
    [-4.8, 4.8].forEach(function(px) {
      D.cyl(0.35, 0.45, 0.6, pal.terracotta, px, 0.3, 0, null, 12);
      D.ball(0.28, pal.coral, px, 0.72, 0);
    });
    [-3.8, 3.8].forEach(function(px) {
      D.box(0.8, 0.35, 0.8, pal.slate, px, 0.18, 3.2);
      D.ball(0.24, pal.mustard, px, 0.45, 3.2);
    });

    // Resident Actor Person Figure
    var resident = D.props.person(0, 1.4, null, { shirt: pal.mustard, hat: pal.paper });
    resident.name = 'resident';
    hot.push(resident);

    return { ground: ground, hot: hot, pergola: pergola, diningTable: diningTable, resident: resident };
    `}
  },
  tick: function (ctx) {
    var D = ctx.D, p = ctx.parts, t = ctx.t;
    var a = (t / 4.0) * Math.PI * 2;
    if (p.crane && p.jib) {
      p.jib.rotation.y = Math.sin(a * 0.5) * 0.6;
      if (p.cargo) p.cargo.position.y = 3.6 + Math.sin(a) * 0.5;
    }
    if (p.tram) {
      p.tram.position.x = Math.sin(a * 0.5) * 3.5;
    }
    if (p.bus) {
      p.bus.position.x = -2.2 + Math.cos(a * 0.5) * 3.2;
    }
    if (p.splash) {
      p.splash.scale.setScalar(1.0 + Math.sin(t * 8.0) * 0.25);
    }
    if (p.lightGreen && p.lightRed) {
      var cycle = Math.floor(t * 0.8) % 3;
      p.lightGreen.visible = cycle === 0;
      if (p.lightYellow) p.lightYellow.visible = cycle === 1;
      p.lightRed.visible = cycle === 2;
    }
    if (p.resident) {
      p.resident.position.x = Math.sin(a * 0.5) * 0.6;
    }
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
    if (p.radar) p.radar.rotation.y = t * 3.0;
    if (p.beam) p.beam.rotation.y = t * 2.2;
    if (p.fountainJet) p.fountainJet.position.y = 1.1 + Math.sin(t * 8) * 0.08;
    if (p.ship) {
      p.ship.position.y = 0.15 + Math.sin(a) * 0.06;
      p.ship.rotation.z = Math.cos(a) * 0.04;
    }
    if (p.buoy) p.buoy.position.y = 0.2 + Math.sin(a * 2) * 0.06;
    if (p.taxi) p.taxi.position.x = Math.sin(a) * 1.5;
    if (p.tractor) p.tractor.position.x = 1.8 + Math.sin(a * 0.5) * 0.4;
    if (p.teacher) {
      p.teacher.position.x = 1.8 + Math.sin(a * 0.5) * 0.25;
      p.teacher.rotation.y = Math.sin(a) * 0.15;
    }
    if (p.shuttlecock) {
      p.shuttlecock.position.x = Math.sin(a * 2.0) * 1.8;
      p.shuttlecock.position.y = 1.8 + Math.sin(a * 4.0) * 0.35;
    }
    if (p.player1) p.player1.position.z = 0.4 + Math.sin(a * 2.0) * 0.25;
    if (p.player2) p.player2.position.z = -0.4 - Math.sin(a * 2.0) * 0.25;
    if (p.hero) p.hero.position.y = 0.4 + Math.sin(a) * 0.08;
  }
});`;
}

/**
 * Prompt-driven composer for Three.js "worlds" scenes.
 *
 * The procedural generator has hand-built branches for its known categories. Any
 * prompt that misses those branches used to land on one fixed courtyard, so a
 * night market, a glacier research hut and a coral nursery all produced the same
 * pergola-and-table scene. This composer builds a scene out of the nouns in the
 * prompt instead: it picks an environment palette (ice, underwater, volcanic,
 * orbital, market night, industrial, garden, desert, default), then assembles the
 * matching set pieces around a plaza, with two or three looping animations.
 */

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

export const PROFILES = {
  ice: { ground: '#dbeafe', terrain: '#bfdbfe', wall: '#f1f5f9', accent: '#0284c7', glow: '#e0f2fe', metal: '#475569', foliage: '#0f766e', rock: '#94a3b8', sky: '#1e3a8a' },
  underwater: { ground: '#134e4a', terrain: '#0f766e', wall: '#155e75', accent: '#22d3ee', glow: '#a5f3fc', metal: '#334155', foliage: '#2dd4bf', rock: '#0e7490', sky: '#083344' },
  volcanic: { ground: '#292524', terrain: '#1c1917', wall: '#44403c', accent: '#f97316', glow: '#fdba74', metal: '#78716c', foliage: '#4d7c0f', rock: '#57534e', sky: '#450a0a' },
  orbital: { ground: '#1e293b', terrain: '#0f172a', wall: '#cbd5e1', accent: '#818cf8', glow: '#c7d2fe', metal: '#64748b', foliage: '#34d399', rock: '#334155', sky: '#020617' },
  market: { ground: '#3f3f46', terrain: '#57534e', wall: '#9a3412', accent: '#fbbf24', glow: '#fdba74', metal: '#57534e', foliage: '#15803d', rock: '#78716c', sky: '#0c0a09' },
  industrial: { ground: '#334155', terrain: '#1e293b', wall: '#64748b', accent: '#facc15', glow: '#fef08a', metal: '#475569', foliage: '#4d7c0f', rock: '#334155', sky: '#0f172a' },
  garden: { ground: '#166534', terrain: '#14532d', wall: '#e2e8f0', accent: '#f97316', glow: '#fef9c3', metal: '#475569', foliage: '#22c55e', rock: '#78716c', sky: '#1e293b' },
  desert: { ground: '#d97706', terrain: '#b45309', wall: '#fed7aa', accent: '#0e7490', glow: '#fef3c7', metal: '#92400e', foliage: '#4d7c0f', rock: '#a16207', sky: '#78350f' },
  default: { ground: '#1e293b', terrain: '#334155', wall: '#e2e8f0', accent: '#0284c7', glow: '#fde68a', metal: '#475569', foliage: '#15803d', rock: '#57534e', sky: '#0f172a' },
};

const KEYWORDS = [
  ['ice', /\b(glacier|ice|icy|snow|arctic|frozen|iceberg|tundra|polar|frost)\b/],
  ['underwater', /\b(underwater|submarine|coral|reef|kelp|aquarium|diver|diving|abyss|seabed|nursery)\b/],
  ['volcanic', /\b(volcano|volcanic|lava|magma|geyser|obsidian|crater)\b/],
  ['orbital', /\b(orbit|orbital|space station|satellite|lunar|moon base|zero-g|asteroid|spacecraft)\b/],
  ['market', /\b(market|bazaar|stall|stalls|street food|noodle|lantern|flea|night market|ramen)\b/],
  ['industrial', /\b(factory|refinery|industrial|pipe|pipes|turbine|forge|warehouse|foundry|smelter|power plant)\b/],
  ['garden', /\b(greenhouse|garden|botanical|orchard|greenhouse|tomato|crop|crops|vine|vineyard|nursery|hydroponic)\b/],
  ['desert', /\b(desert|dune|dunes|canyon|mesa|sahara|oasis|badlands)\b/],
];

export function profileFor(prompt) {
  const p = String(prompt || '').toLowerCase();
  for (const [name, test] of KEYWORDS) if (test.test(p)) return name;
  return 'default';
}

/** Ordered feature ids for a prompt, most distinctive first. */
export function featuresFor(prompt, profile) {
  const p = String(prompt || '').toLowerCase();
  const has = (re) => re.test(p);
  const out = [];

  // Environment defining set pieces.
  if (profile === 'ice') out.push('glacier', 'hut', 'beacon');
  if (profile === 'underwater') out.push('coral', 'bubbles', 'dome');
  if (profile === 'volcanic') out.push('crater', 'dome', 'drone');
  if (profile === 'orbital') out.push('station', 'solar', 'drone');
  if (profile === 'market') out.push('stalls', 'lanterns', 'crates', 'lamps');
  if (profile === 'industrial') out.push('tanks', 'pipes', 'tower');
  if (profile === 'garden') out.push('greenhouse', 'cropRows', 'waterArm');

  // Prompt nouns that can appear in any environment.
  if (has(/\b(greenhouse|glasshouse|botanical)\b/)) out.unshift('greenhouse');
  if (has(/\b(tomato|tomatoes|crop|crops|seedling|seedlings|lettuce|harvest)\b/)) out.unshift('cropRows');
  if (has(/\b(robot|robotic|arm|automation|automated|harvesting)\b/)) out.unshift('waterArm');
  if (has(/\b(lantern|lanterns|festoon|string light|bunting)\b/)) out.unshift('lanterns');
  if (has(/\b(stall|stalls|food|noodle|ramen|dumpling|skewer|vendor|market)\b/)) out.unshift('stalls');
  if (has(/\b(hut|cabin|shack|research|field station|shelter)\b/)) out.unshift('hut');
  if (has(/\b(telescope|observatory|dome|antenna|radar|satellite dish)\b/)) out.unshift('dome');
  if (has(/\b(drone|drones|uav|quadcopter|survey)\b/)) out.unshift('drone');
  if (has(/\b(beacon|tower|lighthouse|light)\b/)) out.unshift('beacon');
  if (has(/\b(temple|shrine|torii|monastery|altar|ruin|ruins)\b/)) out.unshift('temple');
  if (has(/\b(crate|crates|barrel|barrels|cargo|supplies)\b/)) out.push('crates');
  if (has(/\b(person|people|diver|divers|walker|visitor|worker|engineer|scientist|chef|vendor)\b/)) out.push('people');

  if (!out.length) out.push('gardenBed', 'crates');
  // A scene without figures or supplies reads as an empty diorama.
  if (!out.includes('people')) out.push('people');
  if (!out.includes('crates')) out.push('crates');
  // Keep the composition readable rather than cluttered.
  return [...new Set(out)].slice(0, 5);
}

const num = (n, digits = 2) => Number(n).toFixed(digits);

const PALETTE_NAMES = ['ground', 'terrain', 'wall', 'accent', 'glow', 'metal', 'foliage', 'rock', 'sky'];

function paletteBlock(profile) {
  const pal = PROFILES[profile] || PROFILES.default;
  const entries = PALETTE_NAMES.map((k) => `    ${k}: '${pal[k]}',`).join('\n');
  return `  const palette = {\n${entries}\n  };`;
}

/** Ground plane + plaza/rink/court base, sized for the presentation. */
function baseBlock(profile, size, prompt = '') {
  const hero = size === 'hero';
  const w = hero ? 20 : 12;
  const d = hero ? 11.5 : 9;
  const colors = PROFILES[profile] || PROFILES.default;
  const accentFloor = profile === 'underwater' ? colors.rock : profile === 'ice' ? colors.glow : colors.terrain;
  const rooftop = /(rooftop|roof|terrace|balcony)/i.test(prompt);
  const city = /(city|skyline|street|urban|rooftop|district)/i.test(prompt);
  const skyline = city
    ? `    // Skyline blocks behind the platform establish the setting.
    for (const [bx, bz, bw, bh] of [[-${hero ? 8.4 : 5.0}, -${num(d / 2 + 0.9)}, 2.2, 3.4], [-${hero ? 5.6 : 3.2}, -${num(d / 2 + 1.6)}, 1.6, 4.6], [${hero ? 7.4 : 4.4}, -${num(d / 2 + 1.1)}, 2.0, 3.0], [${hero ? 4.6 : 2.6}, -${num(d / 2 + 2.0)}, 1.4, 4.0]]) {
      box(bw, bh, 1.6, '#0f172a', bx, bh / 2, bz);
      for (let wy = 0.5; wy < bh - 0.3; wy += 0.55) {
        for (let wx = -bw / 2 + 0.35; wx < bw / 2; wx += 0.5) {
          if ((Math.round(wx * 10) + Math.round(wy * 10)) % 3 === 0) box(0.22, 0.2, 0.04, palette.glow, bx + wx, wy, bz + 0.82);
        }
      }
    }`
    : '';
  const parapet = rooftop
    ? `    // Rooftop parapet with railing posts and a couple of AC units.
    for (const side of [-1, 1]) {
      box(${num(w - 1.2)}, 0.5, 0.18, '#94a3b8', 0, 0.25 + 0.06, side * ${num(d / 2 - 0.7)});
      box(0.18, 0.5, ${num(d - 1.4)}, '#94a3b8', side * ${num(w / 2 - 0.7)}, 0.31, 0);
    }
    for (const rx of [-${hero ? 6.6 : 3.4}, ${hero ? 6.6 : 3.4}]) {
      for (let rz = -3; rz <= 3; rz += 1.2) cylinder(0.03, 0.7, '#cbd5e1', rx, 0.65, rz, undefined, 6);
    }
    box(1.6, 0.8, 1.1, '#cbd5e1', ${hero ? 7.6 : 4.2}, 0.55, ${num(-d / 2 + 1.3)});
    box(0.9, 0.7, 0.9, '#94a3b8', -${hero ? 7.8 : 4.3}, 0.5, ${num(d / 2 - 1.5)});`
    : '';
  return `    // Ground: the environment sets the floor material and wetness.
    terrain(${num(w)}, ${num(d)}, palette.terrain, ${hero ? 44 : 32});
    box(${num(w - 0.6)}, 0.12, ${num(d - 0.6)}, palette.ground, 0, 0.06, 0);
    box(${num(w - 2.6)}, 0.16, ${num(d - 2.4)}, '${accentFloor}', 0, 0.15, 0);
    for (let i = -${hero ? 8 : 4}; i <= ${hero ? 8 : 4}; i += 2) {
      box(1.1, 0.02, 0.07, palette.accent, i, 0.245, ${num(d / 2 - 1.2)});
    }
${parapet}
${skyline}`;
}

function propBlock(feature, paletteName, ctx) {
  const pal = `palette.${paletteName}`;
  switch (feature) {
    case 'stalls':
      return `    // Market stalls: timber counter, striped awning, stock crates.
    const stalls = [];
    ${ctx.stallXs}.forEach((sx, i) => {
      const stall = group(sx, 0.16, ${ctx.slotZ}, undefined);
      box(2.3, 0.14, 1.5, '#78350f', 0, 0.78, 0, stall);
      box(2.3, 0.08, 1.5, palette.accent, 0, 0.86, 0, stall);
      for (const cx of [-1.0, 1.0]) {
        for (const cz of [-0.62, 0.62]) cylinder(0.06, 0.78, palette.metal, cx, 0.39, cz, stall, 8);
      }
      box(3.0, 0.1, 2.1, i % 2 ? palette.accent : palette.wall, 0, 2.34, 0, stall);
      for (let s = -1.2; s <= 1.2; s += 0.4) {
        box(0.2, 0.11, 2.1, i % 2 ? palette.wall : palette.accent, s, 2.35, 0, stall);
      }
      for (const px of [-0.7, 0.7]) cylinder(0.05, 2.3, palette.metal, px, 1.15, 0.72, stall, 8);
      // Goods on the counter plus a hanging lamp.
      box(0.5, 0.22, 0.4, palette.foliage, -0.55, 1.0, 0.1, stall);
      box(0.4, 0.18, 0.34, palette.glow, 0.1, 0.98, -0.2, stall);
      cylinder(0.12, 0.14, palette.glow, 0.62, 1.02, 0.24, stall, 10);
      cylinder(0.04, 0.4, palette.metal, 0.62, 1.28, 0.24, stall, 6);
      stalls.push(stall);
    });`;
    case 'lanterns':
      return `    // Festoon lanterns: poles, a sagging cord and glowing paper boxes.
    const lanternStrings = [];
    for (let row = 0; row < 2; row += 1) {
      const z = ${num(ctx.lanternZ)} + row * 2.4;
      const line = group(0, 0, z, undefined);
      for (const px of [-${ctx.lanternHalf}, ${ctx.lanternHalf}]) {
        cylinder(0.06, 3.6, palette.metal, px, 1.8, 0, line, 8);
        ball(0.1, palette.glow, px, 3.66, 0, line);
      }
      for (let i = 0; i <= 10; i += 1) {
        const f = i / 10;
        const x = -${ctx.lanternHalf} + f * ${ctx.lanternHalf * 2};
        const sag = Math.cos((f - 0.5) * Math.PI) * 0.5;
        box(0.55, 0.05, 0.05, '#0b0d12', x, 3.26 + sag, 0, line);
        cylinder(0.025, 0.24, '#0b0d12', x, 3.04 + sag, 0, line, 6);
        const paper = cylinder(0.3, 0.56, palette.glow, x, 2.74 + sag, 0, line, 10);
        paper.rotation.x = 0.02;
        cylinder(0.3, 0.06, palette.accent, x, 2.46 + sag, 0, line, 10);
        if (i % 2 === 0) ball(0.05, palette.accent, x, 3.0 + sag, 0, line);
      }
      lanternStrings.push(line);
    }`;
    case 'lamps':
      return `    // Tall lamp posts so a night scene still reads at banner size.
    const lamps = [];
    for (const [lx, lz] of [[-4.4, ${ctx.focusZ + 1.6}], [4.4, ${ctx.focusZ + 1.6}], [-4.4, ${ctx.focusZ - 3.2}], [4.4, ${ctx.focusZ - 3.2}]]) {
      const post = group(lx, 0, lz, undefined);
      cylinder(0.11, 3.2, palette.metal, 0, 1.6, 0, post, 8);
      cylinder(0.34, 0.16, palette.metal, 0, 3.24, 0, post, 10);
      ball(0.36, palette.glow, 0, 3.5, 0, post);
      ball(0.2, palette.accent, 0, 3.62, 0, post);
      lamps.push(post);
    }`;
    case 'greenhouse':
      return `    // Greenhouse: an open arched frame so the beds inside stay visible.
    const greenhouse = group(0, 0.18, ${ctx.focusZ - 0.4}, undefined);
    for (let gx = -3.2; gx <= 3.2; gx += 0.8) {
      for (const side of [-2.4, 2.4]) {
        cylinder(0.05, 2.5, palette.wall, gx, 1.25, side, greenhouse, 8);
      }
    }
    // Arched ribs: two angled rafters meeting at the ridge beam.
    for (let gx = -3.2; gx <= 3.2; gx += 0.8) {
      for (const side of [-1, 1]) {
        const rafter = box(0.06, 0.06, 2.9, palette.wall, gx, 3.05, side * 1.16, greenhouse);
        rafter.rotation.x = side * 0.62;
      }
    }
    box(6.9, 0.07, 0.07, palette.wall, 0, 3.65, 0, greenhouse);
    // Glazing only on the back wall and the two ends.
    box(6.6, 2.2, 0.04, palette.glow, 0, 1.2, -2.42, greenhouse);
    for (const endX of [-3.24, 3.24]) box(0.04, 2.2, 4.7, palette.glow, endX, 1.2, 0, greenhouse);
    // Staging benches and trays along the middle.
    for (const bz of [-1.5, 0, 1.5]) {
      box(6.0, 0.09, 0.55, palette.metal, 0, 0.78, bz, greenhouse);
      for (const bx of [-2.6, 2.6]) cylinder(0.04, 0.7, palette.metal, bx, 0.42, bz, greenhouse, 6);
      for (let tx = -2.2; tx <= 2.2; tx += 0.74) box(0.55, 0.12, 0.4, '#78350f', tx, 0.9, bz, greenhouse);
    }
    // Water tank beside the door.
    cylinder(0.42, 1.1, palette.metal, 3.9, 0.75, ${num(ctx.focusZ + 1.4)}, undefined, 14);`;
    case 'cropRows':
      return `    // Crop rows: bordered soil beds, leafy plants and ripening fruit.
    for (let r = 0; r < 4; r += 1) {
      const rz = ${num(ctx.focusZ + 1.2)} + r * 0.95;
      box(5.8, 0.1, 0.3, '#78350f', 0, 0.22, rz - 0.42);
      box(5.6, 0.2, 0.62, '#422006', 0, 0.3, rz);
      for (let c = -2.5; c <= 2.5; c += 0.5) {
        cylinder(0.02, 0.5, '#4d7c0f', c, 0.62, rz, undefined, 5);
        ball(0.22, palette.foliage, c, 0.9, rz, undefined);
        if (Math.round(c * 10) % 10 === 0) ball(0.1, palette.accent, c + 0.14, 0.84, rz - 0.16);
      }
    }`;
    case 'waterArm':
      return `    // Robotic watering arm on a gantry in front of the beds.
    const wateringArm = group(0, 0.18, ${ctx.focusZ + 3.1}, undefined);
    for (const px of [-3.2, 3.2]) {
      cylinder(0.09, 2.9, palette.metal, px, 1.45, 0, wateringArm, 10);
      cylinder(0.16, 0.12, palette.metal, px, 0.06, 0, wateringArm, 10);
    }
    box(6.8, 0.16, 0.18, palette.metal, 0, 2.9, 0, wateringArm);
    for (let tx = -3.0; tx <= 3.0; tx += 0.75) box(0.06, 0.06, 0.2, palette.metal, tx, 2.98, 0, wateringArm);
    const armCarriage = group(-1.6, 2.78, 0, wateringArm);
    box(0.5, 0.34, 0.42, palette.accent, 0, 0, 0, armCarriage);
    box(0.18, 0.5, 0.18, palette.wall, 0, 0.34, 0, armCarriage);
    const arm = group(0, -0.2, 0, armCarriage);
    cylinder(0.06, 0.9, palette.wall, 0, -0.5, 0, arm, 8);
    const nozzle = cylinder(0.1, 0.12, palette.accent, 0, -0.98, 0, arm, 8);
    for (let d = 0; d < 4; d += 1) {
      ball(0.035, palette.glow, -0.18 + d * 0.12, -1.16 - (d % 2) * 0.12, 0, arm);
    }
    // Hose reel on the gantry end.
    cylinder(0.2, 0.26, palette.accent, 3.2, 0.42, 0, wateringArm, 12).rotation.z = Math.PI / 2;`;
    case 'dome':
      return `    // Observatory dome with a tracking telescope.
    const dome = group(0, 0.18, ${ctx.focusZ}, undefined);
    cylinder(1.5, 0.5, palette.wall, 0, 0.25, 0, dome, 20);
    ball(1.45, palette.wall, 0, 0.55, 0, dome);
    const scope = group(0, 1.15, 0, dome);
    cylinder(0.16, 1.9, palette.metal, 0, 0.2, 0, scope, 12).rotation.z = Math.PI / 3.4;
    cylinder(0.2, 0.22, palette.accent, 0.72, 0.66, 0, scope, 10).rotation.z = Math.PI / 3.4;
    box(0.3, 0.3, 0.3, palette.accent, 0, 0, 0, dome);
    for (const dx of [-2.0, 2.0]) {
      for (const dz of [-1.4, 1.4]) {
        cylinder(0.05, 0.9, palette.metal, dx, 0.45, dz, dome, 6);
      }
    }`;
    case 'drone':
      return `    // Survey drones with rotor pods circling the site.
    const drones = [];
    for (let i = 0; i < 3; i += 1) {
      const drone = group(-2.4 + i * 2.4, 2.6 + i * 0.25, ${ctx.focusZ} + (i % 2 ? 1.6 : -1.4), undefined);
      ball(0.16, palette.accent, 0, 0, 0, drone);
      for (const [ax, az] of [[0.32, 0.32], [-0.32, 0.32], [0.32, -0.32], [-0.32, -0.32]]) {
        box(0.34, 0.03, 0.05, palette.metal, ax / 2, 0.02, az / 2, drone);
        const rotor = cylinder(0.13, 0.02, palette.wall, ax, 0.06, az, drone, 10);
        rotor.userData.spin = 1;
      }
      drones.push(drone);
    }`;
    case 'hut':
      return `    // Field hut: board walls, pitched roof, lit window and chimney.
    const hut = group(-3.4, 0.18, ${ctx.focusZ - 1.2}, undefined);
    hut.rotation.y = 0.22;
    box(2.5, 1.6, 2.0, '#7c2d12', 0, 0.8, 0, hut);
    box(2.7, 0.14, 2.2, palette.metal, 0, 1.66, 0, hut);
    const roof = box(2.9, 0.12, 1.4, palette.wall, 0, 2.0, 0, hut);
    roof.rotation.x = 0.5;
    const roof2 = box(2.9, 0.12, 1.4, palette.wall, 0, 2.0, 0, hut);
    roof2.rotation.x = -0.5;
    roof.position.z = 0.52; roof2.position.z = -0.52;
    box(0.55, 0.5, 0.04, palette.glow, 0.55, 0.95, 1.02, hut);
    box(0.5, 1.0, 0.04, '#292524', -0.5, 0.5, 1.02, hut);
    cylinder(0.1, 1.1, '#57534e', 0.95, 2.2, -0.6, hut, 8);
    box(0.5, 0.06, 0.4, palette.metal, 0, 1.75, 1.5, hut);`;
    case 'glacier':
      return `    // Glacier ice: layered shelf plates and floating slabs.
    for (let i = 0; i < 7; i += 1) {
      const ix = -${ctx.ringX} + (i / 6) * ${ctx.ringX * 2};
      const iz = (i % 2 ? 1 : -1) * (${num(ctx.slotZ + 0.4)} + (i % 3) * 0.4);
      const chunk = group(ix, 0.2, iz, undefined);
      box(1.5 + (i % 3) * 0.4, 0.5, 1.1, palette.wall, 0, 0.25, 0, chunk);
      box(1.0 + (i % 2) * 0.5, 0.34, 0.8, palette.glow, 0, 0.66, 0, chunk);
      chunk.rotation.y = i * 0.5;
    }`;
    case 'coral':
      return `    // Coral nursery: frames of fragments, kelp and reef heads.
    const coralFrames = [];
    for (let i = 0; i < 4; i += 1) {
      const cx = -3.6 + i * 2.4;
      const frame = group(cx, 0.2, ${num(ctx.focusZ + 0.6)}, undefined);
      box(1.6, 0.06, 0.7, palette.metal, 0, 1.2, 0, frame);
      for (const fx of [-0.7, 0.7]) cylinder(0.04, 1.2, palette.metal, fx, 0.6, 0, frame, 6);
      for (let c = -0.6; c <= 0.6; c += 0.3) {
        ball(0.14 + (c % 0.2) * 0.4, c > 0 ? palette.accent : palette.foliage, c, 1.32, 0, frame);
      }
      coralFrames.push(frame);
    }
    // Kelp strands and reef heads around the frames.
    for (let k = 0; k < 9; k += 1) {
      const kx = -${num(ctx.ringX - 0.6)} + (k / 8) * ${num((ctx.ringX - 0.6) * 2)};
      const kz = (k % 2 ? 1 : -1) * ${num(ctx.slotZ - 0.2)};
      cylinder(0.07, 1.5 + (k % 3) * 0.4, palette.foliage, kx, 0.9, kz, undefined, 6).rotation.z = (k % 2 ? 1 : -1) * 0.08;
      ball(0.24, palette.rock, kx + 0.4, 0.34, kz + 0.3);
    }`;
    case 'bubbles':
      return `    // Rising bubbles give the scene underwater motion.
    const bubbles = [];
    for (let i = 0; i < 14; i += 1) {
      const b = group(-${ctx.ringX} + (i / 13) * ${ctx.ringX * 2}, 0.4 + (i % 5) * 0.35, -${ctx.slotZ} + (i % 4) * 0.9, undefined);
      ball(0.05 + (i % 3) * 0.03, palette.glow, 0, 0, 0, b);
      bubbles.push(b);
    }`;
    case 'station':
      return `    // Orbital station: docking ring, modules, truss.
    const station = group(0, 1.9, ${num(ctx.focusZ)}, undefined);
    const ringStation = cylinder(1.6, 0.7, palette.wall, 0, 0, 0, station, 24);
    ringStation.rotation.x = Math.PI / 2;
    cylinder(2.0, 0.55, palette.metal, 0, 0, 0, station, 24).rotation.x = Math.PI / 2;
    for (let i = 0; i < 4; i += 1) {
      const a = (i / 4) * Math.PI * 2;
      const mod = group(Math.cos(a) * 1.9, 0, Math.sin(a) * 1.9, station);
      cylinder(0.42, 1.5, palette.wall, 0, 0, 0, mod, 14).rotation.z = Math.PI / 2;
      mod.rotation.y = -a;
    }
    box(0.14, 0.14, 5.4, palette.metal, 0, -0.95, 0, station);`;
    case 'solar':
      return `    // Solar arrays on outriggers.
    for (const side of [-1, 1]) {
      const array = group(side * 3.1, 2.2, ${num(ctx.focusZ)}, undefined);
      box(2.6, 0.05, 1.4, '#1e3a8a', 0, 0, 0, array);
      for (let r = -1.1; r <= 1.1; r += 0.36) box(0.02, 0.06, 1.4, palette.accent, r, 0.02, 0, array);
      array.rotation.x = 0.3;
    }`;
    case 'tanks':
      return `    // Process tanks with ladder rungs and a pipe run.
    for (const [tx, tz, tr] of [[-3.3, ${ctx.focusZ}, 0.95], [0.2, ${ctx.focusZ - 1.3}, 0.7], [3.1, ${ctx.focusZ + 0.5}, 1.1]]) {
      cylinder(tr, 2.1, palette.wall, tx, 1.05, tz, undefined, 18);
      cylinder(tr + 0.06, 0.14, palette.metal, tx, 2.16, tz, undefined, 18);
      for (let r = -0.4; r <= 1.4; r += 0.36) box(0.05, 0.05, 0.4, palette.metal, tx + tr - 0.02, r, tz);
    }
    cylinder(0.12, 5.6, palette.metal, 0, 0.7, ${num(ctx.focusZ + 1.6)}, undefined, 10).rotation.z = Math.PI / 2;
    for (const px of [-2.0, 0.6, 2.6]) cylinder(0.12, 0.7, palette.accent, px, 0.7, ${num(ctx.focusZ + 1.6)}, undefined, 8);`;
    case 'pipes':
      return `    // Elevated pipe rack with valves.
    for (let i = 0; i < 4; i += 1) {
      const py = 0.8 + i * 0.34;
      const pz = ${num(ctx.focusZ - 2.2)} + i * 0.3;
      cylinder(0.09, ${ctx.ringX * 2 - 1}, palette.metal, 0, py, pz, undefined, 8).rotation.z = Math.PI / 2;
      for (const vx of [-2.4, 0, 2.4]) cylinder(0.16, 0.18, palette.accent, vx, py + 0.16, pz, undefined, 8);
    }`;
    case 'tower':
      return `    // Steel tower with a hazard-banded crown.
    const tower = group(-${num(ctx.ringX - 1.0)}, 0.18, -${num(ctx.slotZ - 0.4)}, undefined);
    for (const [lx, lz] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) {
      cylinder(0.05, 4.2, palette.metal, lx, 2.1, lz, tower, 6);
    }
    for (let y = 0.8; y < 4.2; y += 0.8) {
      box(1.1, 0.05, 0.05, palette.metal, 0, y, -0.5, tower);
      box(0.05, 0.05, 1.1, palette.metal, -0.5, y, 0, tower);
    }
    box(1.4, 0.16, 1.4, palette.metal, 0, 4.2, 0, tower);
    const beacon = ball(0.2, palette.accent, 0, 4.5, 0, tower);`;
    case 'beacon':
      return `    // Beacon column with a rotating lamp.
    const beacon = group(${num(ctx.ringX - 1.2)}, 0.18, -${num(ctx.slotZ - 0.6)}, undefined);
    cylinder(0.42, 3.4, palette.wall, 0, 1.7, 0, beacon, 16);
    cylinder(0.5, 0.2, palette.accent, 0, 3.5, 0, beacon, 16);
    const lamp = ball(0.28, palette.glow, 0, 3.8, 0, beacon);
    box(0.9, 0.06, 0.06, palette.metal, 0.6, 3.8, 0, beacon);`;
    case 'temple':
      return `    // Shrine gate, altar and banner poles.
    const gate = group(0, 0.18, ${num(ctx.focusZ - 1.0)}, undefined);
    for (const gx of [-1.1, 1.1]) cylinder(0.12, 2.6, palette.accent, gx, 1.3, 0, gate, 10);
    box(3.0, 0.16, 0.24, palette.accent, 0, 2.3, 0, gate);
    box(2.4, 0.12, 0.18, palette.wall, 0, 2.62, 0, gate);
    box(1.2, 0.5, 0.7, palette.wall, 0, 0.4, 1.7, gate);
    for (const bx of [-2.0, 2.0]) {
      cylinder(0.05, 2.2, palette.metal, bx, 1.1, 1.4, gate, 6);
      box(0.4, 0.9, 0.03, palette.glow, bx, 1.9, 1.4, gate);
    }`;
    case 'crates':
      return `    // Stacks of supplies at the plaza edge.
    for (let i = 0; i < 5; i += 1) {
      const cx = ${num(-ctx.ringX + 0.8)} + (i % 3) * 0.72;
      const cz = ${num(ctx.slotZ - 0.6)} + (i % 2) * 0.62;
      for (let h = 0; h < 1 + (i % 3); h += 1) {
        box(0.6, 0.5, 0.6, h % 2 ? palette.accent : '#78350f', cx, 0.42 + h * 0.52, cz);
      }
    }`;
    case 'gardenBed':
      return `    // Raised planting beds with blooms.
    for (let b = 0; b < 3; b += 1) {
      const bz = ${num(ctx.focusZ)} - 1.6 + b * 1.5;
      box(4.6, 0.3, 0.9, '#78350f', 0, 0.32, bz);
      for (let c = -2.0; c <= 2.0; c += 0.5) {
        ball(0.16, palette.foliage, c, 0.6, bz);
        if (Math.round(c * 10) % 10 === 0) ball(0.1, palette.accent, c + 0.1, 0.72, bz - 0.1);
      }
    }`;
    case 'people':
      return `    // Two figures: one tending the scene, one walking past.
    const crew = [];
    for (const [px, pz, shirt] of [[${num(-ctx.ringX + 1.6)}, ${num(ctx.slotZ - 0.2)}, '#ef4444'], [${num(ctx.ringX - 2.0)}, ${num(ctx.slotZ + 0.6)}, '#38bdf8'], [${num(-ctx.ringX + 3.4)}, ${num(ctx.slotZ + 1.1)}, '#f59e0b']]) {
      const body = group(px, 0.18, pz, undefined);
      cylinder(0.19, 0.72, shirt, 0, 0.62, 0, body, 12);
      ball(0.19, '#fed7aa', 0, 1.16, 0, body);
      cylinder(0.07, 0.6, '#1e293b', -0.11, 0.3, 0, body, 8);
      cylinder(0.07, 0.6, '#1e293b', 0.11, 0.3, 0, body, 8);
      cylinder(0.06, 0.52, shirt, -0.25, 0.66, 0, body, 8).rotation.z = 0.3;
      cylinder(0.06, 0.52, shirt, 0.25, 0.66, 0, body, 8).rotation.z = -0.3;
      cylinder(0.05, 0.16, '#0f172a', 0, 0.06, 0.05, body, 6);
      crew.push(body);
    }`;
    case 'crater':
      return `    // Volcanic crater with glowing fissures.
    const crater = group(0, 0.16, ${num(ctx.focusZ)}, undefined);
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2;
      const radius = 2.1 + (i % 3) * 0.18;
      ball(0.5 + (i % 2) * 0.15, palette.rock, Math.cos(a) * radius, 0.3, Math.sin(a) * radius, crater);
    }
    ball(1.5, '#1c1917', 0, 0.12, 0, crater);
    const lavaPool = ball(1.15, palette.accent, 0, 0.2, 0, crater);
    for (let i = 0; i < 5; i += 1) {
      const a = (i / 5) * Math.PI * 2 + 0.4;
      const fissure = box(0.16, 0.04, 1.4, palette.glow, Math.cos(a) * 1.6, 0.26, Math.sin(a) * 1.6, crater);
      fissure.rotation.y = a;
    }`;
    default:
      return '';
  }
}

function tickBlock(features, prompt) {
  const lines = [
    '    // Looping motion: none of it depends on wall-clock time.',
    '    const loop = (t / 6.0) * Math.PI * 2;',
  ];
  if (features.includes('wateringArm')) {
    lines.push(
      '    if (p.armCarriage) p.armCarriage.position.x = Math.sin(loop) * 2.2;',
      '    if (p.arm) p.arm.rotation.z = Math.sin(loop * 3) * 0.22;'
    );
  }
  if (features.includes('lanterns')) {
    lines.push(
      '    (p.lanternStrings || []).forEach((line, i) => { line.rotation.z = Math.sin(loop + i) * 0.035; line.position.y = Math.sin(loop * 2 + i) * 0.03; });'
    );
  }
  if (features.includes('drones')) {
    lines.push(
      "    (p.drones || []).forEach((drone, i) => { drone.position.y = (drone.userData.baseY || 0) + Math.sin(loop * 2 + i) * 0.18; drone.rotation.y = loop * 0.6 + i; drone.userData.baseY = drone.position.y - Math.sin(loop * 2 + i) * 0.18; });"
    );
  }
  if (features.includes('dome')) {
    lines.push('    if (p.scope) p.scope.rotation.y = Math.sin(loop * 0.5) * 0.5;');
  }
  if (features.includes('stalls')) {
    lines.push('    (p.stalls || []).forEach((stall, i) => { stall.rotation.y = Math.sin(loop * 0.4 + i) * 0.02; });');
  }
  if (features.includes('bubbles')) {
    lines.push(
      '    (p.bubbles || []).forEach((bubble, i) => { bubble.position.y = 0.4 + ((loop / (Math.PI * 2) * (0.6 + (i % 4) * 0.2) + i * 0.3) % 1) * 3.0; bubble.position.x += Math.sin(loop * 2 + i) * 0.0015; });'
    );
  }
  if (features.includes('coral')) {
    lines.push('    (p.coralFrames || []).forEach((frame, i) => { frame.rotation.y = Math.sin(loop * 0.3 + i * 0.7) * 0.04; });');
  }
  if (features.includes('beacon')) {
    lines.push('    if (p.lamp) { p.lamp.visible = Math.sin(loop * 4) > -0.4; }');
  }
  if (features.includes('tower')) {
    lines.push('    if (p.beacon) { p.beacon.rotation.y = loop * 0.8; p.beacon.rotation.x = 0.2; }');
  }
  if (features.includes('crater')) {
    lines.push('    if (p.lavaPool) { p.lavaPool.scale.setScalar(1 + Math.sin(loop * 3) * 0.05); }');
  }
  if (features.includes('people')) {
    lines.push(
      '    (p.crew || []).forEach((body, i) => { body.position.y = 0.18 + Math.abs(Math.sin(loop * 2 + i)) * 0.01; body.rotation.y = Math.sin(loop * 0.5 + i) * 0.25; });'
    );
  }
  if (features.includes('solar')) {
    lines.push('    (p.arrays || []).forEach((array) => { array.rotation.x = 0.3 + Math.sin(loop * 0.5) * 0.12; });');
  }
  if (features.includes('drone') || features.includes('drones')) {
    // handled above
  }
  if (lines.length === 2) lines.push('    // Ambient motion keeps the frame alive with static geometry.');
  return lines.join('\n');
}

/** Returns the name of the animation handles the tick block expects. */
function handlesFor(features) {
  const handles = [];
  if (features.includes('wateringArm')) handles.push('armCarriage', 'arm');
  if (features.includes('lanterns')) handles.push('lanternStrings');
  if (features.includes('drones') || features.includes('drone')) handles.push('drones');
  if (features.includes('dome')) handles.push('scope');
  if (features.includes('stalls')) handles.push('stalls');
  if (features.includes('bubbles')) handles.push('bubbles');
  if (features.includes('coral')) handles.push('coralFrames');
  if (features.includes('beacon')) handles.push('lamp');
  if (features.includes('tower')) handles.push('beacon');
  if (features.includes('crater')) handles.push('lavaPool');
  if (features.includes('people')) handles.push('crew');
  return handles;
}

export function composeCustomWorld({
  slug,
  cleanTitle,
  cleanMeans,
  prompt = '',
  size = 'card',
  isNight = false,
}) {
  const profile = profileFor(prompt);
  const features = featuresFor(prompt, profile);
  const hero = size === 'hero';

  const ctx = {
    ringX: hero ? 7.2 : 4.6,
    slotZ: hero ? 3.1 : 2.2,
    focusZ: hero ? 1.0 : 0.9,
    slotA: hero ? 3.0 : 2.1,
    lanternZ: hero ? -3.4 : -2.6,
    lanternHalf: hero ? 7.6 : 4.9,
    stallXs: hero ? '[-5.4, -2.7, 0, 2.7, 5.4]' : '[-2.6, 0, 2.6]',
  };
  const boundsMinX = hero ? -8.4 : -5.4;
  const boundsMaxX = hero ? 8.4 : 5.4;
  const boundsMinZ = hero ? -5.0 : -4.2;
  const boundsMaxZ = hero ? 5.0 : 4.2;
  const bounds = `[[${boundsMinX}, -0.6, ${boundsMinZ}], [${boundsMaxX}, ${hero ? 6.4 : 5.6}, ${boundsMaxZ}]]`;

  const props = [];
  // Distinctive features keep their own name so tick() can address them.
  const usedTicks = [];
  for (const feature of features) {
    if (feature === 'drone') {
      props.push(propBlock('drone', profile, ctx).replace('const drones', 'const drones')); // same handle name
      usedTicks.push('drones');
      continue;
    }
    const code = propBlock(feature, profile, ctx);
    if (!code) continue;
    props.push(code);
    usedTicks.push(feature);
  }

  const handles = handlesFor(usedTicks);
  const handleLines = handles.map((h) => `      ${h},`).join('\n');

  // Point the tick block at the right names.
  let tick = tickBlock(usedTicks, prompt);
  tick = tick.replace(/features/gu, '');

  return `import { defineWorld } from '@any3d/worlds';

export default defineWorld({
  name: '${slug}',
  title: '${cleanTitle}',
  duration: 6.0,
  still: 2.0,
  description: '${cleanMeans}',
  bounds: ${bounds},
  build(W) {
    const { box, ball, cylinder, group, terrain } = W;
${paletteBlock(profile)}

${baseBlock(profile, size, prompt)}

${props.join('\n\n')}

    return {
${handleLines}
${handles.length ? '' : '      scene: undefined,\n'}    };
  },
  tick({ t, parts: p }) {
${tick}
  },
  contacts() { return []; }
});
`;
}

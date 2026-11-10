import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { worldLook } from '../core/kernels/any3d-world.js';

const ROOT = process.cwd();
const defaultTime = 1 / 3;
let assertions = 0;

function check(name: string, condition: boolean) {
  assertions++;
  assert.ok(condition, name);
}

const noon = worldLook(defaultTime);
check('Worlds noon preserves the original hemi colours', noon.sky === '#f5f4df' && noon.ground === '#8b9476');
check('Worlds noon preserves the original sun and background', noon.sun === '#fff1d5' && noon.sunPower === 3 && noon.background === '#ffffff');
check('Worlds noon preserves the original sun position', JSON.stringify(noon.sunPosition) === JSON.stringify([-7, 13, 8]));
const night = worldLook(1);
check('Worlds night changes light, sun position, and sky', night.hemi < noon.hemi && night.sunPower < noon.sunPower && night.background !== noon.background);
check('Worlds clamps out-of-range time', worldLook(2).background === night.background);
check('Worlds uses noon for non-finite time', worldLook(Number.NaN).background === noon.background);

for (const engine of ['any3d-pixel.js', 'any3d-dither.js']) {
  const module = { exports: {} as Record<string, unknown> };
  const source = fs.readFileSync(path.join(ROOT, 'core', 'kernels', engine), 'utf8');
  vm.runInNewContext(source, { module, exports: module.exports }, { filename: engine });
  const kernel = module.exports as {
    lookGrade: (look: { timeOfDay: number; weather: string }) => { exposure: number; tint: number[]; saturation: number };
    gradeRgb: (rgb: number[], grade: { exposure: number; tint: number[]; saturation: number }) => number[];
  };
  const defaultGrade = kernel.lookGrade({ timeOfDay: defaultTime, weather: 'clear' });
  check(`${engine} noon/clear grade is identity`, defaultGrade.exposure === 1 && defaultGrade.saturation === 1 && defaultGrade.tint.every((v) => v === 1));
  check(`${engine} noon/clear preserves palette colors`, JSON.stringify(kernel.gradeRgb([72, 120, 190], defaultGrade)) === JSON.stringify([72, 120, 190]));

  const darkGrade = kernel.lookGrade({ timeOfDay: 1, weather: 'clear' });
  const darkColor = kernel.gradeRgb([72, 120, 190], darkGrade);
  check(`${engine} night grade deterministically shifts the palette`, JSON.stringify(darkColor) === JSON.stringify(kernel.gradeRgb([72, 120, 190], darkGrade)));
  check(`${engine} night grade darkens the sample`, darkColor[0] < 72 && darkColor[1] < 120);
  const rainyGrade = kernel.lookGrade({ timeOfDay: defaultTime, weather: 'rain' });
  check(`${engine} rain grade differs from clear`, JSON.stringify(rainyGrade) !== JSON.stringify(defaultGrade));
}

console.log(`atmosphere assertions: ${assertions} passed`);

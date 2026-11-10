import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

export function getSVGKernel() {
  const kernelPath = path.join(rootDir, 'core', 'kernels', 'any3d-svg.js');
  return fs.readFileSync(kernelPath, 'utf8').replace(/\r\n/g, '\n').trimEnd();
}

export function getWorldsKernel() {
  const kernelPath = path.join(rootDir, 'core', 'kernels', 'any3d-world.js');
  return fs.readFileSync(kernelPath, 'utf8').replace(/\r\n/g, '\n').trimEnd();
}

export function getPixelKernel() {
  const kernelPath = path.join(rootDir, 'core', 'kernels', 'any3d-pixel.js');
  return fs.readFileSync(kernelPath, 'utf8').replace(/\r\n/g, '\n').trimEnd();
}

export function getDitherKernel() {
  const kernelPath = path.join(rootDir, 'core', 'kernels', 'any3d-dither.js');
  return fs.readFileSync(kernelPath, 'utf8').replace(/\r\n/g, '\n').trimEnd();
}

export function getSVGBenchTemplate() {
  const benchPath = path.join(rootDir, 'core', 'templates', 'svg-bench.html');
  return fs.readFileSync(benchPath, 'utf8').replace(/\r\n/g, '\n');
}

export function getWorldsBenchTemplate() {
  const benchPath = path.join(rootDir, 'core', 'templates', 'world-bench.html');
  return fs.readFileSync(benchPath, 'utf8').replace(/\r\n/g, '\n');
}

export function getPixelBenchTemplate() {
  const benchPath = path.join(rootDir, 'core', 'templates', 'pixel-bench.html');
  return fs.readFileSync(benchPath, 'utf8').replace(/\r\n/g, '\n');
}

export function getDitherBenchTemplate() {
  const benchPath = path.join(rootDir, 'core', 'templates', 'dither-bench.html');
  return fs.readFileSync(benchPath, 'utf8').replace(/\r\n/g, '\n');
}

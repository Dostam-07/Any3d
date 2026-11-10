import fs from 'node:fs';

const worldsLines = fs.readFileSync('test_worlds.html', 'utf8').split('\n');
console.log('--- test_worlds.html around line 3891 ---');
for (let i = 3880; i <= 3910 && i < worldsLines.length; i++) {
  console.log(`${i}: ${worldsLines[i]}`);
}

const pixelLines = fs.readFileSync('test_pixel.html', 'utf8').split('\n');
console.log('--- test_pixel.html around line 664 ---');
for (let i = 650; i <= 680 && i < pixelLines.length; i++) {
  console.log(`${i}: ${pixelLines[i]}`);
}


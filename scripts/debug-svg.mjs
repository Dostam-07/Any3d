import { validateScene } from '../server/engine/validator.js';

const svg = `Any3d.figure({
  name: 'test', size: 'card',
  build: function(o) { var D=o.D, pal=o.pal; var c=D.group(0,0,0); D.box(1.5,.3,2.6,pal.accent,0,.2,0,c); c.name='car'; return {hot:[c]}; },
  tick: function(ctx) {}
});`;

const v = validateScene(svg, 'svg');
console.log('valid:', v.valid);
console.log('checks:', v.checks.map(c => c.label + '=' + c.ok).join(', '));
console.log('name:', v.name);
console.log('size:', v.size);
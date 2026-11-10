import { defineWorld } from '@any3d/worlds';

const duration = 7.2;
function poseBatter(batter,u) {
  const swing=Math.sin(Math.PI*Math.max(0,Math.min(1,(u-.34)/.18)));
  batter.rightArm.rotation.x=-.35-swing*1.8;
  batter.leftArm.rotation.x=-.25-swing*1.2;
  batter.body.rotation.y=swing*-.6;
}
export default defineWorld({
  name: 'cricket', title: 'An afternoon at the crease', duration, still: 2.76,
  contactTimes: [duration*.42],
  description: 'A miniature cricket ground. A bowler runs in, a batter strikes and a fielder returns the red ball.',
  bounds: [[-10, -.5, -7], [10, 5.8, 7]],
  build(W) {
    const { box, cylinder, line, ring, person } = W;
    W.terrain(20, 14, '#718941'); W.grass(20, 14, 2000);
    for (let i = 0; i < 10; i += 2) W.surface(1.95,12.5,'#7c9449',-9+i*2,.026,0,30+i,.18);
    const rope = ring(8.6, '#ede8d5', 0, .055, 0); rope.scale.y = .69;
    W.surface(10.3,1.85,'#c7b68b',0,.047,0,51,.16);
    // A worn centre and painted creases, not a featureless tan rectangle.
    for (let i = 0; i < 130; i++) {
      const x = (W.random() - .5) * 10, z = (W.random() - .5) * 1.7;
      box(.04 + W.random() * .1, .008, .035 + W.random() * .04, ['#b3a27b', '#d3c498', '#bfb18a'][i % 3], x, .052, z);
    }
    for (const x of [-4.4, 4.4]) {
      box(.035, .012, 1.8, '#f2eddc', x, .06, 0);
      for (const z of [-.65, .65]) box(.8, .012, .035, '#f2eddc', x, .061, z);
      for (const z of [-.13, 0, .13]) cylinder(.022, .53, '#eee8d4', x, .33, z);
      box(.045, .025, .35, '#d6c79f', x, .6, 0);
    }
    // Fine fencing occupies the back edge only: no screen across the actors.
    for (let x = -9.5; x <= 9.5; x += 1.9) cylinder(.035, 1.9, '#3d4940', x, .95, -6.5);
    for (let y = .25; y < 1.9; y += .22) line([[-9.5, y, -6.5], [9.5, y, -6.5]], '#727b68', .008);
    for (let x = -9.5; x <= 9.5; x += .28) line([[x, .05, -6.5], [x, 1.85, -6.5]], '#727b68', .008);
    // Timber pavilion: open porch, roof, wall boards and occupied benches.
    const pavilion = W.group(-6.7, 0, -4.9);
    box(3.8, .16, 2.05, '#9b7850', 0, .12, 0, pavilion);
    box(3.8, 1.75, .1, '#81572f', 0, 1.02, -.95, pavilion);
    for (let x = -1.8; x < 1.9; x += .22) box(.025, 1.7, .03, '#a57d48', x, 1, -.88, pavilion);
    for (const x of [-1.75, 1.75]) cylinder(.06, 1.85, '#745032', x, 1, .8, pavilion);
    const roof = box(4.25, .13, 2.6, '#c19454', 0, 2.03, -.05, pavilion); roof.rotation.x = .14;
    for (let x = -2; x <= 2; x += .19) { const slat = box(.025, .025, 2.6, '#a27840', x, 2.11, -.05, pavilion); slat.rotation.x = .14; }
    W.bench(-6.7, -5.1); W.bench(-3.8, -5.6);
    [[-8.8,-4,.9], [-8.8,4.9,1.0], [8.8,-5.2,1.05], [4.9,-5.8,.85]].forEach(([x,z,s], i) => W.tree(x,z,s,12+i));
    for (const [x,z] of [[-9.2,-5.8],[9.2,-5.8]]) {
      cylinder(.045, 5.3, '#555342', x, 2.65, z); box(.75,.16,.23,'#303a36',x,5.3,z);
      for (let i = 0; i < 3; i++) box(.16,.08,.14,'#e5e2c6',x-.25+i*.25,5.23,z+.08);
    }
    // Scoreboard has physical panels; no tiny unreadable text baked into pixels.
    box(2.5, 1.2, .14, '#293c2c', 3.5, 1.8, -6.1);
    for (const x of [2.5,4.5]) cylinder(.045,1.5,'#554c33',x,.75,-6.1);
    for (let i = 0; i < 5; i++) box(.25,.4,.025,'#c7c7a1',2.7+i*.4,1.8,-6);
    const bowler = person(-5.9, 0, '#e5e4d1', '#e2deca', .76); bowler.root.rotation.y = Math.PI / 2;
    const batter = person(4.1, -.18, '#eee8d4', '#e4ddc7', .76); batter.root.rotation.y = -Math.PI / 2;
    W.ball(.14, '#334537', 0, .91, 0, batter.chest);
    const bat=box(.15, .58, .07, '#bc914e', 0, -.52, 0, batter.rightForearm);
    poseBatter(batter,.42); batter.root.updateMatrixWorld(true);
    const hit=new W.THREE.Vector3();bat.getWorldPosition(hit);
    const keeper = person(5.7, -.05, '#396d90', '#e6e0cc', .73); keeper.root.rotation.y = -Math.PI / 2;
    const fielder = person(1, 4.2, '#d5b23f', '#314238', .76);
    const extras = [[-5,3.7,'#b75539'],[-1.8,-3.9,'#3e6c88'],[5.4,3.2,'#376e55'],[5.9,-3.4,'#d2c29b']].map(([x,z,c]) => person(x,z,c,'#384537',.71));
    const ball = W.ball(.085, '#a42d25', -5, 1.2, 0);
    return { bowler, batter, keeper, fielder, extras, ball, bat, hit };
  },
  tick({ t, parts: p, W }) {
    const u = t / duration, s = W.smooth;
    // Every property is assigned from time; seek and frame order are irrelevant.
    const run = Math.sin(Math.PI * Math.min(u / .24, 1));
    p.bowler.root.position.x = -6.7 + 2.3 * s(u / .24) * (1 - s((u - .8) / .2));
    p.bowler.leftLeg.rotation.x = run * Math.sin(u * Math.PI * 36) * .55;
    p.bowler.rightLeg.rotation.x = -p.bowler.leftLeg.rotation.x;
    p.bowler.rightArm.rotation.x = u < .3 ? -Math.PI * 2 * s(u / .3) : 0;
    p.bowler.leftArm.rotation.x = run * .7;
    poseBatter(p.batter,u);
    p.keeper.leftArm.rotation.x = -.45; p.keeper.rightArm.rotation.x = -.45;
    p.keeper.body.rotation.x = .13;
    const catchPose = Math.sin(Math.PI * Math.max(0, Math.min(1, (u - .65) / .22)));
    p.fielder.leftArm.rotation.x = -catchPose * 1.4; p.fielder.rightArm.rotation.x = -catchPose * 1.4;
    for (let i = 0; i < p.extras.length; i++) p.extras[i].body.rotation.y = Math.sin(u * Math.PI * 2 + i) * .07;
    if (u < .25) p.ball.position.set(p.bowler.root.position.x, 1.1, 0);
    else if (u < .42) { const a = (u - .25) / .17; p.ball.position.set(-4.4+(p.hit.x+4.4)*a,1.1+(p.hit.y-1.1)*a-.55*Math.sin(a*Math.PI),p.hit.z*a); }
    else if (u < .76) { const a = (u - .42) / .34; p.ball.position.set(p.hit.x+(1-p.hit.x)*a,p.hit.y+(1.1-p.hit.y)*a+2.1*Math.sin(a*Math.PI),p.hit.z+(4.2-p.hit.z)*a); }
    else { const a = s((u - .76) / .24); p.ball.position.set(1 - 7.7*a, 1.1 + 1.5*Math.sin(a*Math.PI), 4.2*(1-a)); }
  },
  contacts({parts:p,W}) {const actual=new W.THREE.Vector3();p.bat.getWorldPosition(actual);return [{label:'red ball meets bat face',a:p.ball.position.toArray(),b:actual.toArray()}];}
});

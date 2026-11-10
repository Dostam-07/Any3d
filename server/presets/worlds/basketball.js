import { defineWorld } from '@any3d/worlds';

export const duration = 4.2;
const lerp = (a,b,u) => a+(b-a)*u;
const ease = u => { u=Math.max(0,Math.min(1,u)); return u*u*(3-2*u); };
export function ballPose(t) {
  t=((t%duration)+duration)%duration;
  if(t<.6) return [0,lerp(1.2,2.05,ease(t/.6)),1.15];
  if(t<1.4) { const a=(t-.6)/.8;return [0,2.05+1.1*a+1.4*4*a*(1-a),lerp(1.15,-3.3,a)]; }
  if(t<1.72) { const a=(t-1.4)/.32;return [0,lerp(3.15,.28,a*a),-3.3]; }
  if(t<2.35) { const a=(t-1.72)/.63;return [3.6*a,lerp(.28,1.25,a)+1.1*4*a*(1-a),lerp(-3.3,1.4,a)]; }
  if(t<2.6) return [3.6,1.25,1.4];
  if(t<3.15) { const a=(t-2.6)/.55;return [3.6*(1-a),lerp(1.25,1.2,a)+.65*4*a*(1-a),lerp(1.4,1.15,a)]; }
  const a=(t-3.15)/1.05;return [0,1.2-.92*Math.sin(a*Math.PI),1.15];
}
export default defineWorld({
  name: 'basketball', title: 'One more shot', duration, still: 1.05,
  contactTimes: [.6,1.4,2.35,2.6,3.15],
  description: 'An outdoor half court with three players. A shooter releases the ball, scores and receives a return pass.',
  bounds: [[-7.5, -.5, -6], [7.5, 5.4, 6]],
  build(W) {
    const { box, cylinder, line, ring, person } = W;
    W.terrain(15,12,'#80954b'); W.grass(15,12,1700);
    W.surface(13.2,10,'#575b55',0,.046,0,17,.17);
    // Pavement wear: small planar fragments, not scattered floating cubes.
    for (let i = 0; i < 160; i++) box(.04+W.random()*.12,.003,.04+W.random()*.1,['#696d65','#4c514d','#777a6b'][i%3],(W.random()-.5)*13,.047,(W.random()-.5)*9.8);
    W.surface(4.8,4.6,'#3d6a78',0,.057,-1.9,18,.09);
    const paint = '#d8dbcf';
    line([[-6,.07,-4.5],[-6,.07,4.5],[6,.07,4.5],[6,.07,-4.5],[-6,.07,-4.5]],paint,.025);
    line([[-2.4,.07,-4.5],[-2.4,.07,.4],[2.4,.07,.4],[2.4,.07,-4.5]],paint,.025);
    const arc = ring(4.7,paint,0,.07,-3.5,undefined,.025,Math.PI); arc.rotation.z = Math.PI;
    ring(1.25,paint,0,.07,.4,undefined,.025);
    cylinder(.075,3.65,'#303b40',0,1.82,-4.9);
    line([[0,3.5,-4.9],[0,3.5,-3.8]],'#303b40',.07);
    box(2.15,1.15,.12,'#e2e0d4',0,3.65,-3.8);
    line([[-.48,3.2,-3.71],[-.48,3.72,-3.71],[.48,3.72,-3.71],[.48,3.2,-3.71]],'#ad4d34',.03);
    ring(.36,'#b54f2c',0,3.15,-3.3,undefined,.04);
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI*2;
      line([[Math.cos(a)*.34,3.15,-3.3+Math.sin(a)*.34],[Math.cos(a)*.2,2.6,-3.3+Math.sin(a)*.2]],'#e0dfcb',.012);
    }
    ring(.27,'#d6d8c3',0,2.87,-3.3,undefined,.012); ring(.2,'#d6d8c3',0,2.6,-3.3,undefined,.012);
    W.bench(4.5,-5.2); box(.5,.65,.5,'#3b6072',6,.35,-4.9);
    W.tree(-6.7,-4.5,.9,4); W.tree(6.6,4.5,.7,8);
    const shooter = person(0,1.4,'#e5e3d3','#38654c',.95,'#b57d54'); shooter.root.rotation.y = Math.PI;
    const defender = person(-2.4,-.6,'#ad4b31','#2d3838',.95,'#82593f'); defender.root.rotation.y = .6;
    const passer = person(3.8,1.7,'#d6b35d','#303b3b',.95,'#d5a37c'); passer.root.rotation.y = -Math.PI+.6;
    const palms = { shooter: {}, passer: {} };
    const ball = W.group(0,1.2,1.4); W.ball(.2,'#c67b33',0,0,0,ball);
    // Seam bands move with the ball.
    for (const angle of [0,Math.PI/2]) { const seam = ring(.2,'#553d2a',0,0,0,ball,.009); seam.rotation.x = angle; }
    return { shooter, defender, passer, ball, palms };
  },
  tick({ t, parts: p, W }) {
    const u=t/duration, s=W.smooth;
    const jump = .18*Math.sin(Math.PI*Math.max(0,Math.min(1,(t-.3)/.65)));
    p.shooter.root.position.y=jump;
    const ball=ballPose(t);p.ball.position.set(...ball);p.ball.rotation.y=u*Math.PI*4;
    p.shooter.leftLeg.rotation.x=.12*Math.sin(u*Math.PI*2);p.shooter.rightLeg.rotation.x=-p.shooter.leftLeg.rotation.x;
    p.defender.root.position.x=-2.4+.45*Math.sin(u*Math.PI*2);
    p.defender.leftLeg.rotation.x=.25*Math.sin(u*Math.PI*4);p.defender.rightLeg.rotation.x=-p.defender.leftLeg.rotation.x;
    p.defender.leftArm.rotation.z=-.3-.25*Math.sin(u*Math.PI*2);p.defender.rightArm.rotation.z=.5;
    p.defender.body.rotation.y=.08*Math.sin(u*Math.PI*2);
    const shooterOwns=t<=.6||t>=3.15;
    const follow=1-s((t-.7)/.35);
    for(const side of [-1,1]){
      const shooterTarget=shooterOwns?[ball[0]-side*.14,ball[1]-.1,ball[2]]:[-side*.14,1.1+.85*follow,1.15];
      p.palms.shooter[side]=W.reach(p.shooter,side,shooterTarget);
      const passerOwns=t>=2.35&&t<=2.6;
      const ready=s((t-1.9)/.45)*(1-s((t-2.6)/.5));
      const passerTarget=passerOwns?[ball[0]-side*.13,ball[1]-.1,ball[2]]:[3.6-side*.13,1.0+.15*ready,1.4];
      p.palms.passer[side]=W.reach(p.passer,side,passerTarget);
    }
  },
  contacts({t,parts:p}) {
    const near=a=>Math.abs(t-a)<1e-5;
    if(near(1.4))return [{label:'ball passes through hoop centre',a:p.ball.position.toArray(),b:[0,3.15,-3.3]}];
    const key=near(.6)||near(3.15)?'shooter':'passer',radius=key==='shooter'?.14:.13;
    return [-1,1].map(side=>({label:`${key} palm ${side} meets ball`,a:p.palms[key][side],b:[p.ball.position.x-side*radius,p.ball.position.y-.1,p.ball.position.z]}));
  }
});

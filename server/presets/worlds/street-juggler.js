import { defineWorld } from '@any3d/worlds';

// One three-second cascade: three staggered balls, each crosses twice.
// Flight (1.15s) -> cushioned catch and inward scoop (.35s) -> opposite flight.
const TAU = Math.PI * 2;
export function hand(side, t) {
  const u = ((t - .15 + (side < 0 ? .5 : 0)) % 1 + 1) % 1;
  if (u < .35) { const a=u/.35; return [side*(.60-.35*a),1.36-.13*Math.sin(Math.PI*a),.38]; }
  const a=(u-.35)/.65, eased=a*a*(3-2*a);
  return [side*(.25+.35*eased),1.36+.035*Math.sin(Math.PI*a),.38];
}
export function ballPose(t) {
  const q = ((t % 3) + 3) % 3, side = q < 1.5 ? -1 : 1, u = q % 1.5;
  if (u >= 1.15) { const a=(u-1.15)/.35; return [-side*(.60-.35*a),1.36-.13*Math.sin(Math.PI*a),.38]; }
  const a = u / 1.15;
  return [side * (.25 - .85 * a), 1.36 + 2.05 * 4 * a * (1-a), .38];
}
export default defineWorld({
  name: 'street-juggler', title: 'Three bright moments', duration: 3, still: .38,
  description: 'A striped-shirt street juggler keeps three red, gold and teal balls in a continuous cascade above a small cobbled grass island. An open tip hat and a woven wicker basket sit beside the performer.',
  bounds: [[-2.65,-.45,-2.15],[2.65,3.65,2.15]],
  build(W) {
    const {box,ball,cylinder,ring,line,group}=W;
    W.terrain(5.3,4.3,'#7d9255',81); W.grass(5.3,4.3,460,31);
    // Worn cobbles leave a generous living grass fringe.
    for(let row=0;row<8;row++) for(let col=0;col<9;col++) {
      const x=-1.86+col*.45+(row%2)*.19,z=-1.32+row*.38;
      if(x*x/5+z*z/2.7>1) continue;
      const tile=box(.415,.07,.34,['#aaa69a','#c1b9a7','#96998d','#b5b2a3'][(row+col)%4],x,.043,z);
      tile.rotation.y=(W.random()-.5)*.08;
    }
    const skin='#d3a078',navy='#263d45',ivory='#f2e9ce';
    // Performer: grounded shoes, hips and knees, striped tunic, expressive face.
    for(const x of [-.17,.17]) {
      box(.22,.12,.38,navy,x,.13,.07);
      cylinder(.085,.44,navy,x,.4,0);
      ball(.09,navy,x,.62,0);
      cylinder(.10,.35,navy,x,.8,0);
    }
    box(.46,.18,.28,navy,0,.96,0);
    for(let i=0;i<8;i++) box(.58,.075,.32,i%2?navy:ivory,0,1.08+i*.075,0);
    cylinder(.08,.15,skin,0,1.69,0);
    ball(.225,skin,0,1.93,.01);
    ball(.23,'#493f32',0,2.01,-.045).scale.y*=.5;
    const beret=ball(.25,navy,.035,2.12,-.03); beret.scale.y*=.38;
    ball(.06,skin,0,1.93,.225);
    for(const x of [-.08,.08]) ball(.022,navy,x,1.99,.197);
    // Two endpoint-driven two-link arms; all resources built once.
    const arms=[-1,1].map(side=>({side,
      upper:cylinder(.075,1,ivory), lower:cylinder(.06,1,skin),
      elbow:ball(.077,skin), palm:ball(.078,skin)}));
    // Open hat: hollow crown with dark inner floor, brim and a few coins.
    const hat=group(-1.05,.12,1.02);hat.rotation.y=-.2;
    cylinder(.48,.045,navy,0,0,0,hat,16);
    cylinder(.29,.025,'#182b30',0,.027,0,hat,16);
    for(let i=0;i<16;i++){
      const a=i/16*TAU, m=box(.12,.32,.065,navy,Math.cos(a)*.31,.17,Math.sin(a)*.31,hat);m.rotation.y=-a+Math.PI/2;
    }
    ring(.31,navy,0,.34,0,hat,.045);
    for(const [x,z] of [[-.09,.02],[.08,-.04],[.03,.11]]) cylinder(.055,.025,'#d4aa4a',x,.06,z,hat,8);
    // Wicker basket: vertical stakes, woven horizontal hoops, arched handle.
    const basket=group(1.35,.1,.35); basket.rotation.y=.15;
    cylinder(.35,.035,'#987040',0,.035,0,basket,16);
    for(let i=0;i<16;i++){
      const a=i/16*TAU;line([[Math.cos(a)*.33,.04,Math.sin(a)*.33],[Math.cos(a)*.4,.57,Math.sin(a)*.4]],'#a97e46',.023,basket);
    }
    for(let i=0;i<10;i++)ring(.335+i*.0068,i%2?'#be9458':'#9b723f',0,.08+i*.051,0,basket,.025);
    const handle=[];for(let i=0;i<=18;i++){const a=i/18*Math.PI;handle.push([Math.cos(a)*.39,.56+Math.sin(a)*.42,0]);}
    line(handle,'#a97e46',.038,basket);
    // Quiet tufts around the island, not competing secondary action.
    for(const [x,z] of [[-2,1.5],[2,-1.45],[-2,-1.4]]) for(let i=0;i<4;i++)ball(.055,'#d5c887',x+(i%2)*.12,.12,z+Math.floor(i/2)*.10);
    const balls=['#c94b37','#e6b53e','#378d93'].map(c=>ball(.13,c));
    const vA=new W.THREE.Vector3(),vB=new W.THREE.Vector3(),dir=new W.THREE.Vector3(),up=new W.THREE.Vector3(0,1,0);
    return {arms,balls,vA,vB,dir,up};
  },
  tick({t,parts:p}) {
    function segment(mesh,a,b){p.vA.set(...a);p.vB.set(...b);p.dir.subVectors(p.vB,p.vA);mesh.position.copy(p.vA).add(p.vB).multiplyScalar(.5);mesh.scale.y=p.dir.length();mesh.quaternion.setFromUnitVectors(p.up,p.dir.normalize());}
    for(const arm of p.arms){
      const h=hand(arm.side,t),shoulder=[arm.side*.34,1.56,0];
      const d=h.map((v,i)=>v-shoulder[i]),dist=Math.hypot(...d),along=(.36**2-.42**2+dist**2)/(2*dist),bend=Math.sqrt(.36**2-along**2);
      let n=[d[1],-d[0],0],norm=Math.hypot(...n);n=n.map(v=>v/norm*(n[0]*arm.side<0?-1:1));
      const elbow=shoulder.map((v,i)=>v+d[i]/dist*along+n[i]*bend);
      segment(arm.upper,shoulder,elbow);segment(arm.lower,elbow,h);arm.elbow.position.set(...elbow);arm.palm.position.set(...h);
    }
    p.balls.forEach((b,i)=>{b.position.set(...ballPose(t+i));});
  }
});

import { defineWorld } from '@any3d/worlds';
const clay='#b66c48', wood='#92714c', dark='#49565a';
function radiusAt(y){const h=y-1.02;return h<.12?.135+(h-.035)/.085*.01:.145-(h-.12)/.10*.005;}
function targets(t){const y=1.16+.055*Math.sin(t*Math.PI/3);return [[-radiusAt(y),y,.27],[radiusAt(y+.012),y+.012,.27]];}
function worldPoint(W,o){o.updateWorldMatrix(true,false);return o.getWorldPosition(new W.THREE.Vector3()).toArray();}
export default defineWorld({name:'pottery-studio',title:'The patient wheel',description:'An adult potter draws both hands slowly up a spinning clay vessel. A compact open-air studio holds drying pots, tools, a draped cloth and a small herb garden.',duration:6,still:1.5,bounds:[[-1.85,-.36,-1.4],[1.85,2.05,1.4]],contactTimes:[0,.75,1.5,3,4.5,5.9],
 build(W){
 W.terrain(3.7,2.8,'#92976d',11);W.surface(2.95,2.5,'#d0c3a8',-.2,.025,-.02,7,.04);
 for(let x=-1.6;x<1.25;x+=.38)W.box(.008,.01,2.47,'#b3a58c',x,.033,-.02);
 const actor=W.person(0,-.20,'#e6dfc8','#465857',1,'#b77f5c');actor.root.position.y=-.02;
 // Work apron follows the standard rig's chest, never substitutes for the human.
 W.box(.32,.43,.025,'#ab644b',0,.27,.135,actor.chest);W.box(.27,.19,.03,'#ab644b',0,-.025,.13,actor.body);
 W.box(.19,.11,.014,'#8d4e39',0,.14,.152,actor.chest);
 // Wheel chassis, hand wheel and moving pottery.
 W.box(.69,.12,.65,dark,0,.86,.27);for(const x of [-.25,.25])for(const z of [.02,.52])W.box(.05,.78,.05,dark,x,.42,z);
 W.cylinder(.085,.73,'#646b69',0,.45,.27);W.cylinder(.26,.045,'#777d76',0,.955,.27,undefined,32);
 const wheel=W.group(0,.995,.27);W.cylinder(.255,.035,'#b9b1a0',0,0,0,wheel,32);
 for(let i=0;i<4;i++)W.box(.08,.005,.012,'#8a8072',.18*Math.cos(i*Math.PI/2),.02,.18*Math.sin(i*Math.PI/2),wheel);
 function pot(parent,x,y,z,scale,color){const p=W.group(x,y,z,parent);p.scale.setScalar(scale);const profile=[[0,0],[.1,0],[.135,.035],[.145,.12],[.14,.22],[.125,.27],[.102,.27],[.116,.218],[.12,.12],[.11,.045],[0,.03]];const geo=W.own(new W.THREE.LatheGeometry(profile.map(([r,h])=>new W.THREE.Vector2(r,h)),24));const mat=W.own(new W.THREE.MeshStandardMaterial({color,roughness:1,flatShading:true}));const m=new W.THREE.Mesh(geo,mat);m.castShadow=m.receiveShadow=true;p.add(m);W.ring(.116,color,0,.269,0,p,.014);return p;}
 pot(wheel,0,.025,0,1,clay);
 // Two open-backed drying shelves leave the potter's head clear.
 for(const x of [-1.55,-.62])for(const z of [-1.04,-.65])W.box(.045,1.52,.045,wood,x,.78,z);
 for(const y of [.17,.72,1.28]){W.box(1.04,.065,.5,wood,-1.085,y,-.84);for(let n=0;n<3;n++)pot(undefined,-1.43+n*.34,y+.035,-.84,.65+.12*(n%2),['#cfaa77','#c48058','#7f968b'][n]);}
 // Low tool bench, cloth and a bowl of water.
 W.box(.62,.07,.58,wood,.86,.68,-.72);for(const x of [.61,1.11])for(const z of [-.94,-.5])W.box(.045,.65,.045,wood,x,.34,z);
 W.box(.27,.024,.48,'#e8e3d3',.82,.735,-.7);W.box(.27,.2,.024,'#e8e3d3',.82,.64,-.417);
 W.cylinder(.1,.07,'#a87857',1.04,.76,-.8);W.cylinder(.08,.005,'#718f92',1.04,.798,-.8);
 W.line([[.6,.75,-.84],[.65,.75,-.55]],'#6d543e',.014);W.line([[.68,.75,-.84],[.73,.75,-.55]],'#6d543e',.014);W.ring(.035,'#6b6760',.73,.753,-.52,undefined,.009);
 // Spare stool sits beside the standing work position.
 W.cylinder(.23,.075,wood,.79,.51,.49,undefined,16);for(const dx of [-.13,.13])for(const dz of [-.13,.13])W.line([[.79+dx,.48,.49+dz],[.79+dx*1.25,.055,.49+dz*1.25]],wood,.028);
 // Garden around the cutaway studio, grouped leaves rather than visual noise.
 for(let n=0;n<5;n++){let z=-1.05+n*.49;W.cylinder(.14,.17,'#a66e4c',1.55,.11,z,undefined,10);W.cylinder(.12,.012,'#514c39',1.55,.2,z);for(let k=0;k<6;k++){let a=k*Math.PI/3;W.line([[1.55,.2,z],[1.55+.08*Math.cos(a),.38+(k%2)*.1,z+.08*Math.sin(a)]],'#526b41',.012);const leaf=W.ball(.06,k%2?'#7a8f57':'#566e45',1.55+.09*Math.cos(a),.39+(k%2)*.1,z+.09*Math.sin(a));leaf.scale.y*=1.6;}}
 return {actor,wheel};
 },
 tick({t,parts:{actor,wheel},W}){W.plant(actor,{crouch:.035+.008*Math.sin(t*Math.PI/3),lean:.115+.012*Math.sin(t*Math.PI/3),twist:0});const ts=targets(t);W.reach(actor,-1,ts[0]);W.reach(actor,1,ts[1]);actor.head.rotation.x=.2;wheel.rotation.y=t*2*Math.PI;},
 contacts({t,parts:{actor},W}){const ts=targets(t);return [{label:'left wrist to clay wall',a:worldPoint(W,actor.leftHand),b:ts[0]},{label:'right wrist to clay wall',a:worldPoint(W,actor.rightHand),b:ts[1]},...[-1,1].map(side=>({label:`${side<0?'left':'right'} foot planted`,a:worldPoint(W,side<0?actor.leftFoot:actor.rightFoot),b:[side*.13,.07,-.20]}))];}
});

import { defineWorld } from '@any3d/worlds';
const duration=5.6,TAU=Math.PI*2;
export default defineWorld({
  name:'observatory',title:'One more degree',duration,still:1.4,
  description:'An astronomer makes a small focus adjustment on a brass telescope. A star chart, field case, weather vane and low circular terrace complete the hilltop observatory.',
  bounds:[[-2.65,-.45,-2.2],[2.65,2.95,2.2]],contactTimes:[0,.9,1.4,2.8,4.2,5.1],
  build(W){
    const {box,ball,cylinder,line,group}=W;
    W.terrain(5.3,4.4,'#738779',59);W.grass(5.3,4.4,520,51);
    cylinder(1.83,.12,'#aca999',0,.045,0,undefined,48);
    for(let i=0;i<24;i++){const a=i/24*TAU,b=box(.36,.045,.28,i%2?'#bdb8a5':'#c9c3b0',Math.cos(a)*1.63,.125,Math.sin(a)*1.63);b.rotation.y=-a;}
    W.ring(1.82,'#858a7b',0,.12,0,undefined,.035);
    // Low railing confined to the rear arc keeps the observer visible.
    for(let i=0;i<11;i++){const a=Math.PI+i/10*Math.PI,x=Math.cos(a)*1.95,z=Math.sin(a)*1.95; cylinder(.022,.73,'#4d6260',x,.44,z);}
    const rail=[];for(let i=0;i<=40;i++){const a=Math.PI+i/40*Math.PI;rail.push([Math.cos(a)*1.95,.8,Math.sin(a)*1.95]);}line(rail,'#4d6260',.027);
    const mount=group(.05,.13,.1);
    for(let i=0;i<3;i++){const a=i/3*TAU;line([[0,.93,0],[Math.cos(a)*.59,.03,Math.sin(a)*.59]],'#6d7974',.045,mount);line([[0,.46,0],[Math.cos(a)*.32,.46,Math.sin(a)*.32]],'#9b9a80',.015,mount);}
    cylinder(.13,.22,'#5e7470',0,.99,0,mount,12);
    const telescope=group(0,1.25,.08,mount);telescope.rotation.x=-.48;
    // The tube's long axis is +z, with eyepiece behind the main body.
    const tube=cylinder(.15,1.15,'#b9a06a',0,0,.2,telescope,16);tube.rotation.x=Math.PI/2;
    for(const z of [-.34,.64]){const band=cylinder(.17,.075,'#4e6664',0,0,z,telescope,16);band.rotation.x=Math.PI/2;}
    const lens=cylinder(.135,.015,'#3d626c',0,0,.785,telescope,16);lens.rotation.x=Math.PI/2;
    const small=cylinder(.055,.25,'#576864',0,0,-.49,telescope,12);small.rotation.x=Math.PI/2;
    const finder=cylinder(.038,.43,'#5e7470',.13,.19,.15,telescope,8);finder.rotation.x=Math.PI/2;
    line([[.13,.02,.02],[.13,.17,.02]],'#637672',.024,telescope);
    const focus=group(.205,-.08,-.25,telescope),wheel=cylinder(.067,.09,'#6c7c72',0,0,0,focus,12);wheel.rotation.z=Math.PI/2;
    const grip=group(.25,-.08,-.25,telescope),support=group(-.15,-.08,-.22,telescope);
    // Observer stands on the near-left side, facing the telescope with a steady stance.
    const actor=W.person(.06,-.32,'#9f7563','#3b4c50',1,'#bd8b68');actor.root.position.y=.09;
    const scarf=box(.19,.14,.025,'#d0bc83',0,.52,.15,actor.chest);box(.07,.25,.026,'#d0bc83',.06,.33,.153,actor.chest);
    const hat=cylinder(.14,.1,'#4b6666',0,.11,0,actor.head,12);W.ring(.14,'#829084',0,.065,0,actor.head,.018);
    // Field desk with an actual ink star chart, compass and pencil.
    const desk=group(1.42,0,-.8);for(const x of [-.39,.39])for(const z of [-.24,.24])box(.045,.73,.045,'#6c6958',x,.47,z,desk);
    box(.94,.065,.7,'#9d8967',0,.86,0,desk);box(.66,.008,.48,'#dfd4b4',0,.9,0,desk);
    for(const radius of [.09,.17,.23])W.ring(radius,'#78857e',0,.91,0,desk,.006);
    const stars=[];for(let i=0;i<15;i++){const x=(W.random()-.5)*.5,z=(W.random()-.5)*.34;ball(.012,'#546967',x,.917,z,desk);if(i<6)stars.push([x,.915,z]);}line(stars,'#919b89',.005,desk);
    const pencil=box(.015,.015,.29,'#8f6e43',.26,.923,.03,desk);pencil.rotation.y=.4;
    cylinder(.065,.03,'#9d8d5e',-.29,.928,-.12,desk,12);
    const fieldCase=group(-1.4,.27,.8);box(.62,.35,.37,'#5e736a',0,0,0,fieldCase);for(const x of [-.22,.22])box(.04,.36,.38,'#a79368',x,0,0,fieldCase);line([[-.13,.19,0],[-.13,.26,0],[.13,.26,0],[.13,.19,0]],'#51635c',.018,fieldCase);
    const vane=group(-1.75,0,-1.27);cylinder(.023,2.55,'#627770',0,1.36,0,vane);line([[-.35,2.56,0],[.35,2.56,0]],'#9f996b',.018,vane);const arrow=box(.2,.1,.018,'#9f996b',.29,2.56,0,vane);arrow.rotation.z=.3;
    const flag=group(0,2.3,0,vane);box(.36,.15,.015,'#b2956c',.18,0,0,flag);
    const v=new W.THREE.Vector3();return{actor,telescope,focus,grip,support,flag,v,palms:[]};
  },
  tick({t,parts:p,W}){
    const a=t/duration*TAU,adjust=Math.sin(a);
    // Tiny tracking correction; hands follow physical knobs, not arbitrary waving.
    p.telescope.rotation.set(-.48+.025*adjust,.035*Math.sin(a),0);p.focus.rotation.x=.35*adjust;
    W.plant(p.actor,{crouch:.035+.01*(1+adjust),lean:.08+.025*adjust,twist:.045*Math.sin(a)});p.actor.head.rotation.set(.22,.05*Math.sin(a),0);
    p.telescope.updateMatrixWorld(true);
    for(const [i,g] of [p.support,p.grip].entries()){g.getWorldPosition(p.v);p.palms[i]=W.reach(p.actor,i?1:-1,p.v.toArray());}
    p.actor.rightHand.rotation.x=.35*adjust;p.flag.rotation.y=.08*Math.sin(a*2);
  },
  contacts({parts:p}){
    const checks=[p.support,p.grip].map((g,i)=>{g.getWorldPosition(p.v);return{label:i?'palm on focus wheel':'palm steadies telescope',a:p.palms[i],b:p.v.toArray()};});
    for(const side of [-1,1]){(side<0?p.actor.leftFoot:p.actor.rightFoot).getWorldPosition(p.v);const a=p.v.toArray();p.v.set(side*.13,.09,0);p.actor.root.localToWorld(p.v);checks.push({label:'observer planted ankle',a,b:p.v.toArray()});}return checks;
  }
});

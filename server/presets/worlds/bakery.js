import { defineWorld } from '@any3d/worlds';
const duration=4.4,TAU=Math.PI*2;
export default defineWorld({
  name:'bakery',title:'Before the first loaf',duration,still:1.1,
  description:'A baker rolls dough on a flour-dusted bench. Baskets of bread, an open brick oven and a cooling rack frame the early morning work.',
  bounds:[[-2.7,-.45,-2.1],[2.7,2.65,2.1]],contactTimes:[0,.7,1.1,2.2,3.3,4],
  build(W){
    const {box,ball,cylinder,line,group}=W;
    W.terrain(5.4,4.2,'#9f947a',23);
    for(let x=0;x<10;x++)for(let z=0;z<8;z++)box(.49,.035,.47,(x+z)%2?'#c9bca2':'#c0af94',-2.25+x*.5,.025,-1.75+z*.5);
    // Cutaway bakery: low side walls retain an unobstructed view of the hands.
    box(5.1,.22,.16,'#c3a37e',0,.11,-1.94);box(.16,.22,3.8,'#c3a37e',-2.55,.11,0);
    const oven=group(1.65,0,-1.12);
    box(1.25,.3,1.05,'#a18265',0,.19,0,oven);
    for(let row=0;row<6;row++)for(const side of [-1,1])box(.24,.15,.9,row%2?'#b77d56':'#c18a63',side*.49,.43+row*.16,0,oven);
    box(1.22,.25,.95,'#bb845f',0,1.4,0,oven);
    box(.73,.72,.025,'#342e2b',0,.84,.48,oven);
    for(let i=0;i<9;i++){const a=i/8*Math.PI,brick=box(.19,.23,.18,i%2?'#c38b63':'#b97a52',Math.cos(a)*.47,1.02+Math.sin(a)*.43,.53,oven);brick.rotation.z=a-Math.PI/2;}
    box(1.35,.08,.35,'#8d806c',0,.43,.6,oven);
    const coals=group(0,.53,.32,oven);
    for(let i=0;i<6;i++)ball(.065,i%2?'#d98a43':'#bd5a37',-.28+i*.11,0,0,coals);
    box(.3,.76,.3,'#ac8769',.22,1.92,-.24,oven);box(.4,.08,.4,'#8f7864',.22,2.34,-.24,oven);
    const table=group(0,0,.62);
    for(const x of [-.87,.87])for(const z of [-.4,.4])box(.08,.94,.08,'#876245',x,.49,z,table);
    box(2.12,.1,1.12,'#ba9163',0,.98,0,table);
    for(let i=0;i<12;i++)box(2.08,.006,.025,'#a88158',0,1.033,-.5+i*.09,table);
    // Flour marks are deterministic geometry, not a downloaded decal.
    for(let i=0;i<70;i++){const a=W.random()*TAU,r=Math.sqrt(W.random())*.48;const f=ball(.018+W.random()*.025,'#e5d9bc',Math.cos(a)*r,1.04,.62+Math.sin(a)*r*.65);f.scale.y*=.07;}
    const dough=ball(1,'#dfc899',0,1.068,.39);dough.scale.set(.31,.04,.27);
    const pin=group(0,1.145,.39),barrel=cylinder(.055,.65,'#b2814d',0,0,0,pin,12);barrel.rotation.z=Math.PI/2;
    for(const x of [-.39,.39]){const h=cylinder(.033,.14,'#7f5735',x,0,0,pin,8);h.rotation.z=Math.PI/2;}
    const grips=[group(-.37,0,0,pin),group(.37,0,0,pin)];
    const baker=W.person(0,-.08,'#efe7d5','#4c5557',1,'#b98161');baker.root.position.y=-.002;
    box(.32,.43,.025,'#c6b9a0',0,.28,.135,baker.chest);for(const x of [-.12,.12])box(.028,.25,.02,'#c6b9a0',x,.51,.137,baker.chest);
    cylinder(.138,.11,'#eee7d6',0,.09,0,baker.head,12);ball(.15,'#eee7d6',0,.16,-.015,baker.head);
    function loaf(x,y,z,scale=1){const b=group(x,y,z);b.scale.setScalar(scale);const l=ball(.18,'#b68147',0,.08,0,b);l.scale.set(.19,.12,.36);for(let i=0;i<4;i++){const slash=box(.19,.012,.027,'#dcc191',0,.19,-.22+i*.14,b);slash.rotation.y=.35;}return b;}
    // Open bread rack behind the baker; no tall front counter hiding anatomy.
    const rack=group(-1.65,0,-1.2);
    for(const x of [-.58,.58])for(const z of [-.27,.27])box(.05,1.9,.05,'#5b5e56',x,.98,z,rack);
    for(const y of [.48,1.02,1.56])box(1.3,.035,.72,'#8e785d',0,y,0,rack);
    // Loaves use the same group placement as shelves, with parent-local conversion.
    for(const y of [.48,1.02,1.56])for(const x of [-.38,0,.38])loaf(-1.65+x,y+.03,-1.2,.8);
    const bowl=cylinder(.17,.13,'#aa7b52',.73,1.11,.71,undefined,12);cylinder(.14,.014,'#ded2af',.73,1.18,.71,undefined,12);
    const sack=group(-1.7,0,1.35);const bag=ball(.3,'#c8b991',0,.31,0,sack);bag.scale.y*=1.2;W.ring(.19,'#a99772',0,.58,0,sack,.035);cylinder(.18,.025,'#e6dabf',0,.58,0,sack,12);
    for(let i=0;i<4;i++){const stem=line([[0,.6,0],[.07+i*.04,1+i*.055,.03]],'#a99765',.012,sack);for(let j=0;j<4;j++)ball(.033,'#c8b476',.07+i*.04, .86+j*.05+i*.055,.03,sack);}
    const v=new W.THREE.Vector3();return{baker,pin,grips,dough,coals,v,palms:[]};
  },
  tick({t,parts:p,W}){
    const a=t/duration*TAU,roll=Math.sin(a);
    W.plant(p.baker,{crouch:.035+.015*(1+roll),lean:.12+.05*roll,twist:.025*Math.cos(a)});p.baker.head.rotation.set(.24,.035*Math.cos(a),0);
    p.pin.position.set(0,1.145,.37+.095*roll);p.pin.rotation.x=.095/.055*roll;
    p.pin.updateMatrixWorld(true);
    p.grips.forEach((g,i)=>{g.getWorldPosition(p.v);p.palms[i]=W.reach(p.baker,i?1:-1,p.v.toArray());});
    p.dough.scale.set(.31+.012*roll,.04,.27-.01*roll);
    p.coals.scale.setScalar(1+.035*Math.sin(a*2));
  },
  contacts({parts:p}){
    const checks=p.grips.map((g,i)=>{g.getWorldPosition(p.v);return{label:'palm on rolling-pin handle',a:p.palms[i],b:p.v.toArray()};});
    for(const side of [-1,1]){(side<0?p.baker.leftFoot:p.baker.rightFoot).getWorldPosition(p.v);const a=p.v.toArray();p.v.set(side*.13,.09,0);p.baker.root.localToWorld(p.v);checks.push({label:'baker planted ankle',a,b:p.v.toArray()});}return checks;
  }
});

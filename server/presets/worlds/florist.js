import { defineWorld } from '@any3d/worlds';
const duration=4.8,TAU=Math.PI*2;

export default defineWorld({
  name:'florist',title:'A bouquet before closing',duration,still:1.05,
  description:'A florist gathers and turns a bouquet at a flower stall while a customer waits with a paper bag. Knees, shoulders and hands follow the work.',
  bounds:[[-3.6,-.45,-2.8],[3.6,3.05,2.8]],
  contactTimes:[0,.8,1.6,2.4,3.2,4.0],
  build(W){
    const {box,cylinder,ball,line,group}=W;
    W.terrain(7.2,5.6,'#82935b',17);W.grass(7.2,5.6,720,29);
    for(let row=0;row<10;row++)for(let col=0;col<12;col++){
      const x=-2.8+col*.5+(row%2)*.23,z=-2.1+row*.46;
      if(x>3||Math.abs(x)>3.1||Math.abs(z)>2.2)continue;
      box(.46,.035,.42,['#b9b5a3','#c6bfab','#a9aa98'][(row+col)%3],x,.03,z);
    }
    // Workbench: its lower height leaves the adult's face and shoulders visible.
    const table=group(0,0,.72);
    for(const x of [-1.06,1.06])for(const z of [-.4,.4])box(.07,.92,.07,'#64543b',x,.5,z,table);
    for(let i=0;i<8;i++)box(2.4,.065,.125,i%2?'#ad8756':'#b99260',0,.98,-.45+i*.13,table);
    line([[-1.09,.38,-.38],[1.09,.38,-.38]],'#6d5a3f',.035,table);
    // Small objects anchor the task: twine, shears, wrapping paper and trimmed leaves.
    cylinder(.12,.12,'#c3af80',.85,1.09,.72);
    box(.42,.008,.58,'#ded0b1',.55,1.02,.92);
    line([[.65,1.03,.35],[.9,1.03,.58]],'#4d5850',.022);
    line([[.92,1.03,.35],[.69,1.03,.58]],'#4d5850',.022);
    for(let i=0;i<8;i++){const leaf=ball(.065,'#637a47',-.8+W.random()*.5,1.03,.6+W.random()*.4);leaf.scale.y*=.14;}
    function flowerPot(x,z,color,height=.5){
      const g=group(x,.06,z);cylinder(.24,height,'#977452',0,height/2,0,g,12);
      cylinder(.21,.025,'#4b4e35',0,height+.01,0,g,12);
      for(let i=0;i<9;i++){
        const a=i/9*TAU,fx=Math.cos(a)*.15,fz=Math.sin(a)*.15,h=height+.32+W.random()*.18;
        line([[fx,height,fz],[fx,h,fz]],'#54744b',.012,g);
        const leaf=ball(.075,'#718a4d',fx+.04,height+.19,fz,g);leaf.scale.set(.075,.025,.04);
        for(let j=0;j<5;j++)ball(.045,color,fx+Math.cos(j/5*TAU)*.043,h,fz+Math.sin(j/5*TAU)*.043,g);
        ball(.025,'#d3af52',fx,h+.02,fz,g);
      }
    }
    flowerPot(-1.9,.5,'#cb7e78');flowerPot(-2.25,-.45,'#e4ce92',.65);flowerPot(2.35,-.8,'#a09cc0');flowerPot(-2.7,1.55,'#eee4cb',.37);
    // Rear trellis, not a roof hiding the work.
    for(const x of [-2.2,2.2])cylinder(.045,2.4,'#6d7254',x,1.24,-2.05);
    for(let y=.7;y<2.3;y+=.25)line([[-2.2,y,-2.05],[2.2,y,-2.05]],'#9eab87',.012);
    for(let i=0;i<22;i++){const x=-2.05+i*.19,y=.75+.5*Math.sin(i*.45)+i*.045;ball(.11,i%2?'#788e56':'#667f4e',x,y,-2.02);}
    W.bench(2.0,-1.55,0);
    const florist=W.person(0,-.12,'#ece3cd','#3a4e4d',1,'#c3906d');florist.root.position.y=.005;
    // Apron follows the chest and does not replace the human's anatomical silhouette.
    box(.31,.43,.018,'#9d684d',0,.29,.133,florist.chest);
    for(const x of [-.12,.12])box(.025,.25,.018,'#9d684d',x,.52,.133,florist.chest);
    box(.14,.11,.018,'#88563e',0,.21,.151,florist.chest);
    const bouquet=group(0,1.1,.26),leftGrip=group(-.085,.015,0,bouquet),rightGrip=group(.085,.015,0,bouquet);
    for(let i=0;i<11;i++){
      const a=i/11*TAU,dx=Math.cos(a)*.15,dz=Math.sin(a)*.13,h=.28+(i%3)*.035;
      line([[0,-.14,0],[dx,h,dz]],'#4e7950',.011,bouquet);
      for(let j=0;j<5;j++)ball(.048,['#bf6a6d','#e0c99c','#d9967b'][i%3],dx+Math.cos(j/5*TAU)*.04,h,dz+Math.sin(j/5*TAU)*.04,bouquet);
      ball(.026,'#b79d49',dx,h+.02,dz,bouquet);
    }
    W.ring(.073,'#cfb47c',0,.015,0,bouquet,.018);
    const ribbon=box(.18,.015,.04,'#dbbda1',0,.015,.08,bouquet);
    const customer=W.person(1.55,1.15,'#889caa','#3f4140',.94,'#8e624d');customer.root.rotation.y=-Math.PI/2;customer.root.position.y=.005;
    const bag=group(0,-.22,0,customer.leftHand);box(.23,.3,.16,'#c5a772',0,0,0,bag);line([[-.07,.15,0],[-.07,.24,0],[.07,.24,0],[.07,.15,0]],'#957744',.014,bag);
    // A sleeping cat supplies one quiet secondary silhouette.
    const cat=group(-2.6,.14,-1.35);const body=ball(.19,'#b79b70',0,0,0,cat);body.scale.z*=1.7;
    ball(.13,'#b79b70',0,.07,.23,cat);for(const x of [-.08,.08]){const ear=box(.07,.12,.06,'#a4875e',x,.19,.24,cat);ear.rotation.z=x<0?.2:-.2;}
    const tail=line([[.1,0,-.24],[.26,.03,-.25],[.28,.04,-.05]],'#a4875e',.035,cat);
    const v=new W.THREE.Vector3();return{florist,customer,bouquet,leftGrip,rightGrip,ribbon,tail,v,palms:{}};
  },
  tick({t,parts:p,W}){
    const q=t/duration,turn=Math.sin(q*TAU),lift=.11*Math.max(0,Math.sin((q-.08)*TAU))**2;
    W.plant(p.florist,{crouch:.035+.025*(1-turn),lean:.09+.035*turn,twist:.065*turn});
    p.florist.head.rotation.set(.15+.05*turn,-.09*turn,0);
    p.bouquet.position.set(.025*turn,1.1+lift,.26);p.bouquet.rotation.set(.04*turn,.2*turn,.035*Math.sin(q*TAU*2));
    p.bouquet.updateMatrixWorld(true);
    for(const [side,anchor] of [[-1,p.leftGrip],[1,p.rightGrip]]){anchor.getWorldPosition(p.v);p.palms[side]=W.reach(p.florist,side,p.v.toArray());}
    p.florist.rightHand.rotation.z=.1*Math.sin(q*TAU*2);p.ribbon.rotation.y=.08*Math.sin(q*TAU*2);
    W.plant(p.customer,{crouch:.015,lean:.025,twist:.025*Math.sin(q*TAU)});
    W.reach(p.customer,-1,[1.27,1.1,1.15]);W.reach(p.customer,1,[1.35,1.13,1.3]);p.customer.head.rotation.y=.1*Math.sin(q*TAU);
    p.tail.rotation.y=.08*Math.sin(q*TAU);
  },
  contacts({parts:p}){
    const checks=[[-1,p.leftGrip],[1,p.rightGrip]].map(([side,anchor])=>{anchor.getWorldPosition(p.v);return{label:`florist palm ${side} grips bouquet`,a:p.palms[side],b:p.v.toArray()};});
    for(const actor of [p.florist,p.customer])for(const side of [-1,1]){const foot=side<0?actor.leftFoot:actor.rightFoot;foot.getWorldPosition(p.v);const a=p.v.toArray();p.v.set(side*.13,.09,0);actor.root.localToWorld(p.v);checks.push({label:'planted ankle stays over its support',a,b:p.v.toArray()});}
    return checks;
  }
});

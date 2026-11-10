import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-fake-device-for-media-stream'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
p.on('console',m=>{if(m.type()==='error')console.log('ERR:',m.text().slice(0,180));});
await p.goto('http://localhost:5173/#/studio',{waitUntil:'networkidle'});
await p.waitForTimeout(2200);
await p.getByRole('button',{name:/gallery|presets/i}).first().click().catch(()=>{});
await p.waitForTimeout(700);
const modal = p.locator('div.fixed.inset-0.z-50').filter({hasText:'Benchmark Gallery'}).first();
await modal.locator('div.p-4.rounded-2xl').filter({hasText:/coffee|harbour|lighthouse/i}).first().click({force:true});
await p.waitForTimeout(3200);
await p.getByRole('button',{name:/clip/i}).first().click();
await p.locator('[role="dialog"][aria-label="Turntable clip"]').waitFor({timeout:30000});
// seek to a known-good time and decode before reading pixels
const r = await p.evaluate(async () => {
  const v=document.querySelector('[role="dialog"] video');
  if(v.readyState<2) await new Promise(res=>v.addEventListener('loadeddata',res,{once:true}));
  v.currentTime = 1.5;
  await new Promise(res=>v.addEventListener('seeked',res,{once:true}));
  v.pause();
  const c=document.createElement('canvas');c.width=v.videoWidth;c.height=v.videoHeight;
  const ctx=c.getContext('2d');ctx.drawImage(v,0,0);
  const d=ctx.getImageData(0,0,c.width,c.height).data;
  const set=new Set();for(let i=0;i<d.length;i+=4*97)set.add(d[i]+','+d[i+1]+','+d[i+2]);
  const cx=Math.floor(c.width/2),cy=Math.floor(c.height/2);
  const mid=ctx.getImageData(cx-150,cy-150,300,300).data;
  const ms=new Set();for(let i=0;i<mid.length;i+=4)ms.add(mid[i]+','+mid[i+1]+','+mid[i+2]);
  // letterbox rows
  const rowUniform=y=>{const i0=(y*c.width)*4;const r0=d[i0],g0=d[i0+1],b0=d[i0+2];let same=0;
    for(let x=0;x<c.width;x+=4){const i=(y*c.width+x)*4;
      if(Math.abs(d[i]-r0)<6&&Math.abs(d[i+1]-g0)<6&&Math.abs(d[i+2]-b0)<6)same++;}
    return same/(c.width/4)>0.985;};
  let top=0;while(top<c.height&&rowUniform(top))top++;
  let bot=0;while(bot<c.height&&rowUniform(c.height-1-bot))bot++;
  return {w:c.width,h:c.height,distinct:set.size,centre:ms.size,topBar:top,bottomBar:bot};
});
console.log(JSON.stringify(r));
console.log(r.w===r.h?'SQUARE: YES':'SQUARE: NO');
console.log(r.centre>8?'SCENE VISIBLE IN CENTRE: YES':'SCENE VISIBLE IN CENTRE: NO (blank)');
console.log(`LETTERBOX: top ${r.topBar}px bottom ${r.bottomBar}px`);
await p.screenshot({path:'shots/clip-square.png'});
await b.close();

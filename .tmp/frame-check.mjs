import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto('http://localhost:5173/#/studio',{waitUntil:'networkidle'});
await p.waitForTimeout(2200);
await p.getByRole('button',{name:/gallery|presets/i}).first().click().catch(()=>{});
await p.waitForTimeout(700);
const modal = p.locator('div.fixed.inset-0.z-50').filter({hasText:'Benchmark Gallery'}).first();
await modal.locator('div.p-4.rounded-2xl').filter({hasText:/coffee|harbour|lighthouse/i}).first().click({force:true});
await p.waitForTimeout(3200);
await p.getByRole('button',{name:/clip/i}).first().click();
await p.locator('[role="dialog"][aria-label="Turntable clip"]').waitFor({timeout:30000});
await p.waitForTimeout(1800);

// Draw the recorded video into a canvas at native size and measure rows/cols.
const stats = await p.evaluate(async () => {
  const v = document.querySelector('[role="dialog"] video');
  await new Promise(r => (v.readyState >= 2 ? r() : v.addEventListener('loadeddata', r, {once:true})));
  const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
  const ctx = c.getContext('2d'); ctx.drawImage(v, 0, 0);
  const { data } = ctx.getImageData(0,0,c.width,c.height);
  const rowUniform = (y) => {
    let r0=data[(y*c.width)*4], g0=data[(y*c.width)*4+1], b0=data[(y*c.width)*4+2], same=0;
    for (let x=0;x<c.width;x+=4){const i=(y*c.width+x)*4;
      if(Math.abs(data[i]-r0)<6&&Math.abs(data[i+1]-g0)<6&&Math.abs(data[i+2]-b0)<6) same++;}
    return same/(c.width/4) > 0.985;
  };
  let top=0; while(top<c.height && rowUniform(top)) top++;
  let bottom=0; while(bottom<c.height && rowUniform(c.height-1-bottom)) bottom++;
  return { w:c.width, h:c.height, topBar:top, bottomBar:bottom, contentH:c.height-top-bottom };
});
console.log(JSON.stringify(stats));
console.log(stats.w===stats.h ? 'SQUARE canvas: YES' : 'SQUARE canvas: NO');
console.log(stats.topBar>0||stats.bottomBar>0 ? `letterboxed: YES (top ${stats.topBar}px, bottom ${stats.bottomBar}px)` : 'letterboxed: NO');
await b.close();

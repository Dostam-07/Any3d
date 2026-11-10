import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-fake-device-for-media-stream'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
await p.goto('http://localhost:5173/#/studio',{waitUntil:'networkidle'});
await p.waitForTimeout(2200);
await p.getByRole('button',{name:/gallery|presets/i}).first().click().catch(()=>{});
await p.waitForTimeout(700);
const modal = p.locator('div.fixed.inset-0.z-50').filter({hasText:'Benchmark Gallery'}).first();
await modal.locator('div.p-4.rounded-2xl').filter({hasText:/coffee|harbour|lighthouse/i}).first().click({force:true});
await p.waitForTimeout(3200);
const d = await p.locator('iframe').first().evaluate(f=>{
  const s=f.contentDocument.querySelector('svg');
  return {attrW:s.getAttribute('width'),attrH:s.getAttribute('height'),attrVB:s.getAttribute('viewBox'),
    clientW:s.clientWidth,clientH:s.clientHeight,bbox:s.getBoundingClientRect().width+'x'+s.getBoundingClientRect().height};
});
console.log(JSON.stringify(d,null,1));
await b.close();

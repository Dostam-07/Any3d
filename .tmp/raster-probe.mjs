import { chromium } from 'playwright';
const b = await chromium.launch({ args:['--use-fake-device-for-media-stream'] });
const p = await b.newPage({ viewport:{width:1440,height:900} });
p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE ERR:',m.text().slice(0,200));});
await p.goto('http://localhost:5173/#/studio',{waitUntil:'networkidle'});
await p.waitForTimeout(2200);
await p.getByRole('button',{name:/gallery|presets/i}).first().click().catch(()=>{});
await p.waitForTimeout(700);
const modal = p.locator('div.fixed.inset-0.z-50').filter({hasText:'Benchmark Gallery'}).first();
await modal.locator('div.p-4.rounded-2xl').filter({hasText:/coffee|harbour|lighthouse/i}).first().click({force:true});
await p.waitForTimeout(3200);

const res = await p.locator('iframe').first().evaluate(async (f) => {
  const svg = f.contentDocument.querySelector('svg');
  const W=400,H=400;
  const clone = svg.cloneNode(true);
  clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
  clone.removeAttribute('width'); clone.removeAttribute('height');
  clone.setAttribute('viewBox', svg.getAttribute('viewBox') || `0 0 ${svg.clientWidth} ${svg.clientHeight}`);
  clone.style.width='100%'; clone.style.height='100%';
  clone.setAttribute('preserveAspectRatio','xMidYMid meet');
  const markup = new XMLSerializer().serializeToString(clone);
  const url = URL.createObjectURL(new Blob([markup],{type:'image/svg+xml;charset=utf-8'}));
  const img = new Image();
  const loaded = await new Promise(r=>{img.onload=()=>r('ok');img.onerror=e=>r('err');img.src=url;});
  if(loaded!=='ok') return {loaded, markupLen:markup.length, head:markup.slice(0,300)};
  const c=document.createElement('canvas');c.width=W;c.height=H;
  const ctx=c.getContext('2d');ctx.fillStyle='#ff00ff';ctx.fillRect(0,0,W,H);
  ctx.drawImage(img,0,0,W,H);
  const d=ctx.getImageData(0,0,W,H).data;const set=new Set();
  for(let i=0;i<d.length;i+=4*53)set.add(d[i]+','+d[i+1]+','+d[i+2]);
  return {loaded, natural:[img.naturalWidth,img.naturalHeight], distinct:set.size,
    hasMagentaOnly: set.size===1, colors:[...set].slice(0,6), styleAttrs: clone.getAttribute('style')};
});
console.log(JSON.stringify(res,null,1));
await b.close();

const { chromium } = require('/tmp/claude-0/-home-user-tractor-dce-gyo/b21185a2-d8da-5a8b-a513-fb5198b36494/scratchpad/node_modules/playwright');
const D='/home/user/tractor-dce-gyo/slipcase-build/desk/', O='/home/user/tractor-dce-gyo/slipcase-build/work/';
(async()=>{
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  for (const [name, vp] of [['desktop',{width:1280,height:800}],['phone',{width:390,height:844}]]) {
    const p = await b.newPage({ viewport: vp }); const errs=[];
    p.on('pageerror', e=>errs.push(e.message.slice(0,200))); p.on('console', m=>{ if(m.type()==='error') errs.push('C '+m.text().slice(0,200)); });
    await p.goto('file://'+D+'index.html', { waitUntil:'load' }); await p.waitForTimeout(800);
    const modes = await p.evaluate(()=>{ const out={}; for (const m of ['DECK','READ','GRAPH','SOURCES','BIBLIOGRAPHY','GHOSTS','MOCS','TRAIL']) { document.querySelector(`nav.modes button[data-mode="${m}"]`).click(); out[m]=document.querySelector('main').innerText.length; } return out; });
    await p.evaluate(()=>{ document.querySelector('nav.modes button[data-mode="DECK"]').click(); document.querySelector('#search').value='beaver'; document.querySelector('#search').dispatchEvent(new Event('input')); });
    const hits = await p.evaluate(()=>document.querySelectorAll('main .row').length);
    await p.evaluate(()=>document.querySelector('main .row').click()); await p.waitForTimeout(200);
    const readLen = await p.evaluate(()=>document.querySelector('pre.payload') ? document.querySelector('pre.payload').textContent.length : -1);
    const vh = await p.evaluate(async()=>{ if(!(window.crypto&&crypto.subtle)) return 'no subtle'; let ok=0; for(const z of window.SLIP.zettels){ const h=[...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(z.payload)))].map(b=>b.toString(16).padStart(2,'0')).join(''); if(h===z.sha256) ok++; } return ok+'/'+window.SLIP.zettels.length; });
    await p.screenshot({ path: O+`desk-${name}.png` });
    console.log(name, 'modes', JSON.stringify(modes), '| search beaver hits', hits, '| read payload chars', readLen, '| in-page hash check', vh, '| errors', errs.length ? errs : 'none');
    await p.close();
  }
  for (const f of ['READER.html','NETWORK.html','CARDS.html','000__BIBLIOGRAPHY.html','the-field-not-the-window__2026-09-03.html']) {
    const p = await b.newPage({ viewport:{width:1280,height:800} }); const errs=[]; p.on('pageerror', e=>errs.push(e.message.slice(0,120)));
    await p.goto('file://'+D+f, { waitUntil:'load' }); await p.waitForTimeout(500);
    await p.screenshot({ path: O+'desk-'+f.replace(/[^a-z0-9]+/gi,'_')+'.png' });
    console.log(f, 'text chars', (await p.evaluate(()=>document.body.innerText.length)), 'errors', errs.length?errs:'none');
    await p.close();
  }
  await b.close();
})();

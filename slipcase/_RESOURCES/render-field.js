const { chromium } = require('/tmp/claude-0/-home-user-tractor-dce-gyo/b21185a2-d8da-5a8b-a513-fb5198b36494/scratchpad/node_modules/playwright'); const fs = require('fs');
const SP = '/tmp/claude-0/-home-user-tractor-dce-gyo/b21185a2-d8da-5a8b-a513-fb5198b36494/scratchpad';
const { bare, frameTight } = require(SP + '/shot.js');
const DIR = '/home/user/tractor-dce-gyo/slipcase-build/work/field';
(async()=>{
  const files = fs.readdirSync(DIR).filter(f=>f.endsWith('.mpd') && /card-castle|gauntlet-shore|card-fallingwater/.test(f)).sort();
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport:{width:900,height:600}, deviceScaleFactor:1 });
  await ctx.route('**/cdn.jsdelivr.net/**', async r=>{ const u=r.request().url();
    let f=null; if(u.includes('three.min.js')) f=SP+'/node_modules/three/build/three.min.js';
    else if(u.includes('OrbitControls')) f=SP+'/node_modules/three/examples/js/controls/OrbitControls.js';
    return r.fulfill({status:200,contentType:'application/javascript',body: f?fs.readFileSync(f,'utf8'):''}); });
  const p = await ctx.newPage();
  await p.goto('http://localhost:8899/kits.html',{waitUntil:'load',timeout:60000});
  await p.waitForTimeout(14000);
  await bare(p);
  for (const f of files) {
    const id = f.replace(/\.mpd$/,'');
    try {
      const n = await p.evaluate(async name => { const S = window.KitsPage, U = window.NabugoUI;
        const r = await fetch('./slipcase-build/work/field/'+name); if(!r.ok) return -1; const t = await r.text();
        await U.render(S.viewer, t, null, name); return (t.match(/^1 /gm)||[]).length; }, f);
      await frameTight(p);
      await p.locator('.hx-bed').screenshot({ path: DIR+'/'+id+'.png', timeout: 90000 });
      console.log('shot', id, n);
    } catch (e) { console.log('ERR', id, e.message.slice(0,80)); }
  }
  await b.close();
})();

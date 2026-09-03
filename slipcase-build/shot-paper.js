const { chromium } = require('/tmp/claude-0/-home-user-tractor-dce-gyo/b21185a2-d8da-5a8b-a513-fb5198b36494/scratchpad/node_modules/playwright');
(async()=>{ const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
  const p = await b.newPage({ viewport:{width:794,height:1123} });
  await p.goto('file:///home/user/tractor-dce-gyo/slipcase-build/desk/the-field-not-the-window__2026-09-03.html',{waitUntil:'load'}); await p.waitForTimeout(500);
  const h = await p.evaluate(()=>document.body.scrollHeight); console.log('height', h);
  for (let i=0;i*1100<h && i<8;i++){ await p.evaluate(y=>window.scrollTo(0,y), i*1100); await p.waitForTimeout(100); await p.screenshot({ path:`/home/user/tractor-dce-gyo/slipcase-build/work/paper-${i}.png` }); }
  await b.close(); })();

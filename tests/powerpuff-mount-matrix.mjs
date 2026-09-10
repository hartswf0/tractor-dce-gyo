import {chromium} from 'playwright';
import fs from 'node:fs';
fs.mkdirSync('powerpuff-matrix',{recursive:true});
const figures=['blossom','bubbles','buttercup'];
const ys=[-88,-84,-80,-76,-72,-68,-64,-60];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const results=[];
for(const figure of figures){
  for(const y of ys){
    const errors=[];
    page.removeAllListeners('pageerror');page.removeAllListeners('console');
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error'&&!/glReadPixels|404 \(File not found\)/i.test(m.text()))errors.push(m.text())});
    await page.goto(`http://127.0.0.1:4173/screen-piece-index.html?figure=${figure}&headY=${y}`,{waitUntil:'networkidle',timeout:120000});
    await page.waitForFunction(()=>window.__MOVIEATOR_READY===true,{timeout:120000});
    await page.waitForTimeout(220);
    const sniff=await page.evaluate(()=>window.__MOVIEATOR_SNIFF);
    const file=`powerpuff-matrix/${figure}_${String(y).replace('-','m')}.png`;
    await page.screenshot({path:file});
    results.push({figure,y,sniff,errors});
    console.log(`${figure} y=${y} ${sniff?.pass?'PASS':'FAIL'} ${JSON.stringify(sniff?.size)} ${errors.join(' | ')}`);
  }
}
await browser.close();
fs.writeFileSync('powerpuff-matrix/results.json',JSON.stringify(results,null,2));

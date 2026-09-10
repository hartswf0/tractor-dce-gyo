import { chromium } from 'playwright';
import fs from 'node:fs';
fs.mkdirSync('sniff-v2',{recursive:true});
const ids=['homer','marge','bart','lisa','ned','vader','yoda','blossom','bubbles','buttercup','shaggy','fred','gremlin'];
const IGNORE=/GL_INVALID_OPERATION: glReadPixels: Invalid format and type combination/;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const results=[];
for(const id of ids){
 const errors=[]; page.removeAllListeners('pageerror'); page.removeAllListeners('console');
 page.on('pageerror',e=>errors.push('pageerror: '+e.message));
 page.on('console',m=>{if(m.type()==='error'&&!IGNORE.test(m.text()))errors.push('console: '+m.text())});
 await page.goto(`http://127.0.0.1:4173/screen-piece-index-test.html?figure=${id}`,{waitUntil:'networkidle',timeout:120000});
 await page.waitForFunction(()=>window.__MOVIEATOR_READY===true,{timeout:120000}); await page.waitForTimeout(250);
 const sniff=await page.evaluate(()=>window.__MOVIEATOR_SNIFF);
 if(errors.length){sniff.pass=false;sniff.problems=[...(sniff.problems||[]),...errors]}
 await page.screenshot({path:`sniff-v2/${id}.png`}); results.push(sniff);
 console.log(`${sniff.pass?'PASS':'FAIL'} ${id} ${JSON.stringify(sniff.size)} ${(sniff.problems||[]).join(' | ')}`);
}
await browser.close(); fs.writeFileSync('sniff-v2-results.json',JSON.stringify(results,null,2));
console.log(`SUMMARY ${results.filter(r=>r.pass).length}/${results.length}`); if(results.some(r=>!r.pass))process.exit(1);

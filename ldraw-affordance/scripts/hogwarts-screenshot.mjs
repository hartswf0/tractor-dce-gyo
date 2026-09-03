import {chromium} from 'playwright';
import fs from 'node:fs';

const base=process.env.HOGWARTS_PREVIEW_URL||'http://127.0.0.1:8765/ldraw-affordance/beaver-hogwarts/show.html';
const source=encodeURIComponent('../target/71043.ldr');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1400,height:980},deviceScaleFactor:1});
page.on('console',msg=>console.log(`BROWSER ${msg.type()} ${msg.text()}`));
page.on('pageerror',err=>console.error(`BROWSER ERROR ${err.stack||err.message}`));

async function shot(mode,file){
  console.log(`RENDER ${mode.toUpperCase()}…`);
  await page.goto(`${base}?source=${source}&mode=${mode}`,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>document.body.dataset.renderReady==='1'||document.body.dataset.renderReady==='error',null,{timeout:180000});
  const state=await page.evaluate(()=>document.body.dataset.renderReady);
  if(state!=='1')throw new Error(`viewer failed in ${mode} mode`);
  await page.waitForTimeout(1500);
  await page.screenshot({path:file,fullPage:true});
  console.log(`SCREENSHOT ${file}`);
}

fs.mkdirSync('target',{recursive:true});
await shot('target','target/hogwarts-target.png');
await shot('proof','target/hogwarts-proof-25.png');
await browser.close();

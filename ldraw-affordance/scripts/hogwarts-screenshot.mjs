import {chromium} from 'playwright';
import fs from 'node:fs';

const base=process.env.HOGWARTS_PREVIEW_URL||'http://127.0.0.1:8765/ldraw-affordance/beaver-hogwarts/show.html';
const source=encodeURIComponent('../target/71043.ldr');
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-swiftshader','--disable-gpu-vsync']});
const page=await browser.newPage({viewport:{width:1100,height:760},deviceScaleFactor:1});
page.setDefaultTimeout(180000);
page.on('console',msg=>{if(msg.type()==='error')console.log(`BROWSER ${msg.type()} ${msg.text()}`)});
page.on('pageerror',err=>console.error(`BROWSER ERROR ${err.stack||err.message}`));
const missing=new Set();
page.on('response',r=>{if(r.status()===404&&missing.size<30&&!missing.has(r.url())){missing.add(r.url());console.log(`HTTP404 ${r.url()}`)}});

async function shot(mode,file){
  console.log(`RENDER ${mode.toUpperCase()}…`);
  await page.goto(`${base}?source=${source}&mode=${mode}&static=1`,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>document.body.dataset.renderReady==='1'||document.body.dataset.renderReady==='error',null,{timeout:180000});
  const info=await page.evaluate(()=>({state:document.body.dataset.renderReady,pieces:document.body.dataset.renderedPieces,mode:document.body.dataset.mode}));
  if(info.state!=='1')throw new Error(`viewer failed in ${mode} mode`);
  console.log(`READY ${info.mode} · ${info.pieces} pieces`);
  await page.waitForTimeout(500);
  await page.screenshot({path:file,fullPage:false,timeout:120000,animations:'disabled'});
  console.log(`SCREENSHOT ${file}`);
}

fs.mkdirSync('target',{recursive:true});
await shot('target','target/hogwarts-target.png');
await shot('proof','target/hogwarts-proof-25.png');
console.log(`UNIQUE_404 ${missing.size}`);
await browser.close();

// actor-kit v2 visual gate
import {chromium} from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl']});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const errs=[];page.on('pageerror',e=>{if(errs.length<10)errs.push('PAGE '+(e.stack||e.message))});page.on('console',m=>{if(m.type()==='error'&&!/GL_INVALID_OPERATION|Failed to load resource.*404/.test(m.text())&&errs.length<10)errs.push('CONSOLE '+m.text())});
await page.goto('http://127.0.0.1:4173/from-homer-to-homer.html',{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForFunction(()=>window.__HOMER_TO_HOMER?.LIVE_FACE_CAST?.length>=23,{timeout:60000});await page.waitForTimeout(2600);
fs.mkdirSync('homer-sniff',{recursive:true});
const base=await page.evaluate(()=>({sel:window.__HOMER_TO_HOMER.selection,sourceCanvases:document.querySelectorAll('#sourceHost canvas').length,webgl:document.querySelectorAll('#actorHost canvas').length,title:document.querySelector('header strong')?.textContent}));
await page.screenshot({path:'homer-sniff/odysseus-recognition-mobile.png',fullPage:true});
await page.getByRole('button',{name:'ASSEMBLY'}).click();await page.getByRole('button',{name:'HEAD / MAKEUP'}).click();await page.waitForTimeout(900);await page.screenshot({path:'homer-sniff/odysseus-head-mobile.png',fullPage:true});
await page.getByRole('button',{name:'CAST'}).click();await page.getByRole('button',{name:/Poseidon/}).click();await page.getByRole('button',{name:'ASSEMBLY'}).click();await page.getByRole('button',{name:'FULL BODY'}).click();await page.waitForTimeout(1000);await page.screenshot({path:'homer-sniff/poseidon-full-mobile.png',fullPage:true});
await page.getByRole('button',{name:'HEAD / MAKEUP'}).click();await page.waitForTimeout(800);await page.screenshot({path:'homer-sniff/poseidon-head-mobile.png',fullPage:true});
await page.getByRole('button',{name:'COMPARE'}).click();await page.waitForTimeout(900);await page.screenshot({path:'homer-sniff/recognition-compare-mobile.png',fullPage:true});
await page.getByRole('button',{name:'CAST'}).click();await page.getByRole('button',{name:/Penelope/}).click();await page.getByRole('button',{name:'PERFORMANCE'}).click();await page.getByRole('button',{name:'RECOGNITION'}).click();await page.waitForTimeout(900);await page.screenshot({path:'homer-sniff/penelope-recognition-mobile.png',fullPage:true});
const after=await page.evaluate(()=>window.__HOMER_TO_HOMER.selection);
const pass=base.sourceCanvases===1&&base.webgl===1&&/FROM HOMER TO HOMER/.test(base.title||'')&&base.sel.character==='odysseus'&&after.character==='penelope'&&after.performance==='recognition'&&errs.length===0;
fs.writeFileSync('homer-sniff/results.json',JSON.stringify({pass,base,after,errs},null,2));console.log(JSON.stringify({pass,base,after,errs},null,2));await browser.close();if(!pass)process.exit(1);

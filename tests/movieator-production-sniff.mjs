import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const out='movieator-sniff';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const failures=[],consoleLines=[];
page.on('pageerror',e=>{failures.push(`PAGEERROR ${e.message}`);consoleLines.push(`PAGEERROR ${e.stack||e.message}`)});
page.on('console',m=>consoleLines.push(`${m.type().toUpperCase()} ${m.text()}`));

async function shot(name){await page.screenshot({path:path.join(out,`${name}.png`),fullPage:false});}
function assert(cond,msg){if(!cond)failures.push(msg)}
async function select(id,value){await page.selectOption(id,value);await page.waitForTimeout(300)}
async function tab(label){await page.getByRole('button',{name:label,exact:true}).click();await page.waitForTimeout(150)}

try{
  await page.goto('http://127.0.0.1:4173/movieator-production-v2.html',{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForTimeout(1200);
  await shot('00-startup');
  await page.waitForFunction(()=>document.querySelector('#rigReady')?.textContent.includes('5/5'),{timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#ldrawReady')?.textContent.includes('READY'),{timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#catalogReady')?.textContent.includes('READY'),{timeout:60000});
  await page.waitForTimeout(700);
  await shot('01-initial-homer');

  await page.getByRole('button',{name:'HMU',exact:true}).click();
  await tab('HAIR / HAT');
  const homerBlocked=await page.locator('#trayBody').innerText();
  assert(/BLOCKED/.test(homerBlocked)&&/NO CROWN PORT/.test(homerBlocked),'Homer prosthetic allowed arbitrary headwear');
  const viewBox1=await page.locator('#view').boundingBox();
  assert(viewBox1&&viewBox1.height>=200,'Actor viewport collapsed under HMU tray');
  await shot('02-homer-hair-blocked');

  await page.getByRole('button',{name:'CLOSE',exact:true}).click();
  await select('#world','scooby-doo');
  await select('#figure','fred');
  await page.getByRole('button',{name:'HMU',exact:true}).click();
  await tab('HAIR / HAT');
  const hq=page.locator('#q');
  await hq.fill('Shaggy Rogers');
  const hair=page.locator('[data-probe="21787.dat"]');
  await hair.waitFor({state:'visible',timeout:10000});
  await page.waitForFunction(()=>{const b=document.querySelector('[data-probe="21787.dat"]');return b&&!b.disabled&&b.textContent.includes('CLICK')},{timeout:20000});
  await hair.click();
  await page.waitForTimeout(500);
  assert(!(await page.locator('#portBadge').innerText()).includes('LOAD ERROR'),'Compatible headwear produced LDraw load error');
  await shot('03-fred-shaggy-hair-click');

  await page.getByRole('button',{name:'PROPS',exact:true}).click();
  await tab('RIGHT HAND');
  const pq=page.locator('#q');
  await pq.fill('Axe with Pick End and Long Handle');
  const axe=page.locator('[data-probe="39802.dat"]');
  await axe.waitFor({state:'visible',timeout:10000});
  await page.waitForFunction(()=>{const b=document.querySelector('[data-probe="39802.dat"]');return b&&!b.disabled&&b.textContent.includes('CLICK')},{timeout:30000});
  await axe.click();
  await page.waitForTimeout(700);
  assert(!(await page.locator('#portBadge').innerText()).includes('LOAD ERROR'),'Mechanically verified axe failed to render');
  await shot('04-fred-axe-right-hand');

  await tab('CLOCK');
  const rightSection=page.locator('.section').filter({hasText:'RIGHT HAND'});
  const clock90=rightSection.getByRole('button',{name:'90°',exact:true});
  if(await clock90.isEnabled()){await clock90.click();await page.waitForTimeout(500)}
  await shot('05-fred-axe-clock-90');

  await page.getByRole('button',{name:'PIECES',exact:true}).click();
  await page.waitForTimeout(150);
  const pieces=await page.locator('#trayBody').innerText();
  assert(/39802\.dat/.test(pieces),'Committed hand prop missing from PIECES');
  assert(!/PROBE/.test(pieces),'Uncommitted probe candidates leaked into PIECES');
  await shot('06-pieces-committed');
}catch(e){failures.push(`TEST EXCEPTION ${e.message}`);try{await shot('99-failure')}catch{}}

const state={failures,rig:await page.locator('#rigReady').innerText().catch(()=>''),ldraw:await page.locator('#ldrawReady').innerText().catch(()=>''),catalog:await page.locator('#catalogReady').innerText().catch(()=>''),console:consoleLines.slice(-120)};
await fs.writeFile(path.join(out,'result.json'),JSON.stringify(state,null,2));
await fs.writeFile(path.join(out,'console.txt'),consoleLines.join('\n'));
await browser.close();
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('MOVIEATOR PRODUCTION SNIFF PASS');

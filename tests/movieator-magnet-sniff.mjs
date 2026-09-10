import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const out='movieator-magnet-sniff';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
const failures=[],consoleLines=[];
page.on('pageerror',e=>{failures.push(`PAGEERROR ${e.message}`);consoleLines.push(`PAGEERROR ${e.stack||e.message}`)});
page.on('console',m=>consoleLines.push(`${m.type().toUpperCase()} ${m.text()}`));
const assert=(c,m)=>{if(!c)failures.push(m)};
const shot=async n=>page.screenshot({path:path.join(out,`${n}.png`),fullPage:false});
const select=async(id,value)=>{await page.selectOption(id,value);await page.waitForTimeout(350)};
const tab=async label=>{await page.getByRole('button',{name:label,exact:true}).click();await page.waitForTimeout(160)};

try{
  await page.goto('http://127.0.0.1:4173/movieator-production.html',{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>window.__MOVIEATOR_READY===true,{timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#rigReady')?.textContent.includes('6/6'),{timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#ldrawReady')?.textContent.includes('READY'),{timeout:30000});
  await page.waitForFunction(()=>document.querySelector('#catalogReady')?.textContent.includes('READY'),{timeout:60000});
  await page.waitForTimeout(500);await shot('00-homer');

  await page.getByRole('button',{name:'HMU',exact:true}).click();await tab('HAIR / HAT');
  let txt=await page.locator('#trayBody').innerText();
  assert(/BLOCKED/.test(txt)&&/NO CROWN PORT/.test(txt),'Homer prosthetic did not block arbitrary crown headwear');
  assert((await page.locator('#view').boundingBox())?.height>=200,'HMU tray hid the actor');
  await shot('01-homer-no-crown');

  await page.getByRole('button',{name:'CLOSE',exact:true}).click();
  await select('#world','scooby-doo');await select('#figure','fred');
  await page.getByRole('button',{name:'HMU',exact:true}).click();await tab('HAIR / HAT');
  await page.locator('#q').fill('92083');
  const unresolved=page.locator('[data-probe="92083.dat"]');
  if(await unresolved.count()){
    await page.waitForFunction(()=>{const b=document.querySelector('[data-probe="92083.dat"]');return b&&!b.disabled&&!b.textContent.includes('PROBE')},{timeout:20000});
    const s=await unresolved.innerText();
    assert(/TRY|CLICK/.test(s),'Legitimate standard headwear remained falsely BLOCKED');
  }
  await shot('02-fred-headwear-try');

  await tab('FACIAL HAIR');
  const fh=await page.locator('#trayBody').innerText();
  assert(/PRINTED FACIAL HAIR/.test(fh),'Printed facial-hair mode missing');
  const beardRows=await page.locator('#rows .choice').count();
  assert(beardRows>1,'No bearded/stubbled standard heads surfaced');
  await shot('03-facial-hair-heads');

  await tab('PROSTHETIC');
  const yoda=page.locator('[data-pro="13195p01.dat"]');
  await yoda.click();await page.waitForTimeout(300);
  assert(await page.evaluate(()=>window.__MOVIEATOR_STATE.look.prosthetic?.filename==='13195p01.dat'),'Could not mount test prosthetic');
  await page.getByRole('button',{name:'CLOSE',exact:true}).click();
  await select('#figure','shaggy');
  assert(await page.evaluate(()=>window.__MOVIEATOR_STATE.look.prosthetic===null),'Actor switch leaked prior prosthetic');
  await select('#figure','fred');

  await page.getByRole('button',{name:'PROPS',exact:true}).click();await tab('RIGHT HAND');
  await page.locator('#q').fill('Axe with Pick End and Long Handle');
  const axe=page.locator('[data-probe="39802.dat"]');
  await axe.waitFor({state:'visible',timeout:10000});
  await page.waitForFunction(()=>{const b=document.querySelector('[data-probe="39802.dat"]');return b&&!b.disabled&&!b.textContent.includes('PROBE')},{timeout:30000});
  await axe.click();
  await page.waitForFunction(()=>window.__MOVIEATOR_STATE.look.rightProp?.record?.filename==='39802.dat',{timeout:30000});
  await page.waitForTimeout(500);
  const grip=await page.evaluate(async()=>{
    const s=window.__MOVIEATOR_STATE.look.rightProp,rig=await import('./movieator-rig-v3.js');
    const p=s.pose,seg=p.segment,f=p.fraction;
    const local=seg.origin.map((v,i)=>v+seg.axis[i]*seg.length*f),m=p.matrix,t=p.t;
    const world=[m[0]*local[0]+m[1]*local[1]+m[2]*local[2]+t[0],m[3]*local[0]+m[4]*local[1]+m[5]*local[2]+t[1],m[6]*local[0]+m[7]*local[1]+m[8]*local[2]+t[2]];
    const center=rig.handFrame('right').center;
    const distance=Math.hypot(...world.map((v,i)=>v-center[i]));
    return{distance,overlap:p.overlap,clear:p.clear,headDist:p.headDist,clock:p.clock,fraction:p.fraction,radius:seg.radius};
  });
  assert(grip.distance<0.05,`Axe shaft missed claw grip center by ${grip.distance}`);
  assert(grip.overlap>=6,'Axe does not overlap enough of the claw depth');
  assert(grip.radius>=3.2&&grip.radius<=4.8,'Axe shaft radius is outside minifig grip scale');
  assert(grip.clear===true,'Axe pose still intersects head clearance envelope');
  assert(!(await page.locator('#portBadge').innerText()).includes('LOAD ERROR'),'Magnetic axe pose failed to render');
  await shot('04-fred-axe-magnetic-click');

  await page.getByRole('button',{name:'PIECES',exact:true}).click();await page.waitForTimeout(200);
  const pieces=await page.locator('#trayBody').innerText();
  assert(/39802\.dat/.test(pieces),'Held axe missing from PIECES');
  assert(/HAND_PROP · CLICK/.test(pieces),'Held prop not recorded as CLICK');
  await shot('05-pieces-click');

  await fs.writeFile(path.join(out,'grip.json'),JSON.stringify(grip,null,2));
}catch(e){failures.push(`TEST EXCEPTION ${e.stack||e.message}`);try{await shot('99-failure')}catch{}}

const state={failures,rig:await page.locator('#rigReady').innerText().catch(()=>''),ldraw:await page.locator('#ldrawReady').innerText().catch(()=>''),catalog:await page.locator('#catalogReady').innerText().catch(()=>''),console:consoleLines.slice(-160)};
await fs.writeFile(path.join(out,'result.json'),JSON.stringify(state,null,2));
await fs.writeFile(path.join(out,'console.txt'),consoleLines.join('\n'));
await browser.close();
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('MOVIEATOR MAGNET SNIFF PASS');

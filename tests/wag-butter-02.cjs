// Run: node tests/wag-butter-02.cjs (requires Playwright).
// Set BROWSER_EXECUTABLE to use an existing Chromium binary.
const {chromium}=require('playwright');const assert=require('node:assert/strict');const path=require('node:path');const {pathToFileURL}=require('node:url');
(async()=>{
const browser=await chromium.launch({...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{}),headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--use-fake-device-for-media-stream','--use-fake-ui-for-media-stream']});
const page=await browser.newPage({viewport:{width:1280,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(path.join(__dirname,'../WAG-HAND-BUTTER.HTML')).href);await page.waitForFunction(()=>WagWorkshop.ready());await page.evaluate(()=>startSound());
// Selecting through the real visible controls.
await page.click('#group');let ids=await page.evaluate(()=>WagWorkshop.state().parts.slice(0,2).map(p=>p.id));
for(const id of ids){const p=await page.evaluate(id=>WagWorkshop.project(id),id),rect=await page.locator('#view').boundingBox();await page.mouse.click(rect.x+p.x,rect.y+p.y);}
assert.equal(await page.evaluate(()=>WagWorkshop.state().selected.length),2);await page.click('#group');
await page.click('#clipboardCopy');assert.equal(await page.evaluate(()=>ButterStage.state().clipboard),2);
let count=await page.evaluate(()=>WagWorkshop.state().parts.length);await page.click('#pastePieces');await page.waitForFunction(()=>WagWorkshop.state().held,{timeout:3000});assert.equal(await page.evaluate(()=>WagWorkshop.state().parts.length),count+2);assert.equal(await page.evaluate(()=>WagWorkshop.state().held),true);
await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>WagWorkshop.state().parts.length),count);
await page.click('#pastePieces');await page.waitForFunction(()=>WagWorkshop.state().held,{timeout:3000});await page.click('#release');assert.equal(await page.evaluate(()=>WagWorkshop.state().parts.length),count+2);await page.click('#undo');assert.equal(await page.evaluate(()=>WagWorkshop.state().parts.length),count);
// Orbit must leave all part coordinates unchanged, and rear wall front-facing.
const result=await page.evaluate(()=>{PH.world.gravity.set(0,0,0);for(const b of PH.bodies.values())b.sleep();const before=JSON.stringify(rows());orbitRoom(180);const normal=V(0,0,1).transformDirection(ROOM.video.matrixWorld),toCamera=camera.position.clone().sub(ROOM.video.getWorldPosition(V())).normalize();return {same:before===JSON.stringify(rows()),dot:normal.dot(toCamera),walls:ROOM.walls.length};});assert(result.same&&result.dot>.85&&result.walls===2);
// Wall grid moves and holds a selection; invalid placements can be cancelled.
await page.evaluate(()=>{choose(S.parts[0].id,false);ButterStage.wallTap('height',-399,80,0);});assert.equal(await page.evaluate(()=>Math.round(anchor().y)),80);assert(await page.evaluate(()=>!!S.tx));await page.keyboard.press('Escape');
// Import round trip and malformed/unknown input rejection.
assert.equal(await page.evaluate(()=>ButterStage.parse(WagWorkshop.mpd()).length),count);
assert.equal(await page.evaluate(()=>{try{ButterStage.parse('1 4 0 0 0 1 0 0 0 1 0 0 0 1 unknown.dat');return false}catch{return true}}),true);
// Known exact connection is the only state that creates a bond and click.
const snap=await page.evaluate(()=>{restore([{id:'p100',part:'3003',color:4,x:0,y:0,z:0,r:0},{id:'p101',part:'3003',color:1,x:0,y:60,z:0,r:0}]);choose('p101',false);begin('test');propose(V(0,-36,0));const aligned=!!S.tx.magnet;finish(true);return {aligned,bonds:PH.links.size,events:FX.events.slice(-4)};});assert(snap.aligned&&snap.bonds>0&&snap.events.includes('click'));
// Read measurable audio after a new source starts.
const copiedBonds=await page.evaluate(()=>{choose('p100',false);choose('p101',true);const data=rows().filter(p=>S.selected.has(p.id));ButterStage.paste(data);finish(true);return PH.links.size;});assert(copiedBonds>=2);
const signal=await page.evaluate(async()=>{await startSound();feedback('click');await new Promise(r=>setTimeout(r,25));return {signal:audioSignal(),played:FX.played,state:FX.ctx.state};});assert(signal.signal>0&&signal.played>0&&signal.state==='running');

await page.setViewportSize({width:390,height:844});await page.waitForTimeout(300);
const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,stage:$('#stage').getBoundingClientRect().height,footer:$('footer').getBoundingClientRect().top}));assert(layout.scroll<=layout.width&&layout.stage>350);
await page.click('#partsToggle');let boxes=await page.evaluate(()=>({a:$('#stage').getBoundingClientRect().bottom,b:$('#shelf').getBoundingClientRect().top}));assert(boxes.a<=boxes.b);await page.click('#partsToggle');
assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,selection:2,pasteCancelUndo:true,orbit:result,snap,audio:signal,mobile:layout,errors},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

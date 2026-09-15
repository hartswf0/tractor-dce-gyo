const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const C=require('../src/hand-butter/calibration-core.js');
assert.throws(()=>C.fitPointing(Array.from({length:4},()=>({raw:{x:.5,y:.5},target:{x:.5,y:.5}}))));
const samples=C.CORNERS.map(c=>({target:c,raw:[.2+c.x*.5,.25+c.y*.5,.7-c.z*.4]})),profile=C.fit(samples);
assert(C.error(C.map(profile,[.7,.75,.3]),{x:1,y:1,z:1})<1e-12);
assert.throws(()=>C.fit(samples.map(s=>({...s,raw:[.5,.5,.5]}))));
assert.equal(C.relativePalm([1,1,1,1],[1,1,.4,.4]).valid,false);
(async()=>{const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.join(__dirname,'../WAG-HAND-BUTTER.HTML')).href);await page.waitForFunction(()=>window.ButterInput&&S.ready);
const rotation=await page.evaluate(()=>{choose(S.parts[0].id,false);begin('hand');H.owner=91;const before=checkpoint(),cam=camera.matrixWorld.toArray(),wall=ROOM.group.matrixWorld.toArray(),video=ROOM.video.matrixWorld.toArray(),projected=project(V(150,80,10));ButterSpatialRuntime.rotatePlate(1);const after=project(V(150,80,10));return {same:before===checkpoint(),camera:JSON.stringify(cam)===JSON.stringify(camera.matrixWorld.toArray()),wall:JSON.stringify(wall)===JSON.stringify(ROOM.group.matrixWorld.toArray()),video:JSON.stringify(video)===JSON.stringify(ROOM.video.matrixWorld.toArray()),moved:Math.hypot(after.x-projected.x,after.y-projected.y),owner:H.owner,held:!!S.tx,velocity:S.tx.velocity.length(),orthogonal:Math.abs(screenDelta(30,0).dot(depthDirection()))};});assert(rotation.same&&rotation.camera&&rotation.wall&&rotation.video&&rotation.moved>20&&rotation.held&&rotation.owner===91&&rotation.velocity===0&&rotation.orthogonal<1e-6);
await page.evaluate(()=>{H.owner=null;finish(false);});
// Mouse depth edits a hand-owned transaction without taking ownership or releasing it.
await page.evaluate(()=>{restore([{id:'p91',part:'3003',color:1,x:0,y:160,z:0,r:0}]);choose('p91',false);begin('hand');H.owner=101;$('#enterBuild').remove();});
await page.mouse.move(600,350);await page.mouse.down();await page.mouse.move(600,300,{steps:5});await page.mouse.up();
const hybrid=await page.evaluate(()=>({source:S.tx?.source,owner:H.owner,depth:S.tx?.depthOffset}));console.log({hybrid});assert(hybrid.source==='hand'&&hybrid.owner===101&&hybrid.depth>0);await page.evaluate(()=>{H.owner=null;finish(false);});
// A single hand can operate depth while the mouse owns the grip, even in default mode.
const reverseHybrid=await page.evaluate(()=>{
 choose('p91',false);begin('pointer');
 function hand(y){const h=Array.from({length:21},()=>({x:.65,y,z:0}));for(const [i,dx,dy] of [[0,0,.15],[1,-.035,.11],[2,-.06,.08],[3,-.085,.045],[4,-.13,.015],[5,-.04,.075],[6,-.04,.03],[7,-.04,-.035],[8,-.04,-.08],[9,0,.055],[10,0,.005],[11,0,-.05],[12,0,-.12],[13,.04,.07],[14,.04,.015],[15,.04,-.045],[16,.04,-.09],[17,.075,.09],[18,.075,.055],[19,.075,0],[20,.075,-.05]])h[i]={x:.65+dx,y:y+dy,z:0};return h;}
 const now=performance.now();processHands([hand(.5)],now);processHands([hand(.43)],now+100);const out={source:S.tx.source,depth:S.tx.depthOffset,owner:H.owner};finish(false);return out;
});assert(reverseHybrid.source==='pointer'&&reverseHybrid.depth>0&&reverseHybrid.owner===null);
// Rebase a live mouse drag on rotation, and release it with the actual pointer-up path.
const target=await page.evaluate(()=>{restore([{id:'p95',part:'3003',color:1,x:0,y:120,z:0,r:0}]);const p=project(bounds(S.parts[0]).getCenter(V())),r=$('#stage').getBoundingClientRect();return {x:p.x+r.left,y:p.y+r.top};});
await page.mouse.move(target.x,target.y);await page.mouse.down();await page.mouse.move(target.x+20,target.y-10,{steps:3});
const mouseSnap=await page.evaluate(()=>{const source=S.tx?.source;ButterSpatialRuntime.rotatePlate(1);return {source,drag:!!pointerDown?.drag};});assert(mouseSnap.source==='pointer'&&mouseSnap.drag);await page.mouse.up();assert.equal(await page.evaluate(()=>!!S.tx),false);
// One index landmark teaches actual plate corners. The second hand is not required.
const calibration=await page.evaluate(()=>{
 const inv=p=>({x:.85-(p.x-.08)*.70/.84,y:.12+(p.y-.08)*.76/.84});
 function tracks(p,now){const marks=Array(21).fill(null);marks[8]=inv(p);return [{id:707,marks,seen:now,point:p,closed:false}];}
 ButterInput.start();const I=ButterInput.state();let now=performance.now();const raw=p=>({x:(p.x-.04)/.92,y:(p.y-.03)/.94});
 for(let corner=0;corner<4;corner++){const target=ButterInput.projectedTarget();const p=raw(target);for(let i=0;i<45;i++){now+=40;ButterInput.handleHands(tracks(p,now),now);}}
 const phaseAfterTeach=I.phase,fitError=I.profile?.fitError;
 // Pointing away cannot advance. Missing fingertip cannot capture.
 const before=I.index;for(let i=0;i<30;i++)ButterInput.handleHands(tracks({x:.5,y:.1},now+=40),now);const wrongStayed=I.index===before;
 ButterInput.handleHands([],now+=100);const lostPaused=I.verifyAt===0&&I.livePoint===null;
 for(let i=0;i<6&&I.phase==='verify';i++){const p=raw(ButterInput.projectedTarget());for(let j=0;j<25;j++)ButterInput.handleHands(tracks(p,now+=40),now);}
 const ids=I.results.map(r=>r.id),result={phaseAfterTeach,fitError,phase:I.phase,verified:ids.length,ids,wrongStayed,lostPaused};ButterInput.frame(I.doneAt+1900);result.autoExited=I.phase==='idle';return result;
});assert.equal(calibration.phaseAfterTeach,'verify');assert(calibration.fitError<1e-8&&calibration.phase==='done'&&calibration.verified>=5&&calibration.ids.some(id=>!id.startsWith('reach-'))&&calibration.wrongStayed&&calibration.lostPaused&&calibration.autoExited);
// A video hand crossing the virtual floor remains an overlay; loss retains its pixels.
const handRendering=await page.evaluate(async()=>{H.tracks=[];H.memory=[];B.ghosts.clear();
 const source=document.createElement('canvas');source.width=640;source.height=480;const ctx=source.getContext('2d');ctx.fillStyle='#ff9955';ctx.fillRect(0,0,640,480);const video=$('#video');video.srcObject=source.captureStream(30);await video.play();await new Promise(r=>setTimeout(r,120));
 const now=performance.now(),marks=Array.from({length:21},(_,i)=>({x:.4+(i%5)*.025,y:.63+Math.floor(i/5)*.035,z:0}));H.active=true;ButterInput.state().offered=true;H.tracks=[{id:901,marks,seen:now,palm:{x:.5,y:.8},point:{x:.5,y:.8},closed:false}];B.lastDraw=0;renderEmbodied(now);renderSoftHands(now);const soft=B.visuals.get(901).soft,initial=soft.c.toDataURL();
 ctx.fillStyle='#0055ff';ctx.fillRect(0,0,640,480);await new Promise(r=>setTimeout(r,100));renderSoftHands(now+600);const lost=soft.c.toDataURL();const out={depthTest:soft.mesh.material.depthTest,visible:soft.mesh.visible,retained:initial===lost,opacity:soft.mesh.material.opacity,hasFrame:soft.hasFrame};H.active=false;source.getTracks?.().forEach(t=>t.stop());video.srcObject.getTracks().forEach(t=>t.stop());return out;
});assert(!handRendering.depthTest&&handRendering.visible&&handRendering.retained&&handRendering.hasFrame&&handRendering.opacity>.18);
await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);const mobile=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,calibrate:$('#setTable').getBoundingClientRect().width,stage:$('#stage').clientHeight}));assert(!mobile.overflow&&mobile.calibrate>0&&mobile.stage>350);
assert.deepEqual(errors,[]);console.log(JSON.stringify({rotation,hybrid,reverseHybrid,calibration,handRendering,mobile,errors},null,2));await browser.close();})().catch(e=>{console.error(e);process.exit(1)});

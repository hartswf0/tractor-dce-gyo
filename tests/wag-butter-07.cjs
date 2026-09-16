const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const C=require('../src/hand-butter/spatial-core.js');
function track(){return {point:{x:.5,y:.5},palm:{x:.5,y:.6},closed:false};}
let t=track();assert.equal(C.pinchTarget(t,'red',.9,0),'red');t.point.x+=.025;assert.equal(C.pinchTarget(t,'blue',.45,40),'red');t.point.x+=.025;t.closed=true;assert.equal(C.pinchTarget(t,'blue',.2,160),'red');
t=track();C.pinchTarget(t,'red',.9,0);t.point.x=.7;assert.equal(C.pinchTarget(t,null,.9,40),null);assert.equal(C.pinchTarget(t,null,.2,80),null);
t=track();C.pinchTarget(t,'red',.9,0);assert.equal(C.pinchTarget(t,null,.2,500),null);
t=track();assert.equal(C.pinchTarget(t,null,.2,0),null);
(async()=>{const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:1280,height:850}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.resolve(process.env.BUTTER_TEST_FILE||path.join(__dirname,'../WAG-HAND-BUTTER.HTML'))).href);await page.waitForFunction(()=>window.ButterInput&&S.ready);
const result=await page.evaluate(()=>{
 restore([{id:'pinch-test',part:'3003',color:1,x:0,y:120,z:0,r:0}]);H.tracks=[];H.memory=[];H.owner=null;H.mustOpen=false;H.toolId=null;H.primaryId=null;B.suspended=null;
 const r=$('#stage').getBoundingClientRect(),p=project(bounds(S.parts[0]).getCenter(V())),point={x:p.x/r.width,y:p.y/r.height};
 const inv=p=>({x:.85-(p.x-.08)*.70/.84,y:.12+(p.y-.08)*.76/.84,z:0});
 const base=inv(point);
 function hand(dx,closed){const h=Array.from({length:21},()=>({...base}));h[0]={x:base.x,y:base.y+.18,z:0};h[5]={x:base.x-.07,y:base.y+.08,z:0};h[9]={x:base.x,y:base.y+.06,z:0};h[17]={x:base.x+.07,y:base.y+.08,z:0};h[8]=inv({x:point.x+dx,y:point.y});h[4]={x:h[8].x+(closed?.015:.16),y:h[8].y,z:0};return h;}
 let now=performance.now();for(let i=0;i<8;i++)processHands([hand(0,false)],now+=40);
 const hitBefore=pick(p.x,p.y),raw=hand(.06,true);processHands([raw],now+=40);
 const smoothed=H.tracks[0].point.x,rawX=imagePoint(raw[8]).x;
 for(let i=0;i<4;i++)processHands([raw],now+=40);
 const acquired=H.owner!==null&&S.tx?.source==='hand',id=[...S.selected][0];
 for(let i=0;i<5;i++)processHands([hand(.06,false)],now+=40);
 const released=H.owner===null&&!S.tx;
 return {hitBefore,smoothed,rawX,acquired,id,released};
});console.log(result);assert.equal(result.hitBefore,'pinch-test');assert(result.smoothed<result.rawX-.005,'raw landmark must not overwrite smoothing');assert(result.acquired&&result.id==='pinch-test','closing fingers must keep the hovered brick');assert(result.released);assert.deepEqual(errors,[]);await browser.close();})().catch(e=>{console.error(e);process.exit(1)});

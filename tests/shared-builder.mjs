// Run with THREE_TEST_PATH pointing to the same Three r128 bundle used by the page.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const three=fs.readFileSync(process.env.THREE_TEST_PATH,'utf8');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_TEST_PATH||undefined});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let html=fs.readFileSync('word-to-world-hands.html','utf8').replace(/<script[\s\S]*?<\/script>/g,'').replace(/<link[^>]*>/g,'');
 await page.setContent(html);
 await page.addStyleTag({content:fs.readFileSync('world/hands/shared-builder.css','utf8')});
 await page.addScriptTag({content:three});
 await page.addScriptTag({content:fs.readFileSync('world/hands/build.js','utf8')});
 await page.evaluate(()=>{
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(50,1,1,5000);camera.position.set(0,150,300);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const B=new Build.Build({scene,M:40,geoms:new Map([['3001',{geom:new THREE.BoxGeometry(40,24,80),bb:[-20,20,-40,40,24]}]]),colours:()=>new THREE.Color('red'),groundH:()=>0,buildings:()=>[],cap:50});
  const canvas=document.createElement('canvas');document.querySelector('#stage').append(canvas);
  window.__world={ready:true,scene,camera,build:B,G:{h:()=>0},mode:'walk',renderer:{domElement:canvas},engine:{updateRendererSize(){}},rig:{pos:new THREE.Vector3()},wbOpen(){document.body.classList.remove('wb-off')},master:{}};
  document.querySelector('#veil').remove();
  document.querySelector('#palette').innerHTML='<div class="parts">'+Build.PARTS.map(p=>'<button>'+p[1]+'</button>').join('')+'</div><div class="tools"><button>Rotate</button><button>Up</button><button>Down</button><button>Undo</button><button class="place">PLACE</button></div>';
 });
 await page.addScriptTag({content:fs.readFileSync('world/hands/put-that-there.js','utf8')});
 const math=await page.evaluate(()=>{
  const B=__world.build,V=(x,y,z)=>new THREE.Vector3(x,y,z);
  B.add({id:'base',part:'3001',col:4,x:0,y:0,z:0,rot:0});
  B.aimRay(V(0,200,0),V(0,-1,0));const stack={...B.target};
  const blocked={...B.resolvePlacement({p:V(0,8,0),kind:'depth',face:'top'})};
  B.aimRay(V(200,80,0),V(0,0,-1),{distance:160});const depth={...B.target};
  B.add({id:'moving',part:'3001',col:4,x:100,y:0,z:0,rot:0});
  const p=B.pieces.get('moving');PutThatThere.capture({kind:'piece',id:p.id,item:p,box:p.box,point:V(100,24,0)});
  PutThatThere.capture({kind:'ground',point:V(0,24,0)});
  const moved=PutThatThere.execute({verb:'move',needsThat:true,needsThere:true});
  const after={y:B.pieces.get('moving').y,x:B.pieces.get('moving').x};B.undo();
  const undo={y:B.pieces.get('moving').y,x:B.pieces.get('moving').x};
  return {stack,blocked,depth,moved,after,undo};
 });
 assert.equal(math.stack.y,24,'reticle stacks on the existing brick');assert.equal(math.stack.blocked,false);
 assert.equal(math.blocked.blocked,true,'overlapping brick is rejected');assert.equal(math.depth.y,80,'depth placement preserves elevation');assert.equal(math.depth.z,-160);
 assert.equal(math.moved,true);assert.equal(math.after.y,24,'gesture command stacks through shared resolver');assert.deepEqual(math.undo,{x:100,y:0},'shared Undo restores movement');
 await page.evaluate(()=>{document.body.classList.add('ptt-on','build');document.querySelector('#ptt').classList.add('on');});
 await page.waitForTimeout(100);
 for(const [width,height] of [[390,844],[844,390],[1440,900]]){
  await page.setViewportSize({width,height});await page.waitForTimeout(100);
  const layout=await page.evaluate(()=>{const r=id=>document.querySelector(id).getBoundingClientRect();return {sceneBottom:r('#stage').bottom,barTop:r('#wb').top,wordsWidth:r('#words').width,overflow:document.documentElement.scrollWidth>innerWidth,extraPrompt:!!document.querySelector('#pttWords'),extraKey:!!document.querySelector('#pttKey'),videoInBar:!!document.querySelector('#wb #pttVideo')};});
  assert.ok(layout.sceneBottom<=layout.barTop+1,'composer cannot cover the scene');assert.ok(layout.wordsWidth>100);assert.equal(layout.overflow,false);assert.equal(layout.extraPrompt,false);assert.equal(layout.extraKey,false);assert.equal(layout.videoInBar,true);
  await page.screenshot({path:`/tmp/shared-builder-${width}.png`});
 }
 assert.deepEqual(errors,[]);console.log('PASS: stacking, overlap rejection, depth, move undo, and composer layout at 390/844/1440px');
}finally{await browser.close();}

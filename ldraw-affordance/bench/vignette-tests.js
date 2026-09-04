import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import {toLDraw,ID} from '../src/engine.js';

const suite=await fetch('../tests/vignette-tests.json',{cache:'no-store'}).then(r=>r.json());
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const delay=ms=>new Promise(r=>setTimeout(r,ms));

const allIds=[...new Set(suite.tests.flatMap(t=>t.parts.map(p=>p.id)))];
const partNames=new Map();
for(const test of suite.tests)for(const p of test.parts)partNames.set(p.id,p.name||p.id);
const index=new Map(allIds.map(id=>[id,{id,file:`${id}.dat`,name:partNames.get(id)||id,family:'vignette-world-chunk',dims:[1,1,1],ports:[],operators:['WORLD_CHUNK']} ]));

let active=0,running=false,assembly=[],modelWrapper=null,renderSerial=0,ldrawReady=false;
const results=new Map();
const sourceCache=new Map(),bboxCache=new Map();

// ---------------------------------------------------------------------------
// REAL LDRAW VIEW — EXACT OFFICIAL .DAT GEOMETRY
const host=$('#threeHost');
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.setClearColor(0xf4f2eb,1);renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(38,1,.1,50000);camera.position.set(180,140,220);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;
scene.add(new THREE.HemisphereLight(0xffffff,0x777777,2.5));
const key=new THREE.DirectionalLight(0xffffff,2.25);key.position.set(220,320,180);scene.add(key);
const fill=new THREE.DirectionalLight(0xffffff,.8);fill.position.set(-180,100,-140);scene.add(fill);
const grid=new THREE.GridHelper(2800,28,0x999999,0xd2d0ca);grid.visible=false;scene.add(grid);
const loader=new LDrawLoader();loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);loader.setPartsLibraryPath('../../ldraw/');
function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function animate(){requestAnimationFrame(animate);resize();controls.update();renderer.render(scene,camera)}animate();
function dispose(root){root?.traverse(o=>{o.geometry?.dispose?.();const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];ms.forEach(m=>m?.dispose?.())})}
function clearModel(){if(modelWrapper){scene.remove(modelWrapper);dispose(modelWrapper);modelWrapper=null}grid.visible=false}
function fit(root){const b=new THREE.Box3().setFromObject(root);if(b.isEmpty())return;const size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3()),d=Math.max(size.x,size.y,size.z,60);controls.target.copy(center);camera.position.set(center.x+d*1.35,center.y+d*.9,center.z+d*1.5);camera.near=Math.max(.1,d/500);camera.far=Math.max(5000,d*60);camera.updateProjectionMatrix();controls.update();grid.position.y=b.min.y-.6;grid.visible=true}
function geomStats(root){let meshes=0,triangles=0;root.traverse(o=>{if(o.isMesh&&o.geometry){meshes++;triangles+=o.geometry.index?o.geometry.index.count/3:(o.geometry.attributes.position?.count||0)/3}});const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3());return{meshes,triangles:Math.round(triangles),box,size:[size.x,size.y,size.z]}}
function parseMpd(text){return new Promise((resolve,reject)=>{try{loader.parse(text,resolve,reject)}catch(err){reject(err)}})}

try{
  const r=await fetch('../../ldraw/LDConfig.ldr',{cache:'no-store'});if(!r.ok)throw new Error(`LDConfig HTTP ${r.status}`);
  await loader.preloadMaterials('../../ldraw/LDConfig.ldr');ldrawReady=true;$('#geomStatus').textContent='REAL LDRAW · VIGNETTE TEST READY';
}catch(err){console.error(err);$('#geomStatus').textContent='LDRAW INIT ERROR';$('#hearText').textContent=String(err.message||err)}

async function renderAssembly(){
  const serial=++renderSerial;if(!assembly.length){clearModel();return{ok:false,meshes:0,triangles:0,size:[0,0,0]}};
  const mpd=toLDraw(assembly,index,`VIGNETTE-${suite.tests[active].id}`);$('#geomStatus').textContent='PARSING REAL .DAT…';
  try{
    const group=await parseMpd(mpd);if(serial!==renderSerial){dispose(group);return{ok:false,stale:true}};clearModel();modelWrapper=new THREE.Group();modelWrapper.rotation.x=Math.PI;modelWrapper.add(group);scene.add(modelWrapper);fit(modelWrapper);const s=geomStats(group);$('#geomStatus').textContent=`REAL LDRAW · ${assembly.length} PARTS · ${s.meshes} MESHES · ${s.triangles} TRI`;return{ok:s.meshes>0&&s.triangles>0,...s};
  }catch(err){console.error('[VIGNETTE LDRAW]',err);$('#geomStatus').textContent='LDRAW TEST ERROR';return{ok:false,error:String(err?.message||err),meshes:0,triangles:0,size:[0,0,0]}}
}

async function sourceFor(id){
  if(sourceCache.has(id))return sourceCache.get(id);
  const paths=[`../../ldraw/parts/${id}.dat`,`../../ldraw/parts/s/${id}.dat`];
  for(const url of paths){try{const r=await fetch(url,{cache:'no-store'});if(r.ok){const text=await r.text();sourceCache.set(id,text);return text}}catch{}}
  sourceCache.set(id,'');return'';
}
async function bboxFor(id){
  if(bboxCache.has(id))return bboxCache.get(id);
  const tempIndex=new Map([[id,index.get(id)]]),inst={uid:'bbox',partId:id,t:[0,0,0],r:ID,color:16,usedPorts:[]};
  try{const group=await parseMpd(toLDraw([inst],tempIndex,`BBOX-${id}`));const box=new THREE.Box3().setFromObject(group),size=box.getSize(new THREE.Vector3()),value={ok:!box.isEmpty(),x:size.x,y:size.y,z:size.z};dispose(group);bboxCache.set(id,value);return value}catch(err){const value={ok:false,error:String(err?.message||err),x:0,y:0,z:0};bboxCache.set(id,value);return value}
}

// ---------------------------------------------------------------------------
// ASSERTIONS
async function evaluateAssertion(a,test,render){
  let ok=false,detail='';
  if(a.kind==='geometryNonEmpty'){
    ok=!!render.ok;detail=ok?`${render.meshes} meshes · ${render.triangles} triangles · bbox ${render.size.map(x=>x.toFixed(1)).join(' × ')} LDU`:(render.error||'no rendered geometry');
  }else if(a.kind==='sourceContains'){
    const src=await sourceFor(a.part);ok=src.includes(a.text);detail=ok?`found “${a.text}”`:`missing “${a.text}”`;
  }else if(a.kind==='referenceCountAtLeast'){
    const src=await sourceFor(a.part),n=src.split(/\r?\n/).filter(x=>/^1\s/.test(x)).length;ok=n>=a.value;detail=`${n} type-1 child references · requires ≥ ${a.value}`;
  }else if(a.kind==='reciprocalHelp'){
    const [sa,sb]=await Promise.all([sourceFor(a.a),sourceFor(a.b)]),ab=sa.includes(`${a.b}.dat`),ba=sb.includes(`${a.a}.dat`);ok=ab&&ba;detail=`${a.a}→${a.b} ${ab?'YES':'NO'} · ${a.b}→${a.a} ${ba?'YES':'NO'}`;
  }else if(a.kind==='bboxXZApprox'){
    const bs=await Promise.all(a.parts.map(bboxFor));const rows=a.parts.map((id,i)=>`${id} ${bs[i].x.toFixed(1)}×${bs[i].z.toFixed(1)}`);ok=bs.every(b=>b.ok&&Math.abs(b.x-a.x)<=a.tolerance&&Math.abs(b.z-a.z)<=a.tolerance);detail=`${rows.join(' · ')} LDU · target ${a.x}×${a.z} ±${a.tolerance}`;
  }else if(a.kind==='gridPitch'){
    const k=a.axis==='y'?1:a.axis==='z'?2:0,vals=test.parts.map(p=>p.t[k]);const gaps=vals.slice(1).map((v,i)=>v-vals[i]);ok=gaps.length>0&&gaps.every(g=>Math.abs(g-a.value)<=a.tolerance);detail=`gaps [${gaps.join(', ')}] LDU · target ${a.value}`;
  }else if(a.kind==='truthMustRemainOpen'){
    ok=a.allowed.includes(test.truth);detail=ok?`${test.truth} remains unresolved by policy`:`${test.truth} was improperly promoted`;
  }else{detail=`unknown assertion ${a.kind}`}
  return{...a,ok,detail};
}

function sceneFromTest(test){
  return test.parts.map((p,i)=>({uid:`${test.id}-${i}`,partId:p.id,t:[...(p.t||[0,0,0])],r:ID,color:Number.isFinite(p.color)?p.color:16,usedPorts:[],label:p.name||p.id,seamTax:i?(/NATIVE|GRID|INTERNAL/.test(test.truth)?0.08:1):0,parent:i?`${test.id}-0`:null,seamState:i?test.truth:'ROOT'}));
}
function outcomeFor(test,checks){
  const all=checks.every(x=>x.ok);if(!all)return'FAIL';
  if(test.expectedOutcome==='BLOCKED_AS_DESIGNED')return'BLOCKED_AS_DESIGNED';
  return'PASS';
}
async function runTest(i=active){
  if(running||!ldrawReady)return;active=i;running=true;setButtons(true);const test=suite.tests[active];assembly=sceneFromTest(test);paintCurrent(test,'RUNNING');renderLists(test,[],'RUNNING');
  const render=await renderAssembly(),checks=[];
  for(const a of test.assertions){checks.push(await evaluateAssertion(a,test,render));renderLists(test,checks,'RUNNING');await delay(120)}
  const outcome=outcomeFor(test,checks),record={id:test.id,vignette:test.vignette,title:test.title,truth:test.truth,outcome,render:{ok:render.ok,meshes:render.meshes,triangles:render.triangles,size:render.size,error:render.error||null},assertions:checks,ranAt:new Date().toISOString()};results.set(test.id,record);paintCurrent(test,outcome);renderLists(test,checks,outcome);running=false;setButtons(false);return record;
}
async function runAll(){
  if(running||!ldrawReady)return;results.clear();for(let i=0;i<suite.tests.length;i++){await runTest(i);await delay(250)};renderLists(suite.tests[active],results.get(suite.tests[active].id)?.assertions||[],results.get(suite.tests[active].id)?.outcome||'WAIT');
}
function setButtons(disabled){['runBtn','stepBtn','resetBtn','breakBtn'].forEach(id=>$('#'+id).disabled=disabled)}
function selectTest(i){active=(i+suite.tests.length)%suite.tests.length;assembly=sceneFromTest(suite.tests[active]);paintCurrent(suite.tests[active],results.get(suite.tests[active].id)?.outcome||'WAIT');renderLists(suite.tests[active],results.get(suite.tests[active].id)?.assertions||[],results.get(suite.tests[active].id)?.outcome||'WAIT');renderAssembly()}
function paintCurrent(test,state){
  $('#fieldName').textContent=`${test.id} · ${test.vignette}`;const done=[...results.values()],pass=done.filter(x=>x.outcome==='PASS'||x.outcome==='BLOCKED_AS_DESIGNED').length;$('#signalCount').textContent=`${pass}/${suite.tests.length} validated`;$('#partCount').textContent=`${test.parts.length} part${test.parts.length===1?'':'s'}`;
  $('#hearBox').className=state==='PASS'||state==='BLOCKED_AS_DESIGNED'?'quiet':state==='FAIL'?'screaming':'hearing';$('#hearKicker').textContent=state==='PASS'?'PASS':state==='BLOCKED_AS_DESIGNED'?'BLOCKED · CORRECT':state==='FAIL'?'FAIL':'TEST';$('#hearText').textContent=test.question;$('#hearMeta').textContent=`${test.truth} · ${state}`;
}
function renderLists(test,checks,state){
  const records=new Map(checks.map(x=>[x.label,x]));$('#cueList').innerHTML=suite.tests.map((t,i)=>{const r=results.get(t.id),current=i===active,st=r?.outcome||'WAIT',cls=st==='PASS'||st==='BLOCKED_AS_DESIGNED'?'quiet':st==='FAIL'?'blocked':current?'loud':'wait';return`<button class="cue ${cls}" data-test="${i}"><b>${st==='BLOCKED_AS_DESIGNED'?'BLOCKED':st}</b><span>${t.id} · ${t.title}</span><small>${t.truth}</small></button>`}).join('');$$('#cueList [data-test]').forEach(b=>b.onclick=()=>selectTest(Number(b.dataset.test)));
  $('#assemblyList').innerHTML=[...test.parts.map(p=>`<div class="piece"><b>${p.id}</b><span>${p.name}</span><small>@ [${p.t.join(', ')}] LDU · REAL ${p.id}.dat</small></div>`),...test.assertions.map(a=>{const r=records.get(a.label),s=r?(r.ok?'PASS':'FAIL'):'WAIT';return`<div class="piece"><b>${s}</b><span>${a.label}</span><small>${r?.detail||a.kind}</small></div>`})].join('');
  const ok=checks.filter(x=>x.ok).length;$('#actText').textContent=`${test.title} · ${ok}/${test.assertions.length} assertions currently satisfied. ${test.expectedOutcome==='BLOCKED_AS_DESIGNED'?'This is a negative control: success means refusing to invent a mate.':''}`;
}
function exportReport(){const report={suite:suite.version,principle:suite.principle,results:suite.tests.map(t=>results.get(t.id)||{id:t.id,outcome:'NOT_RUN'})},blob=new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='assembly-vignette-test-report.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}

// ---------------------------------------------------------------------------
// REUSE THE EXISTING BENCH SURFACE — NO SECOND SITE
$('header strong').textContent='LDRAW / ASSEMBLY VIGNETTE TESTS';
const titles=$$('.sectionTitle');if(titles[0])titles[0].textContent='VIGNETTE TESTS · CLICK TO INSPECT';if(titles[1])titles[1].textContent='REAL PARTS + ASSERTIONS';
$('#runBtn').textContent='RUN ALL TESTS';$('#stepBtn').textContent='RUN THIS TEST';$('#resetBtn').textContent='NEXT TEST';$('#breakBtn').textContent='PREV TEST';$('#exportBtn').textContent='EXPORT REPORT';
const modeBtn=$('#vignetteBtn');if(modeBtn){modeBtn.textContent='BEAVER';modeBtn.onclick=()=>{location.href='./'}}
$('#runBtn').onclick=runAll;$('#stepBtn').onclick=()=>runTest(active);$('#resetBtn').onclick=()=>selectTest(active+1);$('#breakBtn').onclick=()=>selectTest(active-1);$('#exportBtn').onclick=exportReport;
selectTest(0);

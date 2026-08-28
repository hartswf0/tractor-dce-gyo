import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import {loadIndex,compatibility,snapChild,inspectSeam,findCoincidentConnections,transformPoint,transformVector,toLDraw,ID} from '../src/engine.js';

const [library,rules,overrides,field]=await Promise.all([
  fetch('../library/core.json',{cache:'no-store'}).then(r=>r.json()),
  fetch('../library/compatibility.json',{cache:'no-store'}).then(r=>r.json()),
  fetch('../library/seam-overrides.json',{cache:'no-store'}).then(r=>r.json()),
  fetch('../tests/releaser-field.json',{cache:'no-store'}).then(r=>r.json())
]);
for(const [id,patches] of Object.entries(overrides.parts||{})){
  const part=library.parts.find(p=>p.id===id);if(!part)continue;
  if(patches.replacePorts)part.ports=patches.replacePorts;
  for(const [portId,patch] of Object.entries(patches)){
    if(portId==='replacePorts')continue;
    const port=part.ports.find(p=>p.id===portId);if(port)Object.assign(port,patch);
  }
}
const index=loadIndex(library);
const $=s=>document.querySelector(s);
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const volume=p=>(p.dims||[99,99,99]).reduce((a,b)=>a*b,1);

let assembly=[];
let completed=new Set();
let disabled=new Set();
let running=false;
let strongest=null;
let lastAction=null;

// ---------------------------------------------------------------------------
// REAL LDRAW VIEW
const host=$('#threeHost');
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.setClearColor(0xf4f2eb,1);
renderer.outputColorSpace=THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(38,1,.1,10000);
camera.position.set(150,110,180);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.08;
scene.add(new THREE.HemisphereLight(0xffffff,0x777777,2.5));
const key=new THREE.DirectionalLight(0xffffff,2.2);key.position.set(180,260,160);scene.add(key);
const grid=new THREE.GridHelper(220,11,0x999999,0xd2d0ca);grid.visible=false;scene.add(grid);
const loader=new LDrawLoader();
loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
loader.setPartsLibraryPath('../../ldraw/');
let ldrawReady=false,modelWrapper=null,renderSerial=0;

function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function animate(){requestAnimationFrame(animate);resize();controls.update();renderer.render(scene,camera)}animate();
function dispose(root){root?.traverse(o=>{o.geometry?.dispose?.();const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];ms.forEach(m=>m?.dispose?.())})}
function clearModel(){if(modelWrapper){scene.remove(modelWrapper);dispose(modelWrapper);modelWrapper=null}grid.visible=false}
function fit(root){const b=new THREE.Box3().setFromObject(root);if(b.isEmpty())return;const size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3()),d=Math.max(size.x,size.y,size.z,45);controls.target.copy(center);camera.position.set(center.x+d*1.45,center.y+d*1.05,center.z+d*1.65);camera.near=.1;camera.far=Math.max(3000,d*50);camera.updateProjectionMatrix();controls.update();grid.position.y=b.min.y-.8;grid.visible=true}

function cueMarkers(){
  const g=new THREE.Group();
  for(const feature of field.features){
    const state=featureState(feature);
    const spec=feature.prerequisite;
    const solved=state.solved;
    const active=strongest?.feature.id===feature.id;
    const color=solved?0x21b66f:(active?0xff2d20:0xffa21a);
    const radius=solved?1.6:(active?4.4:2.7);
    const ball=new THREE.Mesh(new THREE.SphereGeometry(radius,18,12),new THREE.MeshBasicMaterial({color,transparent:true,opacity:solved?.35:.88,depthTest:false}));
    ball.position.set(...spec.p);ball.renderOrder=30;g.add(ball);
    if(!solved){const dir=new THREE.Vector3(...spec.n).normalize();const arrow=new THREE.ArrowHelper(dir,new THREE.Vector3(...spec.p),active?20:14,color,5,3);arrow.renderOrder=31;g.add(arrow)}
  }
  return g;
}

async function renderReal(){
  const serial=++renderSerial;
  if(!ldrawReady)return;
  if(!assembly.length){clearModel();return}
  const mpd=toLDraw(assembly,index,'BEAVER-BUILD');
  return new Promise(resolve=>{
    loader.parse(mpd,group=>{
      if(serial!==renderSerial){dispose(group);resolve();return}
      clearModel();
      modelWrapper=new THREE.Group();modelWrapper.rotation.x=Math.PI;
      modelWrapper.add(group);modelWrapper.add(cueMarkers());scene.add(modelWrapper);fit(modelWrapper);
      resolve();
    },err=>{console.error('[LDRAW]',err);$('#geomStatus').textContent='LDRAW ERROR';resolve()});
  })
}

try{
  const r=await fetch('../../ldraw/LDConfig.ldr',{cache:'no-store'});if(!r.ok)throw new Error(`LDConfig HTTP ${r.status}`);
  await loader.preloadMaterials('../../ldraw/LDConfig.ldr');ldrawReady=true;$('#geomStatus').textContent='REAL LDRAW READY';
}catch(err){console.error(err);$('#geomStatus').textContent='LDRAW INIT ERROR';$('#hearText').textContent=String(err.message||err)}

// ---------------------------------------------------------------------------
// SUBSTRATE / RELEASERS
function partOf(inst){return index.get(inst.partId)}
function isUsed(inst,id){return(inst.usedPorts||[]).includes(id)}
function usePort(inst,id){inst.usedPorts??=[];if(!inst.usedPorts.includes(id))inst.usedPorts.push(id)}
function openPorts(){
  const out=[];
  for(const inst of assembly){for(const port of partOf(inst).ports){if(!isUsed(inst,port.id))out.push({inst,port,p:transformPoint(inst,port.p),n:transformVector(inst,port.n)})}}
  return out;
}
function matchingOpenPort(spec){
  let best=null;
  for(const row of openPorts()){
    if(row.port.type!==spec.type||row.port.gender!==spec.gender)continue;
    const d=dist(row.p,spec.p),nd=dot(row.n,spec.n);
    const score=d+(1-nd)*100;
    if(!best||score<best.score)best={...row,d,nd,score};
  }
  if(best&&best.d<=(spec.tolerance??.05)&&best.nd>.999)return best;
  return null;
}
function featureState(feature){
  if(completed.has(feature.id))return{solved:true,feature};
  const port=matchingOpenPort(feature.prerequisite);
  if(feature.completion.kind==='port')return port?{solved:true,feature,port}:{solved:false,stage:'expose',feature};
  if(port)return{solved:false,stage:'mate',feature,port};
  return{solved:false,stage:'expose',feature};
}
function hear(){
  const states=field.features.map(featureState);
  const unresolved=states.filter(s=>!s.solved).sort((a,b)=>b.feature.severity-a.feature.severity);
  strongest=unresolved[0]||null;
  return{states,unresolved,strongest};
}

function outputError(inst,port,spec){
  if(port.type!==spec.type||port.gender!==spec.gender)return Infinity;
  const p=transformPoint(inst,port.p),n=transformVector(inst,port.n);
  return dist(p,spec.p)+(1-dot(n,spec.n))*100;
}
function candidateForExpose(cue){
  const spec=cue.feature.prerequisite;
  let best=null;
  for(const parent of openPorts()){
    for(const part of library.parts){
      if(disabled.has(part.id))continue;
      for(const cp of part.ports){
        const connection=compatibility(parent.port,cp,rules);if(!connection)continue;
        const snap=snapChild(parent.inst,parent.port,part,cp,connection);if(!snap)continue;
        const probe={partId:part.id,t:snap.t,r:snap.r,usedPorts:[cp.id]};
        for(const out of part.ports){
          if(out.id===cp.id)continue;
          const error=outputError(probe,out,spec);if(!Number.isFinite(error))continue;
          const confidencePenalty=out.confidence==='exact'?0:(out.confidence==='semantic'?3:8);
          const operatorBonus=(part.operators||[]).some(op=>(spec.operatorHint||'').includes(op))?-2:0;
          const score=error+confidencePenalty+volume(part)/100000+operatorBonus;
          if(!best||score<best.score)best={kind:'expose',cue,parentInst:parent.inst,parentPort:parent.port,part,childPort:cp,outputPort:out,connection,snap,error,score};
        }
      }
    }
  }
  const tol=spec.tolerance??.05;
  return best&&best.error<=tol?best:null;
}
function candidateForMate(cue){
  const target=cue.port;
  const prefer=cue.feature.completion.preferFamily;
  let pool=[];
  for(const part of library.parts){
    if(disabled.has(part.id))continue;
    for(const cp of part.ports){
      const connection=compatibility(target.port,cp,rules);if(!connection)continue;
      const snap=snapChild(target.inst,target.port,part,cp,connection);if(!snap)continue;
      const probe={partId:part.id,t:snap.t,r:snap.r};
      const seam=inspectSeam(target.inst,target.port,probe,cp,connection,rules);if(!seam.ok)continue;
      pool.push({kind:'mate',cue,parentInst:target.inst,parentPort:target.port,part,childPort:cp,connection,snap,error:0,score:volume(part)+(part.family===prefer?0:1e8)});
    }
  }
  pool.sort((a,b)=>a.score-b.score);
  return pool[0]||null;
}
function chooseAction(cue){return cue.stage==='mate'?candidateForMate(cue):candidateForExpose(cue)}

function makeSeed(){
  const p=index.get(field.seed.partId);
  assembly=[{uid:crypto.randomUUID(),partId:p.id,t:[0,0,0],r:ID,usedPorts:[],color:field.seed.color??16,label:field.seed.label,seamTax:0,parent:null}];
}
async function place(action){
  const {parentInst,parentPort,part,childPort,connection,snap}=action;
  usePort(parentInst,parentPort.id);
  const out=transformVector(parentInst,parentPort.n),approach=connection.approach||14;
  const previewT=snap.t.map((v,i)=>v+out[i]*approach);
  const child={uid:crypto.randomUUID(),partId:part.id,t:previewT,r:snap.r,usedPorts:[childPort.id],color:colorFor(part),label:`response to ${action.cue.feature.id}`,seamTax:connection.tax,parent:parentInst.uid,via:`${parentPort.id} ↔ ${childPort.id}`};
  assembly.push(child);lastAction=action;renderUI();await renderReal();await delay(320);
  child.t=[...snap.t];
  const extras=findCoincidentConnections(assembly,child,index,rules);
  for(const hit of extras){usePort(hit.other,hit.pp.id);usePort(child,hit.cp.id)}
  if(action.kind==='mate')completed.add(action.cue.feature.id);
  lastAction=action;hear();renderUI();await renderReal();await delay(420);
  return child;
}
function colorFor(part){
  if(part.id==='4070'||part.id==='87087'||part.id==='99780')return 14;
  if(part.id==='15573')return 4;
  if(part.id==='3700')return 1;
  if(part.family==='matter')return 72;
  return 71;
}

async function hearAndAct(){
  const h=hear();renderUI();await renderReal();
  if(!h.strongest)return'complete';
  const action=chooseAction(h.strongest);
  if(!action){lastAction=null;renderUI(true);await renderReal();return'blocked'}
  lastAction=action;renderUI();await delay(450);await place(action);return'acted';
}
async function runBeaver(){
  if(running)return;running=true;$('#runBtn').disabled=true;$('#stepBtn').disabled=true;
  for(let i=0;i<20;i++){
    const result=await hearAndAct();
    if(result!=='acted')break;
  }
  running=false;$('#runBtn').disabled=false;$('#stepBtn').disabled=false;renderUI();
}
function reset(){completed=new Set();lastAction=null;makeSeed();hear();renderUI();renderReal()}

// ---------------------------------------------------------------------------
// UI
function actionExplanation(action){
  if(!strongest)return'Every releaser is quiet. Stop building.';
  if(!action)return`NO PART CAN SILENCE THIS CUE. Missing capability: ${strongest.feature.prerequisite.operatorHint}. The builder must stop here.`;
  if(action.kind==='mate')return`${action.part.id} ${action.part.name} is the smallest ${strongest.feature.completion.preferFamily||''} part that can seat on the demanded interface.`;
  return`${action.part.id} ${action.part.name} predicts ${action.outputPort.id} exactly at the demanded datum (error ${action.error.toFixed(3)} LDU). Operators: ${(action.part.operators||[]).join(' · ')}.`;
}
function renderUI(blocked=false){
  const h=hear();
  const action=h.strongest?chooseAction(h.strongest):null;
  const unresolved=h.unresolved.length;
  $('#fieldName').textContent=field.name;
  $('#signalCount').textContent=`${unresolved} signal${unresolved===1?'':'s'}`;
  $('#partCount').textContent=`${assembly.length} part${assembly.length===1?'':'s'}`;
  if(!h.strongest){
    $('#hearBox').className='quiet';$('#hearKicker').textContent='QUIET';$('#hearText').textContent='All local releasers are extinguished.';$('#hearMeta').textContent='STOP. No reason to add another part.';
  }else{
    const f=h.strongest.feature,s=f.prerequisite;
    $('#hearBox').className=action?'hearing':'screaming';$('#hearKicker').textContent=action?'HEAR':'STILL HEAR';
    $('#hearText').textContent=h.strongest.stage==='mate'?f.completion.label:s.cry;
    $('#hearMeta').textContent=`severity ${f.severity} · ${s.type}:${s.gender} @ [${s.p.join(', ')}] · normal [${s.n.join(', ')}]`;
  }
  $('#actText').textContent=actionExplanation(action);
  $('#cueList').innerHTML=h.states.map(s=>{
    const f=s.feature;
    let state=s.solved?'QUIET':(s===h.strongest?(action?'LOUD':'BLOCKED'):'WAIT');
    return`<div class="cue ${state.toLowerCase()}"><b>${state}</b><span>${f.label}</span><small>${s.solved?'releaser extinguished':(s.stage==='mate'?f.completion.label:f.prerequisite.cry)}</small></div>`
  }).join('');
  $('#assemblyList').innerHTML=assembly.map((inst,i)=>{const p=partOf(inst);return`<div class="piece"><b>${String(i+1).padStart(2,'0')} · ${p.id}</b><span>${p.name}</span><small>${inst.label||''}</small></div>`}).join('');
  $('#breakBtn').textContent=disabled.has('4070')?'RESTORE EXACT SNOT 4070':'REMOVE EXACT SNOT 4070';
  $('#breakBtn').classList.toggle('broken',disabled.has('4070'));
}

$('#runBtn').onclick=()=>runBeaver();
$('#stepBtn').onclick=async()=>{if(!running)await hearAndAct()};
$('#resetBtn').onclick=()=>reset();
$('#breakBtn').onclick=()=>{if(disabled.has('4070'))disabled.delete('4070');else disabled.add('4070');reset()};
$('#exportBtn').onclick=()=>{const text=toLDraw(assembly,index,'BEAVER-BUILD'),blob=new Blob([text],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='beaver-build.mpd';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};

reset();
if(ldrawReady)setTimeout(()=>runBeaver(),700);

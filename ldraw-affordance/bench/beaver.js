import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import {loadIndex,compatibility,snapChild,inspectSeam,findCoincidentConnections,transformPoint,transformVector,toLDraw,ID} from '../src/engine.js';
import {LDrawConnectorOracle,verifyStudClick} from '../src/ldraw-connectors.js';

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
const oracle=new LDrawConnectorOracle('../../ldraw');
const connectorAudits=new Map();
await Promise.all(library.parts.map(async part=>{
  try{connectorAudits.set(part.id,await oracle.auditPart(part))}
  catch(err){console.warn('[STUD ORACLE]',part.id,err);connectorAudits.set(part.id,{partId:part.id,studs:[],ports:[],ok:false,error:String(err)})}
}));

const $=s=>document.querySelector(s);
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
const volume=p=>(p.dims||[99,99,99]).reduce((a,b)=>a*b,1);
const SNOT_IDS=new Set(['4070','87087','99780']);

let assembly=[];
let completed=new Set();
let disabled=new Set();
let running=false;
let strongest=null;
let lastAction=null;
let lastHandshake=null;

// ---------------------------------------------------------------------------
// SOUND / HAPTIC: ONLY A VERIFIED STUD ↔ ANTI-STUD CONTACT MAKES THIS SOUND.
let audioCtx=null;
function armAudio(){
  try{
    audioCtx??=new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended')audioCtx.resume();
  }catch{}
}
function playStudClick(count=1){
  if(!audioCtx||audioCtx.state!=='running')return;
  const t=audioCtx.currentTime;
  const gain=audioCtx.createGain(),osc=audioCtx.createOscillator();
  osc.type='triangle';osc.frequency.setValueAtTime(1650,t);osc.frequency.exponentialRampToValueAtTime(520,t+.038);
  gain.gain.setValueAtTime(.0001,t);gain.gain.exponentialRampToValueAtTime(Math.min(.16,.075+.018*count),t+.002);gain.gain.exponentialRampToValueAtTime(.0001,t+.052);
  osc.connect(gain).connect(audioCtx.destination);osc.start(t);osc.stop(t+.06);
  try{navigator.vibrate?.(Math.min(30,12+count*3))}catch{}
}

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
    const state=featureState(feature),spec=feature.prerequisite,solved=state.solved,active=strongest?.feature.id===feature.id;
    const color=solved?0x21b66f:(active?0xff2d20:0xffa21a),radius=solved?1.6:(active?4.4:2.7);
    const ball=new THREE.Mesh(new THREE.SphereGeometry(radius,18,12),new THREE.MeshBasicMaterial({color,transparent:true,opacity:solved?.35:.88,depthTest:false}));
    ball.position.set(...spec.p);ball.renderOrder=30;g.add(ball);
    if(!solved){const dir=new THREE.Vector3(...spec.n).normalize(),arrow=new THREE.ArrowHelper(dir,new THREE.Vector3(...spec.p),active?20:14,color,5,3);arrow.renderOrder=31;g.add(arrow)}
  }
  return g;
}

async function renderReal(){
  const serial=++renderSerial;if(!ldrawReady)return;if(!assembly.length){clearModel();return}
  const mpd=toLDraw(assembly,index,'BEAVER-BUILD');
  return new Promise(resolve=>{
    loader.parse(mpd,group=>{
      if(serial!==renderSerial){dispose(group);resolve();return}
      clearModel();modelWrapper=new THREE.Group();modelWrapper.rotation.x=Math.PI;modelWrapper.add(group);modelWrapper.add(cueMarkers());scene.add(modelWrapper);fit(modelWrapper);resolve();
    },err=>{console.error('[LDRAW]',err);$('#geomStatus').textContent='LDRAW ERROR';resolve()});
  })
}

try{
  const r=await fetch('../../ldraw/LDConfig.ldr',{cache:'no-store'});if(!r.ok)throw new Error(`LDConfig HTTP ${r.status}`);
  await loader.preloadMaterials('../../ldraw/LDConfig.ldr');ldrawReady=true;
  const backed=[...connectorAudits.values()].reduce((n,a)=>n+a.ports.filter(p=>p.ok).length,0),declared=[...connectorAudits.values()].reduce((n,a)=>n+a.ports.length,0);
  $('#geomStatus').textContent=`REAL LDRAW · STUD ORACLE ${backed}/${declared}`;
}catch(err){console.error(err);$('#geomStatus').textContent='LDRAW INIT ERROR';$('#hearText').textContent=String(err.message||err)}

// ---------------------------------------------------------------------------
// PHYSICAL HANDSHAKES
function partOf(inst){return index.get(inst.partId)}
function isUsed(inst,id){return(inst.usedPorts||[]).includes(id)}
function usePort(inst,id){inst.usedPorts??=[];if(!inst.usedPorts.includes(id))inst.usedPorts.push(id)}
function releasePort(inst,id){inst.usedPorts=(inst.usedPorts||[]).filter(x=>x!==id)}
function studPortBacked(part,port){
  if(port.type!=='stud'||port.gender!=='male')return true;
  return !!connectorAudits.get(part.id)?.ports?.find(x=>x.portId===port.id)?.ok;
}
function proofFor(parentInst,parentPort,childPart,childPort,snap){
  const childInst={partId:childPart.id,t:snap.t,r:snap.r,usedPorts:[childPort.id]};
  if(parentPort.type==='stud'&&childPort.type==='stud'){
    return verifyStudClick({parentInst,parentPort,childInst,childPort,parentAudit:connectorAudits.get(parentInst.partId),childAudit:connectorAudits.get(childPart.id)});
  }
  // For pin/axle protocols we permit only calibrated endpoints, but they never
  // trigger the LEGO stud click sound.
  const exact=parentPort.confidence==='exact'&&childPort.confidence==='exact';
  return{ok:exact,reason:exact?'calibrated-nonstud-seat':'uncalibrated-nonstud-seat',studClick:false};
}
function extraProof(other,pp,child,cp){
  return proofFor(other,pp,partOf(child),cp,{t:child.t,r:child.r});
}

// ---------------------------------------------------------------------------
// SUBSTRATE / RELEASERS
function openPorts(){
  const out=[];for(const inst of assembly){for(const port of partOf(inst).ports){if(!isUsed(inst,port.id))out.push({inst,port,p:transformPoint(inst,port.p),n:transformVector(inst,port.n)})}}return out;
}
function matchingOpenPort(spec){
  let best=null;
  for(const row of openPorts()){
    if(row.port.type!==spec.type||row.port.gender!==spec.gender)continue;
    if(spec.type==='stud'&&spec.gender==='male'&&!studPortBacked(partOf(row.inst),row.port))continue;
    const d=dist(row.p,spec.p),nd=dot(row.n,spec.n),score=d+(1-nd)*100;
    if(!best||score<best.score)best={...row,d,nd,score};
  }
  if(best&&best.d<=(spec.tolerance??.05)&&best.nd>.999)return best;return null;
}
function featureState(feature){
  if(completed.has(feature.id))return{solved:true,feature};
  const port=matchingOpenPort(feature.prerequisite);
  if(feature.completion.kind==='port')return port?{solved:true,feature,port}:{solved:false,stage:'expose',feature};
  if(port)return{solved:false,stage:'mate',feature,port};
  return{solved:false,stage:'expose',feature};
}
function hear(){
  const states=field.features.map(featureState),unresolved=states.filter(s=>!s.solved).sort((a,b)=>b.feature.severity-a.feature.severity);
  strongest=unresolved[0]||null;return{states,unresolved,strongest};
}
function outputError(inst,port,spec){
  if(port.type!==spec.type||port.gender!==spec.gender)return Infinity;
  if(spec.type==='stud'&&spec.gender==='male'&&!studPortBacked(partOf(inst),port))return Infinity;
  const p=transformPoint(inst,port.p),n=transformVector(inst,port.n);return dist(p,spec.p)+(1-dot(n,spec.n))*100;
}
function candidateForExpose(cue){
  const spec=cue.feature.prerequisite;let best=null;
  for(const parent of openPorts()){
    for(const part of library.parts){
      if(disabled.has(part.id))continue;
      for(const cp of part.ports){
        const connection=compatibility(parent.port,cp,rules);if(!connection)continue;
        const snap=snapChild(parent.inst,parent.port,part,cp,connection);if(!snap)continue;
        const proof=proofFor(parent.inst,parent.port,part,cp,snap);if(!proof.ok)continue;
        const probe={partId:part.id,t:snap.t,r:snap.r,usedPorts:[cp.id]};
        for(const out of part.ports){
          if(out.id===cp.id)continue;
          const error=outputError(probe,out,spec);if(!Number.isFinite(error))continue;
          const confidencePenalty=out.confidence==='exact'?0:(out.confidence==='semantic'?3:8),operatorBonus=(part.operators||[]).some(op=>(spec.operatorHint||'').includes(op))?-2:0;
          const score=error+confidencePenalty+volume(part)/100000+operatorBonus;
          if(!best||score<best.score)best={kind:'expose',cue,parentInst:parent.inst,parentPort:parent.port,part,childPort:cp,outputPort:out,connection,snap,proof,error,score};
        }
      }
    }
  }
  const tol=spec.tolerance??.05;return best&&best.error<=tol?best:null;
}
function candidateForMate(cue){
  const target=cue.port,prefer=cue.feature.completion.preferFamily,pool=[];
  for(const part of library.parts){
    if(disabled.has(part.id))continue;
    for(const cp of part.ports){
      const connection=compatibility(target.port,cp,rules);if(!connection)continue;
      const snap=snapChild(target.inst,target.port,part,cp,connection);if(!snap)continue;
      const seam=inspectSeam(target.inst,target.port,{partId:part.id,t:snap.t,r:snap.r},cp,connection,rules);if(!seam.ok)continue;
      const proof=proofFor(target.inst,target.port,part,cp,snap);if(!proof.ok)continue;
      pool.push({kind:'mate',cue,parentInst:target.inst,parentPort:target.port,part,childPort:cp,connection,snap,proof,error:0,score:volume(part)+(part.family===prefer?0:1e8)});
    }
  }
  pool.sort((a,b)=>a.score-b.score);return pool[0]||null;
}
function chooseAction(cue){return cue.stage==='mate'?candidateForMate(cue):candidateForExpose(cue)}

function makeSeed(){
  const p=index.get(field.seed.partId);assembly=[{uid:crypto.randomUUID(),partId:p.id,t:[0,0,0],r:ID,usedPorts:[],color:field.seed.color??16,label:field.seed.label,seamTax:0,parent:null,verifiedContacts:[]}];
}
async function place(action){
  const {parentInst,parentPort,part,childPort,connection,snap}=action,out=transformVector(parentInst,parentPort.n),approach=connection.approach||14;
  const previewT=snap.t.map((v,i)=>v+out[i]*approach);
  const child={uid:crypto.randomUUID(),partId:part.id,t:previewT,r:snap.r,usedPorts:[],color:colorFor(part),label:`response to ${action.cue.feature.id}`,seamTax:0,parent:parentInst.uid,via:`${parentPort.id} ↔ ${childPort.id}`,verifiedContacts:[]};
  assembly.push(child);lastAction=action;lastHandshake={state:'APPROACH',text:'No click yet.'};renderUI();await renderReal();await delay(360);

  child.t=[...snap.t];
  const mainProof=proofFor(parentInst,parentPort,part,childPort,snap);
  if(!mainProof.ok){
    assembly.pop();lastHandshake={state:'NO CLICK',text:`${mainProof.reason}. Releaser remains loud.`};lastAction=null;hear();renderUI();await renderReal();return null;
  }
  usePort(parentInst,parentPort.id);usePort(child,childPort.id);child.seamTax=connection.tax;child.verifiedContacts.push({parent:parentInst.uid,parentPort:parentPort.id,childPort:childPort.id,proof:mainProof});

  // Coincident semantic ports are NOT automatically handshakes. Certify every
  // incidental contact against real connector geometry before consuming it.
  const extras=findCoincidentConnections(assembly,child,index,rules);
  for(const hit of extras){
    if(isUsed(hit.other,hit.pp.id)||isUsed(child,hit.cp.id))continue;
    const proof=extraProof(hit.other,hit.pp,child,hit.cp);if(!proof.ok)continue;
    usePort(hit.other,hit.pp.id);usePort(child,hit.cp.id);child.verifiedContacts.push({parent:hit.other.uid,parentPort:hit.pp.id,childPort:hit.cp.id,proof});
  }
  const studClicks=child.verifiedContacts.filter(c=>c.proof.reason==='physical-stud-antistud-contact').length;
  if(studClicks>0){playStudClick(studClicks);lastHandshake={state:'CLICK',text:`${studClicks} geometry-certified stud ↔ anti-stud contact${studClicks===1?'':'s'}.`}}
  else lastHandshake={state:'SEATED',text:'Calibrated non-stud interface. No LEGO stud click emitted.'};

  if(action.kind==='mate')completed.add(action.cue.feature.id);
  lastAction=action;hear();renderUI();await renderReal();await delay(460);return child;
}
function colorFor(part){if(SNOT_IDS.has(part.id))return 14;if(part.id==='15573')return 4;if(part.id==='3700')return 1;if(part.family==='matter')return 72;return 71}

async function hearAndAct(){
  const h=hear();renderUI();await renderReal();if(!h.strongest)return'complete';
  const action=chooseAction(h.strongest);if(!action){lastAction=null;lastHandshake={state:'STILL HEAR',text:'No geometry-certified handshake can silence this cue.'};renderUI(true);await renderReal();return'blocked'}
  lastAction=action;renderUI();await delay(420);const child=await place(action);return child?'acted':'blocked';
}
async function runBeaver(){
  if(running)return;armAudio();running=true;$('#runBtn').disabled=true;$('#stepBtn').disabled=true;
  for(let i=0;i<20;i++){const result=await hearAndAct();if(result!=='acted')break}
  running=false;$('#runBtn').disabled=false;$('#stepBtn').disabled=false;renderUI();
}
function reset(){completed=new Set();lastAction=null;lastHandshake=null;makeSeed();hear();renderUI();renderReal()}

// ---------------------------------------------------------------------------
// UI
function actionExplanation(action){
  if(!strongest)return'Every releaser is quiet. STOP BUILDING.';
  if(!action)return`NO CLICK. No geometry-certified part can silence this cue. Missing capability: ${strongest.feature.prerequisite.operatorHint}.`;
  const proof=action.proof?.reason||'pending';
  if(action.kind==='mate')return`${action.part.id} ${action.part.name} can mate here. Proposed handshake: ${proof}. It still will not count until final placement certifies contact.`;
  return`${action.part.id} ${action.part.name} predicts ${action.outputPort.id} at the demanded datum (error ${action.error.toFixed(3)} LDU). Entry handshake: ${proof}.`;
}
function renderUI(){
  const h=hear(),action=h.strongest?chooseAction(h.strongest):null,unresolved=h.unresolved.length;
  $('#fieldName').textContent=field.name;$('#signalCount').textContent=`${unresolved} signal${unresolved===1?'':'s'}`;$('#partCount').textContent=`${assembly.length} part${assembly.length===1?'':'s'}`;
  if(!h.strongest){$('#hearBox').className='quiet';$('#hearKicker').textContent='QUIET';$('#hearText').textContent='All local releasers are extinguished.';$('#hearMeta').textContent='STOP. No reason to add another part.'}
  else{
    const f=h.strongest.feature,s=f.prerequisite;$('#hearBox').className=action?'hearing':'screaming';$('#hearKicker').textContent=action?'HEAR':'STILL HEAR';
    $('#hearText').textContent=h.strongest.stage==='mate'?f.completion.label:s.cry;$('#hearMeta').textContent=`severity ${f.severity} · ${s.type}:${s.gender} @ [${s.p.join(', ')}] · normal [${s.n.join(', ')}]`;
  }
  const hs=lastHandshake?`${lastHandshake.state}: ${lastHandshake.text} `:'';$('#actText').textContent=hs+actionExplanation(action);
  $('#cueList').innerHTML=h.states.map(s=>{const f=s.feature;let state=s.solved?'QUIET':(s===h.strongest?(action?'LOUD':'BLOCKED'):'WAIT');return`<div class="cue ${state.toLowerCase()}"><b>${state}</b><span>${f.label}</span><small>${s.solved?'releaser extinguished':(s.stage==='mate'?f.completion.label:f.prerequisite.cry)}</small></div>`}).join('');
  $('#assemblyList').innerHTML=assembly.map((inst,i)=>{const p=partOf(inst),clicks=(inst.verifiedContacts||[]).filter(c=>c.proof.reason==='physical-stud-antistud-contact').length;return`<div class="piece"><b>${String(i+1).padStart(2,'0')} · ${p.id}</b><span>${p.name}</span><small>${inst.label||''}${i?` · ${clicks?`${clicks} VERIFIED CLICK${clicks===1?'':'S'}`:'NO STUD CLICK'}`:''}</small></div>`}).join('');
  const broken=[...SNOT_IDS].every(id=>disabled.has(id));$('#breakBtn').textContent=broken?'RESTORE SNOT FAMILY':'REMOVE SNOT FAMILY';$('#breakBtn').classList.toggle('broken',broken);
}

$('#runBtn').onclick=()=>runBeaver();
$('#stepBtn').onclick=async()=>{armAudio();if(!running)await hearAndAct()};
$('#resetBtn').onclick=()=>reset();
$('#breakBtn').onclick=()=>{const broken=[...SNOT_IDS].every(id=>disabled.has(id));for(const id of SNOT_IDS)broken?disabled.delete(id):disabled.add(id);reset()};
$('#exportBtn').onclick=()=>{const text=toLDraw(assembly,index,'BEAVER-BUILD'),blob=new Blob([text],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='beaver-build.mpd';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};

// Do not auto-run: the first RUN/HEAR gesture arms audio so a click can only be
// heard as the direct consequence of a geometry-certified physical handshake.
reset();

import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {LDrawLoader} from 'three/addons/loaders/LDrawLoader.js';
import {LDrawConditionalLineMaterial} from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import {loadIndex,compatibility,snapChild,transformPoint,transformVector,toLDraw,ID} from '../src/engine.js';
import {physicalHandshake,auditAssembly,handshakeSummary} from './handshake.js';

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
const index=loadIndex(library),$=s=>document.querySelector(s),delay=ms=>new Promise(r=>setTimeout(r,ms));
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]),volume=p=>(p.dims||[99,99,99]).reduce((a,b)=>a*b,1);
rules.clickPositionTolerance=.001;rules.clickLateralTolerance=.001;rules.clickAxialTolerance=.001;rules.clickNormalTolerance=.999999;

let assembly=[],completed=new Set(),rejected=new Set(),breakSnot=false,running=false,strongest=null,lastContact=null;
let stats={tries:0,rejected:0,clicks:0,placements:0,audits:0};let audioCtx=null;
function partOf(inst){return index.get(inst.partId)}function isUsed(inst,id){return(inst.usedPorts||[]).includes(id)}function usePort(inst,id){inst.usedPorts??=[];if(!inst.usedPorts.includes(id))inst.usedPorts.push(id)}function unusePort(inst,id){inst.usedPorts=(inst.usedPorts||[]).filter(x=>x!==id)}
function partDisabled(part){return breakSnot&&(part.operators||[]).includes('TURN_PLANE_90')}function actionSig(a){return`${a.cue.feature.id}|${a.parentInst.uid}|${a.parentPort.id}|${a.part.id}|${a.childPort.id}|${a.outputPort?.id||''}`}

// CLICK SOUND ----------------------------------------------------------------
function ensureAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}
function oneClick(at){const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='square';o.frequency.setValueAtTime(1150,at);o.frequency.exponentialRampToValueAtTime(340,at+.035);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(.15,at+.002);g.gain.exponentialRampToValueAtTime(.0001,at+.045);o.connect(g).connect(audioCtx.destination);o.start(at);o.stop(at+.05)}
function playClick(count=1){if(!audioCtx)return;for(let i=0;i<count;i++)oneClick(audioCtx.currentTime+i*.055)}

// REAL LDRAW -----------------------------------------------------------------
const host=$('#threeHost'),renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0xf3f1ea,1);renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,10000),controls=new OrbitControls(camera,renderer.domElement);camera.position.set(135,105,170);controls.enableDamping=true;controls.dampingFactor=.08;scene.add(new THREE.HemisphereLight(0xffffff,0x666666,2.6));const sun=new THREE.DirectionalLight(0xffffff,2.1);sun.position.set(180,260,150);scene.add(sun);const grid=new THREE.GridHelper(220,11,0x999999,0xd3d0c8);grid.visible=false;scene.add(grid);
const loader=new LDrawLoader();loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);loader.setPartsLibraryPath('../../ldraw/');let ldrawReady=false,modelWrapper=null,renderSerial=0;
function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}function animate(){requestAnimationFrame(animate);resize();controls.update();renderer.render(scene,camera)}animate();
function dispose(root){root?.traverse(o=>{o.geometry?.dispose?.();const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];ms.forEach(m=>m?.dispose?.())})}function clearModel(){if(modelWrapper){scene.remove(modelWrapper);dispose(modelWrapper);modelWrapper=null}grid.visible=false}
function fit(root){const b=new THREE.Box3().setFromObject(root);if(b.isEmpty())return;const size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3()),d=Math.max(size.x,size.y,size.z,45);controls.target.copy(center);camera.position.set(center.x+d*1.42,center.y+d*.95,center.z+d*1.62);camera.near=.1;camera.far=Math.max(3000,d*50);camera.updateProjectionMatrix();controls.update();grid.position.y=b.min.y-.7;grid.visible=true}
function cueMarkers(){const g=new THREE.Group();for(const f of field.features){const state=featureState(f),active=strongest?.feature.id===f.id,color=state.solved?0x20bb72:(active?0xff2d20:0xff9d19),r=state.solved?1.4:(active?4:2.4),s=new THREE.Mesh(new THREE.SphereGeometry(r,16,10),new THREE.MeshBasicMaterial({color,depthTest:false,transparent:true,opacity:state.solved?.3:.9}));s.position.set(...f.prerequisite.p);s.renderOrder=20;g.add(s);if(!state.solved){const dir=new THREE.Vector3(...f.prerequisite.n).normalize();g.add(new THREE.ArrowHelper(dir,new THREE.Vector3(...f.prerequisite.p),active?18:12,color,4,2.5))}}if(lastContact?.p){const color=lastContact.ok?0x00dd77:0xff0033,s=new THREE.Mesh(new THREE.SphereGeometry(lastContact.ok?2.2:3.2,18,12),new THREE.MeshBasicMaterial({color,depthTest:false,transparent:true,opacity:.95}));s.position.set(...lastContact.p);s.renderOrder=25;g.add(s)}return g}
async function renderReal(){const serial=++renderSerial;if(!ldrawReady||!assembly.length)return;const mpd=toLDraw(assembly,index,'BEAVER-CLOSED-LOOP');return new Promise(resolve=>loader.parse(mpd,group=>{if(serial!==renderSerial){dispose(group);resolve();return}clearModel();modelWrapper=new THREE.Group();modelWrapper.rotation.x=Math.PI;modelWrapper.add(group);modelWrapper.add(cueMarkers());scene.add(modelWrapper);fit(modelWrapper);resolve()},err=>{console.error('[LDRAW]',err);$('#geom').textContent='LDRAW ERROR';resolve()}))}
try{const r=await fetch('../../ldraw/LDConfig.ldr',{cache:'no-store'});if(!r.ok)throw new Error(`LDConfig ${r.status}`);await loader.preloadMaterials('../../ldraw/LDConfig.ldr');ldrawReady=true;$('#geom').textContent='REAL LDRAW READY'}catch(err){console.error(err);$('#geom').textContent='LDRAW INIT ERROR'}

// HEAR -----------------------------------------------------------------------
function openPorts(){const out=[];for(const inst of assembly){if(inst.provisional)continue;for(const port of partOf(inst).ports)if(!isUsed(inst,port.id))out.push({inst,port,p:transformPoint(inst,port.p),n:transformVector(inst,port.n)})}return out}
function matchingOpenPort(spec){let best=null;for(const row of openPorts()){if(row.port.type!==spec.type||row.port.gender!==spec.gender)continue;const d=dist(row.p,spec.p),nd=dot(row.n,spec.n),score=d+(1-nd)*100;if(!best||score<best.score)best={...row,d,nd,score}}return best&&best.d<=(spec.tolerance??.05)&&best.nd>.999?best:null}
function featureState(feature){if(completed.has(feature.id))return{solved:true,feature};const port=matchingOpenPort(feature.prerequisite);if(feature.completion.kind==='port')return port?{solved:true,feature,port}:{solved:false,stage:'expose',feature};return port?{solved:false,stage:'mate',feature,port}:{solved:false,stage:'expose',feature}}
function hear(){const states=field.features.map(featureState),unresolved=states.filter(x=>!x.solved).sort((a,b)=>b.feature.severity-a.feature.severity);strongest=unresolved[0]||null;return{states,unresolved,strongest}}
function outputError(inst,port,spec){if(port.type!==spec.type||port.gender!==spec.gender||port.confidence!=='exact')return Infinity;const p=transformPoint(inst,port.p),n=transformVector(inst,port.n);return dist(p,spec.p)+(1-dot(n,spec.n))*100}

// PROPOSE --------------------------------------------------------------------
function candidateForExpose(cue){const spec=cue.feature.prerequisite,candidates=[];for(const parent of openPorts())for(const part of library.parts){if(partDisabled(part))continue;for(const cp of part.ports){const connection=compatibility(parent.port,cp,rules);if(!connection)continue;const snap=snapChild(parent.inst,parent.port,part,cp,connection);if(!snap)continue;const probe={uid:'probe',partId:part.id,t:snap.t,r:snap.r,usedPorts:[cp.id]},incoming=physicalHandshake(parent.inst,parent.port,probe,cp,connection,rules);if(!incoming.ok)continue;for(const out of part.ports){if(out.id===cp.id)continue;const error=outputError(probe,out,spec);if(!Number.isFinite(error))continue;const operatorBonus=(part.operators||[]).some(op=>(spec.operatorHint||'').includes(op))?-1000:0,score=error*1e6+volume(part)+operatorBonus,a={kind:'expose',cue,parentInst:parent.inst,parentPort:parent.port,part,childPort:cp,outputPort:out,connection,snap,incoming,error,score};if(!rejected.has(actionSig(a)))candidates.push(a)}}}candidates.sort((a,b)=>a.score-b.score);const tol=spec.tolerance??.05;return candidates.find(x=>x.error<=tol)||null}
function candidateForMate(cue){const target=cue.port,prefer=cue.feature.completion.preferFamily,candidates=[];for(const part of library.parts){if(partDisabled(part))continue;for(const cp of part.ports){const connection=compatibility(target.port,cp,rules);if(!connection)continue;const snap=snapChild(target.inst,target.port,part,cp,connection);if(!snap)continue;const probe={uid:'probe',partId:part.id,t:snap.t,r:snap.r,usedPorts:[cp.id]},incoming=physicalHandshake(target.inst,target.port,probe,cp,connection,rules);if(!incoming.ok)continue;const score=volume(part)+(part.family===prefer?0:1e8),a={kind:'mate',cue,parentInst:target.inst,parentPort:target.port,part,childPort:cp,connection,snap,incoming,error:0,score};if(!rejected.has(actionSig(a)))candidates.push(a)}}candidates.sort((a,b)=>a.score-b.score);return candidates[0]||null}
function chooseAction(cue){return cue.stage==='mate'?candidateForMate(cue):candidateForExpose(cue)}

// CONTACT DISCOVERY ----------------------------------------------------------
function secondaryContacts(child,action){
  const out=[],childPart=partOf(child);
  for(const other of assembly){
    if(other===child||other.provisional)continue;
    const otherPart=partOf(other);
    for(const op of otherPart.ports){
      if(isUsed(other,op.id))continue;
      for(const cp of childPart.ports){
        if(isUsed(child,cp.id))continue;
        const connection=compatibility(op,cp,rules);if(!connection)continue;
        const test=physicalHandshake(other,op,child,cp,connection,rules);
        if(!test.ok||!test.clickable)continue;
        out.push({parentUid:other.uid,parentPortId:op.id,childPortId:cp.id,connection,test});
        usePort(other,op.id);usePort(child,cp.id);break;
      }
    }
  }
  return out;
}
function rollback(child,action){for(const rec of child.secondaryJoints||[]){const parent=assembly.find(x=>x.uid===rec.parentUid);if(parent)unusePort(parent,rec.parentPortId)}assembly=assembly.filter(x=>x.uid!==child.uid);unusePort(action.parentInst,action.parentPort.id);rejected.add(actionSig(action));stats.rejected++}
function candidateContactPoint(action){return transformPoint(action.parentInst,action.parentPort.p)}

// TEST -> PLACE -> TEST -> AUDIT --------------------------------------------
async function tryAction(action){
  stats.tries++;const p=candidateContactPoint(action);$('#phase').textContent='TRY';$('#decision').textContent=`${action.part.id} ${action.part.name}`;$('#proof').textContent=`preflight ${handshakeSummary(action.incoming)}`;lastContact={p,ok:false};renderUI();await renderReal();await delay(260);
  const out=transformVector(action.parentInst,action.parentPort.n),approach=action.connection.approach||12,previewT=action.snap.t.map((v,i)=>v+out[i]*approach),child={uid:crypto.randomUUID(),partId:action.part.id,t:previewT,r:action.snap.r,usedPorts:[],color:colorFor(action.part),label:`response:${action.cue.feature.id}`,parent:action.parentInst.uid,provisional:true,secondaryJoints:[]};assembly.push(child);renderUI();await renderReal();await delay(300);
  child.t=[...action.snap.t];child.usedPorts=[action.childPort.id];child.provisional=false;child.jointRecord={parentPortId:action.parentPort.id,childPortId:action.childPort.id,connection:action.connection};usePort(action.parentInst,action.parentPort.id);
  const final=physicalHandshake(action.parentInst,action.parentPort,child,action.childPort,action.connection,rules);$('#phase').textContent='TEST';$('#proof').textContent=handshakeSummary(final);lastContact={p,ok:final.ok};renderUI();await renderReal();await delay(220);
  if(!final.ok){rollback(child,action);$('#phase').textContent='REJECT';$('#decision').textContent=`${action.part.id} rejected · ${final.reason}`;renderUI();await renderReal();return false}

  child.secondaryJoints=secondaryContacts(child,action);
  stats.audits++;const audit=auditAssembly(assembly,index,rules);
  if(!audit.ok){const bad=audit.joints.find(x=>!x.test.ok);rollback(child,action);$('#phase').textContent='ROLLBACK';$('#decision').textContent=`audit failed · ${bad?.test.reason||'unknown'}`;$('#proof').textContent=bad?handshakeSummary(bad.test):'audit failure';renderUI();await renderReal();return false}

  const contactCount=1+child.secondaryJoints.length;stats.placements++;stats.clicks+=contactCount;playClick(contactCount);$('#phase').textContent=contactCount>1?`CLICK ×${contactCount}`:'CLICK';$('#decision').textContent=`${action.part.id} accepted`;$('#proof').textContent=`${contactCount} verified contact${contactCount===1?'':'s'} now · ${audit.joints.length} total joints re-tested`;lastContact={p,ok:true};if(action.kind==='mate')completed.add(action.cue.feature.id);renderUI();await renderReal();await delay(380);return true;
}
async function hearAndAct(){stats.audits++;const before=auditAssembly(assembly,index,rules);if(!before.ok){const bad=before.joints.find(x=>!x.test.ok);$('#phase').textContent='STOP';$('#decision').textContent='existing handshake failed';$('#proof').textContent=handshakeSummary(bad?.test);renderUI();return'blocked'}const h=hear();renderUI();await renderReal();if(!h.strongest){$('#phase').textContent='QUIET';$('#decision').textContent='stop building';$('#proof').textContent='no local releaser remains';renderUI();return'complete'}const action=chooseAction(h.strongest);if(!action){$('#phase').textContent='STILL HEAR';$('#decision').textContent=h.strongest.feature.prerequisite.cry;$('#proof').textContent=`NO VERIFIED RESPONSE · ${h.strongest.feature.prerequisite.operatorHint}`;renderUI();return'blocked'}const ok=await tryAction(action);return ok?'acted':'retry'}
async function runBeaver(){if(running||!selfTestResult.ok)return;ensureAudio();running=true;toggleButtons(true);for(let i=0;i<30;i++){const r=await hearAndAct();if(r==='retry')continue;if(r!=='acted')break}running=false;toggleButtons(false);renderUI()}function toggleButtons(v){$('#runBtn').disabled=v;$('#stepBtn').disabled=v}
function makeSeed(){const p=index.get(field.seed.partId);assembly=[{uid:crypto.randomUUID(),partId:p.id,t:[0,0,0],r:ID,usedPorts:[],color:field.seed.color??16,label:field.seed.label,parent:null}]}
function reset(){completed=new Set();rejected=new Set();lastContact=null;stats={tries:0,rejected:0,clicks:0,placements:0,audits:0};makeSeed();hear();$('#phase').textContent='HEAR';$('#decision').textContent='read the strongest local releaser';$('#proof').textContent='nothing placed without a test';renderUI();renderReal()}
function colorFor(part){if((part.operators||[]).includes('TURN_PLANE_90'))return 14;if(part.id==='15573')return 4;if(part.id==='3700')return 1;if(part.family==='matter')return 72;return 71}

// BOOT SELF TESTS ------------------------------------------------------------
function snapTest(name,parentInst,parentPort,part,childPort,expect=true,mutate=null){const connection=compatibility(parentPort,childPort,rules);if(!connection)return{name,pass:!expect,detail:'no compatibility'};const snap=snapChild(parentInst,parentPort,part,childPort,connection);if(!snap)return{name,pass:!expect,detail:'no snap'};const child={uid:'test',partId:part.id,t:[...snap.t],r:snap.r,usedPorts:[childPort.id]};if(mutate)mutate(child,childPort);const t=physicalHandshake(parentInst,parentPort,child,childPort,connection,rules);return{name,pass:t.ok===expect,detail:handshakeSummary(t),snap,child,test:t}}
function runSelfTests(){const seed={uid:'seed',partId:'3020',t:[0,0,0],r:ID,usedPorts:[]},sp=index.get('3020');const a=snapTest('base → SNOT exact click',seed,sp.ports.find(p=>p.id==='top-0'),index.get('4070'),index.get('4070').ports.find(p=>p.id==='bottom'),true);const b=a.pass?snapTest('SNOT → side plate exact click',a.child,index.get('4070').ports.find(p=>p.id==='front'),index.get('3024'),index.get('3024').ports.find(p=>p.id==='bottom'),true):{name:'SNOT → side plate exact click',pass:false,detail:'dependency failed'};const c=snapTest('1 LDU miss must reject',seed,sp.ports.find(p=>p.id==='top-0'),index.get('4070'),index.get('4070').ports.find(p=>p.id==='bottom'),false,child=>{child.t[0]+=1});const semanticPort={...index.get('4070').ports.find(p=>p.id==='bottom'),confidence:'semantic'};const d=snapTest('semantic datum must reject',seed,sp.ports.find(p=>p.id==='top-0'),index.get('4070'),semanticPort,false);const e=snapTest('jumper receiver calibrated',seed,sp.ports.find(p=>p.id==='top-1'),index.get('15573'),index.get('15573').ports.find(p=>p.id==='bottom-l'),true);const f=snapTest('System → Technic brick stud seat',seed,sp.ports.find(p=>p.id==='top-6'),index.get('3700'),index.get('3700').ports.find(p=>p.id==='bottom-l'),true);const techParent=f.child,techPart=index.get('3700'),g=snapTest('pin mouth contact is NOT insertion',techParent,techPart.ports.find(p=>p.id==='hole-front'),index.get('2780'),index.get('2780').ports.find(p=>p.id==='a'),false);const tests=[a,b,c,d,e,f,g];return{ok:tests.every(x=>x.pass),tests,passed:tests.filter(x=>x.pass).length,total:tests.length}}
const selfTestResult=runSelfTests();

// UI -------------------------------------------------------------------------
function renderUI(){const h=hear(),action=h.strongest?chooseAction(h.strongest):null;$('#signals').textContent=`${h.unresolved.length} SIGNAL${h.unresolved.length===1?'':'S'}`;$('#parts').textContent=`${assembly.filter(x=>!x.provisional).length} PARTS`;$('#counts').textContent=`TRY ${stats.tries} · REJECT ${stats.rejected} · CLICK ${stats.clicks} · AUDIT ${stats.audits}`;$('#selftest').textContent=`SELF TEST ${selfTestResult.passed}/${selfTestResult.total}`;$('#selftest').className=selfTestResult.ok?'chip pass':'chip fail';if(!h.strongest){$('#hear').className='quiet';$('#hearLabel').textContent='QUIET';$('#hearText').textContent='Nothing is asking for another part.'}else{const blocked=!action;$('#hear').className=blocked?'blocked':'loud';$('#hearLabel').textContent=blocked?'STILL HEAR':'HEAR';$('#hearText').textContent=h.strongest.stage==='mate'?h.strongest.feature.completion.label:h.strongest.feature.prerequisite.cry}$('#cueList').innerHTML=h.states.map(s=>{const active=h.strongest?.feature.id===s.feature.id,actionHere=active?action:null,state=s.solved?'QUIET':active?(actionHere?'LOUD':'BLOCKED'):'WAIT';return`<div class="cue ${state.toLowerCase()}"><b>${state}</b><span>${s.feature.label}</span><small>${s.solved?'signal extinguished':(s.stage==='mate'?s.feature.completion.label:s.feature.prerequisite.cry)}</small></div>`}).join('');$('#pieceList').innerHTML=assembly.map((x,i)=>{const p=partOf(x),contacts=(x.jointRecord?1:0)+(x.secondaryJoints?.length||0);return`<div class="piece ${x.provisional?'provisional':''}"><b>${String(i+1).padStart(2,'0')} · ${p.id}</b><span>${p.name}</span><small>${x.provisional?'TRYING — NOT COMMITTED':`${x.label||''}${contacts?` · ${contacts} verified contact${contacts===1?'':'s'}`:''}`}</small></div>`}).join('');$('#breakBtn').textContent=breakSnot?'RESTORE SNOT VOCAB':'BREAK SNOT VOCAB';$('#breakBtn').classList.toggle('broken',breakSnot)}
$('#runBtn').onclick=()=>runBeaver();$('#stepBtn').onclick=async()=>{if(running||!selfTestResult.ok)return;ensureAudio();toggleButtons(true);await hearAndAct();toggleButtons(false);renderUI()};$('#resetBtn').onclick=()=>reset();$('#breakBtn').onclick=()=>{breakSnot=!breakSnot;reset()};$('#exportBtn').onclick=()=>{const clean=assembly.filter(x=>!x.provisional),text=toLDraw(clean,index,'BEAVER-CLOSED-LOOP'),blob=new Blob([text],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='beaver-closed-loop.mpd';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
$('#testDetail').innerHTML=selfTestResult.tests.map(t=>`<div class="unit ${t.pass?'ok':'bad'}"><b>${t.pass?'PASS':'FAIL'} · ${t.name}</b><small>${t.detail}</small></div>`).join('');if(!selfTestResult.ok){$('#runBtn').disabled=true;$('#stepBtn').disabled=true}reset();

import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {LDrawLoader} from 'three/addons/loaders/LDrawLoader.js';
import {LDrawConditionalLineMaterial} from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import {loadIndex,compatibility,snapChild,transformPoint,transformVector,toLDraw,ID} from '../src/engine.js';
import {physicalHandshake,auditAssembly,handshakeSummary} from '../beaver/handshake.js';

const [library,rules,overrides]=await Promise.all([
  fetch('../library/core.json',{cache:'no-store'}).then(r=>r.json()),
  fetch('../library/compatibility.json',{cache:'no-store'}).then(r=>r.json()),
  fetch('../library/seam-overrides.json',{cache:'no-store'}).then(r=>r.json())
]);
for(const [id,patches] of Object.entries(overrides.parts||{})){
  const part=library.parts.find(p=>p.id===id);if(!part)continue;
  if(patches.replacePorts)part.ports=patches.replacePorts;
  for(const [portId,patch] of Object.entries(patches)){
    if(portId==='replacePorts')continue;
    const port=part.ports.find(p=>p.id===portId);if(port)Object.assign(port,patch);
  }
}

function baseplate16(){
  const ports=[];
  for(let iz=0;iz<16;iz++)for(let ix=0;ix<16;ix++)ports.push({
    id:`top-${ix}-${iz}`,type:'stud',gender:'male',p:[-150+ix*20,0,-150+iz*20],n:[0,-1,0],up:[0,0,-1],confidence:'exact',
    provenance:'3867.dat -> stug8.dat -> stug-8x8.dat'
  });
  return{id:'3867',file:'3867.dat',name:'Baseplate 16 x 16',family:'substrate',dims:[320,4,320],ports,operators:['GROUND_GRID','SUPPORT_FIELD'],tags:['baseplate','substrate','real-ldraw','calibrated-grid']};
}
library.parts.push(baseplate16());

const X=[-70,-50,-30,-10,10,30,50,70],Z=[-50,-30,-10,10,30,50],WALL_LEVELS=3,BRICK_H=24,ROOF_Y=-(WALL_LEVELS*BRICK_H+8);
function makeHouseField(){
  const features=[],seen=new Set();let order=0;
  const addWall=(x,z,level,label)=>{
    const key=`${x}|${z}|${level}`;if(seen.has(key))return;seen.add(key);
    features.push({id:`wall-${level}-${x}-${z}`,group:`wall-${level}`,kind:'wall',severity:100000-level*1000-order++,label,
      prerequisite:{kind:'port',type:'stud',gender:'male',p:[x,-BRICK_H*level,z],n:[0,-1,0],tolerance:.05,cry:`WALL LEVEL ${level} NEEDS SUPPORT AT ${x},${z}`,operatorHint:'EXTEND / SPAN',preferFamily:'matter'},
      completion:{kind:'port'}});
  };
  for(let level=1;level<=WALL_LEVELS;level++){
    for(const x of X){
      const frontDoor=(x===-10||x===10);
      const frontWindow=(x===-50||x===50)&&level>=2;
      if(!frontDoor&&!frontWindow)addWall(x,Z[0],level,'FRONT WALL');
      const backWindow=(x===-30||x===30)&&level>=2;
      if(!backWindow)addWall(x,Z.at(-1),level,'BACK WALL');
    }
    for(const z of Z){addWall(X[0],z,level,'LEFT WALL');addWall(X.at(-1),z,level,'RIGHT WALL');}
  }
  for(const x of [-10,10])for(const z of Z){
    features.push({id:`roof-${x}-${z}`,group:'roof',kind:'roof',severity:1000-order++,label:'ROOF FIELD',
      prerequisite:{kind:'port',type:'stud',gender:'male',p:[x,ROOF_Y,z],n:[0,-1,0],tolerance:.05,cry:`ROOF MUST REACH ${x},${z}`,operatorHint:'SPAN / THIN',preferFamily:'resolution',minSpan:55},completion:{kind:'port'}});
  }
  return{version:'1.0.0',name:'WHOLE HOUSE / 8 x 6',principle:'The house is a field of unresolved structural demands. The beaver chooses real parts that silence the most demands with verified contacts.',seed:{partId:'3867',color:2,label:'SITE SLAB / REAL 16 x 16 BASEPLATE'},features};
}
const field=makeHouseField();
const index=loadIndex(library),$=s=>document.querySelector(s),delay=ms=>new Promise(r=>setTimeout(r,ms));
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]),volume=p=>(p.dims||[99,99,99]).reduce((a,b)=>a*b,1);
rules.clickPositionTolerance=.001;rules.clickLateralTolerance=.001;rules.clickAxialTolerance=.001;rules.clickNormalTolerance=.999999;

let assembly=[],completed=new Set(),rejected=new Set(),running=false,strongest=null,lastContact=null;
let stats={tries:0,rejected:0,clicks:0,placements:0,audits:0};let audioCtx=null;
function partOf(inst){return index.get(inst.partId)}function isUsed(inst,id){return(inst.usedPorts||[]).includes(id)}function usePort(inst,id){inst.usedPorts??=[];if(!inst.usedPorts.includes(id))inst.usedPorts.push(id)}function unusePort(inst,id){inst.usedPorts=(inst.usedPorts||[]).filter(x=>x!==id)}
function actionSig(a){return`${a.cue.feature.id}|${a.parentInst.uid}|${a.parentPort.id}|${a.part.id}|${a.childPort.id}|${a.outputPort?.id||''}`}

function ensureAudio(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}
function oneClick(at){const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type='square';o.frequency.setValueAtTime(1150,at);o.frequency.exponentialRampToValueAtTime(340,at+.035);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(.12,at+.002);g.gain.exponentialRampToValueAtTime(.0001,at+.045);o.connect(g).connect(audioCtx.destination);o.start(at);o.stop(at+.05)}
function playClick(count=1){if(!audioCtx)return;for(let i=0;i<Math.min(count,5);i++)oneClick(audioCtx.currentTime+i*.045)}

const host=$('#threeHost'),renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.setClearColor(0xf3f1ea,1);renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(38,1,.1,10000),controls=new OrbitControls(camera,renderer.domElement);camera.position.set(360,250,420);controls.enableDamping=true;controls.dampingFactor=.08;scene.add(new THREE.HemisphereLight(0xffffff,0x666666,2.6));const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(300,500,280);scene.add(sun);const grid=new THREE.GridHelper(420,21,0x999999,0xd3d0c8);grid.visible=false;scene.add(grid);
const loader=new LDrawLoader();loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);loader.setPartsLibraryPath('../../ldraw/');let ldrawReady=false,modelWrapper=null,renderSerial=0;
function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}function animate(){requestAnimationFrame(animate);resize();controls.update();renderer.render(scene,camera)}animate();
function dispose(root){root?.traverse(o=>{o.geometry?.dispose?.();const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];ms.forEach(m=>m?.dispose?.())})}function clearModel(){if(modelWrapper){scene.remove(modelWrapper);dispose(modelWrapper);modelWrapper=null}grid.visible=false}
function fit(root){const b=new THREE.Box3().setFromObject(root);if(b.isEmpty())return;const size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3()),d=Math.max(size.x,size.y,size.z,120);controls.target.copy(center);camera.position.set(center.x+d*1.18,center.y+d*.84,center.z+d*1.35);camera.near=.1;camera.far=Math.max(3000,d*50);camera.updateProjectionMatrix();controls.update();grid.position.y=b.min.y-.7;grid.visible=true}
function cueMarkers(){const g=new THREE.Group(),states=field.features.map(featureState).filter(x=>!x.solved).sort((a,b)=>b.feature.severity-a.feature.severity).slice(0,10);for(const s0 of states){const f=s0.feature,active=strongest?.feature.id===f.id,color=active?0xff2d20:0xff9d19,r=active?4:2.2,s=new THREE.Mesh(new THREE.SphereGeometry(r,14,9),new THREE.MeshBasicMaterial({color,depthTest:false,transparent:true,opacity:.9}));s.position.set(...f.prerequisite.p);s.renderOrder=20;g.add(s)}if(lastContact?.p){const color=lastContact.ok?0x00dd77:0xff0033,s=new THREE.Mesh(new THREE.SphereGeometry(lastContact.ok?2.4:3.2,16,10),new THREE.MeshBasicMaterial({color,depthTest:false,transparent:true,opacity:.95}));s.position.set(...lastContact.p);s.renderOrder=25;g.add(s)}return g}
async function renderReal(forceFit=true){const serial=++renderSerial;if(!ldrawReady||!assembly.length)return;const mpd=toLDraw(assembly,index,'BEAVER-WHOLE-HOUSE');return new Promise(resolve=>loader.parse(mpd,group=>{if(serial!==renderSerial){dispose(group);resolve();return}clearModel();modelWrapper=new THREE.Group();modelWrapper.rotation.x=Math.PI;modelWrapper.add(group);modelWrapper.add(cueMarkers());scene.add(modelWrapper);if(forceFit)fit(modelWrapper);resolve()},err=>{console.error('[LDRAW]',err);$('#geom').textContent='LDRAW ERROR';resolve()}))}
try{const r=await fetch('../../ldraw/LDConfig.ldr',{cache:'no-store'});if(!r.ok)throw new Error(`LDConfig ${r.status}`);await loader.preloadMaterials('../../ldraw/LDConfig.ldr');ldrawReady=true;$('#geom').textContent='REAL LDRAW READY'}catch(err){console.error(err);$('#geom').textContent='LDRAW INIT ERROR'}

function openPorts(){const out=[];for(const inst of assembly){if(inst.provisional)continue;for(const port of partOf(inst).ports)if(!isUsed(inst,port.id))out.push({inst,port,p:transformPoint(inst,port.p),n:transformVector(inst,port.n)})}return out}
function matchingOpenPort(spec){let best=null;for(const row of openPorts()){if(row.port.type!==spec.type||row.port.gender!==spec.gender)continue;const d=dist(row.p,spec.p),nd=dot(row.n,spec.n),score=d+(1-nd)*100;if(!best||score<best.score)best={...row,d,nd,score}}return best&&best.d<=(spec.tolerance??.05)&&best.nd>.999?best:null}
function featureState(feature){if(completed.has(feature.id))return{solved:true,feature};const port=matchingOpenPort(feature.prerequisite);if(feature.completion.kind==='port'){if(port){completed.add(feature.id);return{solved:true,feature,port}}return{solved:false,stage:'expose',feature}}return port?{solved:false,stage:'mate',feature,port}:{solved:false,stage:'expose',feature}}
function hear(){const states=field.features.map(featureState),unresolved=states.filter(x=>!x.solved).sort((a,b)=>b.feature.severity-a.feature.severity);strongest=unresolved[0]||null;return{states,unresolved,strongest}}
function outputError(inst,port,spec){if(port.type!==spec.type||port.gender!==spec.gender||port.confidence!=='exact')return Infinity;const p=transformPoint(inst,port.p),n=transformVector(inst,port.n);return dist(p,spec.p)+(1-dot(n,spec.n))*100}
const posKey=p=>`${Math.round(p[0]*1000)}|${Math.round(p[1]*1000)}|${Math.round(p[2]*1000)}`;
function openPortMap(rows){const map=new Map();for(const row of rows){const k=posKey(row.p);if(!map.has(k))map.set(k,[]);map.get(k).push(row)}return map}
function solvedByRows(spec,rows){for(const row of rows){if(row.port.type!==spec.type||row.port.gender!==spec.gender)continue;if(dist(row.p,spec.p)>(spec.tolerance??.05))continue;if(dot(row.n,spec.n)>.999)return true}return false}
function groupTargetSets(feature,rows){const open=new Set(),all=new Set();for(const f of field.features){if(f.group!==feature.group)continue;const k=posKey(f.prerequisite.p);all.add(k);if(!solvedByRows(f.prerequisite,rows))open.add(k)}return{open,all}}
function candidateCoverage(probe,part,targets){const hits=new Set();for(const p of part.ports){if(p.confidence!=='exact'||p.type!=='stud'||p.gender!=='male')continue;const k=posKey(transformPoint(probe,p.p));if(targets.open.has(k))hits.add(k)}return Math.max(1,hits.size)}
function candidateSpill(probe,part,feature,targets){let spill=0;for(const p of part.ports){if(p.confidence!=='exact'||p.type!=='stud'||p.gender!=='male')continue;const wp=transformPoint(probe,p.p);if(Math.abs(wp[1]-feature.prerequisite.p[1])>.1)continue;if(!targets.all.has(posKey(wp)))spill++}return spill}
function potentialSupportCount(probe,part,rows,rowMap){let count=0;const usedChild=new Set(),usedParent=new Set();for(const cp of part.ports){if(cp.confidence!=='exact'||cp.type!=='stud'||cp.gender!=='female'||usedChild.has(cp.id))continue;const candidates=rowMap.get(posKey(transformPoint(probe,cp.p)))||[];for(const row of candidates){const pk=`${row.inst.uid}|${row.port.id}`;if(usedParent.has(pk))continue;const connection=compatibility(row.port,cp,rules);if(!connection)continue;const test=physicalHandshake(row.inst,row.port,probe,cp,connection,rules);if(test.ok&&test.clickable){usedChild.add(cp.id);usedParent.add(pk);count++;break}}}return count}
function sameTransformExists(probe){return assembly.some(x=>!x.provisional&&x.partId===probe.partId&&dist(x.t,probe.t)<.001&&x.r.every((v,i)=>Math.abs(v-probe.r[i])<1e-9))}

function candidateForExpose(cue){const spec=cue.feature.prerequisite,candidates=[],rows=openPorts(),rowMap=openPortMap(rows),targets=groupTargetSets(cue.feature,rows),near=rows.filter(r=>dist(r.p,spec.p)<=110);for(const parent of near)for(const part of library.parts){if(part.family==='substrate')continue;for(const cp of part.ports){if(cp.confidence!=='exact')continue;const connection=compatibility(parent.port,cp,rules);if(!connection)continue;const snap=snapChild(parent.inst,parent.port,part,cp,connection);if(!snap)continue;const probe={uid:'probe',partId:part.id,t:snap.t,r:snap.r,usedPorts:[cp.id]},incoming=physicalHandshake(parent.inst,parent.port,probe,cp,connection,rules);if(!incoming.ok||sameTransformExists(probe))continue;for(const out of part.ports){if(out.id===cp.id)continue;const error=outputError(probe,out,spec);if(!Number.isFinite(error))continue;const span=dist(transformPoint(probe,cp.p),transformPoint(probe,out.p));if(spec.minSpan&&span<spec.minSpan)continue;const coverage=candidateCoverage(probe,part,targets),spill=candidateSpill(probe,part,cue.feature,targets),supports=potentialSupportCount(probe,part,rows,rowMap),familyPenalty=spec.preferFamily&&part.family!==spec.preferFamily?100000:0,operatorBonus=(part.operators||[]).some(op=>(spec.operatorHint||'').includes(op))?-500:0,score=error*1e9+volume(part)/(coverage*coverage)+spill*1000-supports*650+familyPenalty+operatorBonus,a={kind:'expose',cue,parentInst:parent.inst,parentPort:parent.port,part,childPort:cp,outputPort:out,connection,snap,incoming,error,score,coverage,spill,supports,span};if(!rejected.has(actionSig(a)))candidates.push(a)}}}candidates.sort((a,b)=>a.score-b.score||b.coverage-a.coverage||b.supports-a.supports);const tol=spec.tolerance??.05;return candidates.find(x=>x.error<=tol)||null}
function chooseAction(cue){return candidateForExpose(cue)}

function secondaryContacts(child){const out=[],childPart=partOf(child);for(const other of assembly){if(other===child||other.provisional)continue;const otherPart=partOf(other);for(const op of otherPart.ports){if(isUsed(other,op.id))continue;for(const cp of childPart.ports){if(isUsed(child,cp.id))continue;const connection=compatibility(op,cp,rules);if(!connection)continue;const test=physicalHandshake(other,op,child,cp,connection,rules);if(!test.ok||!test.clickable)continue;out.push({parentUid:other.uid,parentPortId:op.id,childPortId:cp.id,connection,test});usePort(other,op.id);usePort(child,cp.id);break}}}return out}
function rollback(child,action){for(const rec of child.secondaryJoints||[]){const parent=assembly.find(x=>x.uid===rec.parentUid);if(parent)unusePort(parent,rec.parentPortId)}assembly=assembly.filter(x=>x.uid!==child.uid);unusePort(action.parentInst,action.parentPort.id);rejected.add(actionSig(action));stats.rejected++}
function candidateContactPoint(action){return transformPoint(action.parentInst,action.parentPort.p)}
function colorFor(action){if(action.cue.feature.kind==='roof')return 4;if(action.cue.feature.kind==='wall')return 15;return 71}

async function tryAction(action,visual=false){
  stats.tries++;const p=candidateContactPoint(action);lastContact={p,ok:false};$('#phase').textContent='TRY';$('#decision').textContent=`${action.part.id} ${action.part.name}`;$('#proof').textContent=`covers ${action.coverage} demand${action.coverage===1?'':'s'} · ${action.supports} support contact${action.supports===1?'':'s'} · ${handshakeSummary(action.incoming)}`;renderUI();
  const out=transformVector(action.parentInst,action.parentPort.n),approach=action.connection.approach||10,previewT=action.snap.t.map((v,i)=>v+out[i]*approach),child={uid:crypto.randomUUID(),partId:action.part.id,t:visual?previewT:[...action.snap.t],r:action.snap.r,usedPorts:[],color:colorFor(action),label:`${action.cue.feature.kind}:${action.cue.feature.group}`,parent:action.parentInst.uid,provisional:visual,secondaryJoints:[]};assembly.push(child);
  if(visual){renderUI();await renderReal(false);await delay(180);child.t=[...action.snap.t];child.provisional=false}
  child.usedPorts=[action.childPort.id];child.jointRecord={parentPortId:action.parentPort.id,childPortId:action.childPort.id,connection:action.connection};usePort(action.parentInst,action.parentPort.id);
  const final=physicalHandshake(action.parentInst,action.parentPort,child,action.childPort,action.connection,rules);$('#phase').textContent='TEST';$('#proof').textContent=handshakeSummary(final);lastContact={p,ok:final.ok};if(!final.ok){rollback(child,action);$('#phase').textContent='REJECT';$('#decision').textContent=`${action.part.id} rejected · ${final.reason}`;renderUI();if(visual)await renderReal(false);return false}
  child.secondaryJoints=secondaryContacts(child);stats.audits++;const audit=auditAssembly(assembly,index,rules);if(!audit.ok){const bad=audit.joints.find(x=>!x.test.ok);rollback(child,action);$('#phase').textContent='ROLLBACK';$('#decision').textContent=`audit failed · ${bad?.test.reason||'unknown'}`;$('#proof').textContent=bad?handshakeSummary(bad.test):'audit failure';renderUI();if(visual)await renderReal(false);return false}
  const contactCount=1+child.secondaryJoints.length;stats.placements++;stats.clicks+=contactCount;playClick(contactCount);$('#phase').textContent=contactCount>1?`CLICK ×${contactCount}`:'CLICK';$('#decision').textContent=`${action.part.id} accepted · ${action.coverage} local demand${action.coverage===1?'':'s'} silenced`;$('#proof').textContent=`${contactCount} verified contact${contactCount===1?'':'s'} now · ${audit.joints.length} accumulated joints re-tested`;lastContact={p,ok:true};renderUI();if(visual){await renderReal(false);await delay(140)}return true;
}
async function hearAndAct(visual=false){stats.audits++;const before=auditAssembly(assembly,index,rules);if(!before.ok){const bad=before.joints.find(x=>!x.test.ok);$('#phase').textContent='STOP';$('#decision').textContent='existing handshake failed';$('#proof').textContent=handshakeSummary(bad?.test);renderUI();return'blocked'}const h=hear();renderUI();if(!h.strongest){$('#phase').textContent='QUIET';$('#decision').textContent='whole house field is quiet';$('#proof').textContent='every programmed structural demand has a verified exposed port';renderUI();return'complete'}const action=chooseAction(h.strongest);if(!action){$('#phase').textContent='STILL HEAR';$('#decision').textContent=h.strongest.feature.prerequisite.cry;$('#proof').textContent='NO VERIFIED RESPONSE IN CURRENT VOCABULARY';renderUI();return'blocked'}const ok=await tryAction(action,visual);return ok?'acted':'retry'}
async function runBeaver(){if(running||!selfTestResult.ok)return;ensureAudio();running=true;toggleButtons(true);for(let i=0;i<180;i++){const result=await hearAndAct(false);if(result==='retry')continue;if(result!=='acted')break;if(stats.placements%2===0){renderUI();await renderReal(false);await delay(18)}}running=false;toggleButtons(false);renderUI();await renderReal(true)}
function toggleButtons(v){$('#runBtn').disabled=v;$('#stepBtn').disabled=v;$('#resetBtn').disabled=v}
function makeSeed(){const p=index.get(field.seed.partId);assembly=[{uid:crypto.randomUUID(),partId:p.id,t:[0,0,0],r:ID,usedPorts:[],color:field.seed.color??16,label:field.seed.label,parent:null}]}
function reset(){completed=new Set();rejected=new Set();lastContact=null;stats={tries:0,rejected:0,clicks:0,placements:0,audits:0};makeSeed();hear();$('#phase').textContent='HEAR';$('#decision').textContent='site slab is listening for the first wall demand';$('#proof').textContent='house program: 8 x 6 studs · 3 brick levels · door · window slots · six real roof plates expected';renderUI();renderReal(true)}

function snapTest(name,parentInst,parentPort,part,childPort,expect=true,mutate=null){const connection=compatibility(parentPort,childPort,rules);if(!connection)return{name,pass:!expect,detail:'no compatibility'};const snap=snapChild(parentInst,parentPort,part,childPort,connection);if(!snap)return{name,pass:!expect,detail:'no snap'};const child={uid:'test',partId:part.id,t:[...snap.t],r:snap.r,usedPorts:[childPort.id]};if(mutate)mutate(child,childPort);const t=physicalHandshake(parentInst,parentPort,child,childPort,connection,rules);return{name,pass:t.ok===expect,detail:handshakeSummary(t),snap,child,test:t}}
function runSelfTests(){const bp=index.get('3867'),seed={uid:'seed',partId:'3867',t:[0,0,0],r:ID,usedPorts:[]},stud=bp.ports.find(p=>p.p[0]===-70&&p.p[2]===-50),brick=index.get('3005'),a=snapTest('real baseplate datum → brick exact click',seed,stud,brick,brick.ports.find(p=>p.id==='bottom'),true),b=snapTest('1 LDU miss rejects house brick',seed,stud,brick,brick.ports.find(p=>p.id==='bottom'),false,child=>{child.t[0]+=1});const plate=index.get('3020'),wall={uid:'wall',partId:'3005',t:[-70,-72,-30],r:ID,usedPorts:[]},top=brick.ports.find(p=>p.id==='top'),c=snapTest('roof plate can seat on wall stud',wall,top,plate,plate.ports.find(p=>p.id==='bottom-0'),true),tests=[a,b,c];return{ok:tests.every(x=>x.pass),tests,passed:tests.filter(x=>x.pass).length,total:tests.length}}
const selfTestResult=runSelfTests();

function renderUI(){const h=hear(),action=h.strongest?chooseAction(h.strongest):null,solved=field.features.length-h.unresolved.length,wallTotal=field.features.filter(f=>f.kind==='wall').length,wallOpen=h.unresolved.filter(s=>s.feature.kind==='wall').length,roofOpen=h.unresolved.filter(s=>s.feature.kind==='roof').length;$('#signals').textContent=`${h.unresolved.length} OPEN`;$('#parts').textContent=`${assembly.filter(x=>!x.provisional).length} PARTS`;$('#counts').textContent=`CLICK ${stats.clicks} · AUDIT ${stats.audits}`;$('#progress').textContent=`${solved}/${field.features.length}`;$('#selftest').textContent=`SELF TEST ${selfTestResult.passed}/${selfTestResult.total}`;$('#selftest').className=selfTestResult.ok?'chip pass':'chip fail';$('#geom').textContent=ldrawReady?`REAL LDRAW · WALL ${wallTotal-wallOpen}/${wallTotal} · ROOF ${12-roofOpen}/12`:'LDRAW INIT';if(!h.strongest){$('#hear').className='quiet';$('#hearLabel').textContent='QUIET';$('#hearText').textContent='The house has stopped asking.'}else{const blocked=!action;$('#hear').className=blocked?'blocked':'loud';$('#hearLabel').textContent=blocked?'STILL HEAR':h.strongest.feature.kind.toUpperCase();$('#hearText').textContent=h.strongest.feature.prerequisite.cry}const next=h.states.filter(s=>!s.solved).slice(0,24);$('#cueList').innerHTML=next.map(s=>{const active=h.strongest?.feature.id===s.feature.id,act=active?action:null,state=active?(act?'LOUD':'BLOCKED'):'WAIT';return`<div class="cue ${state.toLowerCase()}"><b>${state}</b><span>${s.feature.label}</span><small>${s.feature.group} · ${s.feature.prerequisite.p.join(', ')}</small></div>`}).join('')||'<div class="cue quiet"><b>QUIET</b><span>HOUSE COMPLETE</span></div>';$('#pieceList').innerHTML=assembly.slice(-40).map((x,i)=>{const p=partOf(x),contacts=(x.jointRecord?1:0)+(x.secondaryJoints?.length||0),n=Math.max(1,assembly.length-39)+i;return`<div class="piece ${x.provisional?'provisional':''}"><b>${String(n).padStart(2,'0')} · ${p.id}</b><span>${p.name}</span><small>${x.provisional?'TRYING — NOT COMMITTED':`${x.label||''}${contacts?` · ${contacts} verified contact${contacts===1?'':'s'}`:''}`}</small></div>`}).join('')}

$('#runBtn').onclick=()=>runBeaver();$('#stepBtn').onclick=async()=>{if(running||!selfTestResult.ok)return;ensureAudio();toggleButtons(true);await hearAndAct(true);toggleButtons(false);renderUI()};$('#resetBtn').onclick=()=>reset();$('#exportBtn').onclick=()=>{const clean=assembly.filter(x=>!x.provisional),text=toLDraw(clean,index,'BEAVER-WHOLE-HOUSE'),blob=new Blob([text],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='beaver-whole-house.mpd';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
$('#testDetail').innerHTML=selfTestResult.tests.map(t=>`<div class="unit ${t.pass?'ok':'bad'}"><b>${t.pass?'PASS':'FAIL'} · ${t.name}</b><small>${t.detail}</small></div>`).join('');if(!selfTestResult.ok){$('#runBtn').disabled=true;$('#stepBtn').disabled=true}reset();

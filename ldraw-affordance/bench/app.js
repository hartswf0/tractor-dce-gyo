import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import {loadIndex,compatibility,scoreSuite,ablation,varietyScore,bestConnection,snapChild,inspectSeam,findCoincidentConnections,transformVector,toLDraw,seamTax,ID} from '../src/engine.js';

const [library,rules,tasks,overrides]=await Promise.all([
  fetch('../library/core.json',{cache:'no-store'}).then(r=>r.json()),
  fetch('../library/compatibility.json',{cache:'no-store'}).then(r=>r.json()),
  fetch('../tests/task-suite.json').then(r=>r.json()),
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
library.version=`${library.version} + seams ${overrides.version}`;
const index=loadIndex(library);
let assembly=[],selectedInstance=null,selectedPort=null;
let demoPlan=null,demoCursor=0,demoNodes={},demoBusy=false;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
$('#partCount').textContent=`${library.parts.length} parts · ${library.version}`;

// REAL LDRAW -----------------------------------------------------------------
const host=$('#threeHost');
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setClearColor(0xf2f1ec,1);renderer.outputColorSpace=THREE.SRGBColorSpace;host.appendChild(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(36,1,.1,20000);camera.position.set(180,130,210);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;
scene.add(new THREE.HemisphereLight(0xffffff,0x777777,2.5));
const key=new THREE.DirectionalLight(0xffffff,2.4);key.position.set(220,300,180);scene.add(key);
const fill=new THREE.DirectionalLight(0xffffff,1);fill.position.set(-160,100,-140);scene.add(fill);
const grid=new THREE.GridHelper(340,17,0x999999,0xd1d1cc);grid.visible=false;scene.add(grid);
const loader=new LDrawLoader();loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);loader.setPartsLibraryPath('../../ldraw/');
let ldrawReady=false,modelWrapper=null,renderSerial=0;
function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function animate(){requestAnimationFrame(animate);resize();controls.update();renderer.render(scene,camera)}animate();
function dispose(root){root?.traverse(o=>{o.geometry?.dispose?.();const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];ms.forEach(m=>m?.dispose?.())})}
function clearModel(){if(modelWrapper){scene.remove(modelWrapper);dispose(modelWrapper);modelWrapper=null}grid.visible=false}
function fit(root){const box=new THREE.Box3().setFromObject(root);if(box.isEmpty())return;const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),d=Math.max(size.x,size.y,size.z,45);controls.target.copy(center);camera.position.set(center.x+d*1.35,center.y+d*.9,center.z+d*1.55);camera.near=Math.max(.1,d/300);camera.far=Math.max(3000,d*40);camera.updateProjectionMatrix();controls.update();grid.position.y=box.min.y-.6;grid.visible=true}
function geomStats(root){let meshes=0,triangles=0;root.traverse(o=>{if(o.isMesh&&o.geometry){meshes++;triangles+=o.geometry.index?o.geometry.index.count/3:(o.geometry.attributes.position?.count||0)/3}});return{meshes,triangles:Math.round(triangles)}}
try{const probe=await fetch('../../ldraw/LDConfig.ldr',{cache:'no-store'});if(!probe.ok)throw new Error(`LDConfig HTTP ${probe.status}`);await loader.preloadMaterials('../../ldraw/LDConfig.ldr');ldrawReady=true;$('#geomStatus').textContent='REAL LDRAW READY';$('#viewnote').textContent='Watch the seams: approach → seat/insert → click.'}catch(err){console.error('[LDRAW INIT]',err);$('#geomStatus').textContent='LDRAW INIT ERROR';$('#viewnote').textContent=String(err?.message||err)}
function renderReal(){const serial=++renderSerial;if(!assembly.length){clearModel();$('#geomStatus').textContent=ldrawReady?'REAL LDRAW READY':'LDRAW NOT READY';return Promise.resolve()}if(!ldrawReady)return Promise.resolve();const mpd=toLDraw(assembly,index,'AFFORDANCE-BUILD');$('#geomStatus').textContent='PARSING REAL .DAT…';return new Promise(resolve=>{try{loader.parse(mpd,group=>{if(serial!==renderSerial){dispose(group);resolve();return}clearModel();group.rotation.x=Math.PI;modelWrapper=new THREE.Group();modelWrapper.add(group);scene.add(modelWrapper);fit(modelWrapper);const s=geomStats(modelWrapper);$('#geomStatus').textContent=`REAL LDRAW · ${assembly.length} PARTS · ${s.meshes} MESHES`;resolve()},err=>{console.error('[LDRAW PARSE]',err);$('#geomStatus').textContent='LDRAW BUILD ERROR';$('#viewnote').textContent=String(err?.message||err);resolve()})}catch(err){console.error('[LDRAW PARSE]',err);$('#geomStatus').textContent='LDRAW BUILD ERROR';resolve()}})}

// SEAMS ----------------------------------------------------------------------
const delay=ms=>new Promise(r=>setTimeout(r,ms));
function instancePart(i){return index.get(i.partId)}
function isUsed(inst,id){return(inst.usedPorts||[]).includes(id)}
function usePort(inst,id){if(!inst.usedPorts.includes(id))inst.usedPorts.push(id)}
function coverage(){return new Set(assembly.map(x=>x.partId)).size}
function makeRoot(part,color=16,label='ROOT'){const inst={uid:crypto.randomUUID(),partId:part.id,t:[0,0,0],r:ID,usedPorts:[],seamTax:0,parent:null,color,label,seamState:'ROOT',seamCount:0};assembly=[inst];selectedInstance=inst;selectedPort=part.ports.find(p=>p.gender==='male')?.id||part.ports[0]?.id;refresh();return inst}
function exactSnap(parent,pp,part,childPortId){
  if(!childPortId)return bestConnection(parent,instancePart(parent),pp.id,part,rules);
  const cp=part.ports.find(p=>p.id===childPortId),c=cp&&compatibility(pp,cp,rules);if(!cp||!c)return null;
  const snapped=snapChild(parent,pp,part,cp,c);if(!snapped)return null;
  const probe={partId:part.id,t:snapped.t,r:snapped.r},seam=inspectSeam(parent,pp,probe,cp,c,rules);if(!seam.ok)return null;
  return {...snapped,parentPortId:pp.id,childPortId:cp.id,...c,seam};
}
async function attach(parent,portId,partId,color=16,label='',childPortId=null){
  const part=index.get(partId),pp=instancePart(parent)?.ports.find(p=>p.id===portId);if(!part||!pp||isUsed(parent,portId)){flash(`OPEN SEAM · ${portId}`);return null}
  const snap=exactSnap(parent,pp,part,childPortId);if(!snap){flash(`NO MATE · ${portId} → ${partId}`);return null}
  usePort(parent,pp.id);
  const finalT=[...snap.t],out=transformVector(parent,pp.n),previewT=finalT.map((v,i)=>v+out[i]*(snap.approach||12));
  const child={uid:crypto.randomUUID(),partId,t:previewT,r:snap.r,usedPorts:[snap.childPortId],seamTax:0,parent:parent.uid,joint:snap.joint,via:`${pp.id} ↔ ${snap.childPortId}`,color,label,seamState:'APPROACH',seamCount:0,motion:snap.motion};
  assembly.push(child);selectedInstance=child;selectedPort=null;$('#trace').textContent=`${label||part.name} · ${snap.motion.toUpperCase()} · APPROACH`;refresh();
  await delay(220);
  child.t=finalT;child.seamTax=snap.tax;child.seamState=snap.seam.status;child.seamCount=1;
  const extras=findCoincidentConnections(assembly,child,index,rules);
  for(const hit of extras){usePort(hit.other,hit.pp.id);usePort(child,hit.cp.id);child.seamTax+=hit.connection.tax;child.seamCount++;if(hit.seam.status==='CALIBRATE')child.seamState='CALIBRATE';else if(hit.seam.status==='INFERRED'&&child.seamState==='CLICKED')child.seamState='INFERRED'}
  selectedPort=part.ports.find(p=>!isUsed(child,p.id))?.id||null;
  $('#trace').textContent=`${label||part.name} · ${child.seamState} · ${child.seamCount} CONTACT${child.seamCount===1?'':'S'} · tax ${child.seamTax.toFixed(2)}`;
  refresh();await delay(280);return child;
}
async function addPart(part){if(!assembly.length)return makeRoot(part,16,part.name);const parent=selectedInstance||assembly.at(-1);if(!selectedPort){flash('SELECT AN OPEN PORT');return null}return attach(parent,selectedPort,part.id,16,part.name)}
function resetAssembly(){assembly=[];selectedInstance=null;selectedPort=null;demoCursor=0;demoNodes={};refresh()}
function flash(text){const n=$('#viewnote'),old=n.textContent;n.textContent=text;n.classList.add('hot');setTimeout(()=>{n.textContent=old;n.classList.remove('hot')},1200)}

// UI -------------------------------------------------------------------------
function renderPorts(){const el=$('#ports');el.innerHTML='';if(!selectedInstance){el.innerHTML='<span class="emptyHint">Select a part or run a build.</span>';return}const part=instancePart(selectedInstance);for(const port of part.ports){const b=document.createElement('button');b.className='portBtn'+(isUsed(selectedInstance,port.id)?' used':'')+(selectedPort===port.id?' selected':'');b.disabled=isUsed(selectedInstance,port.id);b.innerHTML=`<b>${port.id}</b><small>${port.gender} ${port.type} · ${port.datum||'datum'} · ${port.confidence}</small>`;b.onclick=()=>{selectedPort=port.id;renderPorts();renderParts()};el.appendChild(b)}}
function renderParts(){const target=selectedInstance&&selectedPort?instancePart(selectedInstance).ports.find(p=>p.id===selectedPort):null,el=$('#parts');el.innerHTML='';for(const p of [...library.parts].sort((a,b)=>varietyScore(b)-varietyScore(a))){const ok=!target||p.ports.some(cp=>compatibility(target,cp,rules)),b=document.createElement('button');b.className='partCard';b.disabled=!ok;b.innerHTML=`<b>${p.id}</b><span>${p.name}</span><small>${p.family} · V${varietyScore(p)}</small>`;b.onclick=()=>addPart(p);el.appendChild(b)}}
function renderAssembly(){const el=$('#assemblyList');el.innerHTML='';assembly.forEach((inst,i)=>{const p=instancePart(inst),d=document.createElement('button');d.className='instance'+(inst===selectedInstance?' current':'');d.innerHTML=`<b>${String(i+1).padStart(2,'0')} · ${p.id} · ${inst.seamState}</b><span>${inst.label||p.name}</span><small>${inst.via||'origin'} · ${inst.seamCount||0} seam${inst.seamCount===1?'':'s'} · tax ${(inst.seamTax||0).toFixed(2)}</small>`;d.onclick=()=>{selectedInstance=inst;selectedPort=instancePart(inst).ports.find(x=>!isUsed(inst,x.id))?.id||null;refresh()};el.appendChild(d)})}
function renderTests(){const s=scoreSuite(tasks,library.parts),abl=ablation(tasks,library),ports=library.parts.reduce((n,p)=>n+p.ports.length,0),exact=library.parts.reduce((n,p)=>n+p.ports.filter(x=>x.confidence==='exact').length,0);$('#testSummary').innerHTML=`<div class="metric"><span>CAPABILITY</span><b>${s.got}/${s.total}</b></div><div class="metric"><span>PORTS</span><b>${ports}</b></div><div class="metric"><span>EXACT</span><b>${exact}</b></div>`;const el=$('#tests');el.innerHTML='<div class="testrow head"><b>LOSS</b><b>REMOVE PART → LOST GRAMMAR</b><b>V</b></div>';for(const a of abl){const p=index.get(a.id),r=document.createElement('div');r.className='testrow';r.innerHTML=`<span class="${a.loss?'fail':'pass'}">${a.loss}</span><div><b>${a.id} ${a.name}</b><small>${p.operators.join(' · ')}</small></div><span>${varietyScore(p)}</span>`;el.appendChild(r)}}
function renderLibrary(q=''){q=q.toLowerCase();const el=$('#library');el.innerHTML='';[...library.parts].sort((a,b)=>varietyScore(b)-varietyScore(a)).filter(p=>JSON.stringify(p).toLowerCase().includes(q)).forEach(p=>{const exact=p.ports.filter(x=>x.confidence==='exact').length,r=document.createElement('div');r.className='librow';r.innerHTML=`<b>${p.id}</b><div><b>${p.name}</b><small>${p.operators.join(' · ')}<br>${p.ports.length} ports · ${exact} exact</small></div><span class="badge">V${varietyScore(p)}</span>`;el.appendChild(r)})}
function refresh(){renderPorts();renderParts();renderAssembly();$('#attention').textContent=`seams ${assembly.reduce((n,x)=>n+(x.seamCount||0),0)} · tax ${seamTax(assembly).toFixed(2)}`;$('#vocab').textContent=`vocab ${coverage()}/${library.parts.length}`;renderReal()}

// BUILD PROGRAMS -------------------------------------------------------------
const CHAIR=[
  {key:'seat',root:'3020',color:4,label:'SEAT'},
  {key:'legFL',parent:'seat',port:'bottom-0',part:'3005',childPort:'top',color:1,label:'LEG FRONT LEFT'},
  {key:'legFR',parent:'seat',port:'bottom-3',part:'3005',childPort:'top',color:1,label:'LEG FRONT RIGHT'},
  {key:'legBL',parent:'seat',port:'bottom-4',part:'3005',childPort:'top',color:1,label:'LEG BACK LEFT'},
  {key:'legBR',parent:'seat',port:'bottom-7',part:'3005',childPort:'top',color:1,label:'LEG BACK RIGHT'},
  {key:'backL1',parent:'seat',port:'top-4',part:'3005',childPort:'bottom',color:14,label:'BACK LEFT'},
  {key:'backR1',parent:'seat',port:'top-7',part:'3005',childPort:'bottom',color:14,label:'BACK RIGHT'},
  {key:'backL2',parent:'backL1',port:'top',part:'3005',childPort:'bottom',color:14,label:'BACK LEFT 2'},
  {key:'backR2',parent:'backR1',port:'top',part:'3005',childPort:'bottom',color:14,label:'BACK RIGHT 2'},
  {key:'rail',parent:'backL2',port:'top',part:'3710',childPort:'bottom-0',color:4,label:'BACK RAIL'}
];
const STATION=[
  {key:'deck',root:'3020',color:71,label:'DECK · 2×4 PLATE'},
  {key:'foundation',parent:'deck',port:'bottom-0',part:'3001',childPort:'top-0',color:72,label:'FOUNDATION · MULTI-CLUTCH'},
  {key:'cabin',parent:'deck',port:'top-0',part:'3003',childPort:'bottom-nw',color:14,label:'CABIN · 2×2'},
  {key:'console',parent:'deck',port:'top-2',part:'3004',childPort:'bottom-l',color:4,label:'CONSOLE · 1×2'},
  {key:'sensor',parent:'deck',port:'top-7',part:'87087',childPort:'bottom',color:1,label:'SIDE SENSOR BLOCK'},
  {key:'sensorPanel',parent:'sensor',port:'front',part:'3023',childPort:'bottom-l',color:15,label:'SIDE-FACING PANEL'},
  {key:'roof',parent:'cabin',port:'top-nw',part:'3022',childPort:'bottom-nw',color:71,label:'CABIN ROOF'},
  {key:'jumper',parent:'roof',port:'top-nw',part:'15573',childPort:'bottom-l',color:14,label:'HALF-STUD CENTERING'},
  {key:'mast',parent:'jumper',port:'top-center',part:'3005',childPort:'bottom',color:72,label:'CENTERED MAST'},
  {key:'headlight',parent:'mast',port:'top',part:'4070',childPort:'bottom',color:14,label:'HEADLIGHT OPERATOR'},
  {key:'lamp',parent:'headlight',port:'front',part:'3024',childPort:'bottom',color:4,label:'SIDE LAMP'},
  {key:'crossbar',parent:'headlight',port:'top',part:'3710',childPort:'bottom-1',color:71,label:'SIGNAL CROSSBAR'},
  {key:'bracket',parent:'crossbar',port:'top-2',part:'99780',childPort:'bottom-l',color:1,label:'90° BRACKET'},
  {key:'sign',parent:'bracket',port:'front-l',part:'3023',childPort:'bottom-l',color:15,label:'VERTICAL SIGN'},
  {key:'gatewayA',parent:'console',port:'top-l',part:'3700',childPort:'bottom-l',color:4,label:'TECHNIC GATEWAY A'},
  {key:'pinA',parent:'gatewayA',port:'hole-front',part:'2780',childPort:'a',color:0,label:'PIN · INSERT THROUGH'},
  {key:'cross',parent:'pinA',port:'b',part:'6536',childPort:'pin-front',color:71,label:'CROSS-BLOCK · TURN AXIS 90°'},
  {key:'axle',parent:'cross',port:'axle-right',part:'4519',childPort:'a',color:0,label:'AXLE · PERPENDICULAR BOOM'},
  {key:'bushA',parent:'axle',port:'b',part:'3713',childPort:'axis-front',color:14,label:'BUSH · AXIAL STOP'},
  {key:'gatewayB',parent:'roof',port:'top-sw',part:'3700',childPort:'bottom-l',color:4,label:'TECHNIC GATEWAY B'},
  {key:'adapter',parent:'gatewayB',port:'hole-front',part:'43093',childPort:'pin',color:0,label:'PIN ↔ AXLE ADAPTER'},
  {key:'bushB',parent:'adapter',port:'axle',part:'3713',childPort:'axis-front',color:14,label:'BUSH · END STOP'}
];
function loadPlan(plan,name){resetAssembly();demoPlan=plan;demoCursor=0;demoNodes={};$('#trace').textContent=`${name} · ${plan.length} REAL PARTS · WATCH EVERY SEAM`}
async function stepPlan(){if(!demoPlan||demoCursor>=demoPlan.length)return false;const s=demoPlan[demoCursor];let inst;if(s.root)inst=makeRoot(index.get(s.root),s.color,s.label);else inst=await attach(demoNodes[s.parent],s.port,s.part,s.color,s.label,s.childPort);if(!inst){$('#trace').textContent=`STEP ${demoCursor+1} FAILED · ${s.label}`;return false}demoNodes[s.key]=inst;demoCursor++;await delay(80);return true}
async function playPlan(plan,name){if(demoBusy)return;demoBusy=true;loadPlan(plan,name);$$('#buildActions button').forEach(b=>b.disabled=true);while(demoCursor<demoPlan.length){if(!await stepPlan())break}$$('#buildActions button').forEach(b=>b.disabled=false);demoBusy=false;if(demoCursor===demoPlan.length){const states=assembly.slice(1).reduce((m,x)=>(m[x.seamState]=(m[x.seamState]||0)+1,m),{});$('#trace').textContent=`${name} COMPLETE · ${coverage()}/${library.parts.length} TYPES · ${assembly.reduce((n,x)=>n+(x.seamCount||0),0)} SEAMS · ${Object.entries(states).map(([k,v])=>`${v} ${k}`).join(' · ')}`;flash(`${name} · THE SEAMS ARE THE TEST`)}}

$('#chairBtn').onclick=()=>playPlan(STATION,'SIGNAL STATION');
$('#operatorBtn').onclick=()=>playPlan(CHAIR,'CHAIR');
$('#stepBtn').onclick=async()=>{if(demoBusy)return;if(!demoPlan||demoCursor>=demoPlan.length)loadPlan(STATION,'SIGNAL STATION');await stepPlan()};
$('#resetBtn').onclick=()=>{demoPlan=null;resetAssembly();$('#trace').textContent='EMPTY · BUILD ALL 19'};
$('#undoBtn').onclick=()=>{if(!assembly.length)return;const gone=assembly.pop();if(gone?.parent){const p=assembly.find(x=>x.uid===gone.parent);if(p&&gone.via){const pid=gone.via.split(' ↔ ')[0];p.usedPorts=(p.usedPorts||[]).filter(x=>x!==pid)}}selectedInstance=assembly.at(-1)||null;selectedPort=selectedInstance?instancePart(selectedInstance).ports.find(p=>!isUsed(selectedInstance,p.id))?.id:null;refresh()};
$('#exportBtn').onclick=()=>{if(!assembly.length){flash('BUILD SOMETHING FIRST');return}const text=toLDraw(assembly,index,'AFFORDANCE-BUILD'),blob=new Blob([text],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='affordance-build.mpd';a.click();URL.revokeObjectURL(a.href)};
$('#filter').oninput=e=>renderLibrary(e.target.value);
$$('#tabs button').forEach(b=>b.onclick=()=>{$$('#tabs button').forEach(x=>x.classList.toggle('active',x===b));$$('.panel').forEach(p=>p.classList.remove('activePanel'));$('#'+b.dataset.tab+'Panel').classList.add('activePanel');if(b.dataset.tab==='test')renderTests();if(b.dataset.tab==='library')renderLibrary($('#filter').value)});
renderTests();renderLibrary();refresh();
if(ldrawReady)setTimeout(()=>playPlan(STATION,'SIGNAL STATION'),420);

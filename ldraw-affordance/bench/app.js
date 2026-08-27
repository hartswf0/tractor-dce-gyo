import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import {loadIndex,compatibility,scoreSuite,ablation,varietyScore,bestConnection,toLDraw,seamTax,ID} from '../src/engine.js';

const [library,rules,tasks]=await Promise.all([
  fetch('../library/core.json',{cache:'no-store'}).then(r=>r.json()),
  fetch('../library/compatibility.json').then(r=>r.json()),
  fetch('../tests/task-suite.json').then(r=>r.json())
]);
const index=loadIndex(library);
let assembly=[],selectedInstance=null,selectedPort=null;
let demoPlan=null,demoCursor=0,demoNodes={},demoBusy=false;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
$('#partCount').textContent=`${library.parts.length} parts · API ${library.version}`;

// REAL LDRAW ONLY ------------------------------------------------------------
const host=$('#threeHost');
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.setClearColor(0xf2f1ec,1);renderer.outputColorSpace=THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(36,1,.1,20000);camera.position.set(160,120,190);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.08;
scene.add(new THREE.HemisphereLight(0xffffff,0x777777,2.5));
const key=new THREE.DirectionalLight(0xffffff,2.4);key.position.set(220,300,180);scene.add(key);
const fill=new THREE.DirectionalLight(0xffffff,1.0);fill.position.set(-160,100,-140);scene.add(fill);
const grid=new THREE.GridHelper(260,13,0x999999,0xd1d1cc);grid.visible=false;scene.add(grid);
const loader=new LDrawLoader();loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);loader.setPartsLibraryPath('../../ldraw/');
let ldrawReady=false,modelWrapper=null,renderSerial=0;
function resize(){const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix()}
function animate(){requestAnimationFrame(animate);resize();controls.update();renderer.render(scene,camera)}animate();
function dispose(root){root?.traverse(o=>{o.geometry?.dispose?.();const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];ms.forEach(m=>m?.dispose?.())})}
function clearModel(){if(modelWrapper){scene.remove(modelWrapper);dispose(modelWrapper);modelWrapper=null}grid.visible=false}
function fit(root){
  const box=new THREE.Box3().setFromObject(root);if(box.isEmpty())return;
  const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),d=Math.max(size.x,size.y,size.z,35);
  controls.target.copy(center);camera.position.set(center.x+d*1.35,center.y+d*.95,center.z+d*1.55);
  camera.near=Math.max(.1,d/300);camera.far=Math.max(3000,d*40);camera.updateProjectionMatrix();controls.update();
  grid.position.y=box.min.y-.6;grid.visible=true;
}
function geomStats(root){let meshes=0,triangles=0;root.traverse(o=>{if(o.isMesh&&o.geometry){meshes++;triangles+=o.geometry.index?o.geometry.index.count/3:(o.geometry.attributes.position?.count||0)/3}});return{meshes,triangles:Math.round(triangles)}}
try{
  const probe=await fetch('../../ldraw/LDConfig.ldr',{cache:'no-store'});if(!probe.ok)throw new Error(`LDConfig HTTP ${probe.status}`);
  await loader.preloadMaterials('../../ldraw/LDConfig.ldr');ldrawReady=true;
  $('#geomStatus').textContent='REAL LDRAW READY';$('#viewnote').textContent='Real .dat geometry. The chair will assemble itself.';
}catch(err){console.error('[LDRAW INIT]',err);$('#geomStatus').textContent='LDRAW INIT ERROR';$('#viewnote').textContent=String(err?.message||err)}
function renderReal(){
  const serial=++renderSerial;
  if(!assembly.length){clearModel();$('#geomStatus').textContent=ldrawReady?'REAL LDRAW READY':'LDRAW NOT READY';return Promise.resolve()}
  if(!ldrawReady)return Promise.resolve();
  const mpd=toLDraw(assembly,index,'AFFORDANCE-BUILD');$('#geomStatus').textContent='PARSING REAL .DAT…';
  return new Promise(resolve=>{
    try{
      loader.parse(mpd,group=>{
        if(serial!==renderSerial){dispose(group);resolve();return}
        clearModel();group.rotation.x=Math.PI;modelWrapper=new THREE.Group();modelWrapper.add(group);scene.add(modelWrapper);fit(modelWrapper);
        const s=geomStats(modelWrapper);$('#geomStatus').textContent=`REAL LDRAW · ${assembly.length} PART${assembly.length===1?'':'S'} · ${s.meshes} MESHES`;resolve();
      },err=>{console.error('[LDRAW PARSE]',err);$('#geomStatus').textContent='LDRAW BUILD ERROR';$('#viewnote').textContent=String(err?.message||err);resolve()});
    }catch(err){console.error('[LDRAW PARSE]',err);$('#geomStatus').textContent='LDRAW BUILD ERROR';$('#viewnote').textContent=String(err?.message||err);resolve()}
  })
}

// AFFORDANCE ASSEMBLY --------------------------------------------------------
function instancePart(i){return index.get(i.partId)}
function isUsed(inst,id){return(inst.usedPorts||[]).includes(id)}
function makeRoot(part,color=16,label='root'){
  const inst={uid:crypto.randomUUID(),partId:part.id,t:[0,0,0],r:ID,usedPorts:[],seamTax:0,parent:null,color,label};
  assembly=[inst];selectedInstance=inst;selectedPort=part.ports.find(p=>p.gender==='male')?.id||part.ports[0]?.id;refresh();return inst
}
function attach(parent,portId,partId,color=16,label=''){
  const part=index.get(partId),pp=instancePart(parent).ports.find(p=>p.id===portId);
  if(!part||!pp||isUsed(parent,portId)){flash(`PORT FAIL · ${portId}`);return null}
  const snap=bestConnection(parent,instancePart(parent),portId,part,rules);
  if(!snap){flash(`NO INTERFACE · ${portId} → ${partId}`);return null}
  parent.usedPorts=[...(parent.usedPorts||[]),portId];
  const child={uid:crypto.randomUUID(),partId,t:snap.t,r:snap.r,usedPorts:[snap.childPortId],seamTax:snap.tax,parent:parent.uid,joint:snap.joint,via:`${portId} ↔ ${snap.childPortId}`,color,label};
  assembly.push(child);selectedInstance=child;selectedPort=part.ports.find(p=>!isUsed(child,p.id))?.id||null;refresh();return child
}
function addPart(part){
  if(!assembly.length)return makeRoot(part,16,part.name);
  const parent=selectedInstance||assembly.at(-1);if(!selectedPort){flash('SELECT AN OPEN PORT');return null}
  return attach(parent,selectedPort,part.id,16,part.name)
}
function resetAssembly(){assembly=[];selectedInstance=null;selectedPort=null;demoCursor=0;demoNodes={};refresh()}
function flash(text){const n=$('#viewnote'),old=n.textContent;n.textContent=text;n.classList.add('hot');setTimeout(()=>{n.textContent=old;n.classList.remove('hot')},1200)}
function renderPorts(){
  const el=$('#ports');el.innerHTML='';if(!selectedInstance){el.innerHTML='<span class="emptyHint">Select a real part or run the chair.</span>';return}
  const part=instancePart(selectedInstance);
  for(const port of part.ports){const b=document.createElement('button');b.className='portBtn'+(isUsed(selectedInstance,port.id)?' used':'')+(selectedPort===port.id?' selected':'');b.disabled=isUsed(selectedInstance,port.id);b.innerHTML=`<b>${port.id}</b><small>${port.gender} ${port.type} · ${port.p.join(',')}</small>`;b.onclick=()=>{selectedPort=port.id;renderPorts();renderParts()};el.appendChild(b)}
}
function renderParts(){
  const target=selectedInstance&&selectedPort?instancePart(selectedInstance).ports.find(p=>p.id===selectedPort):null,el=$('#parts');el.innerHTML='';
  for(const p of [...library.parts].sort((a,b)=>varietyScore(b)-varietyScore(a))){
    const ok=!target||p.ports.some(cp=>compatibility(target,cp,rules)),b=document.createElement('button');b.className='partCard';b.disabled=!ok;b.innerHTML=`<b>${p.id}</b><span>${p.name}</span><small>${p.family} · V${varietyScore(p)}</small>`;b.onclick=()=>addPart(p);el.appendChild(b)
  }
}
function renderAssembly(){
  const el=$('#assemblyList');el.innerHTML='';assembly.forEach((inst,i)=>{const p=instancePart(inst),d=document.createElement('button');d.className='instance'+(inst===selectedInstance?' current':'');d.innerHTML=`<b>${String(i+1).padStart(2,'0')} · ${p.id}</b><span>${inst.label||p.name}</span><small>${inst.via||'origin'} · tax ${inst.seamTax.toFixed(2)}</small>`;d.onclick=()=>{selectedInstance=inst;selectedPort=instancePart(inst).ports.find(x=>!isUsed(inst,x.id))?.id||null;refresh()};el.appendChild(d)})
}
function renderTests(){
  const s=scoreSuite(tasks,library.parts),abl=ablation(tasks,library),ports=library.parts.reduce((n,p)=>n+p.ports.length,0),exact=library.parts.reduce((n,p)=>n+p.ports.filter(x=>x.confidence==='exact').length,0);
  $('#testSummary').innerHTML=`<div class="metric"><span>CAPABILITY</span><b>${s.got}/${s.total}</b></div><div class="metric"><span>PORTS</span><b>${ports}</b></div><div class="metric"><span>EXACT</span><b>${exact}</b></div>`;
  const el=$('#tests');el.innerHTML='<div class="testrow head"><b>LOSS</b><b>REMOVE PART → LOST GRAMMAR</b><b>V</b></div>';
  for(const a of abl){const p=index.get(a.id),r=document.createElement('div');r.className='testrow';r.innerHTML=`<span class="${a.loss?'fail':'pass'}">${a.loss}</span><div><b>${a.id} ${a.name}</b><small>${p.operators.join(' · ')}</small></div><span>${varietyScore(p)}</span>`;el.appendChild(r)}
}
function renderLibrary(q=''){
  q=q.toLowerCase();const el=$('#library');el.innerHTML='';[...library.parts].sort((a,b)=>varietyScore(b)-varietyScore(a)).filter(p=>JSON.stringify(p).toLowerCase().includes(q)).forEach(p=>{const exact=p.ports.filter(x=>x.confidence==='exact').length,r=document.createElement('div');r.className='librow';r.innerHTML=`<b>${p.id}</b><div><b>${p.name}</b><small>${p.operators.join(' · ')}<br>${p.ports.length} ports · ${exact} exact</small></div><span class="badge">V${varietyScore(p)}</span>`;el.appendChild(r)})
}
function refresh(){renderPorts();renderParts();renderAssembly();$('#attention').textContent=`tax ${seamTax(assembly).toFixed(2)}`;renderReal()}

// VISIBLE BUILD PROGRAMS -----------------------------------------------------
const CHAIR=[
  {key:'seat',root:'3020',color:4,label:'SEAT · 2×4 PLATE'},
  {key:'legFL',parent:'seat',port:'bottom-0',part:'3005',color:1,label:'LEG · FRONT LEFT'},
  {key:'legFR',parent:'seat',port:'bottom-3',part:'3005',color:1,label:'LEG · FRONT RIGHT'},
  {key:'legBL',parent:'seat',port:'bottom-4',part:'3005',color:1,label:'LEG · BACK LEFT'},
  {key:'legBR',parent:'seat',port:'bottom-7',part:'3005',color:1,label:'LEG · BACK RIGHT'},
  {key:'backL1',parent:'seat',port:'top-4',part:'3005',color:14,label:'BACK POST · LEFT 1'},
  {key:'backR1',parent:'seat',port:'top-7',part:'3005',color:14,label:'BACK POST · RIGHT 1'},
  {key:'backL2',parent:'backL1',port:'top',part:'3005',color:14,label:'BACK POST · LEFT 2'},
  {key:'backR2',parent:'backR1',port:'top',part:'3005',color:14,label:'BACK POST · RIGHT 2'},
  {key:'rail',parent:'backL2',port:'top',part:'3710',color:4,label:'BACK RAIL · 1×4 PLATE'}
];
const OPERATOR=[
  {key:'base',root:'3700',color:4,label:'SYSTEM ↔ TECHNIC GATEWAY'},
  {key:'snot',parent:'base',port:'top-l',part:'4070',color:14,label:'TURN BUILD PLANE 90°'},
  {key:'side',parent:'snot',port:'front',part:'3024',color:1,label:'SIDEWAYS PLATE'},
  {key:'pin',parent:'base',port:'hole-front',part:'2780',color:0,label:'TECHNIC PIN'}
];
function loadPlan(plan,name){resetAssembly();demoPlan=plan;demoCursor=0;demoNodes={};$('#trace').textContent=`${name} · READY · ${plan.length} REAL PARTS`}
async function stepPlan(){
  if(!demoPlan||demoCursor>=demoPlan.length)return false;
  const s=demoPlan[demoCursor];let inst;
  if(s.root)inst=makeRoot(index.get(s.root),s.color,s.label);else inst=attach(demoNodes[s.parent],s.port,s.part,s.color,s.label);
  if(!inst){$('#trace').textContent=`STEP ${demoCursor+1} FAILED · ${s.label}`;return false}
  demoNodes[s.key]=inst;demoCursor++;$('#trace').textContent=`STEP ${demoCursor}/${demoPlan.length} · ${s.label} · ${instancePart(inst).file}`;
  await new Promise(r=>setTimeout(r,650));return true
}
async function playPlan(plan,name){
  if(demoBusy)return;demoBusy=true;loadPlan(plan,name);$$('#buildActions button').forEach(b=>b.disabled=true);
  while(demoCursor<demoPlan.length){if(!await stepPlan())break}
  $$('#buildActions button').forEach(b=>b.disabled=false);demoBusy=false;
  if(demoCursor===demoPlan.length){$('#trace').textContent=`${name} COMPLETE · ${assembly.length} REAL LDRAW PARTS · TAX ${seamTax(assembly).toFixed(2)}`;flash(`${name} BUILT FROM PORTS, NOT PROXY GEOMETRY`)}
}

$('#chairBtn').onclick=()=>playPlan(CHAIR,'CHAIR');
$('#operatorBtn').onclick=()=>playPlan(OPERATOR,'OPERATOR TEST');
$('#stepBtn').onclick=async()=>{if(demoBusy)return;if(!demoPlan||demoCursor>=demoPlan.length)loadPlan(CHAIR,'CHAIR');await stepPlan()};
$('#resetBtn').onclick=()=>{demoPlan=null;resetAssembly();$('#trace').textContent='EMPTY · CHOOSE BUILD CHAIR'};
$('#undoBtn').onclick=()=>{if(!assembly.length)return;const gone=assembly.pop();if(gone?.parent){const p=assembly.find(x=>x.uid===gone.parent);if(p&&gone.via){const pid=gone.via.split(' ↔ ')[0];p.usedPorts=(p.usedPorts||[]).filter(x=>x!==pid)}}selectedInstance=assembly.at(-1)||null;selectedPort=selectedInstance?instancePart(selectedInstance).ports.find(p=>!isUsed(selectedInstance,p.id))?.id:null;renderPorts();renderParts();renderAssembly();$('#attention').textContent=`tax ${seamTax(assembly).toFixed(2)}`;renderReal()};
$('#exportBtn').onclick=()=>{if(!assembly.length){flash('BUILD SOMETHING FIRST');return}const text=toLDraw(assembly,index,'AFFORDANCE-BUILD'),blob=new Blob([text],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='affordance-build.mpd';a.click();URL.revokeObjectURL(a.href)};
$('#filter').oninput=e=>renderLibrary(e.target.value);
$$('#tabs button').forEach(b=>b.onclick=()=>{$$('#tabs button').forEach(x=>x.classList.toggle('active',x===b));$$('.panel').forEach(p=>p.classList.remove('activePanel'));$('#'+b.dataset.tab+'Panel').classList.add('activePanel');if(b.dataset.tab==='test')renderTests();if(b.dataset.tab==='library')renderLibrary($('#filter').value)});
renderTests();renderLibrary();refresh();

// First load should prove the system without requiring the user to hunt for a control.
if(ldrawReady)setTimeout(()=>playPlan(CHAIR,'CHAIR'),450);

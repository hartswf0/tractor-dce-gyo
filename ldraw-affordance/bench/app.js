import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import {loadIndex,compatibility,scoreSuite,ablation,varietyScore,bestConnection,toLDraw,seamTax,ID} from '../src/engine.js';

const [library,rules,tasks]=await Promise.all([
  fetch('../library/core.json').then(r=>r.json()),
  fetch('../library/compatibility.json').then(r=>r.json()),
  fetch('../tests/task-suite.json').then(r=>r.json())
]);
const index=loadIndex(library);
let assembly=[], selectedInstance=null, selectedPort=null;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
$('#partCount').textContent=`${library.parts.length} parts`;

// ONE MATCHED LDRAW STACK: Three r180 + its loader + its conditional-line material.
const host=$('#threeHost');
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.setClearColor(0xe8e8e3,1);
renderer.outputColorSpace=THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(38,1,0.1,20000);
camera.position.set(180,140,220);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;
controls.dampingFactor=.08;
scene.add(new THREE.HemisphereLight(0xffffff,0x777777,2.4));
const key=new THREE.DirectionalLight(0xffffff,2.6);key.position.set(220,320,180);scene.add(key);
const fill=new THREE.DirectionalLight(0xffffff,1.0);fill.position.set(-180,160,-140);scene.add(fill);
const grid=new THREE.GridHelper(500,25,0x777777,0xbbbbbb);scene.add(grid);

const loader=new LDrawLoader();
loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
loader.setPartsLibraryPath('../../ldraw/');
let ldrawReady=false, modelWrapper=null, renderTimer=null, renderSerial=0;

function resize(){
  const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
function animate(){requestAnimationFrame(animate);resize();controls.update();renderer.render(scene,camera)}
animate();

function dispose(root){
  if(!root)return;
  root.traverse(o=>{
    o.geometry?.dispose?.();
    const mats=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];
    mats.forEach(m=>m?.dispose?.());
  });
}
function clearModel(){
  if(modelWrapper){scene.remove(modelWrapper);dispose(modelWrapper);modelWrapper=null}
}
function fit(root){
  const box=new THREE.Box3().setFromObject(root);if(box.isEmpty())return;
  const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const d=Math.max(size.x,size.y,size.z,20);
  controls.target.copy(center);
  camera.position.copy(center).add(new THREE.Vector3(d*1.55,d*1.15,d*1.7));
  camera.near=Math.max(.1,d/300);camera.far=Math.max(4000,d*50);camera.updateProjectionMatrix();controls.update();
}
function stats(root){let meshes=0,triangles=0;root.traverse(o=>{if(o.isMesh&&o.geometry){meshes++;triangles+=o.geometry.index?o.geometry.index.count/3:(o.geometry.attributes.position?.count||0)/3}});return{meshes,triangles:Math.round(triangles)}}

try{
  const probe=await fetch('../../ldraw/LDConfig.ldr',{cache:'no-store'});
  if(!probe.ok)throw new Error(`LDConfig HTTP ${probe.status}`);
  await loader.preloadMaterials('../../ldraw/LDConfig.ldr');
  ldrawReady=true;
  $('#geomStatus').textContent='REAL LDRAW READY';
  $('#viewnote').textContent='LDConfig + conditional lines loaded. RUN BENCH.';
}catch(err){
  console.error('[LDRAW INIT]',err);
  $('#geomStatus').textContent='LDRAW INIT ERROR';
  $('#viewnote').textContent=String(err?.message||err);
}

function renderReal(){
  clearTimeout(renderTimer);const serial=++renderSerial;
  if(!assembly.length){clearModel();$('#geomStatus').textContent=ldrawReady?'REAL LDRAW READY':'LDRAW NOT READY';return}
  if(!ldrawReady)return;
  renderTimer=setTimeout(()=>{
    const mpd=toLDraw(assembly,index,'AFFORDANCE-BUILD');
    $('#geomStatus').textContent='LOADING REAL .DAT PARTS…';
    loader.parse(mpd,group=>{
      if(serial!==renderSerial){dispose(group);return}
      clearModel();
      group.rotation.x=Math.PI;
      modelWrapper=new THREE.Group();modelWrapper.add(group);scene.add(modelWrapper);fit(modelWrapper);
      const s=stats(modelWrapper);
      $('#geomStatus').textContent=`REAL LDRAW · ${assembly.length} PART${assembly.length===1?'':'S'} · ${s.meshes} MESHES`;
      $('#viewnote').textContent='This geometry was parsed from the same MPD exported below, using real LDraw .dat files.';
    },err=>{
      console.error('[LDRAW PARSE]',err);
      $('#geomStatus').textContent='LDRAW BUILD ERROR';
      $('#viewnote').textContent=String(err?.message||err);
    });
  },40);
}

function instancePart(i){return index.get(i.partId)}
function isUsed(inst,portId){return(inst.usedPorts||[]).includes(portId)}
function addRoot(part){assembly=[{uid:crypto.randomUUID(),partId:part.id,t:[0,0,0],r:ID,usedPorts:[],seamTax:0,parent:null}];selectedInstance=assembly[0];selectedPort=part.ports.find(p=>p.gender==='male')?.id||part.ports[0]?.id;refresh()}
function addPart(part){
  if(!assembly.length){addRoot(part);return}
  const parent=selectedInstance||assembly[assembly.length-1],pp=instancePart(parent).ports.find(p=>p.id===selectedPort);
  if(!pp||isUsed(parent,pp.id)){flash('SELECT AN OPEN PORT');return}
  const snap=bestConnection(parent,instancePart(parent),pp.id,part,rules);
  if(!snap){flash('NO DIRECT INTERFACE — ADAPTER REQUIRED');return}
  parent.usedPorts=[...(parent.usedPorts||[]),pp.id];
  const child={uid:crypto.randomUUID(),partId:part.id,t:snap.t,r:snap.r,usedPorts:[snap.childPortId],seamTax:snap.tax,parent:parent.uid,joint:snap.joint,via:`${pp.id} ↔ ${snap.childPortId}`};
  assembly.push(child);selectedInstance=child;selectedPort=part.ports.find(p=>!child.usedPorts.includes(p.id))?.id||null;refresh();
}
function flash(text){const n=$('#viewnote'),old=n.textContent;n.textContent=text;n.style.background='var(--hot)';setTimeout(()=>{n.textContent=old;n.style.background='#fff'},1100)}
function renderParts(){
  const target=selectedInstance&&selectedPort?instancePart(selectedInstance).ports.find(p=>p.id===selectedPort):null;
  $('#parts').innerHTML='';
  for(const p of [...library.parts].sort((a,b)=>varietyScore(b)-varietyScore(a))){
    const ok=!target||p.ports.some(cp=>compatibility(target,cp,rules));
    const b=document.createElement('button');b.className='partCard';b.disabled=!ok;b.innerHTML=`<b>${p.id}</b>${p.name}<small>${p.family} · V${varietyScore(p)} · ${p.file}</small>`;b.onclick=()=>addPart(p);$('#parts').appendChild(b)
  }
}
function renderPorts(){
  const el=$('#ports');el.innerHTML='';if(!selectedInstance){el.innerHTML='<button>CHOOSE ANY REAL LDRAW PART</button>';return}
  const p=instancePart(selectedInstance);
  for(const port of p.ports){const b=document.createElement('button');b.className='portBtn'+(isUsed(selectedInstance,port.id)?' used':'')+(selectedPort===port.id?' selected':'');b.disabled=isUsed(selectedInstance,port.id);b.innerHTML=`${port.id}<small>${port.gender} ${port.type} · ${port.confidence}</small>`;b.onclick=()=>{selectedPort=port.id;renderPorts();renderParts()};el.appendChild(b)}
}
function renderAssembly(){
  const el=$('#assemblyList');el.innerHTML='';assembly.forEach((inst,i)=>{const p=instancePart(inst),d=document.createElement('div');d.className='instance';d.innerHTML=`<button>${i===0?'ROOT':'SELECT'}</button><div><b>${p.id} ${p.name}</b><div class="ops">${p.file} · ${inst.via||'origin'} · ${inst.joint||'free'}</div></div><span class="tax">${inst.seamTax?inst.seamTax.toFixed(2):'0.00'}</span>`;d.querySelector('button').onclick=()=>{selectedInstance=inst;selectedPort=instancePart(inst).ports.find(p=>!isUsed(inst,p.id))?.id||null;refresh()};el.appendChild(d)})
}
function renderTests(){
  const s=scoreSuite(tasks,library.parts),abl=ablation(tasks,library);$('#testSummary').innerHTML=`<div class="metric"><span>CAPABILITY</span><b>${s.got}/${s.total}</b></div><div class="metric"><span>PARTS</span><b>${library.parts.length}</b></div><div class="metric"><span>TOP ABLATION</span><b>${abl[0]?.loss||0}</b></div>`;
  const el=$('#tests');el.innerHTML='<div class="testrow"><b>LOSS</b><b>ABLATION / WHAT COLLAPSES IF REMOVED</b><b>V</b></div>';for(const a of abl){const p=index.get(a.id),r=document.createElement('div');r.className='testrow';r.innerHTML=`<span class="${a.loss?'fail':'pass'}">${a.loss}</span><div><b>${a.id} ${a.name}</b><div class="ops">${p.operators.join(' · ')}</div></div><span>${varietyScore(p)}</span>`;el.appendChild(r)}
}
function renderLibrary(q=''){q=q.toLowerCase();const el=$('#library');el.innerHTML='';[...library.parts].sort((a,b)=>varietyScore(b)-varietyScore(a)).filter(p=>JSON.stringify(p).toLowerCase().includes(q)).forEach(p=>{const r=document.createElement('div');r.className='librow';r.innerHTML=`<b>${p.id}</b><div><b>${p.name}</b><div class="ops">${p.file}<br>${p.operators.join(' · ')}<br>${p.ports.map(x=>`${x.gender} ${x.type}:${x.id}`).join(' · ')}</div></div><span class="badge">V ${varietyScore(p)}</span>`;el.appendChild(r)})}
function refresh(){renderPorts();renderParts();renderAssembly();$('#attention').textContent=`tax ${seamTax(assembly).toFixed(2)}`;renderReal()}

$('#filter').oninput=e=>renderLibrary(e.target.value);
$('#resetBtn').onclick=()=>{assembly=[];selectedInstance=null;selectedPort=null;refresh()};
$('#undoBtn').onclick=()=>{if(!assembly.length)return;const gone=assembly.pop();if(gone?.parent){const p=assembly.find(x=>x.uid===gone.parent);if(p&&gone.via){const pid=gone.via.split(' ↔ ')[0];p.usedPorts=(p.usedPorts||[]).filter(x=>x!==pid)}}selectedInstance=assembly.at(-1)||null;selectedPort=selectedInstance?instancePart(selectedInstance).ports.find(p=>!isUsed(selectedInstance,p.id))?.id:null;refresh()};
$('#exportBtn').onclick=()=>{if(!assembly.length){flash('BUILD SOMETHING FIRST');return}const text=toLDraw(assembly,index,'AFFORDANCE-BUILD'),blob=new Blob([text],{type:'text/plain'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='affordance-build.mpd';a.click();URL.revokeObjectURL(a.href)};
function connect(parent,portId,partId){selectedInstance=parent;selectedPort=portId;addPart(index.get(partId));return selectedInstance}
$('#benchBtn').onclick=()=>{addRoot(index.get('3005'));const gateway=connect(assembly[0],'top','3700');const snot=connect(gateway,'top','4070');connect(snot,'front','3024');selectedInstance=gateway;selectedPort='hole';addPart(index.get('2780'));flash('REAL BUILD: 3005 → 3700 → 4070 → SIDE 3024 + 2780 PIN')};
$$('#tabs button').forEach(b=>b.onclick=()=>{$$('#tabs button').forEach(x=>x.classList.toggle('active',x===b));$$('.panel').forEach(p=>p.classList.remove('activePanel'));$('#'+b.dataset.tab+'Panel').classList.add('activePanel');if(b.dataset.tab==='test')renderTests();if(b.dataset.tab==='library')renderLibrary($('#filter').value)});
renderTests();renderLibrary();refresh();

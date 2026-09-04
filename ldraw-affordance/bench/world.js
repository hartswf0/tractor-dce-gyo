import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LDrawLoader } from 'three/addons/loaders/LDrawLoader.js';
import { LDrawConditionalLineMaterial } from 'three/addons/materials/LDrawConditionalLineMaterial.js';
import {toLDraw,seamLeakSeries,seamTax,ID} from '../src/engine.js';

const [core,programs]=await Promise.all([
  fetch('../library/core.json',{cache:'no-store'}).then(r=>r.json()),
  fetch('./world-builds.json',{cache:'no-store'}).then(r=>r.json())
]);
const worldParts=programs.ids.map(id=>({id,file:`${id}.dat`,name:id,family:'world-chunk',dims:[80,80,80],ports:[],operators:['WORLD_CHUNK'],tags:['world-chunk']}));
const allParts=[...core.parts,...worldParts];
const index=new Map(allParts.map(p=>[p.id,p]));
const worldIds=new Set(programs.ids);
const builds=programs.builds.map(([id,title,purpose,truth,steps])=>({id,title,purpose,truth,clickTest:'Relations are truth-labelled per step. Visual adjacency is never promoted to a click.',parts:steps.map(([part,x,y,z,color,stepTruth,tax])=>({part,t:[x,y,z],r:ID,color,truth:stepTruth,tax,relation:stepTruth}))}));
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
let assembly=[],activeBuild=0,stepCursor=0,busy=false,renderSerial=0,modelWrapper=null,ldrawReady=false;
const coveredGlobal=new Set();

$('#partCount').textContent=`${worldParts.length} WORLD CHUNKS`;
$('#buildCount').textContent=`${builds.length} BUILDS`;
const select=$('#worldSelect');
select.innerHTML=builds.map((b,i)=>`<option value="${i}">${String(i+1).padStart(2,'0')} · ${b.title}</option>`).join('');
select.onchange=()=>{activeBuild=Number(select.value);loadBuild(activeBuild)};

const host=$('#threeHost');
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.setClearColor(0xf2f1ec,1);
renderer.outputColorSpace=THREE.SRGBColorSpace;
host.appendChild(renderer.domElement);
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(36,1,.1,50000);
camera.position.set(300,220,340);
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true;controls.dampingFactor=.08;
scene.add(new THREE.HemisphereLight(0xffffff,0x777777,2.5));
const key=new THREE.DirectionalLight(0xffffff,2.5);key.position.set(240,320,180);scene.add(key);
const fill=new THREE.DirectionalLight(0xffffff,1.1);fill.position.set(-180,120,-140);scene.add(fill);
const grid=new THREE.GridHelper(1200,30,0x999999,0xd1d1cc);scene.add(grid);
const loader=new LDrawLoader();
loader.setConditionalLineMaterial(LDrawConditionalLineMaterial);
loader.setPartsLibraryPath('../../ldraw/');

function resize(){
  const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
}
function animate(){requestAnimationFrame(animate);resize();controls.update();renderer.render(scene,camera)}animate();
function dispose(root){root?.traverse(o=>{o.geometry?.dispose?.();const ms=o.material?(Array.isArray(o.material)?o.material:[o.material]):[];ms.forEach(m=>m?.dispose?.())})}
function clearModel(){if(modelWrapper){scene.remove(modelWrapper);dispose(modelWrapper);modelWrapper=null}}
function fit(root){
  const box=new THREE.Box3().setFromObject(root);if(box.isEmpty())return;
  const size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),d=Math.max(size.x,size.y,size.z,60);
  controls.target.copy(center);camera.position.set(center.x+d*1.25,center.y+d*.85,center.z+d*1.5);
  camera.near=Math.max(.1,d/400);camera.far=Math.max(5000,d*60);camera.updateProjectionMatrix();controls.update();
  grid.position.y=box.min.y-.6;
}
function geomStats(root){let meshes=0,triangles=0;root.traverse(o=>{if(o.isMesh&&o.geometry){meshes++;triangles+=o.geometry.index?o.geometry.index.count/3:(o.geometry.attributes.position?.count||0)/3}});return{meshes,triangles:Math.round(triangles)}}
try{
  const probe=await fetch('../../ldraw/LDConfig.ldr',{cache:'no-store'});
  if(!probe.ok)throw new Error(`LDConfig HTTP ${probe.status}`);
  await loader.preloadMaterials('../../ldraw/LDConfig.ldr');
  ldrawReady=true;$('#geomStatus').textContent='REAL LDRAW READY';
}catch(err){console.error(err);$('#geomStatus').textContent='LDRAW INIT ERROR';$('#trace').textContent=String(err?.message||err)}

function renderReal(){
  const serial=++renderSerial;
  if(!assembly.length){clearModel();return Promise.resolve()}
  if(!ldrawReady)return Promise.resolve();
  const mpd=toLDraw(assembly,index,'WORLD-BUILD');
  $('#geomStatus').textContent='PARSING OFFICIAL .DAT…';
  return new Promise(resolve=>{
    try{
      loader.parse(mpd,group=>{
        if(serial!==renderSerial){dispose(group);resolve();return}
        clearModel();
        modelWrapper=new THREE.Group();modelWrapper.rotation.x=Math.PI;modelWrapper.add(group);scene.add(modelWrapper);fit(modelWrapper);
        const s=geomStats(group);$('#geomStatus').textContent=`REAL LDRAW · ${assembly.length} PARTS · ${s.meshes} MESHES`;
        resolve();
      },err=>{console.error(err);$('#geomStatus').textContent='LDRAW BUILD ERROR';$('#trace').textContent=String(err?.message||err);resolve()});
    }catch(err){console.error(err);$('#geomStatus').textContent='LDRAW BUILD ERROR';resolve()}
  });
}

const delay=ms=>new Promise(r=>setTimeout(r,ms));
function truthClass(t){
  if(/NATIVE|GRID|INTERNAL/.test(t))return 'solved';
  if(/INTRINSIC|FAMILY/.test(t))return 'partial';
  if(/ADAPTER|OPEN|AUDIT/.test(t))return 'open';
  return 'partial';
}
function makeInstance(step,i){
  const p=index.get(step.part);
  if(!p)throw new Error(`Missing library record ${step.part}`);
  return {
    uid:crypto.randomUUID(),partId:step.part,t:[...(step.t||[0,0,0])],r:step.r||ID,usedPorts:[],
    seamTax:Number(step.tax||0),parent:i?assembly[0]?.uid:null,color:Number.isFinite(step.color)?step.color:16,
    label:step.label||p.name,seamState:step.truth||'PLACED',seamCount:i?1:0,
    joint:`WORLD:${step.truth||'PLACED'}`,leakKey:`WORLD:${step.truth||'PLACED'}`,
    via:step.relation||'world placement'
  };
}
async function stepBuild(){
  const build=builds[activeBuild];
  if(stepCursor>=build.parts.length)return false;
  const s=build.parts[stepCursor],inst=makeInstance(s,stepCursor);
  const final=[...inst.t];
  if(stepCursor){inst.t=[final[0],final[1]-40,final[2]];inst.seamState='APPROACH'}
  assembly.push(inst);
  if(worldIds.has(inst.partId))coveredGlobal.add(inst.partId);
  renderUI();await renderReal();
  if(stepCursor){await delay(180);inst.t=final;inst.seamState=s.truth||'PLACED';renderUI();await renderReal()}
  stepCursor++;
  const p=index.get(inst.partId);
  $('#trace').textContent=`${build.title} · ${stepCursor}/${build.parts.length} · ${p.name} · ${inst.seamState} · ${s.relation||''}`;
  return true;
}
function loadBuild(i){
  activeBuild=i;select.value=String(i);assembly=[];stepCursor=0;
  const b=builds[i];
  $('#buildTitle').textContent=b.title;$('#buildPurpose').textContent=b.purpose;$('#truth').textContent=b.truth;
  $('#trace').textContent=`${b.id} · ${b.clickTest}`;renderUI();renderReal();
}
async function playBuild(){
  if(busy)return;busy=true;setControls(true);
  while(await stepBuild())await delay(80);
  setControls(false);busy=false;
  const b=builds[activeBuild];
  $('#trace').textContent=`${b.title} COMPLETE · ${assembly.filter(x=>worldIds.has(x.partId)).length} CHUNKS · LEAK ${seamTax(assembly,.15).toFixed(3)}`;
}
async function playAll(){
  if(busy)return;busy=true;setControls(true);coveredGlobal.clear();
  for(let i=0;i<builds.length;i++){activeBuild=i;loadBuild(i);while(await stepBuild())await delay(45);await delay(280)}
  setControls(false);busy=false;
  $('#trace').textContent=`ALL BUILDS COMPLETE · ${coveredGlobal.size}/${worldParts.length} WORLD CHUNKS USED`;
}
function setControls(disabled){$$('#controls button,#worldSelect').forEach(x=>x.disabled=disabled)}
function nextBuild(){activeBuild=(activeBuild+1)%builds.length;loadBuild(activeBuild)}
function previousBuild(){activeBuild=(activeBuild-1+builds.length)%builds.length;loadBuild(activeBuild)}
function renderUI(){
  $('#assembly').innerHTML=assembly.map((x,i)=>{
    const p=index.get(x.partId),cls=truthClass(x.seamState);
    return `<button class="instance ${cls}"><b>${String(i+1).padStart(2,'0')} · ${x.partId}</b><span>${p?.name||x.partId}</span><small>${x.seamState} · tax ${(x.seamTax||0).toFixed(2)}</small></button>`;
  }).join('');
  const local=new Set(assembly.filter(x=>worldIds.has(x.partId)).map(x=>x.partId));
  $('#coverage').textContent=`scene ${local.size} · run ${coveredGlobal.size}/${worldParts.length}`;
  const leak=seamLeakSeries(assembly,.15);$('#attention').textContent=`leak ${leak.reduce((s,x)=>s+x.effectiveLeak,0).toFixed(3)}`;
  renderCoverage();
}
function renderCoverage(){
  const build=builds[activeBuild],ids=new Set(build.parts.map(x=>x.part));
  $('#coverageList').innerHTML=worldParts.map(p=>{
    const inBuild=ids.has(p.id),seen=coveredGlobal.has(p.id),used=assembly.some(x=>x.partId===p.id);
    return `<button class="chunk ${used?'used':seen?'seen':inBuild?'queued':''}" data-id="${p.id}"><b>${p.id}</b><span>WORLD_CHUNK</span><small>${p.name}</small></button>`;
  }).join('');
  $$('#coverageList .chunk').forEach(btn=>btn.onclick=()=>{const id=btn.dataset.id,idx=builds.findIndex(b=>b.parts.some(x=>x.part===id));if(idx>=0){activeBuild=idx;loadBuild(idx)}});
}
function exportMpd(){
  if(!assembly.length)return;
  const b=builds[activeBuild],text=toLDraw(assembly,index,b.id),blob=new Blob([text],{type:'text/plain'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download=`${b.id.toLowerCase()}.mpd`;a.click();URL.revokeObjectURL(a.href);
}

$('#playBtn').onclick=playBuild;
$('#stepBtn').onclick=stepBuild;
$('#nextBtn').onclick=nextBuild;
$('#prevBtn').onclick=previousBuild;
$('#allBtn').onclick=playAll;
$('#resetBtn').onclick=()=>loadBuild(activeBuild);
$('#exportBtn').onclick=exportMpd;
loadBuild(0);
if(ldrawReady)setTimeout(playBuild,350);
